import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { LUX_DROPLIST_CACHE_BUST } from './fixtures/lux-droplist-contract.js';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (typeof existsSync === 'function' && !existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

function extractRuleBlock(source, selector) {
    const start = source.indexOf(selector);
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

describe('lux picker calm hover', () => {
    it('does not lift global picker options on hover or active', () => {
        const controls = readSource('assets/css/lux-controls.css');

        const controlsHover = extractRuleBlock(controls, '.lux-picker-option:hover');
        const controlsActive = extractRuleBlock(controls, '.lux-picker-option.is-active');

        expect(controlsHover).not.toContain('translateY');
        expect(controlsActive).not.toContain('translateY');
        expect(existsSync(join(process.cwd(), 'assets/css/index-luxury.css'))).toBe(false);
        const controlsOption = extractRuleBlock(controls, '.lux-picker-option {\n    width:');
        expect(controlsOption).not.toContain('transform');
        expect(controlsOption).not.toContain('translateY');
        const droplistCss = readSource('assets/css/lux-droplist.css');
        const droplistHover = extractRuleBlock(droplistCss, '.lux-droplist-panel .lux-picker-option:hover');
        const droplistActive = extractRuleBlock(droplistCss, '.lux-droplist-panel .lux-picker-option.is-active');
        expect(droplistHover).not.toContain('translateY');
        expect(droplistActive).not.toContain('translateY');
    });

    it('removes scheduler option stagger, pulse, and blur bloom', () => {
        expect(existsSync(join(process.cwd(), 'assets/css/admin-scheduler-route.css'))).toBe(false);
    });

    it('cache-busts calm picker CSS on representative routes', () => {
        const index = readSource('index.html');
        const scheduler = readSource('admin-scheduler.html');

        expect(index).toMatch(/assets\/css\/lux-controls\.css\?v=/);
        expect(scheduler).toMatch(/assets\/css\/lux-controls\.css\?v=/);
        // admin-scheduler-route.css retired in bare-shell era; multi-route uses lux-controls SSOT
        expect(scheduler).toMatch(/assets\/css\/lux-controls\.css\?v=/);
    });
});
