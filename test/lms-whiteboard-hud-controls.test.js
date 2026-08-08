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

describe('LMS whiteboard HUD controls ux12', () => {
    it('prefers fullscreen-mounted and visible shells for binding', () => {
        const runtime = readLmsWhiteboardSource();

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
        const runtime = readLmsWhiteboardSource();
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
        const runtime = readLmsWhiteboardSource();
        const metricsBlock = runtime.match(/function getLmsWhiteboardCanvasMetrics[\s\S]*?(?=\nfunction )/)?.[0] || '';

        expect(runtime).toContain("['hand', 'fa-hand', 'Hand']");
        expect(metricsBlock).toContain('Math.min(rawScaleX, rawScaleY)');
        expect(metricsBlock).toContain('offsetX');
        expect(runtime).not.toContain('data-lms-whiteboard-empty-cta');
        expect(runtime).not.toContain('Pick a tool or browse templates below');
    });

    it('clears stale bound guards on duplicate shells', () => {
        const runtime = readLmsWhiteboardSource();
        const bindBlock = runtime.match(/function bindLmsWhiteboardSection[\s\S]*?(?=\nfunction )/)?.[0] || '';

        expect(bindBlock).toContain('getLmsWhiteboardShells(resourceKey).forEach');
        expect(bindBlock).toContain('delete candidate.dataset.lmsWhiteboardBound');
    });

    it('keeps HUD overlays above the canvas in fullscreen', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const minimapBlock = bare.match(/body\.lux-route-lms \.lms-whiteboard-minimap-shell\s*\{[^}]*\}/)?.[0] || '';
        expect(minimapBlock).toMatch(/right:\s*12px/);
        expect(minimapBlock).not.toMatch(/^\s*left:\s*12px/m);
        const zoomBlock = bare.match(/body\.lux-route-lms \.lms-whiteboard-zoom\s*\{[^}]*\}/)?.[0] || '';
        expect(zoomBlock).toMatch(/position:\s*absolute/);
        expect(zoomBlock).toMatch(/left:\s*12px/);
        expect(zoomBlock).toMatch(/bottom:\s*12px/);
        expect(bare).toContain('body.kiu-lms-whiteboard-focus-active .lms-whiteboard-stage > .lms-whiteboard-zoom');
        expect(bare).toContain('body.kiu-lms-whiteboard-focus-active .lms-whiteboard-stage > .lms-whiteboard-minimap-shell');
    });

    it('bumps whiteboard ux cache bust tokens in lms.html', () => {
        const html = readSource('lms.html');

        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-whiteboard-workspace-runtime.js?v=20260710-personal-autosave1');
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-whiteboard-runtime.js?v=20260808-overallperf1');
    });
});