import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('protected launch route regressions', () => {
    it('stays standalone and keeps reduced-performance launch guards in the local shell', () => {
        const html = readSource('protected-launch.html');

        expect(html).toContain('assets/js/app/api.js?v=20260427-qa1');
        expect(html).not.toContain('assets/js/app/app.js');
        expect(html).not.toContain('assets/js/app/auth.js');
        expect(html).not.toContain('assets/js/app/state.js');
        expect(html).not.toContain('assets/js/shared/utilities.js');
        expect(html).not.toContain('assets/js/features/navigation.js');
        expect(html).not.toContain('assets/js/features/index-luxury.js');
        expect(html).not.toContain('theme-primer.js');
        expect(html).not.toContain('lux-unified-shell');

        expect(html).toContain('document.documentElement.dataset.launchPerformance = \'reduced\'');
        expect(html).toContain('navigator.hardwareConcurrency');
        expect(html).toContain('navigator.deviceMemory');
        expect(html).toContain('@media (prefers-reduced-motion: reduce)');
        expect(html).toContain('html[data-launch-performance="reduced"]');
        expect(html).toContain('--launch-body-bg:');
        expect(html).toContain('--launch-shell-bg:');
        expect(html).toContain('--launch-head-bg:');
        expect(html).toContain('--launch-progress-animation:');
        expect(html).toContain('--launch-primary-bg:');
        expect(html).toContain('--launch-danger-bg:');
        expect(html).toContain('animation: var(--launch-progress-animation);');
    });
});
