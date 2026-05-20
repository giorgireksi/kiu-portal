@echo off
set "ROOT=%~dp0"
set "FRONTEND_URL=http://127.0.0.1:8876/login.html"
set "BACKEND_URL=http://127.0.0.1:48933"

title KIU Portal Platform
color 0A

echo ========================================
echo   KIU Portal Platform Launcher
echo ========================================
echo.

REM Check if running as admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Running in normal mode...
    echo.
)

cd /d "%ROOT%"

REM Start backend from the repo root package.json
echo [1/2] Starting Platform Backend...
if not exist node_modules (
    echo Installing platform dependencies...
    call npm install
)
start "KIU Platform Backend" /MIN cmd /c "cd /d ""%ROOT%"" && set KIU_REALTIME_PORT=48933&& set KIU_PUBLIC_APP_URL=http://127.0.0.1:8876&& set KIU_PUBLIC_BACKEND_URL=http://127.0.0.1:48933&& npm run start:platform"
timeout /t 2 /nobreak >nul
echo Backend started!
echo.

REM Start the local web server and open the portal
echo [2/2] Starting Local Web App...
start "KIU Web App" cmd /c "cd /d ""%ROOT%"" && call start-local-server.bat"
echo.

echo ========================================
echo   All services started successfully!
echo ========================================
echo.
echo Backend:  %BACKEND_URL% (running in background)
echo Frontend: %FRONTEND_URL%
echo.
echo To stop the services later, close the "KIU Platform Backend" and "KIU Web App" windows.
echo.
pause
