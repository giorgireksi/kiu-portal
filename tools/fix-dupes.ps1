# Fix specific pages with duplicate JS blocks
$root = "c:\mock yo - Copy - Copy (15) - Copy - Copy - Copy - Copy"

foreach ($pageName in @("admin-tools.html", "lms.html")) {
    $path = Join-Path $root $pageName
    $lines = [IO.File]::ReadAllLines($path)
    
    # Find all lines containing initMobileExperience
    $jsStarts = @()
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match 'initMobileExperience') {
            $jsStarts += $i
        }
    }
    
    Write-Host "$pageName has initMobileExperience at lines: $($jsStarts -join ', ')"
    
    if ($jsStarts.Count -le 1) {
        Write-Host "  No duplicate found, skipping."
        continue
    }
    
    # Find the FIRST <script> block containing initMobileExperience
    # Walk backwards from first occurrence to find its <script> tag
    $firstJsLine = $jsStarts[0]
    $scriptStart = -1
    for ($i = $firstJsLine; $i -ge 0; $i--) {
        if ($lines[$i] -match '<script>') {
            $scriptStart = $i
            break
        }
    }
    
    # Walk forward from first occurrence to find its </script>
    $scriptEnd = -1
    for ($i = $firstJsLine; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match '</script>') {
            $scriptEnd = $i
            break
        }
    }
    
    if ($scriptStart -eq -1 -or $scriptEnd -eq -1) {
        Write-Host "  Could not find script boundaries, skipping."
        continue
    }
    
    Write-Host "  Removing first JS block: lines $scriptStart to $scriptEnd"
    
    $newLines = [System.Collections.Generic.List[string]]::new()
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($i -ge $scriptStart -and $i -le $scriptEnd) { continue }
        $newLines.Add($lines[$i])
    }
    
    [IO.File]::WriteAllLines($path, $newLines.ToArray())
    Write-Host "  Fixed! Removed $($scriptEnd - $scriptStart + 1) lines."
}
