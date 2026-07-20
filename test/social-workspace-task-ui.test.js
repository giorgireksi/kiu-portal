import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import vm from 'vm';

function loadTaskUi(extraDeps = {}) {
    const runtime = {
        social: {
            projects: [{
                id: 'p1',
                title: 'Demo',
                viewerCanContribute: true,
                tasks: [{ id: 't1', title: 'Task one', status: 'todo', priority: 'medium' }]
            }]
        },
        ui: {}
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
        readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace-task-ui.js'), 'utf8'),
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
        accountById: () => null,
        avatar: () => '',
        displayName: () => 'User',
        controlId: (prefix, id) => `${prefix}-${id || 'x'}`,
        uniqueStrings: (vals) => [...new Set((Array.isArray(vals) ? vals : [vals]).map(String).filter(Boolean))],
        countNum: (v) => Number(v || 0),
        PROJECT_TASK_COLUMNS: [
            { id: 'todo', label: 'To Do', tone: 'blue', icon: 'fa-list-check' },
            { id: 'in-progress', label: 'In Progress', tone: 'orange', icon: 'fa-bolt' },
            { id: 'blocked', label: 'Blocked', tone: 'rose', icon: 'fa-ban' },
            { id: 'done', label: 'Done', tone: 'emerald', icon: 'fa-circle-check' }
        ],
        neoHead: (title) => `<div class="neo-head">${title}</div>`,
        neoHeadHtml: (title) => `<div class="neo-head">${title}</div>`,
        neoActions: () => '',
        neoField: () => '',
        neoSection: () => '',
        socialNeoFieldHtml: () => '',
        toDateTimeLocalValue: () => '',
        normalizeTaskScore1to5: (v) => Number(v) || 3,
        normalizeTaskTime: (v) => Number(v) || 0,
        normalizeTaskTimeUnit: (v) => v || 'h',
        computeTaskMatrixScore: () => 9,
        computeTaskMatrixBucket: () => 'leverage',
        formatTaskTime: () => '',
        formatProjectTaskBudgetEstimate: () => '',
        formatProjectScheduleHours: () => '',
        resolveTaskScheduleEstimate: () => ({ hours: 0, label: '' }),
        resolveDeskTaskReadiness: () => ({ ready: true, blockedBy: [] }),
        resolveActiveSocialProject: () => runtime.social.projects[0],
        buildProjectTaskInspectorFields: (task) => ({
            statusId: textish(task?.status || 'todo'),
            priority: textish(task?.priority || 'medium'),
            assignee: null,
            dueAt: '',
            isOverdue: false,
            isToday: false,
            isSoon: false
        }),
        projectTaskDependsOnIds: () => [],
        projectTaskDownstreamIds: () => [],
        taskHasPert: () => false,
        activeDialog: () => null,
        getProjectTaskGraphGroups: () => [],
        isProjectTaskGraphGroupId: () => false,
        projectTaskGraphStackedBackdropClass: () => '',
        ...extraDeps
    };

    function textish(v) {
        return String(v == null ? '' : v).trim();
    }

    const source = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace-task-ui.js'), 'utf8');
    const m = source.match(/const \{\n(?<body>.*?)\n        \} = deps;/s);
    for (const name of m.groups.body.split(',').map((s) => s.trim()).filter(Boolean)) {
        if (!(name in deps)) {
            deps[name] = name.startsWith('PROJECT_') ? [] : (name.startsWith('render') || name.startsWith('neo') ? stub : stubFn);
        }
    }

    const api = sandbox.window.createKiuSocialWorkspaceTaskUiApi(deps);
    return { api, runtime, sandbox };
}

describe('social-workspace-task-ui', () => {
    let api;
    let runtime;
    let sandbox;

    beforeEach(() => {
        ({ api, runtime, sandbox } = loadTaskUi());
    });

    it('loads factory and peels task UI from social-workspace.js', () => {
        expect(sandbox.window.__KIU_SOCIAL_WORKSPACE_TASK_UI_LOADED).toBe(true);
        expect(typeof api.renderProjectTaskFormFields).toBe('function');
        expect(typeof api.renderProjectTaskDeskCard).toBe('function');
        expect(typeof api.renderProjectTaskCreateDialog).toBe('function');
        expect(typeof api.renderDeskTaskTreeForest).toBe('function');

        const workspace = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace.js'), 'utf8');
        const page = readFileSync(join(process.cwd(), 'assets/js/pages/social-page.js'), 'utf8');
        expect(workspace).not.toMatch(/function\s+renderProjectTaskFormFields\s*\(/);
        expect(workspace).not.toMatch(/function\s+renderProjectTaskDeskCard\s*\(/);
        expect(workspace).not.toMatch(/function\s+renderProjectTaskCreateDialog\s*\(/);
        expect(workspace).toContain('createKiuSocialWorkspaceTaskUiApi');
        expect(page).toContain('SOCIAL_WORKSPACE_TASK_UI_URL');
        expect(page).toMatch(/GRAPH_RENDER_URL[\s\S]*TASK_UI_URL[\s\S]*PORTFOLIO_RUNTIME_URL[\s\S]*PORTFOLIO_UI_URL[\s\S]*PROJECT_CHROME_URL[\s\S]*DIALOG_ROUTE_URL[\s\S]*MODULE_URL/);
    });

    it('renders delete confirm for a task', () => {
        const project = runtime.social.projects[0];
        const html = api.renderProjectTaskDeleteConfirmDialog(project, project.tasks[0]);
        expect(html).toContain('Remove task');
        expect(html).toContain('Task one');
    });
});
