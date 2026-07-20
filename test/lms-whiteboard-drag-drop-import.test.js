import { describe, expect, it } from 'vitest';
import { expectLmsRouteCssLinks } from './helpers/lms-route-css.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS whiteboard drag-drop import', () => {
    it('renders a drop overlay on the whiteboard stage', () => {
        const runtime = readSource('assets/js/pages/lms-whiteboard-runtime.js');

        expect(runtime).toContain('data-lms-whiteboard-drop-overlay');
        expect(runtime).toContain('Drop PDF, Word, Excel, or images here');
    });

    it('routes dropped and picked files through a shared import helper', () => {
        const runtime = readSource('assets/js/pages/lms-whiteboard-runtime.js');
        const bindBlock = runtime.match(/function bindLmsWhiteboardSection[\s\S]*?(?=\nfunction )/)?.[0] || '';

        expect(runtime).toContain('function importLmsWhiteboardFileAtPoint');
        expect(runtime).toContain('function importLmsWhiteboardDroppedFiles');
        expect(runtime).toContain('function bindLmsWhiteboardFileDrop');
        expect(bindBlock).toContain('importLmsWhiteboardFileAtPoint(resourceKey, file)');
        expect(bindBlock).toContain('bindLmsWhiteboardFileDrop(stage, resourceKey, canEdit, canvas)');
        const dropBlock = runtime.match(/function bindLmsWhiteboardFileDrop[\s\S]*?(?=\nfunction )/)?.[0] || '';
        expect(dropBlock).toContain("event.dataTransfer.dropEffect = 'copy'");
    });

    it('detects importable files by mime and extension', () => {
        const docRuntime = readSource('assets/js/pages/lms-whiteboard-document-runtime.js');

        expect(docRuntime).toContain('function isLmsWhiteboardImportableFile');
        expect(docRuntime).toMatch(/isLmsWhiteboardDocumentMime\(mimeType = '', fileName = ''\)/);
        expect(docRuntime).toContain('isLmsWhiteboardSpreadsheetMime');
        expect(docRuntime).toContain('isLmsWhiteboardImageMime');
    });

    it('styles the drag target overlay', () => {
        expect(css).toContain('.lms-whiteboard-drop-overlay');
        expect(css).toContain('.lms-whiteboard-drop-overlay-copy');
        expect(css).toContain('.lms-whiteboard-stage.is-drop-active');
    });

    it('bumps drag-drop cache bust tokens in lms.html', () => {
        const html = readSource('lms.html');

        expectLmsRouteCssLinks(html);
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-whiteboard-document-runtime.js?v=20260708-wb-shapes-v4');
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-whiteboard-runtime.js?v=20260710-personal-dashboard-share1');
    });
});