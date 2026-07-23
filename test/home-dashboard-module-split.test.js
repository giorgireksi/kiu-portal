import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('home dashboard module split', () => {
    it('owns prefs and palette helpers outside layout/render modules', () => {
        const prefs = readSource('assets/js/features/home-dashboard/prefs-visuals.js');
        const layout = readSource('assets/js/features/home-dashboard/widget-layout.js');
        const render = readSource('assets/js/features/home-dashboard/widget-render.js');

        expect(prefs).toContain('function getDashboardVisuals');
        expect(prefs).toContain('function applyPaletteKey');
        expect(layout).not.toContain('function getDashboardVisuals');
        expect(render).not.toContain('function applyPaletteKey');
    });

    it('owns widget row adapters in home-dashboard-widget-data-runtime peel', () => {
        const data = readSource('assets/js/features/home-dashboard-widget-data-runtime.js');
        const prefs = readSource('assets/js/features/home-dashboard/prefs-visuals.js');
        const shell = readSource('assets/js/features/home-dashboard/shell.js');
        const plain = readSource('assets/js/features/index-home-dashboard.plain.js');

        expect(data).toContain('function getStudentScoreRows');
        expect(data).toContain('function getOrderRowsForWidget');
        expect(data).toContain('function getTicketRowsForWidget');
        expect(data).toContain('__kiuCreateHomeDashboardWidgetDataApi');
        expect(prefs).not.toContain('function getStudentScoreRows');
        expect(shell).not.toContain('function getOrderRowsForWidget');
        expect(plain).not.toContain('function getStudentScoreRows');
    });

    it('owns geometry and widget definitions in widget-layout runtime peel', () => {
        const layoutRuntime = readSource('assets/js/features/home-dashboard-widget-layout-runtime.js');
        const layoutStub = readSource('assets/js/features/home-dashboard/widget-layout.js');
        const render = readSource('assets/js/features/home-dashboard/widget-render.js');

        expect(layoutRuntime).toContain('function getDesktopCanvasMetrics');
        expect(layoutRuntime).toContain('function buildSystemWidgetDefinitions');
        expect(layoutRuntime).toContain('function buildHomeWidgetDefinitions');
        expect(layoutRuntime).toContain('function buildPresentationLayout');
        expect(layoutStub).toContain('__kiuCreateHomeDashboardWidgetLayoutApi');
        expect(render).not.toContain('function buildHomeWidgetDefinitions');
    });

    it('owns static markup renderers in widget-render', () => {
        const render = readSource('assets/js/features/home-dashboard/widget-render.js');
        const layout = readSource('assets/js/features/home-dashboard/widget-layout.js');
        const shell = readSource('assets/js/features/home-dashboard/shell.js');

        expect(render).toContain('function renderHeroWidgetMarkup');
        expect(render).toContain('function renderWidgetContent');
        expect(render).not.toContain('function renderWidgetShellMarkup');
        expect(layout).not.toContain('function renderHeroWidgetMarkup');
        expect(shell).not.toContain('function renderWidgetContent');
    });

    it('keeps editor stub and static shell outside the gesture runtime', () => {
        const draft = readSource('assets/js/features/home-dashboard/editor-draft.js');
        const gesture = readSource('assets/js/features/home-dashboard-gesture-runtime.js');
        const shell = readSource('assets/js/features/home-dashboard/shell.js');

        expect(draft).toContain('stopHomeEditor = function');
        expect(draft).not.toContain('ensureHomeEditorCss');
        expect(gesture).toContain('function getHomeViewportWidthForDesktop');
        expect(gesture).not.toContain('renderDynamicHomeShell');
        expect(shell).toContain('function bindHomeShellActions');
        expect(shell).toContain('renderDynamicHomeShell = function');
        expect(shell).toContain('lux-home-merged');
        expect(existsSync(join(process.cwd(), 'assets/js/features/home-dashboard/editor-ui.js'))).toBe(false);
    });
});
