import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('student-service chrome peel', () => {
    it('keeps chrome renderers out of the main orchestrator', () => {
        const main = readFileSync(join(process.cwd(), 'assets/js/pages/student-service.js'), 'utf8');
        const chrome = readFileSync(join(process.cwd(), 'assets/js/pages/student-service-chrome.js'), 'utf8');
        expect(main).not.toMatch(/^function renderStudentServiceCommandBar\b/m);
        expect(main).not.toMatch(/^function renderStudentServiceDeleteConfirmShell\b/m);
        expect(main).not.toMatch(/^function buildStudentServiceLaneMetrics\b/m);
        expect(main).toContain('student-service-chrome.js');
        expect(chrome).toMatch(/function renderStudentServiceCommandBar\b/);
        expect(chrome).toMatch(/function renderStudentServiceDeleteConfirmShell\b/);
        expect(chrome).toContain('window.renderStudentServiceCommandBar');
    });

    it('is wired between model and main on student-service.html', () => {
        const html = readFileSync(join(process.cwd(), 'student-service.html'), 'utf8');
        expect(html).toContain('student-service-model.js');
        expect(html).toContain('student-service-chrome.js');
        expect(html).toContain('student-service.js');
        const modelAt = html.indexOf('student-service-model.js');
        const chromeAt = html.indexOf('student-service-chrome.js');
        const eventsAt = html.indexOf('student-service-events.js');
        const mainAt = html.indexOf('pages/student-service.js');
        expect(modelAt).toBeGreaterThan(-1);
        expect(chromeAt).toBeGreaterThan(modelAt);
        expect(eventsAt).toBeGreaterThan(chromeAt);
        expect(mainAt).toBeGreaterThan(eventsAt);
    });
});
