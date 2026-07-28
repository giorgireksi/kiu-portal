import { describe, expect, it } from 'vitest';
import { expectLmsRouteCssLinks } from './helpers/lms-route-css.js';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS hero + subjects shared CSS parity', () => {
    it('keeps focus panel structure in lux-focus-panel.css', () => {
        const focusCss = readSource('assets/css/lux-focus-panel.css');
        expect(focusCss).toContain('.lms-hero-focus.lux-hero-side');
        expect(focusCss).toContain('.lms-hero-focus.lux-hero-side::before');
        expect(focusCss).toContain('.lms-hero-focus-head');
    });

    it('uses layout-only LMS block in bare-lite (no retired fade tokens)', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const lmsBlock = bare.split('/* ── LMS route')[1]?.split('/* ── Staff / students hub')[0] || '';
        const lmsBlockWithoutWhiteboardHud = lmsBlock.split('/* Whiteboard tab (retired lms-whiteboard-catalog.css')[0]
            + (lmsBlock.split('/* Interaction messenger (retired lms-interaction.css')[1] || '');
        expect(lmsBlock).toContain('body.lux-route-lms .lms-clean-subject-grid');
        expect(lmsBlock).toContain('body.lux-route-lms .lms-student-semester-bar');
        expect(lmsBlockWithoutWhiteboardHud).not.toMatch(/backdrop-filter/);
        expect(bare).not.toContain('--lms-fade-');
        expect(bare).not.toContain('soft-panel subjects-stage');
        expect(bare).not.toContain('EXPERIMENT soft-panel v2');
    });

    it('matte paints subjects stage inside page-hero and glass hosts', () => {
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(fouc).toMatch(
            /body\.lux-route-lms \.page-hero :is\([\s\S]*\.lms-clean-subjects[\s\S]*var\(--lux-soft-chrome-surface\)/
        );
        expect(fouc).toContain('.lms-clean-subjects--merged');
        expect(fouc).toContain('.lux-lms-subject-card');
        expect(fouc).toContain('.lms-student-semester-bar');
        expect(fouc).toContain('.lms-student-semester-option');
        expect(fouc).toContain('#lms-lane-chip');
        expect(fouc).toMatch(
            /\.lms-route-empty[\s\S]{0,600}backdrop-filter:\s*none/
        );
    });

    it('cache-busts LMS shared stack and hero focus markup', () => {
        const html = readSource('lms.html');
        expectLmsRouteCssLinks(html);
        expect(html).toContain('lmsscss10');
        expect(html).toContain('lmsscss3');
        expect(html).toMatch(/class="lms-hero-focus lux-hero-side home-hover-chip/);
        expect(html).toContain('lux-section-kicker lms-clean-kicker');
        expect(html).toContain('lux-page-title');
        expect(html).toContain('lux-page-copy');
        expect(html).toContain('lux-card-title');
        expect(html).toContain('lux-card-copy');
        expect(html).toMatch(/lux-focus-panel\.css/);
    });
});
