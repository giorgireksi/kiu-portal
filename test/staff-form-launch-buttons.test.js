import { describe, expect, it } from 'vitest';
import { expectRetiredCss, readSource } from './helpers/bare-shell-css.js';

describe('staff form launch buttons', () => {
    it('retired staff-command-center skin stays gone', () => {
        expectRetiredCss('staff-command-center.css');
    });

    it('staff.html loads command-center + form builder stack', () => {
        const html = readSource('staff.html');
        expect(html).toContain('staff-command-center.js');
        expect(html).toMatch(/form-builder|form-blueprint/);
        expect(html).not.toContain('staff-command-center.css');
    });
});
