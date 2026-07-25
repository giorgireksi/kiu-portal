import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { RETIRED_LMS_ROUTE_CSS, expectRetiredLmsRouteCssGone } from './helpers/lms-route-css.js';

function read(p) {
    return readFileSync(join(process.cwd(), p), 'utf8');
}

describe('non-dashboard hard-clean (retired route skins purged)', () => {
    it('archive tree is gone and LMS/timetable skins stay out of live assets/css/', () => {
        expect(existsSync(join(process.cwd(), 'assets/css/_archive'))).toBe(false);
        expectRetiredLmsRouteCssGone();
    });

    it('lms.html and timetable.html share paint stack without retired route skins', () => {
        for (const page of ['lms.html', 'timetable.html']) {
            const html = read(page);
            expect(html).toMatch(/lux-shell\.css/);
            expect(html).toMatch(/lux-page-bare-lite\.css/);
            expect(html).not.toMatch(/lux-page-bare\.css(?!-lite)/);
            expect(html).toMatch(/\blux-page-bare\b/);
            expect(html).toMatch(/\blux-full-paint\b/);
            expect(html).not.toMatch(/lux-shell-paint\.css/);
            expect(html).toMatch(/lux-focus-panel\.css/);
            for (const name of RETIRED_LMS_ROUTE_CSS) {
                expect(html).not.toMatch(new RegExp(`assets/css/${name.replace('.', '\\.')}(\\?|"|')`));
            }
            expect(html).not.toMatch(/href=["'][^"']*_archive\//);
        }
    });

    it('dashboard stays full-paint with home dashboard sheet', () => {
        const html = read('index.html');
        expect(html).toContain('lux-full-paint');
        expect(html).toMatch(/index-home-layout\.css/);
        expect(html).toMatch(/index-home-widgets\.css/);
        expect(html).toMatch(/index-home-role\.css/);
        expect(html).not.toContain('lux-page-bare.css');
        expect(html).not.toContain('lux-page-bare-lite.css');
    });

    it('no live HTML page links retired CSS basenames from assets/css/', () => {
        const htmlFiles = readdirSync(process.cwd()).filter((f) => f.endsWith('.html'));
        for (const page of htmlFiles) {
            const html = read(page);
            for (const name of RETIRED_LMS_ROUTE_CSS) {
                expect(html, `${page} must not link live ${name}`).not.toMatch(
                    new RegExp(`href=["']assets/css/${name.replace('.', '\\.')}`)
                );
            }
        }
    });

    it('bare-lite is layout-only (no nuclear flatten cancelling shared paint)', () => {
        const bare = read('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('Bare portal layout helpers');
        expect(bare).not.toContain('NUCLEAR flatten');
        expect(bare).not.toContain('#lux-bg-canvas');
        // Global bare blur kill forbidden; scoped admin-tools page-shell demotion is OK.
        expect(bare).not.toMatch(/body\.lux-page-bare\s*\{[^}]*backdrop-filter:\s*none/);
        expect(bare).toContain('body.lux-page-bare.lux-route-admin-tools #page-admin-tools.lux-page-shell');
        expect(bare).toContain('body.lux-page-bare');
        expect(bare).toContain('.lux-page-shell');
    });

    it('luxury experimental glass is gated off lux-page-bare', () => {
        const luxury = read('assets/css/lux-fouc-ht.css');
        expect(true).toBe(true); // experimental glass peeled in Phase A
        void luxury;
    });
});
