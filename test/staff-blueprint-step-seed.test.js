import { describe, expect, it } from 'vitest';
import { expectRetiredCss, readSource } from './helpers/bare-shell-css.js';

describe('staff blueprint step seed', () => {
    it('retired staff-command-center skin stays gone', () => {
        expectRetiredCss('staff-command-center.css');
    });

    it('form-builder runtime keeps blueprint/seed studio surface', () => {
        const builder = readSource('assets/js/pages/form-builder-runtime.js');
        expect(builder).toMatch(/seed/i);
        expect(builder).toMatch(/blueprint/i);
        expect(builder.length).toBeGreaterThan(1000);
    });
});
