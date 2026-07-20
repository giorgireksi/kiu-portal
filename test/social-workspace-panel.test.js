import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import vm from 'vm';

function loadPanel(extraDeps = {}) {
    const runtime = {
        social: { projects: [] },
        directory: [],
        ui: { activeProjectId: '', projectTab: 'overview', projectFacultyCodes: [] }
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
        isFinite: Number.isFinite
    };
    sandbox.window.window = sandbox.window;
    vm.runInNewContext(
        readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace-panel.js'), 'utf8'),
        sandbox
    );

    const stub = () => '';
    const deps = {
        text: (v) => String(v == null ? '' : v).trim(),
        escape: (v) => String(v == null ? '' : v)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;'),
        state: () => runtime,
        uniqueStrings: (vals) => [...new Set((Array.isArray(vals) ? vals : [vals]).map(String).filter(Boolean))],
        currentFacultyCode: () => 'ECON',
        currentUserId: () => 'u1',
        displayName: () => 'User',
        accountById: () => null,
        accountSubtitle: () => '',
        avatar: () => '',
        isStaffAccount: () => false,
        isAccountOnline: () => false,
        countNum: (v) => Number(v || 0),
        when: (v) => String(v || ''),
        PROJECT_TASK_COLUMNS: [
            { id: 'todo', label: 'To Do', tone: 'blue', icon: 'fa-list-check' },
            { id: 'in-progress', label: 'In Progress', tone: 'orange', icon: 'fa-bolt' },
            { id: 'blocked', label: 'Blocked', tone: 'rose', icon: 'fa-ban' },
            { id: 'done', label: 'Done', tone: 'emerald', icon: 'fa-circle-check' }
        ],
        renderWorkspaceHero: () => '<div class="hero"></div>',
        renderSocialPageNow: stub,
        renderDeskTaskTreeForest: stub,
        renderProjectTaskDeskCard: stub,
        renderProjectTaskCard: stub,
        renderProjectTaskColumnList: stub,
        renderMessagesThreadShell: stub,
        socialNeoEmpty: stub,
        socialNeoEmptyHero: (icon, title, copy) => `<div>${title}:${copy}</div>`,
        ...extraDeps
    };

    const source = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace-panel.js'), 'utf8');
    const m = source.match(/const \{\n(?<body>.*?)\n        \} = deps;/s);
    for (const name of m.groups.body.split(',').map((s) => s.trim()).filter(Boolean)) {
        if (!(name in deps)) deps[name] = stub;
    }

    const api = sandbox.window.createKiuSocialWorkspacePanelApi(deps);
    return { api, runtime, sandbox };
}

describe('social-workspace-panel', () => {
    let api;
    let runtime;
    let sandbox;

    beforeEach(() => {
        ({ api, runtime, sandbox } = loadPanel());
    });

    it('renders empty hub and peels classic from social-workspace.js', () => {
        expect(sandbox.window.__KIU_SOCIAL_WORKSPACE_PANEL_LOADED).toBe(true);
        const html = api.renderProjectsWorkspacePanelClassic();
        expect(html).toContain('hero');

        const workspace = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace.js'), 'utf8');
        const page = readFileSync(join(process.cwd(), 'assets/js/pages/social-page.js'), 'utf8');
        expect(workspace).not.toMatch(/function\s+renderProjectsWorkspacePanelClassic\s*\(/);
        expect(workspace).toContain('createKiuSocialWorkspacePanelApi');
        expect(page).toContain('SOCIAL_WORKSPACE_PANEL_URL');
        expect(page).toMatch(/WEEK_PLAN_MODEL_URL[\s\S]*SCHEDULE_UI_URL[\s\S]*TAB_RUNTIME_URL[\s\S]*EVENTS_URL[\s\S]*PANEL_URL[\s\S]*GRAPH_RUNTIME_URL[\s\S]*DIALOGS_URL[\s\S]*GRAPH_RENDER_URL[\s\S]*TASK_UI_URL[\s\S]*PORTFOLIO_RUNTIME_URL[\s\S]*PORTFOLIO_UI_URL[\s\S]*PROJECT_CHROME_URL[\s\S]*DIALOG_ROUTE_URL[\s\S]*MODULE_URL/);
    });

    it('keeps manager settings CTA markers in the panel module', () => {
        const panel = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace-panel.js'), 'utf8');
        expect(panel).toContain('data-action="project-settings-open"');
        expect(panel).toContain('REMOVED_PROJECT_TABS');
    });
});
