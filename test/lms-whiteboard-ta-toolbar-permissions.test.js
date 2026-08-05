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

describe('lms whiteboard TA toolbar permissions', () => {
    it('resolves live edit rights instead of stale bind-time canEdit', () => {
        const runtime = readLmsWhiteboardSource();

        expect(runtime).toContain('function resolveLmsWhiteboardLiveEditRights');
        expect(runtime).toContain('canEditLmsWhiteboard(key)');
        expect(runtime).toContain('canManageLmsWhiteboard(key)');
    });

    it('uses live rights in command-bar and sidebar tool click handlers', () => {
        const runtime = readLmsWhiteboardSource();
        const hudBlock = runtime.match(/function bindLmsWhiteboardHudControls[\s\S]*?(?=\nfunction )/)?.[0] || '';
        const bindBlock = runtime.match(/function bindLmsWhiteboardSection[\s\S]*?(?=\nfunction )/)?.[0] || '';

        expect(hudBlock).toContain('resolveLmsWhiteboardLiveEditRights(boundToken)');
        expect(hudBlock).toContain("closest?.('button[data-lms-whiteboard-tool]')");
        expect(bindBlock).toContain('resolveLmsWhiteboardLiveEditRights(boundToken)');
        expect(bindBlock).toContain("closest?.('button[data-lms-whiteboard-tool]')");
    });

    it('resyncs active tool buttons after section render', () => {
        const runtime = readLmsWhiteboardSource();
        const renderBlock = runtime.slice(runtime.indexOf('function renderLmsWhiteboardSection'));

        expect(renderBlock).toContain('setLmsWhiteboardTool(LMS_WHITEBOARD_UI.tool || \'select\')');
        expect(runtime).toContain("querySelectorAll('button[data-lms-whiteboard-tool]')");
    });

    it('syncs command bar readonly state when session chrome updates', () => {
        const runtime = readLmsWhiteboardSource();
        const chromeBlock = runtime.match(/function updateLmsWhiteboardSessionChrome[\s\S]*?(?=\nfunction )/)?.[0] || '';

        expect(chromeBlock).toContain('syncLmsWhiteboardToolEditState(shell, canEdit)');
        expect(runtime).toContain('[data-lms-whiteboard-command-bar]');
    });

    it('keeps clear undo and redo clickable when command bar is readonly', () => {
        const css = readSource('assets/css/lux-page-bare-lite.css');
        expect(css).toContain('.lms-whiteboard-command-bar.is-readonly');
        expect(css).toContain('data-lms-whiteboard-tool="select"');
    });

    it('gates clear-board with live canManage and null-guards workspace', () => {
        const runtime = readLmsWhiteboardSource();
        const hudActionBlock = runtime.match(/function runLmsWhiteboardHudAction[\s\S]*?(?=\nfunction )/)?.[0] || '';
        const workspace = readSource('assets/js/pages/lms-whiteboard-workspace-runtime.js');
        const clearBlock = workspace.match(/function clearLmsWhiteboardBoard[\s\S]*?(?=\nfunction |$)/)?.[0] || '';

        expect(hudActionBlock).toContain('canManageLmsWhiteboard(key)');
        expect(hudActionBlock).toContain('You do not have permission to clear the board.');
        expect(clearBlock).toContain('if (!workspace) return;');
    });

    it('bumps whiteboard cache tokens to 20260708-wb-shapes-v4', () => {
        const html = readSource('lms.html');

        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('20260708-wb-shapes-v4');
        expect(html).not.toContain('lms-whiteboard-shape-runtime.js');
    });
});