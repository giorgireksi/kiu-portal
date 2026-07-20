/**
 * Wave 21 — globals debt source locks (student-service bag + portal API stubs).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readAsset(rel) {
    return readFileSync(join(process.cwd(), rel), 'utf8');
}

function bareWindowAssigns(src) {
    return [...src.matchAll(/\bwindow\.([A-Za-z_$][\w$]*)\s*=(?!=)/g)]
        .map((m) => m[1])
        .filter((n) => !n.startsWith('__KIU_') && !n.startsWith('__kiu') && !n.startsWith('Kiu'));
}

describe('Wave 21 globals debt', () => {
    it('exposes KiuStudentService bag + resolver before host modules', () => {
        const modules = readAsset('assets/js/pages/student-service-modules-runtime.js');
        const inbox = readAsset('assets/js/pages/student-service-inbox-runtime.js');
        expect(modules).toContain('window.KiuStudentService');
        expect(modules).toContain('function resolveStudentServiceExportImpl');
        expect(modules).toContain('window.resolveStudentServiceExportImpl');
        expect(inbox).toContain('resolveStudentServiceExportImpl');
    });

    it('collapses filters/qa/tickets onto the bag with thin hub flats only', () => {
        const qa = readAsset('assets/js/pages/student-service-qa.js');
        const filters = readAsset('assets/js/pages/student-service-filters.js');
        const tickets = readAsset('assets/js/pages/student-service-tickets.js');
        const host = readAsset('assets/js/pages/student-service.js');
        expect(qa).toContain('__kiuSsApi');
        expect(filters).toContain('__kiuSsApi');
        expect(tickets).toContain('__kiuSsApi');
        expect(bareWindowAssigns(qa).length).toBeLessThanOrEqual(15);
        expect(bareWindowAssigns(filters).length).toBeLessThanOrEqual(10);
        expect(bareWindowAssigns(tickets).length).toBeLessThanOrEqual(8);
        expect(bareWindowAssigns(host).length).toBeLessThanOrEqual(25);
    });

    it('peels portal API stubs before app.js', () => {
        const stubs = readAsset('assets/js/app/portal-api-stubs-runtime.js');
        const app = readAsset('assets/js/app/app.js');
        const index = readAsset('index.html');
        expect(stubs).toContain('__kiuCreatePortalApiStubsApi');
        expect(stubs).toContain('__KIU_PORTAL_API_STUBS_LOADED');
        expect(stubs).toContain('window.KiuPortalApiStubs');
        expect(app).toContain('portal-api-stubs-runtime.js');
        expect(bareWindowAssigns(app).length).toBeLessThanOrEqual(40);
        expect(index).toContain('portal-api-stubs-runtime.js');
        expect(index.indexOf('portal-api-stubs-runtime.js')).toBeLessThan(index.indexOf('assets/js/app/app.js'));
    });
});
