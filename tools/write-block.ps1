# Fix: pages had their </body></html> stripped. Re-add the mobile block + closing tags.
$root = "c:\mock yo - Copy - Copy (15) - Copy - Copy - Copy - Copy"

# Write the block to a temp file, then read it back (avoids PS string issues)
$blockPath = Join-Path $root "tools\_mobile_block.html"

# Create mobile block file
$blockContent = @"
<!-- MOBILE BOTTOM NAVIGATION (v2) -->
<nav id="mobile-bottom-nav" aria-label="Mobile navigation" style="display:none;">
    <div class="mobile-nav-row">
        <button class="mobile-nav-btn is-active" data-nav-target="home" type="button" id="mob-nav-home"><i class="fas fa-th-large"></i><span>Home</span></button>
        <button class="mobile-nav-btn" type="button" id="mob-nav-messages" data-action="messages"><i class="fas fa-comment-dots"></i><span>Chat</span><em class="mob-badge" id="mob-badge-msg" style="display:none;">0</em></button>
        <button class="mobile-nav-btn" type="button" id="mob-nav-notif" data-action="notifications"><i class="fas fa-bell"></i><span>Alerts</span><em class="mob-badge" id="mob-badge-notif" style="display:none;">0</em></button>
        <button class="mobile-nav-btn" type="button" id="mob-nav-theme" data-action="theme"><i class="fas fa-palette"></i><span>Theme</span></button>
        <button class="mobile-nav-btn" type="button" id="mob-nav-more" data-action="more"><i class="fas fa-grip-horizontal"></i><span>More</span></button>
    </div>
</nav>
<div id="mobile-action-sheet" class="mob-sheet" style="display:none;" role="dialog" aria-modal="true">
    <div class="mob-sheet-backdrop" id="mob-sheet-backdrop"></div>
    <div class="mob-sheet-panel">
        <div class="mob-sheet-handle"><span></span></div>
        <div class="mob-sheet-section"><div class="mob-sheet-label">Quick Actions</div><div class="mob-sheet-grid">
            <button class="mob-sheet-btn" id="mob-act-admin"><div class="mob-sheet-icon" style="background:linear-gradient(135deg,#f59e0b,#d97706);"><i class="fas fa-user-shield"></i></div><span>Admin View</span></button>
            <button class="mob-sheet-btn" id="mob-act-theme"><div class="mob-sheet-icon" style="background:linear-gradient(135deg,#8b5cf6,#6d28d9);"><i class="fas fa-palette"></i></div><span>Theme</span></button>
            <button class="mob-sheet-btn" id="mob-act-profile"><div class="mob-sheet-icon" style="background:linear-gradient(135deg,#06b6d4,#0891b2);"><i class="fas fa-user-circle"></i></div><span>Profile</span></button>
            <button class="mob-sheet-btn" id="mob-act-lightmode"><div class="mob-sheet-icon" style="background:linear-gradient(135deg,#f97316,#ea580c);"><i class="fas fa-sun"></i></div><span>Light Mode</span></button>
        </div></div>
        <div class="mob-sheet-section" id="mob-sheet-student-nav"><div class="mob-sheet-label">Navigate</div><div class="mob-sheet-nav">
            <button class="mob-sheet-nav-btn" data-nav-target="home"><i class="fas fa-th-large"></i><span>Dashboard</span></button>
            <button class="mob-sheet-nav-btn" data-nav-target="lms"><i class="fas fa-book-reader"></i><span>LMS</span></button>
            <button class="mob-sheet-nav-btn" data-nav-target="timetable"><i class="fas fa-calendar-week"></i><span>Timetable</span></button>
            <button class="mob-sheet-nav-btn" data-nav-target="social"><i class="fas fa-comments"></i><span>Social</span></button>
            <button class="mob-sheet-nav-btn" data-nav-target="registration"><i class="fas fa-clipboard-list"></i><span>Registration</span></button>
            <button class="mob-sheet-nav-btn" data-nav-target="library"><i class="fas fa-book"></i><span>Library</span></button>
            <button class="mob-sheet-nav-btn" data-nav-target="orders"><i class="fas fa-paper-plane"></i><span>Orders</span></button>
            <button class="mob-sheet-nav-btn" data-nav-target="personal-data"><i class="fas fa-id-badge"></i><span>Personal Data</span></button>
            <button class="mob-sheet-nav-btn" data-nav-target="study-card"><i class="fas fa-graduation-cap"></i><span>Study Card</span></button>
            <button class="mob-sheet-nav-btn" data-nav-target="programs"><i class="fas fa-sitemap"></i><span>Programs</span></button>
            <button class="mob-sheet-nav-btn" data-nav-target="chancellery"><i class="fas fa-file-alt"></i><span>Chancellery</span></button>
            <button class="mob-sheet-nav-btn" data-nav-target="gradebook"><i class="fas fa-chart-bar"></i><span>Gradebook</span></button>
        </div></div>
        <div class="mob-sheet-section" id="mob-sheet-admin-section" style="display:none;"><div class="mob-sheet-label">Administration</div><div class="mob-sheet-nav">
            <button class="mob-sheet-nav-btn" data-nav-target="admin-tools"><i class="fas fa-layer-group"></i><span>Admin Tools</span></button>
            <button class="mob-sheet-nav-btn" data-nav-target="admin-scheduler"><i class="fas fa-calendar-plus"></i><span>Scheduler</span></button>
            <button class="mob-sheet-nav-btn" data-nav-target="admin-library"><i class="fas fa-book-medical"></i><span>Library Mgmt</span></button>
            <button class="mob-sheet-nav-btn" data-nav-target="admin-orders"><i class="fas fa-inbox"></i><span>Orders Mgmt</span></button>
            <button class="mob-sheet-nav-btn" data-nav-target="staff"><i class="fas fa-users-cog"></i><span>Staff</span></button>
            <button class="mob-sheet-nav-btn" data-nav-target="students-admin"><i class="fas fa-user-graduate"></i><span>Students</span></button>
        </div></div>
        <div class="mob-sheet-section" id="mob-sheet-service-section" style="display:none;"><div class="mob-sheet-label">Service Desk</div><div class="mob-sheet-nav">
            <button class="mob-sheet-nav-btn" data-nav-target="student-service"><i class="fas fa-headset"></i><span>Service Desk</span></button>
        </div></div>
        <div class="mob-sheet-footer"><button class="mob-sheet-close-btn" id="mob-sheet-close"><i class="fas fa-times"></i> Close</button></div>
    </div>
</div>
"@

[IO.File]::WriteAllText($blockPath, $blockContent, [System.Text.Encoding]::UTF8)
Write-Host "Block file written: $blockPath"
Write-Host "Block file size: $((Get-Item $blockPath).Length) bytes"
