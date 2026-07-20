import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { LUX_DROPLIST_CACHE_BUST } from './fixtures/lux-droplist-contract.js';

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

    it('normalizes modal picker triggers and input rows without touching droplist panels', () => {
        const css = readSource('assets/css/admin-scheduler-route.css');
        const html = readSource('admin-scheduler.html');

        expect(css).toMatch(
            /#schModalOverlay \.sch-input-row-subject[\s\S]*?align-items:\s*end/
        );
        expect(css).toMatch(
            /#schModalOverlay \.lux-picker-btn[\s\S]*?width:\s*100%[\s\S]*?min-width:\s*0[\s\S]*?min-height:\s*48px/
        );
        expect(css).toMatch(
            /#schModalOverlay \.sch-modal :is\([\s\S]*?input\[type="time"\][\s\S]*?min-height:\s*48px/
        );
        expect(css).toContain('#schModalOverlay .sch-form-section + .sch-form-section');
        expect(css).toContain('.lux-picker-panel.is-closing');
        expect(css).toContain('.lux-droplist-panel');
        expect(css).not.toContain('.sch-session-picker-panel');
        expect(css).toMatch(
            /#schModalOverlay \.lux-picker-field > \.lux-droplist-panel:not\(\.is-open\):not\(\.is-closing\)[\s\S]*?\{[^}]*display:\s*none/
        );
        expect(css).toMatch(
            /#schPresetManagerOverlay \.lux-picker-field > \.lux-droplist-panel:not\(\.is-open\):not\(\.is-closing\)[\s\S]*?\{[^}]*display:\s*none/
        );
        expect(html).toContain(`admin-scheduler-route.css?v=20260713-accentborder2`);
    });
});