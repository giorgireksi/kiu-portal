import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social-workspace-graph-groups-wiring', () => {
    it('passes resolved getProjectTaskGraphGroups binding, not window.getProjectTaskGraphGroups', () => {
        const workspace = readSource('assets/js/pages/social-workspace.js');

        expect(workspace).not.toContain('getProjectTaskGraphGroups: window.getProjectTaskGraphGroups');
        expect(workspace).toMatch(/const getProjectTaskGraphGroups = __wsGraphRtApi\?\.getProjectTaskGraphGroups/);
        expect((workspace.match(/^\s+getProjectTaskGraphGroups,$/gm) || []).length).toBe(4);
    });

    it('passes resolved projectTaskGraphStatusEdgeColor to graph-render, not window.projectTaskGraphStatusEdgeColor', () => {
        const workspace = readSource('assets/js/pages/social-workspace.js');

        expect(workspace).not.toContain('projectTaskGraphStatusEdgeColor: window.projectTaskGraphStatusEdgeColor');
        expect(workspace).toMatch(
            /const projectTaskGraphStatusEdgeColor = __swGraphBatch\.projectTaskGraphStatusEdgeColor \|\| window\.projectTaskGraphStatusEdgeColor/
        );
        expect(workspace).toMatch(/__kiuCreateSocialWorkspaceGraphRenderApi[\s\S]*?projectTaskGraphStatusEdgeColor,/);
    });

    it('graph-runtime defines task graph sync marker helpers locally', () => {
        const runtime = readSource('assets/js/pages/social-workspace-graph-runtime.js');

        expect(runtime).toContain('function loadTaskGraphSyncMarker(projectId)');
        expect(runtime).toContain('function saveTaskGraphSyncMarker(projectId, iso = \'\')');
        expect(runtime).toContain('function refreshDeskAfterGraphMembership(projectId = \'\')');
        expect(runtime).toMatch(/projectTaskGraphSyncStorageKey,/);
    });

    it('graph-sync-runtime resolves edge path from __swGraphBatch', () => {
        const sync = readSource('assets/js/pages/social-workspace-graph-sync-runtime.js');

        expect(sync).toMatch(/const projectTaskGraphEdgePath = typeof deps\.projectTaskGraphEdgePath === 'function'/);
        expect(sync).toContain('__swGraphBatch.projectTaskGraphEdgePath');
    });

    it('graph-runtime passes projectTaskGraphEdgePath to graph-sync factory', () => {
        const runtime = readSource('assets/js/pages/social-workspace-graph-runtime.js');

        expect(runtime).toMatch(/projectTaskGraphEdgePath,\s*\n\s*get bindProjectTaskGraphDrag/);
    });

    it('graph-sync-runtime resolves pan/zoom helpers from __swGraphBatch', () => {
        const sync = readSource('assets/js/pages/social-workspace-graph-sync-runtime.js');

        expect(sync).toMatch(/const clampProjectTaskGraphZoom = deps\.clampProjectTaskGraphZoom \|\| __swGraphBatch\.clampProjectTaskGraphZoom/);
        expect(sync).toMatch(/const clampProjectTaskGraphPan = deps\.clampProjectTaskGraphPan \|\| __swGraphBatch\.clampProjectTaskGraphPan/);
        expect(sync).toMatch(/const resolveProjectTaskGraphPanSlack = deps\.resolveProjectTaskGraphPanSlack \|\| __swGraphBatch\.resolveProjectTaskGraphPanSlack/);
        expect(sync).toMatch(/const projectTaskGraphScrollOffsets = deps\.projectTaskGraphScrollOffsets \|\| __swGraphBatch\.projectTaskGraphScrollOffsets/);
        expect(sync).toContain('function removeProjectGraphDependency(...a)');
        expect(sync).toContain('function resolveGraphRenderDep(name)');
        expect(sync).toContain('function buildProjectTaskGraphCanvasMarkup(...args)');
    });

    it('graph-runtime passes removeProjectGraphDependency getter to graph-sync factory', () => {
        const runtime = readSource('assets/js/pages/social-workspace-graph-runtime.js');

        expect(runtime).toMatch(/get removeProjectGraphDependency\(\)/);
    });

    it('graph-runtime factory lazy-resolves dialog-route stack helpers', () => {
        const workspace = readSource('assets/js/pages/social-workspace.js');

        expect(workspace).not.toContain('shouldRenderProjectHealthStack: window.shouldRenderProjectHealthStack');
        expect(workspace).not.toContain('renderStackedProjectTaskChild: window.renderStackedProjectTaskChild');
        expect(workspace).toMatch(/shouldRenderProjectHealthStack:\s*\(\.\.\.args\)\s*=>\s*\{/);
        expect(workspace).toMatch(/renderStackedProjectTaskChild:\s*\(\.\.\.args\)\s*=>\s*\{/);
        expect(workspace).toMatch(/window\.__kiuSwApi\?\.shouldRenderProjectHealthStack/);
        expect(workspace).toMatch(/window\.__kiuSwApi\?\.renderStackedProjectTaskChild/);
    });
});
