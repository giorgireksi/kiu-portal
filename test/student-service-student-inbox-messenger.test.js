import { describe, expect, it } from 'vitest';
import { expectRetiredCss } from './helpers/bare-shell-css.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (typeof existsSync === 'function' && !existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('student service student inbox messenger regressions', () => {
    it('renders messenger-style inbox rows and student-only search in My tickets', () => {
        const serviceSource = readSource('assets/js/pages/student-service-service.js');
        const source = readSource('assets/js/pages/student-service.js')
            + readSource('assets/js/pages/student-service-filters.js');
        const hub = readSource('assets/js/pages/student-service.js');

        expect(serviceSource).toContain('function renderStudentServiceTicketInboxRow(');
        expect(serviceSource).toContain('student-service-ticket-inbox-list');
        expect(serviceSource).toContain('Your conversations with Student Service');
        expect(serviceSource).toContain('renderStudentServiceStudentInboxFiltersMarkup');
        expect(serviceSource).not.toContain("renderStudentServiceInboxFiltersMarkup(ui, visibleTickets, currentUser, { layout: publishedLayout })");
        expect(source).toContain('Search conversations by title or topic');
        expect(hub).toContain('function getStudentServiceFilteredStudentTickets(');
        expect(hub).toContain('(layout?.filters || [])');
        expect(readSource('assets/js/pages/student-service-model.js')).toContain('function ssFormatRelativeTime(');
    });

    it('keeps right column messenger-ready with placeholder shell when no ticket is selected', () => {
        const serviceSource = readSource('assets/js/pages/student-service-service.js');

        expect(serviceSource).toContain('function renderStudentServiceTicketConversationPlaceholder(');
        expect(serviceSource).toContain('Send a request');
        expect(serviceSource).toContain('student-service-ticket-conversation-placeholder');
        expect(serviceSource).toContain('hasTickets: visibleTickets.length > 0');
        expect(serviceSource).toContain('student-service-track-compact-inline');
    });

    it('styles student inbox surfaces and bumps cache busters', () => {
        const html = readSource('student-service.html');
        const source = readSource('assets/js/pages/student-service.js');
        const serviceSource = readSource('assets/js/pages/student-service-service.js');



        expect(serviceSource).toContain('student-service-kicker lux-section-kicker">Inbox</div>');
        expect(serviceSource).toContain('student-service-ticket-composer--compact student-service-ticket-composer--placeholder');
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).toMatch(/student-service\.js\?v=/);
        expect(html).not.toContain('student-service-route.css');
        expectRetiredCss('student-service-route.css');
        expect(readSource('assets/js/pages/student-service-modules-runtime.js')).toContain('STUDENT_SERVICE_SERVICE_MODULE_URL');
        expect(html).toMatch(/student-service\.js\?v=/);
    });
});