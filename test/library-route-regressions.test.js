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
        expect(html).toContain('libcss2');
        expect(html).not.toContain('library-route.css');
        expect(html).toContain('library-catalog-filters-panel lux-soft-chrome');
        expect(html).toContain('admin-library-catalog-card lux-soft-chrome');
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('#page-library .library-catalog-workspace');
        expect(bare).toContain('#page-library .admin-library-catalog-card');
        const libraryBlock = bare.slice(bare.indexOf('/* ── Library workspace'));
        expect(libraryBlock).not.toContain('--alib-fade-');
        expect(libraryBlock).not.toContain('--lib-fade-');
    });
});
