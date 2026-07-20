/* Pure project-health scoring for social workspace.
 * Loaded before social-workspace.js (see ensureSocialWorkspaceModule).
 * buildProjectHealthModel(project, ctx) — no DOM; renderer supplies HTML.
 */
(function initSocialWorkspaceHealthModel() {
    'use strict';
    if (window.__KIU_SOCIAL_WORKSPACE_HEALTH_MODEL_LOADED) return;
    window.__KIU_SOCIAL_WORKSPACE_HEALTH_MODEL_LOADED = true;

    function hooks() {
        return window.__kiuSocialWorkspaceHooks || {};
    }

    function text(value) {
        const hook = hooks().text;
        if (typeof hook === 'function') return hook(value);
        return String(value == null ? '' : value).trim();
    }

    function countNum(value) {
        const hook = hooks().countNum;
        if (typeof hook === 'function') return hook(value);
        const n = Number(value);
        return Number.isFinite(n) ? n : 0;
    }

    function normalizeTaskTime(value) {
        const hook = hooks().normalizeTaskTime;
        if (typeof hook === 'function') return hook(value);
        const n = Number(value);
        return Number.isFinite(n) && n > 0 ? Math.round(n * 10) / 10 : 0;
    }

    function pickFn(ctx, name, fallbacks) {
        if (ctx && typeof ctx[name] === 'function') return ctx[name];
        const list = Array.isArray(fallbacks) ? fallbacks : [fallbacks];
        for (const fn of list) {
            if (typeof fn === 'function') return fn;
        }
        return null;
    }

    /**
     * @param {object} project
     * @param {object} ctx
     *   groups, schedule (computeProjectSchedule result),
     *   resolveDeskTaskReadiness, projectTaskDependsOnIds, projectTaskDownstreamIds,
     *   isProjectTaskGraphGroupId, projectRiskRegisterSummary, sortProjectRisksForRegister,
     *   projectRiskIsActiveStatus, taskDurationHours, sumProjectOpenWorkHours,
     *   sumProjectActualHours, formatProjectScheduleHours, formatProjectScheduleDate,
     *   now (ms)
     */
    function buildProjectHealthModel(project, ctx = {}) {
        if (!project) return null;
        const projectId = text(project.id);
        const tasks = Array.isArray(project.tasks) ? project.tasks : [];
        const groups = Array.isArray(ctx.groups) ? ctx.groups : [];
        const risks = Array.isArray(project.risks) ? project.risks : [];
        const currency = text(project?.budgetCurrency || '') || 'USD';

        const taskDurationHours = pickFn(ctx, 'taskDurationHours', [
            window.taskDurationHours,
            window.KiuSocialWorkspaceScheduleModel?.taskDurationHours
        ]);
        const sumProjectOpenWorkHours = pickFn(ctx, 'sumProjectOpenWorkHours', [
            window.sumProjectOpenWorkHours,
            window.KiuSocialWorkspaceScheduleModel?.sumProjectOpenWorkHours
        ]);
        const sumProjectActualHours = pickFn(ctx, 'sumProjectActualHours', [
            window.sumProjectActualHours,
            window.KiuSocialWorkspaceScheduleModel?.sumProjectActualHours
        ]);
        const formatProjectScheduleHours = pickFn(ctx, 'formatProjectScheduleHours', [
            window.formatProjectScheduleHours,
            window.KiuSocialWorkspaceScheduleModel?.formatProjectScheduleHours
        ]);
        const formatProjectScheduleDate = pickFn(ctx, 'formatProjectScheduleDate', [
            window.formatProjectScheduleDate,
            window.KiuSocialWorkspaceScheduleModel?.formatProjectScheduleDate
        ]);
        const resolveDeskTaskReadiness = pickFn(ctx, 'resolveDeskTaskReadiness', [
            window.resolveDeskTaskReadiness
        ]);
        const projectTaskDependsOnIds = pickFn(ctx, 'projectTaskDependsOnIds', [
            window.projectTaskDependsOnIds,
            hooks().projectTaskDependsOnIds
        ]);
        const projectTaskDownstreamIds = pickFn(ctx, 'projectTaskDownstreamIds', [
            window.projectTaskDownstreamIds,
            hooks().projectTaskDownstreamIds
        ]);
        const isProjectTaskGraphGroupId = pickFn(ctx, 'isProjectTaskGraphGroupId', [
            window.isProjectTaskGraphGroupId
        ]);
        const projectRiskRegisterSummary = pickFn(ctx, 'projectRiskRegisterSummary', [
            window.projectRiskRegisterSummary,
            window.KiuSocialWorkspaceRiskModel?.projectRiskRegisterSummary
        ]);
        const sortProjectRisksForRegister = pickFn(ctx, 'sortProjectRisksForRegister', [
            window.sortProjectRisksForRegister,
            window.KiuSocialWorkspaceRiskModel?.sortProjectRisksForRegister
        ]);
        const projectRiskIsActiveStatus = pickFn(ctx, 'projectRiskIsActiveStatus', [
            window.projectRiskIsActiveStatus,
            window.KiuSocialWorkspaceRiskModel?.projectRiskIsActiveStatus
        ]);

        const hoursOf = (task) => (typeof taskDurationHours === 'function' ? taskDurationHours(task) : 0);
        const openWorkHours = typeof sumProjectOpenWorkHours === 'function' ? sumProjectOpenWorkHours(project) : 0;
        const actualHours = typeof sumProjectActualHours === 'function' ? sumProjectActualHours(project) : 0;
        const fmtHours = (h) => (typeof formatProjectScheduleHours === 'function' ? formatProjectScheduleHours(h) : `${h}h`);
        const fmtDate = (start, offset) => (
            typeof formatProjectScheduleDate === 'function' ? formatProjectScheduleDate(start, offset) : ''
        );

        const taskById = new Map(tasks.map((t) => [text(t?.id), t]));
        const isDone = (t) => text(t?.status) === 'done';
        const openTasks = tasks.filter((t) => !isDone(t));

        // ---- Progress ----
        const statusCounts = { todo: 0, 'in-progress': 0, blocked: 0, done: 0 };
        tasks.forEach((t) => {
            const raw = text(t?.status || 'todo');
            const key = raw === 'backlog' ? 'todo' : raw;
            if (statusCounts[key] == null) statusCounts.todo += 1;
            else statusCounts[key] += 1;
        });
        const totalTasks = tasks.length;
        const donePct = totalTasks ? Math.round((statusCounts.done / totalTasks) * 100) : 0;

        // ---- Budget ----
        const planned = tasks.reduce((s, t) => s + (Number(t?.budgetEstimate) || 0), 0);
        const spent = countNum(project?.budgetSpentTotal);
        const capValue = Number(project?.budgetCap) || 0;
        const overCap = capValue > 0 && planned > capValue;
        const noBudgetLine = openTasks.filter((t) => !(Number(t?.budgetEstimate) > 0)).length;

        // ---- Schedule / CPM ----
        const now = Number.isFinite(Number(ctx.now)) ? Number(ctx.now) : Date.now();
        const weekMs = now + 7 * 86400000;
        const overdue = openTasks.filter((t) => {
            const d = Date.parse(text(t?.dueAt || ''));
            return Number.isFinite(d) && d < now;
        });
        const dueSoon = openTasks.filter((t) => {
            const d = Date.parse(text(t?.dueAt || ''));
            return Number.isFinite(d) && d >= now && d <= weekMs;
        });
        const blocked = tasks.filter((t) => text(t?.status) === 'blocked');
        const scheduleStartAt = text(project?.scheduleStartAt || '');
        const sched = ctx.schedule && typeof ctx.schedule === 'object'
            ? ctx.schedule
            : (typeof window.computeProjectSchedule === 'function' ? window.computeProjectSchedule(project) : { criticalChain: [], projectEndHours: 0 });
        const criticalIds = Array.isArray(sched.criticalChain) ? sched.criticalChain : [];
        const shortestFinish = fmtHours(sched.projectEndHours);
        const plannedFinishLabel = scheduleStartAt
            ? fmtDate(scheduleStartAt, sched.projectEndHours)
            : '';
        const dueDates = tasks.map((t) => Date.parse(text(t?.dueAt || ''))).filter((d) => Number.isFinite(d));
        const lastDueDate = dueDates.length ? new Date(Math.max(...dueDates)) : null;
        const noEstOpen = openTasks.filter((t) => !t?.isMilestone && hoursOf(t) <= 0).length;
        const overEstimateCount = tasks.filter((t) => {
            const act = normalizeTaskTime(t?.actualTime);
            const est = normalizeTaskTime(t?.timeEstimate);
            return act > 0 && est > 0 && act > est;
        }).length;
        const remainingHours = Math.round(openWorkHours * 10) / 10;
        const loggedHours = Math.round(actualHours * 10) / 10;

        // ---- Ownership / readiness ----
        const unassigned = openTasks.filter((t) => !text(t?.assigneeUserId));
        let readyN = 0;
        let waitingN = 0;
        if (typeof resolveDeskTaskReadiness === 'function') {
            openTasks.forEach((t) => {
                const r = resolveDeskTaskReadiness(t, taskById, groups);
                if (r?.kind === 'ready') readyN += 1;
                else if (r?.kind === 'waiting') waitingN += 1;
            });
        }

        // ---- Risks ----
        const riskSummary = typeof projectRiskRegisterSummary === 'function'
            ? projectRiskRegisterSummary(risks)
            : { open: 0, high: 0, unassigned: 0 };
        const topRisks = typeof sortProjectRisksForRegister === 'function'
            ? sortProjectRisksForRegister(risks)
                .filter((r) => (typeof projectRiskIsActiveStatus === 'function' ? projectRiskIsActiveStatus(r?.status) : true))
                .slice(0, 3)
            : [];

        // ---- Dependencies ----
        const dependsOn = typeof projectTaskDependsOnIds === 'function'
            ? (t) => projectTaskDependsOnIds(t)
            : () => [];
        const isGroupId = typeof isProjectTaskGraphGroupId === 'function'
            ? (id) => isProjectTaskGraphGroupId(id)
            : () => false;
        const linkCount = tasks.reduce((s, t) => s + dependsOn(t).filter((d) => taskById.has(d) || isGroupId(d)).length, 0);
        const hasCycle = (() => {
            const color = new Map();
            const visit = (id) => {
                color.set(id, 1);
                const t = taskById.get(id);
                const deps = t ? dependsOn(t).filter((d) => taskById.has(d)) : [];
                for (const d of deps) {
                    const c = color.get(d) || 0;
                    if (c === 1) return true;
                    if (c === 0 && visit(d)) return true;
                }
                color.set(id, 2);
                return false;
            };
            for (const t of tasks) {
                const id = text(t?.id);
                if ((color.get(id) || 0) === 0 && visit(id)) return true;
            }
            return false;
        })();
        let bottleneck = null;
        let bottleneckCount = 0;
        if (typeof projectTaskDownstreamIds === 'function') {
            tasks.forEach((t) => {
                const c = projectTaskDownstreamIds(text(t?.id), tasks).length;
                if (c > bottleneckCount) {
                    bottleneckCount = c;
                    bottleneck = t;
                }
            });
        }

        // ---- Team load ----
        const loadByUser = new Map();
        openTasks.forEach((t) => {
            const key = text(t?.assigneeUserId || '') || '__unassigned__';
            const cur = loadByUser.get(key) || { count: 0, hours: 0 };
            cur.count += 1;
            cur.hours += hoursOf(t);
            loadByUser.set(key, cur);
        });
        (Array.isArray(project?.workloadByMember) ? project.workloadByMember : []).forEach((entry) => {
            const key = text(entry?.userId || '');
            if (!key) return;
            const cur = loadByUser.get(key) || { count: 0, hours: 0 };
            const apiHours = Number(entry?.hours) || 0;
            const apiCount = countNum(entry?.count);
            if (apiHours > cur.hours) cur.hours = apiHours;
            if (apiCount > cur.count) cur.count = apiCount;
            loadByUser.set(key, cur);
        });
        const loadList = [...loadByUser.entries()]
            .map(([key, v]) => ({ key, ...v }))
            .sort((a, b) => b.hours - a.hours || b.count - a.count);
        const maxLoad = Math.max(1, ...loadList.map((l) => l.hours), 1);

        // ---- Composite verdict ----
        const issues = [];
        if (hasCycle) issues.push('circular dependency detected');
        if (overdue.length) issues.push(`${overdue.length} overdue`);
        if (blocked.length) issues.push(`${blocked.length} blocked`);
        if (overCap) issues.push('over budget cap');
        if (riskSummary.high) issues.push(`${riskSummary.high} high risk${riskSummary.high === 1 ? '' : 's'}`);
        if (unassigned.length) issues.push(`${unassigned.length} unassigned`);
        if (noEstOpen > 0 && openTasks.length) issues.push(`${noEstOpen} open task${noEstOpen === 1 ? '' : 's'} lack time estimates`);
        if (!criticalIds.length && openTasks.length && noEstOpen === openTasks.length) {
            issues.push('critical path locked until estimates exist');
        }
        let healthLevel = 'good';
        let healthLabel = 'On track';
        if (hasCycle || overdue.length >= 3 || riskSummary.high >= 2 || overCap) {
            healthLevel = 'critical';
            healthLabel = 'At risk';
        } else if (issues.length) {
            healthLevel = 'warn';
            healthLabel = 'Needs attention';
        }
        const topIssue = issues[0] || 'No major red flags from live task data';
        const budgetTail = {
            kind: capValue > 0 ? (overCap ? 'over' : 'under') : 'none',
            delta: capValue > 0 ? Math.abs(overCap ? planned - capValue : Math.max(0, capValue - planned)) : 0,
            capValue,
            planned
        };

        // ---- Data readiness ----
        const openN = openTasks.length || 1;
        let readyOwner = 0;
        let readyEst = 0;
        let readyDue = 0;
        let readyBudget = 0;
        const noEstTasks = [];
        const unassignedTasks = [];
        const noDueTasks = [];
        openTasks.forEach((t) => {
            if (text(t?.assigneeUserId)) readyOwner += 1;
            else unassignedTasks.push(t);
            if (t?.isMilestone || hoursOf(t) > 0) readyEst += 1;
            else noEstTasks.push(t);
            if (Number.isFinite(Date.parse(text(t?.dueAt || '')))) readyDue += 1;
            else noDueTasks.push(t);
            if (Number(t?.budgetEstimate) > 0) readyBudget += 1;
        });
        const dataReadiness = openTasks.length
            ? Math.round(((readyOwner + readyEst + readyDue + readyBudget) / (openN * 4)) * 100)
            : 100;
        const dataChecks = [
            { key: 'owner', label: 'Owners', ok: readyOwner, total: openTasks.length, fix: unassigned.length },
            { key: 'est', label: 'Time estimates', ok: readyEst, total: openTasks.length, fix: noEstOpen },
            { key: 'due', label: 'Due dates', ok: readyDue, total: openTasks.length, fix: noDueTasks.length },
            { key: 'budget', label: 'Budget lines', ok: readyBudget, total: openTasks.length, fix: noBudgetLine }
        ];

        // ---- Why this score ----
        const whyBits = [];
        if (healthLevel === 'good') {
            whyBits.push('No cycle, no heavy overdue pile, and no budget over-cap.');
        } else {
            if (hasCycle) whyBits.push('A circular dependency was found — order links loop.');
            if (overdue.length >= 3) whyBits.push(`${overdue.length} tasks are overdue (3+ triggers At risk).`);
            else if (overdue.length) whyBits.push(`${overdue.length} overdue task${overdue.length === 1 ? '' : 's'}.`);
            if (riskSummary.high >= 2) whyBits.push(`${riskSummary.high} high-exposure risks are still open.`);
            else if (riskSummary.high) whyBits.push('At least one high-exposure risk is open.');
            if (overCap) whyBits.push('Planned task budgets exceed the project cap.');
            if (unassigned.length) whyBits.push(`${unassigned.length} open task${unassigned.length === 1 ? '' : 's'} have no owner.`);
            if (noEstOpen) whyBits.push(`${noEstOpen} open task${noEstOpen === 1 ? '' : 's'} lack time estimates (weakens critical path).`);
            if (blocked.length) whyBits.push(`${blocked.length} task${blocked.length === 1 ? '' : 's'} marked blocked.`);
        }
        if (!whyBits.length) whyBits.push('Live task data looks clean enough for class progress.');

        // ---- Coach actions ----
        const weekActions = [];
        if (unassigned.length) {
            weekActions.push({
                icon: 'fa-user-plus',
                title: `Assign owners (${unassigned.length})`,
                detail: 'Group projects fail when work has no name on it.',
                action: 'project-task-focus',
                focus: 'unassigned'
            });
        }
        if (noEstOpen) {
            weekActions.push({
                icon: 'fa-stopwatch',
                title: `Add time estimates (${noEstOpen})`,
                detail: 'Critical path and shortest finish need hours or PERT on open tasks.',
                action: 'project-task-focus',
                focus: 'all',
                hint: 'no-est'
            });
        }
        if (bottleneck && bottleneckCount > 1) {
            weekActions.push({
                icon: 'fa-diamond',
                title: `Unblock bottleneck “${text(bottleneck.title || 'task')}”`,
                detail: `${bottleneckCount} tasks wait on it — finish or re-link dependencies.`,
                action: 'project-task-detail-open',
                taskId: text(bottleneck.id)
            });
        }
        if (!scheduleStartAt && openTasks.length) {
            weekActions.push({
                icon: 'fa-calendar-day',
                title: 'Set project schedule start',
                detail: 'CPM planned finish needs a project start date (not only due dates).',
                action: 'project-settings-open'
            });
        }
        if (overdue.length) {
            weekActions.push({
                icon: 'fa-clock',
                title: `Clear overdue work (${overdue.length})`,
                detail: 'Update status, replan due dates, or finish the work.',
                action: 'project-task-focus',
                focus: 'overdue'
            });
        }
        if (!riskSummary.open && openTasks.length >= 3) {
            weekActions.push({
                icon: 'fa-triangle-exclamation',
                title: 'Log 1–2 project risks',
                detail: 'For graded projects: scope slip, missing estimates, or a single bottleneck.',
                action: 'project-risk-open'
            });
        }
        if (waitingN && !weekActions.some((a) => a.focus === 'blocked')) {
            weekActions.push({
                icon: 'fa-link',
                title: `Review waiting tasks (${waitingN})`,
                detail: 'These cannot start until predecessors finish — check order links on the map.',
                action: 'project-task-focus',
                focus: 'blocked'
            });
        }
        const weekActionsTop = weekActions.slice(0, 5);

        const fixSamples = [];
        noEstTasks.slice(0, 4).forEach((t) => {
            fixSamples.push({
                id: text(t.id),
                title: text(t.title || 'Task'),
                reason: 'No time estimate'
            });
        });
        unassignedTasks.slice(0, 4).forEach((t) => {
            if (fixSamples.some((f) => f.id === text(t.id))) return;
            if (fixSamples.length >= 6) return;
            fixSamples.push({
                id: text(t.id),
                title: text(t.title || 'Task'),
                reason: 'Unassigned'
            });
        });

        const taskTitles = {};
        criticalIds.forEach((id) => {
            taskTitles[id] = text(taskById.get(id)?.title || 'Task');
        });

        return {
            projectId,
            projectName: text(project.name || project.title || 'Project'),
            currency,
            statusCounts,
            totalTasks,
            donePct,
            planned,
            spent,
            capValue,
            overCap,
            noBudgetLine,
            budgetTail,
            overdueCount: overdue.length,
            dueSoonCount: dueSoon.length,
            blockedCount: blocked.length,
            scheduleStartAt,
            criticalIds,
            shortestFinish,
            plannedFinishLabel,
            lastDueAt: lastDueDate ? lastDueDate.toISOString() : '',
            noEstOpen,
            overEstimateCount,
            remainingHours,
            loggedHours,
            unassignedCount: unassigned.length,
            readyN,
            waitingN,
            riskSummary,
            topRisks,
            linkCount,
            hasCycle,
            bottleneckId: bottleneck ? text(bottleneck.id) : '',
            bottleneckTitle: bottleneck ? text(bottleneck.title || 'A task') : '',
            bottleneckCount,
            groupCount: groups.length,
            loadList,
            maxLoad,
            issues,
            healthLevel,
            healthLabel,
            topIssue,
            dataReadiness,
            dataChecks,
            whyBits,
            weekActionsTop,
            fixSamples,
            taskTitles,
            canContribute: Boolean(project.viewerCanContribute),
            riskCount: risks.length
        };
    }

    /**
     * Pure plan-picker model (no DOM). Callers inject project/group/plan helpers via ctx.
     * @param {object} runtime
     * @param {object} dialog
     * @param {object} ctx
     *   resolveActiveSocialProject, getProjectTaskGraphGroups, readProjectWeekPlan,
     *   resolveTaskPackageId, normalizeProjectPlanHorizon, projectPlanHorizonLabel,
     *   normalizeProjectTaskStatusId
     */
    function buildProjectHealthPlanPickModel(runtime, dialog, ctx = {}) {
        const resolveActiveSocialProject = pickFn(ctx, 'resolveActiveSocialProject', [
            hooks().resolveActiveSocialProject,
            window.resolveActiveSocialProject
        ]);
        const getProjectTaskGraphGroups = pickFn(ctx, 'getProjectTaskGraphGroups', [
            hooks().getProjectTaskGraphGroups,
            window.getProjectTaskGraphGroups,
            window.KiuSocialWorkspaceGraphModel?.getProjectTaskGraphGroups,
            window.KiuSocialWorkspaceScheduleModel?.getProjectTaskGraphGroups
        ]);
        const readProjectWeekPlan = pickFn(ctx, 'readProjectWeekPlan', [
            hooks().readProjectWeekPlan,
            window.readProjectWeekPlan
        ]);
        const resolveTaskPackageId = pickFn(ctx, 'resolveTaskPackageId', [
            hooks().resolveTaskPackageId,
            window.resolveTaskPackageId
        ]);
        const normalizeProjectPlanHorizon = pickFn(ctx, 'normalizeProjectPlanHorizon', [
            hooks().normalizeProjectPlanHorizon,
            window.normalizeProjectPlanHorizon
        ]);
        const projectPlanHorizonLabel = pickFn(ctx, 'projectPlanHorizonLabel', [
            hooks().projectPlanHorizonLabel,
            window.projectPlanHorizonLabel
        ]);
        const normalizeProjectTaskStatusId = pickFn(ctx, 'normalizeProjectTaskStatusId', [
            hooks().normalizeProjectTaskStatusId,
            window.normalizeProjectTaskStatusId
        ]);

        if (typeof resolveActiveSocialProject !== 'function'
            || typeof getProjectTaskGraphGroups !== 'function'
            || typeof readProjectWeekPlan !== 'function'
            || typeof resolveTaskPackageId !== 'function'
            || typeof normalizeProjectPlanHorizon !== 'function'
            || typeof projectPlanHorizonLabel !== 'function'
            || typeof normalizeProjectTaskStatusId !== 'function') {
            return null;
        }

        const projectId = text(dialog?.projectId || runtime?.ui?.activeProjectId || '');
        const project = resolveActiveSocialProject(runtime, projectId);
        if (!project) return null;
        const horizon = normalizeProjectPlanHorizon(dialog?.horizon || runtime?.ui?.projectHealthPlanWindow || 'weeks');
        const horizonLabel = projectPlanHorizonLabel(horizon);
        const tasks = Array.isArray(project.tasks) ? project.tasks : [];
        const groups = getProjectTaskGraphGroups(runtime, projectId);
        const plannedSet = new Set(readProjectWeekPlan(projectId, horizon));
        const selectedSet = new Set(
            (Array.isArray(runtime?.ui?.projectHealthPlanPickSelectedIds) ? runtime.ui.projectHealthPlanPickSelectedIds : [])
                .map((id) => text(id))
                .filter(Boolean)
        );
        const search = text(runtime?.ui?.projectHealthPlanPickSearch || '').toLowerCase();
        const openOnly = runtime?.ui?.projectHealthPlanPickStatus !== 'all';
        const hidePlanned = runtime?.ui?.projectHealthPlanPickHidePlanned !== false;
        const browseRaw = text(runtime?.ui?.projectHealthPlanPickBrowseId || 'all') || 'all';
        const nowMs = Date.now();

        const taskPackageId = (task) => resolveTaskPackageId(text(task?.id), groups) || '__ungrouped__';

        const isEligible = (t) => {
            const tid = text(t?.id);
            if (!tid) return false;
            const st = normalizeProjectTaskStatusId(t?.status);
            if (openOnly && st === 'done') return false;
            if (hidePlanned && plannedSet.has(tid)) return false;
            if (search) {
                const hay = `${text(t?.title || '')} ${text(t?.description || '')}`.toLowerCase();
                if (!hay.includes(search)) return false;
            }
            return true;
        };

        const eligible = tasks.filter(isEligible).sort((a, b) => {
            const da = Date.parse(text(a?.dueAt || '')) || Infinity;
            const db = Date.parse(text(b?.dueAt || '')) || Infinity;
            if (da !== db) return da - db;
            return text(a?.title || '').localeCompare(text(b?.title || ''));
        });

        const countByPackage = new Map();
        eligible.forEach((t) => {
            const pkg = taskPackageId(t);
            countByPackage.set(pkg, (countByPackage.get(pkg) || 0) + 1);
        });

        const packageRail = [
            { id: 'all', name: 'All open', count: eligible.length }
        ];
        groups.forEach((g) => {
            const id = text(g?.id);
            if (!id) return;
            packageRail.push({
                id,
                name: text(g?.name || 'Package'),
                count: countByPackage.get(id) || 0
            });
        });
        packageRail.push({
            id: '__ungrouped__',
            name: 'Ungrouped',
            count: countByPackage.get('__ungrouped__') || 0
        });

        let browseId = browseRaw;
        if (browseId !== 'all' && browseId !== '__ungrouped__'
            && !groups.some((g) => text(g?.id) === browseId)) {
            browseId = 'all';
        }

        const visibleTasks = browseId === 'all'
            ? eligible
            : eligible.filter((t) => taskPackageId(t) === browseId);

        const visibleIds = visibleTasks.map((t) => text(t.id));
        const selectedVisible = visibleIds.filter((id) => selectedSet.has(id)).length;
        const allVisibleSelected = visibleIds.length > 0 && selectedVisible === visibleIds.length;
        const selectedCount = selectedSet.size;

        return {
            projectId,
            project,
            horizon,
            horizonLabel,
            groups,
            packageRail,
            browseId,
            eligible,
            visibleTasks,
            visibleIds,
            selectedSet,
            selectedCount,
            selectedVisible,
            allVisibleSelected,
            nowMs,
            searchRaw: text(runtime?.ui?.projectHealthPlanPickSearch || ''),
            openOnly,
            hidePlanned
        };
    }

    const api = { buildProjectHealthModel, buildProjectHealthPlanPickModel };

    window.KiuSocialWorkspaceHealthModel = api;
    window.buildProjectHealthModel = buildProjectHealthModel;
    window.buildProjectHealthPlanPickModel = buildProjectHealthPlanPickModel;
})();
