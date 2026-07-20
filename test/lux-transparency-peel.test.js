import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

describe('lux-transparency peel', () => {
    it('keeps the engine out of utilities.js', () => {
        const utilities = readFileSync(join(process.cwd(), 'assets/js/shared/utilities.js'), 'utf8');
        const transparency = readFileSync(join(process.cwd(), 'assets/js/shared/lux-transparency.js'), 'utf8');
        expect(utilities).not.toMatch(/function updateTransparency\s*\(/);
        expect(utilities).not.toMatch(/const LUX_MODERN_TRANSPARENCY_SURFACE_SELECTORS/);
        expect(utilities).toContain('lux-transparency.js');
        expect(transparency).toMatch(/function updateTransparency\s*\(/);
        expect(transparency).toContain('window.updateTransparency = updateTransparency');
        expect(transparency).toContain('window.scheduleLuxuryTransparencyBootRefresh');
    });

    it('is wired after utilities.js on every HTML that loads utilities', () => {
        const root = process.cwd();
        const htmlFiles = readdirSync(root).filter((name) => name.endsWith('.html'));
        const loadedUtilities = [];
        for (const name of htmlFiles) {
            const text = readFileSync(join(root, name), 'utf8');
            if (!text.includes('assets/js/shared/utilities.js')) continue;
            loadedUtilities.push(name);
            expect(text).toContain('assets/js/shared/lux-transparency.js');
            expect(text.indexOf('utilities.js')).toBeLessThan(text.indexOf('lux-transparency.js'));
        }
        expect(loadedUtilities.length).toBeGreaterThanOrEqual(20);
    });
});
