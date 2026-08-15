@echo off
goto %~1

:kill_pid_file
set "pid_file=%~2"
if not exist "%pid_file%" exit /b 0
set "PID="
set /p PID=<"%pid_file%"
if defined PID (
    powershell -NoProfile -Command "if (Get-Process -Id %PID% -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" >nul 2>&1
    if not errorlevel 1 (
        taskkill /F /T /PID %PID% >nul 2>&1
    )
)
del /f /q "%pid_file%" 2>nul
exit /b 0

:kill_ports
if "%~2"=="" exit /b 0
powershell -NoProfile -Command "$port=%~2; $conns = @(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue); foreach ($conn in $conns) { $procId = $conn.OwningProcess; if ($procId) { try { Stop-Process -Id $procId -ErrorAction SilentlyContinue } catch {} } }"
timeout /t 1 /nobreak >nul 2>&1
powershell -NoProfile -Command "$port=%~2; $conns = @(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue); foreach ($conn in $conns) { $procId = $conn.OwningProcess; if ($procId) { try { Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue } catch {} } }"
call "%~f0" :kill_ports %~3 %~4 %~5 %~6 %~7 %~8 %~9
exit /b 0

:port_in_use
powershell -NoProfile -Command "$port=%~2; $c = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue; if ($c) { exit 0 } else { exit 1 }" >nul 2>&1
if errorlevel 1 exit /b 1
exit /b 0

:kill_process_by_pattern
set "KILL_PATTERN=%~2"
set "KILL_ROOT=%~3"
powershell -NoProfile -Command "$pattern='%KILL_PATTERN%'; $root='%KILL_ROOT%'; $pattern = $pattern -replace '\\','/'; $root = $root -replace '\\','/'; Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '^(node|electron)\.exe$' -and $_.CommandLine -and (($_.CommandLine -replace '\\','/') -like ('*' + $pattern + '*')) -and (!$root -or (($_.CommandLine -replace '\\','/') -like ('*' + $root + '*'))) } | ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue } catch {} }" >nul 2>&1
set "KILL_PATTERN="
set "KILL_ROOT="
exit /b 0

:kill_anticheat_processes
set "ac_root=%~2"
powershell -NoProfile -Command "$root='%~2'; $rootNorm = $root -replace '\\','/'; Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '^(node|electron)\.exe$' -and $_.CommandLine -and $rootNorm -and (($_.CommandLine -replace '\\','/') -like ('*' + $rootNorm + '*')) } | ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue } catch {} }" >nul 2>&1
exit /b 0

:read_pid_if_running
set "pid_file=%~2"
set "READ_PID_RESULT="
if not exist "%pid_file%" exit /b 1
set "PID="
set /p PID=<"%pid_file%" 2>nul
if not defined PID exit /b 1
powershell -NoProfile -Command "if (Get-Process -Id %PID% -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" >nul 2>&1
if errorlevel 1 exit /b 1
set "READ_PID_RESULT=%PID%"
exit /b 0

:cleanup_stale_pid
set "pid_file=%~2"
if not exist "%pid_file%" exit /b 0
del /f /q "%pid_file%" 2>nul
exit /b 0

:ensure_launcher_terminal
if defined KIU_LAUNCHER_IN_TERMINAL exit /b 0
if defined KIU_LAUNCHER_OPEN_TERMINAL (
    set "KIU_LAUNCHER_IN_TERMINAL=1"
    start "KIU Local Stack" cmd /k call "%~2" %~3 %~4 %~5 %~6 %~7 %~8 %~9
    exit /b 100
)
exit /b 0