$f = Get-Content "c:\mock yo - Copy - Copy (15) - Copy - Copy - Copy - Copy\assets\css\mobile-responsive.css" -Raw
$lines = ($f -split "`n").Count
$kb = [math]::Round($f.Length / 1024, 1)
$opens = ([regex]::Matches($f, '\{')).Count
$closes = ([regex]::Matches($f, '\}')).Count
$balanced = $opens -eq $closes
Write-Host "File: mobile-responsive.css"
Write-Host "Lines: $lines"
Write-Host "Size: ${kb} KB"
Write-Host "Open braces: $opens"
Write-Host "Close braces: $closes"
Write-Host "Balanced: $balanced"

# Count media queries
$mq = ([regex]::Matches($f, '@media')).Count
Write-Host "Media queries: $mq"

# Count !important
$imp = ([regex]::Matches($f, '!important')).Count
Write-Host "!important rules: $imp"
