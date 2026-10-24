from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.services.storage_service import storage_service
from app.services.prompt_service import prompt_service

router = APIRouter(prefix="/api/projects/{project_id}/prompts", tags=["Prompt Studio"])

@router.get("/flow", response_model=List[Dict[str, Any]])
def get_project_flow_prompts(project_id: str):
    project = storage_service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")
    
    return prompt_service.compile_project_flow_prompts(project)

@router.get("/flow/export-markdown")
def export_flow_prompts_markdown(project_id: str):
    project = storage_service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")
    
    prompts = prompt_service.compile_project_flow_prompts(project)
    
    lines = [
        f"# Google Flow Prompt Batch — {project.title}",
        f"**Aspect Ratio:** {project.aspect_ratio} (1080x1920 Vertical)",
        f"**Total Shots:** {len(prompts)}",
        "---",
        ""
    ]
    
    for idx, p in enumerate(prompts, start=1):
        lines.append(f"### Shot {idx}: Scene {p['scene_number']} ({p['scene_title']}) - {p['shot_id']}")
        lines.append(f"- **Shot Type:** `{p['shot_type']}` | **Camera Motion:** `{p['camera_motion']}` | **Duration:** {p['duration_sec']}s")
        lines.append(f"- **Prompt:**")
        lines.append(f"> {p['compiled_prompt']}")
        lines.append(f"- **Negative Prompt:** `{p['negative_prompt']}`")
        lines.append("")
        
    return {
        "project_id": project.id,
        "filename": f"{project.id}_flow_prompts.md",
        "content": "\n".join(lines)
    }
