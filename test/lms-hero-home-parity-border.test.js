import { describe, expect, it } from 'vitest';
import { expectLmsRouteCssLinks } from './helpers/lms-route-css.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS soft-panel subjects-stage (matte + borders)', () => {
    it('does not rewrite focus panel block', () => {
        const focusCss = readSource('assets/css/lux-focus-panel.css');
        // Route owns fill only; structure lives in shared lux-focus-panel.css
        expect(css).toContain('LMS focus panel');
        expect(css).toContain('.lms-hero-focus.lux-hero-side');
        expect(css).toContain('structure in lux-focus-panel.css');
        expect(focusCss).toContain('.lms-hero-focus.lux-hero-side::before');
        expect(css.indexOf('soft-panel subjects-stage')).toBeGreaterThan(
            css.indexOf('LMS focus panel')
        );
    });

    it('restores borders and matte on stage / empty / cards', () => {
        const stage = css.slice(css.indexOf('soft-panel subjects-stage'));
        expect(stage).toContain('var(--lms-glass-fill-soft)');
        expect(stage).toMatch(
            /\.lms-route-empty[\s\S]{0,500}border:\s*1px solid color-mix/
        );
        expect(stage).not.toMatch(
            /soft-panel subjects-stage[\s\S]{0,800}\.lms-route-empty[\s\S]{0,200}background:\s*transparent/
        );
        expect(stage).toMatch(
            /\.lux-lms-subject-card[\s\S]{0,400}border:\s*1px solid color-mix/
        );
        expect(stage).toContain('lms-student-semester-bar');
        expect(css).not.toContain('EXPERIMENT soft-panel v2');
        expect(css).not.toContain('EXPERIMENT soft-panel v3');
    });

    it('documents soft-panel subjects-stage as sole semester/subjects fill owner', () => {
        const stage = css.slice(css.indexOf('soft-panel subjects-stage'));
        expect(stage).toContain('OWNER (catalog semester + subjects matte)');
        expect(stage).toContain('#lms-student-semester-bar');
        // Cascade-dead soft-band / tile-fill rewrites before EOF must stay deleted
        expect(css).not.toContain('Semester bar — soft band');
        expect(css).not.toContain('Subject tiles — softer than hero shell, no nested blur');
        expect(css).not.toContain('Empty well — calm, not a second glass monument');
    });

    it('cache-busts LMS route CSS', () => {
        const html = readSource('lms.html');
        expectLmsRouteCssLinks(html);
        expect(html).toMatch(/class="lms-hero-focus lux-hero-side[^"]*"/);
        expect(html).toContain('lms-hero-focus');
        expect(html).toContain('lux-hero-side');
        expect(html).toMatch(/lux-focus-panel\.css/);
    });
});
