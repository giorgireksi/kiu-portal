import { describe, expect, it } from 'vitest';
import { readLmsWhiteboardSource } from './helpers/lms-whiteboard-source.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS whiteboard shell binding ux9', () => {
    it('resolves active shell in content area or fullscreen body', () => {
        const runtime = readLmsWhiteboardSource();

        expect(runtime).toContain('function getActiveLmsWhiteboardShell');
        expect(runtime).toContain('function getLmsWhiteboardShells');
        expect(runtime).toContain('function cleanupLmsWhiteboardShellsBeforeRender');
        expect(runtime).toContain('cleanupLmsWhiteboardShellsBeforeRender(canonicalKey)');
        expect(runtime).toContain('getActiveLmsWhiteboardShell(canonicalKey)');
        expect(runtime).toContain('dataset.lmsWhiteboardBound');
        expect(runtime).toContain('dataset.lmsWhiteboardFullscreenMounted');
    });

    it('uses active shell for refresh and fullscreen toggle', () => {
        const runtime = readLmsWhiteboardSource();

        expect(runtime).toContain('const shell = getActiveLmsWhiteboardShell(resourceKey)');
        expect(runtime).toContain('getActiveLmsWhiteboardShell(LMS_WHITEBOARD_UI.boundKey)');
    });

    it('guards collab action binding', () => {
        const collab = readSource('assets/js/pages/lms-whiteboard-collab-runtime.js');

        expect(collab).toContain('lmsWhiteboardCollabBound');
    });
});