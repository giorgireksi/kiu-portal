param(
    [Parameter(Mandatory=$true)][string]$BackupFile,
    [string]$DatabaseUrl = $env:KIU_DATABASE_URL
)

if (-not $DatabaseUrl) {
    Write-Error "KIU_DATABASE_URL is required."
    exit 1
}

if (-not (Test-Path -LiteralPath $BackupFile)) {
    Write-Error "Backup file not found: $BackupFile"
    exit 1
}

$pgRestore = Get-Command pg_restore -ErrorAction SilentlyContinue
if (-not $pgRestore) {
    Write-Error "pg_restore was not found in PATH."
    exit 1
}

Write-Warning "This restores into the target database from $BackupFile. Use only on the intended database."
& pg_restore --dbname=$DatabaseUrl --clean --if-exists --no-owner --no-acl $BackupFile
if ($LASTEXITCODE -ne 0) {
    Write-Error "PostgreSQL restore failed."
    exit $LASTEXITCODE
}

Write-Output "Restore completed from: $BackupFile"
