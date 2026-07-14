/* Rebuilt social workspace page.
 * Keeps rendering thin and delegates state/network work to social-runtime-lite.js.
 */

(function initRebuiltSocialPage() {
    if (window.__KIU_SOCIAL_PAGE_REBUILT) return;
    window.__KIU_SOCIAL_PAGE_REBUILT = true;

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

    function normalizeProjectPlanHorizon(value) {
        const raw = text(value || '').toLowerCase();
        // Legacy week / 2weeks → weeks
        if (raw === 'week' || raw === '2weeks' || raw === '2week') return 'weeks';
        if (PROJECT_PLAN_HORIZON_IDS.has(raw)) return raw;
        return 'weeks';
    }

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

    function migrateProjectPlanEntry(raw) {
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
            return { days: [], weeks: [], months: [], all: [] };
        }
        const cleanList = (list) => uniqueStrings((Array.isArray(list) ? list : []).map((id) => text(id)).filter(Boolean)).slice(0, PROJECT_WEEK_PLAN_MAX);
        const weeks = cleanList([
            ...(Array.isArray(raw.weeks) ? raw.weeks : []),
            ...(Array.isArray(raw.week) ? raw.week : []),
            ...(Array.isArray(raw['2weeks']) ? raw['2weeks'] : [])
        ]);
        return {
            days: cleanList(raw.days),
            weeks,
            months: cleanList(raw.months),
            all: cleanList(raw.all)
        };
    }








    function taskActivityMs(task) {
        const candidates = [
            Date.parse(text(task?.updatedAt || '')),
            Date.parse(text(task?.createdAt || '')),
            Date.parse(text(task?.dueAt || '')),
            Date.parse(text(task?.startAt || ''))
        ].filter((ms) => Number.isFinite(ms));
        return candidates.length ? Math.max(...candidates) : 0;
    }

    const SOCIAL_COMMUNITY_MODULE_URL = 'assets/js/pages/social-community.js?v=20260714-community-click1';
    const SOCIAL_ALERTS_MODULE_URL = 'assets/js/pages/social-alerts.js?v=20260714-alerts-click1';
    const SOCIAL_LOST_FOUND_MODULE_URL = 'assets/js/pages/social-lost-found.js?v=20260714-lf-click1';
    const SOCIAL_PHOTOGRAPHY_MODULE_URL = 'assets/js/pages/social-photography.js?v=20260714-photo-click1';
    const SOCIAL_SURVEYS_MODULE_URL = 'assets/js/pages/social-surveys.js?v=20260714-surveys-click1';
    const PHOTOGRAPHY_UPLOAD_FILE_SINK_ID = 'kiu-photography-upload-file-sink';
    const PHOTOGRAPHY_UPLOAD_MAX_BYTES = 25 * 1024 * 1024;
    const SOCIAL_MESSAGES_MODULE_URL = 'assets/js/pages/social-messages.js?v=20260714-messages-click1';
    const SOCIAL_PROFILE_MODULE_URL = 'assets/js/pages/social-profile.js?v=20260714-profile-click1';
    const SOCIAL_EVENTS_MODULE_URL = 'assets/js/pages/social-events.js?v=20260714-events-click1';
    const SOCIAL_GROUPS_MODULE_URL = 'assets/js/pages/social-groups.js?v=20260714-groups-click1';
    const SOCIAL_FEED_MODULE_URL = 'assets/js/pages/social-feed.js?v=20260714-feed-click1';
    const SOCIAL_PAGES_MODULE_URL = 'assets/js/pages/social-pages.js?v=20260714-pages-click1';
    const SOCIAL_WORKSPACE_MODULE_URL = 'assets/js/pages/social-workspace.js?v=20260714-extract6';
    const DIRECTORY_REFRESH_MS = 180;
    const MAX_RENDER_ATTEMPTS = 24;
    const USER_ROLES_FALLBACK = {
        STUDENT: 'student',
        PROFESSOR: 'professor',
        TA: 'ta',
        ADMIN: 'admin',
        STUDENT_SERVICE: 'student_service'
    };
    const PROJECT_TASK_COLUMNS = [
        { id: 'todo', label: 'To Do', tone: 'blue', icon: 'fa-list-check' },
        { id: 'in-progress', label: 'In Progress', tone: 'orange', icon: 'fa-bolt' },
        { id: 'blocked', label: 'Blocked', tone: 'rose', icon: 'fa-ban' },
        { id: 'done', label: 'Done', tone: 'emerald', icon: 'fa-circle-check' }
    ];

    const PROJECT_TASK_PRIORITY_RANK = { urgent: 0, high: 1, medium: 2, low: 3 };
    const PROJECT_TASK_STATUS_RANK = Object.fromEntries(PROJECT_TASK_COLUMNS.map((column, index) => [column.id, index]));
    // Wire paint matches status chips / card stripes (lifecycle color language)
    const PROJECT_TASK_STATUS_EDGE_COLOR = {
        todo: '#3b82f6',
        'in-progress': '#f59e0b',
        blocked: '#f43f5e',
        done: '#10b981'
    };
    const PROJECT_TASK_GRAPH_IMMERSIVE_CHROME_H = 112;
    const PROJECT_TASK_GRAPH_PAN_SLACK = 2400;
    const PROJECT_TASK_GRAPH_MIN_ZOOM = 0.12;
    const PROJECT_TASK_GRAPH_MAX_ZOOM = 1.6;
    const PROJECT_TASK_GRAPH_CARD_MIN_W = 220;
    const PROJECT_TASK_GRAPH_CARD_MAX_W = 280;
    const PROJECT_TASK_GRAPH_CARD_W = 256;
    const PROJECT_TASK_GRAPH_CARD_MIN_H = 168;
    const PROJECT_TASK_GRAPH_CARD_MAX_H = 280;
    const PROJECT_TASK_GRAPH_CARD_H = 188;
    const PROJECT_TASK_GRAPH_CARD_COMPACT_W = 200;
    const PROJECT_TASK_GRAPH_CARD_COMPACT_MIN_H = 88;
    const PROJECT_TASK_GRAPH_CARD_COMPACT_MAX_H = 180;
    const PROJECT_TASK_GRAPH_CARD_COMPACT_H = 100;
    // foreignObject bleed so wire handles are not clipped by FO bounds
    const PROJECT_TASK_GRAPH_FO_PAD = 20;
    const PROJECT_TASK_GRAPH_STACKED_DIALOGS = new Set([
        'project-task-detail',
        'project-task-edit',
        'project-task-create',
        'project-task-delete',
        'project-health',
        'project-risk',
        'project-task-graph-history',
        'project-task-graph-schedule-help'
    ]);
    /** Dialogs that open on top of Project Health (Health stays underneath). */
    const PROJECT_HEALTH_OVERLAY_DIALOGS = new Set([
        'project-task-detail',
        'project-task-edit',
        'project-task-create',
        'project-task-delete',
        'project-settings',
        'project-risk',
        'project-health-plan-pick'
    ]);
    const PROJECT_TASK_GRAPH_CHECKPOINT_MAX = 12;




    function shouldRestoreStackedDialog(type = '') {
        const kind = text(type);
        if (STACKED_DIALOG_KINDS.has(kind)) return true;
        if (PROJECT_HEALTH_OVERLAY_DIALOGS.has(kind)
            && state().ui?.previousDialog?.type === 'project-health') {
            return true;
        }
        return false;
    }















    function renderProjectWorkspaceNavButtons(project, options = {}) {
        const projectId = escape(text(project?.id || ''));
        const riskCount = Number(project?.riskCount) || 0;
        const riskPill = riskCount > 0 ? ` <span class="social-neo-pill">${escape(String(riskCount))}</span>` : '';
        const btnClass = text(options.buttonClass || 'social-neo-btn social-neo-btn-ghost');
        return `
            <button class="${btnClass}" type="button" data-action="project-health-open" data-project-id="${projectId}"><i class="fas fa-heart-pulse"></i> Health</button>
            <button class="${btnClass}" type="button" data-action="project-risk-open" data-project-id="${projectId}"><i class="fas fa-triangle-exclamation"></i> Risks${riskPill}</button>
        `.trim();
    }


    function projectTaskDownstreamIds(taskId, tasks = []) {
        const id = text(taskId);
        if (!id) return [];
        return (Array.isArray(tasks) ? tasks : [])
            .filter((task) => projectTaskDependsOnIds(task).includes(id))
            .map((task) => text(task?.id))
            .filter(Boolean);
    }


    function normalizeProjectTaskStatusId(status) {
        const value = text(status || 'todo') || 'todo';
        return value === 'backlog' ? 'todo' : value;
    }

    /** Desk readiness from dependsOn (graph parents) — pure read. */


    /**
     * Order package/ungrouped tasks parent-first (DFS preorder).
     * Parent = dependency predecessor in dependsOnTaskIds when both ends are in `tasks`.
     * Children sit directly under their primary in-list parent (not flat by depth).
     * Multi-parent: first in-list dep after sibling sort is primary; others only affect readiness UI.
     */


    function countDeskForestNodes(forest) {
        let n = 0;
        const walk = (nodes) => {
            (nodes || []).forEach((node) => {
                n += 1;
                walk(node.children);
            });
        };
        walk(forest);
        return n;
    }




    function formatProjectTaskBudgetEstimate(amount, currency = 'USD') {
        const value = Number(amount);
        if (!Number.isFinite(value) || value <= 0) return '';
        const rounded = Math.round(value * 100) / 100;
        const code = text(currency || 'USD').toUpperCase() || 'USD';
        return `${rounded.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${code}`;
    }

    function parseProjectTaskBudgetEstimate(value) {
        const raw = text(value).replace(/,/g, '');
        if (!raw) return 0;
        const num = Number(raw);
        if (!Number.isFinite(num) || num < 0) return 0;
        return Math.round(num * 100) / 100;
    }

    function parseProjectTaskPriorityPayload(form, runtime = {}) {
        const impactScore = normalizeTaskScore1to5(
            form?.projectTaskImpactScore?.value || runtime?.ui?.projectTaskImpactScore
        );
        const effortScore = normalizeTaskScore1to5(
            form?.projectTaskEffortScore?.value || runtime?.ui?.projectTaskEffortScore
        );
        const timeOptimistic = normalizeTaskTime(form?.projectTaskTimeOptimistic?.value ?? runtime?.ui?.projectTaskTimeOptimistic);
        const timeMostLikely = normalizeTaskTime(form?.projectTaskTimeMostLikely?.value ?? runtime?.ui?.projectTaskTimeMostLikely);
        const timePessimistic = normalizeTaskTime(form?.projectTaskTimePessimistic?.value ?? runtime?.ui?.projectTaskTimePessimistic);
        const timeUnit = normalizeTaskTimeUnit(form?.projectTaskTimeUnit?.value ?? runtime?.ui?.projectTaskTimeUnit);
        const pertExpected = computePertExpected(timeOptimistic, timeMostLikely, timePessimistic);
        const timeEstimate = pertExpected > 0
            ? pertExpected
            : (timeMostLikely || normalizeTaskTime(form?.projectTaskTimeEstimate?.value ?? runtime?.ui?.projectTaskTimeEstimate));
        const priority = computeTaskMatrixBucket(computeTaskMatrixScore(impactScore, effortScore));
        return { priorityModel: 'matrix', impactScore, effortScore, timeOptimistic, timeMostLikely, timePessimistic, timeEstimate, timeUnit, priority };
    }

    function parseProjectTaskActualsPayload(form, runtime = {}) {
        return {
            actualTime: normalizeTaskTime(form?.projectTaskActualTime?.value ?? runtime?.ui?.projectTaskActualTime),
            actualCost: Math.max(0, Math.round((Number(form?.projectTaskActualCost?.value ?? runtime?.ui?.projectTaskActualCost) || 0) * 100) / 100)
        };
    }



    function normalizeTaskScore1to5(value, fallback = 3) {
        const n = Math.round(Number(value));
        if (!Number.isFinite(n)) return fallback;
        return Math.max(1, Math.min(5, n));
    }

    function normalizeTaskPriorityModel(value) {
        const v = text(value).toLowerCase();
        return v === 'matrix' ? v : 'manual';
    }

    function computeTaskMatrixScore(impact, effort) {
        const i = normalizeTaskScore1to5(impact);
        const e = normalizeTaskScore1to5(effort);
        return i * (6 - e);
    }

    function computeTaskMatrixBucket(score) {
        const s = Number(score) || 0;
        if (s >= 20) return 'urgent';
        if (s >= 15) return 'high';
        if (s >= 8) return 'medium';
        return 'low';
    }

    // Cost can be money and/or time. Time is a number + unit ('h' hours / 'd' days).
    function normalizeTaskTimeUnit(value) {
        return text(value).toLowerCase() === 'd' ? 'd' : 'h';
    }

    function normalizeTaskTime(value) {
        const n = Number(value);
        return Number.isFinite(n) && n > 0 ? Math.round(n * 10) / 10 : 0;
    }




    function formatTaskTime(value, unit) {
        const n = normalizeTaskTime(value);
        if (n <= 0) return '';
        return `${Number.isInteger(n) ? n : n.toFixed(1)}${normalizeTaskTimeUnit(unit)}`;
    }

    function formatTaskTimeVariance(estimate, actual, unit = 'h', vsPert = false) {
        const est = normalizeTaskTime(estimate);
        const act = normalizeTaskTime(actual);
        if (est <= 0 && act <= 0) return null;
        const delta = Math.round((act - est) * 10) / 10;
        const tone = delta > 0 ? 'rose' : delta < 0 ? 'emerald' : 'slate';
        const estLabel = vsPert ? 'PERT' : 'est';
        const deltaSuffix = vsPert ? ' vs PERT' : '';
        const deltaLabel = delta === 0 ? 'on plan' : `${delta > 0 ? '+' : ''}${formatTaskTime(Math.abs(delta), unit)}${deltaSuffix}`;
        return {
            label: `${formatTaskTime(est, unit) || '0h'} ${estLabel} · ${formatTaskTime(act, unit) || '0h'} act · ${deltaLabel}`,
            tone,
            compact: delta === 0 ? 'on plan' : `${delta > 0 ? '+' : ''}${formatTaskTime(Math.abs(delta), unit)}${deltaSuffix}`
        };
    }

    function formatTaskCostVariance(estimate, actual, currency = 'USD') {
        const est = Math.max(0, Math.round((Number(estimate) || 0) * 100) / 100);
        const act = Math.max(0, Math.round((Number(actual) || 0) * 100) / 100);
        if (est <= 0 && act <= 0) return null;
        const delta = Math.round((act - est) * 100) / 100;
        const tone = delta > 0 ? 'rose' : delta < 0 ? 'emerald' : 'slate';
        const fmt = (n) => formatProjectTaskBudgetEstimate(n, currency) || `${n} ${currency}`;
        const deltaLabel = delta === 0 ? 'on plan' : `${delta > 0 ? '+' : '-'}${fmt(Math.abs(delta))}`;
        return {
            label: `${fmt(est)} est · ${fmt(act)} act · ${deltaLabel}`,
            tone
        };
    }

    // Impact×Effort is the headline priority. Always matrix now (no manual/mode).





    function buildProjectTaskFlowEdges(taskList = [], explicitPairs = new Set()) {
        const sorted = [...taskList].sort((left, right) => {
            const rankLeft = PROJECT_TASK_STATUS_RANK[text(left?.status || 'todo')] ?? 0;
            const rankRight = PROJECT_TASK_STATUS_RANK[text(right?.status || 'todo')] ?? 0;
            if (rankLeft !== rankRight) return rankLeft - rankRight;
            return compareProjectTaskGraphNodes(left, right);
        });
        const flowEdges = [];
        sorted.forEach((task, index) => {
            if (index >= sorted.length - 1) return;
            const fromId = text(task?.id);
            const toId = text(sorted[index + 1]?.id);
            if (!fromId || !toId || fromId === toId) return;
            if (explicitPairs.has(`${fromId}->${toId}`)) return;
            flowEdges.push({ from: fromId, to: toId, kind: 'flow' });
        });
        return flowEdges;
    }






































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








































    function polylineToSmoothPathD(points = []) {
        const pts = (Array.isArray(points) ? points : []).filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y));
        if (pts.length < 2) return { d: '', midX: 0, midY: 0 };
        if (pts.length === 2) {
            return {
                d: `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`,
                midX: (pts[0].x + pts[1].x) / 2,
                midY: (pts[0].y + pts[1].y) / 2
            };
        }
        // Catmull-Rom to cubic Bezier
        let d = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 0; i < pts.length - 1; i++) {
            const p0 = pts[i === 0 ? i : i - 1];
            const p1 = pts[i];
            const p2 = pts[i + 1];
            const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];
            const c1x = p1.x + (p2.x - p0.x) / 6;
            const c1y = p1.y + (p2.y - p0.y) / 6;
            const c2x = p2.x - (p3.x - p1.x) / 6;
            const c2y = p2.y - (p3.y - p1.y) / 6;
            d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`;
        }
        const mid = pts[Math.floor(pts.length / 2)];
        return { d, midX: mid.x, midY: mid.y };
    }
























































































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
        if (!want) throw new Error('Task title is required.');
        if (projectHasTaskTitle(project, want, { excludeTaskId })) {
            throw new Error(`A task named “${want}” already exists in this project.`);
        }
        return want;
    }

    function parseDependsOnFromForm(form) {
        if (!form) return [];
        const select = form.querySelector('select[name="projectTaskDependsOnIds"]');
        if (select) {
            return Array.from(select.selectedOptions).map((option) => text(option.value)).filter(Boolean);
        }
        // Hidden inputs preserve map-wired parents when the multi-select is not shown.
        return uniqueStrings(
            Array.from(form.querySelectorAll('input[name="projectTaskDependsOnIds"]'))
                .map((input) => text(input.value))
                .filter(Boolean)
        );
    }

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

    let bound = false;
    let boundHost = null;
    let lastSocialRoot = null;
    let globalKeydownBound = false;
    let scrollLockMediaBound = false;
    let socialChromeResizeObserver = null;
    let socialLayoutResizeObserver = null;
    let socialCenterScrollStableFrames = 0;
    let socialCenterWheelForwardBound = false;
    let socialVisualViewportBound = false;
    const SOCIAL_TAB_SCROLL_RESET_RE = /^(panel|community-tab|pages-tab|groups-tab|events-tab|surveys-tab|feed-tab)$/;
    const SOCIAL_SKIP_TRANSPARENCY_REFRESH_RE = /^(feed-tab|community-tab|pages-tab|groups-tab|events-tab|surveys-tab|feed-scope|directory-search|directory-role|post-react|post-save|photography-tab|photography-search-input|photography-follow|photography-view-profile|photography-profile-back|photography-my-profile|photography-my-profile-tab|notification-read|notification-removed|notifications-refresh|chat-read|chat-upsert|message-sent|message-delete|chat-hide|alerts-filter|messages-filter|mobile-nav|workspace-nav-open|workspace-nav-close|workspace-nav-collapse|workspace-nav-expand|connection-|comment-react|comment-reply|comment-post|project-task-)/;
    let renderAttemptCount = 0;
    let directoryRefreshTimer = 0;
    let groupInviteSearchTimer = 0;
    let projectInviteSearchTimer = 0;
    let pageMembersSearchTimer = 0;
    let photographySearchTimer = 0;
    const GROUP_INVITE_SEARCH_MS = 220;
    let lastShellSignature = '';
    let renderDebounceTimer = 0;
    let socialCommunityModulePromise = null;
    let socialAlertsModulePromise = null;
    let socialLostFoundModulePromise = null;
    let socialPhotographyModulePromise = null;
    let socialSurveysModulePromise = null;
    let socialMessagesModulePromise = null;
    let socialProfileModulePromise = null;
    let socialDesktopModulePrefetchScheduled = false;
    let socialDirectoryPrefetchScheduled = false;
    let socialRouteGuardianBound = false;
    let socialRouteGuardianInterval = 0;
    let hostEventAbort = null;
    const pendingCommentReactions = new Set();

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
            bound = false;
            boundHost = null;
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
            bound = false;
            boundHost = null;
            bindEvents();
            guardianRenderInProgress = true;
            renderSocialPageNow('social-route-guardian');
            window.setTimeout(() => { guardianRenderInProgress = false; }, 200);
        };

        const observer = new MutationObserver(() => {
            if (guardianRenderInProgress) return;
            clearTimeout(guardianReconcileTimer);
            guardianReconcileTimer = setTimeout(reconcile, 150);
        });
        observer.observe(appContent, { childList: true, subtree: true });
        window.setTimeout(reconcile, 200);
        window.setTimeout(reconcile, 800);
        window.setTimeout(reconcile, 2000);
        if (socialRouteGuardianInterval) window.clearInterval(socialRouteGuardianInterval);
        socialRouteGuardianInterval = window.setInterval(() => reconcile(), 500);
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

    function countNum(value) {
        return Number(value || 0);
    }

    function postKey(postOrId) {
        if (postOrId && typeof postOrId === 'object') return text(postOrId.id);
        return text(postOrId);
    }

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

    function escape(value) {
        try {
            if (typeof escapePortalSocialHtml === 'function') return escapePortalSocialHtml(value);
        } catch (error) {}
        return text(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function makeId(prefix) {
        return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    }

    function getSafeSocialExternalUrl(value) {
        const raw = text(value);
        if (!raw) return '';
        if (/^(mailto:|tel:)/i.test(raw)) return raw;
        try {
            const parsed = new URL(raw, window.location.href);
            if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
                return parsed.toString();
            }
        } catch (error) {}
        return '';
    }

    function domToken(value) {
        try {
            if (typeof window.toDomToken === 'function') return window.toDomToken(value);
        } catch (error) {}
        return String(value || '').replace(/[^a-zA-Z0-9_-]+/g, '_');
    }

    function uniqueStrings(values) {
        return [...new Set((Array.isArray(values) ? values : [values]).map((item) => text(item)).filter(Boolean))];
    }

    function controlId(name, scope = '') {
        return `social-${domToken(scope ? `${name}-${scope}` : name)}`;
    }

    function currentFacultyCode() {
        try {
            if (typeof getCurrentFaculty === 'function') {
                return text(getCurrentFaculty())
                    || text(currentUser()?.facultyCode || currentUser()?.faculty)
                    || text(localStorage.getItem('currentFaculty'))
                    || text(document.body?.dataset?.faculty || document.documentElement?.dataset?.faculty)
                    || 'ECON';
            }
        } catch (error) {}
        return text(currentUser()?.facultyCode || currentUser()?.faculty)
            || text(localStorage.getItem('currentFaculty'))
            || text(document.body?.dataset?.faculty || document.documentElement?.dataset?.faculty)
            || 'ECON';
    }

    function shellIdentitySignature() {
        const role = text(currentUser()?.role || localStorage.getItem('currentUserRole') || 'student');
        return `${role}::${currentFacultyCode()}`;
    }

    function when(value) {
        try {
            if (typeof formatPortalSocialWhen === 'function') return formatPortalSocialWhen(value);
        } catch (error) {}
        return text(value);
    }

    function roleValue(key, fallback) {
        try {
            if (typeof USER_ROLES !== 'undefined' && USER_ROLES && USER_ROLES[key]) return USER_ROLES[key];
        } catch (error) {}
        return USER_ROLES_FALLBACK[key] || fallback;
    }

    function roleLabel(role) {
        const labels = {
            [roleValue('STUDENT', 'student')]: 'Student',
            [roleValue('PROFESSOR', 'professor')]: 'Professor',
            [roleValue('TA', 'ta')]: 'Teaching Assistant',
            [roleValue('ADMIN', 'admin')]: 'Admin',
            [roleValue('STUDENT_SERVICE', 'student_service')]: 'Student Service'
        };
        return labels[text(role).toLowerCase()] || 'Portal User';
    }

    function facultyLabel(code) {
        try {
            if (typeof getFacultyLabel === 'function') return getFacultyLabel(code);
        } catch (error) {}
        return text(code || 'Faculty');
    }

    function accountById(userId) {
        const runtime = state();
        return runtime.accountsById?.[text(userId)] || null;
    }

    function displayName(accountOrId) {
        const account = typeof accountOrId === 'string' ? accountById(accountOrId) : accountOrId;
        return text(
            account?.displayName
            || account?.nameEn
            || account?.name
            || account?.email
            || account?.id
            || 'Portal User'
        );
    }

    function accountSubtitle(account) {
        const faculty = text(account?.facultyCode || account?.faculty || '');
        return `${roleLabel(account?.role)}${faculty ? ` / ${facultyLabel(faculty)}` : ''}`;
    }

    function isAccountOnline(account) {
        return Boolean(account?.online);
    }

    function accountPresenceLabel(account) {
        if (!account) return 'Offline';
        if (isAccountOnline(account)) return 'Online';
        return text(account?.lastSeenAt) ? `Last seen ${when(account.lastSeenAt)}` : 'Offline';
    }

    function presencePill(account) {
        return `<span class="social-neo-pill social-neo-presence-pill ${isAccountOnline(account) ? 'is-online' : 'is-offline'}">${escape(accountPresenceLabel(account))}</span>`;
    }

    function groupMemberPreviewNames(memberIds, limit = 4) {
        return (Array.isArray(memberIds) ? memberIds : [])
            .slice(0, limit)
            .map((memberId) => displayName(accountById(memberId) || { id: memberId }))
            .filter(Boolean);
    }

    function avatarSource(account) {
        try {
            if (typeof resolvePortalSocialAvatarSource === 'function') return resolvePortalSocialAvatarSource(account);
        } catch (error) {}
        return '';
    }

    function avatarFallback(account) {
        try {
            if (typeof resolvePortalSocialAvatarFallback === 'function') return resolvePortalSocialAvatarFallback(account);
        } catch (error) {}
        const base = displayName(account);
        return base.split(/\s+/).filter(Boolean).slice(0, 2).map((item) => item.charAt(0).toUpperCase()).join('') || 'KI';
    }

    function avatar(account, modifier = '') {
        const src = avatarSource(account);
        const classes = ['social-neo-avatar'];
        if (modifier) classes.push(modifier);
        if (src) {
            return `<span class="${classes.join(' ')}"><img src="${escape(src)}" alt="${escape(displayName(account))}"></span>`;
        }
        return `<span class="${classes.join(' ')} is-fallback">${escape(avatarFallback(account))}</span>`;
    }

    function fileUrl(file) {
        try {
            if (typeof resolvePortalSocialFileUrl === 'function') {
                const resolved = resolvePortalSocialFileUrl(file);
                if (resolved) return resolved;
            }
        } catch (error) {}
        const storageKey = text(file?.storageKey || file?.id || '');
        const backend = text(file?.storageBackend).toLowerCase();
        if (storageKey && typeof getPortalStoredFileUrl === 'function' && (backend === 'bridge' || backend === '' || !text(file?.dataUrl))) {
            const type = text(file?.type).toLowerCase();
            const name = text(file?.name).toLowerCase();
            const forDisplay = type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name);
            return getPortalStoredFileUrl(storageKey, { inline: forDisplay, forDisplay });
        }
        return text(file?.dataUrl);
    }

    function isImage(file) {
        try {
            if (typeof isPortalSocialImage === 'function') return Boolean(isPortalSocialImage(file));
        } catch (error) {}
        const name = text(file?.name).toLowerCase();
        const type = text(file?.type).toLowerCase();
        return type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name);
    }

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

    // Render the upload wizard straight into the dialog region, bypassing the
    // debounced renderSocialPageNow pipeline. Background polling renders were
    // racing the debounce timer and swallowing wizard updates (file pick / step
    // changes), so drive this interaction synchronously instead.
    function renderPhotographyUploadDialogNow() {
        if (text(activeDialog()?.type || '') !== 'photography-upload') return;
        const region = socialDialogRegion();
        if (!region) return;
        setSocialRegionMarkup(region, renderDialog());
        bindPhotographyUploadDialogFileInput();
    }

    function renderDialogOnlyNow() {
        const host = root();
        if (!host) return;
        const shell = ensureSocialShell(host);
        const runtime = state();
        const stackSynced = trySyncProjectTaskGraphStackDialog(shell.dialog, runtime);
        if (!stackSynced) {
            setSocialRegionMarkup(shell.dialog, renderDialog());
        }
        bindPhotographyUploadDialogFileInput();
        if (typeof window.enhanceUniversalPickers === 'function') {
            try { window.enhanceUniversalPickers(shell.dialog); } catch (error) {}
        }
        syncOverlayPortalVisibility();
        bindEvents();
        const activeKind = text(activeDialog()?.type || '');
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

    function groupAvatarSource(group) {
        const candidate = text(group?.avatarImage || group?.avatar || '');
        if (!candidate) return '';
        if (/^(data:|blob:|https?:\/\/|file:\/\/|\/)/i.test(candidate)) return candidate;
        if (/\.(png|jpe?g|gif|webp|svg)$/i.test(candidate)) return candidate;
        return '';
    }

    function groupAvatarFallback(group) {
        return text(group?.name || 'Group').split(/\s+/).filter(Boolean).slice(0, 2).map((item) => item.charAt(0).toUpperCase()).join('') || 'GR';
    }

    function groupAvatar(group, modifier = '') {
        const src = groupAvatarSource(group);
        const classes = ['social-neo-avatar', 'social-neo-group-avatar'];
        if (modifier) classes.push(modifier);
        if (src) {
            return `<span class="${classes.join(' ')}"><img src="${escape(src)}" alt="${escape(text(group?.name || 'Group'))}"></span>`;
        }
        return `<span class="${classes.join(' ')} is-fallback">${escape(groupAvatarFallback(group))}</span>`;
    }

    function groupBanner(group) {
        return text(group?.bannerImage || group?.banner || '');
    }

    function pageAvatarSource(page) {
        const candidate = text(page?.avatarImage || page?.avatar || '');
        if (!candidate) return '';
        if (/^(data:|blob:|https?:\/\/|file:\/\/|\/)/i.test(candidate)) return candidate;
        if (/\.(png|jpe?g|gif|webp|svg)$/i.test(candidate)) return candidate;
        return '';
    }

    function pageAvatarFallback(page) {
        return text(page?.name || 'Page').split(/\s+/).filter(Boolean).slice(0, 2).map((item) => item.charAt(0).toUpperCase()).join('') || 'PG';
    }

    function pageAvatar(page, modifier = '') {
        const src = pageAvatarSource(page);
        const classes = ['social-neo-avatar', 'social-neo-page-avatar'];
        if (modifier) classes.push(modifier);
        if (src) {
            return `<span class="${classes.join(' ')}"><img src="${escape(src)}" alt="${escape(text(page?.name || 'Page'))}"></span>`;
        }
        return `<span class="${classes.join(' ')} is-fallback">${escape(pageAvatarFallback(page))}</span>`;
    }

    function pageCover(page) {
        return text(page?.coverImage || page?.cover || '');
    }

    function pageTypeLabel(page) {
        const pageType = text(page?.pageType || page?.type || (page?.official ? 'campus' : 'brand'));
        if (pageType === 'campus') return 'Campus Page';
        if (pageType === 'community') return 'Community Page';
        return 'Brand Page';
    }

    function pagePostTypeLabel(post) {
        const postType = text(post?.postType || 'post').toLowerCase();
        if (postType === 'official') return 'Official post';
        if (postType === 'community') return 'Community post';
        return '';
    }

    function extractLinksFromText(value) {
        return uniqueStrings((text(value).match(/https?:\/\/[^\s<>"']+/gi) || []).map((item) => text(item).replace(/[),.;!?]+$/g, ''))).filter(Boolean);
    }

    function messageLinks(message) {
        return Array.isArray(message?.links) ? message.links.map((item) => text(item)).filter(Boolean) : extractLinksFromText(message?.text || '');
    }

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

    function ensureSocialEventsModule() {
        if (window.__KIU_SOCIAL_EVENTS_MODULE_LOADED
            && typeof window.renderEventsPanel === 'function'
            && window.renderEventsPanel !== renderEventsPanel
            && typeof window.renderEventCreateDialog === 'function'
            && window.renderEventCreateDialog !== renderEventCreateDialog) {
            return Promise.resolve();
        }
        const existing = document.querySelector(`script[src="${SOCIAL_EVENTS_MODULE_URL}"]`);
        if (existing) {
            return new Promise((resolve) => {
                existing.addEventListener('load', () => resolve(), { once: true });
                existing.addEventListener('error', () => resolve(), { once: true });
            });
        }
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
        if (existing) {
            return new Promise((resolve) => {
                existing.addEventListener('load', () => resolve(), { once: true });
                existing.addEventListener('error', () => resolve(), { once: true });
            });
        }
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = SOCIAL_GROUPS_MODULE_URL;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => resolve();
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
        if (existing) {
            return new Promise((resolve) => {
                existing.addEventListener('load', () => resolve(), { once: true });
                existing.addEventListener('error', () => resolve(), { once: true });
            });
        }
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
        if (window.__KIU_SOCIAL_WORKSPACE_MODULE_LOADED
            && typeof window.renderProjectCreateDialog === 'function'
            && window.renderProjectCreateDialog !== renderProjectCreateDialog
            && typeof window.renderWorkspaceHero === 'function'
            && window.renderWorkspaceHero !== renderWorkspaceHero
            && typeof window.renderProjectTaskCreateDialog === 'function'
            && window.renderProjectTaskCreateDialog !== renderProjectTaskCreateDialog
            && typeof window.renderPortfolioHero === 'function'
            && window.renderPortfolioHero !== renderPortfolioHero
            && typeof window.renderProjectTaskFormFields === 'function'
            && window.renderProjectTaskFormFields !== renderProjectTaskFormFields
            && typeof window.renderProjectTaskDetailModal === 'function'
            && window.renderProjectTaskDetailModal !== renderProjectTaskDetailModal
            && typeof window.renderProjectHealthDialog === 'function'
            && window.renderProjectHealthDialog !== renderProjectHealthDialog
            && typeof window.renderProjectRiskDialog === 'function'
            && window.renderProjectRiskDialog !== renderProjectRiskDialog
            && typeof window.renderProjectsWorkspacePanelClassic === 'function'
            && window.renderProjectsWorkspacePanelClassic !== renderProjectsWorkspacePanelClassic
            && typeof window.renderProjectTaskGraphFullscreen === 'function'
            && window.renderProjectTaskGraphFullscreen !== renderProjectTaskGraphFullscreen
            && typeof window.renderProjectsPanel === 'function'
            && window.renderProjectsPanel !== renderProjectsPanel
            && typeof window.renderWorkspaceOwnedDialog === 'function'
            && window.renderWorkspaceOwnedDialog !== renderWorkspaceOwnedDialog) {
            return Promise.resolve();
        }
        const existing = document.querySelector(`script[src="${SOCIAL_WORKSPACE_MODULE_URL}"]`);
        if (existing) {
            return new Promise((resolve) => {
                existing.addEventListener('load', () => resolve(), { once: true });
                existing.addEventListener('error', () => resolve(), { once: true });
            });
        }
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = SOCIAL_WORKSPACE_MODULE_URL;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => resolve();
            document.head.appendChild(script);
        });
    }

        function hasSocialWorkspaceModule() {
        return Boolean(window.__KIU_SOCIAL_WORKSPACE_MODULE_LOADED
            && typeof window.renderProjectCreateDialog === 'function'
            && window.renderProjectCreateDialog !== renderProjectCreateDialog
            && typeof window.renderWorkspaceHero === 'function'
            && window.renderWorkspaceHero !== renderWorkspaceHero
            && typeof window.renderProjectTaskCreateDialog === 'function'
            && window.renderProjectTaskCreateDialog !== renderProjectTaskCreateDialog
            && typeof window.renderPortfolioHero === 'function'
            && window.renderPortfolioHero !== renderPortfolioHero
            && typeof window.renderProjectTaskFormFields === 'function'
            && window.renderProjectTaskFormFields !== renderProjectTaskFormFields
            && typeof window.renderProjectTaskDetailModal === 'function'
            && window.renderProjectTaskDetailModal !== renderProjectTaskDetailModal
            && typeof window.renderProjectHealthDialog === 'function'
            && window.renderProjectHealthDialog !== renderProjectHealthDialog
            && typeof window.renderProjectRiskDialog === 'function'
            && window.renderProjectRiskDialog !== renderProjectRiskDialog
            && typeof window.renderProjectsWorkspacePanelClassic === 'function'
            && window.renderProjectsWorkspacePanelClassic !== renderProjectsWorkspacePanelClassic
            && typeof window.renderProjectTaskGraphFullscreen === 'function'
            && window.renderProjectTaskGraphFullscreen !== renderProjectTaskGraphFullscreen
            && typeof window.renderProjectsPanel === 'function'
            && window.renderProjectsPanel !== renderProjectsPanel
            && typeof window.renderWorkspaceOwnedDialog === 'function'
            && window.renderWorkspaceOwnedDialog !== renderWorkspaceOwnedDialog);
    }





    /** Thin page stub for lazy workspace module exports (identity-stable for hasSocialWorkspaceModule checks). */
    function createSocialWorkspaceStub(name, fallback) {
        function stub(...args) {
            const impl = window[name];
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

    const readProjectWeekPlansStore = createSocialWorkspaceStub('readProjectWeekPlansStore', {});
    const readProjectWeekPlan = createSocialWorkspaceStub('readProjectWeekPlan', {});
    const writeProjectWeekPlan = createSocialWorkspaceStub('writeProjectWeekPlan', undefined);
    const addToProjectWeekPlan = createSocialWorkspaceStub('addToProjectWeekPlan', undefined);
    const addManyToProjectWeekPlan = createSocialWorkspaceStub('addManyToProjectWeekPlan', undefined);
    const removeFromProjectWeekPlan = createSocialWorkspaceStub('removeFromProjectWeekPlan', undefined);
    const normalizeProjectWeekPlanWindow = createSocialWorkspaceStub('normalizeProjectWeekPlanWindow', undefined);
    const shouldRenderProjectTaskGraphStack = createSocialWorkspaceStub('shouldRenderProjectTaskGraphStack', '');
    const shouldRenderProjectHealthStack = createSocialWorkspaceStub('shouldRenderProjectHealthStack', false);
    const renderWorkspaceOwnedDialog = createSocialWorkspaceStub('renderWorkspaceOwnedDialog', '');
    const isProjectTaskGraphStackActive = createSocialWorkspaceStub('isProjectTaskGraphStackActive', '');
    const getProjectTaskGraphStackAnchorDialog = createSocialWorkspaceStub('getProjectTaskGraphStackAnchorDialog', '');
    const wrapProjectTaskGraphStack = createSocialWorkspaceStub('wrapProjectTaskGraphStack', '');
    const wrapProjectHealthStack = createSocialWorkspaceStub('wrapProjectHealthStack', '');
    const renderHealthStackLayers = createSocialWorkspaceStub('renderHealthStackLayers', '');
    const maybeWrapStackedProjectDialog = createSocialWorkspaceStub('maybeWrapStackedProjectDialog', '');
    const renderStackedProjectTaskChild = createSocialWorkspaceStub('renderStackedProjectTaskChild', '');
    const trySyncProjectTaskGraphStackDialog = createSocialWorkspaceStub('trySyncProjectTaskGraphStackDialog', '');
    const projectTaskGraphStackedBackdropClass = createSocialWorkspaceStub('projectTaskGraphStackedBackdropClass', '');
    const resolveProjectTaskGraphNodeFromTarget = createSocialWorkspaceStub('resolveProjectTaskGraphNodeFromTarget', '');
    const sortProjectBoardTasksByPriority = createSocialWorkspaceStub('sortProjectBoardTasksByPriority', function (tasks) { return Array.isArray(tasks) ? [...tasks] : []; });
    const filterProjectBoardTasks = createSocialWorkspaceStub('filterProjectBoardTasks', function (runtime, tasks) { return Array.isArray(tasks) ? tasks : []; });
    const projectTaskDependsOnIds = createSocialWorkspaceStub('projectTaskDependsOnIds', '');
    const resolveDeskTaskReadiness = createSocialWorkspaceStub('resolveDeskTaskReadiness', function () { return { kind: 'ready', label: 'Ready', openDeps: [], openCount: 0 }; });
    const orderDeskTasksByDependency = createSocialWorkspaceStub('orderDeskTasksByDependency', []);
    const buildDeskTaskForest = createSocialWorkspaceStub('buildDeskTaskForest', []);
    const buildProjectTaskInspectorFields = createSocialWorkspaceStub('buildProjectTaskInspectorFields', []);
    const syncProjectTaskMatrixPreview = createSocialWorkspaceStub('syncProjectTaskMatrixPreview', undefined);
    const computePertExpected = createSocialWorkspaceStub('computePertExpected', 0);
    const taskHasPert = createSocialWorkspaceStub('taskHasPert', false);
    const resolveTaskScheduleEstimate = createSocialWorkspaceStub('resolveTaskScheduleEstimate', function () { return { estimate: 0, unit: 'h', source: 'estimate' }; });
    const resolveProjectTaskPriorityDisplay = createSocialWorkspaceStub('resolveProjectTaskPriorityDisplay', function () { return { label: 'Medium', tone: 'neutral', score: 3 }; });
    const clampProjectTaskGraphCardHeight = createSocialWorkspaceStub('clampProjectTaskGraphCardHeight', '');
    const estimateProjectTaskGraphCardHeight = createSocialWorkspaceStub('estimateProjectTaskGraphCardHeight', '');
    const measureProjectTaskGraphCardHeights = createSocialWorkspaceStub('measureProjectTaskGraphCardHeights', '');
    const normalizeProjectTaskGraphMode = createSocialWorkspaceStub('normalizeProjectTaskGraphMode', '');
    const projectTaskGraphShowInferred = createSocialWorkspaceStub('projectTaskGraphShowInferred', '');
    const projectTaskGraphShowCritical = createSocialWorkspaceStub('projectTaskGraphShowCritical', '');
    const projectTaskGraphShowFlow = createSocialWorkspaceStub('projectTaskGraphShowFlow', '');
    const projectTaskGraphVisibleEdges = createSocialWorkspaceStub('projectTaskGraphVisibleEdges', '');
    const buildProjectTaskGraphModel = createSocialWorkspaceStub('buildProjectTaskGraphModel', '');
    const layoutProjectTaskGraphByStatus = createSocialWorkspaceStub('layoutProjectTaskGraphByStatus', '');
    const compareProjectTaskGraphNodes = createSocialWorkspaceStub('compareProjectTaskGraphNodes', '');
    const hashProjectTaskGraphSeed = createSocialWorkspaceStub('hashProjectTaskGraphSeed', '');
    const projectTaskGraphPseudoRandom = createSocialWorkspaceStub('projectTaskGraphPseudoRandom', '');
    const getProjectTaskGraphMetrics = createSocialWorkspaceStub('getProjectTaskGraphMetrics', '');
    const computeProjectTaskGraphStageSize = createSocialWorkspaceStub('computeProjectTaskGraphStageSize', '');
    const computeProjectTaskGraphNodeDegree = createSocialWorkspaceStub('computeProjectTaskGraphNodeDegree', '');
    const projectTaskGraphBoxRepulse = createSocialWorkspaceStub('projectTaskGraphBoxRepulse', '');
    const resolveProjectTaskGraphCardOverlaps = createSocialWorkspaceStub('resolveProjectTaskGraphCardOverlaps', '');
    const layoutProjectTaskGraphForce = createSocialWorkspaceStub('layoutProjectTaskGraphForce', '');
    const projectTaskGraphLayoutUsesSavedPositions = createSocialWorkspaceStub('projectTaskGraphLayoutUsesSavedPositions', '');
    const applyProjectTaskGraphSavedPositions = createSocialWorkspaceStub('applyProjectTaskGraphSavedPositions', '');
    const projectTaskGraphRectsOverlap = createSocialWorkspaceStub('projectTaskGraphRectsOverlap', '');
    const findFreeProjectTaskGraphPosition = createSocialWorkspaceStub('findFreeProjectTaskGraphPosition', '');
    const ensureProjectTaskGraphPositionForTask = createSocialWorkspaceStub('ensureProjectTaskGraphPositionForTask', '');
    const projectTaskGraphContentBounds = createSocialWorkspaceStub('projectTaskGraphContentBounds', '');
    const resolveProjectTaskGraphGroupBox = createSocialWorkspaceStub('resolveProjectTaskGraphGroupBox', '');
    const collectProjectTaskGraphGroupBoxes = createSocialWorkspaceStub('collectProjectTaskGraphGroupBoxes', '');
    const projectTaskGraphContentViewBox = createSocialWorkspaceStub('projectTaskGraphContentViewBox', '');
    const projectTaskGraphPositionsStorageKey = createSocialWorkspaceStub('projectTaskGraphPositionsStorageKey', '');
    const loadProjectTaskGraphPositions = createSocialWorkspaceStub('loadProjectTaskGraphPositions', undefined);
    const saveProjectTaskGraphPositions = createSocialWorkspaceStub('saveProjectTaskGraphPositions', undefined);
    const getProjectTaskGraphPositions = createSocialWorkspaceStub('getProjectTaskGraphPositions', '');
    const setProjectTaskGraphPositions = createSocialWorkspaceStub('setProjectTaskGraphPositions', undefined);
    const ensureProjectTaskGraphPositionsLoaded = createSocialWorkspaceStub('ensureProjectTaskGraphPositionsLoaded', '');
    const projectTaskGraphViewStorageKey = createSocialWorkspaceStub('projectTaskGraphViewStorageKey', '');
    const clampProjectTaskGraphZoom = createSocialWorkspaceStub('clampProjectTaskGraphZoom', '');
    const loadProjectTaskGraphView = createSocialWorkspaceStub('loadProjectTaskGraphView', undefined);
    const saveProjectTaskGraphView = createSocialWorkspaceStub('saveProjectTaskGraphView', undefined);
    const persistProjectTaskGraphView = createSocialWorkspaceStub('persistProjectTaskGraphView', undefined);
    const projectTaskGraphSyncStorageKey = createSocialWorkspaceStub('projectTaskGraphSyncStorageKey', '');
    const seedProjectTaskGraphFromProject = createSocialWorkspaceStub('seedProjectTaskGraphFromProject', undefined);
    const queueProjectTaskGraphSync = createSocialWorkspaceStub('queueProjectTaskGraphSync', undefined);
    const projectTaskGraphGroupsStorageKey = createSocialWorkspaceStub('projectTaskGraphGroupsStorageKey', '');
    const getProjectTaskGraphGroups = createSocialWorkspaceStub('getProjectTaskGraphGroups', '');
    const setProjectTaskGraphGroups = createSocialWorkspaceStub('setProjectTaskGraphGroups', undefined);
    const projectTaskGraphCheckpointStorageKey = createSocialWorkspaceStub('projectTaskGraphCheckpointStorageKey', '');
    const projectTaskGraphCheckpointsStorageKey = createSocialWorkspaceStub('projectTaskGraphCheckpointsStorageKey', '');
    const formatProjectTaskGraphCheckpointWhen = createSocialWorkspaceStub('formatProjectTaskGraphCheckpointWhen', '');
    const pulseProjectTaskGraphCheckpointButton = createSocialWorkspaceStub('pulseProjectTaskGraphCheckpointButton', undefined);
    const normalizeProjectTaskGraphCheckpointEntry = createSocialWorkspaceStub('normalizeProjectTaskGraphCheckpointEntry', '');
    const readProjectTaskGraphCheckpoints = createSocialWorkspaceStub('readProjectTaskGraphCheckpoints', '');
    const writeProjectTaskGraphCheckpoints = createSocialWorkspaceStub('writeProjectTaskGraphCheckpoints', undefined);
    const readProjectTaskGraphCheckpoint = createSocialWorkspaceStub('readProjectTaskGraphCheckpoint', '');
    const getProjectTaskGraphCheckpointById = createSocialWorkspaceStub('getProjectTaskGraphCheckpointById', '');
    const deleteProjectTaskGraphCheckpoint = createSocialWorkspaceStub('deleteProjectTaskGraphCheckpoint', undefined);
    const flushProjectTaskGraphSync = createSocialWorkspaceStub('flushProjectTaskGraphSync', undefined);
    const collectProjectTaskGraphCheckpoint = createSocialWorkspaceStub('collectProjectTaskGraphCheckpoint', '');
    const saveProjectTaskGraphCheckpoint = createSocialWorkspaceStub('saveProjectTaskGraphCheckpoint', undefined);
    const applyProjectTaskGraphCheckpointSnapshot = createSocialWorkspaceStub('applyProjectTaskGraphCheckpointSnapshot', undefined);
    const restoreProjectTaskGraphCheckpoint = createSocialWorkspaceStub('restoreProjectTaskGraphCheckpoint', '');
    const renderProjectTaskGraphHistoryDialog = createSocialWorkspaceStub('renderProjectTaskGraphHistoryDialog', '');
    const renderProjectTaskGraphScheduleHelpDialog = createSocialWorkspaceStub('renderProjectTaskGraphScheduleHelpDialog', '');
    const createProjectTaskGraphGroup = createSocialWorkspaceStub('createProjectTaskGraphGroup', undefined);
    const updateProjectTaskGraphGroup = createSocialWorkspaceStub('updateProjectTaskGraphGroup', undefined);
    const deleteProjectTaskGraphGroup = createSocialWorkspaceStub('deleteProjectTaskGraphGroup', undefined);
    const scrubDeletedTaskFromProjectTaskGraphGroups = createSocialWorkspaceStub('scrubDeletedTaskFromProjectTaskGraphGroups', undefined);
    const projectTaskGraphGroupMembershipWouldCycle = createSocialWorkspaceStub('projectTaskGraphGroupMembershipWouldCycle', '');
    const toggleProjectTaskGraphGroupMember = createSocialWorkspaceStub('toggleProjectTaskGraphGroupMember', undefined);
    const isProjectTaskGraphGroupId = createSocialWorkspaceStub('isProjectTaskGraphGroupId', '');
    const projectGroupDependsOnIds = createSocialWorkspaceStub('projectGroupDependsOnIds', '');
    const projectGroupBlocksIds = createSocialWorkspaceStub('projectGroupBlocksIds', '');
    const collectProjectTaskGraphGroupDescendantTaskIds = createSocialWorkspaceStub('collectProjectTaskGraphGroupDescendantTaskIds', '');
    const collectProjectTaskGraphGroupAbsorbedTaskIds = createSocialWorkspaceStub('collectProjectTaskGraphGroupAbsorbedTaskIds', '');
    const isProjectTaskGraphGroupComplete = createSocialWorkspaceStub('isProjectTaskGraphGroupComplete', '');
    const isProjectGraphDependencyOpen = createSocialWorkspaceStub('isProjectGraphDependencyOpen', '');
    const computeProjectTaskGraphGroupRollup = createSocialWorkspaceStub('computeProjectTaskGraphGroupRollup', '');
    const getProjectTaskGraphGroupLinkSummary = createSocialWorkspaceStub('getProjectTaskGraphGroupLinkSummary', '');
    const taskDurationHours = createSocialWorkspaceStub('taskDurationHours', 0);
    const taskScheduleRemainingHours = createSocialWorkspaceStub('taskScheduleRemainingHours', 0);
    const sumProjectOpenWorkHours = createSocialWorkspaceStub('sumProjectOpenWorkHours', 0);
    const sumProjectActualHours = createSocialWorkspaceStub('sumProjectActualHours', 0);
    const computeProjectSchedule = createSocialWorkspaceStub('computeProjectSchedule', function () { return { tasks: {}, project: {} }; });
    const formatProjectScheduleHours = createSocialWorkspaceStub('formatProjectScheduleHours', '');
    const formatProjectScheduleFloat = createSocialWorkspaceStub('formatProjectScheduleFloat', '');
    const formatTaskScheduleDisplay = createSocialWorkspaceStub('formatTaskScheduleDisplay', '');
    const projectScheduleCalendarDate = createSocialWorkspaceStub('projectScheduleCalendarDate', undefined);
    const formatProjectScheduleDate = createSocialWorkspaceStub('formatProjectScheduleDate', '');
    const renderProjectPlanVsBaselineStrip = createSocialWorkspaceStub('renderProjectPlanVsBaselineStrip', '');
    const renderProjectProgressHoursStrip = createSocialWorkspaceStub('renderProjectProgressHoursStrip', '');
    const computeProjectTaskGraphContentFitView = createSocialWorkspaceStub('computeProjectTaskGraphContentFitView', '');
    const buildProjectTaskGraphLayoutForView = createSocialWorkspaceStub('buildProjectTaskGraphLayoutForView', '');
    const applyProjectTaskGraphResetView = createSocialWorkspaceStub('applyProjectTaskGraphResetView', undefined);
    const projectTaskGraphBoxAnchor = createSocialWorkspaceStub('projectTaskGraphBoxAnchor', '');
    const getProjectTaskGraphDocks = createSocialWorkspaceStub('getProjectTaskGraphDocks', '');
    const projectTaskGraphDockAlongSide = createSocialWorkspaceStub('projectTaskGraphDockAlongSide', '');
    const scoreProjectTaskGraphDockPair = createSocialWorkspaceStub('scoreProjectTaskGraphDockPair', '');
    const selectProjectTaskGraphDockPair = createSocialWorkspaceStub('selectProjectTaskGraphDockPair', '');
    const buildProjectTaskGraphSeedPolyline = createSocialWorkspaceStub('buildProjectTaskGraphSeedPolyline', '');
    const sampleProjectTaskGraphPolyline = createSocialWorkspaceStub('sampleProjectTaskGraphPolyline', '');
    const projectTaskGraphPushOutOfRect = createSocialWorkspaceStub('projectTaskGraphPushOutOfRect', '');
    const relaxProjectTaskGraphPolyline = createSocialWorkspaceStub('relaxProjectTaskGraphPolyline', '');
    const normalizeProjectTaskGraphStatusId = createSocialWorkspaceStub('normalizeProjectTaskGraphStatusId', '');
    const projectTaskGraphStatusEdgeColor = createSocialWorkspaceStub('projectTaskGraphStatusEdgeColor', '');
    const projectTaskGraphCubicEdgePath = createSocialWorkspaceStub('projectTaskGraphCubicEdgePath', '');
    const projectTaskGraphEdgePath = createSocialWorkspaceStub('projectTaskGraphEdgePath', '');
    const projectTaskGraphEdgeAnchors = createSocialWorkspaceStub('projectTaskGraphEdgeAnchors', '');
    const projectTaskGraphObstacleList = createSocialWorkspaceStub('projectTaskGraphObstacleList', '');
    const projectTaskGraphEdgeFanMap = createSocialWorkspaceStub('projectTaskGraphEdgeFanMap', '');
    const formatProjectTaskGraphNodeLabel = createSocialWorkspaceStub('formatProjectTaskGraphNodeLabel', '');
    const computeProjectTaskGraphFitZoom = createSocialWorkspaceStub('computeProjectTaskGraphFitZoom', '');
    const computeProjectTaskGraphPreviewZoom = createSocialWorkspaceStub('computeProjectTaskGraphPreviewZoom', '');
    const renderProjectTaskGraphGroupNode = createSocialWorkspaceStub('renderProjectTaskGraphGroupNode', '');
    const renderProjectTaskGraphCardNode = createSocialWorkspaceStub('renderProjectTaskGraphCardNode', '');
    const projectTaskGraphPortRole = createSocialWorkspaceStub('projectTaskGraphPortRole', '');
    const resolveProjectTaskGraphWireEndpoints = createSocialWorkspaceStub('resolveProjectTaskGraphWireEndpoints', '');
    const readProjectTaskGraphPortCenter = createSocialWorkspaceStub('readProjectTaskGraphPortCenter', '');
    const resolveProjectTaskGraphLinkPreviewHost = createSocialWorkspaceStub('resolveProjectTaskGraphLinkPreviewHost', '');
    const ensureProjectTaskGraphLinkPreview = createSocialWorkspaceStub('ensureProjectTaskGraphLinkPreview', '');
    const updateProjectTaskGraphLinkPreview = createSocialWorkspaceStub('updateProjectTaskGraphLinkPreview', undefined);
    const clearProjectTaskGraphLinkPreview = createSocialWorkspaceStub('clearProjectTaskGraphLinkPreview', '');
    const setProjectTaskGraphInteracting = createSocialWorkspaceStub('setProjectTaskGraphInteracting', undefined);
    const scheduleProjectTaskGraphEdgeRefresh = createSocialWorkspaceStub('scheduleProjectTaskGraphEdgeRefresh', '');
    const findProjectTaskGraphLinkDropTarget = createSocialWorkspaceStub('findProjectTaskGraphLinkDropTarget', '');
    const findProjectTaskGraphMembershipDropGroup = createSocialWorkspaceStub('findProjectTaskGraphMembershipDropGroup', '');
    const renderProjectTaskGraphEdgeGroupsHtml = createSocialWorkspaceStub('renderProjectTaskGraphEdgeGroupsHtml', '');
    const renderProjectTaskGraphGroupEdgesHtml = createSocialWorkspaceStub('renderProjectTaskGraphGroupEdgesHtml', '');
    const renderProjectTaskGraphGroupDependencyEdgesHtml = createSocialWorkspaceStub('renderProjectTaskGraphGroupDependencyEdgesHtml', '');
    const readProjectTaskGraphLivePositions = createSocialWorkspaceStub('readProjectTaskGraphLivePositions', '');
    const escapeProjectTaskGraphAttr = createSocialWorkspaceStub('escapeProjectTaskGraphAttr', '');
    const patchRemoveProjectTaskGraphEdge = createSocialWorkspaceStub('patchRemoveProjectTaskGraphEdge', '');
    const patchProjectTaskGraphLinkCountLabel = createSocialWorkspaceStub('patchProjectTaskGraphLinkCountLabel', '');
    const syncProjectTaskGraphEdgesOnly = createSocialWorkspaceStub('syncProjectTaskGraphEdgesOnly', undefined);
    const renderProjectTaskGraphSvg = createSocialWorkspaceStub('renderProjectTaskGraphSvg', '');
    const renderProjectTaskGraphCanvas = createSocialWorkspaceStub('renderProjectTaskGraphCanvas', '');
    const refreshProjectTaskGraphEdgeLines = createSocialWorkspaceStub('refreshProjectTaskGraphEdgeLines', '');
    const projectTaskGraphWouldCycle = createSocialWorkspaceStub('projectTaskGraphWouldCycle', '');
    const readProjectTaskGraphPan = createSocialWorkspaceStub('readProjectTaskGraphPan', '');
    const isProjectTaskGraphScrollPanCanvas = createSocialWorkspaceStub('isProjectTaskGraphScrollPanCanvas', '');
    const resolveProjectTaskGraphPanSlack = createSocialWorkspaceStub('resolveProjectTaskGraphPanSlack', '');
    const clampProjectTaskGraphPan = createSocialWorkspaceStub('clampProjectTaskGraphPan', '');
    const readProjectTaskGraphScrollSurface = createSocialWorkspaceStub('readProjectTaskGraphScrollSurface', '');
    const readProjectTaskGraphLayoutSize = createSocialWorkspaceStub('readProjectTaskGraphLayoutSize', '');
    const projectTaskGraphScrollOffsets = createSocialWorkspaceStub('projectTaskGraphScrollOffsets', '');
    const readProjectTaskGraphPanSlackFromCanvas = createSocialWorkspaceStub('readProjectTaskGraphPanSlackFromCanvas', '');
    const readProjectTaskGraphPanFromScroll = createSocialWorkspaceStub('readProjectTaskGraphPanFromScroll', '');
    const ensureProjectTaskGraphScrollSurface = createSocialWorkspaceStub('ensureProjectTaskGraphScrollSurface', '');
    const applyProjectTaskGraphScrollZoom = createSocialWorkspaceStub('applyProjectTaskGraphScrollZoom', undefined);
    const centerProjectTaskGraphScrollPan = createSocialWorkspaceStub('centerProjectTaskGraphScrollPan', '');
    const applyProjectTaskGraphCanvasTransform = createSocialWorkspaceStub('applyProjectTaskGraphCanvasTransform', undefined);
    const initProjectTaskGraphScrollPan = createSocialWorkspaceStub('initProjectTaskGraphScrollPan', undefined);
    const resolveProjectTaskGraphPanBackdrop = createSocialWorkspaceStub('resolveProjectTaskGraphPanBackdrop', '');
    const clientToProjectTaskGraphCoords = createSocialWorkspaceStub('clientToProjectTaskGraphCoords', '');
    const getProjectTaskGraphHost = createSocialWorkspaceStub('getProjectTaskGraphHost', '');
    const projectTaskGraphMineOnlyActive = createSocialWorkspaceStub('projectTaskGraphMineOnlyActive', '');
    const filterProjectTaskGraphVisibleTasks = createSocialWorkspaceStub('filterProjectTaskGraphVisibleTasks', '');
    const resolveProjectTaskGraphScheduleScope = createSocialWorkspaceStub('resolveProjectTaskGraphScheduleScope', '');
    const computeProjectTaskGraphMapSchedule = createSocialWorkspaceStub('computeProjectTaskGraphMapSchedule', '');
    const resolveProjectTaskGraphContext = createSocialWorkspaceStub('resolveProjectTaskGraphContext', '');
    const buildProjectTaskGraphLayout = createSocialWorkspaceStub('buildProjectTaskGraphLayout', '');
    const applyProjectTaskGraphZoom = createSocialWorkspaceStub('applyProjectTaskGraphZoom', undefined);
    const syncProjectTaskGraphChrome = createSocialWorkspaceStub('syncProjectTaskGraphChrome', undefined);
    const syncProjectTaskGraphGroupFocus = createSocialWorkspaceStub('syncProjectTaskGraphGroupFocus', undefined);
    const collectProjectTaskGraphNeighborIds = createSocialWorkspaceStub('collectProjectTaskGraphNeighborIds', '');
    const syncProjectTaskGraphSelection = createSocialWorkspaceStub('syncProjectTaskGraphSelection', undefined);
    const buildProjectTaskGraphCanvasMarkup = createSocialWorkspaceStub('buildProjectTaskGraphCanvasMarkup', '');
    const syncProjectTaskGraphCanvas = createSocialWorkspaceStub('syncProjectTaskGraphCanvas', undefined);
    const syncProjectTaskGraphQuickCreate = createSocialWorkspaceStub('syncProjectTaskGraphQuickCreate', undefined);
    const renderProjectTaskGraphHealth = createSocialWorkspaceStub('renderProjectTaskGraphHealth', '');
    const renderProjectTaskGraphRailOverview = createSocialWorkspaceStub('renderProjectTaskGraphRailOverview', '');
    const renderProjectTaskGraphScheduleOverview = createSocialWorkspaceStub('renderProjectTaskGraphScheduleOverview', '');
    const syncProjectTaskGraphSidebar = createSocialWorkspaceStub('syncProjectTaskGraphSidebar', undefined);
    const refreshProjectTaskGraphDialog = createSocialWorkspaceStub('refreshProjectTaskGraphDialog', '');
    const selectProjectTaskGraphNode = createSocialWorkspaceStub('selectProjectTaskGraphNode', '');
    const addProjectTaskDependency = createSocialWorkspaceStub('addProjectTaskDependency', '');
    const removeProjectTaskDependency = createSocialWorkspaceStub('removeProjectTaskDependency', '');
    const addProjectGraphDependency = createSocialWorkspaceStub('addProjectGraphDependency', '');
    const patchLocalProjectTaskDepends = createSocialWorkspaceStub('patchLocalProjectTaskDepends', '');
    const removeProjectGraphDependency = createSocialWorkspaceStub('removeProjectGraphDependency', '');
    const renderProjectTaskGraphQuickCreatePopover = createSocialWorkspaceStub('renderProjectTaskGraphQuickCreatePopover', '');
    const renderProjectTaskGraphDetailRailPlaceholder = createSocialWorkspaceStub('renderProjectTaskGraphDetailRailPlaceholder', '');
    const renderProjectTaskGraphDetailRailContent = createSocialWorkspaceStub('renderProjectTaskGraphDetailRailContent', '');
    const renderProjectTaskGraphGroupInspector = createSocialWorkspaceStub('renderProjectTaskGraphGroupInspector', '');
    const renderProjectTaskGraphInspector = createSocialWorkspaceStub('renderProjectTaskGraphInspector', '');
    const renderProjectTaskGraphTools = createSocialWorkspaceStub('renderProjectTaskGraphTools', '');
    const detachProjectTaskGraphPanWindowListeners = createSocialWorkspaceStub('detachProjectTaskGraphPanWindowListeners', undefined);
    const attachProjectTaskGraphPanWindowListeners = createSocialWorkspaceStub('attachProjectTaskGraphPanWindowListeners', undefined);
    const isProjectTaskGraphPanButton = createSocialWorkspaceStub('isProjectTaskGraphPanButton', '');
    const closeProjectTaskGraphContextMenu = createSocialWorkspaceStub('closeProjectTaskGraphContextMenu', undefined);
    const openProjectTaskGraphContextMenu = createSocialWorkspaceStub('openProjectTaskGraphContextMenu', '');
    const bindProjectTaskGraphInteractions = createSocialWorkspaceStub('bindProjectTaskGraphInteractions', undefined);
    const bindProjectTaskGraphDrag = createSocialWorkspaceStub('bindProjectTaskGraphDrag', undefined);
    const bindProjectTaskGraphResizeObserver = createSocialWorkspaceStub('bindProjectTaskGraphResizeObserver', undefined);
    const renderTaskDependencyGraphPreview = createSocialWorkspaceStub('renderTaskDependencyGraphPreview', '');
    const renderProjectTaskGraphLegend = createSocialWorkspaceStub('renderProjectTaskGraphLegend', '');
    const renderProjectTaskGraphStatusMini = createSocialWorkspaceStub('renderProjectTaskGraphStatusMini', '');
    const renderProjectTaskGraphFullscreen = createSocialWorkspaceStub('renderProjectTaskGraphFullscreen', '');
    const syncProjectTabPills = createSocialWorkspaceStub('syncProjectTabPills', undefined);
    const projectTabPaneCacheKey = createSocialWorkspaceStub('projectTabPaneCacheKey', function (projectId, tabId) { return `${text(projectId)}:${text(tabId || 'overview') || 'overview'}`; });
    const clearProjectTabPaneCache = createSocialWorkspaceStub('clearProjectTabPaneCache', undefined);
    const clearProjectTabPaneCacheKey = createSocialWorkspaceStub('clearProjectTabPaneCacheKey', undefined);
    const isProjectTaskGraphDialogOpen = createSocialWorkspaceStub('isProjectTaskGraphDialogOpen', '');
    const markProjectTaskGraphPreviewStale = createSocialWorkspaceStub('markProjectTaskGraphPreviewStale', undefined);
    const deskTasksSurfaceReady = createSocialWorkspaceStub('deskTasksSurfaceReady', null);
    const syncDeskToolbarFromFreshMarkup = createSocialWorkspaceStub('syncDeskToolbarFromFreshMarkup', undefined);
    const refreshProjectTasksTabBody = createSocialWorkspaceStub('refreshProjectTasksTabBody', false);
    const refreshProjectTasksTabPane = createSocialWorkspaceStub('refreshProjectTasksTabPane', false);
    const rebuildActiveProjectTabPaneIfPreviewHost = createSocialWorkspaceStub('rebuildActiveProjectTabPaneIfPreviewHost', false);
    const notifyProjectTaskGraphSurfaceChanged = createSocialWorkspaceStub('notifyProjectTaskGraphSurfaceChanged', undefined);
    const getOrCreateProjectTabPane = createSocialWorkspaceStub('getOrCreateProjectTabPane', null);
    const patchProjectWorkspaceTab = createSocialWorkspaceStub('patchProjectWorkspaceTab', false);
    const revealDeskExpandTarget = createSocialWorkspaceStub('revealDeskExpandTarget', undefined);
    const buildProjectCreateContext = createSocialWorkspaceStub('buildProjectCreateContext', function () { return { facultyOptions: [], projectFaculties: [], advisorCandidates: [] }; });
    const renderProjectCreateInviteSection = createSocialWorkspaceStub('renderProjectCreateInviteSection', '');
    const renderProjectTaskCard = createSocialWorkspaceStub('renderProjectTaskCard', '');
    const renderProjectTaskDetailModal = createSocialWorkspaceStub('renderProjectTaskDetailModal', '');
    const renderProjectColumnTasksModal = createSocialWorkspaceStub('renderProjectColumnTasksModal', '');
    const renderProjectTaskCreateDialog = createSocialWorkspaceStub('renderProjectTaskCreateDialog', '');
    const renderProjectHealthDialog = createSocialWorkspaceStub('renderProjectHealthDialog', '');
    const renderProjectHealthPlanCardHtml = createSocialWorkspaceStub('renderProjectHealthPlanCardHtml', '');
    const buildProjectHealthPlanPickModel = createSocialWorkspaceStub('buildProjectHealthPlanPickModel', { groups: [], tasks: [], horizon: 'week' });
    const renderProjectHealthPlanPickBodyHtml = createSocialWorkspaceStub('renderProjectHealthPlanPickBodyHtml', '');
    const renderProjectHealthPlanPickDialog = createSocialWorkspaceStub('renderProjectHealthPlanPickDialog', '');
    const renderProjectRiskDialog = createSocialWorkspaceStub('renderProjectRiskDialog', '');
    const renderProjectSettingsDialog = createSocialWorkspaceStub('renderProjectSettingsDialog', '');
    const renderProjectCreateDialog = createSocialWorkspaceStub('renderProjectCreateDialog', '');
    const renderPortfolioCreateDialog = createSocialWorkspaceStub('renderPortfolioCreateDialog', '');
    const portfolioStatus = createSocialWorkspaceStub('portfolioStatus', '');
    const portfolioVisibilityMode = createSocialWorkspaceStub('portfolioVisibilityMode', '');
    const parsePortfolioTextList = createSocialWorkspaceStub('parsePortfolioTextList', []);
    const parsePortfolioLinksInput = createSocialWorkspaceStub('parsePortfolioLinksInput', []);
    const serializePortfolioLinks = createSocialWorkspaceStub('serializePortfolioLinks', []);
    const portfolioAudienceLabel = createSocialWorkspaceStub('portfolioAudienceLabel', '');
    const normalizePortfolioEntry = createSocialWorkspaceStub('normalizePortfolioEntry', null);
    const canViewerAccessPortfolioEntry = createSocialWorkspaceStub('canViewerAccessPortfolioEntry', false);
    const portfolioEntriesForViewer = createSocialWorkspaceStub('portfolioEntriesForViewer', []);
    const portfolioMatchesRoleFilter = createSocialWorkspaceStub('portfolioMatchesRoleFilter', false);
    const portfolioDraftExists = createSocialWorkspaceStub('portfolioDraftExists', false);
    const clonePortfolioDocument = createSocialWorkspaceStub('clonePortfolioDocument', null);
    const portfolioMakeId = createSocialWorkspaceStub('portfolioMakeId', '');
    const getMyPortfolioDocument = createSocialWorkspaceStub('getMyPortfolioDocument', null);
    const ensureMyPortfolioDocument = createSocialWorkspaceStub('ensureMyPortfolioDocument', null);
    const clearPortfolioApiDeniedFlag = createSocialWorkspaceStub('clearPortfolioApiDeniedFlag', undefined);
    const hydrateMyPortfolioDocument = createSocialWorkspaceStub('hydrateMyPortfolioDocument', null);
    const portfolioFieldValue = createSocialWorkspaceStub('portfolioFieldValue', '');
    const portfolioReadDateRange = createSocialWorkspaceStub('portfolioReadDateRange', undefined);
    const portfolioCollectDocumentFromUi = createSocialWorkspaceStub('portfolioCollectDocumentFromUi', null);
    const saveMyPortfolioDocument = createSocialWorkspaceStub('saveMyPortfolioDocument', null);
    const renderMyPortfolioPanel = createSocialWorkspaceStub('renderMyPortfolioPanel', '');
    const renderPortfolioEditorDialog = createSocialWorkspaceStub('renderPortfolioEditorDialog', '');
    const renderPortfolioCustomBuilderOverlay = createSocialWorkspaceStub('renderPortfolioCustomBuilderOverlay', '');
    const openPortfolioEditor = createSocialWorkspaceStub('openPortfolioEditor', undefined);
    const resetPortfolioEditor = createSocialWorkspaceStub('resetPortfolioEditor', undefined);
    const renderPortfolioProfileBlock = createSocialWorkspaceStub('renderPortfolioProfileBlock', '');

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
        const existing = document.querySelector(`script[src="${SOCIAL_FEED_MODULE_URL}"]`);
        if (existing) {
            return new Promise((resolve) => {
                existing.addEventListener('load', () => resolve(), { once: true });
                existing.addEventListener('error', () => resolve(), { once: true });
            });
        }
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = SOCIAL_FEED_MODULE_URL;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => resolve();
            document.head.appendChild(script);
        });
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
            WORKSPACE_DIALOG_KEEP_CENTER
        };
        const impl = window.__kiuResolveSocialRenderPlan;
        if (typeof impl === 'function') return impl(reason, activePanel, runtime);
        return {
            flash: true, topbar: true, command: true, center: true, workspaceNav: true,
            drawer: true, mobileTab: true, toast: true, dialog: true,
            storyViewer: true, storyComposer: true
        };
    }

    function messageAnchorId(chatId, messageId) {
        return `social-message-${domToken(text(chatId))}-${domToken(text(messageId))}`;
    }

    function groupMessageAssets(chat) {
        return activeMessages(chat).reduce((accumulator, message) => {
            const file = message?.file || null;
            const links = messageLinks(message);
            if (file) {
                const entry = { id: text(message.id), file, sentAt: text(message.sentAt), senderId: text(message.senderId), message };
                if (isImage(file)) accumulator.media.push(entry);
                else accumulator.files.push(entry);
            }
            links.forEach((url) => {
                accumulator.links.push({ id: `${text(message.id)}::${url}`, url, sentAt: text(message.sentAt), senderId: text(message.senderId), message });
            });
            return accumulator;
        }, { files: [], media: [], links: [] });
    }

    function searchGroupMessages(chat, query) {
        const needle = text(query).toLowerCase();
        if (!needle) return [];
        return activeMessages(chat).flatMap((message) => {
            const results = [];
            const body = text(message?.text || '');
            const filename = text(message?.file?.name || '');
            const links = messageLinks(message);
            if (body.toLowerCase().includes(needle)) {
                results.push({ type: 'message', message, senderId: text(message?.senderId), sentAt: text(message?.sentAt), match: body });
            }
            if (filename && filename.toLowerCase().includes(needle)) {
                results.push({ type: isImage(message?.file) ? 'media' : 'file', message, senderId: text(message?.senderId), sentAt: text(message?.sentAt), match: filename, file: message.file });
            }
            links.filter((url) => url.toLowerCase().includes(needle)).forEach((url) => {
                results.push({ type: 'link', message, senderId: text(message?.senderId), sentAt: text(message?.sentAt), match: url, url });
            });
            return results;
        }).sort((left, right) => String(right?.sentAt || '').localeCompare(String(left?.sentAt || '')));
    }

    function currentCallParticipants(call) {
        return (Array.isArray(call?.participantIds) ? call.participantIds : Array.isArray(call?.members) ? call.members : [])
            .map((userId) => accountById(userId) || { id: userId, displayName: userId })
            .filter(Boolean);
    }

    function viewerInCall(call) {
        const viewerId = currentUserId();
        return Boolean(viewerId) && (Array.isArray(call?.participantIds) ? call.participantIds : []).some((userId) => text(userId) === viewerId);
    }

    function groupNotificationPreference(group) {
        try {
            return text(localStorage.getItem(`KIU_SOCIAL_GROUP_NOTIFY_${text(group?.id)}`) || 'all') || 'all';
        } catch (error) {
            return 'all';
        }
    }

    function setGroupNotificationPreference(groupId, value) {
        try {
            localStorage.setItem(`KIU_SOCIAL_GROUP_NOTIFY_${text(groupId)}`, text(value || 'all') || 'all');
        } catch (error) {}
    }

    function notificationItems() {
        try {
            if (typeof getPortalNotificationItemsForUser === 'function') return getPortalNotificationItemsForUser(currentUserId()) || [];
        } catch (error) {}
        return [];
    }

    function resolveNotificationFromTrigger(trigger) {
        const notificationRef = text(trigger?.getAttribute?.('data-notification-id') || '');
        if (!notificationRef) return null;
        return notificationItems().find((item) => text(item.key) === notificationRef || text(item.id) === notificationRef) || null;
    }

    function buildNotificationTargetUrl(notification) {
        if (!notification) return null;
        const routePage = text(notification.routePage || '');
        const routeData = notification.routeData || {};
        if (routeData.chatId) {
            return `social.html?panel=messages&chatId=${encodeURIComponent(text(routeData.chatId))}`;
        }
        if (routeData.groupId) {
            return `social.html?panel=feed&groupId=${encodeURIComponent(text(routeData.groupId))}`;
        }
        if (routeData.eventId) {
            return `social.html?panel=events&eventId=${encodeURIComponent(text(routeData.eventId))}`;
        }
        if (routeData.postId) {
            return `social.html?panel=feed&postId=${encodeURIComponent(text(routeData.postId))}`;
        }
        if (routePage === 'social') {
            const socialRoute = text(routeData.socialRoute || '');
            return socialRoute ? `social.html?${socialRoute}` : 'social.html';
        }
        if (routePage === 'lms' && routeData.courseId && routeData.groupId) {
            return `lms.html?courseId=${encodeURIComponent(text(routeData.courseId))}&groupId=${encodeURIComponent(text(routeData.groupId))}`;
        }
        if (routePage === 'student-service') {
            const ticketId = text(routeData.ticketId || '');
            return ticketId ? `student-service.html?ticketId=${encodeURIComponent(ticketId)}` : 'student-service.html';
        }
        if (routePage === 'orders') {
            const orderId = text(routeData.orderId || '');
            return orderId ? `orders.html?orderId=${encodeURIComponent(orderId)}` : 'orders.html';
        }
        if (routePage === 'news') {
            const postId = text(routeData.postId || '');
            return postId ? `news.html?postId=${encodeURIComponent(postId)}` : 'news.html';
        }
        if (routePage) {
            if (routePage.endsWith('.html')) return routePage;
            return `${routePage}.html`;
        }
        return null;
    }

    function markAlertNotificationAndRefresh(notification) {
        if (!notification) return;
        const key = text(notification.key || '');
        if (key) markPortalNotificationRead(key);
        renderSocialPageNow('notification-read');
    }

    function openNotificationTargetInNewTab(url) {
        const targetUrl = text(url || '');
        if (!targetUrl) return;
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }

    async function removeAlertNotificationAndRefresh(notification) {
        if (!notification) return;
        const notificationRef = text(notification.id || notification.key || '');
        if (!notificationRef) return;
        if (typeof removePortalNotification === 'function') {
            try { await removePortalNotification(notificationRef); } catch (error) {}
        }
        renderSocialPageNow('notification-removed');
    }

    async function removeAlertNotificationsAndRefresh(notifications) {
        const items = Array.isArray(notifications) ? notifications : [];
        for (const notification of items) {
            const notificationRef = text(notification?.id || notification?.key || '');
            if (!notificationRef) continue;
            if (typeof removePortalNotification === 'function') {
                try { await removePortalNotification(notificationRef); } catch (error) {}
            }
        }
        if (items.length) renderSocialPageNow('notification-removed');
    }

    function unreadNotifications() {
        try {
            if (typeof getPortalNotificationUnreadCount === 'function') return Number(getPortalNotificationUnreadCount(currentUserId()) || 0);
        } catch (error) {}
        return 0;
    }

    function unreadMessages(chat) {
        try {
            if (typeof getPortalMessengerUnreadCount === 'function') return Number(getPortalMessengerUnreadCount(chat, currentUserId()) || 0);
        } catch (error) {}
        return 0;
    }

    function chatTitle(chat) {
        try {
            if (typeof getPortalMessengerDisplayNameForChat === 'function') return getPortalMessengerDisplayNameForChat(chat, currentUserId());
        } catch (error) {}
        return text(chat?.name || 'Conversation');
    }

    function chatPreview(chat) {
        try {
            if (typeof getPortalMessengerMessagePreview === 'function') return getPortalMessengerMessagePreview(chat);
        } catch (error) {}
        return 'No messages yet';
    }

    function chatTime(chat) {
        try {
            if (typeof getPortalMessengerChatLastTime === 'function') return getPortalMessengerChatLastTime(chat);
        } catch (error) {}
        return when(chat?.updatedAt || chat?.createdAt);
    }

    function currentCall() {
        const runtime = state();
        const activeCallChatId = text(runtime.ui?.activeCallChatId || '');
        const activeCalls = (Array.isArray(runtime.calls) ? runtime.calls : []).filter((call) =>
            Array.isArray(call?.members) && call.members.some((memberId) => text(memberId) === currentUserId())
        );
        return activeCalls.find((call) => text(call.chatId) === activeCallChatId)
            || activeCalls.find((call) => Boolean(call?.active))
            || null;
    }

    function callForChat(chatId) {
        return (Array.isArray(state().calls) ? state().calls : []).find((call) => text(call?.chatId) === text(chatId)) || null;
    }

    function isIncomingCall(call) {
        return Boolean(call) && text(call?.status) === 'ringing' && text(call?.startedBy) !== currentUserId();
    }

    function isManagedPage(page) {
        return Boolean(page?.isManager);
    }

    function isJoinedGroup(group) {
        return ['manager', 'member'].includes(text(group?.membershipState));
    }

    function pageOrGroupPublic(item) {
        return text(item?.visibility || 'public') === 'public';
    }

    function postingScopeOptions() {
        const runtime = state();
        const userId = currentUserId();
        const options = [{
            type: 'profile',
            id: userId,
            name: 'My profile'
        }];
        (Array.isArray(runtime.social?.pages) ? runtime.social.pages : []).filter(isManagedPage).forEach((page) => {
            options.push({ type: 'page', id: text(page.id), name: text(page.name || 'Page') });
        });
        (Array.isArray(runtime.social?.groups) ? runtime.social.groups : []).filter(isJoinedGroup).forEach((group) => {
            options.push({ type: 'group', id: text(group.id), name: text(group.name || 'Group') });
        });
        return options;
    }

    function feedScopeOptions() {
        const runtime = state();
        const userId = currentUserId();
        const options = [{
            type: '',
            id: '',
            name: 'All visible posts'
        }, {
            type: 'profile',
            id: userId,
            name: 'My profile posts'
        }];
        (Array.isArray(runtime.social?.pages) ? runtime.social.pages : []).forEach((page) => {
            options.push({ type: 'page', id: text(page.id), name: `Page - ${text(page.name || 'Untitled')}` });
        });
        (Array.isArray(runtime.social?.groups) ? runtime.social.groups : []).filter((group) => isJoinedGroup(group) || pageOrGroupPublic(group)).forEach((group) => {
            options.push({ type: 'group', id: text(group.id), name: `Group - ${text(group.name || 'Untitled')}` });
        });
        return options;
    }

    function eventScopeOptions() {
        return postingScopeOptions();
    }

    function relationshipBuckets() {
        const userId = currentUserId();
        const relationships = Array.isArray(state().social?.relationships) ? state().social.relationships : [];
        const incoming = [];
        const outgoing = [];
        const connections = [];
        const follows = [];

        relationships.forEach((relationship) => {
            const type = text(relationship?.type).toLowerCase();
            const status = text(relationship?.status).toLowerCase();
            if (type === 'connection-request' && status === 'pending') {
                if (text(relationship.toId) === userId) incoming.push(relationship);
                if (text(relationship.fromId) === userId) outgoing.push(relationship);
                return;
            }
            if (type === 'connection' && status === 'accepted') {
                connections.push(relationship);
                return;
            }
            if (type === 'follow' && text(relationship.fromId) === userId) {
                follows.push(relationship);
            }
        });

        return { incoming, outgoing, connections, follows };
    }

    function activeNavPanels() {
        const runtime = state();
        const social = runtime.social || {};
        const relationships = relationshipBuckets();
        const unreadThreadCount = activeChats().reduce((total, chat) => total + unreadMessages(chat), 0);
        return [{
            id: 'feed',
            label: 'Home',
            helper: 'Live campus feed',
            icon: 'fa-house',
            count: Array.isArray(runtime.feed) ? runtime.feed.length : 0
        }, {
            id: 'community',
            label: 'People',
            helper: 'Directory & connections',
            icon: 'fa-user-group',
            count: relationships.connections.length + relationships.incoming.length
        }, {
            id: 'groups',
            label: 'Groups',
            helper: 'Courses & clubs',
            icon: 'fa-layer-group',
            count: (Array.isArray(social.groups) ? social.groups : []).filter(isJoinedGroup).length
        }, {
            id: 'workspace',
            label: 'Projects',
            helper: 'Course group projects',
            icon: 'fa-diagram-project',
            count: (Array.isArray(social.projects) ? social.projects : []).filter((project) => ['owner', 'member', 'advisor', 'instructor-viewer'].includes(text(project?.role || '').toLowerCase())).length
        }, {
            id: 'projects',
            label: 'Portfolio',
            helper: 'Showcase feed',
            icon: 'fa-briefcase',
            count: Array.isArray(social.projects) ? social.projects.length : 0
        }, {
            id: 'pages',
            label: 'Pages',
            helper: 'Official & followed',
            icon: 'fa-flag',
            count: (Array.isArray(social.pages) ? social.pages : []).filter(p => p?.isFollowing).length
        }, {
            id: 'events',
            label: 'Events',
            helper: "What's happening",
            icon: 'fa-calendar-days',
            count: Array.isArray(social.events) ? social.events.length : 0
        }, {
            id: 'surveys',
            label: 'Surveys',
            helper: 'Campus feedback & polls',
            icon: 'fa-clipboard-list',
            count: pendingSurveyCount()
        }, {
            id: 'photography',
            label: 'Exposé',
            helper: 'Campus photo feed',
            icon: 'fa-camera-retro',
            count: photographyPosts().length
        }, {
            id: 'lost-and-found',
            label: 'Lost & Found',
            helper: 'Campus items',
            icon: 'fa-magnifying-glass-location',
            count: lostFoundActiveCount()
        }, {
            id: 'messages',
            label: 'Messages',
            helper: 'Direct and group chats',
            icon: 'fa-comments',
            count: unreadThreadCount
        }, {
            id: 'alerts',
            label: 'Alerts',
            helper: 'Mentions and notices',
            icon: 'fa-bell',
            count: unreadNotifications()
        }];
    }


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
    function photographyPosts() {
        const feed = Array.isArray(state().feed) ? state().feed : [];
        if (typeof getPortalPhotographyPosts === 'function') {
            try { return getPortalPhotographyPosts(feed); } catch (error) {}
        }
        return feed.filter((post) => text(post?.category) === 'Photography'
            && Array.isArray(post?.media)
            && post.media.some((media) => isImage(media)));
    }

    function filterFeedForHome(feed, filterId) {
        feed = (Array.isArray(feed) ? feed : []).filter((post) => text(post?.category) !== 'Photography');
        const runtime = state();
        const social = runtime.social || {};
        const relationships = relationshipBuckets();
        const connectionIds = new Set(relationships.connections.map((relationship) => text(relationship.fromId) === currentUserId() ? text(relationship.toId) : text(relationship.fromId)));
        const followedPageIds = new Set((Array.isArray(social.pages) ? social.pages : []).filter((page) => page?.isFollowing || isManagedPage(page)).map((page) => text(page.id)));
        const joinedGroupIds = new Set((Array.isArray(social.groups) ? social.groups : []).filter((group) => isJoinedGroup(group) || pageOrGroupPublic(group)).map((group) => text(group.id)));

        if (filterId === 'following') {
            return feed.filter((post) => connectionIds.has(text(post.authorUserId))
                || (text(post.scopeType) === 'page' && followedPageIds.has(text(post.scopeId)))
                || (text(post.scopeType) === 'group' && joinedGroupIds.has(text(post.scopeId))));
        }
        if (filterId === 'groups') return feed.filter((post) => text(post.scopeType) === 'group');
        if (filterId === 'pages') return feed.filter((post) => text(post.scopeType) === 'page');
        if (filterId === 'campus') return feed.filter((post) => !text(post.audience) || text(post.audience) === 'campus');
        return feed;
    }

    function classifyNotification(notification) {
        const nType = String(notification?.type || '').toLowerCase();
        const blob = `${text(notification?.title)} ${text(notification?.text)}`.toLowerCase();
        if (notification?.routeData?.chatId || nType === 'message' || nType === 'chat' || /message|chat|thread|reply/.test(blob)) return 'message';
        if (nType === 'mention' || /mention|tagged|mentioned|@/.test(blob)) return 'mention';
        if (nType === 'call' || /call|video|voice/.test(blob)) return 'call';
        return 'system';
    }

    const ALERTS_CATEGORIES = [
        { id: 'all', label: 'All', icon: 'fa-inbox' },
        { id: 'academic', label: 'Academic', icon: 'fa-graduation-cap' },
        { id: 'messages', label: 'Messages', icon: 'fa-envelope' },
        { id: 'social', label: 'Social', icon: 'fa-users' },
        { id: 'university', label: 'University', icon: 'fa-bullhorn' },
        { id: 'support', label: 'Support', icon: 'fa-headset' }
    ];

    function classifyNotificationCategory(notification) {
        const src = String(notification?.source || '').toLowerCase();
        const nType = String(notification?.type || '').toLowerCase();
        if (notification?.routeData?.chatId || nType === 'message' || nType === 'chat' || nType === 'call') return 'messages';
        if (src === 'social') return 'social';
        if (src === 'mail' || src === 'messenger' || src === 'calls') return 'messages';
        if (src === 'student-service') return 'support';
        if (src === 'news') return 'university';
        if (nType.includes('grade') || nType === 'manual-quiz-grade' || nType === 'grades-published') return 'academic';
        if (nType.includes('schedule')) return 'academic';
        if (nType.includes('enrollment')) return 'academic';
        if (nType.includes('announcement') || nType.includes('order')) return 'university';
        if (src === 'registration') return 'academic';
        return 'university';
    }

    function getCategoryUnreadCounts(notifications) {
        const counts = { all: 0, academic: 0, messages: 0, social: 0, university: 0, support: 0 };
        for (let i = 0; i < notifications.length; i++) {
            if (!notifications[i].read) {
                counts.all++;
                const cat = classifyNotificationCategory(notifications[i]);
                if (counts[cat] !== undefined) counts[cat]++;
            }
        }
        return counts;
    }

    function filterNotificationsByView(notifications, filterId) {
        if (filterId === 'mentions') return notifications.filter((notification) => classifyNotification(notification) === 'mention');
        if (filterId === 'all') return notifications;
        if (filterId === 'academic' || filterId === 'messages' || filterId === 'social' || filterId === 'university' || filterId === 'support') {
            return notifications.filter((notification) => classifyNotificationCategory(notification) === filterId);
        }
        return notifications.filter((notification) => !notification.read);
    }

    function lostFoundItems() {
        const runtime = state();
        return Array.isArray(runtime.social?.lostFoundItems) ? runtime.social.lostFoundItems : [];
    }

    const LOST_FOUND_DEFAULT_LISTING_DAYS = 90;

    function resolveLostFoundStatus(item = {}) {
        const status = text(item?.status || 'lost').toLowerCase();
        if (status === 'found') return 'found';
        if (status === 'lost') return 'lost';
        const kind = text(item?.kind || 'lost').toLowerCase();
        if (kind === 'found') return 'found';
        const isFound = ['resolved', 'archived', 'claimed'].includes(status);
        return isFound ? 'found' : 'lost';
    }

    function defaultLostFoundExpiresAt(baseDate = new Date()) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + LOST_FOUND_DEFAULT_LISTING_DAYS);
        return date.toISOString();
    }

    function resolveLostFoundExpiresAt(item = {}) {
        const explicit = text(item?.expiresAt || item?.endAt || item?.expiresOn);
        if (explicit) return explicit;
        const createdAt = text(item?.createdAt || item?.updatedAt);
        if (!createdAt) return '';
        const date = new Date(createdAt);
        if (Number.isNaN(date.getTime())) return '';
        date.setDate(date.getDate() + LOST_FOUND_DEFAULT_LISTING_DAYS);
        return date.toISOString();
    }

    function toDateTimeLocalValue(iso = '') {
        if (!text(iso)) return '';
        const date = new Date(iso);
        if (Number.isNaN(date.getTime())) return '';
        const pad = (value) => String(value).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    function fromDateTimeLocalValue(value = '') {
        if (!text(value)) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return date.toISOString();
    }

    function isLostFoundItemExpired(item = {}, nowMs = Date.now()) {
        const expiresAt = text(item?.expiresAt);
        if (!expiresAt) return false;
        const expiresMs = new Date(expiresAt).getTime();
        return Number.isFinite(expiresMs) && expiresMs <= nowMs;
    }

    function normalizeLostFoundItem(item = {}) {
        const status = resolveLostFoundStatus(item);
        return {
            id: text(item?.id),
            status,
            title: text(item?.title || ''),
            description: text(item?.description || ''),
            category: text(item?.category || 'General'),
            locationText: text(item?.locationText || item?.location || ''),
            eventDate: text(item?.eventDate || item?.lostAt || ''),
            imageUrl: text(item?.imageUrl || item?.photoUrl || ''),
            authorUserId: text(item?.authorUserId || item?.createdById || ''),
            authorName: text(item?.authorName || ''),
            createdAt: text(item?.createdAt || ''),
            updatedAt: text(item?.updatedAt || item?.createdAt || ''),
            expiresAt: resolveLostFoundExpiresAt(item),
            foundAt: status === 'found' ? text(item?.foundAt || item?.resolvedAt || item?.updatedAt || item?.createdAt) : '',
            foundByUserId: status === 'found' ? text(item?.foundByUserId || item?.resolvedByUserId || item?.authorUserId || item?.createdById) : '',
            contactChatId: text(item?.contactChatId || ''),
            notes: text(item?.notes || ''),
            relatedPageLinks: Array.isArray(item?.relatedPageLinks) ? item.relatedPageLinks : []
        };
    }

    function lostFoundActiveItems() {
        return lostFoundItems()
            .map((item) => normalizeLostFoundItem(item))
            .filter((item) => !isLostFoundItemExpired(item));
    }

    function lostFoundActiveCount() {
        return lostFoundActiveItems().filter((item) => item.status === 'lost').length;
    }

    function lostFoundRecoveredCount() {
        return lostFoundActiveItems().filter((item) => item.status === 'found').length;
    }

    async function pruneExpiredLostFoundItems(reason = 'lost-found-expired') {
        const current = lostFoundItems().map((item) => normalizeLostFoundItem(item));
        const active = current.filter((item) => !isLostFoundItemExpired(item));
        if (active.length === current.length) return active;
        return saveLostFoundItems(active, reason);
    }

    function lostFoundVisibleItems() {
        const runtime = state();
        const search = text(runtime.ui?.lostFoundSearch || '').toLowerCase();
        return lostFoundActiveItems()
            .filter((item) => item.status === 'lost')
            .filter((item) => {
                if (!search) return true;
                const blob = [
                    item.title,
                    item.description,
                    item.category,
                    item.locationText,
                    item.authorName
                ].join(' ').toLowerCase();
                return blob.includes(search);
            })
            .sort((left, right) => String(right.updatedAt || right.createdAt || '').localeCompare(String(left.updatedAt || left.createdAt || '')));
    }

    function surveys() {
        return Array.isArray(state().social?.surveys) ? state().social.surveys : [];
    }

    function surveyResponses() {
        return Array.isArray(state().social?.surveyResponses) ? state().social.surveyResponses : [];
    }

    function surveyById(surveyId) {
        const normalizedId = text(surveyId);
        return surveys().find((entry) => text(entry?.id) === normalizedId) || null;
    }

    function hasSurveyResponse(surveyId, userId = currentUserId()) {
        const normalizedSurveyId = text(surveyId);
        const normalizedUserId = text(userId);
        return surveyResponses().some((entry) => text(entry?.surveyId) === normalizedSurveyId && text(entry?.userId) === normalizedUserId);
    }

    function isSurveyAnswerProvided(form, question) {
        const qId = text(question?.id);
        const questionType = text(question?.questionType || 'single_choice');
        if (questionType === 'single_choice') {
            return Boolean(form.querySelector(`input[name="survey-q-${qId}"]:checked`));
        }
        if (questionType === 'multiple_choice') {
            return form.querySelectorAll(`input[name="survey-q-${qId}[]"]:checked`).length > 0;
        }
        if (questionType === 'rating' || questionType === 'yes_no') {
            return Boolean(form.querySelector(`input[name="survey-q-${qId}"]:checked`));
        }
        const input = form.querySelector(`[name="survey-q-${qId}"]`);
        return Boolean(text(input?.value).trim());
    }

    function collectSurveyAnswersFromForm(form, questions = []) {
        return questions.map((question) => {
            const qId = text(question.id);
            const questionType = text(question.questionType || 'single_choice');
            if (questionType === 'single_choice') {
                const selected = form.querySelector(`input[name="survey-q-${qId}"]:checked`);
                return { questionId: qId, optionIds: selected ? [text(selected.value)] : [] };
            }
            if (questionType === 'multiple_choice') {
                const selected = Array.from(form.querySelectorAll(`input[name="survey-q-${qId}[]"]:checked`)).map((el) => text(el.value));
                return { questionId: qId, optionIds: selected };
            }
            if (questionType === 'rating') {
                const selected = form.querySelector(`input[name="survey-q-${qId}"]:checked`);
                return { questionId: qId, ratingValue: Number(selected?.value) };
            }
            if (questionType === 'yes_no') {
                const selected = form.querySelector(`input[name="survey-q-${qId}"]:checked`);
                return { questionId: qId, yesNoValue: text(selected?.value) === 'yes' };
            }
            const input = form.querySelector(`[name="survey-q-${qId}"]`);
            return { questionId: qId, textValue: text(input?.value) };
        });
    }

    function clearSurveyFlowState(runtime, { keepTakingId = false } = {}) {
        if (!keepTakingId) runtime.ui.surveyTakingId = '';
    }

    function rippleSurveySubmitButton(btn, event) {
        if (!btn || btn.disabled) return;
        const rect = btn.getBoundingClientRect();
        const x = event && Number.isFinite(event.clientX)
            ? event.clientX - rect.left
            : rect.width / 2;
        const y = event && Number.isFinite(event.clientY)
            ? event.clientY - rect.top
            : rect.height / 2;
        btn.style.setProperty('--survey-ripple-x', `${x}px`);
        btn.style.setProperty('--survey-ripple-y', `${y}px`);
        btn.classList.remove('is-rippling', 'is-pressing');
        void btn.offsetWidth;
        btn.classList.add('is-rippling', 'is-pressing');
        const clearRipple = () => {
            btn.classList.remove('is-rippling');
            btn.removeEventListener('animationend', onRippleEnd);
        };
        const onRippleEnd = (endEvent) => {
            if (endEvent.target !== btn) return;
            clearRipple();
        };
        btn.addEventListener('animationend', onRippleEnd);
        window.setTimeout(clearRipple, 520);
        window.setTimeout(() => btn.classList.remove('is-pressing'), 240);
    }

    function rippleSurveyChoiceLabel(label, event) {
        if (!label) return;
        const rect = label.getBoundingClientRect();
        const x = event && Number.isFinite(event.clientX)
            ? event.clientX - rect.left
            : rect.width / 2;
        const y = event && Number.isFinite(event.clientY)
            ? event.clientY - rect.top
            : rect.height / 2;
        label.style.setProperty('--survey-ripple-x', `${x}px`);
        label.style.setProperty('--survey-ripple-y', `${y}px`);
        label.classList.remove('is-rippling');
        void label.offsetWidth;
        label.classList.add('is-rippling');
        const clear = () => {
            label.classList.remove('is-rippling');
            label.removeEventListener('animationend', onEnd);
        };
        const onEnd = (endEvent) => {
            if (endEvent.target !== label) return;
            clear();
        };
        label.addEventListener('animationend', onEnd);
        window.setTimeout(clear, 450);
    }

    function animateSurveyChoiceInteraction(input) {
        const label = input?.closest?.('.social-neo-survey-take-choice');
        if (!label) return;
        label.classList.remove('is-selecting');
        void label.offsetWidth;
        label.classList.add('is-selecting');
        const clear = () => {
            label.classList.remove('is-selecting');
            label.removeEventListener('animationend', onEnd);
        };
        const onEnd = (endEvent) => {
            if (endEvent.target !== label) return;
            clear();
        };
        label.addEventListener('animationend', onEnd);
        window.setTimeout(clear, 380);
    }

    function waitForSurveySubmitAnimation(ms) {
        return new Promise((resolve) => window.setTimeout(resolve, ms));
    }

    function setSurveySubmitButtonLabel(btn, labelText) {
        const label = btn?.querySelector?.('.social-neo-survey-submit-btn-label');
        if (label) label.textContent = labelText;
    }

    function setSurveySubmitButtonIcon(btn, iconClass) {
        const icon = btn?.querySelector?.('.social-neo-survey-submit-btn-icon i');
        if (icon) icon.className = `fas ${iconClass}`;
    }

    function flashSurveySubmitButton(btn, state = 'acting') {
        if (!btn) return;
        btn.classList.remove('is-acting', 'is-success', 'is-error', 'is-submitting');
        void btn.offsetWidth;
        if (state === 'acting') btn.classList.add('is-acting');
        else if (state === 'success') btn.classList.add('is-success');
        else if (state === 'error') btn.classList.add('is-error');
        else if (state === 'submitting') btn.classList.add('is-submitting');
    }

    function pendingSurveyCount() {
        return surveys().filter((survey) => text(survey?.status) === 'published' && Boolean(survey?.viewerCanRespond)).length;
    }

    function surveyStatusLabel(survey) {
        const status = text(survey?.status || 'draft');
        if (status === 'published') return 'Open';
        if (status === 'closed') return 'Closed';
        if (status === 'archived') return 'Archived';
        return 'Draft';
    }

    function surveyAudienceLabel(survey) {
        const audience = text(survey?.audience || 'campus');
        if (audience === 'faculty') return 'Faculty';
        if (audience === 'group') return 'Group';
        if (audience === 'page') return 'Page';
        if (audience === 'connections') return 'Connections';
        return 'Campus-wide';
    }

    function defaultSurveyClosesAt(baseDate = new Date(), dayOffset = 7) {
        const next = new Date(baseDate.getTime());
        next.setDate(next.getDate() + dayOffset);
        return next.toISOString();
    }

    function defaultSurveyDraftQuestions() {
        return [{
            prompt: '',
            questionType: 'single_choice',
            required: true,
            options: [{ label: '' }, { label: '' }]
        }];
    }

    function surveyAudienceCreateLabel(audience = 'campus') {
        const normalized = text(audience || 'campus') || 'campus';
        if (normalized === 'faculty') return 'My faculty';
        if (normalized === 'group') return 'Group members';
        if (normalized === 'page') return 'Page followers';
        if (normalized === 'connections') return 'My connections';
        return 'Campus-wide';
    }

    function surveyResultsVisibilityLabel(value = 'public_after_close') {
        const normalized = text(value || 'public_after_close') || 'public_after_close';
        if (normalized === 'live_public') return 'Live public';
        if (normalized === 'respondents_after_close') return 'Respondents';
        if (normalized === 'creator_only') return 'Creator only';
        return 'After close';
    }

    function defaultSurveyDraftSettings(variant = 'student') {
        const isOfficial = text(variant || 'student') === 'official';
        return {
            audience: isOfficial ? 'campus' : 'connections',
            resultsVisibility: isOfficial ? 'public_after_close' : 'respondents_after_close',
            promoteFeed: isOfficial,
            closesAt: toDateTimeLocalValue(defaultSurveyClosesAt(new Date(), isOfficial ? 21 : 7))
        };
    }

    function ensureSurveyDraftSettings(variant = 'student') {
        const runtime = state();
        const defaults = defaultSurveyDraftSettings(variant);
        if (!text(runtime.ui?.surveyDraftAudience)) runtime.ui.surveyDraftAudience = defaults.audience;
        if (!text(runtime.ui?.surveyDraftResultsVisibility)) runtime.ui.surveyDraftResultsVisibility = defaults.resultsVisibility;
        if (typeof runtime.ui?.surveyDraftPromoteFeed !== 'boolean') runtime.ui.surveyDraftPromoteFeed = defaults.promoteFeed;
        if (!text(runtime.ui?.surveyDraftClosesAt)) runtime.ui.surveyDraftClosesAt = defaults.closesAt;
        return {
            audience: text(runtime.ui.surveyDraftAudience || defaults.audience) || defaults.audience,
            resultsVisibility: text(runtime.ui.surveyDraftResultsVisibility || defaults.resultsVisibility) || defaults.resultsVisibility,
            promoteFeed: typeof runtime.ui.surveyDraftPromoteFeed === 'boolean' ? runtime.ui.surveyDraftPromoteFeed : defaults.promoteFeed,
            closesAt: text(runtime.ui.surveyDraftClosesAt || defaults.closesAt) || defaults.closesAt
        };
    }

    function surveyMatchesLane(survey, lane = 'student') {
        const normalizedLane = text(lane || 'student') || 'student';
        const isOfficial = Boolean(survey?.isOfficial);
        return normalizedLane === 'official' ? isOfficial : !isOfficial;
    }

    function rerenderSurveyCreateDialog() {
        const dialog = activeDialog() || {};
        if (text(dialog.type || '') !== 'survey-create') return;
        const variant = text(dialog.variant || state().ui?.surveysSubTab || 'student') || 'student';
        return openDialog('survey-create', { variant });
    }
















    function patchSurveyCreateQuestionsPanel({ skipSync = false } = {}) {
        if (text(activeDialog()?.type || '') !== 'survey-create') return;
        const form = document.querySelector('form[data-form="survey-create"]');
        if (!form) return rerenderSurveyCreateDialog();
        if (!skipSync) syncSurveyDraftFromForm(form);
        const questionsRoot = form.querySelector('.social-neo-surveys-create-questions');
        if (!questionsRoot) return rerenderSurveyCreateDialog();
        questionsRoot.innerHTML = typeof window.renderSurveyCreateQuestionsMarkup === 'function' ? window.renderSurveyCreateQuestionsMarkup() : '';
        const draft = ensureSurveyDraftQuestions();
        const questionCountStat = form.querySelector('.social-neo-surveys-hero-stats .social-neo-surveys-hero-stat strong');
        if (questionCountStat && typeof window.formatSurveyQuestionCountStat === 'function') questionCountStat.textContent = window.formatSurveyQuestionCountStat(draft);
        if (typeof window.enhanceUniversalPickers === 'function') window.enhanceUniversalPickers(questionsRoot);
    }

    function ensureSurveyDraftQuestions() {
        const runtime = state();
        if (!Array.isArray(runtime.ui?.surveyDraftQuestions) || !runtime.ui.surveyDraftQuestions.length) {
            runtime.ui.surveyDraftQuestions = defaultSurveyDraftQuestions();
        }
        return runtime.ui.surveyDraftQuestions;
    }

    function ensureSurveyDraftActiveIndex() {
        const runtime = state();
        const draft = ensureSurveyDraftQuestions();
        let index = Number(runtime.ui?.surveyDraftActiveIndex);
        if (!Number.isFinite(index)) index = 0;
        runtime.ui.surveyDraftActiveIndex = Math.min(Math.max(0, index), Math.max(0, draft.length - 1));
        return runtime.ui.surveyDraftActiveIndex;
    }

    function cloneSurveyDraftQuestions(draft = []) {
        return (Array.isArray(draft) ? draft : []).map((question) => {
            const entry = { ...question };
            if (Array.isArray(question?.options)) {
                entry.options = question.options.map((option) => ({ ...option }));
            }
            return entry;
        });
    }

    function parseSurveyQuestionBlock(block, index = 0) {
        const prompt = text(block.querySelector(`[name="surveyQuestionPrompt-${index}"]`)?.value || '');
        const questionTypeRaw = text(block.querySelector(`[name="surveyQuestionType-${index}"]`)?.value || 'single_choice') || 'single_choice';
        const questionType = surveyQuestionIsText(questionTypeRaw) ? 'text' : questionTypeRaw;
        const required = block.querySelector(`[name="surveyQuestionRequired-${index}"]`)?.checked !== false;
        const helpText = text(block.querySelector(`[name="surveyQuestionHelp-${index}"]`)?.value || '');
        const minRating = Number(block.querySelector(`[name="surveyQuestionMinRating-${index}"]`)?.value);
        const maxRating = Number(block.querySelector(`[name="surveyQuestionMaxRating-${index}"]`)?.value);
        const maxLength = Number(block.querySelector(`[name="surveyQuestionMaxLength-${index}"]`)?.value);
        const options = Array.from(block.querySelectorAll(`[name="surveyQuestionOption-${index}"]`))
            .map((input, optionIndex) => ({ label: text(input.value), orderIndex: optionIndex }));
        const entry = {
            prompt,
            questionType,
            required,
            helpText
        };
        if (surveyQuestionNeedsOptions(questionType)) {
            entry.options = options.length ? options : [{ label: '' }, { label: '' }];
        } else if (questionType === 'rating') {
            entry.minRating = Number.isFinite(minRating) ? minRating : 1;
            entry.maxRating = Number.isFinite(maxRating) ? maxRating : 5;
        } else if (surveyQuestionIsText(questionType)) {
            entry.maxLength = Number.isFinite(maxLength) ? maxLength : 2000;
        }
        return entry;
    }

    function surveyQuestionNeedsOptions(questionType) {
        return ['single_choice', 'multiple_choice'].includes(text(questionType));
    }

    function surveyQuestionIsText(questionType) {
        const type = text(questionType).toLowerCase();
        return type === 'text' || type === 'short_text' || type === 'long_text';
    }

    function surveyQuestionDefaultMaxLength(question = {}) {
        if (Number.isFinite(question?.maxLength)) return question.maxLength;
        return 2000;
    }

    function surveyQuestionTypeMeta(questionType = 'single_choice') {
        const normalizedType = surveyQuestionIsText(questionType)
            ? 'text'
            : (text(questionType || 'single_choice') || 'single_choice');
        const metaByType = {
            single_choice: { icon: 'fa-circle-dot', label: 'Single choice' },
            multiple_choice: { icon: 'fa-square-check', label: 'Multiple choice' },
            rating: { icon: 'fa-star-half-stroke', label: 'Rating scale' },
            yes_no: { icon: 'fa-toggle-on', label: 'Yes / No' },
            text: { icon: 'fa-align-left', label: 'Text' }
        };
        return metaByType[normalizedType] || metaByType.single_choice;
    }

    function parseSurveyScopeValue(rawValue = '') {
        const value = text(rawValue);
        const [scopeType, scopeId] = value.includes(':') ? value.split(':') : ['profile', currentUserId()];
        const scope = postingScopeOptions().find((entry) => text(entry.type) === text(scopeType) && text(entry.id) === text(scopeId))
            || { type: 'profile', id: currentUserId(), name: 'My profile' };
        return {
            scopeType: text(scope.type || 'profile') || 'profile',
            scopeId: text(scope.id || currentUserId()) || currentUserId(),
            scopeName: text(scope.name || '')
        };
    }

    function syncSurveyDraftFromForm(form) {
        if (!form) return ensureSurveyDraftQuestions();
        const runtime = state();
        if (form.surveyScope) runtime.ui.surveyDraftScope = text(form.surveyScope.value || runtime.ui?.surveyDraftScope || '');
        if (form.surveyAudience) runtime.ui.surveyDraftAudience = text(form.surveyAudience.value || runtime.ui?.surveyDraftAudience || 'connections') || 'connections';
        if (form.surveyResultsVisibility) runtime.ui.surveyDraftResultsVisibility = text(form.surveyResultsVisibility.value || runtime.ui?.surveyDraftResultsVisibility || 'respondents_after_close') || 'respondents_after_close';
        if (form.surveyClosesAt) runtime.ui.surveyDraftClosesAt = text(form.surveyClosesAt.value || runtime.ui?.surveyDraftClosesAt || '');
        if (form.surveyTitle) runtime.ui.surveyDraftTitle = text(form.surveyTitle.value || '');
        if (form.surveyDescription) runtime.ui.surveyDraftDescription = text(form.surveyDescription.value || '');
        if (form.surveyAnonymous) runtime.ui.surveyDraftAnonymous = Boolean(form.surveyAnonymous.checked);
        if (form.surveyPromoteFeed) runtime.ui.surveyDraftPromoteFeed = Boolean(form.surveyPromoteFeed.checked);
        const draft = cloneSurveyDraftQuestions(ensureSurveyDraftQuestions());
        const blocks = form.querySelectorAll('[data-survey-question-index]');
        blocks.forEach((block) => {
            const index = Number(block.getAttribute('data-survey-question-index'));
            if (!Number.isFinite(index) || index < 0 || index >= draft.length) return;
            draft[index] = parseSurveyQuestionBlock(block, index);
        });
        runtime.ui.surveyDraftQuestions = draft.length ? draft : defaultSurveyDraftQuestions();
        return runtime.ui.surveyDraftQuestions;
    }

    function parseSurveyQuestionsFromForm(form) {
        return syncSurveyDraftFromForm(form).map((question) => {
            const questionTypeRaw = text(question.questionType || 'single_choice');
            const questionType = surveyQuestionIsText(questionTypeRaw) ? 'text' : questionTypeRaw;
            const entry = {
                prompt: text(question.prompt),
                questionType,
                required: question.required !== false
            };
            if (text(question.helpText)) entry.helpText = text(question.helpText);
            if (surveyQuestionNeedsOptions(questionType)) {
                entry.options = (Array.isArray(question.options) ? question.options : [])
                    .map((option, index) => ({ label: text(option.label), orderIndex: index }))
                    .filter((option) => text(option.label));
            } else if (questionType === 'rating') {
                entry.minRating = Number.isFinite(question.minRating) ? question.minRating : 1;
                entry.maxRating = Number.isFinite(question.maxRating) ? question.maxRating : 5;
            } else if (surveyQuestionIsText(questionType)) {
                entry.maxLength = Number.isFinite(question.maxLength) ? question.maxLength : 2000;
            }
            return entry;
        }).filter((question) => text(question.prompt));
    }

    function surveysForTab(tab = 'available') {
        const normalizedTab = text(tab || 'available') || 'available';
        const lane = text(state().ui?.surveysSubTab || 'student') || 'student';
        const search = text(state().ui?.surveysSearch || '').toLowerCase();
        const userId = currentUserId();
        return surveys()
            .filter((survey) => surveyMatchesLane(survey, lane))
            .filter((survey) => {
                if (normalizedTab === 'available') {
                    return text(survey?.status) === 'published' && Boolean(survey?.viewerCanRespond);
                }
                if (normalizedTab === 'my-responses') {
                    return hasSurveyResponse(survey.id, userId) || Boolean(survey?.viewerHasResponded);
                }
                if (normalizedTab === 'managed') {
                    return Boolean(survey?.viewerCanManage);
                }
                if (normalizedTab === 'closed') {
                    return ['closed', 'archived'].includes(text(survey?.status));
                }
                return true;
            })
            .filter((survey) => {
                if (!search) return true;
                const blob = [
                    survey.title,
                    survey.description,
                    survey.createdByName,
                    surveyAudienceLabel(survey)
                ].join(' ').toLowerCase();
                return blob.includes(search);
            })
            .sort((left, right) => String(right.publishedAt || right.createdAt || '').localeCompare(String(left.publishedAt || left.createdAt || '')));
    }

    function lostFoundSuggestionItems(items, draftTitle = '', draftCategory = '', draftLocation = '', excludeId = '') {
        const title = text(draftTitle).toLowerCase();
        const category = text(draftCategory).toLowerCase();
        const location = text(draftLocation).toLowerCase();
        return (Array.isArray(items) ? items : [])
            .filter((item) => normalizeLostFoundItem(item).status === 'lost')
            .map((item) => normalizeLostFoundItem(item))
            .filter((item) => !text(excludeId) || text(item.id) !== text(excludeId))
            .filter((item) => {
                const blob = `${item.title} ${item.category} ${item.locationText}`.toLowerCase();
                if (!title && !category && !location) return false;
                if (title && blob.includes(title)) return true;
                if (category && text(item.category).toLowerCase() === category) return true;
                if (location && blob.includes(location)) return true;
                return false;
            })
            .slice(0, 3);
    }

    window.__kiuSocialCommunityHooks = window.__kiuSocialCommunityHooks || {};
        Object.assign(window.__kiuSocialCommunityHooks, {
        state,
        relationshipBuckets,
        text,
        controlId,
        connectionStatusFor,
        personSuggestionScore,
        isStaffAccount,
        currentUserId,
        accountById,
        sharedGroupsWithUser,
        sharedPagesWithUser,
        mutualConnectionCount,
        currentFacultyCode,
        avatar,
        displayName,
        accountSubtitle,
        personRoleBadges,
        personProfileCompleteness,
        personActivityLabel,
        personSuggestionReason,
        renderRelationshipActions,
        inviteEligibleGroups,
        escape,
        renderCommunityHero,
        openDialog,
        renderSocialPageNow,
        withBusy,
        root,
        invalidateSocialRenderCache,
        rememberInteractionAnchor,
        sendPortalSocialConnectionRequest,
        respondPortalSocialConnectionRequest,
        removePortalSocialConnection,
        queueDirectoryRefresh
    });

    window.__kiuSocialLostFoundHooks = window.__kiuSocialLostFoundHooks || {};
    Object.assign(window.__kiuSocialLostFoundHooks, {
        state,
        currentUser,
        text,
        escape,
        currentFacultyCode,
        lostFoundVisibleItems,
        lostFoundItems,
        normalizeLostFoundItem,
        lostFoundSuggestionItems,
        lostFoundActiveCount,
        lostFoundRecoveredCount,
        accountById,
        currentUserId,
        avatar,
        displayName,
        when,
        controlId,
        renderFileChip,
        setPanel,
        openDialog,
        renderSocialPageNow,
        resetLostFoundDraft,
        openPortalDirectChat,
        setActiveChat,
        closeDialog,
        withBusy,
        readFileAsDataUrl,
        saveLostFoundItems,
        makeId
    });

    window.__kiuSocialSurveysHooks = window.__kiuSocialSurveysHooks || {};
    Object.assign(window.__kiuSocialSurveysHooks, {
        state,
        currentUser,
        currentUserId,
        text,
        escape,
        when,
        controlId,
        surveysForTab,
        surveyById,
        surveyStatusLabel,
        surveyAudienceLabel,
        surveyMatchesLane,
        canPublishOfficialSurveys,
        ensureSurveyDraftSettings,
        ensureSurveyDraftQuestions,
        ensureSurveyDraftActiveIndex,
        surveyQuestionTypeMeta,
        surveyQuestionNeedsOptions,
        surveyQuestionDefaultMaxLength,
        surveyAudienceCreateLabel,
        surveyResultsVisibilityLabel,
        toDateTimeLocalValue,
        postingScopeOptions,
        activeDialog,
        setPanel,
        openDialog,
        closeDialog,
        renderSocialPageNow,
        withBusy,
        clearSurveyFlowState,
        defaultSurveyDraftQuestions,
        defaultSurveyDraftSettings,
        closePortalSocialSurvey,
        deletePortalSocialSurvey,
        loadPortalSocialSurveyResults,
        invalidateSocialRenderCache,
        patchSurveyCreateQuestionsPanel,
        syncSurveyDraftFromForm,
        createPortalSocialSurvey,
        respondPortalSocialSurvey,
        fromDateTimeLocalValue,
        restorePreviousDialog,
        isStaffAccount,
        parseSurveyQuestionsFromForm,
        parseSurveyScopeValue,
        collectSurveyAnswersFromForm,
        isSurveyAnswerProvided,
        addPortalSocialToast,
        flashSurveySubmitButton,
        setSurveySubmitButtonIcon,
        setSurveySubmitButtonLabel,
        waitForSurveySubmitAnimation
    });

    window.__kiuSocialEventsHooks = window.__kiuSocialEventsHooks || {};
    Object.assign(window.__kiuSocialEventsHooks, {
        state,
        currentUser,
        currentUserId,
        text,
        escape,
        when,
        eventCanManage,
        controlId,
        activeDialog,
        eventScopeOptions,
        setPanel,
        openDialog,
        renderSocialPageNow,
        withBusy,
        clearEventDraft,
        prefillEventEditDraft,
        patchEventRsvpButtons,
        respondPortalSocialEventRsvp,
        invalidateSocialRenderCache,
        ensureSocialGroupsModule,
        closeDialog,
        createPortalSocialEvent,
        deletePortalSocialEvent,
        updatePortalSocialEvent,
        fromDateTimeLocalValue,
        readFileAsDataUrl
    });

    window.__kiuSocialGroupsHooks = window.__kiuSocialGroupsHooks || {};
    Object.assign(window.__kiuSocialGroupsHooks, {
        state,
        text,
        escape,
        isJoinedGroup,
        groupAvatar,
        controlId,
        currentUserId,
        displayName,
        roleLabel,
        accountById,
        avatar,
        accountSubtitle,
        facultyLabel,
        findSocialGroupById,
        activeDialog,
        activeChats,
        groupForChat,
        groupMessageAssets,
        groupNotificationPreference,
        fileUrl,
        isImage,
        presencePill,
        when,
        inviteEligibleGroups,
        setPanel,
        openDialog,
        renderSocialPageNow,
        withBusy,
        setPortalSocialGroupMembership,
        respondPortalSocialGroupMembership,
        openPortalSocialGroupChat,
        setActiveChat,
        invalidateSocialRenderCache,
        reportPortalSocialContent,
        updatePortalSocialGroup,
        removePortalSocialGroupMember,
        searchGroupMessages,
        invitePortalSocialGroupMember,
        joinPortalGroupCall,
        leavePortalGroupCall,
        closeDialog,
        createPortalSocialGroup,
        readFileAsDataUrl
    });

    window.__kiuSocialPagesHooks = window.__kiuSocialPagesHooks || {};
    Object.assign(window.__kiuSocialPagesHooks, {
        state,
        text,
        escape,
        controlId,
        isManagedPage,
        pageAvatar,
        pageCover,
        pageTypeLabel,
        uniqueStrings,
        renderFileChip,
        renderPost,
        getSocialPageRecord,
        buildPageMembersList,
        pageAdminIdsFor,
        pageFollowerIdsFor,
        presencePill,
        accountById,
        accountSubtitle,
        avatar,
        displayName,
        roleLabel,
        currentUserId,
        setPanel,
        openDialog,
        renderSocialPageNow,
        withBusy,
        patchPageFollowState,
        shouldPatchPageComposeBlock,
        patchPageComposeBlock,
        patchSocialFlash,
        togglePortalSocialFollow,
        reportPortalSocialContent,
        invalidateSocialRenderCache,
        refreshPortalSocialFeed,
        updatePortalSocialPage,
        closeDialog,
        createPortalSocialPage,
        readFileAsDataUrl,
        submitSocialPost,
        queuePageMembersSearchRefresh,
        activeDialog
    });

    window.__kiuSocialWorkspaceHooks = window.__kiuSocialWorkspaceHooks || {};
        Object.assign(window.__kiuSocialWorkspaceHooks, {
        text,
        escape,
        uniqueStrings,
        currentFacultyCode,
        currentUserId,
        displayName,
        roleLabel,
        accountById,
        avatar,
        accountSubtitle,
        facultyLabel,
        controlId,
        toDateTimeLocalValue,
        resolveActiveSocialProject,
        fileUrl,
        isImage,
        when,
        computeTaskMatrixBucket,
        computeTaskMatrixScore,
        countNum,
        formatTaskTime,
        normalizeTaskScore1to5,
        normalizeTaskTime,
        normalizeTaskTimeUnit,
        formatProjectTaskBudgetEstimate,
        formatTaskCostVariance,
        formatTaskTimeVariance,
        normalizeProjectTaskStatusId,
        projectTaskDownstreamIds,
        resolveDeskTaskReadiness,
        resolveProjectTaskPriorityDisplay,
        normalizeProjectPlanHorizon,
        projectPlanHorizonLabel,
        resolveTaskPackageId,
        state,
        clearProjectTabPaneCache,
        ensureSocialMessagesModule,
        ensureProjectWorkspaceChat,
        filterProjectBoardTasks,
        hasSocialMessagesModule,
        isAccountOnline,
        isStaffAccount,
        queueDeferredModuleRender,
        readDeskSavedViews,
        renderProjectWorkspaceNavButtons,
        renderSocialPageNow,
        resolveProjectWorkspaceChat,
        setActiveChat,
        taskActivityMs,
        activeDialog,
        buildProjectTaskInspectorFields,
        currentUser,
        getSafeSocialExternalUrl,
        buildProjectTaskFlowEdges,
        clearProjectTabPaneCacheKey,
        openDialog,
        openProjectRiskForTask,
        rebuildActiveProjectTabPaneIfPreviewHost,
        refreshProjectTasksTabBody,
        refreshProjectTasksTabPane,
        renderDialogOnlyNow,
        withBusy,
        migrateProjectPlanEntry,
        patchPortfolioSaveStatus,
        portfolioEditorFormRoot,
        closeDialog,
        restorePreviousDialog,
        invalidateSocialRenderCache,
        setPanel,
        root,
        buildSocialRenderSignature,
        patchProjectWorkspaceTab,
        patchProjectHealthPlanCard,
        patchProjectHealthPlanPick,
        revealDeskExpandTarget,
        writeDeskSavedViews,
        assertUniqueProjectTaskTitle,
        createPortalSocialProject,
        createPortalSocialProjectBudgetCategory,
        createPortalSocialProjectBudgetExpense,
        createPortalSocialProjectRisk,
        createPortalSocialProjectTask,
        deletePortalSocialProjectTask,
        ensureProjectTaskGraphPositionForTask,
        focusSocialDialog,
        fromDateTimeLocalValue,
        getProjectTaskGraphPositions,
        markProjectTaskGraphPreviewStale,
        notifyProjectTaskGraphSurfaceChanged,
        parseDependsOnFromForm,
        parsePortfolioLinksInput,
        parseProjectTaskActualsPayload,
        parseProjectTaskBudgetEstimate,
        parseProjectTaskPriorityPayload,
        projectRiskScaleRank,
        refreshProjectTaskGraphDialog,
        resetPortfolioEditor,
        scrubDeletedTaskFromProjectTaskGraphGroups,
        setPortalSocialFlash,
        setPortalSocialProjectMembership,
        setProjectTaskGraphPositions,
        syncSocialOverlayLock,
        toggleProjectTaskGraphGroupMember,
        updatePortalSocialProject,
        updatePortalSocialProjectRisk,
        updatePortalSocialProjectTask,
        queueProjectInviteSearchRefresh,
        syncPortfolioEditorInput,
        syncProjectTaskMatrixPreview,
        syncTaskChecklistInput
    });

    window.__kiuSocialFeedHooks = window.__kiuSocialFeedHooks || {};
    Object.assign(window.__kiuSocialFeedHooks, {
        state,
        currentUser,
        currentUserId,
        text,
        escape,
        avatar,
        displayName,
        renderPost,
        reactionEmoji,
        reactionLabel,
        isPostSaved,
        pagePostTypeLabel,
        feedReason,
        renderPostEntityLinks,
        relationshipBuckets,
        isJoinedGroup,
        feedScopeOptions,
        filterFeedForHome,
        controlId,
        activeDialog,
        renderFileChip,
        postingScopeOptions,
        currentSocialProfileSettings,
        normalizeComposerEntityLinks,
        resolveEntityLinkMeta,
        listAttachableEntities,
        entityLinkIcon,
        postKey,
        findCommentInThread,
        accountById,
        accountSubtitle,
        when,
        filePreview,
        renderPostReactionMetrics,
        renderCommentThread,
        setPanel,
        openDialog,
        closeDialog,
        renderSocialPageNow,
        withBusy,
        root,
        focusFeed,
        clearPostComposeDraft,
        submitSocialPost,
        closeInlineReply,
        openInlineReply,
        deleteCommentInline,
        isCommentDialog,
        patchPostComposeAttachDialog,
        patchPostComposeDialog,
        patchPostReactions,
        patchCommentReactions,
        patchPostSaveButtons,
        patchPhotographyFeedReactions,
        scrollSocialCenterElementIntoView,
        refreshPortalSocialFeed,
        reactToPortalSocialPost,
        reactToPortalSocialComment,
        pinPortalSocialPost,
        toggleSavedPost,
        openPortalStoryComposer,
        closePortalStoryComposer,
        openPortalStoryViewer,
        closePortalStoryViewer,
        nextPortalStory,
        prevPortalStory,
        getPortalSocialStoryItems,
        commentOnPortalSocialPost,
        deletePortalSocialPost,
        invalidateSocialRenderCache,
        patchCommentDialogCount,
        readFileAsDataUrl,
        removePortalSocialComment,
        renderCommentNode,
        reportPortalSocialContent,
        reportSocialPost,
        restorePreviousDialog,
        setPortalSocialFlash,
        sharePortalSocialPost,
        submitPortalStory,
        syncCommentDraftFromTarget,
        updatePortalSocialPost
    });


    window.__kiuSocialPhotographyHooks = window.__kiuSocialPhotographyHooks || {};
    Object.assign(window.__kiuSocialPhotographyHooks, {
        state,
        currentUser,
        currentUserId,
        text,
        escape,
        when,
        avatar,
        displayName,
        accountById,
        accountSubtitle,
        currentFacultyCode,
        photographyPosts,
        relationshipBuckets,
        fileUrl,
        isImage,
        renderCommentNode,
        renderCommentThread,
        renderPostReactionMetrics,
        reactionEmoji,
        reactionLabel,
        postKey,
        isPostSaved,
        controlId,
        setPanel,
        openDialog,
        closeDialog,
        renderSocialPageNow,
        withBusy,
        activeDialog,
        openPhotographyUploadFilePicker,
        patchPhotographyFollowButtons,
        photographyUploadForm,
        reactToPortalSocialPost,
        refreshPhotographyPanelStage,
        renderPhotographyUploadDialogNow,
        revokePhotographyUploadPreview,
        togglePortalSocialFollow,
        submitSocialPost,
        applyPhotographyUploadFile
    });

    window.__kiuSocialAlertsHooks = window.__kiuSocialAlertsHooks || {};
    Object.assign(window.__kiuSocialAlertsHooks, {
        currentUser,
        notificationItems,
        state,
        text,
        filterNotificationsByView,
        classifyNotification,
        classifyNotificationCategory,
        getCategoryUnreadCounts,
        ALERTS_CATEGORIES,
        unreadNotifications,
        escape,
        when,
        roleValue,
        accountById,
        displayName,
        renderSocialPageNow,
        withBusy,
        invalidateSocialRenderCache,
        resolvePortalSocialReport,
        markPortalNotificationRead,
        markAlertNotificationAndRefresh,
        removeAlertNotificationAndRefresh,
        removeAlertNotificationsAndRefresh,
        resolveNotificationFromTrigger,
        buildNotificationTargetUrl,
        openNotificationTargetInNewTab
    });

    window.__kiuSocialMessagesHooks = window.__kiuSocialMessagesHooks || {};
    Object.assign(window.__kiuSocialMessagesHooks, {
        state,
        activeChats,
        activeMessages,
        text,
        unreadMessages,
        currentCall,
        callForChat,
        controlId,
        groupForChat,
        groupMessageAssets,
        searchGroupMessages,
        currentCallParticipants,
        viewerInCall,
        currentUser,
        currentUserId,
        accountById,
        accountPresenceLabel,
        accountSubtitle,
        displayName,
        avatar,
        when,
        presencePill,
        messageLinks,
        messageAnchorId,
        filePreview,
        renderLinkedMessageText,
        groupAvatar,
        groupBanner,
        groupMemberPreviewNames,
        groupNotificationPreference,
        chatTitle,
        chatPreview,
        chatTime,
        renderFileChip,
        facultyLabel,
        roleLabel,
        isIncomingCall,
        escape,
        unreadNotifications,
        setPanel,
        openDialog,
        renderSocialPageNow,
        withBusy,
        root,
        setActiveChat,
        hidePortalMessengerChat,
        openPortalDirectChat,
        startPortalCall,
        acceptPortalCall,
        declinePortalCall,
        endPortalCall,
        togglePortalCallMic,
        togglePortalCallCamera,
        closeDialog,
        sendPortalMessage,
        deletePortalChatMessage,
        invalidateSocialRenderCache,
        activeChat
    });

    window.__kiuSocialDocsHooks = window.__kiuSocialDocsHooks || {};
    Object.assign(window.__kiuSocialDocsHooks, {
        state,
        currentUser,
        currentUserId,
        text,
        escape,
        accountById,
        displayName,
        avatar,
        accountSubtitle,
        facultyLabel,
        roleLabel,
        when,
        openDialog,
        closeDialog,
        addPortalSocialToast,
        setPortalSocialFlash,
        renderSocialPageNow
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

    function resetLostFoundDraft() {
        const runtime = state();
        runtime.ui.lostFoundEditId = '';
        runtime.ui.lostFoundTitle = '';
        runtime.ui.lostFoundDescription = '';
        runtime.ui.lostFoundCategory = '';
        runtime.ui.lostFoundLocation = '';
        runtime.ui.lostFoundDate = '';
        runtime.ui.lostFoundExpiresAt = '';
        runtime.ui.lostFoundFile = null;
    }

    function clearEventDraft() {
        const ui = state().ui;
        ui.eventEditId = '';
        ui.eventTitle = '';
        ui.eventDescription = '';
        ui.eventStartsAt = '';
        ui.eventEndsAt = '';
        ui.eventLocation = '';
        ui.eventOnlineLink = '';
        ui.eventIsOnline = false;
        ui.eventJoinMode = 'open';
        ui.eventCategory = 'social';
        ui.eventScope = '';
        ui.eventMaxSeats = '';
        ui.eventRecurring = false;
        ui.eventImageFile = null;
        ui.eventImageUrl = '';
    }

    function prefillEventEditDraft(event = {}) {
        const ui = state().ui;
        ui.eventEditId = text(event.id);
        ui.eventTitle = text(event.title || '');
        ui.eventDescription = text(event.description || '');
        ui.eventStartsAt = toDateTimeLocalValue(event.startsAt);
        ui.eventEndsAt = toDateTimeLocalValue(event.endsAt);
        ui.eventLocation = text(event.location || '');
        ui.eventOnlineLink = text(event.onlineLink || '');
        ui.eventIsOnline = Boolean(event.isOnline);
        ui.eventJoinMode = text(event.joinMode || 'open') || 'open';
        ui.eventCategory = text(event.category || 'social') || 'social';
        ui.eventMaxSeats = event.maxSeats || event.capacity ? String(event.maxSeats || event.capacity) : '';
        ui.eventRecurring = Boolean(event.isRecurring);
        ui.eventScope = `${text(event.scopeType || 'profile')}:${text(event.scopeId || currentUserId())}`;
        ui.eventImageFile = null;
        ui.eventImageUrl = text(event.imageUrl || '');
    }

    function eventCanManage(item = {}) {
        const userId = currentUserId();
        if (!userId || !item) return false;
        if (item.viewerCanEdit || item.viewerCanDelete) return true;
        if (text(item.createdById) === userId) return true;
        if (text(item.scopeType) === 'profile' && text(item.scopeId) === userId) return true;
        return false;
    }

    function renderContextTabs(activePanel) {
        const runtime = state();
        const activeHomeFilter = text(runtime.ui?.homeFeedFilter || 'all') || 'all';
        const activeCommunityTab = text(runtime.ui?.communityTab || 'people') || 'people';
        const activeEventsTab = text(runtime.ui?.eventsSubTab || 'student') || 'student';
        const activeMessagesFilter = text(runtime.ui?.messagesFilter || 'all') || 'all';
        const activeAlertsFilter = text(runtime.ui?.alertsFilter || 'all') || 'all';
        const activeProfileTab = text(runtime.ui?.profileTab || 'posts') || 'posts';

        const tabs = activePanel === 'feed'
            ? []
            : activePanel === 'community'
            ? []
            : activePanel === 'groups'
                ? []
            : activePanel === 'workspace'
                ? []
            : activePanel === 'projects'
                ? []
            : activePanel === 'pages'
                ? []
            : activePanel === 'events'
                ? []
            : activePanel === 'lost-and-found'
                ? []
            : activePanel === 'messages'
                    ? []
                    : activePanel === 'alerts'
                        ? [{
                            action: 'panel-messages',
                            tab: 'all',
                            label: 'Messages',
                            isActive: false
                        }]
: activePanel === 'profile'
                            ? [{
                                action: 'profile-tab-posts',
                                label: 'Posts',
                                isActive: activeProfileTab === 'posts'
                            }, {
                                action: 'profile-tab-friends',
                                label: 'Friends',
                                isActive: activeProfileTab === 'friends'
              }, {
                  action: 'profile-tab-following',
                  label: 'Following',
                  isActive: activeProfileTab === 'following'
              }, {
                  action: 'profile-tab-saved',
                  label: 'Saved',
                  isActive: activeProfileTab === 'saved'
              }, {
                  action: 'profile-tab-about',
                  label: 'About',
                  isActive: activeProfileTab === 'about'
              }]
                            : [{
                                action: 'panel-feed',
                                tab: 'all',
                                label: 'All',
                                isActive: activeHomeFilter === 'all'
                            }, {
                                action: 'panel-feed',
                                tab: 'following',
                                label: 'Following',
                                isActive: activeHomeFilter === 'following'
                            }, {
                                action: 'panel-feed',
                                tab: 'groups',
                                label: 'Groups',
                                isActive: activeHomeFilter === 'groups'
                            }, {
                                action: 'panel-feed',
                                tab: 'pages',
                                label: 'Pages',
                                isActive: activeHomeFilter === 'pages'
                            }, {
                                action: 'panel-feed',
                                tab: 'campus',
                                label: 'Campus',
                                isActive: activeHomeFilter === 'campus'
                            }];

        if (!tabs.length) return '';

        return `<div class="social-neo-tabs social-neo-tabs-context social-neo-topbar-tabs">
            ${tabs.map((tab) => {
                const attrs = [tab.action ? `data-action="${escape(tab.action)}"` : ''];
                if (tab.action === 'panel-feed' && tab.tab) attrs.push(`data-home-filter="${escape(tab.tab)}"`);
                if (tab.action === 'panel-community' && tab.tab) attrs.push(`data-community-tab="${escape(tab.tab)}"`);
                if (tab.action === 'panel-events' && tab.tab) attrs.push(`data-events-tab="${escape(tab.tab)}"`);
                if (tab.action === 'panel-messages' && tab.tab) attrs.push(`data-messages-filter="${escape(tab.tab)}"`);
                if (tab.action === 'panel-alerts' && tab.tab) attrs.push(`data-alerts-filter="${escape(tab.tab)}"`);
                if (tab.action === 'panel-groups' && tab.tab) attrs.push(`data-groups-tab="${escape(tab.tab)}"`);
                  if (tab.action === 'panel-pages' && tab.tab) attrs.push(`data-pages-tab="${escape(tab.tab)}"`);
                return `<button class="social-neo-tab social-neo-topbar-tab ${tab.isActive ? 'is-active' : ''}" type="button" aria-pressed="${tab.isActive ? 'true' : 'false'}" ${attrs.join(' ')}>${escape(tab.label)}</button>`;
            }).join('')}
        </div>`;
    }

    function connectionStatusFor(targetUserId) {
        const userId = currentUserId();
        const normalizedTargetId = text(targetUserId);
        const relationships = Array.isArray(state().social?.relationships) ? state().social.relationships : [];
        const incoming = relationships.find((relationship) =>
            text(relationship?.type).toLowerCase() === 'connection-request'
            && text(relationship?.status).toLowerCase() === 'pending'
            && text(relationship?.fromId) === normalizedTargetId
            && text(relationship?.toId) === userId
        );
        if (incoming) return { state: 'incoming', relationship: incoming };
        const outgoing = relationships.find((relationship) =>
            text(relationship?.type).toLowerCase() === 'connection-request'
            && text(relationship?.status).toLowerCase() === 'pending'
            && text(relationship?.fromId) === userId
            && text(relationship?.toId) === normalizedTargetId
        );
        if (outgoing) return { state: 'outgoing', relationship: outgoing };
        const connection = relationships.find((relationship) =>
            text(relationship?.type).toLowerCase() === 'connection'
            && text(relationship?.status).toLowerCase() === 'accepted'
            && [text(relationship?.fromId), text(relationship?.toId)].includes(userId)
            && [text(relationship?.fromId), text(relationship?.toId)].includes(normalizedTargetId)
        );
        if (connection) return { state: 'connected', relationship: connection };
        return { state: 'none', relationship: null };
    }

    function profileAccount(userId) {
        const normalizedId = text(userId);
        if (!normalizedId) return null;
        return accountById(normalizedId);
    }

    function profilePosts(userId) {
        const normalizedId = text(userId);
        if (!normalizedId) return [];
        return (Array.isArray(state().feed) ? state().feed : [])
            .filter((post) => text(post.authorUserId) === normalizedId);
    }

    function profileFriends(userId) {
        const normalizedId = text(userId);
        if (!normalizedId) return [];
        const relationships = Array.isArray(state().social?.relationships) ? state().social.relationships : [];
        const connectionIds = relationships
            .filter((rel) => {
                const type = text(rel.type).toLowerCase();
                const status = text(rel.status).toLowerCase();
                if (type !== 'connection' || status !== 'accepted') return false;
                return [text(rel.fromId), text(rel.toId)].includes(normalizedId);
            })
            .map((rel) => text(rel.fromId) === normalizedId ? text(rel.toId) : text(rel.fromId));
        return connectionIds.map((id) => accountById(id)).filter(Boolean);
    }

    function profileFriendCount(userId) {
        return profileFriends(userId).length;
    }

    function profilePostCount(userId) {
        return profilePosts(userId).length;
    }

    function profileBio(account) {
        return text(account?.bio || '');
    }

    function profileCover(account) {
        return text(account?.coverImage || '');
    }

    function profileEditable(account) {
        return text(account?.id) === currentUserId();
    }

    function profileFollowingItems(userId) {
        const normalizedId = text(userId);
        if (!normalizedId) return [];
        const runtime = state();
        const pages = (Array.isArray(runtime.social?.pages) ? runtime.social.pages : [])
            .filter((page) => normalizedId === currentUserId()
                ? Boolean(page?.isFollowing || page?.isManager)
                : text(page?.ownerUserId) === normalizedId || Array.isArray(page?.managerIds) && page.managerIds.some((id) => text(id) === normalizedId))
            .map((page) => ({
                type: 'page',
                id: text(page.id),
                name: text(page.name || 'Page'),
                subtitle: text(page.description || `${page.followerCount || 0} followers`)
            }));
        const groups = (Array.isArray(runtime.social?.groups) ? runtime.social.groups : [])
            .filter((group) => normalizedId === currentUserId()
                ? isJoinedGroup(group)
                : text(group?.ownerUserId) === normalizedId || Array.isArray(group?.managerIds) && group.managerIds.some((id) => text(id) === normalizedId))
            .map((group) => ({
                type: 'group',
                id: text(group.id),
                name: text(group.name || 'Group'),
                subtitle: text(group.description || `${group.memberCount || 0} members`)
            }));
        return [...pages, ...groups];
    }

    function profileFollowingCount(userId) {
        return profileFollowingItems(userId).length;
    }

    function mutualConnectionCount(targetUserId) {
        const normalizedTargetId = text(targetUserId);
        if (!normalizedTargetId || normalizedTargetId === currentUserId()) return 0;
        const mine = new Set(profileFriends(currentUserId()).map((friend) => text(friend?.id)));
        return profileFriends(normalizedTargetId).filter((friend) => mine.has(text(friend?.id))).length;
    }

    function pageParticipantIds(page) {
        return new Set([
            text(page?.ownerUserId),
            ...(Array.isArray(page?.adminIds) ? page.adminIds : []),
            ...(Array.isArray(page?.followerIds) ? page.followerIds : [])
        ].map((value) => text(value)).filter(Boolean));
    }

    function groupParticipantIds(group) {
        return new Set([
            text(group?.ownerUserId),
            ...(Array.isArray(group?.adminIds) ? group.adminIds : []),
            ...(Array.isArray(group?.memberIds) ? group.memberIds : []),
            ...(Array.isArray(group?.memberUserIds) ? group.memberUserIds : [])
        ].map((value) => text(value)).filter(Boolean));
    }

    function sharedGroupsWithUser(targetUserId) {
        const normalizedTargetId = text(targetUserId);
        if (!normalizedTargetId || normalizedTargetId === currentUserId()) return [];
        return (Array.isArray(state().social?.groups) ? state().social.groups : []).filter((group) => {
            const participants = groupParticipantIds(group);
            return participants.has(currentUserId()) && participants.has(normalizedTargetId);
        });
    }

    function sharedPagesWithUser(targetUserId) {
        const normalizedTargetId = text(targetUserId);
        if (!normalizedTargetId || normalizedTargetId === currentUserId()) return [];
        return (Array.isArray(state().social?.pages) ? state().social.pages : []).filter((page) => {
            const participants = pageParticipantIds(page);
            return participants.has(currentUserId()) && participants.has(normalizedTargetId);
        });
    }

    function personLatestPost(targetUserId) {
        const normalizedTargetId = text(targetUserId);
        return (Array.isArray(state().feed) ? state().feed : [])
            .filter((post) => text(post?.authorUserId) === normalizedTargetId)
            .sort((left, right) => String(right?.createdAt || '').localeCompare(String(left?.createdAt || '')))[0] || null;
    }

    function personActivityLabel(targetUserId) {
        const post = personLatestPost(targetUserId);
        if (!post?.createdAt) return 'New to social';
        const timestamp = new Date(post.createdAt).getTime();
        if (!Number.isFinite(timestamp)) return `Last posted ${when(post.createdAt)}`;
        const ageHours = Math.max(0, (Date.now() - timestamp) / 36e5);
        if (ageHours < 24) return 'Active today';
        if (ageHours < 24 * 7) return 'Active this week';
        return `Last posted ${when(post.createdAt)}`;
    }

    function personProfileCompleteness(account) {
        const checks = [
            text(account?.bio),
            text(account?.location),
            text(account?.website),
            Array.isArray(account?.interests) ? account.interests.length : text(account?.interests)
        ];
        const filled = checks.filter((value) => Array.isArray(value) ? value.length : Boolean(text(value))).length;
        return Math.round((filled / checks.length) * 100);
    }

    function isStaffAccount(account) {
        return ['professor', 'ta', 'admin', 'student_service'].includes(text(account?.role).toLowerCase());
    }

    function canPublishOfficialSurveys(account = currentUser()) {
        return isStaffAccount(account);
    }

    function personRoleBadges(account) {
        const badges = [];
        const role = text(account?.role).toLowerCase();
        if (role === 'professor') badges.push('Professor', 'Verified staff');
        else if (role === 'ta') badges.push('TA', 'Verified staff');
        else if (role === 'admin') badges.push('Admin', 'Verified staff');
        else if (role === 'student_service') badges.push('Student Service', 'Verified staff');
        const managesPage = (Array.isArray(state().social?.pages) ? state().social.pages : []).some((page) => pageParticipantIds(page).has(text(account?.id)) && (text(page?.ownerUserId) === text(account?.id) || (Array.isArray(page?.adminIds) ? page.adminIds : []).some((id) => text(id) === text(account?.id))));
        const managesGroup = (Array.isArray(state().social?.groups) ? state().social.groups : []).some((group) => groupParticipantIds(group).has(text(account?.id)) && (text(group?.ownerUserId) === text(account?.id) || (Array.isArray(group?.adminIds) ? group.adminIds : []).some((id) => text(id) === text(account?.id))));
        if (managesPage || managesGroup) badges.push('Club lead');
        return [...new Set(badges)];
    }

    function personSuggestionScore(account) {
        const sharedGroups = sharedGroupsWithUser(account?.id).length;
        const sharedPages = sharedPagesWithUser(account?.id).length;
        const mutuals = mutualConnectionCount(account?.id);
        const sameFaculty = text(account?.facultyCode || account?.faculty) === currentFacultyCode() ? 1 : 0;
        return (sharedGroups * 6) + (sharedPages * 4) + (mutuals * 3) + sameFaculty;
    }

    function personSuggestionReason(account) {
        const sharedGroups = sharedGroupsWithUser(account?.id);
        if (sharedGroups.length) return `${sharedGroups.length} shared group${sharedGroups.length === 1 ? '' : 's'}`;
        const sharedPages = sharedPagesWithUser(account?.id);
        if (sharedPages.length) return `${sharedPages.length} shared page${sharedPages.length === 1 ? '' : 's'}`;
        const mutuals = mutualConnectionCount(account?.id);
        if (mutuals) return `${mutuals} mutual connection${mutuals === 1 ? '' : 's'}`;
        if (text(account?.facultyCode || account?.faculty) === currentFacultyCode()) return 'Same faculty';
        return 'Campus suggestion';
    }

    function inviteEligibleGroups() {
        return (Array.isArray(state().social?.groups) ? state().social.groups : []).filter((group) => ['manager', 'member'].includes(text(group?.membershipState)));
    }

    function audienceBadge(post) {
        const audience = text(post?.audience || 'campus') || 'campus';
        const labels = {
            campus: 'Campus',
            faculty: 'Faculty',
            connections: 'Connections',
            group: 'Group members',
            page: 'Page followers'
        };
        return labels[audience] || 'Campus';
    }

    /**
     * Returns a human-readable context line explaining why a post appears in the feed.
     * Priority: group name → page name → connection status → same faculty → audience badge.
     * @param {Object} post  - The post object (scopeType, scopeName, etc.).
     * @param {Object} author - The resolved author account.
     * @returns {string} A short explanation like "Active in Study Group" or "Same faculty as you".
     */
    function feedReason(post, author) {
        const authorId = text(author?.id || post?.authorUserId);
        if (text(post?.scopeType) === 'group') return `Active in ${text(post?.scopeName || 'group')}`;
        if (text(post?.scopeType) === 'page') return `Update from ${text(post?.scopeName || 'page')}`;
        if (connectionStatusFor(authorId).state === 'connected') return 'From your campus network';
        if (text(author?.facultyCode || author?.faculty) && text(author?.facultyCode || author?.faculty) === currentFacultyCode()) return `Same faculty as you`;
        return `Visible to ${audienceBadge(post).toLowerCase()}`;
    }

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

    function renderCommentNode(comment, post, depth = 0, context = 'feed') {
        if (hasSocialFeedModule() && typeof window.renderCommentNode === 'function' && window.renderCommentNode !== renderCommentNode) {
            return window.renderCommentNode(comment, post, depth, context);
        }
        ensureSocialFeedModule().then(() => queueDeferredModuleRender('feed-module')).catch(() => null);
        return '';
    }

    function renderCommentThread(comments, post, context = 'feed') {
        if (hasSocialFeedModule() && typeof window.renderCommentThread === 'function' && window.renderCommentThread !== renderCommentThread) {
            return window.renderCommentThread(comments, post, context);
        }
        ensureSocialFeedModule().then(() => queueDeferredModuleRender('feed-module')).catch(() => null);
        return '';
    }


    /* ----- Surgical comment-thread DOM patching (flicker-free dialog updates) ----- */

    /** The comment <article> for a given id inside the open comments dialog. */
    function dialogCommentEl(commentId) {
        if (hasSocialFeedModule() && typeof window.dialogCommentEl === 'function' && window.dialogCommentEl !== dialogCommentEl) {
            return window.dialogCommentEl(commentId);
        }
        ensureSocialFeedModule().catch(() => null);
        return null;
    }
















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
    function patchCommentReactions(updatedPost, commentId) {
        if (hasSocialFeedModule() && typeof window.patchCommentReactions === 'function' && window.patchCommentReactions !== patchCommentReactions) {
            return window.patchCommentReactions(updatedPost, commentId);
        }
        ensureSocialFeedModule().catch(() => null);
        return false;
    }


    /** Window hook for runtime comment-react (dialog chips only — no center rebuild). */
    function patchCommentReactionsByIds(postId, commentId) {
        if (hasSocialFeedModule() && typeof window.patchCommentReactionsByIds === 'function' && window.patchCommentReactionsByIds !== patchCommentReactionsByIds) {
            return window.patchCommentReactionsByIds(postId, commentId);
        }
        ensureSocialFeedModule().catch(() => null);
        return false;
    }


    function patchPhotographyFeedReactions(postId) {
        if (hasSocialFeedModule() && typeof window.patchPhotographyFeedReactions === 'function' && window.patchPhotographyFeedReactions !== patchPhotographyFeedReactions) {
            return window.patchPhotographyFeedReactions(postId);
        }
        ensureSocialFeedModule().catch(() => null);
        return false;
    }


    function patchPostSaveButtons(postId) {
        if (hasSocialFeedModule() && typeof window.patchPostSaveButtons === 'function' && window.patchPostSaveButtons !== patchPostSaveButtons) {
            return window.patchPostSaveButtons(postId);
        }
        ensureSocialFeedModule().catch(() => null);
        return false;
    }


    function patchPhotographyFeedSave(postId) {
        if (hasSocialFeedModule() && typeof window.patchPhotographyFeedSave === 'function' && window.patchPhotographyFeedSave !== patchPhotographyFeedSave) {
            return window.patchPhotographyFeedSave(postId);
        }
        return patchPostSaveButtons(postId);
    }


    function patchPhotographyFollowButtons(userId, isFollowing) {
        const normalizedId = text(userId);
        if (!normalizedId) return false;
        const host = root();
        if (!host) return false;
        const buttons = host.querySelectorAll(`[data-action="photography-follow"][data-user-id="${CSS.escape(normalizedId)}"]`);
        if (!buttons.length) return false;
        const following = Boolean(isFollowing);
        buttons.forEach((btn) => {
            btn.classList.toggle('social-neo-btn-primary', following);
            btn.classList.toggle('social-neo-btn-ghost', !following);
            const sm = btn.classList.contains('social-neo-btn-sm');
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
    function patchPostReactions(postId) {
        if (hasSocialFeedModule() && typeof window.patchPostReactions === 'function' && window.patchPostReactions !== patchPostReactions) {
            return window.patchPostReactions(postId);
        }
        ensureSocialFeedModule().catch(() => null);
        return false;
    }


    function portfolioEditorFormRoot() {
        if (text(activeDialog()?.type || '') === 'portfolio-editor') {
            return socialDialogRegion()?.querySelector('.social-neo-dialog-body--portfolio-editor') || null;
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

    function patchPortfolioStartedPill(portfolio) {
        const root = portfolioEditorFormRoot();
        if (!root || typeof window.KiuPortfolioModel?.countStartedSections !== 'function') return false;
        const pill = root.querySelector('.portfolio-editor-head .social-neo-pill');
        if (!pill) return false;
        const doc = portfolio || ensureMyPortfolioDocument();
        const started = window.KiuPortfolioModel.countStartedSections(doc);
        const total = Array.isArray(doc?.sectionOrder) ? doc.sectionOrder.length : Object.keys(doc?.sections || {}).length;
        const strong = pill.querySelector('strong');
        const span = pill.querySelector('span');
        if (strong) strong.textContent = String(started);
        if (span) span.textContent = `of ${total} sections started`;
        return true;
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
        const activeStatus = text(eventItem.viewerRsvpStatus || '');
        buttons.forEach((btn) => {
            const status = text(btn.getAttribute('data-status'));
            const isActive = status === activeStatus;
            btn.classList.toggle('social-neo-btn-primary', isActive);
            btn.classList.toggle('social-neo-btn-ghost', !isActive);
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
            button.classList.toggle('social-neo-btn-primary', isFollowing);
            button.classList.toggle('social-neo-btn-ghost', !isFollowing);
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
    function openInlineReply(post, commentId, authorName) {
        if (hasSocialFeedModule() && typeof window.openInlineReply === 'function' && window.openInlineReply !== openInlineReply) {
            return window.openInlineReply(post, commentId, authorName);
        }
        ensureSocialFeedModule().catch(() => null);
    }


    /** Removes the inline reply composer under a comment. */
    function closeInlineReply(commentId) {
        if (hasSocialFeedModule() && typeof window.closeInlineReply === 'function' && window.closeInlineReply !== closeInlineReply) {
            return window.closeInlineReply(commentId);
        }
        ensureSocialFeedModule().catch(() => null);
    }


    /** Appends a freshly-posted reply under its parent and updates the reply counter. */
    function appendReplyNode(updatedPost, parentCommentId) {
        if (hasSocialFeedModule() && typeof window.appendReplyNode === 'function' && window.appendReplyNode !== appendReplyNode) {
            return window.appendReplyNode(updatedPost, parentCommentId);
        }
        ensureSocialFeedModule().catch(() => null);
    }


    /** Updates the "N comments" header count in the open comments dialog. */
    function patchCommentDialogCount(updatedPost) {
        if (hasSocialFeedModule() && typeof window.patchCommentDialogCount === 'function' && window.patchCommentDialogCount !== patchCommentDialogCount) {
            return window.patchCommentDialogCount(updatedPost);
        }
        ensureSocialFeedModule().catch(() => null);
    }


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
    function relayoutCommentTrunks(scope) {
        if (hasSocialFeedModule() && typeof window.relayoutCommentTrunks === 'function' && window.relayoutCommentTrunks !== relayoutCommentTrunks) {
            return window.relayoutCommentTrunks(scope);
        }
        ensureSocialFeedModule().catch(() => null);
    }

    /**
     * Recursively searches a comment tree for a comment by ID.
     * Used to locate reply targets and react to nested comments.
     * @param {Array<Object>} comments - Comments array to search.
     * @param {string} commentId - Target comment ID.
     * @returns {Object|null} The matched comment or null.
     */
    function findCommentInThread(comments, commentId) {
        if (hasSocialFeedModule() && typeof window.findCommentInThread === 'function' && window.findCommentInThread !== findCommentInThread) {
            return window.findCommentInThread(comments, commentId);
        }
        ensureSocialFeedModule().catch(() => null);
        return null;
    }


    const SOCIAL_OVERLAY_PORTAL_ID = 'social-neo-overlay-portal';
    const SOCIAL_OVERLAY_REGION_IDS = [
        'social-neo-dialog-region',
        'social-neo-story-viewer-region',
        'social-neo-story-composer-region'
    ];
    const SOCIAL_OVERLAY_SURFACE_SELECTOR = '.social-neo-dialog-backdrop, .social-neo-story-viewer, .social-neo-story-composer';

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

    function clearStaleSocialOverlayDom() {
        SOCIAL_OVERLAY_REGION_IDS.forEach((regionId) => {
            const node = document.getElementById(regionId);
            if (!node?.querySelector(SOCIAL_OVERLAY_SURFACE_SELECTOR)) return;
            node.innerHTML = '';
            delete node.__kiuLastMarkup;
        });
        syncOverlayPortalVisibility();
    }

    function pruneStaleSocialOverlayState() {
        const runtime = state();
        if (!runtime?.ui) return;

        const hasDialogSurface = Boolean(document.getElementById('social-neo-dialog-region')?.querySelector('.social-neo-dialog-backdrop'));
        const hasStoryViewer = Boolean(document.getElementById('social-neo-story-viewer-region')?.querySelector('.social-neo-story-viewer'));
        const hasStoryComposer = Boolean(document.getElementById('social-neo-story-composer-region')?.querySelector('.social-neo-story-composer'));

        if (runtime.ui.socialDialog && !hasDialogSurface) {
            runtime.ui.socialDialog = null;
            runtime.ui.coverImageFile = null;
        }
        if (runtime.ui.storyViewerOpen && !hasStoryViewer) {
            runtime.ui.storyViewerOpen = false;
            runtime.ui.storyViewerIndex = 0;
        }
        if (runtime.ui.storyComposerOpen && !hasStoryComposer) {
            runtime.ui.storyComposerOpen = false;
        }
    }

    function socialInteractionContains(node) {
        if (!node) return false;
        const rootHost = root();
        const portal = document.getElementById(SOCIAL_OVERLAY_PORTAL_ID);
        return Boolean(
            (rootHost && rootHost.contains(node))
            || (portal && portal.contains(node))
            || node.closest?.('[data-project-task-graph-context-menu]')
        );
    }

    function socialDialogRegion() {
        return document.getElementById('social-neo-dialog-region');
    }

    function photographyUploadForm() {
        return socialDialogRegion()?.querySelector('form[data-form="photography-upload"]') || null;
    }

    function normalizeSocialOverlayDialogRegion() {
        const portal = document.getElementById(SOCIAL_OVERLAY_PORTAL_ID);
        const regionId = 'social-neo-dialog-region';
        const regions = Array.from(document.querySelectorAll(`[id="${regionId}"]`));
        const canonical = (portal && portal.querySelector(`[id="${regionId}"]`)) || regions[0] || null;
        regions.forEach((region) => {
            if (region !== canonical) region.remove();
        });
        if (canonical) {
            const backdrops = canonical.querySelectorAll(':scope > .social-neo-dialog-backdrop');
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
            dialog: document.getElementById('social-neo-dialog-region'),
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
        const hasContent = SOCIAL_OVERLAY_REGION_IDS.some((regionId) => {
            const node = document.getElementById(regionId);
            return Boolean(text(node?.innerHTML || '').trim());
        });
        portal.hidden = !hasContent;
        portal.setAttribute('aria-hidden', hasContent ? 'false' : 'true');
        if (hasContent) scheduleSocialOverlayTransparencyRefresh();
    }

    function syncSocialOverlayLock() {
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
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.left = '0';
            document.body.style.right = '0';
            document.body.style.width = '100%';
            return;
        }

        if (!stateOpen) {
            if (socialOverlayPortalHasContent()) {
                clearStaleSocialOverlayDom();
            }
            if (!isLocked && !socialOverlayLockArtifactsPresent()) return;

            const scrollY = Number(document.body.dataset.socialOverlayScrollY || 0);
            const centerScrollY = Number(document.body.dataset.socialOverlayCenterScrollY || 0);
            clearSocialOverlayLockArtifacts();
            if (isLocked) {
                if (socialScrollLockActive()) {
                    scrollSocialCenterTo(centerScrollY, 'auto');
                } else {
                    window.scrollTo(0, scrollY);
                }
            }
        }
    }

    function focusSocialDialog() {
        const dialogRegion = document.getElementById('social-neo-dialog-region');
        if (!dialogRegion) return;
        // Prefer the top-most overlay card (health child, then graph child, then any).
        const card = dialogRegion.querySelector('.social-project-health-child-slot .social-neo-dialog-card')
            || dialogRegion.querySelector('.social-project-task-graph-child-slot .social-neo-dialog-card')
            || dialogRegion.querySelector('.social-neo-dialog-card');
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
        'post-compose-attach'
    ]);

    function openDialog(type, payload = {}) {
        if (type === 'group-leave') {
            state().ui.groupLeaveStep = 1;
        }
        const ui = state().ui;
        const currentDialog = ui.socialDialog || null;
        if (type === 'project-task-graph') {
            ui.projectTaskGraphStackAnchor = { type, ...payload };
        }
        if (currentDialog?.type === 'project-health' && PROJECT_HEALTH_OVERLAY_DIALOGS.has(type)) {
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
                && ui.previousDialog?.type === 'project-task-graph'
                && PROJECT_TASK_GRAPH_STACKED_DIALOGS.has(currentDialog?.type);
            if (!keepGraphAnchor) ui.previousDialog = null;
        }
        ui.socialDialog = { type, ...payload };
        const activePanel = text(state().ui?.activePanel || '');
        if (workspaceDialogKeepsCenter(type) && ['projects', 'workspace'].includes(activePanel)) {
            renderDialogOnlyNow();
        } else {
            renderSocialPageNow(`dialog-${type}`);
        }
        ensureSocialOverlayPortal();
        bindOverlayPortalEvents();
        ensurePhotographyUploadFileSink();
        bindPhotographyUploadDialogFileInput();
        window.requestAnimationFrame(() => {
            syncSocialOverlayLock();
            syncOverlayPortalVisibility();
            focusSocialDialog();
            if (type === 'post-comments' || type === 'photography-comments') relayoutCommentTrunks();
            if (type === 'survey-results') syncSurveyResultsDialog();
        });
    }

    function syncSurveyResultsDialog(scope = root()) {
        const host = scope || document;
        const rail = host.querySelector?.('.social-neo-dialog-body--survey-results[data-lux-scroll-rail]')
            || document.querySelector('.social-neo-dialog-body--survey-results[data-lux-scroll-rail]');
        if (!rail) return;
        if (typeof window.initLuxScrollRail === 'function') {
            window.initLuxScrollRail(rail, { shellSelector: '.social-neo-dialog-body--survey-results[data-lux-scroll-rail]' });
        } else if (typeof window.syncLuxScrollRail === 'function') {
            window.syncLuxScrollRail(rail, { shellSelector: '.social-neo-dialog-body--survey-results[data-lux-scroll-rail]' });
        }
    }

    function closeDialog() {
        const ui = state().ui;
        if (!ui.socialDialog) return;
        const closingType = text(ui.socialDialog?.type || '');
        const closingProjectId = text(ui.socialDialog?.projectId || ui.activeProjectId || '');
        const parentDialog = ui.previousDialog || null;
        if (parentDialog?.type === 'project-task-graph' && PROJECT_TASK_GRAPH_STACKED_DIALOGS.has(closingType)) {
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
        ui.socialDialog = null;
        ui.previousDialog = null;
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
        if (workspaceDialogKeepsCenter(closingType) && ['projects', 'workspace'].includes(activePanel)) {
            renderDialogOnlyNow();
        } else {
            renderSocialPageNow('dialog-close');
        }
        window.requestAnimationFrame(() => syncSocialOverlayLock());
    }

    function restorePreviousDialog() {
        const ui = state().ui;
        const parent = ui.previousDialog || null;
        if (!parent || !parent.type) {
            ui.previousDialog = null;
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
        const activePanel = text(ui.activePanel || '');
        const parentType = text(clean.type || '');
        if ((parentType === 'project-task-graph' || parentType === 'project-health' || workspaceDialogKeepsCenter(parentType))
            && ['projects', 'workspace'].includes(activePanel)) {
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

    function setPanel(panel) {
        const runtime = state();
        const normalizedPanel = text(panel).toLowerCase() === 'lost-found' ? 'lost-and-found' : text(panel);
        const nextPanel = ['feed', 'community', 'groups', 'workspace', 'projects', 'pages', 'events', 'surveys', 'photography', 'lost-and-found', 'messages', 'alerts', 'profile'].includes(normalizedPanel) ? normalizedPanel : 'feed';
        const panelChanged = runtime.ui.activePanel !== nextPanel;
        const drawerChanged = runtime.ui.shellDrawerOpen !== false;
        const workspaceNavChanged = runtime.ui.workspaceNavOpen !== false;
        if (runtime.ui.workspaceNavOpen && (panelChanged || drawerChanged)) {
            return closeSocialWorkspaceNavAnimated(() => {
                finalizeSetPanel(nextPanel, panelChanged, drawerChanged);
            });
        }
        finalizeSetPanel(nextPanel, panelChanged, drawerChanged, workspaceNavChanged);
    }

    function finalizeSetPanel(nextPanel, panelChanged, drawerChanged, workspaceNavChanged = false) {
        const runtime = state();
        runtime.ui.activePanel = nextPanel;
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
        'photography',
        'lost-and-found',
        'messages',
        'alerts',
        'pages',
        'profile',
    ]);

    function isSocialTopbarSkippedPanel(panel) {
        return SOCIAL_TOPBAR_SKIPPED_PANELS.has(text(panel || ''));
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
            if (!activeDialog() && socialOverlayLockArtifactsPresent()) {
                clearSocialOverlayLockArtifacts();
            }
            syncSocialVisualViewport();
            bindSocialCenterWheelForward();
        } else {
            document.documentElement.style.removeProperty('--social-visual-height');
            clearSocialCenterScrollBounds(host);
            if (!activeDialog() && socialOverlayLockArtifactsPresent()) {
                clearSocialOverlayLockArtifacts();
            }
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

    function captureInteractionState(host) {
        const active = document.activeElement;
        const activeInHost = Boolean(active && host?.contains(active));
        const layoutScrollLock = socialScrollLockActive();
        const centerScroller = getSocialCenterScroller(host);
        const scrollSelectors = layoutScrollLock
            ? [
                '#social-neo-center-region',
                '.social-neo-workspace-nav',
                '.social-neo-thread-messages',
                '.social-neo-messages__thread-scroll',
                '.social-neo-chat-items',
                '.social-neo-chat-list',
                '.sn-alerts-list',
                '.social-neo-stories',
                '.social-neo-events-content',
                '.social-project-scroll-list'
            ]
            : [
                '.social-neo-thread-messages',
                '.social-neo-messages__thread-scroll',
                '.social-neo-chat-items',
                '.social-neo-chat-list',
                '.sn-alerts-list',
                '.social-neo-center',
                '#social-neo-center-region',
                '.social-neo-stories',
                '.social-neo-directory',
                '.social-neo-events-content'
            ];
        const anchorUserId = text(host?.__kiuInteractionAnchorUserId || '');
        let anchorDocY = null;
        let anchorCenterY = null;
        if (anchorUserId) {
            const anchorNode = interactionAnchorNode(host, anchorUserId);
            if (anchorNode) {
                if (layoutScrollLock && centerScroller) {
                    const scrollerRect = centerScroller.getBoundingClientRect();
                    anchorCenterY = centerScroller.scrollTop + anchorNode.getBoundingClientRect().top - scrollerRect.top;
                } else {
                    anchorDocY = (window.scrollY || 0) + anchorNode.getBoundingClientRect().top;
                }
            }
        }
        return {
            windowX: window.scrollX || 0,
            windowY: window.scrollY || 0,
            centerScrollY: centerScroller?.scrollTop || 0,
            activeSelector: activeInHost ? focusRestoreSelector(active) : '',
            selectionStart: activeInHost && typeof active.selectionStart === 'number' ? active.selectionStart : null,
            selectionEnd: activeInHost && typeof active.selectionEnd === 'number' ? active.selectionEnd : null,
            anchorUserId,
            anchorDocY,
            anchorCenterY,
            layoutScrollLock,
            deferWindowScroll: layoutScrollLock || Boolean(anchorUserId),
            scrolls: scrollSelectors.flatMap((selector) => Array.from(host?.querySelectorAll(selector) || []).map((node, index) => ({
                selector,
                index,
                top: node.scrollTop || 0,
                left: node.scrollLeft || 0
            })))
        };
    }

    function applyCenterScrollRestore(host, snapshot) {
        if (!snapshot?.layoutScrollLock || isSocialInboxPanel(host)) return;
        const scroller = getSocialCenterScroller(host);
        if (!scroller) return;
        let targetTop = Number.isFinite(snapshot.centerScrollY) ? snapshot.centerScrollY : scroller.scrollTop;
        if (snapshot.anchorUserId && Number.isFinite(snapshot.anchorCenterY)) {
            const anchorNode = interactionAnchorNode(host, snapshot.anchorUserId);
            if (anchorNode) {
                const scrollerRect = scroller.getBoundingClientRect();
                const newCenterY = scroller.scrollTop + anchorNode.getBoundingClientRect().top - scrollerRect.top;
                targetTop = Math.max(0, targetTop + (snapshot.anchorCenterY - newCenterY));
            }
        }
        scroller.scrollTop = targetTop;
    }

    function applyWindowScrollRestore(host, snapshot) {
        if (!snapshot || snapshot.layoutScrollLock) {
            applyCenterScrollRestore(host, snapshot);
            return;
        }
        if (!Number.isFinite(snapshot.windowY)) return;
        let targetY = snapshot.windowY || 0;
        if (snapshot.anchorUserId && Number.isFinite(snapshot.anchorDocY) && host) {
            const anchorNode = interactionAnchorNode(host, snapshot.anchorUserId);
            if (anchorNode) {
                const newDocY = (window.scrollY || 0) + anchorNode.getBoundingClientRect().top;
                targetY = Math.max(0, targetY + (snapshot.anchorDocY - newDocY));
            }
        }
        try { window.scrollTo(snapshot.windowX || 0, targetY); } catch (error) {}
    }

    function restoreInteractionState(host, snapshot, options = {}) {
        if (!host || !snapshot) return;
        const skipCenterForInbox = isSocialInboxPanel(host);
        if (!options.windowOnly) {
            snapshot.scrolls?.forEach((item) => {
                if ((options.skipCenterScroll || skipCenterForInbox)
                    && (item.selector === '#social-neo-center-region' || item.selector === '.social-neo-center')) {
                    return;
                }
                const node = host.querySelectorAll(item.selector)?.[item.index];
                if (!node) return;
                node.scrollTop = item.top || 0;
                node.scrollLeft = item.left || 0;
            });
            if (snapshot.activeSelector) {
                const node = host.querySelector(snapshot.activeSelector);
                if (node && typeof node.focus === 'function') {
                    try {
                        node.focus({ preventScroll: true });
                        if (typeof node.setSelectionRange === 'function' && snapshot.selectionStart !== null) {
                            node.setSelectionRange(snapshot.selectionStart, snapshot.selectionEnd ?? snapshot.selectionStart);
                        }
                    } catch (error) {}
                }
            }
        }
        if (!options.skipWindow) applyWindowScrollRestore(host, snapshot);
    }

    function clearSocialCenterScrollBounds(host = root()) {
        const center = getSocialCenterScroller(host);
        if (!center) return;
        center.style.removeProperty('max-height');
        center.style.removeProperty('height');
        center.style.removeProperty('min-height');
        center.style.removeProperty('overflow-y');
        delete center.dataset.socialCenterBounded;
    }

    function measureSocialCenterBottom(center, node) {
        if (!center || !node) return 0;
        const centerTop = center.getBoundingClientRect().top;
        const scrollTop = center.scrollTop || 0;
        const rect = node.getBoundingClientRect();
        return Math.ceil(rect.bottom - centerTop + scrollTop);
    }

    function getSocialCenterContentExtent(center) {
        if (!center) return 0;
        const bump = (node) => {
            if (!node) return;
            extent = Math.max(extent, measureSocialCenterBottom(center, node), node.scrollHeight || 0, node.offsetHeight || 0);
        };
        let extent = 0;
        bump(center.firstElementChild);
        center.querySelectorAll(
            '[class$="-shell"], [class$="-listings"], [class$="-hub-body"], [class$="-hub-section"], [class$="-layout"], [class$="-grid"], .is-merged, .social-neo-workspace-hub-section, .social-project-card-new, .social-project-row, .social-project-tab-shell, .social-portfolio-feed, #social-project-tab-panel, .social-project-tab-pane, .social-project-overview-columns, .social-project-overview-slot, .social-project-overview-slot__scroll, .social-project-scroll-list, .social-neo-feed-header-card, .social-neo-event-feature, .social-photo-content-stage, .social-photo-grid-tile, .social-neo-survey-listings, .social-neo-survey-card, .social-neo-surveys-hero, .social-neo-groups-hero, .social-neo-lost-found-hero, .social-neo-community-hero, .social-neo-pages-hero, .social-neo-events-hero, .social-neo-workspace-hero, .social-neo-portfolio-hero'
        ).forEach(bump);
        return extent;
    }

    function getSocialCenterViewportHeight(center, shell) {
        if (!center) return 0;
        const scrollBudget = getSocialCenterScrollBudget(center, shell || center.closest('.social-neo-shell'));
        return center.dataset.socialCenterBounded === '1'
            ? center.clientHeight
            : Math.min(center.clientHeight, scrollBudget || center.clientHeight);
    }

    function socialCenterHasLiveScrollRoom(center, contentH = 0) {
        if (!center) return false;
        const viewportH = getSocialCenterViewportHeight(center);
        const measured = contentH || getSocialCenterContentScrollHeight(center);
        return measured > center.scrollTop + viewportH + 1
            || center.scrollHeight > center.scrollTop + viewportH + 1;
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

    function getSocialCenterContentScrollHeight(center) {
        if (!center) return 0;
        if (center.querySelector('.social-neo-messages') || center.querySelector('.sn-alerts-panel')) return center.clientHeight;
        const contentRoot = center.firstElementChild;
        const directory = center.querySelector('.social-neo-directory');
        const scrollItems = center.querySelectorAll(
            '.social-neo-directory-item, .social-neo-post-card, .social-neo-page-card, .social-neo-community-card, .social-neo-entity-card, .social-neo-event-card, .social-neo-event-feature, .social-neo-group-card, .social-neo-friend-chip, .social-project-card, .social-project-card-new, .social-project-row, .social-project-task-card, .spt-desk-card, .spt-desk-package, .social-project-activity-item, .social-project-detail-hero, .social-project-dashboard-strip, .social-project-overview-columns, .social-project-overview-slot, .social-project-overview-col, .social-project-graph-preview-card, .social-project-my-tasks-card, .social-project-health-card, .social-project-tab-panel, .social-project-tab-shell, .social-project-metric-card, .social-project-ring-card, .social-neo-workspace-hub-section, .social-photo-content-stage, .social-photo-grid-tile, .social-neo-surveys-hero, .social-neo-survey-card, .social-neo-groups-hero, .social-neo-lost-found-hero, .social-neo-portfolio-hero, .social-portfolio-card'
        );
        let itemsHeight = 0;
        let leafExtent = 0;
        let mergedExtent = 0;
        scrollItems.forEach((item) => {
            itemsHeight += item.getBoundingClientRect().height;
            leafExtent = Math.max(leafExtent, measureSocialCenterBottom(center, item));
        });
        center.querySelectorAll('.is-merged, [class$="-listings"], .social-neo-survey-card, .social-project-card-new, .social-project-row').forEach((node) => {
            mergedExtent = Math.max(mergedExtent, measureSocialCenterBottom(center, node));
        });
        const contentBottom = measureSocialCenterBottom(center, contentRoot);
        const directoryExtent = directory
            ? directory.offsetTop + (itemsHeight || directory.offsetHeight)
            : 0;
        const panelShell = center.querySelector('[class$="-shell"], .social-portfolio-feed');
        const panelExtent = getSocialCenterContentExtent(center);
        return Math.max(
            center.scrollHeight || 0,
            contentRoot?.offsetHeight || 0,
            contentRoot?.scrollHeight || 0,
            directory?.scrollHeight || 0,
            directoryExtent,
            contentBottom,
            leafExtent,
            mergedExtent,
            panelShell?.scrollHeight || 0,
            panelShell?.offsetHeight || 0,
            panelExtent
        );
    }

    function getSocialCenterMaxScroll(center, shell) {
        if (!center) return 0;
        void center.offsetHeight;
        const shellNode = shell || center.closest('.social-neo-shell');
        const contentH = getSocialCenterContentScrollHeight(center);
        const scrollBudget = getSocialCenterScrollBudget(center, shellNode);
        const viewportH = getSocialCenterViewportHeight(center, shellNode);
        let maxScroll = Math.max(0, Math.max(center.scrollHeight, contentH) - viewportH);
        if (maxScroll <= 1 && centerCanScroll(center, shell)) {
            maxScroll = Math.max(
                maxScroll,
                contentH - viewportH,
                contentH - scrollBudget,
                center.scrollHeight - viewportH
            );
        }
        return Math.max(0, maxScroll);
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
        const selector = '[data-event-desc-rail]';
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
            return {
                root: rootNode,
                flash: rootNode.querySelector('#social-neo-flash-region'),
                topbar: rootNode.querySelector('#social-neo-topbar-region'),
                command: rootNode.querySelector('#social-neo-command-region'),
                workspaceNav: rootNode.querySelector('#social-neo-workspace-nav-region'),
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
                <div class="social-neo-shell">
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

    function setSocialRegionMarkup(node, markup) {
        if (!node) return;
        if (node.id === 'social-neo-dialog-region') normalizeSocialOverlayDialogRegion();
        const nextMarkup = String(markup || '');
        if (node.__kiuLastMarkup === nextMarkup) return;
        node.innerHTML = nextMarkup;
        node.__kiuLastMarkup = nextMarkup;
    }

    function invalidateSocialRenderCache({ center = true } = {}) {
        if (typeof invalidatePortalSocialRenderCache === 'function') {
            invalidatePortalSocialRenderCache({ center });
            return;
        }
        const host = root();
        if (host) host.__kiuLastRenderSignature = '';
        if (center) {
            const centerEl = document.getElementById('social-neo-center-region');
            if (centerEl) delete centerEl.__kiuLastMarkup;
        }
    }

    function queueDeferredModuleRender(reason) {
        invalidateSocialRenderCache({ center: true });
        const host = root();
        if (host) host.__kiuForceCenterOnly = true;
        renderSocialPageNow(reason);
    }

    function enhanceSocialAccessibility(host) {
        if (!host) return;
        host.setAttribute('aria-live', 'polite');
        host.setAttribute('aria-busy', 'false');
        host.querySelectorAll('.social-neo-section-command').forEach((node) => {
            node.setAttribute('role', 'region');
            if (!node.getAttribute('aria-label')) {
                const title = text(node.querySelector('h2')?.textContent || node.getAttribute('data-section-command') || 'Social section');
                node.setAttribute('aria-label', title);
            }
        });
        const accessibilityRoots = [host, document.getElementById(SOCIAL_OVERLAY_PORTAL_ID)].filter(Boolean);
        accessibilityRoots.forEach((accessibilityHost) => {
            accessibilityHost.querySelectorAll('.social-neo-dialog-backdrop').forEach((node) => {
                node.setAttribute('role', 'dialog');
                node.setAttribute('aria-modal', 'true');
                if (!node.getAttribute('aria-label')) {
                    node.setAttribute('aria-label', text(node.querySelector('strong')?.textContent || 'Social dialog'));
                }
            });
        });
        host.querySelectorAll('button').forEach((button) => {
            const visibleLabel = text(button.textContent || '');
            if (visibleLabel || button.getAttribute('aria-label')) return;
            const action = text(button.getAttribute('data-action') || 'Action').replace(/[-_]+/g, ' ');
            button.setAttribute('aria-label', action);
        });
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

    function filePreview(file) {
        if (!file) return '';
        if (isImage(file)) {
            const src = fileUrl(file);
            if (src) {
                return `
                    <div class="social-neo-media">
                        <img src="${escape(src)}" alt="${escape(text(file.name || 'Image'))}">
                    </div>
                `;
            }
        }
        const href = fileUrl(file);
        return `
            <div class="social-neo-file">
                <i class="fas fa-paperclip"></i>
                <div>
                    <strong>${escape(text(file.name || 'Attachment'))}</strong>
                    <span>${escape(text(file.type || 'File'))}</span>
                </div>
                ${href ? `<a class="social-neo-link-btn" href="${escape(href)}" target="_blank" rel="noopener">Open</a>` : ''}
            </div>
        `;
    }

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

    function normalizeComposerEntityLinks(value) {
        const seen = new Set();
        const links = [];
        (Array.isArray(value) ? value : []).forEach((item) => {
            if (links.length >= POST_COMPOSE_ENTITY_LINK_MAX) return;
            const type = text(item?.type || '').toLowerCase();
            const id = text(item?.id || '');
            if (!type || !id) return;
            const key = `${type}:${id}`;
            if (seen.has(key)) return;
            seen.add(key);
            links.push({ type, id });
        });
        return links;
    }

    function postEntityLinks(post) {
        const links = normalizeComposerEntityLinks(post?.entityLinks);
        const surveyId = text(post?.linkedSurveyId || '');
        if (surveyId && !links.some((link) => link.type === 'survey' && link.id === surveyId)) {
            links.push({ type: 'survey', id: surveyId });
        }
        return links.slice(0, POST_COMPOSE_ENTITY_LINK_MAX);
    }

    function entityLinkSectionLabel(type) {
        return POST_COMPOSE_ATTACH_SECTIONS.find((section) => section.id === type)?.label || type;
    }

    function entityLinkIcon(type) {
        return POST_COMPOSE_ATTACH_SECTIONS.find((section) => section.id === type)?.icon || 'fa-link';
    }

    function resolveEntityLinkMeta(link) {
        const type = text(link?.type || '').toLowerCase();
        const id = text(link?.id || '');
        const social = state().social || {};
        const me = currentUserId();
        if (type === 'group') {
            const group = (Array.isArray(social.groups) ? social.groups : []).find((item) => text(item?.id) === id);
            return {
                type,
                id,
                title: text(group?.name || 'Group'),
                subtitle: group ? (text(group.ownerUserId) === me || group.isManager ? 'Your group' : 'Campus group') : 'Group',
                icon: entityLinkIcon(type),
                sectionLabel: entityLinkSectionLabel(type)
            };
        }
        if (type === 'project') {
            const project = (Array.isArray(social.projects) ? social.projects : []).find((item) => text(item?.id) === id);
            return {
                type,
                id,
                title: text(project?.name || project?.title || 'Project'),
                subtitle: project ? (text(project.ownerUserId) === me ? 'Your project' : 'Campus project') : 'Project',
                icon: entityLinkIcon(type),
                sectionLabel: entityLinkSectionLabel(type)
            };
        }
        if (type === 'portfolio') {
            const entry = portfolioEntriesForViewer().find((item) => text(item?.id) === id)
                || (Array.isArray(social.portfolios) ? social.portfolios : []).find((item) => text(item?.userId) === id || text(item?.id) === id);
            const title = text(entry?.title || entry?.name || entry?.basics?.name || 'Portfolio');
            return {
                type,
                id,
                title,
                subtitle: text(entry?.userId || entry?.ownerUserId) === me ? 'Your portfolio' : 'Campus portfolio',
                icon: entityLinkIcon(type),
                sectionLabel: entityLinkSectionLabel(type)
            };
        }
        if (type === 'page') {
            const page = (Array.isArray(social.pages) ? social.pages : []).find((item) => text(item?.id) === id);
            return {
                type,
                id,
                title: text(page?.name || 'Page'),
                subtitle: page && (isManagedPage(page) || text(page.ownerUserId) === me) ? 'Your page' : 'Campus page',
                icon: entityLinkIcon(type),
                sectionLabel: entityLinkSectionLabel(type)
            };
        }
        if (type === 'event') {
            const event = (Array.isArray(social.events) ? social.events : []).find((item) => text(item?.id) === id);
            return {
                type,
                id,
                title: text(event?.title || 'Event'),
                subtitle: text(event?.createdById) === me ? 'Your event' : 'Campus event',
                icon: entityLinkIcon(type),
                sectionLabel: entityLinkSectionLabel(type)
            };
        }
        if (type === 'survey') {
            const survey = (Array.isArray(social.surveys) ? social.surveys : []).find((item) => text(item?.id) === id);
            return {
                type,
                id,
                title: text(survey?.title || 'Survey'),
                subtitle: text(survey?.createdById) === me || survey?.viewerCanManage ? 'Your survey' : 'Campus survey',
                icon: entityLinkIcon(type),
                sectionLabel: entityLinkSectionLabel(type)
            };
        }
        if (type === 'photo') {
            const photo = photographyPosts().find((item) => text(item?.id) === id);
            return {
                type,
                id,
                title: text(photo?.body || photo?.photoMeta?.caption || 'Exposé photo').slice(0, 80) || 'Exposé photo',
                subtitle: text(photo?.authorUserId) === me ? 'Your photo' : 'Campus photo',
                icon: entityLinkIcon(type),
                sectionLabel: entityLinkSectionLabel(type)
            };
        }
        if (type === 'lost-found') {
            const item = (Array.isArray(social.lostFoundItems) ? social.lostFoundItems : []).find((row) => text(row?.id) === id);
            return {
                type,
                id,
                title: text(item?.title || 'Lost & Found item'),
                subtitle: text(item?.authorUserId || item?.createdById) === me ? 'Your listing' : 'Campus listing',
                icon: entityLinkIcon(type),
                sectionLabel: entityLinkSectionLabel(type)
            };
        }
        return {
            type,
            id,
            title: id || 'Attachment',
            subtitle: entityLinkSectionLabel(type),
            icon: entityLinkIcon(type),
            sectionLabel: entityLinkSectionLabel(type)
        };
    }

    function navigateToEntity(type, id) {
        if (!type || !id) return;
        if (type === 'group') {
            setPanel('groups');
            if (findSocialGroupById(id)) return openDialog('group-detail', { groupId: id });
            state().ui.groupsTab = 'joined';
            return renderSocialPageNow('panel-groups');
        }
        if (type === 'project') {
            state().ui.activeProjectId = id;
            state().ui.projectTab = 'overview';
            clearProjectTabPaneCache(id);
            state().ui.activePanel = 'workspace';
            state().ui.shellDrawerOpen = false;
            try { localStorage.setItem(PANEL_KEY, 'workspace'); } catch (error) {}
            return renderSocialPageNow('project-open');
        }
        if (type === 'portfolio') {
            const entry = portfolioEntriesForViewer().find((item) => text(item?.id) === id);
            const userId = text(entry?.userId || entry?.ownerUserId || id);
            if (userId === currentUserId()) {
                setPanel('projects');
                state().ui.portfolioPanelTab = 'mine';
                return renderSocialPageNow('profile-portfolio-open');
            }
            state().ui.activePortfolioUserId = userId;
            setPanel('projects');
            state().ui.portfolioPanelTab = 'discover';
            return renderSocialPageNow('portfolio-doc-open');
        }
        if (type === 'page') {
            state().ui.activePageProfileId = id;
            setPanel('pages');
            return renderSocialPageNow('page-open-profile');
        }
        if (type === 'event') {
            state().ui.focusEventId = id;
            setPanel('events');
            return renderSocialPageNow('panel-events');
        }
        if (type === 'survey') {
            const runtime = state();
            runtime.ui.surveyTakingId = id;
            runtime.ui.surveyResultsId = '';
            runtime.ui.surveyResultsPayload = null;
            clearSurveyFlowState(runtime, { keepTakingId: true });
            setPanel('surveys');
            return renderSocialPageNow('survey-take-open');
        }
        if (type === 'photo') {
            setPanel('photography');
            state().ui.photographyFocusPostId = id;
            return renderSocialPageNow('panel-photography');
        }
        if (type === 'lost-found') {
            setPanel('lost-and-found');
            state().ui.lostFoundFocusId = id;
            return renderSocialPageNow('panel-lost-and-found');
        }
    }

    function entityDetailEntity(type, id) {
        const s = state().social || {};
        const find = (arr) => (Array.isArray(arr) ? arr : []).find((x) => text(x?.id) === id);
        if (type === 'project') return find(s.projects);
        if (type === 'portfolio') return portfolioEntriesForViewer().find((x) => text(x?.id) === id);
        if (type === 'page') return find(s.pages);
        if (type === 'event') return find(s.events);
        if (type === 'survey') return find(s.surveys);
        if (type === 'photo') return photographyPosts().find((x) => text(x?.id) === id);
        if (type === 'lost-found') return find(s.lostFoundItems);
        if (type === 'group') return find(s.groups);
        return null;
    }

    function entityDetailDescription(type, id) {
        const e = entityDetailEntity(type, id);
        if (!e) return '';
        return text(e.summary || e.description || e.tagline || e.about || e.body || e.headline || e.locationText || e.location || '').slice(0, 600);
    }

    // ponytail: one enriched popup for every entity type; per-type stat rows instead of 7 bespoke modals.
    function entityDetailStats(type, e) {
        if (!e) return [];
        const arr = (v) => (Array.isArray(v) ? v : []);
        const owner = (uid) => (uid ? displayName(accountById(uid) || { id: uid }) : '');
        const rel = (v) => (v ? when(v) : '');
        const label = (fn, val, fallback) => (typeof fn === 'function' ? fn(val) : fallback);
        if (type === 'project') return [
            ['Status', e.status],
            ['Owner', owner(e.ownerUserId)],
            ['Members', e.memberCount != null ? `${e.memberCount}${(e.maxTeamSize || e.targetTeamSize) ? ` / ${e.maxTeamSize || e.targetTeamSize}` : ''}` : (arr(e.memberIds).length || '')],
            ['Tasks', e.taskCount != null ? `${e.completedTaskCount || 0}/${e.taskCount}` : (arr(e.tasks).length || '')],
            ['Faculty', arr(e.facultyCodes)[0]],
            ['Created', rel(e.createdAt)],
        ];
        if (type === 'portfolio') return [
            ['Status', e.status],
            ['Owner', owner(e.ownerUserId || e.userId)],
            ['Audience', label(typeof portfolioAudienceLabel === 'function' ? portfolioAudienceLabel : null, e.visibilityMode, e.visibilityMode)],
            ['Links', arr(e.externalLinks).length || ''],
            ['Updated', rel(e.updatedAt || e.createdAt)],
        ];
        if (type === 'page') return [
            ['Type', label(typeof pageTypeLabel === 'function' ? pageTypeLabel : null, e, e.pageType || e.type)],
            ['Category', e.category],
            ['Followers', arr(e.followerIds || e.followerUserIds).length || ''],
            ['Location', e.location],
            ['Website', e.website || e.actionUrl],
        ];
        if (type === 'event') return [
            ['When', rel(e.startsAt)],
            ['Location', e.isOnline ? 'Online' : e.location],
            ['Host', e.scopeName],
            ['Category', e.category],
            ['Going', e.attendeeSummary?.going],
            ['Interested', e.attendeeSummary?.interested],
        ];
        if (type === 'survey') return [
            ['Status', label(typeof surveyStatusLabel === 'function' ? surveyStatusLabel : null, e, e.status)],
            ['Questions', e.questionCount != null ? e.questionCount : (arr(e.questions).length || '')],
            ['Responses', e.responseCount],
            ['Audience', label(typeof surveyAudienceLabel === 'function' ? surveyAudienceLabel : null, e, e.audience)],
            ['Closes', rel(e.closesAt)],
        ];
        if (type === 'photo') return [
            ['By', owner(e.authorUserId)],
            ['Category', e.category],
            ['Location', e.photoMeta?.location],
            ['Comments', arr(e.comments).length || ''],
        ];
        if (type === 'lost-found') return [
            ['Status', e.status],
            ['Category', e.category],
            ['Location', e.locationText || e.location],
            ['Date', rel(e.eventDate || e.lostAt)],
        ];
        return [];
    }

    function renderEntityDetailDialog(runtime, dialog = activeDialog()) {
        const type = text(dialog?.entityType || '').toLowerCase();
        const id = text(dialog?.entityId || '');
        const meta = resolveEntityLinkMeta({ type, id });
        const entity = entityDetailEntity(type, id);
        const desc = entityDetailDescription(type, id) || 'No additional details available.';
        const stats = entityDetailStats(type, entity)
            .filter(([, value]) => value !== undefined && value !== null && text(String(value)) !== '')
            .map(([k, value]) => `<div class="social-neo-item-line"><span>${escape(k)}</span><strong>${escape(String(value))}</strong></div>`)
            .join('');
        const tags = (Array.isArray(entity?.skillTags) && entity.skillTags.length ? entity.skillTags
            : (Array.isArray(entity?.hashtags) ? entity.hashtags : (Array.isArray(entity?.tags) ? entity.tags : [])))
            .slice(0, 8);
        const tagsHtml = tags.length
            ? `<div class="social-neo-badge-row">${tags.map((tag) => `<span class="social-neo-pill">${escape(text(tag))}</span>`).join('')}</div>`
            : '';
        return `<div class="social-neo-dialog-backdrop" data-action="dialog-close" role="dialog" aria-modal="true" aria-label="${escape(meta.title)}">
            <div class="social-neo-dialog-card social-neo-dialog-card--form social-neo-dialog-card--group-detail social-neo-dialog-card--social-glass" data-action="noop" data-lux-transparency-exempt="1">
                <div class="social-neo-section-head social-neo-dialog-head social-neo-group-detail-head">
                    <div class="social-neo-group-detail-identity">
                        <div class="social-neo-group-card-icon social-neo-group-card-avatar social-neo-group-detail-avatar"><i class="fas ${escape(meta.icon)}"></i></div>
                        <div class="social-neo-dialog-heading">
                            <strong class="social-neo-dialog-title">${escape(meta.title)}</strong>
                            <span class="social-neo-dialog-subtitle social-neo-group-detail-meta">
                                <span class="social-neo-pill">${escape(meta.sectionLabel)}</span>
                                <span>${escape(meta.subtitle)}</span>
                            </span>
                        </div>
                    </div>
                    <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-close-btn" type="button" data-action="dialog-close" aria-label="Close"><i class="fas fa-times"></i></button>
                </div>
                <div class="social-neo-dialog-body social-neo-dialog-body--group-detail">
                    <section class="social-neo-dialog-group-create-section social-neo-group-detail-section">
                        <div class="social-neo-dialog-group-create-section-head">
                            <strong>About</strong>
                            <span>${escape(meta.sectionLabel)} description.</span>
                        </div>
                        <p class="social-neo-group-detail-desc">${escape(desc)}</p>
                        ${tagsHtml}
                    </section>
                    ${stats ? `
                    <section class="social-neo-dialog-group-create-section social-neo-group-detail-section">
                        <div class="social-neo-dialog-group-create-section-head">
                            <strong>Details</strong>
                            <span>Key facts about this ${escape(meta.sectionLabel.toLowerCase())}.</span>
                        </div>
                        <div class="social-neo-list social-neo-group-detail-list">${stats}</div>
                    </section>` : ''}
                </div>
                <div class="social-neo-form-actions social-neo-dialog-actions social-neo-group-detail-actions">
                    <button class="social-neo-btn social-neo-btn-primary" type="button" data-action="entity-goto" data-entity-type="${escape(type)}" data-entity-id="${escape(id)}"><i class="fas fa-arrow-right"></i> Open full view</button>
                    <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-cancel-btn" type="button" data-action="dialog-close">Close</button>
                </div>
            </div>
        </div>`;
    }

    function isMineAttachableEntity(type, item) {
        const me = currentUserId();
        if (type === 'group') return text(item?.ownerUserId || item?.ownerId) === me || Boolean(item?.isManager);
        if (type === 'project') {
            const role = text(item?.role || '').toLowerCase();
            return text(item?.ownerUserId) === me || ['owner', 'member', 'advisor', 'instructor-viewer'].includes(role);
        }
        if (type === 'portfolio') {
            return text(item?.userId || item?.ownerUserId || item?.authorUserId) === me;
        }
        if (type === 'page') return Boolean(isManagedPage(item)) || text(item?.ownerUserId) === me;
        if (type === 'event') return text(item?.createdById) === me || Boolean(item?.viewerCanEdit);
        if (type === 'survey') return text(item?.createdById) === me || Boolean(item?.viewerCanManage);
        if (type === 'photo') return text(item?.authorUserId) === me;
        if (type === 'lost-found') return text(item?.authorUserId || item?.createdById) === me;
        return false;
    }

    function listAttachableEntities(section, filter = 'mine', query = '') {
        const social = state().social || {};
        const needle = text(query || '').trim().toLowerCase();
        const wantMine = text(filter || 'mine') !== 'others';
        let rows = [];
        if (section === 'group') {
            rows = (Array.isArray(social.groups) ? social.groups : []).map((item) => ({
                type: 'group',
                id: text(item.id),
                title: text(item.name || 'Group'),
                subtitle: text(item.description || item.visibility || 'Group').slice(0, 80),
                mine: isMineAttachableEntity('group', item),
                raw: item
            }));
        } else if (section === 'project') {
            rows = (Array.isArray(social.projects) ? social.projects : []).map((item) => ({
                type: 'project',
                id: text(item.id),
                title: text(item.name || item.title || 'Project'),
                subtitle: text(item.summary || item.description || item.status || 'Project').slice(0, 80),
                mine: isMineAttachableEntity('project', item),
                raw: item
            }));
        } else if (section === 'portfolio') {
            rows = portfolioEntriesForViewer().map((item) => ({
                type: 'portfolio',
                id: text(item.id || item.userId),
                title: text(item.title || item.name || item.basics?.name || 'Portfolio'),
                subtitle: text(item.summary || item.headline || item.visibilityMode || 'Portfolio').slice(0, 80),
                mine: isMineAttachableEntity('portfolio', item),
                raw: item
            }));
        } else if (section === 'page') {
            rows = (Array.isArray(social.pages) ? social.pages : []).map((item) => ({
                type: 'page',
                id: text(item.id),
                title: text(item.name || 'Page'),
                subtitle: text(item.category || item.about || 'Page').slice(0, 80),
                mine: isMineAttachableEntity('page', item),
                raw: item
            }));
        } else if (section === 'event') {
            rows = (Array.isArray(social.events) ? social.events : []).map((item) => ({
                type: 'event',
                id: text(item.id),
                title: text(item.title || 'Event'),
                subtitle: text(item.location || item.eventType || 'Event').slice(0, 80),
                mine: isMineAttachableEntity('event', item),
                raw: item
            }));
        } else if (section === 'survey') {
            rows = (Array.isArray(social.surveys) ? social.surveys : []).map((item) => ({
                type: 'survey',
                id: text(item.id),
                title: text(item.title || 'Survey'),
                subtitle: text(item.description || item.status || 'Survey').slice(0, 80),
                mine: isMineAttachableEntity('survey', item),
                raw: item
            }));
        } else if (section === 'photo') {
            rows = photographyPosts().map((item) => ({
                type: 'photo',
                id: text(item.id),
                title: text(item.body || item.photoMeta?.caption || 'Exposé photo').slice(0, 80) || 'Exposé photo',
                subtitle: text(item.category || 'Photography'),
                mine: isMineAttachableEntity('photo', item),
                raw: item
            }));
        } else if (section === 'lost-found') {
            rows = (Array.isArray(social.lostFoundItems) ? social.lostFoundItems : []).map((item) => ({
                type: 'lost-found',
                id: text(item.id),
                title: text(item.title || 'Lost & Found item'),
                subtitle: text(item.location || item.category || item.status || 'Listing').slice(0, 80),
                mine: isMineAttachableEntity('lost-found', item),
                raw: item
            }));
        }
        return rows
            .filter((row) => row.id && (wantMine ? row.mine : !row.mine))
            .filter((row) => {
                if (!needle) return true;
                return `${row.title} ${row.subtitle}`.toLowerCase().includes(needle);
            });
    }

    function renderComposerEntityChips(links = []) {
        const normalized = normalizeComposerEntityLinks(links);
        if (!normalized.length) return '';
        return `
            <div class="social-neo-post-compose-chips">
                ${normalized.map((link) => {
                    const meta = resolveEntityLinkMeta(link);
                    return `
                        <div class="social-neo-post-compose-chip">
                            <i class="fas ${escape(meta.icon)}" aria-hidden="true"></i>
                            <span><strong>${escape(meta.title)}</strong> · ${escape(meta.sectionLabel)}</span>
                            <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="post-compose-entity-remove" data-entity-type="${escape(meta.type)}" data-entity-id="${escape(meta.id)}" aria-label="Remove attachment">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    function renderPostEntityLinks(post) {
        const links = postEntityLinks(post);
        if (!links.length) return '';
        return `
            <div class="social-neo-post-entity-links">
                ${links.map((link) => {
                    const meta = resolveEntityLinkMeta(link);
                    const surveyExtra = meta.type === 'survey'
                        ? `<button class="social-neo-btn social-neo-btn-primary social-neo-btn-sm" type="button" data-action="survey-take-open" data-survey-id="${escape(meta.id)}"><i class="fas fa-play"></i> Take survey</button>`
                        : `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="entity-link-open" data-entity-type="${escape(meta.type)}" data-entity-id="${escape(meta.id)}">Open <i class="fas fa-arrow-right"></i></button>`;
                    return `
                        <article class="social-neo-post-entity-card">
                            <div class="social-neo-post-entity-card-copy">
                                <span class="social-neo-pill"><i class="fas ${escape(meta.icon)}"></i> ${escape(meta.sectionLabel)}</span>
                                <strong>${escape(meta.title)}</strong>
                                <span class="social-neo-muted">${escape(meta.subtitle)}</span>
                            </div>
                            ${surveyExtra}
                        </article>
                    `;
                }).join('')}
            </div>
        `;
    }

    function clearPostComposeDraft(runtime = state()) {
        const ui = runtime.ui || (runtime.ui = {});
        ui.composerText = '';
        ui.composerFile = null;
        ui.composerEntityLinks = [];
        ui.postComposeAttachSection = 'survey';
        ui.postComposeAttachFilter = 'mine';
        ui.postComposeAttachSearch = '';
    }

    function renderPostComposeShareSection(runtime) {
        if (hasSocialFeedModule() && typeof window.renderPostComposeShareSection === 'function') {
            return window.renderPostComposeShareSection(runtime);
        }
        ensureSocialFeedModule().catch(() => null);
        return '';
    }


    function renderPostComposeAttachResultsHtml(runtime) {
        if (hasSocialFeedModule() && typeof window.renderPostComposeAttachResultsHtml === 'function') {
            return window.renderPostComposeAttachResultsHtml(runtime);
        }
        ensureSocialFeedModule().catch(() => null);
        return '';
    }


    function patchPostComposeAttachDialog(runtime = state()) {
        if (text(activeDialog()?.type || '') !== 'post-compose-attach') return false;
        const card = document.querySelector('.social-neo-dialog-card--post-compose-attach');
        if (!card) return false;
        const filter = text(runtime.ui?.postComposeAttachFilter || 'mine') || 'mine';
        const list = card.querySelector('.social-neo-post-compose-attach-results');
        if (list) list.innerHTML = renderPostComposeAttachResultsHtml(runtime);
        card.querySelectorAll('[data-action="post-compose-attach-filter"]').forEach((btn) => {
            const isActive = text(btn.getAttribute('data-filter') || '') === filter;
            btn.classList.toggle('social-neo-btn-primary', isActive);
            btn.classList.toggle('social-neo-btn-ghost', !isActive);
        });
        const count = normalizeComposerEntityLinks(runtime.ui?.composerEntityLinks).length;
        const done = card.querySelector('.social-neo-post-compose-attach-done');
        if (done) {
            const badge = count
                ? `<span class="social-neo-dialog-submit-badge">${escape(String(count))}</span>`
                : '';
            done.innerHTML = `<i class="fas fa-check"></i> Done${badge}`;
        }
        const meta = card.querySelector('.social-neo-post-compose-attach-count');
        if (meta) {
            const section = text(runtime.ui?.postComposeAttachSection || 'survey') || 'survey';
            const search = text(runtime.ui?.postComposeAttachSearch || '');
            const rows = listAttachableEntities(section, filter, search);
            meta.textContent = `${rows.length} available · ${count} attached`;
        }
        return true;
    }

    function renderPostComposeAttachDialog(runtime, dialog = activeDialog()) {
        if (hasSocialFeedModule() && typeof window.renderPostComposeAttachDialog === 'function') {
            return window.renderPostComposeAttachDialog(runtime, dialog);
        }
        ensureSocialFeedModule().catch(() => null);
        return '';
    }


    function patchPostComposeDialog(runtime = state()) {
        if (text(activeDialog()?.type || '') !== 'post-compose') return false;
        const form = document.querySelector('form[data-form="post-compose"].social-neo-dialog-card--post-compose');
        if (!form) return false;
        const invite = form.querySelector('.social-neo-dialog-project-create-section--invite');
        if (!invite) return false;

        const wrap = document.createElement('div');
        wrap.innerHTML = renderPostComposeShareSection(runtime).trim();
        const nextInvite = wrap.firstElementChild;
        if (!nextInvite) return false;
        invite.replaceWith(nextInvite);

        const entityLinks = normalizeComposerEntityLinks(runtime.ui?.composerEntityLinks);
        const submit = form.querySelector('.social-neo-dialog-submit-btn');
        if (submit) {
            const badge = entityLinks.length
                ? `<span class="social-neo-dialog-submit-badge">${escape(String(entityLinks.length))}</span>`
                : '';
            submit.innerHTML = `<i class="fas fa-paper-plane"></i> Publish${badge}`;
        }

        const fileHost = form.querySelector('.social-neo-post-compose-file-host');
        if (fileHost) fileHost.innerHTML = renderFileChip(runtime.ui?.composerFile);
        return true;
    }

    function renderPostComposeDialog(runtime) {
        if (hasSocialFeedModule() && typeof window.renderPostComposeDialog === 'function') {
            return window.renderPostComposeDialog(runtime);
        }
        ensureSocialFeedModule().catch(() => null);
        return '';
    }


    function renderPost(post) {
        if (hasSocialFeedModule() && typeof window.renderPost === 'function' && window.renderPost !== renderPost) {
            return window.renderPost(post);
        }
        ensureSocialFeedModule().then(() => queueDeferredModuleRender('feed-module')).catch(() => null);
        return '';
    }

    function renderSocialLuxHero(options = {}) {
        const {
            sectionClasses = 'social-neo-card',
            heroFamily = 'social-neo-panel-hero',
            kicker = '',
            kickerIcon = '',
            title = '',
            copy = '',
            actionsHtml = '',
            stats = [],
            bodyHtml = '',
            extraHtml = '',
        } = options;
        const family = text(heroFamily) || 'social-neo-panel-hero';
        // asd10-aligned hero markup (CSS Isolation owns glass)
        const kickerMarkup = kicker
            ? `<div class="social-neo-section-kicker">${kickerIcon ? `<i class="fas ${escape(kickerIcon)}" aria-hidden="true"></i> ` : ''}${escape(kicker)}</div>`
            : '';
        const titleMarkup = title ? `<h2 class="social-neo-section-title">${escape(title)}</h2>` : '';
        const copyMarkup = copy ? `<p class="social-neo-section-copy social-neo-muted">${escape(copy)}</p>` : '';
        const statsList = Array.isArray(stats) ? stats : [];
        const statsMarkup = statsList.length
            ? `<div class="${escape(family)}-stats">${statsList.map((stat) => {
                const icon = text(stat?.icon) ? `<i class="fas ${escape(stat.icon)}" aria-hidden="true"></i>` : '';
                const isEvents = family === 'social-neo-events-hero';
                const statClass = isEvents
                    ? `${escape(family)}-stat social-neo-events-hero-stat lux-strip-card surface-card`
                    : `${escape(family)}-stat`;
                return `<article class="${statClass}">
                    ${icon && isEvents ? `<span class="${escape(family)}-stat-icon">${icon}</span>` : ''}
                    <strong>${escape(stat?.value ?? '')}</strong>
                    <span>${escape(stat?.label ?? '')}</span>
                </article>`;
            }).join('')}</div>`
            : '';
        const headMarkup = (kickerMarkup || titleMarkup || copyMarkup || actionsHtml)
            ? `<div class="${escape(family)}-head">
                <div class="${escape(family)}-copy">
                    ${kickerMarkup}
                    ${titleMarkup}
                    ${copyMarkup}
                </div>
                ${actionsHtml ? `<div class="${escape(family)}-actions">${actionsHtml}</div>` : ''}
            </div>`
            : '';
        return `
            <section class="${sectionClasses}">
                ${headMarkup}
                ${statsMarkup}
                ${extraHtml || ''}
                ${bodyHtml || ''}
            </section>
        `;
    }

    let socialVisualShellSynced = false;
    function syncSocialVisualShell() {
        if (typeof window.updateTransparency !== 'function') return;
        const saved = parseInt(localStorage.getItem('kiuLuxurySurfaceTransparency') || '13', 10);
        if (!Number.isNaN(saved)) {
            window.updateTransparency(saved, { persist: false });
        }
    }

    /**
     * Renders the Feed hero card — the banner at the top of the Home panel.
     * Contains: kicker/headline, stat counters, filter tabs, feed scope selector, and quick-tip hints.
     * @param {Object}   runtime      - Current runtime state.
     * @param {string}   activeFilter  - Active tab id ('all'|'following'|'groups'|'pages'|'campus').
     * @param {Object}   metrics       - Counters: { following, joinedGroups }.
     * @param {Array}    scopeOptions  - Feed scope dropdown options (from `feedScopeOptions()`).
     * @param {string}   feedScopeId   - DOM id for the feed scope `<select>`.
     * @returns {string} HTML `<div class="social-neo-feed-hero">` zone markup.
     */

    /**
     * Renders the entire Home / Feed panel.
     * Layout: feed-shell wrapper → merged header card (hero + stories + composer) → post stack.
     *
     * This is the default panel — shown when `activePanel` is 'feed' or unrecognised.
     * @returns {string} HTML for the `social-neo-center` region.
     */


    function renderEventsHero(runtime, activeTab, metrics = {}, createActionConfig = {}) {
        if (hasSocialEventsModule() && typeof window.renderEventsHero === 'function') {
            return window.renderEventsHero(runtime, activeTab, metrics, createActionConfig);
        }
        return '';
    }

    function renderEventsPanel() {
        if (hasSocialEventsModule()) {
            return window.renderEventsPanel();
        }
        ensureSocialEventsModule().then(() => queueDeferredModuleRender('events-module')).catch(() => null);
        return `
            <section class="social-neo-card">
                <div class="social-neo-empty-hero">
                    <i class="fas fa-calendar-days"></i>
                    <strong>Loading Events</strong>
                    <span>Preparing campus events and study groups.</span>
                </div>
            </section>
        `;
    }

    function renderGroupsHero(runtime, groups, activeTab, options = {}) {
        if (hasSocialGroupsModule() && typeof window.renderGroupsHero === 'function') {
            return window.renderGroupsHero(runtime, groups, activeTab, options);
        }
        ensureSocialGroupsModule().catch(() => null);
        return '';
    }

    function renderFeedHero(runtime, activeFilter, metrics = {}, scopeOptions = [], feedScopeId = '') {
        if (hasSocialFeedModule() && typeof window.renderFeedHero === 'function') {
            return window.renderFeedHero(runtime, activeFilter, metrics, scopeOptions, feedScopeId);
        }
        return '';
    }

    function renderFeedPanel() {
        if (hasSocialFeedModule()) {
            return window.renderFeedPanel();
        }
        ensureSocialFeedModule().then(() => queueDeferredModuleRender('feed-module')).catch(() => null);
        return `
            <section class="social-neo-card">
                <div class="social-neo-empty-hero">
                    <i class="fas fa-house"></i>
                    <strong>Loading Home</strong>
                    <span>Preparing your campus feed.</span>
                </div>
            </section>
        `;
    }

    function renderRelationshipActions(account) {
        if (hasSocialCommunityModule() && typeof window.renderRelationshipActions === 'function' && window.renderRelationshipActions !== renderRelationshipActions) {
            return window.renderRelationshipActions(account);
        }
        ensureSocialCommunityModule().catch(() => null);
        return '';
    }

    function renderCommunityPanel() {
        if (hasSocialCommunityModule()) {
            return window.renderCommunityPanel();
        }
        ensureSocialCommunityModule().then(() => queueDeferredModuleRender('community-module')).catch(() => null);
        return `
            <div class="social-neo-stack social-neo-community-shell">
                <section class="social-neo-card social-neo-community-hero social-neo-community-panel social-neo-community-panel--hero is-merged social-neo-community-panel--directory">
                    <div class="social-neo-empty-hero">
                        <i class="fas fa-user-friends"></i>
                        <strong>Loading Community</strong>
                        <span>Preparing people discovery, requests, and staff shortcuts.</span>
                    </div>
                </section>
            </div>
        `;
    }

    /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
       GROUPS PANEL - Facebook-style group discovery & management
       â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
    function renderProjectsWorkspacePanelClassic() {
        if (hasSocialWorkspaceModule() && typeof window.renderProjectsWorkspacePanelClassic === 'function') {
            return window.renderProjectsWorkspacePanelClassic();
        }
        ensureSocialWorkspaceModule().then(() => queueDeferredModuleRender('workspace-module')).catch(() => null);
        return `
            <section class="social-neo-card">
                <div class="social-neo-empty-hero">
                    <i class="fas fa-diagram-project"></i>
                    <strong>Loading Projects</strong>
                    <span>Preparing workspaces and delivery tools.</span>
                </div>
            </section>
        `;
    }


    function renderLostFoundPanel() {
        if (hasSocialLostFoundModule()) {
            return window.renderLostFoundPanel();
        }
        ensureSocialLostFoundModule().then(() => queueDeferredModuleRender('lost-found-module')).catch(() => null);
        return `
            <section class="social-neo-card">
                <div class="social-neo-empty-hero">
                    <i class="fas fa-magnifying-glass-location"></i>
                    <strong>Loading Lost &amp; Found</strong>
                    <span>Preparing listings, filters, and the item composer.</span>
                </div>
            </section>
        `;
    }

    function renderSurveysPanel() {
        if (hasSocialSurveysModule()) {
            return window.renderSurveysPanel();
        }
        ensureSocialSurveysModule().then(() => queueDeferredModuleRender('surveys-module')).catch(() => null);
        return `
            <section class="social-neo-card">
                <div class="social-neo-empty-hero">
                    <i class="fas fa-clipboard-list"></i>
                    <strong>Loading Surveys</strong>
                    <span>Preparing listings, filters, and the survey composer.</span>
                </div>
            </section>
        `;
    }

    function renderPhotographyPanel() {
        if (hasSocialPhotographyModule()) {
            return window.renderPhotographyPanel();
        }
        ensureSocialPhotographyModule().then(() => queueDeferredModuleRender('photography-module')).catch(() => null);
        return `
            <section class="social-neo-card">
                <div class="social-neo-empty-hero">
                    <i class="fas fa-camera-retro"></i>
                    <strong>Loading Campus Exposé</strong>
                    <span>Preparing the campus photo gallery.</span>
                </div>
            </section>
        `;
    }

    function renderMessagesPanel() {
        if (hasSocialMessagesModule()) {
            return window.renderMessagesPanel();
        }
        ensureSocialMessagesModule().then(() => queueDeferredModuleRender('messages-module')).catch(() => null);
        return `
            <section class="social-neo-card">
                <div class="social-neo-empty-hero">
                    <i class="fas fa-comments"></i>
                    <strong>Loading Messages</strong>
                    <span>Preparing threads, group rails, and call controls.</span>
                </div>
            </section>
        `;
    }
    function renderPortfolioHero(runtime, metrics = {}) {
        if (hasSocialWorkspaceModule() && typeof window.renderPortfolioHero === 'function') {
            return window.renderPortfolioHero(runtime, metrics);
        }
        ensureSocialWorkspaceModule().catch(() => null);
        return '';
    }


    function renderCommunityHero(runtime, activeTab, metrics = {}, bodyHtml = '', options = {}) {
        const profiles = Number(metrics.profiles || 0);
        const requests = Number(metrics.requests || 0);
        const connections = Number(metrics.connections || 0);
        const staff = Number(metrics.staff || 0);
        const stats = [
            { label: 'Profiles', value: profiles },
            { label: 'Requests', value: requests },
            { label: 'Connections', value: connections },
            { label: 'Staff', value: staff },
        ];
        const tabs = [
            { tab: 'people', label: 'People', icon: 'fa-user-group', helper: 'Browse campus directory' },
            { tab: 'requests', label: 'Requests', icon: 'fa-user-check', helper: 'Pending invites' },
            { tab: 'connections', label: 'Connections', icon: 'fa-handshake', helper: 'Your network' },
            { tab: 'staff', label: 'Staff', icon: 'fa-chalkboard-user', helper: 'Faculty and staff' },
        ];
        const merged = Boolean(bodyHtml);
        const panelClass = text(options.panelClass || '');
        const sectionClasses = [
            'social-neo-card',
            'social-neo-community-hero',
            'social-neo-community-panel',
            'social-neo-community-panel--hero',
            merged ? 'is-merged' : '',
            panelClass
        ].filter(Boolean).join(' ');
        return `
            <section class="${sectionClasses}">
                <div class="social-neo-community-hero-stats">
                    ${stats.map((stat) => `
                        <article class="social-neo-community-hero-stat social-neo-events-hero-stat lux-strip-card surface-card">
                            <strong>${escape(String(stat.value))}</strong>
                            <span>${escape(stat.label)}</span>
                        </article>
                    `).join('')}
                </div>
                <div class="social-neo-community-hero-grid">
                    ${tabs.map((tab) => `
                        <button class="social-neo-community-hero-tab ${activeTab === tab.tab ? 'is-focused' : ''}" type="button" data-action="panel-community" data-community-tab="${escape(tab.tab)}" aria-pressed="${activeTab === tab.tab ? 'true' : 'false'}">
                            <span class="social-neo-community-hero-tab-icon"><i class="fas ${escape(tab.icon)}"></i></span>
                            <span class="social-neo-community-hero-tab-copy">
                                <strong>${escape(tab.label)}</strong>
                                <small>${escape(tab.helper)}</small>
                            </span>
                        </button>
                    `).join('')}
                </div>
                ${merged ? `
                    <div class="social-neo-community-hero-divider" aria-hidden="true"></div>
                    <div class="social-neo-stack social-neo-community-layout">${bodyHtml}</div>
                ` : ''}
            </section>
        `;
    }

    function renderWorkspaceHero(runtime, projects, metrics = {}) {
        if (hasSocialWorkspaceModule() && typeof window.renderWorkspaceHero === 'function') {
            return window.renderWorkspaceHero(runtime, projects, metrics);
        }
        ensureSocialWorkspaceModule().catch(() => null);
        return '';
    }




    function buildProjectCreateInviteContext(runtime, baseContext) {
        if (hasSocialWorkspaceModule() && typeof window.buildProjectCreateInviteContext === 'function') {
            return window.buildProjectCreateInviteContext(runtime, baseContext);
        }
        ensureSocialWorkspaceModule().catch(() => null);
        return {
            ...(baseContext || buildProjectCreateContext(runtime)),
            selectedMemberIds: [],
            candidateAccounts: [],
            facultyOptions: [],
            facultyFilter: 'all',
            memberSearch: '',
            selectedMembersMarkup: '',
            searchResultsMarkup: ''
        };
    }




    function resolveActiveSocialProject(runtime, projectId) {
        const projects = Array.isArray(runtime.social?.projects) ? runtime.social.projects : [];
        const id = text(projectId || runtime.ui?.activeProjectId || '');
        return projects.find((project) => text(project?.id) === id) || null;
    }

    function renderProjectTaskChecklistBlock(project, checklist, options = {}) {
        const compact = Boolean(options.compact);
        const rows = (Array.isArray(checklist) ? checklist : [])
            .map((item) => ({ id: text(item.id), label: text(item.label), done: Boolean(item.done) }));
        const head = compact ? '' : `
            <div class="social-neo-section-head social-project-task-checklist-head">
                <div><span class="social-neo-label">Checklist</span><span>Break the task into small, trackable steps.</span></div>
                <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-task-checklist-add" data-project-id="${escape(text(project.id))}"><i class="fas fa-plus"></i> Add step</button>
            </div>
        `;
        const addBtn = compact ? `<div class="social-project-task-checklist-toolbar"><button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-task-checklist-add" data-project-id="${escape(text(project.id))}"><i class="fas fa-plus"></i> Add step</button></div>` : '';
        return `
            <div class="social-neo-dialog-field social-project-task-checklist-field">
                ${head}
                ${addBtn}
                <div class="social-project-task-checklist-rows" data-project-id="${escape(text(project.id))}">
                    ${rows.length ? rows.map((item, index) => `
                        <label class="social-project-task-checklist-row">
                            <input type="checkbox" name="projectTaskChecklistDone" data-checklist-id="${escape(text(item.id || `new-${index + 1}`))}" ${item.done ? 'checked' : ''}>
                            <input class="social-neo-input" type="text" name="projectTaskChecklistLabel" data-checklist-id="${escape(text(item.id || `new-${index + 1}`))}" value="${escape(text(item.label || ''))}" placeholder="Step description">
                            <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-icon" type="button" title="Remove step" data-action="project-task-checklist-remove" data-project-id="${escape(text(project.id))}" data-checklist-id="${escape(text(item.id || `new-${index + 1}`))}"><i class="fas fa-times"></i></button>
                        </label>
                    `).join('') : `<div class="social-neo-empty social-project-task-checklist-empty">No steps yet. Add one to track progress on this task.</div>`}
                </div>
            </div>
        `;
    }

    function renderDeskTaskTreeForest(project, forest, options = {}) {
        if (hasSocialWorkspaceModule() && typeof window.renderDeskTaskTreeForest === 'function') {
            return window.renderDeskTaskTreeForest(project, forest, options);
        }
        ensureSocialWorkspaceModule().catch(() => null);
        return '';
    }


    function renderProjectTaskDeskCard(project, task, options = {}) {
        if (hasSocialWorkspaceModule() && typeof window.renderProjectTaskDeskCard === 'function') {
            return window.renderProjectTaskDeskCard(project, task, options);
        }
        ensureSocialWorkspaceModule().catch(() => null);
        return '';
    }




    function renderProjectTaskColumnList(column, columnTasks, cardsHtml) {
        if (hasSocialWorkspaceModule() && typeof window.renderProjectTaskColumnList === 'function') {
            return window.renderProjectTaskColumnList(column, columnTasks, cardsHtml);
        }
        return '';
    }


    function renderProjectTaskDeleteConfirmDialog(project, task, options = {}) {
        if (hasSocialWorkspaceModule() && typeof window.renderProjectTaskDeleteConfirmDialog === 'function') {
            return window.renderProjectTaskDeleteConfirmDialog(project, task, options);
        }
        ensureSocialWorkspaceModule().catch(() => null);
        return '';
    }


    function renderProjectTaskFormFields(runtime, options = {}) {
        if (hasSocialWorkspaceModule() && typeof window.renderProjectTaskFormFields === 'function') {
            return window.renderProjectTaskFormFields(runtime, options);
        }
        ensureSocialWorkspaceModule().catch(() => null);
        return '';
    }








    function parseTaskChecklistFromForm(form) {
        const labels = Array.from(form.querySelectorAll('input[name="projectTaskChecklistLabel"]'));
        const doneBy = {};
        Array.from(form.querySelectorAll('input[name="projectTaskChecklistDone"]')).forEach((checkbox) => {
            doneBy[text(checkbox.getAttribute('data-checklist-id') || '')] = Boolean(checkbox.checked);
        });
        return labels.map((input, index) => ({
            id: text(input.getAttribute('data-checklist-id') || `check${index + 1}`),
            label: text(input.value || ''),
            done: Boolean(doneBy[text(input.getAttribute('data-checklist-id') || '')])
        })).filter((item) => item.label);
    }

    function syncTaskChecklistInput(target, isCheckbox) {
        const runtime = state();
        const itemId = text(target.getAttribute('data-checklist-id') || '');
        const rows = Array.isArray(runtime.ui?.projectTaskChecklist) ? runtime.ui.projectTaskChecklist : [];
        const existing = rows.find((item) => text(item.id) === itemId);
        if (existing) {
            existing.label = isCheckbox ? existing.label : target.value;
            existing.done = isCheckbox ? Boolean(target.checked) : existing.done;
        } else if (!isCheckbox) {
            rows.push({ id: itemId, label: target.value, done: false });
            runtime.ui.projectTaskChecklist = rows;
        }
    }





    function getProjectHealthDialogCard() {
        return document.querySelector(
            '.social-project-health-anchor .social-neo-dialog-card--project-health-fs, '
            + '.social-neo-dialog-card--project-health-fs, '
            + '.social-neo-dialog-card--project-health'
        );
    }

    /** Patch only My plan card — avoid full Health remount/flicker. */
    function patchProjectHealthPlanCard(runtime = state()) {
        const root = getProjectHealthDialogCard();
        const live = root?.querySelector('.sph-card--plan');
        if (!live) return false;
        const projectId = text(activeDialog()?.projectId || runtime.ui?.activeProjectId || '');
        const project = resolveActiveSocialProject(runtime, projectId);
        if (!project) return false;
        const wrap = document.createElement('div');
        wrap.innerHTML = renderProjectHealthPlanCardHtml(runtime, project).trim();
        const next = wrap.firstElementChild;
        if (!next) return false;
        live.replaceWith(next);
        return true;
    }

    function taskMatchesPlanPickDueFilter(task, dueFilter, nowMs) {
        const filter = text(dueFilter || 'all') || 'all';
        const dueMs = Date.parse(text(task?.dueAt || ''));
        const hasDue = Number.isFinite(dueMs);
        if (filter === 'all') return true;
        if (filter === 'none') return !hasDue;
        if (filter === 'overdue') {
            return hasDue && dueMs < nowMs && normalizeProjectTaskStatusId(task?.status) !== 'done';
        }
        const days = filter === '7d' ? 7 : filter === '14d' ? 14 : filter === '30d' ? 30 : filter === '60d' ? 60 : 0;
        if (!days) return true;
        // Includes overdue and due within N days.
        return hasDue && dueMs <= nowMs + days * 86400000;
    }

    function resolveTaskPackageId(taskId, groups = []) {
        const tid = text(taskId);
        if (!tid) return '';
        for (const group of groups) {
            const members = (Array.isArray(group?.memberTaskIds) ? group.memberTaskIds : []).map((id) => text(id));
            if (members.includes(tid)) return text(group?.id);
        }
        return '';
    }



    function renderProjectHealthPlanPickRailHtml(model) {
        if (hasSocialWorkspaceModule() && typeof window.renderProjectHealthPlanPickRailHtml === 'function') {
            return window.renderProjectHealthPlanPickRailHtml(model);
        }
        return '';
    }


    function renderProjectHealthPlanPickResultsHtml(model) {
        if (hasSocialWorkspaceModule() && typeof window.renderProjectHealthPlanPickResultsHtml === 'function') {
            return window.renderProjectHealthPlanPickResultsHtml(model);
        }
        return '';
    }


    function renderProjectHealthPlanPickToolbarHtml(model) {
        if (hasSocialWorkspaceModule() && typeof window.renderProjectHealthPlanPickToolbarHtml === 'function') {
            return window.renderProjectHealthPlanPickToolbarHtml(model);
        }
        return '';
    }




    function patchProjectHealthPlanPick(runtime = state()) {
        const card = document.querySelector('.social-neo-dialog-card--health-plan-pick');
        if (!card) return false;
        const dialog = activeDialog();
        if (text(dialog?.type || '') !== 'project-health-plan-pick') return false;
        const model = buildProjectHealthPlanPickModel(runtime, dialog);
        if (!model) return false;
        const body = card.querySelector('.sph-pick-body');
        const apply = card.querySelector('[data-action="project-health-plan-pick-apply"]');
        if (body) body.innerHTML = renderProjectHealthPlanPickBodyHtml(model);
        if (apply) {
            apply.disabled = !model.selectedCount;
            apply.setAttribute('data-project-id', model.projectId);
            apply.setAttribute('data-window', model.horizon);
            apply.innerHTML = `<i class="fas fa-plus"></i> Add ${model.selectedCount || 0} to ${escape(model.horizonLabel)} plan`;
        }
        // Sync checkboxes without remounting search row
        const openOnly = card.querySelector('input[data-filter="openOnly"]');
        const hidePlanned = card.querySelector('input[data-filter="hidePlanned"]');
        if (openOnly) openOnly.checked = model.openOnly;
        if (hidePlanned) hidePlanned.checked = model.hidePlanned;
        return true;
    }



    function projectRiskOptionLabel(value, map) {
        if (hasSocialWorkspaceModule() && typeof window.projectRiskOptionLabel === 'function') {
            return window.projectRiskOptionLabel(value, map);
        }
        return text(value || '');
    }


    function projectRiskScaleRank(value) {
        if (hasSocialWorkspaceModule() && typeof window.projectRiskScaleRank === 'function') {
            return window.projectRiskScaleRank(value);
        }
        return Number(value) || 0;
    }


    function projectRiskScaleOptionLabel(value) {
        if (hasSocialWorkspaceModule() && typeof window.projectRiskScaleOptionLabel === 'function') {
            return window.projectRiskScaleOptionLabel(value);
        }
        return text(value || '');
    }


    function formatProjectRiskScore(score) {
        if (hasSocialWorkspaceModule() && typeof window.formatProjectRiskScore === 'function') {
            return window.formatProjectRiskScore(score);
        }
        return String(score || 0);
    }


    function projectRiskExposureScore(risk) {
        if (hasSocialWorkspaceModule() && typeof window.projectRiskExposureScore === 'function') {
            return window.projectRiskExposureScore(risk);
        }
        return 0;
    }


    function projectRiskExposureTier(score) {
        if (hasSocialWorkspaceModule() && typeof window.projectRiskExposureTier === 'function') {
            return window.projectRiskExposureTier(score);
        }
        return 'low';
    }


    function projectRiskIsActiveStatus(status) {
        if (hasSocialWorkspaceModule() && typeof window.projectRiskIsActiveStatus === 'function') {
            return window.projectRiskIsActiveStatus(status);
        }
        return ['open', 'monitoring', 'mitigating'].includes(text(status));
    }


    function sortProjectRisksForRegister(risks) {
        if (hasSocialWorkspaceModule() && typeof window.sortProjectRisksForRegister === 'function') {
            return window.sortProjectRisksForRegister(risks);
        }
        return Array.isArray(risks) ? risks.slice() : [];
    }


    function projectRiskRegisterSummary(project) {
        if (hasSocialWorkspaceModule() && typeof window.projectRiskRegisterSummary === 'function') {
            return window.projectRiskRegisterSummary(project);
        }
        return { total: 0, open: 0, high: 0 };
    }


    function projectRiskLinkedTaskIdList(risk) {
        if (hasSocialWorkspaceModule() && typeof window.projectRiskLinkedTaskIdList === 'function') {
            return window.projectRiskLinkedTaskIdList(risk);
        }
        return [];
    }


    function projectRiskLinksTask(risk, taskId) {
        if (hasSocialWorkspaceModule() && typeof window.projectRiskLinksTask === 'function') {
            return window.projectRiskLinksTask(risk, taskId);
        }
        return false;
    }


    function countProjectRisksForTask(risks, taskId) {
        return (Array.isArray(risks) ? risks : []).filter((risk) => projectRiskLinksTask(risk, taskId)).length;
    }

    function buildProjectRiskCountByTaskId(project) {
        if (hasSocialWorkspaceModule() && typeof window.buildProjectRiskCountByTaskId === 'function') {
            return window.buildProjectRiskCountByTaskId(project);
        }
        return new Map();
    }


    function renderProjectRiskScaleOptions(name, selected, labels) {
        if (hasSocialWorkspaceModule() && typeof window.renderProjectRiskScaleOptions === 'function') {
            return window.renderProjectRiskScaleOptions(name, selected, labels);
        }
        return '';
    }








    function renderEventCreateDialog(runtime) {
        if (hasSocialEventsModule() && typeof window.renderEventCreateDialog === 'function') {
            return window.renderEventCreateDialog(runtime);
        }
        ensureSocialEventsModule().catch(() => null);
        return '';
    }


    function renderPageCreateDialog(runtime) {
        if (hasSocialPagesModule() && typeof window.renderPageCreateDialog === 'function') {
            return window.renderPageCreateDialog(runtime);
        }
        ensureSocialPagesModule().catch(() => null);
        return '';
    }




    function buildGroupCreateInviteContext(runtime) {
        // Invite context lives in social-groups.js; page only needs the dialog entrypoints.
        return null;
    }

    function renderGroupCreateInviteSection(runtime, inviteContext) {
        return '';
    }

    function renderGroupCreateDialog(runtime) {
        if (hasSocialGroupsModule() && typeof window.renderGroupCreateDialog === 'function') {
            return window.renderGroupCreateDialog(runtime);
        }
        ensureSocialGroupsModule().catch(() => null);
        return '';
    }

    function findSocialGroupById(groupId) {
        const id = text(groupId);
        if (!id) return null;
        return (Array.isArray(state().social?.groups) ? state().social.groups : [])
            .find((item) => text(item?.id) === id) || null;
    }

    function renderGroupDetailMemberLine(group, memberId) {
        return '';
    }

    function renderGroupDetailDialog(runtime, dialog = activeDialog()) {
        if (hasSocialGroupsModule() && typeof window.renderGroupDetailDialog === 'function') {
            return window.renderGroupDetailDialog(runtime, dialog);
        }
        ensureSocialGroupsModule().catch(() => null);
        return '';
    }


    function renderGroupsPanel() {
        if (hasSocialGroupsModule()) {
            return window.renderGroupsPanel();
        }
        ensureSocialGroupsModule().then(() => queueDeferredModuleRender('groups-module')).catch(() => null);
        return `
            <section class="social-neo-card">
                <div class="social-neo-empty-hero">
                    <i class="fas fa-layer-group"></i>
                    <strong>Loading Groups</strong>
                    <span>Preparing campus communities.</span>
                </div>
            </section>
        `;
    }


    function renderPagesHero(runtime, pages, activeTab, options = {}) {
        if (hasSocialPagesModule() && typeof window.renderPagesHero === 'function') {
            return window.renderPagesHero(runtime, pages, activeTab, options);
        }
        return '';
    }

    function renderPagesEmptyState(activeTab, pageSearch) {
        if (hasSocialPagesModule() && typeof window.renderPagesEmptyState === 'function') {
            return window.renderPagesEmptyState(activeTab, pageSearch);
        }
        return '';
    }

    function renderPagePostComposeDialog(runtime, page) {
        if (hasSocialPagesModule() && typeof window.renderPagePostComposeDialog === 'function') {
            return window.renderPagePostComposeDialog(runtime, page);
        }
        ensureSocialPagesModule().catch(() => null);
        return '';
    }


    function renderPageProfileComposer(page, runtime) {
        if (hasSocialPagesModule() && typeof window.renderPageProfileComposer === 'function') {
            return window.renderPageProfileComposer(page, runtime);
        }
        ensureSocialPagesModule().catch(() => null);
        return '';
    }

    function renderPagesPanel() {
        if (hasSocialPagesModule()) {
            return window.renderPagesPanel();
        }
        ensureSocialPagesModule().then(() => queueDeferredModuleRender('pages-module')).catch(() => null);
        return `
            <section class="social-neo-card">
                <div class="social-neo-empty-hero">
                    <i class="fas fa-flag"></i>
                    <strong>Loading Pages</strong>
                    <span>Preparing campus pages.</span>
                </div>
            </section>
        `;
    }


    function renderAlertsPanel() {
        if (hasSocialAlertsModule()) {
            return window.renderAlertsPanel();
        }
        ensureSocialAlertsModule().then(() => queueDeferredModuleRender('alerts-module')).catch(() => null);
        return `
            <section class="social-neo-card">
                <div class="social-neo-empty-hero">
                    <i class="fas fa-bell"></i>
                    <strong>Loading Alerts</strong>
                    <span>Preparing notifications, reminders, and moderation queues.</span>
                </div>
            </section>
        `;
    }

    const PORTFOLIO_DISCOVER_ROLE_TARGETS = [
        ['all', 'All audiences'],
        ['all_logged_in', 'All logged-in'],
        ['students_only', 'Students'],
        ['tas_only', 'TAs'],
        ['professors_only', 'Professors'],
        ['staff_only', 'Staff'],
        ['custom', 'Custom'],
    ];




























    function renderProjectsPanel() {
        if (hasSocialWorkspaceModule() && typeof window.renderProjectsPanel === 'function' && window.renderProjectsPanel !== renderProjectsPanel) {
            return window.renderProjectsPanel();
        }
        ensureSocialWorkspaceModule().then(() => queueDeferredModuleRender('workspace-module')).catch(() => null);
        return `
            <section class="social-neo-card">
                <div class="social-neo-empty-hero">
                    <i class="fas fa-briefcase"></i>
                    <strong>Loading Portfolio</strong>
                    <span>Preparing showcase discovery and your portfolio.</span>
                </div>
            </section>
        `;
    }

    function renderProfilePageBody() {
        if (typeof window.renderSocialProfilePanel === 'function') {
            return window.renderSocialProfilePanel();
        }
        ensureSocialProfileModule().then(() => queueDeferredModuleRender('profile-module')).catch(() => null);
        return `
            <div class="social-neo-card">
                <div class="social-neo-empty">Loading profile...</div>
            </div>
        `;
    }

    function renderShellPrimaryNav(activePanel) {
        const panels = activeNavPanels();

        return `
            <div class="social-neo-shell-primary-nav" role="tablist" aria-label="Social navigation">
                ${panels.map((panel) => `
                    <button class="social-neo-shell-nav-btn ${text(activePanel) === panel.id ? 'is-active' : ''}" type="button" data-action="panel-${escape(panel.id)}">
                        <span class="social-neo-shell-nav-icon" data-panel-tone="${escape(panel.id)}">
                            <i class="fas ${escape(panel.icon)}"></i>
                        </span>
                        <span class="social-neo-shell-nav-copy">
                            <strong class="social-neo-shell-nav-title">${escape(panel.label)}</strong>
                            <small class="social-neo-shell-nav-helper">${escape(panel.helper)}</small>
                        </span>
                        ${panel.count > 0 ? `<em class="social-neo-shell-nav-count social-neo-shell-nav-count-label">${escape(panel.count)}</em>` : ''}
                    </button>
                `).join('')}
            </div>
        `;
    }

    // Mobile nav is owned by #mobile-bottom-nav + social-mobile.js (no in-shell dual tabbar).
    function renderMobileTabBar() {
        return '';
    }

    function renderShellDrawer(activePanel) {
        const runtime = state();
        const panels = activeNavPanels();
        const user = currentUser() || {};
        const open = Boolean(runtime.ui?.shellDrawerOpen);
        if (!open) return '';
        return `
            <div class="social-neo-shell-drawer-backdrop" data-action="shell-drawer-close"></div>
            <aside class="social-neo-shell-drawer" aria-label="Social navigation drawer">
                <section class="social-neo-card social-neo-shell-drawer-profile social-neo-shell-drawer-profile-card">
                    <div class="social-neo-shell-drawer-head">
                        <button class="social-neo-person social-neo-clickable social-neo-person-start-gap-12 social-neo-shell-drawer-profile-chip" type="button" data-action="panel-profile" data-user-id="${escape(currentUserId())}">
                            ${avatar(user)}
                            <div class="social-neo-shell-drawer-profile-copy">
                                <strong class="social-neo-shell-drawer-profile-name">${escape(displayName(user))}</strong>
                                <span class="social-neo-shell-drawer-profile-subtitle">${escape(accountSubtitle(user))}</span>
                            </div>
                        </button>
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="shell-drawer-close"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="social-neo-inline social-neo-inline-gap-4 social-neo-shell-drawer-actions">
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm social-neo-shell-drawer-action-btn" type="button" data-action="panel-profile" data-user-id="${escape(currentUserId())}"><i class="fas fa-user"></i> Profile</button>
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm social-neo-shell-drawer-action-btn" type="button" data-action="panel-messages"><i class="fas fa-paper-plane"></i> Messages</button>
                    </div>
                </section>
                <section class="social-neo-card social-neo-shell-drawer-nav-card">
                    <div class="social-neo-sidebar-nav social-neo-shell-drawer-nav">
                        ${panels.map((panel) => `
                            <button class="social-neo-side-link social-neo-shell-drawer-nav-btn ${text(activePanel) === panel.id ? 'is-active' : ''}" type="button" data-action="panel-${escape(panel.id)}">
                                <span class="social-neo-side-main social-neo-shell-drawer-nav-main">
                                    <span class="social-neo-side-icon social-neo-shell-drawer-nav-icon" data-panel-tone="${escape(panel.id)}"><i class="fas ${escape(panel.icon)}"></i></span>
                                    <span class="social-neo-side-copy social-neo-shell-drawer-nav-copy">
                                        <strong class="social-neo-shell-drawer-nav-title">${escape(panel.label)}</strong>
                                        <small class="social-neo-shell-drawer-nav-helper">${escape(panel.helper)}</small>
                                    </span>
                                </span>
                                ${panel.count > 0 ? `<em class="social-neo-side-count social-neo-shell-drawer-nav-count">${escape(panel.count)}</em>` : ''}
                            </button>
                        `).join('')}
                    </div>
                </section>
            </aside>
        `;
    }

    const WORKSPACE_NAV_ANIM_MS = 280;
    let workspaceNavCloseTimer = 0;

    function getSocialWorkspaceNavRegion(host) {
        const rootHost = host || root();
        return rootHost?.querySelector('#social-neo-workspace-nav-region')
            || document.getElementById('social-neo-workspace-nav-region');
    }

    function animateSocialWorkspaceNavOpen(host) {
        const region = getSocialWorkspaceNavRegion(host);
        const panel = region?.querySelector('.social-neo-workspace-nav--overlay');
        if (!region || !panel) return;
        region.classList.remove('is-open');
        panel.classList.remove('is-open');
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                region.classList.add('is-open');
                panel.classList.add('is-open');
            });
        });
    }

    function closeSocialWorkspaceNavAnimated(done) {
        const host = root();
        const runtime = state();
        if (!runtime.ui?.workspaceNavOpen) {
            if (typeof done === 'function') done();
            return Promise.resolve();
        }
        if (window.__kiuWorkspaceNavClosing) {
            if (typeof done === 'function') done();
            return Promise.resolve();
        }
        const region = getSocialWorkspaceNavRegion(host);
        const panel = region?.querySelector('.social-neo-workspace-nav--overlay');
        if (!region || !panel) {
            runtime.ui.workspaceNavOpen = false;
            renderSocialPageNow('workspace-nav-close');
            if (typeof done === 'function') done();
            return Promise.resolve();
        }
        window.__kiuWorkspaceNavClosing = true;
        region.classList.remove('is-open');
        panel.classList.remove('is-open');
        return new Promise((resolve) => {
            let settled = false;
            const finish = () => {
                if (settled) return;
                settled = true;
                window.clearTimeout(workspaceNavCloseTimer);
                panel.removeEventListener('transitionend', onEnd);
                window.__kiuWorkspaceNavClosing = false;
                runtime.ui.workspaceNavOpen = false;
                renderSocialPageNow('workspace-nav-close');
                if (typeof done === 'function') done();
                resolve();
            };
            const onEnd = (event) => {
                if (event.target !== panel) return;
                if (event.propertyName && event.propertyName !== 'transform') return;
                finish();
            };
            panel.addEventListener('transitionend', onEnd);
            workspaceNavCloseTimer = window.setTimeout(finish, WORKSPACE_NAV_ANIM_MS + 40);
        });
    }

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

    function renderShellWorkspaceNav(activePanel) {
        const panels = activeNavPanels();
        const collapsed = ensureWorkspaceNavCollapsedState();
        syncWorkspaceNavCollapsedClass(collapsed);
        return `
            <button type="button" class="social-neo-workspace-rail-reveal" data-action="workspace-nav-expand" aria-label="Show workspace navigation" title="Show navigation">
                <i class="fas fa-angles-right" aria-hidden="true"></i>
                <span>Nav</span>
            </button>
            <aside class="social-neo-workspace-nav" aria-label="Social Workspace navigation" ${collapsed ? 'hidden' : ''}>
                <section class="social-neo-card social-neo-workspace-nav-card">
                    <div class="social-neo-section-head social-neo-rail-head">
                        <div class="social-neo-rail-head-copy">
                            <strong class="social-neo-rail-title">Social Workspace</strong>
                            <span class="social-neo-rail-copy">Navigate the network by product area.</span>
                        </div>
                        <button type="button" class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm social-neo-workspace-nav-collapse-btn" data-action="workspace-nav-collapse" aria-label="Hide workspace navigation" title="Hide navigation">
                            <i class="fas fa-angles-left" aria-hidden="true"></i>
                            <span>Hide</span>
                        </button>
                    </div>
                    <div class="social-neo-sidebar-nav social-neo-workspace-nav-list">
                        ${panels.map((panel) => `
                            <button class="social-neo-side-link social-neo-workspace-nav-btn ${text(activePanel) === panel.id ? 'is-active' : ''}" type="button" data-action="panel-${escape(panel.id)}">
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

    function renderSectionCommandCenter(activePanel, activeConfig, runtime) {
        // Command chrome permanently disabled; heroes own panel chrome.
        if (isSocialTopbarSkippedPanel(activePanel)) return '';
        return '';
    }

    function getSocialPanelConfig(activePanel, runtime) {
        return {
            feed: {
                title: 'Campus Home',
                description: 'Posts, updates, groups, and campus activity in one stream.',
                pills: [
                    { label: 'Posts', value: Array.isArray(runtime.feed) ? runtime.feed.length : 0 },
                    { label: 'Following', value: relationshipBuckets().connections.length },
                    { label: 'Joined groups', value: (Array.isArray(runtime.social?.groups) ? runtime.social.groups : []).filter(isJoinedGroup).length }
                ]
            },
            community: {
                title: 'People',
                description: 'Find classmates, staff, and manage your campus connections.',
                pills: [
                    { label: 'People', value: Array.isArray(runtime.directory) ? runtime.directory.length : 0 },
                    { label: 'Connections', value: relationshipBuckets().connections.length },
                    { label: 'Pending', value: relationshipBuckets().incoming.length + relationshipBuckets().outgoing.length }
                ]
            },
            groups: {
                title: 'Groups',
                description: 'Join communities for courses, clubs, and projects.',
                pills: [
                    { label: 'Groups', value: Array.isArray(runtime.social?.groups) ? runtime.social.groups.length : 0 },
                    { label: 'Joined', value: (Array.isArray(runtime.social?.groups) ? runtime.social.groups : []).filter(isJoinedGroup).length },
                    { label: 'Members', value: (Array.isArray(runtime.social?.groups) ? runtime.social.groups : []).reduce((s,g) => s + (g.memberCount||0), 0) }
                ]
            },
            workspace: {
                title: 'Project Workspaces',
                description: 'Course group projects — tasks, team chat, and delivery for student teams.',
                pills: [
                    { label: 'Workspaces', value: Array.isArray(runtime.social?.projects) ? runtime.social.projects.length : 0 },
                    { label: 'Active', value: (Array.isArray(runtime.social?.projects) ? runtime.social.projects : []).filter((project) => text(project?.status || '') === 'active').length },
                    { label: 'My role', value: roleLabel(currentUser()?.role) },
                    { label: 'Private by default', value: 'On' }
                ]
            },
            projects: {
                title: 'Portfolio',
                description: 'A polished public showcase feed to present research, builds, and capstone work for discovery.',
                pills: [
                    { label: 'Entries', value: Array.isArray(runtime.social?.projects) ? runtime.social.projects.length : 0 },
                    { label: 'Published', value: (Array.isArray(runtime.social?.projects) ? runtime.social.projects : []).filter((project) => text(project?.status || '') === 'published').length },
                    { label: 'Role', value: roleLabel(currentUser()?.role) }
                ]
            },
            pages: {
                title: 'Pages',
                description: 'Follow official labs, clubs, offices, and faculty pages.',
                pills: [
                    { label: 'Pages', value: Array.isArray(runtime.social?.pages) ? runtime.social.pages.length : 0 },
                    { label: 'Following', value: (Array.isArray(runtime.social?.pages) ? runtime.social.pages : []).filter(p => p?.isFollowing).length },
                    { label: 'Managed', value: (Array.isArray(runtime.social?.pages) ? runtime.social.pages : []).filter(isManagedPage).length }
                ]
            },
            events: {
                title: 'Campus Events',
                description: 'Track what is happening now and publish events without turning the section into a form wall.',
                pills: [
                    { label: 'Events', value: Array.isArray(runtime.social?.events) ? runtime.social.events.length : 0 },
                    { label: 'Study groups', value: (Array.isArray(runtime.social?.groups) ? runtime.social.groups : []).filter((group) => group.type === 'study' || (group.tags || []).includes('study')).length },
                    { label: 'Role', value: roleLabel(currentUser()?.role) }
                ]
            },
            surveys: {
                title: 'Campus Surveys',
                description: 'Collect feedback on courses, services, and campus life without leaving the social workspace.',
                pills: [
                    { label: 'Open', value: pendingSurveyCount() },
                    { label: 'Total', value: surveys().length },
                    { label: 'Role', value: roleLabel(currentUser()?.role) }
                ]
            },
            'lost-and-found': {
                title: 'Lost & Found',
                description: 'Help students recover lost items and keep campus handoffs organized in one place.',
                pills: [
                    { label: 'Lost', value: lostFoundActiveCount() },
                    { label: 'Found', value: lostFoundRecoveredCount() },
                    { label: 'Role', value: roleLabel(currentUser()?.role) }
                ]
            },
            messages: {
                title: 'Messages',
                description: 'Keep direct threads and group rooms moving without losing sight of the wider social inbox.',
                pills: [
                    { label: 'Chats', value: activeChats().length },
                    { label: 'Unread', value: activeChats().reduce((total, chat) => total + unreadMessages(chat), 0) },
                    { label: 'Active call', value: currentCall() ? 'Live' : 'Idle' }
                ]
            },
            alerts: {
                title: 'Alerts',
                description: 'Prioritise mentions, notices, and moderation signals in one calm inbox lane.',
                pills: [
                    { label: 'Unread', value: unreadNotifications() },
                    { label: 'Mentions', value: notificationItems().filter((notification) => classifyNotification(notification) === 'mention').length },
                    { label: 'Reports', value: Array.isArray(runtime.social?.reports) ? runtime.social.reports.length : 0 },
                    { label: 'Role', value: roleLabel(currentUser()?.role) }
                ]
            },
            profile: {
                title: 'Profile',
                description: 'Your public social identity, posts, and campus relationships.',
                pills: [
                    { label: 'Posts', value: profilePostCount(text(runtime.ui?.activeProfileUserId || currentUserId())) },
                    { label: 'Connections', value: profileFriendCount(text(runtime.ui?.activeProfileUserId || currentUserId())) },
                    { label: 'Following', value: profileFollowingCount(text(runtime.ui?.activeProfileUserId || currentUserId())) },
                    { label: 'Role', value: roleLabel(profileAccount(text(runtime.ui?.activeProfileUserId || currentUserId()))?.role || currentUser()?.role) }
                ]
            }
        };
    }

    function renderSocialFlashStatus(runtime) {
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
        return flash + status;
    }

    function renderSocialTopbarRegion(activePanel, activeConfig, user) {
        // All panels use hero chrome; shell topbar region stays empty.
        if (isSocialTopbarSkippedPanel(activePanel)) return '';
        return '';
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

    function renderGroupLeaveDialog(groupItem) {
        if (hasSocialGroupsModule() && typeof window.renderGroupLeaveDialog === 'function') {
            return window.renderGroupLeaveDialog(groupItem);
        }
        ensureSocialGroupsModule().catch(() => null);
        return '';
    }


    function renderDialog() {
        const dialog = activeDialog();
        if (!dialog) return '';
        const runtime = state();
        const kind = text(dialog.type);
        if (kind === 'photography-comments' && hasSocialPhotographyModule() && typeof window.renderPhotographyCommentsDialog === 'function') {
            return window.renderPhotographyCommentsDialog(dialog);
        }
        if (kind === 'photography-upload' && hasSocialPhotographyModule() && typeof window.renderPhotographyUploadDialog === 'function') {
            return window.renderPhotographyUploadDialog(dialog);
        }

        if (typeof window.GROUP_OWNED_DIALOG_KINDS !== 'undefined'
            ? window.GROUP_OWNED_DIALOG_KINDS.has(kind)
            : ['group-create', 'group-detail', 'group-invite', 'group-leave',
                'group-panel-media', 'group-panel-members', 'group-panel-files',
                'group-panel-links', 'group-panel-invite', 'group-panel-settings'].includes(kind)) {
            if (hasSocialGroupsModule() && typeof window.renderGroupOwnedDialog === 'function') {
                return window.renderGroupOwnedDialog(runtime, dialog);
            }
            ensureSocialGroupsModule().then(() => queueDeferredModuleRender('groups-module')).catch(() => null);
            return '';
        }

        if (typeof window.PAGES_OWNED_DIALOG_KINDS !== 'undefined'
            ? window.PAGES_OWNED_DIALOG_KINDS.has(kind)
            : ['page-about', 'page-members', 'page-create', 'page-post-compose'].includes(kind)) {
            if (hasSocialPagesModule() && typeof window.renderPagesOwnedDialog === 'function') {
                return window.renderPagesOwnedDialog(runtime, dialog);
            }
            ensureSocialPagesModule().then(() => queueDeferredModuleRender('pages-module')).catch(() => null);
            return '';
        }

        // Modules that already own full dialog renderers
        
        if (typeof window.FEED_OWNED_DIALOG_KINDS !== 'undefined'
            ? window.FEED_OWNED_DIALOG_KINDS.has(kind)
            : ['post-compose', 'post-compose-attach', 'post-edit', 'post-share', 'post-report',
                'post-delete', 'post-comments', 'comment-report', 'comment-delete'].includes(kind)) {
            if (hasSocialFeedModule() && typeof window.renderFeedOwnedDialog === 'function') {
                return window.renderFeedOwnedDialog(runtime, dialog);
            }
            ensureSocialFeedModule().then(() => queueDeferredModuleRender('feed-module')).catch(() => null);
            return '';
        }

        if (typeof window.EVENTS_OWNED_DIALOG_KINDS !== 'undefined'
            ? window.EVENTS_OWNED_DIALOG_KINDS.has(kind)
            : ['event-create', 'event-delete'].includes(kind)) {
            if (hasSocialEventsModule() && typeof window.renderEventsOwnedDialog === 'function') {
                return window.renderEventsOwnedDialog(runtime, dialog);
            }
            ensureSocialEventsModule().catch(() => null);
            return '';
        }
        if (typeof window.MESSAGES_OWNED_DIALOG_KINDS !== 'undefined'
            ? window.MESSAGES_OWNED_DIALOG_KINDS.has(kind)
            : ['message-delete', 'chat-hide'].includes(kind)) {
            if (hasSocialMessagesModule() && typeof window.renderMessagesOwnedDialog === 'function') {
                return window.renderMessagesOwnedDialog(runtime, dialog);
            }
            ensureSocialMessagesModule().catch(() => null);
            return '';
        }
        if (typeof window.PROFILE_OWNED_DIALOG_KINDS !== 'undefined'
            ? window.PROFILE_OWNED_DIALOG_KINDS.has(kind)
            : ['profile-cover'].includes(kind)) {
            if (hasSocialProfileModule() && typeof window.renderProfileOwnedDialog === 'function') {
                return window.renderProfileOwnedDialog(runtime, dialog);
            }
            ensureSocialProfileModule().catch(() => null);
            return '';
        }


        if (kind === 'lost-found-create') {
            if (hasSocialLostFoundModule() && typeof window.renderLostFoundCreateDialog === 'function') return window.renderLostFoundCreateDialog(state());
            ensureSocialLostFoundModule().catch(() => null);
            return '';
        }
        if (kind === 'lost-found-delete' || kind === 'lost-found-mark-found') {
            if (hasSocialLostFoundModule() && typeof window.renderLostFoundActionConfirmDialog === 'function') {
                const item = lostFoundItems().map((entry) => normalizeLostFoundItem(entry)).find((entry) => text(entry.id) === text(dialog.itemId));
                if (!item) return '';
                return window.renderLostFoundActionConfirmDialog(kind, item);
            }
            ensureSocialLostFoundModule().catch(() => null);
            return '';
        }
        if (kind === 'survey-create') {
            if (hasSocialSurveysModule() && typeof window.renderSurveyCreateDialog === 'function') return window.renderSurveyCreateDialog(state());
            ensureSocialSurveysModule().catch(() => null);
            return '';
        }
        if (kind === 'survey-results') {
            if (hasSocialSurveysModule() && typeof window.renderSurveyResultsDialog === 'function') {
                const survey = surveyById(dialog.surveyId);
                if (!survey) return '';
                return window.renderSurveyResultsDialog(survey, dialog.results || null);
            }
            ensureSocialSurveysModule().catch(() => null);
            return '';
        }
        if (kind === 'survey-draft-question-delete' || kind === 'survey-draft-choice-delete') {
            if (hasSocialSurveysModule() && typeof window.renderSurveyDraftDeleteConfirmDialog === 'function') {
                return window.renderSurveyDraftDeleteConfirmDialog(kind, dialog);
            }
            ensureSocialSurveysModule().catch(() => null);
            return '';
        }



        if (kind === 'entity-detail') {
            return renderEntityDetailDialog(runtime, dialog);
        }
        if (typeof window.WORKSPACE_OWNED_DIALOG_KINDS !== 'undefined'
            ? window.WORKSPACE_OWNED_DIALOG_KINDS.has(kind)
            : ['project-create', 'project-task-create', 'project-task-edit', 'project-task-graph',
                'project-task-graph-history', 'project-task-graph-schedule-help', 'project-column-tasks',
                'project-task-detail', 'project-task-delete', 'project-settings', 'project-health',
                'project-health-plan-pick', 'project-risk', 'portfolio-create', 'portfolio-editor', 'project-leave'].includes(kind)) {
            if (hasSocialWorkspaceModule() && typeof window.renderWorkspaceOwnedDialog === 'function'
                && window.renderWorkspaceOwnedDialog !== renderWorkspaceOwnedDialog) {
                return window.renderWorkspaceOwnedDialog(runtime, dialog);
            }
            ensureSocialWorkspaceModule().then(() => queueDeferredModuleRender('workspace-module')).catch(() => null);
            return '';
        }
        return '';
    }

    function renderStoryViewer() {
        return '';
    }

    function renderStoryComposer() {
        return '';
    }

    function collectCommentReactionFingerprint(comments = [], limit = 12, collected = []) {
        if (!Array.isArray(comments) || collected.length >= limit) return collected;
        comments.forEach((comment) => {
            if (collected.length >= limit) return;
            collected.push([text(comment?.id), JSON.stringify(comment?.reactionCounts || {})]);
            if (Array.isArray(comment?.replies) && comment.replies.length) {
                collectCommentReactionFingerprint(comment.replies, limit, collected);
            }
        });
        return collected;
    }

    function summarizeCommentReactions(comments = []) {
        return JSON.stringify(collectCommentReactionFingerprint(comments).slice(0, 12));
    }

    function buildFeedFingerprint(runtime) {
        const feed = Array.isArray(runtime?.feed) ? runtime.feed : [];
        const feedSlice = feed.slice(0, 24).map((post) => [
            postKey(post),
            text(post?.viewerReaction || ''),
            JSON.stringify(post?.reactionCounts || {}),
            isPostSaved(postKey(post)) ? '1' : '0',
            post?.isPinned ? '1' : '0',
            Number(post?.replyCount || 0),
            Number(post?.shareCount || 0),
            summarizeCommentReactions(post?.comments)
        ].join(':')).join('|');
        const drafts = JSON.stringify(runtime?.ui?.commentDraftByPost || {});
        const replies = JSON.stringify(runtime?.ui?.commentReplyTargetByPost || {});
        return `${feedSlice}::${drafts}::${replies}`;
    }

    function buildRelationshipsFingerprint(runtime) {
        const relationships = Array.isArray(runtime?.social?.relationships) ? runtime.social.relationships : [];
        return relationships.slice(0, 48).map((relationship) => [
            text(relationship?.id),
            text(relationship?.type),
            text(relationship?.status),
            text(relationship?.fromId),
            text(relationship?.toId)
        ].join(':')).join('|');
    }

    function buildLostFoundFingerprint(runtime) {
        const items = Array.isArray(runtime?.social?.lostFoundItems) ? runtime.social.lostFoundItems : [];
        return items.slice(0, 48).map((item) => [
            text(item?.id),
            text(item?.status),
            text(item?.expiresAt),
            text(item?.updatedAt || item?.createdAt)
        ].join(':')).join('|');
    }

    function buildSurveysFingerprint(runtime) {
        const items = Array.isArray(runtime?.social?.surveys) ? runtime.social.surveys : [];
        const responses = Array.isArray(runtime?.social?.surveyResponses) ? runtime.social.surveyResponses : [];
        const responseCount = responses.length;
        return [
            String(responseCount),
            items.slice(0, 48).map((item) => [
                text(item?.id),
                text(item?.status),
                text(item?.closesAt),
                item?.viewerHasResponded ? '1' : '0',
                item?.viewerCanRespond ? '1' : '0',
                item?.viewerCanManage ? '1' : '0',
                item?.viewerCanViewResults ? '1' : '0',
                String(item?.responseCount || 0),
                text(item?.updatedAt || item?.createdAt)
            ].join(':')).join('|')
        ].join('||');
    }

    function buildEventsFingerprint(runtime) {
        const items = Array.isArray(runtime?.social?.events) ? runtime.social.events : [];
        return [
            String(items.length),
            items.slice(0, 48).map((item) => [
                text(item?.id),
                text(item?.viewerRsvpStatus),
                item?.viewerCanEdit ? '1' : '0',
                item?.viewerCanDelete ? '1' : '0',
                Number(item?.attendeeSummary?.going || 0),
                Number(item?.attendeeSummary?.interested || 0)
            ].join(':')).join('|')
        ].join('||');
    }

    function buildGroupsFingerprint(runtime) {
        const items = Array.isArray(runtime?.social?.groups) ? runtime.social.groups : [];
        return items.slice(0, 48).map((item) => [
            text(item?.id),
            text(item?.membershipState || item?.viewerMembershipState || ''),
            item?.viewerIsMember ? '1' : '0',
            Number(item?.memberCount || 0),
            (Array.isArray(item?.pendingMemberIds) ? item.pendingMemberIds.length : 0),
            text(item?.visibility || ''),
            item?.isManager ? '1' : '0'
        ].join(':')).join('|');
    }

    function buildDirectoryFingerprint(runtime) {
        const items = Array.isArray(runtime?.directory) ? runtime.directory : [];
        return [
            String(items.length),
            items.slice(0, 48).map((item) => text(item?.id || item?.userId || '')).join(',')
        ].join(':');
    }

    function buildReportsFingerprint(runtime) {
        const items = Array.isArray(runtime?.social?.reports) ? runtime.social.reports : [];
        return items.slice(0, 48).map((item) => [
            text(item?.id),
            text(item?.reportStatus || item?.status || '')
        ].join(':')).join('|');
    }

    function buildNotificationsFingerprint(runtime) {
        const items = Array.isArray(runtime?.notifications) ? runtime.notifications : [];
        return items.slice(0, 48).map((item) => [
            text(item?.id),
            item?.isRead ? '1' : '0',
            text(item?.createdAt)
        ].join(':')).join('|');
    }

    function buildChatsFingerprint(runtime) {
        const items = Array.isArray(runtime?.chats) ? runtime.chats : [];
        return items.slice(0, 48).map((item) => [
            text(item?.id),
            Number(item?.unreadCount || 0),
            text(item?.lastMessageAt || item?.updatedAt || '')
        ].join(':')).join('|');
    }

    function buildProjectsFingerprint(runtime) {
        const items = Array.isArray(runtime?.social?.projects) ? runtime.social.projects : [];
        return items.slice(0, 48).map((item) => [
            text(item?.id),
            text(item?.status),
            String((Array.isArray(item?.tasks) ? item.tasks : []).length),
            String((Array.isArray(item?.members) ? item.members : []).length),
            text(item?.updatedAt || item?.createdAt)
        ].join(':')).join('|');
    }

    function buildPortfolioFingerprint(runtime) {
        const doc = runtime?.ui?.myPortfolio || null;
        const sections = Array.isArray(doc?.sections) ? doc.sections : [];
        const entryCount = sections.reduce((sum, section) => sum + (Array.isArray(section?.entries) ? section.entries.length : 0), 0);
        return [
            text(doc?.status || ''),
            String(sections.length),
            String(entryCount),
            text(runtime?.ui?.portfolioSaveStatus || '')
        ].join(':');
    }

    function buildPhotographyUiFingerprint(runtime) {
        const ui = runtime?.ui || {};
        return [
            text(ui.photographyTab || 'explore'),
            text(ui.photographySearch || ''),
            text(ui.photographyProfileUserId || ''),
            ui.photographyMyProfile ? '1' : '0',
            text(ui.photographyMyProfileTab || '')
        ].join(':');
    }

    function buildPagesFingerprint(runtime) {
        const pages = Array.isArray(runtime?.social?.pages) ? runtime.social.pages : [];
        return pages.slice(0, 48).map((page) => [
            text(page?.id),
            page?.isFollowing ? '1' : '0'
        ].join(':')).join('|');
    }

    function buildSocialRenderSignature(activePanel, runtime) {
        const ui = runtime?.ui || {};
        const dialog = activeDialog();
        return [
            activePanel,
            text(currentUser()?.role || 'student'),
            text(currentUserId() || ''),
            text(typeof currentFacultyCode === 'function' ? currentFacultyCode() : ''),
            text(ui.activeChatId || ''),
            JSON.stringify(ui.groupThreadSearchByChat || {}),
            JSON.stringify(ui.groupThreadPanelByChat || {}),
            JSON.stringify(ui.messageFileByChat || {}),
            JSON.stringify(ui.groupThreadJumpMessageByChat || {}),
            JSON.stringify(ui.groupThreadSearchIndexByChat || {}),
            JSON.stringify(ui.groupPanelFileFilter || {}),
            text(ui.homeFeedFilter || ''),
            text(ui.feedScopeType || ''),
            text(ui.feedScopeId || ''),
            text(ui.communityTab || ''),
            text(ui.directorySearch || ''),
            text(ui.directoryRole || 'all'),
            text(ui.groupsTab || 'discover'),
            text(ui.groupName || ''),
            text(ui.groupDescription || ''),
            text(ui.groupVisibility || 'public'),
            text(ui.groupMaxMembers || ''),
            text(ui.groupInviteSearch || ''),
            text(ui.groupInviteFaculty || 'all'),
            (Array.isArray(ui.groupInviteSelectedIds) ? ui.groupInviteSelectedIds.map((item) => text(item)).filter(Boolean).join(',') : ''),
            text(ui.eventsSubTab || ''),
            text(ui.eventsComposerSection || ''),
            text(ui.activeScopeType || ''),
            text(ui.activeScopeId || ''),
            text(ui.eventScope || ''),
            Boolean(ui.eventIsOnline),
            text(ui.eventImageFile?.name || ''),
            text(ui.messagesFilter || ''),
            text(ui.alertsFilter || ''),
            text(ui.activeProfileUserId || ''),
            text(ui.activeProjectId || ''),
            text(ui.projectTab || ''),
            text(ui.projectName || ''),
            text(ui.projectSummary || ''),
            text(ui.projectDescription || ''),
            text(ui.projectInviteSearch || ''),
            text(ui.projectInviteFaculty || 'all'),
            (Array.isArray(ui.projectInviteSelectedIds) ? ui.projectInviteSelectedIds.map((item) => text(item)).filter(Boolean).join(',') : ''),
            (Array.isArray(ui.projectFacultyCodes) ? ui.projectFacultyCodes.map((item) => text(item)).filter(Boolean).join(',') : ''),
            Boolean(ui.projectComposerOpen),
            text(ui.activePageProfileId || ''),
            text(ui.pageProfileTab || 'all'),
            Boolean(ui.pageProfileEditMode),
            text(ui.pagesSearch || ''),
            text(ui.pagePostType || 'official'),
            text(ui.pagesTab || 'discover'),
            text(ui.pageWizardStep || ''),
            ui.callOpen ? 'call-open' : 'call-closed',
            text(dialog?.type || ''),
            text(dialog?.postId || dialog?.eventId || dialog?.groupId || dialog?.chatId || dialog?.taskId || dialog?.columnId || ''),
            isPortalStoryViewerOpen() ? 'story-viewer-open' : 'story-viewer-closed',
            isPortalStoryComposerOpen() ? 'story-composer-open' : 'story-composer-closed',
            Boolean(ui.projectTaskMyOnly),
            text(ui.projectTaskSearch || ''),
            text(ui.projectTaskFilterPriority || ''),
            text(ui.projectTaskFilterAssignee || ''),
            Boolean(ui.projectTaskFilterOverdue),
            text(ui.projectTaskViewMode || 'desk'),
            text(ui.projectTaskFocus || 'all'),
            text(ui.projectTaskTimeWindow || 'all'),
            text(ui.projectTaskDeskActiveViewId || ''),
            text(ui.projectTaskDeskLink?.taskId || ''),
            text(ui.projectTaskDeskLink?.role || ''),
            text(ui.projectTaskDeskExpandedTaskId || ''),
            (Array.isArray(ui.projectTaskDeskHygieneHidden) ? ui.projectTaskDeskHygieneHidden.join(',') : ''),
            (Array.isArray(ui.projectTaskDeskCollapsedPackages) ? ui.projectTaskDeskCollapsedPackages.map((id) => text(id)).filter(Boolean).join(',') : ''),
            (Array.isArray(ui.projectTaskDeskCollapsedTreeIds) ? ui.projectTaskDeskCollapsedTreeIds.map((id) => text(id)).filter(Boolean).join(',') : ''),
            text(ui.projectTaskGraphMode || 'explore'),
            Boolean(ui.projectTaskGraphShowInferred),
            Boolean(ui.projectTaskGraphShowFlow),
            text(ui.projectTaskGraphLayout || 'force'),
            text(ui.projectHubScope || 'mine'),
            text(ui.projectHubStatus || 'all'),
            text(ui.projectHubViewMode || 'grid'),
            text(ui.lostFoundEditId || ''),
            text(ui.lostFoundSearch || ''),
            text(ui.lostFoundExpiresAt || ''),
            text(ui.surveysTab || 'available'),
            text(ui.surveysSubTab || 'student'),
            text(ui.surveysSearch || ''),
            text(ui.surveyTakingId || ''),
            text(ui.surveyResultsId || ''),
            text(ui.profileTab || ''),
            Boolean(ui.editProfileMode),
            text(ui.photographyTab || 'explore'),
            text(ui.photographySearch || ''),
            text(ui.photographyProfileUserId || ''),
            Boolean(ui.photographyMyProfile),
            text(ui.projectDiscoverSearch || ''),
            text(ui.projectDiscoverFaculty || ''),
            text(ui.projectDiscoverRole || ''),
            text(ui.projectDiscoverTag || ''),
            text(ui.projectRiskGroupId || ''),
            text(ui.projectRiskTaskId || ''),
            text(ui.projectRiskEditId || ''),
            Boolean(ui.projectRiskComposeOpen),
            (Array.isArray(ui.projectRiskExpandedGroupIds) ? ui.projectRiskExpandedGroupIds.map((id) => text(id)).filter(Boolean).join(',') : ''),
            Boolean(ui.workspaceNavCollapsed),
            text(ui.portfolioPanelTab || ''),
            Boolean(ui.portfolioCustomBuilderOpen),
            text(ui.customBuilderStep || ''),
            text(ui.customBuilderTemplate || ''),
            text(ui.customBuilderName || ''),
            JSON.stringify(Array.isArray(ui.customBuilderFields) ? ui.customBuilderFields : []),
            text(ui.portfolioSaveStatus || ''),
            text(ui.publishVisibility || ''),
            Boolean(ui.publishConsent),
            JSON.stringify(ui.openPortfolioSections || {}),
            text(ui.myPortfolio?.status || ''),
            buildFeedFingerprint(runtime),
            buildRelationshipsFingerprint(runtime),
            buildLostFoundFingerprint(runtime),
            buildSurveysFingerprint(runtime),
            buildEventsFingerprint(runtime),
            buildGroupsFingerprint(runtime),
            buildNotificationsFingerprint(runtime),
            buildChatsFingerprint(runtime),
            buildProjectsFingerprint(runtime),
            buildPortfolioFingerprint(runtime),
            buildPhotographyUiFingerprint(runtime),
            buildPagesFingerprint(runtime),
            buildDirectoryFingerprint(runtime),
            buildReportsFingerprint(runtime),
            text(runtime?.flash?.message || ''),
            text(runtime?.flash?.tone || '')
        ].join('|');
    }

    function renderSocialPageNow(reason = 'manual') {
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
            const activeConfig = (getSocialPanelConfig(activePanel, runtime)[activePanel]) || getSocialPanelConfig('feed', runtime).feed;
            const user = currentUser() || {};
            const shell = ensureSocialShell(host);
            const renderSignature = buildSocialRenderSignature(activePanel, runtime);
            const forceCenterOnly = Boolean(host.__kiuForceCenterOnly);
            host.__kiuForceCenterOnly = false;
            const forceRender = /^(feed-tab|feed-scope|feed-error|hydrate|hydrate-accounts|hydrate-error|social-bootstrap|post-created|post-updated|post-deleted|post-shared|dialog-|post-submit|connection-|community-tab|pages-tab|pages-search|page-open-profile|page-about-more|page-members-open|page-members-filter|page-members-search|page-post-compose-open|post-compose-open|post-compose-attach-filter|post-compose-attach-pick-add|post-compose-entity-remove|post-compose-attach-search|post-compose-file|page-post-file|page-profile-post|page-profile-back|page-profile-tab|page-profile-edit-|page-post-type|page-create-open|page-wizard-next|page-wizard-prev|page-follow|groups-tab|group-create-open|group-leave-wizard-next|group-leave-wizard-prev|group-member-add|group-member-remove|group-member-search|group-member-faculty|group-membership|group-request|group-member-removed|group-updated|group-left|project-create-open|portfolio-create-open|project-creator-member-add|project-creator-member-remove|project-member-search|project-invite-faculty|project-faculty-toggle|project-left|project-chat-ready|project-open-chat|project-column-tasks-|project-task-detail-|project-task-created|project-task-updated|project-task-priority-|project-task-budget|project-task-filter|project-task-search|project-task-toggle-my|project-budget-settings-saved|project-budget-category-|project-budget-expense-|directory|directory-search|directory-role|events-tab|event-create-open|event-edit-open|event-created|event-updated|event-deleted|event-rsvp|event-rsvp-optimistic|event-rsvp-rollback|lost-found-create-open|lost-found-delete|lost-found-mark-found|lost-found-save|lost-found-created|lost-found-updated|lost-found-deleted|lost-found-marked-found|lost-found-expired|panel-lost-and-found|panel-feed|panel-community|panel-events|panel-pages|panel-groups|panel-workspace|panel-projects|panel-profile|profile-view|surveys-tab|surveys-lane|surveys-input|survey-create-open|survey-create-input|survey-created|survey-take-open|survey-take-close|survey-results-open|survey-results-close|survey-response-submitted|survey-deleted|survey-closed|survey-close|survey-export|survey-question-|panel-surveys|photography-|panel-photography|message-|chat|chat-read|chat-upsert|message-sent|message-delete|message-file|chat-hide|group-thread-search-|group-thread-panel-close|thread-jump-latest|group-panel-file-filter|notification-read|notifications-refresh|panel-messages|panel-alerts|portfolio-panel-tab|mobile-nav|workspace-nav-open|workspace-nav-close|workspace-nav-collapse|workspace-nav-expand|project-task-desk-expand|project-task-desk-tree-toggle|project-task-desk-hygiene-dismiss|project-task-time-window|project-task-desk-view-save|project-task-desk-view-delete|project-task-desk-view-load|project-task-desk-view-clear|project-task-desk-link-start|project-task-desk-link-cancel|project-task-desk-link-pick|project-task-desk-dep-add-parent|project-task-desk-dep-add-child|project-task-desk-dep-remove|task-graph-group-member|escape-workspace-nav|alerts-mark|report-resolve)/.test(reason);
            if (!forceRender && reason !== 'boot' && !/-module$/.test(reason) && host.__kiuLastRenderSignature === renderSignature) {
                syncSocialOverlayLock();
                return;
            }
            const renderPlan = resolveSocialRenderPlan(reason, activePanel, runtime);
            if (isSocialTopbarSkippedPanel(activePanel)) {
                renderPlan.topbar = false;
                renderPlan.command = false;
            }
            if (forceRender && renderPlan.center && shell.center) {
                delete shell.center.__kiuLastMarkup;
            }
            if (forceCenterOnly) {
                renderPlan.flash = false;
                renderPlan.topbar = false;
                renderPlan.command = false;
                renderPlan.workspaceNav = false;
                renderPlan.drawer = false;
                renderPlan.mobileTab = false;
                renderPlan.toast = false;
                renderPlan.dialog = false;
                renderPlan.storyViewer = false;
                renderPlan.storyComposer = false;
            }
            const interactionSnapshot = captureInteractionState(host);
            shell.root.dataset.role = text(currentUser()?.role || 'student');
            shell.root.dataset.panel = activePanel;
            if (renderPlan.flash) setSocialRegionMarkup(shell.flash, renderSocialFlashStatus(runtime));
            if (renderPlan.topbar) {
                setSocialRegionMarkup(shell.topbar, renderSocialTopbarRegion(activePanel, activeConfig, user));
            } else if (isSocialTopbarSkippedPanel(activePanel)) {
                setSocialRegionMarkup(shell.topbar, '');
            }
            if (renderPlan.command) {
                setSocialRegionMarkup(shell.command, renderSectionCommandCenter(activePanel, activeConfig, runtime));
            } else if (isSocialTopbarSkippedPanel(activePanel)) {
                setSocialRegionMarkup(shell.command, '');
            }
            if (!forceCenterOnly) {
                setSocialRegionMarkup(shell.workspaceNav, renderShellWorkspaceNav(activePanel));
            }
            if (renderPlan.center) {
                setSocialRegionMarkup(shell.center, renderActivePanelMarkup(activePanel));
                /* Immediately anchor scroll to prevent visible jump between
                   innerHTML and the full restoreInteractionState call below. */
                if (!socialScrollLockActive()) {
                    try { window.scrollTo(interactionSnapshot.windowX || 0, interactionSnapshot.windowY || 0); } catch (e) {}
                } else {
                    const cs = getSocialCenterScroller(root());
                    if (cs && Number.isFinite(interactionSnapshot.centerScrollY)) cs.scrollTop = interactionSnapshot.centerScrollY;
                }
                scheduleSocialCenterScrollRepair(host);
                if (activePanel === 'events') syncEventDescScrollRails(host);
                if (typeof window.enhanceUniversalPickers === 'function') {
                    try { window.enhanceUniversalPickers(shell.center); } catch (e) {}
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
            revealShell();
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
            if (state().ui?.callOpen) {
                window.requestAnimationFrame(() => {
                    try {
                        if (typeof attachPortalCallLocalPreview === 'function') attachPortalCallLocalPreview();
                        if (typeof attachPortalCallRemotePreview === 'function') attachPortalCallRemotePreview();
                    } catch (error) {
                        console.warn('[Social] Could not attach call previews.', error);
                    }
                });
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
        const fastPath = reason === 'boot' || /^(comment-|post-react|post-save|post-pin|post-updated|post-deleted|post-shared|connection-|page-follow|page-report|flash|dialog-|survey-closed|survey-deleted|survey-response-submitted|survey-created|survey-take-|survey-results-|social-bootstrap|event-rsvp|event-created|event-deleted|event-rsvp-optimistic|event-rsvp-rollback|group-membership|group-request|group-member-removed|group-updated|group-left|notification-read|notification-removed|notifications-refresh|chat-read|chat-upsert|message-sent|message-delete|chat-hide|panel-|feed-tab|feed-scope|community-tab|pages-tab|groups-tab|events-tab|directory-search|directory-role|report-resolve|mobile-nav|alerts-filter|messages-filter|profile-view|project-|projects-back)/.test(reason);
        renderDebounceTimer = setTimeout(renderCallback, fastPath ? 0 : 80);
    }

    async function withBusy(action) {
        try {
            await action();
        } catch (error) {
            console.error('[Social] Action failed:', error);
            if (typeof setPortalSocialFlash === 'function') setPortalSocialFlash(error?.message || 'Action failed.', 'danger');
        }
    }


    /** Shared lazy-domain router for click/submit/input/change. */
    function routeSocialDomain(value, routes, { invoke, fireAndForget = false } = {}) {
        for (let i = 0; i < routes.length; i += 1) {
            const route = routes[i];
            const matched = typeof window[route.is] === 'function'
                ? window[route.is](value)
                : route.fallback(value);
            if (!matched) continue;
            if (route.has() && typeof window[route.handle] === 'function') {
                const result = invoke(window[route.handle]);
                return fireAndForget ? { matched: true } : { matched: true, result };
            }
            if (typeof route.onMissing === 'function') {
                route.ensure().then(route.onMissing).catch(() => null);
                return { matched: true };
            }
            const pending = route.ensure().then(() => {
                if (typeof window[route.handle] === 'function') {
                    return invoke(window[route.handle]);
                }
            });
            if (fireAndForget) {
                pending.catch(() => null);
                return { matched: true };
            }
            return { matched: true, result: pending };
        }
        return { matched: false };
    }

    /** Common panel tab switch: set ui key, setPanel, invalidate. Caller keeps render reason literals for source-locks. */
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

    async function handleClick(event) {
        if (event.__kiuSocialHandled) return;
        if (event.target?.closest?.('label.social-photo-upload-dropzone, input[name="photographyUploadFile"]')) return;
        const trigger = event.target.closest('[data-action]');
        if (!trigger || !socialInteractionContains(trigger)) return;
        const action = text(trigger.getAttribute('data-action'));
        if (!action) return;
        if (action === 'noop') return;
        if (trigger.matches('input[type="file"]')) return;
        const draggedNode = trigger.classList?.contains('social-project-task-graph-node-g')
            ? trigger
            : trigger.closest?.('.social-project-task-graph-node-g');
        if (draggedNode?.dataset?.kiuDragged === '1') {
            delete draggedNode.dataset.kiuDragged;
            return;
        }
        if (draggedNode?.dataset?.kiuGraphSelected === '1') {
            delete draggedNode.dataset.kiuGraphSelected;
            return;
        }
        event.__kiuSocialHandled = true;
        event.preventDefault();

        if (action === 'panel-feed') {
            const filter = text(trigger.getAttribute('data-home-filter'));
            const sw = beginShellPanelTabSwitch({
                panel: 'feed',
                tab: filter,
                uiKey: 'homeFeedFilter',
                defaultTab: 'all'
            });
            if (sw.tabChanged) return renderSocialPageNow('feed-tab');
            return renderSocialPageNow('panel-feed');
        }
        if (action === 'panel-community') {
            const tab = text(trigger.getAttribute('data-community-tab'));
            const sw = beginShellPanelTabSwitch({
                panel: 'community',
                tab,
                uiKey: 'communityTab',
                defaultTab: 'people'
            });
            if (sw.tabChanged) return renderSocialPageNow('community-tab');
            return renderSocialPageNow('panel-community');
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
                return renderSocialPageNow('events-tab');
            }
            return renderSocialPageNow('panel-events');
        }
        if (action === 'panel-lost-found' || action === 'panel-lost-and-found') {
            setPanel('lost-and-found');
            return withBusy(async () => {
                await pruneExpiredLostFoundItems();
                renderSocialPageNow('panel-lost-and-found');
            });
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
            if (sw.tabChanged) return renderSocialPageNow('surveys-tab');
            return renderSocialPageNow('panel-surveys');
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
            // Already on photography with only a tab change — swap feed stage only.
            if (wasOnPhotography && tab && tab !== previousTab && refreshPhotographyPanelStage()) {
                return;
            }
            if (wasOnPhotography && !tab && refreshPhotographyPanelStage()) {
                return;
            }
            invalidateSocialRenderCache({ center: true });
            if (!wasOnPhotography || (tab && tab !== previousTab)) {
                return renderSocialPageNow(tab && wasOnPhotography ? 'photography-tab' : 'panel-photography');
            }
            return renderSocialPageNow('panel-photography');
        }
        if (action === 'panel-groups') {
            const tab = text(trigger.getAttribute('data-groups-tab'));
            if (tab) state().ui.groupsTab = tab;
            setPanel('groups');
            invalidateSocialRenderCache({ center: true });
            if (tab) return renderSocialPageNow('groups-tab');
            return renderSocialPageNow('panel-groups');
        }
        if (action === 'panel-workspace') {
            state().ui.activeProjectId = '';
            state().ui.projectTab = 'overview';
            setPanel('workspace');
            invalidateSocialRenderCache({ center: true });
            return renderSocialPageNow('panel-workspace');
        }
        if (action === 'panel-projects') {
            state().ui.activeProjectId = '';
            state().ui.projectTab = 'overview';
            setPanel('projects');
            invalidateSocialRenderCache({ center: true });
            return renderSocialPageNow('panel-projects');
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
            if (profileWasOpen) return renderSocialPageNow('page-profile-back');
            if (wasOnPages && tab && tab !== previousTab) {
                return renderSocialPageNow('pages-tab');
            }
            return renderSocialPageNow('panel-pages');
        }
        if (action === 'panel-messages') {
            const filter = text(trigger.getAttribute('data-messages-filter'));
            const wasOnMessages = text(state().ui?.activePanel) === 'messages';
            const previousFilter = text(state().ui?.messagesFilter || 'all');
            if (filter) state().ui.messagesFilter = filter;
            setPanel('messages');
            const activeChatId = text(state().ui?.activeChatId || '');
            if (activeChatId && typeof markPortalChatMessagesRead === 'function') {
                markPortalChatMessagesRead(activeChatId).catch(() => null);
            }
            invalidateSocialRenderCache({ center: true });
            if (wasOnMessages && filter && filter !== previousFilter) {
                return renderSocialPageNow('messages-filter');
            }
            return renderSocialPageNow('panel-messages');
        }
        if (action === 'panel-alerts') {
            const filter = text(trigger.getAttribute('data-alerts-filter'));
            const wasOnAlerts = text(state().ui?.activePanel) === 'alerts';
            const previousFilter = text(state().ui?.alertsFilter || 'all');
            if (filter) state().ui.alertsFilter = filter;
            if (typeof refreshPortalNotifications === 'function') {
                return withBusy(async () => {
                    await refreshPortalNotifications(true);
                    setPanel('alerts');
                    invalidateSocialRenderCache({ center: true });
                    if (wasOnAlerts && filter && filter !== previousFilter) {
                        renderSocialPageNow('alerts-filter');
                        return;
                    }
                    renderSocialPageNow('panel-alerts');
                });
            }
            setPanel('alerts');
            invalidateSocialRenderCache({ center: true });
            if (wasOnAlerts && filter && filter !== previousFilter) {
                return renderSocialPageNow('alerts-filter');
            }
            return renderSocialPageNow('panel-alerts');
        }
        if (action === 'panel-profile') {
            state().ui.activeProfileUserId = text(trigger.getAttribute('data-user-id') || currentUserId());
            setPanel('profile');
            invalidateSocialRenderCache({ center: true });
            return renderSocialPageNow('panel-profile');
        }
        if (action === 'toast-dismiss') {
            const toastHost = trigger.closest?.('[data-toast-id]') || trigger;
            const toastId = toastHost.getAttribute?.('data-toast-id') || trigger.getAttribute('data-toast-id');
            if (toastId && typeof dismissPortalSocialToast === 'function') dismissPortalSocialToast(toastId);
            return;
        }
        if (action === 'dialog-close') {
            if (shouldRestoreStackedDialog(activeDialog()?.type || '')) {
                restorePreviousDialog();
            } else {
                closeDialog();
            }
            return;
        }
        if (action === 'workspace-nav-open') {
            state().ui.workspaceNavOpen = true;
            return renderSocialPageNow('workspace-nav-open');
        }
        if (action === 'workspace-nav-close') {
            return closeSocialWorkspaceNavAnimated();
        }
        if (action === 'workspace-nav-collapse') {
            setWorkspaceNavCollapsed(true);
            return renderSocialPageNow('workspace-nav-collapse');
        }
        if (action === 'workspace-nav-expand') {
            setWorkspaceNavCollapsed(false);
            return renderSocialPageNow('workspace-nav-expand');
        }
        if (action === 'shell-drawer-open') {
            state().ui.workspaceNavOpen = false;
            state().ui.shellDrawerOpen = true;
            return renderSocialPageNow('shell-drawer-open');
        }
        if (action === 'shell-drawer-close') {
            state().ui.shellDrawerOpen = false;
            return renderSocialPageNow('shell-drawer-close');
        }
        if (action === 'composer-attach') {
            const host = trigger.closest('form[data-form="post-compose"]') || root();
            return host?.querySelector('input[name="postFile"]')?.click();
        }
        if (action === 'entity-link-open') {
            const type = text(trigger.getAttribute('data-entity-type') || '').toLowerCase();
            const id = text(trigger.getAttribute('data-entity-id') || '');
            if (!type || !id) return;
            if (type === 'group' && findSocialGroupById(id)) {
                setPanel('groups');
                return openDialog('group-detail', { groupId: id });
            }
            return openDialog('entity-detail', { entityType: type, entityId: id });
        }
        if (action === 'entity-goto') {
            const type = text(trigger.getAttribute('data-entity-type') || '').toLowerCase();
            const id = text(trigger.getAttribute('data-entity-id') || '');
            if (!type || !id) return;
            state().ui.socialDialog = null;
            state().ui.previousDialog = null;
            return navigateToEntity(type, id);
        }

        const clickDomain = routeSocialDomain(action, [
            {
                is: 'isSocialWorkspaceClickAction',
                fallback: (a) => a === 'projects-back' || String(a || '').startsWith('project-') || String(a || '').startsWith('portfolio-'),
                has: hasSocialWorkspaceModule,
                ensure: ensureSocialWorkspaceModule,
                handle: 'handleSocialWorkspaceClick',
                onMissing: () => queueDeferredModuleRender('workspace-module')
            },
            {
                is: 'isSocialGroupsClickAction',
                fallback: (a) => String(a || '').startsWith('group-'),
                has: hasSocialGroupsModule,
                ensure: ensureSocialGroupsModule,
                handle: 'handleSocialGroupsClick'
            },
            {
                is: 'isSocialPagesClickAction',
                fallback: (a) => String(a || '').startsWith('page-') || a === 'pages-search-clear',
                has: hasSocialPagesModule,
                ensure: ensureSocialPagesModule,
                handle: 'handleSocialPagesClick'
            },
            {
                is: 'isSocialSurveysClickAction',
                fallback: (a) => String(a || '').startsWith('survey-') || String(a || '').startsWith('surveys-'),
                has: hasSocialSurveysModule,
                ensure: ensureSocialSurveysModule,
                handle: 'handleSocialSurveysClick'
            },
            {
                is: 'isSocialPhotographyClickAction',
                fallback: (a) => String(a || '').startsWith('photography-'),
                has: hasSocialPhotographyModule,
                ensure: ensureSocialPhotographyModule,
                handle: 'handleSocialPhotographyClick'
            },
            {
                is: 'isSocialEventsClickAction',
                fallback: (a) => String(a || '').startsWith('event-') || String(a || '').startsWith('events-'),
                has: hasSocialEventsModule,
                ensure: ensureSocialEventsModule,
                handle: 'handleSocialEventsClick'
            },
            {
                is: 'isSocialFeedClickAction',
                fallback: (a) => String(a || '').startsWith('post-')
                    || String(a || '').startsWith('comment-')
                    || String(a || '').startsWith('story-')
                    || a === 'focus-feed'
                    || a === 'feed-refresh',
                has: hasSocialFeedModule,
                ensure: ensureSocialFeedModule,
                handle: 'handleSocialFeedClick'
            },
            {
                is: 'isSocialLostFoundClickAction',
                fallback: (a) => String(a || '').startsWith('lost-found-'),
                has: hasSocialLostFoundModule,
                ensure: ensureSocialLostFoundModule,
                handle: 'handleSocialLostFoundClick'
            },
            {
                is: 'isSocialProfileClickAction',
                fallback: (a) => String(a || '').startsWith('profile-'),
                has: hasSocialProfileModule,
                ensure: ensureSocialProfileModule,
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
                has: hasSocialMessagesModule,
                ensure: ensureSocialMessagesModule,
                handle: 'handleSocialMessagesClick'
            },
            {
                is: 'isSocialAlertsClickAction',
                fallback: (a) => String(a || '').startsWith('notification-')
                    || String(a || '').startsWith('alerts-')
                    || a === 'report-resolve',
                has: hasSocialAlertsModule,
                ensure: ensureSocialAlertsModule,
                handle: 'handleSocialAlertsClick'
            },
            {
                is: 'isSocialCommunityClickAction',
                fallback: (a) => String(a || '').startsWith('connection-') || String(a || '').startsWith('person-'),
                has: hasSocialCommunityModule,
                ensure: ensureSocialCommunityModule,
                handle: 'handleSocialCommunityClick'
            }
        ], { invoke: (handler) => handler(action, trigger) });
        if (clickDomain.matched) return clickDomain.result;
    }

    async function handleSubmit(event) {
        const form = event.target.closest('form[data-form]');
        if (!form || !socialInteractionContains(form)) return;
        event.preventDefault();
        const formType = text(form.getAttribute('data-form'));
        const runtime = state();

        const submitDomain = routeSocialDomain(formType, [
            {
                is: 'isSocialWorkspaceSubmitForm',
                fallback: (t) => t === 'create-project' || t === 'create-portfolio' || t === 'portfolio-settings' || t === 'project-settings' || String(t || '').startsWith('project-') || String(t || '').startsWith('dialog-project'),
                has: hasSocialWorkspaceModule,
                ensure: ensureSocialWorkspaceModule,
                handle: 'handleSocialWorkspaceSubmit'
            },
            {
                is: 'isSocialGroupsSubmitForm',
                fallback: (t) => t === 'create-group' || t === 'group-settings' || t === 'dialog-group-invite' || t === 'dialog-group-leave',
                has: hasSocialGroupsModule,
                ensure: ensureSocialGroupsModule,
                handle: 'handleSocialGroupsSubmit'
            },
            {
                is: 'isSocialFeedSubmitForm',
                fallback: (t) => t === 'post-compose' || t === 'comment' || t === 'dialog-comment' || t === 'add-story' || String(t || '').startsWith('dialog-post-') || String(t || '').startsWith('dialog-comment-'),
                has: hasSocialFeedModule,
                ensure: ensureSocialFeedModule,
                handle: 'handleSocialFeedSubmit'
            },
            {
                is: 'isSocialPagesSubmitForm',
                fallback: (t) => t === 'create-page' || t === 'pages-search' || t === 'update-page-profile' || t === 'page-profile-post',
                has: hasSocialPagesModule,
                ensure: ensureSocialPagesModule,
                handle: 'handleSocialPagesSubmit'
            },
            {
                is: 'isSocialEventsSubmitForm',
                fallback: (t) => t === 'create-event' || t === 'dialog-event-delete',
                has: hasSocialEventsModule,
                ensure: ensureSocialEventsModule,
                handle: 'handleSocialEventsSubmit'
            },
            {
                is: 'isSocialSurveysSubmitForm',
                fallback: (t) => String(t || '').startsWith('survey-') || String(t || '').startsWith('dialog-survey-'),
                has: hasSocialSurveysModule,
                ensure: ensureSocialSurveysModule,
                handle: 'handleSocialSurveysSubmit'
            },
            {
                is: 'isSocialPhotographySubmitForm',
                fallback: (t) => t === 'photography-upload',
                has: hasSocialPhotographyModule,
                ensure: ensureSocialPhotographyModule,
                handle: 'handleSocialPhotographySubmit'
            },
            {
                is: 'isSocialLostFoundSubmitForm',
                fallback: (t) => t === 'lost-found-item' || String(t || '').startsWith('dialog-lost-found-'),
                has: hasSocialLostFoundModule,
                ensure: ensureSocialLostFoundModule,
                handle: 'handleSocialLostFoundSubmit'
            },
            {
                is: 'isSocialMessagesSubmitForm',
                fallback: (t) => t === 'send-message' || t === 'dialog-message-delete' || t === 'dialog-chat-hide',
                has: hasSocialMessagesModule,
                ensure: ensureSocialMessagesModule,
                handle: 'handleSocialMessagesSubmit'
            },
            {
                is: 'isSocialProfileSubmitForm',
                fallback: (t) => t === 'edit-profile' || t === 'dialog-profile-cover',
                has: hasSocialProfileModule,
                ensure: ensureSocialProfileModule,
                handle: 'handleSocialProfileSubmit'
            }
        ], { invoke: (handler) => handler(formType, form, runtime, event) });
        if (submitDomain.matched) return submitDomain.result;
    }

    function handlePointerDown(event) {
        const target = event.target;
        if (!target || !socialInteractionContains(target)) return;
        const submitBtn = target.closest?.('.social-neo-survey-submit-btn');
        if (submitBtn) {
            rippleSurveySubmitButton(submitBtn, event);
            return;
        }
        const input = target.matches?.('.social-neo-survey-take-choice input[type="radio"], .social-neo-survey-take-choice input[type="checkbox"]')
            ? target
            : null;
        const label = input
            ? input.closest('.social-neo-survey-take-choice')
            : target.closest?.('.social-neo-survey-take-choice');
        if (!label) return;
        rippleSurveyChoiceLabel(label, event);
    }

    function handleInput(event) {
        const runtime = state();
        const target = event.target;
        if (!target || !socialInteractionContains(target)) return;

        const inputDomain = routeSocialDomain(target, [
            {
                is: 'isSocialWorkspaceInputTarget',
                fallback: () => false,
                has: hasSocialWorkspaceModule,
                ensure: ensureSocialWorkspaceModule,
                handle: 'handleSocialWorkspaceInput'
            },
            {
                is: 'isSocialFeedInputTarget',
                fallback: () => false,
                has: hasSocialFeedModule,
                ensure: ensureSocialFeedModule,
                handle: 'handleSocialFeedInput'
            },
            {
                is: 'isSocialCommunityInputTarget',
                fallback: () => false,
                has: hasSocialCommunityModule,
                ensure: ensureSocialCommunityModule,
                handle: 'handleSocialCommunityInput'
            },
            {
                is: 'isSocialPagesInputTarget',
                fallback: () => false,
                has: hasSocialPagesModule,
                ensure: ensureSocialPagesModule,
                handle: 'handleSocialPagesInput'
            },
            {
                is: 'isSocialGroupsInputTarget',
                fallback: () => false,
                has: hasSocialGroupsModule,
                ensure: ensureSocialGroupsModule,
                handle: 'handleSocialGroupsInput'
            },
            {
                is: 'isSocialEventsInputTarget',
                fallback: () => false,
                has: hasSocialEventsModule,
                ensure: ensureSocialEventsModule,
                handle: 'handleSocialEventsInput'
            },
            {
                is: 'isSocialSurveysInputTarget',
                fallback: () => false,
                has: hasSocialSurveysModule,
                ensure: ensureSocialSurveysModule,
                handle: 'handleSocialSurveysInput'
            },
            {
                is: 'isSocialProfileInputTarget',
                fallback: () => false,
                has: hasSocialProfileModule,
                ensure: ensureSocialProfileModule,
                handle: 'handleSocialProfileInput'
            },
            {
                is: 'isSocialAlertsInputTarget',
                fallback: () => false,
                has: hasSocialAlertsModule,
                ensure: ensureSocialAlertsModule,
                handle: 'handleSocialAlertsInput'
            },
            {
                is: 'isSocialPhotographyInputTarget',
                fallback: () => false,
                has: hasSocialPhotographyModule,
                ensure: ensureSocialPhotographyModule,
                handle: 'handleSocialPhotographyInput'
            },
            {
                is: 'isSocialLostFoundInputTarget',
                fallback: () => false,
                has: hasSocialLostFoundModule,
                ensure: ensureSocialLostFoundModule,
                handle: 'handleSocialLostFoundInput'
            },
            {
                is: 'isSocialMessagesInputTarget',
                fallback: () => false,
                has: hasSocialMessagesModule,
                ensure: ensureSocialMessagesModule,
                handle: 'handleSocialMessagesInput'
            }
        ], {
            fireAndForget: true,
            invoke: (handler) => handler(target, runtime, event)
        });
        if (inputDomain.matched) return;

        syncCommentDraftFromTarget(target);
    }

    function handleChange(event) {
        if (event.__kiuSocialChangeHandled) return;
        const runtime = state();
        const target = event.target;
        if (!target || !socialInteractionContains(target)) return;

        const changeDomain = routeSocialDomain(target, [
            {
                is: 'isSocialWorkspaceChangeTarget',
                fallback: (t) => t.name === 'projectMediaFile',
                has: hasSocialWorkspaceModule,
                ensure: ensureSocialWorkspaceModule,
                handle: 'handleSocialWorkspaceChange'
            },
            {
                is: 'isSocialFeedChangeTarget',
                fallback: () => false,
                has: hasSocialFeedModule,
                ensure: ensureSocialFeedModule,
                handle: 'handleSocialFeedChange'
            },
            {
                is: 'isSocialCommunityChangeTarget',
                fallback: () => false,
                has: hasSocialCommunityModule,
                ensure: ensureSocialCommunityModule,
                handle: 'handleSocialCommunityChange'
            },
            {
                is: 'isSocialPagesChangeTarget',
                fallback: () => false,
                has: hasSocialPagesModule,
                ensure: ensureSocialPagesModule,
                handle: 'handleSocialPagesChange'
            },
            {
                is: 'isSocialGroupsChangeTarget',
                fallback: () => false,
                has: hasSocialGroupsModule,
                ensure: ensureSocialGroupsModule,
                handle: 'handleSocialGroupsChange'
            },
            {
                is: 'isSocialEventsChangeTarget',
                fallback: () => false,
                has: hasSocialEventsModule,
                ensure: ensureSocialEventsModule,
                handle: 'handleSocialEventsChange'
            },
            {
                is: 'isSocialSurveysChangeTarget',
                fallback: () => false,
                has: hasSocialSurveysModule,
                ensure: ensureSocialSurveysModule,
                handle: 'handleSocialSurveysChange'
            },
            {
                is: 'isSocialProfileChangeTarget',
                fallback: () => false,
                has: hasSocialProfileModule,
                ensure: ensureSocialProfileModule,
                handle: 'handleSocialProfileChange'
            },
            {
                is: 'isSocialLostFoundChangeTarget',
                fallback: () => false,
                has: hasSocialLostFoundModule,
                ensure: ensureSocialLostFoundModule,
                handle: 'handleSocialLostFoundChange'
            },
            {
                is: 'isSocialMessagesChangeTarget',
                fallback: () => false,
                has: hasSocialMessagesModule,
                ensure: ensureSocialMessagesModule,
                handle: 'handleSocialMessagesChange'
            },
            {
                is: 'isSocialPhotographyChangeTarget',
                fallback: () => false,
                has: hasSocialPhotographyModule,
                ensure: ensureSocialPhotographyModule,
                handle: 'handleSocialPhotographyChange'
            }
        ], {
            fireAndForget: true,
            invoke: (handler) => handler(target, runtime, event)
        });
        if (changeDomain.matched) return;

        syncCommentDraftFromTarget(target);
    }

    function handleGlobalKeydown(event) {
        const host = root();
        if (!host) return;
        const activeTag = String(document.activeElement?.tagName || '').toLowerCase();
        const isTyping = ['input', 'textarea', 'select'].includes(activeTag) || Boolean(document.activeElement?.isContentEditable);
        if (event.key === 'Escape') {
            const runtime = state();
            if (runtime.ui?.socialDialog) {
                event.preventDefault();
                closeDialog();
                return;
            }
            if (runtime.ui?.workspaceNavOpen) {
                event.preventDefault();
                closeSocialWorkspaceNavAnimated();
                return;
            }
            if (runtime.ui?.shellDrawerOpen) {
                event.preventDefault();
                runtime.ui.shellDrawerOpen = false;
                renderSocialPageNow('escape-shell-drawer');
                return;
            }
            if (typeof isPortalStoryViewerOpen === 'function' && isPortalStoryViewerOpen()) {
                event.preventDefault();
                if (typeof closePortalStoryViewer === 'function') closePortalStoryViewer();
                return;
            }
            if (typeof isPortalStoryComposerOpen === 'function' && isPortalStoryComposerOpen()) {
                event.preventDefault();
                if (typeof closePortalStoryComposer === 'function') closePortalStoryComposer();
                return;
            }
        }
        if ((event.ctrlKey || event.metaKey) && String(event.key || '').toLowerCase() === 'k') {
            event.preventDefault();
            const search = host.querySelector('input[type="search"], input[name="lostFoundSearch"], [data-bind="directory-search"], [data-bind="pages-search"], [name="projectDiscoverSearch"]');
            if (search && typeof search.focus === 'function') search.focus({ preventScroll: false });
            return;
        }
        if (!isTyping && event.key === '/') {
            const search = host.querySelector('input[type="search"], input[name="lostFoundSearch"], [data-bind="directory-search"], [data-bind="pages-search"], [name="projectDiscoverSearch"]');
            if (search && typeof search.focus === 'function') {
                event.preventDefault();
                search.focus({ preventScroll: false });
            }
        }
        if (!isTyping && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
            const focused = document.activeElement;
            if (focused?.getAttribute('role') === 'tab') {
                const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
                const idx = tabs.indexOf(focused);
                if (idx >= 0) {
                    const next = event.key === 'ArrowRight'
                        ? tabs[(idx + 1) % tabs.length]
                        : tabs[(idx - 1 + tabs.length) % tabs.length];
                    if (next) {
                        next.focus();
                        next.click();
                        event.preventDefault();
                    }
                }
            }
        }
    }

    let portalEventAbort = null;
    let overlayCaptureClickBound = false;
    let overlayCaptureChangeBound = false;

    function handlePhotographyUploadDragEnter(event) {
        const dropzone = event.target?.closest?.('[data-photography-drop]');
        if (!dropzone) return;
        event.preventDefault();
        dropzone.classList.add('is-dragover');
    }

    function handlePhotographyUploadDragOver(event) {
        const dropzone = event.target?.closest?.('[data-photography-drop]');
        if (!dropzone) return;
        event.preventDefault();
        dropzone.classList.add('is-dragover');
    }

    function handlePhotographyUploadDragLeave(event) {
        const dropzone = event.target?.closest?.('[data-photography-drop]');
        if (!dropzone) return;
        const related = event.relatedTarget;
        if (related && dropzone.contains(related)) return;
        dropzone.classList.remove('is-dragover');
    }

    function handlePhotographyUploadDrop(event) {
        const dropzone = event.target?.closest?.('[data-photography-drop]');
        if (!dropzone) return;
        event.preventDefault();
        dropzone.classList.remove('is-dragover');
        const file = event.dataTransfer?.files?.[0] || null;
        if (file) applyPhotographyUploadFile(file);
    }

    function bindPhotographyUploadPortalEvents(portal, signal) {
        portal.addEventListener('dragenter', handlePhotographyUploadDragEnter, { signal });
        portal.addEventListener('dragover', handlePhotographyUploadDragOver, { signal });
        portal.addEventListener('dragleave', handlePhotographyUploadDragLeave, { signal });
        portal.addEventListener('drop', handlePhotographyUploadDrop, { signal });
    }

    function bindOverlayCaptureClick() {
        if (overlayCaptureClickBound) return;
        document.addEventListener('click', (event) => {
            const portal = document.getElementById(SOCIAL_OVERLAY_PORTAL_ID);
            if (!portal || !portal.contains(event.target)) return;
            if (!portal.querySelector(SOCIAL_OVERLAY_SURFACE_SELECTOR)) return;
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
        ensureSocialOverlayPortal();
        ensurePhotographyUploadFileSink();
        bindOverlayCaptureClick();
        bindOverlayCaptureChange();
        bindOverlayPortalEvents();
        if (bound && boundHost === host) {
            return;
        }
        if (hostEventAbort) {
            hostEventAbort.abort();
            hostEventAbort = null;
        }
        hostEventAbort = new AbortController();
        const { signal } = hostEventAbort;
        host.addEventListener('click', handleClick, { signal });
        host.addEventListener('pointerdown', handlePointerDown, { signal });
        host.addEventListener('submit', handleSubmit, { signal });
        host.addEventListener('input', handleInput, { signal });
        host.addEventListener('change', handleChange, { signal });
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
        boundHost = host;
        bound = true;
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

    async function boot() {
        ensureSocialRouteHost();
        bindEvents();
        guardStandaloneSocialRoute();
        window.__kiuSocialLiteRenderPage = renderSocialPageNow;
        window.__kiuSocialPatchPostReactions = patchPostReactions;
        window.__kiuSocialPatchCommentReactions = patchCommentReactionsByIds;
        window.__kiuSocialPatchEventRsvp = patchEventRsvpButtons;
        applyShellIdentity(true);
        const runHydrate = typeof ensurePortalSocialRuntimeLoaded === 'function'
            ? () => Promise.resolve(ensurePortalSocialRuntimeLoaded()).catch(() => null)
            : typeof hydratePortalSocialRuntime === 'function'
                ? () => Promise.resolve(hydratePortalSocialRuntime()).catch(() => null)
                : null;
        if (runHydrate) await runHydrate();
        await pruneExpiredLostFoundItems().catch(() => null);
        window.requestAnimationFrame(renderOrRetry);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { boot().catch(() => null); }, { once: true });
    } else {
        boot().catch(() => null);
    }


})();
