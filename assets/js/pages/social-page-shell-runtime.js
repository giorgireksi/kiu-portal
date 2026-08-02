/* Social page shell / messages-inbox scroll / workspace-nav / group-leave helpers.
 * Peeled from social-page.js (Wave 15 Structure 10). Load eager before social-page.js.
 */
(function initSocialPageShellRuntime() {
    'use strict';
    if (window.__KIU_SOCIAL_PAGE_SHELL_LOADED) return;
    window.__KIU_SOCIAL_PAGE_SHELL_LOADED = true;

    window.__kiuCreateSocialPageShellApi = function createKiuSocialPageShellApi(deps = {}) {
        const d = deps;
        function __dep(name) {
            return function (...a) {
                const fn = d[name] || window[name];
                if (typeof fn !== 'function') throw new Error('Missing social shell dep: ' + name);
                return fn.apply(this, a);
            };
        }
        const text = __dep('text');
        const state = __dep('state');
        const root = __dep('root');
        const escape = __dep('escape');
        const activeNavPanels = __dep('activeNavPanels');
        const activeDialog = __dep('activeDialog');
        const getSocialCenterScroller = __dep('getSocialCenterScroller');
        const socialScrollLockActive = __dep('socialScrollLockActive');
        const isSocialRouteDesktopScroll = __dep('isSocialRouteDesktopScroll');
        const scrollSocialCenterTo = __dep('scrollSocialCenterTo');
        const getSocialCenterContentScrollHeight = __dep('getSocialCenterContentScrollHeight');
        const getSocialCenterMaxScroll = __dep('getSocialCenterMaxScroll');
        const getSocialCenterViewportHeight = __dep('getSocialCenterViewportHeight');
        const socialCenterHasLiveScrollRoom = __dep('socialCenterHasLiveScrollRoom');
        const clearSocialCenterScrollBounds = __dep('clearSocialCenterScrollBounds');
        const restoreInteractionState = __dep('restoreInteractionState');
        const ensureSocialOverlayPortal = __dep('ensureSocialOverlayPortal');
        const shellIdentitySignature = __dep('shellIdentitySignature');
        const currentUser = __dep('currentUser');
        const currentFacultyCode = __dep('currentFacultyCode');
        const syncSocialVisualShell = __dep('syncSocialVisualShell');
        const renderSocialPageNow = __dep('renderSocialPageNow');
        const invalidateSocialRenderCache = __dep('invalidateSocialRenderCache');
        const createSocialLazyStub = __dep('createSocialLazyStub');
        const hasSocialGroupsModule = __dep('hasSocialGroupsModule');
        const ensureSocialGroupsModule = __dep('ensureSocialGroupsModule');
        const WORKSPACE_NAV_COLLAPSED_KEY = d.WORKSPACE_NAV_COLLAPSED_KEY ?? window.WORKSPACE_NAV_COLLAPSED_KEY;
        const ROOT_ID = d.ROOT_ID ?? window.ROOT_ID ?? 'public-social-root';
        const DIRECTORY_REFRESH_MS = d.DIRECTORY_REFRESH_MS ?? window.DIRECTORY_REFRESH_MS ?? 180;
        const GROUP_INVITE_SEARCH_MS = d.GROUP_INVITE_SEARCH_MS ?? window.GROUP_INVITE_SEARCH_MS ?? 220;

        let socialChromeResizeObserver = null;
        let socialLayoutResizeObserver = null;
        let socialCenterScrollStableFrames = 0;
        let socialCenterWheelForwardBound = false;
        let lastShellSignature = '';
        let socialVisualShellSynced = false;
        let directoryRefreshTimer = 0;
        let groupInviteSearchTimer = 0;
        let projectInviteSearchTimer = 0;
        let pageMembersSearchTimer = 0;
        let eventEditorSearchTimer = 0;

        function readWorkspaceNavCollapsed() {
            try {
                return localStorage.getItem(WORKSPACE_NAV_COLLAPSED_KEY) === '1';
            } catch (error) {
                return false;
            }
        }

        function writeWorkspaceNavCollapsed(collapsed) {
            try {
                localStorage.setItem(WORKSPACE_NAV_COLLAPSED_KEY, collapsed ? '1' : '0');
            } catch (error) {}
        }

        function isWorkspaceNavCollapsed(runtime = state()) {
            if (runtime?.ui && typeof runtime.ui.workspaceNavCollapsed === 'boolean') {
                return runtime.ui.workspaceNavCollapsed;
            }
            return readWorkspaceNavCollapsed();
        }

        function ensureWorkspaceNavCollapsedState(runtime = state()) {
            if (!runtime.ui) runtime.ui = {};
            if (typeof runtime.ui.workspaceNavCollapsed !== 'boolean') {
                runtime.ui.workspaceNavCollapsed = readWorkspaceNavCollapsed();
            }
            return runtime.ui.workspaceNavCollapsed;
        }

        function setWorkspaceNavCollapsed(collapsed) {
            const runtime = state();
            if (!runtime.ui) runtime.ui = {};
            runtime.ui.workspaceNavCollapsed = Boolean(collapsed);
            writeWorkspaceNavCollapsed(runtime.ui.workspaceNavCollapsed);
            syncWorkspaceNavCollapsedClass(runtime.ui.workspaceNavCollapsed);
        }

        function syncWorkspaceNavCollapsedClass(collapsed = isWorkspaceNavCollapsed()) {
            const on = Boolean(collapsed);
            document.body.classList.toggle('social-neo-workspace-nav-collapsed', on);
            const rootNode = document.getElementById('social-neo-root');
            if (rootNode) rootNode.classList.toggle('social-neo-workspace-nav-collapsed', on);
        }

        function renderShellWorkspaceNavReveal() {
            ensureWorkspaceNavCollapsedState();
            syncWorkspaceNavCollapsedClass();
            return `
                <button type="button" class="lux-secondary-btn lux-secondary-btn-sm social-neo-workspace-rail-reveal" data-action="workspace-nav-expand" aria-label="Show workspace navigation" title="Show navigation">
                    <i class="fas fa-angles-right" aria-hidden="true"></i>
                    <span>Nav</span>
                </button>
            `;
        }

        function renderShellWorkspaceNav(activePanel) {
            const panels = activeNavPanels();
            const collapsed = ensureWorkspaceNavCollapsedState();
            syncWorkspaceNavCollapsedClass(collapsed);
            return `
                <aside class="social-neo-workspace-nav" aria-label="Social Workspace navigation" ${collapsed ? 'hidden' : ''}>
                    <section class="social-neo-card social-neo-workspace-nav-card">
                        <div class="social-neo-section-head social-neo-rail-head">
                            <div class="social-neo-rail-head-copy">
                                <strong class="social-neo-rail-title">Social Workspace</strong>
                                <span class="social-neo-rail-copy">Navigate the network by product area.</span>
                            </div>
                            <button type="button" class="lux-secondary-btn lux-secondary-btn-sm social-neo-workspace-nav-collapse-btn" data-action="workspace-nav-collapse" aria-label="Hide workspace navigation" title="Hide navigation">
                                <i class="fas fa-angles-left" aria-hidden="true"></i>
                                <span>Hide</span>
                            </button>
                        </div>
                        <div class="social-neo-sidebar-nav social-neo-workspace-nav-list">
                            ${panels.map((panel) => `
                                <button class="lux-secondary-btn social-neo-side-link social-neo-workspace-nav-btn ${text(activePanel) === panel.id ? 'is-active' : ''}" type="button" data-action="panel-${escape(panel.id)}">
                                    <span class="social-neo-side-main">
                                        <span class="social-neo-side-icon" data-panel-tone="${escape(panel.id)}"><i class="fas ${escape(panel.icon)}"></i></span>
                                        <span class="social-neo-side-copy">
                                            <strong>${escape(panel.label)}</strong>
                                            <small>${escape(panel.helper)}</small>
                                        </span>
                                    </span>
                                    ${panel.count > 0 ? `<em class="social-neo-side-count">${escape(panel.count > 99 ? '99+' : panel.count)}</em>` : ''}
                                </button>
                            `).join('')}
                        </div>
                    </section>
                </aside>
            `;
        }

        function updateSocialMeasuredChrome(host = root()) {
            if (!host) return;
            const flash = host.querySelector('#social-neo-flash-region');
            const topbar = host.querySelector('#social-neo-topbar-region');
            const command = host.querySelector('#social-neo-command-region');
            const measured = (flash?.offsetHeight || 0) + (topbar?.offsetHeight || 0) + (command?.offsetHeight || 0);
            document.documentElement.style.setProperty('--social-measured-chrome', `${measured}px`);
        }
        function syncSocialVisualViewport() {
            const vv = window.visualViewport;
            if (!vv) return;
            const visualHeight = vv.height;
            if (!Number.isFinite(visualHeight) || visualHeight <= 0) {
                document.documentElement.style.removeProperty('--social-visual-height');
                return;
            }
            const appContent = document.getElementById('app-content');
            const contentTop = appContent?.getBoundingClientRect?.().top;
            let available = visualHeight;
            if (Number.isFinite(contentTop)) {
                available = Math.max(0, visualHeight + (vv.offsetTop || 0) - contentTop);
            } else if (document.body.classList.contains('lux-view-as-active')) {
                const viewAsOffset = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--social-view-as-offset')) || 0;
                available = Math.max(0, visualHeight - viewAsOffset);
            }

            document.documentElement.style.setProperty('--social-visual-height', `${Math.round(available)}px`);
        }
        function bindSocialScrollChromeObserver(host = root()) {
            if (!host || typeof ResizeObserver !== 'function') return;
            const onResize = () => {
                updateSocialMeasuredChrome(host);
                if (socialScrollLockActive()) {
                    syncSocialVisualViewport();
                    ensureSocialCenterScrollBounds(host);
                }
            };
            if (!socialChromeResizeObserver) {
                socialChromeResizeObserver = new ResizeObserver(onResize);
            }
            const nodes = [
                host.querySelector('#social-neo-flash-region'),
                host.querySelector('#social-neo-topbar-region'),
                host.querySelector('#social-neo-command-region'),
                document.getElementById('lux-view-as-banner')
            ].filter(Boolean);
            nodes.forEach((node) => {
                if (node.dataset.socialChromeObserved === '1') return;
                node.dataset.socialChromeObserved = '1';
                socialChromeResizeObserver.observe(node);
            });
        }
        function bindSocialLayoutObserver(host = root()) {
            if (!host || typeof ResizeObserver !== 'function') return;
            const onLayoutResize = () => {
                if (!socialScrollLockActive()) return;
                syncSocialVisualViewport();
                updateSocialMeasuredChrome(host);
                ensureSocialCenterScrollBounds(host);
            };
            if (!socialLayoutResizeObserver) {
                socialLayoutResizeObserver = new ResizeObserver(onLayoutResize);
            }
            const shell = host.querySelector('.social-neo-shell');
            const center = getSocialCenterScroller(host);
            [shell, center].filter(Boolean).forEach((node) => {
                if (node.dataset.socialLayoutObserved === '1') return;
                node.dataset.socialLayoutObserved = '1';
                socialLayoutResizeObserver.observe(node);
            });
        }
        function centerScrollOverflows(center) {
            return centerCanScroll(center);
        }
        function isSocialMessagesPanel(host = root()) {
            const rootNode = host?.querySelector?.('#social-neo-root') || host;
            if (text(rootNode?.dataset?.panel) === 'messages') return true;
            const center = getSocialCenterScroller(host);
            return Boolean(center?.querySelector('.social-neo-messages'));
        }
        function isSocialAlertsPanel(host = root()) {
            const rootNode = host?.querySelector?.('#social-neo-root') || host;
            if (text(rootNode?.dataset?.panel) === 'alerts') return true;
            const center = getSocialCenterScroller(host);
            return Boolean(center?.querySelector('.sn-alerts-panel'));
        }
        function isSocialInboxPanel(host = root()) {
            return isSocialMessagesPanel(host) || isSocialAlertsPanel(host);
        }
        const SOCIAL_TOPBAR_SKIPPED_PANELS = new Set([
            'feed',
            'community',
            'groups',
            'workspace',
            'projects',
            'events',
            'surveys',
            'research',
            'photography',
            'lost-and-found',
            'messages',
            'alerts',
            'pages',
            'profile',
        ]);
        const SOCIAL_COMMAND_SKIPPED_PANELS = new Set([
            'messages',
            'alerts',
            'profile',
        ]);

        function isSocialTopbarSkippedPanel(panel) {
            return SOCIAL_TOPBAR_SKIPPED_PANELS.has(text(panel || ''));
        }
        function isSocialCommandSkippedPanel(panel) {
            return SOCIAL_COMMAND_SKIPPED_PANELS.has(text(panel || ''));
        }
        function centerCanScroll(center, shell) {
            if (!center) return false;
            const host = center.closest('#public-social-root') || root();
            if (isSocialInboxPanel(host)) return false;
            const contentH = getSocialCenterContentScrollHeight(center);
            const shellNode = shell || center.closest('.social-neo-shell');
            const bleeds = shellNode
                && center.getBoundingClientRect().bottom > shellNode.getBoundingClientRect().bottom + 1;
            return center.scrollHeight > center.clientHeight + 1
                || contentH > center.clientHeight + 1
                || Boolean(bleeds);
        }
        function getSocialCenterScrollBudget(center, shell) {
            const parentH = center?.parentElement?.clientHeight || 0;
            const shellH = shell ? shell.clientHeight : 0;
            return Math.max(parentH, shellH);
        }
        function syncSocialScrollLayout(host = root()) {
            const shouldLock = isSocialRouteDesktopScroll();
            document.body.classList.toggle('social-neo-scroll-lock', shouldLock);
            const socialRoot = document.getElementById(ROOT_ID);
            if (socialRoot) socialRoot.style.display = shouldLock ? 'flex' : 'block';
            if (shouldLock) {
                // Overlay unlock (restore scroll, then clear fixed body) is owned by
                // syncSocialOverlayLock — do not clear lock artifacts here or the
                // viewport jumps to top on dialog-close / event-deleted.
                syncSocialVisualViewport();
                bindSocialCenterWheelForward();
            } else {
                document.documentElement.style.removeProperty('--social-visual-height');
                clearSocialCenterScrollBounds(host);
            }
            if (!host) return;
            updateSocialMeasuredChrome(host);
            bindSocialScrollChromeObserver(host);
            bindSocialLayoutObserver(host);
            if (shouldLock) ensureSocialCenterScrollBounds(host);
        }
        function migrateSocialScrollOnLockChange(wasLocked, host = root()) {
            if (!host) return;
            const nowLocked = socialScrollLockActive();
            if (wasLocked === nowLocked) return;
            if (nowLocked) {
                scrollSocialCenterTo(window.scrollY || 0, 'auto', host);
                try { window.scrollTo(0, 0); } catch (error) {}
            } else {
                const centerY = getSocialCenterScroller(host)?.scrollTop || 0;
                try { window.scrollTo(0, centerY); } catch (error) {}
                scrollSocialCenterTo(0, 'auto', host);
            }
        }
        function refreshSocialCenterWheelScroll(center, shell, host, deltaY) {
            clearSocialCenterScrollBounds(host);
            ensureSocialCenterScrollBounds(host);
            void center.offsetHeight;
            let maxScroll = getSocialCenterMaxScroll(center, shell);
            let next = Math.max(0, Math.min(maxScroll, center.scrollTop + deltaY));
            if (next === center.scrollTop && deltaY > 0 && socialCenterHasLiveScrollRoom(center)) {
                const viewportH = getSocialCenterViewportHeight(center, shell);
                const liveMax = Math.max(0, Math.max(center.scrollHeight, getSocialCenterContentScrollHeight(center)) - viewportH);
                next = Math.max(0, Math.min(liveMax, center.scrollTop + deltaY));
            }
            return { maxScroll, next };
        }
        function applySocialCenterWheel(center, shell, host, deltaY) {
            ensureSocialCenterScrollBounds(host);
            let maxScroll = getSocialCenterMaxScroll(center, shell);
            let next = Math.max(0, Math.min(maxScroll, center.scrollTop + deltaY));
            if (next === center.scrollTop && deltaY > 0 && socialCenterHasLiveScrollRoom(center)) {
                ({ maxScroll, next } = refreshSocialCenterWheelScroll(center, shell, host, deltaY));
            }
            if (maxScroll <= 1 && !centerCanScroll(center, shell)) return false;
            if (next === center.scrollTop) return false;
            center.scrollTop = next;
            return true;
        }

        /**
         * After package/tree expand, grow center scroll bounds and scroll the social
         * center scroller so the expanded droplist is visible (native scrollIntoView
         * is unreliable under social-neo-scroll-lock).
         */

        function ensureSocialCenterScrollBounds(host = root()) {
            if (!socialScrollLockActive()) {
                clearSocialCenterScrollBounds(host);
                socialCenterScrollStableFrames = 0;
                return false;
            }
            if (isSocialInboxPanel(host)) {
                clearSocialCenterScrollBounds(host);
                socialCenterScrollStableFrames = 0;
                return false;
            }
            const center = getSocialCenterScroller(host);
            const shell = host?.querySelector?.('.social-neo-shell');
            if (!center || !shell || shell.clientHeight <= 0) return false;

            const scrollBudget = getSocialCenterScrollBudget(center, shell);
            const contentScrollHeight = getSocialCenterContentScrollHeight(center);
            const bleedsPastShell = center.getBoundingClientRect().bottom > shell.getBoundingClientRect().bottom + 1;
            const contentTallerThanShell = contentScrollHeight > scrollBudget + 1;
            const scrollWorks = centerCanScroll(center, shell) && !bleedsPastShell;

            if (scrollWorks) {
                socialCenterScrollStableFrames += 1;
                const nativeScrollRoom = center.scrollHeight > center.clientHeight + 1;
                const mergedOverflowHero = Boolean(center.querySelector('.is-merged'));
                if (center.dataset.socialCenterBounded === '1'
                    && socialCenterScrollStableFrames >= 2
                    && nativeScrollRoom
                    && !mergedOverflowHero) {
                    clearSocialCenterScrollBounds(host);
                    socialCenterScrollStableFrames = 0;
                }
                return centerCanScroll(center, shell);
            }

            socialCenterScrollStableFrames = 0;

            if (bleedsPastShell || contentTallerThanShell) {
                const bounded = Math.round(scrollBudget);
                center.style.setProperty('max-height', `${bounded}px`, 'important');
                center.style.setProperty('height', `${bounded}px`, 'important');
                center.style.setProperty('min-height', '0');
                center.style.setProperty('overflow-y', 'auto', 'important');
                center.dataset.socialCenterBounded = '1';
                void center.offsetHeight;
                if (!centerCanScroll(center, shell)) {
                    center.style.removeProperty('height');
                    center.style.setProperty('max-height', `${bounded}px`, 'important');
                    void center.offsetHeight;
                }
                return centerCanScroll(center, shell);
            }

            return false;
        }
        function syncEventDescScrollRails(scope = root()) {
            const host = scope || root();
            if (!host) return;
            const selector = '[data-event-desc-rail], [data-page-desc-rail], [data-page-about-rail], [data-lf-desc-rail], [data-portfolio-title-rail], [data-portfolio-summary-rail], [data-survey-desc-rail]';
            if (!host.querySelector(selector)) return;
            if (typeof window.initLuxScrollRail === 'function') {
                window.initLuxScrollRail(host, { shellSelector: selector });
            }
            if (typeof window.syncLuxScrollRail === 'function') {
                window.syncLuxScrollRail(host, { shellSelector: selector });
                requestAnimationFrame(() => {
                    window.syncLuxScrollRail(host, { shellSelector: selector });
                });
            }
        }
        function scheduleSocialCenterScrollRepair(host = root(), after) {
            if (!host || !socialScrollLockActive()) return;
            if (isSocialInboxPanel(host)) {
                updateSocialMeasuredChrome(host);
                syncSocialVisualViewport();
                clearSocialCenterScrollBounds(host);
                if (typeof after === 'function') after();
                return;
            }
            let attempts = 0;
            const maxAttempts = 12;
            const tick = () => {
                updateSocialMeasuredChrome(host);
                syncSocialVisualViewport();
                const shell = host.querySelector('.social-neo-shell');
                const center = getSocialCenterScroller(host);
                const scrollable = ensureSocialCenterScrollBounds(host) || centerCanScroll(center, shell);
                const shellReady = Boolean(shell && shell.clientHeight > 0);
                if (typeof after === 'function' && scrollable) after();
                attempts += 1;
                if (attempts < maxAttempts && shellReady && !scrollable) {
                    requestAnimationFrame(tick);
                } else if (typeof after === 'function' && shellReady && !scrollable && attempts >= maxAttempts) {
                    after();
                }
            };
            requestAnimationFrame(tick);
            if (document.fonts?.ready) {
                document.fonts.ready.then(() => {
                    if (socialScrollLockActive()) ensureSocialCenterScrollBounds(host);
                }).catch(() => {});
            }
        }
        function socialInnerScrollerCanAbsorbWheel(scroller, deltaY = 0) {
            if (!scroller || scroller.scrollHeight <= scroller.clientHeight + 1) return false;
            const atTop = scroller.scrollTop <= 0;
            const atBottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1;
            if (deltaY < 0 && !atTop) return true;
            if (deltaY > 0 && !atBottom) return true;
            return false;
        }
        function bindSocialCenterWheelForward() {
            if (socialCenterWheelForwardBound) return;
            socialCenterWheelForwardBound = true;
            document.addEventListener('wheel', (event) => {
                if (!socialScrollLockActive()) return;
                if (isSocialInboxPanel(root())) return;
                const host = root();
                const center = getSocialCenterScroller(host);
                if (!center || !center.contains(event.target)) return;
                const shell = host?.querySelector?.('.social-neo-shell');
                const innerScroller = event.target.closest('.social-neo-messages__thread-scroll, .social-neo-thread-messages, .social-neo-chat-items, .social-neo-chat-list, .sn-alerts-list, .lux-scroll-rail__viewport, .social-neo-event-feature-desc-viewport');
                if (innerScroller && innerScroller !== center && socialInnerScrollerCanAbsorbWheel(innerScroller, event.deltaY)) return;
                if (applySocialCenterWheel(center, shell, host, event.deltaY)) event.preventDefault();
            }, { passive: false, capture: true });
        }
        function scheduleDeferredWindowScrollRestore(host, snapshot) {
            if (!host || !snapshot) return;
            const scroller = getSocialCenterScroller(host);
            const contentScrollHeight = scroller ? getSocialCenterContentScrollHeight(scroller) : 0;
            const needsDeferred = Boolean(snapshot.anchorUserId)
                || (snapshot.layoutScrollLock && scroller && contentScrollHeight <= scroller.clientHeight + 1);
            const restore = () => restoreInteractionState(host, snapshot, { windowOnly: true });

            if (!needsDeferred) {
                scheduleSocialCenterScrollRepair(host);
                return;
            }

            scheduleSocialCenterScrollRepair(host, restore);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    delete host.__kiuInteractionAnchorUserId;
                });
            });
        }
        function ensureSocialShell(host) {
            const overlay = ensureSocialOverlayPortal();
            let rootNode = host.querySelector('#social-neo-root');
            if (rootNode) {
                let workspaceNavReveal = rootNode.querySelector('#social-neo-workspace-nav-reveal-region');
                if (!workspaceNavReveal) {
                    workspaceNavReveal = document.createElement('div');
                    workspaceNavReveal.id = 'social-neo-workspace-nav-reveal-region';
                    const shell = rootNode.querySelector('.social-neo-shell');
                    if (shell) rootNode.insertBefore(workspaceNavReveal, shell);
                    else rootNode.appendChild(workspaceNavReveal);
                }
                return {
                    root: rootNode,
                    flash: rootNode.querySelector('#social-neo-flash-region'),
                    topbar: rootNode.querySelector('#social-neo-topbar-region'),
                    command: rootNode.querySelector('#social-neo-command-region'),
                    workspaceNav: rootNode.querySelector('#social-neo-workspace-nav-region'),
                    workspaceNavReveal,
                    center: rootNode.querySelector('#social-neo-center-region'),
                    drawer: rootNode.querySelector('#social-neo-drawer-region'),
                    mobileTab: rootNode.querySelector('#social-neo-mobile-tab-region'),
                    toast: rootNode.querySelector('#social-neo-toast-region'),
                    dialog: overlay.dialog,
                    storyViewer: overlay.storyViewer,
                    storyComposer: overlay.storyComposer
                };
            }

            host.innerHTML = `
                <div id="social-neo-root" class="social-neo social-neo-facebook">
                    <div id="social-neo-flash-region"></div>
                    <div id="social-neo-topbar-region"></div>
                    <div id="social-neo-command-region"></div>
                    <div id="social-neo-workspace-nav-reveal-region"></div>
                    <div class="social-neo-shell" data-lux-glass-root="1">
                        <div id="social-neo-workspace-nav-region"></div>
                        <div class="social-neo-center" id="social-neo-center-region"></div>
                    </div>
                    <div id="social-neo-drawer-region"></div>
                    <div id="social-neo-mobile-tab-region"></div>
                    <div id="social-neo-toast-region"></div>
                </div>
            `;

            rootNode = host.querySelector('#social-neo-root');
            return ensureSocialShell(host);
        }
        function queueDeferredModuleRender(reason) {
            invalidateSocialRenderCache({ center: true });
            const host = root();
            if (host && !activeDialog()) host.__kiuForceCenterOnly = true;
            renderSocialPageNow(reason);
        }
        function applyShellIdentity(force = false) {
            const signature = shellIdentitySignature();
            if (!force && signature === lastShellSignature) return;
            lastShellSignature = signature;
            const user = currentUser();
            const role = text(user?.role || localStorage.getItem('currentUserRole') || 'student');
            document.body.classList.remove('role-student', 'role-professor', 'role-ta', 'role-admin', 'role-student_service');
            document.body.classList.add(`role-${role}`);

            const faculty = currentFacultyCode();
            document.body.dataset.faculty = faculty;
            document.documentElement.dataset.faculty = faculty;

            try {
                if (typeof switchFacultyTheme === 'function') {
                    switchFacultyTheme(faculty, { refreshDependentViews: false });
                }
            } catch (error) {
                console.warn('[Social] Shell identity sync skipped.', error);
            }
        }
        function revealShell() {
            document.getElementById('social-loading-placeholder')?.remove();
            const socialRoot = root();
            if (socialRoot) socialRoot.style.display = isSocialRouteDesktopScroll() ? 'flex' : 'block';
            if (!socialVisualShellSynced) {
                socialVisualShellSynced = true;
                syncSocialVisualShell();
            }
            if (typeof markPortalShellReady === 'function') {
                markPortalShellReady();
            } else {
                document.documentElement.classList.add('kiu-shell-ready');
                document.documentElement.classList.remove('kiu-shell-loading');
                document.body?.classList.add('kiu-shell-ready');
                document.body?.classList.remove('kiu-shell-loading');
            }
            const appContent = document.getElementById('app-content');
            if (appContent) appContent.style.opacity = '1';
        }
        function queueDirectoryRefresh() {
            if (directoryRefreshTimer) window.clearTimeout(directoryRefreshTimer);
            directoryRefreshTimer = window.setTimeout(() => {
                if (typeof loadPortalSocialDirectory !== 'function') return;
                loadPortalSocialDirectory(true).catch((error) => {
                    if (typeof setPortalSocialFlash === 'function') setPortalSocialFlash(error?.message || 'Directory could not be refreshed.', 'danger');
                });
            }, DIRECTORY_REFRESH_MS);
        }
        function queueGroupInviteSearchRefresh() {
            if (groupInviteSearchTimer) window.clearTimeout(groupInviteSearchTimer);
            groupInviteSearchTimer = window.setTimeout(() => {
                renderSocialPageNow('group-member-search');
            }, GROUP_INVITE_SEARCH_MS);
        }
        function queueProjectInviteSearchRefresh() {
            if (projectInviteSearchTimer) window.clearTimeout(projectInviteSearchTimer);
            projectInviteSearchTimer = window.setTimeout(() => {
                renderSocialPageNow('project-member-search');
            }, GROUP_INVITE_SEARCH_MS);
        }
        function queuePageMembersSearchRefresh() {
            if (pageMembersSearchTimer) window.clearTimeout(pageMembersSearchTimer);
            pageMembersSearchTimer = window.setTimeout(() => {
                renderSocialPageNow('page-members-search');
            }, GROUP_INVITE_SEARCH_MS);
        }
        function queueEventEditorSearchRefresh() {
            if (eventEditorSearchTimer) window.clearTimeout(eventEditorSearchTimer);
            eventEditorSearchTimer = window.setTimeout(() => {
                renderSocialPageNow('event-editor-search');
            }, GROUP_INVITE_SEARCH_MS);
        }

        function normalizeGroupLeaveToken(value) {
            if (typeof window.normalizeGroupLeaveToken === 'function'
                && window.normalizeGroupLeaveToken !== normalizeGroupLeaveToken) {
                return window.normalizeGroupLeaveToken(value);
            }
            return String(value || '').trim().toUpperCase();
        }
        function buildGroupLeaveVerification(groupItem) {
            if (typeof window.buildGroupLeaveVerification === 'function'
                && window.buildGroupLeaveVerification !== buildGroupLeaveVerification) {
                return window.buildGroupLeaveVerification(groupItem);
            }
            const displayName = String(groupItem?.name || 'GROUP').trim();
            return {
                displayName,
                expectedToken: normalizeGroupLeaveToken(displayName),
            };
        }
        const renderGroupLeaveDialog = createSocialLazyStub('renderGroupLeaveDialog', hasSocialGroupsModule, ensureSocialGroupsModule, '', () => queueDeferredModuleRender('groups-module'));

        const api = {
            readWorkspaceNavCollapsed,
            writeWorkspaceNavCollapsed,
            isWorkspaceNavCollapsed,
            ensureWorkspaceNavCollapsedState,
            setWorkspaceNavCollapsed,
            syncWorkspaceNavCollapsedClass,
            renderShellWorkspaceNavReveal,
            renderShellWorkspaceNav,
            updateSocialMeasuredChrome,
            syncSocialVisualViewport,
            bindSocialScrollChromeObserver,
            bindSocialLayoutObserver,
            centerScrollOverflows,
            isSocialMessagesPanel,
            isSocialAlertsPanel,
            isSocialInboxPanel,
            isSocialTopbarSkippedPanel,
            isSocialCommandSkippedPanel,
            centerCanScroll,
            getSocialCenterScrollBudget,
            syncSocialScrollLayout,
            migrateSocialScrollOnLockChange,
            refreshSocialCenterWheelScroll,
            applySocialCenterWheel,
            ensureSocialCenterScrollBounds,
            syncEventDescScrollRails,
            scheduleSocialCenterScrollRepair,
            socialInnerScrollerCanAbsorbWheel,
            bindSocialCenterWheelForward,
            scheduleDeferredWindowScrollRestore,
            ensureSocialShell,
            queueDeferredModuleRender,
            applyShellIdentity,
            revealShell,
            queueDirectoryRefresh,
            queueGroupInviteSearchRefresh,
            queueProjectInviteSearchRefresh,
            queuePageMembersSearchRefresh,
            queueEventEditorSearchRefresh,
            normalizeGroupLeaveToken,
            buildGroupLeaveVerification,
            renderGroupLeaveDialog,
        };
        Object.assign(window, api);
        return api;
    };
})();
