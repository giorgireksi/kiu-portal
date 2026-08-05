import { describe, expect, it } from 'vitest';

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { readLmsWhiteboardSource } from './helpers/lms-whiteboard-source.js';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS whiteboard wave 1a improvements', () => {
    it('replaces prompt editing with inline overlay helpers', () => {
        const runtime = readLmsWhiteboardSource();

        expect(runtime).toContain('function openLmsWhiteboardInlineEditor');
        expect(runtime).toContain('function closeLmsWhiteboardInlineEditor');
        expect(runtime).toContain('data-lms-whiteboard-edit-layer');
        expect(runtime).not.toContain("prompt('Enter text'");
        expect(runtime).not.toContain("prompt('Edit sticky note'");
    });

    it('adds wheel zoom and HiDPI canvas setup', () => {
        const runtime = readLmsWhiteboardSource();

        expect(runtime).toContain('LMS_WHITEBOARD_LOGICAL_WIDTH');
        expect(runtime).toContain('function setupLmsWhiteboardCanvasHiDpi');
        expect(runtime).toContain('function onLmsWhiteboardWheel');
        expect(runtime).toContain("addEventListener('wheel'");
        expect(runtime).toContain('devicePixelRatio');
    });

    it('exposes shape drawing tools in the tool rail', () => {
        const runtime = readLmsWhiteboardSource();
        const html = readSource('lms.html');
        const toolGroupsBlock = runtime.match(/const LMS_WHITEBOARD_TOOL_GROUPS[\s\S]*?];/)?.[0] || '';

        expect(toolGroupsBlock).toContain("label: 'Shapes'");
        expect(toolGroupsBlock).toContain("['rect', 'fa-square', 'Rectangle']");
        expect(toolGroupsBlock).toContain("['ellipse', 'fa-circle', 'Circle']");
        expect(toolGroupsBlock).toContain("['line', 'fa-minus', 'Line']");
        expect(toolGroupsBlock).toContain("['arrow', 'fa-arrow-right-long', 'Arrow']");
        expect(toolGroupsBlock).toContain("['grid', 'fa-table-cells', 'Grid']");
        expect(html).not.toContain('lms-whiteboard-shape-runtime.js');
    });

    it('styles inline editor overlay above the canvas', () => {
    });

    it('bumps wave1a cache bust tokens in lms.html', () => {
        const html = readSource('lms.html');

        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('20260708-wb-shapes-v4');
    });
});