import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (typeof existsSync === 'function' && !existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('social-event-feature-layout.test (bare-shell era)', () => {
    it('social paint CSS removed', () => {
        expect(existsSync(join(process.cwd(), 'assets/css/social-rebuild.css'))).toBe(false);
    });

    it('events hub layout lives in bare-lite (shell paint → lux-fouc-ht)', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('.social-neo-events-shell');
        expect(bare).toContain('.social-neo-events-content');
        expect(bare).toContain('.social-neo-events-hub-section');
        expect(bare).toContain('.social-neo-event-date-group');
        expect(bare).toContain('.social-neo-event-feature-meta');
        expect(bare).toContain('.social-neo-event-feature-actions');
        expect(bare).toContain('.social-neo-event-feature--student');
        expect(bare).toContain('.social-neo-event-feature--university');
        expect(bare).not.toMatch(/\.social-neo-event-feature\s*\{[\s\S]{0,400}backdrop-filter:/);
    });

    it('RSVP buttons use shared lux classes without duplicate secondary', () => {
        const events = readSource('assets/js/pages/social-events.js');
        expect(events).toMatch(/viewerRsvpStatus === 'going' \? 'lux-primary-btn' : 'lux-secondary-btn'\} lux-secondary-btn-sm/);
        expect(events).not.toMatch(/lux-secondary-btn \$\{item\.viewerRsvpStatus/);
    });

    it('events hero light mode uses darker copy tokens and avoids corner clipping', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toMatch(/\.social-neo-events-content[\s\S]{0,400}--social-events-title/);
        expect(bare).toMatch(/\.social-neo-events-hero\.is-merged\s*\{[\s\S]{0,120}overflow:\s*visible/);
        expect(bare).toMatch(/\.social-neo-events-hero\.is-merged \.social-neo-events-manage-card[\s\S]{0,180}padding:\s*14px 16px/);
        expect(bare).not.toMatch(/\.social-neo-events-hero\.is-merged \.social-neo-events-manage-card[\s\S]{0,180}padding:\s*0;/);
        expect(bare).toMatch(/\.social-neo-events-hero\.is-merged[\s\S]{0,500}overflow:\s*visible[\s\S]{0,80}contain:\s*layout style/);
        expect(bare).toMatch(/\.social-neo-event-feature\s*\{[\s\S]{0,260}overflow:\s*visible/);
        expect(bare).toContain('.social-neo-events-hero-stats');
        expect(bare).toMatch(/\.social-neo-events-hero-stats\s*\{[\s\S]{0,120}repeat\(4,\s*minmax\(0,\s*1fr\)\)/);
    });
});
