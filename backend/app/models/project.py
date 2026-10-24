from typing import List, Optional, Literal
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

class Scene(BaseModel):
    scene_id: str
    scene_number: int = Field(ge=1)
    title: str
    narration_text: Optional[str] = ""
    shots: List[Shot] = Field(default_factory=list)

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

class ProjectCreateRequest(BaseModel):
    title: str
    description: Optional[str] = ""
    aspect_ratio: Literal["9:16", "16:9"] = "9:16"
    voice: Optional[str] = "id-ID-ArdiNeural"
