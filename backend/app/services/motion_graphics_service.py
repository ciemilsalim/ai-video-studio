import os
import re
import shutil
import tempfile
import textwrap
import subprocess
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from PIL import Image, ImageDraw, ImageFont

from app.config import TEMP_DIR, resolve_ffmpeg_binary
from app.models.project import MotionOverlay

class MotionGraphicsError(Exception):
    pass

class MotionGraphicsValidationError(MotionGraphicsError):
    pass

class MotionGraphicsService:
    TEMPLATES = {
        "kinetic_title": {
            "template_id": "kinetic_title",
            "name": "Kinetic Titlecard",
            "description": "Judul investigasi utama dengan animasi reveal, aksen garis merah, dan tag arsip.",
            "default_content": {
                "title": "PERADABAN YANG HILANG",
                "subtitle": "Arsip Forensik & Ekskavasi Situs Megalitik",
                "tag": "ARSIP INVESTIGASI // KASUS #01"
            },
            "required_fields": ["title"]
        },
        "stat_card": {
            "template_id": "stat_card",
            "name": "Investigative Stat Card",
            "description": "Kartu statistik angka besar, label pengukuran, unit, dan catatan sumber terverifikasi.",
            "default_content": {
                "value": "4.200",
                "label": "Hektar Hutan Hilang Selama 5 Tahun",
                "unit": "Ha",
                "source": "Laporan Satelit Forensik 2024"
            },
            "required_fields": ["value", "label"]
        },
        "timeline_event": {
            "template_id": "timeline_event",
            "name": "Timeline Event Marker",
            "description": "Penanda kronologis peristiwa dengan stempel waktu, lokasi, dan ringkasan fakta.",
            "default_content": {
                "date_or_period": "14 OKTOBER 2024 • 03:15 WIB",
                "event_title": "Anomali Tremor Vulkanik Meningkat",
                "location": "Pos Pengamatan Sektor Barat",
                "description": "Sensor seismik mencatat amplitudo maksimum 48 mm."
            },
            "required_fields": ["date_or_period", "event_title"]
        },
        "investigation_hud": {
            "template_id": "investigation_hud",
            "name": "Investigation HUD Framing",
            "description": "Bingkai HUD forensik dengan crosshair, koordinat GPS, klasifikasi berkas, dan indikator perekaman.",
            "default_content": {
                "coordinates_or_location": "LAT -7.5401° S, LONG 110.4456° E",
                "evidence_code": "EVID-098-B",
                "classification": "DOKUMEN RAHASIA",
                "timestamp_label": "REC • 00:04:12:08"
            },
            "required_fields": ["coordinates_or_location", "evidence_code"]
        }
    }

    def __init__(self, temp_dir: Path = TEMP_DIR):
        self.temp_dir = temp_dir
        self.temp_dir.mkdir(parents=True, exist_ok=True)

    def get_available_templates(self) -> List[Dict[str, Any]]:
        return list(self.TEMPLATES.values())

    def validate_overlay(self, overlay: MotionOverlay, scene_duration: float) -> None:
        """
        Validates overlay timing, template ID, and required content schema.
        """
        if overlay.template_id not in self.TEMPLATES:
            raise MotionGraphicsValidationError(
                f"Template ID '{overlay.template_id}' tidak valid. Pilihan: {list(self.TEMPLATES.keys())}"
            )

        if overlay.duration <= 0:
            raise MotionGraphicsValidationError("Durasi overlay harus lebih besar dari 0 detik.")

        if overlay.start_time < 0:
            raise MotionGraphicsValidationError("Waktu mulai overlay (start_time) tidak boleh negatif.")

        if overlay.start_time >= scene_duration:
            raise MotionGraphicsValidationError(
                f"Waktu mulai ({overlay.start_time}s) melampaui total durasi adegan ({scene_duration}s)."
            )

        tmpl_info = self.TEMPLATES[overlay.template_id]
        content = overlay.content or {}
        for req_field in tmpl_info["required_fields"]:
            val = content.get(req_field)
            if val is None or not str(val).strip():
                raise MotionGraphicsValidationError(
                    f"Kolom konten '{req_field}' wajib diisi untuk template '{overlay.template_id}'."
                )

    def _get_font(self, size: int, bold: bool = False, mono: bool = False) -> ImageFont.ImageFont:
        if mono:
            candidates = ["C:/Windows/Fonts/consola.ttf", "C:/Windows/Fonts/lucon.ttf"]
        elif bold:
            candidates = ["C:/Windows/Fonts/segoeuib.ttf", "C:/Windows/Fonts/arialbd.ttf"]
        else:
            candidates = ["C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/arial.ttf"]

        for c in candidates:
            if os.path.exists(c):
                try:
                    return ImageFont.truetype(c, size=size)
                except Exception:
                    pass
        return ImageFont.load_default()

    def render_overlay_frame(
        self,
        template_id: str,
        content: Dict[str, Any],
        position: str,
        animation_in: str,
        animation_out: str,
        t: float,
        duration: float,
        width: int = 1080,
        height: int = 1920
    ) -> Image.Image:
        """
        Renders a single 1080x1920 RGBA transparent frame at time t (in seconds).
        Animates opacity, position offsets, line expansion, and HUD indicators.
        """
        img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        # 1. Timing & Animation Easing
        in_dur = 0.45
        out_dur = 0.35

        # Ease-in factor (0.0 -> 1.0)
        in_factor = min(1.0, max(0.0, t / in_dur)) if in_dur > 0 else 1.0
        ease_in = 1.0 - (1.0 - in_factor) ** 3 # cubic ease-out

        # Ease-out factor (1.0 -> 0.0)
        out_factor = min(1.0, max(0.0, (duration - t) / out_dur)) if out_dur > 0 else 1.0
        ease_out = out_factor ** 2

        alpha_factor = min(ease_in, ease_out)
        global_alpha = int(255 * alpha_factor)

        if global_alpha <= 0:
            return img

        # Slide offset for slide_up
        y_slide = int((1.0 - ease_in) * 35)

        # 2. Template Specific Rendering
        if template_id == "kinetic_title":
            self._render_kinetic_title(draw, content, position, global_alpha, ease_in, y_slide, width, height)
        elif template_id == "stat_card":
            self._render_stat_card(draw, content, position, global_alpha, ease_in, y_slide, width, height)
        elif template_id == "timeline_event":
            self._render_timeline_event(draw, content, position, global_alpha, ease_in, y_slide, width, height)
        elif template_id == "investigation_hud":
            self._render_investigation_hud(draw, content, position, global_alpha, ease_in, t, width, height)

        return img

    def _render_kinetic_title(
        self,
        draw: ImageDraw.ImageDraw,
        content: Dict[str, Any],
        position: str,
        alpha: int,
        ease_in: float,
        y_slide: int,
        width: int,
        height: int
    ):
        title = content.get("title", "")
        subtitle = content.get("subtitle") or ""
        tag = content.get("tag") or "ARSIP INVESTIGASI"

        # Position mapping
        card_w = width - 140
        card_h = 320
        card_x = 70
        if position == "top":
            card_y = 280 + y_slide
        elif position == "bottom":
            card_y = 1320 + y_slide
        else: # center / default
            card_y = 800 + y_slide

        # Dark sleek container
        bg_alpha = int(210 * (alpha / 255.0))
        draw.rounded_rectangle(
            [card_x, card_y, card_x + card_w, card_y + card_h],
            radius=16,
            fill=(11, 15, 25, bg_alpha),
            outline=(239, 68, 68, int(180 * (alpha / 255.0))),
            width=2
        )

        # Crimson left accent bar
        draw.rectangle(
            [card_x, card_y, card_x + 8, card_y + card_h],
            fill=(239, 68, 68, alpha)
        )

        # Tag
        font_tag = self._get_font(22, bold=True, mono=True)
        draw.text((card_x + 36, card_y + 30), f"// {tag.upper()}", fill=(239, 68, 68, alpha), font=font_tag)

        # Expanding accent line under tag
        line_w = int((card_w - 72) * ease_in)
        if line_w > 0:
            draw.line(
                [(card_x + 36, card_y + 68), (card_x + 36 + line_w, card_y + 68)],
                fill=(239, 68, 68, int(200 * (alpha / 255.0))),
                width=2
            )

        # Title
        lines = textwrap.wrap(title, width=26)
        font_size = 46 if len(lines) <= 1 and len(title) <= 22 else 38
        font_title = self._get_font(font_size, bold=True)
        ty = card_y + 90
        for l in lines[:2]:
            draw.text((card_x + 36, ty), l, fill=(248, 250, 252, alpha), font=font_title)
            ty += font_size + 8

        # Subtitle
        if subtitle:
            font_sub = self._get_font(24, bold=False)
            sub_lines = textwrap.wrap(subtitle, width=42)
            sy = max(ty + 10, card_y + 175)
            for sl in sub_lines[:2]:
                draw.text((card_x + 36, sy), sl, fill=(148, 163, 184, alpha), font=font_sub)
                sy += 30

        # Minimalist metadata indicator
        font_foot = self._get_font(18, mono=True)
        draw.text((card_x + 36, card_y + card_h - 40), "STATUS: BUKTI FORENSIK TERVERIFIKASI", fill=(100, 116, 139, alpha), font=font_foot)

    def _render_stat_card(
        self,
        draw: ImageDraw.ImageDraw,
        content: Dict[str, Any],
        position: str,
        alpha: int,
        ease_in: float,
        y_slide: int,
        width: int,
        height: int
    ):
        value = str(content.get("value", ""))
        label = str(content.get("label", ""))
        unit = str(content.get("unit") or "")
        source = str(content.get("source") or "").strip()

        card_w = width - 140
        card_h = 330
        card_x = 70
        if position == "top":
            card_y = 280 + y_slide
        elif position == "bottom":
            card_y = 1300 + y_slide
        else: # center
            card_y = 820 + y_slide

        # Card container
        bg_alpha = int(220 * (alpha / 255.0))
        draw.rounded_rectangle(
            [card_x, card_y, card_x + card_w, card_y + card_h],
            radius=16,
            fill=(15, 23, 42, bg_alpha),
            outline=(239, 68, 68, int(150 * (alpha / 255.0))),
            width=2
        )

        # Header Badge
        font_badge = self._get_font(22, bold=True, mono=True)
        draw.text((card_x + 36, card_y + 30), "● DATA INVESTIGATIF", fill=(239, 68, 68, alpha), font=font_badge)

        # Value + Unit
        font_val = self._get_font(72, bold=True)
        draw.text((card_x + 36, card_y + 70), value, fill=(248, 250, 252, alpha), font=font_val)

        val_bbox = draw.textbbox((card_x + 36, card_y + 70), value, font=font_val)
        val_w = val_bbox[2] - val_bbox[0]

        if unit:
            font_unit = self._get_font(32, bold=True)
            draw.text((card_x + 46 + val_w, card_y + 105), unit, fill=(239, 68, 68, alpha), font=font_unit)

        # Label
        font_lbl = self._get_font(26, bold=False)
        lbl_lines = textwrap.wrap(label, width=45)
        ly = card_y + 175
        for ll in lbl_lines[:2]:
            draw.text((card_x + 36, ly), ll, fill=(203, 213, 225, alpha), font=font_lbl)
            ly += 30

        # Divider
        line_w = int((card_w - 72) * ease_in)
        if line_w > 0:
            draw.line(
                [(card_x + 36, card_y + 240), (card_x + 36 + line_w, card_y + 240)],
                fill=(255, 255, 255, int(40 * (alpha / 255.0))),
                width=1
            )

        # Source Note (Truth in data representation)
        font_src = self._get_font(20, mono=True)
        if source:
            src_text = f"SUMBER: {source.upper()}"
            src_color = (148, 163, 184, alpha)
        else:
            src_text = "SUMBER: BELUM DICANTUMKAN"
            src_color = (239, 68, 68, alpha)

        draw.text((card_x + 36, card_y + 265), src_text, fill=src_color, font=font_src)

    def _render_timeline_event(
        self,
        draw: ImageDraw.ImageDraw,
        content: Dict[str, Any],
        position: str,
        alpha: int,
        ease_in: float,
        y_slide: int,
        width: int,
        height: int
    ):
        date_period = str(content.get("date_or_period", ""))
        event_title = str(content.get("event_title", ""))
        location = str(content.get("location") or "")
        description = str(content.get("description") or "")

        card_w = width - 140
        card_h = 360
        card_x = 70
        if position == "top":
            card_y = 280 + y_slide
        elif position == "bottom":
            card_y = 1280 + y_slide
        else:
            card_y = 800 + y_slide

        # Card container
        bg_alpha = int(220 * (alpha / 255.0))
        draw.rounded_rectangle(
            [card_x, card_y, card_x + card_w, card_y + card_h],
            radius=16,
            fill=(11, 15, 25, bg_alpha),
            outline=(239, 68, 68, int(150 * (alpha / 255.0))),
            width=2
        )

        # Node dot & Date Badge
        draw.ellipse([card_x + 36, card_y + 36, card_x + 48, card_y + 48], fill=(239, 68, 68, alpha))
        font_date = self._get_font(24, bold=True, mono=True)
        draw.text((card_x + 60, card_y + 30), date_period.upper(), fill=(239, 68, 68, alpha), font=font_date)

        # Title
        title_lines = textwrap.wrap(event_title, width=34)
        font_size = 36 if len(title_lines) <= 1 else 30
        font_title = self._get_font(font_size, bold=True)
        ty = card_y + 78
        for tl in title_lines[:2]:
            draw.text((card_x + 36, ty), tl, fill=(248, 250, 252, alpha), font=font_title)
            ty += font_size + 6

        # Location
        cur_y = max(ty + 6, card_y + 140)
        if location:
            font_loc = self._get_font(22, bold=False)
            draw.text((card_x + 36, cur_y), f"LOKASI: {location}", fill=(148, 163, 184, alpha), font=font_loc)
            cur_y += 32

        # Description
        if description:
            font_desc = self._get_font(22, bold=False)
            desc_lines = textwrap.wrap(description, width=52)
            dy = cur_y
            for dl in desc_lines[:2]:
                draw.text((card_x + 36, dy), dl, fill=(203, 213, 225, alpha), font=font_desc)
                dy += 28

        # Expanding accent rule
        line_w = int((card_w - 72) * ease_in)
        if line_w > 0:
            draw.line(
                [(card_x + 36, card_y + card_h - 30), (card_x + 36 + line_w, card_y + card_h - 30)],
                fill=(239, 68, 68, int(180 * (alpha / 255.0))),
                width=2
            )

    def _render_investigation_hud(
        self,
        draw: ImageDraw.ImageDraw,
        content: Dict[str, Any],
        position: str,
        alpha: int,
        ease_in: float,
        t: float,
        width: int,
        height: int
    ):
        coords = str(content.get("coordinates_or_location", ""))
        evidence = str(content.get("evidence_code", ""))
        classification = str(content.get("classification") or "DOKUMEN RAHASIA")
        timestamp_label = str(content.get("timestamp_label") or "REC • 00:04:12")

        # 4 Corner brackets with smooth opening
        b_margin = 50
        b_len = int(60 * ease_in)
        b_color = (239, 68, 68, int(220 * (alpha / 255.0)))

        if b_len > 0:
            # Top-Left
            draw.line([(b_margin, b_margin), (b_margin + b_len, b_margin)], fill=b_color, width=3)
            draw.line([(b_margin, b_margin), (b_margin, b_margin + b_len)], fill=b_color, width=3)
            # Top-Right
            draw.line([(width - b_margin, b_margin), (width - b_margin - b_len, b_margin)], fill=b_color, width=3)
            draw.line([(width - b_margin, b_margin), (width - b_margin, b_margin + b_len)], fill=b_color, width=3)
            # Bottom-Left
            draw.line([(b_margin, height - b_margin), (b_margin + b_len, height - b_margin)], fill=b_color, width=3)
            draw.line([(b_margin, height - b_margin), (b_margin, height - b_margin - b_len)], fill=b_color, width=3)
            # Bottom-Right
            draw.line([(width - b_margin, height - b_margin), (width - b_margin - b_len, height - b_margin)], fill=b_color, width=3)
            draw.line([(width - b_margin, height - b_margin), (width - b_margin, height - b_margin - b_len)], fill=b_color, width=3)

        # Top Bar: Classification Badge & Blinking REC
        font_hud = self._get_font(22, bold=True, mono=True)
        draw.text((b_margin + 20, b_margin + 20), f"[ {classification.upper()} ]", fill=(239, 68, 68, alpha), font=font_hud)

        # Blinking REC dot (t-dependent animation)
        is_rec_lit = (int(t * 2.0) % 2 == 0)
        rec_dot_color = (239, 68, 68, alpha) if is_rec_lit else (100, 20, 20, int(alpha * 0.4))
        draw.ellipse([width - b_margin - 240, b_margin + 24, width - b_margin - 224, b_margin + 40], fill=rec_dot_color)
        draw.text((width - b_margin - 210, b_margin + 20), timestamp_label, fill=(248, 250, 252, alpha), font=font_hud)

        # Center subtle crosshair reticle
        cx, cy = width // 2, height // 2
        reticle_color = (255, 255, 255, int(40 * (alpha / 255.0)))
        draw.line([(cx - 20, cy), (cx + 20, cy)], fill=reticle_color, width=1)
        draw.line([(cx, cy - 20), (cx, cy + 20)], fill=reticle_color, width=1)
        draw.rectangle([cx - 40, cy - 40, cx + 40, cy + 40], outline=reticle_color, width=1)

        # Bottom Bar: Evidence Code & GPS Coordinates
        draw.text((b_margin + 20, height - b_margin - 50), f"NO. BUKTI: {evidence}", fill=(248, 250, 252, alpha), font=font_hud)
        draw.text((b_margin + 20, height - b_margin - 85), coords, fill=(148, 163, 184, alpha), font=font_hud)

    def render_overlay_clip(
        self,
        overlay: MotionOverlay,
        scene_duration: float,
        output_dir: Path,
        ffmpeg_bin: Optional[str] = None
    ) -> Path:
        """
        Renders a MotionOverlay into an alpha-channel QuickTime RLE video (.mov) at 30 FPS.
        Duration of the generated clip equals effective overlay duration.
        """
        bin_path = ffmpeg_bin or resolve_ffmpeg_binary()
        if not bin_path or not os.path.exists(bin_path):
            raise MotionGraphicsError("FFmpeg binary tidak ditemukan.")

        self.validate_overlay(overlay, scene_duration)

        eff_end = min(overlay.start_time + overlay.duration, scene_duration)
        eff_duration = eff_end - overlay.start_time
        if eff_duration <= 0:
            raise MotionGraphicsError("Durasi efektif overlay harus lebih dari 0.")

        fps = 30
        total_frames = max(1, int(round(eff_duration * fps)))

        frames_temp_dir = Path(tempfile.mkdtemp(prefix="mgo_frames_"))
        clip_path = output_dir / f"{overlay.overlay_id}.mov"

        try:
            # 1. Generate PNG frames
            for f_idx in range(total_frames):
                frame_t = f_idx / fps
                frame_img = self.render_overlay_frame(
                    template_id=overlay.template_id,
                    content=overlay.content,
                    position=overlay.position,
                    animation_in=overlay.animation_in,
                    animation_out=overlay.animation_out,
                    t=frame_t,
                    duration=eff_duration
                )
                frame_file = frames_temp_dir / f"f_{f_idx:05d}.png"
                frame_img.save(frame_file, format="PNG")

            # 2. Encode to transparent QTRLE QuickTime MOV
            cmd = [
                bin_path,
                "-y",
                "-r", str(fps),
                "-i", str(frames_temp_dir / "f_%05d.png"),
                "-c:v", "qtrle",
                str(clip_path)
            ]
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=90)
            if res.returncode != 0:
                raise MotionGraphicsError(f"Gagal mengonversi frame overlay ke video: {res.stderr[:300]}")

            return clip_path
        finally:
            shutil.rmtree(frames_temp_dir, ignore_errors=True)

    def composite_overlays_on_video(
        self,
        base_video_path: Path,
        overlays: List[MotionOverlay],
        scene_duration: float,
        output_video_path: Path,
        ffmpeg_bin: Optional[str] = None
    ) -> Path:
        """
        Composites one or more MotionOverlays over base_video_path using FFmpeg overlay filter,
        respecting layers, start times, and durations. Audio is passed through intact.
        """
        bin_path = ffmpeg_bin or resolve_ffmpeg_binary()
        if not bin_path or not os.path.exists(bin_path):
            raise MotionGraphicsError("FFmpeg binary tidak ditemukan.")

        enabled_overlays = [o for o in overlays if o.enabled]
        if not enabled_overlays:
            # Nothing to composite, copy base video
            shutil.copy2(base_video_path, output_video_path)
            return output_video_path

        # Sort by layer ascending (lower layer drawn first, higher layer on top)
        sorted_overlays = sorted(enabled_overlays, key=lambda x: (x.layer, x.start_time))

        temp_mov_dir = Path(tempfile.mkdtemp(prefix="mgo_movs_"))
        mov_clips: List[Tuple[Path, float]] = [] # (clip_path, start_time)

        try:
            # 1. Render all overlay MOV clips
            for ovl in sorted_overlays:
                clip_p = self.render_overlay_clip(ovl, scene_duration, temp_mov_dir, ffmpeg_bin=bin_path)
                mov_clips.append((clip_p, ovl.start_time))

            # 2. Construct FFmpeg command
            # Input 0: base video
            cmd = [bin_path, "-y", "-i", str(base_video_path)]

            # Inputs 1..N: overlay clips with -itsoffset
            for clip_p, s_time in mov_clips:
                cmd.extend(["-itsoffset", f"{s_time:.3f}", "-i", str(clip_p)])

            # Build filter_complex chain
            filter_parts = []
            current_v = "[0:v]"
            for idx in range(len(mov_clips)):
                next_v = f"[v{idx + 1}]" if idx < len(mov_clips) - 1 else "[v]"
                filter_parts.append(f"{current_v}[{idx + 1}:v]overlay=0:0:eof_action=pass{next_v}")
                current_v = f"[v{idx + 1}]"

            filter_complex_str = ";".join(filter_parts)

            cmd.extend([
                "-filter_complex", filter_complex_str,
                "-map", "[v]",
                "-map", "0:a?", # keep audio if present
                "-c:v", "libx264",
                "-preset", "fast",
                "-pix_fmt", "yuv420p",
                "-c:a", "copy",
                "-t", str(scene_duration),
                str(output_video_path)
            ])

            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=120)
            if res.returncode != 0:
                raise MotionGraphicsError(f"Gagal mengomposisikan overlay pada video adegan: {res.stderr[:300]}")

            return output_video_path

        finally:
            shutil.rmtree(temp_mov_dir, ignore_errors=True)

motion_graphics_service = MotionGraphicsService()
