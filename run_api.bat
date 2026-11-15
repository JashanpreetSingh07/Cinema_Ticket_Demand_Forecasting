@echo off
title Cinema Demand Forecaster - FastAPI Service
cd /d "%~dp0"
set PYTHONPATH=%cd%
echo ========================================================
echo Launching Cinema Demand Forecasting FastAPI Service
echo Open in browser: http://localhost:8000/docs
echo ========================================================
python -m uvicorn src.api.app:app --host 127.0.0.1 --port 8000 --reload
pause
