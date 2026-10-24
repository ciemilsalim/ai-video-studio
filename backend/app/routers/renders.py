import os
import asyncio
from pathlib import Path
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, BackgroundTasks, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

from app.config import RENDERS_DIR
from app.services.storage_service import storage_service
from app.services.render_service import render_service, RenderValidationError, RenderExecutionError

router = APIRouter(prefix="/api/renders", tags=["Rendering"])

class DemoRenderRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    subtitle: Optional[str] = None
    duration_sec: float = Field(default=5.0, ge=5.0, le=10.0)
    fps: int = Field(default=30)

class ProjectRenderRequest(BaseModel):
    duration_sec: float = Field(default=5.0, ge=5.0, le=10.0)
    fps: int = Field(default=30)

@router.get("", response_model=List[Dict[str, Any]])
def list_renders():
    renders = []
    for file in sorted(RENDERS_DIR.glob("*.mp4"), key=lambda f: f.stat().st_mtime, reverse=True):
        try:
            stat = file.stat()
            renders.append({
                "filename": file.name,
                "size_bytes": stat.st_size,
                "created_at": stat.st_mtime,
                "web_url": f"/api/renders/{file.name}"
            })
        except Exception:
            continue
    return renders

@router.get("/{filename}")
def stream_render_file(filename: str):
    # Sanitize filename against directory traversal
    clean_name = os.path.basename(filename)
    target_file = RENDERS_DIR / clean_name
    if not target_file.is_file():
        raise HTTPException(status_code=404, detail=f"File render '{clean_name}' tidak ditemukan.")
    
    return FileResponse(
        path=target_file,
        media_type="video/mp4",
        filename=clean_name
    )

@router.post("/demo", response_model=Dict[str, Any])
async def render_standalone_demo(req: DemoRenderRequest):
    try:
        # Run in thread pool to prevent blocking FastAPI event loop
        result = await run_in_threadpool(
            render_service.render_demo_video_sync,
            title=req.title,
            subtitle=req.subtitle,
            duration_sec=req.duration_sec,
            fps=req.fps
        )
        return result
    except RenderValidationError as ve:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(ve))
    except RenderExecutionError as ee:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(ee))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected error: {str(e)}")

@router.post("/project/{project_id}", response_model=Dict[str, Any])
async def render_project_demo(project_id: str, req: ProjectRenderRequest):
    project = storage_service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' tidak ditemukan.")

    # Extract scene title and subtitle
    first_scene_title = ""
    if project.storyboard.scenes:
        first_scene_title = project.storyboard.scenes[0].title

    subtitle = f"Adegan 1: {first_scene_title}" if first_scene_title else project.description

    try:
        # Run in thread pool
        result = await run_in_threadpool(
            render_service.render_demo_video_sync,
            title=project.title,
            subtitle=subtitle,
            duration_sec=req.duration_sec,
            fps=req.fps,
            project_id=project.id
        )
        return result
    except RenderValidationError as ve:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(ve))
    except RenderExecutionError as ee:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(ee))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected error: {str(e)}")
