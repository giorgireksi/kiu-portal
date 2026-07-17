import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('index-luxury size budget (dashboard-only consumer)', () => {
    it('stays under 50% of pre-peel megafile (10110 → ≤5055)', () => {
        const css = readFileSync(join(process.cwd(), 'assets/css/index-luxury.css'), 'utf8');
        const lines = css.split(/\n/).length;
        expect(lines).toBeLessThanOrEqual(5055);
        // still owns shell/topbar glue used by dashboard
        expect(css).toContain('#lux-topbar');
        expect(css).toMatch(/TOPBAR SOFT-CHROME|lux-topbar-shell/);
    });

    it('only index.html links the luxury stylesheet', () => {
        const { readdirSync } = require('fs');
        const htmls = readdirSync(process.cwd()).filter((f) => f.endsWith('.html'));
        for (const page of htmls) {
            const html = readFileSync(join(process.cwd(), page), 'utf8');
            if (page === 'index.html') {
                expect(html).toMatch(/index-luxury\.css/);
            } else {
                expect(html, page).not.toMatch(/href=["'][^"']*index-luxury\.css/);
            }
        }
    });
});
