/* Pure project schedule / PERT helpers for social workspace.
 * Loaded before social-workspace.js (see ensureSocialWorkspaceModule).
 * Uses __kiuSocialWorkspaceHooks for text / time / status normalizers when available.
 */
(function initSocialWorkspaceScheduleModel() {
    'use strict';
    if (window.__KIU_SOCIAL_WORKSPACE_SCHEDULE_MODEL_LOADED) return;
    window.__KIU_SOCIAL_WORKSPACE_SCHEDULE_MODEL_LOADED = true;

    function hooks() {
        return window.__kiuSocialWorkspaceHooks || {};
    }

    function text(value) {
        const hook = hooks().text;
        if (typeof hook === 'function') return hook(value);
        return String(value == null ? '' : value).trim();
    }

    function normalizeTaskTime(value) {
        const hook = hooks().normalizeTaskTime;
        if (typeof hook === 'function') return hook(value);
        const n = Number(value);
        return Number.isFinite(n) && n > 0 ? Math.round(n * 10) / 10 : 0;
    }

    function normalizeTaskTimeUnit(value) {
        const hook = hooks().normalizeTaskTimeUnit;
        if (typeof hook === 'function') return hook(value);
        return text(value).toLowerCase() === 'd' ? 'd' : 'h';
    }

    function normalizeProjectTaskStatusId(status) {
        const hook = hooks().normalizeProjectTaskStatusId;
        if (typeof hook === 'function') return hook(status);
        const raw = text(status || 'todo').toLowerCase();
        if (raw === 'backlog') return 'todo';
        if (raw === 'in_progress' || raw === 'in progress') return 'in-progress';
        return raw || 'todo';
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

    /** Shared labels for full CPM display (ES/EF/LS/LF/float/duration). */
    function formatTaskScheduleDisplay(schedRow, options = {}) {
        const row = schedRow && typeof schedRow === 'object' ? schedRow : null;
        const scheduleStartAt = text(options.scheduleStartAt || '');
        const durationHours = Number(row?.durationHours) || 0;
        const floatHours = Number(row?.floatHours);
        const isDone = Boolean(row?.isDone) || text(options.statusId || '') === 'done';
        const isBlocked = Boolean(row?.isBlocked) || text(options.statusId || '') === 'blocked';
        const isCritical = Boolean(row?.isCritical) && !isDone;
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

    function projectTaskDependsOnIds(task) {
        const fromWs = window.KiuSocialWorkspace?.projectTaskDependsOnIds
            || window.KiuSocialWorkspaceGraphModel?.projectTaskDependsOnIds;
        if (typeof fromWs === 'function' && fromWs !== projectTaskDependsOnIds) {
            return fromWs(task);
        }
        const hook = hooks().projectTaskDependsOnIds;
        if (typeof hook === 'function') return hook(task);
        const ids = Array.isArray(task?.dependsOnTaskIds) ? task.dependsOnTaskIds : [];
        return [...new Set(ids.map((id) => text(id)).filter(Boolean))];
    }

    function projectGroupBlocksIds(g) {
        const fromWs = window.KiuSocialWorkspace?.projectGroupBlocksIds
            || window.KiuSocialWorkspaceGraphModel?.projectGroupBlocksIds;
        if (typeof fromWs === 'function' && fromWs !== projectGroupBlocksIds) {
            return fromWs(g);
        }
        return Array.isArray(g?.blocksIds) ? g.blocksIds.map((id) => text(id)).filter(Boolean) : [];
    }

    function projectGroupDependsOnIds(g) {
        const fromWs = window.KiuSocialWorkspace?.projectGroupDependsOnIds
            || window.KiuSocialWorkspaceGraphModel?.projectGroupDependsOnIds;
        if (typeof fromWs === 'function' && fromWs !== projectGroupDependsOnIds) {
            return fromWs(g);
        }
        return Array.isArray(g?.dependsOnIds) ? g.dependsOnIds.map((id) => text(id)).filter(Boolean) : [];
    }

    function isProjectTaskGraphGroupId(id) {
        const fromWs = window.KiuSocialWorkspace?.isProjectTaskGraphGroupId
            || window.KiuSocialWorkspaceGraphModel?.isProjectTaskGraphGroupId;
        if (typeof fromWs === 'function' && fromWs !== isProjectTaskGraphGroupId) {
            return fromWs(id);
        }
        return String(id || '').startsWith('grp_');
    }

    function collectProjectTaskGraphGroupDescendantTaskIds(g, groups, options) {
        const fromWs = window.KiuSocialWorkspace?.collectProjectTaskGraphGroupDescendantTaskIds
            || window.KiuSocialWorkspaceGraphDeskModel?.collectProjectTaskGraphGroupDescendantTaskIds;
        if (typeof fromWs === 'function' && fromWs !== collectProjectTaskGraphGroupDescendantTaskIds) {
            return fromWs(g, groups, options);
        }
        return Array.isArray(g?.memberTaskIds) ? g.memberTaskIds.map((id) => text(id)).filter(Boolean) : [];
    }

    function getProjectTaskGraphGroups(st, pid) {
        const fromWs = window.KiuSocialWorkspace?.getProjectTaskGraphGroups
            || window.KiuSocialWorkspaceGraphModel?.getProjectTaskGraphGroups;
        if (typeof fromWs === 'function' && fromWs !== getProjectTaskGraphGroups) {
            return fromWs(st, pid);
        }
        return [];
    }

    function state() {
        if (typeof window.state === 'function' && window.state !== state) return window.state();
        const hook = hooks().state;
        if (typeof hook === 'function') return hook();
        return {};
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
    const api = {
        PROJECT_SCHEDULE_FLOAT_TITLE,
        computePertExpected,
        taskHasPert,
        resolveTaskScheduleEstimate,
        taskDurationHours,
        taskScheduleRemainingHours,
        sumProjectOpenWorkHours,
        sumProjectActualHours,
        formatProjectScheduleHours,
        formatProjectScheduleFloat,
        formatTaskScheduleDisplay,
        projectScheduleCalendarDate,
        formatProjectScheduleDate,
        computeProjectSchedule
    };

    window.KiuSocialWorkspaceScheduleModel = api;
})();
