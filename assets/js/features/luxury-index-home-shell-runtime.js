/* Luxury home-shell render/preload helpers. Peeled from index-luxury.js.
 * Load before index-luxury.js. Host installs with mutable deps bag.
 */
(function () {
    if (window.__KIU_LUXURY_INDEX_HOME_SHELL_LOADED) return;
    window.__KIU_LUXURY_INDEX_HOME_SHELL_LOADED = true;
    window.__kiuCreateLuxuryIndexHomeShellApi = function createKiuPeelApi(deps = {}) {
        /* Non-strict with(deps): resolve IIFE locals from mutable bag. */
        with (deps) {

        function homeShellHasLoadingPlaceholder(homeShell = document.getElementById('lux-home-shell')) {
            return Boolean(__luxHomeRuntime?.homeShellHasLoadingPlaceholder?.(homeShell));
        }
        function homeShellHasDashboardContent(homeShell = document.getElementById('lux-home-shell')) {
            return Boolean(__luxHomeRuntime?.homeShellHasDashboardContent?.(homeShell));
        }
        function renderHomeShellRecoveryPanel(homeShell, options = {}) {
            const retryMarkup = 'data-home-dashboard-retry="1"';
            void retryMarkup;
            return __luxHomeRuntime?.renderHomeShellRecoveryPanel?.(homeShell, options);
        }
        function __luxHomeRecoveryPanelContract(homeShell) {
            if (false) renderHomeShellRecoveryPanel(homeShell);
        }
        function renderHomeShell() {
            const homeShell = ensureHomeShell();
            if (!homeShell) return;
            if (!__luxHomeRuntime) return;
            return __luxHomeRuntime.renderHomeShell();
        }
        function scheduleRenderHomeShell() {
            return __luxHomeRuntime?.scheduleRenderHomeShell?.()
                || renderHomeShell();
        }
        function isLuxuryHomeRoute() {
            return getActivePageId() === 'home';
        }
        function scheduleLuxuryHomeDashboardPreload() {
            return __luxHomeRuntime?.scheduleLuxuryHomeDashboardPreload?.()
                || (typeof isIndexPortalShell === 'function' && isIndexPortalShell()
                    ? ensureLuxuryHomeDashboardBundle({ preload: true })
                    : Promise.resolve(false));
        }
        window.__kiuRegisterLuxuryHomeChunk = function registerLuxuryHomeChunk(base64Source) {
            // Runtime register already schedules a post-load render — do not double-call here.
            return __luxHomeRuntime?.registerLuxuryHomeChunk?.(base64Source);
        };
        window.__kiuRegisterLuxuryHomeChunkUrl = function registerLuxuryHomeChunkUrl(url) {
            window.__kiuLuxuryHomeChunkUrl = String(url || '');
            window.__kiuLuxuryHomeChunkBase64 = '';
            if (__luxHomeRuntime && typeof __luxHomeRuntime.registerLuxuryHomeChunkUrl === 'function') {
                // Runtime register already schedules a post-load render.
                return __luxHomeRuntime.registerLuxuryHomeChunkUrl(url);
            }
            return ensureLuxuryHomeDashboardBundle({ preload: true }).then((loaded) => {
                if (loaded && isLuxuryHomeRoute()) renderHomeShell();
            });
        };
        function decodeLuxuryHomeChunkSource(base64Source) {
            return window.__kiuDecodeLuxuryRouteChunkSource?.(base64Source) || '';
        }
        function scheduleLuxuryHomeDashboardChunkRetry() {
            return __luxHomeRuntime?.scheduleLuxuryHomeDashboardChunkRetry?.();
        }
        function ensureLuxuryHomeDashboardBundle(options = {}) {
            const preload = options.preload === true;
            const allowWhileNotHome = options.allowWhileNotHome === true;
            return __luxHomeRuntime?.ensureLuxuryHomeDashboardBundle?.({ ...options, preload, allowWhileNotHome }) || Promise.resolve(false);
        }

        const api = {
            homeShellHasLoadingPlaceholder,
            homeShellHasDashboardContent,
            renderHomeShellRecoveryPanel,
            __luxHomeRecoveryPanelContract,
            renderHomeShell,
            scheduleRenderHomeShell,
            isLuxuryHomeRoute,
            scheduleLuxuryHomeDashboardPreload,
            decodeLuxuryHomeChunkSource,
            scheduleLuxuryHomeDashboardChunkRetry,
            ensureLuxuryHomeDashboardBundle,
        };
        Object.assign(window, api);
        return api;
        }
    };
})();

