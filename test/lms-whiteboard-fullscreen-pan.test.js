import { describe, expect, it } from 'vitest';
import { readLmsWhiteboardSource } from './helpers/lms-whiteboard-source.js';
import { expectLmsRouteCssLinks } from './helpers/lms-route-css.js';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS whiteboard fullscreen and pan', () => {
    it('exposes immersive fullscreen helpers', () => {
        const chrome = readSource('assets/js/pages/lms-whiteboard-chrome-runtime.js');
        const runtime = readLmsWhiteboardSource();

        expect(chrome).toContain('function syncLmsWhiteboardFocusChrome');
        expect(chrome).toContain('function toggleLmsWhiteboardFullscreen');
        expect(chrome).toContain('function exitLmsWhiteboardFullscreen');
        expect(chrome).toContain('kiu-lms-whiteboard-focus-active');
        expect(chrome).toContain('data-lms-whiteboard-action="toggle-fullscreen"');
        expect(chrome).toContain('lms-whiteboard-command-bar');
        expect(chrome).toContain('lms-whiteboard-command-exit');
        expect(chrome).toContain('function updateLmsWhiteboardFullscreenUi');
        expect(readSource('assets/js/pages/lms-whiteboard-session-runtime.js')).toContain('data-lms-whiteboard-action="zoom-fit"');
        expect(runtime).toContain('function fitLmsWhiteboardZoomToContent');
        expect(chrome).toContain("querySelector('[data-lms-whiteboard-zoom-label]')?.addEventListener('dblclick'");
    });

    it('supports right-click pan on the canvas', () => {
        const selection = readSource('assets/js/pages/lms-whiteboard-selection-runtime.js');
        const pointer = readSource('assets/js/pages/lms-whiteboard-pointer-runtime.js');
        const pointerBlock = pointer.match(/function onLmsWhiteboardPointerDown[\s\S]*?(?=\nfunction )/)?.[0] || '';

        expect(pointerBlock).toContain('event.button === 2');
        expect(pointerBlock).not.toContain('LMS_WHITEBOARD_UI.spaceHeld');
        expect(pointerBlock).toContain('startLmsWhiteboardPan');
        expect(pointer).toContain("stage.addEventListener('contextmenu', (event) => event.preventDefault())");
        expect(selection).toContain('function showLmsWhiteboardContextMenu');
        expect(pointer).toMatch(/^function startLmsWhiteboardPan\b/m);
        expect(pointer).not.toContain("key === ' '");
    });

    it('exits fullscreen when leaving the whiteboard tab', () => {
        const shell = readSource('assets/js/pages/lms-classroom-tabs-shell-runtime.js');

        expect(shell).toMatch(/leavingWhiteboard[\s\S]*exitLmsWhiteboardFullscreen/);
    });

    it('styles immersive fullscreen focus mode', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(bare).toContain('body.kiu-lms-whiteboard-focus-active .lms-whiteboard-shell.is-fullscreen');
        expect(bare).toContain('body.kiu-lms-whiteboard-focus-active .lms-whiteboard-shell.is-fullscreen .lms-whiteboard-command-bar');
        expect(bare).toContain('body.kiu-lms-whiteboard-focus-active .lms-whiteboard-shell.is-fullscreen.is-props-open .lms-whiteboard-props');
        expect(bare).toContain('data-lms-whiteboard-fullscreen-mounted="1"');
        expect(bare).toContain('--wb-hud-border');
        expect(bare).toMatch(/body\.kiu-lms-whiteboard-focus-active[\s\S]*--wb-hud-border/);
        expect(fouc).toContain('.lms-whiteboard-tools');
        expect(fouc).toContain('.lms-whiteboard-collab-pill');
        expect(fouc).toMatch(/kiu-lms-whiteboard-focus-active[\s\S]*\.lms-whiteboard-tools/);
        expect(bare).toContain('--wb-command-bar-offset');
        expect(bare).toMatch(/body\.kiu-lms-whiteboard-focus-active \.lms-whiteboard-shell\.is-fullscreen \.lms-whiteboard-props[\s\S]*top: var\(--wb-command-bar-offset/);
        expect(bare).toContain('Body-mounted fullscreen shell leaves #lms-content-area');
    });

    it('mounts the whiteboard shell on document.body during fullscreen', () => {
        const chrome = readSource('assets/js/pages/lms-whiteboard-chrome-runtime.js');

        expect(chrome).toContain('function mountLmsWhiteboardFullscreenShell');
        expect(chrome).toContain('function restoreLmsWhiteboardFullscreenShell');
        expect(chrome).toContain('document.body.appendChild(shell)');
        expect(chrome).toContain('lmsWhiteboardFullscreenMounted');
    });

    it('schedules layout recovery after fullscreen toggle', () => {
        const chrome = readSource('assets/js/pages/lms-whiteboard-chrome-runtime.js');

        expect(chrome).toMatch(/toggleLmsWhiteboardFullscreen[\s\S]*?repaintLmsWhiteboardAfterFullscreenLayout\(resourceKey, shell\)/);
        expect(chrome).toMatch(/repaintLmsWhiteboardAfterFullscreenLayout[\s\S]*?scheduleLmsWhiteboardLayoutRecovery\(targetShell/);
    });

    it('opens props dock by default and syncs toggle-props buttons in fullscreen', () => {
        const chrome = readSource('assets/js/pages/lms-whiteboard-chrome-runtime.js');

        expect(chrome).toContain('function syncLmsWhiteboardPropsToggleUi');
        expect(chrome).toMatch(/toggleLmsWhiteboardFullscreen[\s\S]*shell\.classList\.add\('is-props-open'\)/);
        expect(chrome).toMatch(/syncLmsWhiteboardPropsToggleUi[\s\S]*querySelectorAll\('\[data-lms-whiteboard-action="toggle-props"\]'\)/);
        expect(chrome).toMatch(/updateLmsWhiteboardFullscreenUi[\s\S]*syncLmsWhiteboardPropsToggleUi/);
    });

    it('resolves body-mounted shell for chrome offset in focus mode', () => {
        const tabs = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');

        expect(tabs).toMatch(/syncLmsWorkspaceChromeOffset[\s\S]*?kiu-lms-whiteboard-focus-active[\s\S]*?lms-whiteboard-fullscreen-mounted/);
    });

    it('bumps fullscreen pan cache bust tokens in lms.html', () => {
        const html = readSource('lms.html');

        expectLmsRouteCssLinks(html);
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-whiteboard-runtime.js?v=20260808-overallperf1');
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-whiteboard-pointer-runtime.js?v=20260808-overallperf1');
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-whiteboard-paint-runtime.js?v=20260729-wbdocresize4');
    });
});
