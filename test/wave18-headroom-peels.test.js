import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function lineCount(relativePath) {
    return readSource(relativePath).split('\n').length;
}

const peels = [
    {
        name: 'lms-whiteboard-selection',
        host: 'assets/js/pages/lms-whiteboard-runtime.js',
        peel: 'assets/js/pages/lms-whiteboard-selection-runtime.js',
        factory: '__kiuCreateLmsWhiteboardSelectionApi',
        loaded: '__KIU_LMS_WHITEBOARD_SELECTION_LOADED',
        marker: 'syncLmsWhiteboardSelectionToolbar',
        loadCheck() {
            const tabs = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
            expect(tabs.indexOf('lms-whiteboard-selection-runtime.js'))
                .toBeLessThan(tabs.indexOf('lms-whiteboard-runtime.js'));
        }
    },
    {
        name: 'lms-quiz-workspace-review',
        host: 'assets/js/pages/lms-quiz-workspace-runtime.js',
        peel: 'assets/js/pages/lms-quiz-workspace-review-runtime.js',
        factory: '__kiuCreateLmsQuizWorkspaceReviewApi',
        loaded: '__KIU_LMS_QUIZ_WORKSPACE_REVIEW_LOADED',
        marker: 'renderLmsQuizReviewPanel',
        loadCheck() {
            const tabs = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
            expect(tabs.indexOf('lms-quiz-workspace-review-runtime.js'))
                .toBeLessThan(tabs.indexOf('lms-quiz-workspace-runtime.js'));
        }
    },
    {
        name: 'students-command-academic',
        host: 'assets/js/pages/students-command-center.js',
        peel: 'assets/js/pages/students-command-academic-runtime.js',
        factory: '__kiuCreateStudentsCommandAcademicApi',
        loaded: '__KIU_STUDENTS_COMMAND_ACADEMIC_LOADED',
        marker: 'saveMobility',
        loadCheck() {
            const html = readSource('students-admin.html');
            expect(html.indexOf('students-command-academic-runtime.js'))
                .toBeLessThan(html.indexOf('students-command-center.js'));
        }
    },
    {
        name: 'admin-scheduler-session',
        host: 'assets/js/pages/admin-scheduler.js',
        peel: 'assets/js/pages/admin-scheduler-session-runtime.js',
        factory: '__kiuCreateAdminSchedulerSessionApi',
        loaded: '__KIU_ADMIN_SCHEDULER_SESSION_LOADED',
        marker: 'schCreateSession',
        loadCheck() {
            const html = readSource('admin-scheduler.html');
            expect(html.indexOf('admin-scheduler-session-runtime.js'))
                .toBeLessThan(html.indexOf('admin-scheduler.js'));
        }
    },
    {
        name: 'luxury-shell-topbar',
        host: 'assets/js/features/luxury-shell-chrome.js',
        peel: 'assets/js/features/luxury-shell-topbar-runtime.js',
        factory: '__kiuCreateLuxuryShellTopbarApi',
        loaded: '__KIU_LUXURY_SHELL_TOPBAR_LOADED',
        marker: 'syncTopbar',
        loadCheck() {
            const html = readSource('index.html');
            expect(html.indexOf('luxury-shell-topbar-runtime.js'))
                .toBeLessThan(html.indexOf('luxury-shell-chrome.js'));
        }
    },
    {
        name: 'messenger-chrome',
        host: 'assets/js/shared/messenger.js',
        peel: 'assets/js/shared/messenger-chrome-runtime.js',
        factory: '__kiuCreateMessengerChromeApi',
        loaded: '__KIU_MESSENGER_CHROME_LOADED',
        marker: 'handlePortalMessengerChromeClick',
        loadCheck() {
            const tabs = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
            expect(tabs.indexOf('messenger-chrome-runtime.js'))
                .toBeLessThan(tabs.indexOf('messenger.js'));
        }
    },
    {
        name: 'state-deleted-staff',
        host: 'assets/js/app/state.js',
        peel: 'assets/js/app/state-deleted-staff-runtime.js',
        factory: '__kiuCreateStateDeletedStaffApi',
        loaded: '__KIU_STATE_DELETED_STAFF_LOADED',
        marker: 'markStaffMemberDeleted',
        loadCheck() {
            const html = readSource('index.html');
            expect(html.indexOf('state-deleted-staff-runtime.js'))
                .toBeLessThan(html.indexOf('assets/js/app/state.js'));
        }
    },
    {
        name: 'social-workspace-graph-layout',
        host: 'assets/js/pages/social-workspace-graph-runtime.js',
        peel: 'assets/js/pages/social-workspace-graph-layout-runtime.js',
        factory: '__kiuCreateSocialWorkspaceGraphLayoutApi',
        loaded: '__KIU_SOCIAL_WORKSPACE_GRAPH_LAYOUT_LOADED',
        marker: 'findFreeProjectTaskGraphPosition',
        loadCheck() {
            const page = readSource('assets/js/pages/social-page.js');
            expect(page.indexOf('GRAPH_LAYOUT_RUNTIME_URL'))
                .toBeLessThan(page.indexOf('GRAPH_RUNTIME_URL ='));
        }
    },
    {
        name: 'student-registration-choice',
        host: 'assets/js/pages/student-registration.js',
        peel: 'assets/js/pages/student-registration-choice-runtime.js',
        factory: '__kiuCreateStudentRegistrationChoiceApi',
        loaded: '__KIU_STUDENT_REGISTRATION_CHOICE_LOADED',
        marker: 'setStudentRegistrationChoice',
        loadCheck() {
            const app = readSource('assets/js/app/app.js');
            expect(app.indexOf('student-registration-choice-runtime.js'))
                .toBeLessThan(app.indexOf("registrationRuntimeAsset('assets/js/pages/student-registration.js')"));
        }
    },
    {
        name: 'admin-registration-boot',
        host: 'assets/js/pages/admin-registration.js',
        peel: 'assets/js/pages/admin-registration-boot-runtime.js',
        factory: '__kiuCreateAdminRegistrationBootApi',
        loaded: '__KIU_ADMIN_REGISTRATION_BOOT_LOADED',
        marker: 'bootAdminRegistrationCms',
        loadCheck() {
            const app = readSource('assets/js/app/app.js');
            expect(app.indexOf('admin-registration-boot-runtime.js'))
                .toBeLessThan(app.indexOf('admin-registration.js?v='));
        }
    },
    {
        name: 'student-service-qa-staff',
        host: 'assets/js/pages/student-service-qa.js',
        peel: 'assets/js/pages/student-service-qa-staff-runtime.js',
        factory: '__kiuCreateStudentServiceQaStaffApi',
        loaded: '__KIU_STUDENT_SERVICE_QA_STAFF_LOADED',
        marker: 'renderStudentServiceStaffQaFeedMarkup',
        loadCheck() {
            const mod = readSource('assets/js/pages/student-service-modules-runtime.js');
            expect(mod.indexOf('STUDENT_SERVICE_QA_STAFF_URL'))
                .toBeLessThan(mod.indexOf('STUDENT_SERVICE_QA_MODULE_URL'));
            expect(mod).toContain('STUDENT_SERVICE_QA_STAFF_URL');
        }
    },
    {
        name: 'api-portal-persist',
        host: 'assets/js/app/api.js',
        peel: 'assets/js/app/api-portal-persist-runtime.js',
        factory: '__kiuCreateApiPortalPersistApi',
        loaded: '__KIU_API_PORTAL_PERSIST_LOADED',
        marker: 'buildPortalPersistableState',
        loadCheck() {
            const html = readSource('index.html');
            expect(html.indexOf('api-portal-persist-runtime.js'))
                .toBeLessThan(html.indexOf('assets/js/app/api.js'));
        }
    },
    {
        name: 'student-service-bootstrap',
        host: 'assets/js/pages/student-service.js',
        peel: 'assets/js/pages/student-service-bootstrap-runtime.js',
        factory: '__kiuCreateStudentServiceBootstrapApi',
        loaded: '__KIU_STUDENT_SERVICE_BOOTSTRAP_LOADED',
        marker: 'fetchStudentServiceBootstrap',
        loadCheck() {
            const html = readSource('student-service.html');
            expect(html.indexOf('student-service-bootstrap-runtime.js'))
                .toBeLessThan(html.indexOf('assets/js/pages/student-service.js'));
        }
    },
    {
        name: 'social-page-boot',
        host: 'assets/js/pages/social-page.js',
        peel: 'assets/js/pages/social-page-boot-runtime.js',
        factory: '__kiuCreateSocialPageBootApi',
        loaded: '__KIU_SOCIAL_PAGE_BOOT_LOADED',
        marker: 'bindEvents',
        loadCheck() {
            const html = readSource('social.html');
            expect(html.indexOf('social-page-boot-runtime.js'))
                .toBeLessThan(html.indexOf('social-page.js'));
        }
    },
    {
        name: 'exams-console-schedule',
        host: 'assets/js/pages/exams-console.js',
        peel: 'assets/js/pages/exams-console-schedule-runtime.js',
        factory: '__kiuCreateExamsConsoleScheduleApi',
        loaded: '__KIU_EXAMS_CONSOLE_SCHEDULE_LOADED',
        marker: 'detectScheduleCollisions',
        loadCheck() {
            const html = readSource('exams.html');
            expect(html.indexOf('exams-console-schedule-runtime.js'))
                .toBeLessThan(html.indexOf('exams-console.js'));
        }
    },
    {
        name: 'registration-curriculum',
        host: 'assets/js/pages/registration.js',
        peel: 'assets/js/pages/registration-curriculum-runtime.js',
        factory: '__kiuCreateRegistrationCurriculumApi',
        loaded: '__KIU_REGISTRATION_CURRICULUM_LOADED',
        marker: 'addSubjectToSystem',
        loadCheck() {
            const app = readSource('assets/js/app/app.js');
            expect(app.indexOf('registration-curriculum-runtime.js'))
                .toBeLessThan(app.indexOf("registrationRuntimeAsset('assets/js/pages/registration.js')"));
        }
    },
    {
        name: 'luxury-index-sync',
        host: 'assets/js/features/index-luxury.js',
        peel: 'assets/js/features/luxury-index-sync-runtime.js',
        factory: '__kiuCreateLuxuryIndexSyncApi',
        loaded: '__KIU_LUXURY_INDEX_SYNC_LOADED',
        marker: 'syncAll',
        loadCheck() {
            const html = readSource('index.html');
            expect(html.indexOf('luxury-index-sync-runtime.js'))
                .toBeLessThan(html.indexOf('index-luxury.js'));
        }
    },
    {
        name: 'faculty-messenger',
        host: 'assets/js/shared/faculty.js',
        peel: 'assets/js/shared/faculty-messenger-runtime.js',
        factory: '__kiuCreateFacultyMessengerApi',
        loaded: '__KIU_FACULTY_MESSENGER_LOADED',
        marker: 'renderPortalMessengerWorkspace',
        loadCheck() {
            const html = readSource('index.html');
            expect(html.indexOf('faculty-messenger-runtime.js'))
                .toBeLessThan(html.indexOf('assets/js/shared/faculty.js'));
        }
    },
    {
        name: 'lms-exam-session',
        host: 'assets/js/pages/lms.js',
        peel: 'assets/js/pages/lms-exam-session-runtime.js',
        factory: '__kiuCreateLmsExamSessionApi',
        loaded: '__KIU_LMS_EXAM_SESSION_LOADED',
        marker: 'finalizeLmsQuizSubmission',
        loadCheck() {
            const html = readSource('lms.html');
            expect(html.indexOf('lms-exam-session-runtime.js'))
                .toBeLessThan(html.indexOf('assets/js/pages/lms.js'));
        }
    },
    {
        name: 'lms-live-quiz-ui-staff',
        host: 'assets/js/pages/lms-live-quiz-ui-runtime.js',
        peel: 'assets/js/pages/lms-live-quiz-ui-staff-runtime.js',
        factory: '__kiuCreateLmsLiveQuizUiStaffApi',
        loaded: '__KIU_LMS_LIVE_QUIZ_UI_STAFF_LOADED',
        marker: 'refreshStaffLmsLiveQuizUi',
        loadCheck() {
            const tabs = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
            expect(tabs.indexOf('lms-live-quiz-ui-staff-runtime.js'))
                .toBeLessThan(tabs.indexOf('lms-live-quiz-ui-runtime.js'));
        }
    },
    {
        name: 'social-lite-invite',
        host: 'assets/js/shared/social-runtime-lite.js',
        peel: 'assets/js/shared/social-lite-invite-runtime.js',
        factory: '__kiuCreateSocialLiteInviteApi',
        loaded: '__KIU_SOCIAL_LITE_INVITE_LOADED',
        marker: 'inviteSocialGroupMember',
        loadCheck() {
            const html = readSource('social.html');
            expect(html.indexOf('social-lite-invite-runtime.js'))
                .toBeLessThan(html.indexOf('social-runtime-lite.js'));
            const host = readSource('assets/js/shared/social-runtime-lite.js');
            const inviteBlock = host.slice(
                host.indexOf('/* Wave 18: social-lite-invite-runtime.js */'),
                host.indexOf('__kiuCreateSocialLiteInviteApi(__w18Deps)')
            );
            expect(inviteBlock).toMatch(/currentUserId/);
            expect(inviteBlock).toMatch(/portalRequest/);
            expect(inviteBlock).toMatch(/loadSocialState/);
            expect(inviteBlock).toMatch(/upsertChat/);
            expect(inviteBlock).not.toMatch(/addToast/);
        }
    },
    {
        name: 'home-dashboard-gesture',
        host: 'assets/js/features/index-home-dashboard.plain.js',
        peel: 'assets/js/features/home-dashboard-gesture-runtime.js',
        factory: '__kiuCreateHomeDashboardGestureApi',
        loaded: '__KIU_HOME_DASHBOARD_GESTURE_LOADED',
        marker: 'beginDesktopWidgetGesture',
        loadCheck() {
            const html = readSource('index.html');
            expect(html.indexOf('home-dashboard-gesture-runtime.js'))
                .toBeLessThan(html.indexOf('index-home-dashboard.js'));
        }
    },
    {
        name: 'social-workspace-panel-team',
        host: 'assets/js/pages/social-workspace-panel.js',
        peel: 'assets/js/pages/social-workspace-panel-team-runtime.js',
        factory: '__kiuCreateSocialWorkspacePanelTeamApi',
        loaded: '__KIU_SOCIAL_WORKSPACE_PANEL_TEAM_LOADED',
        marker: 'renderTeamTab',
        loadCheck() {
            const page = readSource('assets/js/pages/social-page.js');
            expect(page.indexOf('PANEL_TEAM_URL'))
                .toBeLessThan(page.indexOf('PANEL_URL ='));
        }
    },
    {
        name: 'lms-live-quiz-access',
        host: 'assets/js/pages/lms-live-quiz-workspace-runtime.js',
        peel: 'assets/js/pages/lms-live-quiz-access-runtime.js',
        factory: '__kiuCreateLmsLiveQuizAccessApi',
        loaded: '__KIU_LMS_LIVE_QUIZ_ACCESS_LOADED',
        marker: 'canAccessLmsLiveQuizScope',
        loadCheck() {
            const tabs = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
            expect(tabs.indexOf('lms-live-quiz-access-runtime.js'))
                .toBeLessThan(tabs.indexOf('lms-live-quiz-workspace-runtime.js'));
        }
    },
    {
        name: 'lms-classroom-tabs-panel',
        host: 'assets/js/pages/lms-classroom-tabs-runtime.js',
        peel: 'assets/js/pages/lms-classroom-tabs-panel-runtime.js',
        factory: '__kiuCreateLmsClassroomTabsPanelApi',
        loaded: '__KIU_LMS_CLASSROOM_TABS_PANEL_LOADED',
        marker: 'openLMSGroups',
        loadCheck() {
            const html = readSource('lms.html');
            expect(html.indexOf('lms-classroom-tabs-panel-runtime.js'))
                .toBeLessThan(html.indexOf('lms-classroom-tabs-runtime.js'));
            const host = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
            expect(host).toContain('LMS_WHITEBOARD_MODULE_URLS');
            expect(host).toContain('lms-whiteboard-selection-runtime.js');
        }
    }
];

describe('Wave 18 headroom peels (≤2200)', () => {
    for (const peel of peels) {
        describe(peel.name, () => {
            it('exposes factory + load guard and Object.assign window api', () => {
                const source = readSource(peel.peel);
                expect(source).toContain(peel.loaded);
                expect(source).toContain(peel.factory);
                expect(source).toContain('Object.assign(window, api)');
                expect(source).toContain(peel.marker);
                if (peel.name === 'lms-exam-session') {
                    expect(source).not.toContain('bindLmsDelegatedMarkupActions()');
                    expect(readSource(peel.host)).toContain('bindLmsDelegatedMarkupActions()');
                }
            });

            it('keeps host ≤2200 and peel under headroom', () => {
                expect(lineCount(peel.host)).toBeLessThanOrEqual(2200);
                expect(lineCount(peel.peel)).toBeLessThanOrEqual(1400);
                peel.loadCheck();
            });
        });
    }

    it('leaves no oversized assets/js files ≥3300', () => {
        const root = join(process.cwd(), 'assets/js');
        const large = [];
        function walk(dir) {
            for (const name of readdirSync(dir)) {
                const full = join(dir, name);
                if (statSync(full).isDirectory()) walk(full);
                else if (name.endsWith('.js')) {
                    const n = readFileSync(full, 'utf8').split('\n').length;
                    if (n >= 3300) large.push(`${full.replace(process.cwd() + '/', '')}:${n}`);
                }
            }
        }
        walk(root);
        expect(large).toEqual([]);
    });

    it('loads api-portal-persist-runtime before api.js on every route that uses api.js', () => {
        const htmlFiles = readdirSync(process.cwd()).filter((name) => name.endsWith('.html'));
        htmlFiles.forEach((file) => {
            const html = readSource(file);
            if (!html.includes('assets/js/app/api.js')) return;
            expect(html, file).toContain('api-portal-persist-runtime.js');
            expect(html.indexOf('api-portal-persist-runtime.js'), file)
                .toBeLessThan(html.indexOf('assets/js/app/api.js'));
        });
    });
});
