@echo off
setlocal

rem Stop only the Electron anti-cheat browser. The LMS and backend are not touched.
set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"
set "HELPERS=%ROOT%\tools\local_stack_stop_helpers.bat"
set "PIDS_DIR=%ROOT%\.tmp\anti-cheat-browser"

call "%HELPERS%" :kill_pid_file "%PIDS_DIR%\anticheat.pid"
call "%HELPERS%" :kill_pid_file "%ROOT%\.tmp\local-lms-anticheat\anticheat.pid"
call "%HELPERS%" :kill_process_by_pattern "anti-cheat/node_modules/electron/cli.js" "%ROOT%"
call "%HELPERS%" :kill_anticheat_processes "%ROOT%\anti-cheat"

if exist "%PIDS_DIR%\anticheat.pid" del /f /q "%PIDS_DIR%\anticheat.pid" 2>nul
if exist "%ROOT%\.tmp\local-lms-anticheat\anticheat.pid" del /f /q "%ROOT%\.tmp\local-lms-anticheat\anticheat.pid" 2>nul

echo Anti-cheat browser stopped. LMS and backend were left running.

if /i "%~1"=="--no-pause" goto :eof
timeout /t 2 /nobreak >nul
pause
goto :eof
