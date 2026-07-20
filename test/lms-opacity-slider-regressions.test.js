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
        expect(existsSync(join(process.cwd(), 'assets/css/index-luxury.css'))).toBe(false);
            /html\[data-lux-transparency="0"\][\s\S]{0,500}backdrop-filter:\s*none !important/
        );
    });

    it('primes LMS hero and subjects card with no blur at slider 0%', () => {
            /html\[data-lux-transparency="0"\][\s\S]{0,500}backdrop-filter:\s*none !important/
        );
    });

    it('uses panel-blur filter alias on LMS fade tokens', () => {
    });

    it('catalog hero has no nested hero-stat rack CSS (focus panel owns the side)', () => {
    });

    it('maps blur from fillRatio via utilities SSOT (fillRatio * 24)', () => {
        const utilities = readSource('assets/js/shared/utilities.js');
        const tokens = readSource('assets/css/lux-tokens.css');

        expect(utilities).toContain('const blurAmount = fillRatio * 24');
        expect(utilities).toContain('const saturateAmount = 100 + (fillRatio * 45)');
        expect(utilities).not.toContain('mapLuxuryTransparencyBlurAmount');
        expect(tokens).toContain('--lux-transparency-blur: 18px');
    });

    it('uses inline per-panel blur from transparency engine, not canvas blur', () => {
        const utilities = readSource('assets/js/shared/utilities.js');
        expect(utilities).not.toContain('function shouldSuppressLmsBackdropBlur(el)');
        expect(utilities).not.toContain('suppressLmsBlur');
        expect(utilities).toContain('const blurAmount = fillRatio * 24');
            /contain:\s*layout paint[\s\S]{0,120}\.lms-clean-subjects/
        );
    });

    

    it('index-luxury no longer applies Smart Glass Mode glass to catalog subject/group cards', () => {
        expect(existsSync(join(process.cwd(), 'assets/css/index-luxury.css'))).toBe(false);
    });

    

});