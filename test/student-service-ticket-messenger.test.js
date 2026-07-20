import { describe, expect, it } from 'vitest';
import { expectRetiredCss } from './helpers/bare-shell-css.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (typeof existsSync === 'function' && !existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('student service ticket messenger regressions', () => {
    it('ships messenger conversation shell builders and bubble alignment helpers', () => {
        const serviceSource = readSource('assets/js/pages/student-service-service.js');

        expect(serviceSource).toContain('function renderStudentServiceTicketConversationShell(');
        expect(serviceSource).toContain('function renderStudentServiceTicketBubble(');
        expect(serviceSource).toContain('function isStudentServiceTicketBubbleMine(');
        expect(serviceSource).toContain('student-service-ticket-msg-row');
        expect(serviceSource).toContain('student-service-ticket-chat-log lux-scrollbar');
        expect(serviceSource).toContain('data-student-service-open-ticket-fullscreen="true"');
        expect(serviceSource).toContain('renderStudentServiceTicketNotesSidebar');
        expect(serviceSource).toContain('renderStudentServiceTicketNotesAccordion');
        expect(serviceSource).not.toContain('student-service-ticket-detail-copy student-service-ticket-detail-copy--summary">${ssEscape(selectedTicket.latestPreview');
        const conversationHeaderFn = serviceSource.match(/function renderStudentServiceTicketConversationHeader[\s\S]*?\n    \}/)?.[0] || '';
        expect(conversationHeaderFn).not.toContain('student-service-ticket-detail-meta');
        expect(conversationHeaderFn).not.toContain('getStudentServiceSupportArea(ticket.serviceArea)');
        expect(serviceSource).toContain('student-service-ticket-composer--compact');
        expect(serviceSource).toContain('student-service-ticket-composer-main');
        expect(serviceSource).toContain('student-service-ticket-composer-toolbar');
        expect(serviceSource).toContain("renderStudentServiceAttachmentPickerMarkup(composerId, { chipsOnly: true })");
    });

    it('wires fullscreen ticket thread modal lifecycle in student-service.js', () => {
        const source = readSource('assets/js/pages/student-service.js')
            + readSource('assets/js/pages/student-service-tickets.js');
        const serviceSource = readSource('assets/js/pages/student-service-service.js');

        expect(source).toContain('function mountStudentServiceTicketThreadModal(');
        expect(source).toContain('function closeStudentServiceTicketThreadModal(');
        expect(source).toContain('function remountStudentServiceTicketThreadModal(');
        expect(source).toContain('data-student-service-ticket-thread-modal="true"');
        expect(source).toContain('data-student-service-dismiss-ticket-thread-modal="true"');
        expect(source).toContain('getStudentServiceTicketReplyTextareaId');
        expect(source).toContain('getStudentServiceInternalNoteComposerId');
        expect(source).toContain("toggleStudentServiceDetailSection('internalNotes')");
        expect(source).toContain('ticketThreadModalOpen');
        expect(serviceSource).toContain('data-student-service-toggle-internal-notes="true"');
    });

    it('styles messenger ticket conversation and fullscreen modal surfaces', () => {
        const html = readSource('student-service.html');










        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).not.toContain('student-service-route.css');
        expectRetiredCss('student-service-route.css');
        expect(html).toMatch(/student-service\.js\?v=/);
    });

    it('scrolls every visible ticket chat log after replies and modal mounts', () => {
        const source = readSource('assets/js/pages/student-service.js')
            + readSource('assets/js/pages/student-service-tickets.js');

        expect(source).toContain('function scrollStudentServiceTicketChatLog(');
        expect(source).toContain("querySelectorAll('[data-student-service-ticket-chat-log=\"1\"]')");
        expect(source).toContain('roots.forEach((root) => {');
    });

    it('supports chips-only attachment markup for compact ticket composers', () => {
        const source = readSource('assets/js/pages/student-service.js')
            + readSource('assets/js/pages/student-service-attachments.js');

        expect(source).toContain('function renderStudentServiceAttachmentChipsMarkup(');
        expect(source).toContain('options.chipsOnly');
        expect(source).toContain('data-student-service-attachment-chips=');
    });
});