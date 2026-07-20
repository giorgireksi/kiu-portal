/* Pure social task helpers (matrix priority, time/budget, status, flow edges).
 * ESM leaf: social.html type=module; classic bridge for defer consumers.
 */
'use strict';

function hooks() {
    return window.__kiuSocialWorkspaceHooks || window.__kiuSocialTaskHooks || {};
}

function text(value) {
    const hook = hooks().text;
    if (typeof hook === 'function') return hook(value);
    if (typeof window.text === 'function' && window.text !== text) {
        try { return window.text(value); } catch (e) {}
    }
    return String(value == null ? '' : value).trim();
}

function projectTaskDependsOnIds(task) {
    if (typeof window.projectTaskDependsOnIds === 'function') {
        // Prefer workspace impl when loaded; avoid recursion if we export later
        const impl = window.projectTaskDependsOnIds;
        if (impl !== projectTaskDependsOnIdsLocal) return impl(task);
    }
    return projectTaskDependsOnIdsLocal(task);
}

function projectTaskDependsOnIdsLocal(task) {
    const ids = Array.isArray(task?.dependsOnTaskIds) ? task.dependsOnTaskIds : [];
    return [...new Set(ids.map((id) => text(id)).filter(Boolean))];
}

const PROJECT_TASK_COLUMNS = [
    { id: 'todo', label: 'To Do', tone: 'blue', icon: 'fa-list-check' },
    { id: 'in-progress', label: 'In Progress', tone: 'orange', icon: 'fa-bolt' },
    { id: 'blocked', label: 'Blocked', tone: 'rose', icon: 'fa-ban' },
    { id: 'done', label: 'Done', tone: 'emerald', icon: 'fa-circle-check' }
];
const PROJECT_TASK_STATUS_RANK = Object.fromEntries(PROJECT_TASK_COLUMNS.map((column, index) => [column.id, index]));
const PROJECT_TASK_PRIORITY_RANK = { urgent: 0, high: 1, medium: 2, low: 3 };

function compareProjectTaskGraphNodes(leftTask, rightTask) {
    if (typeof window.compareProjectTaskGraphNodes === 'function'
        && window.compareProjectTaskGraphNodes !== compareProjectTaskGraphNodes) {
        return window.compareProjectTaskGraphNodes(leftTask, rightTask);
    }
    const rankA = PROJECT_TASK_PRIORITY_RANK[text(leftTask?.priority).toLowerCase()] ?? 2;
    const rankB = PROJECT_TASK_PRIORITY_RANK[text(rightTask?.priority).toLowerCase()] ?? 2;
    if (rankA !== rankB) return rankA - rankB;
    const dueA = Date.parse(text(leftTask?.dueAt)) || Infinity;
    const dueB = Date.parse(text(rightTask?.dueAt)) || Infinity;
    if (dueA !== dueB) return dueA - dueB;
    return text(leftTask?.title).localeCompare(text(rightTask?.title));
}

function computePertExpected(optimistic, mostLikely, pessimistic) {
    if (typeof window.computePertExpected === 'function') {
        return window.computePertExpected(optimistic, mostLikely, pessimistic);
    }
    const o = normalizeTaskTime(optimistic);
    const m = normalizeTaskTime(mostLikely);
    const p = normalizeTaskTime(pessimistic);
    if (o > 0 && m > 0 && p > 0 && o <= m && m <= p) {
        return Math.round(((o + 4 * m + p) / 6) * 10) / 10;
    }
    return m || 0;
}

function projectTaskDownstreamIds(taskId, tasks = []) {
    const id = text(taskId);
    if (!id) return [];
    return (Array.isArray(tasks) ? tasks : [])
        .filter((task) => projectTaskDependsOnIds(task).includes(id))
        .map((task) => text(task?.id))
        .filter(Boolean);
}

function normalizeProjectTaskStatusId(status) {
    const value = text(status || 'todo') || 'todo';
    return value === 'backlog' ? 'todo' : value;
}

/** Count nodes in a desk task forest (DFS). */
function countDeskForestNodes(forest) {
    let n = 0;
    const walk = (nodes) => {
        (nodes || []).forEach((node) => {
            n += 1;
            walk(node.children);
        });
    };
    walk(forest);
    return n;
}

function formatProjectTaskBudgetEstimate(amount, currency = 'USD') {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return '';
    const rounded = Math.round(value * 100) / 100;
    const code = text(currency || 'USD').toUpperCase() || 'USD';
    return `${rounded.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${code}`;
}

function parseProjectTaskBudgetEstimate(value) {
    const raw = text(value).replace(/,/g, '');
    if (!raw) return 0;
    const num = Number(raw);
    if (!Number.isFinite(num) || num < 0) return 0;
    return Math.round(num * 100) / 100;
}

function parseProjectTaskPriorityPayload(form, runtime = {}) {
    const impactScore = normalizeTaskScore1to5(
        form?.projectTaskImpactScore?.value || runtime?.ui?.projectTaskImpactScore
    );
    const effortScore = normalizeTaskScore1to5(
        form?.projectTaskEffortScore?.value || runtime?.ui?.projectTaskEffortScore
    );
    const timeOptimistic = normalizeTaskTime(form?.projectTaskTimeOptimistic?.value ?? runtime?.ui?.projectTaskTimeOptimistic);
    const timeMostLikely = normalizeTaskTime(form?.projectTaskTimeMostLikely?.value ?? runtime?.ui?.projectTaskTimeMostLikely);
    const timePessimistic = normalizeTaskTime(form?.projectTaskTimePessimistic?.value ?? runtime?.ui?.projectTaskTimePessimistic);
    const timeUnit = normalizeTaskTimeUnit(form?.projectTaskTimeUnit?.value ?? runtime?.ui?.projectTaskTimeUnit);
    const pertExpected = computePertExpected(timeOptimistic, timeMostLikely, timePessimistic);
    const timeEstimate = pertExpected > 0
        ? pertExpected
        : (timeMostLikely || normalizeTaskTime(form?.projectTaskTimeEstimate?.value ?? runtime?.ui?.projectTaskTimeEstimate));
    const priority = computeTaskMatrixBucket(computeTaskMatrixScore(impactScore, effortScore));
    return { priorityModel: 'matrix', impactScore, effortScore, timeOptimistic, timeMostLikely, timePessimistic, timeEstimate, timeUnit, priority };
}

function parseProjectTaskActualsPayload(form, runtime = {}) {
    return {
        actualTime: normalizeTaskTime(form?.projectTaskActualTime?.value ?? runtime?.ui?.projectTaskActualTime),
        actualCost: Math.max(0, Math.round((Number(form?.projectTaskActualCost?.value ?? runtime?.ui?.projectTaskActualCost) || 0) * 100) / 100)
    };
}

function normalizeTaskScore1to5(value, fallback = 3) {
    const n = Math.round(Number(value));
    if (!Number.isFinite(n)) return fallback;
    return Math.max(1, Math.min(5, n));
}

function normalizeTaskPriorityModel(value) {
    const v = text(value).toLowerCase();
    return v === 'matrix' ? v : 'manual';
}

function computeTaskMatrixScore(impact, effort) {
    const i = normalizeTaskScore1to5(impact);
    const e = normalizeTaskScore1to5(effort);
    return i * (6 - e);
}

function computeTaskMatrixBucket(score) {
    const s = Number(score) || 0;
    if (s >= 20) return 'urgent';
    if (s >= 15) return 'high';
    if (s >= 8) return 'medium';
    return 'low';
}

// Cost can be money and/or time. Time is a number + unit ('h' hours / 'd' days).
function normalizeTaskTimeUnit(value) {
    return text(value).toLowerCase() === 'd' ? 'd' : 'h';
}

function normalizeTaskTime(value) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? Math.round(n * 10) / 10 : 0;
}

function formatTaskTime(value, unit) {
    const n = normalizeTaskTime(value);
    if (n <= 0) return '';
    return `${Number.isInteger(n) ? n : n.toFixed(1)}${normalizeTaskTimeUnit(unit)}`;
}

function formatTaskTimeVariance(estimate, actual, unit = 'h', vsPert = false) {
    const est = normalizeTaskTime(estimate);
    const act = normalizeTaskTime(actual);
    if (est <= 0 && act <= 0) return null;
    const delta = Math.round((act - est) * 10) / 10;
    const tone = delta > 0 ? 'rose' : delta < 0 ? 'emerald' : 'slate';
    const estLabel = vsPert ? 'PERT' : 'est';
    const deltaSuffix = vsPert ? ' vs PERT' : '';
    const deltaLabel = delta === 0 ? 'on plan' : `${delta > 0 ? '+' : ''}${formatTaskTime(Math.abs(delta), unit)}${deltaSuffix}`;
    return {
        label: `${formatTaskTime(est, unit) || '0h'} ${estLabel} · ${formatTaskTime(act, unit) || '0h'} act · ${deltaLabel}`,
        tone,
        compact: delta === 0 ? 'on plan' : `${delta > 0 ? '+' : ''}${formatTaskTime(Math.abs(delta), unit)}${deltaSuffix}`
    };
}

function formatTaskCostVariance(estimate, actual, currency = 'USD') {
    const est = Math.max(0, Math.round((Number(estimate) || 0) * 100) / 100);
    const act = Math.max(0, Math.round((Number(actual) || 0) * 100) / 100);
    if (est <= 0 && act <= 0) return null;
    const delta = Math.round((act - est) * 100) / 100;
    const tone = delta > 0 ? 'rose' : delta < 0 ? 'emerald' : 'slate';
    const fmt = (n) => formatProjectTaskBudgetEstimate(n, currency) || `${n} ${currency}`;
    const deltaLabel = delta === 0 ? 'on plan' : `${delta > 0 ? '+' : '-'}${fmt(Math.abs(delta))}`;
    return {
        label: `${fmt(est)} est · ${fmt(act)} act · ${deltaLabel}`,
        tone
    };
}

// Impact×Effort is the headline priority. Always matrix now (no manual/mode).

// Impact×Effort is the headline priority. Always matrix now (no manual/mode).

function buildProjectTaskFlowEdges(taskList = [], explicitPairs = new Set()) {
    const sorted = [...taskList].sort((left, right) => {
        const rankLeft = PROJECT_TASK_STATUS_RANK[text(left?.status || 'todo')] ?? 0;
        const rankRight = PROJECT_TASK_STATUS_RANK[text(right?.status || 'todo')] ?? 0;
        if (rankLeft !== rankRight) return rankLeft - rankRight;
        return compareProjectTaskGraphNodes(left, right);
    });
    const flowEdges = [];
    sorted.forEach((task, index) => {
        if (index >= sorted.length - 1) return;
        const fromId = text(task?.id);
        const toId = text(sorted[index + 1]?.id);
        if (!fromId || !toId || fromId === toId) return;
        if (explicitPairs.has(`${fromId}->${toId}`)) return;
        flowEdges.push({ from: fromId, to: toId, kind: 'flow' });
    });
    return flowEdges;
}


export const socialTaskModelApi = {
    projectTaskDownstreamIds,
    normalizeProjectTaskStatusId,
    countDeskForestNodes,
    formatProjectTaskBudgetEstimate,
    parseProjectTaskBudgetEstimate,
    parseProjectTaskPriorityPayload,
    parseProjectTaskActualsPayload,
    normalizeTaskScore1to5,
    normalizeTaskPriorityModel,
    computeTaskMatrixScore,
    computeTaskMatrixBucket,
    normalizeTaskTimeUnit,
    normalizeTaskTime,
    formatTaskTime,
    formatTaskTimeVariance,
    formatTaskCostVariance,
    buildProjectTaskFlowEdges,
    projectTaskDependsOnIds: projectTaskDependsOnIdsLocal,
    compareProjectTaskGraphNodes,
    PROJECT_TASK_COLUMNS,
    PROJECT_TASK_STATUS_RANK,
    PROJECT_TASK_PRIORITY_RANK
};

/** Install classic window / Kiu surface (idempotent). */
export function installSocialTaskModel(target = typeof window !== 'undefined' ? window : globalThis) {
    if (!target || target.__KIU_SOCIAL_TASK_MODEL_LOADED) {
        return target?.KiuSocialTaskModel || socialTaskModelApi;
    }
    target.__KIU_SOCIAL_TASK_MODEL_LOADED = true;
    target.__kiuSocialTaskModelExports = socialTaskModelApi;
    target.KiuSocialTaskModel = socialTaskModelApi;
    Object.keys(socialTaskModelApi).forEach((key) => {
        const value = socialTaskModelApi[key];
        if (typeof value === 'function') {
            if (typeof target[key] !== 'function') target[key] = value;
        } else if (target[key] == null) {
            target[key] = value;
        }
    });
    return socialTaskModelApi;
}

// type=module script tag: assign window surface for classic defer consumers
installSocialTaskModel();

