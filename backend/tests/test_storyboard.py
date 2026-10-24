import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.storage_service import storage_service

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_test_project():
    project_id = "test-storyboard-flow"
    storage_service.delete_project(project_id)
    # Create fresh project
    client.post("/api/projects", json={
        "title": "Test Storyboard Flow",
        "description": "Pengujian CRUD adegan storyboard",
        "aspect_ratio": "9:16",
        "voice": "id-ID-ArdiNeural"
    })
    yield project_id
    storage_service.delete_project(project_id)

def test_add_edit_delete_reorder_scenes(setup_test_project):
    project_id = setup_test_project

    # 1. Add a second scene
    add_res = client.post(f"/api/projects/{project_id}/storyboard/scenes", json={
        "title": "Adegan 2: Penemuan Prasasti Kuno",
        "narration_text": "Di tengah rimba belantara, prasasti batu bertuliskan aksara purba ditemukan.",
        "target_duration_seconds": 5.0,
        "visual_prompt": "Ancient mossy stone inscription tablet glowing with ancient glyphs in dense tropical rainforest"
    })
    assert add_res.status_code == 200
    p = add_res.json()
    assert len(p["storyboard"]["scenes"]) == 2
    second_scene = p["storyboard"]["scenes"][1]
    assert second_scene["title"] == "Adegan 2: Penemuan Prasasti Kuno"
    assert second_scene["scene_number"] == 2
    scene_2_id = second_scene["scene_id"]

    # 2. Add a third scene
    add_res_3 = client.post(f"/api/projects/{project_id}/storyboard/scenes", json={
        "title": "Adegan 3: Kesimpulan Sejarah",
        "narration_text": "Warisan leluhur menjadi pilar peradaban modern hari ini.",
        "target_duration_seconds": 4.5,
        "visual_prompt": "Sunset over modern Jakarta skyline blending seamlessly with ancient maritime silhouette"
    })
    assert add_res_3.status_code == 200
    p3 = add_res_3.json()
    assert len(p3["storyboard"]["scenes"]) == 3
    scene_3_id = p3["storyboard"]["scenes"][2]["scene_id"]
    scene_1_id = p3["storyboard"]["scenes"][0]["scene_id"]

    # 3. Update scene 2
    edit_res = client.put(f"/api/projects/{project_id}/storyboard/scenes/{scene_2_id}", json={
        "title": "Adegan 2: Penguraian Simbol Prasasti",
        "target_duration_seconds": 6.0
    })
    assert edit_res.status_code == 200
    p_edited = edit_res.json()
    sc2 = next(s for s in p_edited["storyboard"]["scenes"] if s["scene_id"] == scene_2_id)
    assert sc2["title"] == "Adegan 2: Penguraian Simbol Prasasti"
    assert sc2["target_duration_seconds"] == 6.0

    # 4. Reorder scenes: move scene 3 to the beginning (scene_3_id, scene_1_id, scene_2_id)
    reorder_res = client.post(f"/api/projects/{project_id}/storyboard/reorder", json={
        "scene_ids": [scene_3_id, scene_1_id, scene_2_id]
    })
    assert reorder_res.status_code == 200
    p_reordered = reorder_res.json()
    assert p_reordered["storyboard"]["scenes"][0]["scene_id"] == scene_3_id
    assert p_reordered["storyboard"]["scenes"][0]["scene_number"] == 1
    assert p_reordered["storyboard"]["scenes"][1]["scene_id"] == scene_1_id
    assert p_reordered["storyboard"]["scenes"][1]["scene_number"] == 2

    # 5. Delete scene 1
    del_res = client.delete(f"/api/projects/{project_id}/storyboard/scenes/{scene_1_id}")
    assert del_res.status_code == 200
    p_deleted = del_res.json()
    assert len(p_deleted["storyboard"]["scenes"]) == 2
    assert all(s["scene_id"] != scene_1_id for s in p_deleted["storyboard"]["scenes"])
