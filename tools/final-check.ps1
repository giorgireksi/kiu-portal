# Verify exactly 1 <nav id="mobile-bottom-nav" and 1 <div id="mobile-action-sheet" per page
$root = "c:\mock yo - Copy - Copy (15) - Copy - Copy - Copy - Copy"
$htmlFiles = Get-ChildItem -Path $root -Filter "*.html" -File | Where-Object { $_.Name -ne 'calendar.html' }
$allGood = $true

foreach ($file in $htmlFiles) {
    $content = [IO.File]::ReadAllText($file.FullName)
    $navCount = ([regex]::Matches($content, '<nav id="mobile-bottom-nav"')).Count
    $sheetCount = ([regex]::Matches($content, '<div id="mobile-action-sheet"')).Count
    $jsCount = ([regex]::Matches($content, 'initMobileExperience')).Count
    
    $ok = ($navCount -eq 1) -and ($sheetCount -eq 1) -and ($jsCount -eq 1)
    if (-not $ok) { $allGood = $false }
    $status = if ($ok) { "OK" } else { "PROBLEM" }
    Write-Host "  [$status] $($file.Name) - nav:$navCount sheet:$sheetCount js:$jsCount"
}

if ($allGood) {
    Write-Host "`nAll 25 pages are clean - exactly 1 copy each."
} else {
    Write-Host "`nSome pages have issues!"
}
