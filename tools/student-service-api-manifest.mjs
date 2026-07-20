import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { STUDENT_SERVICE_API_MANIFEST_VERSION } = require('../backend/platform/contracts/student-service-api-contract.js');

export { STUDENT_SERVICE_API_MANIFEST_VERSION };

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

export function normalizeStudentServiceApiPath(path = '') {
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

export const STUDENT_SERVICE_API_MANIFEST = [
    { id: 'bootstrap', method: 'GET', pattern: '/api/student-service/bootstrap', client: true },
    { id: 'ticketsCreate', method: 'POST', pattern: '/api/student-service/tickets', storeMethod: 'createStudentServiceTicket', client: true },
    { id: 'ticketReplies', method: 'POST', pattern: '/api/student-service/tickets/:param/replies', storeMethod: 'replyStudentServiceTicket', client: true },
    { id: 'ticketStatus', method: 'POST', pattern: '/api/student-service/tickets/:param/status', storeMethod: 'updateStudentServiceTicketStatus', client: true },
    { id: 'ticketAssign', method: 'POST', pattern: '/api/student-service/tickets/:param/assign', storeMethod: 'assignStudentServiceTicket', client: true },
    { id: 'ticketInternalNotes', method: 'POST', pattern: '/api/student-service/tickets/:param/internal-notes', storeMethod: 'addStudentServiceInternalNote', client: true },
    { id: 'ticketHandoff', method: 'POST', pattern: '/api/student-service/tickets/:param/handoff', storeMethod: 'updateStudentServiceTicketHandoff', client: true },
    { id: 'articlesCreate', method: 'POST', pattern: '/api/student-service/articles', storeMethod: 'saveStudentServiceArticle', client: true },
    { id: 'articlesDelete', method: 'POST', pattern: '/api/student-service/articles/:param/delete', storeMethod: 'deleteStudentServiceArticle', client: true },
    { id: 'questionsCreate', method: 'POST', pattern: '/api/student-service/questions', storeMethod: 'createStudentServiceQuestion', client: true },
    { id: 'questionAnswers', method: 'POST', pattern: '/api/student-service/questions/:param/answers', storeMethod: 'addStudentServiceQuestionAnswer', client: true },
    { id: 'questionAnswerDelete', method: 'POST', pattern: '/api/student-service/questions/:param/answers/:param/delete', storeMethod: 'deleteStudentServiceQuestionAnswer', client: true },
    { id: 'questionDelete', method: 'POST', pattern: '/api/student-service/questions/:param/delete', storeMethod: 'deleteStudentServiceQuestion', client: true },
    { id: 'questionFeedback', method: 'POST', pattern: '/api/student-service/questions/:param/feedback', storeMethod: 'setStudentServiceQuestionFeedback', client: true },
    { id: 'questionAnswerFeedback', method: 'POST', pattern: '/api/student-service/questions/:param/answers/:param/feedback', storeMethod: 'setStudentServiceAnswerFeedback', client: true },
    { id: 'questionAcceptAnswer', method: 'POST', pattern: '/api/student-service/questions/:param/accept-answer', storeMethod: 'acceptStudentServiceAnswer', client: false },
    { id: 'questionPublish', method: 'POST', pattern: '/api/student-service/questions/:param/publish', storeMethod: 'publishStudentServiceQuestion', client: true },
    { id: 'questionOwnerResolution', method: 'POST', pattern: '/api/student-service/questions/:param/owner-resolution', storeMethod: 'setStudentServiceQuestionOwnerResolution', client: true },
    { id: 'questionFlags', method: 'POST', pattern: '/api/student-service/questions/:param/flags', storeMethod: 'updateStudentServiceQuestionFlags', client: true },
    { id: 'questionConvertTicket', method: 'POST', pattern: '/api/student-service/questions/:param/convert-to-ticket', storeMethod: 'convertStudentServiceQuestionToTicket', client: true },
    { id: 'questionConvertArticle', method: 'POST', pattern: '/api/student-service/questions/:param/convert-to-article', storeMethod: 'convertStudentServiceQuestionToArticle', client: true },
    { id: 'questionMerge', method: 'POST', pattern: '/api/student-service/questions/:param/merge', storeMethod: 'mergeStudentServiceQuestions', client: true },
    { id: 'inboxFilterLayout', method: 'POST', pattern: '/api/student-service/inbox-filter-layout', storeMethod: 'saveStudentServiceInboxFilterLayout', client: true }
];

export const STUDENT_SERVICE_CLIENT_MANIFEST = STUDENT_SERVICE_API_MANIFEST.filter(entry => entry.client);

export function extractStudentServiceRoutePatterns(routeSource = '') {
    const routes = [];
    const pattern = /app\.(get|post)\(\s*['"]([^'"]+)['"]/g;
    let match = pattern.exec(routeSource);
    while (match) {
        routes.push({
            method: String(match[1] || '').toUpperCase(),
            pattern: normalizeStudentServiceApiPath(String(match[2] || '').replace(/:([a-zA-Z]+)/g, ':param'))
        });
        match = pattern.exec(routeSource);
    }
    return routes;
}

export function buildStudentServiceSamplePaths() {
    const sampleQuestionId = 'svc_question_sample';
    const sampleAnswerId = 'svc_answer_sample';
    const sampleTicketId = 'SVC-100';
    return {
        bootstrap: '/api/student-service/bootstrap',
        ticketsCreate: '/api/student-service/tickets',
        ticketReplies: `/api/student-service/tickets/${encodeURIComponent(sampleTicketId)}/replies`,
        ticketStatus: `/api/student-service/tickets/${encodeURIComponent(sampleTicketId)}/status`,
        ticketAssign: `/api/student-service/tickets/${encodeURIComponent(sampleTicketId)}/assign`,
        ticketInternalNotes: `/api/student-service/tickets/${encodeURIComponent(sampleTicketId)}/internal-notes`,
        ticketHandoff: `/api/student-service/tickets/${encodeURIComponent(sampleTicketId)}/handoff`,
        articlesCreate: '/api/student-service/articles',
        articlesDelete: `/api/student-service/articles/${encodeURIComponent('svc_article_sample')}/delete`,
        questionsCreate: '/api/student-service/questions',
        questionAnswers: `/api/student-service/questions/${encodeURIComponent(sampleQuestionId)}/answers`,
        questionAnswerDelete: `/api/student-service/questions/${encodeURIComponent(sampleQuestionId)}/answers/${encodeURIComponent(sampleAnswerId)}/delete`,
        questionDelete: `/api/student-service/questions/${encodeURIComponent(sampleQuestionId)}/delete`,
        questionFeedback: `/api/student-service/questions/${encodeURIComponent(sampleQuestionId)}/feedback`,
        questionAnswerFeedback: `/api/student-service/questions/${encodeURIComponent(sampleQuestionId)}/answers/${encodeURIComponent(sampleAnswerId)}/feedback`,
        questionPublish: `/api/student-service/questions/${encodeURIComponent(sampleQuestionId)}/publish`,
        questionOwnerResolution: `/api/student-service/questions/${encodeURIComponent(sampleQuestionId)}/owner-resolution`,
        questionFlags: `/api/student-service/questions/${encodeURIComponent(sampleQuestionId)}/flags`,
        questionConvertTicket: `/api/student-service/questions/${encodeURIComponent(sampleQuestionId)}/convert-to-ticket`,
        questionConvertArticle: `/api/student-service/questions/${encodeURIComponent(sampleQuestionId)}/convert-to-article`,
        questionMerge: `/api/student-service/questions/${encodeURIComponent(sampleQuestionId)}/merge`,
        inboxFilterLayout: '/api/student-service/inbox-filter-layout'
    };
}