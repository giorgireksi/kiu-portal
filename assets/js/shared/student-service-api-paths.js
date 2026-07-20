(function initStudentServiceApiPaths(globalScope) {
    'use strict';

    const root = globalScope || (typeof window !== 'undefined' ? window : globalThis);
    const enc = (value) => encodeURIComponent(String(value || '').trim());

    const STATIC_SEGMENTS = new Set([
        'api',
        'student-service',
        'bootstrap',
        'tickets',
        'articles',
        'questions',
        'answers',
        'replies',
        'status',
        'assign',
        'internal-notes',
        'handoff',
        'delete',
        'feedback',
        'owner-resolution',
        'publish',
        'flags',
        'convert-to-ticket',
        'convert-to-article',
        'merge',
        'accept-answer',
        'inbox-filter-layout'
    ]);

    function normalizeStudentServiceApiPath(path = '') {
        const parts = String(path || '').trim().split('?')[0].split('/').filter(Boolean);
        return `/${parts.map(part => {
            let decoded = part;
            try {
                decoded = decodeURIComponent(part);
            } catch (error) {
                decoded = part;
            }
            return STATIC_SEGMENTS.has(decoded) ? decoded : ':param';
        }).join('/')}`;
    }

    const STUDENT_SERVICE_API_PATHS = {
        bootstrap: () => '/api/student-service/bootstrap',
        ticketsCreate: () => '/api/student-service/tickets',
        ticketReplies: (ticketId) => `/api/student-service/tickets/${enc(ticketId)}/replies`,
        ticketStatus: (ticketId) => `/api/student-service/tickets/${enc(ticketId)}/status`,
        ticketAssign: (ticketId) => `/api/student-service/tickets/${enc(ticketId)}/assign`,
        ticketInternalNotes: (ticketId) => `/api/student-service/tickets/${enc(ticketId)}/internal-notes`,
        ticketHandoff: (ticketId) => `/api/student-service/tickets/${enc(ticketId)}/handoff`,
        articlesCreate: () => '/api/student-service/articles',
        articlesDelete: (articleId) => `/api/student-service/articles/${enc(articleId)}/delete`,
        questionsCreate: () => '/api/student-service/questions',
        questionAnswers: (questionId) => `/api/student-service/questions/${enc(questionId)}/answers`,
        questionAnswerDelete: (questionId, answerId) =>
            `/api/student-service/questions/${enc(questionId)}/answers/${enc(answerId)}/delete`,
        questionDelete: (questionId) => `/api/student-service/questions/${enc(questionId)}/delete`,
        questionFeedback: (questionId) => `/api/student-service/questions/${enc(questionId)}/feedback`,
        questionAnswerFeedback: (questionId, answerId) =>
            `/api/student-service/questions/${enc(questionId)}/answers/${enc(answerId)}/feedback`,
        questionPublish: (questionId) => `/api/student-service/questions/${enc(questionId)}/publish`,
        questionOwnerResolution: (questionId) =>
            `/api/student-service/questions/${enc(questionId)}/owner-resolution`,
        questionFlags: (questionId) => `/api/student-service/questions/${enc(questionId)}/flags`,
        questionConvertTicket: (questionId) =>
            `/api/student-service/questions/${enc(questionId)}/convert-to-ticket`,
        questionConvertArticle: (questionId) =>
            `/api/student-service/questions/${enc(questionId)}/convert-to-article`,
        questionMerge: (questionId) => `/api/student-service/questions/${enc(questionId)}/merge`,
        questionAcceptAnswer: (questionId) => `/api/student-service/questions/${enc(questionId)}/accept-answer`,
        inboxFilterLayout: () => '/api/student-service/inbox-filter-layout'
    };

    const STUDENT_SERVICE_API_PATH_PATTERN_SET = new Set(
        Object.entries(STUDENT_SERVICE_API_PATHS).map(([key, builder]) => {
            if (key === 'bootstrap' || key === 'inboxFilterLayout' || key.endsWith('Create')) {
                return normalizeStudentServiceApiPath(builder());
            }
            if (key === 'ticketReplies' || key === 'ticketStatus' || key === 'ticketAssign'
                || key === 'ticketInternalNotes' || key === 'ticketHandoff') {
                return normalizeStudentServiceApiPath(builder('SVC-100'));
            }
            if (key === 'questionAnswerDelete' || key === 'questionAnswerFeedback') {
                return normalizeStudentServiceApiPath(builder('svc_question_sample', 'svc_answer_sample'));
            }
            return normalizeStudentServiceApiPath(builder('svc_question_sample'));
        })
    );

    function buildStudentServiceApiPath(key, ...args) {
        const builder = STUDENT_SERVICE_API_PATHS[key];
        if (typeof builder !== 'function') {
            throw new Error(`Unknown student service API path key: ${key}`);
        }
        return assertStudentServiceApiPath(builder(...args));
    }

    function assertStudentServiceApiPath(path = '') {
        const normalized = normalizeStudentServiceApiPath(path);
        if (!STUDENT_SERVICE_API_PATH_PATTERN_SET.has(normalized)) {
            throw new Error(`Unknown student service API path: ${path}`);
        }
        return path;
    }

    root.STUDENT_SERVICE_API_MANIFEST_VERSION = '20260627-ssvc-no-bulk-delete'; // keep aligned with backend/platform/contracts/student-service-api-contract.js
    root.STUDENT_SERVICE_API_PATHS = STUDENT_SERVICE_API_PATHS;
    root.normalizeStudentServiceApiPath = normalizeStudentServiceApiPath;
    root.buildStudentServiceApiPath = buildStudentServiceApiPath;
    root.assertStudentServiceApiPath = assertStudentServiceApiPath;
}(typeof window !== 'undefined' ? window : globalThis));