; Inno Setup script for the current Anti-Cheat desktop app.
; Builds an installer around the packaged Electron executable.

[Setup]
AppName=Anti-Cheat
AppVersion=1.0
DefaultDirName={pf}\Anti-Cheat
DefaultGroupName=Anti-Cheat
OutputBaseFilename=AntiCheatInstaller
Compression=lzma
SolidCompression=yes
DisableStartupPrompt=yes
PrivilegesRequired=admin

[Files]
; Expect Electron package output at ..\anti-cheat\out\anti-cheat-win32-x64\anti-cheat.exe
Source: "..\anti-cheat\out\anti-cheat-win32-x64\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Anti-Cheat"; Filename: "{app}\anti-cheat.exe"
Name: "{userdesktop}\Anti-Cheat"; Filename: "{app}\anti-cheat.exe"

[Run]
Filename: "{app}\anti-cheat.exe"; Flags: nowait postinstall skipifsilent
