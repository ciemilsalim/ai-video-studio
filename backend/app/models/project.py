import os
from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime, timezone

class FlowParameters(BaseModel):
    lighting: str = "cinematic dramatic lighting"
    lens: str = "35mm anamorphic"
    aspect_ratio: str = "9:16"
    negative_prompt: str = "low quality, cartoon, blurry, distorted"

class MotionGraphic(BaseModel):
    type: Literal["none", "titlecard", "lower_third", "quote_box", "statistic_callout"] = "none"
    headline: Optional[str] = None
    subtext: Optional[str] = None

class MotionOverlay(BaseModel):
    overlay_id: str
    scene_id: str
    template_id: Literal["kinetic_title", "stat_card", "timeline_event", "investigation_hud"]
    start_time: float = Field(default=0.0, ge=0.0)
    duration: float = Field(default=3.0, gt=0.0)
    layer: int = Field(default=1, ge=1)
    position: Literal["center", "bottom", "top", "top_left", "bottom_left", "center_left"] = "center"
    style: Dict[str, Any] = Field(default_factory=dict)
    animation_in: Literal["fade", "slide_up", "wipe_right", "glitch_in"] = "fade"
    animation_out: Literal["fade", "slide_down", "wipe_left", "none"] = "fade"
    content: Dict[str, Any] = Field(default_factory=dict)
    enabled: bool = True

class OverlayCreateRequest(BaseModel):
    template_id: Literal["kinetic_title", "stat_card", "timeline_event", "investigation_hud"]
    start_time: float = Field(default=0.0, ge=0.0)
    duration: float = Field(default=3.0, gt=0.0)
    layer: int = Field(default=1, ge=1)
    position: Literal["center", "bottom", "top", "top_left", "bottom_left", "center_left"] = "center"
    style: Optional[Dict[str, Any]] = None
    animation_in: Literal["fade", "slide_up", "wipe_right", "glitch_in"] = "fade"
    animation_out: Literal["fade", "slide_down", "wipe_left", "none"] = "fade"
    content: Dict[str, Any] = Field(default_factory=dict)
    enabled: bool = True

class OverlayUpdateRequest(BaseModel):
    template_id: Optional[Literal["kinetic_title", "stat_card", "timeline_event", "investigation_hud"]] = None
    start_time: Optional[float] = Field(default=None, ge=0.0)
    duration: Optional[float] = Field(default=None, gt=0.0)
    layer: Optional[int] = Field(default=None, ge=1)
    position: Optional[Literal["center", "bottom", "top", "top_left", "bottom_left", "center_left"]] = None
    style: Optional[Dict[str, Any]] = None
    animation_in: Optional[Literal["fade", "slide_up", "wipe_right", "glitch_in"]] = None
    animation_out: Optional[Literal["fade", "slide_down", "wipe_left", "none"]] = None
    content: Optional[Dict[str, Any]] = None
    enabled: Optional[bool] = None

class Shot(BaseModel):
    shot_id: str
    shot_type: Literal[
        "close_up",
        "medium_shot",
        "wide_angle",
        "drone_aerial",
        "macro_detail",
        "pov"
    ] = "medium_shot"
    camera_movement: Literal[
        "static",
        "slow_push_in",
        "slow_pull_back",
        "pan_left",
        "pan_right",
        "tracking_shot",
        "orbit_360"
    ] = "slow_push_in"
    visual_prompt: str
    flow_parameters: FlowParameters = Field(default_factory=FlowParameters)
    duration_sec: float = Field(default=4.0, ge=1.0, le=60.0)
    motion_graphic: MotionGraphic = Field(default_factory=MotionGraphic)
    asset_path: Optional[str] = None

class VisualAsset(BaseModel):
    asset_id: str
    project_id: str
    scene_id: Optional[str] = None
    asset_type: Literal["footage", "image_reference", "thumbnail", "placeholder"] = "footage"
    filename: str
    file_path: str
    mime_type: str = "video/mp4"
    size_bytes: int = 0
    width: Optional[int] = None
    height: Optional[int] = None
    duration_sec: Optional[float] = None
    fps: Optional[float] = None
    codec: Optional[str] = None
    source_type: Literal["local_import", "generated", "placeholder"] = "local_import"
    validation_status: Literal["valid", "invalid", "pending"] = "valid"
    thumbnail_path: Optional[str] = None
    thumbnail_url: Optional[str] = None
    web_url: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class AssetAttachRequest(BaseModel):
    scene_id: Optional[str] = None

class Scene(BaseModel):
    scene_id: str
    scene_number: int = Field(ge=1)
    title: str
    narration_text: Optional[str] = ""
    target_duration_seconds: float = Field(default=4.0, ge=1.0, le=120.0)
    visual_prompt: Optional[str] = ""
    asset_id: Optional[str] = None
    footage_path: Optional[str] = None
    narration_audio_path: Optional[str] = None
    narration_audio_duration_sec: Optional[float] = None
    production_status: Literal["draft", "narrated", "footage_ready", "assembled", "ready"] = "draft"
    visual_status: Literal["ready", "processing", "missing", "failed"] = "missing"
    visual_job_id: Optional[str] = None
    duration_mode: Literal["loop", "freeze_frame", "fit_scene"] = "loop"
    motion_overlays: List[MotionOverlay] = Field(default_factory=list)
    shots: List[Shot] = Field(default_factory=list)

    def model_post_init(self, __context):
        # Auto-detect visual_status from footage_path if not explicitly set
        if self.footage_path and os.path.isfile(self.footage_path):
            self.visual_status = "ready"
        elif not self.footage_path and self.visual_status == "ready":
            self.visual_status = "missing"

        # Auto-sync visual_prompt from shots if empty
        if self.shots and not self.visual_prompt:
            self.visual_prompt = self.shots[0].visual_prompt
        # If shots empty and visual_prompt provided, generate default shot
        if not self.shots and self.visual_prompt:
            self.shots = [
                Shot(
                    shot_id=f"{self.scene_id}-shot1",
                    visual_prompt=self.visual_prompt,
                    duration_sec=self.target_duration_seconds
                )
            ]

class SceneCreateRequest(BaseModel):
    title: str = Field(..., min_length=1)
    narration_text: Optional[str] = ""
    target_duration_seconds: float = Field(default=4.0, ge=1.0, le=120.0)
    visual_prompt: Optional[str] = ""
    footage_path: Optional[str] = None
    asset_id: Optional[str] = None
    duration_mode: Optional[Literal["loop", "freeze_frame", "fit_scene"]] = "loop"

class SceneUpdateRequest(BaseModel):
    title: Optional[str] = None
    narration_text: Optional[str] = None
    target_duration_seconds: Optional[float] = None
    visual_prompt: Optional[str] = None
    footage_path: Optional[str] = None
    asset_id: Optional[str] = None
    duration_mode: Optional[Literal["loop", "freeze_frame", "fit_scene"]] = None
    production_status: Optional[Literal["draft", "narrated", "footage_ready", "assembled", "ready"]] = None
    visual_status: Optional[Literal["ready", "processing", "missing", "failed"]] = None
    visual_job_id: Optional[str] = None
    motion_overlays: Optional[List[MotionOverlay]] = None

class StoryboardReorderRequest(BaseModel):
    scene_ids: List[str]

class Storyboard(BaseModel):
    version: str = "1.0.0"
    total_estimated_duration_sec: float = 0.0
    scenes: List[Scene] = Field(default_factory=list)

class ProjectSettings(BaseModel):
    voice: str = "id-ID-ArdiNeural"
    bgm_volume: float = Field(default=0.15, ge=0.0, le=1.0)
    ducking_volume: float = Field(default=0.04, ge=0.0, le=1.0)
    motion_graphics_style: Literal["documentary_modern", "cinematic_noir", "minimalist_bold"] = "documentary_modern"

class Resolution(BaseModel):
    width: int = 1080
    height: int = 1920

class VideoProject(BaseModel):
    id: str
    title: str
    description: Optional[str] = ""
    aspect_ratio: Literal["9:16", "16:9"] = "9:16"
    resolution: Resolution = Field(default_factory=Resolution)
    fps: int = 30
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    settings: ProjectSettings = Field(default_factory=ProjectSettings)
    storyboard: Storyboard = Field(default_factory=Storyboard)
    assets: List[VisualAsset] = Field(default_factory=list)

class ProjectCreateRequest(BaseModel):
    title: str
    description: Optional[str] = ""
    aspect_ratio: Literal["9:16", "16:9"] = "9:16"
    voice: Optional[str] = "id-ID-ArdiNeural"
