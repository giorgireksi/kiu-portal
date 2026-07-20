import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('registration CMS persistence', () => {
    it('debounced admin CMS save calls saveState after delay', () => {
        const adminRegistration = readSource('assets/js/pages/admin-registration.js');
        expect(adminRegistration).toContain('function flushAdminRegistrationStateSave');
        expect(adminRegistration).toContain('function persistRegistrationCmsGlobalsToFaculty');
        expect(adminRegistration).toMatch(/adminRegistrationSaveTimer = window\.setTimeout\(\(\) => \{[\s\S]*?flushAdminRegistrationStateSave\(\)/);
    });

    it('flushes CMS save when switching admin registration tabs', () => {
        const adminRegistration = readSource('assets/js/pages/admin-registration.js');
        expect(adminRegistration).toMatch(/function switchAdminRegTab[\s\S]*flushAdminRegistrationStateSave\(\)/);
    });

    it('limits faculty isolation cloning to faculty changes', () => {
        const adminRegistration = readSource('assets/js/pages/admin-registration.js');
        expect(adminRegistration).toContain('const facultyChanged = Boolean(boundRegistrationCmsFaculty');
        const renderFn = adminRegistration.match(
            /function renderAdminRegistrationModules\(tabType\) \{[\s\S]*?\n\}\n\nfunction getCourseEctsValue/
        )?.[0] || '';
        expect(renderFn).not.toContain('ensureRegistrationCmsFacultyIsolation');
    });

    it('persists conc/minor globals and bumps revision in saveState', () => {
        const state = readSource('assets/js/app/state.js');
        expect(state).toContain('persistRegistrationCmsGlobalsToFaculty');
        expect(state).toContain('registrationCmsRevision');
        expect(state).toContain('registrationCmsSavedAt');
        expect(state).toContain('getRegistrationCmsPersistFootprint');
        expect(state).toContain("new CustomEvent('kiu:registration-cms-changed'");
    });

    it('merges richer local registration CMS during portal bootstrap', () => {
        const api = readSource('assets/js/app/api.js');
        const peel = readSource('assets/js/app/api-admin-merge-runtime.js');
        expect(peel).toContain('function mergeRegistrationCmsStateFromLocal');
        expect(api).toContain('function mergePortalStateFromLocal');
        expect(api).toContain('const mergeRegistrationCmsStateFromLocal = window.mergeRegistrationCmsStateFromLocal');
        expect(api).toContain('mergePortalStateFromLocal(localSnapshot, nextState');
        expect(api).not.toContain('function mergeRegistrationCmsStateFromLocal');
    });

    it('merges registration CMS by module count instead of empty local timestamps', () => {
        const api = readSource('assets/js/app/api.js');
        expect(api).toContain('function shouldCopyLocalAdminProgramFacultyBucket');
        expect(api).toContain('function shouldCopyLocalRegistrationCmsConcMinorBucket');
        expect(api).toContain('function getRegistrationCmsSavedAtMs');
        expect(api).toContain('function restoreRemoteRegistrationCmsAfterBootstrapLoss');
        expect(api).toContain('localHadRegistrationCms');
        expect(api).toContain('remoteHadRegistrationCms');
        expect(api).toContain("queuePortalStateSync('registration-cms-reset')");
        expect(api).not.toContain('function shouldPreferLocalAdminProgramFacultyBucket');
    });

    it('keeps richer remote registration CMS when local snapshot is newer but empty', () => {
        const apiSource = readSource('assets/js/app/api.js');
        const peelSource = readSource('assets/js/app/api-admin-merge-runtime.js');
        const persistSource = readSource('assets/js/app/api-portal-persist-runtime.js');
        const vm = require('vm');
        const context = { console, window: {}, localStorage: { getItem: () => null, setItem: () => {} } };
        vm.createContext(context);
        const fnBlock = [
            persistSource.match(/function clonePortalState[\s\S]*?\n\}/)?.[0],
            apiSource.match(/function countAdminRegistrationStructureModules[\s\S]*?\n\}/)?.[0],
            apiSource.match(/function countRegistrationTrackBucketEntries[\s\S]*?\n\}/)?.[0],
            apiSource.match(/function countRegistrationCmsBucketEntries[\s\S]*?\n\}/)?.[0],
            apiSource.match(/function isEmptyAdminProgramFacultyBucket[\s\S]*?\n\}/)?.[0],
            apiSource.match(/function isEmptyRegistrationCmsFacultyBucket[\s\S]*?\n\}/)?.[0],
            apiSource.match(/function getRegistrationCmsRevisionMs[\s\S]*?\n\}/)?.[0],
            apiSource.match(/function getRegistrationCmsSavedAtMs[\s\S]*?\n\}/)?.[0],
            apiSource.match(/function countAdminRegistrationStructureModulesWithTrack[\s\S]*?\n\}/)?.[0],
            apiSource.match(/function shouldCopyLocalAdminProgramFacultyBucket[\s\S]*?\n\}/)?.[0],
            peelSource.match(/function mergeRegistrationCmsStateFromLocal[\s\S]*?\n\}/)?.[0]
        ].filter(Boolean).join('\n\n');
        vm.runInContext(fnBlock, context);
        const local = {
            meta: { portalStateSavedAt: Date.now(), registrationCmsRevision: Date.now() },
            adminProgramStructures: { ECON: { prog: [], free: [], conc: [], minor: [] } }
        };
        const remote = {
            meta: { portalStateSavedAt: 1 },
            adminProgramStructures: {
                ECON: {
                    prog: [{ id: 'M-1', name: 'Server Module', subModules: [] }],
                    free: [],
                    conc: [],
                    minor: []
                }
            }
        };
        context.mergeRegistrationCmsStateFromLocal(local, remote);
        expect(remote.adminProgramStructures.ECON.prog).toHaveLength(1);
        expect(remote.adminProgramStructures.ECON.prog[0].id).toBe('M-1');
    });

    it('re-renders admin registration CMS when revision changes', () => {
        const adminRegistration = readSource('assets/js/pages/admin-registration.js');
        expect(adminRegistration).toContain('function getAdminRegistrationCmsRevision');
        expect(adminRegistration).toContain("addEventListener('kiu:registration-cms-changed'");
        expect(adminRegistration).toContain('container.dataset.cmsRevision === cmsRevision');
        expect(adminRegistration).toContain('bootAdminRegistrationCms(adminRegActiveTab || \'prog\')');
        expect(adminRegistration).toMatch(/async function removeAdminRegSubModule/);
        expect(adminRegistration).toContain('flushPortalStateSync');
    });

    it('strips demo registration CMS entries without wiping admin-authored structures', () => {
        const initialState = readSource('assets/js/data/initial-state.js');
        expect(initialState).toContain('function purgeDemoRegistrationCmsFromState');
        const purgeFn = initialState.match(/function purgeDemoContentFromState[\s\S]*?\n\}/)?.[0] || '';
        expect(purgeFn).toContain('purgeDemoRegistrationCmsFromState');
        expect(purgeFn).not.toContain('createEmptyAdminProgramStructures');
        expect(purgeFn).not.toContain('createEmptyRegistrationCmsByFaculty');
    });

    it('loads enrollment handlers on standalone registration route', () => {
        const html = readSource('registration.html');
        const enrollment = readSource('assets/js/pages/registration-enrollment.js');
        expect(html).toContain('assets/js/pages/registration-enrollment.js');
        expect(enrollment).toContain('function selectCourseGroup');
        expect(enrollment).toContain('function unselectCourseGroup');
        expect(enrollment).toContain('function removeStudentCourseEnrollment');
        expect(enrollment).toContain('window.selectCourseGroup = selectCourseGroup');
    });

    it('routes luxury header add module to registration setup when CMS container exists', () => {
        const bundle = readSource('assets/js/features/index-admin-tools.bundle-source.js');
        const adminRegistration = readSource('assets/js/pages/admin-registration.js');
        const registration = readSource('assets/js/pages/registration.js');
        expect(adminRegistration).toContain('data-admin-reg-add-module="prog"');
        expect(adminRegistration).toMatch(/addNewAdminRegModule\(addModuleTrigger\.dataset\.adminRegAddModule/);
        expect(registration).toContain('function addCurriculumLibraryModule');
        expect(bundle).not.toContain('id="new-subject-semester"');
        expect(bundle).toContain('id="new-subject-semesters"');
        expect(bundle).toContain('initCurriculumSemesterPicker');
    });

    it('invalidates student registration view cache when CMS changes', () => {
        const studentRegistration = readSource('assets/js/pages/student-registration.js');
        expect(studentRegistration).toContain('function invalidateStudentRegistrationViewCache');
        expect(studentRegistration).toContain('registrationCmsRevision');
        expect(studentRegistration).toContain("addEventListener('kiu:registration-cms-changed'");
        expect(studentRegistration).toContain('buildStudentRegistrationFacultyHintNode');
        expect(studentRegistration).toContain('renderStudentRegStructures(activeTab)');
    });

    it('counts trackData entries when deciding CMS bucket richness', () => {
        const api = readSource('assets/js/app/api.js');
        expect(api).toContain('function countRegistrationTrackBucketEntries(bucket)');
        expect(api).toContain('function countAdminRegistrationStructureModulesWithTrack(state, faculty)');
    });

    it('exposes shared 3-step registration remove verification for admin tab delete', () => {
        const shared = readSource('assets/js/pages/registration-shared.js');
        expect(shared).toContain('function runRegistrationRemoveVerification');
        expect(shared).toContain('function buildAdminRegTabRemoveVerification');
    });

    it('flushes admin CMS workspace before role or view-as identity changes', () => {
        const adminRegistration = readSource('assets/js/pages/admin-registration.js');
        const utilities = readSource('assets/js/shared/utilities.js');
        expect(adminRegistration).toContain('function flushAdminToolsWorkspaceBeforeIdentityChange');
        expect(adminRegistration).toContain('window.flushAdminToolsWorkspaceBeforeIdentityChange = flushAdminToolsWorkspaceBeforeIdentityChange');
        expect(adminRegistration).toMatch(/flushAdminToolsWorkspaceBeforeIdentityChange[\s\S]*?getAdminCmsWriteFaculty/);
        expect(adminRegistration).toMatch(/getAdminCmsWriteFaculty[\s\S]*?boundRegistrationCmsFaculty/);
        expect(utilities).toContain('function flushAdminWorkspaceBeforeRoleIdentityChange');
        expect(utilities).toMatch(/fastRedirectRoleSwitch[\s\S]*?flushAdminWorkspaceBeforeRoleIdentityChange[\s\S]*?setActiveSessionUserByRole/);
        expect(utilities).toMatch(/persistAdminImpersonationRoleState[\s\S]*?skipFlush[\s\S]*?reconcileAdminRegistrationCmsAfterIdentityChange/);
    });

    it('rebinds registration CMS globals after portal bootstrap identity changes', () => {
        const adminRegistration = readSource('assets/js/pages/admin-registration.js');
        const api = readSource('assets/js/app/api.js');
        const bundle = readSource('assets/js/features/index-admin-tools.bundle-source.js');
        expect(adminRegistration).toContain('function reconcileAdminRegistrationCmsAfterIdentityChange');
        expect(adminRegistration).toContain('window.reconcileAdminRegistrationCmsAfterIdentityChange = reconcileAdminRegistrationCmsAfterIdentityChange');
        expect(adminRegistration).toMatch(/reconcileAdminRegistrationCmsAfterIdentityChange[\s\S]*?bindFacultyRegistrationCmsData/);
        expect(adminRegistration).toMatch(/bindFacultyRegistrationCmsData[\s\S]*?container\.dataset\.cmsFaculty = fac/);
        expect(api).toMatch(/applyPortalBootstrapState[\s\S]*?reconcileAdminRegistrationCmsAfterIdentityChange/);
        expect(api).toContain('function canMergeLocalPortalSnapshot');
        expect(bundle).toMatch(/renderLuxuryAdminToolsPage[\s\S]*?bindFacultyRegistrationCmsData/);
        expect(bundle).toContain('getAdminRegistrationFaculty');
    });

    it('uses admin CMS write faculty when persisting registration globals in saveState', () => {
        const state = readSource('assets/js/app/state.js');
        const adminRegistration = readSource('assets/js/pages/admin-registration.js');
        expect(state).toMatch(/saveState[\s\S]*?getAdminCmsWriteFaculty/);
        expect(adminRegistration).toContain('window.getAdminCmsWriteFaculty = getAdminCmsWriteFaculty');
    });
});
