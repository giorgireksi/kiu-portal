/* Social page reactions/photography/portfolio/pages patches + renderSocialPageNow.
 * Load before social-page.js.
 */
(function initSocialPageInteractionsRuntime() {
    'use strict';
    if (window.__KIU_SOCIAL_PAGE_INTERACTIONS_LOADED) return;
    window.__KIU_SOCIAL_PAGE_INTERACTIONS_LOADED = true;

    window.__kiuCreateSocialPageInteractionsApi = function createKiuPeelApi(deps) {
        const d = deps || {};
        function __dep(name) {
            return function (...a) {
                const fn = d[name] || window[name];
                if (typeof fn !== 'function') throw new Error('Missing dep: ' + name);
                return fn.apply(this, a);
            };
        }
        /* Mutable deps bag: callers Object.assign(d, {...}) before/after install. */
        const __lookup = (name, fallback) => {
            if (typeof d[name] === 'function') return d[name];
            if (typeof window[name] === 'function') return window[name];
            if (typeof fallback === 'function') return fallback;
            return function missingDep() {
                throw new Error('Missing social interactions dep: ' + name);
            };
        };
        // Proxy common free vars via deps bag (filled by host install).
        function text(...a) { return __lookup('text')(...a); }
        function state(...a) { return __lookup('state')(...a); }
        function root(...a) { return __lookup('root')(...a); }
        function escape(...a) { return __lookup('escape', __lookup('escapeHtml'))(...a); }
        function currentUser(...a) { return __lookup('currentUser')(...a); }
        function currentUserId(...a) { return __lookup('currentUserId')(...a); }
        function portalRequest(...a) { return __lookup('portalRequest')(...a); }
        function hydrateRuntime(...a) { return __lookup('hydrateRuntime')(...a); }
        function setFlash(...a) { return __lookup('setFlash')(...a); }
        function queueRender(...a) { return __lookup('queueRender')(...a); }
        function loadSocialState(...a) { return __lookup('loadSocialState')(...a); }
        function mutationRequest(...a) { return __lookup('mutationRequest')(...a); }
        function invalidateSocialRenderCache(...a) { return __lookup('invalidateSocialRenderCache')(...a); }
        function makeId(...a) { return __lookup('makeId')(...a); }
        function nowLabel(...a) { return __lookup('nowLabel')(...a); }
        function readFileAsDataUrl(...a) { return __lookup('readFileAsDataUrl')(...a); }
        function fileUrl(...a) { return __lookup('fileUrl')(...a); }
        function isImage(...a) { return (__lookup('isImage') || __lookup('isImageFile'))(...a); }
        function openDialog(...a) { return __lookup('openDialog')(...a); }
        function closeDialog(...a) { return __lookup('closeDialog')(...a); }
        function setPanel(...a) { return __lookup('setPanel')(...a); }
        function activeDialog(...a) { return __lookup('activeDialog')(...a); }
        function ensureSocialShell(...a) { return __lookup('ensureSocialShell')(...a); }
        function applyShellIdentity(...a) { return __lookup('applyShellIdentity')(...a); }
        function ensureWorkspaceNavCollapsedState(...a) { return __lookup('ensureWorkspaceNavCollapsedState')(...a); }
        function syncWorkspaceNavCollapsedClass(...a) { return __lookup('syncWorkspaceNavCollapsedClass')(...a); }
        function getSocialPanelConfig(...a) {
            return __lookup('getSocialPanelConfig', (window.KiuSocialPanelModel || {}).getSocialPanelConfig)(...a);
        }
        function clearProjectTabPaneCache(...a) { return __lookup('clearProjectTabPaneCache')(...a); }
        function projectTabPaneCacheKey(...a) { return __lookup('projectTabPaneCacheKey')(...a); }
        function isSocialTopbarSkippedPanel(...a) { return __lookup('isSocialTopbarSkippedPanel')(...a); }
        function isSocialCommandSkippedPanel(...a) {
            const fn = __lookup('isSocialCommandSkippedPanel');
            if (typeof fn === 'function') return fn(...a);
            return isSocialTopbarSkippedPanel(...a);
        }
        function syncSocialOverlayLock(...a) { return __lookup('syncSocialOverlayLock')(...a); }
        function resolveSocialRenderPlan(...a) { return __lookup('resolveSocialRenderPlan')(...a); }
        function messageAnchorId(...a) { return __lookup('messageAnchorId')(...a); }
        function buildSocialRenderSignature(...a) { return __lookup('buildSocialRenderSignature')(...a); }
        function isSocialForceRenderReason(...a) { return __lookup('isSocialForceRenderReason')(...a); }
        function mergeFeedPost(...a) { return __lookup('mergeFeedPost')(...a); }
        function cloneFeedPost(...a) { return __lookup('cloneFeedPost')(...a); }
        function findFeedCommentRecord(...a) { return __lookup('findFeedCommentRecord')(...a); }
        function applyOptimisticCommentReaction(...a) { return __lookup('applyOptimisticCommentReaction')(...a); }
        function applyOptimisticPostReaction(...a) { return __lookup('applyOptimisticPostReaction')(...a); }
        function ensureDirectChat(...a) { return __lookup('ensureDirectChat')(...a); }
        function upsertChat(...a) { return __lookup('upsertChat')(...a); }
        function ensureCallRuntime(...a) { return __lookup('ensureCallRuntime')(...a); }
        function dep(name, fallback) {
            return (...args) => __lookup(name, fallback)(...args);
        }
        const createSocialLazyStub = dep('createSocialLazyStub');
        const hasSocialFeedModule = dep('hasSocialFeedModule');
        const ensureSocialFeedModule = dep('ensureSocialFeedModule');
        const hasSocialPhotographyModule = dep('hasSocialPhotographyModule');
        const hasSocialGroupsModule = dep('hasSocialGroupsModule');
        const ensureSocialGroupsModule = dep('ensureSocialGroupsModule');
        const hasSocialPagesModule = dep('hasSocialPagesModule');
        const ensureSocialPagesModule = dep('ensureSocialPagesModule');
        const hasSocialEventsModule = dep('hasSocialEventsModule');
        const ensureSocialEventsModule = dep('ensureSocialEventsModule');
        const hasSocialMessagesModule = dep('hasSocialMessagesModule');
        const ensureSocialMessagesModule = dep('ensureSocialMessagesModule');
        const hasSocialProfileModule = dep('hasSocialProfileModule');
        const ensureSocialProfileModule = dep('ensureSocialProfileModule');
        const hasSocialLostFoundModule = dep('hasSocialLostFoundModule');
        const ensureSocialLostFoundModule = dep('ensureSocialLostFoundModule');
        const hasSocialSurveysModule = dep('hasSocialSurveysModule');
        const ensureSocialSurveysModule = dep('ensureSocialSurveysModule');
        const hasSocialResearchModule = dep('hasSocialResearchModule');
        const ensureSocialResearchModule = dep('ensureSocialResearchModule');
        const hasSocialWorkspaceModule = dep('hasSocialWorkspaceModule');
        const ensureSocialWorkspaceModule = dep('ensureSocialWorkspaceModule');
        const queueDeferredModuleRender = dep('queueDeferredModuleRender');
        const closeSocialWorkspaceNavAnimated = dep('closeSocialWorkspaceNavAnimated');
        const scheduleDirectoryPrefetch = dep('scheduleDirectoryPrefetch');
        const scheduleDeferredDesktopModulePrefetch = dep('scheduleDeferredDesktopModulePrefetch');
        const renderFeedPanel = dep('renderFeedPanel');
        const renderCommunityPanel = dep('renderCommunityPanel');
        const renderGroupsPanel = dep('renderGroupsPanel');
        const renderProjectsWorkspacePanelClassic = dep('renderProjectsWorkspacePanelClassic');
        const renderProjectsPanel = dep('renderProjectsPanel');
        const renderPagesPanel = dep('renderPagesPanel');
        const renderEventsPanel = dep('renderEventsPanel');
        const renderSurveysPanel = dep('renderSurveysPanel');
        const renderResearchPanel = dep('renderResearchPanel');
        const renderPhotographyPanel = dep('renderPhotographyPanel');
        const renderLostFoundPanel = dep('renderLostFoundPanel');
        const renderMessagesPanel = dep('renderMessagesPanel');
        const renderAlertsPanel = dep('renderAlertsPanel');
        const renderProfilePageBody = dep('renderProfilePageBody');
        const renderShellWorkspaceNavReveal = dep('renderShellWorkspaceNavReveal');
        const renderShellWorkspaceNav = dep('renderShellWorkspaceNav');
        const renderShellDrawer = dep('renderShellDrawer');
        const renderMobileTabBar = dep('renderMobileTabBar');
        const renderSocialShortcutsTopNav = dep('renderSocialShortcutsTopNav');
        const isSocialShortcutsTopNavViewport = dep('isSocialShortcutsTopNavViewport');
        const setSocialRegionMarkup = dep('setSocialRegionMarkup');
        const revealShell = dep('revealShell');
        const syncSocialVisualShell = dep('syncSocialVisualShell');
        const captureInteractionState = dep('captureInteractionState');
        const restoreInteractionState = dep('restoreInteractionState');
        const scheduleSocialCenterScrollRepair = dep('scheduleSocialCenterScrollRepair');
        const syncEventDescScrollRails = dep('syncEventDescScrollRails');
        const syncSocialScrollLayout = dep('syncSocialScrollLayout');
        const migrateSocialScrollOnLockChange = dep('migrateSocialScrollOnLockChange');
        const scheduleDeferredWindowScrollRestore = dep('scheduleDeferredWindowScrollRestore');
        const renderWorkspaceOwnedDialog = dep('renderWorkspaceOwnedDialog');
        const bindPhotographyUploadDialogFileInput = dep('bindPhotographyUploadDialogFileInput');
        const syncSurveyResultsDialog = dep('syncSurveyResultsDialog');
        const trySyncProjectTaskGraphStackDialog = dep('trySyncProjectTaskGraphStackDialog');
        const shouldRenderProjectTaskGraphStack = dep('shouldRenderProjectTaskGraphStack');
        const bindProjectTaskGraphDrag = dep('bindProjectTaskGraphDrag');
        const bindProjectTaskGraphResizeObserver = dep('bindProjectTaskGraphResizeObserver');
        const syncOverlayPortalVisibility = dep('syncOverlayPortalVisibility');
        const pruneStaleSocialOverlayState = dep('pruneStaleSocialOverlayState');
        const socialDialogRegion = dep('socialDialogRegion');
        const ensureMyPortfolioDocument = dep('ensureMyPortfolioDocument');
        const portfolioCollectDocumentFromUi = dep('portfolioCollectDocumentFromUi');
        const bindEvents = dep('bindEvents');
        const enhanceSocialAccessibility = dep('enhanceSocialAccessibility');
        const focusCommentComposeInput = dep('focusCommentComposeInput');
        const postKey = (...args) => __lookup('postKey', (window.KiuSocialChromeModel || {}).postKey)(...args);
        const lostFoundItems = dep('lostFoundItems');
        const normalizeLostFoundItem = dep('normalizeLostFoundItem');
        const surveyById = dep('surveyById');
        const runtime = d.runtime || window.__kiuSocialLiteRuntime;
        const PANEL_KEY = d.PANEL_KEY ?? window.PANEL_KEY;
        const CHAT_KEY = d.CHAT_KEY ?? window.CHAT_KEY ?? 'KIU_SOCIAL_ACTIVE_CHAT';
        let renderDebounceTimer = 0;
        const SOCIAL_TAB_SCROLL_RESET_RE = /^(panel|community-tab|pages-tab|groups-tab|events-tab|surveys-tab|research-tab|feed-tab)$/;
        const SOCIAL_SKIP_TRANSPARENCY_REFRESH_RE = /^(feed-tab|community-tab|pages-tab|groups-tab|events-tab|surveys-tab|research-tab|research-input|feed-scope|directory-search|directory-role|post-react|post-save|photography-tab|photography-search-input|photography-follow|photography-view-profile|photography-profile-back|photography-my-profile|photography-my-profile-tab|notification-read|notification-removed|notifications-refresh|chat-read|chat-upsert|message-sent|message-delete|chat-hide|alerts-filter|messages-filter|mobile-nav|workspace-nav-open|workspace-nav-close|workspace-nav-collapse|workspace-nav-expand|connection-|comment-react|comment-reply|comment-post|project-task-)/;
        let socialHomeMotionFrame = 0;
        let socialHomeMotionGeneration = 0;
        let socialCommunityMotionFrame = 0;
        let socialCommunityMotionGeneration = 0;
        let socialGroupsMotionFrame = 0;
        let socialGroupsMotionGeneration = 0;
        let socialProjectsMotionFrame = 0;
        let socialProjectsMotionGeneration = 0;
        let socialPortfolioMotionFrame = 0;
        let socialPortfolioMotionGeneration = 0;
        let socialResearchMotionFrame = 0;
        let socialResearchMotionGeneration = 0;
        let socialPagesMotionFrame = 0;
        let socialPagesMotionGeneration = 0;
        let socialEventsMotionFrame = 0;
        let socialEventsMotionGeneration = 0;
        let socialLostFoundMotionFrame = 0;
        let socialLostFoundMotionGeneration = 0;
        let socialMessagesMotionFrame = 0;
        let socialMessagesMotionGeneration = 0;
        let socialAlertsMotionFrame = 0;
        let socialAlertsMotionGeneration = 0;
        let socialSurveysMotionFrame = 0;
        let socialSurveysMotionGeneration = 0;
        let socialPhotographyMotionFrame = 0;
        let socialPhotographyMotionGeneration = 0;
        void d;

        function abortSocialSectionMotion(motionGlobal) {
            const motion = window[motionGlobal];
            if (motion && typeof motion.abort === 'function') {
                try { motion.abort(); } catch (_error) {}
            }
        }

        function shouldPrehideCenterForAssembly(reason) {
            const r = text(reason || '');
            if (window.__kiuSocialBootAwaitingAssemblyReveal || document.body?.classList.contains('kiu-shell-loading')) return true;
            if (!r) return false;
            if (r === 'boot' || r === 'social-bootstrap' || r === 'panel' || r === 'pin-api-health' || r === 'auth-sync') return true;
            if (/^panel-/.test(r) || /-module$/.test(r)) return true;
            return /^(feed-tab|community-tab|groups-tab|pages-tab|events-tab|surveys-tab|research-tab|photography-tab|portfolio-panel-tab|surveys-lane|survey-take-open|survey-take-close|lost-found-tab|messages-filter|feed-module|community-module|groups-module|pages-module|events-module|surveys-module|research-module|photography-module|messages-module|alerts-module|lost-found-module|workspace-module)$/.test(r);
        }

        const SOCIAL_PANEL_MOTION_GLOBAL_BY_PANEL = Object.freeze({
            feed: '__kiuSocialHomeLoadingMotion',
            community: '__kiuSocialCommunityLoadingMotion',
            groups: '__kiuSocialGroupsLoadingMotion',
            projects: '__kiuSocialProjectsLoadingMotion',
            workspace: '__kiuSocialPortfolioLoadingMotion',
            research: '__kiuSocialResearchLoadingMotion',
            pages: '__kiuSocialPagesLoadingMotion',
            events: '__kiuSocialEventsLoadingMotion',
            'lost-and-found': '__kiuSocialLostFoundLoadingMotion',
            messages: '__kiuSocialMessagesLoadingMotion',
            alerts: '__kiuSocialAlertsLoadingMotion',
            surveys: '__kiuSocialSurveysLoadingMotion',
            photography: '__kiuSocialPhotographyLoadingMotion'
        });
        function shouldAnimateSocialPanelMotion(targetPanel, activePanel, reason, extraCheck = null) {
            const target = text(targetPanel || '').trim();
            const current = text(activePanel || '').trim();
            if (!target || target !== current) return false;
            if (typeof extraCheck === 'function' && extraCheck()) return true;
            if (window.__kiuSocialBootAwaitingAssemblyReveal || document.body?.classList.contains('kiu-shell-loading')) return true;
            const r = text(reason || '');
            if (r === `${target}-module`) {
                const motion = window[SOCIAL_PANEL_MOTION_GLOBAL_BY_PANEL[target]];
                const phase = motion?.getState?.().phase;
                // A module callback can arrive after the panel render already
                // started its flight. Do not remount and replay that same panel.
                if (phase && phase !== 'idle') return false;
            }
            if (r === 'boot' || r === 'social-bootstrap' || r === 'panel' || r === 'pin-api-health' || r === 'auth-sync') return true;
            if (r === `panel-${target}` || r === `${target}-module` || r === `${target}-tab`) return true;
            return shouldPrehideCenterForAssembly(reason);
        }

        function clearSocialCenterAssemblyPrehide() {
            document.body?.classList.remove('social-center-assembly-prehide');
        }

        function releaseSocialBootShellReveal() {
            if (!window.__kiuSocialBootAwaitingAssemblyReveal) return;
            window.__kiuSocialBootAwaitingAssemblyReveal = false;
            clearSocialCenterAssemblyPrehide();
            window.__kiuSocialShellRevealAllowed = true;
            window.__kiuSocialBootForceUnveil = true;
            try { revealShell({ force: true }); } catch (_error) {}
        }

        window.__kiuSocialRevealShellNow = revealShell;

        function queueSocialHomeMotion(center, activePanel, reason) {
            const panel = text(activePanel || '');
            const shouldAnimate = shouldAnimateSocialPanelMotion('feed', activePanel, reason);
            if (!shouldAnimate) {
                if (panel !== 'feed') {
                    abortSocialSectionMotion('__kiuSocialHomeLoadingMotion');
                    socialHomeMotionGeneration += 1;
                    if (socialHomeMotionFrame) {
                        if (typeof window.cancelAnimationFrame === 'function') {
                            window.cancelAnimationFrame(socialHomeMotionFrame);
                        } else {
                            window.clearTimeout(socialHomeMotionFrame);
                        }
                        socialHomeMotionFrame = 0;
                    }
                    document.body?.classList.remove(
                        'social-home-assembly-ready',
                        'social-home-assembly-active'
                    );
                    const centerEl = document.querySelector('#social-neo-center-region');
                    if (centerEl?.dataset) delete centerEl.dataset.socialHomeAssemblyState;
                    document.querySelectorAll('[data-social-home-assembly-root]').forEach((el) => {
                        delete el.dataset.socialHomeAssemblyRoot;
                    });
                }
                return;
            }

            socialHomeMotionGeneration += 1;
            if (socialHomeMotionFrame) {
                if (typeof window.cancelAnimationFrame === 'function') {
                    window.cancelAnimationFrame(socialHomeMotionFrame);
                } else {
                    window.clearTimeout(socialHomeMotionFrame);
                }
                socialHomeMotionFrame = 0;
            }

            const section = center?.firstElementChild;
            if (!section
                || section.matches('.social-neo-card.sn-mat-soft, .social-neo-module-loading, [aria-busy="true"]')
                || section.querySelector('[aria-busy="true"]')) {
                clearSocialCenterAssemblyPrehide();
                return;
            }
            // Start sync in this turn so staging applies before the browser paints
            // the freshly mounted shell (rAF left one visible frame / blank intro).
            const startMotion = window.__kiuStartSocialHomeLoadingMotion;
            if (typeof startMotion !== 'function') {
                const generation = socialHomeMotionGeneration;
                let attempts = 0;
                const run = () => {
                    socialHomeMotionFrame = 0;
                    if (generation !== socialHomeMotionGeneration
                        || text(state().ui?.activePanel || '') !== 'feed'
                        || center?.firstElementChild !== section
                        || !section.isConnected) {
                        return;
                    }
                    const live = window.__kiuStartSocialHomeLoadingMotion;
                    if (typeof live !== 'function') {
                        if (attempts++ >= 24) { releaseSocialBootShellReveal(); return; }
                        socialHomeMotionFrame = typeof window.requestAnimationFrame === 'function'
                            ? window.requestAnimationFrame(run)
                            : window.setTimeout(run, 32);
                        return;
                    }
                    try { live(center, { force: true }); } catch (error) {}
                };
                socialHomeMotionFrame = typeof window.requestAnimationFrame === 'function'
                    ? window.requestAnimationFrame(run)
                    : window.setTimeout(run, 0);
                return;
            }
            try {
                startMotion(center, { force: true });
            } catch (error) {}
        }

        function queueSocialCommunityMotion(center, activePanel, reason) {
            const panel = text(activePanel || '');
            const shouldAnimate = shouldAnimateSocialPanelMotion('community', activePanel, reason);
            if (!shouldAnimate) {
                if (panel !== 'community') {
                    abortSocialSectionMotion('__kiuSocialCommunityLoadingMotion');
                    socialCommunityMotionGeneration += 1;
                    if (socialCommunityMotionFrame) {
                        if (typeof window.cancelAnimationFrame === 'function') {
                            window.cancelAnimationFrame(socialCommunityMotionFrame);
                        } else {
                            window.clearTimeout(socialCommunityMotionFrame);
                        }
                        socialCommunityMotionFrame = 0;
                    }
                    document.body?.classList.remove(
                        'social-community-assembly-ready',
                        'social-community-assembly-active'
                    );
                    const centerEl = document.querySelector('#social-neo-center-region');
                    if (centerEl?.dataset) delete centerEl.dataset.socialCommunityAssemblyState;
                    document.querySelectorAll('[data-social-community-assembly-root]').forEach((el) => {
                        delete el.dataset.socialCommunityAssemblyRoot;
                    });
                }
                return;
            }

            socialCommunityMotionGeneration += 1;
            if (socialCommunityMotionFrame) {
                if (typeof window.cancelAnimationFrame === 'function') {
                    window.cancelAnimationFrame(socialCommunityMotionFrame);
                } else {
                    window.clearTimeout(socialCommunityMotionFrame);
                }
                socialCommunityMotionFrame = 0;
            }

            const section = center?.firstElementChild;
            if (!section
                || section.matches('.social-neo-module-loading, [aria-busy="true"]')
                || section.querySelector('[aria-busy="true"]')) {
                clearSocialCenterAssemblyPrehide();
                return;
            }
            // Start sync in this turn so staging applies before the browser paints
            // the freshly mounted shell (rAF left one visible frame / blank intro).
            const startMotion = window.__kiuStartSocialCommunityLoadingMotion;
            if (typeof startMotion !== 'function') {
                const generation = socialCommunityMotionGeneration;
                let attempts = 0;
                const run = () => {
                    socialCommunityMotionFrame = 0;
                    if (generation !== socialCommunityMotionGeneration
                        || text(state().ui?.activePanel || '') !== 'community'
                        || center?.firstElementChild !== section
                        || !section.isConnected) {
                        return;
                    }
                    const live = window.__kiuStartSocialCommunityLoadingMotion;
                    if (typeof live !== 'function') {
                        if (attempts++ >= 24) { releaseSocialBootShellReveal(); return; }
                        socialCommunityMotionFrame = typeof window.requestAnimationFrame === 'function'
                            ? window.requestAnimationFrame(run)
                            : window.setTimeout(run, 32);
                        return;
                    }
                    try { live(center, { force: true }); } catch (error) {}
                };
                socialCommunityMotionFrame = typeof window.requestAnimationFrame === 'function'
                    ? window.requestAnimationFrame(run)
                    : window.setTimeout(run, 0);
                return;
            }
            try {
                startMotion(center, { force: true });
            } catch (error) {}
        }

        function queueSocialGroupsMotion(center, activePanel, reason) {
            const panel = text(activePanel || '');
            const shouldAnimate = shouldAnimateSocialPanelMotion('groups', activePanel, reason);
            if (!shouldAnimate) {
                if (panel !== 'groups') {
                    abortSocialSectionMotion('__kiuSocialGroupsLoadingMotion');
                    socialGroupsMotionGeneration += 1;
                    if (socialGroupsMotionFrame) {
                        if (typeof window.cancelAnimationFrame === 'function') {
                            window.cancelAnimationFrame(socialGroupsMotionFrame);
                        } else {
                            window.clearTimeout(socialGroupsMotionFrame);
                        }
                        socialGroupsMotionFrame = 0;
                    }
                    document.body?.classList.remove(
                        'social-groups-assembly-ready',
                        'social-groups-assembly-active'
                    );
                    const centerEl = document.querySelector('#social-neo-center-region');
                    if (centerEl?.dataset) delete centerEl.dataset.socialGroupsAssemblyState;
                    document.querySelectorAll('[data-social-groups-assembly-root]').forEach((el) => {
                        delete el.dataset.socialGroupsAssemblyRoot;
                    });
                }
                return;
            }

            socialGroupsMotionGeneration += 1;
            if (socialGroupsMotionFrame) {
                if (typeof window.cancelAnimationFrame === 'function') {
                    window.cancelAnimationFrame(socialGroupsMotionFrame);
                } else {
                    window.clearTimeout(socialGroupsMotionFrame);
                }
                socialGroupsMotionFrame = 0;
            }

            const section = center?.firstElementChild;
            if (!section
                || section.matches('.social-neo-module-loading, [aria-busy="true"]')
                || section.querySelector('[aria-busy="true"]')) {
                clearSocialCenterAssemblyPrehide();
                return;
            }
            // Start sync in this turn so staging applies before the browser paints
            // the freshly mounted shell (rAF left one visible frame / blank intro).
            const startMotion = window.__kiuStartSocialGroupsLoadingMotion;
            if (typeof startMotion !== 'function') {
                const generation = socialGroupsMotionGeneration;
                let attempts = 0;
                const run = () => {
                    socialGroupsMotionFrame = 0;
                    if (generation !== socialGroupsMotionGeneration
                        || text(state().ui?.activePanel || '') !== 'groups'
                        || center?.firstElementChild !== section
                        || !section.isConnected) {
                        return;
                    }
                    const live = window.__kiuStartSocialGroupsLoadingMotion;
                    if (typeof live !== 'function') {
                        if (attempts++ >= 24) { releaseSocialBootShellReveal(); return; }
                        socialGroupsMotionFrame = typeof window.requestAnimationFrame === 'function'
                            ? window.requestAnimationFrame(run)
                            : window.setTimeout(run, 32);
                        return;
                    }
                    try { live(center, { force: true }); } catch (error) {}
                };
                socialGroupsMotionFrame = typeof window.requestAnimationFrame === 'function'
                    ? window.requestAnimationFrame(run)
                    : window.setTimeout(run, 0);
                return;
            }
            try {
                startMotion(center, { force: true });
            } catch (error) {}
        }

        function queueSocialProjectsMotion(center, activePanel, reason) {
            const panel = text(activePanel || '');
            const shouldAnimate = shouldAnimateSocialPanelMotion('workspace', activePanel, reason);
            if (!shouldAnimate) {
                if (panel !== 'workspace') {
                    abortSocialSectionMotion('__kiuSocialProjectsLoadingMotion');
                    socialProjectsMotionGeneration += 1;
                    if (socialProjectsMotionFrame) {
                        if (typeof window.cancelAnimationFrame === 'function') {
                            window.cancelAnimationFrame(socialProjectsMotionFrame);
                        } else {
                            window.clearTimeout(socialProjectsMotionFrame);
                        }
                        socialProjectsMotionFrame = 0;
                    }
                    document.body?.classList.remove(
                        'social-projects-assembly-ready',
                        'social-projects-assembly-active'
                    );
                    const centerEl = document.querySelector('#social-neo-center-region');
                    if (centerEl?.dataset) delete centerEl.dataset.socialProjectsAssemblyState;
                    document.querySelectorAll('[data-social-projects-assembly-root]').forEach((el) => {
                        delete el.dataset.socialProjectsAssemblyRoot;
                    });
                }
                return;
            }

            socialProjectsMotionGeneration += 1;
            if (socialProjectsMotionFrame) {
                if (typeof window.cancelAnimationFrame === 'function') {
                    window.cancelAnimationFrame(socialProjectsMotionFrame);
                } else {
                    window.clearTimeout(socialProjectsMotionFrame);
                }
                socialProjectsMotionFrame = 0;
            }

            const section = center?.firstElementChild;
            if (!section
                || section.matches('.social-neo-module-loading, [aria-busy="true"]')
                || section.querySelector('[aria-busy="true"]')
                || (section.matches('.social-neo-card') && section.querySelector('.social-neo-empty-hero'))) {
                clearSocialCenterAssemblyPrehide();
                return;
            }
            // Start sync in this turn so staging applies before the browser paints
            // the freshly mounted shell (rAF left one visible frame / blank intro).
            const startMotion = window.__kiuStartSocialProjectsLoadingMotion;
            if (typeof startMotion !== 'function') {
                const generation = socialProjectsMotionGeneration;
                let attempts = 0;
                const run = () => {
                    socialProjectsMotionFrame = 0;
                    if (generation !== socialProjectsMotionGeneration
                        || text(state().ui?.activePanel || '') !== 'workspace'
                        || center?.firstElementChild !== section
                        || !section.isConnected) {
                        return;
                    }
                    const live = window.__kiuStartSocialProjectsLoadingMotion;
                    if (typeof live !== 'function') {
                        if (attempts++ >= 24) { releaseSocialBootShellReveal(); return; }
                        socialProjectsMotionFrame = typeof window.requestAnimationFrame === 'function'
                            ? window.requestAnimationFrame(run)
                            : window.setTimeout(run, 32);
                        return;
                    }
                    try { live(center, { force: true }); } catch (error) {}
                };
                socialProjectsMotionFrame = typeof window.requestAnimationFrame === 'function'
                    ? window.requestAnimationFrame(run)
                    : window.setTimeout(run, 0);
                return;
            }
            try {
                startMotion(center, { force: true });
            } catch (error) {}
        }

        function queueSocialPortfolioMotion(center, activePanel, reason) {
            const panel = text(activePanel || '');
            const shouldAnimate = shouldAnimateSocialPanelMotion('projects', activePanel, reason);
            if (!shouldAnimate) {
                if (panel !== 'projects') {
                    abortSocialSectionMotion('__kiuSocialPortfolioLoadingMotion');
                    socialPortfolioMotionGeneration += 1;
                    if (socialPortfolioMotionFrame) {
                        if (typeof window.cancelAnimationFrame === 'function') {
                            window.cancelAnimationFrame(socialPortfolioMotionFrame);
                        } else {
                            window.clearTimeout(socialPortfolioMotionFrame);
                        }
                        socialPortfolioMotionFrame = 0;
                    }
                    document.body?.classList.remove(
                        'social-portfolio-assembly-ready',
                        'social-portfolio-assembly-active'
                    );
                    const centerEl = document.querySelector('#social-neo-center-region');
                    if (centerEl?.dataset) delete centerEl.dataset.socialPortfolioAssemblyState;
                    document.querySelectorAll('[data-social-portfolio-assembly-root]').forEach((el) => {
                        delete el.dataset.socialPortfolioAssemblyRoot;
                    });
                }
                return;
            }

            socialPortfolioMotionGeneration += 1;
            if (socialPortfolioMotionFrame) {
                if (typeof window.cancelAnimationFrame === 'function') {
                    window.cancelAnimationFrame(socialPortfolioMotionFrame);
                } else {
                    window.clearTimeout(socialPortfolioMotionFrame);
                }
                socialPortfolioMotionFrame = 0;
            }

            const section = center?.firstElementChild;
            if (!section
                || section.matches('.social-neo-module-loading, [aria-busy="true"]')
                || section.querySelector('[aria-busy="true"]')
                || (section.matches('.social-neo-card') && section.querySelector('.social-neo-empty-hero'))) {
                clearSocialCenterAssemblyPrehide();
                return;
            }
            // Start sync in this turn so staging applies before the browser paints
            // the freshly mounted shell (rAF left one visible frame / blank intro).
            const startMotion = window.__kiuStartSocialPortfolioLoadingMotion;
            if (typeof startMotion !== 'function') {
                const generation = socialPortfolioMotionGeneration;
                let attempts = 0;
                const run = () => {
                    socialProjectsMotionFrame = 0;
                    if (generation !== socialPortfolioMotionGeneration
                        || text(state().ui?.activePanel || '') !== 'projects'
                        || center?.firstElementChild !== section
                        || !section.isConnected) {
                        return;
                    }
                    const live = window.__kiuStartSocialPortfolioLoadingMotion;
                    if (typeof live !== 'function') {
                        if (attempts++ >= 24) { releaseSocialBootShellReveal(); return; }
                        socialPortfolioMotionFrame = typeof window.requestAnimationFrame === 'function'
                            ? window.requestAnimationFrame(run)
                            : window.setTimeout(run, 32);
                        return;
                    }
                    try { live(center, { force: true }); } catch (error) {}
                };
                socialPortfolioMotionFrame = typeof window.requestAnimationFrame === 'function'
                    ? window.requestAnimationFrame(run)
                    : window.setTimeout(run, 0);
                return;
            }
            try {
                startMotion(center, { force: true });
            } catch (error) {}
        }

        function queueSocialResearchMotion(center, activePanel, reason) {
            const panel = text(activePanel || '');
            const shouldAnimate = shouldAnimateSocialPanelMotion('research', activePanel, reason, () => reason === 'research-reader-open' || reason === 'research-reader-close');
            if (!shouldAnimate) {
                if (panel !== 'research') {
                    abortSocialSectionMotion('__kiuSocialResearchLoadingMotion');
                    socialResearchMotionGeneration += 1;
                    if (socialResearchMotionFrame) {
                        if (typeof window.cancelAnimationFrame === 'function') {
                            window.cancelAnimationFrame(socialResearchMotionFrame);
                        } else {
                            window.clearTimeout(socialResearchMotionFrame);
                        }
                        socialResearchMotionFrame = 0;
                    }
                    document.body?.classList.remove(
                        'social-research-assembly-ready',
                        'social-research-assembly-active'
                    );
                    const centerEl = document.querySelector('#social-neo-center-region');
                    if (centerEl?.dataset) delete centerEl.dataset.socialResearchAssemblyState;
                    document.querySelectorAll('[data-social-research-assembly-root]').forEach((el) => {
                        delete el.dataset.socialResearchAssemblyRoot;
                    });
                }
                return;
            }

            socialResearchMotionGeneration += 1;
            if (socialResearchMotionFrame) {
                if (typeof window.cancelAnimationFrame === 'function') {
                    window.cancelAnimationFrame(socialResearchMotionFrame);
                } else {
                    window.clearTimeout(socialResearchMotionFrame);
                }
                socialResearchMotionFrame = 0;
            }

            const section = center?.firstElementChild;
            if (!section
                || section.matches('.social-neo-module-loading, [aria-busy="true"]')
                || section.querySelector('[aria-busy="true"]')) {
                clearSocialCenterAssemblyPrehide();
                return;
            }
            // Start sync in this turn so staging applies before the browser paints
            // the freshly mounted shell (rAF left one visible frame / blank intro).
            const startMotion = window.__kiuStartSocialResearchLoadingMotion;
            if (typeof startMotion !== 'function') {
                const generation = socialResearchMotionGeneration;
                let attempts = 0;
                const run = () => {
                    socialResearchMotionFrame = 0;
                    if (generation !== socialResearchMotionGeneration
                        || text(state().ui?.activePanel || '') !== 'research'
                        || center?.firstElementChild !== section
                        || !section.isConnected) {
                        return;
                    }
                    const live = window.__kiuStartSocialResearchLoadingMotion;
                    if (typeof live !== 'function') {
                        if (attempts++ >= 24) { releaseSocialBootShellReveal(); return; }
                        socialResearchMotionFrame = typeof window.requestAnimationFrame === 'function'
                            ? window.requestAnimationFrame(run)
                            : window.setTimeout(run, 32);
                        return;
                    }
                    try { live(center, { force: true }); } catch (error) {}
                };
                socialResearchMotionFrame = typeof window.requestAnimationFrame === 'function'
                    ? window.requestAnimationFrame(run)
                    : window.setTimeout(run, 0);
                return;
            }
            try {
                startMotion(center, { force: true });
            } catch (error) {}
        }

        function queueSocialPagesMotion(center, activePanel, reason) {
            const panel = text(activePanel || '');
            const shouldAnimate = shouldAnimateSocialPanelMotion('pages', activePanel, reason, () => reason === 'page-open-profile' || reason === 'page-profile-back' || reason === 'page-profile-tab');
            if (!shouldAnimate) {
                if (panel !== 'pages') {
                    abortSocialSectionMotion('__kiuSocialPagesLoadingMotion');
                    socialPagesMotionGeneration += 1;
                    if (socialPagesMotionFrame) {
                        if (typeof window.cancelAnimationFrame === 'function') {
                            window.cancelAnimationFrame(socialPagesMotionFrame);
                        } else {
                            window.clearTimeout(socialPagesMotionFrame);
                        }
                        socialPagesMotionFrame = 0;
                    }
                    document.body?.classList.remove(
                        'social-pages-assembly-ready',
                        'social-pages-assembly-active'
                    );
                    const centerEl = document.querySelector('#social-neo-center-region');
                    if (centerEl?.dataset) delete centerEl.dataset.socialPagesAssemblyState;
                    document.querySelectorAll('[data-social-pages-assembly-root]').forEach((el) => {
                        delete el.dataset.socialPagesAssemblyRoot;
                    });
                }
                return;
            }

            socialPagesMotionGeneration += 1;
            if (socialPagesMotionFrame) {
                if (typeof window.cancelAnimationFrame === 'function') {
                    window.cancelAnimationFrame(socialPagesMotionFrame);
                } else {
                    window.clearTimeout(socialPagesMotionFrame);
                }
                socialPagesMotionFrame = 0;
            }

            const section = center?.firstElementChild;
            if (!section
                || section.matches('.social-neo-module-loading, [aria-busy="true"]')
                || section.querySelector('[aria-busy="true"]')) {
                clearSocialCenterAssemblyPrehide();
                return;
            }
            // Start sync in this turn so staging applies before the browser paints
            // the freshly mounted shell (rAF left one visible frame / blank intro).
            const startMotion = window.__kiuStartSocialPagesLoadingMotion;
            if (typeof startMotion !== 'function') {
                const generation = socialPagesMotionGeneration;
                let attempts = 0;
                const run = () => {
                    socialPagesMotionFrame = 0;
                    if (generation !== socialPagesMotionGeneration
                        || text(state().ui?.activePanel || '') !== 'pages'
                        || center?.firstElementChild !== section
                        || !section.isConnected) {
                        return;
                    }
                    const live = window.__kiuStartSocialPagesLoadingMotion;
                    if (typeof live !== 'function') {
                        if (attempts++ >= 24) { releaseSocialBootShellReveal(); return; }
                        socialPagesMotionFrame = typeof window.requestAnimationFrame === 'function'
                            ? window.requestAnimationFrame(run)
                            : window.setTimeout(run, 32);
                        return;
                    }
                    try { live(center, { force: true }); } catch (error) {}
                };
                socialPagesMotionFrame = typeof window.requestAnimationFrame === 'function'
                    ? window.requestAnimationFrame(run)
                    : window.setTimeout(run, 0);
                return;
            }
            try {
                startMotion(center, { force: true });
            } catch (error) {}
        }

        function queueSocialEventsMotion(center, activePanel, reason) {
            const panel = text(activePanel || '');
            const shouldAnimate = shouldAnimateSocialPanelMotion('events', activePanel, reason);
            if (!shouldAnimate) {
                if (panel !== 'events') {
                    abortSocialSectionMotion('__kiuSocialEventsLoadingMotion');
                    socialEventsMotionGeneration += 1;
                    if (socialEventsMotionFrame) {
                        if (typeof window.cancelAnimationFrame === 'function') {
                            window.cancelAnimationFrame(socialEventsMotionFrame);
                        } else {
                            window.clearTimeout(socialEventsMotionFrame);
                        }
                        socialEventsMotionFrame = 0;
                    }
                    document.body?.classList.remove(
                        'social-events-assembly-ready',
                        'social-events-assembly-active'
                    );
                    const centerEl = document.querySelector('#social-neo-center-region');
                    if (centerEl?.dataset) delete centerEl.dataset.socialEventsAssemblyState;
                    document.querySelectorAll('[data-social-events-assembly-root]').forEach((el) => {
                        delete el.dataset.socialEventsAssemblyRoot;
                    });
                }
                return;
            }

            socialEventsMotionGeneration += 1;
            if (socialEventsMotionFrame) {
                if (typeof window.cancelAnimationFrame === 'function') {
                    window.cancelAnimationFrame(socialEventsMotionFrame);
                } else {
                    window.clearTimeout(socialEventsMotionFrame);
                }
                socialEventsMotionFrame = 0;
            }

            const section = center?.firstElementChild;
            if (!section
                || section.matches('.social-neo-module-loading, [aria-busy="true"]')
                || section.querySelector('[aria-busy="true"]')) {
                clearSocialCenterAssemblyPrehide();
                return;
            }
            // Start sync in this turn so staging applies before the browser paints
            // the freshly mounted shell (rAF left one visible frame / blank intro).
            const startMotion = window.__kiuStartSocialEventsLoadingMotion;
            if (typeof startMotion !== 'function') {
                const generation = socialEventsMotionGeneration;
                let attempts = 0;
                const run = () => {
                    socialEventsMotionFrame = 0;
                    if (generation !== socialEventsMotionGeneration
                        || text(state().ui?.activePanel || '') !== 'events'
                        || center?.firstElementChild !== section
                        || !section.isConnected) {
                        return;
                    }
                    const live = window.__kiuStartSocialEventsLoadingMotion;
                    if (typeof live !== 'function') {
                        if (attempts++ >= 24) { releaseSocialBootShellReveal(); return; }
                        socialEventsMotionFrame = typeof window.requestAnimationFrame === 'function'
                            ? window.requestAnimationFrame(run)
                            : window.setTimeout(run, 32);
                        return;
                    }
                    try { live(center, { force: true }); } catch (error) {}
                };
                socialEventsMotionFrame = typeof window.requestAnimationFrame === 'function'
                    ? window.requestAnimationFrame(run)
                    : window.setTimeout(run, 0);
                return;
            }
            try {
                startMotion(center, { force: true });
            } catch (error) {}
        }

        function queueSocialLostFoundMotion(center, activePanel, reason) {
            const panel = text(activePanel || '');
            const shouldAnimate = shouldAnimateSocialPanelMotion('lost-and-found', activePanel, reason);
            if (!shouldAnimate) {
                if (panel !== 'lost-and-found') {
                    abortSocialSectionMotion('__kiuSocialLostFoundLoadingMotion');
                    socialLostFoundMotionGeneration += 1;
                    if (socialLostFoundMotionFrame) {
                        if (typeof window.cancelAnimationFrame === 'function') {
                            window.cancelAnimationFrame(socialLostFoundMotionFrame);
                        } else {
                            window.clearTimeout(socialLostFoundMotionFrame);
                        }
                        socialLostFoundMotionFrame = 0;
                    }
                    document.body?.classList.remove(
                        'social-lost-found-assembly-ready',
                        'social-lost-found-assembly-active'
                    );
                    const centerEl = document.querySelector('#social-neo-center-region');
                    if (centerEl?.dataset) delete centerEl.dataset.socialLostFoundAssemblyState;
                    document.querySelectorAll('[data-social-lost-found-assembly-root]').forEach((el) => {
                        delete el.dataset.socialLostFoundAssemblyRoot;
                    });
                }
                return;
            }

            socialLostFoundMotionGeneration += 1;
            if (socialLostFoundMotionFrame) {
                if (typeof window.cancelAnimationFrame === 'function') {
                    window.cancelAnimationFrame(socialLostFoundMotionFrame);
                } else {
                    window.clearTimeout(socialLostFoundMotionFrame);
                }
                socialLostFoundMotionFrame = 0;
            }

            const section = center?.firstElementChild;
            if (!section
                || section.matches('.social-neo-module-loading, [aria-busy="true"]')
                || section.querySelector('[aria-busy="true"]')) {
                clearSocialCenterAssemblyPrehide();
                return;
            }
            // Start sync in this turn so staging applies before the browser paints
            // the freshly mounted shell (rAF left one visible frame / blank intro).
            const startMotion = window.__kiuStartSocialLostFoundLoadingMotion;
            if (typeof startMotion !== 'function') {
                const generation = socialLostFoundMotionGeneration;
                let attempts = 0;
                const run = () => {
                    socialLostFoundMotionFrame = 0;
                    if (generation !== socialLostFoundMotionGeneration
                        || text(state().ui?.activePanel || '') !== 'lost-and-found'
                        || center?.firstElementChild !== section
                        || !section.isConnected) {
                        return;
                    }
                    const live = window.__kiuStartSocialLostFoundLoadingMotion;
                    if (typeof live !== 'function') {
                        if (attempts++ >= 24) { releaseSocialBootShellReveal(); return; }
                        socialLostFoundMotionFrame = typeof window.requestAnimationFrame === 'function'
                            ? window.requestAnimationFrame(run)
                            : window.setTimeout(run, 32);
                        return;
                    }
                    try { live(center, { force: true }); } catch (error) {}
                };
                socialLostFoundMotionFrame = typeof window.requestAnimationFrame === 'function'
                    ? window.requestAnimationFrame(run)
                    : window.setTimeout(run, 0);
                return;
            }
            try {
                startMotion(center, { force: true });
            } catch (error) {}
        }

        function queueSocialMessagesMotion(center, activePanel, reason) {
            const panel = text(activePanel || '');
            // mark-read / upsert remount center after panel-messages sync-start.
            // Replay only while intro is in flight — not after ready (avoids re-animating receipts).
            const assemblyInFlight = document.body?.classList.contains('social-messages-assembly-active')
                || ['pending', 'active'].includes(text(center?.dataset?.socialMessagesAssemblyState || ''));
            const shouldAnimate = shouldAnimateSocialPanelMotion('messages', activePanel, reason, () => ((reason === 'chat-read' || reason === 'chat-upsert') && assemblyInFlight));
            // Only invalidate in-flight starts when leaving Messages.
            // chat-read / chat-upsert while ready must not cancel a completed intro.
            if (!shouldAnimate) {
                if (panel !== 'messages') {
                    abortSocialSectionMotion('__kiuSocialMessagesLoadingMotion');
                    socialMessagesMotionGeneration += 1;
                    if (socialMessagesMotionFrame) {
                        if (typeof window.cancelAnimationFrame === 'function') {
                            window.cancelAnimationFrame(socialMessagesMotionFrame);
                        } else {
                            window.clearTimeout(socialMessagesMotionFrame);
                        }
                        socialMessagesMotionFrame = 0;
                    }
                    document.body?.classList.remove(
                        'social-messages-assembly-ready',
                        'social-messages-assembly-active'
                    );
                    const centerEl = document.querySelector('#social-neo-center-region');
                    if (centerEl?.dataset) delete centerEl.dataset.socialMessagesAssemblyState;
                    // Clear any leftover root markers so the next Messages open is a fresh force start.
                    document.querySelectorAll('[data-social-messages-assembly-root]').forEach((el) => {
                        delete el.dataset.socialMessagesAssemblyRoot;
                    });
                }
                return;
            }

            socialMessagesMotionGeneration += 1;
            if (socialMessagesMotionFrame) {
                if (typeof window.cancelAnimationFrame === 'function') {
                    window.cancelAnimationFrame(socialMessagesMotionFrame);
                } else {
                    window.clearTimeout(socialMessagesMotionFrame);
                }
                socialMessagesMotionFrame = 0;
            }

            const section = center?.firstElementChild;
            if (!section
                || !section.matches('.social-neo-messages')
                || section.matches('.social-neo-module-loading, [aria-busy="true"]')
                || section.querySelector('[aria-busy="true"]')) {
                clearSocialCenterAssemblyPrehide();
                return;
            }
            // Start sync in this turn so staging applies before the browser paints
            // the freshly mounted shell (rAF left one visible frame / blank intro).
            const startMotion = window.__kiuStartSocialMessagesLoadingMotion;
            if (typeof startMotion !== 'function') {
                const generation = socialMessagesMotionGeneration;
                let attempts = 0;
                const run = () => {
                    socialMessagesMotionFrame = 0;
                    if (generation !== socialMessagesMotionGeneration
                        || text(state().ui?.activePanel || '') !== 'messages') {
                        return;
                    }
                    const live = window.__kiuStartSocialMessagesLoadingMotion;
                    if (typeof live !== 'function') {
                        if (attempts++ >= 24) { releaseSocialBootShellReveal(); return; }
                        socialMessagesMotionFrame = typeof window.requestAnimationFrame === 'function'
                            ? window.requestAnimationFrame(run)
                            : window.setTimeout(run, 32);
                        return;
                    }
                    try { live(center, { force: true }); } catch (error) {}
                };
                socialMessagesMotionFrame = typeof window.requestAnimationFrame === 'function'
                    ? window.requestAnimationFrame(run)
                    : window.setTimeout(run, 0);
                return;
            }
            try {
                startMotion(center, { force: true });
            } catch (error) {}
        }

        function queueSocialAlertsMotion(center, activePanel, reason) {
            const panel = text(activePanel || '');
            // Background notifications-refresh remounts after panel-alerts sync-start.
            // Replay only while intro is in flight — not after ready.
            const assemblyInFlight = document.body?.classList.contains('social-alerts-assembly-active')
                || ['pending', 'active'].includes(text(center?.dataset?.socialAlertsAssemblyState || ''));
            // Category filter tab switches repaint the list only — no assembly replay.
            const shouldAnimate = shouldAnimateSocialPanelMotion('alerts', activePanel, reason, () => ((reason === 'notifications-refresh' || reason === 'notification-read' || reason === 'notification-removed') && assemblyInFlight));
            // Only invalidate in-flight starts when leaving Alerts.
            if (!shouldAnimate) {
                if (panel !== 'alerts') {
                    abortSocialSectionMotion('__kiuSocialAlertsLoadingMotion');
                    socialAlertsMotionGeneration += 1;
                    if (socialAlertsMotionFrame) {
                        if (typeof window.cancelAnimationFrame === 'function') {
                            window.cancelAnimationFrame(socialAlertsMotionFrame);
                        } else {
                            window.clearTimeout(socialAlertsMotionFrame);
                        }
                        socialAlertsMotionFrame = 0;
                    }
                    document.body?.classList.remove(
                        'social-alerts-assembly-ready',
                        'social-alerts-assembly-active'
                    );
                    const centerEl = document.querySelector('#social-neo-center-region');
                    if (centerEl?.dataset) delete centerEl.dataset.socialAlertsAssemblyState;
                    document.querySelectorAll('[data-social-alerts-assembly-root]').forEach((el) => {
                        delete el.dataset.socialAlertsAssemblyRoot;
                    });
                }
                return;
            }

            socialAlertsMotionGeneration += 1;
            if (socialAlertsMotionFrame) {
                if (typeof window.cancelAnimationFrame === 'function') {
                    window.cancelAnimationFrame(socialAlertsMotionFrame);
                } else {
                    window.clearTimeout(socialAlertsMotionFrame);
                }
                socialAlertsMotionFrame = 0;
            }

            const section = center?.firstElementChild;
            if (!section
                || !section.matches('.sn-alerts-panel')
                || section.matches('.social-neo-module-loading, [aria-busy="true"]')
                || section.querySelector('[aria-busy="true"]')) {
                clearSocialCenterAssemblyPrehide();
                return;
            }
            // Start sync in this turn so staging applies before the browser paints
            // the freshly mounted shell (rAF left one visible frame / blank intro).
            const startMotion = window.__kiuStartSocialAlertsLoadingMotion;
            if (typeof startMotion !== 'function') {
                const generation = socialAlertsMotionGeneration;
                let attempts = 0;
                const run = () => {
                    socialAlertsMotionFrame = 0;
                    if (generation !== socialAlertsMotionGeneration
                        || text(state().ui?.activePanel || '') !== 'alerts') {
                        return;
                    }
                    const live = window.__kiuStartSocialAlertsLoadingMotion;
                    if (typeof live !== 'function') {
                        if (attempts++ >= 24) { releaseSocialBootShellReveal(); return; }
                        socialAlertsMotionFrame = typeof window.requestAnimationFrame === 'function'
                            ? window.requestAnimationFrame(run)
                            : window.setTimeout(run, 32);
                        return;
                    }
                    try { live(center, { force: true }); } catch (error) {}
                };
                socialAlertsMotionFrame = typeof window.requestAnimationFrame === 'function'
                    ? window.requestAnimationFrame(run)
                    : window.setTimeout(run, 0);
                return;
            }
            try {
                startMotion(center, { force: true });
            } catch (error) {}
        }

        function queueSocialSurveysMotion(center, activePanel, reason) {
            const panel = text(activePanel || '');
            const shouldAnimate = shouldAnimateSocialPanelMotion('surveys', activePanel, reason, () => reason === 'surveys-lane' || reason === 'survey-take-open' || reason === 'survey-take-close');
            if (!shouldAnimate) {
                if (panel !== 'surveys') {
                    abortSocialSectionMotion('__kiuSocialSurveysLoadingMotion');
                    socialSurveysMotionGeneration += 1;
                    if (socialSurveysMotionFrame) {
                        if (typeof window.cancelAnimationFrame === 'function') {
                            window.cancelAnimationFrame(socialSurveysMotionFrame);
                        } else {
                            window.clearTimeout(socialSurveysMotionFrame);
                        }
                        socialSurveysMotionFrame = 0;
                    }
                    document.body?.classList.remove(
                        'social-surveys-assembly-ready',
                        'social-surveys-assembly-active'
                    );
                    const centerEl = document.querySelector('#social-neo-center-region');
                    if (centerEl?.dataset) delete centerEl.dataset.socialSurveysAssemblyState;
                    document.querySelectorAll('[data-social-surveys-assembly-root]').forEach((el) => {
                        delete el.dataset.socialSurveysAssemblyRoot;
                    });
                }
                return;
            }

            socialSurveysMotionGeneration += 1;
            if (socialSurveysMotionFrame) {
                if (typeof window.cancelAnimationFrame === 'function') {
                    window.cancelAnimationFrame(socialSurveysMotionFrame);
                } else {
                    window.clearTimeout(socialSurveysMotionFrame);
                }
                socialSurveysMotionFrame = 0;
            }

            const section = center?.firstElementChild;
            if (!section
                || section.matches('.social-neo-module-loading, [aria-busy="true"]')
                || section.querySelector('[aria-busy="true"]')) {
                clearSocialCenterAssemblyPrehide();
                return;
            }
            // Start sync in this turn so staging applies before the browser paints
            // the freshly mounted shell (rAF left one visible frame / blank intro).
            const startMotion = window.__kiuStartSocialSurveysLoadingMotion;
            if (typeof startMotion !== 'function') {
                const generation = socialSurveysMotionGeneration;
                let attempts = 0;
                const run = () => {
                    socialSurveysMotionFrame = 0;
                    if (generation !== socialSurveysMotionGeneration
                        || text(state().ui?.activePanel || '') !== 'surveys'
                        || center?.firstElementChild !== section
                        || !section.isConnected) {
                        return;
                    }
                    const live = window.__kiuStartSocialSurveysLoadingMotion;
                    if (typeof live !== 'function') {
                        if (attempts++ >= 24) { releaseSocialBootShellReveal(); return; }
                        socialSurveysMotionFrame = typeof window.requestAnimationFrame === 'function'
                            ? window.requestAnimationFrame(run)
                            : window.setTimeout(run, 32);
                        return;
                    }
                    try { live(center, { force: true }); } catch (error) {}
                };
                socialSurveysMotionFrame = typeof window.requestAnimationFrame === 'function'
                    ? window.requestAnimationFrame(run)
                    : window.setTimeout(run, 0);
                return;
            }
            try {
                startMotion(center, { force: true });
            } catch (error) {}
        }

        function queueSocialPhotographyMotion(center, activePanel, reason) {
            const panel = text(activePanel || '');
            const shouldAnimate = shouldAnimateSocialPanelMotion('photography', activePanel, reason, () => reason === 'photography-my-profile' || reason === 'photography-my-profile-tab' || reason === 'photography-view-profile' || reason === 'photography-profile-back');
            // Only invalidate in-flight starts when leaving Exposé or replaying.
            // Bumping generation on every photography center render canceled the
            // queued start and left the shell without assembly.
            if (!shouldAnimate) {
                if (panel !== 'photography') {
                    abortSocialSectionMotion('__kiuSocialPhotographyLoadingMotion');
                    socialPhotographyMotionGeneration += 1;
                    if (socialPhotographyMotionFrame) {
                        if (typeof window.cancelAnimationFrame === 'function') {
                            window.cancelAnimationFrame(socialPhotographyMotionFrame);
                        } else {
                            window.clearTimeout(socialPhotographyMotionFrame);
                        }
                        socialPhotographyMotionFrame = 0;
                    }
                    document.body?.classList.remove(
                        'social-photography-assembly-ready',
                        'social-photography-assembly-active'
                    );
                    const centerEl = document.querySelector('#social-neo-center-region');
                    if (centerEl?.dataset) delete centerEl.dataset.socialPhotographyAssemblyState;
                    document.querySelectorAll('[data-social-photography-assembly-root]').forEach((el) => {
                        delete el.dataset.socialPhotographyAssemblyRoot;
                    });
                }
                return;
            }

            socialPhotographyMotionGeneration += 1;
            if (socialPhotographyMotionFrame) {
                if (typeof window.cancelAnimationFrame === 'function') {
                    window.cancelAnimationFrame(socialPhotographyMotionFrame);
                } else {
                    window.clearTimeout(socialPhotographyMotionFrame);
                }
                socialPhotographyMotionFrame = 0;
            }

            const section = center?.firstElementChild;
            if (!section
                || !section.matches('.social-photo-shell, .social-photo-profile-shell, .social-photo-shell--my-profile')
                || section.matches('.social-neo-module-loading, [aria-busy="true"]')
                || section.querySelector('[aria-busy="true"]')) {
                clearSocialCenterAssemblyPrehide();
                return;
            }
            // Start sync in this turn so staging applies before the browser paints
            // the freshly mounted shell (rAF left one visible frame / blank intro).
            const startMotion = window.__kiuStartSocialPhotographyLoadingMotion;
            if (typeof startMotion !== 'function') {
                const generation = socialPhotographyMotionGeneration;
                let attempts = 0;
                const run = () => {
                    socialPhotographyMotionFrame = 0;
                    // Re-resolve live shell — Exposé remounts before rAF (module hydrate).
                    const liveSection = center?.firstElementChild;
                    if (generation !== socialPhotographyMotionGeneration
                        || text(state().ui?.activePanel || '') !== 'photography'
                        || !liveSection
                        || !liveSection.isConnected
                        || !liveSection.matches('.social-photo-shell, .social-photo-profile-shell, .social-photo-shell--my-profile')
                        || liveSection.matches('.social-neo-module-loading, [aria-busy="true"]')
                        || liveSection.querySelector('[aria-busy="true"]')) {
                        clearSocialCenterAssemblyPrehide();
                        return;
                    }
                    const live = window.__kiuStartSocialPhotographyLoadingMotion;
                    if (typeof live !== 'function') {
                        if (attempts++ >= 24) { releaseSocialBootShellReveal(); return; }
                        socialPhotographyMotionFrame = typeof window.requestAnimationFrame === 'function'
                            ? window.requestAnimationFrame(run)
                            : window.setTimeout(run, 32);
                        return;
                    }
                    try { live(center, { force: true }); } catch (error) {}
                };
                socialPhotographyMotionFrame = typeof window.requestAnimationFrame === 'function'
                    ? window.requestAnimationFrame(run)
                    : window.setTimeout(run, 0);
                return;
            }
            try {
                startMotion(center, { force: true });
            } catch (error) {}
        }

function reactionEmoji(reactionType) {
    const type = text(reactionType || 'like').toLowerCase();
    if (type === 'love') return '&#10084;&#65039;';
    if (type === 'laugh') return '&#128514;';
    if (type === 'wow') return '&#128558;';
    if (type === 'support') return '&#129309;';
    return '&#128077;';
}

/**
 * Maps a reaction type to its past-tense display label (e.g. 'like' → 'Liked').
 * Returns 'Like' when no reaction is active.
 * @param {string} reactionType
 * @returns {string}
 */
function reactionLabel(reactionType) {
    const type = text(reactionType || '').toLowerCase();
    if (!type) return 'Like';
    if (type === 'like') return 'Liked';
    if (type === 'love') return 'Loved';
    if (type === 'laugh') return 'Haha';
    if (type === 'wow') return 'Wow';
    if (type === 'support') return 'Support';
    return type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Renders the reaction summary row below a post (top-3 emoji icons + total count).
 * Returns empty string when no reactions exist.
 * @param {Object} reactionCounts - Map of reaction type → count.
 * @returns {string} HTML markup.
 */
function renderPostReactionMetrics(reactionCounts = {}) {
    const types = ['like', 'love', 'laugh', 'wow', 'support'];
    const active = types
        .map((type) => [type, Number(reactionCounts[type] || 0)])
        .filter(([, count]) => count > 0)
        .sort((left, right) => right[1] - left[1]);
    const total = active.reduce((sum, [, count]) => sum + count, 0);
    if (!total) return '';
    const icons = active.slice(0, 3).map(([type]) =>
        `<span class="social-neo-reaction-metric-emoji" aria-hidden="true">${reactionEmoji(type)}</span>`
    ).join('');
    return `<span class="social-neo-post-metric social-neo-post-reaction-metric">${icons}<span>${escape(total)}</span></span>`;
}

/** Returns the current viewer's reaction type on a comment, or '' if none. */
function commentReactionType(comment) {
    if (hasSocialFeedModule() && typeof window.commentReactionType === 'function' && window.commentReactionType !== commentReactionType) {
        return window.commentReactionType(comment);
    }
    ensureSocialFeedModule().catch(() => null);
    return '';
}
function renderInlineReplyForm(comment, post, context) {
    if (hasSocialFeedModule() && typeof window.renderInlineReplyForm === 'function' && window.renderInlineReplyForm !== renderInlineReplyForm) {
        return window.renderInlineReplyForm(comment, post, context);
    }
    ensureSocialFeedModule().catch(() => null);
    return '';
}
function renderCommentReactionButtons(comment, normalizedPostId) {
    if (hasSocialFeedModule() && typeof window.renderCommentReactionButtons === 'function' && window.renderCommentReactionButtons !== renderCommentReactionButtons) {
        return window.renderCommentReactionButtons(comment, normalizedPostId);
    }
    ensureSocialFeedModule().catch(() => null);
    return '';
}
const renderCommentNode = createSocialLazyStub('renderCommentNode', hasSocialFeedModule, ensureSocialFeedModule, '', () => queueDeferredModuleRender('feed-module'));
const renderCommentThread = createSocialLazyStub('renderCommentThread', hasSocialFeedModule, ensureSocialFeedModule, '', () => queueDeferredModuleRender('feed-module'));

/* ----- Surgical comment-thread DOM patching (flicker-free dialog updates) ----- */

/** The comment <article> for a given id inside the open comments dialog. */
const dialogCommentEl = createSocialLazyStub('dialogCommentEl', hasSocialFeedModule, ensureSocialFeedModule, null, null);

/**
 * Replace only the tasks body stack (desk packages / list / map preview).
 * Keeps Work Desk header, toolbar, and filters mounted — no opacity reveal.
 */

/** Tabs that embed renderTaskDependencyGraphPreview. */
const PROJECT_TABS_WITH_GRAPH_PREVIEW = new Set(['overview', 'tasks']);

/**
 * Force-rebuild the active workspace tab pane when it hosts the task-map preview.
 * Used because keep-center dialogs leave stale __projectTabPaneCache DOM in place.
 */

/**
 * Graph data or free positions changed — drop cached tab panes so preview re-renders.
 * While the graph dialog is open, mark stale and rebuild when the dialog closes.
 */

/** Replaces just the 5 reaction chips of one comment with fresh counts/active state. */
const patchCommentReactions = createSocialLazyStub('patchCommentReactions', hasSocialFeedModule, ensureSocialFeedModule, false, null);

/** Window hook for runtime comment-react (dialog chips only — no center rebuild). */
const patchCommentReactionsByIds = createSocialLazyStub('patchCommentReactionsByIds', hasSocialFeedModule, ensureSocialFeedModule, false, null);
const patchPhotographyFeedReactions = createSocialLazyStub('patchPhotographyFeedReactions', hasSocialFeedModule, ensureSocialFeedModule, false, null);
const patchPostSaveButtons = createSocialLazyStub('patchPostSaveButtons', hasSocialFeedModule, ensureSocialFeedModule, false, null);
const patchPhotographyFeedSave = createSocialLazyStub('patchPhotographyFeedSave', hasSocialFeedModule, ensureSocialFeedModule, '', null);
function patchPhotographyFollowButtons(userId, isFollowing) {
    const normalizedId = text(userId);
    if (!normalizedId) return false;
    const host = root();
    if (!host) return false;
    const buttons = host.querySelectorAll(`[data-action="photography-follow"][data-user-id="${CSS.escape(normalizedId)}"]`);
    if (!buttons.length) return false;
    const following = Boolean(isFollowing);
    buttons.forEach((btn) => {
        btn.classList.toggle('lux-primary-btn', following);
        btn.classList.toggle('lux-secondary-btn', !following);
        const sm = btn.classList.contains('lux-secondary-btn-sm');
        btn.textContent = following ? 'Following' : 'Follow';
        // preserve spacing for sm buttons that had only text
        if (!sm && following) {
            // ok
        }
    });
    return true;
}
function refreshPhotographyPanelStage() {
    if (typeof window.refreshPhotographyFeedStage === 'function') {
        try {
            if (window.refreshPhotographyFeedStage()) return true;
        } catch (error) {
            console.warn('[Social] photography stage refresh failed', error);
        }
    }
    return false;
}

/** Surgically updates a single post card's reaction UI (metrics, Like button, picker)
 *  without re-rendering the entire center column — prevents scroll jumps. */
const patchPostReactions = createSocialLazyStub('patchPostReactions', hasSocialFeedModule, ensureSocialFeedModule, false, null);
function portfolioEditorFormRoot() {
    if (text(activeDialog()?.type || '') === 'portfolio-editor') {
        return socialDialogRegion()?.querySelector('.lux-glass-dialog-body--portfolio-editor') || null;
    }
    return document.getElementById('social-neo-center-region');
}
function capturePortfolioEditorSnapshot() {
    const body = portfolioEditorFormRoot();
    if (!body) return null;
    const active = document.activeElement;
    const activeInBody = Boolean(active && body.contains(active));
    return {
        scrollTop: body.scrollTop || 0,
        activeSelector: activeInBody ? focusRestoreSelector(active) : '',
        selectionStart: activeInBody && typeof active.selectionStart === 'number' ? active.selectionStart : null,
        selectionEnd: activeInBody && typeof active.selectionEnd === 'number' ? active.selectionEnd : null
    };
}
function restorePortfolioEditorSnapshot(snapshot) {
    if (!snapshot) return;
    const body = portfolioEditorFormRoot();
    if (!body) return;
    body.scrollTop = snapshot.scrollTop || 0;
    if (!snapshot.activeSelector) return;
    const el = body.querySelector(snapshot.activeSelector);
    if (!el || typeof el.focus !== 'function') return;
    el.focus({ preventScroll: true });
    if (snapshot.selectionStart != null && snapshot.selectionEnd != null && typeof el.setSelectionRange === 'function') {
        try { el.setSelectionRange(snapshot.selectionStart, snapshot.selectionEnd); } catch (error) {}
    }
}
function patchPortfolioSaveStatus(statusText) {
    const root = portfolioEditorFormRoot();
    if (!root) return false;
    const el = root.querySelector('.portfolio-save-status');
    if (!el) return false;
    el.textContent = text(statusText || state().ui?.portfolioSaveStatus || '');
    return true;
}
function patchPortfolioStartedPill() {
    // Started-section pill needs a live counter on the workspace portfolio model.
    return false;
}
function patchPortfolioSectionToggle(sectionKey) {
    const root = portfolioEditorFormRoot();
    if (!root) return false;
    const card = root.querySelector(`.portfolio-section-card[data-section-key="${CSS.escape(sectionKey)}"]`);
    if (!card) return false;
    const openSections = state().ui?.openPortfolioSections || {};
    const isOpen = openSections[sectionKey] !== false;
    card.classList.toggle('is-open', isOpen);
    const body = card.querySelector('.portfolio-section-body');
    if (body) body.hidden = !isOpen;
    return true;
}
function patchPortfolioPublishVisibility(visibilityMode) {
    const root = portfolioEditorFormRoot();
    if (!root) return false;
    const panel = root.querySelector('.portfolio-publish-panel');
    if (!panel) return false;
    const mode = text(visibilityMode || state().ui?.publishVisibility || 'staff_only') || 'staff_only';
    panel.querySelectorAll('.portfolio-audience-card').forEach((card) => {
        const cardMode = text(card.getAttribute('data-visibility'));
        card.classList.toggle('is-selected', cardMode === mode);
    });
    const consent = Boolean(state().ui?.publishConsent);
    let consentRow = panel.querySelector('.portfolio-consent-row');
    if (mode === 'students_only') {
        if (!consentRow) {
            panel.querySelector('.portfolio-audience-cards')?.insertAdjacentHTML('afterend', `
                <label class="portfolio-consent-row">
                    <input type="checkbox" name="portfolioPublishConsent" ${consent ? 'checked' : ''}>
                    <span>I understand I can unpublish anytime and my portfolio will appear in campus discovery.</span>
                </label>
            `);
        }
    } else if (consentRow) {
        consentRow.remove();
    }
    return true;
}
function patchPortfolioSection(sectionKey) {
    const root = portfolioEditorFormRoot();
    if (!root || typeof window.KiuPortfolioEditor?.renderSection !== 'function') return false;
    const portfolio = ensureMyPortfolioDocument();
    const section = portfolio.sections?.[sectionKey];
    if (!section) return false;
    const card = root.querySelector(`.portfolio-section-card[data-section-key="${CSS.escape(sectionKey)}"]`);
    if (!card) return false;
    const runtime = state();
    card.outerHTML = window.KiuPortfolioEditor.renderSection(sectionKey, section, {
        openPortfolioSections: runtime.ui?.openPortfolioSections || {},
        publishVisibility: runtime.ui?.publishVisibility || portfolio.visibilityMode || 'staff_only',
        publishConsent: Boolean(runtime.ui?.publishConsent),
        portfolioSaveStatus: runtime.ui?.portfolioSaveStatus || 'Changes autosave as you type.'
    });
    patchPortfolioStartedPill(portfolio);
    return true;
}
function syncPortfolioEditorInput() {
    if (text(activeDialog()?.type || '') !== 'portfolio-editor') return false;
    portfolioCollectDocumentFromUi();
    state().ui.portfolioSaveStatus = 'Unsaved changes';
    return patchPortfolioSaveStatus('Unsaved changes');
}
function patchEventRsvpButtons(eventId) {
    const normalizedId = text(eventId);
    if (!normalizedId) return false;
    const host = root();
    if (!host) return false;
    const buttons = host.querySelectorAll(`[data-action="event-rsvp"][data-event-id="${CSS.escape(normalizedId)}"]`);
    if (!buttons.length) return false;
    const events = Array.isArray(state()?.social?.events) ? state().social.events : [];
    const eventItem = events.find((entry) => text(entry?.id) === normalizedId);
    if (!eventItem) return false;
    const isInterested = text(eventItem.viewerRsvpStatus || '') === 'interested';
    const interestedCount = Number(eventItem?.attendeeSummary?.interested || 0);
    buttons.forEach((btn) => {
        btn.setAttribute('data-status', isInterested ? 'declined' : 'interested');
        btn.classList.toggle('lux-primary-btn', isInterested);
        btn.classList.toggle('lux-secondary-btn', !isInterested);
        btn.textContent = `Interested · ${interestedCount}`;
        const card = btn.closest('.social-neo-event-feature');
        const countEl = card?.querySelector(`[data-event-interested-count="${CSS.escape(normalizedId)}"]`);
        if (countEl) countEl.textContent = `${interestedCount} interested`;
    });
    return true;
}
function getSocialPageRecord(pageId) {
    const normalizedId = text(pageId);
    if (!normalizedId) return null;
    return (Array.isArray(state().social?.pages) ? state().social.pages : []).find((page) => text(page?.id) === normalizedId) || null;
}
function pageFollowerIdsFor(page) {
    return Array.isArray(page?.followerIds)
        ? page.followerIds
        : (Array.isArray(page?.followerUserIds) ? page.followerUserIds : []);
}
function pageAdminIdsFor(page) {
    const ids = Array.isArray(page?.adminIds) ? page.adminIds : (Array.isArray(page?.adminUserIds) ? page.adminUserIds : []);
    return uniqueStrings([...ids, text(page?.ownerUserId || '')].filter(Boolean));
}
function buildPageMembersList(page) {
    const adminIds = pageAdminIdsFor(page).map((id) => text(id)).filter(Boolean);
    const adminSet = new Set(adminIds);
    const members = adminIds.map((id) => ({ id, role: 'admin' }));
    pageFollowerIdsFor(page).forEach((followerId) => {
        const id = text(followerId);
        if (!id || adminSet.has(id)) return;
        members.push({ id, role: 'follower' });
    });
    return members;
}
function shouldPatchPageComposeBlock(pageId) {
    const runtime = state();
    if (text(runtime.ui?.activePanel || '') !== 'pages') return false;
    if (text(runtime.ui?.activePageProfileId || '') !== text(pageId)) return false;
    const tab = text(runtime.ui?.pageProfileTab || 'all');
    if (tab === 'about') return false;
    const page = getSocialPageRecord(pageId);
    if (tab === 'official' && page && !page.isManager) return false;
    return Boolean(page);
}
function patchSocialFlash() {
    const host = root();
    const flashRegion = host?.querySelector('#social-neo-flash-region');
    if (!flashRegion) return false;
    flashRegion.innerHTML = renderSocialFlashStatus(state());
    return true;
}
function patchPageFollowState(pageId) {
    const normalizedId = text(pageId);
    if (!normalizedId) return false;
    const host = root();
    if (!host) return false;
    const page = getSocialPageRecord(normalizedId);
    if (!page) return false;
    const buttons = host.querySelectorAll(`[data-action="page-follow"][data-page-id="${CSS.escape(normalizedId)}"]`);
    if (!buttons.length) return false;
    const isFollowing = Boolean(page.isFollowing);
    buttons.forEach((button) => {
        button.classList.toggle('lux-primary-btn', isFollowing);
        button.classList.toggle('lux-secondary-btn', !isFollowing);
        const composeCta = button.closest('.social-neo-page-compose-block');
        button.innerHTML = composeCta
            ? '<i class="fas fa-plus"></i> Follow Page'
            : (isFollowing
                ? '<i class="fas fa-check"></i> Following'
                : '<i class="fas fa-plus"></i> Follow');
    });
    const followerPill = host.querySelector('.social-neo-page-profile-meta .social-neo-badge-row .social-neo-pill:last-child');
    if (followerPill) {
        followerPill.textContent = `${Number(page.followerCount || 0)} followers`;
    }
    return true;
}
function patchPageComposeBlock(pageId) {
    if (!shouldPatchPageComposeBlock(pageId)) return false;
    const host = root();
    if (!host) return false;
    const block = host.querySelector('.social-neo-page-compose-block');
    if (!block) return false;
    const page = getSocialPageRecord(pageId);
    if (!page) return false;
    block.outerHTML = renderPageProfileComposer(page, state());
    const freshBlock = host.querySelector('.social-neo-page-compose-block');
    if (freshBlock && typeof window.enhanceUniversalPickers === 'function') {
        try { window.enhanceUniversalPickers(freshBlock); } catch (error) {}
    }
    return true;
}

/** Opens the inline reply composer under a comment without re-rendering the dialog. */
const openInlineReply = createSocialLazyStub('openInlineReply', hasSocialFeedModule, ensureSocialFeedModule, '', null);

/** Removes the inline reply composer under a comment. */
const closeInlineReply = createSocialLazyStub('closeInlineReply', hasSocialFeedModule, ensureSocialFeedModule, '', null);

/** Appends a freshly-posted reply under its parent and updates the reply counter. */
const appendReplyNode = createSocialLazyStub('appendReplyNode', hasSocialFeedModule, ensureSocialFeedModule, '', null);

/** Updates the "N comments" header count in the open comments dialog. */
const patchCommentDialogCount = createSocialLazyStub('patchCommentDialogCount', hasSocialFeedModule, ensureSocialFeedModule, '', null);

/** Deletes a comment in place (no confirm modal → no overlay re-render/flicker). */
async function deleteCommentInline(postId, commentId) {
    if (hasSocialFeedModule() && typeof window.deleteCommentInline === 'function' && window.deleteCommentInline !== deleteCommentInline) {
        return window.deleteCommentInline(postId, commentId);
    }
    await ensureSocialFeedModule().catch(() => null);
    if (typeof window.deleteCommentInline === 'function' && window.deleteCommentInline !== deleteCommentInline) {
        return window.deleteCommentInline(postId, commentId);
    }
}

/* The vertical thread line for each parent is a `::after` whose height is set
   here so it stops exactly at its LAST direct reply (CSS alone would run it
   to the bottom of the whole subtree, leaving a dangling line). */
const relayoutCommentTrunks = createSocialLazyStub('relayoutCommentTrunks', hasSocialFeedModule, ensureSocialFeedModule, '', null);

/**
 * Recursively searches a comment tree for a comment by ID.
 * Used to locate reply targets and react to nested comments.
 * @param {Array<Object>} comments - Comments array to search.
 * @param {string} commentId - Target comment ID.
 * @returns {Object|null} The matched comment or null.
 */
const findCommentInThread = createSocialLazyStub('findCommentInThread', hasSocialFeedModule, ensureSocialFeedModule, null, null);
function readFileAsDataUrl(file) {
    if (!file) return Promise.resolve('');
    if (text(file.dataUrl)) return Promise.resolve(text(file.dataUrl));
    if (typeof readPortalSocialFile === 'function') {
        return Promise.resolve(readPortalSocialFile(file)).then((result) => text(result?.dataUrl || result || ''));
    }
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(text(reader.result || ''));
        reader.onerror = () => reject(reader.error || new Error('File could not be read.'));
        reader.readAsDataURL(file);
    });
}
function optimizeEventCoverFile(file) {
    if (!file) return Promise.resolve(null);
    if (typeof optimizePortalSocialEventCoverFile === 'function') {
        return Promise.resolve(optimizePortalSocialEventCoverFile(file));
    }
    return Promise.resolve(file);
}
function setPanel(panel, options = {}) {
    const runtime = state();
    const normalizedPanel = text(panel).toLowerCase() === 'lost-found' ? 'lost-and-found' : text(panel);
    const nextPanel = ['feed', 'community', 'groups', 'workspace', 'projects', 'research', 'pages', 'events', 'surveys', 'photography', 'lost-and-found', 'messages', 'alerts', 'profile'].includes(normalizedPanel) ? normalizedPanel : 'feed';
    const panelChanged = runtime.ui.activePanel !== nextPanel;
    const drawerChanged = runtime.ui.shellDrawerOpen !== false;
    const workspaceNavChanged = runtime.ui.workspaceNavOpen !== false;
    if (runtime.ui.workspaceNavOpen && (panelChanged || drawerChanged)) {
        return closeSocialWorkspaceNavAnimated(() => {
            // Always paint after nav close — caller's sync follow-up render already raced.
            finalizeSetPanel(nextPanel, panelChanged, drawerChanged, false);
        });
    }
    finalizeSetPanel(nextPanel, panelChanged, drawerChanged, workspaceNavChanged, options);
}
function finalizeSetPanel(nextPanel, panelChanged, drawerChanged, workspaceNavChanged = false, options = {}) {
    const runtime = state();
    if (panelChanged && typeof window.__kiuAbortAssemblyLoadingMotions === 'function') {
        try { window.__kiuAbortAssemblyLoadingMotions(); } catch (_error) {}
    }
    runtime.ui.activePanel = nextPanel;
    const socialHost = root();
    if (panelChanged && socialHost) delete socialHost.__kiuDeferredModuleRenderKey;
    runtime.ui.shellDrawerOpen = false;
    runtime.ui.workspaceNavOpen = false;
    if (runtime.ui.activePanel === 'community') {
        scheduleDirectoryPrefetch();
    }
    try {
        localStorage.setItem(PANEL_KEY, runtime.ui.activePanel);
    } catch (error) {}
    if (!panelChanged && !drawerChanged && !workspaceNavChanged) {
        return;
    }
    // Caller will paint once (e.g. panel-messages) — avoid flash of full UI then remount+assembly.
    if (options?.skipRender) return;
    renderSocialPageNow('panel');
}
function setActiveChat(chatId) {
    const runtime = state();
    const nextChatId = text(chatId);
    const chatChanged = runtime.ui.activeChatId !== nextChatId;
    runtime.ui.activeChatId = nextChatId;
    try {
        localStorage.setItem(CHAT_KEY, runtime.ui.activeChatId);
    } catch (error) {}
    if (typeof unhidePortalMessengerChatForUser === 'function' && nextChatId) {
        try { unhidePortalMessengerChatForUser(nextChatId, currentUserId()); } catch (error) {}
    }
    if (typeof markPortalChatMessagesRead === 'function' && nextChatId) {
        markPortalChatMessagesRead(nextChatId).catch(() => null);
    }
    if (!chatChanged) return;
    renderSocialPageNow('chat');
}
async function focusFeed(scopeType, scopeId) {
    const runtime = state();
    runtime.ui.feedScopeType = text(scopeType);
    runtime.ui.feedScopeId = text(scopeId);
    try {
        await refreshPortalSocialFeed(true);
    } catch (error) {
        if (typeof setPortalSocialFlash === 'function') setPortalSocialFlash(error?.message || 'Feed could not be refreshed.', 'danger', { skipRender: true });
    }
    setPanel('feed');
    invalidateSocialRenderCache({ center: true });
    renderSocialPageNow('feed-scope');
}
function focusRestoreSelector(node) {
    if (!node || node === document.body) return '';
    const name = text(node.getAttribute?.('name') || '');
    const bind = text(node.getAttribute?.('data-bind') || '');
    const form = node.closest?.('form[data-form]');
    const formName = text(form?.getAttribute('data-form') || '');
    const postId = postKey(form?.getAttribute('data-post-id') || '');
    if ((formName === 'comment' || formName === 'dialog-comment') && postId && name === 'commentBody') {
        return `form[data-form="${formName}"][data-post-id="${CSS.escape(postId)}"] [name="commentBody"]`;
    }
    if (node.id) return `#${CSS.escape(node.id)}`;
    if (formName && name) return `form[data-form="${formName}"] [name="${name}"]`;
    if (bind) return `[data-bind="${bind}"]`;
    if (name) return `[name="${name}"]`;
    return '';
}
function rememberInteractionAnchor(host, trigger) {
    if (!host || !trigger) return;
    const card = trigger.closest?.('.social-neo-community-card, .social-neo-directory-item');
    const userId = text(card?.getAttribute('data-user-id') || trigger.getAttribute('data-user-id') || '');
    if (userId) host.__kiuInteractionAnchorUserId = userId;
}
function interactionAnchorNode(host, userId) {
    if (!host || !userId) return null;
    return host.querySelector(`[data-user-id="${CSS.escape(userId)}"]`)
        ?.closest('.social-neo-community-card, .social-neo-directory-item') || null;
}
const SOCIAL_SCROLL_LOCK_QUERY = '(min-width: 1181px)';
function socialScrollLockMedia() {
    try {
        return window.matchMedia(SOCIAL_SCROLL_LOCK_QUERY);
    } catch (error) {
        return { matches: false };
    }
}
function isSocialRouteDesktopScroll() {
    return document.body.classList.contains('lux-route-social')
        && Boolean(socialScrollLockMedia().matches);
}
function socialScrollLockActive() {
    return document.body.classList.contains('social-neo-scroll-lock');
}
function getSocialCenterScroller(host) {
    const rootNode = host?.querySelector?.('#social-neo-root') || host;
    if (!rootNode) return null;
    return rootNode.querySelector('#social-neo-center-region')
        || rootNode.querySelector('.social-neo-center')
        || null;
}
function scrollSocialCenterTo(top = 0, behavior = 'auto', host = root()) {
    const nextTop = Math.max(0, Number(top) || 0);
    if (!socialScrollLockActive()) {
        try {
            window.scrollTo({ top: nextTop, behavior: behavior === 'smooth' ? 'smooth' : 'auto' });
        } catch (error) {
            window.scrollTo(0, nextTop);
        }
        return;
    }
    const scroller = getSocialCenterScroller(host);
    if (!scroller) return;
    try {
        scroller.scrollTo({ top: nextTop, behavior: behavior === 'smooth' ? 'smooth' : 'auto' });
    } catch (error) {
        scroller.scrollTop = nextTop;
    }
}
function scrollSocialCenterElementIntoView(selector, host = root(), behavior = 'smooth') {
    const scroller = getSocialCenterScroller(host);
    const node = host?.querySelector?.(selector);
    if (!scroller || !node) return false;
    if (!scroller.contains(node)) {
        try { node.scrollIntoView({ block: 'nearest', behavior }); } catch (error) {}
        return true;
    }
    const scrollerRect = scroller.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();
    const nextTop = scroller.scrollTop + (nodeRect.top - scrollerRect.top) - 12;
    scrollSocialCenterTo(nextTop, behavior, host);
    return true;
}
function bindFileInputs() {
    const host = root();
    if (!host) return;
    const postInput = host.querySelector('input[name="postFile"]');
    if (postInput) postInput.value = '';
    const pagePostInput = host.querySelector('input[name="pagePostFile"]');
    if (pagePostInput) pagePostInput.value = '';
    const messageInput = host.querySelector('input[name="messageFile"]');
    if (messageInput) messageInput.value = '';
    const storyInput = host.querySelector('input[name="storyFile"]');
    if (storyInput) storyInput.value = '';
    const coverInput = host.querySelector('input[name="coverImageFile"]');
    if (coverInput) coverInput.value = '';
    const pageAvatarInput = host.querySelector('input[name="pageAvatarFile"]');
    if (pageAvatarInput) pageAvatarInput.value = '';
    const pageCoverInput = host.querySelector('input[name="pageCoverFile"]');
    if (pageCoverInput) pageCoverInput.value = '';
}
const filePreview = window.filePreview || (window.KiuSocialFormModel || {}).filePreview;

/**
 * Renders a small chip showing an attached file name.
 * Used in the composer and post edit dialogs.
 * @param {Object|null} file  - File reference with a `.name` property, or null.
 * @param {string} [label]    - Fallback label when `file.name` is missing.
 * @returns {string} HTML or empty string.
 */
function renderFileChip(file, label = 'Attachment ready') {
    if (!file) return '';
    return `
        <div class="social-neo-draft-file">
            <i class="fas fa-paperclip"></i>
            <span>${escape(text(file.name || label))}</span>
        </div>
    `;
}
const POST_COMPOSE_ATTACH_SECTIONS = [
    { id: 'group', label: 'Groups', icon: 'fa-user-group' },
    { id: 'project', label: 'Projects', icon: 'fa-diagram-project' },
    { id: 'portfolio', label: 'Portfolio', icon: 'fa-briefcase' },
    { id: 'page', label: 'Pages', icon: 'fa-flag' },
    { id: 'event', label: 'Events', icon: 'fa-calendar-days' },
    { id: 'survey', label: 'Surveys', icon: 'fa-clipboard-list' },
    { id: 'photo', label: 'Exposé', icon: 'fa-camera-retro' },
    { id: 'lost-found', label: 'Lost & Found', icon: 'fa-magnifying-glass-location' }
];
const POST_COMPOSE_ENTITY_LINK_MAX = 5;
const normalizeComposerEntityLinks = window.normalizeComposerEntityLinks || (window.KiuSocialEntityModel || {}).normalizeComposerEntityLinks;
const postEntityLinks = window.postEntityLinks || (window.KiuSocialEntityModel || {}).postEntityLinks;
const entityLinkSectionLabel = window.entityLinkSectionLabel || (window.KiuSocialEntityModel || {}).entityLinkSectionLabel;
const entityLinkIcon = window.entityLinkIcon || (window.KiuSocialEntityModel || {}).entityLinkIcon;
const resolveEntityLinkMeta = window.resolveEntityLinkMeta || (window.KiuSocialEntityModel || {}).resolveEntityLinkMeta;

function renderSectionCommandCenter(activePanel, activeConfig, runtime) {
    // Faculty browse lives in each section hero; pagination is the shared command.
    void activeConfig;
    void runtime;
    return typeof window.KiuSocialPagination?.renderModeControl === 'function'
        ? window.KiuSocialPagination.renderModeControl(activePanel)
        : '';
}
function renderSocialFlashStatus(runtime) {
    const pinWarning = runtime.ui?.pinApiUnavailable ? `
        <div class="social-neo-pin-api-warning home-hover-chip" role="status">
            ${escape(text(runtime.ui?.pinApiBannerMessage || window.KiuSocialPinModel?.PIN_API_BANNER_MESSAGE || 'Pins won\'t save until the platform backend is restarted. Run: npm run stop:local && npm run start:local'))}
        </div>
    ` : '';
    const flash = runtime.flash?.message ? `
        <div class="social-neo-flash ${runtime.flash?.tone === 'danger' ? 'is-danger' : runtime.flash?.tone === 'success' ? 'is-success' : ''}">
            ${escape(text(runtime.flash.message))}
        </div>
    ` : '';
    const status = runtime.error ? `
        <div class="social-neo-flash is-danger">
            ${escape(text(runtime.error))} If the page is running from local files, make sure the platform server is available at ${escape(typeof getKiuPortalBackendUrl === 'function' ? getKiuPortalBackendUrl() : 'http://127.0.0.1:48933')}.
        </div>
    ` : '';
    return pinWarning + flash + status;
}
function renderSocialTopbarRegion(activePanel, activeConfig, user) {
    void activeConfig;
    void user;
    if (isSocialTopbarSkippedPanel(activePanel)) return '';
    if (!isPhoneSocialShortcutsViewport()) return '';
    try {
        try {
            return String(renderSocialShortcutsTopNav(activePanel) || '') || renderSocialShortcutsTopNavFallback(activePanel);
        } catch (error) {
            if (typeof window.renderSocialShortcutsTopNav === 'function') {
                return String(window.renderSocialShortcutsTopNav(activePanel) || '') || renderSocialShortcutsTopNavFallback(activePanel);
            }
            throw error;
        }
    } catch (error) {
        console.warn('[Social] Top shortcuts nav failed to render; using fallback.', error);
        return renderSocialShortcutsTopNavFallback(activePanel);
    }
}
function isPhoneSocialShortcutsViewport() {
    try {
        if (typeof window.isSocialShortcutsTopNavViewport === 'function') {
            return Boolean(window.isSocialShortcutsTopNavViewport());
        }
        try { return Boolean(isSocialShortcutsTopNavViewport()); } catch (error) {}
        if (typeof window.matchMedia === 'function') {
            return window.matchMedia('(max-width: 1024px)').matches;
        }
    } catch (error) {}
    return Number(window.innerWidth || 0) <= 1024;
}
function socialWorkspaceTopNavPanelsFallback() {
    return [
        { id: 'feed', label: 'Home', icon: 'fa-house' },
        { id: 'community', label: 'People', icon: 'fa-user-group' },
        { id: 'groups', label: 'Groups', icon: 'fa-layer-group' },
        { id: 'workspace', label: 'Projects', icon: 'fa-diagram-project' },
        { id: 'projects', label: 'Portfolio', icon: 'fa-briefcase' },
        { id: 'research', label: 'Research', icon: 'fa-book-open' },
        { id: 'pages', label: 'Pages', icon: 'fa-flag' },
        { id: 'events', label: 'Events', icon: 'fa-calendar-days' },
        { id: 'surveys', label: 'Surveys', icon: 'fa-clipboard-list' },
        { id: 'photography', label: 'Exposé', icon: 'fa-camera-retro' },
        { id: 'lost-and-found', label: 'Lost & Found', icon: 'fa-magnifying-glass-location' },
        { id: 'messages', label: 'Messages', icon: 'fa-comments' },
        { id: 'alerts', label: 'Alerts', icon: 'fa-bell' }
    ];
}
function renderSocialShortcutsTopNavFallback(activePanel) {
    const escapeHtml = typeof escape === 'function' ? escape : (value) => String(value ?? '');
    const active = text(activePanel || '');
    const resolvePanels = window.activeNavPanels || window.KiuSocialPanelModel?.activeNavPanels;
    const panels = typeof resolvePanels === 'function'
        ? resolvePanels()
        : socialWorkspaceTopNavPanelsFallback();
    return `
        <nav class="social-shortcuts-top-nav" aria-label="Social Workspace">
            <div class="social-shortcuts-top-nav-row">
                ${panels.map((panel) => {
                    const panelId = text(panel?.id || '');
                    const isActive = active === panelId;
                    return `
                    <button type="button" class="social-shortcuts-top-nav-btn${isActive ? ' is-active' : ''}" data-action="panel-${escapeHtml(panelId)}">
                        <i class="fas ${escapeHtml(text(panel?.icon || ''))}" aria-hidden="true"></i>
                        <span>${escapeHtml(text(panel?.label || panelId))}</span>
                    </button>`;
                }).join('')}
            </div>
        </nav>
    `;
}
function bindSocialShortcutsViewportWatcher() {
    if (window.__kiuSocialShortcutsViewportBound) return;
    window.__kiuSocialShortcutsViewportBound = true;
    try {
        const mql = window.matchMedia('(max-width: 1024px)');
        const onChange = () => {
            try {
                const host = typeof root === 'function' ? root() : document.getElementById('public-social-root');
                if (host) host.__kiuLastRenderSignature = '';
                if (typeof queueRender === 'function') queueRender('social-shortcuts-viewport');
                else if (typeof window.renderSocialPageNow === 'function') window.renderSocialPageNow('social-shortcuts-viewport');
            } catch (error) {}
        };
        if (typeof mql.addEventListener === 'function') mql.addEventListener('change', onChange);
        else if (typeof mql.addListener === 'function') mql.addListener(onChange);
    } catch (error) {}
}
function updateSocialShortcutsScrollIndicator(nav, row, indicator) {
    if (!nav || !row || !indicator) return;
    const overflow = Math.max(0, row.scrollWidth - row.clientWidth);
    const hasOverflow = overflow > 1;
    indicator.hidden = !hasOverflow;
    if (!hasOverflow) return;
    const trackWidth = Math.max(1, Math.round(indicator.getBoundingClientRect().width || nav.clientWidth));
    const thumbWidth = Math.max(28, Math.round(trackWidth * (row.clientWidth / row.scrollWidth)));
    const maxOffset = Math.max(0, trackWidth - thumbWidth);
    const progress = Math.max(0, Math.min(1, row.scrollLeft / overflow));
    const thumb = indicator.firstElementChild;
    if (!thumb) return;
    thumb.style.width = `${thumbWidth}px`;
    thumb.style.transform = `translateX(${Math.round(maxOffset * progress)}px)`;
}
function bindSocialShortcutsScrollIndicator(portal) {
    const nav = portal?.querySelector?.('.social-shortcuts-top-nav');
    const row = nav?.querySelector?.('.social-shortcuts-top-nav-row');
    if (!nav || !row) return;
    let indicator = nav.querySelector('[data-social-shortcuts-scroll-indicator]');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'social-shortcuts-top-nav-scroll-indicator';
        indicator.dataset.socialShortcutsScrollIndicator = '1';
        indicator.setAttribute('aria-hidden', 'true');
        indicator.innerHTML = '<span class="social-shortcuts-top-nav-scroll-thumb"></span>';
        nav.appendChild(indicator);
    }
    const update = () => updateSocialShortcutsScrollIndicator(nav, row, indicator);
    if (row.__kiuShortcutsScrollIndicatorBound) {
        update();
        return;
    }
    row.__kiuShortcutsScrollIndicatorBound = true;
    row.addEventListener('scroll', update, { passive: true });
    if (typeof ResizeObserver === 'function') {
        const observer = new ResizeObserver(update);
        observer.observe(row);
        observer.observe(nav);
        row.__kiuShortcutsScrollIndicatorObserver = observer;
    }
    update();
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(update);
}
/** Body-level host so fixed chrome is not trapped by #app-content stacking/contain (scrolls away). */
function syncSocialShortcutsTopNavPortal(markup) {
    const html = String(markup || '').trim();
    let portal = document.getElementById('social-shortcuts-top-nav-portal');
    if (!html) {
        if (portal) {
            portal.innerHTML = '';
            portal.hidden = true;
            portal.setAttribute('aria-hidden', 'true');
            delete portal.__kiuLastMarkup;
        }
        document.body.classList.remove('social-has-shortcuts-top-nav');
        return;
    }
    const existingRow = portal?.querySelector?.('.social-shortcuts-top-nav-row');
    const priorScrollLeft = existingRow && Number.isFinite(existingRow.scrollLeft)
        ? existingRow.scrollLeft
        : null;
    if (!portal) {
        portal = document.createElement('div');
        portal.id = 'social-shortcuts-top-nav-portal';
        portal.addEventListener('click', (event) => {
            const fn = window.__kiuSocialPageHandleClick;
            if (typeof fn === 'function') fn(event);
        });
        document.body.appendChild(portal);
    }
    portal.hidden = false;
    portal.removeAttribute('aria-hidden');
    if (portal.__kiuLastMarkup !== html) {
        portal.innerHTML = html;
        portal.__kiuLastMarkup = html;
    }
    const nextRow = portal.querySelector('.social-shortcuts-top-nav-row');
    if (nextRow && priorScrollLeft !== null) {
        const maxScrollLeft = Math.max(0, nextRow.scrollWidth - nextRow.clientWidth);
        nextRow.scrollLeft = Math.max(0, Math.min(maxScrollLeft, priorScrollLeft));
    }
    bindSocialShortcutsScrollIndicator(portal);
    if (nextRow && priorScrollLeft !== null && typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => {
            const maxScrollLeft = Math.max(0, nextRow.scrollWidth - nextRow.clientWidth);
            nextRow.scrollLeft = Math.max(0, Math.min(maxScrollLeft, priorScrollLeft));
            bindSocialShortcutsScrollIndicator(portal);
        });
    }
    document.body.classList.add('social-has-shortcuts-top-nav');
}
function renderActivePanelMarkup(activePanel) {
    return activePanel === 'community'
        ? renderCommunityPanel()
        : activePanel === 'groups'
            ? renderGroupsPanel()
            : activePanel === 'workspace'
                ? renderProjectsWorkspacePanelClassic()
                : activePanel === 'projects'
                    ? renderProjectsPanel()
                : activePanel === 'pages'
                    ? renderPagesPanel()
                    : activePanel === 'events'
                        ? renderEventsPanel()
                        : activePanel === 'surveys'
                            ? renderSurveysPanel()
                        : activePanel === 'research'
                            ? renderResearchPanel()
                        : activePanel === 'photography'
                            ? renderPhotographyPanel()
                        : activePanel === 'lost-and-found'
                            ? renderLostFoundPanel()
                            : activePanel === 'messages'
                                ? renderMessagesPanel()
                                : activePanel === 'alerts'
                                    ? renderAlertsPanel()
                                    : activePanel === 'profile'
                                        ? renderProfilePageBody()
                                        : renderFeedPanel();
}
function renderToastArea() {
    const toasts = (typeof getPortalSocialToastItems === 'function' ? getPortalSocialToastItems() : []) || [];
    if (!toasts.length) return '';
    return `<div class="social-neo-toast-container">
        ${toasts.map((toast) => `
            <article class="social-neo-toast ${toast.dismissing ? 'is-dismissing' : ''}" data-action="toast-dismiss" data-toast-id="${escape(toast.id)}">
                <div class="social-neo-toast-icon"><i class="fas ${escape(toast.icon || 'fa-bell')}"></i></div>
                <div class="social-neo-toast-content">
                    <div class="social-neo-toast-title">${escape(toast.title)}</div>
                    <div class="social-neo-toast-text">${escape(toast.text)}</div>
                </div>
                <button class="social-neo-toast-close" type="button" data-action="toast-dismiss" data-toast-id="${escape(toast.id)}"><i class="fas fa-times"></i></button>
            </article>
        `).join('')}
    </div>`;
}

// Dialog kind -> deferred module router: social-dialog-router.js
const renderDialog = (typeof window.createKiuSocialDialogRenderer === 'function'
    ? window.createKiuSocialDialogRenderer({
        text,
        state,
        activeDialog,
        queueDeferredModuleRender,
        lostFoundItems,
        normalizeLostFoundItem,
        surveyById,
        renderEntityDetailDialog: typeof window.renderEntityDetailDialog === 'function'
            ? window.renderEntityDetailDialog
            : () => '',
        renderWorkspaceOwnedDialogStub: renderWorkspaceOwnedDialog,
        hasSocialPhotographyModule,
        hasSocialGroupsModule,
        ensureSocialGroupsModule,
        hasSocialPagesModule,
        ensureSocialPagesModule,
        hasSocialFeedModule,
        ensureSocialFeedModule,
        hasSocialEventsModule,
        ensureSocialEventsModule,
        hasSocialMessagesModule,
        ensureSocialMessagesModule,
        hasSocialProfileModule,
        ensureSocialProfileModule,
        hasSocialLostFoundModule,
        ensureSocialLostFoundModule,
        hasSocialSurveysModule,
        ensureSocialSurveysModule,
        hasSocialResearchModule,
        ensureSocialResearchModule,
        hasSocialWorkspaceModule,
        ensureSocialWorkspaceModule
    })
    : () => '');

function renderStoryViewer() {
    return '';
}
function renderStoryComposer() {
    return '';
}
const collectCommentReactionFingerprint = window.collectCommentReactionFingerprint || (window.KiuSocialFingerprintModel || {}).collectCommentReactionFingerprint;
const summarizeCommentReactions = window.summarizeCommentReactions || (window.KiuSocialFingerprintModel || {}).summarizeCommentReactions;
const buildFeedFingerprint = window.buildFeedFingerprint || (window.KiuSocialFingerprintModel || {}).buildFeedFingerprint;
const buildRelationshipsFingerprint = window.buildRelationshipsFingerprint || (window.KiuSocialFingerprintModel || {}).buildRelationshipsFingerprint;
const buildLostFoundFingerprint = window.buildLostFoundFingerprint || (window.KiuSocialFingerprintModel || {}).buildLostFoundFingerprint;
const buildSurveysFingerprint = window.buildSurveysFingerprint || (window.KiuSocialFingerprintModel || {}).buildSurveysFingerprint;
const buildEventsFingerprint = window.buildEventsFingerprint || (window.KiuSocialFingerprintModel || {}).buildEventsFingerprint;
const buildGroupsFingerprint = window.buildGroupsFingerprint || (window.KiuSocialFingerprintModel || {}).buildGroupsFingerprint;
const buildDirectoryFingerprint = window.buildDirectoryFingerprint || (window.KiuSocialFingerprintModel || {}).buildDirectoryFingerprint;
const buildReportsFingerprint = window.buildReportsFingerprint || (window.KiuSocialFingerprintModel || {}).buildReportsFingerprint;
const buildNotificationsFingerprint = window.buildNotificationsFingerprint || (window.KiuSocialFingerprintModel || {}).buildNotificationsFingerprint;
const buildChatsFingerprint = window.buildChatsFingerprint || (window.KiuSocialFingerprintModel || {}).buildChatsFingerprint;
const buildProjectsFingerprint = window.buildProjectsFingerprint || (window.KiuSocialFingerprintModel || {}).buildProjectsFingerprint;
const buildPortfolioFingerprint = window.buildPortfolioFingerprint || (window.KiuSocialFingerprintModel || {}).buildPortfolioFingerprint;
const buildPhotographyUiFingerprint = window.buildPhotographyUiFingerprint || (window.KiuSocialFingerprintModel || {}).buildPhotographyUiFingerprint;
const buildPagesFingerprint = window.buildPagesFingerprint || (window.KiuSocialFingerprintModel || {}).buildPagesFingerprint;
function renderSocialPageNow(reason = 'manual') {
    // Social render orchestration is the single owner of assembly starts.
    // Section runtimes retain standalone fallbacks but stay passive here.
    window.__kiuSocialAssemblyMotionOwner = 'render-pipeline';
    clearTimeout(renderDebounceTimer);
    const renderCallback = () => {
        const host = root();
        if (!host) return;
        window.__kiuSocialLiteRenderPage = renderSocialPageNow;
        applyShellIdentity();
        const runtime = state();
        ensureWorkspaceNavCollapsedState(runtime);
        syncWorkspaceNavCollapsedClass(runtime.ui.workspaceNavCollapsed);
        if (/^project-(settings-saved|task-created|task-updated|budget-|created|left)/.test(reason)) {
            clearProjectTabPaneCache(text(runtime.ui?.activeProjectId || ''));
        }
        if (text(runtime.ui?.projectTab || '') === 'chat' && /^(message-|chat-upsert|chat-read|group-thread-|thread-jump-latest|message-file|group-panel-file-filter|project-chat-ready|project-open-chat)/.test(reason)) {
            const projectId = text(runtime.ui?.activeProjectId || '');
            const cache = runtime.ui?.__projectTabPaneCache;
            if (projectId && cache && typeof cache === 'object') {
                delete cache[projectTabPaneCacheKey(projectId, 'chat')];
            }
        }
        const activePanel = text(runtime.ui?.activePanel || 'feed') || 'feed';
        if (typeof window.KiuSocialPagination?.syncPanel === 'function') {
            window.KiuSocialPagination.syncPanel(activePanel);
        }
        const activeConfig = (getSocialPanelConfig(activePanel, runtime)[activePanel]) || getSocialPanelConfig('feed', runtime).feed;
        const user = currentUser() || {};
        const shell = ensureSocialShell(host);
        const renderSignature = buildSocialRenderSignature(activePanel, runtime);
        const forceCenterOnly = Boolean(host.__kiuForceCenterOnly);
        host.__kiuForceCenterOnly = false;
        const forceRender = isSocialForceRenderReason(reason);
        if (!forceRender && reason !== 'boot' && !/-module$/.test(reason) && host.__kiuLastRenderSignature === renderSignature) {
            syncSocialOverlayLock();
            if (typeof window.renderSocialCallOverlay === 'function') window.renderSocialCallOverlay();
            // Flash can be queued while signature is unchanged (e.g. withBusy errors during an open dialog).
            if (runtime.flash?.message) patchSocialFlash();
            return;
        }
        const renderPlan = resolveSocialRenderPlan(reason, activePanel, runtime);
        bindSocialShortcutsViewportWatcher();
        const useShortcutsTopNav = isPhoneSocialShortcutsViewport()
            && !isSocialTopbarSkippedPanel(activePanel);
        if (isSocialTopbarSkippedPanel(activePanel)) {
            renderPlan.topbar = false;
        } else if (useShortcutsTopNav) {
            // Keep shortcuts top bar mounted on phone even when a deferred
            // module forces a center-only pass.
            renderPlan.topbar = true;
        }
        if (isSocialCommandSkippedPanel(activePanel)) {
            renderPlan.command = false;
        }
        if (forceRender && renderPlan.center && shell.center) {
            delete shell.center.__kiuLastMarkup;
        }
        if (forceCenterOnly) {
            renderPlan.flash = false;
            if (!useShortcutsTopNav) renderPlan.topbar = false;
            renderPlan.command = false;
            renderPlan.workspaceNav = false;
            renderPlan.drawer = false;
            renderPlan.mobileTab = false;
            renderPlan.toast = false;
            if (!activeDialog()) {
                renderPlan.dialog = false;
                renderPlan.storyViewer = false;
                renderPlan.storyComposer = false;
            }
        }
        const interactionSnapshot = captureInteractionState(host);
        shell.root.dataset.role = text(currentUser()?.role || 'student');
        shell.root.dataset.panel = activePanel;
        if (renderPlan.flash) setSocialRegionMarkup(shell.flash, renderSocialFlashStatus(runtime));
        if (renderPlan.topbar || useShortcutsTopNav) {
            const topbarHtml = renderSocialTopbarRegion(activePanel, activeConfig, user);
            // Keep in-tree region empty: body portal owns the fixed chrome (bottom-nav twin).
            setSocialRegionMarkup(shell.topbar, '');
            syncSocialShortcutsTopNavPortal(topbarHtml);
        } else if (isSocialTopbarSkippedPanel(activePanel) || !isPhoneSocialShortcutsViewport()) {
            setSocialRegionMarkup(shell.topbar, '');
            syncSocialShortcutsTopNavPortal('');
        }
        if (renderPlan.command) {
            setSocialRegionMarkup(shell.command, renderSectionCommandCenter(activePanel, activeConfig, runtime));
        } else if (isSocialCommandSkippedPanel(activePanel)) {
            setSocialRegionMarkup(shell.command, '');
        }
        if (!forceCenterOnly) {
            setSocialRegionMarkup(shell.workspaceNavReveal, renderShellWorkspaceNavReveal());
            setSocialRegionMarkup(shell.workspaceNav, renderShellWorkspaceNav(activePanel));
        }
        if (renderPlan.center) {
            const prehideCenter = shouldPrehideCenterForAssembly(reason);
            if (prehideCenter) document.body?.classList.add('social-center-assembly-prehide');
            setSocialRegionMarkup(shell.center, renderActivePanelMarkup(activePanel));
            if (typeof window.KiuSocialPagination?.decorate === 'function') {
                window.KiuSocialPagination.decorate(shell.center, activePanel);
            }
            /* Immediately anchor scroll to prevent visible jump between
               innerHTML and the full restoreInteractionState call below. */
            if (!socialScrollLockActive()) {
                try { window.scrollTo(interactionSnapshot.windowX || 0, interactionSnapshot.windowY || 0); } catch (e) {}
            } else {
                const cs = getSocialCenterScroller(root());
                if (cs && Number.isFinite(interactionSnapshot.centerScrollY)) cs.scrollTop = interactionSnapshot.centerScrollY;
            }
            scheduleSocialCenterScrollRepair(host);
            if (activePanel === 'events' || activePanel === 'pages' || activePanel === 'lost-and-found' || activePanel === 'projects' || activePanel === 'surveys') syncEventDescScrollRails(host);
            if (typeof window.enhanceUniversalPickers === 'function') {
                try { window.enhanceUniversalPickers(shell.center); } catch (e) {}
            }
            if (activePanel === 'photography' && typeof window.bindPhotographyGridImages === 'function') {
                try { window.bindPhotographyGridImages(shell.center); } catch (e) {}
            }
            if (text(runtime.ui?.researchReaderId || '') && typeof window.scheduleResearchFileViewerMount === 'function') {
                try { window.scheduleResearchFileViewerMount(); } catch (e) {}
            }
            // Start assembly under the shell-loading veil (staging + active) before
            // revealShell lifts it — otherwise one paint shows fully loaded center.
            const deferBootReveal = reason === 'boot' || reason === 'social-bootstrap';
            if (deferBootReveal) {
                window.__kiuSocialBootAwaitingAssemblyReveal = true;
            }
            switch (text(activePanel || '')) {
                case 'feed':
                    queueSocialHomeMotion(shell.center, activePanel, reason);
                    break;
                case 'community':
                    queueSocialCommunityMotion(shell.center, activePanel, reason);
                    break;
                case 'groups':
                    queueSocialGroupsMotion(shell.center, activePanel, reason);
                    break;
                case 'projects':
                    queueSocialProjectsMotion(shell.center, activePanel, reason);
                    break;
                case 'workspace':
                    queueSocialPortfolioMotion(shell.center, activePanel, reason);
                    break;
                case 'research':
                    queueSocialResearchMotion(shell.center, activePanel, reason);
                    break;
                case 'pages':
                    queueSocialPagesMotion(shell.center, activePanel, reason);
                    break;
                case 'events':
                    queueSocialEventsMotion(shell.center, activePanel, reason);
                    break;
                case 'lost-and-found':
                    queueSocialLostFoundMotion(shell.center, activePanel, reason);
                    break;
                case 'messages':
                    queueSocialMessagesMotion(shell.center, activePanel, reason);
                    break;
                case 'alerts':
                    queueSocialAlertsMotion(shell.center, activePanel, reason);
                    break;
                case 'surveys':
                    queueSocialSurveysMotion(shell.center, activePanel, reason);
                    break;
                case 'photography':
                    queueSocialPhotographyMotion(shell.center, activePanel, reason);
                    break;
                default:
                    revealShell();
                    break;
            }
            // Boot: keep veil until assembly run() calls __kiuSocialRevealShellNow.
            if (!deferBootReveal) {
                revealShell();
            } else if (window.__kiuSocialBootAwaitingAssemblyReveal) {
                // Long fail-safe only — never uncover on double-rAF before deferred start claims active.
                window.setTimeout(() => {
                    if (!window.__kiuSocialBootAwaitingAssemblyReveal) return;
                    if (/\b\S+-assembly-active\b/.test(document.body?.className || '')) return;
                    releaseSocialBootShellReveal();
                }, 2500);
            }
        }
        if (renderPlan.drawer) setSocialRegionMarkup(shell.drawer, renderShellDrawer(activePanel));
        if (renderPlan.mobileTab) setSocialRegionMarkup(shell.mobileTab, renderMobileTabBar(activePanel));
        if (renderPlan.toast) setSocialRegionMarkup(shell.toast, renderToastArea());
        if (renderPlan.dialog) {
            const portfolioEditorSnapshot = text(activeDialog()?.type || '') === 'portfolio-editor'
                ? capturePortfolioEditorSnapshot()
                : null;
            const stackSynced = trySyncProjectTaskGraphStackDialog(shell.dialog, runtime);
            if (!stackSynced) {
                setSocialRegionMarkup(shell.dialog, renderDialog());
            }
            bindPhotographyUploadDialogFileInput();
            if (typeof window.enhanceUniversalPickers === 'function') {
                try { window.enhanceUniversalPickers(shell.dialog); } catch (e) {}
            }
            if (text(activeDialog()?.type || '') === 'survey-results') {
                window.requestAnimationFrame(() => syncSurveyResultsDialog(host));
            }
            restorePortfolioEditorSnapshot(portfolioEditorSnapshot);
            const dialogKind = text(activeDialog()?.type || '');
            if (!stackSynced && (dialogKind === 'project-task-graph' || shouldRenderProjectTaskGraphStack(runtime, dialogKind))) {
                bindProjectTaskGraphDrag();
                bindProjectTaskGraphResizeObserver();
            }
            if (stackSynced && dialogKind === 'project-task-graph') {
                bindProjectTaskGraphDrag();
                bindProjectTaskGraphResizeObserver();
            }
        }
        if (renderPlan.storyViewer) setSocialRegionMarkup(shell.storyViewer, renderStoryViewer());
        if (renderPlan.storyComposer) setSocialRegionMarkup(shell.storyComposer, renderStoryComposer());
        syncOverlayPortalVisibility();
        pruneStaleSocialOverlayState();
        bindFileInputs();
        enhanceSocialAccessibility(host);
        const focusPostId = postKey(runtime.ui?.commentReplyFocusPostId || '');
        if (focusPostId && /^comment-reply/.test(reason)) {
            focusCommentComposeInput(host, focusPostId);
            delete runtime.ui.commentReplyFocusPostId;
        }
        bindEvents();
        if (!window.__kiuSocialBootAwaitingAssemblyReveal) revealShell();
        const wasScrollLocked = interactionSnapshot.layoutScrollLock;
        syncSocialScrollLayout(host);
        scheduleSocialCenterScrollRepair(host);
        const scrollLockChanged = wasScrollLocked !== socialScrollLockActive();
        if (scrollLockChanged) {
            migrateSocialScrollOnLockChange(wasScrollLocked, host);
            if (socialScrollLockActive()) {
                interactionSnapshot.layoutScrollLock = true;
                interactionSnapshot.centerScrollY = getSocialCenterScroller(host)?.scrollTop ?? interactionSnapshot.windowY;
                interactionSnapshot.deferWindowScroll = true;
            }
        }
        const isDialogRender = reason === 'dialog-close' || /^dialog-/.test(reason)
            || (text(activeDialog()?.type || '') === 'portfolio-editor' && /^portfolio-/.test(reason));
        const tabChange = SOCIAL_TAB_SCROLL_RESET_RE.test(reason) && reason !== 'panel';
        const panelChange = reason === 'panel' || tabChange;
        const shouldResetScroll = SOCIAL_TAB_SCROLL_RESET_RE.test(reason);
        const willDeferCenter = !isDialogRender && !panelChange
            && (/^connection-/.test(reason) || interactionSnapshot.deferWindowScroll
                || (scrollLockChanged && socialScrollLockActive()));
        if (shouldResetScroll) {
            scrollSocialCenterTo(0, 'auto', host);
        }
        restoreInteractionState(host, interactionSnapshot, {
            skipWindow: isDialogRender || interactionSnapshot.deferWindowScroll || panelChange || shouldResetScroll || scrollLockChanged,
            skipCenterScroll: panelChange || willDeferCenter || shouldResetScroll || scrollLockChanged
        });
        if (willDeferCenter) {
            scheduleDeferredWindowScrollRestore(host, interactionSnapshot);
        } else if (!isDialogRender) {
            delete host.__kiuInteractionAnchorUserId;
        }
        const skipTransparencyRefresh = reason === 'project-tab' || SOCIAL_SKIP_TRANSPARENCY_REFRESH_RE.test(reason);
        if (!skipTransparencyRefresh && typeof window.queueHeavySurfaceObservationRefresh === 'function') {
            try { window.queueHeavySurfaceObservationRefresh(); } catch (error) {}
        }
        const transparencyRoots = [
            renderPlan.flash ? shell.flash : null,
            renderPlan.topbar ? shell.topbar : null,
            renderPlan.command ? shell.command : null,
            renderPlan.center ? shell.center : null,
            renderPlan.drawer ? shell.drawer : null,
            renderPlan.mobileTab ? shell.mobileTab : null,
            renderPlan.toast ? shell.toast : null,
            renderPlan.dialog ? shell.dialog : null,
            renderPlan.storyViewer ? shell.storyViewer : null,
            renderPlan.storyComposer ? shell.storyComposer : null
        ].filter(Boolean);
        if (!skipTransparencyRefresh && (reason === 'boot' || reason === 'social-bootstrap')) {
            syncSocialVisualShell();
        } else if (!skipTransparencyRefresh) {
            // Sync call first to prevent flash of unstyled/transparent surfaces
            // during panel switches. The queued refresh handles edge cases.
            if (/^panel-/.test(reason)) {
                syncSocialVisualShell();
            }
            if (typeof window.queueLuxuryTransparencyRefresh === 'function') {
                try { window.queueLuxuryTransparencyRefresh(undefined, { roots: transparencyRoots }); } catch (error) {}
            } else if (typeof window.refreshLuxuryTransparencySurfaces === 'function') {
                try { window.refreshLuxuryTransparencySurfaces(undefined, { roots: transparencyRoots }); } catch (error) {}
            }
        }
        if (typeof window.__kiuSocialMobileSync === 'function') {
            try { window.__kiuSocialMobileSync(); } catch (error) {}
        }
        scheduleDeferredDesktopModulePrefetch();
        scheduleDirectoryPrefetch();
        host.__kiuLastRenderSignature = renderSignature;
        syncSocialOverlayLock();
        if (reason === 'project-tab') {
            host.querySelector('.social-projects-shell')?.classList.remove('is-tab-switching');
        }
        if (state().ui?.callOpen || (state().calls || []).some((entry) => text(entry?.status) === 'ringing' && text(entry?.startedBy) !== text(currentUser()?.id))) {
            ensureSocialMessagesModule?.().catch(() => null);
            window.requestAnimationFrame(() => {
                try {
                    if (typeof window.renderSocialCallOverlay === 'function') window.renderSocialCallOverlay();
                    if (typeof attachPortalCallLocalPreview === 'function') attachPortalCallLocalPreview();
                    if (typeof attachPortalCallRemotePreview === 'function') attachPortalCallRemotePreview();
                } catch (error) {
                    console.warn('[Social] Could not attach call previews.', error);
                }
            });
        } else if (typeof window.renderSocialCallOverlay === 'function') {
            window.renderSocialCallOverlay();
        }
        const activeChatId = text(state().ui?.activeChatId || '');
        const jumpMessageId = text(state().ui?.groupThreadJumpMessageByChat?.[activeChatId] || '');
        if (activeChatId && jumpMessageId) {
            window.requestAnimationFrame(() => {
                const node = host.querySelector(`#${messageAnchorId(activeChatId, jumpMessageId)}`);
                if (node) node.scrollIntoView({ block: 'center', behavior: 'smooth' });
            });
        }
    };
    // Docs actions render synchronously so a subsequent center:false render
    // (toast/flash/dialog-close) can't clear the pending timer and swallow
    const fastPath = reason === 'boot' || /^(comment-|post-react|post-save|post-pin|post-updated|post-deleted|post-shared|connection-|page-follow|page-report|flash|dialog-|survey-closed|survey-deleted|survey-response-submitted|survey-created|survey-take-|survey-results-|research-tab|research-create-open|research-input|research-reader-|research-saved|research-deleted|research-created|social-bootstrap|event-rsvp|event-created|event-deleted|event-rsvp-optimistic|event-rsvp-rollback|group-membership|group-request|group-member-removed|group-updated|group-left|notification-read|notification-removed|notifications-refresh|chat-read|chat-upsert|message-sent|message-delete|chat-hide|panel-|feed-tab|feed-scope|community-tab|pages-tab|groups-tab|events-tab|directory-search|directory-role|report-resolve|mobile-nav|alerts-filter|messages-filter|profile-view|project-|projects-back)/.test(reason);
    renderDebounceTimer = setTimeout(renderCallback, fastPath ? 0 : 80);
}

        const api = {
            reactionEmoji,
            reactionLabel,
            renderPostReactionMetrics,
            commentReactionType,
            renderInlineReplyForm,
            renderCommentReactionButtons,
            renderCommentThread,
            findCommentInThread,
            renderCommentNode,
            patchCommentReactions,
            patchPostSaveButtons,
            patchPhotographyFeedReactions,
            openInlineReply,
            closeInlineReply,
            patchCommentDialogCount,
            patchPhotographyFollowButtons,
            refreshPhotographyPanelStage,
            portfolioEditorFormRoot,
            capturePortfolioEditorSnapshot,
            restorePortfolioEditorSnapshot,
            patchPortfolioSaveStatus,
            patchPortfolioStartedPill,
            patchPortfolioSectionToggle,
            patchPortfolioPublishVisibility,
            patchPortfolioSection,
            syncPortfolioEditorInput,
            patchEventRsvpButtons,
            getSocialPageRecord,
            pageFollowerIdsFor,
            pageAdminIdsFor,
            buildPageMembersList,
            shouldPatchPageComposeBlock,
            patchSocialFlash,
            patchPageFollowState,
            patchPageComposeBlock,
            patchPostReactions,
            patchCommentReactionsByIds,
            deleteCommentInline,
            readFileAsDataUrl,
            optimizeEventCoverFile,
            setPanel,
            finalizeSetPanel,
            setActiveChat,
            focusFeed,
            focusRestoreSelector,
            rememberInteractionAnchor,
            interactionAnchorNode,
            socialScrollLockMedia,
            isSocialRouteDesktopScroll,
            socialScrollLockActive,
            getSocialCenterScroller,
            scrollSocialCenterTo,
            scrollSocialCenterElementIntoView,
            bindFileInputs,
            renderFileChip,
            renderSectionCommandCenter,
            renderSocialFlashStatus,
            renderSocialTopbarRegion,
            renderActivePanelMarkup,
            renderToastArea,
            renderStoryViewer,
            renderStoryComposer,
            renderSocialPageNow,
            renderDialog,
        };
        Object.assign(window, api);
        window.__kiuRenderDialog = renderDialog;
        return api;
    };
})();
