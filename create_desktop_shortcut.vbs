Option Explicit
'
' Create Desktop shortcut for the current Anti-Cheat desktop app.
'
Dim WshShell, fso, scriptFull, scriptFolder, targetPath, targetArgs, desktop, sh
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptFull = WScript.ScriptFullName
scriptFolder = fso.GetParentFolderName(scriptFull)

targetArgs = ""
targetPath = scriptFolder & "\\anti-cheat\\out\\anti-cheat-win32-x64\\anti-cheat.exe"
If Not fso.FileExists(targetPath) Then
    targetPath = scriptFolder & "\\START_EVERYTHING.bat"
End If
If Not fso.FileExists(targetPath) Then
    targetPath = scriptFolder & "\\start-local-server.bat"
End If

desktop = WshShell.SpecialFolders("Desktop")
Set sh = WshShell.CreateShortcut(desktop & "\\Anti-Cheat.lnk")
sh.TargetPath = targetPath
If Len(targetArgs) > 0 Then
    sh.Arguments = targetArgs
End If
sh.WorkingDirectory = scriptFolder
sh.WindowStyle = 1
' leave icon default
sh.Save

WScript.Echo "Created Desktop shortcut: " & desktop & "\\Anti-Cheat.lnk"
