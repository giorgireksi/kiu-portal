import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social-project-health-ui', () => {
    it('bare-lite includes project health dialog paint hooks', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const blockStart = bare.indexOf('/* Social: project health dialog */');
        expect(blockStart).toBeGreaterThan(-1);
        const blockEnd = bare.indexOf('/* —— Graph detail rail:', blockStart);
        const block = bare.slice(blockStart, blockEnd > -1 ? blockEnd : blockStart + 50000);

        expect(block).toContain('.sph-hygiene-chip');
        expect(block).toContain('.sph-pick-split');
        expect(block).toContain('.sph-card--readiness');
        expect(block).toContain('.sph-card--plan');
        expect(bare).toContain('.social-page-form-actions');
        expect(bare).toContain('.social-page-field');
        expect(bare).toContain('.sph-readiness-row');
        expect(bare).toContain('.social-project-health-page .sph-hygiene');
        expect(bare).toContain('.social-project-health-page .sph-board');
        expect(bare).toContain('.social-project-health-page .sph-verdict');
        expect(bare).toContain('.social-project-health-page .sph-card-head.lux-card-head');
        expect(bare).toContain('.social-project-health-page .sph-brow .sph-blab');
        expect(bare).toContain('.social-project-health-page .sph-fact');
        expect(bare).toContain('.social-project-health-page .sph-dep > span:last-child');
        expect(bare).toContain('.social-page-surface-body');
        expect(bare).toContain('max-width: 100%;');
        expect(bare).toContain('box-sizing: border-box;');
        expect(bare).toContain('padding: 14px 16px;');
        expect(bare).toContain('@media (max-width: 1400px)');
        expect(bare).toContain('.social-project-health-page .sph-why .lux-card-head');
        expect(bare).toContain('.social-project-health-page .sph-week-item');
        expect(bare).toContain('.social-project-health-page .sph-week-copy strong');
        expect(bare).toContain('.social-project-health-page .sph-card--plan');
        expect(bare).toContain('.social-project-health-page .sph-plan-tabs');
        expect(bare).toContain('.social-project-health-page .sph-plan-add');
        expect(bare).toContain('.social-project-health-page :is(.sph-week-list, .sph-fix-list, .sph-team)');
        expect(bare).toContain('.social-project-health-page .sph-why.lux-card');
        expect(bare).toContain('.social-project-health-page .social-page-surface-body > *');
        expect(bare).not.toContain('body.lux-route-social .sph-plan-tab.is-active');
        expect(bare).not.toContain('body.lux-route-social .sph-plan-tab:hover:not(.is-active)');
        expect(block).not.toContain('--sn-');
    });

    it('bare-lite defines health page-surface geometry', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('.social-page-surface');
        expect(bare).toContain('.social-project-health-page');
        expect(bare).toContain('.social-project-risk-page');
        expect(bare).toContain('.social-project-risk-page > .social-page-form-actions');
        expect(bare).toContain('grid-template-rows: minmax(0, auto) minmax(0, 1fr)');
        expect(bare).toMatch(/\.social-project-risk-page\s*\{[\s\S]*align-items:\s*stretch/);
    });

    it('marks every full-page Social child surface for shared styling', () => {
        const dialogs = readSource('assets/js/pages/social-workspace-dialogs.js');
        const projectChrome = readSource('assets/js/pages/social-workspace-project-chrome.js');
        const taskUi = readSource('assets/js/pages/social-workspace-task-ui.js');
        const bare = readSource('assets/css/lux-page-bare-lite.css');

        for (const surface of [
            'social-project-task-detail-page',
            'social-project-health-plan-page',
            'social-project-health-page',
            'social-project-risk-page'
        ]) {
            expect(dialogs).toMatch(new RegExp(`social-page-surface ${surface}[^>]*data-lux-transparency-exempt="1"`));
        }
        expect(projectChrome).toMatch(/social-page-surface social-project-settings-page[^>]*data-lux-transparency-exempt="1"/);
        expect(taskUi).toMatch(/social-page-surface social-project-task-delete-page[^>]*data-lux-transparency-exempt="1"/);
        expect(taskUi).toMatch(/social-page-surface social-project-task-form-page[^>]*data-lux-transparency-exempt="1"/);
        expect(bare).toContain('.social-page-surface[data-lux-transparency-exempt="1"]:not(');
        expect(bare).toContain('background-color: var(--lux-panel-fill);');
        expect(bare).toContain('background-image: var(--lux-panel-surface);');
        expect(bare).toContain('box-shadow: var(--lux-panel-host-shadow);');
        expect(bare).toContain('backdrop-filter: var(--lux-panel-blur-filter);');
    });

    it('bare-lite defines compact stacked health mobile flow', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('.social-project-health-page .social-page-surface-body--project-health');
        expect(bare).toContain('overscroll-behavior: contain');
        expect(bare).toContain('.social-project-health-page .sph-fs-topbar-actions');
        expect(bare).toContain('grid-template-columns: repeat(2, minmax(0, 1fr));');
        expect(bare).toContain('.social-project-health-page .sph-hygiene');
        expect(bare).toContain('.social-project-health-page .sph-plan-tabs');
        expect(bare).toContain('.social-project-health-page .sph-fs-footer > button');
        expect(bare).toContain('min-height: 44px;');
    });

    it('bare-lite defines direct risk rail control geometry', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('.social-project-risk-page .spr-rail-head');
        expect(bare).toContain('.social-project-risk-page .spr-rail-section');
        expect(bare).toContain('.social-project-risk-page .spr-task-row');
        expect(bare).toContain('.social-project-risk-page .spr-group-head');
        expect(bare).toContain('.social-project-risk-page .spr-group-select');
        expect(bare).toContain('.social-project-risk-page .spr-group-toggle');
        expect(bare).toContain('grid-template-columns: 22px minmax(0, 1fr) auto;');
        expect(bare).toContain('.social-project-risk-page .spr-task-add');
        expect(bare).toContain('flex: 0 0 44px;');
        expect(bare).toContain('.social-project-risk-page .spr-compose');
        expect(bare).toContain('.social-project-risk-page .spr-compose .social-page-field-label');
        expect(bare).toContain('.social-project-risk-page .spr-risk-list:has(.spr-empty)');
        expect(bare).toContain('letter-spacing: 0;');
        expect(bare).toContain('text-shadow: none;');
        expect(bare).toContain('min-height: 44px;');
    });

    it('bare-lite blocks graph clicks when stacked child is open', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const stackBlock = bare.slice(bare.indexOf('/* Stacked child modals must clear dashboard chrome'));
        expect(stackBlock).toContain(
            '.social-project-task-graph-stack:has(.social-project-task-graph-child-slot > .lux-glass-dialog-backdrop) .social-project-task-graph-anchor'
        );
        expect(stackBlock).toContain('pointer-events: none !important');
        expect(stackBlock).toContain('[data-project-task-graph-stage]');
        expect(stackBlock).not.toContain('.social-project-task-graph-anchor *');
        expect(stackBlock).toContain('.social-project-task-graph-stack--child-open');
        expect(stackBlock).toContain('.social-project-task-graph-child-slot[hidden]');
        expect(stackBlock).not.toMatch(/\.social-project-task-graph-child-slot:has\(> \.lux-glass-dialog-backdrop\)[\s\S]{0,260}top:\s*var\(--ptg-chrome-top/);
        expect(stackBlock).not.toMatch(/\.social-project-task-graph-child-slot \{[\s\S]{0,120}position:\s*static/);
        expect(stackBlock).toContain('.social-project-task-graph-child-slot .social-project-health-stack .lux-glass-dialog-backdrop');
    });

    it('studio chip tokens and sections apply on social overlay portal', () => {
        const studio = readSource('assets/css/lux-studio.css');
        const socialHtml = readSource('social.html');
        expect(socialHtml).toContain('assets/css/lux-studio.css?v=');
        expect(studio).toContain('#social-neo-overlay-portal');
        expect(studio).toMatch(
            /:is\(#lux-studio-backdrop, #lux-bg-mode-params-backdrop, #lux-bg-gallery-backdrop, #social-neo-overlay-portal\)[\s\S]{0,200}--lux-studio-chip-surface/
        );
        expect(studio).toContain(
            '#social-neo-overlay-portal .sptg-history-dialog'
        );
        expect(studio).toContain(
            '#social-neo-overlay-portal .lux-glass-dialog-card--health-plan-pick'
        );
        expect(studio).toContain(
            '#social-neo-overlay-portal [data-lux-transparency-exempt="1"] .lux-studio-section'
        );

        const modals = readSource('assets/css/lux-modals.css');
        expect(modals).toContain('.social-project-task-graph-child-slot [data-lux-transparency-exempt="1"].lux-glass-dialog-card--social-glass');
        expect(modals).toMatch(/social-project-task-graph-child-slot[\s\S]{0,500}color-mix\(in srgb, var\(--lux-studio-dialog-bg/);
        expect(modals).not.toMatch(/social-project-task-graph-child-slot[\s\S]{0,900}var\(--lux-panel-modal-section\)/);

        const dialogs = readSource('assets/js/pages/social-workspace-dialogs.js');
        expect(dialogs).toContain('sph-card-head');
        expect(dialogs).not.toContain('sph-card lux-soft-chrome-head');
        expect(dialogs).toContain('lux-studio-section');
        expect(dialogs).toContain('lux-control-btn');

        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const healthBlock = bare.slice(bare.indexOf('body.lux-route-social :is(#public-social-root, #social-neo-overlay-portal) .sph-verdict'));
        expect(healthBlock).not.toMatch(/\.sph-verdict \{[\s\S]{0,180}background:/);
        expect(healthBlock).not.toMatch(/\.sph-hygiene-chip \{[\s\S]{0,220}background:/);
        expect(healthBlock).not.toMatch(/\.sph-week-item \{[\s\S]{0,220}background:/);
        expect(healthBlock).not.toMatch(/\.sph-fix-task \{[\s\S]{0,220}background:/);

        const stackBlock = bare.slice(bare.indexOf('/* Stacked child modals must clear dashboard chrome'));
        expect(stackBlock).toContain('.social-project-task-graph-child-slot > .lux-glass-dialog-backdrop');
        expect(stackBlock).toContain('.social-project-task-graph-child-slot > [data-social-page-surface]');
        expect(stackBlock).not.toContain('background: rgba(2, 6, 23, 0.86)');
        expect(stackBlock).toContain('.social-project-task-graph-stack--child-open .social-project-task-graph-immersive-body');
        expect(stackBlock).toContain('.social-project-task-graph-stack--child-open .social-project-task-graph-immersive-footer');
        expect(stackBlock).toMatch(/\.social-project-task-graph-immersive-footer[\s\S]{0,200}display:\s*none !important/);
        expect(stackBlock).toContain('.social-project-task-graph-stack--child-open .social-project-task-graph-detail-rail');
        expect(stackBlock).toMatch(/social-project-task-graph-stack--child-open[\s\S]{0,900}\.social-project-task-graph-immersive-body[\s\S]{0,180}opacity:\s*0\.55/);
        expect(stackBlock).not.toMatch(/social-project-task-graph-stack--child-open[\s\S]{0,900}\.social-project-task-graph-immersive-body[\s\S]{0,120}visibility:\s*hidden/);
        expect(stackBlock).toContain('opacity: 0.55');
    });

    it('page surfaces keep health content in normal page flow', () => {
        const modals = readSource('assets/css/lux-modals.css');
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(modals).toContain('.social-page-surface');
        expect(bare).toContain('.social-project-health-page .social-page-surface-body');
        expect(bare).toContain('.social-project-risk-page .social-page-surface-body');
    });

    it('Health plan patch targets the page surface and preserves focus scroll', () => {
        const feed = readSource('assets/js/pages/social-page-feed-runtime.js');
        expect(feed).toContain('.social-project-health-page, ');
        expect(feed).toContain('focus({ preventScroll: true })');
        expect(feed).toContain('window.requestAnimationFrame?.(restoreScroll)');
    });

    it('page surfaces remain interactive in the graph child slot', () => {
        const modals = readSource('assets/css/lux-modals.css');
        expect(modals).toContain('#social-neo-overlay-portal :is(.social-page-surface, .social-project-task-graph-stack)');
    });

    it('page CSS defines fullscreen health and plan-picker shells', () => {
        const modals = readSource('assets/css/lux-modals.css');
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(modals).toContain('.social-page-surface');
        expect(bare).toContain('.social-project-health-page');
        expect(bare).toContain('.social-project-health-plan-page');
        expect(modals).toContain('.sph-board');
    });

    it('dialogs JS emits graph-family page surfaces', () => {
        const dialogs = readSource('assets/js/pages/social-workspace-dialogs.js');
        expect(dialogs).toContain('social-page-surface social-project-health-page');
        expect(dialogs).toContain('social-page-surface social-project-risk-page');
        expect(dialogs).toContain('social-project-health-plan-page');
        expect(dialogs).toMatch(/social-page-surface social-project-health-page[\s\S]{0,180}aria-label="Project health"/);
        expect(dialogs).toMatch(/social-page-surface social-project-risk-page[\s\S]{0,180}aria-label="Risk register"/);
    });

    it('dialogs JS uses studio panel shell and studio body on health and risk', () => {
        const dialogs = readSource('assets/js/pages/social-workspace-dialogs.js');
        expect(dialogs).toContain('lux-studio-panel');
        expect(dialogs).toContain('lux-studio-body');
        expect(dialogs).toContain('spr-risk-card lux-studio-section');
        expect(dialogs).toContain('sph-card lux-card lux-soft-chrome sph-card--readiness');
        expect(dialogs).toContain('lux-mode-btn sph-plan-tab');
        expect(dialogs).toContain('sph-verdict sph-verdict--rich sph-verdict--fs lux-studio-section lux-soft-chrome');
        expect(dialogs).toContain('sph-why lux-card lux-soft-chrome');
        expect(dialogs).toContain('sph-card-head lux-card-head');
        expect(dialogs).toContain('sph-card-head-note');
        expect(dialogs).toContain('sph-readiness-checks');
        expect(dialogs).toContain('sph-readiness-row lux-soft-chrome');
        expect(dialogs).toContain('sph-readiness-label');
        expect(dialogs).toContain('sph-readiness-value');
        expect(dialogs).toContain('sph-readiness-hint');
        expect(dialogs.match(/sph-card lux-card lux-soft-chrome/g)).toHaveLength(9);
        expect(dialogs).not.toContain('lux-glass-dialog-compact-section');
        expect(dialogs).not.toContain('lux-glass-dialog-compact-stat');
        expect(dialogs).toContain('social-page-form-actions');
        expect(dialogs).toContain('social-page-field');
        expect(dialogs).toContain('social-project-risk-page-head lux-soft-chrome');
        expect(dialogs).toContain('social-page-surface-head sph-fs-topbar lux-soft-chrome');
        expect(dialogs).not.toContain('<div class="sph-board" data-lux-transparency-exempt="1">');
        expect(dialogs).toContain('sph-hygiene-chip home-hover-chip lux-control-btn');
        expect(dialogs).toContain('sph-week-item lux-control-btn');
        expect(dialogs).toContain('lux-mode-btn sph-plan-tab');
        expect(dialogs).toContain('sph-pick-row lux-control-btn');
        expect(dialogs).toContain('sph-pick-pkg-main lux-control-btn');
        expect(dialogs).toContain('spr-rail lux-studio-section');
        expect(dialogs).toContain('spr-main lux-studio-section');
        expect(dialogs).toContain('spr-compose lux-studio-section');
        expect(dialogs).toContain('spr-task-add lux-control-btn');
        expect(dialogs).toContain('spr-group-toggle lux-control-btn');
        expect(dialogs).toContain('lux-studio-panel spt-detail-dialog');
        expect(dialogs).toContain('spt-detail-section lux-studio-section');
        expect(dialogs).toContain('spt-detail-dep-chip home-hover-chip lux-control-btn');
        const modals = readSource('assets/css/lux-modals.css');
        expect(modals).toContain('.lux-glass-dialog-compact-section');
        expect(modals).toContain('gap: 10px;');
        expect(modals).toContain('padding: 12px 14px;');
        expect(modals).toContain('border-radius: 14px;');
        expect(modals).toContain('.lux-glass-dialog-compact-stat-stack');
        expect(modals).toContain('.lux-glass-dialog-compact-stat');
        expect(readSource('assets/js/pages/social-page.js'))
            .toContain("assets/css/lux-modals.css?v=20260821-toolbarfooter2");
        expect(readSource('social.html')).toContain('lux-modals.css?v=20260821-toolbarfooter2');
        expect(dialogs).not.toContain('lux-glass-dialog-group-section sph-fs-hero-section');
        expect(dialogs).not.toContain('lux-soft-chrome lux-glass-dialog-panel-section');
    });

    it('graph render JS uses page surfaces on history and schedule-help pages', () => {
        const graph = readSource('assets/js/pages/social-workspace-graph-render.js');
        expect(graph).toContain('social-project-task-graph-history-page sptg-history-dialog');
        expect(graph).toContain('social-project-task-graph-schedule-page sptg-schedule-help-dialog');
        expect(graph).toContain('social-project-task-graph-page" data-social-page-surface="project-task-graph" data-lux-transparency-exempt="1"');
        expect(graph).toContain('social-page-surface-body sptg-history-list');
        expect(graph).toContain('social-page-surface-body sptg-schedule-help-list');
        expect(graph).toContain('sptg-history-dialog lux-studio-panel');
        expect(graph).toContain('sptg-schedule-help-dialog lux-studio-panel');
        expect(graph).toContain('data-lux-transparency-exempt="1"');
        expect(graph).not.toContain('role="dialog"');
        expect(graph).toContain('sptg-history-row lux-control-btn');
        expect(graph).toContain('sptg-schedule-help-row lux-control-btn');
        expect(graph).not.toContain('sptg-history-row lux-soft-chrome');
    });

    it('bare-lite centers task-map child popups over the map', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('body.lux-route-social:has(#social-neo-overlay-portal .social-project-task-graph-page) #page-social');
        expect(bare).toContain('visibility: hidden;');
        expect(bare).toContain('.social-project-task-graph-anchor > .social-project-task-graph-page');
        expect(bare).toContain('background: var(--lux-surface);');
        expect(bare).toContain('.social-project-task-graph-stack > .sptg-history-dialog.lux-studio-panel');
        expect(bare).toContain('.social-project-task-graph-child-slot > .sptg-schedule-help-dialog.lux-studio-panel');
        expect(bare).toContain('top: 50%;');
        expect(bare).toContain('left: 50%;');
        expect(bare).toContain('transform: translate(-50%, -50%);');
        expect(bare).toContain('height: min(680px, calc(100dvh - 48px));');
        expect(bare).toContain('width: calc(100vw - 24px);');
    });

    it('uses one shared backdrop beneath task-map child popups', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('.social-project-task-graph-child-slot > .lux-glass-dialog-backdrop--stacked-child:has(');
        expect(bare).toContain('> .sptg-history-dialog.lux-studio-panel');
        expect(bare).toContain('> .sptg-schedule-help-dialog.lux-studio-panel');
        expect(bare).toContain('> .lux-glass-dialog-backdrop--stacked-child > :is(');
        expect(bare).toContain('z-index: 10102;');
        expect(bare).toContain('background: var(--lux-warmglass-overlay-dark, rgba(0, 0, 0, 0.55));');
        expect(bare).toContain('background: var(--lux-warmglass-overlay-light, rgba(73, 48, 25, 0.20));');
        expect(bare).toContain('backdrop-filter: none;');
        expect(bare).toContain('opacity: 1;');
        expect(bare).not.toContain(')::before');
        expect(bare).toContain('z-index: 10103;');
    });

    it('routes history and schedule help through the full task-map stack', () => {
        const route = readSource('assets/js/pages/social-workspace-dialog-route.js');
        expect(route).toContain("graphDialog = { type: 'project-task-graph', projectId };");
        expect(route).toContain('lux-glass-dialog-backdrop lux-glass-dialog-backdrop--stacked-child');
        expect(route).toContain('wrapProjectTaskGraphChildBackdrop');

        const historyStart = route.indexOf("if (kind === 'project-task-graph-history')");
        const scheduleStart = route.indexOf("if (kind === 'project-task-graph-schedule-help')");
        expect(historyStart).toBeGreaterThan(-1);
        expect(scheduleStart).toBeGreaterThan(historyStart);
        expect(route.slice(historyStart, scheduleStart)).toContain('return renderGraphStackLayers(runtime, child, kind);');
        expect(route.slice(scheduleStart, scheduleStart + 320)).toContain('return renderGraphStackLayers(runtime, child, kind);');
    });

    it('lux-modals defines project-task-detail studio layout helpers', () => {
        const modals = readSource('assets/css/lux-modals.css');
        expect(modals).toContain('.lux-glass-dialog-card--project-task-detail.lux-studio-panel');
        expect(modals).toContain('.lux-glass-dialog-body--project-task-detail.lux-studio-body');
        expect(modals).toContain('.spt-detail-section.lux-studio-section');
        expect(modals).toContain('.lux-control-btn.spt-detail-dep-chip');

        const studio = readSource('assets/css/lux-studio.css');
        expect(studio).toContain('#social-neo-overlay-portal .lux-glass-dialog-card--project-task-detail');
    });

    it('lux-modals defines project-risk studio layout helpers', () => {
        const modals = readSource('assets/css/lux-modals.css');
        expect(modals).toContain('.lux-glass-dialog-body--project-risk.lux-studio-body');
        expect(modals).toContain('.spr-rail.lux-studio-section');
        expect(modals).toContain('.spr-compose.lux-studio-section');
        expect(modals).toContain('.lux-control-btn.spr-section');
        expect(modals).toContain('grid-template-columns: auto minmax(0, 1fr) auto');

        const studio = readSource('assets/css/lux-studio.css');
        expect(studio).toContain('padding: 16px 18px 12px');
        expect(studio).toContain('#social-neo-overlay-portal .lux-glass-dialog-body.lux-studio-body');
    });

    it('task UI JS uses studio shell on create, delete, and column modals', () => {
        const taskUi = readSource('assets/js/pages/social-workspace-task-ui.js');
        expect(taskUi).toContain('lux-glass-dialog-card--project-task-create lux-glass-dialog-card lux-glass-dialog-card--social-glass lux-studio-panel');
        expect(taskUi).toContain('lux-glass-dialog-card--project-task-delete lux-glass-dialog-card lux-glass-dialog-card--social-glass lux-studio-panel');
        expect(taskUi).toContain('lux-glass-dialog-card--project-column-tasks lux-glass-dialog-card lux-glass-dialog-card--social-glass lux-studio-panel');
        expect(taskUi).toContain('lux-glass-dialog-body--project-task-create lux-studio-body');
        expect(taskUi).toContain('lux-glass-dialog-body--project-task-delete lux-studio-body');
        expect(taskUi).toContain('lux-glass-dialog-body--project-column-tasks lux-studio-body');
        expect(taskUi).toContain("headClass: 'lux-studio-head'");
        expect(taskUi).toContain('<section class="lux-studio-section">');
        expect(taskUi).not.toContain('lux-glass-dialog-group-section');
    });

    it('lux-modals defines task create/delete/column studio layout helpers', () => {
        const modals = readSource('assets/css/lux-modals.css');
        expect(modals).toContain('.lux-glass-dialog-card--project-task-create.lux-studio-panel');
        expect(modals).toContain('.lux-glass-dialog-card--project-task-delete.lux-studio-panel');
        expect(modals).toContain('.lux-glass-dialog-card--project-column-tasks.lux-studio-panel');
        expect(modals).toContain('.lux-glass-dialog-body--project-task-create.lux-studio-body');
        expect(modals).toContain('.lux-glass-dialog-body--project-column-tasks.lux-studio-body');

        const studio = readSource('assets/css/lux-studio.css');
        expect(studio).toContain('#social-neo-overlay-portal .lux-glass-dialog-card--project-task-create');
        expect(studio).toContain('#social-neo-overlay-portal .lux-glass-dialog-card--project-task-delete');
        expect(studio).toContain('#social-neo-overlay-portal .lux-glass-dialog-card--project-column-tasks');
    });

    it('bare-lite defines dialog-scoped comment thread trunks', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('#social-neo-overlay-portal .lux-glass-dialog-card--comments .lux-glass-dialog-comment-thread');
        expect(bare).toContain('--sn-thread');
        expect(bare).toContain('border-bottom-left-radius: 12px');
        expect(bare).toContain('--trunk-top');
        expect(bare).toContain('[style*="--trunk-top"]::after');
        expect(bare).toContain('.social-neo-comment-reply-form');
        expect(bare).toContain('.social-neo-comment-reply-form-actions .lux-secondary-btn');
    });

    it('bare-lite strips sph-pick row paint snowflakes', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const pickStart = bare.indexOf('.sph-pick-split');
        const pickEnd = bare.indexOf('.sph-pick-check', pickStart);
        const pickBlock = bare.slice(pickStart, pickEnd > -1 ? pickEnd : pickStart + 4000);
        expect(pickBlock).not.toMatch(/\.sph-pick-split \{[\s\S]{0,220}background:/);
        expect(pickBlock).not.toMatch(/\.sph-pick-row \{[\s\S]{0,220}background:/);
    });

    it('light-mode ink targets lux-glass-dialog health cards', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('.lux-glass-dialog-card--project-health');
        expect(bare).toContain('.lux-glass-dialog-card--health-plan-pick');
        expect(bare).not.toMatch(/lux-light-mode[\s\S]{0,800}social-neo-dialog-card--project-health/);
    });
});
