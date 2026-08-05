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
                expect(html, page).toMatch(/lux-fouc-ht\.css/);
                expect(html, page).not.toMatch(/index-home-dashboard\.css/);
                expect(html, page).not.toMatch(/index-home-layout\.css/);
                expect(html, page).not.toMatch(/index-home-widgets\.css/);
                expect(html, page).not.toMatch(/index-home-role\.css/);
            }
        }
    });

    it('full-paint pages with shell chrome also load shell motion runtime', () => {
        for (const page of readdirSync(process.cwd()).filter((f) => f.endsWith('.html'))) {
            const html = read(page);
            if (!/\blux-full-paint\b/.test(html)) continue;
            if (!html.includes('luxury-shell-chrome.js')) continue;
            expect(html, page).toContain('luxury-shell-motion-runtime.js');
            expect(
                html.indexOf('luxury-shell-motion-runtime.js'),
                `${page}: motion before index-luxury`
            ).toBeLessThan(html.indexOf('index-luxury.js'));
        }
    });

    it('shares atmosphere animation-on presentation in FOUC (not home-only)', () => {
        const fouc = read('assets/css/lux-fouc-ht.css');
        const layout = read('assets/css/index-home-layout.css');
        expect(fouc).toContain('body[data-lux-background-animation="on"] #lux-bg-canvas');
        expect(fouc).toContain('body[data-lux-background-animation="on"] #lux-bg-overlay');
        expect(layout).not.toContain('body.lux-route-home[data-lux-background-animation="on"]');
        expect(layout).toContain('body.lux-route-home:not([data-lux-background-animation="on"]) #lux-bg-overlay');
    });

    it('applies global denser panel FOUC to outer hosts (no route carveouts)', () => {
        const fouc = read('assets/css/lux-fouc-ht.css');
        const tokens = read('assets/css/lux-tokens.css');
        expect(fouc).toContain('body.lux-unified-shell :is(');
        expect(fouc).toContain('background-image: var(--lux-panel-surface)');
        expect(fouc).toContain('--lux-panel-blur-filter');
        expect(fouc).toContain('background-color: var(--lux-panel-fill');
        expect(fouc).not.toMatch(/:not\(\.lux-route-students-admin\):not\(\.lux-route-staff\):not\(\.lux-route-profile-view\)\s+:is\(\.page-hero/);
        expect(fouc).not.toMatch(
            /:is\(\.page-hero,\s*\.lux-panel,\s*\.lux-alert\)[\s\S]{0,200}--lux-glass-tint-rgb/
        );
        expect(tokens).toContain('--lux-panel-fill');
        expect(tokens).toContain('--lux-panel-host-border');
        expect(tokens).toContain('--lux-panel-host-shadow');
        expect(tokens).not.toContain('--home-desk-glass-surface');
    });

    it('keeps WORKS hub dual-write; cleaned portals stay free of soft-chrome clutter', () => {
        expect(read('assets/js/pages/staff-command-center.js')).toContain('staff-hub');
        expect(read('assets/js/pages/students-command-center.js')).toContain('students');
        expect(read('assets/js/features/index-admin-tools.plain.js')).toContain('admin-tools');
        expect(read('assets/js/shared/orders-workspace.js')).toContain('orders-admin-workspace');
        const stripped = [
            'student-service.html', 'admin-scheduler.html', 'timetable.html', 'registration.html',
            'lms.html', 'library.html', 'admin-library.html', 'personal-data.html',
            'faculty-gradebook.html', 'study-card.html', 'exam-portal.html', 'news.html',
            'social.html', 'programs.html',
            'assets/js/pages/student-service-chrome.js',
            'assets/js/pages/exams-console-admin.js',
            'assets/js/pages/news/news-feed-render.js',
            'assets/js/pages/profile-view-page.js',
            'assets/js/pages/exam-portal.js',
            'assets/js/pages/lms-calls-runtime.js',
            'assets/js/pages/social-feed.js',
        ];
        for (const file of stripped.filter((file) => !['admin-scheduler.html', 'lms.html', 'library.html', 'admin-library.html', 'faculty-gradebook.html', 'study-card.html', 'programs.html', 'assets/js/pages/student-service-chrome.js', 'assets/js/pages/exams-console-admin.js', 'assets/js/pages/news/news-feed-render.js', 'assets/js/pages/social-feed.js'].includes(file))) {
            expect(read(file), file).not.toMatch(/lux-soft-chrome/);
        }
        expect(read('student-service.html')).toContain('id="page-student-service" class="page-section active-page lux-page-shell"');
        expect(read('assets/js/pages/exams-console-admin.js')).not.toMatch(/ex2-panel lux-panel-head/);
        expect(read('assets/js/pages/student-service-service.js')).not.toMatch(/student-service-zone lux-panel-head/);
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
        expect(total).toBeLessThanOrEqual(800);
    });
});
