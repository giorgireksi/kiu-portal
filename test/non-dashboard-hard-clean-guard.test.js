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
});
