import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (typeof existsSync === 'function' && !existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

function extractFunctionBody(source, functionName) {
    const start = source.indexOf(`function ${functionName}`);
    if (start < 0) return '';
    const braceStart = source.indexOf('{', start);
    if (braceStart < 0) return '';
    let depth = 0;
    for (let index = braceStart; index < source.length; index += 1) {
        const char = source[index];
        if (char === '{') depth += 1;
        if (char === '}') {
            depth -= 1;
            if (depth === 0) return source.slice(start, index + 1);
        }
    }
    return '';
}

describe('lux picker compact options', () => {
    const pickerRuntime = 'assets/js/features/luxury-shell-picker-runtime.js';
    const topbarRuntime = 'assets/js/features/luxury-shell-topbar-runtime.js';

    it('renders single-line universal picker options without auto subtitles', () => {
        const shellChrome = readSource(pickerRuntime);
        const renderBody = extractFunctionBody(shellChrome, 'renderLuxPickerOptionButton');

        expect(renderBody).not.toContain('`Choose ${caption.toLowerCase()}`');
        expect(renderBody).not.toContain("'Current selection'");
        expect(renderBody).toContain('<strong>${escapeHtml(title)}</strong>');
        expect(renderBody).toContain('data-lux-picker-subtitle');
        expect(renderBody).toContain('subtitle ?');
    });

    it('uses compact CTA triggers everywhere including form shells', () => {
        const shellChrome = readSource(pickerRuntime);
        const enhanceBody = extractFunctionBody(shellChrome, 'enhanceUniversalPicker');
        const resolveBody = extractFunctionBody(shellChrome, 'resolvePickerTriggerClass');

        expect(shellChrome).toContain('resolvePickerTriggerClass');
        expect(shellChrome).toContain('lux-picker-btn--compact');
        expect(shellChrome).not.toContain('lux-picker-btn--field');
        expect(resolveBody).not.toContain('sch-input-group');
        expect(enhanceBody).toContain('resolvePickerTriggerClass(select)');
        expect(enhanceBody).toContain('<strong class="lux-picker-value"></strong>');
    });

    it('renders single-line faculty, role, and semester picker options', () => {
        const topbar = readSource(topbarRuntime);
        const semesterPicker = readSource('assets/js/pages/curriculum-semester-picker.js');

        expect(topbar).toMatch(/data-faculty-option[\s\S]*?<strong>\$\{escapeHtml\(opt\.label\)\}<\/strong>\s*<\/button>/);
        expect(topbar).toMatch(/data-role-option[\s\S]*?<strong>\$\{escapeHtml\(label\)\}<\/strong>\s*<\/button>/);
        expect(semesterPicker).not.toContain('getOptionSubtitle');
        expect(semesterPicker).toMatch(/data-semester-value[\s\S]*?<strong>\$\{escapeHtml\(title\)\}<\/strong>\s*<\/button>/);
        expect(semesterPicker).not.toContain('<span>Enter a semester number</span>');
    });

    it('ships compact picker option heights and flex layout tokens', () => {
        const controls = readSource('assets/css/lux-controls.css');
        const droplist = readSource('assets/css/lux-droplist.css');

        expect(controls).toContain('--lux-picker-option-height: 44px');
        expect(controls).toContain('--lux-droplist-option-height: 44px');
        expect(controls).toMatch(/\n\.lux-picker-option\s*\{[\s\S]*?display:\s*flex;[\s\S]*?align-items:\s*center;/);
        expect(droplist).toContain('.lux-droplist-panel');
    });

    it('always wraps picker options in a scrollport to avoid droplist grid overlap', () => {
        const picker = readSource('assets/js/features/luxury-shell-picker-runtime.js');
        const buildBody = extractFunctionBody(picker, 'buildUniversalPickerPanel');

        expect(picker).not.toContain('isSchedulerModalPicker');
        expect(buildBody).toContain('<div class="lux-picker-panel-scrollport">${optionsMarkup}</div>');
        expect(buildBody).toContain('<div class="lux-picker-options lux-picker-panel-scrollport">${optionsMarkup}</div>');
        expect(buildBody).not.toMatch(/schedulerModal\s*\?\s*optionsMarkup/);
    });

    it('styles compact universal picker triggers like primary CTA buttons', () => {
        const controls = readSource('assets/css/lux-controls.css');

        expect(controls).toContain('.lux-picker-btn--compact');
        expect(controls).toMatch(/\.lux-picker-btn--compact\s*\{[\s\S]*?border-radius:\s*var\(--lux-btn-pill-radius/);
        expect(controls).toMatch(/\.lux-picker-btn--compact\s*\{[\s\S]*?border-color:\s*var\(--lux-btn-border-solid/);
        expect(controls).toMatch(/\.lux-picker-btn--compact\s*\{[\s\S]*?padding:\s*0 18px/);
        expect(controls).toContain('.lux-picker-field > .lux-picker-btn.lux-picker-btn--compact');
        expect(controls).toMatch(/\.lux-picker-btn--compact:hover[\s\S]*?translateY\(-2px\)/);
        expect(controls).toContain('.lux-picker-btn--compact::before');
        expect(controls).toContain('.lux-picker-btn--compact::after');
    });
});
