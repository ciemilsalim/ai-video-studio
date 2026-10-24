@echo off
title AI Video Studio - Windows Local Launcher
color 0b

echo ========================================================
echo         AI VIDEO STUDIO - LOCAL LAUNCHER (WINDOWS)
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Memeriksa Lingkungan Runtime...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python tidak terdeteksi! Silakan instal Python 3.10+ terlebih dahulu.
    pause
    exit /b 1
)

node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js tidak terdeteksi! Silakan instal Node.js v18+ terlebih dahulu.
    pause
    exit /b 1
)

echo [✓] Python dan Node.js siap.
echo.

echo [2/3] Menjalankan Backend FastAPI (Port 8000)...
start "AI Video Studio - Backend API" cmd /k "title AI Video Studio Backend && cd /d %~dp0backend && set PYTHONPATH=. && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [3/3] Menjalankan Frontend Vite (Port 5173)...
start "AI Video Studio - Web Dashboard" cmd /k "title AI Video Studio Frontend && cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================================
echo AI Video Studio sedang aktif!
echo Dashboard: http://localhost:5173
echo API Docs:  http://127.0.0.1:8000/docs
echo ========================================================
echo.
timeout /t 3 >nul
start http://localhost:5173
