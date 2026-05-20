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

const STUDENT_SERVICE_PUBLIC_QUESTION_STATUSES = ['draft', 'pending_review', 'published', 'archived', 'merged'];
const STUDENT_SERVICE_RESPONDER_ROLES = [USER_ROLES.ADMIN, USER_ROLES.STUDENT_SERVICE, USER_ROLES.PROFESSOR, USER_ROLES.TA];
const STUDENT_SERVICE_LANES = ['service', 'qa'];
const STUDENT_SERVICE_UI_PREFS_KEY = 'KIU_STUDENT_SERVICE_UI_PREFS';
const STUDENT_SERVICE_RUNTIME = {
    bootstrapPromise: null,
    lastLoadedAt: 0,
    loaded: false,
    loadFailed: false
};
const STUDENT_SERVICE_QA_MODULE_URL = 'assets/js/pages/student-service-qa.js?v=20260516-studentsvcqa-module1';
const STUDENT_SERVICE_SERVICE_MODULE_URL = 'assets/js/pages/student-service-service.js?v=20260516-studentsvcservice-module1';

const studentServiceUiState = {};
const studentServiceMarkupCache = Object.create(null);
let studentServiceQaModulePromise = null;
let studentServiceServiceModulePromise = null;

function hasStudentServiceQaModule() {
    return Boolean(
        window.__KIU_STUDENT_SERVICE_QA_MODULE_LOADED
        && typeof window.renderStudentServiceStudentQaHub === 'function'
        && typeof window.renderStudentServiceStaffQaFeed === 'function'
        && window.renderStudentServiceStudentQaHub !== renderStudentServiceStudentQaHub
        && window.renderStudentServiceStaffQaFeed !== renderStudentServiceStaffQaFeed
    );
}

function ensureStudentServiceQaModule() {
    if (hasStudentServiceQaModule()) return Promise.resolve(true);
    if (studentServiceQaModulePromise) return studentServiceQaModulePromise;
    studentServiceQaModulePromise = new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${STUDENT_SERVICE_QA_MODULE_URL}"]`);
        if (existing) {
            existing.addEventListener('load', () => resolve(true), { once: true });
            existing.addEventListener('error', () => reject(new Error('Student Service Q&A module could not be loaded.')), { once: true });
            return;
        }
        const script = document.createElement('script');
        script.src = STUDENT_SERVICE_QA_MODULE_URL;
        script.defer = true;
        script.addEventListener('load', () => resolve(true), { once: true });
        script.addEventListener('error', () => reject(new Error('Student Service Q&A module could not be loaded.')), { once: true });
        document.head.appendChild(script);
    }).catch((error) => {
        console.error('Student Service Q&A module load failed.', error);
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

function hasStudentServiceServiceModule() {
    return Boolean(
        window.__KIU_STUDENT_SERVICE_SERVICE_MODULE_LOADED
        && typeof window.renderStudentServiceStudentHub === 'function'
        && typeof window.renderStudentServiceMyTicketsHub === 'function'
        && typeof window.renderStudentServiceResponderServiceLane === 'function'
        && window.renderStudentServiceStudentHub !== renderStudentServiceStudentHub
        && window.renderStudentServiceMyTicketsHub !== renderStudentServiceMyTicketsHub
        && window.renderStudentServiceResponderServiceLane !== renderStudentServiceResponderServiceLane
    );
}

function ensureStudentServiceServiceModule() {
    if (hasStudentServiceServiceModule()) return Promise.resolve(true);
    if (studentServiceServiceModulePromise) return studentServiceServiceModulePromise;
    studentServiceServiceModulePromise = new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${STUDENT_SERVICE_SERVICE_MODULE_URL}"]`);
        if (existing) {
            existing.addEventListener('load', () => resolve(true), { once: true });
            existing.addEventListener('error', () => reject(new Error('Student Service service module could not be loaded.')), { once: true });
            return;
        }
        const script = document.createElement('script');
        script.src = STUDENT_SERVICE_SERVICE_MODULE_URL;
        script.defer = true;
        script.addEventListener('load', () => resolve(true), { once: true });
        script.addEventListener('error', () => reject(new Error('Student Service service module could not be loaded.')), { once: true });
        document.head.appendChild(script);
    }).catch((error) => {
        console.error('Student Service service module load failed.', error);
        throw error;
    }).finally(() => {
        studentServiceServiceModulePromise = null;
    });
    return studentServiceServiceModulePromise;
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

function getStudentServiceSupportArea(areaId) {
    return STUDENT_SERVICE_SUPPORT_AREA_BY_ID[String(areaId || '').trim()] || STUDENT_SERVICE_SUPPORT_AREA_BY_ID.general;
}

function getStudentServiceSupportAreaForCategory(category) {
    const match = STUDENT_SERVICE_SUPPORT_AREAS.find(area => area.category === category);
    return match || STUDENT_SERVICE_SUPPORT_AREA_BY_ID.general;
}

function getStudentServiceDefaultCategoryForArea(areaId) {
    return getStudentServiceSupportArea(areaId).category;
}

function buildStudentServiceDefaultDraftTicket() {
    return {
        serviceArea: 'general',
        category: getStudentServiceDefaultCategoryForArea('general'),
        title: '',
        message: '',
        subjectValue: '',
        relatedContextLabel: ''
    };
}

function buildStudentServiceDefaultDraftQuestion() {
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
            staffPanel: 'tickets',
            studentTab: 'get_help',
            serviceLane: readStudentServiceStoredLane(key),
            qaSearch: '',
            qaFaculty: normalizeFacultyCode(getCurrentFaculty?.() || '', ''),
            qaCategory: 'all',
            qaStatus: 'published',
            qaComposerExpanded: false,
            selectedQuestionId: '',
            draftQuestion: buildStudentServiceDefaultDraftQuestion(),
            studentDetailsExpanded: false,
            staffFiltersExpanded: false,
            detailSections: buildStudentServiceDefaultDetailSections(),
            activeSupportArea: 'general',
            draftTicket: buildStudentServiceDefaultDraftTicket()
        };
    }
    const ui = studentServiceUiState[key];
    if (!ui.ticketServiceArea) ui.ticketServiceArea = 'all';
    if (!ui.ticketFaculty) ui.ticketFaculty = 'all';
    if (!ui.activeSupportArea) ui.activeSupportArea = 'general';
    if (!ui.draftTicket || typeof ui.draftTicket !== 'object') {
        ui.draftTicket = buildStudentServiceDefaultDraftTicket();
    }
    if (!['get_help', 'my_tickets'].includes(ui.studentTab)) ui.studentTab = 'get_help';
    if (!['tickets', 'articles', 'qa'].includes(ui.staffPanel)) ui.staffPanel = 'tickets';
    if (!STUDENT_SERVICE_LANES.includes(ui.serviceLane)) ui.serviceLane = '';
    if (typeof ui.qaComposerExpanded !== 'boolean') ui.qaComposerExpanded = false;
    if (typeof ui.studentDetailsExpanded !== 'boolean') ui.studentDetailsExpanded = false;
    if (typeof ui.staffFiltersExpanded !== 'boolean') ui.staffFiltersExpanded = false;
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
    if (!ui.qaFaculty) {
        ui.qaFaculty = normalizeFacultyCode(getCurrentFaculty?.() || '', '');
    }
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
    ui.serviceLane = nextLane;
    writeStudentServiceStoredLane(ui.serviceLane);
    if (rerender) renderStudentServicePage();
}

function clearStudentServiceLaneChoice() {
    setStudentServiceLane('', true);
}

function buildStudentServiceDefaultArticles() {
    return [
        {
            id: 'svc-article-001',
            title: 'How to ask for help from Student Service',
            category: 'General Question',
            summary: 'Use Student Service for general office support, guidance, and portal questions.',
            content: 'Student Service is the main help desk for office support, rules guidance, and non-academic process questions. Use a ticket when you need a response or follow-up.',
            published: true,
            featured: true,
            audience: 'all',
            relatedLinks: [],
            createdBy: 'System',
            updatedBy: 'System',
            updatedAt: '2026-04-01T09:00:00.000Z'
        },
        {
            id: 'svc-article-002',
            title: 'When to use Chancellery vs Student Service',
            category: 'Academic Process',
            summary: 'Student Service handles general help. Chancellery handles exam appeals and retake requests.',
            content: 'Use Student Service for general office support, documents guidance, finance questions, and portal help. Use Chancellery only for grade appeals and retake request workflows after exams.',
            published: true,
            featured: true,
            audience: 'all',
            relatedLinks: [],
            createdBy: 'System',
            updatedBy: 'System',
            updatedAt: '2026-04-01T09:15:00.000Z'
        },
        {
            id: 'svc-article-003',
            title: 'Registration and enrollment help',
            category: 'Registration / Enrollment',
            summary: 'What to prepare before asking about course registration and enrollment issues.',
            content: 'When opening a registration ticket, include your student ID, semester, course name, and the exact problem you saw in the portal. This helps Student Service review your case faster.',
            published: true,
            featured: true,
            audience: 'students',
            relatedLinks: [],
            createdBy: 'System',
            updatedBy: 'System',
            updatedAt: '2026-04-01T09:30:00.000Z'
        },
        {
            id: 'svc-article-004',
            title: 'Technical portal support checklist',
            category: 'Technical Portal Help',
            summary: 'What to send when a portal page is broken or not loading correctly.',
            content: 'Include the page name, your role, your faculty, what button you clicked, and a screenshot when the page freezes or shows the wrong version. This lets Student Service reproduce the issue quickly.',
            published: true,
            featured: false,
            audience: 'all',
            relatedLinks: [],
            createdBy: 'System',
            updatedBy: 'System',
            updatedAt: '2026-04-01T09:45:00.000Z'
        },
        {
            id: 'svc-article-005',
            title: 'Finance and payment support',
            category: 'Finance / Payments',
            summary: 'How to request help about balances, payment confirmation, and finance follow-up.',
            content: 'When you contact Student Service about finance, include your student ID, the amount or invoice you are referring to, and the date of the payment or charge. Student Service can guide the next step and document the issue, but cannot edit finance records from this workspace.',
            published: true,
            featured: false,
            audience: 'all',
            relatedLinks: [],
            createdBy: 'System',
            updatedBy: 'System',
            updatedAt: '2026-04-01T10:00:00.000Z'
        },
        {
            id: 'svc-article-006',
            title: 'Documents and certificate requests',
            category: 'Documents / Certificates',
            summary: 'What to include when you need a transcript, certificate, or official document.',
            content: 'For document requests, include the document name, language needs, deadline, and where it will be used. Student Service can confirm what is needed and keep the request moving, while official document generation stays in the proper office workflow.',
            published: true,
            featured: false,
            audience: 'all',
            relatedLinks: [],
            createdBy: 'System',
            updatedBy: 'System',
            updatedAt: '2026-04-01T10:15:00.000Z'
        }
    ];
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
        audience: ['all', 'students', 'staff'].includes(article.audience) ? article.audience : 'students',
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

function normalizeStudentServiceThreadEntry(entry = {}, fallback = {}) {
    return {
        id: String(entry.id || fallback.id || `svc-msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
        authorId: String(entry.authorId || fallback.authorId || ''),
        authorName: entry.authorName || fallback.authorName || 'Portal User',
        authorRole: entry.authorRole || fallback.authorRole || 'system',
        message: entry.message || fallback.message || '',
        createdAt: entry.createdAt || fallback.createdAt || ssNowIso(),
        type: entry.type || fallback.type || 'reply'
    };
}

function resolveStudentServiceStudentSemester(studentId, fallback = '') {
    const fallbackSemester = Number(fallback || 0);
    if (fallbackSemester > 0) return fallbackSemester;
    const profile = (KIU_STATE.users || []).find(user => String(user?.id || '') === String(studentId || '')) || null;
    const profileSemester = Number(profile?.semester || 0);
    return profileSemester > 0 ? profileSemester : '';
}

function normalizeStudentServiceInternalNote(note = {}, index = 0) {
    return {
        id: String(note.id || `svc-note-${Date.now()}-${index}`),
        authorId: String(note.authorId || ''),
        authorName: String(note.authorName || 'Staff'),
        authorRole: note.authorRole || USER_ROLES.STUDENT_SERVICE,
        message: String(note.message || '').trim(),
        createdAt: note.createdAt || ssNowIso()
    };
}

function normalizeStudentServiceHandoff(handoff = {}) {
    const target = STUDENT_SERVICE_HANDOFF_TARGETS.includes(handoff.target) ? handoff.target : '';
    const status = STUDENT_SERVICE_HANDOFF_STATUSES.includes(handoff.status) ? handoff.status : (target ? 'Requested' : 'Not Needed');
    return {
        target,
        status,
        summary: String(handoff.summary || '').trim(),
        requestedAt: handoff.requestedAt || '',
        updatedAt: handoff.updatedAt || '',
        requestedById: String(handoff.requestedById || ''),
        requestedByName: String(handoff.requestedByName || '')
    };
}

function normalizeStudentServiceTicket(ticket = {}, index = 0) {
    const createdAt = ticket.createdAt || ticket.date || ssNowIso();
    const updatedAt = ticket.updatedAt || createdAt;
    const initialMessage = ticket.message || ticket.description || '';
    const inputThread = Array.isArray(ticket.thread) ? ticket.thread : Array.isArray(ticket.messages) ? ticket.messages : [];
    const thread = inputThread.length
        ? inputThread.map((entry, entryIndex) => normalizeStudentServiceThreadEntry(entry, {
            id: `svc-thread-${index}-${entryIndex}`,
            authorId: String(ticket.studentId || ''),
            authorName: ticket.studentName || 'Student',
            authorRole: USER_ROLES.STUDENT,
            createdAt
        }))
        : [normalizeStudentServiceThreadEntry({
            id: `svc-thread-${index}-0`,
            authorId: String(ticket.studentId || ''),
            authorName: ticket.studentName || 'Student',
            authorRole: USER_ROLES.STUDENT,
            message: initialMessage,
            createdAt,
            type: 'request'
        })];
    const latestEntry = thread[thread.length - 1] || null;
    const category = STUDENT_SERVICE_CATEGORIES.includes(ticket.category) ? ticket.category : 'General Question';
    const serviceArea = getStudentServiceSupportArea(ticket.serviceArea || getStudentServiceSupportAreaForCategory(category).id).id;
    const internalNotes = Array.isArray(ticket.internalNotes)
        ? ticket.internalNotes.map(normalizeStudentServiceInternalNote).filter(note => note.message)
        : [];
    const intakeContext = ticket.intakeContext && typeof ticket.intakeContext === 'object'
        ? {
            sourcePage: String(ticket.intakeContext.sourcePage || ''),
            sourceLabel: String(ticket.intakeContext.sourceLabel || ''),
            roleAtSubmission: String(ticket.intakeContext.roleAtSubmission || ''),
            facultyAtSubmission: String(ticket.intakeContext.facultyAtSubmission || ''),
            studentBalance: Number(ticket.intakeContext.studentBalance || 0),
            probationActive: Boolean(ticket.intakeContext.probationActive),
            registeredSubjects: Math.max(0, Number(ticket.intakeContext.registeredSubjects || 0)),
            savedRegistrations: Math.max(0, Number(ticket.intakeContext.savedRegistrations || 0))
        }
        : {
            sourcePage: '',
            sourceLabel: '',
            roleAtSubmission: '',
            facultyAtSubmission: '',
            studentBalance: 0,
            probationActive: false,
            registeredSubjects: 0,
            savedRegistrations: 0
        };
    return {
        id: String(ticket.id || `SVC-${String(index + 1).padStart(4, '0')}`),
        studentId: String(ticket.studentId || ''),
        studentName: ticket.studentName || 'Student',
        semester: resolveStudentServiceStudentSemester(ticket.studentId, ticket.semester),
        category,
        serviceArea,
        title: ticket.title || ticket.subject || 'Support Request',
        message: initialMessage,
        status: STUDENT_SERVICE_STATUSES.includes(ticket.status) ? ticket.status : 'Open',
        createdAt,
        updatedAt,
        assignedToRole: ticket.assignedToRole || '',
        assignedToId: String(ticket.assignedToId || ''),
        assignedToName: ticket.assignedToName || '',
        relatedSubjectId: String(ticket.relatedSubjectId || ''),
        relatedSubjectName: ticket.relatedSubjectName || '',
        relatedContextLabel: String(ticket.relatedContextLabel || ''),
        faculty: ticket.faculty || '',
        intakeContext,
        internalNotes,
        handoff: normalizeStudentServiceHandoff(ticket.handoff),
        thread,
        latestPreview: latestEntry?.message || initialMessage
    };
}

function normalizeStudentServiceAnswer(answer = {}, index = 0) {
    return {
        id: String(answer.id || `svc-answer-${index + 1}`),
        questionId: String(answer.questionId || ''),
        body: String(answer.body || answer.message || '').trim(),
        status: ['pending', 'published', 'archived'].includes(String(answer.status || '').trim())
            ? String(answer.status || '').trim()
            : 'published',
        responderUserId: String(answer.responderUserId || answer.authorId || ''),
        responderRole: String(answer.responderRole || answer.authorRole || '').trim().toLowerCase(),
        responderName: String(answer.responderName || answer.authorName || answer.authorLabel || 'Staff').trim(),
        isAccepted: Boolean(answer.isAccepted || answer.accepted),
        createdAt: answer.createdAt || ssNowIso(),
        updatedAt: answer.updatedAt || answer.createdAt || ssNowIso()
    };
}

function normalizeStudentServiceQuestion(question = {}, index = 0) {
    const normalizedCategory = STUDENT_SERVICE_CATEGORIES.includes(question.category)
        ? question.category
        : 'General Question';
    const answers = Array.isArray(question.answers)
        ? question.answers.map(normalizeStudentServiceAnswer)
        : [];
    return {
        id: String(question.id || `svc-question-${index + 1}`),
        title: String(question.title || 'Untitled question').trim(),
        body: String(question.body || question.message || '').trim(),
        category: normalizedCategory,
        serviceArea: getStudentServiceSupportArea(question.serviceArea || getStudentServiceSupportAreaForCategory(normalizedCategory).id).id,
        facultyCode: normalizeFacultyCode(question.facultyCode || question.faculty || '', ''),
        status: STUDENT_SERVICE_PUBLIC_QUESTION_STATUSES.includes(String(question.status || '').trim())
            ? String(question.status || '').trim()
            : 'draft',
        authorUserId: String(question.authorUserId || question.studentId || ''),
        authorDisplayName: String(question.authorDisplayName || question.authorName || question.authorLabel || '').trim(),
        anonymousMode: question.anonymousMode !== false,
        displayIdentityToPeers: Boolean(question.displayIdentityToPeers),
        featured: Boolean(question.featured),
        pinned: Boolean(question.pinned),
        staleReviewRequested: Boolean(question.staleReviewRequested),
        staleReviewNote: String(question.staleReviewNote || '').trim(),
        acceptedAnswerId: String(question.acceptedAnswerId || ''),
        helpfulVotes: Array.isArray(question.helpfulVotes) ? question.helpfulVotes : [],
        helpfulCount: Number(question.helpfulCount || 0),
        notHelpfulCount: Number(question.notHelpfulCount || 0),
        relatedQuestionIds: Array.isArray(question.relatedQuestionIds) ? question.relatedQuestionIds.map(String) : [],
        lastReviewedAt: question.lastReviewedAt || '',
        convertedTicketId: String(question.convertedTicketId || ''),
        createdAt: question.createdAt || ssNowIso(),
        updatedAt: question.updatedAt || question.createdAt || ssNowIso(),
        answers
    };
}

function ensureStudentServiceStores() {
    if (!Array.isArray(KIU_STATE.studentServiceArticles) || KIU_STATE.studentServiceArticles.length === 0) {
        KIU_STATE.studentServiceArticles = buildStudentServiceDefaultArticles();
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
        question.answers.forEach(answer => answerMap.set(answer.id, answer));
    });
    (KIU_STATE.studentServiceAnswers || []).map(normalizeStudentServiceAnswer).forEach(answer => {
        if (!answerMap.has(answer.id)) answerMap.set(answer.id, answer);
    });
    KIU_STATE.studentServiceAnswers = [...answerMap.values()].sort((a, b) => ssParseTime(a.createdAt) - ssParseTime(b.createdAt));

    if (!Array.isArray(KIU_STATE.studentServiceReviewQueue)) KIU_STATE.studentServiceReviewQueue = [];

    return {
        articles: KIU_STATE.studentServiceArticles,
        tickets: KIU_STATE.studentServiceTickets,
        macros: KIU_STATE.studentServiceMacros,
        questions: KIU_STATE.studentServiceQuestions,
        answers: KIU_STATE.studentServiceAnswers,
        reviewQueue: KIU_STATE.studentServiceReviewQueue
    };
}

function applyStudentServiceBootstrap(payload = {}) {
    const state = payload.studentService || payload || {};
    if (Array.isArray(state.articles)) KIU_STATE.studentServiceArticles = state.articles.slice();
    if (Array.isArray(state.tickets)) KIU_STATE.studentServiceTickets = state.tickets.slice();
    if (Array.isArray(state.macros)) KIU_STATE.studentServiceMacros = state.macros.slice();
    if (Array.isArray(state.questions)) KIU_STATE.studentServiceQuestions = state.questions.slice();
    if (Array.isArray(state.answers)) KIU_STATE.studentServiceAnswers = state.answers.slice();
    if (Array.isArray(state.reviewQueue)) KIU_STATE.studentServiceReviewQueue = state.reviewQueue.slice();
    KIU_STATE.studentServicePermissions = state.permissions || KIU_STATE.studentServicePermissions || {};
    KIU_STATE.studentServiceAnalytics = state.analytics || KIU_STATE.studentServiceAnalytics || {};
    ensureStudentServiceStores();
}

async function fetchStudentServiceBootstrap(force = false) {
    if (STUDENT_SERVICE_RUNTIME.bootstrapPromise && !force) return STUDENT_SERVICE_RUNTIME.bootstrapPromise;
    if (typeof kiuPortalFetch !== 'function') return null;
    STUDENT_SERVICE_RUNTIME.bootstrapPromise = (async () => {
        const payload = await kiuPortalFetch('/api/student-service/bootstrap');
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

function scheduleStudentServiceBootstrap(force = false) {
    fetchStudentServiceBootstrap(force)
        .then(() => renderStudentServicePage())
        .catch(() => null);
}

function getStudentServiceCurrentUser() {
    return getCurrentUser() || currentUser || null;
}

function getStudentServiceVisibleArticles() {
    const role = getEffectiveUserRole();
    const { articles } = ensureStudentServiceStores();
    if ([USER_ROLES.ADMIN, USER_ROLES.STUDENT_SERVICE, USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(role)) return articles;
    return articles.filter(article => article.published && (article.audience === 'all' || article.audience === 'students'));
}

function getStudentServicePermissions() {
    return KIU_STATE.studentServicePermissions || {};
}

function getStudentServiceAnalytics() {
    return KIU_STATE.studentServiceAnalytics || {};
}

function canCurrentUserModerateStudentService() {
    return Boolean(getStudentServicePermissions().canModerate);
}

function canCurrentUserRespondToStudentService() {
    const role = getEffectiveUserRole();
    return Boolean(getStudentServicePermissions().canRespond) || STUDENT_SERVICE_RESPONDER_ROLES.includes(role);
}

function getStudentServiceVisibleQuestions() {
    const role = getEffectiveUserRole();
    const currentUser = getStudentServiceCurrentUser();
    const { questions } = ensureStudentServiceStores();
    return questions.filter(question => {
        if ([USER_ROLES.ADMIN, USER_ROLES.STUDENT_SERVICE].includes(role)) return true;
        if ([USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(role)) {
            const sameFaculty = !question.facultyCode
                || normalizeFacultyCode(question.facultyCode || '', '') === normalizeFacultyCode(currentUser?.facultyCode || currentUser?.faculty || '', '');
            return sameFaculty && ['pending_review', 'published'].includes(question.status);
        }
        if (role === USER_ROLES.STUDENT) {
            return question.status === 'published'
                || String(question.authorUserId || '') === String(currentUser?.id || '');
        }
        return question.status === 'published';
    });
}

function getStudentServiceQuestionAuthorLabel(question) {
    if (!question) return 'Student';
    if (question.displayIdentityToPeers && question.authorDisplayName) return question.authorDisplayName;
    if (question.anonymousMode !== false) return 'Anonymous student';
    return question.authorDisplayName || 'Student';
}

function getStudentServiceSelectedQuestion(questions) {
    const ui = ensureStudentServiceUiState();
    if (!Array.isArray(questions) || !questions.length) {
        ui.selectedQuestionId = '';
        return null;
    }
    if (!ui.selectedQuestionId || !questions.some(question => question.id === ui.selectedQuestionId)) {
        const preferred = questions.find(question => question.pinned)
            || questions.find(question => question.status === 'pending_review')
            || questions[0];
        ui.selectedQuestionId = preferred?.id || questions[0].id;
    }
    return questions.find(question => question.id === ui.selectedQuestionId) || questions[0] || null;
}

function getStudentServiceOpenQuestion(questions) {
    const ui = ensureStudentServiceUiState();
    if (!Array.isArray(questions) || !questions.length) {
        ui.selectedQuestionId = '';
        return null;
    }
    return questions.find(question => question.id === ui.selectedQuestionId) || null;
}

function getStudentServiceFilteredQuestions(questions) {
    const ui = ensureStudentServiceUiState();
    const currentFaculty = normalizeFacultyCode(getCurrentFaculty?.() || '', '');
    const activeFacultyFilter = ui.qaFaculty || currentFaculty || 'ALL';
    const role = getEffectiveUserRole();
    const defaultStatus = role === USER_ROLES.STUDENT ? 'published' : 'all';
    const activeStatus = ui.qaStatus || defaultStatus;
    const search = String(ui.qaSearch || '').trim().toLowerCase();
    return (questions || []).filter(question => {
        const matchesFaculty = activeFacultyFilter === 'ALL'
            || !activeFacultyFilter
            || normalizeFacultyCode(question.facultyCode || '', '') === normalizeFacultyCode(activeFacultyFilter, '');
        const matchesCategory = ui.qaCategory === 'all' || question.category === ui.qaCategory;
        const matchesStatus = activeStatus === 'all' || question.status === activeStatus;
        const matchesSearch = !search || [
            question.title,
            question.body,
            question.category,
            question.facultyCode,
            ...(question.answers || []).map(answer => answer.body)
        ].some(value => String(value || '').toLowerCase().includes(search));
        return matchesFaculty && matchesCategory && matchesStatus && matchesSearch;
    }).sort((left, right) => {
        if (left.pinned !== right.pinned) return left.pinned ? -1 : 1;
        if (left.featured !== right.featured) return left.featured ? -1 : 1;
        return ssParseTime(right.updatedAt || right.createdAt) - ssParseTime(left.updatedAt || left.createdAt);
    });
}

function getStudentServiceSimilarQuestions(draft = {}) {
    const searchTerms = [draft.title, draft.body, draft.category]
        .map(value => String(value || '').trim().toLowerCase())
        .filter(Boolean);
    if (!searchTerms.length) return [];
    return getStudentServiceVisibleQuestions()
        .filter(question => question.status === 'published')
        .map(question => ({
            question,
            score: searchTerms.reduce((score, term) => {
                const haystack = [question.title, question.body, question.category].join(' ').toLowerCase();
                return score + (haystack.includes(term) ? 1 : 0);
            }, 0)
        }))
        .filter(entry => entry.score > 0)
        .sort((left, right) => right.score - left.score || ssParseTime(right.question.updatedAt) - ssParseTime(left.question.updatedAt))
        .slice(0, 3)
        .map(entry => entry.question);
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
    return ensureStudentServiceUiState().draftTicket;
}

function syncStudentServiceDraftTicketFromDom() {
    const draft = getStudentServiceDraftTicket();
    const serviceArea = document.getElementById('student-service-ticket-service-area')?.value || draft.serviceArea;
    const category = document.getElementById('student-service-ticket-category')?.value || draft.category;
    draft.serviceArea = getStudentServiceSupportArea(serviceArea).id;
    draft.category = STUDENT_SERVICE_CATEGORIES.includes(category)
        ? category
        : getStudentServiceDefaultCategoryForArea(draft.serviceArea);
    draft.title = document.getElementById('student-service-ticket-title')?.value ?? draft.title;
    draft.message = document.getElementById('student-service-ticket-message')?.value ?? draft.message;
    draft.subjectValue = document.getElementById('student-service-ticket-subject')?.value ?? draft.subjectValue;
    draft.relatedContextLabel = document.getElementById('student-service-ticket-context')?.value ?? draft.relatedContextLabel;
    return draft;
}

function setStudentServiceDraftTicketField(field, value, rerender = false) {
    const draft = getStudentServiceDraftTicket();
    draft[field] = String(value ?? '');
    if (field === 'serviceArea') {
        draft.serviceArea = getStudentServiceSupportArea(value).id;
        draft.category = getStudentServiceDefaultCategoryForArea(draft.serviceArea);
        ensureStudentServiceUiState().activeSupportArea = draft.serviceArea;
    }
    if (field === 'category' && !STUDENT_SERVICE_CATEGORIES.includes(draft.category)) {
        draft.category = getStudentServiceDefaultCategoryForArea(draft.serviceArea);
    }
    if (rerender) renderStudentServicePage();
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
    return getStudentServicePageLabel(pageId || 'student-service');
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
    const role = getEffectiveUserRole();
    const currentUser = getStudentServiceCurrentUser();
    const { tickets } = ensureStudentServiceStores();
    if (role === USER_ROLES.STUDENT) {
        return tickets
            .filter(ticket => String(ticket.studentId) === String(currentUser?.id || ''))
            .sort((a, b) => ssParseTime(b.updatedAt || b.createdAt) - ssParseTime(a.updatedAt || a.createdAt));
    }
    if (role === USER_ROLES.ADMIN || role === USER_ROLES.STUDENT_SERVICE) return tickets.slice();
    return [];
}

function sortStudentServiceTicketsForStaff(tickets = []) {
    return tickets.slice().sort((a, b) => {
        const orderDiff = (STUDENT_SERVICE_STATUS_ORDER[a.status] ?? 999) - (STUDENT_SERVICE_STATUS_ORDER[b.status] ?? 999);
        if (orderDiff !== 0) return orderDiff;
        return ssParseTime(b.updatedAt || b.createdAt) - ssParseTime(a.updatedAt || a.createdAt);
    });
}

function ensureSelectedStudentServiceTicket(tickets) {
    const ui = ensureStudentServiceUiState();
    if (!tickets.length) {
        ui.selectedTicketId = '';
        return null;
    }
    if (!ui.selectedTicketId || !tickets.some(ticket => ticket.id === ui.selectedTicketId)) {
        ui.selectedTicketId = tickets[0].id;
    }
    return tickets.find(ticket => ticket.id === ui.selectedTicketId) || tickets[0] || null;
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

function getStudentServiceStatusTone(status) {
    if (status === 'Resolved' || status === 'Closed') return { bg: 'rgba(var(--lux-home-secondary-rgb),0.14)', text: 'var(--lux-home-secondary)' };
    if (status === 'Waiting for Student') return { bg: 'rgba(var(--lux-accent-rgb),0.12)', text: 'var(--lux-accent)' };
    if (status === 'Waiting for Service') return { bg: 'rgba(var(--lux-home-secondary-rgb),0.12)', text: 'var(--lux-home-secondary)' };
    if (status === 'In Review') return { bg: 'rgba(var(--lux-accent-rgb),0.10)', text: 'rgba(var(--lux-accent-rgb),0.92)' };
    return { bg: 'var(--lux-bg-soft)', text: 'var(--lux-text-muted)' };
}

function getStudentServiceFilteredStaffTickets(tickets, currentUser) {
    const ui = ensureStudentServiceUiState();
    const query = ui.ticketSearch.trim().toLowerCase();
    return sortStudentServiceTicketsForStaff(tickets).filter(ticket => {
        const matchesStatus = ui.ticketStatus === 'all' || ticket.status === ui.ticketStatus;
        const matchesCategory = ui.ticketCategory === 'all' || ticket.category === ui.ticketCategory;
        const matchesServiceArea = ui.ticketServiceArea === 'all' || ticket.serviceArea === ui.ticketServiceArea;
        const matchesAssignee = ui.ticketAssignee === 'all'
            || (ui.ticketAssignee === 'mine' && String(ticket.assignedToId || '') === String(currentUser?.id || ''))
            || (ui.ticketAssignee === 'unassigned' && !String(ticket.assignedToId || '').trim())
            || (ui.ticketAssignee === 'assigned' && Boolean(String(ticket.assignedToId || '').trim()));
        const matchesFaculty = ui.ticketFaculty === 'all'
            || normalizeFacultyCode(ticket.faculty || '', '') === normalizeFacultyCode(ui.ticketFaculty || '', '');
        const matchesQuery = !query || [
            ticket.title,
            ticket.studentName,
            ticket.category,
            ticket.serviceArea,
            ticket.latestPreview,
            ticket.relatedSubjectName,
            ticket.relatedContextLabel,
            ticket.assignedToName,
            ticket.faculty
        ].some(field => String(field || '').toLowerCase().includes(query));
        return matchesStatus && matchesCategory && matchesServiceArea && matchesAssignee && matchesFaculty && matchesQuery;
    });
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
    if (!ticket) return null;
    const categoryKey = ssCategoryArticleKey(ticket.category);
    return articles.find(article => article.serviceArea === ticket.serviceArea)
        || articles.find(article => ssCategoryArticleKey(article.category) === categoryKey)
        || articles.find(article => article.published && ssCategoryArticleKey(article.category) === categoryKey)
        || null;
}

function getStudentServiceContextForTicket(ticket, articles) {
    if (!ticket) return null;
    return {
        text: STUDENT_SERVICE_CONTEXT_COPY[ticket.category] || STUDENT_SERVICE_CONTEXT_COPY['General Question'],
        article: findStudentServiceArticleForTicket(ticket, articles)
    };
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

function setStudentServiceMarkup(element, key, markup) {
    if (!element) return;
    if (studentServiceMarkupCache[key] === markup) return;
    const range = document.createRange();
    range.selectNodeContents(element);
    element.replaceChildren(range.createContextualFragment(markup));
    studentServiceMarkupCache[key] = markup;
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
                            <span class="student-service-status" style="--student-service-status-bg:${getStudentServiceStatusTone(ticket.status).bg}; --student-service-status-text:${getStudentServiceStatusTone(ticket.status).text};">${ssEscape(ticket.status)}</span>
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
    const ui = ensureStudentServiceUiState();
    if (ui.serviceLane === 'qa' && ui[field] === value) return;
    ui.serviceLane = 'qa';
    ui[field] = value;
    renderStudentServicePage();
}

function setStudentServiceQuestionComposerExpanded(expanded) {
    const ui = ensureStudentServiceUiState();
    const nextValue = Boolean(expanded);
    if (ui.serviceLane === 'qa' && ui.qaComposerExpanded === nextValue) return;
    ui.serviceLane = 'qa';
    ui.qaComposerExpanded = nextValue;
    renderStudentServicePage();
}

function setStudentServiceDraftQuestionField(field, value) {
    const ui = ensureStudentServiceUiState();
    ui.serviceLane = 'qa';
    if (!ui.draftQuestion || typeof ui.draftQuestion !== 'object') {
        ui.draftQuestion = buildStudentServiceDefaultDraftQuestion();
    }
    if (field === 'anonymousMode') {
        ui.draftQuestion.anonymousMode = Boolean(value);
        ui.draftQuestion.displayIdentityToPeers = !ui.draftQuestion.anonymousMode;
    } else if (field === 'displayIdentityToPeers') {
        ui.draftQuestion.displayIdentityToPeers = Boolean(value);
        if (ui.draftQuestion.displayIdentityToPeers) ui.draftQuestion.anonymousMode = false;
    } else {
        ui.draftQuestion[field] = String(value ?? '');
    }
    if (field === 'facultyCode') {
        ui.draftQuestion.facultyCode = normalizeFacultyCode(ui.draftQuestion.facultyCode || '', '');
    }
}

function openStudentServiceQuestion(questionId) {
    const ui = ensureStudentServiceUiState();
    const nextQuestionId = ui.selectedQuestionId === questionId ? '' : (questionId || '');
    if (ui.serviceLane === 'qa' && ui.selectedQuestionId === nextQuestionId) return;
    ui.serviceLane = 'qa';
    ui.selectedQuestionId = nextQuestionId;
    renderStudentServicePage();
}

function getStudentServiceQuestionStatusLabel(question) {
    if (!question) return 'Published';
    if (question.status === 'pending_review') return 'Pending review';
    if (question.status === 'published') return 'Published';
    if (question.status === 'archived') return 'Archived';
    if (question.status === 'merged') return 'Merged';
    return String(question.status || 'Published');
}

function getStudentServiceQuestionStatusTone(question) {
    const status = String(question?.status || '').toLowerCase();
    if (status === 'published') {
        return {
            bg: 'rgba(var(--lux-home-secondary-rgb),0.14)',
            text: 'var(--lux-home-secondary)'
        };
    }
    if (status === 'pending_review') {
        return {
            bg: 'rgba(var(--lux-accent-rgb),0.16)',
            text: 'var(--lux-accent)'
        };
    }
    return {
        bg: 'rgba(255,255,255,0.08)',
        text: 'var(--lux-text-muted)'
    };
}

function getStudentServiceQuestionAnswerCount(question) {
    return (question?.answers || []).filter(answer => answer.status !== 'archived').length;
}

function renderStudentServiceQuestionList(questions = [], options = {}) {
    return renderStudentServiceQuestionFeed(questions, options);
}

function renderStudentServiceQuestionComposer(currentUser, options = {}) {
    const ui = ensureStudentServiceUiState();
    const draftQuestion = ui.draftQuestion || buildStudentServiceDefaultDraftQuestion();
    const similarQuestions = getStudentServiceSimilarQuestions(draftQuestion);
    const expanded = options.expanded !== false && ui.qaComposerExpanded;
    const authorName = currentUser?.displayName || currentUser?.name || currentUser?.fullName || 'Student';
    const prompt = draftQuestion.askMode === 'private'
        ? 'Ask privately when the case includes personal or sensitive details.'
        : 'Ask a question that could help other students too.';
    if (!expanded) {
        return `
            <section class="student-service-zone student-service-qa-composer-card">
                <div class="student-service-qa-composer-collapsed">
                    <div class="student-service-qa-avatar">${ssEscape(ssInitials(authorName, '?'))}</div>
                    <button type="button" class="student-service-qa-composer-prompt" data-student-service-question-composer-toggle="open">
                        <strong>Ask a question that could help other students</strong>
                        <span>Public answers reduce repeated messages to staff. Expand the composer only when you are ready to post.</span>
                    </button>
                    <button type="button" class="lux-primary-btn" data-student-service-question-composer-toggle="open"><i class="fas fa-pen"></i> Ask</button>
                </div>
            </section>
        `;
    }
    return `
        <section class="student-service-zone student-service-qa-composer-card">
            <div class="student-service-zone-head">
                <div>
                    <div class="student-service-kicker">Ask question</div>
                    <div class="student-service-zone-title">Post in the Q&A feed</div>
                    <div class="student-service-zone-copy">${ssEscape(prompt)}</div>
                </div>
                <button type="button" class="student-service-mini-action" data-student-service-question-composer-toggle="close"><i class="fas fa-chevron-up"></i> Collapse</button>
            </div>
            <div class="student-service-request-form">
                <div class="student-service-qa-mode-row">
                    <button type="button" class="${draftQuestion.askMode === 'public' ? 'lux-primary-btn' : 'lux-secondary-btn'}" data-student-service-draft-question-mode="public"><i class="fas fa-globe"></i> Public</button>
                    <button type="button" class="${draftQuestion.askMode === 'private' ? 'lux-primary-btn' : 'lux-secondary-btn'}" data-student-service-draft-question-mode="private"><i class="fas fa-lock"></i> Private</button>
                </div>
                <input id="student-service-question-title" type="text" value="${ssEscape(draftQuestion.title || '')}" data-student-service-draft-question-field="title" placeholder="Question title">
                <textarea id="student-service-question-body" rows="5" data-student-service-draft-question-field="body" placeholder="Explain the question clearly so the answer can be reused by other students.">${ssEscape(draftQuestion.body || '')}</textarea>
                <div class="student-service-staff-filter-row">
                    <select id="student-service-question-category" data-student-service-draft-question-field="category">
                        ${STUDENT_SERVICE_CATEGORIES.map(category => `<option value="${ssEscape(category)}"${draftQuestion.category === category ? ' selected' : ''}>${ssEscape(category)}</option>`).join('')}
                    </select>
                    <select id="student-service-question-faculty" data-student-service-draft-question-field="facultyCode">
                        <option value="${ssEscape(normalizeFacultyCode(currentUser?.facultyCode || currentUser?.faculty || '', '') || '')}"${normalizeFacultyCode(draftQuestion.facultyCode || '', '') === normalizeFacultyCode(currentUser?.facultyCode || currentUser?.faculty || '', '') ? ' selected' : ''}>${ssEscape(ssFacultyLabel(currentUser?.facultyCode || currentUser?.faculty || ''))}</option>
                        <option value="ALL"${draftQuestion.facultyCode === 'ALL' ? ' selected' : ''}>All faculties</option>
                    </select>
                </div>
                <label class="student-service-pill student-service-pill-toggle">
                    <input id="student-service-question-anonymous" type="checkbox" ${draftQuestion.anonymousMode !== false ? 'checked' : ''} data-student-service-draft-question-field="anonymousMode">
                    Post anonymously to other students
                </label>
                <div class="student-service-zone-copy student-service-qa-helper-copy">
                    Student Service and authorized responders can still see the real author for moderation and follow-up.
                    ${draftQuestion.askMode === 'private' ? ' Private mode will create a direct Student Service ticket instead of a public post.' : ''}
                </div>
                ${similarQuestions.length ? `
                    <div class="student-service-qa-similar-strip">
                        <div class="student-service-kicker">Similar questions</div>
                        <div class="student-service-qa-similar-list">
                            ${similarQuestions.map(question => `<button type="button" class="student-service-mini-action" data-student-service-open-question="${ssEscape(question.id)}">${ssEscape(question.title)}</button>`).join('')}
                        </div>
                    </div>
                ` : ''}
                <div class="student-service-action-row">
                    <button class="lux-primary-btn" type="button" data-student-service-submit-question="true"><i class="fas fa-paper-plane"></i> ${draftQuestion.askMode === 'private' ? 'Create private ticket' : 'Post question'}</button>
                    <button type="button" class="lux-secondary-btn" data-student-service-question-composer-toggle="close"><i class="fas fa-minus"></i> Minimize</button>
                </div>
            </div>
        </section>
    `;
}

function renderStudentServiceQuestionFilterChips(options = {}) {
    const ui = ensureStudentServiceUiState();
    const currentFaculty = normalizeFacultyCode(getCurrentFaculty?.() || '', '');
    const role = getEffectiveUserRole();
    const responderOnly = [USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(role) && !canCurrentUserModerateStudentService();
    const currentFacultyLabel = currentFaculty ? ssFacultyLabel(currentFaculty) : 'Current faculty';
    const statusOptions = role === USER_ROLES.STUDENT
        ? [
            ['published', 'Published'],
            ['pending_review', 'My pending'],
            ['all', 'Everything I can see']
        ]
        : [
            ['all', 'All'],
            ['pending_review', responderOnly ? 'Needs answer' : 'Pending review'],
            ['published', 'Published'],
            ...(!responderOnly ? [['archived', 'Archived']] : [])
        ];
    const categoryOptions = ['all', ...STUDENT_SERVICE_CATEGORIES];
    return `
        <div class="student-service-qa-filter-stack">
            <div class="student-service-qa-filter-row">
                ${statusOptions.map(([value, label]) => `
                    <button type="button" class="${(ui.qaStatus || (role === USER_ROLES.STUDENT ? 'published' : 'all')) === value ? 'is-active' : ''}" data-student-service-question-filter-field="qaStatus" data-student-service-question-filter-value="${ssEscape(value)}">${ssEscape(label)}</button>
                `).join('')}
            </div>
            <div class="student-service-qa-filter-row">
                <button type="button" class="${(ui.qaFaculty || currentFaculty || 'ALL') !== 'ALL' ? 'is-active' : ''}" data-student-service-question-filter-field="qaFaculty" data-student-service-question-filter-value="${ssEscape(currentFaculty || 'ALL')}">${ssEscape(currentFacultyLabel)}</button>
                <button type="button" class="${ui.qaFaculty === 'ALL' ? 'is-active' : ''}" data-student-service-question-filter-field="qaFaculty" data-student-service-question-filter-value="ALL">All faculties</button>
                ${categoryOptions.map(value => {
                    const label = value === 'all' ? 'All categories' : value;
                    return `<button type="button" class="${(ui.qaCategory || 'all') === value ? 'is-active' : ''}" data-student-service-question-filter-field="qaCategory" data-student-service-question-filter-value="${ssEscape(value)}">${ssEscape(label)}</button>`;
                }).join('')}
            </div>
        </div>
    `;
}

function renderStudentServiceQuestionFeed(questions = [], options = {}) {
    const mode = options.mode === 'staff' ? 'staff' : 'student';
    const selectedId = options.selectedQuestionId || '';
    if (!Array.isArray(questions) || !questions.length) return '';
    return `
        <div class="student-service-qa-feed">
            ${(questions || []).map(question => {
                const statusTone = getStudentServiceQuestionStatusTone(question);
                const accepted = question.acceptedAnswerId
                    ? (question.answers || []).find(answer => answer.id === question.acceptedAnswerId) || null
                    : (question.answers || []).find(answer => answer.isAccepted) || null;
                const authorLabel = getStudentServiceQuestionAuthorLabel(question);
                const answerCount = getStudentServiceQuestionAnswerCount(question);
                const isOpen = selectedId === question.id;
                const hasStaffAnswer = (question.answers || []).some(answer => answer.status === 'published');
                return `
                    <article class="student-service-qa-card${isOpen ? ' is-open' : ''}">
                        <div class="student-service-qa-card-head">
                            <div class="student-service-qa-card-author">
                                <div class="student-service-qa-avatar">${ssEscape(ssInitials(authorLabel, '?'))}</div>
                                <div class="student-service-qa-card-author-copy">
                                    <strong>${ssEscape(mode === 'staff' ? `Asked by ${authorLabel}` : authorLabel)}</strong>
                                    <span>${ssEscape(ssFormatDateTime(question.updatedAt || question.createdAt))}</span>
                                </div>
                            </div>
                            <span class="student-service-status" style="--student-service-status-bg:${statusTone.bg}; --student-service-status-text:${statusTone.text};">${ssEscape(getStudentServiceQuestionStatusLabel(question))}</span>
                        </div>
                        <button type="button" class="student-service-qa-card-main" data-student-service-open-question="${ssEscape(question.id)}">
                            <div class="student-service-qa-chip-row">
                                <span class="student-service-pill">${ssEscape(question.category)}</span>
                                <span class="student-service-pill">${ssEscape(question.facultyCode ? ssFacultyLabel(question.facultyCode) : 'All faculties')}</span>
                                ${question.anonymousMode !== false ? '<span class="student-service-pill">Anonymous</span>' : ''}
                                ${question.pinned ? '<span class="student-service-pill">Pinned</span>' : ''}
                                ${question.featured ? '<span class="student-service-pill">Featured</span>' : ''}
                            </div>
                            <div class="student-service-qa-card-title">${ssEscape(question.title)}</div>
                            <div class="student-service-qa-card-preview">${ssEscape(ssClampText(question.body, 240))}</div>
                            ${accepted ? `<div class="student-service-qa-card-accepted"><i class="fas fa-check-circle"></i> Accepted answer available</div>` : ''}
                        </button>
                        <div class="student-service-qa-card-footer">
                            <div class="student-service-qa-card-stats">
                                <span><i class="fas fa-comments"></i> ${answerCount} answer${answerCount === 1 ? '' : 's'}</span>
                                <span><i class="far fa-thumbs-up"></i> ${Number(question.helpfulCount || 0)} helpful</span>
                                <span><i class="fas fa-user-check"></i> ${hasStaffAnswer ? 'Answered' : 'Waiting for answer'}</span>
                            </div>
                            <button type="button" class="student-service-mini-action" data-student-service-open-question="${ssEscape(question.id)}"><i class="fas ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'}"></i> ${isOpen ? 'Hide thread' : 'Open thread'}</button>
                        </div>
                        ${isOpen ? `<div class="student-service-qa-card-detail">${renderStudentServiceQuestionDetail(question, options)}</div>` : ''}
                    </article>
                `;
            }).join('')}
        </div>
    `;
}

function renderStudentServiceQuestionDetail(question, options = {}) {
    if (!question) {
        return '<div class="student-service-empty-state student-service-empty-state-large">Select a public question to review the answers and moderation options.</div>';
    }
    const role = getEffectiveUserRole();
    const currentUser = getStudentServiceCurrentUser();
    const canModerate = canCurrentUserModerateStudentService();
    const canRespond = canCurrentUserRespondToStudentService();
    const canAccept = canModerate || (role === USER_ROLES.STUDENT && String(question.authorUserId || '') === String(currentUser?.id || ''));
    const isOwner = String(question.authorUserId || '') === String(currentUser?.id || '');
    const authorLabel = getStudentServiceQuestionAuthorLabel(question);
    const acceptedAnswerId = String(question.acceptedAnswerId || '');
    const answers = (question.answers || [])
        .filter(answer => canModerate || answer.status === 'published' || answer.responderUserId === String(currentUser?.id || ''))
        .sort((left, right) => {
            const leftAccepted = acceptedAnswerId && left.id === acceptedAnswerId;
            const rightAccepted = acceptedAnswerId && right.id === acceptedAnswerId;
            if (leftAccepted !== rightAccepted) return leftAccepted ? -1 : 1;
            return ssParseTime(left.createdAt || left.updatedAt) - ssParseTime(right.createdAt || right.updatedAt);
        });
    const helpful = Number(question.helpfulCount || 0);
    const notHelpful = Number(question.notHelpfulCount || 0);
    return `
        <div class="student-service-qa-detail">
            <div class="student-service-ticket-detail-meta">
                <span class="student-service-pill">Asked by ${ssEscape(authorLabel)}</span>
                <span class="student-service-pill">Updated ${ssEscape(ssFormatDateTime(question.updatedAt || question.createdAt))}</span>
                ${question.lastReviewedAt ? `<span class="student-service-pill">Reviewed ${ssEscape(ssFormatDate(question.lastReviewedAt))}</span>` : ''}
                ${question.staleReviewRequested ? '<span class="student-service-pill">Stale review requested</span>' : ''}
            </div>
            <div class="student-service-qa-detail-body">${ssTextBlock(question.body)}</div>
            ${question.relatedQuestionIds?.length ? `<div class="student-service-ticket-detail-copy">Related questions: ${ssEscape(question.relatedQuestionIds.join(', '))}</div>` : ''}
            <div class="student-service-action-row">
                <button type="button" class="lux-secondary-btn" data-student-service-question-id="${ssEscape(question.id)}" data-student-service-question-feedback="helpful"><i class="far fa-thumbs-up"></i> Helpful (${helpful})</button>
                <button type="button" class="lux-secondary-btn" data-student-service-question-id="${ssEscape(question.id)}" data-student-service-question-feedback="not_helpful"><i class="far fa-thumbs-down"></i> Not helpful (${notHelpful})</button>
                ${canModerate ? `<button type="button" class="lux-secondary-btn" data-student-service-question-id="${ssEscape(question.id)}" data-student-service-question-flag-field="pinned" data-student-service-question-flag-value="${question.pinned ? 'false' : 'true'}"><i class="fas fa-thumbtack"></i> ${question.pinned ? 'Unpin' : 'Pin'}</button>` : ''}
                ${canModerate ? `<button type="button" class="lux-secondary-btn" data-student-service-question-id="${ssEscape(question.id)}" data-student-service-question-flag-field="featured" data-student-service-question-flag-value="${question.featured ? 'false' : 'true'}"><i class="fas fa-star"></i> ${question.featured ? 'Unfeature' : 'Feature'}</button>` : ''}
            </div>
            ${canModerate ? `
                <div class="student-service-action-row">
                    <button type="button" class="lux-secondary-btn" data-student-service-question-id="${ssEscape(question.id)}" data-student-service-question-publish="true"><i class="fas fa-check-circle"></i> Publish</button>
                    <button type="button" class="lux-secondary-btn" data-student-service-question-id="${ssEscape(question.id)}" data-student-service-question-flag-field="staleReviewRequested" data-student-service-question-flag-value="${question.staleReviewRequested ? 'false' : 'true'}"><i class="fas fa-clock"></i> ${question.staleReviewRequested ? 'Clear stale flag' : 'Flag stale review'}</button>
                    <button type="button" class="lux-secondary-btn" data-student-service-question-id="${ssEscape(question.id)}" data-student-service-question-convert="ticket"><i class="fas fa-lock"></i> Convert to private ticket</button>
                    <button type="button" class="lux-secondary-btn" data-student-service-question-id="${ssEscape(question.id)}" data-student-service-question-convert="article"><i class="fas fa-book-open"></i> Convert to article</button>
                    <button type="button" class="lux-secondary-btn" data-student-service-question-id="${ssEscape(question.id)}" data-student-service-question-merge="true"><i class="fas fa-code-branch"></i> Merge duplicate</button>
                </div>
            ` : ''}
            <div class="student-service-qa-answer-list">
                ${answers.length ? answers.map(answer => `
                    <div class="student-service-qa-answer-card${acceptedAnswerId === answer.id ? ' is-accepted' : ''}">
                        <div class="student-service-qa-answer-head">
                            <div class="student-service-qa-answer-author">
                                <div class="student-service-qa-avatar student-service-qa-avatar-sm">${ssEscape(ssInitials(answer.responderName || 'Responder', 'R'))}</div>
                                <div class="student-service-qa-card-author-copy">
                                    <strong>${ssEscape(answer.responderName || 'Responder')}</strong>
                                    <span>${ssEscape(ssRoleLabel(answer.responderRole))}</span>
                                </div>
                            </div>
                            <div class="student-service-qa-answer-meta">
                                ${acceptedAnswerId === answer.id ? '<span class="student-service-pill">Accepted answer</span>' : ''}
                                <span>${ssEscape(ssFormatDateTime(answer.updatedAt || answer.createdAt))}</span>
                            </div>
                        </div>
                        <div class="student-service-qa-answer-copy">${ssTextBlock(answer.body)}</div>
                        ${(canAccept && answer.status === 'published') ? `
                            <div class="student-service-action-row">
                                <button type="button" class="lux-secondary-btn" data-student-service-question-id="${ssEscape(question.id)}" data-student-service-answer-id="${ssEscape(answer.id)}" data-student-service-answer-accept="true"><i class="fas fa-check"></i> ${acceptedAnswerId === answer.id ? 'Accepted' : 'Mark accepted'}</button>
                            </div>
                        ` : ''}
                    </div>
                `).join('') : '<div class="student-service-empty-state">No published answers yet. Staff will respond here after moderation.</div>'}
            </div>
            ${(canRespond && role !== USER_ROLES.STUDENT) ? `
                <div class="student-service-thread-reply student-service-qa-thread-reply">
                    <textarea id="student-service-question-reply" rows="4" placeholder="Write a reusable answer for this public question."></textarea>
                    <button class="lux-primary-btn" type="button" data-student-service-submit-answer="${ssEscape(question.id)}"><i class="fas fa-reply"></i> Submit answer</button>
                </div>
            ` : ''}
            ${(isOwner && question.status !== 'published') ? `
                <div class="student-service-empty-state">This question is visible to you and staff now. It becomes public after Student Service publishes it.</div>
            ` : ''}
        </div>
    `;
}

function renderStudentServiceStudentHub(container, visibleArticles, visibleTickets) {
    if (hasStudentServiceServiceModule()) {
        return window.renderStudentServiceStudentHub(container, visibleArticles, visibleTickets);
    }
    renderStudentServiceServiceModuleLoading(container, 'student');
    ensureStudentServiceServiceModule().then(() => renderStudentServicePage()).catch(() => null);
}

function renderStudentServiceStudentQaHub(container) {
    if (hasStudentServiceQaModule()) {
        return window.renderStudentServiceStudentQaHub(container);
    }
    renderStudentServiceQaModuleLoading(container, 'student');
    ensureStudentServiceQaModule().then(() => renderStudentServicePage()).catch(() => null);
}

function openStudentServiceTicket(ticketId) {
    const ui = ensureStudentServiceUiState();
    const nextTicketId = ticketId || '';
    const nextStudentTab = getEffectiveUserRole() === USER_ROLES.STUDENT ? 'my_tickets' : ui.studentTab;
    if (ui.serviceLane === 'service' && ui.selectedTicketId === nextTicketId && ui.studentTab === nextStudentTab) {
        return;
    }
    ui.serviceLane = 'service';
    ui.selectedTicketId = nextTicketId;
    if (getEffectiveUserRole() === USER_ROLES.STUDENT) ui.studentTab = 'my_tickets';
    renderStudentServicePage();
}

function renderStudentServiceMyTicketsHub(container, visibleTickets) {
    if (hasStudentServiceServiceModule()) {
        return window.renderStudentServiceMyTicketsHub(container, visibleTickets);
    }
    renderStudentServiceServiceModuleLoading(container, 'student');
    ensureStudentServiceServiceModule().then(() => renderStudentServicePage()).catch(() => null);
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
    const ui = ensureStudentServiceUiState();
    const nextArticleId = articleId || '';
    if (
        ui.serviceLane === 'service'
        && ui.selectedArticleId === nextArticleId
        && ui.articleEditorId === nextArticleId
        && ui.staffPanel === 'articles'
    ) {
        return;
    }
    ui.serviceLane = 'service';
    ui.selectedArticleId = nextArticleId;
    ui.articleEditorId = nextArticleId;
    ui.staffPanel = 'articles';
    renderStudentServicePage();
}

function renderStudentServiceResponderServiceLane(container, visibleArticles) {
    if (hasStudentServiceServiceModule()) {
        return window.renderStudentServiceResponderServiceLane(container, visibleArticles);
    }
    renderStudentServiceServiceModuleLoading(container, 'responder');
    ensureStudentServiceServiceModule().then(() => renderStudentServicePage()).catch(() => null);
}

function renderStudentServiceStaffQaFeed(container, options = {}) {
    if (hasStudentServiceQaModule()) {
        return window.renderStudentServiceStaffQaFeed(container, options);
    }
    renderStudentServiceQaModuleLoading(container, 'staff');
    ensureStudentServiceQaModule().then(() => renderStudentServicePage()).catch(() => null);
}

function renderStudentServiceStaffWorkbench(container, visibleArticles, visibleTickets, options = {}) {
    if (hasStudentServiceServiceModule()) {
        return window.renderStudentServiceStaffWorkbench(container, visibleArticles, visibleTickets, options);
    }
    renderStudentServiceServiceModuleLoading(container, 'service');
    ensureStudentServiceServiceModule().then(() => renderStudentServicePage()).catch(() => null);
}

function setStudentServiceArticleSearch(value) {
    const ui = ensureStudentServiceUiState();
    const nextValue = String(value || '');
    if (ui.serviceLane === 'service' && ui.articleSearch === nextValue) return;
    ui.serviceLane = 'service';
    ui.articleSearch = nextValue;
    renderStudentServicePage();
}

function setStudentServiceTicketFilter(field, value) {
    const ui = ensureStudentServiceUiState();
    if (ui.serviceLane === 'service' && ui[field] === value) return;
    ui.serviceLane = 'service';
    ui[field] = value;
    renderStudentServicePage();
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

function toggleStudentServiceStudentDetails() {
    const ui = ensureStudentServiceUiState();
    ui.studentDetailsExpanded = !ui.studentDetailsExpanded;
    renderStudentServicePage();
}

function toggleStudentServiceAdvancedFilters() {
    const ui = ensureStudentServiceUiState();
    ui.staffFiltersExpanded = !ui.staffFiltersExpanded;
    renderStudentServicePage();
}

function toggleStudentServiceDetailSection(sectionKey) {
    const ui = ensureStudentServiceUiState();
    ui.detailSections[sectionKey] = !ui.detailSections[sectionKey];
    renderStudentServicePage();
}

async function refreshStudentServiceDataAndRender(force = true) {
    try {
        await fetchStudentServiceBootstrap(force);
    } catch (error) {}
    renderStudentServicePage();
}

async function postStudentService(path, body = {}) {
    if (typeof kiuPortalFetch !== 'function') {
        throw new Error('Student Service backend is unavailable.');
    }
    return kiuPortalFetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {})
    });
}

async function submitStudentServiceTicket() {
    const currentUser = getStudentServiceCurrentUser();
    if (!currentUser || getEffectiveUserRole() !== USER_ROLES.STUDENT) return;
    const draft = syncStudentServiceDraftTicketFromDom();
    const category = draft.category || '';
    const serviceArea = getStudentServiceSupportArea(draft.serviceArea).id;
    const area = getStudentServiceSupportArea(serviceArea);
    const title = String(draft.title || '').trim() || area.label;
    const message = String(draft.message || '').trim();
    const subjectValue = draft.subjectValue || '';
    const relatedContextLabel = String(draft.relatedContextLabel || '').trim();
    if (!category || !message) {
        alert('Please choose a help topic and write your message before sending.');
        return;
    }
    const subjectOptions = getStudentServiceSubjectOptions();
    const subjectMeta = subjectOptions.find(item => `${item.subjectId}::${item.groupId}` === subjectValue) || null;
    try {
        const payload = await postStudentService('/api/student-service/tickets', {
            title,
            message,
            category,
            serviceArea,
            semester: currentUser.semester || '',
            relatedSubjectId: subjectMeta?.subjectId || '',
            relatedSubjectName: subjectMeta?.subjectName || '',
            relatedContextLabel,
            facultyCode: subjectMeta?.faculty || currentUser.facultyCode || currentUser.faculty || '',
            intakeContext: buildStudentServiceIntakeContext(currentUser.id)
        });
        const ticket = payload?.ticket || null;
        const ui = ensureStudentServiceUiState();
        ui.serviceLane = 'service';
        ui.selectedTicketId = ticket?.id || '';
        ui.studentTab = 'my_tickets';
        ui.ticketSearch = '';
        ui.studentDetailsExpanded = false;
        ui.qaComposerExpanded = false;
        ui.draftTicket = buildStudentServiceDefaultDraftTicket();
        ui.activeSupportArea = serviceArea;
        await refreshStudentServiceDataAndRender();
        alert('Your Student Service ticket has been submitted.');
    } catch (error) {
        console.error('Student Service ticket submission failed.', error);
        alert(error?.message || 'Student Service ticket could not be submitted.');
    }
}

async function replyStudentServiceTicket() {
    const currentUser = getStudentServiceCurrentUser();
    const role = getEffectiveUserRole();
    if (!currentUser || ![USER_ROLES.STUDENT, USER_ROLES.ADMIN, USER_ROLES.STUDENT_SERVICE].includes(role)) return;
    const ui = ensureStudentServiceUiState();
    const ticket = ensureStudentServiceStores().tickets.find(item => item.id === ui.selectedTicketId);
    const textareaId = role === USER_ROLES.STUDENT ? 'student-service-student-reply' : 'student-service-staff-reply';
    const message = document.getElementById(textareaId)?.value.trim() || '';
    if (!ticket || !message) {
        alert('Write a message before sending.');
        return;
    }
    try {
        await postStudentService(`/api/student-service/tickets/${encodeURIComponent(ticket.id)}/replies`, { message });
        await refreshStudentServiceDataAndRender();
    } catch (error) {
        console.error('Student Service ticket reply failed.', error);
        alert(error?.message || 'Reply could not be sent.');
    }
}

async function updateStudentServiceTicketStatus(status) {
    const role = getEffectiveUserRole();
    if (![USER_ROLES.ADMIN, USER_ROLES.STUDENT_SERVICE].includes(role)) return;
    const ui = ensureStudentServiceUiState();
    const ticket = ensureStudentServiceStores().tickets.find(item => item.id === ui.selectedTicketId);
    if (!ticket || !STUDENT_SERVICE_STATUSES.includes(status)) return;
    try {
        await postStudentService(`/api/student-service/tickets/${encodeURIComponent(ticket.id)}/status`, { status });
        await refreshStudentServiceDataAndRender();
    } catch (error) {
        console.error('Student Service ticket status update failed.', error);
        alert(error?.message || 'Ticket status could not be updated.');
    }
}

async function assignStudentServiceTicketToCurrentUser() {
    const role = getEffectiveUserRole();
    const currentUser = getStudentServiceCurrentUser();
    if (!currentUser || ![USER_ROLES.ADMIN, USER_ROLES.STUDENT_SERVICE].includes(role)) return;
    const ui = ensureStudentServiceUiState();
    const ticket = ensureStudentServiceStores().tickets.find(item => item.id === ui.selectedTicketId);
    if (!ticket) return;
    try {
        await postStudentService(`/api/student-service/tickets/${encodeURIComponent(ticket.id)}/assign`, {});
        await refreshStudentServiceDataAndRender();
    } catch (error) {
        console.error('Student Service assignment failed.', error);
        alert(error?.message || 'Ticket could not be assigned.');
    }
}

async function submitStudentServiceQuestion() {
    const currentUser = getStudentServiceCurrentUser();
    const role = getEffectiveUserRole();
    if (!currentUser || role !== USER_ROLES.STUDENT) return;
    const ui = ensureStudentServiceUiState();
    const draftQuestion = ui.draftQuestion || buildStudentServiceDefaultDraftQuestion();
    const title = String(draftQuestion.title || '').trim();
    const body = String(draftQuestion.body || '').trim();
    if (!title || !body) {
        alert('Write a title and message before submitting your question.');
        return;
    }
    if (draftQuestion.askMode === 'private') {
        const area = getStudentServiceSupportAreaForCategory(draftQuestion.category);
        setStudentServiceDraftTicketField('title', title);
        setStudentServiceDraftTicketField('message', body);
        setStudentServiceDraftTicketField('serviceArea', area.id);
        setStudentServiceDraftTicketField('category', draftQuestion.category);
        await submitStudentServiceTicket();
        return;
    }
    try {
        const area = getStudentServiceSupportAreaForCategory(draftQuestion.category);
        const payload = await postStudentService('/api/student-service/questions', {
            title,
            body,
            serviceArea: area.id,
            category: draftQuestion.category,
            facultyCode: draftQuestion.facultyCode || currentUser.facultyCode || currentUser.faculty || '',
            anonymousMode: draftQuestion.anonymousMode !== false,
            displayIdentityToPeers: Boolean(draftQuestion.displayIdentityToPeers)
        });
        if (payload?.convertedToTicket) {
            const ticket = payload.ticket || null;
            ui.serviceLane = 'service';
            ui.studentTab = 'my_tickets';
            ui.selectedTicketId = ticket?.id || '';
            ui.qaComposerExpanded = false;
            alert('This question contains sensitive details, so it was converted into a private ticket.');
        } else {
            ui.serviceLane = 'qa';
            ui.selectedQuestionId = payload?.question?.id || ui.selectedQuestionId;
            ui.qaComposerExpanded = false;
            alert('Your public question was submitted for review.');
        }
        ui.draftQuestion = buildStudentServiceDefaultDraftQuestion();
        await refreshStudentServiceDataAndRender();
    } catch (error) {
        console.error('Student Service question submission failed.', error);
        alert(error?.message || 'Public question could not be submitted.');
    }
}

async function submitStudentServiceQuestionAnswer(questionId) {
    const role = getEffectiveUserRole();
    if (![USER_ROLES.ADMIN, USER_ROLES.STUDENT_SERVICE, USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(role)) return;
    const body = String(document.getElementById('student-service-question-reply')?.value || '').trim();
    if (!questionId || !body) {
        alert('Write an answer before sending it.');
        return;
    }
    try {
        await postStudentService(`/api/student-service/questions/${encodeURIComponent(questionId)}/answers`, { body });
        await refreshStudentServiceDataAndRender();
    } catch (error) {
        console.error('Student Service answer submission failed.', error);
        alert(error?.message || 'Answer could not be submitted.');
    }
}

async function setStudentServiceQuestionFeedback(questionId, value) {
    try {
        await postStudentService(`/api/student-service/questions/${encodeURIComponent(questionId)}/feedback`, { value });
        await refreshStudentServiceDataAndRender();
    } catch (error) {
        console.error('Student Service feedback failed.', error);
        alert(error?.message || 'Feedback could not be saved.');
    }
}

async function acceptStudentServiceAnswer(questionId, answerId) {
    try {
        await postStudentService(`/api/student-service/questions/${encodeURIComponent(questionId)}/accept-answer`, { answerId });
        await refreshStudentServiceDataAndRender();
    } catch (error) {
        console.error('Student Service accepted answer update failed.', error);
        alert(error?.message || 'Accepted answer could not be updated.');
    }
}

async function publishStudentServiceQuestion(questionId) {
    try {
        await postStudentService(`/api/student-service/questions/${encodeURIComponent(questionId)}/publish`, {});
        await refreshStudentServiceDataAndRender();
    } catch (error) {
        console.error('Student Service question publish failed.', error);
        alert(error?.message || 'Question could not be published.');
    }
}

async function toggleStudentServiceQuestionFlag(questionId, field, value) {
    try {
        await postStudentService(`/api/student-service/questions/${encodeURIComponent(questionId)}/flags`, { [field]: value });
        await refreshStudentServiceDataAndRender();
    } catch (error) {
        console.error('Student Service question flag update failed.', error);
        alert(error?.message || 'Question flags could not be updated.');
    }
}

async function convertStudentServiceQuestionToTicket(questionId) {
    try {
        await postStudentService(`/api/student-service/questions/${encodeURIComponent(questionId)}/convert-to-ticket`, {});
        await refreshStudentServiceDataAndRender();
    } catch (error) {
        console.error('Student Service question-to-ticket conversion failed.', error);
        alert(error?.message || 'Question could not be converted to a private ticket.');
    }
}

async function convertStudentServiceQuestionToArticle(questionId) {
    try {
        await postStudentService(`/api/student-service/questions/${encodeURIComponent(questionId)}/convert-to-article`, {});
        await refreshStudentServiceDataAndRender();
    } catch (error) {
        console.error('Student Service question-to-article conversion failed.', error);
        alert(error?.message || 'Question could not be converted to an article.');
    }
}

async function mergeStudentServiceQuestionPrompt(questionId) {
    const targetQuestionId = String(window.prompt('Enter the target question ID to merge into:', '') || '').trim();
    if (!targetQuestionId) return;
    try {
        await postStudentService(`/api/student-service/questions/${encodeURIComponent(questionId)}/merge`, { targetQuestionId });
        await refreshStudentServiceDataAndRender();
    } catch (error) {
        console.error('Student Service question merge failed.', error);
        alert(error?.message || 'Questions could not be merged.');
    }
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

function addStudentServiceInternalNote() {
    const role = getEffectiveUserRole();
    const currentUser = getStudentServiceCurrentUser();
    if (!currentUser || ![USER_ROLES.ADMIN, USER_ROLES.STUDENT_SERVICE].includes(role)) return;
    const ui = ensureStudentServiceUiState();
    const ticket = ensureStudentServiceStores().tickets.find(item => item.id === ui.selectedTicketId);
    const textarea = document.getElementById('student-service-internal-note');
    const message = String(textarea?.value || '').trim();
    if (!ticket || !message) {
        alert('Write an internal note before saving it.');
        return;
    }
    ticket.internalNotes.push(normalizeStudentServiceInternalNote({
        authorId: currentUser.id,
        authorName: currentUser.nameEn || currentUser.name || currentUser.id,
        authorRole: currentUser.role,
        message,
        createdAt: ssNowIso()
    }));
    ticket.updatedAt = ssNowIso();
    saveState();
    if (typeof recordPortalAudit === 'function') {
        recordPortalAudit('student-service', 'internal-note-added', 'ticket', ticket.id, {
            afterState: {
                authorId: currentUser.id,
                noteLength: message.length
            }
        });
    }
    renderStudentServicePage();
}

function updateStudentServiceHandoff() {
    const role = getEffectiveUserRole();
    const currentUser = getStudentServiceCurrentUser();
    if (!currentUser || ![USER_ROLES.ADMIN, USER_ROLES.STUDENT_SERVICE].includes(role)) return;
    const ui = ensureStudentServiceUiState();
    const ticket = ensureStudentServiceStores().tickets.find(item => item.id === ui.selectedTicketId);
    if (!ticket) return;
    const target = document.getElementById('student-service-handoff-target')?.value || '';
    const status = document.getElementById('student-service-handoff-status')?.value || 'Not Needed';
    const summary = String(document.getElementById('student-service-handoff-summary')?.value || '').trim();
    const now = ssNowIso();
    ticket.handoff = normalizeStudentServiceHandoff({
        ...ticket.handoff,
        target,
        status,
        summary,
        requestedAt: ticket.handoff?.requestedAt || (target && status !== 'Not Needed' ? now : ''),
        updatedAt: target ? now : '',
        requestedById: target ? currentUser.id : '',
        requestedByName: target ? (currentUser.nameEn || currentUser.name || currentUser.id) : ''
    });
    if (summary) {
        ticket.latestPreview = summary;
    }
    ticket.updatedAt = now;
    saveState();
    if (typeof recordPortalAudit === 'function') {
        recordPortalAudit('student-service', 'handoff-updated', 'ticket', ticket.id, {
            afterState: {
                target,
                status,
                summary
            }
        });
    }
    renderStudentServicePage();
}

function renderStudentServiceCollapsibleSection(sectionKey, title, content) {
    const ui = ensureStudentServiceUiState();
    const isOpen = Boolean(ui.detailSections?.[sectionKey]);
    return `
        <div class="content-box surface-card" style="padding:0;">
            <button type="button" data-student-service-detail-section="${ssEscape(sectionKey)}" style="width:100%; display:flex; align-items:center; justify-content:space-between; gap:12px; padding:16px 18px; border:none; background:transparent; cursor:pointer; text-align:left;">
                <span style="font-size:13px; font-weight:800; color:var(--lux-text);">${ssEscape(title)}</span>
                <span style="font-size:18px; color:var(--lux-text-muted);">${isOpen ? '&minus;' : '+'}</span>
            </button>
            ${isOpen ? `<div style="padding:0 18px 18px;">${content}</div>` : ''}
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
    ui.articleEditorId = nextArticleId;
    ui.selectedArticleId = nextArticleId;
    renderStudentServicePage();
}

async function saveStudentServiceArticle(publish) {
    const role = getEffectiveUserRole();
    const currentUser = getStudentServiceCurrentUser();
    if (!currentUser || ![USER_ROLES.ADMIN, USER_ROLES.STUDENT_SERVICE].includes(role)) return;
    const title = document.getElementById('student-service-article-title')?.value.trim() || '';
    const category = document.getElementById('student-service-article-category')?.value || 'General Question';
    const summary = document.getElementById('student-service-article-summary')?.value.trim() || '';
    const content = document.getElementById('student-service-article-content')?.value.trim() || '';
    const audience = document.getElementById('student-service-article-audience')?.value || 'students';
    if (!title || !summary || !content) {
        alert('Please complete article title, summary, and content.');
        return;
    }
    const ui = ensureStudentServiceUiState();
    const articleId = ui.articleEditorId || `svc-article-${Date.now()}`;
    try {
        const payload = await postStudentService('/api/student-service/articles', {
            id: articleId,
            title,
            category,
            serviceArea: getStudentServiceSupportAreaForCategory(category).id,
            summary,
            content,
            audience,
            published: Boolean(publish)
        });
        const article = payload?.article || null;
        ui.serviceLane = 'service';
        ui.staffPanel = 'articles';
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
    ui.articleEditorId = '';
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
    const myQuestions = currentUser?.id
        ? visibleQuestions.filter(question => String(question.authorId || '') === String(currentUser.id || '')).length
        : 0;
    const openTickets = totalTickets.filter(ticket => !['Resolved', 'Closed'].includes(ticket.status));
    const pendingQuestions = visibleQuestions.filter(question => question.status === 'pending_review').length;
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
        openTickets,
        pendingQuestions,
        publishedQuestions,
        unansweredQuestions,
        waitingForService,
        waitingForStudent,
        servicePrimaryCount: role === USER_ROLES.STUDENT ? myTickets : openTickets.length,
        qaPrimaryCount: role === USER_ROLES.STUDENT ? myQuestions : pendingQuestions
    };
}

function renderStudentServiceLaneSwitcher(selectedLane) {
    if (!selectedLane) return '';
    return `
        <section class="student-service-lane-switcher-shell">
            <div class="student-service-lane-switcher-copy">
                <div class="student-service-kicker">Workspace lanes</div>
                <div class="student-service-zone-copy">Switch between public Q&A and private Student Service without leaving the page.</div>
            </div>
            <div class="student-service-lane-switcher">
                <button type="button" class="${selectedLane === 'service' ? 'is-active lux-primary-btn' : 'lux-secondary-btn'}" data-student-service-lane="service"><i class="fas fa-headset"></i> Student Service</button>
                <button type="button" class="${selectedLane === 'qa' ? 'is-active lux-primary-btn' : 'lux-secondary-btn'}" data-student-service-lane="qa"><i class="fas fa-comments"></i> Q&A</button>
                <button type="button" class="student-service-mini-action" data-student-service-clear-lane="true"><i class="fas fa-border-all"></i> Choose again</button>
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
        ? 'Browse published answers, ask reusable questions, and stay anonymous to peers if needed.'
        : [USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(role)
            ? 'Answer faculty-scoped academic questions and help build reusable public answers.'
            : 'Moderate public questions, publish answers, and reduce repeat private tickets.'
    ;

    return `
        <div class="student-service-lane-chooser">
            <section class="student-service-zone student-service-zone-chooser">
                <div class="student-service-zone-head">
                    <div>
                        <div class="student-service-kicker">Choose a section</div>
                        <div class="student-service-zone-title">Open the lane that matches what you need right now.</div>
                        <div class="student-service-zone-copy">This page is now split into two focused sections so public Q&A and private Student Service work no longer compete in the same first screen.</div>
                    </div>
                </div>
                <div class="student-service-lane-choice-grid">
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
                            <span>${metrics.qaPrimaryCount} ${role === USER_ROLES.STUDENT ? 'my questions' : 'pending review'}</span>
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
                <div data-student-service-page-summary="1"></div>
                <div data-student-service-page-overview="1"></div>
                <section id="student-service-page-body" class="student-service-canvas">
                    <div style="text-align:center; padding:80px 20px; color:var(--lux-text-muted);">
                        <i class="fas fa-spinner fa-spin" style="font-size:32px; margin-bottom:16px; display:block;"></i>
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
        summary: shell?.querySelector('[data-student-service-page-summary="1"]') || null,
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
            ? 'Use this lane for reusable answers, cross-faculty browsing, and moderated public questions.'
            : 'Use this lane for direct Student Service contact, official rules, and private ticket tracking.';
    const asideStats = selectedLane === 'qa'
        ? [
            { label: 'Published', value: metrics.publishedQuestions },
            { label: 'Pending', value: metrics.pendingQuestions },
            { label: 'Unanswered', value: metrics.unansweredQuestions }
        ]
        : [
            { label: role === USER_ROLES.STUDENT ? 'Mine' : 'Open', value: metrics.servicePrimaryCount },
            { label: 'Waiting', value: metrics.waitingForService + metrics.waitingForStudent },
            { label: 'Articles', value: metrics.totalArticles.length }
        ];

    return `
        <section class="admin-hero student-service-hero">
            <div class="student-service-hero-main">
                <div class="page-hero-kicker"><i class="fas fa-headset"></i> Split support workspace</div>
                <div class="page-hero-title admin-hero-title">${ssEscape(titleByRole[role] || 'Student Service Center')}</div>
                <div class="page-hero-copy admin-hero-subtitle">${ssEscape(copyByRole[role] || 'Track service requests and publish guidance from one organized workspace.')}</div>
                <div class="page-hero-meta">
                    <span class="page-hero-badge admin-chip"><i class="fas fa-user-shield"></i> ${ssEscape(roleLabel)}</span>
                    <span class="page-hero-badge admin-chip"><i class="fas ${selectedLane === 'qa' ? 'fa-comments' : 'fa-inbox'}"></i> ${ssEscape(badgePrimary)}</span>
                    <span class="page-hero-badge admin-chip"><i class="fas fa-book-open"></i> ${ssEscape(badgeSecondary)}</span>
                </div>
                <div class="admin-hero-actions student-service-hero-actions">
                    ${heroActions.map(item => `
                        <button type="button" class="lux-primary-btn student-service-hero-action"
                            ${item.actionType === 'lane' ? `data-student-service-lane="${ssEscape(item.actionValue || '')}"` : ''}
                            ${item.actionType === 'question-filter' ? `data-student-service-question-filter-field="${ssEscape(item.actionField || '')}" data-student-service-question-filter-value="${ssEscape(item.actionValue || '')}"` : ''}
                            ${item.actionType === 'student-tab' ? `data-student-service-student-tab="${ssEscape(item.actionValue || '')}"` : ''}
                            ${item.actionType === 'focus-area' ? `data-student-service-focus-area="${ssEscape(item.actionValue || '')}"` : ''}
                            ${item.actionType === 'panel-switch' ? `data-student-service-panel-switch="${ssEscape(item.actionValue || '')}"` : ''}>
                            <i class="${ssEscape(item.icon)}"></i>
                            <span>${ssEscape(item.label)}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
            <div class="student-service-hero-aside">
                <div class="student-service-hero-aside-kicker">Workspace lens</div>
                <div class="student-service-hero-aside-title">${ssEscape(asideTitle)}</div>
                <div class="student-service-hero-aside-copy">${ssEscape(asideCopy)}</div>
                <div class="student-service-hero-aside-grid">
                    ${asideStats.map(stat => `
                        <div class="student-service-hero-aside-stat">
                            <span>${ssEscape(stat.label)}</span>
                            <strong>${ssEscape(String(stat.value))}</strong>
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>
    `;
}

function renderStudentServiceWorkflowMarkup(workflowSteps) {
    return workflowSteps.length ? `
        <section class="student-service-workflow-strip">
            ${workflowSteps.map((step, index) => `
                <article class="student-service-workflow-step">
                    <div class="student-service-workflow-step-index">${index + 1}</div>
                    <div class="student-service-workflow-step-icon"><i class="${ssEscape(step.icon)}"></i></div>
                    <div class="student-service-workflow-step-copy">
                        <strong>${ssEscape(step.title)}</strong>
                        <span>${ssEscape(step.copy)}</span>
                    </div>
                </article>
            `).join('')}
        </section>
    ` : '';
}

function renderStudentServiceSummaryMarkup(summaryCards) {
    return summaryCards.length ? `
        <section class="student-service-summary-grid">
            ${summaryCards.map(card => `
                <article class="student-service-summary-card">
                    <div class="student-service-summary-label">${ssEscape(card.label)}</div>
                    <div class="student-service-summary-value">${ssEscape(String(card.value))}</div>
                    <div class="student-service-summary-copy">${ssEscape(card.copy)}</div>
                </article>
            `).join('')}
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
        ? (role === USER_ROLES.STUDENT ? `${metrics.myQuestions} my questions` : `${metrics.pendingQuestions} pending review`)
        : `${selectedLane === 'service' ? metrics.servicePrimaryCount : metrics.totalArticles.length} ${selectedLane === 'service' ? (role === USER_ROLES.STUDENT ? 'my tickets' : 'open tickets') : 'articles'}`;
    const badgeSecondary = selectedLane === 'qa'
        ? `${metrics.publishedQuestions} published`
        : `${metrics.totalArticles.length} articles`;
    const heroActions = !selectedLane
        ? [
            { icon: 'fas fa-headset', label: 'Open Student Service', actionType: 'lane', actionValue: 'service' },
            { icon: 'fas fa-comments', label: 'Open Q&A', actionType: 'lane', actionValue: 'qa' }
        ]
        : selectedLane === 'qa'
            ? (role === USER_ROLES.STUDENT
                ? [
                    { icon: 'fas fa-search', label: 'Browse Q&A', actionType: 'question-filter', actionField: 'qaStatus', actionValue: 'published' },
                    { icon: 'fas fa-pen', label: 'Ask question', actionType: 'lane', actionValue: 'qa' },
                    { icon: 'fas fa-lock', label: 'Need private help', actionType: 'lane', actionValue: 'service' }
                ]
                : [
                    { icon: 'fas fa-comments', label: responderOnly ? 'Answer questions' : 'Review Q&A', actionType: 'lane', actionValue: 'qa' },
                    { icon: 'fas fa-filter', label: 'Reset filters', actionType: 'question-filter', actionField: 'qaStatus', actionValue: responderOnly ? 'pending_review' : 'all' },
                    { icon: 'fas fa-headset', label: 'Student Service', actionType: 'lane', actionValue: 'service' }
                ])
            : (role === USER_ROLES.STUDENT
                ? [
                    { icon: 'fas fa-headset', label: 'Contact Student Service', actionType: 'student-tab', actionValue: 'get_help' },
                    { icon: 'fas fa-comments', label: 'My tickets', actionType: 'student-tab', actionValue: 'my_tickets' },
                    { icon: 'fas fa-book-open', label: 'Rules & guidance', actionType: 'focus-area', actionValue: 'general' }
                ]
                : responderOnly
                    ? [
                        { icon: 'fas fa-book-open', label: 'Guidance', actionType: 'lane', actionValue: 'service' },
                        { icon: 'fas fa-comments', label: 'Open Q&A', actionType: 'lane', actionValue: 'qa' }
                    ]
                    : [
                        { icon: 'fas fa-inbox', label: 'Open inbox', actionType: 'panel-switch', actionValue: 'tickets' },
                        { icon: 'fas fa-book-open', label: 'Knowledge base', actionType: 'panel-switch', actionValue: 'articles' },
                        { icon: 'fas fa-comments', label: 'Q&A lane', actionType: 'lane', actionValue: 'qa' }
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
                { icon: 'fas fa-pen-nib', title: 'Ask clearly', copy: 'Write one reusable question and choose public or private handling.' },
                { icon: 'fas fa-circle-check', title: 'Track the answer', copy: 'Follow moderation, replies, and accepted answers from one public lane.' }
            ]
            : [
                { icon: 'fas fa-paper-plane', title: 'Send one request', copy: 'Open a private Student Service thread with the right topic and context.' },
                { icon: 'fas fa-comments', title: 'Continue the thread', copy: 'Return to the ticket lane to follow replies and status updates.' }
            ];
    const summaryCards = selectedLane === 'qa'
        ? [
            { label: role === USER_ROLES.STUDENT ? 'My questions' : 'Pending review', value: role === USER_ROLES.STUDENT ? metrics.myQuestions : metrics.pendingQuestions, copy: role === USER_ROLES.STUDENT ? 'Questions you asked in the public lane.' : 'Questions still waiting for publication review.' },
            { label: 'Published answers', value: metrics.publishedQuestions, copy: 'Visible public answers already reusable across the campus.' },
            { label: 'Unanswered', value: metrics.unansweredQuestions, copy: 'Questions that still need a first useful reply.' }
        ]
        : [
            { label: role === USER_ROLES.STUDENT ? 'My tickets' : 'Open queue', value: metrics.servicePrimaryCount, copy: role === USER_ROLES.STUDENT ? 'Private Student Service threads linked to your account.' : 'Private tickets currently needing action.' },
            { label: 'Waiting', value: metrics.waitingForService + metrics.waitingForStudent, copy: 'Cases paused for the desk or the student.' },
            { label: 'Guidance articles', value: metrics.totalArticles.length, copy: 'Official rules and reusable guidance available in this lane.' }
        ];

    const shell = ensureStudentServicePageShell(container);
    if (!shell) return;

    setStudentServiceMarkup(
        shell.hero,
        'student-service-page:hero',
        renderStudentServiceHeroMarkup(role, roleLabel, titleByRole, copyByRole, selectedLane, badgePrimary, badgeSecondary, heroActions, metrics)
    );
    setStudentServiceMarkup(shell.switcher, 'student-service-page:switcher', renderStudentServiceLaneSwitcher(selectedLane));
    setStudentServiceMarkup(shell.workflow, 'student-service-page:workflow', selectedLane ? renderStudentServiceWorkflowMarkup(workflowSteps) : '');
    setStudentServiceMarkup(shell.summary, 'student-service-page:summary', selectedLane ? renderStudentServiceSummaryMarkup(summaryCards) : '');
    setStudentServiceMarkup(
        shell.overview,
        'student-service-page:overview',
        renderStudentServiceOverviewMarkup(role === USER_ROLES.STUDENT_SERVICE && selectedLane === 'service')
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

function buildStudentServiceRenderSignature(role, currentUser, visibleArticles, visibleTickets) {
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
        ui.selectedQuestionId || '',
        ui.qaSearch || '',
        ui.qaFaculty || '',
        ui.qaCategory || '',
        ui.qaStatus || '',
        ui.studentDetailsExpanded ? '1' : '0',
        ui.staffFiltersExpanded ? '1' : '0',
        ui.activeSupportArea || '',
        visibleArticles.length,
        visibleTickets.length,
        STUDENT_SERVICE_RUNTIME.loaded ? 'loaded' : 'loading',
        STUDENT_SERVICE_RUNTIME.loadFailed ? 'failed' : 'ok'
    ].join('|');
}

function renderStudentServicePage() {
    const container = document.getElementById('page-student-service');
    if (!container) return;
    ensureStudentServiceStores();
    if (shouldBootstrapStudentServiceWorkspace() && !STUDENT_SERVICE_RUNTIME.loaded && !STUDENT_SERVICE_RUNTIME.bootstrapPromise && typeof kiuPortalFetch === 'function') {
        scheduleStudentServiceBootstrap();
    }
    const role = getEffectiveUserRole();
    writeStudentServiceStoredLane(getStudentServiceLane());
    const visibleArticles = getStudentServiceVisibleArticles();
    const visibleTickets = getStudentServiceVisibleTickets();
    const currentUser = getStudentServiceCurrentUser();
    const renderSignature = buildStudentServiceRenderSignature(role, currentUser, visibleArticles, visibleTickets);
    if (container.dataset.studentServiceRenderSignature === renderSignature) {
        return;
    }
    renderStudentServicePageChromeRebuilt(role, currentUser, visibleArticles, visibleTickets);
    renderStudentServiceHomeWorkspace();
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
        return;
    }
    if (role === USER_ROLES.STUDENT) {
        renderStudentServiceStudentView(bodyContainer || container, visibleArticles, visibleTickets);
        container.dataset.studentServiceRenderSignature = renderSignature;
        return;
    }
    if ([USER_ROLES.ADMIN, USER_ROLES.STUDENT_SERVICE, USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(role)) {
        renderStudentServiceStaffViewRebuilt(bodyContainer || container, visibleArticles, visibleTickets);
        container.dataset.studentServiceRenderSignature = renderSignature;
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

function bindStudentServiceDelegatedInteractions() {
    const root = document.getElementById('page-student-service');
    if (!root || root.dataset.studentServiceInteractionsBound === '1') return;
    root.dataset.studentServiceInteractionsBound = '1';

    const syncDraftQuestionField = (node) => {
        if (!node) return;
        const field = node.dataset.studentServiceDraftQuestionField || '';
        if (!field) return;
        const value = node.type === 'checkbox' ? node.checked : node.value;
        setStudentServiceDraftQuestionField(field, value);
    };

    root.addEventListener('click', (event) => {
        const laneButton = event.target.closest('[data-student-service-lane]');
        if (laneButton) {
            event.preventDefault();
            setStudentServiceLane(laneButton.dataset.studentServiceLane || '');
            return;
        }

        const clearLaneButton = event.target.closest('[data-student-service-clear-lane]');
        if (clearLaneButton) {
            event.preventDefault();
            clearStudentServiceLaneChoice();
            return;
        }

        const panelSwitchButton = event.target.closest('[data-student-service-panel-switch]');
        if (panelSwitchButton) {
            event.preventDefault();
            switchStudentServicePanel(panelSwitchButton.dataset.studentServicePanelSwitch || 'tickets');
            return;
        }

        const navigateButton = event.target.closest('[data-student-service-navigate]');
        if (navigateButton) {
            event.preventDefault();
            if (typeof navigate === 'function') {
                navigate(navigateButton.dataset.studentServiceNavigate || 'student-service');
            }
            return;
        }

        const panelButton = event.target.closest('[data-student-service-open-panel]');
        if (panelButton) {
            event.preventDefault();
            openStudentServicePanel(panelButton.dataset.studentServiceOpenPanel || 'tickets');
            return;
        }

        const studentTabButton = event.target.closest('[data-student-service-student-tab]');
        if (studentTabButton) {
            event.preventDefault();
            switchStudentServiceStudentTab(studentTabButton.dataset.studentServiceStudentTab || 'get_help');
            return;
        }

        const openTicketButton = event.target.closest('[data-student-service-open-ticket]');
        if (openTicketButton) {
            event.preventDefault();
            openStudentServiceTicket(openTicketButton.dataset.studentServiceOpenTicket || '');
            const panel = openTicketButton.dataset.studentServiceOpenTicketPanel || '';
            if (panel) openStudentServicePanel(panel);
            return;
        }

        const focusAreaButton = event.target.closest('[data-student-service-focus-area]');
        if (focusAreaButton) {
            event.preventDefault();
            focusStudentServiceSupportArea(focusAreaButton.dataset.studentServiceFocusArea || '');
            return;
        }

        const articleSearchClearButton = event.target.closest('[data-student-service-article-search-clear]');
        if (articleSearchClearButton) {
            event.preventDefault();
            setStudentServiceArticleSearch('');
            return;
        }

        const ticketFilterButton = event.target.closest('[data-student-service-ticket-filter-field][data-student-service-ticket-filter-value]');
        if (ticketFilterButton) {
            event.preventDefault();
            setStudentServiceTicketFilter(
                ticketFilterButton.dataset.studentServiceTicketFilterField || '',
                ticketFilterButton.dataset.studentServiceTicketFilterValue || ''
            );
            return;
        }

        const composerToggle = event.target.closest('[data-student-service-question-composer-toggle]');
        if (composerToggle) {
            event.preventDefault();
            const mode = composerToggle.dataset.studentServiceQuestionComposerToggle || 'toggle';
            const ui = ensureStudentServiceUiState();
            const expanded = mode === 'toggle' ? !ui.qaComposerExpanded : mode === 'open';
            setStudentServiceQuestionComposerExpanded(expanded);
            return;
        }

        const askModeButton = event.target.closest('[data-student-service-draft-question-mode]');
        if (askModeButton) {
            event.preventDefault();
            setStudentServiceDraftQuestionField('askMode', askModeButton.dataset.studentServiceDraftQuestionMode || 'public');
            renderStudentServicePage();
            return;
        }

        const questionFilterButton = event.target.closest('[data-student-service-question-filter-field][data-student-service-question-filter-value]');
        if (questionFilterButton) {
            event.preventDefault();
            setStudentServiceQuestionFilter(
                questionFilterButton.dataset.studentServiceQuestionFilterField || '',
                questionFilterButton.dataset.studentServiceQuestionFilterValue || ''
            );
            return;
        }

        const openQuestionButton = event.target.closest('[data-student-service-open-question]');
        if (openQuestionButton) {
            event.preventDefault();
            openStudentServiceQuestion(openQuestionButton.dataset.studentServiceOpenQuestion || '');
            return;
        }

        const questionFeedbackButton = event.target.closest('[data-student-service-question-feedback]');
        if (questionFeedbackButton) {
            event.preventDefault();
            setStudentServiceQuestionFeedback(
                questionFeedbackButton.dataset.studentServiceQuestionId || '',
                questionFeedbackButton.dataset.studentServiceQuestionFeedback || ''
            );
            return;
        }

        const questionFlagButton = event.target.closest('[data-student-service-question-flag-field]');
        if (questionFlagButton) {
            event.preventDefault();
            toggleStudentServiceQuestionFlag(
                questionFlagButton.dataset.studentServiceQuestionId || '',
                questionFlagButton.dataset.studentServiceQuestionFlagField || '',
                questionFlagButton.dataset.studentServiceQuestionFlagValue === 'true'
            );
            return;
        }

        const publishQuestionButton = event.target.closest('[data-student-service-question-publish]');
        if (publishQuestionButton) {
            event.preventDefault();
            publishStudentServiceQuestion(publishQuestionButton.dataset.studentServiceQuestionId || '');
            return;
        }

        const convertQuestionButton = event.target.closest('[data-student-service-question-convert]');
        if (convertQuestionButton) {
            event.preventDefault();
            const questionId = convertQuestionButton.dataset.studentServiceQuestionId || '';
            const destination = convertQuestionButton.dataset.studentServiceQuestionConvert || '';
            if (destination === 'ticket') convertStudentServiceQuestionToTicket(questionId);
            if (destination === 'article') convertStudentServiceQuestionToArticle(questionId);
            return;
        }

        const mergeQuestionButton = event.target.closest('[data-student-service-question-merge]');
        if (mergeQuestionButton) {
            event.preventDefault();
            mergeStudentServiceQuestionPrompt(mergeQuestionButton.dataset.studentServiceQuestionId || '');
            return;
        }

        const acceptAnswerButton = event.target.closest('[data-student-service-answer-accept]');
        if (acceptAnswerButton) {
            event.preventDefault();
            acceptStudentServiceAnswer(
                acceptAnswerButton.dataset.studentServiceQuestionId || '',
                acceptAnswerButton.dataset.studentServiceAnswerId || ''
            );
            return;
        }

        const submitQuestionButton = event.target.closest('[data-student-service-submit-question]');
        if (submitQuestionButton) {
            event.preventDefault();
            submitStudentServiceQuestion();
            return;
        }

        const submitAnswerButton = event.target.closest('[data-student-service-submit-answer]');
        if (submitAnswerButton) {
            event.preventDefault();
            submitStudentServiceQuestionAnswer(submitAnswerButton.dataset.studentServiceSubmitAnswer || '');
            return;
        }

        const submitTicketButton = event.target.closest('[data-student-service-submit-ticket]');
        if (submitTicketButton) {
            event.preventDefault();
            submitStudentServiceTicket();
            return;
        }

        const toggleStudentDetailsButton = event.target.closest('[data-student-service-toggle-student-details]');
        if (toggleStudentDetailsButton) {
            event.preventDefault();
            toggleStudentServiceStudentDetails();
            return;
        }

        const toggleAdvancedFiltersButton = event.target.closest('[data-student-service-toggle-advanced-filters]');
        if (toggleAdvancedFiltersButton) {
            event.preventDefault();
            toggleStudentServiceAdvancedFilters();
            return;
        }

        const openArticleButton = event.target.closest('[data-student-service-open-article]');
        if (openArticleButton) {
            event.preventDefault();
            openStudentServiceArticle(openArticleButton.dataset.studentServiceOpenArticle || '');
            return;
        }

        const editArticleButton = event.target.closest('[data-student-service-edit-article]');
        if (editArticleButton) {
            event.preventDefault();
            editStudentServiceArticle(editArticleButton.dataset.studentServiceEditArticle || '');
            return;
        }

        const startNewArticleButton = event.target.closest('[data-student-service-start-new-article]');
        if (startNewArticleButton) {
            event.preventDefault();
            startStudentServiceNewArticle();
            return;
        }

        const assignTicketButton = event.target.closest('[data-student-service-assign-ticket]');
        if (assignTicketButton) {
            event.preventDefault();
            assignStudentServiceTicketToCurrentUser();
            return;
        }

        const replyTicketButton = event.target.closest('[data-student-service-reply-ticket]');
        if (replyTicketButton) {
            event.preventDefault();
            replyStudentServiceTicket();
            return;
        }

        const saveArticleButton = event.target.closest('[data-student-service-save-article]');
        if (saveArticleButton) {
            event.preventDefault();
            saveStudentServiceArticle(saveArticleButton.dataset.studentServiceSaveArticle === 'publish');
            return;
        }

        const detailSectionButton = event.target.closest('[data-student-service-detail-section]');
        if (detailSectionButton) {
            event.preventDefault();
            toggleStudentServiceDetailSection(detailSectionButton.dataset.studentServiceDetailSection || '');
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
                event.target.value
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
}

function bootstrapStudentServicePage() {
    if (!document.getElementById('page-student-service')) return;
    if (typeof getEffectiveUserRole !== 'function' || typeof USER_ROLES === 'undefined') {
        window.setTimeout(bootstrapStudentServicePage, 30);
        return;
    }
    try {
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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapStudentServicePage);
} else {
    bootstrapStudentServicePage();
}


