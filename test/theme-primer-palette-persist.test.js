import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('theme primer palette/static persist', () => {
    it('shares visual defaults version and avoids stale palette flashes during migration', () => {
        const primer = readSource('assets/js/theme-primer.js');
        const luxury = readSource('assets/js/features/index-luxury.js');

        expect(primer).toContain("LUXURY_VISUAL_DEFAULTS_VERSION = '20260816-opacity70-v3'");
        expect(luxury).toContain("FORCED_LUXURY_VISUAL_DEFAULTS_VERSION = '20260816-opacity70-v3'");
        expect(primer).toContain("localStorage.getItem('kiuLuxuryPalette')");
        expect(primer).toContain("localStorage.getItem('kiuLuxuryStaticBackgroundFill')");
        expect(primer).toContain('// 3. Palette — only reuse persisted/scoped palette values after the');
        expect(primer).toContain('var savedPalette = hasCurrentVisualDefaults');
        expect(primer).toContain('if (hasCurrentVisualDefaults) {');
    });
});
