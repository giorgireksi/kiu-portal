import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');

function buildStore() {
    const store = new PlatformStore();
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
        expect(studentBootstrap.articles.length).toBeGreaterThan(0);

        expect(professorBootstrap.permissions.canRespond).toBe(true);
        expect(professorBootstrap.questions).toHaveLength(1);
        expect(professorBootstrap.questions[0].authorLabel).toBe('Anonymous student');
        expect(professorBootstrap.questions[0].authorUserId).toBe('');
        expect(professorBootstrap.questions[0].authorDisplayName).toBe('');
        expect(professorBootstrap.questions[0].answers).toHaveLength(1);
        expect(professorBootstrap.analytics.repeatedTopics[0].category).toBe('Academic Process');
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
