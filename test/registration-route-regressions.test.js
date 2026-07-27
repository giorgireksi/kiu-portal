const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('registration route regressions', () => {
    it('bare shell: no luxury/surfaces paint sheets; flat bare CSS', () => {
        const html = readSource('registration.html');
        expect(html).toContain('lux-shell.css');
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).not.toMatch(/lux-page-bare\.css(?!-lite)/);
        expect(html).not.toMatch(/href=["'][^"']*index-luxury\.css/);
        expect(html).not.toMatch(/href=["'][^"']*lux-surfaces\.css/);
        expect(existsSync(join(process.cwd(), 'assets/css', 'registration-route.css'))).toBe(false);
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('body.lux-page-bare');
        expect(bare).not.toMatch(/body\.lux-page-bare\s*\{[^}]*backdrop-filter:\s*none/);
        expect(bare).toContain('.lux-page-shell[data-lux-layout-only="1"]');
        const shell = readSource('assets/css/lux-shell.css');
        expect(shell).toContain('body.lux-page-bare .lux-page-shell');
        expect(shell).not.toContain('body.lux-page-bare .lux-page-shell :is(.page-hero, .lux-panel, .lux-alert)');
        expect(html).toContain('data-lux-layout-only="1"');
        expect(html).toMatch(/registration-workspace[\s\S]*data-lux-glass-root="1"/);
    });

    it('loads shared layout primitives and regshare1 cache', () => {
        const html = readSource('registration.html');
        expect(html).toContain('regshare2');
        expect(html).toContain('lux-layout-primitives.css');
        expect(html).toContain('lux-fouc-ht.css');
    });

    it('uses shared shell classes and home-hover-chip on matte inners', () => {
        const html = readSource('registration.html');
        expect(html).toContain('page-hero lux-hero lux-timetable-hero registration-hero-shell');
        expect(html).toContain('lux-section-kicker lux-page-kicker');
        expect(html).not.toContain('lux-summary-surface--hero');
        expect(html).not.toContain('wave2-chip');
        expect(html).not.toContain('lux-soft-chrome');
        expect(html).toMatch(/registration-hero-aside[\s\S]*home-hover-chip/);
        expect(html).toContain('registration-insight-card registration-summary-card registration-summary-card--hold home-hover-chip');
        expect(html).toContain('lux-card lux-timetable-command registration-command-band home-hover-chip');
        expect(html).toContain('registration-footer-bar registration-footer-bar-shell registration-progress-shell home-hover-chip');
        expect(html).toContain('lux-card-meta registration-insight-label');
        expect(html).toContain('lux-card-title registration-workspace-title');
    });

    it('shared layout primitives define registration text roles', () => {
        const primitives = readSource('assets/css/lux-layout-primitives.css');
        expect(primitives).toContain('.registration-insight-label');
        expect(primitives).toContain('.registration-insight-value');
        expect(primitives).toContain('.registration-workspace-kicker');
        expect(primitives).toContain('.registration-workspace-title');
        expect(primitives).toContain('.registration-footer-bar-label');
        expect(primitives).toContain('.registration-module-list-title');
    });

    it('bare-lite registration block is layout-only', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const regBlock = bare.split('/* ── Registration route')[1]?.split('/* ── Staff / students hub')[0] || '';
        expect(regBlock).toContain('body.lux-route-registration #page-registration');
        expect(regBlock).toContain('body.lux-route-registration .registration-shell-grid');
        expect(regBlock).toContain('.registration-module-list-card');
        expect(regBlock).toContain('body.lux-route-registration .reg-tabs');
        expect(regBlock).toContain('body.lux-route-registration .registration-footer-bar');
        expect(regBlock).not.toMatch(/backdrop-filter/);
        expect(bare).not.toContain('--registration-fade-');
    });

    it('fouc-ht matte paints registration shells and keeps glass hosts static', () => {
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(fouc).toContain('body.lux-route-registration #page-registration');
        expect(fouc).toMatch(/body\.lux-route-registration #page-registration :is\([\s\S]*\.registration-insight-card/);
        expect(fouc).toMatch(/body\.lux-route-registration #page-registration \.lux-card:not\(\[data-lux-glass-root="1"\]\)/);
        expect(fouc).toMatch(/body\.lux-route-registration #page-registration :is\(\.page-hero, \.lux-timetable-stage, \.registration-workspace\)/);
        expect(fouc).toMatch(/body\.lux-route-registration #page-registration :is\([\s\S]*\.registration-footer-bar[\s\S]*\):hover[\s\S]*--home-chip-hover-lift/);
        expect(fouc).toContain('.registration-module-list-card');
    });

    it('fouc-ht does not treat picker fields as registration matte hover shells', () => {
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        const regBlock = fouc.split('/* Timetable + registration pages')[1]?.split('/* Social soft-chrome shells')[0] || '';
        expect(regBlock).toContain('body.lux-route-registration #page-registration .lux-picker-field');
        expect(regBlock).not.toMatch(/body\.lux-route-registration \.registration-page-stack :is\([^)]*\.lux-picker-field/);
    });

    it('dynamic student registration shells use shared text primitives and home-hover-chip', () => {
        const js = readSource('assets/js/pages/student-registration.js');
        expect(js).toContain("className = 'registration-state-card home-hover-chip'");
        expect(js).toContain("className = 'registration-course-row home-hover-chip'");
        expect(js).toContain('registration-module-choice home-hover-chip');
        expect(js).toContain('registration-render-error home-hover-chip');
        expect(js).toContain('registration-section-title lux-card-title');
        expect(js).toContain("className = 'registration-module-list-card home-hover-chip'");
        expect(js).toContain('registration-course-title lux-card-title');
    });
});
