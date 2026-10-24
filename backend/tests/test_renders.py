import os
import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app
from app.services.render_service import render_service, RenderValidationError, RenderExecutionError

client = TestClient(app)

# -----------------------------------------------------------------------------
# 1. UNIT TESTS: Input Validation
# -----------------------------------------------------------------------------

def test_render_validation_empty_title():
    with pytest.raises(RenderValidationError) as exc:
        render_service.validate_render_params(title="", duration_sec=5.0)
    assert "tidak boleh kosong" in str(exc.value)

def test_render_validation_invalid_duration():
    with pytest.raises(RenderValidationError) as exc:
        render_service.validate_render_params(title="Test Title", duration_sec=3.0)
    assert "antara 5.0 hingga 10.0 detik" in str(exc.value)

    with pytest.raises(RenderValidationError) as exc:
        render_service.validate_render_params(title="Test Title", duration_sec=15.0)
    assert "antara 5.0 hingga 10.0 detik" in str(exc.value)

def test_render_validation_invalid_dimensions():
    with pytest.raises(RenderValidationError) as exc:
        render_service.validate_render_params(title="Test Title", duration_sec=5.0, width=1920, height=1080)
    assert "1080x1920" in str(exc.value)

def test_render_validation_invalid_fps():
    with pytest.raises(RenderValidationError) as exc:
        render_service.validate_render_params(title="Test Title", duration_sec=5.0, fps=45)
    assert "24, 30, atau 60" in str(exc.value)


# -----------------------------------------------------------------------------
# 2. UNIT TESTS: Error Handling When FFmpeg Missing / Failing
# -----------------------------------------------------------------------------

def test_render_ffmpeg_missing_error():
    with pytest.raises(RenderExecutionError) as exc:
        render_service.render_demo_video_sync(
            title="Demo Test",
            duration_sec=5.0,
            ffmpeg_override="C:/path/to/non_existent_ffmpeg.exe"
        )
    assert "tidak ditemukan" in str(exc.value)


# -----------------------------------------------------------------------------
# 3. REAL RENDER TEST: 1080x1920 Vertical MP4 Generation & Full Verification
# -----------------------------------------------------------------------------

def test_real_vertical_video_render():
    """
    Renders an actual 5.0s vertical 1080x1920 video with FFmpeg.
    Performs comprehensive verification on codec, dimensions, fps, duration, and streams.
    """
    test_title = "Bukti Render Vertikal 1080x1920"
    test_subtitle = "Dokumenter AI Video Studio • Windows Local Engine"

    result = render_service.render_demo_video_sync(
        title=test_title,
        subtitle=test_subtitle,
        duration_sec=5.0,
        fps=30
    )

    assert result["status"] == "success"
    assert result["title"] == test_title
    assert "output_path" in result

    output_path = Path(result["output_path"])
    assert output_path.is_file(), "File MP4 harus benar-benar ada di disk"
    assert output_path.stat().st_size > 20000, "File MP4 harus memiliki ukuran wajar (>20KB)"

    # Inspect verification payload
    verif = result["verification"]
    assert verif["valid"] is True, f"Verifikasi gagal: {verif.get('error')}"
    assert verif["width"] == 1080, f"Lebar harus 1080, didapat {verif['width']}"
    assert verif["height"] == 1920, f"Tinggi harus 1920, didapat {verif['height']}"
    assert verif["fps"] == 30.0, f"FPS harus 30.0, didapat {verif['fps']}"
    assert verif["duration_sec"] >= 4.9, f"Durasi harus mendekati 5.0 detik, didapat {verif['duration_sec']}s"
    assert verif["has_video_stream"] is True, "Harus terdapat video stream"
    assert verif["has_audio_stream"] is True, "Harus terdapat audio stream (AAC)"
    assert verif["codec"] == "h264", f"Codec video harus h264, didapat {verif['codec']}"


# -----------------------------------------------------------------------------
# 4. INTEGRATION TEST: API Endpoints (/api/renders)
# -----------------------------------------------------------------------------

def test_api_render_standalone_endpoint():
    payload = {
        "title": "API Test Render Vertikal",
        "subtitle": "Pengujian Endpoint FastAPI",
        "duration_sec": 5.0,
        "fps": 30
    }
    response = client.post("/api/renders/demo", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["verification"]["valid"] is True
    assert data["verification"]["width"] == 1080
    assert data["verification"]["height"] == 1920

    filename = data["filename"]

    # Test stream/fetch file
    file_res = client.get(f"/api/renders/{filename}")
    assert file_res.status_code == 200
    assert file_res.headers["content-type"] == "video/mp4"

    # Test list renders
    list_res = client.get("/api/renders")
    assert list_res.status_code == 200
    items = list_res.json()
    assert any(item["filename"] == filename for item in items)
