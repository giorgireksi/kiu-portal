# Read mobile block from file (avoids PS string issues)
$root = "c:\mock yo - Copy - Copy (15) - Copy - Copy - Copy - Copy"
$blockFile = Join-Path $root "tools\_mobile_block.html"
$block = [IO.File]::ReadAllText($blockFile)

Write-Host "Block loaded: $($block.Length) chars"

$htmlFiles = Get-ChildItem -Path $root -Filter "*.html" -File | Where-Object { $_.Name -ne 'calendar.html' -and $_.Name -ne '_mobile_block.html' }

foreach ($file in $htmlFiles) {
    $content = [IO.File]::ReadAllText($file.FullName)
    
    # Skip if already has the new nav
    if ($content -match 'id="mobile-bottom-nav"') {
        Write-Host "  Skip (already has nav): $($file.Name)"
        continue
    }

    # Remove old comment stubs and close tags
    $content = $content -replace '(?s)<!--\s*=+\s*MOBILE BOTTOM NAVIGATION\s*=+\s*-->\s*', ''
    $content = $content -replace '(?s)<!--\s*MOBILE ACTION SHEET[^-]*-->\s*', ''
    $content = $content -replace '(?s)<!--\s*MOBILE EXPERIENCE CONTROLLER[^-]*-->\s*', ''
    $content = $content -replace '\s*</body>\s*', ''
    $content = $content -replace '\s*</html>\s*', ''
    $content = $content.TrimEnd()

    # Append block (which includes </body></html>)
    $content = $content + "`n" + $block

    [IO.File]::WriteAllText($file.FullName, $content)
    Write-Host "  Injected: $($file.Name)"
}
