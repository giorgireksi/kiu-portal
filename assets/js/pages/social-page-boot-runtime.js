/* Social page busy/bind/boot helpers. Peeled from social-page.js.
 * Load before social-page.js.
 */
(function () {
    if (window.__KIU_SOCIAL_PAGE_BOOT_LOADED && typeof window.__kiuCreateSocialPageBootApi === 'function') return;
    window.__kiuCreateSocialPageBootApi = function createKiuPeelApi(deps = {}) {
        with (deps) {

        async function withBusy(action) {
            try {
                await action();
            } catch (error) {
                const message = error?.message || 'Action failed.';
                if (typeof setPortalSocialFlash === 'function') setPortalSocialFlash(message, 'danger');
                if (typeof window.patchSocialFlash === 'function') window.patchSocialFlash();
                if (!error?.userFacing) console.error('[Social] Action failed:', error);
            }
        }

        /** Shared lazy-domain router for click/submit/input/change. */
        /* Fill feed-runtime deps bag (same object passed to factory) */
        Object.assign(window.__kiuSocialPageFeedDeps || {}, {
            accountSubtitle, activeDialog, activeNavPanels, avatar, buildProjectCreateContext,
            buildProjectHealthPlanPickModel, clearProjectTabPaneCache, clearSurveyFlowState,
            createSocialLazyStub, currentUser, currentUserId, displayName,
            ensureSocialAlertsModule, ensureSocialCommunityModule, ensureSocialFeedModule,
            ensureSocialGroupsModule, ensureSocialLostFoundModule, ensureSocialMessagesModule,
            ensureSocialPagesModule, ensureSocialPhotographyModule, ensureSocialProfileModule,
            ensureSocialSurveysModule, ensureSocialResearchModule, ensureSocialWorkspaceModule, escape, feedScopeOptions,
            hasSocialAlertsModule, hasSocialCommunityModule, hasSocialFeedModule, hasSocialGroupsModule,
            hasSocialLostFoundModule, hasSocialMessagesModule, hasSocialPagesModule,
            hasSocialPhotographyModule, hasSocialSurveysModule, hasSocialResearchModule, hasSocialWorkspaceModule,
            listAttachableEntities, normalizeComposerEntityLinks, normalizeProjectTaskStatusId,
            openDialog, photographyPosts, portfolioEntriesForViewer, postEntityLinks,
            queueDeferredModuleRender, renderFileChip, renderPostComposeAttachResultsHtml,
            renderPostComposeShareSection, renderProjectHealthPlanCardHtml,
            renderProjectHealthPlanPickBodyHtml, renderSocialPageNow, resolveEntityLinkMeta,
            root, setPanel, state, text, findSocialGroupById, withBusy,
            setWorkspaceNavCollapsed, closeSocialWorkspaceNavAnimated, navigateToEntity
        });

        // Shell panel-nav + domain router: social-shell-nav.js
        const __shellNav = (typeof window.createKiuSocialShellNavApi === 'function'
            ? window.createKiuSocialShellNavApi({
                text, state, setPanel, invalidateSocialRenderCache, renderSocialPageNow, withBusy,
                pruneExpiredLostFoundItems, refreshPhotographyPanelStage, refreshPortalSocialFeed, currentUserId, activeDialog,
                shouldRestoreStackedDialog, restorePreviousDialog, closeDialog, closeSocialWorkspaceNavAnimated,
                setWorkspaceNavCollapsed, root, findSocialGroupById, openDialog,
                navigateToEntity: typeof window.navigateToEntity === 'function' ? window.navigateToEntity : () => {},
                queueDeferredModuleRender,
                hasSocialWorkspaceModule, ensureSocialWorkspaceModule, hasSocialGroupsModule, ensureSocialGroupsModule,
                hasSocialPagesModule, ensureSocialPagesModule, hasSocialSurveysModule, ensureSocialSurveysModule,
                hasSocialResearchModule, ensureSocialResearchModule,
                hasSocialPhotographyModule, ensureSocialPhotographyModule, hasSocialEventsModule, ensureSocialEventsModule,
                hasSocialFeedModule, ensureSocialFeedModule, hasSocialLostFoundModule, ensureSocialLostFoundModule,
                hasSocialProfileModule, ensureSocialProfileModule, hasSocialMessagesModule, ensureSocialMessagesModule,
                hasSocialAlertsModule, ensureSocialAlertsModule, hasSocialCommunityModule, ensureSocialCommunityModule
            })
            : null);
        const routeSocialDomain = __shellNav?.routeSocialDomain || (() => ({ matched: false }));
        const handleShellNavClick = __shellNav?.handleShellNavClick || (() => ({ handled: false }));
        const __socialClickDomainRoutes = __shellNav?.buildClickDomainRoutes?.() || [];

        // Page DOM event handlers: social-page-events.js
        const __pageEvents = (typeof window.createKiuSocialPageEventsApi === 'function'
            ? window.createKiuSocialPageEventsApi({
                text, state, root, socialInteractionContains, routeSocialDomain, handleShellNavClick,
                clickDomainRoutes: __socialClickDomainRoutes, syncCommentDraftFromTarget,
                rippleSurveySubmitButton,
                rippleSurveyChoiceLabel,
                closeDialog, closeSocialWorkspaceNavAnimated, renderSocialPageNow,
                restorePreviousDialog, shouldRestoreStackedDialog,
                revealShell,
                flashSocialError: (message) => {
                    if (typeof setPortalSocialFlash === 'function') setPortalSocialFlash(message, 'danger');
                },
                applyPhotographyUploadFile: (...args) => {
                    const fn = typeof window.applyPhotographyUploadFile === 'function'
                        ? window.applyPhotographyUploadFile
                        : null;
                    if (fn) return fn(...args);
                },
                hasSocialFeedModule, ensureSocialFeedModule, hasSocialWorkspaceModule, ensureSocialWorkspaceModule,
                hasSocialGroupsModule, ensureSocialGroupsModule, hasSocialPagesModule, ensureSocialPagesModule,
                hasSocialEventsModule, ensureSocialEventsModule, hasSocialSurveysModule, ensureSocialSurveysModule,
                hasSocialResearchModule, ensureSocialResearchModule,
                hasSocialPhotographyModule, ensureSocialPhotographyModule, hasSocialLostFoundModule, ensureSocialLostFoundModule,
                hasSocialMessagesModule, ensureSocialMessagesModule, hasSocialProfileModule, ensureSocialProfileModule,
                hasSocialAlertsModule, ensureSocialAlertsModule, hasSocialCommunityModule, ensureSocialCommunityModule
            })
            : null);
        const handleClick = __pageEvents?.handleClick || (async () => {});
        const handleSubmit = __pageEvents?.handleSubmit || (async () => {});
        const handleInput = __pageEvents?.handleInput || (() => {});
        const handleChange = __pageEvents?.handleChange || (() => {});
        const handlePointerDown = __pageEvents?.handlePointerDown || (() => {});
        const handleGlobalKeydown = __pageEvents?.handleGlobalKeydown || (() => {});
        const handleSocialFileImageError = __pageEvents?.handleSocialFileImageError || (() => {});
        const bindPhotographyUploadPortalEvents = __pageEvents?.bindPhotographyUploadPortalEvents || (() => {});

        /** Common panel tab switch: set ui key, setPanel, invalidate. Caller keeps render reason literals for source-locks. */

        let portalEventAbort = null;
        let overlayCaptureClickBound = false;
        let overlayCaptureChangeBound = false;
        let overlayCaptureErrorBound = false;

        function hostEventState() {
            return (eventBinding && typeof eventBinding === 'object')
                ? eventBinding
                : { bound: Boolean(bound), boundHost: boundHost || null, hostEventAbort: hostEventAbort || null };
        }

        function bindOverlayCaptureClick() {
            if (overlayCaptureClickBound) return;
            document.addEventListener('click', (event) => {
                const portal = document.getElementById(SOCIAL_OVERLAY_PORTAL_ID);
                const callOverlay = document.getElementById('social-neo-call-overlay');
                const fromPortal = Boolean(
                    portal
                    && portal.contains(event.target)
                    && portal.querySelector(SOCIAL_OVERLAY_SURFACE_SELECTOR)
                );
                const fromCallOverlay = Boolean(
                    callOverlay
                    && callOverlay.contains(event.target)
                    && callOverlay.classList.contains('is-open')
                );
                if (!fromPortal && !fromCallOverlay) return;
                handleClick(event);
            }, { capture: true });
            overlayCaptureClickBound = true;
        }
        function bindOverlayCaptureChange() {
            if (overlayCaptureChangeBound) return;
            document.addEventListener('change', (event) => {
                const portal = document.getElementById(SOCIAL_OVERLAY_PORTAL_ID);
                if (!portal || !portal.contains(event.target)) return;
                if (!portal.querySelector(SOCIAL_OVERLAY_SURFACE_SELECTOR)) return;
                handleChange(event);
            }, { capture: true });
            overlayCaptureChangeBound = true;
        }
        function bindOverlayCaptureError() {
            if (overlayCaptureErrorBound) return;
            document.addEventListener('error', handleSocialFileImageError, true);
            overlayCaptureErrorBound = true;
        }
        function bindOverlayPortalEvents() {
            const portal = document.getElementById(SOCIAL_OVERLAY_PORTAL_ID);
            if (!portal) return;
            if (portalEventAbort) {
                portalEventAbort.abort();
                portalEventAbort = null;
            }
            portalEventAbort = new AbortController();
            const portalSignal = portalEventAbort.signal;
            portal.addEventListener('click', handleClick, { signal: portalSignal });
            portal.addEventListener('pointerdown', handlePointerDown, { signal: portalSignal });
            portal.addEventListener('submit', handleSubmit, { signal: portalSignal });
            portal.addEventListener('input', handleInput, { signal: portalSignal });
            portal.addEventListener('change', handleChange, { signal: portalSignal });
            bindPhotographyUploadPortalEvents(portal, portalSignal);
            portal.dataset.kiuOverlayEventsBound = '1';
        }
        function bindEvents() {
            const host = root();
            if (!host) return;
            const binding = hostEventState();
            ensureSocialOverlayPortal();
            ensurePhotographyUploadFileSink();
            bindOverlayCaptureClick();
            bindOverlayCaptureChange();
            bindOverlayCaptureError();
            bindOverlayPortalEvents();
            if (binding.bound && binding.boundHost === host) {
                return;
            }
            if (binding.hostEventAbort) {
                binding.hostEventAbort.abort();
                binding.hostEventAbort = null;
            }
            binding.hostEventAbort = new AbortController();
            const { signal } = binding.hostEventAbort;
            host.addEventListener('click', handleClick, { signal });
            host.addEventListener('pointerdown', handlePointerDown, { signal });
            host.addEventListener('submit', handleSubmit, { signal });
            host.addEventListener('input', handleInput, { signal });
            host.addEventListener('change', handleChange, { signal });
            host.addEventListener('error', handleSocialFileImageError, { signal, capture: true });
            if (!globalKeydownBound) {
                document.addEventListener('keydown', handleGlobalKeydown);
                globalKeydownBound = true;
            }
            if (!scrollLockMediaBound) {
                const media = socialScrollLockMedia();
                const onScrollLockChange = () => {
                    const wasLocked = socialScrollLockActive();
                    const hostNode = root();
                    syncSocialScrollLayout(hostNode);
                    migrateSocialScrollOnLockChange(wasLocked, hostNode);
                };
                if (typeof media?.addEventListener === 'function') {
                    media.addEventListener('change', onScrollLockChange);
                } else if (typeof media?.addListener === 'function') {
                    media.addListener(onScrollLockChange);
                }
                scrollLockMediaBound = true;
            }
            if (!socialVisualViewportBound && window.visualViewport) {
                const onVisualViewportChange = () => {
                    const hostNode = root();
                    if (!socialScrollLockActive()) return;
                    syncSocialVisualViewport();
                    ensureSocialCenterScrollBounds(hostNode);
                };
                window.visualViewport.addEventListener('resize', onVisualViewportChange);
                window.visualViewport.addEventListener('scroll', onVisualViewportChange);
                socialVisualViewportBound = true;
            }
            bindSocialCenterWheelForward();
            syncSocialScrollLayout(host);
            binding.boundHost = host;
            binding.bound = true;
        }
        function renderOrRetry() {
            renderAttemptCount += 1;
            if (typeof getPortalSocialRuntimeState !== 'function') {
                if (renderAttemptCount < MAX_RENDER_ATTEMPTS) {
                    window.requestAnimationFrame(renderOrRetry);
                } else {
                    revealShell();
                }
                return;
            }
            renderSocialPageNow('boot');
            if (typeof initPalette === 'function') {
                try { initPalette(); } catch (error) {}
            }
        }
        async function warnIfPinApiUnavailable() {
            const pinModel = window.KiuSocialPinModel;
            const checkHealth = pinModel?.checkPinApiHealth;
            if (typeof checkHealth !== 'function') return;
            const health = await checkHealth();
            if (health.ok) {
                pinModel.setPinApiUnavailable(false);
                return;
            }
            pinModel.setPinApiUnavailable(true);
            const message = pinModel.PIN_API_UNAVAILABLE_MESSAGE
                || 'Pin API unavailable — restart platform backend (npm run stop:local && npm run start:local).';
            if (typeof setPortalSocialFlash === 'function') setPortalSocialFlash(message, 'danger');
            if (typeof renderSocialPageNow === 'function') renderSocialPageNow('pin-api-health');
        }
        function waitForSocialInitialPaint() {
            return new Promise((resolve) => {
                if (typeof window.requestAnimationFrame === 'function') {
                    window.requestAnimationFrame(() => resolve());
                } else {
                    window.setTimeout(resolve, 0);
                }
            });
        }

        function ensureActivePanelModule(panel) {
            const id = text(panel || 'feed') || 'feed';
            const ensureByPanel = {
                feed: ensureSocialFeedModule,
                community: ensureSocialCommunityModule,
                groups: ensureSocialGroupsModule,
                workspace: ensureSocialWorkspaceModule,
                projects: ensureSocialWorkspaceModule,
                research: ensureSocialResearchModule,
                pages: ensureSocialPagesModule,
                events: ensureSocialEventsModule,
                'lost-and-found': ensureSocialLostFoundModule,
                messages: ensureSocialMessagesModule,
                alerts: ensureSocialAlertsModule,
                surveys: ensureSocialSurveysModule,
                photography: ensureSocialPhotographyModule,
                profile: ensureSocialProfileModule
            };
            const ensure = ensureByPanel[id];
            return typeof ensure === 'function'
                ? Promise.resolve(ensure()).catch(() => null)
                : Promise.resolve(null);
        }
        async function boot() {
            ensureSocialRouteHost();
            bindEvents();
            guardStandaloneSocialRoute();
            window.__kiuSocialLiteRenderPage = renderSocialPageNow;
            window.__kiuSocialPageHandleClick = handleClick;
            window.__kiuSocialPatchPostReactions = patchPostReactions;
            window.__kiuSocialPatchCommentReactions = patchCommentReactionsByIds;
            window.__kiuSocialPatchEventRsvp = patchEventRsvpButtons;
            // Render the shell without allowing lazy panel stubs to start their
            // entire module graph before the browser gets its first paint.
            window.__KIU_SOCIAL_LAZY_MODULES_DEFERRED = true;
            try {
                renderOrRetry();
            } finally {
                window.__KIU_SOCIAL_LAZY_MODULES_DEFERRED = false;
            }
            await waitForSocialInitialPaint();

            const runHydrate = typeof ensurePortalSocialRuntimeLoaded === 'function'
                ? () => Promise.resolve(ensurePortalSocialRuntimeLoaded()).catch(() => null)
                : typeof hydratePortalSocialRuntime === 'function'
                    ? () => Promise.resolve(hydratePortalSocialRuntime()).catch(() => null)
                    : null;

            const activePanel = text(state()?.ui?.activePanel || 'feed') || 'feed';

            // Background non-blocking hydration and maintenance tasks
            Promise.allSettled([
                runHydrate ? Promise.race([
                    Promise.resolve(runHydrate()),
                    new Promise((_, reject) => window.setTimeout(() => reject(new Error('Social state hydration timed out.')), 1800))
                ]) : Promise.resolve(),
                Promise.race([
                    Promise.resolve(ensureActivePanelModule(activePanel)),
                    new Promise((_, reject) => window.setTimeout(() => reject(new Error(`Social ${activePanel} startup timed out.`)), 800))
                ])
            ]).then(() => {
                if (typeof renderSocialPageNow === 'function') {
                    renderSocialPageNow('hydrate-ready');
                }
                warnIfPinApiUnavailable().catch(() => null);
                pruneExpiredLostFoundItems().catch(() => null);
            }).catch(() => null);
        }

        const api = {
            withBusy,
            bindOverlayCaptureClick,
            bindOverlayCaptureChange,
            bindOverlayPortalEvents,
            bindEvents,
            renderOrRetry,
            boot,
        };
        Object.assign(window, api);
        return api;
        }
    };
    window.__KIU_SOCIAL_PAGE_BOOT_LOADED = true;
})();

