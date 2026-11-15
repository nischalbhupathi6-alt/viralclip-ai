@echo off
cd /d "c:\Users\savit\OneDrive\Desktop\jarvis\shorts-ai"
"c:\Users\savit\OneDrive\Desktop\jarvis\backend\.venv\Scripts\python.exe" -m uvicorn app:app --app-dir "c:\Users\savit\OneDrive\Desktop\jarvis\shorts-ai" --host 127.0.0.1 --port 8080
