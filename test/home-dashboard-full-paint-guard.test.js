import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function read(p) {
    return readFileSync(join(process.cwd(), p), 'utf8');
}

describe('dashboard + keep routes full paint', () => {
    it('index keeps luxury + home dashboard sheets', () => {
        const html = read('index.html');
        expect(html).toMatch(/href=["'][^"']*lux-fouc-ht\.css/);
        expect(html).toMatch(/href=["'][^"']*index-home-layout\.css/);
        expect(html).toMatch(/href=["'][^"']*index-home-widgets\.css/);
        expect(html).toMatch(/href=["'][^"']*index-home-role\.css/);
        expect(html).toContain('lux-full-paint');
        expect(html).not.toContain('lux-page-bare.css');
        expect(html).not.toContain('lux-page-bare-lite.css');
        expect(existsSync(join(process.cwd(), 'assets/css/index-home-layout.css'))).toBe(true);
        expect(existsSync(join(process.cwd(), 'assets/css/index-home-widgets.css'))).toBe(true);
        expect(existsSync(join(process.cwd(), 'assets/css/index-home-role.css'))).toBe(true);
        expect(existsSync(join(process.cwd(), 'assets/css/index-home-dashboard.css'))).toBe(false);
    });

    it('timetable / lms / social share paint stack with FOUC atmosphere (no home widgets)', () => {
        for (const page of ['timetable.html', 'lms.html', 'social.html']) {
            const html = read(page);
            expect(html).toMatch(/lux-fouc-ht\.css/);
            expect(html).not.toMatch(/lux-surfaces\.css/);
            expect(html).not.toMatch(/index-home-layout\.css/);
            expect(html).not.toMatch(/index-home-widgets\.css/);
            expect(html).not.toMatch(/index-home-role\.css/);
            expect(html).toMatch(/lux-focus-panel\.css/);
            expect(html).toContain('lux-page-bare');
            expect(html).toMatch(/lux-shell\.css/);
            expect(html).toMatch(/lux-page-bare-lite\.css/);
            expect(html).not.toMatch(/lux-page-bare\.css(?!-lite)/);
            expect(html).toContain('lux-full-paint');
            expect(html).toMatch(/lux-shell\.css/);
            expect(html).not.toMatch(/lux-shell-paint\.css/);
        }
        expect(read('timetable.html')).not.toMatch(/timetable-route\.css/);
        expect(read('lms.html')).not.toMatch(/lms-workspace-chrome\.css/);
        expect(read('social.html')).not.toMatch(/social-rebuild\.css/);
    });
});
