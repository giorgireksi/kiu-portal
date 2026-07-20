import { describe, expect, it } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';

describe('social-hover-flicker.test.js' + ' (bare-shell era)', () => {
    it('social paint CSS files are gone; bare contracts live in social-bare-shell-era.test.js', () => {
        expect(existsSync(join(process.cwd(), 'assets/css/social-rebuild.css'))).toBe(false);
        expect(existsSync(join(process.cwd(), 'assets/css/lux-page-bare-lite.css'))).toBe(true);
    });
});
