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
        name: 'lms-whiteboard-session',
        host: 'assets/js/pages/lms-whiteboard-runtime.js',
        peel: 'assets/js/pages/lms-whiteboard-session-runtime.js',
        factory: '__kiuCreateLmsWhiteboardSessionApi',
        loaded: '__KIU_LMS_WHITEBOARD_SESSION_LOADED',
        marker: 'bindLmsWhiteboardSection',
        loadCheck() {
            const tabs = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
            expect(tabs.indexOf('lms-whiteboard-session-runtime.js'))
                .toBeLessThan(tabs.indexOf('lms-whiteboard-runtime.js?v='));
        }
    },
    {
        name: 'lms-quiz-workspace-session',
        host: 'assets/js/pages/lms-quiz-workspace-runtime.js',
        peel: 'assets/js/pages/lms-quiz-workspace-session-runtime.js',
        factory: '__kiuCreateLmsQuizWorkspaceSessionApi',
        loaded: '__KIU_LMS_QUIZ_WORKSPACE_SESSION_LOADED',
        marker: 'saveLmsQuizBuilderDraft',
        loadCheck() {
            const tabs = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
            expect(tabs.indexOf('lms-quiz-workspace-session-runtime.js'))
                .toBeLessThan(tabs.indexOf('lms-quiz-workspace-runtime.js?v='));
        }
    },
    {
        name: 'social-page-interactions',
        host: 'assets/js/pages/social-page.js',
        peel: 'assets/js/pages/social-page-interactions-runtime.js',
        factory: '__kiuCreateSocialPageInteractionsApi',
        loaded: '__KIU_SOCIAL_PAGE_INTERACTIONS_LOADED',
        marker: 'renderSocialPageNow',
        loadCheck() {
            const html = readSource('social.html');
            expect(html.indexOf('social-page-interactions-runtime.js'))
                .toBeLessThan(html.indexOf('assets/js/pages/social-page.js'));
        }
    },
    {
        name: 'social-lite-content',
        host: 'assets/js/shared/social-runtime-lite.js',
        peel: 'assets/js/shared/social-lite-content-runtime.js',
        factory: '__kiuCreateSocialLiteContentApi',
        loaded: '__KIU_SOCIAL_LITE_CONTENT_LOADED',
        marker: 'createPost',
        loadCheck() {
            const html = readSource('social.html');
            expect(html.indexOf('social-lite-content-runtime.js'))
                .toBeLessThan(html.indexOf('social-runtime-lite.js'));
        }
    },
    {
        name: 'student-service-ops',
        host: 'assets/js/pages/student-service.js',
        peel: 'assets/js/pages/student-service-ops-runtime.js',
        factory: '__kiuCreateStudentServiceOpsApi',
        loaded: '__KIU_STUDENT_SERVICE_OPS_LOADED',
        marker: 'submitStudentServiceTicket',
        loadCheck() {
            const html = readSource('student-service.html');
            expect(html.indexOf('student-service-ops-runtime.js'))
                .toBeLessThan(html.indexOf('assets/js/pages/student-service.js'));
        }
    },
    {
        name: 'admin-registration-cms',
        host: 'assets/js/pages/admin-registration.js',
        peel: 'assets/js/pages/admin-registration-cms-runtime.js',
        factory: '__kiuCreateAdminRegistrationCmsApi',
        loaded: '__KIU_ADMIN_REGISTRATION_CMS_LOADED',
        marker: 'renderAdminRegistrationModules',
        loadCheck() {
            const app = readSource('assets/js/app/app.js');
            expect(app.indexOf('admin-registration-cms-runtime.js'))
                .toBeLessThan(app.indexOf('admin-registration.js?v='));
        }
    },
    {
        name: 'lms-classroom-tabs-shell',
        host: 'assets/js/pages/lms-classroom-tabs-runtime.js',
        peel: 'assets/js/pages/lms-classroom-tabs-shell-runtime.js',
        factory: '__kiuCreateLmsClassroomTabsShellApi',
        loaded: '__KIU_LMS_CLASSROOM_TABS_SHELL_LOADED',
        marker: 'switchLMSTab',
        loadCheck() {
            const html = readSource('lms.html');
            expect(html.indexOf('lms-classroom-tabs-shell-runtime.js'))
                .toBeLessThan(html.indexOf('lms-classroom-tabs-runtime.js'));
            const host = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
            expect(host).toContain('LMS_WHITEBOARD_MODULE_URLS');
            expect(host).toContain('LMS_QUIZ_MODULE_URLS');
            expect(host).toContain('lms-whiteboard-session-runtime.js');
            expect(host).toContain('lms-quiz-workspace-session-runtime.js');
        }
    },
    {
        name: 'exams-console-workspace',
        host: 'assets/js/pages/exams-console.js',
        peel: 'assets/js/pages/exams-console-workspace-runtime.js',
        factory: '__kiuCreateExamsConsoleWorkspaceApi',
        loaded: '__KIU_EXAMS_CONSOLE_WORKSPACE_LOADED',
        marker: 'renderWorkspace',
        loadCheck() {
            const html = readSource('exams.html');
            expect(html.indexOf('exams-console-workspace-runtime.js'))
                .toBeLessThan(html.indexOf('exams-console.js'));
        }
    }
];

describe('Wave 17 zero ≥2k peels', () => {
    for (const peel of peels) {
        describe(peel.name, () => {
            it('exposes factory + load guard and Object.assign window api', () => {
                const source = readSource(peel.peel);
                expect(source).toContain(peel.loaded);
                expect(source).toContain(peel.factory);
                expect(source).toContain('Object.assign(window, api)');
                expect(source).toContain(peel.marker);
            });

            it('keeps host ≤2200 and wires load order', () => {
                expect(lineCount(peel.host)).toBeLessThanOrEqual(2200);
                expect(lineCount(peel.peel)).toBeLessThanOrEqual(1500);
                peel.loadCheck();
            });
        });
    }

    it('leaves no oversized assets/js files ≥3300', () => {
        const { readdirSync, statSync } = require('fs');
        const { join } = require('path');
        const root = join(process.cwd(), 'assets/js');
        const large = [];
        function walk(dir) {
            for (const name of readdirSync(dir)) {
                const full = join(dir, name);
                const st = statSync(full);
                if (st.isDirectory()) {
                    if (['node_modules', '_archive', 'vendor'].includes(name)) continue;
                    walk(full);
                    continue;
                }
                if (!name.endsWith('.js')) continue;
                const lines = readFileSync(full, 'utf8').split('\n').length;
                if (lines >= 3300) large.push(full.replace(process.cwd() + '/', '') + ` (${lines})`);
            }
        }
        walk(root);
        expect(large).toEqual([]);
    });
});
