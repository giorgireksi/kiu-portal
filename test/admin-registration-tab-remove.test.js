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

function createTabRemoveVmContext() {
    const vm = require('vm');
    const sharedSource = readSource('assets/js/pages/registration-shared.js');
    const verifyStart = sharedSource.indexOf('function normalizeRegistrationRemoveVerificationToken');
    const verifyEnd = sharedSource.indexOf('__kiuRegSharedExpose({', verifyStart);
    const verifyBlock = sharedSource.slice(verifyStart, verifyEnd);

    const context = {
        console,
        window: {
            confirm: () => true,
            prompt: () => 'CUSTOM_1'
        },
        KIU_STATE: {
            meta: {},
            registrationCMSByFaculty: {
                ECON: {
                    concCourseData: {},
                    minorProgramData: {},
                    trackData: {
                        custom_1: {
                            'Lane Program': {
                                Main: { maxEcts: 30, completedEcts: 0, ects: '30/0', courses: [] }
                            }
                        }
                    },
                    customTabs: [{ id: 'custom_1', label: '1', studentTabId: 'custom_1' }]
                }
            },
            studentRegistrationTrackSelection: {
                'student::ECON': { custom_1: 'Lane Program' },
                custom_1: 'legacy'
            }
        },
        normalizeFacultyCode: (value, fallback = 'ECON') => String(value || fallback).trim().toUpperCase() || fallback,
        showToast: () => {}
    };

    vm.createContext(context);
    vm.runInContext(verifyBlock, context);
    return context;
}

describe('admin registration custom tab removal', () => {
    it('exposes panel-head manage tab UI and 3-step verification in source', () => {
        const track = readSource('assets/js/pages/admin-registration-track.js');
        const shared = readSource('assets/js/pages/registration-shared.js');
        const bundle = readSource('assets/js/features/index-admin-tools.bundle-source.js');
        const css = readSource('assets/css/lux-page-bare-lite.css');

        expect(track).toContain('function renderAdminRegPanelHeadActions');
        expect(track).toContain('function openAdminRegTabManage');
        expect(track).toContain('data-admin-reg-panel-head-actions');
        expect(track).toContain('data-admin-reg-manage-tab=');
        expect(track).toContain('admin-reg-panel-manage-tab-btn');
        expect(track).toContain('deleteLabel: \'Remove tab\'');
        expect(track).toContain('function hideBuiltinAdminRegTab');
        expect(track).toContain('hiddenBuiltinTabs');
        expect(track).not.toContain('if (!tabConfig || tabConfig.builtin)');
        expect(track).toContain('runRegistrationRemoveVerification');
        expect(track).toContain('buildAdminRegTabRemoveVerification');
        expect(track).toContain('purgeStudentRegistrationTrackSelectionForTab');
        expect(track).not.toContain('admin-reg-tab-delete-btn');
        expect(track).not.toContain('data-admin-reg-delete-tab=');
        expect(track).not.toContain('admin-reg-overflow-menu');
        expect(bundle).toContain('data-admin-reg-panel-head-actions');
        expect(shared).toContain('function runRegistrationRemoveVerification');
        expect(css).toContain('.admin-reg-tab-tray');
    });

    it('requires typed tab id for 3-step verification', () => {
        const ctx = createTabRemoveVmContext();
        const verified = ctx.runRegistrationRemoveVerification(
            ctx.buildAdminRegTabRemoveVerification('custom_1', { label: '1' }, 1)
        );
        expect(verified).toBe(true);

        ctx.window.prompt = () => 'WRONG';
        const rejected = ctx.runRegistrationRemoveVerification(
            ctx.buildAdminRegTabRemoveVerification('custom_1', { label: '1' }, 1)
        );
        expect(rejected).toBe(false);
    });

    it('purges student track selection keys for removed tab', () => {
        const ctx = createTabRemoveVmContext();
        ctx.purgeStudentRegistrationTrackSelectionForTab('custom_1', 'custom_1');
        expect(ctx.KIU_STATE.studentRegistrationTrackSelection.custom_1).toBeUndefined();
        expect(ctx.KIU_STATE.studentRegistrationTrackSelection['student::ECON'].custom_1).toBeUndefined();
    });

    it('student route falls back when active custom tab is removed', () => {
        const studentRegistration = readSource('assets/js/pages/student-registration-choice-runtime.js');
        expect(studentRegistration).toContain('getStudentRegistrationTabsForFaculty(faculty)');
        expect(studentRegistration).toContain("activeTab = 'prog'");
    });
});