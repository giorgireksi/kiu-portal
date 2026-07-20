/* FINDABILITY: news page entry — see docs/findability-index.md#news-entry */
/* News page entry — load after assets/js/pages/news/*.js */
(function initPortalNewsWorkspaceEntry() {
    if (typeof window.renderNewsWorkspace !== 'function' && typeof renderNewsWorkspace === 'function') {
        window.renderNewsWorkspace = renderNewsWorkspace;
    }
    if (typeof window.refreshNewsWorkspace !== 'function') {
        window.refreshNewsWorkspace = function refreshNewsWorkspace() {
            if (typeof bootstrapNewsWorkspace === 'function') bootstrapNewsWorkspace(true);
            else if (typeof window.renderNewsWorkspace === 'function') window.renderNewsWorkspace();
        };
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeNewsWorkspace, { once: true });
    } else {
        initializeNewsWorkspace();
    }
})();
