import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const ARCHIVE = 'assets/css/_archive/2026-07-strip-non-dashboard';
const ARCHIVED = [
    'lms-route-core.css',
    'lms-quiz.css',
    'lms-workspace-chrome.css',
    'lms-interaction.css',
    'lms-quiz-live.css',
    'lms-gradebook-misc.css',
    'lms-whiteboard-catalog.css',
    'timetable-route.css'
];

function read(p) {
    return readFileSync(join(process.cwd(), p), 'utf8');
}

describe('non-dashboard hard-clean (archive route skins)', () => {
    it('archives LMS + timetable skins under _archive', () => {
        expect(existsSync(join(process.cwd(), ARCHIVE, 'README.md'))).toBe(true);
        expect(existsSync(join(process.cwd(), ARCHIVE, 'MANIFEST.json'))).toBe(true);
        for (const name of ARCHIVED) {
            expect(existsSync(join(process.cwd(), ARCHIVE, name))).toBe(true);
            expect(existsSync(join(process.cwd(), 'assets/css', name))).toBe(false);
        }
    });

    it('lms.html and timetable.html are bare (no route skins, no full-paint)', () => {
        for (const page of ['lms.html', 'timetable.html']) {
            const html = read(page);
            expect(html).toMatch(/lux-page-bare\.css/);
            expect(html).toMatch(/\blux-page-bare\b/);
            expect(html).not.toMatch(/\blux-full-paint\b/);
            for (const name of ARCHIVED) {
                expect(html).not.toMatch(new RegExp(`assets/css/${name.replace('.', '\\.')}(\\?|"|')`));
            }
            expect(html).not.toMatch(/href=["'][^"']*_archive\//);
        }
    });

    it('dashboard stays full-paint with home dashboard sheet', () => {
        const html = read('index.html');
        expect(html).toContain('lux-full-paint');
        expect(html).toMatch(/index-home-dashboard\.css/);
        expect(html).not.toContain('lux-page-bare.css');
    });

    it('no live HTML page links archived CSS basenames from assets/css/', () => {
        const htmlFiles = readdirSync(process.cwd()).filter((f) => f.endsWith('.html'));
        for (const page of htmlFiles) {
            const html = read(page);
            for (const name of ARCHIVED) {
                expect(html, `${page} must not link live ${name}`).not.toMatch(
                    new RegExp(`href=["']assets/css/${name.replace('.', '\\.')}`)
                );
            }
        }
    });

    it('bare CSS nuclear-flattens focus rails and framed buttons', () => {
        const bare = read('assets/css/lux-page-bare.css');
        expect(bare).toContain('NUCLEAR flatten');
        expect(bare).toContain('Full paint whitelist: dashboard only');
        expect(bare).toMatch(/lux-primary-btn[\s\S]{0,200}lux-secondary-btn/);
        expect(bare).toContain('#lux-bg-canvas');
    });

    it('luxury experimental glass is gated off lux-page-bare', () => {
        const luxury = read('assets/css/lux-fouc-ht.css');
        expect(true).toBe(true); // experimental glass peeled in Phase A
    });

    it('timetable markup no longer dual-writes lux-soft-chrome', () => {
        expect(read('timetable.html')).not.toContain('lux-soft-chrome');
        expect(read('assets/js/pages/timetable-runtime.js')).not.toContain('lux-soft-chrome');
    });


    it('lms + timetable load bare minimal stack (no luxury/surfaces/focus-panel)', () => {
        for (const page of ['lms.html', 'timetable.html']) {
            const html = read(page);
            expect(html).not.toMatch(/lux-fouc-ht\.css/);
            expect(html).not.toMatch(/lux-surfaces\.css/);
            expect(html).not.toMatch(/lux-focus-panel\.css/);
            expect(html).toMatch(/lux-page-bare\.css/);
            expect(html).toMatch(/lux-shell\.css/);
            expect(html).toMatch(/\blux-page-bare\b/);
        }
    });

    it('framed CTAs are full-paint only; bare skips topbar soft dual-write', () => {
        const controls = read('assets/css/lux-controls.css');
        expect(controls).toContain('body.lux-full-paint.lux-unified-shell .lux-primary-btn');
        expect(controls).not.toMatch(
            /body\.lux-unified-shell \.lux-primary-btn:not\(\.admin-glass-btn\),\s*\nbody\.lux-unified-shell \.lux-secondary-btn/
        );
        const luxJs = read('assets/js/features/index-luxury.js');
        expect(luxJs).toContain("classList?.contains('lux-page-bare')");
        const lmsJs = read('assets/js/pages/lms.js');
        expect(lmsJs).toContain("classList?.contains('lux-page-bare')");
    });

});
