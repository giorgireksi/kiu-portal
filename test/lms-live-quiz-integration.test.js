import { describe, expect, it } from 'vitest';
import {
    readLmsLiveQuizSource,
    readLmsLiveQuizUiChain,
    readLmsLiveQuizAccessRuntime,
    readLmsLiveQuizWorkspaceRuntime,
    readLmsLiveQuizSessionRuntime,
    readLmsLiveQuizUiStaffRuntime,
    readLmsLiveQuizMainUiRuntime
} from './helpers/lms-live-quiz-source.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');
const lmsLiveQuizService = require('../backend/platform/domains/lms-live-quiz-service.js');

const RESOURCE_KEY = 'ECON-101::g2__lmssec_lecture';
const SESSION_ID = 'live-session-1';
const QUESTION_ID = 'live-question-1';

function buildLiveProfessorWorkspace() {
    const activatedAt = new Date().toISOString();
    return {
        sessions: [{
            id: SESSION_ID,
            status: 'live',
            currentQuestionIndex: 0,
            title: 'Week 4 Quiz',
            questions: [{
                id: QUESTION_ID,
                text: '2 + 2 = ?',
                options: ['3', '4', '5', '6'],
                correctOption: 1,
                timeLimit: 45,
                state: 'showing',
                showVersion: 1,
                activatedAt
            }],
            participants: {
                'student-1': {
                    id: 'student-1',
                    nickname: 'Student One',
                    answers: {},
                    score: 0
                }
            }
        }]
    };
}

function buildStudentSessionAccount() {
    return {
        actorUserId: 'student-1',
        account: {
            id: 'student-1',
            displayName: 'Student One',
            role: 'student'
        }
    };
}

describe('LMS live quiz store integration', () => {
    it('professor sync preserves roster then student answer appears on reload', () => {
        const store = new PlatformStore();
        const professorWorkspace = buildLiveProfessorWorkspace();
        const merged = lmsLiveQuizService.mergeStaffLiveQuizWorkspace({}, professorWorkspace);
        store.saveLmsLiveQuizWorkspace(RESOURCE_KEY, merged);

        const answerResult = lmsLiveQuizService.submitStudentLiveQuizAnswer(
            store.getLmsLiveQuizWorkspace(RESOURCE_KEY),
            {
                sessionId: SESSION_ID,
                questionId: QUESTION_ID,
                selectedOption: 1
            },
            buildStudentSessionAccount(),
            {
                getActorUserId: (session) => String(session?.actorUserId || session?.account?.id || '').trim(),
                getLiveQuizActorName: () => 'Student One'
            }
        );
        expect(answerResult.workspace).toBeTruthy();
        store.saveLmsLiveQuizWorkspace(RESOURCE_KEY, answerResult.workspace);

        const reloaded = store.getLmsLiveQuizWorkspace(RESOURCE_KEY);
        const answer = reloaded.sessions[0].participants['student-1'].answers[QUESTION_ID];
        expect(answer.selectedOption).toBe(1);
        expect(answer.correct).toBe(true);
        expect(reloaded.sessions[0].participants['student-1'].score).toBeGreaterThan(0);
    });

    it('auto-provisions roster slot when professor forgot to seed participants', () => {
        const store = new PlatformStore();
        const liveWorkspace = {
            sessions: [{
                id: SESSION_ID,
                status: 'live',
                currentQuestionIndex: 0,
                questions: [{
                    id: QUESTION_ID,
                    text: 'Pick one',
                    options: ['A', 'B', 'C', 'D'],
                    correctOption: 0,
                    timeLimit: 45,
                    state: 'showing',
                    showVersion: 1,
                    activatedAt: new Date().toISOString()
                }],
                participants: {}
            }]
        };
        store.saveLmsLiveQuizWorkspace(RESOURCE_KEY, liveWorkspace);

        const answerResult = lmsLiveQuizService.submitStudentLiveQuizAnswer(
            store.getLmsLiveQuizWorkspace(RESOURCE_KEY),
            {
                sessionId: SESSION_ID,
                questionId: QUESTION_ID,
                selectedOption: 0
            },
            buildStudentSessionAccount(),
            {
                getActorUserId: (session) => String(session?.actorUserId || session?.account?.id || '').trim(),
                getLiveQuizActorName: () => 'Student One'
            }
        );
        expect(answerResult.workspace.sessions[0].participants['student-1']).toBeTruthy();
        expect(answerResult.workspace.sessions[0].participants['student-1'].answers[QUESTION_ID].selectedOption).toBe(0);
    });

    it('strips transient ui state from bootstrap and persists student joins', () => {
        const store = new PlatformStore();
        const joinedWorkspace = lmsLiveQuizService.submitStudentLiveQuizJoin(
            buildLiveProfessorWorkspace(),
            { sessionId: SESSION_ID, nickname: 'Student One' },
            buildStudentSessionAccount(),
            {
                getActorUserId: (session) => String(session?.actorUserId || session?.account?.id || '').trim(),
                getLiveQuizActorName: () => 'Student One'
            }
        );
        joinedWorkspace.workspace.ui = {
            dirty: true,
            accessDenied: true,
            syncError: 'stale',
            actorKey: 'legacy'
        };
        store.saveLmsLiveQuizWorkspace(RESOURCE_KEY, joinedWorkspace.workspace);

        const bootstrap = store.createPortalBootstrap();
        expect(bootstrap.state.lmsLiveQuizzes[RESOURCE_KEY].ui).toBeUndefined();

        const reloaded = store.getLmsLiveQuizWorkspace(RESOURCE_KEY);
        expect(reloaded.ui).toBeUndefined();
        expect(reloaded.sessions[0].participants['student-1'].nickname).toBe('Student One');
    });
});
