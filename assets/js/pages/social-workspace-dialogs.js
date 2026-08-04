/* Social workspace dialog markup (task detail / risk / health).
 * Lazy: loaded by ensureSocialWorkspaceModule before social-workspace.js.
 * Workspace installs via createKiuSocialWorkspaceDialogsApi(deps).
 */
(function initSocialWorkspaceDialogs() {
    'use strict';
    if (window.__KIU_SOCIAL_WORKSPACE_DIALOGS_LOADED) return;
    window.__KIU_SOCIAL_WORKSPACE_DIALOGS_LOADED = true;

    function createKiuSocialWorkspaceDialogsApi(deps) {
        if (!deps || typeof deps !== 'object') throw new Error('workspace dialogs deps required');
        const {
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
            when
        } = deps;

        // Pure risk helpers from social-workspace-risk-model.js (loaded first)
        const __risk = __riskModel || window.KiuSocialWorkspaceRiskModel || {};
        const projectRiskOptionLabel = window.projectRiskOptionLabel || __risk.projectRiskOptionLabel;
        const projectRiskScaleRank = window.projectRiskScaleRank || __risk.projectRiskScaleRank;
        const projectRiskScaleOptionLabel = window.projectRiskScaleOptionLabel || __risk.projectRiskScaleOptionLabel;
        const formatProjectRiskScore = window.formatProjectRiskScore || __risk.formatProjectRiskScore;
        const projectRiskExposureScore = window.projectRiskExposureScore || __risk.projectRiskExposureScore;
        const projectRiskExposureTiers = window.projectRiskExposureTiers || __risk.projectRiskExposureTiers;
        const projectRiskIsActiveStatus = window.projectRiskIsActiveStatus || __risk.projectRiskIsActiveStatus;
        const sortProjectRisksForRegister = window.sortProjectRisksForRegister || __risk.sortProjectRisksForRegister;
        const projectRiskRegisterSummary = window.projectRiskRegisterSummary || __risk.projectRiskRegisterSummary;
        const projectRiskLinkedTaskIdList = window.projectRiskLinkedTaskIdList || __risk.projectRiskLinkedTaskIdList;
        const projectRiskLinksTask = window.projectRiskLinksTask || __risk.projectRiskLinksTask;
        const buildProjectRiskCountByTaskId = window.buildProjectRiskCountByTaskId || __risk.buildProjectRiskCountByTaskId;
        const renderProjectRiskScaleOptions = window.renderProjectRiskScaleOptions || __risk.renderProjectRiskScaleOptions;

        const PROJECT_PLAN_HORIZONS = Array.isArray(deps.PROJECT_PLAN_HORIZONS) && deps.PROJECT_PLAN_HORIZONS.length
            ? deps.PROJECT_PLAN_HORIZONS
            : [
                { id: 'days', label: 'Days' },
                { id: 'weeks', label: 'Weeks' },
                { id: 'months', label: 'Months' },
                { id: 'all', label: 'All' }
            ];

        function renderProjectTaskDetailModal(runtime, project, taskId, options = {}) {
            if (!project || !text(taskId)) return '';
            const editTask = (Array.isArray(project.tasks) ? project.tasks : []).find((task) => text(task?.id) === text(taskId)) || null;
            if (!editTask) return '';
            const projectTasks = Array.isArray(project.tasks) ? project.tasks : [];
            const taskById = new Map(projectTasks.map((entry) => [text(entry?.id), entry]));
            const statusId = text(editTask.status || 'todo') || 'todo';
            const statusLabel = PROJECT_TASK_COLUMNS.find((column) => column.id === statusId)?.label || 'Backlog';
            const canEdit = Boolean(project.viewerCanContribute);
            const assignee = accountById(editTask?.assigneeUserId) || { id: editTask?.assigneeUserId };
            const startAt = text(editTask?.startAt || '');
            const dueAt = text(editTask?.dueAt || '');
            const dueMs = Number.isFinite(Date.parse(dueAt)) ? Date.parse(dueAt) : null;
            const now = Date.now();
            const isOverdue = Boolean(dueMs && dueMs < now && statusId !== 'done');
            const isToday = Boolean(dueMs && !isOverdue && new Date(dueMs).toDateString() === new Date(now).toDateString());
            const isSoon = Boolean(dueMs && !isOverdue && !isToday && dueMs < now + 7 * 86400000);
            const priority = text(editTask?.priority || 'medium').toLowerCase() || 'medium';
            const priorityInfo = resolveProjectTaskPriorityDisplay(editTask);
            const priorityShort = text(priorityInfo.label || priority) || 'Medium';
            const priorityDetail = text(priorityInfo.tooltip || '') || '';
            const budgetLabel = formatProjectTaskBudgetEstimate(editTask?.budgetEstimate, project?.budgetCurrency || 'USD');
            const description = text(editTask?.description || '').trim();
            const scheduleStartAt = text(project?.scheduleStartAt || '');
            const taskSched = computeProjectSchedule(project).byId?.[text(taskId)] || null;
            const isCritical = Boolean(taskSched?.isCritical) && statusId !== 'done';
            const readiness = resolveDeskTaskReadiness(editTask, taskById);
            const detailSchedule = resolveTaskScheduleEstimate(editTask);
            const timeUnit = detailSchedule.unit || 'h';
            const timeEst = !editTask?.isMilestone ? normalizeTaskTime(detailSchedule.estimate) : 0;
            const timeAct = !editTask?.isMilestone ? normalizeTaskTime(editTask?.actualTime) : 0;
            const costEst = Math.max(0, Number(editTask?.budgetEstimate) || 0);
            const costAct = Math.max(0, Number(editTask?.actualCost) || 0);
            const timeVariance = !editTask?.isMilestone
                ? formatTaskTimeVariance(detailSchedule.estimate, editTask?.actualTime, timeUnit, taskHasPert(editTask))
                : null;
            const costVariance = formatTaskCostVariance(editTask?.budgetEstimate, editTask?.actualCost, project?.budgetCurrency || 'USD');
            const dueClass = isOverdue ? 'is-overdue' : isToday ? 'is-today' : isSoon ? 'is-soon' : '';
            const ownerHtml = editTask?.assigneeUserId
                ? `${avatar(assignee, 'social-neo-avatar-xs')}<span>${escape(displayName(assignee))}</span>`
                : '<span class="spt-detail-muted">Unassigned</span>';

            // Package names
            let packageLabel = '';
            try {
                const groups = getProjectTaskGraphGroups(runtime, text(project.id));
                const names = [];
                groups.forEach((group) => {
                    const members = (Array.isArray(group?.memberTaskIds) ? group.memberTaskIds : []).map((id) => text(id));
                    if (members.includes(text(taskId))) {
                        const gname = text(group?.name || 'Work package');
                        if (gname && !names.includes(gname)) names.push(gname);
                    }
                });
                packageLabel = names.join(', ');
            } catch (e) {
                packageLabel = '';
            }

            // Dependencies (tasks or packages)
            const parentIds = projectTaskDependsOnIds(editTask);
            const detailGroups = getProjectTaskGraphGroups(runtime, text(project.id));
            const parentTasks = parentIds.map((id) => {
                if (isProjectTaskGraphGroupId(id)) {
                    const g = detailGroups.find((entry) => text(entry?.id) === id);
                    return g ? { id, title: text(g.name || 'Package'), isGroup: true } : null;
                }
                return taskById.get(id) || null;
            }).filter(Boolean);
            const missingParentIds = parentIds.filter((id) => {
                if (isProjectTaskGraphGroupId(id)) return !detailGroups.some((g) => text(g?.id) === id);
                return !taskById.has(id);
            });
            const childIds = projectTaskDownstreamIds(taskId, projectTasks);
            const childTasks = childIds.map((id) => taskById.get(id)).filter(Boolean);

            // PERT three-point estimate
            const oVal = normalizeTaskTime(editTask?.timeOptimistic);
            const mVal = normalizeTaskTime(editTask?.timeMostLikely) || normalizeTaskTime(editTask?.timeEstimate);
            const pVal = normalizeTaskTime(editTask?.timePessimistic);
            const hasPertPoints = oVal > 0 || mVal > 0 || pVal > 0;
            const oLabel = oVal > 0 ? (formatTaskTime(oVal, timeUnit) || '—') : '—';
            const mLabel = mVal > 0 ? (formatTaskTime(mVal, timeUnit) || '—') : '—';
            const pLabel = pVal > 0 ? (formatTaskTime(pVal, timeUnit) || '—') : '—';
            const isPertEstimate = taskHasPert(editTask);

            // Readiness chip
            let readinessChip = '';
            if (statusId !== 'done') {
                if (isCritical) readinessChip = '<span class="spt-detail-chip home-hover-chip spt-detail-chip--crit">Critical</span>';
                else if (readiness.kind === 'waiting') readinessChip = '<span class="spt-detail-chip home-hover-chip spt-detail-chip--wait">Waiting</span>';
                else if (readiness.kind === 'ready') readinessChip = '<span class="spt-detail-chip home-hover-chip spt-detail-chip--ready">Ready</span>';
            }

            const headerMeta = [
                dueAt ? `Due ${when(dueAt)}` : '',
                budgetLabel || '',
                editTask?.isMilestone ? 'Milestone' : '',
                packageLabel ? packageLabel : ''
            ].filter(Boolean).join(' · ');

            const detailSchedDisp = taskSched
                ? formatTaskScheduleDisplay(taskSched, {
                    scheduleStartAt,
                    needEstimate: statusId !== 'done' && !editTask?.isMilestone,
                    isMilestone: Boolean(editTask?.isMilestone)
                })
                : null;
            const scheduleBlock = taskSched ? `
                        <section class="spt-detail-section lux-studio-section">
                            <h3 class="spt-detail-section-title">This task</h3>
                            <div class="spt-detail-schedule spt-detail-schedule--full">
                                <div class="spt-detail-schedule-cell">
                                    <span class="spt-detail-k">Duration</span>
                                    <strong>${escape(detailSchedDisp.durationLabel)}</strong>
                                    <em class="spt-detail-schedule-sub">${isPertEstimate ? 'PERT expected for this task' : 'Estimate for this task'}</em>
                                </div>
                                <div class="spt-detail-schedule-cell">
                                    <span class="spt-detail-k">On critical path?</span>
                                    <strong class="${detailSchedDisp.isCritical ? 'is-critical' : ''}">${escape(detailSchedDisp.pathLabel)}</strong>
                                    <em class="spt-detail-schedule-sub">${detailSchedDisp.isCritical ? 'Delay here delays project finish' : 'Not on the critical path'}</em>
                                </div>
                            </div>
                            ${detailSchedDisp.noEstimate
                                ? '<p class="spt-detail-schedule-hint social-neo-muted">No duration — set estimate or PERT (O/M/P) so schedule can place this task.</p>'
                                : `
                            <h3 class="spt-detail-section-title spt-detail-section-title--sub">Project schedule (CPM)</h3>
                            <p class="spt-detail-schedule-hint social-neo-muted">Relative to the <strong>whole map</strong> — not how long this task takes.</p>
                            <div class="spt-detail-schedule spt-detail-schedule--full">
                                <div class="spt-detail-schedule-cell">
                                    <span class="spt-detail-k" title="${escape(PROJECT_SCHEDULE_FLOAT_TITLE)}">Float vs project end</span>
                                    <strong class="${detailSchedDisp.isCritical ? 'is-critical' : ''}" title="${escape(PROJECT_SCHEDULE_FLOAT_TITLE)}">${escape(detailSchedDisp.floatLabel)}</strong>
                                    <em class="spt-detail-schedule-sub">How late this can start without delaying finish</em>
                                </div>
                                <div class="spt-detail-schedule-cell">
                                    <span class="spt-detail-k">Earliest start (ES)</span>
                                    <strong>${escape(detailSchedDisp.esLabel)}</strong>
                                    <em class="spt-detail-schedule-sub">Forward pass · ${escape(detailSchedDisp.esHoursLabel)} from project start</em>
                                </div>
                                <div class="spt-detail-schedule-cell">
                                    <span class="spt-detail-k">Earliest finish (EF)</span>
                                    <strong>${escape(detailSchedDisp.efLabel)}</strong>
                                    <em class="spt-detail-schedule-sub">ES + this task’s duration · ${escape(detailSchedDisp.efHoursLabel)}</em>
                                </div>
                                <div class="spt-detail-schedule-cell">
                                    <span class="spt-detail-k">Latest start (LS)</span>
                                    <strong>${escape(detailSchedDisp.lsLabel)}</strong>
                                    <em class="spt-detail-schedule-sub">Backward pass · ${escape(detailSchedDisp.lsHoursLabel)}</em>
                                </div>
                                <div class="spt-detail-schedule-cell">
                                    <span class="spt-detail-k">Latest finish (LF)</span>
                                    <strong>${escape(detailSchedDisp.lfLabel)}</strong>
                                    <em class="spt-detail-schedule-sub">LS + duration · ${escape(detailSchedDisp.lfHoursLabel)}</em>
                                </div>
                            </div>
                            <p class="spt-detail-schedule-hint social-neo-muted">Float = LS − ES${detailSchedDisp.hasProjectStart ? '' : ' · set project schedule start for calendar dates'}</p>`}
                        </section>` : '';

            const timeEstLabel = formatTaskTime(timeEst, timeUnit) || `0${timeUnit}`;
            const timeActLabel = formatTaskTime(timeAct, timeUnit) || `0${timeUnit}`;
            const timeDelta = Math.round((timeAct - timeEst) * 10) / 10;
            const timeAbs = formatTaskTime(Math.abs(timeDelta), timeUnit) || '0h';
            let timeVarianceLabel = 'No estimate yet';
            if (timeEst > 0 || timeAct > 0) {
                if (timeEst <= 0) timeVarianceLabel = 'No estimate to compare';
                else if (timeDelta === 0) timeVarianceLabel = 'On plan';
                else if (timeDelta < 0) timeVarianceLabel = `${timeAbs} under estimate`;
                else timeVarianceLabel = `${timeAbs} over estimate`;
            }
            const costEstLabel = formatProjectTaskBudgetEstimate(costEst, project?.budgetCurrency || 'USD') || '—';
            const costActLabel = formatProjectTaskBudgetEstimate(costAct, project?.budgetCurrency || 'USD')
                || formatProjectTaskBudgetEstimate(0, project?.budgetCurrency || 'USD')
                || '0 USD';
            const costDelta = Math.round((costAct - costEst) * 100) / 100;
            const costAbs = formatProjectTaskBudgetEstimate(Math.abs(costDelta), project?.budgetCurrency || 'USD') || String(Math.abs(costDelta));
            let costVarianceLabel = 'No budget set';
            if (costEst > 0 || costAct > 0) {
                if (costEst <= 0) costVarianceLabel = 'No budget to compare';
                else if (costDelta === 0) costVarianceLabel = 'On plan';
                else if (costDelta < 0) costVarianceLabel = `${costAbs} under budget`;
                else costVarianceLabel = `${costAbs} over budget`;
            }
            const costRemaining = costEst > 0
                ? (costDelta < 0
                    ? `${formatProjectTaskBudgetEstimate(costEst - costAct, project?.budgetCurrency || 'USD') || ''} remaining`
                    : (costDelta > 0
                        ? `${costAbs} overspend`
                        : 'Budget fully used'))
                : '';

            const renderDepChip = (task) => {
                const tid = text(task?.id);
                if (task?.isGroup || isProjectTaskGraphGroupId(tid)) {
                    return `<span class="spt-detail-dep-chip home-hover-chip is-package" title="Package dependency">
                        <em data-status="todo">Package</em>
                        <span>${escape(text(task?.title || 'Package'))}</span>
                    </span>`;
                }
                const st = normalizeProjectTaskStatusId(task?.status);
                const label = text(task?.title || 'Task');
                return `<button type="button" class="spt-detail-dep-chip home-hover-chip lux-control-btn" data-action="project-task-detail-open" data-project-id="${escape(text(project.id))}" data-task-id="${escape(tid)}">
                    <em data-status="${escape(st)}">${escape(({ todo: 'To do', 'in-progress': 'Active', blocked: 'Blocked', done: 'Done' })[st] || st)}</em>
                    <span>${escape(label)}</span>
                </button>`;
            };

            const depsBlock = `
                        <section class="spt-detail-section lux-studio-section">
                            <h3 class="spt-detail-section-title">Dependencies</h3>
                            <div class="spt-detail-deps">
                                <div class="spt-detail-deps-col lux-studio-section">
                                    <span class="spt-detail-k">Blocked by</span>
                                    ${parentTasks.length || missingParentIds.length
                                        ? `<div class="spt-detail-dep-list">${parentTasks.map(renderDepChip).join('')}${missingParentIds.map((id) => `<span class="spt-detail-dep-chip home-hover-chip is-missing"><em>Missing</em><span>${escape(id)}</span></span>`).join('')}</div>`
                                        : '<span class="spt-detail-muted">No parents — root task</span>'}
                                </div>
                                <div class="spt-detail-deps-col lux-studio-section">
                                    <span class="spt-detail-k">Blocks</span>
                                    ${childTasks.length
                                        ? `<div class="spt-detail-dep-list">${childTasks.map(renderDepChip).join('')}</div>`
                                        : '<span class="spt-detail-muted">No children</span>'}
                                </div>
                            </div>
                        </section>`;

            const pageSurface = options.pageSurface === true;
            const surfaceOpen = pageSurface
                ? '<section class="social-page-surface social-project-task-detail-page" data-social-page-surface="project-task-detail" data-action="noop" aria-label="Task detail">'
                : `<div class="${['lux-glass-dialog-backdrop', projectTaskGraphStackedBackdropClass(runtime, 'project-task-detail')].filter(Boolean).join(' ')}" data-action="dialog-close" role="dialog" aria-modal="true" aria-label="Task detail"><div class="lux-glass-dialog-card lux-glass-dialog-card--form lux-glass-dialog-card--project-task-detail lux-glass-dialog-card lux-glass-dialog-card--social-glass lux-studio-panel spt-detail-dialog" data-action="noop" data-lux-transparency-exempt="1">`;
            const surfaceClose = pageSurface ? '</section>' : '</div></div>';
            return `${surfaceOpen}
                    <div class="${pageSurface ? 'social-page-surface-head' : 'lux-glass-dialog-section-head lux-glass-dialog-head lux-studio-head'} spt-detail-head">
                        <div class="${pageSurface ? 'social-page-surface-heading' : 'lux-glass-dialog-heading'} spt-detail-heading">
                            <strong class="${pageSurface ? 'social-page-surface-title' : 'lux-glass-dialog-title'} spt-detail-title">${escape(text(editTask.title || 'Task'))}</strong>
                            <div class="spt-detail-head-chips" aria-label="Status and priority">
                                <span class="spt-detail-chip home-hover-chip spt-detail-chip--status" data-status="${escape(statusId)}">${escape(statusLabel)}</span>
                                <span class="spt-detail-chip home-hover-chip spt-detail-chip--pri" data-priority="${escape(priorityInfo.bucket || priority)}">${escape(priorityShort)}</span>
                                ${editTask?.isMilestone ? '<span class="spt-detail-chip home-hover-chip spt-detail-chip--mile">Milestone</span>' : ''}
                                ${readinessChip}
                            </div>
                            ${headerMeta ? `<span class="${pageSurface ? 'social-page-surface-subtitle' : 'lux-glass-dialog-subtitle'} spt-detail-subtitle">${escape(headerMeta)}</span>` : ''}
                        </div>
                        <div class="spt-detail-head-actions">
                            <button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="project-task-graph-open" data-project-id="${escape(text(project.id))}" data-task-id="${escape(text(taskId))}" title="Open on map"><i class="fas fa-diagram-project" aria-hidden="true"></i> Map</button>
                            <button class="lux-ghost-btn${pageSurface ? '' : ' lux-glass-dialog-close-btn'}" type="button" data-action="dialog-close" aria-label="${pageSurface ? 'Back to task map' : 'Close'}"><i class="fas ${pageSurface ? 'fa-arrow-left' : 'fa-times'}"></i>${pageSurface ? ' Back to map' : ''}</button>
                        </div>
                    </div>
                    <div class="${pageSurface ? 'social-page-surface-body' : 'lux-glass-dialog-body lux-glass-dialog-body--project-task-detail lux-studio-body'} spt-detail-body">
                        <section class="spt-detail-section lux-studio-section">
                            <h3 class="spt-detail-section-title">Description</h3>
                            <div class="social-project-task-detail-description spt-detail-description${description ? '' : ' is-empty'}">${description ? escape(description) : 'No description added yet.'}</div>
                        </section>
                        <section class="spt-detail-section lux-studio-section">
                            <h3 class="spt-detail-section-title">Properties</h3>
                            <div class="spt-detail-props spt-detail-props--6">
                                <div class="spt-detail-prop">
                                    <span class="spt-detail-k">Owner</span>
                                    <div class="spt-detail-v spt-detail-v--owner">${ownerHtml}</div>
                                </div>
                                <div class="spt-detail-prop">
                                    <span class="spt-detail-k">Status</span>
                                    <div class="spt-detail-v"><strong data-status="${escape(statusId)}">${escape(statusLabel)}</strong></div>
                                </div>
                                <div class="spt-detail-prop">
                                    <span class="spt-detail-k">Priority</span>
                                    <div class="spt-detail-v">
                                        <strong data-priority="${escape(priorityInfo.bucket || priority)}">${escape(priorityShort)}</strong>
                                        ${priorityDetail ? `<span class="spt-detail-sub">${escape(priorityDetail)}</span>` : ''}
                                    </div>
                                </div>
                                <div class="spt-detail-prop">
                                    <span class="spt-detail-k">Start</span>
                                    <div class="spt-detail-v">${startAt ? `<strong>${escape(when(startAt))}</strong>` : '<span class="spt-detail-muted">—</span>'}</div>
                                </div>
                                <div class="spt-detail-prop">
                                    <span class="spt-detail-k">Due</span>
                                    <div class="spt-detail-v">${dueAt ? `<strong class="spt-detail-due ${dueClass}">${escape(when(dueAt))}</strong>` : '<span class="spt-detail-muted">—</span>'}</div>
                                </div>
                                <div class="spt-detail-prop">
                                    <span class="spt-detail-k">Budget</span>
                                    <div class="spt-detail-v">
                                        ${budgetLabel ? `<strong>${escape(budgetLabel)}</strong>` : '<span class="spt-detail-muted">—</span>'}
                                        ${packageLabel ? `<span class="spt-detail-sub">${escape(packageLabel)}</span>` : ''}
                                    </div>
                                </div>
                            </div>
                        </section>
                        <section class="spt-detail-section lux-studio-section">
                            <h3 class="spt-detail-section-title">Plan vs actual</h3>
                            <p class="spt-detail-section-hint">Estimate vs what was recorded. Variance is actual minus plan.</p>
                            <div class="spt-detail-compare-grid">
                                <div class="spt-detail-compare lux-studio-section ${timeVariance ? `is-tone-${escape(timeVariance.tone)}` : ''}">
                                    <span class="spt-detail-compare-label"><i class="fas fa-stopwatch" aria-hidden="true"></i> Time</span>
                                    <div class="spt-detail-compare-rows">
                                        <div><span>${isPertEstimate ? 'Estimated (PERT)' : 'Estimated'}</span><strong>${escape(timeEstLabel)}</strong></div>
                                        <div><span>Actual spent</span><strong>${escape(timeActLabel)}</strong></div>
                                        <div class="spt-detail-compare-delta"><span>Variance</span><strong>${escape(timeVarianceLabel)}</strong></div>
                                    </div>
                                    ${hasPertPoints ? `
                                        <div class="spt-detail-pert-grid" aria-label="Three-point PERT estimate">
                                            <div><span class="spt-detail-k">Optimistic</span><strong>${escape(oLabel)}</strong></div>
                                            <div><span class="spt-detail-k">Most likely</span><strong>${escape(mLabel)}</strong></div>
                                            <div><span class="spt-detail-k">Pessimistic</span><strong>${escape(pLabel)}</strong></div>
                                        </div>
                                    ` : ''}
                                </div>
                                <div class="spt-detail-compare lux-studio-section ${costVariance ? `is-tone-${escape(costVariance.tone)}` : ''}">
                                    <span class="spt-detail-compare-label"><i class="fas fa-receipt" aria-hidden="true"></i> Cost</span>
                                    <div class="spt-detail-compare-rows">
                                        <div><span>Planned budget</span><strong>${escape(costEstLabel)}</strong></div>
                                        <div><span>Actual cost</span><strong>${escape(costActLabel)}</strong></div>
                                        <div class="spt-detail-compare-delta"><span>Variance</span><strong>${escape(costVarianceLabel)}</strong></div>
                                        ${costRemaining ? `<div><span>Budget left</span><strong>${escape(costRemaining)}</strong></div>` : ''}
                                    </div>
                                </div>
                            </div>
                        </section>
                        ${scheduleBlock}
                        ${depsBlock}
                    </div>
                    <div class="${pageSurface ? 'social-page-surface-footer' : 'lux-glass-dialog-form-actions lux-glass-dialog-actions'} spt-detail-actions">
                        ${canEdit ? `<button class="lux-primary-btn lux-btn-danger lux-secondary-btn" type="button" data-action="project-task-delete-open" data-project-id="${escape(text(project.id))}" data-task-id="${escape(text(taskId))}"><i class="fas fa-trash"></i> Remove</button>` : '<span></span>'}
                        <div class="spt-detail-actions-end">
                            <button class="lux-secondary-btn${pageSurface ? '' : ' lux-glass-dialog-cancel-btn'}" type="button" data-action="dialog-close">${pageSurface ? 'Back to map' : 'Close'}</button>
                            ${canEdit ? `<button class="lux-primary-btn lux-glass-dialog-submit-btn" type="button" data-action="project-task-edit-open" data-project-id="${escape(text(project.id))}" data-task-id="${escape(text(taskId))}"><i class="fas fa-pen"></i> Edit task</button>` : ''}
                        </div>
                    </div>
                ${pageSurface ? '' : '</div>'}
            ${surfaceClose}`;
        }

        function renderProjectRiskDialog(runtime, dialog) {
            const project = resolveActiveSocialProject(runtime, dialog?.projectId);
            if (!project) return '';
            const canEdit = Boolean(project.viewerCanContribute);
            const projectId = text(project.id);
            const groups = getProjectTaskGraphGroups(runtime, projectId);
            const allRisks = Array.isArray(project.risks) ? project.risks : [];
            const tasks = Array.isArray(project.tasks) ? project.tasks : [];
            const selectedTaskId = text(runtime.ui?.projectRiskTaskId ?? dialog?.taskId ?? '');
            const selectedGroupId = selectedTaskId
                ? ''
                : text(runtime.ui?.projectRiskGroupId ?? dialog?.groupId ?? '');
            const editRiskId = text(runtime.ui?.projectRiskEditId || '');
            const composeOpen = Boolean(runtime.ui?.projectRiskComposeOpen) || Boolean(editRiskId);
            const filteredRisks = sortProjectRisksForRegister(
                selectedTaskId
                    ? allRisks.filter((risk) => projectRiskLinksTask(risk, selectedTaskId))
                    : allRisks.filter((risk) => text(risk?.groupId || '') === selectedGroupId)
            );
            const countForGroup = (groupId) => allRisks.filter((risk) => text(risk?.groupId || '') === text(groupId || '')).length;
            const openCountForGroup = (groupId) => allRisks.filter((risk) => (
                text(risk?.groupId || '') === text(groupId || '') && projectRiskIsActiveStatus(risk?.status)
            )).length;
            const riskCountByTaskId = buildProjectRiskCountByTaskId(allRisks);
            const countRisksUnderGroup = (group) => {
                const gid = text(group?.id);
                let total = countForGroup(gid);
                (Array.isArray(group?.memberTaskIds) ? group.memberTaskIds : []).forEach((id) => {
                    total += riskCountByTaskId[text(id)] || 0;
                });
                return total;
            };
            const groupedTaskIdSet = new Set();
            groups.forEach((group) => {
                (Array.isArray(group?.memberTaskIds) ? group.memberTaskIds : []).forEach((id) => {
                    const tid = text(id);
                    if (tid) groupedTaskIdSet.add(tid);
                });
            });
            const ungroupedTasks = tasks.filter((task) => !groupedTaskIdSet.has(text(task?.id)));
            // Honor user expand/collapse only — do not force-open selected packages every render.
            const expandedGroupIds = new Set(
                (Array.isArray(runtime.ui?.projectRiskExpandedGroupIds) ? runtime.ui.projectRiskExpandedGroupIds : [])
                    .map((id) => text(id))
                    .filter(Boolean)
            );
            const editingRisk = editRiskId ? allRisks.find((risk) => text(risk?.id) === editRiskId) || null : null;
            const formRisk = editingRisk || null;
            const selectedTask = selectedTaskId
                ? (tasks.find((task) => text(task?.id) === selectedTaskId) || null)
                : null;
            const parentGroupForTask = selectedTaskId
                ? (groups.find((group) => (
                    Array.isArray(group?.memberTaskIds) ? group.memberTaskIds : []
                ).map((id) => text(id)).includes(selectedTaskId)) || null)
                : null;
            const sectionLabel = selectedTaskId
                ? text(selectedTask?.title || 'Task')
                : (selectedGroupId
                    ? text(groups.find((group) => text(group?.id) === selectedGroupId)?.name || 'Group')
                    : 'Project-wide');
            const scopeKind = selectedTaskId ? 'task' : (selectedGroupId ? 'group' : 'project');
            const scopeBreadcrumb = selectedTaskId && parentGroupForTask
                ? `${text(parentGroupForTask.name || 'Group')} › ${sectionLabel}`
                : (scopeKind === 'task' ? `Task · ${sectionLabel}` : sectionLabel);
            const summary = projectRiskRegisterSummary(filteredRisks);
            const memberSummaries = Array.isArray(project.memberSummaries) ? project.memberSummaries : [];
            const descId = controlId('project-risk-desc');
            const mitigationId = controlId('project-risk-mitigation');
            const ownerId = controlId('project-risk-owner');
            const likelihoodId = controlId('project-risk-likelihood');
            const impactId = controlId('project-risk-impact');
            const statusId = controlId('project-risk-status');
            const responseId = controlId('project-risk-response');
            const defaultRiskTitle = scopeKind === 'task'
                ? (text(selectedTask?.title || sectionLabel) || 'Task risk')
                : (scopeKind === 'group'
                    ? `${sectionLabel} risk`
                    : 'Project risk');
            const formLikelihood = projectRiskScaleRank(formRisk?.likelihood ?? 3);
            const formImpact = projectRiskScaleRank(formRisk?.impact ?? 3);
            const formExposureScore = projectRiskExposureScore(formLikelihood, formImpact);
            const formExposureTier = projectRiskExposureTiers(formLikelihood, formImpact);
            const pageField = (label, controlHtml, id = '') => `
                                <label class="social-page-field"${id ? ` for="${escape(id)}"` : ''}>
                                    <span class="social-page-field-label">${escape(label)}</span>
                                    ${controlHtml}
                                </label>`;
            const pageActions = (options = {}) => {
                const cancelLabel = text(options.cancelLabel || 'Cancel');
                const submitLabel = text(options.submitLabel || 'Save');
                const cancel = options.hideCancel
                    ? ''
                    : `<button class="lux-secondary-btn" type="button" data-action="${escape(options.cancelAction || 'dialog-close')}">${escape(cancelLabel)}</button>`;
                const submitTone = options.submitTone === 'danger' ? 'lux-primary-btn lux-btn-danger' : 'lux-primary-btn';
                const submitIcon = options.submitIcon ? `<i class="${escape(options.submitIcon)}" aria-hidden="true"></i> ` : '';
                const submitBody = options.submitHtml != null ? options.submitHtml : `${submitIcon}${escape(submitLabel)}`;
                return `
                <div class="social-page-form-actions${options.actionsClass ? ` ${escape(options.actionsClass)}` : ''}">
                    ${cancel}
                    <button class="${submitTone}" type="${escape(options.submitType || 'submit')}" ${options.submitAttrs || ''}>${submitBody}</button>
                </div>`;
            };

            const renderTaskScopeRow = (task, { nested = false } = {}) => {
                const tid = text(task?.id);
                if (!tid) return '';
                const count = riskCountByTaskId[tid] || 0;
                const active = selectedTaskId === tid ? ' is-active' : '';
                const title = text(task?.title || 'Task');
                return `<div class="spr-task-row${nested ? ' is-nested' : ''}${active}">
                    <button type="button" class="spr-task-select lux-control-btn" data-action="project-risk-select-task" data-project-id="${escape(projectId)}" data-task-id="${escape(tid)}" title="View risks for this task">
                        <i class="fas fa-clipboard-check" aria-hidden="true"></i>
                        <span class="spr-task-label">${escape(title)}</span>
                        <span class="spr-section-count">${count}</span>
                    </button>
                    ${canEdit ? `<button type="button" class="spr-task-add lux-control-btn" data-action="project-risk-task-compose" data-project-id="${escape(projectId)}" data-task-id="${escape(tid)}" title="Add risk for this task" aria-label="Add risk for ${escape(title)}"><i class="fas fa-plus" aria-hidden="true"></i></button>` : ''}
                </div>`;
            };

            const projectWideActive = !selectedTaskId && !selectedGroupId ? ' is-active' : '';
            const projectWideTotal = countForGroup('');
            const projectWideOpen = openCountForGroup('');
            const projectWideButton = `<button type="button" class="spr-section lux-control-btn${projectWideActive}" data-action="project-risk-select-group" data-project-id="${escape(projectId)}" data-group-id="" title="${projectWideTotal} total · ${projectWideOpen} open">
                    <i class="fas fa-globe" aria-hidden="true"></i>
                    <span class="spr-section-label">Project-wide</span>
                    <span class="spr-section-count">${projectWideOpen > 0 ? projectWideOpen : projectWideTotal}</span>
                </button>`;

            // Always surface the active task even when its package is collapsed.
            const selectedTaskPin = selectedTaskId ? (() => {
                const count = riskCountByTaskId[selectedTaskId] || 0;
                return `<div class="spr-selected-pin" role="status">
                    <span class="spr-selected-pin-label">Selected task</span>
                    <button type="button" class="spr-task-select lux-control-btn is-active" data-action="project-risk-select-task" data-project-id="${escape(projectId)}" data-task-id="${escape(selectedTaskId)}">
                        <i class="fas fa-clipboard-check" aria-hidden="true"></i>
                        <span class="spr-task-label">${escape(sectionLabel)}</span>
                        <span class="spr-section-count">${count}</span>
                    </button>
                </div>`;
            })() : '';

            const workPackagesRail = groups.length ? `<div class="spr-rail-section">
                    <div class="spr-rail-section-label">Work packages</div>
                    ${groups.map((group) => {
                        const gid = text(group?.id);
                        if (!gid) return '';
                        const isExpanded = expandedGroupIds.has(gid);
                        const isActiveGroup = !selectedTaskId && selectedGroupId === gid;
                        const memberIds = (Array.isArray(group?.memberTaskIds) ? group.memberTaskIds : []).map((id) => text(id)).filter(Boolean);
                        const memberTasks = memberIds
                            .map((id) => tasks.find((task) => text(task?.id) === id) || null)
                            .filter(Boolean);
                        const groupOnly = countForGroup(gid);
                        const underPackage = countRisksUnderGroup(group);
                        const countLabel = underPackage;
                        return `<div class="spr-group${isExpanded ? ' is-expanded' : ''}${isActiveGroup ? ' is-active-group' : ''}" data-group-id="${escape(gid)}">
                            <div class="spr-group-head">
                                <button type="button" class="spr-group-toggle lux-control-btn" data-action="project-risk-toggle-group" data-project-id="${escape(projectId)}" data-group-id="${escape(gid)}" aria-expanded="${isExpanded ? 'true' : 'false'}" title="${isExpanded ? 'Collapse' : 'Expand'} tasks">
                                    <i class="fas fa-chevron-${isExpanded ? 'down' : 'right'}" aria-hidden="true"></i>
                                </button>
                                <button type="button" class="spr-group-select lux-control-btn${isActiveGroup ? ' is-active' : ''}" data-action="project-risk-select-group" data-project-id="${escape(projectId)}" data-group-id="${escape(gid)}" title="Group risks ${groupOnly} · with tasks ${underPackage}">
                                    <i class="fas fa-layer-group" aria-hidden="true"></i>
                                    <span class="spr-section-label">${escape(text(group?.name || 'Group'))}</span>
                                    <span class="spr-section-count">${countLabel}</span>
                                </button>
                            </div>
                            ${isExpanded ? `<div class="spr-group-tasks" role="group" aria-label="Tasks in ${escape(text(group?.name || 'group'))}">
                                ${memberTasks.length
                                    ? memberTasks.map((task) => renderTaskScopeRow(task, { nested: true })).join('')
                                    : '<div class="spr-group-empty">No tasks in this package yet.</div>'}
                            </div>` : ''}
                        </div>`;
                    }).join('')}
                </div>` : '';

            const tasksRail = `<div class="spr-rail-section">
                    <div class="spr-rail-section-label">Tasks</div>
                    ${ungroupedTasks.length
                        ? ungroupedTasks.map((task) => renderTaskScopeRow(task, { nested: false })).join('')
                        : (tasks.length
                            ? '<div class="spr-group-empty">All tasks are in work packages — expand a package above.</div>'
                            : '<div class="spr-group-empty">No tasks yet.</div>')}
                </div>`;

            const riskRow = (risk) => {
                const tier = projectRiskExposureTier(risk?.likelihood, risk?.impact);
                const score = projectRiskExposureScore(risk?.likelihood, risk?.impact);
                const rankL = projectRiskScaleRank(risk?.likelihood ?? 3);
                const rankI = projectRiskScaleRank(risk?.impact ?? 3);
                const owner = accountById(risk?.ownerUserId) || { id: risk?.ownerUserId };
                const ownerLabel = text(risk?.ownerUserId) ? displayName(owner) : 'Unassigned';
                return `<article class="spr-risk-card lux-studio-section lux-soft-chrome" data-exposure="${escape(tier)}">
                    <div class="spr-risk-card-head">
                        <div class="spr-risk-card-main">
                            <div class="spr-risk-title-row">
                                <span class="spr-chip spr-chip--${escape(tier)} spr-chip--tier spr-chip--score" title="${escape(formatProjectRiskScore(score, tier))}">${score}</span>
                                <strong class="spr-risk-title">${escape(text(risk?.title || 'Risk'))}</strong>
                            </div>
                            <div class="spr-risk-meta">
                                <span class="spr-chip">L${rankL} × I${rankI} · Score ${score}/25</span>
                                <span class="spr-chip">${escape(projectRiskOptionLabel(risk?.status || 'open'))}</span>
                                <span class="spr-chip">${escape(projectRiskOptionLabel(risk?.response || 'mitigate'))}</span>
                            </div>
                        </div>
                        ${canEdit ? `<div class="spr-risk-actions">
                            <button type="button" class="lux-secondary-btn lux-secondary-btn-xs" data-action="project-risk-edit" data-project-id="${escape(projectId)}" data-risk-id="${escape(text(risk?.id))}" aria-label="Edit risk"><i class="fas fa-pen"></i></button>
                            <button type="button" class="lux-secondary-btn lux-secondary-btn-xs" data-action="project-risk-delete" data-project-id="${escape(projectId)}" data-risk-id="${escape(text(risk?.id))}" aria-label="Delete risk"><i class="fas fa-trash"></i></button>
                        </div>` : ''}
                    </div>
                    ${text(risk?.description) ? `<p class="spr-risk-desc">${escape(text(risk.description))}</p>` : ''}
                    ${text(risk?.mitigation) ? `<p class="spr-risk-mitigation"><span>Mitigation</span> ${escape(text(risk.mitigation))}</p>` : ''}
                    <div class="spr-risk-foot">
                        <span><i class="fas fa-user" aria-hidden="true"></i> ${escape(ownerLabel)}</span>
                    </div>
                </article>`;
            };

            const composeFields = canEdit && composeOpen ? `
                            <form class="spr-compose lux-studio-section lux-soft-chrome" data-form="project-risk-save" data-project-id="${escape(projectId)}" data-group-id="${escape(selectedGroupId)}" data-task-id="${escape(selectedTaskId)}" data-risk-id="${escape(text(formRisk?.id || ''))}" data-default-title="${escape(defaultRiskTitle)}" data-existing-title="${escape(text(formRisk?.title || ''))}" data-action="noop" autocomplete="off">
                                <div class="social-page-section-head spr-compose-head">
                                    <strong>${formRisk ? 'Edit risk' : 'Add risk'}</strong>
                                    <span>Scope: ${escape(scopeBreadcrumb)} · ${formRisk ? 'Update this entry' : 'Record a new risk'}</span>
                                </div>
                                ${pageField('Description', `<textarea class="social-neo-textarea lux-control" id="${escape(descId)}" rows="3" name="projectRiskDescription" placeholder="What could happen and why it matters?" required autocomplete="off">${escape(text(formRisk?.description || ''))}</textarea>`, descId)}
                                <div class="social-neo-form-grid social-neo-form-grid-2">
                                    ${pageField('Likelihood', `<select class="social-neo-select lux-control" id="${escape(likelihoodId)}" name="projectRiskLikelihood" data-lux-picker>${renderProjectRiskScaleOptions('projectRiskLikelihood', formLikelihood, 'likelihood')}</select>`, likelihoodId)}
                                    ${pageField('Impact', `<select class="social-neo-select lux-control" id="${escape(impactId)}" name="projectRiskImpact" data-lux-picker>${renderProjectRiskScaleOptions('projectRiskImpact', formImpact, 'impact')}</select>`, impactId)}
                                </div>
                                <p class="spr-exposure-hint">Score = Likelihood × Impact (1–5 each, max 25). High ≥ 15 · Medium ≥ 5.</p>
                                <p class="spr-exposure-live" aria-live="polite">Risk score: <strong>${escape(formatProjectRiskScore(formExposureScore, formExposureTier))}</strong></p>
                                <div class="social-neo-form-grid social-neo-form-grid-2">
                                    ${pageField('Status', `
                                        <select class="social-neo-select lux-control" id="${escape(statusId)}" name="projectRiskStatus" data-lux-picker>
                                            ${PROJECT_RISK_STATUS_OPTIONS.map((option) => `<option value="${escape(option)}" ${text(formRisk?.status || 'open') === option ? 'selected' : ''}>${escape(projectRiskOptionLabel(option))}</option>`).join('')}
                                        </select>`, statusId)}
                                    ${pageField('Response', `
                                        <select class="social-neo-select lux-control" id="${escape(responseId)}" name="projectRiskResponse" data-lux-picker>
                                            ${PROJECT_RISK_RESPONSE_OPTIONS.map((option) => `<option value="${escape(option)}" ${text(formRisk?.response || 'mitigate') === option ? 'selected' : ''}>${escape(projectRiskOptionLabel(option))}</option>`).join('')}
                                        </select>`, responseId)}
                                </div>
                                ${pageField('Owner', `
                                    <select class="social-neo-select lux-control" id="${escape(ownerId)}" name="projectRiskOwnerUserId" data-lux-picker>
                                        <option value="">Unassigned</option>
                                        ${memberSummaries.map((entry) => {
                                            const userId = text(entry?.userId || '');
                                            const account = accountById(userId) || { id: userId };
                                            return `<option value="${escape(userId)}" ${text(formRisk?.ownerUserId || '') === userId ? 'selected' : ''}>${escape(displayName(account))}</option>`;
                                        }).join('')}
                                    </select>`, ownerId)}
                                ${pageField('Mitigation', `<textarea class="social-neo-textarea lux-control" id="${escape(mitigationId)}" rows="2" name="projectRiskMitigation" placeholder="Planned response or controls" autocomplete="off">${escape(text(formRisk?.mitigation || ''))}</textarea>`, mitigationId)}
                                ${pageActions({ actionsClass: 'spr-compose-actions', cancelAction: 'project-risk-compose-cancel', submitLabel: formRisk ? 'Save risk' : 'Add risk', submitIcon: 'fas fa-check' })}
                            </form>` : '';

            const listEmpty = filteredRisks.length
                ? filteredRisks.map(riskRow).join('')
                : `<div class="spr-empty">No risks in ${escape(sectionLabel)}.${canEdit ? ' Add one if needed.' : ''}</div>`;

            const footerActions = composeOpen
                ? ''
                : (canEdit
                    ? pageActions({ cancelLabel: 'Close', submitLabel: 'Add risk', submitIcon: 'fas fa-plus', submitType: 'button', submitAttrs: `data-action="project-risk-compose-open" data-project-id="${escape(projectId)}"` })
                    : pageActions({ hideCancel: true, submitLabel: 'Close', submitIcon: 'fas fa-check', submitType: 'button', submitAttrs: 'data-action="dialog-close"' }));

            return `<main class="social-page-surface social-project-risk-page" data-social-page-surface="project-risk" data-action="noop" aria-label="Risk register">
                <header class="social-page-surface-head social-project-risk-page-head lux-soft-chrome">
                        <div class="social-page-surface-heading">
                            <strong class="social-page-surface-title"><i class="fas fa-triangle-exclamation" aria-hidden="true"></i> Risk register</strong>
                            <span class="social-page-surface-subtitle">${escape(text(project.name || project.title || 'Project'))} · Scope: ${escape(scopeBreadcrumb)}</span>
                            <div class="spr-summary" aria-label="Risk summary">
                                <span class="spr-summary-chip">${summary.open} open</span>
                                <span class="spr-summary-chip${summary.high ? ' is-hot' : ''}">${summary.high} high exposure</span>
                                <span class="spr-summary-chip">${summary.unassigned} unassigned</span>
                            </div>
                        </div>
                        <button class="lux-ghost-btn" type="button" data-action="dialog-close" aria-label="Back to task map"><i class="fas fa-arrow-left"></i> Back to map</button>
                </header>
                    <div class="social-page-surface-body social-page-surface-body--project-risk">
                        <div class="spr-layout">
                            <aside class="spr-rail lux-studio-section lux-soft-chrome" aria-label="Risk scope">
                                <div class="spr-rail-head">
                                    <strong>Scope</strong>
                                    <span>Project, work packages, and tasks</span>
                                </div>
                                ${selectedTaskPin}
                                ${projectWideButton}
                                ${workPackagesRail}
                                ${tasksRail}
                            </aside>
                            <div class="spr-main lux-studio-section lux-soft-chrome">
                                <div class="spr-main-head">
                                    <div>
                                        <h3>${escape(sectionLabel)}</h3>
                                        <p>${filteredRisks.length ? `${filteredRisks.length} risk${filteredRisks.length === 1 ? '' : 's'} in this scope` : 'No risks in this scope'}</p>
                                    </div>
                                    ${canEdit && !composeOpen ? `<button type="button" class="lux-primary-btn lux-secondary-btn-sm" data-action="project-risk-compose-open" data-project-id="${escape(projectId)}"><i class="fas fa-plus"></i> Add risk</button>` : ''}
                                </div>
                                <div class="spr-risk-list">
                                    ${listEmpty}
                                </div>
                                ${!canEdit ? '<div class="spr-readonly-note">View only. Project contributors can add or edit risks.</div>' : ''}
                                ${composeFields}
                            </div>
                        </div>
                    </div>
                    ${footerActions}
            </main>`;
        }
        function renderProjectHealthPlanCardHtml(runtime, project) {
            const projectId = text(project?.id);
            if (!projectId) return '';
            const tasks = Array.isArray(project?.tasks) ? project.tasks : [];
            const taskById = new Map(tasks.map((t) => [text(t?.id), t]));
            const planWindow = normalizeProjectPlanHorizon(runtime.ui?.projectHealthPlanWindow || 'weeks');
            const planIds = readProjectWeekPlan(projectId, planWindow);
            const planHorizonLabel = projectPlanHorizonLabel(planWindow);
            const nowMs = Date.now();
            const planTasks = planIds.map((id) => ({ id, task: taskById.get(id) || null }));
            const listHtml = planTasks.length
                ? `<div class="sph-plan-list">${planTasks.map((entry) => {
                    const t = entry.task;
                    const tid = entry.id;
                    const st = t ? normalizeProjectTaskStatusId(t.status) : 'todo';
                    const stLab = PROJECT_TASK_COLUMNS.find((c) => c.id === st)?.label || st;
                    const due = t ? text(t.dueAt || '') : '';
                    const dueMs = due ? Date.parse(due) : NaN;
                    const isOver = Number.isFinite(dueMs) && dueMs < nowMs && st !== 'done';
                    const owner = t && text(t.assigneeUserId)
                        ? displayName(accountById(t.assigneeUserId) || { id: t.assigneeUserId })
                        : 'Unassigned';
                    const title = t ? text(t.title || 'Task') : 'Removed task';
                    return `<div class="sph-plan-row" data-status="${escape(st)}" data-missing="${t ? '0' : '1'}">
                        <button type="button" class="sph-plan-main" data-action="project-task-detail-open" data-project-id="${escape(projectId)}" data-task-id="${escape(tid)}" ${t ? '' : 'disabled'}>
                            <strong>${escape(title)}</strong>
                            <em>${escape(stLab)}${due ? ` · <span class="${isOver ? 'sph-bad' : ''}">${escape(when(due))}</span>` : ''} · ${escape(owner)}</em>
                        </button>
                        <button type="button" class="sph-plan-remove" data-action="project-health-plan-remove" data-project-id="${escape(projectId)}" data-task-id="${escape(tid)}" title="Remove from plan" aria-label="Remove from plan"><i class="fas fa-times" aria-hidden="true"></i></button>
                    </div>`;
                }).join('')}</div>`
                : `<p class="sph-empty">No tasks on your <b>${escape(planHorizonLabel)}</b> plan yet — use Add tasks… to choose carefully.</p>`;
            return `<section class="sph-card lux-card lux-soft-chrome sph-card--plan" aria-label="Manual plan">
                <div class="sph-card-head lux-card-head">
                    <h3 class="lux-studio-label">My plan</h3>
                    <span class="sph-auto">yours</span>
                    <span class="sph-plan-count">${planIds.length}</span>
                </div>
                <p class="sph-coach-lead">Choose days, weeks, months, or all — each is its own list. Add tasks carefully in the picker. Stored on this device per project.</p>
                <div class="sph-plan-tabs" role="tablist" aria-label="Plan horizon">
                    ${PROJECT_PLAN_HORIZONS.map((h) => `
                        <button type="button" class="lux-mode-btn sph-plan-tab${planWindow === h.id ? ' is-active' : ''}" data-action="project-health-plan-window" data-window="${escape(h.id)}" aria-selected="${planWindow === h.id ? 'true' : 'false'}">${escape(h.label)}</button>
                    `).join('')}
                </div>
                <div class="sph-plan-add">
                    <button type="button" class="lux-primary-btn lux-secondary-btn-sm" data-action="project-health-plan-pick-open" data-project-id="${escape(projectId)}" data-window="${escape(planWindow)}"><i class="fas fa-plus"></i> Add tasks…</button>
                    <span class="sph-plan-add-hint">Adding to <b>${escape(planHorizonLabel)}</b></span>
                </div>
                ${listHtml}
            </section>`;
        }
        function buildProjectHealthPlanPickModel(runtime, dialog) {
            const impl = (window.KiuSocialWorkspaceHealthModel || {}).buildProjectHealthPlanPickModel;
            if (typeof impl !== 'function') return null;
            return impl(runtime, dialog, {
                resolveActiveSocialProject,
                getProjectTaskGraphGroups,
                readProjectWeekPlan,
                resolveTaskPackageId,
                normalizeProjectPlanHorizon,
                projectPlanHorizonLabel,
                normalizeProjectTaskStatusId
            });
        }
        function renderProjectHealthPlanPickRailHtml(model) {
            if (!model) return '';
            const { packageRail, browseId } = model;
            return packageRail.map((pkg) => {
                const isAll = pkg.id === 'all';
                const active = browseId === pkg.id;
                const addPkg = !isAll && pkg.count > 0
                    ? `<button type="button" class="sph-pick-add-pkg lux-control-btn" data-action="project-health-plan-pick-add-package" data-package-id="${escape(pkg.id)}" title="Select all tasks in this package"><i class="fas fa-plus" aria-hidden="true"></i> Add package</button>`
                    : '';
                return `<div class="sph-pick-pkg${active ? ' is-active' : ''}" data-package-id="${escape(pkg.id)}">
                    <button type="button" class="sph-pick-pkg-main lux-control-btn" data-action="project-health-plan-pick-browse" data-package-id="${escape(pkg.id)}" aria-pressed="${active ? 'true' : 'false'}">
                        <span class="sph-pick-pkg-name">${escape(pkg.name)}</span>
                        <em class="sph-pick-pkg-count">${pkg.count}</em>
                    </button>
                    ${addPkg}
                </div>`;
            }).join('');
        }
        function renderProjectHealthPlanPickResultsHtml(model) {
            if (!model) return '<div class="sph-empty">No tasks match.</div>';
            const { visibleTasks, selectedSet, nowMs, browseId } = model;
            if (!visibleTasks.length) {
                return `<div class="sph-empty">${browseId === 'all' ? 'No open tasks to add.' : 'No tasks in this package match.'}</div>`;
            }
            return `<div class="sph-pick-rows">${visibleTasks.map((t) => {
                const tid = text(t.id);
                const st = normalizeProjectTaskStatusId(t?.status);
                const stLab = PROJECT_TASK_COLUMNS.find((c) => c.id === st)?.label || st;
                const due = text(t?.dueAt || '');
                const dueMs = due ? Date.parse(due) : NaN;
                const isOver = Number.isFinite(dueMs) && dueMs < nowMs && st !== 'done';
                const owner = text(t?.assigneeUserId)
                    ? displayName(accountById(t.assigneeUserId) || { id: t.assigneeUserId })
                    : 'Unassigned';
                const checked = selectedSet.has(tid);
                return `<button type="button" class="sph-pick-row lux-control-btn${checked ? ' is-selected' : ''}" data-action="project-health-plan-pick-toggle" data-task-id="${escape(tid)}" aria-pressed="${checked ? 'true' : 'false'}">
                    <span class="sph-pick-check" aria-hidden="true"><i class="fas ${checked ? 'fa-square-check' : 'fa-square'}"></i></span>
                    <span class="sph-pick-copy">
                        <strong>${escape(text(t?.title || 'Task'))}</strong>
                        <em>${escape(stLab)}${due ? ` · <span class="${isOver ? 'sph-bad' : ''}">${escape(when(due))}</span>` : ' · no due'} · ${escape(owner)}</em>
                    </span>
                </button>`;
            }).join('')}</div>`;
        }
        function renderProjectHealthPlanPickToolbarHtml(model) {
            if (!model) return '';
            const { visibleTasks, selectedCount, allVisibleSelected, visibleIds, browseId, packageRail } = model;
            const pkgName = packageRail.find((p) => p.id === browseId)?.name || 'Tasks';
            return `<div class="sph-pick-toolbar-left">
                    <strong class="sph-pick-pane-title">${escape(pkgName)}</strong>
                    <span class="sph-pick-meta">${visibleTasks.length} shown · ${selectedCount} selected</span>
                </div>
                <button type="button" class="lux-secondary-btn lux-secondary-btn-sm" data-action="project-health-plan-pick-toggle-all" data-mode="${allVisibleSelected ? 'clear' : 'all'}" ${visibleIds.length ? '' : 'disabled'}>
                    ${allVisibleSelected ? 'Clear visible' : 'Select all visible'}
                </button>`;
        }
        function renderProjectHealthPlanPickBodyHtml(model) {
            if (!model) return '';
            return `<div class="sph-pick-split lux-studio-section" data-lux-transparency-exempt="1">
                <aside class="sph-pick-rail" aria-label="Packages">
                    <div class="sph-pick-rail-head">Packages</div>
                    <div class="sph-pick-rail-list">${renderProjectHealthPlanPickRailHtml(model)}</div>
                </aside>
                <div class="sph-pick-main">
                    <div class="sph-pick-toolbar">${renderProjectHealthPlanPickToolbarHtml(model)}</div>
                    <div class="sph-pick-results" data-lux-transparency-exempt="1">${renderProjectHealthPlanPickResultsHtml(model)}</div>
                </div>
            </div>`;
        }

        /** Patch picker body only — keep search/focus mounted. */
        function renderProjectHealthPlanPickDialog(runtime, dialog) {
            const model = buildProjectHealthPlanPickModel(runtime, dialog);
            if (!model) return '';
            const {
                projectId,
                horizon,
                horizonLabel,
                searchRaw,
                openOnly,
                hidePlanned,
                selectedCount
            } = model;

            return `<section class="social-page-surface social-project-health-plan-page" data-social-page-surface="project-health-plan-pick" data-action="noop" aria-label="Add tasks to plan" data-project-id="${escape(projectId)}" data-horizon="${escape(horizon)}">
                    <header class="social-page-surface-head">
                        <div class="social-page-surface-heading">
                            <strong><i class="fas fa-list-check" aria-hidden="true"></i> Add to plan · ${escape(horizonLabel)}</strong>
                            <span>Pick a package or specific tasks, then add them to your plan.</span>
                        </div>
                        <button class="lux-ghost-btn" type="button" data-action="dialog-close" aria-label="Back to project health"><i class="fas fa-arrow-left"></i> Back</button>
                    </header>
                    <div class="social-page-surface-body social-page-surface-body--health-plan-pick">
                        <div class="sph-pick-filters lux-studio-section" data-lux-transparency-exempt="1">
                            <input class="social-neo-input social-neo-input-sm sph-pick-search" type="search" name="projectHealthPlanPickSearch" value="${escape(searchRaw)}" placeholder="Search tasks…" data-action="project-health-plan-pick-filter" data-filter="search" autocomplete="off">
                            <label class="sph-pick-checklab"><input type="checkbox" data-action="project-health-plan-pick-filter" data-filter="openOnly" ${openOnly ? 'checked' : ''}> Open only</label>
                            <label class="sph-pick-checklab"><input type="checkbox" data-action="project-health-plan-pick-filter" data-filter="hidePlanned" ${hidePlanned ? 'checked' : ''}> Hide already planned</label>
                        </div>
                        <div class="sph-pick-body">${renderProjectHealthPlanPickBodyHtml(model)}</div>
                    </div>
                    ${neoActions({
                        submitHtml: `<i class="fas fa-plus"></i> Add ${selectedCount || 0} to ${escape(horizonLabel)} plan`,
                        submitType: 'button',
                        submitAttrs: `data-action="project-health-plan-pick-apply" data-project-id="${escape(projectId)}" data-window="${escape(horizon)}" ${selectedCount ? '' : 'disabled'}`,
                        submitLabel: 'Add'
                    })}
            </section>`;
        }

        /** PMI-style 1–5 likelihood/impact (stored as 1–5; legacy low/medium/high → 1/3/5). */

        function renderProjectHealthDialog(runtime, dialog) {
            const project = resolveActiveSocialProject(runtime, dialog?.projectId);
            if (!project) return '';
            const groups = getProjectTaskGraphGroups(runtime, text(project.id));
            const buildModel = window.buildProjectHealthModel
                || window.KiuSocialWorkspaceHealthModel?.buildProjectHealthModel;
            const model = typeof buildModel === 'function'
                ? buildModel(project, {
                    groups,
                    schedule: computeProjectSchedule(project),
                    resolveDeskTaskReadiness,
                    projectTaskDependsOnIds,
                    projectTaskDownstreamIds,
                    isProjectTaskGraphGroupId,
                    projectRiskRegisterSummary,
                    sortProjectRisksForRegister,
                    projectRiskIsActiveStatus,
                    taskDurationHours,
                    sumProjectOpenWorkHours,
                    sumProjectActualHours,
                    formatProjectScheduleHours,
                    formatProjectScheduleDate
                })
                : null;
            if (!model) return '';

            const {
                projectId, projectName, currency, statusCounts, totalTasks, donePct,
                planned, spent, capValue, overCap, noBudgetLine, budgetTail,
                overdueCount, dueSoonCount, blockedCount, scheduleStartAt, criticalIds,
                shortestFinish, plannedFinishLabel, lastDueAt, noEstOpen, overEstimateCount,
                remainingHours, loggedHours, unassignedCount, readyN, waitingN, riskSummary,
                topRisks, linkCount, hasCycle, bottleneckTitle, bottleneckCount, groupCount,
                loadList, maxLoad, issues, healthLevel, healthLabel, topIssue, dataReadiness,
                dataChecks, whyBits, weekActionsTop, fixSamples, taskTitles, canContribute, riskCount
            } = model;

            const money = (n) => formatProjectTaskBudgetEstimate(n, currency) || `0 ${currency}`;
            const budgetTailHtml = budgetTail?.kind === 'over'
                ? `<b class="sph-bad">${escape(money(budgetTail.delta))} over</b> your ${escape(money(budgetTail.capValue))} cap.`
                : budgetTail?.kind === 'under'
                    ? `${escape(money(budgetTail.delta))} under your ${escape(money(budgetTail.capValue))} cap.`
                    : 'No budget cap set yet.';
            const taskTitle = (id) => text(taskTitles?.[id] || 'Task');
            const statusRow = (key, label) => `<div class="sph-statrow"><span class="sph-sw" style="background:${PROJECT_TASK_STATUS_EDGE_COLOR[key]}"></span><span class="sph-t">${escape(label)}</span><span class="sph-n">${statusCounts[key]}</span></div>`;
            const hygieneChip = (focus, icon, label, count, tone = '') => (
                count > 0
                    ? `<button type="button" class="sph-hygiene-chip home-hover-chip lux-control-btn${tone ? ` is-${tone}` : ''}" data-action="project-task-focus" data-focus="${escape(focus)}" title="Open desk filter: ${escape(label)}"><i class="fas ${escape(icon)}" aria-hidden="true"></i><strong>${count}</strong> ${escape(label)}</button>`
                    : `<span class="sph-hygiene-chip lux-control-btn is-ok"><i class="fas ${escape(icon)}" aria-hidden="true"></i><strong>0</strong> ${escape(label)}</span>`
            );
            const weekActionBtn = (item) => {
                const attrs = item.taskId
                    ? `data-action="${escape(item.action)}" data-project-id="${escape(projectId)}" data-task-id="${escape(item.taskId)}"`
                    : item.focus
                        ? `data-action="${escape(item.action)}" data-focus="${escape(item.focus)}"`
                        : `data-action="${escape(item.action)}" data-project-id="${escape(projectId)}"`;
                return `<button type="button" class="sph-week-item lux-control-btn" ${attrs}>
                    <span class="sph-week-ic"><i class="fas ${escape(item.icon)}" aria-hidden="true"></i></span>
                    <span class="sph-week-copy"><strong>${escape(item.title)}</strong><em>${escape(item.detail)}</em></span>
                    <i class="fas fa-chevron-right sph-week-go" aria-hidden="true"></i>
                </button>`;
            };

            return `<main class="social-page-surface social-project-health-page" data-social-page-surface="project-health" data-action="noop" aria-label="Project health">
                <header class="social-page-surface-head sph-fs-topbar lux-soft-chrome">
                        <div class="social-page-surface-heading">
                            <strong class="social-page-surface-title"><i class="fas fa-heart-pulse" aria-hidden="true"></i> Project health</strong>
                            <span class="social-page-surface-subtitle">${escape(projectName)} · live from tasks, schedule, budget &amp; risks.</span>
                        </div>
                        <div class="sph-fs-topbar-actions">
                            <span class="sph-health-badge" data-health="${escape(healthLevel)}">${escape(healthLabel)}</span>
                            <button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="project-task-graph-open" data-project-id="${escape(projectId)}"><i class="fas fa-diagram-project"></i> Map</button>
                            <button class="lux-ghost-btn" type="button" data-action="dialog-close" aria-label="Back to task map"><i class="fas fa-arrow-left"></i> Back to map</button>
                        </div>
                </header>
                    <div class="social-page-surface-body social-page-surface-body--project-health">
                            <div class="sph-verdict sph-verdict--rich sph-verdict--fs lux-studio-section lux-soft-chrome" data-health="${escape(healthLevel)}" data-over="${overCap ? '1' : '0'}">
                                <div class="sph-verdict-lede">
                                    <span class="sph-k">The one-line read</span>
                                    <p><b>${escape(topIssue)}</b>${issues.length > 1 ? ` · also: ${escape(issues.slice(1, 3).join(', '))}` : ''}. Planned work <b>${escape(money(planned))}</b> across <b>${totalTasks}</b> tasks — ${budgetTailHtml}</p>
                                </div>
                                <div class="sph-verdict-stat" title="Soonest the project can finish if nothing slips (critical path method)"><span class="sph-vlabel">Soonest finish</span><span class="sph-vval">${escape(shortestFinish)}</span><span class="sph-vsub">if nothing slips</span></div>
                                <div class="sph-verdict-stat"><span class="sph-vlabel">Done</span><span class="sph-vval">${donePct}%</span><span class="sph-vsub">${statusCounts.done}/${totalTasks || 0} tasks</span></div>
                                <div class="sph-verdict-stat"><span class="sph-vlabel">Open risks</span><span class="sph-vval ${riskSummary.high ? 'sph-bad' : ''}">${riskSummary.open}</span><span class="sph-vsub">${riskSummary.high ? `${riskSummary.high} high` : 'active register'}</span></div>
                                <div class="sph-verdict-stat" title="Tasks with zero float — delay here delays the whole project"><span class="sph-vlabel">Critical tasks</span><span class="sph-vval">${criticalIds.length}</span><span class="sph-vsub">zero float</span></div>
                            </div>
                            <div class="sph-why lux-card lux-soft-chrome" aria-label="Why this score">
                                <div class="lux-card-head">
                                    <strong>Why this score</strong>
                                    <span>Live project issues</span>
                                </div>
                                <ul>${whyBits.map((b) => `<li>${escape(b)}</li>`).join('')}</ul>
                            </div>
                            <div class="sph-hygiene" aria-label="Ownership and readiness">
                                ${hygieneChip('unassigned', 'fa-user-slash', 'unassigned', unassignedCount, unassignedCount ? 'warn' : '')}
                                ${hygieneChip('ready', 'fa-bolt', 'ready now', readyN)}
                                ${hygieneChip('blocked', 'fa-ban', 'waiting on deps', waitingN, waitingN ? 'warn' : '')}
                                ${hygieneChip('blocked', 'fa-hand', 'status blocked', blockedCount, blockedCount ? 'danger' : '')}
                                ${hygieneChip('overdue', 'fa-clock', 'overdue', overdueCount, overdueCount ? 'danger' : '')}
                                ${hygieneChip('critical', 'fa-route', 'on critical path', criticalIds.length, criticalIds.length ? 'crit' : '')}
                            </div>
                            <div class="sph-coach-grid">
                                <section class="sph-card lux-card lux-soft-chrome sph-card--readiness">
                                    <div class="sph-card-head lux-card-head">
                                        <h3>Data readiness</h3>
                                        <span class="sph-auto">auto</span>
                                        <span class="sph-readiness-pct ${dataReadiness < 70 ? 'is-low' : (dataReadiness < 90 ? 'is-mid' : 'is-high')}" title="Share of open tasks that have owner, time estimate, due date, and budget line">${dataReadiness}%</span>
                                        <span class="sph-card-head-note">owners · estimates · due dates · budget lines</span>
                                    </div>
                                    <p class="sph-coach-lead">How complete is your plan data? Incomplete cards make schedule and budget look healthier than they are.</p>
                                    <div class="sph-readiness-bar" aria-hidden="true"><i style="width:${dataReadiness}%"></i></div>
                                    <div class="sph-readiness-checks">
                                        ${dataChecks.map((c) => {
                                            const pct = c.total ? Math.round((c.ok / c.total) * 100) : 100;
                                            return `<div class="sph-readiness-row lux-soft-chrome" data-ok="${c.fix ? '0' : '1'}">
                                                <span class="sph-readiness-label">${escape(c.label)}</span>
                                                <strong class="sph-readiness-value">${c.ok}/${c.total || 0}</strong>
                                                <em class="sph-readiness-hint">${pct}%</em>
                                            </div>`;
                                        }).join('')}
                                    </div>
                                    ${fixSamples.length ? `
                                        <div class="sph-mini-label">Fix these tasks first</div>
                                        <div class="sph-fix-list">${fixSamples.map((f) => `
                                            <button type="button" class="sph-fix-task lux-control-btn" data-action="project-task-edit-open" data-project-id="${escape(projectId)}" data-task-id="${escape(f.id)}" title="Edit task">
                                                <strong>${escape(f.title)}</strong>
                                                <span>${escape(f.reason)}</span>
                                            </button>`).join('')}
                                        </div>` : '<p class="sph-empty">Open tasks already have owners, estimates, due dates, and budget lines.</p>'}
                                </section>
                                <section class="sph-card lux-card lux-soft-chrome sph-card--week">
                                    <div class="sph-card-head lux-card-head"><h3>Coach tips</h3><span class="sph-auto">auto</span></div>
                                    <p class="sph-coach-lead">Suggested from live issues — separate from your manual plan below.</p>
                                    ${weekActionsTop.length
                                        ? `<div class="sph-week-list">${weekActionsTop.map(weekActionBtn).join('')}</div>`
                                        : '<p class="sph-empty">Nothing urgent from live data. Keep updating estimates and finishing ready work.</p>'}
                                </section>
                            </div>
                            ${renderProjectHealthPlanCardHtml(runtime, project)}
                        <div class="sph-board">
                                <section class="sph-card lux-card lux-soft-chrome sph-card--progress">
                                    <div class="sph-card-head lux-card-head"><h3>Progress</h3><span class="sph-auto">auto</span></div>
                                    <div class="sph-ring-row">
                                        <div class="sph-ring" style="--p:${donePct}"><span>${donePct}%<small>done</small></span></div>
                                        <div class="sph-statuses">
                                            ${statusRow('done', 'Done')}
                                            ${statusRow('in-progress', 'In progress')}
                                            ${statusRow('todo', 'To do')}
                                            ${statusRow('blocked', 'Blocked')}
                                        </div>
                                    </div>
                                    <div class="sph-facts sph-facts--tight">
                                        <div class="sph-fact" title="Sum of time estimates on open tasks (not calendar days left)"><span class="sph-fv">${escape(formatProjectScheduleHours(remainingHours))}</span><span class="sph-fk">Work left in estimates</span></div>
                                        <div class="sph-fact"><span class="sph-fv">${escape(formatProjectScheduleHours(loggedHours))}</span><span class="sph-fk">Time logged</span></div>
                                    </div>
                                </section>
                                <section class="sph-card lux-card lux-soft-chrome sph-card--budget">
                                    <div class="sph-card-head lux-card-head"><h3>Budget</h3><span class="sph-auto">auto</span></div>
                                    <div class="sph-bmeter">
                                        <div class="sph-brow"><span class="sph-blab">Budget on cards</span><span class="sph-bamt">${escape(money(planned))}</span></div>
                                        <div class="sph-brow"><span class="sph-blab">Money recorded</span><span class="sph-bamt">${escape(money(spent))}</span></div>
                                        ${capValue > 0 ? `<div class="sph-brow sph-brow-total" data-over="${overCap ? '1' : '0'}"><span class="sph-blab">Project cap</span><span class="sph-bamt">${escape(money(capValue))}</span></div>` : '<div class="sph-brow"><span class="sph-blab">Project cap</span><span class="sph-bamt sph-muted">Not set</span></div>'}
                                    </div>
                                    ${noBudgetLine ? `<p class="sph-empty">${noBudgetLine} open task${noBudgetLine === 1 ? '' : 's'} have no budget on the card — “Budget on cards” understates work.</p>` : ''}
                                </section>
                                <section class="sph-card lux-card lux-soft-chrome sph-card--risks">
                                    <div class="sph-card-head lux-card-head">
                                        <h3>Risks</h3>
                                        <span class="sph-auto">auto</span>
                                        ${canContribute || riskCount
                                            ? `<button type="button" class="lux-secondary-btn lux-secondary-btn-sm" data-action="project-risk-open" data-project-id="${escape(projectId)}"><i class="fas fa-triangle-exclamation"></i> Register</button>`
                                            : ''}
                                    </div>
                                    <div class="sph-profile">
                                        <div class="sph-chip lux-soft-chrome" data-risk-bucket="${riskSummary.high ? 'high' : (riskSummary.open ? 'medium' : 'low')}"><span class="sph-c">${riskSummary.open}</span><span class="sph-l">Open</span></div>
                                        <div class="sph-chip lux-soft-chrome" data-risk-bucket="${riskSummary.high ? 'high' : 'low'}"><span class="sph-c">${riskSummary.high}</span><span class="sph-l">High</span></div>
                                        <div class="sph-chip lux-soft-chrome" data-risk-bucket="${riskSummary.unassigned ? 'medium' : 'low'}"><span class="sph-c">${riskSummary.unassigned}</span><span class="sph-l">No owner</span></div>
                                    </div>
                                    ${topRisks.length
                                        ? `<div class="sph-risklist">${topRisks.map((risk) => {
                                            const tier = projectRiskExposureTiers(risk?.likelihood, risk?.impact);
                                            const score = projectRiskExposureScore(risk?.likelihood, risk?.impact);
                                            return `<div class="sph-risk" data-risk-bucket="${escape(tier)}">
                                                <span class="sph-sev" data-risk-bucket="${escape(tier)}"></span>
                                                <span class="sph-risk-name">${escape(text(risk?.title || 'Risk'))}<small>${escape(projectRiskOptionLabel(risk?.status || 'open'))}</small></span>
                                                <span class="sph-risk-exp"><b>${score}</b><small>/ 25 · ${escape(tier)}</small></span>
                                            </div>`;
                                        }).join('')}</div>`
                                        : '<div class="sph-empty">No open risks on the register.</div>'}
                                </section>
                                <section class="sph-card lux-card lux-soft-chrome sph-card--schedule">
                                    <div class="sph-card-head lux-card-head"><h3>Schedule</h3><span class="sph-auto">auto</span></div>
                                    <div class="sph-facts sph-facts--tight">
                                        <div class="sph-fact"><span class="sph-fv">${escape(shortestFinish)}</span><span class="sph-fk">Shortest finish</span></div>
                                        <div class="sph-fact"><span class="sph-fv">${criticalIds.length}</span><span class="sph-fk">Critical tasks</span></div>
                                        <div class="sph-fact"><span class="sph-fv ${noEstOpen ? 'sph-bad' : ''}">${noEstOpen}</span><span class="sph-fk">No estimate</span></div>
                                    </div>
                                    ${criticalIds.length
                                        ? `<div><div class="sph-mini-label">Critical path</div><div class="sph-chain">${criticalIds.map((id, i) => `${i ? '<span class="sph-arrow">→</span>' : ''}<span class="sph-node">${escape(taskTitle(id))}</span>`).join('')}</div></div>`
                                        : `<div class="sph-empty">${noEstOpen ? `${noEstOpen} open task${noEstOpen === 1 ? '' : 's'} lack time estimates — critical path stays empty until O/M/P or duration is set.` : 'Add order links and durations to reveal the critical path.'}</div>`}
                                    <div class="sph-facts">
                                        <div class="sph-fact"><span class="sph-fv">${plannedFinishLabel ? escape(plannedFinishLabel) : '—'}</span><span class="sph-fk">CPM planned finish${scheduleStartAt ? '' : ' (set project start)'}</span></div>
                                        <div class="sph-fact"><span class="sph-fv">${lastDueAt ? escape(when(lastDueAt)) : '—'}</span><span class="sph-fk">Latest due date</span></div>
                                        <div class="sph-fact"><span class="sph-fv ${overdueCount ? 'sph-bad' : ''}">${overdueCount}</span><span class="sph-fk">Overdue</span></div>
                                        <div class="sph-fact"><span class="sph-fv">${dueSoonCount}</span><span class="sph-fk">Due in 7 days</span></div>
                                        ${overEstimateCount ? `<div class="sph-fact"><span class="sph-fv sph-bad">${overEstimateCount}</span><span class="sph-fk">Over estimate</span></div>` : ''}
                                    </div>
                                </section>
                                <section class="sph-card lux-card lux-soft-chrome sph-card--team">
                                    <div class="sph-card-head lux-card-head"><h3>Team load</h3><span class="sph-auto">auto</span></div>
                                    ${loadList.length ? `<div class="sph-team">${loadList.map((l) => {
                                        const unassignedRow = l.key === '__unassigned__';
                                        const account = unassignedRow ? null : (accountById(l.key) || { id: l.key });
                                        const name = unassignedRow ? 'Unassigned' : displayName(account);
                                        const topHours = loadList[0]?.hours || 0;
                                        const overload = !unassignedRow && loadList.length > 1 && topHours > 0 && l.hours >= topHours * 0.85 && l.hours > 0;
                                        return `<div class="sph-member" data-over="${overload || unassignedRow ? '1' : '0'}">
                                            <span class="sph-who">${escape(name)}<small>${l.count} open · ${escape(formatProjectScheduleHours(l.hours))}${overload ? ' · heavy' : ''}${unassignedRow ? ' · needs an owner' : ''}</small></span>
                                            <span class="sph-mamt">${escape(formatProjectScheduleHours(l.hours))}</span>
                                            <span class="sph-loadbar"><i style="width:${Math.round((l.hours / maxLoad) * 100)}%"${unassignedRow ? ' data-unassigned="1"' : ''}></i></span>
                                        </div>`;
                                    }).join('')}</div>` : '<div class="sph-empty">No tasks yet.</div>'}
                                </section>
                                <section class="sph-card lux-card lux-soft-chrome sph-card--deps">
                                    <div class="sph-card-head lux-card-head"><h3>Dependencies</h3><span class="sph-auto">auto</span></div>
                                    <div class="sph-deprow">
                                        <div class="sph-dep"><span class="sph-dep-ic ok"><i class="fas fa-link"></i></span><span><b>${linkCount}</b> order link${linkCount === 1 ? '' : 's'}</span></div>
                                        <div class="sph-dep"><span class="sph-dep-ic ${blockedCount ? 'warn' : 'ok'}"><i class="fas fa-ban"></i></span><span><b>${blockedCount}</b> blocked · <b>${waitingN}</b> waiting on deps</span></div>
                                        <div class="sph-dep"><span class="sph-dep-ic ${hasCycle ? 'warn' : 'ok'}"><i class="fas ${hasCycle ? 'fa-triangle-exclamation' : 'fa-check'}"></i></span><span><b>${hasCycle ? 'Yes' : 'None'}</b> — circular dependenc${hasCycle ? 'y found' : 'ies'}</span></div>
                                        ${bottleneckTitle && bottleneckCount > 1 ? `<div class="sph-dep"><span class="sph-dep-ic warn"><i class="fas fa-diamond"></i></span><span><b>${escape(bottleneckTitle)}</b> — ${bottleneckCount} tasks wait on it</span></div>` : ''}
                                        ${groupCount ? `<div class="sph-dep"><span class="sph-dep-ic ok"><i class="fas fa-layer-group"></i></span><span><b>${groupCount}</b> package${groupCount === 1 ? '' : 's'} on the map</span></div>` : ''}
                                    </div>
                                </section>
                        </div>
                        <div class="sph-legend"><span class="sph-auto">auto</span> Hygiene chips open the Work Desk filter. <span class="sph-auto">yours</span> My plan is manual (days / weeks / months / all). Risks open the risk register.</div>
                    </div>
                    <footer class="social-page-surface-footer sph-fs-footer">
                        <button class="lux-secondary-btn" type="button" data-action="project-task-graph-open" data-project-id="${escape(projectId)}"><i class="fas fa-diagram-project"></i> Open map</button>
                        <button class="lux-primary-btn" type="button" data-action="dialog-close"><i class="fas fa-arrow-left"></i> Back to map</button>
                    </footer>
            </main>`;
        }

        return {
            buildProjectHealthPlanPickModel,
            buildProjectRiskCountByTaskId,
            formatProjectRiskScore,
            projectRiskExposureScore,
            projectRiskExposureTiers,
            projectRiskIsActiveStatus,
            projectRiskLinkedTaskIdList,
            projectRiskLinksTask,
            projectRiskOptionLabel,
            projectRiskRegisterSummary,
            projectRiskScaleOptionLabel,
            projectRiskScaleRank,
            renderProjectHealthDialog,
            renderProjectHealthPlanCardHtml,
            renderProjectHealthPlanPickBodyHtml,
            renderProjectHealthPlanPickDialog,
            renderProjectHealthPlanPickRailHtml,
            renderProjectHealthPlanPickResultsHtml,
            renderProjectHealthPlanPickToolbarHtml,
            renderProjectRiskDialog,
            renderProjectRiskScaleOptions,
            renderProjectTaskDetailModal,
            sortProjectRisksForRegister
        };
    }

    window.createKiuSocialWorkspaceDialogsApi = createKiuSocialWorkspaceDialogsApi;
})();
