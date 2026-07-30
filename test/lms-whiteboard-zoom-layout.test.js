import { describe, expect, it } from 'vitest';
import { expectLmsRouteCssLinks } from './helpers/lms-route-css.js';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS whiteboard zoom layout', () => {
    it('places zoom controls inside the canvas stage region', () => {
        const runtime = readSource('assets/js/pages/lms-whiteboard-session-runtime.js');
        const stageBlock = runtime.match(
            /data-lms-whiteboard-region="stage"[\s\S]*?data-lms-whiteboard-action="zoom-fit"/
        )?.[0] || '';

        expect(stageBlock).toContain('data-lms-whiteboard-region="stage"');
        expect(stageBlock).toContain('class="lms-whiteboard-zoom"');
        expect(stageBlock).toContain('data-lms-whiteboard-action="zoom-in"');
        expect(stageBlock).toContain('data-lms-whiteboard-edit-layer');
        expect(stageBlock).toMatch(/lms-whiteboard-canvas[\s\S]*data-lms-whiteboard-edit-layer[\s\S]*lms-whiteboard-zoom/);
    });

    it('pins zoom above the canvas with stage reset and panel overflow exception', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const runtime = readSource('assets/js/pages/lms-whiteboard-runtime.js');
        const session = readSource('assets/js/pages/lms-whiteboard-session-runtime.js');
        const chrome = readSource('assets/js/pages/lms-whiteboard-chrome-runtime.js');
        const shellRuntime = readSource('assets/js/pages/lms-classroom-tabs-shell-runtime.js');
        const classroom = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');

        const whiteboardContentAreaBlock = bare.match(
            /body\.lux-route-lms #lms-content-area\[data-active-lms-tab="whiteboard"\]\s*\{[^}]*\}/s
        )?.[0] || '';
        expect(whiteboardContentAreaBlock).not.toMatch(/^\s*height:\s*calc\(100dvh/m);
        expect(whiteboardContentAreaBlock).not.toMatch(/^\s*max-height:\s*calc\(100dvh/m);
        const whiteboardPanelCompactBlock = bare.match(
            /:has\(#lms-content-area\[data-active-lms-tab="whiteboard"\]\) \.lms-route-panel-compact\s*\{[^}]*\}/g
        ) || [];
        whiteboardPanelCompactBlock.forEach((block) => {
            expect(block).not.toContain('var(--lux-chrome-bottom');
        });
        expect(bare).toContain('body.lux-route-lms .lms-whiteboard-zoom');
        expect(bare).toContain('@media (max-width: 768px)');
        expect(chrome).toContain('function isLmsWhiteboardSessionTokenMissing');
        expect(chrome).toContain('function renderLmsWhiteboardSyncError');
        expect(chrome).toContain('lms-whiteboard-sync-signin');
        expect(readSource('assets/js/app/api.js')).toContain('function shouldSuppressPortalFetchDiagnostic');
        expect(readSource('assets/js/app/api.js')).toContain('options.suppressDiagnostic === true');
        expect(runtime).toContain('function syncLmsWhiteboardLogicalSizeFromStage');
        expect(session).toContain('function resyncLmsWhiteboardLayoutMetrics');
        expect(runtime).toContain('function resolveLmsWhiteboardStageMeasureRect');
        expect(session).toContain('function scheduleLmsWhiteboardLayoutRecovery');
        expect(runtime).not.toContain('function bindLmsWhiteboardLayoutResizeWatch');
        expect(chrome).toContain('function toggleLmsWhiteboardPropsDock');
        expect(chrome).toContain('data-lms-whiteboard-action="toggle-props"');
        expect(chrome).toContain('is-props-open');
        expect(session).toContain('function syncLmsWhiteboardSessionBodyClass');
        expect(session).toContain('kiu-lms-whiteboard-session-active');
        expect(chrome).toContain('function updateLmsWhiteboardSessionChrome');
        expect(chrome).toContain('scheduleLmsWhiteboardLayoutRecovery');
        expect(session).toContain('lms-whiteboard-collab-hud');
        expect(chrome).toContain('function renderLmsWhiteboardStaffSessionBannerPills');
        expect(classroom).not.toContain('function ensureLmsWhiteboardShellResizeWatch');
        expect(classroom).toContain('function bindLmsWorkspaceChromeResizeSync');
        expect(classroom).toContain('bindLmsWorkspaceChromeResizeSync()');
        expect(classroom).toContain('--lms-whiteboard-shell-chrome');
        expect(classroom).toContain('--lms-whiteboard-content-top');
        expect(classroom).toContain('--lms-whiteboard-panel-top');
        expect(classroom).toContain('contentArea.getBoundingClientRect().top');
        expect(classroom).toContain('panel.getBoundingClientRect().top');
        expect(shellRuntime).toContain('resetLmsWhiteboardAccessState(tabCourseKey)');
        expect(shellRuntime).toContain("classList.remove('kiu-lms-whiteboard-session-active')");
        expect(readSource('assets/js/pages/lms-whiteboard-workspace-runtime.js')).toContain('function resetLmsWhiteboardAccessState');
        const paint = readSource('assets/js/pages/lms-whiteboard-paint-runtime.js');
        expect(paint).toContain('function drawLmsWhiteboardViewportGrid');
        expect(paint).toContain('drawLmsWhiteboardViewportGrid(ctx, canvas, dpr)');
        const paintBlock = paint.match(/function paintLmsWhiteboardCanvas[\s\S]*?(?=\nfunction )/)?.[0] || '';
        expect(paintBlock).toMatch(/if \(options\.logicalPixels\) \{[\s\S]*fillRect\(0, 0, width, height\)[\s\S]*drawLmsWhiteboardGrid\(ctx, width, height\)/);
        const normalViewBlock = paintBlock.match(/if \(!options\.logicalPixels\) \{[\s\S]*?\n    \}/)?.[0] || '';
        expect(normalViewBlock).toContain('drawLmsWhiteboardViewportGrid(ctx, canvas, dpr)');
        expect(normalViewBlock).not.toContain('drawLmsWhiteboardGrid');
        expect(chrome).toContain('renderLmsWhiteboardBannerStatusPills');
        expect(chrome).toContain('lms-whiteboard-banner-pills');
        const resyncBlock = session.match(/function resyncLmsWhiteboardLayoutMetrics[\s\S]*?(?=\nfunction )/)?.[0] || '';
        expect(resyncBlock).toContain('syncLmsWhiteboardLogicalSizeFromStage(stage)');
        expect(resyncBlock).toContain('setupLmsWhiteboardCanvasHiDpi(canvas)');
        expect(resyncBlock).toContain('paintLmsWhiteboardCanvas');
    });

    it('bumps whiteboard zoom cache bust tokens in lms.html', () => {
        const html = readSource('lms.html');

        expectLmsRouteCssLinks(html);
        expect(html).toContain('lmquiz1');
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-whiteboard-workspace-runtime.js?v=20260710-personal-autosave1');
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-whiteboard-runtime.js?v=20260720-wbsession1');
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-whiteboard-paint-runtime.js?v=20260719-wbchrome1');
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-personal-dashboard-runtime.js?v=20260731-pdsavename1');
        expect(html).not.toContain('assets/js/pages/lms-personal-dashboard-runtime.js');
    });
});
