import { describe, expect, it } from 'vitest';

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('lms whiteboard tab regressions', () => {
    it('registers the whiteboard tab in lms.html and classroom tab router', () => {
        const html = readSource('lms.html');
        const tabs = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        const lms = readSource('assets/js/pages/lms.js');

        expect(html).toContain('id="tab-whiteboard"');
        expect(html).toContain('data-lms-tab="whiteboard"');
        expect(html).not.toContain('lms-whiteboard-workspace-runtime.js');
        expect(html).not.toContain('lms-whiteboard-runtime.js');
        const classroom = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        expect(classroom).toContain('lms-whiteboard-workspace-runtime.js');
        expect(classroom).toContain('lms-whiteboard-runtime.js');
        expect(classroom).toContain('function ensureLmsWhiteboardRuntime()');
        expect(tabs).toContain("tab === 'whiteboard'");
        expect(tabs).toContain('renderLmsWhiteboardSection');
        expect(tabs).toContain('lms-tab-whiteboard');
        expect(lms).toContain("'whiteboard'");
    });

    it('wires calls deep-link helpers and phase-2 whiteboard tools', () => {
        const calls = readSource('assets/js/pages/lms-calls-runtime.js');
        const runtime = readSource('assets/js/pages/lms-whiteboard-runtime.js');
        const workspace = readSource('assets/js/pages/lms-whiteboard-workspace-runtime.js');

        expect(calls).toContain('openLmsWhiteboardFromCalls()');
        expect(calls).toContain("openLmsWhiteboardFromCalls({ unlock: true })");
        expect(workspace).toContain('function openLmsWhiteboardFromCalls');
        expect(runtime).not.toContain('LMS_WHITEBOARD_TEMPLATES');
        expect(runtime).not.toContain("['line', 'fa-arrow-right-long', 'Connector']");
        expect(runtime).toContain('export-pdf');
        expect(runtime).not.toContain('buildLmsWhiteboardTemplateElements');
    });

    it('uses refreshLmsWhiteboardUi for async sync/load updates', () => {
        const runtime = readSource('assets/js/pages/lms-whiteboard-runtime.js');
        const workspace = readSource('assets/js/pages/lms-whiteboard-workspace-runtime.js');
        const syncFinally = workspace.match(/runImmediateLmsWhiteboardSync[\s\S]*?^}/m)?.[0] || '';

        expect(runtime).toContain('function refreshLmsWhiteboardUi');
        expect(workspace).toContain('function invokeRefreshLmsWhiteboardUi');
        expect(syncFinally).toContain('invokeRefreshLmsWhiteboardUi');
        expect(syncFinally).not.toContain('renderLmsWhiteboardSection');
    });

    it('guards whiteboard tab render against missing course key and null workspace', () => {
        const runtime = readSource('assets/js/pages/lms-whiteboard-runtime.js');
        const workspace = readSource('assets/js/pages/lms-whiteboard-workspace-runtime.js');
        const tabs = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        const renderBlock = runtime.match(/function renderLmsWhiteboardSection[\s\S]*?(?=\nfunction runLmsWhiteboardHudAction)/)?.[0] || '';

        expect(workspace).toContain('function getLmsWhiteboardWorkspaceSafe');
        expect(runtime).toContain('function renderLmsWhiteboardMissingCourseState');
        expect(renderBlock).toContain('if (!canonicalKey)');
        expect(renderBlock).toContain('getLmsWhiteboardWorkspaceSafe');
        expect(tabs).toContain("typeof renderLmsWhiteboardSection === 'function'");
    });

    it('removes template picker UI from props panel and banner', () => {
        const runtime = readSource('assets/js/pages/lms-whiteboard-runtime.js');
        const html = readSource('lms.html');

        expect(runtime).not.toContain('renderLmsWhiteboardTemplatesPanel');
        expect(runtime).not.toContain('data-lms-whiteboard-action="pick-template"');
        expect(runtime).not.toContain('data-lms-whiteboard-props-tab="templates"');
        expect(html).not.toContain('lms-whiteboard-template-logic.js');
        expect(html).not.toContain('lms-whiteboard-activity-runtime.js');
    });

    it('binds whiteboard pointer handlers on the stage surface', () => {
        const pointer = readSource('assets/js/pages/lms-whiteboard-pointer-runtime.js');

        expect(pointer).toContain('function bindLmsWhiteboardStagePointerHandlers');
        expect(pointer).toContain('stage.dataset.lmsWhiteboardPointerBound');
        expect(pointer).toContain('shouldIgnoreLmsWhiteboardStagePointer');
    });

    it('supports miro-style session chrome with HUD and selection toolbar', () => {
        const runtime = readSource('assets/js/pages/lms-whiteboard-runtime.js');
        const chromeBlock = runtime.match(/function updateLmsWhiteboardSessionChrome[\s\S]*?(?=\nfunction )/)?.[0] || '';

        expect(runtime).toContain('is-session-active');
        expect(runtime).toContain('function syncLmsWhiteboardSelectionToolbar');
        expect(runtime).toContain('function deleteLmsWhiteboardSelection');
        expect(runtime).toContain('data-lms-whiteboard-selection-toolbar');
        expect(chromeBlock).toContain("commandBar.classList.toggle('is-readonly', !canEdit)");
        expect(runtime).toContain('LMS_WHITEBOARD_THEME.selection');
    });

    
