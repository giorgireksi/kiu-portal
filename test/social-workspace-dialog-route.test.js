import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import vm from 'vm';

function loadRoute(extraDeps = {}) {
    const sandbox = {
        window: {},
        String, Boolean, Number, Array, Object, Promise, Set, Map, Math, Date, JSON, console,
        encodeURIComponent, isNaN, parseInt, parseFloat, isFinite: Number.isFinite
    };
    sandbox.window.window = sandbox.window;
    vm.runInNewContext(
        readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace-dialog-route.js'), 'utf8'),
        sandbox
    );
    const stub = () => '';
    const stubFn = () => {};
    const runtime = { ui: {}, social: { projects: [] } };
    const deps = {
        text: (v) => String(v == null ? '' : v).trim(),
        escape: (v) => String(v == null ? '' : v),
        state: () => runtime,
        activeDialog: () => null,
        resolveActiveSocialProject: () => null,
        shouldRenderProjectTaskGraphStack: () => false,
        wrapProjectTaskGraphStack: (a, b) => b || a || '',
        projectTaskGraphStackedBackdropClass: () => '',
        filterProjectBoardTasks: () => [],
        accountById: () => null,
        displayName: () => '',
        currentUserId: () => 'u1',
        neoHead: stub,
        neoActions: stub,
        ...extraDeps
    };
    const source = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace-dialog-route.js'), 'utf8');
    const m = source.match(/const \{\n(?<body>.*?)\n        \} = deps;/s);
    for (const name of m.groups.body.split(',').map((s) => s.trim()).filter(Boolean)) {
        if (!(name in deps)) deps[name] = name.startsWith('render') || name.startsWith('neo') ? stub : stubFn;
    }
    return { api: sandbox.window.createKiuSocialWorkspaceDialogRouteApi(deps), sandbox, runtime };
}

describe('social-workspace-dialog-route', () => {
    let api;
    let sandbox;
    beforeEach(() => { ({ api, sandbox } = loadRoute()); });

    it('loads factory and peels routing from social-workspace.js', () => {
        expect(sandbox.window.__KIU_SOCIAL_WORKSPACE_DIALOG_ROUTE_LOADED).toBe(true);
        expect(typeof api.renderWorkspaceOwnedDialog).toBe('function');
        expect(typeof api.shouldRenderProjectHealthStack).toBe('function');
        expect(api.WORKSPACE_OWNED_DIALOG_KINDS.has('project-settings')).toBe(true);
        const workspace = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace.js'), 'utf8');
        const page = readFileSync(join(process.cwd(), 'assets/js/pages/social-page.js'), 'utf8');
        expect(workspace).not.toMatch(/function\s+renderWorkspaceOwnedDialog\s*\(/);
        expect(workspace).toContain('createKiuSocialWorkspaceDialogRouteApi');
        expect(page).toContain('SOCIAL_WORKSPACE_DIALOG_ROUTE_URL');
        expect(page).toMatch(/PROJECT_CHROME_URL[\s\S]*DIALOG_ROUTE_URL[\s\S]*MODULE_URL/);
    });

    it('returns empty for unknown dialog kinds', () => {
        expect(api.renderWorkspaceOwnedDialog({ ui: {} }, { type: 'not-a-thing' })).toBe('');
    });
});
