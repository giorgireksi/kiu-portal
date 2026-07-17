import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

describe('Phase A CSS stack (shell + fouc-ht)', () => {
    it('lux-fouc-ht stays slim (ex-luxury FOUC/HT glue)', () => {
        const css = readFileSync(join(process.cwd(), 'assets/css/lux-fouc-ht.css'), 'utf8');
        expect(css.split('\n').length).toBeLessThanOrEqual(1200);
        expect(css).toMatch(/transparency-pending|high-transparency/);
    });

    it('lux-shell is shared and contains topbar SSOT + bare layout', () => {
        const shell = readFileSync(join(process.cwd(), 'assets/css/lux-shell.css'), 'utf8');
        expect(shell).toContain('TOPBAR SOFT-CHROME SSOT');
        expect(shell).toContain('#lux-topbar .lux-topbar-main');
        expect(shell).toContain('lux-full-paint');
        expect(shell.split('\n').length).toBeLessThanOrEqual(1500);
    });

    it('only index.html links lux-fouc-ht; no dual shell names', () => {
        for (const page of readdirSync(process.cwd()).filter((f) => f.endsWith('.html'))) {
            const html = readFileSync(join(process.cwd(), page), 'utf8');
            expect(html).not.toMatch(/lux-shell-nav\.css/);
            expect(html).not.toMatch(/lux-shell-full-paint\.css/);
            expect(html).not.toMatch(/href=["'][^"']*index-luxury\.css/);
            if (page === 'index.html') {
                expect(html).toMatch(/lux-fouc-ht\.css/);
                expect(html).toMatch(/lux-shell\.css/);
                expect(html).toMatch(/index-home-dashboard\.css/);
            } else if (html.includes('lux-page-bare.css')) {
                expect(html).not.toMatch(/lux-fouc-ht\.css/);
                expect(html).toMatch(/lux-shell\.css/);
            }
        }
    });
});
