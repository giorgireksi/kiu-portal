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
        expect(html).toMatch(/lms-route-panel-pad-16-20[\s\S]*data-lux-glass-root="1"/);
        expect(html).toMatch(/lms-route-workspace-chrome[\s\S]*data-lux-glass-root="1"/);
    });

    it('uses shared typography and button primitives in static shell', () => {
        const html = read('lms.html');
        expect(html).toContain('lmsshare2');
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
        expect(fouc).toContain('.lms-clean-subjects--merged');
        expect(fouc).toContain('.lux-lms-subject-card');
        expect(fouc).toMatch(/body\.lux-route-lms \.page-hero :is\(/);
    });

    it('dynamic subject deck uses shared text primitives', () => {
        const js = read('assets/js/pages/lms-route-boot.js');
        expect(js).toContain('lux-section-kicker lms-clean-card-kicker');
        expect(js).toContain('lux-subject-row__title lms-clean-card-title');
        expect(js).toContain('lux-empty-state__title lms-route-empty-title');
        expect(js).toContain('lux-empty-state__copy lms-route-empty-copy');
    });
});
