import { describe, expect, it } from 'vitest';
import { readLmsWhiteboardSource } from './helpers/lms-whiteboard-source.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('lms whiteboard session start', () => {
    it('preserves local session meta against stale forceRemote applies', () => {
        const workspace = readSource('assets/js/pages/lms-whiteboard-workspace-runtime.js');
        expect(workspace).toContain('function shouldKeepLocalLmsWhiteboardSessionMeta');
        const applyBlock = workspace.match(/function applyLmsWhiteboardWorkspace[\s\S]*?^}/m)?.[0] || '';
        expect(applyBlock).toContain('keepLocalSessionMeta');
        expect(applyBlock).toMatch(/if \(!keepLocalSessionMeta\) \{[\s\S]*sessionActive/);
    });

    it('syncs session start/end immediately so students leave the wait screen', () => {
        const workspace = readSource('assets/js/pages/lms-whiteboard-workspace-runtime.js');
        const saveBlock = workspace.match(/function saveLmsWhiteboardChange[\s\S]*?^}/m)?.[0] || '';
        expect(saveBlock).toContain("reason === 'session-start'");
        expect(saveBlock).toContain("reason === 'session-end'");
        expect(saveBlock).toContain('immediateSessionReason');

        const startBlock = workspace.match(/function startLmsWhiteboardSession[\s\S]*?^}/m)?.[0] || '';
        const endBlock = workspace.match(/function endLmsWhiteboardSession[\s\S]*?^}/m)?.[0] || '';
        expect(startBlock).toContain("saveLmsWhiteboardChange(resourceKey, 'session-start', { immediate: true })");
        expect(endBlock).toContain("saveLmsWhiteboardChange(resourceKey, 'session-end', { immediate: true })");
    });

    it('polls while students wait for instructor to start the session', () => {
        const workspace = readSource('assets/js/pages/lms-whiteboard-workspace-runtime.js');
        const runtime = readLmsWhiteboardSource();
        expect(workspace).toContain('function scheduleLmsWhiteboardSessionWaitPoll');
        expect(workspace).toContain('LMS_WHITEBOARD_SESSION_WAIT_POLL_MS');
        expect(runtime).toContain('scheduleLmsWhiteboardSessionWaitPoll(canonicalKey)');
        expect(runtime).toContain('The whiteboard session has not started yet.');
    });
});
