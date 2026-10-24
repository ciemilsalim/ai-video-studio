import asyncio
import pytest
from pathlib import Path
from app.services.tts_service import tts_service, TTSValidationError, TTSExecutionError

def test_tts_validation_empty_text():
    with pytest.raises(TTSValidationError) as exc:
        tts_service.validate_tts_input("", "id-ID-ArdiNeural")
    assert "tidak boleh kosong" in str(exc.value)

    with pytest.raises(TTSValidationError) as exc:
        tts_service.validate_tts_input("   ", "id-ID-ArdiNeural")
    assert "tidak boleh kosong" in str(exc.value)

def test_tts_validation_too_long():
    long_text = "kata " * 1500
    with pytest.raises(TTSValidationError) as exc:
        tts_service.validate_tts_input(long_text, "id-ID-ArdiNeural")
    assert "melampaui batas" in str(exc.value)

def test_real_edge_tts_synthesis():
    """
    Integrates directly with Edge-TTS to verify neural voice synthesis and audio duration probing.
    Uses asyncio.run() for standard test compatibility.
    """
    project_id = "test-tts-project"
    scene_id = "test-scene-1"
    sample_text = "Ini adalah pengujian narasi kecerdasan buatan untuk video dokumenter nusantara."
    voice = "id-ID-ArdiNeural"

    async def _execute():
        return await tts_service.synthesize_scene_narration(
            project_id=project_id,
            scene_id=scene_id,
            text=sample_text,
            voice=voice
        )

    result = asyncio.run(_execute())

    assert result["status"] == "success"
    assert result["scene_id"] == scene_id
    assert result["voice"] == voice
    assert result["file_size_bytes"] > 1000

    audio_path = Path(result["audio_path"])
    assert audio_path.is_file()

    # Verify duration was measured via FFmpeg probe
    assert result["duration_sec"] > 2.0
    assert result["duration_sec"] < 15.0

    # Cleanup
    if audio_path.exists():
        audio_path.unlink()
