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
const lmsLiveQuizService = require('../backend/platform/domains/lms-live-quiz-service.js');

function buildLiveWorkspace() {
    const questionId = 'q1';
    const sessionId = 'session-live-1';
    return {
        sessions: [{
            id: sessionId,
            status: 'live',
            currentQuestionIndex: 0,
            questions: [{
                id: questionId,
                text: '2 + 2 = ?',
                options: ['3', '4', '5', '6'],
                correctOption: 1,
                timeLimit: 45,
                state: 'showing',
                showVersion: 1,
                activatedAt: new Date().toISOString()
            }],
            participants: {
                'student-a': {
                    id: 'student-a',
                    nickname: 'Student A',
                    answers: {
                        [questionId]: {
                            selectedOption: 1,
                            showVersion: 1,
                            answeredAt: new Date().toISOString(),
                            correct: true,
                            score: 900
                        }
                    },
                    score: 900
                }
            }
        }]
    };
}

describe('LMS live quiz merge service', () => {
    it('drops sessions omitted from staff submission (session deletion)', () => {
        const existing = {
            sessions: [
                { id: 's1', title: 'Keep', participants: {} },
                { id: 's2', title: 'Delete', participants: { 'student-a': { answers: { q1: { selectedOption: 0 } } } } }
            ]
        };
        const submitted = {
            sessions: [existing.sessions[0]]
        };
        const merged = lmsLiveQuizService.mergeStaffLiveQuizWorkspace(existing, submitted);
        expect(merged.sessions.map(session => session.id)).toEqual(['s1']);
    });

    it('preserves server participant answers when staff overwrites workspace', () => {
        const existing = buildLiveWorkspace();
        const submitted = {
            sessions: [{
                ...existing.sessions[0],
                title: 'Updated title',
                participants: {}
            }]
        };
        const merged = lmsLiveQuizService.mergeStaffLiveQuizWorkspace(existing, submitted);
        const participant = merged.sessions[0].participants['student-a'];
        expect(participant.answers.q1.selectedOption).toBe(1);
        expect(merged.sessions[0].title).toBe('Updated title');
    });

    it('auto-provisions a student participant when answering live', () => {
        const existing = {
            sessions: [{
                id: 'session-live-1',
                status: 'live',
                currentQuestionIndex: 0,
                questions: [{
                    id: 'q1',
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
        const merged = lmsLiveQuizService.submitStudentLiveQuizAnswer(
            existing,
            { sessionId: 'session-live-1', questionId: 'q1', selectedOption: 0 },
            { actorUserId: 'student-b' },
            {
                getActorUserId: (session) => String(session?.actorUserId || '').trim(),
                getLiveQuizActorName: () => 'Student B'
            }
        );
        expect(merged.workspace.sessions[0].participants['student-b'].answers.q1.selectedOption).toBe(0);
    });

    it('keeps participant membership when a student joins live quiz', () => {
        const existing = {
            sessions: [{
                id: 'session-live-1',
                status: 'live',
                currentQuestionIndex: 0,
                questions: [{
                    id: 'q1',
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
        const merged = lmsLiveQuizService.submitStudentLiveQuizJoin(
            existing,
            { sessionId: 'session-live-1', nickname: 'Student B' },
            { actorUserId: 'student-b' },
            {
                getActorUserId: (session) => String(session?.actorUserId || '').trim(),
                getLiveQuizActorName: () => 'Student B'
            }
        );
        const participant = merged.workspace.sessions[0].participants['student-b'];
        expect(participant.nickname).toBe('Student B');
        expect(participant.answers).toEqual({});
        expect(participant.joinedAt).toBeTruthy();
        expect(participant.lastSeenAt).toBeTruthy();
    });

    it('counts answers across participants', () => {
        const workspace = buildLiveWorkspace();
        expect(lmsLiveQuizService.countLiveQuizAnswers(workspace)).toBe(1);
    });
});
