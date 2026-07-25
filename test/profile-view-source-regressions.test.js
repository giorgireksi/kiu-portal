import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { expectRetiredCss } from './helpers/bare-shell-css.js';

function readAsset(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('Profile view source regressions', () => {
    it('keeps profile-view styles on shared bare stack instead of a dedicated route stylesheet', () => {
        const profileViewHtml = readAsset('profile-view.html');
        const adminActions = readAsset('assets/js/pages/profile-view-admin-actions.js');

        expect(profileViewHtml).not.toContain('assets/css/profile-view-route.css');
        expect(profileViewHtml).toContain('assets/css/lux-page-bare-lite.css');
        expect(profileViewHtml).not.toContain('<style>');
        expect(adminActions).not.toContain('profile-view-route.css');
        expect(adminActions).toContain('assets/css/lux-tokens.css');
        expectRetiredCss('profile-view-route.css');
    });

    it('keeps profile-view page logic in the page module (not inline HTML scripts)', () => {
        const page = readAsset('assets/js/pages/profile-view-page.js');
        const html = readAsset('profile-view.html');

        expect(html).toContain('assets/js/pages/profile-view-page.js');
        expect(page).toContain('PROFILE_VIEW_EMPTY_TEXT');
        expect(page).toContain('data-pv-remove-target');
        expect(page).toContain('[data-pv-remove-target]');
        expect(html).not.toContain('onclick=');
    });
});
