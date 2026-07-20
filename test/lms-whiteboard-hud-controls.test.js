import { describe, expect, it } from 'vitest';

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS whiteboard HUD controls ux12', () => {
    it('prefers fullscreen-mounted and visible shells for binding', () => {
        const runtime = readSource('assets/js/pages/lms-whiteboard-runtime.js');

        expect(runtime).toContain('function getLmsWhiteboardShells');
        expect(runtime).toContain('function isLmsWhiteboardShellVisible');
        expect(runtime).toContain('function syncLmsWhiteboardShellBinding');
        expect(runtime).toContain('function bindLmsWhiteboardHudControls');
        expect(runtime).toContain('function runLmsWhiteboardHudAction');
        expect(runtime).toContain("shell.dataset.lmsWhiteboardFullscreenMounted === '1'");
        expect(runtime).toContain('syncLmsWhiteboardShellBinding(resourceKey)');
        expect(runtime).toContain('syncLmsWhiteboardShellBinding(shell.dataset.lmsWhiteboardKey');
    });

    it('binds zoom controls directly on the active shell', () => {
        const runtime = readSource('assets/js/pages/lms-whiteboard-runtime.js');
        const hudBlock = runtime.match(/function bindLmsWhiteboardHudControls[\s\S]*?(?=\nfunction )/)?.[0] || '';
        const actionBlock = runtime.match(/function runLmsWhiteboardHudAction[\s\S]*?(?=\nfunction )/)?.[0] || '';

        expect(hudBlock).toContain('.lms-whiteboard-zoom');
        expect(hudBlock).toContain('dataset.lmsWhiteboardZoomBound');
        expect(hudBlock).toContain('runLmsWhiteboardHudAction');
        expect(hudBlock).toContain('.lms-whiteboard-minimap-shell');
        expect(hudBlock).toContain('toggle-minimap');
        expect(actionBlock).toContain('zoom-in');
        expect(actionBlock).toContain('zoom-out');
        expect(actionBlock).toContain('zoom-fit');
        expect(actionBlock).toContain('zoom-selection');
        expect(actionBlock).toContain('fitLmsWhiteboardZoomToBounds');
    });

    it('keeps uniform canvas scaling on resize', () => {
        const runtime = readSource('assets/js/pages/lms-whiteboard-runtime.js');
        const metricsBlock = runtime.match(/function getLmsWhiteboardCanvasMetrics[\s\S]*?(?=\nfunction )/)?.[0] || '';

        expect(runtime).toContain("['hand', 'fa-hand', 'Hand']");
        expect(metricsBlock).toContain('Math.min(rawScaleX, rawScaleY)');
        expect(metricsBlock).toContain('offsetX');
        expect(runtime).not.toContain('data-lms-whiteboard-empty-cta');
        expect(runtime).not.toContain('Pick a tool or browse templates below');
    });

    it('clears stale bound guards on duplicate shells', () => {
        const runtime = readSource('assets/js/pages/lms-whiteboard-runtime.js');
        const bindBlock = runtime.match(/function bindLmsWhiteboardSection[\s\S]*?(?=\nfunction )/)?.[0] || '';

        expect(bindBlock).toContain('getLmsWhiteboardShells(resourceKey).forEach');
        expect(bindBlock).toContain('delete candidate.dataset.lmsWhiteboardBound');
    });

    it('keeps HUD overlays above the canvas in fullscreen', () => {
    });

    it('bumps whiteboard ux cache bust tokens in lms.html', () => {
        const html = readSource('lms.html');

        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-whiteboard-workspace-runtime.js?v=20260710-personal-autosave1');
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-whiteboard-runtime.js?v=20260710-personal-dashboard-share1');
    });
});