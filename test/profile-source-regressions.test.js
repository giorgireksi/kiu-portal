import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('profile source regressions', () => {
    it('keeps the self-profile route free of mojibake in the visible shell templates', () => {
        const html = readSource('profile.html');

        expect(html).not.toContain('Ãƒ');
        expect(html).not.toContain('ï¿½');
        expect(html).toContain('<i class="fas fa-user profile-shell-tab-user-icon"></i> Profile');
        expect(html).toContain('<i class="fas fa-envelope profile-shell-tab-default-icon"></i> Email');
        expect(html).toContain('<i class="fas fa-lock profile-shell-tab-default-icon"></i> Password Change');
        expect(html).toContain('<i class="fas fa-calendar profile-shell-tab-default-icon"></i> My Timetable');
        expect(html).toContain('id="profile-section-title" class="profile-section-title">Profile</div>');
        expect(html).toContain('placeholder="Current password"');
        expect(html).toContain('placeholder="New password, min. 6 characters"');
        expect(html).toContain('placeholder="Repeat password"');
        expect(html).toContain('Password recovery uses your registered mobile number.');
        expect(html).toContain('Contact KIU support if you need an SMS reset code.');
        expect(html).toContain('<button class="profile-shell-disabled-action" type="button">Update</button>');
    });
});
