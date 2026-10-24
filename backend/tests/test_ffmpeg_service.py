from app.services.ffmpeg_service import ffmpeg_service

def test_ffmpeg_service_status():
    status = ffmpeg_service.get_status()
    assert isinstance(status, dict)
    assert "available" in status
    assert status["available"] is True
    assert status["path"] is not None
    assert "version" in status
    assert "ffmpeg version" in status["version"].lower()
