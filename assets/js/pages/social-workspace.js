(function initSocialWorkspaceModule() {
    if (window.__KIU_SOCIAL_WORKSPACE_MODULE_LOADED) return;
    window.__KIU_SOCIAL_WORKSPACE_MODULE_LOADED = true;

    const hooks = window.__kiuSocialWorkspaceHooks || {};
        const {
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
        focusSocialDialog,
        fromDateTimeLocalValue,
        parseDependsOnFromForm,
        parseProjectTaskActualsPayload,
        parseProjectTaskBudgetEstimate,
        parseProjectTaskPriorityPayload,
        setPortalSocialFlash,
        setPortalSocialProjectMembership,
        syncSocialOverlayLock,
        updatePortalSocialProject,
        updatePortalSocialProjectRisk,
        updatePortalSocialProjectTask,
        queueProjectInviteSearchRefresh,
        syncPortfolioEditorInput,
        syncProjectTaskMatrixPreview,
        syncTaskChecklistInput
    } = hooks;

        const requiredHooks = {
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
        focusSocialDialog,
        fromDateTimeLocalValue,
        parseDependsOnFromForm,
        parseProjectTaskActualsPayload,
        parseProjectTaskBudgetEstimate,
        parseProjectTaskPriorityPayload,
        setPortalSocialFlash,
        setPortalSocialProjectMembership,
        syncSocialOverlayLock,
        updatePortalSocialProject,
        updatePortalSocialProjectRisk,
        updatePortalSocialProjectTask,
        queueProjectInviteSearchRefresh,
        syncPortfolioEditorInput,
        syncProjectTaskMatrixPreview,
        syncTaskChecklistInput
    };
    for (const [name, fn] of Object.entries(requiredHooks)) {
        if (typeof fn !== 'function') {
            throw new Error(`Social workspace hooks are unavailable: ${name}`);
        }
    }

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
    const PROJECT_TASK_STATUS_EDGE_COLOR = {
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

    function readProjectWeekPlansStore() {
        try {
            const raw = localStorage.getItem(PROJECT_WEEK_PLAN_KEY);
            const parsed = raw ? JSON.parse(raw) : {};
            return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
        } catch (error) {
            return {};
        }
    }

    function readProjectWeekPlan(projectId, windowKey) {
        const pid = text(projectId);
        if (!pid) return [];
        const win = normalizeProjectPlanHorizon(windowKey);
        const entry = migrateProjectPlanEntry(readProjectWeekPlansStore()[pid]);
        return entry[win] || [];
    }

    function writeProjectWeekPlan(projectId, windowKey, ids) {
        const pid = text(projectId);
        if (!pid) return;
        const win = normalizeProjectPlanHorizon(windowKey);
        const all = readProjectWeekPlansStore();
        const prev = migrateProjectPlanEntry(all[pid]);
        prev[win] = uniqueStrings((Array.isArray(ids) ? ids : []).map((id) => text(id)).filter(Boolean)).slice(0, PROJECT_WEEK_PLAN_MAX);
        all[pid] = prev;
        try {
            localStorage.setItem(PROJECT_WEEK_PLAN_KEY, JSON.stringify(all));
        } catch (error) {}
    }

    function addToProjectWeekPlan(projectId, windowKey, taskId) {
        const tid = text(taskId);
        if (!tid) return readProjectWeekPlan(projectId, windowKey);
        const next = readProjectWeekPlan(projectId, windowKey);
        if (!next.includes(tid)) next.push(tid);
        writeProjectWeekPlan(projectId, windowKey, next);
        return next;
    }

    function addManyToProjectWeekPlan(projectId, windowKey, taskIds) {
        const next = readProjectWeekPlan(projectId, windowKey);
        (Array.isArray(taskIds) ? taskIds : []).forEach((id) => {
            const tid = text(id);
            if (tid && !next.includes(tid)) next.push(tid);
        });
        writeProjectWeekPlan(projectId, windowKey, next);
        return next;
    }

    function removeFromProjectWeekPlan(projectId, windowKey, taskId) {
        const tid = text(taskId);
        const next = readProjectWeekPlan(projectId, windowKey).filter((id) => id !== tid);
        writeProjectWeekPlan(projectId, windowKey, next);
        return next;
    }

    /** Legacy alias */

    function normalizeProjectWeekPlanWindow(value) {
        return normalizeProjectPlanHorizon(value);
    }

    function orderDeskTasksByDependency(tasks, allProjectTasks = []) {
        const list = Array.isArray(tasks) ? tasks.filter((t) => t && text(t?.id)) : [];
        if (!list.length) return [];
        const ids = new Set(list.map((t) => text(t.id)));
        const byId = new Map(list.map((t) => [text(t.id), t]));

        const priorityRank = (task) => PROJECT_TASK_PRIORITY_RANK[text(task?.priority || 'medium').toLowerCase()] ?? 9;
        const dueMs = (task) => {
            const ms = Date.parse(text(task?.dueAt || ''));
            return Number.isFinite(ms) ? ms : Number.POSITIVE_INFINITY;
        };
        const compareTasks = (a, b) => {
            const pr = priorityRank(a) - priorityRank(b);
            if (pr) return pr;
            const dd = dueMs(a) - dueMs(b);
            if (dd) return dd;
            return text(a?.title || '').localeCompare(text(b?.title || ''), undefined, { sensitivity: 'base' });
        };

        // children map: parentId -> [child tasks in this list]
        const childrenOf = new Map();
        ids.forEach((id) => childrenOf.set(id, []));
        // primary parent for each child (first in-list dep after sorting dep tasks)
        const primaryParent = new Map();

        list.forEach((task) => {
            const tid = text(task.id);
            const inListParents = projectTaskDependsOnIds(task)
                .filter((depId) => ids.has(depId))
                .map((depId) => byId.get(depId))
                .filter(Boolean)
                .sort(compareTasks);
            if (!inListParents.length) return;
            const parent = inListParents[0];
            const pid = text(parent.id);
            primaryParent.set(tid, pid);
            childrenOf.get(pid).push(task);
        });

        // Sort each children list for stable sibling order
        childrenOf.forEach((kids, pid) => {
            kids.sort(compareTasks);
            childrenOf.set(pid, kids);
        });

        const roots = list
            .filter((task) => !primaryParent.has(text(task.id)))
            .sort(compareTasks);

        const ordered = [];
        const visited = new Set();

        const walk = (task, depth) => {
            const id = text(task.id);
            if (!id || visited.has(id)) return;
            visited.add(id);
            const kids = childrenOf.get(id) || [];
            ordered.push({
                task,
                depth: Math.max(0, Math.min(8, depth)),
                childCount: kids.length
            });
            kids.forEach((child) => walk(child, depth + 1));
        };

        roots.forEach((task) => walk(task, 0));

        // Leftovers (cycles or unreachable) — append sorted at depth 0
        list
            .filter((task) => !visited.has(text(task.id)))
            .sort(compareTasks)
            .forEach((task) => walk(task, 0));

        return ordered;
    }

    /** Nested forest for droplist tree UI (parent → child → grandchild …). */

    function buildDeskTaskForest(tasks, allProjectTasks = []) {
        const list = Array.isArray(tasks) ? tasks.filter((t) => t && text(t?.id)) : [];
        if (!list.length) return [];
        const ids = new Set(list.map((t) => text(t.id)));
        const byId = new Map(list.map((t) => [text(t.id), t]));
        const priorityRank = (task) => PROJECT_TASK_PRIORITY_RANK[text(task?.priority || 'medium').toLowerCase()] ?? 9;
        const dueMs = (task) => {
            const ms = Date.parse(text(task?.dueAt || ''));
            return Number.isFinite(ms) ? ms : Number.POSITIVE_INFINITY;
        };
        const compareTasks = (a, b) => {
            const pr = priorityRank(a) - priorityRank(b);
            if (pr) return pr;
            const dd = dueMs(a) - dueMs(b);
            if (dd) return dd;
            return text(a?.title || '').localeCompare(text(b?.title || ''), undefined, { sensitivity: 'base' });
        };
        const childrenOf = new Map();
        ids.forEach((id) => childrenOf.set(id, []));
        const primaryParent = new Map();
        list.forEach((task) => {
            const tid = text(task.id);
            const inListParents = projectTaskDependsOnIds(task)
                .filter((depId) => ids.has(depId))
                .map((depId) => byId.get(depId))
                .filter(Boolean)
                .sort(compareTasks);
            if (!inListParents.length) return;
            const pid = text(inListParents[0].id);
            primaryParent.set(tid, pid);
            childrenOf.get(pid).push(task);
        });
        childrenOf.forEach((kids, pid) => {
            kids.sort(compareTasks);
            childrenOf.set(pid, kids);
        });
        const buildNode = (task, depth) => {
            const id = text(task.id);
            const kids = childrenOf.get(id) || [];
            return {
                task,
                depth: Math.max(0, Math.min(8, depth)),
                childCount: kids.length,
                children: kids.map((child) => buildNode(child, depth + 1))
            };
        };
        const roots = list.filter((task) => !primaryParent.has(text(task.id))).sort(compareTasks);
        const forest = roots.map((task) => buildNode(task, 0));
        // orphans / cycle leftovers as roots
        const seen = new Set();
        const mark = (node) => {
            seen.add(text(node.task.id));
            node.children.forEach(mark);
        };
        forest.forEach(mark);
        list.filter((task) => !seen.has(text(task.id))).sort(compareTasks).forEach((task) => {
            forest.push(buildNode(task, 0));
        });
        return forest;
    }

    function computePertExpected(optimistic, mostLikely, pessimistic) {
        const o = normalizeTaskTime(optimistic);
        const m = normalizeTaskTime(mostLikely);
        const p = normalizeTaskTime(pessimistic);
        if (o > 0 && m > 0 && p > 0 && o <= m && m <= p) {
            return Math.round(((o + 4 * m + p) / 6) * 10) / 10;
        }
        return m || 0;
    }

    function taskHasPert(task) {
        const o = normalizeTaskTime(task?.timeOptimistic);
        const m = normalizeTaskTime(task?.timeMostLikely);
        const p = normalizeTaskTime(task?.timePessimistic);
        return o > 0 && m > 0 && p > 0 && o <= m && m <= p;
    }

    function resolveTaskScheduleEstimate(task) {
        const unit = normalizeTaskTimeUnit(task?.timeUnit);
        const pert = computePertExpected(task?.timeOptimistic, task?.timeMostLikely, task?.timePessimistic);
        if (pert > 0 && taskHasPert(task)) return { estimate: pert, unit, source: 'pert' };
        const m = normalizeTaskTime(task?.timeMostLikely);
        if (m > 0) return { estimate: m, unit, source: 'mostLikely' };
        const est = normalizeTaskTime(task?.timeEstimate);
        return { estimate: est, unit, source: 'estimate' };
    }

    function taskDurationHours(task) {
        if (task?.isMilestone) return 0;
        const sched = resolveTaskScheduleEstimate(task);
        return sched.unit === 'd' ? sched.estimate * 8 : sched.estimate;
    }

    /** Remaining schedule duration: done → 0; blocked/open → full PERT/estimate. */

    function taskScheduleRemainingHours(task) {
        if (!task || task?.isMilestone) return 0;
        if (normalizeProjectTaskStatusId(task?.status) === 'done') return 0;
        return taskDurationHours(task);
    }

    function sumProjectOpenWorkHours(project) {
        return (Array.isArray(project?.tasks) ? project.tasks : [])
            .filter((t) => text(t?.status) !== 'done' && !t?.isMilestone)
            .reduce((sum, t) => sum + taskDurationHours(t), 0);
    }

    function sumProjectActualHours(project) {
        return (Array.isArray(project?.tasks) ? project.tasks : [])
            .filter((t) => text(t?.status) === 'done')
            .reduce((sum, t) => sum + (normalizeTaskTimeUnit(t?.timeUnit) === 'd' ? normalizeTaskTime(t?.actualTime) * 8 : normalizeTaskTime(t?.actualTime)), 0);
    }

    function computeProjectSchedule(project, options = {}) {
        const tasks = (Array.isArray(project?.tasks) ? project.tasks : []).filter((t) => t && text(t.id));
        const byId = new Map(tasks.map((t) => [text(t.id), t]));
        const taskIds = Array.from(byId.keys());
        // Packages as 0-duration schedule nodes (order + membership sink).
        let groups = Array.isArray(options.groups) ? options.groups : null;
        if (!groups) {
            try {
                const pid = text(project?.id || '');
                groups = pid && typeof getProjectTaskGraphGroups === 'function'
                    ? getProjectTaskGraphGroups(state(), pid)
                    : (Array.isArray(project?.taskGraphGroups) ? project.taskGraphGroups : []);
            } catch (error) {
                groups = Array.isArray(project?.taskGraphGroups) ? project.taskGraphGroups : [];
            }
        }
        const groupById = new Map();
        (Array.isArray(groups) ? groups : []).forEach((g) => {
            const gid = text(g?.id);
            if (gid) groupById.set(gid, g);
        });
        const groupIds = Array.from(groupById.keys());
        const ids = [...taskIds, ...groupIds];
        const isGroup = (id) => groupById.has(id);
        const known = new Set(ids);
        const dur = {};
        ids.forEach((id) => {
            dur[id] = isGroup(id) ? 0 : taskScheduleRemainingHours(byId.get(id));
        });
        const succ = {};
        const indeg = {};
        ids.forEach((id) => { succ[id] = []; indeg[id] = 0; });
        const link = (from, to) => {
            const a = text(from);
            const b = text(to);
            if (!a || !b || a === b || !known.has(a) || !known.has(b)) return;
            if (succ[a].includes(b)) return;
            succ[a].push(b);
            indeg[b] += 1;
        };
        // Task depends (task→task or package→task when dep is grp_*).
        taskIds.forEach((tid) => {
            projectTaskDependsOnIds(byId.get(tid)).forEach((dep) => link(dep, tid));
        });
        groupIds.forEach((gid) => {
            const g = groupById.get(gid);
            // Membership sink: members finish before package is "done".
            (Array.isArray(g?.memberTaskIds) ? g.memberTaskIds : []).forEach((m) => link(m, gid));
            projectGroupBlocksIds(g).forEach((tid) => link(gid, tid));
            projectGroupDependsOnIds(g).forEach((pred) => link(pred, gid));
        });
        // Forward pass
        const ES = {}, EF = {};
        const queue = ids.filter((id) => indeg[id] === 0);
        const indegF = { ...indeg };
        queue.forEach((id) => { ES[id] = 0; EF[id] = dur[id]; });
        let head = 0;
        while (head < queue.length) {
            const cur = queue[head++];
            (succ[cur] || []).forEach((nxt) => {
                ES[nxt] = Math.max(ES[nxt] || 0, EF[cur] || 0);
                EF[nxt] = Math.max(EF[nxt] || 0, (ES[nxt] || 0) + (dur[nxt] || 0));
                if (--indegF[nxt] === 0) queue.push(nxt);
            });
        }
        ids.forEach((id) => { if (ES[id] == null) { ES[id] = 0; EF[id] = dur[id] || 0; } });
        // Project end = max EF over tasks only (groups are 0-duration).
        const projectEnd = taskIds.reduce((m, id) => Math.max(m, EF[id] || 0), 0);
        // Backward pass
        const LF = {}, LS = {};
        const outdeg = {}; ids.forEach((id) => { outdeg[id] = (succ[id] || []).length; });
        const q2 = ids.filter((id) => outdeg[id] === 0);
        q2.forEach((id) => { LF[id] = projectEnd; LS[id] = projectEnd - (dur[id] || 0); });
        const outdegB = { ...outdeg };
        let h2 = 0;
        while (h2 < q2.length) {
            const cur = q2[h2++];
            ids.forEach((id) => {
                if ((succ[id] || []).includes(cur)) {
                    LF[id] = Math.min(LF[id] == null ? Infinity : LF[id], LS[cur] == null ? Infinity : LS[cur]);
                    LS[id] = (LF[id] == null ? projectEnd : LF[id]) - (dur[id] || 0);
                    if (--outdegB[id] === 0) q2.push(id);
                }
            });
        }
        ids.forEach((id) => {
            if (LF[id] == null) { LF[id] = projectEnd; LS[id] = projectEnd - (dur[id] || 0); }
        });
        const byIdSchedule = {};
        ids.forEach((id) => {
            const float = Math.max(0, Math.round(((LS[id] || 0) - (ES[id] || 0)) * 10) / 10);
            const group = isGroup(id);
            const task = group ? null : byId.get(id);
            const statusId = task ? normalizeProjectTaskStatusId(task?.status) : '';
            const isDone = statusId === 'done';
            const isBlocked = statusId === 'blocked';
            const hasIn = indeg[id] > 0;
            const hasOut = outdeg[id] > 0;
            // Task critical: zero float + remaining work (done never critical).
            // Package critical: filled in below from open members — not raw 0-duration float.
            const isCritical = isDone
                ? false
                : (group
                    ? false
                    : (float === 0 && ((dur[id] || 0) > 0 || Boolean(task?.isMilestone))));
            byIdSchedule[id] = {
                earliestStartHours: ES[id] || 0,
                earliestFinishHours: EF[id] || 0,
                latestStartHours: LS[id] || 0,
                latestFinishHours: LF[id] || 0,
                durationHours: dur[id] || 0,
                plannedDurationHours: group ? 0 : taskDurationHours(task),
                floatHours: isDone ? 0 : float,
                isCritical,
                isDone,
                isBlocked,
                hasDependencies: hasIn,
                hasSuccessors: hasOut,
                isGroup: group
            };
        });
        // Package on critical path: zero float + open member work, or a tight
        // critical bridge (critical predecessor ∧ critical successor, EF≈ES).
        // Order-only leaf packages (e.g. empty fr→asd) are not critical.
        const pred = {};
        ids.forEach((id) => { pred[id] = []; });
        ids.forEach((from) => {
            (succ[from] || []).forEach((to) => {
                pred[to].push(from);
            });
        });
        const timingTight = (from, to) => {
            const a = byIdSchedule[from];
            const b = byIdSchedule[to];
            if (!a || !b) return false;
            return Math.abs((a.earliestFinishHours || 0) - (b.earliestStartHours || 0)) < 0.01;
        };
        groupIds.forEach((gid) => {
            const g = groupById.get(gid);
            const row = byIdSchedule[gid];
            if (!g || !row) return;
            const hasOpenTask = (tid) => {
                const id = text(tid);
                if (!id || isProjectTaskGraphGroupId(id)) return false;
                const tRow = byIdSchedule[id];
                return Boolean(
                    tRow
                    && !tRow.isDone
                    && (Number(tRow.durationHours) > 0 || Boolean(byId.get(id)?.isMilestone))
                );
            };
            const openMemberWork = collectProjectTaskGraphGroupDescendantTaskIds(g, groups, { includeOrderLinks: false })
                .some(hasOpenTask);
            const isCriticalBridge = (pred[gid] || []).some((p) => byIdSchedule[p]?.isCritical && timingTight(p, gid))
                && (succ[gid] || []).some((s) => byIdSchedule[s]?.isCritical && timingTight(gid, s));
            row.isCritical = row.floatHours === 0
                && (row.hasDependencies || row.hasSuccessors)
                && (openMemberWork || isCriticalBridge);
        });
        // Critical edges: both ends critical and timing-tight. Zero-duration packages
        // use the same rule once marked critical above.
        const criticalEdges = new Set();
        ids.forEach((from) => {
            (succ[from] || []).forEach((to) => {
                const a = byIdSchedule[from];
                const b = byIdSchedule[to];
                if (!a?.isCritical || !b?.isCritical) return;
                if (Math.abs((a.earliestFinishHours || 0) - (b.earliestStartHours || 0)) < 0.01) {
                    criticalEdges.add(`${from}->${to}`);
                }
            });
        });
        const criticalChain = taskIds
            .filter((id) => byIdSchedule[id]?.isCritical)
            .sort((a, b) => (byIdSchedule[a].earliestStartHours || 0) - (byIdSchedule[b].earliestStartHours || 0));
        const criticalGroupIds = groupIds.filter((id) => byIdSchedule[id]?.isCritical);
        return {
            byId: byIdSchedule,
            criticalEdges,
            criticalChain,
            criticalGroupIds,
            projectEndHours: projectEnd
        };
    }

    function formatProjectScheduleHours(hours) {
        const n = Math.round((Number(hours) || 0) * 10) / 10;
        if (n <= 0) return '0h';
        if (n >= 8 && n % 8 === 0) return `${n / 8}d`;
        if (n >= 8) return `${Math.round((n / 8) * 10) / 10}d`;
        return `${n}h`;
    }

    /**
     * Float / slack display: hours first (matches estimates), plus workdays when ≥ 8h.
     * Avoids “5.9d slack” looking like the task’s duration.
     */

    function formatProjectScheduleFloat(hours) {
        const n = Math.round((Number(hours) || 0) * 10) / 10;
        if (n <= 0) return '0h';
        if (n < 8) return `${n}h`;
        const days = Math.round((n / 8) * 10) / 10;
        const hLabel = Number.isInteger(n) ? `${n}h` : `${n}h`;
        return `${hLabel} · ${days}d`;
    }

    const PROJECT_SCHEDULE_FLOAT_TITLE =
        'Schedule float (how much this can slip without delaying project finish). Not the task duration. Work time: 8h = 1d. Duration is the separate estimate/PERT pill.';

    /** Shared labels for full CPM display (ES/EF/LS/LF/float/duration). */

    function formatTaskScheduleDisplay(schedRow, options = {}) {
        const row = schedRow && typeof schedRow === 'object' ? schedRow : null;
        const scheduleStartAt = text(options.scheduleStartAt || '');
        const durationHours = Number(row?.durationHours) || 0;
        const floatHours = Number(row?.floatHours);
        const isDone = Boolean(row?.isDone) || text(options.statusId || '') === 'done';
        const isBlocked = Boolean(row?.isBlocked) || text(options.statusId || '') === 'blocked';
        const isCritical = Boolean(row?.isCritical) && !isDone;
        const hasDuration = durationHours > 0 || Boolean(options.isMilestone);
        const hoursOnly = (hours) => formatProjectScheduleHours(Number(hours) || 0);
        const prettyLabel = (hours) => {
            const h = Number(hours) || 0;
            const hLabel = hoursOnly(h);
            if (scheduleStartAt) {
                const d = formatProjectScheduleDate(scheduleStartAt, h);
                if (d) return h > 0 ? `${d} (+${hLabel})` : d;
            }
            return hLabel;
        };
        const esH = row ? Number(row.earliestStartHours) || 0 : 0;
        const efH = row ? Number(row.earliestFinishHours) || 0 : 0;
        const lsH = row ? Number(row.latestStartHours) || 0 : 0;
        const lfH = row ? Number(row.latestFinishHours) || 0 : 0;
        const floatH = Number.isFinite(floatHours) ? floatHours : 0;
        // Path is task-local status only — never stuff total float into path (confuses with duration).
        const pathLabel = !row
            ? '—'
            : (isDone
                ? 'Done'
                : (isCritical
                    ? (isBlocked ? 'Critical · blocked' : 'Critical path')
                    : (isBlocked ? 'Blocked' : 'Not critical')));
        const floatLabel = !row
            ? '—'
            : (isDone ? 'Done (no remaining slack)' : (isCritical ? '0 (critical)' : formatProjectScheduleFloat(floatH)));
        return {
            esLabel: row ? prettyLabel(esH) : '—',
            efLabel: row ? prettyLabel(efH) : '—',
            lsLabel: row ? prettyLabel(lsH) : '—',
            lfLabel: row ? prettyLabel(lfH) : '—',
            esHoursLabel: hoursOnly(esH),
            efHoursLabel: hoursOnly(efH),
            lsHoursLabel: hoursOnly(lsH),
            lfHoursLabel: hoursOnly(lfH),
            floatLabel,
            pathLabel,
            durationLabel: hoursOnly(durationHours),
            hasDuration: durationHours > 0 || Boolean(options.isMilestone),
            isCritical,
            isDone,
            isBlocked,
            floatHours: floatH,
            noEstimate: Boolean(options.needEstimate) && durationHours <= 0 && !options.isMilestone && !isDone,
            hasProjectStart: Boolean(scheduleStartAt)
        };
    }

    function projectScheduleCalendarDate(startAt, offsetHours) {
        const base = Date.parse(text(startAt || ''));
        if (!Number.isFinite(base)) return null;
        return new Date(base + (Number(offsetHours) || 0) * 3600000);
    }

    function formatProjectScheduleDate(startAt, offsetHours) {
        const date = projectScheduleCalendarDate(startAt, offsetHours);
        if (!date) return '';
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function renderProjectPlanVsBaselineStrip(project) {
        if (!project) return '';
        const baselineAt = text(project?.baselineAt || '');
        const baseline = project?.baselineSnapshot && typeof project.baselineSnapshot === 'object' ? project.baselineSnapshot : null;
        const canManage = Boolean(project.isManager);
        if (!baselineAt || !baseline) {
            if (!canManage) return '';
            return `
                <section class="social-neo-card social-project-baseline-card">
                    <div class="social-neo-section-head">
                        <div><strong>Plan vs reality</strong><span>Freeze the current plan to measure drift later.</span></div>
                    </div>
                    <p class="social-neo-muted social-neo-copy-mt-8">Set a baseline after your plan is stable — estimates, schedule, and milestones get snapshotted.</p>
                    <div class="social-project-card-new-cta"><span data-action="project-baseline-set" data-project-id="${escape(text(project.id))}">Set baseline →</span></div>
                </section>`;
        }
        const liveEnd = computeProjectSchedule(project).projectEndHours;
        const baseEnd = Number(baseline.projectEndHours) || 0;
        const slipHours = Math.round((liveEnd - baseEnd) * 10) / 10;
        const slipLabel = slipHours === 0
            ? 'On plan'
            : `${slipHours > 0 ? '+' : ''}${formatProjectScheduleHours(slipHours)} vs baseline`;
        const slipTone = slipHours > 0 ? 'rose' : slipHours < 0 ? 'emerald' : 'slate';
        const baselineTasks = Array.isArray(baseline.tasks) ? baseline.tasks : [];
        const liveTasks = Array.isArray(project.tasks) ? project.tasks : [];
        const driftCount = liveTasks.filter((task) => {
            const snap = baselineTasks.find((row) => text(row?.id) === text(task?.id));
            if (!snap) return false;
            return normalizeTaskTime(snap.timeEstimate) !== normalizeTaskTime(task?.timeEstimate)
                || Math.round((Number(snap.budgetEstimate) || 0) * 100) !== Math.round((Number(task?.budgetEstimate) || 0) * 100);
        }).length;
        const scheduleStartAt = text(project?.scheduleStartAt || baseline.scheduleStartAt || '');
        const finishCompare = scheduleStartAt
            ? `${formatProjectScheduleDate(scheduleStartAt, baseEnd)} → ${formatProjectScheduleDate(scheduleStartAt, liveEnd)}`
            : `${formatProjectScheduleHours(baseEnd)} → ${formatProjectScheduleHours(liveEnd)}`;
        return `
            <section class="social-neo-card social-project-baseline-card" data-lux-transparency-exempt="1">
                <div class="social-neo-section-head">
                    <div><strong>Plan vs baseline</strong><span>Snapshotted ${escape(when(baselineAt))}</span></div>
                    <span class="social-neo-pill is-tone-${escape(slipTone)}">${escape(slipLabel)}</span>
                </div>
                <div class="social-project-baseline-facts">
                    <span class="social-neo-pill"><i class="fas fa-route"></i>${escape(finishCompare)}</span>
                    ${driftCount ? `<span class="social-neo-pill is-tone-rose">${escape(String(driftCount))} task${driftCount === 1 ? '' : 's'} changed since baseline</span>` : '<span class="social-neo-pill is-tone-emerald">Estimates match baseline</span>'}
                </div>
                ${canManage ? `<div class="social-project-card-new-cta"><span data-action="project-baseline-set" data-project-id="${escape(text(project.id))}">Update baseline →</span></div>` : ''}
            </section>`;
    }

    function renderProjectProgressHoursStrip(project) {
        if (!project) return '';
        const remaining = Math.round(sumProjectOpenWorkHours(project) * 10) / 10;
        const logged = Math.round(sumProjectActualHours(project) * 10) / 10;
        if (remaining <= 0 && logged <= 0) return '';
        const baseline = project?.baselineSnapshot && typeof project.baselineSnapshot === 'object' ? project.baselineSnapshot : null;
        const baselineAt = text(project?.baselineAt || '');
        let slipTone = 'slate';
        let slipLabel = '';
        if (baselineAt && baseline) {
            const liveEnd = computeProjectSchedule(project).projectEndHours;
            const baseEnd = Number(baseline.projectEndHours) || 0;
            const slipHours = Math.round((liveEnd - baseEnd) * 10) / 10;
            slipLabel = slipHours === 0 ? 'On baseline schedule' : `${slipHours > 0 ? '+' : ''}${formatProjectScheduleHours(slipHours)} vs baseline`;
            slipTone = slipHours > 0 ? 'rose' : slipHours < 0 ? 'emerald' : 'slate';
        }
        return `
            <section class="social-neo-card social-project-progress-hours-card" data-lux-transparency-exempt="1">
                <div class="social-neo-section-head">
                    <div><strong>Work hours</strong><span>Open estimate vs time logged on done tasks.</span></div>
                </div>
                <div class="social-project-progress-hours-facts">
                    <span class="social-neo-pill"><i class="fas fa-hourglass-half"></i>${escape(formatProjectScheduleHours(remaining))} remaining</span>
                    <span class="social-neo-pill"><i class="fas fa-stopwatch"></i>${escape(formatProjectScheduleHours(logged))} logged</span>
                    ${slipLabel ? `<span class="social-neo-pill is-tone-${escape(slipTone)}">${escape(slipLabel)}</span>` : ''}
                </div>
            </section>`;
    }

    /**
     * Preview-style fit: scale + pan so every card is visible and centered in the viewport.
     * Pan is scroll-canvas relative: (0,0) = top-left of the content viewBox (not world origin).
     */


    /* ── Portfolio data layer ── */

    function portfolioStatus(value, raw = {}) {
        const normalized = text(value).toLowerCase();
        if (normalized === 'published' || normalized === 'draft') return normalized;
        if (raw?.showcasePageId || raw?.showcaseEnabled) return 'published';
        return 'draft';
    }

    function portfolioVisibilityMode(raw = {}) {
        const normalized = text(raw?.visibilityMode || '').toLowerCase();
        if (['all_logged_in', 'students_only', 'tas_only', 'professors_only', 'staff_only', 'custom'].includes(normalized)) {
            return normalized;
        }
        const legacy = text(raw?.visibility || '').toLowerCase();
        if (legacy === 'public') return 'all_logged_in';
        return 'custom';
    }

    function parsePortfolioTextList(value) {
        return uniqueStrings(
            String(value || '')
                .split(/[\n,]/)
                .map((item) => text(item))
                .filter(Boolean)
        );
    }

    function parsePortfolioLinksInput(value) {
        return String(value || '')
            .split('\n')
            .map((line) => text(line))
            .filter(Boolean)
            .map((line) => {
                const parts = line.split('|').map((item) => text(item));
                if (parts.length > 1) {
                    return { label: parts[0] || parts[1], url: parts.slice(1).join(' | ') };
                }
                return { label: line, url: line };
            })
            .filter((item) => text(item.url));
    }

    function serializePortfolioLinks(items = []) {
        return (Array.isArray(items) ? items : [])
            .map((item) => {
                const label = text(item?.label || '');
                const url = text(item?.url || item?.href || '');
                if (!url) return '';
                return label && label !== url ? `${label} | ${url}` : url;
            })
            .filter(Boolean)
            .join('\n');
    }

    function portfolioAudienceLabel(mode) {
        const labels = {
            all_logged_in: 'All logged-in users',
            students_only: 'Campus peers',
            tas_only: 'TAs only',
            professors_only: 'Professors only',
            staff_only: 'Staff only',
            custom: 'Custom audience'
        };
        return labels[text(mode).toLowerCase()] || 'Custom audience';
    }

    function normalizePortfolioEntry(raw = {}) {
        const ownerUserId = text(raw?.ownerUserId || raw?.authorUserId || '');
        const owner = accountById(ownerUserId) || { id: ownerUserId };
        const facultyCodes = uniqueStrings([
            ...(Array.isArray(raw?.facultyCodes) ? raw.facultyCodes : []),
            ...(Array.isArray(raw?.facultyTags) ? raw.facultyTags : []),
            text(raw?.ownerFacultyCode || owner?.facultyCode || owner?.faculty || '')
        ].filter(Boolean));
        const visibleFacultyCodes = uniqueStrings([
            ...(Array.isArray(raw?.visibleFacultyCodes) ? raw.visibleFacultyCodes : []),
            ...(text(raw?.visibility || '').toLowerCase() === 'faculty' ? facultyCodes : [])
        ].filter(Boolean));
        const mediaItems = (Array.isArray(raw?.mediaItems) ? raw.mediaItems : [])
            .map((item) => item && typeof item === 'object' ? item : null)
            .filter(Boolean);
        const entry = {
            ...raw,
            id: text(raw?.id || ''),
            title: text(raw?.title || raw?.name || 'Portfolio showcase'),
            summary: text(raw?.summary || raw?.description || ''),
            description: text(raw?.description || raw?.summary || ''),
            ownerUserId,
            owner,
            ownerRole: text(owner?.role || raw?.ownerRole || 'student').toLowerCase(),
            ownerFacultyCode: text(raw?.ownerFacultyCode || owner?.facultyCode || owner?.faculty || facultyCodes[0] || ''),
            facultyCodes,
            facultyTags: facultyCodes,
            hashtags: uniqueStrings([...(Array.isArray(raw?.hashtags) ? raw.hashtags : []), ...(Array.isArray(raw?.tags) ? raw.tags : [])]),
            skillTags: uniqueStrings([...(Array.isArray(raw?.skillTags) ? raw.skillTags : []), ...(Array.isArray(raw?.skills) ? raw.skills : [])]),
            mediaItems,
            externalLinks: (Array.isArray(raw?.externalLinks) ? raw.externalLinks : [])
                .map((item) => item && typeof item === 'object' ? { label: text(item.label || item.url), url: text(item.url || '') } : null)
                .filter((item) => text(item?.url)),
            status: portfolioStatus(raw?.status, raw),
            visibilityMode: portfolioVisibilityMode(raw),
            visibleRoles: uniqueStrings(Array.isArray(raw?.visibleRoles) ? raw.visibleRoles.map((item) => text(item).toLowerCase()) : []),
            visibleFacultyCodes,
            visibleUserIds: uniqueStrings(Array.isArray(raw?.visibleUserIds) ? raw.visibleUserIds : []),
            hiddenUserIds: uniqueStrings(Array.isArray(raw?.hiddenUserIds) ? raw.hiddenUserIds : []),
            createdAt: text(raw?.createdAt || ''),
            updatedAt: text(raw?.updatedAt || raw?.createdAt || ''),
            canEdit: text(ownerUserId) === currentUserId() || ['admin', 'student_service'].includes(text(currentUser()?.role || '').toLowerCase())
        };
        return entry;
    }

    function canViewerAccessPortfolioEntry(entry, viewer = currentUser()) {
        const viewerId = text(viewer?.id || '');
        if (!viewerId || !entry) return false;
        if (entry.canEdit) return true;
        if (entry.hiddenUserIds.includes(viewerId)) return false;
        if (entry.status !== 'published') return false;
        const viewerRole = text(viewer?.role || '').toLowerCase();
        const viewerFaculty = text(viewer?.facultyCode || viewer?.faculty || currentFacultyCode() || '');
        if (entry.visibilityMode === 'all_logged_in') return true;
        if (entry.visibilityMode === 'students_only') return viewerRole === 'student';
        if (entry.visibilityMode === 'tas_only') return viewerRole === 'ta';
        if (entry.visibilityMode === 'professors_only') return viewerRole === 'professor';
        if (entry.visibilityMode === 'staff_only') return ['professor', 'ta', 'admin', 'student_service'].includes(viewerRole);
        if (entry.visibleUserIds.includes(viewerId)) return true;
        if (entry.visibleRoles.includes(viewerRole)) return true;
        if (viewerFaculty && entry.visibleFacultyCodes.includes(viewerFaculty)) return true;
        return false;
    }

    function portfolioEntriesForViewer() {
        const legacyEntries = (Array.isArray(state().social?.projects) ? state().social.projects : [])
            .map((entry) => normalizePortfolioEntry(entry))
            .filter((entry) => canViewerAccessPortfolioEntry(entry));
        const portfolioDocs = Array.isArray(state().social?.portfolios) ? state().social.portfolios : [];
        if (typeof window.KiuPortfolioModel?.mergeDiscoverEntries === 'function') {
            return window.KiuPortfolioModel.mergeDiscoverEntries(legacyEntries, portfolioDocs)
                .filter((entry) => entry.isPortfolioDocument || canViewerAccessPortfolioEntry(entry));
        }
        return legacyEntries;
    }

    function portfolioMatchesRoleFilter(entry, roleFilter) {
        const filter = text(roleFilter || 'all');
        if (!filter || filter === 'all') return true;
        return text(entry.visibilityMode) === filter;
    }

    function portfolioDraftExists() {
        const runtime = state();
        const portfolio = getMyPortfolioDocument();
        if (portfolio && text(portfolio.status) !== 'published') return true;
        return Boolean(
            text(runtime.ui?.projectName || '')
            || text(runtime.ui?.projectSummary || '')
            || text(runtime.ui?.projectDescription || '')
            || text(runtime.ui?.projectCourseTag || '')
            || text(runtime.ui?.projectSkillTags || '')
            || text(runtime.ui?.projectHashtags || '')
            || text(runtime.ui?.projectExternalLinks || '')
            || text(runtime.ui?.projectVisibleUserIds || '')
            || text(runtime.ui?.projectHiddenUserIds || '')
            || (Array.isArray(runtime.ui?.projectVisibleRoles) && runtime.ui.projectVisibleRoles.length)
            || (Array.isArray(runtime.ui?.projectVisibleFacultyCodes) && runtime.ui.projectVisibleFacultyCodes.length)
            || (Array.isArray(runtime.ui?.projectMediaItems) && runtime.ui.projectMediaItems.length)
            || runtime.ui?.projectMediaFile
        );
    }

    function clonePortfolioDocument(doc) {
        try {
            return JSON.parse(JSON.stringify(doc || {}));
        } catch (error) {
            return doc || null;
        }
    }

    function portfolioMakeId(prefix = 'portfolio') {
        return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
    }

    function getMyPortfolioDocument() {
        const userId = currentUserId();
        const runtime = state();
        if (runtime.ui?.myPortfolio && text(runtime.ui.myPortfolio.userId) === userId) {
            return runtime.ui.myPortfolio;
        }
        const fromState = (Array.isArray(runtime.social?.portfolios) ? runtime.social.portfolios : [])
            .find((item) => text(item?.userId) === userId);
        if (fromState) {
            runtime.ui.myPortfolio = clonePortfolioDocument(fromState);
            return runtime.ui.myPortfolio;
        }
        return null;
    }

    function ensureMyPortfolioDocument() {
        const existing = getMyPortfolioDocument();
        if (existing) return existing;
        const user = currentUser();
        const empty = {
            userId: currentUserId(),
            status: 'draft',
            visibilityMode: 'staff_only',
            basics: {
                name: text(user?.displayName || user?.name),
                email: text(user?.email),
                headline: '',
                summary: '',
                links: []
            },
            sectionOrder: ['education', 'experience', 'projects', 'skills'],
            sections: {
                education: { builtinKey: 'education', label: 'Education', repeatable: true, visible: true, fieldDefinitions: [], entries: [] },
                experience: { builtinKey: 'experience', label: 'Experience', repeatable: true, visible: true, fieldDefinitions: [], entries: [] },
                projects: { builtinKey: 'projects', label: 'Projects', repeatable: true, visible: true, fieldDefinitions: [], entries: [] },
                skills: { builtinKey: 'skills', label: 'Skills', repeatable: false, visible: true, fieldDefinitions: [], entries: [{ id: 'skills-default', order: 0, fields: { tags: { type: 'text', value: '' } } }] }
            }
        };
        state().ui.myPortfolio = empty;
        return empty;
    }

    let myPortfolioHydrateInFlight = null;
    let myPortfolioApiDenied = false;

    function clearPortfolioApiDeniedFlag() {
        myPortfolioApiDenied = false;
    }

    async function hydrateMyPortfolioDocument(force = false) {
        if (!force && getMyPortfolioDocument()) return getMyPortfolioDocument();
        if (typeof window.KiuPortfolioApi?.loadMyPortfolio !== 'function') {
            return ensureMyPortfolioDocument();
        }
        if (myPortfolioApiDenied) {
            return ensureMyPortfolioDocument();
        }
        if (myPortfolioHydrateInFlight) {
            return myPortfolioHydrateInFlight;
        }
        myPortfolioHydrateInFlight = (async () => {
            try {
                const portfolio = await window.KiuPortfolioApi.loadMyPortfolio();
                if (portfolio) {
                    state().ui.myPortfolio = clonePortfolioDocument(portfolio);
                    const existing = Array.isArray(state().social?.portfolios) ? state().social.portfolios : [];
                    const next = existing.filter((item) => text(item?.userId) !== text(portfolio.userId));
                    next.unshift(portfolio);
                    state().social.portfolios = next;
                    myPortfolioApiDenied = false;
                } else {
                    ensureMyPortfolioDocument();
                }
            } catch (error) {
                const status = error?.status || error?.statusCode || error?.response?.status;
                const message = String(error?.message || '').toLowerCase();
                if (status === 401 || status === 403 || message.includes('unauthorized') || message.includes('forbidden')) {
                    myPortfolioApiDenied = true;
                }
                ensureMyPortfolioDocument();
            } finally {
                myPortfolioHydrateInFlight = null;
            }
            return getMyPortfolioDocument();
        })();
        return myPortfolioHydrateInFlight;
    }

    function portfolioFieldValue(type, value) {
        const normalizedType = text(type || 'text');
        if (normalizedType === 'dateRange') {
            const source = value && typeof value === 'object' ? value : {};
            return {
                type: normalizedType,
                value: {
                    start: text(source.start),
                    end: text(source.end),
                    current: Boolean(source.current)
                }
            };
        }
        if (normalizedType === 'link') {
            return { type: normalizedType, value: { label: text(value?.label || value?.url), url: text(value?.url || value) } };
        }
        if (normalizedType === 'file') {
            return { type: normalizedType, value: value || null };
        }
        return { type: normalizedType, value: text(value) };
    }

    function portfolioReadDateRange(prefix, formRoot) {
        const start = text(formRoot?.querySelector(`[name="${prefix}Start"]`)?.value || '');
        const end = text(formRoot?.querySelector(`[name="${prefix}End"]`)?.value || '');
        const current = Boolean(formRoot?.querySelector(`[name="${prefix}Current"]`)?.checked);
        return portfolioFieldValue('dateRange', { start, end, current });
    }

    function portfolioCollectDocumentFromUi() {
        const portfolio = clonePortfolioDocument(ensureMyPortfolioDocument());
        const root = portfolioEditorFormRoot();
        portfolio.basics = {
            ...portfolio.basics,
            name: text(root?.querySelector('[name="portfolioBasicsName"]')?.value || portfolio.basics?.name),
            headline: text(root?.querySelector('[name="portfolioBasicsHeadline"]')?.value || portfolio.basics?.headline),
            summary: text(root?.querySelector('[name="portfolioBasicsSummary"]')?.value || portfolio.basics?.summary),
            email: text(root?.querySelector('[name="portfolioBasicsEmail"]')?.value || portfolio.basics?.email),
            links: portfolioFieldValue('link', { url: text(root?.querySelector('[name="portfolioBasicsLink"]')?.value || ''), label: 'Profile' }).value.url
                ? [portfolioFieldValue('link', { url: text(root?.querySelector('[name="portfolioBasicsLink"]')?.value || ''), label: 'Profile' }).value]
                : []
        };

        const collectBuiltin = (sectionKey, mapper) => {
            const section = portfolio.sections?.[sectionKey];
            if (!section) return;
            const cards = root ? Array.from(root.querySelectorAll(`.portfolio-entry-card[data-section-key="${sectionKey}"]`)) : [];
            section.entries = cards.map((card, index) => mapper(card, index)).filter(Boolean);
        };

        collectBuiltin('education', (card, index) => ({
            id: portfolioMakeId('entry'),
            order: index,
            fields: {
                school: portfolioFieldValue('text', card.querySelector('[name="portfolioEducationSchool"]')?.value),
                degree: portfolioFieldValue('text', card.querySelector('[name="portfolioEducationDegree"]')?.value),
                dates: portfolioReadDateRange('portfolioEducationDates', card),
                note: portfolioFieldValue('text', card.querySelector('[name="portfolioEducationNote"]')?.value)
            }
        }));

        collectBuiltin('experience', (card, index) => ({
            id: portfolioMakeId('entry'),
            order: index,
            fields: {
                role: portfolioFieldValue('text', card.querySelector('[name="portfolioExperienceRole"]')?.value),
                organization: portfolioFieldValue('text', card.querySelector('[name="portfolioExperienceOrganization"]')?.value),
                dates: portfolioReadDateRange('portfolioExperienceDates', card),
                description: portfolioFieldValue('text', card.querySelector('[name="portfolioExperienceDescription"]')?.value)
            }
        }));

        collectBuiltin('projects', (card, index) => ({
            id: portfolioMakeId('entry'),
            order: index,
            fields: {
                title: portfolioFieldValue('text', card.querySelector('[name="portfolioProjectTitle"]')?.value),
                description: portfolioFieldValue('text', card.querySelector('[name="portfolioProjectDescription"]')?.value),
                link: portfolioFieldValue('link', { url: card.querySelector('[name="portfolioProjectLink"]')?.value || '' }),
                file: portfolio.sections?.projects?.entries?.[index]?.fields?.file || portfolioFieldValue('file', null)
            }
        }));

        collectBuiltin('skills', (card, index) => ({
            id: 'skills-default',
            order: index,
            fields: {
                tags: portfolioFieldValue('text', card.querySelector('[name="portfolioSkillsTags"]')?.value)
            }
        }));

        Object.keys(portfolio.sections || {}).filter((key) => key.startsWith('custom_')).forEach((sectionKey) => {
            const section = portfolio.sections[sectionKey];
            const cards = root ? Array.from(root.querySelectorAll(`.portfolio-entry-card[data-section-key="${sectionKey}"]`)) : [];
            section.entries = cards.map((card, index) => {
                const fields = {};
                (section.fieldDefinitions || []).forEach((def) => {
                    if (def.type === 'dateRange') {
                        fields[def.key] = portfolioReadDateRange(`portfolioCustom_${sectionKey}_${def.key}`, card);
                        return;
                    }
                    const input = card.querySelector(`[data-field-key="${def.key}"]`);
                    if (def.type === 'link') {
                        fields[def.key] = portfolioFieldValue('link', { url: input?.value || '' });
                        return;
                    }
                    if (def.type === 'file') {
                        fields[def.key] = section.entries?.[index]?.fields?.[def.key] || portfolioFieldValue('file', null);
                        return;
                    }
                    fields[def.key] = portfolioFieldValue('text', input?.value || '');
                });
                return { id: portfolioMakeId('entry'), order: index, fields };
            });
        });

        state().ui.myPortfolio = portfolio;
        return portfolio;
    }

    async function saveMyPortfolioDocument({ flash = true } = {}) {
        const portfolio = portfolioCollectDocumentFromUi();
        if (typeof window.KiuPortfolioApi?.saveMyPortfolio !== 'function') return portfolio;
        state().ui.portfolioSaveStatus = 'Saving...';
        if (!patchPortfolioSaveStatus('Saving...')) renderSocialPageNow('portfolio-save');
        try {
            const saved = await window.KiuPortfolioApi.saveMyPortfolio(portfolio);
            if (saved) {
                state().ui.myPortfolio = clonePortfolioDocument(saved);
                const existing = Array.isArray(state().social?.portfolios) ? state().social.portfolios : [];
                state().social.portfolios = [saved, ...existing.filter((item) => text(item?.userId) !== text(saved.userId))];
            }
            state().ui.portfolioSaveStatus = 'Saved';
            if (!patchPortfolioSaveStatus('Saved')) renderSocialPageNow('portfolio-save');
            if (flash && typeof setPortalSocialFlash === 'function') setPortalSocialFlash('Portfolio saved.', 'success');
            if (typeof hydrateRuntime === 'function') await hydrateRuntime(true);
        } catch (error) {
            state().ui.portfolioSaveStatus = 'Save failed';
            if (!patchPortfolioSaveStatus('Save failed')) renderSocialPageNow('portfolio-save');
            if (typeof setPortalSocialFlash === 'function') setPortalSocialFlash(error?.message || 'Portfolio could not be saved.', 'danger');
        }
        return getMyPortfolioDocument();
    }

    function openPortfolioEditor(entry = null) {
        const runtime = state();
        const normalized = entry ? normalizePortfolioEntry(entry) : null;
        runtime.ui.projectEditId = text(normalized?.id || '');
        runtime.ui.projectName = text(normalized?.title || '');
        runtime.ui.projectSummary = text(normalized?.summary || '');
        runtime.ui.projectDescription = text(normalized?.description || '');
        runtime.ui.projectStatus = text(normalized?.status || 'draft') || 'draft';
        runtime.ui.projectVisibility = text(normalized?.visibilityMode || 'all_logged_in') || 'all_logged_in';
        runtime.ui.projectCourseTag = text(normalized?.courseTag || '');
        runtime.ui.projectFacultyCodes = Array.isArray(normalized?.facultyCodes) && normalized.facultyCodes.length ? [...normalized.facultyCodes] : [currentFacultyCode()];
        runtime.ui.projectSkillTags = (normalized?.skillTags || []).join(', ');
        runtime.ui.projectHashtags = (normalized?.hashtags || []).join(', ');
        runtime.ui.projectExternalLinks = serializePortfolioLinks(normalized?.externalLinks || []);
        runtime.ui.projectVisibleRoles = Array.isArray(normalized?.visibleRoles) ? [...normalized.visibleRoles] : [];
        runtime.ui.projectVisibleFacultyCodes = Array.isArray(normalized?.visibleFacultyCodes) ? [...normalized.visibleFacultyCodes] : [];
        runtime.ui.projectVisibleUserIds = (normalized?.visibleUserIds || []).join(', ');
        runtime.ui.projectHiddenUserIds = (normalized?.hiddenUserIds || []).join(', ');
        runtime.ui.projectMediaItems = Array.isArray(normalized?.mediaItems) ? [...normalized.mediaItems] : [];
        runtime.ui.projectMediaFile = null;
    }

    function resetPortfolioEditor() {
        const runtime = state();
        runtime.ui.projectEditId = '';
        runtime.ui.projectName = '';
        runtime.ui.projectSummary = '';
        runtime.ui.projectDescription = '';
        runtime.ui.projectStatus = 'draft';
        runtime.ui.projectVisibility = 'all_logged_in';
        runtime.ui.projectCourseTag = '';
        runtime.ui.projectFacultyCodes = [currentFacultyCode()];
        runtime.ui.projectSkillTags = '';
        runtime.ui.projectHashtags = '';
        runtime.ui.projectExternalLinks = '';
        runtime.ui.projectVisibleRoles = [];
        runtime.ui.projectVisibleFacultyCodes = [];
        runtime.ui.projectVisibleUserIds = '';
        runtime.ui.projectHiddenUserIds = '';
        runtime.ui.projectMediaItems = [];
        runtime.ui.projectMediaFile = null;
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

    const PROJECT_RISK_SCALE_OPTIONS = [1, 2, 3, 4, 5];
    const PROJECT_RISK_LIKELIHOOD_LABELS = {
        1: 'Rare',
        2: 'Unlikely',
        3: 'Possible',
        4: 'Likely',
        5: 'Almost certain'
    };
    const PROJECT_RISK_IMPACT_LABELS = {
        1: 'Negligible',
        2: 'Minor',
        3: 'Moderate',
        4: 'Major',
        5: 'Severe'
    };
    const PROJECT_RISK_STATUS_OPTIONS = ['open', 'watching', 'mitigated', 'closed'];
    const PROJECT_RISK_RESPONSE_OPTIONS = ['avoid', 'mitigate', 'transfer', 'accept'];

    function renderWorkspaceHero(runtime, projects, metrics = {}) {
        const viewMode = text(metrics.viewMode || 'hub') || 'hub';
        const myProjects = Array.isArray(metrics.myProjects) ? metrics.myProjects : [];
        const totalTasks = Number(metrics.totalTasks || 0);
        const totalActivity = Number(metrics.totalActivity || 0);
        const facultyCount = Number(metrics.facultyCount || 0);
        const activeCount = projects.filter((project) => text(project?.status || '') === 'active').length;
        const subtitles = {
            hub: 'Browse your studios, track delivery pulse, and spin up a new cross-faculty workspace.',
        };
        const stats = [
            { label: 'Workspaces', value: projects.length },
            { label: 'Active', value: activeCount },
            { label: 'Your roles', value: myProjects.length },
            { label: 'Tasks', value: totalTasks },
            { label: 'Faculties', value: facultyCount },
            { label: 'Activity', value: totalActivity },
        ];
        const sectionsHtml = text(metrics.sectionsHtml || '');
        return `
            <section class="social-neo-card social-neo-workspace-hero social-neo-community-panel social-neo-community-panel--workspace">
                <div class="social-neo-workspace-hero-head">
                    <div class="social-neo-workspace-hero-actions">
                        <button class="social-neo-btn social-neo-btn-primary social-neo-workspace-hero-create-btn" type="button" data-action="project-create-open">
                            <i class="fas fa-plus"></i> Create workspace
                        </button>
                    </div>
                </div>
                <div class="social-neo-workspace-hero-stats">
                    ${stats.map((stat) => `
                        <article class="social-neo-workspace-hero-stat social-neo-events-hero-stat lux-strip-card surface-card">
                            <strong>${escape(String(stat.value))}</strong>
                            <span>${escape(stat.label)}</span>
                        </article>
                    `).join('')}
                </div>
                ${sectionsHtml}
            </section>
        `;
    }

    function buildProjectCreateContext(runtime) {
        const social = runtime.social || {};
        const projects = Array.isArray(social.projects) ? social.projects : [];
        const directory = Array.isArray(runtime.directory) ? runtime.directory : [];
        const facultyOptions = uniqueStrings([
            currentFacultyCode(),
            ...projects.flatMap((project) => Array.isArray(project?.facultyCodes) ? project.facultyCodes : []),
            ...directory.map((account) => text(account?.facultyCode || account?.faculty))
        ]).filter(Boolean);
        const projectFaculties = Array.isArray(runtime.ui?.projectFacultyCodes) && runtime.ui.projectFacultyCodes.length
            ? runtime.ui.projectFacultyCodes
            : [currentFacultyCode()];
        const advisorCandidates = directory.filter((account) => isStaffAccount(account) || ['professor', 'ta', 'admin'].includes(text(account?.role || '').toLowerCase()));
        return {
            facultyOptions,
            projectFaculties,
            advisorCandidates,
            projectNameId: controlId('projectName'),
            projectCourseTagId: controlId('projectCourseTag'),
            projectSummaryId: controlId('projectSummary'),
            projectDescriptionId: controlId('projectDescription'),
            projectStatusId: controlId('projectStatus'),
            projectVisibilityId: controlId('projectVisibility'),
            projectAdvisorUserId: controlId('projectAdvisorUserId'),
            projectRecommendedTeamSizeId: controlId('projectRecommendedTeamSize'),
            projectMinTeamSizeId: controlId('projectMinTeamSize'),
            projectSkillTagsId: controlId('projectSkillTags'),
            projectInviteSearchId: controlId('projectInviteSearch'),
            projectInviteFacultyId: controlId('projectInviteFaculty')
        };
    }
    function buildProjectCreateInviteContext(runtime, baseContext) {
        const ctx = baseContext || buildProjectCreateContext(runtime);
        const selectedMemberIds = Array.isArray(runtime.ui?.projectInviteSelectedIds)
            ? runtime.ui.projectInviteSelectedIds.map((item) => text(item)).filter(Boolean)
            : [];
        const memberSearch = text(runtime.ui?.projectInviteSearch || '').trim().toLowerCase();
        const facultyFilter = text(runtime.ui?.projectInviteFaculty || 'all') || 'all';
        const directory = Array.isArray(runtime.directory) ? runtime.directory : [];
        const allAccounts = directory
            .filter((account) => text(account?.id) && text(account.id) !== currentUserId())
            .sort((left, right) => displayName(left).localeCompare(displayName(right)));
        const facultyOptions = ['all', ...ctx.facultyOptions];
        const candidateAccounts = allAccounts.filter((account) => {
            const accountId = text(account?.id);
            if (!accountId || selectedMemberIds.includes(accountId)) return false;
            if (facultyFilter !== 'all' && text(account?.facultyCode || account?.faculty || '') !== facultyFilter) return false;
            if (!memberSearch) return true;
            const haystack = [
                displayName(account),
                account?.email,
                account?.facultyCode,
                account?.faculty,
                roleLabel(account?.role),
                ...(Array.isArray(account?.interests) ? account.interests : [])
            ].filter(Boolean).join(' ').toLowerCase();
            return haystack.includes(memberSearch);
        });
        const selectedMembersMarkup = selectedMemberIds.length
            ? selectedMemberIds.map((memberId) => {
                const account = accountById(memberId) || { id: memberId };
                return `
                    <div class="social-neo-item-line social-neo-group-creator-member is-selected">
                        <div class="social-neo-person">
                            ${avatar(account, 'social-neo-avatar-sm')}
                            <div>
                                <strong>${escape(displayName(account))}</strong>
                                <span>${escape(accountSubtitle(account))}</span>
                            </div>
                        </div>
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-creator-member-remove" data-user-id="${escape(text(memberId))}">
                            <i class="fas fa-xmark"></i> Remove
                        </button>
                    </div>
                `;
            }).join('')
            : '<p class="social-neo-dialog-hint">No teammates selected yet.</p>';
        const searchResultsMarkup = candidateAccounts.length
            ? candidateAccounts.slice(0, 12).map((account) => `
                <article class="social-neo-entity-card social-neo-group-creator-member">
                    <div class="social-neo-person">
                        ${avatar(account, 'social-neo-avatar-sm')}
                        <div>
                            <strong>${escape(displayName(account))}</strong>
                            <span>${escape(accountSubtitle(account))}</span>
                        </div>
                    </div>
                    <button class="social-neo-btn social-neo-btn-primary social-neo-btn-sm" type="button" data-action="project-creator-member-add" data-user-id="${escape(text(account.id))}">
                        <i class="fas fa-user-plus"></i> Add
                    </button>
                </article>
            `).join('')
            : `<p class="social-neo-dialog-hint">${memberSearch || facultyFilter !== 'all' ? 'No people match the current search or faculty filter.' : 'Start typing or choose a faculty to find teammates.'}</p>`;
        return {
            ...ctx,
            selectedMemberIds,
            candidateAccounts,
            facultyOptions,
            facultyFilter,
            memberSearch,
            selectedMembersMarkup,
            searchResultsMarkup
        };
    }
    function renderProjectCreateInviteSection(runtime, inviteContext) {
        const ctx = inviteContext || buildProjectCreateInviteContext(runtime);
        return `
            <section class="social-neo-dialog-project-create-section social-neo-dialog-project-create-section--invite">
                <div class="social-neo-dialog-project-create-section-head">
                    <strong>Seed the team</strong>
                    <span>Optional. Invite collaborators before the workspace opens.</span>
                </div>
                <div class="social-neo-dialog-invite-toolbar">
                    <label class="social-neo-dialog-field social-neo-dialog-invite-search-field" for="${escape(ctx.projectInviteSearchId)}">
                        <span class="social-neo-label">Search people</span>
                        <input class="social-neo-input" id="${escape(ctx.projectInviteSearchId)}" type="search" name="projectInviteSearch" placeholder="Search by name, faculty, role, or interests" value="${escape(text(runtime.ui?.projectInviteSearch || ''))}">
                    </label>
                    <label class="social-neo-dialog-field social-neo-dialog-invite-faculty-field" for="${escape(ctx.projectInviteFacultyId)}">
                        <span class="social-neo-label">Faculty</span>
                        <select class="social-neo-select" id="${escape(ctx.projectInviteFacultyId)}" name="projectInviteFaculty" data-lux-picker>
                            ${ctx.facultyOptions.map((faculty) => `<option value="${escape(faculty)}" ${ctx.facultyFilter === faculty ? 'selected' : ''}>${escape(faculty === 'all' ? 'All faculties' : facultyLabel(faculty))}</option>`).join('')}
                        </select>
                    </label>
                </div>
                <div class="social-neo-dialog-invite-columns">
                    <article class="social-neo-dialog-invite-block">
                        <div class="social-neo-dialog-invite-block-head">
                            <strong>Selected teammates</strong>
                            <span>${escape(ctx.selectedMemberIds.length)} invitation${ctx.selectedMemberIds.length === 1 ? '' : 's'} queued.</span>
                        </div>
                        <div class="social-neo-list social-neo-dialog-invite-list">${ctx.selectedMembersMarkup}</div>
                    </article>
                    <article class="social-neo-dialog-invite-block">
                        <div class="social-neo-dialog-invite-block-head">
                            <strong>Search results</strong>
                            <span>${escape(ctx.candidateAccounts.length)} people available.</span>
                        </div>
                        <div class="social-neo-list social-neo-dialog-invite-list">${ctx.searchResultsMarkup}</div>
                    </article>
                </div>
            </section>
        `;
    }
    function renderProjectSettingsDialog(runtime, dialog) {
        const project = resolveActiveSocialProject(runtime, dialog?.projectId);
        if (!project || !project.isManager) return '';
        const ctx = buildProjectCreateInviteContext(runtime);
        const advisorCandidates = Array.isArray(ctx.advisorCandidates) ? ctx.advisorCandidates : [];
        const externalLinksText = (Array.isArray(project.externalLinks) ? project.externalLinks : [])
            .map((link) => text(link?.url || ''))
            .filter(Boolean)
            .join('\n');
        const statusOptions = ['idea', 'active', 'review', 'completed'];
        const nameId = controlId('project-settings-name');
        const summaryId = controlId('project-settings-summary');
        const descId = controlId('project-settings-desc');
        const statusId = controlId('project-settings-status');
        const visibilityId = controlId('project-settings-visibility');
        const advisorId = controlId('project-settings-advisor');
        const recommendedId = controlId('project-settings-recommended');
        const minId = controlId('project-settings-min');
        const linksId = controlId('project-settings-links');
        const showcaseId = controlId('project-settings-showcase');
        const scheduleStartId = controlId('project-settings-schedule-start');
        const scheduleStartValue = toDateTimeLocalValue(project.scheduleStartAt || '');
        return `<div class="social-neo-dialog-backdrop" data-action="dialog-close">
            <form class="social-neo-dialog-card social-neo-dialog-card--form social-neo-dialog-card--project-task-create social-neo-dialog-card--lms-create social-neo-dialog-card--social-glass" data-form="project-settings" data-project-id="${escape(text(project.id))}" data-action="noop" data-lux-transparency-exempt="1">
                <div class="social-neo-section-head social-neo-dialog-head">
                    <div class="social-neo-dialog-heading">
                        <strong class="social-neo-dialog-title"><i class="fas fa-sliders" aria-hidden="true"></i> Workspace settings</strong>
                        <span class="social-neo-dialog-subtitle">Tune status, visibility, advisor, and team size for this project.</span>
                    </div>
                    <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-close-btn" type="button" data-action="dialog-close"><i class="fas fa-times"></i></button>
                </div>
                <div class="social-neo-dialog-body social-neo-dialog-body--project-task-create">
                    <div class="social-neo-form-grid social-neo-form-grid-2">
                        <label class="social-neo-dialog-field" for="${escape(nameId)}">
                            <span class="social-neo-label">Project name</span>
                            <input class="social-neo-input" id="${escape(nameId)}" type="text" name="projectName" value="${escape(text(project.name || project.title || ''))}" required>
                        </label>
                        <label class="social-neo-dialog-field" for="${escape(statusId)}">
                            <span class="social-neo-label">Status</span>
                            <select class="social-neo-select" id="${escape(statusId)}" name="projectStatus" data-lux-picker>
                                ${statusOptions.map((status) => `<option value="${escape(status)}" ${text(project.status || 'idea') === status ? 'selected' : ''}>${escape(status)}</option>`).join('')}
                            </select>
                        </label>
                    </div>
                    <label class="social-neo-dialog-field" for="${escape(summaryId)}">
                        <span class="social-neo-label">Summary</span>
                        <input class="social-neo-input" id="${escape(summaryId)}" type="text" name="projectSummary" value="${escape(text(project.summary || ''))}">
                    </label>
                    <label class="social-neo-dialog-field" for="${escape(descId)}">
                        <span class="social-neo-label">Description</span>
                        <textarea class="social-neo-textarea" id="${escape(descId)}" rows="3" name="projectDescription">${escape(text(project.description || ''))}</textarea>
                    </label>
                    <div class="social-neo-form-grid social-neo-form-grid-3">
                        <label class="social-neo-dialog-field" for="${escape(visibilityId)}">
                            <span class="social-neo-label">Visibility</span>
                            <select class="social-neo-select" id="${escape(visibilityId)}" name="projectVisibility" data-lux-picker>
                                <option value="all_logged_in" ${text(project.visibilityMode || 'all_logged_in') === 'all_logged_in' ? 'selected' : ''}>Public to logged-in</option>
                                <option value="custom" ${text(project.visibilityMode || '') === 'custom' ? 'selected' : ''}>Team only</option>
                            </select>
                        </label>
                        <label class="social-neo-dialog-field" for="${escape(recommendedId)}">
                            <span class="social-neo-label">Recommended team size</span>
                            <input class="social-neo-input" id="${escape(recommendedId)}" type="number" min="2" max="20" name="projectRecommendedTeamSize" value="${escape(String(project.recommendedTeamSize || 4))}">
                        </label>
                        <label class="social-neo-dialog-field" for="${escape(minId)}">
                            <span class="social-neo-label">Minimum team size</span>
                            <input class="social-neo-input" id="${escape(minId)}" type="number" min="2" max="20" name="projectMinTeamSize" value="${escape(String(project.minTeamSize || 4))}">
                        </label>
                    </div>
                    <label class="social-neo-dialog-field" for="${escape(advisorId)}">
                        <span class="social-neo-label">Advisor</span>
                        <select class="social-neo-select" id="${escape(advisorId)}" name="projectAdvisorUserId" data-lux-picker>
                            <option value="">No advisor assigned</option>
                            ${advisorCandidates.map((account) => `<option value="${escape(text(account.id))}" ${text(project.advisorUserId || '') === text(account.id) ? 'selected' : ''}>${escape(displayName(account))}</option>`).join('')}
                        </select>
                    </label>
                    <label class="social-neo-dialog-field" for="${escape(scheduleStartId)}">
                        <span class="social-neo-label">Project start date</span>
                        <input class="social-neo-input" id="${escape(scheduleStartId)}" type="datetime-local" name="projectScheduleStartAt" value="${escape(scheduleStartValue)}">
                        <span class="social-neo-muted social-neo-copy-mt-8">Used to derive planned finish dates on the task map (8h workday, no weekends).</span>
                    </label>
                    <label class="social-neo-dialog-field" for="${escape(linksId)}">
                        <span class="social-neo-label">External links</span>
                        <textarea class="social-neo-textarea" id="${escape(linksId)}" rows="3" name="projectExternalLinks" placeholder="One URL per line">${escape(externalLinksText)}</textarea>
                    </label>
                    <label class="social-neo-dialog-field" for="${escape(showcaseId)}">
                        <span class="social-neo-label">Showcase summary</span>
                        <textarea class="social-neo-textarea" id="${escape(showcaseId)}" rows="2" name="projectShowcaseSummary" placeholder="Short blurb used when this workspace is showcased.">${escape(text(project.showcaseSummary || ''))}</textarea>
                    </label>
                </div>
                <div class="social-neo-form-actions social-neo-dialog-actions">
                    <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-cancel-btn" type="button" data-action="dialog-close">Cancel</button>
                    <button class="social-neo-btn social-neo-btn-primary social-neo-dialog-submit-btn" type="submit"><i class="fas fa-check"></i> Save settings</button>
                </div>
            </form>
        </div>`;
    }
    function renderProjectCreateDialog(runtime) {
        const ctx = buildProjectCreateInviteContext(runtime);
        const inviteCount = ctx.selectedMemberIds.length;
        const inviteBadge = inviteCount > 0
            ? `<span class="social-neo-dialog-submit-badge">${escape(String(inviteCount))}</span>`
            : '';
        return `<div class="social-neo-dialog-backdrop" data-action="dialog-close">
            <form class="social-neo-dialog-card social-neo-dialog-card--form social-neo-dialog-card--project-create social-neo-dialog-card--lms-create" data-form="create-project" data-action="noop" data-lux-transparency-exempt="1">
                <div class="social-neo-section-head social-neo-dialog-head">
                    <div class="social-neo-dialog-heading">
                        <strong class="social-neo-dialog-title"><i class="fas fa-diagram-project" aria-hidden="true"></i> Create workspace</strong>
                        <span class="social-neo-dialog-subtitle">Create a course group project, invite teammates, then track tasks together.</span>
                    </div>
                    <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-close-btn" type="button" data-action="dialog-close"><i class="fas fa-times"></i></button>
                </div>
                <div class="social-neo-dialog-body social-neo-dialog-body--project-create">
                    <section class="social-neo-dialog-project-create-section">
                        <div class="social-neo-dialog-project-create-section-head">
                            <strong>Basic info</strong>
                            <span>Title, course context, and what the team will deliver.</span>
                        </div>
                        <div class="social-neo-form-grid social-neo-form-grid-2">
                            <label class="social-neo-dialog-field" for="${escape(ctx.projectNameId)}">
                                <span class="social-neo-label">Title</span>
                                <input class="social-neo-input" id="${escape(ctx.projectNameId)}" type="text" name="projectName" placeholder="Smart irrigation prototype" value="${escape(text(runtime.ui?.projectName || ''))}" required>
                            </label>
                            <label class="social-neo-dialog-field" for="${escape(ctx.projectCourseTagId)}">
                                <span class="social-neo-label">Course / module</span>
                                <input class="social-neo-input" id="${escape(ctx.projectCourseTagId)}" type="text" name="projectCourseTag" placeholder="CS401 Capstone" value="${escape(text(runtime.ui?.projectCourseTag || ''))}">
                            </label>
                        </div>
                        <label class="social-neo-dialog-field" for="${escape(ctx.projectSummaryId)}">
                            <span class="social-neo-label">Summary</span>
                            <input class="social-neo-input" id="${escape(ctx.projectSummaryId)}" type="text" name="projectSummary" placeholder="Cross-faculty automation project for greenhouse monitoring" value="${escape(text(runtime.ui?.projectSummary || ''))}">
                        </label>
                        <label class="social-neo-dialog-field" for="${escape(ctx.projectDescriptionId)}">
                            <span class="social-neo-label">Description</span>
                            <textarea class="social-neo-textarea" id="${escape(ctx.projectDescriptionId)}" rows="3" name="projectDescription" placeholder="What is the project, what problem are you solving, and what will the team deliver?">${escape(text(runtime.ui?.projectDescription || ''))}</textarea>
                        </label>
                    </section>
                    <section class="social-neo-dialog-project-create-section">
                        <div class="social-neo-dialog-project-create-section-head">
                            <strong>Settings</strong>
                            <span>Visibility, advisor, team size, and faculties involved.</span>
                        </div>
                        <div class="social-neo-form-grid social-neo-form-grid-3">
                            <label class="social-neo-dialog-field" for="${escape(ctx.projectStatusId)}">
                                <span class="social-neo-label">Status</span>
                                <select class="social-neo-select" id="${escape(ctx.projectStatusId)}" name="projectStatus" data-lux-picker>
                                    ${['idea', 'active', 'review', 'completed'].map((status) => `<option value="${escape(status)}" ${text(runtime.ui?.projectStatus || 'idea') === status ? 'selected' : ''}>${escape(status)}</option>`).join('')}
                                </select>
                            </label>
                            <label class="social-neo-dialog-field" for="${escape(ctx.projectVisibilityId)}">
                                <span class="social-neo-label">Visibility</span>
                                <select class="social-neo-select" id="${escape(ctx.projectVisibilityId)}" name="projectVisibility" data-lux-picker>
                                    ${['private', 'faculty', 'public'].map((visibility) => `<option value="${escape(visibility)}" ${text(runtime.ui?.projectVisibility || 'private') === visibility ? 'selected' : ''}>${escape(visibility)}</option>`).join('')}
                                </select>
                            </label>
                            <label class="social-neo-dialog-field" for="${escape(ctx.projectAdvisorUserId)}">
                                <span class="social-neo-label">Advisor</span>
                                <select class="social-neo-select" id="${escape(ctx.projectAdvisorUserId)}" name="projectAdvisorUserId" data-lux-picker>
                                    <option value="">No advisor yet</option>
                                    ${ctx.advisorCandidates.map((account) => `<option value="${escape(text(account.id))}" ${text(runtime.ui?.projectAdvisorUserId || '') === text(account.id) ? 'selected' : ''}>${escape(displayName(account))}</option>`).join('')}
                                </select>
                            </label>
                        </div>
                        <div class="social-neo-form-grid social-neo-form-grid-2">
                            <label class="social-neo-dialog-field" for="${escape(ctx.projectRecommendedTeamSizeId)}">
                                <span class="social-neo-label">Recommended team size</span>
                                <input class="social-neo-input" id="${escape(ctx.projectRecommendedTeamSizeId)}" type="number" min="2" name="projectRecommendedTeamSize" value="${escape(text(runtime.ui?.projectRecommendedTeamSize || 4))}">
                            </label>
                            <label class="social-neo-dialog-field" for="${escape(ctx.projectMinTeamSizeId)}">
                                <span class="social-neo-label">Minimum team size</span>
                                <input class="social-neo-input" id="${escape(ctx.projectMinTeamSizeId)}" type="number" min="2" name="projectMinTeamSize" value="${escape(text(runtime.ui?.projectMinTeamSize || 4))}">
                            </label>
                        </div>
                        <label class="social-neo-dialog-field" for="${escape(ctx.projectSkillTagsId)}">
                            <span class="social-neo-label">Skills / roles</span>
                            <input class="social-neo-input" id="${escape(ctx.projectSkillTagsId)}" type="text" name="projectSkillTags" placeholder="developer, designer, researcher, analyst" value="${escape(text(runtime.ui?.projectSkillTags || ''))}">
                        </label>
                        <div class="social-neo-dialog-project-create-faculties">
                            <span class="social-neo-label">Faculties involved</span>
                            <div class="social-neo-badge-row social-neo-badge-row-mt-8">
                                ${ctx.facultyOptions.map((facultyCode) => `<button class="social-neo-btn ${ctx.projectFaculties.includes(facultyCode) ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'} social-neo-btn-sm" type="button" data-action="project-faculty-toggle" data-faculty="${escape(facultyCode)}">${escape(facultyCode)}</button>`).join('')}
                            </div>
                        </div>
                    </section>
                    ${renderProjectCreateInviteSection(runtime, ctx)}
                </div>
                <div class="social-neo-form-actions social-neo-dialog-actions">
                    <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-cancel-btn" type="button" data-action="dialog-close">Cancel</button>
                    <button class="social-neo-btn social-neo-btn-primary social-neo-dialog-submit-btn" type="submit"><i class="fas fa-diagram-project"></i> Create workspace${inviteBadge}</button>
                </div>
            </form>
        </div>`;
    }


    function renderPortfolioHero(runtime, metrics = {}) {
        const canCreate = Boolean(metrics.canCreate);
        const allEntries = Array.isArray(metrics.allEntries) ? metrics.allEntries : [];
        const myEntries = Array.isArray(metrics.myEntries) ? metrics.myEntries : [];
        const tagOptions = Array.isArray(metrics.tagOptions) ? metrics.tagOptions : [];
        const facultyOptions = Array.isArray(metrics.facultyOptions) ? metrics.facultyOptions : [];
        const portfolioPanelTabs = Array.isArray(metrics.portfolioPanelTabs) ? metrics.portfolioPanelTabs : [];
        const portfolioPanelTab = text(metrics.portfolioPanelTab || 'discover') || 'discover';
        const discoverFaculty = text(metrics.discoverFaculty || 'all') || 'all';
        const discoverRole = text(metrics.discoverRole || 'all') || 'all';
        const discoverSearch = text(metrics.discoverSearch || '');
        const discoverTag = text(metrics.discoverTag || '').toLowerCase();
        const editing = text(metrics.editing || '');
        const hasDraft = Boolean(metrics.hasDraft);
        const publishedCount = allEntries.filter((entry) => entry.status === 'published').length;
        const stats = [
            { label: 'Published', value: publishedCount },
            { label: 'Your entries', value: myEntries.length },
            { label: 'Discovery tags', value: tagOptions.length },
        ];
        const createCta = canCreate ? `
            <button class="social-neo-btn social-neo-btn-primary social-neo-portfolio-hero-create-btn" type="button" data-action="portfolio-create-open">
                <i class="fas fa-pen"></i> ${hasDraft ? 'Continue my portfolio' : 'Build my portfolio'}
            </button>
            ${hasDraft ? `<span class="social-neo-pill social-portfolio-draft-pill"><strong>Draft saved</strong><span>Ready to publish</span></span>` : ''}
        ` : '';
        const bodyHtml = text(metrics.bodyHtml || '');
        const merged = Boolean(bodyHtml);
        const discoverFilters = portfolioPanelTab === 'discover' ? `
            <div class="social-neo-portfolio-hero-discover">
                <div class="social-portfolio-toolbar-head">
                    <div>
                        <strong>Discover talent across campus</strong>
                        <span>Filter by faculty, audience, and tags without losing the social feel of the feed.</span>
                    </div>
                </div>
                <div class="social-portfolio-search-row">
                    <label class="social-portfolio-search">
                        <i class="fas fa-search"></i>
                        <input class="social-neo-input" type="search" name="projectDiscoverSearch" value="${escape(discoverSearch)}" placeholder="Search projects, skills, hashtags, people, or faculties">
                    </label>
                    <select class="social-neo-select" name="projectDiscoverFaculty" data-lux-picker>
                        ${facultyOptions.map((facultyCode) => `<option value="${escape(facultyCode)}" ${discoverFaculty === facultyCode ? 'selected' : ''}>${escape(facultyCode === 'all' ? 'All faculties' : facultyLabel(facultyCode))}</option>`).join('')}
                    </select>
                    <select class="social-neo-select" name="projectDiscoverRole" data-lux-picker>
                        ${PORTFOLIO_DISCOVER_ROLE_TARGETS.map(([value, label]) => `<option value="${escape(value)}" ${discoverRole === value ? 'selected' : ''}>${escape(label)}</option>`).join('')}
                    </select>
                </div>
                <div class="social-portfolio-tag-row">
                    <button class="social-neo-btn ${!discoverTag ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'} social-neo-btn-sm" type="button" data-action="portfolio-filter-tag" data-tag="">All tags</button>
                    ${tagOptions.map((tag) => `
                        <button class="social-neo-btn ${discoverTag === text(tag).toLowerCase() ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'} social-neo-btn-sm" type="button" data-action="portfolio-filter-tag" data-tag="${escape(text(tag).toLowerCase())}">
                            #${escape(text(tag).replace(/^#/, ''))}
                        </button>
                    `).join('')}
                </div>
            </div>
        ` : '';
        return `
            <section class="social-neo-card social-neo-portfolio-hero social-neo-community-panel social-neo-community-panel--portfolio${merged ? ' is-merged' : ''}">
                <div class="social-neo-portfolio-hero-head">
                    <div class="social-neo-portfolio-hero-actions">
                        ${createCta}
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-portfolio-hero-profile-btn" type="button" data-action="profile-portfolio-open">
                            <i class="fas fa-id-card"></i> Open profile portfolio
                        </button>
                    </div>
                </div>
                <div class="social-neo-portfolio-hero-stats">
                    ${stats.map((stat) => `
                        <article class="social-neo-portfolio-hero-stat social-neo-events-hero-stat lux-strip-card surface-card">
                            <strong>${escape(String(stat.value))}</strong>
                            <span>${escape(stat.label)}</span>
                        </article>
                    `).join('')}
                </div>
                <div class="social-neo-portfolio-hero-tabs-row">
                    <div class="portfolio-panel-tabs social-neo-portfolio-hero-tabs" role="tablist" aria-label="Portfolio views">
                        ${portfolioPanelTabs.map((tab) => `
                            <button class="social-neo-btn portfolio-panel-tab ${portfolioPanelTab === tab.tab ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'}" type="button" role="tab" data-action="portfolio-panel-tab" ${tab.attrs} aria-selected="${portfolioPanelTab === tab.tab ? 'true' : 'false'}" aria-pressed="${portfolioPanelTab === tab.tab ? 'true' : 'false'}">
                                <strong>${escape(tab.label)}</strong>
                                <span>${escape(tab.helper)}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
                ${discoverFilters}
                ${merged ? `
                    <div class="social-neo-portfolio-hero-divider" aria-hidden="true"></div>
                    <div class="social-neo-portfolio-hero-body">${bodyHtml}</div>
                ` : ''}
            </section>
        `;
    }
    function renderPortfolioCreateDialog(runtime) {
        const allEntries = portfolioEntriesForViewer();
        const currentFaculty = currentFacultyCode();
        const facultyOptions = uniqueStrings(['all', currentFaculty, ...allEntries.flatMap((entry) => entry.facultyCodes || [])]).filter(Boolean);
        const draftFaculties = Array.isArray(runtime.ui?.projectFacultyCodes) && runtime.ui.projectFacultyCodes.length
            ? runtime.ui.projectFacultyCodes
            : [currentFaculty];
        const mediaItems = Array.isArray(runtime.ui?.projectMediaItems) ? runtime.ui.projectMediaItems : [];
        const editing = text(runtime.ui?.projectEditId || '');
        const customAudienceOpen = text(runtime.ui?.projectVisibility || 'all_logged_in') === 'custom';
        const roleTargets = [
            ['all_logged_in', 'All logged-in'],
            ['students_only', 'Students'],
            ['tas_only', 'TAs'],
            ['professors_only', 'Professors'],
            ['staff_only', 'Staff'],
            ['custom', 'Custom']
        ];
        const title = editing ? 'Edit portfolio entry' : 'Create portfolio entry';
        const subtitle = editing
            ? 'Adjust the story, visuals, and audience from one polished editor.'
            : 'Present completed work as a polished campus showcase entry.';
        const submitLabel = editing ? 'Save portfolio entry' : 'Publish portfolio card';
        return `<div class="social-neo-dialog-backdrop" data-action="dialog-close">
            <form class="social-neo-dialog-card social-neo-dialog-card--form social-neo-dialog-card--portfolio-create social-neo-dialog-card--lms-create" data-form="${editing ? 'portfolio-settings' : 'create-portfolio'}" ${editing ? `data-project-id="${escape(editing)}"` : ''} data-action="noop" data-lux-transparency-exempt="1">
                <div class="social-neo-section-head social-neo-dialog-head">
                    <div class="social-neo-dialog-heading">
                        <strong class="social-neo-dialog-title"><i class="fas fa-briefcase" aria-hidden="true"></i> ${escape(title)}</strong>
                        <span class="social-neo-dialog-subtitle">${escape(subtitle)}</span>
                    </div>
                    <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-close-btn" type="button" data-action="dialog-close"><i class="fas fa-times"></i></button>
                </div>
                <div class="social-neo-dialog-body social-neo-dialog-body--portfolio-create">
                    <section class="social-neo-dialog-portfolio-create-section">
                        <div class="social-neo-form-grid social-neo-form-grid-2">
                            <label class="social-neo-dialog-field">
                                <span class="social-neo-label">Title</span>
                                <input class="social-neo-input" type="text" name="projectName" value="${escape(text(runtime.ui?.projectName || ''))}" placeholder="Sustainable marketplace app" required>
                            </label>
                            <label class="social-neo-dialog-field">
                                <span class="social-neo-label">Short summary</span>
                                <input class="social-neo-input" type="text" name="projectSummary" value="${escape(text(runtime.ui?.projectSummary || ''))}" placeholder="Two-line hook that makes people stop scrolling">
                            </label>
                        </div>
                        <label class="social-neo-dialog-field">
                            <span class="social-neo-label">Description</span>
                            <textarea class="social-neo-textarea" name="projectDescription" rows="4" placeholder="Explain what you built, why it matters, what stage it is in, and what kind of collaboration or opportunity you want.">${escape(text(runtime.ui?.projectDescription || ''))}</textarea>
                        </label>
                        <div class="social-neo-form-grid social-neo-form-grid-3">
                            <label class="social-neo-dialog-field">
                                <span class="social-neo-label">Hashtags</span>
                                <input class="social-neo-input" type="text" name="projectHashtags" value="${escape(text(runtime.ui?.projectHashtags || ''))}" placeholder="ai, startup, uiux">
                            </label>
                            <label class="social-neo-dialog-field">
                                <span class="social-neo-label">Skill tags</span>
                                <input class="social-neo-input" type="text" name="projectSkillTags" value="${escape(text(runtime.ui?.projectSkillTags || ''))}" placeholder="react, branding, research">
                            </label>
                            <label class="social-neo-dialog-field">
                                <span class="social-neo-label">Context</span>
                                <input class="social-neo-input" type="text" name="projectCourseTag" value="${escape(text(runtime.ui?.projectCourseTag || ''))}" placeholder="Capstone, thesis, startup, freelance">
                            </label>
                        </div>
                        <label class="social-neo-dialog-field">
                            <span class="social-neo-label">External links</span>
                            <textarea class="social-neo-textarea" name="projectExternalLinks" rows="3" placeholder="Prototype | https://...&#10;GitHub | https://...">${escape(text(runtime.ui?.projectExternalLinks || ''))}</textarea>
                        </label>
                        <div class="social-neo-form-grid social-neo-form-grid-3">
                            <label class="social-neo-dialog-field">
                                <span class="social-neo-label">Status</span>
                                <select class="social-neo-select" name="projectStatus" data-lux-picker>
                                    ${['draft', 'published'].map((status) => `<option value="${escape(status)}" ${text(runtime.ui?.projectStatus || 'draft') === status ? 'selected' : ''}>${escape(status)}</option>`).join('')}
                                </select>
                            </label>
                            <label class="social-neo-dialog-field">
                                <span class="social-neo-label">Audience</span>
                                <select class="social-neo-select" name="projectVisibility" data-lux-picker>
                                    ${roleTargets.map(([value, label]) => `<option value="${escape(value)}" ${text(runtime.ui?.projectVisibility || 'all_logged_in') === value ? 'selected' : ''}>${escape(label)}</option>`).join('')}
                                </select>
                            </label>
                            <label class="social-neo-dialog-field">
                                <span class="social-neo-label">Media upload</span>
                                <input class="social-neo-input" type="file" name="projectMediaFile" accept="image/*,.pdf,.ppt,.pptx,.doc,.docx,.zip,.fig,.sketch">
                            </label>
                        </div>
                        <div class="social-neo-dialog-portfolio-create-faculties">
                            <span class="social-neo-label">Faculty tags</span>
                            <div class="social-neo-badge-row social-neo-badge-row-mt-8">
                                ${uniqueStrings([currentFaculty, 'BUS', 'CS', 'LAW', 'MED', 'ARTS', ...facultyOptions.filter((code) => code !== 'all')]).map((facultyCode) => `
                                    <button class="social-neo-btn ${draftFaculties.includes(facultyCode) ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'} social-neo-btn-sm" type="button" data-action="project-faculty-toggle" data-faculty="${escape(facultyCode)}">${escape(facultyCode)}</button>
                                `).join('')}
                            </div>
                        </div>
                        ${customAudienceOpen ? `
                            <div class="social-neo-form-grid social-neo-form-grid-2">
                                <label class="social-neo-dialog-field">
                                    <span class="social-neo-label">Custom roles</span>
                                    <input class="social-neo-input" type="text" name="projectVisibleRolesRaw" value="${escape((runtime.ui?.projectVisibleRoles || []).join(', '))}" placeholder="student, professor, ta">
                                </label>
                                <label class="social-neo-dialog-field">
                                    <span class="social-neo-label">Custom faculties</span>
                                    <input class="social-neo-input" type="text" name="projectVisibleFacultyCodesRaw" value="${escape((runtime.ui?.projectVisibleFacultyCodes || []).join(', '))}" placeholder="BUS, CS, LAW">
                                </label>
                                <label class="social-neo-dialog-field">
                                    <span class="social-neo-label">Allowed user IDs</span>
                                    <input class="social-neo-input" type="text" name="projectVisibleUserIds" value="${escape(text(runtime.ui?.projectVisibleUserIds || ''))}" placeholder="student-001, professor-014">
                                </label>
                                <label class="social-neo-dialog-field">
                                    <span class="social-neo-label">Hidden user IDs</span>
                                    <input class="social-neo-input" type="text" name="projectHiddenUserIds" value="${escape(text(runtime.ui?.projectHiddenUserIds || ''))}" placeholder="Optional direct exclusions">
                                </label>
                            </div>
                        ` : ''}
                        ${mediaItems.length ? `
                            <div class="social-portfolio-media-strip">
                                ${mediaItems.map((item) => {
                                    const url = fileUrl(item);
                                    if (url && isImage(item)) {
                                        return `<img src="${escape(url)}" alt="${escape(text(item.name || 'Portfolio media'))}">`;
                                    }
                                    return `<span class="social-neo-pill">${escape(text(item.name || 'Uploaded media'))}</span>`;
                                }).join('')}
                            </div>
                        ` : ''}
                    </section>
                </div>
                <div class="social-neo-form-actions social-neo-dialog-actions">
                    <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-cancel-btn" type="button" data-action="${editing ? 'portfolio-edit-cancel' : 'dialog-close'}">${editing ? 'Discard edit' : 'Cancel'}</button>
                    <button class="social-neo-btn social-neo-btn-primary social-neo-dialog-submit-btn" type="submit"><i class="fas fa-briefcase"></i> ${escape(submitLabel)}</button>
                </div>
            </form>
        </div>`;
    }
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
                <div class="social-neo-section-head social-neo-dialog-head">
                    <div class="social-neo-dialog-heading">
                        <strong class="social-neo-dialog-title"><i class="fas fa-trash" aria-hidden="true"></i> Remove task</strong>
                        <span class="social-neo-dialog-subtitle">This permanently deletes the task from the project board.</span>
                    </div>
                    <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-close-btn" type="button" data-action="dialog-close"><i class="fas fa-times"></i></button>
                </div>
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
                <div class="social-neo-form-actions social-neo-dialog-actions social-neo-delete-confirm-actions">
                    <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-cancel-btn" type="button" data-action="dialog-close">Cancel</button>
                    <button class="social-neo-btn social-neo-btn-danger social-neo-dialog-submit-btn" type="submit">Remove task</button>
                </div>
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
                <div class="social-neo-section-head social-neo-dialog-head">
                    <div class="social-neo-dialog-heading">
                        <strong class="social-neo-dialog-title"><i class="fas ${isEdit ? 'fa-pen' : 'fa-list-check'}" aria-hidden="true"></i> ${isEdit ? 'Edit task' : 'Create task'}</strong>
                        <span class="social-neo-dialog-subtitle">${isEdit ? 'Update work, assignment, or checklist.' : 'Add work to the board, assign a teammate, and place it in the right column.'}</span>
                    </div>
                    <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-close-btn" type="button" data-action="dialog-close"><i class="fas fa-times"></i></button>
                </div>
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

    window.renderWorkspaceHero = renderWorkspaceHero;
    window.buildProjectCreateContext = buildProjectCreateContext;
    window.buildProjectCreateInviteContext = buildProjectCreateInviteContext;
    window.renderProjectCreateInviteSection = renderProjectCreateInviteSection;
    window.renderProjectCreateDialog = renderProjectCreateDialog;
    window.renderProjectSettingsDialog = renderProjectSettingsDialog;
    window.renderPortfolioHero = renderPortfolioHero;
    window.renderPortfolioCreateDialog = renderPortfolioCreateDialog;
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
                <label class="social-neo-dialog-field" for="${escape(taskTitleId)}">
                    <span class="social-neo-label">Task title</span>
                    <input class="social-neo-input" id="${escape(taskTitleId)}" type="text" name="projectTaskTitle" placeholder="What needs to be done?" value="${escape(titleValue)}" maxlength="120" required>
                </label>
                <label class="social-neo-dialog-field" for="${escape(taskDescId)}">
                    <span class="social-neo-label">Description <span class="social-neo-muted">(optional)</span></span>
                    <textarea class="social-neo-textarea" id="${escape(taskDescId)}" rows="${isEdit ? 3 : 2}" name="projectTaskDescription" placeholder="Context, acceptance criteria, or links..." maxlength="2000">${escape(descValue)}</textarea>
                </label>
                ${isEdit ? '' : `
                <label class="social-neo-dialog-field" for="${escape(taskPackageId)}">
                    <span class="social-neo-label">Package</span>
                    <select class="social-neo-select" id="${escape(taskPackageId)}" name="projectTaskPackageId" data-lux-picker>
                        ${packageOptions}
                    </select>
                </label>
                `}
                <label class="social-neo-dialog-field" for="${escape(taskStatusId)}">
                    <span class="social-neo-label">Column</span>
                    <select class="social-neo-select" id="${escape(taskStatusId)}" name="projectTaskStatus" data-lux-picker>${statusOptions}</select>
                </label>
            </section>
        `;

        const advancedInner = `
            <div class="social-project-task-priority-block">
                    <div class="social-project-task-priority-block-head">Impact × Effort</div>
                    <div class="social-project-task-priority-matrix-fields social-neo-form-grid social-neo-form-grid-2">
                        <label class="social-neo-dialog-field" for="${escape(taskImpactId)}">
                            <span class="social-neo-label">Impact (1–5)</span>
                            <select class="social-neo-select" id="${escape(taskImpactId)}" name="projectTaskImpactScore" data-lux-picker>${scoreOptions(impactScoreValue)}</select>
                        </label>
                        <label class="social-neo-dialog-field" for="${escape(taskEffortId)}">
                            <span class="social-neo-label">Effort (1–5)</span>
                            <select class="social-neo-select" id="${escape(taskEffortId)}" name="projectTaskEffortScore" data-lux-picker>${scoreOptions(effortScoreValue)}</select>
                        </label>
                        <div class="social-project-task-matrix-preview" data-lux-transparency-exempt="1">Score ${escape(String(matrixPreviewScore))} · ${escape(matrixPreviewLabel)}</div>
                    </div>
                </div>
            <section class="social-neo-dialog-project-create-section">
                <div class="social-neo-dialog-project-create-section-head">
                    <strong>Duration (PERT)</strong>
                    <span>Three-point estimate — drives the critical path.</span>
                </div>
                <div class="social-neo-form-grid social-neo-form-grid-3">
                    <label class="social-neo-dialog-field" for="${escape(taskTimeOptimisticId)}">
                        <span class="social-neo-label">Optimistic (O)</span>
                        <input class="social-neo-input" id="${escape(taskTimeOptimisticId)}" type="number" min="0" step="0.5" name="projectTaskTimeOptimistic" placeholder="0" value="${escape(timeOptimisticValue)}">
                    </label>
                    <label class="social-neo-dialog-field" for="${escape(taskTimeMostLikelyId)}">
                        <span class="social-neo-label">Most likely (M)</span>
                        <input class="social-neo-input" id="${escape(taskTimeMostLikelyId)}" type="number" min="0" step="0.5" name="projectTaskTimeMostLikely" placeholder="0" value="${escape(timeMostLikelyValue)}">
                    </label>
                    <label class="social-neo-dialog-field" for="${escape(taskTimePessimisticId)}">
                        <span class="social-neo-label">Pessimistic (P)</span>
                        <input class="social-neo-input" id="${escape(taskTimePessimisticId)}" type="number" min="0" step="0.5" name="projectTaskTimePessimistic" placeholder="0" value="${escape(timePessimisticValue)}">
                    </label>
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
                <div class="social-neo-dialog-project-create-section-head">
                    <strong>Planning</strong>
                    <span>Optional start and due dates.</span>
                </div>
                <div class="social-neo-form-grid social-neo-form-grid-2">
                    <label class="social-neo-dialog-field" for="${escape(taskStartId)}">
                        <span class="social-neo-label">Start date (optional)</span>
                        <input class="social-neo-input" id="${escape(taskStartId)}" type="datetime-local" name="projectTaskStartAt" value="${escape(startValue)}">
                    </label>
                    <label class="social-neo-dialog-field" for="${escape(taskDueId)}">
                        <span class="social-neo-label">Due date</span>
                        <input class="social-neo-input" id="${escape(taskDueId)}" type="datetime-local" name="projectTaskDueAt" value="${escape(dueValue)}">
                    </label>
                </div>
            </section>
            <section class="social-neo-dialog-project-create-section">
                <div class="social-neo-dialog-project-create-section-head">
                    <strong>Budget</strong>
                    <span>Planned task cost.</span>
                </div>
                <label class="social-neo-dialog-field" for="${escape(taskBudgetId)}">
                    <span class="social-neo-label">Planned task cost (${escape(budgetCurrency)})</span>
                    <input class="social-neo-input" id="${escape(taskBudgetId)}" type="number" min="0" step="0.01" name="projectTaskBudgetEstimate" placeholder="0.00" value="${escape(budgetEstimateValue)}">
                </label>
            </section>
            <section class="social-neo-dialog-project-create-section">
                <div class="social-neo-dialog-project-create-section-head">
                    <strong>Actuals</strong>
                    <span>Record after work starts (optional on create).</span>
                </div>
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
                <div class="social-neo-dialog-project-create-section-head">
                    <strong>Ownership</strong>
                    <span>Who delivers this task.</span>
                </div>
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
                <div class="social-neo-dialog-project-create-section-head">
                    <strong>Details</strong>
                    <span>Priority, schedule, ownership, and links.</span>
                </div>
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

    function renderProjectTaskDetailModal(runtime, project, taskId) {
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
            if (isCritical) readinessChip = '<span class="spt-detail-chip spt-detail-chip--crit">Critical</span>';
            else if (readiness.kind === 'waiting') readinessChip = '<span class="spt-detail-chip spt-detail-chip--wait">Waiting</span>';
            else if (readiness.kind === 'ready') readinessChip = '<span class="spt-detail-chip spt-detail-chip--ready">Ready</span>';
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
                    <section class="spt-detail-section">
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
                return `<span class="spt-detail-dep-chip is-package" title="Package dependency">
                    <em data-status="todo">Package</em>
                    <span>${escape(text(task?.title || 'Package'))}</span>
                </span>`;
            }
            const st = normalizeProjectTaskStatusId(task?.status);
            const label = text(task?.title || 'Task');
            return `<button type="button" class="spt-detail-dep-chip" data-action="project-task-detail-open" data-project-id="${escape(text(project.id))}" data-task-id="${escape(tid)}">
                <em data-status="${escape(st)}">${escape(({ todo: 'To do', 'in-progress': 'Active', blocked: 'Blocked', done: 'Done' })[st] || st)}</em>
                <span>${escape(label)}</span>
            </button>`;
        };

        const depsBlock = `
                    <section class="spt-detail-section">
                        <h3 class="spt-detail-section-title">Dependencies</h3>
                        <div class="spt-detail-deps">
                            <div class="spt-detail-deps-col">
                                <span class="spt-detail-k">Blocked by</span>
                                ${parentTasks.length || missingParentIds.length
                                    ? `<div class="spt-detail-dep-list">${parentTasks.map(renderDepChip).join('')}${missingParentIds.map((id) => `<span class="spt-detail-dep-chip is-missing"><em>Missing</em><span>${escape(id)}</span></span>`).join('')}</div>`
                                    : '<span class="spt-detail-muted">No parents — root task</span>'}
                            </div>
                            <div class="spt-detail-deps-col">
                                <span class="spt-detail-k">Blocks</span>
                                ${childTasks.length
                                    ? `<div class="spt-detail-dep-list">${childTasks.map(renderDepChip).join('')}</div>`
                                    : '<span class="spt-detail-muted">No children</span>'}
                            </div>
                        </div>
                    </section>`;

        const backdropClass = projectTaskGraphStackedBackdropClass(runtime, 'project-task-detail');
        const backdropClasses = ['social-neo-dialog-backdrop', backdropClass].filter(Boolean).join(' ');
        return `<div class="${backdropClasses}" data-action="dialog-close" role="dialog" aria-modal="true" aria-label="Task detail">
            <div class="social-neo-dialog-card social-neo-dialog-card--form social-neo-dialog-card--project-task-detail social-neo-dialog-card--lms-create social-neo-dialog-card--social-glass spt-detail-dialog" data-action="noop" data-lux-transparency-exempt="1">
                <div class="social-neo-section-head social-neo-dialog-head spt-detail-head">
                    <div class="social-neo-dialog-heading spt-detail-heading">
                        <strong class="social-neo-dialog-title spt-detail-title">${escape(text(editTask.title || 'Task'))}</strong>
                        <div class="spt-detail-head-chips" aria-label="Status and priority">
                            <span class="spt-detail-chip spt-detail-chip--status" data-status="${escape(statusId)}">${escape(statusLabel)}</span>
                            <span class="spt-detail-chip spt-detail-chip--pri" data-priority="${escape(priorityInfo.bucket || priority)}">${escape(priorityShort)}</span>
                            ${editTask?.isMilestone ? '<span class="spt-detail-chip spt-detail-chip--mile">Milestone</span>' : ''}
                            ${readinessChip}
                        </div>
                        ${headerMeta ? `<span class="social-neo-dialog-subtitle spt-detail-subtitle">${escape(headerMeta)}</span>` : ''}
                    </div>
                    <div class="spt-detail-head-actions">
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-task-graph-open" data-project-id="${escape(text(project.id))}" data-task-id="${escape(text(taskId))}" title="Open on map"><i class="fas fa-diagram-project" aria-hidden="true"></i> Map</button>
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-close-btn" type="button" data-action="dialog-close" aria-label="Close"><i class="fas fa-times"></i></button>
                    </div>
                </div>
                <div class="social-neo-dialog-body social-neo-dialog-body--project-task-detail spt-detail-body">
                    <section class="spt-detail-section">
                        <h3 class="spt-detail-section-title">Description</h3>
                        <div class="social-project-task-detail-description spt-detail-description${description ? '' : ' is-empty'}">${description ? escape(description) : 'No description added yet.'}</div>
                    </section>
                    <section class="spt-detail-section">
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
                    <section class="spt-detail-section">
                        <h3 class="spt-detail-section-title">Plan vs actual</h3>
                        <p class="spt-detail-section-hint">Estimate vs what was recorded. Variance is actual minus plan.</p>
                        <div class="spt-detail-compare-grid">
                            <div class="spt-detail-compare ${timeVariance ? `is-tone-${escape(timeVariance.tone)}` : ''}">
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
                            <div class="spt-detail-compare ${costVariance ? `is-tone-${escape(costVariance.tone)}` : ''}">
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
                <div class="social-neo-form-actions social-neo-dialog-actions spt-detail-actions">
                    ${canEdit ? `<button class="social-neo-btn social-neo-btn-danger social-neo-btn-ghost" type="button" data-action="project-task-delete-open" data-project-id="${escape(text(project.id))}" data-task-id="${escape(text(taskId))}"><i class="fas fa-trash"></i> Remove</button>` : '<span></span>'}
                    <div class="spt-detail-actions-end">
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-cancel-btn" type="button" data-action="dialog-close">Close</button>
                        ${canEdit ? `<button class="social-neo-btn social-neo-btn-primary social-neo-dialog-submit-btn" type="button" data-action="project-task-edit-open" data-project-id="${escape(text(project.id))}" data-task-id="${escape(text(taskId))}"><i class="fas fa-pen"></i> Edit task</button>` : ''}
                    </div>
                </div>
            </div>
        </div>`;
    }


    function projectRiskOptionLabel(value) {
        const raw = text(value || '');
        if (!raw) return '';
        return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    }
    function projectRiskScaleRank(value) {
        const key = text(value ?? '3').toLowerCase();
        if (key === 'low') return 1;
        if (key === 'medium' || key === 'med') return 3;
        if (key === 'high') return 5;
        const n = Math.round(Number(key));
        if (Number.isFinite(n) && n >= 1 && n <= 5) return n;
        return 3;
    }
    function projectRiskScaleOptionLabel(value, kind = 'likelihood') {
        const rank = projectRiskScaleRank(value);
        const labels = kind === 'impact' ? PROJECT_RISK_IMPACT_LABELS : PROJECT_RISK_LIKELIHOOD_LABELS;
        return `${rank} · ${labels[rank] || projectRiskOptionLabel(value)}`;
    }
    function formatProjectRiskScore(score, tier) {
        const n = Number(score) || 0;
        return `${n} / 25 · ${projectRiskOptionLabel(tier)}`;
    }
    function projectRiskExposureScore(likelihood, impact) {
        return projectRiskScaleRank(likelihood) * projectRiskScaleRank(impact);
    }
    function projectRiskExposureTier(likelihood, impact) {
        const score = projectRiskExposureScore(likelihood, impact);
        if (score >= 15) return 'high';
        if (score >= 5) return 'medium';
        return 'low';
    }
    function projectRiskIsActiveStatus(status) {
        const s = text(status || 'open').toLowerCase();
        return s === 'open' || s === 'watching';
    }
    function sortProjectRisksForRegister(risks) {
        const list = Array.isArray(risks) ? risks.slice() : [];
        const statusRank = (status) => {
            const s = text(status || 'open').toLowerCase();
            if (s === 'open') return 0;
            if (s === 'watching') return 1;
            if (s === 'mitigated') return 2;
            return 3;
        };
        return list.sort((left, right) => {
            const statusDelta = statusRank(left?.status) - statusRank(right?.status);
            if (statusDelta) return statusDelta;
            const scoreDelta = projectRiskExposureScore(right?.likelihood, right?.impact)
                - projectRiskExposureScore(left?.likelihood, left?.impact);
            if (scoreDelta) return scoreDelta;
            return text(left?.title || '').localeCompare(text(right?.title || ''));
        });
    }
    function projectRiskRegisterSummary(risks) {
        const list = Array.isArray(risks) ? risks : [];
        let open = 0;
        let high = 0;
        let unassigned = 0;
        list.forEach((risk) => {
            const active = projectRiskIsActiveStatus(risk?.status);
            if (active) open += 1;
            if (active && projectRiskExposureTier(risk?.likelihood, risk?.impact) === 'high') high += 1;
            if (active && !text(risk?.ownerUserId || '')) unassigned += 1;
        });
        return { open, high, unassigned };
    }
    function projectRiskLinkedTaskIdList(risk) {
        return (Array.isArray(risk?.linkedTaskIds) ? risk.linkedTaskIds : [])
            .map((id) => text(id))
            .filter(Boolean);
    }
    function projectRiskLinksTask(risk, taskId) {
        const tid = text(taskId || '');
        if (!tid) return false;
        return projectRiskLinkedTaskIdList(risk).includes(tid);
    }
    function buildProjectRiskCountByTaskId(risks) {
        const map = {};
        (Array.isArray(risks) ? risks : []).forEach((risk) => {
            projectRiskLinkedTaskIdList(risk).forEach((tid) => {
                map[tid] = (map[tid] || 0) + 1;
            });
        });
        return map;
    }
    function renderProjectRiskScaleOptions(name, selectedValue, kind = 'likelihood') {
        const selected = projectRiskScaleRank(selectedValue || 3);
        return PROJECT_RISK_SCALE_OPTIONS.map((option) => {
            const rank = projectRiskScaleRank(option);
            return `<option value="${escape(String(rank))}" ${selected === rank ? 'selected' : ''}>${escape(projectRiskScaleOptionLabel(rank, kind))}</option>`;
        }).join('');
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
        const formExposureTier = projectRiskExposureTier(formLikelihood, formImpact);

        const renderTaskScopeRow = (task, { nested = false } = {}) => {
            const tid = text(task?.id);
            if (!tid) return '';
            const count = riskCountByTaskId[tid] || 0;
            const active = selectedTaskId === tid ? ' is-active' : '';
            const title = text(task?.title || 'Task');
            return `<div class="spr-task-row${nested ? ' is-nested' : ''}${active}">
                <button type="button" class="spr-task-select" data-action="project-risk-select-task" data-project-id="${escape(projectId)}" data-task-id="${escape(tid)}" title="View risks for this task">
                    <i class="fas fa-clipboard-check" aria-hidden="true"></i>
                    <span class="spr-task-label">${escape(title)}</span>
                    <span class="spr-section-count">${count}</span>
                </button>
                ${canEdit ? `<button type="button" class="spr-task-add" data-action="project-risk-task-compose" data-project-id="${escape(projectId)}" data-task-id="${escape(tid)}" title="Add risk for this task" aria-label="Add risk for ${escape(title)}"><i class="fas fa-plus" aria-hidden="true"></i></button>` : ''}
            </div>`;
        };

        const projectWideActive = !selectedTaskId && !selectedGroupId ? ' is-active' : '';
        const projectWideTotal = countForGroup('');
        const projectWideOpen = openCountForGroup('');
        const projectWideButton = `<button type="button" class="spr-section${projectWideActive}" data-action="project-risk-select-group" data-project-id="${escape(projectId)}" data-group-id="" title="${projectWideTotal} total · ${projectWideOpen} open">
                <i class="fas fa-globe" aria-hidden="true"></i>
                <span class="spr-section-label">Project-wide</span>
                <span class="spr-section-count">${projectWideOpen > 0 ? projectWideOpen : projectWideTotal}</span>
            </button>`;

        // Always surface the active task even when its package is collapsed.
        const selectedTaskPin = selectedTaskId ? (() => {
            const count = riskCountByTaskId[selectedTaskId] || 0;
            return `<div class="spr-selected-pin" role="status">
                <span class="spr-selected-pin-label">Selected task</span>
                <button type="button" class="spr-task-select is-active" data-action="project-risk-select-task" data-project-id="${escape(projectId)}" data-task-id="${escape(selectedTaskId)}">
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
                            <button type="button" class="spr-group-toggle" data-action="project-risk-toggle-group" data-project-id="${escape(projectId)}" data-group-id="${escape(gid)}" aria-expanded="${isExpanded ? 'true' : 'false'}" title="${isExpanded ? 'Collapse' : 'Expand'} tasks">
                                <i class="fas fa-chevron-${isExpanded ? 'down' : 'right'}" aria-hidden="true"></i>
                            </button>
                            <button type="button" class="spr-group-select${isActiveGroup ? ' is-active' : ''}" data-action="project-risk-select-group" data-project-id="${escape(projectId)}" data-group-id="${escape(gid)}" title="Group risks ${groupOnly} · with tasks ${underPackage}">
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
            return `<article class="spr-risk-card" data-exposure="${escape(tier)}">
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
                        <button type="button" class="social-neo-btn social-neo-btn-ghost social-neo-btn-xs" data-action="project-risk-edit" data-project-id="${escape(projectId)}" data-risk-id="${escape(text(risk?.id))}" aria-label="Edit risk"><i class="fas fa-pen"></i></button>
                        <button type="button" class="social-neo-btn social-neo-btn-ghost social-neo-btn-xs" data-action="project-risk-delete" data-project-id="${escape(projectId)}" data-risk-id="${escape(text(risk?.id))}" aria-label="Delete risk"><i class="fas fa-trash"></i></button>
                    </div>` : ''}
                </div>
                ${text(risk?.description) ? `<p class="spr-risk-desc">${escape(text(risk.description))}</p>` : ''}
                ${text(risk?.mitigation) ? `<p class="spr-risk-mitigation"><span>Mitigation</span> ${escape(text(risk.mitigation))}</p>` : ''}
                <div class="spr-risk-foot">
                    <span><i class="fas fa-user" aria-hidden="true"></i> ${escape(ownerLabel)}</span>
                </div>
            </article>`;
        };

        const backdropClass = projectTaskGraphStackedBackdropClass(runtime, 'project-risk');
        const backdropClasses = ['social-neo-dialog-backdrop', backdropClass].filter(Boolean).join(' ');
        const composeFields = canEdit && composeOpen ? `
                        <form class="spr-compose social-neo-dialog-group-create-section" data-form="project-risk-save" data-project-id="${escape(projectId)}" data-group-id="${escape(selectedGroupId)}" data-task-id="${escape(selectedTaskId)}" data-risk-id="${escape(text(formRisk?.id || ''))}" data-default-title="${escape(defaultRiskTitle)}" data-existing-title="${escape(text(formRisk?.title || ''))}" data-action="noop" autocomplete="off">
                            <div class="social-neo-dialog-group-create-section-head">
                                <strong>${formRisk ? 'Edit risk' : 'Add risk'}</strong>
                                <span>Scope: ${escape(scopeBreadcrumb)} · ${formRisk ? 'Update this entry' : 'Record a new risk'}</span>
                            </div>
                            <label class="social-neo-dialog-field" for="${escape(descId)}">
                                <span class="social-neo-label">Description</span>
                                <textarea class="social-neo-textarea" id="${escape(descId)}" rows="3" name="projectRiskDescription" placeholder="What could happen and why it matters?" required autocomplete="off">${escape(text(formRisk?.description || ''))}</textarea>
                            </label>
                            <div class="social-neo-form-grid social-neo-form-grid-2">
                                <label class="social-neo-dialog-field" for="${escape(likelihoodId)}">
                                    <span class="social-neo-label">Likelihood</span>
                                    <select class="social-neo-select" id="${escape(likelihoodId)}" name="projectRiskLikelihood" data-lux-picker>${renderProjectRiskScaleOptions('projectRiskLikelihood', formLikelihood, 'likelihood')}</select>
                                </label>
                                <label class="social-neo-dialog-field" for="${escape(impactId)}">
                                    <span class="social-neo-label">Impact</span>
                                    <select class="social-neo-select" id="${escape(impactId)}" name="projectRiskImpact" data-lux-picker>${renderProjectRiskScaleOptions('projectRiskImpact', formImpact, 'impact')}</select>
                                </label>
                            </div>
                            <p class="spr-exposure-hint">Score = Likelihood × Impact (1–5 each, max 25). High ≥ 15 · Medium ≥ 5.</p>
                            <p class="spr-exposure-live" aria-live="polite">Risk score: <strong>${escape(formatProjectRiskScore(formExposureScore, formExposureTier))}</strong></p>
                            <div class="social-neo-form-grid social-neo-form-grid-2">
                                <label class="social-neo-dialog-field" for="${escape(statusId)}">
                                    <span class="social-neo-label">Status</span>
                                    <select class="social-neo-select" id="${escape(statusId)}" name="projectRiskStatus" data-lux-picker>
                                        ${PROJECT_RISK_STATUS_OPTIONS.map((option) => `<option value="${escape(option)}" ${text(formRisk?.status || 'open') === option ? 'selected' : ''}>${escape(projectRiskOptionLabel(option))}</option>`).join('')}
                                    </select>
                                </label>
                                <label class="social-neo-dialog-field" for="${escape(responseId)}">
                                    <span class="social-neo-label">Response</span>
                                    <select class="social-neo-select" id="${escape(responseId)}" name="projectRiskResponse" data-lux-picker>
                                        ${PROJECT_RISK_RESPONSE_OPTIONS.map((option) => `<option value="${escape(option)}" ${text(formRisk?.response || 'mitigate') === option ? 'selected' : ''}>${escape(projectRiskOptionLabel(option))}</option>`).join('')}
                                    </select>
                                </label>
                            </div>
                            <label class="social-neo-dialog-field" for="${escape(ownerId)}">
                                <span class="social-neo-label">Owner</span>
                                <select class="social-neo-select" id="${escape(ownerId)}" name="projectRiskOwnerUserId" data-lux-picker>
                                    <option value="">Unassigned</option>
                                    ${memberSummaries.map((entry) => {
                                        const userId = text(entry?.userId || '');
                                        const account = accountById(userId) || { id: userId };
                                        return `<option value="${escape(userId)}" ${text(formRisk?.ownerUserId || '') === userId ? 'selected' : ''}>${escape(displayName(account))}</option>`;
                                    }).join('')}
                                </select>
                            </label>
                            <label class="social-neo-dialog-field" for="${escape(mitigationId)}">
                                <span class="social-neo-label">Mitigation</span>
                                <textarea class="social-neo-textarea" id="${escape(mitigationId)}" rows="2" name="projectRiskMitigation" placeholder="Planned response or controls" autocomplete="off">${escape(text(formRisk?.mitigation || ''))}</textarea>
                            </label>
                            <div class="social-neo-form-actions social-neo-dialog-actions spr-compose-actions">
                                <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="project-risk-compose-cancel" data-project-id="${escape(projectId)}">Cancel</button>
                                <button class="social-neo-btn social-neo-btn-primary" type="submit"><i class="fas fa-check"></i> ${formRisk ? 'Save risk' : 'Add risk'}</button>
                            </div>
                        </form>` : '';

        const listEmpty = filteredRisks.length
            ? filteredRisks.map(riskRow).join('')
            : `<div class="spr-empty">No risks in ${escape(sectionLabel)}.${canEdit ? ' Add one if needed.' : ''}</div>`;

        const footerActions = composeOpen
            ? ''
            : (canEdit
                ? `<div class="social-neo-form-actions social-neo-dialog-actions">
                    <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-cancel-btn" type="button" data-action="dialog-close">Close</button>
                    <button class="social-neo-btn social-neo-btn-primary" type="button" data-action="project-risk-compose-open" data-project-id="${escape(projectId)}"><i class="fas fa-plus"></i> Add risk</button>
                </div>`
                : `<div class="social-neo-form-actions social-neo-dialog-actions">
                    <button class="social-neo-btn social-neo-btn-primary social-neo-dialog-submit-btn" type="button" data-action="dialog-close"><i class="fas fa-check"></i> Close</button>
                </div>`);

        return `<div class="${backdropClasses}" data-action="dialog-close" role="dialog" aria-modal="true" aria-label="Risk register">
            <div class="social-neo-dialog-card social-neo-dialog-card--form social-neo-dialog-card--project-risk social-neo-dialog-card--lms-create social-neo-dialog-card--social-glass" data-action="noop" data-lux-transparency-exempt="1">
                <div class="social-neo-section-head social-neo-dialog-head">
                    <div class="social-neo-dialog-heading">
                        <strong class="social-neo-dialog-title"><i class="fas fa-triangle-exclamation" aria-hidden="true"></i> Risk register</strong>
                        <span class="social-neo-dialog-subtitle">${escape(text(project.name || project.title || 'Project'))} · Scope: ${escape(scopeBreadcrumb)}</span>
                        <div class="spr-summary" aria-label="Risk summary">
                            <span class="spr-summary-chip">${summary.open} open</span>
                            <span class="spr-summary-chip${summary.high ? ' is-hot' : ''}">${summary.high} high exposure</span>
                            <span class="spr-summary-chip">${summary.unassigned} unassigned</span>
                        </div>
                    </div>
                    <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-close-btn" type="button" data-action="dialog-close"><i class="fas fa-times"></i></button>
                </div>
                <div class="social-neo-dialog-body social-neo-dialog-body--project-risk">
                    <div class="spr-layout">
                        <aside class="spr-rail" aria-label="Risk scope">
                            <div class="spr-rail-head">
                                <strong>Scope</strong>
                                <span>Project, work packages, and tasks</span>
                            </div>
                            ${selectedTaskPin}
                            ${projectWideButton}
                            ${workPackagesRail}
                            ${tasksRail}
                        </aside>
                        <div class="spr-main">
                            <div class="spr-main-head">
                                <div>
                                    <h3>${escape(sectionLabel)}</h3>
                                    <p>${filteredRisks.length ? `${filteredRisks.length} risk${filteredRisks.length === 1 ? '' : 's'} in this scope` : 'No risks in this scope'}</p>
                                </div>
                                ${canEdit && !composeOpen ? `<button type="button" class="social-neo-btn social-neo-btn-primary social-neo-btn-sm" data-action="project-risk-compose-open" data-project-id="${escape(projectId)}"><i class="fas fa-plus"></i> Add risk</button>` : ''}
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
            </div>
        </div>`;
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
        return `<section class="sph-card sph-card--plan" aria-label="Manual plan">
            <div class="sph-card-head">
                <h3>My plan</h3>
                <span class="sph-auto">yours</span>
                <span class="sph-plan-count">${planIds.length}</span>
            </div>
            <p class="sph-coach-lead">Choose days, weeks, months, or all — each is its own list. Add tasks carefully in the picker. Stored on this device per project.</p>
            <div class="sph-plan-tabs" role="tablist" aria-label="Plan horizon">
                ${PROJECT_PLAN_HORIZONS.map((h) => `
                    <button type="button" class="sph-plan-tab${planWindow === h.id ? ' is-active' : ''}" data-action="project-health-plan-window" data-window="${escape(h.id)}" aria-selected="${planWindow === h.id ? 'true' : 'false'}">${escape(h.label)}</button>
                `).join('')}
            </div>
            <div class="sph-plan-add">
                <button type="button" class="social-neo-btn social-neo-btn-primary social-neo-btn-sm" data-action="project-health-plan-pick-open" data-project-id="${escape(projectId)}" data-window="${escape(planWindow)}"><i class="fas fa-plus"></i> Add tasks…</button>
                <span class="sph-plan-add-hint">Adding to <b>${escape(planHorizonLabel)}</b></span>
            </div>
            ${listHtml}
        </section>`;
    }
    function buildProjectHealthPlanPickModel(runtime, dialog) {
        const projectId = text(dialog?.projectId || runtime.ui?.activeProjectId || '');
        const project = resolveActiveSocialProject(runtime, projectId);
        if (!project) return null;
        const horizon = normalizeProjectPlanHorizon(dialog?.horizon || runtime.ui?.projectHealthPlanWindow || 'weeks');
        const horizonLabel = projectPlanHorizonLabel(horizon);
        const tasks = Array.isArray(project.tasks) ? project.tasks : [];
        const groups = getProjectTaskGraphGroups(runtime, projectId);
        const plannedSet = new Set(readProjectWeekPlan(projectId, horizon));
        const selectedSet = new Set(
            (Array.isArray(runtime.ui?.projectHealthPlanPickSelectedIds) ? runtime.ui.projectHealthPlanPickSelectedIds : [])
                .map((id) => text(id))
                .filter(Boolean)
        );
        const search = text(runtime.ui?.projectHealthPlanPickSearch || '').toLowerCase();
        const openOnly = runtime.ui?.projectHealthPlanPickStatus !== 'all';
        const hidePlanned = runtime.ui?.projectHealthPlanPickHidePlanned !== false;
        const browseRaw = text(runtime.ui?.projectHealthPlanPickBrowseId || 'all') || 'all';
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

        // Package counts from eligible set
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

        // Valid browse id
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
            searchRaw: text(runtime.ui?.projectHealthPlanPickSearch || ''),
            openOnly,
            hidePlanned
        };
    }
    function renderProjectHealthPlanPickRailHtml(model) {
        if (!model) return '';
        const { packageRail, browseId } = model;
        return packageRail.map((pkg) => {
            const isAll = pkg.id === 'all';
            const active = browseId === pkg.id;
            const addPkg = !isAll && pkg.count > 0
                ? `<button type="button" class="sph-pick-add-pkg" data-action="project-health-plan-pick-add-package" data-package-id="${escape(pkg.id)}" title="Select all tasks in this package"><i class="fas fa-plus" aria-hidden="true"></i> Add package</button>`
                : '';
            return `<div class="sph-pick-pkg${active ? ' is-active' : ''}" data-package-id="${escape(pkg.id)}">
                <button type="button" class="sph-pick-pkg-main" data-action="project-health-plan-pick-browse" data-package-id="${escape(pkg.id)}" aria-pressed="${active ? 'true' : 'false'}">
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
            return `<button type="button" class="sph-pick-row${checked ? ' is-selected' : ''}" data-action="project-health-plan-pick-toggle" data-task-id="${escape(tid)}" aria-pressed="${checked ? 'true' : 'false'}">
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
            <button type="button" class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" data-action="project-health-plan-pick-toggle-all" data-mode="${allVisibleSelected ? 'clear' : 'all'}" ${visibleIds.length ? '' : 'disabled'}>
                ${allVisibleSelected ? 'Clear visible' : 'Select all visible'}
            </button>`;
    }
    function renderProjectHealthPlanPickBodyHtml(model) {
        if (!model) return '';
        return `<div class="sph-pick-split" data-lux-transparency-exempt="1">
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

    /** Patch picker body only — keep search/focus mounted. */    function renderProjectHealthPlanPickDialog(runtime, dialog) {
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

        return `<div class="social-neo-dialog-backdrop social-neo-dialog-backdrop--stacked-child" data-action="dialog-close" role="dialog" aria-modal="true" aria-label="Add tasks to plan">
            <div class="social-neo-dialog-card social-neo-dialog-card--form social-neo-dialog-card--health-plan-pick social-neo-dialog-card--lms-create social-neo-dialog-card--social-glass" data-action="noop" data-lux-transparency-exempt="1" data-project-id="${escape(projectId)}" data-horizon="${escape(horizon)}">
                <div class="social-neo-section-head social-neo-dialog-head">
                    <div class="social-neo-dialog-heading">
                        <strong class="social-neo-dialog-title"><i class="fas fa-list-check" aria-hidden="true"></i> Add to plan · ${escape(horizonLabel)}</strong>
                        <span class="social-neo-dialog-subtitle">Pick a package or specific tasks, then add them to your plan.</span>
                    </div>
                    <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-close-btn" type="button" data-action="dialog-close" aria-label="Close"><i class="fas fa-times"></i></button>
                </div>
                <div class="social-neo-dialog-body social-neo-dialog-body--health-plan-pick">
                    <div class="sph-pick-filters" data-lux-transparency-exempt="1">
                        <input class="social-neo-input social-neo-input-sm sph-pick-search" type="search" name="projectHealthPlanPickSearch" value="${escape(searchRaw)}" placeholder="Search tasks…" data-action="project-health-plan-pick-filter" data-filter="search" autocomplete="off">
                        <label class="sph-pick-checklab"><input type="checkbox" data-action="project-health-plan-pick-filter" data-filter="openOnly" ${openOnly ? 'checked' : ''}> Open only</label>
                        <label class="sph-pick-checklab"><input type="checkbox" data-action="project-health-plan-pick-filter" data-filter="hidePlanned" ${hidePlanned ? 'checked' : ''}> Hide already planned</label>
                    </div>
                    <div class="sph-pick-body">${renderProjectHealthPlanPickBodyHtml(model)}</div>
                </div>
                <div class="social-neo-form-actions social-neo-dialog-actions">
                    <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="dialog-close">Cancel</button>
                    <button class="social-neo-btn social-neo-btn-primary" type="button" data-action="project-health-plan-pick-apply" data-project-id="${escape(projectId)}" data-window="${escape(horizon)}" ${selectedCount ? '' : 'disabled'}>
                        <i class="fas fa-plus"></i> Add ${selectedCount || 0} to ${escape(horizonLabel)} plan
                    </button>
                </div>
            </div>
        </div>`;
    }

    /** PMI-style 1–5 likelihood/impact (stored as 1–5; legacy low/medium/high → 1/3/5). */

    function renderProjectHealthDialog(runtime, dialog) {
        const project = resolveActiveSocialProject(runtime, dialog?.projectId);
        if (!project) return '';
        const projectId = text(project.id);
        const tasks = Array.isArray(project.tasks) ? project.tasks : [];
        const groups = getProjectTaskGraphGroups(runtime, projectId);
        const risks = Array.isArray(project.risks) ? project.risks : [];
        const currency = text(project?.budgetCurrency || '') || 'USD';
        const money = (n) => formatProjectTaskBudgetEstimate(n, currency) || `0 ${currency}`;
        const taskById = new Map(tasks.map((t) => [text(t?.id), t]));
        const isDone = (t) => text(t?.status) === 'done';
        const openTasks = tasks.filter((t) => !isDone(t));

        // ---- Progress ----
        const statusCounts = { todo: 0, 'in-progress': 0, blocked: 0, done: 0 };
        tasks.forEach((t) => {
            const raw = text(t?.status || 'todo');
            const key = raw === 'backlog' ? 'todo' : raw;
            if (statusCounts[key] == null) statusCounts.todo += 1; else statusCounts[key] += 1;
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
        const now = Date.now();
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
        const sched = computeProjectSchedule(project);
        const criticalIds = sched.criticalChain || [];
        const shortestFinish = formatProjectScheduleHours(sched.projectEndHours);
        const plannedFinishLabel = scheduleStartAt
            ? formatProjectScheduleDate(scheduleStartAt, sched.projectEndHours)
            : '';
        const dueDates = tasks.map((t) => Date.parse(text(t?.dueAt || ''))).filter((d) => Number.isFinite(d));
        const lastDueDate = dueDates.length ? new Date(Math.max(...dueDates)) : null;
        const noEstOpen = openTasks.filter((t) => !t?.isMilestone && taskDurationHours(t) <= 0).length;
        const overEstimateCount = tasks.filter((t) => {
            const act = normalizeTaskTime(t?.actualTime);
            const est = normalizeTaskTime(t?.timeEstimate);
            return act > 0 && est > 0 && act > est;
        }).length;
        const remainingHours = Math.round(sumProjectOpenWorkHours(project) * 10) / 10;
        const loggedHours = Math.round(sumProjectActualHours(project) * 10) / 10;

        // ---- Ownership / readiness ----
        const unassigned = openTasks.filter((t) => !text(t?.assigneeUserId));
        let readyN = 0;
        let waitingN = 0;
        openTasks.forEach((t) => {
            const r = resolveDeskTaskReadiness(t, taskById, groups);
            if (r.kind === 'ready') readyN += 1;
            else if (r.kind === 'waiting') waitingN += 1;
        });

        // ---- Risks ----
        const riskSummary = projectRiskRegisterSummary(risks);
        const topRisks = sortProjectRisksForRegister(risks)
            .filter((r) => projectRiskIsActiveStatus(r?.status))
            .slice(0, 3);

        // ---- Dependencies ----
        const linkCount = tasks.reduce((s, t) => s + projectTaskDependsOnIds(t).filter((d) => taskById.has(d) || isProjectTaskGraphGroupId(d)).length, 0);
        const hasCycle = (() => {
            const color = new Map();
            const visit = (id) => {
                color.set(id, 1);
                const t = taskById.get(id);
                const deps = t ? projectTaskDependsOnIds(t).filter((d) => taskById.has(d)) : [];
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
        tasks.forEach((t) => {
            const c = projectTaskDownstreamIds(text(t?.id), tasks).length;
            if (c > bottleneckCount) {
                bottleneckCount = c;
                bottleneck = t;
            }
        });

        // ---- Team load: open-task estimates, overlay API hours when higher ----
        const loadByUser = new Map();
        openTasks.forEach((t) => {
            const key = text(t?.assigneeUserId || '') || '__unassigned__';
            const cur = loadByUser.get(key) || { count: 0, hours: 0 };
            cur.count += 1;
            cur.hours += taskDurationHours(t);
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
        const loadList = [...loadByUser.entries()].map(([key, v]) => ({ key, ...v })).sort((a, b) => b.hours - a.hours || b.count - a.count);
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
        const budgetTail = capValue > 0
            ? (overCap
                ? `<b class="sph-bad">${escape(money(planned - capValue))} over</b> your ${escape(money(capValue))} cap.`
                : `${escape(money(Math.max(0, capValue - planned)))} under your ${escape(money(capValue))} cap.`)
            : 'No budget cap set yet.';

        // ---- Data readiness (open tasks: owner · estimate · due · budget) ----
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
            if (t?.isMilestone || taskDurationHours(t) > 0) readyEst += 1;
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

        // ---- Why this score (student-facing rules) ----
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

        // ---- What to do this week (coach actions) ----
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

        // Fix-these-tasks samples (titles)
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

        const taskTitle = (id) => text(taskById.get(id)?.title || 'Task');
        const statusRow = (key, label) => `<div class="sph-statrow"><span class="sph-sw" style="background:${PROJECT_TASK_STATUS_EDGE_COLOR[key]}"></span><span class="sph-t">${escape(label)}</span><span class="sph-n">${statusCounts[key]}</span></div>`;
        const hygieneChip = (focus, icon, label, count, tone = '') => (
            count > 0
                ? `<button type="button" class="sph-hygiene-chip${tone ? ` is-${tone}` : ''}" data-action="project-task-focus" data-focus="${escape(focus)}" title="Open desk filter: ${escape(label)}"><i class="fas ${escape(icon)}" aria-hidden="true"></i><strong>${count}</strong> ${escape(label)}</button>`
                : `<span class="sph-hygiene-chip is-ok"><i class="fas ${escape(icon)}" aria-hidden="true"></i><strong>0</strong> ${escape(label)}</span>`
        );
        const weekActionBtn = (item) => {
            const attrs = item.taskId
                ? `data-action="${escape(item.action)}" data-project-id="${escape(projectId)}" data-task-id="${escape(item.taskId)}"`
                : item.focus
                    ? `data-action="${escape(item.action)}" data-focus="${escape(item.focus)}"`
                    : `data-action="${escape(item.action)}" data-project-id="${escape(projectId)}"`;
            return `<button type="button" class="sph-week-item" ${attrs}>
                <span class="sph-week-ic"><i class="fas ${escape(item.icon)}" aria-hidden="true"></i></span>
                <span class="sph-week-copy"><strong>${escape(item.title)}</strong><em>${escape(item.detail)}</em></span>
                <i class="fas fa-chevron-right sph-week-go" aria-hidden="true"></i>
            </button>`;
        };

        const backdropClass = projectTaskGraphStackedBackdropClass(runtime, 'project-health');
        const backdropClasses = ['social-neo-dialog-backdrop', backdropClass].filter(Boolean).join(' ');

        return `<div class="${backdropClasses} social-neo-dialog-backdrop--project-health-fs" data-action="dialog-close" role="dialog" aria-modal="true" aria-label="Project health">
            <div class="social-neo-dialog-card social-neo-dialog-card--form social-neo-dialog-card--project-health social-neo-dialog-card--project-health-fs social-neo-dialog-card--lms-create social-neo-dialog-card--social-glass" data-action="noop" data-lux-transparency-exempt="1">
                <div class="social-neo-section-head social-neo-dialog-head sph-fs-topbar">
                    <div class="social-neo-dialog-heading">
                        <strong class="social-neo-dialog-title"><i class="fas fa-heart-pulse" aria-hidden="true"></i> Project health</strong>
                        <span class="social-neo-dialog-subtitle">${escape(text(project.name || project.title || 'Project'))} · live from tasks, schedule, budget &amp; risks.</span>
                    </div>
                    <div class="sph-fs-topbar-actions">
                        <span class="sph-health-badge" data-health="${escape(healthLevel)}">${escape(healthLabel)}</span>
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-task-graph-open" data-project-id="${escape(projectId)}"><i class="fas fa-diagram-project"></i> Map</button>
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-close-btn" type="button" data-action="dialog-close" aria-label="Close"><i class="fas fa-times"></i></button>
                    </div>
                </div>
                <div class="social-neo-dialog-body social-neo-dialog-body--project-health">
                    <section class="social-neo-dialog-group-create-section sph-fs-hero-section">
                        <div class="sph-verdict sph-verdict--rich sph-verdict--fs" data-health="${escape(healthLevel)}" data-over="${overCap ? '1' : '0'}">
                            <div class="sph-verdict-lede">
                                <span class="sph-k">The one-line read</span>
                                <p><b>${escape(topIssue)}</b>${issues.length > 1 ? ` · also: ${escape(issues.slice(1, 3).join(', '))}` : ''}. Planned work <b>${escape(money(planned))}</b> across <b>${totalTasks}</b> tasks — ${budgetTail}</p>
                            </div>
                            <div class="sph-verdict-stat" title="Soonest the project can finish if nothing slips (critical path method)"><span class="sph-vlabel">Soonest finish</span><span class="sph-vval">${escape(shortestFinish)}</span><span class="sph-vsub">if nothing slips</span></div>
                            <div class="sph-verdict-stat"><span class="sph-vlabel">Done</span><span class="sph-vval">${donePct}%</span><span class="sph-vsub">${statusCounts.done}/${totalTasks || 0} tasks</span></div>
                            <div class="sph-verdict-stat"><span class="sph-vlabel">Open risks</span><span class="sph-vval ${riskSummary.high ? 'sph-bad' : ''}">${riskSummary.open}</span><span class="sph-vsub">${riskSummary.high ? `${riskSummary.high} high` : 'active register'}</span></div>
                            <div class="sph-verdict-stat" title="Tasks with zero float — delay here delays the whole project"><span class="sph-vlabel">Critical tasks</span><span class="sph-vval">${criticalIds.length}</span><span class="sph-vsub">zero float</span></div>
                        </div>
                        <div class="sph-why" aria-label="Why this score">
                            <span class="sph-k">Why this score</span>
                            <ul>${whyBits.map((b) => `<li>${escape(b)}</li>`).join('')}</ul>
                        </div>
                        <div class="sph-hygiene" aria-label="Ownership and readiness">
                            ${hygieneChip('unassigned', 'fa-user-slash', 'unassigned', unassigned.length, unassigned.length ? 'warn' : '')}
                            ${hygieneChip('ready', 'fa-bolt', 'ready now', readyN)}
                            ${hygieneChip('blocked', 'fa-ban', 'waiting on deps', waitingN, waitingN ? 'warn' : '')}
                            ${hygieneChip('blocked', 'fa-hand', 'status blocked', blocked.length, blocked.length ? 'danger' : '')}
                            ${hygieneChip('overdue', 'fa-clock', 'overdue', overdue.length, overdue.length ? 'danger' : '')}
                            ${hygieneChip('critical', 'fa-route', 'on critical path', criticalIds.length, criticalIds.length ? 'crit' : '')}
                        </div>
                        <div class="sph-coach-grid">
                            <section class="sph-card sph-card--readiness">
                                <div class="sph-card-head">
                                    <h3>Data readiness</h3>
                                    <span class="sph-auto">auto</span>
                                    <span class="sph-readiness-pct ${dataReadiness < 70 ? 'is-low' : (dataReadiness < 90 ? 'is-mid' : 'is-high')}" title="Share of open tasks that have owner, time estimate, due date, and budget line">${dataReadiness}%</span>
                                </div>
                                <p class="sph-coach-lead">How complete is your plan data? Incomplete cards make schedule and budget look healthier than they are.</p>
                                <div class="sph-readiness-bar" aria-hidden="true"><i style="width:${dataReadiness}%"></i></div>
                                <div class="sph-readiness-checks">
                                    ${dataChecks.map((c) => {
                                        const pct = c.total ? Math.round((c.ok / c.total) * 100) : 100;
                                        return `<div class="sph-readiness-row" data-ok="${c.fix ? '0' : '1'}">
                                            <span>${escape(c.label)}</span>
                                            <strong>${c.ok}/${c.total || 0}</strong>
                                            <em>${pct}%</em>
                                        </div>`;
                                    }).join('')}
                                </div>
                                ${fixSamples.length ? `
                                    <div class="sph-mini-label">Fix these tasks first</div>
                                    <div class="sph-fix-list">${fixSamples.map((f) => `
                                        <button type="button" class="sph-fix-task" data-action="project-task-edit-open" data-project-id="${escape(projectId)}" data-task-id="${escape(f.id)}" title="Edit task">
                                            <strong>${escape(f.title)}</strong>
                                            <span>${escape(f.reason)}</span>
                                        </button>`).join('')}
                                    </div>` : '<p class="sph-empty">Open tasks already have owners, estimates, due dates, and budget lines.</p>'}
                            </section>
                            <section class="sph-card sph-card--week">
                                <div class="sph-card-head"><h3>Coach tips</h3><span class="sph-auto">auto</span></div>
                                <p class="sph-coach-lead">Suggested from live issues — separate from your manual plan below.</p>
                                ${weekActionsTop.length
                                    ? `<div class="sph-week-list">${weekActionsTop.map(weekActionBtn).join('')}</div>`
                                    : '<p class="sph-empty">Nothing urgent from live data. Keep updating estimates and finishing ready work.</p>'}
                            </section>
                        </div>
                        ${renderProjectHealthPlanCardHtml(runtime, project)}
                    </section>
                    <div class="sph-board" data-lux-transparency-exempt="1">
                            <section class="sph-card sph-card--progress">
                                <div class="sph-card-head"><h3>Progress</h3><span class="sph-auto">auto</span></div>
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
                            <section class="sph-card sph-card--budget">
                                <div class="sph-card-head"><h3>Budget</h3><span class="sph-auto">auto</span></div>
                                <div class="sph-bmeter">
                                    <div class="sph-brow"><span class="sph-blab">Budget on cards</span><span class="sph-bamt">${escape(money(planned))}</span></div>
                                    <div class="sph-brow"><span class="sph-blab">Money recorded</span><span class="sph-bamt">${escape(money(spent))}</span></div>
                                    ${capValue > 0 ? `<div class="sph-brow sph-brow-total" data-over="${overCap ? '1' : '0'}"><span class="sph-blab">Project cap</span><span class="sph-bamt">${escape(money(capValue))}</span></div>` : '<div class="sph-brow"><span class="sph-blab">Project cap</span><span class="sph-bamt sph-muted">Not set</span></div>'}
                                </div>
                                ${noBudgetLine ? `<p class="sph-empty">${noBudgetLine} open task${noBudgetLine === 1 ? '' : 's'} have no budget on the card — “Budget on cards” understates work.</p>` : ''}
                            </section>
                            <section class="sph-card sph-card--risks">
                                <div class="sph-card-head">
                                    <h3>Risks</h3>
                                    <span class="sph-auto">auto</span>
                                    ${project.viewerCanContribute || risks.length
                                        ? `<button type="button" class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" data-action="project-risk-open" data-project-id="${escape(projectId)}"><i class="fas fa-triangle-exclamation"></i> Register</button>`
                                        : ''}
                                </div>
                                <div class="sph-profile">
                                    <div class="sph-chip" data-risk-bucket="${riskSummary.high ? 'high' : (riskSummary.open ? 'medium' : 'low')}"><span class="sph-c">${riskSummary.open}</span><span class="sph-l">Open</span></div>
                                    <div class="sph-chip" data-risk-bucket="${riskSummary.high ? 'high' : 'low'}"><span class="sph-c">${riskSummary.high}</span><span class="sph-l">High</span></div>
                                    <div class="sph-chip" data-risk-bucket="${riskSummary.unassigned ? 'medium' : 'low'}"><span class="sph-c">${riskSummary.unassigned}</span><span class="sph-l">No owner</span></div>
                                </div>
                                ${topRisks.length
                                    ? `<div class="sph-risklist">${topRisks.map((risk) => {
                                        const tier = projectRiskExposureTier(risk?.likelihood, risk?.impact);
                                        const score = projectRiskExposureScore(risk?.likelihood, risk?.impact);
                                        return `<div class="sph-risk" data-risk-bucket="${escape(tier)}">
                                            <span class="sph-sev" data-risk-bucket="${escape(tier)}"></span>
                                            <span class="sph-risk-name">${escape(text(risk?.title || 'Risk'))}<small>${escape(projectRiskOptionLabel(risk?.status || 'open'))}</small></span>
                                            <span class="sph-risk-exp"><b>${score}</b><small>/ 25 · ${escape(tier)}</small></span>
                                        </div>`;
                                    }).join('')}</div>`
                                    : '<div class="sph-empty">No open risks on the register.</div>'}
                            </section>
                            <section class="sph-card sph-card--schedule">
                                <div class="sph-card-head"><h3>Schedule</h3><span class="sph-auto">auto</span></div>
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
                                    <div class="sph-fact"><span class="sph-fv">${lastDueDate ? escape(when(lastDueDate.toISOString())) : '—'}</span><span class="sph-fk">Latest due date</span></div>
                                    <div class="sph-fact"><span class="sph-fv ${overdue.length ? 'sph-bad' : ''}">${overdue.length}</span><span class="sph-fk">Overdue</span></div>
                                    <div class="sph-fact"><span class="sph-fv">${dueSoon.length}</span><span class="sph-fk">Due in 7 days</span></div>
                                    ${overEstimateCount ? `<div class="sph-fact"><span class="sph-fv sph-bad">${overEstimateCount}</span><span class="sph-fk">Over estimate</span></div>` : ''}
                                </div>
                            </section>
                            <section class="sph-card sph-card--team">
                                <div class="sph-card-head"><h3>Team load</h3><span class="sph-auto">auto</span></div>
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
                            <section class="sph-card sph-card--deps">
                                <div class="sph-card-head"><h3>Dependencies</h3><span class="sph-auto">auto</span></div>
                                <div class="sph-deprow">
                                    <div class="sph-dep"><span class="sph-dep-ic ok"><i class="fas fa-link"></i></span><span><b>${linkCount}</b> order link${linkCount === 1 ? '' : 's'}</span></div>
                                    <div class="sph-dep"><span class="sph-dep-ic ${blocked.length ? 'warn' : 'ok'}"><i class="fas fa-ban"></i></span><span><b>${blocked.length}</b> blocked · <b>${waitingN}</b> waiting on deps</span></div>
                                    <div class="sph-dep"><span class="sph-dep-ic ${hasCycle ? 'warn' : 'ok'}"><i class="fas ${hasCycle ? 'fa-triangle-exclamation' : 'fa-check'}"></i></span><span><b>${hasCycle ? 'Yes' : 'None'}</b> — circular dependenc${hasCycle ? 'y found' : 'ies'}</span></div>
                                    ${bottleneck && bottleneckCount > 1 ? `<div class="sph-dep"><span class="sph-dep-ic warn"><i class="fas fa-diamond"></i></span><span><b>${escape(text(bottleneck.title || 'A task'))}</b> — ${bottleneckCount} tasks wait on it</span></div>` : ''}
                                    ${groups.length ? `<div class="sph-dep"><span class="sph-dep-ic ok"><i class="fas fa-layer-group"></i></span><span><b>${groups.length}</b> package${groups.length === 1 ? '' : 's'} on the map</span></div>` : ''}
                                </div>
                            </section>
                    </div>
                    <div class="sph-legend"><span class="sph-auto">auto</span> Hygiene chips open the Work Desk filter. <span class="sph-auto">yours</span> My plan is manual (days / weeks / months / all). Risks open the risk register.</div>
                </div>
                <div class="social-neo-form-actions social-neo-dialog-actions sph-fs-footer">
                    <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="project-task-graph-open" data-project-id="${escape(projectId)}"><i class="fas fa-diagram-project"></i> Open map</button>
                    <button class="social-neo-btn social-neo-btn-primary social-neo-dialog-submit-btn" type="button" data-action="dialog-close"><i class="fas fa-check"></i> Close</button>
                </div>
            </div>
        </div>`;
    }

    window.renderProjectTaskDeleteConfirmDialog = renderProjectTaskDeleteConfirmDialog;
    window.renderProjectTaskCreateDialog = renderProjectTaskCreateDialog;
    window.renderProjectTaskFormFields = renderProjectTaskFormFields;
    window.renderProjectTaskDetailModal = renderProjectTaskDetailModal;
    window.renderProjectHealthDialog = renderProjectHealthDialog;
    window.renderProjectHealthPlanCardHtml = renderProjectHealthPlanCardHtml;
    window.renderProjectHealthPlanPickDialog = renderProjectHealthPlanPickDialog;
    window.renderProjectHealthPlanPickBodyHtml = renderProjectHealthPlanPickBodyHtml;
    window.buildProjectHealthPlanPickModel = buildProjectHealthPlanPickModel;
    window.renderProjectRiskDialog = renderProjectRiskDialog;
    window.renderProjectRiskScaleOptions = renderProjectRiskScaleOptions;
    window.projectRiskRegisterSummary = projectRiskRegisterSummary;
    window.sortProjectRisksForRegister = sortProjectRisksForRegister;
    window.projectRiskExposureScore = projectRiskExposureScore;
    window.projectRiskOptionLabel = projectRiskOptionLabel;
    window.projectRiskScaleRank = projectRiskScaleRank;
    window.projectRiskScaleOptionLabel = projectRiskScaleOptionLabel;
    window.formatProjectRiskScore = formatProjectRiskScore;
    window.projectRiskExposureTiers = projectRiskExposureTiers;
    window.projectRiskIsActiveStatus = projectRiskIsActiveStatus;
    window.projectRiskLinkedTaskIdList = projectRiskLinkedTaskIdList;
    window.projectRiskLinksTask = projectRiskLinksTask;
    window.buildProjectRiskCountByTaskId = buildProjectRiskCountByTaskId;

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
                <div class="social-neo-section-head social-neo-dialog-head">
                    <div class="social-neo-dialog-heading">
                        <strong class="social-neo-dialog-title"><i class="fas ${escape(columnIcon)}" aria-hidden="true"></i> ${escape(column.label)}</strong>
                        <span class="social-neo-dialog-subtitle">${taskCountLabel}. Click a card for full details.</span>
                    </div>
                    <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-close-btn" type="button" data-action="dialog-close"><i class="fas fa-times"></i></button>
                </div>
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
                <div class="social-neo-form-actions social-neo-dialog-actions">
                    <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-cancel-btn" type="button" data-action="dialog-close">Cancel</button>
                    ${canContribute ? `<button class="social-neo-btn social-neo-btn-primary social-neo-dialog-submit-btn" type="button" data-action="project-task-quick-add" data-project-id="${escape(text(project.id))}" data-column="${escape(column.id)}"><i class="fas fa-plus"></i> Add task to ${escape(column.label)}</button>` : ''}
                </div>
            </div>
        </div>`;
    }


function renderProjectsWorkspacePanelClassic() {
        const runtime = state();
        const social = runtime.social || {};
        const projects = Array.isArray(social.projects) ? social.projects : [];
        const directory = Array.isArray(runtime.directory) ? runtime.directory : [];
        const activeProjectId = text(runtime.ui?.activeProjectId || '');
        const activeProject = projects.find((project) => text(project?.id) === activeProjectId) || null;
        const activeTabRaw = text(runtime.ui?.projectTab || 'overview') || 'overview';
        const REMOVED_PROJECT_TABS = new Set(['plan', 'milestones', 'meetings', 'files', 'checkins']);
        const activeTab = REMOVED_PROJECT_TABS.has(activeTabRaw) ? 'overview' : activeTabRaw;
        const facultyOptions = uniqueStrings([
            currentFacultyCode(),
            ...projects.flatMap((project) => Array.isArray(project?.facultyCodes) ? project.facultyCodes : []),
            ...directory.map((account) => text(account?.facultyCode || account?.faculty))
        ]).filter(Boolean);
        const projectFaculties = Array.isArray(runtime.ui?.projectFacultyCodes) && runtime.ui.projectFacultyCodes.length ? runtime.ui.projectFacultyCodes : [currentFacultyCode()];
        const roleLabels = {
            owner: 'Owner',
            member: 'Member',
            advisor: 'Advisor',
            'instructor-viewer': 'Instructor viewer'
        };
        const statusMeta = {
            idea: { label: 'Idea', note: 'Still being shaped' },
            active: { label: 'Active', note: 'Execution in progress' },
            review: { label: 'Review', note: 'Preparing for review' },
            completed: { label: 'Completed', note: 'Workspace delivered' }
        };
        const taskColumns = PROJECT_TASK_COLUMNS;
        const advisorCandidates = directory.filter((account) => isStaffAccount(account) || ['professor', 'ta', 'admin'].includes(text(account?.role || '').toLowerCase()));
        const projectInviteSelectedIds = Array.isArray(runtime.ui?.projectInviteSelectedIds) ? runtime.ui.projectInviteSelectedIds : [];
        const inviteSearch = text(runtime.ui?.projectInviteSearch || '').toLowerCase();
        const inviteFaculty = text(runtime.ui?.projectInviteFaculty || 'all') || 'all';
        const selectedProjectMemberIds = uniqueStrings([
            ...(Array.isArray(activeProject?.memberIds) ? activeProject.memberIds : []),
            ...(Array.isArray(activeProject?.pendingMemberIds) ? activeProject.pendingMemberIds : []),
            text(activeProject?.advisorUserId || ''),
            ...(Array.isArray(activeProject?.instructorViewerIds) ? activeProject.instructorViewerIds : [])
        ]);
        const filteredInviteCandidates = directory
            .filter((account) => text(account?.id) && text(account.id) !== currentUserId())
            .filter((account) => !projectInviteSelectedIds.includes(text(account.id)))
            .filter((account) => !selectedProjectMemberIds.includes(text(account.id)))
            .filter((account) => inviteFaculty === 'all' || text(account?.facultyCode || account?.faculty) === inviteFaculty)
            .filter((account) => {
                if (!inviteSearch) return true;
                const blob = `${displayName(account)} ${accountSubtitle(account)} ${text(account?.facultyCode || account?.faculty)} ${Array.isArray(account?.interests) ? account.interests.join(' ') : ''}`.toLowerCase();
                return blob.includes(inviteSearch);
            })
            .slice(0, 18);
        const myProjects = projects.filter((project) => ['owner', 'member', 'advisor', 'instructor-viewer'].includes(text(project?.role || '').toLowerCase()));
        const featuredProjects = [...projects]
            .sort((left, right) => Number(right?.activityCount || 0) - Number(left?.activityCount || 0))
            .slice(0, 6);
        const projectRolePill = (role) => `<span class="social-neo-pill">${escape(roleLabels[text(role).toLowerCase()] || roleLabel(role || 'member'))}</span>`;
        const facultyPills = (codes = []) => (Array.isArray(codes) ? codes : []).map((code) => `<span class="social-neo-pill">${escape(code)}</span>`).join('');
        const skillPills = (skills = []) => (Array.isArray(skills) ? skills : []).map((skill) => `<span class="social-neo-pill">${escape(skill)}</span>`).join('');
        const scrollList = (modifier, content) => `<div class="social-project-scroll-list${modifier ? ` ${modifier}` : ''}">${content}</div>`;
        const projectToneFromAccent = (accent = '') => {
            const normalized = text(accent).toLowerCase();
            if (normalized === '#3b82f6') return 'blue';
            if (normalized === '#8b5cf6') return 'purple';
            if (normalized === '#14b8a6') return 'teal';
            return 'orange';
        };
        const renderMetricCard = (icon, label, value, note, accent = '#f97316') => `
            <article class="social-project-metric-card" data-project-tone="${projectToneFromAccent(accent)}">
                <span class="social-project-metric-icon"><i class="fas ${escape(icon)}"></i></span>
                <div>
                    <small>${escape(label)}</small>
                    <strong>${escape(String(value))}</strong>
                    <span>${escape(note)}</span>
                </div>
            </article>
        `;
        const renderProgressRing = (value, label, note, accent = '#f97316') => {
            const normalized = Math.max(0, Math.min(100, countNum(value)));
            const circumference = 2 * Math.PI * 42;
            const dash = circumference - ((normalized / 100) * circumference);
            return `
                <article class="social-project-ring-card" data-project-tone="${projectToneFromAccent(accent)}">
                    <svg viewBox="0 0 110 110" aria-hidden="true">
                        <circle cx="55" cy="55" r="42" class="social-project-ring-track"></circle>
                        <circle cx="55" cy="55" r="42" class="social-project-ring-value" stroke-dasharray="${circumference}" stroke-dashoffset="${dash}"></circle>
                    </svg>
                    <div class="social-project-ring-copy">
                        <strong>${escape(String(normalized))}%</strong>
                        <span>${escape(label)}</span>
                        <small>${escape(note)}</small>
                    </div>
                </article>
            `;
        };
        const renderSparkline = (points = []) => {
            const list = Array.isArray(points) && points.length ? points : [{ count: 0, label: '00/00' }];
            const maxValue = Math.max(1, ...list.map((entry) => countNum(entry?.count)));
            const width = 800;
            const height = 96;
            const step = list.length > 1 ? width / (list.length - 1) : width;
            const pts = list.map((entry, index) => {
                const x = Math.round(index * step);
                const y = Math.round(height - ((countNum(entry?.count) / maxValue) * (height - 20)) - 10);
                return { x, y, label: text(entry?.label || ''), count: countNum(entry?.count) };
            });
            const polyline = pts.map((p) => `${p.x},${p.y}`).join(' ');
            const areaPath = `M${pts[0].x},${height} ` + pts.map((p) => `L${p.x},${p.y}`).join(' ') + ` L${pts[pts.length - 1].x},${height} Z`;
            return `
                <div class="social-project-sparkline social-project-sparkline--full">
                    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true" class="social-project-sparkline-svg">
                        <defs>
                            <linearGradient id="spark-area-gradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="var(--sn-proj-accent,#c8822a)" stop-opacity="0.28"/>
                                <stop offset="100%" stop-color="var(--sn-proj-accent,#c8822a)" stop-opacity="0.02"/>
                            </linearGradient>
                        </defs>
                        <path d="${areaPath}" fill="url(#spark-area-gradient)"/>
                        <polyline points="${polyline}" class="social-project-sparkline-line"></polyline>
                        ${pts.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="4" class="social-project-sparkline-dot" opacity="${p.count > 0 ? '1' : '0.3'}"/>`).join('')}
                    </svg>
                    <div class="social-project-sparkline-labels">
                        ${list.map((entry) => `<span>${escape(text(entry?.label || ''))}</span>`).join('')}
                    </div>
                </div>
            `;
        };
        const renderMiniProgressRing = (value, accent = '#f97316', size = 44) => {
            const normalized = Math.max(0, Math.min(100, countNum(value)));
            const r = (size / 2) - 5;
            const circumference = 2 * Math.PI * r;
            const dash = circumference - ((normalized / 100) * circumference);
            const center = size / 2;
            return `
                <svg class="social-project-mini-ring" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">
                    <circle cx="${center}" cy="${center}" r="${r}" fill="none" stroke="rgba(148,163,184,0.2)" stroke-width="4"></circle>
                    <circle cx="${center}" cy="${center}" r="${r}" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${dash}" transform="rotate(-90 ${center} ${center})"></circle>
                    <text x="${center}" y="${center}" text-anchor="middle" dominant-baseline="central" class="social-project-mini-ring-text">${escape(String(normalized))}%</text>
                </svg>
            `;
        };
        const renderMiniSparkline = (points = [], width = 200, height = 40) => {
            const list = Array.isArray(points) && points.length ? points : [{ count: 0 }];
            const maxValue = Math.max(1, ...list.map((entry) => countNum(entry?.count)));
            const step = list.length > 1 ? width / (list.length - 1) : width;
            const pts = list.map((entry, index) => {
                const x = Math.round(index * step);
                const y = Math.round(height - ((countNum(entry?.count) / maxValue) * (height - 8)) - 4);
                return { x, y };
            });
            const polyline = pts.map((p) => `${p.x},${p.y}`).join(' ');
            const areaPath = `M${pts[0].x},${height} ` + pts.map((p) => `L${p.x},${p.y}`).join(' ') + ` L${pts[pts.length - 1].x},${height} Z`;
            return `
                <svg class="social-project-mini-sparkline" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
                    <defs>
                        <linearGradient id="mini-spark-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="var(--sn-proj-accent,#c8822a)" stop-opacity="0.3"/>
                            <stop offset="100%" stop-color="var(--sn-proj-accent,#c8822a)" stop-opacity="0.02"/>
                        </linearGradient>
                    </defs>
                    <path d="${areaPath}" fill="url(#mini-spark-grad)"/>
                    <polyline points="${polyline}" fill="none" stroke="var(--sn-proj-accent,#c8822a)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></polyline>
                </svg>
            `;
        };
        const renderHealthIndicator = (project) => {
            const tasks = Array.isArray(project?.tasks) ? project.tasks : [];
            const now = Date.now();
            const overdueTasks = tasks.filter((t) => t.status !== 'done' && t.dueAt && new Date(t.dueAt).getTime() < now).length;
            const taskPct = countNum(project?.taskCompletionPercent);
            const activityCount = countNum(project?.activityCount);
            let level = 'good';
            let label = 'On track';
            let icon = 'fa-circle-check';
            const alerts = [];
            if (overdueTasks >= 3) {
                level = 'critical';
                label = 'Critical';
                icon = 'fa-triangle-exclamation';
            } else if (overdueTasks >= 1 || taskPct < 30) {
                level = 'needs-attention';
                label = 'Needs attention';
                icon = 'fa-circle-exclamation';
            }
            if (overdueTasks > 0) alerts.push(`${overdueTasks} overdue task${overdueTasks > 1 ? 's' : ''}`);
            if (taskPct === 0 && tasks.length > 0) alerts.push('No tasks completed yet');
            if (tasks.length === 0) alerts.push('No tasks created');
            const wins = [];
            if (taskPct >= 50) wins.push(`${taskPct}% tasks done`);
            if (activityCount > 0) wins.push(`${activityCount} events this week`);
            if (overdueTasks === 0 && tasks.length > 0) wins.push('No overdue items');
            return `
                <section class="social-neo-card social-project-health-card" data-health="${escape(level)}">
                    <div class="social-neo-section-head">
                        <div><strong>Project health</strong><span>Overall workspace status.</span></div>
                        <span class="social-project-health-badge" data-health="${escape(level)}"><i class="fas ${escape(icon)}"></i> ${escape(label)}</span>
                    </div>
                    <div class="social-project-overview-slot__scroll social-project-health-body">
                        ${alerts.length ? `<div class="social-project-health-list">${alerts.map((a) => `<div class="social-project-health-alert"><i class="fas fa-circle-xmark"></i> ${escape(a)}</div>`).join('')}</div>` : ''}
                        ${wins.length ? `<div class="social-project-health-list">${wins.map((w) => `<div class="social-project-health-win"><i class="fas fa-circle-check"></i> ${escape(w)}</div>`).join('')}</div>` : ''}
                        ${!alerts.length && !wins.length ? '<div class="social-neo-muted">Start adding tasks to see health status.</div>' : ''}
                    </div>
                    <div class="social-project-card-new-cta"><span data-action="project-tab" data-project-id="${escape(text(project?.id))}" data-project-tab="tasks">View all tasks →</span></div>
                </section>
            `;
        };
        const renderMyTasks = (project) => {
            const userId = currentUserId();
            const allTasks = Array.isArray(project?.tasks) ? project.tasks : [];
            const myTasks = allTasks.filter((t) => text(t.assigneeUserId) === userId && t.status !== 'done').sort((a, b) => {
                if (a.dueAt && b.dueAt) return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
                if (a.dueAt) return -1;
                if (b.dueAt) return 1;
                return 0;
            }).slice(0, 5);
            const toneMap = { todo: 'blue', 'in-progress': 'orange', blocked: 'rose', done: 'emerald' };
            const labelMap = { todo: 'To Do', 'in-progress': 'In Progress', blocked: 'Blocked', done: 'Done' };
            const priorityIcon = { 'low': 'fa-arrow-down', 'medium': 'fa-minus', 'high': 'fa-arrow-up', 'urgent': 'fa-angles-up' };
            return `
                <section class="social-neo-card social-project-my-tasks-card">
                    <div class="social-neo-section-head">
                        <div><strong>My tasks</strong><span>Your assigned work.</span></div>
                        <span class="social-neo-pill">${escape(String(myTasks.length))} open</span>
                    </div>
                    ${myTasks.length ? `<div class="social-project-overview-slot__scroll social-project-my-tasks-list">${myTasks.map((task) => {
                        const now = Date.now();
                        const isOverdue = task.dueAt && new Date(task.dueAt).getTime() < now;
                        const tone = toneMap[task.status] || 'slate';
                        return `
                            <div class="social-project-my-task-item is-clickable ${isOverdue ? 'is-overdue' : ''}" role="button" tabindex="0" data-action="project-task-detail-open" data-project-id="${escape(text(project?.id))}" data-task-id="${escape(text(task?.id))}">
                                <span class="social-project-status-dot is-${escape(tone)}"></span>
                                <span class="social-project-my-task-title">${escape(text(task.title || ''))}</span>
                                <span class="social-project-status-label">${escape(labelMap[task.status] || task.status)}</span>
                                ${task.priority && task.priority !== 'medium' ? `<span class="social-project-priority-pill" data-priority="${escape(task.priority)}"><i class="fas ${escape(priorityIcon[task.priority] || 'fa-minus')}"></i> ${escape(task.priority)}</span>` : ''}
                                ${task.dueAt ? `<span class="social-project-my-task-due ${isOverdue ? 'is-overdue' : ''}">${escape(when(task.dueAt))}</span>` : ''}
                            </div>
                        `;
                    }).join('')}</div>` : '<div class="social-neo-empty">No tasks assigned to you yet.</div>'}
                    <div class="social-project-card-new-cta"><span data-action="project-tab" data-project-id="${escape(text(project?.id))}" data-project-tab="tasks">View all tasks →</span></div>
                </section>
            `;
        };
        const renderTeamRoster = (project, members) => {
            const list = Array.isArray(members) ? members.slice(0, 6) : [];
            return `
                <section class="social-neo-card social-project-roster-card">
                    <div class="social-neo-section-head">
                        <div><strong>Team</strong><span>Members and roles.</span></div>
                        <span class="social-neo-pill">${escape(String(project?.memberCount || 0))} members</span>
                    </div>
                    ${list.length ? `<div class="social-project-overview-slot__scroll social-project-team-roster">${list.map((member) => {
                        const account = accountById(member.userId) || { id: member.userId };
                        const online = isAccountOnline(account);
                        const roleLabel = text(member.role || 'member');
                        const facultyCode = text(member.facultyCode || account?.facultyCode || account?.faculty || '');
                        return `
                            <div class="social-project-roster-member">
                                <span class="social-project-roster-dot ${online ? 'is-online' : ''}"></span>
                                <div class="social-neo-person">${avatar(account, 'social-neo-avatar-sm')}<div><strong>${escape(displayName(account))}</strong><span>${escape(roleLabel)}${facultyCode ? ` · ${escape(facultyCode)}` : ''}</span></div></div>
                            </div>
                        `;
                    }).join('')}</div>` : '<div class="social-neo-empty">No team members yet.</div>'}
                    <div class="social-project-card-new-cta"><span data-action="project-tab" data-project-id="${escape(text(project?.id))}" data-project-tab="team">View all team →</span></div>
                </section>
            `;
        };
        const activityIconMap = {
            'project-created': 'fa-rocket',
            'project-updated': 'fa-pen',
            'member-invited': 'fa-user-plus',
            'member-role-updated': 'fa-user-shield',
            'member-removed': 'fa-user-minus',
            'member-left': 'fa-door-open',
            'task-created': 'fa-square-plus',
            'task-updated': 'fa-list-check',
            'task-deleted': 'fa-trash',
            'milestone-created': 'fa-flag',
            'milestone-updated': 'fa-flag-checkered',
            'milestone-deleted': 'fa-trash',
            'deliverable-submitted': 'fa-box-archive',
            'deliverable-submitted-for-review': 'fa-paper-plane',
            'deliverable-approved': 'fa-check',
            'deliverable-revision-requested': 'fa-rotate-left',
            'deliverable-updated': 'fa-pen',
            'deliverable-removed': 'fa-trash',
            'checkin-posted': 'fa-comment-dots',
            'showcase-created': 'fa-globe'
        };
        const renderActivityItem = (entry) => {
            const actor = accountById(entry.actorUserId) || { id: entry.actorUserId };
            return `
                <article class="social-project-activity-item">
                    <div class="social-project-activity-icon"><i class="fas ${escape(activityIconMap[text(entry?.type || '')] || 'fa-clock-rotate-left')}"></i></div>
                    <div class="social-project-activity-body">
                        <div class="social-project-activity-head">
                            <div class="social-neo-person">
                                ${avatar(actor, 'social-neo-avatar-sm')}
                                <div>
                                    <strong>${escape(displayName(actor))}</strong>
                                    <span>${escape(text(entry.summary || entry.type || 'Updated the project'))}</span>
                                </div>
                            </div>
                            <em>${escape(when(entry.createdAt || ''))}</em>
                        </div>
                    </div>
                </article>
            `;
        };
        const renderActivityFeed = (project) => {
            const items = Array.isArray(project?.activity) ? project.activity.slice(0, 5) : [];
            return `
                <section class="social-neo-card social-project-feed-card">
                    <div class="social-neo-section-head">
                        <div><strong>Recent activity</strong><span>Latest workspace changes.</span></div>
                        <span class="social-neo-pill">${escape(String(project?.activityCount || 0))} events</span>
                    </div>
                    ${items.length ? `<div class="social-project-overview-slot__scroll social-project-activity-feed">${items.map(renderActivityItem).join('')}</div>` : '<div class="social-neo-empty">No activity recorded yet.</div>'}
                    <div class="social-project-card-new-cta"><span data-action="project-tab" data-project-id="${escape(text(project?.id))}" data-project-tab="activity">View all activity →</span></div>
                </section>
            `;
        };
        const renderQuickActions = (project, options = {}) => {
            const compact = Boolean(options?.compact);
            const limit = compact ? Math.max(1, Number(options?.limit) || 4) : 0;
            const isManager = Boolean(project?.isManager || project?.viewerCanContribute);
            const projectId = escape(text(project?.id));
            const actions = [
                { icon: 'fa-comments', label: 'Open chat', action: 'project-open-chat' },
                { icon: 'fa-list-check', label: 'Create task', tab: 'tasks' },
                { icon: 'fa-diagram-project', label: 'Task flow map', action: 'project-task-graph-open' },
                ...(isManager ? [{ icon: 'fa-globe', label: 'Publish showcase', action: 'project-showcase-publish' }] : []),
            ];
            const renderActionBtn = (entry, extraClass = '') => {
                const cls = `social-neo-btn social-neo-btn-ghost${extraClass ? ` ${extraClass}` : ''}`;
                if (entry.action === 'project-open-chat') {
                    return `<button class="${cls}" type="button" data-action="project-open-chat" data-project-id="${projectId}"><i class="fas ${entry.icon}"></i> ${entry.label}</button>`;
                }
                if (entry.action === 'project-showcase-publish') {
                    return `<button class="${cls}" type="button" data-action="project-showcase-publish" data-project-id="${projectId}"><i class="fas ${entry.icon}"></i> ${entry.label}</button>`;
                }
                if (entry.action === 'project-task-graph-open') {
                    return `<button class="${cls}" type="button" data-action="project-task-graph-open" data-project-id="${projectId}"><i class="fas ${entry.icon}"></i> ${entry.label}</button>`;
                }
                return `<button class="${cls}" type="button" data-action="project-tab" data-project-id="${projectId}" data-project-tab="${entry.tab}"><i class="fas ${entry.icon}"></i> ${entry.label}</button>`;
            };
            const primary = limit ? actions.slice(0, limit) : actions;
            const overflow = limit ? actions.slice(limit) : [];
            return `
                <section class="social-neo-card social-project-quick-actions-card${compact ? ' is-compact' : ''}">
                    <div class="social-neo-section-head">
                        <div><strong>Quick actions</strong><span>Common workspace operations.</span></div>
                    </div>
                    <div class="social-project-quick-actions-grid">
                        ${primary.map((entry) => renderActionBtn(entry)).join('')}
                    </div>
                    ${overflow.length ? `
                        <details class="social-project-quick-actions-more">
                            <summary class="social-project-quick-actions-more-trigger"><i class="fas fa-ellipsis"></i> More actions</summary>
                            <div class="social-project-quick-actions-more-menu">
                                ${overflow.map((entry) => renderActionBtn(entry, 'social-project-quick-actions-more-btn')).join('')}
                            </div>
                        </details>
                    ` : ''}
                </section>
            `;
        };
        const renderTaskStatusChart = (project) => {
            const counts = project?.taskStatusCounts || {};
            const total = Math.max(1, countNum(project?.taskCount));
            return `
                <section class="social-neo-card social-project-chart-card">
                    <div class="social-neo-section-head">
                        <div><strong>Task status distribution</strong><span>See where work is collecting across the board.</span></div>
                        <span class="social-neo-pill">${escape(String(project?.taskCount || 0))} tasks</span>
                    </div>
                    <div class="social-project-overview-slot__scroll social-project-status-chart">
                        <div class="social-project-status-bar">
                            ${taskColumns.map((column) => {
                                const count = countNum(counts?.[column.id]);
                                const width = total ? Math.max(0, (count / total) * 100) : 0;
                                return `<span class="social-project-status-segment is-${escape(column.tone)}" style="width:${width}%"></span>`;
                            }).join('')}
                        </div>
                        <div class="social-project-status-grid">
                            ${taskColumns.map((column) => `
                                <article class="social-project-status-item">
                                    <div>
                                        <span class="social-project-status-dot is-${escape(column.tone)}"></span>
                                        <strong>${escape(column.label)}</strong>
                                    </div>
                                    <span>${escape(String(countNum(counts?.[column.id])))}</span>
                                </article>
                            `).join('')}
                        </div>
                    </div>
                    <div class="social-project-card-new-cta"><span data-action="project-tab" data-project-id="${escape(text(project?.id))}" data-project-tab="tasks">View all tasks →</span></div>
                </section>
            `;
        };
        const renderTaskStatusDonut = (project) => {
            const counts = project?.taskStatusCounts || {};
            const total = taskColumns.reduce((sum, column) => sum + countNum(counts?.[column.id]), 0);
            const toneHex = { slate: '#94a3b8', blue: '#3b82f6', orange: '#f97316', rose: '#f43f5e', emerald: '#10b981' };
            const radius = 54;
            const circumference = 2 * Math.PI * radius;
            let offset = 0;
            const segments = total > 0 ? taskColumns.map((column) => {
                const count = countNum(counts?.[column.id]);
                if (count <= 0) return '';
                const length = (count / total) * circumference;
                const dash = `${length} ${circumference - length}`;
                const circle = `<circle class="social-project-donut-seg" cx="80" cy="80" r="${radius}" fill="none" stroke="${toneHex[column.tone] || '#94a3b8'}" stroke-width="20" stroke-dasharray="${dash}" stroke-dashoffset="${-offset}" transform="rotate(-90 80 80)"></circle>`;
                offset += length;
                return circle;
            }).join('') : `<circle cx="80" cy="80" r="${radius}" fill="none" stroke="rgba(148,163,184,0.25)" stroke-width="20"></circle>`;
            const completion = countNum(project?.taskCompletionPercent);
            return `
                <section class="social-neo-card social-project-chart-card">
                    <div class="social-neo-section-head">
                        <div><strong>Status distribution</strong><span>Share of tasks in each column.</span></div>
                        <span class="social-neo-pill">${escape(String(project?.taskCount || 0))} tasks</span>
                    </div>
                    <div class="social-project-donut-wrap">
                        <svg class="social-project-donut" viewBox="0 0 160 160" role="img" aria-label="Task status distribution">
                            ${segments}
                            <text x="80" y="74" text-anchor="middle" class="social-project-donut-value">${escape(String(completion))}%</text>
                            <text x="80" y="96" text-anchor="middle" class="social-project-donut-label">done</text>
                        </svg>
                        <div class="social-project-donut-legend">
                            ${taskColumns.map((column) => `
                                <span class="social-project-donut-key">
                                    <i class="social-project-status-dot is-${escape(column.tone)}"></i>
                                    ${escape(column.label)}
                                    <em>${escape(String(countNum(counts?.[column.id])))}</em>
                                </span>
                            `).join('')}
                        </div>
                    </div>
                </section>
            `;
        };
        const renderWorkloadChart = (project) => {
            const list = Array.isArray(project?.workloadByMember) ? project.workloadByMember.slice(0, 6) : [];
            const maxHours = Math.max(1, ...list.map((entry) => Number(entry?.hours) || 0));
            return `
                <section class="social-neo-card social-project-chart-card">
                    <div class="social-neo-section-head">
                        <div><strong>Workload by member</strong><span>Open assigned work per teammate.</span></div>
                        <span class="social-neo-pill">${escape(String(list.length))} shown</span>
                    </div>
                    <div class="social-project-overview-slot__scroll social-project-workload-list">
                        ${list.length ? list.map((entry) => {
                            const account = accountById(entry.userId) || { id: entry.userId };
                            const hours = Number(entry?.hours) || 0;
                            const width = (hours / maxHours) * 100;
                            return `
                                <article class="social-project-workload-item">
                                    <div class="social-project-workload-head">
                                        <div class="social-neo-person">
                                            ${avatar(account, 'social-neo-avatar-sm')}
                                            <div>
                                                <strong>${escape(displayName(account))}</strong>
                                                <span>${escape(text(entry.role || 'member'))}</span>
                                            </div>
                                        </div>
                                        <em>${escape(String(countNum(entry.count)))} open · ${escape(formatProjectScheduleHours(hours))}</em>
                                    </div>
                                    <div class="social-project-workload-bar"><span style="width:${width}%"></span></div>
                                </article>
                            `;
                        }).join('') : `<div class="social-neo-empty">No assigned workload yet.</div>`}
                    </div>
                    <div class="social-project-card-new-cta"><span data-action="project-tab" data-project-id="${escape(text(project?.id))}" data-project-tab="team">View all team →</span></div>
                </section>
            `;
        };
        const renderProjectCard = (project) => {
            const owner = accountById(project?.ownerUserId) || { id: project?.ownerUserId };
            const status = text(project?.status || 'idea');
            const statusDotClass = status === 'active' ? 'is-active' : status === 'completed' ? 'is-completed' : status === 'review' ? 'is-review' : '';
            const statusLabel = statusMeta[status]?.label || status;
            const taskPercent = countNum(project?.taskCompletionPercent);
            const taskCount = countNum(project?.taskCount);
            const completedTasks = countNum(project?.completedTaskCount);
            const facultyCode = Array.isArray(project?.facultyCodes) ? project.facultyCodes[0] || '' : '';
            const role = text(project?.role || '').toLowerCase();
            const roleLabelText = roleLabels[role] || (role ? roleLabel(role) : '');
            const skillTags = (Array.isArray(project?.skillTags) ? project.skillTags : []).map((tag) => text(tag)).filter(Boolean).slice(0, 3);
            const memberCount = countNum(project?.memberCount);
            const maxMembers = countNum(project?.maxTeamSize || project?.targetTeamSize || project?.maxMembers || 0);
            const capacityLabel = maxMembers > 0 ? `${memberCount}/${maxMembers}` : `${memberCount} members`;
            return `
                <article class="social-project-card-new" data-action="project-open" data-project-id="${escape(text(project?.id))}">
                    <div class="social-project-card-new-status">
                        <span class="social-project-status-dot ${escape(statusDotClass)}"></span>
                        <span class="social-project-status-label">${escape(statusLabel)}</span>
                        ${roleLabelText ? `<span class="social-neo-pill social-project-card-role">${escape(roleLabelText)}</span>` : ''}
                    </div>
                    <h3 class="social-project-card-new-title">${escape(text(project?.name || 'Project workspace'))}</h3>
                    <p class="social-project-card-new-summary">${escape(text(project?.summary || project?.description || ''))}</p>
                    <div class="social-project-card-new-progress">
                        <div class="social-project-card-new-progress-row">
                            <span class="social-project-card-new-progress-label">Tasks</span>
                            <div class="social-project-card-new-progress-bar">
                                <div class="social-project-card-new-progress-fill" style="width:${taskPercent}%"></div>
                            </div>
                            <span class="social-project-card-new-progress-value">${taskPercent}% (${completedTasks}/${taskCount})</span>
                        </div>
                    </div>
                    ${skillTags.length ? `<div class="social-project-card-new-skills">${skillTags.map((skill) => `<span class="social-neo-pill">${escape(skill)}</span>`).join('')}</div>` : ''}
                    <div class="social-project-card-new-meta">
                        <span>${escape(displayName(owner))} · ${escape(facultyCode)} · ${escape(capacityLabel)}</span>
                    </div>
                    <div class="social-project-card-new-cta">
                        <span>Open project →</span>
                    </div>
                </article>
            `;
        };
        const renderProjectRow = (project) => {
            const status = text(project?.status || 'idea');
            const statusDotClass = status === 'active' ? 'is-active' : status === 'completed' ? 'is-completed' : status === 'review' ? 'is-review' : '';
            const statusLabel = statusMeta[status]?.label || status;
            const taskPercent = countNum(project?.taskCompletionPercent);
            const facultyCode = Array.isArray(project?.facultyCodes) ? project.facultyCodes[0] || '' : '';
            const role = text(project?.role || '').toLowerCase();
            const roleLabelText = roleLabels[role] || (role ? roleLabel(role) : '');
            const memberCount = countNum(project?.memberCount);
            const maxMembers = countNum(project?.maxTeamSize || project?.targetTeamSize || project?.maxMembers || 0);
            const capacityLabel = maxMembers > 0 ? `${memberCount}/${maxMembers}` : `${memberCount}`;
            return `
                <div class="social-project-row" data-action="project-open" data-project-id="${escape(text(project?.id))}">
                    <div class="social-project-row-status">
                        <span class="social-project-status-dot ${escape(statusDotClass)}"></span>
                        <span class="social-project-status-label">${escape(statusLabel)}</span>
                    </div>
                    <span class="social-project-row-title">${escape(text(project?.name || 'Project workspace'))}</span>
                    <span class="social-project-row-meta">${escape(facultyCode)} · ${escape(capacityLabel)}${roleLabelText ? ` · ${escape(roleLabelText)}` : ''}</span>
                    <div class="social-project-row-progress">
                        <div class="social-project-row-progress-bar">
                            <div class="social-project-row-progress-fill" style="width:${taskPercent}%"></div>
                        </div>
                        <span class="social-project-row-progress-value">${taskPercent}%</span>
                    </div>
                    <span class="social-project-row-cta">Open →</span>
                </div>
            `;
        };
        if (!activeProject) {
            renderProjectWorkspaceTabPanel = null;
            const totalTasks = projects.reduce((sum, project) => sum + countNum(project?.taskCount), 0);
            const totalActivity = projects.reduce((sum, project) => sum + countNum(project?.activityCount), 0);
            const hubScope = text(runtime.ui?.projectHubScope || 'mine') || 'mine';
            const hubStatus = text(runtime.ui?.projectHubStatus || 'all') || 'all';
            const hubViewMode = text(runtime.ui?.projectHubViewMode || 'grid') || 'grid';
            const discoverSearch = text(runtime.ui?.projectDiscoverSearch || '').toLowerCase();
            const discoverFaculty = text(runtime.ui?.projectDiscoverFaculty || '') || (hubScope === 'faculty' ? currentFacultyCode() : 'all');
            const discoverTag = text(runtime.ui?.projectDiscoverTag || '').toLowerCase();
            const currentUser = currentUserId();
            const hubSkillOptions = uniqueStrings(projects.flatMap((project) => Array.isArray(project?.skillTags) ? project.skillTags : [])).slice(0, 16);
            const hubFacultyCodes = uniqueStrings([
                currentFacultyCode(),
                ...projects.flatMap((project) => Array.isArray(project?.facultyCodes) ? project.facultyCodes : [])
            ]).filter(Boolean);
            const hubFacultyOptions = ['all', ...hubFacultyCodes.filter((code) => text(code) !== 'all')];
            const projectNeedsMyAttention = (project) => {
                const tasks = Array.isArray(project?.tasks) ? project.tasks : [];
                const now = Date.now();
                const todayKey = new Date(now).toDateString();
                return tasks.some((task) => {
                    if (text(task?.assigneeUserId) !== currentUser || text(task?.status || '') === 'done') return false;
                    if (text(task?.status || '') === 'blocked') return true;
                    const dueMs = Number.isFinite(Date.parse(text(task?.dueAt || ''))) ? Date.parse(text(task.dueAt)) : null;
                    if (!dueMs) return false;
                    if (dueMs < now) return true;
                    return new Date(dueMs).toDateString() === todayKey;
                });
            };
            const matchesHubSearch = (project) => {
                if (!discoverSearch) return true;
                const blob = [
                    text(project?.name || ''),
                    text(project?.summary || ''),
                    text(project?.description || ''),
                    ...(Array.isArray(project?.skillTags) ? project.skillTags : []),
                    ...(Array.isArray(project?.facultyCodes) ? project.facultyCodes : [])
                ].join(' ').toLowerCase();
                return blob.includes(discoverSearch);
            };
            const matchesHubFaculty = (project, facultyCode) => (Array.isArray(project?.facultyCodes) ? project.facultyCodes : [])
                .some((code) => text(code) === facultyCode);
            let hubProjects = [...projects];
            if (hubScope === 'mine' || hubScope === 'attention') {
                hubProjects = hubProjects.filter((project) => ['owner', 'member', 'advisor', 'instructor-viewer'].includes(text(project?.role || '').toLowerCase()));
                if (hubScope === 'attention') hubProjects = hubProjects.filter(projectNeedsMyAttention);
            } else if (hubScope === 'faculty') {
                // Faculty scope defaults to current faculty when select is "All faculties"
                const facultyCode = (discoverFaculty && discoverFaculty !== 'all') ? discoverFaculty : currentFacultyCode();
                hubProjects = hubProjects.filter((project) => matchesHubFaculty(project, facultyCode));
            }
            // Faculty select filters independently for every scope when not "all"
            if (discoverFaculty && discoverFaculty !== 'all' && hubScope !== 'faculty') {
                hubProjects = hubProjects.filter((project) => matchesHubFaculty(project, discoverFaculty));
            }
            if (hubStatus !== 'all') hubProjects = hubProjects.filter((project) => text(project?.status || 'idea') === hubStatus);
            if (discoverTag) {
                hubProjects = hubProjects.filter((project) => (Array.isArray(project?.skillTags) ? project.skillTags : [])
                    .some((tag) => text(tag).toLowerCase() === discoverTag));
            }
            hubProjects = hubProjects.filter(matchesHubSearch);
            const hubStatusCounts = {
                all: projects.length,
                idea: projects.filter((p) => text(p?.status) === 'idea').length,
                active: projects.filter((p) => text(p?.status) === 'active').length,
                review: projects.filter((p) => text(p?.status) === 'review').length,
                completed: projects.filter((p) => text(p?.status) === 'completed').length
            };
            const myWorkItems = myProjects.flatMap((project) => {
                const projectId = text(project?.id);
                return (Array.isArray(project?.tasks) ? project.tasks : [])
                    .filter((task) => text(task?.assigneeUserId) === currentUser && text(task?.status || '') !== 'done')
                    .map((task) => {
                        const dueMs = Number.isFinite(Date.parse(text(task?.dueAt || ''))) ? Date.parse(text(task.dueAt)) : null;
                        const overdue = Boolean(dueMs && dueMs < Date.now());
                        return { project, projectId, task, dueMs, overdue };
                    });
            }).sort((left, right) => {
                if (left.overdue !== right.overdue) return left.overdue ? -1 : 1;
                if (left.dueMs && right.dueMs) return left.dueMs - right.dueMs;
                if (left.dueMs) return -1;
                if (right.dueMs) return 1;
                return 0;
            }).slice(0, 5);
            const openAssignedCount = myProjects.reduce((sum, project) => sum + (Array.isArray(project?.tasks) ? project.tasks : [])
                .filter((task) => text(task?.assigneeUserId) === currentUser && text(task?.status || '') !== 'done').length, 0);
            const overdueAssignedCount = myProjects.reduce((sum, project) => sum + (Array.isArray(project?.tasks) ? project.tasks : [])
                .filter((task) => {
                    if (text(task?.assigneeUserId) !== currentUser || text(task?.status || '') === 'done') return false;
                    const dueMs = Number.isFinite(Date.parse(text(task?.dueAt || ''))) ? Date.parse(text(task.dueAt)) : null;
                    return Boolean(dueMs && dueMs < Date.now());
                }).length, 0);
            const blockedAssignedCount = myProjects.reduce((sum, project) => sum + (Array.isArray(project?.tasks) ? project.tasks : [])
                .filter((task) => text(task?.assigneeUserId) === currentUser && text(task?.status || '') === 'blocked').length, 0);
            const dueTodayCount = myProjects.reduce((sum, project) => sum + (Array.isArray(project?.tasks) ? project.tasks : [])
                .filter((task) => {
                    if (text(task?.assigneeUserId) !== currentUser || text(task?.status || '') === 'done') return false;
                    const dueMs = Number.isFinite(Date.parse(text(task?.dueAt || ''))) ? Date.parse(text(task.dueAt)) : null;
                    if (!dueMs || dueMs < Date.now()) return false;
                    return new Date(dueMs).toDateString() === new Date().toDateString();
                }).length, 0);
            const attentionTotal = overdueAssignedCount + dueTodayCount + blockedAssignedCount;
            const scopeChips = [
                ['mine', 'Mine'],
                ['faculty', 'Faculty'],
                ['all', 'All'],
                ['attention', 'Needs attention']
            ];
            const statusPills = [
                ['all', 'All'],
                ['idea', 'Idea'],
                ['active', 'Active'],
                ['review', 'Review'],
                ['completed', 'Done']
            ];
            return `
                <div class="social-neo-stack social-neo-workspace-shell social-neo-workspace-shell--merged">
                    ${renderWorkspaceHero(runtime, projects, {
                        viewMode: 'hub',
                        myProjects,
                        totalTasks,
                        totalActivity,
                        facultyCount: facultyOptions.length,
                        sectionsHtml: `
                            <div class="social-neo-workspace-hub-section social-project-hub-discover">
                                <div class="social-project-hub-search-row">
                                    <label class="social-project-hub-search">
                                        <i class="fas fa-search"></i>
                                        <input class="social-neo-input" type="search" name="projectDiscoverSearch" value="${escape(text(runtime.ui?.projectDiscoverSearch || ''))}" placeholder="Search my projects, course, tags…">
                                    </label>
                                </div>
                                ${attentionTotal ? `
                                    <div class="social-project-hub-attention">
                                        <span class="social-project-hub-attention-copy">
                                            <strong>Needs your work</strong>
                                            ${escape(String(overdueAssignedCount))} overdue · ${escape(String(dueTodayCount))} due today · ${escape(String(blockedAssignedCount))} blocked
                                        </span>
                                        <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-hub-scope" data-scope="attention">Show projects →</button>
                                    </div>
                                ` : ''}
                                <div class="social-project-hub-scope" role="tablist" aria-label="Project scope">
                                    ${scopeChips.map(([value, label]) => `
                                        <button class="social-neo-btn ${hubScope === value ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'} social-neo-btn-sm" type="button" data-action="project-hub-scope" data-scope="${escape(value)}" aria-pressed="${hubScope === value ? 'true' : 'false'}">${escape(label)}</button>
                                    `).join('')}
                                </div>
                                <div class="social-project-hub-filterbar">
                                    <div class="social-project-hub-filter-group">
                                        <span class="social-project-hub-filter-label">Status</span>
                                        <div class="social-project-hub-filter-pills">
                                            ${statusPills.map(([value, label]) => `
                                                <button class="social-neo-btn ${hubStatus === value ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'} social-neo-btn-sm" type="button" data-action="project-hub-status" data-status="${escape(value)}">${escape(label)}${value !== 'all' ? ` (${escape(String(hubStatusCounts[value] || 0))})` : ''}</button>
                                            `).join('')}
                                        </div>
                                    </div>
                                    <div class="social-project-hub-filter-group">
                                        <span class="social-project-hub-filter-label">Faculty</span>
                                        <select class="social-neo-select social-neo-select-sm" name="projectDiscoverFaculty" data-lux-picker>
                                            ${hubFacultyOptions.map((code) => `<option value="${escape(code)}" ${discoverFaculty === code ? 'selected' : ''}>${escape(code === 'all' ? 'All faculties' : code)}</option>`).join('')}
                                        </select>
                                    </div>
                                    <div class="social-project-hub-filter-group social-project-hub-filter-group--skills">
                                        <span class="social-project-hub-filter-label">Skills</span>
                                        <div class="social-project-hub-filter-pills">
                                            <button class="social-neo-btn ${!discoverTag ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'} social-neo-btn-sm" type="button" data-action="project-hub-skill" data-tag="">All</button>
                                            ${hubSkillOptions.map((skill) => {
                                                const value = text(skill).toLowerCase();
                                                return `<button class="social-neo-btn ${discoverTag === value ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'} social-neo-btn-sm" type="button" data-action="project-hub-skill" data-tag="${escape(value)}">${escape(skill)}</button>`;
                                            }).join('')}
                                        </div>
                                    </div>
                                </div>
                                <div class="social-project-hub-layout">
                                    <div class="social-project-hub-main">
                                        <div class="social-project-hub-main-head">
                                            <div>
                                                <strong>My projects</strong>
                                                <span>${escape(String(hubProjects.length))} matching</span>
                                            </div>
                                            <div class="social-project-hub-view-toggle" role="group" aria-label="Hub view mode">
                                                <button class="social-neo-btn ${hubViewMode === 'grid' ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'} social-neo-btn-sm" type="button" data-action="project-hub-view" data-view="grid"><i class="fas fa-th-large"></i> Grid</button>
                                                <button class="social-neo-btn ${hubViewMode === 'list' ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'} social-neo-btn-sm" type="button" data-action="project-hub-view" data-view="list"><i class="fas fa-list"></i> List</button>
                                            </div>
                                        </div>
                                        ${hubProjects.length
                                            ? (hubViewMode === 'list'
                                                ? `<div class="social-project-rows social-project-hub-list">${hubProjects.map(renderProjectRow).join('')}</div>`
                                                : `<div class="social-project-hub-grid">${hubProjects.map(renderProjectCard).join('')}<button class="social-project-card-new social-project-hub-cta-tile" type="button" data-action="project-create-open"><span class="social-project-hub-cta-icon"><i class="fas fa-plus"></i></span><strong>New workspace</strong><span class="social-project-hub-cta-copy">Start a project for your course or team</span></button></div>`)
                                            : `<div class="social-neo-empty">No projects match these filters. Try Mine, or create a group project for your course.</div>`}
                                    </div>
                                    <aside class="social-project-hub-rail">
                                        <section class="social-project-hub-rail-card">
                                            <div class="social-neo-section-head">
                                                <div><strong>My Work</strong><span>Tasks assigned to you.</span></div>
                                                <span class="social-neo-pill">${escape(String(myWorkItems.length))}</span>
                                            </div>
                                            ${myWorkItems.length ? `<div class="social-project-hub-my-work social-project-hub-my-work--roomy">${myWorkItems.map((entry) => {
                                                const statusId = text(entry.task?.status || 'todo') === 'backlog' ? 'todo' : text(entry.task?.status || 'todo');
                                                const statusCol = PROJECT_TASK_COLUMNS.find((column) => column.id === statusId);
                                                return `
                                                <button class="social-project-hub-my-work-row ${entry.overdue ? 'is-overdue' : ''}" type="button" data-action="project-hub-open-task" data-project-id="${escape(entry.projectId)}" data-task-id="${escape(text(entry.task?.id))}">
                                                    <span class="social-project-hub-my-work-title">${escape(text(entry.task?.title || 'Task'))}</span>
                                                    <span class="social-project-hub-my-work-meta">
                                                        <em>${escape(text(entry.project?.name || 'Project'))}</em>
                                                        ${statusCol ? `<span class="social-neo-pill">${escape(statusCol.label)}</span>` : ''}
                                                        ${entry.task?.dueAt ? `<span class="${entry.overdue ? 'is-overdue' : ''}">${escape(when(entry.task.dueAt))}</span>` : ''}
                                                        ${entry.overdue ? '<span class="social-project-hub-my-work-flag">Overdue</span>' : ''}
                                                    </span>
                                                </button>`;
                                            }).join('')}</div>` : `<div class="social-neo-empty">No open tasks assigned to you.</div>`}
                                        </section>
                                        ${featuredProjects.length > 1 ? `<section class="social-project-hub-rail-card">
                                            <div class="social-neo-section-head">
                                                <div><strong>Recently active</strong><span>Projects with recent team activity.</span></div>
                                            </div>
                                            <div class="social-project-rows social-project-hub-trending">
                                                ${featuredProjects.slice(0, 5).map(renderProjectRow).join('')}
                                            </div>
                                        </section>` : ''}
                                        <section class="social-project-hub-rail-card">
                                            <div class="social-neo-section-head">
                                                <div><strong>Your load</strong><span>Roles and assigned work.</span></div>
                                            </div>
                                            <div class="social-project-hub-contribution">
                                                <div class="social-project-hub-contribution-stat"><strong>${escape(String(myProjects.length))}</strong><span>My projects</span></div>
                                                <div class="social-project-hub-contribution-stat"><strong>${escape(String(openAssignedCount))}</strong><span>Open tasks</span></div>
                                                <div class="social-project-hub-contribution-stat ${overdueAssignedCount ? 'is-danger' : ''}"><strong>${escape(String(overdueAssignedCount))}</strong><span>Overdue</span></div>
                                            </div>
                                        </section>
                                    </aside>
                                </div>
                            </div>
                        `
                    })}
                </div>
            `;
        }

        const owner = accountById(activeProject?.ownerUserId) || { id: activeProject?.ownerUserId };
        const projectTasks = Array.isArray(activeProject?.tasks) ? activeProject.tasks : [];
        const projectActivity = Array.isArray(activeProject?.activity) ? activeProject.activity : [];
        const memberSummaries = Array.isArray(activeProject?.memberSummaries) ? activeProject.memberSummaries : [];
        const pendingMemberIds = Array.isArray(activeProject?.pendingMemberIds) ? activeProject.pendingMemberIds : [];
        const pendingMembers = pendingMemberIds.map((userId) => ({ userId, role: text(activeProject?.memberRolesByUser?.[userId] || 'member') || 'member' }));
        const taskCounts = activeProject?.taskStatusCounts || {};
        const advisorAccounts = uniqueStrings([text(activeProject?.advisorUserId || ''), ...(Array.isArray(activeProject?.instructorViewerIds) ? activeProject.instructorViewerIds : [])]).filter(Boolean).map((userId) => accountById(userId) || { id: userId });
        const nextOwnerId = text(activeProject?.nextOwnerUserId || '');
        const nextOwner = nextOwnerId ? accountById(nextOwnerId) || { id: nextOwnerId } : null;
        const readinessPercent = countNum(activeProject?.taskCompletionPercent);
        const healthNote = countNum(taskCounts.blocked) > 0 ? `${countNum(taskCounts.blocked)} blocked tasks need attention` : 'Delivery rhythm looks healthy';
        const renderTeamMemberCard = (entry, options = {}) => {
            const pending = Boolean(options?.pending);
            const account = accountById(entry.userId) || { id: entry.userId };
            const role = text(entry.role || 'member') || 'member';
            const online = isAccountOnline(account);
            const facultyCode = text(account?.facultyCode || account?.faculty || entry.facultyCode || '');
            const joinedLabel = text(entry.joinedAt || '') && !pending ? `Joined ${when(entry.joinedAt)}` : '';
            return `
                <article class="social-project-team-row${pending ? ' is-pending' : ''}">
                    <div class="social-project-team-row-main">
                        <span class="social-project-team-row-avatar">
                            ${avatar(account, 'social-neo-avatar-sm')}
                            <span class="social-project-roster-dot ${online ? 'is-online' : ''}" aria-hidden="true"></span>
                        </span>
                        <div class="social-project-team-row-info">
                            <strong>${escape(displayName(account))}</strong>
                            <div class="social-neo-badge-row">
                                ${projectRolePill(role)}
                                ${facultyCode ? `<span class="social-neo-pill">${escape(facultyCode)}</span>` : ''}
                                ${pending ? `<span class="social-neo-pill">Invited</span>` : ''}
                                ${joinedLabel ? `<span class="social-neo-muted">${escape(joinedLabel)}</span>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="social-project-team-row-actions">
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="message-start" data-user-id="${escape(text(account.id))}"><i class="fas fa-paper-plane"></i> Message</button>
                        ${activeProject.isManager && text(entry.userId) !== text(activeProject.ownerUserId || '') ? `
                            ${role !== 'member' ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-icon social-neo-btn-sm" type="button" title="Make member" data-action="project-member-role" data-project-id="${escape(text(activeProject.id))}" data-user-id="${escape(text(entry.userId))}" data-role="member"><i class="fas fa-user"></i></button>` : ''}
                            ${role !== 'advisor' ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-icon social-neo-btn-sm" type="button" title="Promote to advisor" data-action="project-member-role" data-project-id="${escape(text(activeProject.id))}" data-user-id="${escape(text(entry.userId))}" data-role="advisor"><i class="fas fa-user-shield"></i></button>` : ''}
                            ${role !== 'instructor-viewer' ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-icon social-neo-btn-sm" type="button" title="Set instructor viewer" data-action="project-member-role" data-project-id="${escape(text(activeProject.id))}" data-user-id="${escape(text(entry.userId))}" data-role="instructor-viewer"><i class="fas fa-chalkboard-user"></i></button>` : ''}
                            <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-icon social-neo-btn-sm" type="button" title="Remove member" data-action="project-member-remove" data-project-id="${escape(text(activeProject.id))}" data-user-id="${escape(text(entry.userId))}"><i class="fas fa-user-minus"></i></button>
                        ` : ''}
                    </div>
                </article>
            `;
        };
        const renderTaskStatsBar = (tasks, options = {}) => {
            const compact = Boolean(options.compact);
            const list = Array.isArray(tasks) ? tasks : [];
            const total = list.length;
            const now = Date.now();
            const overdue = list.filter((t) => normalizeProjectTaskStatusId(t?.status) !== 'done' && t.dueAt && new Date(t.dueAt).getTime() < now).length;
            const inProgress = list.filter((t) => normalizeProjectTaskStatusId(t?.status) === 'in-progress').length;
            const blocked = list.filter((t) => normalizeProjectTaskStatusId(t?.status) === 'blocked').length;
            const done = list.filter((t) => normalizeProjectTaskStatusId(t?.status) === 'done').length;
            const taskById = options.taskById instanceof Map
                ? options.taskById
                : new Map(list.filter((t) => t && text(t?.id)).map((t) => [text(t.id), t]));
            const ready = list.filter((t) => {
                if (normalizeProjectTaskStatusId(t?.status) === 'done') return false;
                return resolveDeskTaskReadiness(t, taskById).kind === 'ready';
            }).length;
            const statsClass = compact ? 'social-project-task-stats-inline' : 'social-project-task-stats-bar';
            const stats = `
                    <div class="${statsClass}" role="group" aria-label="Task summary">
                        <div class="social-project-task-stat"><strong>${escape(String(total))}</strong><span>Total</span></div>
                        <div class="social-project-task-stat ${overdue > 0 ? 'is-danger' : ''}"><strong>${escape(String(overdue))}</strong><span>Overdue</span></div>
                        <div class="social-project-task-stat"><strong>${escape(String(inProgress))}</strong><span>Active</span></div>
                        <div class="social-project-task-stat"><strong>${escape(String(blocked))}</strong><span>Blocked</span></div>
                        <div class="social-project-task-stat"><strong>${escape(String(done))}</strong><span>Done</span></div>
                        <div class="social-project-task-stat ${ready > 0 ? 'is-ready' : ''}"><strong>${escape(String(ready))}</strong><span>Ready</span></div>
                    </div>
            `;
            if (compact) return stats;
            return `
                <section class="social-neo-card social-project-task-stats-card">
                    <div class="social-neo-section-head">
                        <div><strong>Task summary</strong><span>Total, overdue, and status counts.</span></div>
                        <span class="social-neo-pill">${escape(String(total))} tasks</span>
                    </div>
                    ${stats}
                </section>
            `;
        };
        const renderTaskSearchBar = () => {
            const searchVal = text(runtime.ui?.projectTaskSearch || '');
            const priorityVal = text(runtime.ui?.projectTaskFilterPriority || 'all');
            const assigneeVal = text(runtime.ui?.projectTaskFilterAssignee || 'all');
            return `
                <div class="social-project-task-search spt-desk-query" role="search" aria-label="Filter tasks">
                    <div class="spt-desk-query-label">Filters</div>
                    <div class="social-project-task-search-row">
                        <div class="social-project-task-search-input">
                            <i class="fas fa-search" aria-hidden="true"></i>
                            <input class="social-neo-input" type="search" name="projectTaskSearch" value="${escape(searchVal)}" placeholder="Search tasks…" autocomplete="off">
                        </div>
                        <select class="social-neo-select social-neo-select-sm" name="projectTaskFilterPriority" data-lux-picker aria-label="Priority">
                            <option value="all" ${priorityVal === 'all' ? 'selected' : ''}>Any priority</option>
                            ${['low','medium','high','urgent'].map((p) => `<option value="${escape(p)}" ${priorityVal === p ? 'selected' : ''}>${escape(p)}</option>`).join('')}
                        </select>
                        <select class="social-neo-select social-neo-select-sm" name="projectTaskFilterAssignee" data-lux-picker aria-label="Assignee">
                            <option value="all" ${assigneeVal === 'all' ? 'selected' : ''}>Anyone</option>
                            ${memberSummaries.map((entry) => `<option value="${escape(text(entry.userId))}" ${assigneeVal === text(entry.userId) ? 'selected' : ''}>${escape(displayName(accountById(entry.userId) || { id: entry.userId }))}</option>`).join('')}
                        </select>
                    </div>
                </div>
            `;
        };
        const renderOverviewTab = () => `
            <section class="social-project-overview-columns social-project-overview-columns--2">
                <div class="social-project-overview-col social-project-overview-col--work">
                    <div class="social-project-overview-slot social-project-ov-order-1">${renderMyTasks(activeProject)}</div>
                    <div class="social-project-overview-slot social-project-ov-order-2">${renderHealthIndicator(activeProject)}</div>
                    <div class="social-project-overview-slot social-project-ov-order-2b">${renderProjectPlanVsBaselineStrip(activeProject)}</div>
                    <div class="social-project-overview-slot social-project-ov-order-2c">${renderProjectProgressHoursStrip(activeProject)}</div>
                    <div class="social-project-overview-slot social-project-ov-order-3">${renderTaskDependencyGraphPreview(activeProject, runtime)}</div>
                    <div class="social-project-overview-slot social-project-ov-order-6">${renderTaskStatusChart(activeProject)}</div>
                    <div class="social-project-overview-slot social-project-ov-order-11">
                        <details class="social-neo-card social-project-rich-panel social-project-brief-card--trimmed social-project-overview-brief">
                            <summary class="social-project-overview-brief-summary">
                                <div class="social-neo-section-head">
                                    <div><strong>Workspace brief</strong><span>Project scope and advising.</span></div>
                                    <span class="social-neo-pill">${escape(text(statusMeta[text(activeProject.status || 'idea')]?.label || activeProject.status || 'idea'))}</span>
                                </div>
                                <i class="fas fa-chevron-down social-project-overview-brief-chevron" aria-hidden="true"></i>
                            </summary>
                            <div class="social-project-overview-slot__scroll social-project-overview-brief-body">
                                <p class="social-project-body-copy">${escape(text(activeProject.description || activeProject.summary || 'No description added yet.'))}</p>
                                <div class="social-project-brief-advisor">
                                    <span class="social-neo-label">Advisor / viewers</span>
                                    <div class="social-neo-badge-row">
                                        ${advisorAccounts.length ? advisorAccounts.map((account) => `<span class="social-neo-pill">${escape(displayName(account))}</span>`).join('') : '<span class="social-neo-muted">No advisor assigned yet.</span>'}
                                    </div>
                                </div>
                            </div>
                        </details>
                    </div>
                    <div class="social-project-overview-slot social-project-overview-slot--actions social-project-ov-order-10 social-project-ov-quick-actions-wrap--compact">${renderQuickActions(activeProject, { compact: true, limit: 4 })}</div>
                </div>
                <div class="social-project-overview-col social-project-overview-col--team">
                    <div class="social-project-overview-slot social-project-ov-order-4">${renderTeamRoster(activeProject, memberSummaries)}</div>
                    <div class="social-project-overview-slot social-project-ov-order-8">${renderWorkloadChart(activeProject)}</div>
                    <div class="social-project-overview-slot social-project-ov-order-5">${renderActivityFeed(activeProject)}</div>
                </div>
            </section>
        `;
        const facultyMix = Array.isArray(activeProject?.facultyMix) ? activeProject.facultyMix : [];
        const roleMix = Array.isArray(activeProject?.roleMix) ? activeProject.roleMix : [];
        const renderTeamWorkloadAside = () => {
            const list = Array.isArray(activeProject?.workloadByMember) ? activeProject.workloadByMember.slice(0, 6) : [];
            if (!list.length) return `<div class="social-neo-empty">No assigned workload yet.</div>`;
            const maxHours = Math.max(1, ...list.map((entry) => Number(entry?.hours) || 0));
            return `<div class="social-project-workload-list social-project-team-aside-workload">${list.map((entry) => {
                const account = accountById(entry.userId) || { id: entry.userId };
                const hours = Number(entry?.hours) || 0;
                const width = (hours / maxHours) * 100;
                return `
                    <article class="social-project-workload-item">
                        <div class="social-project-workload-head">
                            <strong>${escape(displayName(account))}</strong>
                            <em>${escape(String(countNum(entry.count)))} open · ${escape(formatProjectScheduleHours(hours))}</em>
                        </div>
                        <div class="social-project-workload-bar"><span style="width:${width}%"></span></div>
                    </article>
                `;
            }).join('')}</div>`;
        };
        const renderTeamTab = () => {
            const workloadList = Array.isArray(activeProject?.workloadByMember) ? activeProject.workloadByMember : [];
            const hasWorkload = workloadList.some((entry) => countNum(entry?.count) > 0);
            const useTeamAside = memberSummaries.length > 3;
            const showInlineWorkload = hasWorkload && !useTeamAside;
            const leaveNote = text(activeProject.role || '') === 'owner'
                ? (nextOwner ? `If you leave now, ownership transfers to ${displayName(nextOwner)}.` : 'If you leave now and nobody remains, this workspace becomes ownerless but stays intact.')
                : 'Leave the team without deleting chat, tasks, or activity history.';
            return `
            <section class="social-neo-card social-project-team-shell social-project-team-layout">
                <header class="social-project-team-toolbar">
                    <div class="social-project-team-toolbar-stats">
                        <span class="social-neo-pill"><strong>${escape(String(activeProject?.memberCount || 0))}</strong> members</span>
                        ${facultyMix.map((entry) => `<span class="social-neo-pill">${escape(text(entry.facultyCode || 'Unknown'))} · ${escape(String(entry.count || 0))}</span>`).join('')}
                        ${roleMix.map((entry) => `<span class="social-neo-pill">${escape(roleLabels[text(entry.role)] || text(entry.role))} · ${escape(String(entry.count || 0))}</span>`).join('')}
                        ${pendingMembers.length ? `<span class="social-neo-pill">${escape(String(pendingMembers.length))} pending</span>` : ''}
                    </div>
                    ${activeProject.isManager ? `
                        <div class="social-project-team-toolbar-actions">
                            <button class="social-neo-btn social-neo-btn-primary social-neo-btn-sm" type="button" data-action="project-team-invite-toggle"><i class="fas fa-user-plus"></i> Invite</button>
                        </div>
                    ` : ''}
                </header>
                <div class="social-project-team-body${useTeamAside ? ' has-team-aside' : ''}">
                    <main class="social-project-team-main">
                        ${pendingMembers.length ? `
                            <section class="social-project-team-pending">
                                <div class="social-project-team-pending-head">
                                    <strong>Pending invites</strong>
                                    <span class="social-neo-pill">${escape(String(pendingMembers.length))}</span>
                                </div>
                                <div class="social-project-team-rows">${pendingMembers.map((entry) => renderTeamMemberCard(entry, { pending: true })).join('')}</div>
                            </section>
                        ` : ''}
                        <section class="social-project-team-active">
                            <div class="social-project-team-rows">${memberSummaries.length ? memberSummaries.map((entry) => renderTeamMemberCard(entry)).join('') : `<div class="social-neo-empty">No team members yet.</div>`}</div>
                        </section>
                        ${showInlineWorkload ? `
                            <section class="social-project-team-workload-inline">
                                <strong>Workload</strong>
                                ${renderTeamWorkloadAside()}
                            </section>
                        ` : ''}
                    </main>
                    ${useTeamAside ? `
                        <aside class="social-project-team-aside">
                            <div class="social-project-team-aside-block">
                                <strong>Workload</strong>
                                ${renderTeamWorkloadAside()}
                            </div>
                        </aside>
                    ` : ''}
                </div>
                ${activeProject.isManager ? `
                    <details class="social-project-team-invite is-toolbar-driven">
                        <summary class="social-project-team-invite-summary">Invite members</summary>
                        <div class="social-project-team-invite-body">
                            <div class="social-neo-directory-filters">
                                <input class="social-neo-input" type="search" name="projectInviteSearch" value="${escape(text(runtime.ui?.projectInviteSearch || ''))}" placeholder="Search by name, faculty, role, or interests">
                                <select class="social-neo-select" name="projectInviteFaculty" data-lux-picker>
                                    <option value="all" ${inviteFaculty === 'all' ? 'selected' : ''}>All faculties</option>
                                    ${facultyOptions.map((facultyCode) => `<option value="${escape(facultyCode)}" ${inviteFaculty === facultyCode ? 'selected' : ''}>${escape(facultyCode)}</option>`).join('')}
                                </select>
                            </div>
                            ${scrollList('social-project-scroll-list--invite', `
                            <div class="social-neo-stack social-neo-stack-mt-14">
                                ${filteredInviteCandidates.length ? filteredInviteCandidates.map((account) => `
                                    <article class="social-neo-card social-project-invite-row">
                                        <div class="social-neo-person">
                                            ${avatar(account)}
                                            <div>
                                                <strong>${escape(displayName(account))}</strong>
                                                <span>${escape(accountSubtitle(account))}</span>
                                            </div>
                                        </div>
                                        <div class="social-project-team-actions">
                                            <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-member-invite" data-project-id="${escape(text(activeProject.id))}" data-user-id="${escape(text(account.id))}" data-role="member">Invite member</button>
                                            ${isStaffAccount(account) ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-member-invite" data-project-id="${escape(text(activeProject.id))}" data-user-id="${escape(text(account.id))}" data-role="advisor">Promote to advisor</button>` : ''}
                                            ${isStaffAccount(account) ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-member-invite" data-project-id="${escape(text(activeProject.id))}" data-user-id="${escape(text(account.id))}" data-role="instructor-viewer">Set instructor viewer</button>` : ''}
                                        </div>
                                    </article>
                                `).join('') : `<div class="social-neo-empty">No invite candidates match the current filters.</div>`}
                            </div>
                            `)}
                        </div>
                    </details>
                ` : ''}
                <footer class="social-project-team-footer">
                    <div class="social-project-team-footer-copy">
                        ${nextOwner ? `<span class="social-neo-pill">Next owner: ${escape(displayName(nextOwner))}</span>` : ''}
                        <p class="social-neo-muted">${escape(leaveNote)}</p>
                    </div>
                    <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-leave-open" data-project-id="${escape(text(activeProject.id))}"><i class="fas fa-sign-out-alt"></i> Leave workspace</button>
                </footer>
            </section>
        `;
        };
        const renderTasksTab = () => {
            // Focus rail owns My / Overdue — drop legacy toolbar flags so they cannot ghost-filter.
            if (runtime.ui) {
                runtime.ui.projectTaskMyOnly = false;
                runtime.ui.projectTaskFilterOverdue = false;
            }
            const baseFiltered = filterProjectBoardTasks(runtime, projectTasks);
            const rawView = text(runtime.ui?.projectTaskViewMode || 'desk').toLowerCase();
            const taskViewMode = rawView === 'board'
                ? 'desk'
                : (['desk', 'list', 'graph'].includes(rawView) ? rawView : 'desk');
            const projectId = text(activeProject.id);
            const canContribute = Boolean(activeProject.viewerCanContribute);
            const userId = currentUserId();
            const nowMs = Date.now();
            const weekMs = nowMs + 7 * 86400000;
            const twoWeekMs = nowMs + 14 * 86400000;
            const timeWindowRaw = text(runtime.ui?.projectTaskTimeWindow || 'all').toLowerCase();
            const timeWindow = ['all', 'week', '2weeks'].includes(timeWindowRaw) ? timeWindowRaw : 'all';
            const normalizeStatus = (task) => {
                const status = text(task?.status || 'todo') || 'todo';
                return status === 'backlog' ? 'todo' : status;
            };
            // Default All so tasks never look "missing"; user can switch to Ready.
            const focus = text(runtime.ui?.projectTaskFocus || '') || 'all';
            const projectTaskById = new Map(
                (Array.isArray(activeProject?.tasks) ? activeProject.tasks : [])
                    .filter((task) => task && text(task?.id))
                    .map((task) => [text(task.id), task])
            );
            const isTaskReadyForDesk = (task) => {
                if (normalizeStatus(task) === 'done') return false;
                return resolveDeskTaskReadiness(task, projectTaskById).kind === 'ready';
            };
            const deskSchedule = computeProjectSchedule(activeProject);
            const scheduleByIdEarly = deskSchedule?.byId || {};
            const isDeskCritical = (task) => {
                if (normalizeStatus(task) === 'done') return false;
                const row = scheduleByIdEarly[text(task?.id)];
                return Boolean(row?.isCritical) && Number(row?.durationHours) > 0;
            };
            const applyFocus = (tasks) => {
                if (focus === 'mine') {
                    const mine = tasks.filter((task) => text(task?.assigneeUserId) === userId && normalizeStatus(task) !== 'done');
                    return [...mine].sort((a, b) => {
                        const ra = isTaskReadyForDesk(a) ? 0 : 1;
                        const rb = isTaskReadyForDesk(b) ? 0 : 1;
                        return ra - rb;
                    });
                }
                if (focus === 'overdue') {
                    return tasks.filter((task) => {
                        if (normalizeStatus(task) === 'done') return false;
                        const dueMs = Number.isFinite(Date.parse(text(task?.dueAt || ''))) ? Date.parse(text(task.dueAt)) : null;
                        return Boolean(dueMs && dueMs < nowMs);
                    });
                }
                if (focus === 'blocked') {
                    return tasks.filter((task) => normalizeStatus(task) === 'blocked' || resolveDeskTaskReadiness(task, projectTaskById).kind === 'waiting');
                }
                if (focus === 'ready') {
                    return tasks.filter((task) => isTaskReadyForDesk(task));
                }
                if (focus === 'critical') {
                    return tasks.filter((task) => isDeskCritical(task));
                }
                if (focus === 'unassigned') {
                    return tasks.filter((task) => normalizeStatus(task) !== 'done' && !text(task?.assigneeUserId));
                }
                if (focus === 'week') {
                    return tasks.filter((task) => {
                        if (normalizeStatus(task) === 'done') return false;
                        const dueMs = Number.isFinite(Date.parse(text(task?.dueAt || ''))) ? Date.parse(text(task.dueAt)) : null;
                        return Boolean(dueMs && dueMs >= nowMs && dueMs <= weekMs);
                    });
                }
                return tasks;
            };
                        const applyTimeWindow = (tasks) => {
                if (timeWindow === 'all') return tasks;
                const endMs = timeWindow === '2weeks' ? twoWeekMs : weekMs;
                return tasks.filter((task) => {
                    const dueMs = Number.isFinite(Date.parse(text(task?.dueAt || ''))) ? Date.parse(text(task.dueAt)) : null;
                    const startMs = Number.isFinite(Date.parse(text(task?.startAt || ''))) ? Date.parse(text(task.startAt)) : null;
                    if (dueMs == null && startMs == null) return true;
                    if (dueMs != null && dueMs < nowMs && normalizeStatus(task) !== 'done') return true;
                    if (dueMs != null && dueMs >= nowMs && dueMs <= endMs) return true;
                    if (startMs != null && startMs >= nowMs && startMs <= endMs) return true;
                    if (startMs != null && startMs < nowMs && normalizeStatus(task) !== 'done') return true;
                    return false;
                });
            };
            const windowedTasks = applyTimeWindow(baseFiltered);
            const filteredTasks = applyFocus(windowedTasks);

            const focusCounts = {
                all: windowedTasks.length,
                mine: windowedTasks.filter((task) => text(task?.assigneeUserId) === userId && normalizeStatus(task) !== 'done').length,
                ready: windowedTasks.filter((task) => isTaskReadyForDesk(task)).length,
                critical: windowedTasks.filter((task) => isDeskCritical(task)).length,
                overdue: windowedTasks.filter((task) => {
                    if (normalizeStatus(task) === 'done') return false;
                    const dueMs = Number.isFinite(Date.parse(text(task?.dueAt || ''))) ? Date.parse(text(task.dueAt)) : null;
                    return Boolean(dueMs && dueMs < nowMs);
                }).length,
                blocked: windowedTasks.filter((task) => normalizeStatus(task) === 'blocked' || resolveDeskTaskReadiness(task, projectTaskById).kind === 'waiting').length,
                unassigned: windowedTasks.filter((task) => normalizeStatus(task) !== 'done' && !text(task?.assigneeUserId)).length,
                week: windowedTasks.filter((task) => {
                    if (normalizeStatus(task) === 'done') return false;
                    const dueMs = Number.isFinite(Date.parse(text(task?.dueAt || ''))) ? Date.parse(text(task.dueAt)) : null;
                    return Boolean(dueMs && dueMs >= nowMs && dueMs <= weekMs);
                }).length
            };
            const donePctPlan = (() => {
                const all = Array.isArray(activeProject?.tasks) ? activeProject.tasks : [];
                if (!all.length) return 0;
                const done = all.filter((task) => normalizeStatus(task) === 'done').length;
                return Math.round((done / all.length) * 100);
            })();
            const viewToggle = `
                <div class="social-project-task-view-toggle" role="group" aria-label="Task view mode">
                    ${[
                        ['desk', 'Desk', 'fa-layer-group'],
                        ['list', 'List', 'fa-list'],
                        ['graph', 'Map', 'fa-diagram-project']
                    ].map(([mode, label, icon]) => `
                        <button class="social-neo-btn ${taskViewMode === mode ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'} social-neo-btn-sm" type="button" data-action="project-task-view" data-view="${escape(mode)}" aria-pressed="${taskViewMode === mode ? 'true' : 'false'}">
                            <i class="fas ${escape(icon)}" aria-hidden="true"></i> ${escape(label)}
                        </button>
                    `).join('')}
                </div>
            `;
            const savedViews = readDeskSavedViews().filter((view) => {
                const viewProject = text(view.projectId || '');
                return !viewProject || viewProject === projectId;
            });
            const activeViewId = text(runtime.ui?.projectTaskDeskActiveViewId || '');
            const focusChipDefs = [
                ['ready', 'Ready', focusCounts.ready],
                ['mine', 'Mine', focusCounts.mine],
                ...(focusCounts.critical > 0 ? [['critical', 'Critical', focusCounts.critical]] : []),
                ['blocked', 'Blocked', focusCounts.blocked],
                ['overdue', 'Overdue', focusCounts.overdue],
                ['week', 'Due 7d', focusCounts.week],
                ['all', 'All', focusCounts.all]
            ];
            const planHealthHtml = `
                <div class="spt-desk-plan-health" role="group" aria-label="Plan health">
                    <span class="spt-desk-plan-health-kicker">Plan health</span>
                    ${(() => {
                        const deskSched = computeProjectSchedule(activeProject);
                        const endH = Number(deskSched.projectEndHours) || 0;
                        const critN = (deskSched.criticalChain || []).length;
                        const startAt = text(activeProject?.scheduleStartAt || '');
                        const endDate = startAt ? formatProjectScheduleDate(startAt, endH) : '';
                        const line = endH > 0
                            ? `Shortest finish ${formatProjectScheduleHours(endH)}${endDate ? ` · plan end ${endDate}` : ''} · ${critN} critical`
                            : (focusCounts.critical
                                ? `${focusCounts.critical} critical · add estimates for finish length`
                                : 'Add estimates + arrows to unlock critical path');
                        return `<p class="spt-desk-plan-health-schedule social-neo-muted" title="From forward / backward pass over dependencies">${escape(line)}</p>`;
                    })()}
                    <div class="spt-desk-plan-health-grid">
                        <button type="button" class="spt-desk-plan-health-card" data-action="project-task-focus" data-focus="all" title="All tasks">
                            <strong>${donePctPlan}%</strong><span>Done</span>
                        </button>
                        <button type="button" class="spt-desk-plan-health-card${focusCounts.critical ? ' is-warn' : ''}" data-action="project-task-focus" data-focus="${focusCounts.critical ? 'critical' : 'all'}" title="${focusCounts.critical ? 'Open critical tasks' : 'Add time estimates to unlock critical path'}">
                            <strong>${focusCounts.critical ? focusCounts.critical : '—'}</strong><span>Critical</span>
                        </button>
                        <button type="button" class="spt-desk-plan-health-card${focusCounts.unassigned ? ' is-warn' : ''}" data-action="project-task-focus" data-focus="unassigned" title="Tasks without an owner">
                            <strong>${focusCounts.unassigned}</strong><span>No owner</span>
                        </button>
                        <button type="button" class="spt-desk-plan-health-card${focusCounts.overdue ? ' is-danger' : ''}" data-action="project-task-focus" data-focus="overdue" title="Overdue tasks">
                            <strong>${focusCounts.overdue}</strong><span>Overdue</span>
                        </button>
                    </div>
                </div>
            `;
            const focusStrip = `
                ${planHealthHtml}
                <div class="spt-desk-toolbar spt-desk-toolbar--lms">
                    <div class="spt-desk-focus" role="tablist" aria-label="Focus">
                        <div class="spt-desk-focus-track">
                            ${focusChipDefs.map(([id, label, count]) => `
                                <button type="button" role="tab" aria-selected="${focus === id ? 'true' : 'false'}" class="spt-desk-focus-chip${focus === id ? ' is-active' : ''}" data-action="project-task-focus" data-focus="${escape(id)}">
                                    <strong>${escape(label)}</strong>
                                    <span>${count}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    <details class="spt-desk-more-filters">
                        <summary class="spt-desk-more-filters-sum">Filters</summary>
                        <div class="spt-desk-more-filters-panel">
                            <div class="spt-desk-window" role="group" aria-label="Time window">
                                <span class="spt-desk-focus-label">Window</span>
                                <div class="spt-desk-focus-track">
                                    ${[
                                        ['all', 'All'],
                                        ['week', 'This week'],
                                        ['2weeks', '2 weeks']
                                    ].map(([id, label]) => `
                                        <button type="button" class="spt-desk-focus-chip ${timeWindow === id ? 'is-active' : ''}" data-action="project-task-time-window" data-window="${escape(id)}" aria-pressed="${timeWindow === id ? 'true' : 'false'}">
                                            <strong>${escape(label)}</strong>
                                        </button>
                                    `).join('')}
                                </div>
                            </div>
                            <div class="spt-desk-views" aria-label="Saved views">
                                <span class="spt-desk-focus-label">Views</span>
                                <div class="spt-desk-views-row">
                                    <select class="social-neo-select social-neo-select-sm spt-desk-views-select" name="projectTaskDeskView" data-lux-picker aria-label="Load saved view">
                                        <option value="">${savedViews.length ? 'Load view…' : 'No saved views'}</option>
                                        ${savedViews.map((view) => `
                                            <option value="${escape(text(view.id))}" ${activeViewId === text(view.id) ? 'selected' : ''}>${escape(text(view.name))}</option>
                                        `).join('')}
                                    </select>
                                    <button type="button" class="spt-desk-views-save" data-action="project-task-desk-view-save" title="Save current focus, window, and filters">Save</button>
                                    ${activeViewId ? `<button type="button" class="spt-desk-views-delete" data-action="project-task-desk-view-delete" data-view-id="${escape(activeViewId)}" title="Delete active view">Delete</button>` : ''}
                                </div>
                            </div>
                        </div>
                    </details>
                </div>
            `;
            const deskBody = (() => {
                const groups = getProjectTaskGraphGroups(runtime, projectId);
                const collapsed = new Set(
                    (Array.isArray(runtime.ui?.projectTaskDeskCollapsedPackages) ? runtime.ui.projectTaskDeskCollapsedPackages : [])
                        .map((id) => text(id))
                        .filter(Boolean)
                );
                const collapsedTree = new Set(
                    (Array.isArray(runtime.ui?.projectTaskDeskCollapsedTreeIds) ? runtime.ui.projectTaskDeskCollapsedTreeIds : [])
                        .map((id) => text(id))
                        .filter(Boolean)
                );
                const taskById = new Map(filteredTasks.map((task) => [text(task?.id), task]));
                const schedule = computeProjectSchedule(activeProject);
                const scheduleById = schedule?.byId || {};
                const expandedTaskId = text(runtime.ui?.projectTaskDeskExpandedTaskId || '');
                const deskLinkState = runtime.ui?.projectTaskDeskLink && typeof runtime.ui.projectTaskDeskLink === 'object'
                    ? runtime.ui.projectTaskDeskLink
                    : null;
                const deskCardOpts = {
                    allTasks: Array.isArray(activeProject?.tasks) ? activeProject.tasks : projectTasks,
                    taskById: projectTaskById,
                    scheduleById,
                    expandedTaskId,
                    currency: text(activeProject?.budgetCurrency || 'USD') || 'USD',
                    deskLink: deskLinkState,
                    collapsedTree
                };
                const placed = new Set();
                const sections = [];
                groups.forEach((group) => {
                    const gid = text(group?.id);
                    if (!gid) return;
                    const memberIds = (Array.isArray(group?.memberTaskIds) ? group.memberTaskIds : []).map((id) => text(id)).filter(Boolean);
                    const sectionTasks = memberIds.map((id) => taskById.get(id)).filter(Boolean);
                    sectionTasks.forEach((task) => placed.add(text(task.id)));
                    const roll = computeProjectTaskGraphGroupRollup(group, activeProject);
                    const ordered = orderDeskTasksByDependency(sectionTasks, deskCardOpts.allTasks);
                    const forest = buildDeskTaskForest(sectionTasks, deskCardOpts.allTasks);
                    const readyCount = sectionTasks.filter((task) => isTaskReadyForDesk(task)).length;
                    const waitingCount = sectionTasks.filter((task) => resolveDeskTaskReadiness(task, projectTaskById).kind === 'waiting').length;
                    const criticalCount = sectionTasks.filter((task) => {
                        const row = scheduleById[text(task?.id)];
                        return Boolean(row?.isCritical) && Number(row?.durationHours) > 0 && normalizeStatus(task) !== 'done';
                    }).length;
                    const unassignedCount = sectionTasks.filter((task) => !text(task?.assigneeUserId) && normalizeStatus(task) !== 'done').length;
                    const overdueCount = sectionTasks.filter((task) => {
                        if (normalizeStatus(task) === 'done') return false;
                        const dueMs = Number.isFinite(Date.parse(text(task?.dueAt || ''))) ? Date.parse(text(task.dueAt)) : null;
                        return Boolean(dueMs && dueMs < nowMs);
                    }).length;
                    const blockedStatusCount = sectionTasks.filter((task) => normalizeStatus(task) === 'blocked').length;
                    const riskCount = (Array.isArray(activeProject?.risks) ? activeProject.risks : [])
                        .filter((risk) => text(risk?.groupId || '') === gid).length;
                    sections.push({
                        id: gid,
                        name: text(group?.name || 'Work package'),
                        kind: 'package',
                        tasks: sectionTasks,
                        ordered,
                        forest,
                        pct: Math.max(0, Math.min(100, Number(roll.pctComplete) || 0)),
                        openCount: sectionTasks.filter((task) => normalizeStatus(task) !== 'done').length,
                        readyCount,
                        waitingCount,
                        criticalCount,
                        unassignedCount,
                        overdueCount,
                        blockedStatusCount,
                        riskCount,
                        budget: Number(roll.budget) || 0,
                        currency: text(roll.currency || activeProject?.budgetCurrency || 'USD') || 'USD',
                        hoursTotal: Number(roll.hoursTotal) || 0,
                        hoursDone: Number(roll.hoursDone) || 0,
                        progressMode: text(roll.progressMode || 'count') || 'count',
                        wiredCount: Number(roll.count) || sectionTasks.length,
                        directCount: Number(roll.directCount) || sectionTasks.length
                    });
                });
                const ungrouped = filteredTasks.filter((task) => !placed.has(text(task?.id)));
                const ungroupedOrdered = orderDeskTasksByDependency(ungrouped, deskCardOpts.allTasks);
                const ungroupedForest = buildDeskTaskForest(ungrouped, deskCardOpts.allTasks);
                sections.push({
                    id: '__ungrouped__',
                    name: 'Unscoped',
                    kind: 'ungrouped',
                    tasks: ungrouped,
                    ordered: ungroupedOrdered,
                    forest: ungroupedForest,
                    pct: ungrouped.length
                        ? Math.round((ungrouped.filter((task) => normalizeStatus(task) === 'done').length / ungrouped.length) * 100)
                        : 0,
                    openCount: ungrouped.filter((task) => normalizeStatus(task) !== 'done').length,
                    readyCount: ungrouped.filter((task) => isTaskReadyForDesk(task)).length,
                    waitingCount: ungrouped.filter((task) => resolveDeskTaskReadiness(task, projectTaskById).kind === 'waiting').length,
                    criticalCount: ungrouped.filter((task) => {
                        const row = scheduleById[text(task?.id)];
                        return Boolean(row?.isCritical) && Number(row?.durationHours) > 0 && normalizeStatus(task) !== 'done';
                    }).length,
                    unassignedCount: ungrouped.filter((task) => !text(task?.assigneeUserId) && normalizeStatus(task) !== 'done').length,
                    overdueCount: ungrouped.filter((task) => {
                        if (normalizeStatus(task) === 'done') return false;
                        const dueMs = Number.isFinite(Date.parse(text(task?.dueAt || ''))) ? Date.parse(text(task.dueAt)) : null;
                        return Boolean(dueMs && dueMs < nowMs);
                    }).length,
                    blockedStatusCount: ungrouped.filter((task) => normalizeStatus(task) === 'blocked').length,
                    riskCount: 0,
                    budget: 0,
                    currency: text(activeProject?.budgetCurrency || 'USD') || 'USD',
                    hoursTotal: 0,
                    hoursDone: 0,
                    progressMode: 'count',
                    wiredCount: ungrouped.length,
                    directCount: ungrouped.length
                });
                const visibleSections = sections.filter((section) => section.tasks.length > 0 || (section.kind === 'package' && groups.length));
                // taskId → package names (for expand + queue context)
                const packageNamesByTaskId = new Map();
                groups.forEach((group) => {
                    const gname = text(group?.name || 'Work package');
                    (Array.isArray(group?.memberTaskIds) ? group.memberTaskIds : []).forEach((tid) => {
                        const id = text(tid);
                        if (!id) return;
                        const list = packageNamesByTaskId.get(id) || [];
                        if (!list.includes(gname)) list.push(gname);
                        packageNamesByTaskId.set(id, list);
                    });
                });
                deskCardOpts.packageNamesByTaskId = packageNamesByTaskId;

                const allOpenFiltered = filteredTasks.filter((task) => normalizeStatus(task) !== 'done');
                const readyN = allOpenFiltered.filter((task) => isTaskReadyForDesk(task)).length;
                const waitingN = allOpenFiltered.filter((task) => resolveDeskTaskReadiness(task, projectTaskById).kind === 'waiting').length;
                const criticalN = allOpenFiltered.filter((task) => {
                    const row = scheduleById[text(task?.id)];
                    return Boolean(row?.isCritical) && Number(row?.durationHours) > 0;
                }).length;
                const unassignedN = allOpenFiltered.filter((task) => !text(task?.assigneeUserId)).length;
                const overdueN = allOpenFiltered.filter((task) => {
                    const dueMs = Number.isFinite(Date.parse(text(task?.dueAt || ''))) ? Date.parse(text(task.dueAt)) : null;
                    return Boolean(dueMs && dueMs < nowMs);
                }).length;
                const noEstN = allOpenFiltered.filter((task) => {
                    if (task?.isMilestone) return false;
                    const est = resolveTaskScheduleEstimate(task);
                    return !(est && Number(est.estimate) > 0);
                }).length;
                const openBudget = allOpenFiltered.reduce((sum, task) => sum + (Number(task?.budgetEstimate) || 0), 0);
                const openBudgetLabel = openBudget > 0
                    ? formatProjectTaskBudgetEstimate(openBudget, deskCardOpts.currency)
                    : '';
                // Earliest critical/open due as finish risk signal
                let finishRiskLabel = '';
                const dueCandidates = allOpenFiltered
                    .map((task) => {
                        const dueMs = Number.isFinite(Date.parse(text(task?.dueAt || ''))) ? Date.parse(text(task.dueAt)) : null;
                        return dueMs ? { task, dueMs } : null;
                    })
                    .filter(Boolean)
                    .sort((a, b) => a.dueMs - b.dueMs);
                if (dueCandidates.length) {
                    const top = dueCandidates[0];
                    finishRiskLabel = when(top.task.dueAt);
                }

                const deskSummaryHtml = '';

                const hygieneBits = [];
                const hygieneHidden = new Set(
                    (Array.isArray(runtime.ui?.projectTaskDeskHygieneHidden) ? runtime.ui.projectTaskDeskHygieneHidden : [])
                        .map((id) => text(id))
                        .filter(Boolean)
                );
                const hygieneDismissed = hygieneHidden.has('desk-alert');
                if (!hygieneDismissed) {
                    if (overdueN > 0) hygieneBits.push(`<button type="button" class="spt-desk-hygiene-pill is-danger" data-action="project-task-focus" data-focus="overdue"><i class="fas fa-clock" aria-hidden="true"></i>${overdueN} overdue</button>`);
                    if (unassignedN > 0) hygieneBits.push(`<button type="button" class="spt-desk-hygiene-pill is-warn" data-action="project-task-focus" data-focus="unassigned"><i class="fas fa-user-slash" aria-hidden="true"></i>${unassignedN} unassigned</button>`);
                }
                const deskHygieneHtml = (filteredTasks.length && hygieneBits.length) ? `
                    <div class="spt-desk-hygiene-bar spt-desk-hygiene-bar--slim" role="status" aria-label="Needs attention">
                        <span class="spt-desk-hygiene-bar-label"><i class="fas fa-triangle-exclamation" aria-hidden="true"></i></span>
                        <div class="spt-desk-hygiene-bar-pills">${hygieneBits.join('')}</div>
                        <button type="button" class="spt-desk-hygiene-dismiss" data-action="project-task-desk-hygiene-dismiss" data-hygiene-id="desk-alert" title="Dismiss" aria-label="Dismiss">×</button>
                    </div>
                ` : '';

                const renderSectionStats = (section) => {
                    const n = section.tasks.length;
                    const open = section.openCount;
                    const done = Math.max(0, n - open);
                    if (!n) return 'Empty';
                    return `${done}/${n} done · ${open} open`;
                };

                const emptyReadyHtml = (focus === 'ready' && !filteredTasks.length && (Array.isArray(activeProject?.tasks) ? activeProject.tasks : []).length)
                    ? `<div class="spt-desk-empty-ready" role="status">
                            <strong>Nothing is ready to start</strong>
                            <span>Finish a parent task, or open All / Map to re-link work.</span>
                            <div class="spt-desk-empty-ready-actions">
                                <button type="button" class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" data-action="project-task-focus" data-focus="all">Show all</button>
                                <button type="button" class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" data-action="project-task-graph-open" data-project-id="${escape(projectId)}">Open map</button>
                            </div>
                        </div>`
                    : '';
                return `
                    <div class="spt-desk spt-desk--v2" data-task-desk="1">
                        ${deskSummaryHtml}
                                                ${emptyReadyHtml}
                        ${deskHygieneHtml}
                        ${(() => {
                            const link = deskLinkState;
                            if (!link || !text(link.taskId) || !canContribute) return '';
                            const linkTask = projectTaskById.get(text(link.taskId))
                                || (Array.isArray(activeProject?.tasks) ? activeProject.tasks : []).find((t) => text(t?.id) === text(link.taskId));
                            const linkTitle = text(linkTask?.title || 'Task');
                            const role = text(link.role || 'child') || 'child';
                            const copy = role === 'parent'
                                ? `Connect mode: click <strong>Child</strong> on a task that should wait on “${escape(linkTitle)}”.`
                                : `Connect mode: click <strong>Parent</strong> on the task that must finish before “${escape(linkTitle)}”.`;
                            return `
                                <div class="spt-desk-link-banner" role="status">
                                    <div class="spt-desk-link-banner-copy">
                                        <i class="fas fa-link" aria-hidden="true"></i>
                                        <span>${copy}</span>
                                    </div>
                                    <div class="spt-desk-link-banner-actions">
                                        <button type="button" class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" data-action="project-task-desk-link-start" data-project-id="${escape(projectId)}" data-task-id="${escape(text(link.taskId))}" data-role="${role === 'parent' ? 'child' : 'parent'}">Switch: pick ${role === 'parent' ? 'parent' : 'child'} first</button>
                                        <button type="button" class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" data-action="project-task-desk-link-cancel">Cancel</button>
                                    </div>
                                </div>
                            `;
                        })()}
                        ${visibleSections.map((section) => {
                            const isCollapsed = collapsed.has(section.id);
                            const showBody = !isCollapsed;
                            const ordered = Array.isArray(section.ordered) ? section.ordered : section.tasks.map((task) => ({ task, depth: 0 }));
                            const budgetLabel = section.budget > 0
                                ? formatProjectTaskBudgetEstimate(section.budget, section.currency)
                                : '';
                            const hoursLeft = Math.max(0, (Number(section.hoursTotal) || 0) - (Number(section.hoursDone) || 0));
                            const subBits = [];
                            if (section.progressMode === 'hours' && section.hoursTotal > 0) {
                                subBits.push(`${Math.round(hoursLeft * 10) / 10}h left`);
                            }
                            if (section.unassignedCount) subBits.push(`${section.unassignedCount} unassigned`);
                            if (section.overdueCount) subBits.push(`${section.overdueCount} overdue`);
                            if (section.kind === 'ungrouped') subBits.push('not on a work package');
                            const lastMs = (section.tasks || []).reduce((max, task) => Math.max(max, taskActivityMs(task)), 0);
                            if (lastMs > 0) {
                                subBits.push(`Updated ${when(new Date(lastMs).toISOString())}`);
                            }
                            // Package health chip
                            let healthId = 'on-track';
                            let healthLabel = 'On track';
                            const openN = Number(section.openCount) || 0;
                            if (section.tasks.length && openN === 0) {
                                healthId = 'done';
                                healthLabel = 'Done';
                            } else if (openN > 0 && ((Number(section.waitingCount) || 0) >= Math.ceil(openN / 2) || (Number(section.blockedStatusCount) || 0) >= Math.ceil(openN / 2))) {
                                healthId = 'blocked';
                                healthLabel = 'At risk';
                            } else if ((Number(section.criticalCount) || 0) > 0 || (Number(section.overdueCount) || 0) > 0 || (Number(section.riskCount) || 0) > 0) {
                                healthId = 'at-risk';
                                healthLabel = 'At risk';
                            }
                            const riskIcon = (section.kind === 'package' && section.riskCount > 0)
                                ? `<button type="button" class="spt-desk-package-risk-icon" data-action="project-risk-open" data-project-id="${escape(projectId)}" data-group-id="${escape(section.id)}" title="${section.riskCount} risk${section.riskCount === 1 ? '' : 's'}" aria-label="Package risks"><i class="fas fa-triangle-exclamation" aria-hidden="true"></i></button>`
                                : '';
                            return `
                                <section class="spt-desk-package is-health-${escape(healthId)} ${section.kind === 'ungrouped' ? 'is-ungrouped' : ''} ${isCollapsed ? 'is-collapsed' : ''} ${section.pct >= 100 && section.tasks.length ? 'is-complete' : ''}" data-package-id="${escape(section.id)}" data-health="${escape(healthId)}">
                                    <header class="spt-desk-package-head">
                                        <button type="button" class="spt-desk-package-toggle" data-action="project-task-desk-toggle-package" data-package-id="${escape(section.id)}" aria-expanded="${showBody ? 'true' : 'false'}" title="${showBody ? 'Collapse' : 'Expand'}">
                                            <i class="fas fa-chevron-${showBody ? 'down' : 'right'}" aria-hidden="true"></i>
                                        </button>
                                        <div class="spt-desk-package-title">
                                            <span class="spt-desk-package-mark" aria-hidden="true"><i class="fas ${section.kind === 'ungrouped' ? 'fa-inbox' : 'fa-layer-group'}"></i></span>
                                            <div class="spt-desk-package-title-copy">
                                                <div class="spt-desk-package-title-row">
                                                    <strong>${escape(section.name)}</strong>
                                                    <span class="spt-desk-health spt-desk-health--${escape(healthId)}">${escape(healthLabel)}</span>
                                                </div>
                                                <span class="spt-desk-package-count">${escape(renderSectionStats(section))}${section.kind === 'ungrouped' ? ' · not in a work package' : ''}</span>
                                            </div>
                                        </div>
                                        <div class="spt-desk-package-side">
                                            ${riskIcon}
                                            ${section.tasks.length ? `<span class="spt-desk-package-pct" title="${section.pct}% complete">${section.pct}%</span>` : ''}
                                            ${canContribute ? `
                                            <button class="spt-desk-add-btn" type="button" data-action="project-task-create-open" data-project-id="${escape(projectId)}" data-package-id="${escape(section.id)}" title="Add task to package">
                                                <i class="fas fa-plus" aria-hidden="true"></i><span>Add</span>
                                            </button>
                                            ` : ''}
                                        </div>
                                    </header>
                                    ${section.tasks.length ? `<div class="spt-desk-package-progress-line" aria-hidden="true"><i style="width:${section.pct}%"></i></div>` : ''}
                                    ${showBody ? `
                                    <div class="spt-desk-package-body">
                                                                                <div class="spt-desk-package-grid spt-desk-tree" role="list">
                                            ${(Array.isArray(section.forest) ? section.forest : []).length
                                                ? renderDeskTaskTreeForest(activeProject, section.forest, { ...deskCardOpts, collapsedTree })
                                                : '<div class="spt-desk-package-empty">No tasks match this focus in this package.</div>'}
                                        </div>
                                    </div>
                                    ` : ''}
                                </section>
                            `;
                        }).join('')}
                    </div>
                `;
            })();

            const listBody = `
                <div class="social-project-task-list-wrap social-project-task-list-wrap--roomy">
                    ${filteredTasks.length ? `
                        <table class="social-project-task-list-table">
                            <thead>
                                <tr>
                                    <th scope="col">Task</th>
                                    <th scope="col">Status</th>
                                    <th scope="col">Priority</th>
                                    <th scope="col">Assignee</th>
                                    <th scope="col">Due</th>
                                    <th scope="col">Deps</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filteredTasks.map((task) => {
                                    const statusId = normalizeStatus(task);
                                    const column = PROJECT_TASK_COLUMNS.find((entry) => entry.id === statusId) || PROJECT_TASK_COLUMNS[0];
                                    const priority = text(task?.priority || 'medium').toLowerCase() || 'medium';
                                    const assignee = accountById(task?.assigneeUserId) || { id: task?.assigneeUserId };
                                    const dueAt = text(task?.dueAt || '');
                                    const dueMs = Number.isFinite(Date.parse(dueAt)) ? Date.parse(dueAt) : null;
                                    const isOverdue = Boolean(dueMs && dueMs < Date.now() && statusId !== 'done');
                                    const blockedByCount = projectTaskDependsOnIds(task).length;
                                    const blocksCount = projectTaskDownstreamIds(task?.id, projectTasks).length;
                                    return `
                                        <tr class="social-project-task-list-row ${isOverdue ? 'is-overdue' : ''}" data-action="project-task-detail-open" data-project-id="${escape(projectId)}" data-task-id="${escape(text(task.id))}" tabindex="0" role="button" aria-label="Open task ${escape(text(task?.title || 'Task'))}">
                                            <td class="social-project-task-list-title"><strong>${escape(text(task?.title || 'Task'))}</strong></td>
                                            <td><span class="social-neo-pill">${escape(column.label)}</span></td>
                                            <td><span class="social-neo-pill social-project-priority-pill" data-priority="${escape(priority)}">${escape(priority)}</span></td>
                                            <td>${task?.assigneeUserId ? escape(displayName(assignee)) : '<span class="social-neo-muted">Unassigned</span>'}</td>
                                            <td class="${isOverdue ? 'is-overdue' : ''}">${dueAt ? escape(when(dueAt)) : '—'}</td>
                                            <td>${blockedByCount || blocksCount
                                                ? `<button class="social-neo-pill social-project-task-deps-chip" type="button" data-action="project-task-graph-open" data-project-id="${escape(projectId)}" data-task-id="${escape(text(task.id))}"><i class="fas fa-link"></i> ${escape(String(blockedByCount))}/${escape(String(blocksCount))}</button>`
                                                : '—'}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    ` : `<div class="social-neo-empty social-project-task-list-empty">No tasks match these filters.</div>`}
                </div>
            `;
            const graphBody = `
                <div class="social-project-task-shell-graph social-project-task-shell-graph--main social-project-task-shell-graph--roomy">
                    <div class="social-project-task-graph-preview-toolbar">
                        <div>
                            <strong>Dependency map</strong>
                            <span>See how work connects. Open the full map to rearrange and link.</span>
                        </div>
                        <button class="social-neo-btn social-neo-btn-primary social-neo-btn-sm" type="button" data-action="project-task-graph-open" data-project-id="${escape(projectId)}">
                            <i class="fas fa-expand"></i> Open full map
                        </button>
                    </div>
                    ${renderTaskDependencyGraphPreview(activeProject, runtime)}
                </div>
            `;
            const body = taskViewMode === 'list' ? listBody : (taskViewMode === 'graph' ? graphBody : deskBody);
            return `
                <section class="social-neo-card social-project-task-shell social-project-task-shell--roomy social-project-task-shell--desk" data-task-view="${escape(taskViewMode)}">
                    <div class="social-project-task-shell-header social-project-task-shell-header--roomy">
                        <div class="social-project-task-shell-heading">
                            <div class="spt-desk-shell-brand">
                                <strong class="social-project-task-shell-title">Work Desk</strong>
                                <span class="social-project-task-shell-subtitle">Work packages &amp; next actions</span>
                            </div>
                        </div>
                        <div class="social-project-task-shell-actions">
                            ${viewToggle}
                            ${canContribute ? `
                                <button class="social-neo-btn social-neo-btn-primary social-project-task-compose-trigger" type="button" data-action="project-task-create-open" data-project-id="${escape(projectId)}">
                                    <i class="fas fa-plus"></i> New task
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    ${taskViewMode === 'graph' ? '' : focusStrip}
                    <div class="social-project-task-shell-filters social-project-task-shell-filters--roomy">
                        ${renderTaskSearchBar()}
                    </div>
                    <div class="social-project-task-shell-body" data-task-body="${escape(taskViewMode)}" data-task-body-root="1">
                        ${body}
                    </div>
                </section>
            `;
        };

        const renderProjectChatLoading = (title, copy) => `
            <section class="social-neo-card social-project-workspace-chat social-project-workspace-chat--loading">
                <div class="social-neo-empty-hero">
                    <i class="fas fa-comments"></i>
                    <strong>${escape(title)}</strong>
                    <span>${escape(copy)}</span>
                </div>
            </section>
        `;
        const renderChatTab = () => {
            if (!hasSocialMessagesModule()) {
                ensureSocialMessagesModule()
                    .then(() => {
                        clearProjectTabPaneCache(text(activeProject.id));
                        queueDeferredModuleRender('messages-module');
                    })
                    .catch(() => null);
                return renderProjectChatLoading('Loading workspace chat', 'Preparing threads, group tools, and call controls.');
            }
            if (!text(activeProject?.groupId || '')) {
                return `<div class="social-project-workspace-chat">${window.renderMessagesThreadShell(null, { emptyCopy: 'Project chat is unavailable — no linked group.' })}</div>`;
            }
            const chat = resolveProjectWorkspaceChat(activeProject);
            if (!chat) {
                const bootstrapKey = text(activeProject.id);
                if (text(runtime.ui?.__projectChatBootstrapping || '') !== bootstrapKey) {
                    runtime.ui.__projectChatBootstrapping = bootstrapKey;
                    ensureProjectWorkspaceChat(activeProject)
                        .then((opened) => {
                            delete runtime.ui.__projectChatBootstrapping;
                            if (!opened?.id) return;
                            setActiveChat(opened.id);
                            clearProjectTabPaneCache(bootstrapKey);
                            renderSocialPageNow('project-chat-ready');
                        })
                        .catch(() => {
                            delete runtime.ui.__projectChatBootstrapping;
                        });
                }
                return renderProjectChatLoading('Preparing workspace chat', 'Opening the backing group chat for this project.');
            }
            if (text(runtime.ui?.activeChatId || '') !== text(chat.id)) {
                setActiveChat(chat.id);
            }
            return `<div class="social-project-workspace-chat">${window.renderMessagesThreadShell(chat)}</div>`;
        };
        const renderActivityTab = () => `
            <section class="social-neo-card social-project-rich-panel">
                <div class="social-neo-section-head">
                    <div><strong>Workspace timeline</strong><span>Every material project update, from tasks to showcase publishing.</span></div>
                </div>
                ${scrollList('social-project-scroll-list--activity', `<div class="social-project-activity-list">${projectActivity.length ? projectActivity.map((entry) => renderActivityItem(entry)).join('') : `<div class="social-neo-empty">No project activity yet.</div>`}</div>`)}
            </section>
        `;
        const formatBudgetMoney = (amount, currency = '') => {
            const value = Number(amount || 0);
            const rounded = Math.round(value * 100) / 100;
            const suffix = currency ? ` ${currency}` : '';
            return `${rounded.toLocaleString(undefined, { maximumFractionDigits: 2 })}${suffix}`;
        };
        const budgetCurrency = text(activeProject?.budgetCurrency || '') || 'USD';
        const budgetSpent = countNum(activeProject?.budgetSpentTotal);
        const budgetPlanned = countNum(activeProject?.budgetPlannedTotal);
        const budgetPending = countNum(activeProject?.budgetPendingTotal);
        const budgetCapValue = countNum(activeProject?.budgetCap);
        const budgetBase = budgetCapValue > 0 ? budgetCapValue : budgetPlanned;
        const budgetRemaining = countNum(activeProject?.budgetRemaining);
        const budgetUtilization = countNum(activeProject?.budgetUtilizationPercent);
        const budgetOverCap = Boolean(activeProject?.budgetOverCap);
        const budgetCategories = Array.isArray(activeProject?.budgetCategories) ? activeProject.budgetCategories : [];
        const budgetExpenses = Array.isArray(activeProject?.budgetExpenses) ? activeProject.budgetExpenses : [];
        const budgetByCategory = Array.isArray(activeProject?.budgetByCategory) ? activeProject.budgetByCategory : [];
        const renderBudgetTab = () => `
            <section class="social-neo-stack">
                <div class="social-project-dashboard-grid">
                    ${renderProgressRing(budgetUtilization, 'Budget used', `${formatBudgetMoney(budgetSpent, budgetCurrency)} of ${formatBudgetMoney(budgetBase, budgetCurrency)}`, '#f97316')}
                    ${renderMetricCard('fa-wallet', 'Spent', formatBudgetMoney(budgetSpent, budgetCurrency), `${formatBudgetMoney(budgetPending, budgetCurrency)} pending`, '#f59336')}
                    ${renderMetricCard('fa-coins', 'Planned', formatBudgetMoney(budgetPlanned, budgetCurrency), `${budgetCategories.length} categories`, '#3b82f6')}
                    ${renderMetricCard(budgetOverCap ? 'fa-triangle-exclamation' : 'fa-bank', 'Cap', formatBudgetMoney(budgetCapValue, budgetCurrency) || 'Not set', budgetOverCap ? 'Over cap' : (budgetCapValue > 0 ? `${formatBudgetMoney(Math.max(0, budgetRemaining), budgetCurrency)} left` : 'No cap set'), budgetOverCap ? '#f43f5e' : '#10b981')}
                </div>
                <div class="social-project-budget-spend-bar">
                    <div class="social-neo-section-head">
                        <div><strong>Spend against plan</strong><span>${escape(String(budgetUtilization))}% of ${escape(budgetCapValue > 0 ? 'cap' : 'planned')} used.</span></div>
                        <span class="social-neo-pill ${budgetOverCap ? 'is-tone-rose' : ''}">${escape(formatBudgetMoney(budgetSpent, budgetCurrency))} / ${escape(formatBudgetMoney(budgetBase, budgetCurrency))}</span>
                    </div>
                    <div class="social-project-deadline-bar"><div class="social-project-deadline-fill ${budgetOverCap ? 'is-overdue' : ''}" style="width:${Math.min(100, budgetUtilization)}%"></div></div>
                </div>
                ${activeProject.isManager ? `
                    <form class="social-neo-card social-project-rich-panel social-neo-stack" data-form="project-budget-settings" data-project-id="${escape(text(activeProject.id))}">
                        <div class="social-neo-section-head">
                            <div><strong>Budget settings</strong><span>Choose the currency and optional spend cap for this workspace.</span></div>
                        </div>
                        <div class="social-neo-grid-2">
                            <label><span class="social-neo-label">Currency</span>
                                <select class="social-neo-select" name="projectBudgetCurrency" data-lux-picker>
                                    <option value="USD" ${budgetCurrency === 'USD' ? 'selected' : ''}>USD — US Dollar</option>
                                    <option value="GEL" ${budgetCurrency === 'GEL' ? 'selected' : ''}>GEL — Georgian Lari</option>
                                </select>
                            </label>
                            <label><span class="social-neo-label">Spend cap (0 = unset)</span><input class="social-neo-input" type="number" min="0" step="0.01" name="projectBudgetCap" value="${escape(String(budgetCapValue || 0))}"></label>
                        </div>
                        <div class="social-neo-inline social-neo-inline-end"><button class="social-neo-btn social-neo-btn-primary" type="submit"><i class="fas fa-check"></i> Save budget settings</button></div>
                    </form>
                ` : ''}
                <section class="social-neo-card social-project-rich-panel">
                    <div class="social-neo-section-head">
                        <div><strong>Budget categories</strong><span>Plan allocation across materials, travel, software, and more.</span></div>
                        <span class="social-neo-pill">${escape(String(budgetCategories.length))} categories</span>
                    </div>
                    ${activeProject.viewerCanContribute ? `
                        <form data-form="project-budget-category-add" data-project-id="${escape(text(activeProject.id))}" class="social-neo-grid-3 social-project-budget-add-row">
                            <label><span class="social-neo-label">Category title</span><input class="social-neo-input" type="text" name="projectBudgetCategoryTitle" placeholder="Materials" required></label>
                            <label><span class="social-neo-label">Planned amount</span><input class="social-neo-input" type="number" min="0" step="0.01" name="projectBudgetCategoryPlanned" placeholder="0.00"></label>
                            <div class="social-neo-inline social-neo-inline-end"><button class="social-neo-btn social-neo-btn-primary" type="submit"><i class="fas fa-plus"></i> Add category</button></div>
                        </form>
                    ` : ''}
                    <div class="social-project-budget-category-list">
                        ${budgetCategories.length ? budgetCategories.map((category) => {
                            const rollup = budgetByCategory.find((entry) => text(entry?.categoryId) === text(category.id)) || { spent: 0, count: 0 };
                            return `
                                <article class="social-project-budget-category-item">
                                    <div class="social-project-budget-category-head">
                                        <div>
                                            <strong>${escape(text(category.title || 'Category'))}</strong>
                                            <span>${escape(text(category.description || ''))}</span>
                                        </div>
                                        <div class="social-neo-badge-row">
                                            <span class="social-neo-pill">Planned ${escape(formatBudgetMoney(category.plannedAmount, budgetCurrency))}</span>
                                            <span class="social-neo-pill is-tone-${rollup.spent > category.plannedAmount ? 'rose' : 'emerald'}">Spent ${escape(formatBudgetMoney(rollup.spent, budgetCurrency))}</span>
                                            <span class="social-neo-pill">${escape(String(rollup.count || 0))} expenses</span>
                                        </div>
                                    </div>
                                    ${activeProject.viewerCanContribute ? `
                                        <div class="social-project-budget-category-actions">
                                            <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-budget-category-edit" data-project-id="${escape(text(activeProject.id))}" data-category-id="${escape(text(category.id))}"><i class="fas fa-pen"></i> Edit</button>
                                            <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-budget-category-delete" data-project-id="${escape(text(activeProject.id))}" data-category-id="${escape(text(category.id))}"><i class="fas fa-trash"></i> Remove</button>
                                        </div>
                                    ` : ''}
                                </article>
                            `;
                        }).join('') : `<div class="social-neo-empty">No budget categories yet. Add one to start planning spend.</div>`}
                    </div>
                </section>
                <section class="social-neo-card social-project-rich-panel">
                    <div class="social-neo-section-head">
                        <div><strong>Expense log</strong><span>Track real spend and submit it for approval.</span></div>
                        <span class="social-neo-pill">${escape(String(budgetExpenses.length))} entries</span>
                    </div>
                    ${activeProject.viewerCanContribute ? `
                        <form data-form="project-budget-expense-add" data-project-id="${escape(text(activeProject.id))}" class="social-neo-stack social-project-budget-expense-add">
                            <div class="social-neo-grid-3">
                                <label><span class="social-neo-label">Expense title</span><input class="social-neo-input" type="text" name="projectBudgetExpenseTitle" placeholder="Bus tickets" required></label>
                                <label><span class="social-neo-label">Amount</span><input class="social-neo-input" type="number" min="0" step="0.01" name="projectBudgetExpenseAmount" placeholder="0.00" required></label>
                                <label><span class="social-neo-label">Category</span>
                                    <select class="social-neo-select" name="projectBudgetExpenseCategoryId" data-lux-picker>
                                        <option value="">Uncategorized</option>
                                        ${budgetCategories.map((category) => `<option value="${escape(text(category.id))}">${escape(text(category.title))}</option>`).join('')}
                                    </select>
                                </label>
                            </div>
                            <div class="social-neo-inline social-neo-inline-end"><button class="social-neo-btn social-neo-btn-primary" type="submit"><i class="fas fa-plus"></i> Log expense</button></div>
                        </form>
                    ` : ''}
                    <div class="social-project-budget-expense-list">
                        ${budgetExpenses.length ? budgetExpenses.map((expense) => {
                            const status = text(expense?.status || 'draft');
                            const statusMeta = {
                                draft: { label: 'Draft', tone: 'slate' },
                                submitted: { label: 'Submitted', tone: 'amber' },
                                approved: { label: 'Approved', tone: 'emerald' },
                                paid: { label: 'Paid', tone: 'emerald' },
                                rejected: { label: 'Rejected', tone: 'rose' }
                            }[status] || { label: status, tone: 'slate' };
                            const category = budgetCategories.find((entry) => text(entry?.id) === text(expense?.categoryId));
                            const canReviewBudget = Boolean(activeProject.isManager || text(activeProject.role || '') === 'advisor');
                            return `
                                <article class="social-project-budget-expense-item">
                                    <div class="social-project-budget-expense-head">
                                        <div>
                                            <strong>${escape(text(expense?.title || 'Expense'))}</strong>
                                            <span>${escape(text(category?.title || 'Uncategorized'))} · ${escape(when(expense?.incurredAt || expense?.createdAt || ''))}</span>
                                        </div>
                                        <div class="social-neo-badge-row">
                                            <span class="social-neo-pill">${escape(formatBudgetMoney(expense?.amount, text(expense?.currency || budgetCurrency)))}</span>
                                            <span class="social-neo-pill is-tone-${escape(statusMeta.tone)}">${escape(statusMeta.label)}</span>
                                        </div>
                                    </div>
                                    ${text(expense?.description) ? `<p class="social-project-budget-expense-note">${escape(text(expense.description))}</p>` : ''}
                                    ${activeProject.viewerCanContribute ? `
                                        <div class="social-project-budget-expense-actions">
                                            ${expense?.submittedById && status === 'draft' ? `<span class="social-neo-muted">Logged by ${escape(displayName(accountById(expense.submittedById) || { id: expense.submittedById }))}</span>` : ''}
                                            ${status === 'draft' ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-budget-expense-status" data-project-id="${escape(text(activeProject.id))}" data-expense-id="${escape(text(expense.id))}" data-status="submitted"><i class="fas fa-paper-plane"></i> Submit</button>` : ''}
                                            ${canReviewBudget && status === 'submitted' ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-budget-expense-status" data-project-id="${escape(text(activeProject.id))}" data-expense-id="${escape(text(expense.id))}" data-status="approved"><i class="fas fa-check"></i> Approve</button>` : ''}
                                            ${canReviewBudget && status === 'submitted' ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-budget-expense-status" data-project-id="${escape(text(activeProject.id))}" data-expense-id="${escape(text(expense.id))}" data-status="rejected"><i class="fas fa-xmark"></i> Reject</button>` : ''}
                                            ${canReviewBudget && status === 'approved' ? `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-budget-expense-status" data-project-id="${escape(text(activeProject.id))}" data-expense-id="${escape(text(expense.id))}" data-status="paid"><i class="fas fa-money-bill-wave"></i> Mark paid</button>` : ''}
                                            <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-budget-expense-delete" data-project-id="${escape(text(activeProject.id))}" data-expense-id="${escape(text(expense.id))}"><i class="fas fa-trash"></i> Remove</button>
                                        </div>
                                    ` : ''}
                                </article>
                            `;
                        }).join('') : `<div class="social-neo-empty">No expenses logged yet.</div>`}
                    </div>
                </section>
            </section>
        `;
        const buildProjectTabMarkup = (tabId) => {
            const tab = text(tabId || activeTab) || 'overview';
            return tab === 'overview'
                ? renderOverviewTab()
                : tab === 'team'
                    ? renderTeamTab()
                    : tab === 'tasks'
                        ? renderTasksTab()
                        : tab === 'chat'
                            ? renderChatTab()
                            : tab === 'activity'
                                ? renderActivityTab()
                                : tab === 'budget'
                                    ? renderBudgetTab()
                                    : renderOverviewTab();
        };
        renderProjectWorkspaceTabPanel = buildProjectTabMarkup;
        const tabMarkup = buildProjectTabMarkup(activeTab);
        const tabItems = [
            ['overview', 'Overview', 'fa-house', 'Studio summary'],
            ['team', 'Team', 'fa-users', `${activeProject.memberCount || 0} members`],
            ['tasks', 'Tasks', 'fa-list-check', `${activeProject.openTaskCount || 0} open`],
            ['chat', 'Chat', 'fa-comments', 'Backed by group chat'],
            ['activity', 'Activity', 'fa-wave-square', `${activeProject.activityCount || 0} events`],
            ['budget', 'Budget', 'fa-wallet', `${budgetUtilization}% used`]
        ];
        const tabMap = Object.fromEntries(tabItems.map(([tabId, label, icon, note]) => [tabId, { label, icon, note }]));
        const renderProjectTabPill = (tabId) => {
            const item = tabMap[tabId];
            if (!item) return '';
            const isActive = activeTab === tabId;
            return `
                <button class="social-project-tab-pill ${isActive ? 'is-active' : ''}" type="button" role="tab" aria-selected="${isActive ? 'true' : 'false'}" tabindex="${isActive ? '0' : '-1'}" data-action="project-tab" data-project-id="${escape(text(activeProject.id))}" data-project-tab="${escape(tabId)}">
                    <i class="fas ${escape(item.icon)}"></i>
                    <span>
                        <strong>${escape(item.label)}</strong>
                        <small>${escape(item.note)}</small>
                    </span>
                </button>
            `;
        };
        return `
            <div class="social-neo-stack social-projects-shell">
                <section class="social-neo-card social-project-detail-hero social-project-detail-hero-rich">
                    <div class="social-project-detail-top">
                        <div class="social-project-detail-copy">
                            <div class="social-neo-inline social-neo-inline-gap-10-wrap">
                                <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="projects-back"><i class="fas fa-arrow-left"></i> Back</button>
                                ${projectRolePill(activeProject.role || 'member')}
                                <span class="social-neo-pill">${escape(text(statusMeta[text(activeProject.status || 'idea')]?.label || activeProject.status || 'idea'))}</span>
                                ${activeProject.isOrphaned ? `<span class="social-neo-pill">Ownerless</span>` : ''}
                            </div>
                            <h2>${escape(text(activeProject.name || 'Project workspace'))}</h2>
                            <p>${escape(text(activeProject.summary || activeProject.description || ''))}</p>
                            <div class="social-neo-badge-row">
                                ${facultyPills(activeProject.facultyCodes)}
                                ${skillPills(activeProject.skillTags)}
                                ${text(activeProject.courseTag) ? `<span class="social-neo-pill">${escape(activeProject.courseTag)}</span>` : ''}
                            </div>
                        </div>
                        <div class="social-project-detail-actions">
                            <div class="social-neo-person">
                                ${avatar(owner)}
                                <div>
                                    <strong>${escape(displayName(owner))}</strong>
                                    <span>${escape(activeProject.isOrphaned ? 'No current owner' : 'Workspace owner')}</span>
                                </div>
                            </div>
                            <div class="social-neo-inline social-neo-inline-end-gap-8-wrap">
                                <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="project-open-chat" data-project-id="${escape(text(activeProject.id))}"><i class="fas fa-comments"></i> Chat</button>
                                <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="project-tab" data-project-id="${escape(text(activeProject.id))}" data-project-tab="tasks"><i class="fas fa-list-check"></i> Tasks</button>
                                ${renderProjectWorkspaceNavButtons(activeProject)}
                                ${activeProject.isManager ? `<button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="project-settings-open" data-project-id="${escape(text(activeProject.id))}"><i class="fas fa-sliders"></i> Settings</button>` : ''}
                                ${activeProject.isManager ? `<button class="social-neo-btn social-neo-btn-primary" type="button" data-action="project-showcase-publish" data-project-id="${escape(text(activeProject.id))}"><i class="fas fa-globe"></i> Showcase</button>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="social-project-dashboard-strip">
                        ${renderProgressRing(activeProject?.taskCompletionPercent || 0, 'Task completion', `${activeProject?.completedTaskCount || 0} of ${activeProject?.taskCount || 0}`, '#f97316')}
                        ${renderMetricCard('fa-wallet', 'Budget', formatBudgetMoney(activeProject?.budgetSpentTotal || 0, activeProject?.budgetCurrency || 'USD'), `${activeProject?.budgetUtilizationPercent || 0}% of ${formatBudgetMoney(activeProject?.budgetCap || activeProject?.budgetPlannedTotal || 0, activeProject?.budgetCurrency || 'USD')}`, '#f59336')}
                        ${renderMetricCard('fa-users', 'Team mix', activeProject?.memberCount || 0, `${(activeProject?.facultyMix || []).length} faculties`, '#8b5cf6')}
                        <article class="social-project-metric-card social-project-metric-card-wide">
                            <span class="social-project-metric-icon"><i class="fas fa-wave-square"></i></span>
                            <div>
                                <small>Activity pulse</small>
                                <strong>${escape(String(activeProject?.activityCount || 0))}</strong>
                                <span>last 7 days</span>
                            </div>
                            ${renderSparkline(activeProject?.activityBuckets || [])}
                        </article>
                    </div>
                </section>
                <section class="social-neo-card social-project-tab-shell">
                    <div class="social-project-tab-row social-project-tab-row-rich" role="tablist" aria-label="Project sections">
                        ${tabItems.map(([tabId]) => renderProjectTabPill(tabId)).join('')}
                    </div>
                </section>
                <div id="social-project-tab-panel" class="social-project-tab-panel" data-project-tab="${escape(activeTab)}">
                    ${tabMarkup}
                </div>
            </div>
        `;
    }

    /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
       PAGES PANEL - Facebook-style page discovery & management
       â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */




    // Export classic hub + desk/card renderers before graph/portfolio append stacks so
    // source-lock tests can bound classic with window.renderProjectsWorkspacePanelClassic.
    window.renderProjectsWorkspacePanelClassic = renderProjectsWorkspacePanelClassic;
    window.renderProjectTaskDeskCard = renderProjectTaskDeskCard;
    window.renderDeskTaskTreeForest = renderDeskTaskTreeForest;
    window.renderProjectTaskCard = renderProjectTaskCard;
    window.renderProjectTaskColumnList = renderProjectTaskColumnList;
    window.renderProjectColumnTasksModal = renderProjectColumnTasksModal;


    /* ── Workspace-owned dialog routing (project / portfolio / graph stack) ── */

    const PROJECT_HEALTH_OVERLAY_DIALOGS = new Set([
        'project-task-detail',
        'project-task-edit',
        'project-task-create',
        'project-task-delete',
        'project-settings',
        'project-risk',
        'project-health-plan-pick'
    ]);

    const WORKSPACE_OWNED_DIALOG_KINDS = new Set([
        'project-create',
        'project-task-create',
        'project-task-edit',
        'project-task-graph',
        'project-task-graph-history',
        'project-task-graph-schedule-help',
        'project-column-tasks',
        'project-task-detail',
        'project-task-delete',
        'project-settings',
        'project-health',
        'project-health-plan-pick',
        'project-risk',
        'portfolio-create',
        'portfolio-editor',
        'project-leave'
    ]);

    function shouldRenderProjectHealthStack(runtime, kind = '') {
        return runtime.ui?.previousDialog?.type === 'project-health'
            && PROJECT_HEALTH_OVERLAY_DIALOGS.has(text(kind));
    }

    function wrapProjectHealthStack(healthMarkup, childMarkup) {
        if (!healthMarkup && !childMarkup) return '';
        if (!healthMarkup) return childMarkup || '';
        return `<div class="social-project-health-stack">
            <div class="social-project-health-anchor" data-project-health-anchor="1">${healthMarkup}</div>
            <div class="social-project-health-child-slot" data-project-health-child-slot="1">${childMarkup || ''}</div>
        </div>`;
    }

    function renderHealthStackLayers(runtime, childMarkup) {
        const healthDialog = runtime.ui?.previousDialog;
        if (!healthDialog || text(healthDialog.type) !== 'project-health') return childMarkup || '';
        const healthMarkup = renderProjectHealthDialog(runtime, healthDialog);
        const stacked = wrapProjectHealthStack(healthMarkup, childMarkup);
        const graphParent = healthDialog.__restorePrevious;
        if (graphParent && text(graphParent.type) === 'project-task-graph') {
            return wrapProjectTaskGraphStack(
                renderProjectTaskGraphFullscreen(runtime, graphParent),
                stacked
            );
        }
        return stacked;
    }

    function maybeWrapStackedProjectDialog(runtime, kind, childMarkup) {
        if (shouldRenderProjectHealthStack(runtime, kind)) {
            return renderHealthStackLayers(runtime, childMarkup);
        }
        if (shouldRenderProjectTaskGraphStack(runtime, kind)) {
            return wrapProjectTaskGraphStack(
                renderProjectTaskGraphFullscreen(runtime, runtime.ui.previousDialog),
                childMarkup
            );
        }
        return childMarkup;
    }

    function renderStackedProjectTaskChild(runtime, kind = '') {
        const dialog = activeDialog();
        const normalizedKind = text(kind || dialog?.type);
        if (!dialog || !normalizedKind) return '';
        if (normalizedKind === 'project-task-create' || normalizedKind === 'project-task-edit') {
            return renderProjectTaskCreateDialog(runtime, dialog);
        }
        if (normalizedKind === 'project-task-detail') {
            const project = resolveActiveSocialProject(runtime, dialog?.projectId);
            const taskId = text(dialog?.taskId || '');
            if (!project || !taskId) return '';
            return renderProjectTaskDetailModal(runtime, project, taskId);
        }
        if (normalizedKind === 'project-task-delete') {
            const project = resolveActiveSocialProject(runtime, dialog?.projectId);
            const taskId = text(dialog?.taskId || '');
            if (!project || !taskId || !project.viewerCanContribute) return '';
            const task = (Array.isArray(project.tasks) ? project.tasks : []).find((entry) => text(entry?.id) === taskId) || null;
            if (!task) return '';
            return renderProjectTaskDeleteConfirmDialog(project, task, {
                backdropClass: projectTaskGraphStackedBackdropClass(runtime, normalizedKind)
            });
        }
        if (normalizedKind === 'project-health') {
            return renderProjectHealthDialog(runtime, dialog);
        }
        if (normalizedKind === 'project-risk') {
            return renderProjectRiskDialog(runtime, dialog);
        }
        if (normalizedKind === 'project-task-graph-history') {
            return renderProjectTaskGraphHistoryDialog(runtime, dialog);
        }
        if (normalizedKind === 'project-task-graph-schedule-help') {
            return renderProjectTaskGraphScheduleHelpDialog(runtime, dialog);
        }
        return '';
    }


    function renderWorkspaceOwnedDialog(runtime, dialog) {
        if (!dialog) return '';
        const kind = text(dialog.type);
        if (!WORKSPACE_OWNED_DIALOG_KINDS.has(kind)) return '';
        if (kind === 'project-create') {
            return renderProjectCreateDialog(state());
        }
        if (kind === 'project-task-create') {
            return maybeWrapStackedProjectDialog(runtime, kind, renderProjectTaskCreateDialog(runtime, dialog));
        }
        if (kind === 'project-task-edit') {
            return maybeWrapStackedProjectDialog(runtime, kind, renderProjectTaskCreateDialog(runtime, dialog));
        }
        if (kind === 'project-task-graph') {
            return renderProjectTaskGraphFullscreen(runtime, dialog);
        }
        if (kind === 'project-task-graph-history') {
            const child = renderProjectTaskGraphHistoryDialog(runtime, dialog);
            if (shouldRenderProjectTaskGraphStack(runtime, kind)) {
                return wrapProjectTaskGraphStack(renderProjectTaskGraphFullscreen(runtime, runtime.ui.previousDialog), child);
            }
            return child;
        }
        if (kind === 'project-task-graph-schedule-help') {
            const child = renderProjectTaskGraphScheduleHelpDialog(runtime, dialog);
            if (shouldRenderProjectTaskGraphStack(runtime, kind)) {
                return wrapProjectTaskGraphStack(renderProjectTaskGraphFullscreen(runtime, runtime.ui.previousDialog), child);
            }
            return child;
        }
        if (kind === 'project-column-tasks') {
            const project = resolveActiveSocialProject(runtime, dialog?.projectId);
            const columnId = text(dialog?.columnId || 'todo') || 'todo';
            if (!project) return '';
            const projectTasks = Array.isArray(project.tasks) ? project.tasks : [];
            const columnTasks = filterProjectBoardTasks(runtime, projectTasks)
                .filter((task) => text(task?.status || 'todo') === columnId);
            return renderProjectColumnTasksModal(runtime, project, columnId, columnTasks);
        }
        if (kind === 'project-task-detail') {
            const project = resolveActiveSocialProject(runtime, dialog?.projectId);
            const taskId = text(dialog?.taskId || '');
            if (!project || !taskId) return '';
            return maybeWrapStackedProjectDialog(runtime, kind, renderProjectTaskDetailModal(runtime, project, taskId));
        }
        if (kind === 'project-task-delete') {
            const project = resolveActiveSocialProject(runtime, dialog?.projectId);
            const taskId = text(dialog?.taskId || '');
            if (!project || !taskId || !project.viewerCanContribute) return '';
            const task = (Array.isArray(project.tasks) ? project.tasks : []).find((entry) => text(entry?.id) === taskId) || null;
            if (!task) return '';
            const child = renderProjectTaskDeleteConfirmDialog(project, task, {
                backdropClass: projectTaskGraphStackedBackdropClass(runtime, kind)
            });
            return maybeWrapStackedProjectDialog(runtime, kind, child);
        }
        if (kind === 'project-settings') {
            return maybeWrapStackedProjectDialog(runtime, kind, renderProjectSettingsDialog(runtime, dialog));
        }
        if (kind === 'project-health') {
            const child = renderProjectHealthDialog(runtime, dialog);
            if (shouldRenderProjectTaskGraphStack(runtime, kind)) {
                return wrapProjectTaskGraphStack(renderProjectTaskGraphFullscreen(runtime, runtime.ui.previousDialog), child);
            }
            return child;
        }
        if (kind === 'project-health-plan-pick') {
            return maybeWrapStackedProjectDialog(runtime, kind, renderProjectHealthPlanPickDialog(runtime, dialog));
        }
        if (kind === 'project-risk') {
            return maybeWrapStackedProjectDialog(runtime, kind, renderProjectRiskDialog(runtime, dialog));
        }
        if (kind === 'portfolio-create') {
            return renderPortfolioCreateDialog(state());
        }
        if (kind === 'portfolio-editor') {
            return renderPortfolioEditorDialog();
        }

        if (kind === 'project-leave') {
            const projectItem = (Array.isArray(state().social?.projects) ? state().social.projects : [])
                .find((item) => text(item.id) === text(dialog.projectId));
            if (!projectItem) return '';
            const currentId = currentUserId();
            const isOwner = text(projectItem.ownerUserId || '') === currentId;
            const nextOwnerId = text(projectItem.nextOwnerUserId || '');
            const nextOwner = nextOwnerId ? accountById(nextOwnerId) || { id: nextOwnerId } : null;
            return `<div class="social-neo-dialog-backdrop" data-action="dialog-close">
                <form class="social-neo-dialog-card" data-form="dialog-project-leave" data-action="noop">
                    <div class="social-neo-section-head social-neo-dialog-head">
                        <div class="social-neo-dialog-heading"><strong class="social-neo-dialog-title">Leave workspace</strong><span class="social-neo-dialog-subtitle">This removes you from the team but keeps the workspace history, tasks, files, and chat intact.</span></div>
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-close-btn" type="button" data-action="dialog-close"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="social-neo-dialog-preview">
                        <strong class="social-neo-dialog-preview-title">${escape(text(projectItem.name || 'Project workspace'))}</strong>
                        <div class="social-neo-muted social-neo-muted-mt-6">${escape(`${projectItem.memberCount || 0} team members`)}</div>
                    </div>
                    <div class="social-neo-dialog-preview ${isOwner ? 'social-neo-dialog-preview-danger' : ''}">
                        ${isOwner
                            ? (nextOwner
                                ? `You own this workspace. If you leave now, ownership transfers to ${escape(displayName(nextOwner))} and the workspace stays active.`
                                : 'You own this workspace. If you leave now, the workspace stays active but becomes ownerless until someone joins or is assigned later.')
                            : 'Your membership will be removed, but chat history, tasks, and activity remain untouched.'}
                    </div>
                    <label class="social-neo-item-line social-neo-dialog-checkbox-line">
                        <input type="checkbox" name="confirmProjectLeave" value="yes">
                        <span class="social-neo-dialog-checkbox-copy">I understand that I am leaving this workspace.</span>
                    </label>
                    <div class="social-neo-form-actions social-neo-dialog-actions">
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-cancel-btn" type="button" data-action="dialog-close">Cancel</button>
                        <button class="social-neo-btn social-neo-btn-primary social-neo-dialog-submit-btn" type="submit">Leave workspace</button>
                    </div>
                    <input type="hidden" name="projectId" value="${escape(text(projectItem.id))}">
                    <input type="hidden" name="projectChatId" value="${escape(text(projectItem.chatId || projectItem.groupChatId || ''))}">
                </form>
            </div>`;
        }

        return '';
    }


    /* ── Task graph render stack (preview / fullscreen / SVG / inspectors) ── */

    function renderProjectTaskGraphGroupNode(project, group, position, options = {}) {
        const w = PROJECT_TASK_GROUP_NODE_W;
        const h = PROJECT_TASK_GROUP_NODE_H;
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
                <rect class="social-project-task-graph-hit" x="0" y="0" width="${w}" height="${h}" fill="transparent" pointer-events="all"></rect>
                <foreignObject class="social-project-task-graph-card-fo" x="${-foPad}" y="${-foPad}" width="${w + foPad * 2}" height="${h + foPad * 2}">
                    <div xmlns="http://www.w3.org/1999/xhtml" class="social-project-task-graph-card-fo-inner" style="width:${w + foPad * 2}px;height:${h + foPad * 2}px;padding:${foPad}px;box-sizing:border-box;">
                        <div class="social-project-task-graph-group" data-graph-card-inner="1" style="width:${w}px;height:${h}px;" data-lux-transparency-exempt="1" data-pct="${pct}" ${attentionAttrs}>
                            ${linkHandles}
                            <div class="social-project-task-graph-group-head">
                                <i class="fas fa-layer-group" aria-hidden="true"></i>
                                <span class="social-project-task-graph-group-name" title="${escape(text(group?.name || 'Group'))}">${escape(text(group?.name || 'Group'))}</span>
                                <span class="social-project-task-graph-group-count" title="Absorbed subtree: members, order-linked tasks, and their dependents">${escape(countLabel)}</span>
                                ${groupRiskCount ? `<button type="button" class="social-project-task-graph-group-risk-badge" data-action="project-risk-open" data-project-id="${escape(projectId)}" data-group-id="${escape(groupId)}" title="${groupRiskCount} risk${groupRiskCount === 1 ? '' : 's'}" aria-label="${groupRiskCount} risks"><i class="fas fa-triangle-exclamation" aria-hidden="true"></i> ${groupRiskCount}</button>` : ''}
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
        const matrixPillMarkup = `<span class="social-neo-pill social-project-task-graph-card-priority social-project-task-graph-card-priority--matrix" data-priority="${escape(priorityDisplay.bucket)}"${priorityPillTitle}><i class="fas ${escape(priorityDisplay.icon)}" aria-hidden="true"></i>${escape(priorityDisplay.label)}<small class="social-project-task-graph-card-score">I${escape(String(priorityDisplay.impact))}·E${escape(String(priorityDisplay.effort))}</small></span>`;
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
                ? `<span class="social-project-task-graph-card-schedule-pill is-critical is-blocked" title="Blocked on the critical path — this holds the project finish"><i class="fas fa-ban" aria-hidden="true"></i>critical · blocked</span>`
                : `<span class="social-project-task-graph-card-schedule-pill is-critical" title="On the critical path — delay here delays the project finish"><i class="fas fa-route" aria-hidden="true"></i>critical</span>`)
            : '';
        const noEstPill = !compact && schedDisp?.noEstimate
            ? `<span class="social-project-task-graph-card-schedule-pill is-empty" title="Add time estimate (or PERT) so schedule math can place this task">no est</span>`
            : '';
        const estimateTitle = isMilestone
            ? 'Milestone'
            : (taskHasPert(task)
                ? 'PERT expected duration for this task (O+4M+P)/6. Clear optimistic / most likely / pessimistic to use a single estimate instead.'
                : 'This task’s time estimate (used for schedule placement)');
        const estimatePill = estimateLabel
            ? `<span class="social-neo-pill social-project-task-graph-card-estimate" title="${escape(estimateTitle)}"><i class="fas fa-hourglass-half" aria-hidden="true"></i>${escape(estimateLabel)}</span>`
            : '';
        const actualTimePill = !isMilestone
            ? `<span class="social-neo-pill social-project-task-graph-card-actual-time" title="Actual time logged on this task"><i class="fas fa-stopwatch" aria-hidden="true"></i>${escape(actualTimeLabel)} act</span>`
            : '';
        const actualCostPill = `<span class="social-neo-pill social-project-task-graph-card-actual-cost" title="Actual money spent on this task"><i class="fas fa-wallet" aria-hidden="true"></i>${escape(actualCostLabel)} act</span>`;
        const hasAssignee = Boolean(text(task?.assigneeUserId || ''));
        const ownerFull = hasAssignee ? displayName(assignee) : 'Unassigned';
        const ownerShort = hasAssignee
            ? (text(ownerFull).split(/\s+/).filter(Boolean).slice(0, 2).join(' ') || ownerFull)
            : 'Unassigned';
        const ownerPill = hasAssignee
            ? `<span class="social-neo-pill social-project-task-graph-card-assignee" title="Owner: ${escape(ownerFull)}">${avatar(assignee, 'social-neo-avatar-xs')}<em>${escape(ownerShort)}</em></span>`
            : `<span class="social-neo-pill social-project-task-graph-card-assignee is-unassigned" title="No owner"><i class="fas fa-user" aria-hidden="true"></i><em>Unassigned</em></span>`;
        const startPill = startLabel
            ? `<span class="social-neo-pill social-project-task-graph-card-start${!startAt && derivedStartLabel ? ' is-derived' : ''}" title="${startAt ? 'Planned start' : 'Derived from project start + schedule'}"><i class="fas fa-play" aria-hidden="true"></i>${escape(startLabel)}</span>`
            : `<span class="social-neo-pill social-project-task-graph-card-start is-empty" title="No start date"><i class="fas fa-play" aria-hidden="true"></i>—</span>`;
        const duePill = dueLabel
            ? `<span class="social-neo-pill social-project-task-graph-card-due${isOverdue ? ' is-overdue' : ''}${!dueAt && derivedFinishLabel ? ' is-derived' : ''}" title="${dueAt ? (isOverdue ? 'Overdue' : 'Due date') : 'Derived from project start + schedule'}"><i class="fas fa-flag-checkered" aria-hidden="true"></i>${escape(dueLabel)}</span>`
            : `<span class="social-neo-pill social-project-task-graph-card-due is-empty" title="No due date"><i class="fas fa-flag-checkered" aria-hidden="true"></i>—</span>`;
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
                <rect class="social-project-task-graph-hit" x="0" y="0" width="${w}" height="${h}" fill="transparent" pointer-events="all"></rect>
                <foreignObject class="social-project-task-graph-card-fo" x="${-foPad}" y="${-foPad}" width="${w + foPad * 2}" height="${h + foPad * 2}">
                    <div xmlns="http://www.w3.org/1999/xhtml" class="social-project-task-graph-card-fo-inner" style="width:${w + foPad * 2}px;height:${h + foPad * 2}px;padding:${foPad}px;box-sizing:border-box;">
                        <div class="social-project-task-graph-card${isOverdue ? ' is-overdue' : ''}${isInProgress ? ' is-active' : ''}${compact ? ' is-compact' : ''}${isMilestone ? ' is-milestone' : ''} graph-card-headline" data-graph-card-inner="1" style="width:${w}px;min-height:${h}px;height:${h}px;box-sizing:border-box;" data-status="${escape(statusId)}" data-lux-transparency-exempt="1" title="${escape(text(task?.title || 'Task'))}"${cardActionAttrs}>
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
                                    ${isMilestone ? '<span class="social-neo-pill social-project-task-graph-card-milestone-pill"><i class="fas fa-flag" aria-hidden="true"></i>milestone</span>' : matrixPillMarkup}
                                    ${ownerPill}
                                </div>
                                <div class="social-project-task-graph-card-meta">
                                    <span class="social-neo-pill social-project-task-graph-card-budget${budgetLabel ? '' : ' is-empty'}"><i class="fas fa-coins" aria-hidden="true"></i>${budgetLabel ? escape(budgetLabel) : '—'}</span>
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
                return { x: Number(livePos.x), y: Number(livePos.y), w: PROJECT_TASK_GROUP_NODE_W, h: PROJECT_TASK_GROUP_NODE_H };
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
            if (p && Number.isFinite(p.x)) return { x: p.x, y: p.y, w: PROJECT_TASK_GROUP_NODE_W, h: PROJECT_TASK_GROUP_NODE_H };
            return { x: Number(group.x) || 0, y: Number(group.y) || 0, w: PROJECT_TASK_GROUP_NODE_W, h: PROJECT_TASK_GROUP_NODE_H };
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
                .filter((g) => computeProjectTaskGraphGroupRollup(g, project).count === 0)
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
                    <div class="sptg-history-row${pending ? ' is-pending-delete' : ''}${index === 0 ? ' is-latest' : ''}" data-snapshot-id="${escape(sid)}">
                        <div class="sptg-history-row-meta">
                            <strong>${escape(entry.label || when)}</strong>
                            <span class="social-neo-muted">${groupCount} package${groupCount === 1 ? '' : 's'} · ${posCount} positions${index === 0 ? ' · latest' : ''}</span>
                        </div>
                        <div class="sptg-history-row-actions">
                            <button class="social-neo-btn social-neo-btn-primary" type="button" data-action="project-task-graph-history-restore" data-project-id="${escape(projectId)}" data-snapshot-id="${escape(sid)}"><i class="fas fa-clock-rotate-left" aria-hidden="true"></i> Restore</button>
                            <button class="social-neo-btn ${pending ? 'social-neo-btn-danger' : 'social-neo-btn-ghost'}" type="button" data-action="${pending ? 'project-task-graph-history-delete-confirm' : 'project-task-graph-history-delete'}" data-project-id="${escape(projectId)}" data-snapshot-id="${escape(sid)}">
                                <i class="fas fa-trash" aria-hidden="true"></i> ${pending ? 'Confirm delete' : 'Delete'}
                            </button>
                        </div>
                    </div>
                `;
            }).join('')
            : `<div class="social-neo-empty sptg-history-empty">No saves yet. Click <strong>Save</strong> on the map to create one.</div>`;
        return `
            <div class="social-neo-dialog-backdrop social-neo-dialog-backdrop--stacked-child" data-action="dialog-close" role="dialog" aria-modal="true" aria-label="Map save history">
                <div class="social-neo-dialog-card social-neo-dialog-card--form social-neo-dialog-card--lms-create social-neo-dialog-card--social-glass sptg-history-dialog" data-action="noop" data-lux-transparency-exempt="1">
                    <div class="social-neo-section-head social-neo-dialog-head">
                        <div class="social-neo-dialog-heading">
                            <strong class="social-neo-dialog-title"><i class="fas fa-clock-rotate-left" aria-hidden="true"></i> Map save history</strong>
                            <span class="social-neo-dialog-subtitle">${escape(text(project?.name || 'Project'))} · up to ${PROJECT_TASK_GRAPH_CHECKPOINT_MAX} saves</span>
                        </div>
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-close-btn" type="button" data-action="dialog-close" aria-label="Close"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="social-neo-dialog-body sptg-history-list">
                        ${rows}
                    </div>
                    <div class="social-neo-form-actions social-neo-dialog-actions">
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-cancel-btn" type="button" data-action="dialog-close">Close</button>
                        <button class="social-neo-btn social-neo-btn-primary social-neo-dialog-submit-btn" type="button" data-action="project-task-graph-save" data-project-id="${escape(projectId)}"><i class="fas fa-floppy-disk" aria-hidden="true"></i> Save now</button>
                    </div>
                </div>
            </div>
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
            <div class="sptg-schedule-help-row">
                <strong>${escape(term)}</strong>
                <p>${escape(meaning)}</p>
            </div>
        `).join('');
        return `
            <div class="social-neo-dialog-backdrop social-neo-dialog-backdrop--stacked-child" data-action="dialog-close" role="dialog" aria-modal="true" aria-label="Schedule terms">
                <div class="social-neo-dialog-card social-neo-dialog-card--form social-neo-dialog-card--lms-create social-neo-dialog-card--social-glass sptg-schedule-help-dialog" data-action="noop" data-lux-transparency-exempt="1">
                    <div class="social-neo-section-head social-neo-dialog-head">
                        <div class="social-neo-dialog-heading">
                            <strong class="social-neo-dialog-title"><i class="fas fa-circle-question" aria-hidden="true"></i> Schedule terms</strong>
                            <span class="social-neo-dialog-subtitle">${escape(text(project?.name || 'Project'))} · critical path method (CPM)</span>
                        </div>
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-close-btn" type="button" data-action="dialog-close" aria-label="Close"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="social-neo-dialog-body sptg-schedule-help-list" data-lux-transparency-exempt="1">
                        ${rows}
                    </div>
                    <div class="social-neo-form-actions social-neo-dialog-actions">
                        <button class="social-neo-btn social-neo-btn-primary social-neo-dialog-submit-btn" type="button" data-action="dialog-close">Got it</button>
                    </div>
                </div>
            </div>
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
                        <div class="social-project-task-graph-health-metric is-${escape(column.tone)}" data-status="${escape(column.id)}">
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
            <section class="social-neo-dialog-group-create-section social-project-task-graph-rail-overview-section">
                <div class="social-neo-dialog-group-create-section-head">
                    <strong>Schedule</strong>
                    <span>Your tasks only</span>
                </div>
                <p class="social-project-task-graph-schedule-empty-hint social-neo-muted">No open tasks assigned to you — turn off Only mine for the full project schedule.</p>
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
            <section class="social-neo-dialog-group-create-section social-project-task-graph-rail-overview-section">
                <div class="social-neo-dialog-group-create-section-head">
                    <strong>Schedule</strong>
                    <span>${escape(scopeLabel)}</span>
                </div>
                <div class="social-project-task-graph-schedule-overview" data-lux-transparency-exempt="1">
                    <div class="social-project-task-graph-schedule-stat">
                        <span class="social-project-task-graph-schedule-stat-label">Shortest finish</span>
                        <span class="social-project-task-graph-schedule-stat-value">${escape(formatProjectScheduleHours(totalDuration))}</span>
                        <span class="social-project-task-graph-schedule-stat-hint">${escape(finishHint)}</span>
                    </div>
                    ${plannedFinishDate ? `<div class="social-project-task-graph-schedule-stat">
                        <span class="social-project-task-graph-schedule-stat-label">Planned finish</span>
                        <span class="social-project-task-graph-schedule-stat-value">${escape(plannedFinishDate)}</span>
                        <span class="social-project-task-graph-schedule-stat-hint">from project start date + shortest finish (no weekends)</span>
                    </div>` : ''}
                    <div class="social-project-task-graph-schedule-stat">
                        <span class="social-project-task-graph-schedule-stat-label">Critical path</span>
                        <span class="social-project-task-graph-schedule-stat-value is-critical">${escape(String(criticalCount))} task${criticalCount === 1 ? '' : 's'}</span>
                        <span class="social-project-task-graph-schedule-stat-hint">${criticalHint}</span>
                    </div>
                    ${totalDuration <= 0 && noEstOpen > 0
                        ? `<p class="social-project-task-graph-schedule-empty-hint social-neo-muted">${escape(String(noEstOpen))} open task${noEstOpen === 1 ? '' : 's'} lack estimates — add O/M/P or duration to unlock critical path.</p>`
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
                <label class="social-project-task-graph-quick-create-field">
                    <span class="social-neo-label">Title</span>
                    <input class="social-neo-input" type="text" name="projectTaskTitle" placeholder="Task title" value="${escape(titleValue)}" required>
                </label>
                <label class="social-project-task-graph-quick-create-field">
                    <span class="social-neo-label">Status</span>
                    <select class="social-neo-select" name="projectTaskStatus" data-lux-picker>${statusOptions}</select>
                </label>
                <div class="social-project-task-graph-quick-create-actions">
                    <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm social-neo-dialog-cancel-btn" type="button" data-action="project-task-graph-quick-create-cancel">Cancel</button>
                    <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-task-graph-group-create" data-project-id="${escape(text(project.id))}" data-graph-x="${graphX}" data-graph-y="${graphY}" title="Create a group container here"><i class="fas fa-layer-group" aria-hidden="true"></i> Group</button>
                    <button class="social-neo-btn social-neo-btn-primary social-neo-btn-sm social-neo-dialog-submit-btn" type="submit">Add node</button>
                </div>
            </form>
        `;
    }

    function renderProjectTaskGraphDetailRailPlaceholder(project, runtime, tasks = []) {
        return `
            <div class="social-project-task-graph-detail-rail-empty" data-lux-transparency-exempt="1">
                ${renderProjectTaskGraphRailOverview(project, runtime, tasks)}
                <section class="social-neo-dialog-group-create-section social-project-task-graph-inspector-section-card">
                    <div class="social-neo-dialog-group-create-section-head">
                        <strong>Select a task</strong>
                        <span>Click any card on the map to review status, people, links, and quick actions.</span>
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
                        <input class="social-neo-input" id="sptg-group-name-${escape(groupId)}" name="groupName" type="text" value="${escape(text(group?.name || ''))}" maxlength="120" required autocomplete="off" data-group-name-input="1">
                        <label class="social-neo-label" for="sptg-group-assignee-${escape(groupId)}">Assigned to</label>
                        <select class="social-neo-select" id="sptg-group-assignee-${escape(groupId)}" name="groupAssigneeUserId" data-lux-picker>
                            ${assigneeOptions}
                        </select>
                        <label class="social-neo-label" for="sptg-group-desc-${escape(groupId)}">Notes</label>
                        <textarea class="social-neo-input social-project-task-graph-group-notes" id="sptg-group-desc-${escape(groupId)}" name="groupDescription" rows="3" maxlength="2000" placeholder="Optional package notes">${escape(description)}</textarea>
                    </form>
        ` : `
                    <div class="social-project-task-graph-inspector-body">
                        <span class="social-project-task-graph-inspector-label">Assigned to</span>
                        <p class="social-project-task-graph-inspector-description${assigneeId ? '' : ' is-empty'}">${assigneeId ? escape(displayName(accountById(assigneeId) || { id: assigneeId })) : 'Unassigned'}</p>
                        <span class="social-project-task-graph-inspector-label">Notes</span>
                        <p class="social-project-task-graph-inspector-description${description ? '' : ' is-empty'}">${description ? escape(description) : 'No notes yet.'}</p>
                    </div>
        `;
        const actions = canContribute ? `
                <div class="social-project-task-graph-inspector-actions">
                    <button class="social-neo-btn social-neo-btn-ghost social-project-task-graph-inspector-delete" type="button" data-action="project-task-graph-group-delete" data-project-id="${escape(projectId)}" data-group-id="${escape(groupId)}" title="Delete package" aria-label="Delete package"><i class="fas fa-trash"></i></button>
                    <button class="social-neo-btn social-neo-btn-primary" type="button" data-action="project-task-graph-group-save" data-project-id="${escape(projectId)}" data-group-id="${escape(groupId)}"><i class="fas fa-check"></i> Save</button>
                </div>
        ` : `
                <div class="social-project-task-graph-inspector-actions">
                    <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="project-task-graph-clear-selection">Close</button>
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
                    <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-close-btn" type="button" data-action="project-task-graph-clear-selection" title="Close" aria-label="Close inspector"><i class="fas fa-times"></i></button>
                </div>
                <div class="social-project-task-graph-inspector-scroll">
                    ${renderProjectTaskGraphRailOverview(project, runtime, Array.isArray(project?.tasks) ? project.tasks : [])}
                    <div class="social-project-task-graph-inspector-props" aria-label="Package properties">
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
                    <div class="social-project-task-graph-inspector-body">
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
                    <div class="social-project-task-graph-inspector-schedule-block">
                        <div class="social-project-task-graph-inspector-schedule-head">
                            <strong>Schedule</strong>
                            <button type="button" class="social-neo-btn social-neo-btn-ghost social-project-task-graph-schedule-help-btn" data-action="project-task-graph-schedule-help" data-project-id="${escape(text(project.id))}" title="What do these schedule terms mean?" aria-label="Schedule terms help">
                                <i class="fas fa-circle-question" aria-hidden="true"></i>
                            </button>
                        </div>
                        <div class="social-project-task-graph-inspector-schedule social-project-task-graph-inspector-schedule--full" aria-label="Schedule">
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
                    <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-close-btn" type="button" data-action="project-task-graph-clear-selection" title="Close" aria-label="Close inspector"><i class="fas fa-times"></i></button>
                </div>
                <div class="social-project-task-graph-inspector-scroll">
                    ${renderProjectTaskGraphRailOverview(project, runtime, tasks)}
                    <div class="social-project-task-graph-inspector-props" aria-label="Task properties">
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
                    <div class="social-project-task-graph-inspector-body">
                        <span class="social-project-task-graph-inspector-label">Description</span>
                        <p class="social-project-task-graph-inspector-description${description ? '' : ' is-empty'}">${description ? escape(description) : 'No description yet.'}</p>
                        <button class="social-project-task-graph-inspector-text-link" type="button" data-action="project-task-detail-open" data-project-id="${escape(text(project.id))}" data-task-id="${escape(text(task.id))}">View full details <i class="fas fa-arrow-right" aria-hidden="true"></i></button>
                    </div>
                </div>
                ${project.viewerCanContribute ? `
                <div class="social-project-task-graph-inspector-actions">
                    <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="project-task-graph-link-from-selected" data-project-id="${escape(text(project.id))}" data-task-id="${escape(text(task.id))}"><i class="fas fa-link"></i> Link</button>
                    <button class="social-neo-btn social-neo-btn-ghost social-project-task-graph-inspector-delete" type="button" data-action="project-task-delete-open" data-project-id="${escape(text(project.id))}" data-task-id="${escape(text(task.id))}" title="Delete task" aria-label="Delete task"><i class="fas fa-trash"></i></button>
                    <button class="social-neo-btn social-neo-btn-primary" type="button" data-action="project-task-edit-open" data-project-id="${escape(text(project.id))}" data-task-id="${escape(text(task.id))}"><i class="fas fa-pen"></i> Edit task</button>
                </div>
                ` : `
                <div class="social-project-task-graph-inspector-actions">
                    <button class="social-neo-btn social-neo-btn-primary" type="button" data-action="project-task-detail-open" data-project-id="${escape(text(project.id))}" data-task-id="${escape(text(task.id))}"><i class="fas fa-list-check"></i> View details</button>
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
                    <span class="social-neo-pill">${escape(String(explicitCount))} links</span>
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
        const detailRailMarkup = `<aside class="social-project-task-graph-detail-rail${railContent.empty ? ' is-empty' : ''}" data-lux-transparency-exempt="1">${railContent.markup}</aside>`;
        const modeToolbar = canContribute && linkFromId ? `
            <div class="social-project-tab-row social-project-task-graph-mode-toolbar" data-lux-transparency-exempt="1" role="group" aria-label="Link actions">
                <button class="social-neo-btn" type="button" data-action="project-task-graph-link-cancel"><i class="fas fa-times"></i> Cancel</button>
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
            <label class="social-project-task-graph-group-focus" title="Focus a package (portrait mode)">
                <i class="fas fa-layer-group" aria-hidden="true"></i>
                <select class="social-neo-select social-project-task-graph-group-select" name="projectTaskGraphFocusGroup" data-lux-picker aria-label="Focus package">
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
                                <div class="social-project-tab-row social-project-task-graph-checkpoint-controls" data-lux-transparency-exempt="1">
                                    <button class="social-neo-btn social-neo-btn-primary social-project-task-graph-save-btn" type="button" data-action="project-task-graph-save" data-project-id="${escape(text(project.id))}" title="${escape(saveTitle)}"><i class="fas fa-floppy-disk" aria-hidden="true"></i> Save</button>
                                    <button class="social-neo-btn social-project-task-graph-history-btn" type="button" data-action="project-task-graph-history-open" data-project-id="${escape(text(project.id))}" title="${escape(historyTitle)}"><i class="fas fa-clock-rotate-left" aria-hidden="true"></i> History${graphCheckpoints.length ? ` <span class="social-neo-pill">${escape(String(graphCheckpoints.length))}</span>` : ''}</button>
                                </div>
        ` : '';
        const criticalToggleBtn = `
                                <button class="social-neo-btn social-project-task-graph-critical-toggle${showCritical ? ' is-active' : ''}" type="button" data-action="project-task-graph-toggle-critical" title="${showCritical ? 'Hide critical path emphasis on the map' : 'Highlight critical path on the map'}" aria-pressed="${showCritical ? 'true' : 'false'}"><i class="fas fa-route" aria-hidden="true"></i> Critical path</button>
        `;
        return `
            <div class="social-neo-dialog-backdrop social-neo-dialog-backdrop--project-task-graph" data-action="noop" role="presentation">
                <div class="social-neo-dialog-card social-neo-dialog-card--project-task-graph-fullscreen" data-action="noop" data-lux-transparency-exempt="1" role="dialog" aria-modal="true" aria-label="Task map">
                    <div class="social-project-task-graph-immersive">
                        <header class="social-project-task-graph-immersive-topbar">
                            <div class="social-project-task-graph-immersive-title">
                                <strong><i class="fas fa-diagram-project" aria-hidden="true"></i> Task map</strong>
                                <span>${escape(text(project.name || 'Project'))}</span>
                            </div>
                            <div class="social-project-task-graph-immersive-actions">
                                ${modeToolbar}
                                ${groupFocusPills}
                                ${checkpointBtns}
                                <div class="social-project-tab-row social-project-task-graph-schedule-controls" data-lux-transparency-exempt="1">
                                    ${criticalToggleBtn}
                                </div>
                                <div class="social-project-tab-row social-project-task-graph-nav-controls" data-lux-transparency-exempt="1">
                                    ${renderProjectWorkspaceNavButtons(project, { buttonClass: 'social-neo-btn' })}
                                </div>
                                <div class="social-project-tab-row social-project-task-graph-zoom-controls" data-lux-transparency-exempt="1">
                                    <button class="social-neo-btn social-project-task-graph-zoom-btn" type="button" data-action="project-task-graph-zoom-out" title="Zoom out" aria-label="Zoom out"><i class="fas fa-minus"></i></button>
                                    <span class="social-project-task-graph-zoom-label">${escape(String(Math.round(zoom * 100)))}%</span>
                                    <button class="social-neo-btn social-project-task-graph-zoom-btn" type="button" data-action="project-task-graph-zoom-in" title="Zoom in" aria-label="Zoom in"><i class="fas fa-plus"></i></button>
                                    <button class="social-neo-btn social-project-task-graph-zoom-btn social-project-task-graph-reset-view-btn" type="button" data-action="project-task-graph-reset-view" title="Reset view — fit all tasks"><i class="fas fa-expand"></i> Reset view</button>
                                </div>
                                <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-close-btn" type="button" data-action="dialog-close" aria-label="Close task map"><i class="fas fa-times"></i></button>
                            </div>
                        </header>
                        <div class="social-project-task-graph-immersive-body">
                            <div class="social-project-task-graph-stage social-project-task-graph-stage--immersive is-mode-browse is-mode-link${focusGroupId ? ' is-group-portrait' : ''}" data-project-task-graph-stage="1" data-lux-transparency-exempt="1">
                                ${canvasMarkup}
                                ${renderProjectTaskGraphQuickCreatePopover(project, runtime)}
                            </div>
                            ${detailRailMarkup}
                        </div>
                        <footer class="social-project-task-graph-immersive-footer">
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
                                    ? `<button class="social-neo-btn social-neo-btn-primary social-project-task-graph-add-btn" type="button" data-action="project-task-create-open" data-project-id="${escape(text(project.id))}"><i class="fas fa-plus"></i> Add task</button>`
                                    : ''}
                            </div>
                        </footer>
                    </div>
                </div>
            </div>
        `;
    }


    window.renderTaskDependencyGraphPreview = renderTaskDependencyGraphPreview;
    window.renderProjectTaskGraphFullscreen = renderProjectTaskGraphFullscreen;
    window.renderProjectTaskGraphHistoryDialog = renderProjectTaskGraphHistoryDialog;
    window.renderProjectTaskGraphScheduleHelpDialog = renderProjectTaskGraphScheduleHelpDialog;
    window.renderProjectTaskGraphEdgeGroupsHtml = renderProjectTaskGraphEdgeGroupsHtml;
    window.renderProjectTaskGraphGroupEdgesHtml = renderProjectTaskGraphGroupEdgesHtml;
    window.renderProjectTaskGraphGroupDependencyEdgesHtml = renderProjectTaskGraphGroupDependencyEdgesHtml;
    window.buildProjectTaskGraphCanvasMarkup = buildProjectTaskGraphCanvasMarkup;
    window.renderProjectTaskGraphQuickCreatePopover = renderProjectTaskGraphQuickCreatePopover;
    window.renderProjectTaskGraphDetailRailContent = renderProjectTaskGraphDetailRailContent;
    window.renderProjectTaskGraphSvg = renderProjectTaskGraphSvg;
    window.renderProjectTaskGraphCanvas = renderProjectTaskGraphCanvas;
    window.renderProjectTaskGraphHealth = renderProjectTaskGraphHealth;
    window.renderProjectTaskGraphInspector = renderProjectTaskGraphInspector;
    window.renderProjectTaskGraphTools = renderProjectTaskGraphTools;
    window.renderProjectTaskGraphLegend = renderProjectTaskGraphLegend;
    window.renderProjectTaskGraphStatusMini = renderProjectTaskGraphStatusMini;


    /* ── Portfolio panel body (discover + mine + profile block + editor shell) ── */

    function renderMyPortfolioPanel() {
        const portfolio = ensureMyPortfolioDocument();
        const runtime = state();
        if (typeof window.KiuPortfolioEditor?.renderEditor === 'function') {
            return window.KiuPortfolioEditor.renderEditor(portfolio, {
                openPortfolioSections: runtime.ui?.openPortfolioSections || {},
                publishVisibility: runtime.ui?.publishVisibility || portfolio.visibilityMode || 'staff_only',
                publishConsent: Boolean(runtime.ui?.publishConsent),
                portfolioSaveStatus: runtime.ui?.portfolioSaveStatus || 'Changes autosave as you type.'
            });
        }
        return `<section class="social-neo-card"><div class="social-neo-empty">Portfolio editor is loading.</div></section>`;
    }

    function renderPortfolioEditorDialog() {
        return `<div class="social-neo-dialog-backdrop" data-action="dialog-close">
            <div class="social-neo-dialog-card social-neo-dialog-card--portfolio-editor" data-action="noop" data-lux-transparency-exempt="1">
                <div class="social-neo-dialog-editor-topbar">
                    <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-close-btn" type="button" data-action="dialog-close" aria-label="Close"><i class="fas fa-times"></i></button>
                </div>
                <div class="social-neo-dialog-body social-neo-dialog-body--portfolio-editor">
                    ${renderMyPortfolioPanel()}
                    ${renderPortfolioCustomBuilderOverlay()}
                </div>
            </div>
        </div>`;
    }

    function renderPortfolioCustomBuilderOverlay() {
        if (!state().ui?.portfolioCustomBuilderOpen) return '';
        if (typeof window.KiuPortfolioCustomBuilder?.renderCustomBuilderDialog !== 'function') return '';
        return window.KiuPortfolioCustomBuilder.renderCustomBuilderDialog(state().ui || {});
    }

    function renderPortfolioProfileBlock(userId, { isOwn = false } = {}) {
        const items = portfolioEntriesForViewer()
            .filter((entry) => text(entry.ownerUserId) === text(userId))
            .slice(0, 3);
        if (!items.length && !isOwn) return '';
        return `
            <section class="social-neo-card social-portfolio-profile-block">
                <div class="social-neo-section-head">
                    <div><strong>${isOwn ? 'Your portfolio' : 'Portfolio highlights'}</strong><span>${isOwn ? 'Showcase projects, research, design, and startup work inside campus social.' : 'Visible showcase entries from this profile.'}</span></div>
                    <div class="social-neo-inline social-neo-inline-gap-8-wrap">
                        <span class="social-neo-pill"><strong>${escape(items.length)}</strong><span>Visible</span></span>
                        ${isOwn ? `<button class="social-neo-btn social-neo-btn-primary social-neo-btn-sm" type="button" data-action="profile-portfolio-open"><i class="fas fa-briefcase"></i> Open Portfolio</button>` : ''}
                    </div>
                </div>
                ${items.length ? `
                    <div class="social-portfolio-mini-grid">
                        ${items.map((entry) => `
                            <article class="social-portfolio-mini-card">
                                <div class="social-neo-badge-row">
                                    <span class="social-neo-pill">${escape(portfolioAudienceLabel(entry.visibilityMode))}</span>
                                    <span class="social-neo-pill">${escape(entry.status)}</span>
                                </div>
                                <strong>${escape(entry.title)}</strong>
                                <p>${escape(entry.summary || entry.description || 'Portfolio entry')}</p>
                                <div class="social-neo-inline social-neo-inline-between-gap-8-wrap">
                                    <div class="social-neo-badge-row">${entry.hashtags.slice(0, 2).map((tag) => `<span class="social-neo-pill">#${escape(tag.replace(/^#/, ''))}</span>`).join('')}</div>
                                    <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-open" data-project-id="${escape(entry.id)}">Open</button>
                                </div>
                            </article>
                        `).join('')}
                    </div>
                ` : `<div class="social-neo-empty">Build your first portfolio card to share work, ideas, and startup-ready projects with the university community.</div>`}
            </section>
        `;
    }

    function renderProjectsPanel() {
        const runtime = state();
        const portfolioPanelTab = text(runtime.ui?.portfolioPanelTab || 'discover') || 'discover';
        const viewer = currentUser();
        const canCreate = Boolean(viewer);
        const allEntries = portfolioEntriesForViewer();
        const discoverFaculty = text(runtime.ui?.projectDiscoverFaculty || currentFacultyCode()) || currentFacultyCode();
        const discoverRole = text(runtime.ui?.projectDiscoverRole || 'all') || 'all';
        const discoverSearch = text(runtime.ui?.projectDiscoverSearch || '').toLowerCase();
        const discoverTag = text(runtime.ui?.projectDiscoverTag || '').toLowerCase();
        const openId = text(runtime.ui?.activeProjectId || '');
        const currentFaculty = currentFacultyCode();
        const facultyOptions = uniqueStrings(['all', currentFaculty, ...allEntries.flatMap((entry) => entry.facultyCodes || [])]).filter(Boolean);
        const tagOptions = uniqueStrings(allEntries.flatMap((entry) => entry.hashtags || [])).slice(0, 12);
        const filteredEntries = allEntries.filter((entry) => {
            if (discoverFaculty !== 'all' && !(entry.facultyCodes || []).includes(discoverFaculty)) return false;
            if (!portfolioMatchesRoleFilter(entry, discoverRole)) return false;
            if (discoverTag && !(entry.hashtags || []).some((tag) => text(tag).toLowerCase() === discoverTag.replace(/^#/, ''))) return false;
            if (discoverSearch) {
                const blob = `${entry.title} ${entry.summary} ${entry.description} ${(entry.hashtags || []).join(' ')} ${(entry.skillTags || []).join(' ')} ${displayName(entry.owner)} ${facultyLabel(entry.ownerFacultyCode)}`.toLowerCase();
                if (!blob.includes(discoverSearch)) return false;
            }
            return true;
        });
        const myEntries = allEntries.filter((entry) => text(entry.ownerUserId) === currentUserId());
        const highlightedOpenId = openId && filteredEntries.some((entry) => entry.id === openId) ? openId : '';
        const editing = text(runtime.ui?.projectEditId || '');
        const hasDraft = Boolean(editing || portfolioDraftExists());
        const portfolioPanelTabs = [
            { tab: 'mine', label: 'My portfolio', helper: 'Build and publish your showcase', attrs: 'data-portfolio-tab="mine"' },
            { tab: 'discover', label: 'Discover', helper: 'Browse talent across campus', attrs: 'data-portfolio-tab="discover"' },
        ];
        const discoverFeedMarkup = filteredEntries.length ? filteredEntries.map((entry, index) => {
                        const owner = entry.owner;
                        const isOpen = highlightedOpenId === entry.id;
                        const mediaPreview = entry.mediaItems[0] || null;
                        const mediaUrl = mediaPreview ? fileUrl(mediaPreview) : '';
                        const featured = index === 0 || (index > 0 && index % 5 === 0);
                        return `
                            <article class="social-neo-post-card social-portfolio-card ${isOpen ? 'is-open' : ''} ${featured ? 'is-featured' : ''}">
                                <div class="social-portfolio-card-head">
                                    <div class="social-neo-person">
                                        ${avatar(owner, 'social-neo-avatar-sm')}
                                        <div>
                                            <strong>${escape(displayName(owner))}</strong>
                                            <div class="social-neo-muted">${escape(roleLabel(owner?.role))} / ${escape(facultyLabel(entry.ownerFacultyCode || currentFaculty))}</div>
                                        </div>
                                    </div>
                                    <div class="social-neo-badge-row">
                                        ${featured ? `<span class="social-neo-pill social-portfolio-featured-pill"><strong>Featured</strong><span>Showcase pick</span></span>` : ''}
                                        <span class="social-neo-pill">${escape(portfolioAudienceLabel(entry.visibilityMode))}</span>
                                        <span class="social-neo-pill">${escape(entry.status === 'published' ? 'Published' : 'Draft')}</span>
                                        <span class="social-neo-pill">${escape(when(entry.updatedAt || entry.createdAt))}</span>
                                    </div>
                                </div>
                                ${mediaUrl && isImage(mediaPreview) ? `<div class="social-portfolio-cover"><img src="${escape(mediaUrl)}" alt="${escape(entry.title)}"></div>` : ''}
                                <div class="social-portfolio-body">
                                    <h3>${escape(entry.title)}</h3>
                                    <p>${escape(isOpen ? (entry.description || entry.summary || 'Portfolio showcase') : (entry.summary || entry.description || 'Portfolio showcase'))}</p>
                                    <div class="social-neo-badge-row">
                                        ${(entry.facultyCodes || []).slice(0, 3).map((facultyCode) => `<span class="social-neo-pill">${escape(facultyLabel(facultyCode))}</span>`).join('')}
                                        ${(entry.skillTags || []).slice(0, 4).map((skill) => `<span class="social-neo-pill">${escape(skill)}</span>`).join('')}
                                        ${(entry.hashtags || []).slice(0, 4).map((tag) => `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="portfolio-filter-tag" data-tag="${escape(text(tag).toLowerCase())}">#${escape(text(tag).replace(/^#/, ''))}</button>`).join('')}
                                    </div>
                                </div>
                                ${isOpen ? `
                                    <div class="social-portfolio-expanded">
                                        ${(() => {
                                            const safePortfolioLinks = entry.externalLinks.filter((link) => getSafeSocialExternalUrl(link?.url));
                                            return safePortfolioLinks.length ? `
                                            <div class="social-portfolio-links">
                                                ${safePortfolioLinks.map((link) => {
                                                    const safeLinkUrl = getSafeSocialExternalUrl(link?.url);
                                                    return `<a class="social-portfolio-link" href="${escape(safeLinkUrl)}" target="_blank" rel="noopener noreferrer">${escape(link.label || safeLinkUrl)} <i class="fas fa-arrow-up-right-from-square"></i></a>`;
                                                }).join('')}
                                            </div>
                                        ` : '';
                                        })()}
                                        ${entry.mediaItems.length > 1 ? `
                                            <div class="social-portfolio-media-strip">
                                                ${entry.mediaItems.slice(0, 6).map((item) => {
                                                    const url = fileUrl(item);
                                                    if (url && isImage(item)) return `<img src="${escape(url)}" alt="${escape(text(item.name || entry.title))}">`;
                                                    return `<span class="social-neo-pill">${escape(text(item.name || 'Attachment'))}</span>`;
                                                }).join('')}
                                            </div>
                                        ` : ''}
                                    </div>
                                ` : ''}
                                <div class="social-portfolio-actions">
                                    ${entry.isPortfolioDocument ? `
                                        <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="portfolio-doc-open" data-user-id="${escape(entry.ownerUserId)}">View portfolio</button>
                                        ${entry.canEdit ? `<button class="social-neo-btn social-neo-btn-primary" type="button" data-action="portfolio-create-open"><i class="fas fa-pen"></i> Edit portfolio</button>` : `<button class="social-neo-btn social-neo-btn-primary" type="button" data-action="portfolio-contact" data-project-id="${escape(entry.id)}" data-user-id="${escape(entry.ownerUserId)}"><i class="fas fa-envelope"></i> Message creator</button>`}
                                    ` : `
                                        <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="${isOpen ? 'projects-back' : 'project-open'}" data-project-id="${escape(entry.id)}">${isOpen ? 'Hide details' : 'Open entry'}</button>
                                        ${entry.canEdit ? `<button class="social-neo-btn social-neo-btn-primary" type="button" data-action="portfolio-edit" data-project-id="${escape(entry.id)}"><i class="fas fa-pen"></i> Edit</button>` : `<button class="social-neo-btn social-neo-btn-primary" type="button" data-action="portfolio-contact" data-project-id="${escape(entry.id)}" data-user-id="${escape(entry.ownerUserId)}"><i class="fas fa-envelope"></i> Message creator</button>`}
                                        ${entry.canEdit ? `<button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="portfolio-delete" data-project-id="${escape(entry.id)}"><i class="fas fa-trash"></i> Remove</button>` : ''}
                                    `}
                                </div>
                            </article>
                        `;
        }).join('') : `<div class="social-neo-empty social-neo-portfolio-feed-empty">No portfolio entries matched the current filters.</div>`;
        const panelBodyMarkup = portfolioPanelTab === 'mine'
            ? renderMyPortfolioPanel()
            : `<div class="social-portfolio-feed social-project-scroll-list social-project-scroll-list--portfolio">${discoverFeedMarkup}</div>`;
        return `
            <div class="social-neo-stack social-neo-portfolio-shell social-neo-portfolio-shell--merged">
                ${renderPortfolioHero(runtime, {
                    canCreate,
                    allEntries,
                    myEntries,
                    tagOptions,
                    facultyOptions,
                    portfolioPanelTab,
                    portfolioPanelTabs,
                    discoverFaculty,
                    discoverRole,
                    discoverSearch: text(runtime.ui?.projectDiscoverSearch || ''),
                    discoverTag,
                    editing,
                    hasDraft,
                    bodyHtml: panelBodyMarkup,
                })}
                ${renderPortfolioCustomBuilderOverlay()}
            </div>
        `;
    }


    window.renderProjectsPanel = renderProjectsPanel;
    window.renderMyPortfolioPanel = renderMyPortfolioPanel;
    window.renderPortfolioEditorDialog = renderPortfolioEditorDialog;
    window.renderPortfolioCustomBuilderOverlay = renderPortfolioCustomBuilderOverlay;
    window.renderPortfolioProfileBlock = renderPortfolioProfileBlock;

    window.renderProjectsWorkspacePanelClassic = renderProjectsWorkspacePanelClassic;
    window.renderProjectTaskDeskCard = renderProjectTaskDeskCard;
    window.renderDeskTaskTreeForest = renderDeskTaskTreeForest;
    window.renderProjectTaskCard = renderProjectTaskCard;
    window.renderProjectTaskColumnList = renderProjectTaskColumnList;
    window.renderProjectColumnTasksModal = renderProjectColumnTasksModal;

    /* ── Task graph runtime (layout/model/bind/sync/persist) ── */

    /* graph module state */
    let projectTaskGraphDragAbort = null;
    let projectTaskGraphResizeObserver = null;
    let projectTaskGraphLastStageSizeKey = '';
    let projectTaskGraphEdgeRaf = 0;
    let projectTaskGraphPanWindowListeners = null;
    const taskGraphSyncTimers = new Map();
    const taskGraphSyncPending = new Map();

    function shouldRenderProjectTaskGraphStack(runtime, kind = '') {
        return runtime.ui?.previousDialog?.type === 'project-task-graph'
            && PROJECT_TASK_GRAPH_STACKED_DIALOGS.has(text(kind));
    }

    function isProjectTaskGraphStackActive(runtime = state()) {
        const activeKind = text(activeDialog()?.type || '');
        if (activeKind === 'project-task-graph') return true;
        if (shouldRenderProjectTaskGraphStack(runtime, activeKind)) return true;
        return runtime.ui?.projectTaskGraphStackAnchor?.type === 'project-task-graph';
    }

    function getProjectTaskGraphStackAnchorDialog(runtime = state()) {
        if (runtime.ui?.previousDialog?.type === 'project-task-graph') return runtime.ui.previousDialog;
        if (runtime.ui?.projectTaskGraphStackAnchor?.type === 'project-task-graph') return runtime.ui.projectTaskGraphStackAnchor;
        if (runtime.ui?.socialDialog?.type === 'project-task-graph') return runtime.ui.socialDialog;
        return null;
    }

    function wrapProjectTaskGraphStack(graphMarkup, childMarkup) {
        if (!graphMarkup && !childMarkup) return '';
        if (!graphMarkup) return childMarkup || '';
        const childSlot = childMarkup || '';
        return `<div class="social-project-task-graph-stack">
            <div class="social-project-task-graph-anchor" data-project-task-graph-anchor="1">${graphMarkup}</div>
            <div class="social-project-task-graph-child-slot" data-project-task-graph-child-slot="1">${childSlot}</div>
        </div>`;
    }

    function trySyncProjectTaskGraphStackDialog(dialogRegion, runtime = state()) {
        if (!dialogRegion) return false;
        const activeKind = text(activeDialog()?.type || '');
        const anchor = dialogRegion.querySelector('[data-project-task-graph-anchor="1"]');
        const childSlot = dialogRegion.querySelector('[data-project-task-graph-child-slot="1"]');

        if (activeKind === 'project-task-graph' && anchor && childSlot) {
            childSlot.innerHTML = '';
            delete dialogRegion.__kiuLastMarkup;
            return true;
        }

        if (shouldRenderProjectTaskGraphStack(runtime, activeKind) && anchor && childSlot) {
            childSlot.innerHTML = renderStackedProjectTaskChild(runtime, activeKind);
            delete dialogRegion.__kiuLastMarkup;
            return true;
        }

        return false;
    }

    function projectTaskGraphStackedBackdropClass(runtime, kind = '') {
        if (shouldRenderProjectTaskGraphStack(runtime, kind) || shouldRenderProjectHealthStack(runtime, kind)) {
            return 'social-neo-dialog-backdrop--stacked-child';
        }
        return '';
    }

    function resolveProjectTaskGraphNodeFromTarget(target, svg, options = {}) {
        if (!target || !svg) return null;
        const draggableOnly = options.draggableOnly === true;
        const selector = draggableOnly
            ? '.social-project-task-graph-node-g[data-graph-draggable="1"]'
            : '.social-project-task-graph-node-g';
        const direct = target.closest?.(selector);
        if (direct && svg.contains(direct)) return direct;
        const card = target.closest?.('.social-project-task-graph-card[data-task-id]');
        const taskId = text(card?.getAttribute?.('data-task-id') || '');
        if (taskId) {
            const attr = draggableOnly ? '[data-graph-draggable="1"]' : '';
            const resolved = svg.querySelector(`.social-project-task-graph-node-g[data-task-id="${taskId}"]${attr}`);
            if (resolved) return resolved;
        }
        const fo = target.closest?.('.social-project-task-graph-card-fo');
        const parentG = fo?.parentElement;
        if (parentG?.matches?.(selector) && svg.contains(parentG)) return parentG;
        return null;
    }

    function projectTaskDependsOnIds(task) {
        return uniqueStrings((Array.isArray(task?.dependsOnTaskIds) ? task.dependsOnTaskIds : []).map((id) => text(id)).filter(Boolean));
    }

    function clampProjectTaskGraphCardHeight(h, compact = false) {
        const minH = compact ? PROJECT_TASK_GRAPH_CARD_COMPACT_MIN_H : PROJECT_TASK_GRAPH_CARD_MIN_H;
        const maxH = compact ? PROJECT_TASK_GRAPH_CARD_COMPACT_MAX_H : PROJECT_TASK_GRAPH_CARD_MAX_H;
        return Math.max(minH, Math.min(maxH, Math.round(h)));
    }

    /** Deterministic height from title length so cards fit title + pills on first paint. */

    function estimateProjectTaskGraphCardHeight(title, compact = false) {
        const raw = text(title || 'Task').trim() || 'Task';
        // ~28 chars/line at 13px on 256px card with padding
        const charsPerLine = compact ? 20 : 28;
        const titleLines = Math.min(2, Math.max(1, Math.ceil(raw.length / charsPerLine)));
        // base: padding + time/priority/budget/dates/owner chrome
        const baseChrome = compact ? 78 : 148;
        const titleH = titleLines * (compact ? 16 : 18);
        return clampProjectTaskGraphCardHeight(baseChrome + titleH, compact);
    }

    function measureProjectTaskGraphCardHeights(host = getProjectTaskGraphHost(), options = {}) {
        const svg = host?.querySelector('[data-project-task-graph-svg]');
        if (!svg) return false;
        const compact = Boolean(options.compact);
        const minH = compact ? PROJECT_TASK_GRAPH_CARD_COMPACT_MIN_H : PROJECT_TASK_GRAPH_CARD_MIN_H;
        const foPad = compact ? 8 : PROJECT_TASK_GRAPH_FO_PAD;
        let changed = false;
        svg.querySelectorAll('.social-project-task-graph-node-g').forEach((node) => {
            const card = node.querySelector('[data-graph-card-inner="1"]');
            if (!card) return;
            const w = Number(node.getAttribute('data-w')) || (compact ? PROJECT_TASK_GRAPH_CARD_COMPACT_W : PROJECT_TASK_GRAPH_CARD_W);
            const prevH = Number(node.getAttribute('data-h')) || minH;
            const body = card.querySelector('.social-project-task-graph-card-body');
            const prevOverflow = body ? body.style.overflow : '';
            if (body) body.style.overflow = 'visible';
            card.style.height = 'auto';
            card.style.minHeight = `${minH}px`;
            card.style.maxHeight = 'none';
            // Force reflow so scrollHeight reflects full unclamped content
            const measured = Math.ceil(Math.max(
                card.getBoundingClientRect().height,
                card.scrollHeight || 0,
                body ? (body.scrollHeight + 4) : 0
            ));
            const nextH = clampProjectTaskGraphCardHeight(measured, compact);
            if (body) body.style.overflow = prevOverflow;
            card.style.minHeight = '';
            card.style.maxHeight = '';
            if (nextH === prevH) {
                card.style.height = `${prevH}px`;
                return;
            }
            changed = true;
            const cx = Number(node.getAttribute('data-cx'));
            const cy = Number(node.getAttribute('data-cy'));
            const x = cx - Math.round(w / 2);
            const y = cy - Math.round(nextH / 2);
            node.setAttribute('data-h', String(nextH));
            node.setAttribute('transform', `translate(${x},${y})`);
            const hit = node.querySelector('.social-project-task-graph-hit');
            if (hit) hit.setAttribute('height', String(nextH));
            const fo = node.querySelector('.social-project-task-graph-card-fo');
            if (fo) {
                fo.setAttribute('height', String(nextH + foPad * 2));
                fo.setAttribute('y', String(-foPad));
            }
            const foInner = node.querySelector('.social-project-task-graph-card-fo-inner');
            if (foInner) foInner.style.height = `${nextH + foPad * 2}px`;
            card.style.height = `${nextH}px`;
        });
        if (changed) resolveProjectTaskGraphCardOverlaps(svg.querySelectorAll('.social-project-task-graph-node-g'), foPad + 8);
        return changed;
    }

    function normalizeProjectTaskGraphMode(mode = '') {
        const raw = text(mode || 'browse') || 'browse';
        // Legacy mode names collapse into browse | connect
        if (raw === 'view' || raw === 'explore' || raw === 'arrange') return 'browse';
        if (raw === 'link' || raw === 'connect') return 'connect';
        if (raw === 'browse' || raw === 'connect') return raw;
        return 'browse';
    }

    function projectTaskGraphShowInferred(runtime) {
        return runtime?.ui?.projectTaskGraphShowInferred === true;
    }

    function projectTaskGraphShowCritical(runtime) {
        // Default ON when unset.
        return runtime?.ui?.projectTaskGraphShowCritical !== false;
    }

    function projectTaskGraphShowFlow(runtime) {
        return runtime?.ui?.projectTaskGraphShowFlow === true;
    }

    function projectTaskGraphVisibleEdges(model = {}, options = {}) {
        const showInferred = options.showInferred === true;
        const showFlow = options.showFlow === true;
        const edges = [...(Array.isArray(model.explicitEdges) ? model.explicitEdges : [])];
        if (showFlow) edges.push(...(Array.isArray(model.flowEdges) ? model.flowEdges : []));
        if (showInferred) edges.push(...(Array.isArray(model.inferredEdges) ? model.inferredEdges : []));
        return edges;
    }

    function buildProjectTaskGraphModel(tasks = [], options = {}) {
        const showInferred = options.showInferred === true;
        const showFlow = options.showFlow === true;
        const taskList = Array.isArray(tasks) ? tasks : [];
        const taskById = Object.fromEntries(taskList.map((task) => [text(task?.id), task]).filter(([id]) => id));
        const nodes = taskList.map((task) => ({
            id: text(task.id),
            task,
            status: text(task?.status || 'todo') || 'todo'
        })).filter((node) => node.id);
        const explicitEdges = [];
        const inferredEdges = [];
        const explicitPairs = new Set();
        const inferredCountByFrom = {};
        taskList.forEach((task) => {
            const toId = text(task?.id);
            if (!toId) return;
            projectTaskDependsOnIds(task).forEach((fromId) => {
                if (!taskById[fromId] || fromId === toId) return;
                explicitEdges.push({ from: fromId, to: toId, kind: 'explicit' });
                explicitPairs.add(`${fromId}->${toId}`);
            });
        });
        // Always compute flow/inferred candidates; visibility is controlled separately (default: explicit only).
        const flowEdges = buildProjectTaskFlowEdges(taskList, explicitPairs);
        taskList.forEach((left, leftIndex) => {
            taskList.forEach((right, rightIndex) => {
                if (leftIndex >= rightIndex) return;
                const rankLeft = PROJECT_TASK_STATUS_RANK[text(left?.status || 'todo')] ?? 0;
                const rankRight = PROJECT_TASK_STATUS_RANK[text(right?.status || 'todo')] ?? 0;
                if (rankRight - rankLeft !== 1) return;
                const fromId = text(left?.id);
                const toId = text(right?.id);
                if (!fromId || !toId) return;
                const pairKey = `${fromId}->${toId}`;
                if (explicitPairs.has(pairKey)) return;
                if ((inferredCountByFrom[fromId] || 0) >= 2) return;
                const updatedFrom = Date.parse(text(left?.updatedAt)) || 0;
                const updatedTo = Date.parse(text(right?.updatedAt)) || 0;
                if (updatedTo < updatedFrom) return;
                inferredEdges.push({ from: fromId, to: toId, kind: 'inferred' });
                inferredCountByFrom[fromId] = (inferredCountByFrom[fromId] || 0) + 1;
            });
        });
        const edges = projectTaskGraphVisibleEdges(
            { explicitEdges, flowEdges, inferredEdges },
            { showInferred, showFlow }
        );
        return { nodes, explicitEdges, flowEdges, inferredEdges, edges };
    }

    function layoutProjectTaskGraphByStatus(model, options = {}) {
        const metrics = getProjectTaskGraphMetrics(options);
        const nodes = Array.isArray(model?.nodes) ? model.nodes : [];
        const width = metrics.canvasW;
        const height = metrics.canvasH;
        const cardW = metrics.cardW;
        const cardH = metrics.cardH;
        const foPad = PROJECT_TASK_GRAPH_FO_PAD;
        const colPadX = metrics.compact ? 36 : 64;
        const colPadY = metrics.compact ? 28 : 36;
        const colCount = Math.max(1, PROJECT_TASK_COLUMNS.length);
        const colWidth = Math.max(cardW + colPadX + foPad * 2, (width - colPadX * 2) / colCount);
        const positions = {};
        if (!nodes.length) return { ...model, positions, width, height, metrics, layoutKind: 'status' };
        PROJECT_TASK_COLUMNS.forEach((column, colIndex) => {
            const columnNodes = nodes
                .filter((node) => text(node?.status || 'todo') === column.id)
                .sort((left, right) => compareProjectTaskGraphNodes(left.task, right.task));
            const colCx = colPadX + colWidth * colIndex + colWidth / 2;
            let rowY = colPadY;
            columnNodes.forEach((node) => {
                const h = estimateProjectTaskGraphCardHeight(node.task?.title, metrics.compact);
                positions[node.id] = {
                    x: Math.round(colCx),
                    y: Math.round(rowY + h / 2),
                    w: cardW,
                    h,
                    degree: computeProjectTaskGraphNodeDegree(node.id, model.edges || [])
                };
                rowY += h + colPadY;
            });
        });
        const maxY = Math.max(
            height,
            ...Object.values(positions).map((pos) => (pos.y || 0) + (pos.h || cardH) / 2 + colPadY + foPad),
            height
        );
        const maxX = Math.max(
            width,
            ...Object.values(positions).map((pos) => (pos.x || 0) + cardW / 2 + colPadX + foPad),
            width
        );
        return { ...model, positions, width: Math.round(maxX), height: Math.round(maxY), metrics, layoutKind: 'status' };
    }

    function compareProjectTaskGraphNodes(leftTask, rightTask) {
        const rankA = PROJECT_TASK_PRIORITY_RANK[text(leftTask?.priority).toLowerCase()] ?? 2;
        const rankB = PROJECT_TASK_PRIORITY_RANK[text(rightTask?.priority).toLowerCase()] ?? 2;
        if (rankA !== rankB) return rankA - rankB;
        const dueA = Date.parse(text(leftTask?.dueAt)) || Infinity;
        const dueB = Date.parse(text(rightTask?.dueAt)) || Infinity;
        if (dueA !== dueB) return dueA - dueB;
        return text(leftTask?.title).localeCompare(text(rightTask?.title));
    }

    function hashProjectTaskGraphSeed(value = '') {
        let hash = 2166136261;
        const input = text(value);
        for (let i = 0; i < input.length; i++) {
            hash ^= input.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return (hash >>> 0) / 4294967295;
    }

    function projectTaskGraphPseudoRandom(seed = 1) {
        let state = Math.floor(Number(seed) || 1) % 4294967296;
        return () => {
            state = (Math.imul(state, 1664525) + 1013904223) % 4294967296;
            return state / 4294967296;
        };
    }

    function getProjectTaskGraphMetrics(options = {}) {
        const compact = Boolean(options.compact);
        const fullscreen = Boolean(options.fullscreen);
        const cardW = compact ? PROJECT_TASK_GRAPH_CARD_COMPACT_W : PROJECT_TASK_GRAPH_CARD_W;
        const cardH = compact ? PROJECT_TASK_GRAPH_CARD_COMPACT_H : PROJECT_TASK_GRAPH_CARD_H;
        if (fullscreen) {
            const stageWidth = Math.max(800, Math.round(Number(options.stageWidth) || 0) || (typeof window !== 'undefined' ? window.innerWidth : 1100));
            const stageHeight = Math.max(480, Math.round(Number(options.stageHeight) || 0) || (typeof window !== 'undefined' ? Math.max(480, window.innerHeight - PROJECT_TASK_GRAPH_IMMERSIVE_CHROME_H) : 720));
            return {
                cardW,
                cardH,
                canvasW: stageWidth,
                canvasH: stageHeight,
                ticks: 150,
                compact: false,
                fullscreen: true
            };
        }
        const optW = Math.round(Number(options.stageWidth) || 0);
        const optH = Math.round(Number(options.stageHeight) || 0);
        return {
            cardW,
            cardH,
            canvasW: optW > 0 ? Math.max(compact ? 480 : 800, optW) : (compact ? 640 : 1100),
            canvasH: optH > 0 ? Math.max(compact ? 200 : 480, optH) : (compact ? 320 : 720),
            ticks: compact ? 80 : 150,
            compact
        };
    }

    function computeProjectTaskGraphStageSize(runtime = {}) {
        const hasSelection = Boolean(text(runtime.ui?.projectTaskGraphSelectedId || ''));
        const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1100;
        const viewportH = typeof window !== 'undefined' ? window.innerHeight : 720;
        let stageWidth = Math.max(720, viewportW);
        let stageHeight = Math.max(480, viewportH - PROJECT_TASK_GRAPH_IMMERSIVE_CHROME_H);
        // Right detail rail always present (overview + inspector / empty state).
        stageWidth -= hasSelection ? Math.min(300, Math.round(viewportW * 0.24)) : Math.min(280, Math.round(viewportW * 0.22));
        stageWidth = Math.max(640, stageWidth);
        return {
            stageWidth: Math.round(stageWidth),
            stageHeight: Math.round(stageHeight)
        };
    }

    function computeProjectTaskGraphNodeDegree(nodeId, edges = []) {
        let degree = 0;
        edges.forEach((edge) => {
            if (edge.from === nodeId || edge.to === nodeId) degree += 1;
        });
        return degree;
    }

    function projectTaskGraphBoxRepulse(a, b, pad, alpha, repulseBase) {
        const halfW = (a.w + b.w) / 2 + pad;
        const halfH = (a.h + b.h) / 2 + pad;
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        const overlapX = halfW - Math.abs(dx);
        const overlapY = halfH - Math.abs(dy);
        if (overlapX > 0 && overlapY > 0) {
            if (overlapX < overlapY) {
                const force = (overlapX * 0.55 + 3) * alpha;
                dx = dx >= 0 ? -force : force;
                dy = 0;
            } else {
                const force = (overlapY * 0.55 + 3) * alpha;
                dy = dy >= 0 ? -force : force;
                dx = 0;
            }
            return { dx, dy };
        }
        const dist = Math.hypot(dx, dy) || 0.01;
        const repulse = repulseBase * alpha / (dist * dist);
        return { dx: -(dx / dist) * repulse, dy: -(dy / dist) * repulse };
    }

    /** Disabled: auto-separation re-sorts the user's free layout. Keep for API compatibility. */

    function resolveProjectTaskGraphCardOverlaps(nodeEls, pad = 24) {
        return false;
    }

    function layoutProjectTaskGraphForce(model, options = {}) {
        const metrics = getProjectTaskGraphMetrics(options);
        const nodes = Array.isArray(model?.nodes) ? model.nodes : [];
        const edges = Array.isArray(model?.edges) ? model.edges : [];
        const width = metrics.canvasW;
        const height = metrics.canvasH;
        const cx = width / 2;
        const cy = height / 2;
        const cardW = metrics.cardW;
        const cardH = metrics.cardH;
        const pad = metrics.compact ? 12 : 16;
        if (!nodes.length) return { ...model, positions: {}, width, height, metrics };
        const simNodes = nodes.map((node, index) => {
            const degree = computeProjectTaskGraphNodeDegree(node.id, edges);
            const rand = projectTaskGraphPseudoRandom(Math.floor(hashProjectTaskGraphSeed(node.id) * 1e9) + index + 1);
            return {
                id: node.id,
                x: cx + (rand() - 0.5) * width * 0.5,
                y: cy + (rand() - 0.5) * height * 0.5,
                vx: 0,
                vy: 0,
                w: cardW,
                h: estimateProjectTaskGraphCardHeight(node.task?.title, metrics.compact),
                degree
            };
        });
        const nodeById = Object.fromEntries(simNodes.map((entry) => [entry.id, entry]));
        const repulseBase = metrics.compact ? 5200 : (metrics.fullscreen ? 9000 : 7200);
        const linkTarget = metrics.compact ? 140 : (metrics.fullscreen ? 180 : 160);
        const marginX = cardW / 2 + 12 + PROJECT_TASK_GRAPH_FO_PAD;
        const marginY = cardH / 2 + 12 + PROJECT_TASK_GRAPH_FO_PAD;
        for (let tick = 0; tick < metrics.ticks; tick++) {
            const alpha = 1 - tick / metrics.ticks;
            for (let i = 0; i < simNodes.length; i++) {
                for (let j = i + 1; j < simNodes.length; j++) {
                    const a = simNodes[i];
                    const b = simNodes[j];
                    const { dx, dy } = projectTaskGraphBoxRepulse(a, b, pad, alpha, repulseBase);
                    a.vx += dx;
                    a.vy += dy;
                    b.vx -= dx;
                    b.vy -= dy;
                }
            }
            edges.forEach((edge) => {
                const a = nodeById[edge.from];
                const b = nodeById[edge.to];
                if (!a || !b) return;
                let dx = b.x - a.x;
                let dy = b.y - a.y;
                const dist = Math.hypot(dx, dy) || 0.01;
                const pull = (dist - linkTarget) * (edge.kind === 'explicit' ? 0.05 : 0.03) * alpha;
                dx = (dx / dist) * pull;
                dy = (dy / dist) * pull;
                a.vx += dx;
                a.vy += dy;
                b.vx -= dx;
                b.vy -= dy;
            });
            simNodes.forEach((entry) => {
                entry.vx += (cx - entry.x) * 0.004 * alpha;
                entry.vy += (cy - entry.y) * 0.004 * alpha;
                entry.vx *= 0.82;
                entry.vy *= 0.82;
                entry.x += entry.vx;
                entry.y += entry.vy;
                entry.x = Math.max(marginX, Math.min(width - marginX, entry.x));
                entry.y = Math.max(marginY, Math.min(height - marginY, entry.y));
            });
        }
        const positions = {};
        simNodes.forEach((entry) => {
            positions[entry.id] = { x: entry.x, y: entry.y, w: entry.w, h: entry.h, degree: entry.degree };
        });
        return { ...model, positions, width, height, metrics, layoutKind: 'force' };
    }

    /** Always honor dragged/saved coords — user places boxes; layout kind only seeds missing ones. */

    function projectTaskGraphLayoutUsesSavedPositions(layout, runtime = null) {
        return true;
    }

    function applyProjectTaskGraphSavedPositions(layout, saved = {}) {
        if (!layout?.positions || !saved || typeof saved !== 'object') return layout;
        Object.entries(saved).forEach(([id, pos]) => {
            if (!layout.positions[id] || !pos) return;
            if (Number.isFinite(Number(pos.x))) layout.positions[id].x = Number(pos.x);
            if (Number.isFinite(Number(pos.y))) layout.positions[id].y = Number(pos.y);
        });
        // Expand canvas so free-placed cards/groups (including negative coords) stay in layout extent.
        const foPad = PROJECT_TASK_GRAPH_FO_PAD;
        let minX = Infinity;
        let minY = Infinity;
        let maxX = Number(layout.width) || 0;
        let maxY = Number(layout.height) || 0;
        const consider = (x, y, halfW, halfH) => {
            minX = Math.min(minX, x - halfW - foPad - 24);
            minY = Math.min(minY, y - halfH - foPad - 24);
            maxX = Math.max(maxX, x + halfW + foPad + 24);
            maxY = Math.max(maxY, y + halfH + foPad + 24);
        };
        Object.values(layout.positions).forEach((pos) => {
            if (!pos) return;
            consider(
                Number(pos.x) || 0,
                Number(pos.y) || 0,
                (Number(pos.w) || PROJECT_TASK_GRAPH_CARD_W) / 2,
                (Number(pos.h) || PROJECT_TASK_GRAPH_CARD_H) / 2
            );
        });
        Object.entries(saved).forEach(([id, pos]) => {
            if (!pos || !isProjectTaskGraphGroupId(id)) return;
            if (!Number.isFinite(Number(pos.x)) || !Number.isFinite(Number(pos.y))) return;
            consider(
                Number(pos.x),
                Number(pos.y),
                PROJECT_TASK_GROUP_NODE_W / 2,
                PROJECT_TASK_GROUP_NODE_H / 2
            );
        });
        if (Number.isFinite(minX) && Number.isFinite(minY)) {
            const spanW = maxX - Math.min(0, minX);
            const spanH = maxY - Math.min(0, minY);
            layout.width = Math.round(Math.max(layout.width || 0, maxX, spanW));
            layout.height = Math.round(Math.max(layout.height || 0, maxY, spanH));
            layout.contentMinX = Math.min(0, minX);
            layout.contentMinY = Math.min(0, minY);
        } else {
            layout.width = Math.round(Math.max(layout.width || 0, maxX));
            layout.height = Math.round(Math.max(layout.height || 0, maxY));
        }
        return layout;
    }

    function projectTaskGraphRectsOverlap(a, b, pad = 0) {
        if (!a || !b) return false;
        const p = Math.max(0, Number(pad) || 0);
        return Math.abs(a.x - b.x) < (a.w + b.w) / 2 + p
            && Math.abs(a.y - b.y) < (a.h + b.h) / 2 + p;
    }

    /**
     * Find empty canvas center near related task/group boxes (spiral AABB search).
     * Used when desk create/link leaves a task without a free-placed graph position.
     */

    function findFreeProjectTaskGraphPosition(runtime, projectId, options = {}) {
        const pid = text(projectId);
        const taskId = text(options.taskId || '');
        const preferNearIds = uniqueStrings((Array.isArray(options.preferNearIds) ? options.preferNearIds : []).map((id) => text(id)).filter(Boolean));
        const cardW = Number(options.cardW) || PROJECT_TASK_GRAPH_CARD_W;
        const cardH = Number(options.cardH) || PROJECT_TASK_GRAPH_CARD_H;
        const pad = Number.isFinite(Number(options.pad)) ? Number(options.pad) : 22;
        const project = resolveActiveSocialProject(runtime, pid);
        const tasks = Array.isArray(project?.tasks) ? project.tasks : [];
        const model = buildProjectTaskGraphModel(tasks, { edges: { flow: false, inferred: false } });
        let layout = buildProjectTaskGraphLayout(model, { layout: 'status' });
        const saved = getProjectTaskGraphPositions(runtime, pid);
        layout = applyProjectTaskGraphSavedPositions(layout, saved);
        const positions = layout?.positions && typeof layout.positions === 'object' ? layout.positions : {};

        const obstacles = [];
        Object.entries(positions).forEach(([id, pos]) => {
            if (!pos || text(id) === taskId) return;
            obstacles.push({
                id: text(id),
                x: Number(pos.x) || 0,
                y: Number(pos.y) || 0,
                w: Number(pos.w) || cardW,
                h: Number(pos.h) || cardH
            });
        });
        getProjectTaskGraphGroups(runtime, pid).forEach((group) => {
            const gid = text(group?.id);
            if (!gid) return;
            const gpos = saved[gid] || { x: group.x, y: group.y };
            obstacles.push({
                id: gid,
                x: Number(gpos?.x) || Number(group?.x) || 160,
                y: Number(gpos?.y) || Number(group?.y) || 160,
                w: PROJECT_TASK_GROUP_NODE_W,
                h: PROJECT_TASK_GROUP_NODE_H
            });
        });

        const centerOf = (id) => {
            const key = text(id);
            if (!key) return null;
            if (positions[key] && Number.isFinite(Number(positions[key].x))) {
                return { x: Number(positions[key].x), y: Number(positions[key].y) };
            }
            const group = getProjectTaskGraphGroups(runtime, pid).find((g) => text(g.id) === key);
            if (group) {
                const gpos = saved[key] || {};
                return {
                    x: Number(gpos.x) || Number(group.x) || 160,
                    y: Number(gpos.y) || Number(group.y) || 160
                };
            }
            return null;
        };

        let anchor = null;
        preferNearIds.forEach((id) => {
            if (anchor) return;
            anchor = centerOf(id);
        });
        if (!anchor && positions[taskId] && Number.isFinite(Number(positions[taskId].x))) {
            // Status-layout fallback for this task — good default empty map slot
            return {
                x: Math.round(Number(positions[taskId].x)),
                y: Math.round(Number(positions[taskId].y))
            };
        }
        if (!anchor) {
            // Place to the right of content bounds
            let maxX = 120;
            let avgY = 160;
            let n = 0;
            obstacles.forEach((o) => {
                maxX = Math.max(maxX, o.x + o.w / 2);
                avgY += o.y;
                n += 1;
            });
            if (n) avgY /= n;
            anchor = { x: maxX + cardW / 2 + 48, y: avgY };
        }

        const gap = 168;
        const candidates = [];
        // Prefer right of parent (child waits on parent)
        candidates.push({ x: anchor.x + gap, y: anchor.y });
        candidates.push({ x: anchor.x + gap, y: anchor.y + 56 });
        candidates.push({ x: anchor.x + gap, y: anchor.y - 56 });
        const step = Math.max(cardW, cardH) * 0.55 + pad;
        for (let ring = 1; ring <= 8; ring += 1) {
            const r = ring * step;
            for (let i = 0; i < 12; i += 1) {
                const ang = (Math.PI * 2 * i) / 12;
                candidates.push({
                    x: anchor.x + Math.cos(ang) * r,
                    y: anchor.y + Math.sin(ang) * r
                });
            }
        }

        const fits = (cx, cy) => {
            const self = { x: cx, y: cy, w: cardW, h: cardH };
            return !obstacles.some((o) => projectTaskGraphRectsOverlap(self, o, pad));
        };

        for (let i = 0; i < candidates.length; i += 1) {
            const c = candidates[i];
            const x = Math.round(c.x);
            const y = Math.round(c.y);
            if (fits(x, y)) return { x, y };
        }
        return {
            x: Math.round(anchor.x + gap + step * 2),
            y: Math.round(anchor.y + step)
        };
    }

    /**
     * Persist a free graph position if the task has none yet (desk create / first parent link).
     * Never overwrites an existing user/graph free position unless force:true.
     */

    function ensureProjectTaskGraphPositionForTask(runtime, projectId, taskId, options = {}) {
        const pid = text(projectId);
        const tid = text(taskId);
        if (!pid || !tid || !runtime?.ui) return null;
        ensureProjectTaskGraphPositionsLoaded(runtime, pid);
        const saved = { ...getProjectTaskGraphPositions(runtime, pid) };
        const existing = saved[tid];
        if (!options.force && existing && Number.isFinite(Number(existing.x)) && Number.isFinite(Number(existing.y))) {
            return { x: Number(existing.x), y: Number(existing.y) };
        }
        const preferNearIds = Array.isArray(options.preferNearIds) ? options.preferNearIds : [];
        // Prefer parents + package groups that already list this task
        const groups = getProjectTaskGraphGroups(runtime, pid);
        groups.forEach((g) => {
            const members = (Array.isArray(g?.memberTaskIds) ? g.memberTaskIds : []).map(text);
            if (members.includes(tid)) preferNearIds.push(text(g.id));
        });
        const pos = findFreeProjectTaskGraphPosition(runtime, pid, {
            taskId: tid,
            preferNearIds: uniqueStrings(preferNearIds.map(text).filter(Boolean))
        });
        if (!pos) return null;
        saved[tid] = { x: pos.x, y: pos.y };
        setProjectTaskGraphPositions(runtime, pid, saved, { skipNotify: Boolean(options.skipNotify) });
        return pos;
    }

    /** Bounding box of all placed cards (for preview auto-fit viewBox). */

    function projectTaskGraphContentBounds(layout = {}, pad = 24, extraBoxes = []) {
        const positions = layout?.positions && typeof layout.positions === 'object' ? layout.positions : {};
        const defaultW = layout?.metrics?.cardW || PROJECT_TASK_GRAPH_CARD_W;
        const defaultH = layout?.metrics?.cardH || PROJECT_TASK_GRAPH_CARD_H;
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        let count = 0;
        const includeBox = (pos, fallbackW, fallbackH) => {
            if (!pos || !Number.isFinite(Number(pos.x)) || !Number.isFinite(Number(pos.y))) return;
            const w = Number(pos.w) || fallbackW;
            const h = Number(pos.h) || fallbackH;
            const x = Number(pos.x) || 0;
            const y = Number(pos.y) || 0;
            minX = Math.min(minX, x - w / 2);
            minY = Math.min(minY, y - h / 2);
            maxX = Math.max(maxX, x + w / 2);
            maxY = Math.max(maxY, y + h / 2);
            count += 1;
        };
        Object.values(positions).forEach((pos) => includeBox(pos, defaultW, defaultH));
        (Array.isArray(extraBoxes) ? extraBoxes : []).forEach((pos) => includeBox(pos, defaultW, defaultH));
        if (!count) {
            return {
                minX: 0,
                minY: 0,
                width: Math.max(1, Number(layout.width) || 400),
                height: Math.max(1, Number(layout.height) || 280)
            };
        }
        const padding = Math.max(0, Number(pad) || 0);
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;
        return {
            minX,
            minY,
            width: Math.max(1, maxX - minX),
            height: Math.max(1, maxY - minY)
        };
    }

    /** Package box for bounds/fit — status layout places near members; force uses saved/free coords. */

    function resolveProjectTaskGraphGroupBox(group, layout = null, saved = {}, options = {}) {
        const gid = text(group?.id);
        // Prefer user-placed coords always — never auto-centroid or column-stack packages.
        const savedPos = gid && saved ? saved[gid] : null;
        const hasSaved = savedPos && Number.isFinite(Number(savedPos.x)) && Number.isFinite(Number(savedPos.y));
        const hasRecord = Number.isFinite(Number(group?.x)) && Number.isFinite(Number(group?.y));
        if (hasSaved || hasRecord) {
            return {
                x: hasSaved ? Number(savedPos.x) : Number(group.x),
                y: hasSaved ? Number(savedPos.y) : Number(group.y),
                w: PROJECT_TASK_GROUP_NODE_W,
                h: PROJECT_TASK_GROUP_NODE_H
            };
        }
        if (options.skipDefault) return null;
        const idx = Math.max(0, Number(options.emptyIndex) || 0);
        return {
            x: Math.round((PROJECT_TASK_GROUP_NODE_W / 2) + 24),
            y: Math.round(80 + (idx * (PROJECT_TASK_GROUP_NODE_H + 24))),
            w: PROJECT_TASK_GROUP_NODE_W,
            h: PROJECT_TASK_GROUP_NODE_H
        };
    }

    function collectProjectTaskGraphGroupBoxes(runtime, projectId, layout = null, savedPositions = null, options = {}) {
        const saved = savedPositions || getProjectTaskGraphPositions(runtime, projectId);
        const groups = getProjectTaskGraphGroups(runtime, projectId);
        let emptyIndex = 0;
        return groups.map((group) => {
            const members = (Array.isArray(group?.memberTaskIds) ? group.memberTaskIds : []).map(text).filter(Boolean);
            const box = resolveProjectTaskGraphGroupBox(group, layout, saved, {
                ...options,
                emptyIndex,
                skipDefault: options.skipDefault !== false
            });
            if (!members.length && text(layout?.layoutKind || '') === 'status') emptyIndex += 1;
            return box;
        }).filter(Boolean);
    }

    function projectTaskGraphContentViewBox(layout = {}, extraBoxes = [], pad = 36) {
        const bounds = projectTaskGraphContentBounds(layout, pad, extraBoxes);
        return {
            bounds,
            viewBox: `${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`
        };
    }

    function projectTaskGraphPositionsStorageKey(projectId) {
        return `kiu.projectTaskGraph.positions.${text(projectId)}`;
    }

    function loadProjectTaskGraphPositions(projectId) {
        try {
            const raw = localStorage.getItem(projectTaskGraphPositionsStorageKey(projectId));
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
        } catch (error) {
            return {};
        }
    }

    function saveProjectTaskGraphPositions(projectId, positions, options = {}) {
        const payload = positions && typeof positions === 'object' && !Array.isArray(positions) ? positions : {};
        try {
            localStorage.setItem(projectTaskGraphPositionsStorageKey(projectId), JSON.stringify(payload));
        } catch (error) {}
        try {
            const runtime = state();
            if (runtime?.ui) {
                const map = runtime.ui.projectTaskGraphPositionsByProject || (runtime.ui.projectTaskGraphPositionsByProject = {});
                const id = text(projectId);
                if (id) map[id] = payload;
                runtime.ui.projectTaskGraphPositions = payload;
            }
        } catch (error) {}
        if (!options.skipSync) queueProjectTaskGraphSync(text(projectId), { taskGraphPositions: payload });
        return payload;
    }

    function getProjectTaskGraphPositions(runtime, projectId) {
        if (!runtime?.ui) return {};
        const map = runtime.ui.projectTaskGraphPositionsByProject || (runtime.ui.projectTaskGraphPositionsByProject = {});
        const id = text(projectId);
        if (!id) return {};
        if (!map[id] || typeof map[id] !== 'object' || Array.isArray(map[id])) {
            map[id] = loadProjectTaskGraphPositions(id);
        }
        // Legacy mirror for current project only while graph is open
        runtime.ui.projectTaskGraphPositions = map[id];
        return map[id];
    }

    function setProjectTaskGraphPositions(runtime, projectId, positions, options = {}) {
        if (!runtime?.ui) return positions && typeof positions === 'object' ? positions : {};
        const map = runtime.ui.projectTaskGraphPositionsByProject || (runtime.ui.projectTaskGraphPositionsByProject = {});
        const id = text(projectId);
        const payload = positions && typeof positions === 'object' && !Array.isArray(positions) ? positions : {};
        if (id) {
            map[id] = payload;
            runtime.ui.projectTaskGraphPositions = payload;
            saveProjectTaskGraphPositions(id, payload, options);
            // skipNotify during server seed / silent writes — avoids render re-entry loops.
            if (!options.skipNotify && !options.skipSync) {
                notifyProjectTaskGraphSurfaceChanged(id);
            }
        } else {
            runtime.ui.projectTaskGraphPositions = payload;
        }
        return payload;
    }

    function ensureProjectTaskGraphPositionsLoaded(runtime, projectId) {
        const id = text(projectId);
        if (id) {
            const project = resolveActiveSocialProject(runtime, id);
            if (project) seedProjectTaskGraphFromProject(runtime, project);
        }
        return getProjectTaskGraphPositions(runtime, projectId);
    }

    function projectTaskGraphViewStorageKey(projectId) {
        return `kiu.projectTaskGraph.view.${text(projectId)}`;
    }

    function clampProjectTaskGraphZoom(zoom, options = {}) {
        const minZoom = Number.isFinite(Number(options.minZoom)) ? Number(options.minZoom) : PROJECT_TASK_GRAPH_MIN_ZOOM;
        const maxZoom = Number.isFinite(Number(options.maxZoom)) ? Number(options.maxZoom) : PROJECT_TASK_GRAPH_MAX_ZOOM;
        const z = Number(zoom);
        if (!Number.isFinite(z) || z <= 0) return minZoom;
        return Math.max(minZoom, Math.min(maxZoom, z));
    }

    function loadProjectTaskGraphView(projectId) {
        try {
            const raw = localStorage.getItem(projectTaskGraphViewStorageKey(projectId));
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') return null;
            // Pre-bounds pan used world origin; those saves open on empty space — discard.
            if (text(parsed.coords || '') !== 'bounds') return null;
            const zoom = clampProjectTaskGraphZoom(parsed.zoom);
            const panX = Math.round(Number(parsed?.pan?.x) || 0);
            const panY = Math.round(Number(parsed?.pan?.y) || 0);
            return { zoom, pan: { x: panX, y: panY }, coords: 'bounds' };
        } catch (error) {
            return null;
        }
    }

    function saveProjectTaskGraphView(projectId, view = {}, options = {}) {
        const id = text(projectId);
        if (!id) return null;
        const payload = {
            zoom: clampProjectTaskGraphZoom(view?.zoom),
            pan: {
                x: Math.round(Number(view?.pan?.x) || 0),
                y: Math.round(Number(view?.pan?.y) || 0)
            },
            coords: 'bounds'
        };
        try {
            localStorage.setItem(projectTaskGraphViewStorageKey(id), JSON.stringify(payload));
        } catch (error) {}
        try {
            const runtime = state();
            if (runtime?.ui) {
                const map = runtime.ui.projectTaskGraphViewByProject || (runtime.ui.projectTaskGraphViewByProject = {});
                map[id] = payload;
                runtime.ui.projectTaskGraphZoom = payload.zoom;
                runtime.ui.projectTaskGraphPan = { ...payload.pan };
            }
        } catch (error) {}
        if (!options.skipSync) queueProjectTaskGraphSync(id, { taskGraphView: payload });
        return payload;
    }

    function persistProjectTaskGraphView(runtime = state(), projectId = '') {
        const id = text(
            projectId
            || runtime?.ui?.activeProjectId
            || activeDialog()?.projectId
            || ''
        );
        if (!id || !runtime?.ui) return null;
        return saveProjectTaskGraphView(id, {
            zoom: runtime.ui.projectTaskGraphZoom,
            pan: runtime.ui.projectTaskGraphPan || { x: 0, y: 0 }
        });
    }

    // --- Task groups (canvas overlay; server sync via taskGraphGroups on project record) ---
    const PROJECT_TASK_GROUP_NODE_W = 264;
    const PROJECT_TASK_GROUP_NODE_H = 228;

    function projectTaskGraphSyncStorageKey(projectId) {
        return `kiu.projectTaskGraph.sync.${text(projectId)}`;
    }

    function seedProjectTaskGraphFromProject(runtime, project) {
        const id = text(project?.id);
        const serverAt = text(project?.taskGraphUpdatedAt || '');
        if (!id || !serverAt) return false;
        const localAt = loadTaskGraphSyncMarker(id);
        const serverMs = Date.parse(serverAt);
        const localMs = Date.parse(localAt);
        // Already applied this server snapshot (or keep newer local edits).
        // Using `>` only caused re-seed on every getGroups call when localAt === serverAt,
        // which re-entered render via notifyProjectTaskGraphSurfaceChanged (stack overflow).
        if (localAt && Number.isFinite(localMs) && Number.isFinite(serverMs) && localMs >= serverMs) return false;
        const skip = { skipSync: true, skipNotify: true };
        const positions = project?.taskGraphPositions && typeof project.taskGraphPositions === 'object' && !Array.isArray(project.taskGraphPositions)
            ? project.taskGraphPositions
            : null;
        if (positions && Object.keys(positions).length) {
            setProjectTaskGraphPositions(runtime, id, positions, skip);
        }
        if (project?.taskGraphView && typeof project.taskGraphView === 'object') {
            // Ignore legacy world-origin pans — they open looking at empty canvas.
            if (text(project.taskGraphView.coords || '') === 'bounds') {
                saveProjectTaskGraphView(id, project.taskGraphView, skip);
                if (runtime?.ui) {
                    runtime.ui.projectTaskGraphZoom = project.taskGraphView.zoom;
                    runtime.ui.projectTaskGraphPan = { ...(project.taskGraphView.pan || { x: 0, y: 0 }) };
                }
            }
        }
        if (Array.isArray(project?.taskGraphGroups) && project.taskGraphGroups.length) {
            setProjectTaskGraphGroups(runtime, id, project.taskGraphGroups, { ...skip, skipSync: true });
        }
        saveTaskGraphSyncMarker(id, serverAt);
        return true;
    }

    function queueProjectTaskGraphSync(projectId, patch = {}) {
        const id = text(projectId);
        if (!id || !patch || typeof patch !== 'object' || typeof updatePortalSocialProjectTaskGraph !== 'function') return;
        const runtime = state();
        const project = resolveActiveSocialProject(runtime, id);
        if (!project?.viewerCanContribute) return;
        const pending = taskGraphSyncPending.get(id) || {};
        taskGraphSyncPending.set(id, { ...pending, ...patch });
        if (taskGraphSyncTimers.has(id)) clearTimeout(taskGraphSyncTimers.get(id));
        taskGraphSyncTimers.set(id, setTimeout(() => {
            const body = taskGraphSyncPending.get(id) || {};
            taskGraphSyncPending.delete(id);
            taskGraphSyncTimers.delete(id);
            updatePortalSocialProjectTaskGraph(id, body)
                .then((updated) => {
                    if (updated?.taskGraphUpdatedAt) saveTaskGraphSyncMarker(id, updated.taskGraphUpdatedAt);
                })
                .catch(() => null);
        }, 500));
    }

    function projectTaskGraphGroupsStorageKey(id) {
        return `kiu.social.ptgroups.${text(id)}`;
    }

    function getProjectTaskGraphGroups(runtime = state(), projectId = '') {
        const id = text(projectId);
        if (!id) return [];
        const project = resolveActiveSocialProject(runtime, id);
        if (project) seedProjectTaskGraphFromProject(runtime, project);
        const cache = runtime?.ui?.projectTaskGraphGroupsByProject;
        if (cache && Array.isArray(cache[id])) return cache[id];
        let list = [];
        try {
            const raw = localStorage.getItem(projectTaskGraphGroupsStorageKey(id));
            if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) list = parsed; }
        } catch (error) {}
        if (runtime?.ui) (runtime.ui.projectTaskGraphGroupsByProject || (runtime.ui.projectTaskGraphGroupsByProject = {}))[id] = list;
        return list;
    }

    function setProjectTaskGraphGroups(runtime, projectId, groups, options = {}) {
        const id = text(projectId);
        if (!id) return;
        const list = Array.isArray(groups) ? groups : [];
        if (runtime?.ui) (runtime.ui.projectTaskGraphGroupsByProject || (runtime.ui.projectTaskGraphGroupsByProject = {}))[id] = list;
        try { localStorage.setItem(projectTaskGraphGroupsStorageKey(id), JSON.stringify(list)); } catch (error) {}
        if (!options.skipSync) queueProjectTaskGraphSync(id, { taskGraphGroups: list });
        // Membership drives Work Desk package lanes — keep desk/preview in sync with graph.
        if (!options.skipNotify && !options.skipSync) {
            notifyProjectTaskGraphSurfaceChanged(id);
            refreshDeskAfterGraphMembership(id);
        }
    }

    function projectTaskGraphCheckpointStorageKey(projectId) {
        return `kiu.social.ptgraph.checkpoint.${text(projectId)}`;
    }

    function projectTaskGraphCheckpointsStorageKey(projectId) {
        return `kiu.social.ptgraph.checkpoints.${text(projectId)}`;
    }

    function formatProjectTaskGraphCheckpointWhen(iso) {
        const ms = Date.parse(text(iso || ''));
        if (!Number.isFinite(ms)) return '';
        try {
            return new Date(ms).toLocaleString();
        } catch (error) {
            return text(iso);
        }
    }

    function pulseProjectTaskGraphCheckpointButton(btn) {
        if (!btn?.classList) return;
        btn.classList.remove('is-click-pulse');
        // Restart CSS animation if already running.
        try { void btn.offsetWidth; } catch (error) {}
        btn.classList.add('is-click-pulse');
        window.setTimeout(() => {
            try { btn.classList.remove('is-click-pulse'); } catch (error) {}
        }, 450);
    }

    function normalizeProjectTaskGraphCheckpointEntry(raw) {
        if (!raw || typeof raw !== 'object') return null;
        const savedAt = text(raw.savedAt) || new Date().toISOString();
        const id = text(raw.id) || `snap_${Date.parse(savedAt) || Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const when = formatProjectTaskGraphCheckpointWhen(savedAt);
        return {
            id,
            savedAt,
            label: text(raw.label) || (when ? `Save · ${when}` : 'Save'),
            taskGraphPositions: raw.taskGraphPositions && typeof raw.taskGraphPositions === 'object' ? raw.taskGraphPositions : {},
            taskGraphGroups: Array.isArray(raw.taskGraphGroups) ? raw.taskGraphGroups : [],
            taskGraphView: raw.taskGraphView && typeof raw.taskGraphView === 'object'
                ? raw.taskGraphView
                : { zoom: 1, pan: { x: 0, y: 0 } },
            taskDepends: raw.taskDepends && typeof raw.taskDepends === 'object' ? raw.taskDepends : {}
        };
    }

    function readProjectTaskGraphCheckpoints(projectId) {
        const id = text(projectId);
        if (!id) return [];
        let list = [];
        try {
            const raw = localStorage.getItem(projectTaskGraphCheckpointsStorageKey(id));
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) list = parsed.map(normalizeProjectTaskGraphCheckpointEntry).filter(Boolean);
            }
        } catch (error) {}
        // Migrate legacy single checkpoint once.
        if (!list.length) {
            try {
                const legacyRaw = localStorage.getItem(projectTaskGraphCheckpointStorageKey(id));
                if (legacyRaw) {
                    const legacy = normalizeProjectTaskGraphCheckpointEntry(JSON.parse(legacyRaw));
                    if (legacy) {
                        list = [legacy];
                        writeProjectTaskGraphCheckpoints(id, list);
                    }
                }
            } catch (error) {}
        }
        return list;
    }

    function writeProjectTaskGraphCheckpoints(projectId, list) {
        const id = text(projectId);
        if (!id) return [];
        const next = (Array.isArray(list) ? list : [])
            .map(normalizeProjectTaskGraphCheckpointEntry)
            .filter(Boolean)
            .slice(0, PROJECT_TASK_GRAPH_CHECKPOINT_MAX);
        try {
            localStorage.setItem(projectTaskGraphCheckpointsStorageKey(id), JSON.stringify(next));
        } catch (error) {
            throw new Error('Could not save checkpoint history (storage full or blocked).');
        }
        return next;
    }

    /** Latest checkpoint (compat helper). */

    function readProjectTaskGraphCheckpoint(projectId) {
        return readProjectTaskGraphCheckpoints(projectId)[0] || null;
    }

    function getProjectTaskGraphCheckpointById(projectId, snapshotId) {
        const want = text(snapshotId);
        if (!want) return null;
        return readProjectTaskGraphCheckpoints(projectId).find((entry) => text(entry.id) === want) || null;
    }

    function deleteProjectTaskGraphCheckpoint(projectId, snapshotId) {
        const want = text(snapshotId);
        if (!want) return readProjectTaskGraphCheckpoints(projectId);
        return writeProjectTaskGraphCheckpoints(
            projectId,
            readProjectTaskGraphCheckpoints(projectId).filter((entry) => text(entry.id) !== want)
        );
    }

    /** Flush debounced graph sync immediately (and send an optional extra patch). */

    function flushProjectTaskGraphSync(projectId, extraPatch = null) {
        const id = text(projectId);
        if (!id || typeof updatePortalSocialProjectTaskGraph !== 'function') return Promise.resolve(null);
        const runtime = state();
        const project = resolveActiveSocialProject(runtime, id);
        if (!project?.viewerCanContribute) return Promise.resolve(null);
        if (taskGraphSyncTimers.has(id)) {
            clearTimeout(taskGraphSyncTimers.get(id));
            taskGraphSyncTimers.delete(id);
        }
        const pending = taskGraphSyncPending.get(id) || {};
        taskGraphSyncPending.delete(id);
        const body = {
            ...pending,
            ...(extraPatch && typeof extraPatch === 'object' ? extraPatch : {})
        };
        if (!Object.keys(body).length) return Promise.resolve(null);
        return updatePortalSocialProjectTaskGraph(id, body)
            .then((updated) => {
                if (updated?.taskGraphUpdatedAt) saveTaskGraphSyncMarker(id, updated.taskGraphUpdatedAt);
                return updated;
            })
            .catch((error) => {
                console.error('[Social] Task graph sync failed:', error);
                return null;
            });
    }

    function collectProjectTaskGraphCheckpoint(runtime, projectId) {
        const id = text(projectId);
        const project = resolveActiveSocialProject(runtime, id);
        if (!project) return null;
        const host = getProjectTaskGraphHost();
        const svg = host?.querySelector('[data-project-task-graph-svg]');
        const live = typeof readProjectTaskGraphLivePositions === 'function'
            ? readProjectTaskGraphLivePositions(svg)
            : {};
        const saved = getProjectTaskGraphPositions(runtime, id) || {};
        const positions = { ...saved, ...live };
        // Prefer live group node positions when open.
        if (svg) {
            svg.querySelectorAll('.social-project-task-graph-group-node').forEach((node) => {
                const gid = text(node.getAttribute('data-group-id') || node.getAttribute('data-task-id'));
                if (!gid) return;
                const x = Number(node.getAttribute('data-cx'));
                const y = Number(node.getAttribute('data-cy'));
                if (Number.isFinite(x) && Number.isFinite(y)) positions[gid] = { x, y };
            });
        }
        const groups = getProjectTaskGraphGroups(runtime, id).map((g) => {
            const gid = text(g?.id);
            const pos = positions[gid];
            return {
                id: gid,
                name: text(g?.name || 'Package'),
                x: pos && Number.isFinite(pos.x) ? pos.x : (Number(g?.x) || 0),
                y: pos && Number.isFinite(pos.y) ? pos.y : (Number(g?.y) || 0),
                memberTaskIds: (Array.isArray(g?.memberTaskIds) ? g.memberTaskIds : []).map(text).filter(Boolean),
                dependsOnIds: projectGroupDependsOnIds(g),
                blocksIds: projectGroupBlocksIds(g)
            };
        }).filter((g) => g.id);
        const zoom = clampProjectTaskGraphZoom(Number(runtime.ui?.projectTaskGraphZoom) || 1);
        const pan = readProjectTaskGraphPan(runtime);
        const taskDepends = {};
        (Array.isArray(project.tasks) ? project.tasks : []).forEach((task) => {
            const tid = text(task?.id);
            if (!tid) return;
            taskDepends[tid] = projectTaskDependsOnIds(task);
        });
        const savedAt = new Date().toISOString();
        const when = formatProjectTaskGraphCheckpointWhen(savedAt);
        return {
            id: `snap_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
            savedAt,
            label: when ? `Save · ${when}` : 'Save',
            taskGraphPositions: positions,
            taskGraphGroups: groups,
            taskGraphView: { zoom, pan: { x: pan.x, y: pan.y } },
            taskDepends
        };
    }

    async function saveProjectTaskGraphCheckpoint(runtime, projectId) {
        const id = text(projectId);
        const snapshot = collectProjectTaskGraphCheckpoint(runtime, id);
        if (!snapshot) throw new Error('Nothing to save.');
        const history = [snapshot, ...readProjectTaskGraphCheckpoints(id)];
        writeProjectTaskGraphCheckpoints(id, history);
        // Persist live layout into normal stores + push server now.
        setProjectTaskGraphPositions(runtime, id, snapshot.taskGraphPositions, { skipSync: true });
        setProjectTaskGraphGroups(runtime, id, snapshot.taskGraphGroups, { skipSync: true, skipNotify: true });
        saveProjectTaskGraphView(id, snapshot.taskGraphView, { skipSync: true });
        const synced = await flushProjectTaskGraphSync(id, {
            taskGraphPositions: snapshot.taskGraphPositions,
            taskGraphGroups: snapshot.taskGraphGroups,
            taskGraphView: snapshot.taskGraphView
        });
        snapshot.serverSynced = Boolean(synced);
        return snapshot;
    }

    async function applyProjectTaskGraphCheckpointSnapshot(runtime, projectId, snapshot) {
        const id = text(projectId);
        if (!snapshot) throw new Error('Save not found.');
        const positions = snapshot.taskGraphPositions && typeof snapshot.taskGraphPositions === 'object'
            ? snapshot.taskGraphPositions
            : {};
        const groups = Array.isArray(snapshot.taskGraphGroups) ? snapshot.taskGraphGroups : [];
        const view = snapshot.taskGraphView && typeof snapshot.taskGraphView === 'object'
            ? snapshot.taskGraphView
            : { zoom: 1, pan: { x: 0, y: 0 } };
        setProjectTaskGraphPositions(runtime, id, positions, { skipSync: true });
        setProjectTaskGraphGroups(runtime, id, groups, { skipSync: true, skipNotify: true });
        saveProjectTaskGraphView(id, view, { skipSync: true });
        runtime.ui.projectTaskGraphZoom = clampProjectTaskGraphZoom(Number(view.zoom) || 1);
        runtime.ui.projectTaskGraphPan = {
            x: Math.round(Number(view.pan?.x) || 0),
            y: Math.round(Number(view.pan?.y) || 0)
        };

        const taskDepends = snapshot.taskDepends && typeof snapshot.taskDepends === 'object'
            ? snapshot.taskDepends
            : {};
        const project = resolveActiveSocialProject(runtime, id);
        const tasks = Array.isArray(project?.tasks) ? project.tasks : [];
        for (const task of tasks) {
            const tid = text(task?.id);
            if (!tid || !Object.prototype.hasOwnProperty.call(taskDepends, tid)) continue;
            const nextDeps = uniqueStrings((Array.isArray(taskDepends[tid]) ? taskDepends[tid] : []).map(text).filter(Boolean));
            const curDeps = projectTaskDependsOnIds(task);
            if (nextDeps.length === curDeps.length && nextDeps.every((d) => curDeps.includes(d))) continue;
            try {
                if (typeof updatePortalSocialProjectTask === 'function') {
                    await updatePortalSocialProjectTask(id, tid, { dependsOnTaskIds: nextDeps }, { silent: true });
                } else {
                    patchLocalProjectTaskDepends(runtime, id, tid, nextDeps);
                }
            } catch (error) {
                patchLocalProjectTaskDepends(runtime, id, tid, nextDeps);
            }
        }

        groups.forEach((group) => {
            const gid = text(group?.id);
            projectGroupBlocksIds(group).forEach((taskId) => {
                const task = tasks.find((t) => text(t?.id) === text(taskId));
                if (!task) return;
                const deps = projectTaskDependsOnIds(task);
                if (deps.includes(gid)) return;
                patchLocalProjectTaskDepends(runtime, id, taskId, [...deps, gid]);
            });
        });

        await flushProjectTaskGraphSync(id, {
            taskGraphPositions: positions,
            taskGraphGroups: groups,
            taskGraphView: view
        });
        notifyProjectTaskGraphSurfaceChanged(id);
        refreshDeskAfterGraphMembership(id);
        return snapshot;
    }

    async function restoreProjectTaskGraphCheckpoint(runtime, projectId, snapshotId = '') {
        const id = text(projectId);
        const snapshot = text(snapshotId)
            ? getProjectTaskGraphCheckpointById(id, snapshotId)
            : readProjectTaskGraphCheckpoint(id);
        if (!snapshot) throw new Error('No saved graph yet. Click Save first.');
        return applyProjectTaskGraphCheckpointSnapshot(runtime, id, snapshot);
    }

    function createProjectTaskGraphGroup(runtime, projectId, { name, x, y } = {}) {
        const groups = getProjectTaskGraphGroups(runtime, projectId).slice();
        const group = {
            id: `grp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
            name: text(name) || 'New group',
            x: Math.round(Number(x) || 160),
            y: Math.round(Number(y) || 160),
            memberTaskIds: [],
            dependsOnIds: [],
            blocksIds: [],
            assigneeUserId: '',
            description: ''
        };
        groups.push(group);
        setProjectTaskGraphGroups(runtime, projectId, groups);
        return group;
    }

    function updateProjectTaskGraphGroup(runtime, projectId, groupId, patch = {}) {
        setProjectTaskGraphGroups(runtime, projectId, getProjectTaskGraphGroups(runtime, projectId).map((g) => (text(g.id) === text(groupId) ? { ...g, ...patch } : g)));
    }

    function deleteProjectTaskGraphGroup(runtime, projectId, groupId) {
        const gid = text(groupId);
        if (!gid) return;
        const nextGroups = getProjectTaskGraphGroups(runtime, projectId)
            .filter((g) => text(g.id) !== gid)
            .map((g) => ({
                ...g,
                dependsOnIds: projectGroupDependsOnIds(g).filter((id) => id !== gid),
                blocksIds: projectGroupBlocksIds(g).filter((id) => id !== gid)
            }));
        setProjectTaskGraphGroups(runtime, projectId, nextGroups);
        // Scrub dual-written package ids from task dependency lists.
        const project = resolveActiveSocialProject(runtime, projectId);
        (Array.isArray(project?.tasks) ? project.tasks : []).forEach((task) => {
            const tid = text(task?.id);
            if (!tid) return;
            const deps = projectTaskDependsOnIds(task);
            if (!deps.includes(gid)) return;
            patchLocalProjectTaskDepends(runtime, projectId, tid, deps.filter((id) => id !== gid));
        });
        // Drop free-placed package coords so orphans do not inflate bounds.
        const saved = getProjectTaskGraphPositions(runtime, projectId);
        if (saved && saved[gid]) {
            const next = { ...saved };
            delete next[gid];
            setProjectTaskGraphPositions(runtime, projectId, next, { skipNotify: true });
        }
    }

    function scrubDeletedTaskFromProjectTaskGraphGroups(runtime, projectId, taskId) {
        const tid = text(taskId);
        if (!tid) return;
        const groups = getProjectTaskGraphGroups(runtime, projectId);
        let changed = false;
        const next = groups.map((g) => {
            const members = (Array.isArray(g?.memberTaskIds) ? g.memberTaskIds : []).map(text).filter(Boolean);
            const blocks = projectGroupBlocksIds(g);
            const deps = projectGroupDependsOnIds(g);
            const nextMembers = members.filter((id) => id !== tid);
            const nextBlocks = blocks.filter((id) => id !== tid);
            const nextDeps = deps.filter((id) => id !== tid);
            if (
                nextMembers.length === members.length
                && nextBlocks.length === blocks.length
                && nextDeps.length === deps.length
            ) return g;
            changed = true;
            return {
                ...g,
                memberTaskIds: nextMembers,
                blocksIds: nextBlocks,
                dependsOnIds: nextDeps
            };
        });
        if (changed) setProjectTaskGraphGroups(runtime, projectId, next);
        const saved = getProjectTaskGraphPositions(runtime, projectId);
        if (saved && saved[tid]) {
            const nextPos = { ...saved };
            delete nextPos[tid];
            setProjectTaskGraphPositions(runtime, projectId, nextPos, { skipNotify: true });
        }
    }

    function projectTaskGraphGroupMembershipWouldCycle(groups, parentGroupId, childId) {
        const parent = text(parentGroupId);
        const child = text(childId);
        if (!parent || !child || parent === child) return true;
        if (!isProjectTaskGraphGroupId(child)) return false;
        const byId = new Map((Array.isArray(groups) ? groups : []).map((g) => [text(g?.id), g]).filter(([id]) => id));
        const stack = [child];
        const seen = new Set();
        while (stack.length) {
            const cur = stack.pop();
            if (!cur || seen.has(cur)) continue;
            if (cur === parent) return true;
            seen.add(cur);
            const group = byId.get(cur);
            (Array.isArray(group?.memberTaskIds) ? group.memberTaskIds : []).forEach((id) => {
                const mid = text(id);
                if (mid && isProjectTaskGraphGroupId(mid)) stack.push(mid);
            });
        }
        return false;
    }

    function toggleProjectTaskGraphGroupMember(runtime, projectId, groupId, taskId, add = true) {
        const tid = text(taskId);
        const gid = text(groupId);
        if (!tid || !gid) return;
        const groups = getProjectTaskGraphGroups(runtime, projectId);
        if (add && projectTaskGraphGroupMembershipWouldCycle(groups, gid, tid)) return;
        setProjectTaskGraphGroups(runtime, projectId, groups.map((g) => {
            if (text(g.id) !== gid) return g;
            const members = (Array.isArray(g.memberTaskIds) ? g.memberTaskIds : []).map(text).filter(Boolean);
            const has = members.includes(tid);
            return { ...g, memberTaskIds: add ? (has ? members : [...members, tid]) : members.filter((m) => m !== tid) };
        }));
    }

    function isProjectTaskGraphGroupId(id) {
        return text(id).startsWith('grp_');
    }

    function projectGroupDependsOnIds(group) {
        return uniqueStrings((Array.isArray(group?.dependsOnIds) ? group.dependsOnIds : []).map((id) => text(id)).filter(Boolean));
    }

    /** Tasks that wait on this package (group is predecessor). Local-reliable for group→task wires. */

    function projectGroupBlocksIds(group) {
        return uniqueStrings((Array.isArray(group?.blocksIds) ? group.blocksIds : []).map((id) => text(id)).filter(Boolean));
    }

    /** Collect leaf task ids under a package: nested members + order-linked packages/tasks (and their members). */

    function collectProjectTaskGraphGroupDescendantTaskIds(group, groups = [], options = {}) {
        const includeOrderLinks = options.includeOrderLinks !== false;
        const byGroup = new Map((Array.isArray(groups) ? groups : []).map((g) => [text(g?.id), g]).filter(([id]) => id));
        const taskIds = [];
        const seenGroups = new Set();
        const seenTasks = new Set();
        const visitGroup = (g) => {
            const gid = text(g?.id);
            if (!gid || seenGroups.has(gid)) return;
            seenGroups.add(gid);
            (Array.isArray(g?.memberTaskIds) ? g.memberTaskIds : []).forEach((raw) => {
                const id = text(raw);
                if (!id) return;
                if (isProjectTaskGraphGroupId(id)) {
                    const child = byGroup.get(id);
                    if (child) visitGroup(child);
                    return;
                }
                if (seenTasks.has(id)) return;
                seenTasks.add(id);
                taskIds.push(id);
            });
            if (!includeOrderLinks) return;
            // Connected children via order wires (package → task/package).
            uniqueStrings([
                ...projectGroupBlocksIds(g),
                ...projectGroupDependsOnIds(g)
            ]).forEach((id) => {
                if (!id || id === gid) return;
                if (isProjectTaskGraphGroupId(id)) {
                    const linked = byGroup.get(id);
                    if (linked) visitGroup(linked);
                    return;
                }
                if (seenTasks.has(id)) return;
                seenTasks.add(id);
                taskIds.push(id);
            });
        };
        visitGroup(group);
        return taskIds;
    }

    /**
     * Package rollup absorption: membership tree + direct order-linked tasks, then
     * walk dependents only (children of children). No upstream flood.
     */

    function collectProjectTaskGraphGroupAbsorbedTaskIds(group, project, groups = []) {
        const tasks = Array.isArray(project?.tasks) ? project.tasks : [];
        const byId = new Map(tasks.map((t) => [text(t?.id), t]).filter(([id]) => id));
        const groupList = Array.isArray(groups) ? groups : [];
        const byGroup = new Map(groupList.map((g) => [text(g?.id), g]).filter(([id]) => id));

        const packageIds = new Set();
        const pkgStack = [group];
        const seenPkg = new Set();
        while (pkgStack.length) {
            const g = pkgStack.pop();
            const gid = text(g?.id);
            if (!gid || seenPkg.has(gid)) continue;
            seenPkg.add(gid);
            packageIds.add(gid);
            (Array.isArray(g?.memberTaskIds) ? g.memberTaskIds : []).forEach((raw) => {
                const id = text(raw);
                if (id && isProjectTaskGraphGroupId(id) && byGroup.has(id)) pkgStack.push(byGroup.get(id));
            });
        }

        const dependentsOf = new Map();
        tasks.forEach((task) => {
            const tid = text(task?.id);
            if (!tid) return;
            projectTaskDependsOnIds(task).forEach((dep) => {
                if (!dependentsOf.has(dep)) dependentsOf.set(dep, []);
                dependentsOf.get(dep).push(tid);
            });
        });

        const seeds = new Set(
            collectProjectTaskGraphGroupDescendantTaskIds(group, groupList, { includeOrderLinks: false })
                .filter((id) => byId.has(id))
        );

        packageIds.forEach((pid) => {
            const g = byGroup.get(pid) || (text(group?.id) === pid ? group : null);
            if (!g) return;
            uniqueStrings([...projectGroupBlocksIds(g), ...projectGroupDependsOnIds(g)]).forEach((id) => {
                if (!id || packageIds.has(id)) return;
                if (isProjectTaskGraphGroupId(id)) {
                    const linked = byGroup.get(id);
                    if (!linked) return;
                    collectProjectTaskGraphGroupDescendantTaskIds(linked, groupList, { includeOrderLinks: false })
                        .forEach((tid) => {
                            if (byId.has(tid)) seeds.add(tid);
                        });
                    return;
                }
                if (byId.has(id)) seeds.add(id);
            });
        });

        tasks.forEach((task) => {
            const tid = text(task?.id);
            if (!tid || !byId.has(tid)) return;
            if (projectTaskDependsOnIds(task).some((dep) => packageIds.has(dep))) seeds.add(tid);
        });

        const found = new Set();
        const queue = [...seeds];
        while (queue.length) {
            const id = text(queue.shift());
            if (!id || found.has(id) || packageIds.has(id) || isProjectTaskGraphGroupId(id)) continue;
            if (!byId.has(id)) continue;
            found.add(id);
            // Downstream only — tasks waiting on this seed.
            (dependentsOf.get(id) || []).forEach((tid) => queue.push(tid));
        }
        return [...found];
    }

    /** Group is "done" for sequencing when every descendant task is done (empty group = done). */

    function isProjectTaskGraphGroupComplete(group, taskById = new Map(), groups = []) {
        const members = collectProjectTaskGraphGroupDescendantTaskIds(group, groups, { includeOrderLinks: false });
        if (!members.length) return true;
        return members.every((id) => {
            const task = taskById.get(id);
            return task && normalizeProjectTaskStatusId(task?.status) === 'done';
        });
    }

    function isProjectGraphDependencyOpen(depId, { tasks = [], groups = [], taskById = null } = {}) {
        const id = text(depId);
        if (!id) return false;
        const byId = taskById instanceof Map
            ? taskById
            : new Map((Array.isArray(tasks) ? tasks : []).map((t) => [text(t?.id), t]).filter(([k]) => k));
        if (isProjectTaskGraphGroupId(id)) {
            const group = (Array.isArray(groups) ? groups : []).find((g) => text(g?.id) === id);
            if (!group) return false;
            // Group open if any descendant task open OR any of its own deps open
            if (!isProjectTaskGraphGroupComplete(group, byId, groups)) return true;
            return projectGroupDependsOnIds(group).some((gid) => isProjectGraphDependencyOpen(gid, { tasks, groups, taskById: byId }));
        }
        const task = byId.get(id);
        return Boolean(task && normalizeProjectTaskStatusId(task?.status) !== 'done');
    }

    function computeProjectTaskGraphGroupRollup(group, project, options = {}) {
        const allTasks = Array.isArray(project?.tasks) ? project.tasks : [];
        const byId = new Map(allTasks.map((t) => [text(t.id), t]));
        const groups = (() => {
            if (Array.isArray(options.groups)) return options.groups;
            try {
                return getProjectTaskGraphGroups(state(), text(project?.id));
            } catch (error) {
                return Array.isArray(project?.taskGraphGroups) ? project.taskGraphGroups : [];
            }
        })();
        const directIds = (Array.isArray(group?.memberTaskIds) ? group.memberTaskIds : []).map(text).filter(Boolean);
        // Membership tree vs absorbed set (members + order seeds + downstream children).
        const memberOnlyIds = collectProjectTaskGraphGroupDescendantTaskIds(group, groups, { includeOrderLinks: false })
            .filter((id) => byId.has(id));
        const descendantIds = collectProjectTaskGraphGroupAbsorbedTaskIds(group, project, groups)
            .filter((id) => byId.has(id));
        const members = descendantIds.map((id) => byId.get(id)).filter(Boolean);
        const memberIdSet = new Set(memberOnlyIds);

        const currency = text(project?.budgetCurrency || '') || 'USD';
        const now = Date.now();
        let budget = 0;
        let actualCost = 0;
        let done = 0;
        let blocked = 0;
        let overdue = 0;
        let unassigned = 0;
        let inProgress = 0;
        let hoursTotal = 0;
        let hoursDone = 0;
        let actualHours = 0;
        let startMs = Infinity;
        let dueMs = -Infinity;
        const ownerIds = new Set();
        members.forEach((t) => {
            budget += Number(t.budgetEstimate) || 0;
            actualCost += Math.max(0, Number(t.actualCost) || 0);
            const statusId = normalizeProjectTaskStatusId(t?.status);
            const isDone = statusId === 'done';
            if (isDone) done += 1;
            if (statusId === 'blocked') blocked += 1;
            if (statusId === 'in-progress') inProgress += 1;
            const hours = Math.max(0, Number(taskDurationHours(t)) || 0);
            if (hours > 0) {
                hoursTotal += hours;
                if (isDone) hoursDone += hours;
            }
            const act = normalizeTaskTime(t?.actualTime);
            if (act > 0) {
                actualHours += normalizeTaskTimeUnit(t?.timeUnit) === 'd' ? act * 8 : act;
            }
            const s = Date.parse(text(t?.startAt || ''));
            const d = Date.parse(text(t?.dueAt || ''));
            if (Number.isFinite(s)) startMs = Math.min(startMs, s);
            if (Number.isFinite(d)) {
                dueMs = Math.max(dueMs, d);
                if (!isDone && d < now) overdue += 1;
            }
            const owner = text(t?.assigneeUserId || '');
            if (owner) ownerIds.add(owner);
            else if (!isDone && !t?.isMilestone) unassigned += 1;
        });

        const schedule = options.schedule && typeof options.schedule === 'object'
            ? options.schedule
            : (members.length
                ? (() => {
                    try { return computeProjectSchedule(project, { groups }); }
                    catch (error) { return null; }
                })()
                : null);

        let critical = 0;
        let criticalBlocked = 0;
        let memberCritical = 0;
        let minFloatHours = null;
        if (schedule?.byId) {
            descendantIds.forEach((id) => {
                const row = schedule.byId[id];
                if (!row || row.isGroup || row.isDone) return;
                const rem = Number(row.durationHours) || 0;
                const isCrit = Boolean(row.isCritical) && (rem > 0 || Boolean(byId.get(id)?.isMilestone));
                if (isCrit) {
                    critical += 1;
                    if (row.isBlocked) criticalBlocked += 1;
                    if (memberIdSet.has(id)) memberCritical += 1;
                }
                if (rem > 0 && Number.isFinite(Number(row.floatHours))) {
                    const f = Number(row.floatHours);
                    minFloatHours = minFloatHours == null ? f : Math.min(minFloatHours, f);
                }
            });
        }

        // Remaining makespan of open subtree work (CPM), using deps within the rollup set.
        let pathRemainingHours = 0;
        const openMembers = members.filter((task) => normalizeProjectTaskStatusId(task?.status) !== 'done');
        if (openMembers.length) {
            const idSet = new Set(descendantIds);
            const scopedTasks = openMembers.map((task) => ({
                ...task,
                dependsOnTaskIds: projectTaskDependsOnIds(task).filter((id) => idSet.has(id))
            }));
            try {
                const subSched = computeProjectSchedule(
                    { id: text(project?.id), tasks: scopedTasks },
                    { groups: [] }
                );
                pathRemainingHours = Math.round((Number(subSched?.projectEndHours) || 0) * 10) / 10;
            } catch (error) {
                pathRemainingHours = 0;
            }
        }

        const schedulePackageCritical = Boolean(schedule?.byId?.[text(group?.id)]?.isCritical);
        // Paint package critical from membership / schedule sink — not from distant linked tasks alone.
        const packageCritical = schedulePackageCritical || memberCritical > 0;
        const count = members.length;
        const countPct = count > 0 ? Math.round((done / count) * 100) : 0;
        const hoursPct = hoursTotal > 0 ? Math.round((hoursDone / hoursTotal) * 100) : null;
        const pctComplete = hoursPct == null ? countPct : hoursPct;
        const progressMode = hoursPct == null ? 'count' : 'hours';
        const hoursRemaining = Math.max(0, Math.round((hoursTotal - hoursDone) * 10) / 10);
        const budgetDelta = Math.round((actualCost - budget) * 100) / 100;
        const formatRollDate = (ms) => {
            if (!Number.isFinite(ms) || ms === Infinity || ms === -Infinity) return '';
            try {
                return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            } catch (error) {
                return '';
            }
        };
        return {
            count,
            directCount: directIds.length,
            memberCount: memberOnlyIds.length,
            connectedCount: Math.max(0, descendantIds.length - memberOnlyIds.length),
            done,
            blocked,
            overdue,
            unassigned,
            inProgress,
            critical,
            criticalBlocked,
            memberCritical,
            packageCritical,
            minFloatHours,
            pathRemainingHours,
            budget,
            actualCost,
            budgetDelta,
            currency,
            directIds,
            descendantIds,
            memberOnlyIds,
            countPct,
            hoursPct,
            pctComplete,
            progressMode,
            hoursTotal: Math.round(hoursTotal * 10) / 10,
            hoursDone,
            hoursRemaining,
            actualHours: Math.round(actualHours * 10) / 10,
            startLabel: formatRollDate(startMs),
            dueLabel: formatRollDate(dueMs),
            ownerIds: [...ownerIds],
            hasAttention: blocked > 0 || overdue > 0 || critical > 0 || packageCritical
        };
    }

    /** Order wires involving a package (not membership). For package card / inspector summary. */

    function getProjectTaskGraphGroupLinkSummary(group, project) {
        const gid = text(group?.id);
        const allTasks = Array.isArray(project?.tasks) ? project.tasks : [];
        const byId = new Map(allTasks.map((t) => [text(t.id), t]));
        const groups = (() => {
            try {
                return getProjectTaskGraphGroups(state(), text(project?.id));
            } catch (error) {
                return [];
            }
        })();
        const titleOf = (id) => {
            const key = text(id);
            if (!key) return '';
            if (isProjectTaskGraphGroupId(key)) {
                const g = groups.find((entry) => text(entry?.id) === key);
                return text(g?.name || 'Package');
            }
            const task = byId.get(key);
            return text(task?.title || key);
        };
        const predIds = uniqueStrings([
            ...projectGroupDependsOnIds(group),
            // Tasks that list this package as predecessor live on blocksIds / dual-written deps
        ]);
        const succIds = uniqueStrings([
            ...projectGroupBlocksIds(group)
        ]);
        allTasks.forEach((t) => {
            const tid = text(t?.id);
            if (!tid) return;
            projectTaskDependsOnIds(t).forEach((dep) => {
                if (dep === gid && !succIds.includes(tid)) succIds.push(tid);
            });
        });
        // Also: if another package depends on us — rare; skip for card density
        const predTitles = predIds.map(titleOf).filter(Boolean);
        const succTitles = succIds.map(titleOf).filter(Boolean);
        const orderCount = predIds.length + succIds.length;
        return {
            predIds,
            succIds,
            predTitles,
            succTitles,
            orderCount,
            inCount: predIds.length,
            outCount: succIds.length
        };
    }

    // --- Scheduling: critical path, earliest/latest start, slack/float ---
    // Pure forward/backward pass over durations + dependencies. Duration in hours
    // (days → ×8 workday). Done tasks use 0 remaining duration so float/critical
    // reflect open work only; blocked keeps full PERT (still on the path).
    // A cycle (circular deps) is tolerated: tasks in it get 0 float but never crash.
    // ponytail: O(V+E), 8h workday calendar — no weekends/holidays.

    function computeProjectTaskGraphContentFitView(layout, viewportW = 1100, viewportH = 640, options = {}) {
        const pad = Number.isFinite(Number(options.pad)) ? Number(options.pad) : 48;
        const minZoom = Number.isFinite(Number(options.minZoom)) ? Number(options.minZoom) : PROJECT_TASK_GRAPH_MIN_ZOOM;
        const maxZoom = Number.isFinite(Number(options.maxZoom)) ? Number(options.maxZoom) : 1.15;
        const extraBoxes = Array.isArray(options.extraBoxes) ? options.extraBoxes : [];
        const bounds = projectTaskGraphContentBounds(layout, Math.max(16, Math.round(pad / 2)), extraBoxes);
        const usableW = Math.max(1, (Number(viewportW) || 800) - pad);
        const usableH = Math.max(1, (Number(viewportH) || 600) - pad);
        const zoom = clampProjectTaskGraphZoom(
            Math.min(usableW / Math.max(1, bounds.width), usableH / Math.max(1, bounds.height)),
            { minZoom, maxZoom }
        );
        // Content-bounds SVG maps world (minX,minY) → canvas (0,0). Center in scroll space.
        const pan = {
            x: Math.round((bounds.width * zoom) / 2 - (Number(viewportW) || 800) / 2),
            y: Math.round((bounds.height * zoom) / 2 - (Number(viewportH) || 600) / 2)
        };
        return { zoom, pan, bounds, coords: 'bounds' };
    }

    function buildProjectTaskGraphLayoutForView(runtime, projectId = '') {
        const project = resolveActiveSocialProject(runtime, projectId || runtime?.ui?.activeProjectId || activeDialog()?.projectId);
        if (!project) return null;
        // Full map always shows every project task — desk search/filters must not empty the canvas.
        const projectTasks = Array.isArray(project.tasks) ? project.tasks : [];
        const model = buildProjectTaskGraphModel(projectTasks, {
            showInferred: projectTaskGraphShowInferred(runtime),
            showFlow: projectTaskGraphShowFlow(runtime)
        });
        const stageSize = computeProjectTaskGraphStageSize(runtime);
        let layout = buildProjectTaskGraphLayout(model, runtime, stageSize);
        if (projectTaskGraphLayoutUsesSavedPositions(layout, runtime)) {
            layout = applyProjectTaskGraphSavedPositions(
                layout,
                getProjectTaskGraphPositions(runtime, text(project.id))
            );
        }
        return { project, layout, stageSize, model };
    }

    function applyProjectTaskGraphResetView(runtime = state(), projectId = '') {
        const ctx = buildProjectTaskGraphLayoutForView(runtime, projectId);
        if (!ctx?.layout || !runtime?.ui) return null;
        const host = getProjectTaskGraphHost();
        const canvas = host?.querySelector('[data-project-task-graph-canvas]');
        const viewportW = Math.max(320, Math.round(canvas?.clientWidth || ctx.stageSize.stageWidth || 1100));
        const viewportH = Math.max(240, Math.round(canvas?.clientHeight || ctx.stageSize.stageHeight || 640));
        const pid = text(projectId || ctx.project?.id || '');
        const groupBoxes = collectProjectTaskGraphGroupBoxes(runtime, pid, ctx.layout);
        const fit = computeProjectTaskGraphContentFitView(ctx.layout, viewportW, viewportH, {
            pad: 56,
            minZoom: PROJECT_TASK_GRAPH_MIN_ZOOM,
            maxZoom: 1.15,
            extraBoxes: groupBoxes
        });
        runtime.ui.projectTaskGraphZoom = fit.zoom;
        runtime.ui.projectTaskGraphPan = { x: fit.pan.x, y: fit.pan.y };
        saveProjectTaskGraphView(pid, {
            zoom: fit.zoom,
            pan: fit.pan
        });
        return fit;
    }

    function projectTaskGraphBoxAnchor(cx, cy, halfW, halfH, ux, uy) {
        const tx = Math.abs(ux) > 0.001 ? halfW / Math.abs(ux) : Infinity;
        const ty = Math.abs(uy) > 0.001 ? halfH / Math.abs(uy) : Infinity;
        const t = Math.min(tx, ty);
        return { x: cx + ux * t, y: cy + uy * t };
    }

    // Magnetic multi-side docks + soft-repulsion spline (adaptive wires for every angle).

    function getProjectTaskGraphDocks(pos = {}) {
        const w = pos.w || PROJECT_TASK_GRAPH_CARD_W;
        const h = pos.h || PROJECT_TASK_GRAPH_CARD_H;
        const hw = w / 2;
        const hh = h / 2;
        const x = Number(pos.x) || 0;
        const y = Number(pos.y) || 0;
        return {
            e: { side: 'e', x: x + hw, y, nx: 1, ny: 0 },
            w: { side: 'w', x: x - hw, y, nx: -1, ny: 0 },
            n: { side: 'n', x, y: y - hh, nx: 0, ny: -1 },
            s: { side: 's', x, y: y + hh, nx: 0, ny: 1 }
        };
    }

    function projectTaskGraphDockAlongSide(dock, fan = 0) {
        // Fan slides along the side tangent (perpendicular to outward normal).
        const tx = -dock.ny;
        const ty = dock.nx;
        return {
            ...dock,
            x: dock.x + tx * fan,
            y: dock.y + ty * fan
        };
    }

    function scoreProjectTaskGraphDockPair(fromPos, toPos, sideFrom, sideTo, meta = {}) {
        const fromDocks = getProjectTaskGraphDocks(fromPos);
        const toDocks = getProjectTaskGraphDocks(toPos);
        const a = fromDocks[sideFrom];
        const b = toDocks[sideTo];
        if (!a || !b) return -Infinity;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 1;
        const ux = dx / dist;
        const uy = dy / dist;
        // Prefer leaving along outward normal of source, arriving against outward normal of target (into the side)
        const leaveAlign = a.nx * ux + a.ny * uy;
        const enterAlign = b.nx * (-ux) + b.ny * (-uy);
        let score = leaveAlign * 2.6 + enterAlign * 2.6;
        score -= dist * 0.0035;
        score += Math.min(leaveAlign, enterAlign) * 0.55;
        // Geometric bias: prefer natural sides for primarily H/V relationships (fewer U-turns).
        const cdx = (Number(toPos.x) || 0) - (Number(fromPos.x) || 0);
        const cdy = (Number(toPos.y) || 0) - (Number(fromPos.y) || 0);
        if (Math.abs(cdx) > Math.abs(cdy) * 1.15) {
            if (cdx > 24 && sideFrom === 'e' && sideTo === 'w') score += 1.15;
            if (cdx < -24 && sideFrom === 'w' && sideTo === 'e') score += 1.15;
        } else if (Math.abs(cdy) > Math.abs(cdx) * 1.15) {
            if (cdy > 24 && sideFrom === 's' && sideTo === 'n') score += 1.15;
            if (cdy < -24 && sideFrom === 'n' && sideTo === 's') score += 1.15;
        }
        if (meta.statusLayout && sideFrom === 'e' && sideTo === 'w' && cdx > 20) score += 0.4;
        // Penalize reverse-facing pairs when travel is clearly one way
        if (cdy > 40 && sideFrom === 'n') score -= 0.85;
        if (cdy < -40 && sideFrom === 's') score -= 0.85;
        if (cdx > 40 && sideFrom === 'w') score -= 0.85;
        if (cdx < -40 && sideFrom === 'e') score -= 0.85;
        return score;
    }

    function selectProjectTaskGraphDockPair(fromPos, toPos, meta = {}) {
        const sides = ['e', 'w', 'n', 's'];
        let best = { sideFrom: 'e', sideTo: 'w', score: -Infinity };
        sides.forEach((sf) => {
            sides.forEach((st) => {
                const score = scoreProjectTaskGraphDockPair(fromPos, toPos, sf, st, meta);
                if (score > best.score) best = { sideFrom: sf, sideTo: st, score };
            });
        });
        const fromDock = projectTaskGraphDockAlongSide(getProjectTaskGraphDocks(fromPos)[best.sideFrom], Number(meta.fanOffset) || 0);
        const toDock = projectTaskGraphDockAlongSide(getProjectTaskGraphDocks(toPos)[best.sideTo], -(Number(meta.fanOffset) || 0) * 0.65);
        return {
            sideFrom: best.sideFrom,
            sideTo: best.sideTo,
            fromDock,
            toDock,
            score: best.score
        };
    }

    function buildProjectTaskGraphSeedPolyline(fromDock, toDock, meta = {}) {
        const stub = Math.max(22, Math.min(48, Number(meta.stub) || 32));
        const fan = Number(meta.fanOffset) || 0;
        const p0 = { x: fromDock.x, y: fromDock.y };
        const p1 = {
            x: fromDock.x + fromDock.nx * stub,
            y: fromDock.y + fromDock.ny * stub + fan * 0.1
        };
        const p4 = {
            x: toDock.x + toDock.nx * stub,
            y: toDock.y + toDock.ny * stub - fan * 0.1
        };
        const p5 = { x: toDock.x, y: toDock.y };
        const mx = (p1.x + p4.x) / 2;
        const my = (p1.y + p4.y) / 2;
        // Bend control: push mid slightly perpendicular for separation
        const dx = p4.x - p1.x;
        const dy = p4.y - p1.y;
        const dist = Math.hypot(dx, dy) || 1;
        const px = -dy / dist;
        const py = dx / dist;
        const bend = Math.min(60, Math.max(12, dist * 0.12)) + Math.abs(fan) * 0.25;
        const p2 = { x: p1.x + dx * 0.33 + px * bend * 0.15, y: p1.y + dy * 0.33 + py * bend * 0.15 };
        const p3 = { x: p1.x + dx * 0.66 - px * bend * 0.1, y: p1.y + dy * 0.66 - py * bend * 0.1 };
        return [p0, p1, p2, p3, p4, p5];
    }

    function sampleProjectTaskGraphPolyline(points = [], count = 22) {
        const pts = Array.isArray(points) ? points : [];
        if (pts.length < 2) return pts.map((p) => ({ x: p.x, y: p.y }));
        // Arc-length-ish sampling along segments
        const segs = [];
        let total = 0;
        for (let i = 0; i < pts.length - 1; i++) {
            const len = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y) || 0.001;
            segs.push({ a: pts[i], b: pts[i + 1], len, acc: total });
            total += len;
        }
        const n = Math.max(8, count | 0);
        const out = [];
        for (let i = 0; i < n; i++) {
            const t = i / (n - 1);
            const dist = t * total;
            let seg = segs[segs.length - 1];
            for (let s = 0; s < segs.length; s++) {
                if (dist <= segs[s].acc + segs[s].len) {
                    seg = segs[s];
                    break;
                }
            }
            const local = Math.min(1, Math.max(0, (dist - seg.acc) / seg.len));
            out.push({
                x: seg.a.x + (seg.b.x - seg.a.x) * local,
                y: seg.a.y + (seg.b.y - seg.a.y) * local
            });
        }
        return out;
    }

    function projectTaskGraphPushOutOfRect(point, rect, margin = 12) {
        const left = rect.x - rect.w / 2 - margin;
        const right = rect.x + rect.w / 2 + margin;
        const top = rect.y - rect.h / 2 - margin;
        const bottom = rect.y + rect.h / 2 + margin;
        if (point.x <= left || point.x >= right || point.y <= top || point.y >= bottom) {
            return point;
        }
        const dl = point.x - left;
        const dr = right - point.x;
        const dt = point.y - top;
        const db = bottom - point.y;
        const m = Math.min(dl, dr, dt, db);
        if (m === dl) return { x: left - 1, y: point.y };
        if (m === dr) return { x: right + 1, y: point.y };
        if (m === dt) return { x: point.x, y: top - 1 };
        return { x: point.x, y: bottom + 1 };
    }

    function relaxProjectTaskGraphPolyline(points = [], obstacles = [], options = {}) {
        const samples = sampleProjectTaskGraphPolyline(points, options.samples || 22);
        if (samples.length < 3) return samples;
        const iters = options.iterations || 6;
        const margin = options.margin || 12;
        const smooth = options.smooth ?? 0.38;
        const obstaclesList = Array.isArray(obstacles) ? obstacles : [];
        for (let iter = 0; iter < iters; iter++) {
            for (let i = 1; i < samples.length - 1; i++) {
                let p = samples[i];
                obstaclesList.forEach((obs) => {
                    if (!obs) return;
                    p = projectTaskGraphPushOutOfRect(p, obs, margin);
                });
                samples[i] = p;
            }
            // Laplacian smooth (keep endpoints fixed)
            const next = samples.map((p) => ({ ...p }));
            for (let i = 1; i < samples.length - 1; i++) {
                next[i] = {
                    x: samples[i].x * (1 - smooth) + (samples[i - 1].x + samples[i + 1].x) * 0.5 * smooth,
                    y: samples[i].y * (1 - smooth) + (samples[i - 1].y + samples[i + 1].y) * 0.5 * smooth
                };
            }
            for (let i = 1; i < samples.length - 1; i++) samples[i] = next[i];
        }
        return samples;
    }

    function normalizeProjectTaskGraphStatusId(statusId = 'todo') {
        const raw = text(statusId || 'todo') || 'todo';
        if (raw === 'backlog') return 'todo';
        return PROJECT_TASK_STATUS_EDGE_COLOR[raw] ? raw : 'todo';
    }

    function projectTaskGraphStatusEdgeColor(statusId = 'todo') {
        return PROJECT_TASK_STATUS_EDGE_COLOR[normalizeProjectTaskGraphStatusId(statusId)] || PROJECT_TASK_STATUS_EDGE_COLOR.todo;
    }

    /**
     * Clean node-editor cubic: leave along source normal, arrive along target normal.
     * No multi-obstacle repulsion (that caused spaghetti bends).
     */

    function projectTaskGraphCubicEdgePath(fromDock, toDock, meta = {}) {
        const p0x = Number(fromDock.x) || 0;
        const p0y = Number(fromDock.y) || 0;
        const p3x = Number(toDock.x) || 0;
        const p3y = Number(toDock.y) || 0;
        const dx = p3x - p0x;
        const dy = p3y - p0y;
        const dist = Math.hypot(dx, dy) || 1;
        const tension = Math.max(36, Math.min(120, dist * 0.42));
        const fan = Number(meta.fanOffset) || 0;
        // Tangent along side for fanning parallel wires
        const fTx = -Number(fromDock.ny) || 0;
        const fTy = Number(fromDock.nx) || 0;
        const tTx = -Number(toDock.ny) || 0;
        const tTy = Number(toDock.nx) || 0;
        const c1x = p0x + (Number(fromDock.nx) || 0) * tension + fTx * fan * 0.4;
        const c1y = p0y + (Number(fromDock.ny) || 0) * tension + fTy * fan * 0.4;
        const c2x = p3x + (Number(toDock.nx) || 0) * tension + tTx * fan * 0.3;
        const c2y = p3y + (Number(toDock.ny) || 0) * tension + tTy * fan * 0.3;
        // Midpoint of cubic at t=0.5 for unlink control
        const t = 0.5;
        const u = 1 - t;
        const midX = u * u * u * p0x + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * p3x;
        const midY = u * u * u * p0y + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * p3y;
        const d = `M ${p0x} ${p0y} C ${c1x} ${c1y} ${c2x} ${c2y} ${p3x} ${p3y}`;
        return {
            d,
            x1: p0x,
            y1: p0y,
            x2: p3x,
            y2: p3y,
            midX: Math.round(midX),
            midY: Math.round(midY),
            c1x,
            c1y,
            c2x,
            c2y
        };
    }

    function projectTaskGraphEdgePath(fromPos, toPos, meta = {}) {
        const pair = selectProjectTaskGraphDockPair(fromPos, toPos, meta);
        const cubic = projectTaskGraphCubicEdgePath(pair.fromDock, pair.toDock, meta);
        return {
            d: cubic.d,
            x1: cubic.x1,
            y1: cubic.y1,
            x2: cubic.x2,
            y2: cubic.y2,
            midX: cubic.midX,
            midY: cubic.midY,
            mode: `cubic-${pair.sideFrom}-${pair.sideTo}`,
            sideFrom: pair.sideFrom,
            sideTo: pair.sideTo,
            cx: cubic.midX,
            cy: cubic.midY
        };
    }

    function projectTaskGraphEdgeAnchors(fromPos, toPos, meta = {}) {
        return projectTaskGraphEdgePath(fromPos, toPos, meta);
    }

    function projectTaskGraphObstacleList(layout = {}, excludeIds = []) {
        const exclude = new Set((excludeIds || []).map((id) => text(id)).filter(Boolean));
        const nodes = Array.isArray(layout.nodes) ? layout.nodes : [];
        const positions = layout.positions || {};
        return nodes.map((node) => {
            const id = text(node?.id || node?.task?.id);
            if (!id || exclude.has(id)) return null;
            const pos = positions[id];
            if (!pos) return null;
            return {
                id,
                x: pos.x,
                y: pos.y,
                w: pos.w || PROJECT_TASK_GRAPH_CARD_W,
                h: pos.h || PROJECT_TASK_GRAPH_CARD_H
            };
        }).filter(Boolean);
    }

    function projectTaskGraphEdgeFanMap(edges = []) {
        const fromBuckets = {};
        const toBuckets = {};
        (Array.isArray(edges) ? edges : []).forEach((edge) => {
            const from = text(edge?.from);
            const to = text(edge?.to);
            if (!from || !to) return;
            if (!fromBuckets[from]) fromBuckets[from] = [];
            if (!toBuckets[to]) toBuckets[to] = [];
            fromBuckets[from].push(edge);
            toBuckets[to].push(edge);
        });
        const fanByKey = {};
        const assign = (bucket) => {
            Object.keys(bucket).forEach((key) => {
                const list = bucket[key];
                const n = list.length;
                list.forEach((edge, index) => {
                    const edgeKey = `${text(edge.from)}->${text(edge.to)}`;
                    const offset = (index - (n - 1) / 2) * 16;
                    fanByKey[edgeKey] = (fanByKey[edgeKey] || 0) + offset * 0.5;
                });
            });
        };
        assign(fromBuckets);
        assign(toBuckets);
        return fanByKey;
    }

    function formatProjectTaskGraphNodeLabel(title = '', compact = false) {
        const raw = text(title || 'Task').trim();
        if (!raw) return 'Task';
        // Compact map preview: short; full graph cards: up to 2 visual lines (~48 chars)
        const maxLen = compact ? 18 : 48;
        if (raw.length <= maxLen) return raw;
        return `${raw.slice(0, maxLen - 1)}…`;
    }

    function computeProjectTaskGraphFitZoom(layout, stageWidth = 1180, stageHeight = 640, options = {}) {
        const pad = Number.isFinite(Number(options.pad)) ? Number(options.pad) : 28;
        const minZoom = Number.isFinite(Number(options.minZoom)) ? Number(options.minZoom) : PROJECT_TASK_GRAPH_MIN_ZOOM;
        const maxZoom = Number.isFinite(Number(options.maxZoom)) ? Number(options.maxZoom) : 1.15;
        const scaleX = (stageWidth - pad) / Math.max(1, layout?.width || 1);
        const scaleY = (stageHeight - pad) / Math.max(1, layout?.height || 1);
        return Math.max(minZoom, Math.min(maxZoom, Math.min(scaleX, scaleY)));
    }

    /** Thumbnail zoom only — allows deep shrink so the whole real layout fits the preview box. */

    function computeProjectTaskGraphPreviewZoom(layout, boxWidth = 720, boxHeight = 280) {
        return computeProjectTaskGraphFitZoom(layout, boxWidth, boxHeight, {
            pad: 16,
            minZoom: 0.05,
            maxZoom: 1
        });
    }

    function projectTaskGraphPortRole(side) {
        const s = text(side);
        if (s === 'w' || s === 'n' || s === 'in') return 'in';
        if (s === 'e' || s === 's' || s === 'out') return 'out';
        return '';
    }

    /**
     * Resolve dependency endpoints from port roles, not drag order alone.
     * out → in: origin precedes drop. in → out: flip. Same/unknown: drag order.
     */

    function resolveProjectTaskGraphWireEndpoints(origin, drop) {
        const fromId = text(origin?.taskId);
        const toId = text(drop?.taskId);
        if (!fromId || !toId || fromId === toId) return null;
        const originRole = projectTaskGraphPortRole(origin?.side);
        const dropRole = projectTaskGraphPortRole(drop?.side);
        if (originRole === 'out' && dropRole === 'in') {
            return { from: fromId, to: toId };
        }
        if (originRole === 'in' && dropRole === 'out') {
            return { from: toId, to: fromId };
        }
        return { from: fromId, to: toId };
    }

    function readProjectTaskGraphPortCenter(portEl) {
        const node = portEl?.closest?.('.social-project-task-graph-node-g');
        if (!node) return null;
        let side = text(portEl.getAttribute('data-graph-link-port'));
        // Legacy aliases
        if (side === 'out') side = 'e';
        if (side === 'in') side = 'w';
        const w = Number(node.getAttribute('data-w')) || PROJECT_TASK_GRAPH_CARD_W;
        const h = Number(node.getAttribute('data-h')) || PROJECT_TASK_GRAPH_CARD_H;
        const cx = Number(node.getAttribute('data-cx'));
        const cy = Number(node.getAttribute('data-cy'));
        const hw = w / 2;
        const hh = h / 2;
        const base = {
            taskId: text(node.getAttribute('data-task-id')),
            projectId: text(node.getAttribute('data-project-id')),
            side,
            role: projectTaskGraphPortRole(side)
        };
        if (side === 'e' || side === 'out') return { ...base, x: cx + hw, y: cy, side: 'e', role: 'out' };
        if (side === 'w' || side === 'in') return { ...base, x: cx - hw, y: cy, side: 'w', role: 'in' };
        if (side === 'n') return { ...base, x: cx, y: cy - hh, side: 'n', role: 'in' };
        if (side === 's') return { ...base, x: cx, y: cy + hh, side: 's', role: 'out' };
        if (side === 'in') return { ...base, x: cx - hw, y: cy, role: 'in' };
        return { ...base, x: cx, y: cy };
    }

    function resolveProjectTaskGraphLinkPreviewHost(svg) {
        return svg?.querySelector('[data-project-task-graph-viewport]') || svg;
    }

    function ensureProjectTaskGraphLinkPreview(svg) {
        if (!svg) return null;
        const host = resolveProjectTaskGraphLinkPreviewHost(svg);
        let preview = host?.querySelector('.social-project-task-graph-link-preview')
            || svg.querySelector('.social-project-task-graph-link-preview');
        if (!preview) {
            preview = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            preview.setAttribute('class', 'social-project-task-graph-link-preview');
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('class', 'social-project-task-graph-link-rubber');
            preview.appendChild(line);
            host?.appendChild(preview);
        }
        return preview.querySelector('.social-project-task-graph-link-rubber');
    }

    function updateProjectTaskGraphLinkPreview(svg, x1, y1, x2, y2, statusColor = '') {
        const line = ensureProjectTaskGraphLinkPreview(svg);
        if (!line) return;
        line.setAttribute('x1', String(x1));
        line.setAttribute('y1', String(y1));
        line.setAttribute('x2', String(x2));
        line.setAttribute('y2', String(y2));
        if (statusColor) {
            line.setAttribute('stroke', statusColor);
            line.style.stroke = statusColor;
        }
        line.closest('.social-project-task-graph-link-preview')?.classList.add('is-visible');
    }

    function clearProjectTaskGraphLinkPreview(svg) {
        svg?.querySelector('.social-project-task-graph-link-preview')?.classList.remove('is-visible');
    }

    function setProjectTaskGraphInteracting(stage, active) {
        if (!stage) return;
        stage.classList.toggle('is-interacting', active);
        if (active) {
            window.__kiuSuppressLuxTransparencyRefresh = true;
            return;
        }
        window.requestAnimationFrame(() => {
            window.__kiuSuppressLuxTransparencyRefresh = false;
        });
    }

    function scheduleProjectTaskGraphEdgeRefresh(svg) {
        if (!svg) return;
        if (projectTaskGraphEdgeRaf) return;
        projectTaskGraphEdgeRaf = window.requestAnimationFrame(() => {
            projectTaskGraphEdgeRaf = 0;
            refreshProjectTaskGraphEdgeLines(svg);
        });
    }

    function findProjectTaskGraphLinkDropTarget(svg, clientX, clientY, fromTaskId = '') {
        const stack = typeof document.elementsFromPoint === 'function'
            ? document.elementsFromPoint(clientX, clientY)
            : [document.elementFromPoint(clientX, clientY)].filter(Boolean);
        for (const hit of stack) {
            const port = hit?.closest?.('[data-graph-link-port]');
            if (!port) continue;
            const hostNode = port.closest?.('.social-project-task-graph-node-g');
            if (!hostNode || !svg.contains(hostNode)) continue;
            const target = readProjectTaskGraphPortCenter(port);
            if (target?.taskId && target.taskId !== fromTaskId) return target;
        }
        for (const hit of stack) {
            const node = resolveProjectTaskGraphNodeFromTarget(hit, svg);
            if (!node) continue;
            const taskId = text(node.getAttribute('data-task-id'));
            if (!taskId || taskId === fromTaskId) continue;
            const groupId = text(node.getAttribute('data-group-id'));
            const w = Number(node.getAttribute('data-w')) || PROJECT_TASK_GRAPH_CARD_W;
            const h = Number(node.getAttribute('data-h')) || PROJECT_TASK_GRAPH_CARD_H;
            const cx = Number(node.getAttribute('data-cx'));
            const cy = Number(node.getAttribute('data-cy'));
            // Groups are first-class endpoints: always return taskId so port-wire creates dependencies.
            return {
                taskId,
                groupId: groupId || '',
                projectId: text(node.getAttribute('data-project-id')),
                x: cx - w / 2,
                y: cy,
                side: 'w',
                w,
                h
            };
        }
        return null;
    }

    /** Card-drag membership: hit package body under pointer (not the dragged task). */

    function findProjectTaskGraphMembershipDropGroup(svg, clientX, clientY, fromTaskId = '') {
        const skipId = text(fromTaskId);
        const stack = typeof document.elementsFromPoint === 'function'
            ? document.elementsFromPoint(clientX, clientY)
            : [document.elementFromPoint(clientX, clientY)].filter(Boolean);
        for (const hit of stack) {
            const node = resolveProjectTaskGraphNodeFromTarget(hit, svg);
            if (!node || !svg.contains(node)) continue;
            const nodeTaskId = text(node.getAttribute('data-task-id'));
            // Dragged card covers the package — skip it so the package underneath wins.
            if (skipId && (nodeTaskId === skipId || text(node.getAttribute('data-group-id')) === skipId)) continue;
            const groupId = text(node.getAttribute('data-group-id'));
            if (!groupId) continue;
            return {
                groupId,
                projectId: text(node.getAttribute('data-project-id'))
            };
        }
        return null;
    }

    function readProjectTaskGraphLivePositions(svg) {
        const positions = {};
        if (!svg) return positions;
        svg.querySelectorAll('.social-project-task-graph-node-g').forEach((node) => {
            const id = text(node.getAttribute('data-task-id'));
            if (!id) return;
            positions[id] = {
                x: Number(node.getAttribute('data-cx')),
                y: Number(node.getAttribute('data-cy')),
                w: Number(node.getAttribute('data-w')) || PROJECT_TASK_GRAPH_CARD_W,
                h: Number(node.getAttribute('data-h')) || PROJECT_TASK_GRAPH_CARD_H
            };
        });
        return positions;
    }

    function escapeProjectTaskGraphAttr(value = '') {
        const raw = text(value);
        if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(raw);
        return raw.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    }

    function patchRemoveProjectTaskGraphEdge(svg, fromId, toId) {
        if (!svg) return false;
        const from = text(fromId);
        const to = text(toId);
        if (!from || !to) return false;
        const group = svg.querySelector(
            `.social-project-task-graph-edge-group[data-edge-from="${escapeProjectTaskGraphAttr(from)}"][data-edge-to="${escapeProjectTaskGraphAttr(to)}"]`
        );
        if (!group) return false;
        group.remove();
        return true;
    }

    /** Keep immersive title project name in sync without remounting chrome. */

    function patchProjectTaskGraphLinkCountLabel(runtime = state()) {
        const host = getProjectTaskGraphHost();
        const titleSpan = host?.querySelector('.social-project-task-graph-immersive-title > span');
        if (!titleSpan) return false;
        const dialog = activeDialog();
        const ctx = resolveProjectTaskGraphContext(runtime, dialog);
        if (!ctx) return false;
        titleSpan.textContent = text(ctx.project.name || 'Project');
        return true;
    }

    function syncProjectTaskGraphEdgesOnly(runtime = state()) {
        const host = getProjectTaskGraphHost();
        const svg = host?.querySelector('[data-project-task-graph-svg]');
        const edgesG = svg?.querySelector('.social-project-task-graph-edges');
        if (!svg || !edgesG) return false;
        const dialog = activeDialog();
        const ctx = resolveProjectTaskGraphContext(runtime, dialog);
        if (!ctx) return false;
        const stageSize = computeProjectTaskGraphStageSize(runtime);
        let layout = buildProjectTaskGraphLayout(ctx.model, runtime, stageSize);
        if (projectTaskGraphLayoutUsesSavedPositions(layout, runtime)) {
            layout = applyProjectTaskGraphSavedPositions(
                layout,
                getProjectTaskGraphPositions(runtime, text(ctx.project.id))
            );
        }
        const livePositions = readProjectTaskGraphLivePositions(svg);
        Object.keys(livePositions).forEach((id) => {
            if (layout.positions[id]) {
                layout.positions[id].x = livePositions[id].x;
                layout.positions[id].y = livePositions[id].y;
                layout.positions[id].w = livePositions[id].w;
                layout.positions[id].h = livePositions[id].h;
            } else {
                layout.positions[id] = livePositions[id];
            }
        });
        const schedule = computeProjectTaskGraphMapSchedule(runtime, ctx.project);
        const showCritical = projectTaskGraphShowCritical(runtime);
        edgesG.innerHTML = renderProjectTaskGraphGroupEdgesHtml(ctx.project, layout, {
                dashboard: true,
                unlinkable: Boolean(ctx.project.viewerCanContribute),
                markerSuffix: '-fullscreen',
                livePositions,
                criticalEdges: schedule?.criticalEdges || null,
                showCritical
            })
            + renderProjectTaskGraphEdgeGroupsHtml(ctx.project, layout, {
                edges: ctx.model.edges,
                showInferred: ctx.showInferred,
                showFlow: ctx.showFlow,
                dashboard: true,
                unlinkable: Boolean(ctx.project.viewerCanContribute),
                markerSuffix: '-fullscreen',
                livePositions,
                criticalEdges: schedule?.criticalEdges || null,
                showCritical
            });
        // Do not rewrite selection rail / sidebar — that is the flicker source.
        patchProjectTaskGraphLinkCountLabel(runtime);
        return true;
    }

    function refreshProjectTaskGraphEdgeLines(svg) {
        if (!svg) return;
        const readNodePos = (node) => ({
            x: Number(node.getAttribute('data-cx')),
            y: Number(node.getAttribute('data-cy')),
            w: Number(node.getAttribute('data-w')),
            h: Number(node.getAttribute('data-h'))
        });
        const groups = Array.from(svg.querySelectorAll('.social-project-task-graph-edge-group'));
        const edgeList = groups.map((group) => ({
            from: text(group.getAttribute('data-edge-from')),
            to: text(group.getAttribute('data-edge-to'))
        }));
        const fanByKey = projectTaskGraphEdgeFanMap(edgeList);
        const statusLayout = Boolean(svg.closest('[data-layout-kind="status"]'))
            || Boolean(svg.classList.contains('is-status-layout'));
        const obstacles = Array.from(svg.querySelectorAll('.social-project-task-graph-node-g')).map((node) => ({
            id: text(node.getAttribute('data-task-id')),
            x: Number(node.getAttribute('data-cx')),
            y: Number(node.getAttribute('data-cy')),
            w: Number(node.getAttribute('data-w')) || PROJECT_TASK_GRAPH_CARD_W,
            h: Number(node.getAttribute('data-h')) || PROJECT_TASK_GRAPH_CARD_H
        }));
        const criticalTwinFan = 6; // keep in sync with dual-wire render offset
        groups.forEach((group) => {
            const fromId = text(group.getAttribute('data-edge-from'));
            const toId = text(group.getAttribute('data-edge-to'));
            const line = group.querySelector('.social-project-task-graph-edge:not(.is-critical-twin)');
            const twin = group.querySelector('.social-project-task-graph-edge.is-critical-twin');
            const hit = group.querySelector('.social-project-task-graph-edge-hit');
            const label = group.querySelector('.social-project-task-graph-edge-label');
            const unlink = group.querySelector('.social-project-task-graph-edge-unlink');
            const fromNode = svg.querySelector(`.social-project-task-graph-node-g[data-task-id="${fromId}"]`);
            const toNode = svg.querySelector(`.social-project-task-graph-node-g[data-task-id="${toId}"]`);
            if (!line || !fromNode || !toNode) return;
            const edgeKey = `${fromId}->${toId}`;
            const baseFan = fanByKey[edgeKey] || 0;
            const pathMeta = {
                fanOffset: baseFan,
                statusLayout,
                obstacles,
                fromId,
                toId
            };
            const path = projectTaskGraphEdgePath(readNodePos(fromNode), readNodePos(toNode), pathMeta);
            group.setAttribute('data-edge-mode', path.mode);
            [line, hit].forEach((entry) => {
                if (!entry) return;
                if (entry.tagName === 'path' || entry.getAttribute('d') != null) {
                    entry.setAttribute('d', path.d);
                } else {
                    entry.setAttribute('x1', String(path.x1));
                    entry.setAttribute('y1', String(path.y1));
                    entry.setAttribute('x2', String(path.x2));
                    entry.setAttribute('y2', String(path.y2));
                }
            });
            if (twin) {
                const twinPath = projectTaskGraphEdgePath(readNodePos(fromNode), readNodePos(toNode), {
                    ...pathMeta,
                    fanOffset: baseFan + criticalTwinFan
                });
                twin.setAttribute('d', twinPath.d);
            }
            if (label) {
                label.setAttribute('x', String(path.midX));
                label.setAttribute('y', String(path.midY - 4));
            }
            if (unlink) unlink.setAttribute('transform', `translate(${path.midX},${path.midY})`);
        });
    }

    function projectTaskGraphWouldCycle(tasks = [], targetId = '', fromId = '', groups = []) {
        const goalId = text(targetId); // node that will wait
        const startId = text(fromId);  // predecessor
        if (!goalId || !startId || goalId === startId) return true;
        const taskById = Object.fromEntries((Array.isArray(tasks) ? tasks : []).map((task) => [text(task?.id), task]).filter(([id]) => id));
        const groupById = Object.fromEntries((Array.isArray(groups) ? groups : []).map((g) => [text(g?.id), g]).filter(([id]) => id));
        const predsOf = (currentId) => {
            if (isProjectTaskGraphGroupId(currentId)) {
                const g = groupById[currentId];
                if (!g) return [];
                const deps = projectGroupDependsOnIds(g).slice();
                // Membership sink: members are predecessors of the package (same as schedule).
                (Array.isArray(g?.memberTaskIds) ? g.memberTaskIds : []).forEach((memberId) => {
                    const mid = text(memberId);
                    if (mid && !deps.includes(mid)) deps.push(mid);
                });
                return deps;
            }
            const task = taskById[currentId];
            const deps = task ? projectTaskDependsOnIds(task).slice() : [];
            // Groups that block this task (package → task wires stored on group.blocksIds).
            (Array.isArray(groups) ? groups : []).forEach((g) => {
                if (projectGroupBlocksIds(g).includes(currentId)) {
                    const gid = text(g?.id);
                    if (gid && !deps.includes(gid)) deps.push(gid);
                }
            });
            return deps;
        };
        // Cycle if predecessor already waits (transitively) on target.
        const visiting = new Set();
        const reaches = (currentId) => {
            if (currentId === goalId) return true;
            if (visiting.has(currentId)) return false;
            visiting.add(currentId);
            return predsOf(currentId).some((depId) => reaches(depId));
        };
        return reaches(startId);
    }

    function readProjectTaskGraphPan(runtime = {}) {
        const pan = runtime.ui?.projectTaskGraphPan;
        return {
            x: Math.round(Number(pan?.x) || 0),
            y: Math.round(Number(pan?.y) || 0)
        };
    }

    function isProjectTaskGraphScrollPanCanvas(canvas) {
        return canvas?.getAttribute('data-scroll-pan') === '1';
    }

    function resolveProjectTaskGraphPanSlack(contentExtent = 0) {
        const base = typeof window === 'undefined'
            ? PROJECT_TASK_GRAPH_PAN_SLACK
            : Math.max(PROJECT_TASK_GRAPH_PAN_SLACK, Math.round(window.innerWidth || 0), Math.round(window.innerHeight || 0));
        // Grow with scaled content so far-off cards stay reachable (not clamped to empty).
        return Math.max(base, Math.round(Number(contentExtent) || 0));
    }

    function clampProjectTaskGraphPan(panX, panY, slack = resolveProjectTaskGraphPanSlack()) {
        const limit = Math.max(0, Math.round(Number(slack) || 0));
        const px = Math.round(Number(panX) || 0);
        const py = Math.round(Number(panY) || 0);
        return {
            x: Math.max(-limit, Math.min(limit, px)),
            y: Math.max(-limit, Math.min(limit, py))
        };
    }

    function readProjectTaskGraphScrollSurface(canvas) {
        return canvas?.querySelector('[data-project-task-graph-scroll-surface]') || null;
    }

    function readProjectTaskGraphLayoutSize(canvas) {
        const layoutWidth = Number(canvas?.getAttribute('data-layout-width')) || 0;
        const layoutHeight = Number(canvas?.getAttribute('data-layout-height')) || 0;
        if (layoutWidth && layoutHeight) {
            return { width: layoutWidth, height: layoutHeight };
        }
        const svg = canvas?.querySelector('[data-project-task-graph-svg]');
        return {
            width: Number(svg?.getAttribute('width')) || 0,
            height: Number(svg?.getAttribute('height')) || 0
        };
    }

    function projectTaskGraphScrollOffsets(panX, panY, slack = resolveProjectTaskGraphPanSlack()) {
        const pad = Math.max(0, Math.round(Number(slack) || 0));
        return {
            scrollLeft: Math.round(pad + (Number(panX) || 0)),
            scrollTop: Math.round(pad + (Number(panY) || 0))
        };
    }

    function readProjectTaskGraphPanSlackFromCanvas(canvas) {
        const surface = readProjectTaskGraphScrollSurface(canvas);
        if (surface && typeof window !== 'undefined') {
            const raw = window.getComputedStyle(surface).getPropertyValue('--ptg-pan-slack');
            const n = Math.round(Number.parseFloat(raw) || 0);
            if (n > 0) return n;
        }
        const { width, height } = readProjectTaskGraphLayoutSize(canvas);
        const zoom = clampProjectTaskGraphZoom(Number(canvas?.getAttribute('data-zoom')) || 1);
        return resolveProjectTaskGraphPanSlack(Math.max(width * zoom, height * zoom));
    }

    function readProjectTaskGraphPanFromScroll(canvas) {
        const slack = readProjectTaskGraphPanSlackFromCanvas(canvas);
        return clampProjectTaskGraphPan(
            canvas.scrollLeft - slack,
            canvas.scrollTop - slack,
            slack
        );
    }

    function ensureProjectTaskGraphScrollSurface(canvas, inner, zoom, layoutW, layoutH) {
        const z = clampProjectTaskGraphZoom(Number(zoom) || 1);
        const scaledW = Math.round(layoutW * z);
        const scaledH = Math.round(layoutH * z);
        const slack = resolveProjectTaskGraphPanSlack(Math.max(scaledW, scaledH));
        const surface = readProjectTaskGraphScrollSurface(canvas) || inner?.parentElement;
        if (surface?.matches?.('[data-project-task-graph-scroll-surface]')) {
            surface.style.setProperty('--ptg-pan-slack', `${slack}px`);
            surface.style.width = `${scaledW + (slack * 2)}px`;
            surface.style.height = `${scaledH + (slack * 2)}px`;
        }
        if (inner) {
            inner.style.width = `${scaledW}px`;
            inner.style.height = `${scaledH}px`;
            inner.style.transform = '';
        }
        const svg = inner?.querySelector('[data-project-task-graph-svg]') || canvas?.querySelector('[data-project-task-graph-svg]');
        if (svg) {
            svg.setAttribute('width', String(scaledW));
            svg.setAttribute('height', String(scaledH));
        }
        return { width: scaledW, height: scaledH, zoom: z, slack };
    }

    function applyProjectTaskGraphScrollZoom(canvas, inner, zoom, layoutW, layoutH) {
        return ensureProjectTaskGraphScrollSurface(canvas, inner, zoom, layoutW, layoutH);
    }

    function centerProjectTaskGraphScrollPan(canvas, panX, panY, zoom, layoutW, layoutH, options = {}) {
        const syncState = options.syncState !== false;
        const z = clampProjectTaskGraphZoom(Number(zoom) || 1);
        const inner = canvas?.querySelector('.social-project-task-graph-canvas-inner');
        const surface = ensureProjectTaskGraphScrollSurface(canvas, inner, z, layoutW, layoutH);
        const pan = clampProjectTaskGraphPan(panX, panY, surface.slack);
        const offsets = projectTaskGraphScrollOffsets(pan.x, pan.y, surface.slack);
        canvas.scrollLeft = offsets.scrollLeft;
        canvas.scrollTop = offsets.scrollTop;
        canvas.setAttribute('data-pan-x', String(pan.x));
        canvas.setAttribute('data-pan-y', String(pan.y));
        canvas.setAttribute('data-zoom', String(z));
        if (syncState) state().ui.projectTaskGraphPan = { x: pan.x, y: pan.y };
        return { x: pan.x, y: pan.y, zoom: z };
    }

    function applyProjectTaskGraphCanvasTransform(canvas, inner, panX, panY, zoom, options = {}) {
        const syncState = options.syncState !== false;
        const px = Math.round(Number(panX) || 0);
        const py = Math.round(Number(panY) || 0);
        const z = clampProjectTaskGraphZoom(Number(zoom) || 1);
        canvas?.setAttribute('data-pan-x', String(px));
        canvas?.setAttribute('data-pan-y', String(py));
        canvas?.setAttribute('data-zoom', String(z));
        if (isProjectTaskGraphScrollPanCanvas(canvas)) {
            const { width, height } = readProjectTaskGraphLayoutSize(canvas);
            if (width && height) {
                applyProjectTaskGraphScrollZoom(canvas, inner, z, width, height);
                return centerProjectTaskGraphScrollPan(canvas, px, py, z, width, height, { syncState });
            }
        }
        if (syncState) state().ui.projectTaskGraphPan = { x: px, y: py };
        if (inner) {
            inner.style.transform = `scale(${z}); transform-origin: top left;`;
        }
        return { x: px, y: py, zoom: z };
    }

    function initProjectTaskGraphScrollPan(stage, options = {}) {
        const canvas = stage?.querySelector('[data-project-task-graph-canvas][data-scroll-pan="1"]');
        if (!canvas) return false;
        const force = options.force === true;
        if (!force && canvas.getAttribute('data-ptg-scroll-init-pending') !== '1') return false;
        const inner = canvas.querySelector('.social-project-task-graph-canvas-inner');
        const { width, height } = readProjectTaskGraphLayoutSize(canvas);
        if (!width || !height || !inner) return false;
        const apply = () => {
            if (!(canvas.clientWidth > 0 && canvas.clientHeight > 0)) return false;
            const zoom = clampProjectTaskGraphZoom(Number(canvas.getAttribute('data-zoom')) || 1);
            const rawPan = readProjectTaskGraphPan(state());
            const { width: lw, height: lh } = readProjectTaskGraphLayoutSize(canvas);
            const slack = resolveProjectTaskGraphPanSlack(Math.max(lw * zoom, lh * zoom));
            const pan = clampProjectTaskGraphPan(rawPan.x, rawPan.y, slack);
            centerProjectTaskGraphScrollPan(canvas, pan.x, pan.y, zoom, width, height);
            canvas.removeAttribute('data-ptg-scroll-init-pending');
            return true;
        };
        if (apply()) return true;
        // Layout may not be ready yet (immersive grid / LMS chrome). Retry until sized.
        let attempts = 0;
        const maxAttempts = 30;
        const tick = () => {
            if (apply()) return;
            attempts += 1;
            if (attempts >= maxAttempts) return;
            if (attempts < 8) window.requestAnimationFrame(tick);
            else window.setTimeout(tick, 32);
        };
        window.requestAnimationFrame(tick);
        return true;
    }

    function resolveProjectTaskGraphPanBackdrop(stage) {
        return stage?.closest('.social-neo-dialog-backdrop--project-task-graph') || null;
    }

    function clientToProjectTaskGraphCoords(stage, clientX, clientY) {
        const canvas = stage?.querySelector('[data-project-task-graph-canvas]');
        if (isProjectTaskGraphScrollPanCanvas(canvas)) {
            const rect = canvas.getBoundingClientRect();
            const zoom = clampProjectTaskGraphZoom(Number(canvas.getAttribute('data-zoom')) || 1);
            const slack = readProjectTaskGraphPanSlackFromCanvas(canvas);
            const svg = canvas.querySelector('[data-project-task-graph-svg]');
            const vb = text(svg?.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
            const originX = Number.isFinite(vb[0]) ? vb[0] : 0;
            const originY = Number.isFinite(vb[1]) ? vb[1] : 0;
            return {
                x: Math.round(originX + (clientX - rect.left + canvas.scrollLeft - slack) / zoom),
                y: Math.round(originY + (clientY - rect.top + canvas.scrollTop - slack) / zoom)
            };
        }
        const inner = canvas?.querySelector('.social-project-task-graph-canvas-inner');
        if (!inner) return { x: 0, y: 0 };
        const rect = inner.getBoundingClientRect();
        const zoom = Number(canvas?.getAttribute('data-zoom')) || 1;
        return {
            x: Math.round((clientX - rect.left) / zoom),
            y: Math.round((clientY - rect.top) / zoom)
        };
    }

    function getProjectTaskGraphHost() {
        const portal = document.getElementById('social-neo-overlay-portal');
        if (portal?.querySelector('.social-project-task-graph-immersive')) return portal;
        const dialog = document.getElementById('social-neo-dialog-region');
        if (dialog?.querySelector('.social-project-task-graph-immersive')) return dialog;
        return null;
    }

    /** Map Only-mine mirrors desk focus `mine` (and legacy projectTaskMyOnly). */

    function projectTaskGraphMineOnlyActive(runtime = state()) {
        return text(runtime?.ui?.projectTaskFocus || '') === 'mine'
            || Boolean(runtime?.ui?.projectTaskMyOnly);
    }

    /** Visible map tasks: full project, or desk-Mine set (assigned to me, not done). */

    function filterProjectTaskGraphVisibleTasks(runtime, tasks = []) {
        const list = Array.isArray(tasks) ? tasks : [];
        if (!projectTaskGraphMineOnlyActive(runtime)) return list;
        const userId = currentUserId();
        return list.filter((task) =>
            text(task?.assigneeUserId) === userId
            && text(task?.status || 'todo') !== 'done'
        );
    }

    /**
     * Schedule scope for the map: full project, or Only-mine subgraph
     * (visible tasks + packages that still have members / are assigned to me).
     */

    function resolveProjectTaskGraphScheduleScope(runtime, project) {
        const allTasks = Array.isArray(project?.tasks) ? project.tasks : [];
        const mineOnly = projectTaskGraphMineOnlyActive(runtime);
        const tasks = mineOnly ? filterProjectTaskGraphVisibleTasks(runtime, allTasks) : allTasks;
        const taskIds = new Set(tasks.map((task) => text(task?.id)).filter(Boolean));
        let groups = [];
        try {
            groups = getProjectTaskGraphGroups(runtime || state(), text(project?.id || ''));
        } catch (error) {
            groups = Array.isArray(project?.taskGraphGroups) ? project.taskGraphGroups : [];
        }
        if (mineOnly) {
            const userId = currentUserId();
            groups = (Array.isArray(groups) ? groups : []).filter((group) => {
                const members = (Array.isArray(group?.memberTaskIds) ? group.memberTaskIds : []).map(text);
                return members.some((id) => taskIds.has(id)) || text(group?.assigneeUserId) === userId;
            }).map((group) => ({
                ...group,
                memberTaskIds: (Array.isArray(group?.memberTaskIds) ? group.memberTaskIds : [])
                    .map(text)
                    .filter((id) => taskIds.has(id))
            }));
        }
        return { tasks, groups, mineOnly, allTasks };
    }

    /** CPM for map chrome / critical paint — respects Only mine. */

    function computeProjectTaskGraphMapSchedule(runtime, project) {
        const scope = resolveProjectTaskGraphScheduleScope(runtime, project);
        const sched = computeProjectSchedule(
            { ...project, tasks: scope.tasks },
            { groups: scope.groups }
        );
        return {
            ...sched,
            mineOnly: scope.mineOnly,
            scopedTaskCount: scope.tasks.length
        };
    }

    function resolveProjectTaskGraphContext(runtime, dialog) {
        const project = resolveActiveSocialProject(runtime, dialog?.projectId);
        if (!project) return null;
        // Desk search/priority filters stay off the map; Only-mine / desk Mine focus does apply.
        const allTasks = Array.isArray(project.tasks) ? project.tasks : [];
        const projectTasks = filterProjectTaskGraphVisibleTasks(runtime, allTasks);
        const showInferred = projectTaskGraphShowInferred(runtime);
        const showFlow = projectTaskGraphShowFlow(runtime);
        const model = buildProjectTaskGraphModel(projectTasks, { showInferred, showFlow });
        return { project, projectTasks, allTasks, showInferred, showFlow, model, mineOnly: projectTaskGraphMineOnlyActive(runtime) };
    }

    function buildProjectTaskGraphLayout(model, runtime, options = {}) {
        // Default: status columns (pipeline) — free force layout is opt-in
        const layoutKind = text(runtime?.ui?.projectTaskGraphLayout || 'status') || 'status';
        const layoutOptions = { compact: false, fullscreen: true, ...options };
        if (layoutKind === 'force') return layoutProjectTaskGraphForce(model, layoutOptions);
        return layoutProjectTaskGraphByStatus(model, layoutOptions);
    }

    function applyProjectTaskGraphZoom(runtime) {
        const host = getProjectTaskGraphHost();
        const immersive = host?.querySelector('.social-project-task-graph-immersive');
        if (!immersive) return false;
        const stage = host?.querySelector('[data-project-task-graph-stage]');
        if (stage?.classList.contains('is-panning')) return true;
        const zoom = clampProjectTaskGraphZoom(Number(runtime.ui?.projectTaskGraphZoom || 1) || 1);
        const pan = readProjectTaskGraphPan(runtime);
        const canvas = immersive.querySelector('[data-project-task-graph-canvas]');
        const inner = canvas?.querySelector('.social-project-task-graph-canvas-inner');
        if (!canvas || !inner) return false;
        applyProjectTaskGraphCanvasTransform(canvas, inner, pan.x, pan.y, zoom);
        const label = immersive.querySelector('.social-project-task-graph-zoom-label');
        if (label) label.textContent = `${Math.round(zoom * 100)}%`;
        return true;
    }

    function syncProjectTaskGraphChrome(runtime) {
        const host = getProjectTaskGraphHost();
        const immersive = host?.querySelector('.social-project-task-graph-immersive');
        if (!immersive) return false;
        const dialog = activeDialog();
        const ctx = resolveProjectTaskGraphContext(runtime, dialog);
        const graphMode = normalizeProjectTaskGraphMode(runtime.ui?.projectTaskGraphMode || 'browse');
        const linkFromId = text(runtime.ui?.projectTaskGraphLinkFrom || '');
        const canContribute = Boolean(ctx?.project?.viewerCanContribute);
        const body = immersive.querySelector('.social-project-task-graph-immersive-body');
        const stage = body?.querySelector('[data-project-task-graph-stage="1"]');
        stage?.classList.toggle('is-mode-link', graphMode === 'connect');
        stage?.classList.toggle('is-mode-connect', graphMode === 'connect');
        stage?.classList.toggle('is-mode-browse', graphMode === 'browse');
        stage?.classList.remove('is-mode-arrange', 'is-mode-explore');
        const connectBtn = immersive.querySelector('[data-action="project-task-graph-mode-connect"], [data-action="project-task-graph-mode-link"]');
        connectBtn?.classList.toggle('social-neo-btn-primary', graphMode === 'connect');
        let toolbar = immersive.querySelector('.social-project-task-graph-mode-toolbar');
        const actions = immersive.querySelector('.social-project-task-graph-immersive-actions');
        if (linkFromId && canContribute && graphMode === 'connect') {
            if (!toolbar && actions) {
                toolbar = document.createElement('div');
                toolbar.className = 'social-project-tab-row social-project-task-graph-mode-toolbar';
                toolbar.setAttribute('data-lux-transparency-exempt', '1');
                toolbar.setAttribute('role', 'group');
                toolbar.setAttribute('aria-label', 'Link actions');
                const zoomControls = actions.querySelector('.social-project-task-graph-zoom-controls');
                if (zoomControls) actions.insertBefore(toolbar, zoomControls);
                else actions.prepend(toolbar);
            }
            if (toolbar && !toolbar.querySelector('[data-action="project-task-graph-link-cancel"]')) {
                const cancelBtn = document.createElement('button');
                cancelBtn.className = 'social-neo-btn';
                cancelBtn.type = 'button';
                cancelBtn.setAttribute('data-action', 'project-task-graph-link-cancel');
                cancelBtn.innerHTML = '<i class="fas fa-times"></i> Cancel';
                toolbar.appendChild(cancelBtn);
            }
        } else if (toolbar) {
            toolbar.remove();
        }
        if (ctx) {
            const titleSpan = immersive.querySelector('.social-project-task-graph-immersive-title > span');
            if (titleSpan) titleSpan.textContent = text(ctx.project.name || 'Project');
            const myToggle = immersive.querySelector('[data-action="project-task-graph-toggle-my"]');
            if (myToggle) {
                const mineOn = projectTaskGraphMineOnlyActive(runtime);
                myToggle.setAttribute('aria-checked', mineOn ? 'true' : 'false');
                myToggle.classList.toggle('is-active', mineOn);
                const mySwitchInput = myToggle.matches?.('input[type="checkbox"]')
                    ? myToggle
                    : myToggle.querySelector?.('input[type="checkbox"]');
                if (mySwitchInput) mySwitchInput.checked = mineOn;
            }
            const inferredToggle = immersive.querySelector('[data-action="project-task-graph-toggle-inferred"]');
            if (inferredToggle) inferredToggle.checked = ctx.showInferred;
            const flowToggle = immersive.querySelector('[data-action="project-task-graph-toggle-flow"]');
            if (flowToggle) flowToggle.checked = ctx.showFlow;
        }
        return true;
    }

    function syncProjectTaskGraphGroupFocus(runtime = state()) {
        const host = getProjectTaskGraphHost();
        const immersive = host?.querySelector('.social-project-task-graph-immersive');
        if (!immersive) return false;
        const dialog = activeDialog();
        const projectId = text(dialog?.projectId || runtime.ui?.activeProjectId || '');
        const focusGroupId = text(runtime.ui?.projectTaskGraphFocusGroupId || '');
        const stage = immersive.querySelector('[data-project-task-graph-stage="1"]');
        const svg = immersive.querySelector('[data-project-task-graph-svg]');
        const portrait = Boolean(focusGroupId);
        stage?.classList.toggle('is-group-portrait', portrait);
        svg?.classList.toggle('is-group-portrait', portrait);

        // Keep topbar droplist in sync without full remount.
        const focusSelect = immersive.querySelector('select[name="projectTaskGraphFocusGroup"]');
        if (focusSelect && text(focusSelect.value) !== focusGroupId) {
            focusSelect.value = focusGroupId;
        }

        if (!svg) return true;
        if (!portrait) {
            svg.querySelectorAll('.social-project-task-graph-node-g').forEach((node) => {
                node.classList.remove('is-group-focus-active', 'is-group-focus-dimmed');
            });
            svg.querySelectorAll('.social-project-task-graph-edge-group').forEach((edge) => {
                edge.classList.remove('is-group-focus-active', 'is-group-focus-dimmed');
            });
            return true;
        }

        const groups = getProjectTaskGraphGroups(runtime, projectId);
        const group = groups.find((g) => text(g?.id) === focusGroupId) || null;
        const members = new Set(
            (Array.isArray(group?.memberTaskIds) ? group.memberTaskIds : []).map((id) => text(id)).filter(Boolean)
        );
        const project = resolveActiveSocialProject(runtime, projectId);
        const tasks = Array.isArray(project?.tasks) ? project.tasks : [];
        // Order graph: predecessor → successors (who waits on whom).
        const successorsOf = new Map();
        const addSucc = (from, to) => {
            const a = text(from);
            const b = text(to);
            if (!a || !b || a === b) return;
            if (!successorsOf.has(a)) successorsOf.set(a, new Set());
            successorsOf.get(a).add(b);
        };
        if (group) {
            projectGroupBlocksIds(group).forEach((tid) => addSucc(focusGroupId, tid));
        }
        tasks.forEach((task) => {
            const tid = text(task?.id);
            if (!tid) return;
            projectTaskDependsOnIds(task).forEach((depId) => addSucc(depId, tid));
        });
        groups.forEach((g) => {
            const gid = text(g?.id);
            if (!gid) return;
            projectGroupDependsOnIds(g).forEach((fromId) => addSucc(fromId, gid));
            projectGroupBlocksIds(g).forEach((tid) => addSucc(gid, tid));
        });
        // DOM explicit edges (group-dep + task-task).
        svg.querySelectorAll('.social-project-task-graph-edge-group[data-edge-kind="explicit"]').forEach((edge) => {
            addSucc(edge.getAttribute('data-edge-from'), edge.getAttribute('data-edge-to'));
        });
        // Active = package + members + full transitive downstream (children of children).
        const activeIds = new Set([focusGroupId, ...members]);
        const queue = [focusGroupId, ...members];
        while (queue.length) {
            const cur = queue.shift();
            (successorsOf.get(cur) || []).forEach((next) => {
                if (activeIds.has(next)) return;
                activeIds.add(next);
                queue.push(next);
            });
        }

        svg.querySelectorAll('.social-project-task-graph-node-g').forEach((node) => {
            const taskId = text(node.getAttribute('data-task-id'));
            const active = activeIds.has(taskId);
            node.classList.toggle('is-group-focus-active', active);
            node.classList.toggle('is-group-focus-dimmed', !active);
        });

        svg.querySelectorAll('.social-project-task-graph-edge-group').forEach((edge) => {
            const from = text(edge.getAttribute('data-edge-from'));
            const to = text(edge.getAttribute('data-edge-to'));
            const kind = text(edge.getAttribute('data-edge-kind'));
            const active = kind === 'groupmember'
                ? (to === focusGroupId || from === focusGroupId)
                : (activeIds.has(from) && activeIds.has(to));
            edge.classList.toggle('is-group-focus-active', active);
            edge.classList.toggle('is-group-focus-dimmed', !active);
        });
        return true;
    }

    /**
     * Selection glow set: full ancestor chain + full descendant chain
     * (parent → … → selected → … → children’s children).
     */

    function collectProjectTaskGraphNeighborIds(runtime, selectedId, ctx, svg = null) {
        const neighborIds = new Set();
        const sid = text(selectedId);
        if (!sid) return neighborIds;

        const projectId = text(ctx?.project?.id || runtime.ui?.activeProjectId || '');
        const groups = getProjectTaskGraphGroups(runtime, projectId);
        const project = ctx?.project || resolveActiveSocialProject(runtime, projectId);
        const tasks = Array.isArray(project?.tasks) ? project.tasks : [];

        // predecessorsOf[node] = parents; successorsOf[node] = children (order edges).
        const predecessorsOf = new Map();
        const successorsOf = new Map();
        const link = (from, to) => {
            const a = text(from);
            const b = text(to);
            if (!a || !b || a === b) return;
            if (!predecessorsOf.has(b)) predecessorsOf.set(b, new Set());
            predecessorsOf.get(b).add(a);
            if (!successorsOf.has(a)) successorsOf.set(a, new Set());
            successorsOf.get(a).add(b);
        };

        if (ctx?.model?.explicitEdges) {
            ctx.model.explicitEdges.forEach((edge) => link(edge?.from, edge?.to));
        }
        tasks.forEach((task) => {
            const tid = text(task?.id);
            if (!tid) return;
            projectTaskDependsOnIds(task).forEach((depId) => link(depId, tid));
        });
        groups.forEach((group) => {
            const gid = text(group?.id);
            if (!gid) return;
            projectGroupDependsOnIds(group).forEach((fromId) => link(fromId, gid));
            projectGroupBlocksIds(group).forEach((toId) => link(gid, toId));
        });
        if (svg) {
            svg.querySelectorAll('.social-project-task-graph-edge-group').forEach((edge) => {
                const kind = text(edge.getAttribute('data-edge-kind'));
                if (kind === 'groupmember') return;
                link(edge.getAttribute('data-edge-from'), edge.getAttribute('data-edge-to'));
            });
        }

        // All ancestors (walk up).
        const upQ = [sid];
        const upSeen = new Set([sid]);
        while (upQ.length) {
            const cur = upQ.shift();
            (predecessorsOf.get(cur) || []).forEach((pred) => {
                if (upSeen.has(pred)) return;
                upSeen.add(pred);
                neighborIds.add(pred);
                upQ.push(pred);
            });
        }
        // All descendants (walk down — children’s children …).
        const downQ = [sid];
        const downSeen = new Set([sid]);
        while (downQ.length) {
            const cur = downQ.shift();
            (successorsOf.get(cur) || []).forEach((child) => {
                if (downSeen.has(child)) return;
                downSeen.add(child);
                neighborIds.add(child);
                downQ.push(child);
            });
        }

        neighborIds.delete(sid);
        return neighborIds;
    }

    function syncProjectTaskGraphSelection(runtime) {
        const host = getProjectTaskGraphHost();
        const immersive = host?.querySelector('.social-project-task-graph-immersive');
        if (!immersive) return false;
        const selectedId = text(runtime.ui?.projectTaskGraphSelectedId || '');
        const linkFromId = text(runtime.ui?.projectTaskGraphLinkFrom || '');
        const dialog = activeDialog();
        const ctx = resolveProjectTaskGraphContext(runtime, dialog);
        const stage = immersive.querySelector('[data-project-task-graph-stage="1"]');
        // Keep all cards fully visible — selection only highlights, never dims the rest.
        stage?.classList.remove('has-selection');
        const svg = immersive.querySelector('[data-project-task-graph-svg]');
        const neighborIds = collectProjectTaskGraphNeighborIds(runtime, selectedId, ctx, svg);
        if (svg) {
            svg.classList.remove('has-selection');
            svg.querySelectorAll('.social-project-task-graph-node-g').forEach((node) => {
                const taskId = text(node.getAttribute('data-task-id'));
                const isSelected = taskId === selectedId;
                const isNeighbor = neighborIds.has(taskId);
                node.classList.toggle('is-selected', isSelected);
                node.classList.toggle('is-link-source', taskId === linkFromId);
                node.classList.toggle('is-dep-neighbor', isNeighbor);
                node.classList.remove('is-focus-dimmed');
                if (isNeighbor) node.setAttribute('data-neighbor-of-selected', '1');
                else node.removeAttribute('data-neighbor-of-selected');
            });
            const chainIds = new Set(neighborIds);
            if (selectedId) chainIds.add(selectedId);
            svg.querySelectorAll('.social-project-task-graph-edge-group').forEach((group) => {
                const from = text(group.getAttribute('data-edge-from'));
                const to = text(group.getAttribute('data-edge-to'));
                const kind = text(group.getAttribute('data-edge-kind'));
                // Highlight order edges on the ancestor/child chain (skip membership wires).
                const touches = kind !== 'groupmember' && selectedId
                    && chainIds.has(from) && chainIds.has(to);
                group.classList.toggle('is-focus-active', Boolean(touches));
                group.classList.remove('is-focus-dimmed');
            });
        }
        const body = immersive.querySelector('.social-project-task-graph-immersive-body');
        if (!ctx) return false;
        const railContent = renderProjectTaskGraphDetailRailContent(ctx.project, runtime, ctx.projectTasks);
        let rail = body?.querySelector('.social-project-task-graph-detail-rail');
        if (!rail && body) {
            rail = document.createElement('aside');
            rail.className = 'social-project-task-graph-detail-rail';
            rail.setAttribute('data-lux-transparency-exempt', '1');
            body.appendChild(rail);
        }
        if (rail) {
            const nextMarkup = railContent.markup;
            const railKey = `${selectedId}|${linkFromId}|${railContent.empty ? 1 : 0}`;
            // Skip identical rail rewrite — enhanceUniversalPickers remount is a common flicker source.
            if (rail.getAttribute('data-rail-key') !== railKey || rail.innerHTML !== nextMarkup) {
                rail.innerHTML = nextMarkup;
                rail.setAttribute('data-rail-key', railKey);
                rail.classList.toggle('is-empty', railContent.empty);
                if (typeof window.enhanceUniversalPickers === 'function') {
                    try { window.enhanceUniversalPickers(rail); } catch (error) {}
                }
            } else {
                rail.classList.toggle('is-empty', railContent.empty);
            }
        }
        const highlightOverdue = runtime.ui?.projectTaskGraphHighlightOverdue === true;
        const highlightBlocked = runtime.ui?.projectTaskGraphHighlightBlocked === true;
        if (svg) {
            svg.querySelectorAll('.social-project-task-graph-node-g').forEach((node) => {
                const status = text(node.getAttribute('data-status'));
                node.classList.toggle('is-highlight-overdue', highlightOverdue && node.classList.contains('is-overdue'));
                node.classList.toggle('is-highlight-blocked', highlightBlocked && status === 'blocked');
            });
        }
        syncProjectTaskGraphGroupFocus(runtime);
        return true;
    }

    function syncProjectTaskGraphCanvas(runtime) {
        const host = getProjectTaskGraphHost();
        const stage = host?.querySelector('[data-project-task-graph-stage="1"]');
        if (!stage) return false;
        const dialog = activeDialog();
        const existing = stage.querySelector('[data-project-task-graph-canvas], .social-project-task-graph-empty');
        // Preserve viewport so forced rebuilds don't flash/jump.
        const prevScrollLeft = existing?.scrollLeft || 0;
        const prevScrollTop = existing?.scrollTop || 0;
        const hadScrollPan = existing?.getAttribute?.('data-scroll-pan') === '1';
        const markup = buildProjectTaskGraphCanvasMarkup(runtime, dialog);
        const wrapper = document.createElement('div');
        wrapper.innerHTML = markup;
        const next = wrapper.firstElementChild;
        if (!next) return false;
        if (existing) existing.replaceWith(next);
        else stage.insertBefore(next, stage.querySelector('.social-project-task-graph-quick-create'));
        const freshCanvas = stage.querySelector('[data-project-task-graph-canvas][data-scroll-pan="1"]');
        if (freshCanvas) {
            // Prefer restoring known pan/zoom over full scroll re-init flash.
            if (hadScrollPan) {
                applyProjectTaskGraphZoom(runtime);
                try {
                    freshCanvas.scrollLeft = prevScrollLeft;
                    freshCanvas.scrollTop = prevScrollTop;
                } catch (error) {}
                freshCanvas.removeAttribute('data-ptg-scroll-init-pending');
            } else {
                freshCanvas.setAttribute('data-ptg-scroll-init-pending', '1');
            }
        }
        bindProjectTaskGraphDrag();
        applyProjectTaskGraphZoom(runtime);
        if (freshCanvas && hadScrollPan) {
            try {
                freshCanvas.scrollLeft = prevScrollLeft;
                freshCanvas.scrollTop = prevScrollTop;
            } catch (error) {}
        }
        syncProjectTaskGraphSelection(runtime);
        const measureHost = host;
        window.requestAnimationFrame(() => {
            if (text(activeDialog()?.type || '') !== 'project-task-graph') return;
            const heightChanged = measureProjectTaskGraphCardHeights(measureHost);
            if (heightChanged) syncProjectTaskGraphEdgesOnly(runtime);
        });
        return true;
    }

    function syncProjectTaskGraphQuickCreate(runtime) {
        const host = getProjectTaskGraphHost();
        const stage = host?.querySelector('[data-project-task-graph-stage="1"]');
        if (!stage) return false;
        const dialog = activeDialog();
        const ctx = resolveProjectTaskGraphContext(runtime, dialog);
        if (!ctx) return false;
        const markup = renderProjectTaskGraphQuickCreatePopover(ctx.project, runtime);
        const existing = stage.querySelector('.social-project-task-graph-quick-create');
        if (markup) {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = markup;
            const next = wrapper.firstElementChild;
            if (!next) return false;
            if (existing) existing.replaceWith(next);
            else stage.appendChild(next);
            if (typeof window.enhanceUniversalPickers === 'function') {
                try { window.enhanceUniversalPickers(next); } catch (error) {}
            }
        } else if (existing) {
            existing.remove();
        }
        return true;
    }

    function syncProjectTaskGraphSidebar(runtime) {
        // Left Map tools sidebar removed — overview lives in the right rail.
        return syncProjectTaskGraphSelection(runtime);
    }

    function refreshProjectTaskGraphDialog(parts = ['all']) {
        const graphOpen = text(activeDialog()?.type || '') === 'project-task-graph';
        if (!graphOpen) return renderDialogOnlyNow();
        let normalized = Array.isArray(parts) ? parts.map((part) => text(part)).filter(Boolean) : [text(parts)];
        // Never full-remount the immersive graph for soft updates (kills flicker).
        if (!normalized.length || normalized.includes('all')) {
            normalized = ['chrome', 'selection', 'sidebar', 'zoom', 'canvas'];
        }
        const panStage = getProjectTaskGraphHost()?.querySelector('[data-project-task-graph-stage]');
        if (panStage?.classList.contains('is-panning')) {
            normalized = normalized.filter((part) => part !== 'zoom' && part !== 'canvas' && part !== 'all');
            if (!normalized.length) return false;
        }
        const runtime = state();
        let ok = false;
        if (normalized.includes('zoom')) ok = applyProjectTaskGraphZoom(runtime) || ok;
        if (normalized.includes('chrome')) ok = syncProjectTaskGraphChrome(runtime) || ok;
        if (normalized.includes('selection')) ok = syncProjectTaskGraphSelection(runtime) || ok;
        if (normalized.includes('groupFocus')) ok = syncProjectTaskGraphGroupFocus(runtime) || ok;
        if (normalized.includes('sidebar')) ok = syncProjectTaskGraphSidebar(runtime) || ok;
        if (normalized.includes('quickCreate')) ok = syncProjectTaskGraphQuickCreate(runtime) || ok;
        if (normalized.includes('canvas')) {
            ok = syncProjectTaskGraphCanvas(runtime) || ok;
            applyProjectTaskGraphZoom(runtime);
        }
        // Soft failure while graph is open: never call renderDialogOnlyNow (full remount).
        return ok;
    }

    /** Browse select, or connect-mode wire arm/complete. Shared by click + pointerup. */

    function selectProjectTaskGraphNode(projectId, taskId) {
        const runtime = state();
        const mode = normalizeProjectTaskGraphMode(runtime.ui?.projectTaskGraphMode || 'browse');
        if (mode === 'connect') {
            const linkFrom = text(runtime.ui?.projectTaskGraphLinkFrom || '');
            if (!linkFrom) {
                runtime.ui.projectTaskGraphLinkFrom = taskId;
                runtime.ui.projectTaskGraphSelectedId = taskId;
                return refreshProjectTaskGraphDialog(['chrome', 'selection']);
            }
            if (linkFrom === taskId) {
                runtime.ui.projectTaskGraphLinkFrom = '';
                runtime.ui.projectTaskGraphMode = 'browse';
                return refreshProjectTaskGraphDialog(['chrome', 'selection']);
            }
            // First task must finish first; second waits on first. One-shot: exit connect after wire.
            return withBusy(async () => {
                await addProjectTaskDependency(projectId, taskId, linkFrom);
                runtime.ui.projectTaskGraphLinkFrom = '';
                runtime.ui.projectTaskGraphMode = 'browse';
                runtime.ui.projectTaskGraphSelectedId = taskId;
                notifyProjectTaskGraphSurfaceChanged(projectId);
                if (!syncProjectTaskGraphEdgesOnly(runtime)) {
                    refreshProjectTaskGraphDialog(['canvas']);
                }
                refreshProjectTaskGraphDialog(['selection', 'chrome']);
            });
        }
        // Already selected — don't rewrite the rail (that flicker).
        if (text(runtime.ui?.projectTaskGraphSelectedId) === taskId) return false;
        runtime.ui.projectTaskGraphSelectedId = taskId;
        // Browse select: selection rail only — chrome remount is unnecessary flicker.
        return refreshProjectTaskGraphDialog(['selection']);
    }

    async function addProjectTaskDependency(projectId, targetId, fromId) {
        return addProjectGraphDependency(projectId, targetId, fromId);
    }

    async function removeProjectTaskDependency(projectId, targetId, fromId) {
        return removeProjectGraphDependency(projectId, targetId, fromId);
    }

    /** Unified dependency: target waits on from. Either end may be a group (grp_*). */

    async function addProjectGraphDependency(projectId, targetId, fromId) {
        const runtime = state();
        const project = resolveActiveSocialProject(runtime, projectId);
        const tasks = Array.isArray(project?.tasks) ? project.tasks : [];
        const groups = getProjectTaskGraphGroups(runtime, projectId);
        const to = text(targetId);
        const from = text(fromId);
        if (!to || !from) throw new Error('Missing link endpoints.');
        if (to === from) throw new Error('Cannot link a node to itself.');
        if (projectTaskGraphWouldCycle(tasks, to, from, groups)) throw new Error('That link would create a dependency cycle.');

        // Target is a package: package waits on from (task or package).
        if (isProjectTaskGraphGroupId(to)) {
            const group = groups.find((g) => text(g.id) === to);
            if (!group) throw new Error('Package not found.');
            const deps = projectGroupDependsOnIds(group);
            if (deps.includes(from)) return;
            updateProjectTaskGraphGroup(runtime, projectId, to, { dependsOnIds: [...deps, from] });
            return;
        }

        const target = tasks.find((task) => text(task?.id) === to);
        if (!target) throw new Error('Task not found.');

        // From package → task: store on group.blocksIds (reliable local) + dual-write task.dependsOnTaskIds.
        if (isProjectTaskGraphGroupId(from)) {
            const group = groups.find((g) => text(g.id) === from);
            if (!group) throw new Error('Package not found.');
            const blocks = projectGroupBlocksIds(group);
            if (!blocks.includes(to)) {
                updateProjectTaskGraphGroup(runtime, projectId, from, { blocksIds: [...blocks, to] });
            }
            const deps = projectTaskDependsOnIds(target);
            if (!deps.includes(from)) {
                try {
                    await updatePortalSocialProjectTask(
                        projectId,
                        to,
                        { dependsOnTaskIds: [...deps, from] },
                        { silent: true }
                    );
                } catch (error) {
                    // Keep edge via blocksIds even if API rejects grp_* ids.
                    patchLocalProjectTaskDepends(runtime, projectId, to, [...deps, from]);
                }
            }
            return;
        }

        const deps = projectTaskDependsOnIds(target);
        if (deps.includes(from)) return;
        await updatePortalSocialProjectTask(
            projectId,
            to,
            { dependsOnTaskIds: [...deps, from] },
            { silent: true }
        );
    }

    function patchLocalProjectTaskDepends(runtime, projectId, taskId, dependsOnTaskIds) {
        const project = resolveActiveSocialProject(runtime, projectId);
        if (!project || !Array.isArray(project.tasks)) return;
        const tid = text(taskId);
        project.tasks = project.tasks.map((task) => (
            text(task?.id) === tid ? { ...task, dependsOnTaskIds: uniqueStrings(dependsOnTaskIds) } : task
        ));
    }

    async function removeProjectGraphDependency(projectId, targetId, fromId) {
        const runtime = state();
        const to = text(targetId);
        const from = text(fromId);
        if (!to || !from) return;
        if (isProjectTaskGraphGroupId(to)) {
            const group = getProjectTaskGraphGroups(runtime, projectId).find((g) => text(g.id) === to);
            if (!group) return;
            const deps = projectGroupDependsOnIds(group).filter((id) => id !== from);
            updateProjectTaskGraphGroup(runtime, projectId, to, { dependsOnIds: deps });
            return;
        }
        // Clearing package → task: drop from group.blocksIds and task.dependsOnTaskIds.
        if (isProjectTaskGraphGroupId(from)) {
            const group = getProjectTaskGraphGroups(runtime, projectId).find((g) => text(g.id) === from);
            if (group) {
                const blocks = projectGroupBlocksIds(group).filter((id) => id !== to);
                updateProjectTaskGraphGroup(runtime, projectId, from, { blocksIds: blocks });
            }
        }
        const project = resolveActiveSocialProject(runtime, projectId);
        const target = (Array.isArray(project?.tasks) ? project.tasks : []).find((task) => text(task?.id) === to);
        if (!target) return;
        const deps = projectTaskDependsOnIds(target).filter((id) => id !== from);
        try {
            await updatePortalSocialProjectTask(
                projectId,
                to,
                { dependsOnTaskIds: deps },
                { silent: true }
            );
        } catch (error) {
            patchLocalProjectTaskDepends(runtime, projectId, to, deps);
        }
    }

    function detachProjectTaskGraphPanWindowListeners() {
        const listeners = projectTaskGraphPanWindowListeners;
        if (!listeners) return;
        if (listeners.onMove) window.removeEventListener('pointermove', listeners.onMove);
        if (listeners.onUp) {
            window.removeEventListener('pointerup', listeners.onUp);
            window.removeEventListener('pointercancel', listeners.onUp);
        }
        if (listeners.onMouseMove) window.removeEventListener('mousemove', listeners.onMouseMove);
        if (listeners.onMouseUp) window.removeEventListener('mouseup', listeners.onMouseUp);
        projectTaskGraphPanWindowListeners = null;
    }

    function attachProjectTaskGraphPanWindowListeners(options = {}) {
        detachProjectTaskGraphPanWindowListeners();
        const { pointerId, onMove, onEnd, mouse = false } = options;
        if (mouse) {
            const onMouseUp = (event) => {
                if (event.button !== 2 && event.button !== 1) return;
                onEnd(event);
            };
            projectTaskGraphPanWindowListeners = { onMouseMove: onMove, onMouseUp, mouse: true };
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onMouseUp);
            return;
        }
        const onUp = (event) => {
            if (pointerId != null && event.pointerId != null && event.pointerId !== pointerId) return;
            onEnd(event);
        };
        projectTaskGraphPanWindowListeners = { onMove, onUp, pointerId };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
    }

    function isProjectTaskGraphPanButton(event) {
        return event.button === 2 || event.button === 1;
    }

    function closeProjectTaskGraphContextMenu() {
        document.querySelectorAll('[data-project-task-graph-context-menu]').forEach((el) => el.remove());
    }

    function openProjectTaskGraphContextMenu(clientX, clientY, { projectId = '', taskId = '' } = {}) {
        closeProjectTaskGraphContextMenu();
        const pid = text(projectId);
        const tid = text(taskId);
        if (!pid || !tid) return;
        const menu = document.createElement('div');
        menu.className = 'sptg-context-menu social-neo-menu';
        menu.setAttribute('data-project-task-graph-context-menu', '1');
        menu.setAttribute('data-lux-transparency-exempt', '1');
        menu.setAttribute('role', 'menu');
        menu.innerHTML = `
            <div class="sptg-context-menu-label">Task actions</div>
            <button type="button" class="sptg-context-menu-item" role="menuitem" data-sptg-menu-action="risks" data-project-id="${escape(pid)}" data-task-id="${escape(tid)}">
                <span class="sptg-context-menu-icon is-risk"><i class="fas fa-triangle-exclamation" aria-hidden="true"></i></span>
                <span class="sptg-context-menu-copy">
                    <strong>Risks</strong>
                    <em>Register threats for this task</em>
                </span>
            </button>
            <button type="button" class="sptg-context-menu-item" role="menuitem" data-sptg-menu-action="detail" data-project-id="${escape(pid)}" data-task-id="${escape(tid)}">
                <span class="sptg-context-menu-icon"><i class="fas fa-list-check" aria-hidden="true"></i></span>
                <span class="sptg-context-menu-copy">
                    <strong>Open task</strong>
                    <em>View details and checklist</em>
                </span>
            </button>
        `;
        const pad = 10;
        const left = Math.max(pad, Math.min(clientX, window.innerWidth - 240));
        const top = Math.max(pad, Math.min(clientY, window.innerHeight - 160));
        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;
        // Must live inside overlay portal so social interaction routing can see it,
        // and we also bind direct handlers (data-action on body is ignored).
        const mount = document.getElementById('social-neo-overlay-portal')
            || document.getElementById('social-neo-dialog-region')
            || document.body;
        mount.appendChild(menu);

        const runMenuAction = (action, projectIdValue, taskIdValue) => {
            closeProjectTaskGraphContextMenu();
            if (action === 'risks') {
                openProjectRiskForTask(projectIdValue, taskIdValue);
                return;
            }
            if (action === 'detail') {
                openDialog('project-task-detail', {
                    projectId: text(projectIdValue),
                    taskId: text(taskIdValue)
                });
            }
        };

        menu.addEventListener('click', (event) => {
            const item = event.target.closest('[data-sptg-menu-action]');
            if (!item || !menu.contains(item)) return;
            event.preventDefault();
            event.stopPropagation();
            runMenuAction(
                text(item.getAttribute('data-sptg-menu-action')),
                item.getAttribute('data-project-id'),
                item.getAttribute('data-task-id')
            );
        });

        const dismiss = (event) => {
            if (event?.type === 'keydown' && event.key !== 'Escape') return;
            if (event?.type === 'pointerdown' && menu.contains(event.target)) return;
            closeProjectTaskGraphContextMenu();
            window.removeEventListener('pointerdown', dismiss, true);
            window.removeEventListener('keydown', dismiss, true);
            window.removeEventListener('scroll', dismiss, true);
        };
        window.setTimeout(() => {
            window.addEventListener('pointerdown', dismiss, true);
            window.addEventListener('keydown', dismiss, true);
            window.addEventListener('scroll', dismiss, true);
        }, 0);
    }

    function bindProjectTaskGraphInteractions(stageOrHost) {
        const stage = stageOrHost?.matches?.('[data-project-task-graph-stage]')
            ? stageOrHost
            : stageOrHost?.querySelector?.('[data-project-task-graph-stage]');
        const svg = stage?.querySelector('[data-project-task-graph-svg]');
        if (!stage || !svg) return;
        detachProjectTaskGraphPanWindowListeners();
        if (projectTaskGraphDragAbort) {
            projectTaskGraphDragAbort.abort();
            projectTaskGraphDragAbort = null;
        }
        projectTaskGraphDragAbort = new AbortController();
        const { signal } = projectTaskGraphDragAbort;
        let dragState = null;
        let panState = null;
        let portLinkState = null;
        const graphMode = () => normalizeProjectTaskGraphMode(state().ui?.projectTaskGraphMode || 'browse');
        const setPortLinkTarget = (portEl) => {
            svg.querySelectorAll('.social-project-task-graph-link-handle.is-drop-target, .social-project-task-graph-svg-port.is-drop-target').forEach((entry) => entry.classList.remove('is-drop-target'));
            portEl?.classList.add('is-drop-target');
            svg.querySelectorAll('.social-project-task-graph-node-g.is-link-target').forEach((entry) => entry.classList.remove('is-link-target'));
            const node = portEl?.closest?.('.social-project-task-graph-node-g');
            if (node) node.classList.add('is-link-target');
        };
        const clearPortLinkTarget = () => {
            svg.querySelectorAll('.social-project-task-graph-link-handle.is-drop-target, .social-project-task-graph-svg-port.is-drop-target').forEach((entry) => entry.classList.remove('is-drop-target'));
            svg.querySelectorAll('.social-project-task-graph-node-g.is-link-target').forEach((entry) => entry.classList.remove('is-link-target'));
        };
        const endPan = (event) => {
            if (!panState) return;
            detachProjectTaskGraphPanWindowListeners();
            const {
                inner,
                canvas,
                captureEl,
                moved,
                originPanX,
                originPanY,
                startX,
                startY,
                pointerId,
                isMouse,
                zoom,
                backdrop
            } = panState;
            if (moved) {
                if (panState.scrollPan) {
                    const pan = readProjectTaskGraphPanFromScroll(canvas);
                    state().ui.projectTaskGraphPan = { x: pan.x, y: pan.y };
                    canvas.setAttribute('data-pan-x', String(pan.x));
                    canvas.setAttribute('data-pan-y', String(pan.y));
                } else {
                    const panX = Math.round(originPanX + (event.clientX - startX));
                    const panY = Math.round(originPanY + (event.clientY - startY));
                    applyProjectTaskGraphCanvasTransform(canvas, inner, panX, panY, zoom);
                }
                event?.preventDefault?.();
                event?.stopPropagation?.();
                stage.dataset.kiuPanned = '1';
                persistProjectTaskGraphView(state());
            }
            if (!isMouse && pointerId != null) {
                try { captureEl?.releasePointerCapture?.(pointerId); } catch (error) {}
            }
            stage.classList.remove('is-panning');
            backdrop?.classList.remove('is-panning');
            setProjectTaskGraphInteracting(stage, false);
            if (!panState.scrollPan) applyProjectTaskGraphZoom(state());
            panState = null;
        };
        const movePan = (event) => {
            if (!panState) return;
            if (!panState.isMouse) {
                if (event.pointerId != null && panState.pointerId != null && event.pointerId !== panState.pointerId) return;
            } else if (event.buttons !== undefined && (event.buttons & 2) === 0 && (event.buttons & 4) === 0) {
                endPan(event);
                return;
            }
            if (Math.hypot(event.clientX - panState.startX, event.clientY - panState.startY) > 3) panState.moved = true;
            if (!panState.moved) return;
            event.preventDefault();
            if (panState.scrollPan) {
                panState.canvas.scrollLeft = panState.originScrollLeft - (event.clientX - panState.startX);
                panState.canvas.scrollTop = panState.originScrollTop - (event.clientY - panState.startY);
                const pan = readProjectTaskGraphPanFromScroll(panState.canvas);
                panState.canvas.setAttribute('data-pan-x', String(pan.x));
                panState.canvas.setAttribute('data-pan-y', String(pan.y));
                return;
            }
            const panX = Math.round(panState.originPanX + (event.clientX - panState.startX));
            const panY = Math.round(panState.originPanY + (event.clientY - panState.startY));
            applyProjectTaskGraphCanvasTransform(panState.canvas, panState.inner, panX, panY, panState.zoom, { syncState: false });
        };
        const startPan = (event) => {
            if (panState || portLinkState || dragState) return;
            const canvas = stage.querySelector('[data-project-task-graph-canvas]');
            const inner = canvas?.querySelector('.social-project-task-graph-canvas-inner');
            if (!inner || !canvas) return;
            const isMouse = event.type === 'mousedown' || event.pointerType === 'mouse';
            if (!isMouse) {
                event.preventDefault();
            }
            const pan = readProjectTaskGraphPan(state());
            const backdrop = resolveProjectTaskGraphPanBackdrop(stage);
            const scrollPan = isProjectTaskGraphScrollPanCanvas(canvas);
            const layoutSize = scrollPan ? readProjectTaskGraphLayoutSize(canvas) : { width: 0, height: 0 };
            panState = {
                inner,
                canvas,
                captureEl: canvas,
                backdrop,
                scrollPan,
                layoutWidth: layoutSize.width,
                layoutHeight: layoutSize.height,
                zoom: Number(canvas.getAttribute('data-zoom')) || 1,
                pointerId: isMouse ? null : event.pointerId,
                isMouse,
                startX: event.clientX,
                startY: event.clientY,
                originPanX: pan.x,
                originPanY: pan.y,
                originScrollLeft: scrollPan ? canvas.scrollLeft : 0,
                originScrollTop: scrollPan ? canvas.scrollTop : 0,
                moved: false
            };
            setProjectTaskGraphInteracting(stage, true);
            stage.classList.add('is-panning');
            backdrop?.classList.add('is-panning');
            if (isMouse) {
                attachProjectTaskGraphPanWindowListeners({ mouse: true, onMove: movePan, onEnd: endPan });
                return;
            }
            try { canvas.setPointerCapture(event.pointerId); } catch (error) {}
            attachProjectTaskGraphPanWindowListeners({ pointerId: event.pointerId, onMove: movePan, onEnd: endPan });
        };
        const onPointerDown = (event) => {
            if (isProjectTaskGraphPanButton(event)) {
                // RMB on a task card opens the context menu — do not pan.
                if (event.button === 2) {
                    const onNode = resolveProjectTaskGraphNodeFromTarget(event.target, svg);
                    if (onNode) return;
                }
                startPan(event);
                return;
            }
            if (event.button !== 0) return;
            if (event.target.closest('.social-project-task-graph-edge-unlink, .social-project-task-graph-edge-hit')) return;
            // Any magnetic port can start a wire (task or package). SVG ports on groups are reliable.
            const outPort = event.target.closest('[data-graph-link-port]');
            const portHost = outPort?.closest?.('.social-project-task-graph-node-g');
            if (outPort && portHost && svg.contains(portHost)) {
                const origin = readProjectTaskGraphPortCenter(outPort);
                if (!origin?.taskId) return;
                event.preventDefault();
                event.stopPropagation();
                portLinkState = {
                    port: outPort,
                    pointerId: event.pointerId,
                    origin,
                    moved: false,
                    startX: event.clientX,
                    startY: event.clientY
                };
                setProjectTaskGraphInteracting(stage, true);
                stage.classList.add('is-port-linking');
                outPort.classList.add('is-linking');
                // Package wires use white rubber; tasks keep status color.
                const rubberColor = isProjectTaskGraphGroupId(origin.taskId)
                    ? '#ffffff'
                    : projectTaskGraphStatusEdgeColor(text(portHost.getAttribute('data-status') || 'todo') || 'todo');
                portLinkState.rubberColor = rubberColor;
                updateProjectTaskGraphLinkPreview(svg, origin.x, origin.y, origin.x, origin.y, rubberColor);
                try { stage.setPointerCapture(event.pointerId); } catch (error) {}
                return;
            }
            const node = resolveProjectTaskGraphNodeFromTarget(event.target, svg, { draggableOnly: true });
            if (!node) return;
            // Never start card drag from a wire port (ports handle linking).
            if (event.target.closest('[data-graph-link-port]')) return;
            // Let inner buttons (group rename/delete/remove-member) receive their click.
            if (event.target.closest('button[data-action]')) return;
            event.preventDefault();
            setProjectTaskGraphInteracting(stage, true);
            dragState = {
                node,
                taskId: text(node.getAttribute('data-task-id')),
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                moved: false,
                originX: Number(node.getAttribute('data-cx')),
                originY: Number(node.getAttribute('data-cy')),
                scale: Number(stage.querySelector('[data-project-task-graph-canvas]')?.getAttribute('data-zoom')) || 1
            };
            node.classList.add('is-dragging');
            try { node.setPointerCapture(event.pointerId); } catch (error) {}
        };
        const onPointerMove = (event) => {
            if (portLinkState && event.pointerId === portLinkState.pointerId) {
                if (Math.hypot(event.clientX - portLinkState.startX, event.clientY - portLinkState.startY) > 3) portLinkState.moved = true;
                event.preventDefault();
                const coords = clientToProjectTaskGraphCoords(stage, event.clientX, event.clientY);
                const { origin } = portLinkState;
                updateProjectTaskGraphLinkPreview(svg, origin.x, origin.y, coords.x, coords.y, portLinkState.rubberColor || '');
                const drop = findProjectTaskGraphLinkDropTarget(svg, event.clientX, event.clientY, portLinkState.origin.taskId);
                svg.querySelectorAll('.social-project-task-graph-group-node.is-drop-target, .social-project-task-graph-node-g.is-link-target').forEach((g) => {
                    g.classList.remove('is-drop-target', 'is-link-target');
                });
                if (drop?.taskId) {
                    const targetNode = svg.querySelector(`.social-project-task-graph-node-g[data-task-id="${drop.taskId}"]`);
                    targetNode?.classList.add('is-link-target');
                    if (drop.groupId) targetNode?.classList.add('is-drop-target');
                    const side = text(drop?.side || 'w') || 'w';
                    const inHandle = targetNode
                        ? (targetNode.querySelector(`[data-graph-link-port="${side}"]`)
                            || targetNode.querySelector('[data-graph-link-port]'))
                        : null;
                    setPortLinkTarget(inHandle);
                    return;
                }
                setPortLinkTarget(null);
                return;
            }
            if (!dragState || event.pointerId !== dragState.pointerId) return;
            if (Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY) > 4) dragState.moved = true;
            if (!dragState.moved) return;
            event.preventDefault();
            const dx = (event.clientX - dragState.startX) / dragState.scale;
            const dy = (event.clientY - dragState.startY) / dragState.scale;
            const w = Number(dragState.node.getAttribute('data-w')) || PROJECT_TASK_GRAPH_CARD_W;
            const h = Number(dragState.node.getAttribute('data-h')) || PROJECT_TASK_GRAPH_CARD_H;
            const nx = Math.round(dragState.originX + dx);
            const ny = Math.round(dragState.originY + dy);
            dragState.node.setAttribute('transform', `translate(${nx - Math.round(w / 2)},${ny - Math.round(h / 2)})`);
            dragState.node.setAttribute('data-cx', String(nx));
            dragState.node.setAttribute('data-cy', String(ny));
            scheduleProjectTaskGraphEdgeRefresh(svg);
            // Highlight package under pointer for membership absorb.
            svg.querySelectorAll('.social-project-task-graph-group-node.is-drop-target').forEach((g) => {
                g.classList.remove('is-drop-target');
            });
            const membershipDrop = findProjectTaskGraphMembershipDropGroup(
                svg,
                event.clientX,
                event.clientY,
                dragState.taskId
            );
            if (membershipDrop?.groupId) {
                svg.querySelector(
                    `.social-project-task-graph-group-node[data-group-id="${membershipDrop.groupId}"]`
                )?.classList.add('is-drop-target');
            }
        };
        const onPointerUp = async (event) => {
            if (panState && !panState.isMouse && event.pointerId === panState.pointerId) {
                endPan(event);
                return;
            }
            if (portLinkState && event.pointerId === portLinkState.pointerId) {
                const { origin, port, moved } = portLinkState;
                clearProjectTaskGraphLinkPreview(svg);
                clearPortLinkTarget();
                svg.querySelectorAll('.social-project-task-graph-group-node.is-drop-target, .social-project-task-graph-node-g.is-link-target').forEach((g) => {
                    g.classList.remove('is-drop-target', 'is-link-target');
                });
                stage.classList.remove('is-port-linking');
                port.classList.remove('is-linking');
                setProjectTaskGraphInteracting(stage, false);
                try { stage.releasePointerCapture(event.pointerId); } catch (error) {}
                const target = moved
                    ? findProjectTaskGraphLinkDropTarget(svg, event.clientX, event.clientY, origin.taskId)
                    : null;
                portLinkState = null;
                // Port-wire always creates a dependency (task or package endpoints). Membership is card-drop only.
                // Direction follows port roles (out→in), not drag order alone.
                if (moved && target?.taskId && target.taskId !== origin.taskId) {
                    event.preventDefault();
                    event.stopPropagation();
                    const ends = resolveProjectTaskGraphWireEndpoints(origin, target);
                    if (!ends?.from || !ends?.to) return;
                    await withBusy(async () => {
                        await addProjectGraphDependency(origin.projectId, ends.to, ends.from);
                        const runtime = state();
                        runtime.ui.projectTaskGraphSelectedId = ends.to;
                        runtime.ui.projectTaskGraphLinkFrom = '';
                        runtime.ui.projectTaskGraphMode = 'browse';
                        notifyProjectTaskGraphSurfaceChanged(origin.projectId);
                        // Edges group only — nodes stay mounted.
                        if (!syncProjectTaskGraphEdgesOnly(runtime)) {
                            refreshProjectTaskGraphDialog(['canvas']);
                        }
                        refreshProjectTaskGraphDialog(['selection', 'chrome']);
                    });
                }
                return;
            }
            if (!dragState || event.pointerId !== dragState.pointerId) return;
            const { node, taskId, moved } = dragState;
            node.classList.remove('is-dragging');
            setProjectTaskGraphInteracting(stage, false);
            svg.querySelectorAll('.social-project-task-graph-group-node.is-drop-target').forEach((g) => {
                g.classList.remove('is-drop-target');
            });
            let absorbedIntoGroup = false;
            if (moved) {
                event.preventDefault();
                event.stopPropagation();
                node.dataset.kiuDragged = '1';
                const runtime = state();
                const projectId = text(node.getAttribute('data-project-id') || activeDialog()?.projectId || runtime.ui?.activeProjectId || '');
                const positions = { ...getProjectTaskGraphPositions(runtime, projectId) };
                positions[taskId] = {
                    x: Number(node.getAttribute('data-cx')),
                    y: Number(node.getAttribute('data-cy'))
                };
                setProjectTaskGraphPositions(runtime, projectId, positions);
                // Card/package drop onto package body → membership (ports are for order arrows only).
                // Nested packages allowed; cycle guard lives in toggleProjectTaskGraphGroupMember.
                const dropGroup = findProjectTaskGraphMembershipDropGroup(svg, event.clientX, event.clientY, taskId);
                if (dropGroup?.groupId && text(dropGroup.groupId) !== text(taskId)) {
                    toggleProjectTaskGraphGroupMember(runtime, projectId, dropGroup.groupId, taskId, true);
                    if (!isProjectTaskGraphGroupId(taskId)) {
                        ensureProjectTaskGraphPositionForTask(runtime, projectId, taskId, {
                            preferNearIds: [dropGroup.groupId]
                        });
                    }
                    absorbedIntoGroup = true;
                }
            } else {
                // Select on pointerup — click often never fires after pointerdown preventDefault.
                // Groups too: connect mode uses them as parent/child dependency endpoints.
                const runtime = state();
                const projectId = text(node.getAttribute('data-project-id') || activeDialog()?.projectId || runtime.ui?.activeProjectId || '');
                node.dataset.kiuGraphSelected = '1';
                void selectProjectTaskGraphNode(projectId, taskId);
            }
            try { node.releasePointerCapture(event.pointerId); } catch (error) {}
            dragState = null;
            if (absorbedIntoGroup) {
                refreshProjectTaskGraphDialog(['canvas', 'chrome']);
            }
        };
        const onDoubleClick = (event) => {
            if (event.target.closest('.social-project-task-graph-node-g, .social-project-task-graph-quick-create, .social-project-task-graph-inspector')) return;
            const runtime = state();
            const dialog = activeDialog();
            if (text(dialog?.type) !== 'project-task-graph') return;
            const project = resolveActiveSocialProject(runtime, dialog?.projectId);
            if (!project?.viewerCanContribute) return;
            const stageRect = stage.getBoundingClientRect();
            const coords = clientToProjectTaskGraphCoords(stage, event.clientX, event.clientY);
            runtime.ui.projectTaskGraphQuickCreate = {
                open: true,
                x: Math.round(event.clientX - stageRect.left),
                y: Math.round(event.clientY - stageRect.top),
                graphX: coords.x,
                graphY: coords.y,
                title: '',
                status: 'todo'
            };
            refreshProjectTaskGraphDialog(['quickCreate']);
        };
        const onStageClick = (event) => {
            if (stage.dataset.kiuPanned) {
                delete stage.dataset.kiuPanned;
                return;
            }
            if (event.target.closest('.social-project-task-graph-quick-create, .social-project-task-graph-inspector, [data-action]')) return;
            if (event.target.closest('.social-project-task-graph-node-g')) return;
            const runtime = state();
            runtime.ui.projectTaskGraphLinkFrom = '';
            runtime.ui.projectTaskGraphMode = 'browse';
            if (runtime.ui.projectTaskGraphQuickCreate?.open) {
                runtime.ui.projectTaskGraphQuickCreate = { open: false };
            }
            refreshProjectTaskGraphDialog(['quickCreate', 'chrome']);
        };
        stage.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            const node = resolveProjectTaskGraphNodeFromTarget(event.target, svg);
            if (!node) {
                closeProjectTaskGraphContextMenu();
                return;
            }
            const projectId = text(node.getAttribute('data-project-id') || '');
            const taskId = text(node.getAttribute('data-task-id') || '');
            if (!projectId || !taskId) return;
            openProjectTaskGraphContextMenu(event.clientX, event.clientY, { projectId, taskId });
        }, { signal });
        stage.addEventListener('wheel', (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (panState || dragState || portLinkState) return;
            const canvas = stage.querySelector('[data-project-task-graph-canvas]');
            const inner = canvas?.querySelector('.social-project-task-graph-canvas-inner');
            if (!canvas || !inner) return;
            const oldZoom = clampProjectTaskGraphZoom(Number(canvas.getAttribute('data-zoom')) || 1);
            const factor = event.deltaY > 0 ? (1 / 1.08) : 1.08;
            const newZoom = clampProjectTaskGraphZoom(oldZoom * factor);
            if (Math.abs(newZoom - oldZoom) < 0.001) return;
            if (isProjectTaskGraphScrollPanCanvas(canvas)) {
                const rect = canvas.getBoundingClientRect();
                const vx = event.clientX - rect.left;
                const vy = event.clientY - rect.top;
                const pan = readProjectTaskGraphPanFromScroll(canvas);
                const layoutX = (pan.x + vx) / oldZoom;
                const layoutY = (pan.y + vy) / oldZoom;
                const { width: lw, height: lh } = readProjectTaskGraphLayoutSize(canvas);
                const slack = resolveProjectTaskGraphPanSlack(Math.max(lw * newZoom, lh * newZoom));
                const nextPan = clampProjectTaskGraphPan(
                    layoutX * newZoom - vx,
                    layoutY * newZoom - vy,
                    slack
                );
                state().ui.projectTaskGraphZoom = newZoom;
                state().ui.projectTaskGraphPan = { x: nextPan.x, y: nextPan.y };
                applyProjectTaskGraphCanvasTransform(canvas, inner, nextPan.x, nextPan.y, newZoom);
            } else {
                state().ui.projectTaskGraphZoom = newZoom;
                applyProjectTaskGraphZoom(state());
            }
            persistProjectTaskGraphView(state());
            const label = getProjectTaskGraphHost()?.querySelector('.social-project-task-graph-zoom-label');
            if (label) label.textContent = `${Math.round(newZoom * 100)}%`;
        }, { passive: false, signal });
        stage.addEventListener('pointerdown', onPointerDown, { signal, capture: true });
        stage.addEventListener('mousedown', (event) => {
            if (!isProjectTaskGraphPanButton(event) || panState) return;
            startPan(event);
        }, { signal, capture: true });
        stage.addEventListener('pointermove', onPointerMove, { signal });
        stage.addEventListener('pointerup', onPointerUp, { signal });
        stage.addEventListener('pointercancel', onPointerUp, { signal });
        stage.addEventListener('dblclick', onDoubleClick, { signal });
        stage.addEventListener('click', onStageClick, { signal });
    }

    function bindProjectTaskGraphDrag() {
        const host = getProjectTaskGraphHost();
        const stage = host?.querySelector('[data-project-task-graph-stage]');
        if (!stage?.querySelector('[data-project-task-graph-svg]')) return;
        bindProjectTaskGraphInteractions(stage);
        initProjectTaskGraphScrollPan(stage, { force: true });
        window.requestAnimationFrame(() => initProjectTaskGraphScrollPan(stage, { force: true }));
    }

    function bindProjectTaskGraphResizeObserver() {
        if (projectTaskGraphResizeObserver) {
            projectTaskGraphResizeObserver.disconnect();
            projectTaskGraphResizeObserver = null;
        }
        const host = getProjectTaskGraphHost();
        const stage = host?.querySelector('[data-project-task-graph-stage="1"]');
        if (!stage || text(activeDialog()?.type || '') !== 'project-task-graph' || typeof ResizeObserver === 'undefined') return;
        let resizeTimer = null;
        projectTaskGraphResizeObserver = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;
            const { width, height } = entry.contentRect;
            const sizeKey = `${Math.round(width)}x${Math.round(height)}`;
            if (!width || !height || sizeKey === projectTaskGraphLastStageSizeKey) return;
            projectTaskGraphLastStageSizeKey = sizeKey;
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (text(activeDialog()?.type || '') !== 'project-task-graph') return;
                const heightChanged = measureProjectTaskGraphCardHeights(host);
                if (heightChanged) syncProjectTaskGraphEdgesOnly(state());
                // Keep the user's remembered zoom/pan; only reflow the canvas for the new stage size.
                refreshProjectTaskGraphDialog(['canvas', 'zoom']);
            }, 150);
        });
        projectTaskGraphResizeObserver.observe(stage);
    }

    function isProjectTaskGraphDialogOpen(runtime = state()) {
        return text(activeDialog()?.type || '') === 'project-task-graph'
            || text(runtime?.ui?.projectTaskGraphStackAnchor?.type || '') === 'project-task-graph';
    }

    /** Soft signal for overview map preview — do not wipe all project tab panes. */

    function markProjectTaskGraphPreviewStale(projectId = '') {
        const runtime = state();
        if (!runtime?.ui) return;
        runtime.ui.projectTaskGraphPreviewStale = true;
        if (isProjectTaskGraphDialogOpen(runtime)) {
            notifyProjectTaskGraphSurfaceChanged(projectId);
            return;
        }
        // Drop cached overview (and other preview hosts) so next visit rebuilds map preview.
        // Do not clear the active tasks pane here — caller refreshes it surgically.
        const id = text(projectId || runtime.ui.activeProjectId || '');
        if (!id) return;
        clearProjectTabPaneCacheKey(id, 'overview');
    }

    /**
     * Rebuild only the Tasks tab pane inside the project shell (no center/hero remount).
     * Prevents Work Desk flicker on expand/status/deps/focus clicks.
     */

    function notifyProjectTaskGraphSurfaceChanged(projectId = '') {
        const runtime = state();
        if (!runtime?.ui) return;
        const id = text(
            projectId
            || runtime.ui.activeProjectId
            || activeDialog()?.projectId
            || ''
        );
        clearProjectTabPaneCache(id);
        const graphOpen = text(activeDialog()?.type || '') === 'project-task-graph'
            || text(runtime.ui?.projectTaskGraphStackAnchor?.type || '') === 'project-task-graph';
        if (graphOpen) {
            runtime.ui.projectTaskGraphPreviewStale = true;
            return;
        }
        rebuildActiveProjectTabPaneIfPreviewHost(id);
    }


    /* graph runtime exports for page stubs / action handlers */
    window.shouldRenderProjectTaskGraphStack = shouldRenderProjectTaskGraphStack;
    window.isProjectTaskGraphStackActive = isProjectTaskGraphStackActive;
    window.getProjectTaskGraphStackAnchorDialog = getProjectTaskGraphStackAnchorDialog;
    window.wrapProjectTaskGraphStack = wrapProjectTaskGraphStack;
    window.trySyncProjectTaskGraphStackDialog = trySyncProjectTaskGraphStackDialog;
    window.projectTaskGraphStackedBackdropClass = projectTaskGraphStackedBackdropClass;
    window.resolveProjectTaskGraphNodeFromTarget = resolveProjectTaskGraphNodeFromTarget;
    window.projectTaskDependsOnIds = projectTaskDependsOnIds;
    window.clampProjectTaskGraphCardHeight = clampProjectTaskGraphCardHeight;
    window.estimateProjectTaskGraphCardHeight = estimateProjectTaskGraphCardHeight;
    window.measureProjectTaskGraphCardHeights = measureProjectTaskGraphCardHeights;
    window.normalizeProjectTaskGraphMode = normalizeProjectTaskGraphMode;
    window.projectTaskGraphShowInferred = projectTaskGraphShowInferred;
    window.projectTaskGraphShowCritical = projectTaskGraphShowCritical;
    window.projectTaskGraphShowFlow = projectTaskGraphShowFlow;
    window.projectTaskGraphVisibleEdges = projectTaskGraphVisibleEdges;
    window.buildProjectTaskGraphModel = buildProjectTaskGraphModel;
    window.layoutProjectTaskGraphByStatus = layoutProjectTaskGraphByStatus;
    window.compareProjectTaskGraphNodes = compareProjectTaskGraphNodes;
    window.hashProjectTaskGraphSeed = hashProjectTaskGraphSeed;
    window.projectTaskGraphPseudoRandom = projectTaskGraphPseudoRandom;
    window.getProjectTaskGraphMetrics = getProjectTaskGraphMetrics;
    window.computeProjectTaskGraphStageSize = computeProjectTaskGraphStageSize;
    window.computeProjectTaskGraphNodeDegree = computeProjectTaskGraphNodeDegree;
    window.projectTaskGraphBoxRepulse = projectTaskGraphBoxRepulse;
    window.resolveProjectTaskGraphCardOverlaps = resolveProjectTaskGraphCardOverlaps;
    window.layoutProjectTaskGraphForce = layoutProjectTaskGraphForce;
    window.projectTaskGraphLayoutUsesSavedPositions = projectTaskGraphLayoutUsesSavedPositions;
    window.applyProjectTaskGraphSavedPositions = applyProjectTaskGraphSavedPositions;
    window.projectTaskGraphRectsOverlap = projectTaskGraphRectsOverlap;
    window.findFreeProjectTaskGraphPosition = findFreeProjectTaskGraphPosition;
    window.ensureProjectTaskGraphPositionForTask = ensureProjectTaskGraphPositionForTask;
    window.projectTaskGraphContentBounds = projectTaskGraphContentBounds;
    window.resolveProjectTaskGraphGroupBox = resolveProjectTaskGraphGroupBox;
    window.collectProjectTaskGraphGroupBoxes = collectProjectTaskGraphGroupBoxes;
    window.projectTaskGraphContentViewBox = projectTaskGraphContentViewBox;
    window.projectTaskGraphPositionsStorageKey = projectTaskGraphPositionsStorageKey;
    window.loadProjectTaskGraphPositions = loadProjectTaskGraphPositions;
    window.saveProjectTaskGraphPositions = saveProjectTaskGraphPositions;
    window.getProjectTaskGraphPositions = getProjectTaskGraphPositions;
    window.setProjectTaskGraphPositions = setProjectTaskGraphPositions;
    window.ensureProjectTaskGraphPositionsLoaded = ensureProjectTaskGraphPositionsLoaded;
    window.projectTaskGraphViewStorageKey = projectTaskGraphViewStorageKey;
    window.clampProjectTaskGraphZoom = clampProjectTaskGraphZoom;
    window.loadProjectTaskGraphView = loadProjectTaskGraphView;
    window.saveProjectTaskGraphView = saveProjectTaskGraphView;
    window.persistProjectTaskGraphView = persistProjectTaskGraphView;
    window.projectTaskGraphSyncStorageKey = projectTaskGraphSyncStorageKey;
    window.seedProjectTaskGraphFromProject = seedProjectTaskGraphFromProject;
    window.queueProjectTaskGraphSync = queueProjectTaskGraphSync;
    window.projectTaskGraphGroupsStorageKey = projectTaskGraphGroupsStorageKey;
    window.getProjectTaskGraphGroups = getProjectTaskGraphGroups;
    window.setProjectTaskGraphGroups = setProjectTaskGraphGroups;
    window.projectTaskGraphCheckpointStorageKey = projectTaskGraphCheckpointStorageKey;
    window.projectTaskGraphCheckpointsStorageKey = projectTaskGraphCheckpointsStorageKey;
    window.formatProjectTaskGraphCheckpointWhen = formatProjectTaskGraphCheckpointWhen;
    window.pulseProjectTaskGraphCheckpointButton = pulseProjectTaskGraphCheckpointButton;
    window.normalizeProjectTaskGraphCheckpointEntry = normalizeProjectTaskGraphCheckpointEntry;
    window.readProjectTaskGraphCheckpoints = readProjectTaskGraphCheckpoints;
    window.writeProjectTaskGraphCheckpoints = writeProjectTaskGraphCheckpoints;
    window.readProjectTaskGraphCheckpoint = readProjectTaskGraphCheckpoint;
    window.getProjectTaskGraphCheckpointById = getProjectTaskGraphCheckpointById;
    window.deleteProjectTaskGraphCheckpoint = deleteProjectTaskGraphCheckpoint;
    window.flushProjectTaskGraphSync = flushProjectTaskGraphSync;
    window.collectProjectTaskGraphCheckpoint = collectProjectTaskGraphCheckpoint;
    window.saveProjectTaskGraphCheckpoint = saveProjectTaskGraphCheckpoint;
    window.applyProjectTaskGraphCheckpointSnapshot = applyProjectTaskGraphCheckpointSnapshot;
    window.restoreProjectTaskGraphCheckpoint = restoreProjectTaskGraphCheckpoint;
    window.createProjectTaskGraphGroup = createProjectTaskGraphGroup;
    window.updateProjectTaskGraphGroup = updateProjectTaskGraphGroup;
    window.deleteProjectTaskGraphGroup = deleteProjectTaskGraphGroup;
    window.scrubDeletedTaskFromProjectTaskGraphGroups = scrubDeletedTaskFromProjectTaskGraphGroups;
    window.projectTaskGraphGroupMembershipWouldCycle = projectTaskGraphGroupMembershipWouldCycle;
    window.toggleProjectTaskGraphGroupMember = toggleProjectTaskGraphGroupMember;
    window.isProjectTaskGraphGroupId = isProjectTaskGraphGroupId;
    window.projectGroupDependsOnIds = projectGroupDependsOnIds;
    window.projectGroupBlocksIds = projectGroupBlocksIds;
    window.collectProjectTaskGraphGroupDescendantTaskIds = collectProjectTaskGraphGroupDescendantTaskIds;
    window.collectProjectTaskGraphGroupAbsorbedTaskIds = collectProjectTaskGraphGroupAbsorbedTaskIds;
    window.isProjectTaskGraphGroupComplete = isProjectTaskGraphGroupComplete;
    window.isProjectGraphDependencyOpen = isProjectGraphDependencyOpen;
    window.computeProjectTaskGraphGroupRollup = computeProjectTaskGraphGroupRollup;
    window.getProjectTaskGraphGroupLinkSummary = getProjectTaskGraphGroupLinkSummary;
    window.computeProjectTaskGraphContentFitView = computeProjectTaskGraphContentFitView;
    window.buildProjectTaskGraphLayoutForView = buildProjectTaskGraphLayoutForView;
    window.applyProjectTaskGraphResetView = applyProjectTaskGraphResetView;
    window.projectTaskGraphBoxAnchor = projectTaskGraphBoxAnchor;
    window.getProjectTaskGraphDocks = getProjectTaskGraphDocks;
    window.projectTaskGraphDockAlongSide = projectTaskGraphDockAlongSide;
    window.scoreProjectTaskGraphDockPair = scoreProjectTaskGraphDockPair;
    window.selectProjectTaskGraphDockPair = selectProjectTaskGraphDockPair;
    window.buildProjectTaskGraphSeedPolyline = buildProjectTaskGraphSeedPolyline;
    window.sampleProjectTaskGraphPolyline = sampleProjectTaskGraphPolyline;
    window.projectTaskGraphPushOutOfRect = projectTaskGraphPushOutOfRect;
    window.relaxProjectTaskGraphPolyline = relaxProjectTaskGraphPolyline;
    window.normalizeProjectTaskGraphStatusId = normalizeProjectTaskGraphStatusId;
    window.projectTaskGraphStatusEdgeColor = projectTaskGraphStatusEdgeColor;
    window.projectTaskGraphCubicEdgePath = projectTaskGraphCubicEdgePath;
    window.projectTaskGraphEdgePath = projectTaskGraphEdgePath;
    window.projectTaskGraphEdgeAnchors = projectTaskGraphEdgeAnchors;
    window.projectTaskGraphObstacleList = projectTaskGraphObstacleList;
    window.projectTaskGraphEdgeFanMap = projectTaskGraphEdgeFanMap;
    window.formatProjectTaskGraphNodeLabel = formatProjectTaskGraphNodeLabel;
    window.computeProjectTaskGraphFitZoom = computeProjectTaskGraphFitZoom;
    window.computeProjectTaskGraphPreviewZoom = computeProjectTaskGraphPreviewZoom;
    window.projectTaskGraphPortRole = projectTaskGraphPortRole;
    window.resolveProjectTaskGraphWireEndpoints = resolveProjectTaskGraphWireEndpoints;
    window.readProjectTaskGraphPortCenter = readProjectTaskGraphPortCenter;
    window.resolveProjectTaskGraphLinkPreviewHost = resolveProjectTaskGraphLinkPreviewHost;
    window.ensureProjectTaskGraphLinkPreview = ensureProjectTaskGraphLinkPreview;
    window.updateProjectTaskGraphLinkPreview = updateProjectTaskGraphLinkPreview;
    window.clearProjectTaskGraphLinkPreview = clearProjectTaskGraphLinkPreview;
    window.setProjectTaskGraphInteracting = setProjectTaskGraphInteracting;
    window.scheduleProjectTaskGraphEdgeRefresh = scheduleProjectTaskGraphEdgeRefresh;
    window.findProjectTaskGraphLinkDropTarget = findProjectTaskGraphLinkDropTarget;
    window.findProjectTaskGraphMembershipDropGroup = findProjectTaskGraphMembershipDropGroup;
    window.readProjectTaskGraphLivePositions = readProjectTaskGraphLivePositions;
    window.escapeProjectTaskGraphAttr = escapeProjectTaskGraphAttr;
    window.patchRemoveProjectTaskGraphEdge = patchRemoveProjectTaskGraphEdge;
    window.patchProjectTaskGraphLinkCountLabel = patchProjectTaskGraphLinkCountLabel;
    window.syncProjectTaskGraphEdgesOnly = syncProjectTaskGraphEdgesOnly;
    window.refreshProjectTaskGraphEdgeLines = refreshProjectTaskGraphEdgeLines;
    window.projectTaskGraphWouldCycle = projectTaskGraphWouldCycle;
    window.readProjectTaskGraphPan = readProjectTaskGraphPan;
    window.isProjectTaskGraphScrollPanCanvas = isProjectTaskGraphScrollPanCanvas;
    window.resolveProjectTaskGraphPanSlack = resolveProjectTaskGraphPanSlack;
    window.clampProjectTaskGraphPan = clampProjectTaskGraphPan;
    window.readProjectTaskGraphScrollSurface = readProjectTaskGraphScrollSurface;
    window.readProjectTaskGraphLayoutSize = readProjectTaskGraphLayoutSize;
    window.projectTaskGraphScrollOffsets = projectTaskGraphScrollOffsets;
    window.readProjectTaskGraphPanSlackFromCanvas = readProjectTaskGraphPanSlackFromCanvas;
    window.readProjectTaskGraphPanFromScroll = readProjectTaskGraphPanFromScroll;
    window.ensureProjectTaskGraphScrollSurface = ensureProjectTaskGraphScrollSurface;
    window.applyProjectTaskGraphScrollZoom = applyProjectTaskGraphScrollZoom;
    window.centerProjectTaskGraphScrollPan = centerProjectTaskGraphScrollPan;
    window.applyProjectTaskGraphCanvasTransform = applyProjectTaskGraphCanvasTransform;
    window.initProjectTaskGraphScrollPan = initProjectTaskGraphScrollPan;
    window.resolveProjectTaskGraphPanBackdrop = resolveProjectTaskGraphPanBackdrop;
    window.clientToProjectTaskGraphCoords = clientToProjectTaskGraphCoords;
    window.getProjectTaskGraphHost = getProjectTaskGraphHost;
    window.projectTaskGraphMineOnlyActive = projectTaskGraphMineOnlyActive;
    window.filterProjectTaskGraphVisibleTasks = filterProjectTaskGraphVisibleTasks;
    window.resolveProjectTaskGraphScheduleScope = resolveProjectTaskGraphScheduleScope;
    window.computeProjectTaskGraphMapSchedule = computeProjectTaskGraphMapSchedule;
    window.resolveProjectTaskGraphContext = resolveProjectTaskGraphContext;
    window.buildProjectTaskGraphLayout = buildProjectTaskGraphLayout;
    window.applyProjectTaskGraphZoom = applyProjectTaskGraphZoom;
    window.syncProjectTaskGraphChrome = syncProjectTaskGraphChrome;
    window.syncProjectTaskGraphGroupFocus = syncProjectTaskGraphGroupFocus;
    window.collectProjectTaskGraphNeighborIds = collectProjectTaskGraphNeighborIds;
    window.syncProjectTaskGraphSelection = syncProjectTaskGraphSelection;
    window.syncProjectTaskGraphCanvas = syncProjectTaskGraphCanvas;
    window.syncProjectTaskGraphQuickCreate = syncProjectTaskGraphQuickCreate;
    window.syncProjectTaskGraphSidebar = syncProjectTaskGraphSidebar;
    window.refreshProjectTaskGraphDialog = refreshProjectTaskGraphDialog;
    window.selectProjectTaskGraphNode = selectProjectTaskGraphNode;
    window.addProjectTaskDependency = addProjectTaskDependency;
    window.removeProjectTaskDependency = removeProjectTaskDependency;
    window.addProjectGraphDependency = addProjectGraphDependency;
    window.patchLocalProjectTaskDepends = patchLocalProjectTaskDepends;
    window.removeProjectGraphDependency = removeProjectGraphDependency;
    window.detachProjectTaskGraphPanWindowListeners = detachProjectTaskGraphPanWindowListeners;
    window.attachProjectTaskGraphPanWindowListeners = attachProjectTaskGraphPanWindowListeners;
    window.isProjectTaskGraphPanButton = isProjectTaskGraphPanButton;
    window.closeProjectTaskGraphContextMenu = closeProjectTaskGraphContextMenu;
    window.openProjectTaskGraphContextMenu = openProjectTaskGraphContextMenu;
    window.bindProjectTaskGraphInteractions = bindProjectTaskGraphInteractions;
    window.bindProjectTaskGraphDrag = bindProjectTaskGraphDrag;
    window.bindProjectTaskGraphResizeObserver = bindProjectTaskGraphResizeObserver;
    window.isProjectTaskGraphDialogOpen = isProjectTaskGraphDialogOpen;
    window.markProjectTaskGraphPreviewStale = markProjectTaskGraphPreviewStale;
    window.notifyProjectTaskGraphSurfaceChanged = notifyProjectTaskGraphSurfaceChanged;


    /* schedule/desk helper exports for page stubs */
    window.readProjectWeekPlansStore = readProjectWeekPlansStore;
    window.readProjectWeekPlan = readProjectWeekPlan;
    window.writeProjectWeekPlan = writeProjectWeekPlan;
    window.addToProjectWeekPlan = addToProjectWeekPlan;
    window.addManyToProjectWeekPlan = addManyToProjectWeekPlan;
    window.removeFromProjectWeekPlan = removeFromProjectWeekPlan;
    window.normalizeProjectWeekPlanWindow = normalizeProjectWeekPlanWindow;
    window.orderDeskTasksByDependency = orderDeskTasksByDependency;
    window.buildDeskTaskForest = buildDeskTaskForest;
    window.computePertExpected = computePertExpected;
    window.taskHasPert = taskHasPert;
    window.resolveTaskScheduleEstimate = resolveTaskScheduleEstimate;
    window.taskDurationHours = taskDurationHours;
    window.taskScheduleRemainingHours = taskScheduleRemainingHours;
    window.sumProjectOpenWorkHours = sumProjectOpenWorkHours;
    window.sumProjectActualHours = sumProjectActualHours;
    window.computeProjectSchedule = computeProjectSchedule;
    window.formatProjectScheduleHours = formatProjectScheduleHours;
    window.formatProjectScheduleFloat = formatProjectScheduleFloat;
    window.formatTaskScheduleDisplay = formatTaskScheduleDisplay;
    window.projectScheduleCalendarDate = projectScheduleCalendarDate;
    window.formatProjectScheduleDate = formatProjectScheduleDate;
    window.renderProjectPlanVsBaselineStrip = renderProjectPlanVsBaselineStrip;
    window.renderProjectProgressHoursStrip = renderProjectProgressHoursStrip;


    /* portfolio data exports for page stubs */
    window.portfolioStatus = portfolioStatus;
    window.portfolioVisibilityMode = portfolioVisibilityMode;
    window.parsePortfolioTextList = parsePortfolioTextList;
    window.parsePortfolioLinksInput = parsePortfolioLinksInput;
    window.serializePortfolioLinks = serializePortfolioLinks;
    window.portfolioAudienceLabel = portfolioAudienceLabel;
    window.normalizePortfolioEntry = normalizePortfolioEntry;
    window.canViewerAccessPortfolioEntry = canViewerAccessPortfolioEntry;
    window.portfolioEntriesForViewer = portfolioEntriesForViewer;
    window.portfolioMatchesRoleFilter = portfolioMatchesRoleFilter;
    window.portfolioDraftExists = portfolioDraftExists;
    window.clonePortfolioDocument = clonePortfolioDocument;
    window.portfolioMakeId = portfolioMakeId;
    window.getMyPortfolioDocument = getMyPortfolioDocument;
    window.ensureMyPortfolioDocument = ensureMyPortfolioDocument;
    window.clearPortfolioApiDeniedFlag = clearPortfolioApiDeniedFlag;
    window.hydrateMyPortfolioDocument = hydrateMyPortfolioDocument;
    window.portfolioFieldValue = portfolioFieldValue;
    window.portfolioReadDateRange = portfolioReadDateRange;
    window.portfolioCollectDocumentFromUi = portfolioCollectDocumentFromUi;
    window.saveMyPortfolioDocument = saveMyPortfolioDocument;
    window.openPortfolioEditor = openPortfolioEditor;
    window.resetPortfolioEditor = resetPortfolioEditor;


    window.renderWorkspaceOwnedDialog = renderWorkspaceOwnedDialog;
    window.maybeWrapStackedProjectDialog = maybeWrapStackedProjectDialog;
    window.shouldRenderProjectHealthStack = shouldRenderProjectHealthStack;
    window.wrapProjectHealthStack = wrapProjectHealthStack;
    window.renderHealthStackLayers = renderHealthStackLayers;
    window.renderStackedProjectTaskChild = renderStackedProjectTaskChild;
    window.WORKSPACE_OWNED_DIALOG_KINDS = WORKSPACE_OWNED_DIALOG_KINDS;


    
    const WORKSPACE_CLICK_ACTION_PREFIXES = ['project-', 'portfolio-', 'projects-'];

    function isSocialWorkspaceClickAction(action) {
        const a = text(action || '');
        if (!a) return false;
        if (a === 'projects-back') return true;
        return WORKSPACE_CLICK_ACTION_PREFIXES.some((p) => a.startsWith(p));
    }

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
            const card = trigger.closest('.social-neo-dialog-card--health-plan-pick') || document;
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

    window.handleSocialWorkspaceClick = handleSocialWorkspaceClick;
    window.isSocialWorkspaceClickAction = isSocialWorkspaceClickAction;

    function isSocialWorkspaceSubmitForm(formType) {
        const f = text(formType || '');
        if (!f) return false;
        if (f === 'create-project' || f === 'create-portfolio' || f === 'portfolio-settings' || f === 'project-settings') return true;
        return f.startsWith('project-') || f.startsWith('dialog-project');
    }

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
                    : [currentFacultyCode()];
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
                    : [currentFacultyCode()];
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
                const title = assertUniqueProjectTaskTitle(project, form.projectTaskTitle?.value);
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

    window.handleSocialWorkspaceSubmit = handleSocialWorkspaceSubmit;
    window.isSocialWorkspaceSubmitForm = isSocialWorkspaceSubmitForm;

    function isSocialWorkspaceInputTarget(target) {
        if (!target || typeof target.matches !== 'function') return false;
        if (target.matches('input[name="projectHealthPlanPickSearch"]')) return true;
        const name = text(target.name || target.getAttribute?.('name') || '');
        if (/^(project|portfolio)/i.test(name)) return true;
        const ft = text(target.closest?.('form[data-form]')?.getAttribute('data-form') || '');
        if (['create-project','project-settings','create-portfolio','portfolio-settings','project-task-create','project-task-edit'].includes(ft)) return true;
        return false;
    }

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

    function isSocialWorkspaceChangeTarget(target) {
        if (!target || typeof target.matches !== 'function') return false;
        if (target.name === 'projectMediaFile') return true;
        if (target.matches('form[data-form="create-project"] [name="projectInviteFaculty"], [name="projectInviteFaculty"], select[name="projectTaskGraphFocusGroup"], select[name="projectDiscoverFaculty"], select[name="projectDiscoverRole"], input[type="checkbox"][data-filter="openOnly"], input[type="checkbox"][data-filter="hidePlanned"]')) return true;
        return false;
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

    window.handleSocialWorkspaceInput = handleSocialWorkspaceInput;
    window.isSocialWorkspaceInputTarget = isSocialWorkspaceInputTarget;
    window.handleSocialWorkspaceChange = handleSocialWorkspaceChange;
    window.isSocialWorkspaceChangeTarget = isSocialWorkspaceChangeTarget;

})();
