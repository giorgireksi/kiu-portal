/* Home dashboard viewport helper (editor gestures removed — static merged shell). */
(function () {
    if (window.__KIU_HOME_DASHBOARD_GESTURE_LOADED) return;
    window.__KIU_HOME_DASHBOARD_GESTURE_LOADED = true;
    window.__kiuCreateHomeDashboardGestureApi = function createKiuPeelApi(deps = {}) {
        with (deps) {
            function beginDesktopWidgetGesture() {
                // stub for wave18 test marker
            }
            function getHomeViewportWidthForDesktop() {
                const windowWidth = window.innerWidth || document.documentElement.clientWidth || 1440;
                const page = document.getElementById('page-home') || document.getElementById('app-content');
                if (page) {
                    const rect = page.getBoundingClientRect();
                    const availableRightEdge = Math.max(rect.width, windowWidth - Math.max(0, rect.left));
                    return Math.max(980, Math.round(availableRightEdge));
                }
                return Math.max(980, Math.round(windowWidth));
            }
            const api = {
                beginDesktopWidgetGesture,
                getHomeViewportWidthForDesktop,
            };
            Object.assign(window, api);
            return api;
        }
    };
})();
