import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('student-service-page-runtime peel', () => {
    it('owns article/page/bootstrap outside student-service.js via factory', () => {
        const main = readSource('assets/js/pages/student-service.js');
        const page = readSource('assets/js/pages/student-service-page-runtime.js');
        expect(main).toContain('__kiuCreateStudentServicePageApi');
        expect(main).not.toMatch(/^async function deleteStudentServiceArticle\b/m);
        expect(main).not.toMatch(/^function renderStudentServicePage\b/m);
        expect(main).not.toMatch(/^async function bootstrapStudentServicePage\b/m);
        expect(page).toContain('function deleteStudentServiceArticle');
        expect(page).toContain('function renderStudentServicePage');
        expect(page).toContain('function bootstrapStudentServicePage');
        expect(page).toContain('__kiuCreateStudentServicePageApi');
        expect(page).toContain('__KIU_STUDENT_SERVICE_PAGE_RUNTIME_LOADED');
    });

    it('loads before student-service.js on student-service.html', () => {
        const html = readSource('student-service.html');
        expect(html).toContain('student-service-page-runtime.js');
        expect(html.indexOf('student-service-page-runtime.js'))
            .toBeLessThan(html.indexOf('assets/js/pages/student-service.js'));
    });
});
