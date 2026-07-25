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

function readBundleSource() {
    return readSource('assets/js/features/index-admin-tools.bundle-source.js');
}

function createManageModalVmContext() {
    const vm = require('vm');
    const sharedSource = readSource('assets/js/pages/registration-shared.js');
    const blockStart = sharedSource.indexOf('function runRegistrationRemoveConfirmation');
    const blockEnd = sharedSource.indexOf('function purgeStudentRegistrationTrackSelectionForTab');
    const block = sharedSource.slice(blockStart, blockEnd);

    const context = {
        console,
        window: {
            confirm: () => true
        },
        getAdminRegTrackData() {
            return {
                'Module A': {
                    Main: { courses: [{ title: 'Economics 101' }] },
                    Electives: { courses: [] }
                }
            };
        }
    };

    context.window.getAdminRegTrackData = context.getAdminRegTrackData;

    vm.createContext(context);
    vm.runInContext(block, context);
    return context;
}

describe('admin registration manage modal', () => {
    it('exposes manage modal helpers on registration-shared.js', () => {
        const shared = readSource('assets/js/pages/registration-shared.js');

        expect(shared).toContain('function openAdminRegManageModal');
        expect(shared).toContain('function closeAdminRegManageModal');
        expect(shared).toContain('function runRegistrationRemoveConfirmation');
        expect(shared).toContain('function buildAdminRegProgramRemoveVerification');
        expect(shared).toContain('__kiuRegSharedExpose({');
        expect(shared).toMatch(/openAdminRegManageModal,/);
        expect(shared).toMatch(/runRegistrationRemoveConfirmation,/);
        expect(shared).toMatch(/buildAdminRegProgramRemoveVerification,/);
        expect(shared).toContain("modal.id = 'kiu-admin-reg-manage-modal'");
        expect(shared).toContain('admin-reg-manage-modal-actions');
    });

    it('uses gear manage triggers instead of overflow menus in track source', () => {
        const track = readSource('assets/js/pages/admin-registration-track.js');
        const shared = readSource('assets/js/pages/registration-shared.js');
        const modals = readSource('assets/css/lux-modals.css');
        const controls = readSource('assets/css/lux-controls.css');

        expect(track).toContain('function buildAdminRegManageGearMarkup');
        expect(track).toContain('data-admin-reg-manage-program=');
        expect(track).toContain('data-admin-reg-manage-group=');
        expect(track).toContain('data-admin-reg-manage-course=');
        expect(track).toContain('function openAdminRegProgramManage');
        expect(track).toContain('runRegistrationRemoveConfirmation(buildAdminRegProgramRemoveVerification');
        expect(track).not.toContain('admin-reg-overflow-menu');
        expect(track).not.toContain('buildAdminRegOverflowMenuMarkup');
        expect(track).not.toContain('data-admin-reg-overflow-menu');
        expect(track).toContain('lux-icon-btn admin-reg-manage-gear-btn');
        expect(track).not.toContain('admin-reg-icon-action');
        expect(shared).toContain("modal.id = 'kiu-admin-reg-manage-modal'");
        expect(shared).toContain('admin-reg-manage-modal-actions');
        expect(shared).toContain('lux-ghost-btn admin-reg-manage-modal-action');
        expect(shared).toContain('admin-reg-manage-modal-action--danger');
        expect(shared).toContain('openLuxPortalModalAfterAppend');
        expect(shared).toContain('lms-glass-dialog-overlay');
        expect(modals).toContain('registration-structured-modal-backdrop');
        expect(modals).toMatch(/\.registration-structured-modal-backdrop[\s\S]*?position:\s*fixed/);
        expect(modals).toContain('admin-reg-course-modal-overlay');
        expect(modals).toContain('lux-glass-dialog-card');
        expect(controls).toContain('.lux-icon-btn');
        expect(existsSync(join(process.cwd(), 'assets/css', 'admin-tools-luxury.css'))).toBe(false);
    });

    it('openLuxPortalModalAfterAppend fallback adds is-open when portal helper missing', () => {
        const shared = readSource('assets/js/pages/registration-shared.js');
        const registration = readSource('assets/js/pages/registration.js');
        const adminReg = readSource('assets/js/pages/admin-registration.js');

        expect(shared).toMatch(/function openLuxPortalModalAfterAppend[\s\S]*?openLuxGlassDialogOverlay/);
        expect(shared).toMatch(/function openLuxPortalModalAfterAppend[\s\S]*?classList\.add\('is-open'\)/);
        expect(registration).toContain('openLuxPortalModalAfterAppend(modal, { focusSelector })');
        expect(registration).toContain("modal.classList.remove('is-open', 'is-closing')");
        expect(adminReg).toContain("openLuxPortalModalAfterAppend(modal, { focusSelector: '#course-search-input' })");
    });

    it('keeps structured form modal SSOT on registration-shared (eligibility peel must not clobber)', () => {
        const shared = readSource('assets/js/pages/registration-shared.js');
        const eligibility = readSource('assets/js/pages/student-registration-eligibility-runtime.js');

        expect(shared).toMatch(/function openStructuredFormModal[\s\S]*?openLuxPortalModalAfterAppend/);
        expect(shared).toMatch(/openStructuredFormModal,/);
        expect(shared).toMatch(/closeStructuredFormModal,/);
        expect(eligibility).not.toContain('function openStructuredFormModal');
        expect(eligibility).not.toMatch(/openStructuredFormModal,/);
        expect(eligibility).not.toMatch(/closeStructuredFormModal,/);
    });

    it('exposes tab manage popup helpers in track source', () => {
        const track = readSource('assets/js/pages/admin-registration-track.js');

        expect(track).toContain('function openAdminRegTabManage');
        expect(track).toContain('function openEditAdminRegTabModal');
        expect(track).toContain('function hideBuiltinAdminRegTab');
        expect(track).toContain('function saveBuiltinAdminRegTabOverrides');
        expect(track).toContain('openAdminRegManageModal({');
        expect(track).toContain('deleteLabel: \'Remove tab\'');
        expect(track).toContain('data-admin-reg-manage-tab=');
        expect(track).toContain('admin-reg-panel-manage-tab-btn');
    });

    it('mounts custom tab manage actions in the registration panel head bundle markup', () => {
        const bundle = readBundleSource();

        expect(bundle).toContain('data-admin-reg-panel-head-actions');
        expect(bundle).toContain('lux-admin-tools-registration-panel-head');
        expect(bundle).toContain('lux-admin-tools-registration-head-actions');
    });

    it('runRegistrationRemoveConfirmation requires two confirm dialogs', () => {
        const ctx = createManageModalVmContext();
        let confirmCount = 0;
        ctx.window.confirm = () => {
            confirmCount += 1;
            return true;
        };

        const verified = ctx.runRegistrationRemoveConfirmation({
            step1Text: 'Delete program "Module A" from Prog?',
            step2Text: 'This permanently removes 2 groups and all subjects under "Module A".'
        });

        expect(verified).toBe(true);
        expect(confirmCount).toBe(2);
    });

    it('runRegistrationRemoveConfirmation aborts when either confirm is rejected', () => {
        const ctx = createManageModalVmContext();

        ctx.window.confirm = () => false;
        expect(ctx.runRegistrationRemoveConfirmation({
            step1Text: 'Delete program "Module A"?',
            step2Text: 'This permanently removes all groups.'
        })).toBe(false);

        let confirmCount = 0;
        ctx.window.confirm = () => {
            confirmCount += 1;
            return confirmCount === 1;
        };
        expect(ctx.runRegistrationRemoveConfirmation({
            step1Text: 'Delete program "Module A"?',
            step2Text: 'This permanently removes all groups.'
        })).toBe(false);
        expect(confirmCount).toBe(2);
    });

    it('buildAdminRegProgramRemoveVerification summarizes group impact', () => {
        const ctx = createManageModalVmContext();
        const verify = ctx.buildAdminRegProgramRemoveVerification('prog', 'Module A', { label: 'Prog' });

        expect(verify.step1Text).toContain('Delete program "Module A" from Prog?');
        expect(verify.step2Text).toContain('2 groups');
        expect(verify.step2Text).toContain('Module A');
    });
});