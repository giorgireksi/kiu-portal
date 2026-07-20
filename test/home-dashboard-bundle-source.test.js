import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

const HOME_DASHBOARD_PARTS = [
    'prefs-visuals.js',
    'widget-layout.js',
    'editor-draft.js',
    'widget-render.js',
    'editor-ui.js',
    'shell.js'
];

function readConcatenatedParts() {
    return `${HOME_DASHBOARD_PARTS
        .map((fileName) => readSource(`assets/js/features/home-dashboard/${fileName}`).replace(/\s+$/, ''))
        .join('\n\n')}\n`;
}

describe('home dashboard SSOT', () => {
    it('keeps editable parts in parity with the plain registered chunk', () => {
        const partsConcat = readConcatenatedParts();
        const plain = readSource('assets/js/features/index-home-dashboard.plain.js');
        expect(plain).toBe(partsConcat);
    });

    it('exposes the installer contract surface from editable parts', () => {
        const partsConcat = readConcatenatedParts();
        expect(partsConcat).toContain('renderDynamicHomeShell = function');
        expect(partsConcat).toContain('startBackground = function');
        expect(partsConcat).toContain('buildHomeWidgetDefinitions');
        expect(readSource('assets/js/features/home-dashboard-widget-layout-runtime.js'))
            .toContain('function buildHomeWidgetDefinitions');
    });

    it('registers a plain URL (not base64) through the home dashboard script on index.html', () => {
        const html = readSource('index.html');
        const registration = readSource('assets/js/features/index-home-dashboard.js');

        expect(html).toContain('assets/js/features/index-home-dashboard.js');
        expect(registration).toContain('__kiuRegisterLuxuryHomeChunkUrl');
        expect(registration).toContain('index-home-dashboard.plain.js');
        expect(registration).not.toMatch(/__kiuRegisterLuxuryHomeChunk\('[A-Za-z0-9+/=]{80,}'\)/);
        expect(existsSync(join(process.cwd(), 'assets/js/features/index-home-dashboard.plain.js'))).toBe(true);
        expect(existsSync(join(process.cwd(), 'assets/js/features/index-home-dashboard.bundle-source.js'))).toBe(false);
    });
});
