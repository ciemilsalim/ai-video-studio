import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.storage_service import storage_service

client = TestClient(app)

@pytest.fixture(autouse=True)
def cleanup():
    test_id = "test-nusantara-documentary"
    storage_service.delete_project(test_id)
    yield
    storage_service.delete_project(test_id)

def test_create_and_retrieve_project():
    # 1. Create Project
    payload = {
        "title": "Test Nusantara Documentary",
        "description": "Dokumenter sejarah artefak kuno",
        "aspect_ratio": "9:16",
        "voice": "id-ID-ArdiNeural"
    }
    res = client.post("/api/projects", json=payload)
    assert res.status_code == 200
    created = res.json()
    assert created["title"] == payload["title"]
    assert created["aspect_ratio"] == "9:16"
    assert created["resolution"] == {"width": 1080, "height": 1920}
    assert len(created["storyboard"]["scenes"]) >= 1

    project_id = created["id"]

    # 2. Get Project
    res = client.get(f"/api/projects/{project_id}")
    assert res.status_code == 200
    fetched = res.json()
    assert fetched["id"] == project_id
    assert fetched["title"] == payload["title"]

    # 3. Test Google Flow Prompts Compilation
    res = client.get(f"/api/projects/{project_id}/prompts/flow")
    assert res.status_code == 200
    prompts = res.json()
    assert len(prompts) >= 1
    assert "compiled_prompt" in prompts[0]
    assert "9:16" in prompts[0]["aspect_ratio"]

    # 4. Test Export Markdown
    res = client.get(f"/api/projects/{project_id}/prompts/flow/export-markdown")
    assert res.status_code == 200
    exp = res.json()
    assert exp["filename"] == f"{project_id}_flow_prompts.md"
    assert "Google Flow Prompt Batch" in exp["content"]

    # 5. Delete Project
    res = client.delete(f"/api/projects/{project_id}")
    assert res.status_code == 200
    assert res.json()["status"] == "success"

    # Confirm 404
    res = client.get(f"/api/projects/{project_id}")
    assert res.status_code == 404
