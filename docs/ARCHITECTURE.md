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
