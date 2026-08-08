import { describe, expect, it } from 'vitest';
import { readLmsWhiteboardSource } from './helpers/lms-whiteboard-source.js';

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS whiteboard document interaction ux8', () => {
    const css = readSource('assets/css/lux-page-bare-lite.css');
    it('gates pointer events by active tool', () => {
        const chromeRuntime = readSource('assets/js/pages/lms-whiteboard-chrome-runtime.js');

        expect(css).toContain('[data-lms-whiteboard-tool="select"] .lms-whiteboard-document-body');
        expect(css).toContain('[data-lms-whiteboard-tool="pen"] .lms-whiteboard-document-ink');
        expect(css).toContain('[data-lms-whiteboard-tool="eraser"] .lms-whiteboard-document-ink');
        expect(chromeRuntime).toContain('stage.dataset.lmsWhiteboardTool = LMS_WHITEBOARD_UI.tool');
        expect(chromeRuntime).toContain('syncLmsWhiteboardDocumentToolMode');
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
        expect(docRuntime).toContain('isLmsWhiteboardDocumentScrollContentTarget');
        expect(docRuntime).not.toMatch(/closest\('iframe, \.lms-whiteboard-document-frame, \.lms-whiteboard-document-image'\)/);
        expect(docRuntime).toContain('img.draggable = false');
    });

    it('exposes shell drag and document stroke helpers from runtime', () => {
        const runtime = readLmsWhiteboardSource();
        const sessionRuntime = readSource('assets/js/pages/lms-whiteboard-session-runtime.js');
        const chromeRuntime = readSource('assets/js/pages/lms-whiteboard-chrome-runtime.js');
        const model = readSource('assets/js/pages/lms-whiteboard-model.js');
        const paintRuntime = readSource('assets/js/pages/lms-whiteboard-paint-runtime.js');

        expect(runtime).toContain('function beginLmsWhiteboardShellDrag');
        expect(runtime).toContain('function attachLmsWhiteboardShellDragWindowListeners');
        expect(runtime).toContain('function beginLmsWhiteboardDocumentStroke');
        expect(runtime).toContain('function scaleLmsWhiteboardDocumentStrokePoints');
        expect(sessionRuntime).toContain('function getActiveLmsWhiteboardShell');
        expect(runtime).toContain('function worldToStageOffset');
        expect(model).toContain("id: 'n'");
        expect(model).toContain("id: 'e'");
        expect(paintRuntime).toContain('skipDocumentSync');
        expect(chromeRuntime).toContain('data-lms-whiteboard-layers-list');
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
        const runtime = readLmsWhiteboardSource();
        const paintRuntime = readSource('assets/js/pages/lms-whiteboard-paint-runtime.js');

        expect(paintRuntime).toContain('if (element.parentDocumentId) return;');
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

    it('supports explicit scroll and resize interaction modes on document badge', () => {
        const docRuntime = readSource('assets/js/pages/lms-whiteboard-document-runtime.js');

        expect(docRuntime).toContain('documentInteractionMode');
        expect(docRuntime).toContain('function getLmsWhiteboardDocumentInteractionMode');
        expect(docRuntime).toContain('function setLmsWhiteboardDocumentInteractionMode');
        expect(docRuntime).toContain('function applyLmsWhiteboardDocumentInteractionMode');
        expect(docRuntime).toContain('function isLmsWhiteboardDocumentResizeMode');
        expect(docRuntime).toContain('buildLmsWhiteboardDocumentBadgeMarkup');
        expect(docRuntime).toContain('lms-whiteboard-document-badge-modes');
        expect(docRuntime).toContain('data-lms-whiteboard-document-mode="scroll"');
        expect(docRuntime).toContain('data-lms-whiteboard-document-mode="resize"');
        expect(docRuntime).toContain('dataset.lmsWhiteboardDocumentMode');
        expect(docRuntime).toContain('resolveLmsWhiteboardDocumentShellCanvas');
        expect(docRuntime).toContain('buildLmsWhiteboardMoveDragStart');
        expect(docRuntime).toContain('beginLmsWhiteboardCanvasGesture');
        expect(docRuntime).toContain('buildLmsWhiteboardMoveDragStart');
        expect(docRuntime).toContain('beginLmsWhiteboardCanvasGesture');
        expect(css).toContain('[data-lms-whiteboard-document-mode="resize"] .lms-whiteboard-document-body');
        expect(css).toContain('[data-lms-whiteboard-document-mode="resize"]');
        expect(css).toContain('.lms-whiteboard-document-mode-btn.is-active');
        expect(css).toContain('.lms-whiteboard-document-badge-label');
    });

    it('supports resize zones, hover cursors, and document child resize', () => {
        const runtime = readLmsWhiteboardSource();
        const model = readSource('assets/js/pages/lms-whiteboard-model.js');
        const docRuntime = readSource('assets/js/pages/lms-whiteboard-document-runtime.js');

        expect(model).toContain('function hitTestLmsWhiteboardResizeZone');
        expect(runtime).toContain('function getLmsWhiteboardResizeHandleCursor');
        expect(runtime).toContain('function applyLmsWhiteboardStrokeBoundsResize');
        expect(runtime).toContain('syncLmsWhiteboardPointerCursor');
        expect(css).toContain('[data-lms-whiteboard-tool="select"] .lms-whiteboard-canvas');
        expect(css).toContain('.lms-whiteboard-document-edge-handle');
        expect(css).toContain('cursor: nesw-resize');
        expect(docRuntime).toContain('lms-whiteboard-document-edge-handle');
        expect(docRuntime).toContain('paintDocumentChildResizeHandles');
        expect(docRuntime).toContain('resize-document-child');
        expect(docRuntime).toContain('syncLmsWhiteboardDocumentPointerCursor');
    });

    it('bumps lms cache to document mode toggles', () => {
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('20260808-overallperf1');
    });

    it('defers heavy document repaint during layout-only reposition', () => {
        const runtime = readLmsWhiteboardSource();
        const docRuntime = readSource('assets/js/pages/lms-whiteboard-document-runtime.js');
        const pointerRuntime = readSource('assets/js/pages/lms-whiteboard-pointer-runtime.js');
        const paintRuntime = readSource('assets/js/pages/lms-whiteboard-paint-runtime.js');

        expect(runtime).toContain('function abortLmsWhiteboardShellDrag');
        expect(runtime).toContain('e.buttons === 0');
        expect(runtime).toContain("document.addEventListener('pointerup', onEnd, true)");
        expect(runtime).toContain('if (edgeHandle) return false');
        expect(docRuntime).toContain('cancelLmsWhiteboardDocumentPdfPaint');
        expect(docRuntime).toContain('RenderingCancelledException');
        expect(docRuntime).toContain('layoutOnly');
        expect(docRuntime).toContain('function getLmsWhiteboardDocumentChromeHandle');
        expect(docRuntime).toContain('isLmsWhiteboardDocumentScrollContentTarget');
        expect(docRuntime).toContain('syncLmsWhiteboardDocumentScrollState');
        expect(docRuntime).toContain('lmsWhiteboardScrollable');
        expect(pointerRuntime).toContain('repositionLmsWhiteboardDocumentViewers(canvas, { layoutOnly: true })');
        expect(pointerRuntime).toContain('finalizeLmsWhiteboardDocumentLayout(canvas, element.id)');
        expect(paintRuntime).toContain('layoutOnly: true');
        expect(docRuntime).toContain('lms-whiteboard-document-html');
        expect(docRuntime).not.toContain('sandbox=""');
        expect(docRuntime).not.toContain('allow-scripts allow-same-origin');
    });

    it('locks document resize aspect using badge-aware shell resize', () => {
        const runtime = readLmsWhiteboardSource();

        expect(runtime).toContain('function getLmsWhiteboardDocumentBadgeHeight');
        expect(runtime).toContain('function applyLmsWhiteboardDocumentShellResize');
        expect(runtime).toContain('function getLmsWhiteboardDocumentContentAspect');
        expect(runtime).toContain('if (edgeHandle) return false');
        expect(runtime).toContain('return Boolean(getLmsWhiteboardDocumentContentAspect(element))');
        expect(runtime).toContain('getLmsWhiteboardDocumentBadgeHeight');
        expect(css).toContain('.lms-whiteboard-document-view.is-resizing .lms-whiteboard-document-ink');
        expect(css).toMatch(/document-edge-handle\[data-handle="n"\][\s\S]*height:\s*10px/);
        expect(readSource('assets/js/pages/lms-whiteboard-document-runtime.js')).toContain('clearLmsWhiteboardDocumentPointerCursor');
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
        const runtime = readLmsWhiteboardSource();
        const pointerRuntime = readSource('assets/js/pages/lms-whiteboard-pointer-runtime.js');
        const docRuntime = readSource('assets/js/pages/lms-whiteboard-document-runtime.js');

        expect(runtime).toContain('function finalizeLmsWhiteboardTextBox');
        expect(pointerRuntime).toContain("LMS_WHITEBOARD_UI.tool === 'text'");
        expect(pointerRuntime).toContain("tool === 'text' && finishedStroke");
        expect(pointerRuntime).toContain("'sticky', 'text', 'image', 'document'");
        expect(runtime).toContain('repositionLmsWhiteboardInlineEditor(canvas)');
        expect(docRuntime).toContain('function handleLmsWhiteboardDocumentTextCommit');
        expect(docRuntime).toMatch(/if \(tool === 'text'\)[\s\S]*LMS_WHITEBOARD_UI\.drawing = true/);
        expect(docRuntime).toContain("tool === 'text' && LMS_WHITEBOARD_UI.currentStroke?.parentDocumentId");
        expect(docRuntime).toContain('layoutLmsWhiteboardText');
        expect(runtime).toContain('syncLmsWhiteboardTextHeight');
    });
});