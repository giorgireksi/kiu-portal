import { describe, expect, it } from 'vitest';
import { expectRetiredCss, readSource, readWarmglassCss } from './helpers/bare-shell-css.js';

describe('staff form modal polish', () => {
    it('retired staff-command-center skin stays gone', () => {
        expectRetiredCss('staff-command-center.css');
    });

    it('staff hub modals use shared warmglass / lux-modals', () => {
        const html = readSource('staff.html');
        const css = readWarmglassCss();
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(html).toContain('lux-modals.css');
        expect(html).toContain('lux-glass-dialog.js');
        expect(css).toContain('.lux-glass-dialog-card--hub-form');
        expect(bare).toContain('#staff-command-modal-root .lux-glass-dialog-card--hub-form');
    });
});
