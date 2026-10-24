import os
import re
import uuid
import subprocess
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from PIL import Image, ImageDraw, ImageFont

from app.config import RENDERS_DIR, TEMP_DIR, resolve_ffmpeg_binary
from app.models.project import VideoProject, Scene
from app.services.render_service import render_service
from app.services.tts_service import tts_service

class AssemblyServiceError(Exception):
    pass

class AssemblyService:
    def __init__(self, renders_dir: Path = RENDERS_DIR, temp_dir: Path = TEMP_DIR):
        self.renders_dir = renders_dir
        self.temp_dir = temp_dir
        self.renders_dir.mkdir(parents=True, exist_ok=True)
        self.temp_dir.mkdir(parents=True, exist_ok=True)

    def _get_font(self, size: int) -> ImageFont.ImageFont:
        font_candidates = [
            "C:/Windows/Fonts/segoeui.ttf",
            "C:/Windows/Fonts/arial.ttf",
            "C:/Windows/Fonts/tahoma.ttf"
        ]
        for f in font_candidates:
            if os.path.exists(f):
                try:
                    return ImageFont.truetype(f, size=size)
                except Exception:
                    pass
        return ImageFont.load_default()

    def generate_scene_placeholder_card(
        self,
        scene: Scene,
        project_title: str,
        total_scenes: int,
        width: int = 1080,
        height: int = 1920
    ) -> Path:
        """
        Generates a deterministic 1080x1920 card when no user footage is provided.
        Clearly labels that footage is in placeholder/waiting status.
        Includes scene number, title, prompt, and narration subtitle.
        """
        img = Image.new("RGB", (width, height), (11, 17, 32)) # Deep cinematic slate
        draw = ImageDraw.Draw(img)

        # 1. Subtle background grid & accent shapes
        draw.rectangle([0, 0, width, 16], fill=(99, 102, 241)) # Top accent stripe
        draw.rectangle([0, height - 16, width, height], fill=(6, 182, 212)) # Bottom accent stripe

        # 2. Header Project Badge
        font_header = self._get_font(24)
        draw.text(
            (60, 60),
            f"AI VIDEO STUDIO  •  {project_title.upper()}",
            fill=(148, 163, 184),
            font=font_header
        )

        # 3. Central Container Card
        card_x = 60
        card_y = 280
        card_w = width - 120
        card_h = 920

        draw.rounded_rectangle(
            [card_x, card_y, card_x + card_w, card_y + card_h],
            radius=20,
            fill=(15, 23, 42),
            outline=(99, 102, 241),
            width=2
        )

        # Scene Tag
        font_tag = self._get_font(26)
        scene_tag = f"ADEGAN {scene.scene_number} DARI {total_scenes}  •  PLACEHOLDER FOOTAGE"
        draw.text((card_x + 40, card_y + 40), scene_tag, fill=(56, 189, 248), font=font_tag)

        # Scene Title
        font_title = self._get_font(48)
        title_disp = scene.title if len(scene.title) <= 28 else scene.title[:26] + "..."
        draw.text((card_x + 40, card_y + 90), title_disp, fill=(248, 250, 252), font=font_title)

        # Divider
        draw.line(
            [(card_x + 40, card_y + 170), (card_x + card_w - 40, card_y + 170)],
            fill=(255, 255, 255, 40),
            width=1
        )

        # Visual Prompt Section
        font_label = self._get_font(22)
        draw.text((card_x + 40, card_y + 195), "PROMPT SINEMATIK VISUAL (GOOGLE FLOW):", fill=(100, 116, 139), font=font_label)

        font_prompt = self._get_font(26)
        prompt_text = scene.visual_prompt or "Belum ada prompt visual. Klip menunggu footage asli pengguna."
        # Simple word wrap
        words = prompt_text.split()
        lines = []
        curr = ""
        for w in words:
            test = f"{curr} {w}".strip()
            if len(test) <= 38:
                curr = test
            else:
                lines.append(curr)
                curr = w
        if curr:
            lines.append(curr)

        y_offset = card_y + 235
        for line in lines[:8]:
            draw.text((card_x + 40, y_offset), line, fill=(203, 213, 225), font=font_prompt)
            y_offset += 38

        # Target duration & camera badge
        font_meta = self._get_font(22)
        meta_str = f"Target Durasi: {scene.target_duration_seconds}s  |  Rasio: 9:16 Vertikal  |  CFR 30 FPS"
        draw.text((card_x + 40, card_y + card_h - 70), meta_str, fill=(148, 163, 184), font=font_meta)

        # 4. Lower-third Subtitle Card (if narration exists)
        if scene.narration_text:
            sub_y = height - 420
            sub_h = 240
            draw.rounded_rectangle(
                [card_x, sub_y, card_x + card_w, sub_y + sub_h],
                radius=16,
                fill=(0, 0, 0, 230),
                outline=(255, 255, 255, 40),
                width=1
            )
            font_sub_label = self._get_font(20)
            draw.text((card_x + 30, sub_y + 20), "NARASI VOICE-OVER (SUBTITLE SINKRON):", fill=(251, 191, 36), font=font_sub_label)

            font_sub_text = self._get_font(28)
            sub_words = scene.narration_text.split()
            sub_lines = []
            s_curr = ""
            for sw in sub_words:
                s_test = f"{s_curr} {sw}".strip()
                if len(s_test) <= 36:
                    s_curr = s_test
                else:
                    sub_lines.append(s_curr)
                    s_curr = sw
            if s_curr:
                sub_lines.append(s_curr)

            sy_offset = sub_y + 60
            for s_line in sub_lines[:3]:
                draw.text((card_x + 30, sy_offset), f"\"{s_line}\"", fill=(255, 255, 255), font=font_sub_text)
                sy_offset += 40

        card_path = self.temp_dir / f"card_{scene.scene_id}_{uuid.uuid4().hex[:8]}.png"
        img.save(card_path, format="PNG")
        return card_path

    def assemble_scene_segment_sync(
        self,
        scene: Scene,
        project_title: str,
        total_scenes: int,
        ffmpeg_bin: str
    ) -> Path:
        """
        Renders a single scene segment normalized to 1080x1920, 30fps CFR, H.264, AAC stereo.
        """
        width = 1080
        height = 1920
        fps = 30

        # Determine actual scene duration
        duration_sec = float(scene.target_duration_seconds)
        narration_audio = None
        if scene.narration_audio_path and os.path.isfile(scene.narration_audio_path):
            narration_audio = Path(scene.narration_audio_path)
            measured_dur = tts_service.get_audio_duration_sec(narration_audio)
            if measured_dur > 0:
                duration_sec = max(measured_dur + 0.5, duration_sec)

        out_segment_path = self.temp_dir / f"seg_{scene.scene_id}_{uuid.uuid4().hex[:8]}.mp4"

        # Determine visual source
        has_real_footage = False
        if scene.footage_path and os.path.isfile(scene.footage_path):
            has_real_footage = True

        temp_placeholder = None

        if has_real_footage:
            # Scale & crop user footage to 1080x1920 without distortion
            video_input_args = [
                "-stream_loop", "-1", # loop if footage is shorter than scene
                "-i", str(scene.footage_path)
            ]
            filter_v = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1[v]"
        else:
            temp_placeholder = self.generate_scene_placeholder_card(
                scene=scene,
                project_title=project_title,
                total_scenes=total_scenes,
                width=width,
                height=height
            )
            video_input_args = [
                "-loop", "1",
                "-i", str(temp_placeholder)
            ]
            filter_v = "scale=1080:1920,setsar=1[v]"

        # Determine audio source
        if narration_audio:
            audio_input_args = [
                "-i", str(narration_audio)
            ]
            filter_a = f"[1:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,apad=whole_dur={duration_sec}[a]"
        else:
            audio_input_args = [
                "-f", "lavfi",
                "-i", "anullsrc=channel_layout=stereo:sample_rate=48000"
            ]
            filter_a = f"[1:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,atrim=0:{duration_sec}[a]"

        cmd = [
            ffmpeg_bin,
            "-y"
        ] + video_input_args + audio_input_args + [
            "-filter_complex", f"{filter_v};{filter_a}",
            "-map", "[v]",
            "-map", "[a]",
            "-t", str(duration_sec),
            "-c:v", "libx264",
            "-preset", "fast",
            "-pix_fmt", "yuv420p",
            "-r", str(fps),
            "-c:a", "aac",
            "-b:a", "192k",
            str(out_segment_path)
        ]

        try:
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=90)
            if res.returncode != 0:
                raise AssemblyServiceError(f"Render segmen adegan {scene.scene_number} gagal: {res.stderr[:400]}")
        finally:
            if temp_placeholder and temp_placeholder.exists():
                try:
                    temp_placeholder.unlink()
                except Exception:
                    pass

        return out_segment_path

    def assemble_project_video_sync(
        self,
        project: VideoProject,
        ffmpeg_override: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Coordinates full multi-scene assembly:
        1. Renders normalized segments for all scenes
        2. Merges them with FFmpeg concat
        3. Verifies output video integrity
        """
        scenes = project.storyboard.scenes
        if not scenes:
            raise AssemblyServiceError("Storyboard tidak memiliki adegan untuk dirakit.")

        ffmpeg_bin = ffmpeg_override or resolve_ffmpeg_binary()
        if not ffmpeg_bin or not os.path.exists(ffmpeg_bin):
            raise AssemblyServiceError("FFmpeg binary tidak ditemukan pada sistem.")

        segment_paths: List[Path] = []
        try:
            # 1. Render all scene segments
            for sc in scenes:
                seg_path = self.assemble_scene_segment_sync(
                    scene=sc,
                    project_title=project.title,
                    total_scenes=len(scenes),
                    ffmpeg_bin=ffmpeg_bin
                )
                segment_paths.append(seg_path)

            # 2. Build concat manifest
            manifest_path = self.temp_dir / f"concat_{project.id}_{uuid.uuid4().hex[:8]}.txt"
            with open(manifest_path, "w", encoding="utf-8") as f:
                for sp in segment_paths:
                    # FFmpeg concat requires forward slashes or escaped backslashes
                    clean_p = str(sp).replace("\\", "/")
                    f.write(f"file '{clean_p}'\n")

            # 3. Output path
            timestamp_slug = datetime.now().strftime("%Y%m%d_%H%M%S")
            clean_proj_slug = re.sub(r"[^\w-]", "", project.id)[:20]
            out_filename = f"assembled_{clean_proj_slug}_{timestamp_slug}.mp4"
            final_output_path = self.renders_dir / out_filename

            # 4. Concat all segments
            concat_cmd = [
                ffmpeg_bin,
                "-y",
                "-f", "concat",
                "-safe", "0",
                "-i", str(manifest_path),
                "-c", "copy",
                str(final_output_path)
            ]

            res = subprocess.run(concat_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=120)
            if res.returncode != 0:
                raise AssemblyServiceError(f"Penggabungan segmen video (concat) gagal: {res.stderr[:400]}")

            if manifest_path.exists():
                try:
                    manifest_path.unlink()
                except Exception:
                    pass

        finally:
            # Cleanup intermediate segments
            for sp in segment_paths:
                if sp.exists():
                    try:
                        sp.unlink()
                    except Exception:
                        pass

        # 5. Dual Verification on final assembled video
        verification = render_service.verify_video_file(final_output_path, ffmpeg_bin=ffmpeg_bin)
        if not verification.get("valid"):
            raise AssemblyServiceError(f"Verifikasi video hasil rakitan gagal: {verification.get('error')}")

        return {
            "status": "success",
            "project_id": project.id,
            "project_title": project.title,
            "scenes_count": len(scenes),
            "filename": out_filename,
            "output_path": str(final_output_path),
            "web_url": f"/api/renders/{out_filename}",
            "verification": verification,
            "assembled_at": datetime.now(timezone.utc).isoformat()
        }

assembly_service = AssemblyService()
