/* Student service inbox/filter + UI state/stores helpers.
 * Peeled from student-service.js. Load before student-service.js.
 */
(function initStudentServiceInboxRuntime() {
    'use strict';
    if (window.__KIU_STUDENT_SERVICE_INBOX_LOADED) return;
    window.__KIU_STUDENT_SERVICE_INBOX_LOADED = true;

    window.__kiuCreateStudentServiceInboxApi = function createKiuStudentServiceInboxApi(deps = {}) {
        const d = deps;
        const STUDENT_SERVICE_LANES = d.STUDENT_SERVICE_LANES ?? window.STUDENT_SERVICE_LANES;
        const STUDENT_SERVICE_UI_PREFS_KEY = d.STUDENT_SERVICE_UI_PREFS_KEY ?? window.STUDENT_SERVICE_UI_PREFS_KEY;
        const STUDENT_SERVICE_CATEGORIES = d.STUDENT_SERVICE_CATEGORIES ?? window.STUDENT_SERVICE_CATEGORIES;
        const STUDENT_SERVICE_SUPPORT_AREAS = d.STUDENT_SERVICE_SUPPORT_AREAS ?? window.STUDENT_SERVICE_SUPPORT_AREAS;
        const STUDENT_SERVICE_SUPPORT_AREA_BY_ID = d.STUDENT_SERVICE_SUPPORT_AREA_BY_ID ?? window.STUDENT_SERVICE_SUPPORT_AREA_BY_ID;
        const STUDENT_SERVICE_RUNTIME = d.STUDENT_SERVICE_RUNTIME ?? window.STUDENT_SERVICE_RUNTIME;
        const KIU_STATE = d.KIU_STATE ?? window.KIU_STATE;
        const studentServiceUiState = d.studentServiceUiState ?? (window.__kiuStudentServiceUiState = window.__kiuStudentServiceUiState || {});

        function __dep(name, { optional = false } = {}) {
            return function (...a) {
                const fn = d[name] || window[name];
                if (typeof fn === 'function') return fn.apply(this, a);
                if (optional) return undefined;
                throw new Error('Missing dep: ' + name);
            };
        }
        const buildStudentServiceDefaultMacros = __dep('buildStudentServiceDefaultMacros');
        const closeStudentServiceInlineReply = (...a) => {
            const fn = d.closeStudentServiceInlineReply || window.closeStudentServiceInlineReply;
            if (typeof fn === 'function') return fn.apply(null, a);
        };
        const closeStudentServiceQuestionThreadModal = (...a) => {
            const fn = d.closeStudentServiceQuestionThreadModal || window.closeStudentServiceQuestionThreadModal;
            if (typeof fn === 'function' && fn !== closeStudentServiceQuestionThreadModal) return fn.apply(null, a);
            ensureStudentServiceQaModule().catch(() => null);
        };
        const closeStudentServiceTicketThreadModal = (...a) => {
            const fn = d.closeStudentServiceTicketThreadModal || window.closeStudentServiceTicketThreadModal;
            if (typeof fn === 'function' && fn !== closeStudentServiceTicketThreadModal) return fn.apply(null, a);
            ensureStudentServiceTicketsModule().catch(() => null);
        };
        const ensureStudentServiceAttachmentsModule = __dep('ensureStudentServiceAttachmentsModule');
        const ensureStudentServiceFiltersModule = __dep('ensureStudentServiceFiltersModule');
        const ensureStudentServiceQaModule = __dep('ensureStudentServiceQaModule');
        const ensureStudentServiceServiceModule = __dep('ensureStudentServiceServiceModule');
        const ensureStudentServiceTicketsModule = __dep('ensureStudentServiceTicketsModule');
        const fetchStudentServiceBootstrap = __dep('fetchStudentServiceBootstrap', { optional: true });
        const getCurrentFaculty = __dep('getCurrentFaculty', { optional: true });
        const getCurrentUserId = __dep('getCurrentUserId');
        const getEffectiveUserRole = __dep('getEffectiveUserRole');
        const getFacultyLabel = __dep('getFacultyLabel', { optional: true });
        const hasStudentServiceAttachmentsModule = __dep('hasStudentServiceAttachmentsModule');
        const hasStudentServiceFiltersModule = __dep('hasStudentServiceFiltersModule');
        const hasStudentServiceQaModule = __dep('hasStudentServiceQaModule');
        const hasStudentServiceServiceModule = __dep('hasStudentServiceServiceModule');
        const hasStudentServiceTicketsModule = __dep('hasStudentServiceTicketsModule');
        const normalizeFacultyCode = __dep('normalizeFacultyCode');
        const renderStudentServicePage = __dep('renderStudentServicePage', { optional: true });
        const scheduleStudentServiceModuleRerenderIfNeeded = __dep('scheduleStudentServiceModuleRerenderIfNeeded', { optional: true });
        const ssEscape = __dep('ssEscape', { optional: true });
        const ssNowIso = __dep('ssNowIso');
        const ssParseTime = __dep('ssParseTime');
        const updateStudentServiceQuestionThreadActiveCards = __dep('updateStudentServiceQuestionThreadActiveCards', { optional: true });
        const __filterForwards = {};
        function __ssModuleForward(moduleKind, name, fallback) {
            const fn = function (...args) {
                const has = moduleKind === "Filters" ? hasStudentServiceFiltersModule
                    : moduleKind === "Qa" ? hasStudentServiceQaModule
                    : moduleKind === "Tickets" ? hasStudentServiceTicketsModule
                    : moduleKind === "Attachments" ? hasStudentServiceAttachmentsModule
                    : hasStudentServiceServiceModule;
                const ensure = moduleKind === "Filters" ? ensureStudentServiceFiltersModule
                    : moduleKind === "Qa" ? ensureStudentServiceQaModule
                    : moduleKind === "Tickets" ? ensureStudentServiceTicketsModule
                    : moduleKind === "Attachments" ? ensureStudentServiceAttachmentsModule
                    : ensureStudentServiceServiceModule;
                const resolve = typeof window.resolveStudentServiceExportImpl === 'function'
                    ? window.resolveStudentServiceExportImpl
                    : (n) => window[n];
                const impl = resolve(name);
                if (has() && typeof impl === "function" && impl !== __filterForwards[name]) {
                    return impl.apply(null, args);
                }
                ensure().catch(() => null);
                return typeof fallback === "function" ? fallback() : fallback;
            };
            __filterForwards[name] = fn;
            return fn;
        }
        function studentServiceModuleNormalizerReady(moduleKind, name) {
            const has = moduleKind === 'Filters' ? hasStudentServiceFiltersModule
                : moduleKind === 'Qa' ? hasStudentServiceQaModule
                : moduleKind === 'Tickets' ? hasStudentServiceTicketsModule
                : moduleKind === 'Attachments' ? hasStudentServiceAttachmentsModule
                : hasStudentServiceServiceModule;
            if (!has()) return false;
            const resolve = typeof window.resolveStudentServiceExportImpl === 'function'
                ? window.resolveStudentServiceExportImpl
                : (n) => window[n];
            const impl = resolve(name);
            return typeof impl === 'function' && impl !== __filterForwards[name];
        }
        function pruneStudentServiceQuestionRecords(questions = []) {
            return (questions || []).filter(question => question && typeof question === 'object');
        }
        const getStudentServiceDefaultSearchFilter = __ssModuleForward('Filters', 'getStudentServiceDefaultSearchFilter', null);
        const buildStudentServiceMinimalInboxFilterLayout = __ssModuleForward('Filters', 'buildStudentServiceMinimalInboxFilterLayout', null);
        const isStudentServiceCustomInboxFilter = __ssModuleForward('Filters', 'isStudentServiceCustomInboxFilter', false);
        const buildStudentServiceDefaultInboxFilterLayout = __ssModuleForward('Filters', 'buildStudentServiceDefaultInboxFilterLayout', null);
        const normalizeStudentServiceInboxFilterOption = __ssModuleForward('Filters', 'normalizeStudentServiceInboxFilterOption', null);
        const deriveStudentServiceInboxFilterOptionValue = __ssModuleForward('Filters', 'deriveStudentServiceInboxFilterOptionValue', null);
        const getStudentServiceEditableCustomFilterOptions = __ssModuleForward('Filters', 'getStudentServiceEditableCustomFilterOptions', []);
        const getStudentServiceCustomInboxFilterDefaultValue = __ssModuleForward('Filters', 'getStudentServiceCustomInboxFilterDefaultValue', '');
        const normalizeCustomInboxFilterOptions = __ssModuleForward('Filters', 'normalizeCustomInboxFilterOptions', []);
        const normalizeStudentServiceInboxFilterEditorDraftFilters = __ssModuleForward('Filters', 'normalizeStudentServiceInboxFilterEditorDraftFilters', null);
        const normalizeStudentServiceInboxFilterEntry = __ssModuleForward('Filters', 'normalizeStudentServiceInboxFilterEntry', null);
        const normalizeStudentServiceInboxFilterLayout = __ssModuleForward('Filters', 'normalizeStudentServiceInboxFilterLayout', null);
        const ensureStudentServiceInboxFilterLayoutHasSearch = __ssModuleForward('Filters', 'ensureStudentServiceInboxFilterLayoutHasSearch', null);
        const finalizeStudentServiceInboxFilterLayout = __ssModuleForward('Filters', 'finalizeStudentServiceInboxFilterLayout', null);
        const studentServiceInboxFilterLayoutHasDropdowns = __ssModuleForward('Filters', 'studentServiceInboxFilterLayoutHasDropdowns', false);
        const studentServiceInboxFilterLayoutFingerprint = __ssModuleForward('Filters', 'studentServiceInboxFilterLayoutFingerprint', null);
        const persistStudentServiceSharedInboxFilterLayout = __ssModuleForward('Filters', 'persistStudentServiceSharedInboxFilterLayout', null);
        const maybeSyncStudentServicePersonalInboxFilterLayoutToTeam = __ssModuleForward('Filters', 'maybeSyncStudentServicePersonalInboxFilterLayoutToTeam', null);
        const readStudentServiceInboxFilterPrefs = __ssModuleForward('Filters', 'readStudentServiceInboxFilterPrefs', null);
        const getStudentServiceSharedInboxFilterLayout = __ssModuleForward('Filters', 'getStudentServiceSharedInboxFilterLayout', null);
        const getStudentServicePublicInboxFilterLayout = __ssModuleForward('Filters', 'getStudentServicePublicInboxFilterLayout', null);
        const publishStudentServiceInboxFilterLayout = __ssModuleForward('Filters', 'publishStudentServiceInboxFilterLayout', null);
        const getStudentServicePublishedInboxFilterLayout = __ssModuleForward('Filters', 'getStudentServicePublishedInboxFilterLayout', () => ({ version: 1, filters: [] }));
        const publishStudentServiceInboxFilterLayoutFromEffective = __ssModuleForward('Filters', 'publishStudentServiceInboxFilterLayoutFromEffective', null);
        const getStudentServiceEffectiveInboxFilterLayout = __ssModuleForward('Filters', 'getStudentServiceEffectiveInboxFilterLayout', null);
        const resolveStudentServiceInboxFilterLayout = __ssModuleForward('Filters', 'resolveStudentServiceInboxFilterLayout', null);
        const getStudentServiceInboxFilterValue = __ssModuleForward('Filters', 'getStudentServiceInboxFilterValue', '');
        const getStudentServiceInboxFilterOptions = __ssModuleForward('Filters', 'getStudentServiceInboxFilterOptions', []);
        const ticketMatchesStudentServiceInboxFilter = __ssModuleForward('Filters', 'ticketMatchesStudentServiceInboxFilter', true);
        const renderStudentServiceInboxFilterControlMarkup = __ssModuleForward('Filters', 'renderStudentServiceInboxFilterControlMarkup', '');
        const renderStudentServiceInboxDropdownFiltersMarkup = __ssModuleForward('Filters', 'renderStudentServiceInboxDropdownFiltersMarkup', '');
        const renderStudentServiceInboxFiltersMarkup = __ssModuleForward('Filters', 'renderStudentServiceInboxFiltersMarkup', '');
        const buildStudentServiceTicketIntakeFromInboxFilters = __ssModuleForward('Filters', 'buildStudentServiceTicketIntakeFromInboxFilters', null);
        const cloneStudentServiceInboxFilterLayout = __ssModuleForward('Filters', 'cloneStudentServiceInboxFilterLayout', null);
        const buildStudentServiceInboxFilterEditorDraft = __ssModuleForward('Filters', 'buildStudentServiceInboxFilterEditorDraft', null);
        const renderStudentServiceInboxFilterEditorRowMarkup = __ssModuleForward('Filters', 'renderStudentServiceInboxFilterEditorRowMarkup', '');
        const renderStudentServiceInboxFilterEditorModalShell = __ssModuleForward('Filters', 'renderStudentServiceInboxFilterEditorModalShell', '');
        const isStudentServiceInboxFilterEditorOpen = __ssModuleForward('Filters', 'isStudentServiceInboxFilterEditorOpen', false);
        const saveStudentServicePersonalInboxFilterLayoutFromEditor = __ssModuleForward('Filters', 'saveStudentServicePersonalInboxFilterLayoutFromEditor', null);
        const saveStudentServiceSharedInboxFilterLayoutFromEditor = __ssModuleForward('Filters', 'saveStudentServiceSharedInboxFilterLayoutFromEditor', null);
        const resetStudentServicePersonalInboxFilterLayoutFromEditor = __ssModuleForward('Filters', 'resetStudentServicePersonalInboxFilterLayoutFromEditor', null);
        const buildStudentServiceDefaultDraftTicket = __ssModuleForward('Tickets', 'buildStudentServiceDefaultDraftTicket', null);
        const buildStudentServiceDefaultDraftQuestion = __ssModuleForward('Qa', 'buildStudentServiceDefaultDraftQuestion', null);
        const normalizeStudentServiceAttachmentRecord = __ssModuleForward('Attachments', 'normalizeStudentServiceAttachmentRecord', null);
        const normalizeStudentServiceAttachments = __ssModuleForward('Attachments', 'normalizeStudentServiceAttachments', []);
        const normalizeStudentServiceThreadEntry = __ssModuleForward('Tickets', 'normalizeStudentServiceThreadEntry', null);
        const normalizeStudentServiceInternalNote = __ssModuleForward('Tickets', 'normalizeStudentServiceInternalNote', null);
        const normalizeStudentServiceHandoff = __ssModuleForward('Tickets', 'normalizeStudentServiceHandoff', null);
        const normalizeStudentServiceTicket = __ssModuleForward('Tickets', 'normalizeStudentServiceTicket', null);
        const resolveStudentServiceAnswerAuthorId = __ssModuleForward('Qa', 'resolveStudentServiceAnswerAuthorId', null);
        const normalizeStudentServiceAnswer = __ssModuleForward('Qa', 'normalizeStudentServiceAnswer', null);
        const preferStudentServiceAnswerRecord = __ssModuleForward('Qa', 'preferStudentServiceAnswerRecord', null);
        const buildStudentServiceAnswerThread = __ssModuleForward('Qa', 'buildStudentServiceAnswerThread', null);
        const normalizeStudentServiceQuestionStatus = __ssModuleForward('Qa', 'normalizeStudentServiceQuestionStatus', null);
        const normalizeStudentServiceQuestion = __ssModuleForward('Qa', 'normalizeStudentServiceQuestion', null);

        function ssTextBlock(value) {
            return ssEscape(value).replace(/\n/g, '<br>');
        }


        function ssInitials(value, fallback = 'Q') {
            const parts = String(value || '').trim().split(/\s+/).filter(Boolean);
            if (!parts.length) return fallback;
            return parts.slice(0, 2).map(part => part.charAt(0).toUpperCase()).join('') || fallback;
        }

        function ssRoleLabel(role) {
            if (role === USER_ROLES.STUDENT) return 'Student';
            if (role === USER_ROLES.STUDENT_SERVICE) return 'Student Service';
            if (role === USER_ROLES.ADMIN) return 'Admin';
            if (role === USER_ROLES.PROFESSOR) return 'Professor';
            if (role === USER_ROLES.TA) return 'TA';
            return 'Staff';
        }

        function ssFacultyLabel(value) {
            if (!value) return 'Not linked';
            if (typeof getFacultyLabel === 'function') return getFacultyLabel(value);
            return String(value).trim().toUpperCase();
        }

        function ssSemesterLabel(value) {
            const semester = Number(value || 0);
            return semester > 0 ? `Semester ${semester}` : 'Semester not set';
        }

        function ssCategoryArticleKey(category) {
            return String(category || '').trim().toLowerCase();
        }

        function getStudentServiceUiKey() {
            return `${getEffectiveUserRole()}:${getCurrentUserId() || 'anonymous'}`;
        }

        function readStudentServiceUiPrefs() {
            try {
                const raw = window.localStorage?.getItem(STUDENT_SERVICE_UI_PREFS_KEY);
                if (!raw) return {};
                const parsed = JSON.parse(raw);
                return parsed && typeof parsed === 'object' ? parsed : {};
            } catch (_) {
                return {};
            }
        }

        function readStudentServiceStoredLane(key = getStudentServiceUiKey()) {
            const lane = readStudentServiceUiPrefs()?.[key]?.serviceLane;
            return STUDENT_SERVICE_LANES.includes(lane) ? lane : '';
        }

        function writeStudentServiceStoredLane(lane, key = getStudentServiceUiKey()) {
            try {
                const prefs = readStudentServiceUiPrefs();
                const nextLane = STUDENT_SERVICE_LANES.includes(lane) ? lane : '';
                prefs[key] = {
                    ...(prefs[key] || {}),
                    serviceLane: nextLane
                };
                window.localStorage?.setItem(STUDENT_SERVICE_UI_PREFS_KEY, JSON.stringify(prefs));
            } catch (_) {
                // ignore storage failures; the page still works with in-memory state
            }
        }

        function readStudentServicePersonalInboxFilterLayout(key = getStudentServiceUiKey()) {
            if (hasStudentServiceFiltersModule()
                && typeof window.readStudentServicePersonalInboxFilterLayout === 'function'
                && window.readStudentServicePersonalInboxFilterLayout !== readStudentServicePersonalInboxFilterLayout) {
                return window.readStudentServicePersonalInboxFilterLayout.apply(null, arguments);
            }
            ensureStudentServiceFiltersModule().catch(() => null);
            return null;
        }

        function writeStudentServicePersonalInboxFilterLayout(layout, key = getStudentServiceUiKey()) {
            if (hasStudentServiceFiltersModule()
                && typeof window.writeStudentServicePersonalInboxFilterLayout === 'function'
                && window.writeStudentServicePersonalInboxFilterLayout !== writeStudentServicePersonalInboxFilterLayout) {
                return window.writeStudentServicePersonalInboxFilterLayout.apply(null, arguments);
            }
            ensureStudentServiceFiltersModule().catch(() => null);
            return null;
        }

        function clearStudentServicePersonalInboxFilterLayout(key = getStudentServiceUiKey()) {
            if (hasStudentServiceFiltersModule()
                && typeof window.clearStudentServicePersonalInboxFilterLayout === 'function'
                && window.clearStudentServicePersonalInboxFilterLayout !== clearStudentServicePersonalInboxFilterLayout) {
                return window.clearStudentServicePersonalInboxFilterLayout.apply(null, arguments);
            }
            ensureStudentServiceFiltersModule().catch(() => null);
            return null;
        }

        function pruneStudentServiceCustomTicketFilters(layout) {
            if (hasStudentServiceFiltersModule()
                && typeof window.pruneStudentServiceCustomTicketFilters === 'function'
                && window.pruneStudentServiceCustomTicketFilters !== pruneStudentServiceCustomTicketFilters) {
                return window.pruneStudentServiceCustomTicketFilters.apply(null, arguments);
            }
            ensureStudentServiceFiltersModule().catch(() => null);
            return;
        }

        function invalidateStudentServiceRenderSignature() {
            const container = document.getElementById('page-student-service');
            if (!container) return;
            delete container.dataset.studentServiceRenderSignature;
            delete container.dataset.studentServiceChromeSignature;
        }

        function bindStudentServiceRealtimeRefreshListener() {
            if (typeof window === 'undefined' || window.__studentServiceRealtimeRefreshBound) return;
            window.__studentServiceRealtimeRefreshBound = true;
            window.addEventListener('kiu:student-service-updated', () => {
                fetchStudentServiceBootstrap(true)
                    .then(() => {
                        invalidateStudentServiceRenderSignature();
                        renderStudentServicePage();
                    })
                    .catch((error) => {
                        console.warn('Student Service realtime refresh failed.', error);
                    });
            });
        }

        function setStudentServiceInboxFilterValue(filterId, value) {
            if (hasStudentServiceFiltersModule()
                && typeof window.setStudentServiceInboxFilterValue === 'function'
                && window.setStudentServiceInboxFilterValue !== setStudentServiceInboxFilterValue) {
                return window.setStudentServiceInboxFilterValue.apply(null, arguments);
            }
            ensureStudentServiceFiltersModule().catch(() => null);
            return;
        }

        function syncStudentServiceInboxFilterEditorPickers(modalRoot) {
            if (hasStudentServiceFiltersModule()
                && typeof window.syncStudentServiceInboxFilterEditorPickers === 'function'
                && window.syncStudentServiceInboxFilterEditorPickers !== syncStudentServiceInboxFilterEditorPickers) {
                return window.syncStudentServiceInboxFilterEditorPickers.apply(null, arguments);
            }
            ensureStudentServiceFiltersModule().catch(() => null);
            return;
        }

        function mountStudentServiceInboxFilterEditorModal() {
            if (hasStudentServiceFiltersModule()
                && typeof window.mountStudentServiceInboxFilterEditorModal === 'function'
                && window.mountStudentServiceInboxFilterEditorModal !== mountStudentServiceInboxFilterEditorModal) {
                return window.mountStudentServiceInboxFilterEditorModal.apply(null, arguments);
            }
            ensureStudentServiceFiltersModule().catch(() => null);
            return;
        }

        function openStudentServiceInboxFilterEditorModal() {
            if (hasStudentServiceFiltersModule()
                && typeof window.openStudentServiceInboxFilterEditorModal === 'function'
                && window.openStudentServiceInboxFilterEditorModal !== openStudentServiceInboxFilterEditorModal) {
                return window.openStudentServiceInboxFilterEditorModal.apply(null, arguments);
            }
            ensureStudentServiceFiltersModule().catch(() => null);
            return;
        }

        function closeStudentServiceInboxFilterEditorModal() {
            if (hasStudentServiceFiltersModule()
                && typeof window.closeStudentServiceInboxFilterEditorModal === 'function'
                && window.closeStudentServiceInboxFilterEditorModal !== closeStudentServiceInboxFilterEditorModal) {
                return window.closeStudentServiceInboxFilterEditorModal.apply(null, arguments);
            }
            ensureStudentServiceFiltersModule().catch(() => null);
            return;
        }

        function remountStudentServiceInboxFilterEditorModal() {
            if (hasStudentServiceFiltersModule()
                && typeof window.remountStudentServiceInboxFilterEditorModal === 'function'
                && window.remountStudentServiceInboxFilterEditorModal !== remountStudentServiceInboxFilterEditorModal) {
                return window.remountStudentServiceInboxFilterEditorModal.apply(null, arguments);
            }
            ensureStudentServiceFiltersModule().catch(() => null);
            return;
        }

        function syncStudentServiceInboxFilterEditorDraftFromDom() {
            if (hasStudentServiceFiltersModule()
                && typeof window.syncStudentServiceInboxFilterEditorDraftFromDom === 'function'
                && window.syncStudentServiceInboxFilterEditorDraftFromDom !== syncStudentServiceInboxFilterEditorDraftFromDom) {
                return window.syncStudentServiceInboxFilterEditorDraftFromDom.apply(null, arguments);
            }
            ensureStudentServiceFiltersModule().catch(() => null);
            return;
        }

        function moveStudentServiceInboxFilterEditorRow(index, direction) {
            if (hasStudentServiceFiltersModule()
                && typeof window.moveStudentServiceInboxFilterEditorRow === 'function'
                && window.moveStudentServiceInboxFilterEditorRow !== moveStudentServiceInboxFilterEditorRow) {
                return window.moveStudentServiceInboxFilterEditorRow.apply(null, arguments);
            }
            ensureStudentServiceFiltersModule().catch(() => null);
            return;
        }

        function addStudentServiceInboxFilterEditorCustomFilter() {
            if (hasStudentServiceFiltersModule()
                && typeof window.addStudentServiceInboxFilterEditorCustomFilter === 'function'
                && window.addStudentServiceInboxFilterEditorCustomFilter !== addStudentServiceInboxFilterEditorCustomFilter) {
                return window.addStudentServiceInboxFilterEditorCustomFilter.apply(null, arguments);
            }
            ensureStudentServiceFiltersModule().catch(() => null);
            return;
        }

        function addStudentServiceInboxFilterEditorOption(filterIndex) {
            if (hasStudentServiceFiltersModule()
                && typeof window.addStudentServiceInboxFilterEditorOption === 'function'
                && window.addStudentServiceInboxFilterEditorOption !== addStudentServiceInboxFilterEditorOption) {
                return window.addStudentServiceInboxFilterEditorOption.apply(null, arguments);
            }
            ensureStudentServiceFiltersModule().catch(() => null);
            return;
        }

        function removeStudentServiceInboxFilterEditorOption(filterIndex, optionIndex) {
            if (hasStudentServiceFiltersModule()
                && typeof window.removeStudentServiceInboxFilterEditorOption === 'function'
                && window.removeStudentServiceInboxFilterEditorOption !== removeStudentServiceInboxFilterEditorOption) {
                return window.removeStudentServiceInboxFilterEditorOption.apply(null, arguments);
            }
            ensureStudentServiceFiltersModule().catch(() => null);
            return;
        }

        function removeStudentServiceInboxFilterEditorFilter(filterIndex) {
            if (hasStudentServiceFiltersModule()
                && typeof window.removeStudentServiceInboxFilterEditorFilter === 'function'
                && window.removeStudentServiceInboxFilterEditorFilter !== removeStudentServiceInboxFilterEditorFilter) {
                return window.removeStudentServiceInboxFilterEditorFilter.apply(null, arguments);
            }
            ensureStudentServiceFiltersModule().catch(() => null);
            return;
        }

        function getStudentServiceSupportArea(areaId) {
            return STUDENT_SERVICE_SUPPORT_AREA_BY_ID[String(areaId || '').trim()] || STUDENT_SERVICE_SUPPORT_AREA_BY_ID.general;
        }

        function getStudentServiceSupportAreas() {
            return STUDENT_SERVICE_SUPPORT_AREAS;
        }

        function getStudentServiceSupportAreaForCategory(category) {
            const match = STUDENT_SERVICE_SUPPORT_AREAS.find(area => area.category === category);
            return match || STUDENT_SERVICE_SUPPORT_AREA_BY_ID.general;
        }

        function getStudentServiceDefaultCategoryForArea(areaId) {
            return getStudentServiceSupportArea(areaId).category;
        }

        function buildStudentServiceInboxDefaultDraftTicket() {
            return {
                serviceArea: 'general',
                category: getStudentServiceDefaultCategoryForArea('general'),
                title: '',
                message: '',
                subjectValue: '',
                relatedContextLabel: ''
            };
        }

        function resolveStudentServiceDefaultDraftTicket() {
            const draft = buildStudentServiceDefaultDraftTicket();
            return draft && typeof draft === 'object' ? draft : buildStudentServiceInboxDefaultDraftTicket();
        }

        function buildStudentServiceDefaultDetailSections() {
            return {
                studentInfo: false,
                academicContext: false,
                financeStanding: false,
                internalNotes: false,
                officeHandoff: false
            };
        }

        function buildStudentServiceInboxDefaultDraftQuestion() {
            return {
                title: '',
                body: '',
                category: 'General Question',
                facultyCode: normalizeFacultyCode(getCurrentFaculty?.() || '', ''),
                anonymousMode: true,
                displayIdentityToPeers: false,
                askMode: 'public'
            };
        }

        function resolveStudentServiceDefaultDraftQuestion() {
            const draft = buildStudentServiceDefaultDraftQuestion();
            return draft && typeof draft === 'object' ? draft : buildStudentServiceInboxDefaultDraftQuestion();
        }

        function ensureStudentServiceUiState() {
            const key = getStudentServiceUiKey();
            if (!studentServiceUiState[key]) {
                studentServiceUiState[key] = {
                    articleSearch: '',
                    ticketSearch: '',
                    ticketStatus: 'all',
                    ticketCategory: 'all',
                    ticketServiceArea: 'all',
                    ticketAssignee: 'all',
                    ticketFaculty: 'all',
                    selectedTicketId: '',
                    selectedArticleId: '',
                    articleEditorId: '',
                    articleDraftMode: false,
                    staffPanel: 'tickets',
                    studentTab: 'get_help',
                    serviceLane: readStudentServiceStoredLane(key),
                    qaSearch: '',
                    qaFaculty: 'ALL',
                    qaCategory: 'all',
                    qaStatus: 'all',
                    selectedQuestionId: '',
                    replyingToAnswerId: '',
                    replyingToQuestionId: '',
                    draftQuestion: resolveStudentServiceDefaultDraftQuestion(),
                    customTicketFilters: {},
                    detailSections: buildStudentServiceDefaultDetailSections(),
                    activeSupportArea: 'general',
                    selectedGuidanceArticleId: '',
                    studentHubArticleByArea: {},
                    draftTicket: resolveStudentServiceDefaultDraftTicket(),
                    draftAttachments: {},
                    ticketThreadModalOpen: false
                };
            }
            const ui = studentServiceUiState[key];
            if (typeof ui.ticketThreadModalOpen !== 'boolean') ui.ticketThreadModalOpen = false;
            if (!ui.draftAttachments || typeof ui.draftAttachments !== 'object') ui.draftAttachments = {};
            if (!ui.ticketServiceArea) ui.ticketServiceArea = 'all';
            if (!ui.ticketFaculty) ui.ticketFaculty = 'all';
            if (!ui.activeSupportArea) ui.activeSupportArea = 'general';
            if (typeof ui.selectedGuidanceArticleId !== 'string') ui.selectedGuidanceArticleId = '';
            if (!ui.studentHubArticleByArea || typeof ui.studentHubArticleByArea !== 'object') {
                ui.studentHubArticleByArea = {};
            }
            if (!ui.draftTicket || typeof ui.draftTicket !== 'object') {
                ui.draftTicket = resolveStudentServiceDefaultDraftTicket();
            }
            if (!['get_help', 'my_tickets'].includes(ui.studentTab)) ui.studentTab = 'get_help';
            if (!['tickets', 'articles', 'qa'].includes(ui.staffPanel)) ui.staffPanel = 'tickets';
            if (!STUDENT_SERVICE_LANES.includes(ui.serviceLane)) ui.serviceLane = '';
            if (typeof ui.replyingToAnswerId !== 'string') ui.replyingToAnswerId = '';
            if (typeof ui.replyingToQuestionId !== 'string') ui.replyingToQuestionId = '';
            if (!ui.customTicketFilters || typeof ui.customTicketFilters !== 'object') ui.customTicketFilters = {};
            if (!ui.draftQuestion || typeof ui.draftQuestion !== 'object') {
                ui.draftQuestion = resolveStudentServiceDefaultDraftQuestion();
            }
            if (!['public', 'private'].includes(ui.draftQuestion.askMode)) ui.draftQuestion.askMode = 'public';
            ui.draftQuestion.category = STUDENT_SERVICE_CATEGORIES.includes(ui.draftQuestion.category)
                ? ui.draftQuestion.category
                : 'General Question';
            ui.draftQuestion.facultyCode = normalizeFacultyCode(
                ui.draftQuestion.facultyCode || getCurrentFaculty?.() || '',
                ''
            );
            if (!ui.qaFaculty) ui.qaFaculty = 'ALL';
            if (!ui.qaCategory) ui.qaCategory = 'all';
            if (!ui.qaStatus) ui.qaStatus = 'all';
            ui.detailSections = {
                ...buildStudentServiceDefaultDetailSections(),
                ...(ui.detailSections || {})
            };
            ui.draftTicket.serviceArea = getStudentServiceSupportArea(ui.draftTicket.serviceArea).id;
            if (!STUDENT_SERVICE_CATEGORIES.includes(ui.draftTicket.category)) {
                ui.draftTicket.category = getStudentServiceDefaultCategoryForArea(ui.draftTicket.serviceArea);
            }
            return studentServiceUiState[key];
        }

        function getStudentServiceLane() {
            const ui = ensureStudentServiceUiState();
            return STUDENT_SERVICE_LANES.includes(ui.serviceLane) ? ui.serviceLane : '';
        }

        function setStudentServiceLane(lane, rerender = true) {
            const ui = ensureStudentServiceUiState();
            const nextLane = STUDENT_SERVICE_LANES.includes(lane) ? lane : '';
            if (ui.serviceLane === nextLane) return;
            ui.selectedQuestionId = '';
            closeStudentServiceQuestionThreadModal();
            closeStudentServiceTicketThreadModal();
            closeStudentServiceInlineReply();
            updateStudentServiceQuestionThreadActiveCards('');
            ui.serviceLane = nextLane;
            writeStudentServiceStoredLane(ui.serviceLane);
            if (rerender) renderStudentServicePage();
        }


        function normalizeStudentServiceArticle(article = {}, index = 0) {
            const updatedAt = article.updatedAt || article.createdAt || ssNowIso();
            const category = STUDENT_SERVICE_CATEGORIES.includes(article.category) ? article.category : 'General Question';
            const serviceArea = getStudentServiceSupportArea(article.serviceArea || getStudentServiceSupportAreaForCategory(category).id).id;
            return {
                id: String(article.id || `svc-article-${index + 1}`),
                title: article.title || 'Untitled article',
                category,
                serviceArea,
                summary: article.summary || '',
                content: article.content || article.message || '',
                published: article.published !== false,
                featured: Boolean(article.featured),
                audience: 'all',
                relatedLinks: Array.isArray(article.relatedLinks) ? article.relatedLinks : [],
                createdBy: article.createdBy || article.updatedBy || 'System',
                updatedBy: article.updatedBy || article.createdBy || 'System',
                updatedAt
            };
        }

        function normalizeStudentServiceMacro(macro = {}, index = 0) {
            const category = STUDENT_SERVICE_CATEGORIES.includes(macro.category) ? macro.category : 'General Question';
            return {
                id: String(macro.id || `svc-macro-${index + 1}`),
                label: String(macro.label || `Macro ${index + 1}`),
                category,
                serviceArea: getStudentServiceSupportArea(macro.serviceArea || getStudentServiceSupportAreaForCategory(category).id).id,
                message: String(macro.message || '').trim()
            };
        }

        function resolveStudentServiceStudentSemester(studentId, fallback = '') {
            const fallbackSemester = Number(fallback || 0);
            if (fallbackSemester > 0) return fallbackSemester;
            const profile = (KIU_STATE.users || []).find(user => String(user?.id || '') === String(studentId || '')) || null;
            const profileSemester = Number(profile?.semester || 0);
            return profileSemester > 0 ? profileSemester : '';
        }

        function includeStudentServiceThreadParents(answers = [], allAnswers = []) {
            const visibleIds = new Set((answers || []).map(entry => String(entry.id || '').trim()).filter(Boolean));
            const allById = new Map((allAnswers || []).map(entry => [String(entry.id || '').trim(), entry]));
            const expanded = [...(answers || [])];
            (answers || []).forEach(answer => {
                let parentId = String(answer.parentAnswerId || '').trim();
                while (parentId && !visibleIds.has(parentId)) {
                    const parent = allById.get(parentId);
                    if (!parent) break;
                    expanded.unshift(parent);
                    visibleIds.add(parentId);
                    parentId = String(parent.parentAnswerId || '').trim();
                }
            });
            return expanded;
        }

        function invalidateStudentServiceStores() {
            STUDENT_SERVICE_RUNTIME.storesRevision += 1;
            STUDENT_SERVICE_RUNTIME.storesNormalizedRevision = -1;
        }

        function preloadStudentServiceWorkspaceModules() {
            if (STUDENT_SERVICE_RUNTIME.workspaceModulesPrimed) return;
            STUDENT_SERVICE_RUNTIME.workspaceModulesPrimed = true;
            ensureStudentServiceFiltersModule()
                .then(() => scheduleStudentServiceModuleRerenderIfNeeded())
                .catch(() => null);
            ensureStudentServiceAttachmentsModule()
                .then(() => scheduleStudentServiceModuleRerenderIfNeeded())
                .catch(() => null);
            ensureStudentServiceTicketsModule()
                .then(() => scheduleStudentServiceModuleRerenderIfNeeded())
                .catch(() => null);
            ensureStudentServiceServiceModule()
                .then(() => scheduleStudentServiceModuleRerenderIfNeeded())
                .catch(() => null);
            ensureStudentServiceQaModule()
                .then(() => scheduleStudentServiceModuleRerenderIfNeeded())
                .catch(() => null);
        }

        function ensureStudentServiceStores() {
            if (STUDENT_SERVICE_RUNTIME.storesNormalizedRevision === STUDENT_SERVICE_RUNTIME.storesRevision) {
                return {
                    articles: KIU_STATE.studentServiceArticles || [],
                    tickets: KIU_STATE.studentServiceTickets || [],
                    macros: KIU_STATE.studentServiceMacros || [],
                    questions: KIU_STATE.studentServiceQuestions || [],
                    answers: KIU_STATE.studentServiceAnswers || [],
                    reviewQueue: KIU_STATE.studentServiceReviewQueue || []
                };
            }
            if (!Array.isArray(KIU_STATE.studentServiceArticles)) {
                KIU_STATE.studentServiceArticles = [];
            }
            KIU_STATE.studentServiceArticles = (KIU_STATE.studentServiceArticles || [])
                .map(normalizeStudentServiceArticle)
                .sort((a, b) => ssParseTime(b.updatedAt) - ssParseTime(a.updatedAt));

            if (!Array.isArray(KIU_STATE.studentServiceTickets)) KIU_STATE.studentServiceTickets = [];
            KIU_STATE.studentServiceTickets = (KIU_STATE.studentServiceTickets || [])
                .map(normalizeStudentServiceTicket)
                .sort((a, b) => ssParseTime(b.updatedAt || b.createdAt) - ssParseTime(a.updatedAt || a.createdAt));

            if (!Array.isArray(KIU_STATE.studentServiceMacros) || KIU_STATE.studentServiceMacros.length === 0) {
                KIU_STATE.studentServiceMacros = buildStudentServiceDefaultMacros();
            }
            KIU_STATE.studentServiceMacros = (KIU_STATE.studentServiceMacros || [])
                .map(normalizeStudentServiceMacro)
                .filter(macro => macro.message);

            if (!Array.isArray(KIU_STATE.studentServiceQuestions)) KIU_STATE.studentServiceQuestions = [];
            const qaStoresReady = studentServiceModuleNormalizerReady('Qa', 'normalizeStudentServiceQuestion')
                && studentServiceModuleNormalizerReady('Qa', 'normalizeStudentServiceAnswer');
            if (qaStoresReady) {
                KIU_STATE.studentServiceQuestions = pruneStudentServiceQuestionRecords(KIU_STATE.studentServiceQuestions)
                    .map(normalizeStudentServiceQuestion)
                    .filter(Boolean)
                    .sort((a, b) => {
                        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
                        if (a.featured !== b.featured) return a.featured ? -1 : 1;
                        return ssParseTime(b.updatedAt || b.createdAt) - ssParseTime(a.updatedAt || a.createdAt);
                    });

                if (!Array.isArray(KIU_STATE.studentServiceAnswers)) KIU_STATE.studentServiceAnswers = [];
                const answerMap = new Map();
                KIU_STATE.studentServiceQuestions.forEach(question => {
                    question.answers = (question.answers || []).map(normalizeStudentServiceAnswer).filter(Boolean);
                    question.answers.forEach(answer => {
                        answerMap.set(answer.id, preferStudentServiceAnswerRecord(answerMap.get(answer.id), answer));
                    });
                });
                (KIU_STATE.studentServiceAnswers || []).map(normalizeStudentServiceAnswer).filter(Boolean).forEach(answer => {
                    answerMap.set(answer.id, preferStudentServiceAnswerRecord(answerMap.get(answer.id), answer));
                });
                KIU_STATE.studentServiceAnswers = [...answerMap.values()].sort((a, b) => ssParseTime(a.createdAt) - ssParseTime(b.createdAt));
                KIU_STATE.studentServiceQuestions.forEach(question => {
                    const questionId = String(question.id || '').trim();
                    question.answers = [...answerMap.values()]
                        .filter(answer => String(answer.questionId) === questionId)
                        .sort((left, right) => ssParseTime(left.createdAt || left.updatedAt) - ssParseTime(right.createdAt || right.updatedAt));
                });
            } else {
                KIU_STATE.studentServiceQuestions = pruneStudentServiceQuestionRecords(KIU_STATE.studentServiceQuestions);
            }

            if (!Array.isArray(KIU_STATE.studentServiceAnswers)) KIU_STATE.studentServiceAnswers = [];

            if (!Array.isArray(KIU_STATE.studentServiceReviewQueue)) KIU_STATE.studentServiceReviewQueue = [];

            const qaStoresPending = !qaStoresReady && (
                pruneStudentServiceQuestionRecords(KIU_STATE.studentServiceQuestions).length > 0
                || (KIU_STATE.studentServiceAnswers || []).length > 0
            );
            if (!qaStoresPending) {
                STUDENT_SERVICE_RUNTIME.storesNormalizedRevision = STUDENT_SERVICE_RUNTIME.storesRevision;
            }
            return {
                articles: KIU_STATE.studentServiceArticles,
                tickets: KIU_STATE.studentServiceTickets,
                macros: KIU_STATE.studentServiceMacros,
                questions: KIU_STATE.studentServiceQuestions,
                answers: KIU_STATE.studentServiceAnswers,
                reviewQueue: KIU_STATE.studentServiceReviewQueue
            };
        }

        const api = {
            ssTextBlock,
            ssInitials,
            ssRoleLabel,
            ssFacultyLabel,
            ssSemesterLabel,
            ssCategoryArticleKey,
            getStudentServiceUiKey,
            readStudentServiceUiPrefs,
            readStudentServiceStoredLane,
            writeStudentServiceStoredLane,
            getStudentServiceDefaultSearchFilter,
            buildStudentServiceMinimalInboxFilterLayout,
            isStudentServiceCustomInboxFilter,
            buildStudentServiceDefaultInboxFilterLayout,
            normalizeStudentServiceInboxFilterOption,
            deriveStudentServiceInboxFilterOptionValue,
            getStudentServiceEditableCustomFilterOptions,
            getStudentServiceCustomInboxFilterDefaultValue,
            normalizeCustomInboxFilterOptions,
            normalizeStudentServiceInboxFilterEditorDraftFilters,
            normalizeStudentServiceInboxFilterEntry,
            normalizeStudentServiceInboxFilterLayout,
            ensureStudentServiceInboxFilterLayoutHasSearch,
            finalizeStudentServiceInboxFilterLayout,
            studentServiceInboxFilterLayoutHasDropdowns,
            studentServiceInboxFilterLayoutFingerprint,
            persistStudentServiceSharedInboxFilterLayout,
            maybeSyncStudentServicePersonalInboxFilterLayoutToTeam,
            readStudentServiceInboxFilterPrefs,
            readStudentServicePersonalInboxFilterLayout,
            writeStudentServicePersonalInboxFilterLayout,
            clearStudentServicePersonalInboxFilterLayout,
            getStudentServiceSharedInboxFilterLayout,
            getStudentServicePublicInboxFilterLayout,
            publishStudentServiceInboxFilterLayout,
            pruneStudentServiceCustomTicketFilters,
            invalidateStudentServiceRenderSignature,
            bindStudentServiceRealtimeRefreshListener,
            getStudentServicePublishedInboxFilterLayout,
            publishStudentServiceInboxFilterLayoutFromEffective,
            getStudentServiceEffectiveInboxFilterLayout,
            resolveStudentServiceInboxFilterLayout,
            getStudentServiceInboxFilterValue,
            setStudentServiceInboxFilterValue,
            getStudentServiceInboxFilterOptions,
            ticketMatchesStudentServiceInboxFilter,
            renderStudentServiceInboxFilterControlMarkup,
            renderStudentServiceInboxDropdownFiltersMarkup,
            renderStudentServiceInboxFiltersMarkup,
            buildStudentServiceTicketIntakeFromInboxFilters,
            cloneStudentServiceInboxFilterLayout,
            buildStudentServiceInboxFilterEditorDraft,
            renderStudentServiceInboxFilterEditorRowMarkup,
            renderStudentServiceInboxFilterEditorModalShell,
            syncStudentServiceInboxFilterEditorPickers,
            isStudentServiceInboxFilterEditorOpen,
            mountStudentServiceInboxFilterEditorModal,
            openStudentServiceInboxFilterEditorModal,
            closeStudentServiceInboxFilterEditorModal,
            remountStudentServiceInboxFilterEditorModal,
            syncStudentServiceInboxFilterEditorDraftFromDom,
            moveStudentServiceInboxFilterEditorRow,
            addStudentServiceInboxFilterEditorCustomFilter,
            addStudentServiceInboxFilterEditorOption,
            removeStudentServiceInboxFilterEditorOption,
            removeStudentServiceInboxFilterEditorFilter,
            saveStudentServicePersonalInboxFilterLayoutFromEditor,
            saveStudentServiceSharedInboxFilterLayoutFromEditor,
            resetStudentServicePersonalInboxFilterLayoutFromEditor,
            getStudentServiceSupportArea,
            getStudentServiceSupportAreas,
            getStudentServiceSupportAreaForCategory,
            getStudentServiceDefaultCategoryForArea,
            buildStudentServiceDefaultDraftTicket,
            buildStudentServiceDefaultDraftQuestion,
            buildStudentServiceDefaultDetailSections,
            ensureStudentServiceUiState,
            getStudentServiceLane,
            setStudentServiceLane,
            normalizeStudentServiceArticle,
            normalizeStudentServiceMacro,
            normalizeStudentServiceAttachmentRecord,
            normalizeStudentServiceAttachments,
            normalizeStudentServiceThreadEntry,
            resolveStudentServiceStudentSemester,
            normalizeStudentServiceInternalNote,
            normalizeStudentServiceHandoff,
            normalizeStudentServiceTicket,
            resolveStudentServiceAnswerAuthorId,
            normalizeStudentServiceAnswer,
            includeStudentServiceThreadParents,
            preferStudentServiceAnswerRecord,
            buildStudentServiceAnswerThread,
            normalizeStudentServiceQuestionStatus,
            normalizeStudentServiceQuestion,
            invalidateStudentServiceStores,
            preloadStudentServiceWorkspaceModules,
            ensureStudentServiceStores
        };
        Object.assign(window, api);
        return api;
    };
})();
