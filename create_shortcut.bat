@echo off
REM Create a Desktop shortcut for the current Anti-Cheat desktop app.
REM Run this by double-clicking in the repository root.

echo Creating Desktop shortcut for Anti-Cheat...
cscript //nologo "%~dp0create_desktop_shortcut.vbs"

if %ERRORLEVEL% NEQ 0 (
    echo Failed to create shortcut.
) else (
    echo Shortcut created on your Desktop.
)

pause
