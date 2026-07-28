const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('study card route regressions.test', () => {
    it('bare shell: no luxury/surfaces paint sheets; flat bare CSS', () => {
        const html = readSource('study-card.html');
        expect(html).toContain('lux-shell.css');
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).not.toMatch(/lux-page-bare\.css(?!-lite)/);
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).toMatch(/class="[^"]*lux-page-bare/);
        // Must not load the shared luxury paint sheet (looks like full design if present)
        expect(html).not.toMatch(/href=["'][^"']*index-luxury\.css/);
        expect(html).not.toMatch(/href=["'][^"']*lux-surfaces\.css/);
        expect(existsSync(join(process.cwd(), 'assets/css', 'study-card-route.css'))).toBe(false);
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('body.lux-page-bare');
        expect(bare).not.toMatch(/body\.lux-page-bare\s*\{[^}]*backdrop-filter:\s*none/);
        expect(bare).toContain('.lux-page-shell[data-lux-layout-only="1"]');
        const shell = readSource('assets/css/lux-shell.css');
        expect(shell).toContain('body.lux-page-bare .lux-page-shell');
        expect(shell).not.toContain('body.lux-page-bare .lux-page-shell :is(.page-hero, .lux-panel, .lux-alert)');
        expect(html).toContain('data-lux-layout-only="1"');
        expect(html).toContain('lux-layout-primitives.css');
        expect(html).toContain('lms-route-select lux-control');
        expect(html).toContain('study-card-control-band lux-soft-chrome home-hover-chip');
        expect(html).toContain('study-card-command-deck');
        expect(html).toMatch(/study-card-command-deck[\s\S]*data-lux-glass-root="1"/);
        expect(bare).toContain('body.lux-route-study-card');
        expect(bare).toContain('.study-card-summary-stage.lux-hero-stage');
        expect(bare).toContain('.study-card-gradebook-overlay .gb-weight-row');
        const studyCardJs = readSource('assets/js/pages/study-card-page.js');
        expect(studyCardJs).toContain('study-card-summary-main lux-soft-chrome home-hover-chip');
        expect(studyCardJs).toContain('lux-focus-panel study-card-summary-focus lux-soft-chrome home-hover-chip');
        expect(studyCardJs).toContain('lux-hero-signal home-hover-chip');
        expect(studyCardJs).not.toContain('study-card-summary-signals');
        expect(bare).toContain('.study-card-summary-focus.home-hover-chip');
        expect(bare).toContain('.study-card-summary-focus .lux-focus-panel__meta > span.lux-hero-signal');
        expect(bare).not.toContain('.study-card-summary-signals .lux-hero-signal::before');
        expect(bare).toContain('body.lux-route-study-card .study-card-summary-focus :is(.lux-focus-panel__title, .lux-focus-panel__copy)');
        expect(bare).toContain('body.lux-route-study-card .study-card-summary-focus.lux-focus-panel');
        expect(studyCardJs).toContain('study-card-term-row lux-soft-chrome home-hover-chip');
        expect(studyCardJs).toContain('study-card-term-header lux-soft-chrome home-hover-chip');
        expect(studyCardJs).toContain('lms-route-field-label study-card-heading');
        expect(studyCardJs).toContain('lux-empty-state__title lms-route-empty-title');
        expect(studyCardJs).toContain('resolveStudyCardScheduleRefs');
        expect(studyCardJs).toContain('studyCardDomToken');
        expect(bare).toContain('body.lux-route-study-card #page-study-card .lms-route-card-title');
        expect(bare).toContain('body.lux-route-study-card #page-study-card .lms-route-meta-12');
        expect(html).toContain('scardshare7');
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(fouc).toContain('body.lux-route-study-card #page-study-card');
        expect(fouc).toMatch(/body\.lux-route-study-card #page-study-card[\s\S]*\.study-card-summary-focus[\s\S]*:hover[\s\S]*--home-chip-hover-lift/);
        expect(fouc).toContain('.study-card-summary-focus .lux-hero-signal.home-hover-chip');
        expect(fouc).toMatch(/\.study-card-summary-focus\.lux-focus-panel[\s\S]*overflow:\s*visible/);
    });
});
