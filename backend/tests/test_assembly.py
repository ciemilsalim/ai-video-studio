import os
import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app
from app.services.storage_service import storage_service
from app.services.assembly_service import assembly_service, AssemblyServiceError

client = TestClient(app)

@pytest.fixture
def setup_assembly_project():
    # 1. Create project with 1 initial scene
    res = client.post("/api/projects", json={
        "title": "Perjalanan Bahari Sriwijaya",
        "description": "Dokumenter peradaban maritim klasik",
        "aspect_ratio": "9:16",
        "voice": "id-ID-ArdiNeural"
    })
    assert res.status_code == 200
    created = res.json()
    project_id = created["id"]

    # 2. Add second scene
    add_res = client.post(f"/api/projects/{project_id}/storyboard/scenes", json={
        "title": "Armada Kapal Layar Bercadik",
        "narration_text": "Ratusan armada kapal mengarungi Selat Malaka membawa komoditas rempah.",
        "target_duration_seconds": 3.0,
        "visual_prompt": "Cinematic armada of outrigger wooden sailboats in tropical sunlit bay"
    })
    assert add_res.status_code == 200

    yield project_id

    # Cleanup
    storage_service.delete_project(project_id)

def test_real_multi_scene_assembly(setup_assembly_project):
    project_id = setup_assembly_project
    project = storage_service.get_project(project_id)
    assert project is not None
    assert len(project.storyboard.scenes) == 2

    # Set concise durations for test speed (3.0s each = 6.0s total)
    project.storyboard.scenes[0].target_duration_seconds = 3.0
    project.storyboard.scenes[1].target_duration_seconds = 3.0
    storage_service.save_project(project)

    # 1. Trigger Multi-Scene Assembly Service
    result = assembly_service.assemble_project_video_sync(project)

    assert result["status"] == "success"
    assert result["project_id"] == project_id
    assert result["scenes_count"] == 2
    assert "output_path" in result

    out_file = Path(result["output_path"])
    assert out_file.is_file()
    assert out_file.stat().st_size > 20000

    # 2. Verify Output Metadata
    verif = result["verification"]
    assert verif["valid"] is True
    assert verif["width"] == 1080
    assert verif["height"] == 1920
    assert verif["fps"] == 30.0
    assert verif["duration_sec"] >= 5.8  # 3.0 + 3.0 = 6.0s
    assert verif["has_video_stream"] is True
    assert verif["has_audio_stream"] is True

def test_assembly_api_endpoint(setup_assembly_project):
    project_id = setup_assembly_project

    # Call API endpoint
    res = client.post(f"/api/renders/assemble/{project_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["scenes_count"] == 2
    assert data["verification"]["valid"] is True
    assert data["verification"]["width"] == 1080
    assert data["verification"]["height"] == 1920
