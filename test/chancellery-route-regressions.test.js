const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('chancellery route regressions', () => {
    it('bare shell: no luxury/surfaces paint sheets; flat bare CSS', () => {
        const html = readSource('chancellery.html');
        expect(html).toContain('lux-shell.css');
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).not.toMatch(/lux-page-bare\.css(?!-lite)/);
        expect(html).not.toMatch(/href=["'][^"']*index-luxury\.css/);
        expect(html).not.toMatch(/href=["'][^"']*lux-surfaces\.css/);
        expect(existsSync(join(process.cwd(), 'assets/css', 'chancellery-route.css'))).toBe(false);
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('body.lux-page-bare');
        expect(bare).not.toMatch(/body\.lux-page-bare\s*\{[^}]*backdrop-filter:\s*none/);
        expect(bare).toContain('.lux-page-shell[data-lux-layout-only="1"]');
        expect(html).toContain('data-lux-layout-only="1"');
        expect(readSource('assets/js/pages/chancellery.js')).toMatch(/data-chancellery-shell="1"[\s\S]*data-lux-glass-root="1"/);
        const shell = readSource('assets/css/lux-shell.css');
        expect(shell).toContain('body.lux-page-bare .lux-page-shell');
        expect(shell).not.toContain('body.lux-page-bare .lux-page-shell :is(.page-hero, .lux-panel, .lux-alert)');
    });

    it('loads shared layout primitives and chshare1 cache', () => {
        const html = readSource('chancellery.html');
        expect(html).toContain('chshare1');
        expect(html).toContain('lux-layout-primitives.css');
    });

    it('runtime uses shared shell classes and home-hover-chip on matte inners', () => {
        const js = readSource('assets/js/pages/chancellery.js');
        expect(js).toContain('page-hero lux-hero lux-chancellery-hero-card');
        expect(js).toContain('lux-section-kicker lux-page-kicker');
        expect(js).not.toContain('lux-summary-surface--hero');
        expect(js).toContain('lux-chancellery-hero-side lux-timetable-hero-focus lux-focus-panel home-hover-chip');
        expect(js).toContain('filter-shell lux-chancellery-command-bar home-hover-chip');
        expect(js).toContain('lux-chancellery-list-panel home-hover-chip');
        expect(js).toContain('lux-chancellery-detail-panel home-hover-chip');
        expect(js).toContain('lux-chancellery-finance-card');
        expect(js).not.toContain('lux-chancellery-main-panel');
    });

    it('shared layout primitives define chancellery text roles', () => {
        const primitives = readSource('assets/css/lux-layout-primitives.css');
        expect(primitives).toContain('.lux-chancellery-card-title');
        expect(primitives).toContain('.lux-chancellery-stat-label');
        expect(primitives).toContain('.lux-chancellery-queue-subject');
    });

    it('bare-lite chancellery block is layout-only', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const chanBlock = bare.split('/* ── Chancellery route')[1]?.split('/* ── Staff / students hub')[0] || '';
        expect(chanBlock).toContain('body.lux-route-chancellery #page-chancellery');
        expect(chanBlock).toContain('body.lux-route-chancellery .lux-chancellery-workspace-split');
        expect(chanBlock).toContain('body.lux-route-chancellery .lux-chancellery-queue-item');
        expect(chanBlock).not.toMatch(/backdrop-filter/);
        expect(bare).not.toContain('--chan-fade-');
    });

    it('fouc-ht matte paints chancellery shells and keeps glass hosts static', () => {
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(fouc).toContain('body.lux-route-chancellery #page-chancellery');
        expect(fouc).toMatch(/body\.lux-route-chancellery #page-chancellery :is\([\s\S]*\.lux-chancellery-list-panel/);
        expect(fouc).toMatch(/body\.lux-route-chancellery #page-chancellery :is\(\.page-hero, \[data-chancellery-shell="1"\]\)/);
        expect(fouc).toMatch(/body\.lux-route-chancellery #page-chancellery :is\([\s\S]*\.lux-chancellery-command-bar[\s\S]*\):hover[\s\S]*--home-chip-hover-lift/);
        expect(fouc).toContain('body.lux-route-chancellery #page-chancellery .lux-picker-field');
    });
});
