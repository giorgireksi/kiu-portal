/* Pure desk/forest/group-rollup helpers for social workspace task graph.
 * Loaded before social-workspace-graph-model.js (see ensureSocialWorkspaceModule).
 */
(function initSocialWorkspaceGraphDeskModel() {
    'use strict';
    if (window.__KIU_SOCIAL_WORKSPACE_GRAPH_DESK_MODEL_LOADED) return;
    window.__KIU_SOCIAL_WORKSPACE_GRAPH_DESK_MODEL_LOADED = true;

    function hooks() {
        return window.__kiuSocialWorkspaceHooks || {};
    }

    function text(value) {
        const hook = hooks().text;
        if (typeof hook === 'function') return hook(value);
        return String(value == null ? '' : value).trim();
    }

    function uniqueStrings(list) {
        if (typeof window.uniqueStrings === 'function' && window.uniqueStrings !== uniqueStrings) {
            return window.uniqueStrings(list);
        }
        const hook = hooks().uniqueStrings;
        if (typeof hook === 'function') return hook(list);
        return [...new Set((Array.isArray(list) ? list : []).map(text).filter(Boolean))];
    }

    const PROJECT_TASK_PRIORITY_RANK = { urgent: 0, high: 1, medium: 2, low: 3 };

    function projectTaskDependsOnIds(...a) {
        if (typeof window.projectTaskDependsOnIds === 'function'
            && window.projectTaskDependsOnIds !== projectTaskDependsOnIds) {
            return window.projectTaskDependsOnIds(...a);
        }
        return [];
    }

    function isProjectTaskGraphGroupId(...a) {
        if (typeof window.isProjectTaskGraphGroupId === 'function'
            && window.isProjectTaskGraphGroupId !== isProjectTaskGraphGroupId) {
            return window.isProjectTaskGraphGroupId(...a);
        }
        return false;
    }

    function projectGroupDependsOnIds(...a) {
        if (typeof window.projectGroupDependsOnIds === 'function'
            && window.projectGroupDependsOnIds !== projectGroupDependsOnIds) {
            return window.projectGroupDependsOnIds(...a);
        }
        return [];
    }

    function projectGroupBlocksIds(...a) {
        if (typeof window.projectGroupBlocksIds === 'function'
            && window.projectGroupBlocksIds !== projectGroupBlocksIds) {
            return window.projectGroupBlocksIds(...a);
        }
        return [];
    }

    function getProjectTaskGraphGroups(...a) {
        if (typeof window.getProjectTaskGraphGroups === 'function'
            && window.getProjectTaskGraphGroups !== getProjectTaskGraphGroups) {
            return window.getProjectTaskGraphGroups(...a);
        }
        return [];
    }

    function normalizeProjectTaskStatusId(...a) {
        if (typeof window.normalizeProjectTaskStatusId === 'function'
            && window.normalizeProjectTaskStatusId !== normalizeProjectTaskStatusId) {
            return window.normalizeProjectTaskStatusId(...a);
        }
        return String(a[0] || 'todo');
    }

    function state() {
        if (typeof window.state === 'function' && window.state !== state) return window.state();
        const hook = hooks().state;
        if (typeof hook === 'function') return hook();
        return {};
    }

    function taskDurationHours(...a) {
        if (typeof window.taskDurationHours === 'function') return window.taskDurationHours(...a);
        return (window.KiuSocialWorkspaceScheduleModel || {}).taskDurationHours?.(...a) ?? 0;
    }

    function normalizeTaskTime(...a) {
        if (typeof window.normalizeTaskTime === 'function') return window.normalizeTaskTime(...a);
        return (window.KiuSocialWorkspaceScheduleModel || {}).normalizeTaskTime?.(...a) ?? 0;
    }

    function normalizeTaskTimeUnit(...a) {
        if (typeof window.normalizeTaskTimeUnit === 'function') return window.normalizeTaskTimeUnit(...a);
        return (window.KiuSocialWorkspaceScheduleModel || {}).normalizeTaskTimeUnit?.(...a) ?? 'h';
    }

    function computeProjectSchedule(...a) {
        if (typeof window.computeProjectSchedule === 'function') return window.computeProjectSchedule(...a);
        return (window.KiuSocialWorkspaceScheduleModel || {}).computeProjectSchedule?.(...a) ?? null;
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


    const api = {
        orderDeskTasksByDependency,
        buildDeskTaskForest,
        projectTaskGraphWouldCycle,
        collectProjectTaskGraphGroupDescendantTaskIds,
        collectProjectTaskGraphGroupAbsorbedTaskIds,
        computeProjectTaskGraphGroupRollup,
        PROJECT_TASK_PRIORITY_RANK
    };

    window.KiuSocialWorkspaceGraphDeskModel = api;
})();
