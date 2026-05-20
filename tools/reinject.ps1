# Strip old mobile blocks completely, then inject new one from file
$root = "c:\mock yo - Copy - Copy (15) - Copy - Copy - Copy - Copy"
$blockFile = Join-Path $root "tools\_mobile_block.html"
$block = [IO.File]::ReadAllText($blockFile)
Write-Host "Block loaded: $($block.Length) chars"

$htmlFiles = Get-ChildItem -Path $root -Filter "*.html" -File | Where-Object { $_.Name -ne 'calendar.html' -and $_.Name -ne '_mobile_block.html' }

foreach ($file in $htmlFiles) {
    $content = [IO.File]::ReadAllText($file.FullName)

    # Strip existing mobile-bottom-nav block (nav + action sheet + script)
    $content = [regex]::Replace($content, '(?s)<!-- MOBILE BOTTOM NAVIGATION.*?</nav>', '')
    $content = [regex]::Replace($content, '(?s)<nav id="mobile-bottom-nav".*?</nav>', '')
    $content = [regex]::Replace($content, '(?s)<div id="mobile-action-sheet".*?</div>\s*</div>\s*</div>', '')
    $content = [regex]::Replace($content, '(?s)<script>\s*\(function initMobileExperience\(\).*?</script>', '')
    
    # Strip old comment stubs
    $content = [regex]::Replace($content, '<!--\s*=+\s*MOBILE BOTTOM NAVIGATION\s*=+\s*-->', '')
    $content = [regex]::Replace($content, '<!--\s*MOBILE ACTION SHEET[^-]*-->', '')
    $content = [regex]::Replace($content, '<!--\s*MOBILE EXPERIENCE CONTROLLER[^-]*-->', '')

    # Strip closing tags
    $content = [regex]::Replace($content, '\s*</body>\s*', "`n")
    $content = [regex]::Replace($content, '\s*</html>\s*', "`n")
    $content = $content.TrimEnd()

    # Append fresh block (includes </body></html>)
    $content = $content + "`n" + $block

    [IO.File]::WriteAllText($file.FullName, $content)
    Write-Host "  Updated: $($file.Name)"
}

Write-Host "`nAll pages updated with role-aware nav + hidden topbar."
