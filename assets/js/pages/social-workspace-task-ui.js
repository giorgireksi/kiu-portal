/* Social workspace task UI (form fields, create/delete, desk/board cards).
 * Lazy: loaded by ensureSocialWorkspaceModule before social-workspace.js.
 * Workspace installs via createKiuSocialWorkspaceTaskUiApi(deps).
 */
(function initSocialWorkspaceTaskUi() {
    'use strict';
    if (window.__KIU_SOCIAL_WORKSPACE_TASK_UI_LOADED) return;
    window.__KIU_SOCIAL_WORKSPACE_TASK_UI_LOADED = true;

    function createKiuSocialWorkspaceTaskUiApi(deps) {
        if (!deps || typeof deps !== 'object') throw new Error('workspace task-ui deps required');
        const {
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
            when
        } = deps;

        function renderProjectTaskDeleteConfirmDialog(project, task, options = {}) {
            if (!project || !task) return '';
            const statusId = text(task?.status || 'todo') || 'todo';
            const statusLabel = PROJECT_TASK_COLUMNS.find((column) => column.id === statusId)?.label || 'Backlog';
            const priority = text(task?.priority || 'medium').toLowerCase() || 'medium';
            const taskTitle = text(task?.title || 'Task') || 'Task';
            const backdropClass = text(options.backdropClass || '');
            const backdropClasses = ['social-neo-dialog-backdrop', backdropClass].filter(Boolean).join(' ');
            return `<div class="${backdropClasses}" data-action="dialog-close" role="dialog" aria-modal="true" aria-label="Remove task">
                <form class="social-neo-dialog-card social-neo-dialog-card--form social-neo-dialog-card--compact social-neo-delete-confirm social-neo-dialog-card--project-task-delete social-neo-dialog-card--lms-create social-neo-dialog-card--social-glass" data-form="dialog-project-task-delete" data-action="noop" data-lux-transparency-exempt="1">
                    ${neoHead('Remove task', 'This permanently deletes the task from the project board.', { icon: 'fas fa-trash' })}
                    <div class="social-neo-dialog-body social-neo-dialog-body--project-task-delete">
                        <section class="social-neo-dialog-project-create-section social-neo-delete-confirm-preview">
                            <strong class="social-neo-dialog-preview-title">${escape(taskTitle)}</strong>
                            <div class="social-neo-muted social-neo-muted-mt-6">${escape(statusLabel)} · ${escape(priority)}</div>
                        </section>
                        <section class="social-neo-dialog-project-create-section social-neo-dialog-preview social-neo-dialog-preview-danger">The task will be permanently removed for everyone on this project.</section>
                        <label class="social-neo-item-line social-neo-dialog-checkbox-line">
                            <input type="checkbox" name="confirmProjectTaskDelete" value="yes">
                            <span class="social-neo-dialog-checkbox-copy">I understand this task will be permanently removed.</span>
                        </label>
                    </div>
                    ${neoActions({
                        actionsClass: 'social-neo-delete-confirm-actions',
                        submitLabel: 'Remove task',
                        submitTone: 'danger'
                    })}
                    <input type="hidden" name="projectId" value="${escape(text(project.id))}">
                    <input type="hidden" name="taskId" value="${escape(text(task.id))}">
                </form>
            </div>`;
        }
        function renderProjectTaskCreateDialog(runtime, dialog) {
            const project = resolveActiveSocialProject(runtime, dialog?.projectId);
            if (!project || !project.viewerCanContribute) return '';
            const memberSummaries = Array.isArray(project.memberSummaries) ? project.memberSummaries : [];
            const isEdit = Boolean(dialog?.taskId);
            const editTask = isEdit
                ? (Array.isArray(project.tasks) ? project.tasks : []).find((task) => text(task?.id) === text(dialog?.taskId)) || null
                : null;
            if (isEdit && !editTask) return '';
            const defaultStatus = isEdit
                ? text(editTask.status || 'todo') || 'todo'
                : text(dialog?.defaultColumn || runtime.ui?.projectTaskStatus || 'todo') || 'todo';
            const formKind = isEdit ? 'project-task-edit' : 'project-task-create';
            const submitLabel = isEdit ? 'Save changes' : 'Create task';
            const submitIcon = isEdit ? 'fa-check' : 'fa-plus';
            const backdropClass = projectTaskGraphStackedBackdropClass(runtime, isEdit ? 'project-task-edit' : 'project-task-create');
            const backdropClasses = ['social-neo-dialog-backdrop', backdropClass].filter(Boolean).join(' ');
            return `<div class="${backdropClasses}" data-action="dialog-close" role="dialog" aria-modal="true" aria-label="${isEdit ? 'Edit task' : 'Create task'}">
                <form class="social-neo-dialog-card social-neo-dialog-card--form social-neo-dialog-card--project-task-create social-neo-dialog-card--lms-create social-neo-dialog-card--social-glass" data-form="${escape(formKind)}" data-project-id="${escape(text(project.id))}" ${isEdit ? `data-task-id="${escape(text(dialog?.taskId))}"` : ''} data-budget-currency="${escape(text(project?.budgetCurrency || '') || 'USD')}" data-action="noop" data-lux-transparency-exempt="1">
                    ${neoHead(
                        isEdit ? 'Edit task' : 'Create task',
                        isEdit ? 'Update work, assignment, or checklist.' : 'Add work to the board, assign a teammate, and place it in the right column.',
                        { icon: isEdit ? 'fas fa-pen' : 'fas fa-list-check' }
                    )}
                    <div class="social-neo-dialog-body social-neo-dialog-body--project-task-create">
                        ${renderProjectTaskFormFields(runtime, {
                            mode: 'modal',
                            isEdit,
                            editTask,
                            defaultColumn: defaultStatus,
                            project,
                            memberSummaries
                        })}
                    </div>
                    <div class="social-neo-form-actions social-neo-dialog-actions">
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-cancel-btn" type="button" data-action="dialog-close">Cancel</button>
                        ${isEdit ? `<button class="social-neo-btn social-neo-btn-danger social-neo-btn-ghost" type="button" data-action="project-task-delete-open" data-project-id="${escape(text(project.id))}" data-task-id="${escape(text(dialog?.taskId))}"><i class="fas fa-trash"></i> Remove task</button>` : ''}
                        ${isEdit ? '' : `<button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-submit-btn" type="submit" data-submit-mode="create-another"><i class="fas fa-plus"></i> Create &amp; add another</button>`}
                        <button class="social-neo-btn social-neo-btn-primary social-neo-dialog-submit-btn" type="submit"><i class="fas ${submitIcon}"></i> ${escape(submitLabel)}</button>
                    </div>
                </form>
            </div>`;
        }

        function renderProjectTaskFormFields(runtime, options = {}) {
            const project = options.project || null;
            if (!project) return '';
            const memberSummaries = Array.isArray(options.memberSummaries) ? options.memberSummaries : (Array.isArray(project.memberSummaries) ? project.memberSummaries : []);
            const isEdit = Boolean(options.isEdit);
            const editTask = options.editTask || null;
            const defaultStatus = isEdit
                ? text(editTask?.status || 'todo') || 'todo'
                : text(options.defaultColumn || runtime.ui?.projectTaskStatus || 'todo') || 'todo';
            const titleValue = isEdit ? text(editTask?.title || '') : text(runtime.ui?.projectTaskTitle || '');
            const descValue = isEdit ? text(editTask?.description || '') : text(runtime.ui?.projectTaskDescription || '');
            const assigneeValue = isEdit ? text(editTask?.assigneeUserId || '') : text(runtime.ui?.projectTaskAssigneeId || '');
            const startValue = isEdit ? toDateTimeLocalValue(editTask?.startAt) : text(runtime.ui?.projectTaskStartAt || '');
            const dueValue = isEdit ? toDateTimeLocalValue(editTask?.dueAt) : text(runtime.ui?.projectTaskDueAt || '');
            const impactScoreValue = isEdit
                ? String(normalizeTaskScore1to5(editTask?.impactScore))
                : String(normalizeTaskScore1to5(runtime.ui?.projectTaskImpactScore));
            const effortScoreValue = isEdit
                ? String(normalizeTaskScore1to5(editTask?.effortScore))
                : String(normalizeTaskScore1to5(runtime.ui?.projectTaskEffortScore));
            const matrixPreviewScore = computeTaskMatrixScore(impactScoreValue, effortScoreValue);
            const matrixPreviewBucket = computeTaskMatrixBucket(matrixPreviewScore);
            const matrixPreviewLabel = matrixPreviewBucket.charAt(0).toUpperCase() + matrixPreviewBucket.slice(1);
            const budgetEstimateValue = isEdit
                ? (Number(editTask?.budgetEstimate) > 0 ? String(editTask.budgetEstimate) : '')
                : text(runtime.ui?.projectTaskBudgetEstimate || '');
            const timeUnitValue = normalizeTaskTimeUnit(isEdit ? editTask?.timeUnit : runtime.ui?.projectTaskTimeUnit);
            const timeOptimisticValue = isEdit
                ? (normalizeTaskTime(editTask?.timeOptimistic) > 0 ? String(normalizeTaskTime(editTask.timeOptimistic)) : '')
                : text(runtime.ui?.projectTaskTimeOptimistic || '');
            let timeMostLikelyValue = isEdit
                ? (normalizeTaskTime(editTask?.timeMostLikely) > 0 ? String(normalizeTaskTime(editTask.timeMostLikely)) : '')
                : text(runtime.ui?.projectTaskTimeMostLikely || '');
            const timePessimisticValue = isEdit
                ? (normalizeTaskTime(editTask?.timePessimistic) > 0 ? String(normalizeTaskTime(editTask.timePessimistic)) : '')
                : text(runtime.ui?.projectTaskTimePessimistic || '');
            if (isEdit && !timeMostLikelyValue && normalizeTaskTime(editTask?.timeEstimate) > 0) {
                timeMostLikelyValue = String(normalizeTaskTime(editTask.timeEstimate));
            }
            const schedulePreview = resolveTaskScheduleEstimate(isEdit ? editTask : {
                timeOptimistic: timeOptimisticValue,
                timeMostLikely: timeMostLikelyValue,
                timePessimistic: timePessimisticValue,
                timeEstimate: timeMostLikelyValue,
                timeUnit: timeUnitValue
            });
            const actualTimeValue = isEdit
                ? (normalizeTaskTime(editTask?.actualTime) > 0 ? String(normalizeTaskTime(editTask.actualTime)) : '')
                : text(runtime.ui?.projectTaskActualTime || '');
            const actualCostValue = isEdit
                ? (Number(editTask?.actualCost) > 0 ? String(editTask.actualCost) : '')
                : text(runtime.ui?.projectTaskActualCost || '');
            const budgetCurrency = text(project?.budgetCurrency || '') || 'USD';
            const idScope = 'modal';
            const taskTitleId = controlId('project-task-title', idScope);
            const taskAssigneeId = controlId('project-task-assignee', idScope);
            const taskDescId = controlId('project-task-desc', idScope);
            const taskStartId = controlId('project-task-start', idScope);
            const taskDueId = controlId('project-task-due', idScope);
            const taskImpactId = controlId('project-task-impact', idScope);
            const taskEffortId = controlId('project-task-effort', idScope);
            const taskBudgetId = controlId('project-task-budget', idScope);
            const taskTimeOptimisticId = controlId('project-task-time-o', idScope);
            const taskTimeMostLikelyId = controlId('project-task-time-m', idScope);
            const taskTimePessimisticId = controlId('project-task-time-p', idScope);
            const taskTimeUnitId = controlId('project-task-time-unit', idScope);
            const taskStatusId = controlId('project-task-status', idScope);
            const taskActualTimeId = controlId('project-task-actual-time', idScope);
            const taskActualCostId = controlId('project-task-actual-cost', idScope);
            const workloadMap = new Map((Array.isArray(project.workloadByMember) ? project.workloadByMember : []).map((entry) => [text(entry.userId), entry]));
            const assigneeOptions = `
                <option value="">Unassigned</option>
                ${memberSummaries.map((entry) => {
                    const userId = text(entry.userId);
                    const wl = workloadMap.get(userId);
                    const wlSuffix = wl && countNum(wl.count) > 0 ? ` · ${countNum(wl.count)} tasks · ${formatProjectScheduleHours(Number(wl.hours) || 0)}` : '';
                    return `<option value="${escape(userId)}" ${assigneeValue === userId ? 'selected' : ''}>${escape(displayName(accountById(entry.userId) || { id: entry.userId }))}${escape(wlSuffix)}</option>`;
                }).join('')}
            `;
            const scoreOptions = (selected) => [1, 2, 3, 4, 5].map((score) => `<option value="${score}" ${String(selected) === String(score) ? 'selected' : ''}>${score}</option>`).join('');
            const statusOptions = PROJECT_TASK_COLUMNS.map((column) => `<option value="${escape(column.id)}" ${defaultStatus === column.id ? 'selected' : ''}>${escape(column.label)}</option>`).join('');
            const selectedDependsOn = isEdit
                ? projectTaskDependsOnIds(editTask)
                : uniqueStrings((Array.isArray(runtime.ui?.projectTaskDependsOnIds) ? runtime.ui.projectTaskDependsOnIds : []).map((id) => text(id)).filter(Boolean));
            const packageGroups = getProjectTaskGraphGroups(runtime, text(project.id));
            const packageById = new Map(packageGroups.map((g) => [text(g?.id), g]).filter(([id]) => id));
            // Read-only parent names (edit deps on the map). Hidden inputs preserve ids on save.
            const selectedDepChips = selectedDependsOn.map((id) => {
                if (isProjectTaskGraphGroupId(id)) {
                    const g = packageById.get(id);
                    return `<span class="social-project-task-dep-chip is-package" title="Package">${escape(text(g?.name || 'Package'))}</span>`;
                }
                const t = (Array.isArray(project.tasks) ? project.tasks : []).find((entry) => text(entry?.id) === id);
                return `<span class="social-project-task-dep-chip" title="Task">${escape(text(t?.title || id))}</span>`;
            }).join('');
            const dependsHiddenInputs = selectedDependsOn.map((id) => (
                `<input type="hidden" name="projectTaskDependsOnIds" value="${escape(id)}">`
            )).join('');
            const selectedPackageId = isEdit
                ? ''
                : text(runtime.ui?.projectTaskCreateGroupId || '');
            const taskPackageId = controlId('project-task-package', idScope);
            const packageOptions = [
                `<option value="" ${!selectedPackageId ? 'selected' : ''}>Unscoped</option>`,
                ...packageGroups.map((group) => {
                    const gid = text(group?.id);
                    return `<option value="${escape(gid)}" ${selectedPackageId === gid ? 'selected' : ''}>${escape(text(group?.name || 'Package'))}</option>`;
                })
            ].join('');

            const essentials = `
                <section class="social-neo-dialog-project-create-section">
                    <div class="social-neo-dialog-project-create-section-head">
                        <strong>Task</strong>
                        <span>${isEdit ? 'Update the work item.' : 'Name it. You can add detail later.'}</span>
                    </div>
                    ${neoField('Task title', `<input class="social-neo-input" id="${escape(taskTitleId)}" type="text" name="projectTaskTitle" placeholder="What needs to be done?" value="${escape(titleValue)}" maxlength="120" required>`, { forId: taskTitleId })}
                    ${typeof socialNeoFieldHtml === 'function' ? socialNeoFieldHtml(`Description <span class="social-neo-muted">(optional)</span>`, `<textarea class="social-neo-textarea" id="${escape(taskDescId)}" rows="${isEdit ? 3 : 2}" name="projectTaskDescription" placeholder="Context, acceptance criteria, or links..." maxlength="2000">${escape(descValue)}</textarea>`, { forId: taskDescId }) : ''}
                    ${isEdit ? '' : `
                    <label class="social-neo-dialog-field" for="${escape(taskPackageId)}">
                        <span class="social-neo-label">Package</span>
                        <select class="social-neo-select" id="${escape(taskPackageId)}" name="projectTaskPackageId" data-lux-picker>
                            ${packageOptions}
                        </select>
                    </label>
                    `}
                    ${neoField('Column', `<select class="social-neo-select" id="${escape(taskStatusId)}" name="projectTaskStatus" data-lux-picker>${statusOptions}</select>`, { forId: taskStatusId })}
                </section>
            `;

            const advancedInner = `
                <div class="social-project-task-priority-block">
                        <div class="social-project-task-priority-block-head">Impact × Effort</div>
                        <div class="social-project-task-priority-matrix-fields social-neo-form-grid social-neo-form-grid-2">
                            ${neoField('Impact (1–5)', `<select class="social-neo-select" id="${escape(taskImpactId)}" name="projectTaskImpactScore" data-lux-picker>${scoreOptions(impactScoreValue)}</select>`, { forId: taskImpactId })}
                            ${neoField('Effort (1–5)', `<select class="social-neo-select" id="${escape(taskEffortId)}" name="projectTaskEffortScore" data-lux-picker>${scoreOptions(effortScoreValue)}</select>`, { forId: taskEffortId })}
                            <div class="social-project-task-matrix-preview" data-lux-transparency-exempt="1">Score ${escape(String(matrixPreviewScore))} · ${escape(matrixPreviewLabel)}</div>
                        </div>
                    </div>
                <section class="social-neo-dialog-project-create-section">
                    ${neoSection('Duration (PERT)', 'Three-point estimate — drives the critical path.')}
                    <div class="social-neo-form-grid social-neo-form-grid-3">
                        ${neoField('Optimistic (O)', `<input class="social-neo-input" id="${escape(taskTimeOptimisticId)}" type="number" min="0" step="0.5" name="projectTaskTimeOptimistic" placeholder="0" value="${escape(timeOptimisticValue)}">`, { forId: taskTimeOptimisticId })}
                        ${neoField('Most likely (M)', `<input class="social-neo-input" id="${escape(taskTimeMostLikelyId)}" type="number" min="0" step="0.5" name="projectTaskTimeMostLikely" placeholder="0" value="${escape(timeMostLikelyValue)}">`, { forId: taskTimeMostLikelyId })}
                        ${neoField('Pessimistic (P)', `<input class="social-neo-input" id="${escape(taskTimePessimisticId)}" type="number" min="0" step="0.5" name="projectTaskTimePessimistic" placeholder="0" value="${escape(timePessimisticValue)}">`, { forId: taskTimePessimisticId })}
                    </div>
                    <div class="social-neo-form-grid social-neo-form-grid-2">
                        <label class="social-neo-dialog-field" for="${escape(taskTimeUnitId)}">
                            <span class="social-neo-label">Schedule unit</span>
                            <select class="social-neo-select" id="${escape(taskTimeUnitId)}" name="projectTaskTimeUnit" data-lux-picker>
                                <option value="h" ${timeUnitValue === 'h' ? 'selected' : ''}>hours</option>
                                <option value="d" ${timeUnitValue === 'd' ? 'selected' : ''}>days (8h workday)</option>
                            </select>
                        </label>
                        <div class="social-project-task-pert-preview" data-lux-transparency-exempt="1">${escape(schedulePreview.estimate > 0 && taskHasPert({ timeOptimistic: timeOptimisticValue, timeMostLikely: timeMostLikelyValue, timePessimistic: timePessimisticValue }) ? `PERT ${formatTaskTime(schedulePreview.estimate, timeUnitValue)} (O=${timeOptimisticValue || '—'} · M=${timeMostLikelyValue || '—'} · P=${timePessimisticValue || '—'})` : (timeMostLikelyValue ? `Most likely ${formatTaskTime(timeMostLikelyValue, timeUnitValue)}` : 'Enter O, M, and P for a PERT estimate'))}</div>
                    </div>
                </section>
                <section class="social-neo-dialog-project-create-section">
                    ${neoSection('Planning', 'Optional start and due dates.')}
                    <div class="social-neo-form-grid social-neo-form-grid-2">
                        ${neoField('Start date (optional)', `<input class="social-neo-input" id="${escape(taskStartId)}" type="datetime-local" name="projectTaskStartAt" value="${escape(startValue)}">`, { forId: taskStartId })}
                        ${neoField('Due date', `<input class="social-neo-input" id="${escape(taskDueId)}" type="datetime-local" name="projectTaskDueAt" value="${escape(dueValue)}">`, { forId: taskDueId })}
                    </div>
                </section>
                <section class="social-neo-dialog-project-create-section">
                    ${neoSection('Budget', 'Planned task cost.')}
                    <label class="social-neo-dialog-field" for="${escape(taskBudgetId)}">
                        <span class="social-neo-label">Planned task cost (${escape(budgetCurrency)})</span>
                        <input class="social-neo-input" id="${escape(taskBudgetId)}" type="number" min="0" step="0.01" name="projectTaskBudgetEstimate" placeholder="0.00" value="${escape(budgetEstimateValue)}">
                    </label>
                </section>
                <section class="social-neo-dialog-project-create-section">
                    ${neoSection('Actuals', 'Record after work starts (optional on create).')}
                    <div class="social-neo-form-grid social-neo-form-grid-2">
                        <label class="social-neo-dialog-field" for="${escape(taskActualTimeId)}">
                            <span class="social-neo-label"><i class="fas fa-stopwatch" aria-hidden="true"></i> Actual time (${escape(timeUnitValue === 'd' ? 'days' : 'hours')})</span>
                            <input class="social-neo-input" id="${escape(taskActualTimeId)}" type="number" min="0" step="0.5" name="projectTaskActualTime" placeholder="0" value="${escape(actualTimeValue)}">
                        </label>
                        <label class="social-neo-dialog-field" for="${escape(taskActualCostId)}">
                            <span class="social-neo-label"><i class="fas fa-receipt" aria-hidden="true"></i> Actual cost (${escape(budgetCurrency)})</span>
                            <input class="social-neo-input" id="${escape(taskActualCostId)}" type="number" min="0" step="0.01" name="projectTaskActualCost" placeholder="0.00" value="${escape(actualCostValue)}">
                        </label>
                    </div>
                </section>
                <section class="social-neo-dialog-project-create-section">
                    ${neoSection('Ownership', 'Who delivers this task.')}
                    <label class="social-neo-dialog-field" for="${escape(taskAssigneeId)}">
                        <span class="social-neo-label">Assignee</span>
                        <select class="social-neo-select" id="${escape(taskAssigneeId)}" name="projectTaskAssigneeId" data-lux-picker>
                            ${assigneeOptions}
                        </select>
                    </label>
                </section>
                <section class="social-neo-dialog-project-create-section">
                    <div class="social-project-task-dep-current">
                        <span class="social-neo-label">Waiting on</span>
                        <div class="social-project-task-dep-chips">${selectedDepChips || '<span class="social-project-task-dep-chip is-empty">None</span>'}</div>
                    </div>
                    ${dependsHiddenInputs}
                </section>
            `;

            if (isEdit) {
                return `${essentials}
                <section class="social-neo-dialog-project-create-section">
                    ${neoSection('Details', 'Priority, schedule, ownership, and links.')}
                    ${advancedInner}
                </section>
            `;
            }

            return `${essentials}
                <details class="spt-task-form-more">
                    <summary class="spt-task-form-more-sum">
                        <i class="fas fa-sliders" aria-hidden="true"></i>
                        Owner, dates, estimate…
                    </summary>
                    <div class="spt-task-form-more-body">
                        ${advancedInner}
                    </div>
                </details>
            `;
        }
        function renderDeskTaskTreeForest(project, forest, options = {}) {
            const collapsedTree = options.collapsedTree instanceof Set
                ? options.collapsedTree
                : new Set();
            const renderNode = (node) => {
                if (!node?.task) return '';
                const tid = text(node.task.id);
                const hasKids = Array.isArray(node.children) && node.children.length > 0;
                const treeCollapsed = hasKids && collapsedTree.has(tid);
                const card = renderProjectTaskDeskCard(project, node.task, {
                    ...options,
                    depth: node.depth,
                    childCount: node.childCount,
                    hasTreeChildren: hasKids,
                    treeCollapsed
                });
                if (!hasKids) {
                    return `<div class="spt-desk-tree-node" data-tree-task-id="${escape(tid)}" data-depth="${node.depth}">${card}</div>`;
                }
                return `
                    <div class="spt-desk-tree-node ${treeCollapsed ? 'is-tree-collapsed' : 'is-tree-open'}" data-tree-task-id="${escape(tid)}" data-depth="${node.depth}" data-has-children="1">
                        ${card}
                        <div class="spt-desk-tree-children ${treeCollapsed ? 'is-collapsed' : ''}" data-tree-children-of="${escape(tid)}" role="group" aria-label="Child tasks">
                            ${node.children.map((child) => renderNode(child)).join('')}
                        </div>
                    </div>
                `;
            };
            return (Array.isArray(forest) ? forest : []).map((node) => renderNode(node)).join('');
        }

        function renderProjectTaskDeskCard(project, task, options = {}) {
            if (!project || !task) return '';
            const fields = buildProjectTaskInspectorFields(task);
            const statusId = fields.statusId;
            const priority = fields.priority;
            const assignee = fields.assignee;
            const dueAt = fields.dueAt;
            const isOverdue = fields.isOverdue;
            const isToday = fields.isToday;
            const isSoon = fields.isSoon;
            const projectTasks = Array.isArray(options.allTasks)
                ? options.allTasks
                : (Array.isArray(project?.tasks) ? project.tasks : []);
            const taskById = options.taskById instanceof Map
                ? options.taskById
                : new Map(projectTasks.map((entry) => [text(entry?.id), entry]));
            const scheduleById = options.scheduleById && typeof options.scheduleById === 'object'
                ? options.scheduleById
                : {};
            const currency = text(options.currency || project?.budgetCurrency || 'USD') || 'USD';
            const depth = Math.max(0, Math.min(8, Number(options.depth) || 0));
            const childCount = Math.max(0, Number(options.childCount) || 0);
            const hasTreeChildren = Boolean(options.hasTreeChildren) || childCount > 0;
            const treeCollapsed = Boolean(options.treeCollapsed);
            const blockedByCount = projectTaskDependsOnIds(task).length;
            const blocksCount = projectTaskDownstreamIds(task?.id, projectTasks).length;
            const readiness = resolveDeskTaskReadiness(task, taskById);
            const scheduleRow = scheduleById[text(task?.id)] || null;
            // Honest critical: only when schedule has real duration (not zero-hour spam).
            const isCritical = Boolean(scheduleRow?.isCritical)
                && statusId !== 'done'
                && Number(scheduleRow?.durationHours) > 0;
            const floatHours = Number(scheduleRow?.floatHours);
            const scheduleEst = resolveTaskScheduleEstimate(task);
            const timeLabel = !task?.isMilestone && scheduleEst.estimate > 0
                ? formatTaskTime(scheduleEst.estimate, scheduleEst.unit)
                : '';
            const canEdit = Boolean(project.viewerCanContribute);
            const checklistTotal = fields.checklistTotal;
            const checklistDone = fields.checklistDone;
            let signalKind = '';
            let signalLabel = '';
            if (statusId !== 'done') {
                if (isCritical) { signalKind = 'critical'; signalLabel = 'Critical'; }
                else if (readiness.kind === 'waiting') { signalKind = 'waiting'; signalLabel = 'Waiting'; }
                else if (readiness.kind === 'ready') { signalKind = 'ready'; signalLabel = readiness.label; }
                // Total float vs project end is not a desk signal (reads like duration).
            }
            const statusShort = ({
                todo: 'To do',
                'in-progress': 'Active',
                blocked: 'Blocked',
                done: 'Done'
            })[statusId] || fields.column.label;

            const impact = Number(task?.impactScore);
            const effort = Number(task?.effortScore);
            const priTitle = (Number.isFinite(impact) || Number.isFinite(effort))
                ? `Priority ${priority}${Number.isFinite(impact) ? ` · Impact ${impact}` : ''}${Number.isFinite(effort) ? ` · Effort ${effort}` : ''}`
                : `Priority ${priority}`;
            const dueClass = isOverdue ? 'is-overdue' : isToday ? 'is-today' : isSoon ? 'is-soon' : '';
            const budgetLabel = formatProjectTaskBudgetEstimate(task?.budgetEstimate, currency);
            const startAt = text(task?.startAt || '');
            const actualTime = Number(task?.actualTime);
            const actualCost = Number(task?.actualCost);
            const hasActualTime = Number.isFinite(actualTime) && actualTime > 0;
            const hasActualCost = Number.isFinite(actualCost) && actualCost > 0;
            const detailOpen = text(activeDialog()?.type || '') === 'project-task-detail'
                && text(activeDialog()?.taskId || '') === text(task?.id);
            const expanded = detailOpen;
            const deskLink = options.deskLink && typeof options.deskLink === 'object' ? options.deskLink : null;
            const deskLinkActive = Boolean(deskLink && text(deskLink.taskId));
            const deskLinkIsSource = deskLinkActive && text(deskLink.taskId) === text(task?.id);
            const deskLinkRole = text(deskLink?.role || 'child') || 'child';
            const metaChips = [];
            if (task?.isMilestone) metaChips.push('<span class="spt-desk-chip spt-desk-chip--mile" title="Milestone"><i class="fas fa-flag" aria-hidden="true"></i>Milestone</span>');
            if (checklistTotal) metaChips.push(`<span class="spt-desk-chip" title="Checklist"><i class="fas fa-list-check" aria-hidden="true"></i>${escape(String(checklistDone))}/${escape(String(checklistTotal))}</span>`);
            if (budgetLabel) metaChips.push(`<span class="spt-desk-chip spt-desk-chip--money" title="Budget"><i class="fas fa-coins" aria-hidden="true"></i>${escape(budgetLabel)}</span>`);
            if (startAt) metaChips.push(`<span class="spt-desk-chip" title="Start"><i class="fas fa-play" aria-hidden="true"></i>${escape(when(startAt))}</span>`);
            if (hasActualTime || hasActualCost) {
                const bits = [];
                if (hasActualTime) bits.push(`${formatTaskTime(actualTime, scheduleEst.unit || 'h')} actual`);
                if (hasActualCost) bits.push(formatProjectTaskBudgetEstimate(actualCost, currency) || `${actualCost}`);
                metaChips.push(`<span class="spt-desk-chip spt-desk-chip--actual" title="Actuals"><i class="fas fa-chart-line" aria-hidden="true"></i>${escape(bits.join(' · '))}</span>`);
            }
            const rowMods = [
                isOverdue ? 'is-overdue' : '',
                hasTreeChildren ? 'is-parent' : '',
                depth > 0 ? 'is-child' : '',
                treeCollapsed ? 'is-tree-collapsed' : '',
                signalKind ? `is-signal-${signalKind}` : '',
                statusId === 'done' ? 'is-done' : '',
                expanded ? 'is-detail-open' : ''
            ].filter(Boolean).join(' ');
            // Real column status + secondary readiness signal (rail + cue, not the main pill)
            const signalTone = signalKind || statusId;
            const waitingParent = (readiness.openDeps || [])[0];
            const waitingParentTitle = waitingParent ? text(waitingParent?.title || 'parent') : '';
            let signalCue = '';
            if (statusId !== 'done' && signalKind) {
                if (signalKind === 'critical') signalCue = 'Critical';
                else if (signalKind === 'waiting') signalCue = waitingParentTitle ? `Waiting on ${waitingParentTitle}` : 'Waiting on deps';
                // Ready/slack: rail color only — keep secondary line quiet
            }
            const hasAssignee = Boolean(task?.assigneeUserId);
            const linkCtrl = canEdit && deskLinkActive
                ? (deskLinkIsSource
                    ? `<button type="button" class="spt-desk-link-src" data-action="project-task-desk-link-cancel" title="Cancel connect">Linking…</button>`
                    : `<button type="button" class="spt-desk-link-pick-btn" data-action="project-task-desk-link-pick" data-project-id="${escape(text(project.id))}" data-task-id="${escape(text(task.id))}" title="${deskLinkRole === 'parent' ? 'Set as child of selected' : 'Set as parent of selected'}">${deskLinkRole === 'parent' ? 'Child' : 'Parent'}</button>`)
                : '';
            // Parent names for fill; children stay in the tree only (no fill list)
            const deskGroups = Array.isArray(options.groups)
                ? options.groups
                : getProjectTaskGraphGroups(state(), text(project?.id || ''));
            const parentTasks = projectTaskDependsOnIds(task)
                .map((id) => {
                    if (isProjectTaskGraphGroupId(id)) {
                        const g = deskGroups.find((entry) => text(entry?.id) === id);
                        return g ? { id, title: text(g.name || 'Package'), isGroup: true } : null;
                    }
                    return taskById.get(id) || null;
                })
                .filter(Boolean);
            const parentNames = parentTasks.map((t) => text(t?.title || 'Task')).filter(Boolean).slice(0, 3);
            // If we already say "Waiting on X", skip redundant Parent fill names.
            const showParentNames = parentNames.length > 0 && signalKind !== 'waiting';
            // Skip parent count chip when fill already lists names (unless truncated extras)
            const parentChipCount = showParentNames
                ? (parentTasks.length > parentNames.length ? parentTasks.length - parentNames.length : 0)
                : blockedByCount;
            const unassigned = !hasAssignee && statusId !== 'done';
            const inlineMeta = [
                dueAt ? `<span class="spt-desk-inline-due ${dueClass}" title="Due">${escape(when(dueAt))}</span>` : '',
                hasAssignee ? `<span class="spt-desk-inline-who" title="${escape(displayName(assignee))}">${avatar(assignee, 'social-neo-avatar-xs')}<span>${escape(displayName(assignee))}</span></span>` : '',
                unassigned ? `<span class="spt-desk-inline-unassigned" title="No owner assigned"><i class="fas fa-user-slash" aria-hidden="true"></i>Unassigned</span>` : ''
            ].filter(Boolean).join('');
            // Mid-row fact chips — human-readable, single-line
            const packageNamesByTaskId = options.packageNamesByTaskId instanceof Map
                ? options.packageNamesByTaskId
                : new Map();
            const packageNames = packageNamesByTaskId.get(text(task?.id)) || [];
            const packageChip = packageNames.length ? packageNames[0] : '';
            const impactScore = Number.isFinite(impact) ? Math.round(impact) : 0;
            const effortScore = Number.isFinite(effort) ? Math.round(effort) : 0;
            const priWord = ({ urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low' })[priority] || (priority.charAt(0).toUpperCase() + priority.slice(1));
            const rowMetaParts = [];
            rowMetaParts.push(`<span class="spt-desk-meta-chip spt-desk-meta-chip--pri" data-priority="${escape(priority)}" title="${escape(priTitle)}">${escape(priWord)}</span>`);
            // Impact/Effort live in task detail — keep desk row calm.
            if (timeLabel) {
                rowMetaParts.push(`<span class="spt-desk-meta-chip spt-desk-meta-chip--est" title="Time estimate"><i class="fas fa-stopwatch" aria-hidden="true"></i>Est ${escape(timeLabel)}</span>`);
            }
            if (hasActualTime) {
                const actLabel = formatTaskTime(actualTime, scheduleEst.unit || 'h') || '';
                if (actLabel) {
                    rowMetaParts.push(`<span class="spt-desk-meta-chip spt-desk-meta-chip--actual" title="Actual time spent"><i class="fas fa-chart-line" aria-hidden="true"></i>Spent ${escape(actLabel)}</span>`);
                }
            }
            if (budgetLabel) {
                rowMetaParts.push(`<span class="spt-desk-meta-chip spt-desk-meta-chip--budget" title="Planned budget"><i class="fas fa-coins" aria-hidden="true"></i>Budget ${escape(budgetLabel)}</span>`);
            }
            if (parentChipCount > 0) {
                rowMetaParts.push(`<span class="spt-desk-meta-chip spt-desk-meta-chip--deps" title="Number of parent tasks this waits on"><i class="fas fa-link" aria-hidden="true"></i>${escape(String(parentChipCount))} parent${parentChipCount === 1 ? '' : 's'}</span>`);
            }
            // Title already has children count chip when this is a tree parent
            if (blocksCount > 0 && !hasTreeChildren) {
                rowMetaParts.push(`<span class="spt-desk-meta-chip spt-desk-meta-chip--deps" title="Number of child tasks waiting on this"><i class="fas fa-sitemap" aria-hidden="true"></i>${escape(String(blocksCount))} child${blocksCount === 1 ? '' : 'ren'}</span>`);
            }
            if (checklistTotal) {
                rowMetaParts.push(`<span class="spt-desk-meta-chip spt-desk-meta-chip--check" title="Checklist progress"><i class="fas fa-list-check" aria-hidden="true"></i>Checklist ${escape(String(checklistDone))}/${escape(String(checklistTotal))}</span>`);
            }
            if (task?.isMilestone) {
                rowMetaParts.push(`<span class="spt-desk-meta-chip spt-desk-meta-chip--mile" title="Milestone checkpoint"><i class="fas fa-flag" aria-hidden="true"></i>Milestone</span>`);
            }

            if (statusId !== 'done' && !task?.isMilestone && !(Number(scheduleRow?.durationHours) > 0)) {
                rowMetaParts.push(`<span class="spt-desk-meta-chip spt-desk-meta-chip--noest" title="Add time estimate or PERT so schedule can place this task">No est</span>`);
            }
            if (packageChip) {
                rowMetaParts.push(`<span class="spt-desk-meta-chip spt-desk-meta-chip--pkg" title="Work package"><i class="fas fa-layer-group" aria-hidden="true"></i>${escape(packageChip)}</span>`);
            }
            const rowMetaHtml = rowMetaParts.length
                ? `<div class="spt-desk-row-meta">${rowMetaParts.join('')}</div>`
                : '';

            // Grow-zone: progress, or parent + due — never children names (tree shows them)
            const checkPct = checklistTotal ? Math.round((checklistDone / checklistTotal) * 100) : 0;
            const timePct = (timeLabel && hasActualTime && scheduleEst.estimate > 0)
                ? Math.min(100, Math.round((actualTime / scheduleEst.estimate) * 100))
                : null;
            let dueUrgency = '';
            if (dueAt && statusId !== 'done') {
                const dueMsLocal = Date.parse(dueAt);
                if (Number.isFinite(dueMsLocal)) {
                    const dayMs = 86400000;
                    const diffDays = Math.round((dueMsLocal - Date.now()) / dayMs);
                    if (diffDays < 0) dueUrgency = `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`;
                    else if (diffDays === 0) dueUrgency = 'Due today';
                    else if (diffDays === 1) dueUrgency = 'Due tomorrow';
                    else if (diffDays <= 14) dueUrgency = `Due in ${diffDays} days`;
                    else dueUrgency = `Due ${when(dueAt)}`;
                }
            }
            let fillInner = '';
            if (checklistTotal) {
                fillInner = `<div class="spt-desk-row-fill-progress" title="Checklist ${checklistDone} of ${checklistTotal} done">
                    <span class="spt-desk-row-fill-progress-label"><i class="fas fa-list-check" aria-hidden="true"></i>Checklist ${escape(String(checklistDone))}/${escape(String(checklistTotal))}</span>
                    <span class="spt-desk-row-fill-progress-track" aria-hidden="true"><i style="width:${checkPct}%"></i></span>
                </div>`;
            } else if (timePct !== null) {
                fillInner = `<div class="spt-desk-row-fill-progress" title="Actual time vs estimate">
                    <span class="spt-desk-row-fill-progress-label"><i class="fas fa-stopwatch" aria-hidden="true"></i>Time ${escape(String(timePct))}%</span>
                    <span class="spt-desk-row-fill-progress-track" aria-hidden="true"><i style="width:${timePct}%"></i></span>
                </div>`;
            } else if (showParentNames || dueUrgency || signalCue) {
                const bits = [];
                if (showParentNames) {
                    bits.push(`<span class="spt-desk-row-fill-rel"><em>Parent</em> ${escape(parentNames.join(', '))}${parentTasks.length > parentNames.length ? '…' : ''}</span>`);
                }
                if (dueUrgency) {
                    bits.push(`<span class="spt-desk-row-fill-due ${dueClass}" title="Due date"><i class="fas fa-calendar" aria-hidden="true"></i>${escape(dueUrgency)}</span>`);
                } else if (signalCue && !showParentNames) {
                    bits.push(`<span class="spt-desk-row-fill-signal" data-signal="${escape(signalKind)}">${escape(signalCue)}</span>`);
                }
                fillInner = bits.length
                    ? `<div class="spt-desk-row-fill-relations" title="Task context">${bits.join('<span class="spt-desk-row-fill-sep">·</span>')}</div>`
                    : `<span class="spt-desk-row-fill-empty" aria-hidden="true"></span>`;
            } else {
                fillInner = `<span class="spt-desk-row-fill-empty" aria-hidden="true"></span>`;
            }
            const fillHtml = `<div class="spt-desk-row-fill">${fillInner}</div>`;
            const mapBtn = `<button type="button" class="spt-desk-row-map" data-action="project-task-graph-open" data-project-id="${escape(text(project.id))}" data-task-id="${escape(text(task.id))}" title="Open on map" aria-label="Open on map"><i class="fas fa-diagram-project" aria-hidden="true"></i></button>`;
            const editBtn = canEdit
                ? `<button type="button" class="spt-desk-row-edit" data-action="project-task-edit-open" data-project-id="${escape(text(project.id))}" data-task-id="${escape(text(task.id))}" title="Edit task" aria-label="Edit task"><i class="fas fa-pen" aria-hidden="true"></i></button>`
                : '';
            const toolsHtml = (mapBtn || editBtn)
                ? `<div class="spt-desk-row-tools">${mapBtn}${editBtn}</div>`
                : '';
            return `
                <article class="spt-desk-card spt-desk-row ${rowMods}" data-task-id="${escape(text(task.id))}" data-status="${escape(statusId)}" data-priority="${escape(priority)}" data-depth="${depth}" data-signal="${escape(signalTone)}" data-lux-transparency-exempt="1" style="--spt-depth:${depth}" role="listitem">
                    <div class="spt-desk-row-rail" data-status="${escape(statusId)}" data-signal="${escape(signalTone)}" aria-hidden="true"></div>
                    <div class="spt-desk-row-mainline spt-desk-row-mainline--fluid spt-desk-row-mainline--fill">
                        <div class="spt-desk-col spt-desk-col-task">
                            <div class="spt-desk-task-line">
                                ${hasTreeChildren ? `
                                    <button type="button" class="spt-desk-tree-toggle" data-action="project-task-desk-tree-toggle" data-task-id="${escape(text(task.id))}" aria-expanded="${treeCollapsed ? 'false' : 'true'}" title="${treeCollapsed ? 'Expand children' : 'Collapse children'}">
                                        <i class="fas fa-chevron-${treeCollapsed ? 'right' : 'down'}" aria-hidden="true"></i>
                                    </button>
                                ` : (depth > 0 ? '<span class="spt-desk-tree-leaf" aria-hidden="true"></span>' : '<span class="spt-desk-tree-spacer" aria-hidden="true"></span>')}
                                <div class="spt-desk-task-copy">
                                    <button type="button" class="spt-desk-card-main" data-action="project-task-detail-open" data-project-id="${escape(text(project.id))}" data-task-id="${escape(text(task.id))}" title="${escape(text(task?.title || 'Task'))}">
                                        <strong class="spt-desk-card-title">${escape(text(task?.title || 'Task'))}</strong>
                                        ${childCount > 0 ? `<span class="spt-desk-children-chip" title="${childCount} child${childCount === 1 ? '' : 'ren'}">${childCount}</span>` : ''}
                                    </button>
                                    ${inlineMeta || signalCue ? `
                                        <div class="spt-desk-task-sub">
                                            ${inlineMeta}
                                            ${signalCue ? `<span class="spt-desk-signal-cue" data-signal="${escape(signalKind)}">${escape(signalCue)}</span>` : ''}
                                        </div>
                                    ` : ''}
                                </div>
                                ${linkCtrl}
                            </div>
                        </div>
                        ${rowMetaHtml}
                        ${fillHtml}
                        <div class="spt-desk-row-actions" data-status="${escape(statusId)}">
                            ${toolsHtml}
                            <button type="button" class="spt-desk-status-chip" data-status="${escape(statusId)}" data-action="project-task-detail-open" data-project-id="${escape(text(project.id))}" data-task-id="${escape(text(task.id))}" title="Open task">
                                <i class="spt-desk-status-dot" aria-hidden="true"></i>
                                <span class="spt-desk-status-label">${escape(statusShort)}</span>
                            </button>
                        </div>
                    </div>
                </article>
            `;
        }

        function renderProjectTaskCard(project, task, columnId = '') {
            if (!project || !task) return '';
            const assignee = accountById(task?.assigneeUserId) || { id: task?.assigneeUserId };
            const dueAt = text(task?.dueAt || '');
            const dueMs = Number.isFinite(Date.parse(dueAt)) ? Date.parse(dueAt) : null;
            const now = Date.now();
            const isOverdue = Boolean(dueMs && dueMs < now && text(task?.status || '') !== 'done');
            const isToday = Boolean(dueMs && !isOverdue && new Date(dueMs).toDateString() === new Date(now).toDateString());
            const isSoon = Boolean(dueMs && !isOverdue && !isToday && dueMs < now + 7 * 86400000);
            const priority = text(task?.priority || 'medium').toLowerCase() || 'medium';
            const tag = text(task?.tag || task?.category || '');
            const checklist = Array.isArray(task?.checklist) ? task.checklist : [];
            const checklistDone = checklist.filter((item) => item?.done).length;
            const checklistTotal = checklist.length;
            const projectTasks = Array.isArray(project?.tasks) ? project.tasks : [];
            const blockedByCount = projectTaskDependsOnIds(task).length;
            const blocksCount = projectTaskDownstreamIds(task?.id, projectTasks).length;
            const columnIndex = PROJECT_TASK_COLUMNS.findIndex((entry) => entry.id === columnId);
            const canMoveLeft = columnIndex > 0;
            const canMoveRight = columnIndex >= 0 && columnIndex < PROJECT_TASK_COLUMNS.length - 1;
            return `
                <article class="social-project-task-card is-clickable ${isOverdue ? 'is-overdue' : ''}" data-priority="${escape(priority)}" data-lux-transparency-exempt="1" role="button" tabindex="0" data-action="project-task-detail-open" data-project-id="${escape(text(project.id))}" data-task-id="${escape(text(task.id))}" aria-label="Open task ${escape(text(task?.title || 'Task'))}">
                    <div class="social-project-task-card-head">
                        <strong class="social-project-task-card-title">${escape(text(task?.title || 'Task'))}</strong>
                        <span class="social-neo-pill social-project-priority-pill is-board" data-priority="${escape(priority)}">${escape(priority)}</span>
                    </div>
                    ${checklistTotal ? `
                        <div class="social-project-task-checklist-progress" title="${escape(String(checklistDone))} of ${escape(String(checklistTotal))} steps done">
                            <div class="social-project-task-checklist-bar"><div class="social-project-task-checklist-fill" style="width:${Math.round((checklistDone / checklistTotal) * 100)}%"></div></div>
                            <span class="social-neo-pill"><i class="fas fa-check-double"></i>${escape(String(checklistDone))}/${escape(String(checklistTotal))}</span>
                        </div>
                    ` : ''}
                    <div class="social-neo-badge-row social-project-task-meta">
                        ${tag ? `<span class="social-neo-pill social-project-task-tag"><i class="fas fa-tag"></i>${escape(tag)}</span>` : ''}
                        ${task?.assigneeUserId ? `<span class="social-neo-pill social-project-task-assignee">${avatar(assignee, 'social-neo-avatar-xs')}${escape(displayName(assignee))}</span>` : '<span class="social-neo-pill social-project-task-assignee is-unassigned"><i class="fas fa-user"></i>Unassigned</span>'}
                        ${dueAt ? `<span class="social-neo-pill social-project-task-due ${isOverdue ? 'is-overdue' : isToday ? 'is-today' : isSoon ? 'is-soon' : ''}"><i class="fas fa-clock"></i>${escape(when(dueAt))}</span>` : ''}
                        ${blockedByCount || blocksCount ? `<button class="social-neo-pill social-project-task-deps-chip" type="button" data-action="project-task-graph-open" data-project-id="${escape(text(project.id))}" data-task-id="${escape(text(task.id))}" title="Open dependency graph"><i class="fas fa-link"></i> blocked by ${escape(String(blockedByCount))} · blocks ${escape(String(blocksCount))}</button>` : ''}
                    </div>
                    <div class="social-project-task-actions">
                        ${project.viewerCanContribute ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-icon" type="button" title="Edit task" data-action="project-task-edit-open" data-project-id="${escape(text(project.id))}" data-task-id="${escape(text(task.id))}"><i class="fas fa-pen"></i></button>` : ''}
                        ${canMoveLeft ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-icon" type="button" title="Move to ${escape(PROJECT_TASK_COLUMNS[columnIndex - 1].label)}" data-action="project-task-move" data-project-id="${escape(text(project.id))}" data-task-id="${escape(text(task.id))}" data-status="${escape(PROJECT_TASK_COLUMNS[columnIndex - 1].id)}"><i class="fas fa-arrow-left"></i></button>` : ''}
                        ${canMoveRight ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-icon" type="button" title="Move to ${escape(PROJECT_TASK_COLUMNS[columnIndex + 1].label)}" data-action="project-task-move" data-project-id="${escape(text(project.id))}" data-task-id="${escape(text(task.id))}" data-status="${escape(PROJECT_TASK_COLUMNS[columnIndex + 1].id)}"><i class="fas fa-arrow-right"></i></button>` : ''}
                        ${project.viewerCanContribute ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-icon" type="button" title="Delete task" data-action="project-task-delete" data-project-id="${escape(text(project.id))}" data-task-id="${escape(text(task.id))}"><i class="fas fa-trash"></i></button>` : ''}
                    </div>
                </article>
            `;
        }

        function renderProjectTaskColumnList(column, columnTasks, cardsHtml) {
            if (!column || !Array.isArray(columnTasks)) return '';
            if (!columnTasks.length) {
                return `<div class="social-project-task-card-stack"><div class="social-neo-empty social-project-task-column-empty">No tasks in ${escape(text(column.label || 'column').toLowerCase())}.</div></div>`;
            }
            return `<div class="social-project-task-card-stack">${cardsHtml}</div>`;
        }

        function renderProjectColumnTasksModal(runtime, project, columnId, columnTasks = []) {
            if (!project || !text(columnId)) return '';
            const column = PROJECT_TASK_COLUMNS.find((entry) => entry.id === text(columnId)) || null;
            if (!column) return '';
            const tasks = Array.isArray(columnTasks) ? columnTasks : [];
            const columnIcon = text(column.icon || 'fa-columns') || 'fa-columns';
            const canContribute = Boolean(project.viewerCanContribute);
            const taskCountLabel = `${escape(String(tasks.length))} ${tasks.length === 1 ? 'task' : 'tasks'} in this column`;
            return `<div class="social-neo-dialog-backdrop" data-action="dialog-close" role="dialog" aria-modal="true" aria-label="Column tasks">
                <div class="social-neo-dialog-card social-neo-dialog-card--form social-neo-dialog-card--project-column-tasks social-neo-dialog-card--lms-create" data-action="noop" data-lux-transparency-exempt="1">
                    ${neoHeadHtml(
                        `<i class="fas ${escape(columnIcon)}" aria-hidden="true"></i> ${escape(column.label)}`,
                        `${taskCountLabel}. Click a card for full details.`
                    )}
                    <div class="social-neo-dialog-body social-neo-dialog-body--project-column-tasks">
                        <section class="social-neo-dialog-project-create-section">
                            <div class="social-neo-dialog-project-create-section-head">
                                <strong>Tasks</strong>
                                <span>All work items currently in ${escape(column.label)}.</span>
                            </div>
                            <div class="social-project-task-card-stack social-project-task-card-stack--modal">
                                ${tasks.length ? tasks.map((task) => renderProjectTaskCard(project, task, column.id)).join('') : `<div class="social-neo-empty social-project-task-column-empty">No tasks in ${escape(column.label.toLowerCase())}.</div>`}
                            </div>
                        </section>
                    </div>
                    ${canContribute
                        ? neoActions({ cancelLabel: 'Cancel', submitLabel: `Add task to ${column.label}`, submitIcon: 'fas fa-plus', submitType: 'button', submitAttrs: `data-action="project-task-quick-add" data-project-id="${escape(text(project.id))}" data-column="${escape(column.id)}"` })
                        : `<div class="social-neo-form-actions social-neo-dialog-actions"><button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-cancel-btn" type="button" data-action="dialog-close">Cancel</button></div>`}
                </div>
            </div>`;
        }

        return {
            renderProjectTaskDeleteConfirmDialog,
            renderProjectTaskCreateDialog,
            renderProjectTaskFormFields,
            renderDeskTaskTreeForest,
            renderProjectTaskDeskCard,
            renderProjectTaskCard,
            renderProjectTaskColumnList,
            renderProjectColumnTasksModal
        };
    }

    window.createKiuSocialWorkspaceTaskUiApi = createKiuSocialWorkspaceTaskUiApi;
})();
