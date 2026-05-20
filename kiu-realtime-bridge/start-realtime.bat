@echo off
cd /d "%~dp0\.."
set KIU_REALTIME_PORT=48933
set KIU_PUBLIC_APP_URL=http://127.0.0.1:8876
set KIU_PUBLIC_BACKEND_URL=http://127.0.0.1:48933
echo Starting KIU platform backend on http://127.0.0.1:48933
node backend\platform\server.js
