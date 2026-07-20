import { describe, expect, it } from 'vitest';
import { expectLmsRouteCssLinks } from './helpers/lms-route-css.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS whiteboard zoom layout', () => {
    it('places zoom controls inside the canvas stage region', () => {
        const runtime = readSource('assets/js/pages/lms-whiteboard-runtime.js');
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
    });

    
/
        )?.[0] || '';
        expect(whiteboardContentAreaBlock).not.toMatch(/^\s*height:\s*calc\(100dvh/m);
        expect(whiteboardContentAreaBlock).not.toMatch(/^\s*max-height:\s*calc\(100dvh/m);
        const whiteboardPanelCompactBlock = routeCss.match(
            /:has\(#lms-content-area\[data-active-lms-tab="whiteboard"\]\) \.lms-route-panel-compact\s*\{[^}]*\}/g
        ) || [];
        whiteboardPanelCompactBlock.forEach((block) => {
            expect(block).not.toContain('var(--lux-chrome-bottom');
        });
        expect(runtime).toContain('function isLmsWhiteboardSessionTokenMissing');
        expect(runtime).toContain('function renderLmsWhiteboardSyncError');
        expect(runtime).toContain('lms-whiteboard-sync-signin');
        expect(readSource('assets/js/app/api.js')).toContain('function shouldSuppressPortalFetchDiagnostic');
        expect(readSource('assets/js/app/api.js')).toContain('suppressDiagnostic: true');
        expect(runtime).toContain('function syncLmsWhiteboardLogicalSizeFromStage');
        expect(runtime).toContain('window.syncLmsWhiteboardLogicalSizeFromStage');
        expect(runtime).toContain('function resyncLmsWhiteboardLayoutMetrics');
        expect(runtime).toContain('function resolveLmsWhiteboardStageMeasureRect');
        expect(runtime).toContain('function scheduleLmsWhiteboardLayoutRecovery');
        expect(runtime).not.toContain('function bindLmsWhiteboardLayoutResizeWatch');
        expect(runtime).toContain('function toggleLmsWhiteboardPropsDock');
        expect(runtime).toContain('data-lms-whiteboard-action="toggle-props"');
        expect(runtime).toContain('is-props-open');
        expect(runtime).toContain('function syncLmsWhiteboardSessionBodyClass');
        expect(runtime).toContain('kiu-lms-whiteboard-session-active');
        expect(runtime).toMatch(/function updateLmsWhiteboardSessionChrome[\s\S]*resyncLmsWhiteboardLayoutMetrics/);
        expect(runtime).toContain('lms-whiteboard-collab-hud');
        expect(runtime).toContain('function renderLmsWhiteboardStaffSessionBannerPills');
        expect(classroom).not.toContain('function ensureLmsWhiteboardShellResizeWatch');
        expect(classroom).toContain('function bindLmsWorkspaceChromeResizeSync');
        expect(classroom).toContain('bindLmsWorkspaceChromeResizeSync()');
        expect(classroom).toContain('--lms-whiteboard-shell-chrome');
        expect(classroom).toContain('--lms-whiteboard-content-top');
        expect(classroom).toContain('--lms-whiteboard-panel-top');
        expect(classroom).toContain('contentArea.getBoundingClientRect().top');
        expect(classroom).toContain('panel.getBoundingClientRect().top');
        expect(classroom).toContain('resetLmsWhiteboardAccessState(tabCourseKey)');
        expect(classroom).toContain("classList.remove('kiu-lms-whiteboard-session-active')");
        expect(readSource('assets/js/pages/lms-whiteboard-workspace-runtime.js')).toContain('function resetLmsWhiteboardAccessState');
        const paint = readSource('assets/js/pages/lms-whiteboard-paint-runtime.js');
        expect(paint).toContain('function drawLmsWhiteboardViewportGrid');
        expect(paint).toContain('drawLmsWhiteboardViewportGrid(ctx, canvas, dpr)');
        const paintBlock = paint.match(/function paintLmsWhiteboardCanvas[\s\S]*?(?=\nfunction )/)?.[0] || '';
        expect(paintBlock).toMatch(/if \(options\.logicalPixels\) \{[\s\S]*fillRect\(0, 0, width, height\)[\s\S]*drawLmsWhiteboardGrid\(ctx, width, height\)/);
        const normalViewBlock = paintBlock.match(/if \(!options\.logicalPixels\) \{[\s\S]*?\n    \}/)?.[0] || '';
        expect(normalViewBlock).toContain('drawLmsWhiteboardViewportGrid(ctx, canvas, dpr)');
        expect(normalViewBlock).not.toContain('drawLmsWhiteboardGrid');
        expect(runtime).toContain('renderLmsWhiteboardBannerStatusPills');
        expect(runtime).toContain('lms-whiteboard-banner-pills');
        const resyncBlock = runtime.match(/function resyncLmsWhiteboardLayoutMetrics[\s\S]*?(?=\nfunction )/)?.[0] || '';
        expect(resyncBlock).toContain('syncLmsWhiteboardLogicalSizeFromStage(stage)');
        expect(resyncBlock).toContain('setupLmsWhiteboardCanvasHiDpi(canvas)');
        expect(resyncBlock).toContain('paintLmsWhiteboardCanvas');
    });

    it('bumps whiteboard zoom cache bust tokens in lms.html', () => {
        const html = readSource('lms.html');

        expectLmsRouteCssLinks(html);
        expect(html).toContain('assets/js/pages/lms-classroom-tabs-runtime.js?v=20260715-lms-lazy7');
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-whiteboard-workspace-runtime.js?v=20260710-personal-autosave1');
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-whiteboard-runtime.js?v=20260719-wbchrome1');
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-whiteboard-paint-runtime.js?v=20260719-wbchrome1');
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-personal-dashboard-runtime.js?v=20260715-lms-lazy2');
        expect(html).not.toContain('assets/js/pages/lms-personal-dashboard-runtime.js');
    });
});