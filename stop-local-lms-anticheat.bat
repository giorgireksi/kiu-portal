@echo off
setlocal enabledelayedexpansion

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

set "HELPERS=%ROOT%\tools\local_stack_stop_helpers.bat"
set "PIDS_DIR=%ROOT%\.tmp\local-lms-anticheat"

set "STOP_FRONTEND_PORT=%KIU_LOCAL_LMS_PORT%"
if not defined STOP_FRONTEND_PORT set "STOP_FRONTEND_PORT=%KIU_LMS_PORT%"
if not defined STOP_FRONTEND_PORT set "STOP_FRONTEND_PORT=8876"

set "STOP_BACKEND_PORT=%KIU_LOCAL_BACKEND_PORT%"
if not defined STOP_BACKEND_PORT set "STOP_BACKEND_PORT=%KIU_BACKEND_PORT%"
if not defined STOP_BACKEND_PORT set "STOP_BACKEND_PORT=48933"

set "STOP_BRIDGE_PORT=%KIU_ANTI_CHEAT_BRIDGE_PORT%"
if not defined STOP_BRIDGE_PORT set "STOP_BRIDGE_PORT=%KIU_LOCAL_BRIDGE_PORT%"
if not defined STOP_BRIDGE_PORT set "STOP_BRIDGE_PORT=47835"

call "%HELPERS%" :kill_pid_file "%PIDS_DIR%\frontend.pid"
call "%HELPERS%" :kill_pid_file "%PIDS_DIR%\backend.pid"
call "%HELPERS%" :kill_pid_file "%PIDS_DIR%\anticheat.pid"

call "%HELPERS%" :kill_process_by_pattern "tools/local_dev_server.js" "%ROOT%"
call "%HELPERS%" :kill_process_by_pattern "backend/platform/server.js" "%ROOT%"
call "%HELPERS%" :kill_process_by_pattern "anti-cheat/node_modules/electron/cli.js" "%ROOT%"
call "%HELPERS%" :kill_anticheat_processes "%ROOT%\anti-cheat"

call "%HELPERS%" :kill_ports %STOP_FRONTEND_PORT% 8876 8888 %STOP_BACKEND_PORT% %STOP_BRIDGE_PORT%

if exist "%ROOT%\.tmp\local-8876\frontend.pid" del /f /q "%ROOT%\.tmp\local-8876\frontend.pid" 2>nul
if exist "%ROOT%\.tmp\local-8876\backend.pid" del /f /q "%ROOT%\.tmp\local-8876\backend.pid" 2>nul
if exist "%ROOT%\.tmp\local-8888\frontend.pid" del /f /q "%ROOT%\.tmp\local-8888\frontend.pid" 2>nul
if exist "%ROOT%\.tmp\local-8888\backend.pid" del /f /q "%ROOT%\.tmp\local-8888\backend.pid" 2>nul

echo KIU local stack stopped.

if /i "%~1"=="--no-pause" (
    ping 127.0.0.1 -n 3 >nul
    goto :eof
)
timeout /t 2 /nobreak >nul
pause
goto :eof