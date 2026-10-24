import os
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from app.config import AUDIO_DIR

router = APIRouter(prefix="/api/audio", tags=["Audio"])

@router.get("/{project_id}/{filename}")
def stream_audio_file(project_id: str, filename: str):
    clean_proj = os.path.basename(project_id)
    clean_name = os.path.basename(filename)
    target_file = AUDIO_DIR / clean_proj / clean_name

    if not target_file.is_file():
        raise HTTPException(status_code=404, detail=f"File audio '{clean_name}' tidak ditemukan.")

    return FileResponse(
        path=target_file,
        media_type="audio/mpeg",
        filename=clean_name
    )
