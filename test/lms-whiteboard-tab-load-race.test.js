import { describe, expect, it } from 'vitest';
import { readLmsWhiteboardSource } from './helpers/lms-whiteboard-source.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('lms whiteboard tab load race', () => {
    it('uses a single backend load owner when opening the whiteboard tab', () => {
        const tabs = readSource('assets/js/pages/lms-classroom-tabs-runtime.js')
            + readSource('assets/js/pages/lms-classroom-tabs-shell-runtime.js');
        const whiteboardTabBlock = tabs.match(/tab === 'whiteboard'[\s\S]*?} else if \(tab === 'members'\)/)?.[0] || '';

        expect(whiteboardTabBlock).toContain("renderLmsWhiteboardSection(tabCourseKey, { skipLoad: true })");
        expect(whiteboardTabBlock).toContain("loadLmsWhiteboardWorkspace(tabCourseKey, { force: true })");
        expect(whiteboardTabBlock).toContain('finalizeLmsWhiteboardSectionRender(tabCourseKey, { fitOnce: true })');
        expect(whiteboardTabBlock).not.toMatch(/renderLmsWhiteboardSection\(tabCourseKey\);\s*\n\s*\} else if \(contentArea\)/);
    });

    it('ignores stale deferred paint callbacks from superseded whiteboard loads', () => {
        const runtime = readLmsWhiteboardSource();
        const workspace = readSource('assets/js/pages/lms-whiteboard-workspace-runtime.js');
        const renderBlock = runtime.match(/let deferPaintForLoad = false;[\s\S]*?const workspace = typeof getLmsWhiteboardWorkspaceSafe/)?.[0] || '';

        expect(workspace).toContain('function isCurrentLmsWhiteboardLoadGeneration');
        expect(renderBlock).toContain('expectedLoadGeneration');
        expect(renderBlock).toContain('isCurrentLmsWhiteboardLoadGeneration(canonicalKey, expectedLoadGeneration)');
    });

    it('skips structural whiteboard renders while a draw gesture is active', () => {
        const runtime = readLmsWhiteboardSource();
        const renderStart = runtime.match(/function renderLmsWhiteboardSection[\s\S]*?const contentArea = document\.getElementById\('lms-content-area'\)/)?.[0] || '';

        expect(renderStart).toContain('isLmsWhiteboardWorkspaceGestureActive(gestureKey)');
        expect(renderStart).toContain('repaintLmsWhiteboardWorkspace(gestureKey)');
    });
});