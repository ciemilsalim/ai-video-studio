import os
import shutil
import subprocess
import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app
from app.config import resolve_ffmpeg_binary
from app.services.storage_service import storage_service
from app.services.asset_service import asset_service
from app.services.assembly_service import assembly_service
from app.models.project import VideoProject, Scene, VisualAsset

client = TestClient(app)

@pytest.fixture(scope="module")
def sample_8s_video(tmp_path_factory):
    """Generate a clean 8.0-second 1080x1920 test MP4 with audio."""
    temp_dir = tmp_path_factory.mktemp("media_fixtures")
    video_path = temp_dir / "google_flow_sample_8s.mp4"
    ffmpeg_bin = resolve_ffmpeg_binary()
    assert ffmpeg_bin is not None, "FFmpeg binary must be resolved"

    cmd = [
        ffmpeg_bin, "-y",
        "-f", "lavfi", "-i", "testsrc=size=1080x1920:rate=30",
        "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000",
        "-t", "8.0",
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        str(video_path)
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    assert video_path.exists()
    return str(video_path)

def test_protected_projects_cannot_be_deleted():
    """Verify built-in sample projects are guarded with 403 Forbidden."""
    for proj_id in ["misteri-gunung-merapi", "misteri-peradaban-nusantara"]:
        res = client.delete(f"/api/projects/{proj_id}")
        assert res.status_code == 403
        assert "tidak dapat dihapus" in res.json().get("detail", "")
        # Verify project is still intact
        proj = storage_service.get_project(proj_id)
        assert proj is not None

def test_project_rename_and_duplicate():
    """Test project rename and duplication endpoints."""
    # 1. Create project
    res = client.post("/api/projects", json={
        "title": "Proyek Uji Rename",
        "description": "Deskripsi awal",
        "aspect_ratio": "9:16",
        "voice": "id-ID-ArdiNeural"
    })
    assert res.status_code == 200
    created = res.json()
    proj_id = created["id"]

    try:
        # 2. Rename project
        rename_res = client.patch(f"/api/projects/{proj_id}/rename", json={
            "title": "Proyek Uji Terganti",
            "description": "Deskripsi diperbarui"
        })
        assert rename_res.status_code == 200
        renamed = rename_res.json()
        assert renamed["title"] == "Proyek Uji Terganti"
        assert renamed["description"] == "Deskripsi diperbarui"

        # 3. Duplicate project
        dup_res = client.post(f"/api/projects/{proj_id}/duplicate")
        assert dup_res.status_code == 200
        duplicated = dup_res.json()
        dup_id = duplicated["id"]
        assert dup_id != proj_id
        assert "Salinan" in duplicated["title"]
        assert len(duplicated["storyboard"]["scenes"]) == len(renamed["storyboard"]["scenes"])
        # Scene IDs must be distinct
        assert duplicated["storyboard"]["scenes"][0]["scene_id"] != renamed["storyboard"]["scenes"][0]["scene_id"]

        # Cleanup duplicated
        storage_service.delete_project(dup_id)
    finally:
        storage_service.delete_project(proj_id)

def test_scene_duplicate_and_delete_with_asset_safety(sample_8s_video):
    """Test scene duplication and verify asset detachment on scene deletion."""
    res = client.post("/api/projects", json={
        "title": "Proyek Test Scene Safety",
        "description": "Pengujian scene duplicate dan delete",
        "aspect_ratio": "9:16",
        "voice": "id-ID-ArdiNeural"
    })
    assert res.status_code == 200
    proj_id = res.json()["id"]

    try:
        # Import asset
        import_res = client.post(f"/api/assets/{proj_id}/import", json={
            "source_path": sample_8s_video
        })
        assert import_res.status_code == 200
        asset_id = import_res.json()["asset_id"]

        # Attach asset to scene-1
        attach_res = client.post(f"/api/assets/{proj_id}/{asset_id}/attach", json={
            "scene_id": "scene-1"
        })
        assert attach_res.status_code == 200

        # Duplicate scene-1
        dup_scene_res = client.post(f"/api/projects/{proj_id}/storyboard/scenes/scene-1/duplicate")
        assert dup_scene_res.status_code == 200
        proj_after_dup = dup_scene_res.json()
        assert len(proj_after_dup["storyboard"]["scenes"]) == 2
        dup_scene = proj_after_dup["storyboard"]["scenes"][1]
        assert dup_scene["scene_id"] != "scene-1"
        assert "(Duplikat)" in dup_scene["title"] or "(Salinan)" in dup_scene["title"]

        # Delete the original scene-1
        del_scene_res = client.delete(f"/api/projects/{proj_id}/storyboard/scenes/scene-1")
        assert del_scene_res.status_code == 200
        proj_after_del = del_scene_res.json()
        assert len(proj_after_del["storyboard"]["scenes"]) == 1

        # Verify asset is detached, not deleted from project or disk
        proj_obj = storage_service.get_project(proj_id)
        asset_obj = next((a for a in proj_obj.assets if a.asset_id == asset_id), None)
        assert asset_obj is not None
        assert asset_obj.scene_id is None
        assert Path(asset_obj.file_path).exists()
    finally:
        storage_service.delete_project(proj_id)

def test_8s_footage_loop_mode_assembly(sample_8s_video):
    """Test 8-second video looped to fill a 15-second scene."""
    res = client.post("/api/projects", json={
        "title": "Proyek Loop 8s",
        "description": "Looping 8s video to 15s",
        "aspect_ratio": "9:16",
        "voice": "id-ID-ArdiNeural"
    })
    assert res.status_code == 200
    proj_id = res.json()["id"]

    try:
        # Import asset
        import_res = client.post(f"/api/assets/{proj_id}/import", json={
            "source_path": sample_8s_video
        })
        assert import_res.status_code == 200
        asset_id = import_res.json()["asset_id"]

        # Attach asset to scene-1
        attach_res = client.post(f"/api/assets/{proj_id}/{asset_id}/attach", json={
            "scene_id": "scene-1"
        })
        assert attach_res.status_code == 200

        # Update scene to 15.0s with duration_mode="loop"
        update_res = client.put(f"/api/projects/{proj_id}/storyboard/scenes/scene-1", json={
            "title": "Adegan 15 Detik Loop",
            "narration_text": "Video delapan detik berulang dengan mulus sampai durasi lima belas detik.",
            "target_duration_seconds": 15.0,
            "duration_mode": "loop"
        })
        assert update_res.status_code == 200
        updated_scene = next(s for s in update_res.json()["storyboard"]["scenes"] if s["scene_id"] == "scene-1")
        assert updated_scene["duration_mode"] == "loop"

        # Assemble project video
        proj = storage_service.get_project(proj_id)
        result = assembly_service.assemble_project_video_sync(proj)
        assert result["status"] == "success"

        out_path = Path(result["output_path"])
        assert out_path.exists()
        meta = asset_service.probe_media_metadata(out_path)
        # Total duration should be ~15s (+/- 0.6s for audio/video boundary)
        assert meta["duration_sec"] is not None
        assert 14.5 <= meta["duration_sec"] <= 16.0
        assert meta["width"] == 1080
        assert meta["height"] == 1920
    finally:
        storage_service.delete_project(proj_id)

def test_8s_footage_freeze_frame_mode_assembly(sample_8s_video):
    """Test 8-second video with freeze_frame holding last frame to fill 12s."""
    res = client.post("/api/projects", json={
        "title": "Proyek Freeze 8s",
        "description": "Freeze frame 8s video to 12s",
        "aspect_ratio": "9:16",
        "voice": "id-ID-ArdiNeural"
    })
    assert res.status_code == 200
    proj_id = res.json()["id"]

    try:
        # Import asset
        import_res = client.post(f"/api/assets/{proj_id}/import", json={
            "source_path": sample_8s_video
        })
        assert import_res.status_code == 200
        asset_id = import_res.json()["asset_id"]

        # Attach to scene-1
        attach_res = client.post(f"/api/assets/{proj_id}/{asset_id}/attach", json={
            "scene_id": "scene-1"
        })
        assert attach_res.status_code == 200

        # Update scene to 12.0s with duration_mode="freeze_frame"
        update_res = client.put(f"/api/projects/{proj_id}/storyboard/scenes/scene-1", json={
            "title": "Adegan 12 Detik Freeze",
            "narration_text": "Video diputar satu kali lalu menahan frame terakhir tanpa layar hitam.",
            "target_duration_seconds": 12.0,
            "duration_mode": "freeze_frame"
        })
        assert update_res.status_code == 200
        updated_scene = next(s for s in update_res.json()["storyboard"]["scenes"] if s["scene_id"] == "scene-1")
        assert updated_scene["duration_mode"] == "freeze_frame"

        # Assemble project video
        proj = storage_service.get_project(proj_id)
        result = assembly_service.assemble_project_video_sync(proj)
        assert result["status"] == "success"

        out_path = Path(result["output_path"])
        assert out_path.exists()
        meta = asset_service.probe_media_metadata(out_path)
        assert meta["duration_sec"] is not None
        assert 11.5 <= meta["duration_sec"] <= 13.0
        assert meta["width"] == 1080
        assert meta["height"] == 1920
    finally:
        storage_service.delete_project(proj_id)

def test_8s_footage_trim_for_shorter_scene(sample_8s_video):
    """Test 8-second video accurately trimmed when scene is 5.0 seconds."""
    res = client.post("/api/projects", json={
        "title": "Proyek Trim 8s ke 5s",
        "description": "Trimming 8s video to 5s",
        "aspect_ratio": "9:16",
        "voice": "id-ID-ArdiNeural"
    })
    assert res.status_code == 200
    proj_id = res.json()["id"]

    try:
        # Import asset
        import_res = client.post(f"/api/assets/{proj_id}/import", json={
            "source_path": sample_8s_video
        })
        assert import_res.status_code == 200
        asset_id = import_res.json()["asset_id"]

        # Attach to scene-1
        attach_res = client.post(f"/api/assets/{proj_id}/{asset_id}/attach", json={
            "scene_id": "scene-1"
        })
        assert attach_res.status_code == 200

        # Update scene to 5.0s with duration_mode="freeze_frame"
        update_res = client.put(f"/api/projects/{proj_id}/storyboard/scenes/scene-1", json={
            "title": "Adegan 5 Detik Potong",
            "narration_text": "Adegan ringkas lima detik dipotong rapi dari video delapan detik.",
            "target_duration_seconds": 5.0,
            "duration_mode": "freeze_frame"
        })
        assert update_res.status_code == 200

        # Assemble project video
        proj = storage_service.get_project(proj_id)
        result = assembly_service.assemble_project_video_sync(proj)
        assert result["status"] == "success"

        out_path = Path(result["output_path"])
        assert out_path.exists()
        meta = asset_service.probe_media_metadata(out_path)
        assert meta["duration_sec"] is not None
        assert 4.5 <= meta["duration_sec"] <= 6.0
        assert meta["width"] == 1080
        assert meta["height"] == 1920
    finally:
        storage_service.delete_project(proj_id)

def test_consecutive_8s_scenes_with_motion_graphics(sample_8s_video):
    """Test 2 consecutive scenes each using 8s video and motion overlays."""
    res = client.post("/api/projects", json={
        "title": "Proyek 2 Adegan 8s",
        "description": "Multi-scene dengan footage 8s dan motion graphics",
        "aspect_ratio": "9:16",
        "voice": "id-ID-ArdiNeural"
    })
    assert res.status_code == 200
    proj_id = res.json()["id"]

    try:
        # Import asset
        import_res = client.post(f"/api/assets/{proj_id}/import", json={
            "source_path": sample_8s_video
        })
        assert import_res.status_code == 200
        asset_id = import_res.json()["asset_id"]

        # Attach to scene-1
        attach_res = client.post(f"/api/assets/{proj_id}/{asset_id}/attach", json={
            "scene_id": "scene-1"
        })
        assert attach_res.status_code == 200

        # Scene 1: 6s with kinetic_title overlay
        client.put(f"/api/projects/{proj_id}/storyboard/scenes/scene-1", json={
            "title": "Adegan 1 Investigasi",
            "narration_text": "Bukti awal mengarahkan tim menuju titik koordinat misterius.",
            "target_duration_seconds": 6.0,
            "duration_mode": "freeze_frame"
        })
        client.post(f"/api/projects/{proj_id}/scenes/scene-1/overlays", json={
            "template_id": "kinetic_title",
            "content": {
                "headline": "TITIK KOORDINAT MISTERIUS",
                "subheadline": "Laporan Tim Khusus"
            },
            "start_time": 0.5,
            "duration": 4.0
        })

        # Add Scene 2: 7s with stat_card overlay
        add_res = client.post(f"/api/projects/{proj_id}/storyboard/scenes", json={
            "title": "Adegan 2 Temuan Lapangan",
            "narration_text": "Data satelit mengonfirmasi anomali struktur tanah seluas sepuluh hektar.",
            "target_duration_seconds": 7.0,
            "duration_mode": "loop",
            "visual_prompt": "Satellite topographic anomaly visualization"
        })
        assert add_res.status_code == 200
        scene2_id = add_res.json()["storyboard"]["scenes"][-1]["scene_id"]

        # Attach same footage asset to scene 2
        attach2_res = client.post(f"/api/assets/{proj_id}/{asset_id}/attach", json={
            "scene_id": scene2_id
        })
        assert attach2_res.status_code == 200

        client.post(f"/api/projects/{proj_id}/scenes/{scene2_id}/overlays", json={
            "template_id": "stat_card",
            "content": {
                "headline": "ANOMALI DETEKSI",
                "value": "10.4",
                "unit": "HEKTAR",
                "caption": "Luas Area Terpindai"
            },
            "start_time": 1.0,
            "duration": 4.5
        })

        # Assemble full 2-scene documentary
        proj = storage_service.get_project(proj_id)
        result = assembly_service.assemble_project_video_sync(proj)
        assert result["status"] == "success"
        assert result["scenes_count"] == 2

        out_path = Path(result["output_path"])
        assert out_path.exists()
        meta = asset_service.probe_media_metadata(out_path)
        # Total duration = 6.0 + 7.0 = 13.0s (+/- audio bounds)
        assert meta["duration_sec"] is not None
        assert 12.0 <= meta["duration_sec"] <= 15.0
        assert meta["width"] == 1080
        assert meta["height"] == 1920
        assert meta["has_audio"] is True
    finally:
        storage_service.delete_project(proj_id)
