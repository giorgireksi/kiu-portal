const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('personal data route regressions', () => {
    it('bare shell: no luxury/surfaces paint sheets; flat bare CSS', () => {
        const html = readSource('personal-data.html');
        expect(html).toContain('lux-shell.css');
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).not.toMatch(/lux-page-bare\.css(?!-lite)/);
        expect(html).not.toMatch(/href=["'][^"']*index-luxury\.css/);
        expect(html).not.toMatch(/href=["'][^"']*lux-surfaces\.css/);
        expect(existsSync(join(process.cwd(), 'assets/css', 'personal-data-route.css'))).toBe(false);
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('body.lux-page-bare');
        expect(bare).not.toMatch(/body\.lux-page-bare\s*\{[^}]*backdrop-filter:\s*none/);
        expect(bare).toContain('.lux-page-shell[data-lux-layout-only="1"]');
        const shell = readSource('assets/css/lux-shell.css');
        expect(shell).toContain('body.lux-page-bare .lux-page-shell');
        expect(shell).not.toContain('body.lux-page-bare .lux-page-shell :is(.page-hero, .lux-panel, .lux-alert)');
        expect(html).toContain('data-lux-layout-only="1"');
        expect(html).toMatch(/personal-data-workspace[\s\S]*data-lux-glass-root="1"/);
    });

    it('loads shared layout primitives and pdshare1 cache', () => {
        const html = readSource('personal-data.html');
        expect(html).toContain('pdshare1');
        expect(html).toContain('lux-layout-primitives.css');
    });

    it('uses shared shell classes and home-hover-chip on matte inners', () => {
        const html = readSource('personal-data.html');
        expect(html).toContain('page-hero personal-data-hero lux-hero');
        expect(html).toContain('lux-section-kicker lux-page-kicker');
        expect(html).not.toContain('lux-summary-surface--hero');
        expect(html).not.toContain('lux-soft-chrome');
        expect(html).toContain('filter-shell personal-data-command personal-data-toolbar home-hover-chip');
        expect(html).toContain('personal-data-identity-card home-hover-chip');
        expect(html).toContain('personal-data-kpi-card lux-data-card lux-metric-card lux-strip-card home-hover-chip');
        expect(html).toContain('lux-card-meta personal-data-kpi-label');
    });

    it('shared layout primitives define personal data text roles', () => {
        const primitives = readSource('assets/css/lux-layout-primitives.css');
        expect(primitives).toContain('.personal-data-card-kicker');
        expect(primitives).toContain('.personal-data-kpi-label');
        expect(primitives).toContain('.personal-data-kpi-value');
        expect(primitives).toContain('.personal-data-name');
    });

    it('bare-lite personal data block is layout-only', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const pdBlock = bare.split('/* ── Personal data route')[1]?.split('/* ── Staff / students hub')[0] || '';
        expect(pdBlock).toContain('body.lux-route-personal-data #page-personal-data');
        expect(pdBlock).toContain('body.lux-route-personal-data .personal-data-layout');
        expect(pdBlock).toContain('body.lux-route-personal-data .personal-data-kpi-card');
        expect(pdBlock).not.toMatch(/backdrop-filter/);
        expect(bare).not.toContain('--pd-fade-');
    });

    it('fouc-ht matte paints personal data shells and keeps glass hosts static', () => {
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(fouc).toContain('body.lux-route-personal-data #page-personal-data');
        expect(fouc).toMatch(/body\.lux-route-personal-data #page-personal-data :is\([\s\S]*\.personal-data-kpi-card/);
        expect(fouc).toMatch(/body\.lux-route-personal-data #page-personal-data :is\(\.page-hero, \.personal-data-workspace\)/);
        expect(fouc).toMatch(/body\.lux-route-personal-data #page-personal-data :is\([\s\S]*\.personal-data-identity-card[\s\S]*\):hover[\s\S]*--home-chip-hover-lift/);
        expect(fouc).toContain('body.lux-route-personal-data #page-personal-data .lux-picker-field');
    });
});
