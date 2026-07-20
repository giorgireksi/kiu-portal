const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

describe('admin-tools-mobile-shell-migration.test', () => {
    it('bare-shell era: no dedicated route CSS; lux-page-bare linked', () => {
        const html = readFileSync(join(process.cwd(), 'admin-tools.html'), 'utf8');
        expect(html).toContain('lux-shell.css');
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).not.toMatch(/lux-page-bare\.css(?!-lite)/);
        expect(html).toContain('lux-page-bare-lite.css');
        expect(existsSync(join(process.cwd(), 'assets/css', 'admin-tools-luxury.css'))).toBe(false);
    });
});
