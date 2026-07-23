/* Home dashboard viewport helper (editor gestures removed — static merged shell). */
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
