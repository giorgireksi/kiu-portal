import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readAsset(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf-8');
}

describe('Student Service split workspace regressions', () => {
    it('persists and restores the selected top-level lane', () => {
        const source = readAsset('assets/js/pages/student-service.js');

        expect(source).toContain("const STUDENT_SERVICE_LANES = ['service', 'qa'];");
        expect(source).toContain("const STUDENT_SERVICE_UI_PREFS_KEY = 'KIU_STUDENT_SERVICE_UI_PREFS';");
        expect(source).toContain('serviceLane: readStudentServiceStoredLane(key)');
        expect(source).toContain('qaComposerExpanded: false');
        expect(source).toContain('function setStudentServiceLane(lane, rerender = true)');
        expect(source).toContain('function clearStudentServiceLaneChoice()');
        expect(source).toContain('writeStudentServiceStoredLane(getStudentServiceLane());');
    });

    it('renders a social-style Q&A feed inside the split workspace instead of the old split-pane workbench', () => {
        const source = readAsset('assets/js/pages/student-service.js');
        const css = readAsset('assets/css/index-luxury.css');
        const mobileCss = readAsset('assets/css/mobile-responsive.css');

        expect(source).toContain('function renderStudentServiceLaneChooser(');
        expect(source).toContain('function renderStudentServiceLaneSwitcher(');
        expect(source).toContain('function renderStudentServiceStudentQaHub(');
        expect(source).toContain('function renderStudentServiceQuestionComposer(');
        expect(source).toContain('function renderStudentServiceQuestionFeed(');
        expect(source).toContain('function renderStudentServiceStaffQaFeed(');
        expect(source).toContain('function renderStudentServiceResponderServiceLane(');
        expect(source).toContain("return renderStudentServiceStaffWorkbench(container, visibleArticles, visibleTickets, { lane: 'qa' });");
        expect(source).toContain("return renderStudentServiceResponderServiceLane(container, visibleArticles);");
        expect(source).toContain("renderStudentServiceLaneChooser(role, currentUser, visibleArticles, visibleTickets)");
        expect(source).toContain('student-service-page-body:lane-chooser');
        expect(source).not.toContain('This workbench keeps private tickets, public Q&A, and knowledge articles in one moderated workspace.');
        expect(css).toContain('.student-service-qa-composer-card');
        expect(css).toContain('.student-service-qa-feed');
        expect(css).toContain('.student-service-qa-card');
        expect(css).toContain('.student-service-qa-answer-card');
        expect(mobileCss).toContain('.student-service-qa-composer-collapsed');
        expect(mobileCss).toContain('.student-service-qa-filter-row');
    });

    it('loads the split-workspace student-service bundle through a real standalone entry', () => {
        const studentServiceHtml = readAsset('student-service.html');
        const indexHtml = readAsset('index.html');
        const appJs = readAsset('assets/js/app/app.js');
        const studentsAdminHtml = readAsset('students-admin.html');

        expect(indexHtml).toContain('id="page-student-service"');
        expect(indexHtml).not.toContain('assets/js/pages/student-service.js?v=20260505-studentsvc-account-fades2');
        expect(appJs).toContain("const STUDENT_SERVICE_RUNTIME_SCRIPT = 'assets/js/pages/student-service.js?v=20260505-studentsvc-account-fades2';");
        expect(appJs).toContain('window.ensurePortalStudentServiceRuntimeLoaded = function ensurePortalStudentServiceRuntimeLoaded()');
        expect(studentServiceHtml).toContain('id="page-student-service"');
        expect(studentServiceHtml).toContain('assets/js/features/navigation.js?v=20260429-shellinit1');
        expect(studentServiceHtml).toContain('assets/js/pages/student-service.js?v=20260505-studentsvc-account-fades2');
        expect(studentServiceHtml).toContain('bootStandaloneStudentServicePage');
        expect(studentServiceHtml).not.toContain("window.location.replace(target);");
        expect(studentServiceHtml).not.toContain('assets/js/pages/student-service-qa.js');
        expect(studentServiceHtml).not.toContain('assets/js/pages/student-service-service.js');
        expect(studentsAdminHtml).not.toContain('assets/js/pages/student-service.js');
        expect(studentsAdminHtml).toContain('assets/css/index-luxury.css?v=20260514-studentsadmin-clean2');
        expect(studentsAdminHtml).toContain('assets/css/students-admin-lms.css?v=20260514-studentsadmin-clean2');
        expect(studentsAdminHtml).toContain('assets/css/mobile-responsive.css?v=20260429-studentsvcqa2');
    });

    it('keeps the student-service standalone page free of the old standalone mobile shell bootstrap', () => {
        const studentServiceHtml = readAsset('student-service.html');

        expect(studentServiceHtml).not.toContain('window.__KIU_STANDALONE_MOBILE_SHELL_CONFIG = {');
        expect(studentServiceHtml).not.toContain('assets/js/pages/standalone-mobile-shell.js?v=20260518-standalone-shell1');
        expect(studentServiceHtml).not.toContain('(function initMobileExperience(){');
        expect(studentServiceHtml).not.toContain('setInterval(function(){if(typeof window.navigate===');
    });

    it('keeps repeated student-service cards on route-scoped content-visibility guardrails', () => {
        const css = readAsset('assets/css/index-luxury.css');

        expect(css).toContain('body.lux-route-student-service .student-service-ticket-card,');
        expect(css).toContain('body.lux-route-student-service .student-service-ops-ticket,');
        expect(css).toContain('body.lux-route-student-service .student-service-qa-card,');
        expect(css).toContain('body.lux-route-student-service .student-service-qa-answer-card {');
        expect(css).toContain('content-visibility: auto;');
        expect(css).toContain('contain-intrinsic-size: 0 280px;');
    });

    it('adds efficient-tier blur and shadow fallbacks for repeated student-service surfaces', () => {
        const css = readAsset('assets/css/index-luxury.css');

        expect(css).toContain("body[data-lux-performance='efficient'].lux-route-student-service .student-service-summary-card,");
        expect(css).toContain("body[data-lux-performance='efficient'].lux-route-student-service .student-service-article-card,");
        expect(css).toContain("body[data-lux-performance='efficient'].lux-route-student-service .student-service-qa-card,");
        expect(css).toContain("body[data-lux-performance='efficient'].lux-route-student-service .student-service-qa-answer-card {");
        expect(css).toContain("body[data-lux-performance='efficient'].lux-light-mode.lux-route-student-service .student-service-summary-card,");
        expect(css).toContain("body[data-lux-performance='efficient'].lux-light-mode.lux-route-student-service .student-service-article-card,");
        expect(css).toContain('-webkit-backdrop-filter: blur(10px) saturate(118%) !important;');
        expect(css).toContain('backdrop-filter: blur(8px) saturate(112%) !important;');
    });

    it('delegates the Q&A, ops, and service-workbench actions instead of emitting inline hooks', () => {
        const source = readAsset('assets/js/pages/student-service.js');
        const qaModule = readAsset('assets/js/pages/student-service-qa.js');
        const serviceModule = readAsset('assets/js/pages/student-service-service.js');
        const combined = `${source}\n${qaModule}\n${serviceModule}`;

        expect(source).toContain('function bindStudentServiceDelegatedInteractions()');
        expect(source).toContain("const STUDENT_SERVICE_QA_MODULE_URL = 'assets/js/pages/student-service-qa.js?v=20260516-studentsvcqa-module1';");
        expect(source).toContain("const STUDENT_SERVICE_SERVICE_MODULE_URL = 'assets/js/pages/student-service-service.js?v=20260516-studentsvcservice-module1';");
        expect(source).toContain('function ensureStudentServiceQaModule()');
        expect(source).toContain('function ensureStudentServiceServiceModule()');
        expect(source).toContain('renderStudentServiceQaModuleLoading(container,');
        expect(source).toContain('renderStudentServiceServiceModuleLoading(container,');
        expect(combined).toContain('data-student-service-open-panel="tickets"');
        expect(combined).toContain('data-student-service-open-ticket=');
        expect(combined).toContain('data-student-service-focus-area=');
        expect(combined).toContain('data-student-service-question-filter-field="qaStatus"');
        expect(combined).toContain('data-student-service-question-filter-input="qaSearch"');
        expect(combined).toContain('data-student-service-open-question=');
        expect(combined).toContain('data-student-service-panel-switch=');
        expect(combined).toContain('data-student-service-ticket-filter-input=');
        expect(combined).toContain('data-student-service-save-article=');
        expect(combined).not.toContain('onclick=');
        expect(combined).not.toContain('oninput=');
        expect(combined).not.toContain('onchange=');
        expect(source).toContain('student-service-ops-card lux-summary-surface lux-summary-surface--panel');
        expect(source).toContain('student-service-ops-card student-service-ops-card--queue lux-summary-surface lux-summary-surface--panel');
    });
});
