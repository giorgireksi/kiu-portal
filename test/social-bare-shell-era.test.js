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
        expect(bare).toContain('.social-neo-events-shell--merged');
        expect(bare).toContain('.social-neo-events-content');
        expect(bare).toContain('.social-neo-event-feature');
        expect(bare).toContain('.social-neo-lost-found-hero');
        expect(bare).toContain('.social-neo-workspace-rail-reveal');
        expect(bare).toContain('.social-neo-side-link.is-active');
        expect(bare).toContain('.social-neo-feed-hero-tab');
        expect(bare).toContain('.is-focused');
        expect(bare).toContain('.social-neo-section-head');
        expect(bare).toContain('.social-neo-messages');
        expect(bare).toContain('.social-neo-messages__inbox-header');
        expect(bare).toContain('.social-neo-chat-item.is-active');
        expect(bare).toContain('.social-neo-msg-compose-row');
        expect(bare).toContain('.social-neo-messages__thread-shell');
        expect(bare).toContain('.sn-alerts-panel');
        expect(bare).toContain('.sn-alert-card::before');
        expect(bare).toContain('.social-project-overview-columns');
        expect(bare).toContain('.social-project-hub-layout');
        expect(bare).toContain('.social-neo-workspace-hero-stats');
        expect(bare).toContain('.social-neo-portfolio-hero-stats');
        expect(bare).toContain('.social-portfolio-search-row');
        expect(bare).toContain('.social-portfolio-feed');
        expect(bare).toContain('.social-portfolio-card');
        expect(bare).toContain('.portfolio-panel-tab');
        expect(bare).toContain('.social-neo-pages-hero-grid');
        expect(bare).toContain('.social-neo-pages-grid');
        expect(bare).toContain('.social-neo-pages-empty-state');
        expect(bare).toContain('.social-neo-page-card-rich');
        expect(bare).toContain('.social-photo-tab-segment');
        expect(bare).toContain('.social-photo-content-stage');
        expect(bare).toContain('.social-photo-grid-tile');
    });

    it('pages hero uses lux-secondary-btn like other social heroes', () => {
        const pages = readSource('assets/js/pages/social-pages.js');
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(pages).toContain('lux-secondary-btn social-neo-pages-hero-tab');
        expect(pages).not.toContain('lux-tab-btn--rich');
        expect(bare).toMatch(/\.social-neo-pages-hero-grid[\s\S]*?grid-template-columns:\s*repeat\(2/);
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

    it('photography tabs use shared lux button classes', () => {
        const photo = readSource('assets/js/pages/social-photography.js');
        expect(photo).toMatch(/lux-secondary-btn-sm social-photo-tab/);
        expect(photo).toMatch(/lux-primary-btn.*social-photo-tab|social-photo-tab.*lux-primary-btn/);
    });

    it('lux-page-bare-lite.css has balanced braces', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        let depth = 0;
        for (const ch of bare) {
            if (ch === '{') depth += 1;
            if (ch === '}') depth -= 1;
            expect(depth).toBeGreaterThanOrEqual(0);
        }
        expect(depth).toBe(0);
    });

    it('registers social-neo-card in fouc-ht nested matte allowlist', () => {
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(fouc).toMatch(/\[data-lux-glass-root="1"\][\s\S]*\.social-neo-card/);
    });

    it('social shells use fouc-ht hover SSOT (not bare-lite panel paint)', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const cardBlock = bare.slice(
            bare.indexOf('body.lux-route-social .social-neo-card'),
            bare.indexOf('body.lux-route-social .social-neo-flash')
        );
        expect(cardBlock).not.toContain('--lux-panel-surface');
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(fouc).toContain('body.lux-unified-shell.lux-route-social :is(#public-social-root, #social-neo-root, #social-neo-overlay-portal)');
        expect(fouc).toContain('.social-neo-card:not(.is-merged):not(:has(.lux-universal-picker-field))');
        expect(fouc).toContain('[class*="-hub-section"]');
        expect(fouc).toContain('.social-neo-empty');
        expect(fouc).toContain('.social-neo-card:is(.is-merged, :has(.lux-universal-picker-field))');
        expect(fouc).toContain('.social-neo-messages__inbox');
        expect(fouc).toContain('.social-neo-messages__thread-shell');
        expect(fouc).not.toMatch(/Social soft-chrome shells[\s\S]*\.social-neo-chat-item/);
        expect(fouc).not.toContain('.social-neo-call-card');
        expect(bare).toContain('--msg-stream-bg');
        expect(fouc).toContain('var(--home-chip-hover-lift, -3px)');
    });

    it('keeps social overlay portal and dialog backdrop fixed above the page', () => {
        const modals = readSource('assets/css/lux-modals.css');
        expect(modals).toMatch(/#social-neo-overlay-portal[\s\S]*position:\s*fixed/);
        expect(modals).toMatch(/\.lux-glass-dialog-backdrop[\s\S]*position:\s*fixed/);
    });

    it('paints social glass-dialog popups with shared lux modal layout', () => {
        const modals = readSource('assets/css/lux-modals.css');
        expect(modals).toContain('.lux-glass-dialog-card--social-glass');
        expect(modals).toContain('.lux-glass-dialog-invite-columns');
        expect(modals).toContain('.lux-glass-dialog-group-section');
    });

    it('uses shared frosted popup shell tokens for social-glass cards', () => {
        const modals = readSource('assets/css/lux-modals.css');
        const section7b = modals.slice(modals.indexOf('§7b social overlay'));
        expect(section7b).not.toContain('--lux-modal-glass-surface: var(--lux-warmglass-surface)');
        expect(section7b).toMatch(/\.lux-glass-dialog-card--social-glass[\s\S]*background:\s*var\(--lux-popup-shell-surface/);
        expect(modals).toMatch(/\.lux-glass-dialog-card:not\(\.lux-glass-dialog-card--social-glass\)/);
        expect(modals).toContain('.lux-glass-dialog-card--social-glass *');
    });

    it('shields social overlay portal from transparency inline paint', () => {
        const transparency = readSource('assets/js/shared/lux-transparency.js');
        expect(transparency).toContain('#social-neo-overlay-portal');
        expect(transparency).not.toMatch(/SOCIAL_NEO_TRANSPARENCY_SURFACE_SELECTORS = \[[\s\S]*?'\.lux-glass-dialog-card'/);
    });
});
