import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social overlay dialog dedupe', () => {
    it('normalizes dialog region and removes dead inline dialog render path', () => {
        const source = readSource('assets/js/pages/social-page.js');

        expect(source).toContain('function normalizeSocialOverlayDialogRegion()');
        expect(source).toMatch(/function ensureSocialOverlayPortal\(\)[\s\S]*?normalizeSocialOverlayDialogRegion\(\)/);
        expect(source).toMatch(/function setSocialRegionMarkup\(node, markup\)[\s\S]*?normalizeSocialOverlayDialogRegion\(\)/);
        expect(source).toMatch(/canonical\.querySelectorAll\(':scope > \.social-neo-dialog-backdrop'\)/);
        expect(source).not.toContain('function renderPageBody()');
        expect(source).not.toMatch(/\$\{renderDialog\(\)\}/);
    });
});
