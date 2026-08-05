import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const {
    PlatformStore,
    getAdminLibraryPortalValidationError
} = require('../backend/platform/store.js');

describe('portal state persistence safety', () => {
    it('posts the full sanitized portal persistable snapshot to the backend', () => {
        const source = readFileSync(join(process.cwd(), 'assets/js/app/api.js'), 'utf8')
            + readFileSync(join(process.cwd(), 'assets/js/app/api-portal-persist-runtime.js'), 'utf8');

        expect(source).toContain('function buildPortalBackendPersistableState');
        expect(source).toContain("'homeDashboardPreferencesByUser'");
        expect(source).toContain("'portalMessengerFavorites'");
        expect(source).toContain('state: buildPortalBackendPersistableState(KIU_STATE)');
        expect(source).not.toContain('state: buildPortalPersistableState(KIU_STATE)');
        expect(source).toMatch(/buildPortalPersistableState[\s\S]*?delete snapshot\.adminLibrary\.catalogPageSize/);
        expect(source).toMatch(/buildPortalPersistableState[\s\S]*?delete snapshot\.adminLibrary\.catalogPageIndex/);
        expect(source).toMatch(/buildPortalPersistableState[\s\S]*?delete snapshot\.adminLibrary\.droplistFilters/);
    });

    it('merges full incoming portal state while keeping live quiz workspaces server-owned', () => {
        const store = new PlatformStore();
        store.state.portal.state = {
            registrationOpen: false,
            tuitionBalances: {
                'student-1': 400
            }
        };
        store.state.portal.liveQuizWorkspaces = {
            'COURSE::GROUP': { title: 'Server-owned live quiz workspace' }
        };

        const saved = store.savePortalState({
            homeDashboardPreferencesByUser: {
                'student-1': { version: 1 }
            },
            tuitionBalances: {
                'student-1': 0
            },
            lmsLiveQuizzes: {
                overwritten: true
            }
        });

        expect(saved.state.registrationOpen).toBe(false);
        expect(saved.state.tuitionBalances['student-1']).toBe(0);
        expect(saved.state.homeDashboardPreferencesByUser['student-1']).toEqual({ version: 1 });
        expect(saved.state.lmsLiveQuizzes['COURSE::GROUP']).toEqual({ title: 'Server-owned live quiz workspace' });
        expect(saved.state.lmsLiveQuizzes.overwritten).toBeUndefined();
        expect(store.state.portal.liveQuizWorkspaces['COURSE::GROUP']).toEqual({ title: 'Server-owned live quiz workspace' });
    });

    it('stores LMS live quiz workspaces under the dedicated portal owner while preserving the bootstrap state shape', () => {
        const store = new PlatformStore();

        const savedWorkspace = store.saveLmsLiveQuizWorkspace('COURSE::GROUP', {
            title: 'Runtime-owned live quiz workspace'
        });
        const bootstrap = store.createPortalBootstrap();

        expect(savedWorkspace.updatedAt).toBeTruthy();
        expect(store.state.portal.liveQuizWorkspaces['COURSE::GROUP'].title).toBe('Runtime-owned live quiz workspace');
        expect(store.state.portal.state.lmsLiveQuizzes).toBeUndefined();
        expect(bootstrap.state.lmsLiveQuizzes['COURSE::GROUP'].title).toBe('Runtime-owned live quiz workspace');
    });

    it('treats adminLibrary as an admin-only portal key and strips UI-only fields on save', () => {
        const storeSource = readFileSync(join(process.cwd(), 'backend/platform/store.js'), 'utf8');
        expect(storeSource).toMatch(/PORTAL_GLOBAL_ADMIN_ONLY_KEYS[\s\S]*'adminLibrary'/);

        const store = new PlatformStore();
        store.state.portal.state = {
            adminLibrary: {
                books: [{ id: 'keep-me', title: 'Existing' }],
                formSchema: [{ id: 'title' }]
            }
        };

        const rejected = store.savePortalState({
            adminLibrary: {
                books: [{ id: 'student-write', title: 'Should not land' }],
                catalogPageSize: 50,
                catalogPageIndex: 2,
                droplistFilters: { genre: 'Poetry' }
            }
        }, {
            actorUserId: 'student-1',
            allowGlobalWrite: false
        });
        expect(rejected.state.adminLibrary.books).toEqual([{ id: 'keep-me', title: 'Existing' }]);

        const saved = store.savePortalState({
            adminLibrary: {
                books: [{ id: 'lib-1', title: 'Persisted' }],
                formSchema: [{ id: 'title', type: 'text' }],
                catalogPageSize: 50,
                catalogPageIndex: 2,
                droplistFilters: { genre: 'Poetry' }
            }
        }, {
            actorUserId: 'admin-1',
            allowGlobalWrite: true
        });

        expect(saved.state.adminLibrary.books).toEqual([{ id: 'lib-1', title: 'Persisted' }]);
        expect(saved.state.adminLibrary.catalogPageSize).toBeUndefined();
        expect(saved.state.adminLibrary.catalogPageIndex).toBeUndefined();
        expect(saved.state.adminLibrary.droplistFilters).toBeUndefined();
        expect(store.state.portal.state.adminLibrary.catalogPageSize).toBeUndefined();
        expect(store.state.portal.state.adminLibrary.droplistFilters).toBeUndefined();
    });

    it('rejects garbage adminLibrary portal blobs', () => {
        expect(getAdminLibraryPortalValidationError({ books: 'nope' })).toContain('books');
        expect(getAdminLibraryPortalValidationError({ books: [{ title: 'missing id' }] })).toContain('id');
        expect(getAdminLibraryPortalValidationError({ formSchema: ['bad'] })).toContain('objects');

        const store = new PlatformStore();
        expect(() => store.savePortalState({
            adminLibrary: { books: [{ title: 'no-id' }] }
        }, { allowGlobalWrite: true })).toThrow(/id/);
    });
});
