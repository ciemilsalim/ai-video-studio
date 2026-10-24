import os
import re
import shutil
import tempfile
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from app.config import ASSETS_DIR
from app.models.project import VisualAsset
from app.services.storage_service import storage_service
from app.services.asset_service import asset_service, AssetValidationError, AssetNotFoundError

router = APIRouter(prefix="/api/assets", tags=["Assets"])

class ImportAssetRequest(BaseModel):
    source_path: str = Field(..., min_length=1)
    scene_id: Optional[str] = None
    source_type: Optional[str] = "local_import"

class AttachAssetRequest(BaseModel):
    scene_id: str = Field(..., min_length=1)

@router.get("/{project_id}", response_model=List[VisualAsset])
def list_project_assets(project_id: str):
    project = storage_service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Proyek '{project_id}' tidak ditemukan.")
    return project.assets

@router.post("/{project_id}/import", response_model=VisualAsset)
def import_asset_from_path(project_id: str, req: ImportAssetRequest):
    try:
        asset = asset_service.import_local_asset(
            project_id=project_id,
            source_file_path=req.source_path,
            scene_id=req.scene_id,
            source_type=req.source_type or "local_import"
        )
        return asset
    except AssetNotFoundError as nfe:
        raise HTTPException(status_code=404, detail=str(nfe))
    except AssetValidationError as ve:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal mengimpor aset: {str(e)}")

@router.post("/{project_id}/upload", response_model=VisualAsset)
async def upload_asset(
    project_id: str,
    file: UploadFile = File(...),
    scene_id: Optional[str] = Form(None)
):
    project = storage_service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Proyek '{project_id}' tidak ditemukan.")

    # Save to temp location first
    clean_upload_name = asset_service.sanitize_filename(file.filename or "uploaded_media")
    temp_dir = Path(tempfile.gettempdir())
    temp_file = temp_dir / f"upload_{clean_upload_name}"

    try:
        with open(temp_file, "wb") as f:
            shutil.copyfileobj(file.file, f)

        asset = asset_service.import_local_asset(
            project_id=project_id,
            source_file_path=str(temp_file),
            scene_id=scene_id,
            source_type="local_import"
        )
        return asset
    except AssetValidationError as ve:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal mengunggah aset: {str(e)}")
    finally:
        if temp_file.exists():
            try:
                temp_file.unlink()
            except Exception:
                pass

@router.post("/{project_id}/{asset_id}/attach", response_model=VisualAsset)
def attach_asset(project_id: str, asset_id: str, req: AttachAssetRequest):
    try:
        return asset_service.attach_asset_to_scene(project_id, asset_id, req.scene_id)
    except AssetNotFoundError as nfe:
        raise HTTPException(status_code=404, detail=str(nfe))

@router.post("/{project_id}/detach/{scene_id}")
def detach_asset(project_id: str, scene_id: str):
    try:
        asset_service.detach_asset_from_scene(project_id, scene_id)
        return {"status": "success", "message": f"Aset berhasil dilepas dari adegan '{scene_id}'."}
    except AssetNotFoundError as nfe:
        raise HTTPException(status_code=404, detail=str(nfe))

@router.delete("/{project_id}/{asset_id}")
def delete_asset(project_id: str, asset_id: str):
    try:
        asset_service.delete_asset(project_id, asset_id)
        return {"status": "success", "message": f"Aset '{asset_id}' berhasil dihapus."}
    except AssetNotFoundError as nfe:
        raise HTTPException(status_code=404, detail=str(nfe))

@router.get("/{project_id}/{filename}")
def stream_asset(project_id: str, filename: str, thumb: bool = Query(False)):
    clean_pid = re.sub(r"[^\w-]", "", project_id)
    clean_fn = os.path.basename(filename)

    if thumb:
        target_file = ASSETS_DIR / clean_pid / "thumbnails" / clean_fn
    else:
        target_file = ASSETS_DIR / clean_pid / clean_fn

    if not target_file.is_file():
        raise HTTPException(status_code=404, detail=f"File aset '{clean_fn}' tidak ditemukan.")

    ext = target_file.suffix.lower()
    media_type = "video/mp4" if ext in [".mp4", ".mov", ".webm", ".mkv"] else "image/jpeg"
    return FileResponse(path=target_file, media_type=media_type, filename=clean_fn)
