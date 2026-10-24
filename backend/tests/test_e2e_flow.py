from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_documentary_workflow():
    # 1. Check health
    health = client.get("/api/health").json()
    assert health["status"] == "healthy"
    assert health["ffmpeg"]["available"] is True

    # 2. Create project
    create_res = client.post("/api/projects", json={
        "title": "Misteri Peradaban Maritim Nusantara",
        "description": "Dokumenter sejarah jalur rempah dan navigasi kapal pinisi",
        "aspect_ratio": "9:16",
        "voice": "id-ID-ArdiNeural"
    })
    assert create_res.status_code == 200
    project = create_res.json()
    proj_id = project["id"]

    try:
        # 3. Add a second scene to the project
        project["storyboard"]["scenes"].append({
            "scene_id": "scene-2",
            "scene_number": 2,
            "title": "Jalur Rempah & Pelaut Bugis",
            "narration_text": "Para pelaut tangguh mengarungi samudera dengan bintang sebagai kompas abadi.",
            "shots": [
                {
                    "shot_id": "shot-2",
                    "shot_type": "drone_aerial",
                    "camera_movement": "tracking_shot",
                    "visual_prompt": "Majestic wooden pinisi ship sailing through golden hour ocean waves, drone aerial view",
                    "flow_parameters": {
                        "lighting": "golden sunset cinematic lighting",
                        "lens": "24mm anamorphic wide",
                        "aspect_ratio": "9:16",
                        "negative_prompt": "modern boat, blurry, oversaturated"
                    },
                    "duration_sec": 5.0,
                    "motion_graphic": {
                        "type": "lower_third",
                        "headline": "Kapal Pinisi (Warisan Dunia UNESCO)",
                        "subtext": "Tradisi maritim Sulawesi Selatan"
                    }
                }
            ]
        })

        update_res = client.put(f"/api/projects/{proj_id}", json=project)
        assert update_res.status_code == 200
        updated = update_res.json()
        assert len(updated["storyboard"]["scenes"]) == 2
        assert updated["storyboard"]["total_estimated_duration_sec"] == 9.0

        # 4. Generate Google Flow prompts
        prompts_res = client.get(f"/api/projects/{proj_id}/prompts/flow")
        assert prompts_res.status_code == 200
        flow_prompts = prompts_res.json()
        assert len(flow_prompts) == 2
        assert flow_prompts[1]["camera_motion"] == "tracking_shot"
        assert "golden sunset" in flow_prompts[1]["compiled_prompt"]

        # 5. Export Markdown batch
        md_res = client.get(f"/api/projects/{proj_id}/prompts/flow/export-markdown")
        assert md_res.status_code == 200
        md_content = md_res.json()["content"]
        assert "Kapal Pinisi" in md_content or "Misteri Peradaban" in md_content

    finally:
        # 6. Cleanup
        del_res = client.delete(f"/api/projects/{proj_id}")
        assert del_res.status_code == 200
