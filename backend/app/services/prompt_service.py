from typing import Dict, Any, List
from app.models.project import VideoProject, Shot

class PromptService:
    @staticmethod
    def compile_shot_flow_prompt(shot: Shot, project_aspect: str = "9:16") -> Dict[str, Any]:
        """
        Compiles a structured prompt tailored for Google Flow video generation.
        """
        params = shot.flow_parameters
        
        # Build camera instruction string
        camera_map = {
            "static": "Static tripod shot, locked frame",
            "slow_push_in": "Slow cinematic push-in towards the focal subject",
            "slow_pull_back": "Slow cinematic pull-back revealing surrounding context",
            "pan_left": "Smooth continuous camera pan from right to left",
            "pan_right": "Smooth continuous camera pan from left to right",
            "tracking_shot": "Dynamic dolly tracking shot following the subject movement",
            "orbit_360": "Circular orbit around the subject maintaining central focus"
        }
        cam_desc = camera_map.get(shot.camera_movement, "Cinematic camera movement")
        
        # Composed Flow prompt
        full_prompt = (
            f"{shot.visual_prompt}. "
            f"Shot type: {shot.shot_type.replace('_', ' ')}. "
            f"Camera motion: {cam_desc}. "
            f"Lighting: {params.lighting}. "
            f"Optics: {params.lens}. "
            f"Cinematic color grade, documentary masterpiece, 8k resolution, photorealistic."
        )

        return {
            "shot_id": shot.shot_id,
            "shot_type": shot.shot_type,
            "duration_sec": shot.duration_sec,
            "aspect_ratio": params.aspect_ratio or project_aspect,
            "camera_motion": shot.camera_movement,
            "compiled_prompt": full_prompt,
            "negative_prompt": params.negative_prompt,
            "parameters": {
                "lighting": params.lighting,
                "lens": params.lens
            }
        }

    @classmethod
    def compile_project_flow_prompts(cls, project: VideoProject) -> List[Dict[str, Any]]:
        prompts = []
        for scene in project.storyboard.scenes:
            for shot in scene.shots:
                p = cls.compile_shot_flow_prompt(shot, project.aspect_ratio)
                p["scene_id"] = scene.scene_id
                p["scene_number"] = scene.scene_number
                p["scene_title"] = scene.title
                prompts.append(p)
        return prompts

prompt_service = PromptService()
