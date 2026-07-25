import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social overlay dialog dedupe', () => {
    it('normalizes dialog region and removes dead inline dialog render path', () => {
        const page = readSource('assets/js/pages/social-page.js');
        const overlay = readSource('assets/js/pages/social-overlay-chrome.js');

        expect(overlay).toContain('function normalizeSocialOverlayDialogRegion()');
        expect(overlay).toMatch(/function ensureSocialOverlayPortal\(\)[\s\S]*?normalizeSocialOverlayDialogRegion\(\)/);
        expect(page).toMatch(/function setSocialRegionMarkup\(node, markup\)[\s\S]*?normalizeSocialOverlayDialogRegion\(\)/);
        expect(overlay).toMatch(/canonical\.querySelectorAll\(':scope > \.lux-glass-dialog-backdrop'\)/);
        expect(page).toContain('createKiuSocialOverlayChromeApi');
        expect(page).not.toContain('function renderPageBody()');
        expect(page).not.toMatch(/\$\{renderDialog\(\)\}/);
    });
});
