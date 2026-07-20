import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('profile source regressions', () => {
    it('keeps the legacy profile alias and personal-data password shell free of mojibake', () => {
        const profileHtml = readSource('profile.html');
        const personalDataHtml = readSource('personal-data.html');

        expect(profileHtml).not.toContain('Ãƒ');
        expect(profileHtml).not.toContain('ï¿½');
        expect(profileHtml).toContain("window.location.replace('personal-data.html')");
        expect(profileHtml).toContain('Redirecting to Personal Data');
        expect(profileHtml).not.toContain('page-profile');
        expect(profileHtml).not.toContain('profile-shell-tab');

        expect(personalDataHtml).not.toContain('Ãƒ');
        expect(personalDataHtml).not.toContain('ï¿½');
        expect(personalDataHtml).toContain('Current password');
        expect(personalDataHtml).toContain('New password');
        expect(personalDataHtml).toContain('Confirm new password');
        expect(personalDataHtml).toContain('Change password');
        expect(personalDataHtml).toContain('id="personal-data-password-form"');
    });
});
