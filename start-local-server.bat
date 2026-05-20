@echo off
set PORT=8876
cd /d "%~dp0"

if exist "%~dp0start-platform-backend.bat" (
    start "KIU Platform Backend" "%~dp0start-platform-backend.bat"
)

where python >nul 2>nul
if %errorlevel%==0 (
    start "" "http://127.0.0.1:%PORT%/login.html"
    python "%~dp0tools\local_dev_server.py" %PORT%
    goto :eof
)

where py >nul 2>nul
if %errorlevel%==0 (
    start "" "http://127.0.0.1:%PORT%/login.html"
    py "%~dp0tools\local_dev_server.py" %PORT%
    goto :eof
)

echo Python was not found on this machine.
echo Install Python or run the site through any local HTTP server, then open:
echo http://127.0.0.1:%PORT%/login.html
pause
