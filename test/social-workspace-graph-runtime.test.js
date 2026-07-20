import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import vm from 'vm';

function loadGraphRuntime(extraDeps = {}) {
    const runtime = {
        social: { projects: [] },
        ui: { projectTaskGraphPan: { x: 0, y: 0 } }
    };
    const sandbox = {
        window: {},
        String,
        Boolean,
        Number,
        Array,
        Object,
        Promise,
        Set,
        Map,
        Math,
        Date,
        JSON,
        console,
        encodeURIComponent,
        isNaN,
        parseInt,
        parseFloat,
        isFinite: Number.isFinite,
        requestAnimationFrame: (fn) => setTimeout(fn, 0),
        cancelAnimationFrame: (id) => clearTimeout(id),
        localStorage: {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {}
        },
        document: {
            getElementById: () => null,
            querySelector: () => null,
            querySelectorAll: () => [],
            createElement: () => ({ style: {}, setAttribute() {}, appendChild() {} })
        }
    };
    sandbox.window.window = sandbox.window;
    sandbox.window.document = sandbox.document;
    sandbox.window.localStorage = sandbox.localStorage;
    sandbox.window.requestAnimationFrame = sandbox.requestAnimationFrame;
    sandbox.window.cancelAnimationFrame = sandbox.cancelAnimationFrame;
    vm.runInNewContext(
        readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace-graph-sync-runtime.js'), 'utf8'),
        sandbox
    );
    vm.runInNewContext(
        readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace-graph-runtime.js'), 'utf8'),
        sandbox
    );

    const stub = () => '';
    const stubFn = () => {};
    const deps = {
        text: (v) => String(v == null ? '' : v).trim(),
        escape: (v) => String(v == null ? '' : v)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;'),
        state: () => runtime,
        uniqueStrings: (vals) => [...new Set((Array.isArray(vals) ? vals : [vals]).map(String).filter(Boolean))],
        when: (v) => String(v || ''),
        openDialog: stubFn,
        renderDialogOnlyNow: stubFn,
        withBusy: async (fn) => fn(),
        ...extraDeps
    };

    const source = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace-graph-runtime.js'), 'utf8');
    const m = source.match(/const \{\n(?<body>.*?)\n        \} = deps;/s);
    for (const name of m.groups.body.split(',').map((s) => s.trim()).filter(Boolean)) {
        if (!(name in deps)) {
            if (name === 'PROJECT_TASK_GRAPH_STACKED_DIALOGS') deps[name] = new Set();
            else deps[name] = name.startsWith('PROJECT_') ? 0 : (name.startsWith('render') ? stub : stubFn);
        }
    }

    const api = sandbox.window.createKiuSocialWorkspaceGraphRuntimeApi(deps);
    return { api, runtime, sandbox };
}

describe('social-workspace-graph-runtime', () => {
    let api;
    let runtime;
    let sandbox;

    beforeEach(() => {
        ({ api, runtime, sandbox } = loadGraphRuntime());
    });

    it('loads factory and peels runtime from social-workspace.js', () => {
        expect(sandbox.window.__KIU_SOCIAL_WORKSPACE_GRAPH_RUNTIME_LOADED).toBe(true);
        expect(typeof api.bindProjectTaskGraphInteractions).toBe('function');
        expect(typeof api.findFreeProjectTaskGraphPosition).toBe('function');
        expect(typeof api.shouldRenderProjectTaskGraphStack).toBe('function');

        const workspace = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace.js'), 'utf8');
        const page = readFileSync(join(process.cwd(), 'assets/js/pages/social-page.js'), 'utf8');
        expect(workspace).not.toMatch(/function\s+bindProjectTaskGraphInteractions\s*\(/);
        expect(workspace).not.toMatch(/function\s+findFreeProjectTaskGraphPosition\s*\(/);
        expect(workspace).toContain('createKiuSocialWorkspaceGraphRuntimeApi');
        expect(page).toContain('SOCIAL_WORKSPACE_GRAPH_SYNC_RUNTIME_URL');
        expect(page).toContain('SOCIAL_WORKSPACE_GRAPH_RUNTIME_URL');
        expect(page.indexOf('SOCIAL_WORKSPACE_GRAPH_SYNC_RUNTIME_URL'))
            .toBeLessThan(page.indexOf('SOCIAL_WORKSPACE_GRAPH_RUNTIME_URL'));
        expect(page.indexOf('SOCIAL_WORKSPACE_GRAPH_RUNTIME_URL'))
            .toBeLessThan(page.lastIndexOf('SOCIAL_WORKSPACE_MODULE_URL'));
    });

    it('reports stacked dialogs inactive without open dialog', () => {
        expect(api.shouldRenderProjectTaskGraphStack(runtime)).toBe(false);
        expect(api.isProjectTaskGraphStackActive(runtime)).toBe(false);
    });
});
