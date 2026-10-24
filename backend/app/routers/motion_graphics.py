import io
import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import Response

from app.models.project import MotionOverlay, OverlayCreateRequest, OverlayUpdateRequest
from app.services.storage_service import storage_service
from app.services.motion_graphics_service import (
    motion_graphics_service,
    MotionGraphicsValidationError,
    MotionGraphicsError
)

router = APIRouter(prefix="/api/motion-graphics", tags=["Motion Graphics"])

@router.get("/templates")
def list_templates() -> List[Dict[str, Any]]:
    return motion_graphics_service.get_available_templates()

@router.get("/preview")
def preview_overlay_frame(
    template_id: str = Query("kinetic_title"),
    t: float = Query(0.5, ge=0.0),
    duration: float = Query(3.0, gt=0.0),
    position: str = Query("center"),
    title: Optional[str] = None,
    subtitle: Optional[str] = None,
    tag: Optional[str] = None,
    value: Optional[str] = None,
    label: Optional[str] = None,
    unit: Optional[str] = None,
    source: Optional[str] = None,
    date_or_period: Optional[str] = None,
    event_title: Optional[str] = None,
    location: Optional[str] = None,
    description: Optional[str] = None,
    coordinates_or_location: Optional[str] = None,
    evidence_code: Optional[str] = None,
    classification: Optional[str] = None,
    timestamp_label: Optional[str] = None
):
    if template_id not in motion_graphics_service.TEMPLATES:
        raise HTTPException(
            status_code=400,
            detail=f"Template '{template_id}' tidak dikenal. Pilihan: {list(motion_graphics_service.TEMPLATES.keys())}"
        )

    # Use defaults if user didn't specify
    default_content = motion_graphics_service.TEMPLATES[template_id]["default_content"]
    content = dict(default_content)

    if title: content["title"] = title
    if subtitle is not None: content["subtitle"] = subtitle
    if tag: content["tag"] = tag
    if value: content["value"] = value
    if label: content["label"] = label
    if unit is not None: content["unit"] = unit
    if source is not None: content["source"] = source
    if date_or_period: content["date_or_period"] = date_or_period
    if event_title: content["event_title"] = event_title
    if location is not None: content["location"] = location
    if description is not None: content["description"] = description
    if coordinates_or_location: content["coordinates_or_location"] = coordinates_or_location
    if evidence_code: content["evidence_code"] = evidence_code
    if classification is not None: content["classification"] = classification
    if timestamp_label: content["timestamp_label"] = timestamp_label

    frame_img = motion_graphics_service.render_overlay_frame(
        template_id=template_id,
        content=content,
        position=position,
        animation_in="fade",
        animation_out="fade",
        t=t,
        duration=duration
    )

    buf = io.BytesIO()
    frame_img.save(buf, format="PNG")
    buf.seek(0)
    return Response(content=buf.getvalue(), media_type="image/png")

# Scene Overlay Management
overlay_router = APIRouter(prefix="/api/projects/{project_id}/scenes/{scene_id}/overlays", tags=["Motion Graphics"])

@overlay_router.get("", response_model=List[MotionOverlay])
def list_scene_overlays(project_id: str, scene_id: str):
    project = storage_service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Proyek '{project_id}' tidak ditemukan.")

    scene = next((s for s in project.storyboard.scenes if s.scene_id == scene_id), None)
    if not scene:
        raise HTTPException(status_code=404, detail=f"Adegan '{scene_id}' tidak ditemukan.")

    return scene.motion_overlays

@overlay_router.post("", response_model=MotionOverlay)
def add_scene_overlay(project_id: str, scene_id: str, req: OverlayCreateRequest):
    project = storage_service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Proyek '{project_id}' tidak ditemukan.")

    scene = next((s for s in project.storyboard.scenes if s.scene_id == scene_id), None)
    if not scene:
        raise HTTPException(status_code=404, detail=f"Adegan '{scene_id}' tidak ditemukan.")

    # Populate defaults from template if content empty
    content = dict(req.content)
    if not content:
        content = dict(motion_graphics_service.TEMPLATES[req.template_id]["default_content"])

    overlay = MotionOverlay(
        overlay_id=f"mgo-{uuid.uuid4().hex[:8]}",
        scene_id=scene_id,
        template_id=req.template_id,
        start_time=req.start_time,
        duration=req.duration,
        layer=req.layer,
        position=req.position,
        style=req.style or {},
        animation_in=req.animation_in,
        animation_out=req.animation_out,
        content=content,
        enabled=req.enabled
    )

    try:
        motion_graphics_service.validate_overlay(overlay, scene.target_duration_seconds)
    except MotionGraphicsValidationError as ve:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(ve))

    scene.motion_overlays.append(overlay)
    storage_service.save_project(project)
    return overlay

@overlay_router.put("/{overlay_id}", response_model=MotionOverlay)
def update_scene_overlay(project_id: str, scene_id: str, overlay_id: str, req: OverlayUpdateRequest):
    project = storage_service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Proyek '{project_id}' tidak ditemukan.")

    scene = next((s for s in project.storyboard.scenes if s.scene_id == scene_id), None)
    if not scene:
        raise HTTPException(status_code=404, detail=f"Adegan '{scene_id}' tidak ditemukan.")

    overlay = next((o for o in scene.motion_overlays if o.overlay_id == overlay_id), None)
    if not overlay:
        raise HTTPException(status_code=404, detail=f"Overlay '{overlay_id}' tidak ditemukan.")

    if req.template_id is not None:
        overlay.template_id = req.template_id
    if req.start_time is not None:
        overlay.start_time = req.start_time
    if req.duration is not None:
        overlay.duration = req.duration
    if req.layer is not None:
        overlay.layer = req.layer
    if req.position is not None:
        overlay.position = req.position
    if req.style is not None:
        overlay.style = req.style
    if req.animation_in is not None:
        overlay.animation_in = req.animation_in
    if req.animation_out is not None:
        overlay.animation_out = req.animation_out
    if req.content is not None:
        overlay.content = req.content
    if req.enabled is not None:
        overlay.enabled = req.enabled

    try:
        motion_graphics_service.validate_overlay(overlay, scene.target_duration_seconds)
    except MotionGraphicsValidationError as ve:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(ve))

    storage_service.save_project(project)
    return overlay

@overlay_router.delete("/{overlay_id}")
def delete_scene_overlay(project_id: str, scene_id: str, overlay_id: str):
    project = storage_service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Proyek '{project_id}' tidak ditemukan.")

    scene = next((s for s in project.storyboard.scenes if s.scene_id == scene_id), None)
    if not scene:
        raise HTTPException(status_code=404, detail=f"Adegan '{scene_id}' tidak ditemukan.")

    init_len = len(scene.motion_overlays)
    scene.motion_overlays = [o for o in scene.motion_overlays if o.overlay_id != overlay_id]

    if len(scene.motion_overlays) == init_len:
        raise HTTPException(status_code=404, detail=f"Overlay '{overlay_id}' tidak ditemukan.")

    storage_service.save_project(project)
    return {"status": "success", "message": f"Overlay '{overlay_id}' berhasil dihapus."}
