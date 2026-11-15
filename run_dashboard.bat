@echo off
title Cinema Demand Forecaster - Streamlit Operations Dashboard
cd /d "%~dp0"
set PYTHONPATH=%cd%
echo ========================================================
echo Launching Cinema Demand Forecasting Streamlit Dashboard
echo ========================================================
python -m streamlit run dashboard/streamlit_app.py
pause
