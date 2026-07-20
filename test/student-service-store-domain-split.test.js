import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');

function buildStore() {
    const store = new PlatformStore();
    store.state.accounts['student-2'] = {
        id: 'student-2',
        name: 'Student Two',
        nameEn: 'Student Two',
        displayName: 'Student Two',
        role: 'student',
        facultyCode: 'ECON',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    };
    store.state.accounts['student-1'] = {
        id: 'student-1',
        name: 'Student One',
        nameEn: 'Student One',
        displayName: 'Student One',
        role: 'student',
        facultyCode: 'ECON',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    };
    store.state.accounts['prof-1'] = {
        id: 'prof-1',
        name: 'Professor One',
        nameEn: 'Professor One',
        displayName: 'Professor One',
        role: 'professor',
        facultyCode: 'ECON',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    };
    store.state.accounts['svc-1'] = {
        id: 'svc-1',
        name: 'Service Desk',
        nameEn: 'Service Desk',
        displayName: 'Service Desk',
        role: 'student_service',
        facultyCode: 'ECON',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    };
    store.state.portal.state = {
        studentServiceTickets: [{
            id: 'SVC-100',
            studentId: 'student-1',
            studentName: 'Student One',
            category: 'Finance / Payments',
            title: 'Fee receipt',
            message: 'Need help with my receipt.',
            facultyCode: 'ECON',
            internalNotes: [{ authorId: 'svc-1', authorName: 'Service Desk', message: 'private note' }],
            handoff: { target: 'finance', status: 'Requested', summary: 'Escalate' }
        }],
        studentServiceQuestions: [{
            id: 'svc-question-1',
            title: 'Appeal timing',
            body: 'When does the appeal window open?',
            category: 'Academic Process',
            facultyCode: 'ECON',
            authorUserId: 'student-1',
            authorDisplayName: 'Student One',
            authorRole: 'student',
            status: 'published',
            anonymousMode: true,
            helpfulVotes: [{ userId: 'student-2', value: 'helpful' }],
            updatedAt: '2026-05-01T10:00:00.000Z'
        }],
        studentServiceAnswers: [{
            id: 'svc-answer-1',
            questionId: 'svc-question-1',
            authorUserId: 'svc-1',
            authorDisplayName: 'Service Desk',
            authorRole: 'student_service',
            body: 'The appeal window opens after grade publication.',
            status: 'published'
        }]
    };
    return store;
}

describe('student service store domain split', () => {
    it('keeps student bootstrap privacy filters and professor responder visibility intact', () => {
        const store = buildStore();

        const studentBootstrap = store.getStudentServiceBootstrap('student-1');
        const professorBootstrap = store.getStudentServiceBootstrap('prof-1');

        expect(studentBootstrap.tickets).toHaveLength(1);
        expect(studentBootstrap.tickets[0].internalNotes).toEqual([]);
        expect(studentBootstrap.tickets[0].handoff).toEqual({
            target: '',
            status: '',
            summary: '',
            requestedAt: '',
            updatedAt: '',
            requestedById: '',
            requestedByName: ''
        });
        expect(studentBootstrap.macros).toEqual([]);
        expect(studentBootstrap.articles.length).toBe(0);

        expect(professorBootstrap.permissions.canRespond).toBe(true);
        expect(professorBootstrap.questions).toHaveLength(1);
        expect(professorBootstrap.questions[0].authorLabel).toBe('Anonymous student');
        expect(professorBootstrap.questions[0].authorUserId).toBe('');
        expect(professorBootstrap.questions[0].authorDisplayName).toBe('');
        expect(professorBootstrap.questions[0].answers).toHaveLength(1);
        expect(professorBootstrap.analytics.repeatedTopics[0].category).toBe('Academic Process');
    });

    it('publishes new student questions immediately without a review queue entry', () => {
        const store = buildStore();

        const created = store.createStudentServiceQuestion({
            title: 'Dorm curfew',
            body: 'What time is curfew this semester?',
            category: 'Campus Life',
            facultyCode: 'ECON',
            anonymousMode: true
        }, 'student-2');

        expect(created?.error).toBeUndefined();
        expect(created?.status).toBe('published');
        expect(store.ensureStudentServiceState().reviewQueue.some(entry =>
            entry.entityType === 'question'
            && entry.entityId === created.id
            && entry.status === 'open'
        )).toBe(false);
    });

    it('allows any authenticated viewer who can see a thread to post a published answer', () => {
        const store = buildStore();

        const peerAnswer = store.addStudentServiceQuestionAnswer('svc-question-1', {
            body: 'Appeals open one week after grades post.'
        }, 'student-2');

        expect(peerAnswer?.error).toBeUndefined();
        const answers = peerAnswer.answers || [];
        expect(answers.some(answer => answer.authorUserId === 'student-2' && answer.status === 'published')).toBe(true);

        const studentBootstrap = store.getStudentServiceBootstrap('student-2');
        expect(studentBootstrap.permissions.canRespond).toBe(true);
        expect(studentBootstrap.permissions.canPublish).toBe(false);
    });

    it('stores one-level nested comment replies linked to a parent answer', () => {
        const store = buildStore();

        const parentReply = store.addStudentServiceQuestionAnswer('svc-question-1', {
            body: 'Top-level comment.'
        }, 'student-2');
        const parentAnswer = (parentReply.answers || []).find(answer => answer.authorUserId === 'student-2' && !answer.parentAnswerId);
        expect(parentAnswer?.id).toBeTruthy();

        const nestedReply = store.addStudentServiceQuestionAnswer('svc-question-1', {
            body: 'Reply to the top-level comment.',
            parentAnswerId: parentAnswer.id
        }, 'prof-1');
        expect(nestedReply?.error).toBeUndefined();
        const childAnswer = (nestedReply.answers || []).find(answer => answer.parentAnswerId === parentAnswer.id);
        expect(childAnswer?.status).toBe('published');
        expect(childAnswer?.replyToName).toBe('Student Two');
    });

    it('deletes a comment and its direct child replies for the author or moderator', () => {
        const store = buildStore();

        const parentReply = store.addStudentServiceQuestionAnswer('svc-question-1', {
            body: 'Top-level comment.'
        }, 'student-2');
        const parentAnswer = (parentReply.answers || []).find(answer => answer.authorUserId === 'student-2' && !answer.parentAnswerId);
        const nestedReply = store.addStudentServiceQuestionAnswer('svc-question-1', {
            body: 'Nested reply.',
            parentAnswerId: parentAnswer.id
        }, 'prof-1');
        const childAnswer = (nestedReply.answers || []).find(answer => answer.parentAnswerId === parentAnswer.id);
        expect(childAnswer?.id).toBeTruthy();

        const denied = store.deleteStudentServiceQuestionAnswer('svc-question-1', parentAnswer.id, 'prof-1');
        expect(denied?.error).toContain('not allowed');
        expect(denied?.status).toBe(403);

        const deleted = store.deleteStudentServiceQuestionAnswer('svc-question-1', parentAnswer.id, 'student-2');
        expect(deleted?.error).toBeUndefined();
        expect((deleted.answers || []).some(answer => answer.id === parentAnswer.id)).toBe(false);
        expect((deleted.answers || []).some(answer => answer.id === childAnswer.id)).toBe(false);
    });

    it('lets the question author set, switch, and clear owner resolution status', () => {
        const store = buildStore();
        store.ensureStudentServiceState();

        const denied = store.setStudentServiceQuestionOwnerResolution('svc-question-1', { status: 'answered' }, 'student-2');
        expect(denied?.status).toBe(403);

        const answered = store.setStudentServiceQuestionOwnerResolution('svc-question-1', { status: 'answered' }, 'student-1');
        expect(answered?.error).toBeUndefined();
        expect(answered.ownerResolutionStatus).toBe('answered');
        expect(answered.ownerResolutionUpdatedBy).toBe('student-1');
        expect(answered.viewerCanSetOwnerResolution).toBe(true);

        const unanswered = store.setStudentServiceQuestionOwnerResolution('svc-question-1', { status: 'unanswered' }, 'student-1');
        expect(unanswered.ownerResolutionStatus).toBe('unanswered');

        const cleared = store.setStudentServiceQuestionOwnerResolution('svc-question-1', { status: 'unanswered' }, 'student-1');
        expect(cleared.ownerResolutionStatus).toBe('');

        const bootstrap = store.getStudentServiceBootstrap('student-2');
        const bootQuestion = (bootstrap.questions || []).find(question => question.id === 'svc-question-1');
        expect(bootQuestion?.ownerResolutionStatus).toBe('');
    });

    it('toggles helpful votes on public questions', () => {
        const store = buildStore();
        const voted = store.setStudentServiceQuestionFeedback('svc-question-1', { value: 'helpful' }, 'student-1');
        expect(voted.helpfulCount).toBe(2);
        expect(voted.viewerVote).toBe('helpful');

        const unvoted = store.setStudentServiceQuestionFeedback('svc-question-1', { value: 'helpful' }, 'student-1');
        expect(unvoted.helpfulCount).toBe(1);
        expect(unvoted.viewerVote).toBe('');
    });

    it('toggles helpful votes on published comments and replies', () => {
        const store = buildStore();
        const replied = store.addStudentServiceQuestionAnswer('svc-question-1', {
            body: 'Helpful comment.'
        }, 'student-2');
        const comment = (replied.answers || []).find(answer => answer.authorUserId === 'student-2' && answer.body === 'Helpful comment.');
        const voted = store.setStudentServiceAnswerFeedback('svc-question-1', comment.id, 'student-1');
        const votedAnswer = (voted.answers || []).find(answer => answer.id === comment.id);
        expect(votedAnswer?.helpfulCount).toBe(1);
        expect(votedAnswer?.viewerHelpfulVote).toBe(true);

        const unvoted = store.setStudentServiceAnswerFeedback('svc-question-1', comment.id, 'student-1');
        const unvotedAnswer = (unvoted.answers || []).find(answer => answer.id === comment.id);
        expect(unvotedAnswer?.helpfulCount).toBe(0);
        expect(unvotedAnswer?.viewerHelpfulVote).toBe(false);
    });

    it('clears acceptedAnswerId when the accepted comment is deleted', () => {
        const store = buildStore();
        const accepted = store.addStudentServiceQuestionAnswer('svc-question-1', {
            body: 'Accepted answer.'
        }, 'student-2');
        const acceptedAnswer = (accepted.answers || []).find(answer => answer.authorUserId === 'student-2' && answer.body === 'Accepted answer.');
        store.acceptStudentServiceAnswer('svc-question-1', { answerId: acceptedAnswer.id }, 'student-1');
        const denied = store.deleteStudentServiceQuestionAnswer('svc-question-1', acceptedAnswer.id, 'svc-1');
        expect(denied?.error).toContain('not allowed to delete');
        expect(denied?.status).toBe(403);

        const deleted = store.deleteStudentServiceQuestionAnswer('svc-question-1', acceptedAnswer.id, 'student-2');
        expect(deleted?.error).toBeUndefined();
        expect(deleted.acceptedAnswerId).toBe('');
    });

    it('rejects nested replies deeper than one level', () => {
        const store = buildStore();
        const parentReply = store.addStudentServiceQuestionAnswer('svc-question-1', {
            body: 'Top-level comment.'
        }, 'student-2');
        const parentAnswer = (parentReply.answers || []).find(answer => answer.authorUserId === 'student-2' && !answer.parentAnswerId);
        const childReply = store.addStudentServiceQuestionAnswer('svc-question-1', {
            body: 'First reply.',
            parentAnswerId: parentAnswer.id
        }, 'prof-1');
        const childAnswer = (childReply.answers || []).find(answer => answer.parentAnswerId === parentAnswer.id);
        const tooDeep = store.addStudentServiceQuestionAnswer('svc-question-1', {
            body: 'Too deep.',
            parentAnswerId: childAnswer.id
        }, 'student-2');
        expect(tooDeep?.error).toContain('one level');
        expect(tooDeep?.status).toBe(409);
    });

    it('allows a legacy answer with only responderUserId to be deleted by that author after normalize', () => {
        const store = buildStore();
        store.state.portal.state.studentServiceAnswers = [{
            id: 'svc-answer-legacy',
            questionId: 'svc-question-1',
            responderUserId: 'student-2',
            responderName: 'Student Two',
            responderRole: 'student',
            body: 'Legacy peer comment.',
            status: 'published'
        }];
        store.state.studentService = {
            tickets: [],
            questions: [],
            answers: [],
            articles: [],
            macros: [],
            reviewQueue: []
        };

        store.ensureStudentServiceState();
        const bootstrap = store.getStudentServiceBootstrap('student-2');
        const question = bootstrap.questions.find(item => item.id === 'svc-question-1');
        const legacyAnswer = (question?.answers || []).find(answer => answer.id === 'svc-answer-legacy');

        expect(legacyAnswer?.authorUserId).toBe('student-2');
        expect(legacyAnswer?.authorDisplayName).toBe('Student Two');

        const deleted = store.deleteStudentServiceQuestionAnswer('svc-question-1', 'svc-answer-legacy', 'student-2');
        expect(deleted?.error).toBeUndefined();
        expect((deleted.answers || []).some(answer => answer.id === 'svc-answer-legacy')).toBe(false);
    });

    it('repairs orphan Staff answers from the dominant author on the same question', () => {
        const store = buildStore();
        store.state.portal.state.studentServiceAnswers = [
            {
                id: 'svc-answer-orphan',
                questionId: 'svc-question-1',
                responderName: 'Staff',
                responderRole: 'student_service',
                body: 'Orphan test comment.',
                status: 'published'
            },
            {
                id: 'svc-answer-known',
                questionId: 'svc-question-1',
                responderUserId: 'student-2',
                responderName: 'Student Two',
                responderRole: 'student',
                body: 'Known author comment.',
                status: 'published'
            }
        ];
        store.state.studentService = {
            tickets: [],
            questions: [],
            answers: [],
            articles: [],
            macros: [],
            reviewQueue: []
        };

        store.ensureStudentServiceState();
        const repaired = store.state.studentService.answers.find(answer => answer.id === 'svc-answer-orphan');
        expect(repaired?.authorUserId).toBe('student-2');
        expect(repaired?.authorDisplayName).toBe('Student Two');

        const deleted = store.deleteStudentServiceQuestionAnswer('svc-question-1', 'svc-answer-orphan', 'student-2');
        expect(deleted?.error).toBeUndefined();
    });

    it('rejects question-author and moderator deletes for comments they did not write', () => {
        const store = buildStore();
        store.state.portal.state.studentServiceAnswers = [{
            id: 'svc-answer-orphan',
            questionId: 'svc-question-1',
            responderUserId: 'student-2',
            responderName: 'Student Two',
            responderRole: 'student',
            body: 'Peer comment.',
            status: 'published'
        }];
        store.state.studentService = {
            tickets: [],
            questions: [],
            answers: [],
            articles: [],
            macros: [],
            reviewQueue: []
        };

        store.ensureStudentServiceState();

        const deniedForQuestionAuthor = store.deleteStudentServiceQuestionAnswer('svc-question-1', 'svc-answer-orphan', 'student-1');
        expect(deniedForQuestionAuthor?.error).toContain('not allowed to delete');
        expect(deniedForQuestionAuthor?.status).toBe(403);

        const deniedForModerator = store.deleteStudentServiceQuestionAnswer('svc-question-1', 'svc-answer-orphan', 'svc-1');
        expect(deniedForModerator?.error).toContain('not allowed to delete');
        expect(deniedForModerator?.status).toBe(403);

        const deleted = store.deleteStudentServiceQuestionAnswer('svc-question-1', 'svc-answer-orphan', 'student-2');
        expect(deleted?.error).toBeUndefined();
        expect((deleted.answers || []).some(answer => answer.id === 'svc-answer-orphan')).toBe(false);
    });

    it('persists canonical answer shape when portal JSON still has legacy responder fields', () => {
        const store = buildStore();
        store.state.portal.state.studentServiceAnswers = [{
            id: 'svc-answer-legacy',
            questionId: 'svc-question-1',
            responderUserId: 'student-2',
            responderName: 'Student Two',
            responderRole: 'student',
            body: 'Legacy peer comment.',
            status: 'published'
        }];
        store.state.studentService = {
            tickets: [],
            questions: [],
            answers: [],
            articles: [],
            macros: [],
            reviewQueue: []
        };

        store.ensureStudentServiceState();
        const portalAnswer = store.state.portal.state.studentServiceAnswers[0];

        expect(portalAnswer.authorUserId).toBe('student-2');
        expect(portalAnswer.authorDisplayName).toBe('Student Two');
        expect(portalAnswer.authorRole).toBe('student');
        expect(portalAnswer.responderUserId).toBeUndefined();
        expect(portalAnswer.responderName).toBeUndefined();
        expect(portalAnswer.responderRole).toBeUndefined();
    });

    it('does not resurrect deleted answers from stale portal copies on ensureStudentServiceState', () => {
        const store = buildStore();
        store.ensureStudentServiceState();

        const replied = store.addStudentServiceQuestionAnswer('svc-question-1', {
            body: 'Delete this comment.'
        }, 'student-2');
        const answer = (replied.answers || []).find(item => item.body === 'Delete this comment.');
        expect(answer?.id).toBeTruthy();

        const deleted = store.deleteStudentServiceQuestionAnswer('svc-question-1', answer.id, 'student-2');
        expect(deleted?.error).toBeUndefined();
        expect((deleted.answers || []).some(item => item.id === answer.id)).toBe(false);

        store.state.portal.state.studentServiceAnswers.push({
            id: answer.id,
            questionId: 'svc-question-1',
            authorUserId: 'student-2',
            authorDisplayName: 'Student Two',
            authorRole: 'student',
            body: 'Delete this comment.',
            status: 'published'
        });

        const serviceState = store.ensureStudentServiceState();
        expect(serviceState.answers.some(item => item.id === answer.id)).toBe(false);
    });

    it('allows the question author to hard-delete their question and all answers', () => {
        const store = buildStore();
        store.ensureStudentServiceState();
        store.state.studentService.answers.push({
            id: 'svc-answer-child',
            questionId: 'svc-question-1',
            authorUserId: 'student-2',
            authorDisplayName: 'Student Two',
            authorRole: 'student',
            parentAnswerId: 'svc-answer-1',
            body: 'Nested reply.',
            status: 'published'
        });

        const deleted = store.deleteStudentServiceQuestion('svc-question-1', 'student-1');
        expect(deleted?.error).toBeUndefined();
        expect(deleted.deletedQuestionId).toBe('svc-question-1');
        expect(store.state.studentService.questions.some(question => question.id === 'svc-question-1')).toBe(false);
        expect(store.state.studentService.answers.some(answer => answer.questionId === 'svc-question-1')).toBe(false);
        expect(store.state.portal.state.studentServiceAnswers.some(answer => answer.questionId === 'svc-question-1')).toBe(false);
    });

    it('denies question delete for non-authors and blocks converted or merged questions', () => {
        const store = buildStore();
        store.ensureStudentServiceState();

        const denied = store.deleteStudentServiceQuestion('svc-question-1', 'student-2');
        expect(denied?.status).toBe(403);

        store.state.studentService.questions[0].status = 'converted';
        const convertedBlocked = store.deleteStudentServiceQuestion('svc-question-1', 'student-1');
        expect(convertedBlocked?.status).toBe(409);

        store.state.studentService.questions[0].status = 'merged';
        const mergedBlocked = store.deleteStudentServiceQuestion('svc-question-1', 'svc-1');
        expect(mergedBlocked?.status).toBe(409);
    });

    it('allows moderators to hard-delete published questions', () => {
        const store = buildStore();
        store.ensureStudentServiceState();

        const deleted = store.deleteStudentServiceQuestion('svc-question-1', 'svc-1');
        expect(deleted?.error).toBeUndefined();
        expect(deleted.deletedQuestionId).toBe('svc-question-1');
        expect(store.getStudentServiceBootstrap('student-1').questions).toHaveLength(0);
    });

    it('allows staff to delete a single article', () => {
        const store = buildStore();
        store.ensureStudentServiceState();
        store.saveStudentServiceArticle({
            id: 'svc-article-delete-test',
            title: 'Delete me',
            summary: 'Summary',
            content: 'Body',
            published: true
        }, 'svc-1', 'student_service');

        const denied = store.deleteStudentServiceArticle('svc-article-delete-test', 'student-1');
        expect(denied?.status).toBe(403);

        const deleted = store.deleteStudentServiceArticle('svc-article-delete-test', 'svc-1', 'student_service');
        expect(deleted?.error).toBeUndefined();
        expect(deleted.deletedArticleId).toBe('svc-article-delete-test');
        expect(store.state.studentService.articles.some(article => article.id === 'svc-article-delete-test')).toBe(false);
    });

    it('does not resurrect articles from portal state slices', () => {
        const store = buildStore();
        store.ensureStudentServiceState();
        store.state.portal = store.state.portal || { state: {} };
        store.state.portal.state = store.state.portal.state || {};
        store.state.portal.state.studentServiceArticles = [{
            id: 'svc-article-legacy-portal',
            title: 'Legacy portal article',
            summary: 'Summary',
            content: 'Body',
            published: true
        }];
        store.state.studentService.articles = [];

        store.ensureStudentServiceState();
        expect(store.state.studentService.articles).toHaveLength(0);
        expect(store.state.portal.state.studentServiceArticles).toBeUndefined();
        expect(store.getStudentServiceBootstrap('student-1').articles).toHaveLength(0);
    });

    it('strips legacy studentServiceArticles from portal bootstrap payloads', () => {
        const store = buildStore();
        store.ensureStudentServiceState();
        store.state.portal = store.state.portal || { state: {} };
        store.state.portal.state = store.state.portal.state || {};
        store.state.portal.state.studentServiceArticles = [{
            id: 'svc-article-legacy-bootstrap',
            title: 'Legacy bootstrap article',
            summary: 'Summary',
            content: 'Body',
            published: true
        }];

        const bootstrap = store.createPortalBootstrap();
        expect(bootstrap.state.studentServiceArticles).toBeUndefined();
    });

    it('loads student-service normalization and bootstrap from the extracted domain module', () => {
        const storeSource = readFileSync(join(process.cwd(), 'backend/platform/store.js'), 'utf8');
        const domainSource = readFileSync(join(process.cwd(), 'backend/platform/domains/student-service-service.js'), 'utf8');

        expect(storeSource).toContain("require('./domains/student-service-service')");
        expect(domainSource).toContain('function normalizeStudentServiceTicketRecord(');
        expect(domainSource).toContain('function normalizeStudentServiceQuestionRecord(');
        expect(domainSource).toContain('function getStudentServiceBootstrap(');
    });
});
