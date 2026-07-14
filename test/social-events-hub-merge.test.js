import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social events hub merge regressions', () => {
    it('renders the events hub as one merged card with internal sections', () => {
        const page = readSource('assets/js/pages/social-page.js');
        const eventsModule = readSource('assets/js/pages/social-events.js');

        expect(eventsModule).toContain('function renderEventsPanel()');
        expect(eventsModule).toContain('social-neo-events-shell--merged');
        expect(eventsModule).toContain('function renderEventsHero');
        expect(eventsModule).toContain('is-merged');
        expect(eventsModule).toContain('sectionsHtml');
        expect(page).toContain('ensureSocialEventsModule');
        expect(page).toContain('window.renderEventsPanel');
    });
});
