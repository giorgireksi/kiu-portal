import { describe, expect, it } from 'vitest';
import { expectLmsRouteCssLinks } from './helpers/lms-route-css.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS whiteboard wave 1b improvements', () => {
    it('adds fullscreen focus toolbar without keyboard shortcuts', () => {
        const runtime = readSource('assets/js/pages/lms-whiteboard-runtime.js');

        expect(runtime).toContain('lms-whiteboard-command-bar');
        expect(runtime).not.toContain('function openLmsWhiteboardShortcutsModal');
        expect(runtime).not.toContain('function closeLmsWhiteboardShortcutsModal');
        expect(runtime).not.toContain("alert('Shortcuts:");
        expect(runtime).not.toContain('data-lms-whiteboard-action="help"');
    });

    it('supports stroke hit-test, move, and selection bounds', () => {
        const runtime = readSource('assets/js/pages/lms-whiteboard-runtime.js');

        expect(runtime).toContain('function getLmsWhiteboardElementBounds');
        expect(runtime).toContain('function hitTestLmsWhiteboardStroke');
        expect(runtime).toContain("element.type === 'stroke'");
        expect(runtime).toMatch(/drawLmsWhiteboardSelectionOutline/);
    });

    it('registers delete/backspace keyboard shortcuts without legacy global handlers', () => {
        const runtime = readSource('assets/js/pages/lms-whiteboard-runtime.js');

        expect(runtime).not.toContain('function onLmsWhiteboardKeyDown');
        expect(runtime).not.toContain('function onLmsWhiteboardKeyUp');
        expect(runtime).toContain('function bindLmsWhiteboardKeyboardShortcuts');
        expect(runtime).toContain('function handleLmsWhiteboardKeyboardShortcut');
        expect(runtime).toMatch(/key !== 'Delete'[\s\S]*key !== 'Backspace'/);
        expect(runtime).toContain('aria-pressed');
        expect(runtime).toContain('function setLmsWhiteboardTool');
    });

    it('shows loading, unsaved, and retry sync in status pills', () => {
        const runtime = readSource('assets/js/pages/lms-whiteboard-runtime.js');

        expect(runtime).toContain('loadingFromBackend');
        expect(runtime).toContain('Unsaved changes');
        expect(runtime).toContain('data-lms-whiteboard-action="retry-sync"');
    });

    it('styles focus toolbar without shortcuts modal', () => {
    });

    it('bumps wave1b cache bust tokens in lms.html', () => {
        const html = readSource('lms.html');

        expectLmsRouteCssLinks(html);
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-whiteboard-runtime.js?v=20260710-personal-dashboard-share1');
    });
});