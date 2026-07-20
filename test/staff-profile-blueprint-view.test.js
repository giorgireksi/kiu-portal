import { describe, expect, it } from 'vitest';
import { expectRetiredCss, readSource } from './helpers/bare-shell-css.js';

describe('staff profile blueprint view', () => {
    it('retired staff-command-center skin stays gone', () => {
        expectRetiredCss('staff-command-center.css');
    });

    it('staff command center still references blueprint surface', () => {
        const host = readSource('assets/js/pages/staff-command-center.js');
        expect(host).toMatch(/blueprint/i);
        const html = readSource('staff.html');
        expect(html).toContain('staff-command-center.js');
    });
});
