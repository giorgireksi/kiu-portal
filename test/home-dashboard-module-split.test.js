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

    it('owns geometry and widget definitions in widget-layout', () => {
        const layout = readSource('assets/js/features/home-dashboard/widget-layout.js');
        const render = readSource('assets/js/features/home-dashboard/widget-render.js');
        const editorUi = readSource('assets/js/features/home-dashboard/editor-ui.js');

        expect(layout).toContain('function getDesktopCanvasMetrics');
        expect(layout).toContain('function buildSystemWidgetDefinitions');
        expect(layout).toContain('function buildHomeWidgetDefinitions');
        expect(layout).toContain('function buildPresentationLayout');
        expect(render).not.toContain('function buildHomeWidgetDefinitions');
        expect(editorUi).not.toContain('function buildSystemWidgetDefinitionsUncached');
    });

    it('owns markup renderers in widget-render', () => {
        const render = readSource('assets/js/features/home-dashboard/widget-render.js');
        const layout = readSource('assets/js/features/home-dashboard/widget-layout.js');
        const shell = readSource('assets/js/features/home-dashboard/shell.js');

        expect(render).toContain('function renderHeroWidgetMarkup');
        expect(render).toContain('function renderWidgetContent');
        expect(render).toContain('function renderWidgetShellMarkup');
        expect(layout).not.toContain('function renderHeroWidgetMarkup');
        expect(shell).not.toContain('function renderWidgetShellMarkup');
    });

    it('owns editor draft, panel, and gestures outside the shell bind module', () => {
        const draft = readSource('assets/js/features/home-dashboard/editor-draft.js');
        const editorUi = readSource('assets/js/features/home-dashboard/editor-ui.js');
        const shell = readSource('assets/js/features/home-dashboard/shell.js');

        expect(draft).toContain('saveHomeEditor = function');
        expect(draft).toContain('ensureHomeEditorDraft = function');
        expect(editorUi).toContain('function renderEditorPanel');
        expect(editorUi).toContain('function beginDesktopWidgetGesture');
        expect(shell).not.toContain('function renderEditorPanel');
        expect(shell).not.toContain('function beginDesktopWidgetGesture');
        expect(shell).toContain('function bindHomeShellActions');
        expect(shell).toContain('renderDynamicHomeShell = function');
        expect(shell).toContain('startBackground = function');
    });
});
