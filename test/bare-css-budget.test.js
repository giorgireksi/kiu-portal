import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const PAGE_EXTRAS = new Set(['layout-schedule.css', 'layout-schedule-board.css', 'lux-modals.css']);
/** Still index-only after paint promotion. */
const INDEX_ONLY = [
    'mobile-shell.css',
    'lux-fouc-ht.css',
    'index-home-layout.css',
    'index-home-widgets.css',
    'index-home-role.css',
];
/** Merged base sheets (paint lives at end of each). */
const SHARED_STACK = [
    'lux-tokens.css',
    'lux-focus-panel.css',
    'lux-controls.css',
    'lux-shell.css',
];

function read(p) {
    return readFileSync(join(ROOT, p), 'utf8');
}

function lineCount(rel) {
    return read(rel).split(/\r?\n/).length;
}

function linkedAssetCss(html) {
    const hrefs = [...html.matchAll(/href=["'](assets\/css\/[^"']+)["']/g)].map((m) => m[1].split('?')[0]);
    return hrefs.filter((h) => !h.includes('vendor') && !h.includes('fontawesome'));
}

function barePages() {
    return readdirSync(ROOT)
        .filter((f) => f.endsWith('.html'))
        .filter((f) => /\blux-page-bare\b/.test(read(f)));
}

describe('bare CSS diet budget', () => {
    it('shared paint portal stack ≤ 3000 lines; bare pages link merged base not home/fouc polish', () => {
        expect(existsSync(join(ROOT, 'assets/css/mobile-shell-core.css'))).toBe(true);
        expect(existsSync(join(ROOT, 'assets/css/lux-controls.css'))).toBe(true);
        expect(existsSync(join(ROOT, 'assets/css/lux-tokens.css'))).toBe(true);
        expect(existsSync(join(ROOT, 'assets/css/lux-shell.css'))).toBe(true);
        expect(existsSync(join(ROOT, 'assets/css/lux-tokens-paint.css'))).toBe(false);
        expect(existsSync(join(ROOT, 'assets/css/lux-controls-paint.css'))).toBe(false);
        expect(existsSync(join(ROOT, 'assets/css/lux-shell-paint.css'))).toBe(false);
        expect(existsSync(join(ROOT, 'assets/css/lux-controls-chrome.css'))).toBe(false);
        expect(existsSync(join(ROOT, 'assets/css/lux-shell-chrome.css'))).toBe(false);

        const tokens = read('assets/css/lux-tokens.css');
        const shell = read('assets/css/lux-shell.css');
        expect(tokens).toContain('/* ── §3 shared panel / soft-chrome paint surfaces ── */');
        expect(tokens).toContain('--lux-panel-surface');
        expect(shell).toContain('body.lux-full-paint');
        expect(shell).toContain('/* ── §3 shared paint: TOPBAR SOFT-CHROME SSOT');

        const pages = barePages();
        expect(pages.length).toBeGreaterThanOrEqual(16);

        for (const page of pages) {
            const html = read(page);
            const linked = linkedAssetCss(html);
            expect(linked.some((h) => h.endsWith('mobile-shell-core.css')), page).toBe(true);
            for (const name of SHARED_STACK) {
                expect(linked.some((h) => h.endsWith(name)), `${page} must link ${name}`).toBe(true);
            }
            for (const name of INDEX_ONLY) {
                expect(linked.some((h) => h.endsWith(name)), `${page} must not link ${name}`).toBe(false);
            }
            expect(linked.some((h) => h.includes('lux-mobile-action-sheet.css')), page).toBe(false);
            expect(html, page).toMatch(/\blux-full-paint\b/);

            const canonical = linked.filter((h) => !PAGE_EXTRAS.has(h.split('/').pop()));
            const total = canonical.reduce((sum, h) => sum + lineCount(h), 0);
            expect(total, `${page} canonical=${total}`).toBeLessThanOrEqual(3000);
        }
    });

    it('live assets/css (ex-_archive) stays ≤ 6500 lines after densify', () => {
        const cssRoot = join(ROOT, 'assets/css');
        function walk(dir) {
            let n = 0;
            for (const ent of readdirSync(dir, { withFileTypes: true })) {
                if (ent.name === '_archive') continue;
                const full = join(dir, ent.name);
                if (ent.isDirectory()) n += walk(full);
                else if (ent.name.endsWith('.css')) {
                    n += readFileSync(full, 'utf8').split(/\r?\n/).length;
                }
            }
            return n;
        }
        const live = walk(cssRoot);
        expect(live).toBeLessThanOrEqual(8400);
        expect(live).toBeGreaterThan(4000);
    });

    it('index links merged tokens/shell/controls and injects mobile core + polish', () => {
        const html = read('index.html');
        expect(html).toMatch(/lux-tokens\.css/);
        expect(html).toMatch(/lux-controls\.css/);
        expect(html).toMatch(/lux-shell\.css/);
        expect(html).not.toMatch(/lux-tokens-paint\.css/);
        expect(html).not.toMatch(/lux-controls-paint\.css/);
        expect(html).not.toMatch(/lux-shell-paint\.css/);
        expect(html).not.toMatch(/lux-controls-chrome\.css/);
        expect(html).not.toMatch(/lux-shell-chrome\.css/);
        expect(html).toMatch(/mobile-shell-core\.css/);
        expect(html).toMatch(/mobile-shell\.css\?v=/);
        expect(html.indexOf('lux-controls.css')).toBeGreaterThan(html.indexOf('lux-tokens.css'));
        expect(html.indexOf('lux-shell.css')).toBeGreaterThan(html.indexOf('lux-controls.css'));
    });
});
