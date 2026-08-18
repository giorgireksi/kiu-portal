import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), 'utf8');

describe('Social button motion trial', () => {
    it('loads a route-scoped motion sheet for Social', () => {
        const html = read('social.html');
        expect(html).toContain('assets/css/social-button-motion.css?v=20260819-socialmotion8');
        expect(html).toContain('assets/js/features/luxury-shell-chrome.js?v=20260819-socialburst1');
        expect(read('index.html')).not.toContain('social-button-motion.css');
    });

    it('covers dynamic Social button surfaces without touching special spatial controls', () => {
        const css = read('assets/css/social-button-motion.css');
        expect(css).toContain('body.lux-route-social');
        expect(css).toContain('#public-social-root button');
        expect(css).toContain('.lux-primary-btn');
        expect(css).toContain('.lux-secondary-btn');
        expect(read('assets/js/pages/social-feed.js')).toContain('<span class="lux-primary-btn social-neo-composer-cta-btn">');
        expect(css).toContain('#social-neo-overlay-portal button');
        expect(css).toContain('#lux-studio-backdrop button');
        expect(css).toContain('#lux-bg-mode-params-backdrop button');
        expect(css).toContain('#lux-bg-gallery-backdrop button');
        expect(css).toContain('#mobile-action-sheet button');
        expect(css).toContain('translate3d(0, -3px, 0)');
        expect(css).toContain('--lux-btn-frame-shadow-hover');
        expect(css).toContain('--lux-studio-chip-shadow-press');
        expect(css).toContain('scale(0.985)');
        expect(css).toContain('focus-visible');
        expect(css).toContain('!important');
        expect(css).toContain('transition-duration: 60ms');
        expect(css).toContain('prefers-reduced-motion: reduce');
        expect(css).toContain('.lux-scroll-rail__btn');
        expect(css).toContain('.social-project-task-graph-link-handle');
        expect(css).toContain('#public-social-root > .lux-chip-burst-particle');
        expect(read('assets/js/features/luxury-shell-chrome.js')).toContain('#public-social-root');
        expect(read('assets/js/features/luxury-shell-chrome.js')).toContain('const socialChipSelector');
        expect(css).not.toMatch(/^[^{]*\bbutton\b[^.{]*\{/m);
    });
});
