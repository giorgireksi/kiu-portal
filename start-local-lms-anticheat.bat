@echo off
setlocal enabledelayedexpansion

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"
set "HELPERS=%ROOT%\tools\local_stack_stop_helpers.bat"

goto :main

:is_truthy
set "val=%~1"
if /i "%val%"=="1" exit /b 0
if /i "%val%"=="true" exit /b 0
if /i "%val%"=="yes" exit /b 0
if /i "%val%"=="on" exit /b 0
exit /b 1

:is_url_ready
set "url=%~1"
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri '%url%' -TimeoutSec 2 -UseBasicParsing; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if not errorlevel 1 exit /b 0
exit /b 1

:wait_for_url
set "url=%~1"
set "attempts=%~2"
set "delay=%~3"
for /l %%i in (1,1,%attempts%) do (
    call :is_url_ready "%url%"
    if not errorlevel 1 exit /b 0
    timeout /t %delay% /nobreak >nul 2>&1
)
exit /b 1

:core_stack_healthy
call :is_url_ready "%BACKEND_HEALTH_URL%"
if errorlevel 1 exit /b 1
call :is_url_ready "%FRONTEND_HEALTH_URL%"
if errorlevel 1 exit /b 1
exit /b 0

:print_stack_urls
echo Setup:     %SETUP_URL%
echo LMS:        %FRONTEND_URL%
echo Login:      %LOGIN_URL%
echo Local LMS:  %LOCAL_FRONTEND_URL%
echo Local login: %LOCAL_LOGIN_URL%
echo Backend:    http://%PUBLIC_HOST%:%BACKEND_PORT%
echo Backend local: http://127.0.0.1:%BACKEND_PORT%
echo LAN IP:     %PUBLIC_HOST%
echo Bridge:     %BRIDGE_HEALTH_URL%
exit /b 0

:main
call "%HELPERS%" :ensure_launcher_terminal "%ROOT%\start-local-lms-anticheat.bat" %*
if errorlevel 100 exit /b 0

set "PIDS_DIR=%ROOT%\.tmp\local-lms-anticheat"
if not exist "%PIDS_DIR%" mkdir "%PIDS_DIR%"

set "LAN_MODE=%KIU_LOCAL_LAN_MODE%"
if not defined LAN_MODE set "LAN_MODE=1"

set "FRONTEND_PORT=%KIU_LOCAL_LMS_PORT%"
if not defined FRONTEND_PORT set "FRONTEND_PORT=%KIU_LMS_PORT%"
if not defined FRONTEND_PORT set "FRONTEND_PORT=8876"

set "BACKEND_PORT=%KIU_LOCAL_BACKEND_PORT%"
if not defined BACKEND_PORT set "BACKEND_PORT=%KIU_BACKEND_PORT%"
if not defined BACKEND_PORT set "BACKEND_PORT=48933"

set "BRIDGE_PORT=%KIU_ANTI_CHEAT_BRIDGE_PORT%"
if not defined BRIDGE_PORT set "BRIDGE_PORT=%KIU_LOCAL_BRIDGE_PORT%"
if not defined BRIDGE_PORT set "BRIDGE_PORT=47835"

set "BACKEND_HEALTH_URL=http://127.0.0.1:%BACKEND_PORT%/health"
set "FRONTEND_HEALTH_URL=http://127.0.0.1:%FRONTEND_PORT%/login.html"
set "BRIDGE_HEALTH_URL=http://127.0.0.1:%BRIDGE_PORT%/health"

set "FRONTEND_PID_FILE=%PIDS_DIR%\frontend.pid"
set "BACKEND_PID_FILE=%PIDS_DIR%\backend.pid"
set "ANTICHEAT_PID_FILE=%PIDS_DIR%\anticheat.pid"

set "FRONTEND_LOG=%PIDS_DIR%\frontend.log"
set "BACKEND_LOG=%PIDS_DIR%\backend.log"
set "ANTICHEAT_LOG=%PIDS_DIR%\anticheat.log"

where node >nul 2>&1
if errorlevel 1 (
    echo Node.js was not found on this machine. >&2
    echo Install Node.js from https://nodejs.org/ and run this file again. >&2
    pause
    exit /b 1
)

call :is_truthy "%LAN_MODE%"
if not errorlevel 1 (
    if not defined KIU_LOCAL_BIND_HOST set "FRONTEND_BIND_HOST=0.0.0.0"
    if not defined FRONTEND_BIND_HOST set "FRONTEND_BIND_HOST=0.0.0.0"
    if not defined KIU_LOCAL_BACKEND_BIND_HOST set "BACKEND_BIND_HOST=0.0.0.0"
    if not defined BACKEND_BIND_HOST set "BACKEND_BIND_HOST=0.0.0.0"
    if not defined KIU_LOCAL_BACKEND_PROXY_HOST set "BACKEND_PROXY_HOST=127.0.0.1"
    if not "%KIU_LOCAL_LAN_IP%"=="" (
        set "PUBLIC_HOST=%KIU_LOCAL_LAN_IP%"
    ) else (
        for /f "delims=" %%a in ('node "%ROOT%\tools\detect_lan_ip.js" 2^>nul') do set "PUBLIC_HOST=%%a"
        if not defined PUBLIC_HOST set "PUBLIC_HOST=127.0.0.1"
        if "!PUBLIC_HOST!"=="127.0.0.1" echo No LAN IP was detected; falling back to localhost. Set KIU_LOCAL_LAN_IP manually if needed.
    )
) else (
    if not defined FRONTEND_BIND_HOST set "FRONTEND_BIND_HOST=%KIU_LOCAL_BIND_HOST%"
    if not defined FRONTEND_BIND_HOST set "FRONTEND_BIND_HOST=%KIU_LOCAL_LMS_HOST%"
    if not defined FRONTEND_BIND_HOST set "FRONTEND_BIND_HOST=127.0.0.1"
    if not defined BACKEND_BIND_HOST set "BACKEND_BIND_HOST=%KIU_LOCAL_BACKEND_BIND_HOST%"
    if not defined BACKEND_BIND_HOST set "BACKEND_BIND_HOST=%KIU_LOCAL_BACKEND_HOST%"
    if not defined BACKEND_BIND_HOST set "BACKEND_BIND_HOST=127.0.0.1"
    if not defined BACKEND_PROXY_HOST set "BACKEND_PROXY_HOST=%KIU_LOCAL_BACKEND_PROXY_HOST%"
    if not defined BACKEND_PROXY_HOST set "BACKEND_PROXY_HOST=%BACKEND_BIND_HOST%"
    if not "%KIU_LOCAL_LAN_IP%"=="" (
        set "PUBLIC_HOST=%KIU_LOCAL_LAN_IP%"
    ) else (
        set "PUBLIC_HOST=%FRONTEND_BIND_HOST%"
    )
)

if not defined PUBLIC_HOST set "PUBLIC_HOST=127.0.0.1"
if "%PUBLIC_HOST%"=="" set "PUBLIC_HOST=127.0.0.1"

set "FRONTEND_URL=http://%PUBLIC_HOST%:%FRONTEND_PORT%/lms.html"
set "LOGIN_URL=http://%PUBLIC_HOST%:%FRONTEND_PORT%/login.html"
set "SETUP_URL=http://%PUBLIC_HOST%:%FRONTEND_PORT%/wifi-setup.html"
set "LOCAL_FRONTEND_URL=http://127.0.0.1:%FRONTEND_PORT%/lms.html"
set "LOCAL_LOGIN_URL=http://127.0.0.1:%FRONTEND_PORT%/login.html"

set "frontend_pid="
set "backend_pid="
set "anticheat_pid="
call "%HELPERS%" :read_pid_if_running "%FRONTEND_PID_FILE%"
if not errorlevel 1 set "frontend_pid=!READ_PID_RESULT!"
call "%HELPERS%" :read_pid_if_running "%BACKEND_PID_FILE%"
if not errorlevel 1 set "backend_pid=!READ_PID_RESULT!"
call "%HELPERS%" :read_pid_if_running "%ANTICHEAT_PID_FILE%"
if not errorlevel 1 set "anticheat_pid=!READ_PID_RESULT!"

call :core_stack_healthy
if not errorlevel 1 (
    echo KIU LMS stack is already reachable.
    call :print_stack_urls
    start "" "%SETUP_URL%"
    timeout /t 3 /nobreak >nul
    start "" "%LOGIN_URL%"
    exit /b 0
)

set "frontend_port_busy=false"
set "backend_port_busy=false"
call "%HELPERS%" :port_in_use %FRONTEND_PORT%
if not errorlevel 1 set "frontend_port_busy=true"
call "%HELPERS%" :port_in_use %BACKEND_PORT%
if not errorlevel 1 set "backend_port_busy=true"

set "any_pid="
if defined frontend_pid set "any_pid=true"
if defined backend_pid set "any_pid=true"
if defined anticheat_pid set "any_pid=true"

if defined any_pid (
    echo Stack processes are stale or unhealthy. Restarting...
    call "%ROOT%\stop-local-lms-anticheat.bat" --no-pause
    ping 127.0.0.1 -n 3 >nul
) else if "%frontend_port_busy%"=="true" (
    echo Ports %FRONTEND_PORT%/%BACKEND_PORT% are busy but health checks failed. Restarting...
    call "%ROOT%\stop-local-lms-anticheat.bat" --no-pause
    ping 127.0.0.1 -n 3 >nul
) else if "%backend_port_busy%"=="true" (
    echo Ports %FRONTEND_PORT%/%BACKEND_PORT% are busy but health checks failed. Restarting...
    call "%ROOT%\stop-local-lms-anticheat.bat" --no-pause
    ping 127.0.0.1 -n 3 >nul
)

call "%HELPERS%" :cleanup_stale_pid "%FRONTEND_PID_FILE%"
call "%HELPERS%" :cleanup_stale_pid "%BACKEND_PID_FILE%"
call "%HELPERS%" :cleanup_stale_pid "%ANTICHEAT_PID_FILE%"

call "%HELPERS%" :port_in_use %FRONTEND_PORT%
if not errorlevel 1 (
    echo Port %FRONTEND_PORT% is already in use. >&2
    echo Stop the existing stack first: stop-local-lms-anticheat.bat >&2
    pause
    exit /b 1
)
call "%HELPERS%" :port_in_use %BACKEND_PORT%
if not errorlevel 1 (
    echo Port %BACKEND_PORT% is already in use. >&2
    echo Stop the existing stack first: stop-local-lms-anticheat.bat >&2
    pause
    exit /b 1
)

if not exist "%ROOT%\node_modules" (
    echo Installing platform dependencies...
    cd /d "%ROOT%"
    call npm install
    if errorlevel 1 (
        echo npm install failed. >&2
        pause
        exit /b 1
    )
)

if not exist "%ROOT%\anti-cheat\node_modules" (
    echo Installing anti-cheat dependencies...
    cd /d "%ROOT%\anti-cheat"
    call npm install
    if errorlevel 1 (
        echo npm install in anti-cheat failed. >&2
        pause
        exit /b 1
    )
    cd /d "%ROOT%"
)

cd /d "%ROOT%"

set "KIU_LOCAL_BACKEND_PORT=%BACKEND_PORT%"
set "KIU_LOCAL_LAN_IP=%PUBLIC_HOST%"
set "KIU_LOCAL_BIND_HOST=%FRONTEND_BIND_HOST%"
set "KIU_LOCAL_BACKEND_BIND_HOST=%BACKEND_BIND_HOST%"
set "KIU_LOCAL_BACKEND_PROXY_HOST=%BACKEND_PROXY_HOST%"
set "KIU_LOCAL_BACKEND_HOST=%BACKEND_PROXY_HOST%"
set "KIU_REALTIME_HOST=%BACKEND_BIND_HOST%"
set "KIU_REALTIME_PORT=%BACKEND_PORT%"
set "KIU_PUBLIC_APP_URL=http://%PUBLIC_HOST%:%FRONTEND_PORT%"
set "KIU_PUBLIC_BACKEND_URL=http://%PUBLIC_HOST%:%BACKEND_PORT%"
set "KIU_ANTI_CHEAT_APP_URL=http://%PUBLIC_HOST%:%FRONTEND_PORT%"
set "KIU_ANTI_CHEAT_BACKEND_URL=http://%PUBLIC_HOST%:%BACKEND_PORT%"
set "KIU_ANTI_CHEAT_BRIDGE_PORT=%BRIDGE_PORT%"

echo Starting backend on :%BACKEND_PORT%...
powershell -NoProfile -File "%ROOT%\tools\start_stack_process.ps1" -WorkDir "%ROOT%" -LogFile "%BACKEND_LOG%" -NodeArgs "backend\platform\server.js" -PidFile "%BACKEND_PID_FILE%"
set "BACKEND_REAL_PID="
if exist "%BACKEND_PID_FILE%" set /p BACKEND_REAL_PID=<"%BACKEND_PID_FILE%"

echo Starting web app on :%FRONTEND_PORT%...
powershell -NoProfile -File "%ROOT%\tools\start_stack_process.ps1" -WorkDir "%ROOT%" -LogFile "%FRONTEND_LOG%" -NodeArgs "tools\local_dev_server.js %FRONTEND_PORT%" -PidFile "%FRONTEND_PID_FILE%"
set "FRONTEND_REAL_PID="
if exist "%FRONTEND_PID_FILE%" set /p FRONTEND_REAL_PID=<"%FRONTEND_PID_FILE%"

echo Waiting for backend to start...
call :wait_for_url "%BACKEND_HEALTH_URL%" 25 1
if errorlevel 1 (
    echo Backend did not become ready on %BACKEND_HEALTH_URL% >&2
    echo Backend log: %BACKEND_LOG% >&2
    call "%ROOT%\stop-local-lms-anticheat.bat" --no-pause
    pause
    exit /b 1
)

echo Waiting for frontend to start...
call :wait_for_url "%FRONTEND_HEALTH_URL%" 25 1
if errorlevel 1 (
    echo Frontend did not become ready on %FRONTEND_HEALTH_URL% >&2
    echo Frontend log: %FRONTEND_LOG% >&2
    call "%ROOT%\stop-local-lms-anticheat.bat" --no-pause
    pause
    exit /b 1
)

set "BRIDGE_READY=true"

set "SKIP_AC=%KIU_SKIP_ANTICHEAT%"
set "SKIP_ANTICHEAT=false"
if "%KIU_SKIP_ANTICHEAT%"=="1" set "SKIP_ANTICHEAT=true"
call :is_truthy "%SKIP_AC%"
if not errorlevel 1 set "SKIP_ANTICHEAT=true"
if "%SKIP_ANTICHEAT%"=="true" (
    echo Skipping anti-cheat startup ^(KIU_SKIP_ANTICHEAT is set^).
    set "BRIDGE_READY=false"
) else (
    echo Starting anti-cheat desktop app in background ^(bridge :%BRIDGE_PORT%^)...
    cd /d "%ROOT%\anti-cheat"
    call npm run build
    if exist "scripts\ensure-electron-platform.js" (
        node scripts\ensure-electron-platform.js
    )
    powershell -NoProfile -File "%ROOT%\tools\start_stack_process.ps1" -WorkDir "%ROOT%\anti-cheat" -LogFile "%ANTICHEAT_LOG%" -NodeArgs "node_modules\electron\cli.js ." -PidFile "%ANTICHEAT_PID_FILE%"
    set "ANTICHEAT_REAL_PID="
    if exist "%ANTICHEAT_PID_FILE%" set /p ANTICHEAT_REAL_PID=<"%ANTICHEAT_PID_FILE%"
    cd /d "%ROOT%"
    echo Waiting for anti-cheat bridge ^(Electron may take a minute on first start^)...
)

if "!BRIDGE_READY!"=="true" (
    call :wait_for_url "%BRIDGE_HEALTH_URL%" 90 2
    if errorlevel 1 (
        set "BRIDGE_READY=false"
        echo Anti-cheat bridge did not become ready on %BRIDGE_HEALTH_URL% >&2
        echo Anti-cheat log: %ANTICHEAT_LOG% >&2
        echo Backend and LMS are up; this is a partial stack until the desktop app starts. >&2
        echo Recovery: run this launcher again, or start the app manually with: cd anti-cheat ^&^& npm run start >&2
    )
)

echo.
if "!BRIDGE_READY!"=="true" (
    echo KIU LMS + anti-cheat local stack started.
) else (
    echo KIU LMS + backend local stack started. Anti-cheat bridge still needs attention.
)
call :print_stack_urls
echo Stop:       %ROOT%\stop-local-lms-anticheat.bat
echo Stop npm:   npm run stop:local:win
echo Logs:
echo - %FRONTEND_LOG%
echo - %BACKEND_LOG%
echo - %ANTICHEAT_LOG%

start "" "%SETUP_URL%"
ping 127.0.0.1 -n 4 >nul
start "" "%LOGIN_URL%"
echo.
pause
exit /b 0