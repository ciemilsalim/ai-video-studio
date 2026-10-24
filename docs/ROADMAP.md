# AI Video Studio — Implementation Roadmap

## Phase 1: Foundation & Safe Baseline (Current Phase)
- [x] Workspace & environment audit (Python, Node.js, npm, FFmpeg detection).
- [x] Skill isolation verification (Ensuring zero impact on `app-tutorial-video`).
- [x] Git repository initialization and `.gitignore` baseline.
- [x] Architectural documentation & roadmap definition.
- [x] JSON Schema contracts for Project, Storyboard, and Google Flow Prompts.
- [x] FastAPI backend skeleton with `/api/health`, `/api/projects`, and FFmpeg discovery.
- [x] React + Vite frontend foundation (Modern dark mode dashboard & storyboard editor).
- [x] 1-Click launcher script `Start AI Video Studio.bat`.
- [x] Automated test suite verifying health, schemas, and project persistence.

---

## Phase 2A: Local Vertical Video Rendering (Completed & Verified)
- [x] Subprocess FFmpeg rendering service without shell command injection (`render_service.py`).
- [x] Deterministic 1080×1920 graphic overlay with Pillow (branding, glassmorphic box, accent bar, metadata).
- [x] Vertical 1080×1920 (9:16) MP4 production with H.264 video and stereo AAC audio.
- [x] Non-blocking FastAPI endpoint integration (`/api/renders/demo` and `/api/renders/project/{id}`).
- [x] Streamable MP4 playback endpoint (`/api/renders/{filename}`).
- [x] Dashboard UI integration with `RenderModal` featuring interactive vertical video player.
- [x] Dual validation via OpenCV `VideoCapture` and FFmpeg stream inspection.
- [x] 100% test coverage for input validation, missing FFmpeg handling, real render, and API endpoints (12 passed).

---

## Phase 2B: Storyboard, Edge-TTS, and Multi-Scene Assembly (Completed & Verified)
- [x] Storyboard Editor with Scene CRUD, ordering, and duration calculation (`models/project.py`, `routers/projects.py`).
- [x] Edge-TTS Neural Narration Service with input validation, timeout, and offline safety (`tts_service.py`).
- [x] Real neural speech synthesis (e.g. `id-ID-ArdiNeural`) with audio streaming & playback in web UI (`/api/audio`).
- [x] Multi-Scene Video Assembly Engine normalizing segments to 1080×1920 30 FPS (`assembly_service.py`).
- [x] Deterministic visual placeholder cards for scenes without user footage.
- [x] Dual validation (OpenCV + FFmpeg) on assembled video output.
- [x] Non-blocking FastAPI execution via `run_in_threadpool`.
- [x] Full UI integration: add/edit/delete/reorder scenes, synthesize narration, audio preview player, and multi-scene assembly modal.
- [x] 100% test pass rate across 18 backend tests and verified Vite build.

---

## Phase 2C: Visual Asset Manager & Footage Ingestion (Completed & Verified)
- [x] Visual Asset Model (`VisualAsset`) with UUID, project/scene binding, format validation, dimensions, duration, FPS, and timestamps (`models/project.py`).
- [x] Secure Asset Ingestion Service (`asset_service.py`) supporting local file imports, path traversal prevention, size limits (500MB video, 30MB image), and URL rejection.
- [x] Media metadata extraction using OpenCV `cv2.VideoCapture` and FFmpeg stream inspection.
- [x] Automatic thumbnail generation (OpenCV first-frame extraction & Pillow resize) with streaming API endpoint.
- [x] Scene linking & unlinking API (`POST /api/assets/{id}/{asset_id}/attach` and `/detach/{scene_id}`).
- [x] Media file streaming API with Range support & safe path confinement (`/api/assets/{project_id}/{filename}`).
- [x] Assembly Service integration (`assembly_service.py`):
  - Seamless auto-scaling and aspect-preserving cropping to 1080×1920 vertical format.
  - Video and image looping support.
  - Explicit error handling for missing/deleted media files without silent corruption.
  - Verification metadata tracking `real_footage_scenes_count`, `placeholder_scenes_count`, and `has_placeholders`.
- [x] Interactive Frontend Asset Manager Modal (`AssetManagerModal.jsx`):
  - Grid view with video/image thumbnails, metadata tags, and scene attachment selectors.
  - In-modal media preview player for video and image verification.
  - Dual ingestion workflows: Windows local path import and browser file upload.
  - Storyboard scene badges (`✓ Footage Siap` vs `⚡ Mode Placeholder`) with one-click attach/detach buttons.
- [x] 100% test pass rate across 24 backend tests and successful Vite production build.

## Phase 2D: Reusable Motion Graphics Engine (Completed & Verified)
- [x] Motion Graphics Data Model (`MotionOverlay`) supporting `overlay_id`, `scene_id`, `template_id`, `start_time`, `duration`, `layer`, `position`, `style`, `animation_in`, `animation_out`, `content`, and `enabled`.
- [x] Four Reusable Investigative Templates with dark documentary aesthetics:
  - `kinetic_title`: Bold reveal typography, crimson accent line, classification category tag.
  - `stat_card`: Large metric numbers, labels, units, and mandatory honest data source provenance.
  - `timeline_event`: Historical period/date badge, event headline, geographical tag, and detailed briefing.
  - `investigation_hud`: Coordinates/GPS, evidence tracking code, classification badge, frame reticle, and time-varying blinking REC indicator.
- [x] High-performance RGBA frame rendering with Pillow at 1080×1920 (ease-in, ease-out, dynamic time-varying elements).
- [x] Zero-dependency Alpha Video Generation: FFmpeg `-c:v qtrle` QuickTime MOV generation with true 32-bit RGBA transparency.
- [x] Multi-Layer Compositing Engine (`composite_overlays_on_video`):
  - Ingests overlays via `-itsoffset {start_time}` with layer ordering.
  - FFmpeg `[v][ov]overlay=0:0:eof_action=pass` filter graph.
  - Preserves exact scene target duration and copies audio streams intact (`-map 0:a? -c:a copy`).
- [x] Safe Storyboard Assembly Integration (`assembly_service.py`):
  - Fully backward compatible: scenes without overlays bypass overlay rendering with zero overhead.
  - Assembled video output metadata records `motion_overlays_count`.
- [x] Motion Graphics REST APIs (`routers/motion_graphics.py`):
  - `GET /api/motion-graphics/templates` (catalog with schema & defaults).
  - `GET /api/motion-graphics/preview` (live transparent PNG frame generator for UI preview).
  - Scene Overlay CRUD: `GET`, `POST`, `PUT`, `DELETE` at `/api/projects/{p_id}/scenes/{s_id}/overlays`.
- [x] Interactive Frontend Motion Graphics Modal (`MotionOverlayModal.jsx`):
  - Template selector tabs with visual icons.
  - Live parameter editing and live frame preview fetching.
  - Start time, duration, layer, and position configuration.
  - Overlay list with instant enable/disable toggling and deletion.
  - Storyboard scene card integration with overlay counters and quick-launch button.
- [x] 100% test pass rate across 35 backend tests (11 dedicated motion graphics tests) producing real vertical MP4 output.

---

## Phase 2E: Main Visual Generation Pipeline (Completed & Verified)
- [x] **Root Cause Resolution**:
  - Identified & resolved missing visual generator by building pluggable `VisualGenerationProvider` architecture.
  - Fixed image asset ingestion bug in `asset_service.py` where `image_reference` failed to populate `scene.footage_path`.
  - Added asset fallback resolution in `assembly_service.py` (`scene.asset_id` cross-reference to `project.assets`).
  - Added strict decodability validation for corrupt/0-byte/missing footage and images prior to rendering.
- [x] **Provider Architecture (`services/visual_generation_provider.py`)**:
  - `VisualGenerationProvider` abstract base class defining prompt, duration, resolution, and async job contracts.
  - `GoogleFlowProvider`: Honestly reports unavailable (no false claims/mock API keys) with guidance on markdown export & local ingest.
  - `LocalImportVisualProvider`: Validates and binds local video & image assets.
  - `ProceduralCinematicProvider`: Generates genuine 1080×1920 30 FPS vertical MP4 footage with dynamic camera motion, prompt-based thematic palettes, and floating atmospheric particles (verified frame delta > 0.05).
  - `VisualGenerationManager`: Handles job states (`pending`, `generating`, `completed`, `failed`), deduplication, retries, and automatic scene binding.
- [x] **UI Validation (`StoryboardViewer.jsx`)**:
  - Visual status badges per scene: `✓ Visual Siap (Video / Gambar)`, `⚡ Sedang Memproses`, `⚠️ Belum Tersedia`, `❌ Gagal`.
  - Thumbnail previews for linked assets.
  - Direct actions to import media or generate procedural cinematic visual locally.
  - Pre-assembly confirmation check warning users if any scene lacks real visual footage.
- [x] **Comprehensive Testing & Evidence**:
  - 10-point mandatory test suite in `tests/test_visual_generation.py` (all 10 passed).
  - 46/46 total backend tests passing with 0 regressions.
  - Full vertical video demonstration generated at `data/renders/demo_phase2e_main_visual.mp4` (11.5s, 1080×1920, 30 FPS CFR, moving footage delta 3.5456, persistent image visual, synced narration, motion graphics).


---

## Phase 3: Motion Graphics & SVG / Remotion Engine
- [ ] Motion Graphics templates library:
  - Document Titlecards & Chapter Dividers.
  - Lower thirds for interviewees / historical figures.
  - Animated stat counters and data callouts.
  - Kinetic typography overlays.
- [ ] Remotion integration:
  - Standalone Remotion bundle in `render-engine/`.
  - Frame-accurate headless Chromium rendering.
  - Alpha channel WebM / ProRes 4444 export for overlay composition.

---

## Phase 4: Audio Engine & Voice Pipeline
- [ ] Edge-TTS integration for neural multilingual narration.
- [ ] Waveform visualization and silence trimming.
- [ ] Subtitle alignment & Word-level timestamp generation.
- [ ] Adaptive background music ducking (sidechain-like ducking via FFmpeg `sidechaincompress`).
- [ ] Sound effect cues (whoosh, hit, ambient drone).

---

## Phase 5: Assembly, Rendering & Quality Assurance
- [ ] Frame-accurate FFmpeg assembly pipeline stitching video clips, overlays, and audio.
- [ ] Vertical 1080×1920 (9:16) rendering with H.264 / AAC hardware acceleration where available.
- [ ] Automated Quality Assurance (Gates for audio clipping, frame drops, subtitle safe-zones).
- [ ] Render queue and video player preview within the web dashboard.
