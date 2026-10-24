import os
from pathlib import Path
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, status
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

from app.models.project import VideoProject, VisualAsset
from app.services.storage_service import storage_service
from app.services.visual_generation_provider import visual_service, VisualJob

router = APIRouter(prefix="/api/visual", tags=["Visual Generation Pipeline"])

class GenerateVisualRequest(BaseModel):
    provider_id: Optional[str] = "procedural_cinematic"
    force_retry: Optional[bool] = False

class AttachAssetRequest(BaseModel):
    asset_id: str

@router.get("/providers", response_model=List[Dict[str, Any]])
def list_visual_providers():
    """
    Returns available visual generation providers and their operational availability.
    """
    return visual_service.list_providers()

@router.get("/projects/{project_id}/status", response_model=List[Dict[str, Any]])
def get_project_visual_status(project_id: str):
    """
    Returns visual readiness status for all scenes in a storyboard.
    """
    project = storage_service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Proyek '{project_id}' tidak ditemukan.")
    return visual_service.get_scene_visual_summary(project)

@router.post("/projects/{project_id}/scenes/{scene_id}/generate", response_model=Dict[str, Any])
async def generate_scene_visual(project_id: str, scene_id: str, req: GenerateVisualRequest):
    """
    Triggers or enqueues a visual generation job for a specific scene.
    """
    project = storage_service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Proyek '{project_id}' tidak ditemukan.")

    scene = next((s for s in project.storyboard.scenes if s.scene_id == scene_id), None)
    if not scene:
        raise HTTPException(status_code=404, detail=f"Adegan '{scene_id}' tidak ditemukan dalam storyboard.")

    try:
        # Create job with deduplication
        job = visual_service.create_generation_job(
            project_id=project_id,
            scene_id=scene_id,
            provider_id=req.provider_id or "procedural_cinematic",
            force_retry=req.force_retry or False
        )

        # Run synchronously via threadpool
        completed_job = await run_in_threadpool(
            visual_service.execute_job_sync,
            project_id=project_id,
            job_id=job.job_id
        )

        if completed_job.status == "failed":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Generasi visual gagal: {completed_job.error_message}"
            )

        return completed_job.to_dict()

    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Kesalahan pada pipeline visual: {str(e)}")

@router.get("/projects/{project_id}/scenes/{scene_id}/job", response_model=Optional[Dict[str, Any]])
def get_scene_latest_job(project_id: str, scene_id: str):
    """
    Retrieves the most recent generation job for a given scene.
    """
    jobs = visual_service.load_project_jobs(project_id)
    matching = [j for j in jobs if j.scene_id == scene_id]
    if not matching:
        return None
    return matching[-1].to_dict()

@router.post("/projects/{project_id}/scenes/{scene_id}/attach-asset", response_model=Dict[str, Any])
def attach_asset_to_scene(project_id: str, scene_id: str, req: AttachAssetRequest):
    """
    Directly links an existing visual asset to a scene.
    """
    from app.services.asset_service import asset_service, AssetNotFoundError
    try:
        asset = asset_service.attach_asset_to_scene(
            project_id=project_id,
            asset_id=req.asset_id,
            scene_id=scene_id
        )
        return {
            "status": "success",
            "scene_id": scene_id,
            "asset_id": asset.asset_id,
            "footage_path": asset.file_path,
            "thumbnail_url": asset.thumbnail_url
        }
    except AssetNotFoundError as afe:
        raise HTTPException(status_code=404, detail=str(afe))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal menautkan aset: {str(e)}")
