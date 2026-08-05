import { describe, expect, it } from 'vitest';
import { readLmsWhiteboardSource } from './helpers/lms-whiteboard-source.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS whiteboard delete', () => {
    it('deletes only the selected element ids', () => {
        const runtime = readLmsWhiteboardSource();
        const deleteBlock = runtime.match(/function deleteLmsWhiteboardSelection[\s\S]*?(?=\nfunction )/)?.[0] || '';

        expect(deleteBlock).toContain('const removedIds = selectedIds.slice();');
        expect(deleteBlock).not.toContain('resolveLmsWhiteboardDeleteIds');
        expect(deleteBlock).not.toContain('getLmsWhiteboardTemplateMoveIds');
    });

    it('binds keyboard delete shortcuts on the whiteboard shell', () => {
        const runtime = readLmsWhiteboardSource();
        const deleteBlock = runtime.match(/function deleteLmsWhiteboardSelection[\s\S]*?(?=\nfunction )/)?.[0] || '';
        const keyboardBlock = runtime.match(/function handleLmsWhiteboardKeyboardShortcut[\s\S]*?(?=\nfunction )/)?.[0] || '';

        expect(runtime).toContain('function handleLmsWhiteboardKeyboardShortcut');
        expect(deleteBlock).toContain('deleteLmsWhiteboardSelection');
        expect(keyboardBlock).toMatch(/key !== 'Delete'[\s\S]*key !== 'Backspace'/);
        expect(runtime).toContain('function isLmsWhiteboardKeyboardScopeActive');
        expect(runtime).toContain('function focusLmsWhiteboardKeyboardTarget');
        expect(keyboardBlock).toContain('deleteLmsWhiteboardSelection(resourceKey)');
        expect(runtime).toContain('bindLmsWhiteboardKeyboardShortcuts(shell, boundToken, canEdit)');
    });

    it('bumps delete cache token in lms.html', () => {
        const html = readSource('lms.html');
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-whiteboard-runtime.js?v=20260729-wbdocmode5');
    });
});