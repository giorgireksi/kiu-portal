/* Student Service Center runtime */

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
const STUDENT_SERVICE_QA_MODULE_URL = 'assets/js/pages/student-service-qa.js?v=20260626-ssvc-qa-header-merge1';
const STUDENT_SERVICE_SERVICE_MODULE_URL = 'assets/js/pages/student-service-service.js?v=20260628-ssvc-hub-merge';
const STUDENT_SERVICE_FILTERS_MODULE_URL = 'assets/js/pages/student-service-filters.js?v=20260714-ssvc-filters1';
const STUDENT_SERVICE_ATTACHMENTS_MODULE_URL = 'assets/js/pages/student-service-attachments.js?v=20260714-ssvc-attach1';
const STUDENT_SERVICE_TICKETS_MODULE_URL = 'assets/js/pages/student-service-tickets.js?v=20260714-ssvc-tickets1';



const studentServiceUiState = {};
const studentServiceMarkupCache = new WeakMap();
let studentServiceQaModulePromise = null;
let studentServiceServiceModulePromise = null;
let studentServiceThreadResizeObserver = null;
let studentServiceModuleRerenderScheduled = false;
let studentServiceQaModuleLastErrorAt = 0;
let studentServiceServiceModuleLastErrorAt = 0;
let studentServiceInboxFilterEditorDraft = null;
let STUDENT_SERVICE_STUDENT_HUB_STUB = null;
let STUDENT_SERVICE_STUDENT_QA_HUB_STUB = null;
let STUDENT_SERVICE_MY_TICKETS_HUB_STUB = null;
let STUDENT_SERVICE_RESPONDER_SERVICE_LANE_STUB = null;
let STUDENT_SERVICE_STAFF_QA_FEED_STUB = null;
let STUDENT_SERVICE_STAFF_WORKBENCH_STUB = null;

function hasStudentServiceQaModule() {
    return Boolean(
        STUDENT_SERVICE_STUDENT_QA_HUB_STUB
        && STUDENT_SERVICE_STAFF_QA_FEED_STUB
        && window.__KIU_STUDENT_SERVICE_QA_MODULE_LOADED
        && typeof window.renderStudentServiceStudentQaHub === 'function'
        && typeof window.renderStudentServiceStaffQaFeed === 'function'
        && window.renderStudentServiceStudentQaHub !== STUDENT_SERVICE_STUDENT_QA_HUB_STUB
        && window.renderStudentServiceStaffQaFeed !== STUDENT_SERVICE_STAFF_QA_FEED_STUB
        && typeof window.handleStudentServiceQaThreadClick === 'function'
        && window.handleStudentServiceQaThreadClick !== handleStudentServiceQaThreadClick
        && typeof window.renderStudentServiceQuestionFeed === 'function'
        && window.renderStudentServiceQuestionFeed !== renderStudentServiceQuestionFeed
    );
}

function isStudentServiceLazyScriptExecuted(script, isReady) {
    if (!script) return false;
    return typeof isReady === 'function' && isReady();
}

function shouldWaitForStudentServiceLazyScriptLoad(script) {
    if (!script) return false;
    return (script.readyState === 'loading' || script.readyState === 'uninitialized')
        && script.dataset.kiuLoaded !== '1';
}

function removeStaleStudentServiceLazyScript(script, moduleKind = '') {
    if (!script?.parentNode) return;
    script.remove();
    if (moduleKind === 'qa') delete window.__KIU_STUDENT_SERVICE_QA_MODULE_LOADED;
    if (moduleKind === 'service') delete window.__KIU_STUDENT_SERVICE_SERVICE_MODULE_LOADED;
    if (moduleKind === 'filters') delete window.__KIU_STUDENT_SERVICE_FILTERS_MODULE_LOADED;
    if (moduleKind === 'attachments') delete window.__KIU_STUDENT_SERVICE_ATTACHMENTS_MODULE_LOADED;
    if (moduleKind === 'tickets') delete window.__KIU_STUDENT_SERVICE_TICKETS_MODULE_LOADED;
}

function finishStudentServiceLazyModuleLoad(resolve, reject, isReady, errorMessage) {
    const attempt = (retriesLeft) => {
        if (isReady()) {
            resolve(true);
            scheduleStudentServiceModuleRerenderIfNeeded();
            return;
        }
        if (retriesLeft > 0) {
            requestAnimationFrame(() => attempt(retriesLeft - 1));
            return;
        }
        reject(new Error(errorMessage));
    };
    queueMicrotask(() => attempt(8));
}

function scheduleStudentServiceModuleRerenderIfNeeded() {
    if (!getStudentServiceLane()) return;
    if (studentServiceModuleRerenderScheduled) return;
    studentServiceModuleRerenderScheduled = true;
    queueMicrotask(() => {
        studentServiceModuleRerenderScheduled = false;
        rerenderStudentServicePageAfterModuleLoad();
    });
}

function rerenderStudentServicePageAfterModuleLoad() {
    invalidateStudentServiceRenderSignature();
    renderStudentServicePage();
}

function isStudentServiceQaBodyStale() {
    if (getStudentServiceLane() !== 'qa' || !hasStudentServiceQaModule()) return false;
    const body = document.getElementById('student-service-page-body');
    if (!body) return false;
    return !body.querySelector('[data-student-service-student-qa-shell="1"]')
        && !body.querySelector('[data-student-service-staff-qa-shell="1"]');
}

function ensureStudentServiceQaModule() {
    if (hasStudentServiceQaModule()) return Promise.resolve(true);
    ensureStudentServiceAttachmentsModule().catch(() => null);
    if (studentServiceQaModulePromise) return studentServiceQaModulePromise;
    studentServiceQaModulePromise = new Promise((resolve, reject) => {
        const isReady = () => hasStudentServiceQaModule();
        const onComplete = () => finishStudentServiceLazyModuleLoad(
            resolve,
            reject,
            isReady,
            'Student Service Q&A module could not be loaded.'
        );
        let existing = document.querySelector(`script[src="${STUDENT_SERVICE_QA_MODULE_URL}"]`);
        if (existing) {
            if (isStudentServiceLazyScriptExecuted(existing, isReady)) {
                onComplete();
                return;
            }
            if (shouldWaitForStudentServiceLazyScriptLoad(existing)) {
                existing.addEventListener('load', onComplete, { once: true });
                existing.addEventListener('error', () => reject(new Error('Student Service Q&A module could not be loaded.')), { once: true });
                return;
            }
            if (existing.dataset.kiuLoaded === '1') {
                onComplete();
                return;
            }
            removeStaleStudentServiceLazyScript(existing, 'qa');
            existing = null;
        }
        const script = document.createElement('script');
        script.src = STUDENT_SERVICE_QA_MODULE_URL;
        script.defer = true;
        script.addEventListener('load', () => {
            script.dataset.kiuLoaded = '1';
            onComplete();
        }, { once: true });
        script.addEventListener('error', () => reject(new Error('Student Service Q&A module could not be loaded.')), { once: true });
        document.head.appendChild(script);
    }).catch((error) => {
        const now = Date.now();
        if (now - studentServiceQaModuleLastErrorAt > 3000) {
            studentServiceQaModuleLastErrorAt = now;
            console.error('Student Service Q&A module load failed.', error);
        }
        throw error;
    }).finally(() => {
        studentServiceQaModulePromise = null;
    });
    return studentServiceQaModulePromise;
}

function renderStudentServiceQaModuleLoading(container, mode = 'student') {
    if (!container) return;
    const title = mode === 'staff' ? 'Loading Q&A desk...' : 'Loading Q&A lane...';
    const copy = mode === 'staff'
        ? 'Preparing the public-question moderation feed.'
        : 'Preparing the public-question feed and composer.';
    setStudentServiceMarkup(
        container,
        `student-service-qa-module-loading:${mode}`,
        `
            <div class="student-service-empty-state student-service-empty-state-large">
                <div class="student-service-empty-title">${title}</div>
                <div class="student-service-empty-copy">${copy}</div>
            </div>
        `
    );
}

function renderStudentServiceQaModuleLoadError(container, mode = 'student') {
    if (!container) return;
    const title = mode === 'staff' ? 'Q&A desk could not load' : 'Q&A lane could not load';
    const copy = mode === 'staff'
        ? 'The moderation feed module failed to load. Retry to open the public-question desk.'
        : 'The public-question feed module failed to load. Retry to open the campus Q&A lane.';
    setStudentServiceMarkup(
        container,
        `student-service-qa-module-error:${mode}`,
        `
            <div class="student-service-empty-state student-service-empty-state-large student-service-qa-module-error">
                <div class="student-service-empty-title">${title}</div>
                <div class="student-service-empty-copy">${copy}</div>
                <button type="button" class="lux-primary-btn student-service-qa-module-retry-btn" data-student-service-retry-qa-module="${ssEscape(mode)}"><i class="fas fa-rotate-right"></i> Retry</button>
            </div>
        `
    );
}

function handleStudentServiceQaModuleLoadFailure(container, mode = 'student') {
    renderStudentServiceQaModuleLoadError(container, mode);
}

function hasStudentServiceServiceModule() {
    return Boolean(
        STUDENT_SERVICE_STUDENT_HUB_STUB
        && STUDENT_SERVICE_MY_TICKETS_HUB_STUB
        && STUDENT_SERVICE_RESPONDER_SERVICE_LANE_STUB
        && window.__KIU_STUDENT_SERVICE_SERVICE_MODULE_LOADED
        && typeof window.renderStudentServiceStudentHub === 'function'
        && typeof window.renderStudentServiceMyTicketsHub === 'function'
        && typeof window.renderStudentServiceResponderServiceLane === 'function'
        && window.renderStudentServiceStudentHub !== STUDENT_SERVICE_STUDENT_HUB_STUB
        && window.renderStudentServiceMyTicketsHub !== STUDENT_SERVICE_MY_TICKETS_HUB_STUB
        && window.renderStudentServiceResponderServiceLane !== STUDENT_SERVICE_RESPONDER_SERVICE_LANE_STUB
    );
}

function ensureStudentServiceServiceModule() {
    if (hasStudentServiceServiceModule()) return Promise.resolve(true);
    ensureStudentServiceFiltersModule().catch(() => null);
    ensureStudentServiceAttachmentsModule().catch(() => null);
    ensureStudentServiceTicketsModule().catch(() => null);
    if (studentServiceServiceModulePromise) return studentServiceServiceModulePromise;
    studentServiceServiceModulePromise = new Promise((resolve, reject) => {
        const isReady = () => hasStudentServiceServiceModule();
        const onComplete = () => finishStudentServiceLazyModuleLoad(
            resolve,
            reject,
            isReady,
            'Student Service service module could not be loaded.'
        );
        let existing = document.querySelector(`script[src="${STUDENT_SERVICE_SERVICE_MODULE_URL}"]`);
        if (existing) {
            if (isStudentServiceLazyScriptExecuted(existing, isReady)) {
                onComplete();
                return;
            }
            if (shouldWaitForStudentServiceLazyScriptLoad(existing)) {
                existing.addEventListener('load', onComplete, { once: true });
                existing.addEventListener('error', () => reject(new Error('Student Service service module could not be loaded.')), { once: true });
                return;
            }
            if (existing.dataset.kiuLoaded === '1') {
                onComplete();
                return;
            }
            removeStaleStudentServiceLazyScript(existing, 'service');
            existing = null;
        }
        const script = document.createElement('script');
        script.src = STUDENT_SERVICE_SERVICE_MODULE_URL;
        script.defer = true;
        script.addEventListener('load', () => {
            script.dataset.kiuLoaded = '1';
            onComplete();
        }, { once: true });
        script.addEventListener('error', () => reject(new Error('Student Service service module could not be loaded.')), { once: true });
        document.head.appendChild(script);
    }).catch((error) => {
        const now = Date.now();
        if (now - studentServiceServiceModuleLastErrorAt > 3000) {
            studentServiceServiceModuleLastErrorAt = now;
            console.error('Student Service service module load failed.', error);
        }
        throw error;
    }).finally(() => {
        studentServiceServiceModulePromise = null;
    });
    return studentServiceServiceModulePromise;
}

let studentServiceFiltersModulePromise = null;
let studentServiceFiltersModuleLastErrorAt = 0;

function hasStudentServiceFiltersModule() {
    return Boolean(
        window.__KIU_STUDENT_SERVICE_FILTERS_MODULE_LOADED
        && typeof window.getStudentServicePublishedInboxFilterLayout === 'function'
        && window.getStudentServicePublishedInboxFilterLayout !== getStudentServicePublishedInboxFilterLayout
        && typeof window.renderStudentServiceInboxFiltersMarkup === 'function'
        && window.renderStudentServiceInboxFiltersMarkup !== renderStudentServiceInboxFiltersMarkup
    );
}

function ensureStudentServiceFiltersModule() {
    if (hasStudentServiceFiltersModule()) return Promise.resolve(true);
    if (studentServiceFiltersModulePromise) return studentServiceFiltersModulePromise;
    studentServiceFiltersModulePromise = new Promise((resolve, reject) => {
        const isReady = () => hasStudentServiceFiltersModule();
        const onComplete = () => finishStudentServiceLazyModuleLoad(
            resolve,
            reject,
            isReady,
            'Student Service filters module could not be loaded.'
        );
        let existing = document.querySelector(`script[src="${STUDENT_SERVICE_FILTERS_MODULE_URL}"]`);
        if (existing) {
            if (isStudentServiceLazyScriptExecuted(existing, isReady)) {
                onComplete();
                return;
            }
            if (shouldWaitForStudentServiceLazyScriptLoad(existing)) {
                existing.addEventListener('load', onComplete, { once: true });
                existing.addEventListener('error', () => reject(new Error('Student Service filters module could not be loaded.')), { once: true });
                return;
            }
            if (existing.dataset.kiuLoaded === '1') {
                onComplete();
                return;
            }
            removeStaleStudentServiceLazyScript(existing, 'filters');
            existing = null;
        }
        const script = document.createElement('script');
        script.src = STUDENT_SERVICE_FILTERS_MODULE_URL;
        script.defer = true;
        script.addEventListener('load', () => {
            script.dataset.kiuLoaded = '1';
            onComplete();
        }, { once: true });
        script.addEventListener('error', () => reject(new Error('Student Service filters module could not be loaded.')), { once: true });
        document.head.appendChild(script);
    }).catch((error) => {
        const now = Date.now();
        if (now - studentServiceFiltersModuleLastErrorAt > 3000) {
            studentServiceFiltersModuleLastErrorAt = now;
            console.error('Student Service filters module load failed.', error);
        }
        throw error;
    }).finally(() => {
        studentServiceFiltersModulePromise = null;
    });
    return studentServiceFiltersModulePromise;
}

let studentServiceAttachmentsModulePromise = null;
let studentServiceAttachmentsModuleLastErrorAt = 0;

function hasStudentServiceAttachmentsModule() {
    return Boolean(
        window.__KIU_STUDENT_SERVICE_ATTACHMENTS_MODULE_LOADED
        && typeof window.renderStudentServiceAttachmentPickerMarkup === 'function'
        && window.renderStudentServiceAttachmentPickerMarkup !== renderStudentServiceAttachmentPickerMarkup
        && typeof window.renderStudentServiceAttachmentGalleryMarkup === 'function'
        && window.renderStudentServiceAttachmentGalleryMarkup !== renderStudentServiceAttachmentGalleryMarkup
    );
}

function ensureStudentServiceAttachmentsModule() {
    if (hasStudentServiceAttachmentsModule()) return Promise.resolve(true);
    if (studentServiceAttachmentsModulePromise) return studentServiceAttachmentsModulePromise;
    studentServiceAttachmentsModulePromise = new Promise((resolve, reject) => {
        const isReady = () => hasStudentServiceAttachmentsModule();
        const onComplete = () => finishStudentServiceLazyModuleLoad(
            resolve,
            reject,
            isReady,
            'Student Service attachments module could not be loaded.'
        );
        let existing = document.querySelector(`script[src="${STUDENT_SERVICE_ATTACHMENTS_MODULE_URL}"]`);
        if (existing) {
            if (isStudentServiceLazyScriptExecuted(existing, isReady)) {
                onComplete();
                return;
            }
            if (shouldWaitForStudentServiceLazyScriptLoad(existing)) {
                existing.addEventListener('load', onComplete, { once: true });
                existing.addEventListener('error', () => reject(new Error('Student Service attachments module could not be loaded.')), { once: true });
                return;
            }
            if (existing.dataset.kiuLoaded === '1') {
                onComplete();
                return;
            }
            removeStaleStudentServiceLazyScript(existing, 'attachments');
            existing = null;
        }
        const script = document.createElement('script');
        script.src = STUDENT_SERVICE_ATTACHMENTS_MODULE_URL;
        script.defer = true;
        script.addEventListener('load', () => {
            script.dataset.kiuLoaded = '1';
            onComplete();
        }, { once: true });
        script.addEventListener('error', () => reject(new Error('Student Service attachments module could not be loaded.')), { once: true });
        document.head.appendChild(script);
    }).catch((error) => {
        const now = Date.now();
        if (now - studentServiceAttachmentsModuleLastErrorAt > 3000) {
            studentServiceAttachmentsModuleLastErrorAt = now;
            console.error('Student Service attachments module load failed.', error);
        }
        throw error;
    }).finally(() => {
        studentServiceAttachmentsModulePromise = null;
    });
    return studentServiceAttachmentsModulePromise;
}

let studentServiceTicketsModulePromise = null;
let studentServiceTicketsModuleLastErrorAt = 0;

function hasStudentServiceTicketsModule() {
    return Boolean(
        window.__KIU_STUDENT_SERVICE_TICKETS_MODULE_LOADED
        && typeof window.normalizeStudentServiceTicket === 'function'
        && window.normalizeStudentServiceTicket !== normalizeStudentServiceTicket
        && typeof window.submitStudentServiceTicket === 'function'
        && window.submitStudentServiceTicket !== submitStudentServiceTicket
    );
}

function ensureStudentServiceTicketsModule() {
    if (hasStudentServiceTicketsModule()) return Promise.resolve(true);
    if (studentServiceTicketsModulePromise) return studentServiceTicketsModulePromise;
    studentServiceTicketsModulePromise = new Promise((resolve, reject) => {
        const isReady = () => hasStudentServiceTicketsModule();
        const onComplete = () => finishStudentServiceLazyModuleLoad(
            resolve,
            reject,
            isReady,
            'Student Service tickets module could not be loaded.'
        );
        let existing = document.querySelector(`script[src="${STUDENT_SERVICE_TICKETS_MODULE_URL}"]`);
        if (existing) {
            if (isStudentServiceLazyScriptExecuted(existing, isReady)) {
                onComplete();
                return;
            }
            if (shouldWaitForStudentServiceLazyScriptLoad(existing)) {
                existing.addEventListener('load', onComplete, { once: true });
                existing.addEventListener('error', () => reject(new Error('Student Service tickets module could not be loaded.')), { once: true });
                return;
            }
            if (existing.dataset.kiuLoaded === '1') {
                onComplete();
                return;
            }
            removeStaleStudentServiceLazyScript(existing, 'tickets');
            existing = null;
        }
        const script = document.createElement('script');
        script.src = STUDENT_SERVICE_TICKETS_MODULE_URL;
        script.defer = true;
        script.addEventListener('load', () => {
            script.dataset.kiuLoaded = '1';
            onComplete();
        }, { once: true });
        script.addEventListener('error', () => reject(new Error('Student Service tickets module could not be loaded.')), { once: true });
        document.head.appendChild(script);
    }).catch((error) => {
        const now = Date.now();
        if (now - studentServiceTicketsModuleLastErrorAt > 3000) {
            studentServiceTicketsModuleLastErrorAt = now;
            console.error('Student Service tickets module load failed.', error);
        }
        throw error;
    }).finally(() => {
        studentServiceTicketsModulePromise = null;
    });
    return studentServiceTicketsModulePromise;
}







function renderStudentServiceServiceModuleLoading(container, mode = 'service') {
    if (!container) return;
    const title = mode === 'student'
        ? 'Loading support lane...'
        : mode === 'responder'
            ? 'Loading responder lane...'
            : 'Loading service workspace...';
    const copy = mode === 'student'
        ? 'Preparing tickets, guidance, and the private support workspace.'
        : mode === 'responder'
            ? 'Preparing the faculty guidance lane.'
            : 'Preparing the private service workspace.';
    setStudentServiceMarkup(
        container,
        `student-service-service-module-loading:${mode}`,
        `
            <div class="student-service-empty-state student-service-empty-state-large">
                <div class="student-service-empty-title">${title}</div>
                <div class="student-service-empty-copy">${copy}</div>
            </div>
        `
    );
}

function renderStudentServiceServiceModuleLoadError(container, mode = 'service') {
    if (!container) return;
    const title = mode === 'student'
        ? 'Support lane could not load'
        : mode === 'responder'
            ? 'Responder lane could not load'
            : 'Service workspace could not load';
    const copy = mode === 'student'
        ? 'The private support module failed to load. Retry to open tickets and guidance.'
        : mode === 'responder'
            ? 'The faculty guidance module failed to load. Retry to open the responder lane.'
            : 'The service workspace module failed to load. Retry to open the private desk.';
    setStudentServiceMarkup(
        container,
        `student-service-service-module-error:${mode}`,
        `
            <div class="student-service-empty-state student-service-empty-state-large student-service-service-module-error">
                <div class="student-service-empty-title">${title}</div>
                <div class="student-service-empty-copy">${copy}</div>
                <button type="button" class="lux-primary-btn student-service-service-module-retry-btn" data-student-service-retry-service-module="${ssEscape(mode)}"><i class="fas fa-rotate-right"></i> Retry</button>
            </div>
        `
    );
}

function handleStudentServiceServiceModuleLoadFailure(container, mode = 'service') {
    renderStudentServiceServiceModuleLoadError(container, mode);
}

function ssEscape(value) {
    const text = String(value ?? '');
    if (typeof escapeHtml === 'function') return escapeHtml(text);
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function ssTextBlock(value) {
    return ssEscape(value).replace(/\n/g, '<br>');
}

function ssNowIso() {
    return new Date().toISOString();
}

function ssParseTime(value) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function ssFormatDateTime(value) {
    if (!value) return 'Just now';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return ssEscape(value);
    return date.toLocaleString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function ssFormatRelativeTime(value) {
    const timestamp = ssParseTime(value);
    if (!timestamp) return 'Just now';
    const diffMs = Date.now() - timestamp;
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return ssFormatDate(value);
}

function ssFormatDate(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return ssEscape(value);
    return date.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
    });
}

function ssClampText(value, maxLength = 220) {
    const text = String(value || '').trim().replace(/\s+/g, ' ');
    if (text.length <= maxLength) return text;
    return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
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

function getStudentServiceDefaultSearchFilter() {
    if (hasStudentServiceFiltersModule()
        && typeof window.getStudentServiceDefaultSearchFilter === 'function'
        && window.getStudentServiceDefaultSearchFilter !== getStudentServiceDefaultSearchFilter) {
        return window.getStudentServiceDefaultSearchFilter.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return null;
}

function buildStudentServiceMinimalInboxFilterLayout() {
    if (hasStudentServiceFiltersModule()
        && typeof window.buildStudentServiceMinimalInboxFilterLayout === 'function'
        && window.buildStudentServiceMinimalInboxFilterLayout !== buildStudentServiceMinimalInboxFilterLayout) {
        return window.buildStudentServiceMinimalInboxFilterLayout.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return null;
}

function isStudentServiceCustomInboxFilter(filter) {
    if (hasStudentServiceFiltersModule()
        && typeof window.isStudentServiceCustomInboxFilter === 'function'
        && window.isStudentServiceCustomInboxFilter !== isStudentServiceCustomInboxFilter) {
        return window.isStudentServiceCustomInboxFilter.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return false;
}

function buildStudentServiceDefaultInboxFilterLayout() {
    if (hasStudentServiceFiltersModule()
        && typeof window.buildStudentServiceDefaultInboxFilterLayout === 'function'
        && window.buildStudentServiceDefaultInboxFilterLayout !== buildStudentServiceDefaultInboxFilterLayout) {
        return window.buildStudentServiceDefaultInboxFilterLayout.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return null;
}

function normalizeStudentServiceInboxFilterOption(option = {}) {
    if (hasStudentServiceFiltersModule()
        && typeof window.normalizeStudentServiceInboxFilterOption === 'function'
        && window.normalizeStudentServiceInboxFilterOption !== normalizeStudentServiceInboxFilterOption) {
        return window.normalizeStudentServiceInboxFilterOption.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return null;
}

function deriveStudentServiceInboxFilterOptionValue(label) {
    if (hasStudentServiceFiltersModule()
        && typeof window.deriveStudentServiceInboxFilterOptionValue === 'function'
        && window.deriveStudentServiceInboxFilterOptionValue !== deriveStudentServiceInboxFilterOptionValue) {
        return window.deriveStudentServiceInboxFilterOptionValue.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return null;
}

function getStudentServiceEditableCustomFilterOptions(options = []) {
    if (hasStudentServiceFiltersModule()
        && typeof window.getStudentServiceEditableCustomFilterOptions === 'function'
        && window.getStudentServiceEditableCustomFilterOptions !== getStudentServiceEditableCustomFilterOptions) {
        return window.getStudentServiceEditableCustomFilterOptions.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return [];
}

function getStudentServiceCustomInboxFilterDefaultValue(filter) {
    if (hasStudentServiceFiltersModule()
        && typeof window.getStudentServiceCustomInboxFilterDefaultValue === 'function'
        && window.getStudentServiceCustomInboxFilterDefaultValue !== getStudentServiceCustomInboxFilterDefaultValue) {
        return window.getStudentServiceCustomInboxFilterDefaultValue.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return '';
}

function normalizeCustomInboxFilterOptions(filter) {
    if (hasStudentServiceFiltersModule()
        && typeof window.normalizeCustomInboxFilterOptions === 'function'
        && window.normalizeCustomInboxFilterOptions !== normalizeCustomInboxFilterOptions) {
        return window.normalizeCustomInboxFilterOptions.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return [];
}

function normalizeStudentServiceInboxFilterEditorDraftFilters(filters = []) {
    if (hasStudentServiceFiltersModule()
        && typeof window.normalizeStudentServiceInboxFilterEditorDraftFilters === 'function'
        && window.normalizeStudentServiceInboxFilterEditorDraftFilters !== normalizeStudentServiceInboxFilterEditorDraftFilters) {
        return window.normalizeStudentServiceInboxFilterEditorDraftFilters.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return null;
}

function normalizeStudentServiceInboxFilterEntry(entry = {}) {
    if (hasStudentServiceFiltersModule()
        && typeof window.normalizeStudentServiceInboxFilterEntry === 'function'
        && window.normalizeStudentServiceInboxFilterEntry !== normalizeStudentServiceInboxFilterEntry) {
        return window.normalizeStudentServiceInboxFilterEntry.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return null;
}

function normalizeStudentServiceInboxFilterLayout(layout = null) {
    if (hasStudentServiceFiltersModule()
        && typeof window.normalizeStudentServiceInboxFilterLayout === 'function'
        && window.normalizeStudentServiceInboxFilterLayout !== normalizeStudentServiceInboxFilterLayout) {
        return window.normalizeStudentServiceInboxFilterLayout.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return null;
}

function ensureStudentServiceInboxFilterLayoutHasSearch(layout) {
    if (hasStudentServiceFiltersModule()
        && typeof window.ensureStudentServiceInboxFilterLayoutHasSearch === 'function'
        && window.ensureStudentServiceInboxFilterLayoutHasSearch !== ensureStudentServiceInboxFilterLayoutHasSearch) {
        return window.ensureStudentServiceInboxFilterLayoutHasSearch.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return null;
}

function finalizeStudentServiceInboxFilterLayout(dropdownLayout) {
    if (hasStudentServiceFiltersModule()
        && typeof window.finalizeStudentServiceInboxFilterLayout === 'function'
        && window.finalizeStudentServiceInboxFilterLayout !== finalizeStudentServiceInboxFilterLayout) {
        return window.finalizeStudentServiceInboxFilterLayout.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return null;
}

function studentServiceInboxFilterLayoutHasDropdowns(layout) {
    if (hasStudentServiceFiltersModule()
        && typeof window.studentServiceInboxFilterLayoutHasDropdowns === 'function'
        && window.studentServiceInboxFilterLayoutHasDropdowns !== studentServiceInboxFilterLayoutHasDropdowns) {
        return window.studentServiceInboxFilterLayoutHasDropdowns.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return false;
}

let studentServicePersonalLayoutTeamSyncPromise = null;
let studentServicePublishedLayoutPersistPromise = null;
let studentServiceLastPersistedLayoutFingerprint = '';

function studentServiceInboxFilterLayoutFingerprint(layout) {
    if (hasStudentServiceFiltersModule()
        && typeof window.studentServiceInboxFilterLayoutFingerprint === 'function'
        && window.studentServiceInboxFilterLayoutFingerprint !== studentServiceInboxFilterLayoutFingerprint) {
        return window.studentServiceInboxFilterLayoutFingerprint.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return null;
}

async function persistStudentServiceSharedInboxFilterLayout(layout) {
    if (hasStudentServiceFiltersModule()
        && typeof window.persistStudentServiceSharedInboxFilterLayout === 'function'
        && window.persistStudentServiceSharedInboxFilterLayout !== persistStudentServiceSharedInboxFilterLayout) {
        return window.persistStudentServiceSharedInboxFilterLayout.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return null;
}

async function maybeSyncStudentServicePersonalInboxFilterLayoutToTeam() {
    if (hasStudentServiceFiltersModule()
        && typeof window.maybeSyncStudentServicePersonalInboxFilterLayoutToTeam === 'function'
        && window.maybeSyncStudentServicePersonalInboxFilterLayoutToTeam !== maybeSyncStudentServicePersonalInboxFilterLayoutToTeam) {
        return window.maybeSyncStudentServicePersonalInboxFilterLayoutToTeam.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return null;
}

function readStudentServiceInboxFilterPrefs() {
    if (hasStudentServiceFiltersModule()
        && typeof window.readStudentServiceInboxFilterPrefs === 'function'
        && window.readStudentServiceInboxFilterPrefs !== readStudentServiceInboxFilterPrefs) {
        return window.readStudentServiceInboxFilterPrefs.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return null;
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

function getStudentServiceSharedInboxFilterLayout() {
    if (hasStudentServiceFiltersModule()
        && typeof window.getStudentServiceSharedInboxFilterLayout === 'function'
        && window.getStudentServiceSharedInboxFilterLayout !== getStudentServiceSharedInboxFilterLayout) {
        return window.getStudentServiceSharedInboxFilterLayout.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return null;
}

function getStudentServicePublicInboxFilterLayout() {
    if (hasStudentServiceFiltersModule()
        && typeof window.getStudentServicePublicInboxFilterLayout === 'function'
        && window.getStudentServicePublicInboxFilterLayout !== getStudentServicePublicInboxFilterLayout) {
        return window.getStudentServicePublicInboxFilterLayout.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return null;
}

function publishStudentServiceInboxFilterLayout(layout) {
    if (hasStudentServiceFiltersModule()
        && typeof window.publishStudentServiceInboxFilterLayout === 'function'
        && window.publishStudentServiceInboxFilterLayout !== publishStudentServiceInboxFilterLayout) {
        return window.publishStudentServiceInboxFilterLayout.apply(null, arguments);
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

function getStudentServicePublishedInboxFilterLayout() {
    if (hasStudentServiceFiltersModule()
        && typeof window.getStudentServicePublishedInboxFilterLayout === 'function'
        && window.getStudentServicePublishedInboxFilterLayout !== getStudentServicePublishedInboxFilterLayout) {
        return window.getStudentServicePublishedInboxFilterLayout.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return null;
}

function publishStudentServiceInboxFilterLayoutFromEffective() {
    if (hasStudentServiceFiltersModule()
        && typeof window.publishStudentServiceInboxFilterLayoutFromEffective === 'function'
        && window.publishStudentServiceInboxFilterLayoutFromEffective !== publishStudentServiceInboxFilterLayoutFromEffective) {
        return window.publishStudentServiceInboxFilterLayoutFromEffective.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return null;
}

function getStudentServiceEffectiveInboxFilterLayout() {
    if (hasStudentServiceFiltersModule()
        && typeof window.getStudentServiceEffectiveInboxFilterLayout === 'function'
        && window.getStudentServiceEffectiveInboxFilterLayout !== getStudentServiceEffectiveInboxFilterLayout) {
        return window.getStudentServiceEffectiveInboxFilterLayout.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return null;
}

function resolveStudentServiceInboxFilterLayout(options = {}) {
    if (hasStudentServiceFiltersModule()
        && typeof window.resolveStudentServiceInboxFilterLayout === 'function'
        && window.resolveStudentServiceInboxFilterLayout !== resolveStudentServiceInboxFilterLayout) {
        return window.resolveStudentServiceInboxFilterLayout.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return null;
}

function getStudentServiceInboxFilterValue(ui, filter) {
    if (hasStudentServiceFiltersModule()
        && typeof window.getStudentServiceInboxFilterValue === 'function'
        && window.getStudentServiceInboxFilterValue !== getStudentServiceInboxFilterValue) {
        return window.getStudentServiceInboxFilterValue.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return '';
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

function getStudentServiceInboxFilterOptions(filter, visibleTickets = [], currentUser = null) {
    if (hasStudentServiceFiltersModule()
        && typeof window.getStudentServiceInboxFilterOptions === 'function'
        && window.getStudentServiceInboxFilterOptions !== getStudentServiceInboxFilterOptions) {
        return window.getStudentServiceInboxFilterOptions.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return [];
}

function ticketMatchesStudentServiceInboxFilter(ticket, filter, ui, currentUser) {
    if (hasStudentServiceFiltersModule()
        && typeof window.ticketMatchesStudentServiceInboxFilter === 'function'
        && window.ticketMatchesStudentServiceInboxFilter !== ticketMatchesStudentServiceInboxFilter) {
        return window.ticketMatchesStudentServiceInboxFilter.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return true;
}

function renderStudentServiceInboxFilterControlMarkup(filter, ui, visibleTickets, currentUser) {
    if (hasStudentServiceFiltersModule()
        && typeof window.renderStudentServiceInboxFilterControlMarkup === 'function'
        && window.renderStudentServiceInboxFilterControlMarkup !== renderStudentServiceInboxFilterControlMarkup) {
        return window.renderStudentServiceInboxFilterControlMarkup.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return '';
}

function renderStudentServiceInboxDropdownFiltersMarkup(ui, visibleTickets, currentUser, options = {}) {
    if (hasStudentServiceFiltersModule()
        && typeof window.renderStudentServiceInboxDropdownFiltersMarkup === 'function'
        && window.renderStudentServiceInboxDropdownFiltersMarkup !== renderStudentServiceInboxDropdownFiltersMarkup) {
        return window.renderStudentServiceInboxDropdownFiltersMarkup.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return '';
}

function renderStudentServiceInboxFiltersMarkup(ui, visibleTickets, currentUser, options = {}) {
    if (hasStudentServiceFiltersModule()
        && typeof window.renderStudentServiceInboxFiltersMarkup === 'function'
        && window.renderStudentServiceInboxFiltersMarkup !== renderStudentServiceInboxFiltersMarkup) {
        return window.renderStudentServiceInboxFiltersMarkup.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return '';
}

function buildStudentServiceTicketIntakeFromInboxFilters(ui) {
    if (hasStudentServiceFiltersModule()
        && typeof window.buildStudentServiceTicketIntakeFromInboxFilters === 'function'
        && window.buildStudentServiceTicketIntakeFromInboxFilters !== buildStudentServiceTicketIntakeFromInboxFilters) {
        return window.buildStudentServiceTicketIntakeFromInboxFilters.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return null;
}

function cloneStudentServiceInboxFilterLayout(layout = null) {
    if (hasStudentServiceFiltersModule()
        && typeof window.cloneStudentServiceInboxFilterLayout === 'function'
        && window.cloneStudentServiceInboxFilterLayout !== cloneStudentServiceInboxFilterLayout) {
        return window.cloneStudentServiceInboxFilterLayout.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return null;
}

function buildStudentServiceInboxFilterEditorDraft(layout = null) {
    if (hasStudentServiceFiltersModule()
        && typeof window.buildStudentServiceInboxFilterEditorDraft === 'function'
        && window.buildStudentServiceInboxFilterEditorDraft !== buildStudentServiceInboxFilterEditorDraft) {
        return window.buildStudentServiceInboxFilterEditorDraft.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return null;
}

function renderStudentServiceInboxFilterEditorRowMarkup(filter, index, total) {
    if (hasStudentServiceFiltersModule()
        && typeof window.renderStudentServiceInboxFilterEditorRowMarkup === 'function'
        && window.renderStudentServiceInboxFilterEditorRowMarkup !== renderStudentServiceInboxFilterEditorRowMarkup) {
        return window.renderStudentServiceInboxFilterEditorRowMarkup.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return '';
}

function renderStudentServiceInboxFilterEditorModalShell() {
    if (hasStudentServiceFiltersModule()
        && typeof window.renderStudentServiceInboxFilterEditorModalShell === 'function'
        && window.renderStudentServiceInboxFilterEditorModalShell !== renderStudentServiceInboxFilterEditorModalShell) {
        return window.renderStudentServiceInboxFilterEditorModalShell.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return '';
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

function isStudentServiceInboxFilterEditorOpen() {
    if (hasStudentServiceFiltersModule()
        && typeof window.isStudentServiceInboxFilterEditorOpen === 'function'
        && window.isStudentServiceInboxFilterEditorOpen !== isStudentServiceInboxFilterEditorOpen) {
        return window.isStudentServiceInboxFilterEditorOpen.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return false;
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

async function saveStudentServicePersonalInboxFilterLayoutFromEditor() {
    if (hasStudentServiceFiltersModule()
        && typeof window.saveStudentServicePersonalInboxFilterLayoutFromEditor === 'function'
        && window.saveStudentServicePersonalInboxFilterLayoutFromEditor !== saveStudentServicePersonalInboxFilterLayoutFromEditor) {
        return window.saveStudentServicePersonalInboxFilterLayoutFromEditor.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return null;
}

async function saveStudentServiceSharedInboxFilterLayoutFromEditor() {
    if (hasStudentServiceFiltersModule()
        && typeof window.saveStudentServiceSharedInboxFilterLayoutFromEditor === 'function'
        && window.saveStudentServiceSharedInboxFilterLayoutFromEditor !== saveStudentServiceSharedInboxFilterLayoutFromEditor) {
        return window.saveStudentServiceSharedInboxFilterLayoutFromEditor.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return null;
}

function resetStudentServicePersonalInboxFilterLayoutFromEditor() {
    if (hasStudentServiceFiltersModule()
        && typeof window.resetStudentServicePersonalInboxFilterLayoutFromEditor === 'function'
        && window.resetStudentServicePersonalInboxFilterLayoutFromEditor !== resetStudentServicePersonalInboxFilterLayoutFromEditor) {
        return window.resetStudentServicePersonalInboxFilterLayoutFromEditor.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return null;
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

function buildStudentServiceDefaultDraftTicket() {
    if (hasStudentServiceTicketsModule()
        && typeof window.buildStudentServiceDefaultDraftTicket === 'function'
        && window.buildStudentServiceDefaultDraftTicket !== buildStudentServiceDefaultDraftTicket) {
        return window.buildStudentServiceDefaultDraftTicket.apply(null, arguments);
    }
    ensureStudentServiceTicketsModule().catch(() => null);
    return null;
}

function buildStudentServiceDefaultDraftQuestion() {
    if (hasStudentServiceQaModule()
        && typeof window.buildStudentServiceDefaultDraftQuestion === 'function'
        && window.buildStudentServiceDefaultDraftQuestion !== buildStudentServiceDefaultDraftQuestion) {
        return window.buildStudentServiceDefaultDraftQuestion.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
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
            draftQuestion: buildStudentServiceDefaultDraftQuestion(),
            customTicketFilters: {},
            detailSections: buildStudentServiceDefaultDetailSections(),
            activeSupportArea: 'general',
            selectedGuidanceArticleId: '',
            studentHubArticleByArea: {},
            draftTicket: buildStudentServiceDefaultDraftTicket(),
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
        ui.draftTicket = buildStudentServiceDefaultDraftTicket();
    }
    if (!['get_help', 'my_tickets'].includes(ui.studentTab)) ui.studentTab = 'get_help';
    if (!['tickets', 'articles', 'qa'].includes(ui.staffPanel)) ui.staffPanel = 'tickets';
    if (!STUDENT_SERVICE_LANES.includes(ui.serviceLane)) ui.serviceLane = '';
    if (typeof ui.replyingToAnswerId !== 'string') ui.replyingToAnswerId = '';
    if (typeof ui.replyingToQuestionId !== 'string') ui.replyingToQuestionId = '';
    if (!ui.customTicketFilters || typeof ui.customTicketFilters !== 'object') ui.customTicketFilters = {};
    if (!ui.draftQuestion || typeof ui.draftQuestion !== 'object') {
        ui.draftQuestion = buildStudentServiceDefaultDraftQuestion();
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

function buildStudentServiceDefaultMacros() {
    return [
        {
            id: 'svc-macro-001',
            label: 'Ask for more details',
            category: 'General Question',
            message: 'Thank you for contacting Student Service. Please send your student ID, the exact page or process you were using, and a screenshot or short description of what happened so we can review this quickly.'
        },
        {
            id: 'svc-macro-002',
            label: 'Registration guidance',
            category: 'Registration / Enrollment',
            message: 'Thanks for the details. Please confirm your semester, course name, and group if applicable. Student Service can guide the process here, but enrollment records are updated in the academic workflow rather than directly from this workspace.'
        },
        {
            id: 'svc-macro-003',
            label: 'Finance guidance',
            category: 'Finance / Payments',
            message: 'Please share your student ID, the payment or balance amount, and the payment date if available. Student Service can document the issue and guide the next step, but finance records are not edited from this workspace.'
        },
        {
            id: 'svc-macro-004',
            label: 'Document request follow-up',
            category: 'Documents / Certificates',
            message: 'Please confirm which document you need, the language, and the deadline. Student Service can help you prepare the request and keep you updated, while official document generation stays in the formal office workflow.'
        },
        {
            id: 'svc-macro-005',
            label: 'Portal troubleshooting',
            category: 'Technical Portal Help',
            message: 'Please send the page name, your current role, your faculty, the exact button or action you clicked, and a screenshot if possible. This will help us reproduce the issue and respond faster.'
        }
    ];
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

function normalizeStudentServiceAttachmentRecord(file = {}, index = 0) {
    if (hasStudentServiceAttachmentsModule()
        && typeof window.normalizeStudentServiceAttachmentRecord === 'function'
        && window.normalizeStudentServiceAttachmentRecord !== normalizeStudentServiceAttachmentRecord) {
        return window.normalizeStudentServiceAttachmentRecord.apply(null, arguments);
    }
    ensureStudentServiceAttachmentsModule().catch(() => null);
    return null;
}

function normalizeStudentServiceAttachments(files = []) {
    if (hasStudentServiceAttachmentsModule()
        && typeof window.normalizeStudentServiceAttachments === 'function'
        && window.normalizeStudentServiceAttachments !== normalizeStudentServiceAttachments) {
        return window.normalizeStudentServiceAttachments.apply(null, arguments);
    }
    ensureStudentServiceAttachmentsModule().catch(() => null);
    return [];
}

function normalizeStudentServiceThreadEntry(entry = {}, fallback = {}) {
    if (hasStudentServiceTicketsModule()
        && typeof window.normalizeStudentServiceThreadEntry === 'function'
        && window.normalizeStudentServiceThreadEntry !== normalizeStudentServiceThreadEntry) {
        return window.normalizeStudentServiceThreadEntry.apply(null, arguments);
    }
    ensureStudentServiceTicketsModule().catch(() => null);
    return null;
}

function resolveStudentServiceStudentSemester(studentId, fallback = '') {
    const fallbackSemester = Number(fallback || 0);
    if (fallbackSemester > 0) return fallbackSemester;
    const profile = (KIU_STATE.users || []).find(user => String(user?.id || '') === String(studentId || '')) || null;
    const profileSemester = Number(profile?.semester || 0);
    return profileSemester > 0 ? profileSemester : '';
}

function normalizeStudentServiceInternalNote(note = {}, index = 0) {
    if (hasStudentServiceTicketsModule()
        && typeof window.normalizeStudentServiceInternalNote === 'function'
        && window.normalizeStudentServiceInternalNote !== normalizeStudentServiceInternalNote) {
        return window.normalizeStudentServiceInternalNote.apply(null, arguments);
    }
    ensureStudentServiceTicketsModule().catch(() => null);
    return null;
}

function normalizeStudentServiceHandoff(handoff = {}) {
    if (hasStudentServiceTicketsModule()
        && typeof window.normalizeStudentServiceHandoff === 'function'
        && window.normalizeStudentServiceHandoff !== normalizeStudentServiceHandoff) {
        return window.normalizeStudentServiceHandoff.apply(null, arguments);
    }
    ensureStudentServiceTicketsModule().catch(() => null);
    return null;
}

function normalizeStudentServiceTicket(ticket = {}, index = 0) {
    if (hasStudentServiceTicketsModule()
        && typeof window.normalizeStudentServiceTicket === 'function'
        && window.normalizeStudentServiceTicket !== normalizeStudentServiceTicket) {
        return window.normalizeStudentServiceTicket.apply(null, arguments);
    }
    ensureStudentServiceTicketsModule().catch(() => null);
    return null;
}

function resolveStudentServiceAnswerAuthorId(answer = {}) {
    if (hasStudentServiceQaModule()
        && typeof window.resolveStudentServiceAnswerAuthorId === 'function'
        && window.resolveStudentServiceAnswerAuthorId !== resolveStudentServiceAnswerAuthorId) {
        return window.resolveStudentServiceAnswerAuthorId.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
}

function normalizeStudentServiceAnswer(answer = {}, index = 0) {
    if (hasStudentServiceQaModule()
        && typeof window.normalizeStudentServiceAnswer === 'function'
        && window.normalizeStudentServiceAnswer !== normalizeStudentServiceAnswer) {
        return window.normalizeStudentServiceAnswer.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
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

function preferStudentServiceAnswerRecord(existing, incoming) {
    if (hasStudentServiceQaModule()
        && typeof window.preferStudentServiceAnswerRecord === 'function'
        && window.preferStudentServiceAnswerRecord !== preferStudentServiceAnswerRecord) {
        return window.preferStudentServiceAnswerRecord.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
}

function buildStudentServiceAnswerThread(answers = []) {
    if (hasStudentServiceQaModule()
        && typeof window.buildStudentServiceAnswerThread === 'function'
        && window.buildStudentServiceAnswerThread !== buildStudentServiceAnswerThread) {
        return window.buildStudentServiceAnswerThread.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
}

function normalizeStudentServiceQuestionStatus(status = '') {
    if (hasStudentServiceQaModule()
        && typeof window.normalizeStudentServiceQuestionStatus === 'function'
        && window.normalizeStudentServiceQuestionStatus !== normalizeStudentServiceQuestionStatus) {
        return window.normalizeStudentServiceQuestionStatus.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
}

function normalizeStudentServiceQuestion(question = {}, index = 0) {
    if (hasStudentServiceQaModule()
        && typeof window.normalizeStudentServiceQuestion === 'function'
        && window.normalizeStudentServiceQuestion !== normalizeStudentServiceQuestion) {
        return window.normalizeStudentServiceQuestion.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
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
    KIU_STATE.studentServiceQuestions = (KIU_STATE.studentServiceQuestions || [])
        .map(normalizeStudentServiceQuestion)
        .sort((a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            if (a.featured !== b.featured) return a.featured ? -1 : 1;
            return ssParseTime(b.updatedAt || b.createdAt) - ssParseTime(a.updatedAt || a.createdAt);
        });

    if (!Array.isArray(KIU_STATE.studentServiceAnswers)) KIU_STATE.studentServiceAnswers = [];
    const answerMap = new Map();
    KIU_STATE.studentServiceQuestions.forEach(question => {
        question.answers = (question.answers || []).map(normalizeStudentServiceAnswer);
        question.answers.forEach(answer => {
            answerMap.set(answer.id, preferStudentServiceAnswerRecord(answerMap.get(answer.id), answer));
        });
    });
    (KIU_STATE.studentServiceAnswers || []).map(normalizeStudentServiceAnswer).forEach(answer => {
        answerMap.set(answer.id, preferStudentServiceAnswerRecord(answerMap.get(answer.id), answer));
    });
    KIU_STATE.studentServiceAnswers = [...answerMap.values()].sort((a, b) => ssParseTime(a.createdAt) - ssParseTime(b.createdAt));
    KIU_STATE.studentServiceQuestions.forEach(question => {
        const questionId = String(question.id || '').trim();
        question.answers = [...answerMap.values()]
            .filter(answer => String(answer.questionId) === questionId)
            .sort((left, right) => ssParseTime(left.createdAt || left.updatedAt) - ssParseTime(right.createdAt || right.updatedAt));
    });

    if (!Array.isArray(KIU_STATE.studentServiceReviewQueue)) KIU_STATE.studentServiceReviewQueue = [];

    STUDENT_SERVICE_RUNTIME.storesNormalizedRevision = STUDENT_SERVICE_RUNTIME.storesRevision;
    return {
        articles: KIU_STATE.studentServiceArticles,
        tickets: KIU_STATE.studentServiceTickets,
        macros: KIU_STATE.studentServiceMacros,
        questions: KIU_STATE.studentServiceQuestions,
        answers: KIU_STATE.studentServiceAnswers,
        reviewQueue: KIU_STATE.studentServiceReviewQueue
    };
}

function resolveStudentServiceReplyShell(triggerElement = null) {
    if (hasStudentServiceQaModule()
        && typeof window.resolveStudentServiceReplyShell === 'function'
        && window.resolveStudentServiceReplyShell !== resolveStudentServiceReplyShell) {
        return window.resolveStudentServiceReplyShell.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return '';
}

function resolveStudentServiceParentAnswerId(triggerElement = null, shell = null, questionId = '') {
    if (hasStudentServiceQaModule()
        && typeof window.resolveStudentServiceParentAnswerId === 'function'
        && window.resolveStudentServiceParentAnswerId !== resolveStudentServiceParentAnswerId) {
        return window.resolveStudentServiceParentAnswerId.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
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
    if (hasStudentServiceQaModule()
        && typeof window.canCurrentUserDeleteStudentServiceAnswer === 'function'
        && window.canCurrentUserDeleteStudentServiceAnswer !== canCurrentUserDeleteStudentServiceAnswer) {
        return window.canCurrentUserDeleteStudentServiceAnswer.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return false;
}

function canCurrentUserSetStudentServiceOwnerResolution(question) {
    const currentUser = getStudentServiceCurrentUser();
    if (!currentUser?.id || !question) return false;
    if (typeof question.viewerCanSetOwnerResolution === 'boolean') return question.viewerCanSetOwnerResolution;
    return String(question.authorUserId || question.authorId || '') === String(currentUser.id || '').trim();
}

function getStudentServiceQuestionResolutionLabel(question = {}) {
    if (hasStudentServiceQaModule()
        && typeof window.getStudentServiceQuestionResolutionLabel === 'function'
        && window.getStudentServiceQuestionResolutionLabel !== getStudentServiceQuestionResolutionLabel) {
        return window.getStudentServiceQuestionResolutionLabel.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
}

function renderStudentServiceOwnerResolutionPillMarkup(question = {}) {
    const ownerStatus = String(question.ownerResolutionStatus || '').trim().toLowerCase();
    if (ownerStatus !== 'answered' && ownerStatus !== 'unanswered') return '';
    const resolution = getStudentServiceQuestionResolutionLabel(question);
    return `<span class="student-service-pill student-service-pill--${ssEscape(resolution.tone)}"><i class="fas ${ssEscape(resolution.icon)}" aria-hidden="true"></i> ${ssEscape(resolution.label)}</span>`;
}

function canCurrentUserDeleteStudentServiceQuestion(question) {
    if (hasStudentServiceQaModule()
        && typeof window.canCurrentUserDeleteStudentServiceQuestion === 'function'
        && window.canCurrentUserDeleteStudentServiceQuestion !== canCurrentUserDeleteStudentServiceQuestion) {
        return window.canCurrentUserDeleteStudentServiceQuestion.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return false;
}

function buildStudentServiceAnswerCardOptions(question) {
    if (hasStudentServiceQaModule()
        && typeof window.buildStudentServiceAnswerCardOptions === 'function'
        && window.buildStudentServiceAnswerCardOptions !== buildStudentServiceAnswerCardOptions) {
        return window.buildStudentServiceAnswerCardOptions.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
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

function findNewestStudentServiceTopLevelAnswer(question) {
    if (hasStudentServiceQaModule()
        && typeof window.findNewestStudentServiceTopLevelAnswer === 'function'
        && window.findNewestStudentServiceTopLevelAnswer !== findNewestStudentServiceTopLevelAnswer) {
        return window.findNewestStudentServiceTopLevelAnswer.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
}

function appendStudentServiceTopLevelAnswerNode(questionId) {
    if (hasStudentServiceQaModule()
        && typeof window.appendStudentServiceTopLevelAnswerNode === 'function'
        && window.appendStudentServiceTopLevelAnswerNode !== appendStudentServiceTopLevelAnswerNode) {
        return window.appendStudentServiceTopLevelAnswerNode.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
}

function collectStudentServiceAnswerBranchIds(questionId, answerId, answers = []) {
    if (hasStudentServiceQaModule()
        && typeof window.collectStudentServiceAnswerBranchIds === 'function'
        && window.collectStudentServiceAnswerBranchIds !== collectStudentServiceAnswerBranchIds) {
        return window.collectStudentServiceAnswerBranchIds.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
}

function removeStudentServiceAnswersFromSnapshot(questionId, removedAnswerIds = new Set()) {
    if (hasStudentServiceQaModule()
        && typeof window.removeStudentServiceAnswersFromSnapshot === 'function'
        && window.removeStudentServiceAnswersFromSnapshot !== removeStudentServiceAnswersFromSnapshot) {
        return window.removeStudentServiceAnswersFromSnapshot.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
}

function mergeStudentServiceQuestionSnapshot(question = {}) {
    if (hasStudentServiceQaModule()
        && typeof window.mergeStudentServiceQuestionSnapshot === 'function'
        && window.mergeStudentServiceQuestionSnapshot !== mergeStudentServiceQuestionSnapshot) {
        return window.mergeStudentServiceQuestionSnapshot.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
}

function removeStudentServiceQuestionFromSnapshot(questionId) {
    if (hasStudentServiceQaModule()
        && typeof window.removeStudentServiceQuestionFromSnapshot === 'function'
        && window.removeStudentServiceQuestionFromSnapshot !== removeStudentServiceQuestionFromSnapshot) {
        return window.removeStudentServiceQuestionFromSnapshot.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
}

function removeStudentServiceQuestionCard(questionId) {
    if (hasStudentServiceQaModule()
        && typeof window.removeStudentServiceQuestionCard === 'function'
        && window.removeStudentServiceQuestionCard !== removeStudentServiceQuestionCard) {
        return window.removeStudentServiceQuestionCard.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
}

function applyStudentServiceBootstrap(payload = {}) {
    const state = payload.studentService || payload || {};
    const previousLayoutFingerprint = JSON.stringify(KIU_STATE.studentServiceInboxFilterLayout?.filters || []);
    const previousArticleFingerprint = buildStudentServiceArticleFingerprint(KIU_STATE.studentServiceArticles || []);
    invalidateStudentServiceStores();
    if (Array.isArray(state.articles)) KIU_STATE.studentServiceArticles = state.articles.slice();
    if (Array.isArray(state.tickets)) KIU_STATE.studentServiceTickets = state.tickets.slice();
    if (Array.isArray(state.macros)) KIU_STATE.studentServiceMacros = state.macros.slice();
    if (Array.isArray(state.questions)) KIU_STATE.studentServiceQuestions = state.questions.slice();
    if (Array.isArray(state.answers)) KIU_STATE.studentServiceAnswers = state.answers.slice();
    if (Array.isArray(state.reviewQueue)) KIU_STATE.studentServiceReviewQueue = state.reviewQueue.slice();
    KIU_STATE.studentServicePermissions = state.permissions || KIU_STATE.studentServicePermissions || {};
    KIU_STATE.studentServiceAnalytics = state.analytics || KIU_STATE.studentServiceAnalytics || {};
    if (state.inboxFilterLayout) {
        const normalized = normalizeStudentServiceInboxFilterLayout(state.inboxFilterLayout);
        KIU_STATE.studentServiceInboxFilterLayout = normalized;
        publishStudentServiceInboxFilterLayout(normalized);
        pruneStudentServiceCustomTicketFilters(normalized);
        const nextLayoutFingerprint = JSON.stringify(normalized?.filters || []);
        if (previousLayoutFingerprint !== nextLayoutFingerprint) {
            invalidateStudentServiceRenderSignature();
        }
    }
    ensureStudentServiceStores();
    const nextArticleFingerprint = buildStudentServiceArticleFingerprint(KIU_STATE.studentServiceArticles || []);
    if (previousArticleFingerprint !== nextArticleFingerprint) {
        const ui = ensureStudentServiceUiState();
        ui.studentHubArticleByArea = {};
        invalidateStudentServiceRenderSignature();
    } else {
        pruneStudentHubArticleSelections(KIU_STATE.studentServiceArticles);
    }
}

async function fetchStudentServiceBootstrap(force = false) {
    if (STUDENT_SERVICE_RUNTIME.bootstrapPromise && !force) return STUDENT_SERVICE_RUNTIME.bootstrapPromise;
    if (typeof kiuPortalFetch !== 'function') return null;
    STUDENT_SERVICE_RUNTIME.bootstrapPromise = (async () => {
        const payload = await kiuPortalFetch(studentServiceApiPath(STUDENT_SERVICE_API_PATHS.bootstrap()));
        STUDENT_SERVICE_RUNTIME.backendManifestVersion = String(payload?.apiManifestVersion || '').trim();
        if (!STUDENT_SERVICE_RUNTIME.backendManifestVersion) {
            try {
                const health = await kiuPortalFetch('/health');
                STUDENT_SERVICE_RUNTIME.backendManifestVersion = String(health?.studentServiceApiManifestVersion || '').trim();
            } catch (error) {}
        }
        ensureStudentServiceBackendContract(STUDENT_SERVICE_RUNTIME.backendManifestVersion);
        if (payload?.studentService) {
            applyStudentServiceBootstrap(payload.studentService);
            STUDENT_SERVICE_RUNTIME.loaded = true;
            STUDENT_SERVICE_RUNTIME.loadFailed = false;
            STUDENT_SERVICE_RUNTIME.lastLoadedAt = Date.now();
        }
        return payload?.studentService || null;
    })().catch(error => {
        STUDENT_SERVICE_RUNTIME.loadFailed = true;
        throw error;
    }).finally(() => {
        STUDENT_SERVICE_RUNTIME.bootstrapPromise = null;
    });
    return STUDENT_SERVICE_RUNTIME.bootstrapPromise;
}

function shouldDeferStudentServiceStudentHubUntilBootstrap(role, ui) {
    return role === USER_ROLES.STUDENT
        && getStudentServiceLane() === 'service'
        && ui.studentTab === 'get_help'
        && shouldBootstrapStudentServiceWorkspace()
        && !STUDENT_SERVICE_RUNTIME.loaded
        && !STUDENT_SERVICE_RUNTIME.loadFailed;
}

function renderStudentServiceBootstrapLoadingShell() {
    return `
        <div class="student-service-loading-state student-service-empty-state-large">
            <i class="fas fa-spinner fa-spin student-service-loading-icon"></i>
            Loading guidance and support topics...
        </div>
    `;
}

function renderStudentServiceBootstrapErrorBanner() {
    const message = String(STUDENT_SERVICE_RUNTIME.bootstrapErrorMessage || '').trim()
        || 'Student Service data could not load. Check your connection and retry.';
    return `
        <div class="student-service-bootstrap-error-banner" role="alert" aria-live="polite">
            <div class="student-service-bootstrap-error-copy">
                <div class="student-service-bootstrap-error-title">Student Service data could not load</div>
                <div class="student-service-bootstrap-error-message">${ssEscape(message)}</div>
            </div>
            <button type="button" class="lux-primary-btn student-service-bootstrap-retry-btn" data-student-service-retry-bootstrap="1"><i class="fas fa-rotate-right"></i> Retry</button>
        </div>
    `;
}

function scheduleStudentServiceBootstrap(force = false) {
    fetchStudentServiceBootstrap(force)
        .then(async () => {
            STUDENT_SERVICE_RUNTIME.bootstrapErrorMessage = '';
            await maybeSyncStudentServicePersonalInboxFilterLayoutToTeam();
            if (isStudentServiceQaBodyStale()) {
                rerenderStudentServicePageAfterModuleLoad();
                return;
            }
            renderStudentServicePage();
        })
        .catch((error) => {
            STUDENT_SERVICE_RUNTIME.bootstrapErrorMessage = formatStudentServiceApiError(error, studentServiceApiPath(STUDENT_SERVICE_API_PATHS.bootstrap()));
            console.error('Student Service bootstrap failed.', error);
            renderStudentServicePage();
        });
}

function getStudentServiceCurrentUser() {
    return getCurrentUser() || currentUser || null;
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

function buildStudentServiceArticleFingerprint(articles = []) {
    return (articles || [])
        .map(article => `${article.id}:${article.updatedAt || article.createdAt || ''}`)
        .sort()
        .join(',');
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
    if (hasStudentServiceQaModule()
        && typeof window.buildStudentServiceQaContentFingerprint === 'function'
        && window.buildStudentServiceQaContentFingerprint !== buildStudentServiceQaContentFingerprint) {
        return window.buildStudentServiceQaContentFingerprint.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
}

function buildStudentServiceQaFeedCacheKey(ui, filteredQuestions) {
    if (hasStudentServiceQaModule()
        && typeof window.buildStudentServiceQaFeedCacheKey === 'function'
        && window.buildStudentServiceQaFeedCacheKey !== buildStudentServiceQaFeedCacheKey) {
        return window.buildStudentServiceQaFeedCacheKey.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
}

function getStudentServiceVisibleQuestions() {
    if (hasStudentServiceQaModule()
        && typeof window.getStudentServiceVisibleQuestions === 'function'
        && window.getStudentServiceVisibleQuestions !== getStudentServiceVisibleQuestions) {
        return window.getStudentServiceVisibleQuestions.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return [];
}

function getStudentServiceQuestionAuthorLabel(question) {
    if (hasStudentServiceQaModule()
        && typeof window.getStudentServiceQuestionAuthorLabel === 'function'
        && window.getStudentServiceQuestionAuthorLabel !== getStudentServiceQuestionAuthorLabel) {
        return window.getStudentServiceQuestionAuthorLabel.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
}

function getStudentServiceSelectedQuestion(questions) {
    if (hasStudentServiceQaModule()
        && typeof window.getStudentServiceSelectedQuestion === 'function'
        && window.getStudentServiceSelectedQuestion !== getStudentServiceSelectedQuestion) {
        return window.getStudentServiceSelectedQuestion.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
}

function getStudentServiceOpenQuestion(questions) {
    if (hasStudentServiceQaModule()
        && typeof window.getStudentServiceOpenQuestion === 'function'
        && window.getStudentServiceOpenQuestion !== getStudentServiceOpenQuestion) {
        return window.getStudentServiceOpenQuestion.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
}

function getStudentServiceFilteredQuestions(questions) {
    if (hasStudentServiceQaModule()
        && typeof window.getStudentServiceFilteredQuestions === 'function'
        && window.getStudentServiceFilteredQuestions !== getStudentServiceFilteredQuestions) {
        return window.getStudentServiceFilteredQuestions.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return [];
}

function getStudentServiceSimilarQuestions(draft = {}) {
    if (hasStudentServiceQaModule()
        && typeof window.getStudentServiceSimilarQuestions === 'function'
        && window.getStudentServiceSimilarQuestions !== getStudentServiceSimilarQuestions) {
        return window.getStudentServiceSimilarQuestions.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return [];
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
    if (hasStudentServiceTicketsModule()
        && typeof window.getStudentServiceDraftTicket === 'function'
        && window.getStudentServiceDraftTicket !== getStudentServiceDraftTicket) {
        return window.getStudentServiceDraftTicket.apply(null, arguments);
    }
    ensureStudentServiceTicketsModule().catch(() => null);
    return null;
}

function syncStudentServiceDraftTicketFromDom() {
    if (hasStudentServiceTicketsModule()
        && typeof window.syncStudentServiceDraftTicketFromDom === 'function'
        && window.syncStudentServiceDraftTicketFromDom !== syncStudentServiceDraftTicketFromDom) {
        return window.syncStudentServiceDraftTicketFromDom.apply(null, arguments);
    }
    ensureStudentServiceTicketsModule().catch(() => null);
    return;
}

function setStudentServiceDraftTicketField(field, value, rerender = false) {
    if (hasStudentServiceTicketsModule()
        && typeof window.setStudentServiceDraftTicketField === 'function'
        && window.setStudentServiceDraftTicketField !== setStudentServiceDraftTicketField) {
        return window.setStudentServiceDraftTicketField.apply(null, arguments);
    }
    ensureStudentServiceTicketsModule().catch(() => null);
    return;
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

function normalizeStudentServiceRegistrationCourseIds(registrationValue) {
    if (typeof normalizeStudentRegistrationCourseIds === 'function') {
        return normalizeStudentRegistrationCourseIds(registrationValue);
    }
    const collected = [];
    const addCourse = value => {
        if (value == null) return;
        if (typeof value === 'string' || typeof value === 'number') {
            const text = String(value).trim();
            if (text) collected.push(text);
            return;
        }
        if (Array.isArray(value)) {
            value.forEach(addCourse);
            return;
        }
        if (typeof value === 'object') {
            const directId = value.courseId || value.sourceCourseId || value.id || value.n;
            if (directId) addCourse(directId);
            [
                value.courseIds,
                value.courseIDs,
                value.courses,
                value.selectedCourses,
                value.selectedSubjects,
                value.registeredCourses,
                value.registeredSubjects,
                value.subjects,
                value.items
            ].forEach(addCourse);
        }
    };
    addCourse(registrationValue);
    return [...new Set(collected.map(courseId => String(courseId).trim()).filter(Boolean))];
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
    if (hasStudentServiceTicketsModule()
        && typeof window.getStudentServiceTicketSourceLabel === 'function'
        && window.getStudentServiceTicketSourceLabel !== getStudentServiceTicketSourceLabel) {
        return window.getStudentServiceTicketSourceLabel.apply(null, arguments);
    }
    ensureStudentServiceTicketsModule().catch(() => null);
    return null;
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
    if (hasStudentServiceTicketsModule()
        && typeof window.getStudentServiceVisibleTickets === 'function'
        && window.getStudentServiceVisibleTickets !== getStudentServiceVisibleTickets) {
        return window.getStudentServiceVisibleTickets.apply(null, arguments);
    }
    ensureStudentServiceTicketsModule().catch(() => null);
    return [];
}

function sortStudentServiceTicketsForStaff(tickets = []) {
    if (hasStudentServiceTicketsModule()
        && typeof window.sortStudentServiceTicketsForStaff === 'function'
        && window.sortStudentServiceTicketsForStaff !== sortStudentServiceTicketsForStaff) {
        return window.sortStudentServiceTicketsForStaff.apply(null, arguments);
    }
    ensureStudentServiceTicketsModule().catch(() => null);
    return null;
}

function ensureSelectedStudentServiceTicket(tickets) {
    if (hasStudentServiceTicketsModule()
        && typeof window.ensureSelectedStudentServiceTicket === 'function'
        && window.ensureSelectedStudentServiceTicket !== ensureSelectedStudentServiceTicket) {
        return window.ensureSelectedStudentServiceTicket.apply(null, arguments);
    }
    ensureStudentServiceTicketsModule().catch(() => null);
    return null;
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
    if (hasStudentServiceFiltersModule()
        && typeof window.buildStudentServiceStudentInboxFilterLayout === 'function'
        && window.buildStudentServiceStudentInboxFilterLayout !== buildStudentServiceStudentInboxFilterLayout) {
        return window.buildStudentServiceStudentInboxFilterLayout.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return null;
}

function renderStudentServiceStudentInboxFiltersMarkup(ui, visibleTickets, currentUser) {
    if (hasStudentServiceFiltersModule()
        && typeof window.renderStudentServiceStudentInboxFiltersMarkup === 'function'
        && window.renderStudentServiceStudentInboxFiltersMarkup !== renderStudentServiceStudentInboxFiltersMarkup) {
        return window.renderStudentServiceStudentInboxFiltersMarkup.apply(null, arguments);
    }
    ensureStudentServiceFiltersModule().catch(() => null);
    return '';
}

function getStudentServiceFilteredStudentTickets(tickets, currentUser, options = {}) {
    const ui = ensureStudentServiceUiState();
    const layout = options.layout || buildStudentServiceStudentInboxFilterLayout();
    const filters = (layout.filters || []).filter(filter => filter.enabled);
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
    if (hasStudentServiceTicketsModule()
        && typeof window.findStudentServiceArticleForTicket === 'function'
        && window.findStudentServiceArticleForTicket !== findStudentServiceArticleForTicket) {
        return window.findStudentServiceArticleForTicket.apply(null, arguments);
    }
    ensureStudentServiceTicketsModule().catch(() => null);
    return null;
}

function getStudentServiceContextForTicket(ticket, articles) {
    if (hasStudentServiceTicketsModule()
        && typeof window.getStudentServiceContextForTicket === 'function'
        && window.getStudentServiceContextForTicket !== getStudentServiceContextForTicket) {
        return window.getStudentServiceContextForTicket.apply(null, arguments);
    }
    ensureStudentServiceTicketsModule().catch(() => null);
    return null;
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
    if (hasStudentServiceQaModule()
        && typeof window.relayoutStudentServiceCommentTrunks === 'function'
        && window.relayoutStudentServiceCommentTrunks !== relayoutStudentServiceCommentTrunks) {
        return window.relayoutStudentServiceCommentTrunks.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
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
    if (hasStudentServiceQaModule()
        && typeof window.getStudentServiceQuestionById === 'function'
        && window.getStudentServiceQuestionById !== getStudentServiceQuestionById) {
        return window.getStudentServiceQuestionById.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
}

function findStudentServiceAnswerRecord(question, answerId) {
    if (hasStudentServiceQaModule()
        && typeof window.findStudentServiceAnswerRecord === 'function'
        && window.findStudentServiceAnswerRecord !== findStudentServiceAnswerRecord) {
        return window.findStudentServiceAnswerRecord.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
}

function studentServiceAnswerArticleEl(answerId) {
    if (hasStudentServiceQaModule()
        && typeof window.studentServiceAnswerArticleEl === 'function'
        && window.studentServiceAnswerArticleEl !== studentServiceAnswerArticleEl) {
        return window.studentServiceAnswerArticleEl.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
}

function getStudentServiceQuestionCardElement(questionId) {
    if (hasStudentServiceQaModule()
        && typeof window.getStudentServiceQuestionCardElement === 'function'
        && window.getStudentServiceQuestionCardElement !== getStudentServiceQuestionCardElement) {
        return window.getStudentServiceQuestionCardElement.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
}

function getStudentServiceQuestionThreadMode() {
    if (hasStudentServiceQaModule()
        && typeof window.getStudentServiceQuestionThreadMode === 'function'
        && window.getStudentServiceQuestionThreadMode !== getStudentServiceQuestionThreadMode) {
        return window.getStudentServiceQuestionThreadMode.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
}

function isStudentServiceQuestionThreadModalOpen() {
    if (hasStudentServiceQaModule()
        && typeof window.isStudentServiceQuestionThreadModalOpen === 'function'
        && window.isStudentServiceQuestionThreadModalOpen !== isStudentServiceQuestionThreadModalOpen) {
        return window.isStudentServiceQuestionThreadModalOpen.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return false;
}

function getStudentServiceQuestionThreadModalBody() {
    if (hasStudentServiceQaModule()
        && typeof window.getStudentServiceQuestionThreadModalBody === 'function'
        && window.getStudentServiceQuestionThreadModalBody !== getStudentServiceQuestionThreadModalBody) {
        return window.getStudentServiceQuestionThreadModalBody.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
}

function getStudentServiceQuestionThreadHost(questionId) {
    if (hasStudentServiceQaModule()
        && typeof window.getStudentServiceQuestionThreadHost === 'function'
        && window.getStudentServiceQuestionThreadHost !== getStudentServiceQuestionThreadHost) {
        return window.getStudentServiceQuestionThreadHost.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
}

function updateStudentServiceQuestionCardToggleUi(card) {
    if (hasStudentServiceQaModule()
        && typeof window.updateStudentServiceQuestionCardToggleUi === 'function'
        && window.updateStudentServiceQuestionCardToggleUi !== updateStudentServiceQuestionCardToggleUi) {
        return window.updateStudentServiceQuestionCardToggleUi.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
}

function clearLegacyStudentServiceOpenQuestionCards() {
    if (hasStudentServiceQaModule()
        && typeof window.clearLegacyStudentServiceOpenQuestionCards === 'function'
        && window.clearLegacyStudentServiceOpenQuestionCards !== clearLegacyStudentServiceOpenQuestionCards) {
        return window.clearLegacyStudentServiceOpenQuestionCards.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
}

function updateStudentServiceQuestionThreadActiveCards(questionId) {
    if (hasStudentServiceQaModule()
        && typeof window.updateStudentServiceQuestionThreadActiveCards === 'function'
        && window.updateStudentServiceQuestionThreadActiveCards !== updateStudentServiceQuestionThreadActiveCards) {
        return window.updateStudentServiceQuestionThreadActiveCards.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
}

function closeStudentServiceQuestionThreadModal() {
    if (hasStudentServiceQaModule()
        && typeof window.closeStudentServiceQuestionThreadModal === 'function'
        && window.closeStudentServiceQuestionThreadModal !== closeStudentServiceQuestionThreadModal) {
        return window.closeStudentServiceQuestionThreadModal.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
}

function getStudentServiceTicketThreadMode() {
    if (hasStudentServiceTicketsModule()
        && typeof window.getStudentServiceTicketThreadMode === 'function'
        && window.getStudentServiceTicketThreadMode !== getStudentServiceTicketThreadMode) {
        return window.getStudentServiceTicketThreadMode.apply(null, arguments);
    }
    ensureStudentServiceTicketsModule().catch(() => null);
    return null;
}

function isStudentServiceTicketThreadModalOpen() {
    if (hasStudentServiceTicketsModule()
        && typeof window.isStudentServiceTicketThreadModalOpen === 'function'
        && window.isStudentServiceTicketThreadModalOpen !== isStudentServiceTicketThreadModalOpen) {
        return window.isStudentServiceTicketThreadModalOpen.apply(null, arguments);
    }
    ensureStudentServiceTicketsModule().catch(() => null);
    return false;
}

function getStudentServiceTicketById(ticketId) {
    if (hasStudentServiceTicketsModule()
        && typeof window.getStudentServiceTicketById === 'function'
        && window.getStudentServiceTicketById !== getStudentServiceTicketById) {
        return window.getStudentServiceTicketById.apply(null, arguments);
    }
    ensureStudentServiceTicketsModule().catch(() => null);
    return null;
}

function scrollStudentServiceTicketChatLog(scope = null) {
    if (hasStudentServiceTicketsModule()
        && typeof window.scrollStudentServiceTicketChatLog === 'function'
        && window.scrollStudentServiceTicketChatLog !== scrollStudentServiceTicketChatLog) {
        return window.scrollStudentServiceTicketChatLog.apply(null, arguments);
    }
    ensureStudentServiceTicketsModule().catch(() => null);
    return;
}

function renderStudentServiceTicketThreadModalShell(ticket, options = {}) {
    if (hasStudentServiceTicketsModule()
        && typeof window.renderStudentServiceTicketThreadModalShell === 'function'
        && window.renderStudentServiceTicketThreadModalShell !== renderStudentServiceTicketThreadModalShell) {
        return window.renderStudentServiceTicketThreadModalShell.apply(null, arguments);
    }
    ensureStudentServiceTicketsModule().catch(() => null);
    return '';
}

function closeStudentServiceTicketThreadModal() {
    if (hasStudentServiceTicketsModule()
        && typeof window.closeStudentServiceTicketThreadModal === 'function'
        && window.closeStudentServiceTicketThreadModal !== closeStudentServiceTicketThreadModal) {
        return window.closeStudentServiceTicketThreadModal.apply(null, arguments);
    }
    ensureStudentServiceTicketsModule().catch(() => null);
    return;
}

function mountStudentServiceTicketThreadModal(ticketId) {
    if (hasStudentServiceTicketsModule()
        && typeof window.mountStudentServiceTicketThreadModal === 'function'
        && window.mountStudentServiceTicketThreadModal !== mountStudentServiceTicketThreadModal) {
        return window.mountStudentServiceTicketThreadModal.apply(null, arguments);
    }
    ensureStudentServiceTicketsModule().catch(() => null);
    return;
}

function remountStudentServiceTicketThreadModal() {
    if (hasStudentServiceTicketsModule()
        && typeof window.remountStudentServiceTicketThreadModal === 'function'
        && window.remountStudentServiceTicketThreadModal !== remountStudentServiceTicketThreadModal) {
        return window.remountStudentServiceTicketThreadModal.apply(null, arguments);
    }
    ensureStudentServiceTicketsModule().catch(() => null);
    return;
}

function getStudentServiceTicketReplyTextareaId(role = '') {
    if (hasStudentServiceTicketsModule()
        && typeof window.getStudentServiceTicketReplyTextareaId === 'function'
        && window.getStudentServiceTicketReplyTextareaId !== getStudentServiceTicketReplyTextareaId) {
        return window.getStudentServiceTicketReplyTextareaId.apply(null, arguments);
    }
    ensureStudentServiceTicketsModule().catch(() => null);
    return null;
}

function getStudentServiceInternalNoteTextareaId() {
    if (hasStudentServiceTicketsModule()
        && typeof window.getStudentServiceInternalNoteTextareaId === 'function'
        && window.getStudentServiceInternalNoteTextareaId !== getStudentServiceInternalNoteTextareaId) {
        return window.getStudentServiceInternalNoteTextareaId.apply(null, arguments);
    }
    ensureStudentServiceTicketsModule().catch(() => null);
    return null;
}

function getStudentServiceInternalNoteComposerId() {
    if (hasStudentServiceTicketsModule()
        && typeof window.getStudentServiceInternalNoteComposerId === 'function'
        && window.getStudentServiceInternalNoteComposerId !== getStudentServiceInternalNoteComposerId) {
        return window.getStudentServiceInternalNoteComposerId.apply(null, arguments);
    }
    ensureStudentServiceTicketsModule().catch(() => null);
    return null;
}

function renderStudentServiceQuestionThreadModalShell(question, options = {}) {
    if (hasStudentServiceQaModule()
        && typeof window.renderStudentServiceQuestionThreadModalShell === 'function'
        && window.renderStudentServiceQuestionThreadModalShell !== renderStudentServiceQuestionThreadModalShell) {
        return window.renderStudentServiceQuestionThreadModalShell.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return '';
}

function mountStudentServiceQuestionThreadModal(questionId) {
    if (hasStudentServiceQaModule()
        && typeof window.mountStudentServiceQuestionThreadModal === 'function'
        && window.mountStudentServiceQuestionThreadModal !== mountStudentServiceQuestionThreadModal) {
        return window.mountStudentServiceQuestionThreadModal.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
}

function remountStudentServiceQuestionThreadModal() {
    if (hasStudentServiceQaModule()
        && typeof window.remountStudentServiceQuestionThreadModal === 'function'
        && window.remountStudentServiceQuestionThreadModal !== remountStudentServiceQuestionThreadModal) {
        return window.remountStudentServiceQuestionThreadModal.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
}

function setStudentServiceOpenQuestionId(questionId) {
    if (hasStudentServiceQaModule()
        && typeof window.setStudentServiceOpenQuestionId === 'function'
        && window.setStudentServiceOpenQuestionId !== setStudentServiceOpenQuestionId) {
        return window.setStudentServiceOpenQuestionId.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
}

function restoreStudentServiceOpenQuestionFromUi() {
    if (hasStudentServiceQaModule()
        && typeof window.restoreStudentServiceOpenQuestionFromUi === 'function'
        && window.restoreStudentServiceOpenQuestionFromUi !== restoreStudentServiceOpenQuestionFromUi) {
        return window.restoreStudentServiceOpenQuestionFromUi.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
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
    if (hasStudentServiceQaModule()
        && typeof window.patchStudentServiceQuestionCardStats === 'function'
        && window.patchStudentServiceQuestionCardStats !== patchStudentServiceQuestionCardStats) {
        return window.patchStudentServiceQuestionCardStats.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
}

function isStudentServiceQuestionHelpfulVoted(question = {}) {
    if (hasStudentServiceQaModule()
        && typeof window.isStudentServiceQuestionHelpfulVoted === 'function'
        && window.isStudentServiceQuestionHelpfulVoted !== isStudentServiceQuestionHelpfulVoted) {
        return window.isStudentServiceQuestionHelpfulVoted.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return false;
}

function updateStudentServiceOwnerResolutionButtons(root, question = {}) {
    if (!root) return;
    const ownerStatus = String(question.ownerResolutionStatus || '').trim().toLowerCase();
    root.querySelectorAll('[data-student-service-owner-resolution]').forEach(button => {
        const value = String(button.dataset.studentServiceOwnerResolution || '').trim().toLowerCase();
        const isActive = ownerStatus === value;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        const icon = button.querySelector('i');
        if (icon && value === 'answered') icon.className = `fas ${isActive ? 'fa-check-circle' : 'far fa-circle'}`;
        if (icon && value === 'unanswered') icon.className = `fas ${isActive ? 'fa-hourglass-half' : 'far fa-hourglass'}`;
    });
}

function renderStudentServiceOwnerResolutionButtonMarkup(question, skipLuxButton = 'data-lux-skip-modern-button="true"') {
    if (!canCurrentUserSetStudentServiceOwnerResolution(question)) return '';
    const ownerStatus = String(question.ownerResolutionStatus || '').trim().toLowerCase();
    const answeredActive = ownerStatus === 'answered';
    const unansweredActive = ownerStatus === 'unanswered';
    return `
        <button type="button" class="lux-secondary-btn student-service-qa-detail-action-btn student-service-qa-detail-action-btn--owner-resolution student-service-qa-owner-resolution-btn${answeredActive ? ' is-active' : ''}" ${skipLuxButton} data-student-service-question-id="${ssEscape(question.id)}" data-student-service-owner-resolution="answered" aria-pressed="${answeredActive ? 'true' : 'false'}"><i class="${answeredActive ? 'fas fa-check-circle' : 'far fa-circle'}" aria-hidden="true"></i><span>Mark as answered</span></button>
        <button type="button" class="lux-secondary-btn student-service-qa-detail-action-btn student-service-qa-detail-action-btn--owner-resolution student-service-qa-owner-resolution-btn${unansweredActive ? ' is-active' : ''}" ${skipLuxButton} data-student-service-question-id="${ssEscape(question.id)}" data-student-service-owner-resolution="unanswered" aria-pressed="${unansweredActive ? 'true' : 'false'}"><i class="${unansweredActive ? 'fas fa-hourglass-half' : 'far fa-hourglass'}" aria-hidden="true"></i><span>Still unanswered</span></button>
    `;
}

function renderStudentServiceQuestionHelpfulButtonMarkup(question, skipLuxButton = 'data-lux-skip-modern-button="true"') {
    if (hasStudentServiceQaModule()
        && typeof window.renderStudentServiceQuestionHelpfulButtonMarkup === 'function'
        && window.renderStudentServiceQuestionHelpfulButtonMarkup !== renderStudentServiceQuestionHelpfulButtonMarkup) {
        return window.renderStudentServiceQuestionHelpfulButtonMarkup.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return '';
}

function updateStudentServiceQuestionHelpfulButton(button, question = {}) {
    if (hasStudentServiceQaModule()
        && typeof window.updateStudentServiceQuestionHelpfulButton === 'function'
        && window.updateStudentServiceQuestionHelpfulButton !== updateStudentServiceQuestionHelpfulButton) {
        return window.updateStudentServiceQuestionHelpfulButton.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
}

function triggerStudentServiceHelpfulAnimation(button, voted = true) {
    if (hasStudentServiceQaModule()
        && typeof window.triggerStudentServiceHelpfulAnimation === 'function'
        && window.triggerStudentServiceHelpfulAnimation !== triggerStudentServiceHelpfulAnimation) {
        return window.triggerStudentServiceHelpfulAnimation.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
}

function flashStudentServiceActionButton(button, outcome = 'acting') {
    if (!button) return;
    button.classList.remove('is-acting', 'is-success', 'is-error');
    void button.offsetWidth;
    if (outcome === 'success') button.classList.add('is-success');
    else if (outcome === 'error') button.classList.add('is-error');
    else button.classList.add('is-acting');
    const ms = outcome === 'error' ? 420 : 520;
    window.setTimeout(() => button.classList.remove('is-acting', 'is-success', 'is-error'), ms);
}

function setStudentServiceActionButtonPending(button, pending = true) {
    if (!button) return;
    button.classList.toggle('is-pending', pending);
    if (pending) button.setAttribute('aria-busy', 'true');
    else button.removeAttribute('aria-busy');
}

function patchStudentServiceQuestionHelpfulUi(questionId, options = {}) {
    if (hasStudentServiceQaModule()
        && typeof window.patchStudentServiceQuestionHelpfulUi === 'function'
        && window.patchStudentServiceQuestionHelpfulUi !== patchStudentServiceQuestionHelpfulUi) {
        return window.patchStudentServiceQuestionHelpfulUi.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
}

function isStudentServiceAnswerHelpfulVoted(answer = {}) {
    if (hasStudentServiceQaModule()
        && typeof window.isStudentServiceAnswerHelpfulVoted === 'function'
        && window.isStudentServiceAnswerHelpfulVoted !== isStudentServiceAnswerHelpfulVoted) {
        return window.isStudentServiceAnswerHelpfulVoted.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return false;
}

function renderStudentServiceAnswerHelpfulButtonMarkup(question, answer, skipLuxButton = 'data-lux-skip-modern-button="true"') {
    if (hasStudentServiceQaModule()
        && typeof window.renderStudentServiceAnswerHelpfulButtonMarkup === 'function'
        && window.renderStudentServiceAnswerHelpfulButtonMarkup !== renderStudentServiceAnswerHelpfulButtonMarkup) {
        return window.renderStudentServiceAnswerHelpfulButtonMarkup.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return '';
}

function updateStudentServiceAnswerHelpfulButton(button, answer = {}) {
    if (hasStudentServiceQaModule()
        && typeof window.updateStudentServiceAnswerHelpfulButton === 'function'
        && window.updateStudentServiceAnswerHelpfulButton !== updateStudentServiceAnswerHelpfulButton) {
        return window.updateStudentServiceAnswerHelpfulButton.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
}

function patchStudentServiceAnswerHelpfulBtn(questionId, answerId, options = {}) {
    if (hasStudentServiceQaModule()
        && typeof window.patchStudentServiceAnswerHelpfulBtn === 'function'
        && window.patchStudentServiceAnswerHelpfulBtn !== patchStudentServiceAnswerHelpfulBtn) {
        return window.patchStudentServiceAnswerHelpfulBtn.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
}

function removeStudentServiceAnswerBranch(questionId, answerId) {
    if (hasStudentServiceQaModule()
        && typeof window.removeStudentServiceAnswerBranch === 'function'
        && window.removeStudentServiceAnswerBranch !== removeStudentServiceAnswerBranch) {
        return window.removeStudentServiceAnswerBranch.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
}

function applyStudentServiceQuestionMutation(questionId, options = {}) {
    if (hasStudentServiceQaModule()
        && typeof window.applyStudentServiceQuestionMutation === 'function'
        && window.applyStudentServiceQuestionMutation !== applyStudentServiceQuestionMutation) {
        return window.applyStudentServiceQuestionMutation.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
}

function patchStudentServiceOpenQuestionThread(questionId) {
    if (hasStudentServiceQaModule()
        && typeof window.patchStudentServiceOpenQuestionThread === 'function'
        && window.patchStudentServiceOpenQuestionThread !== patchStudentServiceOpenQuestionThread) {
        return window.patchStudentServiceOpenQuestionThread.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
}

function ensureStudentServiceOperationsShell(root) {
    if (!root) return null;
    let shell = root.querySelector('[data-student-service-ops-shell="1"]');
    if (!shell) {
        const range = document.createRange();
        range.selectNodeContents(root);
        root.replaceChildren(range.createContextualFragment(`
            <div class="student-service-ops-shell" data-student-service-ops-shell="1">
                <div data-student-service-ops-head="1"></div>
                <div class="student-service-ops-grid">
                    <div data-student-service-ops-stats="1"></div>
                    <div data-student-service-ops-queue="1"></div>
                    <div data-student-service-ops-lanes="1"></div>
                </div>
            </div>
        `));
        shell = root.querySelector('[data-student-service-ops-shell="1"]');
    }
    return {
        head: shell?.querySelector('[data-student-service-ops-head="1"]') || null,
        stats: shell?.querySelector('[data-student-service-ops-stats="1"]') || null,
        queue: shell?.querySelector('[data-student-service-ops-queue="1"]') || null,
        lanes: shell?.querySelector('[data-student-service-ops-lanes="1"]') || null
    };
}

function renderStudentServiceOperationsHeadMarkup() {
    return `
        <div class="student-service-ops-head">
            <div>
                <div class="student-service-kicker">Desk focus</div>
                <div class="student-service-zone-title">Queue control with useful context attached.</div>
                <div class="student-service-zone-copy">This strip stays secondary to the student hub and keeps the live desk state visible for staff without turning the page into a spreadsheet.</div>
            </div>
            <div class="student-service-ops-actions">
                <button type="button" class="student-service-mini-action" data-student-service-open-panel="tickets"><i class="fas fa-inbox"></i> Open inbox</button>
                <button type="button" class="student-service-mini-action" data-student-service-open-panel="articles"><i class="fas fa-book-open"></i> Knowledge base</button>
            </div>
        </div>
    `;
}

function renderStudentServiceOperationsStatsMarkup(openTickets, assignedToMe, waitingForService, waitingForStudent, handoffNeeded) {
    return `
        <article class="student-service-ops-card lux-summary-surface lux-summary-surface--panel">
            <div class="student-service-ops-label">Live queue</div>
            <div class="student-service-ops-value">${openTickets.length}</div>
            <div class="student-service-ops-copy">Open cases across the visible support lane.</div>
            <div class="student-service-ops-pill-row">
                <span class="student-service-pill">Assigned ${assignedToMe}</span>
                <span class="student-service-pill">Waiting ${waitingForService + waitingForStudent}</span>
                <span class="student-service-pill">Handoffs ${handoffNeeded}</span>
            </div>
        </article>
    `;
}

function renderStudentServiceOperationsQueueMarkup(urgentQueue) {
    return `
        <article class="student-service-ops-card student-service-ops-card--queue lux-summary-surface lux-summary-surface--panel">
            <div class="student-service-ops-label">Next useful case</div>
            <div class="student-service-ops-list">
                ${urgentQueue.length ? urgentQueue.map(ticket => `
                    <button type="button" class="student-service-ops-ticket" data-student-service-open-ticket="${ssEscape(ticket.id)}" data-student-service-open-ticket-panel="tickets">
                        <div class="student-service-ops-ticket-top">
                            <strong>${ssEscape(ticket.title)}</strong>
                            <span class="student-service-status ${ssEscape(getStudentServiceStatusClass(ticket.status))}">${ssEscape(ticket.status)}</span>
                        </div>
                        <div class="student-service-ops-ticket-copy">${ssEscape(ticket.studentName)} | ${ssEscape(getStudentServiceSupportArea(ticket.serviceArea).label)}</div>
                        <div class="student-service-ops-ticket-copy">Updated ${ssFormatDateTime(ticket.updatedAt || ticket.createdAt)} | Assignee ${ssEscape(ticket.assignedToName || 'Unassigned')}</div>
                    </button>
                `).join('') : '<div class="student-service-empty-state">No open tickets need desk attention right now.</div>'}
            </div>
        </article>
    `;
}

function renderStudentServiceOperationsLanesMarkup(topicCounts) {
    return `
        <article class="student-service-ops-card lux-summary-surface lux-summary-surface--panel">
            <div class="student-service-ops-label">Service lanes</div>
            <div class="student-service-ops-lanes">
                ${topicCounts.slice(0, 4).map(({ area, open, articles: articleCount }) => `
                    <button type="button" class="student-service-ops-lane" data-student-service-focus-area="${ssEscape(area.id)}">
                        <strong>${ssEscape(area.label)}</strong>
                        <span>${open} open | ${articleCount} articles</span>
                    </button>
                `).join('')}
            </div>
        </article>
    `;
}

function renderStudentServiceOperationsStrip(root, currentUser, tickets, articles) {
    if (!root || getEffectiveUserRole() !== USER_ROLES.STUDENT_SERVICE) return;
    const openTickets = tickets.filter(ticket => !['Resolved', 'Closed'].includes(ticket.status));
    const assignedToMe = openTickets.filter(ticket => String(ticket.assignedToId || '') === String(currentUser?.id || '')).length;
    const waitingForService = tickets.filter(ticket => ticket.status === 'Waiting for Service').length;
    const waitingForStudent = tickets.filter(ticket => ticket.status === 'Waiting for Student').length;
    const handoffNeeded = openTickets.filter(ticket => ['Requested', 'In Progress', 'Waiting'].includes(ticket.handoff?.status)).length;
    const urgentQueue = sortStudentServiceTicketsForStaff(openTickets).slice(0, 3);
    const topicCounts = STUDENT_SERVICE_SUPPORT_AREAS.map(area => ({
        area,
        open: openTickets.filter(ticket => ticket.serviceArea === area.id).length,
        articles: articles.filter(article => article.serviceArea === area.id && article.published).length
    })).sort((left, right) => right.open - left.open);
    const shell = ensureStudentServiceOperationsShell(root);
    if (!shell) return;
    setStudentServiceMarkup(shell.head, 'student-service-ops:head', renderStudentServiceOperationsHeadMarkup());
    setStudentServiceMarkup(shell.stats, 'student-service-ops:stats', renderStudentServiceOperationsStatsMarkup(openTickets, assignedToMe, waitingForService, waitingForStudent, handoffNeeded));
    setStudentServiceMarkup(shell.queue, 'student-service-ops:queue', renderStudentServiceOperationsQueueMarkup(urgentQueue));
    setStudentServiceMarkup(shell.lanes, 'student-service-ops:lanes', renderStudentServiceOperationsLanesMarkup(topicCounts));
}

function renderStudentServiceHomeWorkspaceRebuilt() {
    const root = document.getElementById('student-service-home-workspace');
    if (!root) return;
    if (getEffectiveUserRole() !== USER_ROLES.STUDENT_SERVICE) {
        root.replaceChildren();
        return;
    }
    const currentUser = getStudentServiceCurrentUser();
    const { tickets, articles } = ensureStudentServiceStores();
    renderStudentServiceOperationsStrip(root, currentUser, tickets, articles);
}

function setStudentServiceQuestionFilter(field, value) {
    if (hasStudentServiceQaModule()
        && typeof window.setStudentServiceQuestionFilter === 'function'
        && window.setStudentServiceQuestionFilter !== setStudentServiceQuestionFilter) {
        return window.setStudentServiceQuestionFilter.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
}

function setStudentServiceQuestionComposerExpanded(expanded) {
    if (hasStudentServiceQaModule()
        && typeof window.setStudentServiceQuestionComposerExpanded === 'function'
        && window.setStudentServiceQuestionComposerExpanded !== setStudentServiceQuestionComposerExpanded) {
        return window.setStudentServiceQuestionComposerExpanded.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
}

function setStudentServiceDraftQuestionField(field, value) {
    if (hasStudentServiceQaModule()
        && typeof window.setStudentServiceDraftQuestionField === 'function'
        && window.setStudentServiceDraftQuestionField !== setStudentServiceDraftQuestionField) {
        return window.setStudentServiceDraftQuestionField.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
}

function openStudentServiceQuestion(questionId) {
    if (hasStudentServiceQaModule()
        && typeof window.openStudentServiceQuestion === 'function'
        && window.openStudentServiceQuestion !== openStudentServiceQuestion) {
        return window.openStudentServiceQuestion.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
}

function setStudentServiceReplyTarget(questionId, answerId) {
    const ui = ensureStudentServiceUiState();
    const normalizedQuestionId = String(questionId || '').trim();
    const normalizedAnswerId = String(answerId || '').trim();
    const isSameTarget = ui.replyingToQuestionId === normalizedQuestionId
        && ui.replyingToAnswerId === normalizedAnswerId;
    ui.serviceLane = 'qa';
    ui.selectedQuestionId = normalizedQuestionId || ui.selectedQuestionId;
    if (isSameTarget) {
        closeStudentServiceInlineReply();
        return;
    }
    openStudentServiceInlineReply(normalizedQuestionId, normalizedAnswerId);
}

function clearStudentServiceReplyTarget() {
    closeStudentServiceInlineReply();
}

function getStudentServiceQuestionStatusLabel(question) {
    if (hasStudentServiceQaModule()
        && typeof window.getStudentServiceQuestionStatusLabel === 'function'
        && window.getStudentServiceQuestionStatusLabel !== getStudentServiceQuestionStatusLabel) {
        return window.getStudentServiceQuestionStatusLabel.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
}

function getStudentServiceQuestionStatusClass(question) {
    if (hasStudentServiceQaModule()
        && typeof window.getStudentServiceQuestionStatusClass === 'function'
        && window.getStudentServiceQuestionStatusClass !== getStudentServiceQuestionStatusClass) {
        return window.getStudentServiceQuestionStatusClass.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return [];
}

function getStudentServiceQuestionAnswerCount(question) {
    if (hasStudentServiceQaModule()
        && typeof window.getStudentServiceQuestionAnswerCount === 'function'
        && window.getStudentServiceQuestionAnswerCount !== getStudentServiceQuestionAnswerCount) {
        return window.getStudentServiceQuestionAnswerCount.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
}

function renderStudentServiceQuestionList(questions = [], options = {}) {
    if (hasStudentServiceQaModule()
        && typeof window.renderStudentServiceQuestionList === 'function'
        && window.renderStudentServiceQuestionList !== renderStudentServiceQuestionList) {
        return window.renderStudentServiceQuestionList.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return '';
}

function renderStudentServiceQuestionComposer(currentUser) {
    if (hasStudentServiceQaModule()
        && typeof window.renderStudentServiceQuestionComposer === 'function'
        && window.renderStudentServiceQuestionComposer !== renderStudentServiceQuestionComposer) {
        return window.renderStudentServiceQuestionComposer.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return '';
}

function renderStudentServiceQuestionComposerFormMarkup(currentUser) {
    if (hasStudentServiceQaModule()
        && typeof window.renderStudentServiceQuestionComposerFormMarkup === 'function'
        && window.renderStudentServiceQuestionComposerFormMarkup !== renderStudentServiceQuestionComposerFormMarkup) {
        return window.renderStudentServiceQuestionComposerFormMarkup.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return '';
}

function renderStudentServiceQuestionComposerModalActionsMarkup() {
    if (hasStudentServiceQaModule()
        && typeof window.renderStudentServiceQuestionComposerModalActionsMarkup === 'function'
        && window.renderStudentServiceQuestionComposerModalActionsMarkup !== renderStudentServiceQuestionComposerModalActionsMarkup) {
        return window.renderStudentServiceQuestionComposerModalActionsMarkup.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return '';
}

function renderStudentServiceQuestionComposerModalShell(currentUser) {
    if (hasStudentServiceQaModule()
        && typeof window.renderStudentServiceQuestionComposerModalShell === 'function'
        && window.renderStudentServiceQuestionComposerModalShell !== renderStudentServiceQuestionComposerModalShell) {
        return window.renderStudentServiceQuestionComposerModalShell.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return '';
}

function renderStudentServiceQuestionCardPreviewMarkup(question = {}) {
    if (hasStudentServiceQaModule()
        && typeof window.renderStudentServiceQuestionCardPreviewMarkup === 'function'
        && window.renderStudentServiceQuestionCardPreviewMarkup !== renderStudentServiceQuestionCardPreviewMarkup) {
        return window.renderStudentServiceQuestionCardPreviewMarkup.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return '';
}

function renderStudentServiceQuestionFeed(questions = [], options = {}) {
    if (hasStudentServiceQaModule()
        && typeof window.renderStudentServiceQuestionFeed === 'function'
        && window.renderStudentServiceQuestionFeed !== renderStudentServiceQuestionFeed) {
        return window.renderStudentServiceQuestionFeed.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return '';
}

function renderStudentServiceCommentReplyShell(question, answer, skipLuxButton) {
    if (hasStudentServiceQaModule()
        && typeof window.renderStudentServiceCommentReplyShell === 'function'
        && window.renderStudentServiceCommentReplyShell !== renderStudentServiceCommentReplyShell) {
        return window.renderStudentServiceCommentReplyShell.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return '';
}

function renderStudentServiceDeleteConfirmShell(options = {}) {
    const {
        mode = 'comment',
        question = {},
        answer = {},
        article = {},
        skipLuxButton = 'data-lux-skip-modern-button="true"'
    } = options;
    const isQuestionDelete = mode === 'question';
    const isArticleDelete = mode === 'article';
    const dialogTitle = isArticleDelete
        ? 'Remove article'
        : isQuestionDelete
            ? 'Delete question'
            : 'Delete comment';
    const dialogSubtitle = isArticleDelete
        ? 'This permanently removes the article from the knowledge base.'
        : isQuestionDelete
            ? 'This removes the question and all comments permanently.'
            : 'This cannot be undone.';
    const confirmLabel = isArticleDelete
        ? 'Remove article'
        : isQuestionDelete
            ? 'Delete question'
            : 'Delete comment';
    const authorName = isArticleDelete
        ? 'Knowledge base'
        : isQuestionDelete
            ? (getStudentServiceQuestionAuthorLabel(question) || 'Student')
            : (answer.responderName || answer.authorDisplayName || 'Responder');
    const previewTitle = isArticleDelete
        ? String(article.title || 'Untitled article')
        : isQuestionDelete
            ? String(question.title || 'Untitled question')
            : '';
    const previewBody = isArticleDelete
        ? String(article.summary || article.content || '')
        : isQuestionDelete
            ? String(question.body || '')
            : String(answer.body || '');
    const previewTime = isArticleDelete
        ? ssFormatDateTime(article.updatedAt || article.createdAt)
        : isQuestionDelete
            ? ssFormatDateTime(question.updatedAt || question.createdAt)
            : ssFormatDateTime(answer.updatedAt || answer.createdAt);
    const confirmAttrs = isArticleDelete
        ? `data-student-service-confirm-article-delete="${ssEscape(article.id)}" data-student-service-delete-confirm-gate="true" disabled`
        : isQuestionDelete
            ? `data-student-service-confirm-question-delete="${ssEscape(question.id)}"`
            : `data-student-service-confirm-delete="${ssEscape(answer.id)}" data-student-service-question-id="${ssEscape(question.id)}"`;
    const modalMode = isArticleDelete ? 'article' : isQuestionDelete ? 'question' : 'comment';
    const modalClass = [
        'student-service-qa-delete-modal',
        'student-service-qa-delete-confirm',
        isQuestionDelete ? 'is-question-delete' : '',
        isArticleDelete ? 'is-article-delete' : ''
    ].filter(Boolean).join(' ');
    const attestationMarkup = isArticleDelete
        ? `
            <div class="student-service-qa-delete-confirm-attestations">
                <label class="student-service-qa-delete-confirm-attest">
                    <input type="checkbox" data-student-service-delete-attest="removal">
                    <span>I understand this article will be permanently removed.</span>
                </label>
                ${isArticleDelete && article.published ? `
                <label class="student-service-qa-delete-confirm-attest">
                    <input type="checkbox" data-student-service-delete-attest="published">
                    <span>This article is published and visible to students.</span>
                </label>
                ` : ''}
            </div>
        `
        : '';
    return `
        <div class="student-service-qa-delete-modal-backdrop" data-student-service-dismiss-delete-modal="true">
            <div class="${modalClass}" role="dialog" aria-modal="true" aria-labelledby="student-service-delete-modal-title" data-student-service-delete-confirm="true" data-student-service-delete-mode="${modalMode}">
                <div class="student-service-qa-delete-confirm-accent" aria-hidden="true"></div>
                <div class="student-service-qa-delete-confirm-head">
                    <div class="student-service-qa-delete-confirm-heading">
                        <span class="student-service-qa-delete-confirm-icon-chip"><i class="fas fa-trash" aria-hidden="true"></i></span>
                        <div class="student-service-qa-delete-confirm-title">
                            <strong class="student-service-qa-delete-confirm-dialog-title" id="student-service-delete-modal-title">${ssEscape(dialogTitle)}</strong>
                            <span class="student-service-qa-delete-confirm-dialog-subtitle">${ssEscape(dialogSubtitle)}</span>
                        </div>
                    </div>
                    <button type="button" class="social-neo-btn social-neo-btn-ghost student-service-qa-delete-confirm-close" ${skipLuxButton} data-student-service-cancel-delete="true" aria-label="Close"><i class="fas fa-times" aria-hidden="true"></i></button>
                </div>
                <div class="student-service-qa-delete-confirm-preview">
                    <div class="student-service-qa-delete-confirm-author">
                        <span class="social-neo-avatar social-neo-avatar-sm is-fallback student-service-qa-avatar student-service-qa-avatar-sm">${ssEscape(ssInitials(authorName, isArticleDelete ? 'K' : isQuestionDelete ? 'S' : 'R'))}</span>
                        <div class="student-service-qa-delete-confirm-author-meta">
                            <strong>${ssEscape(authorName)}</strong>
                            <span>${ssEscape(previewTime)}</span>
                        </div>
                    </div>
                    ${previewTitle ? `<div class="student-service-qa-delete-confirm-question-title">${ssEscape(previewTitle)}</div>` : ''}
                    <blockquote class="student-service-qa-delete-confirm-quote">${ssTextBlock(previewBody)}</blockquote>
                    ${isQuestionDelete ? '<p class="student-service-qa-delete-confirm-warning">All comments on this thread will also be removed.</p>' : ''}
                    ${attestationMarkup}
                </div>
                <div class="student-service-qa-delete-confirm-actions">
                    <button type="button" class="social-neo-btn social-neo-btn-ghost student-service-qa-delete-confirm-cancel" ${skipLuxButton} data-student-service-cancel-delete="true">Cancel</button>
                    <button type="button" class="social-neo-btn social-neo-btn-danger student-service-qa-delete-confirm-btn" ${skipLuxButton} ${confirmAttrs}>${ssEscape(confirmLabel)}</button>
                </div>
            </div>
        </div>
    `;
}

function syncStudentServiceDeleteConfirmGate() {
    const modalRoot = document.getElementById('student-service-modal-root');
    if (!modalRoot || modalRoot.hasAttribute('hidden')) return;
    const modal = modalRoot.querySelector('[data-student-service-delete-confirm="true"]');
    if (!modal) return;
    const mode = modal.dataset.studentServiceDeleteMode || '';
    if (mode !== 'article') return;
    const confirmButton = modal.querySelector('[data-student-service-delete-confirm-gate="true"]');
    if (!confirmButton) return;
    const attestations = Array.from(modal.querySelectorAll('[data-student-service-delete-attest]'));
    const ready = attestations.length > 0 && attestations.every(input => input.checked);
    confirmButton.disabled = !ready;
}

function mountStudentServiceDeleteConfirmShell(html) {
    const modalRoot = ensureStudentServiceModalRoot();
    if (!modalRoot) return;
    modalRoot.innerHTML = html;
    modalRoot.removeAttribute('hidden');
    const focusTarget = modalRoot.querySelector('.student-service-qa-delete-confirm-btn')
        || modalRoot.querySelector('[data-student-service-cancel-delete]');
    focusTarget?.focus?.();
}

function openStudentServiceDeleteConfirm(questionId, answerId) {
    closeStudentServiceQuestionComposerModal();
    closeStudentServiceDeleteConfirm();
    closeStudentServiceInlineReply();
    const question = getStudentServiceQuestionById(questionId);
    const answer = findStudentServiceAnswerRecord(question, answerId);
    if (!question || !answer || !canCurrentUserDeleteStudentServiceAnswer(question, answer)) return;
    mountStudentServiceDeleteConfirmShell(renderStudentServiceDeleteConfirmShell({
        mode: 'comment',
        question,
        answer,
        skipLuxButton: 'data-lux-skip-modern-button="true"'
    }));
}

function openStudentServiceDeleteQuestionConfirm(questionId) {
    if (hasStudentServiceQaModule()
        && typeof window.openStudentServiceDeleteQuestionConfirm === 'function'
        && window.openStudentServiceDeleteQuestionConfirm !== openStudentServiceDeleteQuestionConfirm) {
        return window.openStudentServiceDeleteQuestionConfirm.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
}

function getStudentServiceArticleById(articleId) {
    const normalizedId = String(articleId || '').trim();
    if (!normalizedId) return null;
    return (ensureStudentServiceStores().articles || []).find(article => String(article.id || '').trim() === normalizedId) || null;
}

function openStudentServiceDeleteArticleConfirm(articleId) {
    if (!canShowStudentServiceArticleEditorActions()) return;
    closeStudentServiceQuestionComposerModal();
    closeStudentServiceDeleteConfirm();
    closeStudentServiceInlineReply();
    const article = getStudentServiceArticleById(articleId);
    if (!article) return;
    mountStudentServiceDeleteConfirmShell(renderStudentServiceDeleteConfirmShell({
        mode: 'article',
        article,
        skipLuxButton: 'data-lux-skip-modern-button="true"'
    }));
    syncStudentServiceDeleteConfirmGate();
}

function isStudentServiceQuestionComposerModalOpen() {
    if (hasStudentServiceQaModule()
        && typeof window.isStudentServiceQuestionComposerModalOpen === 'function'
        && window.isStudentServiceQuestionComposerModalOpen !== isStudentServiceQuestionComposerModalOpen) {
        return window.isStudentServiceQuestionComposerModalOpen.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return false;
}

function mountStudentServiceQuestionComposerModal() {
    if (hasStudentServiceQaModule()
        && typeof window.mountStudentServiceQuestionComposerModal === 'function'
        && window.mountStudentServiceQuestionComposerModal !== mountStudentServiceQuestionComposerModal) {
        return window.mountStudentServiceQuestionComposerModal.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
}

function openStudentServiceQuestionComposerModal() {
    if (hasStudentServiceQaModule()
        && typeof window.openStudentServiceQuestionComposerModal === 'function'
        && window.openStudentServiceQuestionComposerModal !== openStudentServiceQuestionComposerModal) {
        return window.openStudentServiceQuestionComposerModal.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
}

function studentServiceShouldRestoreBodyScroll() {
    return !isStudentServiceQuestionThreadModalOpen()
        && !isStudentServiceQuestionComposerModalOpen()
        && !document.querySelector('[data-student-service-delete-confirm="true"]')
        && !isStudentServiceInboxFilterEditorOpen()
        && !isStudentServiceGuidanceModalOpen();
}

function isStudentServiceGuidanceModalOpen() {
    const modalRoot = document.getElementById('student-service-modal-root');
    return Boolean(modalRoot && !modalRoot.hasAttribute('hidden')
        && modalRoot.querySelector('[data-student-service-guidance-modal="true"]'));
}

function buildStudentServiceGuidanceModalContext(areaId = '') {
    const visibleArticles = getStudentServiceVisibleArticles();
    const visibleTickets = getStudentServiceVisibleTickets();
    const ui = ensureStudentServiceUiState();
    const normalizedAreaId = String(areaId || '').trim();
    if (normalizedAreaId) {
        const area = getStudentServiceSupportArea(normalizedAreaId);
        ui.activeSupportArea = area.id;
        ui.draftTicket.serviceArea = area.id;
        ui.draftTicket.category = getStudentServiceDefaultCategoryForArea(area.id);
    }
    if (typeof window.buildStudentServiceGuidanceBrowserContext !== 'function') return null;
    return window.buildStudentServiceGuidanceBrowserContext(visibleArticles, visibleTickets);
}

function renderStudentServiceGuidanceModalShell(ctx) {
    const browserMarkup = typeof window.renderStudentServiceGuidanceBrowserMarkup === 'function' && ctx
        ? window.renderStudentServiceGuidanceBrowserMarkup(ctx.ui, ctx.filteredArticles, ctx.activeArea, ctx.selectedArea, ctx.selectedArticle)
        : renderStudentServiceEmptyState('Guidance could not load.', 'student-service-empty-state-large');
    return `
        <div class="student-service-guidance-modal-backdrop" data-student-service-dismiss-guidance-modal="true">
            <div class="student-service-guidance-modal" role="dialog" aria-modal="true" aria-labelledby="student-service-guidance-modal-title" data-student-service-guidance-modal="true">
                <div class="student-service-guidance-modal-accent" aria-hidden="true"></div>
                <header class="student-service-guidance-modal-head">
                    <div class="student-service-guidance-modal-heading">
                        <span class="student-service-guidance-modal-icon-chip"><i class="fas fa-book-open" aria-hidden="true"></i></span>
                        <div class="student-service-guidance-modal-title">
                            <strong id="student-service-guidance-modal-title">Rules & guidance</strong>
                            <span>Browse official guidance before opening a private case.</span>
                        </div>
                    </div>
                    <button type="button" class="social-neo-btn social-neo-btn-ghost student-service-guidance-modal-close" data-lux-skip-modern-button="true" data-student-service-cancel-guidance-modal="true" aria-label="Close"><i class="fas fa-times" aria-hidden="true"></i></button>
                </header>
                <div class="student-service-guidance-modal-body">
                    ${browserMarkup}
                </div>
            </div>
        </div>
    `;
}

function mountStudentServiceGuidanceModal(areaId = '') {
    const ctx = buildStudentServiceGuidanceModalContext(areaId);
    const modalRoot = ensureStudentServiceModalRoot();
    modalRoot.innerHTML = renderStudentServiceGuidanceModalShell(ctx);
    modalRoot.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    modalRoot.querySelector('[data-student-service-article-search-input]')?.focus?.();
}

function openStudentServiceGuidanceModal(areaId = '') {
    const ui = ensureStudentServiceUiState();
    ui.serviceLane = 'service';
    ui.studentTab = 'get_help';
    closeStudentServiceDeleteConfirm({ restoreThread: false });
    closeStudentServiceQuestionComposerModal();
    closeStudentServiceQuestionThreadModal();
    closeStudentServiceInboxFilterEditorModal();
    const launch = () => mountStudentServiceGuidanceModal(areaId);
    if (typeof window.renderStudentServiceGuidanceBrowserMarkup === 'function') {
        launch();
        return;
    }
    ensureStudentServiceServiceModule().then(launch).catch(() => null);
}

function closeStudentServiceGuidanceModal() {
    const modalRoot = document.getElementById('student-service-modal-root');
    if (!modalRoot || !isStudentServiceGuidanceModalOpen()) return;
    modalRoot.innerHTML = '';
    modalRoot.setAttribute('hidden', '');
    if (studentServiceShouldRestoreBodyScroll()) {
        document.body.style.overflow = '';
    }
}

function remountStudentServiceGuidanceModal() {
    if (!isStudentServiceGuidanceModalOpen()) return;
    mountStudentServiceGuidanceModal();
}

function closeStudentServiceQuestionComposerModal() {
    if (hasStudentServiceQaModule()
        && typeof window.closeStudentServiceQuestionComposerModal === 'function'
        && window.closeStudentServiceQuestionComposerModal !== closeStudentServiceQuestionComposerModal) {
        return window.closeStudentServiceQuestionComposerModal.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
}

function remountStudentServiceQuestionComposerModal() {
    if (hasStudentServiceQaModule()
        && typeof window.remountStudentServiceQuestionComposerModal === 'function'
        && window.remountStudentServiceQuestionComposerModal !== remountStudentServiceQuestionComposerModal) {
        return window.remountStudentServiceQuestionComposerModal.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
}

function renderStudentServiceAnswerCardMarkup(question, answer, options = {}) {
    if (hasStudentServiceQaModule()
        && typeof window.renderStudentServiceAnswerCardMarkup === 'function'
        && window.renderStudentServiceAnswerCardMarkup !== renderStudentServiceAnswerCardMarkup) {
        return window.renderStudentServiceAnswerCardMarkup.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return '';
}

function renderStudentServiceAnswerThreadNode(question, threadEntry, cardOptions) {
    if (hasStudentServiceQaModule()
        && typeof window.renderStudentServiceAnswerThreadNode === 'function'
        && window.renderStudentServiceAnswerThreadNode !== renderStudentServiceAnswerThreadNode) {
        return window.renderStudentServiceAnswerThreadNode.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return '';
}

function renderStudentServiceQuestionDetailActionsMarkup(question, options = {}) {
    if (hasStudentServiceQaModule()
        && typeof window.renderStudentServiceQuestionDetailActionsMarkup === 'function'
        && window.renderStudentServiceQuestionDetailActionsMarkup !== renderStudentServiceQuestionDetailActionsMarkup) {
        return window.renderStudentServiceQuestionDetailActionsMarkup.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return '';
}

function renderStudentServiceQuestionDetail(question, options = {}) {
    if (hasStudentServiceQaModule()
        && typeof window.renderStudentServiceQuestionDetail === 'function'
        && window.renderStudentServiceQuestionDetail !== renderStudentServiceQuestionDetail) {
        return window.renderStudentServiceQuestionDetail.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return '';
}

function renderStudentServiceStudentHub(container, visibleArticles, visibleTickets) {
    if (hasStudentServiceServiceModule()) {
        return window.renderStudentServiceStudentHub(container, visibleArticles, visibleTickets);
    }
    renderStudentServiceServiceModuleLoading(container, 'student');
    ensureStudentServiceServiceModule()
        .then(() => rerenderStudentServicePageAfterModuleLoad())
        .catch(() => handleStudentServiceServiceModuleLoadFailure(container, 'student'));
}

function renderStudentServiceStudentQaHub(container) {
    if (hasStudentServiceQaModule()) {
        return window.renderStudentServiceStudentQaHub(container);
    }
    renderStudentServiceQaModuleLoading(container, 'student');
    ensureStudentServiceQaModule()
        .then(() => rerenderStudentServicePageAfterModuleLoad())
        .catch(() => handleStudentServiceQaModuleLoadFailure(container, 'student'));
}

function openStudentServiceTicket(ticketId) {
    if (hasStudentServiceTicketsModule()
        && typeof window.openStudentServiceTicket === 'function'
        && window.openStudentServiceTicket !== openStudentServiceTicket) {
        return window.openStudentServiceTicket.apply(null, arguments);
    }
    ensureStudentServiceTicketsModule().catch(() => null);
    return;
}

function renderStudentServiceMyTicketsHub(container, visibleTickets) {
    if (hasStudentServiceServiceModule()) {
        return window.renderStudentServiceMyTicketsHub(container, visibleTickets);
    }
    renderStudentServiceServiceModuleLoading(container, 'student');
    ensureStudentServiceServiceModule()
        .then(() => rerenderStudentServicePageAfterModuleLoad())
        .catch(() => handleStudentServiceServiceModuleLoadFailure(container, 'student'));
}

function openStudentServiceArticle(articleId) {
    const ui = ensureStudentServiceUiState();
    const nextArticleId = articleId || '';
    if (ui.serviceLane === 'service' && ui.selectedArticleId === nextArticleId) {
        return;
    }
    ui.serviceLane = 'service';
    ui.selectedArticleId = nextArticleId;
    renderStudentServicePage();
}

function openStudentServiceArticleFromTicket(articleId) {
    if (hasStudentServiceTicketsModule()
        && typeof window.openStudentServiceArticleFromTicket === 'function'
        && window.openStudentServiceArticleFromTicket !== openStudentServiceArticleFromTicket) {
        return window.openStudentServiceArticleFromTicket.apply(null, arguments);
    }
    ensureStudentServiceTicketsModule().catch(() => null);
    return;
}

function renderStudentServiceResponderServiceLane(container, visibleArticles) {
    if (hasStudentServiceServiceModule()) {
        return window.renderStudentServiceResponderServiceLane(container, visibleArticles);
    }
    renderStudentServiceServiceModuleLoading(container, 'responder');
    ensureStudentServiceServiceModule()
        .then(() => rerenderStudentServicePageAfterModuleLoad())
        .catch(() => handleStudentServiceServiceModuleLoadFailure(container, 'responder'));
}

function renderStudentServiceStaffQaFeed(container, options = {}) {
    if (hasStudentServiceQaModule()) {
        return window.renderStudentServiceStaffQaFeed(container, options);
    }
    renderStudentServiceQaModuleLoading(container, 'staff');
    ensureStudentServiceQaModule()
        .then(() => rerenderStudentServicePageAfterModuleLoad())
        .catch(() => handleStudentServiceQaModuleLoadFailure(container, 'staff'));
}

function renderStudentServiceStaffWorkbench(container, visibleArticles, visibleTickets, options = {}) {
    if (hasStudentServiceServiceModule()) {
        return window.renderStudentServiceStaffWorkbench(container, visibleArticles, visibleTickets, options);
    }
    renderStudentServiceServiceModuleLoading(container, 'service');
    ensureStudentServiceServiceModule()
        .then(() => rerenderStudentServicePageAfterModuleLoad())
        .catch(() => handleStudentServiceServiceModuleLoadFailure(container, 'service'));
}

function captureStudentServiceLazyModuleStubs() {
    STUDENT_SERVICE_STUDENT_HUB_STUB = renderStudentServiceStudentHub;
    STUDENT_SERVICE_STUDENT_QA_HUB_STUB = renderStudentServiceStudentQaHub;
    STUDENT_SERVICE_MY_TICKETS_HUB_STUB = renderStudentServiceMyTicketsHub;
    STUDENT_SERVICE_RESPONDER_SERVICE_LANE_STUB = renderStudentServiceResponderServiceLane;
    STUDENT_SERVICE_STAFF_QA_FEED_STUB = renderStudentServiceStaffQaFeed;
    STUDENT_SERVICE_STAFF_WORKBENCH_STUB = renderStudentServiceStaffWorkbench;
    window.__studentServiceStudentHubStub = STUDENT_SERVICE_STUDENT_HUB_STUB;
    window.__studentServiceStudentQaHubStub = STUDENT_SERVICE_STUDENT_QA_HUB_STUB;
    window.__studentServiceMyTicketsHubStub = STUDENT_SERVICE_MY_TICKETS_HUB_STUB;
    window.__studentServiceResponderServiceLaneStub = STUDENT_SERVICE_RESPONDER_SERVICE_LANE_STUB;
    window.__studentServiceStaffQaFeedGuard = STUDENT_SERVICE_STAFF_QA_FEED_STUB;
    window.__studentServiceStaffQaFeedStub = STUDENT_SERVICE_STAFF_QA_FEED_STUB;
    window.__studentServiceStaffWorkbenchStub = STUDENT_SERVICE_STAFF_WORKBENCH_STUB;
}

captureStudentServiceLazyModuleStubs();

function setStudentServiceArticleSearch(value) {
    const ui = ensureStudentServiceUiState();
    const nextValue = String(value || '');
    if (ui.articleSearch === nextValue) return;
    ui.articleSearch = nextValue;
    if (isStudentServiceGuidanceModalOpen()) {
        remountStudentServiceGuidanceModal();
        return;
    }
    ui.serviceLane = 'service';
    renderStudentServicePage();
}

let studentServiceTicketFilterRenderTimer = null;

function scheduleStudentServiceTicketFilterRender() {
    if (hasStudentServiceTicketsModule()
        && typeof window.scheduleStudentServiceTicketFilterRender === 'function'
        && window.scheduleStudentServiceTicketFilterRender !== scheduleStudentServiceTicketFilterRender) {
        return window.scheduleStudentServiceTicketFilterRender.apply(null, arguments);
    }
    ensureStudentServiceTicketsModule().catch(() => null);
    return;
}

function setStudentServiceTicketFilter(field, value, options = {}) {
    if (hasStudentServiceTicketsModule()
        && typeof window.setStudentServiceTicketFilter === 'function'
        && window.setStudentServiceTicketFilter !== setStudentServiceTicketFilter) {
        return window.setStudentServiceTicketFilter.apply(null, arguments);
    }
    ensureStudentServiceTicketsModule().catch(() => null);
    return;
}

function switchStudentServicePanel(panel) {
    const ui = ensureStudentServiceUiState();
    const nextLane = panel === 'qa' ? 'qa' : 'service';
    const nextPanel = ['tickets', 'articles', 'qa'].includes(panel) ? panel : 'tickets';
    if (ui.serviceLane === nextLane && ui.staffPanel === nextPanel) return;
    ui.serviceLane = nextLane;
    ui.staffPanel = nextPanel;
    renderStudentServicePage();
}

function switchStudentServiceStudentTab(tab) {
    const ui = ensureStudentServiceUiState();
    const nextTab = tab === 'my_tickets' ? 'my_tickets' : 'get_help';
    if (ui.serviceLane === 'service' && ui.studentTab === nextTab) return;
    ui.serviceLane = 'service';
    ui.studentTab = nextTab;
    renderStudentServicePage();
}

function toggleStudentServiceDetailSection(sectionKey) {
    const ui = ensureStudentServiceUiState();
    ui.detailSections[sectionKey] = !ui.detailSections[sectionKey];
    renderStudentServicePage();
}

async function refreshStudentServiceDataAndRender(force = true) {
    const ui = ensureStudentServiceUiState();
    const openQuestionId = String(ui.selectedQuestionId || '').trim();
    try {
        await fetchStudentServiceBootstrap(force);
    } catch (error) {}
    if (openQuestionId && patchStudentServiceOpenQuestionThread(openQuestionId)) {
        patchStudentServiceQuestionCardStats(openQuestionId);
        syncStudentServiceRenderSignature();
        return;
    }
    const container = document.getElementById('page-student-service');
    if (container) delete container.dataset.studentServiceRenderSignature;
    renderStudentServicePage();
    if (isStudentServiceTicketThreadModalOpen()) {
        remountStudentServiceTicketThreadModal();
    }
    scrollStudentServiceTicketChatLog();
}

function studentServiceApiPath(path) {
    if (typeof assertStudentServiceApiPath === 'function') {
        return assertStudentServiceApiPath(path);
    }
    return path;
}

function getStudentServiceBackendStaleMessage(remoteVersion = '') {
    const expected = String(window.STUDENT_SERVICE_API_MANIFEST_VERSION || '').trim();
    const remote = String(remoteVersion || '').trim();
    if (!expected) return '';
    if (!remote) {
        return 'Student Service backend is out of date (missing API manifest). Restart the local backend with "npm run stop:local && npm run start:local", then hard-refresh this page.';
    }
    if (expected === remote) return '';
    return `Student Service backend is out of date (server ${remote}, page ${expected}). Restart the local backend with "npm run stop:local && npm run start:local", then hard-refresh this page.`;
}

function ensureStudentServiceBackendContract(remoteVersion = '') {
    const message = getStudentServiceBackendStaleMessage(remoteVersion);
    if (!message) {
        STUDENT_SERVICE_RUNTIME.backendStale = false;
        STUDENT_SERVICE_RUNTIME.backendStaleMessage = '';
        return true;
    }
    STUDENT_SERVICE_RUNTIME.backendStale = true;
    STUDENT_SERVICE_RUNTIME.backendStaleMessage = message;
    console.error(message);
    return false;
}

function formatStudentServiceApiError(error, path = '') {
    const message = String(error?.message || '').trim();
    if (message === 'Route not found.') {
        const staleMessage = STUDENT_SERVICE_RUNTIME.backendStaleMessage
            || getStudentServiceBackendStaleMessage(STUDENT_SERVICE_RUNTIME.backendManifestVersion);
        if (staleMessage) return staleMessage;
        return `Student Service route is missing on the running backend (${path || 'unknown path'}). Restart the local backend with "npm run stop:local && npm run start:local", then hard-refresh this page.`;
    }
    return message || 'Student Service request failed.';
}

const STUDENT_SERVICE_MAX_ATTACHMENTS = 5;
const STUDENT_SERVICE_ATTACHMENT_ACCEPT = 'image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.zip,.txt';

function ensureStudentServiceAttachmentInput() {
    if (hasStudentServiceAttachmentsModule()
        && typeof window.ensureStudentServiceAttachmentInput === 'function'
        && window.ensureStudentServiceAttachmentInput !== ensureStudentServiceAttachmentInput) {
        return window.ensureStudentServiceAttachmentInput.apply(null, arguments);
    }
    ensureStudentServiceAttachmentsModule().catch(() => null);
    return;
}

function ensureStudentServiceDraftAttachments(ui) {
    if (hasStudentServiceAttachmentsModule()
        && typeof window.ensureStudentServiceDraftAttachments === 'function'
        && window.ensureStudentServiceDraftAttachments !== ensureStudentServiceDraftAttachments) {
        return window.ensureStudentServiceDraftAttachments.apply(null, arguments);
    }
    ensureStudentServiceAttachmentsModule().catch(() => null);
    return;
}

function getStudentServiceDraftAttachments(composerId) {
    if (hasStudentServiceAttachmentsModule()
        && typeof window.getStudentServiceDraftAttachments === 'function'
        && window.getStudentServiceDraftAttachments !== getStudentServiceDraftAttachments) {
        return window.getStudentServiceDraftAttachments.apply(null, arguments);
    }
    ensureStudentServiceAttachmentsModule().catch(() => null);
    return [];
}

function getStudentServiceAnswerComposerId(questionId, parentAnswerId = '') {
    if (hasStudentServiceAttachmentsModule()
        && typeof window.getStudentServiceAnswerComposerId === 'function'
        && window.getStudentServiceAnswerComposerId !== getStudentServiceAnswerComposerId) {
        return window.getStudentServiceAnswerComposerId.apply(null, arguments);
    }
    ensureStudentServiceAttachmentsModule().catch(() => null);
    return '';
}

function addStudentServiceDraftAttachment(composerId, file) {
    if (hasStudentServiceAttachmentsModule()
        && typeof window.addStudentServiceDraftAttachment === 'function'
        && window.addStudentServiceDraftAttachment !== addStudentServiceDraftAttachment) {
        return window.addStudentServiceDraftAttachment.apply(null, arguments);
    }
    ensureStudentServiceAttachmentsModule().catch(() => null);
    return;
}

function removeStudentServiceDraftAttachment(composerId, attachmentId) {
    if (hasStudentServiceAttachmentsModule()
        && typeof window.removeStudentServiceDraftAttachment === 'function'
        && window.removeStudentServiceDraftAttachment !== removeStudentServiceDraftAttachment) {
        return window.removeStudentServiceDraftAttachment.apply(null, arguments);
    }
    ensureStudentServiceAttachmentsModule().catch(() => null);
    return;
}

function clearStudentServiceDraftAttachments(composerId) {
    if (hasStudentServiceAttachmentsModule()
        && typeof window.clearStudentServiceDraftAttachments === 'function'
        && window.clearStudentServiceDraftAttachments !== clearStudentServiceDraftAttachments) {
        return window.clearStudentServiceDraftAttachments.apply(null, arguments);
    }
    ensureStudentServiceAttachmentsModule().catch(() => null);
    return;
}

async function persistStudentServiceDraftAttachments(composerId) {
    if (hasStudentServiceAttachmentsModule()
        && typeof window.persistStudentServiceDraftAttachments === 'function'
        && window.persistStudentServiceDraftAttachments !== persistStudentServiceDraftAttachments) {
        return window.persistStudentServiceDraftAttachments.apply(null, arguments);
    }
    ensureStudentServiceAttachmentsModule().catch(() => null);
    return [];
}

function resolveStudentServiceAttachmentUrl(file) {
    if (hasStudentServiceAttachmentsModule()
        && typeof window.resolveStudentServiceAttachmentUrl === 'function'
        && window.resolveStudentServiceAttachmentUrl !== resolveStudentServiceAttachmentUrl) {
        return window.resolveStudentServiceAttachmentUrl.apply(null, arguments);
    }
    ensureStudentServiceAttachmentsModule().catch(() => null);
    return '';
}

function isStudentServiceImageAttachment(file) {
    if (hasStudentServiceAttachmentsModule()
        && typeof window.isStudentServiceImageAttachment === 'function'
        && window.isStudentServiceImageAttachment !== isStudentServiceImageAttachment) {
        return window.isStudentServiceImageAttachment.apply(null, arguments);
    }
    ensureStudentServiceAttachmentsModule().catch(() => null);
    return false;
}

function isStudentServiceVideoAttachment(file) {
    if (hasStudentServiceAttachmentsModule()
        && typeof window.isStudentServiceVideoAttachment === 'function'
        && window.isStudentServiceVideoAttachment !== isStudentServiceVideoAttachment) {
        return window.isStudentServiceVideoAttachment.apply(null, arguments);
    }
    ensureStudentServiceAttachmentsModule().catch(() => null);
    return false;
}

function renderStudentServiceAttachmentGalleryMarkup(attachments = []) {
    if (hasStudentServiceAttachmentsModule()
        && typeof window.renderStudentServiceAttachmentGalleryMarkup === 'function'
        && window.renderStudentServiceAttachmentGalleryMarkup !== renderStudentServiceAttachmentGalleryMarkup) {
        return window.renderStudentServiceAttachmentGalleryMarkup.apply(null, arguments);
    }
    ensureStudentServiceAttachmentsModule().catch(() => null);
    return '';
}

function renderStudentServiceAttachmentChipsMarkup(composerId, drafts) {
    if (hasStudentServiceAttachmentsModule()
        && typeof window.renderStudentServiceAttachmentChipsMarkup === 'function'
        && window.renderStudentServiceAttachmentChipsMarkup !== renderStudentServiceAttachmentChipsMarkup) {
        return window.renderStudentServiceAttachmentChipsMarkup.apply(null, arguments);
    }
    ensureStudentServiceAttachmentsModule().catch(() => null);
    return '';
}

function renderStudentServiceAttachmentPickerMarkup(composerId, options = {}) {
    if (hasStudentServiceAttachmentsModule()
        && typeof window.renderStudentServiceAttachmentPickerMarkup === 'function'
        && window.renderStudentServiceAttachmentPickerMarkup !== renderStudentServiceAttachmentPickerMarkup) {
        return window.renderStudentServiceAttachmentPickerMarkup.apply(null, arguments);
    }
    ensureStudentServiceAttachmentsModule().catch(() => null);
    return '';
}

function pickStudentServiceAttachments(composerId) {
    if (hasStudentServiceAttachmentsModule()
        && typeof window.pickStudentServiceAttachments === 'function'
        && window.pickStudentServiceAttachments !== pickStudentServiceAttachments) {
        return window.pickStudentServiceAttachments.apply(null, arguments);
    }
    ensureStudentServiceAttachmentsModule().catch(() => null);
    return;
}

async function postStudentService(path, body = {}) {
    if (typeof kiuPortalFetch !== 'function') {
        throw new Error('Student Service backend is unavailable.');
    }
    if (STUDENT_SERVICE_RUNTIME.backendStale) {
        throw new Error(STUDENT_SERVICE_RUNTIME.backendStaleMessage || getStudentServiceBackendStaleMessage(''));
    }
    const resolvedPath = studentServiceApiPath(path);
    try {
        return await kiuPortalFetch(resolvedPath, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body || {})
        });
    } catch (error) {
        error.message = formatStudentServiceApiError(error, resolvedPath);
        throw error;
    }
}

async function submitStudentServiceTicket() {
    if (hasStudentServiceTicketsModule()
        && typeof window.submitStudentServiceTicket === 'function'
        && window.submitStudentServiceTicket !== submitStudentServiceTicket) {
        return window.submitStudentServiceTicket.apply(null, arguments);
    }
    ensureStudentServiceTicketsModule().catch(() => null);
    return null;
}

async function replyStudentServiceTicket() {
    if (hasStudentServiceTicketsModule()
        && typeof window.replyStudentServiceTicket === 'function'
        && window.replyStudentServiceTicket !== replyStudentServiceTicket) {
        return window.replyStudentServiceTicket.apply(null, arguments);
    }
    ensureStudentServiceTicketsModule().catch(() => null);
    return null;
}

async function updateStudentServiceTicketStatus(status) {
    if (hasStudentServiceTicketsModule()
        && typeof window.updateStudentServiceTicketStatus === 'function'
        && window.updateStudentServiceTicketStatus !== updateStudentServiceTicketStatus) {
        return window.updateStudentServiceTicketStatus.apply(null, arguments);
    }
    ensureStudentServiceTicketsModule().catch(() => null);
    return null;
}

async function assignStudentServiceTicketToCurrentUser() {
    if (hasStudentServiceTicketsModule()
        && typeof window.assignStudentServiceTicketToCurrentUser === 'function'
        && window.assignStudentServiceTicketToCurrentUser !== assignStudentServiceTicketToCurrentUser) {
        return window.assignStudentServiceTicketToCurrentUser.apply(null, arguments);
    }
    ensureStudentServiceTicketsModule().catch(() => null);
    return null;
}

async function submitStudentServiceQuestion() {
    if (hasStudentServiceQaModule()
        && typeof window.submitStudentServiceQuestion === 'function'
        && window.submitStudentServiceQuestion !== submitStudentServiceQuestion) {
        return window.submitStudentServiceQuestion.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
}

async function submitStudentServiceQuestionAnswer(questionId, triggerElement = null, options = {}) {
    if (hasStudentServiceQaModule()
        && typeof window.submitStudentServiceQuestionAnswer === 'function'
        && window.submitStudentServiceQuestionAnswer !== submitStudentServiceQuestionAnswer) {
        return window.submitStudentServiceQuestionAnswer.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
}

function patchStudentServiceOwnerResolutionUi(questionId) {
    const question = getStudentServiceQuestionById(questionId);
    if (!question) return false;
    const host = getStudentServiceQuestionThreadHost(questionId);
    const detail = host?.querySelector('.student-service-qa-detail');
    if (detail) {
        updateStudentServiceOwnerResolutionButtons(detail, question);
        const meta = detail.querySelector('.student-service-qa-detail-meta');
        if (meta) {
            meta.querySelectorAll('.student-service-pill--owner-answered, .student-service-pill--owner-unanswered').forEach(node => node.remove());
            const ownerPill = renderStudentServiceOwnerResolutionPillMarkup(question);
            if (ownerPill) meta.insertAdjacentHTML('beforeend', ownerPill);
        }
    }
    patchStudentServiceQuestionCardStats(questionId);
    return true;
}

async function setStudentServiceQuestionOwnerResolution(questionId, status, triggerButton = null) {
    if (hasStudentServiceQaModule()
        && typeof window.setStudentServiceQuestionOwnerResolution === 'function'
        && window.setStudentServiceQuestionOwnerResolution !== setStudentServiceQuestionOwnerResolution) {
        return window.setStudentServiceQuestionOwnerResolution.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
}

async function setStudentServiceQuestionFeedback(questionId, value, triggerButton = null) {
    if (hasStudentServiceQaModule()
        && typeof window.setStudentServiceQuestionFeedback === 'function'
        && window.setStudentServiceQuestionFeedback !== setStudentServiceQuestionFeedback) {
        return window.setStudentServiceQuestionFeedback.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
}

async function setStudentServiceAnswerFeedback(questionId, answerId, triggerButton = null) {
    if (hasStudentServiceQaModule()
        && typeof window.setStudentServiceAnswerFeedback === 'function'
        && window.setStudentServiceAnswerFeedback !== setStudentServiceAnswerFeedback) {
        return window.setStudentServiceAnswerFeedback.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
}

async function deleteStudentServiceArticle(articleId) {
    const normalizedArticleId = String(articleId || '').trim();
    if (!normalizedArticleId || !canShowStudentServiceArticleEditorActions()) return;
    const article = getStudentServiceArticleById(normalizedArticleId);
    if (!article) return;
    try {
        await postStudentService(STUDENT_SERVICE_API_PATHS.articlesDelete(normalizedArticleId), {});
        closeStudentServiceDeleteConfirm({ restoreThread: false });
        const ui = ensureStudentServiceUiState();
        if (ui.articleEditorId === normalizedArticleId || ui.selectedArticleId === normalizedArticleId) {
            ui.articleEditorId = '';
            ui.selectedArticleId = '';
            ui.articleDraftMode = false;
        }
        KIU_STATE.studentServiceArticles = (KIU_STATE.studentServiceArticles || [])
            .filter(item => String(item.id || '').trim() !== normalizedArticleId);
        pruneStudentHubArticleSelections(KIU_STATE.studentServiceArticles);
        await refreshStudentServiceDataAndRender();
    } catch (error) {
        console.error('Student Service article deletion failed.', error);
        const confirmBtn = document.querySelector('[data-student-service-confirm-article-delete]');
        flashStudentServiceActionButton(confirmBtn, 'error');
        alert(error?.message || 'Article could not be removed.');
    }
}

async function deleteStudentServiceQuestion(questionId) {
    if (hasStudentServiceQaModule()
        && typeof window.deleteStudentServiceQuestion === 'function'
        && window.deleteStudentServiceQuestion !== deleteStudentServiceQuestion) {
        return window.deleteStudentServiceQuestion.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
}

async function deleteStudentServiceQuestionAnswer(questionId, answerId) {
    if (hasStudentServiceQaModule()
        && typeof window.deleteStudentServiceQuestionAnswer === 'function'
        && window.deleteStudentServiceQuestionAnswer !== deleteStudentServiceQuestionAnswer) {
        return window.deleteStudentServiceQuestionAnswer.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
}

async function publishStudentServiceQuestion(questionId) {
    if (hasStudentServiceQaModule()
        && typeof window.publishStudentServiceQuestion === 'function'
        && window.publishStudentServiceQuestion !== publishStudentServiceQuestion) {
        return window.publishStudentServiceQuestion.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
}

async function toggleStudentServiceQuestionFlag(questionId, field, value) {
    if (hasStudentServiceQaModule()
        && typeof window.toggleStudentServiceQuestionFlag === 'function'
        && window.toggleStudentServiceQuestionFlag !== toggleStudentServiceQuestionFlag) {
        return window.toggleStudentServiceQuestionFlag.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
}

async function convertStudentServiceQuestionToTicket(questionId) {
    if (hasStudentServiceQaModule()
        && typeof window.convertStudentServiceQuestionToTicket === 'function'
        && window.convertStudentServiceQuestionToTicket !== convertStudentServiceQuestionToTicket) {
        return window.convertStudentServiceQuestionToTicket.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
}

async function convertStudentServiceQuestionToArticle(questionId) {
    if (hasStudentServiceQaModule()
        && typeof window.convertStudentServiceQuestionToArticle === 'function'
        && window.convertStudentServiceQuestionToArticle !== convertStudentServiceQuestionToArticle) {
        return window.convertStudentServiceQuestionToArticle.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
}

async function mergeStudentServiceQuestionPrompt(questionId) {
    if (hasStudentServiceQaModule()
        && typeof window.mergeStudentServiceQuestionPrompt === 'function'
        && window.mergeStudentServiceQuestionPrompt !== mergeStudentServiceQuestionPrompt) {
        return window.mergeStudentServiceQuestionPrompt.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return null;
}

function applyStudentServiceMacro(macroId) {
    const role = getEffectiveUserRole();
    if (![USER_ROLES.ADMIN, USER_ROLES.STUDENT_SERVICE].includes(role)) return;
    const { macros } = ensureStudentServiceStores();
    const macro = macros.find(item => item.id === macroId);
    if (!macro) return;
    const textarea = document.getElementById('student-service-staff-reply');
    if (!textarea) return;
    const existing = textarea.value.trim();
    textarea.value = existing ? `${existing}\n\n${macro.message}` : macro.message;
    textarea.focus();
}

async function addStudentServiceInternalNote() {
    if (hasStudentServiceTicketsModule()
        && typeof window.addStudentServiceInternalNote === 'function'
        && window.addStudentServiceInternalNote !== addStudentServiceInternalNote) {
        return window.addStudentServiceInternalNote.apply(null, arguments);
    }
    ensureStudentServiceTicketsModule().catch(() => null);
    return null;
}

async function updateStudentServiceHandoff() {
    if (hasStudentServiceTicketsModule()
        && typeof window.updateStudentServiceHandoff === 'function'
        && window.updateStudentServiceHandoff !== updateStudentServiceHandoff) {
        return window.updateStudentServiceHandoff.apply(null, arguments);
    }
    ensureStudentServiceTicketsModule().catch(() => null);
    return null;
}

function renderStudentServiceCollapsibleSection(sectionKey, title, content) {
    const ui = ensureStudentServiceUiState();
    const isOpen = Boolean(ui.detailSections?.[sectionKey]);
    return `
        <div class="content-box surface-card student-service-detail-card">
            <button type="button" class="student-service-detail-toggle" data-student-service-detail-section="${ssEscape(sectionKey)}">
                <span class="student-service-detail-title">${ssEscape(title)}</span>
                <span class="student-service-detail-icon">${isOpen ? '&minus;' : '+'}</span>
            </button>
            ${isOpen ? `<div class="student-service-detail-body">${content}</div>` : ''}
        </div>
    `;
}

function editStudentServiceArticle(articleId) {
    const ui = ensureStudentServiceUiState();
    const nextArticleId = articleId || '';
    if (
        ui.serviceLane === 'service'
        && ui.staffPanel === 'articles'
        && ui.articleEditorId === nextArticleId
        && ui.selectedArticleId === nextArticleId
    ) {
        return;
    }
    ui.serviceLane = 'service';
    ui.staffPanel = 'articles';
    ui.articleDraftMode = false;
    ui.articleEditorId = nextArticleId;
    ui.selectedArticleId = nextArticleId;
    const article = ensureStudentServiceStores().articles.find(item => item.id === nextArticleId);
    if (article?.serviceArea) {
        ui.activeSupportArea = getStudentServiceSupportArea(article.serviceArea).id;
    }
    invalidateStudentServiceRenderSignature();
    renderStudentServicePage();
}

async function saveStudentServiceArticle(publish) {
    if (!canShowStudentServiceArticleEditorActions()) return;
    await syncStudentServiceWorkspaceBackendSession();
    if (!canCurrentUserModerateStudentService()) {
        alert('Only Student Service staff can save articles.');
        return;
    }
    const currentUser = getStudentServiceCurrentUser();
    if (!currentUser) return;
    const title = document.getElementById('student-service-article-title')?.value.trim() || '';
    const summary = document.getElementById('student-service-article-summary')?.value.trim() || '';
    const content = document.getElementById('student-service-article-content')?.value.trim() || '';
    if (!title || !summary || !content) {
        alert('Please complete article title, summary, and content.');
        return;
    }
    const ui = ensureStudentServiceUiState();
    const articleId = ui.articleEditorId || `svc-article-${Date.now()}`;
    const supportArea = getStudentServiceSupportArea(resolveStudentServiceArticleServiceAreaId(ui));
    try {
        const payload = await postStudentService(STUDENT_SERVICE_API_PATHS.articlesCreate(), {
            id: articleId,
            title,
            summary,
            content,
            serviceArea: supportArea.id,
            category: supportArea.category,
            published: Boolean(publish)
        });
        const article = payload?.article || null;
        ui.serviceLane = 'service';
        ui.staffPanel = 'articles';
        ui.articleDraftMode = false;
        ui.articleEditorId = article?.id || articleId;
        ui.selectedArticleId = article?.id || articleId;
        await refreshStudentServiceDataAndRender();
    } catch (error) {
        console.error('Student Service article save failed.', error);
        alert(error?.message || 'Article could not be saved.');
    }
}

function startStudentServiceNewArticle() {
    const ui = ensureStudentServiceUiState();
    ui.serviceLane = 'service';
    ui.staffPanel = 'articles';
    ui.articleDraftMode = true;
    ui.articleEditorId = '';
    ui.selectedArticleId = '';
    invalidateStudentServiceRenderSignature();
    renderStudentServicePage();
}

function getStudentServicePageLabel(pageId) {
    const labels = {
        'student-service': 'Support Hub',
        registration: 'Registration',
        'study-card': 'Study Card',
        timetable: 'Timetable',
        orders: 'Orders',
        library: 'Library',
        chancellery: 'E-Chancellery',
        profile: 'Profile'
    };
    return labels[pageId] || pageId;
}

function buildStudentServiceLaneMetrics(role, currentUser, visibleArticles, visibleTickets) {
    const totalTickets = Array.isArray(visibleTickets) ? visibleTickets : [];
    const totalArticles = Array.isArray(visibleArticles) ? visibleArticles : [];
    const visibleQuestions = getStudentServiceVisibleQuestions();
    const myTickets = currentUser?.id
        ? totalTickets.filter(ticket => String(ticket.studentId || '') === String(currentUser.id || '')).length
        : 0;
    const myQuestionRecords = currentUser?.id
        ? visibleQuestions.filter(question => String(question.authorId || '') === String(currentUser.id || ''))
        : [];
    const myQuestions = myQuestionRecords.length;
    const myPublishedQuestions = myQuestionRecords.filter(question => question.status === 'published').length;
    const myAnsweredQuestions = myQuestionRecords.filter(question => (question.answers || []).some(answer => answer.status === 'published')).length;
    const myAcceptedQuestions = myQuestionRecords.filter(question => Boolean(question.acceptedAnswerId)).length;
    const openTickets = totalTickets.filter(ticket => !['Resolved', 'Closed'].includes(ticket.status));
    const publishedQuestions = visibleQuestions.filter(question => question.status === 'published').length;
    const unansweredQuestions = visibleQuestions.filter(question => !(question.answers || []).some(answer => answer.status === 'published')).length;
    const waitingForService = totalTickets.filter(ticket => ticket.status === 'Waiting for Service').length;
    const waitingForStudent = totalTickets.filter(ticket => ticket.status === 'Waiting for Student').length;

    return {
        totalTickets,
        totalArticles,
        visibleQuestions,
        myTickets,
        myQuestions,
        myPublishedQuestions,
        myAnsweredQuestions,
        myAcceptedQuestions,
        openTickets,
        publishedQuestions,
        unansweredQuestions,
        waitingForService,
        waitingForStudent,
        servicePrimaryCount: role === USER_ROLES.STUDENT ? myTickets : openTickets.length,
        qaPrimaryCount: role === USER_ROLES.STUDENT ? myQuestions : unansweredQuestions
    };
}

function renderStudentServiceChooserHeader() {
    return `
        <section class="student-service-command-bar-shell student-service-command-bar-shell--chooser">
            <div class="student-service-command-bar">
                <strong class="student-service-command-bar-title">Student Service</strong>
                <span class="student-service-command-bar-metrics">Choose how you want help</span>
            </div>
        </section>
    `;
}

function renderStudentServiceQaCommandBarStats(role, metrics, ui) {
    if (hasStudentServiceQaModule()
        && typeof window.renderStudentServiceQaCommandBarStats === 'function'
        && window.renderStudentServiceQaCommandBarStats !== renderStudentServiceQaCommandBarStats) {
        return window.renderStudentServiceQaCommandBarStats.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return '';
}

function renderStudentServiceStaffPanelSwitchMarkup(panel = 'tickets') {
    const activePanel = panel === 'articles' ? 'articles' : 'tickets';
    return `
        <div class="student-service-panel-switch student-service-desk-mode-switch" role="group" aria-label="Desk mode">
            <button type="button" class="student-service-desk-mode-btn ${activePanel === 'tickets' ? 'is-active lux-primary-btn' : 'lux-secondary-btn'}" data-student-service-panel-switch="tickets"><i class="fas fa-inbox"></i> Inbox</button>
            <button type="button" class="student-service-desk-mode-btn ${activePanel === 'articles' ? 'is-active lux-primary-btn' : 'lux-secondary-btn'}" data-student-service-panel-switch="articles"><i class="fas fa-book-open"></i> Knowledge</button>
        </div>
    `;
}

function renderStudentServiceCommandBar(role, selectedLane, ui, metrics) {
    if (!selectedLane) return '';
    const responderOnly = [USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(role) && !canCurrentUserModerateStudentService();
    const isStudent = role === USER_ROLES.STUDENT;
    const panel = ui.staffPanel || 'tickets';
    const laneTabs = `
        <div class="student-service-command-bar-segment" role="group" aria-label="Workspace lanes">
            <button type="button" class="student-service-command-bar-btn ${selectedLane === 'service' ? 'is-active lux-primary-btn' : 'lux-secondary-btn'}" data-student-service-lane="service" aria-pressed="${selectedLane === 'service' ? 'true' : 'false'}"><i class="fas fa-headset"></i> ${isStudent ? 'Help' : 'Service'}</button>
            <button type="button" class="student-service-command-bar-btn ${selectedLane === 'qa' ? 'is-active lux-primary-btn' : 'lux-secondary-btn'}" data-student-service-lane="qa" aria-pressed="${selectedLane === 'qa' ? 'true' : 'false'}"><i class="fas fa-comments"></i> Q&A</button>
        </div>
    `;
    let modeTabs = '';
    if (isStudent && selectedLane === 'service') {
        modeTabs = `
            <div class="student-service-command-bar-segment" role="group" aria-label="Student tabs">
                <button type="button" class="student-service-command-bar-btn ${ui.studentTab !== 'my_tickets' ? 'is-active lux-primary-btn' : 'lux-secondary-btn'}" data-student-service-student-tab="get_help"><i class="fas fa-paper-plane"></i> Get help</button>
                <button type="button" class="student-service-command-bar-btn ${ui.studentTab === 'my_tickets' ? 'is-active lux-primary-btn' : 'lux-secondary-btn'}" data-student-service-student-tab="my_tickets"><i class="fas fa-inbox"></i> My tickets</button>
            </div>
        `;
    }
    const metricsLine = selectedLane === 'service'
        ? (isStudent
            ? `${metrics.servicePrimaryCount} tickets · ${metrics.totalArticles.length} articles`
            : `${metrics.servicePrimaryCount} open · ${metrics.waitingForService + metrics.waitingForStudent} waiting · ${metrics.totalArticles.length} articles`)
        : '';
    let actions = '';
    if (!isStudent && selectedLane === 'service' && !responderOnly && panel === 'tickets' && canCurrentUserModerateStudentService()) {
        actions = `
            <div class="student-service-command-bar-actions">
                <button type="button" class="student-service-mini-action" data-student-service-edit-inbox-filters="true"><i class="fas fa-pen"></i> Edit layout</button>
            </div>
        `;
    } else if (selectedLane === 'qa' && isStudent) {
        actions = `<button type="button" class="lux-primary-btn student-service-command-bar-cta" data-student-service-question-composer-toggle="open"><i class="fas fa-pen"></i> Ask</button>`;
    }
    const title = isStudent
        ? 'Student Service'
        : (role === USER_ROLES.STUDENT_SERVICE ? 'Student Service Workspace' : 'Student Service');
    if (selectedLane === 'qa') {
        return `
            <section class="student-service-command-bar-shell student-service-command-bar-shell--qa" data-student-service-command-bar="true">
                <div class="student-service-command-bar student-service-command-bar--qa">
                    <div class="student-service-command-bar-top">
                        <div class="student-service-command-bar-main">
                            ${laneTabs}
                        </div>
                        <div class="student-service-command-bar-meta">
                            ${renderStudentServiceQaCommandBarStats(role, metrics, ui)}
                            ${actions}
                        </div>
                    </div>
                </div>
            </section>
        `;
    }
    const studentModeTabs = modeTabs
        ? `<div class="student-service-command-bar-actions">${modeTabs}</div>`
        : '';
    return `
        <section class="student-service-command-bar-shell" data-student-service-command-bar="true">
            <div class="student-service-command-bar">
                <div class="student-service-command-bar-main">
                    <strong class="student-service-command-bar-title">${ssEscape(title)}</strong>
                    ${laneTabs}
                </div>
                <div class="student-service-command-bar-meta">
                    <span class="student-service-command-bar-metrics">${ssEscape(metricsLine)}</span>
                    ${studentModeTabs}
                    ${actions}
                </div>
            </div>
        </section>
    `;
}

function renderStudentServiceLaneSwitcher(selectedLane) {
    if (!selectedLane) return '';
    return `
        <section class="student-service-lane-switcher-shell">
            <div class="student-service-lane-switcher-copy">
                <div class="student-service-kicker">Workspace lanes</div>
                <div class="student-service-zone-copy">Switch between public Q&A and private Student Service without leaving the page.</div>
            </div>
            <div class="student-service-lane-switcher" role="group" aria-label="Workspace lanes">
                <button type="button" class="student-service-lane-switcher-btn ${selectedLane === 'service' ? 'is-active lux-primary-btn' : 'lux-secondary-btn'}" data-student-service-lane="service" aria-pressed="${selectedLane === 'service' ? 'true' : 'false'}"><i class="fas fa-headset"></i> Student Service</button>
                <button type="button" class="student-service-lane-switcher-btn ${selectedLane === 'qa' ? 'is-active lux-primary-btn' : 'lux-secondary-btn'}" data-student-service-lane="qa" aria-pressed="${selectedLane === 'qa' ? 'true' : 'false'}"><i class="fas fa-comments"></i> Q&A</button>
                <button type="button" class="student-service-lane-switcher-reset student-service-mini-action" data-student-service-clear-lane="true"><i class="fas fa-border-all"></i> Choose again</button>
            </div>
        </section>
    `;
}

function renderStudentServiceLaneChooser(role, currentUser, visibleArticles, visibleTickets) {
    const metrics = buildStudentServiceLaneMetrics(role, currentUser, visibleArticles, visibleTickets);
    const serviceCopy = role === USER_ROLES.STUDENT
        ? 'Private help, official rules, and tracked ticket threads when the issue is personal or sensitive.'
        : [USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(role)
            ? 'Read official guidance and see where private student cases stay with Student Service.'
            : 'Private queue work, article publishing, and operational service follow-up.'
    ;
    const qaCopy = role === USER_ROLES.STUDENT
        ? 'Browse the campus feed, post questions instantly, and reply in open threads.'
        : [USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(role)
            ? 'Answer faculty-scoped questions in open chat threads alongside students and staff.'
            : 'Moderate threads, pin useful answers, and keep the public feed healthy.'
    ;

    return `
        <div class="student-service-lane-chooser">
            <section class="student-service-zone student-service-zone-chooser">
                <div class="student-service-lane-choice-grid" role="group" aria-label="Choose Student Service lane">
                    <button type="button" class="student-service-lane-choice-card student-service-lane-choice-card--service" data-student-service-lane="service">
                        <div class="student-service-lane-choice-kicker">Private support</div>
                        <div class="student-service-lane-choice-title">Student Service</div>
                        <div class="student-service-lane-choice-copy">${ssEscape(serviceCopy)}</div>
                        <div class="student-service-lane-choice-stats">
                            <span>${metrics.servicePrimaryCount} ${role === USER_ROLES.STUDENT ? 'my tickets' : 'active tickets'}</span>
                            <span>${metrics.totalArticles.length} guidance articles</span>
                        </div>
                        <span class="student-service-lane-choice-cta">Open Student Service <i class="fas fa-arrow-right"></i></span>
                    </button>
                    <button type="button" class="student-service-lane-choice-card student-service-lane-choice-card--qa" data-student-service-lane="qa">
                        <div class="student-service-lane-choice-kicker">Public answers</div>
                        <div class="student-service-lane-choice-title">Q&A</div>
                        <div class="student-service-lane-choice-copy">${ssEscape(qaCopy)}</div>
                        <div class="student-service-lane-choice-stats">
                            <span>${metrics.publishedQuestions} published questions</span>
                            <span>${metrics.qaPrimaryCount} ${role === USER_ROLES.STUDENT ? 'my questions' : 'unanswered'}</span>
                        </div>
                        <span class="student-service-lane-choice-cta">Open Q&A <i class="fas fa-arrow-right"></i></span>
                    </button>
                </div>
            </section>
        </div>
    `;
}

function ensureStudentServicePageShell(container) {
    if (!container) return null;
    let shell = container.querySelector('[data-student-service-page-shell="1"]');
    if (!shell) {
        const range = document.createRange();
        range.selectNodeContents(container);
        container.replaceChildren(range.createContextualFragment(`
            <div class="student-service-shell" data-student-service-page-shell="1">
                <div data-student-service-page-hero="1"></div>
                <div data-student-service-page-switcher="1"></div>
                <div data-student-service-page-workflow="1"></div>
                <div data-student-service-page-overview="1"></div>
                <section id="student-service-page-body" class="student-service-canvas">
                    <div class="student-service-loading-state">
                        <i class="fas fa-spinner fa-spin student-service-loading-icon"></i>
                        Loading Student Service Center...
                    </div>
                </section>
            </div>
        `));
        shell = container.querySelector('[data-student-service-page-shell="1"]');
    }
    return {
        hero: shell?.querySelector('[data-student-service-page-hero="1"]') || null,
        switcher: shell?.querySelector('[data-student-service-page-switcher="1"]') || null,
        workflow: shell?.querySelector('[data-student-service-page-workflow="1"]') || null,
        overview: shell?.querySelector('[data-student-service-page-overview="1"]') || null,
        body: shell?.querySelector('#student-service-page-body') || null
    };
}

function renderStudentServiceHeroMarkup(role, roleLabel, titleByRole, copyByRole, selectedLane, badgePrimary, badgeSecondary, heroActions, metrics) {
    const asideTitle = !selectedLane
        ? 'Pick a lane'
        : selectedLane === 'qa'
            ? 'Public answer lane'
            : 'Private support lane';
    const asideCopy = !selectedLane
        ? 'Choose the public Q&A lane or the private Student Service lane to open a focused workspace.'
        : selectedLane === 'qa'
            ? 'Use this lane for open chat threads, cross-faculty browsing, and instant public questions.'
            : 'Use this lane for direct Student Service contact, official rules, and private ticket tracking.';
    const asideStats = selectedLane === 'qa'
        ? [
            { label: 'Published', value: metrics.publishedQuestions },
            { label: role === USER_ROLES.STUDENT ? 'Mine' : 'Unanswered', value: metrics.qaPrimaryCount },
            { label: 'Threads', value: metrics.visibleQuestions.length }
        ]
        : [
            { label: role === USER_ROLES.STUDENT ? 'Mine' : 'Open', value: metrics.servicePrimaryCount },
            { label: 'Waiting', value: metrics.waitingForService + metrics.waitingForStudent },
            { label: 'Articles', value: metrics.totalArticles.length }
        ];

    return `
        <section class="student-service-hero-shell">
            <div class="admin-hero student-service-hero lux-hero-stage">
                <div class="student-service-hero-main-shell">
                    <div class="student-service-hero-main lux-hero-main">
                        <div class="student-service-hero-kicker"><i class="fas fa-headset"></i> Split support workspace</div>
                        <div class="student-service-hero-title">${ssEscape(titleByRole[role] || 'Student Service Center')}</div>
                        <div class="student-service-hero-copy">${ssEscape(copyByRole[role] || 'Track service requests and publish guidance from one organized workspace.')}</div>
                        <div class="student-service-hero-meta">
                            <span class="student-service-hero-badge student-service-hero-badge--role"><i class="fas fa-user-shield"></i> ${ssEscape(roleLabel)}</span>
                            <span class="student-service-hero-badge student-service-hero-badge--lane"><i class="fas ${selectedLane === 'qa' ? 'fa-comments' : 'fa-inbox'}"></i> ${ssEscape(badgePrimary)}</span>
                            <span class="student-service-hero-badge student-service-hero-badge--knowledge"><i class="fas fa-book-open"></i> ${ssEscape(badgeSecondary)}</span>
                        </div>
                        <div class="student-service-hero-actions student-service-hero-action-cluster">
                            ${heroActions.map(item => `
                                <button type="button" class="student-service-hero-action ${ssEscape(item.buttonClass || 'lux-secondary-btn student-service-hero-action--secondary')}"
                                    ${item.actionType === 'lane' ? `data-student-service-lane="${ssEscape(item.actionValue || '')}"` : ''}
                                    ${item.actionType === 'composer' ? 'data-student-service-question-composer-toggle="open"' : ''}
                                    ${item.actionType === 'student-tab' ? `data-student-service-student-tab="${ssEscape(item.actionValue || '')}"` : ''}
                                    ${item.actionType === 'focus-area' ? `data-student-service-focus-area="${ssEscape(item.actionValue || '')}"` : ''}
                                    ${item.actionType === 'panel-switch' ? `data-student-service-panel-switch="${ssEscape(item.actionValue || '')}"` : ''}>
                                    <i class="${ssEscape(item.icon)}"></i>
                                    <span>${ssEscape(item.label)}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="student-service-hero-aside-shell">
                    <div class="student-service-hero-aside lux-hero-side">
                        <div class="student-service-hero-aside-head">
                            <span class="student-service-hero-aside-kicker">Workspace lens</span>
                            <strong class="student-service-hero-aside-title">${ssEscape(asideTitle)}</strong>
                            <span class="student-service-hero-aside-copy">${ssEscape(asideCopy)}</span>
                        </div>
                        <div class="student-service-hero-aside-grid lux-hero-signal-list">
                            ${asideStats.map(stat => `
                                <div class="student-service-hero-aside-stat lux-hero-signal">
                                    <span class="student-service-hero-aside-stat-label">${ssEscape(stat.label)}</span>
                                    <strong class="student-service-hero-aside-stat-value">${ssEscape(String(stat.value))}</strong>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    `;
}

function renderStudentServiceWorkflowMarkup(workflowSteps) {
    return workflowSteps.length ? `
        <section class="student-service-workflow-section">
            <div class="student-service-workflow-strip">
            ${workflowSteps.map((step, index) => `
                <article class="student-service-workflow-step">
                    <div class="student-service-workflow-step-index">${index + 1}</div>
                    <div class="student-service-workflow-step-icon"><i class="${ssEscape(step.icon)}"></i></div>
                    <div class="student-service-workflow-step-copy">
                        <strong class="student-service-workflow-step-title">${ssEscape(step.title)}</strong>
                        <span class="student-service-workflow-step-description">${ssEscape(step.copy)}</span>
                    </div>
                </article>
            `).join('')}
            </div>
        </section>
    ` : '';
}

function renderStudentServiceOverviewMarkup(showOverview) {
    if (!showOverview) return '';
    return `
        <section class="only-service student-service-overview surface-card">
            <div class="student-service-overview-head">
                <div>
                    <div class="student-service-overview-kicker">Student Service operations</div>
                    <div class="student-service-overview-title">Desk overview</div>
                </div>
                <span class="student-service-overview-pill">Live</span>
            </div>
            <div id="student-service-home-workspace"></div>
        </section>
    `;
}

function renderStudentServicePageChromeRebuilt(role, currentUser, visibleArticles, visibleTickets) {
    const container = document.getElementById('page-student-service');
    if (!container) return;
    const ui = ensureStudentServiceUiState();
    const selectedLane = getStudentServiceLane();
    const responderOnly = [USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(role) && !canCurrentUserModerateStudentService();
    const metrics = buildStudentServiceLaneMetrics(role, currentUser, visibleArticles, visibleTickets);
    const roleLabel = ssRoleLabel(role);
    const titleByRole = {
        student: 'Student Service Center',
        student_service: 'Student Service Workspace',
        admin: 'Student Service Operations',
        professor: 'Student Service Center',
        ta: 'Student Service Center'
    };
    const copyByRole = {
        student: 'Choose between private Student Service help and public Q&A, then stay in the lane that fits the request.',
        student_service: 'Keep private service work and public Q&A separated while still managing both from one route.',
        admin: 'Oversee private service operations and public Q&A from a cleaner split workspace.',
        professor: 'Move between official Student Service guidance and faculty-scoped public Q&A without the mixed desk layout.',
        ta: 'Move between official Student Service guidance and faculty-scoped public Q&A without the mixed desk layout.'
    };
    const badgePrimary = selectedLane === 'qa'
        ? (role === USER_ROLES.STUDENT ? `${metrics.myQuestions} my questions` : `${metrics.unansweredQuestions} unanswered`)
        : `${selectedLane === 'service' ? metrics.servicePrimaryCount : metrics.totalArticles.length} ${selectedLane === 'service' ? (role === USER_ROLES.STUDENT ? 'my tickets' : 'open tickets') : 'articles'}`;
    const badgeSecondary = selectedLane === 'qa'
        ? `${metrics.publishedQuestions} published`
        : `${metrics.totalArticles.length} articles`;
    const heroActions = !selectedLane
        ? [
            { icon: 'fas fa-headset', label: 'Open Student Service', actionType: 'lane', actionValue: 'service', buttonClass: 'lux-primary-btn student-service-hero-action--primary' },
            { icon: 'fas fa-comments', label: 'Open Q&A', actionType: 'lane', actionValue: 'qa', buttonClass: 'lux-secondary-btn student-service-hero-action--secondary' }
        ]
        : selectedLane === 'qa'
            ? (role === USER_ROLES.STUDENT
                ? [
                    { icon: 'fas fa-pen', label: 'Ask question', actionType: 'composer', buttonClass: 'lux-primary-btn student-service-hero-action--primary' },
                    { icon: 'fas fa-lock', label: 'Need private help', actionType: 'lane', actionValue: 'service', buttonClass: 'lux-secondary-btn student-service-hero-action--secondary' }
                ]
                : [
                    { icon: 'fas fa-comments', label: responderOnly ? 'Answer questions' : 'Review Q&A', actionType: 'lane', actionValue: 'qa', buttonClass: 'lux-primary-btn student-service-hero-action--primary' },
                    { icon: 'fas fa-headset', label: 'Student Service', actionType: 'lane', actionValue: 'service', buttonClass: 'lux-secondary-btn student-service-hero-action--secondary' }
                ])
            : (role === USER_ROLES.STUDENT
                ? [
                    { icon: 'fas fa-headset', label: 'Contact Student Service', actionType: 'student-tab', actionValue: 'get_help', buttonClass: 'lux-primary-btn student-service-hero-action--primary' },
                    { icon: 'fas fa-comments', label: 'My tickets', actionType: 'student-tab', actionValue: 'my_tickets', buttonClass: 'lux-secondary-btn student-service-hero-action--secondary' },
                    { icon: 'fas fa-book-open', label: 'Rules & guidance', actionType: 'focus-area', actionValue: 'general', buttonClass: 'lux-secondary-btn student-service-hero-action--secondary' }
                ]
                : responderOnly
                    ? [
                        { icon: 'fas fa-comments', label: 'Open Q&A', actionType: 'lane', actionValue: 'qa', buttonClass: 'lux-primary-btn student-service-hero-action--primary' },
                        { icon: 'fas fa-book-open', label: 'Guidance', actionType: 'lane', actionValue: 'service', buttonClass: 'lux-secondary-btn student-service-hero-action--secondary' }
                    ]
                    : [
                        { icon: 'fas fa-inbox', label: 'Open inbox', actionType: 'panel-switch', actionValue: 'tickets', buttonClass: 'lux-primary-btn student-service-hero-action--primary' },
                        { icon: 'fas fa-book-open', label: 'Knowledge base', actionType: 'panel-switch', actionValue: 'articles', buttonClass: 'lux-secondary-btn student-service-hero-action--secondary' },
                        { icon: 'fas fa-comments', label: 'Q&A lane', actionType: 'lane', actionValue: 'qa', buttonClass: 'lux-secondary-btn student-service-hero-action--secondary' }
                    ]);
    const workflowSteps = !selectedLane
        ? [
            { icon: 'fas fa-sitemap', title: 'Pick a lane', copy: 'Start in public Q&A or private Student Service depending on the request.' },
            { icon: 'fas fa-eye', title: 'Stay focused', copy: 'The page keeps only the tools that belong to the lane you opened.' },
            { icon: 'fas fa-right-left', title: 'Switch anytime', copy: 'Move between lanes from the persistent switcher without losing context.' }
        ]
        : selectedLane === 'qa'
            ? [
                { icon: 'fas fa-search', title: 'Search first', copy: 'Browse published questions and similar answers before posting.' },
                { icon: 'fas fa-pen-nib', title: 'Ask clearly', copy: 'Students post new threads instantly; choose private mode only for sensitive cases.' },
                { icon: 'fas fa-circle-check', title: 'Join the thread', copy: 'Anyone in the thread can reply and mark comments as helpful.' }
            ]
            : [
                { icon: 'fas fa-paper-plane', title: 'Send one request', copy: 'Open a private Student Service thread with the right topic and context.' },
                { icon: 'fas fa-comments', title: 'Continue the thread', copy: 'Return to the ticket lane to follow replies and status updates.' }
            ];
    const shell = ensureStudentServicePageShell(container);
    if (!shell) return;

    if (selectedLane) {
        setStudentServiceMarkup(
            shell.hero,
            `student-service-page:command-bar:${selectedLane}:${ui.staffPanel || ''}:${ui.studentTab || ''}:${ui.qaSearch || ''}:${metrics.unansweredQuestions}:${metrics.publishedQuestions}:${metrics.myQuestions}`,
            renderStudentServiceCommandBar(role, selectedLane, ui, metrics)
        );
        setStudentServiceMarkup(shell.switcher, 'student-service-page:switcher', '');
        setStudentServiceMarkup(shell.workflow, 'student-service-page:workflow', '');
        setStudentServiceMarkup(
            shell.overview,
            `student-service-page:overview:${STUDENT_SERVICE_RUNTIME.loadFailed ? 'failed' : 'ok'}`,
            STUDENT_SERVICE_RUNTIME.loadFailed ? renderStudentServiceBootstrapErrorBanner() : ''
        );
        return;
    }

    setStudentServiceMarkup(shell.hero, 'student-service-page:chooser-header', renderStudentServiceChooserHeader());
    setStudentServiceMarkup(shell.switcher, 'student-service-page:switcher', '');
    setStudentServiceMarkup(shell.workflow, 'student-service-page:workflow', '');
    setStudentServiceMarkup(
        shell.overview,
        `student-service-page:overview:${STUDENT_SERVICE_RUNTIME.loadFailed ? 'failed' : 'ok'}`,
        STUDENT_SERVICE_RUNTIME.loadFailed ? renderStudentServiceBootstrapErrorBanner() : ''
    );
}

function renderStudentServiceHomeWorkspace() {
    return renderStudentServiceHomeWorkspaceRebuilt();
}

function renderStudentServiceStudentView(container, visibleArticles, visibleTickets) {
    return renderStudentServiceStudentViewRebuilt(container, visibleArticles, visibleTickets);
}

function renderStudentServiceStaffView(container, visibleArticles, visibleTickets) {
    return renderStudentServiceStaffViewRebuilt(container, visibleArticles, visibleTickets);
}

function renderStudentServiceStudentViewRebuilt(container, visibleArticles, visibleTickets) {
    const ui = ensureStudentServiceUiState();
    const lane = getStudentServiceLane();
    if (lane === 'qa') {
        return renderStudentServiceStudentQaHub(container);
    }
    return ui.studentTab === 'my_tickets'
        ? renderStudentServiceMyTicketsHub(container, visibleTickets)
        : renderStudentServiceStudentHub(container, visibleArticles, visibleTickets);
}

function renderStudentServiceStaffViewRebuilt(container, visibleArticles, visibleTickets) {
    const role = getEffectiveUserRole();
    const lane = getStudentServiceLane();
    const responderOnly = [USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(role) && !canCurrentUserModerateStudentService();
    if (lane === 'qa') {
        return renderStudentServiceStaffWorkbench(container, visibleArticles, visibleTickets, { lane: 'qa' });
    }
    if (responderOnly) {
        return renderStudentServiceResponderServiceLane(container, visibleArticles);
    }
    return renderStudentServiceStaffWorkbench(container, visibleArticles, visibleTickets, { lane: 'service' });
}

function buildStudentServiceChromeSignature(role, currentUser, visibleArticles, visibleTickets) {
    const ui = ensureStudentServiceUiState();
    const metrics = buildStudentServiceLaneMetrics(role, currentUser, visibleArticles, visibleTickets);
    return [
        role,
        String(currentUser?.id || ''),
        getStudentServiceLane(),
        ui.studentTab || '',
        ui.staffPanel || '',
        metrics.servicePrimaryCount,
        metrics.myQuestions,
        metrics.unansweredQuestions,
        metrics.publishedQuestions,
        metrics.totalArticles.length,
        visibleArticles.length,
        visibleTickets.length,
        STUDENT_SERVICE_RUNTIME.loaded ? 'loaded' : 'loading',
        STUDENT_SERVICE_RUNTIME.loadFailed ? 'failed' : 'ok'
    ].join('|');
}

function buildStudentServiceBodySignature(role, currentUser, visibleArticles, visibleTickets) {
    const ui = ensureStudentServiceUiState();
    return [
        role,
        String(currentUser?.id || ''),
        getStudentServiceLane(),
        ui.staffPanel || '',
        ui.studentTab || '',
        ui.articleSearch || '',
        ui.ticketSearch || '',
        ui.ticketStatus || '',
        ui.ticketCategory || '',
        ui.ticketServiceArea || '',
        ui.ticketAssignee || '',
        ui.ticketFaculty || '',
        ui.selectedTicketId || '',
        ui.selectedArticleId || '',
        ui.articleEditorId || '',
        ui.articleDraftMode ? '1' : '0',
        ui.qaSearch || '',
        ui.draftQuestion?.askMode || 'public',
        ui.draftQuestion?.anonymousMode ? '1' : '0',
        JSON.stringify(ui.customTicketFilters || {}),
        JSON.stringify(getStudentServicePublishedInboxFilterLayout().filters || []),
        ui.activeSupportArea || '',
        visibleArticles.length,
        buildStudentServiceArticleFingerprint(visibleArticles),
        visibleTickets.length,
        buildStudentServiceQaContentFingerprint(getStudentServiceFilteredQuestions(getStudentServiceVisibleQuestions())),
        STUDENT_SERVICE_RUNTIME.loaded ? 'loaded' : 'loading',
        STUDENT_SERVICE_RUNTIME.loadFailed ? 'failed' : 'ok',
        hasStudentServiceQaModule() ? 'qa-ready' : 'qa-pending',
        hasStudentServiceServiceModule() ? 'service-ready' : 'service-pending'
    ].join('|');
}

function buildStudentServiceRenderSignature(role, currentUser, visibleArticles, visibleTickets) {
    return [
        buildStudentServiceChromeSignature(role, currentUser, visibleArticles, visibleTickets),
        buildStudentServiceBodySignature(role, currentUser, visibleArticles, visibleTickets)
    ].join('::');
}

function ensureStudentServiceDefaultLaneForStaff(role) {
    if (!STUDENT_SERVICE_LANES.includes(getStudentServiceLane())
        && [USER_ROLES.ADMIN, USER_ROLES.STUDENT_SERVICE, USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(role)) {
        const ui = ensureStudentServiceUiState();
        ui.serviceLane = 'service';
        if ([USER_ROLES.ADMIN, USER_ROLES.STUDENT_SERVICE].includes(role)) {
            ui.staffPanel = 'tickets';
        }
        writeStudentServiceStoredLane('service');
    }
}

function renderStudentServicePage() {
    const container = document.getElementById('page-student-service');
    if (!container) return;
    preloadStudentServiceWorkspaceModules();
    ensureStudentServiceStores();
    if (shouldBootstrapStudentServiceWorkspace() && !STUDENT_SERVICE_RUNTIME.loaded && !STUDENT_SERVICE_RUNTIME.bootstrapPromise && typeof kiuPortalFetch === 'function') {
        scheduleStudentServiceBootstrap();
    }
    const role = getEffectiveUserRole();
    ensureStudentServiceDefaultLaneForStaff(role);
    writeStudentServiceStoredLane(getStudentServiceLane());
    const visibleArticles = getStudentServiceVisibleArticles();
    const visibleTickets = getStudentServiceVisibleTickets();
    const currentUser = getStudentServiceCurrentUser();
    const chromeSignature = buildStudentServiceChromeSignature(role, currentUser, visibleArticles, visibleTickets);
    const bodySignature = buildStudentServiceBodySignature(role, currentUser, visibleArticles, visibleTickets);
    const renderSignature = `${chromeSignature}::${bodySignature}`;
    if (container.dataset.studentServiceRenderSignature === renderSignature) {
        if (isStudentServiceQaBodyStale()) {
            delete container.dataset.studentServiceRenderSignature;
        } else {
            scheduleStudentServiceThreadRelayout();
            return;
        }
    }
    const scrollAnchors = captureStudentServiceScrollAnchors();
    if (container.dataset.studentServiceChromeSignature !== chromeSignature) {
        renderStudentServicePageChromeRebuilt(role, currentUser, visibleArticles, visibleTickets);
        renderStudentServiceHomeWorkspace();
        container.dataset.studentServiceChromeSignature = chromeSignature;
    }
    const bodyContainer = document.getElementById('student-service-page-body');
    const selectedLane = getStudentServiceLane();
    if (!selectedLane) {
        if (bodyContainer) {
            setStudentServiceMarkup(
                bodyContainer,
                `student-service-page-body:lane-chooser:${role}:${getCurrentUserId() || 'anonymous'}:${visibleArticles.length}:${visibleTickets.length}`,
                renderStudentServiceLaneChooser(role, currentUser, visibleArticles, visibleTickets)
            );
        }
        container.dataset.studentServiceRenderSignature = renderSignature;
        restoreStudentServiceScrollAnchors(scrollAnchors);
        restoreStudentServiceOpenQuestionFromUi();
        return;
    }
    if (role === USER_ROLES.STUDENT) {
        const ui = ensureStudentServiceUiState();
        if (shouldDeferStudentServiceStudentHubUntilBootstrap(role, ui)) {
            if (bodyContainer) {
                setStudentServiceMarkup(
                    bodyContainer,
                    'student-service-page-body:bootstrap-loading',
                    renderStudentServiceBootstrapLoadingShell()
                );
            }
        } else {
            renderStudentServiceStudentView(bodyContainer || container, visibleArticles, visibleTickets);
        }
        container.dataset.studentServiceRenderSignature = renderSignature;
        restoreStudentServiceScrollAnchors(scrollAnchors);
        restoreStudentServiceOpenQuestionFromUi();
        scrollStudentServiceTicketChatLog();
        return;
    }
    if ([USER_ROLES.ADMIN, USER_ROLES.STUDENT_SERVICE, USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(role)) {
        renderStudentServiceStaffViewRebuilt(bodyContainer || container, visibleArticles, visibleTickets);
        container.dataset.studentServiceRenderSignature = renderSignature;
        restoreStudentServiceScrollAnchors(scrollAnchors);
        restoreStudentServiceOpenQuestionFromUi();
        scrollStudentServiceTicketChatLog();
        return;
    }
    if (bodyContainer) {
        setStudentServiceMarkup(
            bodyContainer,
            'student-service-page-body:unavailable',
            `
                <div class="student-service-empty-state student-service-empty-state-large">
                    <div class="student-service-empty-title">Student Service Center</div>
                    <div class="student-service-empty-copy">This workspace is available to students, Student Service staff, and administrators.</div>
                </div>
            `
        );
    }
    container.dataset.studentServiceRenderSignature = renderSignature;
    restoreStudentServiceScrollAnchors(scrollAnchors);
    restoreStudentServiceOpenQuestionFromUi();
}

function isStudentServiceWorkspaceVisible() {
    if (typeof getActivePageId === 'function' && getActivePageId() === 'student-service') return true;
    const page = document.getElementById('page-student-service');
    if (!page) return false;
    return page.classList.contains('active-page') || page.style.display !== 'none';
}

function shouldBootstrapStudentServiceWorkspace() {
    if (document.body?.classList?.contains('lux-route-student-service')) return true;
    return isStudentServiceWorkspaceVisible();
}

function handleStudentServiceQaThreadClick(event) {
    if (hasStudentServiceQaModule()
        && typeof window.handleStudentServiceQaThreadClick === 'function'
        && window.handleStudentServiceQaThreadClick !== handleStudentServiceQaThreadClick) {
        return window.handleStudentServiceQaThreadClick.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return;
}

function studentServiceEventEl(event, selector, { mustBeTarget = false, container = null } = {}) {
    const el = event.target.closest(selector);
    if (!el) return null;
    if (mustBeTarget && el !== event.target) return null;
    if (container && !container.contains(el)) return null;
    return el;
}

function handleStudentServiceEscapeKey(event) {
    if (event.key !== 'Escape') return;
    if (document.querySelector('[data-student-service-delete-confirm="true"]')) {
        event.preventDefault();
        closeStudentServiceDeleteConfirm();
        return;
    }
    if (document.querySelector('[data-student-service-question-composer-modal="true"]')) {
        event.preventDefault();
        closeStudentServiceQuestionComposerModal();
        return;
    }
    if (isStudentServiceTicketThreadModalOpen()) {
        event.preventDefault();
        closeStudentServiceTicketThreadModal();
        return;
    }
    if (isStudentServiceQuestionThreadModalOpen()) {
        event.preventDefault();
        setStudentServiceOpenQuestionId('');
        return;
    }
    if (isStudentServiceInboxFilterEditorOpen()) {
        event.preventDefault();
        closeStudentServiceInboxFilterEditorModal();
        return;
    }
    if (isStudentServiceGuidanceModalOpen()) {
        event.preventDefault();
        closeStudentServiceGuidanceModal();
    }
}

function handleStudentServiceModalDocumentClick(event) {
    const modalRoot = document.getElementById('student-service-modal-root');
    if (!modalRoot || modalRoot.hasAttribute('hidden')) return false;

    const rules = [
        { sel: '[data-student-service-dismiss-delete-modal]', mustBeTarget: true, run: () => closeStudentServiceDeleteConfirm() },
        { sel: '[data-student-service-cancel-delete]', run: () => closeStudentServiceDeleteConfirm() },
        {
            sel: '[data-student-service-confirm-delete]',
            run: (el) => deleteStudentServiceQuestionAnswer(
                el.dataset.studentServiceQuestionId || '',
                el.dataset.studentServiceConfirmDelete || ''
            )
        },
        {
            sel: '[data-student-service-confirm-question-delete]',
            run: (el) => deleteStudentServiceQuestion(el.dataset.studentServiceConfirmQuestionDelete || '')
        },
        {
            sel: '[data-student-service-confirm-article-delete]',
            run: (el) => {
                if (el.disabled) return;
                deleteStudentServiceArticle(el.dataset.studentServiceConfirmArticleDelete || '');
            }
        },
        { sel: '[data-student-service-dismiss-ticket-thread-modal]', mustBeTarget: true, run: () => closeStudentServiceTicketThreadModal() },
        { sel: '[data-student-service-cancel-ticket-thread-modal]', run: () => closeStudentServiceTicketThreadModal() },
        { sel: '[data-student-service-dismiss-thread-modal]', mustBeTarget: true, run: () => setStudentServiceOpenQuestionId('') },
        { sel: '[data-student-service-cancel-thread-modal]', run: () => setStudentServiceOpenQuestionId('') },
        { sel: '[data-student-service-dismiss-composer-modal]', mustBeTarget: true, run: () => closeStudentServiceQuestionComposerModal() },
        { sel: '[data-student-service-cancel-composer-modal]', run: () => closeStudentServiceQuestionComposerModal() },
        {
            sel: '[data-student-service-draft-question-mode]',
            run: (el) => {
                setStudentServiceDraftQuestionField('askMode', el.dataset.studentServiceDraftQuestionMode || 'public');
                remountStudentServiceQuestionComposerModal();
            }
        },
        { sel: '[data-student-service-submit-question]', run: () => submitStudentServiceQuestion() },
        {
            sel: '[data-student-service-open-question]',
            run: (el) => {
                closeStudentServiceQuestionComposerModal();
                openStudentServiceQuestion(el.dataset.studentServiceOpenQuestion || '');
            }
        },
        { sel: '[data-student-service-dismiss-guidance-modal]', mustBeTarget: true, run: () => closeStudentServiceGuidanceModal() },
        { sel: '[data-student-service-cancel-guidance-modal]', run: () => closeStudentServiceGuidanceModal() },
        {
            sel: '[data-student-service-select-hub-article]',
            run: (el) => selectStudentHubArticle(
                el.dataset.studentServiceSelectHubArticle || '',
                el.dataset.studentServiceHubArea || ''
            )
        },
        { sel: '[data-student-service-article-search-clear]', run: () => setStudentServiceArticleSearch('') },
        { sel: '[data-student-service-dismiss-inbox-filter-editor-modal]', mustBeTarget: true, run: () => closeStudentServiceInboxFilterEditorModal() },
        { sel: '[data-student-service-inbox-filter-editor-close]', run: () => closeStudentServiceInboxFilterEditorModal() },
    ];

    for (const rule of rules) {
        const el = studentServiceEventEl(event, rule.sel, {
            mustBeTarget: Boolean(rule.mustBeTarget),
            container: rule.mustBeTarget ? null : modalRoot
        });
        // dismiss backdrop: mustBeTarget true, no container check (backdrop is target)
        // for non-backdrop, require modalRoot.contains
        if (!el) continue;
        if (!rule.mustBeTarget && !modalRoot.contains(el)) continue;
        if (rule.mustBeTarget && el !== event.target) continue;
        event.preventDefault();
        rule.run(el, event);
        return true;
    }

    // Inbox filter editor actions inside modal
    const savePersonalLayoutButton = studentServiceEventEl(event, '[data-student-service-inbox-filter-editor-save-personal]', { container: modalRoot });
    if (savePersonalLayoutButton) {
        event.preventDefault();
        saveStudentServicePersonalInboxFilterLayoutFromEditor();
        return true;
    }
    const saveSharedLayoutButton = studentServiceEventEl(event, '[data-student-service-inbox-filter-editor-save-shared]', { container: modalRoot });
    if (saveSharedLayoutButton) {
        event.preventDefault();
        saveStudentServiceSharedInboxFilterLayoutFromEditor();
        return true;
    }
    const resetPersonalLayoutButton = studentServiceEventEl(event, '[data-student-service-inbox-filter-editor-reset-personal]', { container: modalRoot });
    if (resetPersonalLayoutButton) {
        event.preventDefault();
        resetStudentServicePersonalInboxFilterLayoutFromEditor();
        return true;
    }
    const addFilterButton = studentServiceEventEl(event, '[data-student-service-inbox-filter-editor-add-filter]', { container: modalRoot });
    if (addFilterButton) {
        event.preventDefault();
        addStudentServiceInboxFilterEditorCustomFilter();
        return true;
    }
    const moveFilterButton = studentServiceEventEl(event, '[data-student-service-inbox-filter-editor-move]', { container: modalRoot });
    if (moveFilterButton) {
        event.preventDefault();
        const index = Number(moveFilterButton.dataset.studentServiceInboxFilterEditorFilterIndex || -1);
        const dir = moveFilterButton.dataset.studentServiceInboxFilterEditorMove || 'up';
        moveStudentServiceInboxFilterEditorRow(index, dir);
        return true;
    }
    const removeFilterButton = studentServiceEventEl(event, '[data-student-service-inbox-filter-editor-remove-filter]', { container: modalRoot });
    if (removeFilterButton) {
        event.preventDefault();
        removeStudentServiceInboxFilterEditorFilter(Number(removeFilterButton.dataset.studentServiceInboxFilterEditorRemoveFilter || -1));
        return true;
    }
    const addOptionButton = studentServiceEventEl(event, '[data-student-service-inbox-filter-editor-add-option]', { container: modalRoot });
    if (addOptionButton) {
        event.preventDefault();
        addStudentServiceInboxFilterEditorOption(Number(addOptionButton.dataset.studentServiceInboxFilterEditorAddOption || -1));
        return true;
    }
    const removeOptionButton = studentServiceEventEl(event, '[data-student-service-inbox-filter-editor-remove-option]', { container: modalRoot });
    if (removeOptionButton) {
        event.preventDefault();
        removeStudentServiceInboxFilterEditorOption(
            Number(removeOptionButton.dataset.studentServiceInboxFilterEditorRemoveOption || -1),
            Number(removeOptionButton.dataset.studentServiceInboxFilterEditorOptionIndex || -1)
        );
        return true;
    }
    return false;
}

function handleStudentServiceRootClick(event) {
    const laneButton = studentServiceEventEl(event, '[data-student-service-lane]');
    if (laneButton) {
        event.preventDefault();
        setStudentServiceLane(laneButton.dataset.studentServiceLane || 'service');
        return;
    }
    const studentTabButton = studentServiceEventEl(event, '[data-student-service-student-tab]');
    if (studentTabButton) {
        event.preventDefault();
        switchStudentServiceStudentTab(studentTabButton.dataset.studentServiceStudentTab || 'get_help');
        return;
    }
    const panelSwitchButton = studentServiceEventEl(event, '[data-student-service-panel-switch]');
    if (panelSwitchButton) {
        event.preventDefault();
        switchStudentServicePanel(panelSwitchButton.dataset.studentServicePanelSwitch || 'tickets');
        return;
    }
    const navigateButton = studentServiceEventEl(event, '[data-student-service-navigate]');
    if (navigateButton) {
        event.preventDefault();
        if (typeof navigate === 'function') {
            navigate(navigateButton.dataset.studentServiceNavigate || 'student-service');
        }
        return;
    }
    const openPanelButton = studentServiceEventEl(event, '[data-student-service-open-panel]');
    if (openPanelButton) {
        event.preventDefault();
        openStudentServicePanel(openPanelButton.dataset.studentServiceOpenPanel || 'tickets');
        return;
    }
    const openGuidanceModalButton = studentServiceEventEl(event, '[data-student-service-open-guidance-modal]');
    if (openGuidanceModalButton) {
        event.preventDefault();
        openStudentServiceGuidanceModal();
        return;
    }
    const ticketFilterButton = studentServiceEventEl(event, '[data-student-service-ticket-filter-field][data-student-service-ticket-filter-value]');
    if (ticketFilterButton) {
        event.preventDefault();
        setStudentServiceTicketFilter(
            ticketFilterButton.dataset.studentServiceTicketFilterField || '',
            ticketFilterButton.dataset.studentServiceTicketFilterValue || ''
        );
        return;
    }
    const toggleInternalNotesButton = studentServiceEventEl(event, '[data-student-service-toggle-internal-notes]');
    if (toggleInternalNotesButton) {
        event.preventDefault();
        toggleStudentServiceDetailSection('internalNotes');
        return;
    }
    const openTicketButton = studentServiceEventEl(event, '[data-student-service-open-ticket]');
    if (openTicketButton) {
        event.preventDefault();
        if (openTicketButton.dataset.studentServiceOpenTicketPanel) {
            openStudentServicePanel(openTicketButton.dataset.studentServiceOpenTicketPanel);
        }
        openStudentServiceTicket(openTicketButton.dataset.studentServiceOpenTicket || '');
        return;
    }
    const focusAreaButton = studentServiceEventEl(event, '[data-student-service-focus-area]');
    if (focusAreaButton) {
        event.preventDefault();
        focusStudentServiceSupportArea(focusAreaButton.dataset.studentServiceFocusArea || '');
        return;
    }
    const openTicketFullscreenButton = studentServiceEventEl(event, '[data-student-service-open-ticket-fullscreen]');
    if (openTicketFullscreenButton) {
        event.preventDefault();
        const ui = ensureStudentServiceUiState();
        const ticketId = ui.selectedTicketId || '';
        if (ticketId) openStudentServiceTicket(ticketId);
        return;
    }
    const retryBootstrapButton = studentServiceEventEl(event, '[data-student-service-retry-bootstrap]');
    if (retryBootstrapButton) {
        event.preventDefault();
        renderStudentServicePage();
        return;
    }
    const retryQaModuleButton = studentServiceEventEl(event, '[data-student-service-retry-qa-module]');
    if (retryQaModuleButton) {
        event.preventDefault();
        const bodyContainer = document.getElementById('student-service-page-body');
        const mode = retryQaModuleButton.dataset.studentServiceRetryQaModule || 'student';
        if (bodyContainer) renderStudentServiceQaModuleLoading(bodyContainer, mode);
        ensureStudentServiceQaModule()
            .then(() => rerenderStudentServicePageAfterModuleLoad())
            .catch(() => handleStudentServiceQaModuleLoadFailure(bodyContainer, mode));
        return;
    }
    const retryServiceModuleButton = studentServiceEventEl(event, '[data-student-service-retry-service-module]');
    if (retryServiceModuleButton) {
        event.preventDefault();
        const bodyContainer = document.getElementById('student-service-page-body');
        const mode = retryServiceModuleButton.dataset.studentServiceRetryServiceModule || 'service';
        if (bodyContainer) renderStudentServiceServiceModuleLoading(bodyContainer, mode);
        ensureStudentServiceServiceModule()
            .then(() => rerenderStudentServicePageAfterModuleLoad())
            .catch(() => handleStudentServiceServiceModuleLoadFailure(bodyContainer, mode));
        return;
    }
    const composerToggle = studentServiceEventEl(event, '[data-student-service-question-composer-toggle]');
    if (composerToggle) {
        event.preventDefault();
        if (composerToggle.dataset.studentServiceQuestionComposerToggle === 'open') {
            const ui = ensureStudentServiceUiState();
            if (ui.serviceLane !== 'qa') {
                ui.serviceLane = 'qa';
                writeStudentServiceStoredLane('qa');
            }
            openStudentServiceQuestionComposerModal();
        }
        return;
    }
    if (handleStudentServiceQaThreadClick(event)) return;

    const submitTicketButton = studentServiceEventEl(event, '[data-student-service-submit-ticket]');
    if (submitTicketButton) {
        event.preventDefault();
        submitStudentServiceTicket();
        return;
    }
    const editInboxFiltersButton = studentServiceEventEl(event, '[data-student-service-edit-inbox-filters]');
    if (editInboxFiltersButton) {
        event.preventDefault();
        openStudentServiceInboxFilterEditorModal();
        return;
    }
    const openArticleButton = studentServiceEventEl(event, '[data-student-service-open-article]');
    if (openArticleButton) {
        event.preventDefault();
        openStudentServiceArticle(openArticleButton.dataset.studentServiceOpenArticle || '');
        return;
    }
    const editArticleButton = studentServiceEventEl(event, '[data-student-service-edit-article]');
    if (editArticleButton) {
        event.preventDefault();
        editStudentServiceArticle(editArticleButton.dataset.studentServiceEditArticle || '');
        return;
    }
    const startNewArticleButton = studentServiceEventEl(event, '[data-student-service-start-new-article]');
    if (startNewArticleButton) {
        event.preventDefault();
        startStudentServiceNewArticle();
        return;
    }
    const assignTicketButton = studentServiceEventEl(event, '[data-student-service-assign-ticket]');
    if (assignTicketButton) {
        event.preventDefault();
        assignStudentServiceTicketToCurrentUser();
        return;
    }
    const attachButton = studentServiceEventEl(event, '[data-student-service-attach]');
    if (attachButton) {
        event.preventDefault();
        pickStudentServiceAttachments(attachButton.dataset.studentServiceAttach || '');
        return;
    }
    const removeAttachmentButton = studentServiceEventEl(event, '[data-student-service-remove-attachment]');
    if (removeAttachmentButton) {
        event.preventDefault();
        removeStudentServiceDraftAttachment(
            removeAttachmentButton.dataset.studentServiceRemoveAttachment || '',
            removeAttachmentButton.dataset.studentServiceAttachmentId || ''
        );
        return;
    }
    const addInternalNoteButton = studentServiceEventEl(event, '[data-student-service-add-internal-note]');
    if (addInternalNoteButton) {
        event.preventDefault();
        addStudentServiceInternalNote();
        return;
    }
    const replyTicketButton = studentServiceEventEl(event, '[data-student-service-reply-ticket]');
    if (replyTicketButton) {
        event.preventDefault();
        replyStudentServiceTicket();
        return;
    }
    const saveArticleButton = studentServiceEventEl(event, '[data-student-service-save-article]');
    if (saveArticleButton) {
        event.preventDefault();
        saveStudentServiceArticle(saveArticleButton.dataset.studentServiceSaveArticle === 'publish');
        return;
    }
    const deleteArticleButton = studentServiceEventEl(event, '[data-student-service-delete-article]');
    if (deleteArticleButton) {
        event.preventDefault();
        flashStudentServiceActionButton(deleteArticleButton, 'acting');
        openStudentServiceDeleteArticleConfirm(deleteArticleButton.dataset.studentServiceDeleteArticle || '');
        return;
    }
    const detailSectionButton = studentServiceEventEl(event, '[data-student-service-detail-section]');
    if (detailSectionButton) {
        event.preventDefault();
        toggleStudentServiceDetailSection(detailSectionButton.dataset.studentServiceDetailSection || '');
    }
}

function bindStudentServiceDelegatedInteractions() {
    const root = document.getElementById('page-student-service');
    if (!root || root.dataset.studentServiceInteractionsBound === '1') return;
    root.dataset.studentServiceInteractionsBound = '1';
    const modalRoot = ensureStudentServiceModalRoot();

    const syncDraftQuestionField = (node) => {
        if (!node) return;
        const field = node.dataset.studentServiceDraftQuestionField || '';
        if (!field) return;
        const value = node.type === 'checkbox' ? node.checked : node.value;
        setStudentServiceDraftQuestionField(field, value);
    };

    if (!window.__studentServiceDeleteModalInteractionsBound) {
        window.__studentServiceDeleteModalInteractionsBound = true;
        window.__studentServiceComposerModalInteractionsBound = true;
        document.addEventListener('keydown', handleStudentServiceEscapeKey);
        document.addEventListener('click', (event) => {
            handleStudentServiceModalDocumentClick(event);
        });
    }

    root.addEventListener('click', (event) => {
        handleStudentServiceRootClick(event);
    });

    document.addEventListener('change', (event) => {
        if (event.target.matches('[data-student-service-delete-attest]')) {
            syncStudentServiceDeleteConfirmGate();
        }
    });

    root.addEventListener('input', (event) => {
        if (event.target.matches('[data-student-service-draft-ticket-field]')) {
            const field = event.target.dataset.studentServiceDraftTicketField || '';
            setStudentServiceDraftTicketField(field, event.target.value);
            return;
        }
        if (event.target.matches('[data-student-service-draft-question-field]')) {
            syncDraftQuestionField(event.target);
            return;
        }
        if (event.target.matches('[data-student-service-article-search-input]')) {
            setStudentServiceArticleSearch(event.target.value);
            return;
        }
        if (event.target.matches('[data-student-service-ticket-filter-input]')) {
            setStudentServiceTicketFilter(
                event.target.dataset.studentServiceTicketFilterInput || '',
                event.target.value,
                { debounce: event.target.type === 'search' }
            );
            return;
        }
        if (event.target.matches('[data-student-service-question-filter-input]')) {
            setStudentServiceQuestionFilter(
                event.target.dataset.studentServiceQuestionFilterInput || '',
                event.target.value
            );
        }
    });

    root.addEventListener('change', (event) => {
        if (event.target.matches('[data-student-service-draft-ticket-field]')) {
            const field = event.target.dataset.studentServiceDraftTicketField || '';
            const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
            setStudentServiceDraftTicketField(field, value);
            return;
        }
        if (event.target.matches('[data-student-service-draft-question-field]')) {
            syncDraftQuestionField(event.target);
            return;
        }
        if (event.target.matches('[data-student-service-ticket-filter-input]')) {
            setStudentServiceTicketFilter(
                event.target.dataset.studentServiceTicketFilterInput || '',
                event.target.value
            );
            return;
        }
        if (event.target.matches('[data-student-service-ticket-status-select]')) {
            updateStudentServiceTicketStatus(event.target.value);
            return;
        }
        if (event.target.matches('[data-student-service-article-search-input]')) {
            setStudentServiceArticleSearch(event.target.value);
            return;
        }
        if (event.target.matches('[data-student-service-question-filter-input]')) {
            setStudentServiceQuestionFilter(
                event.target.dataset.studentServiceQuestionFilterInput || '',
                event.target.value
            );
        }
    });

    if (modalRoot && modalRoot.dataset.studentServiceModalQaInteractionsBound !== '1') {
        modalRoot.dataset.studentServiceModalQaInteractionsBound = '1';
        modalRoot.addEventListener('click', (event) => {
            if (!modalRoot.contains(event.target)) return;
            handleStudentServiceQaThreadClick(event);
        });
    }
}


async function bootstrapStudentServicePage() {
    if (!document.getElementById('page-student-service')) return;
    if (typeof getEffectiveUserRole !== 'function' || typeof USER_ROLES === 'undefined') {
        window.setTimeout(bootstrapStudentServicePage, 30);
        return;
    }
    try {
        if (typeof pinStudentServiceWorkspaceRole === 'function') {
            pinStudentServiceWorkspaceRole({ refreshChrome: true });
        }
        await syncStudentServiceWorkspaceBackendSession();
        if (typeof scheduleKiuRealtimeBootstrap === 'function') {
            scheduleKiuRealtimeBootstrap(true);
        }
        bindStudentServiceRealtimeRefreshListener();
        bindStudentServiceDelegatedInteractions();
        renderStudentServicePage();
        if (shouldBootstrapStudentServiceWorkspace()) {
            document.documentElement.classList.remove('kiu-shell-loading');
            document.body?.classList.remove('kiu-shell-loading');
        }
    } catch (error) {
        console.error('Student Service bootstrap failed.', error);
    }
}

window.renderStudentServicePage = renderStudentServicePage;
window.renderStudentServiceAttachmentPickerMarkup = renderStudentServiceAttachmentPickerMarkup;
window.renderStudentServiceAttachmentGalleryMarkup = renderStudentServiceAttachmentGalleryMarkup;
window.getStudentServiceAnswerComposerId = getStudentServiceAnswerComposerId;
window.openStudentServiceGuidanceModal = openStudentServiceGuidanceModal;
window.closeStudentServiceGuidanceModal = closeStudentServiceGuidanceModal;
window.fetchStudentServiceBootstrap = fetchStudentServiceBootstrap;
window.applyStudentServiceBootstrap = applyStudentServiceBootstrap;
window.preloadStudentServiceWorkspaceModules = preloadStudentServiceWorkspaceModules;
window.__kiuRelayoutStudentServiceCommentTrunks = relayoutStudentServiceCommentTrunks;
window.getStudentServiceEffectiveInboxFilterLayout = getStudentServiceEffectiveInboxFilterLayout;
window.getStudentServicePublicInboxFilterLayout = getStudentServicePublicInboxFilterLayout;
window.getStudentServicePublishedInboxFilterLayout = getStudentServicePublishedInboxFilterLayout;
window.invalidateStudentServiceRenderSignature = invalidateStudentServiceRenderSignature;
window.syncStudentServiceWorkspaceBackendSession = syncStudentServiceWorkspaceBackendSession;
window.canShowStudentServiceArticleEditorActions = canShowStudentServiceArticleEditorActions;
window.buildStudentServiceArticleFingerprint = buildStudentServiceArticleFingerprint;
window.pickStudentHubFeaturedArticle = pickStudentHubFeaturedArticle;
window.resolveStudentHubArticle = resolveStudentHubArticle;
window.getStudentServiceFilteredStaffTickets = getStudentServiceFilteredStaffTickets;
window.getStudentServiceFilteredStudentTickets = getStudentServiceFilteredStudentTickets;
window.buildStudentServiceStudentInboxFilterLayout = buildStudentServiceStudentInboxFilterLayout;
window.renderStudentServiceStudentInboxFiltersMarkup = renderStudentServiceStudentInboxFiltersMarkup;
window.ssFormatRelativeTime = ssFormatRelativeTime;
window.renderStudentServiceInboxFiltersMarkup = renderStudentServiceInboxFiltersMarkup;
window.renderStudentServiceInboxDropdownFiltersMarkup = renderStudentServiceInboxDropdownFiltersMarkup;
window.renderStudentServiceStaffPanelSwitchMarkup = renderStudentServiceStaffPanelSwitchMarkup;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapStudentServicePage);
} else {
    bootstrapStudentServicePage();
}


