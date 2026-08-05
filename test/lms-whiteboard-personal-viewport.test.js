import { describe, expect, it } from 'vitest';
import { readLmsWhiteboardSource } from './helpers/lms-whiteboard-source.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('personal whiteboard per-viewer viewport', () => {
    it('stores camera per userId+resourceKey and never syncs personal collab viewport', () => {
        const runtime = readLmsWhiteboardSource();
        const collab = readSource('assets/js/pages/lms-whiteboard-collab-runtime.js');

        expect(runtime).toContain('function saveLmsWhiteboardLocalViewport');
        expect(runtime).toContain('function loadLmsWhiteboardLocalViewport');
        expect(runtime).toContain('lms-wb-view:');
        expect(runtime).toContain('getLmsWhiteboardViewerId');
        expect(runtime).toMatch(/function bindLmsWhiteboardSection[\s\S]*loadLmsWhiteboardLocalViewport/);
        expect(runtime).toMatch(/function setLmsWhiteboardZoom[\s\S]*saveLmsWhiteboardLocalViewport/);
        expect(readSource('assets/js/pages/lms-whiteboard-pointer-runtime.js'))
            .toMatch(/function onLmsWhiteboardPointerUp[\s\S]*saveLmsWhiteboardLocalViewport/);

        expect(collab).toMatch(/function canEmitLmsWhiteboardCollabSignals[\s\S]*isLmsPersonalBoardKey/);
        expect(collab).toMatch(/function handleLmsWhiteboardRealtimeSignal[\s\S]*viewport[\s\S]*return/);
    });
});
