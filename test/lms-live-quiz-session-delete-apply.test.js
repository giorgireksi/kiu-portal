import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function cloneState(value) {
    return JSON.parse(JSON.stringify(value));
}

function mergeRemoteLmsLiveParticipantAnswers(localParticipant = {}, remoteParticipant = {}) {
    const merged = { ...localParticipant, ...remoteParticipant };
    const localAnswers = localParticipant?.answers && typeof localParticipant.answers === 'object'
        ? localParticipant.answers
        : {};
    const remoteAnswers = remoteParticipant?.answers && typeof remoteParticipant.answers === 'object'
        ? remoteParticipant.answers
        : {};
    merged.answers = { ...localAnswers };
    Object.entries(remoteAnswers).forEach(([questionId, remoteAnswer]) => {
        const localAnswer = merged.answers[questionId];
        if (!localAnswer) {
            merged.answers[questionId] = remoteAnswer;
            return;
        }
        merged.answers[questionId] = {
            ...localAnswer,
            ...remoteAnswer,
            selectedOption: localAnswer.selectedOption ?? remoteAnswer.selectedOption
        };
    });
    return merged;
}

function preserveLocalLmsLiveQuizSessionList(localWorkspace = {}, remoteWorkspace = {}) {
    const localSessions = Array.isArray(localWorkspace.sessions) ? localWorkspace.sessions : [];
    const remoteSessions = Array.isArray(remoteWorkspace.sessions) ? remoteWorkspace.sessions : [];
    if (localSessions.length >= remoteSessions.length) return remoteWorkspace;
    const merged = cloneState(remoteWorkspace);
    merged.sessions = localSessions.map(localSession => {
        const remoteSession = remoteSessions.find(item => String(item?.id || '') === String(localSession?.id || ''));
        const session = cloneState(localSession);
        if (!remoteSession) return session;
        const remoteParticipants = remoteSession?.participants && typeof remoteSession.participants === 'object'
            ? remoteSession.participants
            : {};
        session.participants = session.participants && typeof session.participants === 'object'
            ? { ...session.participants }
            : {};
        Object.entries(remoteParticipants).forEach(([participantId, remoteParticipant]) => {
            const localParticipant = session.participants[participantId];
            session.participants[participantId] = mergeRemoteLmsLiveParticipantAnswers(
                localParticipant || remoteParticipant,
                remoteParticipant
            );
        });
        return session;
    });
    return merged;
}

describe('LMS live quiz session delete apply', () => {
    it('keeps production helper wired into applyLmsLiveQuizWorkspace', () => {
        const workspaceSource = readSource('assets/js/pages/lms-live-quiz-workspace-runtime.js');
        const applyBlock = workspaceSource.match(/function applyLmsLiveQuizWorkspace\([\s\S]*?\n\}/)?.[0] || '';

        expect(workspaceSource).toContain('function preserveLocalLmsLiveQuizSessionList');
        expect(applyBlock).toContain('preserveLocalLmsLiveQuizSessionList(localWorkspace, incomingWorkspace)');
        expect(applyBlock).toContain("syncReason !== 'session-created'");
    });

    it('drops remote-only sessions when local staff deleted a session', () => {
        const localWorkspace = {
            sessions: [{
                id: 's1',
                status: 'live',
                questions: [{ id: 'q1', state: 'showing' }],
                participants: {}
            }]
        };
        const remoteWorkspace = {
            sessions: [
                {
                    id: 's1',
                    status: 'live',
                    questions: [{ id: 'q1', state: 'showing' }],
                    participants: {
                        'student-a': {
                            answers: { q1: { selectedOption: 1, correct: true } },
                            score: 900
                        }
                    }
                },
                {
                    id: 's2',
                    status: 'draft',
                    questions: [],
                    participants: {}
                }
            ]
        };

        const merged = preserveLocalLmsLiveQuizSessionList(localWorkspace, remoteWorkspace);
        expect(merged.sessions.map(session => session.id)).toEqual(['s1']);
        expect(merged.sessions[0].participants['student-a'].answers.q1.selectedOption).toBe(1);
    });
});