import subprocess
import os
import sys

backend_dir = os.path.dirname(os.path.abspath(__file__))
venv_python = os.path.abspath(os.path.join(backend_dir, "..", "venv", "Scripts", "python.exe"))
if not os.path.exists(venv_python):
    venv_python = sys.executable

DETACHED_PROCESS = 0x00000008
CREATE_NEW_PROCESS_GROUP = 0x00000200
CREATE_NO_WINDOW = 0x08000000

cmd = [venv_python, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8002"]
log_path = os.path.join(backend_dir, "uvicorn_daemon.log")

with open(log_path, "a") as log_file:
    p = subprocess.Popen(
        cmd,
        cwd=backend_dir,
        stdout=log_file,
        stderr=log_file,
        stdin=subprocess.DEVNULL,
        creationflags=DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP | CREATE_NO_WINDOW,
        close_fds=True
    )

print(f"Backend daemon successfully spawned with PID {p.pid}")
