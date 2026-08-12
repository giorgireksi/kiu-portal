import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';

const read = (path) => readFileSync(path, 'utf8');

describe('social campus directory synchronization', () => {
    it('requests the authenticated campus-wide directory and paginates it', () => {
        const source = read('assets/js/shared/social-runtime-lite.js');
        expect(source).toContain("scope: 'campus'");
        expect(source).toContain("limit: '200'");
        expect(source).toContain('query.set(\'offset\', String(offset))');
    });

    it('allows the authenticated campus directory scope without faculty filtering', () => {
        const source = read('backend/platform/routes/portal-support-routes.js');
        expect(source).toContain("const campusScope = String(request.query?.scope || '').trim().toLowerCase() === 'campus';");
        expect(source).toContain('campusScope || facultyCode || hasIds');
    });

    it('refreshes social people when an admin creates or updates an account', () => {
        const source = read('backend/platform/routes/admin-integrations-routes.js');
        const auth = read('assets/js/app/auth.js');
        expect(source).toContain("type: 'accounts:directory-updated'");
        expect(auth).toContain("case 'accounts:directory-updated':");
        expect(auth).toContain('window.loadPortalSocialDirectory(true)');
    });
});
