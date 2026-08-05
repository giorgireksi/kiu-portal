import { describe, expect, it } from 'vitest';
import { readLmsWhiteboardSource } from './helpers/lms-whiteboard-source.js';
import { expectLmsRouteCssLinks } from './helpers/lms-route-css.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS whiteboard viewport import', () => {
    it('exposes viewport bounds and import box helpers', () => {
        const runtime = readLmsWhiteboardSource();

        expect(runtime).toContain('function getLmsWhiteboardVisibleWorldBounds');
        expect(runtime).toContain('function computeLmsWhiteboardImportBox');

        expect(runtime).toContain('LMS_WHITEBOARD_LOGICAL_WIDTH / zoom');
        expect(runtime).toMatch(/fill[\s\S]*0\.55/);
        expect(runtime).toMatch(/margin[\s\S]*0\.10/);
    });

    it('routes all importable files through stored document upload', () => {
        const runtime = readLmsWhiteboardSource();
        const routerBlock = runtime.match(/function importLmsWhiteboardFileAtPoint[\s\S]*?(?=\nfunction )/)?.[0] || '';

        expect(routerBlock).toContain('isLmsWhiteboardImportableFile(file)');
        expect(routerBlock).toContain('importLmsWhiteboardDocumentFile(resourceKey, file, point)');
        expect(routerBlock).not.toContain('importLmsWhiteboardImageFile(resourceKey, file');
    });

    it('sizes imports from viewport and supports spreadsheets and images', () => {
        const docRuntime = readSource('assets/js/pages/lms-whiteboard-document-runtime.js');

        expect(docRuntime).toContain('computeLmsWhiteboardImportBox');
        expect(docRuntime).toContain('readLmsWhiteboardDocumentAspectRatio');
        expect(docRuntime).toContain('LMS_WHITEBOARD_A4_ASPECT');
        expect(docRuntime).toContain('ensureLmsWhiteboardPdfJs');
        expect(docRuntime).toContain('readLmsWhiteboardPdfAspectRatio');
        expect(docRuntime).toContain('getViewport');
        expect(docRuntime).toContain('paintLmsWhiteboardDocumentPdfCanvas');
        expect(docRuntime).toContain('lms-whiteboard-document-pdf-canvas');
        expect(docRuntime).toContain('pageAspect');
        expect(docRuntime).toContain('LMS_WHITEBOARD_DOCUMENT_BADGE_HEIGHT');
        expect(docRuntime).toContain('fill: 0.55');
        expect(docRuntime).toContain('ensureLmsWhiteboardSheetJs');
        expect(docRuntime).toContain('buildLmsWhiteboardSpreadsheetPreviewHtml');
        expect(docRuntime).toContain('lms-whiteboard-document-image');
        expect(docRuntime).toContain('isLmsWhiteboardSpreadsheetMime');
    });

    it('accepts excel files in the file picker', () => {
        const sessionRuntime = readSource('assets/js/pages/lms-whiteboard-session-runtime.js');

        expect(sessionRuntime).toContain('.xls,.xlsx,.csv');
        expect(sessionRuntime).toContain('Drop PDF, Word, Excel, or images here');
    });

    it('overlays document badge and removes whiteboard panel padding', () => {
        const css = readSource('assets/css/lux-page-bare-lite.css');
        expect(css).toMatch(/\.lms-whiteboard-document-body[\s\S]*bottom:\s*28px;/);
        expect(css).toMatch(/\.lms-whiteboard-panel\.lms-live-panel[\s\S]*padding:\s*0;/);
        expect(css).toContain('background: #fff');
    });

    it('sizes shell aspect with badge-aware content height', () => {
        const docRuntime = readSource('assets/js/pages/lms-whiteboard-document-runtime.js');

        expect(docRuntime).toContain('const contentH = Math.sqrt(area / aspect)');
        expect(docRuntime).toContain('const nextH = contentH + LMS_WHITEBOARD_DOCUMENT_BADGE_HEIGHT');
        expect(docRuntime).toContain('box.h += LMS_WHITEBOARD_DOCUMENT_BADGE_HEIGHT');
    });

    it('bumps viewport import cache bust tokens in lms.html', () => {
        const html = readSource('lms.html');

        expectLmsRouteCssLinks(html);
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-whiteboard-document-runtime.js?v=20260729-wbdocmode5');
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-whiteboard-runtime.js?v=20260729-wbdocmode5');
    });
});