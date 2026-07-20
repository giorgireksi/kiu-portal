import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('profile route regressions', () => {
    it('aliases legacy profile.html to Personal Data', () => {
        const html = readSource('profile.html');

        expect(html).toContain('url=personal-data.html');
        expect(html).toContain("window.location.replace('personal-data.html')");
        expect(html).toContain('Redirecting to Personal Data');
        expect(html).not.toContain('page-profile');
        expect(html).not.toContain('profile-shell-layout');
    });

    it('keeps left-nav and account menus on personal-data instead of profile-view', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');
        const shell = readSource('assets/js/features/luxury-shell-chrome.js');
        const appJs = readSource('assets/js/app/app.js');

        expect(luxury).not.toContain("['profile-view', 'Profile', 'fas fa-user-circle']");
        expect(luxury).toContain("['personal-data', 'Personal Data', 'far fa-user']");
        expect(shell).toContain('data-nav-target="personal-data">Personal Data</button>');
        expect(shell).not.toContain('data-nav-target="profile-view">Profile</button>');
        expect(appJs).toContain("if (trigger.id === 'mob-act-profile')");
        expect(appJs).toContain("return 'personal-data';");
    });
});
