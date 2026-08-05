import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { readLmsWhiteboardSource } from './helpers/lms-whiteboard-source.js';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS whiteboard wave 3b features', () => {
    it('adds undo/redo history stack', () => {
        const history = readSource('assets/js/pages/lms-whiteboard-history-runtime.js');
        const runtime = readLmsWhiteboardSource();

        expect(history).toContain('function pushLmsWhiteboardHistoryState');
        expect(history).toContain('function undoLmsWhiteboardHistory');
        expect(history).toContain('function redoLmsWhiteboardHistory');
        expect(runtime).toContain('pushLmsWhiteboardHistoryState');
        expect(runtime).toContain('redoLmsWhiteboardHistory');
    });

    it('supports multi-select with shift-click', () => {
        const runtime = readLmsWhiteboardSource();

        expect(runtime).toContain('selectedIds');
        expect(runtime).toContain('function setLmsWhiteboardSelection');
        expect(runtime).toContain('event.shiftKey');
        expect(runtime).toContain('function getLmsWhiteboardSelectedIds');
    });

    it('supports drag marquee multi-select and group move', () => {
        const runtime = readLmsWhiteboardSource();

        expect(runtime).toContain("mode: 'marquee'");
        expect(runtime).toContain('function findLmsWhiteboardElementsInMarquee');
        expect(runtime).toContain('function drawLmsWhiteboardMarquee');
        expect(runtime).toContain('current.includes(hit.id) && current.length > 1');
        expect(runtime).toContain('options.additive');
    });

    it('renders minimap navigation overlay', () => {
        const minimap = readSource('assets/js/pages/lms-whiteboard-minimap-runtime.js');
        const runtime = readLmsWhiteboardSource();

        expect(minimap).toContain('function paintLmsWhiteboardMinimap');
        expect(runtime).toContain('lms-whiteboard-minimap');
        expect(runtime).toContain('paintLmsWhiteboardMinimap');
    });

    it('normalizes image elements and drops removed frame type', () => {
        const service = readSource('backend/platform/domains/lms-whiteboard-service.js');
        const runtime = readSource('assets/js/pages/lms-whiteboard-runtime.js');

        expect(service).toContain("type === 'image'");
        expect(service).toContain('LMS_WHITEBOARD_REMOVED_ELEMENT_TYPES');
        expect(runtime).not.toContain("['frame', 'fa-object-group', 'Frame']");
        expect(runtime).toContain('function importLmsWhiteboardImageFile');
        expect(runtime).toMatch(/element\.type === 'image'/);
        expect(runtime).not.toContain("if (element.type === 'frame')");
    });

    it('bumps wave3b cache bust tokens in lms.html', () => {
        const html = readSource('lms.html');

        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('lms-whiteboard-history-runtime.js?v=20260708-wb-shapes-v4');
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('lms-whiteboard-minimap-runtime.js?v=20260708-wb-shapes-v4');
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('20260708-wb-shapes-v4');
    });
});