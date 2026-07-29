import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

describe('Phase A CSS stack (shell + fouc-ht)', () => {
    it('lux-fouc-ht stays slim (ex-luxury FOUC/HT glue)', () => {
        const css = readFileSync(join(process.cwd(), 'assets/css/lux-fouc-ht.css'), 'utf8');
        expect(css.split('\n').length).toBeLessThanOrEqual(2200);
        expect(css).toMatch(/transparency-pending|high-transparency/);
    });

    it('lux-shell carries structure + merged paint', () => {
        const shell = readFileSync(join(process.cwd(), 'assets/css/lux-shell.css'), 'utf8');
        expect(shell).toContain('#lux-topbar .lux-topbar-main');
        expect(shell).toContain('/* ── §3 shared paint: TOPBAR SOFT-CHROME SSOT');
        expect(shell).toContain('TOPBAR SOFT-CHROME SSOT');
        expect(shell).toContain('lux-full-paint');
        expect(shell.split('\n').length).toBeLessThanOrEqual(1100);
        expect(existsSync(join(process.cwd(), 'assets/css/lux-controls.css'))).toBe(true);
        expect(existsSync(join(process.cwd(), 'assets/css/lux-shell-paint.css'))).toBe(false);
        expect(existsSync(join(process.cwd(), 'assets/css/lux-controls-paint.css'))).toBe(false);
    });

    it('full-paint portals link lux-fouc-ht; home widgets stay index-only', () => {
        for (const page of readdirSync(process.cwd()).filter((f) => f.endsWith('.html'))) {
            const html = readFileSync(join(process.cwd(), page), 'utf8');
            expect(html).not.toMatch(/lux-shell-nav\.css/);
            expect(html).not.toMatch(/lux-shell-full-paint\.css/);
            expect(html).not.toMatch(/href=["'][^"']*index-luxury\.css/);
            expect(html).not.toMatch(/lux-shell-paint\.css/);
            expect(html).not.toMatch(/lux-controls-paint\.css/);
            if (page === 'index.html') {
                expect(html).toMatch(/lux-fouc-ht\.css/);
                expect(html).toMatch(/lux-shell\.css/);
                expect(html).toMatch(/lux-controls\.css/);
                expect(html).toMatch(/index-home-layout\.css/);
                expect(html).toMatch(/index-home-widgets\.css/);
                expect(html).toMatch(/index-home-role\.css/);
            } else if (/\blux-page-bare\b/.test(html) && /\blux-full-paint\b/.test(html)) {
                expect(html).toMatch(/lux-fouc-ht\.css/);
                expect(html).toMatch(/lux-shell\.css/);
                expect(html).not.toMatch(/index-home-layout\.css/);
                expect(html).not.toMatch(/index-home-widgets\.css/);
                expect(html).not.toMatch(/index-home-role\.css/);
            } else if (html.includes('lux-shell.css') && !html.includes('index-home-layout')) {
                expect(html).toMatch(/lux-shell\.css/);
            }
        }
    });
});
