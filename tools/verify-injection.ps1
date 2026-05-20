$content = Get-Content "c:\mock yo - Copy - Copy (15) - Copy - Copy - Copy - Copy\index.html" -Raw

$hasNewNav = $content -match 'mob-nav-messages'
$hasSheet = $content -match 'mobile-action-sheet'
$hasJS = $content -match 'MOBILE EXPERIENCE CONTROLLER v2'
$navCount = ([regex]::Matches($content, 'MOBILE BOTTOM NAVIGATION')).Count
$jsCount = ([regex]::Matches($content, 'MOBILE EXPERIENCE CONTROLLER')).Count

Write-Host "Has new nav buttons: $hasNewNav"
Write-Host "Has action sheet: $hasSheet"
Write-Host "Has v2 JS controller: $hasJS"
Write-Host "Nav marker count: $navCount (should be 1)"
Write-Host "JS marker count: $jsCount (should be 1)"

# Check for duplicates across a few other pages
foreach ($page in @("social.html", "admin-library.html", "lms.html", "timetable.html")) {
    $p = Get-Content "c:\mock yo - Copy - Copy (15) - Copy - Copy - Copy - Copy\$page" -Raw
    $nc = ([regex]::Matches($p, 'mobile-action-sheet')).Count
    Write-Host "$page - action sheet count: $nc"
}
