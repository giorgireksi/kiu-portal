import { describe, expect, it } from 'vitest';
import { expectLmsRouteCssLinks } from './helpers/lms-route-css.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS whiteboard fullscreen and pan', () => {
    it('exposes immersive fullscreen helpers', () => {
        const runtime = readSource('assets/js/pages/lms-whiteboard-runtime.js');

        expect(runtime).toContain('function syncLmsWhiteboardFocusChrome');
        expect(runtime).toContain('function toggleLmsWhiteboardFullscreen');
        expect(runtime).toContain('function exitLmsWhiteboardFullscreen');
        expect(runtime).toContain('window.toggleLmsWhiteboardFullscreen = toggleLmsWhiteboardFullscreen');
        expect(runtime).toContain('kiu-lms-whiteboard-focus-active');
        expect(runtime).toContain('data-lms-whiteboard-action="toggle-fullscreen"');
        expect(runtime).toContain('lms-whiteboard-command-bar');
        expect(runtime).toContain('lms-whiteboard-command-exit');
        expect(runtime).toContain('function updateLmsWhiteboardFullscreenUi');
        expect(runtime).toContain('data-lms-whiteboard-action="zoom-fit"');
        expect(runtime).toContain('function fitLmsWhiteboardZoomToContent');
        expect(runtime).toContain("querySelector('[data-lms-whiteboard-zoom-label]')?.addEventListener('dblclick'");
    });

    it('supports right-click pan on the canvas', () => {
        const runtime = readSource('assets/js/pages/lms-whiteboard-runtime.js');
        const pointer = readSource('assets/js/pages/lms-whiteboard-pointer-runtime.js');
        const pointerBlock = pointer.match(/function onLmsWhiteboardPointerDown[\s\S]*?(?=\nfunction )/)?.[0] || '';

        expect(pointerBlock).toContain('event.button === 2');
        expect(pointerBlock).not.toContain('LMS_WHITEBOARD_UI.spaceHeld');
        expect(pointerBlock).toContain('startLmsWhiteboardPan');
        expect(pointer).toContain("stage.addEventListener('contextmenu', (event) => event.preventDefault())");
        expect(runtime).toContain('function showLmsWhiteboardContextMenu');
        expect(runtime).not.toContain('function onLmsWhiteboardKeyUp');
        expect(runtime).not.toContain("key === ' '");
    });

    it('exits fullscreen when leaving the whiteboard tab', () => {
        const tabs = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');

        expect(tabs).toMatch(/leavingWhiteboard[\s\S]*exitLmsWhiteboardFullscreen/);
    });

    it('styles immersive fullscreen focus mode', () => {
    });

    it('mounts the whiteboard shell on document.body during fullscreen', () => {
        const runtime = readSource('assets/js/pages/lms-whiteboard-runtime.js');

        expect(runtime).toContain('function mountLmsWhiteboardFullscreenShell');
        expect(runtime).toContain('function restoreLmsWhiteboardFullscreenShell');
        expect(runtime).toContain('document.body.appendChild(shell)');
        expect(runtime).toContain('lmsWhiteboardFullscreenMounted');
    });

    it('schedules layout recovery after fullscreen toggle', () => {
        const runtime = readSource('assets/js/pages/lms-whiteboard-runtime.js');

        expect(runtime).toMatch(/toggleLmsWhiteboardFullscreen[\s\S]*?repaintLmsWhiteboardAfterFullscreenLayout\(resourceKey, shell\)/);
        expect(runtime).toMatch(/repaintLmsWhiteboardAfterFullscreenLayout[\s\S]*?scheduleLmsWhiteboardLayoutRecovery\(targetShell/);
    });

    it('opens props dock by default and syncs toggle-props buttons in fullscreen', () => {
        const runtime = readSource('assets/js/pages/lms-whiteboard-runtime.js');

        expect(runtime).toContain('function syncLmsWhiteboardPropsToggleUi');
        expect(runtime).toMatch(/toggleLmsWhiteboardFullscreen[\s\S]*shell\.classList\.add\('is-props-open'\)/);
        expect(runtime).toMatch(/syncLmsWhiteboardPropsToggleUi[\s\S]*querySelectorAll\('\[data-lms-whiteboard-action="toggle-props"\]'\)/);
        expect(runtime).toMatch(/updateLmsWhiteboardFullscreenUi[\s\S]*syncLmsWhiteboardPropsToggleUi/);
    });

    it('resolves body-mounted shell for chrome offset in focus mode', () => {
        const tabs = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');

        expect(tabs).toMatch(/syncLmsWorkspaceChromeOffset[\s\S]*?kiu-lms-whiteboard-focus-active[\s\S]*?lms-whiteboard-fullscreen-mounted/);
    });

    it('bumps fullscreen pan cache bust tokens in lms.html', () => {
        const html = readSource('lms.html');

        expectLmsRouteCssLinks(html);
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-whiteboard-runtime.js?v=20260719-wbchrome1');
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-whiteboard-pointer-runtime.js?v=20260719-wbchrome1');
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-whiteboard-paint-runtime.js?v=20260719-wbchrome1');
        expect(html).toContain('assets/js/pages/lms-classroom-tabs-runtime.js?v=20260715-lms-lazy7');
    });
});