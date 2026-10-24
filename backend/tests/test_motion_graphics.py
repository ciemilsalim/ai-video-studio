import os
import shutil
import tempfile
import subprocess
from pathlib import Path
import pytest
from PIL import Image
import cv2
from fastapi.testclient import TestClient

from app.main import app
from app.models.project import VideoProject, Scene, MotionOverlay
from app.services.storage_service import storage_service
from app.services.motion_graphics_service import (
    motion_graphics_service,
    MotionGraphicsValidationError,
    MotionGraphicsError
)
from app.services.assembly_service import assembly_service
from app.config import resolve_ffmpeg_binary

client = TestClient(app)

@pytest.fixture
def temp_test_env():
    temp_dir = Path(tempfile.mkdtemp(prefix="mgo_test_env_"))
    ffmpeg_bin = resolve_ffmpeg_binary()
    assert ffmpeg_bin and os.path.exists(ffmpeg_bin), "FFmpeg must be available for tests"

    # Create a small 2-second vertical base video with audio (1080x1920, 30fps)
    base_vid = temp_dir / "base_vertical.mp4"
    cmd = [
        ffmpeg_bin, "-y",
        "-f", "lavfi", "-i", "color=color=0x0b1120:size=1080x1920:rate=30",
        "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000",
        "-t", "2.0",
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "128k",
        str(base_vid)
    ]
    subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True, timeout=25)

    yield {
        "dir": temp_dir,
        "ffmpeg": ffmpeg_bin,
        "base_vid": base_vid
    }

    shutil.rmtree(temp_dir, ignore_errors=True)

def test_overlay_schema_and_template_catalog():
    templates = motion_graphics_service.get_available_templates()
    assert len(templates) == 4
    tmpl_ids = {t["template_id"] for t in templates}
    assert tmpl_ids == {"kinetic_title", "stat_card", "timeline_event", "investigation_hud"}

    # Test via API
    res = client.get("/api/motion-graphics/templates")
    assert res.status_code == 200
    assert len(res.json()) == 4

def test_rejection_of_zero_or_negative_duration():
    # 1. Negative duration in model validation
    with pytest.raises(Exception): # Pydantic ValidationError gt=0.0
        MotionOverlay(
            overlay_id="ovl-test",
            scene_id="sc-1",
            template_id="kinetic_title",
            duration=0.0
        )

    with pytest.raises(Exception):
        MotionOverlay(
            overlay_id="ovl-test",
            scene_id="sc-1",
            template_id="kinetic_title",
            duration=-2.5
        )

def test_start_time_and_duration_validation_against_scene():
    ovl_neg_start = MotionOverlay(
        overlay_id="ovl-1",
        scene_id="sc-1",
        template_id="kinetic_title",
        start_time=0.0, # valid in model, but if negative tested in service
        duration=3.0,
        content={"title": "Test Title"}
    )
    ovl_neg_start.start_time = -1.0 # bypass model to test service guard
    with pytest.raises(MotionGraphicsValidationError, match="tidak boleh negatif"):
        motion_graphics_service.validate_overlay(ovl_neg_start, scene_duration=5.0)

    # start_time >= scene_duration
    ovl_late = MotionOverlay(
        overlay_id="ovl-2",
        scene_id="sc-1",
        template_id="kinetic_title",
        start_time=6.0,
        duration=2.0,
        content={"title": "Test Title"}
    )
    with pytest.raises(MotionGraphicsValidationError, match="melampaui total durasi adegan"):
        motion_graphics_service.validate_overlay(ovl_late, scene_duration=5.0)

def test_template_content_validation_and_truthful_source():
    # 1. Missing title in kinetic_title
    ovl_empty_title = MotionOverlay(
        overlay_id="ovl-3",
        scene_id="sc-1",
        template_id="kinetic_title",
        content={"title": ""}
    )
    with pytest.raises(MotionGraphicsValidationError, match="Kolom konten 'title' wajib diisi"):
        motion_graphics_service.validate_overlay(ovl_empty_title, scene_duration=4.0)

    # 2. Missing value in stat_card
    ovl_empty_val = MotionOverlay(
        overlay_id="ovl-4",
        scene_id="sc-1",
        template_id="stat_card",
        content={"value": "", "label": "Anomali"}
    )
    with pytest.raises(MotionGraphicsValidationError, match="Kolom konten 'value' wajib diisi"):
        motion_graphics_service.validate_overlay(ovl_empty_val, scene_duration=4.0)

    # 3. Truth in data: when stat_card has no source, frame outputs "BELUM DICANTUMKAN"
    img = motion_graphics_service.render_overlay_frame(
        template_id="stat_card",
        content={"value": "99%", "label": "Probabilitas Data", "source": ""},
        position="center",
        animation_in="fade",
        animation_out="fade",
        t=1.0,
        duration=3.0
    )
    assert isinstance(img, Image.Image)
    assert img.mode == "RGBA"
    assert img.size == (1080, 1920)

def test_render_transparent_overlay_frame_and_animation():
    # Render at t=0.0 (near transparent during ease-in)
    img_start = motion_graphics_service.render_overlay_frame(
        template_id="kinetic_title",
        content={"title": "ANALISIS AWAL", "tag": "KASUS #01"},
        position="center",
        animation_in="fade",
        animation_out="fade",
        t=0.05,
        duration=3.0
    )

    # Render at t=1.5 (full sustain opacity)
    img_mid = motion_graphics_service.render_overlay_frame(
        template_id="kinetic_title",
        content={"title": "ANALISIS AWAL", "tag": "KASUS #01"},
        position="center",
        animation_in="fade",
        animation_out="fade",
        t=1.5,
        duration=3.0
    )

    assert img_start.mode == "RGBA"
    assert img_mid.mode == "RGBA"
    # Prove pixel variation over time (true animation)
    assert img_start.tobytes() != img_mid.tobytes()

    # Investigation HUD: REC dot blinks over time
    hud_f1 = motion_graphics_service.render_overlay_frame(
        template_id="investigation_hud",
        content={"coordinates_or_location": "Sektor A", "evidence_code": "EV-01"},
        position="center",
        animation_in="fade",
        animation_out="fade",
        t=0.6,
        duration=3.0
    )
    hud_f2 = motion_graphics_service.render_overlay_frame(
        template_id="investigation_hud",
        content={"coordinates_or_location": "Sektor A", "evidence_code": "EV-01"},
        position="center",
        animation_in="fade",
        animation_out="fade",
        t=1.1,
        duration=3.0
    )
    assert hud_f1.tobytes() != hud_f2.tobytes()

def test_preview_api_endpoint():
    res = client.get("/api/motion-graphics/preview?template_id=stat_card&value=1200&label=Temuan+Baru&t=1.0")
    assert res.status_code == 200
    assert res.headers["content-type"] == "image/png"
    assert len(res.content) > 1000

def test_scene_overlay_crud_api():
    create_res = client.post("/api/projects", json={
        "title": "Proyek Uji Motion Graphics",
        "category": "investigasi"
    })
    assert create_res.status_code == 200
    proj_id = create_res.json()["id"]

    try:
        # Get first scene ID
        proj = storage_service.get_project(proj_id)
        scene_id = proj.storyboard.scenes[0].scene_id

        # 1. Add overlay
        add_res = client.post(f"/api/projects/{proj_id}/scenes/{scene_id}/overlays", json={
            "template_id": "kinetic_title",
            "start_time": 0.5,
            "duration": 2.5,
            "layer": 1,
            "position": "center",
            "content": {
                "title": "MISTERI DOKUMEN ARSIP",
                "tag": "BUKTI #01"
            }
        })
        assert add_res.status_code == 200
        ovl_data = add_res.json()
        assert ovl_data["template_id"] == "kinetic_title"
        assert ovl_data["start_time"] == 0.5
        ovl_id = ovl_data["overlay_id"]

        # 2. List overlays
        list_res = client.get(f"/api/projects/{proj_id}/scenes/{scene_id}/overlays")
        assert list_res.status_code == 200
        assert len(list_res.json()) == 1

        # 3. Update overlay
        update_res = client.put(f"/api/projects/{proj_id}/scenes/{scene_id}/overlays/{ovl_id}", json={
            "duration": 3.0,
            "content": {
                "title": "MISTERI DOKUMEN REVISI",
                "tag": "BUKTI #01-REV"
            }
        })
        assert update_res.status_code == 200
        assert update_res.json()["duration"] == 3.0
        assert update_res.json()["content"]["title"] == "MISTERI DOKUMEN REVISI"

        # 4. Delete overlay
        del_res = client.delete(f"/api/projects/{proj_id}/scenes/{scene_id}/overlays/{ovl_id}")
        assert del_res.status_code == 200
        list_after = client.get(f"/api/projects/{proj_id}/scenes/{scene_id}/overlays")
        assert len(list_after.json()) == 0
    finally:
        storage_service.delete_project(proj_id)

def test_real_vertical_video_integration_and_audio_preservation(temp_test_env):
    # Tests actual alpha video generation and compositing with FFmpeg
    base_vid = temp_test_env["base_vid"]
    ffmpeg_bin = temp_test_env["ffmpeg"]
    out_dir = temp_test_env["dir"]
    comp_out = out_dir / "composited_video.mp4"

    overlay = MotionOverlay(
        overlay_id="mgo-test-real",
        scene_id="sc-test",
        template_id="stat_card",
        start_time=0.2,
        duration=1.5,
        layer=1,
        position="center",
        content={
            "value": "89%",
            "label": "Tingkat Akurasi Forensik",
            "unit": "%",
            "source": "Lab Independen"
        }
    )

    # Composite onto real base video
    motion_graphics_service.composite_overlays_on_video(
        base_video_path=base_vid,
        overlays=[overlay],
        scene_duration=2.0,
        output_video_path=comp_out,
        ffmpeg_bin=ffmpeg_bin
    )

    assert comp_out.is_file()
    assert comp_out.stat().st_size > 5000

    # OpenCV Video Capture inspection
    cap = cv2.VideoCapture(str(comp_out))
    assert cap.isOpened()
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = round(cap.get(cv2.CAP_PROP_FPS))
    fc = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    dur = fc / fps if fps > 0 else 0
    cap.release()

    assert w == 1080
    assert h == 1920
    assert fps == 30
    assert 1.8 <= dur <= 2.2

    # Verify audio stream preservation via FFprobe / FFmpeg
    probe_res = subprocess.run(
        [ffmpeg_bin, "-i", str(comp_out)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    assert "Audio: aac" in probe_res.stderr

def test_assembly_scene_without_overlay_unaffected():
    create_res = client.post("/api/projects", json={
        "title": "Proyek Tanpa Overlay",
        "category": "sains"
    })
    proj_id = create_res.json()["id"]

    try:
        proj = storage_service.get_project(proj_id)
        # Verify scene has empty motion_overlays
        assert proj.storyboard.scenes[0].motion_overlays == []
        proj.storyboard.scenes[0].target_duration_seconds = 5.0
        storage_service.save_project(proj)

        result = assembly_service.assemble_project_video_sync(proj)
        assert result["status"] == "success"
        assert result["motion_overlays_count"] == 0
        assert os.path.isfile(result["output_path"])

        if os.path.isfile(result["output_path"]):
            os.remove(result["output_path"])
    finally:
        storage_service.delete_project(proj_id)

def test_legacy_project_json_compatibility():
    legacy_scene_data = {
        "scene_id": "legacy-scene-1",
        "scene_number": 1,
        "title": "Adegan Sejarah Kuno",
        "narration_text": "Narasi adegan lama",
        "target_duration_seconds": 4.0,
        "visual_prompt": "Candi tua di senja hari"
        # No motion_overlays key
    }
    sc = Scene.model_validate(legacy_scene_data)
    assert sc.motion_overlays == []
    assert isinstance(sc.motion_overlays, list)

def test_temp_file_cleanup_on_error(temp_test_env):
    # Pass an invalid ffmpeg binary to trigger an error
    overlay = MotionOverlay(
        overlay_id="mgo-err-clean",
        scene_id="sc-test",
        template_id="kinetic_title",
        content={"title": "Error Test"}
    )
    with pytest.raises(MotionGraphicsError):
        motion_graphics_service.render_overlay_clip(
            overlay=overlay,
            scene_duration=3.0,
            output_dir=temp_test_env["dir"],
            ffmpeg_bin="C:/non_existent_ffmpeg.exe"
        )

def test_typography_multiline_wrapping_regression():
    """
    Regression test verifying that long titles, labels, and descriptions
    wrap onto multiple lines without raising errors, truncating prematurely, or clipping.
    """
    # 1. Timeline event with long title and description
    frame_timeline = motion_graphics_service.render_overlay_frame(
        template_id="timeline_event",
        content={
            "date_or_period": "20 AGUSTUS 2024 • 14:30 WIB",
            "event_title": "Penetrasi Lapisan Struktur Kedua Candi",
            "location": "Zona Inti Sektor Barat Daya",
            "description": "Ditemukan susunan batu columnar joint dengan perekat mortar purba berkadar silika tinggi."
        },
        position="center",
        animation_in="fade",
        animation_out="fade",
        t=1.5,
        duration=4.0
    )
    assert frame_timeline.size == (1080, 1920)
    assert frame_timeline.mode == "RGBA"

    # 2. Kinetic title with long title and subtitle
    frame_title = motion_graphics_service.render_overlay_frame(
        template_id="kinetic_title",
        content={
            "title": "MISTERI STRUKTUR PIRAMIDA KUNO DI NUSANTARA",
            "subtitle": "Dokumentasi Lengkap Ekskavasi & Analisis Citra Georadar Bawah Permukaan",
            "tag": "ARSIP FORENSIK RESMI"
        },
        position="center",
        animation_in="fade",
        animation_out="fade",
        t=1.5,
        duration=4.0
    )
    assert frame_title.size == (1080, 1920)

    # 3. Stat card with long descriptive label
    frame_stat = motion_graphics_service.render_overlay_frame(
        template_id="stat_card",
        content={
            "value": "4.200",
            "unit": "Ha",
            "label": "Total Estimasi Area Megalitik Yang Tertimbun Sedimen Vulkanik Purba",
            "source": "Laporan Tim Survei Geologi Nasional 2024"
        },
        position="bottom",
        animation_in="fade",
        animation_out="fade",
        t=1.5,
        duration=4.0
    )
    assert frame_stat.size == (1080, 1920)

