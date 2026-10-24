from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "AI Video Studio Local API" in data["message"]

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "system" in data
    assert "ffmpeg" in data
    assert data["isolation"]["app_tutorial_video_preserved"] is True
    assert data["isolation"]["isolated_workspace"] == "ai-video-studio"
