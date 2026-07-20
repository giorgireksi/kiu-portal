/* Input/change handlers peeled from social-workspace-events.js.
 * Load before social-workspace-events.js.
 */
(function initSocialWorkspaceEventsInput() {
    'use strict';
    if (window.__KIU_SOCIAL_WORKSPACE_EVENTS_INPUT_LOADED) return;
    window.__KIU_SOCIAL_WORKSPACE_EVENTS_INPUT_LOADED = true;

    window.__kiuCreateSocialWorkspaceEventsInputApi = function createKiuSocialWorkspaceEventsInputApi(deps) {
        if (!deps || typeof deps !== 'object') throw new Error('workspace events input deps required');
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

        function handleSocialWorkspaceInput(target, runtime, event) {
            if (!isSocialWorkspaceInputTarget(target)) return false;
            if (target.matches('input[name="projectHealthPlanPickSearch"]')) {
                runtime.ui.projectHealthPlanPickSearch = text(target.value || '');
                if (text(activeDialog()?.type || '') === 'project-health-plan-pick') {
                    if (patchProjectHealthPlanPick(runtime)) return;
                    return renderDialogOnlyNow();
                }
                return;
            }

            const portfolioFormSelector = 'form[data-form="create-project"] [name="projectName"], form[data-form="project-settings"] [name="projectName"], form[data-form="create-portfolio"] [name="projectName"], form[data-form="portfolio-settings"] [name="projectName"]';
            if (target.matches(portfolioFormSelector)) runtime.ui.projectName = target.value;
            if (target.matches('form[data-form="create-project"] [name="projectSummary"], form[data-form="project-settings"] [name="projectSummary"], form[data-form="create-portfolio"] [name="projectSummary"], form[data-form="portfolio-settings"] [name="projectSummary"]')) runtime.ui.projectSummary = target.value;
            if (target.matches('form[data-form="create-project"] [name="projectDescription"], form[data-form="project-settings"] [name="projectDescription"], form[data-form="create-portfolio"] [name="projectDescription"], form[data-form="portfolio-settings"] [name="projectDescription"]')) runtime.ui.projectDescription = target.value;
            if (target.matches('form[data-form="create-project"] [name="projectStatus"], form[data-form="project-settings"] [name="projectStatus"], form[data-form="create-portfolio"] [name="projectStatus"], form[data-form="portfolio-settings"] [name="projectStatus"]')) runtime.ui.projectStatus = target.value;
            if (target.matches('form[data-form="create-project"] [name="projectVisibility"], form[data-form="project-settings"] [name="projectVisibility"], form[data-form="create-portfolio"] [name="projectVisibility"], form[data-form="portfolio-settings"] [name="projectVisibility"]')) {
                runtime.ui.projectVisibility = target.value;
                if (text(activeDialog()?.type || '') === 'portfolio-create') {
                    renderSocialPageNow('portfolio-create-input');
                    return;
                }
            }
            if (target.matches('form[data-form="create-project"] [name="projectCourseTag"], form[data-form="project-settings"] [name="projectCourseTag"], form[data-form="create-portfolio"] [name="projectCourseTag"], form[data-form="portfolio-settings"] [name="projectCourseTag"]')) runtime.ui.projectCourseTag = target.value;
            if (target.matches('form[data-form="create-project"] [name="projectSkillTags"], form[data-form="project-settings"] [name="projectSkillTags"], form[data-form="create-portfolio"] [name="projectSkillTags"], form[data-form="portfolio-settings"] [name="projectSkillTags"]')) runtime.ui.projectSkillTags = target.value;
            if (target.matches('form[data-form="create-project"] [name="projectHashtags"], form[data-form="project-settings"] [name="projectHashtags"], form[data-form="create-portfolio"] [name="projectHashtags"], form[data-form="portfolio-settings"] [name="projectHashtags"]')) runtime.ui.projectHashtags = target.value;
            if (target.matches('form[data-form="create-project"] [name="projectExternalLinks"], form[data-form="project-settings"] [name="projectExternalLinks"], form[data-form="create-portfolio"] [name="projectExternalLinks"], form[data-form="portfolio-settings"] [name="projectExternalLinks"]')) runtime.ui.projectExternalLinks = target.value;
            if (target.matches('form[data-form="create-project"] [name="projectVisibleRolesRaw"], form[data-form="project-settings"] [name="projectVisibleRolesRaw"], form[data-form="create-portfolio"] [name="projectVisibleRolesRaw"], form[data-form="portfolio-settings"] [name="projectVisibleRolesRaw"]')) runtime.ui.projectVisibleRoles = parsePortfolioTextList(target.value).map((item) => item.toLowerCase());
            if (target.matches('form[data-form="create-project"] [name="projectVisibleFacultyCodesRaw"], form[data-form="project-settings"] [name="projectVisibleFacultyCodesRaw"], form[data-form="create-portfolio"] [name="projectVisibleFacultyCodesRaw"], form[data-form="portfolio-settings"] [name="projectVisibleFacultyCodesRaw"]')) runtime.ui.projectVisibleFacultyCodes = parsePortfolioTextList(target.value);
            if (target.matches('form[data-form="create-project"] [name="projectVisibleUserIds"], form[data-form="project-settings"] [name="projectVisibleUserIds"], form[data-form="create-portfolio"] [name="projectVisibleUserIds"], form[data-form="portfolio-settings"] [name="projectVisibleUserIds"]')) runtime.ui.projectVisibleUserIds = target.value;
            if (target.matches('form[data-form="create-project"] [name="projectHiddenUserIds"], form[data-form="project-settings"] [name="projectHiddenUserIds"], form[data-form="create-portfolio"] [name="projectHiddenUserIds"], form[data-form="portfolio-settings"] [name="projectHiddenUserIds"]')) runtime.ui.projectHiddenUserIds = target.value;
            if (target.matches('form[data-form="create-project"] [name="projectAdvisorUserId"]')) runtime.ui.projectAdvisorUserId = target.value;
            if (target.matches('form[data-form="create-project"] [name="projectInviteSearch"]') || target.matches('[name="projectInviteSearch"]')) {
                runtime.ui.projectInviteSearch = target.value;
                if (text(activeDialog()?.type || '') === 'project-create') {
                    queueProjectInviteSearchRefresh();
                    return;
                }
                queueProjectInviteSearchRefresh();
            }
            if (target.matches('[name="portfolioBasicsName"], [name="portfolioBasicsHeadline"], [name="portfolioBasicsSummary"], [name="portfolioBasicsEmail"], [name="portfolioBasicsLink"]')) {
                if (syncPortfolioEditorInput()) return;
                portfolioCollectDocumentFromUi();
                runtime.ui.portfolioSaveStatus = 'Unsaved changes';
                renderSocialPageNow('portfolio-basics-input');
            }
            if (target.matches('[name="portfolioEducationSchool"], [name="portfolioEducationDegree"], [name="portfolioEducationNote"], [name="portfolioExperienceRole"], [name="portfolioExperienceOrganization"], [name="portfolioExperienceDescription"], [name="portfolioProjectTitle"], [name="portfolioProjectDescription"], [name="portfolioProjectLink"], [name="portfolioSkillsTags"], [name="portfolioCustomText"], [name="portfolioCustomLink"]')) {
                if (syncPortfolioEditorInput()) return;
                portfolioCollectDocumentFromUi();
                runtime.ui.portfolioSaveStatus = 'Unsaved changes';
                renderSocialPageNow('portfolio-section-input');
            }
            if (target.matches('[name="portfolioEducationDatesStart"], [name="portfolioEducationDatesEnd"], [name="portfolioEducationDatesCurrent"], [name="portfolioExperienceDatesStart"], [name="portfolioExperienceDatesEnd"], [name="portfolioExperienceDatesCurrent"]')) {
                if (syncPortfolioEditorInput()) return;
                portfolioCollectDocumentFromUi();
                runtime.ui.portfolioSaveStatus = 'Unsaved changes';
                renderSocialPageNow('portfolio-date-input');
            }
            if (target.matches('[name="portfolioCustomSectionName"]')) {
                runtime.ui.customBuilderName = target.value;
                if (text(activeDialog()?.type || '') === 'portfolio-editor') return;
                renderSocialPageNow('portfolio-custom-name-input');
            }
            if (target.matches('[name="portfolioCustomFieldLabel"]')) {
                const fieldIndex = Number(target.getAttribute('data-field-index'));
                runtime.ui.customBuilderFields = Array.isArray(runtime.ui.customBuilderFields) ? runtime.ui.customBuilderFields : [];
                if (runtime.ui.customBuilderFields[fieldIndex]) {
                    runtime.ui.customBuilderFields[fieldIndex].label = target.value;
                }
                if (text(activeDialog()?.type || '') === 'portfolio-editor') return;
                renderSocialPageNow('portfolio-custom-field-input');
            }
            if (target.matches('[name="portfolioPublishConsent"]')) {
                runtime.ui.publishConsent = Boolean(target.checked);
                if (text(activeDialog()?.type || '') === 'portfolio-editor') return;
                renderSocialPageNow('portfolio-publish-consent');
            }
            if (target.matches('[name="projectDiscoverSearch"]')) {
                runtime.ui.projectDiscoverSearch = target.value;
                if (text(runtime.ui?.activePanel || '') === 'workspace' && !text(runtime.ui?.activeProjectId || '')) {
                    renderSocialPageNow('project-discover-search');
                    return;
                }
                renderSocialPageNow('portfolio-discover-search');
            }
            if (target.matches('form[data-form="create-project"] [name="projectRecommendedTeamSize"]')) runtime.ui.projectRecommendedTeamSize = target.value;
            if (target.matches('form[data-form="create-project"] [name="projectMinTeamSize"]')) runtime.ui.projectMinTeamSize = target.value;
            if (target.matches('form[data-form="project-task-create"] [name="projectTaskTitle"]')) runtime.ui.projectTaskTitle = target.value;
            if (target.matches('form[data-form="project-task-create"] [name="projectTaskDescription"]')) runtime.ui.projectTaskDescription = target.value;
            if (target.matches('form[data-form="project-task-create"] [name="projectTaskAssigneeId"]')) runtime.ui.projectTaskAssigneeId = target.value;
            if (target.matches('form[data-form="project-task-create"] [name="projectTaskStartAt"]')) runtime.ui.projectTaskStartAt = target.value;
            if (target.matches('form[data-form="project-task-create"] [name="projectTaskDueAt"]')) runtime.ui.projectTaskDueAt = target.value;
            // Impact×Effort and PERT previews update in place (no full re-render).
            if (target.matches('form[data-form="project-task-create"] [name="projectTaskImpactScore"], form[data-form="project-task-create"] [name="projectTaskEffortScore"], form[data-form="project-task-create"] [name="projectTaskBudgetEstimate"], form[data-form="project-task-create"] [name="projectTaskTimeOptimistic"], form[data-form="project-task-create"] [name="projectTaskTimeMostLikely"], form[data-form="project-task-create"] [name="projectTaskTimePessimistic"], form[data-form="project-task-create"] [name="projectTaskTimeUnit"]')) {
                runtime.ui.projectTaskImpactScore = text(target.form?.projectTaskImpactScore?.value || runtime.ui.projectTaskImpactScore || '3') || '3';
                runtime.ui.projectTaskEffortScore = text(target.form?.projectTaskEffortScore?.value || runtime.ui.projectTaskEffortScore || '3') || '3';
                runtime.ui.projectTaskBudgetEstimate = text(target.form?.projectTaskBudgetEstimate?.value ?? runtime.ui.projectTaskBudgetEstimate ?? '');
                runtime.ui.projectTaskTimeOptimistic = text(target.form?.projectTaskTimeOptimistic?.value ?? runtime.ui.projectTaskTimeOptimistic ?? '');
                runtime.ui.projectTaskTimeMostLikely = text(target.form?.projectTaskTimeMostLikely?.value ?? runtime.ui.projectTaskTimeMostLikely ?? '');
                runtime.ui.projectTaskTimePessimistic = text(target.form?.projectTaskTimePessimistic?.value ?? runtime.ui.projectTaskTimePessimistic ?? '');
                runtime.ui.projectTaskTimeUnit = normalizeTaskTimeUnit(target.form?.projectTaskTimeUnit?.value ?? runtime.ui.projectTaskTimeUnit);
                syncProjectTaskMatrixPreview(target.form);
                return;
            }
            if (target.matches('form[data-form="project-task-edit"] [name="projectTaskImpactScore"], form[data-form="project-task-edit"] [name="projectTaskEffortScore"], form[data-form="project-task-edit"] [name="projectTaskBudgetEstimate"], form[data-form="project-task-edit"] [name="projectTaskTimeOptimistic"], form[data-form="project-task-edit"] [name="projectTaskTimeMostLikely"], form[data-form="project-task-edit"] [name="projectTaskTimePessimistic"], form[data-form="project-task-edit"] [name="projectTaskTimeUnit"]')) {
                syncProjectTaskMatrixPreview(target.form);
                return;
            }
            if (target.matches('form[data-form="project-task-create"] [name="projectTaskStatus"]')) runtime.ui.projectTaskStatus = target.value;
            if (target.matches('form[data-form="project-task-create"] [name="projectTaskChecklistLabel"], form[data-form="project-task-edit"] [name="projectTaskChecklistLabel"]')) {
                syncTaskChecklistInput(target, false);
            }
            if (target.matches('form[data-form="project-task-create"] [name="projectTaskChecklistDone"], form[data-form="project-task-edit"] [name="projectTaskChecklistDone"]')) {
                syncTaskChecklistInput(target, true);
            }
            if (target.matches('[name="projectTaskSearch"]')) {
                runtime.ui.projectTaskSearch = target.value;
                runtime.ui.projectTaskDeskActiveViewId = '';
                refreshProjectTasksTabPane('project-task-search');
            }
            if (target.matches('[name="projectTaskFilterPriority"]')) {
                runtime.ui.projectTaskFilterPriority = target.value;
                runtime.ui.projectTaskDeskActiveViewId = '';
                refreshProjectTasksTabPane('project-task-filter');
            }
            if (target.matches('[name="projectTaskFilterAssignee"]')) {
                runtime.ui.projectTaskFilterAssignee = target.value;
                runtime.ui.projectTaskDeskActiveViewId = '';
                refreshProjectTasksTabPane('project-task-filter');
            }
            if (target.matches('[name="projectTaskDeskView"]')) {
                const viewId = text(target.value || '');
                if (!viewId) {
                    runtime.ui.projectTaskDeskActiveViewId = '';
                    runtime.ui.projectTaskDeskActiveViewName = '';
                    return refreshProjectTasksTabPane('project-task-desk-view-clear');
                }
                const view = readDeskSavedViews().find((entry) => text(entry.id) === viewId);
                if (!view) return;
                runtime.ui.projectTaskFocus = ['all', 'ready', 'mine', 'overdue', 'blocked', 'week', 'critical', 'unassigned'].includes(text(view.focus || 'ready'))
                    ? text(view.focus)
                    : 'all';
                runtime.ui.projectTaskTimeWindow = ['all', 'week', '2weeks'].includes(text(view.timeWindow || 'all'))
                    ? text(view.timeWindow)
                    : 'all';
                runtime.ui.projectTaskSearch = text(view.search || '');
                runtime.ui.projectTaskFilterPriority = text(view.priority || 'all') || 'all';
                runtime.ui.projectTaskFilterAssignee = text(view.assignee || 'all') || 'all';
                runtime.ui.projectTaskDeskActiveViewId = viewId;
                runtime.ui.projectTaskDeskActiveViewName = text(view.name || '');
                return refreshProjectTasksTabPane('project-task-desk-view-load');
            }

            return true;
        }

        function handleSocialWorkspaceChange(target, runtime, event) {
            if (!isSocialWorkspaceChangeTarget(target)) return false;
            if (target.matches('form[data-form="create-project"] [name="projectInviteFaculty"]') || target.matches('[name="projectInviteFaculty"]')) {
                runtime.ui.projectInviteFaculty = text(target.value || 'all') || 'all';
                renderSocialPageNow('project-invite-faculty');
                return;
            }
            if (target.matches('select[name="projectTaskGraphFocusGroup"]')) {
                state().ui.projectTaskGraphFocusGroupId = text(target.value || '');
                if (text(activeDialog()?.type || '') === 'project-task-graph') {
                    syncProjectTaskGraphGroupFocus(state());
                }
                return;
            }
            if (target.matches('input[type="checkbox"][data-filter="openOnly"], input[type="checkbox"][data-filter="hidePlanned"]')) {
                if (target.matches('input[type="checkbox"][data-filter="openOnly"]')) {
                    runtime.ui.projectHealthPlanPickStatus = target.checked ? 'open' : 'all';
                }
                if (target.matches('input[type="checkbox"][data-filter="hidePlanned"]')) {
                    runtime.ui.projectHealthPlanPickHidePlanned = Boolean(target.checked);
                }
                if (text(activeDialog()?.type || '') === 'project-health-plan-pick') {
                    if (patchProjectHealthPlanPick(runtime)) return;
                    return renderDialogOnlyNow();
                }
                return;
            }
            if (target.matches('select[name="projectDiscoverFaculty"]')) {
                runtime.ui.projectDiscoverFaculty = text(target.value || 'all') || 'all';
                renderSocialPageNow('portfolio-discover-faculty');
                return;
            }
            if (target.matches('select[name="projectDiscoverRole"]')) {
                runtime.ui.projectDiscoverRole = text(target.value || 'all') || 'all';
                renderSocialPageNow('portfolio-discover-role');
                return;
            }
            if (target.name === 'projectMediaFile') {
                runtime.ui.projectMediaFile = target.files?.[0] || null;
                renderSocialPageNow('portfolio-media-file');
                return;
            }

            return true;
        }

        const api = { handleSocialWorkspaceInput, handleSocialWorkspaceChange };
        return api;
    };
})();
