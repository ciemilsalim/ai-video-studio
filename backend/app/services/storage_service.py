import json
import re
import tempfile
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timezone
from app.config import PROJECTS_DIR
from app.models.project import VideoProject, ProjectCreateRequest, Storyboard, Scene, Shot

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[-\s]+", "-", text) or "project"

class StorageService:
    def __init__(self, projects_dir: Path = PROJECTS_DIR):
        self.projects_dir = projects_dir
        self.projects_dir.mkdir(parents=True, exist_ok=True)

    def _project_file(self, project_id: str) -> Path:
        return self.projects_dir / f"{project_id}.json"

    def list_projects(self) -> List[dict]:
        projects = []
        for file in sorted(self.projects_dir.glob("*.json"), key=lambda f: f.stat().st_mtime, reverse=True):
            try:
                with open(file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    projects.append({
                        "id": data.get("id"),
                        "title": data.get("title"),
                        "description": data.get("description", ""),
                        "aspect_ratio": data.get("aspect_ratio", "9:16"),
                        "scenes_count": len(data.get("storyboard", {}).get("scenes", [])),
                        "total_duration": data.get("storyboard", {}).get("total_estimated_duration_sec", 0.0),
                        "created_at": data.get("created_at"),
                        "updated_at": data.get("updated_at")
                    })
            except Exception:
                continue
        return projects

    def get_project(self, project_id: str) -> Optional[VideoProject]:
        filepath = self._project_file(project_id)
        if not filepath.is_file():
            return None
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
            return VideoProject(**data)

    def save_project(self, project: VideoProject) -> VideoProject:
        project.updated_at = datetime.now(timezone.utc).isoformat()
        filepath = self._project_file(project.id)
        
        # Atomic write via temp file
        temp_file = filepath.with_suffix(".tmp")
        with open(temp_file, "w", encoding="utf-8") as f:
            json.dump(project.model_dump(), f, indent=2, ensure_ascii=False)
        temp_file.replace(filepath)
        return project

    def create_project(self, req: ProjectCreateRequest) -> VideoProject:
        base_id = slugify(req.title)
        project_id = base_id
        counter = 1
        while self._project_file(project_id).exists():
            project_id = f"{base_id}-{counter}"
            counter += 1

        width, height = (1080, 1920) if req.aspect_ratio == "9:16" else (1920, 1080)
        
        # Initial starter scene
        initial_shot = Shot(
            shot_id="shot-1",
            shot_type="wide_angle",
            camera_movement="slow_push_in",
            visual_prompt=f"Cinematic wide shot establishing {req.title}, highly detailed documentary atmosphere",
            duration_sec=4.0
        )
        initial_scene = Scene(
            scene_id="scene-1",
            scene_number=1,
            title="Pembuka / Hook",
            narration_text=f"Dalam rekaman sejarah ini, kita menyaksikan awal mula {req.title}.",
            shots=[initial_shot]
        )
        storyboard = Storyboard(
            version="1.0.0",
            total_estimated_duration_sec=4.0,
            scenes=[initial_scene]
        )

        project = VideoProject(
            id=project_id,
            title=req.title,
            description=req.description or "",
            aspect_ratio=req.aspect_ratio,
            resolution={"width": width, "height": height},
            storyboard=storyboard
        )
        if req.voice:
            project.settings.voice = req.voice

        return self.save_project(project)

    def delete_project(self, project_id: str) -> bool:
        filepath = self._project_file(project_id)
        if filepath.is_file():
            filepath.unlink()
            return True
        return False

storage_service = StorageService()
