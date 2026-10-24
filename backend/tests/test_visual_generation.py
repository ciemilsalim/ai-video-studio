import os
import tempfile
import pytest
import cv2
import numpy as np
from pathlib import Path
from PIL import Image
from fastapi.testclient import TestClient

from app.main import app
from app.models.project import VideoProject, Scene, VisualAsset
from app.services.storage_service import storage_service
from app.services.assembly_service import assembly_service, AssemblyServiceError
from app.services.asset_service import asset_service
from app.services.render_service import render_service
from app.services.visual_generation_provider import (
    GoogleFlowProvider,
    ProceduralCinematicProvider,
    visual_service,
    VisualJob
)

client = TestClient(app)

@pytest.fixture
def temp_media_workspace():
    """Create isolated temporary files for testing visual pipeline."""
    temp_dir = Path(tempfile.mkdtemp(prefix="ai_video_test_"))
    
    # 1. Create a 1080x1920 test image (red/blue gradient)
    img_path = temp_dir / "test_visual_image.png"
    img_data = np.zeros((1920, 1080, 3), dtype=np.uint8)
    img_data[:, :, 0] = 180  # Blue
    img_data[:, :, 2] = 220  # Red
    cv2.imwrite(str(img_path), img_data)

    # 2. Create a moving 1080x1920 test video (moving circle)
    vid_path = temp_dir / "test_moving_footage.mp4"
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(str(vid_path), fourcc, 30.0, (1080, 1920))
    for frame_idx in range(60): # 2.0s at 30fps
        frame = np.zeros((1920, 1080, 3), dtype=np.uint8)
        # Moving yellow ball
        pos_y = int(200 + frame_idx * 20)
        cv2.circle(frame, (540, pos_y), 80, (0, 255, 255), -1)
        out.write(frame)
    out.release()

    # 3. Create a 0-byte corrupt file
    corrupt_path = temp_dir / "corrupt_footage.mp4"
    corrupt_path.write_bytes(b"")

    yield {
        "dir": temp_dir,
        "image_path": str(img_path),
        "video_path": str(vid_path),
        "corrupt_path": str(corrupt_path)
    }

    # Cleanup
    for f in temp_dir.glob("*"):
        try:
            f.unlink()
        except Exception:
            pass
    try:
        temp_dir.rmdir()
    except Exception:
        pass


@pytest.fixture
def isolate_project():
    res = client.post("/api/projects", json={
        "title": "Uji Jalur Visual Utama Phase 2E",
        "description": "Pengujian terisolasi visual generation pipeline",
        "aspect_ratio": "9:16",
        "voice": "id-ID-ArdiNeural"
    })
    assert res.status_code == 200
    created = res.json()
    project_id = created["id"]
    yield project_id
    storage_service.delete_project(project_id)


# TEST 1: Adegan dengan footage video valid
def test_scene_with_valid_video_footage(isolate_project, temp_media_workspace):
    project_id = isolate_project
    video_path = temp_media_workspace["video_path"]
    
    # Import asset to project
    asset = asset_service.import_local_asset(
        project_id=project_id,
        source_file_path=video_path,
        scene_id="scene-1",
        source_type="local_test"
    )
    assert asset.asset_type == "footage"
    
    project = storage_service.get_project(project_id)
    scene = project.storyboard.scenes[0]
    assert scene.footage_path is not None
    assert scene.visual_status == "ready"
    
    # Assemble scene segment
    out_seg = assembly_service.assemble_scene_segment_sync(scene, project=project)
    assert Path(out_seg).is_file()
    assert Path(out_seg).stat().st_size > 10000


# TEST 2: Adegan dengan gambar valid (image_reference)
def test_scene_with_valid_image(isolate_project, temp_media_workspace):
    project_id = isolate_project
    image_path = temp_media_workspace["image_path"]
    
    # Import still image asset to project
    asset = asset_service.import_local_asset(
        project_id=project_id,
        source_file_path=image_path,
        scene_id="scene-1",
        source_type="local_test"
    )
    assert asset.asset_type == "image_reference"
    
    project = storage_service.get_project(project_id)
    scene = project.storyboard.scenes[0]
    # Verify image asset successfully populated scene.footage_path
    assert scene.footage_path is not None
    assert scene.visual_status == "ready"
    
    # Assemble scene segment
    out_seg = assembly_service.assemble_scene_segment_sync(scene, project=project)
    assert Path(out_seg).is_file()
    assert Path(out_seg).stat().st_size > 10000


# TEST 3: Adegan tanpa visual utama (reports missing status)
def test_scene_without_visual_reports_missing(isolate_project):
    project_id = isolate_project
    project = storage_service.get_project(project_id)
    scene = project.storyboard.scenes[0]
    
    # Ensure no footage attached
    scene.footage_path = None
    scene.asset_id = None
    scene.visual_status = "missing"
    storage_service.save_project(project)
    
    # Reload and verify model state
    reloaded = storage_service.get_project(project_id)
    assert reloaded.storyboard.scenes[0].visual_status == "missing"
    
    # Assembling scene without visual should cleanly produce fallback card
    out_seg = assembly_service.assemble_scene_segment_sync(reloaded.storyboard.scenes[0], project=reloaded)
    assert Path(out_seg).is_file()


# TEST 4: Path visual yang hilang raises AssemblyServiceError
def test_missing_visual_path_raises_error(isolate_project):
    project = storage_service.get_project(isolate_project)
    scene = project.storyboard.scenes[0]
    scene.footage_path = "D:\\non_existent_folder_xyz\\missing_file_123.mp4"
    
    with pytest.raises(AssemblyServiceError) as exc_info:
        assembly_service.assemble_scene_segment_sync(scene, project=project)
    assert "tidak ditemukan di disk" in str(exc_info.value)


# TEST 5: Asset tidak dapat dibaca (0-byte / corrupted)
def test_unreadable_or_corrupt_asset_raises_error(isolate_project, temp_media_workspace):
    project = storage_service.get_project(isolate_project)
    scene = project.storyboard.scenes[0]
    scene.footage_path = temp_media_workspace["corrupt_path"]
    
    with pytest.raises(AssemblyServiceError) as exc_info:
        assembly_service.assemble_scene_segment_sync(scene, project=project)
    assert "rusak atau berukuran 0 byte" in str(exc_info.value)


# TEST 6: Visual bergerak tetap memiliki perubahan frame setelah assembly
def test_moving_visual_preserves_motion(isolate_project, temp_media_workspace):
    project_id = isolate_project
    video_path = temp_media_workspace["video_path"]
    
    asset_service.import_local_asset(
        project_id=project_id,
        source_file_path=video_path,
        scene_id="scene-1"
    )
    project = storage_service.get_project(project_id)
    scene = project.storyboard.scenes[0]
    scene.target_duration_seconds = 2.0
    
    out_seg = assembly_service.assemble_scene_segment_sync(scene, project=project)
    
    # Open assembled MP4 with OpenCV and assert frame motion delta
    cap = cv2.VideoCapture(str(out_seg))
    assert cap.isOpened()
    
    # Read frame at t=0.2s (frame ~6)
    cap.set(cv2.CAP_PROP_POS_FRAMES, 6)
    ret1, frame1 = cap.read()
    
    # Read frame at t=1.2s (frame ~36)
    cap.set(cv2.CAP_PROP_POS_FRAMES, 36)
    ret2, frame2 = cap.read()
    cap.release()
    
    assert ret1 is True and ret2 is True
    # Calculate pixel difference
    diff = cv2.absdiff(frame1, frame2)
    mean_diff = np.mean(diff)
    assert mean_diff > 0.05, f"Frame appears frozen! Mean diff is {mean_diff}"


# TEST 7: Motion graphics tampil di atas visual utama
def test_motion_graphics_composited_over_main_visual(isolate_project, temp_media_workspace):
    project_id = isolate_project
    video_path = temp_media_workspace["video_path"]
    
    asset_service.import_local_asset(
        project_id=project_id,
        source_file_path=video_path,
        scene_id="scene-1"
    )
    project = storage_service.get_project(project_id)
    scene = project.storyboard.scenes[0]
    scene.target_duration_seconds = 2.0
    
    # Add a motion overlay with valid template kinetic_title
    add_ov_res = client.post(f"/api/projects/{project_id}/scenes/{scene.scene_id}/overlays", json={
        "template_id": "kinetic_title",
        "start_time": 0.0,
        "duration": 2.0,
        "content": {"title": "Laksamana Cheng Ho", "subtitle": "Ekspedisi Samudera"},
        "enabled": True
    })
    assert add_ov_res.status_code == 200
    
    project = storage_service.get_project(project_id)
    scene = project.storyboard.scenes[0]
    assert len(scene.motion_overlays) == 1
    
    # Assemble scene with overlay
    out_seg = assembly_service.assemble_scene_segment_sync(scene, project=project)
    assert Path(out_seg).is_file()
    assert Path(out_seg).stat().st_size > 10000


# TEST 8: Audio narasi tetap ada dan sinkron
def test_narration_audio_preserved_with_visual(isolate_project, temp_media_workspace):
    project_id = isolate_project
    image_path = temp_media_workspace["image_path"]
    
    asset_service.import_local_asset(
        project_id=project_id,
        source_file_path=image_path,
        scene_id="scene-1"
    )
    
    # Synthesize TTS narration
    tts_res = client.post(f"/api/projects/{project_id}/narration/scene/scene-1")
    assert tts_res.status_code == 200
    
    project = storage_service.get_project(project_id)
    scene = project.storyboard.scenes[0]
    assert scene.narration_audio_path is not None
    assert Path(scene.narration_audio_path).is_file()
    
    # Assemble segment
    out_seg = assembly_service.assemble_scene_segment_sync(scene, project=project)
    
    # Verify audio presence via render_service
    verif = render_service.verify_video_file(Path(out_seg))
    assert verif["has_audio_stream"] is True
    assert verif["has_video_stream"] is True


# TEST 9: Proyek JSON lama tetap kompatibel
def test_legacy_json_backward_compatibility():
    legacy_json_dict = {
        "id": "legacy_project_1990",
        "title": "Legacy Project Without Visual Fields",
        "description": "Compatibility test",
        "aspect_ratio": "9:16",
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-01-01T00:00:00Z",
        "storyboard": {
            "total_estimated_duration_sec": 4.0,
            "scenes": [
                {
                    "scene_id": "legacy_scene_1",
                    "scene_number": 1,
                    "title": "Legacy Scene",
                    "target_duration_seconds": 4.0,
                    "narration_text": "Narasi adegan lama",
                    "visual_prompt": "Prompt visual adegan lama"
                }
            ]
        }
    }
    
    # Model parsing must succeed and populate default visual_status="missing"
    project = VideoProject(**legacy_json_dict)
    assert project.storyboard.scenes[0].visual_status == "missing"
    assert project.storyboard.scenes[0].visual_job_id is None


# TEST 10: Error generator atau provider dilaporkan secara jujur
def test_provider_honest_error_reporting():
    # 1. Google Flow provider honestly reports unavailable
    gf_provider = GoogleFlowProvider()
    assert gf_provider.is_available is False
    job = VisualJob(
        job_id="test_job",
        project_id="test_proj",
        scene_id="test_scene",
        provider_id="google_flow",
        prompt="A misty ancient temple",
        duration_sec=3.0,
        status="pending"
    )
    with pytest.raises(NotImplementedError) as exc_info:
        gf_provider.generate_visual_sync(job, Path(tempfile.gettempdir()))
    assert "Google Flow" in str(exc_info.value)
    assert "endpoint API" in str(exc_info.value)
    
    # 2. VisualGenerationManager provider list honestly indicates availability
    providers = visual_service.list_providers()
    gf_info = next((p for p in providers if p["provider_id"] == "google_flow"), None)
    assert gf_info is not None
    assert gf_info["is_available"] is False
    
    cinematic_info = next((p for p in providers if p["provider_id"] == "procedural_cinematic"), None)
    assert cinematic_info is not None
    assert cinematic_info["is_available"] is True


