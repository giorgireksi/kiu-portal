const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('students admin route regressions.test', () => {
    it('bare shell: no luxury/surfaces paint sheets; flat bare CSS', () => {
        const html = readSource('students-admin.html');
        expect(html).toContain('lux-shell.css');
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).not.toMatch(/lux-page-bare\.css(?!-lite)/);
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).toMatch(/class="[^"]*lux-page-bare/);
        // Must not load the shared luxury paint sheet (looks like full design if present)
        expect(html).not.toMatch(/href=["'][^"']*index-luxury\.css/);
        expect(html).not.toMatch(/href=["'][^"']*lux-surfaces\.css/);
        expect(existsSync(join(process.cwd(), 'assets/css', 'students-admin-lms.css'))).toBe(false);
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('body.lux-page-bare');
        expect(bare).not.toMatch(/body\.lux-page-bare\s*\{[^}]*backdrop-filter:\s*none/);
        const shell = readSource('assets/css/lux-shell.css');
        expect(shell).toContain('body.lux-page-bare .lux-page-shell');
        expect(shell).not.toContain('body.lux-page-bare .lux-page-shell :is(.page-hero, .lux-panel, .lux-alert)');
    });

    it('eager-loads student form builder with student namespace (not staff data attrs)', () => {
        const html = readSource('students-admin.html');
        const builderJs = readSource('assets/js/pages/form-builder-runtime.js');
        const studentsJs = readSource('assets/js/pages/students-command-center.js');
        const actionsJs = readSource('assets/js/pages/form-builder-actions-runtime.js');
        expect(html).toContain('student-form-builder-runtime.js');
        expect(html).toContain('form-builder-runtime.js');
        expect(html).toContain('form-builder-actions-runtime.js');
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('.students-hub-builder-layout');
        expect(bare).toContain('.students-hub-form-settings-head');
        expect(bare).toContain('.students-hub-directory-panel');
        expect(bare).toContain('.students-hub-controls-head');
        expect(bare).toMatch(/students-hub-filter-deck-grid[\s\S]*display:\s*grid/);
        expect(bare).toMatch(/students-hub-controls[\s\S]*lux-picker-field > \.lux-picker-btn--compact/);
        expect(bare).not.toMatch(/students-hub-filter-deck-grid\s*\{[^}]*border-width:\s*1px[^}]*box-shadow:\s*none/);
        expect(bare).toContain('repeat(auto-fill, minmax(170px, 1fr))');
        expect(bare).toContain('background: rgba(var(--lux-accent-rgb), 0.03)');
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(fouc).toContain('.students-hub-controls');
        expect(fouc).not.toMatch(/\.students-hub-filter-deck[\s\S]*?backdrop-filter:\s*var\(--lux-panel-blur-filter\)/);
        const directoryJs = readSource('assets/js/pages/directory-filters-runtime.js');
        expect(directoryJs).not.toContain('useCompactDeck');
        expect(directoryJs).toContain('filter-deck-section--primary is-compact');
        expect(directoryJs).not.toContain('filter-deck-section--fields');
        expect(directoryJs).not.toContain('filter-deck-section--droplist-search');
        expect(directoryJs).toContain("searchInputId: 'student-search'");
        expect(directoryJs).toContain('data-lux-btn-density="dense"');
        expect(directoryJs).not.toContain('No active filters');
        expect(directoryJs).not.toContain('command-bar');
        expect(bare).toMatch(/\.students-hub-controls--adaptive[\s\S]{0,200}padding:\s*12px/);
        expect(bare).toMatch(/filter-deck-section--primary\.is-compact[\s\S]{0,160}repeat\(auto-fill,\s*minmax\(200px,\s*1fr\)\)/);
        expect(bare).toMatch(/\.students-hub-filter-deck-section--primary\.is-compact \.students-hub-field--compact[\s\S]{0,200}min-width:\s*0/);
        expect(builderJs).toContain('lux-section-kicker');
        expect(builderJs).toContain('section-title lux-card-title');
        expect(builderJs).toContain('section-copy lux-panel-copy');
        expect(builderJs).toContain('builder-rail lux-soft-chrome home-hover-chip');
        expect(builderJs).toContain('builder-canvas lux-soft-chrome home-hover-chip');
        expect(builderJs).toContain('data-lux-glass-root="1"');
        expect(builderJs).toContain('profile-panel lux-data-card home-hover-chip');
        expect(builderJs).toContain('section-field-workspace lux-data-card home-hover-chip');
        expect(builderJs).toContain('profile-row home-hover-chip');
        expect(builderJs).toContain('studio-field-row home-hover-chip');
        expect(builderJs).toContain('studio-quick-btn home-hover-chip');
        expect(readSource('assets/css/lux-layout-primitives.css')).toContain('.students-hub-section-title.lux-card-title');
        expect(fouc).toContain('.students-hub-builder-rail.lux-soft-chrome.home-hover-chip');
        expect(fouc).toContain('#students-content');
        expect(bare).toContain('.students-hub-form-settings[data-lux-glass-root="1"]');
        expect(bare).not.toMatch(/\.students-hub-profile-row\.home-hover-chip[\s\S]*?background:\s*var\(--lux-hub-row/);
        expect(html).toContain('hubbuilder1');
        expect(builderJs).toContain("data-${H.data}-builder-action");
        expect(actionsJs).toContain("'__studentFormBuilderBound'");
        expect(studentsJs).toContain('__studentFormBuilderBound');
        expect(studentsJs).toContain("__KIU_FORM_BUILDER_NS__ = 'student'");
    });

    it('wires directory hub shell glass host and hover panels', () => {
        const studentsJs = readSource('assets/js/pages/students-command-center.js');
        const staffJs = readSource('assets/js/pages/staff-command-center.js');
        const directoryJs = readSource('assets/js/pages/directory-filters-runtime.js');
        const sharedJs = readSource('assets/js/pages/command-center-shared-utils.js');
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        const bare = readSource('assets/css/lux-page-bare-lite.css');

        expect(studentsJs).toContain("event.target.id === 'student-search'");
        expect(studentsJs).toContain("event.target.id === 'student-droplist-search'");
        expect(studentsJs).toContain('class="students-hub-shell" data-lux-glass-root="1"');
        expect(studentsJs).toContain('students-hub-controls students-admin-controls students-hub-controls--adaptive home-hover-chip');
        expect(studentsJs).toContain('students-hub-directory-panel home-hover-chip');
        expect(staffJs).toContain('class="staff-hub-shell" data-lux-glass-root="1"');
        expect(staffJs).toContain('staff-hub-controls staff-admin-controls staff-hub-controls--adaptive home-hover-chip');
        expect(staffJs).toContain('staff-hub-directory-panel home-hover-chip');
        expect(directoryJs).toContain('result-pill home-hover-chip');
        expect(sharedJs).toContain('lux-status-pill home-hover-chip');
        expect(fouc).toContain('.students-hub-controls');
        expect(fouc).toContain('.students-hub-controls.home-hover-chip');
        expect(fouc).toContain('.students-hub-directory-panel.home-hover-chip');
        expect(bare).toContain('.students-hub-controls.home-hover-chip .students-hub-filter-deck');
    });

    it('densifies students/staff directory panel head, table, and person cells', () => {
        const studentsJs = readSource('assets/js/pages/students-command-center.js');
        const staffJs = readSource('assets/js/pages/staff-command-center.js');
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const studentsHtml = readSource('students-admin.html');
        const staffHtml = readSource('staff.html');

        expect(studentsJs).toContain('students-hub-section-title lux-card-title">Records</h2>');
        expect(studentsJs).toMatch(/students-hub-directory-head[\s\S]*?data-lux-btn-density="dense"/);
        expect(studentsJs).not.toContain('students-hub-overline lux-section-kicker">Student directory');
        expect(studentsJs).not.toContain('Operational records');
        expect(studentsJs).not.toContain('Open full profile pages, review readiness, and act on enrollment');

        expect(staffJs).toContain('staff-hub-section-title lux-card-title">Records</h2>');
        expect(staffJs).toMatch(/staff-hub-directory-head[\s\S]*?data-lux-btn-density="dense"/);
        expect(staffJs).not.toContain('staff-hub-overline lux-section-kicker">Staff directory');
        expect(staffJs).not.toContain('Operational records');
        expect(staffJs).not.toContain('Open full profile pages, review readiness, and act on account');
        expect(staffJs).not.toMatch(/staff-hub-inline-actions lux-btn-row-stack">\s*<button class="lux-primary-btn"[^>]*data-staff-action="select"/);
        expect(staffJs).toMatch(/staff-hub-inline-actions" data-lux-btn-density="dense">\s*<button class="lux-primary-btn"[^>]*data-staff-action="select"/);
        expect(studentsJs).toMatch(/students-hub-inline-actions" data-lux-btn-density="dense">\s*<button class="lux-primary-btn"[^>]*data-student-action="select"/);

        expect(bare).toMatch(/\.students-hub-directory-panel[\s\S]*?padding:\s*12px/);
        expect(bare).toMatch(/\.staff-hub-directory-panel[\s\S]*?padding:\s*12px/);
        expect(bare).toMatch(/\.students-hub-directory-head[\s\S]*?align-items:\s*center[\s\S]*?gap:\s*10px/);
        expect(bare).toMatch(/\.students-hub-directory-head \.students-hub-section-title[\s\S]*?font-size:\s*15px/);
        expect(bare).toMatch(/\.students-hub-table[\s\S]*?min-width:\s*960px/);
        expect(bare).toMatch(/\.students-hub-table th[\s\S]*?padding:\s*6px 8px/);
        expect(bare).toMatch(/\.students-hub-person[\s\S]*?padding:\s*0/);
        expect(bare).toMatch(/\.students-hub-avatar[\s\S]*?width:\s*32px[\s\S]*?height:\s*32px[\s\S]*?border-radius:\s*10px/);
        expect(bare).toMatch(/\.students-hub-table \.students-hub-inline-actions[\s\S]*?gap:\s*6px/);
        expect(bare).toMatch(/\.students-hub-table \.students-hub-name[\s\S]*?font-size:\s*13px/);
        expect(bare).toMatch(/\.students-hub-table \.students-hub-meta[\s\S]*?margin-top:\s*2px[\s\S]*?font-size:\s*11px/);
        expect(bare).toMatch(/\.students-hub-table \.students-hub-progress[\s\S]*?gap:\s*4px[\s\S]*?min-width:\s*88px/);
        expect(bare).toMatch(/\.students-hub-table \.students-hub-progress-track[\s\S]*?height:\s*5px/);
        expect(bare).toMatch(/\.students-hub-table \[data-lux-btn-density="dense"\][\s\S]*?min-height:\s*28px/);

        expect(studentsHtml).toContain('hubrecords2');
        expect(staffHtml).toContain('hubrecords2');
    });
});
