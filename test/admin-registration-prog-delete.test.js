import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function extractFunctionBody(source, functionName) {
    const match = source.match(new RegExp(`function ${functionName}[\\s\\S]*?\\n\\}`));
    return match?.[0] || '';
}

function createProgDeleteVmContext({ confirmResults = [true, true] } = {}) {
    const vm = require('vm');
    const trackSource = readSource('assets/js/pages/admin-registration-track.js');
    const sharedSource = readSource('assets/js/pages/registration-shared.js');
    const deleteFn = extractFunctionBody(trackSource, 'deleteTrackProgram\\(tabId, name, options');
    const verifyBlockStart = sharedSource.indexOf('function runRegistrationRemoveConfirmation');
    const verifyBlockEnd = sharedSource.indexOf('function purgeStudentRegistrationTrackSelectionForTab');
    const verifyBlock = sharedSource.slice(verifyBlockStart, verifyBlockEnd);

    let confirmIndex = 0;
    const context = {
        console,
        window: {
            confirm: () => {
                const result = confirmResults[confirmIndex] ?? false;
                confirmIndex += 1;
                return result;
            }
        },
        confirm: () => context.window.confirm(),
        KIU_STATE: {
            registrationCMSByFaculty: {
                ECON: {
                    concCourseData: {},
                    minorProgramData: {},
                    trackData: {
                        prog: {
                            'Module A': {
                                Main: { maxEcts: 30, completedEcts: 0, ects: '30/0', courses: [] }
                            },
                            'Module B': {
                                Main: { maxEcts: 30, completedEcts: 0, ects: '30/0', courses: [] }
                            }
                        }
                    },
                    customTabs: []
                }
            }
        },
        adminRegUiState: {
            selectedTrack: {
                prog: { program: 'Module A', groupKey: null }
            }
        },
        normalizeFacultyCode: (value, fallback = 'ECON') => String(value || fallback).trim().toUpperCase() || fallback,
        getAdminRegistrationFaculty: () => 'ECON',
        ensureAdminRegTrackBucket(faculty) {
            const fac = context.normalizeFacultyCode(faculty || 'ECON', 'ECON');
            return context.KIU_STATE.registrationCMSByFaculty[fac];
        },
        getAdminRegTrackData(tabId) {
            const bucket = context.ensureAdminRegTrackBucket('ECON');
            return bucket.trackData?.[tabId] || {};
        },
        getAdminRegSelectedProgram(tabId) {
            return context.adminRegUiState.selectedTrack[tabId]?.program || null;
        },
        setAdminRegSelectedProgram(tabId, program) {
            if (!context.adminRegUiState.selectedTrack[tabId]) {
                context.adminRegUiState.selectedTrack[tabId] = { program: null, groupKey: null };
            }
            context.adminRegUiState.selectedTrack[tabId].program = program || null;
        },
        resolveAdminRegTab(tabId) {
            if (tabId === 'prog') {
                return { id: 'prog', label: 'Prog', builtin: true };
            }
            return null;
        },
        syncAdminRegTrackLegacyMirrors: () => {},
        queueAdminRegistrationStateSave: () => {},
        rerenderAdminRegTrackTab: () => {}
    };

    vm.createContext(context);
    vm.runInContext(verifyBlock, context);
    vm.runInContext(deleteFn, context);
    return context;
}

describe('admin registration program deletion', () => {
    it('prog tab exposes gear manage trigger instead of overflow delete action', () => {
        const track = readSource('assets/js/pages/admin-registration-track.js');
        const renderTabFn = extractFunctionBody(track, 'renderAdminRegTrackTab\\(container, tabConfig\\)');

        expect(track).toContain('buildAdminRegManageGearMarkup');
        expect(track).toContain('data-admin-reg-manage-program=');
        expect(track).toContain('function openAdminRegProgramManage');
        expect(track).not.toContain('data-admin-reg-delete-program=');
        expect(track).not.toContain('buildAdminRegOverflowMenuMarkup');
        expect(renderTabFn).toContain('buildAdminRegManageGearMarkup(`data-admin-reg-manage-program="${escapeHtml(program)}"');
    });

    it('deleteTrackProgram uses two-step confirmation before removal', () => {
        const track = readSource('assets/js/pages/admin-registration-track.js');
        const deleteFn = extractFunctionBody(track, 'deleteTrackProgram\\(tabId, name, options');

        expect(deleteFn).toContain('runRegistrationRemoveConfirmation');
        expect(deleteFn).toContain('buildAdminRegProgramRemoveVerification');
        expect(deleteFn).toContain('options.skipVerification');
        expect(deleteFn).toContain('delete bucket.trackData[tabId][programName]');
    });

    it('deleteTrackProgram does not early-return on builtin prog tab', () => {
        const track = readSource('assets/js/pages/admin-registration-track.js');
        const deleteFn = extractFunctionBody(track, 'deleteTrackProgram\\(tabId, name, options');

        expect(deleteFn).not.toContain('isBuiltinAdminRegTab');
    });

    it('deleteTrackProgram removes program from trackData.prog after verification', () => {
        const ctx = createProgDeleteVmContext();

        ctx.deleteTrackProgram('prog', 'Module A');

        expect(ctx.KIU_STATE.registrationCMSByFaculty.ECON.trackData.prog['Module A']).toBeUndefined();
        expect(ctx.KIU_STATE.registrationCMSByFaculty.ECON.trackData.prog['Module B']).toBeDefined();
        expect(ctx.getAdminRegSelectedProgram('prog')).toBe('Module B');
    });

    it('deleteTrackProgram aborts when two-step verification is rejected', () => {
        const ctx = createProgDeleteVmContext({ confirmResults: [true, false] });

        ctx.deleteTrackProgram('prog', 'Module A');

        expect(ctx.KIU_STATE.registrationCMSByFaculty.ECON.trackData.prog['Module A']).toBeDefined();
        expect(ctx.getAdminRegSelectedProgram('prog')).toBe('Module A');
    });
});