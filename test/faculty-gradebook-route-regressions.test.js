const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('faculty gradebook route regressions.test', () => {
    it('bare shell: no luxury/surfaces paint sheets; flat bare CSS', () => {
        const html = readSource('faculty-gradebook.html');
        expect(html).toContain('lux-shell.css');
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).not.toMatch(/lux-page-bare\.css(?!-lite)/);
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).toMatch(/class="[^"]*lux-page-bare/);
        // Must not load the shared luxury paint sheet (looks like full design if present)
        expect(html).not.toMatch(/href=["'][^"']*index-luxury\.css/);
        expect(html).not.toMatch(/href=["'][^"']*lux-surfaces\.css/);
        expect(existsSync(join(process.cwd(), 'assets/css', 'faculty-gradebook-route.css'))).toBe(false);
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('body.lux-page-bare');
        expect(bare).not.toMatch(/body\.lux-page-bare\s*\{[^}]*backdrop-filter:\s*none/);
        expect(bare).toContain('.lux-page-shell[data-lux-layout-only="1"]');
        const shell = readSource('assets/css/lux-shell.css');
        expect(shell).toContain('body.lux-page-bare .lux-page-shell');
        expect(shell).not.toContain('body.lux-page-bare .lux-page-shell :is(.page-hero, .lux-panel, .lux-alert)');
        expect(html).toContain('data-lux-layout-only="1"');
        expect(html).toMatch(/lux-faculty-command-deck[\s\S]*data-lux-glass-root="1"/);
        expect(html).toContain('lux-modals.css');
        expect(html).toContain('lux-glass-dialog.js');
    });

    it('shared bare CSS: faculty command-deck layout and fouc-ht matte inners', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(bare).toContain('body.lux-route-faculty-gradebook .lux-fg-control-band');
        expect(bare).toContain('body.lux-route-faculty-gradebook .lux-fg-ops-grid');
        expect(bare).toContain('body.lux-route-faculty-gradebook .lux-faculty-command-deck.lux-summary-surface--hero');
        expect(bare).toContain('body:is(.lux-route-lms, .lux-route-faculty-gradebook) .gb-lms-staff-layout');
        expect(fouc).toContain('.lux-fg-filters');
        expect(fouc).toContain('.lux-fg-ops-tile');
        expect(fouc).toContain('.gb-lms-staff-roster-row');
        expect(fouc).toContain('body.lux-route-faculty-gradebook .lux-faculty-command-deck[data-lux-glass-root="1"]');
    });

    it('faculty gradebook: shared typography, modal scope, and light-mode badge readability', () => {
        const html = readSource('faculty-gradebook.html');
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const staff = readSource('assets/js/pages/gradebook-staff.js');

        expect(html).toContain('lms-route-field-label');
        expect(html).toMatch(/label[^>]*for="fs-filter-sem"[^>]*class="[^"]*lms-route-field-label/);
        expect(html).toContain('lux-fouc-ht.css?v=20260806-hidetopbar2');
        expect(html).toContain('lux-page-bare-lite.css?v=20260816-lms-gradecompact2');

        expect(bare).toContain('#gradebook-score-edit-modal');
        expect(bare).toContain('#gradebook-comment-modal');
        expect(bare).toContain('.gb-lms-staff-student-hero.lux-soft-chrome');
        expect(bare).toContain('.gb-lms-staff-student-hero-actions');
        expect(bare).toMatch(/:is\(html\.lux-light-mode, body\.lux-light-mode\)[\s\S]*\.gb-letter-badge\.grade-f/);
        expect(bare).toMatch(/:is\(html\.lux-light-mode, body\.lux-light-mode\)[\s\S]*\.gb-status-badge\.lux-status-pill\.is-missing/);
        expect(bare).toContain('.lux-route-faculty-gradebook .lux-faculty-command-deck .lux-page-kicker');
        expect(bare).toMatch(/\.lux-fg-ops-head strong[\s\S]*color:\s*var\(--lux-text\)/);

        expect(staff).toContain('lux-fg-assessment-field lms-route-field-label');
        expect(staff).toContain('gb-lms-staff-student-hero lms-route-card lms-route-panel-compact lux-soft-chrome');
        expect(staff).toContain('lms-route-meta-12');
    });
});
