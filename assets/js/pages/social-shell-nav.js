/* Social shell panel-nav click handlers + domain event router.
 * Eager: social.html before social-page.js.
 * Page installs via createKiuSocialShellNavApi(deps).
 */
(function initSocialShellNav() {
    'use strict';
    if (window.__KIU_SOCIAL_SHELL_NAV_LOADED) return;
    window.__KIU_SOCIAL_SHELL_NAV_LOADED = true;

    function createKiuSocialShellNavApi(deps) {
        if (!deps || typeof deps !== 'object') throw new Error('shell nav deps required');
        const text = typeof deps.text === 'function' ? deps.text : (v) => String(v == null ? '' : v).trim();
        const state = deps.state;
        const setPanel = deps.setPanel;
        const invalidateSocialRenderCache = deps.invalidateSocialRenderCache || (() => {});
        const renderSocialPageNow = deps.renderSocialPageNow;
        const withBusy = deps.withBusy || ((fn) => fn());
        const pruneExpiredLostFoundItems = deps.pruneExpiredLostFoundItems || (async () => {});
        const refreshPhotographyPanelStage = deps.refreshPhotographyPanelStage || (() => false);
        const refreshPortalSocialFeed = deps.refreshPortalSocialFeed || (async () => []);
        const currentUserId = deps.currentUserId || (() => '');
        const activeDialog = deps.activeDialog || (() => null);
        const shouldRestoreStackedDialog = deps.shouldRestoreStackedDialog || (() => false);
        const restorePreviousDialog = deps.restorePreviousDialog || (() => {});
        const closeDialog = deps.closeDialog || (() => {});
        const closeSocialWorkspaceNavAnimated = deps.closeSocialWorkspaceNavAnimated || (() => {});
        const setWorkspaceNavCollapsed = deps.setWorkspaceNavCollapsed || (() => {});
        const root = deps.root || (() => null);
        const findSocialGroupById = deps.findSocialGroupById || (() => null);
        const openDialog = deps.openDialog || (() => {});
        const navigateToEntity = deps.navigateToEntity || (() => {});

        function resolveSocialRouteFn(name) {
            const direct = window[name];
            if (typeof direct === 'function') return direct;
            const ws = window.KiuSocialWorkspace;
            if (ws && typeof ws[name] === 'function') return ws[name];
            const weekPlan = window.KiuSocialWorkspaceWeekPlanModel;
            if (weekPlan && typeof weekPlan[name] === 'function') return weekPlan[name];
            const feed = window.KiuSocialFeed;
            if (feed && typeof feed[name] === 'function') return feed[name];
            return null;
        }

        /** Shared lazy-domain router for click/submit/input/change. */
        function routeSocialDomain(value, routes, { invoke, fireAndForget = false } = {}) {
            for (let i = 0; i < routes.length; i += 1) {
                const route = routes[i];
                const matcher = resolveSocialRouteFn(route.is);
                const matched = matcher ? matcher(value) : route.fallback(value);
                if (!matched) continue;
                const handler = resolveSocialRouteFn(route.handle);
                const has = typeof route.has === 'function' ? route.has : (() => false);
                const ensure = typeof route.ensure === 'function' ? route.ensure : (() => Promise.resolve());
                if (has() && handler) {
                    const result = invoke(handler);
                    return fireAndForget ? { matched: true } : { matched: true, result };
                }
                const pending = ensure().then(() => {
                    const loadedHandler = resolveSocialRouteFn(route.handle);
                    if (loadedHandler) {
                        return invoke(loadedHandler);
                    }
                    if (typeof route.onMissing === 'function') {
                        route.onMissing();
                    }
                    const missing = `Social action handler is unavailable: ${route.handle}`;
                    console.error('[Social]', missing);
                    if (typeof setPortalSocialFlash === 'function') {
                        setPortalSocialFlash(missing, 'danger');
                    }
                }).catch((error) => {
                    console.error('[Social] Deferred module action failed:', value, error);
                    if (typeof setPortalSocialFlash === 'function') {
                        setPortalSocialFlash(error?.message || 'Action could not be completed.', 'danger');
                    }
                    throw error;
                });
                if (fireAndForget) {
                    pending.catch(() => null);
                    return { matched: true };
                }
                return { matched: true, result: pending };
            }
            return { matched: false };
        }

        /** Common panel tab switch: set ui key, setPanel, invalidate. */
        function beginShellPanelTabSwitch({ panel, tab, uiKey, defaultTab, applyTab }) {
            const wasOn = text(state().ui?.activePanel || '') === panel;
            const previousTab = uiKey ? text(state().ui?.[uiKey] || defaultTab || '') : '';
            if (tab && uiKey) {
                state().ui[uiKey] = typeof applyTab === 'function' ? applyTab(tab) : tab;
            }
            setPanel(panel);
            invalidateSocialRenderCache({ center: true });
            return {
                wasOn,
                tab: tab || '',
                previousTab,
                tabChanged: Boolean(wasOn && tab && tab !== previousTab)
            };
        }

        function buildClickDomainRoutes() {
            return [
                {
                    is: 'isSocialWorkspaceClickAction',
                    fallback: (a) => a === 'projects-back' || String(a || '').startsWith('project-') || String(a || '').startsWith('portfolio-'),
                    has: deps.hasSocialWorkspaceModule,
                    ensure: deps.ensureSocialWorkspaceModule,
                    handle: 'handleSocialWorkspaceClick',
                    onMissing: () => deps.queueDeferredModuleRender('workspace-module')
                },
                {
                    is: 'isSocialGroupsClickAction',
                    fallback: (a) => String(a || '').startsWith('group-'),
                    has: deps.hasSocialGroupsModule,
                    ensure: deps.ensureSocialGroupsModule,
                    handle: 'handleSocialGroupsClick'
                },
                {
                    is: 'isSocialPagesClickAction',
                    fallback: (a) => String(a || '').startsWith('page-') || a === 'pages-search-clear',
                    has: deps.hasSocialPagesModule,
                    ensure: deps.ensureSocialPagesModule,
                    handle: 'handleSocialPagesClick'
                },
                {
                    is: 'isSocialSurveysClickAction',
                    fallback: (a) => String(a || '').startsWith('survey-') || String(a || '').startsWith('surveys-'),
                    has: deps.hasSocialSurveysModule,
                    ensure: deps.ensureSocialSurveysModule,
                    handle: 'handleSocialSurveysClick'
                },
                {
                    is: 'isSocialResearchClickAction',
                    fallback: (a) => a === 'panel-research' || String(a || '').startsWith('research-'),
                    has: deps.hasSocialResearchModule || (() => false),
                    ensure: deps.ensureSocialResearchModule || (() => Promise.resolve()),
                    handle: 'handleSocialResearchClick'
                },
                {
                    is: 'isSocialPhotographyClickAction',
                    fallback: (a) => String(a || '').startsWith('photography-'),
                    has: deps.hasSocialPhotographyModule,
                    ensure: deps.ensureSocialPhotographyModule,
                    handle: 'handleSocialPhotographyClick'
                },
                {
                    is: 'isSocialEventsClickAction',
                    fallback: (a) => String(a || '').startsWith('event-') || String(a || '').startsWith('events-'),
                    has: deps.hasSocialEventsModule,
                    ensure: deps.ensureSocialEventsModule,
                    handle: 'handleSocialEventsClick'
                },
                {
                    is: 'isSocialFeedClickAction',
                    fallback: (a) => String(a || '').startsWith('post-')
                        || String(a || '').startsWith('comment-')
                        || String(a || '').startsWith('story-')
                        || a === 'focus-feed'
                        || a === 'feed-refresh',
                    has: deps.hasSocialFeedModule,
                    ensure: deps.ensureSocialFeedModule,
                    handle: 'handleSocialFeedClick'
                },
                {
                    is: 'isSocialLostFoundClickAction',
                    fallback: (a) => String(a || '').startsWith('lost-found-'),
                    has: deps.hasSocialLostFoundModule,
                    ensure: deps.ensureSocialLostFoundModule,
                    handle: 'handleSocialLostFoundClick'
                },
                {
                    is: 'isSocialProfileClickAction',
                    fallback: (a) => String(a || '').startsWith('profile-'),
                    has: deps.hasSocialProfileModule,
                    ensure: deps.ensureSocialProfileModule,
                    handle: 'handleSocialProfileClick'
                },
                {
                    is: 'isSocialMessagesClickAction',
                    fallback: (a) => String(a || '').startsWith('message-')
                        || String(a || '').startsWith('chat-')
                        || String(a || '').startsWith('call-')
                        || String(a || '').startsWith('thread-')
                        || a === 'directory-message'
                        || a === 'message-start',
                    has: deps.hasSocialMessagesModule,
                    ensure: deps.ensureSocialMessagesModule,
                    handle: 'handleSocialMessagesClick'
                },
                {
                    is: 'isSocialAlertsClickAction',
                    fallback: (a) => String(a || '').startsWith('notification-')
                        || String(a || '').startsWith('alerts-')
                        || a === 'report-resolve',
                    has: deps.hasSocialAlertsModule,
                    ensure: deps.ensureSocialAlertsModule,
                    handle: 'handleSocialAlertsClick'
                },
                {
                    is: 'isSocialCommunityClickAction',
                    fallback: (a) => String(a || '').startsWith('connection-') || String(a || '').startsWith('person-'),
                    has: deps.hasSocialCommunityModule,
                    ensure: deps.ensureSocialCommunityModule,
                    handle: 'handleSocialCommunityClick'
                }
            ];
        }

        /**
         * Shell / panel navigation click actions owned by the page shell.
         * @returns {{ handled: boolean, result?: * }}
         */
        function handleShellNavClick(action, trigger) {
            if (action === 'panel-feed') {
                const filter = text(trigger.getAttribute('data-home-filter'));
                const sw = beginShellPanelTabSwitch({
                    panel: 'feed',
                    tab: filter,
                    uiKey: 'homeFeedFilter',
                    defaultTab: 'all'
                });
                if (sw.tabChanged) return { handled: true, result: renderSocialPageNow('feed-tab') };
                return { handled: true, result: renderSocialPageNow('panel-feed') };
            }
            if (action === 'panel-community') {
                const tab = text(trigger.getAttribute('data-community-tab'));
                const sw = beginShellPanelTabSwitch({
                    panel: 'community',
                    tab,
                    uiKey: 'communityTab',
                    defaultTab: 'people'
                });
                if (sw.tabChanged) return { handled: true, result: renderSocialPageNow('community-tab') };
                return { handled: true, result: renderSocialPageNow('panel-community') };
            }
            if (action === 'panel-events') {
                const tab = text(trigger.getAttribute('data-events-tab'));
                const sw = beginShellPanelTabSwitch({
                    panel: 'events',
                    tab,
                    uiKey: 'eventsSubTab',
                    defaultTab: 'student'
                });
                if (sw.tabChanged) {
                    state().ui.eventsComposerSection = '';
                    return { handled: true, result: renderSocialPageNow('events-tab') };
                }
                return { handled: true, result: renderSocialPageNow('panel-events') };
            }
            if (action === 'panel-lost-found' || action === 'panel-lost-and-found') {
                setPanel('lost-and-found');
                return {
                    handled: true,
                    result: withBusy(async () => {
                        await pruneExpiredLostFoundItems();
                        renderSocialPageNow('panel-lost-and-found');
                    })
                };
            }
            if (action === 'panel-surveys') {
                const tab = text(trigger.getAttribute('data-surveys-tab'));
                state().ui.surveyTakingId = '';
                state().ui.surveyResultsId = '';
                state().ui.surveyResultsPayload = null;
                const sw = beginShellPanelTabSwitch({
                    panel: 'surveys',
                    tab,
                    uiKey: 'surveysTab',
                    defaultTab: 'available'
                });
                if (sw.tabChanged) return { handled: true, result: renderSocialPageNow('surveys-tab') };
                return { handled: true, result: renderSocialPageNow('panel-surveys') };
            }
            if (action === 'panel-research') {
                const tab = text(trigger.getAttribute('data-research-tab'));
                state().ui.researchReaderId = '';
                const sw = beginShellPanelTabSwitch({
                    panel: 'research',
                    tab,
                    uiKey: 'researchTab',
                    defaultTab: 'faculty'
                });
                if (sw.tabChanged) return { handled: true, result: renderSocialPageNow('research-tab') };
                return { handled: true, result: renderSocialPageNow('panel-research') };
            }
            // Open compose without depending on research-module openDialog hooks.
            if (action === 'research-create-open') {
                const runtime = state();
                runtime.ui = runtime.ui || {};
                if (!runtime.ui.researchDraft || typeof runtime.ui.researchDraft !== 'object') {
                    runtime.ui.researchDraft = {
                        authorLane: '',
                        format: 'article',
                        title: '',
                        abstract: '',
                        bodyText: '',
                        topics: 'Research',
                        facultyCode: '',
                        doiOrUrl: '',
                        courseCode: '',
                        advisorName: '',
                        pdfFile: null,
                        pdfMeta: null
                    };
                }
                setPanel('research');
                return { handled: true, result: openDialog('research-create', {}) };
            }
            if (action === 'panel-photography') {
                const tab = text(trigger.getAttribute('data-photography-tab'));
                const wasOnPhotography = text(state().ui?.activePanel || '') === 'photography';
                const previousTab = text(state().ui?.photographyTab || 'explore');
                if (tab) {
                    const normalized = tab === 'gallery' || tab === 'contact' ? 'explore' : tab;
                    state().ui.photographyTab = normalized;
                }
                state().ui.photographyProfileUserId = '';
                setPanel('photography');
                if (!wasOnPhotography) {
                    return {
                        handled: true,
                        result: withBusy(async () => {
                            await refreshPortalSocialFeed(true);
                            invalidateSocialRenderCache({ center: true });
                            if (refreshPhotographyPanelStage()) return;
                            renderSocialPageNow(tab ? 'photography-tab' : 'panel-photography');
                        })
                    };
                }
                if (wasOnPhotography && tab && tab !== previousTab && refreshPhotographyPanelStage()) {
                    return { handled: true };
                }
                if (wasOnPhotography && !tab && refreshPhotographyPanelStage()) {
                    return { handled: true };
                }
                invalidateSocialRenderCache({ center: true });
                if (!wasOnPhotography || (tab && tab !== previousTab)) {
                    return {
                        handled: true,
                        result: renderSocialPageNow(tab && wasOnPhotography ? 'photography-tab' : 'panel-photography')
                    };
                }
                return { handled: true, result: renderSocialPageNow('panel-photography') };
            }
            if (action === 'panel-groups') {
                const tab = text(trigger.getAttribute('data-groups-tab'));
                if (tab) state().ui.groupsTab = tab;
                setPanel('groups');
                invalidateSocialRenderCache({ center: true });
                if (tab) return { handled: true, result: renderSocialPageNow('groups-tab') };
                return { handled: true, result: renderSocialPageNow('panel-groups') };
            }
            if (action === 'panel-workspace') {
                state().ui.activeProjectId = '';
                state().ui.projectTab = 'overview';
                setPanel('workspace');
                invalidateSocialRenderCache({ center: true });
                return { handled: true, result: renderSocialPageNow('panel-workspace') };
            }
            if (action === 'panel-projects') {
                state().ui.activeProjectId = '';
                state().ui.projectTab = 'overview';
                setPanel('projects');
                invalidateSocialRenderCache({ center: true });
                return { handled: true, result: renderSocialPageNow('panel-projects') };
            }
            if (action === 'panel-pages') {
                const tab = text(trigger.getAttribute('data-pages-tab'));
                const wasOnPages = text(state().ui?.activePanel || '') === 'pages';
                const previousTab = text(state().ui?.pagesTab || 'discover');
                const profileWasOpen = Boolean(text(state().ui?.activePageProfileId || ''));
                if (tab) state().ui.pagesTab = tab;
                state().ui.activePageProfileId = '';
                state().ui.pageProfileEditMode = false;
                state().ui.pageWizardOpen = false;
                setPanel('pages');
                invalidateSocialRenderCache({ center: true });
                if (profileWasOpen) return { handled: true, result: renderSocialPageNow('page-profile-back') };
                if (wasOnPages && tab && tab !== previousTab) {
                    return { handled: true, result: renderSocialPageNow('pages-tab') };
                }
                return { handled: true, result: renderSocialPageNow('panel-pages') };
            }
            if (action === 'panel-messages') {
                const filter = text(trigger.getAttribute('data-messages-filter'));
                const wasOnMessages = text(state().ui?.activePanel) === 'messages';
                const previousFilter = text(state().ui?.messagesFilter || 'all');
                if (filter) state().ui.messagesFilter = filter;
                setPanel('messages');
                const activeChatId = text(state().ui?.activeChatId || '');
                if (activeChatId && typeof window.markPortalChatMessagesRead === 'function') {
                    window.markPortalChatMessagesRead(activeChatId).catch(() => null);
                }
                invalidateSocialRenderCache({ center: true });
                if (wasOnMessages && filter && filter !== previousFilter) {
                    return { handled: true, result: renderSocialPageNow('messages-filter') };
                }
                return { handled: true, result: renderSocialPageNow('panel-messages') };
            }
            if (action === 'panel-alerts') {
                const filter = text(trigger.getAttribute('data-alerts-filter'));
                const wasOnAlerts = text(state().ui?.activePanel) === 'alerts';
                const previousFilter = text(state().ui?.alertsFilter || 'all');
                if (filter) state().ui.alertsFilter = filter;
                if (typeof window.refreshPortalNotifications === 'function') {
                    return {
                        handled: true,
                        result: withBusy(async () => {
                            await window.refreshPortalNotifications(true);
                            setPanel('alerts');
                            invalidateSocialRenderCache({ center: true });
                            if (wasOnAlerts && filter && filter !== previousFilter) {
                                renderSocialPageNow('alerts-filter');
                                return;
                            }
                            renderSocialPageNow('panel-alerts');
                        })
                    };
                }
                setPanel('alerts');
                invalidateSocialRenderCache({ center: true });
                if (wasOnAlerts && filter && filter !== previousFilter) {
                    return { handled: true, result: renderSocialPageNow('alerts-filter') };
                }
                return { handled: true, result: renderSocialPageNow('panel-alerts') };
            }
            if (action === 'panel-profile') {
                state().ui.activeProfileUserId = text(trigger.getAttribute('data-user-id') || currentUserId());
                const profileTab = text(trigger.getAttribute('data-profile-tab') || '');
                if (profileTab) state().ui.profileTab = profileTab;
                setPanel('profile');
                invalidateSocialRenderCache({ center: true });
                return { handled: true, result: renderSocialPageNow('panel-profile') };
            }
            if (action === 'toast-dismiss') {
                const toastHost = trigger.closest?.('[data-toast-id]') || trigger;
                const toastId = toastHost.getAttribute?.('data-toast-id') || trigger.getAttribute('data-toast-id');
                if (toastId && typeof window.dismissPortalSocialToast === 'function') {
                    window.dismissPortalSocialToast(toastId);
                }
                return { handled: true };
            }
            if (action === 'dialog-close') {
                if (shouldRestoreStackedDialog(activeDialog()?.type || '')) {
                    restorePreviousDialog();
                } else {
                    closeDialog();
                }
                return { handled: true };
            }
            if (action === 'workspace-nav-open') {
                state().ui.workspaceNavOpen = true;
                return { handled: true, result: renderSocialPageNow('workspace-nav-open') };
            }
            if (action === 'workspace-nav-close') {
                return { handled: true, result: closeSocialWorkspaceNavAnimated() };
            }
            if (action === 'workspace-nav-collapse') {
                setWorkspaceNavCollapsed(true);
                return { handled: true, result: renderSocialPageNow('workspace-nav-collapse') };
            }
            if (action === 'workspace-nav-expand') {
                setWorkspaceNavCollapsed(false);
                return { handled: true, result: renderSocialPageNow('workspace-nav-expand') };
            }
            if (action === 'shell-drawer-open') {
                state().ui.workspaceNavOpen = false;
                state().ui.shellDrawerOpen = true;
                return { handled: true, result: renderSocialPageNow('shell-drawer-open') };
            }
            if (action === 'shell-drawer-close') {
                state().ui.shellDrawerOpen = false;
                return { handled: true, result: renderSocialPageNow('shell-drawer-close') };
            }
            if (action === 'composer-attach') {
                const host = trigger.closest('form[data-form="post-compose"]') || root();
                host?.querySelector('input[name="postFile"]')?.click();
                return { handled: true };
            }
            if (action === 'entity-link-open') {
                const type = text(trigger.getAttribute('data-entity-type') || '').toLowerCase();
                const id = text(trigger.getAttribute('data-entity-id') || '');
                if (!type || !id) return { handled: true };
                if (type === 'group' && findSocialGroupById(id)) {
                    setPanel('groups');
                    return { handled: true, result: openDialog('group-detail', { groupId: id }) };
                }
                return { handled: true, result: openDialog('entity-detail', { entityType: type, entityId: id }) };
            }
            if (action === 'entity-goto') {
                const type = text(trigger.getAttribute('data-entity-type') || '').toLowerCase();
                const id = text(trigger.getAttribute('data-entity-id') || '');
                if (!type || !id) return { handled: true };
                state().ui.socialDialog = null;
                state().ui.previousDialog = null;
                return { handled: true, result: navigateToEntity(type, id) };
            }
            return { handled: false };
        }

        return {
            routeSocialDomain,
            beginShellPanelTabSwitch,
            buildClickDomainRoutes,
            handleShellNavClick
        };
    }

    window.createKiuSocialShellNavApi = createKiuSocialShellNavApi;
})();
