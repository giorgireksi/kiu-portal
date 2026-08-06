const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('programs route regressions.test', () => {
    it('bare shell: no luxury/surfaces paint sheets; flat bare CSS', () => {
        const html = readSource('programs.html');
        expect(html).toContain('lux-shell.css');
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).not.toMatch(/lux-page-bare\.css(?!-lite)/);
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).toMatch(/class="[^"]*lux-page-bare/);
        // Must not load the shared luxury paint sheet (looks like full design if present)
        expect(html).not.toMatch(/href=["'][^"']*index-luxury\.css/);
        expect(html).not.toMatch(/href=["'][^"']*lux-surfaces\.css/);
        expect(existsSync(join(process.cwd(), 'assets/css', 'programs-route.css'))).toBe(false);
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('body.lux-page-bare');
        expect(bare).not.toMatch(/body\.lux-page-bare\s*\{[^}]*backdrop-filter:\s*none/);
        expect(bare).toContain('.lux-page-shell[data-lux-layout-only="1"]');
        expect(bare).toContain('body.lux-route-programs #page-programs');
        expect(bare).not.toContain('body.lux-route-programs #page-programs .lux-prog-ops-grid');
        expect(bare).not.toContain('body.lux-route-programs #page-programs .lux-prog-ops-panel');
        expect(bare).toContain('.lux-program-grid');
        expect(html).not.toContain('lux-prog-ops-panel');
        expect(html).not.toContain('Program Snapshot');
        expect(html).not.toContain('programs-ops-grid');
        expect(html).toContain('lux-page-bare-lite.css?v=20260806-infopop6');
        expect(html).toContain('programs-page.js?v=20260806-infopop3');
        expect(bare).toContain('.lux-prog-control-band .lux-program-field .lux-picker-btn--compact');
        expect(bare).not.toContain('--prog-fade-');
        const programsBlock = bare.split('/* ── Programs route')[1]?.split('/* ── LMS route')[0] || '';
        expect(programsBlock).toContain('grid-template-columns: 72px minmax(220px, 1.2fr) 88px minmax(180px, 0.9fr) minmax(170px, 0.8fr)');
        expect(programsBlock).toContain('min-width: max(100%, 880px)');
        expect(programsBlock).toContain('.lux-subject-row__mobile-acts');
        expect(programsBlock).toContain('.lux-program-subject-info-overlay');
        expect(programsBlock).toMatch(/@media \(max-width: 960px\)[\s\S]*\.lux-program-detail-columns\s*\{\s*display:\s*none/);
        expect(programsBlock).toMatch(/@media \(max-width: 960px\)[\s\S]*\.lux-program-subject-card[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(0,\s*1fr\)\s+minmax\(0,\s*1fr\)/);
        expect(programsBlock).toMatch(/@media \(max-width: 960px\)[\s\S]*\.lux-program-subject-card[\s\S]*grid-template-areas:\s*"body ects acts"/);
        expect(programsBlock).toMatch(/@media \(max-width: 960px\)[\s\S]*\.lux-subject-row__code\s*\{\s*display:\s*none/);
        expect(programsBlock).toMatch(/@media \(max-width: 960px\)[\s\S]*\.lux-subject-row__secondary[\s\S]*display:\s*none/);
        expect(programsBlock).not.toMatch(/backdrop-filter/);
        expect(readSource('programs.html')).toMatch(/lux-program-command-deck[\s\S]*data-lux-glass-root="1"/);
        const shell = readSource('assets/css/lux-shell.css');
        expect(shell).toContain('body.lux-page-bare .lux-page-shell');
        expect(shell).not.toContain('body.lux-page-bare .lux-page-shell :is(.page-hero, .lux-panel, .lux-alert)');
    });

    it('uses shared control and stat primitives in static shell', () => {
        const html = readSource('programs.html');
        expect(html).toMatch(/id="student-program-search"[^>]*lux-control|class="[^"]*lux-control[^"]*"[^>]*id="student-program-search"/);
        expect(html).toMatch(/id="student-program-semester-filter"[^>]*lux-control|class="[^"]*lux-control[^"]*"[^>]*id="student-program-semester-filter"/);
        expect(html).toMatch(/id="student-program-semester-filter"[^>]*data-lux-picker|data-lux-picker[^>]*id="student-program-semester-filter"/);
        expect(html).toContain('data-lux-picker-label="Semester filter"');
        expect(html).not.toContain('lux-stat lux-soft-chrome home-hover-chip');
        expect(html).not.toContain('lux-prog-ops-panel');
        expect(html).toContain('lux-prog-control-band lux-soft-chrome');
        expect(html).toContain('lux-panel lux-program-command-deck');
        expect(html).toContain('lux-layout-primitives.css');
        expect(html).toContain('lux-page-title');
        expect(html).toContain('lux-section-kicker');
    });

    it('dynamic workspace uses lux-section-card panels and home-hover-chip on matte rows', () => {
        const js = readSource('assets/js/pages/programs-page.js');
        expect(js).toContain('lux-section-card lux-program-shell-section');
        expect(js).toContain('window.enhanceUniversalPickers');
        expect(js).toContain('window.observeUniversalPickers');
        expect(js).not.toMatch(/surface-card lux-program-shell-section/);
        expect(js).toContain('lux-soft-chrome');
        expect(js).toContain('lux-module-option lux-program-module-option lux-soft-chrome home-hover-chip');
        expect(js).toContain('lux-subject-row lux-program-subject-card home-hover-chip');
        expect(js).toContain('lux-subject-row__secondary');
        expect(js).toContain('lux-subject-row__ects');
        expect(js).toContain('lux-subject-row__prerequisite');
        expect(js).toContain('lux-subject-row__semesters');
        expect(js).toContain('does not have');
        expect(js).toMatch(/lux-program-column-ects">ECTS/);
        expect(js).toMatch(/lux-program-column-prerequisite">Prerequisite/);
        expect(js).toMatch(/lux-subject-row__secondary[\s\S]*lux-subject-row__chips/);
        expect(js).not.toContain('lux-program-requirement');
        expect(js).not.toContain('lux-subject-row__stats');
        expect(js).not.toContain('lux-program-column-status');
        expect(js).toContain('lux-subject-row__mobile-acts');
        expect(js).toContain('data-program-info="prerequisite"');
        expect(js).toContain('data-program-info="semesters"');
        expect(js).toContain('Semester distribution of credits');
        expect(js).toContain('openProgramsSubjectInfoDialog');
        expect(js).toContain('programs-subject-info-overlay');
    });

    it('shared layout primitives define curriculum text roles', () => {
        const primitives = readSource('assets/css/lux-layout-primitives.css');
        expect(primitives).toContain('.lux-module-option__meta');
        expect(primitives).toContain('.lux-subject-row__title');
        expect(primitives).toContain('.lux-empty-state__title');
        expect(primitives).toContain('.lux-stat em');
    });

    it('keeps desktop table columns; dense row only on mobile', () => {
        const css = readSource('assets/css/lux-page-bare-lite.css');
        const programsBlock = css.split('/* ── Programs route')[1]?.split('/* ── LMS route')[0] || '';
        expect(programsBlock).toContain('grid-template-columns: 72px minmax(220px, 1.2fr) 88px minmax(180px, 0.9fr) minmax(170px, 0.8fr)');
        expect(programsBlock).toContain('column-gap: 18px');
        expect(programsBlock).toContain('min-width: max(100%, 880px)');
        expect(programsBlock).toMatch(/\.lux-subject-row__mobile-acts\s*\{\s*display:\s*none/);
        expect(programsBlock).toMatch(/@media \(max-width: 960px\)[\s\S]*grid-template-areas:\s*"body ects acts"/);
        expect(programsBlock).toMatch(/@media \(max-width: 960px\)[\s\S]*\.lux-subject-row__mobile-acts[\s\S]*display:\s*inline-flex/);
        expect(programsBlock).not.toContain('body.lux-route-programs #page-programs .lux-program-requirement');
    });

    it('fouc-ht demotes nested programs surfaces inside glass host', () => {
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(fouc).toContain('.lux-prog-control-band.lux-soft-chrome');
        expect(fouc).toContain('.lux-program-shell-section');
        expect(fouc).toContain('.lux-program-module-option');
    });
});
