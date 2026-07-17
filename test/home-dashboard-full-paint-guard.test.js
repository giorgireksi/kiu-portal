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
        expect(html).toMatch(/href=["'][^"']*index-home-dashboard\.css/);
        expect(html).toContain('lux-full-paint');
        expect(html).not.toContain('lux-page-bare.css');
        expect(existsSync(join(process.cwd(), 'assets/css/index-home-dashboard.css'))).toBe(true);
    });

    it('timetable / lms are bare minimal stack; social stays bare', () => {
        for (const page of ['timetable.html', 'lms.html']) {
            const html = read(page);
            expect(html).not.toMatch(/lux-fouc-ht\.css/);
            expect(html).not.toMatch(/lux-surfaces\.css/);
            expect(html).not.toMatch(/lux-focus-panel\.css/);
            expect(html).toContain('lux-page-bare');
            expect(html).toMatch(/lux-page-bare\.css/);
            expect(html).toMatch(/lux-shell\.css/);
            expect(html).not.toContain('lux-full-paint');
        }
        expect(read('timetable.html')).not.toMatch(/timetable-route\.css/);
        expect(read('lms.html')).not.toMatch(/lms-workspace-chrome\.css/);
        const social = read('social.html');
        expect(social).toContain('lux-page-bare.css');
        expect(social).toContain('lux-shell.css');
        expect(social).toMatch(/lux-page-bare/);
        expect(social).not.toMatch(/social-rebuild\.css/);
        expect(social).not.toContain('lux-full-paint');
    });
});
