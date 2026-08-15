import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';

const read = (path) => readFileSync(path, 'utf8');

describe('admin-only role picker', () => {
    it('hides role switching for non-admin authenticated accounts', () => {
        const topbar = read('assets/js/features/luxury-shell-topbar-runtime.js');
        const picker = read('assets/js/features/luxury-shell-picker-runtime.js');
        const chrome = read('assets/js/features/luxury-shell-chrome.js');
        expect(topbar).toContain('function isAuthenticatedAdminForRolePicker()');
        expect(topbar).toContain('wrapper?.remove()');
        expect(topbar).toContain('if (wrapper) wrapper.hidden = false;');
        expect(topbar).toContain('if (!syncRolePickerVisibility()) return;');
        const shell = read('assets/js/features/index-luxury.js');
        expect(shell).toContain('const rolePickerMarkup =');
        expect(shell).toContain('window.isAuthenticatedAdminForRolePicker()');
        expect(picker).toContain('window.isAuthenticatedAdminForRolePicker');
        expect(chrome).toContain('window.syncRolePickerVisibility()');
    });
});
