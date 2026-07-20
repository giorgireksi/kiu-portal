import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import vm from 'vm';

function loadChrome(extraDeps = {}) {
    const sandbox = {
        window: {},
        String, Boolean, Number, Array, Object, Promise, Set, Map, Math, Date, JSON, console,
        encodeURIComponent, isNaN, parseInt, parseFloat, isFinite: Number.isFinite
    };
    sandbox.window.window = sandbox.window;
    vm.runInNewContext(
        readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace-project-chrome.js'), 'utf8'),
        sandbox
    );
    const stub = () => '';
    const stubFn = () => {};
    const deps = {
        text: (v) => String(v == null ? '' : v).trim(),
        escape: (v) => String(v == null ? '' : v)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
        uniqueStrings: (vals) => [...new Set((Array.isArray(vals) ? vals : [vals]).map(String).filter(Boolean))],
        currentFacultyCode: () => 'ECON',
        currentUserId: () => 'u1',
        displayName: () => 'User',
        accountById: () => null,
        accountSubtitle: () => '',
        avatar: () => '',
        facultyLabel: (v) => String(v || ''),
        roleLabel: (v) => String(v || ''),
        isStaffAccount: () => false,
        controlId: (a, b) => `${a}-${b || 'x'}`,
        toDateTimeLocalValue: () => '',
        resolveActiveSocialProject: () => null,
        neoHead: (t) => `<div>${t}</div>`,
        neoField: () => '',
        neoActions: () => '',
        neoSection: () => '',
        ...extraDeps
    };
    const source = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace-project-chrome.js'), 'utf8');
    const m = source.match(/const \{\n(?<body>.*?)\n        \} = deps;/s);
    for (const name of m.groups.body.split(',').map((s) => s.trim()).filter(Boolean)) {
        if (!(name in deps)) deps[name] = name.startsWith('render') || name.startsWith('neo') ? stub : stubFn;
    }
    return { api: sandbox.window.createKiuSocialWorkspaceProjectChromeApi(deps), sandbox };
}

describe('social-workspace-project-chrome', () => {
    let api;
    let sandbox;
    beforeEach(() => { ({ api, sandbox } = loadChrome()); });

    it('loads factory and peels chrome from social-workspace.js', () => {
        expect(sandbox.window.__KIU_SOCIAL_WORKSPACE_PROJECT_CHROME_LOADED).toBe(true);
        expect(typeof api.renderWorkspaceHero).toBe('function');
        expect(typeof api.renderProjectCreateDialog).toBe('function');
        expect(typeof api.renderProjectSettingsDialog).toBe('function');
        const workspace = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace.js'), 'utf8');
        const page = readFileSync(join(process.cwd(), 'assets/js/pages/social-page.js'), 'utf8');
        expect(workspace).not.toMatch(/function\s+renderWorkspaceHero\s*\(/);
        expect(workspace).not.toMatch(/function\s+renderProjectCreateDialog\s*\(/);
        expect(workspace).toContain('createKiuSocialWorkspaceProjectChromeApi');
        expect(page).toContain('SOCIAL_WORKSPACE_PROJECT_CHROME_URL');
        expect(page).toMatch(/PORTFOLIO_RUNTIME_URL[\s\S]*PORTFOLIO_UI_URL[\s\S]*PROJECT_CHROME_URL[\s\S]*DIALOG_ROUTE_URL[\s\S]*MODULE_URL/);
    });

    it('renders workspace hero create CTA', () => {
        const html = api.renderWorkspaceHero({ ui: {} }, [], {});
        expect(html).toContain('data-action="project-create-open"');
    });
});
