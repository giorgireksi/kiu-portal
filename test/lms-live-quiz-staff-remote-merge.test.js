import { describe, expect, it } from 'vitest';

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

function shouldApplyRemoteLmsLiveQuizWorkspace(localWorkspace = {}, remoteWorkspace = {}, options = {}) {
    if (!remoteWorkspace || typeof remoteWorkspace !== 'object') return false;
    if (!localWorkspace || typeof localWorkspace !== 'object') return true;
    if (options.forceMergeParticipants === true) return false;
    const localPending = Boolean(localWorkspace.ui?.syncing || localWorkspace.ui?.dirty);
    if (localPending) {
        if (options.forceRemote === true) {
            return isRemoteLmsLiveQuizWorkspaceNewer(localWorkspace, remoteWorkspace);
        }
        return false;
    }
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
});