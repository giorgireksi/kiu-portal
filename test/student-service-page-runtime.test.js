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

    it('exports renderStudentServicePage after page api init, not in inbox deps IIFE', () => {
        const main = readSource('assets/js/pages/student-service.js');
        const inboxExpose = main.split('(function exposeStudentServiceInboxDeps()')[1]?.split('})();')[0] || '';
        expect(inboxExpose).not.toContain('renderStudentServicePage');
        expect(main).toMatch(/\} = __ssvcPage;\s*\n\s*if \(typeof renderStudentServicePage === 'function'\)/);
        expect(main).toContain('window.renderStudentServicePage = renderStudentServicePage');
    });

    it('page runtime resolves bootstrap helpers from window at expose time', () => {
        const page = readSource('assets/js/pages/student-service-page-runtime.js');
        const bootstrap = readSource('assets/js/pages/student-service-bootstrap-runtime.js');
        expect(bootstrap).toContain('applyStudentServiceBootstrap,');
        expect(page).toContain('applyStudentServiceBootstrap: window.applyStudentServiceBootstrap');
        expect(page).toContain('preloadStudentServiceWorkspaceModules: window.preloadStudentServiceWorkspaceModules');
    });

    it('does not re-export dep wrappers that would recurse on window', () => {
        const page = readSource('assets/js/pages/student-service-page-runtime.js');
        const exposeBlock = page.split('__kiuSspExpose({')[2]?.split('});')[0] || '';
        expect(page).toContain('function __kiuSspResolveDep(name)');
        expect(page).toContain("__kiuSspResolveDep('syncStudentServiceWorkspaceBackendSession')");
        expect(page).toContain("__kiuSspResolveDep('buildStudentServiceArticleFingerprint')");
        expect(exposeBlock).not.toContain('syncStudentServiceWorkspaceBackendSession,');
        expect(exposeBlock).not.toContain('buildStudentServiceArticleFingerprint,');
        expect(page).toContain("__kiuSspResolveDep('getStudentServicePublishedInboxFilterLayout')");
        expect(exposeBlock).not.toContain('getStudentServicePublishedInboxFilterLayout,');
        expect(exposeBlock).not.toContain('canShowStudentServiceArticleEditorActions,');
    });
});
