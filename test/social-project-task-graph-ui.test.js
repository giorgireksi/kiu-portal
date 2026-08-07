import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social-project-task-graph-ui', () => {
    it('fouc-ht keeps graph wire ports visible outside card chrome', () => {
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        const block = fouc.slice(
            fouc.indexOf('.social-project-task-graph-card.lux-soft-chrome.home-hover-chip'),
            fouc.indexOf('/* Timetable + registration pages:')
        );
        expect(block).toContain('overflow: visible');
        expect(block).not.toContain('overflow: hidden');
        expect(block).toContain('contain: none');
    });

    it('bare-lite includes task map paint hooks', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const graphBlockStart = bare.indexOf('/* Social: project task map */');
        expect(graphBlockStart).toBeGreaterThan(-1);
        const nextBlock = bare.indexOf('\n/* Social: project workspace team tab */', graphBlockStart);
        const graphBlock = bare.slice(graphBlockStart, nextBlock > -1 ? nextBlock : graphBlockStart + 15000);

        expect(graphBlock).not.toContain('.social-project-task-graph-immersive-topbar');
        expect(graphBlock).not.toContain('.social-project-task-graph-group-focus');
        expect(graphBlock).not.toContain('.social-project-task-graph-checkpoint-controls');
        expect(graphBlock).not.toContain('.social-project-task-graph-schedule-controls');
        // zoom-controls are styled for mobile essential toolbar densify (≤1024)
        expect(graphBlock).toContain('.social-project-task-graph-zoom-controls');
        expect(graphBlock).toContain('.social-project-task-graph-essential-controls');
        expect(graphBlock).not.toContain('.social-project-task-graph-zoom-label');
        expect(graphBlock).not.toContain('.social-project-task-graph-zoom-btn');
        expect(graphBlock).not.toContain('.social-project-task-graph-critical-toggle');
        expect(graphBlock).not.toContain('.social-project-task-graph-mode-toolbar');
        expect(graphBlock).toContain('.social-project-task-graph-health-metric');
        expect(graphBlock).toContain('.social-page-toolbar-group');
        expect(graphBlock).toContain('.social-page-toolbar-field');
        expect(graphBlock).toContain('Task map canvas cards — light mode ink');
        expect(graphBlock).toContain('.lux-glass-dialog-group-section-head');
        expect(graphBlock).toContain('.social-project-task-graph-rail-overview-head');
        expect(graphBlock).toContain('.social-project-task-graph-schedule-stat-label');
        expect(graphBlock).toContain('.social-project-task-graph-hit');
        expect(graphBlock).toContain('.social-project-task-graph-card');
        expect(graphBlock).toContain('.social-project-task-graph-scroll-surface');
        expect(graphBlock).toContain('.lux-soft-chrome');
        expect(graphBlock).toContain('.sptg-context-menu');
        expect(graphBlock).toContain('.social-project-task-graph-page');
        expect(graphBlock).toContain(':is(html.lux-light-mode, body.lux-light-mode) body.lux-route-social #social-neo-overlay-portal .social-project-task-graph-immersive');
        expect(graphBlock).toContain('background: var(--lux-shell-background, var(--lux-bg, #08101d));');
        expect(graphBlock).not.toContain('--sn-');
        expect(graphBlock).not.toContain('Task map immersive topbar controls');
        expect(bare).toContain('.social-project-task-graph-stage--immersive.is-interacting');
        expect(bare).toContain('box-shadow: none !important;');
        expect(bare).toContain(':has(.social-project-task-graph-stage--immersive.is-interacting)');
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

    it('lux-modals exposes the graph page mount surface', () => {
        const modals = readSource('assets/css/lux-modals.css');
        expect(modals).toContain('#social-neo-overlay-portal :is(.social-page-surface, .social-project-task-graph-stack)');
    });

    it('graph-render emits immersive task map markup', () => {
        const render = readSource('assets/js/pages/social-workspace-graph-render.js');
        expect(render).toContain('social-project-task-graph-immersive');
        expect(render).toContain('social-page-surface-head social-project-task-graph-page-head lux-soft-chrome home-hover-chip');
        expect(render).toContain('social-page-surface-actions social-project-task-graph-immersive-actions social-project-task-graph-page-actions');
        expect(render).toContain('social-page-toolbar-group');
        expect(render).toContain('lux-control social-project-task-graph-group-select');
        expect(render).toContain('lux-status-pill');
        expect(render).not.toContain('social-neo-select social-project-task-graph-group-select');
        expect(render).not.toContain('social-page-toolbar-group social-project-tab-row');
        expect(render).not.toContain('social-neo-card social-project-task-graph-immersive-topbar');
        expect(render).not.toContain('social-project-task-graph-immersive-topbar lux-soft-chrome');
        expect(render).toContain('social-project-task-graph-card lux-soft-chrome home-hover-chip');
        expect(render).toContain('social-project-task-graph-group lux-soft-chrome home-hover-chip');
        expect(render).toContain('class="social-project-task-graph-hit"');
        expect(render).not.toContain('fill="transparent" pointer-events="all"');
        expect(render).toContain('lux-card social-project-task-graph-detail-rail lux-soft-chrome');
        expect(render).toContain('lux-card social-project-task-graph-rail-overview-section lux-soft-chrome');
        expect(render).toContain('lux-card-head social-project-task-graph-rail-overview-head');
        expect(render).toContain('social-project-task-graph-schedule-overview lux-card-body');
        expect(render).toContain('social-project-task-graph-schedule-stat lux-stat');
        expect(render).toContain('social-project-task-graph-inspector-props lux-card-meta');
        expect(render).toContain('social-project-task-graph-inspector-body lux-card lux-soft-chrome');
        expect(render).toContain('social-project-task-graph-inspector-schedule-block lux-card lux-soft-chrome');
        expect(render).not.toContain('social-project-task-graph-rail-overview-section lux-soft-chrome home-hover-chip');
        expect(render).not.toContain('social-project-task-graph-schedule-stat lux-stat lux-soft-chrome');
        expect(render).not.toContain('social-project-task-graph-inspector-body lux-card lux-soft-chrome home-hover-chip');
        expect(render).toContain('social-project-task-graph-inspector-schedule-head lux-card-head');
        expect(render).not.toContain('lux-glass-dialog-compact');
        expect(render).toContain('social-project-task-graph-inspector-section-card lux-soft-chrome');
        expect(render).toContain('social-page-surface social-project-task-graph-page');
        expect(render).not.toContain('social-project-task-graph-immersive-title');
        expect(render).not.toContain('social-page-surface-subtitle');
        expect(render).not.toContain('social-page-surface-title');
        expect(render).not.toContain('lux-glass-dialog-card--project-task-graph-fullscreen');
        expect(render).not.toContain('lux-glass-dialog-backdrop--project-task-graph');
        expect(render).toContain('social-project-task-graph-essential-controls');
        expect(render).toContain('lux-ghost-btn social-project-task-graph-back-btn');
        expect(render).toContain('lux-primary-btn social-project-task-graph-add-btn');
        expect(render).toContain('lux-primary-btn social-project-task-graph-save-btn');
        expect(render).toContain('lux-secondary-btn social-project-task-graph-history-btn');
        expect(render).toContain('lux-secondary-btn social-project-task-graph-critical-toggle');
        expect(render).not.toContain('data-action="project-task-graph-more-toggle"');
        expect(render).not.toContain('social-project-task-graph-more-btn');
        expect(render).toContain('social-project-task-graph-tool-strip social-project-task-graph-more-panel');
        expect(render).toContain('social-project-task-graph-my-switch');
        expect(render).not.toContain('social-project-task-graph-footer-tools');
        expect(render).not.toContain('social-project-task-graph-footer-actions');
        expect(render).toContain('aria-label="Task map tools" aria-hidden="false"');
        expect(render).toContain('social-project-task-graph-rail-sheet-handle');
        expect(render).toContain('is-rail-open');
        expect(render).not.toContain('projectTaskGraphMoreOpen');
        expect(render).not.toMatch(/\$\{moreOpen \? '' : 'hidden'\}/);
        expect(render).toContain('data-project-task-graph-more-panel="1"');
    });

    it('bare-lite includes mobile task map densify hooks', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('Social: task map mobile densify');
        expect(bare).toContain('touch-action: pan-x pan-y');
        expect(bare).toContain('.social-project-task-graph-detail-rail.is-empty');
        expect(bare).toContain('.social-project-task-graph-rail-sheet-handle');
        expect(bare).toContain('.social-project-task-graph-more-panel');
        expect(bare).toContain('.social-project-task-graph-essential-controls');
        expect(bare).toContain('.social-project-task-graph-tool-strip');
        expect(bare).toMatch(/@media \(max-width: 1024px\)[\s\S]*social-project-task-graph-detail-rail:not\(\.is-empty\)/);
        expect(bare).toMatch(/social-project-task-graph-detail-rail:not\(\.is-empty\)[\s\S]*top:\s*0/);
        expect(bare).toMatch(/social-project-task-graph-detail-rail:not\(\.is-empty\)[\s\S]*height:\s*100dvh/);
        expect(bare).toMatch(/social-project-task-graph-detail-rail:not\(\.is-empty\)[\s\S]*max-height:\s*none/);
        expect(bare).toMatch(/social-project-task-graph-detail-rail:not\(\.is-empty\)[\s\S]*border-radius:\s*0/);
        expect(bare).toContain('.social-project-task-graph-detail-rail:not(.is-empty) .social-project-task-graph-inspector-actions > button');
        const mobileRailStart = bare.indexOf('social-project-task-graph-detail-rail:not(.is-empty) {');
        const mobileRailEnd = bare.indexOf('.social-project-task-graph-detail-rail:not(.is-empty) .social-project-task-graph-inspector-head', mobileRailStart);
        const mobileRail = bare.slice(mobileRailStart, mobileRailEnd);
        expect(mobileRail).toContain('background-color: var(--lux-panel-fill) !important;');
        expect(mobileRail).toContain('background-image: var(--lux-panel-surface) !important;');
        expect(mobileRail).toContain('var(--lux-panel-host-shadow, var(--lux-elev-3))');
        expect(mobileRail).not.toContain('--home-chip-surface-fill');
        expect(bare).not.toContain('.social-project-task-graph-more-panel[hidden]');
        expect(bare).toMatch(/\.social-project-task-graph-more-panel\s*\{\s*display:\s*contents;/);
        expect(bare).toMatch(/@media \(max-width: 1024px\)[\s\S]*\.social-project-task-graph-page-actions[\s\S]*overflow-x:\s*auto/);
        expect(bare).toMatch(/@media \(max-width: 1024px\)[\s\S]*\.social-project-task-graph-page-actions[\s\S]*flex-wrap:\s*nowrap/);
        expect(bare).toMatch(/social-project-task-graph-tool-strip[\s\S]*display:\s*contents/);
        expect(bare).toMatch(/\.social-project-task-graph-more-btn\s*\{\s*display:\s*none;/);
        expect(bare).toMatch(/social-project-task-graph-history-page[\s\S]*overflow-x:\s*auto/);
    });

    it('task map toolbar delegates button paint to shared controls', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const toolbarStart = bare.indexOf('/* Task-map toolbar: use the shared control materials');
        expect(toolbarStart).toBeGreaterThan(-1);
        const toolbar = bare.slice(toolbarStart);
        expect(toolbar).toContain('.social-project-task-graph-page-actions');
        expect(toolbar).toContain('var(--lux-panel-control)');
        expect(toolbar).toContain('outline: 2px solid var(--lux-accent);');
        expect(toolbar).toMatch(/@media \(max-width: 1024px\)[\s\S]*min-height: 44px/);
        expect(bare).not.toContain('Task-map toolbar: flat panel controls');
        expect(bare).not.toContain('.social-project-task-graph-page-actions :is(\n    button.lux-primary-btn,');
    });

    it('fouc-ht registers task map soft-chrome surfaces', () => {
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(fouc).toContain('.social-project-task-graph-card.lux-soft-chrome');
        expect(fouc).toContain('.social-project-task-graph-group.lux-soft-chrome');
        expect(fouc).toContain('.social-page-surface-head.lux-soft-chrome');
        expect(fouc).toContain('.social-page-surface-head\n  ).home-hover-chip:hover');
        expect(fouc).not.toContain('.social-project-task-graph-immersive-topbar.lux-soft-chrome,');
        expect(fouc).toContain('.social-project-task-graph-immersive-footer.lux-soft-chrome {\n  border-radius: 0;');
        expect(fouc).not.toContain('.social-project-task-graph-schedule-stat.lux-soft-chrome');
        const inspectorPaintStart = fouc.indexOf('/* Task-map detail rail uses the normal page card paint system. */');
        const inspectorPaint = fouc.slice(inspectorPaintStart, inspectorPaintStart + 700);
        expect(inspectorPaint).toContain('.social-project-task-graph-detail-rail.lux-card.lux-soft-chrome');
        expect(inspectorPaint).toContain('.social-project-task-graph-inspector-scroll .lux-card.lux-soft-chrome');
        expect(inspectorPaint).toContain('.lux-card.lux-soft-chrome');
        expect(inspectorPaint).not.toContain('.lux-stat.lux-soft-chrome');
    });
});
