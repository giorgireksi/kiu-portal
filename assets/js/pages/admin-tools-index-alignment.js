(function adminToolsIndexAlignment() {
    'use strict';

    const PAGE_SELECTOR = '#lux-admin-tools-shell .lux-admin-tools-page';
    let scheduled = false;

    function clearPresentationalInlineStyle(element) {
        if (!element?.style) return;
        element.style.removeProperty('background');
        element.style.removeProperty('background-color');
        element.style.removeProperty('backdrop-filter');
        element.style.removeProperty('-webkit-backdrop-filter');
        element.style.removeProperty('box-shadow');
        if (!element.style.cssText.trim()) element.removeAttribute('style');
    }

    function syncAlignment() {
        const page = document.querySelector(PAGE_SELECTOR);
        if (!page?.children.length) return;

        page.querySelectorAll('.lux-admin-tools-index-panel, [data-lux-index-glass-root]').forEach((element) => {
            element.classList.remove('lux-admin-tools-index-panel');
            element.removeAttribute('data-lux-index-glass-root');
        });

        page.querySelectorAll('[data-lux-glass-root="1"] *').forEach(clearPresentationalInlineStyle);
        document.getElementById('lux-admin-tools-index-hero')?.remove();
        document.getElementById('lux-admin-tools-index-strip')?.remove();
        page.dataset.adminToolsIndexAligned = '1';
    }

    function queueSync() {
        if (scheduled) return;
        scheduled = true;
        const schedule = window.requestAnimationFrame || ((callback) => window.setTimeout(callback, 0));
        schedule(() => {
            scheduled = false;
            syncAlignment();
        });
    }

    function installObserver() {
        if (document.documentElement.dataset.adminToolsIndexObserverBound === '1') return;
        const root = document.getElementById('lux-admin-tools-shell')
            || document.getElementById('page-admin-tools')
            || document.body;
        new MutationObserver(queueSync).observe(root, { childList: true, subtree: true });
        document.documentElement.dataset.adminToolsIndexObserverBound = '1';
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            installObserver();
            queueSync();
        }, { once: true });
    } else {
        installObserver();
        queueSync();
    }

    window.addEventListener('load', queueSync, { once: true });
    window.setTimeout(queueSync, 1200);
})();
