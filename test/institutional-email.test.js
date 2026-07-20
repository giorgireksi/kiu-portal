import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import vm from 'vm';

function loadInstitutionalEmailApi() {
    const context = { window: {} };
    context.window = context;
    vm.runInNewContext(readFileSync(join(process.cwd(), 'assets/js/shared/institutional-email.js'), 'utf8'), context);
    return context;
}

describe('institutional email policy', () => {
    it('buildInstitutionalEmail generates canonical kiu.edu.ge addresses from ids', () => {
        const api = loadInstitutionalEmailApi();
        expect(api.buildInstitutionalEmail('40012')).toBe('40012@kiu.edu.ge');
        expect(api.buildInstitutionalEmail('STF-2026-001')).toBe('stf-2026-001@kiu.edu.ge');
        expect(api.buildInstitutionalEmail('')).toBe('');
    });

    it('isInstitutionalEmail accepts canonical and legacy student domains', () => {
        const api = loadInstitutionalEmailApi();
        expect(api.isInstitutionalEmail('40012@kiu.edu.ge')).toBe(true);
        expect(api.isInstitutionalEmail('nino@student.kiu.edu.ge')).toBe(true);
        expect(api.isInstitutionalEmail('personal@gmail.com')).toBe(false);
    });

    it('resolveRegistrationEmail prefers manual email then falls back to id', () => {
        const api = loadInstitutionalEmailApi();
        expect(api.resolveRegistrationEmail({
            institutionalEmail: 'custom@kiu.edu.ge',
            institutionalId: '40012'
        })).toBe('custom@kiu.edu.ge');
        expect(api.resolveRegistrationEmail({ institutionalId: '40012' })).toBe('40012@kiu.edu.ge');
    });

    it('findDuplicateEmailUser ignores blank emails and the record being edited', () => {
        const api = loadInstitutionalEmailApi();
        const users = [
            { id: '1', email: '' },
            { id: '2', email: '40012@kiu.edu.ge' }
        ];
        expect(api.findDuplicateEmailUser(users, '', '3')).toBeNull();
        expect(api.findDuplicateEmailUser(users, '40012@kiu.edu.ge', '2')).toBeNull();
        expect(api.findDuplicateEmailUser(users, '40012@kiu.edu.ge', '3')?.id).toBe('2');
    });

    it('migrateInstitutionalEmailRecord preserves legacy student aliases', () => {
        const api = loadInstitutionalEmailApi();
        const migrated = api.migrateInstitutionalEmailRecord(
            { email: 'nino@student.kiu.edu.ge', emailAliases: [] },
            '40012@kiu.edu.ge'
        );
        expect(migrated.email).toBe('40012@kiu.edu.ge');
        expect(migrated.emailAliases).toEqual(['nino@student.kiu.edu.ge']);
    });
});
