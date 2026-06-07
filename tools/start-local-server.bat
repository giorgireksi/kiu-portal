@echo off
set PORT=8876
cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js was not found on this machine.
    echo Install Node.js from https://nodejs.org/ and run this file again.
    pause
    exit /b 1
)

start "" "http://127.0.0.1:%PORT%/login.html"
node "%~dp0local_dev_server.js" %PORT%
pause
