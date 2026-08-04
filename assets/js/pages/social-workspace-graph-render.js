/* Social workspace task-graph render markup (SVG / canvas / inspectors / fullscreen).
 * Lazy: loaded by ensureSocialWorkspaceModule before social-workspace.js.
 * Workspace installs via createKiuSocialWorkspaceGraphRenderApi(deps).
 */
(function initSocialWorkspaceGraphRender() {
    'use strict';
    if (window.__KIU_SOCIAL_WORKSPACE_GRAPH_RENDER_LOADED) return;
    window.__KIU_SOCIAL_WORKSPACE_GRAPH_RENDER_LOADED = true;

    function createKiuSocialWorkspaceGraphRenderApi(deps) {
        if (!deps || typeof deps !== 'object') throw new Error('workspace graph-render deps required');
        const {
            PROJECT_TASK_COLUMNS,
            PROJECT_TASK_GRAPH_CARD_COMPACT_H,
            PROJECT_TASK_GRAPH_CARD_COMPACT_W,
            PROJECT_TASK_GRAPH_CARD_H,
            PROJECT_TASK_GRAPH_CARD_W,
            PROJECT_TASK_GRAPH_CHECKPOINT_MAX,
            PROJECT_TASK_GRAPH_FO_PAD,
            PROJECT_TASK_GRAPH_MAX_ZOOM,
            PROJECT_TASK_GRAPH_MIN_ZOOM,
            PROJECT_TASK_GROUP_NODE_H,
            PROJECT_TASK_GROUP_NODE_W,
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
            when
        } = deps;
        const __swGraphBatch = deps.__swGraphBatch || window.KiuSocialWorkspaceGraphModel || {};
        const GROUP_NODE_W = Number(PROJECT_TASK_GROUP_NODE_W) || Number(__swGraphBatch.PROJECT_TASK_GROUP_NODE_W) || 264;
        const GROUP_NODE_H = Number(PROJECT_TASK_GROUP_NODE_H) || Number(__swGraphBatch.PROJECT_TASK_GROUP_NODE_H) || 228;

        function renderProjectTaskGraphGroupNode(project, group, position, options = {}) {
            const w = GROUP_NODE_W;
            const h = GROUP_NODE_H;
            const foPad = PROJECT_TASK_GRAPH_FO_PAD;
            const cx = Math.round(Number(position?.x) || 0);
            const cy = Math.round(Number(position?.y) || 0);
            const x = cx - Math.round(w / 2);
            const y = cy - Math.round(h / 2);
            const groupId = text(group?.id);
            const projectId = text(project?.id);
            const roll = computeProjectTaskGraphGroupRollup(group, project, {
                schedule: options.scheduleBundle || null,
                groups: options.groups || null
            });
            const links = getProjectTaskGraphGroupLinkSummary(group, project);
            // Critical paint from schedule only — not order-linked connected critical counts.
            const isPackageCritical = (options.showCritical !== false) && Boolean(options.isCritical);
            const dragAttrs = options.draggable ? ' data-graph-draggable="1"' : '';
            const showPorts = options.dashboard === true && options.linkable !== false && options.preview !== true;
            const budgetLabel = formatProjectTaskBudgetEstimate(roll.budget, roll.currency);
            const actualCostLabel = formatProjectTaskBudgetEstimate(roll.actualCost, roll.currency)
                || formatProjectTaskBudgetEstimate(0, roll.currency)
                || `0 ${roll.currency}`;
            const costVariance = roll.count && roll.actualCost > 0
                ? formatTaskCostVariance(roll.budget, roll.actualCost, roll.currency)
                : null;
            const groupRisks = (Array.isArray(project?.risks) ? project.risks : []).filter((entry) => text(entry?.groupId || '') === groupId);
            const groupRiskCount = groupRisks.length;
            const pct = Math.max(0, Math.min(100, Number(roll.pctComplete) || 0));
            const progressTitle = `${roll.done}/${roll.count} tasks done · ${pct}%${roll.inProgress ? ` · ${roll.inProgress} active` : ''}`;
            const progressBlock = roll.count
                ? `<div class="social-project-task-graph-group-progress" title="${escape(progressTitle)}" data-progress-mode="${escape(roll.progressMode || 'count')}" data-pct="${pct}">
                                    <div class="social-project-task-graph-group-progress-meta">
                                        <span>${pct}% complete</span>
                                        <span>${roll.done}/${roll.count}</span>
                                    </div>
                                    <div class="social-project-task-graph-group-progress-track" aria-hidden="true">
                                        <i class="social-project-task-graph-group-progress-fill" style="width:${pct}%"></i>
                                    </div>
                                </div>`
                : '';
            const assigneeId = text(group?.assigneeUserId || '');
            const childOwnerIds = Array.isArray(roll.ownerIds) ? roll.ownerIds : [];
            const ownerId = assigneeId || (childOwnerIds.length === 1 ? childOwnerIds[0] : '');
            const assigneeAccount = ownerId ? (accountById(ownerId) || { id: ownerId }) : null;
            const assigneeChip = assigneeAccount
                ? `<span class="social-project-task-graph-group-assignee" title="${assigneeId ? 'Package owner' : 'Owner from subtree'}: ${escape(displayName(assigneeAccount))}">${avatar(assigneeAccount, 'social-neo-avatar-xs')}<em>${escape(displayName(assigneeAccount))}</em></span>`
                : (childOwnerIds.length > 1
                    ? `<span class="social-project-task-graph-group-assignee" title="${childOwnerIds.length} owners in subtree"><i class="fas fa-users" aria-hidden="true"></i><em>${childOwnerIds.length} owners</em></span>`
                    : '<span class="social-project-task-graph-group-assignee is-unassigned" title="No owner"><i class="fas fa-user" aria-hidden="true"></i><em>Unassigned</em></span>');
            const connectedCount = Number(roll.connectedCount) || 0;
            const countLabel = roll.count
                ? `${roll.count} task${roll.count === 1 ? '' : 's'}${connectedCount ? ` · ${connectedCount} linked` : ''}`
                : (links.orderCount ? `${links.orderCount} order link${links.orderCount === 1 ? '' : 's'}` : 'Empty');
            // Attention chips: one concern each, no duplicated "blocked" wording.
            const signalChips = [
                roll.blocked > 0
                    ? `<span class="social-project-task-graph-group-signal is-blocked" title="${roll.blocked} blocked in subtree${roll.criticalBlocked ? ` · ${roll.criticalBlocked} on critical path` : ''}"><i class="fas fa-ban" aria-hidden="true"></i>${roll.blocked} blocked</span>`
                    : '',
                roll.overdue > 0
                    ? `<span class="social-project-task-graph-group-signal is-overdue" title="${roll.overdue} overdue in subtree"><i class="fas fa-clock" aria-hidden="true"></i>${roll.overdue} overdue</span>`
                    : '',
                roll.critical > 0
                    ? `<span class="social-project-task-graph-group-signal is-critical" title="${roll.critical} open task${roll.critical === 1 ? '' : 's'} on the project critical path"><i class="fas fa-route" aria-hidden="true"></i>${roll.critical} critical</span>`
                    : '',
                roll.critical === 0 && roll.minFloatHours != null && roll.hoursRemaining > 0
                    ? `<span class="social-project-task-graph-group-signal is-float" title="Tightest schedule float among open subtree tasks"><i class="fas fa-arrows-left-right" aria-hidden="true"></i>slack ${escape(formatProjectScheduleFloat(roll.minFloatHours))}</span>`
                    : '',
                roll.unassigned > 0
                    ? `<span class="social-project-task-graph-group-signal is-unassigned" title="${roll.unassigned} open tasks with no owner"><i class="fas fa-user-slash" aria-hidden="true"></i>${roll.unassigned} unowned</span>`
                    : ''
            ].filter(Boolean).join('');
            const signalsBlock = signalChips
                ? `<div class="social-project-task-graph-group-signals" aria-label="Package attention">${signalChips}</div>`
                : '';
            const variancePill = costVariance
                ? `<span class="social-project-task-graph-group-metric is-variance is-tone-${escape(costVariance.tone)}" title="${escape(costVariance.label)}">${escape((costVariance.label.split(' · ').pop()) || costVariance.label)}</span>`
                : '';
            const moneyPill = roll.count
                ? `<span class="social-project-task-graph-group-metric" title="Budget · actual spent (subtree)"><i class="fas fa-coins" aria-hidden="true"></i>${escape(budgetLabel || '—')} · ${escape(actualCostLabel)} act</span>${variancePill}`
                : `<span class="social-project-task-graph-group-metric is-empty" title="No subtree budget yet"><i class="fas fa-coins" aria-hidden="true"></i>—</span>`;
            const pertSumLabel = roll.hoursTotal > 0 ? formatProjectScheduleHours(roll.hoursTotal) : '';
            const openLabel = roll.hoursRemaining > 0 ? formatProjectScheduleHours(roll.hoursRemaining) : '';
            const pathLabel = roll.pathRemainingHours > 0 ? formatProjectScheduleHours(roll.pathRemainingHours) : '';
            const actualHoursLabel = formatProjectScheduleHours(roll.actualHours || 0);
            const timeTitle = [
                pertSumLabel ? `Planned PERT sum: ${pertSumLabel}` : '',
                openLabel ? `Open PERT sum: ${openLabel}` : (pertSumLabel && roll.done > 0 ? 'No open PERT left' : ''),
                pathLabel ? `Subtree remaining path (makespan): ${pathLabel}` : '',
                `Actual logged: ${actualHoursLabel}`
            ].filter(Boolean).join(' · ') || 'No estimates in subtree yet';
            const timeBits = [];
            if (pertSumLabel) timeBits.push(`PERT ${escape(pertSumLabel)}`);
            if (pathLabel) timeBits.push(`path ${escape(pathLabel)}`);
            if (openLabel && openLabel !== pathLabel) timeBits.push(`${escape(openLabel)} open`);
            else if (!pathLabel && openLabel && openLabel !== pertSumLabel) timeBits.push(`${escape(openLabel)} open`);
            else if (pertSumLabel && roll.hoursRemaining === 0 && roll.done > 0) timeBits.push('done');
            timeBits.push(`${escape(actualHoursLabel)} act`);
            const timePill = pertSumLabel
                ? `<span class="social-project-task-graph-group-metric" title="${escape(timeTitle)}"><i class="fas fa-hourglass-half" aria-hidden="true"></i>${timeBits.join(' · ')}</span>`
                : `<span class="social-project-task-graph-group-metric is-empty" title="${escape(timeTitle)}"><i class="fas fa-hourglass-half" aria-hidden="true"></i>—</span>`;
            const rangeLabel = roll.startLabel && roll.dueLabel
                ? `${roll.startLabel} → ${roll.dueLabel}`
                : (roll.startLabel || roll.dueLabel || '');
            const rangePill = rangeLabel
                ? `<span class="social-project-task-graph-group-metric${roll.overdue > 0 ? ' is-overdue-range' : ''}" title="Earliest start → latest due in subtree${roll.overdue > 0 ? ` · ${roll.overdue} overdue` : ''}"><i class="fas fa-calendar" aria-hidden="true"></i>${escape(rangeLabel)}</span>`
                : '';
            const emptyBody = !roll.count && !links.orderCount
                ? '<div class="social-project-task-graph-group-empty">Drag tasks or packages here · wire ports for order</div>'
                : (!roll.count
                    ? '<div class="social-project-task-graph-group-empty">Linked by order only — drag tasks in to add members</div>'
                    : '');
            const linkHandles = showPorts ? `
                                <button type="button" class="social-project-task-graph-link-handle is-group-port is-side-w is-in" data-action="noop" data-graph-link-port="w" title="Wire port (west · in)" aria-label="West in port"></button>
                                <button type="button" class="social-project-task-graph-link-handle is-group-port is-side-e is-out" data-action="noop" data-graph-link-port="e" title="Wire port (east · out)" aria-label="East out port"></button>
                                <button type="button" class="social-project-task-graph-link-handle is-group-port is-side-n is-in" data-action="noop" data-graph-link-port="n" title="Wire port (north · in)" aria-label="North in port"></button>
                                <button type="button" class="social-project-task-graph-link-handle is-group-port is-side-s is-out" data-action="noop" data-graph-link-port="s" title="Wire port (south · out)" aria-label="South out port"></button>
            ` : '';
            const attentionAttrs = [
                roll.blocked > 0 ? 'data-has-blocked="1"' : '',
                roll.overdue > 0 ? 'data-has-overdue="1"' : '',
                (roll.critical > 0 || isPackageCritical) ? 'data-has-critical="1"' : '',
                (roll.hasAttention || isPackageCritical) ? 'data-attention="1"' : ''
            ].filter(Boolean).join(' ');
            const ariaSignals = [
                roll.blocked ? `${roll.blocked} blocked` : '',
                roll.overdue ? `${roll.overdue} overdue` : '',
                roll.critical ? `${roll.critical} critical` : '',
                roll.critical === 0 && roll.minFloatHours != null ? `slack ${formatProjectScheduleFloat(roll.minFloatHours)}` : '',
                pathLabel ? `path ${pathLabel}` : '',
                roll.unassigned ? `${roll.unassigned} unowned` : ''
            ].filter(Boolean).join(', ');
            return `
                <g class="social-project-task-graph-node-g social-project-task-graph-group-node${isPackageCritical ? ' is-critical' : ''}${options.selectedId && text(options.selectedId) === groupId ? ' is-selected' : ''}${!roll.count ? ' is-empty-members' : ''}${roll.hasAttention || isPackageCritical ? ' is-attention' : ''}"
                    transform="translate(${x},${y})"
                    data-group-id="${escape(groupId)}"
                    data-task-id="${escape(groupId)}"
                    data-project-id="${escape(projectId)}"
                    data-status="todo"
                    data-cx="${cx}" data-cy="${cy}" data-w="${w}" data-h="${h}"
                    data-member-count="${roll.memberCount || 0}"
                    data-connected-count="${Number(roll.connectedCount) || 0}"
                    data-order-count="${links.orderCount}"
                    data-blocked-count="${roll.blocked || 0}"
                    data-overdue-count="${roll.overdue || 0}"
                    data-critical-count="${roll.critical || 0}"
                    data-path-hours="${roll.pathRemainingHours || 0}"
                    ${dragAttrs}
                    role="group" tabindex="0"
                    aria-label="Package ${escape(text(group?.name || 'Group'))} · ${escape(countLabel)}${ownerId ? ` · ${escape(displayName(assigneeAccount))}` : ''}${ariaSignals ? ` · ${escape(ariaSignals)}` : ''}${isPackageCritical ? ' · critical path' : ''}">
                    <rect class="social-project-task-graph-hit" x="0" y="0" width="${w}" height="${h}"></rect>
                    <foreignObject class="social-project-task-graph-card-fo" x="${-foPad}" y="${-foPad}" width="${w + foPad * 2}" height="${h + foPad * 2}">
                        <div xmlns="http://www.w3.org/1999/xhtml" class="social-project-task-graph-card-fo-inner" style="width:${w + foPad * 2}px;height:${h + foPad * 2}px;padding:${foPad}px;box-sizing:border-box;">
                            <div class="social-project-task-graph-group lux-soft-chrome home-hover-chip" data-graph-card-inner="1" style="width:${w}px;height:${h}px;" data-lux-transparency-exempt="1" data-pct="${pct}" ${attentionAttrs}>
                                ${linkHandles}
                                <div class="social-project-task-graph-group-head">
                                    <i class="fas fa-layer-group" aria-hidden="true"></i>
                                    <span class="social-project-task-graph-group-name" title="${escape(text(group?.name || 'Group'))}">${escape(text(group?.name || 'Group'))}</span>
                                    <span class="social-project-task-graph-group-count" title="Absorbed subtree: members, order-linked tasks, and their dependents">${escape(countLabel)}</span>
                                    ${groupRiskCount ? `<button type="button" class="social-project-task-graph-group-risk-badge home-hover-chip" data-action="project-risk-open" data-project-id="${escape(projectId)}" data-group-id="${escape(groupId)}" title="${groupRiskCount} risk${groupRiskCount === 1 ? '' : 's'}" aria-label="${groupRiskCount} risks"><i class="fas fa-triangle-exclamation" aria-hidden="true"></i> ${groupRiskCount}</button>` : ''}
                                    <button type="button" class="social-project-task-graph-group-btn" data-action="project-task-graph-group-rename" data-project-id="${escape(projectId)}" data-group-id="${escape(groupId)}" title="Edit package" aria-label="Edit package"><i class="fas fa-pen" aria-hidden="true"></i></button>
                                    <button type="button" class="social-project-task-graph-group-btn is-danger" data-action="project-task-graph-group-delete" data-project-id="${escape(projectId)}" data-group-id="${escape(groupId)}" title="Delete group" aria-label="Delete group"><i class="fas fa-trash" aria-hidden="true"></i></button>
                                </div>
                                ${progressBlock}
                                ${signalsBlock}
                                <div class="social-project-task-graph-group-metrics">
                                    ${moneyPill}
                                    ${timePill}
                                    ${rangePill}
                                </div>
                                <div class="social-project-task-graph-group-foot">
                                    ${assigneeChip}
                                </div>
                                ${emptyBody}
                            </div>
                        </div>
                    </foreignObject>
                </g>`;
        }

        function renderProjectTaskGraphCardNode(project, node, position, options = {}) {
            const compact = Boolean(options.compact);
            const task = node.task;
            const taskId = text(task.id);
            const statusId = text(task?.status || 'todo') || 'todo';
            const column = PROJECT_TASK_COLUMNS.find((entry) => entry.id === statusId) || PROJECT_TASK_COLUMNS[0];
            const isInProgress = statusId === 'in-progress';
            const isDone = statusId === 'done';
            const isBlocked = statusId === 'blocked';
            const w = position.w || (compact ? PROJECT_TASK_GRAPH_CARD_COMPACT_W : PROJECT_TASK_GRAPH_CARD_W);
            const h = position.h || (compact ? PROJECT_TASK_GRAPH_CARD_COMPACT_H : PROJECT_TASK_GRAPH_CARD_H);
            const foPad = compact ? 8 : PROJECT_TASK_GRAPH_FO_PAD;
            const cx = Math.round(position.x);
            const cy = Math.round(position.y);
            const x = cx - Math.round(w / 2);
            const y = cy - Math.round(h / 2);
            const assignee = accountById(task?.assigneeUserId) || { id: task?.assigneeUserId };
            const isMilestone = Boolean(task?.isMilestone);
            const startAt = text(task?.startAt || '');
            const dueAt = text(task?.dueAt || '');
            const scheduleStartAt = text(project?.scheduleStartAt || '');
            const sched = options.schedule || null;
            const derivedStartLabel = !startAt && scheduleStartAt && sched
                ? formatProjectScheduleDate(scheduleStartAt, sched.earliestStartHours)
                : '';
            const derivedFinishLabel = !dueAt && scheduleStartAt && sched
                ? formatProjectScheduleDate(scheduleStartAt, sched.earliestFinishHours)
                : '';
            const formatGraphCardDate = (iso) => {
                const ms = Date.parse(text(iso || ''));
                if (!Number.isFinite(ms)) return '';
                try {
                    return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                } catch (error) {
                    return when(iso);
                }
            };
            const startLabel = startAt ? formatGraphCardDate(startAt) : derivedStartLabel;
            const dueLabel = dueAt ? formatGraphCardDate(dueAt) : derivedFinishLabel;
            const dueMs = Number.isFinite(Date.parse(dueAt)) ? Date.parse(dueAt) : null;
            const now = Date.now();
            const isOverdue = Boolean(dueMs && dueMs < now && statusId !== 'done');
            const isToday = Boolean(dueMs && !isOverdue && new Date(dueMs).toDateString() === new Date(now).toDateString());
            const isSoon = Boolean(dueMs && !isOverdue && !isToday && dueMs < now + 7 * 86400000);
            const dashboard = options.dashboard === true;
            const interactive = options.interactive !== false;
            const selectedId = text(options.selectedId || '');
            const linkFromId = text(options.linkFromId || '');
            const dragAttrs = options.draggable ? ' data-graph-draggable="1"' : '';
            const detailAction = interactive && !dashboard ? ' data-action="project-task-detail-open"' : '';
            const selectAction = dashboard ? ' data-action="project-task-graph-select-node"' : '';
            const cardActionAttrs = dashboard
                ? ` data-action="project-task-graph-select-node" data-project-id="${escape(text(project.id))}" data-task-id="${escape(taskId)}"`
                : (interactive ? ` data-action="project-task-detail-open" data-project-id="${escape(text(project.id))}" data-task-id="${escape(taskId)}"` : '');
            const graphMode = normalizeProjectTaskGraphMode(options.graphMode || 'browse');
            // Wire handles: drag teal (out) → blue (in) to create depends-on between boxes.
            const showPorts = dashboard && options.linkable !== false && !compact;
            const highlightOverdue = options.highlightOverdue === true;
            const highlightBlocked = options.highlightBlocked === true;
            const priorityDisplay = resolveProjectTaskPriorityDisplay(task);
            const currency = project?.budgetCurrency || 'USD';
            const scheduleEst = resolveTaskScheduleEstimate(task);
            const budgetLabel = formatProjectTaskBudgetEstimate(task?.budgetEstimate, currency);
            const titleLabel = formatProjectTaskGraphNodeLabel(task?.title || 'Task', compact);
            const estimateLabel = isMilestone
                ? ''
                : (scheduleEst.estimate > 0
                    ? (taskHasPert(task) ? `PERT ${formatTaskTime(scheduleEst.estimate, scheduleEst.unit)}` : formatTaskTime(scheduleEst.estimate, scheduleEst.unit))
                    : '');
            const actualTimeValue = !isMilestone ? normalizeTaskTime(task?.actualTime) : 0;
            const actualTimeLabel = !isMilestone
                ? (actualTimeValue > 0
                    ? formatTaskTime(actualTimeValue, scheduleEst.unit || normalizeTaskTimeUnit(task?.timeUnit) || 'h')
                    : `0${normalizeTaskTimeUnit(scheduleEst.unit || task?.timeUnit || 'h')}`)
                : '';
            const actualCostValue = Math.max(0, Math.round((Number(task?.actualCost) || 0) * 100) / 100);
            const actualCostLabel = formatProjectTaskBudgetEstimate(actualCostValue, currency)
                || formatProjectTaskBudgetEstimate(0, currency)
                || `0 ${currency}`;
            const priorityPillTitle = priorityDisplay.tooltip ? ` title="${escape(priorityDisplay.tooltip)}"` : '';
            const matrixPillMarkup = `<span class="social-neo-pill home-hover-chip social-project-task-graph-card-priority social-project-task-graph-card-priority--matrix" data-priority="${escape(priorityDisplay.bucket)}"${priorityPillTitle}><i class="fas ${escape(priorityDisplay.icon)}" aria-hidden="true"></i>${escape(priorityDisplay.label)}<small class="social-project-task-graph-card-score">I${escape(String(priorityDisplay.impact))}·E${escape(String(priorityDisplay.effort))}</small></span>`;
            // Critical-path + slack + ES/EF (schedule). Passed from parent when computed (dashboard or preview).
            const showCriticalPaint = options.showCritical !== false;
            const schedDisp = sched
                ? formatTaskScheduleDisplay(sched, {
                    scheduleStartAt: text(project?.scheduleStartAt || ''),
                    needEstimate: statusId !== 'done' && !isMilestone,
                    isMilestone,
                    statusId
                })
                : null;
            // Card stays task-local: duration + critical only. Total float vs project end lives in detail/inspector.
            const slackPill = (schedDisp?.isCritical && showCriticalPaint && !isDone)
                ? (isBlocked
                    ? `<span class="social-project-task-graph-card-schedule-pill home-hover-chip is-critical is-blocked" title="Blocked on the critical path — this holds the project finish"><i class="fas fa-ban" aria-hidden="true"></i>critical · blocked</span>`
                    : `<span class="social-project-task-graph-card-schedule-pill home-hover-chip is-critical" title="On the critical path — delay here delays the project finish"><i class="fas fa-route" aria-hidden="true"></i>critical</span>`)
                : '';
            const noEstPill = !compact && schedDisp?.noEstimate
                ? `<span class="social-project-task-graph-card-schedule-pill home-hover-chip is-empty" title="Add time estimate (or PERT) so schedule math can place this task">no est</span>`
                : '';
            const estimateTitle = isMilestone
                ? 'Milestone'
                : (taskHasPert(task)
                    ? 'PERT expected duration for this task (O+4M+P)/6. Clear optimistic / most likely / pessimistic to use a single estimate instead.'
                    : 'This task’s time estimate (used for schedule placement)');
            const estimatePill = estimateLabel
                ? `<span class="social-neo-pill home-hover-chip social-project-task-graph-card-estimate" title="${escape(estimateTitle)}"><i class="fas fa-hourglass-half" aria-hidden="true"></i>${escape(estimateLabel)}</span>`
                : '';
            const actualTimePill = !isMilestone
                ? `<span class="social-neo-pill home-hover-chip social-project-task-graph-card-actual-time" title="Actual time logged on this task"><i class="fas fa-stopwatch" aria-hidden="true"></i>${escape(actualTimeLabel)} act</span>`
                : '';
            const actualCostPill = `<span class="social-neo-pill home-hover-chip social-project-task-graph-card-actual-cost" title="Actual money spent on this task"><i class="fas fa-wallet" aria-hidden="true"></i>${escape(actualCostLabel)} act</span>`;
            const hasAssignee = Boolean(text(task?.assigneeUserId || ''));
            const ownerFull = hasAssignee ? displayName(assignee) : 'Unassigned';
            const ownerShort = hasAssignee
                ? (text(ownerFull).split(/\s+/).filter(Boolean).slice(0, 2).join(' ') || ownerFull)
                : 'Unassigned';
            const ownerPill = hasAssignee
                ? `<span class="social-neo-pill home-hover-chip social-project-task-graph-card-assignee" title="Owner: ${escape(ownerFull)}">${avatar(assignee, 'social-neo-avatar-xs')}<em>${escape(ownerShort)}</em></span>`
                : `<span class="social-neo-pill home-hover-chip social-project-task-graph-card-assignee is-unassigned" title="No owner"><i class="fas fa-user" aria-hidden="true"></i><em>Unassigned</em></span>`;
            const startPill = startLabel
                ? `<span class="social-neo-pill home-hover-chip social-project-task-graph-card-start${!startAt && derivedStartLabel ? ' is-derived' : ''}" title="${startAt ? 'Planned start' : 'Derived from project start + schedule'}"><i class="fas fa-play" aria-hidden="true"></i>${escape(startLabel)}</span>`
                : `<span class="social-neo-pill home-hover-chip social-project-task-graph-card-start is-empty" title="No start date"><i class="fas fa-play" aria-hidden="true"></i>—</span>`;
            const duePill = dueLabel
                ? `<span class="social-neo-pill home-hover-chip social-project-task-graph-card-due${isOverdue ? ' is-overdue' : ''}${!dueAt && derivedFinishLabel ? ' is-derived' : ''}" title="${dueAt ? (isOverdue ? 'Overdue' : 'Due date') : 'Derived from project start + schedule'}"><i class="fas fa-flag-checkered" aria-hidden="true"></i>${escape(dueLabel)}</span>`
                : `<span class="social-neo-pill home-hover-chip social-project-task-graph-card-due is-empty" title="No due date"><i class="fas fa-flag-checkered" aria-hidden="true"></i>—</span>`;
            const linkHandles = showPorts ? `
                            <button type="button" class="social-project-task-graph-link-handle is-side-w is-in" data-action="noop" data-graph-link-port="w" title="Wire port (west · in)" aria-label="West in port"></button>
                            <button type="button" class="social-project-task-graph-link-handle is-side-e is-out" data-action="noop" data-graph-link-port="e" title="Wire port (east · out)" aria-label="East out port"></button>
                            <button type="button" class="social-project-task-graph-link-handle is-side-n is-in" data-action="noop" data-graph-link-port="n" title="Wire port (north · in)" aria-label="North in port"></button>
                            <button type="button" class="social-project-task-graph-link-handle is-side-s is-out" data-action="noop" data-graph-link-port="s" title="Wire port (south · out)" aria-label="South out port"></button>
            ` : '';
            return `
                <g class="social-project-task-graph-node-g${isInProgress ? ' is-active' : ''}${isDone ? ' is-done' : ''}${isBlocked ? ' is-blocked' : ''}${isOverdue ? ' is-overdue' : ''}${selectedId === taskId ? ' is-selected' : ''}${linkFromId === taskId ? ' is-link-source' : ''}${highlightOverdue && isOverdue ? ' is-highlight-overdue' : ''}${highlightBlocked && isBlocked ? ' is-highlight-blocked' : ''}${options.schedule?.isCritical && showCriticalPaint && !isDone ? ' is-critical' : ''}${isMilestone ? ' is-milestone' : ''}"
                    transform="translate(${x},${y})"
                    data-tone="${escape(column.tone)}"
                    data-status="${escape(statusId)}"
                    data-task-id="${escape(taskId)}"
                    data-project-id="${escape(text(project.id))}"
                    data-cx="${cx}" data-cy="${cy}" data-w="${w}" data-h="${h}"
                    ${detailAction}${selectAction}${dragAttrs}
                    role="button" tabindex="0"
                    aria-label="Open task ${escape(text(task?.title || 'Task'))}">
                    <rect class="social-project-task-graph-hit" x="0" y="0" width="${w}" height="${h}"></rect>
                    <foreignObject class="social-project-task-graph-card-fo" x="${-foPad}" y="${-foPad}" width="${w + foPad * 2}" height="${h + foPad * 2}">
                        <div xmlns="http://www.w3.org/1999/xhtml" class="social-project-task-graph-card-fo-inner" style="width:${w + foPad * 2}px;height:${h + foPad * 2}px;padding:${foPad}px;box-sizing:border-box;">
                            <div class="social-project-task-graph-card lux-soft-chrome home-hover-chip${isOverdue ? ' is-overdue' : ''}${isInProgress ? ' is-active' : ''}${compact ? ' is-compact' : ''}${isMilestone ? ' is-milestone' : ''} graph-card-headline" data-graph-card-inner="1" style="width:${w}px;min-height:${h}px;height:${h}px;box-sizing:border-box;" data-status="${escape(statusId)}" data-lux-transparency-exempt="1" title="${escape(text(task?.title || 'Task'))}"${cardActionAttrs}>
                                ${linkHandles}
                                <div class="social-project-task-graph-card-stripe${isMilestone ? ' is-milestone' : ''}" data-status="${escape(statusId)}"></div>
                                <div class="social-project-task-graph-card-body">
                                    <div class="social-project-task-graph-card-headline social-project-task-graph-card-title-row">
                                        ${isMilestone ? '<i class="fas fa-flag social-project-task-graph-card-milestone-icon" aria-hidden="true"></i>' : ''}
                                        <strong class="social-project-task-graph-card-title">${escape(titleLabel)}</strong>
                                    </div>
                                    <div class="social-project-task-graph-card-sub">
                                        ${estimatePill}
                                        ${actualTimePill}
                                        ${slackPill || noEstPill}
                                    </div>
                                    <div class="social-project-task-graph-card-mid">
                                        ${isMilestone ? '<span class="social-neo-pill home-hover-chip social-project-task-graph-card-milestone-pill"><i class="fas fa-flag" aria-hidden="true"></i>milestone</span>' : matrixPillMarkup}
                                        ${ownerPill}
                                    </div>
                                    <div class="social-project-task-graph-card-meta">
                                        <span class="social-neo-pill home-hover-chip social-project-task-graph-card-budget${budgetLabel ? '' : ' is-empty'}"><i class="fas fa-coins" aria-hidden="true"></i>${budgetLabel ? escape(budgetLabel) : '—'}</span>
                                        ${actualCostPill}
                                    </div>
                                    <div class="social-project-task-graph-card-dates">
                                        ${startPill}
                                        ${duePill}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </foreignObject>
                </g>
            `;
        }

        /** Port role: W/N = in (successor sink), E/S = out (predecessor source). */

        function renderProjectTaskGraphEdgeGroupsHtml(project, layout, options = {}) {
            // Default: only explicit dependencies (user-created). Flow/inferred opt-in.
            const edges = (options.edges || layout.edges || []).filter((edge) => {
                if (edge.kind === 'explicit') return true;
                if (edge.kind === 'flow') return options.showFlow === true;
                if (edge.kind === 'inferred') return options.showInferred === true;
                return false;
            });
            const markerSuffix = options.markerSuffix || '';
            const compact = Boolean(layout.metrics?.compact) || Boolean(options.compact);
            const unlinkable = options.dashboard && options.unlinkable !== false;
            const fanByKey = projectTaskGraphEdgeFanMap(edges);
            const statusLayout = text(layout?.layoutKind || '') === 'status' || options.statusLayout === true;
            const obstacles = projectTaskGraphObstacleList(layout);
            const statusById = {};
            (Array.isArray(layout.nodes) ? layout.nodes : []).forEach((node) => {
                const id = text(node?.id || node?.task?.id);
                if (!id) return;
                statusById[id] = normalizeProjectTaskGraphStatusId(node?.status || node?.task?.status || 'todo');
            });
            // Live free positions from DOM nodes override layout when patching edges only.
            const livePositions = options.livePositions && typeof options.livePositions === 'object'
                ? options.livePositions
                : null;
            return edges.map((edge) => {
                const fromPos = (livePositions && livePositions[edge.from]) || layout.positions[edge.from];
                const toPos = (livePositions && livePositions[edge.to]) || layout.positions[edge.to];
                if (!fromPos || !toPos) return '';
                const edgeKey = `${text(edge.from)}->${text(edge.to)}`;
                const isCritical = options.showCritical !== false
                    && Boolean(options.criticalEdges && options.criticalEdges.has(edgeKey));
                const baseFan = fanByKey[edgeKey] || 0;
                const pathMeta = {
                    fanOffset: baseFan,
                    statusLayout,
                    obstacles,
                    fromId: text(edge.from),
                    toId: text(edge.to)
                };
                const path = projectTaskGraphEdgePath(fromPos, toPos, pathMeta);
                // Critical: keep normal wire + second parallel purple twin (do not recolor base stroke).
                const twinPath = isCritical
                    ? projectTaskGraphEdgePath(fromPos, toPos, { ...pathMeta, fanOffset: baseFan + 6 })
                    : null;
                const fromStatus = statusById[text(edge.from)] || 'todo';
                const toStatus = statusById[text(edge.to)] || 'todo';
                let marker = '';
                let strokePaint = '';
                if (edge.kind === 'explicit') {
                    const toColor = projectTaskGraphStatusEdgeColor(toStatus);
                    strokePaint = ` stroke="${toColor}"`;
                    marker = ` marker-end="url(#socialProjectTaskGraphArrow-status-${escape(toStatus)}${markerSuffix})"`;
                } else if (edge.kind === 'flow') {
                    marker = ` marker-end="url(#socialProjectTaskGraphArrow-flow${markerSuffix})"`;
                }
                const midX = path.midX;
                const midY = path.midY;
                const edgeTitle = edge.kind === 'explicit'
                    ? `Depends on · waiting task is ${toStatus}`
                    : edge.kind === 'flow'
                        ? 'Status flow (not a real dependency)'
                        : 'Suggested link (not a real dependency)';
                const pathD = path.d;
                const hitMarkup = edge.kind === 'explicit' && unlinkable && !compact
                    ? `<path class="social-project-task-graph-edge-hit" d="${pathD}" fill="none"></path>`
                    : '';
                const unlinkMarkup = edge.kind === 'explicit' && unlinkable && !compact
                    ? `<g class="social-project-task-graph-edge-unlink" data-action="project-task-graph-unlink-edge" data-project-id="${escape(text(project.id))}" data-task-id="${escape(edge.to)}" data-from-id="${escape(edge.from)}" transform="translate(${midX},${midY})" role="button" tabindex="0" aria-label="Remove dependency">
                        <circle class="social-project-task-graph-edge-unlink-bg" r="10"></circle>
                        <text class="social-project-task-graph-edge-unlink-label" text-anchor="middle" dy="3.5">×</text>
                    </g>`
                    : '';
                const criticalMarker = isCritical
                    ? ` marker-end="url(#socialProjectTaskGraphArrow-critical${escape(markerSuffix)})"`
                    : '';
                const criticalTwin = twinPath
                    ? `<path class="social-project-task-graph-edge is-critical-twin" data-edge-kind="critical" d="${twinPath.d}" fill="none"${criticalMarker}></path>`
                    : '';
                return `
                    <g class="social-project-task-graph-edge-group is-${escape(edge.kind)}${isCritical ? ' is-critical' : ''}" data-edge-from="${escape(edge.from)}" data-edge-to="${escape(edge.to)}" data-edge-kind="${escape(edge.kind)}" data-edge-mode="${escape(path.mode)}" data-from-status="${escape(fromStatus)}" data-to-status="${escape(toStatus)}"${isCritical ? ' data-critical="1"' : ''}>
                        <title>${escape(edgeTitle)}${isCritical ? ' · critical path' : ''}</title>
                        ${hitMarkup}
                        <path class="social-project-task-graph-edge is-${escape(edge.kind)}" data-edge-kind="${escape(edge.kind)}" data-from-status="${escape(fromStatus)}" data-to-status="${escape(toStatus)}" d="${pathD}" fill="none"${strokePaint}${marker}></path>
                        ${criticalTwin}
                        ${unlinkMarkup}
                    </g>
                `;
            }).join('');
        }

        function renderProjectTaskGraphGroupEdgesHtml(project, layout, options = {}) {
            // Groups show on full map (dashboard) and read-only preview
            if (options.dashboard !== true && options.preview !== true && options.showGroups !== true) return '';
            const groups = getProjectTaskGraphGroups(state(), text(project.id));
            if (!groups.length) return '';
            const saved = getProjectTaskGraphPositions(state(), text(project.id));
            const live = options.livePositions && typeof options.livePositions === 'object' ? options.livePositions : null;
            const groupPos = (group) => {
                const id = text(group.id);
                const livePos = live && live[id];
                if (livePos && Number.isFinite(Number(livePos.x))) {
                    return { x: Number(livePos.x), y: Number(livePos.y), w: GROUP_NODE_W, h: GROUP_NODE_H };
                }
                return resolveProjectTaskGraphGroupBox(group, layout, saved, {
                    statusLayout: text(layout?.layoutKind || '') === 'status' || options.statusLayout === true,
                    skipDefault: false
                });
            };
            const taskPos = (id) => (live && live[id]) || layout.positions[text(id)];
            let out = '';
            groups.forEach((group) => {
                const gp = groupPos(group);
                const validMembers = (Array.isArray(group.memberTaskIds) ? group.memberTaskIds : [])
                    .map((id) => text(id))
                    .filter((id) => id && taskPos(id));
                validMembers.forEach((taskId) => {
                    const tp = taskPos(taskId);
                    if (!tp) return;
                    const path = projectTaskGraphEdgePath(tp, gp, { fromId: text(taskId), toId: text(group.id) });
                    const unlinkMarkup = options.draggable !== false && options.preview !== true
                        ? `<g class="social-project-task-graph-edge-unlink" data-action="project-task-graph-group-remove-member" data-project-id="${escape(text(project.id))}" data-group-id="${escape(text(group.id))}" data-task-id="${escape(text(taskId))}" transform="translate(${path.midX},${path.midY})" role="button" tabindex="0" aria-label="Remove from group">
                            <circle class="social-project-task-graph-edge-unlink-bg" r="10"></circle>
                            <text class="social-project-task-graph-edge-unlink-label" text-anchor="middle" dy="3.5">×</text>
                        </g>`
                        : '';
                    // Membership is not an order arrow — no marker-end (solid/dashed white only).
                    out += `
                        <g class="social-project-task-graph-edge-group is-groupmember" data-edge-from="${escape(text(taskId))}" data-edge-to="${escape(text(group.id))}" data-edge-kind="groupmember">
                            <title>In package “${escape(text(group.name || 'Group'))}” (membership — not schedule order)</title>
                            <path class="social-project-task-graph-edge is-groupmember" d="${path.d}" fill="none"></path>
                            <path class="social-project-task-graph-edge-hit" d="${path.d}" fill="none"></path>
                            ${unlinkMarkup}
                        </g>`;
                });
            });
            // Dependency arrows involving groups (group.dependsOnIds + tasks depending on groups)
            out += renderProjectTaskGraphGroupDependencyEdgesHtml(project, layout, options, { groups, groupPos, taskPos });
            return out;
        }

        function renderProjectTaskGraphGroupDependencyEdgesHtml(project, layout, options = {}, ctx = {}) {
            const groups = Array.isArray(ctx.groups) ? ctx.groups : getProjectTaskGraphGroups(state(), text(project.id));
            const groupPos = ctx.groupPos || ((group) => {
                const saved = getProjectTaskGraphPositions(state(), text(project.id));
                const live = options.livePositions && typeof options.livePositions === 'object' ? options.livePositions : null;
                const id = text(group.id);
                const p = (live && live[id]) || saved[id];
                if (p && Number.isFinite(p.x)) return { x: p.x, y: p.y, w: GROUP_NODE_W, h: GROUP_NODE_H };
                return { x: Number(group.x) || 0, y: Number(group.y) || 0, w: GROUP_NODE_W, h: GROUP_NODE_H };
            });
            const taskPos = ctx.taskPos || ((id) => {
                const live = options.livePositions && typeof options.livePositions === 'object' ? options.livePositions : null;
                return (live && live[text(id)]) || layout.positions[text(id)];
            });
            const posOf = (id) => {
                const key = text(id);
                if (isProjectTaskGraphGroupId(key)) {
                    const g = groups.find((entry) => text(entry.id) === key);
                    return g ? groupPos(g) : null;
                }
                return taskPos(key);
            };
            const markerSuffix = text(options.markerSuffix || '');
            const unlinkable = options.dashboard && options.unlinkable !== false && options.preview !== true;
            const showCritical = options.showCritical !== false;
            const criticalEdges = options.criticalEdges instanceof Set ? options.criticalEdges : null;
            let out = '';
            const emptyGroupIds = new Set(
                groups
                    .filter((g) => (computeProjectTaskGraphGroupRollup(g, project)?.count ?? 0) === 0)
                    .map((g) => text(g.id))
                    .filter(Boolean)
            );
            const emit = (fromId, toId, title) => {
                const from = text(fromId);
                const to = text(toId);
                if (!from || !to || from === to) return;
                const fp = posOf(from);
                const tp = posOf(to);
                if (!fp || !tp) return;
                const path = projectTaskGraphEdgePath(fp, tp, { fromId: from, toId: to, fanOffset: 0 });
                const edgeKey = `${from}->${to}`;
                const isCritical = showCritical && criticalEdges && criticalEdges.has(edgeKey);
                // White package order wire always; purple twin beside it when critical.
                const twinPath = isCritical
                    ? projectTaskGraphEdgePath(fp, tp, { fromId: from, toId: to, fanOffset: 6 })
                    : null;
                const marker = ` marker-end="url(#socialProjectTaskGraphArrow-group-dep${escape(markerSuffix)})"`;
                const criticalMarker = isCritical
                    ? ` marker-end="url(#socialProjectTaskGraphArrow-critical${escape(markerSuffix)})"`
                    : '';
                const criticalTwin = twinPath
                    ? `<path class="social-project-task-graph-edge is-critical-twin is-group-dep" data-edge-kind="critical" d="${twinPath.d}" fill="none"${criticalMarker}></path>`
                    : '';
                const unlinkMarkup = unlinkable
                    ? `<g class="social-project-task-graph-edge-unlink" data-action="project-task-graph-unlink-edge" data-project-id="${escape(text(project.id))}" data-task-id="${escape(to)}" data-from-id="${escape(from)}" transform="translate(${path.midX},${path.midY})" role="button" tabindex="0" aria-label="Remove dependency">
                        <circle class="social-project-task-graph-edge-unlink-bg" r="10"></circle>
                        <text class="social-project-task-graph-edge-unlink-label" text-anchor="middle" dy="3.5">×</text>
                    </g>`
                    : '';
                const emptyPkg = emptyGroupIds.has(from) || emptyGroupIds.has(to);
                const emptyNote = emptyPkg ? ' · order link (package has no member tasks — not membership)' : '';
                out += `
                    <g class="social-project-task-graph-edge-group is-explicit is-group-dep${isCritical ? ' is-critical' : ''}${emptyPkg ? ' is-empty-package-link' : ''}" data-edge-from="${escape(from)}" data-edge-to="${escape(to)}" data-edge-kind="explicit" data-from-status="todo" data-to-status="todo"${isCritical ? ' data-critical="1"' : ''}${emptyPkg ? ' data-empty-package="1"' : ''}>
                        <title>${escape(title)}${escape(emptyNote)}${isCritical ? ' · critical path' : ''}</title>
                        <path class="social-project-task-graph-edge-hit" d="${path.d}" fill="none"></path>
                        <path class="social-project-task-graph-edge is-explicit is-group-dep${emptyPkg ? ' is-empty-package-link' : ''}" data-edge-kind="explicit" data-from-status="todo" data-to-status="todo" d="${path.d}" fill="none" stroke="#ffffff"${marker}></path>
                        ${criticalTwin}
                        ${unlinkMarkup}
                    </g>`;
            };
            groups.forEach((group) => {
                const gid = text(group.id);
                const emptyHint = emptyGroupIds.has(gid) ? ' (empty package — no member tasks)' : '';
                projectGroupDependsOnIds(group).forEach((fromId) => {
                    emit(fromId, gid, `Order link · package “${text(group.name || 'Group')}” waits on predecessor${emptyHint}`);
                });
                // Group is predecessor of these tasks (wire from package → task).
                projectGroupBlocksIds(group).forEach((toId) => {
                    emit(gid, toId, `Order link · package “${text(group.name || 'Group')}” must finish first${emptyHint}`);
                });
            });
            (Array.isArray(project?.tasks) ? project.tasks : []).forEach((task) => {
                const tid = text(task?.id);
                projectTaskDependsOnIds(task).forEach((depId) => {
                    if (isProjectTaskGraphGroupId(depId)) {
                        // Skip if already emitted via group.blocksIds
                        const g = groups.find((entry) => text(entry.id) === depId);
                        if (g && projectGroupBlocksIds(g).includes(tid)) return;
                        emit(depId, tid, `Depends on package · “${text(task?.title || 'Task')}” waits`);
                    }
                });
            });
            return out;
        }

        function renderProjectTaskGraphSvg(project, layout, options = {}) {
            const compact = Boolean(layout.metrics?.compact);
            const graphMode = normalizeProjectTaskGraphMode(options.graphMode || 'explore');
            const schedule = options.schedule ?? (options.dashboard === true
                ? computeProjectTaskGraphMapSchedule(state(), project)
                : null);
            const showCritical = options.showCritical !== false;
            const edgeLines = renderProjectTaskGraphGroupEdgesHtml(project, layout, {
                    ...options,
                    criticalEdges: schedule?.criticalEdges || null,
                    showCritical
                })
                + renderProjectTaskGraphEdgeGroupsHtml(project, layout, {
                    ...options,
                    compact,
                    criticalEdges: schedule?.criticalEdges || null,
                    showCritical
                });
            const visibleNodes = Array.isArray(options.visibleNodes) ? options.visibleNodes : layout.nodes;
            const allTasks = visibleNodes.map((node) => node.task).filter(Boolean);
            const graphNodes = visibleNodes.map((node) => {
                const position = layout.positions[node.id];
                if (!position) return '';
                return renderProjectTaskGraphCardNode(project, node, position, {
                    compact,
                    interactive: options.interactive !== false,
                    draggable: options.draggable === true,
                    dashboard: options.dashboard === true,
                    linkable: options.linkable !== false,
                    graphMode,
                    allTasks,
                    selectedId: options.selectedId,
                    linkFromId: options.linkFromId,
                    highlightOverdue: options.highlightOverdue === true,
                    highlightBlocked: options.highlightBlocked === true,
                    schedule: schedule?.byId?.[text(node.id)] || null,
                    showCritical
                });
            }).join('');
            // Group containers: full map + read-only preview. Rendered behind task nodes.
            const showGroups = options.dashboard === true || options.preview === true || options.showGroups === true;
            const groupSavedPositions = showGroups ? getProjectTaskGraphPositions(state(), text(project.id)) : {};
            const groupNodes = showGroups
                ? getProjectTaskGraphGroups(state(), text(project.id)).map((group, emptyIndex) => {
                    const position = resolveProjectTaskGraphGroupBox(group, layout, groupSavedPositions, {
                        statusLayout: text(layout?.layoutKind || '') === 'status' || options.statusLayout === true,
                        emptyIndex,
                        skipDefault: false
                    });
                    const gid = text(group.id);
                    const groupsList = getProjectTaskGraphGroups(state(), text(project.id));
                    return renderProjectTaskGraphGroupNode(project, group, position, {
                        draggable: options.draggable === true && options.preview !== true,
                        dashboard: options.dashboard === true,
                        linkable: options.linkable !== false,
                        preview: options.preview === true,
                        // Package critical paint is finalized inside the node from rollup + schedule.
                        isCritical: showCritical && Boolean(schedule?.byId?.[gid]?.isCritical),
                        selectedId: options.selectedId,
                        scheduleBundle: schedule,
                        groups: groupsList,
                        showCritical
                    });
                }).join('')
                : '';
            const scrollPan = Boolean(options.scrollPan);
            const zoomMin = Number.isFinite(Number(options.minZoom)) ? Number(options.minZoom) : PROJECT_TASK_GRAPH_MIN_ZOOM;
            const zoomMax = Number.isFinite(Number(options.maxZoom)) ? Number(options.maxZoom) : PROJECT_TASK_GRAPH_MAX_ZOOM;
            const zoom = Math.max(zoomMin, Math.min(zoomMax, Number(options.zoom || 1) || 1));
            const bounds = options.contentBounds && typeof options.contentBounds === 'object' ? options.contentBounds : null;
            const defaultSvgW = scrollPan
                ? Math.round((bounds ? Number(bounds.width) || layout.width : layout.width) * zoom)
                : layout.width;
            const defaultSvgH = scrollPan
                ? Math.round((bounds ? Number(bounds.height) || layout.height : layout.height) * zoom)
                : layout.height;
            const svgWidth = options.svgWidth != null ? options.svgWidth : defaultSvgW;
            const svgHeight = options.svgHeight != null ? options.svgHeight : defaultSvgH;
            const viewBox = text(options.viewBox || '')
                || (bounds
                    ? `${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`
                    : `0 0 ${layout.width} ${layout.height}`);
            const preserveAspectRatio = text(options.preserveAspectRatio || '') || (options.preview ? 'xMidYMid meet' : 'xMidYMid meet');
            const overflowAttr = options.preview ? 'hidden' : 'visible';
            const markerSuffix = options.markerSuffix || '';
            const statusMarkers = PROJECT_TASK_COLUMNS.map((column) => `
                        <marker id="socialProjectTaskGraphArrow-status-${escape(column.id)}${markerSuffix}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7.5" markerHeight="7.5" orient="auto">
                            <path d="M 0 0 L 10 5 L 0 10 z" class="social-project-task-graph-arrow is-status is-${escape(column.id)}" fill="${projectTaskGraphStatusEdgeColor(column.id)}"></path>
                        </marker>`).join('');
            const bgX = bounds && Number.isFinite(Number(bounds.minX)) ? Number(bounds.minX) : 0;
            const bgY = bounds && Number.isFinite(Number(bounds.minY)) ? Number(bounds.minY) : 0;
            const bgW = bounds && Number.isFinite(Number(bounds.width)) ? Number(bounds.width) : layout.width;
            const bgH = bounds && Number.isFinite(Number(bounds.height)) ? Number(bounds.height) : layout.height;
            const graphContent = `
                    <rect class="social-project-task-graph-canvas-bg" x="${bgX}" y="${bgY}" width="${bgW}" height="${bgH}"></rect>
                    <g class="social-project-task-graph-edges">${edgeLines}</g>
                    <g class="social-project-task-graph-nodes">${groupNodes}${graphNodes}</g>
            `;
            return `
                <svg class="social-project-task-graph-svg${compact ? ' is-compact' : ''}${options.preview ? ' is-preview' : ''}${text(layout?.layoutKind || '') === 'status' || options.statusLayout ? ' is-status-layout' : ''}" viewBox="${escape(viewBox)}" width="${escape(String(svgWidth))}" height="${escape(String(svgHeight))}" preserveAspectRatio="${escape(preserveAspectRatio)}" data-project-task-graph-svg="1" data-layout-kind="${escape(text(layout?.layoutKind || (options.statusLayout ? 'status' : 'force')))}" overflow="${overflowAttr}">
                    <defs>
                        ${statusMarkers}
                        <marker id="socialProjectTaskGraphArrow-flow${markerSuffix}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                            <path d="M 0 0 L 10 5 L 0 10 z" class="social-project-task-graph-arrow is-flow"></path>
                        </marker>
                        <marker id="socialProjectTaskGraphArrow-group-dep${markerSuffix}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7.5" markerHeight="7.5" orient="auto">
                            <path d="M 0 0 L 10 5 L 0 10 z" class="social-project-task-graph-arrow is-group-dep" fill="#ffffff"></path>
                        </marker>
                        <marker id="socialProjectTaskGraphArrow-critical${markerSuffix}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7.5" markerHeight="7.5" orient="auto">
                            <path d="M 0 0 L 10 5 L 0 10 z" class="social-project-task-graph-arrow is-critical" fill="#a855f7"></path>
                        </marker>
                    </defs>
                    ${graphContent}
                </svg>
            `;
        }

        function renderProjectTaskGraphCanvas(project, layout, options = {}) {
            // Full map + preview share the same zoom floor so fit/reset framing is preserved.
            const minZoom = Number.isFinite(Number(options.minZoom)) ? Number(options.minZoom) : PROJECT_TASK_GRAPH_MIN_ZOOM;
            const maxZoom = Number.isFinite(Number(options.maxZoom)) ? Number(options.maxZoom) : 1.6;
            const zoom = Math.max(minZoom, Math.min(maxZoom, Number(options.zoom || 1) || 1));
            const fullscreen = Boolean(options.fullscreen);
            const panX = Math.round(Number(options.panX) || 0);
            const panY = Math.round(Number(options.panY) || 0);
            if (fullscreen) {
                const bounds = options.contentBounds && typeof options.contentBounds === 'object'
                    ? options.contentBounds
                    : null;
                const layoutW = bounds
                    ? Math.max(1, Math.round(Number(bounds.width) || layout.width || 1))
                    : layout.width;
                const layoutH = bounds
                    ? Math.max(1, Math.round(Number(bounds.height) || layout.height || 1))
                    : layout.height;
                const scaledWidth = Math.round(layoutW * zoom);
                const scaledHeight = Math.round(layoutH * zoom);
                const slack = resolveProjectTaskGraphPanSlack(Math.max(scaledWidth, scaledHeight));
                const surfaceWidth = scaledWidth + (slack * 2);
                const surfaceHeight = scaledHeight + (slack * 2);
                return `
                    <div class="social-project-task-graph-canvas is-fullscreen" data-project-task-graph-canvas="1" data-scroll-pan="1" data-ptg-scroll-init-pending="1" data-layout-width="${escape(String(layoutW))}" data-layout-height="${escape(String(layoutH))}" data-zoom="${escape(String(zoom))}" data-pan-x="${escape(String(panX))}" data-pan-y="${escape(String(panY))}" data-lux-transparency-exempt="1">
                        <div class="social-project-task-graph-scroll-surface" data-project-task-graph-scroll-surface="1" data-lux-transparency-exempt="1" style="--ptg-pan-slack:${slack}px; width:${surfaceWidth}px; height:${surfaceHeight}px;">
                            <div class="social-project-task-graph-canvas-inner" data-lux-transparency-exempt="1" style="width:${scaledWidth}px; height:${scaledHeight}px;">
                                ${renderProjectTaskGraphSvg(project, layout, { ...options, zoom, scrollPan: true })}
                            </div>
                        </div>
                    </div>
                `;
            }
            return `
                <div class="social-project-task-graph-canvas${options.compact ? ' is-compact' : ''}" data-project-task-graph-canvas="1" data-zoom="${escape(String(zoom))}" data-lux-transparency-exempt="1" style="width:${Math.round(layout.width * zoom)}px; height:${Math.round(layout.height * zoom)}px;">
                    <div class="social-project-task-graph-canvas-inner" data-lux-transparency-exempt="1" style="transform: scale(${zoom}); transform-origin: top left; width:${layout.width}px; height:${layout.height}px;">
                        ${renderProjectTaskGraphSvg(project, layout, options)}
                    </div>
                </div>
            `;
        }

        function renderProjectTaskGraphHistoryDialog(runtime, dialog) {
            const projectId = text(dialog?.projectId || runtime.ui?.activeProjectId || '');
            const project = resolveActiveSocialProject(runtime, projectId);
            const list = readProjectTaskGraphCheckpoints(projectId);
            const pendingDeleteId = text(runtime.ui?.projectTaskGraphHistoryPendingDeleteId || '');
            const rows = list.length
                ? list.map((entry, index) => {
                    const sid = text(entry.id);
                    const pending = pendingDeleteId === sid;
                    const when = formatProjectTaskGraphCheckpointWhen(entry.savedAt) || entry.label;
                    const groupCount = Array.isArray(entry.taskGraphGroups) ? entry.taskGraphGroups.length : 0;
                    const posCount = entry.taskGraphPositions && typeof entry.taskGraphPositions === 'object'
                        ? Object.keys(entry.taskGraphPositions).length
                        : 0;
                    return `
                        <div class="sptg-history-row lux-control-btn${pending ? ' is-pending-delete' : ''}${index === 0 ? ' is-latest' : ''}" data-snapshot-id="${escape(sid)}">
                            <div class="sptg-history-row-meta">
                                <strong>${escape(entry.label || when)}</strong>
                                <span class="social-neo-muted">${groupCount} package${groupCount === 1 ? '' : 's'} · ${posCount} positions${index === 0 ? ' · latest' : ''}</span>
                            </div>
                            <div class="sptg-history-row-actions">
                                <button class="lux-primary-btn" type="button" data-action="project-task-graph-history-restore" data-project-id="${escape(projectId)}" data-snapshot-id="${escape(sid)}"><i class="fas fa-clock-rotate-left" aria-hidden="true"></i> Restore</button>
                                <button class="lux-secondary-btn ${pending ? 'lux-primary-btn lux-btn-danger' : 'lux-secondary-btn'}" type="button" data-action="${pending ? 'project-task-graph-history-delete-confirm' : 'project-task-graph-history-delete'}" data-project-id="${escape(projectId)}" data-snapshot-id="${escape(sid)}">
                                    <i class="fas fa-trash" aria-hidden="true"></i> ${pending ? 'Confirm delete' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    `;
                }).join('')
                : `<div class="social-neo-empty sptg-history-empty">No saves yet. Click <strong>Save</strong> on the map to create one.</div>`;
            return `
                <section class="social-page-surface social-project-task-graph-history-page sptg-history-dialog" data-social-page-surface="project-task-graph-history" data-action="noop" aria-label="Map save history">
                    <header class="social-page-surface-head">
                        <div class="social-page-surface-heading">
                            <strong><i class="fas fa-clock-rotate-left" aria-hidden="true"></i> Map save history</strong>
                            <span>${escape(text(project?.name || 'Project'))} · up to ${PROJECT_TASK_GRAPH_CHECKPOINT_MAX} saves</span>
                        </div>
                        <button class="lux-ghost-btn" type="button" data-action="dialog-close" aria-label="Back to task map"><i class="fas fa-arrow-left"></i> Back</button>
                    </header>
                    <div class="social-page-surface-body sptg-history-list">
                        ${rows}
                    </div>
                    ${neoActions({
                        cancelLabel: 'Back to task map',
                        submitLabel: 'Save now',
                        submitIcon: 'fas fa-floppy-disk',
                        submitType: 'button',
                        submitAttrs: `data-action="project-task-graph-save" data-project-id="${escape(projectId)}"`
                    })}
                </section>
            `;
        }

        function renderProjectTaskGraphScheduleHelpDialog(runtime, dialog) {
            const projectId = text(dialog?.projectId || runtime.ui?.activeProjectId || '');
            const project = resolveActiveSocialProject(runtime, projectId);
            const terms = [
                ['Duration', 'How long the work takes. Comes from the task estimate or a three-point PERT (optimistic / most likely / pessimistic).'],
                ['Path type', 'Critical path means float is zero — any delay on this task delays the whole project. Non-critical tasks have slack and can slip a little without moving the end date.'],
                ['Float (can slip)', 'How much this task can slip without delaying the project finish. Calculated as Latest start − Earliest start (work hours; 8h = 1d on cards). Not the same as duration. Zero float = critical path.'],
                ['Earliest start', 'The soonest this task can begin after all predecessors finish (forward pass through the network).'],
                ['Earliest finish', 'Earliest start plus duration — the soonest this task can end.'],
                ['Latest start', 'The latest this task can begin without delaying the project end date (backward pass through the network).'],
                ['Latest finish', 'Latest start plus duration — the latest this task can end without delaying the project.'],
                ['Forward pass', 'Walks the map from start to end to compute earliest start and earliest finish for every task.'],
                ['Backward pass', 'Walks from the project end back to the start to compute latest start and latest finish.']
            ];
            const rows = terms.map(([term, meaning]) => `
                <div class="sptg-schedule-help-row lux-control-btn">
                    <strong>${escape(term)}</strong>
                    <p>${escape(meaning)}</p>
                </div>
            `).join('');
            return `
                <section class="social-page-surface social-project-task-graph-schedule-page sptg-schedule-help-dialog" data-social-page-surface="project-task-graph-schedule-help" data-action="noop" aria-label="Schedule terms">
                    <header class="social-page-surface-head">
                        <div class="social-page-surface-heading">
                            <strong><i class="fas fa-circle-question" aria-hidden="true"></i> Schedule terms</strong>
                            <span>${escape(text(project?.name || 'Project'))} · critical path method (CPM)</span>
                        </div>
                        <button class="lux-ghost-btn" type="button" data-action="dialog-close" aria-label="Back to task map"><i class="fas fa-arrow-left"></i> Back</button>
                    </header>
                    <div class="social-page-surface-body sptg-schedule-help-list">
                        ${rows}
                    </div>
                    ${neoActions({
                        hideCancel: true,
                        submitLabel: 'Back to task map',
                        submitType: 'button',
                        submitAttrs: 'data-action="dialog-close"'
                    })}
                </section>
            `;
        }

        /** Live-refresh Tasks desk body even while keep-center graph dialog is open. */

        function buildProjectTaskGraphCanvasMarkup(runtime, dialog) {
            const ctx = resolveProjectTaskGraphContext(runtime, dialog);
            if (!ctx) return '';
            const { project, projectTasks, showInferred, showFlow, model } = ctx;
            const canContribute = Boolean(project.viewerCanContribute);
            const graphMode = normalizeProjectTaskGraphMode(runtime.ui?.projectTaskGraphMode || 'browse');
            const stageSize = computeProjectTaskGraphStageSize(runtime);
            let layout = buildProjectTaskGraphLayout(model, runtime, stageSize);
            const savedPositions = ensureProjectTaskGraphPositionsLoaded(runtime, text(project?.id || dialog?.projectId || ''));
            // Free placement only for force/free layout — status columns must keep column positions.
            if (projectTaskGraphLayoutUsesSavedPositions(layout, runtime)) {
                layout = applyProjectTaskGraphSavedPositions(layout, savedPositions);
            }
            const groupBoxes = collectProjectTaskGraphGroupBoxes(runtime, text(project?.id || ''), layout, savedPositions);
            const { bounds, viewBox } = projectTaskGraphContentViewBox(layout, groupBoxes, 36);
            const zoom = clampProjectTaskGraphZoom(Number(runtime.ui?.projectTaskGraphZoom || computeProjectTaskGraphFitZoom(layout, stageSize.stageWidth, stageSize.stageHeight)) || 1);
            const pan = readProjectTaskGraphPan(runtime);
            const selectedId = text(runtime.ui?.projectTaskGraphSelectedId || '');
            const linkFromId = text(runtime.ui?.projectTaskGraphLinkFrom || '');
            const showCanvas = projectTasks.length > 0 || canContribute;
            if (!showCanvas) {
                const emptyCopy = ctx.mineOnly
                    ? 'No open tasks assigned to you. Turn off Only mine to see the full map.'
                    : 'No tasks yet. Double-click the canvas to add a task where you click.';
                return `<div class="social-neo-empty social-project-task-graph-empty">${emptyCopy}</div>`;
            }
            return renderProjectTaskGraphCanvas(project, layout, {
                zoom,
                panX: pan.x,
                panY: pan.y,
                edges: model.edges,
                showInferred,
                showFlow,
                graphMode,
                draggable: canContribute,
                dashboard: true,
                fullscreen: true,
                linkable: canContribute,
                unlinkable: canContribute,
                selectedId,
                linkFromId,
                highlightOverdue: runtime.ui?.projectTaskGraphHighlightOverdue === true,
                highlightBlocked: runtime.ui?.projectTaskGraphHighlightBlocked === true,
                markerSuffix: '-fullscreen',
                viewBox,
                contentBounds: bounds
            });
        }

        function renderProjectTaskGraphHealth(projectTasks = [], runtime = {}) {
            const now = Date.now();
            const counts = Object.fromEntries(PROJECT_TASK_COLUMNS.map((column) => [column.id, 0]));
            let overdue = 0;
            let unassigned = 0;
            (Array.isArray(projectTasks) ? projectTasks : []).forEach((task) => {
                const status = text(task?.status || 'todo');
                if (counts[status] !== undefined) counts[status] += 1;
                const dueMs = Date.parse(text(task?.dueAt));
                if (dueMs && dueMs < now && status !== 'done') overdue += 1;
                if (!task?.assigneeUserId) unassigned += 1;
            });
            return `
                <div class="social-project-task-graph-health">
                    <div class="social-project-task-graph-health-grid">
                        ${PROJECT_TASK_COLUMNS.map((column) => `
                            <div class="social-project-task-graph-health-metric lux-soft-chrome is-${escape(column.tone)}" data-status="${escape(column.id)}">
                                <strong>${escape(String(counts[column.id] || 0))}</strong>
                                <span>${escape(column.label)}</span>
                            </div>
                        `).join('')}
                    </div>
                    ${overdue || unassigned ? `
                        <div class="social-project-task-graph-health-alerts">
                            ${overdue ? `<span class="social-project-task-graph-health-alert is-overdue"><i class="fas fa-exclamation-circle" aria-hidden="true"></i> ${escape(String(overdue))} overdue</span>` : ''}
                            ${unassigned ? `<span class="social-project-task-graph-health-alert is-unassigned"><i class="fas fa-user-slash" aria-hidden="true"></i> ${escape(String(unassigned))} unassigned</span>` : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        function renderProjectTaskGraphScheduleOverview(project, runtime = state()) {
            const scope = resolveProjectTaskGraphScheduleScope(runtime, project);
            const sched = computeProjectSchedule(
                { ...project, tasks: scope.tasks },
                { groups: scope.groups }
            );
            const totalDuration = sched.projectEndHours;
            const criticalCount = sched.criticalChain.length;
            const taskCount = scope.tasks.length;
            const scheduleStartAt = text(project?.scheduleStartAt || '');
            const plannedFinishDate = scheduleStartAt ? formatProjectScheduleDate(scheduleStartAt, totalDuration) : '';
            const byId = new Map(scope.tasks.map((t) => [text(t?.id), t]));
            const chainTitles = (sched.criticalChain || [])
                .slice(0, 4)
                .map((id) => text(byId.get(id)?.title || id))
                .filter(Boolean);
            const chainHint = chainTitles.length
                ? chainTitles.join(' → ') + ((sched.criticalChain || []).length > 4 ? ' …' : '')
                : '';
            const noEstOpen = scope.tasks.filter((t) => {
                if (text(t?.status) === 'done' || t?.isMilestone) return false;
                return taskDurationHours(t) <= 0;
            }).length;
            if (!taskCount) {
                if (!scope.mineOnly) return '';
                return `
                <section class="lux-card social-project-task-graph-rail-overview-section lux-soft-chrome">
                    <div class="lux-card-head social-project-task-graph-rail-overview-head">
                        <strong class="lux-card-title">Schedule</strong>
                        <span class="lux-card-meta">Your tasks only</span>
                    </div>
                    <p class="social-project-task-graph-schedule-empty-hint social-neo-muted lux-card-copy">No open tasks assigned to you — turn off Only mine for the full project schedule.</p>
                </section>`;
            }
            const scopeLabel = scope.mineOnly ? 'Your tasks only' : 'ES / EF · float · critical path';
            const finishHint = scope.mineOnly
                ? 'shortest finish among your open tasks (and their links on this map)'
                : 'if every task starts as early as its dependencies allow (8h workday)';
            const criticalHint = chainHint
                ? escape(chainHint)
                : (scope.mineOnly
                    ? 'tasks on the critical path of your filtered map'
                    : 'any delay here delays the whole project');
            return `
                <section class="lux-card social-project-task-graph-rail-overview-section lux-soft-chrome">
                    <div class="lux-card-head social-project-task-graph-rail-overview-head">
                        <strong class="lux-card-title">Schedule</strong>
                        <span class="lux-card-meta">${escape(scopeLabel)}</span>
                    </div>
                    <div class="social-project-task-graph-schedule-overview lux-card-body" data-lux-transparency-exempt="1">
                        <div class="social-project-task-graph-schedule-stat lux-stat">
                            <span class="social-project-task-graph-schedule-stat-label">${escape('Shortest finish')}</span>
                            <strong class="social-project-task-graph-schedule-stat-value">${escape(formatProjectScheduleHours(totalDuration))}</strong>
                            <em class="social-project-task-graph-schedule-stat-hint">${escape(finishHint)}</em>
                        </div>
                        ${plannedFinishDate ? `<div class="social-project-task-graph-schedule-stat lux-stat">
                            <span class="social-project-task-graph-schedule-stat-label">Planned finish</span>
                            <strong class="social-project-task-graph-schedule-stat-value">${escape(plannedFinishDate)}</strong>
                            <em class="social-project-task-graph-schedule-stat-hint">from project start date + shortest finish (no weekends)</em>
                        </div>` : ''}
                        <div class="social-project-task-graph-schedule-stat lux-stat">
                            <span class="social-project-task-graph-schedule-stat-label">Critical path</span>
                            <strong class="social-project-task-graph-schedule-stat-value is-critical">${escape(String(criticalCount))} task${criticalCount === 1 ? '' : 's'}</strong>
                            <em class="social-project-task-graph-schedule-stat-hint">${criticalHint}</em>
                        </div>
                        ${totalDuration <= 0 && noEstOpen > 0
                            ? `<p class="social-project-task-graph-schedule-empty-hint social-neo-muted lux-card-copy">${escape(String(noEstOpen))} open task${noEstOpen === 1 ? '' : 's'} lack estimates — add O/M/P or duration to unlock critical path.</p>`
                            : ''}
                    </div>
                </section>
            `;
        }

        function renderProjectTaskGraphRailOverview(project, runtime, projectTasks = []) {
            // Tasks-by-status + progress live in the map footer only (avoid duplicate chrome).
            return `
                <div class="social-project-task-graph-rail-overview" data-lux-transparency-exempt="1">
                    ${renderProjectTaskGraphScheduleOverview(project, runtime)}
                </div>
            `;
        }

        function renderProjectTaskGraphQuickCreatePopover(project, runtime) {
            const quick = runtime.ui?.projectTaskGraphQuickCreate;
            if (!quick?.open || !project?.viewerCanContribute) return '';
            const x = Math.max(12, Number(quick.x) || 120);
            const y = Math.max(12, Number(quick.y) || 120);
            const graphX = Math.round(Number(quick.graphX ?? quick.x) || 120);
            const graphY = Math.round(Number(quick.graphY ?? quick.y) || 120);
            const titleValue = text(quick.title || '');
            const statusValue = text(quick.status || 'todo') || 'todo';
            const quickError = text(quick.error || '');
            const linkFrom = text(runtime.ui?.projectTaskGraphLinkFrom || '');
            const statusOptions = PROJECT_TASK_COLUMNS.map((column) => `<option value="${escape(column.id)}" ${statusValue === column.id ? 'selected' : ''}>${escape(column.label)}</option>`).join('');
            return `
                <form class="social-project-task-graph-quick-create" data-form="project-task-graph-quick-create" data-action="noop" style="left:${x}px; top:${y}px;" data-lux-transparency-exempt="1">
                    <input type="hidden" name="projectId" value="${escape(text(project.id))}">
                    <input type="hidden" name="graphX" value="${graphX}">
                    <input type="hidden" name="graphY" value="${graphY}">
                    ${linkFrom ? `<input type="hidden" name="dependsOnTaskId" value="${escape(linkFrom)}">` : ''}
                    <strong>Quick add task</strong>
                    ${linkFrom ? '<span class="social-neo-muted">Depends on selected source</span>' : ''}
                    ${quickError ? `<p class="social-project-task-graph-quick-create-error" role="alert">${escape(quickError)}</p>` : ''}
                    <label class="social-project-task-graph-quick-create-field">
                        <span class="social-neo-label">Title</span>
                        <input class="social-neo-input lux-control" type="text" name="projectTaskTitle" placeholder="Task title" value="${escape(titleValue)}" required${quickError ? ' aria-invalid="true"' : ''}>
                    </label>
                    <label class="social-project-task-graph-quick-create-field">
                        <span class="social-neo-label">Status</span>
                        <select class="social-neo-select lux-control" name="projectTaskStatus" data-lux-picker>${statusOptions}</select>
                    </label>
                    <div class="social-project-task-graph-quick-create-actions">
                        <button class="lux-secondary-btn lux-secondary-btn-sm lux-glass-dialog-cancel-btn" type="button" data-action="project-task-graph-quick-create-cancel">Cancel</button>
                        <button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="project-task-graph-group-create" data-project-id="${escape(text(project.id))}" data-graph-x="${graphX}" data-graph-y="${graphY}" title="Create a group container here"><i class="fas fa-layer-group" aria-hidden="true"></i> Group</button>
                        <button class="lux-primary-btn lux-secondary-btn-sm lux-glass-dialog-submit-btn" type="submit">Add node</button>
                    </div>
                </form>
            `;
        }

        function renderProjectTaskGraphDetailRailPlaceholder(project, runtime, tasks = []) {
            return `
                <div class="social-project-task-graph-detail-rail-empty" data-lux-transparency-exempt="1">
                    ${renderProjectTaskGraphRailOverview(project, runtime, tasks)}
                    <section class="lux-card social-project-task-graph-inspector-section-card lux-soft-chrome">
                        <div class="lux-card-head">
                            <strong class="lux-card-title">Select a task</strong>
                            <span class="lux-card-meta">Click any card on the map to review status, people, links, and quick actions.</span>
                        </div>
                    </section>
                </div>
            `;
        }

        function renderProjectTaskGraphGroupInspector(project, runtime, group) {
            const groupId = text(group?.id || '');
            const projectId = text(project?.id || '');
            const canContribute = Boolean(project?.viewerCanContribute);
            const roll = computeProjectTaskGraphGroupRollup(group, project);
            const budgetLabel = formatProjectTaskBudgetEstimate(roll.budget, roll.currency);
            const pct = Math.max(0, Math.min(100, Number(roll.pctComplete) || 0));
            const assigneeId = text(group?.assigneeUserId || '');
            const memberSummaries = Array.isArray(project?.memberSummaries) ? project.memberSummaries : [];
            const workloadMap = new Map((Array.isArray(project?.workloadByMember) ? project.workloadByMember : []).map((entry) => [text(entry.userId), entry]));
            const assigneeOptions = `
                <option value="">Unassigned</option>
                ${memberSummaries.map((entry) => {
                    const userId = text(entry.userId);
                    const wl = workloadMap.get(userId);
                    const wlSuffix = wl && countNum(wl.count) > 0 ? ` · ${countNum(wl.count)} tasks · ${formatProjectScheduleHours(Number(wl.hours) || 0)}` : '';
                    return `<option value="${escape(userId)}" ${assigneeId === userId ? 'selected' : ''}>${escape(displayName(accountById(entry.userId) || { id: entry.userId }))}${escape(wlSuffix)}</option>`;
                }).join('')}
            `;
            const memberIds = (Array.isArray(group?.memberTaskIds) ? group.memberTaskIds : []).map(text).filter(Boolean);
            const taskById = new Map((Array.isArray(project?.tasks) ? project.tasks : []).map((t) => [text(t?.id), t]).filter(([id]) => id));
            const memberChips = memberIds.length
                ? memberIds.map((tid) => {
                    const task = taskById.get(tid);
                    const title = text(task?.title || tid);
                    return `<span class="social-project-task-graph-group-member-chip" title="${escape(title)}">${escape(title)}</span>`;
                }).join('')
                : '<span class="social-neo-muted">No members yet. Drag task cards onto the package on the map (order port wires do not add members).</span>';
            const linkSummary = getProjectTaskGraphGroupLinkSummary(group, project);
            const orderInChips = linkSummary.predTitles.length
                ? linkSummary.predTitles.map((title) => `<span class="social-project-task-graph-group-member-chip is-order" title="Order predecessor">${escape(title)}</span>`).join('')
                : '<span class="social-neo-muted">None</span>';
            const orderOutChips = linkSummary.succTitles.length
                ? linkSummary.succTitles.map((title) => `<span class="social-project-task-graph-group-member-chip is-order" title="Order successor">${escape(title)}</span>`).join('')
                : '<span class="social-neo-muted">None</span>';
            const description = text(group?.description || '');
            const formBody = canContribute ? `
                        <form class="social-project-task-graph-group-form" data-project-task-graph-group-form="1" data-project-id="${escape(projectId)}" data-group-id="${escape(groupId)}">
                            <label class="social-neo-label" for="sptg-group-name-${escape(groupId)}">Name</label>
                            <input class="social-neo-input lux-control" id="sptg-group-name-${escape(groupId)}" name="groupName" type="text" value="${escape(text(group?.name || ''))}" maxlength="120" required autocomplete="off" data-group-name-input="1">
                            <label class="social-neo-label" for="sptg-group-assignee-${escape(groupId)}">Assigned to</label>
                            <select class="social-neo-select lux-control" id="sptg-group-assignee-${escape(groupId)}" name="groupAssigneeUserId" data-lux-picker>
                                ${assigneeOptions}
                            </select>
                            <label class="social-neo-label" for="sptg-group-desc-${escape(groupId)}">Notes</label>
                            <textarea class="social-neo-input social-project-task-graph-group-notes" id="sptg-group-desc-${escape(groupId)}" name="groupDescription" rows="3" maxlength="2000" placeholder="Optional package notes">${escape(description)}</textarea>
                        </form>
            ` : `
                        <div class="social-project-task-graph-inspector-body lux-card lux-soft-chrome">
                            <span class="social-project-task-graph-inspector-label">Assigned to</span>
                            <p class="social-project-task-graph-inspector-description${assigneeId ? '' : ' is-empty'}">${assigneeId ? escape(displayName(accountById(assigneeId) || { id: assigneeId })) : 'Unassigned'}</p>
                            <span class="social-project-task-graph-inspector-label">Notes</span>
                            <p class="social-project-task-graph-inspector-description${description ? '' : ' is-empty'}">${description ? escape(description) : 'No notes yet.'}</p>
                        </div>
            `;
            const actions = canContribute ? `
                    <div class="social-project-task-graph-inspector-actions">
                        <button class="lux-secondary-btn social-project-task-graph-inspector-delete" type="button" data-action="project-task-graph-group-delete" data-project-id="${escape(projectId)}" data-group-id="${escape(groupId)}" title="Delete package" aria-label="Delete package"><i class="fas fa-trash"></i></button>
                        <button class="lux-primary-btn" type="button" data-action="project-task-graph-group-save" data-project-id="${escape(projectId)}" data-group-id="${escape(groupId)}"><i class="fas fa-check"></i> Save</button>
                    </div>
            ` : `
                    <div class="social-project-task-graph-inspector-actions">
                        <button class="lux-secondary-btn" type="button" data-action="project-task-graph-clear-selection">Close</button>
                    </div>
            `;
            return `
                <div class="social-project-task-graph-inspector is-group" data-lux-transparency-exempt="1" data-group-id="${escape(groupId)}">
                    <div class="social-project-task-graph-inspector-head">
                        <div class="social-project-task-graph-inspector-heading">
                            <strong class="social-project-task-graph-inspector-dialog-title">
                                <i class="fas fa-layer-group" aria-hidden="true"></i>
                                <span title="${escape(text(group?.name || 'Package'))}">${escape(text(group?.name || 'Package'))}</span>
                            </strong>
                        </div>
                        <button class="lux-ghost-btn lux-glass-dialog-close-btn" type="button" data-action="project-task-graph-clear-selection" title="Close" aria-label="Close inspector"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="social-project-task-graph-inspector-scroll">
                        ${renderProjectTaskGraphRailOverview(project, runtime, Array.isArray(project?.tasks) ? project.tasks : [])}
                        <div class="social-project-task-graph-inspector-props lux-card-meta" aria-label="Package properties">
                            <span class="social-project-task-graph-inspector-prop">Package</span>
                            <span class="social-project-task-graph-inspector-prop-sep" aria-hidden="true">·</span>
                            <span class="social-project-task-graph-inspector-prop">${escape(String(roll.count))} member${roll.count === 1 ? '' : 's'}</span>
                            <span class="social-project-task-graph-inspector-prop-sep" aria-hidden="true">·</span>
                            <span class="social-project-task-graph-inspector-prop">${pct}% done</span>
                            ${budgetLabel ? `<span class="social-project-task-graph-inspector-prop-sep" aria-hidden="true">·</span><span class="social-project-task-graph-inspector-prop">${escape(budgetLabel)}</span>` : ''}
                            ${roll.hoursRemaining > 0 ? `<span class="social-project-task-graph-inspector-prop-sep" aria-hidden="true">·</span><span class="social-project-task-graph-inspector-prop">${escape(formatProjectScheduleHours(roll.hoursRemaining))} left</span>` : ''}
                            ${roll.pathRemainingHours > 0 ? `<span class="social-project-task-graph-inspector-prop-sep" aria-hidden="true">·</span><span class="social-project-task-graph-inspector-prop" title="Remaining critical-path length in subtree">path ${escape(formatProjectScheduleHours(roll.pathRemainingHours))}</span>` : ''}
                            ${roll.minFloatHours != null && roll.critical === 0 ? `<span class="social-project-task-graph-inspector-prop-sep" aria-hidden="true">·</span><span class="social-project-task-graph-inspector-prop" title="Tightest float in open subtree">slack ${escape(formatProjectScheduleFloat(roll.minFloatHours))}</span>` : ''}
                            ${roll.blocked ? `<span class="social-project-task-graph-inspector-prop-sep" aria-hidden="true">·</span><span class="social-project-task-graph-inspector-prop is-warn">${roll.blocked} blocked</span>` : ''}
                            ${roll.overdue ? `<span class="social-project-task-graph-inspector-prop-sep" aria-hidden="true">·</span><span class="social-project-task-graph-inspector-prop is-warn">${roll.overdue} overdue</span>` : ''}
                            ${roll.critical ? `<span class="social-project-task-graph-inspector-prop-sep" aria-hidden="true">·</span><span class="social-project-task-graph-inspector-prop">${roll.critical} critical${roll.criticalBlocked ? ` (${roll.criticalBlocked} blocked)` : ''}</span>` : ''}
                            ${roll.unassigned ? `<span class="social-project-task-graph-inspector-prop-sep" aria-hidden="true">·</span><span class="social-project-task-graph-inspector-prop">${roll.unassigned} unowned</span>` : ''}
                            ${linkSummary.orderCount ? `<span class="social-project-task-graph-inspector-prop-sep" aria-hidden="true">·</span><span class="social-project-task-graph-inspector-prop">${linkSummary.orderCount} order link${linkSummary.orderCount === 1 ? '' : 's'}</span>` : ''}
                        </div>
                        ${formBody}
                        <div class="social-project-task-graph-inspector-body lux-card lux-soft-chrome">
                            <span class="social-project-task-graph-inspector-label">Members (drag onto package)</span>
                            <div class="social-project-task-graph-group-member-list">${memberChips}</div>
                            <span class="social-project-task-graph-inspector-label">Order in (port wires)</span>
                            <div class="social-project-task-graph-group-member-list">${orderInChips}</div>
                            <span class="social-project-task-graph-inspector-label">Order out (port wires)</span>
                            <div class="social-project-task-graph-group-member-list">${orderOutChips}</div>
                        </div>
                    </div>
                    ${actions}
                </div>
            `;
        }

        function renderProjectTaskGraphInspector(project, runtime, tasks = []) {
            const selectedId = text(runtime.ui?.projectTaskGraphSelectedId || '');
            if (!selectedId) return '';
            if (isProjectTaskGraphGroupId(selectedId)) {
                const group = getProjectTaskGraphGroups(runtime, text(project?.id)).find((g) => text(g?.id) === selectedId);
                if (!group) return '';
                return renderProjectTaskGraphGroupInspector(project, runtime, group);
            }
            const task = tasks.find((entry) => text(entry?.id) === selectedId);
            if (!task) return '';
            const fields = buildProjectTaskInspectorFields(task);
            const { statusId, column, assignee, dueAt, isOverdue, isToday, isSoon, priority, budgetEstimate, tag, checklistDone, checklistTotal, description } = fields;
            const priorityLabel = text(priority || 'medium');
            const priorityDisplay = priorityLabel ? priorityLabel.charAt(0).toUpperCase() + priorityLabel.slice(1) : 'Medium';
            const budgetLabel = formatProjectTaskBudgetEstimate(budgetEstimate, project?.budgetCurrency || 'USD');
            const statusIcon = statusId === 'done' ? 'fa-circle-check'
                : statusId === 'blocked' ? 'fa-ban'
                : statusId === 'in-progress' ? 'fa-bolt'
                : 'fa-list-check';
            const assigneeLabel = task?.assigneeUserId ? displayName(assignee) : 'Unassigned';
            const inspectorSched = computeProjectSchedule(project).byId?.[selectedId] || null;
            const inspectorDisp = inspectorSched
                ? formatTaskScheduleDisplay(inspectorSched, {
                    scheduleStartAt: text(project?.scheduleStartAt || ''),
                    needEstimate: statusId !== 'done' && !task?.isMilestone,
                    isMilestone: Boolean(task?.isMilestone)
                })
                : null;
            const scheduleStrip = inspectorDisp ? `
                        <div class="social-project-task-graph-inspector-schedule-block lux-card lux-soft-chrome">
                            <div class="social-project-task-graph-inspector-schedule-head lux-card-head">
                                <strong class="lux-card-title">Schedule</strong>
                                <button type="button" class="lux-secondary-btn social-project-task-graph-schedule-help-btn" data-action="project-task-graph-schedule-help" data-project-id="${escape(text(project.id))}" title="What do these schedule terms mean?" aria-label="Schedule terms help">
                                    <i class="fas fa-circle-question" aria-hidden="true"></i>
                                </button>
                            </div>
                            <div class="social-project-task-graph-inspector-schedule social-project-task-graph-inspector-schedule--full lux-card-body" aria-label="Schedule">
                                <div class="social-project-task-graph-inspector-schedule-cell">
                                    <span title="PERT / estimate">Duration</span>
                                    <strong title="PERT / estimate">${escape(inspectorDisp.durationLabel)}</strong>
                                </div>
                                <div class="social-project-task-graph-inspector-schedule-cell">
                                    <span title="Whether this task is on the project critical path">On critical path?</span>
                                    <strong class="${inspectorDisp.isCritical ? 'is-critical' : ''}" title="Critical path = zero float vs project finish">${escape(inspectorDisp.pathLabel)}</strong>
                                </div>
                                <div class="social-project-task-graph-inspector-schedule-cell">
                                    <span title="${escape(PROJECT_SCHEDULE_FLOAT_TITLE)}">Float vs project end</span>
                                    <strong class="${inspectorDisp.isCritical ? 'is-critical' : ''}" title="${escape(PROJECT_SCHEDULE_FLOAT_TITLE)}">${escape(inspectorDisp.floatLabel)}</strong>
                                </div>
                                <div class="social-project-task-graph-inspector-schedule-cell">
                                    <span title="ES — earliest start (forward pass)">Earliest start</span>
                                    <strong title="ES — earliest start (forward pass)">${escape(inspectorDisp.esLabel)}</strong>
                                </div>
                                <div class="social-project-task-graph-inspector-schedule-cell">
                                    <span title="EF — earliest finish = earliest start + duration">Earliest finish</span>
                                    <strong title="EF — earliest finish = earliest start + duration">${escape(inspectorDisp.efLabel)}</strong>
                                </div>
                                <div class="social-project-task-graph-inspector-schedule-cell">
                                    <span title="LS — latest start (backward pass)">Latest start</span>
                                    <strong title="LS — latest start (backward pass)">${escape(inspectorDisp.lsLabel)}</strong>
                                </div>
                                <div class="social-project-task-graph-inspector-schedule-cell">
                                    <span title="LF — latest finish = latest start + duration">Latest finish</span>
                                    <strong title="LF — latest finish = latest start + duration">${escape(inspectorDisp.lfLabel)}</strong>
                                </div>
                            </div>
                            ${inspectorDisp.noEstimate
                                ? '<p class="social-project-task-graph-inspector-schedule-hint social-neo-muted">No duration — set estimate or PERT to unlock placement.</p>'
                                : '<p class="social-project-task-graph-inspector-schedule-hint social-neo-muted">Forward pass → earliest start/finish · Backward → latest start/finish · Float = latest start − earliest start</p>'}
                        </div>
            ` : '';
            return `
                <div class="social-project-task-graph-inspector" data-lux-transparency-exempt="1" data-status="${escape(statusId)}">
                    <div class="social-project-task-graph-inspector-head">
                        <div class="social-project-task-graph-inspector-heading">
                            <strong class="social-project-task-graph-inspector-dialog-title">
                                <i class="fas ${escape(statusIcon)}" aria-hidden="true"></i>
                                <span title="${escape(text(task?.title || 'Task'))}">${escape(text(task?.title || 'Task'))}</span>
                            </strong>
                        </div>
                        <button class="lux-ghost-btn lux-glass-dialog-close-btn" type="button" data-action="project-task-graph-clear-selection" title="Close" aria-label="Close inspector"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="social-project-task-graph-inspector-scroll">
                        ${renderProjectTaskGraphRailOverview(project, runtime, tasks)}
                        <div class="social-project-task-graph-inspector-props lux-card-meta" aria-label="Task properties">
                            <span class="social-project-task-graph-inspector-prop" data-status="${escape(statusId)}">${escape(column.label)}</span>
                            <span class="social-project-task-graph-inspector-prop-sep" aria-hidden="true">·</span>
                            <span class="social-project-task-graph-inspector-prop">${escape(priorityDisplay)}</span>
                            ${budgetLabel ? `<span class="social-project-task-graph-inspector-prop-sep" aria-hidden="true">·</span><span class="social-project-task-graph-inspector-prop">${escape(budgetLabel)}</span>` : ''}
                            <span class="social-project-task-graph-inspector-prop-sep" aria-hidden="true">·</span>
                            <span class="social-project-task-graph-inspector-prop${task?.assigneeUserId ? '' : ' is-muted'}">${escape(assigneeLabel)}</span>
                            ${dueAt ? `<span class="social-project-task-graph-inspector-prop-sep" aria-hidden="true">·</span><span class="social-project-task-graph-inspector-prop${isOverdue ? ' is-overdue' : ''}">${escape(when(dueAt))}</span>` : ''}
                            ${tag ? `<span class="social-project-task-graph-inspector-prop-sep" aria-hidden="true">·</span><span class="social-project-task-graph-inspector-prop">${escape(tag)}</span>` : ''}
                        </div>
                        ${scheduleStrip}
                        ${checklistTotal ? `
                            <div class="social-project-task-graph-inspector-checklist" title="${escape(String(checklistDone))} of ${escape(String(checklistTotal))} steps done">
                                <div class="social-project-task-checklist-bar"><div class="social-project-task-checklist-fill" style="width:${Math.round((checklistDone / checklistTotal) * 100)}%"></div></div>
                                <span>${escape(String(checklistDone))}/${escape(String(checklistTotal))}</span>
                            </div>
                        ` : ''}
                        <div class="social-project-task-graph-inspector-body lux-card lux-soft-chrome">
                            <span class="social-project-task-graph-inspector-label">Description</span>
                            <p class="social-project-task-graph-inspector-description${description ? '' : ' is-empty'}">${description ? escape(description) : 'No description yet.'}</p>
                            <button class="social-project-task-graph-inspector-text-link" type="button" data-action="project-task-detail-open" data-project-id="${escape(text(project.id))}" data-task-id="${escape(text(task.id))}">View full details <i class="fas fa-arrow-right" aria-hidden="true"></i></button>
                        </div>
                    </div>
                    ${project.viewerCanContribute ? `
                    <div class="social-project-task-graph-inspector-actions">
                        <button class="lux-secondary-btn" type="button" data-action="project-task-graph-link-from-selected" data-project-id="${escape(text(project.id))}" data-task-id="${escape(text(task.id))}"><i class="fas fa-link"></i> Link</button>
                        <button class="lux-secondary-btn social-project-task-graph-inspector-delete" type="button" data-action="project-task-delete-open" data-project-id="${escape(text(project.id))}" data-task-id="${escape(text(task.id))}" title="Delete task" aria-label="Delete task"><i class="fas fa-trash"></i></button>
                        <button class="lux-primary-btn" type="button" data-action="project-task-edit-open" data-project-id="${escape(text(project.id))}" data-task-id="${escape(text(task.id))}"><i class="fas fa-pen"></i> Edit task</button>
                    </div>
                    ` : `
                    <div class="social-project-task-graph-inspector-actions">
                        <button class="lux-primary-btn" type="button" data-action="project-task-detail-open" data-project-id="${escape(text(project.id))}" data-task-id="${escape(text(task.id))}"><i class="fas fa-list-check"></i> View details</button>
                    </div>
                    `}
                </div>
            `;
        }

        function renderProjectTaskGraphDetailRailContent(project, runtime, tasks = []) {
            const inspectorMarkup = renderProjectTaskGraphInspector(project, runtime, tasks);
            if (inspectorMarkup) return { markup: inspectorMarkup, empty: false };
            return { markup: renderProjectTaskGraphDetailRailPlaceholder(project, runtime, tasks), empty: true };
        }

        function renderProjectTaskGraphTools(project) {
            // Left Map tools sidebar removed; overview lives in the right rail.
            if (!project?.viewerCanContribute) return '';
            return '';
        }

        function renderTaskDependencyGraphPreview(project, runtime) {
            if (!project) return '';
            // Full project graph in overview — do not apply desk search/filters (those only scope the full map / board).
            const projectTasks = Array.isArray(project.tasks) ? project.tasks : [];
            const showInferred = projectTaskGraphShowInferred(runtime);
            const showFlow = projectTaskGraphShowFlow(runtime);
            // Same layout as full map; preview only changes framing (viewBox meet = see everything).
            const model = buildProjectTaskGraphModel(projectTasks, { showInferred, showFlow });
            const explicitCount = model.explicitEdges?.length ?? projectTasks.reduce((sum, task) => sum + projectTaskDependsOnIds(task).length, 0);
            const inProgress = projectTasks.filter((task) => text(task?.status) === 'in-progress').length;
            const stageSize = computeProjectTaskGraphStageSize(runtime);
            let layout = buildProjectTaskGraphLayout(model, runtime, stageSize);
            const savedGraphPositions = getProjectTaskGraphPositions(runtime, text(project.id));
            if (projectTaskGraphLayoutUsesSavedPositions(layout, runtime)) {
                layout = applyProjectTaskGraphSavedPositions(layout, savedGraphPositions);
            }
            // Include group boxes in auto-fit bounds (not only task cards). Skip (0,0) defaults with no saved pos
            // so a stray group origin does not zoom the preview out and make task cards unreadable.
            const groupBoxes = collectProjectTaskGraphGroupBoxes(runtime, text(project.id), layout, savedGraphPositions, { skipDefault: true });
            const { bounds, viewBox } = projectTaskGraphContentViewBox(layout, groupBoxes, 36);
            const schedule = computeProjectSchedule(project);
            const hasGraphContent = projectTasks.length || groupBoxes.length;
            const previewSvg = hasGraphContent
                ? `<div class="social-project-graph-preview-viewport" data-project-task-graph-preview="1">
                        ${renderProjectTaskGraphSvg(project, layout, {
                            compact: false,
                            edges: model.edges,
                            showInferred,
                            showFlow,
                            graphMode: 'explore',
                            dashboard: false,
                            showGroups: true,
                            schedule,
                            linkable: false,
                            draggable: false,
                            interactive: false,
                            preview: true,
                            viewBox,
                            contentBounds: bounds,
                            svgWidth: '100%',
                            svgHeight: '100%',
                            preserveAspectRatio: 'xMidYMid meet',
                            markerSuffix: '-preview'
                        })}
                    </div>`
                : '<div class="social-neo-empty">No tasks yet. Open the Tasks tab to add work items.</div>';
            return `
                <section class="social-neo-card social-project-chart-card social-project-graph-preview-card">
                    <div class="social-neo-section-head">
                        <div>
                            <strong>Task map</strong>
                            <span>Read-only preview — auto-fits so every task is visible. Open to edit.</span>
                        </div>
                        <span class="social-neo-pill home-hover-chip">${escape(String(explicitCount))} links</span>
                    </div>
                    <div class="social-project-overview-slot__scroll social-project-graph-preview-scroll">
                        ${previewSvg}
                    </div>
                    <div class="social-project-graph-preview-meta">
                        <span class="social-neo-muted">${escape(String(projectTasks.length))} tasks · ${escape(String(explicitCount))} dependencies · ${escape(String(inProgress))} in progress</span>
                        <span class="social-project-card-new-cta"><span data-action="project-task-graph-open" data-project-id="${escape(text(project.id))}">Open task map →</span></span>
                    </div>
                </section>
            `;
        }

        function renderProjectTaskGraphLegend() {
            return `
                <div class="social-project-task-graph-legend">
                    ${PROJECT_TASK_COLUMNS.map((column) => `
                        <div class="social-project-task-graph-legend-item">
                            <span class="social-project-status-dot is-${escape(column.tone)}"></span>
                            <span>${escape(column.label)}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        function renderProjectTaskGraphStatusMini(project, tasks = []) {
            const total = tasks.length || 1;
            const segments = PROJECT_TASK_COLUMNS.map((column) => {
                const count = tasks.filter((task) => text(task?.status || 'todo') === column.id).length;
                const width = Math.round((count / total) * 100);
                return count ? `<span class="social-project-status-segment is-${escape(column.tone)}" style="width:${width}%"></span>` : '';
            }).join('');
            const done = tasks.filter((task) => text(task?.status) === 'done').length;
            const percent = Math.round((done / total) * 100);
            return `
                <div class="social-project-task-graph-status-mini">
                    <div class="social-project-status-bar">${segments}</div>
                    <div class="social-project-task-graph-status-copy">
                        <strong>${escape(String(percent))}%</strong>
                        <span>complete</span>
                    </div>
                </div>
            `;
        }

        function renderProjectTaskGraphFullscreen(runtime, dialog) {
            const project = resolveActiveSocialProject(runtime, dialog?.projectId);
            if (!project) return '';
            // Footer stats use the full project; canvas respects Only-mine / desk Mine focus.
            const allTasks = Array.isArray(project.tasks) ? project.tasks : [];
            const projectTasks = filterProjectTaskGraphVisibleTasks(runtime, allTasks);
            const mineOnly = projectTaskGraphMineOnlyActive(runtime);
            const showInferred = projectTaskGraphShowInferred(runtime);
            const showFlow = projectTaskGraphShowFlow(runtime);
            const graphMode = normalizeProjectTaskGraphMode(runtime.ui?.projectTaskGraphMode || 'browse');
            const selectedId = text(runtime.ui?.projectTaskGraphSelectedId || '');
            const linkFromId = text(runtime.ui?.projectTaskGraphLinkFrom || '');
            const canContribute = Boolean(project.viewerCanContribute);
            const model = buildProjectTaskGraphModel(projectTasks, { showInferred, showFlow });
            const stageSize = computeProjectTaskGraphStageSize(runtime);
            let layout = buildProjectTaskGraphLayout(model, runtime, stageSize);
            const savedPositions = ensureProjectTaskGraphPositionsLoaded(runtime, text(project?.id || dialog?.projectId || ''));
            // Free placement only for force/free layout — status columns must keep column positions.
            if (projectTaskGraphLayoutUsesSavedPositions(layout, runtime)) {
                layout = applyProjectTaskGraphSavedPositions(layout, savedPositions);
            }
            const groupBoxes = collectProjectTaskGraphGroupBoxes(runtime, text(project?.id || ''), layout, savedPositions);
            const { bounds, viewBox } = projectTaskGraphContentViewBox(layout, groupBoxes, 36);
            const zoom = clampProjectTaskGraphZoom(Number(runtime.ui?.projectTaskGraphZoom || computeProjectTaskGraphFitZoom(layout, stageSize.stageWidth, stageSize.stageHeight)) || 1);
            const pan = readProjectTaskGraphPan(runtime);
            const showCanvas = projectTasks.length > 0 || canContribute;
            const canvasMarkup = showCanvas
                ? renderProjectTaskGraphCanvas(project, layout, {
                    zoom,
                    panX: pan.x,
                    panY: pan.y,
                    edges: model.edges,
                    showInferred,
                    showFlow,
                    graphMode,
                    draggable: canContribute,
                    dashboard: true,
                    fullscreen: true,
                    linkable: canContribute,
                    unlinkable: canContribute,
                    selectedId,
                    linkFromId,
                    highlightOverdue: runtime.ui?.projectTaskGraphHighlightOverdue === true,
                    highlightBlocked: runtime.ui?.projectTaskGraphHighlightBlocked === true,
                    showCritical: projectTaskGraphShowCritical(runtime),
                    markerSuffix: '-fullscreen',
                    viewBox,
                    contentBounds: bounds
                })
                : `<div class="social-neo-empty social-project-task-graph-empty">${mineOnly
                    ? 'No open tasks assigned to you. Turn off Only mine to see the full map.'
                    : 'No tasks yet. Add a task to populate the map.'}</div>`;
            const railContent = renderProjectTaskGraphDetailRailContent(project, runtime, projectTasks);
            const detailRailMarkup = `<aside class="lux-card social-project-task-graph-detail-rail lux-soft-chrome${railContent.empty ? ' is-empty' : ''}" data-lux-transparency-exempt="1">${railContent.markup}</aside>`;
            const modeToolbar = canContribute && linkFromId ? `
                <div class="social-page-toolbar-group social-project-task-graph-mode-toolbar" role="group" aria-label="Link actions">
                    <button class="lux-secondary-btn" type="button" data-action="project-task-graph-link-cancel"><i class="fas fa-times"></i> Cancel</button>
                </div>
            ` : '';
            const focusGroupId = text(runtime.ui?.projectTaskGraphFocusGroupId || '');
            const mapGroups = getProjectTaskGraphGroups(runtime, text(project.id));
            const graphCheckpoints = readProjectTaskGraphCheckpoints(text(project.id));
            const graphCheckpoint = graphCheckpoints[0] || null;
            const checkpointWhen = formatProjectTaskGraphCheckpointWhen(graphCheckpoint?.savedAt);
            const saveTitle = checkpointWhen ? `Last saved: ${checkpointWhen}` : 'Save map layout, packages, and order links';
            const historyTitle = graphCheckpoints.length
                ? `${graphCheckpoints.length} save${graphCheckpoints.length === 1 ? '' : 's'} — open history`
                : 'Open save history';
            const groupFocusPills = mapGroups.length ? `
                <label class="social-page-toolbar-field social-project-task-graph-group-focus" title="Focus a package (portrait mode)">
                    <i class="fas fa-layer-group" aria-hidden="true"></i>
                    <select class="lux-control social-project-task-graph-group-select" name="projectTaskGraphFocusGroup" data-lux-picker aria-label="Focus package">
                        <option value="" ${!focusGroupId ? 'selected' : ''}>All packages</option>
                        ${mapGroups.map((group) => {
                            const gid = text(group?.id);
                            const count = (Array.isArray(group?.memberTaskIds) ? group.memberTaskIds : []).length;
                            const name = text(group?.name || 'Package');
                            return `<option value="${escape(gid)}" ${focusGroupId === gid ? 'selected' : ''}>${escape(name)} (${count})</option>`;
                        }).join('')}
                    </select>
                </label>
            ` : '';
            const showCritical = projectTaskGraphShowCritical(runtime);
            const checkpointBtns = canContribute ? `
                                    <div class="social-page-toolbar-group social-project-task-graph-checkpoint-controls">
                                        <button class="lux-primary-btn social-project-task-graph-save-btn" type="button" data-action="project-task-graph-save" data-project-id="${escape(text(project.id))}" title="${escape(saveTitle)}"><i class="fas fa-floppy-disk" aria-hidden="true"></i> Save</button>
                                        <button class="lux-secondary-btn social-project-task-graph-history-btn" type="button" data-action="project-task-graph-history-open" data-project-id="${escape(text(project.id))}" title="${escape(historyTitle)}"><i class="fas fa-clock-rotate-left" aria-hidden="true"></i> History${graphCheckpoints.length ? ` <span class="lux-status-pill">${escape(String(graphCheckpoints.length))}</span>` : ''}</button>
                                    </div>
            ` : '';
            const criticalToggleBtn = `
                                    <button class="lux-secondary-btn social-project-task-graph-critical-toggle${showCritical ? ' is-active' : ''}" type="button" data-action="project-task-graph-toggle-critical" title="${showCritical ? 'Hide critical path emphasis on the map' : 'Highlight critical path on the map'}" aria-pressed="${showCritical ? 'true' : 'false'}"><i class="fas fa-route" aria-hidden="true"></i> Critical path</button>
            `;
            return `
                <main class="social-page-surface social-project-task-graph-page" data-social-page-surface="project-task-graph" data-action="noop" aria-label="Task map">
                        <div class="social-project-task-graph-immersive">
                            <header class="social-page-surface-head social-project-task-graph-page-head lux-soft-chrome home-hover-chip">
                                <div class="social-page-surface-heading social-project-task-graph-immersive-title">
                                    <strong class="social-page-surface-title"><i class="fas fa-diagram-project" aria-hidden="true"></i> Task map</strong>
                                    <span class="social-page-surface-subtitle">${escape(text(project.name || 'Project'))}</span>
                                </div>
                                <div class="social-page-surface-actions social-project-task-graph-immersive-actions social-project-task-graph-page-actions">
                                    ${modeToolbar}
                                    ${groupFocusPills}
                                    ${checkpointBtns}
                                    <div class="social-page-toolbar-group social-project-task-graph-schedule-controls">
                                        ${criticalToggleBtn}
                                    </div>
                                    <div class="social-page-toolbar-group social-project-task-graph-nav-controls">
                                        ${renderProjectWorkspaceNavButtons(project, { buttonClass: 'lux-secondary-btn' })}
                                    </div>
                                    <div class="social-page-toolbar-group social-project-task-graph-zoom-controls">
                                        <button class="lux-secondary-btn social-project-task-graph-zoom-btn" type="button" data-action="project-task-graph-zoom-out" title="Zoom out" aria-label="Zoom out"><i class="fas fa-minus"></i></button>
                                        <span class="social-page-toolbar-zoom-label social-project-task-graph-zoom-label">${escape(String(Math.round(zoom * 100)))}%</span>
                                        <button class="lux-secondary-btn social-project-task-graph-zoom-btn" type="button" data-action="project-task-graph-zoom-in" title="Zoom in" aria-label="Zoom in"><i class="fas fa-plus"></i></button>
                                        <button class="lux-secondary-btn social-project-task-graph-zoom-btn social-project-task-graph-reset-view-btn" type="button" data-action="project-task-graph-reset-view" title="Reset view — fit all tasks"><i class="fas fa-expand"></i> Reset view</button>
                                    </div>
                                    <button class="lux-ghost-btn" type="button" data-action="dialog-close" aria-label="Back to workspace"><i class="fas fa-arrow-left"></i> Back to workspace</button>
                                </div>
                            </header>
                            <div class="social-project-task-graph-immersive-body">
                                <div class="social-project-task-graph-stage social-project-task-graph-stage--immersive is-mode-browse is-mode-link${focusGroupId ? ' is-group-portrait' : ''}" data-project-task-graph-stage="1" data-lux-transparency-exempt="1">
                                    ${canvasMarkup}
                                    ${renderProjectTaskGraphQuickCreatePopover(project, runtime)}
                                </div>
                                ${detailRailMarkup}
                            </div>
                            <footer class="social-project-task-graph-immersive-footer lux-soft-chrome">
                                <div class="social-project-task-graph-footer-main" data-lux-transparency-exempt="1" aria-label="Task status and progress">
                                    ${renderProjectTaskGraphHealth(allTasks, runtime)}
                                    ${renderProjectTaskGraphStatusMini(project, allTasks)}
                                </div>
                                <div class="social-project-task-graph-footer-tools">
                                    <button type="button" class="social-project-task-graph-my-switch${mineOnly ? ' is-active' : ''}" data-action="project-task-graph-toggle-my" role="switch" aria-checked="${mineOnly ? 'true' : 'false'}" title="Show only tasks assigned to you (same as Desk Mine)">
                                        <span>Only mine</span>
                                        <span class="social-project-task-graph-my-switch-track" aria-hidden="true"></span>
                                    </button>
                                </div>
                                <div class="social-project-task-graph-footer-actions">
                                    ${canContribute
                                        ? `<button class="lux-primary-btn social-project-task-graph-add-btn" type="button" data-action="project-task-create-open" data-project-id="${escape(text(project.id))}"><i class="fas fa-plus"></i> Add task</button>`
                                        : ''}
                                </div>
                            </footer>
                        </div>
                </main>
            `;
        }

        return {
            buildProjectTaskGraphCanvasMarkup,
            renderProjectTaskGraphCanvas,
            renderProjectTaskGraphCardNode,
            renderProjectTaskGraphDetailRailContent,
            renderProjectTaskGraphDetailRailPlaceholder,
            renderProjectTaskGraphEdgeGroupsHtml,
            renderProjectTaskGraphFullscreen,
            renderProjectTaskGraphGroupDependencyEdgesHtml,
            renderProjectTaskGraphGroupEdgesHtml,
            renderProjectTaskGraphGroupInspector,
            renderProjectTaskGraphGroupNode,
            renderProjectTaskGraphHealth,
            renderProjectTaskGraphHistoryDialog,
            renderProjectTaskGraphInspector,
            renderProjectTaskGraphLegend,
            renderProjectTaskGraphQuickCreatePopover,
            renderProjectTaskGraphRailOverview,
            renderProjectTaskGraphScheduleHelpDialog,
            renderProjectTaskGraphScheduleOverview,
            renderProjectTaskGraphStatusMini,
            renderProjectTaskGraphSvg,
            renderProjectTaskGraphTools,
            renderTaskDependencyGraphPreview
        };
    }

    window.createKiuSocialWorkspaceGraphRenderApi = createKiuSocialWorkspaceGraphRenderApi;
})();
