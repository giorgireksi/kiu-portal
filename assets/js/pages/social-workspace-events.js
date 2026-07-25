/* Social workspace domain event handlers (click/submit/input/change).
 * Lazy: loaded by ensureSocialWorkspaceModule before social-workspace.js.
 * Workspace installs via createKiuSocialWorkspaceEventsApi(deps).
 */
(function initSocialWorkspaceEvents() {
    'use strict';
    if (window.__KIU_SOCIAL_WORKSPACE_EVENTS_LOADED) return;
    window.__KIU_SOCIAL_WORKSPACE_EVENTS_LOADED = true;

    function createKiuSocialWorkspaceEventsApi(deps) {
        if (!deps || typeof deps !== 'object') throw new Error('workspace events deps required');
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

        function handleSocialWorkspaceClick(action, trigger) {
            if (!isSocialWorkspaceClickAction(action)) return false;
            const PANEL_KEY = 'KIU_SOCIAL_ACTIVE_PANEL';
            if (action === 'project-open') {
                // Open in whichever section the user is in: the team workspace stays in
                // "Projects" (workspace); the showcase stays in "Portfolio" (projects).
                const currentPanel = text(state().ui?.activePanel || '');
                const targetPanel = currentPanel === 'workspace' ? 'workspace' : 'projects';
                state().ui.activeProjectId = text(trigger.getAttribute('data-project-id'));
                state().ui.projectTab = 'overview';
                clearProjectTabPaneCache(text(trigger.getAttribute('data-project-id')));
                state().ui.activePanel = targetPanel;
                state().ui.shellDrawerOpen = false;
                try { localStorage.setItem(PANEL_KEY, targetPanel); } catch (error) {}
                // Force a render: setPanel() skips re-rendering when the panel is
                // unchanged, but activeProjectId changed so we must repaint.
                return renderSocialPageNow('project-open');
            }
            if (action === 'project-hub-scope') {
                let scope = text(trigger.getAttribute('data-scope') || 'mine') || 'mine';
                // Legacy marketplace scope — map to LMS attention filter
                if (scope === 'recruiting') scope = 'attention';
                state().ui.projectHubScope = scope;
                return renderSocialPageNow('project-hub-scope');
            }
            if (action === 'project-hub-view') {
                state().ui.projectHubViewMode = text(trigger.getAttribute('data-view') || 'grid') || 'grid';
                return renderSocialPageNow('project-hub-view');
            }
            if (action === 'project-hub-status') {
                state().ui.projectHubStatus = text(trigger.getAttribute('data-status') || 'all') || 'all';
                return renderSocialPageNow('project-hub-status');
            }
            if (action === 'project-hub-skill') {
                state().ui.projectDiscoverTag = text(trigger.getAttribute('data-tag') || '').toLowerCase();
                return renderSocialPageNow('project-hub-skill');
            }
            if (action === 'project-hub-open-task') {
                const projectId = text(trigger.getAttribute('data-project-id'));
                const taskId = text(trigger.getAttribute('data-task-id'));
                state().ui.activeProjectId = projectId;
                state().ui.projectTab = 'tasks';
                state().ui.projectTaskViewMode = 'desk';
                state().ui.projectTaskFocus = 'mine';
                state().ui.activePanel = 'workspace';
                clearProjectTabPaneCache(projectId);
                try { localStorage.setItem(PANEL_KEY, 'workspace'); } catch (error) {}
                renderSocialPageNow('project-hub-open-task');
                if (projectId && taskId) return openDialog('project-task-detail', { projectId, taskId });
                return;
            }
            if (action === 'project-task-view') {
                const nextView = text(trigger.getAttribute('data-view') || 'desk').toLowerCase();
                const mapped = nextView === 'board' ? 'desk' : nextView;
                state().ui.projectTaskViewMode = ['desk', 'list', 'graph'].includes(mapped) ? mapped : 'desk';
                return refreshProjectTasksTabPane('project-task-view');
            }
            if (action === 'project-task-focus') {
                const nextFocus = text(trigger.getAttribute('data-focus') || 'all').toLowerCase();
                const runtime = state();
                runtime.ui.projectTaskFocus = ['all', 'ready', 'mine', 'overdue', 'blocked', 'week', 'critical', 'unassigned'].includes(nextFocus) ? nextFocus : 'all';
                runtime.ui.projectTaskDeskActiveViewId = '';
                runtime.ui.projectTaskViewMode = 'desk';
                // Coach / hygiene chips from Health: close the dialog so the desk filter is visible.
                if (text(runtime.ui?.socialDialog?.type || '') === 'project-health') {
                    closeDialog();
                }
                return refreshProjectTasksTabPane('project-task-focus');
            }
            if (action === 'project-task-time-window') {
                const nextWindow = text(trigger.getAttribute('data-window') || 'all').toLowerCase();
                state().ui.projectTaskTimeWindow = ['all', 'week', '2weeks'].includes(nextWindow) ? nextWindow : 'all';
                state().ui.projectTaskDeskActiveViewId = '';
                return refreshProjectTasksTabPane('project-task-time-window');
            }
            if (action === 'project-task-desk-view-save') {
                const runtime = state();
                const nameRaw = typeof window.prompt === 'function'
                    ? window.prompt('Name this desk view', text(runtime.ui?.projectTaskDeskActiveViewName || 'My view'))
                    : 'My view';
                const name = text(nameRaw || '').trim().slice(0, 40);
                if (!name) return;
                const view = {
                    id: `deskview_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
                    name,
                    projectId: text(runtime.ui?.activeProjectId || ''),
                    focus: text(runtime.ui?.projectTaskFocus || 'all') || 'all',
                    timeWindow: text(runtime.ui?.projectTaskTimeWindow || 'all') || 'all',
                    search: text(runtime.ui?.projectTaskSearch || ''),
                    priority: text(runtime.ui?.projectTaskFilterPriority || 'all') || 'all',
                    assignee: text(runtime.ui?.projectTaskFilterAssignee || 'all') || 'all',
                    createdAt: new Date().toISOString()
                };
                const views = readDeskSavedViews().filter((entry) => text(entry.id) !== view.id);
                views.unshift(view);
                writeDeskSavedViews(views.slice(0, 20));
                runtime.ui.projectTaskDeskActiveViewId = view.id;
                runtime.ui.projectTaskDeskActiveViewName = view.name;
                return refreshProjectTasksTabPane('project-task-desk-view-save');
            }
            if (action === 'project-task-desk-view-delete') {
                const viewId = text(trigger.getAttribute('data-view-id') || state().ui?.projectTaskDeskActiveViewId || '');
                if (!viewId) return;
                writeDeskSavedViews(readDeskSavedViews().filter((entry) => text(entry.id) !== viewId));
                if (text(state().ui?.projectTaskDeskActiveViewId) === viewId) {
                    state().ui.projectTaskDeskActiveViewId = '';
                    state().ui.projectTaskDeskActiveViewName = '';
                }
                return refreshProjectTasksTabPane('project-task-desk-view-delete');
            }
            if (action === 'project-task-desk-tree-toggle') {
                const taskId = text(trigger.getAttribute('data-task-id') || '');
                if (!taskId) return;
                const collapsed = new Set(
                    (Array.isArray(state().ui.projectTaskDeskCollapsedTreeIds) ? state().ui.projectTaskDeskCollapsedTreeIds : [])
                        .map((id) => text(id))
                        .filter(Boolean)
                );
                const willCollapse = !collapsed.has(taskId);
                if (willCollapse) collapsed.add(taskId);
                else collapsed.delete(taskId);
                state().ui.projectTaskDeskCollapsedTreeIds = [...collapsed];
                const host = root();
                const node = host?.querySelector(`.spt-desk-tree-node[data-tree-task-id="${CSS.escape(taskId)}"]`);
                if (node) {
                    node.classList.toggle('is-tree-collapsed', willCollapse);
                    node.classList.toggle('is-tree-open', !willCollapse);
                    const kids = node.querySelector(`:scope > .spt-desk-tree-children`);
                    if (kids) kids.classList.toggle('is-collapsed', willCollapse);
                    const card = node.querySelector(`:scope > .spt-desk-card[data-task-id="${CSS.escape(taskId)}"]`);
                    if (card) card.classList.toggle('is-tree-collapsed', willCollapse);
                    const btn = node.querySelector(`[data-action="project-task-desk-tree-toggle"][data-task-id="${CSS.escape(taskId)}"]`);
                    if (btn) {
                        btn.setAttribute('aria-expanded', willCollapse ? 'false' : 'true');
                        btn.setAttribute('title', willCollapse ? 'Expand children' : 'Collapse children');
                        const ic = btn.querySelector('i');
                        if (ic) ic.className = `fas fa-chevron-${willCollapse ? 'right' : 'down'}`;
                    }
                    if (!willCollapse) revealDeskExpandTarget(node); // whole node = header + children
                    return;
                }
                return refreshProjectTasksTabBody('project-task-desk-tree-toggle');
            }
            if (action === 'project-task-desk-toggle-package') {
                const packageId = text(trigger.getAttribute('data-package-id') || '');
                if (!packageId) return;
                const collapsed = new Set(
                    (Array.isArray(state().ui.projectTaskDeskCollapsedPackages) ? state().ui.projectTaskDeskCollapsedPackages : [])
                        .map((id) => text(id))
                        .filter(Boolean)
                );
                const willCollapse = !collapsed.has(packageId);
                if (willCollapse) collapsed.add(packageId);
                else collapsed.delete(packageId);
                state().ui.projectTaskDeskCollapsedPackages = [...collapsed];
                const section = root()?.querySelector(`.spt-desk-package[data-package-id="${CSS.escape(packageId)}"]`);
                if (section) {
                    section.classList.toggle('is-collapsed', willCollapse);
                    const btn = section.querySelector('[data-action="project-task-desk-toggle-package"]');
                    if (btn) {
                        btn.setAttribute('aria-expanded', willCollapse ? 'false' : 'true');
                        btn.setAttribute('title', willCollapse ? 'Expand' : 'Collapse');
                        const icon = btn.querySelector('i');
                        if (icon) {
                            icon.className = `fas fa-chevron-${willCollapse ? 'right' : 'down'}`;
                        }
                    }
                    if (!willCollapse) {
                        const body = section.querySelector('.spt-desk-package-body');
                        revealDeskExpandTarget(body || section);
                    }
                    return;
                }
                return refreshProjectTasksTabBody('project-task-desk-toggle-package');
            }
            if (action === 'project-task-desk-expand') {
                const taskId = text(trigger.getAttribute('data-task-id') || '');
                const projectId = text(trigger.getAttribute('data-project-id') || state().ui?.activeProjectId || '');
                if (!taskId || !projectId) return;
                const dlg = activeDialog();
                if (text(dlg?.type || '') === 'project-task-detail' && text(dlg?.taskId || '') === taskId) {
                    state().ui.projectTaskDeskExpandedTaskId = '';
                    return closeDialog();
                }
                state().ui.projectTaskDeskExpandedTaskId = taskId;
                return openDialog('project-task-detail', { projectId, taskId });
            }
            if (action === 'project-task-desk-hygiene-dismiss') {
                const hygieneId = text(trigger.getAttribute('data-hygiene-id') || '') || 'desk-alert';
                const hidden = new Set(
                    (Array.isArray(state().ui.projectTaskDeskHygieneHidden) ? state().ui.projectTaskDeskHygieneHidden : [])
                        .map((id) => text(id))
                        .filter(Boolean)
                );
                hidden.add(hygieneId);
                state().ui.projectTaskDeskHygieneHidden = [...hidden];
                const bar = trigger.closest('.spt-desk-hygiene-bar');
                if (bar) {
                    bar.remove();
                    return;
                }
                const card = trigger.closest('.spt-desk-hygiene-card');
                if (card) {
                    card.remove();
                    const grid = root()?.querySelector('.spt-desk-hygiene-grid');
                    if (grid && !grid.children.length) {
                        root()?.querySelector('.spt-desk-hygiene')?.remove();
                    }
                    return;
                }
                return refreshProjectTasksTabBody('project-task-desk-hygiene-dismiss');
            }

            if (action === 'project-task-desk-link-start') {
                const taskId = text(trigger.getAttribute('data-task-id') || '');
                const role = text(trigger.getAttribute('data-role') || 'child') || 'child';
                if (!taskId) return;
                const cur = state().ui.projectTaskDeskLink;
                if (cur && text(cur.taskId) === taskId && text(cur.role || 'child') === role) {
                    state().ui.projectTaskDeskLink = null;
                } else {
                    state().ui.projectTaskDeskLink = { taskId, role: role === 'parent' ? 'parent' : 'child' };
                    state().ui.projectTaskDeskExpandedTaskId = taskId;
                }
                return refreshProjectTasksTabPane('project-task-desk-link-start');
            }
            if (action === 'project-task-desk-link-cancel') {
                state().ui.projectTaskDeskLink = null;
                return refreshProjectTasksTabPane('project-task-desk-link-cancel');
            }
            if (action === 'project-task-desk-link-pick') {
                const projectId = text(trigger.getAttribute('data-project-id') || state().ui?.activeProjectId || '');
                const pickId = text(trigger.getAttribute('data-task-id') || '');
                const link = state().ui.projectTaskDeskLink;
                const sourceId = text(link?.taskId || '');
                const role = text(link?.role || 'child') || 'child';
                if (!projectId || !pickId || !sourceId || pickId === sourceId) return;
                const parentId = role === 'parent' ? sourceId : pickId;
                const childId = role === 'parent' ? pickId : sourceId;
                return withBusy(async () => {
                    await addProjectTaskDependency(projectId, childId, parentId);
                    ensureProjectTaskGraphPositionForTask(state(), projectId, childId, {
                        preferNearIds: [parentId],
                        skipNotify: true
                    });
                    state().ui.projectTaskDeskLink = null;
                    state().ui.projectTaskDeskExpandedTaskId = childId;
                    if (typeof setPortalSocialFlash === 'function') {
                        setPortalSocialFlash('Tasks linked (parent → child).', 'success', { skipRender: true });
                    }
                    markProjectTaskGraphPreviewStale(projectId);
                    refreshProjectTasksTabPane('project-task-desk-link-pick');
                });
            }
            if (action === 'project-task-desk-dep-add-parent') {
                const projectId = text(trigger.getAttribute('data-project-id') || state().ui?.activeProjectId || '');
                const childId = text(trigger.getAttribute('data-task-id') || '');
                const wrap = trigger.closest('[data-desk-dep-add="parent"]');
                const parentId = text(wrap?.querySelector('select')?.value || '');
                if (!projectId || !childId || !parentId) return;
                return withBusy(async () => {
                    await addProjectTaskDependency(projectId, childId, parentId);
                    ensureProjectTaskGraphPositionForTask(state(), projectId, childId, {
                        preferNearIds: [parentId],
                        skipNotify: true
                    });
                    state().ui.projectTaskDeskExpandedTaskId = childId;
                    if (typeof setPortalSocialFlash === 'function') {
                        setPortalSocialFlash('Parent linked.', 'success', { skipRender: true });
                    }
                    markProjectTaskGraphPreviewStale(projectId);
                    refreshProjectTasksTabPane('project-task-desk-dep-add-parent');
                });
            }
            if (action === 'project-task-desk-dep-add-child') {
                const projectId = text(trigger.getAttribute('data-project-id') || state().ui?.activeProjectId || '');
                const parentId = text(trigger.getAttribute('data-task-id') || '');
                const wrap = trigger.closest('[data-desk-dep-add="child"]');
                const childId = text(wrap?.querySelector('select')?.value || '');
                if (!projectId || !childId || !parentId) return;
                return withBusy(async () => {
                    await addProjectTaskDependency(projectId, childId, parentId);
                    ensureProjectTaskGraphPositionForTask(state(), projectId, childId, {
                        preferNearIds: [parentId],
                        skipNotify: true
                    });
                    state().ui.projectTaskDeskExpandedTaskId = parentId;
                    if (typeof setPortalSocialFlash === 'function') {
                        setPortalSocialFlash('Child linked.', 'success', { skipRender: true });
                    }
                    markProjectTaskGraphPreviewStale(projectId);
                    refreshProjectTasksTabPane('project-task-desk-dep-add-child');
                });
            }
            if (action === 'project-task-desk-dep-remove') {
                const projectId = text(trigger.getAttribute('data-project-id') || state().ui?.activeProjectId || '');
                const childId = text(trigger.getAttribute('data-child-id') || '');
                const parentId = text(trigger.getAttribute('data-parent-id') || '');
                if (!projectId || !childId || !parentId) return;
                return withBusy(async () => {
                    await removeProjectTaskDependency(projectId, childId, parentId);
                    if (typeof setPortalSocialFlash === 'function') {
                        setPortalSocialFlash('Dependency removed.', 'success', { skipRender: true });
                    }
                    markProjectTaskGraphPreviewStale(projectId);
                    refreshProjectTasksTabPane('project-task-desk-dep-remove');
                });
            }
            if (action === 'project-task-filter-overdue') {
                state().ui.projectTaskFilterOverdue = !state().ui.projectTaskFilterOverdue;
                return refreshProjectTasksTabPane('project-task-filter-overdue');
            }
            if (action === 'project-create-open') {
                state().ui.activeProjectId = '';
                setPanel('workspace');
                return openDialog('project-create');
            }
            if (action === 'portfolio-filter-tag') {
                state().ui.projectDiscoverTag = text(trigger.getAttribute('data-tag') || '').toLowerCase();
                return renderSocialPageNow('portfolio-filter-tag');
            }
            if (action === 'portfolio-panel-tab') {
                const tab = text(trigger.getAttribute('data-portfolio-tab'));
                const wasOnProjects = text(state().ui?.activePanel || '') === 'projects';
                const previousTab = text(state().ui?.portfolioPanelTab || 'discover');
                if (tab) state().ui.portfolioPanelTab = tab;
                setPanel('projects');
                if (tab === 'mine' && (tab !== previousTab || !wasOnProjects)) {
                    return withBusy(async () => {
                        await hydrateMyPortfolioDocument(true);
                        invalidateSocialRenderCache({ center: true });
                        renderSocialPageNow('portfolio-panel-tab');
                    });
                }
                invalidateSocialRenderCache({ center: true });
                return renderSocialPageNow('portfolio-panel-tab');
            }
            if (action === 'portfolio-create-open') {
                state().ui.portfolioCustomBuilderOpen = false;
                setPanel('projects');
                return withBusy(async () => {
                    await hydrateMyPortfolioDocument(true);
                    openDialog('portfolio-editor');
                });
            }
            if (action === 'portfolio-section-toggle') {
                const sectionKey = text(trigger.getAttribute('data-section-key'));
                state().ui.openPortfolioSections = state().ui.openPortfolioSections || {};
                state().ui.openPortfolioSections[sectionKey] = !state().ui.openPortfolioSections[sectionKey];
                if (patchPortfolioSectionToggle(sectionKey)) return;
                return renderSocialPageNow('portfolio-section-toggle');
            }
            if (action === 'portfolio-entry-add') {
                const sectionKey = text(trigger.getAttribute('data-section-key'));
                const portfolio = portfolioCollectDocumentFromUi();
                const section = portfolio.sections?.[sectionKey];
                if (!section) return;
                section.entries = Array.isArray(section.entries) ? section.entries : [];
                if (sectionKey === 'skills') {
                    section.entries = [{ id: 'skills-default', order: 0, fields: { tags: { type: 'text', value: '' } } }];
                } else {
                    section.entries.push({ id: portfolioMakeId('entry'), order: section.entries.length, fields: {} });
                }
                state().ui.openPortfolioSections = state().ui.openPortfolioSections || {};
                state().ui.openPortfolioSections[sectionKey] = true;
                state().ui.myPortfolio = portfolio;
                if (patchPortfolioSection(sectionKey)) return;
                return renderSocialPageNow('portfolio-entry-add');
            }
            if (action === 'portfolio-entry-remove') {
                const sectionKey = text(trigger.getAttribute('data-section-key'));
                const entryIndex = Number(trigger.getAttribute('data-entry-index'));
                const portfolio = portfolioCollectDocumentFromUi();
                const section = portfolio.sections?.[sectionKey];
                if (!section || !Array.isArray(section.entries)) return;
                section.entries.splice(entryIndex, 1);
                state().ui.myPortfolio = portfolio;
                if (patchPortfolioSection(sectionKey)) return;
                return renderSocialPageNow('portfolio-entry-remove');
            }
            if (action === 'portfolio-save') {
                return withBusy(() => saveMyPortfolioDocument({ flash: true }));
            }
            if (action === 'portfolio-publish-visibility') {
                state().ui.publishVisibility = text(trigger.getAttribute('data-visibility') || 'staff_only') || 'staff_only';
                if (patchPortfolioPublishVisibility(state().ui.publishVisibility)) return;
                return renderSocialPageNow('portfolio-publish-visibility');
            }
            if (action === 'portfolio-publish-save') {
                return withBusy(async () => {
                    await saveMyPortfolioDocument({ flash: false });
                    const visibilityMode = text(state().ui.publishVisibility || 'staff_only') || 'staff_only';
                    const consentAcknowledged = visibilityMode === 'students_only'
                        ? Boolean(state().ui.publishConsent || document.querySelector('[name="portfolioPublishConsent"]')?.checked)
                        : true;
                    try {
                        const published = await window.KiuPortfolioApi.publishMyPortfolio({ visibilityMode, consentAcknowledged });
                        if (published) {
                            state().ui.myPortfolio = clonePortfolioDocument(published);
                            if (typeof setPortalSocialFlash === 'function') {
                                setPortalSocialFlash('Portfolio published.', 'success');
                            }
                            if (typeof hydrateRuntime === 'function') await hydrateRuntime(true);
                        }
                    } catch (error) {
                        if (typeof setPortalSocialFlash === 'function') setPortalSocialFlash(error?.message || 'Portfolio could not be published.', 'danger');
                    }
                    renderSocialPageNow('portfolio-published');
                });
            }
            if (action === 'portfolio-unpublish') {
                return withBusy(async () => {
                    try {
                        const unpublished = await window.KiuPortfolioApi.unpublishMyPortfolio();
                        if (unpublished) {
                            state().ui.myPortfolio = clonePortfolioDocument(unpublished);
                            if (typeof setPortalSocialFlash === 'function') setPortalSocialFlash('Portfolio moved back to draft.', 'success');
                            if (typeof hydrateRuntime === 'function') await hydrateRuntime(true);
                        }
                    } catch (error) {
                        if (typeof setPortalSocialFlash === 'function') setPortalSocialFlash(error?.message || 'Portfolio could not be unpublished.', 'danger');
                    }
                    renderSocialPageNow('portfolio-unpublished');
                });
            }
            if (action === 'portfolio-custom-open') {
                state().ui.portfolioCustomBuilderOpen = true;
                state().ui.customBuilderStep = 1;
                state().ui.customBuilderTemplate = '';
                state().ui.customBuilderName = '';
                state().ui.customBuilderFields = [];
                return renderSocialPageNow('portfolio-custom-open');
            }
            if (action === 'portfolio-custom-close') {
                state().ui.portfolioCustomBuilderOpen = false;
                return renderSocialPageNow('portfolio-custom-close');
            }
            if (action === 'portfolio-custom-template') {
                state().ui.customBuilderTemplate = text(trigger.getAttribute('data-template-id'));
                state().ui.customBuilderFields = typeof window.KiuPortfolioCustomBuilder?.templateFields === 'function'
                    ? window.KiuPortfolioCustomBuilder.templateFields(state().ui.customBuilderTemplate)
                    : [];
                return renderSocialPageNow('portfolio-custom-template');
            }
            if (action === 'portfolio-custom-next') {
                state().ui.customBuilderStep = 2;
                return renderSocialPageNow('portfolio-custom-next');
            }
            if (action === 'portfolio-custom-back') {
                state().ui.customBuilderStep = 1;
                return renderSocialPageNow('portfolio-custom-back');
            }
            if (action === 'portfolio-custom-field-add') {
                const fieldType = text(trigger.getAttribute('data-field-type') || 'text') || 'text';
                state().ui.customBuilderFields = Array.isArray(state().ui.customBuilderFields) ? state().ui.customBuilderFields : [];
                state().ui.customBuilderFields.push({
                    key: portfolioMakeId('field'),
                    type: fieldType,
                    label: fieldType === 'dateRange' ? 'Dates' : fieldType === 'link' ? 'Link' : fieldType === 'file' ? 'File' : 'Field'
                });
                return renderSocialPageNow('portfolio-custom-field-add');
            }
            if (action === 'portfolio-custom-field-remove') {
                const fieldIndex = Number(trigger.getAttribute('data-field-index'));
                state().ui.customBuilderFields = (Array.isArray(state().ui.customBuilderFields) ? state().ui.customBuilderFields : [])
                    .filter((_, index) => index !== fieldIndex);
                return renderSocialPageNow('portfolio-custom-field-remove');
            }
            if (action === 'portfolio-custom-save') {
                return withBusy(async () => {
                    await saveMyPortfolioDocument({ flash: false });
                    const sectionName = text(state().ui.customBuilderName || document.querySelector('[name="portfolioCustomSectionName"]')?.value);
                    const fields = (Array.isArray(state().ui.customBuilderFields) ? state().ui.customBuilderFields : [])
                        .map((field, index) => ({
                            key: text(field.key || portfolioMakeId('field')),
                            type: text(field.type || 'text'),
                            label: text(document.querySelector(`[name="portfolioCustomFieldLabel"][data-field-index="${index}"]`)?.value || field.label || 'Field')
                        }));
                    try {
                        const portfolio = await window.KiuPortfolioApi.addCustomSection({
                            label: sectionName,
                            templateId: text(state().ui.customBuilderTemplate),
                            repeatable: true,
                            fieldDefinitions: fields,
                            entries: [{ id: portfolioMakeId('entry'), order: 0, fields: {} }]
                        });
                        if (portfolio) {
                            state().ui.myPortfolio = clonePortfolioDocument(portfolio);
                            state().ui.portfolioCustomBuilderOpen = false;
                            if (typeof hydrateRuntime === 'function') await hydrateRuntime(true);
                        }
                    } catch (error) {
                        if (typeof setPortalSocialFlash === 'function') setPortalSocialFlash(error?.message || 'Custom section could not be added.', 'danger');
                    }
                    renderSocialPageNow('portfolio-custom-save');
                });
            }
            if (action === 'portfolio-doc-open') {
                const userId = text(trigger.getAttribute('data-user-id'));
                state().ui.portfolioPanelTab = 'discover';
                state().ui.projectDiscoverSearch = userId ? displayName(accountById(userId)) : '';
                return renderSocialPageNow('portfolio-doc-open');
            }
            if (action === 'portfolio-edit') {
                const projectId = text(trigger.getAttribute('data-project-id'));
                const entry = (Array.isArray(state().social?.projects) ? state().social.projects : []).find((item) => text(item?.id) === projectId);
                if (!entry) return;
                openPortfolioEditor(entry);
                state().ui.activeProjectId = projectId;
                setPanel('projects');
                return openDialog('portfolio-create');
            }
            if (action === 'portfolio-edit-cancel') {
                resetPortfolioEditor();
                closeDialog();
                return;
            }
            if (action === 'portfolio-delete') {
                return withBusy(async () => {
                    const projectId = text(trigger.getAttribute('data-project-id'));
                    const entry = (Array.isArray(state().social?.projects) ? state().social.projects : []).map((item) => normalizePortfolioEntry(item)).find((item) => item.id === projectId);
                    if (!entry) return;
                    const confirmed = typeof window.confirm === 'function'
                        ? window.confirm(`Remove "${entry.title}" from Portfolio?`)
                        : true;
                    if (!confirmed) return;
                    await deletePortalSocialProject(projectId);
                    if (text(state().ui?.projectEditId || '') === projectId) resetPortfolioEditor();
                    if (text(state().ui?.activeProjectId || '') === projectId) state().ui.activeProjectId = '';
                    renderSocialPageNow('portfolio-delete');
                });
            }
            if (action === 'portfolio-contact') {
                const targetUserId = text(trigger.getAttribute('data-user-id'));
                const projectId = text(trigger.getAttribute('data-project-id'));
                const entry = (Array.isArray(state().social?.projects) ? state().social.projects : []).map((item) => normalizePortfolioEntry(item)).find((item) => item.id === projectId);
                if (!targetUserId || !entry || typeof openPortalDirectChat !== 'function') return;
                return withBusy(async () => {
                    const chat = await openPortalDirectChat(targetUserId);
                    if (chat?.id) {
                        state().ui.messageDraftByChat = state().ui.messageDraftByChat || {};
                        state().ui.messageDraftByChat[text(chat.id)] = `Hi, I saw your portfolio entry "${entry.title}" and would like to connect.`;
                        setActiveChat(chat.id);
                        setPanel('messages');
                    }
                });
            }
            if (action === 'projects-back') {
                clearProjectTabPaneCache();
                if (['project-column-tasks', 'project-task-detail'].includes(text(activeDialog()?.type || ''))) closeDialog();
                state().ui.activeProjectId = '';
                state().ui.projectTab = 'overview';
                state().ui.projectTaskChecklist = [];
                return renderSocialPageNow('projects-back');
            }
            if (action === 'project-tab') {
                const projectId = text(trigger.getAttribute('data-project-id') || state().ui.activeProjectId);
                const tabAlias = { outcome: 'budget' };
                const REMOVED_PROJECT_TABS = new Set(['plan', 'milestones', 'meetings', 'files', 'checkins']);
                const rawTab = tabAlias[text(trigger.getAttribute('data-project-tab') || 'overview')] || text(trigger.getAttribute('data-project-tab') || 'overview') || 'overview';
                const requestedTab = REMOVED_PROJECT_TABS.has(rawTab) ? 'overview' : rawTab;
                const currentTab = text(state().ui.projectTab || 'overview') || 'overview';
                const currentProjectId = text(state().ui.activeProjectId || '');
                if (projectId === currentProjectId && requestedTab === currentTab) return;
                if (['project-column-tasks', 'project-task-detail'].includes(text(activeDialog()?.type || ''))) closeDialog();
                state().ui.projectTaskChecklist = [];
                state().ui.activeProjectId = projectId;
                state().ui.projectTab = requestedTab;
                const host = root();
                const shell = host?.querySelector('.social-projects-shell');
                if (shell) shell.classList.add('is-tab-switching');
                if (requestedTab === 'chat') {
                    const project = (Array.isArray(state().social?.projects) ? state().social.projects : [])
                        .find((entry) => text(entry?.id) === projectId);
                    if (project?.groupId) {
                        return withBusy(async () => {
                            const chat = await ensureProjectWorkspaceChat(project);
                            if (chat?.id) setActiveChat(chat.id);
                            clearProjectTabPaneCache(projectId);
                            if (patchProjectWorkspaceTab(state())) return;
                            invalidateSocialRenderCache({ center: true });
                            renderSocialPageNow('project-tab');
                        });
                    }
                }
                if (patchProjectWorkspaceTab(state())) return;
                invalidateSocialRenderCache({ center: true });
                renderSocialPageNow('project-tab');
                return;
            }
            if (action === 'project-faculty-toggle') {
                const faculty = text(trigger.getAttribute('data-faculty'));
                state().ui.projectFacultyCodes = Array.isArray(state().ui.projectFacultyCodes) ? state().ui.projectFacultyCodes : [currentFacultyCode()];
                if (state().ui.projectFacultyCodes.includes(faculty)) {
                    state().ui.projectFacultyCodes = state().ui.projectFacultyCodes.filter((item) => text(item) !== faculty);
                } else {
                    state().ui.projectFacultyCodes.push(faculty);
                }
                if (!state().ui.projectFacultyCodes.length) state().ui.projectFacultyCodes = [currentFacultyCode()];
                return renderSocialPageNow('project-faculty-toggle');
            }
            if (action === 'project-creator-member-add') {
                state().ui.projectInviteSelectedIds = Array.isArray(state().ui.projectInviteSelectedIds) ? state().ui.projectInviteSelectedIds : [];
                const memberId = text(trigger.getAttribute('data-user-id'));
                if (memberId && !state().ui.projectInviteSelectedIds.includes(memberId)) state().ui.projectInviteSelectedIds.push(memberId);
                return renderSocialPageNow('project-creator-member-add');
            }
            if (action === 'project-creator-member-remove') {
                const memberId = text(trigger.getAttribute('data-user-id'));
                state().ui.projectInviteSelectedIds = (Array.isArray(state().ui.projectInviteSelectedIds) ? state().ui.projectInviteSelectedIds : []).filter((item) => text(item) !== memberId);
                return renderSocialPageNow('project-creator-member-remove');
            }
            if (action === 'project-selected-add') {
                state().ui.projectInviteSelectedIds = Array.isArray(state().ui.projectInviteSelectedIds) ? state().ui.projectInviteSelectedIds : [];
                const memberId = text(trigger.getAttribute('data-user-id'));
                if (memberId && !state().ui.projectInviteSelectedIds.includes(memberId)) state().ui.projectInviteSelectedIds.push(memberId);
                return renderSocialPageNow('project-selected-add');
            }
            if (action === 'project-selected-remove') {
                const memberId = text(trigger.getAttribute('data-user-id'));
                state().ui.projectInviteSelectedIds = (Array.isArray(state().ui.projectInviteSelectedIds) ? state().ui.projectInviteSelectedIds : []).filter((item) => text(item) !== memberId);
                return renderSocialPageNow('project-selected-remove');
            }
            if (action === 'project-open-chat') {
                return withBusy(async () => {
                    const projectId = text(trigger.getAttribute('data-project-id'));
                    const project = (Array.isArray(state().social?.projects) ? state().social.projects : []).find((entry) => text(entry?.id) === projectId);
                    if (!project?.groupId) throw new Error('Project chat is unavailable.');
                    state().ui.activeProjectId = projectId;
                    state().ui.projectTab = 'chat';
                    const chat = await ensureProjectWorkspaceChat(project);
                    if (chat?.id) setActiveChat(chat.id);
                    clearProjectTabPaneCache(projectId);
                    if (patchProjectWorkspaceTab(state())) return;
                    invalidateSocialRenderCache({ center: true });
                    renderSocialPageNow('project-open-chat');
                });
            }
            if (action === 'project-member-invite') {
                return withBusy(() => invitePortalSocialProjectMember(
                    trigger.getAttribute('data-project-id'),
                    trigger.getAttribute('data-user-id'),
                    trigger.getAttribute('data-role')
                ));
            }
            if (action === 'project-member-role') {
                return withBusy(() => updatePortalSocialProjectMemberRole(
                    trigger.getAttribute('data-project-id'),
                    trigger.getAttribute('data-user-id'),
                    trigger.getAttribute('data-role')
                ));
            }
            if (action === 'project-member-remove') {
                return withBusy(() => removePortalSocialProjectMember(
                    trigger.getAttribute('data-project-id'),
                    trigger.getAttribute('data-user-id')
                ));
            }
            if (action === 'project-task-move') {
                const moveProjectId = text(trigger.getAttribute('data-project-id') || state().ui?.activeProjectId || '');
                const moveTaskId = text(trigger.getAttribute('data-task-id') || '');
                const moveStatus = text(trigger.getAttribute('data-status') || 'todo') || 'todo';
                if (!moveProjectId || !moveTaskId) return;
                return withBusy(async () => {
                    await updatePortalSocialProjectTask(
                        moveProjectId,
                        moveTaskId,
                        { status: moveStatus },
                        { silent: true }
                    );
                    markProjectTaskGraphPreviewStale(moveProjectId);
                    refreshProjectTasksTabPane('project-task-move');
                });
            }
            if (action === 'project-task-delete-open') {
                const projectId = text(trigger.getAttribute('data-project-id') || state().ui?.activeProjectId || '');
                const taskId = text(trigger.getAttribute('data-task-id') || '');
                if (!projectId || !taskId) return;
                return openDialog('project-task-delete', { projectId, taskId });
            }
            if (action === 'project-column-tasks-open') {
                const runtime = state();
                return openDialog('project-column-tasks', {
                    projectId: text(runtime.ui?.activeProjectId || ''),
                    columnId: text(trigger.getAttribute('data-column') || '') || 'todo'
                });
            }
            if (action === 'project-task-detail-open') {
                const runtime = state();
                const projectId = text(trigger.getAttribute('data-project-id') || runtime.ui?.activeProjectId || '');
                const taskId = text(trigger.getAttribute('data-task-id') || '');
                const project = resolveActiveSocialProject(runtime, projectId);
                const editTask = (Array.isArray(project?.tasks) ? project.tasks : []).find((task) => text(task?.id) === taskId) || null;
                if (!editTask) return;
                return openDialog('project-task-detail', { projectId, taskId });
            }
            if (action === 'project-task-create-open') {
                const createRuntime = state();
                const linkFrom = text(createRuntime.ui?.projectTaskGraphLinkFrom || '');
                // Only auto-parent when user is mid graph-link; never reuse stale edit/create depends.
                createRuntime.ui.projectTaskDependsOnIds = linkFrom ? [linkFrom] : [];
                const packageId = text(trigger.getAttribute('data-package-id') || '');
                createRuntime.ui.projectTaskCreateGroupId = packageId && packageId !== '__ungrouped__' ? packageId : '';
                return openDialog('project-task-create', {
                    projectId: text(trigger.getAttribute('data-project-id') || createRuntime.ui?.activeProjectId || '')
                });
            }
            if (action === 'project-task-edit-open') {
                const runtime = state();
                const projectId = text(trigger.getAttribute('data-project-id') || runtime.ui?.activeProjectId || '');
                const taskId = text(trigger.getAttribute('data-task-id') || '');
                const project = resolveActiveSocialProject(runtime, projectId);
                const editTask = (Array.isArray(project?.tasks) ? project.tasks : []).find((task) => text(task?.id) === taskId) || null;
                runtime.ui.projectTaskChecklist = editTask
                    ? (Array.isArray(editTask.checklist) ? editTask.checklist : []).map((item) => ({ id: text(item.id), label: text(item.label), done: Boolean(item.done) }))
                    : [];
                runtime.ui.projectTaskDependsOnIds = editTask ? projectTaskDependsOnIds(editTask) : [];
                return openDialog('project-task-edit', { projectId, taskId });
            }
            if (action === 'project-task-graph-open') {
                const graphRuntime = state();
                const graphProjectId = text(trigger.getAttribute('data-project-id') || graphRuntime.ui?.activeProjectId || '');
                const graphProject = resolveActiveSocialProject(graphRuntime, graphProjectId);
                const graphTasks = Array.isArray(graphProject?.tasks) ? graphProject.tasks : [];
                // Simple defaults: status columns, explicit links only, browse mode.
                graphRuntime.ui.projectTaskGraphShowInferred = false;
                graphRuntime.ui.projectTaskGraphShowFlow = false;
                if (graphRuntime.ui.projectTaskGraphLayout === undefined) graphRuntime.ui.projectTaskGraphLayout = 'status';
                const graphModel = buildProjectTaskGraphModel(graphTasks, {
                    showInferred: false,
                    showFlow: false
                });
                const graphStageSize = computeProjectTaskGraphStageSize(graphRuntime);
                ensureProjectTaskGraphPositionsLoaded(graphRuntime, graphProjectId || text(graphProject?.id || ''));
                let graphLayout = buildProjectTaskGraphLayout(graphModel, graphRuntime, graphStageSize);
                const openProjectId = graphProjectId || text(graphProject?.id || '');
                if (projectTaskGraphLayoutUsesSavedPositions(graphLayout, graphRuntime)) {
                    graphLayout = applyProjectTaskGraphSavedPositions(
                        graphLayout,
                        getProjectTaskGraphPositions(graphRuntime, openProjectId)
                    );
                }
                const savedView = loadProjectTaskGraphView(openProjectId);
                if (savedView) {
                    graphRuntime.ui.projectTaskGraphZoom = savedView.zoom;
                    graphRuntime.ui.projectTaskGraphPan = { ...savedView.pan };
                } else {
                    // First open: content-fit all tasks (same idea as Reset view / preview).
                    const groupBoxes = collectProjectTaskGraphGroupBoxes(graphRuntime, openProjectId, graphLayout);
                    const firstFit = computeProjectTaskGraphContentFitView(
                        graphLayout,
                        graphStageSize.stageWidth,
                        graphStageSize.stageHeight,
                        { pad: 56, minZoom: PROJECT_TASK_GRAPH_MIN_ZOOM, maxZoom: 1.15, extraBoxes: groupBoxes }
                    );
                    graphRuntime.ui.projectTaskGraphZoom = firstFit.zoom;
                    graphRuntime.ui.projectTaskGraphPan = { ...firstFit.pan };
                    saveProjectTaskGraphView(openProjectId, firstFit);
                }
                if (graphRuntime.ui.projectTaskGraphPanelOpen === undefined) graphRuntime.ui.projectTaskGraphPanelOpen = true;
                graphRuntime.ui.projectTaskGraphMode = 'browse';
                graphRuntime.ui.projectTaskGraphSelectedId = text(trigger.getAttribute('data-task-id') || '');
                graphRuntime.ui.projectTaskGraphLinkFrom = '';
                graphRuntime.ui.projectTaskGraphQuickCreate = { open: false };
                return openDialog('project-task-graph', {
                    projectId: openProjectId
                });
            }
            if (action === 'project-task-graph-zoom-in') {
                const runtime = state();
                runtime.ui.projectTaskGraphZoom = clampProjectTaskGraphZoom(
                    (Number(runtime.ui?.projectTaskGraphZoom || 1) || 1) + 0.1
                );
                persistProjectTaskGraphView(runtime);
                return refreshProjectTaskGraphDialog(['zoom']);
            }
            if (action === 'project-task-graph-zoom-out') {
                const runtime = state();
                runtime.ui.projectTaskGraphZoom = clampProjectTaskGraphZoom(
                    (Number(runtime.ui?.projectTaskGraphZoom || 1) || 1) - 0.1
                );
                persistProjectTaskGraphView(runtime);
                return refreshProjectTaskGraphDialog(['zoom']);
            }
            if (action === 'project-task-graph-save') {
                const projectId = text(trigger.getAttribute('data-project-id') || state().ui?.activeProjectId || activeDialog()?.projectId || '');
                pulseProjectTaskGraphCheckpointButton(trigger);
                return withBusy(async () => {
                    const snapshot = await saveProjectTaskGraphCheckpoint(state(), projectId);
                    const when = formatProjectTaskGraphCheckpointWhen(snapshot?.savedAt);
                    const msg = snapshot?.serverSynced
                        ? (when ? `Graph saved · ${when}` : 'Graph saved.')
                        : (when ? `Graph saved locally · ${when}` : 'Graph saved locally.');
                    if (typeof setPortalSocialFlash === 'function') {
                        setPortalSocialFlash(msg, 'success', { skipRender: true });
                    }
                    // If history dialog is open, remount it so the new row appears.
                    if (text(activeDialog()?.type || '') === 'project-task-graph-history') {
                        state().ui.projectTaskGraphHistoryPendingDeleteId = '';
                        return renderDialogOnlyNow();
                    }
                    refreshProjectTaskGraphDialog(['chrome']);
                });
            }
            if (action === 'project-task-graph-toggle-critical') {
                const runtime = state();
                runtime.ui.projectTaskGraphShowCritical = !projectTaskGraphShowCritical(runtime);
                return refreshProjectTaskGraphDialog(['canvas', 'chrome', 'selection']);
            }
            if (action === 'project-task-graph-history-open') {
                const projectId = text(trigger.getAttribute('data-project-id') || state().ui?.activeProjectId || '');
                pulseProjectTaskGraphCheckpointButton(trigger);
                state().ui.projectTaskGraphHistoryPendingDeleteId = '';
                return openDialog('project-task-graph-history', { projectId });
            }
            if (action === 'project-task-graph-schedule-help') {
                const projectId = text(trigger.getAttribute('data-project-id') || state().ui?.activeProjectId || activeDialog()?.projectId || '');
                return openDialog('project-task-graph-schedule-help', { projectId });
            }
            if (action === 'project-task-graph-history-restore' || action === 'project-task-graph-restore') {
                const projectId = text(trigger.getAttribute('data-project-id') || state().ui?.activeProjectId || '');
                const snapshotId = text(trigger.getAttribute('data-snapshot-id') || '');
                const snapshot = snapshotId
                    ? getProjectTaskGraphCheckpointById(projectId, snapshotId)
                    : readProjectTaskGraphCheckpoint(projectId);
                if (!snapshot) {
                    if (typeof setPortalSocialFlash === 'function') {
                        setPortalSocialFlash('No saved graph yet. Click Save first.', 'info', { skipRender: true });
                    }
                    return;
                }
                const label = text(snapshot.label) || formatProjectTaskGraphCheckpointWhen(snapshot.savedAt) || 'this save';
                const ok = window.confirm(`Restore “${label}”? This replaces current packages, positions, and order links.`);
                if (!ok) return;
                return withBusy(async () => {
                    await restoreProjectTaskGraphCheckpoint(state(), projectId, snapshotId || snapshot.id);
                    state().ui.projectTaskGraphHistoryPendingDeleteId = '';
                    if (typeof setPortalSocialFlash === 'function') {
                        setPortalSocialFlash('Graph restored from save.', 'success', { skipRender: true });
                    }
                    // Close history if open, remount map fully.
                    if (text(activeDialog()?.type || '') === 'project-task-graph-history') {
                        closeDialog();
                    }
                    refreshProjectTaskGraphDialog(['canvas', 'chrome', 'zoom', 'groupFocus', 'selection']);
                });
            }
            if (action === 'project-task-graph-history-delete') {
                const snapshotId = text(trigger.getAttribute('data-snapshot-id') || '');
                state().ui.projectTaskGraphHistoryPendingDeleteId = snapshotId;
                // Arm confirm; second click on Confirm delete finalizes.
                if (text(activeDialog()?.type || '') === 'project-task-graph-history') {
                    return renderDialogOnlyNow();
                }
                return;
            }
            if (action === 'project-task-graph-history-delete-confirm') {
                const projectId = text(trigger.getAttribute('data-project-id') || state().ui?.activeProjectId || '');
                const snapshotId = text(trigger.getAttribute('data-snapshot-id') || '');
                if (text(state().ui?.projectTaskGraphHistoryPendingDeleteId || '') !== snapshotId) {
                    state().ui.projectTaskGraphHistoryPendingDeleteId = snapshotId;
                    return renderDialogOnlyNow();
                }
                deleteProjectTaskGraphCheckpoint(projectId, snapshotId);
                state().ui.projectTaskGraphHistoryPendingDeleteId = '';
                if (typeof setPortalSocialFlash === 'function') {
                    setPortalSocialFlash('Save deleted.', 'info', { skipRender: true });
                }
                if (text(activeDialog()?.type || '') === 'project-task-graph-history') {
                    return renderDialogOnlyNow();
                }
                refreshProjectTaskGraphDialog(['chrome']);
                return;
            }
            if (action === 'project-task-graph-zoom-fit' || action === 'project-task-graph-reset-view') {
                const fitRuntime = state();
                const projectId = text(fitRuntime.ui?.activeProjectId || activeDialog()?.projectId || '');
                applyProjectTaskGraphResetView(fitRuntime, projectId);
                return refreshProjectTaskGraphDialog(['zoom']);
            }
            if (action === 'project-task-graph-toggle-panel') {
                // Left Map tools panel removed; overview lives in the right rail.
                return refreshProjectTaskGraphDialog(['selection', 'chrome']);
            }
            if (action === 'project-task-graph-toggle-inferred') {
                state().ui.projectTaskGraphShowInferred = !projectTaskGraphShowInferred(state());
                return refreshProjectTaskGraphDialog(['canvas', 'selection']);
            }
            if (action === 'project-task-graph-toggle-flow') {
                state().ui.projectTaskGraphShowFlow = !projectTaskGraphShowFlow(state());
                return refreshProjectTaskGraphDialog(['canvas', 'selection']);
            }
            if (action === 'project-task-graph-toggle-my') {
                const runtime = state();
                const on = !projectTaskGraphMineOnlyActive(runtime);
                runtime.ui.projectTaskFocus = on ? 'mine' : 'all';
                runtime.ui.projectTaskMyOnly = on;
                const selectedId = text(runtime.ui?.projectTaskGraphSelectedId || '');
                if (on && selectedId && !isProjectTaskGraphGroupId(selectedId)) {
                    const project = resolveActiveSocialProject(runtime, activeDialog()?.projectId);
                    const visible = filterProjectTaskGraphVisibleTasks(runtime, project?.tasks || []);
                    if (!visible.some((task) => text(task?.id) === selectedId)) {
                        runtime.ui.projectTaskGraphSelectedId = '';
                    }
                }
                return refreshProjectTaskGraphDialog(['canvas', 'chrome', 'selection']);
            }
            if (action === 'project-task-graph-highlight-overdue') {
                state().ui.projectTaskGraphHighlightOverdue = !state().ui.projectTaskGraphHighlightOverdue;
                return refreshProjectTaskGraphDialog(['selection']);
            }
            if (action === 'project-task-graph-highlight-blocked') {
                state().ui.projectTaskGraphHighlightBlocked = !state().ui.projectTaskGraphHighlightBlocked;
                return refreshProjectTaskGraphDialog(['selection']);
            }
            if (action === 'project-task-graph-mode-view' || action === 'project-task-graph-mode-explore' || action === 'project-task-graph-mode-browse') {
                const runtime = state();
                runtime.ui.projectTaskGraphMode = 'browse';
                runtime.ui.projectTaskGraphLinkFrom = '';
                return refreshProjectTaskGraphDialog(['chrome', 'selection', 'canvas']);
            }
            if (action === 'project-task-graph-mode-link' || action === 'project-task-graph-mode-connect') {
                const runtime = state();
                // Toggle connect on/off for a single toolbar button.
                const next = normalizeProjectTaskGraphMode(runtime.ui?.projectTaskGraphMode) === 'connect' ? 'browse' : 'connect';
                runtime.ui.projectTaskGraphMode = next;
                if (next !== 'connect') runtime.ui.projectTaskGraphLinkFrom = '';
                return refreshProjectTaskGraphDialog(['chrome', 'selection', 'canvas']);
            }
            if (action === 'project-task-graph-mode-arrange') {
                // Legacy: arrange is just browse (always can drag).
                const runtime = state();
                runtime.ui.projectTaskGraphMode = 'browse';
                runtime.ui.projectTaskGraphLinkFrom = '';
                return refreshProjectTaskGraphDialog(['chrome', 'selection', 'canvas']);
            }
            if (action === 'project-task-graph-layout-force') {
                const runtime = state();
                runtime.ui.projectTaskGraphLayout = 'force';
                return refreshProjectTaskGraphDialog(['canvas', 'sidebar', 'zoom']);
            }
            if (action === 'project-task-graph-link-cancel') {
                const runtime = state();
                runtime.ui.projectTaskGraphLinkFrom = '';
                runtime.ui.projectTaskGraphMode = 'browse';
                return refreshProjectTaskGraphDialog(['chrome', 'selection']);
            }
            if (action === 'project-task-graph-quick-create-cancel') {
                const runtime = state();
                runtime.ui.projectTaskGraphQuickCreate = { open: false };
                return refreshProjectTaskGraphDialog(['quickCreate']);
            }
            if (action === 'project-task-graph-focus-group') {
                const gid = text(trigger.value != null && trigger.matches?.('select')
                    ? trigger.value
                    : (trigger.getAttribute('data-group-id') || ''));
                state().ui.projectTaskGraphFocusGroupId = gid;
                if (text(activeDialog()?.type || '') === 'project-task-graph') {
                    syncProjectTaskGraphGroupFocus(state());
                    return;
                }
                return refreshProjectTaskGraphDialog(['chrome', 'selection', 'groupFocus']);
            }
            if (action === 'project-task-graph-group-create') {
                const runtime = state();
                const projectId = text(trigger.getAttribute('data-project-id'));
                const form = trigger.closest('form');
                const typed = text(form?.projectTaskTitle?.value || '');
                const name = typed || (window.prompt('Group name', '') || '').trim();
                if (!name) return;
                createProjectTaskGraphGroup(runtime, projectId, {
                    name,
                    x: Number(trigger.getAttribute('data-graph-x')),
                    y: Number(trigger.getAttribute('data-graph-y'))
                });
                runtime.ui.projectTaskGraphQuickCreate = { open: false };
                refreshProjectTaskGraphDialog(['quickCreate', 'canvas', 'chrome']);
                return;
            }
            if (action === 'project-task-graph-group-rename') {
                // Pen opens package inspector (name / assignee / notes) instead of window.prompt.
                const runtime = state();
                const groupId = text(trigger.getAttribute('data-group-id'));
                if (!groupId) return;
                runtime.ui.projectTaskGraphSelectedId = groupId;
                runtime.ui.projectTaskGraphLinkFrom = '';
                refreshProjectTaskGraphDialog(['selection', 'chrome']);
                window.requestAnimationFrame(() => {
                    const host = getProjectTaskGraphHost();
                    const nameInput = host?.querySelector('[data-group-name-input="1"]');
                    if (nameInput && typeof nameInput.focus === 'function') {
                        try {
                            nameInput.focus();
                            nameInput.select?.();
                        } catch (error) {}
                    }
                });
                return;
            }
            if (action === 'project-task-graph-group-save') {
                const runtime = state();
                const projectId = text(trigger.getAttribute('data-project-id') || '');
                const groupId = text(trigger.getAttribute('data-group-id') || '');
                if (!projectId || !groupId) return;
                const host = getProjectTaskGraphHost();
                const form = host?.querySelector(`[data-project-task-graph-group-form="1"][data-group-id="${groupId}"]`)
                    || trigger.closest('.social-project-task-graph-inspector')?.querySelector('[data-project-task-graph-group-form="1"]')
                    || trigger.closest('form');
                const name = text(form?.groupName?.value || form?.querySelector?.('[name="groupName"]')?.value || '').trim();
                if (!name) {
                    if (typeof setPortalSocialFlash === 'function') setPortalSocialFlash('Package name is required.', 'danger');
                    return;
                }
                const assigneeUserId = text(form?.groupAssigneeUserId?.value
                    || form?.querySelector?.('[name="groupAssigneeUserId"]')?.value
                    || '');
                const description = text(form?.groupDescription?.value
                    || form?.querySelector?.('[name="groupDescription"]')?.value
                    || '');
                updateProjectTaskGraphGroup(runtime, projectId, groupId, {
                    name,
                    assigneeUserId,
                    description
                });
                runtime.ui.projectTaskGraphSelectedId = groupId;
                refreshProjectTaskGraphDialog(['canvas', 'selection', 'chrome']);
                return;
            }
            if (action === 'project-task-graph-group-delete') {
                const runtime = state();
                const projectId = text(trigger.getAttribute('data-project-id'));
                const groupId = text(trigger.getAttribute('data-group-id'));
                if (!window.confirm('Delete this package? (Tasks are not deleted.)')) return;
                deleteProjectTaskGraphGroup(runtime, projectId, groupId);
                if (text(runtime.ui?.projectTaskGraphSelectedId || '') === groupId) {
                    runtime.ui.projectTaskGraphSelectedId = '';
                }
                if (text(runtime.ui?.projectTaskGraphFocusGroupId || '') === groupId) {
                    runtime.ui.projectTaskGraphFocusGroupId = '';
                }
                refreshProjectTaskGraphDialog(['canvas', 'chrome', 'selection']);
                return;
            }
            if (action === 'project-task-graph-group-remove-member') {
                const runtime = state();
                const projectId = text(trigger.getAttribute('data-project-id'));
                const groupId = text(trigger.getAttribute('data-group-id'));
                const taskId = text(trigger.getAttribute('data-task-id'));
                const ok = typeof window.confirm === 'function'
                    ? window.confirm('Remove this task from the package?\n\nThe task stays on the map; only package membership is removed.')
                    : true;
                if (!ok) return;
                toggleProjectTaskGraphGroupMember(runtime, projectId, groupId, taskId, false);
                refreshProjectTaskGraphDialog(['canvas']);
                return;
            }
            if (action === 'project-task-graph-select-node') {
                const projectId = text(trigger.getAttribute('data-project-id'));
                const taskId = text(trigger.getAttribute('data-task-id'));
                return selectProjectTaskGraphNode(projectId, taskId);
            }
            if (action === 'project-task-graph-clear-selection') {
                const runtime = state();
                runtime.ui.projectTaskGraphSelectedId = '';
                return refreshProjectTaskGraphDialog(['selection']);
            }
            if (action === 'project-task-graph-link-from-selected') {
                const runtime = state();
                const taskId = text(trigger.getAttribute('data-task-id'));
                runtime.ui.projectTaskGraphMode = 'connect';
                runtime.ui.projectTaskGraphLinkFrom = taskId;
                runtime.ui.projectTaskGraphSelectedId = taskId;
                return refreshProjectTaskGraphDialog(['chrome', 'selection']);
            }
            if (action === 'project-task-graph-unlink' || action === 'project-task-graph-unlink-edge') {
                const projectId = text(trigger.getAttribute('data-project-id'));
                const taskId = text(trigger.getAttribute('data-task-id'));
                const fromId = text(trigger.getAttribute('data-from-id'));
                const ok = typeof window.confirm === 'function'
                    ? window.confirm('Remove this order link?\n\nThe waiting task will no longer depend on its predecessor. This can change Ready/Waiting and the critical path.')
                    : true;
                if (!ok) return;
                return withBusy(async () => {
                    await removeProjectTaskDependency(projectId, taskId, fromId);
                    notifyProjectTaskGraphSurfaceChanged(projectId);
                    const svg = getProjectTaskGraphHost()?.querySelector('[data-project-task-graph-svg]');
                    // Zero-flicker: remove the edge group only — no sidebar/selection/canvas remount.
                    if (!patchRemoveProjectTaskGraphEdge(svg, fromId, taskId)) {
                        syncProjectTaskGraphEdgesOnly(state());
                    }
                    patchProjectTaskGraphLinkCountLabel(state());
                });
            }
            if (action === 'project-task-checklist-add') {
                const rows = Array.isArray(state().ui.projectTaskChecklist) ? state().ui.projectTaskChecklist : [];
                rows.push({ id: `new-${rows.length + 1}-${Date.now()}`, label: '', done: false });
                state().ui.projectTaskChecklist = rows;
                if (['project-task-create', 'project-task-edit', 'project-task-detail'].includes(text(activeDialog()?.type || ''))) {
                    return renderDialogOnlyNow();
                }
                return renderSocialPageNow('project-task-checklist-add');
            }
            if (action === 'project-task-checklist-remove') {
                const removeId = text(trigger.getAttribute('data-checklist-id') || '');
                state().ui.projectTaskChecklist = (Array.isArray(state().ui.projectTaskChecklist) ? state().ui.projectTaskChecklist : [])
                    .filter((item) => text(item.id) !== removeId);
                if (['project-task-create', 'project-task-edit', 'project-task-detail'].includes(text(activeDialog()?.type || ''))) {
                    return renderDialogOnlyNow();
                }
                return renderSocialPageNow('project-task-checklist-remove');
            }
            if (action === 'project-task-toggle-my') {
                state().ui.projectTaskMyOnly = !state().ui.projectTaskMyOnly;
                return refreshProjectTasksTabPane('project-task-toggle-my');
            }
            if (action === 'project-task-quick-add') {
                const column = text(trigger.getAttribute('data-column') || 'todo') || 'todo';
                const runtime = state();
                runtime.ui.projectTaskDependsOnIds = [];
                runtime.ui.projectTaskCreateGroupId = '';
                return openDialog('project-task-create', {
                    projectId: text(trigger.getAttribute('data-project-id') || runtime.ui?.activeProjectId || ''),
                    defaultColumn: column
                });
            }
            if (action === 'project-settings-open') {
                return openDialog('project-settings', {
                    projectId: text(trigger.getAttribute('data-project-id') || state().ui?.activeProjectId || '')
                });
            }
            if (action === 'project-health-open') {
                return openDialog('project-health', {
                    projectId: text(trigger.getAttribute('data-project-id') || state().ui?.activeProjectId || '')
                });
            }
            if (action === 'project-health-plan-window') {
                state().ui.projectHealthPlanWindow = normalizeProjectPlanHorizon(trigger.getAttribute('data-window'));
                if (patchProjectHealthPlanCard(state())) return;
                return renderDialogOnlyNow();
            }
            if (action === 'project-health-plan-pick-open') {
                const runtime = state();
                const projectId = text(trigger.getAttribute('data-project-id') || runtime.ui?.activeProjectId || '');
                const horizon = normalizeProjectPlanHorizon(
                    trigger.getAttribute('data-window') || runtime.ui?.projectHealthPlanWindow || 'weeks'
                );
                runtime.ui.projectHealthPlanWindow = horizon;
                runtime.ui.projectHealthPlanPickSearch = '';
                runtime.ui.projectHealthPlanPickBrowseId = 'all';
                runtime.ui.projectHealthPlanPickStatus = 'open';
                runtime.ui.projectHealthPlanPickHidePlanned = true;
                runtime.ui.projectHealthPlanPickSelectedIds = [];
                return openDialog('project-health-plan-pick', { projectId, horizon });
            }
            if (action === 'project-health-plan-pick-browse') {
                const runtime = state();
                runtime.ui.projectHealthPlanPickBrowseId = text(trigger.getAttribute('data-package-id') || 'all') || 'all';
                if (patchProjectHealthPlanPick(runtime)) return;
                return renderDialogOnlyNow();
            }
            if (action === 'project-health-plan-pick-add-package') {
                const runtime = state();
                const packageId = text(trigger.getAttribute('data-package-id') || '');
                if (!packageId || packageId === 'all') return;
                const dialog = activeDialog();
                const model = buildProjectHealthPlanPickModel(runtime, dialog);
                if (!model) return;
                const selected = new Set(model.selectedSet);
                model.eligible.forEach((t) => {
                    const tid = text(t?.id);
                    if (!tid) return;
                    const pkg = resolveTaskPackageId(tid, model.groups) || '__ungrouped__';
                    if (pkg === packageId) selected.add(tid);
                });
                runtime.ui.projectHealthPlanPickSelectedIds = [...selected];
                runtime.ui.projectHealthPlanPickBrowseId = packageId;
                if (patchProjectHealthPlanPick(runtime)) return;
                return renderDialogOnlyNow();
            }
            if (action === 'project-health-plan-pick-filter') {
                const runtime = state();
                const filter = text(trigger.getAttribute('data-filter') || '');
                if (filter === 'search' || trigger.matches?.('input[type="search"][name="projectHealthPlanPickSearch"]')) {
                    runtime.ui.projectHealthPlanPickSearch = text(trigger.value || '');
                } else if (filter === 'openOnly') {
                    runtime.ui.projectHealthPlanPickStatus = trigger.checked ? 'open' : 'all';
                } else if (filter === 'hidePlanned') {
                    runtime.ui.projectHealthPlanPickHidePlanned = Boolean(trigger.checked);
                } else if (filter === 'mine') {
                    // legacy no-op in simplified picker
                }
                if (patchProjectHealthPlanPick(runtime)) return;
                return renderDialogOnlyNow();
            }
            if (action === 'project-health-plan-pick-toggle') {
                const taskId = text(trigger.getAttribute('data-task-id') || '');
                if (!taskId) return;
                const runtime = state();
                const selected = new Set(
                    (Array.isArray(runtime.ui.projectHealthPlanPickSelectedIds) ? runtime.ui.projectHealthPlanPickSelectedIds : [])
                        .map((id) => text(id))
                        .filter(Boolean)
                );
                if (selected.has(taskId)) selected.delete(taskId);
                else selected.add(taskId);
                runtime.ui.projectHealthPlanPickSelectedIds = [...selected];
                if (patchProjectHealthPlanPick(runtime)) return;
                return renderDialogOnlyNow();
            }
            if (action === 'project-health-plan-pick-toggle-all') {
                const runtime = state();
                const mode = text(trigger.getAttribute('data-mode') || 'all');
                const card = trigger.closest('.lux-glass-dialog-card--health-plan-pick') || document;
                const visibleIds = Array.from(card.querySelectorAll?.('.sph-pick-row[data-task-id]') || [])
                    .map((el) => text(el.getAttribute('data-task-id')))
                    .filter(Boolean);
                const selected = new Set(
                    (Array.isArray(runtime.ui.projectHealthPlanPickSelectedIds) ? runtime.ui.projectHealthPlanPickSelectedIds : [])
                        .map((id) => text(id))
                        .filter(Boolean)
                );
                if (mode === 'clear') {
                    visibleIds.forEach((id) => selected.delete(id));
                } else {
                    visibleIds.forEach((id) => selected.add(id));
                }
                runtime.ui.projectHealthPlanPickSelectedIds = [...selected];
                if (patchProjectHealthPlanPick(runtime)) return;
                return renderDialogOnlyNow();
            }
            if (action === 'project-health-plan-pick-apply') {
                const runtime = state();
                const projectId = text(trigger.getAttribute('data-project-id') || runtime.ui?.activeProjectId || '');
                const horizon = normalizeProjectPlanHorizon(
                    trigger.getAttribute('data-window') || runtime.ui?.projectHealthPlanWindow || 'weeks'
                );
                const ids = Array.isArray(runtime.ui.projectHealthPlanPickSelectedIds)
                    ? runtime.ui.projectHealthPlanPickSelectedIds
                    : [];
                if (!projectId || !ids.length) return;
                addManyToProjectWeekPlan(projectId, horizon, ids);
                runtime.ui.projectHealthPlanWindow = horizon;
                runtime.ui.projectHealthPlanPickSelectedIds = [];
                return restorePreviousDialog();
            }
            if (action === 'project-health-plan-remove') {
                const projectId = text(trigger.getAttribute('data-project-id') || state().ui?.activeProjectId || '');
                const taskId = text(trigger.getAttribute('data-task-id') || '');
                if (!projectId || !taskId) return;
                const win = normalizeProjectPlanHorizon(state().ui?.projectHealthPlanWindow || 'weeks');
                removeFromProjectWeekPlan(projectId, win, taskId);
                if (patchProjectHealthPlanCard(state())) return;
                return renderDialogOnlyNow();
            }
            if (action === 'project-risk-open') {
                const projectId = text(trigger.getAttribute('data-project-id') || state().ui?.activeProjectId || '');
                const taskId = text(trigger.getAttribute('data-task-id') || '');
                if (taskId) return openProjectRiskForTask(projectId, taskId);
                const groupId = text(trigger.getAttribute('data-group-id') || '');
                state().ui.projectRiskTaskId = '';
                state().ui.projectRiskGroupId = groupId;
                state().ui.projectRiskEditId = '';
                state().ui.projectRiskComposeOpen = false;
                closeProjectTaskGraphContextMenu();
                return openDialog('project-risk', { projectId, groupId, taskId: '' });
            }
            if (action === 'project-risk-select-group') {
                state().ui.projectRiskGroupId = text(trigger.getAttribute('data-group-id') || '');
                state().ui.projectRiskTaskId = '';
                state().ui.projectRiskEditId = '';
                state().ui.projectRiskComposeOpen = false;
                return renderDialogOnlyNow();
            }
            if (action === 'project-risk-toggle-group') {
                const groupId = text(trigger.getAttribute('data-group-id') || '');
                if (!groupId) return;
                const expanded = new Set(
                    (Array.isArray(state().ui.projectRiskExpandedGroupIds) ? state().ui.projectRiskExpandedGroupIds : [])
                        .map((id) => text(id))
                        .filter(Boolean)
                );
                if (expanded.has(groupId)) expanded.delete(groupId);
                else expanded.add(groupId);
                state().ui.projectRiskExpandedGroupIds = [...expanded];
                return renderDialogOnlyNow();
            }
            if (action === 'project-risk-select-task' || action === 'project-risk-task-compose') {
                const taskId = text(trigger.getAttribute('data-task-id') || '');
                if (!taskId) return;
                state().ui.projectRiskTaskId = taskId;
                state().ui.projectRiskGroupId = '';
                state().ui.projectRiskEditId = '';
                state().ui.projectRiskComposeOpen = action === 'project-risk-task-compose';
                return renderDialogOnlyNow();
            }
            if (action === 'project-risk-compose-open') {
                state().ui.projectRiskEditId = '';
                state().ui.projectRiskComposeOpen = true;
                return renderDialogOnlyNow();
            }
            if (action === 'project-risk-compose-cancel' || action === 'project-risk-cancel-edit') {
                state().ui.projectRiskEditId = '';
                state().ui.projectRiskComposeOpen = false;
                return renderDialogOnlyNow();
            }
            if (action === 'project-risk-edit') {
                state().ui.projectRiskEditId = text(trigger.getAttribute('data-risk-id') || '');
                state().ui.projectRiskComposeOpen = true;
                return renderDialogOnlyNow();
            }
            if (action === 'project-risk-delete') {
                const projectId = text(trigger.getAttribute('data-project-id') || '');
                const riskId = text(trigger.getAttribute('data-risk-id') || '');
                if (!projectId || !riskId || typeof deletePortalSocialProjectRisk !== 'function') return;
                if (typeof window !== 'undefined' && typeof window.confirm === 'function' && !window.confirm('Remove this risk from the register?')) return;
                return withBusy(async () => {
                    await deletePortalSocialProjectRisk(projectId, riskId);
                    state().ui.projectRiskEditId = '';
                    state().ui.projectRiskComposeOpen = false;
                    renderSocialPageNow('project-risk-deleted');
                });
            }
            if (action === 'project-baseline-set') {
                const projectId = text(trigger.getAttribute('data-project-id') || state().ui?.activeProjectId || '');
                if (!projectId || typeof setPortalSocialProjectBaseline !== 'function') return;
                const project = resolveActiveSocialProject(state(), projectId);
                if (!project?.isManager) return;
                const hasBaseline = Boolean(text(project?.baselineAt || ''));
                const ok = typeof window !== 'undefined' && typeof window.confirm === 'function'
                    ? window.confirm(hasBaseline
                        ? 'Update the baseline? This replaces the frozen plan snapshot with the current plan.'
                        : 'Set the baseline? This freezes the current plan (estimates, schedule, milestones) for plan-vs-reality comparison.')
                    : true;
                if (!ok) return;
                return withBusy(async () => {
                    await setPortalSocialProjectBaseline(projectId);
                    renderSocialPageNow('project-baseline-set');
                });
            }
            if (action === 'project-budget-category-edit') {
                if (typeof window === 'undefined' || typeof window.prompt !== 'function') return;
                const projectId = trigger.getAttribute('data-project-id');
                const categoryId = trigger.getAttribute('data-category-id');
                const runtime = state();
                const project = resolveActiveSocialProject(runtime, projectId);
                const category = (Array.isArray(project?.budgetCategories) ? project.budgetCategories : []).find((entry) => text(entry?.id) === text(categoryId)) || null;
                const nextTitle = text(window.prompt('Category title', text(category?.title || '')) || '');
                if (!nextTitle) return;
                const nextPlanned = Number(window.prompt('Planned amount (numbers only)', String(category?.plannedAmount || 0)) || 0);
                return withBusy(() => updatePortalSocialProjectBudgetCategory(projectId, categoryId, { title: nextTitle, plannedAmount: isNaN(nextPlanned) ? 0 : nextPlanned }));
            }
            if (action === 'project-budget-category-delete') {
                if (typeof window !== 'undefined' && typeof window.confirm === 'function' && !window.confirm('Remove this budget category? Expenses keep their records but become uncategorized.')) return;
                return withBusy(() => deletePortalSocialProjectBudgetCategory(
                    trigger.getAttribute('data-project-id'),
                    trigger.getAttribute('data-category-id')
                ));
            }
            if (action === 'project-budget-expense-status') {
                return withBusy(() => updatePortalSocialProjectBudgetExpense(
                    trigger.getAttribute('data-project-id'),
                    trigger.getAttribute('data-expense-id'),
                    { status: text(trigger.getAttribute('data-status') || 'draft') }
                ));
            }
            if (action === 'project-budget-expense-delete') {
                if (typeof window !== 'undefined' && typeof window.confirm === 'function' && !window.confirm('Remove this expense?')) return;
                return withBusy(() => deletePortalSocialProjectBudgetExpense(
                    trigger.getAttribute('data-project-id'),
                    trigger.getAttribute('data-expense-id')
                ));
            }
            if (action === 'project-showcase-publish') {
                return withBusy(() => publishPortalSocialProjectShowcase(trigger.getAttribute('data-project-id')));
            }
            if (action === 'project-leave-open') {
                return openDialog('project-leave', { projectId: text(trigger.getAttribute('data-project-id')) });
            }
            if (action === 'project-team-invite-toggle') {
                const details = trigger.closest('.social-project-team-layout')?.querySelector('.social-project-team-invite');
                if (details) {
                    details.open = !details.open;
                    if (details.open) details.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
                return;
            }
            return false;
        }

        const __submitApi = typeof window.__kiuCreateSocialWorkspaceEventsSubmitApi === 'function'
            ? window.__kiuCreateSocialWorkspaceEventsSubmitApi(deps)
            : null;
        if (!__submitApi) throw new Error('social-workspace-events-submit-runtime missing');
        const handleSocialWorkspaceSubmit = __submitApi.handleSocialWorkspaceSubmit;

        const __inputApi = typeof window.__kiuCreateSocialWorkspaceEventsInputApi === 'function'
            ? window.__kiuCreateSocialWorkspaceEventsInputApi(deps)
            : null;
        if (!__inputApi) throw new Error('social-workspace-events-input-runtime missing');
        const handleSocialWorkspaceInput = __inputApi.handleSocialWorkspaceInput;
        const handleSocialWorkspaceChange = __inputApi.handleSocialWorkspaceChange;


        return {
            handleSocialWorkspaceClick,
            handleSocialWorkspaceSubmit,
            handleSocialWorkspaceInput,
            handleSocialWorkspaceChange
        };
    }

    window.createKiuSocialWorkspaceEventsApi = createKiuSocialWorkspaceEventsApi;
})();
