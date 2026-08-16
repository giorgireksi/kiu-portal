import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social performance safeguards', () => {
    it('reuses the shared modal stylesheet instead of injecting a duplicate version', () => {
        const html = readSource('social.html');
        const page = readSource('assets/js/pages/social-page.js');
        expect(html).toContain('data-kiu-social-dialog-styles="assets/css/lux-modals.css?v=20260816-socialmodals1"');
        expect(page).toContain("const SOCIAL_DIALOG_STYLES_URL = 'assets/css/lux-modals.css?v=20260816-socialmodals1';");
        expect(page).toContain("link.getAttribute('href') === SOCIAL_DIALOG_STYLES_URL");
        expect(page).not.toContain('lux-modals.css?v=20260808-loadperf1');
    });

    it('cache-busts the optimized route runtimes', () => {
        const html = readSource('social.html');
        const page = readSource('assets/js/pages/social-page.js');
        expect(html).toContain('social-page.js?v=20260816-socialperf1');
        expect(page).toContain('social-community.js?v=20260816-socialperf1');
    });

    it('filters route-guardian mutations before scheduling reconciliation', () => {
        const page = readSource('assets/js/pages/social-page.js');
        expect(page).toContain('const mutationTouchesSocialHost = (mutations) => mutations.some');
        expect(page).toContain('guardianRenderInProgress || !mutationTouchesSocialHost(mutations)');
        expect(page).toContain("if (!document.getElementById(ROOT_ID)) reconcile();");
        expect(page).toContain('}, 1000);');
    });

    it('uses an indexed directory fallback for relationship cards', () => {
        const community = readSource('assets/js/pages/social-community.js');
        expect(community).toContain('const directoryById = new Map();');
        expect(community).toContain('directoryById.get(userId)');
        expect(community).not.toContain('directory.find((entry) => text(entry.id) === userId)');
    });
});
