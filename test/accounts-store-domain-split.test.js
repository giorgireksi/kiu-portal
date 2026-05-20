import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import { readFileSync } from 'fs';
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
            'listAccounts',
            'upsertAccount'
        ]);
        expect(source).toContain("} = require('./domains/accounts-service');");
        expect(source).toContain('return listAccounts.call(this, filters);');
        expect(source).toContain('return upsertAccount.call(this, payload);');
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
});
