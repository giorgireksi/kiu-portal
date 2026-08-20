/* Social overlay portal + dialog open/close/lock chrome.
 * Eager: social.html after social-dialog-router.js, before social-shell-nav.js.
 * Page installs via createKiuSocialOverlayChromeApi(deps).
 */
(function initSocialOverlayChrome() {
    'use strict';
    if (window.__KIU_SOCIAL_OVERLAY_CHROME_LOADED) return;
    window.__KIU_SOCIAL_OVERLAY_CHROME_LOADED = true;

    function createKiuSocialOverlayChromeApi(deps) {
        if (!deps || typeof deps !== 'object') throw new Error('overlay chrome deps required');
        const text = typeof deps.text === 'function' ? deps.text : (v) => String(v == null ? '' : v).trim();
        const state = deps.state;
        const root = deps.root || (() => null);
        const PROJECT_TASK_GRAPH_STACKED_DIALOGS = deps.PROJECT_TASK_GRAPH_STACKED_DIALOGS || new Set();
        const PROJECT_HEALTH_OVERLAY_DIALOGS = deps.PROJECT_HEALTH_OVERLAY_DIALOGS || new Set();
        const workspaceDialogKeepsCenter = deps.workspaceDialogKeepsCenter || (() => false);
        const overlayDialogPreservesScroll = deps.overlayDialogPreservesScroll || (() => false);
        const isProjectTaskGraphStackActive = deps.isProjectTaskGraphStackActive || (() => false);
        const getProjectTaskGraphStackAnchorDialog = deps.getProjectTaskGraphStackAnchorDialog || (() => null);
        const renderDialogOnlyNow = deps.renderDialogOnlyNow || (() => {});
        const renderSocialPageNow = deps.renderSocialPageNow || (() => {});
        const getSocialCenterScroller = deps.getSocialCenterScroller || (() => null);
        const scrollSocialCenterTo = deps.scrollSocialCenterTo || (() => {});
        const socialScrollLockActive = deps.socialScrollLockActive || (() => false);
        const bindOverlayPortalEvents = deps.bindOverlayPortalEvents || (() => {});
        const ensurePhotographyUploadFileSink = deps.ensurePhotographyUploadFileSink || (() => {});
        const bindPhotographyUploadDialogFileInput = deps.bindPhotographyUploadDialogFileInput || (() => {});
        const revokePhotographyUploadPreview = deps.revokePhotographyUploadPreview || (() => {});
        const clearEventDraft = deps.clearEventDraft || (() => {});
        const clearPostComposeDraft = deps.clearPostComposeDraft || (() => {});
        const getProjectTaskGraphHost = deps.getProjectTaskGraphHost || (() => null);
        const readProjectTaskGraphPanFromScroll = deps.readProjectTaskGraphPanFromScroll || (() => ({ x: 0, y: 0 }));
        const clampProjectTaskGraphZoom = deps.clampProjectTaskGraphZoom || ((z) => z);
        const persistProjectTaskGraphView = deps.persistProjectTaskGraphView || (() => {});
        const clearProjectTabPaneCache = deps.clearProjectTabPaneCache || (() => {});
        const rebuildActiveProjectTabPaneIfPreviewHost = deps.rebuildActiveProjectTabPaneIfPreviewHost || (() => {});
        const relayoutCommentTrunks = deps.relayoutCommentTrunks || (() => {});

        const SOCIAL_OVERLAY_PORTAL_ID = 'social-neo-overlay-portal';
        const SOCIAL_OVERLAY_REGION_IDS = [
            'lux-glass-dialog-region',
            'social-neo-story-viewer-region',
            'social-neo-story-composer-region'
        ];
        const SOCIAL_GRAPH_PAGE_ROOT_DIALOGS = new Set([
            'project-task-graph',
            'project-task-graph-history',
            'project-task-graph-schedule-help',
            'project-health',
            'project-risk',
            'project-health-plan-pick'
        ]);
        const SOCIAL_GRAPH_PAGE_STACKED_DIALOGS = new Set([
            'project-task-detail',
            'project-task-proof',
            'project-task-proof-preview',
            'project-task-edit',
            'project-task-create',
            'project-task-delete',
            'project-settings'
        ]);
        const SOCIAL_OVERLAY_SURFACE_SELECTOR = '[data-social-page-surface], .lux-glass-dialog-backdrop, .social-neo-story-viewer, .social-neo-story-composer';

        function isSocialGraphPageDialog(type = text(activeDialog()?.type || '')) {
            const kind = text(type);
            if (SOCIAL_GRAPH_PAGE_ROOT_DIALOGS.has(kind)) return true;
            if (!SOCIAL_GRAPH_PAGE_STACKED_DIALOGS.has(kind)) return false;
            const runtime = state();
            let parent = runtime?.ui?.previousDialog || null;
            while (parent) {
                if (text(parent.type) === 'project-health') return true;
                parent = parent.__restorePrevious || null;
            }
            if (text(runtime?.ui?.projectTaskGraphStackAnchor?.type) === 'project-task-graph') return true;
            return isProjectTaskGraphStackActive(runtime);
        }

        function socialOverlayPortalHasContent() {
            return SOCIAL_OVERLAY_REGION_IDS.some((regionId) => {
                const node = document.getElementById(regionId);
                return Boolean(node?.querySelector(SOCIAL_OVERLAY_SURFACE_SELECTOR));
            });
        }

        function socialOverlayLockArtifactsPresent() {
            return document.body.dataset.socialOverlayLocked === '1'
                || document.body.classList.contains('social-overlay-open')
                || document.body.style.position === 'fixed';
        }

        function clearSocialOverlayLockArtifacts() {
            restoreCenterScrollerOverlayPin();
            delete document.body.dataset.socialOverlayScrollY;
            delete document.body.dataset.socialOverlayCenterScrollY;
            delete document.body.dataset.socialOverlayLocked;
            document.body.classList.remove('social-overlay-open');
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.right = '';
            document.body.style.width = '';
        }

        function pinCenterScrollerForOverlay() {
            const centerScroller = getSocialCenterScroller(root());
            if (!centerScroller || centerScroller.dataset.socialOverlayOverflowPinned === '1') return;
            centerScroller.dataset.socialOverlayPriorOverflow = centerScroller.style.overflow || '';
            centerScroller.style.overflow = 'hidden';
            centerScroller.dataset.socialOverlayOverflowPinned = '1';
        }

        function restoreCenterScrollerOverlayPin() {
            const centerScroller = getSocialCenterScroller(root());
            if (!centerScroller || centerScroller.dataset.socialOverlayOverflowPinned !== '1') return;
            const prior = centerScroller.dataset.socialOverlayPriorOverflow || '';
            if (prior) centerScroller.style.overflow = prior;
            else centerScroller.style.removeProperty('overflow');
            delete centerScroller.dataset.socialOverlayPriorOverflow;
            delete centerScroller.dataset.socialOverlayOverflowPinned;
        }

        function clearStaleSocialOverlayDom() {
            const staleSelector = `${SOCIAL_OVERLAY_SURFACE_SELECTOR}, .social-project-task-graph-stack`;
            SOCIAL_OVERLAY_REGION_IDS.forEach((regionId) => {
                const node = document.getElementById(regionId);
                if (!node?.querySelector(staleSelector)) return;
                node.innerHTML = '';
                delete node.__kiuLastMarkup;
            });
            syncOverlayPortalVisibility();
        }

        function pruneStaleSocialOverlayState() {
            const runtime = state();
            if (!runtime?.ui) return;

            const hasDialogSurface = Boolean(document.getElementById('lux-glass-dialog-region')?.querySelector('[data-social-page-surface], .lux-glass-dialog-backdrop'));
            const hasStoryViewer = Boolean(document.getElementById('social-neo-story-viewer-region')?.querySelector('.social-neo-story-viewer'));
            const hasStoryComposer = Boolean(document.getElementById('social-neo-story-composer-region')?.querySelector('.social-neo-story-composer'));

            if (runtime.ui.socialDialog && !hasDialogSurface) {
                return;
            }
            if (runtime.ui.storyViewerOpen && !hasStoryViewer) {
                runtime.ui.storyViewerOpen = false;
                runtime.ui.storyViewerIndex = 0;
            }
            if (runtime.ui.storyComposerOpen && !hasStoryComposer) {
                runtime.ui.storyComposerOpen = false;
            }
            if (!runtime.ui.socialDialog && !runtime.ui.storyViewerOpen && !runtime.ui.storyComposerOpen) {
                if (runtime.ui.projectTaskGraphStackAnchor || runtime.ui.previousDialog) {
                    runtime.ui.projectTaskGraphStackAnchor = null;
                    runtime.ui.previousDialog = null;
                }
                if (socialOverlayPortalHasContent()) {
                    clearStaleSocialOverlayDom();
                }
            }
        }

        const SOCIAL_CALL_OVERLAY_ID = 'social-neo-call-overlay';
        const SOCIAL_SHORTCUTS_TOP_NAV_PORTAL_ID = 'social-shortcuts-top-nav-portal';

        function socialInteractionContains(node) {
            if (!node) return false;
            const rootHost = root();
            const portal = document.getElementById(SOCIAL_OVERLAY_PORTAL_ID);
            const callOverlay = document.getElementById(SOCIAL_CALL_OVERLAY_ID);
            const shortcutsPortal = document.getElementById(SOCIAL_SHORTCUTS_TOP_NAV_PORTAL_ID);
            return Boolean(
                (rootHost && rootHost.contains(node))
                || (portal && portal.contains(node))
                || (callOverlay && callOverlay.contains(node))
                || (shortcutsPortal && shortcutsPortal.contains(node))
                || node.closest?.('[data-project-task-graph-context-menu]')
            );
        }

        function socialDialogRegion() {
            return document.getElementById('lux-glass-dialog-region');
        }

        function photographyUploadForm() {
            return socialDialogRegion()?.querySelector('form[data-form="photography-upload"]') || null;
        }

        function normalizeSocialOverlayDialogRegion() {
            const portal = document.getElementById(SOCIAL_OVERLAY_PORTAL_ID);
            const regionId = 'lux-glass-dialog-region';
            const regions = Array.from(document.querySelectorAll(`[id="${regionId}"]`));
            const canonical = (portal && portal.querySelector(`[id="${regionId}"]`)) || regions[0] || null;
            regions.forEach((region) => {
                if (region !== canonical) region.remove();
            });
            if (canonical) {
                const backdrops = canonical.querySelectorAll(':scope > .lux-glass-dialog-backdrop');
                if (backdrops.length > 1) {
                    Array.from(backdrops).slice(1).forEach((node) => node.remove());
                }
            }
            return canonical;
        }

        function ensureSocialOverlayPortal() {
            let portal = document.getElementById(SOCIAL_OVERLAY_PORTAL_ID);
            if (!portal) {
                portal = document.createElement('div');
                portal.id = SOCIAL_OVERLAY_PORTAL_ID;
                portal.className = 'social-neo-overlay-portal';
                portal.hidden = true;
                portal.setAttribute('aria-hidden', 'true');
                SOCIAL_OVERLAY_REGION_IDS.forEach((regionId) => {
                    const region = document.createElement('div');
                    region.id = regionId;
                    portal.appendChild(region);
                });
                document.body.appendChild(portal);
            }
            SOCIAL_OVERLAY_REGION_IDS.forEach((regionId) => {
                let region = document.getElementById(regionId);
                if (!region) {
                    region = document.createElement('div');
                    region.id = regionId;
                    portal.appendChild(region);
                    return;
                }
                if (region.parentElement !== portal) {
                    portal.appendChild(region);
                }
            });
            normalizeSocialOverlayDialogRegion();
            return {
                portal,
                dialog: document.getElementById('lux-glass-dialog-region'),
                storyViewer: document.getElementById('social-neo-story-viewer-region'),
                storyComposer: document.getElementById('social-neo-story-composer-region')
            };
        }

        function scheduleSocialOverlayTransparencyRefresh() {
            const runtime = state();
            const dialogType = text(activeDialog()?.type || '');
            if (
                dialogType === 'page-create'
                || dialogType === 'survey-create'
                || dialogType === 'portfolio-editor'
                || dialogType === 'portfolio-viewer'
                || dialogType === 'research-create'
                || dialogType === 'event-create'
                || dialogType === 'project-create'
                || dialogType === 'group-create'
                || dialogType === 'project-health'
                || dialogType === 'project-risk'
                || dialogType === 'lost-found-create'
                || dialogType === 'post-compose'
                || dialogType === 'photography-upload'
                || dialogType === 'survey-results'
                || dialogType === 'project-task-graph'
                || PROJECT_TASK_GRAPH_STACKED_DIALOGS.has(dialogType)
                || isProjectTaskGraphStackActive(runtime)
            ) return;
            const portal = document.getElementById(SOCIAL_OVERLAY_PORTAL_ID);
            if (!portal || portal.hidden) return;
            if (portal.querySelector('.social-project-task-graph-stack')) return;
            const scheduleRefresh = typeof window.requestAnimationFrame === 'function'
                ? window.requestAnimationFrame.bind(window)
                : (cb) => window.setTimeout(cb, 0);
            scheduleRefresh(() => {
                if (typeof window.queueLuxuryTransparencyRefresh === 'function') {
                    try { window.queueLuxuryTransparencyRefresh(undefined, { roots: [portal] }); } catch (error) {}
                } else if (typeof window.refreshLuxuryTransparencySurfaces === 'function') {
                    try { window.refreshLuxuryTransparencySurfaces(undefined, { roots: [portal] }); } catch (error) {}
                }
            });
        }

        function syncOverlayPortalVisibility() {
            const portal = document.getElementById(SOCIAL_OVERLAY_PORTAL_ID);
            if (!portal) return;
            const hasContent = socialOverlayPortalHasContent();
            portal.hidden = !hasContent;
            portal.setAttribute('aria-hidden', hasContent ? 'false' : 'true');
            if (hasContent) scheduleSocialOverlayTransparencyRefresh();
        }

        function syncSocialOverlayLock() {
            const pageOpen = isSocialGraphPageDialog();
            if (pageOpen) {
                if (socialOverlayLockArtifactsPresent()) clearSocialOverlayLockArtifacts();
                return;
            }
            const stateOpen = Boolean(activeDialog())
                || (typeof isPortalStoryViewerOpen === 'function' && isPortalStoryViewerOpen())
                || (typeof isPortalStoryComposerOpen === 'function' && isPortalStoryComposerOpen());
            const isLocked = document.body.dataset.socialOverlayLocked === '1';

            if (stateOpen && !isLocked) {
                const scrollY = window.scrollY || 0;
                const centerScroller = getSocialCenterScroller(root());
                const centerScrollY = centerScroller?.scrollTop || 0;
                document.body.dataset.socialOverlayScrollY = String(scrollY);
                document.body.dataset.socialOverlayCenterScrollY = String(centerScrollY);
                document.body.dataset.socialOverlayLocked = '1';
                document.body.classList.add('social-overlay-open');
                if (socialScrollLockActive()) {
                    pinCenterScrollerForOverlay();
                } else {
                    document.body.style.position = 'fixed';
                    document.body.style.top = `-${scrollY}px`;
                    document.body.style.left = '0';
                    document.body.style.right = '0';
                    document.body.style.width = '100%';
                }
                return;
            }

            if (!stateOpen) {
                if (socialOverlayPortalHasContent()) {
                    clearStaleSocialOverlayDom();
                }
                if (!isLocked && !socialOverlayLockArtifactsPresent()) return;

                const scrollY = Number(document.body.dataset.socialOverlayScrollY || 0);
                const centerScrollY = Number(document.body.dataset.socialOverlayCenterScrollY || 0);
                if (isLocked) {
                    if (socialScrollLockActive()) {
                        const centerScroller = getSocialCenterScroller(root());
                        restoreCenterScrollerOverlayPin();
                        if (centerScroller && Number.isFinite(centerScrollY)
                            && Math.abs(centerScroller.scrollTop - centerScrollY) > 1) {
                            centerScroller.scrollTop = centerScrollY;
                        }
                    } else {
                        try { window.scrollTo(0, scrollY); } catch (error) {}
                    }
                }
                clearSocialOverlayLockArtifacts();
            }
        }

        function focusSocialDialog() {
            if (isSocialGraphPageDialog()) return;
            const dialogRegion = document.getElementById('lux-glass-dialog-region');
            if (!dialogRegion) return;
            // Prefer the top-most overlay card (health child, then graph child, then any).
            const card = dialogRegion.querySelector('.social-project-health-child-slot .lux-glass-dialog-card')
                || dialogRegion.querySelector('.social-project-task-graph-child-slot .lux-glass-dialog-card')
                || dialogRegion.querySelector('.lux-glass-dialog-card');
            if (!card) return;
            const focusTarget = card.querySelector('input:not([type="hidden"]), select, textarea')
                || card.querySelector('button[data-action="dialog-close"]');
            if (focusTarget && typeof focusTarget.focus === 'function') {
                try { focusTarget.focus({ preventScroll: true }); } catch (error) {}
            }
        }

        const STACKED_DIALOG_KINDS = new Set([
            'comment-delete',
            'survey-draft-question-delete',
            'survey-draft-choice-delete',
            'project-health-plan-pick',
            'project-task-proof-preview',
            'post-compose-attach'
        ]);

        const PROJECT_HEALTH_GRAPH_SUB_OVERLAYS = new Set([
            'project-task-detail',
            'project-task-proof',
            'project-task-proof-preview',
            'project-task-edit',
            'project-task-create',
            'project-task-delete',
            'project-settings',
            'project-health-plan-pick'
        ]);

        function shouldReplaceGraphStackChild(type, currentDialog, graphAnchor) {
            if (!graphAnchor || text(graphAnchor.type) !== 'project-task-graph') return false;
            const nextKind = text(type);
            const currentKind = text(currentDialog?.type || '');
            if (!PROJECT_TASK_GRAPH_STACKED_DIALOGS.has(nextKind)) return false;
            if (!currentDialog || !PROJECT_TASK_GRAPH_STACKED_DIALOGS.has(currentKind)) return false;
            if (currentKind === 'project-health' && PROJECT_HEALTH_GRAPH_SUB_OVERLAYS.has(nextKind)) return false;
            return true;
        }

        function resetGraphStackedDialogUiWhenLeaving(ui, kind = '') {
            const leaving = text(kind);
            if (leaving === 'project-task-graph-history') {
                ui.projectTaskGraphHistoryPendingDeleteId = '';
            }
        }

        function resolveGraphStackAnchorDialog(ui) {
            return getProjectTaskGraphStackAnchorDialog(state())
                || (ui.previousDialog?.type === 'project-task-graph' ? ui.previousDialog : null)
                || (ui.projectTaskGraphStackAnchor?.type === 'project-task-graph' ? ui.projectTaskGraphStackAnchor : null);
        }

        function shouldRestoreStackedDialog(type = '') {
            const kind = text(type);
            if (STACKED_DIALOG_KINDS.has(kind)) return true;
            if (PROJECT_HEALTH_OVERLAY_DIALOGS.has(kind)
                && state().ui?.previousDialog?.type === 'project-health') {
                return true;
            }
            if (PROJECT_TASK_GRAPH_STACKED_DIALOGS.has(kind)
                && state().ui?.previousDialog) {
                return true;
            }
            return false;
        }

        function shouldUseDialogOnlyRender(type, activePanel) {
            if (isSocialGraphPageDialog(type)) return true;
            if (overlayDialogPreservesScroll(type)) return true;
            return workspaceDialogKeepsCenter(type)
                && ['projects', 'workspace', 'photography'].includes(activePanel);
        }

        function openDialog(type, payload = {}) {
            if (type === 'group-leave') {
                state().ui.groupLeaveStep = 1;
            }
            const ui = state().ui;
            const currentDialog = ui.socialDialog || null;
            let graphAnchorForSwitch = resolveGraphStackAnchorDialog(ui);
            const opensTaskGraphChild = type === 'project-task-graph-history'
                || type === 'project-task-graph-schedule-help';
            if (opensTaskGraphChild && !graphAnchorForSwitch) {
                ui.projectTaskGraphStackAnchor = {
                    type: 'project-task-graph',
                    projectId: text(payload?.projectId || ui.activeProjectId || '')
                };
                graphAnchorForSwitch = ui.projectTaskGraphStackAnchor;
            }
            if (opensTaskGraphChild
                && graphAnchorForSwitch
                && (!currentDialog || currentDialog.type === 'project-task-graph')) {
                ui.previousDialog = { ...graphAnchorForSwitch };
            }
            if (PROJECT_TASK_GRAPH_STACKED_DIALOGS.has(text(type))) {
                ui.projectTaskGraphQuickCreate = { open: false };
            }
            if (type === 'project-task-graph') {
                ui.projectTaskGraphStackAnchor = { type, ...payload };
            }
            if (shouldReplaceGraphStackChild(type, currentDialog, graphAnchorForSwitch)) {
                if (currentDialog?.type) resetGraphStackedDialogUiWhenLeaving(ui, currentDialog.type);
                ui.previousDialog = { ...graphAnchorForSwitch };
                ui.projectTaskGraphStackAnchor = { ...graphAnchorForSwitch };
            } else if (currentDialog?.type === 'project-health' && PROJECT_HEALTH_OVERLAY_DIALOGS.has(type)) {
                // Stack popup above Health; keep graph (or other) parent under Health for later restore.
                ui.previousDialog = {
                    ...currentDialog,
                    __restorePrevious: ui.previousDialog || null
                };
            } else if (currentDialog?.type === 'project-task-graph' && PROJECT_TASK_GRAPH_STACKED_DIALOGS.has(type)) {
                ui.previousDialog = { ...currentDialog };
                ui.projectTaskGraphStackAnchor = { ...currentDialog };
            } else if (currentDialog && STACKED_DIALOG_KINDS.has(type)) {
                ui.previousDialog = { ...currentDialog };
            } else if (!STACKED_DIALOG_KINDS.has(type) && !(currentDialog?.type === 'project-health' && PROJECT_HEALTH_OVERLAY_DIALOGS.has(type))) {
                const keepGraphAnchor = PROJECT_TASK_GRAPH_STACKED_DIALOGS.has(type)
                    && getProjectTaskGraphStackAnchorDialog(state())?.type === 'project-task-graph'
                    && currentDialog
                    && (currentDialog?.type === 'project-task-graph'
                        || PROJECT_TASK_GRAPH_STACKED_DIALOGS.has(currentDialog?.type));
                const keepDirectTaskGraphParent = opensTaskGraphChild
                    && graphAnchorForSwitch?.type === 'project-task-graph'
                    && (!currentDialog || currentDialog.type === 'project-task-graph');
                if (!keepGraphAnchor && !keepDirectTaskGraphParent) ui.previousDialog = null;
            }
            if (PROJECT_TASK_GRAPH_STACKED_DIALOGS.has(type)) {
                const graphAnchor = getProjectTaskGraphStackAnchorDialog(state());
                if (graphAnchor?.type === 'project-task-graph') {
                    ui.projectTaskGraphStackAnchor = { ...graphAnchor };
                    if (currentDialog?.type === 'project-task-graph' && !ui.previousDialog) {
                        ui.previousDialog = { ...currentDialog };
                    }
                }
            }
            ui.socialDialog = { type, ...payload };
            ensureSocialOverlayPortal();
            const activePanel = text(state().ui?.activePanel || '');
            if (shouldUseDialogOnlyRender(type, activePanel)) {
                renderDialogOnlyNow();
            } else {
                renderSocialPageNow(`dialog-${type}`);
            }
            bindOverlayPortalEvents();
            ensurePhotographyUploadFileSink();
            bindPhotographyUploadDialogFileInput();
            window.requestAnimationFrame(() => {
                syncSocialOverlayLock();
                syncOverlayPortalVisibility();
                focusSocialDialog();
                if (type === 'post-comments' || type === 'photography-comments' || type === 'comment-delete') {
                    relayoutCommentTrunks();
                    requestAnimationFrame(() => {
                        relayoutCommentTrunks();
                        requestAnimationFrame(() => relayoutCommentTrunks());
                    });
                }
                if (type === 'survey-results') syncSurveyResultsDialog();
            });
        }

        function syncSurveyResultsDialog(scope = root()) {
            const host = scope || document;
            const rail = host.querySelector?.('.lux-glass-dialog-body--survey-results[data-lux-scroll-rail]')
                || document.querySelector('.lux-glass-dialog-body--survey-results[data-lux-scroll-rail]');
            if (!rail) return;
            if (typeof window.initLuxScrollRail === 'function') {
                window.initLuxScrollRail(rail, { shellSelector: '.lux-glass-dialog-body--survey-results[data-lux-scroll-rail]' });
            } else if (typeof window.syncLuxScrollRail === 'function') {
                window.syncLuxScrollRail(rail, { shellSelector: '.lux-glass-dialog-body--survey-results[data-lux-scroll-rail]' });
            }
        }

        function closeDialog() {
            const ui = state().ui;
            if (!ui.socialDialog) {
                if (ui.projectTaskGraphStackAnchor || socialOverlayPortalHasContent()) {
                    ui.projectTaskGraphStackAnchor = null;
                    ui.previousDialog = null;
                    clearStaleSocialOverlayDom();
                    renderDialogOnlyNow();
                    syncSocialOverlayLock();
                }
                return;
            }
            const closingType = text(ui.socialDialog?.type || '');
            const closingProjectId = text(ui.socialDialog?.projectId || ui.activeProjectId || '');
            const parentDialog = ui.previousDialog || null;
            if (parentDialog && PROJECT_TASK_GRAPH_STACKED_DIALOGS.has(closingType)) {
                if (closingType === 'project-task-detail') ui.projectTaskChecklist = [];
                if (closingType === 'project-task-create' || closingType === 'project-task-edit') {
                    ui.projectTaskDependsOnIds = [];
                    if (closingType === 'project-task-create') ui.projectTaskCreateGroupId = '';
                }
                if (closingType === 'project-task-graph-history') {
                    ui.projectTaskGraphHistoryPendingDeleteId = '';
                }
                ui.socialDialog = null;
                restorePreviousDialog();
                return;
            }
            ui.closingDialogType = closingType;
            ui.socialDialog = null;
            ui.previousDialog = null;
            ui.projectTaskGraphStackAnchor = null;
            ui.coverImageFile = null;
            ui.groupLeaveStep = 1;
            if (closingType === 'photography-upload') {
                revokePhotographyUploadPreview(ui.photographyUploadDraft);
                ui.photographyUploadDraft = {};
                ui.photographyUploadStep = 1;
            }
            if (closingType === 'event-create') clearEventDraft();
            if (closingType === 'post-compose') clearPostComposeDraft(state());
            if (closingType === 'survey-results') {
                ui.surveyResultsId = '';
                ui.surveyResultsPayload = null;
            }
            if (closingType === 'portfolio-viewer') {
                ui.viewingPortfolioUserId = '';
                ui.viewingPortfolio = null;
                ui.viewingPortfolioError = '';
            }
            if (closingType === 'project-task-detail') {
                ui.projectTaskChecklist = [];
            }
            if (closingType === 'project-task-create' || closingType === 'project-task-edit') {
                // Avoid leaking depends-on into the next create dialog.
                ui.projectTaskDependsOnIds = [];
                if (closingType === 'project-task-create') ui.projectTaskCreateGroupId = '';
            }
            if (closingType === 'project-task-graph-history') {
                ui.projectTaskGraphHistoryPendingDeleteId = '';
            }
            if (closingType === 'project-task-graph') {
                // Capture last pan/zoom before teardown so reopen restores camera.
                try {
                    const host = getProjectTaskGraphHost();
                    const canvas = host?.querySelector('[data-project-task-graph-canvas][data-scroll-pan="1"]');
                    if (canvas) {
                        const pan = readProjectTaskGraphPanFromScroll(canvas);
                        const zoom = clampProjectTaskGraphZoom(Number(canvas.getAttribute('data-zoom')) || ui.projectTaskGraphZoom || 1);
                        ui.projectTaskGraphPan = { x: pan.x, y: pan.y };
                        ui.projectTaskGraphZoom = zoom;
                    }
                    persistProjectTaskGraphView({ ui }, closingProjectId);
                } catch (error) {}
                ui.projectTaskGraphFocusGroupId = '';
                ui.projectTaskGraphStackAnchor = null;
                ui.projectTaskGraphHistoryPendingDeleteId = '';
                // Keep-center close would leave stale preview panes; force rebuild.
                clearProjectTabPaneCache(closingProjectId);
                rebuildActiveProjectTabPaneIfPreviewHost(closingProjectId);
                ui.projectTaskGraphPreviewStale = false;
            }
            const activePanel = text(state().ui?.activePanel || '');
            if (shouldUseDialogOnlyRender(closingType, activePanel)) {
                renderDialogOnlyNow();
            } else {
                renderSocialPageNow('dialog-close');
            }
            ui.closingDialogType = '';
            syncSocialOverlayLock();
        }

        function restorePreviousDialog() {
            const ui = state().ui;
            const parent = ui.previousDialog || null;
            if (!parent || !parent.type) {
                ui.previousDialog = null;
                ui.projectTaskGraphStackAnchor = null;
                closeDialog();
                return;
            }
            if (parent.type === 'group-leave') {
                ui.groupLeaveStep = Number(parent.groupLeaveStep || 1);
            }
            const nested = parent.__restorePrevious || null;
            const clean = { ...parent };
            delete clean.__restorePrevious;
            ui.previousDialog = nested;
            ui.socialDialog = clean;
            const parentType = text(clean.type || '');
            if (parentType === 'project-task-graph') {
                const region = document.getElementById('lux-glass-dialog-region');
                const stack = region?.querySelector('.social-project-task-graph-stack');
                const childSlot = region?.querySelector('[data-project-task-graph-child-slot="1"]');
                if (childSlot) {
                    childSlot.innerHTML = '';
                    childSlot.hidden = true;
                    delete region.__kiuLastMarkup;
                }
                stack?.classList.remove('social-project-task-graph-stack--child-open');
            }
            const activePanel = text(ui.activePanel || '');
            if (shouldUseDialogOnlyRender(parentType, activePanel)) {
                renderDialogOnlyNow();
            } else {
                renderSocialPageNow(`dialog-${parentType}`);
            }
            window.requestAnimationFrame(() => {
                syncSocialOverlayLock();
                focusSocialDialog();
            });
        }

        function activeDialog() {
            return state().ui.socialDialog || null;
        }

        function isCommentDialog() {
            const type = text(activeDialog()?.type || '');
            return type === 'post-comments' || type === 'photography-comments';
        }
        return {
            SOCIAL_OVERLAY_PORTAL_ID,
            SOCIAL_OVERLAY_REGION_IDS,
            SOCIAL_OVERLAY_SURFACE_SELECTOR,
            STACKED_DIALOG_KINDS,
            socialOverlayPortalHasContent,
            socialOverlayLockArtifactsPresent,
            clearSocialOverlayLockArtifacts,
            clearStaleSocialOverlayDom,
            pruneStaleSocialOverlayState,
            socialInteractionContains,
            socialDialogRegion,
            photographyUploadForm,
            normalizeSocialOverlayDialogRegion,
            ensureSocialOverlayPortal,
            scheduleSocialOverlayTransparencyRefresh,
            syncOverlayPortalVisibility,
            syncSocialOverlayLock,
            focusSocialDialog,
            shouldRestoreStackedDialog,
            openDialog,
            syncSurveyResultsDialog,
            closeDialog,
            restorePreviousDialog,
            activeDialog,
            isCommentDialog
        };
    }

    window.createKiuSocialOverlayChromeApi = createKiuSocialOverlayChromeApi;
})();
