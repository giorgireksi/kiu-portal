import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social visual shell sync regressions', () => {
    it('runs full transparency sync on social boot and shell reveal', () => {
        const page = readSource('assets/js/pages/social-page.js');
        const feed = readSource('assets/js/pages/social-page-feed-runtime.js');
        const shell = readSource('assets/js/pages/social-page-shell-runtime.js');

        expect(feed).toContain('function syncSocialVisualShell()');
        expect(feed).toContain("localStorage.getItem('kiuLuxurySurfaceTransparency')");
        expect(feed).toContain('window.updateTransparency(saved, { persist: false })');
        expect(shell).toMatch(/if \(!socialVisualShellSynced\)[\s\S]*syncSocialVisualShell\(\)/);
        expect(page).toMatch(/reason === 'boot' \|\| reason === 'social-bootstrap'[\s\S]*syncSocialVisualShell\(\)/);
    });

    it('registers merged hero shells in transparency observer selectors', () => {
        const utilities = readSource('assets/js/shared/utilities.js');

        expect(utilities).toContain("'.social-neo-community-hero'");
        expect(utilities).toContain("'.social-neo-workspace-hero'");
        expect(utilities).toContain("'.social-neo-feed-header-card'");
    });
});
