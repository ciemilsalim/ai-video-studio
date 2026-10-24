import os
import re
import uuid
import subprocess
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from PIL import Image, ImageDraw, ImageFont
import cv2

from app.config import RENDERS_DIR, TEMP_DIR, resolve_ffmpeg_binary

class RenderServiceError(Exception):
    pass

class RenderValidationError(RenderServiceError):
    pass

class RenderExecutionError(RenderServiceError):
    pass

class RenderService:
    def __init__(self, renders_dir: Path = RENDERS_DIR, temp_dir: Path = TEMP_DIR):
        self.renders_dir = renders_dir
        self.temp_dir = temp_dir
        self.renders_dir.mkdir(parents=True, exist_ok=True)
        self.temp_dir.mkdir(parents=True, exist_ok=True)

    def validate_render_params(
        self,
        title: str,
        duration_sec: float = 5.0,
        width: int = 1080,
        height: int = 1920,
        fps: int = 30
    ) -> None:
        if not title or not title.strip():
            raise RenderValidationError("Judul video (title) tidak boleh kosong.")
        
        if not (5.0 <= duration_sec <= 10.0):
            raise RenderValidationError(f"Durasi render demo harus antara 5.0 hingga 10.0 detik. Diterima: {duration_sec}s")
        
        if width != 1080 or height != 1920:
            raise RenderValidationError(f"Format vertikal yang didukung adalah 1080x1920. Diterima: {width}x{height}")
            
        if fps not in [24, 30, 60]:
            raise RenderValidationError(f"Frame rate (FPS) harus bernilai 24, 30, atau 60. Diterima: {fps}")

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

    def generate_graphic_overlay(
        self,
        title: str,
        subtitle: Optional[str] = "AI VIDEO STUDIO • DEMO VERTICAL PREVIEW",
        badge: Optional[str] = "1080x1920 • 9:16 VERTICAL",
        width: int = 1080,
        height: int = 1920
    ) -> Path:
        """
        Generates a crisp, deterministic 1080x1920 RGBA overlay image with:
        - Semi-transparent glassmorphism lower card
        - Indigo/cyan accent bounding bar
        - Title & Subtitle typography
        - Format & timestamp badge
        """
        overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)

        # Card container dimensions (placed in upper-middle or lower center)
        card_w = width - 120
        card_h = 420
        card_x = 60
        card_y = height // 2 - card_h // 2

        # 1. Glassmorphism backdrop box
        draw.rounded_rectangle(
            [card_x, card_y, card_x + card_w, card_y + card_h],
            radius=24,
            fill=(15, 23, 42, 210),
            outline=(99, 102, 241, 140),
            width=2
        )

        # 2. Top accent indicator bar (Brand gradient simulation)
        draw.rounded_rectangle(
            [card_x + 40, card_y + 36, card_x + 160, card_y + 44],
            radius=4,
            fill=(99, 102, 241, 255)
        )

        # 3. Badge Text
        font_badge = self._get_font(24)
        draw.text(
            (card_x + 180, card_y + 28),
            badge or "9:16 DOCUMENTARY PREVIEW",
            fill=(56, 189, 248, 255),
            font=font_badge
        )

        # 4. Main Title
        font_title = self._get_font(52)
        # Wrap title if too long
        display_title = title if len(title) <= 32 else title[:30] + "..."
        draw.text(
            (card_x + 40, card_y + 90),
            display_title,
            fill=(248, 250, 252, 255),
            font=font_title
        )

        # 5. Subtitle / Synopsis
        font_sub = self._get_font(28)
        sub_text = subtitle or "Produced deterministically with local FFmpeg engine"
        if len(sub_text) > 48:
            sub_text = sub_text[:46] + "..."
        draw.text(
            (card_x + 40, card_y + 175),
            sub_text,
            fill=(148, 163, 184, 255),
            font=font_sub
        )

        # 6. Separator line
        draw.line(
            [(card_x + 40, card_y + 240), (card_x + card_w - 40, card_y + 240)],
            fill=(255, 255, 255, 30),
            width=1
        )

        # 7. Decorative metadata badges (Resolution, CFR, Engine, Date)
        font_meta = self._get_font(22)
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        meta_str = f"FFmpeg 7.1  |  H.264 / AAC Stereo  |  {now_str}"
        draw.text(
            (card_x + 40, card_y + 265),
            meta_str,
            fill=(100, 116, 139, 255),
            font=font_meta
        )

        # 8. Subtle watermark tag at bottom of screen
        watermark_text = "AI Video Studio  •  Documentary Automation Engine"
        draw.text(
            (width // 2 - 240, height - 120),
            watermark_text,
            fill=(148, 163, 184, 180),
            font=font_meta
        )

        # Save to temp overlay
        overlay_id = uuid.uuid4().hex[:12]
        overlay_path = self.temp_dir / f"overlay_{overlay_id}.png"
        overlay.save(overlay_path, format="PNG")
        return overlay_path

    def render_demo_video_sync(
        self,
        title: str,
        subtitle: Optional[str] = None,
        duration_sec: float = 5.0,
        fps: int = 30,
        project_id: Optional[str] = None,
        ffmpeg_override: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Synchronous core render engine:
        1. Validates inputs
        2. Discovers FFmpeg binary
        3. Creates deterministic graphic overlay
        4. Runs FFmpeg subprocess with argument list (NO shell=True)
        5. Verifies output video integrity and streams
        """
        width = 1080
        height = 1920
        self.validate_render_params(title=title, duration_sec=duration_sec, width=width, height=height, fps=fps)

        ffmpeg_bin = ffmpeg_override or resolve_ffmpeg_binary()
        if not ffmpeg_bin or not os.path.exists(ffmpeg_bin):
            raise RenderExecutionError("FFmpeg binary tidak ditemukan pada sistem atau package imageio-ffmpeg.")

        overlay_path = self.generate_graphic_overlay(
            title=title,
            subtitle=subtitle,
            width=width,
            height=height
        )

        timestamp_slug = datetime.now().strftime("%Y%m%d_%H%M%S")
        clean_title_slug = re.sub(r"[^\w-]", "", title.lower().replace(" ", "_"))[:20]
        out_filename = f"demo_{clean_title_slug}_{timestamp_slug}.mp4"
        output_path = self.renders_dir / out_filename

        # Construct safe FFmpeg argument list
        # Background: dark slate #0b1120 with subtle documentary tone
        cmd = [
            ffmpeg_bin,
            "-y",
            "-f", "lavfi",
            "-i", f"color=c=0x0b1120:s={width}x{height}:d={duration_sec}:r={fps}",
            "-loop", "1",
            "-t", str(duration_sec),
            "-i", str(overlay_path),
            "-f", "lavfi",
            "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
            "-filter_complex", "[0:v][1:v]overlay=0:0[v]",
            "-map", "[v]",
            "-map", "2:a",
            "-c:v", "libx264",
            "-preset", "fast",
            "-pix_fmt", "yuv420p",
            "-r", str(fps),
            "-c:a", "aac",
            "-b:a", "192k",
            "-shortest",
            str(output_path)
        ]

        try:
            res = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=60
            )
            if res.returncode != 0:
                raise RenderExecutionError(f"FFmpeg rendering gagal (exit code {res.returncode}): {res.stderr.strip()[:400]}")
        except subprocess.TimeoutExpired as te:
            raise RenderExecutionError("Proses rendering FFmpeg melampaui batas waktu (timeout 60 detik).") from te
        finally:
            # Safely remove temp overlay
            if overlay_path.exists():
                try:
                    overlay_path.unlink()
                except Exception:
                    pass

        # Verify output existence and integrity
        verification = self.verify_video_file(output_path, ffmpeg_bin=ffmpeg_bin)
        if not verification.get("valid"):
            raise RenderExecutionError(f"Verifikasi video gagal: {verification.get('error')}")

        return {
            "status": "success",
            "project_id": project_id,
            "title": title,
            "filename": out_filename,
            "output_path": str(output_path),
            "web_url": f"/api/renders/{out_filename}",
            "verification": verification,
            "rendered_at": datetime.now(timezone.utc).isoformat()
        }

    def verify_video_file(self, video_path: Path, ffmpeg_bin: Optional[str] = None) -> Dict[str, Any]:
        """
        Performs dual verification on rendered video:
        1. OpenCV frame and stream inspection (width, height, fps, frame count, duration).
        2. FFmpeg stderr stream descriptor parse (codec, audio presence).
        """
        if not video_path.is_file():
            return {"valid": False, "error": f"File tidak ditemukan di disk: {video_path}"}
        
        size_bytes = video_path.stat().st_size
        if size_bytes <= 1024:
            return {"valid": False, "error": f"File video terlalu kecil atau kosong ({size_bytes} bytes)."}

        # Probe 1: OpenCV VideoCapture
        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            return {"valid": False, "error": "OpenCV gagal membuka container video MP4."}

        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = float(cap.get(cv2.CAP_PROP_FPS))
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration_sec = round(frame_count / fps, 2) if fps > 0 else 0.0
        cap.release()

        # Probe 2: FFmpeg inspection
        has_video_stream = False
        has_audio_stream = False
        codec_name = "unknown"

        fb = ffmpeg_bin or resolve_ffmpeg_binary()
        if fb and os.path.exists(fb):
            try:
                probe_res = subprocess.run(
                    [fb, "-i", str(video_path)],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    timeout=5
                )
                stderr_text = probe_res.stderr
                if "Video: h264" in stderr_text:
                    has_video_stream = True
                    codec_name = "h264"
                elif "Video:" in stderr_text:
                    has_video_stream = True
                    codec_name = "detected"
                
                if "Audio: aac" in stderr_text or "Audio:" in stderr_text:
                    has_audio_stream = True
            except Exception:
                pass
        else:
            has_video_stream = (width > 0 and height > 0)

        # Integrity assertion
        is_valid = (
            width == 1080 and
            height == 1920 and
            fps > 0 and
            duration_sec >= 4.9 and
            size_bytes > 10000
        )

        return {
            "valid": is_valid,
            "file_size_bytes": size_bytes,
            "width": width,
            "height": height,
            "aspect_ratio": "9:16",
            "fps": fps,
            "frame_count": frame_count,
            "duration_sec": duration_sec,
            "codec": codec_name,
            "has_video_stream": has_video_stream,
            "has_audio_stream": has_audio_stream,
            "error": None if is_valid else "Dimensi atau durasi tidak memenuhi syarat (1080x1920, >=5s)."
        }

render_service = RenderService()
