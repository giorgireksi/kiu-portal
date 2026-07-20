param(
    [Parameter(Mandatory = $true)][string]$WorkDir,
    [Parameter(Mandatory = $true)][string]$LogFile,
    [Parameter(Mandatory = $true)][string]$NodeArgs,
    [Parameter(Mandatory = $true)][string]$PidFile
)

$process = Start-Process `
    -FilePath 'node' `
    -ArgumentList $NodeArgs `
    -WorkingDirectory $WorkDir `
    -WindowStyle Hidden `
    -RedirectStandardOutput $LogFile `
    -RedirectStandardError ($LogFile + '.err') `
    -PassThru

Set-Content -Path $PidFile -Value $process.Id -Encoding ascii -NoNewline