const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

/** Bare-shell era: stripped routes no longer ship paint CSS. Keep-route panels only. */
describe('route panel CSS-own wave (keep routes + bare)', () => {
    it('timetable route still aliases / owns panel paint', () => {
        const css = readSource('assets/css/_archive/2026-07-strip-non-dashboard/timetable-route.css');
        expect(css.length).toBeGreaterThan(100);
        expect(css).toMatch(/--lux-panel|lux-panel/);
    });

    it('lms workspace chrome still present', () => {
        const css = readSource('assets/css/_archive/2026-07-strip-non-dashboard/lms-workspace-chrome.css');
        expect(css.length).toBeGreaterThan(100);
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
            expect(h).toContain('lux-page-bare.css');
            expect(existsSync(join(process.cwd(), 'assets/css', gone))).toBe(false);
        }
        const bare = readSource('assets/css/lux-page-bare.css');
        expect(bare).toContain('backdrop-filter: none');
        expect(bare).toContain('body.lux-page-bare');
    });
});
