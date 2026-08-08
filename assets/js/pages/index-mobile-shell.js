(function initMobileExperience() {
    'use strict';

    var MOBILE_BREAKPOINT = 1024;

    function ensureMobileShellScaffold() {
        var nav = document.getElementById('mobile-bottom-nav');
        if (!nav) {
            nav = document.createElement('nav');
            nav.id = 'mobile-bottom-nav';
            nav.setAttribute('aria-label', 'Mobile navigation');
            nav.hidden = true;
            nav.innerHTML = '' +
                '<div class="mobile-nav-row">' +
                    '<button class="mobile-nav-btn is-active" data-nav-target="home" type="button" id="mob-nav-home"><i class="fas fa-th-large"></i><span>Home</span></button>' +
                    '<button class="mobile-nav-btn" type="button" id="mob-nav-messages" data-action="messages"><i class="fas fa-comment-dots"></i><span>Chat</span><em class="mob-badge" id="mob-badge-msg" hidden>0</em></button>' +
                    '<button class="mobile-nav-btn" type="button" id="mob-nav-notif" data-action="notifications"><i class="fas fa-bell"></i><span>Alerts</span><em class="mob-badge" id="mob-badge-notif" hidden>0</em></button>' +
                    '<button class="mobile-nav-btn" type="button" id="mob-nav-theme" data-action="theme"><i class="fas fa-palette"></i><span>Theme</span></button>' +
                    '<button class="mobile-nav-btn" type="button" id="mob-nav-more" data-action="more" aria-haspopup="dialog" aria-expanded="false"><i class="fas fa-grip-horizontal"></i><span>More</span></button>' +
                '</div>';
            document.body.appendChild(nav);
        }

        var sheet = document.getElementById('mobile-action-sheet');
        if (!sheet) {
            sheet = document.createElement('div');
            sheet.id = 'mobile-action-sheet';
            sheet.className = 'mob-sheet';
            sheet.hidden = true;
            sheet.setAttribute('role', 'dialog');
            sheet.setAttribute('aria-modal', 'true');
            sheet.setAttribute('aria-hidden', 'true');
            sheet.innerHTML = '' +
                '<div class="mob-sheet-backdrop" id="mob-sheet-backdrop"></div>' +
                '<div class="mob-sheet-panel">' +
                    '<div class="mob-sheet-handle"><span></span></div>' +
                    '<div class="mob-sheet-section"><div class="mob-sheet-label">Quick Actions</div><div class="mob-sheet-grid">' +
                        '<button class="mob-sheet-btn" type="button" id="mob-act-admin"><span class="mob-sheet-icon"><i class="fas fa-user-shield"></i></span><span>Admin View</span></button>' +
                        '<button class="mob-sheet-btn" type="button" id="mob-act-faculty"><span class="mob-sheet-icon"><i class="fas fa-building"></i></span><span>Faculty</span></button>' +
                        '<button class="mob-sheet-btn" type="button" id="mob-act-theme"><span class="mob-sheet-icon"><i class="fas fa-palette"></i></span><span>Theme</span></button>' +
                        '<button class="mob-sheet-btn" type="button" id="mob-act-profile"><span class="mob-sheet-icon"><i class="far fa-user"></i></span><span>Personal Data</span></button>' +
                        '<button class="mob-sheet-btn" type="button" id="mob-act-lightmode"><span class="mob-sheet-icon"><i class="fas fa-sun"></i></span><span>Light Mode</span></button>' +
                    '</div></div>' +
                    '<div id="mob-sheet-dynamic-nav"></div>' +
                    '<div class="mob-sheet-footer"><button class="mob-sheet-close-btn" id="mob-sheet-close"><i class="fas fa-times"></i> Close</button></div>' +
                '</div>';
            document.body.appendChild(sheet);
        }
    }

    function isMobileViewport() {
        return window.innerWidth <= MOBILE_BREAKPOINT;
    }

    function getRole() {
        var role = '';
        try {
            role = typeof getEffectiveRole === 'function'
                ? getEffectiveRole()
                : (typeof getEffectiveUserRole === 'function' ? getEffectiveUserRole() : '');
        } catch (error) {}
        return role || 'student';
    }

    function invokeNavigate(target) {
        if (!target) return false;
        if (typeof window.navigate === 'function') {
            window.navigate(target);
            return true;
        }
        if (typeof window.resolvePortalRouteUrl === 'function') {
            window.location.assign(window.resolvePortalRouteUrl(target, getRole()));
            return true;
        }
        return false;
    }

    function autoCollapse() {
        if (!isMobileViewport()) return;
        if (document.body.classList.contains('lux-sidebar-collapsed')) return;
        document.body.classList.add('lux-sidebar-collapsed');
        document.body.dataset.luxSidebar = 'collapsed';
        localStorage.setItem('kiuLuxurySidebarCollapsed', '1');
        var toggle = document.getElementById('lux-sidebar-toggle');
        if (!toggle) return;
        toggle.classList.add('is-active');
        toggle.setAttribute('aria-pressed', 'true');
    }

    function syncMobileTopbarVisibility() {
        var topbar = document.getElementById('lux-topbar');
        if (!topbar) return;
        if (isMobileViewport()) {
            topbar.hidden = true;
            topbar.setAttribute('aria-hidden', 'true');
            topbar.style.setProperty('display', 'none', 'important');
            return;
        }
        topbar.hidden = false;
        topbar.removeAttribute('aria-hidden');
        topbar.style.removeProperty('display');
    }

    function isElementShown(element) {
        if (!element) return false;
        var explicitState = element.getAttribute('data-mob-visible');
        if (explicitState === 'true') return true;
        if (explicitState === 'false') return false;
        if (element.hidden || element.getAttribute('aria-hidden') === 'true') return false;
        return !/display\s*:\s*none/i.test(String(element.getAttribute('style') || ''));
    }

    function setElementShown(element, shown, displayValue) {
        void displayValue;
        if (!element) return;
        element.hidden = !shown;
        element.setAttribute('data-mob-visible', shown ? 'true' : 'false');
    }

    function setSheetBodyState(isOpen) {
        document.body.classList.toggle('mob-sheet-open', isOpen === true);
    }

    function buildRoleNav() {
        var container = document.getElementById('mob-sheet-dynamic-nav');
        if (!container) return;

        var role = getRole();
        var navGroups = {
            student: [
                { group: 'Core', items: [['home', 'Dashboard', 'fas fa-th-large'], ['lms', 'LMS', 'fas fa-book-reader'], ['timetable', 'Timetable', 'fas fa-chalkboard'], ['registration', 'Registration', 'fas fa-check-square']] },
                { group: 'Records', items: [['programs', 'Programs', 'fas fa-file-signature'], ['study-card', 'Study Card', 'far fa-address-card'], ['personal-data', 'Personal Data', 'far fa-user'], ['gradebook', 'Gradebook', 'fas fa-chart-bar']] },
                { group: 'Support', items: [['news', 'News', 'fas fa-newspaper'], ['chancellery', 'E-Chancellery', 'fas fa-desktop'], ['student-service', 'Student Service', 'fas fa-headset'], ['library', 'Library', 'fas fa-book'], ['orders', 'Orders', 'fas fa-book-open'], ['social', 'Social', 'fas fa-comments']] }
            ],
            professor: [
                { group: 'Faculty', items: [['home', 'Dashboard', 'fas fa-th-large'], ['timetable', 'Schedule', 'fas fa-calendar-week'], ['lms', 'LMS', 'fas fa-book-reader'], ['faculty-gradebook', 'Gradebook', 'fas fa-chart-bar'], ['exams', 'Exams', 'fas fa-file-signature'], ['programs', 'Programs', 'fas fa-layer-group']] },
                { group: 'Campus', items: [['news', 'News', 'fas fa-newspaper'], ['library', 'Library', 'fas fa-book'], ['orders', 'Orders', 'fas fa-book-open'], ['social', 'Social', 'fas fa-comments'], ['chancellery', 'E-Chancellery', 'fas fa-inbox'], ['student-service', 'Q&A Desk', 'fas fa-headset']] }
            ],
            ta: [
                { group: 'Faculty', items: [['home', 'Dashboard', 'fas fa-th-large'], ['timetable', 'Schedule', 'fas fa-calendar-week'], ['lms', 'LMS', 'fas fa-book-reader'], ['exams', 'Exams', 'fas fa-file-signature'], ['programs', 'Programs', 'fas fa-layer-group']] },
                { group: 'Support', items: [['news', 'News', 'fas fa-newspaper'], ['library', 'Library', 'fas fa-book'], ['orders', 'Orders', 'fas fa-book-open'], ['social', 'Social', 'fas fa-comments'], ['chancellery', 'E-Chancellery', 'fas fa-inbox'], ['student-service', 'Q&A Desk', 'fas fa-headset']] }
            ],
            admin: [
                { group: 'Control', items: [['home', 'Dashboard', 'fas fa-hammer'], ['admin-tools', 'Admin Tools', 'fas fa-layer-group'], ['admin-scheduler', 'Scheduler', 'fas fa-calendar-plus'], ['staff', 'Staff', 'fas fa-users-cog'], ['students-admin', 'Students', 'fas fa-user-graduate']] },
                { group: 'Systems', items: [['news', 'News', 'fas fa-newspaper'], ['library', 'Library', 'fas fa-book'], ['orders', 'Orders', 'fas fa-book-open'], ['chancellery', 'E-Chancellery', 'fas fa-inbox'], ['social', 'Social', 'fas fa-comments'], ['exams', 'Exams', 'fas fa-file-signature'], ['programs', 'Programs', 'fas fa-layer-group']] }
            ],
            student_service: [
                { group: 'Service', items: [['home', 'Dashboard', 'fas fa-th-large'], ['student-service', 'Inbox', 'fas fa-inbox'], ['orders', 'Orders', 'fas fa-book-open'], ['library', 'Library', 'fas fa-book']] },
                { group: 'Campus', items: [['news', 'News', 'fas fa-newspaper'], ['social', 'Social', 'fas fa-comments']] }
            ]
        };

        var groups = navGroups[role] || navGroups.student;
        var html = '';
        groups.forEach(function (group) {
            html += '<div class="mob-sheet-section"><div class="mob-sheet-label">' + group.group + '</div><div class="mob-sheet-nav">';
            group.items.forEach(function (item) {
                html += '<button class="mob-sheet-nav-btn" data-nav-target="' + item[0] + '"><i class="' + item[2] + '"></i><span>' + item[1] + '</span></button>';
            });
            html += '</div></div>';
        });

        container.innerHTML = html;
        container.querySelectorAll('.mob-sheet-nav-btn[data-nav-target]').forEach(function (button) {
            button.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                var target = button.getAttribute('data-nav-target');
                if (!invokeNavigate(target)) return;
                syncActive(target);
                closeSheet();
                closeSidebar();
            });
        });

        var adminSwitch = document.getElementById('mob-act-admin');
        if (adminSwitch) adminSwitch.hidden = role !== 'admin';
    }

    function setupNav() {
        var nav = document.getElementById('mobile-bottom-nav');
        if (!nav) return;

        nav.querySelectorAll('.mobile-nav-btn[data-nav-target]').forEach(function (button) {
            button.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                var target = button.getAttribute('data-nav-target');
                if (!invokeNavigate(target)) return;
                syncActive(target);
                closeSidebar();
                closeSheet();
            });
        });

        var messagesButton = document.getElementById('mob-nav-messages');
        if (messagesButton) {
            messagesButton.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                if (typeof window.toggleMessaging === 'function') {
                    window.toggleMessaging();
                    return;
                }
                var utility = document.querySelector('[data-utility="messages"]');
                if (utility) utility.click();
            });
        }

        var notificationsButton = document.getElementById('mob-nav-notif');
        if (notificationsButton) {
            notificationsButton.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                if (typeof window.toggleNotifications === 'function') {
                    window.toggleNotifications();
                    return;
                }
                var utility = document.querySelector('[data-utility="notifications"]');
                if (utility) utility.click();
            });
        }

        var themeButton = document.getElementById('mob-nav-theme');
        if (themeButton) {
            themeButton.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                openStudioFromMobile();
            });
        }

        var moreButton = document.getElementById('mob-nav-more');
        if (moreButton) {
            moreButton.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                toggleSheet();
            });
        }
    }

    function openStudioFromMobile() {
        var paletteButton = document.getElementById('lux-palette-btn');
        if (paletteButton) {
            paletteButton.click();
            return;
        }
        var backdrop = document.querySelector('.lux-studio-backdrop');
        if (backdrop) {
            backdrop.classList.add('is-open');
            return;
        }
        var topbarButton = document.querySelector('.lux-topbar-editor-btn');
        if (topbarButton) {
            topbarButton.click();
            return;
        }
        if (typeof window.openStudio === 'function') window.openStudio();
    }

    function setupSheet() {
        var backdrop = document.getElementById('mob-sheet-backdrop');
        if (backdrop) backdrop.addEventListener('click', closeSheet);

        var closeButton = document.getElementById('mob-sheet-close');
        if (closeButton) closeButton.addEventListener('click', closeSheet);

        document.addEventListener('keydown', function (event) {
            var sheet = document.getElementById('mobile-action-sheet');
            if (event.key !== 'Escape' || !sheet || !sheet.classList.contains('is-open')) return;
            event.preventDefault();
            closeSheet();
        });

        var adminButton = document.getElementById('mob-act-admin');
        if (adminButton) {
            adminButton.addEventListener('click', function (event) {
                event.preventDefault();
                closeSheet();
                var picker = document.querySelector('.lux-picker-btn');
                if (picker) picker.click();
            });
        }

        var facultyButton = document.getElementById('mob-act-faculty');
        if (facultyButton) {
            facultyButton.addEventListener('click', function (event) {
                event.preventDefault();
                closeSheet();
                var picker = document.getElementById('lux-faculty-picker-btn');
                if (picker) picker.click();
            });
        }

        var themeButton = document.getElementById('mob-act-theme');
        if (themeButton) {
            themeButton.addEventListener('click', function (event) {
                event.preventDefault();
                closeSheet();
                openStudioFromMobile();
            });
        }

        var profileButton = document.getElementById('mob-act-profile');
        if (profileButton) {
            profileButton.addEventListener('click', function (event) {
                event.preventDefault();
                if (!invokeNavigate('personal-data')) return;
                closeSheet();
            });
        }

        var lightModeButton = document.getElementById('mob-act-lightmode');
        if (lightModeButton) {
            lightModeButton.addEventListener('click', function (event) {
                event.preventDefault();
                var nextMode = typeof window.toggleLuxuryInterfaceMode === 'function'
                    ? window.toggleLuxuryInterfaceMode()
                    : (document.body.classList.toggle('lux-light-mode'), document.body.classList.contains('lux-light-mode') ? 'light' : 'dark');
                var isLight = nextMode === 'light';
                lightModeButton.querySelector('span').textContent = isLight ? 'Dark Mode' : 'Light Mode';
                lightModeButton.querySelector('i').className = isLight ? 'fas fa-moon' : 'fas fa-sun';
            });
        }
    }

    function toggleSheet() {
        var sheet = document.getElementById('mobile-action-sheet');
        if (!sheet) return;
        if (isElementShown(sheet)) {
            closeSheet();
            return;
        }
        openSheet();
    }


    function ensureMobileActionSheetCss() {
        if (typeof document === 'undefined') return;
        if (document.querySelector('link[data-kiu-mobile-action-sheet]')) return;
        var links = document.querySelectorAll('link[rel="stylesheet"]');
        for (var i = 0; i < links.length; i++) {
            var href = String(links[i].getAttribute('href') || '');
            if (href.indexOf('lux-mobile-action-sheet.css') !== -1 || href.indexOf('mobile-responsive.css') !== -1) {
                return;
            }
        }
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'assets/css/lux-mobile-action-sheet.css?v=20260806-shortcuttop1';
        link.setAttribute('data-kiu-mobile-action-sheet', '1');
        document.head.appendChild(link);
    }

    function openSheet() {
        ensureMobileActionSheetCss();
        var sheet = document.getElementById('mobile-action-sheet');
        if (!sheet) return;
        var moreButton = document.getElementById('mob-nav-more');
        var closeButton = document.getElementById('mob-sheet-close');
        setElementShown(sheet, true);
        sheet.setAttribute('aria-hidden', 'false');
        if (moreButton) moreButton.setAttribute('aria-expanded', 'true');
        setSheetBodyState(true);
        requestAnimationFrame(function () {
            sheet.classList.add('is-open');
            if (closeButton) {
                closeButton.setAttribute('data-mob-sheet-focus', '1');
                closeButton.focus();
            }
        });
        buildRoleNav();
    }

    function closeSheet(options) {
        options = options || {};
        var sheet = document.getElementById('mobile-action-sheet');
        if (!sheet) return;
        var moreButton = document.getElementById('mob-nav-more');
        var closeButton = document.getElementById('mob-sheet-close');
        sheet.classList.remove('is-open');
        sheet.setAttribute('aria-hidden', 'true');
        if (moreButton) moreButton.setAttribute('aria-expanded', 'false');
        if (closeButton) closeButton.removeAttribute('data-mob-sheet-focus');
        setSheetBodyState(false);
        setTimeout(function () {
            setElementShown(sheet, false);
            if (options.restoreFocus !== false && moreButton) moreButton.focus();
        }, 300);
    }

    function syncActive(target) {
        var nav = document.getElementById('mobile-bottom-nav');
        if (!nav) return;
        nav.querySelectorAll('.mobile-nav-btn[data-nav-target]').forEach(function (button) {
            button.classList.toggle('is-active', button.getAttribute('data-nav-target') === target);
        });
        ['mob-nav-messages', 'mob-nav-notif', 'mob-nav-theme', 'mob-nav-more'].forEach(function (id) {
            var button = document.getElementById(id);
            if (button) button.classList.remove('is-active');
        });
    }

    function hookNavigation() {
        var originalNavigate = window.navigate;
        if (typeof originalNavigate !== 'function' || window.__mobileNavHooked) return;
        window.__mobileNavHooked = true;
        window.navigate = function (target) {
            var result = originalNavigate.apply(this, arguments);
            if (isMobileViewport()) {
                syncActive(target);
                closeSidebar();
                closeSheet();
            }
            return result;
        };
    }

    function closeSidebar() {
        if (!isMobileViewport()) return;
        if (document.body.classList.contains('lux-sidebar-collapsed')) return;
        if (typeof window.toggleSidebar === 'function') {
            window.toggleSidebar();
            return;
        }
        document.body.classList.add('lux-sidebar-collapsed');
        document.body.dataset.luxSidebar = 'collapsed';
    }

    function onResize() {
        var nav = document.getElementById('mobile-bottom-nav');
        syncMobileTopbarVisibility();
        if (!nav) return;
        setElementShown(nav, isMobileViewport());
        if (!isMobileViewport()) closeSheet();
    }

    function waitForNavigationRuntime() {
        var attempts = 0;
        var maxAttempts = 50;
        var intervalId = window.setInterval(function () {
            attempts += 1;
            if (typeof window.navigate === 'function') {
                window.clearInterval(intervalId);
                hookNavigation();
                buildRoleNav();
                return;
            }
            if (attempts >= maxAttempts) {
                window.clearInterval(intervalId);
            }
        }, 200);
    }

    function init() {
        ensureMobileShellScaffold();
        autoCollapse();
        syncMobileTopbarVisibility();
        setupNav();
        setupSheet();
        if (typeof window.__kiuReplayHomeLoadingMotion === 'function') {
            window.__kiuReplayHomeLoadingMotion('mobile');
        }
        onResize();
        waitForNavigationRuntime();
        window.addEventListener('resize', onResize);
        document.addEventListener('touchstart', function (event) {
            if (!isMobileViewport() || document.body.classList.contains('lux-sidebar-collapsed')) return;
            window.__swX = event.touches[0].clientX;
            window.__swY = event.touches[0].clientY;
        }, { passive: true });
        document.addEventListener('touchend', function (event) {
            if (!window.__swX) return;
            var dx = window.__swX - event.changedTouches[0].clientX;
            var dy = Math.abs(window.__swY - event.changedTouches[0].clientY);
            window.__swX = 0;
            if (dx > 60 && dy < 100) closeSidebar();
        }, { passive: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
