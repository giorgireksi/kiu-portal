import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

function read(p) {
    return readFileSync(join(process.cwd(), p), 'utf8');
}

describe('Phase A shared stack guard', () => {
    it('retired dual shells and luxury megafile name', () => {
        expect(existsSync(join(process.cwd(), 'assets/css/lux-shell.css'))).toBe(true);
        expect(existsSync(join(process.cwd(), 'assets/css/lux-fouc-ht.css'))).toBe(true);
        for (const page of readdirSync(process.cwd()).filter((f) => f.endsWith('.html'))) {
            const html = read(page);
            expect(html).not.toMatch(/href=["'][^"']*lux-shell-nav\.css/);
            expect(html).not.toMatch(/href=["'][^"']*lux-shell-full-paint\.css/);
            expect(html).not.toMatch(/href=["'][^"']*index-luxury\.css/);
            expect(html).not.toMatch(/href=["'][^"']*_archive\//);
        }
    });

    it('archive route skins still not linked as live assets/css basenames', () => {
        for (const page of readdirSync(process.cwd()).filter((f) => f.endsWith('.html'))) {
            const html = read(page);
            expect(html).not.toMatch(/href=["']assets\/css\/lms-quiz\.css/);
            expect(html).not.toMatch(/href=["']assets\/css\/timetable-route\.css/);
        }
    });
});
