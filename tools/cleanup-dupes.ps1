# Aggressive cleanup: find all nav blocks by ID and keep only the LAST one
$root = "c:\mock yo - Copy - Copy (15) - Copy - Copy - Copy - Copy"
$htmlFiles = Get-ChildItem -Path $root -Filter "*.html" -File | Where-Object { $_.Name -ne 'calendar.html' }

foreach ($file in $htmlFiles) {
    $lines = [IO.File]::ReadAllLines($file.FullName)
    $newLines = [System.Collections.Generic.List[string]]::new()
    $skip = $false
    $skipType = ''
    $removedBlocks = 0
    $keepLines = [System.Collections.Generic.List[string]]::new()

    # First pass: collect all lines, marking blocks to remove
    # We'll find ALL nav blocks and action sheet blocks, remember them
    $blockStarts = @()
    
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        
        # Detect a nav block starting (by <nav id="mobile-bottom-nav")
        if ($line -match '<nav id="mobile-bottom-nav"') {
            $blockStarts += @{ Type = 'nav'; StartLine = $i }
        }
        
        # Detect action sheet starting
        if ($line -match '<div id="mobile-action-sheet"') {
            $blockStarts += @{ Type = 'sheet'; StartLine = $i }
        }
        
        # Detect JS controller starting
        if ($line -match 'initMobileExperience') {
            $blockStarts += @{ Type = 'js'; StartLine = $i }
        }
    }

    # If we found multiple nav blocks, the issue is clear - keep only the last set
    # Strategy: find the LAST occurrence of <nav id="mobile-bottom-nav" and keep only from there
    
    $lastNavStart = -1
    $firstNavStart = -1
    for ($i = $lines.Count - 1; $i -ge 0; $i--) {
        if ($lines[$i] -match '<nav id="mobile-bottom-nav"') {
            if ($lastNavStart -eq -1) { $lastNavStart = $i }
            $firstNavStart = $i
        }
    }
    
    if ($firstNavStart -eq $lastNavStart -or $firstNavStart -eq -1) {
        Write-Host "  OK (no duplicates): $($file.Name)"
        continue
    }
    
    # We need to remove the FIRST block (from firstNavStart to just before lastNavStart)
    # Find where the first block ends - it ends when we hit the lastNavStart
    $removeStart = $firstNavStart
    $removeEnd = $lastNavStart - 1
    
    # But we also need to find where the first block's </script> ends
    # Walk back from lastNavStart to find the end of the previous </script>
    for ($i = $lastNavStart - 1; $i -ge $firstNavStart; $i--) {
        if ($lines[$i].Trim() -ne '') {
            $removeEnd = $i
            break
        }
    }
    
    $newLines = [System.Collections.Generic.List[string]]::new()
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($i -ge $removeStart -and $i -le $removeEnd) {
            continue  # skip duplicated block
        }
        $newLines.Add($lines[$i])
    }
    
    [IO.File]::WriteAllLines($file.FullName, $newLines.ToArray())
    $removed = $removeEnd - $removeStart + 1
    Write-Host "  Cleaned: $($file.Name) (removed $removed lines: $removeStart-$removeEnd)"
}
