import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('luxury-palette-runtime peel', () => {
    it('owns color/palette helpers outside index-luxury', () => {
        const lux = readSource('assets/js/features/index-luxury.js');
        const pal = readSource('assets/js/features/luxury-palette-runtime.js');
        expect(lux).toContain('__kiuCreateLuxuryPaletteApi');
        expect(lux).not.toMatch(/^\s*function applyResolvedPalette\b/m);
        expect(lux).not.toMatch(/^\s*function hexToRgbTriplet\b/m);
        expect(lux).not.toMatch(/^\s*function getPaletteByKey\b/m);
        expect(pal).toContain('function applyResolvedPalette');
        expect(pal).toContain('classList.remove(`palette-${entry.key}`)');
        expect(pal).toContain("classList.add(`palette-${resolvedPaletteKey}`)");
        expect(pal).toContain("root.style.setProperty('--lux-shell-background'");
        expect(pal).toContain('function hexToRgbTriplet');
        expect(pal).toContain('function getPaletteByKey');
        expect(pal).toContain('__KIU_LUXURY_PALETTE_LOADED');
    });

    it('loads before atmosphere and index-luxury on index.html', () => {
        const html = readSource('index.html');
        expect(html).toContain('luxury-palette-runtime.js');
        expect(html.indexOf('luxury-palette-runtime.js')).toBeLessThan(html.indexOf('luxury-atmosphere-runtime.js'));
        expect(html.indexOf('luxury-atmosphere-runtime.js')).toBeLessThan(html.indexOf('index-luxury.js'));
    });
});
