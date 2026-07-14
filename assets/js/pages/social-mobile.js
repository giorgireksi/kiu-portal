(function initSocialMobileShell() {
    if (window.__KIU_SOCIAL_MOBILE_SHELL_INIT) return;
    window.__KIU_SOCIAL_MOBILE_SHELL_INIT = true;

    const MOBILE_BREAKPOINT = 1024;
    const SOCIAL_PANEL_KEY = 'KIU_SOCIAL_ACTIVE_PANEL';
    const SOCIAL_RUNTIME_EVENT = 'kiu:social-runtime-update';
    const ROLE_NAV = {
        student: [
            {
                group: 'Core',
                items: [
                    ['home', 'Dashboard', 'fas fa-th-large'],
                    ['lms', 'LMS', 'fas fa-book-reader'],
                    ['timetable', 'Timetable', 'fas fa-chalkboard'],
                    ['registration', 'Registration', 'fas fa-check-square']
                ]
            },
            {
                group: 'Records',
                items: [
                    ['programs', 'Programs', 'fas fa-file-signature'],
                    ['study-card', 'Study Card', 'far fa-address-card'],
                    ['personal-data', 'Personal Data', 'far fa-user'],
                    ['gradebook', 'Gradebook', 'fas fa-chart-bar']
                ]
            },
            {
                group: 'Support',
                items: [
                    ['news', 'News', 'fas fa-newspaper'],
                    ['chancellery', 'E-Chancellery', 'fas fa-desktop'],
                    ['student-service', 'Student Service', 'fas fa-headset'],
                    ['library', 'Library', 'fas fa-book'],
                    ['social', 'Social', 'fas fa-comments']
                ]
            }
        ],
        professor: [
            {
                group: 'Faculty',
                items: [
                    ['home', 'Dashboard', 'fas fa-th-large'],
                    ['timetable', 'Schedule', 'fas fa-calendar-week'],
                    ['lms', 'LMS', 'fas fa-book-reader'],
                    ['faculty-gradebook', 'Gradebook', 'fas fa-chart-bar']
                ]
            },
            {
                group: 'Campus',
                items: [
                    ['news', 'News', 'fas fa-newspaper'],
                    ['library', 'Library', 'fas fa-book'],
                    ['orders', 'Orders', 'fas fa-book-open'],
                    ['social', 'Social', 'fas fa-comments'],
                    ['chancellery', 'Appeals', 'fas fa-inbox']
                ]
            }
        ],
        ta: [
            {
                group: 'Faculty',
                items: [
                    ['home', 'Dashboard', 'fas fa-th-large'],
                    ['timetable', 'Schedule', 'fas fa-calendar-week'],
                    ['lms', 'LMS', 'fas fa-book-reader']
                ]
            },
            {
                group: 'Support',
                items: [
                    ['news', 'News', 'fas fa-newspaper'],
                    ['library', 'Library', 'fas fa-book'],
                    ['orders', 'Orders', 'fas fa-book-open'],
                    ['social', 'Social', 'fas fa-comments'],
                    ['chancellery', 'Appeals', 'fas fa-inbox']
                ]
            }
        ],
        admin: [
            {
                group: 'Control',
                items: [
                    ['home', 'Dashboard', 'fas fa-hammer'],
                    ['admin-tools', 'Admin Tools', 'fas fa-layer-group'],
                    ['admin-scheduler', 'Scheduler', 'fas fa-calendar-plus'],
                    ['staff', 'Staff', 'fas fa-users-cog'],
                    ['students-admin', 'Students', 'fas fa-user-graduate']
                ]
            },
            {
                group: 'Systems',
                items: [
                    ['news', 'News', 'fas fa-newspaper'],
                    ['library', 'Library', 'fas fa-book'],
                    ['orders', 'Orders', 'fas fa-book-open'],
                    ['social', 'Social', 'fas fa-comments']
                ]
            }
        ],
        student_service: [
            {
                group: 'Service',
                items: [
                    ['home', 'Dashboard', 'fas fa-th-large'],
                    ['student-service', 'Inbox', 'fas fa-inbox'],
                    ['orders', 'Orders', 'fas fa-book-open'],
                    ['library', 'Library', 'fas fa-book']
                ]
            },
            {
                group: 'Campus',
                items: [['news', 'News', 'fas fa-newspaper'], ['social', 'Social', 'fas fa-comments']]
            }
        ]
    };

    function isMobileViewport() {
        return window.innerWidth <= MOBILE_BREAKPOINT;
    }

    function getRole() {
        try {
            if (typeof getEffectiveRole === 'function') return getEffectiveRole() || 'student';
            if (typeof getEffectiveUserRole === 'function') return getEffectiveUserRole() || 'student';
        } catch (error) {
            console.warn('[Social Mobile] Could not resolve effective role.', error);
        }
        return 'student';
    }

    function getSocialRuntime() {
        try {
            return typeof getPortalSocialRuntimeState === 'function' ? getPortalSocialRuntimeState() || null : null;
        } catch (error) {
            return null;
        }
    }

    function currentUserId() {
        try {
            return String(typeof getCurrentUser === 'function' ? getCurrentUser()?.id || '' : '');
        } catch (error) {
            return '';
        }
    }

    function normalizeSocialPanel(panel) {
        return String(panel || '').toLowerCase() === 'lost-found' ? 'lost-and-found' : String(panel || '');
    }

    function getActiveSocialPanel() {
        const runtime = getSocialRuntime();
        const panel = normalizeSocialPanel(runtime?.ui?.activePanel || 'feed');
        return ['feed', 'community', 'workspace', 'projects', 'events', 'photography', 'lost-and-found', 'surveys', 'messages', 'alerts', 'profile'].includes(panel) ? panel : 'feed';
    }

    function activeMobileNavKey(panel = getActiveSocialPanel()) {
        const normalizedPanel = normalizeSocialPanel(panel);
        if (normalizedPanel === 'community') return 'community';
        if (normalizedPanel === 'workspace' || normalizedPanel === 'projects' || normalizedPanel === 'profile') return 'more';
        if (normalizedPanel === 'photography') return 'photography';
        if (normalizedPanel === 'events') return 'events';
        if (normalizedPanel === 'lost-and-found') return 'lost-and-found';
        if (normalizedPanel === 'surveys') return 'more';
        if (normalizedPanel === 'messages' || normalizedPanel === 'alerts') return 'inbox';
        return 'home';
    }

    function getUnreadMessageCount() {
        const runtime = getSocialRuntime();
        const chats = Array.isArray(runtime?.chats) ? runtime.chats : [];
        const userId = currentUserId();
        return chats
            .filter((chat) => Array.isArray(chat?.members) && chat.members.map(String).includes(userId))
            .reduce((total, chat) => {
                try {
                    return total + Number(typeof getPortalMessengerUnreadCount === 'function' ? getPortalMessengerUnreadCount(chat, userId) || 0 : 0);
                } catch (error) {
                    return total;
                }
            }, 0);
    }

    function getUnreadAlertCount() {
        try {
            return Number(typeof getPortalNotificationUnreadCount === 'function' ? getPortalNotificationUnreadCount(currentUserId()) || 0 : 0);
        } catch (error) {
            return 0;
        }
    }

    function syncInboxBadge() {
        const badge = document.getElementById('mob-badge-inbox');
        if (!badge) return;
        const total = getUnreadMessageCount() + getUnreadAlertCount();
        badge.textContent = total > 99 ? '99+' : String(total);
        badge.hidden = total <= 0;
    }

    function setSocialPanel(panel) {
        const runtime = getSocialRuntime();
        if (!runtime?.ui) return false;
        const nextPanel = normalizeSocialPanel(panel);
        runtime.ui.activePanel = nextPanel;
        if (nextPanel === 'messages' || nextPanel === 'alerts') runtime.ui.mobileInboxPanel = nextPanel;
        try {
            localStorage.setItem(SOCIAL_PANEL_KEY, nextPanel);
        } catch (error) {}
        if (typeof window.__kiuSocialLiteRenderPage === 'function') {
            window.__kiuSocialLiteRenderPage('mobile-nav');
        }
        syncActive(activeMobileNavKey(nextPanel));
        syncInboxBadge();
        closeSheet();
        closeSidebar();
        return true;
    }

    function openInboxPanel() {
        const runtime = getSocialRuntime();
        const panel = String(runtime?.ui?.mobileInboxPanel || (getActiveSocialPanel() === 'alerts' ? 'alerts' : 'messages'));
        return setSocialPanel(panel === 'alerts' ? 'alerts' : 'messages');
    }

    function syncSocialChrome() {
        syncActive(activeMobileNavKey());
        syncInboxBadge();
    }

    function setSidebarCollapsedState() {
        if (!isMobileViewport()) return;
        if (document.body.classList.contains('lux-sidebar-collapsed')) return;
        document.body.classList.add('lux-sidebar-collapsed');
        document.body.dataset.luxSidebar = 'collapsed';
        localStorage.setItem('kiuLuxurySidebarCollapsed', '1');
        const toggle = document.getElementById('lux-sidebar-toggle');
        if (!toggle) return;
        toggle.classList.add('is-active');
        toggle.setAttribute('aria-pressed', 'true');
    }

    function closeSidebar() {
        if (!isMobileViewport()) return;
        if (!document.body.classList.contains('lux-sidebar-collapsed')) {
            if (typeof window.toggleSidebar === 'function') {
                window.toggleSidebar();
            } else {
                document.body.classList.add('lux-sidebar-collapsed');
                document.body.dataset.luxSidebar = 'collapsed';
            }
        }
    }

    function syncActive(target) {
        const nav = document.getElementById('mobile-bottom-nav');
        if (!nav) return;
        nav.querySelectorAll('.mobile-nav-btn[data-social-nav]').forEach((button) => {
            button.classList.toggle('is-active', button.getAttribute('data-social-nav') === target);
        });
    }

    function isElementShown(element) {
        if (!element) return false;
        const explicitState = element.getAttribute('data-mob-visible');
        if (explicitState === 'true') return true;
        if (explicitState === 'false') return false;
        if (element.hidden || element.getAttribute('aria-hidden') === 'true') return false;
        return !/display\s*:\s*none/i.test(String(element.getAttribute('style') || ''));
    }

    function setElementShown(element, shown, displayValue = '') {
        void displayValue;
        if (!element) return;
        element.hidden = !shown;
        element.setAttribute('data-mob-visible', shown ? 'true' : 'false');
    }

    function setSheetBodyState(isOpen) {
        document.body.classList.toggle('mob-sheet-open', isOpen === true);
    }

    function closeSheet(options = {}) {
        const sheet = document.getElementById('mobile-action-sheet');
        const moreButton = document.getElementById('mob-nav-more');
        const closeButton = document.getElementById('mob-sheet-close');
        if (!sheet) return;
        sheet.classList.remove('is-open');
        sheet.setAttribute('aria-hidden', 'true');
        if (moreButton) moreButton.setAttribute('aria-expanded', 'false');
        if (closeButton) closeButton.removeAttribute('data-mob-sheet-focus');
        setSheetBodyState(false);
        window.setTimeout(() => {
            setElementShown(sheet, false);
            if (options.restoreFocus !== false && moreButton) moreButton.focus();
            syncSocialChrome();
        }, 300);
    }

    function openSheet() {
        const sheet = document.getElementById('mobile-action-sheet');
        const moreButton = document.getElementById('mob-nav-more');
        const closeButton = document.getElementById('mob-sheet-close');
        if (!sheet) return;
        setElementShown(sheet, true);
        sheet.setAttribute('aria-hidden', 'false');
        if (moreButton) moreButton.setAttribute('aria-expanded', 'true');
        setSheetBodyState(true);
        window.requestAnimationFrame(() => {
            sheet.classList.add('is-open');
            if (closeButton) {
                closeButton.setAttribute('data-mob-sheet-focus', '1');
                closeButton.focus();
            }
        });
        buildRoleNav();
    }

    function toggleSheet() {
        const sheet = document.getElementById('mobile-action-sheet');
        if (!sheet) return;
        if (isElementShown(sheet)) {
            closeSheet();
            return;
        }
        openSheet();
    }

    function openStudioPanel() {
        const editorButton = document.querySelector('.lux-topbar-editor-btn');
        if (editorButton) {
            editorButton.click();
            return;
        }
        const backdrop = document.querySelector('.lux-studio-backdrop');
        if (backdrop) {
            backdrop.classList.add('is-open');
            return;
        }
        if (typeof window.openStudio === 'function') {
            window.openStudio();
        }
    }

    function invokeNavigate(target) {
        if (!target) return false;
        if (typeof window.navigate === 'function') {
            window.navigate(target);
        } else if (typeof window.resolvePortalRouteUrl === 'function') {
            window.location.assign(window.resolvePortalRouteUrl(target, getRole()));
        } else {
            return false;
        }
        syncActive(target);
        closeSheet();
        closeSidebar();
        return true;
    }

    function buildRoleNav() {
        const container = document.getElementById('mob-sheet-dynamic-nav');
        if (!container) return;
        const role = getRole();
        const groups = ROLE_NAV[role] || ROLE_NAV.student;
        container.innerHTML = groups.map((group) => `
            <div class="mob-sheet-section">
                <div class="mob-sheet-label">${group.group}</div>
                <div class="mob-sheet-nav">
                    ${group.items.map((item) => `
                        <button class="mob-sheet-nav-btn" type="button" data-nav-target="${item[0]}">
                            <i class="${item[2]}"></i>
                            <span>${item[1]}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `).join('') + `
            <div class="mob-sheet-section">
                <div class="mob-sheet-label">Social Shortcuts</div>
                <div class="mob-sheet-nav">
                    <button class="mob-sheet-nav-btn" type="button" data-social-panel="feed">
                        <i class="fas fa-stream"></i>
                        <span>Feed</span>
                    </button>
                    <button class="mob-sheet-nav-btn" type="button" data-social-panel="photography">
                        <i class="fas fa-camera-retro"></i>
                        <span>Exposé</span>
                    </button>
                    <button class="mob-sheet-nav-btn" type="button" data-social-panel="workspace">
                        <i class="fas fa-diagram-project"></i>
                        <span>Projects</span>
                    </button>
                    <button class="mob-sheet-nav-btn" type="button" data-social-panel="projects">
                        <i class="fas fa-briefcase"></i>
                        <span>Portfolio</span>
                    </button>
                    <button class="mob-sheet-nav-btn" type="button" data-social-panel="lost-and-found">
                        <i class="fas fa-magnifying-glass-location"></i>
                        <span>Lost & Found</span>
                    </button>
                    <button class="mob-sheet-nav-btn" type="button" data-social-panel="surveys">
                        <i class="fas fa-clipboard-list"></i>
                        <span>Surveys</span>
                    </button>
                    <button class="mob-sheet-nav-btn" type="button" data-social-panel="profile" data-social-profile-tab="saved">
                        <i class="fas fa-bookmark"></i>
                        <span>Saved</span>
                    </button>
                    <button class="mob-sheet-nav-btn" type="button" data-social-panel="alerts">
                        <i class="fas fa-shield-halved"></i>
                        <span>Moderation</span>
                    </button>
                </div>
            </div>
        `;

        container.querySelectorAll('.mob-sheet-nav-btn[data-nav-target]').forEach((button) => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                invokeNavigate(button.getAttribute('data-nav-target'));
            });
        });

        container.querySelectorAll('.mob-sheet-nav-btn[data-social-panel]').forEach((button) => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                const panel = button.getAttribute('data-social-panel');
                const profileTab = button.getAttribute('data-social-profile-tab');
                if (profileTab && typeof getSocialRuntime === 'function') {
                    const runtime = getSocialRuntime();
                    if (runtime?.ui) runtime.ui.profileTab = profileTab;
                }
                if (panel && setSocialPanel(panel)) return;
                closeSheet();
            });
        });

        const adminSwitch = document.getElementById('mob-act-admin');
        if (adminSwitch) {
            adminSwitch.hidden = !['admin', 'student_service', 'professor', 'ta'].includes(role);
        }
    }

    function toggleLightMode() {
        const nextMode = typeof window.toggleLuxuryInterfaceMode === 'function'
            ? window.toggleLuxuryInterfaceMode()
            : (document.body.classList.toggle('lux-light-mode'), document.body.classList.contains('lux-light-mode') ? 'light' : 'dark');
        const isLight = nextMode === 'light';
        const button = document.getElementById('mob-act-lightmode');
        if (button) {
            const label = button.querySelector('span');
            const icon = button.querySelector('i');
            if (label) label.textContent = isLight ? 'Dark Mode' : 'Light Mode';
            if (icon) icon.className = isLight ? 'fas fa-moon' : 'fas fa-sun';
        }
    }

    function setupBottomNav() {
        const nav = document.getElementById('mobile-bottom-nav');
        if (!nav) return;

        nav.querySelectorAll('.mobile-nav-btn[data-social-panel]').forEach((button) => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                setSocialPanel(button.getAttribute('data-social-panel'));
            });
        });

        document.getElementById('mob-nav-inbox')?.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            openInboxPanel();
        });

        document.getElementById('mob-nav-more')?.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            syncActive('more');
            toggleSheet();
        });

    }

    function setupSheet() {
        document.getElementById('mob-sheet-backdrop')?.addEventListener('click', closeSheet);
        document.getElementById('mob-sheet-close')?.addEventListener('click', closeSheet);

        document.getElementById('mob-act-admin')?.addEventListener('click', (event) => {
            event.preventDefault();
            closeSheet();
            if (typeof window.openRoleSwitcherPanel === 'function' && window.openRoleSwitcherPanel()) {
                return;
            }
            document.getElementById('lux-role-picker-btn')?.click();
        });

        document.getElementById('mob-act-theme')?.addEventListener('click', (event) => {
            event.preventDefault();
            closeSheet();
            openStudioPanel();
        });

        document.getElementById('mob-act-profile')?.addEventListener('click', (event) => {
            event.preventDefault();
            if (setSocialPanel('profile')) return;
            closeSheet();
            invokeNavigate('profile-view');
        });

        document.getElementById('mob-act-lightmode')?.addEventListener('click', (event) => {
            event.preventDefault();
            toggleLightMode();
        });
    }

    function handleResize() {
        const nav = document.getElementById('mobile-bottom-nav');
        if (!nav) return;
        setElementShown(nav, isMobileViewport());
        if (!isMobileViewport()) {
            closeSheet({ restoreFocus: false });
            return;
        }
        setSidebarCollapsedState();
        syncSocialChrome();
    }

    function hookNavigate() {
        if (window.__KIU_SOCIAL_MOBILE_NAV_HOOKED) return;
        if (typeof window.navigate !== 'function') return;

        const originalNavigate = window.navigate;
        window.navigate = function mobileAwareNavigate(target) {
            const result = originalNavigate.apply(this, arguments);
            if (isMobileViewport()) {
                syncSocialChrome();
                closeSidebar();
                closeSheet();
            }
            return result;
        };
        window.__KIU_SOCIAL_MOBILE_NAV_HOOKED = true;
    }

    function ensureNavigateHooks() {
        if (typeof window.navigate !== 'function') return false;
        hookNavigate();
        buildRoleNav();
        return true;
    }

    function setupSwipeCollapse() {
        document.addEventListener('touchstart', (event) => {
            if (!isMobileViewport() || document.body.classList.contains('lux-sidebar-collapsed')) return;
            window.__socialMobSwipeX = event.touches[0].clientX;
            window.__socialMobSwipeY = event.touches[0].clientY;
        }, { passive: true });

        document.addEventListener('touchend', (event) => {
            if (!window.__socialMobSwipeX) return;
            const deltaX = window.__socialMobSwipeX - event.changedTouches[0].clientX;
            const deltaY = Math.abs(window.__socialMobSwipeY - event.changedTouches[0].clientY);
            window.__socialMobSwipeX = 0;
            if (deltaX > 60 && deltaY < 100) {
                closeSidebar();
            }
        }, { passive: true });
    }

    function handleSocialRuntimeEvent() {
        ensureNavigateHooks();
        syncSocialChrome();
    }

    function boot() {
        window.__kiuSocialMobileSync = syncSocialChrome;
        setupBottomNav();
        setupSheet();
        setSidebarCollapsedState();
        handleResize();
        ensureNavigateHooks();
        setupSwipeCollapse();
        window.addEventListener('resize', handleResize);
        window.addEventListener('load', ensureNavigateHooks, { once: true });
        window.addEventListener(SOCIAL_RUNTIME_EVENT, handleSocialRuntimeEvent);
        syncSocialChrome();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }
})();
