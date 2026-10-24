import os
import shutil
import tempfile
from pathlib import Path
import pytest
from PIL import Image
from fastapi.testclient import TestClient

from app.main import app
from app.services.storage_service import storage_service
from app.services.asset_service import asset_service, AssetValidationError, AssetNotFoundError
from app.services.assembly_service import assembly_service, AssemblyServiceError
from app.config import resolve_ffmpeg_binary

client = TestClient(app)

@pytest.fixture
def temp_media_files():
    temp_dir = Path(tempfile.mkdtemp(prefix="ai_asset_test_"))
    
    # Create test image (100x100 RGB)
    img_path = temp_dir / "sample_graphic.png"
    img = Image.new("RGB", (100, 100), color=(255, 120, 0))
    img.save(img_path)

    # Create test video (1 sec, 360x640, 30fps) using ffmpeg
    vid_path = temp_dir / "sample_clip.mp4"
    ffmpeg_bin = resolve_ffmpeg_binary()
    assert ffmpeg_bin and os.path.exists(ffmpeg_bin), "FFmpeg required for test"
    
    import subprocess
    cmd = [
        ffmpeg_bin, "-y",
        "-f", "lavfi", "-i", "testsrc=size=360x640:rate=30",
        "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
        "-t", "1.0",
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        str(vid_path)
    ]
    subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True, timeout=20)

    # Unsupported file
    dummy_exe = temp_dir / "bad_file.exe"
    dummy_exe.write_text("not a media file")

    yield {
        "dir": temp_dir,
        "image": img_path,
        "video": vid_path,
        "exe": dummy_exe
    }

    shutil.rmtree(temp_dir, ignore_errors=True)

def test_asset_path_validation(temp_media_files):
    # 1. Empty path
    with pytest.raises(AssetValidationError, match="tidak boleh kosong"):
        asset_service.validate_file_path("")

    # 2. External URL
    with pytest.raises(AssetValidationError, match="URL eksternal tidak diizinkan"):
        asset_service.validate_file_path("https://example.com/video.mp4")

    # 3. Non-existent file
    with pytest.raises(AssetValidationError, match="tidak ditemukan di disk"):
        asset_service.validate_file_path("C:/non_existent_folder/video.mp4")

    # 4. Unsupported extension
    with pytest.raises(AssetValidationError, match="tidak didukung"):
        asset_service.validate_file_path(str(temp_media_files["exe"]))

    # 5. Valid files
    assert asset_service.validate_file_path(str(temp_media_files["image"])) == temp_media_files["image"].resolve()
    assert asset_service.validate_file_path(str(temp_media_files["video"])) == temp_media_files["video"].resolve()

def test_import_image_and_video_assets(temp_media_files):
    create_res = client.post("/api/projects", json={
        "title": "Proyek Aset Visual",
        "description": "Tes manajemen aset visual",
        "category": "sejarah"
    })
    assert create_res.status_code == 200
    proj_id = create_res.json()["id"]

    try:
        # Import image asset
        img_asset = asset_service.import_local_asset(
            project_id=proj_id,
            source_file_path=str(temp_media_files["image"]),
            source_type="local_import"
        )
        assert img_asset.asset_id.startswith("asset-")
        assert img_asset.width == 100
        assert img_asset.height == 100
        assert img_asset.asset_type == "image_reference"
        assert os.path.isfile(img_asset.file_path)
        assert img_asset.thumbnail_path is not None
        assert os.path.isfile(img_asset.thumbnail_path)

        # Import video asset via API
        vid_res = client.post(f"/api/assets/{proj_id}/import", json={
            "source_path": str(temp_media_files["video"]),
            "source_type": "local_import"
        })
        assert vid_res.status_code == 200
        vid_data = vid_res.json()
        assert vid_data["asset_type"] == "footage"
        assert vid_data["width"] == 360
        assert vid_data["height"] == 640
        assert vid_data["duration_sec"] >= 0.9
        assert vid_data["fps"] == 30.0
        assert os.path.isfile(vid_data["file_path"])

        # List assets via API
        list_res = client.get(f"/api/assets/{proj_id}")
        assert list_res.status_code == 200
        assets = list_res.json()
        assert len(assets) == 2
    finally:
        storage_service.delete_project(proj_id)

def test_scene_asset_attachment_and_detachment(temp_media_files):
    create_res = client.post("/api/projects", json={
        "title": "Proyek Attachment Adegan",
        "category": "misteri"
    })
    proj_id = create_res.json()["id"]

    try:
        # Add a scene
        scene_res = client.post(f"/api/projects/{proj_id}/storyboard/scenes", json={
            "title": "Adegan 1 - Candi Kuno",
            "narration_text": "Candi ini menyimpan misteri ribuan tahun.",
            "target_duration_seconds": 4.0
        })
        assert scene_res.status_code == 200
        scene_id = scene_res.json()["storyboard"]["scenes"][-1]["scene_id"]

        # Import footage
        vid_asset = asset_service.import_local_asset(
            project_id=proj_id,
            source_file_path=str(temp_media_files["video"])
        )

        # Attach asset to scene via API
        attach_res = client.post(
            f"/api/assets/{proj_id}/{vid_asset.asset_id}/attach",
            json={"scene_id": scene_id}
        )
        assert attach_res.status_code == 200
        assert attach_res.json()["scene_id"] == scene_id

        # Verify project state
        proj = storage_service.get_project(proj_id)
        sc = next(s for s in proj.storyboard.scenes if s.scene_id == scene_id)
        assert sc.asset_id == vid_asset.asset_id
        assert sc.footage_path == vid_asset.file_path
        assert sc.production_status == "footage_ready"

        # Detach asset from scene via API
        detach_res = client.post(f"/api/assets/{proj_id}/detach/{scene_id}")
        assert detach_res.status_code == 200
        proj_after = storage_service.get_project(proj_id)
        sc_after = next(s for s in proj_after.storyboard.scenes if s.scene_id == scene_id)
        assert sc_after.asset_id is None
        assert sc_after.footage_path is None

        # Delete asset
        del_res = client.delete(f"/api/assets/{proj_id}/{vid_asset.asset_id}")
        assert del_res.status_code == 200
        assert not os.path.isfile(vid_asset.file_path)
    finally:
        storage_service.delete_project(proj_id)

def test_assembly_with_real_footage_and_placeholder_counts(temp_media_files):
    create_res = client.post("/api/projects", json={
        "title": "Proyek Assembly Hybrid",
        "category": "sains"
    })
    proj_id = create_res.json()["id"]

    try:
        # Scene 1: With real footage
        sc1_res = client.post(f"/api/projects/{proj_id}/storyboard/scenes", json={
            "title": "Adegan Footage Nyata",
            "target_duration_seconds": 2.0
        })
        assert sc1_res.status_code == 200
        sc1_id = sc1_res.json()["storyboard"]["scenes"][-1]["scene_id"]

        vid_asset = asset_service.import_local_asset(
            project_id=proj_id,
            source_file_path=str(temp_media_files["video"]),
            scene_id=sc1_id
        )

        # Scene 2: Placeholder only
        sc2_res = client.post(f"/api/projects/{proj_id}/storyboard/scenes", json={
            "title": "Adegan Masih Placeholder",
            "target_duration_seconds": 2.0
        })

        proj = storage_service.get_project(proj_id)
        total_scenes = len(proj.storyboard.scenes)
        result = assembly_service.assemble_project_video_sync(proj)

        assert result["status"] == "success"
        assert result["scenes_count"] == total_scenes
        assert result["real_footage_scenes_count"] == 1
        assert result["placeholder_scenes_count"] == total_scenes - 1
        assert result["has_placeholders"] is True
        assert os.path.isfile(result["output_path"])

        # Clean up generated video
        if os.path.isfile(result["output_path"]):
            os.remove(result["output_path"])
    finally:
        storage_service.delete_project(proj_id)

def test_assembly_missing_footage_raises_clear_error():
    create_res = client.post("/api/projects", json={
        "title": "Proyek Aset Hilang",
        "category": "sains"
    })
    proj_id = create_res.json()["id"]

    try:
        # Scene with non-existent footage
        client.post(f"/api/projects/{proj_id}/storyboard/scenes", json={
            "title": "Adegan Aset Gaib",
            "target_duration_seconds": 2.0
        })

        proj = storage_service.get_project(proj_id)
        proj.storyboard.scenes[0].footage_path = "C:/non_existent_path/ghost_footage.mp4"

        with pytest.raises(AssemblyServiceError, match="tidak ditemukan di disk"):
            assembly_service.assemble_scene_segment_sync(
                scene=proj.storyboard.scenes[0],
                project_title=proj.title,
                total_scenes=1
            )
    finally:
        storage_service.delete_project(proj_id)

def test_legacy_project_compatibility_without_assets():
    # Construct project dict without "assets" key
    legacy_data = {
        "id": "legacy-test-project",
        "title": "Legacy Project Without Assets",
        "description": "Legacy format",
        "category": "sejarah",
        "target_audience": "umum",
        "aspect_ratio": "9:16",
        "created_at": "2026-01-01T00:00:00",
        "updated_at": "2026-01-01T00:00:00",
        "storyboard": {
            "total_estimated_duration_seconds": 4.0,
            "scenes": []
        }
    }
    from app.models.project import VideoProject
    proj = VideoProject.model_validate(legacy_data)
    assert proj.assets == []
    assert isinstance(proj.assets, list)
