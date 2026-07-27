import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social-workspace-graph-desk-model peel', () => {
    it('owns desk/forest/rollup outside graph-model', () => {
        const model = readSource('assets/js/pages/social-workspace-graph-model.js');
        const desk = readSource('assets/js/pages/social-workspace-graph-desk-model.js');
        expect(model).toContain('social-workspace-graph-desk-model.js');
        expect(model).not.toMatch(/^\s*function orderDeskTasksByDependency\b/m);
        expect(model).not.toMatch(/^\s*function computeProjectTaskGraphGroupRollup\b/m);
        expect(desk).toContain('function orderDeskTasksByDependency');
        expect(desk).toContain('function buildDeskTaskForest');
        expect(desk).toContain('function computeProjectTaskGraphGroupRollup');
        expect(desk).toContain('__KIU_SOCIAL_WORKSPACE_GRAPH_DESK_MODEL_LOADED');
        expect(desk).toContain('KiuSocialWorkspaceGraphDeskModel');
    });

    it('loads before graph-model in ensureSocialWorkspaceModule', () => {
        const page = readSource('assets/js/pages/social-page.js');
        expect(page).toContain('SOCIAL_WORKSPACE_GRAPH_DESK_MODEL_URL');
        const ensureBlock = page.slice(
            page.indexOf('function ensureSocialWorkspaceModule'),
            page.indexOf('function hasSocialWorkspaceModule')
        );
        expect(ensureBlock.indexOf('SOCIAL_WORKSPACE_GRAPH_DESK_MODEL_URL'))
            .toBeLessThan(ensureBlock.indexOf('SOCIAL_WORKSPACE_GRAPH_MODEL_URL'));
    });

    it('graph-model forwards desk rollup helpers to KiuSocialWorkspaceGraphDeskModel', () => {
        const model = readSource('assets/js/pages/social-workspace-graph-model.js');
        expect(model).toContain('const __graphDeskPeer = () => window.KiuSocialWorkspaceGraphDeskModel || {}');
        expect(model).toContain('__graphDeskPeer().computeProjectTaskGraphGroupRollup?.(...a)');
    });

    it('workspace passes group node sizes from graph-model to graph-render', () => {
        const workspace = readSource('assets/js/pages/social-workspace.js');
        expect(workspace).toMatch(/PROJECT_TASK_GROUP_NODE_W: __swGraphBatch\.PROJECT_TASK_GROUP_NODE_W \|\| 264/);
        expect(workspace).toMatch(/PROJECT_TASK_GROUP_NODE_H: __swGraphBatch\.PROJECT_TASK_GROUP_NODE_H \|\| 228/);
    });

    it('graph-render falls back to graph-model group node sizes', () => {
        const render = readSource('assets/js/pages/social-workspace-graph-render.js');
        expect(render).toContain('const GROUP_NODE_W = Number(PROJECT_TASK_GROUP_NODE_W)');
        expect(render).toContain('__swGraphBatch.PROJECT_TASK_GROUP_NODE_W');
    });
});
