import traceback
import sys

try:
    with open("server.log", "w") as f:
        f.write("Starting uvicorn...\n")
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, log_level="info")
except Exception as e:
    with open("server.log", "a") as f:
        f.write(traceback.format_exc())
