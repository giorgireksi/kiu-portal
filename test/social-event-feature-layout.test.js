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

    it('event shells use global home-hover-chip for lift motion', () => {
        const events = readSource('assets/js/pages/social-events.js');
        const fouc = readSource('assets/css/lux-fouc-ht.css');

        expect(events).toContain('social-neo-event-feature social-neo-event-feature--${escape(tone)} home-hover-chip');
        expect(events).toContain('social-neo-event-date-group home-hover-chip');
        expect(events).toContain('social-neo-events-hub-section social-neo-events-manage-card home-hover-chip');
        expect(events).toContain('social-neo-events-hub-section social-neo-events-list-card home-hover-chip');
        expect(events).toContain('social-neo-entity-card social-neo-events-manage-item home-hover-chip');
        expect(events).toContain('social-neo-entity-card social-neo-entity-card--study home-hover-chip');
        expect(events).toContain('social-neo-events-hero home-hover-chip');
        expect(events).toContain('social-neo-events-hero-grid home-hover-chip');
        expect(events).toContain('social-neo-events-hero-stats home-hover-chip');
        expect(events).toContain('social-neo-events-hero-stat lux-strip-card surface-card lux-soft-chrome home-hover-chip');
        expect(events).toContain('social-neo-empty social-neo-events-empty home-hover-chip');
        expect(events).not.toMatch(/social-neo-events-hero-tab[\s\S]{0,120}home-hover-chip/);
        expect(fouc).toMatch(/body\.lux-route-social \.social-neo-event-feature\.home-hover-chip[\s\S]*?overflow:\s*visible/);
        expect(fouc).toContain('.social-neo-events-hero-grid');
        expect(fouc).toContain('.social-neo-events-hero-stats');
        expect(fouc).toContain('.social-neo-events-hero-stat');
        expect(fouc).toContain('.social-neo-portfolio-hero');
        expect(fouc).toContain('.social-neo-portfolio-hero-stats');
        expect(fouc).toContain('.social-neo-research-hero');
        expect(fouc).toContain('.social-neo-research-hero-stats');
        expect(fouc).toContain('.social-neo-research-stat');
        expect(fouc).toContain('[class*="-hero-stat"]');
        expect(fouc).toMatch(/lux-route-social[\s\S]*\[class\*="-hero-stat"\][\s\S]*home-hover-chip:hover[\s\S]*home-chip-hover-lift/);
        expect(fouc).toMatch(/\(hover: none\), \(pointer: coarse\)[\s\S]*\[class\*="-hero-stat"\][\s\S]*home-hover-chip:active/);
        expect(fouc).toMatch(/\[data-lux-glass-root="1"\][\s\S]*\[class\*="-hero-stat"\][\s\S]*--home-chip-fill/);
        expect(fouc).toMatch(/home-hover-chip:hover[\s\S]*--home-fade-shadow-hover/);
        expect(fouc).toContain('.social-neo-events-empty');
    });

    it('community listing shells use global home-hover-chip for lift motion', () => {
        const lostFound = readSource('assets/js/pages/social-lost-found.js');
        const photo = readSource('assets/js/pages/social-photography.js');
        const portfolio = readSource('assets/js/pages/social-workspace-portfolio-ui.js');
        const groups = readSource('assets/js/pages/social-groups.js');
        const community = readSource('assets/js/pages/social-community.js');
        const pages = readSource('assets/js/pages/social-pages.js');
        const fouc = readSource('assets/css/lux-fouc-ht.css');

        expect(lostFound).toContain('social-neo-lf-card home-hover-chip');
        expect(lostFound).toContain('social-neo-pill lux-status-pill home-hover-chip');
        expect(lostFound).toContain('social-neo-lost-found-hero');
        expect(lostFound).toContain("'home-hover-chip'");
        expect(lostFound).toContain('social-neo-lost-found-hero-stats social-neo-lost-found-hero-stats--dual home-hover-chip');
        expect(lostFound).toContain('social-neo-lost-found-hero-toolbar home-hover-chip');
        expect(fouc).toContain('.social-neo-pill.home-hover-chip');
        expect(photo).toContain('social-photo-feed-card home-hover-chip');
        expect(photo).toContain('social-photo-grid-tile home-hover-chip');
        expect(portfolio).toContain('social-portfolio-card lux-soft-chrome home-hover-chip');
        expect(portfolio).toContain('social-portfolio-mini-card home-hover-chip');
        expect(portfolio).toContain('social-neo-pill lux-status-pill home-hover-chip');
        expect(portfolio).toContain('social-neo-community-panel--portfolio home-hover-chip');
        expect(portfolio).toContain('social-neo-portfolio-hero-stats home-hover-chip');
        expect(groups).toContain('social-neo-group-card home-hover-chip');
        expect(groups).toContain('social-neo-community-panel--groups home-hover-chip');
        expect(groups).toContain('social-neo-groups-hero-grid home-hover-chip');
        expect(community).toContain('social-neo-community-card home-hover-chip');
        expect(pages).toContain('social-neo-pages-hero home-hover-chip');
        expect(pages).toContain('social-neo-pages-hero-grid home-hover-chip');
        expect(pages).toContain('social-neo-pages-hero-toolbar home-hover-chip');
        expect(pages).toContain('social-neo-page-card-rich home-hover-chip');
        expect(pages).toContain('social-neo-page-profile home-hover-chip');
        expect(pages).toContain('social-neo-page-profile-tab home-hover-chip');
        expect(pages).toContain('social-neo-page-compose-block lux-soft-chrome home-hover-chip');
        expect(groups).not.toMatch(/social-neo-groups-hero-tab[\s\S]{0,120}home-hover-chip/);
        expect(pages).not.toMatch(/social-neo-pages-hero-tab[\s\S]{0,120}home-hover-chip/);
        expect(portfolio).not.toMatch(/portfolio-panel-tab[\s\S]{0,120}home-hover-chip/);
        expect(fouc).toMatch(/body\.lux-route-social :is\([\s\S]*?\.social-photo-feed-card[\s\S]*?\)\.home-hover-chip[\s\S]*?overflow:\s*visible/);
        expect(fouc).toContain('.social-neo-group-card');
        expect(fouc).toContain('.social-neo-directory-item');
        expect(fouc).toContain('.social-neo-pages-hero');
        expect(fouc).toContain('.social-neo-pages-hero-grid');
        expect(fouc).toContain('.social-neo-pages-hero-toolbar');
        expect(fouc).toContain('.social-neo-page-card');
        expect(fouc).toContain('.social-neo-page-profile');
        expect(fouc).toContain('.social-neo-page-compose-block');
        expect(fouc).toContain('.social-neo-page-profile-tab.home-hover-chip');
        expect(fouc).toContain('.social-neo-groups-hero-grid');
        expect(fouc).toContain('.social-neo-lost-found-hero');
        expect(fouc).toContain('.social-neo-lost-found-hero-stats');
        expect(fouc).toContain('.social-neo-lost-found-hero-toolbar');
        expect(fouc).toContain('.social-neo-lf-card');
        expect(fouc).toContain('.social-portfolio-card :is(.social-neo-pill, .lux-status-pill).home-hover-chip');
        expect(fouc).toContain('[class*="-hero-grid"]');
        expect(fouc).toContain('[class*="-hero-toolbar"]');
    });

    it('portfolio feed keeps card lift and action buttons unclipped', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        const portfolioUi = readSource('assets/js/pages/social-workspace-portfolio-ui.js');
        expect(bare).toContain('.social-portfolio-card.home-hover-chip');
        expect(bare).toMatch(/\.social-portfolio-card\.home-hover-chip[\s\S]{0,160}overflow:\s*visible/);
        expect(bare).toMatch(/\.social-portfolio-card\.home-hover-chip[\s\S]{0,200}min-height:\s*min-content/);
        expect(bare).toContain('.social-neo-community-panel--portfolio.is-merged');
        expect(bare).toMatch(/\.social-neo-community-panel--portfolio\.is-merged[\s\S]{0,200}overflow:\s*visible/);
        expect(bare).toContain('.social-project-scroll-list--portfolio');
        expect(bare).toMatch(/\.social-project-scroll-list--portfolio[\s\S]{0,160}gap:\s*24px/);
        expect(bare).toMatch(/\.social-project-scroll-list--portfolio[\s\S]{0,160}padding:\s*10px 8px 16px/);
        expect(bare).toContain('.social-portfolio-feed.social-project-scroll-list');
        expect(bare).toMatch(/\.social-portfolio-feed\.social-project-scroll-list\s*\{[\s\S]{0,60}gap:\s*24px/);
        expect(bare).toMatch(/\.social-portfolio-card\s*\{[\s\S]{0,80}padding:\s*16px 16px 32px/);
        expect(bare).toMatch(/\.social-portfolio-actions\s*\{[\s\S]{0,160}padding-bottom:\s*2px/);
        expect(portfolioUi).toContain('social-portfolio-actions');
        expect(portfolioUi).not.toMatch(/social-portfolio-actions[\s\S]{0,600}home-hover-chip/);
        // :is() must not include lux-card:not(...) or home-hover-chip inherits inflated specificity
        expect(fouc).not.toMatch(/:is\(\s*\n\s*\.home-hover-chip,\s*\n\s*\.lux-card:not\(\.orders-inbox-hero\)/);
        expect(fouc).toContain('body.lux-unified-shell .lux-card:not(.orders-inbox-workspace),');
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
