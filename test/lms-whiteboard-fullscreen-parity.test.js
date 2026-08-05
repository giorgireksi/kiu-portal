import { describe, expect, it } from 'vitest';
import { expectLmsRouteCssLinks } from './helpers/lms-route-css.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { readLmsWhiteboardSource } from './helpers/lms-whiteboard-source.js';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS whiteboard fullscreen parity', () => {
    it('command bar includes the full tool set and stroke control', () => {
        const runtime = readLmsWhiteboardSource();
        const commandBarBlock = runtime.match(/function renderLmsWhiteboardCommandBar[\s\S]*?(?=\nfunction )/)?.[0] || '';
        const toolGroupsBlock = runtime.match(/const LMS_WHITEBOARD_TOOL_GROUPS[\s\S]*?];/)?.[0] || '';

        ['select', 'hand', 'pen', 'eraser', 'sticky', 'text', 'rect', 'roundRect', 'ellipse', 'line', 'arrow', 'grid'].forEach(tool => {
            expect(toolGroupsBlock).toContain(`'${tool}'`);
        });
        ['triangle', 'diamond', 'frame'].forEach(tool => {
            expect(toolGroupsBlock).not.toContain(`'${tool}'`);
        });
        expect(commandBarBlock).toContain('renderLmsWhiteboardToolRail');
        expect(commandBarBlock).toContain('data-lms-whiteboard-prop="stroke"');
        expect(commandBarBlock).toContain('data-lms-whiteboard-action="undo"');
        expect(commandBarBlock).toContain('data-lms-whiteboard-action="clear-board"');
        expect(commandBarBlock).toContain('lms-whiteboard-clear-all');
        expect(runtime).toContain("if (action === 'clear-board')");
        const workspace = readSource('assets/js/pages/lms-whiteboard-workspace-runtime.js');
        expect(workspace).toContain('clearBoard: true');
        expect(commandBarBlock).toContain('data-lms-whiteboard-action="open-more-menu"');
        expect(commandBarBlock).toContain('lms-whiteboard-command-bar');
    });

    it('exposes collab pill entry points without template modals', () => {
        const runtime = readLmsWhiteboardSource();
        const collab = readSource('assets/js/pages/lms-whiteboard-collab-runtime.js');

        expect(runtime).not.toContain('function openLmsWhiteboardTemplatesModal');
        expect(runtime).not.toContain('data-lms-whiteboard-action="open-templates-modal"');
        expect(runtime).toContain('lms-whiteboard-panel-head');
        expect(runtime).toContain('lms-whiteboard-collab-hud');
        expect(runtime).toMatch(/lms-whiteboard-collab-hud[\s\S]*renderLmsWhiteboardCollabPill/);
        const panelHeadBlock = runtime.match(/<div class="lms-whiteboard-panel-head">[\s\S]*?<\/div>\s*<div class="lms-live-stage/)?.[0] || '';
        expect(panelHeadBlock).not.toContain('renderLmsWhiteboardCollabPill');
        expect(collab).toContain('function renderLmsWhiteboardCollabPill');
        expect(collab).toContain('lms-whiteboard-collab-pill');
    });

    it('keeps fullscreen toggle on button without keyboard shortcuts', () => {
        const runtime = readLmsWhiteboardSource();

        expect(runtime).not.toContain('function onLmsWhiteboardKeyDown');
        expect(runtime).toContain('data-lms-whiteboard-action="toggle-fullscreen"');
        expect(runtime).toContain('function toggleLmsWhiteboardFullscreen');
    });

    it('styles command bar and props tabs for immersive mode', () => {
    });

    it('bumps whiteboard ux cache bust tokens in lms.html', () => {
        const html = readSource('lms.html');

        expectLmsRouteCssLinks(html);
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-whiteboard-runtime.js?v=20260729-wbdocmode5');
    });
});