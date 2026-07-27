const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('library route regressions.test', () => {
    it('bare shell: no luxury/surfaces paint sheets; flat bare CSS', () => {
        const html = readSource('library.html');
        expect(html).toContain('lux-shell.css');
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).not.toMatch(/lux-page-bare\.css(?!-lite)/);
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).toMatch(/class="[^"]*lux-page-bare/);
        expect(html).not.toMatch(/href=["'][^"']*index-luxury\.css/);
        expect(html).not.toMatch(/href=["'][^"']*lux-surfaces\.css/);
        expect(existsSync(join(process.cwd(), 'assets/css', 'library-route.css'))).toBe(false);
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('body.lux-page-bare');
        expect(bare).not.toMatch(/body\.lux-page-bare\s*\{[^}]*backdrop-filter:\s*none/);
        expect(bare).toContain('.lux-page-shell[data-lux-layout-only="1"]');
        const shell = readSource('assets/css/lux-shell.css');
        expect(shell).toContain('body.lux-page-bare .lux-page-shell');
        expect(shell).not.toContain('body.lux-page-bare .lux-page-shell :is(.page-hero, .lux-panel, .lux-alert)');
        expect(html).toContain('data-lux-layout-only="1"');
        expect(html).toMatch(/library-catalog-workspace[\s\S]*data-lux-glass-root="1"/);
    });

    it('loads shared panel SSOT stack with library workspace layout CSS', () => {
        const html = readSource('library.html');
        expect(html).toContain('frostedpopup1');
        expect(html).toContain('libcss5');
        expect(html).toContain('lux-layout-primitives.css');
        expect(html).not.toContain('library-route.css');
        expect(html).toContain('library-catalog-filters-panel lux-soft-chrome home-hover-chip');
        expect(html).toContain('admin-library-catalog-card lux-soft-chrome home-hover-chip');
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('#page-library .library-catalog-workspace');
        expect(bare).toContain('#page-library .admin-library-catalog-table thead th');
        expect(bare).toContain('admin-library-catalog-row');
        const libraryBlock = bare.slice(bare.indexOf('/* ── Library workspace'));
        expect(libraryBlock).not.toContain('--alib-fade-');
        expect(libraryBlock).not.toContain('--lib-fade-');
        expect(libraryBlock).not.toMatch(/admin-library-metric-card\.lux-stat-card\s*\{[^}]*background:/);
        expect(libraryBlock).not.toMatch(/lux-tab-btn\.active[^}]*background:/);
    });

    it('fouc-ht paints library catalog inners and flattens browse glass host', () => {
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        const block = fouc.split('/* Library page:')[1]?.split('/* Student Service page:')[0] || '';
        expect(block).toContain('#page-library .admin-library-metric-card.lux-stat-card');
        expect(block).toContain('[data-library-catalog-shell="1"]');
        expect(block).toContain('.library-catalog-filters-panel');
        expect(block).toContain('.admin-library-catalog-foot');
        expect(block).toContain('.admin-library-catalog-table thead th');
        expect(block).toContain('admin-library-empty-row');
        expect(fouc).toContain('Library catalog primary shells: frosted panel glass');
        expect(fouc).toContain('body.lux-unified-shell #page-library :is(\n  .library-catalog-filters-panel,\n  .admin-library-catalog-card\n)');
        expect(fouc).toContain('--lux-panel-blur-filter');
    });

    it('shared catalog view markup uses home-hover-chip on filters panel', () => {
        const source = readSource('assets/js/shared/library-catalog-view.js');
        expect(source).toContain('library-catalog-filters-panel lux-soft-chrome home-hover-chip');
        expect(source).toContain('admin-library-metric-card home-hover-chip');
    });
});
