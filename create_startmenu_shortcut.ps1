# Create Start Menu and Desktop shortcuts for the current Anti-Cheat desktop app.
# Usage: Right-click and Run with PowerShell (may require execution policy change)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$targets = @(
    Join-Path $scriptDir 'anti-cheat\out\anti-cheat-win32-x64\anti-cheat.exe',
    Join-Path $scriptDir 'START_EVERYTHING.bat',
    Join-Path $scriptDir 'start-local-server.bat'
)
$target = $null
foreach ($t in $targets) {
    if (Test-Path $t) { $target = $t; break }
}

if (-not $target) {
    Write-Host "No runnable target found. Build the app or run install first." -ForegroundColor Yellow
    exit 1
}

$wsh = New-Object -ComObject WScript.Shell
$desktop = [Environment]::GetFolderPath("Desktop")
$startMenuPrograms = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs'
$shortcutName = 'Anti-Cheat.lnk'

# Ensure Start Menu subfolder
$folder = Join-Path $startMenuPrograms 'Anti-Cheat'
if (-not (Test-Path $folder)) { New-Item -ItemType Directory -Path $folder | Out-Null }

# Create Desktop shortcut
$desktopShortcut = $wsh.CreateShortcut((Join-Path $desktop $shortcutName))
$desktopShortcut.TargetPath = $target
$desktopShortcut.WorkingDirectory = Split-Path $target
$desktopShortcut.Save()

# Create Start Menu shortcut
$startShortcut = $wsh.CreateShortcut((Join-Path $folder $shortcutName))
$startShortcut.TargetPath = $target
$startShortcut.WorkingDirectory = Split-Path $target
$startShortcut.Save()

Write-Host "Shortcuts created: Desktop and Start Menu for Anti-Cheat." -ForegroundColor Green
