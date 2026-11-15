@echo off
title ViralClip AI - Faceless Shorts Pro
cd /d "%~dp0"

:: Check if server is already running on port 8080
netstat -ano | findstr ":8080 " | findstr "LISTENING" >nul
if %errorlevel% neq 0 (
    echo Starting ViralClip AI Clipping Engine on port 8080...
    start "ViralClip AI Server" /min "c:\Users\savit\OneDrive\Desktop\jarvis\backend\.venv\Scripts\python.exe" -m uvicorn app:app --app-dir "c:\Users\savit\OneDrive\Desktop\jarvis\shorts-ai" --host 127.0.0.1 --port 8080
    timeout /t 3 /nobreak >nul
)

:: Launch in native Standalone App Window (PWA mode - no address bar or tabs)
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:8080 --window-size=1300,900
) else if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://localhost:8080 --window-size=1300,900
) else (
    start "" "http://localhost:8080"
)

exit
