# FFmpeg & Remotion Integration Strategy

## 1. Verified Runtime Context
Based on empirical workspace discovery on Windows:
- **FFmpeg Binary:** Not located in global system PATH.
- **Embedded FFmpeg 7.1:** Successfully resolved and verified via Python package `imageio-ffmpeg`:
  - Path: `C:\Users\WIND11\AppData\Roaming\Python\Python312\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe`
  - Version: FFmpeg 7.1 with `libx264`, `libx265`, `libass`, `libfreetype`, `libmp3lame`, `libopus`.
- **Node.js & npm:** Node v22.22.0, npm 11.12.1.
- **Remotion:** Not installed globally. Must be configured as a local module or isolated renderer package in Phase 3.

---

## 2. FFmpeg Execution Layer

### Dynamic Resolver Protocol
The backend uses a fallback-aware binary resolver in `backend/app/services/ffmpeg_service.py`:
1. Check `shutil.which("ffmpeg")` (System PATH).
2. Fallback to `imageio_ffmpeg.get_ffmpeg_exe()`.
3. Check relative `./bin/ffmpeg.exe` if bundled locally.
4. Report clear diagnostic error if no binary is resolvable.

### Target Video Encoding Profile
- **Resolution:** 1080 × 1920 (Vertical 9:16)
- **Container:** MP4
- **Video Codec:** `libx264`
- **Preset:** `medium` / `fast`
- **Pixel Format:** `yuv420p`
- **Frame Rate:** Constant Frame Rate (CFR) 30.0 or 60.0 fps
- **Audio Codec:** `aac`, stereo, 48 kHz, 192 kbps
- **Subtitles:** Burn-in using `-vf subtitles=...:force_style='Fontsize=22,PrimaryColour=&H00FFFFFF,OutlineColour=&H80000000,BorderStyle=3,MarginV=120'`

---

## 3. Remotion & SVG Motion Graphics Strategy

### Two-Tier Motion Graphics Architecture
1. **Tier 1 (Instant SVG / HTML Canvas):**
   - For fast overlays (intro titlecards, lower thirds, chapter text, callout boxes).
   - Can be rendered using headless browser capture (Playwright Chromium) or converted to frames without requiring a heavy Remotion node runtime.
2. **Tier 2 (Remotion Isolated Bundle):**
   - Created in a dedicated `render-engine/` directory.
   - Leverages React component composition for complex animations (spring physics, 3D layer transforms, kinetic text).
   - Exported as transparent WebM (`vp9` with alpha channel) or direct PNG sequence and composited into the main video timeline using FFmpeg `overlay` filter.
