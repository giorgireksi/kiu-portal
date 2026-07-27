/* FINDABILITY: student-service hub — see docs/findability-index.md#ss-hub */
/* Wave bag KiuStudentService */
window.KiuStudentService=window.KiuStudentService||{};const __kiuSsApi=window.KiuStudentService;window.__kiuSsApi=__kiuSsApi;
function __kiuSsExpose(map){Object.keys(map).forEach((k)=>{__kiuSsApi[k]=map[k];window[k]=map[k];});}

﻿/* Student Service Center runtime */

const STUDENT_SERVICE_CATEGORIES = [
    'General Question',
    'Academic Process',
    'Registration / Enrollment',
    'Finance / Payments',
    'Documents / Certificates',
    'Schedule / Timetable',
    'Technical Portal Help',
    'Other'
];

const STUDENT_SERVICE_STATUSES = [
    'Open',
    'In Review',
    'Waiting for Student',
    'Waiting for Service',
    'Resolved',
    'Closed'
];

const STUDENT_SERVICE_STATUS_ORDER = {
    'Waiting for Service': 0,
    'Open': 1,
    'In Review': 2,
    'Waiting for Student': 3,
    'Resolved': 4,
    'Closed': 5
};

const STUDENT_SERVICE_HANDOFF_TARGETS = [
    'Registration Office',
    'Finance Office',
    'Academic Office',
    'Documents Office',
    'IT Support',
    'Chancellery'
];

const STUDENT_SERVICE_HANDOFF_STATUSES = [
    'Not Needed',
    'Requested',
    'In Progress',
    'Waiting',
    'Completed'
];

const STUDENT_SERVICE_CONTEXT_COPY = {
    'Academic Process': 'Student Service can explain the process, collect missing details, and keep the student updated here. This workspace does not change academic records directly.',
    'Registration / Enrollment': 'Use this ticket to gather details and guide the student. Registration changes are handled in the academic workflow, not from Student Service.',
    'Finance / Payments': 'Student Service can explain next steps and document the request, but this workspace does not edit balances, invoices, or payment records.',
    'Documents / Certificates': 'Student Service can guide the request and confirm what is needed, but official document generation stays in the formal office workflow.',
    'Schedule / Timetable': 'Student Service can help verify the issue and provide guidance, while timetable changes remain outside this workspace.',
    'Technical Portal Help': 'Use the thread to capture exact steps, screenshots, and role and faculty context. Student Service can triage and respond here without changing core portal data.',
    'Other': 'Student Service can guide the student here and route the conversation with the right context, without changing protected records directly.',
    'General Question': 'Use this thread to answer general service questions quickly and clearly.'
};

const STUDENT_SERVICE_SUPPORT_AREAS = [
    {
        id: 'academics',
        label: 'Academics and Study Plan',
        description: 'Help with study progress, course guidance, grading questions, and study-plan decisions.',
        category: 'Academic Process',
        nextStep: 'Review the academic guidance first, then open a ticket with the semester, subject, and exact question if you still need help.',
        links: ['study-card', 'registration']
    },
    {
        id: 'registration',
        label: 'Registration and Enrollment',
        description: 'Course registration, enrollment checks, missing groups, and semester registration questions.',
        category: 'Registration / Enrollment',
        nextStep: 'Check the registration context and add the course, group, and semester details before opening a support ticket.',
        links: ['registration']
    },
    {
        id: 'documents',
        label: 'Documents and Certificates',
        description: 'Transcripts, certificates, official letters, and document follow-up.',
        category: 'Documents / Certificates',
        nextStep: 'Read the document checklist, then send a ticket with the exact document type, language, and deadline if needed.',
        links: ['orders', 'chancellery']
    },
    {
        id: 'finance',
        label: 'Finance and Payments',
        description: 'Balances, payment confirmation, finance holds, and payment-related support.',
        category: 'Finance / Payments',
        nextStep: 'Review the finance summary and include the amount, payment date, and receipt context if support is still required.',
        links: ['chancellery']
    },
    {
        id: 'timetable',
        label: 'Timetable and Scheduling',
        description: 'Schedule issues, group timing conflicts, room changes, and timetable questions.',
        category: 'Schedule / Timetable',
        nextStep: 'Check the current schedule snapshot first, then open a ticket with the day, group, and conflict details.',
        links: ['timetable']
    },
    {
        id: 'portal',
        label: 'Portal and Technical Help',
        description: 'Broken pages, role-switch issues, access problems, and technical troubleshooting.',
        category: 'Technical Portal Help',
        nextStep: 'Collect the page name, role, faculty, and exact steps before sending a support request.',
        links: ['profile']
    },
    {
        id: 'general',
        label: 'General Support',
        description: 'Questions that do not clearly fit another workflow or need a first-line response.',
        category: 'General Question',
        nextStep: 'Open a general ticket with the goal, the deadline, and any related service or office already contacted.',
        links: ['student-service']
    }
];

const STUDENT_SERVICE_SUPPORT_AREA_BY_ID = Object.fromEntries(
    STUDENT_SERVICE_SUPPORT_AREAS.map(area => [area.id, area])
);

const STUDENT_SERVICE_PUBLIC_QUESTION_STATUSES = ['draft', 'published', 'archived', 'merged'];
const STUDENT_SERVICE_QA_FILTER_STATUSES = ['all', 'my_questions', 'unanswered', 'published', 'archived'];
const STUDENT_SERVICE_RESPONDER_ROLES = [USER_ROLES.ADMIN, USER_ROLES.STUDENT_SERVICE, USER_ROLES.PROFESSOR, USER_ROLES.TA];
const STUDENT_SERVICE_LANES = ['service', 'qa'];
const STUDENT_SERVICE_UI_PREFS_KEY = 'KIU_STUDENT_SERVICE_UI_PREFS';
const STUDENT_SERVICE_INBOX_FILTER_PREFS_KEY = 'KIU_STUDENT_SERVICE_INBOX_FILTER_PREFS';
const STUDENT_SERVICE_PUBLISHED_FILTER_LAYOUT_KEY = 'KIU_STUDENT_SERVICE_PUBLISHED_FILTER_LAYOUT';
const STUDENT_SERVICE_BUILTIN_INBOX_FILTER_IDS = new Set([
    'ticketSearch',
    'ticketStatus',
    'ticketCategory',
    'ticketServiceArea',
    'ticketAssignee',
    'ticketFaculty'
]);
const STUDENT_SERVICE_INBOX_FILTER_SOURCES = new Set([
    'statuses',
    'categories',
    'supportAreas',
    'assignees',
    'faculties'
]);
const STUDENT_SERVICE_INBOX_FILTER_FIELDS = new Set([
    'status',
    'category',
    'serviceArea',
    'faculty',
    'assignedToId'
]);
const STUDENT_SERVICE_RUNTIME = {
    bootstrapPromise: null,
    lastLoadedAt: 0,
    loaded: false,
    loadFailed: false,
    bootstrapErrorMessage: '',
    storesRevision: 0,
    storesNormalizedRevision: -1,
    workspaceModulesPrimed: false,
    pendingReplyParentAnswerId: ''
};

const studentServiceUiState = {};
const studentServiceMarkupCache = new WeakMap();
let studentServiceThreadResizeObserver = null;
let studentServiceInboxFilterEditorDraft = null;

/* Lazy module loaders + hub stubs: student-service-modules-runtime.js */
const __ssvcModulesDeps = {};
const __ssvcModules = typeof window.__kiuCreateStudentServiceModulesApi === 'function'
    ? window.__kiuCreateStudentServiceModulesApi(__ssvcModulesDeps)
    : {};
const {
    hasStudentServiceQaModule,
    isStudentServiceLazyScriptExecuted,
    shouldWaitForStudentServiceLazyScriptLoad,
    removeStaleStudentServiceLazyScript,
    finishStudentServiceLazyModuleLoad,
    scheduleStudentServiceModuleRerenderIfNeeded,
    rerenderStudentServicePageAfterModuleLoad,
    isStudentServiceQaBodyStale,
    ensureStudentServiceQaModule,
    renderStudentServiceQaModuleLoading,
    renderStudentServiceQaModuleLoadError,
    handleStudentServiceQaModuleLoadFailure,
    hasStudentServiceServiceModule,
    ensureStudentServiceServiceModule,
    hasStudentServiceFiltersModule,
    ensureStudentServiceFiltersModule,
    hasStudentServiceAttachmentsModule,
    ensureStudentServiceAttachmentsModule,
    hasStudentServiceTicketsModule,
    ensureStudentServiceTicketsModule,
    renderStudentServiceServiceModuleLoading,
    renderStudentServiceServiceModuleLoadError,
    handleStudentServiceServiceModuleLoadFailure,
    renderStudentServiceStudentHub,
    renderStudentServiceStudentQaHub,
    renderStudentServiceMyTicketsHub,
    renderStudentServiceResponderServiceLane,
    renderStudentServiceStaffQaFeed,
    renderStudentServiceStaffWorkbench,
    captureStudentServiceLazyModuleStubs
} = __ssvcModules;


function ssForwardToLoadedModule(hasModule, ensureModule, name, localFn, args, fallback) {
    if (typeof hasModule === 'function' && hasModule()) {
        const impl = typeof resolveStudentServiceExportImpl === 'function'
            ? resolveStudentServiceExportImpl(name)
            : undefined;
        if (typeof impl === 'function' && impl !== localFn) return impl.apply(null, args);
        const w = window[name];
        if (typeof w === 'function' && w !== localFn) return w.apply(null, args);
    }
    if (typeof ensureModule === 'function') ensureModule().catch(() => null);
    return fallback;
}


/* Pure helpers: student-service-model.js · Chrome UI: student-service-chrome.js · Events: student-service-events.js (loaded before this file). */

/* Inbox/filter + UI state/stores: student-service-inbox-runtime.js */
(function exposeStudentServiceInboxDeps() {
    if (typeof hasStudentServiceFiltersModule === 'function') (window.KiuStudentService||(window.KiuStudentService={})).hasStudentServiceFiltersModule = window.hasStudentServiceFiltersModule = hasStudentServiceFiltersModule;
    if (typeof ensureStudentServiceFiltersModule === 'function') (window.KiuStudentService||(window.KiuStudentService={})).ensureStudentServiceFiltersModule = window.ensureStudentServiceFiltersModule = ensureStudentServiceFiltersModule;
    if (typeof hasStudentServiceQaModule === 'function') (window.KiuStudentService||(window.KiuStudentService={})).hasStudentServiceQaModule = window.hasStudentServiceQaModule = hasStudentServiceQaModule;
    if (typeof ensureStudentServiceQaModule === 'function') (window.KiuStudentService||(window.KiuStudentService={})).ensureStudentServiceQaModule = window.ensureStudentServiceQaModule = ensureStudentServiceQaModule;
    if (typeof hasStudentServiceTicketsModule === 'function') (window.KiuStudentService||(window.KiuStudentService={})).hasStudentServiceTicketsModule = window.hasStudentServiceTicketsModule = hasStudentServiceTicketsModule;
    if (typeof ensureStudentServiceTicketsModule === 'function') (window.KiuStudentService||(window.KiuStudentService={})).ensureStudentServiceTicketsModule = window.ensureStudentServiceTicketsModule = ensureStudentServiceTicketsModule;
    if (typeof hasStudentServiceAttachmentsModule === 'function') (window.KiuStudentService||(window.KiuStudentService={})).hasStudentServiceAttachmentsModule = window.hasStudentServiceAttachmentsModule = hasStudentServiceAttachmentsModule;
    if (typeof ensureStudentServiceAttachmentsModule === 'function') (window.KiuStudentService||(window.KiuStudentService={})).ensureStudentServiceAttachmentsModule = window.ensureStudentServiceAttachmentsModule = ensureStudentServiceAttachmentsModule;
    if (typeof hasStudentServiceServiceModule === 'function') (window.KiuStudentService||(window.KiuStudentService={})).hasStudentServiceServiceModule = window.hasStudentServiceServiceModule = hasStudentServiceServiceModule;
    if (typeof ensureStudentServiceServiceModule === 'function') (window.KiuStudentService||(window.KiuStudentService={})).ensureStudentServiceServiceModule = window.ensureStudentServiceServiceModule = ensureStudentServiceServiceModule;
    if (typeof scheduleStudentServiceModuleRerenderIfNeeded === 'function') (window.KiuStudentService||(window.KiuStudentService={})).scheduleStudentServiceModuleRerenderIfNeeded = window.scheduleStudentServiceModuleRerenderIfNeeded = scheduleStudentServiceModuleRerenderIfNeeded;
    if (typeof getEffectiveUserRole === 'function') (window.KiuStudentService||(window.KiuStudentService={})).getEffectiveUserRole = getEffectiveUserRole;
    if (typeof getCurrentUserId === 'function') (window.KiuStudentService||(window.KiuStudentService={})).getCurrentUserId = getCurrentUserId;
    if (typeof getCurrentFaculty === 'function') (window.KiuStudentService||(window.KiuStudentService={})).getCurrentFaculty = getCurrentFaculty;
    if (typeof normalizeFacultyCode === 'function') (window.KiuStudentService||(window.KiuStudentService={})).normalizeFacultyCode = normalizeFacultyCode;
    if (typeof ssNowIso === 'function') (window.KiuStudentService||(window.KiuStudentService={})).ssNowIso = ssNowIso;
    if (typeof ssParseTime === 'function') (window.KiuStudentService||(window.KiuStudentService={})).ssParseTime = ssParseTime;
    if (typeof buildStudentServiceDefaultMacros === 'function') (window.KiuStudentService||(window.KiuStudentService={})).buildStudentServiceDefaultMacros = buildStudentServiceDefaultMacros;
    if (typeof closeStudentServiceQuestionThreadModal === 'function') (window.KiuStudentService||(window.KiuStudentService={})).closeStudentServiceQuestionThreadModal = closeStudentServiceQuestionThreadModal;
    if (typeof closeStudentServiceTicketThreadModal === 'function') (window.KiuStudentService||(window.KiuStudentService={})).closeStudentServiceTicketThreadModal = closeStudentServiceTicketThreadModal;
    if (typeof closeStudentServiceInlineReply === 'function') (window.KiuStudentService||(window.KiuStudentService={})).closeStudentServiceInlineReply = closeStudentServiceInlineReply;
    if (typeof updateStudentServiceQuestionThreadActiveCards === 'function') (window.KiuStudentService||(window.KiuStudentService={})).updateStudentServiceQuestionThreadActiveCards = updateStudentServiceQuestionThreadActiveCards;
    (window.KiuStudentService||(window.KiuStudentService={})).STUDENT_SERVICE_LANES = STUDENT_SERVICE_LANES;
    (window.KiuStudentService||(window.KiuStudentService={})).STUDENT_SERVICE_UI_PREFS_KEY = STUDENT_SERVICE_UI_PREFS_KEY;
    (window.KiuStudentService||(window.KiuStudentService={})).STUDENT_SERVICE_CATEGORIES = STUDENT_SERVICE_CATEGORIES;
    (window.KiuStudentService||(window.KiuStudentService={})).STUDENT_SERVICE_SUPPORT_AREAS = STUDENT_SERVICE_SUPPORT_AREAS;
    (window.KiuStudentService||(window.KiuStudentService={})).STUDENT_SERVICE_SUPPORT_AREA_BY_ID = STUDENT_SERVICE_SUPPORT_AREA_BY_ID;
    (window.KiuStudentService||(window.KiuStudentService={})).STUDENT_SERVICE_RUNTIME = window.STUDENT_SERVICE_RUNTIME = STUDENT_SERVICE_RUNTIME;
    window.KIU_STATE = typeof KIU_STATE !== 'undefined' ? KIU_STATE : window.KIU_STATE;
    window.__kiuStudentServiceUiState = studentServiceUiState;
})();
const __ssvcInbox = typeof window.__kiuCreateStudentServiceInboxApi === 'function'
    ? window.__kiuCreateStudentServiceInboxApi({
        STUDENT_SERVICE_LANES,
        STUDENT_SERVICE_UI_PREFS_KEY,
        STUDENT_SERVICE_CATEGORIES,
        STUDENT_SERVICE_SUPPORT_AREAS,
        STUDENT_SERVICE_SUPPORT_AREA_BY_ID,
        STUDENT_SERVICE_RUNTIME,
        KIU_STATE: typeof KIU_STATE !== 'undefined' ? KIU_STATE : window.KIU_STATE,
        studentServiceUiState
    })
    : {};
const {
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
} = __ssvcInbox;

Object.assign(__ssvcModulesDeps, {
    getStudentServicePublishedInboxFilterLayout,
    renderStudentServiceInboxFiltersMarkup,
    normalizeStudentServiceTicket
});


function resolveStudentServiceReplyShell(triggerElement = null) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'resolveStudentServiceReplyShell', resolveStudentServiceReplyShell, arguments, '');
}

function resolveStudentServiceParentAnswerId(triggerElement = null, shell = null, questionId = '') {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'resolveStudentServiceParentAnswerId', resolveStudentServiceParentAnswerId, arguments, null);
}

function isStudentServiceInlineReplyOpen() {
    return Boolean(STUDENT_SERVICE_RUNTIME.pendingReplyParentAnswerId)
        || Boolean(document.querySelector('.student-service-qa-comment-reply-shell'));
}

function syncStudentServiceInlineReplyUiState() {
    const detail = document.querySelector('.student-service-qa-card.is-open .student-service-qa-detail');
    if (!detail) return;
    detail.classList.toggle('is-inline-reply-open', isStudentServiceInlineReplyOpen());
}

function ensureStudentServiceModalRoot() {
    let root = document.getElementById('student-service-modal-root');
    if (!root) {
        root = document.createElement('div');
        root.id = 'student-service-modal-root';
        root.setAttribute('hidden', '');
        root.setAttribute('data-lux-transparency-exempt', '1');
        document.body.appendChild(root);
    } else if (root.parentElement !== document.body) {
        document.body.appendChild(root);
    }
    if (!root.hasAttribute('data-lux-transparency-exempt')) {
        root.setAttribute('data-lux-transparency-exempt', '1');
    }
    return root;
}

function closeStudentServiceDeleteConfirm(options = {}) {
    const { restoreThread = true } = options;
    const modalRoot = document.getElementById('student-service-modal-root');
    const wasDeleteConfirm = Boolean(modalRoot?.querySelector('[data-student-service-delete-confirm="true"]'));
    if (modalRoot) {
        modalRoot.innerHTML = '';
        modalRoot.setAttribute('hidden', '');
    }
    document.querySelectorAll('.student-service-qa-delete-confirm').forEach(node => node.remove());
    const ui = ensureStudentServiceUiState();
    if (restoreThread && wasDeleteConfirm && ui.serviceLane === 'qa' && ui.selectedQuestionId) {
        mountStudentServiceQuestionThreadModal(ui.selectedQuestionId);
        return;
    }
    if (studentServiceShouldRestoreBodyScroll()) {
        document.body.style.overflow = '';
    }
}

function canCurrentUserDeleteStudentServiceAnswer(question, answer) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'canCurrentUserDeleteStudentServiceAnswer', canCurrentUserDeleteStudentServiceAnswer, arguments, false);
}

function canCurrentUserSetStudentServiceOwnerResolution(question) {
    const currentUser = getStudentServiceCurrentUser();
    if (!currentUser?.id || !question) return false;
    if (typeof question.viewerCanSetOwnerResolution === 'boolean') return question.viewerCanSetOwnerResolution;
    return String(question.authorUserId || question.authorId || '') === String(currentUser.id || '').trim();
}

function getStudentServiceQuestionResolutionLabel(question = {}) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'getStudentServiceQuestionResolutionLabel', getStudentServiceQuestionResolutionLabel, arguments, null);
}

function renderStudentServiceOwnerResolutionPillMarkup(question = {}) {
    const ownerStatus = String(question.ownerResolutionStatus || '').trim().toLowerCase();
    if (ownerStatus !== 'answered' && ownerStatus !== 'unanswered') return '';
    const resolution = getStudentServiceQuestionResolutionLabel(question);
    return `<span class="student-service-pill student-service-pill--${ssEscape(resolution.tone)}"><i class="fas ${ssEscape(resolution.icon)}" aria-hidden="true"></i> ${ssEscape(resolution.label)}</span>`;
}

function canCurrentUserDeleteStudentServiceQuestion(question) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'canCurrentUserDeleteStudentServiceQuestion', canCurrentUserDeleteStudentServiceQuestion, arguments, false);
}

function buildStudentServiceAnswerCardOptions(question) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'buildStudentServiceAnswerCardOptions', buildStudentServiceAnswerCardOptions, arguments, null);
}

function findNewestStudentServiceNestedReply(question, parentAnswerId) {
    const parentId = String(parentAnswerId || '').trim();
    if (!question || !parentId) return null;
    const replies = (question.answers || [])
        .map(normalizeStudentServiceAnswer)
        .filter(answer => String(answer.parentAnswerId || '').trim() === parentId);
    if (!replies.length) return null;
    return replies.sort((left, right) => ssParseTime(right.createdAt || right.updatedAt) - ssParseTime(left.createdAt || left.updatedAt))[0];
}

function appendStudentServiceReplyNode(questionId, parentAnswerId) {
    const normalizedQuestionId = String(questionId || '').trim();
    const normalizedParentId = String(parentAnswerId || '').trim();
    if (!normalizedQuestionId || !normalizedParentId) return false;
    const question = getStudentServiceQuestionById(normalizedQuestionId);
    const parentArticle = studentServiceAnswerArticleEl(normalizedParentId);
    if (!question || !parentArticle) return false;
    const reply = findNewestStudentServiceNestedReply(question, normalizedParentId);
    if (!reply || studentServiceAnswerArticleEl(reply.id)) return Boolean(reply);
    let children = parentArticle.querySelector(':scope > .social-neo-comment-children');
    if (!children) {
        children = document.createElement('div');
        children.className = 'social-neo-comment-children';
        parentArticle.appendChild(children);
        parentArticle.classList.add('has-children');
    }
    const holder = document.createElement('div');
    holder.innerHTML = renderStudentServiceAnswerCardMarkup(
        question,
        reply,
        {
            ...buildStudentServiceAnswerCardOptions(question),
            isReply: true,
            canDelete: canCurrentUserDeleteStudentServiceAnswer(question, reply)
        }
    );
    if (holder.firstElementChild) children.appendChild(holder.firstElementChild);
    const replyCount = (question.answers || []).filter(answer => String(answer.parentAnswerId || '').trim() === normalizedParentId).length;
    const replyLabel = parentArticle.querySelector('.social-neo-comment-reply-label');
    if (replyLabel) replyLabel.textContent = `Reply${replyCount ? ` (${replyCount})` : ''}`;
    const thread = parentArticle.closest('.student-service-qa-thread-comments');
    scheduleStudentServiceThreadRelayout(thread);
    return true;
}

function getStudentServiceVisibleArticles() {
    const role = getEffectiveUserRole();
    const { articles } = ensureStudentServiceStores();
    if ([USER_ROLES.ADMIN, USER_ROLES.STUDENT_SERVICE, USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(role)) return articles;
    return articles.filter(article => article.published);
}

function getStudentServicePermissions() {
    return KIU_STATE.studentServicePermissions || {};
}

function getStudentServiceAnalytics() {
    return KIU_STATE.studentServiceAnalytics || {};
}

function canShowStudentServiceArticleEditorActions() {
    const role = getEffectiveUserRole();
    return role === USER_ROLES.STUDENT_SERVICE || role === USER_ROLES.ADMIN;
}

function canCurrentUserModerateStudentService() {
    const permissions = getStudentServicePermissions();
    const authRole = typeof getAuthenticatedAccountRole === 'function'
        ? getAuthenticatedAccountRole()
        : '';
    const effectiveRole = getEffectiveUserRole();

    if (authRole === USER_ROLES.STUDENT_SERVICE) {
        return typeof permissions.canModerate === 'boolean' ? permissions.canModerate : true;
    }

    if (authRole === USER_ROLES.ADMIN && effectiveRole === USER_ROLES.STUDENT_SERVICE) {
        if (permissions.canModerate === true) return true;
        if (permissions.canModerate === false && STUDENT_SERVICE_RUNTIME.loaded) return false;
        return true;
    }

    if (typeof permissions.canModerate === 'boolean') return permissions.canModerate;
    return effectiveRole === USER_ROLES.ADMIN;
}

async function syncStudentServiceWorkspaceBackendSession() {
    const authRole = typeof getAuthenticatedAccountRole === 'function'
        ? getAuthenticatedAccountRole()
        : '';
    if (authRole !== USER_ROLES.ADMIN) return;
    const effectiveRole = typeof getEffectiveUserRole === 'function'
        ? getEffectiveUserRole()
        : '';
    if (effectiveRole !== USER_ROLES.STUDENT_SERVICE) return;
    if (typeof setActiveSessionUserByRole === 'function') {
        setActiveSessionUserByRole(USER_ROLES.STUDENT_SERVICE);
    }
    if (typeof syncPortalBackendImpersonation === 'function') {
        await syncPortalBackendImpersonation(USER_ROLES.STUDENT_SERVICE);
    }
    if (typeof fetchStudentServiceBootstrap === 'function') {
        await fetchStudentServiceBootstrap(true);
    }
}


function canCurrentUserRespondToStudentService(question = null) {
    const currentUser = getStudentServiceCurrentUser();
    if (!currentUser?.id) return false;
    if (question && typeof question.viewerCanRespond === 'boolean') return question.viewerCanRespond;
    const permissions = getStudentServicePermissions();
    if (typeof permissions.canRespond === 'boolean') return Boolean(permissions.canRespond);
    return true;
}

function buildStudentServiceQaContentFingerprint(questions = []) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'buildStudentServiceQaContentFingerprint', buildStudentServiceQaContentFingerprint, arguments, null);
}

function buildStudentServiceQaFeedCacheKey(ui, filteredQuestions) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'buildStudentServiceQaFeedCacheKey', buildStudentServiceQaFeedCacheKey, arguments, null);
}

function getStudentServiceVisibleQuestions() {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'getStudentServiceVisibleQuestions', getStudentServiceVisibleQuestions, arguments, []);
}

function getStudentServiceQuestionAuthorLabel(question) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'getStudentServiceQuestionAuthorLabel', getStudentServiceQuestionAuthorLabel, arguments, null);
}

function getStudentServiceSelectedQuestion(questions) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'getStudentServiceSelectedQuestion', getStudentServiceSelectedQuestion, arguments, null);
}

function getStudentServiceOpenQuestion(questions) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'getStudentServiceOpenQuestion', getStudentServiceOpenQuestion, arguments, null);
}

function getStudentServiceFilteredQuestions(questions) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'getStudentServiceFilteredQuestions', getStudentServiceFilteredQuestions, arguments, []);
}

function getStudentServiceSimilarQuestions(draft = {}) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'getStudentServiceSimilarQuestions', getStudentServiceSimilarQuestions, arguments, []);
}

function getStudentServiceSubjectOptions() {
    if (typeof getStudentGradedSubjectsForChancellery === 'function') {
        return getStudentGradedSubjectsForChancellery().map(subject => ({
            subjectId: subject.subjectId,
            subjectName: subject.subjectName,
            groupId: subject.groupId,
            groupName: subject.groupName,
            faculty: subject.faculty
        }));
    }
    const currentUser = getStudentServiceCurrentUser();
    const effectiveRole = typeof getEffectiveUserRole === 'function'
        ? getEffectiveUserRole()
        : (currentUserRole || currentUser?.role || USER_ROLES.STUDENT);
    if (!currentUser || effectiveRole !== USER_ROLES.STUDENT) return [];
    const schedule = typeof getCurrentStudentSchedule === 'function' ? getCurrentStudentSchedule() : [];
    return schedule.map(item => ({
        subjectId: item.courseId,
        subjectName: item.courseName || item.courseId,
        groupId: item.groupId,
        groupName: item.groupName || item.groupId,
        faculty: item.faculty || currentUser.facultyCode || currentUser.faculty || ''
    }));
}

function getStudentServiceDraftTicket() {
    const resolved = ssForwardToLoadedModule(
        hasStudentServiceTicketsModule,
        ensureStudentServiceTicketsModule,
        'getStudentServiceDraftTicket',
        getStudentServiceDraftTicket,
        arguments,
        null
    );
    if (resolved && typeof resolved === 'object') return resolved;
    const ui = ensureStudentServiceUiState();
    if (ui.draftTicket && typeof ui.draftTicket === 'object') return ui.draftTicket;
    const fallback = typeof buildStudentServiceDefaultDraftTicket === 'function'
        ? buildStudentServiceDefaultDraftTicket()
        : null;
    return fallback && typeof fallback === 'object'
        ? fallback
        : {
            serviceArea: 'general',
            category: 'General Question',
            title: '',
            message: '',
            subjectValue: '',
            relatedContextLabel: ''
        };
}

function syncStudentServiceDraftTicketFromDom() {
    return ssForwardToLoadedModule(hasStudentServiceTicketsModule, ensureStudentServiceTicketsModule, 'syncStudentServiceDraftTicketFromDom', syncStudentServiceDraftTicketFromDom, arguments, undefined);
}

function setStudentServiceDraftTicketField(field, value, rerender = false) {
    return ssForwardToLoadedModule(hasStudentServiceTicketsModule, ensureStudentServiceTicketsModule, 'setStudentServiceDraftTicketField', setStudentServiceDraftTicketField, arguments, undefined);
}

function focusStudentServiceSupportArea(areaId) {
    const ui = ensureStudentServiceUiState();
    const area = getStudentServiceSupportArea(areaId);
    if (
        ui.serviceLane === 'service'
        && ui.activeSupportArea === area.id
        && ui.studentTab === 'get_help'
        && ui.draftTicket.serviceArea === area.id
        && ui.draftTicket.category === getStudentServiceDefaultCategoryForArea(area.id)
    ) {
        return;
    }
    syncStudentServiceDraftTicketFromDom();
    ui.serviceLane = 'service';
    ui.activeSupportArea = area.id;
    ui.studentTab = 'get_help';
    ui.draftTicket.serviceArea = area.id;
    ui.draftTicket.category = getStudentServiceDefaultCategoryForArea(area.id);
    renderStudentServicePage();
    if (isStudentServiceGuidanceModalOpen()) {
        remountStudentServiceGuidanceModal();
    }
}

function openStudentServicePanel(panel) {
    const ui = ensureStudentServiceUiState();
    const nextLane = panel === 'qa' ? 'qa' : 'service';
    const nextPanel = panel === 'articles' ? 'articles' : panel === 'qa' ? 'qa' : 'tickets';
    if (document.getElementById('page-student-service') && ui.serviceLane === nextLane && ui.staffPanel === nextPanel) {
        return;
    }
    ui.serviceLane = nextLane;
    ui.staffPanel = nextPanel;
    if (document.getElementById('page-student-service')) {
        renderStudentServicePage();
        return;
    }
    if (typeof navigate === 'function') navigate('student-service');
}

function getStudentServiceArticlesForArea(articles, areaId) {
    const area = getStudentServiceSupportArea(areaId);
    return (articles || []).filter(article =>
        article.serviceArea === area.id || article.category === area.category
    );
}

function getStudentServiceUsersById() {
    const domain = typeof getDomain === 'function' ? getDomain() : null;
    return domain?.usersById || {};
}

function getStudentServiceStudentProfile(studentId) {
    const user = getStudentServiceUsersById()?.[studentId] || null;
    return user || (KIU_STATE.users || []).find(item => String(item?.id || '') === String(studentId || '')) || null;
}

function getStudentServiceStudentSchedule(studentId) {
    const student = getStudentServiceStudentProfile(studentId);
    const activeFaculty = normalizeFacultyCode(student?.facultyCode || student?.faculty || getCurrentFaculty(), 'ECON');
    const schedule = KIU_STATE.studentSchedulesByStudent?.[studentId];
    return (Array.isArray(schedule) ? schedule : []).filter(item => {
        const derivedFaculty = typeof deriveFacultyFromSubjectId === 'function' ? deriveFacultyFromSubjectId(item?.courseId) : '';
        const entryFaculty = normalizeFacultyCode(item?.faculty || derivedFaculty || activeFaculty, activeFaculty);
        return entryFaculty === activeFaculty;
    });
}


function getStudentServiceStudentRegistrationContext(studentId) {
    const saved = KIU_STATE.studentRegistrations?.[studentId];
    return normalizeStudentServiceRegistrationCourseIds(saved);
}

function getStudentServiceStudentCases(studentId) {
    const requests = typeof ensureChancelleryRequestsStore === 'function'
        ? ensureChancelleryRequestsStore()
        : (Array.isArray(KIU_STATE.chancelleryRequests) ? KIU_STATE.chancelleryRequests : []);
    return requests.filter(request => String(request?.studentId || '') === String(studentId || ''));
}

function getStudentServiceStudentGradeSummary(studentId) {
    const records = [];
    Object.entries(KIU_STATE.studentGrades || {}).forEach(([rosterId, roster]) => {
        (Array.isArray(roster) ? roster : []).forEach(entry => {
            if (String(entry?.id || '') !== String(studentId || '')) return;
            records.push({
                rosterId,
                final: Number(entry.final || 0),
                mid: Number(entry.mid || 0),
                quiz: Number(entry.q1 || 0),
                homework: Number(entry.qa || 0),
                letter: entry.letter || '-'
            });
        });
    });
    if (!records.length) return { counted: 0, averageFinal: '-', latestLetter: '-' };
    const averageFinal = Math.round(records.reduce((sum, item) => sum + item.final, 0) / records.length);
    return {
        counted: records.length,
        averageFinal,
        latestLetter: records[0]?.letter || '-'
    };
}

function getStudentServiceCurrentSectionId() {
    const activeSectionId = document.querySelector('.page-section.active-page')?.id || '';
    return activeSectionId.startsWith('page-') ? activeSectionId.slice(5) : activeSectionId;
}

function getStudentServiceTicketSourceLabel(pageId) {
    return ssForwardToLoadedModule(hasStudentServiceTicketsModule, ensureStudentServiceTicketsModule, 'getStudentServiceTicketSourceLabel', getStudentServiceTicketSourceLabel, arguments, null);
}

function buildStudentServiceIntakeContext(studentId) {
    const currentUser = getStudentServiceCurrentUser();
    const currentPage = getStudentServiceCurrentSectionId() || 'student-service';
    const facultyCode = normalizeFacultyCode(
        currentUser?.facultyCode || currentUser?.faculty || getCurrentFaculty?.() || '',
        ''
    );
    const schedule = getStudentServiceStudentSchedule(studentId);
    const registrations = getStudentServiceStudentRegistrationContext(studentId);
    return {
        sourcePage: currentPage,
        sourceLabel: getStudentServiceTicketSourceLabel(currentPage),
        roleAtSubmission: getEffectiveUserRole(),
        facultyAtSubmission: facultyCode,
        studentBalance: Number(KIU_STATE.tuitionBalances?.[studentId] || 0),
        probationActive: Boolean(KIU_STATE.probationStatus?.[studentId]),
        registeredSubjects: schedule.length,
        savedRegistrations: registrations.length
    };
}

function getStudentServiceAgingDays(value) {
    const time = ssParseTime(value);
    if (!time) return 0;
    return Math.floor((Date.now() - time) / (1000 * 60 * 60 * 24));
}

function buildStudentServiceReadOnlyContext(studentId) {
    const profile = getStudentServiceStudentProfile(studentId);
    const schedule = getStudentServiceStudentSchedule(studentId);
    const registrations = getStudentServiceStudentRegistrationContext(studentId);
    const cases = getStudentServiceStudentCases(studentId);
    const balance = Number(KIU_STATE.tuitionBalances?.[studentId] || 0);
    const probation = Boolean(KIU_STATE.probationStatus?.[studentId]);
    const gradeSummary = getStudentServiceStudentGradeSummary(studentId);
    return {
        profile,
        schedule,
        registrations,
        cases,
        balance,
        probation,
        gradeSummary,
        schedulePreview: schedule.slice(0, 4),
        latestCase: cases[0] || null
    };
}

function getStudentServiceVisibleTickets() {
    return ssForwardToLoadedModule(hasStudentServiceTicketsModule, ensureStudentServiceTicketsModule, 'getStudentServiceVisibleTickets', getStudentServiceVisibleTickets, arguments, []);
}

function sortStudentServiceTicketsForStaff(tickets = []) {
    return ssForwardToLoadedModule(hasStudentServiceTicketsModule, ensureStudentServiceTicketsModule, 'sortStudentServiceTicketsForStaff', sortStudentServiceTicketsForStaff, arguments, null);
}

function ensureSelectedStudentServiceTicket(tickets) {
    return ssForwardToLoadedModule(hasStudentServiceTicketsModule, ensureStudentServiceTicketsModule, 'ensureSelectedStudentServiceTicket', ensureSelectedStudentServiceTicket, arguments, null);
}

function ensureSelectedStudentServiceArticle(articles) {
    const ui = ensureStudentServiceUiState();
    if (!articles.length) {
        ui.selectedArticleId = '';
        return null;
    }
    if (!ui.selectedArticleId || !articles.some(article => article.id === ui.selectedArticleId)) {
        const featured = articles.find(article => article.featured) || articles[0];
        ui.selectedArticleId = featured.id;
    }
    return articles.find(article => article.id === ui.selectedArticleId) || articles[0] || null;
}

function pickStudentHubFeaturedArticle(articles = []) {
    if (!articles.length) return null;
    const featured = articles.filter(article => article.featured);
    if (featured.length) {
        return featured.slice().sort((left, right) =>
            ssParseTime(right.updatedAt || right.createdAt) - ssParseTime(left.updatedAt || left.createdAt)
        )[0];
    }
    return articles.slice().sort((left, right) =>
        ssParseTime(right.updatedAt || right.createdAt) - ssParseTime(left.updatedAt || left.createdAt)
    )[0];
}

function resolveStudentHubArticle(selectedArea, ui) {
    const articles = selectedArea?.articles || [];
    if (!articles.length) return null;
    if (!ui.studentHubArticleByArea || typeof ui.studentHubArticleByArea !== 'object') {
        ui.studentHubArticleByArea = {};
    }
    const laneId = String(selectedArea.id || '').trim();
    const manualId = String(ui.studentHubArticleByArea[laneId] || '').trim();
    if (manualId && articles.some(article => article.id === manualId)) {
        return articles.find(article => article.id === manualId) || null;
    }
    const picked = pickStudentHubFeaturedArticle(articles);
    if (picked) ui.studentHubArticleByArea[laneId] = picked.id;
    return picked;
}

function pruneStudentHubArticleSelections(articles = []) {
    const ui = ensureStudentServiceUiState();
    if (!ui.studentHubArticleByArea || typeof ui.studentHubArticleByArea !== 'object') return;
    const publishedIds = new Set((articles || []).filter(article => article.published).map(article => article.id));
    Object.keys(ui.studentHubArticleByArea).forEach((laneId) => {
        if (!publishedIds.has(ui.studentHubArticleByArea[laneId])) {
            delete ui.studentHubArticleByArea[laneId];
        }
    });
}

function selectStudentHubArticle(articleId, areaId) {
    const ui = ensureStudentServiceUiState();
    if (!ui.studentHubArticleByArea || typeof ui.studentHubArticleByArea !== 'object') {
        ui.studentHubArticleByArea = {};
    }
    const laneId = String(areaId || ui.activeSupportArea || 'general').trim();
    const nextArticleId = String(articleId || '').trim();
    ui.studentHubArticleByArea[laneId] = nextArticleId;
    ui.selectedGuidanceArticleId = nextArticleId;
    if (isStudentServiceGuidanceModalOpen()) {
        remountStudentServiceGuidanceModal();
        return;
    }
    invalidateStudentServiceRenderSignature();
    renderStudentServicePage();
}

function resolveStudentServiceArticleServiceAreaId(ui) {
    const articleId = String(ui?.articleEditorId || '').trim();
    if (articleId && !ui?.articleDraftMode) {
        const existing = ensureStudentServiceStores().articles.find(article => article.id === articleId);
        if (existing?.serviceArea) return getStudentServiceSupportArea(existing.serviceArea).id;
    }
    return getStudentServiceSupportArea(ui?.activeSupportArea || 'general').id;
}

function getStudentServiceStatusClass(status) {
    if (status === 'Resolved' || status === 'Closed' || status === 'Waiting for Service') return 'is-positive';
    if (status === 'Waiting for Student') return 'is-warning';
    if (status === 'In Review') return 'is-review';
    return 'is-neutral';
}

function getStudentServiceFilteredStaffTickets(tickets, currentUser, options = {}) {
    const ui = ensureStudentServiceUiState();
    const layout = resolveStudentServiceInboxFilterLayout(options);
    const filters = (layout.filters || []).filter(filter => filter.enabled);
    return sortStudentServiceTicketsForStaff(tickets).filter(ticket =>
        filters.every(filter => ticketMatchesStudentServiceInboxFilter(ticket, filter, ui, currentUser))
    );
}

function buildStudentServiceStudentInboxFilterLayout() {
    return ssForwardToLoadedModule(hasStudentServiceFiltersModule, ensureStudentServiceFiltersModule, 'buildStudentServiceStudentInboxFilterLayout', buildStudentServiceStudentInboxFilterLayout, arguments, { version: 1, filters: [] });
}

function renderStudentServiceStudentInboxFiltersMarkup(ui, visibleTickets, currentUser) {
    return ssForwardToLoadedModule(hasStudentServiceFiltersModule, ensureStudentServiceFiltersModule, 'renderStudentServiceStudentInboxFiltersMarkup', renderStudentServiceStudentInboxFiltersMarkup, arguments, '');
}

function getStudentServiceFilteredStudentTickets(tickets, currentUser, options = {}) {
    const ui = ensureStudentServiceUiState();
    const layout = options.layout || buildStudentServiceStudentInboxFilterLayout();
    const filters = (layout?.filters || []).filter(filter => filter?.enabled);
    return (Array.isArray(tickets) ? tickets : [])
        .filter(ticket => filters.every(filter => ticketMatchesStudentServiceInboxFilter(ticket, filter, ui, currentUser)))
        .sort((a, b) => ssParseTime(b.updatedAt || b.createdAt) - ssParseTime(a.updatedAt || a.createdAt));
}

function getStudentServiceFilteredArticles(articles) {
    const ui = ensureStudentServiceUiState();
    const query = ui.articleSearch.trim().toLowerCase();
    if (!query) return articles;
    return articles.filter(article => [article.title, article.summary, article.content, article.category].some(field =>
        String(field || '').toLowerCase().includes(query)
    ));
}

function findStudentServiceArticleForTicket(ticket, articles) {
    return ssForwardToLoadedModule(hasStudentServiceTicketsModule, ensureStudentServiceTicketsModule, 'findStudentServiceArticleForTicket', findStudentServiceArticleForTicket, arguments, null);
}

function getStudentServiceContextForTicket(ticket, articles) {
    return ssForwardToLoadedModule(hasStudentServiceTicketsModule, ensureStudentServiceTicketsModule, 'getStudentServiceContextForTicket', getStudentServiceContextForTicket, arguments, null);
}

function getStudentServiceRelevantMacros(ticket) {
    const { macros } = ensureStudentServiceStores();
    if (!ticket) return macros.slice(0, 4);
    return macros.filter(macro =>
        macro.category === 'General Question'
        || macro.category === ticket.category
        || macro.serviceArea === ticket.serviceArea
    ).slice(0, 4);
}

function studentServiceMatchesQuery(query, fields) {
    const needle = String(query || '').trim().toLowerCase();
    if (!needle) return true;
    return (Array.isArray(fields) ? fields : []).some(field => String(field || '').toLowerCase().includes(needle));
}

function captureStudentServiceComposeFocus(scopeElement) {
    const active = document.activeElement;
    if (!active?.matches?.('[data-student-service-draft-ticket-field]')) return null;
    const form = active.closest('.student-service-request-form');
    if (!form || (scopeElement && !scopeElement.contains(form))) return null;
    return {
        field: active.dataset.studentServiceDraftTicketField || '',
        selectionStart: typeof active.selectionStart === 'number' ? active.selectionStart : null,
        selectionEnd: typeof active.selectionEnd === 'number' ? active.selectionEnd : null
    };
}

function restoreStudentServiceComposeFocus(scopeElement, state) {
    if (!state?.field || !scopeElement) return;
    const next = scopeElement.querySelector(`[data-student-service-draft-ticket-field="${state.field}"]`);
    if (!next || typeof next.focus !== 'function') return;
    next.focus();
    if (typeof next.setSelectionRange === 'function' && state.selectionStart != null && state.selectionEnd != null) {
        try {
            next.setSelectionRange(state.selectionStart, state.selectionEnd);
        } catch (_) {}
    }
}

function setStudentServiceMarkup(element, key, markup) {
    if (!element) return false;
    const cached = studentServiceMarkupCache.get(element);
    if (cached && cached.key === key && cached.markup === markup) return false;
    const composeFocus = captureStudentServiceComposeFocus(element);
    const range = document.createRange();
    range.selectNodeContents(element);
    element.replaceChildren(range.createContextualFragment(markup));
    studentServiceMarkupCache.set(element, { key, markup });
    if (composeFocus) restoreStudentServiceComposeFocus(element, composeFocus);
    return true;
}

function captureStudentServiceScrollAnchors() {
    const feedWrap = document.querySelector('.student-service-qa-feed-wrap');
    const scrollParent = feedWrap?.closest('[data-lux-scroll-rail]') || feedWrap;
    return {
        windowY: window.scrollY,
        feedWrapTop: feedWrap?.scrollTop ?? 0,
        scrollParentTop: scrollParent?.scrollTop ?? 0,
        scrollParent: scrollParent || null,
        feedWrap: feedWrap || null
    };
}

function restoreStudentServiceScrollAnchors(anchors) {
    if (!anchors) return;
    window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
            window.scrollTo(0, anchors.windowY);
            if (anchors.scrollParent) anchors.scrollParent.scrollTop = anchors.scrollParentTop;
            if (anchors.feedWrap && anchors.feedWrap !== anchors.scrollParent) {
                anchors.feedWrap.scrollTop = anchors.feedWrapTop;
            }
            scheduleStudentServiceThreadRelayout();
        });
    });
}

function runStudentServiceScrollPreserved(callback) {
    const anchors = captureStudentServiceScrollAnchors();
    const result = callback();
    restoreStudentServiceScrollAnchors(anchors);
    return result;
}

function relayoutStudentServiceCommentTrunks(scope) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'relayoutStudentServiceCommentTrunks', relayoutStudentServiceCommentTrunks, arguments, undefined);
}

function bindStudentServiceThreadResizeObserver(scope) {
    if (typeof ResizeObserver !== 'function') return;
    const thread = scope?.closest?.('.student-service-qa-thread-comments')
        || scope?.querySelector?.('.student-service-qa-thread-comments')
        || (scope?.classList?.contains('student-service-qa-thread-comments') ? scope : null);
    if (!thread) return;
    if (!studentServiceThreadResizeObserver) {
        studentServiceThreadResizeObserver = new ResizeObserver(() => {
            window.requestAnimationFrame(() => relayoutStudentServiceCommentTrunks());
        });
    }
    if (thread.dataset.studentServiceThreadObserved !== '1') {
        thread.dataset.studentServiceThreadObserved = '1';
        studentServiceThreadResizeObserver.observe(thread);
    }
}

function scheduleStudentServiceThreadRelayout(scope = null) {
    window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
            relayoutStudentServiceCommentTrunks(scope);
            const threadRoots = scope
                ? [scope.closest?.('.student-service-qa-thread-comments') || (scope.classList?.contains('student-service-qa-thread-comments') ? scope : null)].filter(Boolean)
                : [...document.querySelectorAll('.student-service-qa-thread-comments')];
            threadRoots.forEach(bindStudentServiceThreadResizeObserver);
        });
    });
}

function getStudentServiceQuestionById(questionId) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'getStudentServiceQuestionById', getStudentServiceQuestionById, arguments, null);
}

function findStudentServiceAnswerRecord(question, answerId) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'findStudentServiceAnswerRecord', findStudentServiceAnswerRecord, arguments, null);
}

function studentServiceAnswerArticleEl(answerId) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'studentServiceAnswerArticleEl', studentServiceAnswerArticleEl, arguments, undefined);
}

function getStudentServiceQuestionCardElement(questionId) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'getStudentServiceQuestionCardElement', getStudentServiceQuestionCardElement, arguments, null);
}

function getStudentServiceQuestionThreadMode() {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'getStudentServiceQuestionThreadMode', getStudentServiceQuestionThreadMode, arguments, null);
}

function isStudentServiceQuestionThreadModalOpen() {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'isStudentServiceQuestionThreadModalOpen', isStudentServiceQuestionThreadModalOpen, arguments, false);
}

function getStudentServiceQuestionThreadModalBody() {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'getStudentServiceQuestionThreadModalBody', getStudentServiceQuestionThreadModalBody, arguments, null);
}

function getStudentServiceQuestionThreadHost(questionId) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'getStudentServiceQuestionThreadHost', getStudentServiceQuestionThreadHost, arguments, null);
}

function updateStudentServiceQuestionCardToggleUi(card) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'updateStudentServiceQuestionCardToggleUi', updateStudentServiceQuestionCardToggleUi, arguments, undefined);
}

function clearLegacyStudentServiceOpenQuestionCards() {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'clearLegacyStudentServiceOpenQuestionCards', clearLegacyStudentServiceOpenQuestionCards, arguments, undefined);
}

function updateStudentServiceQuestionThreadActiveCards(questionId) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'updateStudentServiceQuestionThreadActiveCards', updateStudentServiceQuestionThreadActiveCards, arguments, undefined);
}

function closeStudentServiceQuestionThreadModal() {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'closeStudentServiceQuestionThreadModal', closeStudentServiceQuestionThreadModal, arguments, undefined);
}

function getStudentServiceTicketThreadMode() {
    return ssForwardToLoadedModule(hasStudentServiceTicketsModule, ensureStudentServiceTicketsModule, 'getStudentServiceTicketThreadMode', getStudentServiceTicketThreadMode, arguments, null);
}

function isStudentServiceTicketThreadModalOpen() {
    return ssForwardToLoadedModule(hasStudentServiceTicketsModule, ensureStudentServiceTicketsModule, 'isStudentServiceTicketThreadModalOpen', isStudentServiceTicketThreadModalOpen, arguments, false);
}

function getStudentServiceTicketById(ticketId) {
    return ssForwardToLoadedModule(hasStudentServiceTicketsModule, ensureStudentServiceTicketsModule, 'getStudentServiceTicketById', getStudentServiceTicketById, arguments, null);
}

function scrollStudentServiceTicketChatLog(scope = null) {
    return ssForwardToLoadedModule(hasStudentServiceTicketsModule, ensureStudentServiceTicketsModule, 'scrollStudentServiceTicketChatLog', scrollStudentServiceTicketChatLog, arguments, undefined);
}

function renderStudentServiceTicketThreadModalShell(ticket, options = {}) {
    return ssForwardToLoadedModule(hasStudentServiceTicketsModule, ensureStudentServiceTicketsModule, 'renderStudentServiceTicketThreadModalShell', renderStudentServiceTicketThreadModalShell, arguments, '');
}

function closeStudentServiceTicketThreadModal() {
    return ssForwardToLoadedModule(hasStudentServiceTicketsModule, ensureStudentServiceTicketsModule, 'closeStudentServiceTicketThreadModal', closeStudentServiceTicketThreadModal, arguments, undefined);
}

function mountStudentServiceTicketThreadModal(ticketId) {
    return ssForwardToLoadedModule(hasStudentServiceTicketsModule, ensureStudentServiceTicketsModule, 'mountStudentServiceTicketThreadModal', mountStudentServiceTicketThreadModal, arguments, undefined);
}

function remountStudentServiceTicketThreadModal() {
    return ssForwardToLoadedModule(hasStudentServiceTicketsModule, ensureStudentServiceTicketsModule, 'remountStudentServiceTicketThreadModal', remountStudentServiceTicketThreadModal, arguments, undefined);
}

function getStudentServiceTicketReplyTextareaId(role = '') {
    return ssForwardToLoadedModule(hasStudentServiceTicketsModule, ensureStudentServiceTicketsModule, 'getStudentServiceTicketReplyTextareaId', getStudentServiceTicketReplyTextareaId, arguments, null);
}

function getStudentServiceInternalNoteTextareaId() {
    return ssForwardToLoadedModule(hasStudentServiceTicketsModule, ensureStudentServiceTicketsModule, 'getStudentServiceInternalNoteTextareaId', getStudentServiceInternalNoteTextareaId, arguments, null);
}

function getStudentServiceInternalNoteComposerId() {
    return ssForwardToLoadedModule(hasStudentServiceTicketsModule, ensureStudentServiceTicketsModule, 'getStudentServiceInternalNoteComposerId', getStudentServiceInternalNoteComposerId, arguments, null);
}

function renderStudentServiceQuestionThreadModalShell(question, options = {}) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'renderStudentServiceQuestionThreadModalShell', renderStudentServiceQuestionThreadModalShell, arguments, '');
}

function mountStudentServiceQuestionThreadModal(questionId) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'mountStudentServiceQuestionThreadModal', mountStudentServiceQuestionThreadModal, arguments, undefined);
}

function remountStudentServiceQuestionThreadModal() {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'remountStudentServiceQuestionThreadModal', remountStudentServiceQuestionThreadModal, arguments, undefined);
}

function setStudentServiceOpenQuestionId(questionId) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'setStudentServiceOpenQuestionId', setStudentServiceOpenQuestionId, arguments, undefined);
}

function restoreStudentServiceOpenQuestionFromUi() {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'restoreStudentServiceOpenQuestionFromUi', restoreStudentServiceOpenQuestionFromUi, arguments, undefined);
}

function syncStudentServiceRenderSignature() {
    const container = document.getElementById('page-student-service');
    if (!container) return;
    const role = getEffectiveUserRole();
    const currentUser = getStudentServiceCurrentUser();
    const visibleArticles = getStudentServiceVisibleArticles();
    const visibleTickets = getStudentServiceVisibleTickets();
    container.dataset.studentServiceChromeSignature = buildStudentServiceChromeSignature(role, currentUser, visibleArticles, visibleTickets);
    container.dataset.studentServiceRenderSignature = buildStudentServiceRenderSignature(role, currentUser, visibleArticles, visibleTickets);
    if (isStudentServiceQaBodyStale()) {
        rerenderStudentServicePageAfterModuleLoad();
    }
}

function closeStudentServiceInlineReply() {
    document.querySelectorAll('.student-service-qa-comment-reply-shell').forEach(shell => shell.remove());
    document.querySelectorAll('.student-service-qa-answer-reply-btn.is-active').forEach(button => button.classList.remove('is-active'));
    const ui = ensureStudentServiceUiState();
    ui.replyingToAnswerId = '';
    ui.replyingToQuestionId = '';
    STUDENT_SERVICE_RUNTIME.pendingReplyParentAnswerId = '';
    syncStudentServiceInlineReplyUiState();
    scheduleStudentServiceThreadRelayout();
}
(window.KiuStudentService||(window.KiuStudentService={})).closeStudentServiceInlineReply = closeStudentServiceInlineReply;

function openStudentServiceInlineReply(questionId, answerId) {
    closeStudentServiceInlineReply();
    const question = getStudentServiceQuestionById(questionId);
    const answer = findStudentServiceAnswerRecord(question, answerId);
    if (!question || !answer) {
        alert('Could not open reply — refresh the thread and try again.');
        return;
    }
    const article = studentServiceAnswerArticleEl(answerId);
    const body = article?.querySelector(':scope > .social-neo-comment-row > .social-neo-comment-body');
    if (!article || !body) {
        alert('Could not open inline reply on this comment. Refresh the page and try again.');
        return;
    }
    const holder = document.createElement('div');
    holder.innerHTML = renderStudentServiceCommentReplyShell(question, answer, 'data-lux-skip-modern-button="true"');
    const form = holder.firstElementChild;
    if (form) body.appendChild(form);
    const replyBtn = article.querySelector('.student-service-qa-answer-reply-btn');
    replyBtn?.classList.add('is-active');
    flashStudentServiceActionButton(replyBtn, 'acting');
    const ui = ensureStudentServiceUiState();
    ui.replyingToQuestionId = String(questionId || '').trim();
    ui.replyingToAnswerId = String(answerId || '').trim();
    STUDENT_SERVICE_RUNTIME.pendingReplyParentAnswerId = String(answerId || '').trim();
    syncStudentServiceInlineReplyUiState();
    const thread = article.closest('.student-service-qa-thread-comments');
    scheduleStudentServiceThreadRelayout(thread);
    window.requestAnimationFrame(() => {
        const input = form?.querySelector('.student-service-qa-reply-input');
        input?.focus?.({ preventScroll: true });
    });
}

function patchStudentServiceQuestionCardStats(questionId) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'patchStudentServiceQuestionCardStats', patchStudentServiceQuestionCardStats, arguments, undefined);
}

function isStudentServiceQuestionHelpfulVoted(question = {}) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'isStudentServiceQuestionHelpfulVoted', isStudentServiceQuestionHelpfulVoted, arguments, false);
}

const updateStudentServiceOwnerResolutionButtons = window.updateStudentServiceOwnerResolutionButtons;
const renderStudentServiceOwnerResolutionButtonMarkup = window.renderStudentServiceOwnerResolutionButtonMarkup;
const renderStudentServiceQuestionHelpfulButtonMarkup = window.renderStudentServiceQuestionHelpfulButtonMarkup;
const updateStudentServiceQuestionHelpfulButton = window.updateStudentServiceQuestionHelpfulButton;
const triggerStudentServiceHelpfulAnimation = window.triggerStudentServiceHelpfulAnimation;
const flashStudentServiceActionButton = window.flashStudentServiceActionButton;
const setStudentServiceActionButtonPending = window.setStudentServiceActionButtonPending;
const patchStudentServiceQuestionHelpfulUi = window.patchStudentServiceQuestionHelpfulUi;
const isStudentServiceAnswerHelpfulVoted = window.isStudentServiceAnswerHelpfulVoted;
const renderStudentServiceAnswerHelpfulButtonMarkup = window.renderStudentServiceAnswerHelpfulButtonMarkup;
const updateStudentServiceAnswerHelpfulButton = window.updateStudentServiceAnswerHelpfulButton;
const patchStudentServiceAnswerHelpfulBtn = window.patchStudentServiceAnswerHelpfulBtn;
const removeStudentServiceAnswerBranch = window.removeStudentServiceAnswerBranch;
const applyStudentServiceQuestionMutation = window.applyStudentServiceQuestionMutation;
const patchStudentServiceOpenQuestionThread = window.patchStudentServiceOpenQuestionThread;
const ensureStudentServiceOperationsShell = window.ensureStudentServiceOperationsShell;
const renderStudentServiceOperationsHeadMarkup = window.renderStudentServiceOperationsHeadMarkup;
const renderStudentServiceOperationsStatsMarkup = window.renderStudentServiceOperationsStatsMarkup;
const renderStudentServiceOperationsQueueMarkup = window.renderStudentServiceOperationsQueueMarkup;
const renderStudentServiceOperationsLanesMarkup = window.renderStudentServiceOperationsLanesMarkup;
const renderStudentServiceOperationsStrip = window.renderStudentServiceOperationsStrip;
const renderStudentServiceHomeWorkspaceRebuilt = window.renderStudentServiceHomeWorkspaceRebuilt;
const setStudentServiceQuestionFilter = window.setStudentServiceQuestionFilter;
const setStudentServiceQuestionComposerExpanded = window.setStudentServiceQuestionComposerExpanded;
const setStudentServiceDraftQuestionField = window.setStudentServiceDraftQuestionField;
const openStudentServiceQuestion = window.openStudentServiceQuestion;
const setStudentServiceReplyTarget = window.setStudentServiceReplyTarget;
const clearStudentServiceReplyTarget = window.clearStudentServiceReplyTarget;
const getStudentServiceQuestionStatusLabel = window.getStudentServiceQuestionStatusLabel;
const getStudentServiceQuestionStatusClass = window.getStudentServiceQuestionStatusClass;
const getStudentServiceQuestionAnswerCount = window.getStudentServiceQuestionAnswerCount;
const renderStudentServiceQuestionList = window.renderStudentServiceQuestionList;
const renderStudentServiceQuestionComposer = window.renderStudentServiceQuestionComposer;
const renderStudentServiceQuestionComposerFormMarkup = window.renderStudentServiceQuestionComposerFormMarkup;
const renderStudentServiceQuestionComposerModalActionsMarkup = window.renderStudentServiceQuestionComposerModalActionsMarkup;
const renderStudentServiceQuestionComposerModalShell = window.renderStudentServiceQuestionComposerModalShell;
const renderStudentServiceQuestionCardPreviewMarkup = window.renderStudentServiceQuestionCardPreviewMarkup;
const renderStudentServiceQuestionFeed = window.renderStudentServiceQuestionFeed;
const renderStudentServiceCommentReplyShell = window.renderStudentServiceCommentReplyShell;
const syncStudentServiceDeleteConfirmGate = window.syncStudentServiceDeleteConfirmGate;
const mountStudentServiceDeleteConfirmShell = window.mountStudentServiceDeleteConfirmShell;
const openStudentServiceDeleteConfirm = window.openStudentServiceDeleteConfirm;
const openStudentServiceDeleteQuestionConfirm = window.openStudentServiceDeleteQuestionConfirm;
const getStudentServiceArticleById = window.getStudentServiceArticleById;
const openStudentServiceDeleteArticleConfirm = window.openStudentServiceDeleteArticleConfirm;
const isStudentServiceQuestionComposerModalOpen = window.isStudentServiceQuestionComposerModalOpen;
const mountStudentServiceQuestionComposerModal = window.mountStudentServiceQuestionComposerModal;
const openStudentServiceQuestionComposerModal = window.openStudentServiceQuestionComposerModal;
const studentServiceShouldRestoreBodyScroll = window.studentServiceShouldRestoreBodyScroll;
const isStudentServiceGuidanceModalOpen = window.isStudentServiceGuidanceModalOpen;
const buildStudentServiceGuidanceModalContext = window.buildStudentServiceGuidanceModalContext;
const renderStudentServiceGuidanceModalShell = window.renderStudentServiceGuidanceModalShell;
const mountStudentServiceGuidanceModal = window.mountStudentServiceGuidanceModal;
const openStudentServiceGuidanceModal = window.openStudentServiceGuidanceModal;
const closeStudentServiceGuidanceModal = window.closeStudentServiceGuidanceModal;
const remountStudentServiceGuidanceModal = window.remountStudentServiceGuidanceModal;
const closeStudentServiceQuestionComposerModal = window.closeStudentServiceQuestionComposerModal;
const remountStudentServiceQuestionComposerModal = window.remountStudentServiceQuestionComposerModal;
const renderStudentServiceAnswerCardMarkup = window.renderStudentServiceAnswerCardMarkup;
const renderStudentServiceAnswerThreadNode = window.renderStudentServiceAnswerThreadNode;
const renderStudentServiceQuestionDetailActionsMarkup = window.renderStudentServiceQuestionDetailActionsMarkup;
const renderStudentServiceQuestionDetail = window.renderStudentServiceQuestionDetail;
const openStudentServiceTicket = window.openStudentServiceTicket;
const openStudentServiceArticle = window.openStudentServiceArticle;
const openStudentServiceArticleFromTicket = window.openStudentServiceArticleFromTicket;
const setStudentServiceArticleSearch = window.setStudentServiceArticleSearch;
const scheduleStudentServiceTicketFilterRender = window.scheduleStudentServiceTicketFilterRender;
const setStudentServiceTicketFilter = window.setStudentServiceTicketFilter;
const switchStudentServicePanel = window.switchStudentServicePanel;
const switchStudentServiceStudentTab = window.switchStudentServiceStudentTab;
const toggleStudentServiceDetailSection = window.toggleStudentServiceDetailSection;
const refreshStudentServiceDataAndRender = window.refreshStudentServiceDataAndRender;
const studentServiceApiPath = window.studentServiceApiPath;
const getStudentServiceBackendStaleMessage = window.getStudentServiceBackendStaleMessage;
const ensureStudentServiceBackendContract = window.ensureStudentServiceBackendContract;
const formatStudentServiceApiError = window.formatStudentServiceApiError;
const ensureStudentServiceAttachmentInput = window.ensureStudentServiceAttachmentInput;
const ensureStudentServiceDraftAttachments = window.ensureStudentServiceDraftAttachments;
const getStudentServiceDraftAttachments = window.getStudentServiceDraftAttachments;
const getStudentServiceAnswerComposerId = window.getStudentServiceAnswerComposerId;
const addStudentServiceDraftAttachment = window.addStudentServiceDraftAttachment;
const removeStudentServiceDraftAttachment = window.removeStudentServiceDraftAttachment;
const clearStudentServiceDraftAttachments = window.clearStudentServiceDraftAttachments;
const persistStudentServiceDraftAttachments = window.persistStudentServiceDraftAttachments;
const resolveStudentServiceAttachmentUrl = window.resolveStudentServiceAttachmentUrl;
const isStudentServiceImageAttachment = window.isStudentServiceImageAttachment;
const isStudentServiceVideoAttachment = window.isStudentServiceVideoAttachment;
const renderStudentServiceAttachmentGalleryMarkup = window.renderStudentServiceAttachmentGalleryMarkup;
const renderStudentServiceAttachmentChipsMarkup = window.renderStudentServiceAttachmentChipsMarkup;
const renderStudentServiceAttachmentPickerMarkup = window.renderStudentServiceAttachmentPickerMarkup;
const pickStudentServiceAttachments = window.pickStudentServiceAttachments;
const postStudentService = window.postStudentService;
const submitStudentServiceTicket = window.submitStudentServiceTicket;
const replyStudentServiceTicket = window.replyStudentServiceTicket;
const updateStudentServiceTicketStatus = window.updateStudentServiceTicketStatus;
const assignStudentServiceTicketToCurrentUser = window.assignStudentServiceTicketToCurrentUser;
const submitStudentServiceQuestion = window.submitStudentServiceQuestion;
const submitStudentServiceQuestionAnswer = window.submitStudentServiceQuestionAnswer;
const patchStudentServiceOwnerResolutionUi = window.patchStudentServiceOwnerResolutionUi;
const setStudentServiceQuestionOwnerResolution = window.setStudentServiceQuestionOwnerResolution;
const setStudentServiceQuestionFeedback = window.setStudentServiceQuestionFeedback;
const setStudentServiceAnswerFeedback = window.setStudentServiceAnswerFeedback;

/* Article/page/bootstrap: student-service-page-runtime.js */
(function exposeStudentServicePageDeps() {
    if (typeof bindStudentServiceDelegatedInteractions === 'function') (window.KiuStudentService||(window.KiuStudentService={})).bindStudentServiceDelegatedInteractions = bindStudentServiceDelegatedInteractions;
    if (typeof bindStudentServiceRealtimeRefreshListener === 'function') (window.KiuStudentService||(window.KiuStudentService={})).bindStudentServiceRealtimeRefreshListener = bindStudentServiceRealtimeRefreshListener;
    if (typeof buildStudentServiceArticleFingerprint === 'function') (window.KiuStudentService||(window.KiuStudentService={})).buildStudentServiceArticleFingerprint = buildStudentServiceArticleFingerprint;
    if (typeof buildStudentServiceChromeSignature === 'function') (window.KiuStudentService||(window.KiuStudentService={})).buildStudentServiceChromeSignature = buildStudentServiceChromeSignature;
    if (typeof buildStudentServiceQaContentFingerprint === 'function') (window.KiuStudentService||(window.KiuStudentService={})).buildStudentServiceQaContentFingerprint = buildStudentServiceQaContentFingerprint;
    if (typeof canCurrentUserModerateStudentService === 'function') (window.KiuStudentService||(window.KiuStudentService={})).canCurrentUserModerateStudentService = canCurrentUserModerateStudentService;
    if (typeof canShowStudentServiceArticleEditorActions === 'function') (window.KiuStudentService||(window.KiuStudentService={})).canShowStudentServiceArticleEditorActions = canShowStudentServiceArticleEditorActions;
    if (typeof closeStudentServiceDeleteConfirm === 'function') (window.KiuStudentService||(window.KiuStudentService={})).closeStudentServiceDeleteConfirm = closeStudentServiceDeleteConfirm;
    if (typeof ensureStudentServiceQaModule === 'function') (window.KiuStudentService||(window.KiuStudentService={})).ensureStudentServiceQaModule = window.ensureStudentServiceQaModule = ensureStudentServiceQaModule;
    if (typeof ensureStudentServiceStores === 'function') (window.KiuStudentService||(window.KiuStudentService={})).ensureStudentServiceStores = ensureStudentServiceStores;
    if (typeof ensureStudentServiceTicketsModule === 'function') (window.KiuStudentService||(window.KiuStudentService={})).ensureStudentServiceTicketsModule = window.ensureStudentServiceTicketsModule = ensureStudentServiceTicketsModule;
    if (typeof ensureStudentServiceUiState === 'function') (window.KiuStudentService||(window.KiuStudentService={})).ensureStudentServiceUiState = ensureStudentServiceUiState;
    if (typeof flashStudentServiceActionButton === 'function') (window.KiuStudentService||(window.KiuStudentService={})).flashStudentServiceActionButton = flashStudentServiceActionButton;
    if (typeof getActivePageId === 'function') (window.KiuStudentService||(window.KiuStudentService={})).getActivePageId = getActivePageId;
    if (typeof getCurrentUserId === 'function') (window.KiuStudentService||(window.KiuStudentService={})).getCurrentUserId = getCurrentUserId;
    if (typeof getEffectiveUserRole === 'function') (window.KiuStudentService||(window.KiuStudentService={})).getEffectiveUserRole = getEffectiveUserRole;
    if (typeof getStudentServiceArticleById === 'function') (window.KiuStudentService||(window.KiuStudentService={})).getStudentServiceArticleById = getStudentServiceArticleById;
    if (typeof getStudentServiceCurrentUser === 'function') (window.KiuStudentService||(window.KiuStudentService={})).getStudentServiceCurrentUser = getStudentServiceCurrentUser;
    if (typeof getStudentServiceFilteredQuestions === 'function') (window.KiuStudentService||(window.KiuStudentService={})).getStudentServiceFilteredQuestions = getStudentServiceFilteredQuestions;
    if (typeof getStudentServiceLane === 'function') (window.KiuStudentService||(window.KiuStudentService={})).getStudentServiceLane = getStudentServiceLane;
    if (typeof getStudentServicePublishedInboxFilterLayout === 'function') {
        (window.KiuStudentService||(window.KiuStudentService={})).getStudentServicePublishedInboxFilterLayout = getStudentServicePublishedInboxFilterLayout;
        window.getStudentServicePublishedInboxFilterLayout = getStudentServicePublishedInboxFilterLayout;
    }
    if (typeof getStudentServiceSupportArea === 'function') (window.KiuStudentService||(window.KiuStudentService={})).getStudentServiceSupportArea = getStudentServiceSupportArea;
    if (typeof getStudentServiceVisibleArticles === 'function') (window.KiuStudentService||(window.KiuStudentService={})).getStudentServiceVisibleArticles = getStudentServiceVisibleArticles;
    if (typeof getStudentServiceVisibleQuestions === 'function') (window.KiuStudentService||(window.KiuStudentService={})).getStudentServiceVisibleQuestions = getStudentServiceVisibleQuestions;
    if (typeof getStudentServiceVisibleTickets === 'function') (window.KiuStudentService||(window.KiuStudentService={})).getStudentServiceVisibleTickets = getStudentServiceVisibleTickets;
    if (typeof hasStudentServiceQaModule === 'function') (window.KiuStudentService||(window.KiuStudentService={})).hasStudentServiceQaModule = window.hasStudentServiceQaModule = hasStudentServiceQaModule;
    if (typeof hasStudentServiceServiceModule === 'function') (window.KiuStudentService||(window.KiuStudentService={})).hasStudentServiceServiceModule = window.hasStudentServiceServiceModule = hasStudentServiceServiceModule;
    if (typeof hasStudentServiceTicketsModule === 'function') (window.KiuStudentService||(window.KiuStudentService={})).hasStudentServiceTicketsModule = window.hasStudentServiceTicketsModule = hasStudentServiceTicketsModule;
    if (typeof isStudentServiceQaBodyStale === 'function') (window.KiuStudentService||(window.KiuStudentService={})).isStudentServiceQaBodyStale = isStudentServiceQaBodyStale;
    if (typeof kiuPortalFetch === 'function') (window.KiuStudentService||(window.KiuStudentService={})).kiuPortalFetch = kiuPortalFetch;
    if (typeof postStudentService === 'function') (window.KiuStudentService||(window.KiuStudentService={})).postStudentService = postStudentService;
    if (typeof pruneStudentHubArticleSelections === 'function') (window.KiuStudentService||(window.KiuStudentService={})).pruneStudentHubArticleSelections = pruneStudentHubArticleSelections;
    if (typeof renderStudentServiceBootstrapLoadingShell === 'function') (window.KiuStudentService||(window.KiuStudentService={})).renderStudentServiceBootstrapLoadingShell = renderStudentServiceBootstrapLoadingShell;
    if (typeof renderStudentServiceHomeWorkspaceRebuilt === 'function') (window.KiuStudentService||(window.KiuStudentService={})).renderStudentServiceHomeWorkspaceRebuilt = renderStudentServiceHomeWorkspaceRebuilt;
    if (typeof renderStudentServiceLaneChooser === 'function') (window.KiuStudentService||(window.KiuStudentService={})).renderStudentServiceLaneChooser = renderStudentServiceLaneChooser;
    if (typeof renderStudentServiceMyTicketsHub === 'function') (window.KiuStudentService||(window.KiuStudentService={})).renderStudentServiceMyTicketsHub = window.renderStudentServiceMyTicketsHub = renderStudentServiceMyTicketsHub;
    if (typeof renderStudentServicePageChromeRebuilt === 'function') (window.KiuStudentService||(window.KiuStudentService={})).renderStudentServicePageChromeRebuilt = renderStudentServicePageChromeRebuilt;
    if (typeof renderStudentServiceResponderServiceLane === 'function') (window.KiuStudentService||(window.KiuStudentService={})).renderStudentServiceResponderServiceLane = window.renderStudentServiceResponderServiceLane = renderStudentServiceResponderServiceLane;
    if (typeof renderStudentServiceStaffWorkbench === 'function') (window.KiuStudentService||(window.KiuStudentService={})).renderStudentServiceStaffWorkbench = window.renderStudentServiceStaffWorkbench = renderStudentServiceStaffWorkbench;
    if (typeof renderStudentServiceStudentHub === 'function') (window.KiuStudentService||(window.KiuStudentService={})).renderStudentServiceStudentHub = window.renderStudentServiceStudentHub = renderStudentServiceStudentHub;
    if (typeof renderStudentServiceStudentQaHub === 'function') (window.KiuStudentService||(window.KiuStudentService={})).renderStudentServiceStudentQaHub = window.renderStudentServiceStudentQaHub = renderStudentServiceStudentQaHub;
    if (typeof resolveStudentServiceArticleServiceAreaId === 'function') (window.KiuStudentService||(window.KiuStudentService={})).resolveStudentServiceArticleServiceAreaId = resolveStudentServiceArticleServiceAreaId;
    if (typeof scheduleKiuRealtimeBootstrap === 'function') (window.KiuStudentService||(window.KiuStudentService={})).scheduleKiuRealtimeBootstrap = scheduleKiuRealtimeBootstrap;
    if (typeof scheduleStudentServiceBootstrap === 'function') (window.KiuStudentService||(window.KiuStudentService={})).scheduleStudentServiceBootstrap = scheduleStudentServiceBootstrap;
    if (typeof scheduleStudentServiceThreadRelayout === 'function') (window.KiuStudentService||(window.KiuStudentService={})).scheduleStudentServiceThreadRelayout = scheduleStudentServiceThreadRelayout;
    if (typeof setStudentServiceMarkup === 'function') (window.KiuStudentService||(window.KiuStudentService={})).setStudentServiceMarkup = setStudentServiceMarkup;
    if (typeof shouldDeferStudentServiceStudentHubUntilBootstrap === 'function') (window.KiuStudentService||(window.KiuStudentService={})).shouldDeferStudentServiceStudentHubUntilBootstrap = shouldDeferStudentServiceStudentHubUntilBootstrap;
    if (typeof syncStudentServiceWorkspaceBackendSession === 'function') (window.KiuStudentService||(window.KiuStudentService={})).syncStudentServiceWorkspaceBackendSession = syncStudentServiceWorkspaceBackendSession;
    (window.KiuStudentService||(window.KiuStudentService={})).STUDENT_SERVICE_RUNTIME = window.STUDENT_SERVICE_RUNTIME = STUDENT_SERVICE_RUNTIME;
})();
const __ssvcPage = typeof window.__kiuCreateStudentServicePageApi === 'function'
    ? window.__kiuCreateStudentServicePageApi({
        STUDENT_SERVICE_RUNTIME,
        STUDENT_SERVICE_API_PATHS: window.STUDENT_SERVICE_API_PATHS,
        USER_ROLES: typeof USER_ROLES !== 'undefined' ? USER_ROLES : window.USER_ROLES
    })
    : {};
const {
deleteStudentServiceArticle,
    deleteStudentServiceQuestion,
    deleteStudentServiceQuestionAnswer,
    publishStudentServiceQuestion,
    toggleStudentServiceQuestionFlag,
    convertStudentServiceQuestionToTicket,
    convertStudentServiceQuestionToArticle,
    mergeStudentServiceQuestionPrompt,
    applyStudentServiceMacro,
    addStudentServiceInternalNote,
    updateStudentServiceHandoff,
    renderStudentServiceCollapsibleSection,
    editStudentServiceArticle,
    saveStudentServiceArticle,
    startStudentServiceNewArticle,
    renderStudentServiceLaneSwitcher,
    ensureStudentServicePageShell,
    renderStudentServiceHomeWorkspace,
    renderStudentServiceStudentView,
    renderStudentServiceStaffView,
    renderStudentServiceStudentViewRebuilt,
    renderStudentServiceStaffViewRebuilt,
    buildStudentServiceBodySignature,
    buildStudentServiceRenderSignature,
    ensureStudentServiceDefaultLaneForStaff,
    renderStudentServicePage,
    isStudentServiceWorkspaceVisible,
    shouldBootstrapStudentServiceWorkspace,
    handleStudentServiceQaThreadClick,
    bootstrapStudentServicePage
} = __ssvcPage;

if (typeof renderStudentServicePage === 'function') {
    (window.KiuStudentService || (window.KiuStudentService = {})).renderStudentServicePage = window.renderStudentServicePage = renderStudentServicePage;
}
if (typeof syncStudentServiceWorkspaceBackendSession === 'function') {
    window.syncStudentServiceWorkspaceBackendSession = syncStudentServiceWorkspaceBackendSession;
}
if (typeof canShowStudentServiceArticleEditorActions === 'function') {
    window.canShowStudentServiceArticleEditorActions = canShowStudentServiceArticleEditorActions;
}

Object.assign(__ssvcModulesDeps, {
    handleStudentServiceQaThreadClick,
    renderStudentServiceQuestionFeed,
    renderStudentServiceAttachmentPickerMarkup,
    renderStudentServiceAttachmentGalleryMarkup,
    submitStudentServiceTicket
});

