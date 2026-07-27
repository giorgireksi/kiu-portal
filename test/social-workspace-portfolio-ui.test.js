import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import vm from 'vm';

function loadPortfolioUi(extraDeps = {}) {
    const runtime = {
        social: { projects: [], portfolios: [] },
        ui: { portfolioPanelTab: 'discover' },
        directory: []
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
        readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace-portfolio-ui.js'), 'utf8'),
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
        when: (v) => String(v || ''),
        state: () => runtime,
        uniqueStrings: (vals) => [...new Set((Array.isArray(vals) ? vals : [vals]).map(String).filter(Boolean))],
        currentFacultyCode: () => 'ECON',
        currentUserId: () => 'u1',
        currentUser: () => ({ id: 'u1' }),
        displayName: () => 'User',
        avatar: () => '',
        facultyLabel: (v) => String(v || ''),
        roleLabel: (v) => String(v || ''),
        fileUrl: (v) => String(v || ''),
        isImage: () => false,
        getSafeSocialExternalUrl: (v) => String(v || ''),
        neoHead: (title) => `<div class="neo-head">${title}</div>`,
        neoField: () => '',
        neoActions: () => '',
        ensureMyPortfolioDocument: () => ({ id: 'mine', visibilityMode: 'staff_only' }),
        portfolioAudienceLabel: () => 'Staff',
        portfolioDraftExists: () => false,
        portfolioEntriesForViewer: () => [],
        portfolioMatchesRoleFilter: () => true,
        PORTFOLIO_DISCOVER_ROLE_TARGETS: [
            ['all', 'All audiences'],
            ['students_only', 'Students'],
        ],
        ...extraDeps
    };

    const source = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace-portfolio-ui.js'), 'utf8');
    const m = source.match(/const \{\n(?<body>.*?)\n        \} = deps;/s);
    for (const name of m.groups.body.split(',').map((s) => s.trim()).filter(Boolean)) {
        if (!(name in deps)) {
            deps[name] = name.startsWith('render') || name.startsWith('neo') ? stub : stubFn;
        }
    }

    const api = sandbox.window.createKiuSocialWorkspacePortfolioUiApi(deps);
    return { api, runtime, sandbox };
}

describe('social-workspace-portfolio-ui', () => {
    let api;
    let sandbox;

    beforeEach(() => {
        ({ api, sandbox } = loadPortfolioUi());
    });

    it('loads factory and peels portfolio UI from social-workspace.js', () => {
        expect(sandbox.window.__KIU_SOCIAL_WORKSPACE_PORTFOLIO_UI_LOADED).toBe(true);
        expect(typeof api.renderPortfolioHero).toBe('function');
        expect(typeof api.renderPortfolioCreateDialog).toBe('function');
        expect(typeof api.renderProjectsPanel).toBe('function');
        expect(typeof api.renderMyPortfolioPanel).toBe('function');

        const workspace = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace.js'), 'utf8');
        const page = readFileSync(join(process.cwd(), 'assets/js/pages/social-page.js'), 'utf8');
        expect(workspace).not.toMatch(/function\s+renderPortfolioHero\s*\(/);
        expect(workspace).not.toMatch(/function\s+renderProjectsPanel\s*\(/);
        expect(workspace).toContain('createKiuSocialWorkspacePortfolioUiApi');
        expect(page).toContain('SOCIAL_WORKSPACE_PORTFOLIO_UI_URL');
        expect(workspace).toMatch(/PORTFOLIO_DISCOVER_ROLE_TARGETS,\n        roleLabel/);
        expect(page).toMatch(/TASK_UI_URL[\s\S]*PORTFOLIO_RUNTIME_URL[\s\S]*PORTFOLIO_UI_URL[\s\S]*PROJECT_CHROME_URL[\s\S]*DIALOG_ROUTE_URL[\s\S]*MODULE_URL/);
    });

    it('renders discover role filter options from deps', () => {
        const html = api.renderPortfolioHero({ ui: {} }, {
            portfolioPanelTab: 'discover',
            facultyOptions: ['all', 'ECON'],
        });
        expect(html).toContain('All audiences');
        expect(html).toContain('name="projectDiscoverRole"');
    });

    it('renders portfolio create dialog shell', () => {
        const html = api.renderPortfolioCreateDialog({ ui: {} });
        expect(html).toContain('lux-glass-dialog');
    });
});
