import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social-project-task-graph-ui', () => {
    it('bare-lite includes task map paint hooks', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const graphBlockStart = bare.indexOf('/* Social: project task map */');
        expect(graphBlockStart).toBeGreaterThan(-1);
        const nextBlock = bare.indexOf('\n/* Social: project workspace team tab */', graphBlockStart);
        const graphBlock = bare.slice(graphBlockStart, nextBlock > -1 ? nextBlock : graphBlockStart + 15000);

        expect(graphBlock).toContain('.social-project-task-graph-immersive');
        expect(graphBlock).toContain('.social-project-task-graph-health-metric');
        expect(graphBlock).toContain('.social-project-task-graph-detail-rail');
        expect(graphBlock).toContain('.social-project-task-graph-card');
        expect(graphBlock).toContain('.sptg-context-menu');
        expect(graphBlock).toContain('.lux-glass-dialog-card--project-task-graph-fullscreen');
        expect(graphBlock).not.toContain('--sn-');
    });

    it('bare-lite includes overview dashboard zone hooks', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const overviewStart = bare.indexOf('/* Social: overview dashboard zones */');
        expect(overviewStart).toBeGreaterThan(-1);
        const overviewEnd = bare.indexOf(
            'body.lux-route-social .social-project-overview-slot {\n  display: grid;\n  gap: 10px;\n}',
            overviewStart
        );
        const overviewBlock = bare.slice(overviewStart, overviewEnd > -1 ? overviewEnd : overviewStart + 12000);

        expect(overviewBlock).toContain('.social-project-overview-brief');
        expect(overviewBlock).toContain('.social-project-ov-order-1');
        expect(overviewBlock).toContain('.social-project-ov-quick-actions-wrap--compact');
        expect(overviewBlock).not.toContain('--sn-');
        expect(bare).toMatch(/social-project-dashboard-strip[\s\S]{0,200}repeat\(5,/);
    });

    it('lux-modals defines fullscreen task map shell', () => {
        const modals = readSource('assets/css/lux-modals.css');
        expect(modals).toContain('.lux-glass-dialog-card--project-task-graph-fullscreen');
        expect(modals).toContain('.lux-glass-dialog-backdrop--project-task-graph');
    });

    it('graph-render emits immersive task map markup', () => {
        const render = readSource('assets/js/pages/social-workspace-graph-render.js');
        expect(render).toContain('social-project-task-graph-immersive');
        expect(render).toContain('lux-glass-dialog-card--project-task-graph-fullscreen');
        expect(render).toContain('lux-glass-dialog-backdrop--project-task-graph');
    });
});
