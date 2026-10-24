import os
import re
import asyncio
import subprocess
from pathlib import Path
from typing import Dict, Any, Optional
import edge_tts

from app.config import AUDIO_DIR, resolve_ffmpeg_binary

class TTSServiceError(Exception):
    pass

class TTSValidationError(TTSServiceError):
    pass

class TTSExecutionError(TTSServiceError):
    pass

class TTSService:
    SUPPORTED_VOICES = {
        "id-ID-ArdiNeural": "Bahasa Indonesia - Ardi (Pria)",
        "id-ID-GadisNeural": "Bahasa Indonesia - Gadis (Wanita)",
        "en-US-BrianMultilingualNeural": "English - Brian (Docu Voice)",
        "en-US-AriaNeural": "English - Aria (Female)"
    }

    def __init__(self, audio_dir: Path = AUDIO_DIR):
        self.audio_dir = audio_dir
        self.audio_dir.mkdir(parents=True, exist_ok=True)

    def validate_tts_input(self, text: str, voice: str) -> None:
        if not text or not text.strip():
            raise TTSValidationError("Teks narasi tidak boleh kosong untuk sintesis audio.")
        if len(text.strip()) > 5000:
            raise TTSValidationError(f"Teks narasi melampaui batas maksimum 5000 karakter. Diterima: {len(text.strip())}")
        if voice and not re.match(r"^[a-zA-Z]{2}-[a-zA-Z]{2}-[\w]+Neural$", voice):
            # allow standard voice patterns or fallback
            pass

    def get_audio_duration_sec(self, audio_path: Path) -> float:
        """
        Extracts exact duration in seconds from an audio file using FFmpeg probe.
        """
        if not audio_path.is_file():
            return 0.0

        ffmpeg_bin = resolve_ffmpeg_binary()
        if not ffmpeg_bin or not os.path.exists(ffmpeg_bin):
            return 0.0

        try:
            res = subprocess.run(
                [ffmpeg_bin, "-i", str(audio_path)],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=5
            )
            # Match Duration: 00:00:04.23,
            match = re.search(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)", res.stderr)
            if match:
                hours = float(match.group(1))
                minutes = float(match.group(2))
                seconds = float(match.group(3))
                return round(hours * 3600 + minutes * 60 + seconds, 2)
        except Exception:
            pass

        return 0.0

    async def synthesize_scene_narration(
        self,
        project_id: str,
        scene_id: str,
        text: str,
        voice: str = "id-ID-ArdiNeural",
        rate: str = "+0%"
    ) -> Dict[str, Any]:
        """
        Synthesizes speech using edge-tts.
        Outputs real neural MP3 audio to project audio directory.
        Raises TTSExecutionError if network/service fails.
        """
        self.validate_tts_input(text, voice)

        project_audio_dir = self.audio_dir / project_id
        project_audio_dir.mkdir(parents=True, exist_ok=True)

        clean_scene_id = re.sub(r"[^\w-]", "", scene_id)
        out_filename = f"{clean_scene_id}_narration.mp3"
        out_path = project_audio_dir / out_filename

        try:
            communicate = edge_tts.Communicate(text=text.strip(), voice=voice, rate=rate)
            # Execute with timeout to prevent hanging on network drops
            await asyncio.wait_for(communicate.save(str(out_path)), timeout=25.0)
        except asyncio.TimeoutError as te:
            if out_path.exists():
                out_path.unlink()
            raise TTSExecutionError(
                "Sintesis Edge-TTS melampaui batas waktu (timeout 25 detik). Layanan Edge-TTS memerlukan koneksi internet aktif."
            ) from te
        except Exception as e:
            if out_path.exists():
                out_path.unlink()
            raise TTSExecutionError(
                f"Gagal menghubungi layanan Edge-TTS: {str(e)}. "
                "Layanan memerlukan koneksi internet aktif ke server Microsoft TTS."
            ) from e

        # Ensure audio file was created and is non-empty
        if not out_path.is_file() or out_path.stat().st_size < 500:
            if out_path.exists():
                out_path.unlink()
            raise TTSExecutionError("File audio yang dihasilkan kosong atau tidak valid.")

        size_bytes = out_path.stat().st_size
        duration_sec = self.get_audio_duration_sec(out_path)

        return {
            "status": "success",
            "project_id": project_id,
            "scene_id": scene_id,
            "filename": out_filename,
            "audio_path": str(out_path),
            "web_url": f"/api/audio/{project_id}/{out_filename}",
            "voice": voice,
            "file_size_bytes": size_bytes,
            "duration_sec": duration_sec
        }

tts_service = TTSService()
