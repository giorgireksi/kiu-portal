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
});
