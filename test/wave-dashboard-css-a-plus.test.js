/**
 * CONTRACT: Dashboard CSS efficiency — three index-only sheets ≤400 lines;
 * eager total (layout+widgets+role) ≤950; dashboard bucket (eager+fouc+editor) ≤1500;
 * scoped nesting; token glass; no lms-hero-v2 / Inter / picker bleed.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
    HOME_DASHBOARD_CSS_FILES,
    readHomeDashboardCss,
} from './helpers/bare-shell-css.js';

const ROOT = process.cwd();
const MAX_LINES = 400;
const EAGER_MAX_LINES = 950;
const DASHBOARD_BUCKET_MAX = 1500;
const BUCKET_EXTRA = [
    'assets/css/lux-fouc-ht.css',
    'assets/css/index-home-editor.css',
];

function read(rel) {
    return readFileSync(join(ROOT, rel), 'utf8');
}

function lineCount(rel) {
    return read(rel).split(/\r?\n/).length;
}

describe('Wave dashboard CSS A+ (criteria → 10/10)', () => {
    it('docs claim split stack + gate', () => {
        const ssot = read('docs/visual-ssot.md');
        expect(ssot).toContain('index-home-layout.css');
        expect(ssot).toContain('index-home-widgets.css');
        expect(ssot).toContain('index-home-role.css');
        expect(ssot).toContain('check:dashboard-css');
        expect(ssot).toMatch(/Dashboard CSS A\+/);
    });

    it('index links the three sheets; other routes do not; megafile gone', () => {
        const index = read('index.html');
        for (const file of HOME_DASHBOARD_CSS_FILES) {
            const base = file.split('/').pop();
            expect(index).toContain(base);
            expect(existsSync(join(ROOT, file))).toBe(true);
            expect(lineCount(file)).toBeLessThanOrEqual(MAX_LINES);
        }
        expect(existsSync(join(ROOT, 'assets/css/index-home-dashboard.css'))).toBe(false);
        for (const page of ['lms.html', 'social.html', 'timetable.html', 'news.html']) {
            const html = read(page);
            expect(html).not.toMatch(/index-home-layout\.css/);
            expect(html).not.toMatch(/index-home-widgets\.css/);
            expect(html).not.toMatch(/index-home-role\.css/);
        }
    });

    it('eager home + dashboard bucket stay under efficiency ceilings', () => {
        const eager = HOME_DASHBOARD_CSS_FILES.reduce((n, f) => n + lineCount(f), 0);
        const bucket = eager + BUCKET_EXTRA.reduce((n, f) => n + lineCount(f), 0);
        expect(eager).toBeLessThanOrEqual(EAGER_MAX_LINES);
        expect(bucket).toBeLessThanOrEqual(DASHBOARD_BUCKET_MAX);
    });

    it('TOC markers present on each sheet', () => {
        expect(read('assets/css/index-home-layout.css')).toMatch(/SECTIONS:/);
        expect(read('assets/css/index-home-widgets.css')).toMatch(/SECTIONS:/);
        expect(read('assets/css/index-home-role.css')).toMatch(/SECTIONS:/);
        expect(read('assets/css/index-home-layout.css')).toContain('--home-bp-sm');
        expect(read('assets/css/index-home-layout.css')).toContain('--home-bp-md');
        expect(read('assets/css/index-home-layout.css')).toContain('--home-bp-lg');
    });

    it('home CSS hygiene: no Inter, lms-hero-v2, picker/search, blur literals, accent hex', () => {
        const css = readHomeDashboardCss();
        expect(css).not.toMatch(/\bInter\b/);
        expect(css).not.toMatch(/lms-hero-v2/);
        expect(css).not.toMatch(/\.lux-picker/);
        expect(css).not.toMatch(/\.lux-search\b/);
        expect(css).not.toMatch(/backdrop-filter:\s*blur\(/);
        expect(css).not.toMatch(/-webkit-backdrop-filter:\s*blur\(/);
        expect(css).not.toMatch(/kiu-card/);
        // raw accent hex fallbacks banned
        expect(css).not.toMatch(/#d7aa56|#ffd28d|#f7fbff|#48bf86/i);
    });

    it('classification + manifest list the three dedicated sheets', () => {
        const classification = read('tools/visual-route-classification.js');
        expect(classification).toContain('index-home-layout.css');
        expect(classification).toContain('index-home-widgets.css');
        expect(classification).toContain('index-home-role.css');
        expect(classification).not.toContain("dedicatedCss: ['assets/css/index-home-dashboard.css']");
        const manifest = JSON.parse(read('tools/css-route-manifest.json'));
        expect(manifest.routes['index.html'].dedicatedCss).toEqual([
            'assets/css/index-home-layout.css',
            'assets/css/index-home-widgets.css',
            'assets/css/index-home-role.css',
        ]);
    });

    it('desktop freeform contract: absolute widgets on block canvas', () => {
        const widgetsCss = read('assets/css/index-home-widgets.css');
        const layoutCss = read('assets/css/index-home-layout.css');
        expect(widgetsCss).toMatch(
            /\.lux-dashboard-canvas\.is-desktop\s+\.lux-grid-widget\s*\{[^}]*position:\s*absolute/
        );
        expect(widgetsCss).not.toMatch(
            /\.lux-dashboard-canvas\.is-desktop\s+\.lux-grid-widget\s*\{[^}]*position:\s*static/
        );
        expect(layoutCss).toMatch(
            /\.lux-dashboard-canvas\.is-desktop\s*\{[^}]*display:\s*block/
        );
    });
});
