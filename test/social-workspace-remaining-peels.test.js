import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import vm from 'vm';

function load(path, createName, flag) {
    const sandbox = {
        window: {},
        String, Boolean, Number, Array, Object, Promise, Set, Map, Math, Date, JSON, console,
        encodeURIComponent, isNaN, parseInt, parseFloat, isFinite: Number.isFinite,
        requestAnimationFrame: (fn) => setTimeout(fn, 0),
        setTimeout, clearTimeout
    };
    sandbox.window.window = sandbox.window;
    vm.runInNewContext(readFileSync(join(process.cwd(), path), 'utf8'), sandbox);
    const stub = () => '';
    const stubFn = () => {};
    const source = readFileSync(join(process.cwd(), path), 'utf8');
    const m = source.match(/const \{\n(?<body>.*?)\n        \} = deps;/s);
    const deps = {
        text: (v) => String(v == null ? '' : v).trim(),
        escape: (v) => String(v == null ? '' : v),
        when: (v) => String(v || ''),
        state: () => ({ social: { projects: [], portfolios: [] }, ui: {} }),
        root: () => null,
        currentUserId: () => 'u1',
        currentUser: () => ({ id: 'u1' }),
        currentFacultyCode: () => 'ECON',
        renderSocialPageNow: stubFn,
        computeProjectSchedule: () => ({ projectEndHours: 0 }),
        sumProjectActualHours: () => 0,
        sumProjectOpenWorkHours: () => 0,
        formatProjectScheduleHours: () => '',
        formatProjectScheduleDate: () => '',
        normalizeTaskTime: (v) => Number(v) || 0,
        normalizeTaskTimeUnit: (v) => v || 'h',
        formatTaskTime: () => '',
        computePertExpected: () => 0,
        computeTaskMatrixScore: () => 9,
        computeTaskMatrixBucket: () => 'leverage',
        buildSocialRenderSignature: () => '',
        ensureSocialCenterScrollBounds: stubFn,
        getSocialCenterMaxScroll: () => 0,
        getSocialCenterScroller: () => null,
        scrollSocialCenterTo: stubFn,
        enhanceUniversalPickers: stubFn,
        renderProjectWorkspaceTabPanel: stubFn,
        normalizePortfolioEntry: (e) => e,
        canViewerAccessPortfolioEntry: () => true,
        clonePortfolioDocument: (d) => ({ ...d }),
        portfolioMakeId: (p) => `${p}-1`,
        portfolioFieldValue: () => '',
        serializePortfolioLinks: () => '',
        portfolioEditorFormRoot: () => null,
        patchPortfolioSaveStatus: stubFn,
        setPortalSocialFlash: stubFn
    };
    for (const name of m.groups.body.split(',').map((s) => s.trim()).filter(Boolean)) {
        if (!(name in deps)) deps[name] = name.startsWith('render') ? stub : stubFn;
    }
    const api = sandbox.window[createName](deps);
    return { api, sandbox, flag };
}

describe('social-workspace remaining peels', () => {
    it('tab-runtime peels from workspace', () => {
        const { api, sandbox } = load(
            'assets/js/pages/social-workspace-tab-runtime.js',
            'createKiuSocialWorkspaceTabRuntimeApi',
            '__KIU_SOCIAL_WORKSPACE_TAB_RUNTIME_LOADED'
        );
        expect(sandbox.window.__KIU_SOCIAL_WORKSPACE_TAB_RUNTIME_LOADED).toBe(true);
        expect(typeof api.refreshProjectTasksTabPane).toBe('function');
        const ws = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace.js'), 'utf8');
        const page = readFileSync(join(process.cwd(), 'assets/js/pages/social-page.js'), 'utf8');
        expect(ws).not.toMatch(/function\s+refreshProjectTasksTabPane\s*\(/);
        expect(ws).toContain('createKiuSocialWorkspaceTabRuntimeApi');
        expect(page).toContain('SOCIAL_WORKSPACE_TAB_RUNTIME_URL');
        expect(page).toMatch(/SCHEDULE_UI_URL[\s\S]*TAB_RUNTIME_URL[\s\S]*EVENTS_URL/);
    });

    it('portfolio-runtime peels from workspace', () => {
        const { api, sandbox } = load(
            'assets/js/pages/social-workspace-portfolio-runtime.js',
            'createKiuSocialWorkspacePortfolioRuntimeApi',
            '__KIU_SOCIAL_WORKSPACE_PORTFOLIO_RUNTIME_LOADED'
        );
        expect(sandbox.window.__KIU_SOCIAL_WORKSPACE_PORTFOLIO_RUNTIME_LOADED).toBe(true);
        expect(typeof api.ensureMyPortfolioDocument).toBe('function');
        expect(Array.isArray(api.PORTFOLIO_DISCOVER_ROLE_TARGETS)).toBe(true);
        const ws = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace.js'), 'utf8');
        const page = readFileSync(join(process.cwd(), 'assets/js/pages/social-page.js'), 'utf8');
        expect(ws).not.toMatch(/function\s+ensureMyPortfolioDocument\s*\(/);
        expect(ws).toContain('createKiuSocialWorkspacePortfolioRuntimeApi');
        expect(page).toContain('SOCIAL_WORKSPACE_PORTFOLIO_RUNTIME_URL');
        expect(page).toMatch(/TASK_UI_URL[\s\S]*PORTFOLIO_RUNTIME_URL[\s\S]*PORTFOLIO_UI_URL/);
    });

    it('schedule-ui peels from workspace', () => {
        const { api, sandbox } = load(
            'assets/js/pages/social-workspace-schedule-ui.js',
            'createKiuSocialWorkspaceScheduleUiApi',
            '__KIU_SOCIAL_WORKSPACE_SCHEDULE_UI_LOADED'
        );
        expect(sandbox.window.__KIU_SOCIAL_WORKSPACE_SCHEDULE_UI_LOADED).toBe(true);
        expect(typeof api.renderProjectPlanVsBaselineStrip).toBe('function');
        const ws = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace.js'), 'utf8');
        const page = readFileSync(join(process.cwd(), 'assets/js/pages/social-page.js'), 'utf8');
        expect(ws).not.toMatch(/function\s+renderProjectPlanVsBaselineStrip\s*\(/);
        expect(ws).toContain('createKiuSocialWorkspaceScheduleUiApi');
        expect(page).toContain('SOCIAL_WORKSPACE_SCHEDULE_UI_URL');
        expect(api.renderProjectPlanVsBaselineStrip(null)).toBe('');
    });
});
