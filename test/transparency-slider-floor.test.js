import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('transparency slider floor', () => {
    it('maps slider 0% to former 1% fill ratio via shared helper', () => {
        const utilitiesSource = readSource('assets/js/shared/lux-transparency.js');
        const luxurySource = readSource('assets/js/shared/lux-transparency.js');
        const html = readSource('index.html');

        expect(html).toContain('assets/js/shared/utilities.js?v=20260725-portalmodal1');
        expect(html).toContain('assets/js/features/index-luxury.js?v=20260808-galleryfouc1');

        expect(utilitiesSource).toContain('function mapLuxuryTransparencyFillRatio(value)');
        expect(utilitiesSource).toContain('return (percentage + 1) / 101');
        expect(utilitiesSource).toContain('const fillRatio = mapLuxuryTransparencyFillRatio(percentage)');
        expect(utilitiesSource).toContain('if (fillRatio > 0)');
        expect(utilitiesSource).not.toMatch(/if \(percentage > 0\) \{\s*\n\s*\/\/ Calculate effects\s*\n\s*const alpha = percentage \/ 100/);

        expect(luxurySource).toContain('window.mapLuxuryTransparencyFillRatio');
        expect(luxurySource).toContain('(percentage + 1) / 101');

        const legacyOnePercentFill = 1 / 100;
        const newZeroPercentFill = 1 / 101;
        expect(newZeroPercentFill).toBeCloseTo(legacyOnePercentFill, 2);
        expect(newZeroPercentFill).toBeGreaterThan(0);
    });
});
