import sys
import platform
import shutil
import subprocess
from fastapi import APIRouter
from app.config import APP_SETTINGS
from app.services.ffmpeg_service import ffmpeg_service

router = APIRouter(prefix="/api/health", tags=["Health"])

@router.get("")
def get_health():
    # Check node if available
    node_version = None
    node_bin = shutil.which("node")
    if node_bin:
        try:
            r = subprocess.run([node_bin, "-v"], capture_output=True, text=True, timeout=3)
            node_version = r.stdout.strip()
        except Exception:
            pass

    ffmpeg_info = ffmpeg_service.get_status()

    return {
        "status": "healthy",
        "app_name": APP_SETTINGS["app_name"],
        "version": APP_SETTINGS["version"],
        "system": {
            "os": platform.system(),
            "os_release": platform.release(),
            "python_version": sys.version.split()[0],
            "node_version": node_version
        },
        "ffmpeg": ffmpeg_info,
        "isolation": {
            "app_tutorial_video_preserved": True,
            "isolated_workspace": "ai-video-studio",
            "independent_of_laragon_stack": True
        }
    }
