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
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function isRemoteLmsLiveQuizWorkspaceNewer(localWorkspace = {}, remoteWorkspace = {}) {
    const getAt = (workspace = {}) => {
        const raw = workspace?.updatedAt || workspace?.ui?.localUpdatedAt || 0;
        if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
        const parsed = Date.parse(String(raw || ''));
        return Number.isFinite(parsed) ? parsed : 0;
    };
    const localAt = Math.max(Number(localWorkspace.ui?.localUpdatedAt || 0) || 0, getAt(localWorkspace));
    const remoteAt = getAt(remoteWorkspace);
    return remoteAt > localAt;
}

function countLmsLiveQuizContent(workspace = {}) {
    const sessions = Array.isArray(workspace?.sessions) ? workspace.sessions : [];
    return {
        questions: sessions.reduce((total, session) => total + (Array.isArray(session?.questions) ? session.questions.length : 0), 0),
        sessions: sessions.length
    };
}

function getLmsLiveWorkspaceUpdatedAtMs(workspace = {}) {
    const raw = workspace?.updatedAt || workspace?.ui?.localUpdatedAt || 0;
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
    const parsed = Date.parse(String(raw || ''));
    return Number.isFinite(parsed) ? parsed : 0;
}

function countLmsLiveQuizAnswers(workspace = {}) {
    const sessions = Array.isArray(workspace?.sessions) ? workspace.sessions : [];
    return sessions.reduce((total, session) => {
        const participants = session?.participants && typeof session.participants === 'object'
            ? session.participants
            : {};
        return total + Object.values(participants).reduce((answerTotal, participant) => {
            const answers = participant?.answers && typeof participant.answers === 'object'
                ? participant.answers
                : {};
            return answerTotal + Object.keys(answers).length;
        }, 0);
    }, 0);
}

function shouldApplyRemoteLmsLiveQuizWorkspace(localWorkspace = {}, remoteWorkspace = {}, options = {}) {
    if (!remoteWorkspace || typeof remoteWorkspace !== 'object') return false;
    if (!localWorkspace || typeof localWorkspace !== 'object') return true;
    if (options.forceMergeParticipants === true) return false;
    const syncReason = String(options.syncReason || localWorkspace.ui?.lastStructuralReason || '').trim();
    const allowExtraRemoteSessions = syncReason === 'session-created';
    const localContent = countLmsLiveQuizContent(localWorkspace);
    const remoteContent = countLmsLiveQuizContent(remoteWorkspace);
    const localAnswers = countLmsLiveQuizAnswers(localWorkspace);
    const remoteAnswers = countLmsLiveQuizAnswers(remoteWorkspace);
    const localPending = Boolean(localWorkspace.ui?.syncing || localWorkspace.ui?.dirty);
    const localAt = Math.max(
        Number(localWorkspace.ui?.localUpdatedAt || 0) || 0,
        getLmsLiveWorkspaceUpdatedAtMs(localWorkspace)
    );
    const remoteAt = getLmsLiveWorkspaceUpdatedAtMs(remoteWorkspace);
    if (!allowExtraRemoteSessions && remoteContent.sessions > localContent.sessions) return false;
    if (localPending) {
        if (options.forceRemote === true) {
            if (!allowExtraRemoteSessions && remoteContent.sessions > localContent.sessions) return false;
            return isRemoteLmsLiveQuizWorkspaceNewer(localWorkspace, remoteWorkspace);
        }
        return false;
    }
    if (localAt > remoteAt && remoteContent.questions > localContent.questions) return false;
    if (remoteAnswers > localAnswers) return true;
    if (localContent.questions > 0 && remoteContent.questions === 0) return false;
    if (localContent.sessions > 0 && remoteContent.sessions === 0) return false;
    if (localAt > remoteAt && remoteContent.questions <= localContent.questions && remoteAnswers <= localAnswers) return false;
    if (options.forceRemote === true) return true;
    return true;
}

describe('LMS live quiz staff remote merge guards', () => {
    it('blocks stale remote snapshots while local staff edits are pending', () => {
        const localWorkspace = {
            updatedAt: '2026-06-04T20:00:05.000Z',
            ui: { dirty: true, localUpdatedAt: Date.parse('2026-06-04T20:00:05.000Z') },
            sessions: [{
                id: 's1',
                status: 'live',
                questions: [{ id: 'q1', state: 'paused' }],
                participants: { 'student-1': { answers: { q1: { selectedOption: 1 } } } }
            }]
        };
        const remoteWorkspace = {
            updatedAt: '2026-06-04T20:00:00.000Z',
            sessions: [{
                id: 's1',
                status: 'live',
                questions: [{ id: 'q1', state: 'showing' }],
                participants: { 'student-1': { answers: { q1: { selectedOption: 1 } } } }
            }]
        };
        expect(shouldApplyRemoteLmsLiveQuizWorkspace(localWorkspace, remoteWorkspace, { forceRemote: true })).toBe(false);
    });

    it('accepts newer remote snapshots after staff sync completes', () => {
        const localWorkspace = {
            updatedAt: '2026-06-04T20:00:01.000Z',
            ui: { dirty: true, localUpdatedAt: Date.parse('2026-06-04T20:00:01.000Z') },
            sessions: [{ id: 's1', questions: [{ id: 'q1', state: 'paused' }], participants: {} }]
        };
        const remoteWorkspace = {
            updatedAt: '2026-06-04T20:00:10.000Z',
            sessions: [{ id: 's1', questions: [{ id: 'q1', state: 'paused' }], participants: {} }]
        };
        expect(shouldApplyRemoteLmsLiveQuizWorkspace(localWorkspace, remoteWorkspace, { forceRemote: true })).toBe(true);
    });

    it('preserves local queue structure when remote echo is stale during structural sync', () => {
        const workspaceSource = readLmsLiveQuizWorkspaceRuntime();

        expect(workspaceSource).toContain('const LMS_LIVE_QUEUE_STRUCTURAL_REASONS = new Set([');
        expect(workspaceSource).toContain("'session-deleted'");
        expect(workspaceSource).toContain("'session-created'");
        expect(workspaceSource).toContain('remoteContent.sessions > localContent.sessions');
        expect(workspaceSource).toContain('function preserveLocalLmsLiveQuizSessionList');
        expect(workspaceSource).toContain('syncGeneration');
        expect(workspaceSource).toContain('LMS_LIVE_STRUCTURAL_SYNC_ECHO_MS');
        expect(workspaceSource).toContain('function getLmsLiveQuizQueueSignatureFromWorkspace(workspace = {})');
        expect(workspaceSource).toContain('function preserveLocalLmsLiveQuizQueueStructure(localWorkspace = {}, remoteWorkspace = {})');

        const applyBlock = workspaceSource.match(/function applyLmsLiveQuizWorkspace\([\s\S]*?\n\}/)?.[0] || '';
        expect(applyBlock).toContain('queueStructural');
        expect(applyBlock).toContain('preserveLocalLmsLiveQuizQueueStructure(localWorkspace, incomingWorkspace)');
        expect(applyBlock).toMatch(/localQueueSig !== remoteQueueSig/);
        expect(applyBlock).not.toMatch(/localQueueSig && remoteQueueSig && localQueueSig !== remoteQueueSig/);

        const syncBlock = workspaceSource.match(/function runImmediateLmsLiveQuizSync\([\s\S]*?\n\}/)?.[0] || '';
        expect(syncBlock).toContain('queueStructural: Boolean(options.queueStructural)');
        expect(syncBlock).toContain('LMS_LIVE_QUEUE_STRUCTURAL_REASONS.has(reason)');
    });

    it('blocks stale remote with more sessions and more answers when timestamps are equal', () => {
        const localWorkspace = {
            updatedAt: '2026-06-09T20:00:10.000Z',
            ui: { localUpdatedAt: Date.parse('2026-06-09T20:00:10.000Z') },
            sessions: [{
                id: 's1',
                questions: [],
                participants: { 'student-a': { answers: { q1: { selectedOption: 0 } } } }
            }]
        };
        const remoteWorkspace = {
            updatedAt: '2026-06-09T20:00:10.000Z',
            sessions: [
                {
                    id: 's1',
                    questions: [],
                    participants: { 'student-a': { answers: { q1: { selectedOption: 0 }, q2: { selectedOption: 1 } } } }
                },
                { id: 's2', questions: [], participants: {} }
            ]
        };
        expect(shouldApplyRemoteLmsLiveQuizWorkspace(localWorkspace, remoteWorkspace, { forceRemote: true })).toBe(false);
    });

    it('blocks stale remote with more sessions when local staff deleted a session', () => {
        const localWorkspace = {
            updatedAt: '2026-06-09T20:00:10.000Z',
            ui: { localUpdatedAt: Date.parse('2026-06-09T20:00:10.000Z') },
            sessions: [{ id: 's1', questions: [], participants: {} }]
        };
        const remoteWorkspace = {
            updatedAt: '2026-06-09T20:00:00.000Z',
            sessions: [
                { id: 's1', questions: [], participants: {} },
                { id: 's2', questions: [], participants: {} }
            ]
        };
        expect(shouldApplyRemoteLmsLiveQuizWorkspace(localWorkspace, remoteWorkspace, { forceRemote: true })).toBe(false);
    });

    it('blocks stale remote with more questions when local staff delete is newer', () => {
        const localWorkspace = {
            updatedAt: '2026-06-09T20:00:10.000Z',
            ui: { localUpdatedAt: Date.parse('2026-06-09T20:00:10.000Z') },
            sessions: [{ id: 's1', status: 'live', questions: [], participants: {} }]
        };
        const remoteWorkspace = {
            updatedAt: '2026-06-09T20:00:00.000Z',
            sessions: [{ id: 's1', status: 'live', questions: [{ id: 'q1', state: 'showing' }], participants: {} }]
        };
        expect(shouldApplyRemoteLmsLiveQuizWorkspace(localWorkspace, remoteWorkspace, { forceRemote: true })).toBe(false);
    });
});