import { describe, expect, it } from 'vitest';
import { readLmsWhiteboardSource } from './helpers/lms-whiteboard-source.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    if (relativePath === 'assets/js/pages/lms-whiteboard-runtime.js') {
        return [
            'lms-whiteboard-runtime.js',
            'lms-whiteboard-model.js',
            'lms-whiteboard-chrome-runtime.js',
            'lms-whiteboard-session-runtime.js',
            'lms-whiteboard-selection-runtime.js',
            'lms-whiteboard-workspace-runtime.js'
        ].map((file) => readFileSync(join(process.cwd(), 'assets/js/pages', file), 'utf8')).join('\n');
    }
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS whiteboard wave 2 collaboration', () => {
    it('exposes student ops sync and signal api helpers', () => {
        const api = readSource('assets/js/app/api.js')
            + readSource('assets/js/app/api-lms-portal-runtime.js');
        const workspace = readSource('assets/js/pages/lms-whiteboard-workspace-runtime.js');

        expect(api).toContain('async function submitLmsWhiteboardOps');
        expect(api).toContain('async function submitLmsWhiteboardSignal');
        expect(workspace).toContain('function queueLmsWhiteboardOpsSync');
        expect(workspace).toContain('function endLmsWhiteboardSession');
    });

    it('registers ephemeral whiteboard signal route', () => {
        const routes = readSource('backend/platform/routes/lms-whiteboard-routes.js');

        expect(routes).toContain("app.post('/api/lms/whiteboards/:resourceKey/signal'");
        expect(routes).toContain("type: 'lms-whiteboard:signal'");
    });

    it('handles whiteboard signals in auth realtime bridge', () => {
        const auth = readSource('assets/js/app/auth.js');

        expect(auth).toContain("case 'lms-whiteboard:signal':");
        expect(auth).toContain('handleLmsWhiteboardRealtimeSignal');
    });

    it('ships collab runtime with follow, laser, and cursors', () => {
        const collab = readSource('assets/js/pages/lms-whiteboard-collab-runtime.js');

        expect(collab).toContain('function handleLmsWhiteboardRealtimeSignal');
        expect(collab).toContain('function drawLmsWhiteboardCollabOverlay');
        expect(collab).toContain('followInstructor');
        expect(collab).toContain('presentView');
        expect(collab).toContain("signalType: 'laser'");
    });

    it('gates collab signals and blocks repeats after 403', () => {
        const collab = readSource('assets/js/pages/lms-whiteboard-collab-runtime.js');

        expect(collab).toContain('signalsBlockedByKey');
        expect(collab).toContain('function canEmitLmsWhiteboardCollabSignals');
        expect(collab).toContain('shouldSyncLmsWhiteboardWorkspace');
        expect(collab).toContain('canAccessLmsLiveQuizScope');
        expect(collab).toContain('signalsBlockedByKey[canonicalKey] = true');
    });

    it('avoids redundant realtime bootstrap on whiteboard render', () => {
        const runtime = readLmsWhiteboardSource();

        expect(runtime).toContain('function renderLmsWhiteboardSection');
        expect(runtime).not.toContain('bootstrapKiuRealtimeBridge()');
    });

    it('scopes eraser to author unless staff and passes element ops', () => {
        const runtime = readLmsWhiteboardSource();

        expect(runtime).toContain('!== actorId');
        expect(runtime).toContain("op: { type: 'remove'");
        expect(runtime).toContain("op: { element:");
        expect(runtime).toContain('data-lms-whiteboard-action="end-session"');
    });

    it('tests mergeStudentWhiteboardOps in sync domain', () => {
        const syncTest = readSource('test/lms-whiteboard-sync.test.js');

        expect(syncTest).toContain('mergeStudentWhiteboardOps');
    });

    it('bumps wave2 cache bust tokens in lms.html', () => {
        const html = readSource('lms.html');

        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('lms-whiteboard-collab-runtime.js?v=20260708-wb-shapes-v4');
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('lms-whiteboard-workspace-runtime.js?v=20260710-personal-autosave1');
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('lms-whiteboard-runtime.js?v=20260808-overallperf1');
    });
});