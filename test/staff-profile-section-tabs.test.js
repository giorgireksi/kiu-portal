import { describe, expect, it } from 'vitest';
import { expectRetiredCss, readSource } from './helpers/bare-shell-css.js';

describe('staff profile section tabs', () => {
    it('retired staff-command-center skin stays gone', () => {
        expectRetiredCss('staff-command-center.css');
    });

    it('form-builder runtime keeps section chrome for studio tabs', () => {
        const builder = readSource('assets/js/pages/form-builder-runtime.js');
        expect(builder).toMatch(/section/i);
        expect(builder.length).toBeGreaterThan(1000);
    });
});
