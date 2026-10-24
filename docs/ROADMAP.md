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

## Phase 2B: Storyboard & Google Flow Prompt Studio
- [ ] Visual Storyboard Editor with scene cards, shot order drag-and-drop, and timing controls.
- [ ] Google Flow Prompt Studio:
  - Subject, action, environment descriptors.
  - Camera motion directives (pan, tilt, orbit, tracking shot, drone reveal).
  - Lighting and mood presets (golden hour, volumetric neon, moody documentary filmic).
  - Aspect ratio locking (`9:16` vertical 1080×1920).
  - Batch export to JSON/Clipboard/Markdown for Flow generation.
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
