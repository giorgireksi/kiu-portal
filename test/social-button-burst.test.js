import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), 'utf8');

const PORTAL_HTML = [
    'admin-library.html', 'admin-orders.html', 'admin-scheduler.html', 'admin-tools.html',
    'calendar.html', 'chancellery.html', 'exam-portal.html', 'exams.html',
    'faculty-gradebook.html', 'faculty-schedule.html', 'gradebook.html', 'index.html',
    'library.html', 'lms.html', 'login.html', 'news.html', 'orders.html', 'personal-data.html',
    'profile-view.html', 'profile.html', 'programs.html', 'protected-launch.html',
    'registration.html', 'social.html', 'staff.html', 'student-service.html',
    'students-admin.html', 'study-card.html', 'timetable.html', 'wifi-setup.html'
];

describe('Global button click burst', () => {
    it('loads the shared burst assets on every HTML entry point', () => {
        for (const htmlPath of PORTAL_HTML) {
            const html = read(htmlPath);
            expect(html, htmlPath).toContain('assets/css/lux-button-burst.css?v=20260821-globalburst2');
            expect(html, htmlPath).toContain('assets/js/shared/lux-button-burst.js?v=20260821-globalburst2');
            expect(html, htmlPath).not.toContain('social-button-burst.css');
        }
        expect(existsSync(join(root, 'assets/css/social-button-burst.css'))).toBe(false);
    });

    it('owns the global layer, keyframes, accessibility guard, and cleanup contract', () => {
        const css = read('assets/css/lux-button-burst.css');
        const runtime = read('assets/js/shared/lux-button-burst.js');

        expect(css).toContain('body > #lux-button-burst-layer');
        expect(css).toContain('z-index: 2147483647');
        expect(css).toContain('@keyframes lux-chip-particle-out');
        expect(css).toContain('@keyframes lux-chip-particle-spark');
        expect(css).toContain('@keyframes lux-chip-particle-streak');
        expect(css).toContain('prefers-reduced-motion: reduce');
        expect(runtime).toContain('document.addEventListener(\'pointerdown\'');
        expect(runtime).toContain('const burstRect = burstTarget.getBoundingClientRect()');
        expect(runtime).toContain('requestAnimationFrame');
        expect(runtime).toContain('data-lux-click-burst="off"');
        expect(runtime).toContain('.lux-scroll-rail__btn');
        expect(runtime).toContain('.social-project-task-graph-link-handle');
        expect(runtime).toContain('window.spawnLuxChipBurstParticles');
        expect(runtime).toContain('kiuLuxuryButtonBurstEnabled');
        expect(runtime).toContain('window.getLuxButtonBurstEnabled');
        expect(runtime).toContain('window.setLuxButtonBurstEnabled');
        expect(runtime).toContain('window.resetLuxButtonBurstPreference');
        expect(runtime).toContain('PARTICLE_TIMEOUT_MS');
    });

    it('keeps Studio CSS free of the global particle implementation', () => {
        const chrome = read('assets/js/features/luxury-shell-chrome.js');
        const studio = read('assets/css/lux-studio.css');
        expect(chrome).not.toContain('ensureStudioChipBurstHandler');
        expect(chrome).not.toContain('spawnStudioChipBurstParticles');
        expect(chrome).toContain('Button Click Animation');
        expect(chrome).toContain('id="lux-button-burst-on"');
        expect(chrome).toContain('id="lux-button-burst-off"');
        expect(chrome.indexOf('Button Click Animation')).toBeGreaterThan(chrome.indexOf('Interface Mode'));
        expect(chrome.indexOf('Button Click Animation')).toBeLessThan(chrome.indexOf('Panel Transparency'));
        expect(studio).not.toContain('@keyframes lux-chip-particle-out');
    });
});
