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

## Phase 2C: Google Flow Prompt Studio & Asset Library
- [ ] Google Flow Prompt Studio enhancements (camera motions, lighting presets, aspect locking).
- [ ] Local asset library for footage ingest (previewing generated clips, trimming start/end).

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
