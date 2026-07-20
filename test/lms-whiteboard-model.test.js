import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
    lmsWhiteboardModelApi,
    installLmsWhiteboardModel
} from '../assets/js/pages/lms-whiteboard-model.js';

function readSource(p) {
    return readFileSync(join(process.cwd(), p), 'utf8');
}

const {
    colorWithLmsWhiteboardOpacity,
    clampLmsWhiteboardFillOpacityPercent,
    isLmsWhiteboardShapeBoxElement,
    isLmsWhiteboardShapeLineElement,
    getLmsWhiteboardElementBounds,
    normalizeLmsWhiteboardRect,
    rectsIntersectLmsWhiteboard,
    hitTestLmsWhiteboardResizeZone
} = lmsWhiteboardModelApi;

describe('lms-whiteboard-model', () => {
    beforeEach(() => {
        delete window.__KIU_LMS_WHITEBOARD_MODEL_LOADED;
        delete window.KiuLmsWhiteboardModel;
        installLmsWhiteboardModel(window);
        window.LMS_WHITEBOARD_UI = { snapToGrid: false, zoom: 1, textDefaults: { fontSize: 18 } };
    });

    it('exports pure helpers', () => {
        expect(window.__KIU_LMS_WHITEBOARD_MODEL_LOADED).toBe(true);
        expect(window.KiuLmsWhiteboardModel).toBe(lmsWhiteboardModelApi);
        expect(typeof colorWithLmsWhiteboardOpacity).toBe('function');
        expect(typeof getLmsWhiteboardElementBounds).toBe('function');
        expect(typeof hitTestLmsWhiteboardResizeZone).toBe('function');
    });

    it('converts hex colors with opacity', () => {
        expect(colorWithLmsWhiteboardOpacity('#ff0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
        expect(clampLmsWhiteboardFillOpacityPercent(150)).toBe(100);
        expect(clampLmsWhiteboardFillOpacityPercent(-1)).toBe(0);
    });

    it('classifies shapes and computes bounds', () => {
        expect(isLmsWhiteboardShapeBoxElement({ type: 'rect' })).toBe(true);
        expect(isLmsWhiteboardShapeLineElement({ type: 'arrow' })).toBe(true);
        const bounds = getLmsWhiteboardElementBounds({ type: 'rect', x: 10, y: 20, w: 100, h: 50 });
        expect(bounds).toEqual({ x: 10, y: 20, w: 100, h: 50 });
        const stroke = getLmsWhiteboardElementBounds({
            type: 'stroke',
            width: 2,
            points: [[0, 0], [10, 10]]
        });
        expect(stroke.w).toBeGreaterThan(10);
    });

    it('normalizes rects and hit-tests resize zones', () => {
        expect(normalizeLmsWhiteboardRect(10, 10, 0, 0)).toEqual({ x: 0, y: 0, w: 10, h: 10 });
        expect(rectsIntersectLmsWhiteboard(
            { x: 0, y: 0, w: 10, h: 10 },
            { x: 5, y: 5, w: 10, h: 10 }
        )).toBe(true);
        const zone = hitTestLmsWhiteboardResizeZone(
            { x: 100, y: 100 },
            { type: 'rect', x: 0, y: 0, w: 100, h: 100 },
            { local: true, handleThreshold: 20, edgeThreshold: 20 }
        );
        expect(zone).toBe('se');
    });

    it('ESM leaf + bridge in lazy MODULE_URLS before whiteboard runtime', () => {
        const tabs = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        const runtime = readSource('assets/js/pages/lms-whiteboard-runtime.js');
        const mod = readSource('assets/js/pages/lms-whiteboard-model.js');
        expect(mod).toContain('export function installLmsWhiteboardModel');
        expect(tabs).toContain('lms-whiteboard-model.js');
        expect(tabs).toContain('lms-whiteboard-model-bridge.js');
        expect(tabs.indexOf('lms-whiteboard-model.js')).toBeLessThan(tabs.indexOf('lms-whiteboard-model-bridge.js'));
        expect(tabs.indexOf('lms-whiteboard-model-bridge.js')).toBeLessThan(tabs.indexOf('lms-whiteboard-runtime.js'));
        expect(runtime).toContain('lms-whiteboard-model.js');
        expect(runtime).toContain('window.LMS_WHITEBOARD_UI = LMS_WHITEBOARD_UI');
        expect(runtime).not.toMatch(/^function colorWithLmsWhiteboardOpacity\b/m);
        expect(runtime).not.toMatch(/^function getLmsWhiteboardElementBounds\b/m);
    });
});
