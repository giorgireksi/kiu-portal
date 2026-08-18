const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

describe('admin-tools-mobile-shell-migration.test', () => {
    it('bare-shell era: admin-tools uses its extracted route CSS', () => {
        const html = readFileSync(join(process.cwd(), 'admin-tools.html'), 'utf8');
        expect(html).toContain('shared-lux-core.css');
        expect(html).toContain('assets/css/admin-tools.css?v=20260818-atoolssplit2');
        expect(html).not.toMatch(/lux-page-bare\.css(?!-lite)/);
        expect(existsSync(join(process.cwd(), 'assets/css', 'admin-tools-luxury.css'))).toBe(false);
    });
});
