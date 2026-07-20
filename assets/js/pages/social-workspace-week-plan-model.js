/* Week-plan localStorage helpers for social workspace / health pick.
 * Eager: social.html before social-page.js (migrate used by page hooks).
 * Also loaded in ensureSocialWorkspaceModule before social-workspace.js.
 */
(function initSocialWorkspaceWeekPlanModel() {
    'use strict';
    if (window.__KIU_SOCIAL_WORKSPACE_WEEK_PLAN_MODEL_LOADED) return;
    window.__KIU_SOCIAL_WORKSPACE_WEEK_PLAN_MODEL_LOADED = true;

    const PROJECT_WEEK_PLAN_KEY = 'KIU_SOCIAL_PROJECT_WEEK_PLAN';
    const PROJECT_WEEK_PLAN_MAX = 40;

    function hooks() {
        return window.__kiuSocialWorkspaceHooks || {};
    }

    function text(value) {
        const hook = hooks().text;
        if (typeof hook === 'function') return hook(value);
        return String(value == null ? '' : value).trim();
    }

    function uniqueStrings(values) {
        const hook = hooks().uniqueStrings;
        if (typeof hook === 'function') return hook(values);
        const seen = new Set();
        const out = [];
        (Array.isArray(values) ? values : []).forEach((item) => {
            const v = text(item);
            if (!v || seen.has(v)) return;
            seen.add(v);
            out.push(v);
        });
        return out;
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

    function migrateProjectPlanEntry(raw) {
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
            return { days: [], weeks: [], months: [], all: [] };
        }
        const cleanList = (list) => uniqueStrings((Array.isArray(list) ? list : []).map((id) => text(id)).filter(Boolean)).slice(0, PROJECT_WEEK_PLAN_MAX);
        const weeks = cleanList([
            ...(Array.isArray(raw.weeks) ? raw.weeks : []),
            ...(Array.isArray(raw.week) ? raw.week : []),
            ...(Array.isArray(raw['2weeks']) ? raw['2weeks'] : [])
        ]);
        return {
            days: cleanList(raw.days),
            weeks,
            months: cleanList(raw.months),
            all: cleanList(raw.all)
        };
    }

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

    // Workspace event-routing predicates (pure; no DOM mutation).
    const WORKSPACE_CLICK_ACTION_PREFIXES = ['project-', 'portfolio-', 'projects-'];

    function isSocialWorkspaceClickAction(action) {
        const a = text(action || '');
        if (!a) return false;
        if (a === 'projects-back') return true;
        return WORKSPACE_CLICK_ACTION_PREFIXES.some((p) => a.startsWith(p));
    }

    function isSocialWorkspaceSubmitForm(formType) {
        const f = text(formType || '');
        if (!f) return false;
        if (f === 'create-project' || f === 'create-portfolio' || f === 'portfolio-settings' || f === 'project-settings') return true;
        return f.startsWith('project-') || f.startsWith('dialog-project');
    }

    function isSocialWorkspaceInputTarget(target) {
        if (!target || typeof target.matches !== 'function') return false;
        if (target.matches('input[name="projectHealthPlanPickSearch"]')) return true;
        const name = text(target.name || target.getAttribute?.('name') || '');
        if (/^(project|portfolio)/i.test(name)) return true;
        const ft = text(target.closest?.('form[data-form]')?.getAttribute('data-form') || '');
        if (['create-project', 'project-settings', 'create-portfolio', 'portfolio-settings', 'project-task-create', 'project-task-edit'].includes(ft)) return true;
        return false;
    }

    function isSocialWorkspaceChangeTarget(target) {
        if (!target || typeof target.matches !== 'function') return false;
        if (target.name === 'projectMediaFile') return true;
        if (target.matches('form[data-form="create-project"] [name="projectInviteFaculty"], [name="projectInviteFaculty"], select[name="projectTaskGraphFocusGroup"], select[name="projectDiscoverFaculty"], select[name="projectDiscoverRole"], input[type="checkbox"][data-filter="openOnly"], input[type="checkbox"][data-filter="hidePlanned"]')) return true;
        return false;
    }

    const api = {
        PROJECT_WEEK_PLAN_KEY,
        PROJECT_WEEK_PLAN_MAX,
        normalizeProjectPlanHorizon,
        migrateProjectPlanEntry,
        readProjectWeekPlansStore,
        readProjectWeekPlan,
        writeProjectWeekPlan,
        addToProjectWeekPlan,
        addManyToProjectWeekPlan,
        removeFromProjectWeekPlan,
        isSocialWorkspaceClickAction,
        isSocialWorkspaceSubmitForm,
        isSocialWorkspaceInputTarget,
        isSocialWorkspaceChangeTarget
    };

    window.KiuSocialWorkspaceWeekPlanModel = api;
})();
