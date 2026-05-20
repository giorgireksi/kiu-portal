$root = "c:\mock yo - Copy - Copy (15) - Copy - Copy - Copy - Copy"
$cssLink = '<link rel="stylesheet" href="assets/css/mobile-responsive.css?v=20260415-mobile1">'
$version = "20260415-mobile1"

# Bottom nav HTML
$bottomNav = @'

<!-- MOBILE BOTTOM NAVIGATION -->
<nav id="mobile-bottom-nav" aria-label="Mobile navigation" style="display:none;">
    <button class="mobile-nav-btn is-active" data-nav-target="home" type="button" id="mob-nav-home">
        <i class="fas fa-th-large"></i>
        <span>Home</span>
    </button>
    <button class="mobile-nav-btn" data-nav-target="lms" type="button" id="mob-nav-lms">
        <i class="fas fa-book-reader"></i>
        <span>LMS</span>
    </button>
    <button class="mobile-nav-btn" data-nav-target="timetable" type="button" id="mob-nav-timetable">
        <i class="fas fa-calendar-week"></i>
        <span>Schedule</span>
    </button>
    <button class="mobile-nav-btn" data-nav-target="social" type="button" id="mob-nav-social">
        <i class="fas fa-comments"></i>
        <span>Social</span>
    </button>
    <button class="mobile-nav-btn" type="button" id="mob-nav-menu" aria-label="Open menu">
        <i class="fas fa-bars"></i>
        <span>Menu</span>
    </button>
</nav>

<!-- MOBILE EXPERIENCE CONTROLLER -->
<script>
(function initMobileExperience() {
    'use strict';
    var MOBILE_BP = 768;
    function isMobile() { return window.innerWidth <= MOBILE_BP; }

    function autoCollapseSidebar() {
        if (!isMobile()) return;
        if (!document.body.classList.contains('lux-sidebar-collapsed')) {
            document.body.classList.add('lux-sidebar-collapsed');
            document.body.dataset.luxSidebar = 'collapsed';
            localStorage.setItem('kiuLuxurySidebarCollapsed', '1');
            var toggle = document.getElementById('lux-sidebar-toggle');
            if (toggle) { toggle.classList.add('is-active'); toggle.setAttribute('aria-pressed', 'true'); }
        }
    }

    function setupBottomNav() {
        var nav = document.getElementById('mobile-bottom-nav');
        if (!nav) return;
        nav.querySelectorAll('.mobile-nav-btn[data-nav-target]').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault(); e.stopPropagation();
                var target = btn.getAttribute('data-nav-target');
                if (typeof window.navigate === 'function') window.navigate(target);
                syncBottomNavActive(target);
                closeSidebarIfOpen();
            });
        });
        var menuBtn = document.getElementById('mob-nav-menu');
        if (menuBtn) menuBtn.addEventListener('click', function(e) {
            e.preventDefault(); e.stopPropagation();
            if (typeof window.toggleSidebar === 'function') window.toggleSidebar();
        });
    }

    function syncBottomNavActive(activeTarget) {
        var nav = document.getElementById('mobile-bottom-nav');
        if (!nav) return;
        nav.querySelectorAll('.mobile-nav-btn').forEach(function(btn) {
            btn.classList.toggle('is-active', btn.getAttribute('data-nav-target') === activeTarget);
        });
        var menuBtn = document.getElementById('mob-nav-menu');
        if (menuBtn) menuBtn.classList.remove('is-active');
    }

    function hookNavigationSync() {
        var origNavigate = window.navigate;
        if (typeof origNavigate === 'function' && !window.__mobileNavHooked) {
            window.__mobileNavHooked = true;
            window.navigate = function(target) {
                var result = origNavigate.apply(this, arguments);
                if (isMobile()) { syncBottomNavActive(target); closeSidebarIfOpen(); }
                return result;
            };
        }
    }

    function closeSidebarIfOpen() {
        if (!isMobile()) return;
        if (!document.body.classList.contains('lux-sidebar-collapsed')) {
            if (typeof window.toggleSidebar === 'function') window.toggleSidebar();
            else { document.body.classList.add('lux-sidebar-collapsed'); document.body.dataset.luxSidebar = 'collapsed'; }
        }
    }

    function setupOverlayDismiss() {
        document.addEventListener('click', function(e) {
            if (!isMobile() || document.body.classList.contains('lux-sidebar-collapsed')) return;
            var shell = document.getElementById('lux-shell');
            var topbar = document.getElementById('lux-topbar');
            var bottomNav = document.getElementById('mobile-bottom-nav');
            if (shell && shell.contains(e.target)) return;
            if (topbar && topbar.contains(e.target)) return;
            if (bottomNav && bottomNav.contains(e.target)) return;
            closeSidebarIfOpen();
        }, true);
    }

    function setupSwipeGesture() {
        var startX = 0, startY = 0, tracking = false;
        document.addEventListener('touchstart', function(e) {
            if (!isMobile() || document.body.classList.contains('lux-sidebar-collapsed')) return;
            startX = e.touches[0].clientX; startY = e.touches[0].clientY; tracking = true;
        }, { passive: true });
        document.addEventListener('touchend', function(e) {
            if (!tracking) return; tracking = false;
            var diffX = startX - e.changedTouches[0].clientX;
            var diffY = Math.abs(startY - e.changedTouches[0].clientY);
            if (diffX > 60 && diffY < 100) closeSidebarIfOpen();
        }, { passive: true });
    }

    function updateBottomNavForRole() {
        var lmsBtn = document.getElementById('mob-nav-lms');
        var schedBtn = document.getElementById('mob-nav-timetable');
        var role = '';
        try { role = typeof getEffectiveRole === 'function' ? getEffectiveRole() : (typeof getEffectiveUserRole === 'function' ? getEffectiveUserRole() : ''); } catch(e) {}
        if (lmsBtn && role === 'admin') { lmsBtn.setAttribute('data-nav-target', 'admin-tools'); lmsBtn.querySelector('i').className = 'fas fa-layer-group'; lmsBtn.querySelector('span').textContent = 'Tools'; }
        if (schedBtn && role === 'admin') { schedBtn.setAttribute('data-nav-target', 'admin-scheduler'); schedBtn.querySelector('i').className = 'fas fa-calendar-plus'; schedBtn.querySelector('span').textContent = 'Scheduler'; }
        if (lmsBtn && role === 'student_service') { lmsBtn.setAttribute('data-nav-target', 'student-service'); lmsBtn.querySelector('i').className = 'fas fa-headset'; lmsBtn.querySelector('span').textContent = 'Service'; }
    }

    function onResize() {
        var nav = document.getElementById('mobile-bottom-nav');
        if (!nav) return;
        nav.style.display = isMobile() ? '' : 'none';
    }

    function init() {
        autoCollapseSidebar(); setupBottomNav(); setupOverlayDismiss(); setupSwipeGesture(); onResize();
        var hookTimer = setInterval(function() {
            if (typeof window.navigate === 'function') { clearInterval(hookTimer); hookNavigationSync(); updateBottomNavForRole(); }
        }, 200);
        setTimeout(function() { clearInterval(hookTimer); }, 10000);
        window.addEventListener('resize', onResize);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
})();
</script>
'@

# List of pages to process (that have index-luxury.css)
$pages = @(
    "social.html",
    "admin-library.html",
    "admin-orders.html",
    "admin-scheduler.html",
    "timetable.html",
    "study-card.html",
    "students-admin.html",
    "student-service.html",
    "staff.html",
    "registration.html",
    "programs.html",
    "profile.html",
    "profile-view.html",
    "personal-data.html",
    "orders.html",
    "library.html",
    "faculty-gradebook.html",
    "faculty-schedule.html",
    "chancellery.html",
    "calendar.html",
    "gradebook.html"
)

$updatedFiles = @()
$skippedFiles = @()

foreach ($page in $pages) {
    $filePath = Join-Path $root $page
    if (-not (Test-Path $filePath)) {
        $skippedFiles += "$page (not found)"
        continue
    }

    $content = [System.IO.File]::ReadAllText($filePath)

    # Skip if already has mobile-responsive.css
    if ($content -match "mobile-responsive\.css") {
        $skippedFiles += "$page (already has mobile CSS)"
        continue
    }

    $changed = $false

    # 1. Add mobile-responsive.css link after index-luxury.css link
    if ($content -match 'index-luxury\.css') {
        $luxPattern = '(<link[^>]*index-luxury\.css[^>]*>)'
        $replacement = "`$1`n$cssLink"
        $content = [regex]::Replace($content, $luxPattern, $replacement, [System.Text.RegularExpressions.RegexOptions]::None)
        $changed = $true
    }

    # 2. Upgrade viewport meta to include viewport-fit=cover
    $content = $content -replace 'content="width=device-width, initial-scale=1\.0"', 'content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover"'

    # 3. Add bottom nav + mobile JS before </body>
    if ($content -match '</body>') {
        $content = $content -replace '</body>', "$bottomNav`n</body>"
        $changed = $true
    }

    if ($changed) {
        [System.IO.File]::WriteAllText($filePath, $content)
        $updatedFiles += $page
    }
}

Write-Host "`n=== MOBILE OPTIMIZATION INJECTION COMPLETE ===" -ForegroundColor Green
Write-Host "`nUpdated ($($updatedFiles.Count)):" -ForegroundColor Cyan
$updatedFiles | ForEach-Object { Write-Host "  + $_" -ForegroundColor Green }
Write-Host "`nSkipped ($($skippedFiles.Count)):" -ForegroundColor Yellow
$skippedFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
