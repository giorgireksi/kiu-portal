@echo off
REM Build the current Anti-Cheat installer using Inno Setup Compiler (ISCC).
REM Requires Inno Setup to be installed: https://jrsoftware.org/isinfo.php

echo Building Inno Setup installer...
setlocal

REM Path to Inno Setup Compiler executable (common default)
set ISCC="C:\Program Files (x86)\Inno Setup 6\ISCC.exe"

if exist %ISCC% (
    %ISCC% "%~dp0anti-cheat_installer.iss"
) else (
    echo Inno Setup Compiler not found at %ISCC%.
    echo Please install Inno Setup and re-run this script.
)

pause
