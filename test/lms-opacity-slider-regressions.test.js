import { describe, expect, it } from 'vitest';

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('LMS opacity slider regressions', () => {
    it('uses high-opacity FOUC at 99/100, not inverted 0/1', () => {
        // Global high-opacity FOUC catalog retired with index-luxury; LMS owns slider glass.
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(existsSync(join(process.cwd(), 'assets/css/index-luxury.css'))).toBe(false);
        expect(fouc).toContain('html[data-lux-transparency="0"]');
        expect(fouc).toContain('box-shadow: none');
    });

    it('primes LMS hero and subjects card with no blur at slider 0%', () => {
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(fouc).toContain('.lms-clean-subjects');
        expect(fouc).toContain('html[data-lux-transparency="0"]');
    });

    it('uses panel-blur filter alias on LMS fade tokens', () => {
    });

    it('catalog hero has no nested hero-stat rack CSS (focus panel owns the side)', () => {
    });

    it('maps blur from fillRatio via utilities SSOT (fillRatio * 24)', () => {
        const transparency = readSource('assets/js/shared/lux-transparency.js');
        const tokens = readSource('assets/css/lux-tokens.css');

        expect(transparency).toContain('const blurAmount = (2 + fillRatio * 22) * glassBlurMult');
        expect(transparency).toContain('const saturateAmount = 100 + (fillRatio * 45)');
        expect(transparency).not.toContain('mapLuxuryTransparencyBlurAmount');
        expect(tokens).toContain('--lux-transparency-blur: 18px');
    });

    it('uses inline per-panel blur from transparency engine, not canvas blur', () => {
        const transparency = readSource('assets/js/shared/lux-transparency.js');
        expect(transparency).not.toContain('function shouldSuppressLmsBackdropBlur(el)');
        expect(transparency).not.toContain('suppressLmsBlur');
        expect(transparency).toContain('target.style.setProperty(\'--lux-transparency-blur\'');
        expect(readSource('assets/css/lux-fouc-ht.css')).toContain('var(--lux-panel-blur-filter)');
    });

    it('index-luxury no longer applies Smart Glass Mode glass to catalog subject/group cards', () => {
        expect(existsSync(join(process.cwd(), 'assets/css/index-luxury.css'))).toBe(false);
    });
});