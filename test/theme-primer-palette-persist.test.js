import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('theme primer palette/static persist', () => {
    it('shares visual defaults version with index-luxury and always reads stored palette/static fill', () => {
        const primer = readSource('assets/js/theme-primer.js');
        const luxury = readSource('assets/js/features/index-luxury.js');

        expect(primer).toContain("LUXURY_VISUAL_DEFAULTS_VERSION = '20260815-opacity70-v2'");
        expect(luxury).toContain("FORCED_LUXURY_VISUAL_DEFAULTS_VERSION = '20260815-opacity70-v2'");
        expect(primer).toContain("localStorage.getItem('kiuLuxuryPalette')");
        expect(primer).toContain("localStorage.getItem('kiuLuxuryStaticBackgroundFill')");
        expect(primer).toContain('// 3. Palette — always prefer localStorage');
        expect(primer).not.toMatch(/if \(hasCurrentVisualDefaults\) \{\s*try \{ savedPalette = localStorage/);
    });
});
