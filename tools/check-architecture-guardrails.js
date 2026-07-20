const fs = require('fs');
const path = require('path');
const {
    routeVisualClassification,
    allowedLuxuryShellInlineStylePages,
    routeCssSharedSelectorZeroBudgetFiles,
    getDedicatedRouteCss,
    getSharedRouteCssOverrideFindings
} = require('./visual-route-classification');

const ROOT = path.resolve(__dirname, '..');
const jsCeilingsOnly = process.argv.includes('--js-ceilings-only');

const explicitMobileShellRouteGuardrails = {
    'admin-orders.html': { category: 'standard-shell', dedicatedCss: ['assets/css/lux-page-bare-lite.css'], mobileShell: 'shared-standalone' },
    'admin-tools.html': { category: 'special-surface', dedicatedCss: ['assets/css/lux-page-bare-lite.css'], mobileShell: 'shared-standalone' },
    'admin-scheduler.html': { category: 'special-surface', dedicatedCss: ['assets/css/lux-page-bare-lite.css'], mobileShell: 'shared-standalone' }
};

/** Wave 11+ peels must expose a factory marker (__kiuCreate* / createKiu*). Allowlist grows with each peel. */
const factoryPeelAllowlist = [
    'assets/js/features/luxury-palette-runtime.js',
    'assets/js/features/luxury-atmosphere-runtime.js',
    'assets/js/features/luxury-shell-studio-runtime.js',
    'assets/js/features/luxury-shell-picker-runtime.js',
    'assets/js/features/luxury-transparency-model-runtime.js',
    'assets/js/pages/student-service-page-runtime.js',
    'assets/js/pages/student-service-inbox-runtime.js',
    'assets/js/pages/student-service-modules-runtime.js',
    'assets/js/pages/social-page-survey-runtime.js',
    'assets/js/pages/social-page-feed-runtime.js',
    'assets/js/pages/social-page-shell-runtime.js',
    'assets/js/pages/social-workspace-graph-sync-runtime.js',
    'assets/js/pages/lms-whiteboard-chrome-runtime.js',
    'assets/js/shared/social-lite-project-runtime.js',
    'assets/js/pages/lms-classroom-sessions-runtime.js',
    'assets/js/features/home-dashboard-widget-data-runtime.js',
    'assets/js/features/home-dashboard-widget-layout-runtime.js',
    'assets/js/pages/admin-registration-seats-runtime.js',
    'assets/js/pages/lms-quiz-focus-runtime.js',
    'assets/js/app/api-lms-portal-runtime.js',
    'assets/js/pages/lms-live-quiz-session-runtime.js',
    'assets/js/pages/lms-section-quiz-runtime.js',
    'assets/js/pages/student-registration-eligibility-runtime.js',
    'assets/js/shared/lux-transparency-route-runtime.js',
    'assets/js/shared/faculty-schedule-runtime.js',
    'assets/js/pages/registration-semester-runtime.js',
    'assets/js/pages/gradebook-weights-runtime.js',
    'assets/js/pages/gradebook-history-ui-runtime.js',
    'assets/js/pages/gradebook-quiz-map-runtime.js',
    'assets/js/pages/gradebook-components-runtime.js',
    'assets/js/pages/admin-scheduler-faculty-runtime.js',
    'assets/js/shared/messenger-gradebook-runtime.js',
    'assets/js/pages/students-command-mobility-runtime.js',
    'assets/js/pages/form-builder-actions-runtime.js',
    'assets/js/pages/student-service-qa-thread-runtime.js',
    'assets/js/pages/social-workspace-events-input-runtime.js',
    'assets/js/pages/social-workspace-events-submit-runtime.js',
    'assets/js/pages/social-workspace-panel-budget-runtime.js',
    'assets/js/pages/lms-whiteboard-session-runtime.js',
    'assets/js/pages/lms-quiz-workspace-session-runtime.js',
    'assets/js/pages/social-page-interactions-runtime.js',
    'assets/js/shared/social-lite-content-runtime.js',
    'assets/js/pages/student-service-ops-runtime.js',
    'assets/js/pages/admin-registration-cms-runtime.js',
    'assets/js/pages/lms-classroom-tabs-shell-runtime.js',
    'assets/js/pages/exams-console-workspace-runtime.js',
    'assets/js/pages/lms-whiteboard-selection-runtime.js',
    'assets/js/pages/lms-quiz-workspace-review-runtime.js',
    'assets/js/features/luxury-shell-topbar-runtime.js',
    'assets/js/shared/messenger-chrome-runtime.js',
    'assets/js/app/state-deleted-staff-runtime.js',
    'assets/js/app/state-admin-exam-runtime.js',
    'assets/js/pages/student-registration-choice-runtime.js',
    'assets/js/pages/admin-registration-boot-runtime.js',
    'assets/js/app/api-portal-persist-runtime.js',
    'assets/js/app/api-admin-merge-runtime.js',
    'assets/js/pages/student-service-bootstrap-runtime.js',
    'assets/js/shared/faculty-messenger-runtime.js',
    'assets/js/pages/registration-curriculum-runtime.js',
    'assets/js/pages/lms-exam-session-runtime.js',
    'assets/js/pages/lms-live-quiz-ui-staff-runtime.js',
    'assets/js/pages/lms-live-quiz-access-runtime.js',
    'assets/js/pages/lms-classroom-tabs-panel-runtime.js',
    'assets/js/pages/exams-console-schedule-runtime.js',
    'assets/js/pages/students-command-academic-runtime.js',
    'assets/js/pages/admin-scheduler-session-runtime.js',
    'assets/js/pages/student-service-qa-staff-runtime.js',
    'assets/js/features/luxury-index-sync-runtime.js',
    'assets/js/features/luxury-index-home-shell-runtime.js',
    'assets/js/shared/social-lite-invite-runtime.js',
    'assets/js/features/home-dashboard-gesture-runtime.js',
    'assets/js/pages/social-page-boot-runtime.js',
    'assets/js/pages/social-workspace-graph-layout-runtime.js',
    'assets/js/pages/social-workspace-panel-team-runtime.js',
    'assets/js/pages/form-blueprint-runtime.js',
    'assets/js/app/portal-compat-runtime.js',
    'assets/js/pages/social-workspace.js',
    'assets/js/app/portal-api-stubs-runtime.js',
];

/** Allowed window.* assignment prefixes on factory peels (Structure scorecard Wave 14). */
const factoryPeelAllowedWindowAssignPrefixes = [
    '__KIU_',
    '__kiu',
    'Kiu'
];


const lineCountThresholds = [
    {
        file: 'backend/platform/store.js',
        maxLines: 5000,
        reason: 'Post-split ceiling now that bounded backend domain ownership has moved out of store.js.'
    },
    {
        file: 'backend/platform/server.js',
        maxLines: 3000,
        reason: 'Post-route-split ceiling now that server.js is acting as a composition root.'
    },
    {
        file: 'assets/js/pages/lms.js',
        maxLines: 1850,
        reason: 'Wave 18: host ≤1850 after headroom peel. Wave 16: section/quiz helpers peeled to lms-section-quiz-runtime.js.'
    },
    {
        file: 'assets/js/pages/lms-section-quiz-runtime.js',
        maxLines: 1000,
        reason: 'LMS section keys + quiz bank/normalize helpers peeled from lms.js.'
    },
    {
        file: 'assets/js/pages/lms-quiz-blue-runtime.js',
        maxLines: 500,
        reason: 'Kiu Blue helper/gate/heartbeat peeled from lms.js.'
    },
    {
        file: 'assets/js/features/index-luxury.js',
        maxLines: 1850,
        reason: 'Wave 18: host ≤1850 after headroom peel. Wave 16: transparency model + shortcut helpers in luxury-transparency-model-runtime.js.'
    },
    {
        file: 'assets/js/features/luxury-transparency-model-runtime.js',
        maxLines: 500,
        reason: 'Transparency model + shortcut/layout helpers peeled from index-luxury.js.'
    },
    {
        file: 'assets/js/features/luxury-atmosphere-runtime.js',
        maxLines: 750,
        reason: 'Theme/background/particle/fog/mixer peeled from index-luxury.js.'
    },
    {
        file: 'assets/js/features/luxury-palette-runtime.js',
        maxLines: 450,
        reason: 'Color helpers + palette resolve peeled from index-luxury.js.'
    },
    {
        file: 'assets/js/features/luxury-shell-chrome.js',
        maxLines: 1850,
        reason: 'Wave 18: host ≤1850 after headroom peel. Wave 16: picker/utility chrome peeled to luxury-shell-picker-runtime.js.'
    },
    {
        file: 'assets/js/features/luxury-shell-picker-runtime.js',
        maxLines: 950,
        reason: 'Utility panels + universal picker chrome peeled from luxury-shell-chrome.js.'
    },
    {
        file: 'assets/js/features/luxury-shell-studio-runtime.js',
        maxLines: 750,
        reason: 'Fog profile studio UI peeled from luxury-shell-chrome.js (factory+deps).'
    },
    {
        file: 'assets/js/pages/registration.js',
        maxLines: 1850,
        reason: 'Wave 18: host ≤1850 after headroom peel. Wave 16: semester/curriculum helpers in registration-semester-runtime.js.'
    },
    {
        file: 'assets/js/pages/registration-semester-runtime.js',
        maxLines: 400,
        reason: 'Semester/curriculum condition helpers peeled from registration.js.'
    },
    {
        file: 'assets/js/shared/faculty.js',
        maxLines: 1850,
        reason: 'Wave 18: host ≤1850 after headroom peel. Wave 16: schedule week/group helpers in faculty-schedule-runtime.js.'
    },
    {
        file: 'assets/js/shared/faculty-schedule-runtime.js',
        maxLines: 450,
        reason: 'Schedule text/week/group helpers peeled from faculty.js.'
    },
    {
        file: 'assets/js/shared/messenger.js',
        maxLines: 1850,
        reason: 'Wave 18: host ≤1850 after headroom peel. Wave 16 size A+: host under 2k after gradebook peel.'
    },
    // Engineering A+ frontend freeze — ceilings only decrease after peels (docs/engineering-a-plus-frontend-js.md).
    {
        file: 'assets/js/pages/social-workspace.js',
        maxLines: 1500,
        reason: 'Post tab/portfolio-runtime/schedule-ui peels (~2.0k→~1.4k): coordinator install/re-exports.'
    },
    {
        file: 'assets/js/pages/social-workspace-events.js',
        maxLines: 2000,
        reason: 'Wave 16 size A+: host under 2k after input/submit peels.'
    },
    {
        file: 'assets/js/pages/social-workspace-panel.js',
        maxLines: 1850,
        reason: 'Wave 18: host ≤1850 after headroom peel. Wave 16 size A+: host under 2k after budget peel.'
    },
    {
        file: 'assets/js/pages/social-workspace-graph-runtime.js',
        maxLines: 1850,
        reason: 'Wave 18: host ≤1850 after headroom peel. Wave 16: sync/chrome helpers peeled to social-workspace-graph-sync-runtime.js.'
    },
    {
        file: 'assets/js/pages/social-workspace-graph-sync-runtime.js',
        maxLines: 1200,
        reason: 'Graph sync/chrome/selection helpers peeled from graph-runtime.'
    },
    {
        file: 'assets/js/pages/social-workspace-dialogs.js',
        maxLines: 1300,
        reason: 'Task detail / risk / health dialog markup peeled from social-workspace.js.'
    },
    {
        file: 'assets/js/pages/social-workspace-graph-render.js',
        maxLines: 1800,
        reason: 'Task graph SVG/canvas/inspectors/fullscreen markup peeled from social-workspace.js.'
    },
    {
        file: 'assets/js/pages/social-workspace-task-ui.js',
        maxLines: 900,
        reason: 'Task form fields + create/delete + desk/board cards peeled from social-workspace.js.'
    },
    {
        file: 'assets/js/pages/social-workspace-portfolio-ui.js',
        maxLines: 500,
        reason: 'Portfolio hero/create/discover panel/editor shell peeled from social-workspace.js.'
    },
    {
        file: 'assets/js/pages/social-workspace-project-chrome.js',
        maxLines: 420,
        reason: 'Workspace hero + project create/settings/invite peeled from social-workspace.js.'
    },
    {
        file: 'assets/js/pages/social-workspace-dialog-route.js',
        maxLines: 320,
        reason: 'Owned-dialog kind routing + health/graph stacks peeled from social-workspace.js.'
    },
    {
        file: 'assets/js/pages/social-workspace-tab-runtime.js',
        maxLines: 500,
        reason: 'Tab pane cache/refresh + desk toolbar sync peeled from social-workspace.js.'
    },
    {
        file: 'assets/js/pages/social-workspace-portfolio-runtime.js',
        maxLines: 400,
        reason: 'Portfolio hydrate/save/editor document runtime peeled from social-workspace.js.'
    },
    {
        file: 'assets/js/pages/social-workspace-schedule-ui.js',
        maxLines: 150,
        reason: 'Plan-vs-baseline + progress hours strip markup peeled from social-workspace.js.'
    },
    {
        file: 'assets/js/pages/social-workspace-portfolio-model.js',
        maxLines: 320,
        reason: 'Pure portfolio normalize/access/field helpers peeled from social-workspace.js.'
    },
    {
        file: 'assets/js/pages/social-workspace-health-model.js',
        maxLines: 700,
        reason: 'Health score + plan-pick pure models; freeze growth.'
    },
    {
        file: 'assets/js/pages/social-workspace-graph-model.js',
        maxLines: 1850,
        reason: 'Post desk peel (~2.2k→~1.7k): forest/rollup in social-workspace-graph-desk-model.js.'
    },
    {
        file: 'assets/js/pages/social-workspace-graph-desk-model.js',
        maxLines: 650,
        reason: 'Desk forest/dependency order + group rollup peeled from graph-model.'
    },
    {
        file: 'assets/js/pages/social-workspace-week-plan-model.js',
        maxLines: 220,
        reason: 'Week-plan localStorage + workspace event routing predicates.'
    },
    {
        file: 'assets/js/pages/social-page.js',
        maxLines: 1850,
        reason: 'Wave 18: host ≤1850 after headroom peel. Wave 17: interactions/render peeled to social-page-interactions-runtime.js.'
    },
    {
        file: 'assets/js/pages/social-page-interactions-runtime.js',
        maxLines: 1200,
        reason: 'Reactions/photography/portfolio/pages patches + renderSocialPageNow from social-page.js.'
    },
    {
        file: 'assets/js/pages/social-page-survey-runtime.js',
        maxLines: 800,
        reason: 'Survey create/take helpers peeled from social-page.js (factory+deps).'
    },
    {
        file: 'assets/js/pages/social-page-feed-runtime.js',
        maxLines: 1000,
        reason: 'Entity detail + post compose + panel/shell helpers peeled from social-page.js (factory+deps).'
    },
    {
        file: 'assets/js/pages/social-page-shell-runtime.js',
        maxLines: 750,
        reason: 'Workspace-nav + messages/inbox scroll shell + group-leave peeled from social-page.js (factory+deps).'
    },
    {
        file: 'assets/js/pages/social-overlay-chrome.js',
        maxLines: 550,
        reason: 'Overlay portal + dialog open/close/lock/stack chrome peeled from social-page.js.'
    },
    {
        file: 'assets/js/pages/social-page-events.js',
        maxLines: 550,
        reason: 'Social page click/submit/input/change/keydown + photography drop handlers peeled from social-page.js.'
    },
    {
        file: 'assets/js/pages/social-form-model.js',
        maxLines: 760,
        reason: 'Form/survey parse + lost-found + survey draft/datetime + syncSurveyDraftFromForm.'
    },
    {
        file: 'assets/js/pages/social-entity-model.js',
        maxLines: 360,
        reason: 'Pure composer entity-link / attachable-entity helpers peeled from social-page.js.'
    },
    {
        file: 'assets/js/pages/social-panel-model.js',
        maxLines: 430,
        reason: 'Panel config + feed filter + photography + posting/feed scope options.'
    },
    {
        file: 'assets/js/pages/social-alerts-model.js',
        maxLines: 150,
        reason: 'Notification classify/filter + target URL helpers peeled from social-page.js.'
    },
    {
        file: 'assets/js/pages/social-profile-model.js',
        maxLines: 360,
        reason: 'Profile/people/connection/feedReason helpers peeled from social-page.js.'
    },
    {
        file: 'assets/js/pages/social-fingerprint-model.js',
        maxLines: 430,
        reason: 'Render fingerprints + signature + force-render reason regex peeled from social-page.js.'
    },
    {
        file: 'assets/js/pages/social-chrome-model.js',
        maxLines: 540,
        reason: 'Display/avatar/account/file/draft/context-tabs helpers peeled from social-page.js.'
    },
    {
        file: 'assets/js/pages/social-workspace-stubs.js',
        maxLines: 140,
        reason: 'Workspace lazy-export stub name registry peeled from social-page.js.'
    },
    {
        file: 'assets/js/pages/social-dialog-router.js',
        maxLines: 200,
        reason: 'Dialog kind → deferred-module render router peeled from social-page.js.'
    },
    {
        file: 'assets/js/pages/social-shell-nav.js',
        maxLines: 460,
        reason: 'Shell panel-nav clicks + routeSocialDomain + click domain routes peeled from social-page.js.'
    },
    {
        file: 'assets/js/pages/student-service.js',
        maxLines: 1850,
        reason: 'Wave 18: host ≤1850 after headroom peel. Wave 17: ops/question/ticket/attachment helpers in student-service-ops-runtime.js.'
    },
    {
        file: 'assets/js/pages/student-service-ops-runtime.js',
        maxLines: 1400,
        reason: 'Helpful/ops/question/ticket/attachment submit helpers peeled from student-service.js.'
    },
    {
        file: 'assets/js/pages/student-service-inbox-runtime.js',
        maxLines: 800,
        reason: 'Inbox filter forwards + UI prefs/lane/stores helpers peeled from student-service.js (factory+deps).'
    },
    {
        file: 'assets/js/pages/student-service-page-runtime.js',
        maxLines: 900,
        reason: 'Article CMS + page shell/render/bootstrap peeled from student-service.js (factory+deps).'
    },
    {
        file: 'assets/js/pages/student-service-modules-runtime.js',
        maxLines: 700,
        reason: 'Lazy module loaders + hub stubs peeled from student-service.js (factory+deps).'
    },
    {
        file: 'assets/js/pages/student-service-events.js',
        maxLines: 550,
        reason: 'Delegated root/modal click + input/change/escape handlers peeled from student-service.js.'
    },
    {
        file: 'assets/js/pages/student-service-chrome.js',
        maxLines: 450,
        reason: 'Command bar / lane chooser / delete shell chrome peeled from student-service.js.'
    },
    {
        file: 'assets/js/pages/lms-whiteboard-runtime.js',
        maxLines: 1850,
        reason: 'Wave 18: host ≤1850 after headroom peel. Wave 17: session/shell/render/bind peeled to lms-whiteboard-session-runtime.js.'
    },
    {
        file: 'assets/js/pages/lms-whiteboard-session-runtime.js',
        maxLines: 1100,
        reason: 'Session fingerprints/shells/render/bind helpers peeled from whiteboard runtime.'
    },
    {
        file: 'assets/js/pages/lms-whiteboard-chrome-runtime.js',
        maxLines: 1300,
        reason: 'Theme/tools, dashboard/share/members, props/banner, HUD/fullscreen/layers peeled from runtime.'
    },
    {
        file: 'assets/js/pages/lms-whiteboard-pointer-runtime.js',
        maxLines: 700,
        reason: 'Whiteboard stage pointer bind + wheel/touch/pointer/dblclick peeled from runtime.'
    },
    {
        file: 'assets/js/pages/lms-whiteboard-paint-runtime.js',
        maxLines: 420,
        reason: 'Canvas paint + grid + element draw peeled from lms-whiteboard-runtime.js.'
    },
    {
        file: 'assets/js/pages/lms-whiteboard-model.js',
        maxLines: 500,
        reason: 'Pure whiteboard geometry/color/text helpers; freeze growth.'
    },
    {
        file: 'assets/js/shared/utilities.js',
        maxLines: 1400,
        reason: 'Post lux-transparency peel (~3.8k→~1.3k); keep escape/theme/role helpers only.'
    },
    {
        file: 'assets/js/shared/lux-transparency.js',
        maxLines: 2000,
        reason: 'Wave 16: route shouldKeep* helpers in lux-transparency-route-runtime.js.'
    },
    {
        file: 'assets/js/shared/lux-transparency-route-runtime.js',
        maxLines: 850,
        reason: 'Route shouldKeep* fade ownership helpers peeled from lux-transparency.js.'
    },
    {
        file: 'assets/js/app/app.js',
        maxLines: 1900,
        reason: 'Post english-localization peel (~3.0k→~1.8k); bootstrap/composition root only.'
    },
    {
        file: 'assets/js/app/english-localization.js',
        maxLines: 1300,
        reason: 'English UI + encoding repair layer peeled from app.js; freeze growth.'
    },
    {
        file: 'assets/js/app/api.js',
        maxLines: 1650,
        reason: 'E2: admin-library/registration CMS merge peeled to api-admin-merge-runtime.js. Wave 18 host after headroom peels.'
    },
    {
        file: 'assets/js/app/api-lms-portal-runtime.js',
        maxLines: 900,
        reason: 'LMS live-quiz/whiteboard/personal-dashboard/exam/social API helpers peeled from api.js.'
    },
    {
        file: 'assets/js/app/api-admin-merge-runtime.js',
        maxLines: 350,
        reason: 'E2: Admin-library + registration CMS merge helpers peeled from api.js.'
    },
    {
        file: 'assets/js/pages/lms-quiz-workspace-runtime.js',
        maxLines: 1850,
        reason: 'Wave 18: host ≤1850 after headroom peel. Wave 17: access/builder session peeled to lms-quiz-workspace-session-runtime.js.'
    },
    {
        file: 'assets/js/pages/lms-quiz-workspace-session-runtime.js',
        maxLines: 1200,
        reason: 'Quiz access dialog + builder draft/variant helpers peeled from quiz workspace.'
    },
    {
        file: 'assets/js/pages/lms-quiz-focus-runtime.js',
        maxLines: 150,
        reason: 'Student quiz focus-mode helpers peeled from quiz workspace runtime.'
    },
    {
        file: 'assets/js/pages/lms-quiz-model.js',
        maxLines: 400,
        reason: 'Pure LMS quiz helpers peeled from quiz workspace runtime.'
    },
    {
        file: 'assets/js/shared/social-runtime-lite.js',
        maxLines: 1850,
        reason: 'Wave 18: host ≤1850 after headroom peel. Wave 17: feed/page/group/event/call mutations in social-lite-content-runtime.js.'
    },
    {
        file: 'assets/js/shared/social-lite-content-runtime.js',
        maxLines: 1400,
        reason: 'Feed/page/group/event/survey/post/call mutation helpers peeled from social-runtime-lite.js.'
    },
    {
        file: 'assets/js/shared/social-lite-project-runtime.js',
        maxLines: 450,
        reason: 'Project membership/tasks/budget/risks peeled from social-runtime-lite.js.'
    },
    {
        file: 'assets/js/pages/lms-classroom-tabs-runtime.js',
        maxLines: 1850,
        reason: 'Wave 18: host ≤1850 after headroom peel. Wave 17: interaction/attendance/tab-switch shell in lms-classroom-tabs-shell-runtime.js.'
    },
    {
        file: 'assets/js/pages/lms-classroom-tabs-shell-runtime.js',
        maxLines: 1300,
        reason: 'Interaction/attendance/enhancement/tab-switch helpers peeled from classroom tabs.'
    },
    {
        file: 'assets/js/pages/lms-classroom-sessions-runtime.js',
        maxLines: 350,
        reason: 'Next-session schedule + marker composer preview peeled from classroom tabs.'
    },
    {
        file: 'assets/js/features/index-home-dashboard.plain.js',
        maxLines: 1850,
        reason: 'Wave 18: host ≤1850 after headroom peel. Wave 16: widget-layout geometry peeled to home-dashboard-widget-layout-runtime.js.'
    },
    {
        file: 'assets/js/features/home-dashboard-widget-data-runtime.js',
        maxLines: 300,
        reason: 'Widget row adapters + default geometry peeled from home dashboard plain chunk.'
    },
    {
        file: 'assets/js/features/home-dashboard-widget-layout-runtime.js',
        maxLines: 1400,
        reason: 'Widget geometry/layout helpers peeled from home-dashboard/widget-layout.js.'
    },
    {
        file: 'assets/js/pages/lms-live-quiz-ui-runtime.js',
        maxLines: 1850,
        reason: 'Wave 18: host ≤1850 after headroom peel. Wave 16: session/question UI peeled to lms-live-quiz-session-runtime.js.'
    },
    {
        file: 'assets/js/pages/lms-live-quiz-session-runtime.js',
        maxLines: 1000,
        reason: 'Live-quiz session/question/broadcast UI helpers peeled from lms-live-quiz-ui-runtime.js.'
    },
    {
        file: 'assets/js/pages/student-registration.js',
        maxLines: 1850,
        reason: 'Wave 18: host ≤1850 after headroom peel. Wave 16: eligibility/grade helpers in student-registration-eligibility-runtime.js.'
    },
    {
        file: 'assets/js/pages/student-registration-eligibility-runtime.js',
        maxLines: 750,
        reason: 'Curriculum eligibility + gradebook score helpers peeled from student-registration.js.'
    },
    {
        file: 'assets/js/pages/admin-registration.js',
        maxLines: 1850,
        reason: 'Wave 18: host ≤1850 after headroom peel. Wave 17: CMS modules/program/minor helpers in admin-registration-cms-runtime.js.'
    },
    {
        file: 'assets/js/pages/admin-registration-cms-runtime.js',
        maxLines: 1200,
        reason: 'CMS modules/program/minor/faculty helpers peeled from admin-registration.js.'
    },
    {
        file: 'assets/js/pages/admin-registration-seats-runtime.js',
        maxLines: 200,
        reason: 'Seat limits + student registration data adapters peeled from admin-registration.js.'
    },
    {
        file: 'assets/js/pages/exams-console.js',
        maxLines: 1850,
        reason: 'Wave 18: host ≤1850 after headroom peel. Wave 17: workspace/render/handlers in exams-console-workspace-runtime.js.'
    },
    {
        file: 'assets/js/pages/exams-console-workspace-runtime.js',
        maxLines: 1300,
        reason: 'Review/live/workspace render + click/change handlers peeled from exams-console.js.'
    }
,

    {
        file: 'assets/js/pages/gradebook-weights-runtime.js',
        maxLines: 300,
        reason: 'Wave 16 size peel: modern weights UI from gradebook-workspace.'
    },
    {
        file: 'assets/js/pages/gradebook-history-ui-runtime.js',
        maxLines: 250,
        reason: 'Wave 16 size peel: score history panel from gradebook-model.'
    },
    {
        file: 'assets/js/pages/gradebook-quiz-map-runtime.js',
        maxLines: 350,
        reason: 'H2b: LMS quiz ↔ gradebook mapping peeled from gradebook-model.'
    },
    {
        file: 'assets/js/pages/gradebook-components-runtime.js',
        maxLines: 250,
        reason: 'H2b: assessment component manager peeled from gradebook-workspace.'
    },
    {
        file: 'assets/js/pages/admin-scheduler-faculty-runtime.js',
        maxLines: 200,
        reason: 'H2b: faculty/palette + week helpers peeled from admin-scheduler.'
    },
    {
        file: 'assets/js/shared/messenger-gradebook-runtime.js',
        maxLines: 300,
        reason: 'Wave 16 size peel: roster helpers from messenger.js.'
    },
    {
        file: 'assets/js/pages/students-command-mobility-runtime.js',
        maxLines: 150,
        reason: 'Wave 16 size peel: mobility tab from students-command-center.'
    },
    {
        file: 'assets/js/pages/form-builder-actions-runtime.js',
        maxLines: 450,
        reason: 'Wave 16 size peel: builder input/events from form-builder-runtime.'
    },
    {
        file: 'assets/js/pages/student-service-qa-thread-runtime.js',
        maxLines: 400,
        reason: 'Wave 16 size peel: thread click + student feed from student-service-qa.'
    },
    {
        file: 'assets/js/pages/social-workspace-events-input-runtime.js',
        maxLines: 400,
        reason: 'Wave 16 size peel: input/change handlers from social-workspace-events.'
    },
    {
        file: 'assets/js/pages/social-workspace-events-submit-runtime.js',
        maxLines: 700,
        reason: 'Wave 16 size peel: submit handler from social-workspace-events.'
    },
    {
        file: 'assets/js/pages/social-workspace-panel-budget-runtime.js',
        maxLines: 250,
        reason: 'Wave 16 size peel: budget tab helpers from social-workspace-panel.'
    },
    {
        file: 'assets/js/pages/gradebook-workspace.js',
        maxLines: 1750,
        reason: 'H2b: host under 1750 after components peel.'
    },
    {
        file: 'assets/js/pages/gradebook-model.js',
        maxLines: 1700,
        reason: 'H2b: host under 1700 after quiz-map peel.'
    },
    {
        file: 'assets/js/pages/students-command-center.js',
        maxLines: 1850,
        reason: 'Wave 18: host ≤1850 after headroom peel. Wave 16 size A+: host under 2k after mobility peel.'
    },
    {
        file: 'assets/js/pages/form-builder-runtime.js',
        maxLines: 2000,
        reason: 'Wave 16 size A+: host under 2k after actions peel.'
    },
    {
        file: 'assets/js/pages/student-service-qa.js',
        maxLines: 1850,
        reason: 'Wave 18: host ≤1850 after headroom peel. Wave 16 size A+: host under 2k after thread peel.'
    },
    {
        file: 'assets/js/pages/lms-whiteboard-selection-runtime.js',
        maxLines: 400,
        reason: 'Wave 18: Whiteboard selection toolbar/align/context peeled from lms-whiteboard-runtime.js.'
    },
    {
        file: 'assets/js/pages/lms-quiz-workspace-review-runtime.js',
        maxLines: 350,
        reason: 'Wave 18: Quiz review panel/paper markup peeled from lms-quiz-workspace-runtime.js.'
    },
    {
        file: 'assets/js/features/luxury-shell-topbar-runtime.js',
        maxLines: 350,
        reason: 'Wave 18: Faculty/role switchers + topbar sync peeled from luxury-shell-chrome.js.'
    },
    {
        file: 'assets/js/shared/messenger-chrome-runtime.js',
        maxLines: 250,
        reason: 'Wave 18: Messenger drag/drop/search/chrome helpers peeled from messenger.js.'
    },
    {
        file: 'assets/js/app/state-deleted-staff-runtime.js',
        maxLines: 250,
        reason: 'Wave 18: State text-repair + deleted-staff registry peeled from state.js.'
    },
    {
        file: 'assets/js/pages/student-registration-choice-runtime.js',
        maxLines: 250,
        reason: 'Wave 18: Student registration faculty/scope/choice peeled from student-registration.js.'
    },
    {
        file: 'assets/js/pages/admin-registration-boot-runtime.js',
        maxLines: 250,
        reason: 'Wave 18: Admin registration CMS boot/identity/ECTS peeled from admin-registration.js.'
    },
    {
        file: 'assets/js/app/api-portal-persist-runtime.js',
        maxLines: 250,
        reason: 'Wave 18: Portal diagnostic/mail/persist helpers peeled from api.js.'
    },
    {
        file: 'assets/js/pages/student-service-bootstrap-runtime.js',
        maxLines: 280,
        reason: 'Wave 18: Student-service snapshot/bootstrap helpers peeled from student-service.js.'
    },
    {
        file: 'assets/js/shared/faculty-messenger-runtime.js',
        maxLines: 250,
        reason: 'Wave 18: Faculty portal messenger send/render peeled from faculty.js.'
    },
    {
        file: 'assets/js/pages/registration-curriculum-runtime.js',
        maxLines: 280,
        reason: 'Wave 18: Curriculum library module/subject mutations peeled from registration.js.'
    },
    {
        file: 'assets/js/pages/lms-exam-session-runtime.js',
        maxLines: 320,
        reason: 'Wave 18: LMS quiz finalize + exam session lifecycle peeled from lms.js.'
    },
    {
        file: 'assets/js/pages/lms-live-quiz-ui-staff-runtime.js',
        maxLines: 280,
        reason: 'Wave 18: Live quiz staff action/impersonation UI peeled from lms-live-quiz-ui-runtime.js.'
    },
    {
        file: 'assets/js/pages/lms-live-quiz-access-runtime.js',
        maxLines: 250,
        reason: 'Wave 18: Live quiz staff/access/sync helpers peeled from lms-live-quiz-workspace-runtime.js.'
    },
    {
        file: 'assets/js/pages/lms-classroom-tabs-panel-runtime.js',
        maxLines: 280,
        reason: 'Wave 18: LMS classroom panel visibility + groups open peeled from lms-classroom-tabs-runtime.js.'
    },
    {
        file: 'assets/js/pages/exams-console-schedule-runtime.js',
        maxLines: 400,
        reason: 'Wave 18: Exams schedule collision/PIN/export + local test helpers peeled from exams-console.js.'
    },
    {
        file: 'assets/js/pages/students-command-academic-runtime.js',
        maxLines: 250,
        reason: 'Wave 18: Student academic/mobility actions peeled from students-command-center.js.'
    },
    {
        file: 'assets/js/pages/admin-scheduler-session-runtime.js',
        maxLines: 250,
        reason: 'Wave 18: Scheduler create-session + faculty scope peeled from admin-scheduler.js.'
    },
    {
        file: 'assets/js/pages/student-service-qa-staff-runtime.js',
        maxLines: 400,
        reason: 'Wave 18: Staff QA feedback/delete/feed markup peeled from student-service-qa.js.'
    },
    {
        file: 'assets/js/features/luxury-index-sync-runtime.js',
        maxLines: 300,
        reason: 'Wave 18: Luxury index shell sync helpers peeled from index-luxury.js.'
    },
    {
        file: 'assets/js/features/luxury-index-home-shell-runtime.js',
        maxLines: 150,
        reason: 'Wave 18: Luxury home-shell render/preload helpers peeled from index-luxury.js.'
    },
    {
        file: 'assets/js/shared/social-lite-invite-runtime.js',
        maxLines: 250,
        reason: 'Wave 18: Social profile/page/group mutations + invite peeled from social-runtime-lite.js.'
    },
    {
        file: 'assets/js/features/home-dashboard-gesture-runtime.js',
        maxLines: 400,
        reason: 'Wave 18: Home dashboard desktop gesture + shell bind peeled from index-home-dashboard.plain.js.'
    },
    {
        file: 'assets/js/pages/social-page-boot-runtime.js',
        maxLines: 300,
        reason: 'Wave 18: Social page busy/bind/boot helpers peeled from social-page.js.'
    },
    {
        file: 'assets/js/pages/social-workspace-graph-layout-runtime.js',
        maxLines: 220,
        reason: 'Wave 18: Project task-graph layout/position helpers peeled from social-workspace-graph-runtime.js.'
    },
    {
        file: 'assets/js/pages/social-workspace-panel-team-runtime.js',
        maxLines: 200,
        reason: 'Wave 18: Team tab + workload aside helpers peeled from social-workspace-panel.js.'
    },
    {
        file: 'assets/js/app/state.js',
        maxLines: 1500,
        reason: 'E4: admin exam/quiz helpers peeled to state-admin-exam-runtime.js. Wave 18 host after headroom peel.'
    },
    {
        file: 'assets/js/app/state-admin-exam-runtime.js',
        maxLines: 500,
        reason: 'E4: Admin exam/quiz draft + exam-session helpers peeled from state.js.'
    },
    {
        file: 'assets/js/pages/admin-scheduler.js',
        maxLines: 1800,
        reason: 'H2b: host under 1800 after faculty/palette peel.'
    },
    {
        file: 'assets/js/pages/lms-live-quiz-workspace-runtime.js',
        maxLines: 1850,
        reason: 'Wave 18: host ≤1850 after headroom peel.'
    },
];

const extractedRouteOwners = [
    {
        module: 'backend/platform/routes/files-routes.js',
        routes: [
            "app.post('/api/files/upload'",
            "app.get('/api/files/:id'"
        ]
    },
    {
        module: 'backend/platform/routes/auth-routes.js',
        routes: [
            "app.get('/api/portal/session'",
            "app.post('/api/portal/session/login'",
            "app.post('/api/portal/session/logout'",
            "app.delete('/api/session/impersonate-role'"
        ]
    },
    {
        module: 'backend/platform/routes/platform-ops-routes.js',
        routes: [
            "app.get('/api/platform/config'",
            "app.get('/api/platform/status'",
            "app.get('/api/platform/readiness'",
            "app.get('/api/platform/downloads'"
        ]
    },
    {
        module: 'backend/platform/routes/admin-integrations-routes.js',
        routes: [
            "app.get('/api/admin/accounts'",
            "app.post('/api/admin/accounts'",
            "app.post('/api/admin/accounts/:id/privileges'",
            "app.post('/api/admin/reset-platform-state'",
            "app.get('/api/admin/people'",
            "app.post('/api/admin/people'",
            "app.get('/api/integrations/systems'",
            "app.post('/api/integrations/systems'",
            "app.get('/api/integrations/sync-runs'",
            "app.post('/api/integrations/sync-runs'",
            "app.get('/api/integrations/conflicts'",
            "app.post('/api/integrations/conflicts'"
        ]
    },
    {
        module: 'backend/platform/routes/admin-support-routes.js',
        routes: [
            "app.get('/api/audit/events'",
            "app.post('/api/audit/events'",
            "app.post('/api/admin/holds'",
            "app.post('/api/admin/sections'",
            "app.post('/api/admin/import-jobs'",
            "app.get('/api/admin/import-jobs/:id'"
        ]
    },
    {
        module: 'backend/platform/routes/student-service-routes.js',
        routes: [
            "app.get('/api/student-service/bootstrap'",
            "app.post('/api/student-service/tickets'",
            "app.post('/api/student-service/tickets/:id/replies'",
            "app.post('/api/student-service/tickets/:id/status'",
            "app.post('/api/student-service/tickets/:id/assign'",
            "app.post('/api/student-service/tickets/:id/internal-notes'",
            "app.post('/api/student-service/tickets/:id/handoff'",
            "app.post('/api/student-service/articles'",
            "app.post('/api/student-service/questions'",
            "app.post('/api/student-service/questions/:id/answers'",
            "app.post('/api/student-service/questions/:id/feedback'",
            "app.post('/api/student-service/questions/:id/accept-answer'",
            "app.post('/api/student-service/questions/:id/publish'",
            "app.post('/api/student-service/questions/:id/flags'",
            "app.post('/api/student-service/questions/:id/convert-to-ticket'",
            "app.post('/api/student-service/questions/:id/convert-to-article'",
            "app.post('/api/student-service/questions/:id/merge'"
        ]
    },
    {
        module: 'backend/platform/routes/protected-exam-routes.js',
        routes: [
            "app.post('/api/exam-portal/auth'",
            "app.get('/api/exam-portal/sessions'",
            "app.get('/api/exam-portal/session/:sessionId'",
            "app.post('/api/exam-portal/sessions/:sessionId/launch-ticket'",
            "app.post('/api/protected-quizzes/sync'",
            "app.post('/api/protected-quizzes/:quizId/launch-ticket'",
            "app.post('/api/protected-client/redeem-launch'",
            "app.get('/api/protected-quizzes/group/:groupKey/monitor'",
            "app.get('/api/protected-quizzes/:quizId/attempts'",
            "app.get('/api/protected-quizzes/:quizId/attempt'",
            "app.post('/api/protected-quizzes/:quizId/heartbeat'",
            "app.post('/api/protected-quizzes/:quizId/events'",
            "app.post('/api/protected-quizzes/:quizId/submit'",
            "app.post('/api/protected-quizzes/:quizId/students/:studentId/block'",
            "app.post('/api/protected-quizzes/:quizId/students/:studentId/unblock'",
            "app.post('/api/protected-quizzes/:quizId/students/:studentId/force-submit'",
            "app.post('/api/protected-quizzes/:quizId/students/:studentId/reset-warnings'",
            "app.post('/api/protected-quizzes/:quizId/students/:studentId/approve-reconnect'",
            "app.post('/api/protected-quizzes/:quizId/students/:studentId/override-status'",
            "app.post('/api/protected-quizzes/:quizId/manual-grade'"
        ]
    },
    {
        module: 'backend/platform/routes/messenger-calls-routes.js',
        routes: [
            "app.get('/api/messenger/snapshot'",
            "app.post('/api/messenger/direct'",
            "app.post('/api/messenger/message'",
            "app.delete('/api/messenger/chats/:chatId/messages/:messageId'",
            "app.post('/api/messenger/chats/:chatId/hide'",
            "app.post('/api/messenger/chats/:chatId/read'",
            "app.post('/api/calls/start'",
            "app.post('/api/calls/accept'",
            "app.post('/api/calls/decline'",
            "app.post('/api/calls/end'",
            "app.post('/api/calls/join'",
            "app.post('/api/calls/leave'",
            "app.post('/api/calls/signal'"
        ]
    },
    {
        module: 'backend/platform/routes/social-routes.js',
        routes: [
            "app.get('/api/social/bootstrap'",
            "app.post('/api/social/state'",
            "app.post('/api/social/group-chat'",
            "app.get('/api/social/feed'",
            "app.post('/api/social/posts/resolve'",
            "app.get('/api/social/events'",
            "app.post('/api/social/pages'",
            "app.post('/api/social/groups'",
            "app.post('/api/social/projects'",
            "app.post('/api/social/relationships/request'",
            "app.post('/api/social/follows/toggle'",
            "app.post('/api/social/posts'",
            "app.post('/api/social/reports'",
            "app.post('/api/social/profiles/:id'",
            "app.post('/api/social/events/:id/rsvp'"
        ]
    },
    {
        module: 'backend/platform/routes/lms-live-quiz-routes.js',
        routes: [
            "app.get('/api/lms/live-quizzes/:resourceKey'",
            "app.post('/api/lms/live-quizzes/:resourceKey'",
            "app.post('/api/lms/live-quizzes/:resourceKey/answers'"
        ]
    },
    {
        module: 'backend/platform/routes/academic-routes.js',
        routes: [
            "app.get('/api/catalog/courses'",
            "app.get('/api/catalog/sections'",
            "app.get('/api/students/:id/eligibility'",
            "app.get('/api/students/:id/enrollments'",
            "app.post('/api/registration/enroll'",
            "app.post('/api/registration/drop'",
            "app.post('/api/exam-sessions/sync'"
        ]
    },
    {
        module: 'backend/platform/routes/news-routes.js',
        routes: [
            "app.get('/api/news/feed'",
            "app.post('/api/news/posts'",
            "app.patch('/api/news/posts/:id'",
            "app.post('/api/news/posts/:id/replies'"
        ]
    },
    {
        module: 'backend/platform/routes/microsoft-auth-routes.js',
        routes: [
            "app.get('/api/portal/microsoft/config'",
            "app.get('/api/portal/microsoft/start'",
            "app.post('/api/portal/microsoft/complete'",
            "app.get('/api/portal/microsoft/callback'"
        ]
    },
    {
        module: 'backend/platform/routes/mail-routes.js',
        routes: [
            "app.get('/api/mail/bootstrap'",
            "app.get('/api/mail/connect/start'",
            "app.get('/api/mail/connect/callback'",
            "app.delete('/api/mail/connection'",
            "app.post('/api/mail/sync'",
            "app.get('/api/mail/messages'",
            "app.get('/api/mail/messages/:id'",
            "app.get('/api/mail/messages/:id/attachments/:attachmentId'",
            "app.post('/api/mail/messages/send'",
            "app.post('/api/mail/messages/:id/reply'",
            "app.post('/api/mail/messages/:id/read-state'"
        ]
    },
    {
        module: 'backend/platform/routes/portal-support-routes.js',
        routes: [
            "app.get('/api/bootstrap'",
            "app.get('/api/portal/bootstrap'",
            "app.post('/api/portal/state'",
            "app.get('/api/me'",
            "app.get('/api/events'",
            "app.get('/api/accounts'",
            "app.post('/api/accounts/upsert'",
            "app.get('/api/notifications'",
            "app.post('/api/notifications/read'",
            "app.post('/api/notifications/delete'",
            "app.post('/api/notifications/preferences'",
            "app.get('/api/push/public-config'",
            "app.post('/api/push/subscribe'",
            "app.post('/api/push/unsubscribe'"
        ]
    },
    {
        module: 'backend/platform/routes/system-routes.js',
        routes: [
            "app.get('/download'",
            "app.get('/download/file'",
            "app.get('/download/:platform'",
            "app.get('/download/:platform/file'",
            "app.get('/health'",
            "app.get('/ready'"
        ]
    },
    {
        module: 'backend/platform/routes/auth-maintenance-routes.js',
        routes: [
            "app.post('/api/auth/login'",
            "app.post('/api/auth/logout'",
            "app.post('/api/session/impersonate-role'",
            "app.post('/api/auth/activate'",
            "app.post('/api/auth/request-reset'",
            "app.post('/api/auth/reset-password'"
        ]
    }
];

const routeModules = extractedRouteOwners.map(item => item.module);
const forbiddenRouteImports = [
    "require('./store')",
    "require('../store')",
    "require('./domains/",
    "require('../domains/"
];
const sharedMobileShellPages = Object.keys(routeVisualClassification).filter((page) => routeVisualClassification[page].mobileShell === 'shared-standalone');
const shellAliasWrapperPages = Object.keys(routeVisualClassification).filter((page) => routeVisualClassification[page].category === 'excluded-wrapper');

let failed = false;
const serverSource = jsCeilingsOnly ? '' : readText('backend/platform/server.js');

console.log(jsCeilingsOnly ? 'JS ceiling guardrails' : 'Architecture guardrails');

if (!jsCeilingsOnly) {
for (const [page, expected] of Object.entries(explicitMobileShellRouteGuardrails)) {
    const actual = routeVisualClassification[page];
    const matches = Boolean(actual)
        && actual.category === expected.category
        && JSON.stringify(actual.dedicatedCss) === JSON.stringify(expected.dedicatedCss)
        && actual.mobileShell === expected.mobileShell;
    console.log(`${matches ? 'PASS' : 'FAIL'} explicit mobile shell route guardrail ${page}`);
    if (!matches) {
        console.log(`  Expected: ${JSON.stringify(expected)}`);
        console.log(`  Actual: ${JSON.stringify(actual || null)}`);
        failed = true;
    }
}
}

for (const entry of lineCountThresholds) {
    if (!fs.existsSync(resolveRelative(entry.file))) {
        console.log(`FAIL line ceiling ${entry.file} missing`);
        failed = true;
        continue;
    }
    const count = countLines(entry.file);
    const ok = count <= entry.maxLines;
    console.log(`${ok ? 'PASS' : 'FAIL'} line ceiling ${entry.file} ${count}/${entry.maxLines}`);
    if (!ok) {
        console.log(`  Reason: ${entry.reason}`);
        failed = true;
    }
}

for (const relativePath of factoryPeelAllowlist) {
    if (!fs.existsSync(resolveRelative(relativePath))) {
        console.log(`FAIL factory peel missing ${relativePath}`);
        failed = true;
        continue;
    }
    const source = readText(relativePath);
    const hasFactory = /__kiuCreate\w+|function createKiu\w+|createKiu\w+Api\s*=/.test(source);
    const hasLoadGuard = /__KIU_[\w]+_LOADED/.test(source);
    const ok = hasFactory && hasLoadGuard;
    console.log(`${ok ? 'PASS' : 'FAIL'} factory peel contract ${relativePath}`);
    if (!ok) {
        console.log('  Expected __kiuCreate*/createKiu* factory and __KIU_*_LOADED load guard.');
        failed = true;
    }

    // Wave 14 structure scorecard: no bare public window.X = function APIs on allowlisted peels.
    // Allowed: __KIU_*_LOADED, __kiuCreate*, window.Kiu*, window.__kiu*, Object.assign(window, api).
    const adHocWindowFns = [];
    const windowFnAssignRe = /window\.([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?function\b/g;
    let windowFnMatch;
    while ((windowFnMatch = windowFnAssignRe.exec(source)) !== null) {
        const name = windowFnMatch[1];
        const allowed = factoryPeelAllowedWindowAssignPrefixes.some((prefix) => name.startsWith(prefix));
        if (!allowed) adHocWindowFns.push(name);
    }
    const scorecardOk = adHocWindowFns.length === 0;
    console.log(`${scorecardOk ? 'PASS' : 'FAIL'} factory peel structure scorecard ${relativePath}`);
    if (!scorecardOk) {
        console.log(`  Ad-hoc window.<name> = function assignments (use Object.assign(window, api) / Kiu* / __kiu*): ${adHocWindowFns.join(', ')}`);
        failed = true;
    }
}

// Wave 15 Structure 10: hard gate — no assets/js host may reach 3000 lines.
{
    const HARD_LINE_GATE = 3000;
    const offenders = [];
    for (const relativePath of listAssetsJsFiles()) {
        const count = countLines(relativePath);
        if (count >= HARD_LINE_GATE) offenders.push({ relativePath, count });
    }
    if (offenders.length === 0) {
        console.log(`PASS assets/js hard line gate (no file ≥${HARD_LINE_GATE})`);
    } else {
        for (const { relativePath, count } of offenders) {
            console.log(`FAIL assets/js hard line gate ${relativePath} ${count}`);
            failed = true;
        }
    }
}

// Wave 16/17 Size A+: zero assets/js files may be ≥2000 lines.
{
    const SIZE_GATE = 2000;
    const SIZE_MAX_FILES = 0;
    const large = [];
    for (const relativePath of listAssetsJsFiles()) {
        const count = countLines(relativePath);
        if (count >= SIZE_GATE) large.push({ relativePath, count });
    }
    if (large.length <= SIZE_MAX_FILES) {
        console.log(`PASS assets/js size gate (files ≥${SIZE_GATE}: ${large.length}/${SIZE_MAX_FILES})`);
    } else {
        console.log(`FAIL assets/js size gate (files ≥${SIZE_GATE}: ${large.length}/${SIZE_MAX_FILES})`);
        for (const { relativePath, count } of large.sort((a, b) => b.count - a.count)) {
            console.log(`  ${count}  ${relativePath}`);
        }
        failed = true;
    }
}

// Wave 18 Headroom: no assets/js file may reach 1900 lines (near-ceiling safety under the 2k gate).
{
    const HEADROOM_GATE = 1900;
    const offenders = [];
    for (const relativePath of listAssetsJsFiles()) {
        const count = countLines(relativePath);
        if (count >= HEADROOM_GATE) offenders.push({ relativePath, count });
    }
    if (offenders.length === 0) {
        console.log(`PASS assets/js headroom gate (no file ≥${HEADROOM_GATE})`);
    } else {
        for (const { relativePath, count } of offenders) {
            console.log(`FAIL assets/js headroom gate ${relativePath} ${count}`);
            failed = true;
        }
    }
}

// Wave 20 Module boundaries: bare window.X= (not __KIU_/__kiu/Kiu) must stay under ceiling (only goes down).
{
    const BARE_WINDOW_ASSIGN_MAX = 900;
    const bareWindowAssignRe = /\bwindow\.([A-Za-z_$][\w$]*)\s*=(?!=)/g;
    let bareCount = 0;
    for (const relativePath of listAssetsJsFiles()) {
        const source = readText(relativePath);
        let match;
        bareWindowAssignRe.lastIndex = 0;
        while ((match = bareWindowAssignRe.exec(source)) !== null) {
            const name = match[1];
            if (name.startsWith('__KIU_') || name.startsWith('__kiu') || name.startsWith('Kiu')) continue;
            bareCount += 1;
        }
    }
    if (bareCount <= BARE_WINDOW_ASSIGN_MAX) {
        console.log(`PASS bare window assign gate (${bareCount}/${BARE_WINDOW_ASSIGN_MAX})`);
    } else {
        console.log(`FAIL bare window assign gate (${bareCount}/${BARE_WINDOW_ASSIGN_MAX})`);
        failed = true;
    }
}

// Wave H3 Dependency clarity: typeof window.X probes must stay under ceiling (only goes down).
{
    const TYPEOF_WINDOW_MAX = 900;
    const typeofWindowRe = /\btypeof\s+window\.([A-Za-z_$][\w$]*)/g;
    let typeofCount = 0;
    for (const relativePath of listAssetsJsFiles()) {
        const source = readText(relativePath);
        typeofWindowRe.lastIndex = 0;
        while (typeofWindowRe.exec(source) !== null) typeofCount += 1;
    }
    if (typeofCount <= TYPEOF_WINDOW_MAX) {
        console.log(`PASS typeof window probe gate (${typeofCount}/${TYPEOF_WINDOW_MAX})`);
    } else {
        console.log(`FAIL typeof window probe gate (${typeofCount}/${TYPEOF_WINDOW_MAX})`);
        failed = true;
    }
}

// Wave 23 Modern stack: ESM leaves (export + install*) must stay ≥ floor (only goes up).
{
    const ESM_LEAF_MIN = 10;
    const ESM_LEAF_MARKERS = [
        'assets/js/features/luxury-background.js',
        'assets/js/pages/social-entity-model.js',
        'assets/js/pages/social-workspace-risk-model.js',
        'assets/js/pages/social-task-model.js',
        'assets/js/pages/social-form-model.js',
        'assets/js/pages/social-alerts-model.js',
        'assets/js/pages/social-panel-model.js',
        'assets/js/pages/social-profile-model.js',
        'assets/js/pages/lms-quiz-model.js',
        'assets/js/pages/lms-whiteboard-model.js',
        'assets/js/pages/student-service-model.js',
        'assets/js/shared/curriculum-library-model.js'
    ];
    const found = [];
    for (const relativePath of ESM_LEAF_MARKERS) {
        if (!fs.existsSync(path.join(ROOT, relativePath))) continue;
        const source = readText(relativePath);
        const hasExport = /\bexport\s+(function|const|\{)/.test(source);
        const hasInstall = /\bexport\s+function\s+install\w+/.test(source);
        const isBgOrchestrator = relativePath.endsWith('luxury-background.js')
            && /import\s*\(/.test(source);
        if ((hasExport && hasInstall) || isBgOrchestrator) found.push(relativePath);
    }
    if (found.length >= ESM_LEAF_MIN) {
        console.log(`PASS ESM leaf gate (${found.length}/${ESM_LEAF_MIN})`);
    } else {
        console.log(`FAIL ESM leaf gate (${found.length}/${ESM_LEAF_MIN}) — need export+install leaves`);
        failed = true;
    }
}

if (jsCeilingsOnly) {
    if (failed) {
        console.error('\nJS ceiling guardrails failed.');
        process.exit(1);
    }
    console.log('\nJS ceiling guardrails passed.');
    process.exit(0);
}

for (const owner of extractedRouteOwners) {
    const routeSource = readText(owner.module);
    for (const routeSignature of owner.routes) {
        const ownedByModule = routeSource.includes(routeSignature);
        const absentFromServer = !serverSource.includes(routeSignature);
        console.log(`${ownedByModule ? 'PASS' : 'FAIL'} route owner ${owner.module} contains ${routeSignature}`);
        console.log(`${absentFromServer ? 'PASS' : 'FAIL'} server no longer owns ${routeSignature}`);
        if (!ownedByModule || !absentFromServer) {
            failed = true;
        }
    }
}

const routeModulesThatNeedStoreInjection = new Set([
    'backend/platform/routes/files-routes.js',
    'backend/platform/routes/auth-routes.js',
    'backend/platform/routes/platform-ops-routes.js',
    'backend/platform/routes/admin-integrations-routes.js',
    'backend/platform/routes/admin-support-routes.js',
    'backend/platform/routes/student-service-routes.js',
    'backend/platform/routes/protected-exam-routes.js',
    'backend/platform/routes/messenger-calls-routes.js',
    'backend/platform/routes/social-routes.js',
    'backend/platform/routes/lms-live-quiz-routes.js',
    'backend/platform/routes/academic-routes.js',
    'backend/platform/routes/news-routes.js',
    'backend/platform/routes/microsoft-auth-routes.js',
    'backend/platform/routes/mail-routes.js',
    'backend/platform/routes/portal-support-routes.js',
    'backend/platform/routes/auth-maintenance-routes.js'
]);

for (const routeModule of routeModules) {
    const routeSource = readText(routeModule);
    if (routeModulesThatNeedStoreInjection.has(routeModule)) {
        const usesGetStore = routeSource.includes('getStore');
        console.log(`${usesGetStore ? 'PASS' : 'FAIL'} injected store access ${routeModule}`);
        if (!usesGetStore) failed = true;
    }
    for (const forbidden of forbiddenRouteImports) {
        const ok = !routeSource.includes(forbidden);
        console.log(`${ok ? 'PASS' : 'FAIL'} forbidden import ${forbidden} in ${routeModule}`);
        if (!ok) failed = true;
    }
}

const rootHtmlPages = fs.readdirSync(ROOT)
    .filter((name) => name.toLowerCase().endsWith('.html'))
    .sort();
const classifiedPages = Object.keys(routeVisualClassification).sort();
const missingClassificationPages = rootHtmlPages.filter((name) => !routeVisualClassification[name]);
const extraClassificationPages = classifiedPages.filter((name) => !rootHtmlPages.includes(name));
console.log(`${missingClassificationPages.length === 0 ? 'PASS' : 'FAIL'} route classification coverage missing=${missingClassificationPages.length}`);
if (missingClassificationPages.length > 0) {
    console.log(`  Missing: ${missingClassificationPages.join(', ')}`);
    failed = true;
}
console.log(`${extraClassificationPages.length === 0 ? 'PASS' : 'FAIL'} route classification extras extra=${extraClassificationPages.length}`);
if (extraClassificationPages.length > 0) {
    console.log(`  Extra: ${extraClassificationPages.join(', ')}`);
    failed = true;
}

for (const htmlPage of classifiedPages) {
    const source = readText(htmlPage);
    const classification = routeVisualClassification[htmlPage];
    const actualDedicatedCss = getDedicatedRouteCss(source);
    const expectedDedicatedCss = [...classification.dedicatedCss].sort();
    const cssMatches = JSON.stringify(actualDedicatedCss) === JSON.stringify(expectedDedicatedCss);
    console.log(`${cssMatches ? 'PASS' : 'FAIL'} dedicated route css ${htmlPage}`);
    if (!cssMatches) {
        console.log(`  Expected: ${expectedDedicatedCss.join(', ') || '(none)'}`);
        console.log(`  Actual: ${actualDedicatedCss.join(', ') || '(none)'}`);
        failed = true;
    }
    const sharedCssOverrideDrift = actualDedicatedCss
        .filter((file) => routeCssSharedSelectorZeroBudgetFiles.has(file))
        .flatMap((file) => {
            const findings = getSharedRouteCssOverrideFindings(readText(file));
            return findings.length ? [{ file, findings }] : [];
        });
    const sharedCssOverrideOk = sharedCssOverrideDrift.length === 0;
    console.log(`${sharedCssOverrideOk ? 'PASS' : 'FAIL'} shared selector route css budget ${htmlPage}`);
    if (!sharedCssOverrideOk) {
        sharedCssOverrideDrift.forEach((entry) => {
            console.log(`  ${entry.file}: ${entry.findings.join(', ')}`);
        });
        failed = true;
    }

    const hasInlineBootstrap = source.includes('(function initMobileExperience(){');
    const hasStandaloneSharedShell = source.includes('assets/js/pages/standalone-mobile-shell.js');
    const hasStandaloneConfig = source.includes('window.__KIU_STANDALONE_MOBILE_SHELL_CONFIG = {');
    const hasIndexSharedShell = source.includes('assets/js/pages/index-mobile-shell.js');
    const hasSocialSharedShell = source.includes('assets/js/pages/social-mobile.js');
    const hasInlineStyle = source.includes('<style>');

    if (classification.mobileShell === 'legacy-inline') {
        const ok = hasInlineBootstrap && !hasStandaloneSharedShell;
        console.log(`${ok ? 'PASS' : 'FAIL'} legacy mobile shell mode ${htmlPage}`);
        if (!ok) failed = true;
    } else if (classification.mobileShell === 'shared-standalone') {
        const ok = hasStandaloneSharedShell && hasStandaloneConfig && !hasInlineBootstrap;
        console.log(`${ok ? 'PASS' : 'FAIL'} shared standalone mobile shell mode ${htmlPage}`);
        if (!ok) failed = true;
    } else if (classification.mobileShell === 'index-shared') {
        const ok = hasIndexSharedShell && !hasInlineBootstrap;
        console.log(`${ok ? 'PASS' : 'FAIL'} index shared mobile shell mode ${htmlPage}`);
        if (!ok) failed = true;
    } else if (classification.mobileShell === 'social-shared') {
        const ok = hasSocialSharedShell && !hasInlineBootstrap;
        console.log(`${ok ? 'PASS' : 'FAIL'} social shared mobile shell mode ${htmlPage}`);
        if (!ok) failed = true;
    } else {
        const ok = !hasInlineBootstrap && !hasStandaloneSharedShell;
        console.log(`${ok ? 'PASS' : 'FAIL'} no mobile shell bootstrap drift ${htmlPage}`);
        if (!ok) failed = true;
    }

    const shouldAllowInlineStyle = allowedLuxuryShellInlineStylePages.has(htmlPage);
    const usesLuxuryShell = source.includes('assets/css/index-luxury.css');
    if (usesLuxuryShell) {
        const inlineStyleOk = shouldAllowInlineStyle ? hasInlineStyle : !hasInlineStyle;
        console.log(`${inlineStyleOk ? 'PASS' : 'FAIL'} inline style budget ${htmlPage}`);
        if (!inlineStyleOk) failed = true;
    }
}

for (const htmlPage of sharedMobileShellPages) {
    const source = readText(htmlPage);
    const usesSharedBootstrap = source.includes('assets/js/pages/standalone-mobile-shell.js');
    const declaresSharedConfig = source.includes('window.__KIU_STANDALONE_MOBILE_SHELL_CONFIG = {');
    const avoidsInlineBootstrap = !source.includes('(function initMobileExperience(){');
    console.log(`${usesSharedBootstrap ? 'PASS' : 'FAIL'} shared mobile shell bootstrap ${htmlPage}`);
    console.log(`${declaresSharedConfig ? 'PASS' : 'FAIL'} mobile shell config ${htmlPage}`);
    console.log(`${avoidsInlineBootstrap ? 'PASS' : 'FAIL'} no inline mobile bootstrap ${htmlPage}`);
    if (!usesSharedBootstrap || !declaresSharedConfig || !avoidsInlineBootstrap) {
        failed = true;
    }
}

for (const htmlPage of shellAliasWrapperPages) {
    const source = readText(htmlPage);
    const redirectsToShell = source.includes("window.location.replace(target);");
    const staysRuntimeLight = !source.includes('assets/js/pages/news.js') && !source.includes('assets/js/pages/standalone-mobile-shell.js');
    const skipsStandaloneShellChrome = !source.includes('window.__KIU_STANDALONE_MOBILE_SHELL_CONFIG = {');
    console.log(`${redirectsToShell ? 'PASS' : 'FAIL'} shell alias redirect ${htmlPage}`);
    console.log(`${staysRuntimeLight ? 'PASS' : 'FAIL'} shell alias stays runtime-light ${htmlPage}`);
    console.log(`${skipsStandaloneShellChrome ? 'PASS' : 'FAIL'} shell alias avoids standalone chrome ${htmlPage}`);
    if (!redirectsToShell || !staysRuntimeLight || !skipsStandaloneShellChrome) {
        failed = true;
    }
}

if (failed) {
    console.error('\nArchitecture guardrails failed.');
    process.exit(1);
}

console.log('\nArchitecture guardrails passed.');

function resolveRelative(relativePath) {
    return path.join(ROOT, relativePath);
}

function readText(relativePath) {
    return fs.readFileSync(resolveRelative(relativePath), 'utf8');
}

function countLines(relativePath) {
    return readText(relativePath).split(/\r?\n/).length;
}

/** Live assets/js tree; skips node_modules, _archive, and vendor path segments. */
function listAssetsJsFiles(dir = path.join(ROOT, 'assets', 'js'), acc = []) {
    if (!fs.existsSync(dir)) return acc;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, ent.name);
        if (ent.name === 'node_modules' || ent.name === '_archive' || ent.name === 'vendor') continue;
        if (ent.isDirectory()) listAssetsJsFiles(full, acc);
        else if (ent.isFile() && ent.name.endsWith('.js')) {
            acc.push(path.relative(ROOT, full).split(path.sep).join('/'));
        }
    }
    return acc;
}
