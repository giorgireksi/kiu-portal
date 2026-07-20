import { describe, expect, it } from 'vitest';
import { expectRetiredCss, readSource } from './helpers/bare-shell-css.js';

describe('staff form field remove', () => {
    it('retired staff-command-center skin stays gone', () => {
        expectRetiredCss('staff-command-center.css');
    });

    it('blueprint runtime owns removeStaffFormField on the KiuFormBlueprint API', () => {
        const blueprint = readSource('assets/js/pages/form-blueprint-runtime.js');
        expect(blueprint).toContain('function removeFormField');
        expect(blueprint).toContain('removeStaffFormField: removeFormField');
        expect(blueprint).toContain('window.KiuFormBlueprint');
    });
});
