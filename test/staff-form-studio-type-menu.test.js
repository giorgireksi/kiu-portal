import { describe, expect, it } from 'vitest';
import { expectRetiredCss, readSource } from './helpers/bare-shell-css.js';

describe('staff form studio type menu', () => {
    it('retired staff-command-center skin stays gone', () => {
        expectRetiredCss('staff-command-center.css');
    });

    it('form-builder-actions runtime owns studio type-menu chrome', () => {
        const actions = readSource('assets/js/pages/form-builder-actions-runtime.js');
        expect(actions).toMatch(/type-menu|studio-type/i);
        expect(actions.length).toBeGreaterThan(200);
    });
});
