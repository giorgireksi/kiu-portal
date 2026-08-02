/* Social workspace lazy-export stub registry (name lists + install).
 * Eager: social.html before social-page.js.
 * Page provides createStub(name, fallback) closed over has/ensure module.
 */
(function initSocialWorkspaceStubs() {
    'use strict';
    if (window.__KIU_SOCIAL_WORKSPACE_STUBS_LOADED) return;
    window.__KIU_SOCIAL_WORKSPACE_STUBS_LOADED = true;

    function installKiuSocialWorkspaceStubs({ createStub, text }) {
        if (typeof createStub !== 'function') throw new Error('createStub required');
        if (typeof text !== 'function') text = (v) => String(v == null ? '' : v).trim();

// Workspace lazy stubs (identity-stable until social-workspace.js loads)
const bag = Object.create(null);
function install(names, fallback) {
    names.forEach((name) => {
        bag[name] = createStub(name, fallback);
    });
}
install([
        'shouldRenderProjectTaskGraphStack', 'renderWorkspaceOwnedDialog', 'isProjectTaskGraphStackActive', 'getProjectTaskGraphStackAnchorDialog', 'wrapProjectTaskGraphStack', 'wrapProjectHealthStack',
        'renderHealthStackLayers', 'maybeWrapStackedProjectDialog', 'renderStackedProjectTaskChild', 'trySyncProjectTaskGraphStackDialog', 'syncProjectTaskGraphStackSlotState', 'projectTaskGraphStackedBackdropClass', 'resolveProjectTaskGraphNodeFromTarget',
        'projectTaskDependsOnIds', 'clampProjectTaskGraphCardHeight', 'estimateProjectTaskGraphCardHeight', 'measureProjectTaskGraphCardHeights', 'normalizeProjectTaskGraphMode', 'projectTaskGraphShowInferred',
        'projectTaskGraphShowCritical', 'projectTaskGraphShowFlow', 'projectTaskGraphVisibleEdges', 'buildProjectTaskGraphModel', 'layoutProjectTaskGraphByStatus', 'compareProjectTaskGraphNodes',
        'hashProjectTaskGraphSeed', 'projectTaskGraphPseudoRandom', 'getProjectTaskGraphMetrics', 'computeProjectTaskGraphStageSize', 'computeProjectTaskGraphNodeDegree', 'projectTaskGraphBoxRepulse',
        'resolveProjectTaskGraphCardOverlaps', 'layoutProjectTaskGraphForce', 'projectTaskGraphLayoutUsesSavedPositions', 'applyProjectTaskGraphSavedPositions', 'projectTaskGraphRectsOverlap', 'findFreeProjectTaskGraphPosition',
        'ensureProjectTaskGraphPositionForTask', 'projectTaskGraphContentBounds', 'resolveProjectTaskGraphGroupBox', 'collectProjectTaskGraphGroupBoxes', 'projectTaskGraphContentViewBox', 'projectTaskGraphPositionsStorageKey',
        'getProjectTaskGraphPositions', 'ensureProjectTaskGraphPositionsLoaded', 'projectTaskGraphViewStorageKey', 'clampProjectTaskGraphZoom', 'projectTaskGraphSyncStorageKey', 'projectTaskGraphGroupsStorageKey',
        'getProjectTaskGraphGroups', 'projectTaskGraphCheckpointStorageKey', 'projectTaskGraphCheckpointsStorageKey', 'formatProjectTaskGraphCheckpointWhen', 'normalizeProjectTaskGraphCheckpointEntry', 'readProjectTaskGraphCheckpoints',
        'readProjectTaskGraphCheckpoint', 'getProjectTaskGraphCheckpointById', 'collectProjectTaskGraphCheckpoint', 'restoreProjectTaskGraphCheckpoint', 'renderProjectTaskGraphHistoryDialog', 'renderProjectTaskGraphScheduleHelpDialog',
        'projectTaskGraphGroupMembershipWouldCycle', 'isProjectTaskGraphGroupId', 'projectGroupDependsOnIds', 'projectGroupBlocksIds', 'collectProjectTaskGraphGroupDescendantTaskIds', 'collectProjectTaskGraphGroupAbsorbedTaskIds',
        'isProjectTaskGraphGroupComplete', 'isProjectGraphDependencyOpen', 'computeProjectTaskGraphGroupRollup', 'getProjectTaskGraphGroupLinkSummary', 'formatProjectScheduleHours', 'formatProjectScheduleFloat',
        'formatTaskScheduleDisplay', 'formatProjectScheduleDate', 'renderProjectPlanVsBaselineStrip', 'renderProjectProgressHoursStrip', 'computeProjectTaskGraphContentFitView', 'buildProjectTaskGraphLayoutForView',
        'projectTaskGraphBoxAnchor', 'getProjectTaskGraphDocks', 'projectTaskGraphDockAlongSide', 'scoreProjectTaskGraphDockPair', 'selectProjectTaskGraphDockPair', 'buildProjectTaskGraphSeedPolyline',
        'sampleProjectTaskGraphPolyline', 'projectTaskGraphPushOutOfRect', 'relaxProjectTaskGraphPolyline', 'normalizeProjectTaskGraphStatusId', 'projectTaskGraphStatusEdgeColor', 'projectTaskGraphCubicEdgePath',
        'projectTaskGraphEdgePath', 'projectTaskGraphEdgeAnchors', 'projectTaskGraphObstacleList', 'projectTaskGraphEdgeFanMap', 'formatProjectTaskGraphNodeLabel', 'computeProjectTaskGraphFitZoom',
        'computeProjectTaskGraphPreviewZoom', 'renderProjectTaskGraphGroupNode', 'renderProjectTaskGraphCardNode', 'projectTaskGraphPortRole', 'resolveProjectTaskGraphWireEndpoints', 'readProjectTaskGraphPortCenter',
        'resolveProjectTaskGraphLinkPreviewHost', 'ensureProjectTaskGraphLinkPreview', 'clearProjectTaskGraphLinkPreview', 'scheduleProjectTaskGraphEdgeRefresh', 'findProjectTaskGraphLinkDropTarget', 'findProjectTaskGraphMembershipDropGroup',
        'renderProjectTaskGraphEdgeGroupsHtml', 'renderProjectTaskGraphGroupEdgesHtml', 'renderProjectTaskGraphGroupDependencyEdgesHtml', 'readProjectTaskGraphLivePositions', 'escapeProjectTaskGraphAttr', 'patchRemoveProjectTaskGraphEdge',
        'patchProjectTaskGraphLinkCountLabel', 'renderProjectTaskGraphSvg', 'renderProjectTaskGraphCanvas', 'refreshProjectTaskGraphEdgeLines', 'projectTaskGraphWouldCycle', 'readProjectTaskGraphPan',
        'isProjectTaskGraphScrollPanCanvas', 'resolveProjectTaskGraphPanSlack', 'clampProjectTaskGraphPan', 'readProjectTaskGraphScrollSurface', 'readProjectTaskGraphLayoutSize', 'projectTaskGraphScrollOffsets',
        'readProjectTaskGraphPanSlackFromCanvas', 'readProjectTaskGraphPanFromScroll', 'ensureProjectTaskGraphScrollSurface', 'centerProjectTaskGraphScrollPan', 'resolveProjectTaskGraphPanBackdrop', 'clientToProjectTaskGraphCoords',
        'getProjectTaskGraphHost', 'projectTaskGraphMineOnlyActive', 'filterProjectTaskGraphVisibleTasks', 'resolveProjectTaskGraphScheduleScope', 'computeProjectTaskGraphMapSchedule', 'resolveProjectTaskGraphContext',
        'buildProjectTaskGraphLayout', 'collectProjectTaskGraphNeighborIds', 'buildProjectTaskGraphCanvasMarkup', 'renderProjectTaskGraphHealth', 'renderProjectTaskGraphRailOverview', 'renderProjectTaskGraphScheduleOverview',
        'refreshProjectTaskGraphDialog', 'selectProjectTaskGraphNode', 'addProjectTaskDependency', 'removeProjectTaskDependency', 'addProjectGraphDependency', 'patchLocalProjectTaskDepends',
        'removeProjectGraphDependency', 'renderProjectTaskGraphQuickCreatePopover', 'renderProjectTaskGraphDetailRailPlaceholder', 'renderProjectTaskGraphDetailRailContent', 'renderProjectTaskGraphGroupInspector', 'renderProjectTaskGraphInspector',
        'renderProjectTaskGraphTools', 'isProjectTaskGraphPanButton', 'openProjectTaskGraphContextMenu', 'renderTaskDependencyGraphPreview', 'renderProjectTaskGraphLegend', 'renderProjectTaskGraphStatusMini',
        'renderProjectTaskGraphFullscreen', 'isProjectTaskGraphDialogOpen', 'renderProjectCreateInviteSection', 'renderProjectTaskCard', 'renderProjectTaskDetailModal', 'renderProjectColumnTasksModal',
        'renderProjectTaskCreateDialog', 'renderProjectHealthDialog', 'renderProjectHealthPlanCardHtml', 'renderProjectHealthPlanPickBodyHtml', 'renderProjectHealthPlanPickDialog', 'renderProjectRiskDialog',
        'renderProjectSettingsDialog', 'renderProjectCreateDialog', 'renderPortfolioCreateDialog', 'portfolioStatus', 'portfolioVisibilityMode', 'portfolioAudienceLabel',
        'portfolioMakeId', 'portfolioFieldValue', 'renderMyPortfolioPanel', 'renderPortfolioEditorDialog', 'renderPortfolioViewerDialog', 'renderPortfolioCustomBuilderOverlay', 'renderPortfolioProfileBlock'
], '');
install([
        'writeProjectWeekPlan', 'addToProjectWeekPlan', 'addManyToProjectWeekPlan', 'removeFromProjectWeekPlan', 'normalizeProjectWeekPlanWindow', 'syncProjectTaskMatrixPreview',
        'loadProjectTaskGraphPositions', 'saveProjectTaskGraphPositions', 'setProjectTaskGraphPositions', 'loadProjectTaskGraphView', 'saveProjectTaskGraphView', 'persistProjectTaskGraphView',
        'seedProjectTaskGraphFromProject', 'queueProjectTaskGraphSync', 'setProjectTaskGraphGroups', 'pulseProjectTaskGraphCheckpointButton', 'writeProjectTaskGraphCheckpoints', 'deleteProjectTaskGraphCheckpoint',
        'flushProjectTaskGraphSync', 'saveProjectTaskGraphCheckpoint', 'applyProjectTaskGraphCheckpointSnapshot', 'createProjectTaskGraphGroup', 'updateProjectTaskGraphGroup', 'deleteProjectTaskGraphGroup',
        'scrubDeletedTaskFromProjectTaskGraphGroups', 'toggleProjectTaskGraphGroupMember', 'projectScheduleCalendarDate', 'applyProjectTaskGraphResetView', 'updateProjectTaskGraphLinkPreview', 'setProjectTaskGraphInteracting',
        'syncProjectTaskGraphEdgesOnly', 'applyProjectTaskGraphScrollZoom', 'applyProjectTaskGraphCanvasTransform', 'initProjectTaskGraphScrollPan', 'applyProjectTaskGraphZoom', 'syncProjectTaskGraphChrome',
        'syncProjectTaskGraphGroupFocus', 'syncProjectTaskGraphSelection', 'syncProjectTaskGraphCanvas', 'syncProjectTaskGraphQuickCreate', 'syncProjectTaskGraphSidebar', 'detachProjectTaskGraphPanWindowListeners',
        'attachProjectTaskGraphPanWindowListeners', 'closeProjectTaskGraphContextMenu', 'bindProjectTaskGraphInteractions', 'bindProjectTaskGraphDrag', 'bindProjectTaskGraphResizeObserver', 'syncProjectTabPills',
        'clearProjectTabPaneCache', 'clearProjectTabPaneCacheKey', 'markProjectTaskGraphPreviewStale', 'syncDeskToolbarFromFreshMarkup', 'notifyProjectTaskGraphSurfaceChanged', 'revealDeskExpandTarget',
        'clearPortfolioApiDeniedFlag', 'portfolioReadDateRange', 'openPortfolioEditor', 'openPortfolioViewerForUser', 'resetPortfolioEditor'
], undefined);
install([
        'shouldRenderProjectHealthStack', 'taskHasPert', 'refreshProjectTasksTabBody', 'refreshProjectTasksTabPane', 'rebuildActiveProjectTabPaneIfPreviewHost', 'patchProjectWorkspaceTab',
        'canViewerAccessPortfolioEntry', 'portfolioMatchesRoleFilter', 'portfolioDraftExists'
], false);
install([
        'deskTasksSurfaceReady', 'getOrCreateProjectTabPane', 'normalizePortfolioEntry', 'clonePortfolioDocument', 'getMyPortfolioDocument', 'ensureMyPortfolioDocument',
        'hydrateMyPortfolioDocument', 'portfolioCollectDocumentFromUi', 'saveMyPortfolioDocument'
], null);
install([
        'orderDeskTasksByDependency', 'buildDeskTaskForest', 'buildProjectTaskInspectorFields', 'parsePortfolioTextList', 'parsePortfolioLinksInput', 'serializePortfolioLinks',
        'portfolioEntriesForViewer'
], []);
install([
        'computePertExpected', 'taskDurationHours', 'taskScheduleRemainingHours', 'sumProjectOpenWorkHours', 'sumProjectActualHours'
], 0);
install([
        'readProjectWeekPlansStore', 'readProjectWeekPlan'
], {});
install([
        'buildProjectHealthPlanPickModel'
], { groups: [], tasks: [], horizon: 'week' });
bag['sortProjectBoardTasksByPriority'] = createStub('sortProjectBoardTasksByPriority', function (tasks) { return Array.isArray(tasks) ? [...tasks] : []; });
bag['filterProjectBoardTasks'] = createStub('filterProjectBoardTasks', function (runtime, tasks) { return Array.isArray(tasks) ? tasks : []; });
bag['resolveDeskTaskReadiness'] = createStub('resolveDeskTaskReadiness', function () { return { kind: 'ready', label: 'Ready', openDeps: [], openCount: 0 }; });
bag['resolveTaskScheduleEstimate'] = createStub('resolveTaskScheduleEstimate', function () { return { estimate: 0, unit: 'h', source: 'estimate' }; });
bag['resolveProjectTaskPriorityDisplay'] = createStub('resolveProjectTaskPriorityDisplay', function () { return { label: 'Medium', tone: 'neutral', score: 3 }; });
bag['computeProjectSchedule'] = createStub('computeProjectSchedule', function () { return { tasks: {}, project: {} }; });
bag['projectTabPaneCacheKey'] = createStub('projectTabPaneCacheKey', function (projectId, tabId) { return `${text(projectId)}:${text(tabId || 'overview') || 'overview'}`; });
bag['buildProjectCreateContext'] = createStub('buildProjectCreateContext', function () { return { facultyOptions: [], projectFaculties: [], advisorCandidates: [] }; });
return bag;

    }

    window.installKiuSocialWorkspaceStubs = installKiuSocialWorkspaceStubs;
})();
