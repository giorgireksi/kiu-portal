import { describe, expect, it } from 'vitest';
import { readLmsWhiteboardMainRuntime } from './helpers/lms-whiteboard-source.js';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('lms-whiteboard-pointer-runtime peel', () => {
    it('owns pointer bind/handlers outside the main runtime', () => {
        const runtime = readLmsWhiteboardMainRuntime();
        const pointer = readSource('assets/js/pages/lms-whiteboard-pointer-runtime.js');
        expect(runtime).not.toMatch(/^function onLmsWhiteboardPointerDown\b/m);
        expect(runtime).not.toMatch(/^function bindLmsWhiteboardStagePointerHandlers\b/m);
        expect(runtime).toContain('lms-whiteboard-pointer-runtime.js');
        expect(pointer).toMatch(/^function onLmsWhiteboardPointerDown\b/m);
        expect(pointer).toMatch(/^function bindLmsWhiteboardStagePointerHandlers\b/m);
        expect(pointer).toMatch(/^function startLmsWhiteboardPan\b/m);
        expect(pointer).toMatch(/^function endLmsWhiteboardPan\b/m);
        expect(pointer).toContain('function scheduleLmsWhiteboardGesturePaint');
        expect(pointer).toContain('function flushLmsWhiteboardGesturePaint');
        expect(pointer).toContain('window.requestAnimationFrame');
        expect(pointer).toContain('window.startLmsWhiteboardPan = startLmsWhiteboardPan');
    });

    it('loads before runtime in LMS_WHITEBOARD_MODULE_URLS', () => {
        const tabs = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        expect(tabs).toContain('lms-whiteboard-pointer-runtime.js');
        expect(tabs.indexOf('lms-whiteboard-pointer-runtime.js'))
            .toBeLessThan(tabs.indexOf('lms-whiteboard-runtime.js'));
        expect(tabs.indexOf('lms-whiteboard-model.js'))
            .toBeLessThan(tabs.indexOf('lms-whiteboard-pointer-runtime.js'));
        expect(tabs.indexOf('lms-whiteboard-pointer-runtime.js'))
            .toBeLessThan(tabs.indexOf('lms-whiteboard-paint-runtime.js') >= 0
                ? tabs.indexOf('lms-whiteboard-paint-runtime.js')
                : tabs.indexOf('lms-whiteboard-runtime.js'));
    });
});
