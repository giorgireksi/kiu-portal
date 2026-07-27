const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('exams route regressions.test', () => {
    it('bare shell: no luxury/surfaces paint sheets; flat bare CSS', () => {
        const html = readSource('exams.html');
        expect(html).toContain('lux-shell.css');
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).toContain('api-portal-persist-runtime.js');
        expect(html.indexOf('api-portal-persist-runtime.js')).toBeLessThan(html.indexOf('assets/js/app/api.js'));
        expect(html).not.toMatch(/lux-page-bare\.css(?!-lite)/);
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).toMatch(/class="[^"]*lux-page-bare/);
        // Must not load the shared luxury paint sheet (looks like full design if present)
        expect(html).not.toMatch(/href=["'][^"']*index-luxury\.css/);
        expect(html).not.toMatch(/href=["'][^"']*lux-surfaces\.css/);
        expect(existsSync(join(process.cwd(), 'assets/css', 'exam-studio.css'))).toBe(false);
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('body.lux-page-bare');
        expect(bare).toContain('/* ── Exams command center');
        expect(bare).toContain('body.lux-route-exams #admin-exams-root .ex2-workspace-panel');
        expect(bare).toContain('body.lux-route-exams #admin-exams-root .ex2-tab');
        expect(bare).not.toMatch(/--exam-fade-/);
        const fadePass = bare.slice(bare.indexOf('Luxury theme fade pass'), bare.indexOf('/* Migrated from exams-console'));
        expect(fadePass).not.toContain('ex2-stat-card');
        expect(fadePass).not.toContain('ex2-progress-step');
        expect(fadePass).not.toContain('ex2-panel');
        expect(bare).toContain('body.lux-route-exams #admin-exams-root .ex2-status {');
        expect(bare).toContain('body.lux-route-exams #admin-exams-root .ex2-summary-group-label');
        expect(bare).toContain('body.lux-route-exams #admin-exams-root .ex2-builder-step-body.is-entering');
        expect(bare).toContain('body.lux-route-exams #admin-exams-root .ex2-btn:disabled');
        expect(bare).toContain('body.lux-route-exams #admin-exams-root .ex2-input:hover:not(:disabled)');
        expect(bare).toContain('body.lux-route-exams #admin-exams-root .ex2-field--picker .lux-picker-btn--compact');
        expect(bare).toContain('body.lux-route-exams #admin-exams-root .ex2-btn.is-secondary:hover');
        const migrated = bare.slice(bare.indexOf('/* Migrated from exams-console'), bare.indexOf('/* Review queue board'));
        expect(migrated).not.toMatch(/#admin-exams-root \.ex2-btn,\s*\n\s*#admin-exams-root \.ex2-step/);
        expect(fadePass).not.toContain('ex2-auto-gen-box');
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(fouc).toContain('body.lux-route-exams #admin-exams-root .ex2-stat-chip');
        expect(fouc).toContain('body.lux-route-exams #admin-exams-root .ex2-summary-chip');
        expect(fouc).toContain('body.lux-route-exams #admin-exams-root .ex2-qnav-bar');
        expect(fouc).toContain('body.lux-route-exams #admin-exams-root .ex2-question-card');
        expect(fouc).toContain('body.lux-route-exams #admin-exams-root .ex2-auto-gen-box');
        expect(fouc).toContain('body.lux-route-exams #admin-exams-root .ex2-panel');
        expect(fouc).toContain('body.lux-route-exams #admin-exams-root .ex2-session-summary-card');
        expect(fouc).toContain('.ex2-panel:not(:has(.lux-universal-picker-field))');
        const builder = readSource('assets/js/pages/exams-console-builder.js');
        expect(builder).toContain('ex2-summary-chip lux-soft-chrome');
        expect(builder).toContain('ex2-question-card lux-soft-chrome');
        expect(builder).toContain('ex2-qnav-bar lux-soft-chrome');
        expect(builder).toContain('ex2-auto-gen-box lux-soft-chrome');
        expect(fouc).toContain('body.lux-unified-shell.lux-route-exams #admin-exams-root :is(');
        expect(fouc).toContain('.ex2-rq-column');
        expect(fouc).toContain('var(--home-chip-hover-lift, -3px)');
        const admin = readSource('assets/js/pages/exams-console-admin.js');
        expect(admin).toContain('ex2-rq-column lux-soft-chrome');
        expect(admin).toContain('ex2-rq-card lux-soft-chrome');
        expect(admin).toContain('ex2-panel lux-soft-chrome');
        expect(admin).toContain('ex2-session-summary-card lux-soft-chrome');
        expect(admin).toContain('ex2-field--picker');
        const attempts = readSource('assets/js/pages/exams-console-attempts.js');
        expect(attempts).toContain('ex2-panel lux-soft-chrome');
        expect(attempts).toContain('ex2-empty-state lux-soft-chrome');
        expect(attempts).toContain('ex2-select-card lux-soft-chrome');
        expect(attempts).toContain('ex2-activity-metric lux-soft-chrome');
        const workspace = readSource('assets/js/pages/exams-console-workspace-runtime.js');
        expect(workspace).not.toContain('lux-modern-surface');
        expect(readSource('assets/js/pages/exams-console.js')).toContain('ex2-stat-chip lux-soft-chrome');
        const shell = readSource('assets/css/lux-shell.css');
        expect(shell).toContain('body.lux-page-bare .lux-page-shell');
        expect(shell).not.toContain('body.lux-page-bare .lux-page-shell :is(.page-hero, .lux-panel, .lux-alert)');
    });
});
