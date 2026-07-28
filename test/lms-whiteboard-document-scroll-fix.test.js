import { describe, expect, it } from 'vitest';

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS whiteboard document scroll fix ux8', () => {
    const css = readSource('assets/css/lux-page-bare-lite.css');
    const docRuntime = readSource('assets/js/pages/lms-whiteboard-document-runtime.js');

    it('guards wheel zoom over document views in select', () => {
        const pointerRuntime = readSource('assets/js/pages/lms-whiteboard-pointer-runtime.js');

        expect(pointerRuntime).toContain("event.target.closest?.('[data-lms-whiteboard-document-view]')");
        expect(pointerRuntime).toContain("tool === 'select'");
    });

    it('keeps ink above preview for scroll and visibility', () => {
        const selectHandBlock = css.match(
            /\[data-lms-whiteboard-tool="select"\] \.lms-whiteboard-document-body[\s\S]*?pointer-events:\s*auto;\s*\}/
        )?.[0] || '';

        expect(css).toContain('.lms-whiteboard-document-layer');
        expect(css).toMatch(/lms-whiteboard-document-layer[\s\S]*overflow:\s*visible/);
        expect(css).toContain('[data-lms-whiteboard-tool="select"] .lms-whiteboard-document-frame');
        expect(selectHandBlock).not.toContain('z-index: 3');
        expect(css).toMatch(/\.lms-whiteboard-document-body[\s\S]*z-index:\s*1;/);
        expect(css).toMatch(/\.lms-whiteboard-document-ink[\s\S]*z-index:\s*2;/);
    });

    it('keeps document-body absolute in select/hand (no position:relative override)', () => {
        const selectHandBlock = css.match(
            /\[data-lms-whiteboard-tool="select"\] \.lms-whiteboard-document-body[\s\S]*?pointer-events:\s*auto;\s*\}/
        )?.[0] || '';

        expect(selectHandBlock).not.toContain('position: relative');
        expect(css).toMatch(/\.lms-whiteboard-document-body[\s\S]*position:\s*absolute;/);
    });

    it('keeps select tool document body scrollable without view-level blocking', () => {
        expect(css).toContain('[data-lms-whiteboard-tool="select"] .lms-whiteboard-document-body');
        expect(css).toMatch(/\[data-lms-whiteboard-tool="select"\] \.lms-whiteboard-document-body[\s\S]*overflow:\s*auto/);
        expect(css).toMatch(/\[data-lms-whiteboard-tool="select"\] \.lms-whiteboard-document-ink[\s\S]*pointer-events:\s*painted/);
        expect(css).not.toMatch(/\[data-lms-whiteboard-tool="select"\] \.lms-whiteboard-document-view\s*\{[^}]*pointer-events:\s*none/);
    });

    it('forwards wheel scroll inside document shells and steps pdf pages', () => {
        expect(docRuntime).toContain('function handleLmsWhiteboardDocumentWheel');
        expect(docRuntime).toContain('function getLmsWhiteboardDocumentScrollHost');
        expect(docRuntime).toContain('function stepLmsWhiteboardDocumentPage');
        expect(docRuntime).toContain('function syncLmsWhiteboardDocumentScrollState');
        expect(docRuntime).toContain('function getLmsWhiteboardDocumentChromeHandle');
        expect(docRuntime).toContain("mode === 'resize' ? 'auto' : 'painted'");
        expect(docRuntime).toContain('isLmsWhiteboardDocumentResizeMode(shell)');
    });

    it('gates document wheel to scroll mode only', () => {
        expect(docRuntime).toContain('if (isLmsWhiteboardDocumentResizeMode(shell)) return;');
    });

    it('adds scrollable docx preview surface', () => {
        expect(docRuntime).toContain('buildLmsWhiteboardDocxPreviewHtml');
        expect(docRuntime).toContain('lms-whiteboard-document-html lms-whiteboard-document-frame is-docx');
        expect(css).toMatch(/\[data-lms-whiteboard-tool="select"\] \.lms-whiteboard-document-html[\s\S]*overflow:\s*auto/);
        expect(css).toContain('.lms-whiteboard-document-html.is-docx p:last-child');
    });

    it('bumps cache to doc-annotate', () => {
        const html = readSource('lms.html');

        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('20260708-wb-shapes-v4');
    });
});