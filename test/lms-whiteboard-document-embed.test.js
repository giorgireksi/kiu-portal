import { describe, expect, it } from 'vitest';
import { readLmsWhiteboardSource } from './helpers/lms-whiteboard-source.js';

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS whiteboard document embed', () => {
    it('exposes live document layer helpers', () => {
        const runtime = readSource('assets/js/pages/lms-whiteboard-document-runtime.js');

        expect(runtime).toContain('function syncLmsWhiteboardDocumentLayer');
        expect(runtime).toContain('function importLmsWhiteboardDocumentFile');
        expect(runtime).toContain('function repositionLmsWhiteboardDocumentViewers');
        expect(runtime).toContain('const expectedWidth');
        expect(runtime).toContain('if (inkCanvas.width !== expectedWidth)');
        expect(runtime).toContain('function scheduleLmsWhiteboardDocumentInk');
        expect(runtime).toContain('function flushLmsWhiteboardDocumentInk');
        expect(runtime).toContain('inline=1');
        expect(runtime).toContain("type: 'document'");
    });

    it('loads document runtime before main whiteboard runtime', () => {
        const html = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        const docIndex = html.indexOf('lms-whiteboard-document-runtime.js?v=20260808-overallperf1');
        const mainIndex = html.indexOf('lms-whiteboard-runtime.js?v=20260808-overallperf1');

        expect(docIndex).toBeGreaterThan(-1);
        expect(mainIndex).toBeGreaterThan(docIndex);
    });

    it('accepts pdf, word, excel, and image uploads in the file input', () => {
        const sessionRuntime = readSource('assets/js/pages/lms-whiteboard-session-runtime.js');
        const runtime = readLmsWhiteboardSource();
        const docRuntime = readSource('assets/js/pages/lms-whiteboard-document-runtime.js');

        expect(sessionRuntime).toContain('accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv');
        expect(docRuntime).toContain('isLmsWhiteboardImportableFile');
        expect(runtime).toContain('importLmsWhiteboardDocumentFile');
        expect(docRuntime).toContain('syncLmsWhiteboardDocumentLayer');
    });

    it('styles document overlay layer in route css', () => {
        const css = readSource('assets/css/lux-page-bare-lite.css');
        expect(css).toContain('.lms-whiteboard-document-layer');
        expect(css).toContain('.lms-whiteboard-document-view');
        expect(css).toContain('.lms-whiteboard-document-frame');
        expect(css).toContain('.lms-whiteboard-document-badge');
    });

    it('serves stored files inline for iframe preview', () => {
        const routes = readSource('backend/platform/routes/files-routes.js');

        expect(routes).toContain("request.query?.inline");
        expect(routes).toContain('Content-Disposition');
        expect(routes).toMatch(/inline \? 'inline' : 'attachment'/);
    });

    it('normalizes document elements in the whiteboard service', () => {
        const service = readSource('backend/platform/domains/lms-whiteboard-service.js');

        expect(service).toContain("type === 'document'");
        expect(service).toContain('storageKey');
        expect(service).toContain('mimeType');
        expect(service).toContain('fileName');
    });
});