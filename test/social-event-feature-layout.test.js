import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social event feature layout', () => {
    it('renders title in date-group head and description in foot', () => {
        const source = readSource('assets/js/pages/social-events.js');
        const page = readSource('assets/js/pages/social-page.js');

        expect(source).toContain('function renderEventFeatureCard(item, tone)');
        expect(source).toContain('function eventDateLabel(item)');
        expect(source).toContain('class="social-neo-event-date-group-title"');
        expect(source).toContain('<span>1 event</span>');
        expect(source).toContain('class="social-neo-event-feature-bar"');
        expect(source).toContain('data-action="event-edit-open"');
        expect(page).toContain('function eventCanManage(item = {})');
        expect(source).toContain('social-neo-event-feature-head-actions');
        expect(source).toContain('class="social-neo-event-feature-foot"');
        expect(source).toContain('data-event-desc-rail=');
        expect(source).toContain('lux-scroll-rail social-neo-event-feature-desc-rail');
        expect(source).not.toContain('social-neo-event-feature-body');
        expect(source).not.toContain('social-neo-event-feature-title');
        expect(source).not.toContain('groupEventsByDate');
        expect(source).not.toContain('is-clamped');
        expect(source).not.toContain('event-desc-toggle');
    });

    it('emits one date-group section per event', () => {
        const source = readSource('assets/js/pages/social-events.js');

        expect(source).toContain('const events = sortEventsByStart(list);');
        expect(source).toContain('return events.map((item) => {');
        expect(source).toContain('${renderEventFeatureCard(item, tone)}');
    });

    it('initializes lux scroll rails after events panel render', () => {
        const eventsModule = readSource('assets/js/pages/social-events.js');
        const page = readSource('assets/js/pages/social-page.js');

        // Markup lives in the events module; post-render rail sync stays on the page host.
        expect(eventsModule).toContain('data-event-desc-rail=');
        expect(page).toContain('function syncEventDescScrollRails(scope = root())');
        expect(page).toContain("if (activePanel === 'events') syncEventDescScrollRails(host);");
        expect(page).toContain('window.initLuxScrollRail(host, { shellSelector: selector })');
        expect(page).toContain('window.syncLuxScrollRail(host, { shellSelector: selector })');
    });

    it('loads lux-scroll-rail on the social route', () => {
        const html = readSource('social.html');

        expect(html).toContain('assets/js/shared/lux-scroll-rail.js');
        expect(html.indexOf('lux-scroll-rail.js')).toBeLessThan(html.indexOf('social-page.js'));
    });

    it('styles date-group title, action bar, and scrollable foot description', () => {
        const css = readSource('assets/css/social-rebuild.css');

        expect(css).toContain('.social-neo-event-date-group-title');
        expect(css).toContain('.social-neo-event-feature-bar');
        expect(css).toContain('.social-neo-event-feature-foot');
        expect(css).toContain('.social-neo-event-feature-desc-rail');
        expect(css).not.toContain('.social-neo-event-feature-body');
        expect(css).not.toContain('.social-neo-event-feature-title');
        expect(css).toContain('social-neo-scroll-lock .social-neo-event-feature-foot');
        expect(css).toContain('social-neo-scroll-lock .social-neo-event-feature-desc-rail .lux-scroll-rail__viewport');
    });
});