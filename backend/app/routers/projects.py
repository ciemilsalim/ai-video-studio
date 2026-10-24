import uuid
from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any, Optional
from starlette.concurrency import run_in_threadpool

from app.models.project import (
    VideoProject,
    ProjectCreateRequest,
    Scene,
    SceneCreateRequest,
    SceneUpdateRequest,
    StoryboardReorderRequest
)
from app.services.storage_service import storage_service
from app.services.tts_service import tts_service, TTSValidationError, TTSExecutionError

router = APIRouter(prefix="/api/projects", tags=["Projects"])

def recalculate_storyboard_duration(project: VideoProject) -> None:
    total_dur = 0.0
    for idx, sc in enumerate(project.storyboard.scenes, start=1):
        sc.scene_number = idx
        # Calculate shot sum if shots present
        shot_sum = sum(s.duration_sec for s in sc.shots) if sc.shots else 0.0
        base_dur = max(sc.target_duration_seconds, shot_sum) if shot_sum > 0 else sc.target_duration_seconds
        
        # If narration audio exists and duration is known, use it
        if sc.narration_audio_duration_sec and sc.narration_audio_duration_sec > 0:
            sc_dur = max(sc.narration_audio_duration_sec + 0.5, base_dur)
        else:
            sc_dur = base_dur
            
        sc.target_duration_seconds = sc_dur
        total_dur += sc_dur
    project.storyboard.total_estimated_duration_sec = round(total_dur, 2)

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
    
    recalculate_storyboard_duration(project_update)
    return storage_service.save_project(project_update)

@router.delete("/{project_id}")
def delete_project(project_id: str):
    success = storage_service.delete_project(project_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")
    return {"status": "success", "message": f"Project '{project_id}' deleted successfully"}


# -----------------------------------------------------------------------------
# STORYBOARD SCENE MANAGEMENT
# -----------------------------------------------------------------------------

@router.post("/{project_id}/storyboard/scenes", response_model=VideoProject)
def add_storyboard_scene(project_id: str, req: SceneCreateRequest):
    project = storage_service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")

    new_scene_number = len(project.storyboard.scenes) + 1
    new_scene_id = f"scene-{uuid.uuid4().hex[:6]}"

    new_scene = Scene(
        scene_id=new_scene_id,
        scene_number=new_scene_number,
        title=req.title,
        narration_text=req.narration_text or "",
        target_duration_seconds=req.target_duration_seconds,
        visual_prompt=req.visual_prompt or "",
        footage_path=req.footage_path,
        production_status="draft"
    )

    project.storyboard.scenes.append(new_scene)
    recalculate_storyboard_duration(project)
    return storage_service.save_project(project)

@router.put("/{project_id}/storyboard/scenes/{scene_id}", response_model=VideoProject)
def update_storyboard_scene(project_id: str, scene_id: str, req: SceneUpdateRequest):
    project = storage_service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")

    scene = next((s for s in project.storyboard.scenes if s.scene_id == scene_id), None)
    if not scene:
        raise HTTPException(status_code=404, detail=f"Adegan '{scene_id}' tidak ditemukan dalam storyboard.")

    if req.title is not None:
        scene.title = req.title
    if req.narration_text is not None:
        scene.narration_text = req.narration_text
    if req.target_duration_seconds is not None:
        scene.target_duration_seconds = req.target_duration_seconds
    if req.visual_prompt is not None:
        scene.visual_prompt = req.visual_prompt
    if req.footage_path is not None:
        scene.footage_path = req.footage_path
    if req.production_status is not None:
        scene.production_status = req.production_status

    recalculate_storyboard_duration(project)
    return storage_service.save_project(project)

@router.delete("/{project_id}/storyboard/scenes/{scene_id}", response_model=VideoProject)
def delete_storyboard_scene(project_id: str, scene_id: str):
    project = storage_service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")

    initial_len = len(project.storyboard.scenes)
    project.storyboard.scenes = [s for s in project.storyboard.scenes if s.scene_id != scene_id]

    if len(project.storyboard.scenes) == initial_len:
        raise HTTPException(status_code=404, detail=f"Adegan '{scene_id}' tidak ditemukan.")

    recalculate_storyboard_duration(project)
    return storage_service.save_project(project)

@router.post("/{project_id}/storyboard/reorder", response_model=VideoProject)
def reorder_storyboard_scenes(project_id: str, req: StoryboardReorderRequest):
    project = storage_service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")

    scene_map = {s.scene_id: s for s in project.storyboard.scenes}
    reordered: List[Scene] = []

    for sid in req.scene_ids:
        if sid in scene_map:
            reordered.append(scene_map[sid])

    # Append any remaining scenes that were not in reorder list
    for sc in project.storyboard.scenes:
        if sc.scene_id not in req.scene_ids:
            reordered.append(sc)

    project.storyboard.scenes = reordered
    recalculate_storyboard_duration(project)
    return storage_service.save_project(project)


# -----------------------------------------------------------------------------
# EDGE-TTS NARRATION ENDPOINTS
# -----------------------------------------------------------------------------

@router.post("/{project_id}/narration/scene/{scene_id}")
async def generate_scene_narration(project_id: str, scene_id: str):
    project = storage_service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")

    scene = next((s for s in project.storyboard.scenes if s.scene_id == scene_id), None)
    if not scene:
        raise HTTPException(status_code=404, detail=f"Adegan '{scene_id}' tidak ditemukan.")

    if not scene.narration_text or not scene.narration_text.strip():
        raise HTTPException(status_code=400, detail="Adegan ini belum memiliki teks narasi.")

    voice = project.settings.voice or "id-ID-ArdiNeural"

    try:
        res = await tts_service.synthesize_scene_narration(
            project_id=project.id,
            scene_id=scene.scene_id,
            text=scene.narration_text,
            voice=voice
        )

        # Update scene metadata persistently
        scene.narration_audio_path = res["audio_path"]
        scene.narration_audio_duration_sec = res["duration_sec"]
        scene.production_status = "narrated"
        recalculate_storyboard_duration(project)
        storage_service.save_project(project)

        return res
    except TTSValidationError as ve:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(ve))
    except TTSExecutionError as ee:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(ee))

@router.post("/{project_id}/narration/all")
async def generate_all_scenes_narration(project_id: str):
    project = storage_service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")

    voice = project.settings.voice or "id-ID-ArdiNeural"
    results = []
    errors = []

    for scene in project.storyboard.scenes:
        if not scene.narration_text or not scene.narration_text.strip():
            continue
        try:
            res = await tts_service.synthesize_scene_narration(
                project_id=project.id,
                scene_id=scene.scene_id,
                text=scene.narration_text,
                voice=voice
            )
            scene.narration_audio_path = res["audio_path"]
            scene.narration_audio_duration_sec = res["duration_sec"]
            scene.production_status = "narrated"
            results.append(res)
        except Exception as e:
            errors.append({"scene_id": scene.scene_id, "error": str(e)})

    recalculate_storyboard_duration(project)
    storage_service.save_project(project)

    return {
        "status": "completed",
        "processed_count": len(results),
        "results": results,
        "errors": errors
    }
