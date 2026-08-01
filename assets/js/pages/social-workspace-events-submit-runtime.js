/* Submit handler peeled from social-workspace-events.js. Load before events host. */
(function initSocialWorkspaceEventsSubmit() {
    'use strict';
    if (window.__KIU_SOCIAL_WORKSPACE_EVENTS_SUBMIT_LOADED) return;
    window.__KIU_SOCIAL_WORKSPACE_EVENTS_SUBMIT_LOADED = true;

    window.__kiuCreateSocialWorkspaceEventsSubmitApi = function createKiuSocialWorkspaceEventsSubmitApi(deps) {
        if (!deps || typeof deps !== 'object') throw new Error('workspace events submit deps required');
        const {
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
            createPortalSocialProject,
            createPortalSocialProjectBudgetCategory,
            createPortalSocialProjectBudgetExpense,
            createPortalSocialProjectRisk,
            createPortalSocialProjectTask,
            createProjectTaskGraphGroup,
            currentFacultyCode,
            deletePortalSocialProject,
            deletePortalSocialProjectBudgetCategory,
            deletePortalSocialProjectBudgetExpense,
            deletePortalSocialProjectRisk,
            deletePortalSocialProjectTask,
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
            hydrateMyPortfolioDocument,
            invalidateSocialRenderCache,
            isProjectTaskGraphGroupId,
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
            openPortalDirectChat,
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
            projectTaskDependsOnIds,
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
            removePortalSocialProjectMember,
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
            setPortalSocialFlash,
            setPortalSocialProjectBaseline,
            setPortalSocialProjectMembership,
            setProjectTaskGraphPositions,
            state,
            syncPortfolioEditorInput,
            syncProjectTaskGraphEdgesOnly,
            syncProjectTaskGraphGroupFocus,
            syncProjectTaskMatrixPreview,
            syncSocialOverlayLock,
            syncTaskChecklistInput,
            text,
            toggleProjectTaskGraphGroupMember,
            updatePortalSocialProject,
            updatePortalSocialProjectBudgetCategory,
            updatePortalSocialProjectBudgetExpense,
            updatePortalSocialProjectMemberRole,
            updatePortalSocialProjectRisk,
            updatePortalSocialProjectTask,
            updateProjectTaskGraphGroup,
            withBusy,
            writeDeskSavedViews
        } = deps;

        function handleSocialWorkspaceSubmit(formType, form, runtime, event) {
            if (!isSocialWorkspaceSubmitForm(formType)) return false;
            if (formType === 'create-portfolio') {
                const projectTitleValue = text(form.projectName?.value || runtime.ui?.projectName);
                if (!projectTitleValue) {
                    if (typeof setPortalSocialFlash === 'function') setPortalSocialFlash('Add a portfolio title before publishing.', 'danger');
                    form.projectName?.focus?.();
                    return;
                }
                return withBusy(async () => {
                    const facultyCodes = Array.isArray(runtime.ui?.projectFacultyCodes) && runtime.ui.projectFacultyCodes.length
                        ? runtime.ui.projectFacultyCodes
                        : [];
                    if (!facultyCodes.length) {
                        if (typeof setPortalSocialFlash === 'function') setPortalSocialFlash('Select at least one faculty before publishing.', 'danger');
                        return;
                    }
                    await createPortalSocialProject({
                        title: text(form.projectName?.value || runtime.ui?.projectName),
                        name: text(form.projectName?.value || runtime.ui?.projectName),
                        summary: text(form.projectSummary?.value || runtime.ui?.projectSummary),
                        description: text(form.projectDescription?.value || runtime.ui?.projectDescription),
                        status: text(form.projectStatus?.value || runtime.ui?.projectStatus || 'draft') || 'draft',
                        visibility: text(form.projectVisibility?.value || runtime.ui?.projectVisibility || 'all_logged_in') === 'all_logged_in' ? 'public' : 'private',
                        visibilityMode: text(form.projectVisibility?.value || runtime.ui?.projectVisibility || 'all_logged_in') || 'all_logged_in',
                        courseTag: text(form.projectCourseTag?.value || runtime.ui?.projectCourseTag),
                        facultyCodes,
                        facultyTags: facultyCodes,
                        skillTags: text(form.projectSkillTags?.value || runtime.ui?.projectSkillTags || '').split(',').map((item) => text(item)).filter(Boolean),
                        hashtags: text(form.projectHashtags?.value || runtime.ui?.projectHashtags || '').split(',').map((item) => text(item).replace(/^#/, '')).filter(Boolean),
                        externalLinks: parsePortfolioLinksInput(form.projectExternalLinks?.value || runtime.ui?.projectExternalLinks || ''),
                        visibleRoles: parsePortfolioTextList(form.projectVisibleRolesRaw?.value || (runtime.ui?.projectVisibleRoles || []).join(', ')).map((item) => item.toLowerCase()),
                        visibleFacultyCodes: parsePortfolioTextList(form.projectVisibleFacultyCodesRaw?.value || (runtime.ui?.projectVisibleFacultyCodes || []).join(', ')),
                        visibleUserIds: parsePortfolioTextList(form.projectVisibleUserIds?.value || runtime.ui?.projectVisibleUserIds || ''),
                        hiddenUserIds: parsePortfolioTextList(form.projectHiddenUserIds?.value || runtime.ui?.projectHiddenUserIds || ''),
                        mediaItems: Array.isArray(runtime.ui?.projectMediaItems) ? runtime.ui.projectMediaItems : [],
                        file: runtime.ui?.projectMediaFile || null
                    });
                    resetPortfolioEditor();
                    closeDialog();
                    renderSocialPageNow('portfolio-created');
                });
            }

            if (formType === 'portfolio-settings') {
                return withBusy(async () => {
                    const projectId = text(form.getAttribute('data-project-id'));
                    await updatePortalSocialProject(projectId, {
                        title: text(form.projectName?.value || runtime.ui?.projectName),
                        name: text(form.projectName?.value || runtime.ui?.projectName),
                        summary: text(form.projectSummary?.value || ''),
                        description: text(form.projectDescription?.value || ''),
                        status: text(form.projectStatus?.value || 'draft') || 'draft',
                        visibility: text(form.projectVisibility?.value || runtime.ui?.projectVisibility || 'all_logged_in') === 'all_logged_in' ? 'public' : 'private',
                        visibilityMode: text(form.projectVisibility?.value || runtime.ui?.projectVisibility || 'all_logged_in') || 'all_logged_in',
                        courseTag: text(form.projectCourseTag?.value || runtime.ui?.projectCourseTag || ''),
                        facultyCodes: Array.isArray(runtime.ui?.projectFacultyCodes) && runtime.ui.projectFacultyCodes.length ? runtime.ui.projectFacultyCodes : [currentFacultyCode()],
                        facultyTags: Array.isArray(runtime.ui?.projectFacultyCodes) && runtime.ui.projectFacultyCodes.length ? runtime.ui.projectFacultyCodes : [currentFacultyCode()],
                        skillTags: text(form.projectSkillTags?.value || runtime.ui?.projectSkillTags || '').split(',').map((item) => text(item)).filter(Boolean),
                        hashtags: text(form.projectHashtags?.value || runtime.ui?.projectHashtags || '').split(',').map((item) => text(item).replace(/^#/, '')).filter(Boolean),
                        externalLinks: parsePortfolioLinksInput(form.projectExternalLinks?.value || runtime.ui?.projectExternalLinks || ''),
                        visibleRoles: parsePortfolioTextList(form.projectVisibleRolesRaw?.value || (runtime.ui?.projectVisibleRoles || []).join(', ')).map((item) => item.toLowerCase()),
                        visibleFacultyCodes: parsePortfolioTextList(form.projectVisibleFacultyCodesRaw?.value || (runtime.ui?.projectVisibleFacultyCodes || []).join(', ')),
                        visibleUserIds: parsePortfolioTextList(form.projectVisibleUserIds?.value || runtime.ui?.projectVisibleUserIds || ''),
                        hiddenUserIds: parsePortfolioTextList(form.projectHiddenUserIds?.value || runtime.ui?.projectHiddenUserIds || ''),
                        mediaItems: Array.isArray(runtime.ui?.projectMediaItems) ? runtime.ui.projectMediaItems : [],
                        file: runtime.ui?.projectMediaFile || null
                    });
                    resetPortfolioEditor();
                    closeDialog();
                    renderSocialPageNow('portfolio-updated');
                });
            }

            if (formType === 'create-project') {
                const projectTitleValue = text(form.projectName?.value || runtime.ui?.projectName);
                if (!projectTitleValue) {
                    if (typeof setPortalSocialFlash === 'function') setPortalSocialFlash('Add a project title before creating the workspace.', 'danger');
                    form.projectName?.focus?.();
                    return;
                }
                return withBusy(async () => {
                    const facultyCodes = Array.isArray(runtime.ui?.projectFacultyCodes) && runtime.ui.projectFacultyCodes.length
                        ? runtime.ui.projectFacultyCodes
                        : [];
                    if (!facultyCodes.length) {
                        if (typeof setPortalSocialFlash === 'function') setPortalSocialFlash('Select at least one faculty before creating the workspace.', 'danger');
                        return;
                    }
                    const skillTags = text(form.projectSkillTags?.value || runtime.ui?.projectSkillTags || '')
                        .split(',')
                        .map((item) => text(item))
                        .filter(Boolean);
                    const hashtags = text(form.projectHashtags?.value || runtime.ui?.projectHashtags || '')
                        .split(',')
                        .map((item) => text(item).replace(/^#/, ''))
                        .filter(Boolean);
                    const project = await createPortalSocialProject({
                        title: text(form.projectName?.value || runtime.ui?.projectName),
                        name: text(form.projectName?.value || runtime.ui?.projectName),
                        summary: text(form.projectSummary?.value || runtime.ui?.projectSummary),
                        description: text(form.projectDescription?.value || runtime.ui?.projectDescription),
                        status: text(form.projectStatus?.value || runtime.ui?.projectStatus || 'draft') || 'draft',
                        visibility: text(form.projectVisibility?.value || runtime.ui?.projectVisibility || 'all_logged_in') === 'all_logged_in' ? 'public' : 'private',
                        visibilityMode: text(form.projectVisibility?.value || runtime.ui?.projectVisibility || 'all_logged_in') || 'all_logged_in',
                        courseTag: text(form.projectCourseTag?.value || runtime.ui?.projectCourseTag),
                        facultyCodes,
                        facultyTags: facultyCodes,
                        skillTags,
                        hashtags,
                        externalLinks: parsePortfolioLinksInput(form.projectExternalLinks?.value || runtime.ui?.projectExternalLinks || ''),
                        visibleRoles: parsePortfolioTextList(form.projectVisibleRolesRaw?.value || (runtime.ui?.projectVisibleRoles || []).join(', ')).map((item) => item.toLowerCase()),
                        visibleFacultyCodes: parsePortfolioTextList(form.projectVisibleFacultyCodesRaw?.value || (runtime.ui?.projectVisibleFacultyCodes || []).join(', ')),
                        visibleUserIds: parsePortfolioTextList(form.projectVisibleUserIds?.value || runtime.ui?.projectVisibleUserIds || ''),
                        hiddenUserIds: parsePortfolioTextList(form.projectHiddenUserIds?.value || runtime.ui?.projectHiddenUserIds || ''),
                        mediaItems: Array.isArray(runtime.ui?.projectMediaItems) ? runtime.ui.projectMediaItems : [],
                        file: runtime.ui?.projectMediaFile || null,
                        advisorUserId: text(form.projectAdvisorUserId?.value || runtime.ui?.projectAdvisorUserId),
                        inviteeIds: Array.isArray(runtime.ui?.projectInviteSelectedIds) ? runtime.ui.projectInviteSelectedIds : [],
                        recommendedTeamSize: Number(form.projectRecommendedTeamSize?.value || runtime.ui?.projectRecommendedTeamSize || 4),
                        minTeamSize: Number(form.projectMinTeamSize?.value || runtime.ui?.projectMinTeamSize || 4)
                    });
                    resetPortfolioEditor();
                    runtime.ui.projectName = '';
                    runtime.ui.projectSummary = '';
                    runtime.ui.projectDescription = '';
                    runtime.ui.projectCourseTag = '';
                    runtime.ui.projectSkillTags = '';
                    runtime.ui.projectAdvisorUserId = '';
                    runtime.ui.projectFacultyCodes = [];
                    runtime.ui.projectInviteSearch = '';
                    runtime.ui.projectInviteFaculty = 'all';
                    runtime.ui.projectInviteSelectedIds = [];
                    runtime.ui.projectRecommendedTeamSize = 4;
                    runtime.ui.projectMinTeamSize = 4;
                    closeDialog();
                    runtime.ui.activeProjectId = text(project?.id || '');
                    runtime.ui.projectTab = 'overview';
                    renderSocialPageNow('project-created');
                });
            }

            if (formType === 'project-settings') {
                return withBusy(async () => {
                    const projectId = text(form.getAttribute('data-project-id'));
                    await updatePortalSocialProject(projectId, {
                        title: text(form.projectName?.value || runtime.ui?.projectName),
                        name: text(form.projectName?.value || runtime.ui?.projectName),
                        summary: text(form.projectSummary?.value || ''),
                        description: text(form.projectDescription?.value || ''),
                        status: text(form.projectStatus?.value || 'draft') || 'draft',
                        visibility: text(form.projectVisibility?.value || runtime.ui?.projectVisibility || 'all_logged_in') === 'all_logged_in' ? 'public' : 'private',
                        visibilityMode: text(form.projectVisibility?.value || runtime.ui?.projectVisibility || 'all_logged_in') || 'all_logged_in',
                        courseTag: text(form.projectCourseTag?.value || runtime.ui?.projectCourseTag || ''),
                        facultyCodes: Array.isArray(runtime.ui?.projectFacultyCodes) && runtime.ui.projectFacultyCodes.length ? runtime.ui.projectFacultyCodes : [currentFacultyCode()],
                        facultyTags: Array.isArray(runtime.ui?.projectFacultyCodes) && runtime.ui.projectFacultyCodes.length ? runtime.ui.projectFacultyCodes : [currentFacultyCode()],
                        skillTags: text(form.projectSkillTags?.value || runtime.ui?.projectSkillTags || '').split(',').map((item) => text(item)).filter(Boolean),
                        hashtags: text(form.projectHashtags?.value || runtime.ui?.projectHashtags || '').split(',').map((item) => text(item).replace(/^#/, '')).filter(Boolean),
                        externalLinks: parsePortfolioLinksInput(form.projectExternalLinks?.value || runtime.ui?.projectExternalLinks || ''),
                        visibleRoles: parsePortfolioTextList(form.projectVisibleRolesRaw?.value || (runtime.ui?.projectVisibleRoles || []).join(', ')).map((item) => item.toLowerCase()),
                        visibleFacultyCodes: parsePortfolioTextList(form.projectVisibleFacultyCodesRaw?.value || (runtime.ui?.projectVisibleFacultyCodes || []).join(', ')),
                        visibleUserIds: parsePortfolioTextList(form.projectVisibleUserIds?.value || runtime.ui?.projectVisibleUserIds || ''),
                        hiddenUserIds: parsePortfolioTextList(form.projectHiddenUserIds?.value || runtime.ui?.projectHiddenUserIds || ''),
                        advisorUserId: text(form.projectAdvisorUserId?.value || ''),
                        recommendedTeamSize: Number(form.projectRecommendedTeamSize?.value || 4) || 4,
                        minTeamSize: Number(form.projectMinTeamSize?.value || 4) || 4,
                        showcaseSummary: text(form.projectShowcaseSummary?.value || ''),
                        scheduleStartAt: fromDateTimeLocalValue(form.projectScheduleStartAt?.value || ''),
                        mediaItems: Array.isArray(runtime.ui?.projectMediaItems) ? runtime.ui.projectMediaItems : [],
                        file: runtime.ui?.projectMediaFile || null
                    });
                    resetPortfolioEditor();
                    closeDialog();
                    renderSocialPageNow('project-settings-saved');
                });
            }

            if (formType === 'project-task-graph-quick-create') {
                return withBusy(async () => {
                    const projectId = text(form.projectId?.value);
                    const project = resolveActiveSocialProject(runtime, projectId);
                    const prevQuick = runtime.ui?.projectTaskGraphQuickCreate || {};
                    let title = '';
                    try {
                        title = assertUniqueProjectTaskTitle(project, form.projectTaskTitle?.value);
                    } catch (error) {
                        runtime.ui.projectTaskGraphQuickCreate = {
                            open: true,
                            x: prevQuick.x,
                            y: prevQuick.y,
                            graphX: prevQuick.graphX,
                            graphY: prevQuick.graphY,
                            title: text(form.projectTaskTitle?.value),
                            status: text(form.projectTaskStatus?.value || prevQuick.status || 'todo') || 'todo',
                            error: error?.message || 'Could not add task.'
                        };
                        refreshProjectTaskGraphDialog(['quickCreate']);
                        throw error;
                    }
                    const status = text(form.projectTaskStatus?.value || 'todo') || 'todo';
                    const graphX = Number(form.graphX?.value) || 120;
                    const graphY = Number(form.graphY?.value) || 120;
                    const dependsOnId = text(form.dependsOnTaskId?.value || '');
                    const dependsOnTaskIds = dependsOnId ? [dependsOnId] : [];
                    const created = await createPortalSocialProjectTask(projectId, {
                        title,
                        status,
                        priority: 'medium',
                        dependsOnTaskIds
                    }, { silent: true });
                    const taskId = text(created?.id || '');
                    if (taskId) {
                        const positions = { ...getProjectTaskGraphPositions(runtime, projectId) };
                        positions[taskId] = { x: graphX, y: graphY };
                        setProjectTaskGraphPositions(runtime, projectId, positions);
                        runtime.ui.projectTaskGraphSelectedId = taskId;
                    }
                    runtime.ui.projectTaskGraphQuickCreate = { open: false };
                    runtime.ui.projectTaskGraphLinkFrom = '';
                    if (typeof setPortalSocialFlash === 'function') setPortalSocialFlash('Task added to graph.', 'success', { skipRender: true });
                    notifyProjectTaskGraphSurfaceChanged(projectId);
                    refreshProjectTaskGraphDialog(['quickCreate', 'canvas', 'selection', 'sidebar', 'chrome']);
                });
            }

            if (formType === 'project-task-create') {
                const submitMode = text(event.submitter?.getAttribute?.('data-submit-mode') || '');
                return withBusy(async () => {
                    const priorityPayload = parseProjectTaskPriorityPayload(form, runtime);
                    const actualsPayload = parseProjectTaskActualsPayload(form, runtime);
                    const createProjectId = text(form.getAttribute('data-project-id'));
                    const createDepends = parseDependsOnFromForm(form);
                    const createProject = resolveActiveSocialProject(runtime, createProjectId);
                    const createTitle = assertUniqueProjectTaskTitle(
                        createProject,
                        form.projectTaskTitle?.value || runtime.ui?.projectTaskTitle
                    );
                    const createdTask = await createPortalSocialProjectTask(createProjectId, {
                        title: createTitle,
                        description: text(form.projectTaskDescription?.value || runtime.ui?.projectTaskDescription),
                        assigneeUserId: text(form.projectTaskAssigneeId?.value || runtime.ui?.projectTaskAssigneeId),
                        startAt: fromDateTimeLocalValue(form.projectTaskStartAt?.value || runtime.ui?.projectTaskStartAt || ''),
                        dueAt: fromDateTimeLocalValue(form.projectTaskDueAt?.value || runtime.ui?.projectTaskDueAt || ''),
                        ...priorityPayload,
                        ...actualsPayload,
                        isMilestone: false,
                        timeEstimate: priorityPayload.timeEstimate,
                        timeOptimistic: priorityPayload.timeOptimistic,
                        timeMostLikely: priorityPayload.timeMostLikely,
                        timePessimistic: priorityPayload.timePessimistic,
                        budgetEstimate: parseProjectTaskBudgetEstimate(form.projectTaskBudgetEstimate?.value || runtime.ui?.projectTaskBudgetEstimate),
                        status: text(form.projectTaskStatus?.value || 'todo') || 'todo',
                        dependsOnTaskIds: createDepends
                    }, { silent: true });
                    const createdTaskId = text(createdTask?.id || '');
                    // Prefer package from form select; fall back to package Add prefill.
                    const createGroupId = text(form.projectTaskPackageId?.value || runtime.ui?.projectTaskCreateGroupId || '');
                    if (createdTaskId) {
                        if (createGroupId) {
                            toggleProjectTaskGraphGroupMember(runtime, createProjectId, createGroupId, createdTaskId, true);
                        }
                        ensureProjectTaskGraphPositionForTask(runtime, createProjectId, createdTaskId, {
                            preferNearIds: [...createDepends, createGroupId].filter(Boolean),
                            skipNotify: true
                        });
                    }
                    runtime.ui.projectTaskCreateGroupId = '';
                    const createdAssignee = text(form.projectTaskAssigneeId?.value || '');
                    if (!createdAssignee && typeof setPortalSocialFlash === 'function') {
                        setPortalSocialFlash('Task created. Add an owner when you can.', 'info', { skipRender: true });
                    } else if (typeof setPortalSocialFlash === 'function') {
                        setPortalSocialFlash('Task created.', 'success', { skipRender: true });
                    }
                    if (submitMode === 'create-another') {
                        runtime.ui.projectTaskTitle = '';
                        runtime.ui.projectTaskDescription = '';
                        runtime.ui.projectTaskChecklist = [];
                        runtime.ui.projectTaskDependsOnIds = parseDependsOnFromForm(form);
                        runtime.ui.projectTaskCreateGroupId = text(form.projectTaskPackageId?.value || '');
                        runtime.ui.projectTaskAssigneeId = text(form.projectTaskAssigneeId?.value || '');
                        runtime.ui.projectTaskStartAt = text(form.projectTaskStartAt?.value || '');
                        runtime.ui.projectTaskDueAt = text(form.projectTaskDueAt?.value || '');
                        runtime.ui.projectTaskImpactScore = text(form.projectTaskImpactScore?.value || '3') || '3';
                        runtime.ui.projectTaskEffortScore = text(form.projectTaskEffortScore?.value || '3') || '3';
                        runtime.ui.projectTaskBudgetEstimate = text(form.projectTaskBudgetEstimate?.value || '');
                        runtime.ui.projectTaskTimeOptimistic = text(form.projectTaskTimeOptimistic?.value || '');
                        runtime.ui.projectTaskTimeMostLikely = text(form.projectTaskTimeMostLikely?.value || '');
                        runtime.ui.projectTaskTimePessimistic = text(form.projectTaskTimePessimistic?.value || '');
                        runtime.ui.projectTaskTimeUnit = normalizeTaskTimeUnit(form.projectTaskTimeUnit?.value);
                        runtime.ui.projectTaskActualTime = text(form.projectTaskActualTime?.value || '');
                        runtime.ui.projectTaskActualCost = text(form.projectTaskActualCost?.value || '');
                        runtime.ui.projectTaskStatus = text(form.projectTaskStatus?.value || 'todo') || 'todo';
                        markProjectTaskGraphPreviewStale(createProjectId);
                        if (!refreshProjectTasksTabBody('project-task-created-another')) {
                            const host = root();
                            if (host) host.__kiuForceCenterOnly = true;
                            renderSocialPageNow('project-task-created-another');
                        }
                        window.requestAnimationFrame(() => {
                            syncSocialOverlayLock();
                            focusSocialDialog();
                        });
                        return;
                    }
                    runtime.ui.projectTaskTitle = '';
                    runtime.ui.projectTaskDescription = '';
                    runtime.ui.projectTaskAssigneeId = '';
                    runtime.ui.projectTaskStartAt = '';
                    runtime.ui.projectTaskDueAt = '';
                    runtime.ui.projectTaskImpactScore = '3';
                    runtime.ui.projectTaskEffortScore = '3';
                    runtime.ui.projectTaskBudgetEstimate = '';
                    runtime.ui.projectTaskTimeOptimistic = '';
                    runtime.ui.projectTaskTimeMostLikely = '';
                    runtime.ui.projectTaskTimePessimistic = '';
                    runtime.ui.projectTaskTimeUnit = 'h';
                    runtime.ui.projectTaskActualTime = '';
                    runtime.ui.projectTaskActualCost = '';
                    runtime.ui.projectTaskStatus = '';
                    runtime.ui.projectTaskChecklist = [];
                    runtime.ui.projectTaskDependsOnIds = [];
                    const stackedGraph = runtime.ui.previousDialog?.type === 'project-task-graph';
                    markProjectTaskGraphPreviewStale(createProjectId);
                    closeDialog();
                    if (stackedGraph) {
                        refreshProjectTaskGraphDialog(['canvas', 'selection', 'sidebar', 'chrome']);
                        window.requestAnimationFrame(() => refreshProjectTaskGraphDialog(['canvas']));
                    } else if (!refreshProjectTasksTabBody('project-task-created')) {
                        const host = root();
                        if (host) host.__kiuForceCenterOnly = true;
                        renderSocialPageNow('project-task-created');
                    }
                });
            }

            if (formType === 'project-task-edit') {
                return withBusy(async () => {
                    const priorityPayload = parseProjectTaskPriorityPayload(form, runtime);
                    const actualsPayload = parseProjectTaskActualsPayload(form, runtime);
                    const editProjectId = text(form.getAttribute('data-project-id'));
                    const editTaskId = text(form.getAttribute('data-task-id'));
                    const editProject = resolveActiveSocialProject(runtime, editProjectId);
                    const editTitle = assertUniqueProjectTaskTitle(editProject, form.projectTaskTitle?.value || '', {
                        excludeTaskId: editTaskId
                    });
                    await updatePortalSocialProjectTask(
                        editProjectId,
                        editTaskId,
                        {
                            title: editTitle,
                            description: text(form.projectTaskDescription?.value || ''),
                            assigneeUserId: text(form.projectTaskAssigneeId?.value || ''),
                            startAt: fromDateTimeLocalValue(form.projectTaskStartAt?.value || ''),
                            dueAt: fromDateTimeLocalValue(form.projectTaskDueAt?.value || ''),
                            ...priorityPayload,
                            ...actualsPayload,
                            isMilestone: false,
                            timeEstimate: priorityPayload.timeEstimate,
                            timeOptimistic: priorityPayload.timeOptimistic,
                            timeMostLikely: priorityPayload.timeMostLikely,
                            timePessimistic: priorityPayload.timePessimistic,
                            budgetEstimate: parseProjectTaskBudgetEstimate(form.projectTaskBudgetEstimate?.value),
                            status: text(form.projectTaskStatus?.value || 'todo') || 'todo',
                            dependsOnTaskIds: parseDependsOnFromForm(form)
                        },
                        { silent: true }
                    );
                    const editDeps = parseDependsOnFromForm(form);
                    /* editTaskId already set */
                    if (editTaskId && editDeps.length) {
                        ensureProjectTaskGraphPositionForTask(runtime, editProjectId, editTaskId, {
                            preferNearIds: editDeps,
                            skipNotify: true
                        });
                    }
                    const stackedGraph = runtime.ui.previousDialog?.type === 'project-task-graph';
                    runtime.ui.projectTaskChecklist = [];
                    runtime.ui.projectTaskDependsOnIds = [];
                    markProjectTaskGraphPreviewStale(editProjectId);
                    closeDialog();
                    if (stackedGraph) {
                        refreshProjectTaskGraphDialog(['canvas', 'selection', 'sidebar', 'chrome']);
                        window.requestAnimationFrame(() => refreshProjectTaskGraphDialog(['canvas']));
                    } else if (!refreshProjectTasksTabBody('project-task-updated')) {
                        const host = root();
                        if (host) host.__kiuForceCenterOnly = true;
                        renderSocialPageNow('project-task-updated');
                    }
                });
            }

            if (formType === 'project-budget-settings') {
                return withBusy(async () => {
                    await updatePortalSocialProject(text(form.getAttribute('data-project-id')), {
                        budgetCurrency: text(form.projectBudgetCurrency?.value || 'USD') || 'USD',
                        budgetCap: Number(form.projectBudgetCap?.value || 0) || 0
                    });
                    renderSocialPageNow('project-budget-settings-saved');
                });
            }

            if (formType === 'project-budget-category-add') {
                return withBusy(async () => {
                    await createPortalSocialProjectBudgetCategory(text(form.getAttribute('data-project-id')), {
                        title: text(form.projectBudgetCategoryTitle?.value || ''),
                        plannedAmount: Number(form.projectBudgetCategoryPlanned?.value || 0) || 0
                    });
                    renderSocialPageNow('project-budget-category-added');
                });
            }

            if (formType === 'project-budget-expense-add') {
                return withBusy(async () => {
                    await createPortalSocialProjectBudgetExpense(text(form.getAttribute('data-project-id')), {
                        title: text(form.projectBudgetExpenseTitle?.value || ''),
                        amount: Number(form.projectBudgetExpenseAmount?.value || 0) || 0,
                        categoryId: text(form.projectBudgetExpenseCategoryId?.value || ''),
                        status: 'draft'
                    });
                    renderSocialPageNow('project-budget-expense-added');
                });
            }

            if (formType === 'project-risk-save') {
                return withBusy(async () => {
                    const projectId = text(form.getAttribute('data-project-id'));
                    const riskId = text(form.getAttribute('data-risk-id') || '');
                    const taskId = text(form.getAttribute('data-task-id') || state().ui?.projectRiskTaskId || '');
                    const description = text(form.projectRiskDescription?.value || '');
                    const defaultTitle = text(form.getAttribute('data-default-title') || '') || 'Risk';
                    const existingTitle = text(form.getAttribute('data-existing-title') || '');
                    const firstLine = description.split('\n').map((line) => text(line)).find(Boolean) || '';
                    const autoTitle = (firstLine || defaultTitle).slice(0, 120);
                    const payload = {
                        groupId: text(form.getAttribute('data-group-id') || ''),
                        title: riskId ? (existingTitle || autoTitle) : autoTitle,
                        description,
                        likelihood: projectRiskScaleRank(form.projectRiskLikelihood?.value || 3),
                        impact: projectRiskScaleRank(form.projectRiskImpact?.value || 3),
                        status: text(form.projectRiskStatus?.value || 'open') || 'open',
                        response: text(form.projectRiskResponse?.value || 'mitigate') || 'mitigate',
                        ownerUserId: text(form.projectRiskOwnerUserId?.value || ''),
                        mitigation: text(form.projectRiskMitigation?.value || '')
                    };
                    if (taskId) payload.linkedTaskIds = [taskId];
                    if (riskId && typeof updatePortalSocialProjectRisk === 'function') {
                        await updatePortalSocialProjectRisk(projectId, riskId, payload);
                    } else if (typeof createPortalSocialProjectRisk === 'function') {
                        await createPortalSocialProjectRisk(projectId, payload);
                    } else {
                        throw new Error('Project risk could not be saved.');
                    }
                    state().ui.projectRiskEditId = '';
                    state().ui.projectRiskComposeOpen = false;
                    renderSocialPageNow('project-risk-saved');
                });
            }

            if (formType === 'dialog-project-leave') {
                return withBusy(async () => {
                    const confirmLeave = form.elements?.namedItem ? form.elements.namedItem('confirmProjectLeave') : null;
                    if (!confirmLeave || !confirmLeave.checked) throw new Error('Confirm that you want to leave the workspace.');
                    const projectId = text(form.projectId?.value);
                    const projectChatId = text(form.projectChatId?.value);
                    await setPortalSocialProjectMembership(projectId, 'leave');
                    if (text(state().ui?.activeChatId || '') === projectChatId) {
                        state().ui.activeChatId = '';
                        setPanel('workspace');
                    }
                    if (text(state().ui?.activeProjectId || '') === projectId) {
                        state().ui.activeProjectId = '';
                        state().ui.projectTab = 'overview';
                    }
                    closeDialog();
                    renderSocialPageNow('project-left');
                });
            }

            if (formType === 'dialog-project-task-delete') {
                return withBusy(async () => {
                    if (!form.confirmProjectTaskDelete?.checked) throw new Error('Confirm removal before deleting this task.');
                    const projectId = text(form.projectId?.value);
                    const taskId = text(form.taskId?.value);
                    if (!projectId || !taskId) return;
                    const stackedGraph = runtime.ui.previousDialog?.type === 'project-task-graph';
                    await deletePortalSocialProjectTask(projectId, taskId);
                    scrubDeletedTaskFromProjectTaskGraphGroups(runtime, projectId, taskId);
                    runtime.ui.projectTaskChecklist = [];
                    runtime.ui.projectTaskDependsOnIds = [];
                    markProjectTaskGraphPreviewStale(projectId);
                    // Also drop tasks pane cache so body refresh is fresh after hydrate side-effects
                    clearProjectTabPaneCacheKey(projectId, 'tasks');
                    closeDialog();
                    if (stackedGraph) {
                        if (text(runtime.ui.projectTaskGraphSelectedId) === taskId) {
                            runtime.ui.projectTaskGraphSelectedId = '';
                        }
                        refreshProjectTaskGraphDialog(['canvas', 'selection', 'sidebar', 'chrome']);
                    } else if (!refreshProjectTasksTabBody('project-task-deleted')) {
                        const host = root();
                        if (host) host.__kiuForceCenterOnly = true;
                        renderSocialPageNow('project-task-deleted');
                    }
                });
            }
            return false;
        }


        return { handleSocialWorkspaceSubmit };
    };
})();
