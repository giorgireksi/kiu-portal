import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS whiteboard wave 3a editing', () => {
    it('adds zoom-to-fit and grid snap helpers', () => {
        const runtime = readSource('assets/js/pages/lms-whiteboard-runtime.js');

        expect(runtime).toContain('function fitLmsWhiteboardZoomToContent');
        expect(runtime).toContain('function snapLmsWhiteboardCoord');
        expect(runtime).toContain('snapToGrid');
        expect(runtime).toContain('data-lms-whiteboard-action="zoom-fit"');
    });

    it('supports resize handles for bounded elements', () => {
        const runtime = readSource('assets/js/pages/lms-whiteboard-runtime.js');

        expect(runtime).toContain('function hitTestLmsWhiteboardResizeZone');
        expect(runtime).toContain("dragStart?.mode === 'resize'");
        expect(runtime).toContain('drawLmsWhiteboardResizeHandles');
    });

    it('exposes z-order controls for selected elements', () => {
        const runtime = readSource('assets/js/pages/lms-whiteboard-runtime.js');

        expect(runtime).toContain('function reorderLmsWhiteboardElement');
        expect(runtime).toContain('data-lms-whiteboard-action="bring-forward"');
        expect(runtime).toContain('data-lms-whiteboard-action="send-backward"');
        expect(runtime).toContain('forceFullSync');
    });

    it('drops removed triangle and diamond element types while keeping rect shapes', () => {
        const service = readSource('backend/platform/domains/lms-whiteboard-service.js');
        const runtime = readSource('assets/js/pages/lms-whiteboard-runtime.js');
        const workspace = readSource('assets/js/pages/lms-whiteboard-workspace-runtime.js');

        expect(service).toContain("LMS_WHITEBOARD_REMOVED_ELEMENT_TYPES = ['triangle', 'diamond', 'frame']");
        expect(workspace).toContain("LMS_WHITEBOARD_REMOVED_ELEMENT_TYPES = ['triangle', 'diamond', 'frame']");
        expect(service).not.toContain("type === 'triangle'");
        expect(runtime).not.toContain("['triangle', 'fa-play', 'Triangle']");
        expect(runtime).not.toContain("['diamond', 'fa-diamond', 'Diamond']");
        expect(runtime).toContain("['rect', 'fa-square', 'Rectangle']");
    });

    it('bumps wave3a cache bust tokens in lms.html', () => {
        const html = readSource('lms.html');

        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('20260708-wb-shapes-v4');
    });
});