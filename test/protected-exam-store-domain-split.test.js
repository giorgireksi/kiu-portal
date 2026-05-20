import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { join } from 'path';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');
const protectedExamService = require('../backend/platform/domains/protected-exam-service.js');

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function buildStore() {
    const store = new PlatformStore({
        appUrl: 'https://portal.kiu.test',
        backendUrl: 'https://api.kiu.test'
    });
    store.state.accounts['student-1'] = {
        id: 'student-1',
        displayName: 'Student One',
        nameEn: 'Student One',
        email: 'student1@example.com',
        role: 'student',
        facultyCode: 'ECON',
        accountStatus: 'active',
        activationRequired: false,
        mustChangePassword: false
    };
    return store;
}

describe('protected exam store domain split', () => {
    it('keeps protected exam ownership in protected-exam-service', () => {
        const source = readSource('backend/platform/store.js');

        expect(Object.keys(protectedExamService).sort()).toEqual([
            'buildExamSessionCourseKey',
            'buildProtectedQuizClientUrl',
            'createExamPortalLaunchTicket',
            'createExamPortalSession',
            'createProtectedQuizLaunchTicket',
            'deriveExamSessionRuntimeStatus',
            'ensureExamPortalSession',
            'ensureProtectedClientSession',
            'ensureProtectedQuizAttemptRecord',
            'ensureProtectedQuizLaunch',
            'findProtectedQuizRecord',
            'getExamPortalSession',
            'getExamPortalSessionSummary',
            'getExamSession',
            'getProtectedClientAttempt',
            'getProtectedClientSession',
            'getProtectedQuiz',
            'getProtectedQuizMonitor',
            'heartbeatProtectedQuiz',
            'listExamPortalVisibleSessions',
            'listExamSessionsForStudent',
            'manualGradeProtectedQuiz',
            'normalizeExamSessionRecord',
            'normalizeExamSessionStatus',
            'recordProtectedQuizEvent',
            'redeemProtectedQuizLaunch',
            'revokeProtectedClientSessions',
            'syncExamSession',
            'syncProtectedQuiz',
            'updateProtectedQuizAttemptControl'
        ]);
        expect(source).toContain("} = require('./domains/protected-exam-service');");
        expect(source).toContain('return syncExamSession.call(this, payload);');
        expect(source).toContain('return redeemProtectedQuizLaunch.call(this, payload);');
        expect(source).toContain('return getProtectedQuizMonitor.call(this, courseId, quizId);');
    });

    it('preserves exam portal and protected quiz launch behavior through PlatformStore wrappers', () => {
        const store = buildStore();
        const liveStart = new Date(Date.now() - 60 * 1000).toISOString();
        const liveEnd = new Date(Date.now() + 60 * 60 * 1000).toISOString();

        const session = store.syncExamSession({
            id: 'EXAM-1',
            subjectId: 'SUBJ-1',
            subjectName: 'Economics',
            title: 'Economics Midterm',
            startAt: liveStart,
            endAt: liveEnd,
            assignedStudents: [{ id: 'student-1', name: 'Student One', email: 'student1@example.com' }]
        });

        expect(session?.protectedQuizId).toBeTruthy();
        const portalLogin = store.createExamPortalSession({ email: 'student1@example.com', studentId: 'student-1' });
        expect(portalLogin?.token).toBeTruthy();
        expect(portalLogin?.sessions).toHaveLength(1);

        const launch = store.createExamPortalLaunchTicket('EXAM-1', { token: portalLogin.token });
        expect(launch?.ticket).toBeTruthy();

        const redeemed = store.redeemProtectedQuizLaunch({ ticket: launch.ticket });
        expect(redeemed?.clientSessionToken).toBeTruthy();
        expect(redeemed?.allowedDomains).toContain('portal.kiu.test');
        expect(redeemed?.allowedDomains).toContain('api.kiu.test');

        const heartbeat = store.heartbeatProtectedQuiz({
            courseId: session.protectedCourseId,
            quizId: session.protectedQuizId,
            clientSessionToken: redeemed.clientSessionToken
        });
        expect(heartbeat?.attempt?.antiCheatConnected).toBe(true);

        const monitor = store.getProtectedQuizMonitor(session.protectedCourseId, session.protectedQuizId);
        expect(monitor?.quizzes?.[0]?.attempts).toHaveLength(1);
    });
});
