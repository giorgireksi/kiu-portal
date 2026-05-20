$root = "c:\mock yo - Copy - Copy (15) - Copy - Copy - Copy - Copy"

# ── NEW BOTTOM NAV HTML ──
$bottomNavNew = @'

<!-- MOBILE BOTTOM NAVIGATION (v2 — Full Command Bar) -->
<nav id="mobile-bottom-nav" aria-label="Mobile navigation" style="display:none;">
    <div class="mobile-nav-row">
        <button class="mobile-nav-btn is-active" data-nav-target="home" type="button" id="mob-nav-home">
            <i class="fas fa-th-large"></i>
            <span>Home</span>
        </button>
        <button class="mobile-nav-btn" type="button" id="mob-nav-messages" data-action="messages">
            <i class="fas fa-comment-dots"></i>
            <span>Chat</span>
            <em class="mob-badge" id="mob-badge-msg" style="display:none;">0</em>
        </button>
        <button class="mobile-nav-btn" type="button" id="mob-nav-notif" data-action="notifications">
            <i class="fas fa-bell"></i>
            <span>Alerts</span>
            <em class="mob-badge" id="mob-badge-notif" style="display:none;">0</em>
        </button>
        <button class="mobile-nav-btn" type="button" id="mob-nav-theme" data-action="theme">
            <i class="fas fa-palette"></i>
            <span>Theme</span>
        </button>
        <button class="mobile-nav-btn" type="button" id="mob-nav-more" data-action="more">
            <i class="fas fa-grip-horizontal"></i>
            <span>More</span>
        </button>
    </div>
</nav>

<!-- MOBILE ACTION SHEET (slides up from More) -->
<div id="mobile-action-sheet" class="mob-sheet" style="display:none;" role="dialog" aria-modal="true" aria-label="Quick actions">
    <div class="mob-sheet-backdrop" id="mob-sheet-backdrop"></div>
    <div class="mob-sheet-panel">
        <div class="mob-sheet-handle"><span></span></div>

        <!-- Quick Actions -->
        <div class="mob-sheet-section">
            <div class="mob-sheet-label">Quick Actions</div>
            <div class="mob-sheet-grid">
                <button class="mob-sheet-btn" data-action="admin-switch" id="mob-act-admin">
                    <div class="mob-sheet-icon" style="background:linear-gradient(135deg,#f59e0b,#d97706);"><i class="fas fa-user-shield"></i></div>
                    <span>Admin View</span>
                </button>
                <button class="mob-sheet-btn" data-action="theme" id="mob-act-theme">
                    <div class="mob-sheet-icon" style="background:linear-gradient(135deg,#8b5cf6,#6d28d9);"><i class="fas fa-palette"></i></div>
                    <span>Colour Studio</span>
                </button>
                <button class="mob-sheet-btn" data-action="profile" id="mob-act-profile">
                    <div class="mob-sheet-icon" style="background:linear-gradient(135deg,#06b6d4,#0891b2);"><i class="fas fa-user-circle"></i></div>
                    <span>Profile</span>
                </button>
                <button class="mob-sheet-btn" data-action="light-mode" id="mob-act-lightmode">
                    <div class="mob-sheet-icon" style="background:linear-gradient(135deg,#f97316,#ea580c);"><i class="fas fa-sun"></i></div>
                    <span>Light Mode</span>
                </button>
            </div>
        </div>

        <!-- Navigation -->
        <div class="mob-sheet-section">
            <div class="mob-sheet-label">Navigate</div>
            <div class="mob-sheet-nav">
                <button class="mob-sheet-nav-btn" data-nav-target="home"><i class="fas fa-th-large"></i><span>Dashboard</span></button>
                <button class="mob-sheet-nav-btn" data-nav-target="lms"><i class="fas fa-book-reader"></i><span>LMS</span></button>
                <button class="mob-sheet-nav-btn" data-nav-target="timetable"><i class="fas fa-calendar-week"></i><span>Timetable</span></button>
                <button class="mob-sheet-nav-btn" data-nav-target="social"><i class="fas fa-comments"></i><span>Social</span></button>
                <button class="mob-sheet-nav-btn" data-nav-target="registration"><i class="fas fa-clipboard-list"></i><span>Registration</span></button>
                <button class="mob-sheet-nav-btn" data-nav-target="gradebook"><i class="fas fa-chart-bar"></i><span>Gradebook</span></button>
                <button class="mob-sheet-nav-btn" data-nav-target="library"><i class="fas fa-book"></i><span>Library</span></button>
                <button class="mob-sheet-nav-btn" data-nav-target="orders"><i class="fas fa-paper-plane"></i><span>Orders</span></button>
                <button class="mob-sheet-nav-btn" data-nav-target="personal-data"><i class="fas fa-id-badge"></i><span>Personal Data</span></button>
                <button class="mob-sheet-nav-btn" data-nav-target="study-card"><i class="fas fa-graduation-cap"></i><span>Study Card</span></button>
                <button class="mob-sheet-nav-btn" data-nav-target="programs"><i class="fas fa-sitemap"></i><span>Programs</span></button>
                <button class="mob-sheet-nav-btn" data-nav-target="chancellery"><i class="fas fa-file-alt"></i><span>Chancellery</span></button>
            </div>
        </div>

        <!-- Admin Pages (shown only for admin role) -->
        <div class="mob-sheet-section mob-sheet-admin" id="mob-sheet-admin-section" style="display:none;">
            <div class="mob-sheet-label">Administration</div>
            <div class="mob-sheet-nav">
                <button class="mob-sheet-nav-btn" data-nav-target="admin-tools"><i class="fas fa-layer-group"></i><span>Admin Tools</span></button>
                <button class="mob-sheet-nav-btn" data-nav-target="admin-scheduler"><i class="fas fa-calendar-plus"></i><span>Scheduler</span></button>
                <button class="mob-sheet-nav-btn" data-nav-target="admin-library"><i class="fas fa-book-medical"></i><span>Library Admin</span></button>
                <button class="mob-sheet-nav-btn" data-nav-target="admin-orders"><i class="fas fa-inbox"></i><span>Orders Admin</span></button>
                <button class="mob-sheet-nav-btn" data-nav-target="staff"><i class="fas fa-users-cog"></i><span>Staff</span></button>
                <button class="mob-sheet-nav-btn" data-nav-target="students-admin"><i class="fas fa-user-graduate"></i><span>Students</span></button>
                <button class="mob-sheet-nav-btn" data-nav-target="student-service"><i class="fas fa-headset"></i><span>Service Desk</span></button>
            </div>
        </div>

        <div class="mob-sheet-footer">
            <button class="mob-sheet-close-btn" id="mob-sheet-close"><i class="fas fa-times"></i> Close</button>
        </div>
    </div>
</div>
'@

# ── NEW MOBILE JS CONTROLLER (v2) ──
$mobileJSNew = @'

<!-- MOBILE EXPERIENCE CONTROLLER v2 -->
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

        // Page navigation buttons
        nav.querySelectorAll('.mobile-nav-btn[data-nav-target]').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault(); e.stopPropagation();
                var target = btn.getAttribute('data-nav-target');
                if (typeof window.navigate === 'function') window.navigate(target);
                syncBottomNavActive(target);
                closeSidebarIfOpen();
                closeActionSheet();
            });
        });

        // Action buttons
        var msgBtn = document.getElementById('mob-nav-messages');
        if (msgBtn) msgBtn.addEventListener('click', function(e) {
            e.preventDefault(); e.stopPropagation();
            // Try to open the messaging system
            var msgFab = document.querySelector('.portal-msg-fab');
            if (msgFab) { msgFab.click(); return; }
            if (typeof window.toggleMessaging === 'function') { window.toggleMessaging(); return; }
            var msgUtil = document.querySelector('[data-utility="messages"]');
            if (msgUtil) msgUtil.click();
        });

        var notifBtn = document.getElementById('mob-nav-notif');
        if (notifBtn) notifBtn.addEventListener('click', function(e) {
            e.preventDefault(); e.stopPropagation();
            var notifFab = document.querySelector('.portal-notif-fab');
            if (notifFab) { notifFab.click(); return; }
            if (typeof window.toggleNotifications === 'function') { window.toggleNotifications(); return; }
            var notifUtil = document.querySelector('[data-utility="notifications"]');
            if (notifUtil) notifUtil.click();
        });

        var themeBtn = document.getElementById('mob-nav-theme');
        if (themeBtn) themeBtn.addEventListener('click', function(e) {
            e.preventDefault(); e.stopPropagation();
            openThemeStudio();
        });

        var moreBtn = document.getElementById('mob-nav-more');
        if (moreBtn) moreBtn.addEventListener('click', function(e) {
            e.preventDefault(); e.stopPropagation();
            toggleActionSheet();
        });
    }

    function openThemeStudio() {
        var studioBtn = document.querySelector('.lux-topbar-editor-btn');
        if (studioBtn) { studioBtn.click(); return; }
        var studioBackdrop = document.querySelector('.lux-studio-backdrop');
        if (studioBackdrop) { studioBackdrop.classList.add('is-open'); return; }
        if (typeof window.openStudio === 'function') window.openStudio();
    }

    function setupActionSheet() {
        var backdrop = document.getElementById('mob-sheet-backdrop');
        if (backdrop) backdrop.addEventListener('click', closeActionSheet);

        var closeBtn = document.getElementById('mob-sheet-close');
        if (closeBtn) closeBtn.addEventListener('click', closeActionSheet);

        // Action sheet nav buttons
        var sheet = document.getElementById('mobile-action-sheet');
        if (!sheet) return;

        sheet.querySelectorAll('.mob-sheet-nav-btn[data-nav-target]').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault(); e.stopPropagation();
                var target = btn.getAttribute('data-nav-target');
                if (typeof window.navigate === 'function') window.navigate(target);
                syncBottomNavActive(target);
                closeActionSheet();
                closeSidebarIfOpen();
            });
        });

        // Quick action buttons
        var adminSwitch = document.getElementById('mob-act-admin');
        if (adminSwitch) adminSwitch.addEventListener('click', function(e) {
            e.preventDefault();
            closeActionSheet();
            // Try to find the admin view picker
            var picker = document.querySelector('.lux-picker-btn');
            if (picker) { picker.click(); return; }
            var viewSelect = document.querySelector('#admin-view-select, [name="admin-view"]');
            if (viewSelect) viewSelect.click();
        });

        var themeAct = document.getElementById('mob-act-theme');
        if (themeAct) themeAct.addEventListener('click', function(e) {
            e.preventDefault();
            closeActionSheet();
            openThemeStudio();
        });

        var profileAct = document.getElementById('mob-act-profile');
        if (profileAct) profileAct.addEventListener('click', function(e) {
            e.preventDefault();
            closeActionSheet();
            if (typeof window.navigate === 'function') window.navigate('profile-view');
        });

        var lightModeAct = document.getElementById('mob-act-lightmode');
        if (lightModeAct) lightModeAct.addEventListener('click', function(e) {
            e.preventDefault();
            document.body.classList.toggle('lux-light-mode');
            var isLight = document.body.classList.contains('lux-light-mode');
            lightModeAct.querySelector('span').textContent = isLight ? 'Dark Mode' : 'Light Mode';
            lightModeAct.querySelector('i').className = isLight ? 'fas fa-moon' : 'fas fa-sun';
            localStorage.setItem('kiuLuxuryLightMode', isLight ? '1' : '0');
        });
    }

    function toggleActionSheet() {
        var sheet = document.getElementById('mobile-action-sheet');
        if (!sheet) return;
        var isOpen = sheet.style.display !== 'none';
        if (isOpen) closeActionSheet();
        else openActionSheet();
    }

    function openActionSheet() {
        var sheet = document.getElementById('mobile-action-sheet');
        if (!sheet) return;
        sheet.style.display = '';
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(function() { sheet.classList.add('is-open'); });
        updateAdminSection();
    }

    function closeActionSheet() {
        var sheet = document.getElementById('mobile-action-sheet');
        if (!sheet) return;
        sheet.classList.remove('is-open');
        document.body.style.overflow = '';
        setTimeout(function() { sheet.style.display = 'none'; }, 300);
    }

    function updateAdminSection() {
        var adminSection = document.getElementById('mob-sheet-admin-section');
        if (!adminSection) return;
        var role = '';
        try { role = typeof getEffectiveRole === 'function' ? getEffectiveRole() : (typeof getEffectiveUserRole === 'function' ? getEffectiveUserRole() : ''); } catch(e) {}
        adminSection.style.display = (role === 'admin' || role === 'student_service') ? '' : 'none';
    }

    function syncBottomNavActive(activeTarget) {
        var nav = document.getElementById('mobile-bottom-nav');
        if (!nav) return;
        nav.querySelectorAll('.mobile-nav-btn[data-nav-target]').forEach(function(btn) {
            btn.classList.toggle('is-active', btn.getAttribute('data-nav-target') === activeTarget);
        });
        // Clear active from action buttons
        ['mob-nav-messages','mob-nav-notif','mob-nav-theme','mob-nav-more'].forEach(function(id) {
            var btn = document.getElementById(id);
            if (btn) btn.classList.remove('is-active');
        });
    }

    function hookNavigationSync() {
        var origNavigate = window.navigate;
        if (typeof origNavigate === 'function' && !window.__mobileNavHooked) {
            window.__mobileNavHooked = true;
            window.navigate = function(target) {
                var result = origNavigate.apply(this, arguments);
                if (isMobile()) { syncBottomNavActive(target); closeSidebarIfOpen(); closeActionSheet(); }
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

    function syncBadges() {
        // Check for notification/message counts and update badges
        setInterval(function() {
            if (!isMobile()) return;
            var msgBadge = document.getElementById('mob-badge-msg');
            var notifBadge = document.getElementById('mob-badge-notif');
            // Try to read existing badge counts from FABs
            var msgFabBadge = document.querySelector('.portal-msg-fab .badge, .portal-msg-fab .count');
            var notifFabBadge = document.querySelector('.portal-notif-fab .badge, .portal-notif-fab .count');
            if (msgBadge && msgFabBadge) {
                var val = parseInt(msgFabBadge.textContent) || 0;
                msgBadge.textContent = val;
                msgBadge.style.display = val > 0 ? '' : 'none';
            }
            if (notifBadge && notifFabBadge) {
                var val2 = parseInt(notifFabBadge.textContent) || 0;
                notifBadge.textContent = val2;
                notifBadge.style.display = val2 > 0 ? '' : 'none';
            }
        }, 3000);
    }

    function onResize() {
        var nav = document.getElementById('mobile-bottom-nav');
        if (!nav) return;
        nav.style.display = isMobile() ? '' : 'none';
        if (!isMobile()) closeActionSheet();
    }

    function init() {
        autoCollapseSidebar();
        setupBottomNav();
        setupActionSheet();
        setupOverlayDismiss();
        setupSwipeGesture();
        syncBadges();
        onResize();
        var hookTimer = setInterval(function() {
            if (typeof window.navigate === 'function') { clearInterval(hookTimer); hookNavigationSync(); updateAdminSection(); }
        }, 200);
        setTimeout(function() { clearInterval(hookTimer); }, 10000);
        window.addEventListener('resize', onResize);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
})();
</script>
'@

# ── OLD bottom nav pattern to find and replace ──
$oldNavStart = '<!-- MOBILE BOTTOM NAVIGATION -->'
$oldNavAltStart = '<!-- MOBILE BOTTOM NAVIGATION (v2'
$oldJSStart = '<!-- MOBILE EXPERIENCE CONTROLLER -->'
$oldJSAltStart = '<!-- MOBILE EXPERIENCE CONTROLLER v2 -->'

# Get all HTML files
$htmlFiles = Get-ChildItem -Path $root -Filter "*.html" -File | Where-Object { $_.Name -ne 'calendar.html' }

$updated = 0
foreach ($file in $htmlFiles) {
    $content = [IO.File]::ReadAllText($file.FullName)
    $changed = $false

    # Remove old bottom nav (everything from marker to closing </nav>)
    if ($content -match '(?s)(<!-- MOBILE BOTTOM NAVIGATION.*?</nav>\s*)') {
        $content = $content -replace '(?s)<!-- MOBILE BOTTOM NAVIGATION.*?</nav>\s*', ''
        $changed = $true
    }

    # Remove old mobile JS (everything from marker to closing </script>)
    if ($content -match '(?s)(<!-- MOBILE EXPERIENCE CONTROLLER.*?</script>\s*)') {
        $content = $content -replace '(?s)<!-- MOBILE EXPERIENCE CONTROLLER.*?</script>\s*', ''
        $changed = $true
    }

    # Remove old action sheet if exists
    if ($content -match '(?s)(<!-- MOBILE ACTION SHEET.*?</div>\s*</div>\s*)') {
        $content = $content -replace '(?s)<!-- MOBILE ACTION SHEET.*?</div>\s*</div>\s*</div>\s*</div>\s*', ''
        $changed = $true
    }

    # Insert new bottom nav + action sheet + JS before </body>
    if ($content -match '</body>') {
        $insertion = $bottomNavNew + "`n" + $mobileJSNew + "`n"
        $content = $content -replace '</body>', ($insertion + '</body>')
        $changed = $true
    }

    if ($changed) {
        [IO.File]::WriteAllText($file.FullName, $content)
        $updated++
        Write-Host "  Updated: $($file.Name)"
    }
}

Write-Host "`nTotal updated: $updated files"
