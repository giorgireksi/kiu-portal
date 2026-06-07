import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('protected launch route regressions', () => {
    it('stays standalone and keeps reduced-performance launch guards in the local shell', () => {
        const html = readSource('protected-launch.html');
        const css = readSource('assets/css/protected-launch-route.css');

        expect(html).toContain('assets/js/app/api.js');
        expect(html).toContain('assets/css/lux-tokens.css');
        expect(html).toContain('assets/css/lux-surfaces.css');
        expect(html).toContain('assets/css/lux-controls.css');
        expect(html).toContain('assets/css/lux-layout-primitives.css');
        expect(html).toContain('assets/css/protected-launch-route.css');
        expect(html).not.toContain('<style>');
        expect(html).not.toContain('assets/js/app/app.js');
        expect(html).not.toContain('assets/js/app/auth.js');
        expect(html).not.toContain('assets/js/app/state.js');
        expect(html).not.toContain('assets/js/shared/utilities.js');
        expect(html).not.toContain('assets/js/features/navigation.js');
        expect(html).not.toContain('assets/js/features/index-luxury.js');
        expect(html).not.toContain('theme-primer.js');
        expect(html).not.toContain('lux-unified-shell');
        expect(html).toContain('class="protected-launch-page palette-obsidian-amber"');

        expect(html).toContain('document.documentElement.dataset.launchPerformance = \'reduced\'');
        expect(html).toContain('navigator.hardwareConcurrency');
        expect(html).toContain('navigator.deviceMemory');
        expect(css).toContain('@media (prefers-reduced-motion: reduce)');
        expect(css).toContain('html[data-launch-performance="reduced"]');
        expect(css).toContain('--launch-body-bg:');
        expect(css).toContain('--launch-shell-bg:');
        expect(css).toContain('--launch-head-bg:');
        expect(css).toContain('--launch-progress-animation:');
        expect(css).toContain('--launch-primary-bg:');
        expect(css).toContain('--launch-danger-bg:');
        expect(css).toContain('animation: var(--launch-progress-animation);');
        expect(html).toContain('retryButtonEl.hidden = retry !== true;');
        expect(html).toContain('installButtonEl.hidden = !(installUrl && installUrl !== \'#\');');
    });
});
