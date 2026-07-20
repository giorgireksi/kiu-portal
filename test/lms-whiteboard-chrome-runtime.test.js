import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const readSource = (rel) => readFileSync(resolve(root, rel), 'utf8');

describe('lms-whiteboard-chrome-runtime peel', () => {
    it('exposes factory + load guard and Object.assign window api', () => {
        const chrome = readSource('assets/js/pages/lms-whiteboard-chrome-runtime.js');
        expect(chrome).toContain('__KIU_LMS_WHITEBOARD_CHROME_LOADED');
        expect(chrome).toContain('__kiuCreateLmsWhiteboardChromeApi');
        expect(chrome).toContain('Object.assign(window, api)');
        expect(chrome).toMatch(/renderLmsWhiteboardDashboardSection|renderLmsWhiteboardToolRail/);
    });

    it('loads chrome before runtime in LMS_WHITEBOARD_MODULE_URLS', () => {
        const tabs = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        const chromeIdx = tabs.indexOf('lms-whiteboard-chrome-runtime.js');
        const sessionIdx = tabs.indexOf('lms-whiteboard-session-runtime.js');
        const runtimeIdx = tabs.indexOf('lms-whiteboard-runtime.js?v=');
        expect(chromeIdx).toBeGreaterThan(-1);
        expect(sessionIdx).toBeGreaterThan(chromeIdx);
        expect(runtimeIdx).toBeGreaterThan(sessionIdx);
    });

    it('keeps runtime under 2000 and chrome under 1300', () => {
        const runtimeLines = readSource('assets/js/pages/lms-whiteboard-runtime.js').split('\n').length;
        const chromeLines = readSource('assets/js/pages/lms-whiteboard-chrome-runtime.js').split('\n').length;
        expect(runtimeLines).toBeLessThanOrEqual(2000);
        expect(chromeLines).toBeLessThanOrEqual(1300);
    });
});
