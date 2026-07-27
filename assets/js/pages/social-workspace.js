(function initSocialWorkspaceModule() {
    if (window.__KIU_SOCIAL_WORKSPACE_MODULE_LOADED) return;

    const __kiuSwApi = window.KiuSocialWorkspace || {};
    window.KiuSocialWorkspace = __kiuSwApi;
    window.__kiuSocialWorkspaceExports = __kiuSwApi;
    if (window.SocialUiKernel) Object.assign(__kiuSwApi, window.SocialUiKernel);
    window.SocialUiKernel = window.SocialUiKernel || __kiuSwApi;

    const hooks = window.__kiuSocialWorkspaceHooks || {};
    const {
        text, escape, socialNeoEmptyHero = window.socialNeoEmptyHero, socialNeoEmpty = window.socialNeoEmpty, socialNeoDialogHead = window.socialNeoDialogHead,
        socialNeoDialogHeadHtml = window.socialNeoDialogHeadHtml, socialNeoDialogActions = window.socialNeoDialogActions, socialNeoField = window.socialNeoField, socialNeoFieldHtml = window.socialNeoFieldHtml, socialNeoSectionHead = window.socialNeoSectionHead,
        uniqueStrings, currentFacultyCode, currentUserId, displayName, roleLabel,
        accountById, avatar, accountSubtitle, facultyLabel, controlId,
        toDateTimeLocalValue, resolveActiveSocialProject, fileUrl, isImage, when,
        computeTaskMatrixBucket, computeTaskMatrixScore, countNum, formatTaskTime, normalizeTaskScore1to5,
        normalizeTaskTime, normalizeTaskTimeUnit, formatProjectTaskBudgetEstimate, formatTaskCostVariance, formatTaskTimeVariance,
        normalizeProjectTaskStatusId, projectTaskDownstreamIds, normalizeProjectPlanHorizon, projectPlanHorizonLabel, resolveTaskPackageId,
        state, ensureSocialMessagesModule, ensureProjectWorkspaceChat, hasSocialMessagesModule, isAccountOnline,
        isStaffAccount, queueDeferredModuleRender, readDeskSavedViews, renderProjectWorkspaceNavButtons, renderSocialPageNow,
        resolveProjectWorkspaceChat, setActiveChat, taskActivityMs, activeDialog, currentUser,
        getSafeSocialExternalUrl, buildProjectTaskFlowEdges, openDialog, openProjectRiskForTask, renderDialogOnlyNow,
        withBusy, migrateProjectPlanEntry, patchPortfolioSaveStatus, portfolioEditorFormRoot, closeDialog,
        restorePreviousDialog, invalidateSocialRenderCache, setPanel, root, scrollSocialCenterTo,
        getSocialCenterMaxScroll, getSocialCenterScroller, ensureSocialCenterScrollBounds, buildSocialRenderSignature, patchProjectHealthPlanCard,
        patchProjectHealthPlanPick, writeDeskSavedViews, assertUniqueProjectTaskTitle, createPortalSocialProject, createPortalSocialProjectBudgetCategory,
        createPortalSocialProjectBudgetExpense, createPortalSocialProjectRisk, createPortalSocialProjectTask, deletePortalSocialProjectTask, focusSocialDialog,
        fromDateTimeLocalValue, parseDependsOnFromForm, parseProjectTaskActualsPayload, parseProjectTaskBudgetEstimate, parseProjectTaskPriorityPayload,
        setPortalSocialFlash, setPortalSocialProjectMembership, syncSocialOverlayLock, updatePortalSocialProject, updatePortalSocialProjectRisk,
        updatePortalSocialProjectTask, queueProjectInviteSearchRefresh, syncPortfolioEditorInput, syncTaskChecklistInput,
    } = hooks;
    const neoField = typeof socialNeoField === 'function' ? socialNeoField : () => '';
    const neoHead = typeof socialNeoDialogHead === 'function' ? socialNeoDialogHead : () => '';
    const neoHeadHtml = typeof socialNeoDialogHeadHtml === 'function' ? socialNeoDialogHeadHtml : () => '';
    const neoActions = typeof socialNeoDialogActions === 'function' ? socialNeoDialogActions : () => '';
    const neoSection = typeof socialNeoSectionHead === 'function' ? socialNeoSectionHead : () => '';


        const requiredHooks = {
        text, escape, uniqueStrings, currentFacultyCode, currentUserId,
        displayName, roleLabel, accountById, avatar, accountSubtitle,
        facultyLabel, controlId, toDateTimeLocalValue, resolveActiveSocialProject, fileUrl,
        isImage, when, computeTaskMatrixBucket, computeTaskMatrixScore, countNum,
        formatTaskTime, normalizeTaskScore1to5, normalizeTaskTime, normalizeTaskTimeUnit, formatProjectTaskBudgetEstimate,
        formatTaskCostVariance, formatTaskTimeVariance, normalizeProjectTaskStatusId, projectTaskDownstreamIds, normalizeProjectPlanHorizon,
        projectPlanHorizonLabel, resolveTaskPackageId, state, ensureSocialMessagesModule, ensureProjectWorkspaceChat,
        hasSocialMessagesModule, isAccountOnline, isStaffAccount, queueDeferredModuleRender, readDeskSavedViews,
        renderProjectWorkspaceNavButtons, renderSocialPageNow, resolveProjectWorkspaceChat, setActiveChat, taskActivityMs,
        activeDialog, currentUser, getSafeSocialExternalUrl, buildProjectTaskFlowEdges, openDialog,
        openProjectRiskForTask, renderDialogOnlyNow, withBusy, migrateProjectPlanEntry, patchPortfolioSaveStatus,
        portfolioEditorFormRoot, closeDialog, restorePreviousDialog, invalidateSocialRenderCache, setPanel,
        root, patchProjectHealthPlanCard, patchProjectHealthPlanPick, writeDeskSavedViews, assertUniqueProjectTaskTitle,
        createPortalSocialProject, createPortalSocialProjectBudgetCategory, createPortalSocialProjectBudgetExpense, createPortalSocialProjectRisk, createPortalSocialProjectTask,
        deletePortalSocialProjectTask, focusSocialDialog, fromDateTimeLocalValue, parseDependsOnFromForm, parseProjectTaskActualsPayload,
        parseProjectTaskBudgetEstimate, parseProjectTaskPriorityPayload, setPortalSocialFlash, setPortalSocialProjectMembership, syncSocialOverlayLock,
        updatePortalSocialProject, updatePortalSocialProjectRisk, updatePortalSocialProjectTask, queueProjectInviteSearchRefresh, syncPortfolioEditorInput,
        syncTaskChecklistInput,
    };
    for (const [name, fn] of Object.entries(requiredHooks)) {
        if (typeof fn !== 'function') {
            throw new Error(`Social workspace hooks are unavailable: ${name}`);
        }
    }



    // More pure graph/desk helpers from social-workspace-graph-model.js
    const filterProjectBoardTasks = window.filterProjectBoardTasks || (window.KiuSocialWorkspaceGraphModel || {}).filterProjectBoardTasks;
    const resolveProjectTaskPriorityDisplay = window.resolveProjectTaskPriorityDisplay || (window.KiuSocialWorkspaceGraphModel || {}).resolveProjectTaskPriorityDisplay;
    const normalizeProjectWeekPlanWindow = window.normalizeProjectWeekPlanWindow || (window.KiuSocialWorkspaceGraphModel || {}).normalizeProjectWeekPlanWindow;
    const collectProjectTaskGraphNeighborIds = window.collectProjectTaskGraphNeighborIds || (window.KiuSocialWorkspaceGraphModel || {}).collectProjectTaskGraphNeighborIds;
    const sampleProjectTaskGraphPolyline = window.sampleProjectTaskGraphPolyline || (window.KiuSocialWorkspaceGraphModel || {}).sampleProjectTaskGraphPolyline;
    const relaxProjectTaskGraphPolyline = window.relaxProjectTaskGraphPolyline || (window.KiuSocialWorkspaceGraphModel || {}).relaxProjectTaskGraphPolyline;
    const projectTaskGraphEdgeFanMap = window.projectTaskGraphEdgeFanMap || (window.KiuSocialWorkspaceGraphModel || {}).projectTaskGraphEdgeFanMap;
    const buildProjectTaskGraphSeedPolyline = window.buildProjectTaskGraphSeedPolyline || (window.KiuSocialWorkspaceGraphModel || {}).buildProjectTaskGraphSeedPolyline;
    const projectTaskGraphGroupMembershipWouldCycle = window.projectTaskGraphGroupMembershipWouldCycle || (window.KiuSocialWorkspaceGraphModel || {}).projectTaskGraphGroupMembershipWouldCycle;


    // Desk/graph pure helpers: social-workspace-graph-model.js (+ desk peel in graph-desk-model.js)
    const __graphDeskModel = window.KiuSocialWorkspaceGraphDeskModel || {};
    const __graphModel2 = window.KiuSocialWorkspaceGraphModel || {};
    const resolveDeskTaskReadiness = window.resolveDeskTaskReadiness || __graphModel2.resolveDeskTaskReadiness;
    const orderDeskTasksByDependency = window.orderDeskTasksByDependency || __graphDeskModel.orderDeskTasksByDependency || __graphModel2.orderDeskTasksByDependency;
    const buildDeskTaskForest = window.buildDeskTaskForest || __graphDeskModel.buildDeskTaskForest || __graphModel2.buildDeskTaskForest;
    const projectTaskGraphWouldCycle = window.projectTaskGraphWouldCycle || __graphDeskModel.projectTaskGraphWouldCycle || __graphModel2.projectTaskGraphWouldCycle;
    const collectProjectTaskGraphGroupDescendantTaskIds = window.collectProjectTaskGraphGroupDescendantTaskIds || __graphDeskModel.collectProjectTaskGraphGroupDescendantTaskIds || __graphModel2.collectProjectTaskGraphGroupDescendantTaskIds;
    const collectProjectTaskGraphGroupAbsorbedTaskIds = window.collectProjectTaskGraphGroupAbsorbedTaskIds || __graphDeskModel.collectProjectTaskGraphGroupAbsorbedTaskIds || __graphModel2.collectProjectTaskGraphGroupAbsorbedTaskIds;
    const computeProjectTaskGraphGroupRollup = window.computeProjectTaskGraphGroupRollup || __graphDeskModel.computeProjectTaskGraphGroupRollup || __graphModel2.computeProjectTaskGraphGroupRollup;
    const scoreProjectTaskGraphDockPair = window.scoreProjectTaskGraphDockPair || __graphModel2.scoreProjectTaskGraphDockPair;
    const getProjectTaskGraphGroupLinkSummary = window.getProjectTaskGraphGroupLinkSummary || __graphModel2.getProjectTaskGraphGroupLinkSummary;

    // Portfolio pure helpers: social-workspace-portfolio-model.js
    const __portfolioModel = window.KiuSocialWorkspacePortfolioModel || {};
    const portfolioStatus = window.portfolioStatus || __portfolioModel.portfolioStatus;
    const portfolioVisibilityMode = window.portfolioVisibilityMode || __portfolioModel.portfolioVisibilityMode;
    const parsePortfolioTextList = window.parsePortfolioTextList || __portfolioModel.parsePortfolioTextList;
    const parsePortfolioLinksInput = window.parsePortfolioLinksInput || __portfolioModel.parsePortfolioLinksInput;
    const serializePortfolioLinks = window.serializePortfolioLinks || __portfolioModel.serializePortfolioLinks;
    const portfolioAudienceLabel = window.portfolioAudienceLabel || __portfolioModel.portfolioAudienceLabel;
    const normalizePortfolioEntry = window.normalizePortfolioEntry || __portfolioModel.normalizePortfolioEntry;
    const canViewerAccessPortfolioEntry = window.canViewerAccessPortfolioEntry || __portfolioModel.canViewerAccessPortfolioEntry;
    const portfolioMatchesRoleFilter = window.portfolioMatchesRoleFilter || __portfolioModel.portfolioMatchesRoleFilter;
    const clonePortfolioDocument = window.clonePortfolioDocument || __portfolioModel.clonePortfolioDocument;
    const portfolioMakeId = window.portfolioMakeId || __portfolioModel.portfolioMakeId;
    const portfolioFieldValue = window.portfolioFieldValue || __portfolioModel.portfolioFieldValue;

    // Sort / saved-pos / checkpoint / flags / scope / escape / storage keys: graph-model.
    const __swGraphBatch = window.KiuSocialWorkspaceGraphModel || {};
    const sortProjectBoardTasksByPriority = window.sortProjectBoardTasksByPriority || __swGraphBatch.sortProjectBoardTasksByPriority;
    const applyProjectTaskGraphSavedPositions = window.applyProjectTaskGraphSavedPositions || __swGraphBatch.applyProjectTaskGraphSavedPositions;
    const projectTaskGraphShowInferred = window.projectTaskGraphShowInferred || __swGraphBatch.projectTaskGraphShowInferred;
    const projectTaskGraphShowCritical = window.projectTaskGraphShowCritical || __swGraphBatch.projectTaskGraphShowCritical;
    const projectTaskGraphShowFlow = window.projectTaskGraphShowFlow || __swGraphBatch.projectTaskGraphShowFlow;
    const projectTaskGraphPositionsStorageKey = window.projectTaskGraphPositionsStorageKey || __swGraphBatch.projectTaskGraphPositionsStorageKey;
    const projectTaskGraphViewStorageKey = window.projectTaskGraphViewStorageKey || __swGraphBatch.projectTaskGraphViewStorageKey;
    const projectTaskGraphSyncStorageKey = window.projectTaskGraphSyncStorageKey || __swGraphBatch.projectTaskGraphSyncStorageKey;
    const projectTaskGraphGroupsStorageKey = window.projectTaskGraphGroupsStorageKey || __swGraphBatch.projectTaskGraphGroupsStorageKey;
    const projectTaskGraphCheckpointStorageKey = window.projectTaskGraphCheckpointStorageKey || __swGraphBatch.projectTaskGraphCheckpointStorageKey;
    const projectTaskGraphCheckpointsStorageKey = window.projectTaskGraphCheckpointsStorageKey || __swGraphBatch.projectTaskGraphCheckpointsStorageKey;
    const formatProjectTaskGraphCheckpointWhen = window.formatProjectTaskGraphCheckpointWhen || __swGraphBatch.formatProjectTaskGraphCheckpointWhen;
    const normalizeProjectTaskGraphCheckpointEntry = window.normalizeProjectTaskGraphCheckpointEntry || __swGraphBatch.normalizeProjectTaskGraphCheckpointEntry;
    const escapeProjectTaskGraphAttr = window.escapeProjectTaskGraphAttr || __swGraphBatch.escapeProjectTaskGraphAttr;
    const projectTaskGraphMineOnlyActive = window.projectTaskGraphMineOnlyActive || __swGraphBatch.projectTaskGraphMineOnlyActive;
    const filterProjectTaskGraphVisibleTasks = window.filterProjectTaskGraphVisibleTasks || __swGraphBatch.filterProjectTaskGraphVisibleTasks;
    const resolveProjectTaskGraphScheduleScope = window.resolveProjectTaskGraphScheduleScope || __swGraphBatch.resolveProjectTaskGraphScheduleScope;
    const computeProjectTaskGraphMapSchedule = window.computeProjectTaskGraphMapSchedule || __swGraphBatch.computeProjectTaskGraphMapSchedule;
    const buildProjectTaskInspectorFields = window.buildProjectTaskInspectorFields || __swGraphBatch.buildProjectTaskInspectorFields;
    const resolveProjectTaskGraphGroupBox = window.resolveProjectTaskGraphGroupBox || __swGraphBatch.resolveProjectTaskGraphGroupBox;
    const resolveProjectTaskGraphContext = window.resolveProjectTaskGraphContext || __swGraphBatch.resolveProjectTaskGraphContext;
    const buildProjectTaskGraphLayout = window.buildProjectTaskGraphLayout || __swGraphBatch.buildProjectTaskGraphLayout;
    const readProjectTaskGraphPan = window.readProjectTaskGraphPan || __swGraphBatch.readProjectTaskGraphPan;
    const clampProjectTaskGraphCardHeight = window.clampProjectTaskGraphCardHeight || __swGraphBatch.clampProjectTaskGraphCardHeight;
    const estimateProjectTaskGraphCardHeight = window.estimateProjectTaskGraphCardHeight || __swGraphBatch.estimateProjectTaskGraphCardHeight;
    const normalizeProjectTaskGraphMode = window.normalizeProjectTaskGraphMode || __swGraphBatch.normalizeProjectTaskGraphMode;
    const projectTaskGraphVisibleEdges = window.projectTaskGraphVisibleEdges || __swGraphBatch.projectTaskGraphVisibleEdges;
    const buildProjectTaskGraphModel = window.buildProjectTaskGraphModel || __swGraphBatch.buildProjectTaskGraphModel;
    const layoutProjectTaskGraphByStatus = window.layoutProjectTaskGraphByStatus || __swGraphBatch.layoutProjectTaskGraphByStatus;
    const compareProjectTaskGraphNodes = window.compareProjectTaskGraphNodes || __swGraphBatch.compareProjectTaskGraphNodes;
    const hashProjectTaskGraphSeed = window.hashProjectTaskGraphSeed || __swGraphBatch.hashProjectTaskGraphSeed;
    const projectTaskGraphPseudoRandom = window.projectTaskGraphPseudoRandom || __swGraphBatch.projectTaskGraphPseudoRandom;
    const getProjectTaskGraphMetrics = window.getProjectTaskGraphMetrics || __swGraphBatch.getProjectTaskGraphMetrics;
    const computeProjectTaskGraphStageSize = window.computeProjectTaskGraphStageSize || __swGraphBatch.computeProjectTaskGraphStageSize;
    const computeProjectTaskGraphNodeDegree = window.computeProjectTaskGraphNodeDegree || __swGraphBatch.computeProjectTaskGraphNodeDegree;
    const projectTaskGraphBoxRepulse = window.projectTaskGraphBoxRepulse || __swGraphBatch.projectTaskGraphBoxRepulse;
    const resolveProjectTaskGraphCardOverlaps = window.resolveProjectTaskGraphCardOverlaps || __swGraphBatch.resolveProjectTaskGraphCardOverlaps;
    const layoutProjectTaskGraphForce = window.layoutProjectTaskGraphForce || __swGraphBatch.layoutProjectTaskGraphForce;
    const projectTaskGraphLayoutUsesSavedPositions = window.projectTaskGraphLayoutUsesSavedPositions || __swGraphBatch.projectTaskGraphLayoutUsesSavedPositions;
    const projectTaskGraphRectsOverlap = window.projectTaskGraphRectsOverlap || __swGraphBatch.projectTaskGraphRectsOverlap;
    const projectTaskGraphContentBounds = window.projectTaskGraphContentBounds || __swGraphBatch.projectTaskGraphContentBounds;
    const clampProjectTaskGraphZoom = window.clampProjectTaskGraphZoom || __swGraphBatch.clampProjectTaskGraphZoom;
    const computeProjectTaskGraphContentFitView = window.computeProjectTaskGraphContentFitView || __swGraphBatch.computeProjectTaskGraphContentFitView;
    const computeProjectTaskGraphFitZoom = window.computeProjectTaskGraphFitZoom || __swGraphBatch.computeProjectTaskGraphFitZoom;
    const computeProjectTaskGraphPreviewZoom = window.computeProjectTaskGraphPreviewZoom || __swGraphBatch.computeProjectTaskGraphPreviewZoom;
    const projectTaskGraphCubicEdgePath = window.projectTaskGraphCubicEdgePath || __swGraphBatch.projectTaskGraphCubicEdgePath;
    const projectTaskGraphBoxAnchor = window.projectTaskGraphBoxAnchor || __swGraphBatch.projectTaskGraphBoxAnchor;
    const getProjectTaskGraphDocks = window.getProjectTaskGraphDocks || __swGraphBatch.getProjectTaskGraphDocks;
    const projectTaskGraphDockAlongSide = window.projectTaskGraphDockAlongSide || __swGraphBatch.projectTaskGraphDockAlongSide;
    const selectProjectTaskGraphDockPair = window.selectProjectTaskGraphDockPair || __swGraphBatch.selectProjectTaskGraphDockPair;
    const projectTaskGraphPushOutOfRect = window.projectTaskGraphPushOutOfRect || __swGraphBatch.projectTaskGraphPushOutOfRect;
    const normalizeProjectTaskGraphStatusId = window.normalizeProjectTaskGraphStatusId || __swGraphBatch.normalizeProjectTaskGraphStatusId;
    const projectTaskGraphStatusEdgeColor = __swGraphBatch.projectTaskGraphStatusEdgeColor || window.projectTaskGraphStatusEdgeColor;
    const projectTaskGraphEdgePath = window.projectTaskGraphEdgePath || __swGraphBatch.projectTaskGraphEdgePath;
    const projectTaskGraphEdgeAnchors = window.projectTaskGraphEdgeAnchors || __swGraphBatch.projectTaskGraphEdgeAnchors;
    const projectTaskGraphObstacleList = window.projectTaskGraphObstacleList || __swGraphBatch.projectTaskGraphObstacleList;
    const formatProjectTaskGraphNodeLabel = window.formatProjectTaskGraphNodeLabel || __swGraphBatch.formatProjectTaskGraphNodeLabel;
    const projectTaskGraphPortRole = window.projectTaskGraphPortRole || __swGraphBatch.projectTaskGraphPortRole;
    const resolveProjectTaskGraphWireEndpoints = window.resolveProjectTaskGraphWireEndpoints || __swGraphBatch.resolveProjectTaskGraphWireEndpoints;
    const projectTaskDependsOnIds = window.projectTaskDependsOnIds || __swGraphBatch.projectTaskDependsOnIds;
    const isProjectTaskGraphGroupId = window.isProjectTaskGraphGroupId || __swGraphBatch.isProjectTaskGraphGroupId;
    const projectGroupDependsOnIds = window.projectGroupDependsOnIds || __swGraphBatch.projectGroupDependsOnIds;
    const projectGroupBlocksIds = window.projectGroupBlocksIds || __swGraphBatch.projectGroupBlocksIds;
    const isProjectTaskGraphGroupComplete = window.isProjectTaskGraphGroupComplete || __swGraphBatch.isProjectTaskGraphGroupComplete;
    const isProjectGraphDependencyOpen = window.isProjectGraphDependencyOpen || __swGraphBatch.isProjectGraphDependencyOpen;
    const projectTaskGraphContentViewBox = window.projectTaskGraphContentViewBox || __swGraphBatch.projectTaskGraphContentViewBox;
    const resolveProjectTaskGraphPanSlack = window.resolveProjectTaskGraphPanSlack || __swGraphBatch.resolveProjectTaskGraphPanSlack;
    const clampProjectTaskGraphPan = window.clampProjectTaskGraphPan || __swGraphBatch.clampProjectTaskGraphPan;
    const projectTaskGraphScrollOffsets = window.projectTaskGraphScrollOffsets || __swGraphBatch.projectTaskGraphScrollOffsets;

    // Pure schedule / PERT helpers: social-workspace-schedule-model.js (loaded before tab-runtime)
    const __scheduleModel = window.KiuSocialWorkspaceScheduleModel || {};
    const computePertExpected = window.computePertExpected || __scheduleModel.computePertExpected;
    const taskHasPert = window.taskHasPert || __scheduleModel.taskHasPert;
    const resolveTaskScheduleEstimate = window.resolveTaskScheduleEstimate || __scheduleModel.resolveTaskScheduleEstimate;
    const taskDurationHours = window.taskDurationHours || __scheduleModel.taskDurationHours;
    const taskScheduleRemainingHours = window.taskScheduleRemainingHours || __scheduleModel.taskScheduleRemainingHours;
    const sumProjectOpenWorkHours = window.sumProjectOpenWorkHours || __scheduleModel.sumProjectOpenWorkHours;
    const sumProjectActualHours = window.sumProjectActualHours || __scheduleModel.sumProjectActualHours;
    const formatProjectScheduleHours = window.formatProjectScheduleHours || __scheduleModel.formatProjectScheduleHours;
    const formatProjectScheduleFloat = window.formatProjectScheduleFloat || __scheduleModel.formatProjectScheduleFloat;
    const formatTaskScheduleDisplay = window.formatTaskScheduleDisplay || __scheduleModel.formatTaskScheduleDisplay;
    const projectScheduleCalendarDate = window.projectScheduleCalendarDate || __scheduleModel.projectScheduleCalendarDate;
    const formatProjectScheduleDate = window.formatProjectScheduleDate || __scheduleModel.formatProjectScheduleDate;
    const PROJECT_SCHEDULE_FLOAT_TITLE = window.PROJECT_SCHEDULE_FLOAT_TITLE
        || __scheduleModel.PROJECT_SCHEDULE_FLOAT_TITLE
        || 'Schedule float (how much this can slip without delaying project finish). Not the task duration. Work time: 8h = 1d. Duration is the separate estimate/PERT pill.';
    const computeProjectSchedule = window.computeProjectSchedule || __scheduleModel.computeProjectSchedule;



    /* ── Tab/pane runtime: social-workspace-tab-runtime.js ── */
    const __wsTabRtApi = (typeof (window.createKiuSocialWorkspaceTabRuntimeApi || window.__kiuCreateSocialWorkspaceTabRuntimeApi) === 'function'
        ? (window.__kiuCreateSocialWorkspaceTabRuntimeApi || window.createKiuSocialWorkspaceTabRuntimeApi)({
        buildSocialRenderSignature,
        computePertExpected,
        computeTaskMatrixBucket,
        computeTaskMatrixScore,
        enhanceUniversalPickers: typeof enhanceUniversalPickers === 'function' ? enhanceUniversalPickers : window.enhanceUniversalPickers,
        ensureSocialCenterScrollBounds,
        escape,
        formatTaskTime,
        getSocialCenterMaxScroll,
        getSocialCenterScroller,
        normalizeTaskTime,
        normalizeTaskTimeUnit,
        renderProjectWorkspaceTabPanel: typeof renderProjectWorkspaceTabPanel === 'function' ? renderProjectWorkspaceTabPanel : window.renderProjectWorkspaceTabPanel,
        renderSocialPageNow,
        root,
        scrollSocialCenterTo,
        state,
        text,
        when,
        })
        : null);
    const syncProjectTaskMatrixPreview = __wsTabRtApi?.syncProjectTaskMatrixPreview;
    const projectTabPaneCacheKey = __wsTabRtApi?.projectTabPaneCacheKey;
    const syncProjectTabPills = __wsTabRtApi?.syncProjectTabPills;
    const clearProjectTabPaneCacheKey = __wsTabRtApi?.clearProjectTabPaneCacheKey;
    const clearProjectTabPaneCache = __wsTabRtApi?.clearProjectTabPaneCache;
    const deskTasksSurfaceReady = __wsTabRtApi?.deskTasksSurfaceReady;
    const syncDeskToolbarFromFreshMarkup = __wsTabRtApi?.syncDeskToolbarFromFreshMarkup;
    const getOrCreateProjectTabPane = __wsTabRtApi?.getOrCreateProjectTabPane;
    const refreshProjectTasksTabBody = __wsTabRtApi?.refreshProjectTasksTabBody;
    const refreshProjectTasksTabPane = __wsTabRtApi?.refreshProjectTasksTabPane;
    const rebuildActiveProjectTabPaneIfPreviewHost = __wsTabRtApi?.rebuildActiveProjectTabPaneIfPreviewHost;
    const patchProjectWorkspaceTab = __wsTabRtApi?.patchProjectWorkspaceTab;
    const revealDeskExpandTarget = __wsTabRtApi?.revealDeskExpandTarget;


    __kiuSwApi.sortProjectBoardTasksByPriority = sortProjectBoardTasksByPriority;
    __kiuSwApi.filterProjectBoardTasks = filterProjectBoardTasks;
    __kiuSwApi.resolveDeskTaskReadiness = resolveDeskTaskReadiness;
    __kiuSwApi.resolveProjectTaskPriorityDisplay = resolveProjectTaskPriorityDisplay;
    __kiuSwApi.buildProjectTaskInspectorFields = buildProjectTaskInspectorFields;
    __kiuSwApi.syncProjectTaskMatrixPreview = syncProjectTaskMatrixPreview;
    __kiuSwApi.projectTabPaneCacheKey = projectTabPaneCacheKey;
    __kiuSwApi.syncProjectTabPills = syncProjectTabPills;
    __kiuSwApi.clearProjectTabPaneCacheKey = clearProjectTabPaneCacheKey;
    __kiuSwApi.clearProjectTabPaneCache = clearProjectTabPaneCache;
    __kiuSwApi.deskTasksSurfaceReady = deskTasksSurfaceReady;
    __kiuSwApi.syncDeskToolbarFromFreshMarkup = syncDeskToolbarFromFreshMarkup;
    __kiuSwApi.getOrCreateProjectTabPane = getOrCreateProjectTabPane;
    __kiuSwApi.refreshProjectTasksTabBody = refreshProjectTasksTabBody;
    __kiuSwApi.refreshProjectTasksTabPane = refreshProjectTasksTabPane;
    __kiuSwApi.rebuildActiveProjectTabPaneIfPreviewHost = rebuildActiveProjectTabPaneIfPreviewHost;
    __kiuSwApi.patchProjectWorkspaceTab = patchProjectWorkspaceTab;
    __kiuSwApi.revealDeskExpandTarget = revealDeskExpandTarget;

    const PROJECT_TASK_COLUMNS = [
        { id: 'todo', label: 'To Do', tone: 'blue', icon: 'fa-list-check' },
        { id: 'in-progress', label: 'In Progress', tone: 'orange', icon: 'fa-bolt' },
        { id: 'blocked', label: 'Blocked', tone: 'rose', icon: 'fa-ban' },
        { id: 'done', label: 'Done', tone: 'emerald', icon: 'fa-circle-check' }
    ];

    /* Task graph render constants (mirrors social-page for lazy module) */
    const PROJECT_TASK_GRAPH_CARD_W = 256;
    const PROJECT_TASK_GRAPH_CARD_H = 188;
    const PROJECT_TASK_GRAPH_CARD_COMPACT_W = 200;
    const PROJECT_TASK_GRAPH_CARD_COMPACT_H = 100;
    const PROJECT_TASK_GRAPH_FO_PAD = 20;
    const PROJECT_TASK_GRAPH_CHECKPOINT_MAX = 12;
    const PROJECT_TASK_GRAPH_MIN_ZOOM = 0.12;
    const PROJECT_TASK_GRAPH_MAX_ZOOM = 1.6;
    const PROJECT_TASK_STATUS_EDGE_COLOR = window.PROJECT_TASK_STATUS_EDGE_COLOR
        || __swGraphBatch.PROJECT_TASK_STATUS_EDGE_COLOR
        || {
        todo: '#3b82f6',
        'in-progress': '#f59e0b',
        blocked: '#f43f5e',
        done: '#10b981'
    };
    const PROJECT_TASK_GRAPH_CARD_MIN_H = 168;
    const PROJECT_TASK_GRAPH_CARD_MAX_H = 280;
    const PROJECT_TASK_GRAPH_CARD_COMPACT_MIN_H = 88;
    const PROJECT_TASK_GRAPH_CARD_COMPACT_MAX_H = 180;
    const PROJECT_TASK_GRAPH_IMMERSIVE_CHROME_H = 112;
    const PROJECT_TASK_GRAPH_PAN_SLACK = 2400;
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
    const PROJECT_TASK_STATUS_RANK = Object.fromEntries(PROJECT_TASK_COLUMNS.map((column, index) => [column.id, index]));
    const PROJECT_TASK_PRIORITY_RANK = { urgent: 0, high: 1, medium: 2, low: 3 };

    /* ── Schedule + desk pure helpers ── */

    /** Legacy alias */


    /** Nested forest for droplist tree UI (parent → child → grandchild …). */


    // Week-plan + action predicates: social-workspace-week-plan-model.js
    const __weekPlan = window.KiuSocialWorkspaceWeekPlanModel || {};
    const readProjectWeekPlansStore = window.readProjectWeekPlansStore || __weekPlan.readProjectWeekPlansStore;
    const readProjectWeekPlan = window.readProjectWeekPlan || __weekPlan.readProjectWeekPlan;
    const writeProjectWeekPlan = window.writeProjectWeekPlan || __weekPlan.writeProjectWeekPlan;
    const addToProjectWeekPlan = window.addToProjectWeekPlan || __weekPlan.addToProjectWeekPlan;
    const addManyToProjectWeekPlan = window.addManyToProjectWeekPlan || __weekPlan.addManyToProjectWeekPlan;
    const removeFromProjectWeekPlan = window.removeFromProjectWeekPlan || __weekPlan.removeFromProjectWeekPlan;
    const isSocialWorkspaceClickAction = window.isSocialWorkspaceClickAction || __weekPlan.isSocialWorkspaceClickAction;
    const isSocialWorkspaceSubmitForm = window.isSocialWorkspaceSubmitForm || __weekPlan.isSocialWorkspaceSubmitForm;
    const isSocialWorkspaceInputTarget = window.isSocialWorkspaceInputTarget || __weekPlan.isSocialWorkspaceInputTarget;
    const isSocialWorkspaceChangeTarget = window.isSocialWorkspaceChangeTarget || __weekPlan.isSocialWorkspaceChangeTarget;

    /* ── Schedule strips: social-workspace-schedule-ui.js ── */
    const __wsSchedUiApi = (typeof (window.createKiuSocialWorkspaceScheduleUiApi || window.__kiuCreateSocialWorkspaceScheduleUiApi) === 'function'
        ? (window.__kiuCreateSocialWorkspaceScheduleUiApi || window.createKiuSocialWorkspaceScheduleUiApi)({
        computeProjectSchedule,
        escape,
        formatProjectScheduleDate,
        formatProjectScheduleHours,
        normalizeTaskTime,
        sumProjectActualHours,
        sumProjectOpenWorkHours,
        text,
        when,
        })
        : null);
    const renderProjectPlanVsBaselineStrip = __wsSchedUiApi?.renderProjectPlanVsBaselineStrip;
    const renderProjectProgressHoursStrip = __wsSchedUiApi?.renderProjectProgressHoursStrip;


    /**
     * Preview-style fit: scale + pan so every card is visible and centered in the viewport.
     * Pan is scroll-canvas relative: (0,0) = top-left of the content viewBox (not world origin).
     */

    /* ── Portfolio data layer (pure helpers in social-workspace-portfolio-model.js) ── */

    /* ── Portfolio runtime: social-workspace-portfolio-runtime.js ── */
    const __wsPortRtApi = (typeof (window.createKiuSocialWorkspacePortfolioRuntimeApi || window.__kiuCreateSocialWorkspacePortfolioRuntimeApi) === 'function'
        ? (window.__kiuCreateSocialWorkspacePortfolioRuntimeApi || window.createKiuSocialWorkspacePortfolioRuntimeApi)({
        canViewerAccessPortfolioEntry,
        clonePortfolioDocument,
        currentFacultyCode,
        currentUser,
        currentUserId,
        normalizePortfolioEntry,
        patchPortfolioSaveStatus,
        portfolioEditorFormRoot,
        portfolioFieldValue,
        portfolioMakeId,
        renderSocialPageNow,
        serializePortfolioLinks,
        setPortalSocialFlash,
        state,
        text,
        })
        : null);
    const portfolioEntriesForViewer = __wsPortRtApi?.portfolioEntriesForViewer;
    const portfolioDraftExists = __wsPortRtApi?.portfolioDraftExists;
    const getMyPortfolioDocument = __wsPortRtApi?.getMyPortfolioDocument;
    const ensureMyPortfolioDocument = __wsPortRtApi?.ensureMyPortfolioDocument;
    const clearPortfolioApiDeniedFlag = __wsPortRtApi?.clearPortfolioApiDeniedFlag;
    const hydrateMyPortfolioDocument = __wsPortRtApi?.hydrateMyPortfolioDocument;
    const portfolioReadDateRange = __wsPortRtApi?.portfolioReadDateRange;
    const portfolioCollectDocumentFromUi = __wsPortRtApi?.portfolioCollectDocumentFromUi;
    const saveMyPortfolioDocument = __wsPortRtApi?.saveMyPortfolioDocument;
    const openPortfolioEditor = __wsPortRtApi?.openPortfolioEditor;
    const resetPortfolioEditor = __wsPortRtApi?.resetPortfolioEditor;
    const PORTFOLIO_DISCOVER_ROLE_TARGETS = __wsPortRtApi?.PORTFOLIO_DISCOVER_ROLE_TARGETS;


    // Risk scale/status constants + pure helpers: social-workspace-risk-model.js
    const __riskModel = window.KiuSocialWorkspaceRiskModel || {};
    const PROJECT_RISK_SCALE_OPTIONS = __riskModel.PROJECT_RISK_SCALE_OPTIONS || [1, 2, 3, 4, 5];
    const PROJECT_RISK_LIKELIHOOD_LABELS = __riskModel.PROJECT_RISK_LIKELIHOOD_LABELS || {};
    const PROJECT_RISK_IMPACT_LABELS = __riskModel.PROJECT_RISK_IMPACT_LABELS || {};
    const PROJECT_RISK_STATUS_OPTIONS = __riskModel.PROJECT_RISK_STATUS_OPTIONS || ['open', 'watching', 'mitigated', 'closed'];
    const PROJECT_RISK_RESPONSE_OPTIONS = __riskModel.PROJECT_RISK_RESPONSE_OPTIONS || ['avoid', 'mitigate', 'transfer', 'accept'];

    /* ── Project chrome: social-workspace-project-chrome.js ── */
    const __wsProjChromeApi = (typeof (window.createKiuSocialWorkspaceProjectChromeApi || window.__kiuCreateSocialWorkspaceProjectChromeApi) === 'function'
        ? (window.__kiuCreateSocialWorkspaceProjectChromeApi || window.createKiuSocialWorkspaceProjectChromeApi)({
        accountById,
        accountSubtitle,
        avatar,
        controlId,
        currentFacultyCode,
        currentUserId,
        displayName,
        escape,
        facultyLabel,
        isStaffAccount,
        neoActions,
        neoField,
        neoHead,
        neoSection,
        resolveActiveSocialProject,
        roleLabel,
        text,
        toDateTimeLocalValue,
        uniqueStrings,
        })
        : null);
    const renderWorkspaceHero = __wsProjChromeApi?.renderWorkspaceHero;
    const buildProjectCreateContext = __wsProjChromeApi?.buildProjectCreateContext;
    const buildProjectCreateInviteContext = __wsProjChromeApi?.buildProjectCreateInviteContext;
    const renderProjectCreateInviteSection = __wsProjChromeApi?.renderProjectCreateInviteSection;
    const renderProjectSettingsDialog = __wsProjChromeApi?.renderProjectSettingsDialog;
    const renderProjectCreateDialog = __wsProjChromeApi?.renderProjectCreateDialog;


    /* ── Portfolio UI: social-workspace-portfolio-ui.js ── */
    const __wsPortUiApi = (typeof (window.createKiuSocialWorkspacePortfolioUiApi || window.__kiuCreateSocialWorkspacePortfolioUiApi) === 'function'
        ? (window.__kiuCreateSocialWorkspacePortfolioUiApi || window.createKiuSocialWorkspacePortfolioUiApi)({
        avatar,
        currentFacultyCode,
        currentUser,
        currentUserId,
        displayName,
        ensureMyPortfolioDocument,
        escape,
        facultyLabel,
        fileUrl,
        getSafeSocialExternalUrl,
        isImage,
        neoActions,
        neoField,
        neoHead,
        portfolioAudienceLabel,
        portfolioDraftExists,
        portfolioEntriesForViewer,
        portfolioMatchesRoleFilter,
        PORTFOLIO_DISCOVER_ROLE_TARGETS,
        roleLabel,
        state,
        text,
        uniqueStrings,
        when,
        })
        : null);
    const renderPortfolioHero = __wsPortUiApi?.renderPortfolioHero;
    const renderPortfolioCreateDialog = __wsPortUiApi?.renderPortfolioCreateDialog;
    const renderMyPortfolioPanel = __wsPortUiApi?.renderMyPortfolioPanel;
    const renderPortfolioEditorDialog = __wsPortUiApi?.renderPortfolioEditorDialog;
    const renderPortfolioCustomBuilderOverlay = __wsPortUiApi?.renderPortfolioCustomBuilderOverlay;
    const renderPortfolioProfileBlock = __wsPortUiApi?.renderPortfolioProfileBlock;
    const renderProjectsPanel = __wsPortUiApi?.renderProjectsPanel;

    __kiuSwApi.renderWorkspaceHero = renderWorkspaceHero;
    __kiuSwApi.buildProjectCreateContext = buildProjectCreateContext;
    __kiuSwApi.buildProjectCreateInviteContext = buildProjectCreateInviteContext;
    __kiuSwApi.renderProjectCreateInviteSection = renderProjectCreateInviteSection;
    __kiuSwApi.renderProjectCreateDialog = renderProjectCreateDialog;
    __kiuSwApi.renderProjectSettingsDialog = renderProjectSettingsDialog;
    __kiuSwApi.renderPortfolioHero = renderPortfolioHero;
    __kiuSwApi.renderPortfolioCreateDialog = renderPortfolioCreateDialog;

    /* ── Task graph runtime: social-workspace-graph-runtime.js ── */
    const __wsGraphRtApi = (typeof (window.createKiuSocialWorkspaceGraphRuntimeApi || window.__kiuCreateSocialWorkspaceGraphRuntimeApi) === 'function'
        ? (window.__kiuCreateSocialWorkspaceGraphRuntimeApi || window.createKiuSocialWorkspaceGraphRuntimeApi)({
        PROJECT_TASK_GRAPH_CARD_COMPACT_MIN_H,
        PROJECT_TASK_GRAPH_CARD_COMPACT_W,
        PROJECT_TASK_GRAPH_CARD_H,
        PROJECT_TASK_GRAPH_CARD_MIN_H,
        PROJECT_TASK_GRAPH_CARD_W,
        PROJECT_TASK_GRAPH_CHECKPOINT_MAX,
        PROJECT_TASK_GRAPH_FO_PAD,
        PROJECT_TASK_GRAPH_MIN_ZOOM,
        PROJECT_TASK_GRAPH_STACKED_DIALOGS,
        __swGraphBatch,
        activeDialog,
        applyProjectTaskGraphSavedPositions,
        buildProjectTaskGraphLayout,
        clearProjectTabPaneCache,
        clearProjectTabPaneCacheKey,
        collectProjectTaskGraphNeighborIds,
        computeProjectTaskGraphMapSchedule,
        escape,
        escapeProjectTaskGraphAttr,
        formatProjectTaskGraphCheckpointWhen,
        normalizeProjectTaskGraphCheckpointEntry,
        openDialog,
        openProjectRiskForTask,
        projectTaskGraphCheckpointStorageKey,
        projectTaskGraphCheckpointsStorageKey,
        projectTaskGraphEdgeFanMap,
        projectTaskGraphGroupMembershipWouldCycle,
        projectTaskGraphGroupsStorageKey,
        projectTaskGraphMineOnlyActive,
        projectTaskGraphPositionsStorageKey,
        projectTaskGraphShowCritical,
        projectTaskGraphShowFlow,
        projectTaskGraphShowInferred,
        projectTaskGraphSyncStorageKey,
        projectTaskGraphViewStorageKey,
        projectTaskGraphWouldCycle,
        readProjectTaskGraphPan,
        rebuildActiveProjectTabPaneIfPreviewHost,
        refreshProjectTasksTabBody,
        refreshProjectTasksTabPane,
        renderDialogOnlyNow,
        renderProjectTaskGraphDetailRailContent: window.renderProjectTaskGraphDetailRailContent,
        renderProjectTaskGraphEdgeGroupsHtml: window.renderProjectTaskGraphEdgeGroupsHtml,
        renderProjectTaskGraphGroupEdgesHtml: window.renderProjectTaskGraphGroupEdgesHtml,
        renderProjectTaskGraphQuickCreatePopover: window.renderProjectTaskGraphQuickCreatePopover,
        renderStackedProjectTaskChild: (...args) => {
            const fn = window.__kiuSwApi?.renderStackedProjectTaskChild || window.renderStackedProjectTaskChild;
            return typeof fn === 'function' ? fn(...args) : '';
        },
        resolveActiveSocialProject,
        resolveProjectTaskGraphContext,
        resolveProjectTaskGraphGroupBox,
        shouldRenderProjectHealthStack: (...args) => {
            const fn = window.__kiuSwApi?.shouldRenderProjectHealthStack || window.shouldRenderProjectHealthStack;
            return typeof fn === 'function' ? fn(...args) : false;
        },
        state,
        text,
        uniqueStrings,
        updatePortalSocialProjectTask: typeof updatePortalSocialProjectTask === 'function' ? updatePortalSocialProjectTask : window.updatePortalSocialProjectTask,
        updatePortalSocialProjectTaskGraph: typeof updatePortalSocialProjectTaskGraph === 'function' ? updatePortalSocialProjectTaskGraph : window.updatePortalSocialProjectTaskGraph,
        when,
        withBusy,
        })
        : null);
    const addProjectGraphDependency = __wsGraphRtApi?.addProjectGraphDependency;
    const addProjectTaskDependency = __wsGraphRtApi?.addProjectTaskDependency;
    const applyProjectTaskGraphCanvasTransform = __wsGraphRtApi?.applyProjectTaskGraphCanvasTransform;
    const applyProjectTaskGraphCheckpointSnapshot = __wsGraphRtApi?.applyProjectTaskGraphCheckpointSnapshot;
    const applyProjectTaskGraphResetView = __wsGraphRtApi?.applyProjectTaskGraphResetView;
    const applyProjectTaskGraphScrollZoom = __wsGraphRtApi?.applyProjectTaskGraphScrollZoom;
    const applyProjectTaskGraphZoom = __wsGraphRtApi?.applyProjectTaskGraphZoom;
    const attachProjectTaskGraphPanWindowListeners = __wsGraphRtApi?.attachProjectTaskGraphPanWindowListeners;
    const bindProjectTaskGraphDrag = __wsGraphRtApi?.bindProjectTaskGraphDrag;
    const bindProjectTaskGraphInteractions = __wsGraphRtApi?.bindProjectTaskGraphInteractions;
    const bindProjectTaskGraphResizeObserver = __wsGraphRtApi?.bindProjectTaskGraphResizeObserver;
    const buildProjectTaskGraphLayoutForView = __wsGraphRtApi?.buildProjectTaskGraphLayoutForView;
    const centerProjectTaskGraphScrollPan = __wsGraphRtApi?.centerProjectTaskGraphScrollPan;
    const clearProjectTaskGraphLinkPreview = __wsGraphRtApi?.clearProjectTaskGraphLinkPreview;
    const clientToProjectTaskGraphCoords = __wsGraphRtApi?.clientToProjectTaskGraphCoords;
    const closeProjectTaskGraphContextMenu = __wsGraphRtApi?.closeProjectTaskGraphContextMenu;
    const collectProjectTaskGraphCheckpoint = __wsGraphRtApi?.collectProjectTaskGraphCheckpoint;
    const collectProjectTaskGraphGroupBoxes = __wsGraphRtApi?.collectProjectTaskGraphGroupBoxes;
    const createProjectTaskGraphGroup = __wsGraphRtApi?.createProjectTaskGraphGroup;
    const deleteProjectTaskGraphCheckpoint = __wsGraphRtApi?.deleteProjectTaskGraphCheckpoint;
    const deleteProjectTaskGraphGroup = __wsGraphRtApi?.deleteProjectTaskGraphGroup;
    const detachProjectTaskGraphPanWindowListeners = __wsGraphRtApi?.detachProjectTaskGraphPanWindowListeners;
    const ensureProjectTaskGraphLinkPreview = __wsGraphRtApi?.ensureProjectTaskGraphLinkPreview;
    const ensureProjectTaskGraphPositionForTask = __wsGraphRtApi?.ensureProjectTaskGraphPositionForTask;
    const ensureProjectTaskGraphPositionsLoaded = __wsGraphRtApi?.ensureProjectTaskGraphPositionsLoaded;
    const ensureProjectTaskGraphScrollSurface = __wsGraphRtApi?.ensureProjectTaskGraphScrollSurface;
    const findFreeProjectTaskGraphPosition = __wsGraphRtApi?.findFreeProjectTaskGraphPosition;
    const findProjectTaskGraphLinkDropTarget = __wsGraphRtApi?.findProjectTaskGraphLinkDropTarget;
    const findProjectTaskGraphMembershipDropGroup = __wsGraphRtApi?.findProjectTaskGraphMembershipDropGroup;
    const flushProjectTaskGraphSync = __wsGraphRtApi?.flushProjectTaskGraphSync;
    const getProjectTaskGraphCheckpointById = __wsGraphRtApi?.getProjectTaskGraphCheckpointById;
    const getProjectTaskGraphGroups = __wsGraphRtApi?.getProjectTaskGraphGroups;
    const getProjectTaskGraphHost = __wsGraphRtApi?.getProjectTaskGraphHost;
    const getProjectTaskGraphPositions = __wsGraphRtApi?.getProjectTaskGraphPositions;
    const getProjectTaskGraphStackAnchorDialog = __wsGraphRtApi?.getProjectTaskGraphStackAnchorDialog;
    const initProjectTaskGraphScrollPan = __wsGraphRtApi?.initProjectTaskGraphScrollPan;
    const isProjectTaskGraphDialogOpen = __wsGraphRtApi?.isProjectTaskGraphDialogOpen;
    const isProjectTaskGraphPanButton = __wsGraphRtApi?.isProjectTaskGraphPanButton;
    const isProjectTaskGraphScrollPanCanvas = __wsGraphRtApi?.isProjectTaskGraphScrollPanCanvas;
    const isProjectTaskGraphStackActive = __wsGraphRtApi?.isProjectTaskGraphStackActive;
    const loadProjectTaskGraphPositions = __wsGraphRtApi?.loadProjectTaskGraphPositions;
    const loadProjectTaskGraphView = __wsGraphRtApi?.loadProjectTaskGraphView;
    const markProjectTaskGraphPreviewStale = __wsGraphRtApi?.markProjectTaskGraphPreviewStale;
    const measureProjectTaskGraphCardHeights = __wsGraphRtApi?.measureProjectTaskGraphCardHeights;
    const notifyProjectTaskGraphSurfaceChanged = __wsGraphRtApi?.notifyProjectTaskGraphSurfaceChanged;
    const openProjectTaskGraphContextMenu = __wsGraphRtApi?.openProjectTaskGraphContextMenu;
    const patchLocalProjectTaskDepends = __wsGraphRtApi?.patchLocalProjectTaskDepends;
    const patchProjectTaskGraphLinkCountLabel = __wsGraphRtApi?.patchProjectTaskGraphLinkCountLabel;
    const patchRemoveProjectTaskGraphEdge = __wsGraphRtApi?.patchRemoveProjectTaskGraphEdge;
    const persistProjectTaskGraphView = __wsGraphRtApi?.persistProjectTaskGraphView;
    const projectTaskGraphStackedBackdropClass = __wsGraphRtApi?.projectTaskGraphStackedBackdropClass;
    const pulseProjectTaskGraphCheckpointButton = __wsGraphRtApi?.pulseProjectTaskGraphCheckpointButton;
    const queueProjectTaskGraphSync = __wsGraphRtApi?.queueProjectTaskGraphSync;
    const readProjectTaskGraphCheckpoint = __wsGraphRtApi?.readProjectTaskGraphCheckpoint;
    const readProjectTaskGraphCheckpoints = __wsGraphRtApi?.readProjectTaskGraphCheckpoints;
    const readProjectTaskGraphLayoutSize = __wsGraphRtApi?.readProjectTaskGraphLayoutSize;
    const readProjectTaskGraphLivePositions = __wsGraphRtApi?.readProjectTaskGraphLivePositions;
    const readProjectTaskGraphPanFromScroll = __wsGraphRtApi?.readProjectTaskGraphPanFromScroll;
    const readProjectTaskGraphPanSlackFromCanvas = __wsGraphRtApi?.readProjectTaskGraphPanSlackFromCanvas;
    const readProjectTaskGraphPortCenter = __wsGraphRtApi?.readProjectTaskGraphPortCenter;
    const readProjectTaskGraphScrollSurface = __wsGraphRtApi?.readProjectTaskGraphScrollSurface;
    const refreshProjectTaskGraphDialog = __wsGraphRtApi?.refreshProjectTaskGraphDialog;
    const refreshProjectTaskGraphEdgeLines = __wsGraphRtApi?.refreshProjectTaskGraphEdgeLines;
    const removeProjectGraphDependency = __wsGraphRtApi?.removeProjectGraphDependency;
    const removeProjectTaskDependency = __wsGraphRtApi?.removeProjectTaskDependency;
    const resolveProjectTaskGraphLinkPreviewHost = __wsGraphRtApi?.resolveProjectTaskGraphLinkPreviewHost;
    const resolveProjectTaskGraphNodeFromTarget = __wsGraphRtApi?.resolveProjectTaskGraphNodeFromTarget;
    const resolveProjectTaskGraphPanBackdrop = __wsGraphRtApi?.resolveProjectTaskGraphPanBackdrop;
    const restoreProjectTaskGraphCheckpoint = __wsGraphRtApi?.restoreProjectTaskGraphCheckpoint;
    const saveProjectTaskGraphCheckpoint = __wsGraphRtApi?.saveProjectTaskGraphCheckpoint;
    const saveProjectTaskGraphPositions = __wsGraphRtApi?.saveProjectTaskGraphPositions;
    const saveProjectTaskGraphView = __wsGraphRtApi?.saveProjectTaskGraphView;
    const scheduleProjectTaskGraphEdgeRefresh = __wsGraphRtApi?.scheduleProjectTaskGraphEdgeRefresh;
    const scrubDeletedTaskFromProjectTaskGraphGroups = __wsGraphRtApi?.scrubDeletedTaskFromProjectTaskGraphGroups;
    const seedProjectTaskGraphFromProject = __wsGraphRtApi?.seedProjectTaskGraphFromProject;
    const selectProjectTaskGraphNode = __wsGraphRtApi?.selectProjectTaskGraphNode;
    const setProjectTaskGraphGroups = __wsGraphRtApi?.setProjectTaskGraphGroups;
    const setProjectTaskGraphInteracting = __wsGraphRtApi?.setProjectTaskGraphInteracting;
    const setProjectTaskGraphPositions = __wsGraphRtApi?.setProjectTaskGraphPositions;
    const shouldRenderProjectTaskGraphStack = __wsGraphRtApi?.shouldRenderProjectTaskGraphStack;
    const syncProjectTaskGraphCanvas = __wsGraphRtApi?.syncProjectTaskGraphCanvas;
    const syncProjectTaskGraphChrome = __wsGraphRtApi?.syncProjectTaskGraphChrome;
    const syncProjectTaskGraphEdgesOnly = __wsGraphRtApi?.syncProjectTaskGraphEdgesOnly;
    const syncProjectTaskGraphGroupFocus = __wsGraphRtApi?.syncProjectTaskGraphGroupFocus;
    const syncProjectTaskGraphQuickCreate = __wsGraphRtApi?.syncProjectTaskGraphQuickCreate;
    const syncProjectTaskGraphSelection = __wsGraphRtApi?.syncProjectTaskGraphSelection;
    const syncProjectTaskGraphSidebar = __wsGraphRtApi?.syncProjectTaskGraphSidebar;
    const toggleProjectTaskGraphGroupMember = __wsGraphRtApi?.toggleProjectTaskGraphGroupMember;
    const trySyncProjectTaskGraphStackDialog = __wsGraphRtApi?.trySyncProjectTaskGraphStackDialog;
    const syncProjectTaskGraphStackSlotState = __wsGraphRtApi?.syncProjectTaskGraphStackSlotState;
    const updateProjectTaskGraphGroup = __wsGraphRtApi?.updateProjectTaskGraphGroup;
    const updateProjectTaskGraphLinkPreview = __wsGraphRtApi?.updateProjectTaskGraphLinkPreview;
    const wrapProjectTaskGraphStack = __wsGraphRtApi?.wrapProjectTaskGraphStack;
    const writeProjectTaskGraphCheckpoints = __wsGraphRtApi?.writeProjectTaskGraphCheckpoints;

    /* graph runtime exports for page stubs / action handlers */
    __kiuSwApi.shouldRenderProjectTaskGraphStack = shouldRenderProjectTaskGraphStack;
    __kiuSwApi.isProjectTaskGraphStackActive = isProjectTaskGraphStackActive;
    __kiuSwApi.getProjectTaskGraphStackAnchorDialog = getProjectTaskGraphStackAnchorDialog;
    __kiuSwApi.wrapProjectTaskGraphStack = wrapProjectTaskGraphStack;
    __kiuSwApi.trySyncProjectTaskGraphStackDialog = trySyncProjectTaskGraphStackDialog;
    __kiuSwApi.syncProjectTaskGraphStackSlotState = syncProjectTaskGraphStackSlotState;
    __kiuSwApi.projectTaskGraphStackedBackdropClass = projectTaskGraphStackedBackdropClass;
    __kiuSwApi.resolveProjectTaskGraphNodeFromTarget = resolveProjectTaskGraphNodeFromTarget;
    __kiuSwApi.projectTaskDependsOnIds = projectTaskDependsOnIds;
    __kiuSwApi.clampProjectTaskGraphCardHeight = clampProjectTaskGraphCardHeight;
    __kiuSwApi.estimateProjectTaskGraphCardHeight = estimateProjectTaskGraphCardHeight;
    __kiuSwApi.measureProjectTaskGraphCardHeights = measureProjectTaskGraphCardHeights;
    __kiuSwApi.normalizeProjectTaskGraphMode = normalizeProjectTaskGraphMode;
    __kiuSwApi.projectTaskGraphShowInferred = projectTaskGraphShowInferred;
    __kiuSwApi.projectTaskGraphShowCritical = projectTaskGraphShowCritical;
    __kiuSwApi.projectTaskGraphShowFlow = projectTaskGraphShowFlow;
    __kiuSwApi.projectTaskGraphVisibleEdges = projectTaskGraphVisibleEdges;
    __kiuSwApi.buildProjectTaskGraphModel = buildProjectTaskGraphModel;
    __kiuSwApi.layoutProjectTaskGraphByStatus = layoutProjectTaskGraphByStatus;
    __kiuSwApi.compareProjectTaskGraphNodes = compareProjectTaskGraphNodes;
    __kiuSwApi.hashProjectTaskGraphSeed = hashProjectTaskGraphSeed;
    __kiuSwApi.projectTaskGraphPseudoRandom = projectTaskGraphPseudoRandom;
    __kiuSwApi.getProjectTaskGraphMetrics = getProjectTaskGraphMetrics;
    __kiuSwApi.computeProjectTaskGraphStageSize = computeProjectTaskGraphStageSize;
    __kiuSwApi.computeProjectTaskGraphNodeDegree = computeProjectTaskGraphNodeDegree;
    __kiuSwApi.projectTaskGraphBoxRepulse = projectTaskGraphBoxRepulse;
    __kiuSwApi.resolveProjectTaskGraphCardOverlaps = resolveProjectTaskGraphCardOverlaps;
    __kiuSwApi.layoutProjectTaskGraphForce = layoutProjectTaskGraphForce;
    __kiuSwApi.projectTaskGraphLayoutUsesSavedPositions = projectTaskGraphLayoutUsesSavedPositions;
    __kiuSwApi.applyProjectTaskGraphSavedPositions = applyProjectTaskGraphSavedPositions;
    __kiuSwApi.projectTaskGraphRectsOverlap = projectTaskGraphRectsOverlap;
    __kiuSwApi.findFreeProjectTaskGraphPosition = findFreeProjectTaskGraphPosition;
    __kiuSwApi.ensureProjectTaskGraphPositionForTask = ensureProjectTaskGraphPositionForTask;
    __kiuSwApi.projectTaskGraphContentBounds = projectTaskGraphContentBounds;
    __kiuSwApi.resolveProjectTaskGraphGroupBox = resolveProjectTaskGraphGroupBox;
    __kiuSwApi.collectProjectTaskGraphGroupBoxes = collectProjectTaskGraphGroupBoxes;
    __kiuSwApi.projectTaskGraphContentViewBox = projectTaskGraphContentViewBox;
    __kiuSwApi.projectTaskGraphPositionsStorageKey = projectTaskGraphPositionsStorageKey;
    __kiuSwApi.loadProjectTaskGraphPositions = loadProjectTaskGraphPositions;
    __kiuSwApi.saveProjectTaskGraphPositions = saveProjectTaskGraphPositions;
    __kiuSwApi.getProjectTaskGraphPositions = getProjectTaskGraphPositions;
    __kiuSwApi.setProjectTaskGraphPositions = setProjectTaskGraphPositions;
    __kiuSwApi.ensureProjectTaskGraphPositionsLoaded = ensureProjectTaskGraphPositionsLoaded;
    __kiuSwApi.projectTaskGraphViewStorageKey = projectTaskGraphViewStorageKey;
    __kiuSwApi.clampProjectTaskGraphZoom = clampProjectTaskGraphZoom;
    __kiuSwApi.loadProjectTaskGraphView = loadProjectTaskGraphView;
    __kiuSwApi.saveProjectTaskGraphView = saveProjectTaskGraphView;
    __kiuSwApi.persistProjectTaskGraphView = persistProjectTaskGraphView;
    __kiuSwApi.projectTaskGraphSyncStorageKey = projectTaskGraphSyncStorageKey;
    __kiuSwApi.seedProjectTaskGraphFromProject = seedProjectTaskGraphFromProject;
    __kiuSwApi.queueProjectTaskGraphSync = queueProjectTaskGraphSync;
    __kiuSwApi.projectTaskGraphGroupsStorageKey = projectTaskGraphGroupsStorageKey;
    __kiuSwApi.getProjectTaskGraphGroups = getProjectTaskGraphGroups;
    __kiuSwApi.setProjectTaskGraphGroups = setProjectTaskGraphGroups;
    __kiuSwApi.projectTaskGraphCheckpointStorageKey = projectTaskGraphCheckpointStorageKey;
    __kiuSwApi.projectTaskGraphCheckpointsStorageKey = projectTaskGraphCheckpointsStorageKey;
    __kiuSwApi.formatProjectTaskGraphCheckpointWhen = formatProjectTaskGraphCheckpointWhen;
    __kiuSwApi.pulseProjectTaskGraphCheckpointButton = pulseProjectTaskGraphCheckpointButton;
    __kiuSwApi.normalizeProjectTaskGraphCheckpointEntry = normalizeProjectTaskGraphCheckpointEntry;
    __kiuSwApi.readProjectTaskGraphCheckpoints = readProjectTaskGraphCheckpoints;
    __kiuSwApi.writeProjectTaskGraphCheckpoints = writeProjectTaskGraphCheckpoints;
    __kiuSwApi.readProjectTaskGraphCheckpoint = readProjectTaskGraphCheckpoint;
    __kiuSwApi.getProjectTaskGraphCheckpointById = getProjectTaskGraphCheckpointById;
    __kiuSwApi.deleteProjectTaskGraphCheckpoint = deleteProjectTaskGraphCheckpoint;
    __kiuSwApi.flushProjectTaskGraphSync = flushProjectTaskGraphSync;
    __kiuSwApi.collectProjectTaskGraphCheckpoint = collectProjectTaskGraphCheckpoint;
    __kiuSwApi.saveProjectTaskGraphCheckpoint = saveProjectTaskGraphCheckpoint;
    __kiuSwApi.applyProjectTaskGraphCheckpointSnapshot = applyProjectTaskGraphCheckpointSnapshot;
    __kiuSwApi.restoreProjectTaskGraphCheckpoint = restoreProjectTaskGraphCheckpoint;
    __kiuSwApi.createProjectTaskGraphGroup = createProjectTaskGraphGroup;
    __kiuSwApi.updateProjectTaskGraphGroup = updateProjectTaskGraphGroup;
    __kiuSwApi.deleteProjectTaskGraphGroup = deleteProjectTaskGraphGroup;
    __kiuSwApi.scrubDeletedTaskFromProjectTaskGraphGroups = scrubDeletedTaskFromProjectTaskGraphGroups;
    __kiuSwApi.projectTaskGraphGroupMembershipWouldCycle = projectTaskGraphGroupMembershipWouldCycle;
    __kiuSwApi.toggleProjectTaskGraphGroupMember = toggleProjectTaskGraphGroupMember;
    __kiuSwApi.isProjectTaskGraphGroupId = isProjectTaskGraphGroupId;
    __kiuSwApi.projectGroupDependsOnIds = projectGroupDependsOnIds;
    __kiuSwApi.projectGroupBlocksIds = projectGroupBlocksIds;
    __kiuSwApi.collectProjectTaskGraphGroupDescendantTaskIds = collectProjectTaskGraphGroupDescendantTaskIds;
    __kiuSwApi.collectProjectTaskGraphGroupAbsorbedTaskIds = collectProjectTaskGraphGroupAbsorbedTaskIds;
    __kiuSwApi.isProjectTaskGraphGroupComplete = isProjectTaskGraphGroupComplete;
    __kiuSwApi.isProjectGraphDependencyOpen = isProjectGraphDependencyOpen;
    __kiuSwApi.computeProjectTaskGraphGroupRollup = computeProjectTaskGraphGroupRollup;
    __kiuSwApi.getProjectTaskGraphGroupLinkSummary = getProjectTaskGraphGroupLinkSummary;
    __kiuSwApi.computeProjectTaskGraphContentFitView = computeProjectTaskGraphContentFitView;
    __kiuSwApi.buildProjectTaskGraphLayoutForView = buildProjectTaskGraphLayoutForView;
    __kiuSwApi.applyProjectTaskGraphResetView = applyProjectTaskGraphResetView;
    __kiuSwApi.projectTaskGraphBoxAnchor = projectTaskGraphBoxAnchor;
    __kiuSwApi.getProjectTaskGraphDocks = getProjectTaskGraphDocks;
    __kiuSwApi.projectTaskGraphDockAlongSide = projectTaskGraphDockAlongSide;
    __kiuSwApi.scoreProjectTaskGraphDockPair = scoreProjectTaskGraphDockPair;
    __kiuSwApi.selectProjectTaskGraphDockPair = selectProjectTaskGraphDockPair;
    __kiuSwApi.buildProjectTaskGraphSeedPolyline = buildProjectTaskGraphSeedPolyline;
    __kiuSwApi.sampleProjectTaskGraphPolyline = sampleProjectTaskGraphPolyline;
    __kiuSwApi.projectTaskGraphPushOutOfRect = projectTaskGraphPushOutOfRect;
    __kiuSwApi.relaxProjectTaskGraphPolyline = relaxProjectTaskGraphPolyline;
    __kiuSwApi.normalizeProjectTaskGraphStatusId = normalizeProjectTaskGraphStatusId;
    __kiuSwApi.projectTaskGraphStatusEdgeColor = projectTaskGraphStatusEdgeColor;
    __kiuSwApi.projectTaskGraphCubicEdgePath = projectTaskGraphCubicEdgePath;
    __kiuSwApi.projectTaskGraphEdgePath = projectTaskGraphEdgePath;
    __kiuSwApi.projectTaskGraphEdgeAnchors = projectTaskGraphEdgeAnchors;
    __kiuSwApi.projectTaskGraphObstacleList = projectTaskGraphObstacleList;
    __kiuSwApi.projectTaskGraphEdgeFanMap = projectTaskGraphEdgeFanMap;
    __kiuSwApi.formatProjectTaskGraphNodeLabel = formatProjectTaskGraphNodeLabel;
    __kiuSwApi.computeProjectTaskGraphFitZoom = computeProjectTaskGraphFitZoom;
    __kiuSwApi.computeProjectTaskGraphPreviewZoom = computeProjectTaskGraphPreviewZoom;
    __kiuSwApi.projectTaskGraphPortRole = projectTaskGraphPortRole;
    __kiuSwApi.resolveProjectTaskGraphWireEndpoints = resolveProjectTaskGraphWireEndpoints;
    __kiuSwApi.readProjectTaskGraphPortCenter = readProjectTaskGraphPortCenter;
    __kiuSwApi.resolveProjectTaskGraphLinkPreviewHost = resolveProjectTaskGraphLinkPreviewHost;
    __kiuSwApi.ensureProjectTaskGraphLinkPreview = ensureProjectTaskGraphLinkPreview;
    __kiuSwApi.updateProjectTaskGraphLinkPreview = updateProjectTaskGraphLinkPreview;
    __kiuSwApi.clearProjectTaskGraphLinkPreview = clearProjectTaskGraphLinkPreview;
    __kiuSwApi.setProjectTaskGraphInteracting = setProjectTaskGraphInteracting;
    __kiuSwApi.scheduleProjectTaskGraphEdgeRefresh = scheduleProjectTaskGraphEdgeRefresh;
    __kiuSwApi.findProjectTaskGraphLinkDropTarget = findProjectTaskGraphLinkDropTarget;
    __kiuSwApi.findProjectTaskGraphMembershipDropGroup = findProjectTaskGraphMembershipDropGroup;
    __kiuSwApi.readProjectTaskGraphLivePositions = readProjectTaskGraphLivePositions;
    __kiuSwApi.escapeProjectTaskGraphAttr = escapeProjectTaskGraphAttr;
    __kiuSwApi.patchRemoveProjectTaskGraphEdge = patchRemoveProjectTaskGraphEdge;
    __kiuSwApi.patchProjectTaskGraphLinkCountLabel = patchProjectTaskGraphLinkCountLabel;
    __kiuSwApi.syncProjectTaskGraphEdgesOnly = syncProjectTaskGraphEdgesOnly;
    __kiuSwApi.refreshProjectTaskGraphEdgeLines = refreshProjectTaskGraphEdgeLines;
    __kiuSwApi.projectTaskGraphWouldCycle = projectTaskGraphWouldCycle;
    __kiuSwApi.readProjectTaskGraphPan = readProjectTaskGraphPan;
    __kiuSwApi.isProjectTaskGraphScrollPanCanvas = isProjectTaskGraphScrollPanCanvas;
    __kiuSwApi.resolveProjectTaskGraphPanSlack = resolveProjectTaskGraphPanSlack;
    __kiuSwApi.clampProjectTaskGraphPan = clampProjectTaskGraphPan;
    __kiuSwApi.readProjectTaskGraphScrollSurface = readProjectTaskGraphScrollSurface;
    __kiuSwApi.readProjectTaskGraphLayoutSize = readProjectTaskGraphLayoutSize;
    __kiuSwApi.projectTaskGraphScrollOffsets = projectTaskGraphScrollOffsets;
    __kiuSwApi.readProjectTaskGraphPanSlackFromCanvas = readProjectTaskGraphPanSlackFromCanvas;
    __kiuSwApi.readProjectTaskGraphPanFromScroll = readProjectTaskGraphPanFromScroll;
    __kiuSwApi.ensureProjectTaskGraphScrollSurface = ensureProjectTaskGraphScrollSurface;
    __kiuSwApi.applyProjectTaskGraphScrollZoom = applyProjectTaskGraphScrollZoom;
    __kiuSwApi.centerProjectTaskGraphScrollPan = centerProjectTaskGraphScrollPan;
    __kiuSwApi.applyProjectTaskGraphCanvasTransform = applyProjectTaskGraphCanvasTransform;
    __kiuSwApi.initProjectTaskGraphScrollPan = initProjectTaskGraphScrollPan;
    __kiuSwApi.resolveProjectTaskGraphPanBackdrop = resolveProjectTaskGraphPanBackdrop;
    __kiuSwApi.clientToProjectTaskGraphCoords = clientToProjectTaskGraphCoords;
    __kiuSwApi.getProjectTaskGraphHost = getProjectTaskGraphHost;
    __kiuSwApi.projectTaskGraphMineOnlyActive = projectTaskGraphMineOnlyActive;
    __kiuSwApi.filterProjectTaskGraphVisibleTasks = filterProjectTaskGraphVisibleTasks;
    __kiuSwApi.resolveProjectTaskGraphScheduleScope = resolveProjectTaskGraphScheduleScope;
    __kiuSwApi.computeProjectTaskGraphMapSchedule = computeProjectTaskGraphMapSchedule;
    __kiuSwApi.resolveProjectTaskGraphContext = resolveProjectTaskGraphContext;
    __kiuSwApi.buildProjectTaskGraphLayout = buildProjectTaskGraphLayout;
    __kiuSwApi.applyProjectTaskGraphZoom = applyProjectTaskGraphZoom;
    __kiuSwApi.syncProjectTaskGraphChrome = syncProjectTaskGraphChrome;
    __kiuSwApi.syncProjectTaskGraphGroupFocus = syncProjectTaskGraphGroupFocus;
    __kiuSwApi.collectProjectTaskGraphNeighborIds = collectProjectTaskGraphNeighborIds;
    __kiuSwApi.syncProjectTaskGraphSelection = syncProjectTaskGraphSelection;
    __kiuSwApi.syncProjectTaskGraphCanvas = syncProjectTaskGraphCanvas;
    __kiuSwApi.syncProjectTaskGraphQuickCreate = syncProjectTaskGraphQuickCreate;
    __kiuSwApi.syncProjectTaskGraphSidebar = syncProjectTaskGraphSidebar;
    __kiuSwApi.refreshProjectTaskGraphDialog = refreshProjectTaskGraphDialog;
    __kiuSwApi.selectProjectTaskGraphNode = selectProjectTaskGraphNode;
    __kiuSwApi.addProjectTaskDependency = addProjectTaskDependency;
    __kiuSwApi.removeProjectTaskDependency = removeProjectTaskDependency;
    __kiuSwApi.addProjectGraphDependency = addProjectGraphDependency;
    __kiuSwApi.patchLocalProjectTaskDepends = patchLocalProjectTaskDepends;
    __kiuSwApi.removeProjectGraphDependency = removeProjectGraphDependency;
    __kiuSwApi.detachProjectTaskGraphPanWindowListeners = detachProjectTaskGraphPanWindowListeners;
    __kiuSwApi.attachProjectTaskGraphPanWindowListeners = attachProjectTaskGraphPanWindowListeners;
    __kiuSwApi.isProjectTaskGraphPanButton = isProjectTaskGraphPanButton;
    __kiuSwApi.closeProjectTaskGraphContextMenu = closeProjectTaskGraphContextMenu;
    __kiuSwApi.openProjectTaskGraphContextMenu = openProjectTaskGraphContextMenu;
    __kiuSwApi.bindProjectTaskGraphInteractions = bindProjectTaskGraphInteractions;
    __kiuSwApi.bindProjectTaskGraphDrag = bindProjectTaskGraphDrag;
    __kiuSwApi.bindProjectTaskGraphResizeObserver = bindProjectTaskGraphResizeObserver;
    __kiuSwApi.isProjectTaskGraphDialogOpen = isProjectTaskGraphDialogOpen;
    __kiuSwApi.markProjectTaskGraphPreviewStale = markProjectTaskGraphPreviewStale;
    __kiuSwApi.notifyProjectTaskGraphSurfaceChanged = notifyProjectTaskGraphSurfaceChanged;

    /* ── Task detail / risk / health dialogs: social-workspace-dialogs.js ── */
    const __wsDialogsApi = (typeof (window.createKiuSocialWorkspaceDialogsApi || window.__kiuCreateSocialWorkspaceDialogsApi) === 'function'
        ? (window.__kiuCreateSocialWorkspaceDialogsApi || window.createKiuSocialWorkspaceDialogsApi)({
        PROJECT_RISK_RESPONSE_OPTIONS,
        PROJECT_RISK_STATUS_OPTIONS,
        PROJECT_TASK_COLUMNS,
        PROJECT_TASK_STATUS_EDGE_COLOR,
        __riskModel,
        accountById,
        avatar,
        computeProjectSchedule,
        controlId,
        displayName,
        escape,
        formatProjectScheduleDate,
        formatProjectScheduleHours,
        formatProjectTaskBudgetEstimate,
        formatTaskCostVariance,
        formatTaskScheduleDisplay,
        formatTaskTime,
        formatTaskTimeVariance,
        getProjectTaskGraphGroups,
        isProjectTaskGraphGroupId,
        neoActions,
        neoField,
        neoHeadHtml,
        normalizeProjectPlanHorizon,
        normalizeProjectTaskStatusId,
        normalizeTaskTime,
        projectPlanHorizonLabel,
        projectTaskDependsOnIds,
        projectTaskDownstreamIds,
        projectTaskGraphStackedBackdropClass,
        readProjectWeekPlan,
        resolveActiveSocialProject,
        resolveDeskTaskReadiness,
        resolveProjectTaskPriorityDisplay,
        resolveTaskPackageId,
        resolveTaskScheduleEstimate,
        sumProjectActualHours,
        sumProjectOpenWorkHours,
        taskDurationHours,
        taskHasPert,
        text,
        when,
        })
        : null);
    const buildProjectHealthPlanPickModel = __wsDialogsApi?.buildProjectHealthPlanPickModel;
    const buildProjectRiskCountByTaskId = __wsDialogsApi?.buildProjectRiskCountByTaskId;
    const formatProjectRiskScore = __wsDialogsApi?.formatProjectRiskScore;
    const projectRiskExposureScore = __wsDialogsApi?.projectRiskExposureScore;
    const projectRiskExposureTiers = __wsDialogsApi?.projectRiskExposureTiers;
    const projectRiskIsActiveStatus = __wsDialogsApi?.projectRiskIsActiveStatus;
    const projectRiskLinkedTaskIdList = __wsDialogsApi?.projectRiskLinkedTaskIdList;
    const projectRiskLinksTask = __wsDialogsApi?.projectRiskLinksTask;
    const projectRiskOptionLabel = __wsDialogsApi?.projectRiskOptionLabel;
    const projectRiskRegisterSummary = __wsDialogsApi?.projectRiskRegisterSummary;
    const projectRiskScaleOptionLabel = __wsDialogsApi?.projectRiskScaleOptionLabel;
    const projectRiskScaleRank = __wsDialogsApi?.projectRiskScaleRank;
    const renderProjectHealthDialog = __wsDialogsApi?.renderProjectHealthDialog;
    const renderProjectHealthPlanCardHtml = __wsDialogsApi?.renderProjectHealthPlanCardHtml;
    const renderProjectHealthPlanPickBodyHtml = __wsDialogsApi?.renderProjectHealthPlanPickBodyHtml;
    const renderProjectHealthPlanPickDialog = __wsDialogsApi?.renderProjectHealthPlanPickDialog;
    const renderProjectHealthPlanPickRailHtml = __wsDialogsApi?.renderProjectHealthPlanPickRailHtml;
    const renderProjectHealthPlanPickResultsHtml = __wsDialogsApi?.renderProjectHealthPlanPickResultsHtml;
    const renderProjectHealthPlanPickToolbarHtml = __wsDialogsApi?.renderProjectHealthPlanPickToolbarHtml;
    const renderProjectRiskDialog = __wsDialogsApi?.renderProjectRiskDialog;
    const renderProjectRiskScaleOptions = __wsDialogsApi?.renderProjectRiskScaleOptions;
    const renderProjectTaskDetailModal = __wsDialogsApi?.renderProjectTaskDetailModal;
    const sortProjectRisksForRegister = __wsDialogsApi?.sortProjectRisksForRegister;

    /* ── Task form / desk / board UI: social-workspace-task-ui.js ── */
    const __wsTaskUiApi = (typeof (window.createKiuSocialWorkspaceTaskUiApi || window.__kiuCreateSocialWorkspaceTaskUiApi) === 'function'
        ? (window.__kiuCreateSocialWorkspaceTaskUiApi || window.createKiuSocialWorkspaceTaskUiApi)({
        PROJECT_TASK_COLUMNS,
        accountById,
        activeDialog,
        avatar,
        buildProjectTaskInspectorFields,
        computeTaskMatrixBucket,
        computeTaskMatrixScore,
        controlId,
        countNum,
        displayName,
        escape,
        formatProjectScheduleHours,
        formatProjectTaskBudgetEstimate,
        formatTaskTime,
        getProjectTaskGraphGroups,
        isProjectTaskGraphGroupId,
        neoActions,
        neoField,
        neoHead,
        neoHeadHtml,
        neoSection,
        normalizeTaskScore1to5,
        normalizeTaskTime,
        normalizeTaskTimeUnit,
        projectTaskDependsOnIds,
        projectTaskDownstreamIds,
        projectTaskGraphStackedBackdropClass,
        resolveActiveSocialProject,
        resolveDeskTaskReadiness,
        resolveTaskScheduleEstimate,
        socialNeoFieldHtml,
        state,
        taskHasPert,
        text,
        toDateTimeLocalValue,
        uniqueStrings,
        when,
        })
        : null);
    const renderProjectTaskDeleteConfirmDialog = __wsTaskUiApi?.renderProjectTaskDeleteConfirmDialog;
    const renderProjectTaskCreateDialog = __wsTaskUiApi?.renderProjectTaskCreateDialog;
    const renderProjectTaskFormFields = __wsTaskUiApi?.renderProjectTaskFormFields;
    const renderDeskTaskTreeForest = __wsTaskUiApi?.renderDeskTaskTreeForest;
    const renderProjectTaskDeskCard = __wsTaskUiApi?.renderProjectTaskDeskCard;
    const renderProjectTaskCard = __wsTaskUiApi?.renderProjectTaskCard;
    const renderProjectTaskColumnList = __wsTaskUiApi?.renderProjectTaskColumnList;
    const renderProjectColumnTasksModal = __wsTaskUiApi?.renderProjectColumnTasksModal;

    __kiuSwApi.renderProjectTaskDeleteConfirmDialog = renderProjectTaskDeleteConfirmDialog;
    __kiuSwApi.renderProjectTaskCreateDialog = renderProjectTaskCreateDialog;
    __kiuSwApi.renderProjectTaskFormFields = renderProjectTaskFormFields;
    __kiuSwApi.renderProjectTaskDetailModal = renderProjectTaskDetailModal;
    __kiuSwApi.renderProjectHealthDialog = renderProjectHealthDialog;
    __kiuSwApi.renderProjectHealthPlanCardHtml = renderProjectHealthPlanCardHtml;
    __kiuSwApi.renderProjectHealthPlanPickDialog = renderProjectHealthPlanPickDialog;
    __kiuSwApi.renderProjectHealthPlanPickBodyHtml = renderProjectHealthPlanPickBodyHtml;
    __kiuSwApi.buildProjectHealthPlanPickModel = buildProjectHealthPlanPickModel;
    __kiuSwApi.renderProjectRiskDialog = renderProjectRiskDialog;
    __kiuSwApi.renderProjectRiskScaleOptions = renderProjectRiskScaleOptions;
    __kiuSwApi.projectRiskRegisterSummary = projectRiskRegisterSummary;
    __kiuSwApi.sortProjectRisksForRegister = sortProjectRisksForRegister;
    __kiuSwApi.projectRiskExposureScore = projectRiskExposureScore;
    __kiuSwApi.projectRiskOptionLabel = projectRiskOptionLabel;
    __kiuSwApi.projectRiskScaleRank = projectRiskScaleRank;
    __kiuSwApi.projectRiskScaleOptionLabel = projectRiskScaleOptionLabel;
    __kiuSwApi.formatProjectRiskScore = formatProjectRiskScore;
    __kiuSwApi.projectRiskExposureTiers = projectRiskExposureTiers;
    __kiuSwApi.projectRiskIsActiveStatus = projectRiskIsActiveStatus;
    __kiuSwApi.projectRiskLinkedTaskIdList = projectRiskLinkedTaskIdList;
    __kiuSwApi.projectRiskLinksTask = projectRiskLinksTask;
    __kiuSwApi.buildProjectRiskCountByTaskId = buildProjectRiskCountByTaskId;


    // Classic panel: social-workspace-panel.js (loaded before this module)
    const __wsPanelApi = (typeof (window.createKiuSocialWorkspacePanelApi || window.__kiuCreateSocialWorkspacePanelApi) === 'function'
        ? (window.__kiuCreateSocialWorkspacePanelApi || window.createKiuSocialWorkspacePanelApi)({
        PROJECT_TASK_COLUMNS,
        accountById,
        accountSubtitle,
        avatar,
        buildDeskTaskForest,
        clearProjectTabPaneCache,
        computeProjectSchedule,
        computeProjectTaskGraphGroupRollup,
        countNum,
        currentFacultyCode,
        currentUserId,
        displayName,
        ensureProjectWorkspaceChat,
        ensureSocialMessagesModule,
        escape,
        filterProjectBoardTasks,
        formatProjectScheduleDate,
        formatProjectScheduleHours,
        formatProjectTaskBudgetEstimate,
        getProjectTaskGraphGroups,
        hasSocialMessagesModule,
        isAccountOnline,
        isStaffAccount,
        normalizeProjectTaskStatusId,
        orderDeskTasksByDependency,
        projectTaskDependsOnIds: window.projectTaskDependsOnIds,
        projectTaskDownstreamIds,
        queueDeferredModuleRender,
        readDeskSavedViews,
        renderDeskTaskTreeForest,
        renderMessagesThreadShell: typeof __kiuSwApi.renderMessagesThreadShell === 'function' ? window.renderMessagesThreadShell : () => '',
        renderProjectPlanVsBaselineStrip,
        renderProjectProgressHoursStrip,
        renderProjectTaskCard,
        renderProjectTaskColumnList,
        renderProjectTaskDeskCard,
        renderProjectWorkspaceNavButtons,
        renderSocialPageNow,
        renderTaskDependencyGraphPreview: (...args) => {
            const fn = window.renderTaskDependencyGraphPreview
                || (window.KiuSocialWorkspace || {}).renderTaskDependencyGraphPreview;
            return typeof fn === 'function' ? fn(...args) : '';
        },
        renderWorkspaceHero,
        resolveDeskTaskReadiness,
        resolveProjectWorkspaceChat,
        resolveTaskScheduleEstimate,
        root,
        setActiveChat,
        socialNeoEmpty,
        socialNeoEmptyHero,
        state,
        taskActivityMs,
        text,
        uniqueStrings,
        when,
        })
        : null);
    const renderProjectsWorkspacePanelClassic = __wsPanelApi?.renderProjectsWorkspacePanelClassic
        || (() => socialNeoEmptyHero
            ? socialNeoEmptyHero('fas fa-diagram-project', 'Projects unavailable', 'Workspace panel module failed to load.')
            : '');

    /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
       PAGES PANEL - Facebook-style page discovery & management
       â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

    // Export classic hub + desk/card renderers before graph/portfolio append stacks so
    // source-lock tests can bound classic with window.renderProjectsWorkspacePanelClassic.
    __kiuSwApi.renderProjectsWorkspacePanelClassic = renderProjectsWorkspacePanelClassic;
    __kiuSwApi.renderProjectTaskDeskCard = renderProjectTaskDeskCard;
    __kiuSwApi.renderDeskTaskTreeForest = renderDeskTaskTreeForest;
    __kiuSwApi.renderProjectTaskCard = renderProjectTaskCard;
    __kiuSwApi.renderProjectTaskColumnList = renderProjectTaskColumnList;
    __kiuSwApi.renderProjectColumnTasksModal = renderProjectColumnTasksModal;

    /* ── Workspace-owned dialog routing (project / portfolio / graph stack) ── */

    /* ── Workspace-owned dialog routing: social-workspace-dialog-route.js ── */


    /* ── Task graph render stack (preview / fullscreen / SVG / inspectors) ── */

    /* ── Task graph render stack: social-workspace-graph-render.js ── */
    const __wsGraphRenderApi = (typeof (window.createKiuSocialWorkspaceGraphRenderApi || window.__kiuCreateSocialWorkspaceGraphRenderApi) === 'function'
        ? (window.__kiuCreateSocialWorkspaceGraphRenderApi || window.createKiuSocialWorkspaceGraphRenderApi)({
        PROJECT_TASK_COLUMNS,
        PROJECT_TASK_GRAPH_CARD_COMPACT_H,
        PROJECT_TASK_GRAPH_CARD_COMPACT_W,
        PROJECT_TASK_GRAPH_CARD_H,
        PROJECT_TASK_GRAPH_CARD_W,
        PROJECT_TASK_GRAPH_CHECKPOINT_MAX,
        PROJECT_TASK_GRAPH_FO_PAD,
        PROJECT_TASK_GRAPH_MAX_ZOOM,
        PROJECT_TASK_GRAPH_MIN_ZOOM,
        PROJECT_TASK_GROUP_NODE_H: __swGraphBatch.PROJECT_TASK_GROUP_NODE_H || 228,
        PROJECT_TASK_GROUP_NODE_W: __swGraphBatch.PROJECT_TASK_GROUP_NODE_W || 264,
        PROJECT_SCHEDULE_FLOAT_TITLE,
        accountById,
        applyProjectTaskGraphSavedPositions,
        avatar,
        buildProjectTaskGraphLayout,
        buildProjectTaskGraphModel,
        buildProjectTaskInspectorFields,
        clampProjectTaskGraphZoom,
        collectProjectTaskGraphGroupBoxes,
        computeProjectSchedule,
        computeProjectTaskGraphFitZoom,
        computeProjectTaskGraphGroupRollup,
        computeProjectTaskGraphMapSchedule,
        computeProjectTaskGraphStageSize,
        countNum,
        displayName,
        ensureProjectTaskGraphPositionsLoaded,
        escape,
        filterProjectTaskGraphVisibleTasks,
        formatProjectScheduleDate,
        formatProjectScheduleFloat,
        formatProjectScheduleHours,
        formatProjectTaskBudgetEstimate,
        formatProjectTaskGraphCheckpointWhen,
        formatProjectTaskGraphNodeLabel,
        formatTaskCostVariance,
        formatTaskScheduleDisplay,
        formatTaskTime,
        getProjectTaskGraphGroupLinkSummary,
        getProjectTaskGraphGroups,
        getProjectTaskGraphPositions,
        isProjectTaskGraphGroupId,
        neoActions,
        neoHead,
        normalizeProjectTaskGraphMode,
        normalizeProjectTaskGraphStatusId,
        normalizeTaskTime,
        normalizeTaskTimeUnit,
        projectGroupBlocksIds,
        projectGroupDependsOnIds,
        projectTaskDependsOnIds,
        projectTaskGraphEdgeFanMap,
        projectTaskGraphEdgePath,
        projectTaskGraphLayoutUsesSavedPositions,
        projectTaskGraphMineOnlyActive,
        projectTaskGraphObstacleList,
        projectTaskGraphShowCritical,
        projectTaskGraphShowFlow,
        projectTaskGraphShowInferred,
        projectTaskGraphStatusEdgeColor,
        projectTaskGraphContentViewBox,
        readProjectTaskGraphCheckpoints,
        readProjectTaskGraphPan,
        renderProjectWorkspaceNavButtons,
        resolveActiveSocialProject,
        resolveProjectTaskGraphContext,
        resolveProjectTaskGraphGroupBox,
        resolveProjectTaskGraphPanSlack,
        resolveProjectTaskGraphScheduleScope,
        resolveProjectTaskPriorityDisplay,
        resolveTaskScheduleEstimate,
        state,
        taskDurationHours,
        taskHasPert,
        text,
        when,
        })
        : null);
    const buildProjectTaskGraphCanvasMarkup = __wsGraphRenderApi?.buildProjectTaskGraphCanvasMarkup;
    const renderProjectTaskGraphCanvas = __wsGraphRenderApi?.renderProjectTaskGraphCanvas;
    const renderProjectTaskGraphCardNode = __wsGraphRenderApi?.renderProjectTaskGraphCardNode;
    const renderProjectTaskGraphDetailRailContent = __wsGraphRenderApi?.renderProjectTaskGraphDetailRailContent;
    const renderProjectTaskGraphDetailRailPlaceholder = __wsGraphRenderApi?.renderProjectTaskGraphDetailRailPlaceholder;
    const renderProjectTaskGraphEdgeGroupsHtml = __wsGraphRenderApi?.renderProjectTaskGraphEdgeGroupsHtml;
    const renderProjectTaskGraphFullscreen = __wsGraphRenderApi?.renderProjectTaskGraphFullscreen;
    const renderProjectTaskGraphGroupDependencyEdgesHtml = __wsGraphRenderApi?.renderProjectTaskGraphGroupDependencyEdgesHtml;
    const renderProjectTaskGraphGroupEdgesHtml = __wsGraphRenderApi?.renderProjectTaskGraphGroupEdgesHtml;
    const renderProjectTaskGraphGroupInspector = __wsGraphRenderApi?.renderProjectTaskGraphGroupInspector;
    const renderProjectTaskGraphGroupNode = __wsGraphRenderApi?.renderProjectTaskGraphGroupNode;
    const renderProjectTaskGraphHealth = __wsGraphRenderApi?.renderProjectTaskGraphHealth;
    const renderProjectTaskGraphHistoryDialog = __wsGraphRenderApi?.renderProjectTaskGraphHistoryDialog;
    const renderProjectTaskGraphInspector = __wsGraphRenderApi?.renderProjectTaskGraphInspector;
    const renderProjectTaskGraphLegend = __wsGraphRenderApi?.renderProjectTaskGraphLegend;
    const renderProjectTaskGraphQuickCreatePopover = __wsGraphRenderApi?.renderProjectTaskGraphQuickCreatePopover;
    const renderProjectTaskGraphRailOverview = __wsGraphRenderApi?.renderProjectTaskGraphRailOverview;
    const renderProjectTaskGraphScheduleHelpDialog = __wsGraphRenderApi?.renderProjectTaskGraphScheduleHelpDialog;
    const renderProjectTaskGraphScheduleOverview = __wsGraphRenderApi?.renderProjectTaskGraphScheduleOverview;
    const renderProjectTaskGraphStatusMini = __wsGraphRenderApi?.renderProjectTaskGraphStatusMini;
    const renderProjectTaskGraphSvg = __wsGraphRenderApi?.renderProjectTaskGraphSvg;
    const renderProjectTaskGraphTools = __wsGraphRenderApi?.renderProjectTaskGraphTools;
    const renderTaskDependencyGraphPreview = __wsGraphRenderApi?.renderTaskDependencyGraphPreview;

    __kiuSwApi.renderTaskDependencyGraphPreview = renderTaskDependencyGraphPreview;
    if (typeof renderTaskDependencyGraphPreview === 'function') {
        window.renderTaskDependencyGraphPreview = renderTaskDependencyGraphPreview;
    }
    __kiuSwApi.renderProjectTaskGraphFullscreen = renderProjectTaskGraphFullscreen;
    __kiuSwApi.renderProjectTaskGraphHistoryDialog = renderProjectTaskGraphHistoryDialog;
    __kiuSwApi.renderProjectTaskGraphScheduleHelpDialog = renderProjectTaskGraphScheduleHelpDialog;
    __kiuSwApi.renderProjectTaskGraphEdgeGroupsHtml = renderProjectTaskGraphEdgeGroupsHtml;
    __kiuSwApi.renderProjectTaskGraphGroupEdgesHtml = renderProjectTaskGraphGroupEdgesHtml;
    __kiuSwApi.renderProjectTaskGraphGroupDependencyEdgesHtml = renderProjectTaskGraphGroupDependencyEdgesHtml;
    __kiuSwApi.buildProjectTaskGraphCanvasMarkup = buildProjectTaskGraphCanvasMarkup;
    __kiuSwApi.renderProjectTaskGraphQuickCreatePopover = renderProjectTaskGraphQuickCreatePopover;
    __kiuSwApi.renderProjectTaskGraphDetailRailContent = renderProjectTaskGraphDetailRailContent;
    __kiuSwApi.renderProjectTaskGraphSvg = renderProjectTaskGraphSvg;
    __kiuSwApi.renderProjectTaskGraphCanvas = renderProjectTaskGraphCanvas;
    __kiuSwApi.renderProjectTaskGraphHealth = renderProjectTaskGraphHealth;
    __kiuSwApi.renderProjectTaskGraphInspector = renderProjectTaskGraphInspector;
    __kiuSwApi.renderProjectTaskGraphTools = renderProjectTaskGraphTools;
    __kiuSwApi.renderProjectTaskGraphLegend = renderProjectTaskGraphLegend;
    __kiuSwApi.renderProjectTaskGraphStatusMini = renderProjectTaskGraphStatusMini;

    /* ── Portfolio panel body (discover + mine + profile block + editor shell) ── */

    __kiuSwApi.renderProjectsPanel = renderProjectsPanel;
    __kiuSwApi.renderMyPortfolioPanel = renderMyPortfolioPanel;
    __kiuSwApi.renderPortfolioEditorDialog = renderPortfolioEditorDialog;
    __kiuSwApi.renderPortfolioCustomBuilderOverlay = renderPortfolioCustomBuilderOverlay;
    __kiuSwApi.renderPortfolioProfileBlock = renderPortfolioProfileBlock;

    __kiuSwApi.renderProjectsWorkspacePanelClassic = renderProjectsWorkspacePanelClassic;
    __kiuSwApi.renderProjectTaskDeskCard = renderProjectTaskDeskCard;
    __kiuSwApi.renderDeskTaskTreeForest = renderDeskTaskTreeForest;
    __kiuSwApi.renderProjectTaskCard = renderProjectTaskCard;
    __kiuSwApi.renderProjectTaskColumnList = renderProjectTaskColumnList;
    __kiuSwApi.renderProjectColumnTasksModal = renderProjectColumnTasksModal;

    /* schedule/desk helper exports for page stubs */
    __kiuSwApi.readProjectWeekPlansStore = readProjectWeekPlansStore;
    __kiuSwApi.readProjectWeekPlan = readProjectWeekPlan;
    __kiuSwApi.writeProjectWeekPlan = writeProjectWeekPlan;
    __kiuSwApi.addToProjectWeekPlan = addToProjectWeekPlan;
    __kiuSwApi.addManyToProjectWeekPlan = addManyToProjectWeekPlan;
    __kiuSwApi.removeFromProjectWeekPlan = removeFromProjectWeekPlan;
    __kiuSwApi.normalizeProjectWeekPlanWindow = normalizeProjectWeekPlanWindow;
    __kiuSwApi.orderDeskTasksByDependency = orderDeskTasksByDependency;
    __kiuSwApi.buildDeskTaskForest = buildDeskTaskForest;
    __kiuSwApi.computePertExpected = computePertExpected;
    __kiuSwApi.taskHasPert = taskHasPert;
    __kiuSwApi.resolveTaskScheduleEstimate = resolveTaskScheduleEstimate;
    __kiuSwApi.taskDurationHours = taskDurationHours;
    __kiuSwApi.taskScheduleRemainingHours = taskScheduleRemainingHours;
    __kiuSwApi.sumProjectOpenWorkHours = sumProjectOpenWorkHours;
    __kiuSwApi.sumProjectActualHours = sumProjectActualHours;
    __kiuSwApi.computeProjectSchedule = computeProjectSchedule;
    __kiuSwApi.formatProjectScheduleHours = formatProjectScheduleHours;
    __kiuSwApi.formatProjectScheduleFloat = formatProjectScheduleFloat;
    __kiuSwApi.formatTaskScheduleDisplay = formatTaskScheduleDisplay;
    __kiuSwApi.projectScheduleCalendarDate = projectScheduleCalendarDate;
    __kiuSwApi.formatProjectScheduleDate = formatProjectScheduleDate;
    __kiuSwApi.renderProjectPlanVsBaselineStrip = renderProjectPlanVsBaselineStrip;
    __kiuSwApi.renderProjectProgressHoursStrip = renderProjectProgressHoursStrip;

    /* portfolio data exports for page stubs */
    __kiuSwApi.portfolioStatus = portfolioStatus;
    __kiuSwApi.portfolioVisibilityMode = portfolioVisibilityMode;
    __kiuSwApi.parsePortfolioTextList = parsePortfolioTextList;
    __kiuSwApi.parsePortfolioLinksInput = parsePortfolioLinksInput;
    __kiuSwApi.serializePortfolioLinks = serializePortfolioLinks;
    __kiuSwApi.portfolioAudienceLabel = portfolioAudienceLabel;
    __kiuSwApi.normalizePortfolioEntry = normalizePortfolioEntry;
    __kiuSwApi.canViewerAccessPortfolioEntry = canViewerAccessPortfolioEntry;
    __kiuSwApi.portfolioEntriesForViewer = portfolioEntriesForViewer;
    __kiuSwApi.portfolioMatchesRoleFilter = portfolioMatchesRoleFilter;
    __kiuSwApi.portfolioDraftExists = portfolioDraftExists;
    __kiuSwApi.clonePortfolioDocument = clonePortfolioDocument;
    __kiuSwApi.portfolioMakeId = portfolioMakeId;
    __kiuSwApi.getMyPortfolioDocument = getMyPortfolioDocument;
    __kiuSwApi.ensureMyPortfolioDocument = ensureMyPortfolioDocument;
    __kiuSwApi.clearPortfolioApiDeniedFlag = clearPortfolioApiDeniedFlag;
    __kiuSwApi.hydrateMyPortfolioDocument = hydrateMyPortfolioDocument;
    __kiuSwApi.portfolioFieldValue = portfolioFieldValue;
    __kiuSwApi.portfolioReadDateRange = portfolioReadDateRange;
    __kiuSwApi.portfolioCollectDocumentFromUi = portfolioCollectDocumentFromUi;
    __kiuSwApi.saveMyPortfolioDocument = saveMyPortfolioDocument;
    __kiuSwApi.openPortfolioEditor = openPortfolioEditor;
    __kiuSwApi.resetPortfolioEditor = resetPortfolioEditor;

    /* ── Dialog routing: social-workspace-dialog-route.js ── */
    const __wsDialogRouteApi = (typeof (window.createKiuSocialWorkspaceDialogRouteApi || window.__kiuCreateSocialWorkspaceDialogRouteApi) === 'function'
        ? (window.__kiuCreateSocialWorkspaceDialogRouteApi || window.createKiuSocialWorkspaceDialogRouteApi)({
        accountById,
        activeDialog,
        currentUserId,
        displayName,
        escape,
        filterProjectBoardTasks,
        neoActions,
        neoHead,
        projectTaskGraphStackedBackdropClass,
        renderPortfolioCreateDialog,
        renderPortfolioEditorDialog,
        renderProjectColumnTasksModal,
        renderProjectCreateDialog,
        renderProjectHealthDialog,
        renderProjectHealthPlanPickDialog,
        renderProjectRiskDialog,
        renderProjectSettingsDialog,
        renderProjectTaskCreateDialog,
        renderProjectTaskDeleteConfirmDialog,
        renderProjectTaskDetailModal,
        renderProjectTaskGraphFullscreen,
        renderProjectTaskGraphHistoryDialog,
        renderProjectTaskGraphScheduleHelpDialog,
        resolveActiveSocialProject,
        getProjectTaskGraphStackAnchorDialog,
        shouldRenderProjectTaskGraphStack,
        state,
        text,
        wrapProjectTaskGraphStack,
        })
        : null);
    const shouldRenderProjectHealthStack = __wsDialogRouteApi?.shouldRenderProjectHealthStack;
    const wrapProjectHealthStack = __wsDialogRouteApi?.wrapProjectHealthStack;
    const renderHealthStackLayers = __wsDialogRouteApi?.renderHealthStackLayers;
    const maybeWrapStackedProjectDialog = __wsDialogRouteApi?.maybeWrapStackedProjectDialog;
    const renderStackedProjectTaskChild = __wsDialogRouteApi?.renderStackedProjectTaskChild;
    const renderWorkspaceOwnedDialog = __wsDialogRouteApi?.renderWorkspaceOwnedDialog;
    const PROJECT_HEALTH_OVERLAY_DIALOGS = __wsDialogRouteApi?.PROJECT_HEALTH_OVERLAY_DIALOGS;
    const WORKSPACE_OWNED_DIALOG_KINDS = __wsDialogRouteApi?.WORKSPACE_OWNED_DIALOG_KINDS;

    __kiuSwApi.renderWorkspaceOwnedDialog = renderWorkspaceOwnedDialog;
    __kiuSwApi.maybeWrapStackedProjectDialog = maybeWrapStackedProjectDialog;
    __kiuSwApi.shouldRenderProjectHealthStack = shouldRenderProjectHealthStack;
    __kiuSwApi.wrapProjectHealthStack = wrapProjectHealthStack;
    __kiuSwApi.renderHealthStackLayers = renderHealthStackLayers;
    __kiuSwApi.renderStackedProjectTaskChild = renderStackedProjectTaskChild;
    __kiuSwApi.WORKSPACE_OWNED_DIALOG_KINDS = WORKSPACE_OWNED_DIALOG_KINDS;



    // Event handlers: social-workspace-events.js (loaded before this module)
    const __wsEventsApi = (typeof (window.createKiuSocialWorkspaceEventsApi || window.__kiuCreateSocialWorkspaceEventsApi) === 'function'
        ? (window.__kiuCreateSocialWorkspaceEventsApi || window.createKiuSocialWorkspaceEventsApi)({
        PROJECT_TASK_GRAPH_MIN_ZOOM,
        accountById,
        activeDialog,
        addManyToProjectWeekPlan,
        addProjectTaskDependency,
        applyProjectTaskGraphResetView,
        applyProjectTaskGraphSavedPositions,
        assertUniqueProjectTaskTitle,
        buildProjectHealthPlanPickModel,
        buildProjectTaskGraphLayout,
        buildProjectTaskGraphModel,
        clampProjectTaskGraphZoom,
        clearProjectTabPaneCache,
        clearProjectTabPaneCacheKey,
        clonePortfolioDocument,
        closeDialog,
        closeProjectTaskGraphContextMenu,
        collectProjectTaskGraphGroupBoxes,
        computeProjectTaskGraphContentFitView,
        computeProjectTaskGraphStageSize,
        createPortalSocialProject: typeof createPortalSocialProject === 'function' ? createPortalSocialProject : window.createPortalSocialProject,
        createPortalSocialProjectBudgetCategory: typeof createPortalSocialProjectBudgetCategory === 'function' ? createPortalSocialProjectBudgetCategory : window.createPortalSocialProjectBudgetCategory,
        createPortalSocialProjectBudgetExpense: typeof createPortalSocialProjectBudgetExpense === 'function' ? createPortalSocialProjectBudgetExpense : window.createPortalSocialProjectBudgetExpense,
        createPortalSocialProjectRisk: typeof createPortalSocialProjectRisk === 'function' ? createPortalSocialProjectRisk : window.createPortalSocialProjectRisk,
        createPortalSocialProjectTask: typeof createPortalSocialProjectTask === 'function' ? createPortalSocialProjectTask : window.createPortalSocialProjectTask,
        createProjectTaskGraphGroup,
        currentFacultyCode,
        deletePortalSocialProject: typeof deletePortalSocialProject === 'function' ? deletePortalSocialProject : window.deletePortalSocialProject,
        deletePortalSocialProjectBudgetCategory: typeof deletePortalSocialProjectBudgetCategory === 'function' ? deletePortalSocialProjectBudgetCategory : window.deletePortalSocialProjectBudgetCategory,
        deletePortalSocialProjectBudgetExpense: typeof deletePortalSocialProjectBudgetExpense === 'function' ? deletePortalSocialProjectBudgetExpense : window.deletePortalSocialProjectBudgetExpense,
        deletePortalSocialProjectRisk: typeof deletePortalSocialProjectRisk === 'function' ? deletePortalSocialProjectRisk : window.deletePortalSocialProjectRisk,
        deletePortalSocialProjectTask: typeof deletePortalSocialProjectTask === 'function' ? deletePortalSocialProjectTask : window.deletePortalSocialProjectTask,
        deleteProjectTaskGraphCheckpoint,
        deleteProjectTaskGraphGroup,
        displayName,
        ensureProjectTaskGraphPositionForTask,
        ensureProjectTaskGraphPositionsLoaded,
        ensureProjectWorkspaceChat,
        escape,
        filterProjectTaskGraphVisibleTasks,
        focusSocialDialog,
        formatProjectTaskGraphCheckpointWhen,
        fromDateTimeLocalValue,
        getProjectTaskGraphCheckpointById,
        getProjectTaskGraphHost,
        getProjectTaskGraphPositions,
        getProjectTaskGraphStackAnchorDialog,
        hydrateMyPortfolioDocument,
        invalidateSocialRenderCache,
        isProjectTaskGraphGroupId,
        isProjectTaskGraphStackActive,
        isSocialWorkspaceChangeTarget,
        isSocialWorkspaceClickAction,
        isSocialWorkspaceInputTarget,
        isSocialWorkspaceSubmitForm,
        loadProjectTaskGraphView,
        markProjectTaskGraphPreviewStale,
        normalizePortfolioEntry,
        normalizeProjectPlanHorizon,
        normalizeProjectTaskGraphMode,
        normalizeTaskTimeUnit,
        notifyProjectTaskGraphSurfaceChanged,
        openDialog,
        openPortalDirectChat: typeof openPortalDirectChat === 'function' ? openPortalDirectChat : window.openPortalDirectChat,
        openPortfolioEditor,
        openProjectRiskForTask,
        parseDependsOnFromForm,
        parsePortfolioLinksInput,
        parsePortfolioTextList,
        parseProjectTaskActualsPayload,
        parseProjectTaskBudgetEstimate,
        parseProjectTaskPriorityPayload,
        patchProjectHealthPlanCard,
        patchProjectHealthPlanPick,
        patchProjectTaskGraphLinkCountLabel,
        patchProjectWorkspaceTab,
        patchRemoveProjectTaskGraphEdge,
        persistProjectTaskGraphView,
        portfolioCollectDocumentFromUi,
        portfolioMakeId,
        projectRiskScaleRank,
        projectTaskDependsOnIds: window.projectTaskDependsOnIds,
        projectTaskGraphLayoutUsesSavedPositions,
        projectTaskGraphMineOnlyActive,
        projectTaskGraphShowCritical,
        projectTaskGraphShowFlow,
        projectTaskGraphShowInferred,
        pulseProjectTaskGraphCheckpointButton,
        queueProjectInviteSearchRefresh,
        readDeskSavedViews,
        readProjectTaskGraphCheckpoint,
        refreshProjectTaskGraphDialog,
        refreshProjectTasksTabBody,
        refreshProjectTasksTabPane,
        removeFromProjectWeekPlan,
        removePortalSocialProjectMember: typeof removePortalSocialProjectMember === 'function' ? removePortalSocialProjectMember : window.removePortalSocialProjectMember,
        removeProjectTaskDependency,
        renderDialogOnlyNow,
        renderSocialPageNow,
        resetPortfolioEditor,
        resolveActiveSocialProject,
        resolveTaskPackageId,
        restorePreviousDialog,
        restoreProjectTaskGraphCheckpoint,
        revealDeskExpandTarget,
        root,
        saveMyPortfolioDocument,
        saveProjectTaskGraphCheckpoint,
        saveProjectTaskGraphView,
        scrubDeletedTaskFromProjectTaskGraphGroups,
        selectProjectTaskGraphNode,
        setActiveChat,
        setPanel,
        setPortalSocialFlash: typeof setPortalSocialFlash === 'function' ? setPortalSocialFlash : window.setPortalSocialFlash,
        setPortalSocialProjectBaseline: typeof setPortalSocialProjectBaseline === 'function' ? setPortalSocialProjectBaseline : window.setPortalSocialProjectBaseline,
        setPortalSocialProjectMembership: typeof setPortalSocialProjectMembership === 'function' ? setPortalSocialProjectMembership : window.setPortalSocialProjectMembership,
        setProjectTaskGraphPositions,
        shouldRenderProjectTaskGraphStack,
        state,
        syncPortfolioEditorInput,
        syncProjectTaskGraphEdgesOnly,
        syncProjectTaskGraphGroupFocus,
        syncProjectTaskMatrixPreview,
        syncSocialOverlayLock,
        syncTaskChecklistInput,
        text,
        toggleProjectTaskGraphGroupMember,
        updatePortalSocialProject: typeof updatePortalSocialProject === 'function' ? updatePortalSocialProject : window.updatePortalSocialProject,
        updatePortalSocialProjectBudgetCategory: typeof updatePortalSocialProjectBudgetCategory === 'function' ? updatePortalSocialProjectBudgetCategory : window.updatePortalSocialProjectBudgetCategory,
        updatePortalSocialProjectBudgetExpense: typeof updatePortalSocialProjectBudgetExpense === 'function' ? updatePortalSocialProjectBudgetExpense : window.updatePortalSocialProjectBudgetExpense,
        updatePortalSocialProjectMemberRole: typeof updatePortalSocialProjectMemberRole === 'function' ? updatePortalSocialProjectMemberRole : window.updatePortalSocialProjectMemberRole,
        updatePortalSocialProjectRisk: typeof updatePortalSocialProjectRisk === 'function' ? updatePortalSocialProjectRisk : window.updatePortalSocialProjectRisk,
        updatePortalSocialProjectTask: typeof updatePortalSocialProjectTask === 'function' ? updatePortalSocialProjectTask : window.updatePortalSocialProjectTask,
        updateProjectTaskGraphGroup,
        withBusy,
        writeDeskSavedViews,
        })
        : null);
    const handleSocialWorkspaceClick = __wsEventsApi?.handleSocialWorkspaceClick || (() => false);
    const handleSocialWorkspaceSubmit = __wsEventsApi?.handleSocialWorkspaceSubmit || (() => false);
    const handleSocialWorkspaceInput = __wsEventsApi?.handleSocialWorkspaceInput || (() => false);
    const handleSocialWorkspaceChange = __wsEventsApi?.handleSocialWorkspaceChange || (() => false);
    __kiuSwApi.handleSocialWorkspaceClick = handleSocialWorkspaceClick;
    __kiuSwApi.isSocialWorkspaceClickAction = isSocialWorkspaceClickAction;
    __kiuSwApi.handleSocialWorkspaceSubmit = handleSocialWorkspaceSubmit;
    __kiuSwApi.isSocialWorkspaceSubmitForm = isSocialWorkspaceSubmitForm;
    __kiuSwApi.handleSocialWorkspaceInput = handleSocialWorkspaceInput;
    __kiuSwApi.isSocialWorkspaceInputTarget = isSocialWorkspaceInputTarget;
    __kiuSwApi.handleSocialWorkspaceChange = handleSocialWorkspaceChange;
    __kiuSwApi.isSocialWorkspaceChangeTarget = isSocialWorkspaceChangeTarget;

    window.handleSocialWorkspaceClick = handleSocialWorkspaceClick;
    window.handleSocialWorkspaceSubmit = handleSocialWorkspaceSubmit;
    window.handleSocialWorkspaceInput = handleSocialWorkspaceInput;
    window.handleSocialWorkspaceChange = handleSocialWorkspaceChange;
    window.isSocialWorkspaceClickAction = isSocialWorkspaceClickAction;
    window.isSocialWorkspaceSubmitForm = isSocialWorkspaceSubmitForm;
    window.isSocialWorkspaceInputTarget = isSocialWorkspaceInputTarget;
    window.isSocialWorkspaceChangeTarget = isSocialWorkspaceChangeTarget;

    window.__kiuCreateSocialWorkspaceApi = function createKiuSocialWorkspaceApi(deps) {
        void deps;
        return window.KiuSocialWorkspace || __kiuSwApi;
    };

    window.__KIU_SOCIAL_WORKSPACE_MODULE_LOADED = true;
})();
