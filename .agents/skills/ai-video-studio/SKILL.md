---
name: ai-video-studio
description: Autonomous Documentary AI Video Production Engine — Storyboarding, Google Flow cinematic prompt engineering, SVG/Remotion motion graphics, Edge-TTS audio ducking, and vertical 1080x1920 FFmpeg assembly.
---

# AI Video Studio Skill

Skill agent untuk merancang, mengelola, dan memproduksi video dokumenter AI berkualitas tinggi dengan motion graphics otomatis, naskah narasi, Google Flow Prompt Studio, dan rendering FFmpeg lokal.

## 1. Arsitektur Terisolasi

Skill ini beroperasi khusus untuk ekosistem AI Video Studio di root workspace `d:\laragon\www\ai-video-studio` dan sepenuhnya terisolasi dari skill tutorial aplikasi (`app-tutorial-video`).

```
┌────────────────────────────────────────────────────────┐
│               AI VIDEO STUDIO SKILL (V1)               │
│  - Storyboard Builder & Documentary Architect          │
│  - Prompt Studio for Google Flow                       │
│  - Motion Graphics & SVG Composition Planner           │
│  - Voiceover & BGM Ducking Synthesizer                 │
│  - FFmpeg Vertical Video (1080x1920) Assembly          │
└────────────────────────────────────────────────────────┘
```

## 2. Kemampuan Inti

1. **Documentary Script & Storyboard Design:**
   - Menghasilkan narasi mendalam berbasis babak (hook, rising context, core conflict, revelation, conclusion).
   - Menentukan shot type (drone aerial, macro detail, slow push-in, medium portrait).
   - Menghitung timing durasi per adegan agar pas dengan ritme bicara narator.

2. **Google Flow Cinematic Prompt Engineering:**
   - Menghasilkan prompt siap pakai dengan standar sinematografi: subject framing, camera movement, focal length, lighting, dan color grading.
   - Mengunci aspect ratio 9:16 untuk konsistensi vertikal.

3. **Motion Graphics Specification:**
   - Menentukan visual overlays: Titlecards, Lower Thirds, Quote Highlights, dan Stat Badges.

4. **FFmpeg Assembly Coordination:**
   - Memastikan bitrate, Constant Frame Rate (CFR), dan resolusi 1080×1920 terjaga tanpa distorsi.

## 3. Cara Penggunaan di Antigravity
Panggil dalam chat:
```text
/ai-video-studio create project "Misteri Peradaban Nusantara" --aspect 9:16
```
atau minta agent merancang naskah dan mengekspor prompt untuk adegan tertentu.
