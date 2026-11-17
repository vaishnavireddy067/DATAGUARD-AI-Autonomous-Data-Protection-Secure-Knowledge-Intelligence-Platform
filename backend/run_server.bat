@echo off
cd /d "c:\Users\anugu vaishnavi\OneDrive\Desktop\DataGuard\backend"
"c:\Users\anugu vaishnavi\OneDrive\Desktop\DataGuard\venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 >> "c:\Users\anugu vaishnavi\OneDrive\Desktop\DataGuard\backend\server.log" 2>&1
