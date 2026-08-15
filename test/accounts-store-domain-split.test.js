import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');
const accountsService = require('../backend/platform/domains/accounts-service.js');

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('accounts store domain split', () => {
    it('keeps account ownership in accounts-service', () => {
        const source = readSource('backend/platform/store.js');

        expect(Object.keys(accountsService).sort()).toEqual([
            'ensurePersonFromAccount',
            'getAccountByEmail',
            'getAccountById',
            'isSocialEligibleAccount',
            'listAccounts',
            'listSocialAccounts',
            'syncAccountToPortalState',
            'upsertAccount'
        ]);
        expect(source).toContain("} = require('./domains/accounts-service');");
        expect(source).toContain('return listAccounts.call(this, filters);');
        expect(source).toContain('return upsertAccount.call(this, payload, options);');
    });

    it('preserves account directory and person-sync behavior through PlatformStore wrappers', () => {
        const store = new PlatformStore({});

        const created = store.upsertAccount({
            id: 'student-1',
            email: 'student1@example.com',
            displayName: 'Student One',
            nameEn: 'Student One',
            role: 'student',
            facultyCode: 'ECON',
            password: 'Secret!123'
        });

        expect(created?.id).toBe('student-1');
        expect(store.getAccountById('student-1')?.displayName).toBe('Student One');
        expect(store.getAccountByEmail('student1@example.com')?.id).toBe('student-1');
        expect(store.state.people['student-1']?.displayName).toBe('Student One');
        expect(store.ensureCredential('student-1')?.activationRequired).toBe(false);

        const listing = store.listAccounts({ facultyCode: 'ECON', role: 'student', search: 'student' });
        expect(listing.items).toHaveLength(1);
        expect(listing.items[0].id).toBe('student-1');
    });

    it('limits the Social directory to active staff/student directory records', () => {
        const store = new PlatformStore({});
        store.state.portal = {
            state: {
                staffDirectoryRecords: {
                    'PROF-ECON-REAL-1': { id: 'PROF-ECON-REAL-1', status: 'Active', accountStatus: 'active' }
                },
                studentAdminProfiles: {
                    'student-1': { id: 'student-1', status: 'Active', accountStatus: 'active' }
                },
                facultyProfiles: {}
            }
        };
        store.upsertAccount({ id: 'PROF-ECON-REAL-1', email: 'prof@example.com', name: 'Professor', role: 'professor', facultyCode: 'ECON', password: 'Secret!123' });
        store.upsertAccount({ id: 'student-1', email: 'student@example.com', name: 'Student', role: 'student', facultyCode: 'ECON', password: 'Secret!123' });
        store.upsertAccount({ id: 'admin-root', email: 'admin@example.com', name: 'Admin', role: 'admin', password: 'Secret!123' });
        store.upsertAccount({ id: 'student-unregistered', email: 'unregistered@example.com', name: 'Unregistered', role: 'student', password: 'Secret!123' });
        expect(store.listSocialAccounts({ limit: 50 }).items.map((item) => item.id).sort()).toEqual(['PROF-ECON-REAL-1', 'student-1']);

        store.state.portal.state.studentAdminProfiles['student-1'].status = 'Archived';
        expect(store.listSocialAccounts({ limit: 50 }).items.map((item) => item.id)).toEqual(['PROF-ECON-REAL-1']);
    });

    it('does not let stale TA browser metadata disable an active account or revoke its session', () => {
        const store = new PlatformStore({ portalSessionTtlMs: 60 * 60 * 1000 });
        store.state.portal = { state: { staffDirectoryRecords: {}, facultyProfiles: {} } };
        store.state.portal.state.staffDirectoryRecords['TA-ECON-REAL-1'] = {
            id: 'TA-ECON-REAL-1',
            staffTypeId: 'ta',
            facultyCode: 'ECON',
            status: 'Active',
            accountStatus: 'active'
        };
        store.upsertAccount({
            id: 'TA-ECON-REAL-1',
            email: 'real-ta@example.com',
            name: 'Real TA',
            role: 'ta',
            facultyCode: 'ECON',
            accountStatus: 'active',
            password: 'Secret!123'
        });
        const session = store.createSessionByCredentials('real-ta@example.com', 'Secret!123').session;
        const refreshed = store.upsertAccount({
            id: 'TA-ECON-REAL-1',
            email: 'real-ta@example.com',
            role: 'student',
            accountStatus: 'disabled'
        });

        expect(refreshed?.role).toBe('ta');
        expect(refreshed?.accountStatus).toBe('active');
        expect(store.getSession(session.token)?.actualRole).toBe('ta');
    });
});
