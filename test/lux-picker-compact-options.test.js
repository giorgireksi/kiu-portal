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

    it('uses compact value-only universal picker trigger markup', () => {
        const shellChrome = readSource(pickerRuntime);
        const enhanceBody = extractFunctionBody(shellChrome, 'enhanceUniversalPicker');
        const syncBody = extractFunctionBody(shellChrome, 'syncUniversalPicker');

        expect(enhanceBody).toContain('lux-picker-btn--compact');
        expect(enhanceBody).toContain('<strong class="lux-picker-value"></strong>');
        expect(enhanceBody).not.toContain('lux-picker-caption');
        expect(syncBody).not.toContain('captionNode');
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

    it('styles compact universal picker triggers like lux-control fields', () => {
        const controls = readSource('assets/css/lux-controls.css');

        expect(controls).toContain('.lux-picker-btn--compact');
        expect(controls).toMatch(/\.lux-picker-btn--compact\s*\{[\s\S]*?border-radius:\s*var\(--lux-field-radius\)/);
        expect(controls).toMatch(/\.lux-picker-btn--compact\s*\{[\s\S]*?border-color:\s*var\(--lux-field-border\)/);
        expect(controls).toMatch(/\.lux-picker-btn--compact\s*\{[\s\S]*?padding:\s*11px 14px/);
        expect(controls).toContain('.lux-picker-field > .lux-picker-btn.lux-picker-btn--compact');
        expect(controls).toMatch(/\.lux-picker-btn--compact::before[\s\S]*?display:\s*none/);
        expect(controls).toMatch(/\.lux-picker-btn--compact::after[\s\S]*?display:\s*none/);
    });
});
