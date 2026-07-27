import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('lux-tab-control.test', () => {
    it('defines shared tab strip primitives in lux-controls.css', () => {
        const controls = readSource('assets/css/lux-controls.css');

        expect(controls).toContain('.lux-tab-strip');
        expect(controls).toContain('.lux-tab-strip--segmented');
        expect(controls).toContain('.lux-tab-btn');
        expect(controls).toContain('.lux-tab-btn--rich');
        expect(controls).toContain('.lux-tab-btn--icon');
        expect(controls).toMatch(/\.lux-tab-btn:is\(\.is-active[\s\S]*?var\(--lux-accent\)/);
        expect(controls).toContain('.lux-tab-btn__copy');
        expect(controls).toContain(':is(.lux-tab-badge, .social-neo-tab-badge)');
    });

    it('pages hero tabs use shared lux-tab markup', () => {
        const pages = readSource('assets/js/pages/social-pages.js');

        expect(pages).not.toContain('lux-tab-btn--rich');
        expect(pages).toContain('lux-secondary-btn social-neo-pages-hero-tab');
        expect(pages).toContain('social-neo-pages-hero-grid');
        expect(pages).toContain('social-neo-pages-hero-tab-icon');
        expect(pages).toContain('social-neo-pages-hero-tab-copy');
    });

    it('excludes lux-tab-btn from social dialect chip paint', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');

        expect(bare).toContain('button.social-neo-tab:not(.lux-tab-btn)');
        expect(bare).toContain('.social-neo-pages-hero-grid');
    });
});
