import { describe, expect, it } from 'vitest';
import { expectLmsRouteCssLinks } from './helpers/lms-route-css.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS whiteboard file preview fix', () => {
    it('uploads whiteboard files bridge-first with indexeddb fallback', () => {
        const docRuntime = readSource('assets/js/pages/lms-whiteboard-document-runtime.js');

        expect(docRuntime).toContain('function uploadLmsWhiteboardStoredFile');
        expect(docRuntime).toContain("uploadPortalStoredFile(payload, 'whiteboard')");
        expect(docRuntime).toContain("storageBackend: 'indexeddb'");
        expect(docRuntime).not.toContain('persistLmsStoredFile');
    });

    it('resolves preview blobs from bridge or indexeddb', () => {
        const docRuntime = readSource('assets/js/pages/lms-whiteboard-document-runtime.js');

        expect(docRuntime).toContain('function resolveLmsWhiteboardFileBlob');
        expect(docRuntime).toContain('function resolveLmsWhiteboardFileObjectUrl');
        expect(docRuntime).toContain('getLmsFileBlob(storageKey)');
        expect(docRuntime).toContain('URL.createObjectURL(blob)');
        expect(docRuntime).toContain('revokeLmsWhiteboardDocumentShellUrl');
    });

    it('renders pdf on canvas and images via object urls', () => {
        const docRuntime = readSource('assets/js/pages/lms-whiteboard-document-runtime.js');

        expect(docRuntime).toContain('paintLmsWhiteboardDocumentPdfCanvas');
        expect(docRuntime).toContain('lms-whiteboard-document-pdf-canvas');
        expect(docRuntime).toContain('lms-whiteboard-document-image');
        expect(docRuntime).toContain('storageBackend: uploaded.storageBackend');
    });

    it('exports indexeddb helpers and treats external as bridge upload', () => {
        const fileStorage = readSource('assets/js/pages/lms-file-storage-runtime.js');

        expect(fileStorage).toContain('window.getLmsFileBlob = getLmsFileBlob');
        expect(fileStorage).toContain("preferredStorage === 'external'");
    });

    it('normalizes storageBackend on document elements', () => {
        const service = readSource('backend/platform/domains/lms-whiteboard-service.js');

        expect(service).toContain('next.storageBackend');
    });

    it('surfaces import errors from file router', () => {
        const runtime = readSource('assets/js/pages/lms-whiteboard-runtime.js');

        expect(runtime).toContain('void importLmsWhiteboardDocumentFile(resourceKey, file, point).catch');
    });

    it('bumps file preview fix cache bust tokens in lms.html', () => {
        const html = readSource('lms.html');

        expectLmsRouteCssLinks(html);
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-whiteboard-document-runtime.js?v=20260708-wb-shapes-v4');
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-whiteboard-runtime.js?v=20260710-personal-dashboard-share1');
    });
});