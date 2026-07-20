import { describe, expect, it } from 'vitest';
import { expectLmsRouteCssLinks } from './helpers/lms-route-css.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS whiteboard display HiDPI ux11', () => {
    it('sizes the canvas buffer from the displayed stage rect', () => {
        const runtime = readSource('assets/js/pages/lms-whiteboard-runtime.js');
        const setupBlock = runtime.match(/function setupLmsWhiteboardCanvasHiDpi[\s\S]*?(?=\nfunction )/)?.[0] || '';

        expect(setupBlock).toContain('getBoundingClientRect');
        expect(setupBlock).toContain('clientWidth');
        expect(setupBlock).toContain('clientHeight');
        expect(setupBlock).toContain('lmsWhiteboardDisplayFingerprint');
        expect(setupBlock).toContain('displayW * dpr');
        expect(setupBlock).toContain('displayH * dpr');
    });

    it('maps logical coordinates through display scale in paint', () => {
        const paint = readSource('assets/js/pages/lms-whiteboard-paint-runtime.js');
        const paintBlock = paint.match(/function paintLmsWhiteboardCanvas[\s\S]*?(?=\nfunction )/)?.[0] || '';

        expect(paintBlock).toContain('displayScale');
        expect(paintBlock).toContain('displayOffsetX');
        expect(paintBlock).toContain('dpr * displayScale');
        expect(paintBlock).toContain('dpr * displayOffsetX');
        expect(paintBlock).toContain('clearRect(0, 0, canvas.width, canvas.height)');
        expect(paintBlock).toContain('logicalPixels');
    });

    it('bumps whiteboard ux cache bust tokens in lms.html', () => {
        const html = readSource('lms.html');

        expectLmsRouteCssLinks(html);
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-whiteboard-runtime.js?v=20260719-wbchrome1');
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-whiteboard-paint-runtime.js?v=20260719-wbchrome1');
    });
});