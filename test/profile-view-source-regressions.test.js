import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readAsset(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('Profile view source regressions', () => {
    it('keeps profile-view.html free of mojibake markers and broken day labels', () => {
        const profileViewHtml = readAsset('profile-view.html');

        expect(profileViewHtml).not.toContain('Ã');
        expect(profileViewHtml).not.toContain('�');
        expect(profileViewHtml).toContain("const PROFILE_VIEW_EMPTY_TEXT = 'Not provided';");
        expect(profileViewHtml).toContain("const PROFILE_VIEW_DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];");
        expect(profileViewHtml).toContain("JPG, PNG &middot; Max 5MB");
        expect(profileViewHtml).toContain("Edit Profile &middot; ${person.name}");
    });

    it('keeps modal and profile actions on delegated data attributes instead of inline click handlers', () => {
        const profileViewHtml = readAsset('profile-view.html');
        const inlineHandlerCount = (profileViewHtml.match(/onclick=|onmouseover=|onmouseout=/g) || []).length;

        expect(profileViewHtml).not.toContain('onclick="if(event.target===this)this.remove()"');
        expect(profileViewHtml).not.toContain("onclick=\"document.getElementById('profile-edit-modal').remove()\"");
        expect(profileViewHtml).not.toContain("onclick=\"document.getElementById('pv-session-modal').remove()\"");
        expect(profileViewHtml).not.toContain("onclick=\"document.getElementById('pv-editgroup-modal').remove()\"");
        expect(profileViewHtml).toContain('data-pv-modal-overlay');
        expect(profileViewHtml).toContain('data-pv-remove-target="profile-edit-modal"');
        expect(profileViewHtml).toContain('data-pv-remove-target="pv-session-modal"');
        expect(profileViewHtml).toContain('data-pv-remove-target="pv-editgroup-modal"');
        expect(profileViewHtml).toContain('data-pv-action="save-profile-edit"');
        expect(profileViewHtml).toContain('data-pv-action="create-session"');
        expect(profileViewHtml).toContain('data-pv-action="save-group-edit"');
        expect(profileViewHtml).toContain('data-pv-action="remove-schedule-row"');
        expect(profileViewHtml).toContain('id="pv-session-modal-template"');
        expect(profileViewHtml).toContain('id="pv-editgroup-modal-template"');
        expect(profileViewHtml).toContain('id="pv-schedule-row-template"');
        expect(profileViewHtml).toContain('class="pv-modal-overlay"');
        expect(profileViewHtml).toContain('class="prof-sched-edit-row pv-schedule-edit-row"');
        expect(profileViewHtml).toContain('class="mob-sheet-icon"><i class="fas fa-user-shield"></i></span><span>Admin View</span>');
        expect(profileViewHtml).toContain('data-pv-hover="slot"');
        expect(profileViewHtml).toContain('data-pv-hover="event-card"');
        expect(profileViewHtml).not.toContain('id="pv-session-modal" data-pv-modal-overlay style=');
        expect(profileViewHtml).not.toContain('id="pv-editgroup-modal" data-pv-modal-overlay style=');
        expect(profileViewHtml).not.toContain('class="prof-sched-edit-row" style=');
        expect(profileViewHtml).not.toContain('id="mob-act-admin"><span class="mob-sheet-icon" style=');
        expect(inlineHandlerCount).toBe(0);
    });

    it('keeps profile-view styles in the dedicated route stylesheet instead of inline style blocks', () => {
        const profileViewHtml = readAsset('profile-view.html');
        const routeCss = readAsset('assets/css/profile-view-route.css');

        expect(profileViewHtml).toContain('assets/css/profile-view-route.css?v=20260518-profileview-markup1');
        expect(profileViewHtml).not.toContain('<style>');
        expect(routeCss).toContain('.pv-hero {');
        expect(routeCss).toContain('.pv-modal-overlay {');
        expect(routeCss).toContain('.pv-schedule-edit-row {');
        expect(routeCss).toContain('.lux-route-profile-view .mob-sheet-icon-admin {');
        expect(routeCss).toContain('.em-input:focus {');
        expect(routeCss).toContain('.pvsm-in:focus,');
        expect(routeCss).toContain('.peg-in:focus {');
        expect(routeCss).toContain('@keyframes schModalIn {');
    });

    it('keeps only the overview tab mounted at first render and lazy-mounts the heavier profile tabs from templates', () => {
        const profileViewHtml = readAsset('profile-view.html');

        expect(profileViewHtml).toContain('id="pvtab-0" data-pv-mounted="1"');
        expect(profileViewHtml).toContain('id="pvtab-1" data-pv-mounted="0"');
        expect(profileViewHtml).toContain('id="pvtab-2" data-pv-mounted="0"');
        expect(profileViewHtml).toContain('id="pvtab-3" data-pv-mounted="0"');
        expect(profileViewHtml).toContain('id="pvtab-1-template"');
        expect(profileViewHtml).toContain('id="pvtab-2-template"');
        expect(profileViewHtml).toContain('id="pvtab-3-template"');
        expect(profileViewHtml).toContain('function pvEnsureTabContent(tabId) {');
    });
});
