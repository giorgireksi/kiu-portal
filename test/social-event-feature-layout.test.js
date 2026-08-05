import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { socialModuleUrlToken, readSocialHtml } from './helpers/social-page-source.js';

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

    it('RSVP is a single Interested toggle with count', () => {
        const events = readSource('assets/js/pages/social-events.js');
        expect(events).toMatch(/isInterested \? 'lux-primary-btn' : 'lux-secondary-btn'\} lux-secondary-btn-sm/);
        expect(events).toMatch(/data-status="\$\{isInterested \? 'declined' : 'interested'\}"/);
        expect(events).toContain('Interested · ${escape(String(interestedCount))}');
        expect(events).toContain('`${interestedCount} interested`');
        expect(events).not.toMatch(/data-status="going">Going</);
        expect(events).not.toMatch(/data-status="declined">Decline</);
        expect(events).not.toMatch(/viewerRsvpStatus === 'going'/);
    });

    it('event RSVP click path resolves portal API and exports handler after init', () => {
        const events = readSource('assets/js/pages/social-events.js');
        const page = readSource('assets/js/pages/social-page.js');

        expect(events).toContain("action === 'event-rsvp'");
        expect(events).toContain('respondPortalSocialEventRsvp(eventId');
        expect(events).toContain('window.respondPortalSocialEventRsvp');
        expect(events).toContain('window.handleSocialEventsClick = handleSocialEventsClick');
        expect(events).toMatch(/__KIU_SOCIAL_EVENTS_MODULE_LOADED = true;\s*\}\)\(\);/);
        expect(events).not.toMatch(/if \(window\.__KIU_SOCIAL_EVENTS_MODULE_LOADED\) return;\s*window\.__KIU_SOCIAL_EVENTS_MODULE_LOADED = true;/);
        expect(events).toContain("trigger.closest('.social-neo-time-group')");
        expect(events).not.toMatch(/event-time-group-toggle[\s\S]{0,80}event\.preventDefault\(\)/);

        expect(page).toContain(socialModuleUrlToken('social-events.js'));
        expect(page).toContain('respondPortalSocialEventRsvp: window.respondPortalSocialEventRsvp');
        expect(page).toContain('createPortalSocialEvent: window.createPortalSocialEvent');
        expect(page).toContain('typeof window.handleSocialEventsClick === \'function\'');
        expect(events).toMatch(/action === 'event-rsvp'[\s\S]{0,280}patchEventRsvpButtons\(eventId\)/);
        expect(events).not.toMatch(/action === 'event-rsvp'[\s\S]{0,280}renderSocialPageNow\('event-rsvp'\)/);
    });

    it('event feature title lives in the card, not the date-group head', () => {
        const events = readSource('assets/js/pages/social-events.js');
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(events).toContain('social-neo-event-feature-title');
        expect(events).toContain('social-neo-event-feature-head-main');
        expect(events).not.toMatch(/social-neo-event-date-group-head[\s\S]{0,400}social-neo-event-date-group-title/);
        expect(bare).toContain('.social-neo-event-feature-title');
        expect(bare).toMatch(/\.social-neo-event-feature\s*\{[\s\S]{0,120}padding:\s*12px 14px 12px 18px/);
        expect(bare).toMatch(/\.social-neo-event-date-group\s*\{[\s\S]{0,80}padding:\s*8px 10px/);
        expect(bare).toMatch(/\.social-neo-event-feature-foot\s*\{[\s\S]{0,80}min-height:\s*0/);
        expect(bare).toMatch(/\.social-neo-event-feature-desc-rail\.is-scrollable[\s\S]{0,400}min-height:\s*calc\(1\.45em \* 6 \+ 16px \+ 12px\)/);
    });

    it('event description scroll rail clips long text inside the card', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toMatch(/\.social-neo-event-feature-desc-rail[\s\S]{0,600}overflow:\s*hidden/);
        expect(bare).toMatch(/\.social-neo-event-feature-desc-rail[\s\S]{0,600}minmax\(0,\s*1fr\)/);
        expect(bare).toMatch(/\.social-neo-event-feature-desc-viewport\s*\{[\s\S]{0,300}max-height:\s*calc\(1\.45em \* 6 \+ 16px\)/);
        expect(bare).toMatch(/\.social-neo-event-feature-desc-rail\.is-scrollable \.social-neo-event-feature-desc-viewport[\s\S]{0,400}min-height:\s*calc\(1\.45em \* 6 \+ 16px\)/);
        expect(bare).not.toMatch(/:not\(\.is-scrollable\)[\s\S]{0,400}\.social-neo-event-feature-desc-viewport[\s\S]{0,200}max-height:\s*none/);
        expect(bare).toMatch(/\.social-neo-event-feature-desc-viewport[\s\S]{0,400}overflow-y:\s*auto/);
        expect(bare).toMatch(/\.social-neo-event-feature-desc\s*\{[\s\S]{0,200}max-width:\s*100%/);
        expect(bare).toMatch(/\.social-neo-event-feature\s*\{[\s\S]{0,260}overflow:\s*visible/);
    });

    it('event description scroll rail uses vertical stacked chip controls', () => {
        const events = readSource('assets/js/pages/social-events.js');
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const page = readSource('assets/js/pages/social-page.js');

        expect(events).toContain('lux-scroll-rail__dock--vertical');
        expect(events).toContain('hidden aria-hidden="true"');
        expect(bare).toMatch(/\.social-neo-event-feature-desc-controls[\s\S]{0,400}\.lux-scroll-rail__dock--vertical\s*\{[\s\S]{0,200}flex-direction:\s*column/);
        expect(bare).toMatch(/\.social-neo-event-feature-desc-controls[\s\S]{0,400}\.lux-scroll-rail__dock--vertical\s*\{[\s\S]{0,300}flex-shrink:\s*0/);
        expect(bare).toMatch(/\.social-neo-event-feature-desc-controls[\s\S]{0,400}justify-content:\s*center/);
        expect(bare).toMatch(/\.social-neo-event-feature-desc-rail[\s\S]{0,600}grid-template-columns:\s*44px minmax\(0,\s*1fr\)/);
        expect(bare).toMatch(/\.social-neo-event-feature-desc-rail[\s\S]{0,1200}:not\(\.is-scrollable\)[\s\S]{0,200}min-height:\s*0/);
        expect(bare).toMatch(/\.is-scrollable \.lux-scroll-rail__controls:not\(\[hidden\]\)\s*\{[\s\S]{0,120}display:\s*flex/);
        expect(readSource('assets/js/shared/lux-scroll-rail.js')).toMatch(/observer\.observe\(list\);[\s\S]{0,120}firstElementChild/);
        expect(page).toContain(socialModuleUrlToken('social-events.js'));
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
        expect(portfolio).toContain('social-neo-pill lux-status-pill');
        expect(portfolio).not.toMatch(/social-neo-pill lux-status-pill home-hover-chip/);
        expect(portfolio).toContain('social-neo-community-panel--portfolio home-hover-chip');
        expect(portfolio).toContain('social-neo-portfolio-hero-stats home-hover-chip');
        expect(groups).toContain('social-neo-group-card home-hover-chip');
        expect(groups).toContain('social-neo-community-panel--groups home-hover-chip');
        expect(groups).toContain('social-neo-groups-hero-grid home-hover-chip');
        expect(community).toContain('social-neo-community-card home-hover-chip');
        const feedRuntime = readSource('assets/js/pages/social-page-feed-runtime.js');
        expect(feedRuntime).toContain('social-neo-community-hero-stats home-hover-chip');
        expect(feedRuntime).toContain('social-neo-community-hero-grid home-hover-chip');
        expect(feedRuntime).not.toMatch(/social-neo-community-hero-tab[\s\S]{0,120}home-hover-chip/);
        expect(community).toContain('social-neo-community-hero-toolbar home-hover-chip');
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
        expect(fouc).toContain('.social-neo-community-card');
        expect(fouc).toContain('.social-neo-community-hero-grid');
        expect(fouc).toContain('.social-neo-community-hero-stats');
        expect(fouc).toContain('.social-neo-community-hero-toolbar');
        expect(fouc).toMatch(/lux-route-social[\s\S]*\.social-neo-directory-item[\s\S]*home-hover-chip:hover[\s\S]*home-chip-hover-lift/);
        expect(fouc).toMatch(/lux-route-social[\s\S]*\.social-neo-community-hero-grid[\s\S]*home-hover-chip:hover[\s\S]*home-chip-hover-lift/);
        expect(fouc).toMatch(/lux-route-social[\s\S]*\.social-neo-community-hero-toolbar[\s\S]*home-hover-chip:hover[\s\S]*home-chip-hover-lift/);
        expect(fouc).toMatch(/\(hover: none\), \(pointer: coarse\)[\s\S]*\.social-neo-directory-item[\s\S]*home-hover-chip:active/);
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
        expect(fouc).not.toContain('.social-portfolio-card :is(.social-neo-pill, .lux-status-pill).home-hover-chip');
        expect(fouc).toContain('.social-neo-post-card:not(.social-portfolio-card)');
        expect(fouc).toContain('[class*="-hero-grid"]');
        expect(fouc).toContain('[class*="-hero-toolbar"]');

        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('.social-neo-community-panel--hero.is-merged');
        expect(bare).toContain('.social-neo-community-panel--directory.is-merged');
        expect(bare).toMatch(/\.social-neo-community-panel--directory\.is-merged[\s\S]*?overflow:\s*visible/);
        expect(bare).toMatch(/\.social-neo-community-panel--hero\.is-merged[\s\S]*?overflow:\s*visible/);
    });

    it('home feed shells use global home-hover-chip for lift motion', () => {
        const feed = readSource('assets/js/pages/social-feed.js');
        const page = readSource('assets/js/pages/social-page.js');
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const html = readSource('social.html');

        expect(feed).toContain('social-neo-card social-neo-post-card lux-soft-chrome home-hover-chip');
        expect(feed).toContain('social-neo-feed-hero-stats home-hover-chip');
        expect(feed).toContain('social-neo-feed-hero-grid home-hover-chip');
        expect(feed).toContain('social-neo-composer-cta-card lux-soft-chrome home-hover-chip');
        expect(feed).toContain('social-neo-feed-header-card lux-soft-chrome home-hover-chip');
        expect(feed).toContain('social-neo-feed-hero-stat social-neo-events-hero-stat lux-strip-card surface-card lux-soft-chrome home-hover-chip');
        expect(feed).not.toMatch(/social-neo-feed-hero-tab[\s\S]{0,120}home-hover-chip/);
        expect(fouc).toContain('.social-neo-feed-header-card');
        expect(fouc).toContain('.social-neo-feed-hero-stats');
        expect(fouc).toContain('.social-neo-feed-hero-grid');
        expect(fouc).toContain('.social-neo-composer-cta-card');
        expect(fouc).toContain('.social-neo-post-card');
        expect(bare).toMatch(/\.social-neo-feed-header-card\s*\{[^}]*overflow:\s*visible/);
        expect(page).toContain(socialModuleUrlToken('social-feed.js'));
        expect(html).toContain('lux-fouc-ht.css?v=');
        expect(html).toContain('lux-page-bare-lite.css?v=');
        expect(html).toContain('social-page.js?v=');
    });

    it('portfolio discover filter shell uses global home-hover-chip for lift motion', () => {
        const portfolioUi = readSource('assets/js/pages/social-workspace-portfolio-ui.js');
        const page = readSource('assets/js/pages/social-page.js');
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        const bare = readSource('assets/css/lux-page-bare-lite.css');

        expect(portfolioUi).toContain('social-neo-portfolio-hero-discover lux-soft-chrome home-hover-chip');
        expect(portfolioUi).toContain('social-portfolio-search-row lux-soft-chrome home-hover-chip');
        expect(portfolioUi).toContain('social-portfolio-tag-row lux-soft-chrome home-hover-chip');
        expect(fouc).toContain('.social-neo-portfolio-hero-discover');
        expect(fouc).toContain('.social-portfolio-search-row');
        expect(fouc).toContain('.social-portfolio-tag-row');
        expect(bare).toMatch(/\.social-neo-portfolio-hero-discover\s*\{[^}]*overflow:\s*visible/);
        expect(bare).not.toMatch(/\.social-neo-portfolio-hero-discover\s*\{[^}]*background-color:\s*var\(--social-chip-fill\)/);
        expect(page).toContain(socialModuleUrlToken('social-workspace-portfolio-ui.js'));
    });

    it('portfolio feed grows with the page (no hub scroll-list cap)', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        const portfolioUi = readSource('assets/js/pages/social-workspace-portfolio-ui.js');
        expect(portfolioUi).toContain('class="social-portfolio-feed"');
        expect(portfolioUi).not.toContain('social-project-scroll-list');
        expect(portfolioUi).not.toContain('social-project-scroll-list--portfolio');
        expect(bare).not.toContain('.social-project-scroll-list--portfolio');
        expect(bare).not.toContain('.social-portfolio-feed.social-project-scroll-list');
        expect(bare).toMatch(/\.social-portfolio-feed\s*\{[\s\S]{0,120}gap:\s*8px/);
        expect(bare).toMatch(/\.social-portfolio-feed\s*\{[\s\S]{0,160}padding:\s*2px 0 4px/);
        expect(bare).toMatch(/\.social-portfolio-feed\s*\{[\s\S]{0,200}overflow:\s*visible/);
        expect(bare).not.toMatch(/\.social-portfolio-feed[\s\S]{0,200}max-height/);
        expect(bare).not.toMatch(/\.social-portfolio-feed[\s\S]{0,200}overflow-y:\s*auto/);
        expect(bare).toContain('.social-neo-post-card.social-portfolio-card.home-hover-chip');
        expect(bare).toMatch(/\.social-neo-post-card\.social-portfolio-card\.home-hover-chip[\s\S]{0,160}overflow:\s*hidden/);
        expect(bare).toMatch(/\.social-neo-post-card\.social-portfolio-card\.home-hover-chip[\s\S]{0,200}contain:\s*paint/);
        expect(bare).toMatch(/\.social-neo-post-card\.social-portfolio-card\.home-hover-chip[\s\S]{0,200}min-height:\s*min-content/);
        expect(bare).toContain('.social-neo-community-panel--portfolio.is-merged');
        expect(bare).toMatch(/\.social-neo-community-panel--portfolio\.is-merged[\s\S]{0,200}overflow:\s*visible/);
        expect(bare).toMatch(/\.social-portfolio-card\s*\{[\s\S]{0,80}padding:\s*8px 10px/);
        expect(bare).toMatch(/\.social-portfolio-card-title\s*\{[\s\S]{0,80}font-size:\s*14px/);
        expect(bare).toMatch(/\.social-portfolio-actions :is\(\.lux-primary-btn, \.lux-secondary-btn\)\s*\{[\s\S]{0,80}min-height:\s*28px/);
        expect(bare).not.toMatch(/\.social-portfolio-actions\s*\{[\s\S]{0,200}z-index:\s*1/);
        expect(portfolioUi).toContain('social-portfolio-actions');
        expect(portfolioUi).not.toMatch(/social-portfolio-actions[\s\S]{0,600}home-hover-chip/);
        expect(fouc).toContain('.social-neo-post-card:not(.social-portfolio-card)');
        // :is() must not include lux-card:not(...) or home-hover-chip inherits inflated specificity
        expect(fouc).not.toMatch(/:is\(\s*\n\s*\.home-hover-chip,\s*\n\s*\.lux-card:not\(\.orders-inbox-hero\)/);
        expect(fouc).toContain('body.lux-unified-shell .lux-card:not(.orders-inbox-workspace),');
    });

    it('student events calendar uses my/community filter toggle without a separate manage panel', () => {
        const events = readSource('assets/js/pages/social-events.js');
        const fingerprint = readSource('assets/js/pages/social-fingerprint-model.js');
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(events).not.toContain("'Your student events'");
        expect(events).not.toContain('sortEventsWithManageableFirst');
        expect(events).toContain('eventsStudentFilter');
        expect(events).toContain('social-neo-events-student-filter');
        expect(events).toContain("data-events-student-filter=\"community\"");
        expect(events).toContain("data-events-student-filter=\"mine\"");
        expect(events).toContain('myStudentEvents = studentEvents.filter((entry) => eventCanManage(entry))');
        expect(events).toContain('communityStudentEvents = studentEvents.filter((entry) => !eventCanManage(entry))');
        expect(events).toContain('renderEventGroups(sortEventsByStart(visibleStudentEvents)');
        expect(events).toContain("renderSocialPageNow('events-student-filter')");
        expect(events).toContain("renderManagedEventsCard('Your official events'");
        expect(fingerprint).toContain('eventsStudentFilter');
        expect(bare).toContain('.social-neo-events-student-filter');
    });

    it('events hero light mode uses darker copy tokens and avoids corner clipping', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toMatch(/\.social-neo-events-content[\s\S]{0,400}--social-events-title/);
        expect(bare).toMatch(/\.social-neo-events-hero\.is-merged\s*\{[\s\S]{0,120}overflow:\s*visible/);
        expect(bare).toMatch(/\.social-neo-events-hero\.is-merged \.social-neo-events-manage-card[\s\S]{0,180}padding:\s*10px 12px/);
        expect(bare).not.toMatch(/\.social-neo-events-hero\.is-merged \.social-neo-events-manage-card[\s\S]{0,180}padding:\s*0;/);
        expect(bare).toMatch(/\.social-neo-events-hero\.is-merged[\s\S]{0,500}overflow:\s*visible[\s\S]{0,80}contain:\s*layout style/);
        expect(bare).toMatch(/\.social-neo-event-feature\s*\{[\s\S]{0,260}overflow:\s*visible/);
        expect(bare).toContain('.social-neo-events-hero-stats');
        expect(bare).toMatch(/\.social-neo-events-hero-stats\s*\{[\s\S]{0,120}repeat\(4,\s*minmax\(0,\s*1fr\)\)/);
    });
});
