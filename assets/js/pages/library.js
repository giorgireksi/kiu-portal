(function initLibraryPageController() {
    'use strict';

    const DEFERRED_SCRIPT_URLS = [
        'assets/js/shared/library-catalog-sync.js?v=20260714-libcleanup1',
        'assets/js/shared/lux-scroll-rail.js?v=20260622-scrollrail1'
    ];

    const runtime = {
        bound: false
    };

    function hasAdminLibraryWorkspace(root) {
        return Boolean(root?.querySelector?.('.alib-workspace'));
    }

    function ensureLibraryPageShell() {
        const root = document.getElementById('page-library');
        if (!root) return null;
        if (document.body?.classList?.contains('lux-route-admin-library') || hasAdminLibraryWorkspace(root)) {
            return root;
        }
        if (typeof window.LibraryCatalogView?.renderCatalogShell === 'function') {
            return window.LibraryCatalogView.renderCatalogShell(root, { mode: 'readonly' });
        }
        return root;
    }

    function ensureSharedLibraryState() {
        if (typeof ensureLibraryCatalogState === 'function') {
            ensureLibraryCatalogState();
            return;
        }
        if (!KIU_STATE.adminLibrary) KIU_STATE.adminLibrary = {};
        if (!Array.isArray(KIU_STATE.adminLibrary.books)) KIU_STATE.adminLibrary.books = [];
    }

    function bindLibraryInteractions() {
        if (runtime.bound) return;
        runtime.bound = true;
        if (typeof window.LibraryCatalogView?.bindCatalogInteractions === 'function') {
            window.LibraryCatalogView.bindCatalogInteractions({ mode: 'readonly' });
        }
        document.addEventListener('click', (event) => {
            if (event.target.closest('.lux-picker-field, #lux-topbar, .lux-picker-panel, .lux-utility-panel, .lux-user-menu, #lux-studio-backdrop')) return;
            if (typeof window.closePickerPanels === 'function') window.closePickerPanels();
        });
    }

    function renderSharedLibraryFilters() {
        if (typeof window.LibraryCatalogView?.renderCatalogFilters === 'function') {
            window.LibraryCatalogView.renderCatalogFilters('readonly');
        }
    }

    function renderSharedLibraryCatalog() {
        if (typeof window.LibraryCatalogView?.renderCatalogTable === 'function') {
            window.LibraryCatalogView.renderCatalogTable({ mode: 'readonly' });
        }
    }

    function renderLibraryPageShellContext() {
        const root = document.getElementById('page-library');
        if (!root) return null;
        if (document.body?.classList?.contains('lux-route-admin-library') || hasAdminLibraryWorkspace(root)) {
            return root;
        }
        return ensureLibraryPageShell();
    }

    function paintLibraryPage() {
        const root = document.getElementById('page-library');
        if (document.body?.classList?.contains('lux-route-admin-library') || hasAdminLibraryWorkspace(root)) {
            if (typeof window.renderAdminLibrary === 'function') {
                window.renderAdminLibrary();
            }
            return;
        }
        const shellMounted = root?.querySelector?.('[data-library-catalog-shell="1"]');
        if (shellMounted && runtime.bound) {
            renderSharedLibraryCatalog();
            return;
        }
        const shellRoot = renderLibraryPageShellContext();
        if (!shellRoot) return;
        root?.querySelector?.('[data-library-loading-shell="1"]')?.remove();
        ensureSharedLibraryState();
        bindLibraryInteractions();
        renderSharedLibraryFilters();
        renderSharedLibraryCatalog();
    }

    function bootLibraryPageOnce(reason = 'standalone-boot') {
        if (!document.body?.classList?.contains('lux-route-library')) return;
        if (window.__kiuLibraryPageBooted) return;
        window.__kiuLibraryPageBooted = true;
        window.__kiuLibraryPageBootReason = String(reason || 'standalone-boot');
        // Load catalog sync before first paint so the shelf is not first rendered empty/stale.
        loadDeferredLibraryScripts().then(() => {
            paintLibraryPage();
        });
    }

    function renderLibraryPage() {
        if (!window.__kiuLibraryPageBooted && document.body?.classList?.contains('lux-route-library')) {
            bootLibraryPageOnce('render-library-page');
            return;
        }
        if (typeof ensureLibraryCatalogState !== 'function') {
            loadDeferredLibraryScripts().then(() => paintLibraryPage());
            return;
        }
        paintLibraryPage();
    }

    function refreshLibraryCatalogAfterBootstrap() {
        if (typeof window.LibraryCatalogView?.refreshCatalogDataIfChanged === 'function') {
            window.LibraryCatalogView.refreshCatalogDataIfChanged('readonly');
        }
    }

    function syncDeferredLibraryScrollRail() {
        if (typeof window.syncLibraryCatalogTabsRail === 'function') {
            window.syncLibraryCatalogTabsRail();
        }
    }

    function loadDeferredLibraryScripts() {
        if (window.__kiuLibraryDeferredScriptsPromise) {
            return window.__kiuLibraryDeferredScriptsPromise;
        }

        window.__kiuLibraryDeferredScriptsPromise = DEFERRED_SCRIPT_URLS.reduce((chain, src) => {
            const normalizedSrc = String(src || '').split('?')[0];
            return chain.then(() => new Promise((resolve) => {
                if (document.querySelector(`script[src^="${normalizedSrc}"]`)) {
                    resolve();
                    return;
                }
                const script = document.createElement('script');
                script.src = src;
                script.defer = true;
                script.onload = () => resolve();
                script.onerror = () => resolve();
                document.body.appendChild(script);
            }));
        }, Promise.resolve()).then(() => {
            if (typeof ensureLibraryCatalogState === 'function') {
                ensureLibraryCatalogState();
            }
            refreshLibraryCatalogAfterBootstrap();
            syncDeferredLibraryScrollRail();
        });

        return window.__kiuLibraryDeferredScriptsPromise;
    }

    function shouldAutoBootLibraryOnScriptLoad() {
        return !document.body?.classList?.contains('lux-route-library');
    }

    window.ensureSharedLibraryState = ensureSharedLibraryState;
    window.renderSharedLibraryFilters = renderSharedLibraryFilters;
    window.renderSharedLibraryCatalog = renderSharedLibraryCatalog;
    window.renderLibraryPageShellContext = renderLibraryPageShellContext;
    window.renderLibraryPage = renderLibraryPage;
    window.refreshLibraryCatalogAfterBootstrap = refreshLibraryCatalogAfterBootstrap;
    window.loadDeferredLibraryScripts = loadDeferredLibraryScripts;

    if (shouldAutoBootLibraryOnScriptLoad()) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', renderLibraryPage, { once: true });
        } else {
            renderLibraryPage();
        }
    }
})();
