import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('lux-focus-panel portal contract', () => {
    const css = readSource('assets/css/lux-focus-panel.css');
    const tokens = readSource('assets/css/lux-tokens.css');
    const utilities = readSource('assets/js/shared/utilities.js');
    const primer = readSource('assets/js/theme-primer.js');

    it('defines shared soft-chrome tokens', () => {
        expect(tokens).toContain('--lux-soft-chrome-surface');
        expect(tokens).toContain('--lux-soft-chrome-border');
        expect(tokens).toContain('--lux-soft-chrome-shadow');
        expect(tokens).toContain('--lux-focus-fill');
        expect(tokens).toContain('body.lux-route-home');
        expect(tokens).toContain('body.lux-route-timetable');
    });

    it('owns focus structure + nested-blur lock once', () => {
        expect(css).toContain('.lux-focus-panel');
        expect(css).toContain('.lux-focus-panel__head');
        expect(css).toContain('.lux-focus-panel__body');
        expect(css).toContain('.lux-focus-panel__meta');
        expect(css).toContain('.lux-focus-panel__kicker');
        expect(css).toContain('.lux-focus-panel__chip');
        expect(css).toContain('.lux-focus-panel__title');
        expect(css).toContain('.lux-focus-panel__copy');
        expect(css).toContain('.lux-soft-chrome');
        expect(css).toMatch(
            /\.lux-focus-panel[\s\S]{0,500}backdrop-filter:\s*none\s*!important/
        );
        expect(css).toMatch(
            /\.lux-soft-chrome[\s\S]{0,400}backdrop-filter:\s*none\s*!important/
        );
    });

    it('aliases timetable + LMS focus class names', () => {
        expect(css).toContain('.lux-timetable-hero-focus');
        expect(css).toContain('.lux-timetable-focus-head');
        expect(css).toContain('.lux-timetable-focus-meta');
        expect(css).toContain('.lms-hero-focus.lux-hero-side');
        expect(css).toContain('.lms-hero-focus-head');
        expect(css).toContain('.lms-hero-focus-chip');
        expect(css).toContain('.lms-hero-focus-meta');
        expect(css).toMatch(/\.lux-timetable-hero-focus::before|\.lms-hero-focus\.lux-hero-side::before/);
    });

    it('is linked after lux-surfaces on portal pages', () => {
        const htmlFiles = readdirSync(process.cwd()).filter((name) => name.endsWith('.html'));
        // Full-paint routes load lux-surfaces; bare routes use solid shell without it.
        const withSurfaces = htmlFiles.filter((name) =>
            readSource(name).includes('lux-surfaces.css')
        );
        expect(withSurfaces.length).toBeGreaterThanOrEqual(3);
        for (const name of withSurfaces) {
            const html = readSource(name);
            expect(html, name).toContain('lux-focus-panel.css');
            const surfacesIdx = html.indexOf('lux-surfaces.css');
            const focusIdx = html.indexOf('lux-focus-panel.css');
            expect(focusIdx, name).toBeGreaterThan(surfacesIdx);
        }
        // Full-paint triad always carries surfaces + focus order
        for (const name of ['index.html', 'timetable.html', 'lms.html']) {
            const html = readSource(name);
            expect(html, name).toContain('lux-surfaces.css');
            expect(html.indexOf('lux-focus-panel.css')).toBeGreaterThan(html.indexOf('lux-surfaces.css'));
        }
    });

    it('dual-writes lux-focus-panel on pilot and phase-3 hero asides', () => {
        expect(readSource('timetable.html')).toContain('lux-timetable-hero-focus lux-hero-side lux-focus-panel lux-soft-chrome');
        expect(readSource('lms.html')).toContain('lms-hero-focus lux-hero-side lux-focus-panel');
        expect(readSource('assets/js/features/home-dashboard/widget-render.js')).toContain(
            'lms-hero-focus lux-hero-side lux-focus-panel'
        );
        expect(readSource('assets/js/shared/orders-inbox.js')).toContain('orders-inbox-hero-side lux-focus-panel');
        expect(readSource('assets/js/pages/chancellery.js')).toContain('lux-chancellery-hero-side lux-focus-panel');
        expect(readSource('assets/js/pages/study-card-page.js')).toContain('lux-hero-side lux-focus-panel');
        // student-service hero focus dual-write deferred to Phase 4 (workspace redesign removed aside)
        expect(readSource('registration.html')).toContain('lux-hero-side registration-hero-aside lux-focus-panel');
    });

    it('keeps engine soft treatment for focus panels', () => {
        expect(utilities).toContain("'lux-focus-panel'");
        expect(utilities).toContain("'lux-soft-chrome'");
        expect(utilities).toContain('.lux-focus-panel');
        expect(utilities).toContain('el.classList.contains(\'lux-focus-panel\')');
        expect(utilities).toContain('el.classList.contains(\'lux-soft-chrome\')');
        expect(utilities).toContain("el.matches?.('.lms-hero-focus, .lux-focus-panel')");
        expect(primer).toContain("'.lux-focus-panel'");
        expect(primer).toContain("'.lux-soft-chrome'");
    });

    it('does not re-blur focus in efficient timetable luxury rules', () => {
        const luxury = readSource('assets/css/index-luxury.css');
        const timetableRoute = readSource('assets/css/_archive/2026-07-strip-non-dashboard/timetable-route.css');
        const efficientBlock =
            luxury.match(
                /body\[data-lux-performance='efficient'\]\.lux-route-timetable[\s\S]{0,900}lux-timetable-hero-focus[\s\S]{0,400}/
            ) ||
            timetableRoute.match(
                /body\[data-lux-performance='efficient'\]\.lux-route-timetable[\s\S]{0,900}lux-timetable-hero-focus[\s\S]{0,400}/
            );
        expect(efficientBlock?.[0] || '').toMatch(/backdrop-filter:\s*none/);
        // Glass-host list must not force blur onto focus panel
        expect(luxury).not.toMatch(
            /body\.lux-site-modernized\.lux-unified-shell :where\([\s\S]{0,800}\.lux-timetable-hero-focus[\s\S]{0,400}backdrop-filter:\s*blur/
        );
    });
});
