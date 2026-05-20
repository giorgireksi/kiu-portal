@echo off
set "ROOT=%~dp0.."

echo ========================================
echo Backend Server Setup & Start
echo ========================================
echo.

cd /d "%ROOT%"

echo [1/2] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js found!
echo.

echo [2/2] Installing dependencies and starting server...
if not exist node_modules (
    echo Installing npm packages...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo Starting Backend Server...
echo ========================================
set KIU_REALTIME_PORT=48933
set KIU_PUBLIC_APP_URL=http://127.0.0.1:8876
set KIU_PUBLIC_BACKEND_URL=http://127.0.0.1:48933
echo Server will run on: http://127.0.0.1:48933
echo Frontend should point to: http://127.0.0.1:8876
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run start:platform
