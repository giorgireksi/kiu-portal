/* READABILITY: social page hub: route state, rendering coordination, and lazy domain wiring. Sections: Purpose | Boundaries | Exports.
--- READABILITY: Purpose ---
Owns the route-facing responsibilities named above.
--- READABILITY: Boundaries ---
Delegates peeled domain behavior through explicit runtime APIs.
--- READABILITY: Exports ---
Publishes only the host/runtime contract consumed by its loader.
*/
/* FINDABILITY: social shell / domain dispatch — see docs/findability-index.md#social-shell */
/* Rebuilt social workspace page.
 * Keeps rendering thin and delegates state/network work to social-runtime-lite.js.
 */

(function initRebuiltSocialPage() {
    if (window.__KIU_SOCIAL_PAGE_REBUILT) return;
    window.__KIU_SOCIAL_PAGE_REBUILT = true;
    // Workspace lazy-export stubs: social-workspace-stubs.js
    const __installKiuSocialWorkspaceStubs = window.installKiuSocialWorkspaceStubs || (() => ({}));

    const PROJECT_TASK_GRAPH_STACKED_DIALOGS = new Set([
        'project-task-detail',
        'project-task-edit',
        'project-task-create',
        'project-task-delete',
        'project-settings',
        'project-health',
        'project-risk',
        'project-task-graph-history',
        'project-task-graph-schedule-help'
    ]);
    const PROJECT_HEALTH_OVERLAY_DIALOGS = new Set([
        'project-task-detail',
        'project-task-edit',
        'project-task-create',
        'project-task-delete',
        'project-settings',
        'project-risk',
        'project-health-plan-pick'
    ]);
    window.PROJECT_TASK_GRAPH_STACKED_DIALOGS = PROJECT_TASK_GRAPH_STACKED_DIALOGS;
    window.PROJECT_HEALTH_OVERLAY_DIALOGS = PROJECT_HEALTH_OVERLAY_DIALOGS;

    // Overlay portal + dialog open/close/lock chrome: social-overlay-chrome.js
    const __overlay = (typeof window.createKiuSocialOverlayChromeApi === 'function'
        ? window.createKiuSocialOverlayChromeApi({
            text, state, root,
            PROJECT_TASK_GRAPH_STACKED_DIALOGS,
            PROJECT_HEALTH_OVERLAY_DIALOGS,
            workspaceDialogKeepsCenter: typeof window.workspaceDialogKeepsCenter === 'function' ? window.workspaceDialogKeepsCenter : workspaceDialogKeepsCenter,
            overlayDialogPreservesScroll: typeof window.overlayDialogPreservesScroll === 'function' ? window.overlayDialogPreservesScroll : overlayDialogPreservesScroll,
            isProjectTaskGraphStackActive: typeof window.isProjectTaskGraphStackActive === 'function' ? window.isProjectTaskGraphStackActive : () => false,
            getProjectTaskGraphStackAnchorDialog: typeof window.getProjectTaskGraphStackAnchorDialog === 'function' ? window.getProjectTaskGraphStackAnchorDialog : () => null,
            renderDialogOnlyNow,
            renderSocialPageNow: (reason) => {
                const fn = window.renderSocialPageNow || window.__kiuSocialLiteRenderPage;
                return typeof fn === 'function' ? fn(reason) : undefined;
            },
            getSocialCenterScroller: (...args) => {
                const fn = window.getSocialCenterScroller;
                return typeof fn === 'function' ? fn(...args) : null;
            },
            scrollSocialCenterTo: (...args) => {
                const fn = window.scrollSocialCenterTo;
                return typeof fn === 'function' ? fn(...args) : undefined;
            },
            socialScrollLockActive: (...args) => {
                const fn = window.socialScrollLockActive;
                return typeof fn === 'function' ? fn(...args) : false;
            },
            bindOverlayPortalEvents: () => {
                const fn = window.__kiuBindOverlayPortalEvents || window.bindOverlayPortalEvents;
                if (typeof fn === 'function') fn();
            },
            ensurePhotographyUploadFileSink: typeof window.ensurePhotographyUploadFileSink === 'function' ? window.ensurePhotographyUploadFileSink : () => {},
            bindPhotographyUploadDialogFileInput: typeof window.bindPhotographyUploadDialogFileInput === 'function' ? window.bindPhotographyUploadDialogFileInput : () => {},
            revokePhotographyUploadPreview: typeof window.revokePhotographyUploadPreview === 'function' ? window.revokePhotographyUploadPreview : () => {},
            clearEventDraft: (...args) => {
                const fn = window.clearEventDraft || (window.KiuSocialChromeModel || {}).clearEventDraft;
                return typeof fn === 'function' ? fn(...args) : undefined;
            },
            clearPostComposeDraft: typeof window.clearPostComposeDraft === 'function' ? window.clearPostComposeDraft : () => {},
            getProjectTaskGraphHost: typeof window.getProjectTaskGraphHost === 'function' ? window.getProjectTaskGraphHost : () => null,
            readProjectTaskGraphPanFromScroll: typeof window.readProjectTaskGraphPanFromScroll === 'function' ? window.readProjectTaskGraphPanFromScroll : () => ({ x: 0, y: 0 }),
            clampProjectTaskGraphZoom: typeof window.clampProjectTaskGraphZoom === 'function' ? window.clampProjectTaskGraphZoom : (z) => z,
            persistProjectTaskGraphView: typeof window.persistProjectTaskGraphView === 'function' ? window.persistProjectTaskGraphView : () => {},
            clearProjectTabPaneCache: typeof window.clearProjectTabPaneCache === 'function' ? window.clearProjectTabPaneCache : () => {},
            rebuildActiveProjectTabPaneIfPreviewHost: typeof window.rebuildActiveProjectTabPaneIfPreviewHost === 'function' ? window.rebuildActiveProjectTabPaneIfPreviewHost : () => {},
            relayoutCommentTrunks: (scope) => {
                const fn = window.relayoutCommentTrunks || window.__kiuRelayoutCommentTrunks;
                if (typeof fn === 'function') fn(scope);
            }
        })
        : {});
    const {
        SOCIAL_OVERLAY_PORTAL_ID, SOCIAL_OVERLAY_REGION_IDS, SOCIAL_OVERLAY_SURFACE_SELECTOR, STACKED_DIALOG_KINDS,
        socialOverlayPortalHasContent, socialOverlayLockArtifactsPresent, clearSocialOverlayLockArtifacts, clearStaleSocialOverlayDom,
        pruneStaleSocialOverlayState, socialInteractionContains, socialDialogRegion, photographyUploadForm,
        normalizeSocialOverlayDialogRegion, ensureSocialOverlayPortal, scheduleSocialOverlayTransparencyRefresh, syncOverlayPortalVisibility,
        syncSocialOverlayLock, focusSocialDialog, shouldRestoreStackedDialog, openDialog,
        syncSurveyResultsDialog, closeDialog, restorePreviousDialog, activeDialog,
        isCommentDialog
    } = __overlay;

    const ROOT_ID = 'public-social-root';
    const PANEL_KEY = 'KIU_SOCIAL_ACTIVE_PANEL';
    const CHAT_KEY = 'KIU_SOCIAL_ACTIVE_CHAT';
    const WORKSPACE_NAV_COLLAPSED_KEY = 'KIU_SOCIAL_WORKSPACE_NAV_COLLAPSED';
    const DESK_VIEWS_KEY = 'KIU_SOCIAL_DESK_VIEWS';
    /** Manual Health plan lists per project: { [projectId]: { days|weeks|months|all: taskId[] } } */
    const PROJECT_WEEK_PLAN_KEY = 'KIU_SOCIAL_PROJECT_WEEK_PLAN';
    const PROJECT_WEEK_PLAN_MAX = 40;
    const PROJECT_PLAN_HORIZONS = [
        { id: 'days', label: 'Days' },
        { id: 'weeks', label: 'Weeks' },
        { id: 'months', label: 'Months' },
        { id: 'all', label: 'All' }
    ];
    const PROJECT_PLAN_HORIZON_IDS = new Set(PROJECT_PLAN_HORIZONS.map((h) => h.id));
    function readDeskSavedViews() {
        try {
            const raw = localStorage.getItem(DESK_VIEWS_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed.filter((entry) => entry && text(entry.id) && text(entry.name)) : [];
        } catch (error) {
            return [];
        }
    }
    function writeDeskSavedViews(views) {
        try {
            localStorage.setItem(DESK_VIEWS_KEY, JSON.stringify(Array.isArray(views) ? views.slice(0, 20) : []));
        } catch (error) {}
    }
    const normalizeProjectPlanHorizon = window.normalizeProjectPlanHorizon || (window.KiuSocialWorkspaceWeekPlanModel || {}).normalizeProjectPlanHorizon;
    function projectPlanHorizonLabel(horizon) {
        const id = normalizeProjectPlanHorizon(horizon);
        return PROJECT_PLAN_HORIZONS.find((h) => h.id === id)?.label || 'Weeks';
    }
    function defaultPlanPickDueForHorizon(horizon) {
        const h = normalizeProjectPlanHorizon(horizon);
        if (h === 'days') return '7d';
        if (h === 'weeks') return '14d';
        if (h === 'months') return '60d';
        return 'all';
    }
    const migrateProjectPlanEntry = window.migrateProjectPlanEntry || (window.KiuSocialWorkspaceWeekPlanModel || {}).migrateProjectPlanEntry;
    function taskActivityMs(task) {
        const candidates = [
            Date.parse(text(task?.updatedAt || '')),
            Date.parse(text(task?.createdAt || '')),
            Date.parse(text(task?.dueAt || '')),
            Date.parse(text(task?.startAt || ''))
        ].filter((ms) => Number.isFinite(ms));
        return candidates.length ? Math.max(...candidates) : 0;
    }
    const SOCIAL_COMMUNITY_MODULE_URL = 'assets/js/pages/social-community.js?v=20260815-staff-student-directory1';
    const SOCIAL_ALERTS_MODULE_URL = 'assets/js/pages/social-alerts.js?v=20260714-alerts-click1';
    const SOCIAL_LOST_FOUND_MODULE_URL = 'assets/js/pages/social-lost-found.js?v=20260807-socialtopnav34';
    const SOCIAL_PHOTOGRAPHY_MODULE_URL = 'assets/js/pages/social-photography.js?v=20260807-socialtopnav34';
    const SOCIAL_SURVEYS_MODULE_URL = 'assets/js/pages/social-surveys.js?v=20260807-socialtopnav34';
    const SOCIAL_RESEARCH_PDF_RUNTIME_URL = 'assets/js/pages/social-research-pdf-runtime.js?v=20260801-researchviewer12';
    const SOCIAL_RESEARCH_MODULE_URL = 'assets/js/pages/social-research.js?v=20260807-socialtopnav34';
    const PHOTOGRAPHY_UPLOAD_FILE_SINK_ID = 'kiu-photography-upload-file-sink';
    const PHOTOGRAPHY_UPLOAD_MAX_BYTES = 25 * 1024 * 1024;
    const SOCIAL_MESSAGES_MODULE_URL = 'assets/js/pages/social-messages.js?v=20260816-customscroll4';
    const SOCIAL_PROFILE_MODULE_URL = 'assets/js/pages/social-profile.js?v=20260714-profile-click1';
    const SOCIAL_EVENTS_MODULE_URL = 'assets/js/pages/social-events.js?v=20260807-socialtopnav34';
    const SOCIAL_GROUPS_MODULE_URL = 'assets/js/pages/social-groups.js?v=20260807-socialtopnav34';
    const SOCIAL_FEED_COMMENTS_MODULE_URL = 'assets/js/pages/social-feed-comments-runtime.js?v=20260728-socshell25';
    const SOCIAL_FEED_MODULE_URL = 'assets/js/pages/social-feed.js?v=20260807-socialtopnav34';
    const SOCIAL_PAGES_MODULE_URL = 'assets/js/pages/social-pages.js?v=20260807-socialtopnav34';
    const SOCIAL_DIALOG_STYLES_URL = 'assets/css/lux-modals.css?v=20260816-socialmodals1';
    let socialDialogStylesPromise = null;
    let socialDialogStylesReady = false;
    const SOCIAL_WORKSPACE_SCHEDULE_MODEL_URL = 'assets/js/pages/social-workspace-schedule-model.js?v=20260726-socfix16';
    const SOCIAL_WORKSPACE_HEALTH_MODEL_URL = 'assets/js/pages/social-workspace-health-model.js?v=20260726-socfix16';
    const SOCIAL_WORKSPACE_GRAPH_DESK_MODEL_URL = 'assets/js/pages/social-workspace-graph-desk-model.js?v=20260726-socfix20';
    const SOCIAL_WORKSPACE_GRAPH_MODEL_URL = 'assets/js/pages/social-workspace-graph-model.js?v=20260726-socfix20';
    const SOCIAL_WORKSPACE_PORTFOLIO_MODEL_URL = 'assets/js/pages/social-workspace-portfolio-model.js?v=20260726-socfix16';
    const SOCIAL_WORKSPACE_WEEK_PLAN_MODEL_URL = 'assets/js/pages/social-workspace-week-plan-model.js?v=20260726-socfix16';
    const SOCIAL_WORKSPACE_GRAPH_SYNC_RUNTIME_URL = 'assets/js/pages/social-workspace-graph-sync-runtime.js?v=20260808-overallperf1';
    const SOCIAL_WORKSPACE_GRAPH_LAYOUT_RUNTIME_URL = 'assets/js/pages/social-workspace-graph-layout-runtime.js?v=20260807-runtimefix1';
    const SOCIAL_WORKSPACE_SCHEDULE_UI_URL = 'assets/js/pages/social-workspace-schedule-ui.js?v=20260726-socfix16';
    const SOCIAL_WORKSPACE_TAB_RUNTIME_URL = 'assets/js/pages/social-workspace-tab-runtime.js?v=20260726-socfix42';
    const SOCIAL_WORKSPACE_EVENTS_INPUT_URL = 'assets/js/pages/social-workspace-events-input-runtime.js?v=20260807-socialtopnav34';
    const SOCIAL_WORKSPACE_EVENTS_SUBMIT_URL = 'assets/js/pages/social-workspace-events-submit-runtime.js?v=20260807-socialtopnav34';
    const SOCIAL_WORKSPACE_EVENTS_URL = 'assets/js/pages/social-workspace-events.js?v=20260805-health-scroll2';
    const SOCIAL_WORKSPACE_PANEL_BUDGET_URL = 'assets/js/pages/social-workspace-panel-budget-runtime.js?v=20260726-socfix38';
    const SOCIAL_WORKSPACE_PANEL_TEAM_URL = 'assets/js/pages/social-workspace-panel-team-runtime.js?v=20260726-socfix43';
    const SOCIAL_WORKSPACE_PANEL_URL = 'assets/js/pages/social-workspace-panel.js?v=20260807-socialtopnav34';
    const SOCIAL_WORKSPACE_GRAPH_RUNTIME_URL = 'assets/js/pages/social-workspace-graph-runtime.js?v=20260808-overallperf1';
    const SOCIAL_WORKSPACE_DIALOGS_URL = 'assets/js/pages/social-workspace-dialogs.js?v=20260807-socialsurface1';
    const SOCIAL_WORKSPACE_GRAPH_RENDER_URL = 'assets/js/pages/social-workspace-graph-render.js?v=20260807-mapopaque1';
    const SOCIAL_WORKSPACE_TASK_UI_URL = 'assets/js/pages/social-workspace-task-ui.js?v=20260807-socialsurface1';
    const SOCIAL_WORKSPACE_PORTFOLIO_RUNTIME_URL = 'assets/js/pages/social-workspace-portfolio-runtime.js?v=20260802-portfolio-viewer1';
    const SOCIAL_WORKSPACE_PORTFOLIO_EDITOR_URL = 'assets/js/pages/social-workspace-portfolio-editor.js?v=20260802-portfolio-viewer3';
    const SOCIAL_WORKSPACE_PORTFOLIO_UI_URL = 'assets/js/pages/social-workspace-portfolio-ui.js?v=20260802-pincss1';
    const SOCIAL_WORKSPACE_PROJECT_CHROME_URL = 'assets/js/pages/social-workspace-project-chrome.js?v=20260807-socialsurface1';
    const SOCIAL_WORKSPACE_DIALOG_ROUTE_URL = 'assets/js/pages/social-workspace-dialog-route.js?v=20260807-graphstack1';
    const SOCIAL_WORKSPACE_MODULE_URL = 'assets/js/pages/social-workspace.js?v=20260807-runtimefix1';
    const DIRECTORY_REFRESH_MS = 180;
    const MAX_RENDER_ATTEMPTS = 24;
    const USER_ROLES_FALLBACK = {
        STUDENT: 'student',
        PROFESSOR: 'professor',
        TA: 'ta',
        ADMIN: 'admin',
        STUDENT_SERVICE: 'student_service'
    };

    function ensureSocialDialogStyles() {
        if (socialDialogStylesReady) return Promise.resolve(true);
        const existing = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).find((link) =>
            link.dataset.kiuSocialDialogStyles === SOCIAL_DIALOG_STYLES_URL
            || link.getAttribute('href') === SOCIAL_DIALOG_STYLES_URL
        );
        if (existing) {
            if (socialDialogStylesPromise) return socialDialogStylesPromise;
            socialDialogStylesReady = true;
            return Promise.resolve(true);
        }
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = SOCIAL_DIALOG_STYLES_URL;
        link.dataset.kiuSocialDialogStyles = SOCIAL_DIALOG_STYLES_URL;
        socialDialogStylesPromise = new Promise((resolve) => {
            link.addEventListener('load', () => resolve(true), { once: true });
            link.addEventListener('error', () => resolve(false), { once: true });
        }).then((loaded) => {
            socialDialogStylesReady = true;
            return loaded;
        });
        document.head.appendChild(link);
        return socialDialogStylesPromise;
    }

    function renderProjectWorkspaceNavButtons(project, options = {}) {
        const projectId = escape(text(project?.id || ''));
        const riskCount = Number(project?.riskCount) || 0;
        const riskPill = riskCount > 0 ? ` <span class="social-neo-pill home-hover-chip">${escape(String(riskCount))}</span>` : '';
        const btnClass = text(options.buttonClass || 'lux-secondary-btn');
        return `
            <button class="${btnClass}" type="button" data-action="project-health-open" data-project-id="${projectId}"><i class="fas fa-heart-pulse"></i> Health</button>
            <button class="${btnClass}" type="button" data-action="project-risk-open" data-project-id="${projectId}"><i class="fas fa-triangle-exclamation"></i> Risks${riskPill}</button>
        `.trim();
    }
    const projectTaskDownstreamIds = window.projectTaskDownstreamIds || (window.KiuSocialTaskModel || {}).projectTaskDownstreamIds;
    const normalizeProjectTaskStatusId = window.normalizeProjectTaskStatusId || (window.KiuSocialTaskModel || {}).normalizeProjectTaskStatusId;
    const buildSocialRenderSignature = window.buildSocialRenderSignature;

    /** Desk readiness from dependsOn (graph parents) — pure read. */

    /**
     * Order package/ungrouped tasks parent-first (DFS preorder).
     * Parent = dependency predecessor in dependsOnTaskIds when both ends are in `tasks`.
     * Children sit directly under their primary in-list parent (not flat by depth).
     * Multi-parent: first in-list dep after sibling sort is primary; others only affect readiness UI.
     */

    const countDeskForestNodes = window.countDeskForestNodes || (window.KiuSocialTaskModel || {}).countDeskForestNodes;
    const formatProjectTaskBudgetEstimate = window.formatProjectTaskBudgetEstimate || (window.KiuSocialTaskModel || {}).formatProjectTaskBudgetEstimate;
    const parseProjectTaskBudgetEstimate = window.parseProjectTaskBudgetEstimate || (window.KiuSocialTaskModel || {}).parseProjectTaskBudgetEstimate;
    const parseProjectTaskPriorityPayload = window.parseProjectTaskPriorityPayload || (window.KiuSocialTaskModel || {}).parseProjectTaskPriorityPayload;
    const parseProjectTaskActualsPayload = window.parseProjectTaskActualsPayload || (window.KiuSocialTaskModel || {}).parseProjectTaskActualsPayload;
    const normalizeTaskScore1to5 = window.normalizeTaskScore1to5 || (window.KiuSocialTaskModel || {}).normalizeTaskScore1to5;
    const normalizeTaskPriorityModel = window.normalizeTaskPriorityModel || (window.KiuSocialTaskModel || {}).normalizeTaskPriorityModel;
    const computeTaskMatrixScore = window.computeTaskMatrixScore || (window.KiuSocialTaskModel || {}).computeTaskMatrixScore;
    const computeTaskMatrixBucket = window.computeTaskMatrixBucket || (window.KiuSocialTaskModel || {}).computeTaskMatrixBucket;

    // Cost can be money and/or time. Time is a number + unit ('h' hours / 'd' days).
    const normalizeTaskTimeUnit = window.normalizeTaskTimeUnit || (window.KiuSocialTaskModel || {}).normalizeTaskTimeUnit;
    const normalizeTaskTime = window.normalizeTaskTime || (window.KiuSocialTaskModel || {}).normalizeTaskTime;
    const formatTaskTime = window.formatTaskTime || (window.KiuSocialTaskModel || {}).formatTaskTime;
    const formatTaskTimeVariance = window.formatTaskTimeVariance || (window.KiuSocialTaskModel || {}).formatTaskTimeVariance;
    const formatTaskCostVariance = window.formatTaskCostVariance || (window.KiuSocialTaskModel || {}).formatTaskCostVariance;

    // Impact×Effort is the headline priority. Always matrix now (no manual/mode).

    const buildProjectTaskFlowEdges = window.buildProjectTaskFlowEdges || (window.KiuSocialTaskModel || {}).buildProjectTaskFlowEdges;
    function loadTaskGraphSyncMarker(projectId) {
        try {
            return text(localStorage.getItem(projectTaskGraphSyncStorageKey(projectId)) || '');
        } catch (error) {
            return '';
        }
    }
    function saveTaskGraphSyncMarker(projectId, iso = '') {
        const marker = text(iso || '');
        if (!marker) return;
        try {
            localStorage.setItem(projectTaskGraphSyncStorageKey(text(projectId)), marker);
        } catch (error) {}
    }
    function refreshDeskAfterGraphMembership(projectId = '') {
        try {
            const runtime = state();
            const id = text(projectId || runtime?.ui?.activeProjectId || '');
            if (!id) return;
            const panel = text(runtime?.ui?.activePanel || '');
            const tab = text(runtime?.ui?.projectTab || '');
            if ((panel === 'workspace' || panel === 'projects') && tab === 'tasks' && text(runtime?.ui?.activeProjectId) === id) {
                if (typeof refreshProjectTasksTabBody === 'function') {
                    refreshProjectTasksTabBody('task-graph-group-member');
                } else if (typeof refreshProjectTasksTabPane === 'function') {
                    refreshProjectTasksTabPane('task-graph-group-member');
                }
            }
        } catch (error) {}
    }
    const polylineToSmoothPathD = window.polylineToSmoothPathD || (window.KiuSocialFormModel || {}).polylineToSmoothPathD;
    function openProjectRiskForTask(projectId, taskId) {
        const pid = text(projectId);
        const tid = text(taskId);
        if (!pid || !tid) return;
        state().ui.projectRiskTaskId = tid;
        state().ui.projectRiskGroupId = '';
        state().ui.projectRiskEditId = '';
        state().ui.projectRiskComposeOpen = false;
        closeProjectTaskGraphContextMenu();
        return ensureSocialWorkspaceModule().then(() => openDialog('project-risk', { projectId: pid, groupId: '', taskId: tid }));
    }
    function projectHasTaskTitle(project, title, { excludeTaskId = '' } = {}) {
        const want = text(title);
        if (!want) return false;
        const skip = text(excludeTaskId);
        return (Array.isArray(project?.tasks) ? project.tasks : []).some((task) => {
            if (skip && text(task?.id) === skip) return false;
            return text(task?.title) === want;
        });
    }
    function assertUniqueProjectTaskTitle(project, title, { excludeTaskId = '' } = {}) {
        const want = text(title);
        if (!want) {
            const error = new Error('Task title is required.');
            error.userFacing = true;
            throw error;
        }
        if (projectHasTaskTitle(project, want, { excludeTaskId })) {
            const error = new Error(`A task named “${want}” already exists in this project.`);
            error.userFacing = true;
            throw error;
        }
        return want;
    }
    const parseDependsOnFromForm = window.parseDependsOnFromForm || (window.KiuSocialFormModel || {}).parseDependsOnFromForm;

    let renderProjectWorkspaceTabPanel = null;
    const WORKSPACE_DIALOG_KEEP_CENTER = new Set([
        'project-settings',
        'project-task-create',
        'project-task-edit',
        'project-column-tasks',
        'project-task-detail',
        'project-task-delete',
        'project-task-graph',
        'project-task-graph-history',
        'project-task-graph-schedule-help',
        'project-create',
        'project-risk',
        'project-health',
        'project-health-plan-pick'
    ]);
    const OVERLAY_DIALOG_PRESERVE_SCROLL = new Set([
        'post-comments',
        'photography-comments',
        'comment-delete',
        'comment-report'
    ]);

    const socialEventBinding = { bound: false, boundHost: null, hostEventAbort: null };
    let lastSocialRoot = null;
    let globalKeydownBound = false;
    let scrollLockMediaBound = false;
    let socialVisualViewportBound = false;
    let renderAttemptCount = 0;
    let photographySearchTimer = 0;
    const GROUP_INVITE_SEARCH_MS = 220;
    let socialCommunityModulePromise = null;
    let socialAlertsModulePromise = null;
    let socialLostFoundModulePromise = null;
    let socialPhotographyModulePromise = null;
    let socialSurveysModulePromise = null;
    let socialResearchModulePromise = null;
    let socialMessagesModulePromise = null;
    let socialProfileModulePromise = null;
    let socialDesktopModulePrefetchScheduled = false;
    let socialDirectoryPrefetchScheduled = false;
    let socialRouteGuardianBound = false;
    let socialRouteGuardianInterval = 0;
    function isStandaloneSocialRoute() {
        const pathname = String(window.location?.pathname || '').toLowerCase();
        return pathname.endsWith('/social.html') || pathname.endsWith('social.html');
    }
    function socialHostMarkup() {
        return `
            <div id="page-social" class="page-section active-page social-route-standalone-shell">
                <div id="public-social-root">
                    <div id="social-neo-root" class="social-neo social-neo-facebook" data-panel="feed">
                        <div id="social-neo-flash-region"></div>
                        <div id="social-neo-topbar-region"></div>
                        <div id="social-neo-command-region"></div>
                        <div id="social-neo-workspace-nav-reveal-region"></div>
                        <div class="social-neo-shell">
                            <div id="social-neo-workspace-nav-region"></div>
                            <div class="social-neo-center" id="social-neo-center-region"></div>
                        </div>
                        <div id="social-neo-drawer-region"></div>
                        <div id="social-neo-mobile-tab-region"></div>
                        <div id="social-neo-toast-region"></div>
                    </div>
                </div>
            </div>
        `;
    }
    function ensureSocialRouteHost() {
        if (!isStandaloneSocialRoute()) return document.getElementById(ROOT_ID);
        let socialRoot = document.getElementById(ROOT_ID);
        if (socialRoot) return socialRoot;
        const appContent = document.getElementById('app-content');
        if (!appContent) return null;
        appContent.innerHTML = socialHostMarkup();
        socialRoot = document.getElementById(ROOT_ID);
        if (socialRoot) {
            document.body.classList.add('lux-route-social', 'lux-entry-social', 'lux-family-social', 'lux-site-modernized');
            document.body.classList.remove('lux-route-home', 'lux-entry-home', 'lux-home-page');
            document.body.classList.add('lux-unified-shell', 'lux-nonhome-page');
            document.body.dataset.luxPage = 'social';
            document.body.dataset.luxEntry = 'social';
            document.body.dataset.luxFamily = 'social';
            socialEventBinding.bound = false;
            socialEventBinding.boundHost = null;
            bindEvents();
        }
        return socialRoot;
    }
    function guardStandaloneSocialRoute() {
        if (!isStandaloneSocialRoute() || socialRouteGuardianBound) return;
        const appContent = document.getElementById('app-content');
        if (!appContent) return;
        socialRouteGuardianBound = true;
        let guardianReconcileTimer = 0;
        let guardianRenderInProgress = false;

        const reconcile = () => {
            if (guardianRenderInProgress) return;
            const socialRoot = document.getElementById(ROOT_ID);
            if (socialRoot && socialRoot === lastSocialRoot) return;
            if (!socialRoot) {
                lastSocialRoot = null;
                if (!ensureSocialRouteHost()) return;
            }
            lastSocialRoot = document.getElementById(ROOT_ID);
            socialEventBinding.bound = false;
            socialEventBinding.boundHost = null;
            bindEvents();
            guardianRenderInProgress = true;
            renderSocialPageNow('social-route-guardian');
            window.setTimeout(() => { guardianRenderInProgress = false; }, 200);
        };

        const mutationTouchesSocialHost = (mutations) => mutations.some((mutation) => {
            if (mutation.type !== 'childList') return false;
            // A direct app-content mutation can replace the route host wholesale.
            if (mutation.target === appContent) return true;
            return [...mutation.addedNodes, ...mutation.removedNodes].some((node) => {
                if (node.nodeType !== Node.ELEMENT_NODE) return false;
                return node.id === ROOT_ID || node.querySelector?.(`#${ROOT_ID}`);
            });
        });
        const observer = new MutationObserver((mutations) => {
            if (guardianRenderInProgress || !mutationTouchesSocialHost(mutations)) return;
            clearTimeout(guardianReconcileTimer);
            guardianReconcileTimer = setTimeout(reconcile, 150);
        });
        observer.observe(appContent, { childList: true, subtree: true });
        window.setTimeout(reconcile, 200);
        window.setTimeout(reconcile, 800);
        window.setTimeout(reconcile, 2000);
        if (socialRouteGuardianInterval) window.clearInterval(socialRouteGuardianInterval);
        socialRouteGuardianInterval = window.setInterval(() => {
            if (!document.getElementById(ROOT_ID)) reconcile();
        }, 1000);
        window.setTimeout(() => {
            if (socialRouteGuardianInterval) {
                window.clearInterval(socialRouteGuardianInterval);
                socialRouteGuardianInterval = 0;
            }
        }, 12000);
    }
    function root() {
        return document.getElementById(ROOT_ID) || ensureSocialRouteHost();
    }
    function state() {
        return typeof getPortalSocialRuntimeState === 'function'
            ? (getPortalSocialRuntimeState() || {})
            : { ui: {}, social: {} };
    }
    function currentUser() {
        try {
            if (typeof getCurrentUser === 'function') return getCurrentUser() || window.currentUser || null;
        } catch (error) {}
        return window.currentUser || null;
    }
    function text(value) {
        return String(value == null ? '' : value).trim();
    }
    const countNum = window.countNum || (window.KiuSocialChromeModel || {}).countNum;
    const postKey = window.postKey || (window.KiuSocialChromeModel || {}).postKey;
    function syncCommentDraftFromTarget(target) {
        const commentForm = target?.closest?.('form[data-form="comment"], form[data-form="dialog-comment"]');
        if (!commentForm || text(target?.name) !== 'commentBody') return;
        // Inline reply composers carry their own parent id — their text must not
        // overwrite the post's top-level comment draft.
        if (commentForm.hasAttribute('data-reply-comment-id')) return;
        const runtime = state();
        const postId = postKey(commentForm.getAttribute('data-post-id'));
        if (!postId) return;
        runtime.ui.commentDraftByPost = runtime.ui.commentDraftByPost || {};
        runtime.ui.commentDraftByPost[postId] = target.value;
    }
    function focusCommentComposeInput(host, postId) {
        const normalizedPostId = postKey(postId);
        if (!host || !normalizedPostId) return null;
        const input = host.querySelector(
            `form[data-form="comment"][data-post-id="${CSS.escape(normalizedPostId)}"] [name="commentBody"], form[data-form="dialog-comment"][data-post-id="${CSS.escape(normalizedPostId)}"] [name="commentBody"]`
        ) || host.querySelector(`#${CSS.escape(controlId('commentBody', normalizedPostId))}`);
        if (input && typeof input.focus === 'function') {
            try {
                input.focus({ preventScroll: false });
                input.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
            } catch (error) {}
        }
        return input;
    }
    const escape = window.escape || (window.KiuSocialChromeModel || {}).escape;
    const makeId = window.makeId || (window.KiuSocialChromeModel || {}).makeId;
    const getSafeSocialExternalUrl = window.getSafeSocialExternalUrl || (window.KiuSocialChromeModel || {}).getSafeSocialExternalUrl;
    const domToken = window.domToken || (window.KiuSocialChromeModel || {}).domToken;
    const uniqueStrings = window.uniqueStrings || (window.KiuSocialChromeModel || {}).uniqueStrings;
    const controlId = window.controlId || (window.KiuSocialChromeModel || {}).controlId;
    const currentFacultyCode = window.currentFacultyCode || (window.KiuSocialChromeModel || {}).currentFacultyCode;
    function shellIdentitySignature() {
        const role = text(currentUser()?.role || localStorage.getItem('currentUserRole') || 'student');
        return `${role}::${currentFacultyCode()}`;
    }
    const when = window.when || (window.KiuSocialChromeModel || {}).when;
    const roleValue = window.roleValue || (window.KiuSocialChromeModel || {}).roleValue;
    const roleLabel = window.roleLabel || (window.KiuSocialChromeModel || {}).roleLabel;
    const facultyLabel = window.facultyLabel || (window.KiuSocialChromeModel || {}).facultyLabel;
    const accountById = window.accountById || (window.KiuSocialChromeModel || {}).accountById;
    const displayName = window.displayName || (window.KiuSocialChromeModel || {}).displayName;
    const accountSubtitle = window.accountSubtitle || (window.KiuSocialChromeModel || {}).accountSubtitle;
    const isAccountOnline = window.isAccountOnline || (window.KiuSocialChromeModel || {}).isAccountOnline;
    const accountPresenceLabel = window.accountPresenceLabel || (window.KiuSocialChromeModel || {}).accountPresenceLabel;
    const presencePill = window.presencePill || (window.KiuSocialChromeModel || {}).presencePill;
    const groupMemberPreviewNames = window.groupMemberPreviewNames || (window.KiuSocialChromeModel || {}).groupMemberPreviewNames;
    const avatarSource = window.avatarSource || (window.KiuSocialChromeModel || {}).avatarSource;
    const avatarFallback = window.avatarFallback || (window.KiuSocialChromeModel || {}).avatarFallback;
    const avatar = window.avatar || (window.KiuSocialChromeModel || {}).avatar;
    const fileUrl = window.fileUrl || (window.KiuSocialChromeModel || {}).fileUrl;
    const isImage = window.isImage || (window.KiuSocialChromeModel || {}).isImage;
    function revokePhotographyUploadPreview(draft = {}) {
        const objectUrl = text(draft?.previewObjectUrl || '');
        if (!objectUrl) return;
        try { URL.revokeObjectURL(objectUrl); } catch (error) {}
    }
    function isPhotographyUploadFileInput(node) {
        if (!node) return false;
        if (node.id === PHOTOGRAPHY_UPLOAD_FILE_SINK_ID) return true;
        return Boolean(node.matches?.('input[name="photographyUploadFile"]'));
    }
    function handlePhotographyUploadFileSinkChange(event) {
        const input = event?.target;
        if (!isPhotographyUploadFileInput(input)) return;
        const file = input.files?.[0] || null;
        if (!file) return;
        event.stopPropagation();
        applyPhotographyUploadFile(file);
        window.setTimeout(() => {
            try { input.value = ''; } catch (error) {}
        }, 0);
    }
    function bindPhotographyUploadDialogFileInput() {
        if (text(activeDialog()?.type || '') !== 'photography-upload') return;
        const input = photographyUploadForm()?.querySelector('input[name="photographyUploadFile"]');
        if (!input || input.dataset.kiuPhotographyUploadBound === '1') return;
        input.dataset.kiuPhotographyUploadBound = '1';
        input.addEventListener('change', (event) => {
            handlePhotographyUploadFileSinkChange(event);
        });
    }
    function openPhotographyUploadFilePicker() {
        const input = ensurePhotographyUploadFileSink();
        if (typeof input.showPicker === 'function') {
            input.showPicker().catch(() => input.click());
            return;
        }
        input.click();
    }

    let photographyUploadSinkChangeBound = false;

    function bindPhotographyUploadFileSinkChange() {
        if (photographyUploadSinkChangeBound) return;
        document.addEventListener('change', handlePhotographyUploadFileSinkChange, { capture: true });
        photographyUploadSinkChangeBound = true;
    }
    function ensurePhotographyUploadFileSink() {
        let input = document.getElementById(PHOTOGRAPHY_UPLOAD_FILE_SINK_ID);
        if (!input) {
            input = document.createElement('input');
            input.id = PHOTOGRAPHY_UPLOAD_FILE_SINK_ID;
            input.type = 'file';
            input.accept = 'image/*';
            input.setAttribute('tabindex', '-1');
            input.setAttribute('aria-hidden', 'true');
            input.style.position = 'fixed';
            input.style.left = '-10000px';
            input.style.width = '1px';
            input.style.height = '1px';
            input.style.opacity = '0';
            input.style.pointerEvents = 'none';
            document.body.appendChild(input);
        }
        bindPhotographyUploadFileSinkChange();
        return input;
    }
    function applyPhotographyUploadFile(file) {
        if (!file) return;
        const runtime = state();
        if (!runtime.ui) runtime.ui = {};
        const draft = runtime.ui.photographyUploadDraft || {};
        if (draft.file === file && text(draft.previewUrl || '')) return;
        if (!isImage(file)) {
            if (typeof setPortalSocialFlash === 'function') setPortalSocialFlash('Choose an image file (JPG, PNG, WEBP).', 'danger');
            return;
        }
        if (file.size > PHOTOGRAPHY_UPLOAD_MAX_BYTES) {
            if (typeof setPortalSocialFlash === 'function') setPortalSocialFlash('Image must be 25MB or smaller.', 'danger');
            return;
        }
        runtime.ui.photographyUploadDraft = runtime.ui.photographyUploadDraft || {};
        revokePhotographyUploadPreview(runtime.ui.photographyUploadDraft);
        runtime.ui.photographyUploadDraft.file = file;
        runtime.ui.photographyUploadDraft.fileName = text(file.name || 'Selected image');
        const previewUrl = URL.createObjectURL(file);
        runtime.ui.photographyUploadDraft.previewObjectUrl = previewUrl;
        runtime.ui.photographyUploadDraft.previewUrl = previewUrl;
        renderPhotographyUploadDialogNow();
    }

    function invokeRenderDialog() {
        const fn = window.__kiuRenderDialog;
        return typeof fn === 'function' ? fn() : '';
    }
    // Render the upload wizard straight into the dialog region, bypassing the
    // debounced renderSocialPageNow pipeline. Background polling renders were
    // racing the debounce timer and swallowing wizard updates (file pick / step
    // changes), so drive this interaction synchronously instead.
    function renderPhotographyUploadDialogNow() {
        if (text(activeDialog()?.type || '') !== 'photography-upload') return;
        if (!socialDialogStylesReady) {
            ensureSocialDialogStyles().then(() => renderPhotographyUploadDialogNow());
            return;
        }
        const region = socialDialogRegion();
        if (!region) return;
        setSocialRegionMarkup(region, invokeRenderDialog());
        bindPhotographyUploadDialogFileInput();
    }
    function renderDialogOnlyNow() {
        if (activeDialog() && !socialDialogStylesReady) {
            ensureSocialDialogStyles().then(() => renderDialogOnlyNow());
            return;
        }
        const host = root();
        if (!host) return;
        const shell = ensureSocialShell(host);
        const runtime = state();
        let stackSynced = trySyncProjectTaskGraphStackDialog(shell.dialog, runtime);
        if (!stackSynced) {
            setSocialRegionMarkup(shell.dialog, invokeRenderDialog());
        }
        const activeKind = text(activeDialog()?.type || '');
        if (shouldRenderProjectTaskGraphStack(runtime, activeKind)
            && !shell.dialog?.querySelector('[data-project-task-graph-anchor="1"]')) {
            delete shell.dialog.__kiuLastMarkup;
            setSocialRegionMarkup(shell.dialog, invokeRenderDialog());
            stackSynced = false;
        }
        bindPhotographyUploadDialogFileInput();
        if (typeof syncProjectTaskGraphStackSlotState === 'function') {
            syncProjectTaskGraphStackSlotState(shell.dialog);
        }
        if (typeof window.enhanceUniversalPickers === 'function') {
            try { window.enhanceUniversalPickers(shell.dialog); } catch (error) {}
        }
        syncOverlayPortalVisibility();
        bindEvents();
        if (!stackSynced && (activeKind === 'project-task-graph' || shouldRenderProjectTaskGraphStack(runtime, activeKind))) {
            bindProjectTaskGraphDrag();
            bindProjectTaskGraphResizeObserver();
        }
        if (stackSynced && activeKind === 'project-task-graph') {
            // Keep stage mounted — only re-sync chrome/selection, not full canvas remount.
            refreshProjectTaskGraphDialog(['selection', 'chrome', 'zoom']);
            bindProjectTaskGraphDrag();
            bindProjectTaskGraphResizeObserver();
        }
    }
    function workspaceDialogKeepsCenter(type = '') {
        return WORKSPACE_DIALOG_KEEP_CENTER.has(text(type || ''));
    }
    function overlayDialogPreservesScroll(type = '') {
        return OVERLAY_DIALOG_PRESERVE_SCROLL.has(text(type || ''));
    }
    function currentUserId() {
        return text(currentUser()?.id);
    }
    function activeChats() {
        const runtime = state();
        const userId = currentUserId();
        return (Array.isArray(runtime.chats) ? runtime.chats : [])
            .filter((chat) => Array.isArray(chat?.members) && chat.members.some((memberId) => text(memberId) === userId))
            .filter((chat) => !(chat?.hiddenByUser && typeof chat.hiddenByUser === 'object' && chat.hiddenByUser[userId]))
            .sort((left, right) => {
                const leftTime = left?.updatedAt || left?.messages?.[left.messages.length - 1]?.sentAt || left?.createdAt || '';
                const rightTime = right?.updatedAt || right?.messages?.[right.messages.length - 1]?.sentAt || right?.createdAt || '';
                return String(rightTime).localeCompare(String(leftTime));
            });
    }
    function activeChat() {
        const runtime = state();
        const chatId = text(runtime.ui?.activeChatId || '');
        return activeChats().find((chat) => text(chat.id) === chatId) || activeChats()[0] || null;
    }
    function activeMessages(chat) {
        return Array.isArray(chat?.messages) ? chat.messages : [];
    }
    function groupForChat(chat) {
        if (!chat) return null;
        const runtime = state();
        const groupId = text(chat.groupId || '');
        const chatId = text(chat.id || '');
        return (Array.isArray(runtime.social?.groups) ? runtime.social.groups : []).find((group) =>
            (groupId && text(group.id) === groupId) || (chatId && text(group.chatId) === chatId)
        ) || null;
    }
    function resolveProjectWorkspaceChat(project) {
        if (!project) return null;
        const chatId = text(project?.chatId || project?.groupChatId || '');
        if (chatId) {
            const byId = activeChats().find((entry) => text(entry.id) === chatId);
            if (byId) return byId;
        }
        const group = (Array.isArray(state().social?.groups) ? state().social.groups : [])
            .find((entry) => text(entry.id) === text(project?.groupId));
        if (group?.chatId) {
            return activeChats().find((entry) => text(entry.id) === text(group.chatId)) || null;
        }
        return null;
    }
    async function ensureProjectWorkspaceChat(project) {
        let chat = resolveProjectWorkspaceChat(project);
        if (chat?.id) return chat;
        if (!project?.groupId || typeof openPortalSocialGroupChat !== 'function') return null;
        chat = await openPortalSocialGroupChat(project.groupId, { skipRoute: true });
        return chat || resolveProjectWorkspaceChat(project);
    }
    const groupAvatarSource = window.groupAvatarSource || (window.KiuSocialChromeModel || {}).groupAvatarSource;
    const groupAvatarFallback = window.groupAvatarFallback || (window.KiuSocialChromeModel || {}).groupAvatarFallback;
    const groupAvatar = window.groupAvatar || (window.KiuSocialChromeModel || {}).groupAvatar;
    const groupBanner = window.groupBanner || (window.KiuSocialChromeModel || {}).groupBanner;
    const pageAvatarSource = window.pageAvatarSource || (window.KiuSocialChromeModel || {}).pageAvatarSource;
    const pageAvatarFallback = window.pageAvatarFallback || (window.KiuSocialChromeModel || {}).pageAvatarFallback;
    const pageAvatar = window.pageAvatar || (window.KiuSocialChromeModel || {}).pageAvatar;
    const pageCover = window.pageCover || (window.KiuSocialChromeModel || {}).pageCover;
    const pageTypeLabel = window.pageTypeLabel || (window.KiuSocialChromeModel || {}).pageTypeLabel;
    const pagePostTypeLabel = window.pagePostTypeLabel || (window.KiuSocialChromeModel || {}).pagePostTypeLabel;
    const extractLinksFromText = window.extractLinksFromText || (window.KiuSocialChromeModel || {}).extractLinksFromText;
    const messageLinks = window.messageLinks || (window.KiuSocialChromeModel || {}).messageLinks;
    function renderLinkedMessageText(value) {
        const raw = text(value);
        if (!raw) return '';
        return raw
            .split(/(https?:\/\/[^\s<>"']+)/gi)
            .map((part) => /^https?:\/\//i.test(part)
                ? `<a href="${escape(text(part).replace(/[),.;!?]+$/g, ''))}" target="_blank" rel="noopener">${escape(text(part).replace(/[),.;!?]+$/g, ''))}</a>`
                : escape(part))
            .join('');
    }
    function hasSocialCommunityModule() {
        return Boolean(
            window.__KIU_SOCIAL_COMMUNITY_MODULE_LOADED
            && typeof window.renderCommunityPanel === 'function'
            && window.renderCommunityPanel !== renderCommunityPanel
            && typeof window.renderRelationshipActions === 'function'
            && window.renderRelationshipActions !== renderRelationshipActions
        );
    }
    function ensureSocialCommunityModule() {
        if (hasSocialCommunityModule()) return Promise.resolve(true);
        if (socialCommunityModulePromise) return socialCommunityModulePromise;
        socialCommunityModulePromise = new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${SOCIAL_COMMUNITY_MODULE_URL}"]`);
            if (existing) {
                existing.addEventListener('load', () => resolve(true), { once: true });
                existing.addEventListener('error', () => reject(new Error('Social community module could not be loaded.')), { once: true });
                return;
            }
            const script = document.createElement('script');
            script.src = SOCIAL_COMMUNITY_MODULE_URL;
            script.defer = true;
            script.addEventListener('load', () => resolve(true), { once: true });
            script.addEventListener('error', () => reject(new Error('Social community module could not be loaded.')), { once: true });
            document.head.appendChild(script);
        }).catch((error) => {
            console.error('Social community module load failed.', error);
            throw error;
        }).finally(() => {
            socialCommunityModulePromise = null;
        });
        return socialCommunityModulePromise;
    }
    function hasSocialAlertsModule() {
        return Boolean(
            window.__KIU_SOCIAL_ALERTS_MODULE_LOADED
            && typeof window.renderAlertsPanel === 'function'
            && window.renderAlertsPanel !== renderAlertsPanel
        );
    }
    function ensureSocialAlertsModule() {
        if (hasSocialAlertsModule()) return Promise.resolve(true);
        if (socialAlertsModulePromise) return socialAlertsModulePromise;
        socialAlertsModulePromise = new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${SOCIAL_ALERTS_MODULE_URL}"]`);
            if (existing) {
                existing.addEventListener('load', () => resolve(true), { once: true });
                existing.addEventListener('error', () => reject(new Error('Social alerts module could not be loaded.')), { once: true });
                return;
            }
            const script = document.createElement('script');
            script.src = SOCIAL_ALERTS_MODULE_URL;
            script.defer = true;
            script.addEventListener('load', () => resolve(true), { once: true });
            script.addEventListener('error', () => reject(new Error('Social alerts module could not be loaded.')), { once: true });
            document.head.appendChild(script);
        }).catch((error) => {
            console.error('Social alerts module load failed.', error);
            throw error;
        }).finally(() => {
            socialAlertsModulePromise = null;
        });
        return socialAlertsModulePromise;
    }
    function hasSocialLostFoundModule() {
        return Boolean(
            window.__KIU_SOCIAL_LOST_FOUND_MODULE_LOADED
            && typeof window.renderLostFoundPanel === 'function'
            && window.renderLostFoundPanel !== renderLostFoundPanel
        );
    }
    function ensureSocialLostFoundModule() {
        if (hasSocialLostFoundModule()) return Promise.resolve(true);
        if (socialLostFoundModulePromise) return socialLostFoundModulePromise;
        socialLostFoundModulePromise = new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${SOCIAL_LOST_FOUND_MODULE_URL}"]`);
            if (existing) {
                existing.addEventListener('load', () => resolve(true), { once: true });
                existing.addEventListener('error', () => reject(new Error('Social lost-found module could not be loaded.')), { once: true });
                return;
            }
            const script = document.createElement('script');
            script.src = SOCIAL_LOST_FOUND_MODULE_URL;
            script.defer = true;
            script.addEventListener('load', () => resolve(true), { once: true });
            script.addEventListener('error', () => reject(new Error('Social lost-found module could not be loaded.')), { once: true });
            document.head.appendChild(script);
        }).catch((error) => {
            console.error('Social lost-found module load failed.', error);
            throw error;
        }).finally(() => {
            socialLostFoundModulePromise = null;
        });
        return socialLostFoundModulePromise;
    }
    function hasSocialPhotographyModule() {
        return Boolean(
            window.__KIU_SOCIAL_PHOTOGRAPHY_MODULE_LOADED
            && typeof window.renderPhotographyPanel === 'function'
            && window.renderPhotographyPanel !== renderPhotographyPanel
        );
    }
    function ensureSocialPhotographyModule() {
        if (hasSocialPhotographyModule()) return Promise.resolve(true);
        if (socialPhotographyModulePromise) return socialPhotographyModulePromise;
        socialPhotographyModulePromise = new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${SOCIAL_PHOTOGRAPHY_MODULE_URL}"]`);
            if (existing) {
                existing.addEventListener('load', () => resolve(true), { once: true });
                existing.addEventListener('error', () => reject(new Error('Social photography module could not be loaded.')), { once: true });
                return;
            }
            const script = document.createElement('script');
            script.src = SOCIAL_PHOTOGRAPHY_MODULE_URL;
            script.defer = true;
            script.addEventListener('load', () => resolve(true), { once: true });
            script.addEventListener('error', () => reject(new Error('Social photography module could not be loaded.')), { once: true });
            document.head.appendChild(script);
        }).catch((error) => {
            console.error('Social photography module load failed.', error);
            throw error;
        }).finally(() => {
            socialPhotographyModulePromise = null;
        });
        return socialPhotographyModulePromise;
    }
    function hasSocialSurveysModule() {
        return Boolean(
            window.__KIU_SOCIAL_SURVEYS_MODULE_LOADED
            && typeof window.renderSurveysPanel === 'function'
            && window.renderSurveysPanel !== renderSurveysPanel
        );
    }
    function ensureSocialSurveysModule() {
        if (hasSocialSurveysModule()) return Promise.resolve(true);
        if (socialSurveysModulePromise) return socialSurveysModulePromise;
        socialSurveysModulePromise = new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${SOCIAL_SURVEYS_MODULE_URL}"]`);
            if (existing) {
                existing.addEventListener('load', () => resolve(true), { once: true });
                existing.addEventListener('error', () => reject(new Error('Social surveys module could not be loaded.')), { once: true });
                return;
            }
            const script = document.createElement('script');
            script.src = SOCIAL_SURVEYS_MODULE_URL;
            script.defer = true;
            script.addEventListener('load', () => resolve(true), { once: true });
            script.addEventListener('error', () => reject(new Error('Social surveys module could not be loaded.')), { once: true });
            document.head.appendChild(script);
        }).catch((error) => {
            console.error('Social surveys module load failed.', error);
            throw error;
        }).finally(() => {
            socialSurveysModulePromise = null;
        });
        return socialSurveysModulePromise;
    }
    function hasSocialResearchModule() {
        return Boolean(
            window.__KIU_SOCIAL_RESEARCH_MODULE_LOADED
            && typeof window.renderResearchPanel === 'function'
            && window.renderResearchPanel !== renderResearchPanel
        );
    }
    function ensureSocialResearchModule() {
        if (hasSocialResearchModule()) return Promise.resolve(true);
        if (socialResearchModulePromise) return socialResearchModulePromise;
        socialResearchModulePromise = Promise.resolve()
            .then(() => {
                if (window.__KIU_SOCIAL_RESEARCH_PDF_RUNTIME_LOADED) return true;
                return new Promise((resolve, reject) => {
                    const existing = document.querySelector(`script[src="${SOCIAL_RESEARCH_PDF_RUNTIME_URL}"]`);
                    if (existing) {
                        if (window.__KIU_SOCIAL_RESEARCH_PDF_RUNTIME_LOADED || existing.dataset.kiuLoaded === '1') {
                            resolve(true);
                            return;
                        }
                        existing.addEventListener('load', () => {
                            existing.dataset.kiuLoaded = '1';
                            resolve(true);
                        }, { once: true });
                        existing.addEventListener('error', () => reject(new Error('Social research PDF runtime could not be loaded.')), { once: true });
                        return;
                    }
                    const script = document.createElement('script');
                    script.src = SOCIAL_RESEARCH_PDF_RUNTIME_URL;
                    script.defer = true;
                    script.addEventListener('load', () => {
                        script.dataset.kiuLoaded = '1';
                        resolve(true);
                    }, { once: true });
                    script.addEventListener('error', () => reject(new Error('Social research PDF runtime could not be loaded.')), { once: true });
                    document.head.appendChild(script);
                });
            })
            .then(() => {
                if (hasSocialResearchModule()) return true;
                return new Promise((resolve, reject) => {
                    const existing = document.querySelector(`script[src="${SOCIAL_RESEARCH_MODULE_URL}"]`);
                    if (existing) {
                        if (hasSocialResearchModule() || existing.dataset.kiuLoaded === '1') {
                            resolve(true);
                            return;
                        }
                        existing.addEventListener('load', () => {
                            existing.dataset.kiuLoaded = '1';
                            resolve(true);
                        }, { once: true });
                        existing.addEventListener('error', () => reject(new Error('Social research module could not be loaded.')), { once: true });
                        return;
                    }
                    const script = document.createElement('script');
                    script.src = SOCIAL_RESEARCH_MODULE_URL;
                    script.defer = true;
                    script.addEventListener('load', () => {
                        script.dataset.kiuLoaded = '1';
                        resolve(true);
                    }, { once: true });
                    script.addEventListener('error', () => reject(new Error('Social research module could not be loaded.')), { once: true });
                    document.head.appendChild(script);
                });
            })
            .catch((error) => {
                console.error('Social research module load failed.', error);
                throw error;
            })
            .finally(() => {
                socialResearchModulePromise = null;
            });
        return socialResearchModulePromise;
    }
    function hasSocialMessagesModule() {
        return Boolean(
            window.__KIU_SOCIAL_MESSAGES_MODULE_LOADED
            && typeof window.renderMessagesPanel === 'function'
            && window.renderMessagesPanel !== renderMessagesPanel
        );
    }
    function ensureSocialMessagesModule() {
        if (hasSocialMessagesModule()) return Promise.resolve(true);
        if (socialMessagesModulePromise) return socialMessagesModulePromise;
        socialMessagesModulePromise = new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${SOCIAL_MESSAGES_MODULE_URL}"]`);
            if (existing) {
                existing.addEventListener('load', () => resolve(true), { once: true });
                existing.addEventListener('error', () => reject(new Error('Social messages module could not be loaded.')), { once: true });
                return;
            }
            const script = document.createElement('script');
            script.src = SOCIAL_MESSAGES_MODULE_URL;
            script.defer = true;
            script.addEventListener('load', () => resolve(true), { once: true });
            script.addEventListener('error', () => reject(new Error('Social messages module could not be loaded.')), { once: true });
            document.head.appendChild(script);
        }).catch((error) => {
            console.error('Social messages module load failed.', error);
            throw error;
        }).finally(() => {
            socialMessagesModulePromise = null;
        });
        return socialMessagesModulePromise;
    }
    function hasSocialProfileModule() {
        return Boolean(
            window.__KIU_SOCIAL_PROFILE_MODULE_LOADED
            && typeof window.renderSocialProfilePanel === 'function'
        );
    }
    function ensureSocialProfileModule() {
        if (hasSocialProfileModule()) return Promise.resolve(true);
        if (socialProfileModulePromise) return socialProfileModulePromise;
        window.__kiuSocialProfileHooks = {
            state,
            text,
            currentUserId,
            profileAccount,
            profileCover,
            profilePostCount,
            profileFriendCount,
            profileFollowingCount,
            profileBio,
            avatar,
            displayName,
            roleLabel,
            facultyLabel,
            profilePosts,
            renderPost,
            profileFriends,
            profileFollowingItems,
            savedPostRecords,
            currentSocialProfileSettings,
            renderPortfolioProfileBlock,
            escape,
            renderFileChip,
            setPanel,
            openDialog,
            renderSocialPageNow,
            withBusy,
            root,
            invalidateSocialRenderCache,
            hydrateMyPortfolioDocument,
            openPortalDirectChat,
            setActiveChat,
            closeDialog,
            updatePortalSocialProfile,
            readFileAsDataUrl
        };
        socialProfileModulePromise = new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${SOCIAL_PROFILE_MODULE_URL}"]`);
            if (existing) {
                existing.addEventListener('load', () => resolve(true), { once: true });
                existing.addEventListener('error', () => reject(new Error('Social profile module could not be loaded.')), { once: true });
                return;
            }
            const script = document.createElement('script');
            script.src = SOCIAL_PROFILE_MODULE_URL;
            script.defer = true;
            script.addEventListener('load', () => resolve(true), { once: true });
            script.addEventListener('error', () => reject(new Error('Social profile module could not be loaded.')), { once: true });
            document.head.appendChild(script);
        }).catch((error) => {
            console.error('Social profile module load failed.', error);
            throw error;
        }).finally(() => {
            socialProfileModulePromise = null;
        });
        return socialProfileModulePromise;
    }
    function waitForDynamicScript(existing) {
        if (!existing) return Promise.resolve();
        if (existing.readyState === 'complete' || existing.readyState === 'loaded') {
            return Promise.resolve();
        }
        return new Promise((resolve) => {
            existing.addEventListener('load', () => resolve(), { once: true });
            existing.addEventListener('error', () => resolve(), { once: true });
        });
    }
    function ensureSocialEventsModule() {
        if (window.__KIU_SOCIAL_EVENTS_MODULE_LOADED
            && typeof window.handleSocialEventsClick === 'function'
            && typeof window.renderEventsPanel === 'function'
            && window.renderEventsPanel !== renderEventsPanel
            && typeof window.renderEventCreateDialog === 'function'
            && window.renderEventCreateDialog !== renderEventCreateDialog) {
            return Promise.resolve();
        }
        // Stale load: flag set / script present but click handler never exported.
        if (typeof window.handleSocialEventsClick !== 'function') {
            window.__KIU_SOCIAL_EVENTS_MODULE_LOADED = false;
            document.querySelectorAll('script[src*="assets/js/pages/social-events.js"]').forEach((node) => node.remove());
        }
        const existing = document.querySelector(`script[src="${SOCIAL_EVENTS_MODULE_URL}"]`);
        if (existing) return waitForDynamicScript(existing);
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = SOCIAL_EVENTS_MODULE_URL;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => resolve();
            document.head.appendChild(script);
        });
    }
    function hasSocialEventsModule() {
        return Boolean(window.__KIU_SOCIAL_EVENTS_MODULE_LOADED
            && typeof window.handleSocialEventsClick === 'function'
            && typeof window.renderEventsPanel === 'function'
            && window.renderEventsPanel !== renderEventsPanel
            && typeof window.renderEventCreateDialog === 'function'
            && window.renderEventCreateDialog !== renderEventCreateDialog);
    }
    function ensureSocialGroupsModule() {
        if (window.__KIU_SOCIAL_GROUPS_MODULE_LOADED
            && typeof window.renderGroupsPanel === 'function'
            && window.renderGroupsPanel !== renderGroupsPanel
            && typeof window.renderGroupsHero === 'function'
            && window.renderGroupsHero !== renderGroupsHero
            && typeof window.renderGroupCreateDialog === 'function'
            && window.renderGroupCreateDialog !== renderGroupCreateDialog) {
            return Promise.resolve();
        }
        const existing = document.querySelector(`script[src="${SOCIAL_GROUPS_MODULE_URL}"]`);
        if (existing) return waitForDynamicScript(existing);
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = SOCIAL_GROUPS_MODULE_URL;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Social groups module could not be loaded.'));
            document.head.appendChild(script);
        });
    }
    function hasSocialGroupsModule() {
        return Boolean(window.__KIU_SOCIAL_GROUPS_MODULE_LOADED
            && typeof window.renderGroupsPanel === 'function'
            && window.renderGroupsPanel !== renderGroupsPanel
            && typeof window.renderGroupsHero === 'function'
            && window.renderGroupsHero !== renderGroupsHero
            && typeof window.renderGroupCreateDialog === 'function'
            && window.renderGroupCreateDialog !== renderGroupCreateDialog);
    }
    function ensureSocialPagesModule() {
        if (window.__KIU_SOCIAL_PAGES_MODULE_LOADED
            && typeof window.renderPagesPanel === 'function'
            && window.renderPagesPanel !== renderPagesPanel
            && typeof window.renderPagesHero === 'function'
            && window.renderPagesHero !== renderPagesHero
            && typeof window.renderPageCreateDialog === 'function'
            && window.renderPageCreateDialog !== renderPageCreateDialog) {
            return Promise.resolve();
        }
        const existing = document.querySelector(`script[src="${SOCIAL_PAGES_MODULE_URL}"]`);
        if (existing) return waitForDynamicScript(existing);
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = SOCIAL_PAGES_MODULE_URL;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => resolve();
            document.head.appendChild(script);
        });
    }
    function hasSocialPagesModule() {
        return Boolean(window.__KIU_SOCIAL_PAGES_MODULE_LOADED
            && typeof window.renderPagesPanel === 'function'
            && window.renderPagesPanel !== renderPagesPanel
            && typeof window.renderPagesHero === 'function'
            && window.renderPagesHero !== renderPagesHero
            && typeof window.renderPageCreateDialog === 'function'
            && window.renderPageCreateDialog !== renderPageCreateDialog);
    }
        function ensureSocialWorkspaceModule() {
        if (hasSocialWorkspaceModule()) {
            return Promise.resolve();
        }
        // Deferred workspace bundle: models → UI peels → panel → coordinator (see engineering-a-plus-frontend-js.md).
        const __wsChain = [
            SOCIAL_WORKSPACE_SCHEDULE_MODEL_URL,
            SOCIAL_WORKSPACE_HEALTH_MODEL_URL,
            SOCIAL_WORKSPACE_GRAPH_DESK_MODEL_URL,
            SOCIAL_WORKSPACE_GRAPH_MODEL_URL,
            SOCIAL_WORKSPACE_PORTFOLIO_MODEL_URL,
            SOCIAL_WORKSPACE_WEEK_PLAN_MODEL_URL,
            SOCIAL_WORKSPACE_GRAPH_SYNC_RUNTIME_URL,
            SOCIAL_WORKSPACE_GRAPH_LAYOUT_RUNTIME_URL,
            SOCIAL_WORKSPACE_SCHEDULE_UI_URL,
            SOCIAL_WORKSPACE_TAB_RUNTIME_URL,
            SOCIAL_WORKSPACE_EVENTS_INPUT_URL,
            SOCIAL_WORKSPACE_EVENTS_SUBMIT_URL,
            SOCIAL_WORKSPACE_EVENTS_URL,
            SOCIAL_WORKSPACE_PANEL_BUDGET_URL,
            SOCIAL_WORKSPACE_PANEL_TEAM_URL,
            SOCIAL_WORKSPACE_PANEL_URL,
            SOCIAL_WORKSPACE_GRAPH_RUNTIME_URL,
            SOCIAL_WORKSPACE_DIALOGS_URL,
            SOCIAL_WORKSPACE_GRAPH_RENDER_URL,
            SOCIAL_WORKSPACE_TASK_UI_URL,
            SOCIAL_WORKSPACE_PORTFOLIO_RUNTIME_URL,
            SOCIAL_WORKSPACE_PORTFOLIO_EDITOR_URL,
            SOCIAL_WORKSPACE_PORTFOLIO_UI_URL,
            SOCIAL_WORKSPACE_PROJECT_CHROME_URL,
            SOCIAL_WORKSPACE_DIALOG_ROUTE_URL,
            SOCIAL_WORKSPACE_MODULE_URL
        ];
        return __wsChain.reduce((chain, url) => chain.then(() => new Promise((resolve) => {
            const existing = document.querySelector(`script[src="${url}"]`);
            if (existing) {
                waitForDynamicScript(existing).then(resolve);
                return;
            }
            const script = document.createElement('script');
            script.src = url;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => resolve();
            document.head.appendChild(script);
        })), Promise.resolve());
    }
        function hasSocialWorkspaceModule() {
        const live = (name, stub) => {
            const impl = resolveSocialExportImpl(name);
            const workspaceImpl = (window.KiuSocialWorkspace || {})[name];
            const resolved = typeof workspaceImpl === 'function' ? workspaceImpl : impl;
            return typeof resolved === 'function' && resolved !== stub;
        };
        return Boolean(window.__KIU_SOCIAL_WORKSPACE_MODULE_LOADED
            && live('renderProjectCreateDialog', renderProjectCreateDialog)
            && live('renderWorkspaceHero', renderWorkspaceHero)
            && live('renderProjectTaskCreateDialog', renderProjectTaskCreateDialog)
            && live('renderPortfolioHero', renderPortfolioHero)
            && live('renderProjectTaskFormFields', renderProjectTaskFormFields)
            && live('renderProjectTaskDetailModal', renderProjectTaskDetailModal)
            && live('renderProjectHealthDialog', renderProjectHealthDialog)
            && live('renderProjectRiskDialog', renderProjectRiskDialog)
            && live('renderProjectsWorkspacePanelClassic', renderProjectsWorkspacePanelClassic)
            && live('renderProjectTaskGraphFullscreen', renderProjectTaskGraphFullscreen)
            && live('renderProjectsPanel', renderProjectsPanel)
            && live('renderWorkspaceOwnedDialog', renderWorkspaceOwnedDialog));
    }
    function resolveSocialExportImpl(name) {
        const direct = window[name];
        if (typeof direct === 'function') return direct;
        const bags = [
            window.KiuSocialWorkspace,
            window.KiuSocialWorkspaceRiskModel,
            window.KiuSocialWorkspaceGraphModel,
            window.KiuSocialWorkspaceGraphDeskModel,
            window.KiuSocialWorkspaceScheduleModel,
            window.KiuSocialWorkspacePortfolioModel,
            window.KiuSocialWorkspaceWeekPlanModel,
            window.KiuSocialWorkspaceHealthModel
        ];
        for (let i = 0; i < bags.length; i += 1) {
            const bag = bags[i];
            if (bag && typeof bag[name] === 'function') return bag[name];
        }
        return undefined;
    }
    function createSocialLazyStub(name, has, ensure, fallback = '', afterLoad = null) {
        function stub(...args) {
            const impl = resolveSocialExportImpl(name);
            if (has() && typeof impl === 'function' && impl !== stub) return impl(...args);
            const pending = ensure();
            if (afterLoad && pending && typeof pending.then === 'function') {
                pending.then(afterLoad).catch(() => null);
            } else if (pending && typeof pending.catch === 'function') {
                pending.catch(() => null);
            }
            return typeof fallback === 'function' ? fallback(...args) : fallback;
        }
        try { Object.defineProperty(stub, 'name', { value: name, configurable: true }); } catch (error) {}
        return stub;
    }

    /** Thin page stub for lazy workspace module exports (identity-stable for hasSocialWorkspaceModule checks). */
    function createSocialWorkspaceStub(name, fallback) {
        function stub(...args) {
            const impl = resolveSocialExportImpl(name);
            if (hasSocialWorkspaceModule() && typeof impl === 'function' && impl !== stub) {
                return impl(...args);
            }
            ensureSocialWorkspaceModule().catch(() => null);
            if (typeof fallback === 'function') return fallback(...args);
            return fallback;
        }
        try {
            Object.defineProperty(stub, 'name', { value: name, configurable: true });
        } catch (error) {}
        return stub;
    }

    // Workspace lazy-export stubs installed from social-workspace-stubs.js (identity-stable bag).
    const __kiuWorkspaceStubBag = (typeof window.installKiuSocialWorkspaceStubs === 'function'
        ? window.installKiuSocialWorkspaceStubs({ createStub: createSocialWorkspaceStub, text })
        : {});
    const {
        readProjectWeekPlansStore, readProjectWeekPlan, writeProjectWeekPlan, addToProjectWeekPlan, addManyToProjectWeekPlan, removeFromProjectWeekPlan,
        normalizeProjectWeekPlanWindow, shouldRenderProjectTaskGraphStack, shouldRenderProjectHealthStack, renderWorkspaceOwnedDialog, isProjectTaskGraphStackActive, getProjectTaskGraphStackAnchorDialog,
        wrapProjectTaskGraphStack, wrapProjectHealthStack, renderHealthStackLayers, maybeWrapStackedProjectDialog, renderStackedProjectTaskChild, trySyncProjectTaskGraphStackDialog, syncProjectTaskGraphStackSlotState,
        projectTaskGraphStackedBackdropClass, resolveProjectTaskGraphNodeFromTarget, sortProjectBoardTasksByPriority, filterProjectBoardTasks, projectTaskDependsOnIds, resolveDeskTaskReadiness,
        orderDeskTasksByDependency, buildDeskTaskForest, buildProjectTaskInspectorFields, syncProjectTaskMatrixPreview, computePertExpected, taskHasPert,
        resolveTaskScheduleEstimate, resolveProjectTaskPriorityDisplay, clampProjectTaskGraphCardHeight, estimateProjectTaskGraphCardHeight, measureProjectTaskGraphCardHeights, normalizeProjectTaskGraphMode,
        projectTaskGraphShowInferred, projectTaskGraphShowCritical, projectTaskGraphShowFlow, projectTaskGraphVisibleEdges, buildProjectTaskGraphModel, layoutProjectTaskGraphByStatus,
        compareProjectTaskGraphNodes, hashProjectTaskGraphSeed, projectTaskGraphPseudoRandom, getProjectTaskGraphMetrics, computeProjectTaskGraphStageSize, isProjectTaskGraphMobileViewport, computeProjectTaskGraphNodeDegree,
        projectTaskGraphBoxRepulse, resolveProjectTaskGraphCardOverlaps, layoutProjectTaskGraphForce, projectTaskGraphLayoutUsesSavedPositions, applyProjectTaskGraphSavedPositions, projectTaskGraphRectsOverlap,
        findFreeProjectTaskGraphPosition, ensureProjectTaskGraphPositionForTask, projectTaskGraphContentBounds, resolveProjectTaskGraphGroupBox, collectProjectTaskGraphGroupBoxes, projectTaskGraphContentViewBox,
        projectTaskGraphPositionsStorageKey, loadProjectTaskGraphPositions, saveProjectTaskGraphPositions, getProjectTaskGraphPositions, setProjectTaskGraphPositions, ensureProjectTaskGraphPositionsLoaded,
        projectTaskGraphViewStorageKey, clampProjectTaskGraphZoom, loadProjectTaskGraphView, saveProjectTaskGraphView, persistProjectTaskGraphView, projectTaskGraphSyncStorageKey,
        seedProjectTaskGraphFromProject, queueProjectTaskGraphSync, projectTaskGraphGroupsStorageKey, getProjectTaskGraphGroups, setProjectTaskGraphGroups, projectTaskGraphCheckpointStorageKey,
        projectTaskGraphCheckpointsStorageKey, formatProjectTaskGraphCheckpointWhen, pulseProjectTaskGraphCheckpointButton, normalizeProjectTaskGraphCheckpointEntry, readProjectTaskGraphCheckpoints, writeProjectTaskGraphCheckpoints,
        readProjectTaskGraphCheckpoint, getProjectTaskGraphCheckpointById, deleteProjectTaskGraphCheckpoint, flushProjectTaskGraphSync, collectProjectTaskGraphCheckpoint, saveProjectTaskGraphCheckpoint,
        applyProjectTaskGraphCheckpointSnapshot, restoreProjectTaskGraphCheckpoint, renderProjectTaskGraphHistoryDialog, renderProjectTaskGraphScheduleHelpDialog, createProjectTaskGraphGroup, updateProjectTaskGraphGroup,
        deleteProjectTaskGraphGroup, scrubDeletedTaskFromProjectTaskGraphGroups, projectTaskGraphGroupMembershipWouldCycle, toggleProjectTaskGraphGroupMember, isProjectTaskGraphGroupId, projectGroupDependsOnIds,
        projectGroupBlocksIds, collectProjectTaskGraphGroupDescendantTaskIds, collectProjectTaskGraphGroupAbsorbedTaskIds, isProjectTaskGraphGroupComplete, isProjectGraphDependencyOpen, computeProjectTaskGraphGroupRollup,
        getProjectTaskGraphGroupLinkSummary, taskDurationHours, taskScheduleRemainingHours, sumProjectOpenWorkHours, sumProjectActualHours, computeProjectSchedule,
        formatProjectScheduleHours, formatProjectScheduleFloat, formatTaskScheduleDisplay, projectScheduleCalendarDate, formatProjectScheduleDate, renderProjectPlanVsBaselineStrip,
        renderProjectProgressHoursStrip, computeProjectTaskGraphContentFitView, buildProjectTaskGraphLayoutForView, applyProjectTaskGraphResetView, projectTaskGraphBoxAnchor, getProjectTaskGraphDocks,
        projectTaskGraphDockAlongSide, scoreProjectTaskGraphDockPair, selectProjectTaskGraphDockPair, buildProjectTaskGraphSeedPolyline, sampleProjectTaskGraphPolyline, projectTaskGraphPushOutOfRect,
        relaxProjectTaskGraphPolyline, normalizeProjectTaskGraphStatusId, projectTaskGraphStatusEdgeColor, projectTaskGraphCubicEdgePath, projectTaskGraphEdgePath, projectTaskGraphEdgeAnchors,
        projectTaskGraphObstacleList, projectTaskGraphEdgeFanMap, formatProjectTaskGraphNodeLabel, computeProjectTaskGraphFitZoom, computeProjectTaskGraphPreviewZoom, renderProjectTaskGraphGroupNode,
        renderProjectTaskGraphCardNode, projectTaskGraphPortRole, resolveProjectTaskGraphWireEndpoints, readProjectTaskGraphPortCenter, resolveProjectTaskGraphLinkPreviewHost, ensureProjectTaskGraphLinkPreview,
        updateProjectTaskGraphLinkPreview, clearProjectTaskGraphLinkPreview, setProjectTaskGraphInteracting, scheduleProjectTaskGraphEdgeRefresh, findProjectTaskGraphLinkDropTarget, findProjectTaskGraphMembershipDropGroup,
        renderProjectTaskGraphEdgeGroupsHtml, renderProjectTaskGraphGroupEdgesHtml, renderProjectTaskGraphGroupDependencyEdgesHtml, readProjectTaskGraphLivePositions, escapeProjectTaskGraphAttr, patchRemoveProjectTaskGraphEdge,
        syncProjectTaskGraphEdgesOnly, renderProjectTaskGraphSvg, renderProjectTaskGraphCanvas, refreshProjectTaskGraphEdgeLines, projectTaskGraphWouldCycle,
        readProjectTaskGraphPan, isProjectTaskGraphScrollPanCanvas, resolveProjectTaskGraphPanSlack, clampProjectTaskGraphPan, readProjectTaskGraphScrollSurface, readProjectTaskGraphLayoutSize,
        projectTaskGraphScrollOffsets, readProjectTaskGraphPanSlackFromCanvas, readProjectTaskGraphPanFromScroll, ensureProjectTaskGraphScrollSurface, applyProjectTaskGraphScrollZoom, centerProjectTaskGraphScrollPan,
        applyProjectTaskGraphCanvasTransform, initProjectTaskGraphScrollPan, resolveProjectTaskGraphPanBackdrop, clientToProjectTaskGraphCoords, getProjectTaskGraphHost, projectTaskGraphMineOnlyActive,
        filterProjectTaskGraphVisibleTasks, resolveProjectTaskGraphScheduleScope, computeProjectTaskGraphMapSchedule, resolveProjectTaskGraphContext, buildProjectTaskGraphLayout, applyProjectTaskGraphZoom,
        syncProjectTaskGraphChrome, syncProjectTaskGraphGroupFocus, collectProjectTaskGraphNeighborIds, syncProjectTaskGraphSelection, buildProjectTaskGraphCanvasMarkup, syncProjectTaskGraphCanvas,
        syncProjectTaskGraphQuickCreate, renderProjectTaskGraphHealth, renderProjectTaskGraphRailOverview, renderProjectTaskGraphScheduleOverview, syncProjectTaskGraphSidebar, refreshProjectTaskGraphDialog,
        selectProjectTaskGraphNode, addProjectTaskDependency, removeProjectTaskDependency, addProjectGraphDependency, patchLocalProjectTaskDepends, removeProjectGraphDependency,
        renderProjectTaskGraphQuickCreatePopover, renderProjectTaskGraphDetailRailPlaceholder, renderProjectTaskGraphDetailRailContent, renderProjectTaskGraphGroupInspector, renderProjectTaskGraphInspector, renderProjectTaskGraphTools,
        detachProjectTaskGraphPanWindowListeners, attachProjectTaskGraphPanWindowListeners, isProjectTaskGraphPanButton, closeProjectTaskGraphContextMenu, openProjectTaskGraphContextMenu, bindProjectTaskGraphInteractions,
        bindProjectTaskGraphDrag, bindProjectTaskGraphResizeObserver, renderTaskDependencyGraphPreview, renderProjectTaskGraphLegend, renderProjectTaskGraphStatusMini, renderProjectTaskGraphFullscreen,
        syncProjectTabPills, projectTabPaneCacheKey, clearProjectTabPaneCache, clearProjectTabPaneCacheKey, isProjectTaskGraphDialogOpen, markProjectTaskGraphPreviewStale,
        deskTasksSurfaceReady, syncDeskToolbarFromFreshMarkup, refreshProjectTasksTabBody, refreshProjectTasksTabPane, rebuildActiveProjectTabPaneIfPreviewHost, notifyProjectTaskGraphSurfaceChanged,
        getOrCreateProjectTabPane, patchProjectWorkspaceTab, revealDeskExpandTarget, buildProjectCreateContext, renderProjectCreateInviteSection, renderProjectTaskCard,
        renderProjectTaskDetailModal, renderProjectColumnTasksModal, renderProjectTaskCreateDialog, renderProjectHealthDialog, renderProjectHealthPlanCardHtml, buildProjectHealthPlanPickModel,
        renderProjectHealthPlanPickBodyHtml, renderProjectHealthPlanPickDialog, renderProjectRiskDialog, renderProjectSettingsDialog, renderProjectCreateDialog, renderPortfolioCreateDialog,
        portfolioStatus, portfolioVisibilityMode, parsePortfolioTextList, parsePortfolioLinksInput, serializePortfolioLinks, portfolioAudienceLabel,
        normalizePortfolioEntry, canViewerAccessPortfolioEntry, portfolioEntriesForViewer, portfolioMatchesRoleFilter, portfolioDraftExists, clonePortfolioDocument,
        portfolioMakeId, getMyPortfolioDocument, ensureMyPortfolioDocument, clearPortfolioApiDeniedFlag, hydrateMyPortfolioDocument, portfolioFieldValue,
        portfolioReadDateRange, portfolioCollectDocumentFromUi, saveMyPortfolioDocument, renderMyPortfolioPanel, renderPortfolioEditorDialog, renderPortfolioCustomBuilderOverlay,
        openPortfolioEditor, resetPortfolioEditor, renderPortfolioProfileBlock
    } = __kiuWorkspaceStubBag;

    function ensureSocialFeedModule() {
        if (window.__KIU_SOCIAL_FEED_MODULE_LOADED
            && typeof window.renderFeedPanel === 'function'
            && window.renderFeedPanel !== renderFeedPanel
            && typeof window.renderPostComposeDialog === 'function'
            && window.renderPostComposeDialog !== renderPostComposeDialog
            && typeof window.renderPost === 'function'
            && window.renderPost !== renderPost
            && typeof window.renderCommentThread === 'function'
            && window.renderCommentThread !== renderCommentThread
            && typeof window.findCommentInThread === 'function'
            && window.findCommentInThread !== findCommentInThread
            && typeof window.patchPostReactions === 'function'
            && window.patchPostReactions !== patchPostReactions) {
            return Promise.resolve();
        }
        const loadScript = (url) => {
            const existing = document.querySelector(`script[src="${url}"]`);
            if (existing) {
                return new Promise((resolve) => {
                    if (existing.dataset.kiuLoaded === '1') return resolve();
                    existing.addEventListener('load', () => resolve(), { once: true });
                    existing.addEventListener('error', () => resolve(), { once: true });
                });
            }
            return new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = url;
                script.defer = true;
                script.onload = () => {
                    script.dataset.kiuLoaded = '1';
                    resolve();
                };
                script.onerror = () => resolve();
                document.head.appendChild(script);
            });
        };
        return loadScript(SOCIAL_FEED_COMMENTS_MODULE_URL).then(() => loadScript(SOCIAL_FEED_MODULE_URL));
    }
    function hasSocialFeedModule() {
        return Boolean(window.__KIU_SOCIAL_FEED_MODULE_LOADED
            && typeof window.renderFeedPanel === 'function'
            && window.renderFeedPanel !== renderFeedPanel
            && typeof window.renderPostComposeDialog === 'function'
            && window.renderPostComposeDialog !== renderPostComposeDialog
            && typeof window.renderPost === 'function'
            && window.renderPost !== renderPost
            && typeof window.renderCommentThread === 'function'
            && window.renderCommentThread !== renderCommentThread
            && typeof window.findCommentInThread === 'function'
            && window.findCommentInThread !== findCommentInThread
            && typeof window.patchPostReactions === 'function'
            && window.patchPostReactions !== patchPostReactions);
    }
    function scheduleDeferredDesktopModulePrefetch() {
        if (socialDesktopModulePrefetchScheduled) return;
        if (window.innerWidth <= 1024) return;
        socialDesktopModulePrefetchScheduled = true;
        const runPrefetch = () => {
            ensureSocialCommunityModule()
                .then(() => ensureSocialMessagesModule())
                .catch(() => null);
        };
        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(() => runPrefetch(), { timeout: 3000 });
            return;
        }
        window.setTimeout(runPrefetch, 1200);
    }
    function scheduleDirectoryPrefetch() {
        if (socialDirectoryPrefetchScheduled) return;
        if (typeof loadPortalSocialDirectory !== 'function') return;
        socialDirectoryPrefetchScheduled = true;
        const runPrefetch = () => {
            Promise.resolve(loadPortalSocialDirectory(false)).catch(() => null);
        };
        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(() => runPrefetch(), { timeout: 1800 });
            return;
        }
        window.setTimeout(runPrefetch, 200);
    }
    function resolveSocialRenderPlan(reason, activePanel, runtime) {
        window.__kiuSocialRenderPlanHooks = {
            text,
            activeDialog,
            WORKSPACE_DIALOG_KEEP_CENTER,
            OVERLAY_DIALOG_PRESERVE_SCROLL
        };
        const impl = window.__kiuResolveSocialRenderPlan;
        if (typeof impl === 'function') return impl(reason, activePanel, runtime);
        return {
            flash: true, topbar: true, command: true, center: true, workspaceNav: true,
            drawer: true, mobileTab: true, toast: true, dialog: true,
            storyViewer: true, storyComposer: true
        };
    }
    const buildNotificationTargetUrl = window.buildNotificationTargetUrl || (window.KiuSocialAlertsModel || {}).buildNotificationTargetUrl;
    const isIncomingCall = window.isIncomingCall || (window.KiuSocialChromeModel || {}).isIncomingCall;
    const isManagedPage = window.isManagedPage || (window.KiuSocialChromeModel || {}).isManagedPage;
    const isJoinedGroup = window.isJoinedGroup || (window.KiuSocialChromeModel || {}).isJoinedGroup;
    const pageOrGroupPublic = window.pageOrGroupPublic || (window.KiuSocialChromeModel || {}).pageOrGroupPublic;
    const postingScopeOptions = window.postingScopeOptions || (window.KiuSocialPanelModel || {}).postingScopeOptions;
    const feedScopeOptions = window.feedScopeOptions || (window.KiuSocialPanelModel || {}).feedScopeOptions;
    const eventScopeOptions = window.eventScopeOptions || (window.KiuSocialPanelModel || {}).eventScopeOptions;
    const relationshipBuckets = window.relationshipBuckets || (window.KiuSocialFormModel || {}).relationshipBuckets;
    const activeNavPanels = window.activeNavPanels || (window.KiuSocialPanelModel || {}).activeNavPanels;

    /**
     * Filters the full feed array for the Home panel based on the active tab.
     * - 'following': posts by connections OR in followed pages/joined groups
     * - 'groups':    only group-scoped posts
     * - 'pages':     only page-scoped posts
     * - 'campus':    posts with campus-wide or unset audience
     * - 'all' / default: returns the full feed unfiltered
     * @param {Array<Object>} feed - The complete feed array from runtime state.
     * @param {string} filterId - One of 'all'|'following'|'groups'|'pages'|'campus'.
     * @returns {Array<Object>} Filtered subset of posts.
     */
    const photographyPosts = (typeof window.getPortalPhotographyPosts === 'function'
        ? window.getPortalPhotographyPosts
        : (window.photographyPosts || (window.KiuSocialPanelModel || {}).photographyPosts));
    const filterFeedForHome = window.filterFeedForHome || (window.KiuSocialPanelModel || {}).filterFeedForHome;
    const classifyNotification = window.classifyNotification || (window.KiuSocialAlertsModel || {}).classifyNotification;
    const ALERTS_CATEGORIES = window.ALERTS_CATEGORIES || (window.KiuSocialAlertsModel || {}).ALERTS_CATEGORIES;
    const classifyNotificationCategory = window.classifyNotificationCategory || (window.KiuSocialAlertsModel || {}).classifyNotificationCategory;
    const getCategoryUnreadCounts = window.getCategoryUnreadCounts || (window.KiuSocialAlertsModel || {}).getCategoryUnreadCounts;
    const filterNotificationsByView = window.filterNotificationsByView || (window.KiuSocialAlertsModel || {}).filterNotificationsByView;
    const lostFoundItems = window.lostFoundItems || (window.KiuSocialFormModel || {}).lostFoundItems;
    const filePreview = window.filePreview || (window.KiuSocialFormModel || {}).filePreview;
    const LOST_FOUND_DEFAULT_LISTING_DAYS = 90;
    const resolveLostFoundStatus = window.resolveLostFoundStatus || (window.KiuSocialFormModel || {}).resolveLostFoundStatus;
    const defaultLostFoundExpiresAt = window.defaultLostFoundExpiresAt || (window.KiuSocialFormModel || {}).defaultLostFoundExpiresAt;
    const resolveLostFoundExpiresAt = window.resolveLostFoundExpiresAt || (window.KiuSocialFormModel || {}).resolveLostFoundExpiresAt;
    const toDateTimeLocalValue = window.toDateTimeLocalValue || (window.KiuSocialFormModel || {}).toDateTimeLocalValue;
    const fromDateTimeLocalValue = window.fromDateTimeLocalValue || (window.KiuSocialFormModel || {}).fromDateTimeLocalValue;
    const isLostFoundItemExpired = window.isLostFoundItemExpired || (window.KiuSocialFormModel || {}).isLostFoundItemExpired;
    const normalizeLostFoundItem = window.normalizeLostFoundItem || (window.KiuSocialFormModel || {}).normalizeLostFoundItem;
    const lostFoundActiveItems = window.lostFoundActiveItems || (window.KiuSocialFormModel || {}).lostFoundActiveItems;
    const lostFoundActiveCount = window.lostFoundActiveCount || (window.KiuSocialFormModel || {}).lostFoundActiveCount;
    const lostFoundRecoveredCount = window.lostFoundRecoveredCount || (window.KiuSocialFormModel || {}).lostFoundRecoveredCount;
    const lostFoundVisibleItems = window.lostFoundVisibleItems || (window.KiuSocialFormModel || {}).lostFoundVisibleItems;
    const surveys = window.surveys || (window.KiuSocialFormModel || {}).surveys;
    const surveyResponses = window.surveyResponses || (window.KiuSocialFormModel || {}).surveyResponses;
    const surveyById = window.surveyById || (window.KiuSocialFormModel || {}).surveyById;
    const hasSurveyResponse = window.hasSurveyResponse || (window.KiuSocialFormModel || {}).hasSurveyResponse;
    const collectSurveyAnswersFromForm = window.collectSurveyAnswersFromForm || (window.KiuSocialFormModel || {}).collectSurveyAnswersFromForm;
    const clearSurveyFlowState = window.clearSurveyFlowState || (window.KiuSocialChromeModel || {}).clearSurveyFlowState;
    const pendingSurveyCount = window.pendingSurveyCount || (window.KiuSocialFormModel || {}).pendingSurveyCount;
    const surveyStatusLabel = window.surveyStatusLabel || (window.KiuSocialFormModel || {}).surveyStatusLabel;
    const surveyAudienceLabel = window.surveyAudienceLabel || (window.KiuSocialFormModel || {}).surveyAudienceLabel;
    const defaultSurveyClosesAt = window.defaultSurveyClosesAt || (window.KiuSocialFormModel || {}).defaultSurveyClosesAt;
    const defaultSurveyDraftQuestions = window.defaultSurveyDraftQuestions || (window.KiuSocialFormModel || {}).defaultSurveyDraftQuestions;
    const surveyAudienceCreateLabel = window.surveyAudienceCreateLabel || (window.KiuSocialFormModel || {}).surveyAudienceCreateLabel;
    const surveyResultsVisibilityLabel = window.surveyResultsVisibilityLabel || (window.KiuSocialFormModel || {}).surveyResultsVisibilityLabel;
    const defaultSurveyDraftSettings = window.defaultSurveyDraftSettings || (window.KiuSocialFormModel || {}).defaultSurveyDraftSettings;
    const ensureSurveyDraftSettings = window.ensureSurveyDraftSettings || (window.KiuSocialFormModel || {}).ensureSurveyDraftSettings;
    const surveyMatchesLane = window.surveyMatchesLane || (window.KiuSocialFormModel || {}).surveyMatchesLane;
    const ensureSurveyDraftQuestions = window.ensureSurveyDraftQuestions || (window.KiuSocialFormModel || {}).ensureSurveyDraftQuestions;
    const ensureSurveyDraftActiveIndex = window.ensureSurveyDraftActiveIndex || (window.KiuSocialFormModel || {}).ensureSurveyDraftActiveIndex;
    const cloneSurveyDraftQuestions = window.cloneSurveyDraftQuestions || (window.KiuSocialFormModel || {}).cloneSurveyDraftQuestions;
    const parseSurveyQuestionBlock = window.parseSurveyQuestionBlock || (window.KiuSocialFormModel || {}).parseSurveyQuestionBlock;
    const surveyQuestionNeedsOptions = window.surveyQuestionNeedsOptions || (window.KiuSocialFormModel || {}).surveyQuestionNeedsOptions;
    const surveyQuestionIsText = window.surveyQuestionIsText || (window.KiuSocialFormModel || {}).surveyQuestionIsText;
    const surveyQuestionDefaultMaxLength = window.surveyQuestionDefaultMaxLength || (window.KiuSocialFormModel || {}).surveyQuestionDefaultMaxLength;
    const surveyQuestionTypeMeta = window.surveyQuestionTypeMeta || (window.KiuSocialFormModel || {}).surveyQuestionTypeMeta;
    const parseSurveyScopeValue = window.parseSurveyScopeValue || (window.KiuSocialFormModel || {}).parseSurveyScopeValue;
    const syncSurveyDraftFromForm = window.syncSurveyDraftFromForm || (window.KiuSocialFormModel || {}).syncSurveyDraftFromForm;
    const parseSurveyQuestionsFromForm = window.parseSurveyQuestionsFromForm || (window.KiuSocialFormModel || {}).parseSurveyQuestionsFromForm;
    const surveysForTab = window.surveysForTab || (window.KiuSocialFormModel || {}).surveysForTab;
    const lostFoundSuggestionItems = window.lostFoundSuggestionItems || (window.KiuSocialFormModel || {}).lostFoundSuggestionItems;


    /* Shell / messages-inbox scroll / workspace-nav / group-leave: social-page-shell-runtime.js */
    const __socialShellDeps = window.__kiuSocialPageShellDeps = {
        text, state, root, escape, activeNavPanels, activeDialog,
        WORKSPACE_NAV_COLLAPSED_KEY, ROOT_ID, DIRECTORY_REFRESH_MS, GROUP_INVITE_SEARCH_MS,
        ensureSocialOverlayPortal,
        shellIdentitySignature, currentUser, currentFacultyCode,
        createSocialLazyStub, hasSocialGroupsModule, ensureSocialGroupsModule
    };
    const __socialShellApi = typeof window.__kiuCreateSocialPageShellApi === 'function'
        ? window.__kiuCreateSocialPageShellApi(__socialShellDeps)
        : {};
    const {
        readWorkspaceNavCollapsed, writeWorkspaceNavCollapsed, isWorkspaceNavCollapsed,
        ensureWorkspaceNavCollapsedState, setWorkspaceNavCollapsed, syncWorkspaceNavCollapsedClass,
        renderShellWorkspaceNavReveal, renderShellWorkspaceNav,
        renderSocialShortcutsTopNav, isSocialShortcutsTopNavViewport,
        updateSocialMeasuredChrome, syncSocialVisualViewport, bindSocialScrollChromeObserver,
        bindSocialLayoutObserver, centerScrollOverflows,
        isSocialMessagesPanel, isSocialAlertsPanel, isSocialInboxPanel,
        isSocialTopbarSkippedPanel, centerCanScroll, getSocialCenterScrollBudget,
        syncSocialScrollLayout, migrateSocialScrollOnLockChange,
        refreshSocialCenterWheelScroll, applySocialCenterWheel,
        ensureSocialCenterScrollBounds, syncEventDescScrollRails,
        scheduleSocialCenterScrollRepair, socialInnerScrollerCanAbsorbWheel,
        bindSocialCenterWheelForward, scheduleDeferredWindowScrollRestore,
        ensureSocialShell, queueDeferredModuleRender, applyShellIdentity, revealShell,
        queueDirectoryRefresh, queueGroupInviteSearchRefresh, queueProjectInviteSearchRefresh,
        queuePageMembersSearchRefresh, queueEventEditorSearchRefresh,
        normalizeGroupLeaveToken, buildGroupLeaveVerification, renderGroupLeaveDialog
    } = __socialShellApi;

    /* Entity/compose + panel/shell: social-page-feed-runtime.js */
    const normalizeComposerEntityLinks = window.normalizeComposerEntityLinks || (window.KiuSocialEntityModel || {}).normalizeComposerEntityLinks;
    const postEntityLinks = window.postEntityLinks || (window.KiuSocialEntityModel || {}).postEntityLinks;
    const resolveEntityLinkMeta = window.resolveEntityLinkMeta || (window.KiuSocialEntityModel || {}).resolveEntityLinkMeta;
    const listAttachableEntities = window.listAttachableEntities || (window.KiuSocialEntityModel || {}).listAttachableEntities;
    const entityLinkIcon = window.entityLinkIcon || (window.KiuSocialEntityModel || {}).entityLinkIcon;
    const __socialFeedDeps = window.__kiuSocialPageFeedDeps = {
        accountSubtitle, activeDialog, activeNavPanels, avatar, buildProjectCreateContext,
        buildProjectHealthPlanPickModel, clearProjectTabPaneCache, clearSurveyFlowState,
        createSocialLazyStub, currentUser, currentUserId, displayName,
        ensureSocialAlertsModule, ensureSocialCommunityModule, ensureSocialFeedModule,
        ensureSocialGroupsModule, ensureSocialLostFoundModule, ensureSocialMessagesModule,
        ensureSocialEventsModule, ensureSocialPagesModule, ensureSocialPhotographyModule, ensureSocialProfileModule,
        ensureSocialSurveysModule, ensureSocialResearchModule, ensureSocialWorkspaceModule, escape, feedScopeOptions,
        hasSocialAlertsModule, hasSocialCommunityModule, hasSocialFeedModule, hasSocialGroupsModule,
        hasSocialEventsModule, hasSocialLostFoundModule, hasSocialMessagesModule, hasSocialPagesModule,
        hasSocialPhotographyModule, hasSocialSurveysModule, hasSocialResearchModule, hasSocialWorkspaceModule,
        normalizeComposerEntityLinks, normalizeProjectTaskStatusId, openDialog, photographyPosts,
        portfolioEntriesForViewer, postEntityLinks, queueDeferredModuleRender,
        openPortfolioViewerForUser: __kiuWorkspaceStubBag.openPortfolioViewerForUser,
        renderProjectHealthPlanCardHtml, renderProjectHealthPlanPickBodyHtml, resolveEntityLinkMeta,
        root, state, text, PANEL_KEY, WORKSPACE_NAV_COLLAPSED_KEY,
        renderSocialPageNow: (reason) => {
            const fn = window.renderSocialPageNow || window.__kiuSocialLiteRenderPage;
            return typeof fn === 'function' ? fn(reason) : undefined;
        },
    };
    const __socialFeedApi = typeof window.__kiuCreateSocialPageFeedApi === 'function'
        ? window.__kiuCreateSocialPageFeedApi(__socialFeedDeps)
        : {};
    const {
        navigateToEntity, entityDetailEntity, entityDetailDescription, renderEntityDetailDialog,
        renderComposerEntityChips, renderPostEntityLinks, clearPostComposeDraft,
        patchPostComposeAttachDialog, renderPostComposeAttachDialog, patchPostComposeDialog,
        renderSocialLuxHero, syncSocialVisualShell, renderFeedPanel, renderEventsPanel,
        renderPost, renderPostComposeDialog, renderRelationshipActions,
        renderPostComposeShareSection, renderPostComposeAttachResultsHtml,
        renderCommunityPanel, renderProjectsWorkspacePanelClassic, renderLostFoundPanel, renderSurveysPanel,
        renderResearchPanel,
        renderPhotographyPanel, renderMessagesPanel, renderCommunityHero,
        renderWorkspaceHero, renderPortfolioHero, renderProjectTaskFormFields,
        buildProjectCreateInviteContext, resolveActiveSocialProject, renderProjectTaskChecklistBlock,
        parseTaskChecklistFromForm, syncTaskChecklistInput, getProjectHealthDialogCard,
        patchProjectHealthPlanCard, taskMatchesPlanPickDueFilter, resolveTaskPackageId,
        patchProjectHealthPlanPick, countProjectRisksForTask, projectRiskScaleRank, buildGroupCreateInviteContext,
        renderGroupCreateInviteSection, findSocialGroupById, renderGroupDetailMemberLine,
        renderGroupDetailDialog, renderGroupsPanel, renderGroupsHero, renderGroupCreateDialog,
        renderEventsHero, renderEventCreateDialog, renderPagesHero, renderPageCreateDialog,
        renderPagesPanel, renderAlertsPanel,
        renderProjectsPanel, renderProfilePageBody, renderShellPrimaryNav, renderMobileTabBar,
        renderShellDrawer, getSocialWorkspaceNavRegion, animateSocialWorkspaceNavOpen,
        closeSocialWorkspaceNavAnimated
    } = __socialFeedApi;
    Object.assign(__socialFeedDeps, { findSocialGroupById, navigateToEntity });

    /* Interactions + renderSocialPageNow: social-page-interactions-runtime.js */
    const __socialInteractionsDeps = window.__kiuSocialPageInteractionsDeps = Object.assign(
        window.__kiuSocialPageInteractionsDeps || {},
        {
            text, state, root, escape, currentUser, currentUserId,
            activeDialog, openDialog, closeDialog, PANEL_KEY, CHAT_KEY,
            createSocialLazyStub, resolveSocialRenderPlan, shellIdentitySignature,
            hasSocialFeedModule, ensureSocialFeedModule,
            hasSocialPhotographyModule, ensureSocialPhotographyModule,
            hasSocialGroupsModule, ensureSocialGroupsModule,
            hasSocialPagesModule, ensureSocialPagesModule,
            hasSocialEventsModule, ensureSocialEventsModule,
            hasSocialMessagesModule, ensureSocialMessagesModule,
            hasSocialProfileModule, ensureSocialProfileModule,
            hasSocialLostFoundModule, ensureSocialLostFoundModule,
            hasSocialSurveysModule, ensureSocialSurveysModule,
            hasSocialResearchModule, ensureSocialResearchModule,
            hasSocialWorkspaceModule, ensureSocialWorkspaceModule,
            scheduleDirectoryPrefetch, scheduleDeferredDesktopModulePrefetch,
            queueDeferredModuleRender, closeSocialWorkspaceNavAnimated,
            renderFeedPanel, renderCommunityPanel, renderGroupsPanel,
            renderProjectsWorkspacePanelClassic, renderProjectsPanel, renderPagesPanel,
            renderEventsPanel, renderSurveysPanel, renderResearchPanel, renderPhotographyPanel, renderLostFoundPanel,
            renderMessagesPanel, renderAlertsPanel, renderProfilePageBody,
            renderShellWorkspaceNavReveal, renderShellWorkspaceNav, renderShellDrawer, renderMobileTabBar,
            renderSocialShortcutsTopNav, isSocialShortcutsTopNavViewport,
            revealShell, syncSocialVisualShell,
            syncSocialScrollLayout, migrateSocialScrollOnLockChange,
            scheduleSocialCenterScrollRepair, syncEventDescScrollRails,
            scheduleDeferredWindowScrollRestore,
            ensureSocialShell, applyShellIdentity, ensureWorkspaceNavCollapsedState,
            syncWorkspaceNavCollapsedClass, isSocialTopbarSkippedPanel,
            renderWorkspaceOwnedDialog, trySyncProjectTaskGraphStackDialog, syncProjectTaskGraphStackSlotState,
            shouldRenderProjectTaskGraphStack, bindProjectTaskGraphDrag,
            bindProjectTaskGraphResizeObserver,
            syncOverlayPortalVisibility, pruneStaleSocialOverlayState, syncSurveyResultsDialog,
            syncSocialOverlayLock, socialDialogRegion,
            ensureMyPortfolioDocument, portfolioCollectDocumentFromUi,
            clearProjectTabPaneCache, projectTabPaneCacheKey,
            bindPhotographyUploadDialogFileInput, focusCommentComposeInput,
            lostFoundItems, normalizeLostFoundItem, surveyById
        }
    );
    const __socialInteractionsApi = typeof window.__kiuCreateSocialPageInteractionsApi === 'function'
        ? window.__kiuCreateSocialPageInteractionsApi(__socialInteractionsDeps)
        : {};
    const {
        reactionEmoji, reactionLabel, renderPostReactionMetrics, commentReactionType,
        renderInlineReplyForm, renderCommentReactionButtons, renderCommentThread, findCommentInThread,
        renderCommentNode, patchCommentReactions, patchPostSaveButtons, patchPhotographyFeedReactions,
        openInlineReply, closeInlineReply, patchCommentDialogCount,
        patchPhotographyFollowButtons, refreshPhotographyPanelStage,
        portfolioEditorFormRoot, capturePortfolioEditorSnapshot, restorePortfolioEditorSnapshot, patchPortfolioSaveStatus,
        patchPortfolioStartedPill, patchPortfolioSectionToggle, patchPortfolioPublishVisibility, patchPortfolioSection,
        syncPortfolioEditorInput, patchEventRsvpButtons, getSocialPageRecord, pageFollowerIdsFor,
        pageAdminIdsFor, buildPageMembersList, shouldPatchPageComposeBlock, patchSocialFlash,
        patchPageFollowState, patchPageComposeBlock, patchPostReactions, patchCommentReactionsByIds,
        deleteCommentInline, readFileAsDataUrl, optimizeEventCoverFile,
        setPanel, finalizeSetPanel, setActiveChat, focusFeed,
        focusRestoreSelector, rememberInteractionAnchor, interactionAnchorNode, socialScrollLockMedia,
        isSocialRouteDesktopScroll, socialScrollLockActive, getSocialCenterScroller, scrollSocialCenterTo,
        scrollSocialCenterElementIntoView, bindFileInputs, renderFileChip, renderSectionCommandCenter,
        renderSocialFlashStatus, renderSocialTopbarRegion, renderActivePanelMarkup, renderToastArea,
        renderStoryViewer, renderStoryComposer, renderSocialPageNow,
    } = __socialInteractionsApi;
    Object.assign(__socialFeedDeps, { setPanel, renderFileChip, renderSocialPageNow });
    window.getSocialCenterScroller = getSocialCenterScroller;
    window.scrollSocialCenterTo = scrollSocialCenterTo;
    window.socialScrollLockActive = socialScrollLockActive;

    // Survey + contiguous helpers: social-page-survey-runtime.js
    const __socialSurvey = typeof window.__kiuCreateSocialPageSurveyApi === 'function'
        ? window.__kiuCreateSocialPageSurveyApi({
            text, state, currentUserId, activeDialog, openDialog,
            syncSurveyDraftFromForm, ensureSurveyDraftQuestions,
            domToken, activeMessages, messageLinks, isImage, accountById, when,
            lostFoundItems, isLostFoundItemExpired, saveLostFoundItems,
            markPortalNotificationRead: typeof markPortalNotificationRead === 'function'
                ? markPortalNotificationRead
                : (typeof window.markPortalNotificationRead === 'function' ? window.markPortalNotificationRead : () => {}),
            socialScrollLockActive, getSocialCenterScroller, isSocialInboxPanel,
            interactionAnchorNode, focusRestoreSelector,
            renderSocialPageNow: (...a) => renderSocialPageNow(...a),
            centerCanScroll, getSocialCenterScrollBudget,
            root, normalizeSocialOverlayDialogRegion,
            SOCIAL_OVERLAY_PORTAL_ID
        })
        : {};
    const {
        messageAnchorId, groupMessageAssets, searchGroupMessages, currentCallParticipants, viewerInCall,
        groupNotificationPreference, setGroupNotificationPreference, notificationItems, resolveNotificationFromTrigger,
        markAlertNotificationAndRefresh, openNotificationTargetInNewTab, removeAlertNotificationAndRefresh,
        removeAlertNotificationsAndRefresh, unreadNotifications, unreadMessages, chatTitle, chatPreview, chatTime,
        currentCall, callForChat, pruneExpiredLostFoundItems,
        isSurveyAnswerProvided, rippleSurveySubmitButton, rippleSurveyChoiceLabel, animateSurveyChoiceInteraction,
        waitForSurveySubmitAnimation, setSurveySubmitButtonLabel, setSurveySubmitButtonIcon, flashSurveySubmitButton,
        rerenderSurveyCreateDialog, patchSurveyCreateQuestionsPanel,
        captureInteractionState, applyCenterScrollRestore, applyWindowScrollRestore, restoreInteractionState,
        clearSocialCenterScrollBounds, measureSocialCenterBottom, getSocialCenterContentExtent,
        getSocialCenterViewportHeight, socialCenterHasLiveScrollRoom, getSocialCenterContentScrollHeight,
        getSocialCenterMaxScroll, setSocialRegionMarkup, invalidateSocialRenderCache, enhanceSocialAccessibility
    } = __socialSurvey;

    Object.assign(__socialShellDeps, {
        getSocialCenterScroller, socialScrollLockActive, isSocialRouteDesktopScroll, scrollSocialCenterTo,
        getSocialCenterContentScrollHeight, getSocialCenterMaxScroll, getSocialCenterViewportHeight,
        socialCenterHasLiveScrollRoom, clearSocialCenterScrollBounds, restoreInteractionState,
        syncSocialVisualShell, renderSocialPageNow: (...a) => renderSocialPageNow(...a),
        invalidateSocialRenderCache
    });

    Object.assign(__socialInteractionsDeps, {
        messageAnchorId, invalidateSocialRenderCache, restoreInteractionState,
        getSocialCenterContentScrollHeight, getSocialCenterMaxScroll, getSocialCenterViewportHeight,
        socialCenterHasLiveScrollRoom, clearSocialCenterScrollBounds,
        captureInteractionState, setSocialRegionMarkup, enhanceSocialAccessibility
    });


    async function saveLostFoundItems(nextItems, reason = 'lost-found-save') {
        const runtime = state();
        if (!runtime.social || typeof runtime.social !== 'object') runtime.social = {};
        const normalizedItems = (Array.isArray(nextItems) ? nextItems.map((item) => normalizeLostFoundItem(item)) : [])
            .filter((item) => !isLostFoundItemExpired(item));
        runtime.social.lostFoundItems = normalizedItems;
        if (typeof persistPortalSocialStatePatch === 'function') {
            const persisted = await persistPortalSocialStatePatch({ lostFoundItems: normalizedItems }, reason);
            if (Array.isArray(persisted?.lostFoundItems)) {
                runtime.social.lostFoundItems = persisted.lostFoundItems.map((item) => normalizeLostFoundItem(item));
            }
        }
        return runtime.social.lostFoundItems;
    }
    const resetLostFoundDraft = window.resetLostFoundDraft || (window.KiuSocialChromeModel || {}).resetLostFoundDraft;
    const clearEventDraft = window.clearEventDraft || (window.KiuSocialChromeModel || {}).clearEventDraft;
    const prefillEventEditDraft = window.prefillEventEditDraft || (window.KiuSocialChromeModel || {}).prefillEventEditDraft;
    const eventCanManage = window.eventCanManage || (window.KiuSocialChromeModel || {}).eventCanManage;
    const renderContextTabs = window.renderContextTabs || (window.KiuSocialChromeModel || {}).renderContextTabs;
    const connectionStatusFor = window.connectionStatusFor || (window.KiuSocialProfileModel || {}).connectionStatusFor;
    const profileAccount = window.profileAccount || (window.KiuSocialProfileModel || {}).profileAccount;
    const profilePosts = window.profilePosts || (window.KiuSocialProfileModel || {}).profilePosts;
    const profileFriends = window.profileFriends || (window.KiuSocialProfileModel || {}).profileFriends;
    const profileFriendCount = window.profileFriendCount || (window.KiuSocialProfileModel || {}).profileFriendCount;
    const profilePostCount = window.profilePostCount || (window.KiuSocialProfileModel || {}).profilePostCount;
    const profileBio = window.profileBio || (window.KiuSocialProfileModel || {}).profileBio;
    const profileCover = window.profileCover || (window.KiuSocialProfileModel || {}).profileCover;
    const profileEditable = window.profileEditable || (window.KiuSocialProfileModel || {}).profileEditable;
    const profileFollowingItems = window.profileFollowingItems || (window.KiuSocialProfileModel || {}).profileFollowingItems;
    const profileFollowingCount = window.profileFollowingCount || (window.KiuSocialProfileModel || {}).profileFollowingCount;
    const mutualConnectionCount = window.mutualConnectionCount || (window.KiuSocialProfileModel || {}).mutualConnectionCount;
    const pageParticipantIds = window.pageParticipantIds || (window.KiuSocialProfileModel || {}).pageParticipantIds;
    const groupParticipantIds = window.groupParticipantIds || (window.KiuSocialProfileModel || {}).groupParticipantIds;
    const sharedGroupsWithUser = window.sharedGroupsWithUser || (window.KiuSocialProfileModel || {}).sharedGroupsWithUser;
    const sharedPagesWithUser = window.sharedPagesWithUser || (window.KiuSocialProfileModel || {}).sharedPagesWithUser;
    const personLatestPost = window.personLatestPost || (window.KiuSocialProfileModel || {}).personLatestPost;
    const personActivityLabel = window.personActivityLabel || (window.KiuSocialProfileModel || {}).personActivityLabel;
    const personProfileCompleteness = window.personProfileCompleteness || (window.KiuSocialProfileModel || {}).personProfileCompleteness;
    const isStaffAccount = window.isStaffAccount || (window.KiuSocialProfileModel || {}).isStaffAccount;
    const canPublishOfficialSurveys = window.canPublishOfficialSurveys || (window.KiuSocialProfileModel || {}).canPublishOfficialSurveys;
    const personRoleBadges = window.personRoleBadges || (window.KiuSocialProfileModel || {}).personRoleBadges;
    const personSuggestionScore = window.personSuggestionScore || (window.KiuSocialProfileModel || {}).personSuggestionScore;
    const personSuggestionReason = window.personSuggestionReason || (window.KiuSocialProfileModel || {}).personSuggestionReason;
    const inviteEligibleGroups = window.inviteEligibleGroups || (window.KiuSocialProfileModel || {}).inviteEligibleGroups;
    const audienceBadge = window.audienceBadge || (window.KiuSocialProfileModel || {}).audienceBadge;

    /**
     * Returns a human-readable context line explaining why a post appears in the feed.
     * Priority: group name → page name → connection status → same faculty → audience badge.
     * @param {Object} post  - The post object (scopeType, scopeName, etc.).
     * @param {Object} author - The resolved author account.
     * @returns {string} A short explanation like "Active in Study Group" or "Same faculty as you".
     */
    const feedReason = window.feedReason || (window.KiuSocialProfileModel || {}).feedReason;

    /**
     * Returns (and lazily initialises) the global social hub state bucket
     * at `window.KIU_STATE.socialHub`. Used for client-side saved-posts storage.
     * @returns {{ savedPosts: Array<Object> }}
     */
    function socialHub() {
        if (hasSocialFeedModule() && typeof window.socialHub === 'function' && window.socialHub !== socialHub) {
            return window.socialHub();
        }
        ensureSocialFeedModule().catch(() => null);
        if (!window.KIU_STATE) window.KIU_STATE = {};
        if (!window.KIU_STATE.socialHub) window.KIU_STATE.socialHub = {};
        if (!Array.isArray(window.KIU_STATE.socialHub.savedPosts)) window.KIU_STATE.socialHub.savedPosts = [];
        return window.KIU_STATE.socialHub;
    }
    function savedItems() {
        if (hasSocialFeedModule() && typeof window.savedItems === 'function' && window.savedItems !== savedItems) {
            return window.savedItems();
        }
        return (Array.isArray(socialHub().savedPosts) ? socialHub().savedPosts : []).filter((item) => text(item?.userId) === currentUserId());
    }
    function savedPostRecords() {
        return Array.isArray(state().social?.savedPosts) ? state().social.savedPosts : [];
    }

    /**
     * Reads the social profile settings for a user from runtime state.
     * Falls back to sensible defaults (public, campus, daily, 24h).
     * @param {string} [userId] - Defaults to the current viewer.
     * @returns {{ visibility: string, defaultAudience: string, digestFrequency: string, eventReminderLeadHours: string }}
     */
    function currentSocialProfileSettings(userId = currentUserId()) {
        const profile = state().social?.profiles?.[text(userId)] || {};
        return {
            visibility: text(profile.visibility || 'public') || 'public',
            defaultAudience: text(profile.defaultAudience || 'campus') || 'campus',
            digestFrequency: text(profile.digestFrequency || 'daily') || 'daily',
            eventReminderLeadHours: text(profile.eventReminderLeadHours || '24') || '24'
        };
    }

    /** Checks whether the current user has bookmarked a post. */
    function isPostSaved(postId) {
        if (hasSocialFeedModule() && typeof window.isPostSaved === 'function' && window.isPostSaved !== isPostSaved) {
            return window.isPostSaved(postId);
        }
        ensureSocialFeedModule().catch(() => null);
        return false;
    }

    /**
     * Toggles the saved/bookmarked state of a post for the current user.
     * Adds or removes the record from `socialHub().savedPosts`, shows a toast,
     * persists state, and triggers a re-render.
     * @param {string} postId
     */
    async function toggleSavedPost(postId) {
        if (hasSocialFeedModule() && typeof window.toggleSavedPost === 'function' && window.toggleSavedPost !== toggleSavedPost) {
            return window.toggleSavedPost(postId);
        }
        await ensureSocialFeedModule().catch(() => null);
        if (typeof window.toggleSavedPost === 'function' && window.toggleSavedPost !== toggleSavedPost) {
            return window.toggleSavedPost(postId);
        }
    }

    /**
     * Maps a reaction type string to its HTML entity emoji.
     * @param {string} reactionType - One of 'like'|'love'|'laugh'|'wow'|'support'.
     * @returns {string} HTML entity (e.g. '&#128077;' for like/thumbs-up).
     */


    /* Wave 18: social-page-boot-runtime.js */
    const __w18Deps = {
        eventBinding: socialEventBinding,
        globalKeydownBound: false,
        scrollLockMediaBound: false,
        socialVisualViewportBound: false,
        renderAttemptCount: 0,
        MAX_RENDER_ATTEMPTS,
        SOCIAL_OVERLAY_PORTAL_ID,
        SOCIAL_OVERLAY_SURFACE_SELECTOR,
        accountSubtitle, activeDialog, activeNavPanels, avatar, buildProjectCreateContext,
        buildProjectHealthPlanPickModel, clearProjectTabPaneCache, clearSurveyFlowState,
        createSocialLazyStub, createSocialWorkspaceStub, currentUser, currentUserId, displayName,
        ensureSocialAlertsModule, ensureSocialCommunityModule, ensureSocialFeedModule,
        ensureSocialEventsModule, ensureSocialGroupsModule, ensureSocialLostFoundModule,
        ensureSocialMessagesModule, ensureSocialPagesModule, ensureSocialPhotographyModule,
        ensureSocialProfileModule, ensureSocialSurveysModule, ensureSocialResearchModule, ensureSocialWorkspaceModule,
        escape, feedScopeOptions, hasSocialAlertsModule, hasSocialCommunityModule, hasSocialFeedModule,
        hasSocialEventsModule, hasSocialGroupsModule, hasSocialLostFoundModule, hasSocialMessagesModule,
        hasSocialPagesModule, hasSocialPhotographyModule, hasSocialProfileModule, hasSocialSurveysModule,
        hasSocialResearchModule, hasSocialWorkspaceModule,
        listAttachableEntities, normalizeComposerEntityLinks, normalizeProjectTaskStatusId, openDialog,
        photographyPosts, portfolioEntriesForViewer, postEntityLinks, queueDeferredModuleRender,
        renderFileChip, renderPostComposeAttachResultsHtml, renderPostComposeShareSection,
        renderProjectHealthPlanCardHtml, renderProjectHealthPlanPickBodyHtml, renderSocialPageNow,
        resolveEntityLinkMeta, root, setPanel, state, text, findSocialGroupById,
        setWorkspaceNavCollapsed, closeSocialWorkspaceNavAnimated, navigateToEntity,
        invalidateSocialRenderCache, pruneExpiredLostFoundItems, refreshPhotographyPanelStage,
        shouldRestoreStackedDialog, restorePreviousDialog, closeDialog,
        socialInteractionContains, syncCommentDraftFromTarget, rippleSurveySubmitButton, rippleSurveyChoiceLabel,
        applyPhotographyUploadFile, ensureSocialOverlayPortal, ensurePhotographyUploadFileSink,
        socialScrollLockMedia, socialScrollLockActive, syncSocialScrollLayout, migrateSocialScrollOnLockChange,
        syncSocialVisualViewport, ensureSocialCenterScrollBounds, bindSocialCenterWheelForward, revealShell,
        applyShellIdentity, ensureSocialRouteHost, guardStandaloneSocialRoute,
        patchPostReactions, patchCommentReactionsByIds, patchEventRsvpButtons,
        bindPhotographyUploadDialogFileInput, openPhotographyUploadFilePicker, bindPhotographyUploadFileSinkChange,
        renderPhotographyUploadDialogNow, renderDialogOnlyNow, workspaceDialogKeepsCenter, overlayDialogPreservesScroll,
        activeChats, activeChat, activeMessages, groupForChat, resolveProjectWorkspaceChat, ensureProjectWorkspaceChat,
        renderLinkedMessageText, scheduleDeferredDesktopModulePrefetch, scheduleDirectoryPrefetch,
        resolveSocialRenderPlan, saveLostFoundItems, socialHub, savedItems, savedPostRecords,
        currentSocialProfileSettings, isPostSaved, toggleSavedPost
    };
    const __w18PeelApi = typeof window.__kiuCreateSocialPageBootApi === 'function'
        ? window.__kiuCreateSocialPageBootApi(__w18Deps) : null;
    if (!__w18PeelApi) {
        console.error('[Social] social-page-boot-runtime.js missing — page shell will not boot');
        return;
    }
    const { withBusy, bindOverlayCaptureClick, bindOverlayCaptureChange, bindOverlayPortalEvents, bindEvents, renderOrRetry, boot } = __w18PeelApi;
    Object.assign(__socialInteractionsDeps, { bindEvents });
    window.__kiuBindOverlayPortalEvents = bindOverlayPortalEvents;

    window.__kiuSocialCommunityHooks = window.__kiuSocialCommunityHooks || {};
        Object.assign(window.__kiuSocialCommunityHooks, {
        state, relationshipBuckets, text, controlId, connectionStatusFor,
        personSuggestionScore, isStaffAccount, currentUserId, accountById, sharedGroupsWithUser,
        sharedPagesWithUser, mutualConnectionCount, currentFacultyCode, avatar, displayName,
        accountSubtitle, personRoleBadges, personProfileCompleteness, personActivityLabel, personSuggestionReason,
        renderRelationshipActions, inviteEligibleGroups, escape, renderCommunityHero, openDialog,
        renderSocialPageNow, withBusy, root, invalidateSocialRenderCache, rememberInteractionAnchor,
        sendPortalSocialConnectionRequest, respondPortalSocialConnectionRequest, removePortalSocialConnection, queueDirectoryRefresh
    });

    window.__kiuSocialPanelHooks = Object.assign(window.__kiuSocialPanelHooks || {}, {
        state,
        text,
        isImage,
        getPortalPhotographyPosts: typeof window.getPortalPhotographyPosts === 'function'
            ? window.getPortalPhotographyPosts
            : photographyPosts,
        relationshipBuckets,
        currentUser,
        currentUserId
    });

    window.__kiuSocialLostFoundHooks = window.__kiuSocialLostFoundHooks || {};
    Object.assign(window.__kiuSocialLostFoundHooks, {
        state, currentUser, text, escape, currentFacultyCode,
        lostFoundVisibleItems, lostFoundItems, normalizeLostFoundItem, lostFoundSuggestionItems, lostFoundActiveCount,
        lostFoundRecoveredCount, accountById, currentUserId, avatar, displayName,
        when, controlId, renderFileChip, setPanel, openDialog,
        renderSocialPageNow, resetLostFoundDraft, openPortalDirectChat, setActiveChat, closeDialog,
        withBusy, readFileAsDataUrl, saveLostFoundItems, makeId
    });

    window.__kiuSocialSurveysHooks = window.__kiuSocialSurveysHooks || {};
    Object.assign(window.__kiuSocialSurveysHooks, {
        state, currentUser, currentUserId, text, escape,
        when, controlId, surveysForTab, surveyById, surveyStatusLabel,
        surveyAudienceLabel, surveyMatchesLane, canPublishOfficialSurveys, ensureSurveyDraftSettings, ensureSurveyDraftQuestions,
        ensureSurveyDraftActiveIndex, surveyQuestionTypeMeta, surveyQuestionNeedsOptions, surveyQuestionDefaultMaxLength, surveyAudienceCreateLabel,
        surveyResultsVisibilityLabel, toDateTimeLocalValue, postingScopeOptions, activeDialog, setPanel,
        openDialog, closeDialog, renderSocialPageNow, withBusy, clearSurveyFlowState,
        defaultSurveyDraftQuestions, defaultSurveyDraftSettings, closePortalSocialSurvey, deletePortalSocialSurvey, loadPortalSocialSurveyResults,
        invalidateSocialRenderCache, patchSurveyCreateQuestionsPanel, syncSurveyDraftFromForm, createPortalSocialSurvey, respondPortalSocialSurvey,
        fromDateTimeLocalValue, restorePreviousDialog, isStaffAccount, parseSurveyQuestionsFromForm, parseSurveyScopeValue,
        collectSurveyAnswersFromForm, isSurveyAnswerProvided, addPortalSocialToast, flashSurveySubmitButton, setSurveySubmitButtonIcon,
        setSurveySubmitButtonLabel, waitForSurveySubmitAnimation
    });

    window.__kiuOpenSocialDialog = openDialog;
    window.__kiuCloseSocialDialog = closeDialog;
    window.__kiuSocialResearchHooks = window.__kiuSocialResearchHooks || {};
    Object.assign(window.__kiuSocialResearchHooks, {
        state, currentUser, currentUserId, text, escape, when, controlId,
        openDialog, closeDialog, setPanel, renderSocialPageNow, withBusy,
        invalidateSocialRenderCache,
        // Use window.* lookups — bare identifiers throw if portal APIs were not exported yet
        // and would abort this Object.assign before openDialog is wired (silent Publish no-op).
        createPortalSocialResearch: window.createPortalSocialResearch,
        togglePortalSocialResearchSave: window.togglePortalSocialResearchSave,
        deletePortalSocialResearch: window.deletePortalSocialResearch,
        fileUrl: typeof fileUrl === 'function' ? fileUrl : window.resolvePortalSocialFileUrl,
        addPortalSocialToast: typeof window.addPortalSocialToast === 'function'
            ? window.addPortalSocialToast
            : () => {}
    });

    window.__kiuSocialChromeHooks = window.__kiuSocialChromeHooks || {};
    Object.assign(window.__kiuSocialChromeHooks, {
        state, text, currentUserId, currentUser
    });

    window.__kiuSocialEventsHooks = window.__kiuSocialEventsHooks || {};
    Object.assign(window.__kiuSocialEventsHooks, {
        state, currentUser, currentUserId, text, escape,
        when, eventCanManage, eventCanManageEditors, controlId, activeDialog, eventScopeOptions,
        setPanel, openDialog, renderSocialPageNow, withBusy, clearEventDraft,
        prefillEventEditDraft, patchEventRsvpButtons, invalidateSocialRenderCache, ensureSocialGroupsModule,
        closeDialog, fromDateTimeLocalValue, readFileAsDataUrl, optimizeEventCoverFile,
        accountById, displayName, avatar, accountSubtitle, facultyLabel, roleLabel,
        queueEventEditorSearchRefresh,
        // Use window.* lookups — bare identifiers throw if portal APIs were not exported yet
        // and would abort this Object.assign (silent RSVP / create-event no-op).
        respondPortalSocialEventRsvp: window.respondPortalSocialEventRsvp,
        createPortalSocialEvent: window.createPortalSocialEvent,
        deletePortalSocialEvent: window.deletePortalSocialEvent,
        updatePortalSocialEvent: window.updatePortalSocialEvent
    });

    window.__kiuSocialGroupsHooks = window.__kiuSocialGroupsHooks || {};
    Object.assign(window.__kiuSocialGroupsHooks, {
        state, text, escape, isJoinedGroup, groupAvatar,
        controlId, currentUserId, displayName, roleLabel, accountById,
        avatar, accountSubtitle, facultyLabel, findSocialGroupById, activeDialog,
        activeChats, groupForChat, groupMessageAssets, groupNotificationPreference, fileUrl,
        isImage, presencePill, when, inviteEligibleGroups, setPanel,
        openDialog, renderSocialPageNow, withBusy, setPortalSocialGroupMembership, respondPortalSocialGroupMembership,
        openPortalSocialGroupChat, setActiveChat, invalidateSocialRenderCache, reportPortalSocialContent, updatePortalSocialGroup,
        removePortalSocialGroupMember, searchGroupMessages, invitePortalSocialGroupMember, joinPortalGroupCall, leavePortalGroupCall,
        closeDialog, createPortalSocialGroup, readFileAsDataUrl, chatTitle
    });

    window.__kiuSocialPagesHooks = window.__kiuSocialPagesHooks || {};
    Object.assign(window.__kiuSocialPagesHooks, {
        state, text, escape, controlId, isManagedPage,
        pageAvatar, pageCover, pageTypeLabel, uniqueStrings, renderFileChip,
        renderPost, getSocialPageRecord, buildPageMembersList, pageAdminIdsFor, pageFollowerIdsFor,
        presencePill, accountById, accountSubtitle, avatar, displayName,
        roleLabel, facultyLabel, currentUserId, setPanel, openDialog, renderSocialPageNow,
        withBusy, patchPageFollowState, shouldPatchPageComposeBlock, patchPageComposeBlock, patchSocialFlash,
        togglePortalSocialFollow, reportPortalSocialContent, invalidateSocialRenderCache, refreshPortalSocialFeed, updatePortalSocialPage,
        closeDialog, createPortalSocialPage, readFileAsDataUrl, submitSocialPost, queuePageMembersSearchRefresh,
        activeDialog
    });

    window.__kiuSocialWorkspaceHooks = window.__kiuSocialWorkspaceHooks || {};
        Object.assign(window.__kiuSocialWorkspaceHooks, {
        text, escape, uniqueStrings, currentFacultyCode, currentUserId,
        displayName, roleLabel, accountById, avatar, accountSubtitle,
        facultyLabel, controlId, toDateTimeLocalValue, resolveActiveSocialProject, fileUrl,
        isImage, when, computeTaskMatrixBucket, computeTaskMatrixScore, countNum,
        formatTaskTime, normalizeTaskScore1to5, normalizeTaskTime, normalizeTaskTimeUnit, formatProjectTaskBudgetEstimate,
        formatTaskCostVariance, formatTaskTimeVariance, normalizeProjectTaskStatusId, projectTaskDownstreamIds, resolveDeskTaskReadiness,
        resolveProjectTaskPriorityDisplay, normalizeProjectPlanHorizon, projectPlanHorizonLabel, resolveTaskPackageId, state,
        clearProjectTabPaneCache, ensureSocialMessagesModule, ensureProjectWorkspaceChat, filterProjectBoardTasks, hasSocialMessagesModule,
        isAccountOnline, isStaffAccount, queueDeferredModuleRender, readDeskSavedViews, renderProjectWorkspaceNavButtons,
        renderSocialPageNow, resolveProjectWorkspaceChat, setActiveChat, taskActivityMs, activeDialog,
        buildProjectTaskInspectorFields, currentUser, getSafeSocialExternalUrl, buildProjectTaskFlowEdges, clearProjectTabPaneCacheKey,
        openDialog, openProjectRiskForTask, rebuildActiveProjectTabPaneIfPreviewHost, refreshProjectTasksTabBody, refreshProjectTasksTabPane,
        renderDialogOnlyNow, withBusy, migrateProjectPlanEntry, patchPortfolioSaveStatus, portfolioEditorFormRoot,
        closeDialog, restorePreviousDialog, invalidateSocialRenderCache, setPanel, root,
        buildSocialRenderSignature, patchProjectWorkspaceTab, patchProjectHealthPlanCard, patchProjectHealthPlanPick, revealDeskExpandTarget,
        writeDeskSavedViews, assertUniqueProjectTaskTitle, createPortalSocialProject, createPortalSocialProjectBudgetCategory, createPortalSocialProjectBudgetExpense,
        createPortalSocialProjectRisk, createPortalSocialProjectTask, deletePortalSocialProjectTask, ensureProjectTaskGraphPositionForTask, focusSocialDialog,
        fromDateTimeLocalValue, getProjectTaskGraphPositions, markProjectTaskGraphPreviewStale, notifyProjectTaskGraphSurfaceChanged, parseDependsOnFromForm,
        parsePortfolioLinksInput, parseProjectTaskActualsPayload, parseProjectTaskBudgetEstimate, parseProjectTaskPriorityPayload, projectRiskScaleRank,
        refreshProjectTaskGraphDialog, resetPortfolioEditor, scrubDeletedTaskFromProjectTaskGraphGroups, setPortalSocialFlash, setPortalSocialProjectMembership,
        setProjectTaskGraphPositions, syncSocialOverlayLock, toggleProjectTaskGraphGroupMember, updatePortalSocialProject, updatePortalSocialProjectRisk,
        updatePortalSocialProjectTask, queueProjectInviteSearchRefresh, syncPortfolioEditorInput, syncProjectTaskMatrixPreview, syncTaskChecklistInput,
    });

    window.__kiuSocialFeedHooks = window.__kiuSocialFeedHooks || {};
    Object.assign(window.__kiuSocialFeedHooks, {
        state, currentUser, currentUserId, text, escape,
        avatar, displayName, renderPost, reactionEmoji, reactionLabel,
        isPostSaved, pagePostTypeLabel, feedReason, renderPostEntityLinks, relationshipBuckets,
        isJoinedGroup, feedScopeOptions, filterFeedForHome, controlId, activeDialog,
        renderFileChip, postingScopeOptions, currentSocialProfileSettings, normalizeComposerEntityLinks, resolveEntityLinkMeta,
        listAttachableEntities, entityLinkIcon, postKey, findCommentInThread, accountById,
        accountSubtitle, when, filePreview, renderPostReactionMetrics, renderCommentThread,
        setPanel, openDialog, closeDialog, renderSocialPageNow, withBusy,
        root, focusFeed, clearPostComposeDraft, submitSocialPost, closeInlineReply,
        openInlineReply, deleteCommentInline, isCommentDialog, patchPostComposeAttachDialog, patchPostComposeDialog,
        patchPostReactions, patchCommentReactions, patchPostSaveButtons, patchPhotographyFeedReactions, scrollSocialCenterElementIntoView,
        refreshPortalSocialFeed, reactToPortalSocialPost, reactToPortalSocialComment, pinPortalSocialPost, toggleSavedPost,
        openPortalStoryComposer, closePortalStoryComposer, openPortalStoryViewer, closePortalStoryViewer, nextPortalStory,
        prevPortalStory, getPortalSocialStoryItems, commentOnPortalSocialPost, deletePortalSocialPost, invalidateSocialRenderCache,
        patchCommentDialogCount, readFileAsDataUrl, removePortalSocialComment, renderCommentNode, reportPortalSocialContent,
        reportSocialPost, restorePreviousDialog, setPortalSocialFlash, sharePortalSocialPost, submitPortalStory,
        syncCommentDraftFromTarget, updatePortalSocialPost
    });

    window.__kiuSocialPhotographyHooks = window.__kiuSocialPhotographyHooks || {};
    Object.assign(window.__kiuSocialPhotographyHooks, {
        state, currentUser, currentUserId, text, escape,
        when, avatar, displayName, accountById, accountSubtitle,
        currentFacultyCode, photographyPosts, relationshipBuckets, fileUrl, isImage,
        renderCommentNode, renderCommentThread, renderPostReactionMetrics, reactionEmoji, reactionLabel,
        postKey, isPostSaved, controlId, setPanel, openDialog,
        closeDialog, renderSocialPageNow, withBusy, activeDialog, root, openPhotographyUploadFilePicker,
        patchPhotographyFollowButtons, photographyUploadForm, reactToPortalSocialPost, refreshPhotographyPanelStage, renderPhotographyUploadDialogNow,
        revokePhotographyUploadPreview, togglePortalSocialFollow, patchSocialFlash, invalidateSocialRenderCache,
        deletePortalSocialPost: typeof window.deletePortalSocialPost === 'function' ? window.deletePortalSocialPost : null,
        updatePortalSocialPost: typeof window.updatePortalSocialPost === 'function' ? window.updatePortalSocialPost : null,
        submitSocialPost: typeof window.submitSocialPost === 'function' ? window.submitSocialPost : submitSocialPost,
        applyPhotographyUploadFile
    });
    window.applyPhotographyUploadFile = applyPhotographyUploadFile;

    window.__kiuSocialAlertsHooks = window.__kiuSocialAlertsHooks || {};
    Object.assign(window.__kiuSocialAlertsHooks, {
        currentUser, notificationItems, state, text, filterNotificationsByView,
        classifyNotification, classifyNotificationCategory, getCategoryUnreadCounts, ALERTS_CATEGORIES, unreadNotifications,
        escape, when, roleValue, accountById, displayName,
        renderSocialPageNow, withBusy, invalidateSocialRenderCache, resolvePortalSocialReport, markPortalNotificationRead,
        markAlertNotificationAndRefresh, removeAlertNotificationAndRefresh, removeAlertNotificationsAndRefresh, resolveNotificationFromTrigger, buildNotificationTargetUrl,
        openNotificationTargetInNewTab
    });

    window.__kiuSocialMessagesHooks = window.__kiuSocialMessagesHooks || {};
    Object.assign(window.__kiuSocialMessagesHooks, {
        state, activeChats, activeMessages, text, unreadMessages,
        currentCall, callForChat, controlId, groupForChat, groupMessageAssets,
        searchGroupMessages, currentCallParticipants, viewerInCall, currentUser, currentUserId,
        accountById, accountPresenceLabel, accountSubtitle, displayName, avatar,
        when, presencePill, messageLinks, messageAnchorId, filePreview,
        renderLinkedMessageText, groupAvatar, groupBanner, groupMemberPreviewNames, groupNotificationPreference,
        chatTitle, chatPreview, chatTime, renderFileChip, facultyLabel,
        roleLabel, isIncomingCall, escape, unreadNotifications, setPanel,
        openDialog, renderSocialPageNow, withBusy, root, setActiveChat,
        hidePortalMessengerChat, openPortalDirectChat, startPortalCall, acceptPortalCall, declinePortalCall,
        endPortalCall, togglePortalCallMic, togglePortalCallCamera, closeDialog, sendPortalMessage,
        deletePortalChatMessage, invalidateSocialRenderCache, activeChat, leavePortalGroupCall
    });

    window.__kiuSocialDocsHooks = window.__kiuSocialDocsHooks || {};
    Object.assign(window.__kiuSocialDocsHooks, {
        state, currentUser, currentUserId, text, escape,
        accountById, displayName, avatar, accountSubtitle, facultyLabel,
        roleLabel, when, openDialog, closeDialog, addPortalSocialToast,
        setPortalSocialFlash, renderSocialPageNow
    });




    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { boot().catch(() => null); }, { once: true });
    } else {
        boot().catch(() => null);
    }

})();
