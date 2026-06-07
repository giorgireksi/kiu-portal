import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('lux picker scroll regressions', () => {
    it('ships global picker panel scroll tokens and styles in lux-controls', () => {
        const controls = readSource('assets/css/lux-controls.css');

        expect(controls).toContain('--lux-picker-visible-options');
        expect(controls).toContain('--lux-picker-option-height');
        expect(controls).toContain('--lux-picker-panel-max-height');
        expect(controls).toContain('max-height: var(--lux-picker-panel-max-height)');
        expect(controls).toContain('overflow-y: auto');
        expect(controls).toContain('overscroll-behavior: contain');
        expect(controls).toContain('.lux-picker-panel::-webkit-scrollbar-thumb');
    });

    it('tags enhanced and shell picker panels with scroll class', () => {
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');

        expect(shellChrome).toContain('lux-picker-panel lux-picker-panel-scroll');
        expect(shellChrome).toContain('lux-picker-panel lux-universal-picker-panel lux-picker-panel-scroll');
        expect(shellChrome).toContain('function isPickerScrollExempt(panel, scrollTarget)');
        expect(shellChrome).toContain('PICKER_SCROLL_EXEMPT_SELECTORS');
        expect(shellChrome).toContain('#course-selection-modal-bg');
        expect(shellChrome).toContain('.sch-modal-overlay.open');
        expect(shellChrome).toContain('if (isPickerScrollExempt(panel, event.target)) return;');
        expect(shellChrome).toContain('panel._luxPickerWheelHandler = wheelHandler');
        expect(shellChrome).toContain('event.stopPropagation()');
    });

    it('wires lux-controls and shell chrome cache bust on representative routes', () => {
        const index = readSource('index.html');
        const registration = readSource('registration.html');
        const scheduler = readSource('admin-scheduler.html');

        expect(index).toContain('assets/css/lux-controls.css?v=20260606-pickerscroll1');
        expect(index).toContain('assets/js/features/luxury-shell-chrome.js?v=20260606-pickerscroll1');
        expect(registration).toContain('assets/css/lux-controls.css?v=20260606-pickerscroll1');
        expect(registration).toContain('assets/js/features/luxury-shell-chrome.js?v=20260606-pickerscroll1');
        expect(scheduler).toContain('assets/css/lux-controls.css?v=20260606-pickerscroll1');
        expect(scheduler).toContain('assets/js/features/luxury-shell-chrome.js?v=20260606-pickerscroll1');
    });

    it('keeps manual library filter picker panels on the scroll contract', () => {
        const libraryPage = readSource('assets/js/pages/library.js');
        const adminLibrary = readSource('admin-library.html');

        expect(libraryPage).toContain('lux-picker-panel lux-picker-panel-scroll library-picker-panel');
        expect(adminLibrary).toContain('lux-picker-panel lux-picker-panel-scroll');
    });
});