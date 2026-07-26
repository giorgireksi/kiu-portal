import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

/** Bare-shell era: social paint CSS deleted; redesign later from LMS/TT tokens. */
describe('social bare shell era', () => {
    it('social.html uses bare shell (no paint megafiles)', () => {
        const html = readSource('social.html');
        expect(html).toContain('lux-shell.css');
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).not.toMatch(/lux-page-bare\.css(?!-lite)/);
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).toContain('lux-shell.css');
        expect(html).toMatch(/class="[^"]*lux-page-bare/);
        expect(html).not.toMatch(/href=["'][^"']*social-rebuild\.css/);
        expect(html).not.toMatch(/href=["'][^"']*social-material\.css/);
        expect(html).not.toMatch(/href=["'][^"']*index-luxury\.css/);
        expect(html).not.toMatch(/href=["'][^"']*lux-surfaces\.css/);
        expect(html).toContain('lux-full-paint');
        expect(html).toMatch(/lux-shell\.css/);
        expect(html).not.toMatch(/lux-shell-paint\.css/);
        expect(html).toMatch(/lux-focus-panel\.css/);
        for (const f of [
            'social-rebuild.css',
            'social-material.css',
            'social-projects-lms.css',
            'social-surveys-lms.css',
            'social-photography-lms.css',
            'portfolio-editor.css',
        ]) {
            expect(existsSync(join(process.cwd(), 'assets/css', f))).toBe(false);
        }
    });

    it('does not inject lazy social paint stylesheets', () => {
        const page = readSource('assets/js/pages/social-page.js');
        // Bare-shell era: no lazy paint injector; modules remain for behavior.
        expect(page).not.toContain('function ensureSocialStylesheet');
        expect(page).not.toMatch(/social-rebuild\.css|social-projects-lms\.css|social-photography-lms\.css/);
        expect(page).toMatch(/social-projects|social-workspace|SOCIAL_PROJECTS/);
    });

    it('bare-lite keeps layout helpers without nuclear flatten on social route', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('Bare portal layout helpers');
        expect(bare).toContain('body.lux-page-bare');
        const socialBlock = bare.slice(bare.indexOf('body.lux-route-social'));
        expect(socialBlock).not.toMatch(/backdrop-filter:\s*none\s*!important/);
    });

    it('loads portal persist runtime before api.js for session token helpers', () => {
        const html = readSource('social.html');
        expect(html).toContain('api-portal-persist-runtime.js');
        expect(html.indexOf('api-portal-persist-runtime.js')).toBeLessThan(html.indexOf('assets/js/app/api.js'));
    });

    it('keeps social workspace layout in shared bare-lite CSS', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toMatch(/#page-social|\.lux-route-social/);
        expect(bare).toContain('.social-neo-shell');
        expect(bare).toContain('.social-neo-feed-hero-grid');
        expect(bare).toContain('.social-neo-lost-found-hero');
        expect(bare).toContain('.social-neo-workspace-rail-reveal');
        expect(bare).toContain('.social-neo-side-link.is-active');
        expect(bare).toContain('.social-neo-feed-hero-tab');
        expect(bare).toContain('.is-focused');
        expect(bare).toContain('.social-neo-section-head');
        expect(bare).toContain('.social-neo-messages');
        expect(bare).toContain('.sn-alerts-panel');
        expect(bare).toContain('.social-project-overview-columns');
    });

    it('lost-found search uses lux-control', () => {
        const lostFound = readSource('assets/js/pages/social-lost-found.js');
        expect(lostFound).toMatch(/social-neo-input lux-control/);
    });

    it('social-feed.js avoids retired paint classes', () => {
        const feed = readSource('assets/js/pages/social-feed.js');
        expect(feed).not.toContain('lux-soft-chrome');
        expect(feed).not.toContain('sn-mat-soft');
    });

    it('paints community directory and shared social primitives', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('.social-neo-community-hero-stats');
        expect(bare).toContain('.social-neo-directory-item.social-neo-community-card');
        expect(bare).toContain('.social-neo-directory-filters');
        expect(bare).toContain('.social-neo-pill');
        expect(bare).toContain('.social-neo-avatar');
        expect(bare).toContain('.social-neo-grid-2');
        expect(bare).toContain('.social-neo-community-hero-toolbar');
        expect(bare).toContain('.social-neo-community-hero-tab');
    });

    it('paints social dialect native buttons with token surfaces (not browser default white)', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toMatch(/button\.social-neo-side-link[\s\S]*appearance:\s*none/);
        expect(bare).not.toMatch(/button\.social-neo-feed-hero-tab[\s\S]*--social-chip-fill/);
        expect(bare).toContain('.lux-strip-card.surface-card');
    });

    it('feed hero tabs use shared lux-secondary-btn styling', () => {
        const feed = readSource('assets/js/pages/social-feed.js');
        expect(feed).toMatch(/lux-secondary-btn social-neo-feed-hero-tab/);
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('button:is(');
        expect(bare).toMatch(/social-neo-feed-hero-tab[\s\S]*\.lux-secondary-btn/);
    });

    it('registers social-neo-card in fouc-ht nested matte allowlist', () => {
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(fouc).toMatch(/\[data-lux-glass-root="1"\][\s\S]*\.social-neo-card/);
    });
});
