import { describe, expect, it } from 'vitest';

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS whiteboard document interaction ux8', () => {
    it('gates pointer events by active tool', () => {
        const runtime = readSource('assets/js/pages/lms-whiteboard-runtime.js');

        expect(css).toContain('[data-lms-whiteboard-tool="select"] .lms-whiteboard-document-body');
        expect(css).toContain('[data-lms-whiteboard-tool="pen"] .lms-whiteboard-document-ink');
        expect(css).toContain('[data-lms-whiteboard-tool="eraser"] .lms-whiteboard-document-ink');
        expect(runtime).toContain('stage.dataset.lmsWhiteboardTool = LMS_WHITEBOARD_UI.tool');
        expect(runtime).toContain('syncLmsWhiteboardDocumentToolMode');
    });

    it('mounts chrome, ink canvas, and shell drag bindings', () => {
        const docRuntime = readSource('assets/js/pages/lms-whiteboard-document-runtime.js');

        expect(docRuntime).toContain('bindLmsWhiteboardDocumentShellInteractions');
        expect(docRuntime).toContain('data-lms-whiteboard-document-drag');
        expect(docRuntime).toContain('data-lms-whiteboard-document-ink');
        expect(docRuntime).toContain('data-lms-whiteboard-document-chrome');
        expect(docRuntime).toContain('beginLmsWhiteboardShellDrag');
        expect(docRuntime).toContain('beginLmsWhiteboardDocumentStroke');
        expect(docRuntime).toContain('parentDocumentId');
        expect(docRuntime).toContain('setLmsWhiteboardTool(\'select\')');
        expect(docRuntime).toContain('shellOrigin.left');
        expect(docRuntime).toContain('scrollablePreview');
        expect(docRuntime).not.toMatch(/closest\('iframe, \.lms-whiteboard-document-frame, \.lms-whiteboard-document-image'\)/);
        expect(docRuntime).toContain('img.draggable = false');
    });

    it('exposes shell drag and document stroke helpers from runtime', () => {
        const runtime = readSource('assets/js/pages/lms-whiteboard-runtime.js');

        expect(runtime).toContain('function beginLmsWhiteboardShellDrag');
        expect(runtime).toContain('function attachLmsWhiteboardShellDragWindowListeners');
        expect(runtime).toContain('function beginLmsWhiteboardDocumentStroke');
        expect(runtime).toContain('function scaleLmsWhiteboardDocumentStrokePoints');
        expect(runtime).toContain('function getActiveLmsWhiteboardShell');
        expect(runtime).toContain('function worldToStageOffset');
        expect(runtime).toContain("id: 'n'");
        expect(runtime).toContain("id: 'e'");
        expect(runtime).toContain('skipDocumentSync');
        expect(runtime).toContain('data-lms-whiteboard-layers-list');
    });

    it('normalizes document-scoped strokes in backend service', () => {
        const service = readSource('backend/platform/domains/lms-whiteboard-service.js');

        expect(service).toContain('parentDocumentId');
        expect(service).toContain('pageIndex');
        expect(service).toContain('opacity');
        expect(service).toContain('element.hidden');
        expect(service).toContain('element.locked');
        expect(service).toMatch(/type === 'sticky'[\s\S]*parentDocumentId/);
        expect(service).toMatch(/type === 'text'[\s\S]*parentDocumentId/);
        expect(service).toContain('LMS_WHITEBOARD_REMOVED_ELEMENT_TYPES');
    });

    it('supports annotate mode css and document tool routing', () => {
        const docRuntime = readSource('assets/js/pages/lms-whiteboard-document-runtime.js');

        expect(css).toContain('[data-lms-whiteboard-annotate="true"] .lms-whiteboard-document-ink');
        expect(css).toContain('z-index: 4');
        expect(css).toContain('[data-lms-whiteboard-annotate="true"] .lms-whiteboard-document-badge');
        expect(css).toContain('pointer-events: none');
        expect(css).toContain('.lms-whiteboard-document-pdf-canvas');
        expect(docRuntime).toContain('handleLmsWhiteboardDocumentToolDown');
        expect(docRuntime).toContain('paintLmsWhiteboardDocumentOverlayCanvas');
        expect(docRuntime).toContain('repaintAllLmsWhiteboardDocumentInks');
        expect(docRuntime).toContain('findLmsWhiteboardDocumentChildAtPoint');
        expect(docRuntime).toContain('attachLmsWhiteboardDocumentInkWindowListeners');
    });

    it('skips document children on main canvas and converts inline editor coords', () => {
        const runtime = readSource('assets/js/pages/lms-whiteboard-runtime.js');

        expect(runtime).toContain('if (element.parentDocumentId) return;');
        expect(runtime).toContain('documentLocalToWorld');
        expect(runtime).toContain('scaleLmsWhiteboardDocumentChildElements');
        expect(runtime).toContain('hitTestLmsWhiteboardDocumentChildLocal');
    });

    it('styles thicker document frames and larger resize handles', () => {
        expect(css).toMatch(/\.lms-whiteboard-document-view[\s\S]*border:\s*2px solid rgba\(100, 116, 139, 0\.75\)/);
        expect(css).toMatch(/\.lms-whiteboard-document-view\.is-selected[\s\S]*border:\s*3px solid rgba\(244, 208, 111, 0\.95\)/);
        expect(css).toMatch(/\.lms-whiteboard-document-handle[\s\S]*width:\s*16px;/);
        expect(css).toContain('.lms-whiteboard-document-handle::before');
        expect(css).toMatch(/\.lms-whiteboard-document-view\.is-selected \.lms-whiteboard-document-drag-ring/);
    });

    it('supports resize zones, hover cursors, and document child resize', () => {
        const runtime = readSource('assets/js/pages/lms-whiteboard-runtime.js');
        const docRuntime = readSource('assets/js/pages/lms-whiteboard-document-runtime.js');

        expect(runtime).toContain('function hitTestLmsWhiteboardResizeZone');
        expect(runtime).toContain('function getLmsWhiteboardResizeHandleCursor');
        expect(runtime).toContain('function applyLmsWhiteboardStrokeBoundsResize');
        expect(runtime).toContain('syncLmsWhiteboardPointerCursor');
        expect(css).toContain('[data-lms-whiteboard-tool="select"] .lms-whiteboard-canvas');
        expect(css).toContain('.lms-whiteboard-document-edge-handle');
        expect(css).toContain('cursor: nesw-resize');
        expect(docRuntime).toContain('lms-whiteboard-document-edge-handle');
        expect(docRuntime).toContain('hitTestLmsWhiteboardDocumentShellResizeZone');
        expect(docRuntime).toContain('paintDocumentChildResizeHandles');
        expect(docRuntime).toContain('resize-document-child');
        expect(docRuntime).toContain('syncLmsWhiteboardDocumentPointerCursor');
    });

    it('bumps lms cache to resize-cursor', () => {
        const html = readSource('lms.html');

        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('20260708-wb-shapes-v4');
    });

    it('supports document ink marquee multi-select', () => {
        const docRuntime = readSource('assets/js/pages/lms-whiteboard-document-runtime.js');

        expect(docRuntime).toContain("mode: 'marquee'");
        expect(docRuntime).toContain('documentLocal: true');
        expect(docRuntime).toContain('findLmsWhiteboardElementsInMarquee(resourceKey, rect, { parentDocumentId: elementId })');
        expect(docRuntime).toContain('drawLmsWhiteboardMarquee');
        expect(docRuntime).toContain('current.includes(childAtPoint.id) && current.length > 1');
    });

    it('supports text drag-to-size placement and resize editor sync', () => {
        const runtime = readSource('assets/js/pages/lms-whiteboard-runtime.js');
        const docRuntime = readSource('assets/js/pages/lms-whiteboard-document-runtime.js');

        expect(runtime).toContain('function finalizeLmsWhiteboardTextBox');
        expect(runtime).toContain("LMS_WHITEBOARD_UI.tool === 'text'");
        expect(runtime).toContain("tool === 'text' && finishedStroke");
        expect(runtime).toContain("'sticky', 'text', 'image', 'document'");
        expect(runtime).toContain('repositionLmsWhiteboardInlineEditor(canvas)');
        expect(docRuntime).toContain('function handleLmsWhiteboardDocumentTextCommit');
        expect(docRuntime).toMatch(/if \(tool === 'text'\)[\s\S]*LMS_WHITEBOARD_UI\.drawing = true/);
        expect(docRuntime).toContain("tool === 'text' && LMS_WHITEBOARD_UI.currentStroke?.parentDocumentId");
        expect(docRuntime).toContain('layoutLmsWhiteboardText');
        expect(runtime).toContain('syncLmsWhiteboardTextHeight');
    });
});