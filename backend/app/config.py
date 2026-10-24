import os
import shutil
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
WORKSPACE_ROOT = BASE_DIR.parent
DATA_DIR = BASE_DIR / "data"
PROJECTS_DIR = DATA_DIR / "projects"
RENDERS_DIR = DATA_DIR / "renders"
TEMP_DIR = BASE_DIR / "temp"

# Ensure data directories exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
PROJECTS_DIR.mkdir(parents=True, exist_ok=True)
RENDERS_DIR.mkdir(parents=True, exist_ok=True)
TEMP_DIR.mkdir(parents=True, exist_ok=True)

def resolve_ffmpeg_binary() -> str | None:
    """
    Resolves the FFmpeg binary path.
    1. Check system PATH.
    2. Fallback to imageio_ffmpeg bundled binary.
    3. Return None if not found.
    """
    path_bin = shutil.which("ffmpeg")
    if path_bin:
        return path_bin

    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        pass

    return None

APP_SETTINGS = {
    "app_name": "AI Video Studio Local API",
    "version": "1.0.0",
    "host": "127.0.0.1",
    "port": 8000,
    "cors_origins": ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8000"],
    "projects_dir": PROJECTS_DIR,
    "renders_dir": RENDERS_DIR,
    "temp_dir": TEMP_DIR,
    "ffmpeg_path": resolve_ffmpeg_binary()
}
