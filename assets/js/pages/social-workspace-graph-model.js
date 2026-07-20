/* Pure task-graph layout / geometry for social workspace.
 * Loaded before social-workspace.js (see ensureSocialWorkspaceModule).
 */
(function initSocialWorkspaceGraphModel() {
    'use strict';
    if (window.__KIU_SOCIAL_WORKSPACE_GRAPH_MODEL_LOADED) return;
    window.__KIU_SOCIAL_WORKSPACE_GRAPH_MODEL_LOADED = true;

    function hooks() {
        return window.__kiuSocialWorkspaceHooks || {};
    }


    function accountById(id) {
        if (typeof window.accountById === 'function' && window.accountById !== accountById) {
            return window.accountById(id);
        }
        const hook = hooks().accountById;
        if (typeof hook === 'function') return hook(id);
        return null;
    }

    function text(value) {
        const hook = hooks().text;
        if (typeof hook === 'function') return hook(value);
        return String(value == null ? '' : value).trim();
    }

    function projectTaskDependsOnIds(task) {
        if (typeof window.projectTaskDependsOnIds === 'function' && window.projectTaskDependsOnIds !== projectTaskDependsOnIds) {
            return window.projectTaskDependsOnIds(task);
        }
        const hook = hooks().projectTaskDependsOnIds;
        if (typeof hook === 'function') return hook(task);
        const ids = Array.isArray(task?.dependsOnTaskIds) ? task.dependsOnTaskIds : [];
        return [...new Set(ids.map((id) => text(id)).filter(Boolean))];
    }


    function uniqueStrings(list) {
        const hook = (window.__kiuSocialWorkspaceHooks || {}).uniqueStrings;
        if (typeof hook === 'function') return hook(list);
        return [...new Set((Array.isArray(list) ? list : []).map((v) => text(v)).filter(Boolean))];
    }


    function currentUserId() {
        if (typeof window.currentUserId === 'function' && window.currentUserId !== currentUserId) {
            return window.currentUserId();
        }
        const hook = (window.__kiuSocialWorkspaceHooks || {}).currentUserId;
        if (typeof hook === 'function') return hook();
        return '';
    }

    function sortProjectBoardTasksByPriority(tasks = []) {
        const list = Array.isArray(tasks) ? tasks : [];
        return [...list].sort((a, b) => {
            const rankA = PROJECT_TASK_PRIORITY_RANK[text(a?.priority).toLowerCase()] ?? 2;
            const rankB = PROJECT_TASK_PRIORITY_RANK[text(b?.priority).toLowerCase()] ?? 2;
            if (rankA !== rankB) return rankA - rankB;
            const dueA = Date.parse(text(a?.dueAt)) || Infinity;
            const dueB = Date.parse(text(b?.dueAt)) || Infinity;
            if (dueA !== dueB) return dueA - dueB;
            return text(a?.title).localeCompare(text(b?.title));
        });
    }

    function normalizeTaskScore1to5(value, fallback = 3) {
        if (typeof window.normalizeTaskScore1to5 === 'function'
            && window.normalizeTaskScore1to5 !== normalizeTaskScore1to5) {
            return window.normalizeTaskScore1to5(value, fallback);
        }
        const n = Math.round(Number(value));
        if (!Number.isFinite(n)) return fallback;
        return Math.max(1, Math.min(5, n));
    }

    function computeTaskMatrixScore(impact, effort) {
        if (typeof window.computeTaskMatrixScore === 'function'
            && window.computeTaskMatrixScore !== computeTaskMatrixScore) {
            return window.computeTaskMatrixScore(impact, effort);
        }
        return normalizeTaskScore1to5(impact) * (6 - normalizeTaskScore1to5(effort));
    }

    function computeTaskMatrixBucket(score) {
        if (typeof window.computeTaskMatrixBucket === 'function'
            && window.computeTaskMatrixBucket !== computeTaskMatrixBucket) {
            return window.computeTaskMatrixBucket(score);
        }
        const s = Number(score) || 0;
        if (s >= 20) return 'urgent';
        if (s >= 15) return 'high';
        if (s >= 8) return 'medium';
        return 'low';
    }

    function normalizeProjectPlanHorizon(value) {
        if (typeof window.normalizeProjectPlanHorizon === 'function'
            && window.normalizeProjectPlanHorizon !== normalizeProjectPlanHorizon) {
            return window.normalizeProjectPlanHorizon(value);
        }
        const raw = text(value || '').toLowerCase();
        if (raw === 'week' || raw === '2weeks' || raw === '2week') return 'weeks';
        if (['days', 'weeks', 'months', 'all'].includes(raw)) return raw;
        return 'weeks';
    }

    function resolveActiveSocialProject(runtime, projectId) {
        if (typeof window.resolveActiveSocialProject === 'function'
            && window.resolveActiveSocialProject !== resolveActiveSocialProject) {
            return window.resolveActiveSocialProject(runtime, projectId);
        }
        const hook = (window.__kiuSocialWorkspaceHooks || {}).resolveActiveSocialProject;
        if (typeof hook === 'function') return hook(runtime, projectId);
        return null;
    }


    function normalizeProjectTaskStatusId(status) {
        if (typeof window.normalizeProjectTaskStatusId === 'function'
            && window.normalizeProjectTaskStatusId !== normalizeProjectTaskStatusId) {
            return window.normalizeProjectTaskStatusId(status);
        }
        const raw = text(status || 'todo') || 'todo';
        return raw === 'backlog' ? 'todo' : raw;
    }

    function isProjectTaskGraphGroupId(id) {
        if (typeof window.isProjectTaskGraphGroupId === 'function'
            && window.isProjectTaskGraphGroupId !== isProjectTaskGraphGroupId) {
            return window.isProjectTaskGraphGroupId(id);
        }
        return text(id).startsWith('grp_');
    }

    function projectGroupBlocksIds(g) {
        if (typeof window.projectGroupBlocksIds === 'function'
            && window.projectGroupBlocksIds !== projectGroupBlocksIds) {
            return window.projectGroupBlocksIds(g);
        }
        return uniqueStrings(g?.blocksIds || []);
    }

    function projectGroupDependsOnIds(g) {
        if (typeof window.projectGroupDependsOnIds === 'function'
            && window.projectGroupDependsOnIds !== projectGroupDependsOnIds) {
            return window.projectGroupDependsOnIds(g);
        }
        return uniqueStrings(g?.dependsOnIds || []);
    }

    function getProjectTaskGraphGroups(st, pid) {
        if (typeof window.getProjectTaskGraphGroups === 'function'
            && window.getProjectTaskGraphGroups !== getProjectTaskGraphGroups) {
            return window.getProjectTaskGraphGroups(st, pid);
        }
        return [];
    }

    function state() {
        if (typeof window.state === 'function' && window.state !== state) return window.state();
        const hook = (window.__kiuSocialWorkspaceHooks || {}).state;
        if (typeof hook === 'function') return hook();
        return {};
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

    /** Group is "done" for sequencing when every descendant task is done (empty group = done). */
    function isProjectTaskGraphGroupComplete(group, taskById = new Map(), groups = []) {
        const members = collectProjectTaskGraphGroupDescendantTaskIds(group, groups, { includeOrderLinks: false });
        if (!members.length) return true;
        return members.every((id) => {
            const task = taskById.get(id);
            return task && normalizeProjectTaskStatusId(task?.status) === 'done';
        });
    }

    function projectTaskGraphContentViewBox(layout = {}, extraBoxes = [], pad = 36) {
        const bounds = projectTaskGraphContentBounds(layout, pad, extraBoxes);
        return {
            bounds,
            viewBox: `${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`
        };
    }

    const PROJECT_TASK_GRAPH_PAN_SLACK = 2400;

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

    function projectTaskGraphScrollOffsets(panX, panY, slack = resolveProjectTaskGraphPanSlack()) {
        const pad = Math.max(0, Math.round(Number(slack) || 0));
        return {
            scrollLeft: Math.round(pad + (Number(panX) || 0)),
            scrollTop: Math.round(pad + (Number(panY) || 0))
        };
    }


    function buildProjectTaskFlowEdges(taskList, explicitPairs) {
        if (typeof window.buildProjectTaskFlowEdges === 'function') {
            return window.buildProjectTaskFlowEdges(taskList, explicitPairs);
        }
        const hook = hooks().buildProjectTaskFlowEdges;
        if (typeof hook === 'function') return hook(taskList, explicitPairs);
        return [];
    }

    const PROJECT_TASK_COLUMNS = [
        { id: 'todo', label: 'To Do', tone: 'blue', icon: 'fa-list-check' },
        { id: 'in-progress', label: 'In Progress', tone: 'orange', icon: 'fa-bolt' },
        { id: 'blocked', label: 'Blocked', tone: 'rose', icon: 'fa-ban' },
        { id: 'done', label: 'Done', tone: 'emerald', icon: 'fa-circle-check' }
    ];
    const PROJECT_TASK_GRAPH_CARD_W = 256;
    const PROJECT_TASK_GRAPH_CARD_H = 188;
    const PROJECT_TASK_GRAPH_CARD_COMPACT_W = 200;
    const PROJECT_TASK_GRAPH_CARD_COMPACT_H = 100;
    const PROJECT_TASK_GRAPH_FO_PAD = 20;
    const PROJECT_TASK_GRAPH_MIN_ZOOM = 0.12;
    const PROJECT_TASK_GRAPH_MAX_ZOOM = 1.6;
    const PROJECT_TASK_GRAPH_CARD_MIN_H = 168;
    const PROJECT_TASK_GRAPH_CARD_MAX_H = 280;
    const PROJECT_TASK_GRAPH_CARD_COMPACT_MIN_H = 88;
    const PROJECT_TASK_GRAPH_CARD_COMPACT_MAX_H = 180;
    const PROJECT_TASK_GRAPH_IMMERSIVE_CHROME_H = 112;
    const PROJECT_TASK_STATUS_RANK = Object.fromEntries(PROJECT_TASK_COLUMNS.map((column, index) => [column.id, index]));
    const PROJECT_TASK_PRIORITY_RANK = { urgent: 0, high: 1, medium: 2, low: 3 };

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

    function normalizeProjectTaskGraphMode(mode = '') {
        const raw = text(mode || 'browse') || 'browse';
        // Legacy mode names collapse into browse | connect
        if (raw === 'view' || raw === 'explore' || raw === 'arrange') return 'browse';
        if (raw === 'link' || raw === 'connect') return 'connect';
        if (raw === 'browse' || raw === 'connect') return raw;
        return 'browse';
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

    function clampProjectTaskGraphZoom(zoom, options = {}) {
        const minZoom = Number.isFinite(Number(options.minZoom)) ? Number(options.minZoom) : PROJECT_TASK_GRAPH_MIN_ZOOM;
        const maxZoom = Number.isFinite(Number(options.maxZoom)) ? Number(options.maxZoom) : PROJECT_TASK_GRAPH_MAX_ZOOM;
        const z = Number(zoom);
        if (!Number.isFinite(z) || z <= 0) return minZoom;
        return Math.max(minZoom, Math.min(maxZoom, z));
    }

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


    function resolveDeskTaskReadiness(task, taskById = new Map(), groups = null) {
        const statusId = normalizeProjectTaskStatusId(task?.status);
        if (statusId === 'done') {
            return { kind: 'done', label: 'Done', openDeps: [], openCount: 0 };
        }
        const groupList = Array.isArray(groups)
            ? groups
            : (typeof getProjectTaskGraphGroups === 'function'
                ? getProjectTaskGraphGroups(state(), text(task?.projectId || state().ui?.activeProjectId || ''))
                : []);
        const tid = text(task?.id);
        // Task.dependsOnTaskIds plus packages that list this task in blocksIds (group→task wires).
        const depIds = uniqueStrings([
            ...projectTaskDependsOnIds(task),
            ...groupList
                .filter((g) => projectGroupBlocksIds(g).includes(tid))
                .map((g) => text(g?.id))
                .filter(Boolean)
        ]);
        const openDeps = [];
        depIds.forEach((id) => {
            if (isProjectTaskGraphGroupId(id)) {
                if (isProjectGraphDependencyOpen(id, { taskById, groups: groupList })) {
                    const g = groupList.find((entry) => text(entry?.id) === id);
                    openDeps.push(g ? { id, title: text(g.name || 'Package'), status: 'todo', isGroup: true } : { id, title: 'Package', status: 'todo', isGroup: true });
                }
                return;
            }
            const dep = taskById.get(id) || null;
            if (dep && normalizeProjectTaskStatusId(dep.status) !== 'done') openDeps.push(dep);
        });
        if (!openDeps.length) {
            return { kind: 'ready', label: depIds.length ? 'Unblocked' : 'Ready', openDeps: [], openCount: 0 };
        }
        return {
            kind: 'waiting',
            label: 'Waiting',
            openDeps: openDeps.slice(0, 2),
            openCount: openDeps.length
        };
    }

    /* Desk/forest/rollup: social-workspace-graph-desk-model.js (loaded first). */
    const orderDeskTasksByDependency = (...a) => window.orderDeskTasksByDependency?.(...a) ?? [];
    const buildDeskTaskForest = (...a) => window.buildDeskTaskForest?.(...a) ?? [];
    const projectTaskGraphWouldCycle = (...a) => window.projectTaskGraphWouldCycle?.(...a) ?? false;
    const collectProjectTaskGraphGroupDescendantTaskIds = (...a) => window.collectProjectTaskGraphGroupDescendantTaskIds?.(...a) ?? [];
    const collectProjectTaskGraphGroupAbsorbedTaskIds = (...a) => window.collectProjectTaskGraphGroupAbsorbedTaskIds?.(...a) ?? [];
    const computeProjectTaskGraphGroupRollup = (...a) => window.computeProjectTaskGraphGroupRollup?.(...a) ?? null;

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

    function filterProjectBoardTasks(runtime, tasks = []) {
        const searchText = text(runtime.ui?.projectTaskSearch || '').toLowerCase();
        const filterPriority = text(runtime.ui?.projectTaskFilterPriority || 'all');
        const filterAssignee = text(runtime.ui?.projectTaskFilterAssignee || 'all');
        const myOnly = Boolean(runtime.ui?.projectTaskMyOnly);
        const overdueOnly = Boolean(runtime.ui?.projectTaskFilterOverdue);
        const userId = currentUserId();
        const now = Date.now();
        let filtered = Array.isArray(tasks) ? tasks : [];
        if (myOnly) filtered = filtered.filter((t) => text(t.assigneeUserId) === userId);
        if (overdueOnly) {
            filtered = filtered.filter((t) => {
                if (text(t?.status || '') === 'done') return false;
                const dueMs = Number.isFinite(Date.parse(text(t?.dueAt || ''))) ? Date.parse(text(t.dueAt)) : null;
                return Boolean(dueMs && dueMs < now);
            });
        }
        if (searchText) filtered = filtered.filter((t) => text(t.title || '').toLowerCase().includes(searchText) || text(t.description || '').toLowerCase().includes(searchText));
        if (filterPriority !== 'all') filtered = filtered.filter((t) => text(t.priority || 'medium').toLowerCase() === filterPriority);
        if (filterAssignee !== 'all') filtered = filtered.filter((t) => text(t.assigneeUserId) === filterAssignee);
        return sortProjectBoardTasksByPriority(filtered);
    }

    function resolveProjectTaskPriorityDisplay(task) {
        const impact = normalizeTaskScore1to5(task?.impactScore);
        const effort = normalizeTaskScore1to5(task?.effortScore);
        const score = computeTaskMatrixScore(impact, effort);
        const bucket = computeTaskMatrixBucket(score);
        const bucketLabel = bucket.charAt(0).toUpperCase() + bucket.slice(1);
        const icon = { low: 'fa-arrow-down', medium: 'fa-minus', high: 'fa-arrow-up', urgent: 'fa-angles-up' }[bucket] || 'fa-minus';
        return {
            model: 'matrix',
            bucket,
            score,
            maxScore: 25,
            impact,
            effort,
            label: bucketLabel,
            tooltip: `Impact ${impact}/5 · Effort ${effort}/5 · Score ${score}`,
            icon,
            priority: bucket
        };
    }

    function normalizeProjectWeekPlanWindow(value) {
        return normalizeProjectPlanHorizon(value);
    }

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

    // Edge/dock/obstacle geometry helpers peeled from social-workspace.js (lines ~8529-8700).
    // Pure math + text only: no document, no innerHTML, no runtime state.
    const PROJECT_TASK_STATUS_EDGE_COLOR = {
        todo: '#3b82f6',
        'in-progress': '#f59e0b',
        blocked: '#f43f5e',
        done: '#10b981'
    };

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


    function formatProjectTaskGraphNodeLabel(title = '', compact = false) {
        const raw = text(title || 'Task').trim();
        if (!raw) return 'Task';
        // Compact map preview: short; full graph cards: up to 2 visual lines (~48 chars)
        const maxLen = compact ? 18 : 48;
        if (raw.length <= maxLen) return raw;
        return `${raw.slice(0, maxLen - 1)}…`;
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


    // --- Peels: group size, saved positions, checkpoint normalize, flags, scope, escape, storage keys ---
    const PROJECT_TASK_GROUP_NODE_W = 264;
    const PROJECT_TASK_GROUP_NODE_H = 228;

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


    function projectTaskGraphPositionsStorageKey(projectId) {
        return `kiu.projectTaskGraph.positions.${text(projectId)}`;
    }

    function projectTaskGraphViewStorageKey(projectId) {
        return `kiu.projectTaskGraph.view.${text(projectId)}`;
    }

    function projectTaskGraphSyncStorageKey(projectId) {
        return `kiu.projectTaskGraph.sync.${text(projectId)}`;
    }

    function projectTaskGraphGroupsStorageKey(id) {
        return `kiu.social.ptgroups.${text(id)}`;
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

    function escapeProjectTaskGraphAttr(value = '') {
        const raw = text(value);
        if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(raw);
        return raw.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
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
        const computeProjectSchedule = window.computeProjectSchedule
            || (window.KiuSocialWorkspaceScheduleModel || {}).computeProjectSchedule;
        if (typeof computeProjectSchedule !== 'function') {
            return { mineOnly: scope.mineOnly, scopedTaskCount: scope.tasks.length };
        }
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



    // --- Peel: inspector fields, group box, context, layout, pan read ---

    function buildProjectTaskInspectorFields(task) {
        const rawStatus = text(task?.status || 'todo') || 'todo';
        const statusId = rawStatus === 'backlog' ? 'todo' : rawStatus;
        const column = PROJECT_TASK_COLUMNS.find((entry) => entry.id === statusId) || PROJECT_TASK_COLUMNS[0];
        const assignee = accountById(task?.assigneeUserId) || { id: task?.assigneeUserId };
        const dueAt = text(task?.dueAt || '');
        const dueMs = Number.isFinite(Date.parse(dueAt)) ? Date.parse(dueAt) : null;
        const now = Date.now();
        const isOverdue = Boolean(dueMs && dueMs < now && statusId !== 'done');
        const isToday = Boolean(dueMs && !isOverdue && new Date(dueMs).toDateString() === new Date(now).toDateString());
        const isSoon = Boolean(dueMs && !isOverdue && !isToday && dueMs < now + 7 * 86400000);
        const priority = text(task?.priority || 'medium').toLowerCase() || 'medium';
        const budgetEstimate = Number(task?.budgetEstimate);
        const tag = text(task?.tag || task?.category || '');
        const checklist = Array.isArray(task?.checklist) ? task.checklist : [];
        const checklistDone = checklist.filter((item) => item?.done).length;
        const checklistTotal = checklist.length;
        const description = text(task?.description || '').trim();
        return {
            statusId,
            column,
            assignee,
            dueAt,
            isOverdue,
            isToday,
            isSoon,
            priority,
            budgetEstimate: Number.isFinite(budgetEstimate) && budgetEstimate > 0 ? budgetEstimate : 0,
            tag,
            checklistDone,
            checklistTotal,
            description
        };
    }

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

    function readProjectTaskGraphPan(runtime = {}) {
        const pan = runtime.ui?.projectTaskGraphPan;
        return {
            x: Math.round(Number(pan?.x) || 0),
            y: Math.round(Number(pan?.y) || 0)
        };
    }


    const api = {
        PROJECT_TASK_COLUMNS,
        PROJECT_TASK_GRAPH_CARD_W,
        PROJECT_TASK_GRAPH_CARD_H,
        PROJECT_TASK_GRAPH_CARD_COMPACT_W,
        PROJECT_TASK_GRAPH_CARD_COMPACT_H,
        PROJECT_TASK_GRAPH_FO_PAD,
        PROJECT_TASK_GRAPH_MIN_ZOOM,
        PROJECT_TASK_GRAPH_MAX_ZOOM,
        PROJECT_TASK_GRAPH_CARD_MIN_H,
        PROJECT_TASK_GRAPH_CARD_MAX_H,
        PROJECT_TASK_GRAPH_CARD_COMPACT_MIN_H,
        PROJECT_TASK_GRAPH_CARD_COMPACT_MAX_H,
        PROJECT_TASK_GRAPH_IMMERSIVE_CHROME_H,
        PROJECT_TASK_STATUS_RANK,
        PROJECT_TASK_PRIORITY_RANK,
        clampProjectTaskGraphCardHeight,
        estimateProjectTaskGraphCardHeight,
        normalizeProjectTaskGraphMode,
        projectTaskGraphVisibleEdges,
        buildProjectTaskGraphModel,
        layoutProjectTaskGraphByStatus,
        compareProjectTaskGraphNodes,
        hashProjectTaskGraphSeed,
        projectTaskGraphPseudoRandom,
        getProjectTaskGraphMetrics,
        computeProjectTaskGraphStageSize,
        computeProjectTaskGraphNodeDegree,
        projectTaskGraphBoxRepulse,
        resolveProjectTaskGraphCardOverlaps,
        layoutProjectTaskGraphForce,
        projectTaskGraphLayoutUsesSavedPositions,
        projectTaskGraphRectsOverlap,
        projectTaskGraphContentBounds,
        clampProjectTaskGraphZoom,
        computeProjectTaskGraphContentFitView,
        computeProjectTaskGraphFitZoom,
        computeProjectTaskGraphPreviewZoom,
        projectTaskGraphCubicEdgePath,
        resolveDeskTaskReadiness,
        orderDeskTasksByDependency,
        buildDeskTaskForest,
        projectTaskGraphWouldCycle,
        collectProjectTaskGraphGroupDescendantTaskIds,
        collectProjectTaskGraphGroupAbsorbedTaskIds,
        computeProjectTaskGraphGroupRollup,
        scoreProjectTaskGraphDockPair,
        getProjectTaskGraphGroupLinkSummary,
        filterProjectBoardTasks,
        resolveProjectTaskPriorityDisplay,
        normalizeProjectWeekPlanWindow,
        collectProjectTaskGraphNeighborIds,
        sampleProjectTaskGraphPolyline,
        relaxProjectTaskGraphPolyline,
        projectTaskGraphEdgeFanMap,
        buildProjectTaskGraphSeedPolyline,
        projectTaskGraphGroupMembershipWouldCycle,

        // Edge/dock/obstacle geometry peels from social-workspace.js.
        PROJECT_TASK_STATUS_EDGE_COLOR,
        projectTaskGraphBoxAnchor,
        getProjectTaskGraphDocks,
        projectTaskGraphDockAlongSide,
        selectProjectTaskGraphDockPair,
        projectTaskGraphPushOutOfRect,
        normalizeProjectTaskGraphStatusId,
        projectTaskGraphStatusEdgeColor,
        projectTaskGraphEdgePath,
        projectTaskGraphEdgeAnchors,
        projectTaskGraphObstacleList,
        formatProjectTaskGraphNodeLabel,
        projectTaskGraphPortRole,
        resolveProjectTaskGraphWireEndpoints,

        // Dep/group completeness + pan math peels.
        projectTaskDependsOnIds,
        isProjectTaskGraphGroupId,
        projectGroupDependsOnIds,
        projectGroupBlocksIds,
        isProjectTaskGraphGroupComplete,
        isProjectGraphDependencyOpen,
        projectTaskGraphContentViewBox,
        PROJECT_TASK_GRAPH_PAN_SLACK,
        resolveProjectTaskGraphPanSlack,
        clampProjectTaskGraphPan,
        projectTaskGraphScrollOffsets,

        // Sort / saved-pos / checkpoint / flags / scope / escape / storage keys
        sortProjectBoardTasksByPriority,
        PROJECT_TASK_GROUP_NODE_W,
        PROJECT_TASK_GROUP_NODE_H,
        applyProjectTaskGraphSavedPositions,
        projectTaskGraphShowInferred,
        projectTaskGraphShowCritical,
        projectTaskGraphShowFlow,
        projectTaskGraphPositionsStorageKey,
        projectTaskGraphViewStorageKey,
        projectTaskGraphSyncStorageKey,
        projectTaskGraphGroupsStorageKey,
        projectTaskGraphCheckpointStorageKey,
        projectTaskGraphCheckpointsStorageKey,
        formatProjectTaskGraphCheckpointWhen,
        normalizeProjectTaskGraphCheckpointEntry,
        escapeProjectTaskGraphAttr,
        projectTaskGraphMineOnlyActive,
        filterProjectTaskGraphVisibleTasks,
        resolveProjectTaskGraphScheduleScope,
        computeProjectTaskGraphMapSchedule,

        buildProjectTaskInspectorFields,
        resolveProjectTaskGraphGroupBox,
        resolveProjectTaskGraphContext,
        buildProjectTaskGraphLayout,
        readProjectTaskGraphPan
    };

    window.KiuSocialWorkspaceGraphModel = api;
})();
