import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { join } from 'path';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');
const accountPrivilegesService = require('../backend/platform/domains/account-privileges-service.js');

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('account privileges store domain split', () => {
    it('keeps privilege ownership in account-privileges-service', () => {
        const source = readSource('backend/platform/store.js');

        expect(Object.keys(accountPrivilegesService).sort()).toEqual([
            'accountHasPrivilege',
            'getEffectiveAccountPrivileges',
            'getGrantedAccountPrivileges',
            'listPrivilegeDefinitions',
            'updateAccountPrivileges'
        ]);
        expect(source).toContain("} = require('./domains/account-privileges-service');");
        expect(source).toContain('return listPrivilegeDefinitions();');
        expect(source).toContain('return updateAccountPrivileges.call(this, accountId, payload, actorId);');
    });

    it('preserves delegated privilege behavior through PlatformStore wrappers', () => {
        const store = new PlatformStore({});

        store.state.accounts.admin = {
            id: 'admin',
            role: 'admin',
            displayName: 'Admin',
            email: 'admin@example.com'
        };
        store.state.accounts.staff = {
            id: 'staff',
            role: 'student_service',
            displayName: 'Staff',
            email: 'staff@example.com'
        };

        expect(store.listPrivilegeDefinitions().some(item => item.id === 'manage_privileges')).toBe(true);
        expect(store.accountHasPrivilege('admin', 'manage_privileges')).toBe(true);
        expect(store.getEffectiveAccountPrivileges('staff')).toEqual([]);

        const updated = store.updateAccountPrivileges('staff', {
            privileges: ['manage_news', 'manage_privileges', 'manage_news'],
            privilegeNotes: 'Delegated for testing'
        }, 'admin');

        expect(updated?.grantedPrivileges).toEqual(['manage_news', 'manage_privileges']);
        expect(updated?.privilegeNotes).toBe('Delegated for testing');
        expect(store.accountHasPrivilege('staff', 'manage_privileges')).toBe(true);
        expect(store.getGrantedAccountPrivileges('staff')).toEqual(['manage_news', 'manage_privileges']);
    });
});
