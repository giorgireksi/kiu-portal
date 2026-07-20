import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('student-service events peel', () => {
    it('keeps delegated handlers out of the main orchestrator', () => {
        const main = readFileSync(join(process.cwd(), 'assets/js/pages/student-service.js'), 'utf8');
        const events = readFileSync(join(process.cwd(), 'assets/js/pages/student-service-events.js'), 'utf8');
        expect(main).not.toMatch(/^function handleStudentServiceRootClick\b/m);
        expect(main).not.toMatch(/^function bindStudentServiceDelegatedInteractions\b/m);
        expect(main).not.toMatch(/^function handleStudentServiceModalDocumentClick\b/m);
        expect(main).toContain('student-service-events.js');
        expect(events).toMatch(/function handleStudentServiceRootClick\b/);
        expect(events).toMatch(/function bindStudentServiceDelegatedInteractions\b/);
        expect(events).toContain('window.bindStudentServiceDelegatedInteractions');
    });

    it('is wired between chrome and main on student-service.html', () => {
        const html = readFileSync(join(process.cwd(), 'student-service.html'), 'utf8');
        expect(html).toContain('student-service-chrome.js');
        expect(html).toContain('student-service-events.js');
        expect(html).toContain('student-service.js');
        const chromeAt = html.indexOf('student-service-chrome.js');
        const eventsAt = html.indexOf('student-service-events.js');
        const mainAt = html.indexOf('pages/student-service.js');
        expect(eventsAt).toBeGreaterThan(chromeAt);
        expect(mainAt).toBeGreaterThan(eventsAt);
    });
});
