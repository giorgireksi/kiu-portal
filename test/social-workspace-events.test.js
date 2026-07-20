import { describe, expect, it, beforeEach } from 'vitest';
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
});
