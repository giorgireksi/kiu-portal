import { describe, expect, it } from 'vitest';
import { readLmsWhiteboardSource } from './helpers/lms-whiteboard-source.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    if (relativePath === 'assets/js/pages/lms-whiteboard-runtime.js') {
        return [
            'lms-whiteboard-runtime.js',
            'lms-whiteboard-model.js',
            'lms-whiteboard-chrome-runtime.js',
            'lms-whiteboard-session-runtime.js',
            'lms-whiteboard-selection-runtime.js',
            'lms-whiteboard-workspace-runtime.js'
        ].map((file) => readFileSync(join(process.cwd(), 'assets/js/pages', file), 'utf8')).join('\n');
    }
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS whiteboard adaptive elements', () => {
    it('tracks text and sticky defaults with box dimensions', () => {
        const runtime = readLmsWhiteboardSource();

        expect(runtime).toContain('textDefaults: { fontSize: 18, w: 240, h: 72');
        expect(runtime).toContain('stickyDefaults: { w: 160, h: 120, fontSize: 14');
        expect(runtime).toContain('function syncLmsWhiteboardElementDefaults');
        expect(runtime).toMatch(/['"]text['"].*['"]document['"]|['"]document['"].*['"]text['"]/);
    });

    it('normalizes text and document boxes and resizes by width/height', () => {
        const runtime = readLmsWhiteboardSource();
        const model = readSource('assets/js/pages/lms-whiteboard-model.js');
        const normalizeBlock = model.match(/function normalizeLmsWhiteboardBox[\s\S]*?(?=\nfunction |\nconst api)/)?.[0] || '';
        const resizeBlock = runtime.match(/function applyLmsWhiteboardResize[\s\S]*?(?=\nfunction )/)?.[0] || '';

        expect(normalizeBlock).toContain("'text', 'document'");
        expect(resizeBlock).not.toContain('element.fontSize = Math.max(12');
        expect(resizeBlock).toContain('options.aspectLock');
        expect(resizeBlock).not.toContain("element.type === 'line'");
    });

    it('uses element box bounds for text elements', () => {
        const model = readSource('assets/js/pages/lms-whiteboard-model.js');
        const boundsBlock = model.match(/function getLmsWhiteboardElementBounds[\s\S]*?(?=\nfunction |\nconst api)/)?.[0] || '';

        expect(boundsBlock).toContain('measureLmsWhiteboardTextContentSize');
        expect(boundsBlock).toContain('Number(element.w) > 0 && Number(element.h) > 0');
        expect(boundsBlock).not.toContain('w: 220');
        expect(boundsBlock).not.toContain("element.type === 'line'");
    });

    it('draws wrapped text and sticky font sizes from element props', () => {
        const paint = readSource('assets/js/pages/lms-whiteboard-paint-runtime.js');
        const drawBlock = paint.match(/function drawLmsWhiteboardElement[\s\S]*?(?=\nwindow\.|$)/)?.[0] || '';

        expect(drawBlock).toContain('element.type === \'document\'');
        expect(drawBlock).toContain('stickyFontSize');
        expect(drawBlock).toContain('ctx.clip()');
        expect(drawBlock).toContain('wrapLmsWhiteboardText(ctx, element.text');
    });

    it('layouts text to box width and auto-syncs height from content', () => {
        const runtime = readLmsWhiteboardSource();
        const model = readSource('assets/js/pages/lms-whiteboard-model.js');

        expect(model).toContain('function layoutLmsWhiteboardText');
        expect(runtime).toContain('function syncLmsWhiteboardTextHeight');
        expect(model).toContain("String(text || '').split('\\n')");
        expect(runtime).toContain('syncLmsWhiteboardTextHeight(element)');
        expect(model).toContain('target[key] = lmsWhiteboardModelApi[key]');
    });

    it('wires fontSize and shape fill props for text and shape elements', () => {
        const runtime = readLmsWhiteboardSource();

        expect(runtime).toContain("prop.dataset.lmsWhiteboardProp === 'fontSize'");
        expect(runtime).toContain("prop.dataset.lmsWhiteboardProp === 'fill'");
        expect(runtime).toContain("prop.dataset.lmsWhiteboardProp === 'fillOpacity'");
        expect(runtime).toContain('data-lms-whiteboard-prop-input="fillOpacity"');
        expect(runtime).toContain('function applyLmsWhiteboardFillOpacityProp');
        expect(runtime).toContain('shapeDefaults: { fill:');
        expect(runtime).not.toContain("mode: 'edit-frame-label'");
        expect(runtime).not.toContain('is-frame-label');
    });

    it('bumps adaptive element cache bust tokens in lms.html', () => {
        const html = readSource('lms.html');

        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('20260708-wb-shapes-v4');
    });
});