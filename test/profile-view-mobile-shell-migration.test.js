const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

describe('profile-view-mobile-shell-migration.test', () => {
    it('bare-shell era: no dedicated route CSS; lux-page-bare linked', () => {
        const html = readFileSync(join(process.cwd(), 'profile-view.html'), 'utf8');
        expect(html).toContain('lux-shell.css');
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).not.toMatch(/lux-page-bare\.css(?!-lite)/);
        expect(html).toContain('lux-page-bare-lite.css');
        expect(existsSync(join(process.cwd(), 'assets/css', 'profile-view-route.css'))).toBe(false);
    });
});
