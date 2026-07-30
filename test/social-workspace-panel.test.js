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

    it('initializes graph-runtime before dialogs to avoid TDZ on stacked backdrop', () => {
        const workspace = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace.js'), 'utf8');
        const graphRt = workspace.indexOf('/* ── Task graph runtime: social-workspace-graph-runtime.js');
        const dialogs = workspace.indexOf('/* ── Task detail / risk / health dialogs: social-workspace-dialogs.js');
        const graphRender = workspace.indexOf('/* ── Task graph render stack: social-workspace-graph-render.js');
        expect(graphRt).toBeGreaterThan(-1);
        expect(dialogs).toBeGreaterThan(graphRt);
        expect(graphRender).toBeGreaterThan(dialogs);
        expect(workspace).toMatch(/projectTaskGraphStackedBackdropClass,\n        readProjectWeekPlan/);
    });

    it('panel factory defers renderTaskDependencyGraphPreview lookup until render time', () => {
        const workspace = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace.js'), 'utf8');
        expect(workspace).toMatch(/renderTaskDependencyGraphPreview:\s*\(\.\.\.args\)\s*=>\s*\{/);
        expect(workspace).toMatch(/window\.renderTaskDependencyGraphPreview\s*=\s*renderTaskDependencyGraphPreview/);
    });

    it('graph runtime factory lazy-resolves dialog-route stack helpers', () => {
        const workspace = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace.js'), 'utf8');
        expect(workspace).not.toContain('renderStackedProjectTaskChild: window.renderStackedProjectTaskChild');
        expect(workspace).not.toContain('shouldRenderProjectHealthStack: window.shouldRenderProjectHealthStack');
        expect(workspace).toMatch(/renderStackedProjectTaskChild:\s*\(\.\.\.args\)\s*=>\s*\{/);
        expect(workspace).toMatch(/shouldRenderProjectHealthStack:\s*\(\.\.\.args\)\s*=>\s*\{/);
    });

    it('binds graph-model exports before re-exporting to KiuSocialWorkspace', () => {
        const workspace = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace.js'), 'utf8');
        expect(workspace).toMatch(/const clampProjectTaskGraphCardHeight = window\.clampProjectTaskGraphCardHeight \|\| __swGraphBatch\.clampProjectTaskGraphCardHeight/);
        expect(workspace).toMatch(/__kiuSwApi\.clampProjectTaskGraphCardHeight = clampProjectTaskGraphCardHeight/);
    });

    it('uses activeProject budget utilization for budget tab pill note', () => {
        const panel = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace-panel.js'), 'utf8');
        expect(panel).toMatch(/budgetUtilizationPercent/);
        expect(panel).not.toMatch(/\$\{budgetUtilization\}% used/);
    });

    it('keeps manager settings CTA markers in the panel module', () => {
        const panel = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace-panel.js'), 'utf8');
        expect(panel).toContain('data-action="project-settings-open"');
        expect(panel).toContain('REMOVED_PROJECT_TABS');
    });

    it('keeps student service project visibility in the workspace filter', () => {
        const panel = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace-panel.js'), 'utf8');
        const workspace = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace.js'), 'utf8');
        expect(panel).toContain('function canViewProjectWorkspaceCard(project)');
        expect(panel).toContain('Boolean(isStaffAccount?.(currentUser?.()))');
        expect(panel).not.toContain("['admin', 'professor', 'ta', 'student_service'].includes(viewerRole)");
        expect(panel).toContain('const myProjects = projects.filter(canViewProjectWorkspaceCard);');
        expect(panel).toContain('hubProjects = hubProjects.filter(canViewProjectWorkspaceCard);');
        expect(panel).toContain('const featuredProjects = [...myProjects]');
        expect(panel).toContain('const hubScopeBase = hubProjects;');
        expect(panel).toMatch(/hubStatusCounts\s*=\s*\{[\s\S]*?all:\s*hubScopeBase\.length/);
        expect(panel).not.toContain("if (discoverFaculty && discoverFaculty !== 'all' && hubScope !== 'faculty')");
        expect(workspace).toMatch(/createKiuSocialWorkspacePanelApi\)\(\{[\s\S]*?currentUser,/);
        expect(workspace).toMatch(/createKiuSocialWorkspacePanelApi\)\(\{[\s\S]*?currentUserId,/);
    });
});
