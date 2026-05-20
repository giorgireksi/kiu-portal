param(
    [string]$OutputDir = "backups",
    [string]$DatabaseUrl = $env:KIU_DATABASE_URL
)

if (-not $DatabaseUrl) {
    Write-Error "KIU_DATABASE_URL is required."
    exit 1
}

$pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgDump) {
    Write-Error "pg_dump was not found in PATH."
    exit 1
}

$resolvedOutputDir = Resolve-Path -Path $OutputDir -ErrorAction SilentlyContinue
if (-not $resolvedOutputDir) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
    $resolvedOutputDir = Resolve-Path -Path $OutputDir
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupFile = Join-Path $resolvedOutputDir "kiu-lms-$timestamp.dump"

& pg_dump $DatabaseUrl --format=custom --no-owner --no-acl --file=$backupFile
if ($LASTEXITCODE -ne 0) {
    Write-Error "PostgreSQL backup failed."
    exit $LASTEXITCODE
}

Write-Output "Backup created: $backupFile"
