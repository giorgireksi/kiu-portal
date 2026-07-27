import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import vm from 'vm';

function loadDialogs(extraDeps = {}) {
    const runtime = {
        social: {
            projects: [{
                id: 'p1',
                title: 'Demo',
                viewerCanContribute: true,
                tasks: [{ id: 't1', title: 'Task one', status: 'todo', priority: 'medium' }],
                risks: []
            }]
        },
        ui: {},
        directory: []
    };
    const sandbox = {
        window: {
            KiuSocialWorkspaceRiskModel: {
                projectRiskOptionLabel: (v) => String(v || ''),
                projectRiskScaleRank: (v) => Number(v) || 0,
                projectRiskScaleOptionLabel: (v) => String(v || ''),
                formatProjectRiskScore: (v) => String(v || '0'),
                projectRiskExposureScore: () => 0,
                projectRiskExposureTiers: () => ({ high: 0, medium: 0, low: 0 }),
                projectRiskIsActiveStatus: () => true,
                sortProjectRisksForRegister: (rows) => rows || [],
                projectRiskRegisterSummary: () => ({ total: 0, open: 0 }),
                projectRiskLinkedTaskIdList: () => [],
                projectRiskLinksTask: () => false,
                buildProjectRiskCountByTaskId: () => ({}),
                renderProjectRiskScaleOptions: () => '',
                PROJECT_RISK_STATUS_OPTIONS: ['open', 'watching', 'mitigated', 'closed'],
                PROJECT_RISK_RESPONSE_OPTIONS: ['avoid', 'mitigate', 'transfer', 'accept']
            }
        },
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
        readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace-dialogs.js'), 'utf8'),
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
        resolveActiveSocialProject: (_rt, id) => (
            runtime.social.projects.find((p) => p.id === id) || runtime.social.projects[0] || null
        ),
        PROJECT_TASK_COLUMNS: [
            { id: 'todo', label: 'To Do', tone: 'blue', icon: 'fa-list-check' },
            { id: 'in-progress', label: 'In Progress', tone: 'orange', icon: 'fa-bolt' },
            { id: 'blocked', label: 'Blocked', tone: 'rose', icon: 'fa-ban' },
            { id: 'done', label: 'Done', tone: 'emerald', icon: 'fa-circle-check' }
        ],
        PROJECT_RISK_STATUS_OPTIONS: ['open', 'watching', 'mitigated', 'closed'],
        PROJECT_RISK_RESPONSE_OPTIONS: ['avoid', 'mitigate', 'transfer', 'accept'],
        __riskModel: sandbox.window.KiuSocialWorkspaceRiskModel,
        neoHeadHtml: (title) => `<div class="neo-head">${title}</div>`,
        neoActions: () => '',
        neoField: () => '',
        computeProjectSchedule: () => ({ byId: {}, projectEndHours: 0 }),
        projectTaskDependsOnIds: () => [],
        projectTaskDownstreamIds: () => [],
        resolveDeskTaskReadiness: () => ({ ready: true, blockedBy: [] }),
        resolveTaskScheduleEstimate: () => ({ hours: 0, label: '' }),
        resolveProjectTaskPriorityDisplay: () => ({ label: 'Medium', tooltip: '' }),
        formatProjectTaskBudgetEstimate: () => '',
        formatTaskTime: () => '',
        formatTaskTimeVariance: () => '',
        formatTaskCostVariance: () => '',
        formatTaskScheduleDisplay: () => '',
        formatProjectScheduleDate: () => '',
        formatProjectScheduleHours: () => '',
        normalizeTaskTime: (v) => v,
        normalizeProjectTaskStatusId: (v) => v || 'todo',
        normalizeProjectPlanHorizon: (v) => v || 'weeks',
        projectPlanHorizonLabel: (v) => String(v || 'Weeks'),
        resolveTaskPackageId: () => '',
        readProjectWeekPlan: () => [],
        sumProjectActualHours: () => 0,
        sumProjectOpenWorkHours: () => 0,
        taskDurationHours: () => 0,
        taskHasPert: () => false,
        getProjectTaskGraphGroups: () => [],
        isProjectTaskGraphGroupId: () => false,
        projectTaskGraphStackedBackdropClass: () => '',
        ...extraDeps
    };

    const source = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace-dialogs.js'), 'utf8');
    const m = source.match(/const \{\n(?<body>.*?)\n        \} = deps;/s);
    for (const name of m.groups.body.split(',').map((s) => s.trim()).filter(Boolean)) {
        if (!(name in deps)) {
            deps[name] = name.startsWith('PROJECT_') ? [] : (name.startsWith('render') || name.startsWith('neo') ? stub : stubFn);
        }
    }

    const api = sandbox.window.createKiuSocialWorkspaceDialogsApi(deps);
    return { api, runtime, sandbox };
}

describe('social-workspace-dialogs', () => {
    let api;
    let runtime;
    let sandbox;

    beforeEach(() => {
        ({ api, runtime, sandbox } = loadDialogs());
    });

    it('loads factory and peels dialogs from social-workspace.js', () => {
        expect(sandbox.window.__KIU_SOCIAL_WORKSPACE_DIALOGS_LOADED).toBe(true);
        expect(typeof api.renderProjectTaskDetailModal).toBe('function');
        expect(typeof api.renderProjectRiskDialog).toBe('function');
        expect(typeof api.renderProjectHealthDialog).toBe('function');

        const workspace = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace.js'), 'utf8');
        const page = readFileSync(join(process.cwd(), 'assets/js/pages/social-page.js'), 'utf8');
        expect(workspace).not.toMatch(/function\s+renderProjectTaskDetailModal\s*\(/);
        expect(workspace).not.toMatch(/function\s+renderProjectRiskDialog\s*\(/);
        expect(workspace).not.toMatch(/function\s+renderProjectHealthDialog\s*\(/);
        expect(workspace).toContain('createKiuSocialWorkspaceDialogsApi');
        expect(page).toContain('SOCIAL_WORKSPACE_DIALOGS_URL');
        expect(page).toMatch(/GRAPH_RUNTIME_URL[\s\S]*DIALOGS_URL[\s\S]*GRAPH_RENDER_URL[\s\S]*TASK_UI_URL[\s\S]*PORTFOLIO_RUNTIME_URL[\s\S]*PORTFOLIO_UI_URL[\s\S]*PROJECT_CHROME_URL[\s\S]*DIALOG_ROUTE_URL[\s\S]*MODULE_URL/);
    });

    it('renders task detail modal for a known task', () => {
        const project = runtime.social.projects[0];
        const html = api.renderProjectTaskDetailModal(runtime, project, 't1');
        expect(html).toContain('Task one');
    });

    it('renders risk dialog shell for active project', () => {
        const html = api.renderProjectRiskDialog(runtime, { type: 'project-risk', projectId: 'p1' });
        expect(html).toContain('lux-glass-dialog');
        expect(html).toContain('data-project-id');
    });

    it('wires PROJECT_TASK_STATUS_EDGE_COLOR for health dialog status rows', () => {
        const peel = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace-dialogs.js'), 'utf8');
        const workspace = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace.js'), 'utf8');
        const dialogsBlock = workspace.slice(workspace.indexOf('/* ── Task detail / risk / health dialogs: social-workspace-dialogs.js ── */'));
        expect(peel).toMatch(/\bPROJECT_TASK_STATUS_EDGE_COLOR\b/);
        expect(dialogsBlock).toMatch(/\bPROJECT_TASK_STATUS_EDGE_COLOR\b/);

        const colors = {
            todo: '#3b82f6',
            'in-progress': '#f59e0b',
            blocked: '#f43f5e',
            done: '#10b981'
        };
        const healthModel = {
            projectId: 'p1',
            projectName: 'Demo',
            currency: 'USD',
            statusCounts: { todo: 1, 'in-progress': 0, blocked: 0, done: 0 },
            totalTasks: 1,
            donePct: 0,
            planned: 0,
            spent: 0,
            capValue: 0,
            overCap: false,
            noBudgetLine: true,
            budgetTail: null,
            overdueCount: 0,
            dueSoonCount: 0,
            blockedCount: 0,
            scheduleStartAt: null,
            criticalIds: [],
            shortestFinish: null,
            plannedFinishLabel: '',
            lastDueAt: null,
            noEstOpen: 0,
            overEstimateCount: 0,
            remainingHours: 0,
            loggedHours: 0,
            unassignedCount: 0,
            readyN: 0,
            waitingN: 0,
            riskSummary: '',
            topRisks: [],
            linkCount: 0,
            hasCycle: false,
            bottleneckTitle: '',
            bottleneckCount: 0,
            groupCount: 0,
            loadList: [],
            maxLoad: 0,
            issues: [],
            healthLevel: 'ok',
            healthLabel: 'Healthy',
            topIssue: '',
            dataReadiness: 'ok',
            dataChecks: [],
            whyBits: [],
            weekActionsTop: [],
            fixSamples: [],
            taskTitles: { t1: 'Task one' },
            canContribute: true,
            riskCount: 0
        };
        const loaded = loadDialogs({ PROJECT_TASK_STATUS_EDGE_COLOR: colors });
        loaded.sandbox.window.buildProjectHealthModel = () => healthModel;
        const html = loaded.api.renderProjectHealthDialog(loaded.runtime, { type: 'project-health', projectId: 'p1' });
        expect(html).toContain(`background:${colors.todo}`);
    });
});
