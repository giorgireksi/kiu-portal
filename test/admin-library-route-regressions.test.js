const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('admin library route regressions.test', () => {
    it('bare shell: no luxury/surfaces paint sheets; flat bare CSS', () => {
        const html = readSource('admin-library.html');
        expect(html).toContain('lux-shell.css');
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).not.toMatch(/lux-page-bare\.css(?!-lite)/);
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).toMatch(/class="[^"]*lux-page-bare/);
        expect(html).not.toMatch(/href=["'][^"']*index-luxury\.css/);
        expect(html).not.toMatch(/href=["'][^"']*lux-surfaces\.css/);
        expect(existsSync(join(process.cwd(), 'assets/css', 'admin-library-route.css'))).toBe(false);
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('body.lux-page-bare');
        expect(bare).not.toMatch(/body\.lux-page-bare\s*\{[^}]*backdrop-filter:\s*none/);
        expect(bare).toContain('.lux-page-shell[data-lux-layout-only="1"]');
        const shell = readSource('assets/css/lux-shell.css');
        expect(shell).toContain('body.lux-page-bare .lux-page-shell');
        expect(shell).not.toContain('body.lux-page-bare .lux-page-shell :is(.page-hero, .lux-panel, .lux-alert)');
        expect(html).toContain('data-lux-layout-only="1"');
        expect(html).toMatch(/admin-library-shell[\s\S]*data-lux-glass-root="1"/);
        expect(html).not.toMatch(/alib-workspace[\s\S]*data-lux-glass-root="1"/);
    });

    it('loads shared panel SSOT stack with library layout CSS', () => {
        const html = readSource('admin-library.html');
        expect(html).toContain('frostedpopup1');
        expect(html).toContain('libcss2');
        expect(html).not.toContain('admin-library-route.css');
        expect(html).toContain('lux-soft-chrome');
        expect(html).toContain('admin-library-shell');
        expect(html).toContain('lux-secondary-btn admin-library-schema-editor-btn');
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('#page-library .admin-library-shell');
        expect(bare).toContain('#page-library .alib-workspace');
        expect(bare).toContain('#page-library .admin-library-catalog-card');
        expect(bare).toContain('.admin-library-droplist-header-cell');
        const libraryBlock = bare.slice(bare.indexOf('/* ── Library workspace'));
        expect(libraryBlock).not.toContain('--alib-fade-');
        expect(libraryBlock).not.toContain('--lib-fade-');
        const controls = readSource('assets/css/lux-controls.css');
        expect(controls).toContain('.lux-destructive-btn');
        const adminLibraryJs = readSource('assets/js/pages/admin-library.js');
        expect(adminLibraryJs).toContain('renderAdminLibrary();');
        expect(adminLibraryJs).toContain('loadDeferredAdminLibraryScripts');
        expect(adminLibraryJs).toMatch(/ensureAdminLibraryState\(\);\s*renderAdminLibrary\(\);/);
        expect(html).not.toContain('luxury-index-runtime.js');
        expect(html).not.toContain('luxury-home-model.js');
        expect(html).not.toContain('features/ui.js');
        expect(html).not.toContain('lux-scroll-rail.js');
        const modals = readSource('assets/css/lux-modals.css');
        expect(modals).toContain('.admin-library-schema-section');
        expect(modals).toContain('.admin-library-sections-list');
        expect(modals).toContain('.admin-library-schema-droplist-editor-body');
    });
});
