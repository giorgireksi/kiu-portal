import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import vm from 'vm';

function loadGraphModel() {
    const sandbox = {
        window: {
            __kiuSocialWorkspaceHooks: {
                text: (value) => String(value == null ? '' : value).trim()
            },
            innerWidth: 1200,
            innerHeight: 800
        }
    };
    sandbox.window.window = sandbox.window;
    const source = readFileSync(
        join(process.cwd(), 'assets/js/pages/social-workspace-graph-model.js'),
        'utf8'
    );
    vm.runInNewContext(source, sandbox);
    return sandbox.window;
}

describe('social-workspace-graph-model', () => {
    let win;

    beforeEach(() => {
        win = loadGraphModel();
    });

    it('loads pure layout helpers', () => {
        expect(win.__KIU_SOCIAL_WORKSPACE_GRAPH_MODEL_LOADED).toBe(true);
        expect(win.KiuSocialWorkspaceGraphModel).toBeTruthy();
        expect(typeof win.buildProjectTaskGraphModel).toBe('function');
        expect(typeof win.layoutProjectTaskGraphForce).toBe('function');
        expect(typeof win.projectTaskGraphCubicEdgePath).toBe('function');
        expect(win.PROJECT_TASK_GRAPH_CARD_W).toBe(256);
    });

    it('builds model edges from dependsOnTaskIds', () => {
        const model = win.buildProjectTaskGraphModel([
            { id: 'a', title: 'A', status: 'todo' },
            { id: 'b', title: 'B', status: 'todo', dependsOnTaskIds: ['a'] }
        ], { showInferred: false, showFlow: false });
        expect(model.nodes).toHaveLength(2);
        expect(model.explicitEdges).toEqual([{ from: 'a', to: 'b', kind: 'explicit' }]);
        expect(model.edges).toHaveLength(1);
    });

    it('layouts by status into columns', () => {
        const model = win.buildProjectTaskGraphModel([
            { id: 'a', title: 'A', status: 'todo', priority: 'high' },
            { id: 'b', title: 'B', status: 'done', priority: 'low' }
        ]);
        const layout = win.layoutProjectTaskGraphByStatus(model, { compact: true });
        expect(layout.layoutKind).toBe('status');
        expect(layout.positions.a).toBeTruthy();
        expect(layout.positions.b).toBeTruthy();
        expect(layout.positions.a.x).not.toBe(layout.positions.b.x);
    });

    it('clamps zoom and builds cubic edge paths', () => {
        expect(win.clampProjectTaskGraphZoom(0)).toBe(win.PROJECT_TASK_GRAPH_MIN_ZOOM);
        expect(win.clampProjectTaskGraphZoom(99)).toBe(win.PROJECT_TASK_GRAPH_MAX_ZOOM);
        const path = win.projectTaskGraphCubicEdgePath(
            { x: 0, y: 0, nx: 1, ny: 0 },
            { x: 100, y: 0, nx: -1, ny: 0 }
        );
        expect(path.d).toMatch(/^M /);
        expect(path.d).toContain(' C ');
    });

    it('is wired into social lazy load chain', () => {
        const page = readFileSync(join(process.cwd(), 'assets/js/pages/social-page.js'), 'utf8');
        const workspace = readFileSync(join(process.cwd(), 'assets/js/pages/social-workspace.js'), 'utf8');
        expect(page).toContain('social-workspace-graph-model.js');
        expect(page).toContain('SOCIAL_WORKSPACE_GRAPH_MODEL_URL');
        expect(workspace).toContain('KiuSocialWorkspaceGraphModel');
        expect(workspace).not.toMatch(/function buildProjectTaskGraphModel\s*\(/);
        expect(workspace).not.toMatch(/function layoutProjectTaskGraphForce\s*\(/);
    });

    describe('task-graph edge/dock geometry', () => {
        const GEOMETRY_NAMES = [
            'projectTaskGraphBoxAnchor',
            'getProjectTaskGraphDocks',
            'projectTaskGraphDockAlongSide',
            'selectProjectTaskGraphDockPair',
            'projectTaskGraphPushOutOfRect',
            'normalizeProjectTaskGraphStatusId',
            'projectTaskGraphStatusEdgeColor',
            'projectTaskGraphEdgePath',
            'projectTaskGraphEdgeAnchors',
            'projectTaskGraphObstacleList',
            'formatProjectTaskGraphNodeLabel',
            'projectTaskGraphPortRole',
            'resolveProjectTaskGraphWireEndpoints'
        ];

        it('exports geometry helpers on window and KiuSocialWorkspaceGraphModel', () => {
            for (const name of GEOMETRY_NAMES) {
                expect(typeof win[name]).toBe('function');
                expect(win.KiuSocialWorkspaceGraphModel[name]).toBe(win[name]);
            }
            expect(win.PROJECT_TASK_STATUS_EDGE_COLOR.todo).toMatch(/^#/);
        });

        it('returns four cardinal docks with correct normals', () => {
            const docks = win.getProjectTaskGraphDocks({ x: 100, y: 50, w: 200, h: 100 });
            expect(docks.e).toEqual({ side: 'e', x: 200, y: 50, nx: 1, ny: 0 });
            expect(docks.w).toEqual({ side: 'w', x: 0, y: 50, nx: -1, ny: 0 });
            expect(docks.n).toEqual({ side: 'n', x: 100, y: 0, nx: 0, ny: -1 });
            expect(docks.s).toEqual({ side: 's', x: 100, y: 100, nx: 0, ny: 1 });
        });

        it('selects e -> w for a left-to-right pair', () => {
            const pair = win.selectProjectTaskGraphDockPair(
                { x: 0, y: 0, w: 100, h: 80 },
                { x: 300, y: 0, w: 100, h: 80 }
            );
            expect(pair.sideFrom).toBe('e');
            expect(pair.sideTo).toBe('w');
            expect(pair.fromDock.side).toBe('e');
            expect(pair.toDock.side).toBe('w');
        });

        it('builds edge path with cubic d and sideFrom/sideTo', () => {
            const path = win.projectTaskGraphEdgePath(
                { x: 0, y: 0, w: 100, h: 80 },
                { x: 300, y: 0, w: 100, h: 80 }
            );
            expect(path.d).toMatch(/^M /);
            expect(path.d).toContain(' C ');
            expect(path.sideFrom).toBe('e');
            expect(path.sideTo).toBe('w');
            expect(path.mode).toBe('cubic-e-w');
            expect(win.projectTaskGraphEdgeAnchors(
                { x: 0, y: 0, w: 100, h: 80 },
                { x: 300, y: 0, w: 100, h: 80 }
            ).d).toBe(path.d);
        });

        it('normalizes status ids and returns edge colors', () => {
            expect(win.normalizeProjectTaskGraphStatusId('backlog')).toBe('todo');
            expect(win.normalizeProjectTaskGraphStatusId('unknown-xyz')).toBe('todo');
            expect(win.normalizeProjectTaskGraphStatusId('done')).toBe('done');
            expect(win.projectTaskGraphStatusEdgeColor('done')).toBe('#10b981');
            expect(win.projectTaskGraphStatusEdgeColor('todo')).toMatch(/^#/);
        });

        it('filters obstacle list by exclude ids and missing positions', () => {
            const obstacles = win.projectTaskGraphObstacleList({
                nodes: [
                    { id: 'a' },
                    { id: 'b' },
                    { id: 'c' }
                ],
                positions: {
                    a: { x: 10, y: 20, w: 50, h: 40 },
                    b: { x: 30, y: 40 }
                }
            }, ['b']);
            expect(obstacles).toEqual([
                { id: 'a', x: 10, y: 20, w: 50, h: 40 }
            ]);
        });

        it('formats node labels and maps port roles', () => {
            expect(win.formatProjectTaskGraphNodeLabel('Short')).toBe('Short');
            expect(win.formatProjectTaskGraphNodeLabel('A'.repeat(50))).toMatch(/…$/);
            expect(win.formatProjectTaskGraphNodeLabel('A'.repeat(50)).length).toBe(48);
            expect(win.projectTaskGraphPortRole('w')).toBe('in');
            expect(win.projectTaskGraphPortRole('n')).toBe('in');
            expect(win.projectTaskGraphPortRole('in')).toBe('in');
            expect(win.projectTaskGraphPortRole('e')).toBe('out');
            expect(win.projectTaskGraphPortRole('s')).toBe('out');
            expect(win.projectTaskGraphPortRole('out')).toBe('out');
            expect(win.projectTaskGraphPortRole('x')).toBe('');
        });

        it('resolves wire endpoints and flips in -> out', () => {
            expect(win.resolveProjectTaskGraphWireEndpoints(
                { taskId: 'a', side: 'e' },
                { taskId: 'b', side: 'w' }
            )).toEqual({ from: 'a', to: 'b' });
            expect(win.resolveProjectTaskGraphWireEndpoints(
                { taskId: 'a', side: 'w' },
                { taskId: 'b', side: 'e' }
            )).toEqual({ from: 'b', to: 'a' });
            expect(win.resolveProjectTaskGraphWireEndpoints(
                { taskId: 'a', side: 'e' },
                { taskId: 'a', side: 'w' }
            )).toBeNull();
        });

        it('box-anchors with near-zero ux/uy', () => {
            const p = win.projectTaskGraphBoxAnchor(0, 0, 50, 40, 0, 1);
            expect(p.x).toBe(0);
            expect(p.y).toBe(40);
            // |ux| <= 0.001 → tx = Infinity; vertical unit dominates via ty
            const q = win.projectTaskGraphBoxAnchor(0, 0, 50, 40, 0.0005, 1);
            expect(q.x).toBeCloseTo(0.02);
            expect(q.y).toBe(40);
            const r = win.projectTaskGraphBoxAnchor(10, 20, 50, 40, 1, 0);
            expect(r.x).toBe(60);
            expect(r.y).toBe(20);
        });

        it('keeps geometry helpers out of social-workspace.js function bodies', () => {
            const workspace = readFileSync(
                join(process.cwd(), 'assets/js/pages/social-workspace.js'),
                'utf8'
            );
            for (const name of GEOMETRY_NAMES) {
                expect(workspace).not.toMatch(new RegExp(`function\\s+${name}\\s*\\(`));
                expect(workspace).toContain(name);
                expect(workspace).toMatch(/__swGraphBatch|KiuSocialWorkspaceGraphModel/);
            }
        });
    });

    describe('dep/group completeness + pan math', () => {
        const DEP_NAMES = [
            'projectTaskDependsOnIds',
            'isProjectTaskGraphGroupId',
            'projectGroupDependsOnIds',
            'projectGroupBlocksIds',
            'isProjectTaskGraphGroupComplete',
            'isProjectGraphDependencyOpen',
            'projectTaskGraphContentViewBox',
            'resolveProjectTaskGraphPanSlack',
            'clampProjectTaskGraphPan',
            'projectTaskGraphScrollOffsets'
        ];

        it('exports dep/group/pan helpers', () => {
            for (const name of DEP_NAMES) {
                expect(typeof win[name]).toBe('function');
                expect(win.KiuSocialWorkspaceGraphModel[name]).toBe(win[name]);
            }
            expect(win.PROJECT_TASK_GRAPH_PAN_SLACK).toBe(2400);
        });

        it('reads depends/blocks ids and group id prefix', () => {
            expect(win.projectTaskDependsOnIds({ dependsOnTaskIds: ['a', 'a', 'b'] })).toEqual(['a', 'b']);
            expect(win.projectGroupDependsOnIds({ dependsOnIds: ['grp_1'] })).toEqual(['grp_1']);
            expect(win.projectGroupBlocksIds({ blocksIds: ['t1'] })).toEqual(['t1']);
            expect(win.isProjectTaskGraphGroupId('grp_abc')).toBe(true);
            expect(win.isProjectTaskGraphGroupId('task_1')).toBe(false);
        });

        it('detects open deps and complete groups', () => {
            const tasks = [
                { id: 'a', status: 'done' },
                { id: 'b', status: 'todo' }
            ];
            const groups = [{ id: 'grp_1', memberTaskIds: ['a'] }];
            const byId = new Map(tasks.map((t) => [t.id, t]));
            expect(win.isProjectTaskGraphGroupComplete(groups[0], byId, groups)).toBe(true);
            expect(win.isProjectGraphDependencyOpen('b', { tasks, groups, taskById: byId })).toBe(true);
            expect(win.isProjectGraphDependencyOpen('a', { tasks, groups, taskById: byId })).toBe(false);
            expect(win.isProjectGraphDependencyOpen('grp_1', { tasks, groups, taskById: byId })).toBe(false);
        });

        it('clamps pan and builds scroll offsets', () => {
            expect(win.resolveProjectTaskGraphPanSlack(0)).toBeGreaterThanOrEqual(2400);
            expect(win.clampProjectTaskGraphPan(99999, -99999, 100)).toEqual({ x: 100, y: -100 });
            expect(win.projectTaskGraphScrollOffsets(10, 20, 100)).toEqual({ scrollLeft: 110, scrollTop: 120 });
        });

        it('builds content viewBox from layout bounds', () => {
            const layout = {
                nodes: [{ id: 'a' }],
                positions: { a: { x: 100, y: 50, w: 200, h: 100 } }
            };
            const vb = win.projectTaskGraphContentViewBox(layout, [], 10);
            expect(vb.viewBox).toMatch(/^-?\d+(\.\d+)? /);
            expect(vb.bounds.width).toBeGreaterThan(0);
        });

        it('keeps dep/group/pan helpers out of social-workspace.js function bodies', () => {
            const workspace = readFileSync(
                join(process.cwd(), 'assets/js/pages/social-workspace.js'),
                'utf8'
            );
            for (const name of DEP_NAMES) {
                expect(workspace).not.toMatch(new RegExp(`function\\s+${name}\\s*\\(`));
                expect(workspace).toContain(name);
                expect(workspace).toMatch(/__swGraphBatch|KiuSocialWorkspaceGraphModel/);
            }
        });
    });

    describe('sort / saved-pos / checkpoint / flags / scope', () => {
        const BATCH_NAMES = [
            'sortProjectBoardTasksByPriority',
            'applyProjectTaskGraphSavedPositions',
            'projectTaskGraphShowInferred',
            'projectTaskGraphShowCritical',
            'projectTaskGraphShowFlow',
            'projectTaskGraphPositionsStorageKey',
            'projectTaskGraphViewStorageKey',
            'projectTaskGraphSyncStorageKey',
            'projectTaskGraphGroupsStorageKey',
            'projectTaskGraphCheckpointStorageKey',
            'projectTaskGraphCheckpointsStorageKey',
            'formatProjectTaskGraphCheckpointWhen',
            'normalizeProjectTaskGraphCheckpointEntry',
            'escapeProjectTaskGraphAttr',
            'projectTaskGraphMineOnlyActive',
            'filterProjectTaskGraphVisibleTasks',
            'resolveProjectTaskGraphScheduleScope',
            'computeProjectTaskGraphMapSchedule'
        ];

        it('exports batch helpers and group node sizes', () => {
            for (const name of BATCH_NAMES) {
                expect(typeof win[name]).toBe('function');
                expect(win.KiuSocialWorkspaceGraphModel[name]).toBe(win[name]);
            }
            expect(win.PROJECT_TASK_GROUP_NODE_W).toBe(264);
            expect(win.PROJECT_TASK_GROUP_NODE_H).toBe(228);
        });

        it('sorts board tasks by priority then due date', () => {
            const sorted = win.sortProjectBoardTasksByPriority([
                { id: 'a', title: 'A', priority: 'low', dueAt: '2026-01-02' },
                { id: 'b', title: 'B', priority: 'urgent', dueAt: '2026-01-10' },
                { id: 'c', title: 'C', priority: 'urgent', dueAt: '2026-01-01' }
            ]);
            expect(sorted.map((t) => t.id)).toEqual(['c', 'b', 'a']);
        });

        it('applies saved positions and expands layout extent', () => {
            const layout = {
                width: 400,
                height: 300,
                positions: {
                    a: { x: 100, y: 100, w: 200, h: 100 }
                }
            };
            const next = win.applyProjectTaskGraphSavedPositions(layout, {
                a: { x: -50, y: 20 }
            });
            expect(next.positions.a.x).toBe(-50);
            expect(next.positions.a.y).toBe(20);
            expect(next.width).toBeGreaterThanOrEqual(400);
        });

        it('normalizes checkpoint entries and builds storage keys', () => {
            const entry = win.normalizeProjectTaskGraphCheckpointEntry({
                savedAt: '2026-01-15T12:00:00.000Z',
                taskGraphPositions: { a: { x: 1, y: 2 } }
            });
            expect(entry.id).toBeTruthy();
            expect(entry.taskGraphPositions.a.x).toBe(1);
            expect(entry.label).toMatch(/Save/);
            expect(win.projectTaskGraphPositionsStorageKey('p1')).toContain('p1');
            expect(win.projectTaskGraphCheckpointsStorageKey('p1')).toContain('checkpoints');
        });

        it('filters mine-only tasks and builds schedule scope', () => {
            win.__kiuSocialWorkspaceHooks.currentUserId = () => 'u1';
            const runtime = { ui: { projectTaskFocus: 'mine' } };
            expect(win.projectTaskGraphMineOnlyActive(runtime)).toBe(true);
            expect(win.projectTaskGraphShowCritical({ ui: {} })).toBe(true);
            expect(win.projectTaskGraphShowInferred({ ui: {} })).toBe(false);
            const tasks = [
                { id: 'a', assigneeUserId: 'u1', status: 'todo' },
                { id: 'b', assigneeUserId: 'u2', status: 'todo' },
                { id: 'c', assigneeUserId: 'u1', status: 'done' }
            ];
            expect(win.filterProjectTaskGraphVisibleTasks(runtime, tasks).map((t) => t.id)).toEqual(['a']);
            const scope = win.resolveProjectTaskGraphScheduleScope(runtime, { id: 'p1', tasks });
            expect(scope.mineOnly).toBe(true);
            expect(scope.tasks.map((t) => t.id)).toEqual(['a']);
        });

        it('escapes attr values', () => {
            expect(win.escapeProjectTaskGraphAttr('a"b')).toContain('\\"');
        });

        it('keeps batch helpers out of social-workspace.js function bodies', () => {
            const workspace = readFileSync(
                join(process.cwd(), 'assets/js/pages/social-workspace.js'),
                'utf8'
            );
            for (const name of BATCH_NAMES) {
                expect(workspace).not.toMatch(new RegExp(`function\\s+${name}\\s*\\(`));
                expect(workspace).toMatch(new RegExp(`const ${name} = window\\.${name}`));
            }
        });
    });

    describe('inspector / group box / context / layout', () => {
        const MORE = [
            'buildProjectTaskInspectorFields',
            'resolveProjectTaskGraphGroupBox',
            'resolveProjectTaskGraphContext',
            'buildProjectTaskGraphLayout',
            'readProjectTaskGraphPan'
        ];

        it('exports inspector/context helpers', () => {
            for (const name of MORE) {
                expect(typeof win[name]).toBe('function');
                expect(win.KiuSocialWorkspaceGraphModel[name]).toBe(win[name]);
            }
        });

        it('builds inspector fields with overdue flags', () => {
            win.__kiuSocialWorkspaceHooks.accountById = (id) => ({ id, name: 'Ada' });
            const past = new Date(Date.now() - 86400000).toISOString();
            const fields = win.buildProjectTaskInspectorFields({
                status: 'todo',
                assigneeUserId: 'u1',
                dueAt: past,
                priority: 'high',
                description: '  Hello  '
            });
            expect(fields.statusId).toBe('todo');
            expect(fields.isOverdue).toBe(true);
            expect(fields.priority).toBe('high');
            expect(fields.description).toBe('Hello');
            expect(fields.assignee.id).toBe('u1');
        });

        it('resolves group box from saved coords', () => {
            const box = win.resolveProjectTaskGraphGroupBox(
                { id: 'grp_1', x: 10, y: 20 },
                null,
                { grp_1: { x: 99, y: 88 } }
            );
            expect(box).toEqual({ x: 99, y: 88, w: 264, h: 228 });
        });

        it('builds status layout from context model', () => {
            const model = win.buildProjectTaskGraphModel([
                { id: 'a', title: 'A', status: 'todo' }
            ]);
            const layout = win.buildProjectTaskGraphLayout(model, { ui: { projectTaskGraphLayout: 'status' } });
            expect(layout.layoutKind).toBe('status');
            expect(layout.positions.a).toBeTruthy();
            expect(win.readProjectTaskGraphPan({ ui: { projectTaskGraphPan: { x: 3.2, y: -4.8 } } })).toEqual({ x: 3, y: -5 });
        });

        it('keeps inspector/context helpers out of social-workspace.js function bodies', () => {
            const workspace = readFileSync(
                join(process.cwd(), 'assets/js/pages/social-workspace.js'),
                'utf8'
            );
            for (const name of MORE) {
                expect(workspace).not.toMatch(new RegExp(`function\\s+${name}\\s*\\(`));
                expect(workspace).toMatch(new RegExp(`const ${name} = window\\.${name}`));
            }
        });
    });

    describe('mobile viewport helpers', () => {
        it('exposes isProjectTaskGraphMobileViewport and mobile chrome constant', () => {
            expect(typeof win.isProjectTaskGraphMobileViewport).toBe('function');
            expect(win.PROJECT_TASK_GRAPH_MOBILE_CHROME_H).toBeGreaterThan(112);
        });

        it('computeProjectTaskGraphStageSize skips rail subtract on mobile', () => {
            win.innerWidth = 390;
            win.innerHeight = 844;
            win.matchMedia = (query) => ({
                matches: String(query).includes('max-width: 1024px'),
                media: query,
                addListener() {},
                removeListener() {}
            });
            const withSel = win.computeProjectTaskGraphStageSize({
                ui: { projectTaskGraphSelectedId: 'task-1' }
            });
            const withoutSel = win.computeProjectTaskGraphStageSize({ ui: {} });
            expect(withSel.stageWidth).toBe(withoutSel.stageWidth);
            expect(withSel.stageWidth).toBe(390);
            expect(withSel.stageHeight).toBeLessThan(844);
            expect(withSel.stageHeight).toBeGreaterThanOrEqual(240);
        });

        it('resolveProjectTaskGraphPanSlack caps base slack on mobile', () => {
            win.innerWidth = 390;
            win.innerHeight = 844;
            win.matchMedia = (query) => ({
                matches: String(query).includes('max-width: 1024px'),
                media: query,
                addListener() {},
                removeListener() {}
            });
            const slack = win.resolveProjectTaskGraphPanSlack(100);
            expect(slack).toBeLessThan(2400);
            expect(slack).toBeGreaterThanOrEqual(Math.round(844 * 1.5));
            const grown = win.resolveProjectTaskGraphPanSlack(5000);
            expect(grown).toBe(5000);
        });

        it('keeps desktop pan slack floor at 2400', () => {
            win.innerWidth = 1440;
            win.innerHeight = 900;
            win.matchMedia = () => ({
                matches: false,
                media: '',
                addListener() {},
                removeListener() {}
            });
            expect(win.resolveProjectTaskGraphPanSlack(100)).toBeGreaterThanOrEqual(2400);
        });
    });
});
