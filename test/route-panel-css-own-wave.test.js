const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

/** Bare-shell era: stripped routes no longer ship paint CSS. Archive purged. */
describe('route panel CSS-own wave (keep routes + bare)', () => {
    it('retired timetable/lms route skins stay gone from live assets/css/', () => {
        expect(existsSync(join(process.cwd(), 'assets/css/_archive'))).toBe(false);
        expect(existsSync(join(process.cwd(), 'assets/css/timetable-route.css'))).toBe(false);
        expect(existsSync(join(process.cwd(), 'assets/css/lms-workspace-chrome.css'))).toBe(false);
    });

    it('stripped study-card / programs / chancellery / ssvc / orders use bare shell', () => {
        for (const [html, gone] of [
            ['study-card.html', 'study-card-route.css'],
            ['programs.html', 'programs-route.css'],
            ['chancellery.html', 'chancellery-route.css'],
            ['student-service.html', 'student-service-route.css'],
            ['orders.html', 'orders-route.css'],
        ]) {
            const h = readSource(html);
            expect(h).toContain('lux-shell.css');
            expect(h).toContain('lux-page-bare-lite.css');
            expect(h).not.toMatch(/lux-page-bare\.css(?!-lite)/);
            expect(existsSync(join(process.cwd(), 'assets/css', gone))).toBe(false);
        }
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('body.lux-page-bare');
    });
});
