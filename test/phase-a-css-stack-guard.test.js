import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

function read(p) {
    return readFileSync(join(process.cwd(), p), 'utf8');
}

function portalPages() {
    return readdirSync(process.cwd())
        .filter((f) => f.endsWith('.html'))
        .filter((f) => {
            const html = read(f);
            return /\blux-unified-shell\b/.test(html) && !/\bredirect-route\b/.test(html);
        });
}

describe('Phase A shared stack guard', () => {
    it('retired dual shells and luxury megafile name', () => {
        expect(existsSync(join(process.cwd(), 'assets/css/lux-shell.css'))).toBe(true);
        expect(existsSync(join(process.cwd(), 'assets/css/lux-fouc-ht.css'))).toBe(true);
        expect(existsSync(join(process.cwd(), 'assets/css/lux-controls.css'))).toBe(true);
        expect(existsSync(join(process.cwd(), 'assets/css/lux-tokens-paint.css'))).toBe(false);
        expect(existsSync(join(process.cwd(), 'assets/css/lux-controls-paint.css'))).toBe(false);
        expect(existsSync(join(process.cwd(), 'assets/css/lux-shell-paint.css'))).toBe(false);
        for (const page of readdirSync(process.cwd()).filter((f) => f.endsWith('.html'))) {
            const html = read(page);
            expect(html).not.toMatch(/href=["'][^"']*lux-shell-nav\.css/);
            expect(html).not.toMatch(/href=["'][^"']*lux-shell-full-paint\.css/);
            expect(html).not.toMatch(/href=["'][^"']*index-luxury\.css/);
            expect(html).not.toMatch(/href=["'][^"']*_archive\//);
            expect(html).not.toMatch(/href=["'][^"']*lux-tokens-paint\.css/);
            expect(html).not.toMatch(/href=["'][^"']*lux-controls-paint\.css/);
            expect(html).not.toMatch(/href=["'][^"']*lux-shell-paint\.css/);
        }
    });

    it('portal pages share merged base paint; index-only chrome stays home', () => {
        const index = read('index.html');
        expect(index).toMatch(/lux-tokens\.css/);
        expect(index).toMatch(/lux-controls\.css/);
        expect(index).toMatch(/lux-shell\.css/);
        expect(index).toMatch(/lux-fouc-ht\.css/);
        expect(index).toMatch(/index-home-layout\.css/);
        expect(index).toMatch(/index-home-widgets\.css/);
        expect(index).toMatch(/index-home-role\.css/);
        expect(index).not.toMatch(/index-home-dashboard\.css/);
        expect(index).not.toMatch(/lux-controls-chrome\.css/);
        expect(index).not.toMatch(/lux-shell-chrome\.css/);
        expect(index.indexOf('lux-controls.css')).toBeGreaterThan(index.indexOf('lux-tokens.css'));
        expect(index.indexOf('lux-shell.css')).toBeGreaterThan(index.indexOf('lux-controls.css'));

        const tokens = read('assets/css/lux-tokens.css');
        const controls = read('assets/css/lux-controls.css');
        const shell = read('assets/css/lux-shell.css');
        expect(tokens).toContain('/* ── §3 shared panel / soft-chrome paint surfaces ── */');
        expect(tokens).toContain('--lux-panel-surface');
        expect(controls).toContain('/* ── §2 shared paint: sheen / metal well');
        expect(shell).toContain('/* ── §3 shared paint: TOPBAR SOFT-CHROME SSOT');
        expect(shell).toContain('body.lux-full-paint');

        for (const page of portalPages()) {
            const html = read(page);
            expect(html, page).toMatch(/lux-tokens\.css/);
            expect(html, page).toMatch(/lux-controls\.css/);
            expect(html, page).toMatch(/lux-shell\.css/);
            expect(html, page).toMatch(/lux-focus-panel\.css/);
            expect(html, page).toMatch(/\blux-full-paint\b/);
            expect(html, page).not.toMatch(/lux-controls-chrome\.css/);
            expect(html, page).not.toMatch(/lux-shell-chrome\.css/);
            if (page !== 'index.html') {
                expect(html, page).not.toMatch(/lux-fouc-ht\.css/);
                expect(html, page).not.toMatch(/index-home-dashboard\.css/);
                expect(html, page).not.toMatch(/index-home-layout\.css/);
                expect(html, page).not.toMatch(/index-home-widgets\.css/);
                expect(html, page).not.toMatch(/index-home-role\.css/);
            }
        }
    });

    it('archive route skins still not linked as live assets/css basenames', () => {
        for (const page of readdirSync(process.cwd()).filter((f) => f.endsWith('.html'))) {
            const html = read(page);
            expect(html).not.toMatch(/href=["']assets\/css\/lms-quiz\.css/);
            expect(html).not.toMatch(/href=["']assets\/css\/timetable-route\.css/);
        }
    });

    it('keeps catalog !important under the A+ ceiling (chrome/a11y only)', () => {
        const total = readdirSync(join(process.cwd(), 'assets/css'))
            .filter((f) => f.endsWith('.css'))
            .reduce((sum, f) => sum + read(join('assets/css', f)).split('!important').length - 1, 0);
        expect(total).toBeLessThanOrEqual(60);
    });
});
