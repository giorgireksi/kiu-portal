(function initAdminOrdersPageController() {
    'use strict';

    const ADMIN_ORDERS_INITIAL_RENDER_FALLBACK_MS = 1200;
    let studioControlsBound = false;
    const adminOrdersBootState = window.__KIU_ADMIN_ORDERS_BOOT_STATE = window.__KIU_ADMIN_ORDERS_BOOT_STATE || {
        initialRenderComplete: false,
        fallbackScheduled: false
    };

    function bindAdminOrdersStudioControls() {
        if (studioControlsBound) return;
        studioControlsBound = true;

        document.addEventListener('click', (event) => {
            const modalClose = event.target.closest('[data-admin-orders-close-modal]');
            if (modalClose) {
                if (typeof window.closeAllModals === 'function') window.closeAllModals(event);
                return;
            }

            const palette = event.target.closest('[data-admin-orders-palette]');
            if (palette) {
                if (typeof window.applyPalette === 'function') window.applyPalette(palette.dataset.adminOrdersPalette || '');
                return;
            }

            const mode = event.target.closest('[data-admin-orders-interface-mode]');
            if (mode) {
                if (typeof window.setInterfaceMode === 'function') window.setInterfaceMode(mode.dataset.adminOrdersInterfaceMode || 'dark');
                return;
            }

            const background = event.target.closest('[data-admin-orders-background]');
            if (background) {
                if (typeof window.setBackground === 'function') window.setBackground(background.dataset.adminOrdersBackground || '');
                return;
            }

            const backgroundAnimation = event.target.closest('[data-admin-orders-background-animation]');
            if (backgroundAnimation) {
                if (typeof window.setBackgroundAnimationsEnabled === 'function') {
                    window.setBackgroundAnimationsEnabled(backgroundAnimation.dataset.adminOrdersBackgroundAnimation !== 'off', true);
                }
                return;
            }

            const customApply = event.target.closest('[data-admin-orders-apply-custom-color]');
            if (customApply && typeof window.applyCustomColor === 'function') {
                window.applyCustomColor();
            }
        });

        document.addEventListener('input', (event) => {
            if (event.target.matches('[data-admin-orders-transparency]') && typeof window.updateTransparency === 'function') {
                if (typeof window.setDashboardVisuals === 'function') {
                    window.setDashboardVisuals({ surfaceTransparency: String(event.target.value || '70') });
                }
                window.updateTransparency(event.target.value);
            }
            if (event.target.matches('[data-admin-orders-custom-color]') && typeof window.updateCustomColor === 'function') {
                window.updateCustomColor();
            }
        });
    }

    function ensureAdminOrdersContent(options = {}) {
        if (typeof renderAdminOrders !== 'function') return;
        const allowBootstrapFallback = options.allowBootstrapFallback === true;
        if (
            !adminOrdersBootState.initialRenderComplete
            && !allowBootstrapFallback
            && window.__KIU_PORTAL_BOOTSTRAP_PENDING === true
        ) {
            if (!adminOrdersBootState.fallbackScheduled) {
                adminOrdersBootState.fallbackScheduled = true;
                window.setTimeout(() => {
                    adminOrdersBootState.fallbackScheduled = false;
                    if (!adminOrdersBootState.initialRenderComplete) {
                        ensureAdminOrdersContent({ allowBootstrapFallback: true });
                    }
                }, ADMIN_ORDERS_INITIAL_RENDER_FALLBACK_MS);
            }
            return;
        }
        renderAdminOrders();
        adminOrdersBootState.initialRenderComplete = true;
    }

    function initAdminOrdersPage() {
        if (typeof schedulePortalShellReadyReveal === 'function') {
            schedulePortalShellReadyReveal();
        } else if (typeof markPortalShellReady === 'function') {
            markPortalShellReady();
        }

        bindAdminOrdersStudioControls();
        document.body.classList.remove('role-student');
        document.body.classList.add('role-admin');

        const facultyCode = localStorage.getItem('currentFaculty') || 'ECON';
        if (typeof window.switchFacultyTheme === 'function') {
            window.switchFacultyTheme(facultyCode, { refreshDependentViews: false });
        }

        if (typeof window.refreshStandaloneDesktopRouteShellContext === 'function') {
            window.refreshStandaloneDesktopRouteShellContext({ rerender: false, refreshActiveRoute: false });
        } else if (typeof window.refreshStandaloneDesktopShellChrome === 'function') {
            window.refreshStandaloneDesktopShellChrome();
        } else if (typeof window.initPalette === 'function') {
            window.initPalette();
        }

        ensureAdminOrdersContent();
    }

    window.addEventListener('kiu:portal-bootstrap-complete', () => {
        adminOrdersBootState.fallbackScheduled = false;
        ensureAdminOrdersContent({ allowBootstrapFallback: true });
    });

    window.bindAdminOrdersStudioControls = bindAdminOrdersStudioControls;
    window.ensureAdminOrdersContent = ensureAdminOrdersContent;
    window.initAdminOrdersPage = initAdminOrdersPage;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdminOrdersPage, { once: true });
    } else {
        initAdminOrdersPage();
    }
})();
