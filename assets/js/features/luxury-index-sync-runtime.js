/* Luxury index shell sync helpers. Peeled from index-luxury.js.
 * Load before index-luxury.js. Host installs via mutable deps bag + with(deps).
 */
(function () {
    if (window.__KIU_LUXURY_INDEX_SYNC_LOADED) return;
    window.__KIU_LUXURY_INDEX_SYNC_LOADED = true;
    window.__kiuCreateLuxuryIndexSyncApi = function createKiuPeelApi(deps = {}) {
        with (deps) {

        function queueShellSync(args, result) {
            if (result?.navigationSkipped) return;
            if (window.__kiuRoleSwitchRedirectPending || window.__kiuFacultySwitchRedirectPending) return;
            if (queuedShellSyncFrame) return;
            queuedShellSyncFrame = window.requestAnimationFrame(() => {
                queuedShellSyncFrame = null;
                if (window.__kiuRoleSwitchRedirectPending || window.__kiuFacultySwitchRedirectPending) return;
                if (!isIndexPortalShell() && typeof window.refreshStandaloneDesktopRouteShellContext === 'function') {
                    window.refreshStandaloneDesktopRouteShellContext({ rerender: true, refreshActiveRoute: true });
                    return;
                }
                if (isStandaloneLmsRouteActive() && typeof window.refreshStandaloneLmsShellContext === 'function') {
                    window.refreshStandaloneLmsShellContext({ refreshSubjectDeck: false });
                    return;
                }
                if (!isIndexPortalShell() && typeof window.refreshStandaloneDesktopShellChrome === 'function') {
                    window.refreshStandaloneDesktopShellChrome();
                    return;
                }
                syncAll();
                if (isIndexPortalShell() && isLuxNavEmpty()) {
                    rehydrateIndexPortalEntry({ pageId: getActivePageId(), reason: 'shell-sync' });
                }
            });
        }
        function syncLayout() {
            const activePageId = getActivePageId();
            const onExamsRoute = document.body?.classList?.contains('lux-route-exams');
            const onLibraryRoute = document.body?.classList?.contains('lux-route-library');
            if (onExamsRoute) {
                const now = Date.now();
                const lastSyncAt = window.__luxExamsSyncLayoutAt || 0;
                if (now - lastSyncAt < 400) return;
                window.__luxExamsSyncLayoutAt = now;
            }
            if (onLibraryRoute) {
                const now = Date.now();
                const lastSyncAt = window.__luxLibrarySyncLayoutAt || 0;
                if (now - lastSyncAt < 400) return;
                window.__luxLibrarySyncLayoutAt = now;
            }
            if (activePageId === 'home' || !activePageId) {
                renderHomeShell();
            }
            syncTopbar();
            if (activePageId === 'admin-tools') {
                renderLuxuryAdminToolsPage();
            }
            if (activePageId === 'social') {
                if (typeof schedulePublicSocialRenderBoost === 'function') schedulePublicSocialRenderBoost();
            }
            if (activePageId === 'exams') {
                if (getEffectiveRole() !== USER_ROLES.STUDENT && typeof renderAdminExamSection === 'function') {
                    renderAdminExamSection();
                }
            }
            if (!document.body?.classList?.contains('lux-route-lms')) {
                queueHeavySurfaceObservationRefresh();
            }
        }
        function buildTransparencySyncSignature(activePageId, transparencyValue) {
            const visuals = getDashboardVisuals() || {};
            return [
                activePageId || 'home',
                getEffectiveRole(),
                getCurrentFacultyCode(),
                String(transparencyValue || ''),
                visuals.glassBlurQuality
                    || (typeof getGlassBlurQuality === 'function' ? getGlassBlurQuality() : '')
                    || localStorage.getItem('kiuLuxuryGlassBlurQuality')
                    || 'high',
                visuals.themeMode || getThemeMode(),
                visuals.paletteKey || resolvePaletteKey() || '',
                JSON.stringify(visuals.customPalette || {}),
                HOME_EDITOR_STATE.editing && HOME_EDITOR_STATE.role === getEffectiveRole() ? 'editing' : 'view'
            ].join('|');
        }
        function buildPaletteThemeSignature() {
            const visuals = getDashboardVisuals() || {};
            return [
                getThemeMode(),
                visuals.paletteKey || resolvePaletteKey() || '',
                JSON.stringify(visuals.customPalette || {}),
                document.body?.classList?.contains('lux-light-mode') ? 'light' : 'dark',
            ].join('|');
        }
        function buildVisualStateSyncSignature() {
            const visuals = getDashboardVisuals() || {};
            return [
                // Route identity belongs to layout/content sync, not visual
                // preference sync. Switching pages must not repaint the theme.
                getEffectiveRole(),
                getCurrentFacultyCode(),
                visuals.themeMode || getThemeMode(),
                visuals.paletteKey || resolvePaletteKey() || '',
                JSON.stringify(visuals.customPalette || {}),
                visuals.backgroundMode || getBackgroundMode() || '',
                String(visuals.particleMotion ?? getParticleMotion()),
                String(visuals.particleDensity ?? getParticleDensity()),
                String(visuals.particleAmount ?? getParticleAmount()),
                String(visuals.particleSharpness ?? getParticleSharpness()),
                visuals.particleQuality || getParticleQuality() || '',
                visuals.glassBlurQuality
                    || (typeof getGlassBlurQuality === 'function' ? getGlassBlurQuality() : '')
                    || localStorage.getItem('kiuLuxuryGlassBlurQuality')
                    || 'high',
                typeof visuals.backgroundAnimationsEnabled === 'boolean' ? String(visuals.backgroundAnimationsEnabled) : String(areBackgroundAnimationsEnabled()),
                visuals.staticBackgroundFill || getStaticBackgroundFill() || 'colored',
                JSON.stringify(visuals.backgroundGallerySelection || (typeof getBackgroundGallerySelection === 'function' ? getBackgroundGallerySelection() : null) || {}),
                String(visuals.surfaceTransparency ?? localStorage.getItem('kiuLuxurySurfaceTransparency') ?? 70)
            ].join('|');
        }
        function syncAll() {
            const activePageId = getActivePageId();
            const onAdminToolsRoute = document.body?.classList?.contains('lux-route-admin-tools');
            const onLmsRoute = isLuxRouteWorkspace(activePageId, getActiveEntryPageId());
            const onExamsRoute = document.body?.classList?.contains('lux-route-exams');
            const onOrdersRoute = document.body?.classList?.contains('lux-route-orders');
            const onLibraryRoute = document.body?.classList?.contains('lux-route-library');
            if (onAdminToolsRoute) {
                const now = Date.now();
                const lastSyncAt = window.__luxAdminToolsSyncAllAt || 0;
                if (now - lastSyncAt < 400) return;
                window.__luxAdminToolsSyncAllAt = now;
            }
            if (onLmsRoute) {
                const now = Date.now();
                const lastSyncAt = window.__luxLmsSyncAllAt || 0;
                if (now - lastSyncAt < 400) return;
                window.__luxLmsSyncAllAt = now;
            }
            if (onExamsRoute) {
                const now = Date.now();
                const lastSyncAt = window.__luxExamsSyncAllAt || 0;
                if (now - lastSyncAt < 400) return;
                window.__luxExamsSyncAllAt = now;
            }
            if (onOrdersRoute) {
                const now = Date.now();
                const lastSyncAt = window.__luxOrdersSyncAllAt || 0;
                if (now - lastSyncAt < 400) return;
                window.__luxOrdersSyncAllAt = now;
            }
            if (onLibraryRoute) {
                const now = Date.now();
                const lastSyncAt = window.__luxLibrarySyncAllAt || 0;
                if (now - lastSyncAt < 400) return;
                window.__luxLibrarySyncAllAt = now;
            }
            // Visual-half early-out: skip theme/palette/atmosphere/perf when unchanged.
            // Always continue nav/layout; always re-queue transparency after atmosphere/perf.
            const visualSignature = buildVisualStateSyncSignature();
            const visualHalfUnchanged = window.__luxLastVisualStateSyncSignature === visualSignature;
            if (!visualHalfUnchanged) {
                applyThemeMode(getThemeMode(), false);
                applyResolvedPalette();
                applyAtmosphereSettings();
                applyLuxuryPerformanceProfile();
                document.body.dataset.luxBackgroundMode = getBackgroundMode();
                window.__luxLastVisualStateSyncSignature = visualSignature;
            }
            applyPortalPageState();
            closePickerPanels();
            renderNav();
            populateFacultySwitcher();
            syncLayout();
            syncStudioUi();
            if (
                !visualHalfUnchanged
                && !onAdminToolsRoute
                && !onLmsRoute
                && !onExamsRoute
                && !onOrdersRoute
                && !onLibraryRoute
            ) {
                queueLegacyVisualRefresh(document.querySelector('.page-section.active-page') || document.body);
            }
            if (onLmsRoute && typeof window.ensureLmsRouteVisualState === 'function') {
                window.ensureLmsRouteVisualState();
            }
            if (isAdminLibraryRouteContext(activePageId, getActiveEntryPageId()) && typeof window.ensureAdminLibraryRouteVisualState === 'function') {
                window.ensureAdminLibraryRouteVisualState();
            }
            /* Always queue transparency so root tokens stay current; skip surface walk when
               visual + transparency signatures are unchanged (atmosphere stomp guard below). */
            if (typeof window.queueLuxuryTransparencyRefresh === 'function') {
                var _syncTransVal = getDashboardVisuals().surfaceTransparency
                    || localStorage.getItem('kiuLuxurySurfaceTransparency')
                    || DEFAULT_HOME_VISUALS.surfaceTransparency;
                if (_syncTransVal != null && _syncTransVal !== '') {
                    var _syncTransparencySignature = buildTransparencySyncSignature(activePageId, _syncTransVal);
                    var _transparencyUnchanged = window.__luxLastTransparencySyncSignature === _syncTransparencySignature;
                    window.__luxLastTransparencySyncSignature = _syncTransparencySignature;
                    var _transRefreshOptions = { persist: false };
                    if (visualHalfUnchanged && _transparencyUnchanged) {
                        _transRefreshOptions.tokensOnly = true;
                    }
                    window.queueLuxuryTransparencyRefresh(parseInt(_syncTransVal, 10), _transRefreshOptions);
                }
            }
        }
        function syncVisualStateOnly() {
            const onOrdersRoute = document.body?.classList?.contains('lux-route-orders');
            const visualSignature = buildVisualStateSyncSignature();
            if (window.__luxLastVisualStateSyncSignature === visualSignature) {
                return;
            }
            window.__luxLastVisualStateSyncSignature = visualSignature;
            applyThemeMode(getThemeMode(), false);
            applyResolvedPalette();
            applyAtmosphereSettings();
            applyLuxuryPerformanceProfile();
            document.body.dataset.luxBackgroundMode = getBackgroundMode();
            syncStudioUi();
            if (!isLuxRouteWorkspace() && !onOrdersRoute) {
                queueLegacyVisualRefresh(document.querySelector('.page-section.active-page') || document.body);
            }
            if (typeof window.queueLuxuryTransparencyRefresh === 'function') {
                const transparencyValue = getDashboardVisuals().surfaceTransparency
                    || localStorage.getItem('kiuLuxurySurfaceTransparency')
                    || DEFAULT_HOME_VISUALS.surfaceTransparency;
                if (transparencyValue != null && transparencyValue !== '') {
                    window.queueLuxuryTransparencyRefresh(parseInt(transparencyValue, 10), { persist: false });
                }
            }
            if (typeof window.__kiuApplyLmsParticleTheme === 'function') {
                const paletteThemeSignature = buildPaletteThemeSignature();
                if (window.__luxLastParticleThemePaletteSignature !== paletteThemeSignature) {
                    window.__luxLastParticleThemePaletteSignature = paletteThemeSignature;
                    window.__kiuApplyLmsParticleTheme();
                }
            }
            if (onOrdersRoute) {
                scheduleOrdersRouteBackgroundRefresh();
            } else {
                const backgroundMode = typeof getBackgroundMode === 'function'
                    ? getBackgroundMode()
                    : String(document.body?.dataset?.luxBackgroundMode || '').trim().toLowerCase();
                if (backgroundMode === 'fog') {
                    if (typeof window.__kiuRefreshLuxuryVantaFogBackground === 'function') {
                        window.__kiuRefreshLuxuryVantaFogBackground();
                    } else if (typeof window.__kiuApplyLmsFogTheme === 'function') {
                        window.__kiuApplyLmsFogTheme();
                    }
                }
            }
            if (isLuxRouteWorkspace() && typeof window.ensureLmsRouteVisualState === 'function') {
                window.ensureLmsRouteVisualState();
            }
        }

        const api = {
            queueShellSync,
            syncLayout,
            buildTransparencySyncSignature,
            buildVisualStateSyncSignature,
            syncAll,
            syncVisualStateOnly,
        };
        Object.assign(window, api);
        return api;
        }
    };
})();

