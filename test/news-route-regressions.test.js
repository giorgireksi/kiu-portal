const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

/**
 * Bare-shell era: route paint CSS removed. Page uses shared lux stack + lux-page-bare.
 * Full visuals kept only on timetable / LMS / social.
 */
describe('news bare shell', () => {
    it('uses bare shell (no dedicated route paint sheet)', () => {
        const html = readSource('news.html');
        expect(html).toContain('lux-shell.css');
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).not.toMatch(/lux-page-bare\.css(?!-lite)/);
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).toMatch(/class="[^"]*lux-page-bare/);
        expect(existsSync(join(process.cwd(), 'assets/css', 'news-route.css'))).toBe(false);
        expect(html).not.toContain('news-route.css');
    });

    it('still loads shared panel SSOT stack', () => {
        const html = readSource('news.html');
        expect(html).toContain('lux-tokens.css');
        expect(html).toContain('lux-controls.css');
        expect(html).toContain('lux-shell.css');
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('body.lux-page-bare');
        expect(bare).not.toContain('backdrop-filter: none');
        const shell = readSource('assets/css/lux-shell.css');
        expect(shell).toContain('--lux-panel-surface-soft');
        expect(shell).toContain('body.lux-page-bare .lux-page-shell');
    });
});
