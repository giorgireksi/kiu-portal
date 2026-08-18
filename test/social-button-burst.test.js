import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), 'utf8');

describe('Social button click burst', () => {
    it('loads only the Social burst sheet and not the removed motion pilot', () => {
        const html = read('social.html');
        expect(html).toContain('assets/css/social-button-burst.css?v=20260819-socialburst2');
        expect(html).toContain('assets/js/features/luxury-shell-chrome.js?v=20260819-socialburst2');
        expect(html).not.toContain('social-button-motion.css');
        expect(read('index.html')).not.toContain('social-button-burst.css');
    });

    it('routes Social button clicks through the existing studio burst generator', () => {
        const css = read('assets/css/social-button-burst.css');
        const chrome = read('assets/js/features/luxury-shell-chrome.js');
        expect(css).toContain('#social-button-burst-layer > .lux-chip-burst-particle');
        expect(css).toContain('animation: lux-chip-particle-out');
        expect(css).toContain('lux-chip-particle-spark');
        expect(css).toContain('prefers-reduced-motion: reduce');
        expect(chrome).toContain('#social-neo-overlay-portal, #public-social-root');
        expect(chrome).toContain('const socialChipSelector');
        expect(chrome).toContain('ensureSocialButtonBurstLayer');
        expect(chrome).toContain('const burstRect = burstTarget.getBoundingClientRect()');
        expect(chrome).toContain('.social-project-task-graph-link-handle');
    });
});
