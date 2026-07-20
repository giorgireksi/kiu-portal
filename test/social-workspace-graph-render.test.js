import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import vm from 'vm';

function loadGraphRender(extraDeps = {}) {
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
        readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace-graph-render.js'), 'utf8'),
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
        state: () => ({ social: { projects: [] }, ui: {} }),
        ...extraDeps
    };

    const source = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace-graph-render.js'), 'utf8');
    const m = source.match(/const \{\n(?<body>.*?)\n        \} = deps;/s);
    for (const name of m.groups.body.split(',').map((s) => s.trim()).filter(Boolean)) {
        if (!(name in deps)) {
            if (name.startsWith('PROJECT_')) deps[name] = name.includes('ZOOM') || name.includes('PAD') || name.includes('MAX') || name.includes('W') || name.includes('H') || name.includes('CARD') || name.includes('NODE') || name.includes('CHECKPOINT') ? 40 : [];
            else if (name.startsWith('render') || name.startsWith('neo') || name.startsWith('format') || name.startsWith('build')) deps[name] = stub;
            else deps[name] = stubFn;
        }
    }

    const api = sandbox.window.createKiuSocialWorkspaceGraphRenderApi(deps);
    return { api, sandbox };
}

describe('social-workspace-graph-render', () => {
    let api;
    let sandbox;

    beforeEach(() => {
        ({ api, sandbox } = loadGraphRender());
    });

    it('loads factory and peels render stack from social-workspace.js', () => {
        expect(sandbox.window.__KIU_SOCIAL_WORKSPACE_GRAPH_RENDER_LOADED).toBe(true);
        expect(typeof api.renderProjectTaskGraphFullscreen).toBe('function');
        expect(typeof api.renderProjectTaskGraphSvg).toBe('function');
        expect(typeof api.renderProjectTaskGraphGroupNode).toBe('function');
        expect(typeof api.renderTaskDependencyGraphPreview).toBe('function');

        const workspace = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace.js'), 'utf8');
        const page = readFileSync(join(process.cwd(), 'assets/js/pages/social-page.js'), 'utf8');
        expect(workspace).not.toMatch(/function\s+renderProjectTaskGraphFullscreen\s*\(/);
        expect(workspace).not.toMatch(/function\s+renderProjectTaskGraphSvg\s*\(/);
        expect(workspace).not.toMatch(/function\s+renderProjectTaskGraphGroupNode\s*\(/);
        expect(workspace).toContain('createKiuSocialWorkspaceGraphRenderApi');
        expect(page).toContain('SOCIAL_WORKSPACE_GRAPH_RENDER_URL');
        expect(page).toMatch(/DIALOGS_URL[\s\S]*GRAPH_RENDER_URL[\s\S]*TASK_UI_URL[\s\S]*PORTFOLIO_RUNTIME_URL[\s\S]*PORTFOLIO_UI_URL[\s\S]*PROJECT_CHROME_URL[\s\S]*DIALOG_ROUTE_URL[\s\S]*MODULE_URL/);
    });

    it('renders legend markup', () => {
        const html = api.renderProjectTaskGraphLegend();
        expect(html).toContain('social-project-task-graph');
    });
});
