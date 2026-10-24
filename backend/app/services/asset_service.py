import os
import re
import uuid
import shutil
import subprocess
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone
from PIL import Image
import cv2

from app.config import ASSETS_DIR, resolve_ffmpeg_binary
from app.models.project import VideoProject, VisualAsset, Scene
from app.services.storage_service import storage_service

class AssetServiceError(Exception):
    pass

class AssetValidationError(AssetServiceError):
    pass

class AssetNotFoundError(AssetServiceError):
    pass

class AssetService:
    ALLOWED_VIDEO_EXTS = {".mp4", ".mov", ".webm", ".mkv"}
    ALLOWED_IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp"}
    MAX_VIDEO_SIZE_BYTES = 500 * 1024 * 1024  # 500 MB
    MAX_IMAGE_SIZE_BYTES = 30 * 1024 * 1024   # 30 MB

    def __init__(self, assets_dir: Path = ASSETS_DIR):
        self.assets_dir = assets_dir
        self.assets_dir.mkdir(parents=True, exist_ok=True)

    def _get_project_assets_dir(self, project_id: str) -> Path:
        clean_pid = re.sub(r"[^\w-]", "", project_id)
        p_dir = self.assets_dir / clean_pid
        p_dir.mkdir(parents=True, exist_ok=True)
        (p_dir / "thumbnails").mkdir(parents=True, exist_ok=True)
        return p_dir

    def sanitize_filename(self, filename: str) -> str:
        # Strip directory traversal characters
        clean = os.path.basename(filename)
        clean = re.sub(r"[^\w\.-]", "_", clean)
        return clean or f"asset_{uuid.uuid4().hex[:8]}"

    def validate_file_path(self, local_source_path: str) -> Path:
        """
        Validates that a local import path exists, is a file, and is not a URL.
        """
        if not local_source_path or not local_source_path.strip():
            raise AssetValidationError("Path file aset tidak boleh kosong.")

        if local_source_path.startswith(("http://", "https://", "ftp://")):
            raise AssetValidationError("URL eksternal tidak diizinkan. Hanya file lokal yang didukung.")

        src_path = Path(local_source_path).resolve()
        if not src_path.is_file():
            raise AssetValidationError(f"File sumber tidak ditemukan di disk: {src_path}")

        ext = src_path.suffix.lower()
        if ext not in self.ALLOWED_VIDEO_EXTS and ext not in self.ALLOWED_IMAGE_EXTS:
            raise AssetValidationError(
                f"Ekstensi file '{ext}' tidak didukung. Ekstensi yang didukung: "
                f"{', '.join(sorted(self.ALLOWED_VIDEO_EXTS | self.ALLOWED_IMAGE_EXTS))}"
            )

        file_size = src_path.stat().st_size
        if ext in self.ALLOWED_VIDEO_EXTS and file_size > self.MAX_VIDEO_SIZE_BYTES:
            raise AssetValidationError(f"Ukuran file video melampaui batas maksimum 500 MB ({file_size} bytes).")
        elif ext in self.ALLOWED_IMAGE_EXTS and file_size > self.MAX_IMAGE_SIZE_BYTES:
            raise AssetValidationError(f"Ukuran file gambar melampaui batas maksimum 30 MB ({file_size} bytes).")

        return src_path

    def probe_media_metadata(self, file_path: Path) -> Dict[str, Any]:
        """
        Extracts width, height, fps, duration, and codec from video or image.
        """
        ext = file_path.suffix.lower()
        metadata = {
            "width": None,
            "height": None,
            "fps": None,
            "duration_sec": None,
            "codec": None,
            "asset_type": "footage" if ext in self.ALLOWED_VIDEO_EXTS else "image_reference"
        }

        if ext in self.ALLOWED_VIDEO_EXTS:
            cap = cv2.VideoCapture(str(file_path))
            if cap.isOpened():
                metadata["width"] = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                metadata["height"] = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                fps = float(cap.get(cv2.CAP_PROP_FPS))
                fc = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
                metadata["fps"] = fps
                metadata["duration_sec"] = round(fc / fps, 2) if fps > 0 else 0.0
                cap.release()

            # Probe codec via FFmpeg
            ffmpeg_bin = resolve_ffmpeg_binary()
            if ffmpeg_bin and os.path.exists(ffmpeg_bin):
                try:
                    res = subprocess.run([ffmpeg_bin, "-i", str(file_path)], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=5)
                    m = re.search(r"Video:\s*(\w+)", res.stderr)
                    if m:
                        metadata["codec"] = m.group(1).lower()
                except Exception:
                    pass
        elif ext in self.ALLOWED_IMAGE_EXTS:
            try:
                with Image.open(file_path) as img:
                    metadata["width"], metadata["height"] = img.size
                    metadata["codec"] = img.format.lower() if img.format else ext[1:]
            except Exception:
                pass

        return metadata

    def generate_thumbnail(self, media_path: Path, thumb_dest_path: Path) -> Optional[Path]:
        """
        Generates a JPEG thumbnail for video or image asset.
        """
        ext = media_path.suffix.lower()
        thumb_dest_path.parent.mkdir(parents=True, exist_ok=True)

        if ext in self.ALLOWED_VIDEO_EXTS:
            # Extract first frame using OpenCV
            cap = cv2.VideoCapture(str(media_path))
            success, frame = cap.read()
            cap.release()
            if success and frame is not None:
                # Resize keeping aspect ratio, max width 360
                h, w = frame.shape[:2]
                if w > 360:
                    new_h = int(h * (360 / w))
                    frame = cv2.resize(frame, (360, new_h))
                cv2.imwrite(str(thumb_dest_path), frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                return thumb_dest_path

            # Fallback to FFmpeg thumbnail
            ffmpeg_bin = resolve_ffmpeg_binary()
            if ffmpeg_bin and os.path.exists(ffmpeg_bin):
                try:
                    subprocess.run(
                        [ffmpeg_bin, "-y", "-ss", "00:00:00.500", "-i", str(media_path), "-vframes", "1", "-vf", "scale=360:-1", str(thumb_dest_path)],
                        stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=5
                    )
                    if thumb_dest_path.is_file():
                        return thumb_dest_path
                except Exception:
                    pass
        elif ext in self.ALLOWED_IMAGE_EXTS:
            try:
                with Image.open(media_path) as img:
                    img = img.convert("RGB")
                    img.thumbnail((360, 640))
                    img.save(thumb_dest_path, format="JPEG", quality=85)
                    return thumb_dest_path
            except Exception:
                pass

        return None

    def import_local_asset(
        self,
        project_id: str,
        source_file_path: str,
        scene_id: Optional[str] = None,
        source_type: str = "local_import"
    ) -> VisualAsset:
        """
        Imports a local media file into the project asset library,
        validates metadata, generates thumbnail, and optionally links to a scene.
        """
        project = storage_service.get_project(project_id)
        if not project:
            raise AssetNotFoundError(f"Proyek '{project_id}' tidak ditemukan.")

        src_path = self.validate_file_path(source_file_path)
        clean_name = self.sanitize_filename(src_path.name)
        asset_id = f"asset-{uuid.uuid4().hex[:8]}"

        p_assets_dir = self._get_project_assets_dir(project_id)
        dest_filename = f"{asset_id}_{clean_name}"
        dest_path = p_assets_dir / dest_filename

        # Copy safely to project asset store
        shutil.copy2(src_path, dest_path)

        # Probe metadata
        meta = self.probe_media_metadata(dest_path)

        # Generate thumbnail
        thumb_name = f"{asset_id}_thumb.jpg"
        thumb_dest = p_assets_dir / "thumbnails" / thumb_name
        thumb_result = self.generate_thumbnail(dest_path, thumb_dest)

        ext = dest_path.suffix.lower()
        mime_type = "video/mp4" if ext in self.ALLOWED_VIDEO_EXTS else "image/jpeg"

        asset = VisualAsset(
            asset_id=asset_id,
            project_id=project_id,
            scene_id=scene_id,
            asset_type=meta["asset_type"],
            filename=clean_name,
            file_path=str(dest_path),
            mime_type=mime_type,
            size_bytes=dest_path.stat().st_size,
            width=meta["width"],
            height=meta["height"],
            duration_sec=meta["duration_sec"],
            fps=meta["fps"],
            codec=meta["codec"],
            source_type=source_type if source_type in ["local_import", "generated", "placeholder"] else "local_import",
            validation_status="valid",
            thumbnail_path=str(thumb_dest) if thumb_result else None,
            thumbnail_url=f"/api/assets/{project_id}/{thumb_name}?thumb=true" if thumb_result else None,
            web_url=f"/api/assets/{project_id}/{dest_filename}"
        )

        project.assets.append(asset)

        # If scene_id provided, attach to scene
        if scene_id:
            scene = next((s for s in project.storyboard.scenes if s.scene_id == scene_id), None)
            if scene:
                scene.asset_id = asset.asset_id
                if asset.asset_type == "footage":
                    scene.footage_path = asset.file_path
                    scene.production_status = "footage_ready"

        storage_service.save_project(project)
        return asset

    def attach_asset_to_scene(self, project_id: str, asset_id: str, scene_id: str) -> VisualAsset:
        project = storage_service.get_project(project_id)
        if not project:
            raise AssetNotFoundError(f"Proyek '{project_id}' tidak ditemukan.")

        asset = next((a for a in project.assets if a.asset_id == asset_id), None)
        if not asset:
            raise AssetNotFoundError(f"Aset '{asset_id}' tidak ditemukan.")

        scene = next((s for s in project.storyboard.scenes if s.scene_id == scene_id), None)
        if not scene:
            raise AssetNotFoundError(f"Adegan '{scene_id}' tidak ditemukan.")

        asset.scene_id = scene_id
        scene.asset_id = asset.asset_id
        if asset.asset_type == "footage":
            scene.footage_path = asset.file_path
            scene.production_status = "footage_ready"

        storage_service.save_project(project)
        return asset

    def detach_asset_from_scene(self, project_id: str, scene_id: str) -> None:
        project = storage_service.get_project(project_id)
        if not project:
            raise AssetNotFoundError(f"Proyek '{project_id}' tidak ditemukan.")

        scene = next((s for s in project.storyboard.scenes if s.scene_id == scene_id), None)
        if not scene:
            raise AssetNotFoundError(f"Adegan '{scene_id}' tidak ditemukan.")

        # Detach from scene
        scene.asset_id = None
        scene.footage_path = None
        if scene.narration_audio_path:
            scene.production_status = "narrated"
        else:
            scene.production_status = "draft"

        # Update matching assets
        for a in project.assets:
            if a.scene_id == scene_id:
                a.scene_id = None

        storage_service.save_project(project)

    def delete_asset(self, project_id: str, asset_id: str) -> bool:
        project = storage_service.get_project(project_id)
        if not project:
            raise AssetNotFoundError(f"Proyek '{project_id}' tidak ditemukan.")

        asset = next((a for a in project.assets if a.asset_id == asset_id), None)
        if not asset:
            raise AssetNotFoundError(f"Aset '{asset_id}' tidak ditemukan.")

        # Detach from any linked scene
        if asset.scene_id:
            scene = next((s for s in project.storyboard.scenes if s.scene_id == asset.scene_id), None)
            if scene and scene.asset_id == asset_id:
                scene.asset_id = None
                scene.footage_path = None
                scene.production_status = "narrated" if scene.narration_audio_path else "draft"

        # Safely remove files
        if asset.file_path and os.path.isfile(asset.file_path):
            try:
                os.remove(asset.file_path)
            except Exception:
                pass

        if asset.thumbnail_path and os.path.isfile(asset.thumbnail_path):
            try:
                os.remove(asset.thumbnail_path)
            except Exception:
                pass

        project.assets = [a for a in project.assets if a.asset_id != asset_id]
        storage_service.save_project(project)
        return True

asset_service = AssetService()
