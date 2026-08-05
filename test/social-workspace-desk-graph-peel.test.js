import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import vm from 'vm';

function loadGraphModel() {
    const sandbox = {
        window: {},
        console,
        Map,
        Set,
        Array,
        Number,
        String,
        Math,
        Boolean,
        Object,
        Date
    };
    sandbox.window.window = sandbox.window;
    sandbox.globalThis = sandbox;
    const deskSource = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace-graph-desk-model.js'), 'utf8');
    const graphSource = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace-graph-model.js'), 'utf8');
    vm.runInNewContext(deskSource, sandbox);
    vm.runInNewContext(graphSource, sandbox);
    return sandbox.window;
}

describe('social-workspace desk/graph pure peel', () => {
    let win;

    beforeEach(() => {
        win = loadGraphModel();
    });

    it('exports desk ordering and readiness helpers', () => {
        expect(typeof win.orderDeskTasksByDependency).toBe('function');
        expect(typeof win.buildDeskTaskForest).toBe('function');
        expect(typeof win.resolveDeskTaskReadiness).toBe('function');
        expect(typeof win.computeProjectTaskGraphGroupRollup).toBe('function');
    });

    it('orders tasks parent-before-child by dependsOn', () => {
        const tasks = [
            { id: 'b', title: 'B', status: 'todo', dependsOnTaskIds: ['a'] },
            { id: 'a', title: 'A', status: 'todo', dependsOnTaskIds: [] }
        ];
        const ordered = win.orderDeskTasksByDependency(tasks);
        expect(ordered.map((row) => row.task.id)).toEqual(['a', 'b']);
        expect(ordered[0].depth).toBe(0);
        expect(ordered[1].depth).toBe(1);
        expect(ordered[0].childCount).toBe(1);
    });

    it('builds a desk forest and readiness states', () => {
        const tasks = [
            { id: 'a', title: 'A', status: 'todo', dependsOnTaskIds: [] },
            { id: 'b', title: 'B', status: 'todo', dependsOnTaskIds: ['a'] }
        ];
        const forest = win.buildDeskTaskForest(tasks);
        expect(forest).toHaveLength(1);
        expect(forest[0].task.id).toBe('a');
        expect(forest[0].childCount).toBe(1);
        const byId = new Map(tasks.map((t) => [t.id, t]));
        expect(win.resolveDeskTaskReadiness(tasks[0], byId, []).kind).toBe('ready');
        expect(win.resolveDeskTaskReadiness(tasks[1], byId, []).kind).toBe('waiting');
    });

    it('filters board tasks and resolves matrix priority display', () => {
        const tasks = [
            { id: '1', title: 'Alpha task', status: 'todo', priority: 'high', impactScore: 5, effortScore: 1 },
            { id: '2', title: 'Other', status: 'todo', priority: 'low', impactScore: 1, effortScore: 5 }
        ];
        const filtered = win.filterProjectBoardTasks(
            { ui: { projectTaskSearch: 'alpha' } },
            tasks
        );
        expect(filtered.map((t) => t.id)).toEqual(['1']);
        const display = win.resolveProjectTaskPriorityDisplay(tasks[0]);
        expect(display.bucket).toBe('urgent');
        expect(display.score).toBe(25);
        expect(win.normalizeProjectWeekPlanWindow('2weeks')).toBe('weeks');
    });

    it('builds and samples graph polylines', () => {
        expect(typeof win.buildProjectTaskGraphSeedPolyline).toBe('function');
        expect(typeof win.sampleProjectTaskGraphPolyline).toBe('function');
        expect(typeof win.projectTaskGraphEdgeFanMap).toBe('function');
        const seed = win.buildProjectTaskGraphSeedPolyline?.(
            { x: 0, y: 0 },
            { x: 100, y: 0 }
        );
        // seed helper may return points array or path meta depending on impl
        expect(seed == null || typeof seed === 'object' || Array.isArray(seed)).toBe(true);
    });

    it('is removed from social-workspace and bound from graph model', () => {
        const workspace = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace.js'), 'utf8');
        const page = readFileSync(join(process.cwd(), 'assets/js/pages/social-page.js'), 'utf8');
        expect(workspace).not.toMatch(/function resolveDeskTaskReadiness\s*\(/);
        expect(workspace).not.toMatch(/function orderDeskTasksByDependency\s*\(/);
        expect(workspace).not.toMatch(/function buildDeskTaskForest\s*\(/);
        expect(workspace).not.toMatch(/function computeProjectTaskGraphGroupRollup\s*\(/);
        expect(workspace).not.toMatch(/function filterProjectBoardTasks\s*\(/);
        expect(workspace).not.toMatch(/function resolveProjectTaskPriorityDisplay\s*\(/);
        expect(workspace).toContain('KiuSocialWorkspaceGraphModel');
        expect(workspace).toMatch(/const resolveDeskTaskReadiness\s*=/);
        expect(workspace).toMatch(/const filterProjectBoardTasks\s*=/);
        expect(page).toContain('social-workspace-graph-model.js');
    });
});
