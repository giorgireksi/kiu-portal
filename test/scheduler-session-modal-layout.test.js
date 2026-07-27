import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { expectRetiredCss } from './helpers/bare-shell-css.js';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (typeof existsSync === 'function' && !existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('scheduler session modal layout regressions', () => {
    it('aligns subject and group fields with label-row parity in the template', () => {
        const html = readSource('admin-scheduler.html');

        expect(html).toContain('id="sch-subject-field-label"');
        expect(html).toContain('class="sch-input-label-spacer"');
        expect(html).toMatch(
            /sch-input-row-subject[\s\S]*?sch-input-label-row[\s\S]*?sch-subject-field-label[\s\S]*?sch-input-label-spacer/
        );
    });

    it('uses shared droplist/controls SSOT; admin-scheduler-route.css stays retired', () => {
        const droplist = readSource('assets/css/lux-droplist.css');
        const controls = readSource('assets/css/lux-controls.css');
        const modals = readSource('assets/css/lux-modals.css');
        const html = readSource('admin-scheduler.html');

        expectRetiredCss('admin-scheduler-route.css');
        expect(html).not.toContain('admin-scheduler-route.css');
        expect(html).toContain('lux-page-bare-lite.css');
        expect(droplist).toContain('.lux-droplist-panel');
        expect(controls).toContain('.lux-picker-panel.is-closing');
        expect(html).toContain('lux-controls.css');
        expect(modals).toContain('[data-lux-transparency-exempt="1"] #schModalOverlay .sch-form-section');
        expect(modals).toContain('--lux-panel-modal-section');
    });
});
