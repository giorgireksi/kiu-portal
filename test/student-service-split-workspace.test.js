import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { expectRetiredCss } from './helpers/bare-shell-css.js';

function readAsset(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf-8');
}
function ssvcHubAndQa() {
    // Concat peels so source regressions still see symbols after hub extraction.
    return [
        'assets/js/pages/student-service-qa.js',
        'assets/js/pages/student-service.js',
        'assets/js/pages/student-service-page-runtime.js',
        'assets/js/pages/student-service-inbox-runtime.js',
        'assets/js/pages/student-service-ops-runtime.js',
        'assets/js/pages/student-service-modules-runtime.js',
        'assets/js/pages/student-service-bootstrap-runtime.js',
        'assets/js/pages/student-service-chrome.js',
        'assets/js/pages/student-service-events.js',
        'assets/js/pages/student-service-tickets.js',
        'assets/js/pages/student-service-attachments.js',
        'assets/js/pages/student-service-qa-staff-runtime.js',
        'assets/js/pages/student-service-qa-thread-runtime.js'
    ].map(readAsset).join('\n');
}

function extractStudentServiceFnBlock(source, name) {
    const marker = `function ${name}(`;
    const start = source.indexOf(marker);
    if (start < 0) return '';
    const brace = source.indexOf('{', start);
    if (brace < 0) return '';
    let depth = 0;
    for (let i = brace; i < source.length; i += 1) {
        const ch = source[i];
        if (ch === '{') depth += 1;
        else if (ch === '}') {
            depth -= 1;
            if (depth === 0) return source.slice(start, i + 1);
        }
    }
    return '';
}

function ssvcBoth() {
    return ssvcHubAndQa() + readAsset('assets/js/pages/student-service-filters.js');
}


describe('Student Service split workspace regressions', () => {
    it('persists and restores the selected top-level lane', () => {
        const source = ssvcHubAndQa();

        expect(source).toContain("const STUDENT_SERVICE_LANES = ['service', 'qa'];");
        expect(source).toContain("const STUDENT_SERVICE_UI_PREFS_KEY = 'KIU_STUDENT_SERVICE_UI_PREFS';");
        expect(source).toContain('serviceLane: readStudentServiceStoredLane(key)');
        expect(source).toContain('function setStudentServiceLane(lane, rerender = true)');
        expect(source).toContain('writeStudentServiceStoredLane(getStudentServiceLane());');
    });

    it('renders a social-style Q&A feed inside the split workspace instead of the old split-pane workbench', () => {
        const source = ssvcHubAndQa();

        expect(source).toContain('function renderStudentServiceLaneChooser(');
        expect(source).toContain('function renderStudentServiceLaneSwitcher(');
        expect(source).toContain('function renderStudentServiceCommandBar(');
        expect(source).toContain('function renderStudentServiceChooserHeader(');
        expect(source).toContain('data-student-service-command-bar="true"');
        expect(source).toContain('student-service-hero-action-cluster');
        expect(source).toContain('student-service-hero-action--primary');
        expect(source).toContain('student-service-hero-action--secondary');
        expect(source).toContain('student-service-hero-shell');
        expect(source).toContain('student-service-hero-main-shell');
        expect(source).toContain('student-service-hero-kicker');
        expect(source).toContain('student-service-hero-title');
        expect(source).toContain('student-service-hero-copy');
        expect(source).toContain('student-service-hero-aside-shell');
        expect(source).toContain('student-service-hero-meta');
        expect(source).toContain('student-service-hero-badge--role');
        expect(source).toContain('student-service-hero-badge--lane');
        expect(source).toContain('student-service-hero-badge--knowledge');
        expect(source).toContain('student-service-hero-aside-head');
        expect(source).toContain('student-service-hero-aside-stat-label');
        expect(source).toContain('student-service-hero-aside-stat-value');
        expect(source).not.toContain('student-service-summary-section');
        expect(source).not.toContain('student-service-summary-card--signal-a');
        expect(source).not.toContain('renderStudentServiceSummaryMarkup');
        expect(source).not.toContain('data-student-service-page-summary');
        expect(source).toContain('student-service-workflow-section');
        expect(source).toContain('student-service-workflow-step-title');
        expect(source).toContain('student-service-workflow-step-description');
        expect(source).toContain('student-service-qa-composer-prompt-title');
        expect(source).toContain('student-service-qa-composer-prompt-copy');
        expect(source).toContain('student-service-qa-compose-form');
        expect(source).toContain('student-service-qa-mode-switch');
        expect(source).toContain('student-service-qa-mode-btn');
        expect(source).toContain('student-service-qa-field-row');
        expect(source).toContain('student-service-qa-anonymous-toggle');
        expect(source).toContain('student-service-qa-similar-title');
        expect(source).toContain('student-service-qa-composer-modal-actions');
        expect(source).toContain('student-service-qa-card-author-name');
        expect(source).toContain('student-service-qa-card-author-date');
        expect(source).toContain('student-service-qa-card-stat');
        expect(source).toContain('student-service-qa-detail-meta');
        expect(source).toContain('student-service-qa-answer-author-name');
        expect(source).toContain('student-service-qa-answer-author-role');
        expect(source).toContain('student-service-qa-answer-time');
        expect(source).toContain('student-service-qa-answer-actions');
        expect(source).toContain('student-service-qa-reply-shell');
        expect(source).toContain('student-service-qa-related-copy');
        expect(source).toContain('student-service-qa-detail-actions');
        expect(source).toContain('student-service-qa-detail-actions--moderation');
        expect(source).toContain('social-neo-comment');
        expect(source).toContain('social-neo-comment-bubble');
        expect(source).toContain('function renderStudentServiceAnswerThreadNode(');
        expect(source).toContain('student-service-qa-empty-note');
        expect(source).toContain('No comments yet. Be the first to reply.');
        expect(source).toContain('student-service-qa-detail-action-btn');
        expect(source).toContain('student-service-qa-detail-action-btn--feedback');
        expect(source).toContain('student-service-qa-detail-action-btn--moderation');
        expect(source).toContain('student-service-qa-answer-helpful-btn');
        expect(source).toContain('data-student-service-answer-helpful');
        expect(source).toContain('function setStudentServiceAnswerFeedback(');
        expect(source).not.toContain('data-student-service-answer-accept');
        expect(source).not.toContain('function acceptStudentServiceAnswer(');
        expect(source).toContain('student-service-qa-composer-open-btn');
        expect(source).toContain('openStudentServiceQuestionComposerModal');
        expect(source).toContain('closeStudentServiceQuestionComposerModal');
        expect(source).toContain('renderStudentServiceQuestionComposerModalShell');
        expect(source).toContain('data-student-service-question-composer-modal');
        expect(source).toContain('data-student-service-dismiss-composer-modal');
        expect(source).toContain('__studentServiceComposerModalInteractionsBound');
        expect(source).toContain('student-service-qa-card-toggle-btn');
        expect(source).toContain('student-service-qa-empty-state');
        expect(source).toContain('student-service-qa-reply-input');
        expect(source).toContain('student-service-qa-reply-submit-btn');
        expect(source).toContain('function getStudentServiceStatusClass(');
        expect(source).toContain('function getStudentServiceQuestionStatusClass(');
        expect(source).toContain('role="group" aria-label="Workspace lanes"');
        expect(source).toContain('role="group" aria-label="Choose Student Service lane"');
        expect(source).toContain('function renderStudentServiceStudentQaHub(');
        expect(source).toContain('function renderStudentServiceQuestionComposer(');
        expect(source).toContain('function renderStudentServiceQuestionFeed(');
        expect(source).toContain('student-service-qa-avatar student-service-qa-avatar-sm');
        expect(source).toContain('ssClampText(question.body, 100)');
        expect(source).toContain('function renderStudentServiceStaffQaFeed(');
        expect(source).toContain('function renderStudentServiceResponderServiceLane(');
        expect(source).toContain('class="content-box surface-card student-service-detail-card"');
        expect(source).toContain('class="student-service-detail-toggle"');
        expect(source).toContain('class="student-service-detail-title"');
        expect(source).toContain('class="student-service-detail-icon"');
        expect(source).toContain('class="student-service-detail-body"');
        expect(source).toContain('class="student-service-loading-state"');
        expect(source).toContain('class="fas fa-spinner fa-spin student-service-loading-icon"');
        expect(source).toContain("return renderStudentServiceStaffWorkbench(container, visibleArticles, visibleTickets, { lane: 'qa' });");
        expect(source).toContain("return renderStudentServiceResponderServiceLane(container, visibleArticles);");
        expect(source).toContain("renderStudentServiceLaneChooser(role, currentUser, visibleArticles, visibleTickets)");
        expect(source).toContain('student-service-page-body:lane-chooser');
        expect(source).not.toContain('This workbench keeps private tickets, public Q&A, and knowledge articles in one moderated workspace.');
        expect(source).not.toContain('style="padding:0;"');
        expect(source).not.toContain('style="width:100%; display:flex; align-items:center; justify-content:space-between; gap:12px; padding:16px 18px; border:none; background:transparent; cursor:pointer; text-align:left;"');
        expect(source).not.toContain('style="font-size:13px; font-weight:800; color:var(--lux-text);"');
        expect(source).not.toContain('style="font-size:18px; color:var(--lux-text-muted);"');
        expect(source).not.toContain('style="padding:0 18px 18px;"');
        expect(source).not.toContain('style="text-align:center; padding:80px 20px; color:var(--lux-text-muted);"');
        expect(source).not.toContain('style="font-size:32px; margin-bottom:16px; display:block;"');
        expect(source).not.toContain('style="--student-service-status-bg:');
        expect(source).not.toContain('class="page-hero-badge admin-chip"');
        expect(source).toContain('class="admin-hero student-service-hero lux-hero-stage"');
        expect(source).not.toContain('class="page-hero-title admin-hero-title"');
        expect(source).not.toContain('class="page-hero-copy admin-hero-subtitle"');
        expect(source).not.toContain('class="admin-hero-actions student-service-hero-actions student-service-hero-action-cluster"');
    });

    it('loads the split-workspace student-service bundle through a real standalone entry', () => {
        const studentServiceHtml = readAsset('student-service.html');
        const indexHtml = readAsset('index.html');
        const appJs = readAsset('assets/js/app/app.js');
        const studentsAdminHtml = readAsset('students-admin.html');

        expect(indexHtml).not.toContain('id="page-student-service"');
        expect(indexHtml).not.toContain('assets/css/student-service-route.css');
        expect(indexHtml).not.toContain('id="student-service-modal-root"');
        expect(indexHtml).not.toContain('assets/js/pages/student-service.js');
        expect(appJs).not.toContain('ensurePortalStudentServiceRuntimeLoaded');
        expect(appJs).not.toContain('STUDENT_SERVICE_RUNTIME_SCRIPT');
        expect(studentServiceHtml).toContain('id="page-student-service"');
        expect(studentServiceHtml).toContain('id="student-service-modal-root"');
        expect(studentServiceHtml).not.toContain('assets/css/student-service-route.css');
        expect(studentServiceHtml).toContain('assets/css/lux-page-bare-lite.css');
        expectRetiredCss('student-service-route.css');
        expect(studentServiceHtml).toContain('assets/js/shared/lux-scroll-rail.js?v=20260608-scrollrail2');
        expect(studentServiceHtml).toContain('assets/js/features/navigation.js?v=20260625-ssvc-workspace-nav2');
        expect(studentServiceHtml).toContain('assets/js/shared/student-service-api-paths.js?v=20260626-ssvc-inbox-filters');
        expect(studentServiceHtml).toContain('assets/js/pages/student-service.js?v=20260728-ssrender3');
        expect(studentServiceHtml).toContain('student-service-bootstrap-runtime.js?v=20260727-ssboot2');
        expect(studentServiceHtml).toContain('student-service-page-runtime.js?v=20260728-ssboot3');
        expect(studentServiceHtml.indexOf('student-service-bootstrap-runtime.js'))
            .toBeLessThan(studentServiceHtml.indexOf('student-service-page-runtime.js'));
        expect(studentServiceHtml).toContain('assets/js/app/api.js?v=20260626-ssvc-inbox-filters');
        expect(studentServiceHtml).toContain('initStandaloneStudentServiceRoute');
        expect(studentServiceHtml).toContain('bootStandaloneDesktopRoute');
        expect(studentServiceHtml).not.toContain("window.location.replace(target);");
        expect(studentServiceHtml).not.toContain('assets/js/pages/student-service-qa.js');
        expect(studentServiceHtml).not.toContain('assets/js/pages/student-service-service.js');
        expect(studentsAdminHtml).not.toContain('assets/js/pages/student-service.js');
        expect(studentsAdminHtml).not.toContain('assets/css/index-luxury.css');
        expect(studentsAdminHtml).toContain('assets/css/lux-page-bare-lite.css');
        expect(studentsAdminHtml).toContain('assets/css/mobile-shell-core.css');
    });

    it('keeps the student-service standalone page on the shared mobile shell contract', () => {
        const studentServiceHtml = readAsset('student-service.html');

        expect(studentServiceHtml).toContain('window.__KIU_STANDALONE_MOBILE_SHELL_CONFIG = {');
        expect(studentServiceHtml).toContain('assets/js/pages/standalone-mobile-shell.js');
        expect(studentServiceHtml).not.toContain('(function initMobileExperience(){');
        expect(studentServiceHtml).not.toContain('setInterval(function(){if(typeof window.navigate===');
    });

    it('keeps repeated student-service cards on route-scoped content-visibility guardrails', () => {
        expectRetiredCss('student-service-route.css');
    });

    it('adds efficient-tier blur and shadow fallbacks for repeated student-service surfaces', () => {
        expectRetiredCss('student-service-route.css');
    });

    it('renders guidance modal as a search-only split workspace without lane cards or topic picker', () => {
        const serviceModule = readAsset('assets/js/pages/student-service-service.js');
        const studentServiceJs = ssvcHubAndQa();

        expect(serviceModule).not.toContain('renderStudentServiceLaneRailMarkup');
        expect(serviceModule).not.toContain('student-service-lane-card');
        expect(serviceModule).not.toContain('student-service-find-lanes');
        expect(serviceModule).not.toContain('renderStudentServiceGuidanceTopicFilterMarkup');
        expect(serviceModule).not.toContain('data-student-service-guidance-topic-filter');
        expect(serviceModule).toContain('student-service-guidance-workspace');
        expect(serviceModule).toContain('Search articles and guidance');
        expect(serviceModule).toContain('renderStudentServiceGuidanceBrowserMarkup');
        expect(serviceModule).toContain('data-student-service-open-guidance-modal="true"');
        expect(studentServiceJs).not.toContain('setStudentServiceGuidanceTopicFilter');
    });

    it('delegates the Q&A, ops, and service-workbench actions instead of emitting inline hooks', () => {
        const source = ssvcHubAndQa();
        const qaModule = readAsset('assets/js/pages/student-service-qa.js');
        const serviceModule = readAsset('assets/js/pages/student-service-service.js');
        const combined = `${source}\n${qaModule}\n${serviceModule}`;

        expect(source).toContain('function bindStudentServiceDelegatedInteractions()');
        expect(source).toContain('function handleStudentServiceRootClick(');
        expect(source).toContain('function handleStudentServiceModalDocumentClick(');
        expect(source).toContain("const STUDENT_SERVICE_QA_MODULE_URL = 'assets/js/pages/student-service-qa.js?v=20260626-ssvc-qa-header-merge1';");
        expect(source).toContain("const STUDENT_SERVICE_SERVICE_MODULE_URL = 'assets/js/pages/student-service-service.js?v=20260628-ssvc-hub-merge';");
        expect(source).toContain('function bindStudentServiceRealtimeRefreshListener(');
        expect(source).toContain('window.buildStudentServiceArticleFingerprint = buildStudentServiceArticleFingerprint;');
        expect(serviceModule).toContain('buildStudentServiceGuidanceBrowserContext');
        expect(serviceModule).toContain('data-student-service-open-guidance-modal="true"');
        expect(source).toContain('function canShowStudentServiceArticleEditorActions(');
        expect(source).toContain('window.canShowStudentServiceArticleEditorActions = canShowStudentServiceArticleEditorActions;');
        expect(source).toContain('function syncStudentServiceWorkspaceBackendSession(');
        expect(source).toContain('window.syncStudentServiceWorkspaceBackendSession = syncStudentServiceWorkspaceBackendSession;');
        expect(source).toContain('function buildStudentServiceArticleFingerprint(');
        expect(source).toContain('scheduleKiuRealtimeBootstrap(true)');
        expect(source).toContain('await syncStudentServiceWorkspaceBackendSession();');
        expect(source).toContain('function getStudentServicePublicInboxFilterLayout(');
        expect(source + readAsset('assets/js/pages/student-service-filters.js')).toContain('function getStudentServicePublishedInboxFilterLayout(');
        expect(source).toContain('function publishStudentServiceInboxFilterLayoutFromEffective(');
        expect(source).toContain("const STUDENT_SERVICE_PUBLISHED_FILTER_LAYOUT_KEY = 'KIU_STUDENT_SERVICE_PUBLISHED_FILTER_LAYOUT'");
        expect(source).toContain('async function persistStudentServiceSharedInboxFilterLayout(');
        expect(source).toContain('maybeSyncStudentServicePersonalInboxFilterLayoutToTeam');
        expect(source).not.toContain('if (studentServiceInboxFilterLayoutHasDropdowns(sharedLayout)) return;');
        expect(source).toContain('window.getStudentServicePublishedInboxFilterLayout = getStudentServicePublishedInboxFilterLayout;');
        expect(source).toContain('window.invalidateStudentServiceRenderSignature = invalidateStudentServiceRenderSignature;');
        expect(source + readAsset('assets/js/pages/student-service-filters.js')).toContain('function pruneStudentServiceCustomTicketFilters(');
        expect(source).toContain('function invalidateStudentServiceRenderSignature(');
        expect(source).toContain('publishStudentServiceInboxFilterLayout(normalized);');
        expect(source).toContain('pruneStudentServiceCustomTicketFilters(normalized);');
        expect(serviceModule).toContain('getStudentServicePublishedInboxFilterLayout()');
        expect(serviceModule).toContain('layout: publishedLayout');
        expect(serviceModule).toContain('window.enhanceUniversalPickers(shell.request)');
        expect(serviceModule).toContain('window.renderStudentServiceInboxFiltersMarkup');
        expect(serviceModule).toContain('window.getStudentServiceFilteredStaffTickets');
        expect(serviceModule).not.toContain('data-student-service-ticket-filter-field="ticketSearch"');
        expect(source + readAsset('assets/js/pages/student-service-filters.js')).toContain('function renderStudentServiceInboxDropdownFiltersMarkup(');
        expect(source).toContain('function buildStudentServiceTicketIntakeFromInboxFilters(');
        expect(source).toContain('window.renderStudentServiceInboxDropdownFiltersMarkup = renderStudentServiceInboxDropdownFiltersMarkup;');
        expect(serviceModule).toContain('student-service-request-filters');
        expect(serviceModule).not.toContain('Auto-filled context');
        expect(serviceModule).not.toContain('student-service-request-meta');
        expect(serviceModule).not.toContain('data-student-service-toggle-student-details');
        expect(serviceModule).not.toContain('Hide optional details');
        expect(serviceModule).not.toContain('student-service-request-extra');
        expect(serviceModule).not.toContain('data-student-service-navigate');
        expect(serviceModule).not.toContain('Support Hub');
        expect(source).not.toContain('function toggleStudentServiceStudentDetails(');
        expect(source).toContain('function ensureStudentServiceQaModule()');
        expect(source).toContain('function ensureStudentServiceServiceModule()');
        expect(source).toContain('renderStudentServiceQaModuleLoading(container,');
        expect(source).toContain('renderStudentServiceServiceModuleLoading(container,');
        expect(combined).toContain('data-student-service-open-panel="tickets"');
        expect(combined).toContain('data-student-service-open-ticket=');
        expect(combined).toContain('data-student-service-focus-area=');
        expect(combined).not.toContain('data-student-service-question-filter-field="qaStatus"');
        expect(combined).not.toContain('data-student-service-question-filter-field="qaFaculty"');
        expect(combined).not.toContain('data-student-service-question-filter-field="qaCategory"');
        expect(combined).toContain('data-student-service-question-filter-input="qaSearch"');
        expect(combined).toContain('data-student-service-open-question=');
        expect(combined).toContain('data-student-service-panel-switch=');
        expect(combined).toContain('data-student-service-ticket-filter-input=');
        expect(combined).toContain('data-student-service-save-article=');
        expect(serviceModule).not.toContain('id="student-service-article-topic"');
        expect(serviceModule).not.toContain('data-lux-picker-label="Topic"');
        expect(serviceModule).not.toContain('student-service-article-category');
        expect(serviceModule).not.toContain('student-service-article-audience');
        expect(serviceModule).not.toContain('Audience: ${article.audience}');
        expect(source).not.toContain("document.getElementById('student-service-article-topic')");
        expect(source).toContain("document.getElementById('student-service-article-title')");
        expect(combined).not.toContain('onclick=');
        expect(combined).not.toContain('oninput=');
        expect(combined).not.toContain('onchange=');
        expect(source).toContain('student-service-ops-card lux-summary-surface lux-summary-surface--panel');
        expect(source).toContain('student-service-ops-card student-service-ops-card--queue lux-summary-surface lux-summary-surface--panel');
    });
});

describe('student-service button cascade guardrails', () => {
    it('student-service-route.css must not use a catch-all gradient rule for page buttons', () => {
        expectRetiredCss('student-service-route.css');
    });

    it('index-luxury.css must not use the same catch-all gradient rule for page buttons', () => {
        expectRetiredCss('index-luxury.css');
    });

    it('student-service-route.css must opt in primary buttons instead of cascading gradients to every button', () => {
        expectRetiredCss('student-service-route.css');
    });

    it('student-service-route.css must exempt surface cards from primary button styling', () => {
        expectRetiredCss('student-service-route.css');
    });

    it('student-service-route.css must style filter pills as secondary controls', () => {
        expectRetiredCss('student-service-route.css');
    });

    it('student-service.js keeps Q&A search-only without dimension filter pills', () => {
        const source = ssvcHubAndQa();
        const qaModule = readAsset('assets/js/pages/student-service-qa.js');
        const serviceModule = readAsset('assets/js/pages/student-service-service.js');
        const combined = `${source}\n${qaModule}\n${serviceModule}`;

        expect(source).not.toContain('renderStudentServiceQuestionFilterChips');
        expect(source).not.toContain('student-service-qa-filter-stack');
        expect(combined).not.toContain('data-student-service-question-filter-field="qaStatus"');
        expect(combined).not.toContain('data-student-service-question-filter-input="qaStatus"');
        expect(source).toContain("if (field !== 'qaSearch') return;");
        expect(combined).toContain('data-student-service-question-filter-input="qaSearch"');
    });

    it('student-service.js composer modal cancel button must use lux-secondary-btn', () => {
        const source = ssvcHubAndQa();

        expect(source).toContain(
            'class="lux-secondary-btn" data-student-service-cancel-composer-modal="true"'
        );
    });

    it('light mode must distinguish hero-action--secondary instead of grouping bare hero-action with mini-action', () => {
        expectRetiredCss('student-service-route.css');
    });
});

describe('lane switcher render recovery', () => {
    it('memoizes markup per DOM element so lane shell swaps still repaint', () => {
        const source = ssvcHubAndQa();

        expect(source).toContain('const studentServiceMarkupCache = new WeakMap();');
        expect(source).toContain('studentServiceMarkupCache.get(element)');
        expect(source).toContain('studentServiceMarkupCache.set(element, { key, markup })');
        expect(source).not.toContain('const studentServiceMarkupCache = Object.create(null)');
        expect(source).not.toContain('studentServiceMarkupCache[key] = markup');
    });

    it('lane switcher and chooser share the same delegated lane handler', () => {
        const source = ssvcHubAndQa();

        expect(source).toMatch(/studentServiceEventEl\(event, '\[data-student-service-lane\]'\)|event\.target\.closest\('\[data-student-service-lane\]'\)/);
        expect(source).toMatch(/setStudentServiceLane\(laneButton\.dataset\.studentServiceLane \|\| '(?:service)?'\)/);
        expect(source).toContain('data-student-service-lane="service"');
        expect(source).toContain('data-student-service-lane="qa"');
        expect(source).toContain('function setStudentServiceLane(lane, rerender = true)');
        expect(source).toContain('if (rerender) renderStudentServicePage();');
    });

    it('lands on Q&A feed when switching lanes by clearing open thread state', () => {
        const studentServiceJs = ssvcHubAndQa();
        const serviceModule = readAsset('assets/js/pages/student-service-service.js');

        expect(studentServiceJs).toContain('ui.selectedQuestionId = \'\';');
        expect(studentServiceJs).toContain('closeStudentServiceQuestionThreadModal();');
        expect(studentServiceJs).toContain('closeStudentServiceInlineReply();');
        expect(studentServiceJs).toContain('updateStudentServiceQuestionThreadActiveCards(\'\');');
        expect(serviceModule).toContain('const selectedQuestion = lane === \'qa\'');
        expect(serviceModule).toContain('? getStudentServiceOpenQuestion(filteredQuestions)');
        expect(serviceModule).toContain(': null;');
        expect(serviceModule).not.toContain('getStudentServiceSelectedQuestion(filteredQuestions)');
    });

    it('lane bodies replace shell children when switching between QA and service modules', () => {
        const qaModule = readAsset('assets/js/pages/student-service-qa.js');
        const serviceModule = readAsset('assets/js/pages/student-service-service.js');

        expect(qaModule).toContain('container.replaceChildren(range.createContextualFragment(');
        expect(qaModule).toContain('data-student-service-student-qa-shell="1"');
        expect(serviceModule).toContain('container.replaceChildren(range.createContextualFragment(');
        expect(serviceModule).toContain('data-student-service-student-hub-shell="1"');
    });

    it('keeps compose markup stable while draft text changes', () => {
        const studentServiceJs = ssvcHubAndQa();
        const serviceModule = readAsset('assets/js/pages/student-service-service.js');

        expect(studentServiceJs).toContain('function captureStudentServiceComposeFocus(scopeElement)');
        expect(studentServiceJs).toContain('function restoreStudentServiceComposeFocus(scopeElement, state)');
        expect(studentServiceJs).toContain('function scheduleStudentServiceTicketFilterRender()');
        expect(studentServiceJs).toContain('function setStudentServiceDraftTicketField(field, value, rerender = false)');
        expect(studentServiceJs).toContain('{ debounce: event.target.type === \'search\' }');
        expect(serviceModule).toContain('data-lux-transparency-exempt="1"');
        expect(serviceModule).toContain('data-student-service-draft-ticket-field="message"');
        expect(serviceModule).toContain('>${ssEscape(draft.message)}</textarea>');
        expect(serviceModule).toContain('`student-service-student-hub:request:${selectedArea.id}:${JSON.stringify(ui.customTicketFilters || {})}:${JSON.stringify(publishedLayout?.filters || [])}`');
        expect(serviceModule).not.toContain('${draft.title || \'\'');
        expect(serviceModule).not.toContain('${draft.message || \'\'');
    });
});

describe('student service bootstrap and module recovery guardrails', () => {
    it('renders a bootstrap error banner with retry when workspace data fails to load', () => {
        const source = ssvcHubAndQa();

        expect(source).toContain('function renderStudentServiceBootstrapErrorBanner()');
        expect(source).toContain('student-service-bootstrap-error-banner');
        expect(source).toContain('student-service-bootstrap-error-title');
        expect(source).toContain('student-service-bootstrap-error-message');
        expect(source).toContain('data-student-service-retry-bootstrap="1"');
        expect(source).toContain('STUDENT_SERVICE_RUNTIME.bootstrapErrorMessage');
        expect(source).toContain('STUDENT_SERVICE_RUNTIME.loadFailed ? renderStudentServiceBootstrapErrorBanner() : \'\'');
        expect(source).toContain("const retryBootstrapButton = event.target.closest('[data-student-service-retry-bootstrap]');");
    });

    it('recovers service module load failures with retry controls', () => {
        const source = ssvcHubAndQa();

        expect(source).toContain('function renderStudentServiceServiceModuleLoadError(');
        expect(source).toContain('function handleStudentServiceServiceModuleLoadFailure(');
        expect(source).toContain('student-service-service-module-error');
        expect(source).toContain('student-service-service-module-retry-btn');
        expect(source).toContain('data-student-service-retry-service-module');
        expect(source).toContain('.catch(() => handleStudentServiceServiceModuleLoadFailure(container, \'student\'))');
        expect(source).toContain('.catch(() => handleStudentServiceServiceModuleLoadFailure(container, \'responder\'))');
        expect(source).toContain('.catch(() => handleStudentServiceServiceModuleLoadFailure(container, \'service\'))');
        expect(source).toContain("const retryServiceModuleButton = event.target.closest('[data-student-service-retry-service-module]');");
    });

    it('routes internal notes and handoff writes through manifest API paths', () => {
        const source = ssvcHubAndQa();
        const apiPaths = readAsset('assets/js/shared/student-service-api-paths.js');

        expect(apiPaths).toContain('ticketInternalNotes: (ticketId) =>');
        expect(apiPaths).toContain('ticketHandoff: (ticketId) =>');
        expect(apiPaths).toContain('/internal-notes');
        expect(apiPaths).toContain('/handoff');
        expect(source + readAsset('assets/js/pages/student-service-tickets.js')).toContain('STUDENT_SERVICE_API_PATHS.ticketInternalNotes(ticket.id)');
        expect(source + readAsset('assets/js/pages/student-service-tickets.js')).toContain('STUDENT_SERVICE_API_PATHS.ticketHandoff(ticket.id)');
        expect(source + readAsset('assets/js/pages/student-service-tickets.js')).toContain('async function addStudentServiceInternalNote()');
        expect(source + readAsset('assets/js/pages/student-service-tickets.js')).toContain('async function updateStudentServiceHandoff()');
        expect(source).not.toMatch(/['"`]\/api\/student-service\/tickets\/[^'"`]+\/internal-notes['"`]/);
        expect(source).not.toMatch(/['"`]\/api\/student-service\/tickets\/[^'"`]+\/handoff['"`]/);
    });
});

describe('Q&A hub interaction render guardrails', () => {
    it('includes draft-question state in the body render signature without inline composer expansion', () => {
        const source = ssvcHubAndQa();

        expect(source).not.toContain('ui.qaComposerExpanded ? \'1\' : \'0\'');
        expect(source).toContain('ui.draftQuestion?.askMode || \'public\'');
        expect(source).toContain('ui.draftQuestion?.anonymousMode ? \'1\' : \'0\'');
    });

    it('keeps delegated handlers for composer modal open and Q&A search input', () => {
        const source = ssvcHubAndQa();

        expect(source).toMatch(/studentServiceEventEl\(event, '\[data-student-service-question-composer-toggle\]'\)|event\.target\.closest\('\[data-student-service-question-composer-toggle\]'\)/);
        expect(source).toContain('openStudentServiceQuestionComposerModal();');
        expect(source).toContain('__studentServiceComposerModalInteractionsBound');
        expect(source).not.toContain("const questionFilterButton = event.target.closest('[data-student-service-question-filter-field][data-student-service-question-filter-value]');");
        expect(source).toContain("if (event.target.matches('[data-student-service-question-filter-input]'))");
        expect(source).toContain('setStudentServiceQuestionFilter(');
    });

    it('uses a static Ask something opener without Q&A dimension filter pills', () => {
        const source = ssvcHubAndQa();
        const qaModule = readAsset('assets/js/pages/student-service-qa.js');

        expect(source).not.toContain('data-student-service-question-filter-field="qaStatus"');
        expect(source).toContain('data-student-service-question-composer-toggle="open"><i class="fas fa-pen"></i> Ask');
        // Composer markup owns the Ask opener after Q&A domain extract.
        expect(qaModule).toContain('data-student-service-question-composer-toggle="open"');
        expect(qaModule).toContain('window.openStudentServiceQuestionComposerModal = openStudentServiceQuestionComposerModal');
        expect(readAsset('assets/js/pages/student-service.js')).toContain('resolveStudentServiceExportImpl(name)');
        expect(readAsset('assets/js/pages/student-service-events.js')).toContain('ensureStudentServiceQaModule().then(openComposer)');
    });

    it('recovers stale Q&A loading bodies and routes staff QA through the guarded feed entry', () => {
        const source = ssvcHubAndQa();
        const serviceModule = readAsset('assets/js/pages/student-service-service.js');
        const qaModule = readAsset('assets/js/pages/student-service-qa.js');

        expect(source).toContain('function isStudentServiceQaBodyStale()');
        expect(source).toContain('function scheduleStudentServiceModuleRerenderIfNeeded()');
        expect(source).toContain('function renderStudentServiceQaModuleLoadError(');
        expect(source).toContain('data-student-service-retry-qa-module');
        expect(source).toContain("actionType: 'composer'");
        expect(source).toContain('function captureStudentServiceLazyModuleStubs()');
        expect(source).toContain('STUDENT_SERVICE_STUDENT_QA_HUB_STUB');
        expect(source).toContain('window.renderStudentServiceStudentQaHub !== STUDENT_SERVICE_STUDENT_QA_HUB_STUB');
        expect(source).toContain('window.__studentServiceStaffQaFeedGuard = STUDENT_SERVICE_STAFF_QA_FEED_STUB');
        expect(serviceModule).toContain('window.__studentServiceStaffQaFeedGuard');
        expect(qaModule).toContain('typeof window.renderStudentServiceStudentQaHub === \'function\'');
    });
});

describe('Q&A open chat guardrails', () => {
    it('posts questions instantly and opens replies to every logged-in viewer', () => {
        const source = ssvcHubAndQa();

        expect(source).toContain("alert('Your question was posted.');");
        expect(source).not.toContain('submitted for review');
        expect(source).toContain('student-service-qa-thread-compose');
        expect(source).not.toContain('canRespond && role !== USER_ROLES.STUDENT');
        expect(source).not.toContain('renderStudentServiceQuestionFilterChips');
        expect(source).not.toContain('student-service-qa-filter-stack');
        expect(source).toContain("if (field !== 'qaSearch') return;");
        expect(source).not.toContain("data-student-service-question-publish=\"true\"");
    });

    it('keeps student Q&A command bar free of desk copy', () => {
        const source = ssvcHubAndQa();
        const qaModule = readAsset('assets/js/pages/student-service-qa.js');

        expect(source).not.toContain('Open campus chat for questions and answers.');
        expect(source).not.toContain('student-service-command-bar-brand');
        expect(source).not.toContain('Pending review');
        expect(qaModule).not.toContain('student-service-qa-activity-row');
    });
});

describe('Q&A card interaction guardrails', () => {
    it('invalidates page render via content fingerprint and clears signature only as last resort', () => {
        const source = ssvcHubAndQa();

        expect(source).toContain('function buildStudentServiceQaContentFingerprint(');
        expect(source).toContain('viewerHelpfulVote ? 1 : 0');
        expect(source).toContain('buildStudentServiceQaContentFingerprint(getStudentServiceFilteredQuestions(getStudentServiceVisibleQuestions()))');
        expect(source).toContain('function syncStudentServiceRenderSignature(');
        expect(source).toContain('delete container.dataset.studentServiceRenderSignature');
        expect(source).toContain('delete container.dataset.studentServiceChromeSignature');
    });

    it('uses content-aware QA feed cache keys in lazy modules', () => {
        const source = ssvcHubAndQa();
        const qaModule = readAsset('assets/js/pages/student-service-qa.js');

        expect(source).toContain('function buildStudentServiceQaFeedCacheKey(');
        expect(qaModule).toContain('buildStudentServiceQaFeedCacheKey(ui, filteredQuestions)');
    });

    it('renders flat thread comments with compose section and lux skip on card buttons', () => {
        const source = ssvcHubAndQa();

        expect(source).toContain('student-service-qa-thread-comments');
        expect(source).toContain('student-service-qa-thread-compose');
        expect(source).toContain('data-student-service-reply-input="${ssEscape(question.id)}"');
        expect(source).toContain('data-lux-skip-modern-button="true" data-student-service-open-question=');
        expect(source).toContain("skipLuxButton: 'data-lux-skip-modern-button=\"true\"'");
        expect(source).toContain('data-student-service-question-feedback="helpful"');
        expect(source).not.toContain('data-student-service-question-feedback="not_helpful"');
        expect(source).toContain('STUDENT_SERVICE_API_PATHS.questionAnswerFeedback');
        expect(source).toContain('viewerCanRespond');
    });
});

describe('Q&A comment reply guardrails', () => {
    it('groups answers into threaded comments with per-comment reply controls', () => {
        const source = ssvcHubAndQa();

        expect(source).toContain('function includeStudentServiceThreadParents(');
        expect(source).toContain('function preferStudentServiceAnswerRecord(');
        expect(source).toContain('function buildStudentServiceAnswerThread(');
        expect(source).toContain('function setStudentServiceReplyTarget(');
        expect(source).toContain('function clearStudentServiceReplyTarget(');
        expect(source).toContain('function openStudentServiceInlineReply(');
        expect(source).toContain('function closeStudentServiceInlineReply(');
        expect(source).toContain('function relayoutStudentServiceCommentTrunks(');
        expect(source).toContain('function patchStudentServiceOpenQuestionThread(');
        expect(source).toContain('data-student-service-reply-to-answer=');
        expect(source).toContain('data-student-service-parent-answer=');
        expect(source).toContain('parentAnswerId');
        expect(source).toContain('student-service-qa-comment-reply-shell');
        expect(source).toContain('social-neo-comment-children');
        expect(source).toContain("isReply ? ' is-reply social-neo-comment-depth-1' : ''");
        expect(source).toContain('openStudentServiceInlineReply(normalizedQuestionId, normalizedAnswerId)');
        expect(source).toContain('closeStudentServiceInlineReply();');
    });

    it('styles nested comment replies and inline reply shells', () => {
    });

    it('keeps thread modal actions lean without staff tools panel', () => {
        const source = ssvcHubAndQa();

        expect(source).toContain('function renderStudentServiceQuestionDetailActionsMarkup(');
        expect(source).not.toContain('student-service-qa-staff-tools-panel');
        expect(source).toContain('inThreadModal: true');
        expect(source).toContain('student-service-qa-detail--modal');
        expect(source).not.toContain('student-service-qa-detail-actions-shell');
    });

    it('delegates QA thread clicks from the modal root host', () => {
        const source = ssvcHubAndQa();

        expect(source).toContain('function handleStudentServiceQaThreadClick(');
        expect(source).toContain('studentServiceModalQaInteractionsBound');
        expect(source).toContain('handleStudentServiceQaThreadClick(event)');
        expect(source).toContain('[data-student-service-question-feedback]');
        expect(source).toContain('[data-student-service-owner-resolution]');
        expect(source).toContain('setStudentServiceQuestionFeedback(');
        expect(source).toContain('setStudentServiceQuestionOwnerResolution(');
    });

    it('merges flat answers back onto questions and nests replies for thread lines', () => {
        const source = ssvcHubAndQa();

        expect(source).toContain('const answerIds = new Set((answers || []).map(entry => String(entry.id || \'\').trim()).filter(Boolean));');
        expect(source).toContain('if (!parentId || !answerIds.has(parentId))');
        expect(source).toContain('threadChildrenHtml');
        expect(source).toContain('preferStudentServiceAnswerRecord');
        expect(source).toContain('answer.authorUserId');
        expect(source).toContain('includeStudentServiceThreadParents(visibleAnswers, allQuestionAnswers)');
        expect(source).toContain('.filter(answer => String(answer.questionId) === questionId)');
        expect(source).toContain('<div class="social-neo-comment-children">');
        expect(source).toContain('hasChildrenClass');
    });

    it('resolves parentAnswerId from inline reply shells and merges POST question snapshots', () => {
        const source = ssvcHubAndQa();

        expect(source).toContain('function resolveStudentServiceReplyShell(');
        expect(source).toContain('function resolveStudentServiceParentAnswerId(');
        expect(source).toContain('function mergeStudentServiceQuestionSnapshot(');
        expect(source).toContain('function appendStudentServiceReplyNode(');
        expect(source).toContain('data-student-service-reply-answer-id=');
        expect(source).toContain('student-service-qa-comment-reply-shell" data-student-service-reply-answer-id');
        expect(source).not.toContain('student-service-qa-comment-reply-shell student-service-qa-reply-shell');
        expect(source).toContain('ui.replyingToAnswerId');
        expect(source).toContain('resolveStudentServiceReplyShell(triggerElement)');
        expect(source).toContain('if (payload?.question) mergeStudentServiceQuestionSnapshot(payload.question);');
        expect(source).toContain('pendingReplyParentAnswerId');
        expect(source).toContain('student-service-qa-parent-answer-id');
        expect(source).toContain('isStudentServiceInlineReplyOpen()');
        expect(source).toContain('requestBody.parentAnswerId = parentAnswerId');
        expect(source).toContain('forceInlineReply: isInlineSubmit');
        expect(source).toContain('scheduleStudentServiceThreadRelayout(thread);');
    });

    it('renders nested reply markup when thread entries carry parentAnswerId', () => {
        const source = ssvcHubAndQa();

        expect(source).toContain('replies.length');
        expect(source).toContain('<div class="social-neo-comment-children">');
        expect(source).toContain('isReply: true');
        expect(source).toContain('hasChildrenClass');
        expect(source).toContain('renderStudentServiceAnswerThreadNode(question, entry, answerCardOptions(entry.answer))');
    });

    it('hard-locks nested reply parentAnswerId and supports two-step comment delete', () => {
        const source = ssvcHubAndQa();

        expect(source).toContain('requestBody.parentAnswerId = parentAnswerId');
        expect(source).toContain('Reply was saved as a top-level comment');
        expect(source).toContain('Could not open inline reply on this comment');
        expect(source).toContain('is-inline-reply-open');
        expect(source).toContain('student-service-qa-inline-reply-banner');
        expect(source).toContain('function deleteStudentServiceQuestionAnswer(');
        expect(source).toContain('function deleteStudentServiceQuestion(');
        expect(source).toContain('function openStudentServiceDeleteConfirm(');
        expect(source).toContain('function openStudentServiceDeleteQuestionConfirm(');
        expect(source).toContain('function canCurrentUserDeleteStudentServiceQuestion(');
        expect(source).toContain('function removeStudentServiceQuestionFromSnapshot(');
        expect(source).toContain('function removeStudentServiceAnswersFromSnapshot(');
        expect(source).toContain('function collectStudentServiceAnswerBranchIds(');
        expect(source).toContain('data-student-service-delete-question');
        expect(source).toContain('data-student-service-confirm-question-delete');
        expect(source).toContain('STUDENT_SERVICE_API_PATHS.questionDelete');
        expect(source).toContain('function ensureStudentServiceModalRoot(');
        expect(source).toContain('document.body.appendChild(root)');
        expect(source).toContain('student-service-qa-delete-confirm-heading');
        expect(source).toContain('student-service-qa-delete-confirm-icon-chip');
        expect(source).toContain('student-service-qa-delete-confirm-dialog-title');
        expect(source).toContain('student-service-qa-delete-modal-backdrop');
        expect(source).toContain('data-student-service-dismiss-delete-modal');
        expect(source).toContain('__studentServiceDeleteModalInteractionsBound');
        expect(source).toContain('function canCurrentUserDeleteStudentServiceAnswer(');
        expect(source).not.toContain('function canCurrentUserManageStudentServiceQuestionAnswers(');
        expect(source).toContain('function resolveStudentServiceAnswerAuthorId(');
        expect(source).toContain('data-student-service-delete-answer=');
        expect(source).toContain('data-student-service-confirm-delete=');
        expect(source).toContain('STUDENT_SERVICE_API_PATHS.questionAnswerDelete');
    });

    it('maps legacy answer author ids in backend normalization and keeps per-answer delete options out of shared card defaults', () => {
        const domainSource = readAsset('backend/platform/domains/student-service-service.js');
        const source = ssvcHubAndQa();

        expect(domainSource).toContain('function normalizeStudentServiceAnswerRecord(');
        expect(domainSource).toContain('responderUserId: String(answer.responderUserId || authorUserId || \'\').trim()');
        expect(source).toContain('function resolveStudentServiceAnswerAuthorId(');
        expect(source).toContain('function buildStudentServiceAnswerCardOptions(');
        const cardOptionsBlock = extractStudentServiceFnBlock(source, 'buildStudentServiceAnswerCardOptions');
        expect(cardOptionsBlock).not.toContain('canDelete');
        expect(source).toContain('canDelete: canCurrentUserDeleteStudentServiceAnswer(question, answer)');
        const deleteAnswerBlock = extractStudentServiceFnBlock(source, 'canCurrentUserDeleteStudentServiceAnswer');
        expect(deleteAnswerBlock).toContain('resolveStudentServiceAnswerAuthorId(answer)');
        expect(deleteAnswerBlock).not.toContain('canCurrentUserModerateStudentService');
        expect(deleteAnswerBlock).not.toContain('canCurrentUserManageStudentServiceQuestionAnswers');
    });

    it('keeps inline reply and open-thread state out of QA feed cache keys', () => {
        const source = ssvcHubAndQa();

        const cacheKeyBlock = extractStudentServiceFnBlock(source, 'buildStudentServiceQaFeedCacheKey');
        const bodySignatureBlock = extractStudentServiceFnBlock(source, 'buildStudentServiceBodySignature');
        expect(cacheKeyBlock).not.toContain('replyingToAnswerId');
        expect(cacheKeyBlock).not.toContain('replyingToQuestionId');
        expect(cacheKeyBlock).not.toContain('selectedQuestion');
        expect(cacheKeyBlock).not.toContain('storesRevision');
        expect(bodySignatureBlock).not.toContain('replyingToAnswerId');
        expect(bodySignatureBlock).not.toContain('replyingToQuestionId');
        expect(bodySignatureBlock).not.toContain('selectedQuestionId');
        expect(bodySignatureBlock).not.toContain('storesRevision');
        expect(bodySignatureBlock).toContain("hasStudentServiceQaModule() ? 'qa-ready' : 'qa-pending'");
        expect(bodySignatureBlock).toContain("hasStudentServiceServiceModule() ? 'service-ready' : 'service-pending'");
        expect(bodySignatureBlock).toContain('getStudentServicePublishedInboxFilterLayout().filters');
        expect(bodySignatureBlock).not.toContain('getStudentServiceEffectiveInboxFilterLayout().filters');
        expect(bodySignatureBlock).toContain('ui.articleEditorId');
        expect(bodySignatureBlock).toContain('ui.articleDraftMode');
        expect(bodySignatureBlock).toContain('buildStudentServiceArticleFingerprint(visibleArticles)');
        const renderPageBlock = source.split('function renderStudentServicePage(')[1]?.split('\nfunction ')[0] || '';
        expect(renderPageBlock).not.toContain('publishStudentServiceInboxFilterLayoutFromEffective');
        expect(source).toContain('function captureStudentServiceScrollAnchors(');
        expect(source).toContain('function runStudentServiceScrollPreserved(');
        expect(source).toContain('function setStudentServiceOpenQuestionId(');
        expect(source).toContain('function mountStudentServiceQuestionThreadModal(');
        expect(source).toContain('function renderStudentServiceQuestionThreadModalShell(');
        expect(source).toContain('data-student-service-question-thread-modal="true"');
        expect(source).toContain('data-student-service-dismiss-thread-modal');
        expect(source).toContain('data-student-service-cancel-thread-modal');
        expect(source).toContain('function openStudentServiceQuestion(');
        const openQuestionBlock = extractStudentServiceFnBlock(source, 'openStudentServiceQuestion');
        expect(openQuestionBlock).not.toContain('renderStudentServicePage()');
        const setOpenQuestionBlock = extractStudentServiceFnBlock(source, 'setStudentServiceOpenQuestionId');
        expect(setOpenQuestionBlock).toContain('mountStudentServiceQuestionThreadModal(normalizedId)');
        expect(setOpenQuestionBlock).not.toContain('openStudentServiceQuestionCardElement');
        expect(source).toContain('function setStudentServiceQuestionFeedback(');
        const questionFeedbackBlock = extractStudentServiceFnBlock(source, 'setStudentServiceQuestionFeedback');
        expect(questionFeedbackBlock).not.toContain('refreshStudentServiceDataAndRender()');
        expect(source).toContain('function patchStudentServiceAnswerHelpfulBtn(');
        expect(source).toContain('function renderStudentServiceQuestionHelpfulButtonMarkup(');
        expect(source).toContain('function renderStudentServiceAnswerHelpfulButtonMarkup(');
        expect(source).toContain('function updateStudentServiceAnswerHelpfulButton(');
        expect(source).toContain('function triggerStudentServiceHelpfulAnimation(');
        expect(source).toContain('student-service-qa-question-helpful-btn');
        expect(source).toContain('student-service-qa-answer-helpful-label');
        const answerFeedbackBlock = extractStudentServiceFnBlock(source, 'setStudentServiceAnswerFeedback');
        expect(answerFeedbackBlock).toContain('studentServiceHelpfulPending');
        expect(answerFeedbackBlock).toContain('triggerStudentServiceHelpfulAnimation');
        expect(answerFeedbackBlock).toContain('updateStudentServiceAnswerHelpfulButton');
        expect(source).toContain('function flashStudentServiceActionButton(');
        expect(source).toContain('flashStudentServiceActionButton(triggerButton, \'success\')');
        expect(source).toContain('preventScroll: true');
    });

    it('exposes owner resolution controls for question authors and public status labels', () => {
        const source = ssvcHubAndQa();
        const routes = readAsset('backend/platform/routes/student-service-routes.js');

        expect(source).toContain('STUDENT_SERVICE_API_PATHS.questionOwnerResolution');
        expect(source).toContain('function studentServiceApiPath(');
        expect(source).toContain('function canCurrentUserSetStudentServiceOwnerResolution(');
        expect(source).toContain('function getStudentServiceQuestionResolutionLabel(');
        expect(source).toContain('function renderStudentServiceOwnerResolutionButtonMarkup(');
        expect(source).toContain('function setStudentServiceQuestionOwnerResolution(');
        expect(source).toContain('data-student-service-owner-resolution="answered"');
        expect(source).toContain('data-student-service-owner-resolution="unanswered"');
        expect(source).toContain('ownerResolutionStatus');
        expect(source).toContain('Owner: answered');
        expect(source).toContain('Owner: still waiting');
    });

    it('blocks student service writes when the backend API manifest is missing or stale', () => {
        const source = ssvcHubAndQa();
        const apiSource = readAsset('assets/js/app/api.js');

        expect(source).toContain('missing API manifest');
        expect(source).toContain("await kiuPortalFetch('/health')");
        expect(source).toContain('if (STUDENT_SERVICE_RUNTIME.backendStale)');
        expect(source).toContain('pinStudentServiceWorkspaceRole');
        expect(apiSource).not.toContain('getKiuRealtimeBridgeUrl()');
        expect(apiSource).toContain('window.location.origin');
    });
});
