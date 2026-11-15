@echo off
title Cinema Demand AI - React Web Platform
cd /d "%~dp0frontend"
echo ========================================================
echo   CineDemand AI - Production Multiplex Web Platform
echo   Launching Vite + React Modern Web Application...
echo   URL: http://localhost:5173
echo ========================================================
start "" http://localhost:5173
call npm run dev
pause
