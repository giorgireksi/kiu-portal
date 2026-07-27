import { describe, expect, it } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';
import { expectLmsRouteCssLinks, expectRetiredLmsRouteCssGone } from './helpers/lms-route-css.js';
import { readFileSync } from 'fs';

function read(p) {
    return readFileSync(join(process.cwd(), p), 'utf8');
}

describe('lms route regressions (retired skins purged)', () => {
    it('lms.html uses shared bare stack without retired route skins', () => {
        expectRetiredLmsRouteCssGone();
        expectLmsRouteCssLinks(read('lms.html'));
        expect(existsSync(join(process.cwd(), 'assets/css/lms-route.css'))).toBe(false);
    });

    it('marks layout-only shells and glass-root hosts per stage', () => {
        const html = read('lms.html');
        expect(html.match(/data-lux-layout-only="1"/g)).toHaveLength(3);
        expect(html).toMatch(/lms-route-panel-pad-16-20 home-hover-chip/);
        expect(html).toMatch(/lms-route-panel lms-route-panel-compact" data-lux-glass-root="1"/);
        expect(html).toMatch(/lms-route-workspace-chrome home-hover-chip/);
        expect(html).not.toMatch(/lms-route-workspace-chrome[\s\S]*data-lux-glass-root="1"/);
    });

    it('uses shared typography and button primitives in static shell', () => {
        const html = read('lms.html');
        expect(html).toContain('lmgroup1');
        expect(html).toContain('lux-layout-primitives.css');
        expect(html).toContain('lux-section-kicker lms-clean-kicker');
        expect(html).toContain('lux-page-title');
        expect(html).toContain('lux-card-title');
        expect(html).toContain('lux-card-copy');
        expect(html).toContain('lux-secondary-btn lms-clean-action-secondary');
    });

    it('shared layout primitives define LMS text roles', () => {
        const primitives = read('assets/css/lux-layout-primitives.css');
        expect(primitives).toContain('.lms-clean-kicker');
        expect(primitives).toContain('.lux-page-title');
        expect(primitives).toContain('.lux-card-title');
        expect(primitives).toContain('.lux-card-copy');
        expect(primitives).toContain('.lms-route-empty-title');
        expect(primitives).toContain('.lux-empty-state__title');
        expect(primitives).toContain('.lms-clean-card-title');
    });

    it('bare-lite LMS block is layout-only', () => {
        const bare = read('assets/css/lux-page-bare-lite.css');
        const lmsBlock = bare.split('/* ── LMS route')[1]?.split('/* ── Staff / students hub')[0] || '';
        expect(lmsBlock).toContain('body.lux-route-lms .lms-route-stage');
        expect(lmsBlock).not.toMatch(/backdrop-filter/);
        expect(bare).not.toContain('--lms-fade-');
    });

    it('fouc-ht demotes nested LMS surfaces inside glass host', () => {
        const fouc = read('assets/css/lux-fouc-ht.css');
        const bare = read('assets/css/lux-page-bare-lite.css');
        expect(fouc).toContain('.lms-clean-subjects--merged');
        expect(fouc).toContain('.lux-lms-subject-card');
        expect(fouc).toMatch(/body\.lux-route-lms \.page-hero :is\(/);
        expect(fouc).toContain('.lms-pro-surface');
        expect(fouc).toContain('#page-lms-inner [data-lux-glass-root="1"]');
        expect(fouc).toContain('.gb-modern-hero');
        expect(bare).toContain('body.lux-route-lms .lms-session-planner-page');
        expect(bare).toContain('body.lux-route-lms .lms-session-hero');
        expect(bare).toContain('--lms-workspace-panel-chrome');
        expect(bare).toContain('body.lux-route-lms .gb-modern-stack');
        expect(bare).toContain('body.lux-route-lms .lms-interaction-messenger');
        expect(bare).toContain('body.lux-route-lms .lms-interaction-direct');
        expect(bare).toContain('--lms-interaction-panel-chrome');
        expect(bare).toContain('body.lux-route-lms .lms-live-shell');
        expect(bare).toContain('body.lux-route-lms .lms-live-student-wait');
        expect(bare).toContain('body.lux-route-lms #lms-content-area.lms-tab-live-quiz');
        expect(bare).toContain('body.lux-route-lms .lms-calls-page');
        expect(bare).toContain('body.lux-route-lms .lms-route-pill');
        expect(bare).toContain('body.lux-route-lms #lms-content-area.lms-tab-calls');
        expect(bare).toContain('body.lux-route-lms .lms-member-stack');
        expect(bare).toContain('body.lux-route-lms #lms-content-area.lms-tab-members');
        expect(bare).toContain('body.lux-route-lms #lms-content-area.lms-tab-workspace');
        expect(bare).toContain('body.lux-route-lms .lms-assignment-banner');
        expect(bare).toContain('body.lux-route-lms .lms-week-accordion-panel');
        expect(bare).toContain('body.lux-route-lms .lms-assignment-card');
        expect(bare).toContain('body.lux-route-lms #lms-content-area.lms-tab-concepts');
        expect(bare).toContain('body.lux-route-lms .lms-concept-form-toggle');
        expect(bare).toContain('body.lux-route-lms .lms-concept-card');
        expect(bare).toContain('body.lux-route-lms .lms-route-tab:is(.is-active, [aria-pressed="true"])');
        expect(bare).toContain('body.lux-route-lms #page-lms-groups [data-lux-glass-root="1"]');
        expect(bare).toContain('body.lux-route-lms .lms-bulk-panel');
        expect(bare).toContain('body.lux-route-lms .lms-bulk-action-grid');
        expect(bare).toContain('body.lux-route-lms .lux-lms-group-card');
        expect(bare).toContain('body.lux-route-lms .lms-group-live-strip.is-live');
    });

    it('clears LMS tab content before each render to avoid stacked panels', () => {
        const shell = read('assets/js/pages/lms-classroom-tabs-shell-runtime.js');
        expect(shell).toMatch(/function prepareLmsContentAreaForTab[\s\S]*contentArea\.innerHTML = ''/);
        expect(shell).toContain("return base[ctx.tab] || null");
        expect(shell).toContain('workspace: {');
    });

    it('dynamic subject deck uses shared text primitives', () => {
        const js = read('assets/js/pages/lms-route-boot.js');
        expect(js).toContain('lux-section-kicker lms-clean-card-kicker');
        expect(js).toContain('lux-subject-row__title lms-clean-card-title');
        expect(js).toContain('lux-lms-subject-card home-hover-chip');
        expect(js).toContain('lux-empty-state__title lms-route-empty-title');
        expect(js).toContain('lux-empty-state__copy lms-route-empty-copy');
    });
});
