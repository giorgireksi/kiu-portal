import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

describe('index-luxury size budget (dashboard-only consumer)', () => {
    it('stays under under 26% of pre-peel megafile (10110 → ≤2600)', () => {
        const css = readFileSync(join(process.cwd(), 'assets/css/index-luxury.css'), 'utf8');
        const lines = css.split('\n').length;
        expect(lines).toBeLessThanOrEqual(2600);
        expect(css).toMatch(/#lux-topbar|lux-topbar-shell/);
        const shell = readFileSync(join(process.cwd(), 'assets/css/lux-shell-full-paint.css'), 'utf8');
        expect(shell).toContain('TOPBAR SOFT-CHROME SSOT');
    });

    it('only index.html links luxury + shell-full-paint stylesheets', () => {
        const htmls = readdirSync(process.cwd()).filter((f) => f.endsWith('.html'));
        for (const page of htmls) {
            const html = readFileSync(join(process.cwd(), page), 'utf8');
            if (page === 'index.html') {
                expect(html).toMatch(/index-luxury\.css/);
                expect(html).toMatch(/lux-shell-full-paint\.css/);
            } else {
                expect(html, page).not.toMatch(/href=["'][^"']*index-luxury\.css/);
                expect(html, page).not.toMatch(/href=["'][^"']*lux-shell-full-paint\.css/);
            }
        }
    });
});
