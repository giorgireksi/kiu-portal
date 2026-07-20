import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import vm from 'vm';

function loadHealthModel() {
    const sandbox = {
        window: {
            __kiuSocialWorkspaceHooks: {
                text: (value) => String(value == null ? '' : value).trim(),
                countNum: (value) => {
                    const n = Number(value);
                    return Number.isFinite(n) ? n : 0;
                },
                normalizeTaskTime: (value) => {
                    const n = Number(value);
                    return Number.isFinite(n) && n > 0 ? Math.round(n * 10) / 10 : 0;
                }
            },
            taskDurationHours: (task) => {
                if (task?.isMilestone) return 0;
                return Number(task?.timeEstimate) || 0;
            },
            sumProjectOpenWorkHours: (project) => (project.tasks || [])
                .filter((t) => t.status !== 'done' && !t.isMilestone)
                .reduce((s, t) => s + (Number(t.timeEstimate) || 0), 0),
            sumProjectActualHours: () => 0,
            formatProjectScheduleHours: (h) => `${h}h`,
            formatProjectScheduleDate: () => '',
            projectRiskRegisterSummary: (risks) => ({
                open: (risks || []).length,
                high: (risks || []).filter((r) => Number(r.likelihood) * Number(r.impact) >= 15).length,
                unassigned: 0
            }),
            sortProjectRisksForRegister: (risks) => [...(risks || [])],
            projectRiskIsActiveStatus: () => true,
            projectTaskDependsOnIds: (task) => Array.isArray(task?.dependsOnTaskIds) ? task.dependsOnTaskIds : [],
            projectTaskDownstreamIds: () => [],
            isProjectTaskGraphGroupId: () => false,
            resolveDeskTaskReadiness: (task) => (
                task?.assigneeUserId ? { kind: 'ready' } : { kind: 'waiting' }
            )
        }
    };
    sandbox.window.window = sandbox.window;
    const source = readFileSync(
        join(process.cwd(), 'assets/js/pages/social-workspace-health-model.js'),
        'utf8'
    );
    vm.runInNewContext(source, sandbox);
    return sandbox.window;
}

describe('social-workspace-health-model', () => {
    let win;

    beforeEach(() => {
        win = loadHealthModel();
    });

    it('exports buildProjectHealthModel', () => {
        expect(win.__KIU_SOCIAL_WORKSPACE_HEALTH_MODEL_LOADED).toBe(true);
        expect(typeof win.buildProjectHealthModel).toBe('function');
        expect(win.KiuSocialWorkspaceHealthModel.buildProjectHealthModel).toBe(win.buildProjectHealthModel);
    });

    it('scores a clean project as good / on track', () => {
        const model = win.buildProjectHealthModel({
            id: 'p1',
            title: 'Capstone',
            budgetCap: 1000,
            tasks: [
                { id: 't1', title: 'A', status: 'done', timeEstimate: 2, budgetEstimate: 100, assigneeUserId: 'u1', dueAt: '2099-01-01' },
                { id: 't2', title: 'B', status: 'todo', timeEstimate: 4, budgetEstimate: 200, assigneeUserId: 'u1', dueAt: '2099-02-01' }
            ],
            risks: []
        }, {
            groups: [],
            schedule: { criticalChain: ['t2'], projectEndHours: 4 }
        });
        expect(model.healthLevel).toBe('good');
        expect(model.healthLabel).toBe('On track');
        expect(model.donePct).toBe(50);
        expect(model.totalTasks).toBe(2);
        expect(model.overCap).toBe(false);
    });

    it('marks critical when over budget cap', () => {
        const model = win.buildProjectHealthModel({
            id: 'p1',
            title: 'Over',
            budgetCap: 50,
            tasks: [
                { id: 't1', title: 'A', status: 'todo', timeEstimate: 2, budgetEstimate: 80, assigneeUserId: 'u1' }
            ],
            risks: []
        }, {
            groups: [],
            schedule: { criticalChain: [], projectEndHours: 2 }
        });
        expect(model.overCap).toBe(true);
        expect(model.healthLevel).toBe('critical');
        expect(model.healthLabel).toBe('At risk');
        expect(model.budgetTail.kind).toBe('over');
    });

    it('is wired into social lazy load chain', () => {
        const page = readFileSync(join(process.cwd(), 'assets/js/pages/social-page.js'), 'utf8');
        const workspace = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace.js'), 'utf8');
        expect(page).toContain('social-workspace-health-model.js');
        expect(page).toContain('SOCIAL_WORKSPACE_HEALTH_MODEL_URL');
        expect(workspace).toContain('buildProjectHealthModel');
        expect(workspace).toContain('KiuSocialWorkspaceHealthModel');
    });

    it('exports buildProjectHealthPlanPickModel and filters packages', () => {
        expect(typeof win.buildProjectHealthPlanPickModel).toBe('function');
        expect(win.KiuSocialWorkspaceHealthModel.buildProjectHealthPlanPickModel).toBe(win.buildProjectHealthPlanPickModel);

        const groups = [{ id: 'pkg1', name: 'Alpha', memberTaskIds: ['t1'] }];
        const runtime = {
            ui: {
                activeProjectId: 'p1',
                projectHealthPlanWindow: 'weeks',
                projectHealthPlanPickSelectedIds: ['t1'],
                projectHealthPlanPickSearch: '',
                projectHealthPlanPickStatus: 'open',
                projectHealthPlanPickHidePlanned: true,
                projectHealthPlanPickBrowseId: 'all'
            }
        };
        const project = {
            id: 'p1',
            tasks: [
                { id: 't1', title: 'Open A', status: 'todo', dueAt: '2099-01-01' },
                { id: 't2', title: 'Done B', status: 'done', dueAt: '2099-01-02' },
                { id: 't3', title: 'Open C', status: 'todo', dueAt: '2099-01-03' }
            ]
        };
        const model = win.buildProjectHealthPlanPickModel(runtime, { projectId: 'p1', horizon: 'weeks' }, {
            resolveActiveSocialProject: () => project,
            getProjectTaskGraphGroups: () => groups,
            readProjectWeekPlan: () => ['t3'],
            resolveTaskPackageId: (taskId, pkgs) => {
                for (const g of pkgs) {
                    if ((g.memberTaskIds || []).includes(taskId)) return g.id;
                }
                return '';
            },
            normalizeProjectPlanHorizon: (v) => String(v || 'weeks'),
            projectPlanHorizonLabel: (h) => (h === 'weeks' ? 'Weeks' : h),
            normalizeProjectTaskStatusId: (s) => String(s || 'todo').toLowerCase()
        });
        expect(model).toBeTruthy();
        expect(model.eligible.map((t) => t.id)).toEqual(['t1']);
        expect(model.selectedCount).toBe(1);
        expect(model.packageRail.some((p) => p.id === 'pkg1' && p.count === 1)).toBe(true);
        expect(model.packageRail.find((p) => p.id === '__ungrouped__').count).toBe(0);
    });

    it('keeps plan-pick model body out of social-workspace.js', () => {
        const workspace = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace.js'), 'utf8');
        expect(workspace).toMatch(/function\s+buildProjectHealthPlanPickModel\s*\(/);
        expect(workspace).toContain('KiuSocialWorkspaceHealthModel');
        expect(workspace).not.toMatch(/projectHealthPlanPickHidePlanned !== false/);
        expect(workspace).not.toMatch(/Package counts from eligible set/);
    });
});
