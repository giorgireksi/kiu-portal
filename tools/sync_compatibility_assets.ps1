$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot

$copies = @(
    @{ Source = 'assets/css/base.css'; Destination = 'styles.css' },
    @{ Source = 'assets/css/layout.css'; Destination = 'design-refresh.css' },
    @{ Source = 'assets/js/core.js'; Destination = 'core.js' },
    @{ Source = 'assets/js/pages/social/social-app.js'; Destination = 'social-app.js' },
    @{ Source = 'assets/js/pages/social/social-facebook.js'; Destination = 'social-facebook.js' }
)

foreach ($entry in $copies) {
    $sourcePath = Join-Path $projectRoot $entry.Source
    $destinationPath = Join-Path $projectRoot $entry.Destination
    Copy-Item -LiteralPath $sourcePath -Destination $destinationPath -Force
}

Write-Output 'Compatibility files synced from assets/.'
