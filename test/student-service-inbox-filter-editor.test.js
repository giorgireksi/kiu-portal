import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';
import {
    STUDENT_SERVICE_API_MANIFEST,
    STUDENT_SERVICE_API_MANIFEST_VERSION,
    buildStudentServiceSamplePaths
} from '../tools/student-service-api-manifest.mjs';

const require = createRequire(import.meta.url);
const {
    buildDefaultStudentServiceInboxFilterLayout,
    normalizeStudentServiceInboxFilterLayout
} = require('../backend/platform/domains/student-service-service.js');
const { PlatformStore } = require('../backend/platform/store.js');

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function ssvcSources() {
    const peels = [
        'assets/js/pages/student-service-page-runtime.js',
        'assets/js/pages/student-service-inbox-runtime.js',
        'assets/js/pages/student-service-ops-runtime.js',
        'assets/js/pages/student-service-modules-runtime.js',
        'assets/js/pages/student-service-bootstrap-runtime.js',
        'assets/js/pages/student-service-chrome.js',
        'assets/js/pages/student-service-events.js',
        'assets/js/pages/student-service-tickets.js',
        'assets/js/pages/student-service-attachments.js',
        'assets/js/pages/student-service-qa.js',
        'assets/js/pages/student-service-qa-staff-runtime.js',
        'assets/js/pages/student-service-qa-thread-runtime.js'
    ].map(readSource).join('\n');
    return {
        hub: readSource('assets/js/pages/student-service.js'),
        filters: readSource('assets/js/pages/student-service-filters.js'),
        service: readSource('assets/js/pages/student-service-service.js'),
        peels,
        both() { return this.hub + this.filters + this.peels; }
    };
}

describe('student service inbox filter editor', () => {
    it('keeps manifest version aligned for inbox filter route', () => {
        expect(STUDENT_SERVICE_API_MANIFEST_VERSION).toBe('20260627-ssvc-no-bulk-delete');
        expect(STUDENT_SERVICE_API_MANIFEST.some(entry => entry.id === 'inboxFilterLayout')).toBe(true);
        expect(buildStudentServiceSamplePaths().inboxFilterLayout).toBe('/api/student-service/inbox-filter-layout');
    });

    it('normalizes built-in and custom inbox filter layouts', () => {
        const defaults = buildDefaultStudentServiceInboxFilterLayout();
        expect(defaults.filters.map(filter => filter.id)).toEqual([
            'ticketSearch',
            'ticketStatus',
            'ticketCategory',
            'ticketServiceArea',
            'ticketAssignee',
            'ticketFaculty'
        ]);

        const normalized = normalizeStudentServiceInboxFilterLayout({
            filters: [
                ...defaults.filters,
                {
                    id: 'custom_lane',
                    type: 'select',
                    label: 'Lane',
                    tier: 'advanced',
                    enabled: true,
                    field: 'status',
                    options: [{ value: 'Open', label: 'Open only' }]
                }
            ]
        });
        expect(normalized.filters.at(-1).options[0]).toEqual({ value: 'Open', label: 'Open only' });
        expect(normalized.filters.at(-1).options.some(option => option.value === 'all')).toBe(false);
    });

    it('preserves support lane when saving staff articles', () => {
        const store = new PlatformStore();
        store.upsertAccount({
            id: 'admin-1',
            email: 'admin1@example.com',
            displayName: 'Admin One',
            role: 'admin'
        });
        const saved = store.saveStudentServiceArticle({
            title: 'Finance guidance article',
            summary: 'Summary text',
            content: 'Full content body',
            category: 'Finance / Payments',
            serviceArea: 'finance',
            published: true
        }, 'admin-1');
        expect(saved?.serviceArea).toBe('finance');
        expect(saved?.category).toBe('Finance / Payments');
    });

    it('persists shared inbox filter layout for moderators', () => {
        const store = new PlatformStore();
        store.upsertAccount({
            id: 'student-1',
            email: 'student1@example.com',
            displayName: 'Student One',
            role: 'student'
        });
        store.upsertAccount({
            id: 'admin-1',
            email: 'admin1@example.com',
            displayName: 'Admin One',
            role: 'admin'
        });
        const layout = buildDefaultStudentServiceInboxFilterLayout();
        layout.filters = layout.filters.filter(filter => filter.id !== 'ticketFaculty');

        const denied = store.saveStudentServiceInboxFilterLayout({ layout }, 'student-1');
        expect(denied?.error).toMatch(/moderator/i);

        const saved = store.saveStudentServiceInboxFilterLayout({ layout }, 'admin-1');
        expect(saved?.ok).toBe(true);
        expect(saved.inboxFilterLayout.filters.some(filter => filter.id === 'ticketFaculty')).toBe(false);

        const bootstrap = store.getStudentServiceBootstrap('admin-1');
        expect(bootstrap.inboxFilterLayout.filters.some(filter => filter.id === 'ticketFaculty')).toBe(false);

        const studentBootstrap = store.getStudentServiceBootstrap('student-1');
        expect(studentBootstrap.inboxFilterLayout).toBeTruthy();
        expect(studentBootstrap.inboxFilterLayout.filters.some(filter => filter.id === 'ticketSearch')).toBe(true);
        expect(studentBootstrap.inboxFilterLayout.filters.some(filter => filter.id === 'ticketFaculty')).toBe(false);
    });

    it('exposes saved custom dropdown filters to student bootstrap', () => {
        const store = new PlatformStore();
        store.upsertAccount({ id: 'student-1', email: 'student1@example.com', displayName: 'Student One', role: 'student' });
        store.upsertAccount({ id: 'admin-1', email: 'admin1@example.com', displayName: 'Admin One', role: 'admin' });
        const layout = normalizeStudentServiceInboxFilterLayout({
            filters: [
                buildDefaultStudentServiceInboxFilterLayout().filters.find(filter => filter.id === 'ticketSearch'),
                {
                    id: 'custom_faculty_lane',
                    type: 'select',
                    label: 'Faculty',
                    tier: 'advanced',
                    enabled: true,
                    field: 'faculty',
                    options: [
                        { value: 'faculty 1', label: 'faculty 1' },
                        { value: 'faculty 2', label: 'faculty 2' }
                    ]
                }
            ]
        });
        store.saveStudentServiceInboxFilterLayout({ layout }, 'admin-1');

        const studentBootstrap = store.getStudentServiceBootstrap('student-1');
        expect(studentBootstrap.inboxFilterLayout.filters.some(filter => filter.id === 'custom_faculty_lane')).toBe(true);
        expect(studentBootstrap.inboxFilterLayout.filters.find(filter => filter.id === 'custom_faculty_lane')?.field).toBe('faculty');
    });

    it('syncs moderator personal inbox filter saves to the team layout in runtime source', () => {
        const studentServiceJs = ssvcSources().both();

        expect(ssvcSources().both()).toContain('async function persistStudentServiceSharedInboxFilterLayout(');
        expect(ssvcSources().both()).toContain('maybeSyncStudentServicePersonalInboxFilterLayoutToTeam');
        expect(ssvcSources().both()).toContain('await persistStudentServiceSharedInboxFilterLayout(layout);');
        expect(ssvcSources().both()).toContain('Saving updates the team layout students and other accounts see.');
        expect(ssvcSources().both()).toContain('Save for me also updates the team layout for students and other accounts.');
        expect(studentServiceJs).not.toContain('if (studentServiceInboxFilterLayoutHasDropdowns(sharedLayout)) return;');
        expect(ssvcSources().both()).toContain('function getStudentServicePublishedInboxFilterLayout(');
        expect(ssvcSources().both()).toContain('publishStudentServiceInboxFilterLayoutFromEffective');
        expect(ssvcSources().both()).toContain('publishStudentServiceInboxFilterLayout(layout)');
        expect(ssvcSources().both()).toContain('function pruneStudentServiceCustomTicketFilters(');
        expect(studentServiceJs).toContain('function invalidateStudentServiceRenderSignature(');
        expect(studentServiceJs).toContain('window.invalidateStudentServiceRenderSignature = invalidateStudentServiceRenderSignature;');
        expect(ssvcSources().both()).toContain('publishStudentServiceInboxFilterLayout(normalized);');
        expect(ssvcSources().both()).toContain('removeItem(STUDENT_SERVICE_PUBLISHED_FILTER_LAYOUT_KEY)');
    });

    it('serializes inbox filter layout POST body as JSON via postStudentService', () => {
        const studentServiceJs = ssvcSources().both();
        const persistBlock = ssvcSources().filters.split('async function persistStudentServiceSharedInboxFilterLayout(')[1]?.split(/\nasync function /)[0] || '';
        const renderBlock = studentServiceJs.split('function renderStudentServicePage(')[1]?.split('\nfunction ')[0] || '';

        expect(persistBlock).toContain('postStudentService(STUDENT_SERVICE_API_PATHS.inboxFilterLayout()');
        expect(persistBlock).not.toMatch(/body:\s*\{\s*layout\s*\}/);
        expect(persistBlock).toContain('studentServiceInboxFilterLayoutFingerprint');
        expect(renderBlock).not.toContain('publishStudentServiceInboxFilterLayoutFromEffective');
    });

    it('publishes team layout mirror immediately after shared inbox filter save', () => {
        const studentServiceJs = ssvcSources().both();
        const sharedSaveBlock = ssvcSources().filters.split('async function saveStudentServiceSharedInboxFilterLayoutFromEditor(')[1]?.split(/\nasync function /)[0] || '';

        expect(sharedSaveBlock).toContain('await persistStudentServiceSharedInboxFilterLayout(layout);');
        expect(sharedSaveBlock).toContain('KIU_STATE.studentServiceInboxFilterLayout = layout;');
        expect(sharedSaveBlock).toContain('publishStudentServiceInboxFilterLayout(layout);');
        expect(sharedSaveBlock).toContain('pruneStudentServiceCustomTicketFilters(layout);');
    });

    it('clears article selection and draft mode when starting a new article', () => {
        const studentServiceJs = ssvcSources().both();
        const newArticleBlock = studentServiceJs.split('function startStudentServiceNewArticle(')[1]?.split('\nfunction ')[0] || '';
        const serviceModule = readSource('assets/js/pages/student-service-service.js');

        expect(newArticleBlock).toContain('ui.articleDraftMode = true');
        expect(newArticleBlock).toContain("ui.selectedArticleId = ''");
        expect(newArticleBlock).toContain('invalidateStudentServiceRenderSignature()');
        expect(serviceModule).toContain('ui.articleDraftMode');
        expect(serviceModule).toContain('showArticleActions');
        expect(serviceModule).toContain('canShowStudentServiceArticleEditorActions');
    });

    it('grants moderation through session role for student_service view', () => {
        const store = new PlatformStore();
        const layout = buildDefaultStudentServiceInboxFilterLayout();

        const bootstrap = store.getStudentServiceBootstrap('missing-persona-id', { sessionRole: 'student_service' });
        expect(bootstrap.permissions.canModerate).toBe(true);
        expect(bootstrap.inboxFilterLayout).toBeTruthy();

        const deniedProfessor = store.saveStudentServiceInboxFilterLayout({ layout }, 'prof-1', 'professor');
        expect(deniedProfessor?.error).toMatch(/moderator/i);

        const saved = store.saveStudentServiceInboxFilterLayout({ layout }, 'missing-persona-id', 'student_service');
        expect(saved?.ok).toBe(true);
    });

    it('seeds admin-testing personas in backend store hydration', () => {
        const store = new PlatformStore();
        store.state = store.ensureStateShape({
            faculties: { ECON: { code: 'ECON' } },
            accounts: {},
            meta: {}
        });
        expect(store.state.accounts['admin-testing-econ-service']?.role).toBe('student_service');
        expect(store.state.accounts['admin-testing-econ-student']?.role).toBe('student');
    });

    it('grants article save through session role for student_service view', () => {
        const store = new PlatformStore();
        const articlePayload = {
            title: 'Session role article',
            summary: 'Summary text',
            content: 'Full content body',
            published: true
        };

        const denied = store.saveStudentServiceArticle(articlePayload, 'admin-testing-econ-student', 'student');
        expect(denied?.error).toMatch(/Only Student Service staff can save articles/i);

        const saved = store.saveStudentServiceArticle(articlePayload, 'admin-testing-econ-student', 'student_service');
        expect(saved?.title).toBe('Session role article');
        expect(saved?.published).toBe(true);
    });

    it('wires session role through student-service routes and moderation fallback', () => {
        const routeSource = readSource('backend/platform/routes/student-service-routes.js');
        const serverSource = readSource('backend/platform/server.js');
        const studentServiceJs = ssvcSources().both();
        const navigationSource = readSource('assets/js/features/navigation.js');

        expect(routeSource).toContain('getSessionRole');
        expect(routeSource).toContain('sessionRole: typeof getSessionRole === \'function\' ? getSessionRole(sessionAccount) : \'\'');
        expect(routeSource).toContain('store.saveStudentServiceArticle(');
        expect(routeSource).toContain('store.convertStudentServiceQuestionToArticle(');
        expect(routeSource).toContain('getSessionRole(sessionAccount)');
        expect(navigationSource).toContain('syncStudentServiceWorkspaceBackendSession');
        expect(studentServiceJs).toContain('function canShowStudentServiceArticleEditorActions(');
        expect(studentServiceJs).toContain('serviceArea: supportArea.id');
        expect(studentServiceJs).toContain('function bindStudentServiceRealtimeRefreshListener(');
        expect(studentServiceJs).toContain('window.canShowStudentServiceArticleEditorActions = canShowStudentServiceArticleEditorActions;');
        expect(serverSource).toMatch(/registerStudentServiceRoutes\(app, \{[\s\S]*getSessionRole/);
        expect(studentServiceJs).toContain('role === USER_ROLES.STUDENT_SERVICE || role === USER_ROLES.ADMIN');
    });

    it('exposes staff inbox filter editor hooks in runtime sources', () => {
        const studentServiceJs = ssvcSources().both();
        const serviceJs = readSource('assets/js/pages/student-service-service.js');

        expect(studentServiceJs).toContain("const STUDENT_SERVICE_INBOX_FILTER_PREFS_KEY = 'KIU_STUDENT_SERVICE_INBOX_FILTER_PREFS'");
        expect(studentServiceJs).toContain('STUDENT_SERVICE_API_PATHS.inboxFilterLayout()');
        expect(studentServiceJs).toContain('data-student-service-inbox-filter-editor-save-shared');
        expect(studentServiceJs).toContain('window.renderStudentServiceInboxFiltersMarkup = renderStudentServiceInboxFiltersMarkup');

        expect(studentServiceJs).toContain('data-student-service-edit-inbox-filters="true"');
        expect(studentServiceJs).not.toContain('data-student-service-toggle-advanced-filters');
        expect(serviceJs).toContain('renderStudentServiceInboxFiltersMarkup(ui, visibleTickets, currentUser)');
    });

    it('delegates inbox filter editor interactions through document modal listener', () => {
        const studentServiceJs = ssvcSources().both();
        const hub = readSource('assets/js/pages/student-service.js');

        // Modal document click is routed through a dedicated handler after Phase 5 shell polish.
        expect(hub).toContain('function handleStudentServiceModalDocumentClick(');
        expect(hub).toContain("document.addEventListener('click', (event) => {\n            handleStudentServiceModalDocumentClick(event);");
        expect(hub).toContain('data-student-service-dismiss-inbox-filter-editor-modal');
        expect(hub).toContain('data-student-service-inbox-filter-editor-close');
        expect(hub).toContain('data-student-service-inbox-filter-editor-save-personal');
        expect(hub).toContain('data-student-service-inbox-filter-editor-save-shared');

        const pageClickStart = hub.indexOf("root.addEventListener('click', (event) => {");
        const pageClickEnd = hub.indexOf("root.addEventListener('input'", pageClickStart);
        const pageClickBlock = hub.slice(pageClickStart, pageClickEnd);
        expect(pageClickBlock).not.toContain('data-student-service-inbox-filter-editor-save-personal');
        expect(pageClickBlock).not.toContain('data-student-service-inbox-filter-editor-close');

        expect(hub).toContain('function handleStudentServiceEscapeKey(');
        expect(hub).toContain('document.addEventListener(\'keydown\', handleStudentServiceEscapeKey)');
        expect(hub).toContain('isStudentServiceInboxFilterEditorOpen()');
        expect(hub).toContain('closeStudentServiceInboxFilterEditorModal()');
    });

    it('shows only custom dropdown filters in the editor', () => {
        const studentServiceJs = ssvcSources().both();

        expect(ssvcSources().both()).toContain('function isStudentServiceCustomInboxFilter(filter)');
        expect(studentServiceJs).toContain('filter(isStudentServiceCustomInboxFilter)');
        expect(ssvcSources().both()).toContain('function buildStudentServiceMinimalInboxFilterLayout()');
        expect(studentServiceJs).toContain('buildStudentServiceMinimalInboxFilterLayout()');
        expect(studentServiceJs).not.toContain('data-student-service-inbox-filter-editor-field="tier"');
        expect(studentServiceJs).not.toContain('student-service-inbox-filter-editor-source');
        expect(studentServiceJs).toContain('if (!filter || filter.type !== \'select\'');
        expect(studentServiceJs).not.toContain('Keep at least one inbox filter.');
    });

    it('keeps search out of the editor and injects it into saved layouts', () => {
        const studentServiceJs = ssvcSources().both();

        expect(studentServiceJs).toContain('filter(isStudentServiceCustomInboxFilter)');
        expect(ssvcSources().both()).toContain('function finalizeStudentServiceInboxFilterLayout(dropdownLayout)');
        expect(studentServiceJs).toContain('finalizeStudentServiceInboxFilterLayout(studentServiceInboxFilterEditorDraft)');
        expect(studentServiceJs).toContain('Search is always shown in the inbox.');

        const strippedBuiltins = normalizeStudentServiceInboxFilterLayout({
            version: 1,
            filters: [
                {
                    id: 'ticketStatus',
                    type: 'select',
                    label: 'Status',
                    tier: 'basic',
                    enabled: true,
                    source: 'statuses'
                }
            ]
        });
        expect(strippedBuiltins.filters.map(filter => filter.id)).toEqual(['ticketSearch']);

        const dropdownOnly = normalizeStudentServiceInboxFilterLayout({
            version: 1,
            filters: [
                {
                    id: 'custom_lane',
                    type: 'select',
                    label: 'Lane',
                    tier: 'advanced',
                    enabled: true,
                    field: 'status',
                    options: [{ value: 'Open', label: 'Open only' }]
                }
            ]
        });
        expect(dropdownOnly.filters[0].id).toBe('ticketSearch');
        expect(dropdownOnly.filters[1].id).toBe('custom_lane');

        const emptyDropdowns = normalizeStudentServiceInboxFilterLayout({ version: 1, filters: [] });
        expect(emptyDropdowns.filters).toEqual([
            expect.objectContaining({ id: 'ticketSearch', type: 'search' })
        ]);
    });

    it('labels inbox filter pickers with the configured filter name', () => {
        const studentServiceJs = ssvcSources().both();

        expect(ssvcSources().both()).toContain('function renderStudentServiceInboxFilterControlMarkup(filter, ui, visibleTickets, currentUser)');
        expect(studentServiceJs).toContain('data-lux-picker-label="${ssEscape(filter.label || filter.id)}"');
    });

    it('simplifies custom dropdown editor to label-only options', () => {
        const studentServiceJs = ssvcSources().both();

        expect(ssvcSources().both()).toContain('function deriveStudentServiceInboxFilterOptionValue(label)');
        expect(ssvcSources().both()).toContain('function normalizeCustomInboxFilterOptions(filter)');
        expect(studentServiceJs).toContain('data-student-service-inbox-filter-editor-option-label="true"');
        expect(studentServiceJs).not.toContain('student-service-inbox-filter-editor-option-all');
        expect(ssvcSources().both()).toContain('function getStudentServiceCustomInboxFilterDefaultValue(filter)');
        expect(studentServiceJs).not.toContain('<span class="lux-picker-label">Filter by</span>');
        expect(studentServiceJs).not.toContain('data-student-service-inbox-filter-editor-field="field"');
        expect(studentServiceJs).toContain("filter.field = 'status'");
        expect(studentServiceJs).not.toContain('data-student-service-inbox-filter-editor-option-field="value"');
        expect(studentServiceJs).toContain('getStudentServiceEditableCustomFilterOptions(filter.options)');
    });

    it('matches LMS composer styling for inbox filter editor shell', () => {
        const studentServiceJs = ssvcSources().both();

        expect(studentServiceJs).toContain('class="lux-control"');
        expect(studentServiceJs).toContain('syncStudentServiceInboxFilterEditorPickers(modalRoot)');
        expect(studentServiceJs).toContain('student-service-inbox-filter-editor-actions-copy');
        expect(studentServiceJs).toContain('student-service-inbox-filter-editor-actions-buttons');
        expect(studentServiceJs).toContain('data-student-service-dismiss-inbox-filter-editor-modal="true"');
    });
});

describe('student service article lane visibility', () => {
    it('resolves article lanes without a staff editor dropdown', () => {
        const studentServiceJs = ssvcSources().both();
        const serviceModule = readSource('assets/js/pages/student-service-service.js');

        expect(serviceModule).not.toContain('id="student-service-article-service-area"');
        expect(serviceModule).not.toContain('data-student-service-article-service-area="true"');
        expect(serviceModule).toContain("action: 'select-hub-article'");
        expect(serviceModule).toContain('renderStudentServiceHubArticleListMarkup');
        expect(serviceModule).toContain('ui.selectedGuidanceArticleId');
        expect(studentServiceJs).toContain('function resolveStudentServiceArticleServiceAreaId(');
        expect(studentServiceJs).not.toContain("getElementById('student-service-article-service-area')");
        expect(studentServiceJs).toContain('function pickStudentHubFeaturedArticle(');
        expect(studentServiceJs).toContain('function resolveStudentHubArticle(');
        expect(studentServiceJs).toContain('resolveStudentServiceArticleServiceAreaId(ui)');
        expect(studentServiceJs).toContain('ui.activeSupportArea = getStudentServiceSupportArea(article.serviceArea).id');
        expect(studentServiceJs).toContain('ui.studentHubArticleByArea = {}');
        expect(studentServiceJs).toContain('data-student-service-select-hub-article');
        expect(studentServiceJs).toContain('data-student-service-delete-article');
        expect(studentServiceJs).toContain('data-student-service-confirm-article-delete');
        expect(serviceModule).not.toContain('data-student-service-delete-all-articles');
    });

    it('preserves academics serviceArea when backend update omits lane fields', () => {
        const store = new PlatformStore();
        const articlePayload = {
            id: 'svc-article-academics-test',
            title: 'Academics lane article',
            summary: 'Summary text',
            content: 'Full content body',
            serviceArea: 'academics',
            category: 'Academic Process',
            published: true
        };

        const saved = store.saveStudentServiceArticle(articlePayload, 'admin-testing-econ-student', 'student_service');
        expect(saved?.serviceArea).toBe('academics');

        const updated = store.saveStudentServiceArticle({
            id: 'svc-article-academics-test',
            title: 'Academics lane article updated',
            summary: 'Summary text',
            content: 'Full content body',
            published: true
        }, 'admin-testing-econ-student', 'student_service');

        expect(updated?.serviceArea).toBe('academics');
        expect(updated?.category).toBe('Academic Process');
    });
});

describe('student service empty articles bootstrap', () => {
    it('returns zero articles when store has no seeded defaults', () => {
        const store = new PlatformStore();
        const bootstrap = store.getStudentServiceBootstrap('admin-testing-econ-student', { sessionRole: 'student' });
        expect(Array.isArray(bootstrap.articles)).toBe(true);
        expect(bootstrap.articles).toHaveLength(0);
    });

    it('keeps studentServiceArticles API-only in portal persistence', () => {
        const apiSource = readSource('assets/js/app/api.js');
        const stateSource = readSource('assets/js/app/state.js');
        const storeSource = readSource('backend/platform/store.js');
        const initialStateSource = readSource('assets/js/data/initial-state.js');
        const studentServiceJs = ssvcSources().both();

        expect(apiSource).toContain('delete snapshot.studentServiceArticles;');
        expect(apiSource).toContain('delete nextState.studentServiceArticles;');
        expect(apiSource).toContain("'studentServiceArticles'");
        expect(stateSource).toContain('KIU_STATE.studentServiceArticles = [];');
        expect(storeSource).toContain("'studentServiceArticles'");
        expect(storeSource).toContain('delete portalState.studentServiceArticles;');
        expect(initialStateSource).toContain('state.studentServiceArticles = [];');
        expect(studentServiceJs).not.toContain('buildStudentServiceDefaultArticles');
        expect(studentServiceJs).toContain('shouldDeferStudentServiceStudentHubUntilBootstrap');
        expect(readSource('assets/js/pages/student-service-bootstrap-runtime.js')).toContain('applyStudentServiceBootstrap');
        expect(readSource('assets/js/pages/student-service-bootstrap-runtime.js')).toMatch(/applyStudentServiceBootstrap,\s*\n\s*fetchStudentServiceBootstrap/);
    });
});

describe('student service guidance modal', () => {
    it('structures guidance browser for popup with toolbar, list, and preview', () => {
        const serviceModule = readSource('assets/js/pages/student-service-service.js');
        const studentServiceJs = ssvcSources().both();

        expect(serviceModule).toContain('renderStudentServiceGuidanceBrowserMarkup');
        expect(serviceModule).toContain('buildStudentServiceGuidanceBrowserContext');
        expect(serviceModule).toContain('student-service-student-grid--request-only');
        expect(serviceModule).toContain('renderStudentServiceStudentHubTrackMarkup(studentTicketCounts)');
        expect(serviceModule).not.toContain('shell.track');
        expect(serviceModule).toContain('data-student-service-open-guidance-modal="true"');
        expect(serviceModule).toContain('student-service-guidance-toolbar');
        expect(serviceModule).toContain('student-service-guidance-workspace');
        expect(serviceModule).not.toContain('renderStudentServiceGuidanceTopicFilterMarkup');
        expect(serviceModule).not.toContain('data-student-service-guidance-topic-filter');
        expect(serviceModule).toContain('Search articles and guidance');
        expect(serviceModule).not.toContain('student-service-find-lanes');
        expect(serviceModule).not.toContain('renderStudentServiceLaneRailMarkup');
        expect(serviceModule).not.toContain('student-service-lane-card');
        expect(serviceModule).toContain('student-service-find-guidance');
        expect(serviceModule).toContain('student-service-find-preview');
        expect(serviceModule).toContain('renderStudentServiceHubArticleListMarkup');
        expect(serviceModule).toContain('renderStudentServiceHubArticlePreviewMarkup');
        expect(serviceModule).toContain('if (!selectedArticle)');
        expect(serviceModule).toContain('student-service-inbox-list student-service-find-guidance-list');
        expect(serviceModule).toContain("action: 'select-hub-article'");
        expect(serviceModule).not.toContain('data-student-service-student-hub-find');
        expect(studentServiceJs).toContain('data-student-service-guidance-modal="true"');
        expect(studentServiceJs).toContain('openStudentServiceGuidanceModal');
        expect(studentServiceJs).toContain('closeStudentServiceGuidanceModal');
        expect(studentServiceJs).toContain('window.openStudentServiceGuidanceModal = openStudentServiceGuidanceModal;');
    });

    it('opens guidance in modal instead of inline find column', () => {
        const serviceModule = readSource('assets/js/pages/student-service-service.js');
        const studentServiceJs = ssvcSources().both();

        expect(serviceModule).not.toContain('data-student-service-student-hub-find="1"');
        expect(serviceModule).not.toContain('window.syncStudentServiceLaneRail = syncStudentServiceLaneRail;');
        expect(studentServiceJs).toContain('openStudentServiceGuidanceModal()');
        expect(studentServiceJs).not.toContain('setStudentServiceGuidanceTopicFilter');
        expect(studentServiceJs).toContain('if (isStudentServiceGuidanceModalOpen())');
        expect(studentServiceJs).not.toContain('data-student-service-guidance-topic-filter');
    });
});