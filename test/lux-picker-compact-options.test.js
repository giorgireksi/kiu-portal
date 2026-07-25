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
    it('renders single-line universal picker options without auto subtitles', () => {
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');
        const renderBody = extractFunctionBody(shellChrome, 'renderLuxPickerOptionButton');

        expect(renderBody).not.toContain('`Choose ${caption.toLowerCase()}`');
        expect(renderBody).not.toContain("'Current selection'");
        expect(renderBody).toContain('<strong>${escapeHtml(title)}</strong>');
        expect(renderBody).toContain('data-lux-picker-subtitle');
        expect(renderBody).toContain('subtitle ?');
    });

    it('uses compact value-only universal picker trigger markup', () => {
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');
        const enhanceBody = extractFunctionBody(shellChrome, 'enhanceUniversalPicker');
        const syncBody = extractFunctionBody(shellChrome, 'syncUniversalPicker');

        expect(enhanceBody).toContain('lux-picker-btn--compact');
        expect(enhanceBody).toContain('<strong class="lux-picker-value"></strong>');
        expect(enhanceBody).not.toContain('lux-picker-caption');
        expect(syncBody).not.toContain('captionNode');
    });

    it('renders single-line faculty, role, and semester picker options', () => {
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');
        const semesterPicker = readSource('assets/js/pages/curriculum-semester-picker.js');

        expect(shellChrome).toMatch(/data-faculty-option[\s\S]*?<strong>\$\{escapeHtml\(opt\.label\)\}<\/strong>\s*<\/button>/);
        expect(shellChrome).toMatch(/data-role-option[\s\S]*?<strong>\$\{escapeHtml\(label\)\}<\/strong>\s*<\/button>/);
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
});
