import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function lineCount(relativePath) {
    const text = readSource(relativePath);
    return text.length ? text.replace(/\n$/, '').split(/\r?\n/).length : 0;
}

describe('student-service-modules-runtime peel', () => {
    it('owns lazy loaders + hub stubs outside student-service.js via factory', () => {
        const main = readSource('assets/js/pages/student-service.js');
        const modules = readSource('assets/js/pages/student-service-modules-runtime.js');
        expect(main).toContain('__kiuCreateStudentServiceModulesApi');
        expect(main).not.toMatch(/^function hasStudentServiceQaModule\b/m);
        expect(main).not.toMatch(/^function ensureStudentServiceQaModule\b/m);
        expect(main).not.toMatch(/^function captureStudentServiceLazyModuleStubs\b/m);
        expect(main).not.toMatch(/^function renderStudentServiceStudentHub\b/m);
        expect(modules).toContain('function hasStudentServiceQaModule');
        expect(modules).toContain('function ensureStudentServiceQaModule');
        expect(modules).toContain('function captureStudentServiceLazyModuleStubs');
        expect(modules).toContain('function renderStudentServiceStudentHub');
        expect(modules).toContain('__kiuCreateStudentServiceModulesApi');
        expect(modules).toContain('__KIU_STUDENT_SERVICE_MODULES_LOADED');
    });

    it('loads before student-service.js on student-service.html', () => {
        const html = readSource('student-service.html');
        expect(html).toContain('student-service-modules-runtime.js');
        expect(html.indexOf('student-service-modules-runtime.js'))
            .toBeLessThan(html.indexOf('assets/js/pages/student-service.js'));
    });

    it('resolves lazy module exports from KiuStudentService before window forwards', () => {
        const modules = readSource('assets/js/pages/student-service-modules-runtime.js');
        const resolveBlock = modules.split('function resolveStudentServiceExportImpl(name)')[1]?.split('window.resolveStudentServiceExportImpl')[0] || '';
        expect(resolveBlock.indexOf('const bag = window.KiuStudentService'))
            .toBeLessThan(resolveBlock.indexOf('const direct = window[name]'));
    });

    it('prefers window hub exports over stale bag stubs when checking module readiness', () => {
        const modules = readSource('assets/js/pages/student-service-modules-runtime.js');
        expect(modules).toContain('function liveStudentServiceExport(name, stub)');
        expect(modules).toContain("liveStudentServiceExport('renderStudentServiceStudentHub', STUDENT_SERVICE_STUDENT_HUB_STUB)");
        expect(modules).toContain('window.renderStudentServiceStudentQaHub !== studentQaHubStub');
        expect(modules).toContain('delete window.__KIU_STUDENT_SERVICE_QA_THREAD_LOADED');
    });

    it('keeps host under the Structure 10 line ceiling', () => {
        expect(lineCount('assets/js/pages/student-service.js')).toBeLessThanOrEqual(2999);
        expect(lineCount('assets/js/pages/student-service-modules-runtime.js')).toBeLessThanOrEqual(700);
    });
});
