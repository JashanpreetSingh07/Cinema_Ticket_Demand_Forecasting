@echo off
title Cinema Demand AI - Master Full-Stack Launcher
cd /d "%~dp0"
echo ========================================================
echo   CineDemand AI - Master Production Launcher
echo   1. Starting FastAPI Machine Learning Backend (127.0.0.1:8000)
echo   2. Starting React Modern Web Platform (localhost:5173)
echo ========================================================

:: 1. Launch FastAPI Backend in a separate window
start "FastAPI ML Backend (Port 8000)" cmd /k "cd /d "%~dp0" && set PYTHONPATH=%cd% && python -m uvicorn src.api.app:app --host 127.0.0.1 --port 8000"

:: Wait 3 seconds for backend initialization
timeout /t 3 /nobreak >nul

:: 2. Launch React Frontend
echo Opening React Web Platform in browser...
start "" http://localhost:5173
cd /d "%~dp0frontend"
call npm run dev
pause
