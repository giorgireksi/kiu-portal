import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { readFileSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');
const {
    hasStudentServiceMessageContent,
    normalizeStudentServiceAttachments,
    normalizeStudentServiceInternalNote
} = require('../backend/platform/domains/student-service-service.js');

const tempDirs = [];

function makeTempDir() {
    const dir = mkdtempSync(join(tmpdir(), 'kiu-ssvc-attachments-'));
    tempDirs.push(dir);
    return dir;
}

function buildDataUrl(text) {
    return `data:text/plain;base64,${Buffer.from(text, 'utf8').toString('base64')}`;
}

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function seedStudentServiceAccounts(store) {
    store.state.accounts['student-1'] = {
        id: 'student-1',
        name: 'Student One',
        nameEn: 'Student One',
        displayName: 'Student One',
        role: 'student',
        facultyCode: 'ECON',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    };
    store.state.accounts['svc-1'] = {
        id: 'svc-1',
        name: 'Service Desk',
        nameEn: 'Service Desk',
        displayName: 'Service Desk',
        role: 'student_service',
        facultyCode: 'ECON',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    };
}

function buildAttachmentPayload(actorId, label = 'screenshot.png') {
    return [{
        name: label,
        type: 'image/png',
        dataUrl: buildDataUrl('attachment payload')
    }];
}

afterEach(() => {
    while (tempDirs.length) {
        rmSync(tempDirs.pop(), { recursive: true, force: true });
    }
});

describe('student service attachments', () => {
    it('accepts message-or-attachment content in domain helpers', () => {
        const files = normalizeStudentServiceAttachments([{
            id: 'file-1',
            name: 'receipt.pdf',
            type: 'application/pdf',
            storageKey: 'file-1',
            storageBackend: 'bridge'
        }]);

        expect(hasStudentServiceMessageContent('', files)).toBe(true);
        expect(hasStudentServiceMessageContent('Need help', [])).toBe(true);
        expect(hasStudentServiceMessageContent('', [])).toBe(false);

        const note = normalizeStudentServiceInternalNote({
            message: '',
            attachments: files
        }, 0);
        expect(note.attachments).toHaveLength(1);
        expect(note.message).toBe('');
    });

    it('creates tickets, replies, internal notes, and Q&A with attachments only', () => {
        const store = new PlatformStore({ uploadsDir: makeTempDir(), maxFileUploadBytes: 4096 });
        seedStudentServiceAccounts(store);

        const ticket = store.createStudentServiceTicket({
            title: 'Broken portal',
            message: '',
            category: 'Technical Issue',
            attachments: buildAttachmentPayload('student-1')
        }, 'student-1');

        expect(ticket.error).toBeUndefined();
        expect(ticket.thread[0].attachments).toHaveLength(1);
        expect(ticket.thread[0].message).toBe('');

        const reply = store.replyStudentServiceTicket(ticket.id, {
            message: '',
            attachments: buildAttachmentPayload('svc-1', 'staff-reply.pdf')
        }, 'svc-1');

        expect(reply.error).toBeUndefined();
        expect(reply.thread).toHaveLength(2);
        expect(reply.thread[1].attachments).toHaveLength(1);

        const note = store.addStudentServiceInternalNote(ticket.id, {
            message: '',
            attachments: buildAttachmentPayload('svc-1', 'internal-note.txt')
        }, 'svc-1');

        expect(note.error).toBeUndefined();
        expect(note.internalNotes.at(-1).attachments).toHaveLength(1);

        const question = store.createStudentServiceQuestion({
            title: 'Where is the form?',
            body: '',
            category: 'General Question',
            attachments: buildAttachmentPayload('student-1', 'form.png')
        }, 'student-1');

        expect(question.error).toBeUndefined();
        expect(question.attachments).toHaveLength(1);

        const answer = store.addStudentServiceQuestionAnswer(question.id, {
            body: '',
            attachments: buildAttachmentPayload('svc-1', 'answer.pdf')
        }, 'svc-1');

        expect(answer.error).toBeUndefined();
        expect(answer.attachments).toHaveLength(1);
    });

    it('wires attachment pickers and galleries across student service composers', () => {
        const source = readSource('assets/js/pages/student-service.js')
            + readSource('assets/js/pages/student-service-attachments.js')
            + readSource('assets/js/pages/student-service-tickets.js')
            + readSource('assets/js/pages/student-service-qa.js');
        const serviceSource = readSource('assets/js/pages/student-service-service.js');
        const css = readSource('assets/css/student-service-route.css');

        expect(source).toContain('const STUDENT_SERVICE_MAX_ATTACHMENTS = 5');
        expect(source).toContain("renderStudentServiceAttachmentPickerMarkup('qa-question')");
        expect(source).toContain('function renderStudentServiceAttachmentPickerMarkup(');
        expect(serviceSource).toContain("renderStudentServiceAttachmentPickerMarkup('ticket-create')");
        expect(serviceSource).toContain("composerId: 'ticket-reply'");
        expect(serviceSource).toContain("'internal-note-modal' : 'internal-note'");
        expect(source).toContain('uploadPortalStoredFile(draft, \'student-service\')');
        expect(source).toContain('filter(note => note.message || note.attachments?.length)');
        expect(source).toContain('renderStudentServiceQuestionCardPreviewMarkup');
        expect(serviceSource).toContain('renderStudentServiceTicketNotesSidebar');
        expect(serviceSource).toContain('renderStudentServiceAttachmentGalleryMarkup(entry.attachments)');
        expect(css).toContain('.student-service-attachment-toolbar');
        expect(css).toContain('.student-service-attachment-gallery');
        expect(css).toContain('.student-service-ticket-notes-sidebar');
    });
});