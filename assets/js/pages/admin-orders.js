(function initAdminOrdersPageController() {
    'use strict';

    let studioControlsBound = false;

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

    function ensureAdminOrdersContent() {
        if (typeof window.renderAdminOrders === 'function') {
            window.renderAdminOrders();
        }
    }

    function initAdminOrdersPage() {
        bindAdminOrdersStudioControls();
        document.body.classList.remove('role-student');
        document.body.classList.add('role-admin');

        const facultyCode = localStorage.getItem('currentFaculty') || 'ECON';
        if (typeof window.switchFacultyTheme === 'function') {
            window.switchFacultyTheme(facultyCode);
        }

        if (typeof window.syncAll === 'function') {
            window.syncAll();
        } else if (typeof window.initPalette === 'function') {
            window.initPalette();
        }

        ensureAdminOrdersContent();
        window.addEventListener('load', ensureAdminOrdersContent, { once: true });

        setTimeout(() => {
            if (typeof window.updateTransparency === 'function') {
                const saved = localStorage.getItem('kiuLuxurySurfaceTransparency') || '70';
                window.updateTransparency(parseInt(saved, 10));
            }
        }, 300);
    }

    window.bindAdminOrdersStudioControls = bindAdminOrdersStudioControls;
    window.ensureAdminOrdersContent = ensureAdminOrdersContent;
    window.initAdminOrdersPage = initAdminOrdersPage;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdminOrdersPage, { once: true });
    } else {
        initAdminOrdersPage();
    }
})();
