import { describe, expect, it, beforeEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import vm from 'vm';

function loadEvents(extraDeps = {}) {
    const runtime = {
        ui: {
            activePanel: 'workspace',
            activeProjectId: '',
            projectTab: 'overview',
            projectHubScope: 'mine',
            projectHubViewMode: 'grid',
            projectHubStatus: 'all'
        }
    };
    const renders = [];
    const sandbox = {
        window: {
            localStorage: {
                _data: {},
                setItem(k, v) { this._data[k] = String(v); },
                getItem(k) { return this._data[k] ?? null; }
            }
        },
        document: { body: {} },
        String,
        Boolean,
        Number,
        Array,
        Object,
        Promise,
        Set,
        Map,
        console,
        Math,
        Date,
        JSON,
        encodeURIComponent,
        isNaN,
        parseInt,
        parseFloat
    };
    sandbox.window.window = sandbox.window;
    sandbox.window.localStorage = sandbox.localStorage;
    vm.runInNewContext(
        readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace-events-input-runtime.js'), 'utf8'),
        sandbox
    );
    vm.runInNewContext(
        readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace-events-submit-runtime.js'), 'utf8'),
        sandbox
    );
    vm.runInNewContext(
        readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace-events.js'), 'utf8'),
        sandbox
    );

    const stub = () => {};
    const deps = {
        text: (v) => String(v == null ? '' : v).trim(),
        state: () => runtime,
        renderSocialPageNow: (reason) => { renders.push(reason); return reason; },
        clearProjectTabPaneCache: stub,
        isSocialWorkspaceClickAction: (a) => String(a || '').startsWith('project-')
            || String(a || '').startsWith('portfolio-')
            || a === 'projects-back',
        isSocialWorkspaceSubmitForm: () => false,
        isSocialWorkspaceInputTarget: () => false,
        isSocialWorkspaceChangeTarget: () => false,
        withBusy: (fn) => fn(),
        setPanel: stub,
        openDialog: stub,
        closeDialog: stub,
        activeDialog: () => null,
        ...extraDeps
    };
    // Fill any remaining destructure keys with stubs so create() does not throw on missing optional helpers
    const source = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace-events.js'), 'utf8');
    const m = source.match(/const \{\n(?<body>.*?)\n        \} = deps;/s);
    for (const name of m.groups.body.split(',').map((s) => s.trim()).filter(Boolean)) {
        if (!(name in deps)) deps[name] = stub;
    }

    const api = sandbox.window.createKiuSocialWorkspaceEventsApi(deps);
    return { api, runtime, renders, sandbox };
}

describe('social-workspace-events', () => {
    let api;
    let runtime;
    let renders;
    let sandbox;

    beforeEach(() => {
        ({ api, runtime, renders, sandbox } = loadEvents());
    });

    it('handles project-open and peels from social-workspace.js', () => {
        expect(sandbox.window.__KIU_SOCIAL_WORKSPACE_EVENTS_LOADED).toBe(true);
        const trigger = {
            getAttribute: (name) => (name === 'data-project-id' ? 'p1' : '')
        };
        const result = api.handleSocialWorkspaceClick('project-open', trigger);
        expect(runtime.ui.activeProjectId).toBe('p1');
        expect(runtime.ui.projectTab).toBe('overview');
        expect(renders).toContain('project-open');
        expect(result).toBe('project-open');

        const workspace = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace.js'), 'utf8');
        const page = readFileSync(join(process.cwd(), 'assets/js/pages/social-page.js'), 'utf8');
        expect(workspace).not.toMatch(/function\s+handleSocialWorkspaceClick\s*\(/);
        expect(workspace).not.toMatch(/function\s+handleSocialWorkspaceSubmit\s*\(/);
        expect(workspace).toContain('createKiuSocialWorkspaceEventsApi');
        expect(page).toContain('SOCIAL_WORKSPACE_EVENTS_URL');
        expect(page.indexOf('SOCIAL_WORKSPACE_EVENTS_URL')).toBeLessThan(
            page.indexOf('SOCIAL_WORKSPACE_MODULE_URL')
        );
        expect(page).toMatch(/WEEK_PLAN_MODEL_URL[\s\S]*SCHEDULE_UI_URL[\s\S]*TAB_RUNTIME_URL[\s\S]*EVENTS_URL[\s\S]*MODULE_URL/);
    });

    it('ignores non-workspace click actions', () => {
        expect(api.handleSocialWorkspaceClick('post-react', { getAttribute: () => '' })).toBe(false);
    });

    it('keeps Health plan interactions from jumping the panel', () => {
        const patchProjectHealthPlanCard = vi.fn(() => true);
        const trigger = {
            getAttribute: (name) => name === 'data-window' ? 'months' : '',
            closest: () => null
        };
        ({ api } = loadEvents({ patchProjectHealthPlanCard }));

        api.handleSocialWorkspaceClick('project-health-plan-window', trigger);
        expect(patchProjectHealthPlanCard).toHaveBeenCalledWith(
            runtime,
            expect.objectContaining({
                focusWindow: 'months',
                scrollState: expect.objectContaining({
                    pageTop: 0,
                    bodyTop: 0
                })
            })
        );
    });

    it('preserves Health position when opening the plan picker', () => {
        const openDialog = vi.fn();
        const trigger = {
            getAttribute: (name) => ({
                'data-project-id': 'p1',
                'data-window': 'weeks'
            }[name] || ''),
            closest: () => null
        };
        ({ api } = loadEvents({
            openDialog,
            normalizeProjectPlanHorizon: (value) => value
        }));

        api.handleSocialWorkspaceClick('project-health-plan-pick-open', trigger);
        expect(openDialog).toHaveBeenCalledWith('project-health-plan-pick', {
            projectId: 'p1',
            horizon: 'weeks'
        });
    });

    it('opens task graph when stack anchor is stale instead of restoring', () => {
        const restorePreviousDialog = vi.fn();
        const openDialog = vi.fn();
        ({ api, runtime } = loadEvents({
            restorePreviousDialog,
            openDialog,
            isProjectTaskGraphStackActive: () => false,
            getProjectTaskGraphStackAnchorDialog: () => null,
            resolveActiveSocialProject: () => ({ id: 'p1', tasks: [] }),
            buildProjectTaskGraphModel: () => ({ nodes: [], edges: [] }),
            computeProjectTaskGraphStageSize: () => ({ stageWidth: 800, stageHeight: 600 }),
            buildProjectTaskGraphLayout: () => ({ nodes: [] }),
            projectTaskGraphLayoutUsesSavedPositions: () => false,
            loadProjectTaskGraphView: () => null,
            collectProjectTaskGraphGroupBoxes: () => [],
            computeProjectTaskGraphContentFitView: () => ({ zoom: 1, pan: { x: 0, y: 0 } }),
            saveProjectTaskGraphView: () => {},
            ensureProjectTaskGraphPositionsLoaded: () => {},
            PROJECT_TASK_GRAPH_MIN_ZOOM: 0.25
        }));
        runtime.ui.socialDialog = null;
        runtime.ui.previousDialog = null;
        runtime.ui.projectTaskGraphStackAnchor = { type: 'project-task-graph', projectId: 'p1' };
        runtime.ui.activeProjectId = 'p1';
        api.handleSocialWorkspaceClick('project-task-graph-open', {
            getAttribute: (name) => (name === 'data-project-id' ? 'p1' : '')
        });
        expect(runtime.ui.projectTaskGraphStackAnchor).toBe(null);
        expect(restorePreviousDialog).not.toHaveBeenCalled();
        expect(openDialog).toHaveBeenCalledWith('project-task-graph', { projectId: 'p1' });
    });
});
