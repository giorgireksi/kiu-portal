import { describe, expect, it } from 'vitest';
import { readLmsWhiteboardSource } from './helpers/lms-whiteboard-source.js';
import { expectLmsRouteCssLinks } from './helpers/lms-route-css.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS whiteboard contextual cursor', () => {
    const css = readSource('assets/css/lux-page-bare-lite.css');

    it('resolves cursor from pan, select hover, and draw tools', () => {
        const runtime = readLmsWhiteboardSource();

        expect(runtime).toContain('function resolveLmsWhiteboardPointerCursor');
        expect(runtime).toContain('function refreshLmsWhiteboardPointerCursor');
        expect(runtime).toContain("if (LMS_WHITEBOARD_UI.panning) return 'grabbing'");
        expect(runtime).not.toContain("if (LMS_WHITEBOARD_UI.spaceHeld) return 'grab'");
        expect(runtime).toContain('canMoveLmsWhiteboardElement(hit, resourceKey)');
        expect(runtime).toContain("return 'not-allowed'");
        expect(runtime).toContain("return 'move'");
        expect(runtime).toContain('refreshLmsWhiteboardPointerCursor(canvas, { point: null })');
        expect(runtime).not.toContain('LMS_WHITEBOARD_UI.spaceHeld = true');
        expect(runtime).toContain('refreshLmsWhiteboardPointerCursor(canvas');
        expect(runtime).toContain('function resolveLmsWhiteboardPointerCursor');
    });

    it('syncs document ink and shell cursors with child hover and shell drag zones', () => {
        const docRuntime = readSource('assets/js/pages/lms-whiteboard-document-runtime.js');

        expect(docRuntime).toContain('function syncLmsWhiteboardDocumentPointerCursor');
        expect(docRuntime).toContain('findLmsWhiteboardDocumentChildAtPoint(resourceKey, elementId, localPoint)');
        expect(docRuntime).toContain('[data-lms-whiteboard-document-drag]');
        expect(docRuntime).toContain('window.syncLmsWhiteboardDocumentPointerCursor = syncLmsWhiteboardDocumentPointerCursor');
    });

    it('removes blanket grab cursors and adds stage cursor hooks', () => {
        const imageBlock = css.match(/\.lms-whiteboard-document-image\s*\{[^}]+\}/)?.[0] || '';
        const badgeBlock = css.match(/\.lms-whiteboard-document-badge\s*\{[^}]+\}/)?.[0] || '';

        expect(imageBlock).not.toContain('cursor: grab');
        expect(badgeBlock).not.toContain('cursor: grab');
        expect(css).toContain('[data-lms-whiteboard-cursor="move"] .lms-whiteboard-document-image');
        expect(css).toContain('[data-lms-whiteboard-cursor="grab"] .lms-whiteboard-canvas');
        expect(css).toContain('[data-lms-whiteboard-cursor="default"] .lms-whiteboard-document-body');
    });

    it('bumps whiteboard cursor cache tokens in lms.html', () => {
        const html = readSource('lms.html');

        expectLmsRouteCssLinks(html);
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-whiteboard-document-runtime.js?v=20260729-wbdocmode5');
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-whiteboard-runtime.js?v=20260729-wbdocmode5');
    });
});
