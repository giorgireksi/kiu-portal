import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (typeof existsSync === 'function' && !existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

function createBuiltinTabManageVmContext() {
    const vm = require('vm');
    const sharedSource = readSource('assets/js/pages/registration-shared.js');
    const verifyStart = sharedSource.indexOf('function normalizeRegistrationRemoveVerificationToken');
    const verifyEnd = sharedSource.indexOf('window.getAssignedCourseCurriculumDetails');
    const verifyBlock = sharedSource.slice(verifyStart, verifyEnd);

    const context = {
        console,
        window: {
            confirm: () => true,
            prompt: () => 'PROG'
        },
        showToast: () => {}
    };

    vm.createContext(context);
    vm.runInContext(verifyBlock, context);
    return context;
}

describe('admin registration builtin tab manage', () => {
    it('stores builtin overrides and hidden tabs in CMS schema', () => {
        const track = readSource('assets/js/pages/admin-registration-track.js');
        const shared = readSource('assets/js/pages/registration-shared.js');
        const initialState = readSource('assets/js/data/initial-state.js');
        const adminRegistration = readSource('assets/js/pages/admin-registration.js');

        expect(initialState).toContain('builtinTabOverrides: {}');
        expect(initialState).toContain('hiddenBuiltinTabs: []');
        expect(track).toContain('builtinTabOverrides');
        expect(track).toContain('hiddenBuiltinTabs');
        expect(shared).toContain('builtinTabOverrides');
        expect(shared).toContain('hiddenBuiltinTabs');
        expect(adminRegistration).toContain('builtinTabOverrides: bucket.builtinTabOverrides || {}');
    });

    it('shows manage tab for builtin tabs and branches edit/remove handlers', () => {
        const track = readSource('assets/js/pages/admin-registration-track.js');

        expect(track).toContain('function openEditAdminRegTabModal');
        expect(track).toContain('function hideBuiltinAdminRegTab');
        expect(track).toContain('function saveBuiltinAdminRegTabOverrides');
        expect(track).toContain('hideBuiltinAdminRegTab(safeTabId) : deleteCustomAdminRegTab(safeTabId)');
        expect(track).not.toContain('if (!tabConfig || tabConfig.builtin)');
        expect(track).not.toContain('isBuiltinAdminRegTab(safeTabId) || typeof openAdminRegManageModal');
    });

    it('merges builtin overrides and filters hidden tabs in resolvers', () => {
        const track = readSource('assets/js/pages/admin-registration-track.js');
        const shared = readSource('assets/js/pages/registration-shared.js');

        expect(track).toContain('bucket.hiddenBuiltinTabs.includes(safeId)');
        expect(track).toContain('bucket.builtinTabOverrides?.[safeId]');
        expect(track).toContain('Object.keys(ADMIN_REG_BUILTIN_TABS)');
        expect(shared).toContain('bucket.hiddenBuiltinTabs.includes(safeId)');
        expect(shared).toContain('bucket.builtinTabOverrides?.[safeId]');
        expect(shared).toContain('Object.keys(REGISTRATION_BUILTIN_TABS)');
    });

    it('buildAdminRegBuiltinTabRemoveVerification requires typed builtin tab id', () => {
        const ctx = createBuiltinTabManageVmContext();
        const verified = ctx.runRegistrationRemoveVerification(
            ctx.buildAdminRegBuiltinTabRemoveVerification('prog', { label: 'Program' })
        );
        expect(verified).toBe(true);

        ctx.window.prompt = () => 'WRONG';
        const rejected = ctx.runRegistrationRemoveVerification(
            ctx.buildAdminRegBuiltinTabRemoveVerification('prog', { label: 'Program' })
        );
        expect(rejected).toBe(false);
    });

    it('keeps registration panel head manage button layout scoped in CSS', () => {
        const css = readSource('assets/css/admin-tools-luxury.css');

        expect(css).toContain('.lux-card-head.lux-admin-tools-registration-panel-head');
        expect(css).toContain('flex-direction: row');
        expect(css).toContain('align-items: flex-start');
    });
});