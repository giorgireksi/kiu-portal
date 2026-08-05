import { describe, expect, it } from 'vitest';
import { readLmsWhiteboardMainRuntime } from './helpers/lms-whiteboard-source.js';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('lms-whiteboard-paint-runtime peel', () => {
    it('owns paint/grid/draw outside the main runtime', () => {
        const runtime = readLmsWhiteboardMainRuntime();
        const paint = readSource('assets/js/pages/lms-whiteboard-paint-runtime.js');
        expect(runtime).not.toMatch(/^function paintLmsWhiteboardCanvas\b/m);
        expect(runtime).not.toMatch(/^function drawLmsWhiteboardElement\b/m);
        expect(runtime).toContain('lms-whiteboard-paint-runtime.js');
        expect(paint).toMatch(/^function paintLmsWhiteboardCanvas\b/m);
        expect(paint).toMatch(/^function drawLmsWhiteboardElement\b/m);
        expect(paint).toContain('window.paintLmsWhiteboardCanvas');
        expect(paint).toContain('window.drawLmsWhiteboardElement');
    });

    it('loads after pointer and before runtime in LMS_WHITEBOARD_MODULE_URLS', () => {
        const tabs = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        expect(tabs).toContain('lms-whiteboard-paint-runtime.js');
        expect(tabs.indexOf('lms-whiteboard-pointer-runtime.js'))
            .toBeLessThan(tabs.indexOf('lms-whiteboard-paint-runtime.js'));
        expect(tabs.indexOf('lms-whiteboard-paint-runtime.js'))
            .toBeLessThan(tabs.indexOf('lms-whiteboard-runtime.js'));
    });
});
