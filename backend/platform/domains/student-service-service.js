const {
    asArray,
    clone,
    makeId,
    normalizeCode,
    nowIso,
    safeNumber,
    uniqueStrings
} = require('../utils');

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
const STUDENT_SERVICE_SENSITIVE_CATEGORIES = new Set([
    'Finance / Payments',
    'Documents / Certificates'
]);
const STUDENT_SERVICE_RESPONDER_CATEGORIES = new Set([
    'Academic Process',
    'Registration / Enrollment',
    'Schedule / Timetable'
]);
const STUDENT_SERVICE_SUPPORT_AREA_BY_CATEGORY = {
    'Academic Process': 'academics',
    'Registration / Enrollment': 'registration',
    'Finance / Payments': 'finance',
    'Documents / Certificates': 'documents',
    'Schedule / Timetable': 'timetable',
    'Technical Portal Help': 'portal',
    'Other': 'general',
    'General Question': 'general'
};
const STUDENT_SERVICE_DEFAULT_ARTICLES = [
    {
        id: 'svc-article-001',
        title: 'How to ask for help from Student Service',
        category: 'General Question',
        serviceArea: 'general',
        summary: 'Use Student Service for general office support, guidance, and portal questions.',
        content: 'Student Service is the main help desk for office support, rules guidance, and non-academic process questions. Use a ticket when you need a response or follow-up.',
        published: true,
        featured: true,
        audience: 'all',
        facultyCode: 'ALL',
        relatedLinks: [],
        createdBy: 'System',
        updatedBy: 'System',
        updatedAt: '2026-04-01T09:00:00.000Z'
    },
    {
        id: 'svc-article-002',
        title: 'When to use Chancellery vs Student Service',
        category: 'Academic Process',
        serviceArea: 'academics',
        summary: 'Student Service handles general help. Chancellery handles exam appeals and retake requests.',
        content: 'Use Student Service for general office support, documents guidance, finance questions, and portal help. Use Chancellery only for grade appeals and retake request workflows after exams.',
        published: true,
        featured: true,
        audience: 'all',
        facultyCode: 'ALL',
        relatedLinks: [],
        createdBy: 'System',
        updatedBy: 'System',
        updatedAt: '2026-04-01T09:15:00.000Z'
    },
    {
        id: 'svc-article-003',
        title: 'Registration and enrollment help',
        category: 'Registration / Enrollment',
        serviceArea: 'registration',
        summary: 'What to prepare before asking about course registration and enrollment issues.',
        content: 'When opening a registration ticket, include your student ID, semester, course name, and the exact problem you saw in the portal. This helps Student Service review your case faster.',
        published: true,
        featured: true,
        audience: 'students',
        facultyCode: 'ALL',
        relatedLinks: [],
        createdBy: 'System',
        updatedBy: 'System',
        updatedAt: '2026-04-01T09:30:00.000Z'
    },
    {
        id: 'svc-article-004',
        title: 'Technical portal support checklist',
        category: 'Technical Portal Help',
        serviceArea: 'portal',
        summary: 'What to send when a portal page is broken or not loading correctly.',
        content: 'Include the page name, your role, your faculty, what button you clicked, and a screenshot when the page freezes or shows the wrong version. This lets Student Service reproduce the issue quickly.',
        published: true,
        featured: false,
        audience: 'all',
        facultyCode: 'ALL',
        relatedLinks: [],
        createdBy: 'System',
        updatedBy: 'System',
        updatedAt: '2026-04-01T09:45:00.000Z'
    },
    {
        id: 'svc-article-005',
        title: 'Finance and payment support',
        category: 'Finance / Payments',
        serviceArea: 'finance',
        summary: 'How to request help about balances, payment confirmation, and finance follow-up.',
        content: 'When you contact Student Service about finance, include your student ID, the amount or invoice you are referring to, and the date of the payment or charge. Student Service can guide the next step and document the issue, but cannot edit finance records from this workspace.',
        published: true,
        featured: false,
        audience: 'all',
        facultyCode: 'ALL',
        relatedLinks: [],
        createdBy: 'System',
        updatedBy: 'System',
        updatedAt: '2026-04-01T10:00:00.000Z'
    },
    {
        id: 'svc-article-006',
        title: 'Documents and certificate requests',
        category: 'Documents / Certificates',
        serviceArea: 'documents',
        summary: 'What to include when you need a transcript, certificate, or official document.',
        content: 'For document requests, include the document name, language needs, deadline, and where it will be used. Student Service can confirm what is needed and keep the request moving, while official document generation stays in the proper office workflow.',
        published: true,
        featured: false,
        audience: 'all',
        facultyCode: 'ALL',
        relatedLinks: [],
        createdBy: 'System',
        updatedBy: 'System',
        updatedAt: '2026-04-01T10:15:00.000Z'
    }
];
const STUDENT_SERVICE_DEFAULT_MACROS = [
    {
        id: 'svc-macro-001',
        label: 'Ask for more details',
        category: 'General Question',
        serviceArea: 'general',
        message: 'Thank you for contacting Student Service. Please send your student ID, the exact page or process you were using, and a screenshot or short description of what happened so we can review this quickly.'
    },
    {
        id: 'svc-macro-002',
        label: 'Registration guidance',
        category: 'Registration / Enrollment',
        serviceArea: 'registration',
        message: 'Thanks for the details. Please confirm your semester, course name, and group if applicable. Student Service can guide the process here, but enrollment records are updated in the academic workflow rather than directly from this workspace.'
    },
    {
        id: 'svc-macro-003',
        label: 'Finance guidance',
        category: 'Finance / Payments',
        serviceArea: 'finance',
        message: 'Please share your student ID, the payment or balance amount, and the payment date if available. Student Service can document the issue and guide the next step, but finance records are not edited from this workspace.'
    },
    {
        id: 'svc-macro-004',
        label: 'Document request follow-up',
        category: 'Documents / Certificates',
        serviceArea: 'documents',
        message: 'Please confirm which document you need, the language, and the deadline. Student Service can help you prepare the request and keep you updated, while official document generation stays in the formal office workflow.'
    },
    {
        id: 'svc-macro-005',
        label: 'Portal troubleshooting',
        category: 'Technical Portal Help',
        serviceArea: 'portal',
        message: 'Please send the page name, your current role, your faculty, the exact button or action you clicked, and a screenshot if possible. This will help us reproduce the issue and respond faster.'
    }
];

function normalizeStudentServiceCategory(value = '') {
    const normalized = String(value || '').trim();
    return STUDENT_SERVICE_CATEGORIES.includes(normalized) ? normalized : 'General Question';
}

function getStudentServiceAreaForCategory(category = '') {
    const normalized = normalizeStudentServiceCategory(category);
    return STUDENT_SERVICE_SUPPORT_AREA_BY_CATEGORY[normalized] || 'general';
}

function normalizeStudentServiceThreadEntry(entry = {}, fallback = {}) {
    return {
        id: String(entry.id || fallback.id || makeId('svc_msg')).trim(),
        authorId: String(entry.authorId || fallback.authorId || '').trim(),
        authorName: String(entry.authorName || fallback.authorName || 'Portal User').trim(),
        authorRole: String(entry.authorRole || fallback.authorRole || 'system').trim().toLowerCase(),
        message: String(entry.message || fallback.message || '').trim(),
        createdAt: String(entry.createdAt || fallback.createdAt || nowIso()).trim()
    };
}

function normalizeStudentServiceInternalNote(note = {}, index = 0) {
    return {
        id: String(note.id || `svc_note_${index + 1}`).trim(),
        authorId: String(note.authorId || '').trim(),
        authorName: String(note.authorName || 'Staff').trim(),
        authorRole: String(note.authorRole || 'student_service').trim().toLowerCase(),
        message: String(note.message || '').trim(),
        createdAt: String(note.createdAt || nowIso()).trim()
    };
}

function normalizeStudentServiceTicketRecord(ticket = {}, index = 0) {
    const createdAt = String(ticket.createdAt || ticket.date || nowIso()).trim();
    const updatedAt = String(ticket.updatedAt || createdAt).trim();
    const category = normalizeStudentServiceCategory(ticket.category);
    const serviceArea = String(ticket.serviceArea || getStudentServiceAreaForCategory(category)).trim() || 'general';
    const threadSource = Array.isArray(ticket.thread) ? ticket.thread : Array.isArray(ticket.messages) ? ticket.messages : [];
    const baseMessage = String(ticket.message || ticket.description || '').trim();
    const thread = threadSource.length
        ? threadSource.map((entry, entryIndex) => normalizeStudentServiceThreadEntry(entry, {
            id: `svc-thread-${index + 1}-${entryIndex + 1}`,
            authorId: String(ticket.studentId || ticket.requesterUserId || '').trim(),
            authorName: ticket.studentName || ticket.requesterDisplayName || 'Student',
            authorRole: 'student',
            createdAt
        })).filter(entry => entry.message)
        : [normalizeStudentServiceThreadEntry({
            id: `svc-thread-${index + 1}-1`,
            authorId: String(ticket.studentId || ticket.requesterUserId || '').trim(),
            authorName: ticket.studentName || ticket.requesterDisplayName || 'Student',
            authorRole: 'student',
            message: baseMessage,
            createdAt
        })];
    const latestEntry = thread[thread.length - 1] || null;
    return {
        id: String(ticket.id || `SVC-${String(index + 1).padStart(4, '0')}`).trim(),
        studentId: String(ticket.studentId || ticket.requesterUserId || '').trim(),
        studentName: String(ticket.studentName || ticket.requesterDisplayName || 'Student').trim(),
        semester: safeNumber(ticket.semester, 0) || '',
        category,
        serviceArea,
        title: String(ticket.title || ticket.subject || 'Support Request').trim(),
        message: baseMessage || String(latestEntry?.message || '').trim(),
        status: ['Open', 'In Review', 'Waiting for Student', 'Waiting for Service', 'Resolved', 'Closed'].includes(ticket.status)
            ? ticket.status
            : 'Open',
        createdAt,
        updatedAt,
        facultyCode: normalizeCode(ticket.facultyCode || ticket.faculty || ''),
        assignedToRole: String(ticket.assignedToRole || '').trim().toLowerCase(),
        assignedToId: String(ticket.assignedToId || '').trim(),
        assignedToName: String(ticket.assignedToName || '').trim(),
        relatedSubjectId: String(ticket.relatedSubjectId || '').trim(),
        relatedSubjectName: String(ticket.relatedSubjectName || '').trim(),
        relatedContextLabel: String(ticket.relatedContextLabel || '').trim(),
        intakeContext: clone(ticket.intakeContext || {}) || {},
        internalNotes: asArray(ticket.internalNotes).map((note, noteIndex) => normalizeStudentServiceInternalNote(note, noteIndex)).filter(note => note.message),
        handoff: {
            target: String(ticket.handoff?.target || '').trim(),
            status: String(ticket.handoff?.status || '').trim() || 'Not Needed',
            summary: String(ticket.handoff?.summary || '').trim(),
            requestedAt: String(ticket.handoff?.requestedAt || '').trim(),
            updatedAt: String(ticket.handoff?.updatedAt || '').trim(),
            requestedById: String(ticket.handoff?.requestedById || '').trim(),
            requestedByName: String(ticket.handoff?.requestedByName || '').trim()
        },
        thread,
        latestPreview: String(ticket.latestPreview || latestEntry?.message || baseMessage).trim(),
        anonymousMode: Boolean(ticket.anonymousMode),
        displayIdentityToPeers: ticket.displayIdentityToPeers === true,
        questionId: String(ticket.questionId || '').trim(),
        convertedFromQuestionId: String(ticket.convertedFromQuestionId || '').trim()
    };
}

function normalizeStudentServiceArticleRecord(article = {}, index = 0) {
    const category = normalizeStudentServiceCategory(article.category);
    return {
        id: String(article.id || `svc_article_${index + 1}`).trim(),
        title: String(article.title || 'Untitled article').trim(),
        category,
        serviceArea: String(article.serviceArea || getStudentServiceAreaForCategory(category)).trim() || 'general',
        summary: String(article.summary || '').trim(),
        content: String(article.content || article.message || '').trim(),
        published: article.published !== false,
        featured: Boolean(article.featured),
        pinned: Boolean(article.pinned),
        audience: ['all', 'students', 'staff'].includes(String(article.audience || '').trim()) ? String(article.audience).trim() : 'students',
        facultyCode: normalizeCode(article.facultyCode || article.faculty || 'ALL') || 'ALL',
        relatedLinks: uniqueStrings(asArray(article.relatedLinks).map(item => String(item || '').trim()).filter(Boolean)),
        createdBy: String(article.createdBy || article.updatedBy || 'System').trim(),
        updatedBy: String(article.updatedBy || article.createdBy || 'System').trim(),
        updatedAt: String(article.updatedAt || article.createdAt || nowIso()).trim(),
        sourceQuestionId: String(article.sourceQuestionId || '').trim(),
        lastReviewedAt: String(article.lastReviewedAt || '').trim(),
        lastReviewedBy: String(article.lastReviewedBy || '').trim()
    };
}

function normalizeStudentServiceMacroRecord(macro = {}, index = 0) {
    const category = normalizeStudentServiceCategory(macro.category);
    return {
        id: String(macro.id || `svc_macro_${index + 1}`).trim(),
        label: String(macro.label || `Macro ${index + 1}`).trim(),
        category,
        serviceArea: String(macro.serviceArea || getStudentServiceAreaForCategory(category)).trim() || 'general',
        message: String(macro.message || '').trim()
    };
}

function normalizeStudentServiceQuestionRecord(question = {}, index = 0) {
    const createdAt = String(question.createdAt || nowIso()).trim();
    const category = normalizeStudentServiceCategory(question.category);
    const facultyCode = normalizeCode(question.facultyCode || question.faculty || '');
    return {
        id: String(question.id || `svc_question_${index + 1}`).trim(),
        title: String(question.title || 'Untitled question').trim(),
        body: String(question.body || question.message || '').trim(),
        category,
        serviceArea: String(question.serviceArea || getStudentServiceAreaForCategory(category)).trim() || 'general',
        facultyCode,
        authorUserId: String(question.authorUserId || question.studentId || '').trim(),
        authorDisplayName: String(question.authorDisplayName || question.studentName || 'Student').trim(),
        authorRole: String(question.authorRole || 'student').trim().toLowerCase(),
        status: ['pending', 'published', 'archived', 'converted', 'merged'].includes(String(question.status || '').trim().toLowerCase())
            ? String(question.status || '').trim().toLowerCase()
            : 'pending',
        anonymousMode: question.anonymousMode !== false,
        displayIdentityToPeers: question.displayIdentityToPeers === true,
        pinned: Boolean(question.pinned),
        featured: Boolean(question.featured),
        staleReviewRequested: Boolean(question.staleReviewRequested),
        staleReviewNote: String(question.staleReviewNote || '').trim(),
        lastReviewedAt: String(question.lastReviewedAt || '').trim(),
        lastReviewedBy: String(question.lastReviewedBy || '').trim(),
        acceptedAnswerId: String(question.acceptedAnswerId || '').trim(),
        helpfulVotes: asArray(question.helpfulVotes).map(entry => ({
            userId: String(entry?.userId || '').trim(),
            value: entry?.value === 'not_helpful' ? 'not_helpful' : 'helpful',
            updatedAt: String(entry?.updatedAt || createdAt).trim()
        })).filter(entry => entry.userId),
        createdAt,
        updatedAt: String(question.updatedAt || createdAt).trim(),
        convertedTicketId: String(question.convertedTicketId || '').trim(),
        convertedArticleId: String(question.convertedArticleId || '').trim(),
        mergedIntoQuestionId: String(question.mergedIntoQuestionId || '').trim(),
        assigneeUserIds: uniqueStrings(asArray(question.assigneeUserIds).map(value => String(value || '').trim()).filter(Boolean)),
        relatedQuestionIds: uniqueStrings(asArray(question.relatedQuestionIds).map(value => String(value || '').trim()).filter(Boolean))
    };
}

function normalizeStudentServiceAnswerRecord(answer = {}, index = 0) {
    return {
        id: String(answer.id || `svc_answer_${index + 1}`).trim(),
        questionId: String(answer.questionId || '').trim(),
        authorUserId: String(answer.authorUserId || '').trim(),
        authorDisplayName: String(answer.authorDisplayName || 'Staff').trim(),
        authorRole: String(answer.authorRole || 'student_service').trim().toLowerCase(),
        body: String(answer.body || answer.message || '').trim(),
        status: ['pending', 'published', 'archived'].includes(String(answer.status || '').trim().toLowerCase())
            ? String(answer.status || '').trim().toLowerCase()
            : 'pending',
        createdAt: String(answer.createdAt || nowIso()).trim(),
        updatedAt: String(answer.updatedAt || answer.createdAt || nowIso()).trim(),
        approvedBy: String(answer.approvedBy || '').trim(),
        approvedAt: String(answer.approvedAt || '').trim()
    };
}

function normalizeStudentServiceReviewQueueEntry(entry = {}, index = 0) {
    const entityType = String(entry.entityType || '').trim().toLowerCase();
    const entityId = String(entry.entityId || '').trim();
    if (!entityType || !entityId) return null;
    return {
        id: String(entry.id || `svc_review_${index + 1}`).trim(),
        entityType,
        entityId,
        reason: String(entry.reason || 'pending-review').trim(),
        status: ['open', 'resolved'].includes(String(entry.status || '').trim().toLowerCase())
            ? String(entry.status || '').trim().toLowerCase()
            : 'open',
        createdAt: String(entry.createdAt || nowIso()).trim(),
        updatedAt: String(entry.updatedAt || entry.createdAt || nowIso()).trim(),
        resolvedAt: String(entry.resolvedAt || '').trim(),
        resolvedBy: String(entry.resolvedBy || '').trim()
    };
}

function getStudentServiceBootstrap(viewerUserId = '') {
    const serviceState = this.ensureStudentServiceState();
    const viewer = this.getStudentServiceViewerState(viewerUserId);
    const questions = serviceState.questions
        .filter(question => this.canViewStudentServiceQuestion(question, viewer.viewerId))
        .map(question => this.decorateStudentServiceQuestion(question, viewer.viewerId))
        .sort((left, right) => {
            if (left.pinned !== right.pinned) return left.pinned ? -1 : 1;
            if (left.featured !== right.featured) return left.featured ? -1 : 1;
            return String(right.updatedAt || '').localeCompare(String(left.updatedAt || ''));
        });
    const tickets = serviceState.tickets
        .filter(ticket => this.canViewStudentServiceTicket(ticket, viewer.viewerId))
        .sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')))
        .map(ticket => this.decorateStudentServiceTicket(ticket, viewer.viewerId));
    const articles = serviceState.articles
        .filter(article => viewer.canModerate || article.published)
        .filter(article => viewer.canModerate
            || article.audience === 'all'
            || (article.audience === 'students' && viewer.role === 'student')
            || (article.audience === 'staff' && ['admin', 'student_service', 'professor', 'ta'].includes(viewer.role))
        )
        .sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')))
        .map(article => clone(article));
    return {
        tickets,
        questions,
        answers: questions.flatMap(question => question.answers || []),
        articles,
        macros: viewer.canModerate ? serviceState.macros.map(item => clone(item)) : [],
        reviewQueue: viewer.canModerate ? serviceState.reviewQueue.map(item => clone(item)) : [],
        analytics: this.getStudentServiceAnalytics(viewer.viewerId),
        permissions: {
            canModerate: viewer.canModerate,
            canPublish: viewer.canModerate,
            canRespond: ['admin', 'student_service', 'professor', 'ta'].includes(viewer.role),
            canAskPublic: viewer.role === 'student',
            canCreateTicket: viewer.role === 'student',
            canViewResponderLane: ['admin', 'student_service', 'professor', 'ta'].includes(viewer.role)
        }
    };
}

module.exports = {
    STUDENT_SERVICE_CATEGORIES,
    STUDENT_SERVICE_DEFAULT_ARTICLES,
    STUDENT_SERVICE_DEFAULT_MACROS,
    STUDENT_SERVICE_RESPONDER_CATEGORIES,
    STUDENT_SERVICE_SENSITIVE_CATEGORIES,
    getStudentServiceAreaForCategory,
    getStudentServiceBootstrap,
    normalizeStudentServiceAnswerRecord,
    normalizeStudentServiceArticleRecord,
    normalizeStudentServiceCategory,
    normalizeStudentServiceInternalNote,
    normalizeStudentServiceMacroRecord,
    normalizeStudentServiceQuestionRecord,
    normalizeStudentServiceReviewQueueEntry,
    normalizeStudentServiceThreadEntry,
    normalizeStudentServiceTicketRecord
};
