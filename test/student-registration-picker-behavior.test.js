import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('student registration picker behavior', () => {
    it('ships cache-busted registration assets and build marker', () => {
        const html = readSource('registration.html');
        const studentRegistration = readSource('assets/js/pages/student-registration.js');

        expect(html).toContain('student-registration.js?v=20260724-peelfix1');
        expect(html).toContain('registration-enrollment.js?v=20260608-regfix1');
        expect(studentRegistration).toContain("const REGISTRATION_PICKER_BUILD = '20260608-regfix1'");
        expect(studentRegistration).toContain('window.REGISTRATION_PICKER_BUILD = REGISTRATION_PICKER_BUILD');
        expect(studentRegistration).toContain('dataset.registrationPickerBuild = REGISTRATION_PICKER_BUILD');
    });

    it('exposes modal footer remove subject and capture-phase picker clicks', () => {
        const source = readSource('assets/js/pages/student-registration.js');

        expect(source).toContain('function buildStudentCourseSectionPickerFooter(courseId, courseName, hasSubjectSelection)');
        expect(source).toContain('registration-section-picker-remove-subject-btn');
        expect(source).toContain("event.stopImmediatePropagation()");
        expect(source).toContain('#student-course-section-picker-modal');
    });

    it('persists session type from admin scheduler deploy', () => {
        const scheduler = readSource('assets/js/pages/admin-scheduler.js');
        const schedulerHtml = readSource('admin-scheduler.html');

        expect(schedulerHtml).toContain('id="sch-session-type"');
        expect(scheduler).toContain('sessionType,');
        expect(scheduler).toContain('syncSchedulerSessionTypeDefault');
    });

    it('migrates available group session types on state hydrate', () => {
        const faculty = readSource('assets/js/shared/faculty.js');
        const state = readSource('assets/js/app/state.js');

        expect(faculty).toContain('function migrateAvailableGroupsSessionTypes()');
        expect(state).toContain('migrateAvailableGroupsSessionTypes()');
    });

    it('uses network-first caching for registration runtime scripts in the service worker', () => {
        const sw = readSource('service-worker.js');
        expect(sw).toContain('function isRegistrationRuntimeScriptRequest(url, request)');
        expect(sw).toContain('function handleRegistrationRuntimeScriptRequest(request, event)');
    });

    it('bumps portal cache reset for registration picker rollout', () => {
        const app = readSource('assets/js/app/app.js');
        const primer = readSource('assets/js/theme-primer.js');

        expect(app).toContain('REGISTRATION_PICKER_ASSET_TOKEN');
        expect(app).toContain("const PORTAL_CACHE_RESET_VERSION = '20260723-adaptive1'");
        expect(primer).toContain("var PORTAL_CACHE_RESET_VERSION = '20260609-bootguard1'");
        expect(app).toContain('function normalizeRuntimeScriptKey(src)');
        expect(app).toContain('function removeRuntimeScriptsWithPath(pathname)');
        expect(app).toContain('if (isStudentRoute && typeof window.renderStudentRegStructures === \'function\')');
    });
});