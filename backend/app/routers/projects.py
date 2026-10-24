from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.models.project import VideoProject, ProjectCreateRequest
from app.services.storage_service import storage_service

router = APIRouter(prefix="/api/projects", tags=["Projects"])

@router.get("", response_model=List[Dict[str, Any]])
def list_projects():
    return storage_service.list_projects()

@router.post("", response_model=VideoProject)
def create_project(req: ProjectCreateRequest):
    return storage_service.create_project(req)

@router.get("/{project_id}", response_model=VideoProject)
def get_project(project_id: str):
    project = storage_service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")
    return project

@router.put("/{project_id}", response_model=VideoProject)
def update_project(project_id: str, project_update: VideoProject):
    existing = storage_service.get_project(project_id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")
    
    # Recalculate total estimated duration
    total_dur = 0.0
    for sc in project_update.storyboard.scenes:
        for sh in sc.shots:
            total_dur += sh.duration_sec
    project_update.storyboard.total_estimated_duration_sec = round(total_dur, 2)

    return storage_service.save_project(project_update)

@router.delete("/{project_id}")
def delete_project(project_id: str):
    success = storage_service.delete_project(project_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")
    return {"status": "success", "message": f"Project '{project_id}' deleted successfully"}
