/* CONTRACT: Soft-chrome and focus-panel tokens/structure stay shared once — not re-invented per route. — see docs/test-as-map.md */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (typeof existsSync === 'function' && !existsSync(full)) return '';
    return readFileSync(full, 'utf8');
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
        expect(tokens).toContain('body.lux-full-paint');
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
            /\.lux-focus-panel[\s\S]{0,500}backdrop-filter:\s*none(?:\s*!important)?/
        );
        expect(css).toMatch(
            /\.lux-soft-chrome[\s\S]{0,400}backdrop-filter:\s*none(?:\s*!important)?/
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

    it('auth pages use fouc-ht + focus-panel and never link lux-surfaces', () => {
        const htmlFiles = readdirSync(process.cwd()).filter((name) => name.endsWith('.html'));
        const authPages = ['login.html', 'protected-launch.html'];
        for (const name of authPages) {
            const html = readSource(name);
            expect(html, name).toContain('lux-focus-panel.css');
            expect(html, name).toContain('lux-fouc-ht.css');
            expect(html, name).toContain('lux-full-paint');
            expect(html, name).not.toContain('lux-surfaces.css');
        }
        const withSurfaces = htmlFiles.filter((name) =>
            readSource(name).includes('lux-surfaces.css')
        );
        expect(withSurfaces).toEqual([]);
        for (const name of ['calendar.html', 'profile.html', 'gradebook.html', 'faculty-schedule.html']) {
            const html = readSource(name);
            expect(html, name).not.toContain('lux-surfaces.css');
            expect(html, name).not.toContain('lux-focus-panel.css');
        }
    });

    it('bare portal pages link lux-focus-panel with shared paint', () => {
        const htmlFiles = readdirSync(process.cwd()).filter((name) => name.endsWith('.html'));
        for (const name of htmlFiles) {
            const html = readSource(name);
            if (!/\blux-page-bare\b/.test(html)) continue;
            expect(html, name).toMatch(/lux-focus-panel\.css/);
            expect(html, name).toMatch(/\blux-full-paint\b/);
        }
        expect(readSource('index.html')).toContain('lux-focus-panel.css');
    });

    it('dual-writes lux-focus-panel on pilot and phase-3 hero asides', () => {
        // Bare-shell era: LMS/TT keep focus class aliases without lux-focus-panel sheet/class dual-write
        expect(readSource('timetable.html')).toContain('lux-timetable-hero-focus lux-hero-side');
        expect(readSource('lms.html')).toContain('lms-hero-focus lux-hero-side');
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
        const softEngine = readSource('assets/js/shared/lux-transparency.js');
        expect(softEngine).toContain('lux-focus-panel');
        expect(softEngine).toContain('lux-soft-chrome');
        expect(primer).toContain("'.lux-focus-panel'");
        expect(primer).toContain("'.lux-soft-chrome:not(.lux-home-merged)'");
    });
});
