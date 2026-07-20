import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('admin profile-view redirect', () => {
    it('routes impersonating admins away from profile-view in navigation', () => {
        const navigation = readSource('assets/js/features/navigation.js');

        expect(navigation).toContain('function shouldRedirectProfileViewToPersonalData()');
        expect(navigation).toContain('isAdminImpersonationMode()');
        expect(navigation).toContain("appendPortalViewQuery('personal-data.html', role)");
        expect(navigation).toContain("appendPortalViewQuery('personal-data.html', effectiveRole)");
    });

    it('guards profile-view.html bootstrap for admin impersonation', () => {
        const profileView = readSource('profile-view.html');

        expect(profileView).toContain('isAdminImpersonationMode()');
        expect(profileView).toContain("appendPortalViewQuery('personal-data.html', role)");
        expect(profileView).toContain('window.location.replace(target)');
    });

    it('keeps admin hubs free of the retired directories module', () => {
        const students = readSource('assets/js/pages/students-command-center.js');
        const staff = readSource('assets/js/pages/staff-command-center.js');
        expect(students).not.toContain('assets/js/pages/directories.js');
        expect(staff).not.toContain('assets/js/pages/directories.js');
    });

    it('removes canonical profile bridge from admin hubs', () => {
        const students = readSource('assets/js/pages/students-command-center.js');
        const staff = readSource('assets/js/pages/staff-command-center.js');

        expect(students).not.toContain('open-platform-profile');
        expect(students).not.toContain('ensureDirectoryProfileBridge');
        expect(staff).not.toContain('open-platform-profile');
        expect(staff).not.toContain('ensureDirectoryProfileBridge');
    });

    it('points admin shell profile nav at personal-data', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');
        const adminNavMatch = luxury.match(/admin:\s*\[([\s\S]*?)\],\s*student_service:/);

        expect(luxury).toContain("['personal-data', 'Personal Data', 'far fa-user']");
        expect(adminNavMatch?.[1] || '').not.toContain('profile-view');
    });
});