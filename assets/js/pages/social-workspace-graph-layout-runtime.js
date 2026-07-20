/* Project task-graph layout/position helpers. Peeled from social-workspace-graph-runtime.js.
 * Load before social-workspace-graph-runtime.js. Host installs via deps bag.
 */
(function () {
    if (window.__KIU_SOCIAL_WORKSPACE_GRAPH_LAYOUT_LOADED) return;
    window.__KIU_SOCIAL_WORKSPACE_GRAPH_LAYOUT_LOADED = true;
    window.__kiuCreateSocialWorkspaceGraphLayoutApi = function createKiuPeelApi(deps) {
        if (!deps || typeof deps !== 'object') throw new Error('graph layout deps required');
        const d = deps;
        /* Prefer reading helpers from mutable deps bag. */

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

        const api = {
            findFreeProjectTaskGraphPosition,
            ensureProjectTaskGraphPositionForTask,
        };
        Object.assign(window, api);
        Object.assign(d, api);
        return api;
    };
})();

