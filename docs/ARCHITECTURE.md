# AI Video Studio — Architecture Blueprint

## 1. Overview & Vision
AI Video Studio is a high-performance local production environment for Windows, tailored for creating premium AI-driven documentary and educational videos. It orchestrates:
- **Storyboarding & Scriptwriting:** Structured scene management with shot types, narrations, visual prompts, and timing.
- **Cinematic Footage Prompt Studio:** Standardized prompt engineering tailored for Google Flow (and alternative AI video generators).
- **Motion Graphics Engine:** Declarative SVG and Remotion-based animated titlecards, lower thirds, callouts, and animated infographics.
- **Audio & Voice Pipeline:** Neural TTS synthesis (e.g. edge-tts), adaptive background music ducking, and sound effects.
- **Deterministic Assembly:** Frame-accurate FFmpeg assembly in vertical 1080×1920 (9:16) format with burn-in subtitles and synchronized motion graphics.
- **Standalone Local Execution:** Zero dependency on Apache, Laragon, XAMPP, PHP, or MySQL. Runs purely on Python (FastAPI) and Node.js (React + Vite).

---

## 2. Multi-Tier System Topology

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ANTIGRAVITY AGENT SKILLS                        │
│   .agents/skills/ai-video-studio/ (Autonomous Storyboarding & Prompt)  │
│   [Isolated from app-tutorial-video to prevent cross-contamination]    │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ triggers / inspects
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   WEB FRONTEND (React + Vite, Vanilla CSS)             │
│   - Dashboard: Project manager, asset browser, render queue            │
│   - Storyboard Studio: Scene, shot, duration, and transition editor    │
│   - Prompt Studio: Google Flow prompt generator with camera/lighting   │
│   - Audio & Timeline: Narration preview, BGM level, subtitle styling   │
│   - Render Monitor: Live progress, FFmpeg log stream, QA scorecard     │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ REST / WebSocket (localhost:8000)
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     LOCAL BACKEND (Python FastAPI)                     │
│   - Routers: /api/health, /api/projects, /api/prompts, /api/render     │
│   - Storage Engine: Atomic JSON / SQLite project database               │
│   - Validation: Pydantic v2 schemas + JSON Schema contracts            │
│   - FFmpeg Runner: Subprocess abstraction discovering system/imageio   │
│   - Audio Engine: Edge-TTS synthesis, BGM ducking math, waveform prep  │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ commands / executes
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        RENDERING & ASSET ENGINE                        │
│   - FFmpeg 7.1 (Discovered via imageio-ffmpeg binary / System PATH)    │
│   - Remotion / SVG Renderer: Headless Chromium frame exporter          │
│   - Subtitle Burner: Libass / SRT formatting with safe margin layout   │
│   - Output Artifacts: 1080x1920 MP4 (H.264 / AAC 60fps/30fps)          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Strict Boundary & Isolation Principles

1. **Isolation from `app-tutorial-video`:**
   - The existing tutorial pipeline in `D:\laragon\www\siasek\aplikasi-absensi\.agents\skills\app-tutorial-video` remains completely separate.
   - AI Video Studio defines its own clean project models, endpoints, and storage without any coupling to the tutorial automation scripts.
2. **Deterministic Data Contracts:**
   - All projects, storyboards, and render requests are validated against strict JSON Schemas (`project_schema.json` and `storyboard_schema.json`).
3. **No Phantom Integrations:**
   - Google Flow is integrated via structured prompt builders and export templates until an official execution endpoint or automation bridge is established and empirically tested.
4. **Environment Portability on Windows:**
   - Discovers FFmpeg dynamically via `imageio-ffmpeg` package binaries if not on system PATH.
   - Uses standard Windows paths with forward-slash normalization.

---

## 4. Key Endpoints Specification
- `GET /api/health` — Probes host runtime, Python version, Node.js, and FFmpeg binary resolution.
- `GET /api/projects` — Lists local video projects.
- `POST /api/projects` — Creates a new video project with metadata and blank storyboard.
- `GET /api/projects/{id}` — Fetches complete project with scene and asset data.
- `PUT /api/projects/{id}` — Updates project settings or storyboard structure.
- `DELETE /api/projects/{id}` — Safely deletes or archives a project.
- `POST /api/projects/{id}/prompts/flow` — Compiles Google Flow prompts with camera/lens/lighting parameters.
- `GET /api/projects/{id}/validate` — Performs pre-render validation checks (audio, aspect ratio, assets).
- `GET /api/assets/{project_id}` — Lists all imported and generated assets for a project.
- `POST /api/assets/{project_id}/import` — Ingests a local file path with validation, metadata probing, and thumbnail generation.
- `POST /api/assets/{project_id}/upload` — Direct multipart media upload into safe project asset storage.
- `POST /api/assets/{project_id}/{asset_id}/attach` — Links an asset to a specific storyboard scene.
- `POST /api/assets/{project_id}/detach/{scene_id}` — Detaches an asset from a scene, reverting it to placeholder mode.
- `DELETE /api/assets/{project_id}/{asset_id}` — Deletes asset media and thumbnail from disk and updates project state.
- `GET /api/assets/{project_id}/{filename}` — Streams asset video or thumbnail securely with traversal protection.
- `GET /api/motion-graphics/templates` — Returns catalog of available motion graphics templates, default parameters, and schemas.
- `GET /api/motion-graphics/preview` — Generates transparent PNG preview frame for a template configuration and time offset.
- `GET /api/projects/{p_id}/scenes/{s_id}/overlays` — Lists all motion overlays configured for a specific scene.
- `POST /api/projects/{p_id}/scenes/{s_id}/overlays` — Adds a validated motion graphic overlay to a scene.
- `PUT /api/projects/{p_id}/scenes/{s_id}/overlays/{o_id}` — Updates overlay timing, content, or enabled status.
- `DELETE /api/projects/{p_id}/scenes/{s_id}/overlays/{o_id}` — Removes an overlay from a scene.

---

## 5. Visual Asset Storage & Security Policy
- **Isolation:** Each project maintains isolated asset storage under `backend/data/assets/{project_id}/` and `thumbnails/`.
- **Git Safety:** Media files inside `backend/data/assets/` are ignored in `.gitignore` to prevent large binary commits.
- **Sanitization & Traversal Guards:** Filenames and paths are sanitized using regex filtering against directory traversal attacks (`..`, illegal characters).
- **No Remote URLs:** External URLs (`http://`, `https://`) are strictly rejected by the local asset service.
- **Size Bounds:** Max 500 MB for video files, max 30 MB for graphic/image assets.

---

## 6. Motion Graphics Engine Architecture
- **Rendering Pipeline:**
  1. **Frame Generation:** Python Pillow generates 1080×1920 32-bit RGBA frames calculating animation easing (`ease-in` slide and fade, `ease-out`, and dynamic time elements like blinking REC indicator).
  2. **Alpha Encoding:** FFmpeg encodes PNG image sequences into QuickTime Animation format (`-c:v qtrle -pix_fmt argb`) within temporary `.mov` containers.
  3. **Compositing:** FFmpeg applies multi-input overlay filters with `-itsoffset` matching each overlay's `start_time` relative to the scene, ordered by layer.
  4. **Audio & Duration Preservation:** Video is bounded to the scene's exact duration (`-t duration`) and base audio is preserved via stream copy (`-map 0:a? -c:a copy`).
- **Investigative Templates:**
  - `kinetic_title`: Main documentary title reveal with crimson accent bar and archive tag.
  - `stat_card`: Large metric card with honest data provenance reporting ("SUMBER: BELUM DICANTUMKAN" when absent).
  - `timeline_event`: Historical period banner and event brief.
  - `investigation_hud`: Coordinates, evidence catalog number, and REC status indicator.
- **Clean Fallback:** Scenes without overlays skip rendering entirely, preserving standard assembly performance.

