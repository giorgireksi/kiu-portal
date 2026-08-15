@echo off
setlocal enabledelayedexpansion

rem Start only the Electron anti-cheat browser. The LMS and backend are not touched.
set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"
set "PIDS_DIR=%ROOT%\.tmp\anti-cheat-browser"
set "PID_FILE=%PIDS_DIR%\anticheat.pid"
set "STACK_PID_FILE=%ROOT%\.tmp\local-lms-anticheat\anticheat.pid"
set "LOG_FILE=%PIDS_DIR%\anticheat.log"
set "PUBLIC_ENV_FILE=%ROOT%\.env.staging"
set "PUBLIC_URL=%KIU_PUBLIC_APP_URL%"
if not defined PUBLIC_URL for /f "tokens=1,* delims==" %%A in ('findstr /b "KIU_PUBLIC_APP_URL=" "%PUBLIC_ENV_FILE%" 2^>nul') do set "PUBLIC_URL=%%B"
set "PUBLIC_BACKEND_URL=%KIU_PUBLIC_BACKEND_URL%"
if not defined PUBLIC_BACKEND_URL for /f "tokens=1,* delims==" %%A in ('findstr /b "KIU_PUBLIC_BACKEND_URL=" "%PUBLIC_ENV_FILE%" 2^>nul') do set "PUBLIC_BACKEND_URL=%%B"
set "PUBLIC_URL=%PUBLIC_URL:"=%"
set "PUBLIC_BACKEND_URL=%PUBLIC_BACKEND_URL:"=%"
if not defined PUBLIC_URL (
    echo A public URL is required. Set KIU_PUBLIC_APP_URL or update %PUBLIC_ENV_FILE%. 1>&2
    exit /b 1
)
if not defined PUBLIC_BACKEND_URL set "PUBLIC_BACKEND_URL=%PUBLIC_URL%"
set "KIU_PUBLIC_APP_URL=%PUBLIC_URL%"
set "KIU_PUBLIC_BACKEND_URL=%PUBLIC_BACKEND_URL%"
set "KIU_ANTI_CHEAT_APP_URL=%PUBLIC_URL%"
set "KIU_ANTI_CHEAT_BACKEND_URL=%PUBLIC_BACKEND_URL%"
set "KIU_ANTI_CHEAT_QUIZ_URL=%PUBLIC_URL%/exam-portal.html"
set "BRIDGE_PORT=%KIU_ANTI_CHEAT_BRIDGE_PORT%"
if not defined BRIDGE_PORT set "BRIDGE_PORT=%KIU_LOCAL_BRIDGE_PORT%"
if not defined BRIDGE_PORT set "BRIDGE_PORT=47835"
set "BRIDGE_HEALTH_URL=http://127.0.0.1:%BRIDGE_PORT%/health"

if not exist "%PIDS_DIR%" mkdir "%PIDS_DIR%"
call "%ROOT%\tools\local_stack_stop_helpers.bat" :read_pid_if_running "%PID_FILE%"
set "existing_pid=!READ_PID_RESULT!"
if not defined existing_pid call "%ROOT%\tools\local_stack_stop_helpers.bat" :read_pid_if_running "%STACK_PID_FILE%"
if not defined existing_pid set "existing_pid=!READ_PID_RESULT!"
if defined existing_pid (
    echo Restarting anti-cheat browser to connect it to %PUBLIC_URL%...
    call "%ROOT%\stop-anti-cheat-browser.bat" --no-pause
)

powershell -NoProfile -Command "$r=try { Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 '%BRIDGE_HEALTH_URL%' } catch { $null }; if ($r -and $r.StatusCode -eq 200) { exit 0 } else { exit 1 }" >nul 2>&1
if not errorlevel 1 (
    echo Anti-cheat bridge is already running without a matching launcher PID. 1>&2
    echo Stop it first: stop-anti-cheat-browser.bat 1>&2
    exit /b 1
)

call "%ROOT%\tools\local_stack_stop_helpers.bat" :port_in_use %BRIDGE_PORT%
if not errorlevel 1 (
    echo Anti-cheat bridge port %BRIDGE_PORT% is already in use. 1>&2
    echo Stop the anti-cheat browser first: stop-anti-cheat-browser.bat 1>&2
    exit /b 1
)

if not exist "%ROOT%\anti-cheat\node_modules" (
    echo Installing anti-cheat dependencies...
    cd /d "%ROOT%\anti-cheat"
    call npm install
    if errorlevel 1 exit /b 1
)

cd /d "%ROOT%\anti-cheat"
echo Building anti-cheat browser...
call npm run build
if errorlevel 1 exit /b 1
node scripts\ensure-electron-platform.js
if errorlevel 1 exit /b 1

powershell -NoProfile -File "%ROOT%\tools\start_stack_process.ps1" -WorkDir "%ROOT%\anti-cheat" -LogFile "%LOG_FILE%" -NodeArgs "node_modules\electron\cli.js ." -PidFile "%PID_FILE%"
if errorlevel 1 exit /b 1

set "ready=false"
for /l %%I in (1,1,45) do (
    powershell -NoProfile -Command "$r=try { Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 '%BRIDGE_HEALTH_URL%' } catch { $null }; if ($r -and $r.StatusCode -eq 200) { exit 0 } else { exit 1 }" >nul 2>&1
    if not errorlevel 1 (
        set "ready=true"
        goto :bridge_ready
    )
    timeout /t 2 /nobreak >nul
)

:bridge_ready
if /i not "%ready%"=="true" (
    echo Anti-cheat bridge did not become ready on %BRIDGE_HEALTH_URL%. 1>&2
    echo Anti-cheat log: %LOG_FILE% 1>&2
    call "%ROOT%\stop-anti-cheat-browser.bat" --no-pause
    exit /b 1
)

echo Anti-cheat browser started separately.
echo Bridge: %BRIDGE_HEALTH_URL%
echo Log:    %LOG_FILE%
echo Stop:   %ROOT%\stop-anti-cheat-browser.bat

:finish
if /i "%~1"=="--no-pause" goto :eof
timeout /t 2 /nobreak >nul
pause
goto :eof
