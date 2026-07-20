import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('student-service-inbox-runtime peel', () => {
    it('owns inbox/UI/stores helpers outside student-service.js via factory', () => {
        const main = readSource('assets/js/pages/student-service.js');
        const inbox = readSource('assets/js/pages/student-service-inbox-runtime.js');
        expect(main).toContain('__kiuCreateStudentServiceInboxApi');
        expect(main).not.toMatch(/^function ensureStudentServiceUiState\b/m);
        expect(main).not.toMatch(/^function ensureStudentServiceStores\b/m);
        expect(main).not.toMatch(/^function buildStudentServiceMinimalInboxFilterLayout\b/m);
        expect(inbox).toContain('function ensureStudentServiceUiState');
        expect(inbox).toContain('function ensureStudentServiceStores');
        expect(inbox).toContain('__kiuCreateStudentServiceInboxApi');
        expect(inbox).toContain('__KIU_STUDENT_SERVICE_INBOX_LOADED');
    });

    it('loads before student-service.js on student-service.html', () => {
        const html = readSource('student-service.html');
        expect(html).toContain('student-service-inbox-runtime.js');
        expect(html.indexOf('student-service-inbox-runtime.js'))
            .toBeLessThan(html.indexOf('assets/js/pages/student-service.js'));
    });
});
