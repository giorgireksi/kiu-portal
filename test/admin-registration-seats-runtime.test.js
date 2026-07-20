import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('admin-registration-seats-runtime peel', () => {
    it('owns seat limit + student registration data adapters via factory', () => {
        const main = readSource('assets/js/pages/admin-registration.js');
        const peel = readSource('assets/js/pages/admin-registration-seats-runtime.js');
        expect(main).not.toMatch(/^\s*function normalizeAssignedSeatLimit\b/m);
        expect(main).not.toMatch(/^\s*function buildStudentCourseRefFromAssignment\b/m);
        expect(peel).toContain('function normalizeAssignedSeatLimit');
        expect(peel).toContain('function buildStudentCourseRefFromAssignment');
        expect(peel).toContain('__kiuCreateAdminRegistrationSeatsApi');
        expect(peel).toContain('__KIU_ADMIN_REGISTRATION_SEATS_LOADED');
        expect(peel).toContain('Object.assign(window, api)');
    });

    it('loads before admin-registration.js in REGISTRATION_RUNTIME_SCRIPTS', () => {
        const app = readSource('assets/js/app/app.js');
        expect(app.indexOf('admin-registration-seats-runtime.js'))
            .toBeLessThan(app.indexOf('admin-registration-cms-runtime.js'));
        expect(app.indexOf('admin-registration-cms-runtime.js'))
            .toBeLessThan(app.indexOf('admin-registration.js?v='));
    });
});
