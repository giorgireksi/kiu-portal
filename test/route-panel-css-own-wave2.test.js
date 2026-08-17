import { describe, expect, it } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';
import { expectRetiredCss, readSource } from './helpers/bare-shell-css.js';

describe('route panel CSS-own wave 2 (bare-shell era)', () => {
    it('social-rebuild retired; bare contracts live in social-bare-shell-era.test.js', () => {
        expectRetiredCss('social-rebuild.css');
    });

    it('stripped library / exams / admin-* use bare shell', () => {
        for (const [html, gone] of [
            ['library.html', 'library-route.css'],
            ['exams.html', 'exam-studio.css'],
            ['admin-tools.html', 'admin-tools-luxury.css'],
            ['admin-library.html', 'admin-library-route.css'],
            ['admin-orders.html', 'admin-orders-route.css'],
            ['admin-scheduler.html', 'admin-scheduler-route.css'],
        ]) {
            const h = readSource(html);
            expect(h).toContain('lux-shell.css');
            expect(h).toContain(html === 'admin-tools.html' ? 'assets/css/admin-tools.css' : 'lux-page-bare-lite.css');
            expect(h).not.toMatch(/lux-page-bare\.css(?!-lite)/);
            expect(existsSync(join(process.cwd(), 'assets/css', gone))).toBe(false);
        }
    });
});
