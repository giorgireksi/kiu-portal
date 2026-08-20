import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('luxury-shell-studio-runtime peel', () => {
    it('owns fog profile studio UI outside luxury-shell-chrome', () => {
        const chrome = readSource('assets/js/features/luxury-shell-chrome.js');
        const studio = readSource('assets/js/features/luxury-shell-studio-runtime.js');
        expect(chrome).toContain('__kiuCreateLuxuryShellStudioApi');
        expect(chrome).not.toMatch(/^function isFogProfileEditing\b/m);
        expect(chrome).not.toMatch(/^function bindFogProfileControls\b/m);
        expect(studio).toContain('function isFogProfileEditing');
        expect(studio).toContain('function bindFogProfileControls');
        expect(studio).toContain('__kiuCreateLuxuryShellStudioApi');
        expect(studio).toContain('__KIU_LUXURY_SHELL_STUDIO_LOADED');
    });

    it('loads before luxury-shell-chrome on index.html', () => {
        const html = readSource('index.html');
        expect(html).toContain('luxury-shell-studio-runtime.js');
        expect(html.indexOf('luxury-shell-studio-runtime.js'))
            .toBeLessThan(html.indexOf('luxury-shell-chrome.js'));
    });

    it('places the global button-burst preference under Interface Mode and resets it with visuals', () => {
        const chrome = readSource('assets/js/features/luxury-shell-chrome.js');
        const luxury = readSource('assets/js/features/index-luxury.js');
        expect(chrome.indexOf('Interface Mode')).toBeLessThan(chrome.indexOf('Button Click Animation'));
        expect(chrome.indexOf('Button Click Animation')).toBeLessThan(chrome.indexOf('Panel Transparency'));
        expect(chrome).toContain('id="lux-button-burst-on"');
        expect(chrome).toContain('id="lux-button-burst-off"');
        expect(luxury).toContain('window.resetLuxButtonBurstPreference');
    });
});
