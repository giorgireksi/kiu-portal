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
        expect(html).toContain('lux-modals.css?v=20260821-toolbarfooter2');
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
        const socialRoot = bare.match(/body\.lux-route-social \{[\s\S]*?\n\}/)?.[0] || '';
        expect(socialRoot).not.toMatch(/backdrop-filter:\s*none\s*!important/);
    });

    it('loads portal persist runtime before api.js for session token helpers', () => {
        const html = readSource('social.html');
        expect(html).toContain('api-portal-persist-runtime.js');
        expect(html.indexOf('api-portal-persist-runtime.js')).toBeLessThan(html.indexOf('assets/js/app/api.js'));
    });

    it('loads notification snapshot SSOT scripts for utility panel parity', () => {
        const html = readSource('social.html');
        expect(html).toContain('portal-api-stubs-runtime.js');
        expect(html).toContain('luxury-home-model.js');
        expect(html.indexOf('portal-api-stubs-runtime.js')).toBeLessThan(html.indexOf('assets/js/app/auth.js'));
        expect(html.indexOf('social-runtime-lite.js')).toBeLessThan(html.indexOf('luxury-home-model.js'));
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
        expect(bare).toContain('#social-neo-workspace-nav-reveal-region');
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
        expect(bare).toContain('.social-project-health-badge');
        expect(bare).toContain('.social-project-graph-preview-viewport');
        expect(bare).toContain('.social-project-card-new-cta');
        const overviewBlock = bare.slice(
            bare.indexOf('/* Social: overview dashboard zones */'),
            bare.indexOf('/* Social: project task map */')
        );
        expect(overviewBlock).not.toContain('--sn-');
        expect(bare).toContain('.social-project-hub-layout');
        expect(bare).toContain('body.lux-route-social .social-neo-workspace-hub-section');
        expect(bare).toContain('.social-project-hub-filter-label {');
        expect(bare).toContain('.social-neo-section-head > div > span {');
        expect(bare).toContain('.social-neo-workspace-hero-stats');
        expect(bare).toContain('.social-neo-portfolio-hero-stats');
        expect(bare).toContain('.social-portfolio-search-row');
        expect(bare).toContain('.social-neo-portfolio-hero-discover {');
        expect(bare).toContain('.portfolio-panel-tab:is(.lux-primary-btn');
        expect(bare).toContain('.social-neo-muted {');
        expect(bare).toContain(':is(.social-neo-input, .social-neo-select, .social-neo-textarea).lux-control');
        expect(bare).toContain('.social-portfolio-feed');
        expect(bare).toContain('.social-portfolio-card');
        expect(bare).toContain('.portfolio-panel-tab');
        expect(bare).toContain('.social-neo-research-shell');
        expect(bare).toContain('.social-neo-research-grid');
        expect(bare).toContain('.social-neo-research-pdf-shell');
        expect(bare).toContain('body.lux-route-social .social-pin-section');
        expect(bare).toContain('.social-neo-surveys-hero.is-merged');
        expect(bare).toContain('.social-neo-lost-found-hero.is-merged');
        expect(bare).toContain('body.lux-route-social .social-neo-survey-listings');
        expect(bare).not.toContain('social-module-pin-menu-panel');
        expect(bare).toContain('.social-neo-pages-hero-grid');
        expect(bare).toContain('.social-neo-pages-grid');
        expect(bare).toContain('.social-neo-pages-empty-state');
        expect(bare).toContain('.social-neo-page-card-rich');
        expect(bare).toContain('.social-neo-pages-shell');
        expect(bare).toContain('.social-neo-page-profile-header');
        expect(bare).toContain('.social-neo-page-profile-tab.is-active');
        expect(bare).toContain('.social-neo-page-compose-block');
        expect(bare).toContain('.social-neo-post-head-actions');
        expect(bare).toContain('button.social-neo-post-author.social-neo-clickable');
        expect(bare).toContain('.social-neo-post-author-name');
        expect(bare).toContain('.social-photo-tab-segment');
        expect(bare).toContain('.social-photo-hero');
        expect(bare).toContain('.social-neo-rail-title');
        expect(bare).toContain('button.social-photo-tab');
        expect(bare).toContain('button.social-neo-side-link');
        expect(bare).toContain('button.social-neo-workspace-nav-btn');
        expect(bare).toContain('.social-photo-content-stage');
        expect(bare).toContain('.social-photo-grid-tile');
        expect(bare).toContain('.social-photo-upload-dropzone');
        expect(bare).toContain('#social-neo-overlay-portal .social-photo-upload-card');
    });

    it('photography upload dialog uses shared social-glass shell', () => {
        const photo = readSource('assets/js/pages/social-photography.js');
        const modals = readSource('assets/css/lux-modals.css');
        expect(photo).toContain('lux-glass-dialog-card--photography-upload lux-glass-dialog-card--social-glass');
        expect(photo).not.toContain('photo-panel');
        expect(modals).toContain('.lux-glass-dialog-card--photography-upload');
    });

    it('pages hero uses lux-secondary-btn like other social heroes', () => {
        const pages = readSource('assets/js/pages/social-pages.js');
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(pages).toContain('lux-secondary-btn social-neo-pages-hero-tab');
        expect(pages).not.toContain('lux-tab-btn--rich');
        expect(bare).toMatch(/\.social-neo-pages-hero-grid[\s\S]*?grid-template-columns:\s*repeat\(2/);
        expect(bare).toMatch(/social-neo-pages-hero-tab[\s\S]*\.lux-secondary-btn/);
    });

    it('lost-found search uses lux-control', () => {
        const lostFound = readSource('assets/js/pages/social-lost-found.js');
        expect(lostFound).toMatch(/social-neo-input lux-control/);
    });

    it('social-feed.js avoids retired paint classes', () => {
        const feed = readSource('assets/js/pages/social-feed.js');
        expect(feed).toContain('lux-soft-chrome home-hover-chip');
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
        expect(photo).toContain('social-photo-hero');
        expect(photo).toContain('social-photo-chrome-subtitle');
        expect(photo).toMatch(/social-neo-input lux-control[\s\S]*photography-search-input/);
    });

    it('lux-page-bare-lite.css has balanced braces', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        let depth = 0;
        for (const ch of bare) {
            if (ch === '{') depth += 1;
            else if (ch === '}') depth -= 1;
            if (depth < 0) break;
        }
        expect(depth).toBe(0);
    });

    it('registers social-neo-card in fouc-ht nested matte allowlist', () => {
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(fouc).toMatch(/\[data-lux-glass-root="1"\][\s\S]*\.social-neo-card/);
    });

    it('registers project workspace chips in fouc-ht social matte allowlist', () => {
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(fouc).toMatch(/lux-route-social \[data-lux-glass-root="1"\][\s\S]*\.social-project-card-new/);
        expect(fouc).toContain('.spt-desk-package,');
        expect(fouc).toContain('.social-project-metric-card,');
    });

    it('social shells use fouc-ht hover SSOT (not bare-lite panel paint)', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const cardBlock = bare.slice(
            bare.indexOf('body.lux-route-social .social-neo-card'),
            bare.indexOf('body.lux-route-social .social-neo-flash')
        );
        expect(cardBlock).not.toContain('--lux-panel-surface');
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(fouc).toContain('body.lux-route-social :is(#public-social-root, #social-neo-overlay-portal)');
        expect(fouc).toContain('.social-project-task-graph-card.lux-soft-chrome');
        expect(fouc).toContain('.social-neo-messages__thread-shell');
        expect(bare).toContain('--msg-stream-bg');
        expect(fouc).toMatch(/\.home-hover-chip[\s\S]*var\(--home-chip-hover-lift/);
        expect(fouc).not.toMatch(/\.home-hover-chip:has\(\.home-hover-chip:hover\)[\s\S]*transform:\s*none/);
        expect(fouc).toContain('/* Social comments dialog: matte inners (motion → global .home-hover-chip SSOT). */');
        expect(fouc).toContain('#social-neo-overlay-portal .lux-glass-dialog-card--comments :is(');
        expect(fouc).not.toContain('/* Social soft-chrome shells: same hover lift');
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
