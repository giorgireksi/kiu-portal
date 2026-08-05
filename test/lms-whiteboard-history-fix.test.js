import { describe, expect, it } from 'vitest';
import { readLmsWhiteboardSource, readLmsWhiteboardSessionRuntime } from './helpers/lms-whiteboard-source.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('lms whiteboard history fix', () => {
    it('resets history stacks without pushing an initial snapshot', () => {
        const history = readSource('assets/js/pages/lms-whiteboard-history-runtime.js');
        const resetBlock = history.match(/function resetLmsWhiteboardHistory[\s\S]*?^}/m)?.[0] || '';

        expect(resetBlock).toContain("LMS_WHITEBOARD_HISTORY[key] = { past: [], future: [], recording: false }");
        expect(resetBlock).not.toContain('pushLmsWhiteboardHistoryState');
        expect(history).not.toContain('function seedLmsWhiteboardHistory');
    });

    it('uses pre-gesture force push and single-entry undo guard', () => {
        const history = readSource('assets/js/pages/lms-whiteboard-history-runtime.js');
        const runtime = readLmsWhiteboardSource();
        const undoBlock = history.match(/function undoLmsWhiteboardHistory[\s\S]*?^}/m)?.[0] || '';
        const gestureBlock = runtime.match(/function recordLmsWhiteboardHistoryGesture[\s\S]*?^}/m)?.[0] || '';

        expect(gestureBlock).toContain('pushLmsWhiteboardHistoryState(resourceKey, { force: true })');
        expect(undoBlock).toContain('history.past.length < 1');
        expect(undoBlock).not.toContain('history.past.length < 2');
        expect(undoBlock).toContain('history.past.pop()');
    });

    it('restores history with repaint helper and deferred sync refresh', () => {
        const history = readSource('assets/js/pages/lms-whiteboard-history-runtime.js');
        const restoreBlock = history.match(/function restoreLmsWhiteboardHistoryState[\s\S]*?^}/m)?.[0] || '';
        const session = readLmsWhiteboardSessionRuntime();
        const runtime = readLmsWhiteboardSource();

        expect(restoreBlock).toContain('deferUiRefresh: true');
        expect(restoreBlock).toContain('repaintLmsWhiteboardAfterHistoryChange(key)');
        expect(restoreBlock).not.toContain('refreshLmsWhiteboardUi');
        expect(session).toContain('function repaintLmsWhiteboardAfterHistoryChange');
        expect(session).toContain('repaintLmsWhiteboardAfterHistoryChange');
    });

    it('threads deferUiRefresh through backend save queue', () => {
        const workspace = readSource('assets/js/pages/lms-whiteboard-workspace-runtime.js');
        const saveBlock = workspace.match(/function saveLmsWhiteboardChange[\s\S]*?^}/m)?.[0] || '';
        const queueBlock = workspace.match(/function queueLmsWhiteboardBackendSync[\s\S]*?^}/m)?.[0] || '';

        expect(saveBlock).toContain('queueLmsWhiteboardBackendSync(canonicalKey, reason, options)');
        expect(queueBlock).toContain('runImmediateLmsWhiteboardSync(canonicalKey, reason, options)');
    });

    it('does not re-seed history on every remote apply', () => {
        const workspace = readSource('assets/js/pages/lms-whiteboard-workspace-runtime.js');
        const applyBlock = workspace.match(/function applyLmsWhiteboardWorkspace[\s\S]*?^}/m)?.[0] || '';

        expect(applyBlock).not.toContain('seedLmsWhiteboardHistory');
    });

    it('stops propagation on stage action and shell handlers', () => {
        const runtime = readLmsWhiteboardSource();

        expect(runtime).toContain('lmsWhiteboardStageActionsBound');
        expect(runtime).toContain('.lms-whiteboard-stage-actions');
        expect(runtime).toContain('event.stopPropagation()');
    });
});
