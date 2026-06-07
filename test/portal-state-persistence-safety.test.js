import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');

describe('portal state persistence safety', () => {
    it('posts the full sanitized portal persistable snapshot to the backend', () => {
        const source = readFileSync(join(process.cwd(), 'assets/js/app/api.js'), 'utf8');

        expect(source).toContain('function buildPortalBackendPersistableState');
        expect(source).toContain("'homeDashboardPreferencesByUser'");
        expect(source).toContain("'portalMessengerFavorites'");
        expect(source).toContain('state: buildPortalBackendPersistableState(KIU_STATE)');
        expect(source).not.toContain('state: buildPortalPersistableState(KIU_STATE)');
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
});
