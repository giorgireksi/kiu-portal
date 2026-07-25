import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function lineCount(relativePath) {
    return readSource(relativePath).split('\n').length;
}

const peels = [
    {
        name: 'home-dashboard-widget-layout',
        host: 'assets/js/features/index-home-dashboard.plain.js',
        peel: 'assets/js/features/home-dashboard-widget-layout-runtime.js',
        factory: '__kiuCreateHomeDashboardWidgetLayoutApi',
        loaded: '__KIU_HOME_DASHBOARD_WIDGET_LAYOUT_LOADED',
        loadCheck() {
            const html = readSource('index.html');
            expect(html.indexOf('home-dashboard-widget-layout-runtime.js'))
                .toBeLessThan(html.indexOf('assets/js/features/index-home-dashboard.js'));
        },
        marker: 'sanitizeGridInteger'
    },
    {
        name: 'social-workspace-graph-sync',
        host: 'assets/js/pages/social-workspace-graph-runtime.js',
        peel: 'assets/js/pages/social-workspace-graph-sync-runtime.js',
        factory: '__kiuCreateSocialWorkspaceGraphSyncApi',
        loaded: '__KIU_SOCIAL_WORKSPACE_GRAPH_SYNC_LOADED',
        loadCheck() {
            const page = readSource('assets/js/pages/social-page.js');
            expect(page).toContain('SOCIAL_WORKSPACE_GRAPH_SYNC_RUNTIME_URL');
            expect(page.indexOf('SOCIAL_WORKSPACE_GRAPH_SYNC_RUNTIME_URL'))
                .toBeLessThan(page.indexOf('SOCIAL_WORKSPACE_GRAPH_RUNTIME_URL'));
            expect(page.indexOf('SOCIAL_WORKSPACE_GRAPH_RUNTIME_URL'))
                .toBeLessThan(page.lastIndexOf('SOCIAL_WORKSPACE_MODULE_URL'));
        },
        marker: 'setProjectTaskGraphInteracting'
    },
    {
        name: 'lms-live-quiz-session',
        host: 'assets/js/pages/lms-live-quiz-ui-runtime.js',
        peel: 'assets/js/pages/lms-live-quiz-session-runtime.js',
        factory: '__kiuCreateLmsLiveQuizSessionApi',
        loaded: '__KIU_LMS_LIVE_QUIZ_SESSION_LOADED',
        loadCheck() {
            const tabs = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
            expect(tabs.indexOf('lms-live-quiz-session-runtime.js'))
                .toBeLessThan(tabs.indexOf('lms-live-quiz-ui-runtime.js'));
        },
        marker: 'createLmsLiveSession'
    },
    {
        name: 'luxury-shell-picker',
        host: 'assets/js/features/luxury-shell-chrome.js',
        peel: 'assets/js/features/luxury-shell-picker-runtime.js',
        factory: '__kiuCreateLuxuryShellPickerApi',
        loaded: '__KIU_LUXURY_SHELL_PICKER_LOADED',
        loadCheck() {
            const html = readSource('index.html');
            expect(html.indexOf('luxury-shell-picker-runtime.js'))
                .toBeLessThan(html.indexOf('luxury-shell-chrome.js'));
        },
        marker: 'enhanceUniversalPicker'
    },
    {
        name: 'lms-section-quiz',
        host: 'assets/js/pages/lms.js',
        peel: 'assets/js/pages/lms-section-quiz-runtime.js',
        factory: '__kiuCreateLmsSectionQuizApi',
        loaded: '__KIU_LMS_SECTION_QUIZ_LOADED',
        loadCheck() {
            const html = readSource('lms.html');
            expect(html.indexOf('lms-section-quiz-runtime.js'))
                .toBeLessThan(html.indexOf('assets/js/pages/lms.js'));
            const app = readSource('assets/js/app/app.js');
            expect(app).toContain('LMS_SECTION_QUIZ_RUNTIME_SCRIPT');
        },
        marker: 'normalizeLmsQuizStoredRecord'
    },
    {
        name: 'api-lms-portal',
        host: 'assets/js/app/api.js',
        peel: 'assets/js/app/api-lms-portal-runtime.js',
        factory: '__kiuCreateApiLmsPortalApi',
        loaded: '__KIU_API_LMS_PORTAL_LOADED',
        loadCheck() {
            const html = readSource('index.html');
            expect(html.indexOf('api-lms-portal-runtime.js'))
                .toBeLessThan(html.indexOf('assets/js/app/api.js'));
        },
        marker: 'fetchLmsLiveQuizWorkspace'
    },
    {
        name: 'student-registration-eligibility',
        host: 'assets/js/pages/student-registration.js',
        peel: 'assets/js/pages/student-registration-eligibility-runtime.js',
        factory: '__kiuCreateStudentRegistrationEligibilityApi',
        loaded: '__KIU_STUDENT_REGISTRATION_ELIGIBILITY_LOADED',
        loadCheck() {
            const html = readSource('registration.html');
            expect(html.indexOf('student-registration-eligibility-runtime.js'))
                .toBeLessThan(html.indexOf('student-registration.js'));
        },
        marker: 'evaluateStudentCourseEligibility'
    },
    {
        name: 'luxury-transparency-model',
        host: 'assets/js/features/index-luxury.js',
        peel: 'assets/js/features/luxury-transparency-model-runtime.js',
        factory: '__kiuCreateLuxuryTransparencyModelApi',
        loaded: '__KIU_LUXURY_TRANSPARENCY_MODEL_LOADED',
        loadCheck() {
            const html = readSource('index.html');
            expect(html.indexOf('luxury-transparency-model-runtime.js'))
                .toBeLessThan(html.indexOf('index-luxury.js'));
        },
        marker: 'buildLuxuryTransparencyModel'
    },
    {
        name: 'faculty-schedule',
        host: 'assets/js/shared/faculty.js',
        peel: 'assets/js/shared/faculty-schedule-runtime.js',
        factory: '__kiuCreateFacultyScheduleApi',
        loaded: '__KIU_FACULTY_SCHEDULE_LOADED',
        loadCheck() {
            const html = readSource('index.html');
            expect(html.indexOf('faculty-schedule-runtime.js'))
                .toBeLessThan(html.indexOf('assets/js/shared/faculty.js'));
        },
        marker: 'getCurrentWeekStartISO'
    },
    {
        name: 'registration-semester',
        host: 'assets/js/pages/registration.js',
        peel: 'assets/js/pages/registration-semester-runtime.js',
        factory: '__kiuCreateRegistrationSemesterApi',
        loaded: '__KIU_REGISTRATION_SEMESTER_LOADED',
        loadCheck() {
            const app = readSource('assets/js/app/app.js');
            expect(app.indexOf('registration-semester-runtime.js'))
                .toBeLessThan(app.indexOf("registrationRuntimeAsset('assets/js/pages/registration.js')"));
        },
        marker: 'normalizeSemesterList'
    }
];

describe('Wave 16 Size A+ factory peels', () => {
    for (const entry of peels) {
        describe(entry.name, () => {
            it('exposes factory + load guard + Object.assign', () => {
                const peel = readSource(entry.peel);
                const host = readSource(entry.host);
                expect(peel).toContain(entry.factory);
                expect(peel).toContain(entry.loaded);
                expect(peel).toContain('Object.assign(window, api)');
                expect(peel).toContain(entry.marker);
                expect(host).not.toMatch(new RegExp(`^\\s*function\\s+${entry.marker}\\b`, 'm'));
                expect(host).not.toMatch(new RegExp(`^\\s{4}function\\s+${entry.marker}\\b`, 'm'));
                expect(host).not.toMatch(new RegExp(`^\\s{8}function\\s+${entry.marker}\\b`, 'm'));
            });

            it('keeps host ≤1999 lines', () => {
                expect(lineCount(entry.host)).toBeLessThanOrEqual(1999);
            });

            it('wires load before host', () => {
                entry.loadCheck();
            });
        });
    }
});
