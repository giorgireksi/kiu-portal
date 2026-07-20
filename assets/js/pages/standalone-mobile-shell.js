(function initStandaloneMobileShellModule() {
    'use strict';

    if (window.__kiuStandaloneMobileShellLoaded) return;
    window.__kiuStandaloneMobileShellLoaded = true;

    function getConfig() {
        return window.__KIU_STANDALONE_MOBILE_SHELL_CONFIG || {};
    }

    function getBreakpoint() {
        return Number(getConfig().breakpoint || 1024);
    }

    function isMob() {
        return window.innerWidth <= getBreakpoint();
    }

    function getRole() {
        let role = '';
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
        if (!isMob()) return;
        if (document.body.classList.contains('lux-sidebar-collapsed')) return;
        document.body.classList.add('lux-sidebar-collapsed');
        document.body.dataset.luxSidebar = 'collapsed';
        localStorage.setItem('kiuLuxurySidebarCollapsed', '1');
        const toggle = document.getElementById('lux-sidebar-toggle');
        if (!toggle) return;
        toggle.classList.add('is-active');
        toggle.setAttribute('aria-pressed', 'true');
    }

    function getRoleNavConfig() {
        const config = getConfig();
        return config.navByRole && typeof config.navByRole === 'object' ? config.navByRole : {};
    }

    function getInitialActiveTarget() {
        const config = getConfig();
        return String(
            config.activeTarget
            || document.body?.dataset?.luxPage
            || document.body?.dataset?.luxEntry
            || ''
        ).trim().toLowerCase();
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

    function buildRoleNav() {
        const container = document.getElementById('mob-sheet-dynamic-nav');
        if (!container) return;
        const navByRole = getRoleNavConfig();
        const groups = navByRole[getRole()] || navByRole.student || [];
        let html = '';
        groups.forEach((group) => {
            html += `<div class="mob-sheet-section"><div class="mob-sheet-label">${group.group}</div><div class="mob-sheet-nav">`;
            group.items.forEach((item) => {
                html += `<button class="mob-sheet-nav-btn" data-nav-target="${item[0]}"><i class="${item[2]}"></i><span>${item[1]}</span></button>`;
            });
            html += '</div></div>';
        });
        container.innerHTML = html;
        container.querySelectorAll('.mob-sheet-nav-btn[data-nav-target]').forEach((button) => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                const target = button.getAttribute('data-nav-target');
                if (!invokeNavigate(target)) return;
                syncActive(target);
                closeSheet();
                closeSB();
            });
        });
        const visibleRoles = Array.isArray(getConfig().adminVisibleRoles) ? getConfig().adminVisibleRoles : null;
        if (visibleRoles) {
            const adminSwitch = document.getElementById('mob-act-admin');
            if (adminSwitch) adminSwitch.hidden = !visibleRoles.includes(getRole());
        }
    }

    function setupNav() {
        const nav = document.getElementById('mobile-bottom-nav');
        if (!nav) return;
        nav.querySelectorAll('.mobile-nav-btn[data-nav-target]').forEach((button) => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                const target = button.getAttribute('data-nav-target');
                if (!invokeNavigate(target)) return;
                syncActive(target);
                closeSB();
                closeSheet();
            });
        });
        const messagesButton = document.getElementById('mob-nav-messages');
        if (messagesButton) {
            messagesButton.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                const fab = document.querySelector('.portal-msg-fab');
                if (fab) {
                    fab.click();
                    return;
                }
                if (typeof window.toggleMessaging === 'function') {
                    window.toggleMessaging();
                    return;
                }
                const utility = document.querySelector('[data-utility="messages"]');
                if (utility) utility.click();
            });
        }
        const notificationsButton = document.getElementById('mob-nav-notif');
        if (notificationsButton) {
            notificationsButton.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                const fab = document.querySelector('.portal-notif-fab');
                if (fab) {
                    fab.click();
                    return;
                }
                if (typeof window.toggleNotifications === 'function') {
                    window.toggleNotifications();
                    return;
                }
                const utility = document.querySelector('[data-utility="notifications"]');
                if (utility) utility.click();
            });
        }
        const themeButton = document.getElementById('mob-nav-theme');
        if (themeButton) {
            themeButton.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                openStd();
            });
        }
        const moreButton = document.getElementById('mob-nav-more');
        if (moreButton) {
            moreButton.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                toggleSheet();
            });
        }
    }

    function openStd() {
        const topbarButton = document.querySelector('.lux-topbar-editor-btn');
        if (topbarButton) {
            topbarButton.click();
            return;
        }
        const studio = document.querySelector('.lux-studio-backdrop');
        if (studio) {
            studio.classList.add('is-open');
            return;
        }
        if (typeof window.openStudio === 'function') window.openStudio();
    }

    function handleAdminAction() {
        const config = getConfig();
        if (config.adminActionMode === 'role-switcher') {
            if (typeof window.openRoleSwitcherPanel === 'function' && window.openRoleSwitcherPanel()) return true;
            const roleButton = document.getElementById('lux-role-picker-btn');
            if (roleButton) {
                roleButton.click();
                return true;
            }
        }
        const selector = String(config.adminPickerSelector || '.lux-picker-btn').trim();
        if (!selector) return false;
        const button = document.querySelector(selector);
        if (!button) return false;
        button.click();
        return true;
    }

    function setupSheet() {
        const backdrop = document.getElementById('mob-sheet-backdrop');
        if (backdrop) backdrop.addEventListener('click', closeSheet);
        const closeButton = document.getElementById('mob-sheet-close');
        if (closeButton) closeButton.addEventListener('click', closeSheet);
        const adminButton = document.getElementById('mob-act-admin');
        if (adminButton) {
            adminButton.addEventListener('click', (event) => {
                event.preventDefault();
                closeSheet();
                handleAdminAction();
            });
        }
        const themeButton = document.getElementById('mob-act-theme');
        if (themeButton) {
            themeButton.addEventListener('click', (event) => {
                event.preventDefault();
                closeSheet();
                openStd();
            });
        }
        const profileButton = document.getElementById('mob-act-profile');
        if (profileButton) {
            profileButton.addEventListener('click', (event) => {
                event.preventDefault();
                if (!invokeNavigate('personal-data')) return;
                closeSheet();
            });
        }
        const lightModeButton = document.getElementById('mob-act-lightmode');
        if (lightModeButton) {
            lightModeButton.addEventListener('click', (event) => {
                event.preventDefault();
                const nextMode = typeof window.toggleLuxuryInterfaceMode === 'function'
                    ? window.toggleLuxuryInterfaceMode()
                    : (document.body.classList.toggle('lux-light-mode'), document.body.classList.contains('lux-light-mode') ? 'light' : 'dark');
                const isLight = nextMode === 'light';
                const label = lightModeButton.querySelector('span');
                const icon = lightModeButton.querySelector('i');
                if (label) label.textContent = isLight ? 'Dark Mode' : 'Light Mode';
                if (icon) icon.className = isLight ? 'fas fa-moon' : 'fas fa-sun';
            });
        }
    }

    function toggleSheet() {
        const sheet = document.getElementById('mobile-action-sheet');
        if (!sheet) return;
        isElementShown(sheet) ? closeSheet() : openSheet();
    }

    function ensureMobileActionSheetCss() {
        if (typeof document === 'undefined') return;
        if (document.querySelector('link[data-kiu-mobile-action-sheet]')) return;
        const links = document.querySelectorAll('link[rel="stylesheet"]');
        for (let i = 0; i < links.length; i += 1) {
            const href = String(links[i].getAttribute('href') || '');
            if (href.indexOf('lux-mobile-action-sheet.css') !== -1) return;
        }
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'assets/css/lux-mobile-action-sheet.css?v=20260720-densify6500';
        link.setAttribute('data-kiu-mobile-action-sheet', '1');
        document.head.appendChild(link);
    }

    function openSheet() {
        const sheet = document.getElementById('mobile-action-sheet');
        const moreButton = document.getElementById('mob-nav-more');
        const closeButton = document.getElementById('mob-sheet-close');
        if (!sheet) return;
        ensureMobileActionSheetCss();
        setElementShown(sheet, true, '');
        sheet.setAttribute('aria-hidden', 'false');
        if (moreButton) moreButton.setAttribute('aria-expanded', 'true');
        setSheetBodyState(true);
        requestAnimationFrame(() => {
            sheet.classList.add('is-open');
            if (closeButton) {
                closeButton.setAttribute('data-mob-sheet-focus', '1');
                closeButton.focus();
            }
        });
        buildRoleNav();
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
        setTimeout(() => {
            setElementShown(sheet, false);
            if (options.restoreFocus !== false && moreButton) moreButton.focus();
        }, 300);
    }

    function syncActive(target) {
        const nav = document.getElementById('mobile-bottom-nav');
        if (!nav) return;
        nav.querySelectorAll('.mobile-nav-btn[data-nav-target]').forEach((button) => {
            button.classList.toggle('is-active', button.getAttribute('data-nav-target') === target);
        });
        ['mob-nav-messages', 'mob-nav-notif', 'mob-nav-theme', 'mob-nav-more'].forEach((id) => {
            const button = document.getElementById(id);
            if (button) button.classList.remove('is-active');
        });
    }

    function hookNav() {
        const original = window.navigate;
        if (typeof original !== 'function' || window.__mobileNavHooked) return;
        window.__mobileNavHooked = true;
        window.navigate = function patchedNavigate(target) {
            const result = original.apply(this, arguments);
            if (isMob()) {
                syncActive(target);
                closeSB();
                closeSheet();
            }
            return result;
        };
    }

    function ensureNavigateHooks() {
        if (typeof window.navigate !== 'function') return false;
        hookNav();
        if (getConfig().buildRoleNavOnce === true) {
            if (!window.__kiuStandaloneRoleNavBuilt) {
                window.__kiuStandaloneRoleNavBuilt = true;
                buildRoleNav();
            }
            return true;
        }
        buildRoleNav();
        return true;
    }

    function closeSB() {
        if (!isMob()) return;
        if (document.body.classList.contains('lux-sidebar-collapsed')) return;
        if (typeof window.toggleSidebar === 'function') {
            window.toggleSidebar();
            return;
        }
        document.body.classList.add('lux-sidebar-collapsed');
        document.body.dataset.luxSidebar = 'collapsed';
    }

    function onResize() {
        const nav = document.getElementById('mobile-bottom-nav');
        if (!nav) return;
        setElementShown(nav, isMob(), '');
        if (!isMob()) closeSheet({ restoreFocus: false });
    }

    function init() {
        autoCollapse();
        setupNav();
        setupSheet();
        onResize();
        const initialActiveTarget = getInitialActiveTarget();
        if (initialActiveTarget) syncActive(initialActiveTarget);
        ensureNavigateHooks();
        window.addEventListener('load', ensureNavigateHooks, { once: true });
        window.addEventListener('resize', onResize);
        document.addEventListener('touchstart', (event) => {
            if (!isMob() || document.body.classList.contains('lux-sidebar-collapsed')) return;
            window.__swX = event.touches[0].clientX;
            window.__swY = event.touches[0].clientY;
        }, { passive: true });
        document.addEventListener('touchend', (event) => {
            if (!window.__swX) return;
            const dx = window.__swX - event.changedTouches[0].clientX;
            const dy = Math.abs(window.__swY - event.changedTouches[0].clientY);
            window.__swX = 0;
            if (dx > 60 && dy < 100) closeSB();
        }, { passive: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
