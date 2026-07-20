import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('luxury-atmosphere-runtime peel', () => {
    it('owns theme/background/particle/fog helpers outside index-luxury', () => {
        const lux = readSource('assets/js/features/index-luxury.js');
        const atm = readSource('assets/js/features/luxury-atmosphere-runtime.js');
        expect(lux).toContain('__kiuCreateLuxuryAtmosphereApi');
        expect(lux).not.toMatch(/^\s*function getFogSettings\b/m);
        expect(lux).not.toMatch(/^\s*function setParticleMotion\b/m);
        expect(lux).not.toMatch(/^\s*function applyThemeMode\b/m);
        expect(atm).toContain('function getFogSettings');
        expect(atm).toContain('function setParticleMotion');
        expect(atm).toContain('function applyThemeMode');
        expect(atm).toContain('__KIU_LUXURY_ATMOSPHERE_LOADED');
    });

    it('loads before index-luxury on index.html', () => {
        const html = readSource('index.html');
        expect(html).toContain('luxury-atmosphere-runtime.js');
        expect(html.indexOf('luxury-atmosphere-runtime.js')).toBeLessThan(html.indexOf('index-luxury.js'));
    });
});
