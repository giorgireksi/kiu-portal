import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS file storage module split', () => {
    it('moves LMS file storage and draft-file helpers out of lms.js and into the dedicated module', () => {
        const lmsHtml = readSource('lms.html');
        const lmsSource = readSource('assets/js/pages/lms.js');
        const fileStorageRuntimeSource = readSource('assets/js/pages/lms-file-storage-runtime.js');
        const routeCss = readSource('assets/css/lms-route.css');

        expect(lmsHtml).toContain('assets/js/pages/lms-file-storage-runtime.js?v=20260518-lmsfiles1');
        expect(fileStorageRuntimeSource).toContain('function supportsLmsIndexedFileStorage()');
        expect(fileStorageRuntimeSource).toContain('function openLmsFileStorageDb()');
        expect(fileStorageRuntimeSource).toContain('async function persistLmsStoredFile(file, kind = \'file\')');
        expect(fileStorageRuntimeSource).toContain('async function downloadStoredFileByKey(storageKey, downloadName = \'download.bin\')');
        expect(fileStorageRuntimeSource).toContain('class="kiu-btn-outline lms-route-file-action-btn"');
        expect(fileStorageRuntimeSource).toContain('function renderLmsStoredFileAttachmentShell(file, options = {})');
        expect(fileStorageRuntimeSource).toContain("shellClass = 'lms-route-file-shell lms-route-field-mt-14'");
        expect(fileStorageRuntimeSource).toContain("actionsClass = 'lms-route-file-shell-actions'");
        expect(fileStorageRuntimeSource).not.toContain('style="padding:8px 12px; font-size:12px; display:inline-flex; align-items:center; gap:6px;"');
        expect(fileStorageRuntimeSource).toContain('function ensureSharedLmsFileInput()');
        expect(fileStorageRuntimeSource).toContain('input.hidden = true;');
        expect(fileStorageRuntimeSource).toContain('function storeLmsDraftFile(kind, key, fileRecord)');
        expect(fileStorageRuntimeSource).toContain('function pickLocalLmsFile(kind, key, labelId, accept = \'*/*\')');
        expect(routeCss).toContain('.lms-route-file-action-btn');
        expect(routeCss).toContain('.lms-route-file-shell {');
        expect(routeCss).toContain('.lms-route-file-shell-title {');
        expect(routeCss).toContain('.lms-route-file-shell-actions {');
        expect(lmsSource).not.toContain('function supportsLmsIndexedFileStorage()');
        expect(lmsSource).not.toContain('function openLmsFileStorageDb()');
        expect(lmsSource).not.toContain('async function persistLmsStoredFile(file, kind = \'file\')');
        expect(lmsSource).not.toContain('async function downloadStoredFileByKey(storageKey, downloadName = \'download.bin\')');
        expect(lmsSource).not.toContain('function renderLmsStoredFileAttachmentShell(file, options = {})');
        expect(lmsSource).not.toContain('function ensureSharedLmsFileInput()');
        expect(lmsSource).not.toContain('function storeLmsDraftFile(kind, key, fileRecord)');
        expect(lmsSource).not.toContain('function pickLocalLmsFile(kind, key, labelId, accept = \'*/*\')');
    });
});
