import subprocess
from typing import Dict, Any, Optional
from app.config import resolve_ffmpeg_binary

class FFmpegService:
    def __init__(self):
        self.ffmpeg_path = resolve_ffmpeg_binary()

    def get_status(self) -> Dict[str, Any]:
        if not self.ffmpeg_path:
            return {
                "available": False,
                "path": None,
                "version": None,
                "error": "FFmpeg executable not found on PATH or via imageio-ffmpeg."
            }
        
        try:
            res = subprocess.run(
                [self.ffmpeg_path, "-version"],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                timeout=5
            )
            first_line = res.stdout.splitlines()[0] if res.stdout else "Unknown version"
            return {
                "available": True,
                "path": self.ffmpeg_path,
                "version": first_line,
                "exit_code": res.returncode
            }
        except Exception as e:
            return {
                "available": False,
                "path": self.ffmpeg_path,
                "version": None,
                "error": str(e)
            }

ffmpeg_service = FFmpegService()
