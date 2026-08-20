import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social shortcuts top nav + desktop rail', () => {
    it('restores desktop workspace rail and mounts bottom-nav-style Social Shortcuts on phone', () => {
        const shell = readSource('assets/js/pages/social-page-shell-runtime.js');
        const interactions = readSource('assets/js/pages/social-page-interactions-runtime.js');
        const page = readSource('assets/js/pages/social-page.js');
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const html = readSource('social.html');
        const sw = readSource('service-worker.js');
        const nav = readSource('assets/js/pages/social-shell-nav.js');

        expect(shell).toContain('function renderSocialShortcutsTopNav(');
        expect(shell).toContain('function isSocialShortcutsTopNavViewport()');
        expect(shell).toContain("matchMedia('(max-width: 1024px)')");
        expect(shell).toContain('window.renderSocialShortcutsTopNav = renderSocialShortcutsTopNav');
        expect(shell).not.toContain('isSocialTopWorkspaceStripViewport');
        expect(shell).not.toMatch(/function renderShellWorkspaceNav\([\s\S]*?if \(isSocialTop/);
        expect(shell).toContain('activeNavPanels()');
        expect(shell).toContain('aria-label="Social Workspace"');
        expect(shell).not.toContain("label: 'Feed'");
        expect(shell).not.toContain("label: 'Saved'");
        expect(shell).not.toContain("label: 'Mods'");
        expect(shell).toContain('social-shortcuts-top-nav');

        expect(interactions).toContain('renderSocialShortcutsTopNav');
        expect(interactions).toContain('useShortcutsTopNav');
        expect(interactions).toContain('isPhoneSocialShortcutsViewport');
        expect(interactions).toContain('renderSocialShortcutsTopNavFallback');
        expect(interactions).toContain('socialWorkspaceTopNavPanelsFallback');
        expect(interactions).toContain("label: 'Home'");
        expect(interactions).toContain("label: 'People'");
        expect(interactions).toContain("label: 'Lost & Found'");
        expect(interactions).toContain("label: 'Alerts'");
        expect(interactions).toContain('window.activeNavPanels || window.KiuSocialPanelModel?.activeNavPanels');
        expect(interactions).toContain('bindSocialShortcutsViewportWatcher');
        expect(interactions).toContain('syncSocialShortcutsTopNavPortal');
        expect(interactions).toContain('bindSocialShortcutsScrollIndicator');
        expect(interactions).toContain('updateSocialShortcutsScrollIndicator');
        expect(interactions).toContain('row.scrollWidth - row.clientWidth');
        expect(interactions).toContain('new ResizeObserver(update)');
        expect(interactions).toContain('const existingRow = portal?.querySelector?.');
        expect(interactions).toContain('const priorScrollLeft = existingRow');
        expect(interactions).toContain('nextRow.scrollLeft = Math.max(0, Math.min(maxScrollLeft, priorScrollLeft))');
        expect(interactions).toContain('requestAnimationFrame(() =>');
        expect(interactions).toContain('social-shortcuts-top-nav-portal');
        expect(interactions).toContain('social-has-shortcuts-top-nav');
        expect(interactions).not.toContain('renderShellPrimaryNav(activePanel)');
        expect(interactions).not.toContain('social-neo-top-workspace-nav');

        expect(page).toContain('renderSocialShortcutsTopNav, isSocialShortcutsTopNavViewport');
        expect(nav).toContain("trigger.getAttribute('data-profile-tab')");

        expect(bare).toContain('.social-shortcuts-top-nav-btn');
        expect(bare).toContain('flex-direction: column');
        expect(bare).toContain('--social-shortcuts-top-nav-height');
        expect(bare).toContain('#social-shortcuts-top-nav-portal');
        expect(bare).toContain('social-has-shortcuts-top-nav');
        const shortcutsCss = bare.slice(
            bare.indexOf('/* Phone: Social Shortcuts top bar'),
            bare.indexOf('body.lux-route-social .social-pagination-mode-control')
        );
        expect(shortcutsCss).toMatch(/#social-shortcuts-top-nav-portal[\s\S]*position:\s*fixed/);
        expect(shortcutsCss).toMatch(/#social-shortcuts-top-nav-portal[\s\S]*top:\s*0/);
        expect(shortcutsCss).toMatch(/social-has-shortcuts-top-nav[\s\S]*#social-neo-root[\s\S]*padding-top:\s*calc\(var\(--social-shortcuts-top-nav-height/);
        expect(shortcutsCss).toMatch(/@media \(max-width: 1024px\)[\s\S]*#social-neo-workspace-nav-region[\s\S]*display:\s*none/);
        expect(shortcutsCss).toMatch(/@media \(min-width: 1025px\)[\s\S]*#social-shortcuts-top-nav-portal[\s\S]*display:\s*none/);
        expect(shortcutsCss).toContain('touch-action: pan-x');
        expect(shortcutsCss).toContain('overscroll-behavior-y: none');
        expect(shortcutsCss).toContain('flex-wrap: nowrap');
        expect(shortcutsCss).toContain('.social-shortcuts-top-nav-scroll-indicator');
        expect(shortcutsCss).toContain('.social-shortcuts-top-nav-scroll-thumb');
        expect(shortcutsCss).toContain('scrollbar-width: none');
        expect(shortcutsCss).toContain('display: none');
        expect(shortcutsCss).toContain('bottom: 2px');
        expect(shortcutsCss).toMatch(/\.social-shortcuts-top-nav::after/);
        expect(shortcutsCss).toMatch(/linear-gradient\(to right/);
        expect(shortcutsCss).not.toContain('max-width: 1180px');
        expect(shortcutsCss).not.toContain('position: sticky');

        expect(html).toMatch(/lux-page-bare-lite\.css\?v=/);
        expect(html).toMatch(/social-page-interactions-runtime\.js\?v=/);
        expect(sw).toMatch(/CACHE_NAME = 'kiu-portal-shell-v/);
    });

    it('densifies phone feed chrome without changing desktop stack order', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const feed = readSource('assets/js/pages/social-feed.js');
        const page = readSource('assets/js/pages/social-page.js');

        expect(feed).toContain('social-neo-feed-mobile-stack');
        expect(feed).toContain('social-neo-feed-hero-action-label');
        expect(feed).toMatch(/social-neo-feed-mobile-stack[\s\S]*\$\{composerMarkup\}[\s\S]*\$\{renderFeedHero\(/);

        expect(bare).toContain('Phone: densify Feed panel chrome');
        expect(bare).toMatch(/\.social-neo\[data-panel="feed"\] #social-neo-command-region/);
        expect(bare).toMatch(/\.social-neo\[data-panel="feed"\] \.social-neo-feed-hero-stats/);
        expect(bare).toMatch(/\.social-neo\[data-panel="feed"\] \.social-neo-feed-hero-scope/);
        expect(bare).toMatch(/\.social-neo\[data-panel="feed"\] \.social-neo-feed-hero-action-btn\[data-action="panel-groups"\]/);
        expect(bare).toMatch(/@media \(min-width: 1025px\)[\s\S]*\.social-neo-feed-mobile-stack \.social-neo-feed-hero[\s\S]*order:\s*1/);
        expect(bare).toMatch(/\.social-neo-feed-mobile-stack \.social-neo-feed-composer-zone[\s\S]*order:\s*1/);

        expect(page).toMatch(/social-feed\.js\?v=/);
    });

    it('densifies phone messages as list XOR thread without desktop auto-select', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const messages = readSource('assets/js/pages/social-messages.js');
        const page = readSource('assets/js/pages/social-page.js');

        expect(messages).toContain('function isSocialMessagesPhoneViewport()');
        expect(messages).toContain("matchMedia('(max-width: 1024px)')");
        expect(messages).toMatch(/isPhoneMessages \? null : visibleChats\[0\]/);
        expect(messages).toContain("chat ? 'is-thread-open' : 'is-thread-closed'");
        expect(messages).toContain('data-action="messages-inbox-back"');
        expect(messages).toContain("action === 'messages-inbox-back'");
        expect(messages).toContain("setActiveChat('')");

        expect(bare).toContain('Phone: densify Messages');
        expect(bare).toMatch(/\.social-neo\[data-panel="messages"\] #social-neo-command-region/);
        expect(bare).toMatch(/\.social-neo-messages:not\(\.is-thread-open\) \.social-neo-messages__thread-shell/);
        expect(bare).toMatch(/\.social-neo-messages\.is-thread-open \.social-neo-messages__inbox/);
        expect(bare).toMatch(/grid-template-columns:\s*minmax\(300px,\s*320px\)\s*minmax\(0,\s*1fr\)/);

        expect(page).toMatch(/social-messages\.js\?v=/);
    });

    it('densifies phone lost-and-found hero without changing desktop stats layout', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const lostFound = readSource('assets/js/pages/social-lost-found.js');
        const page = readSource('assets/js/pages/social-page.js');

        expect(lostFound).toContain('social-neo-lost-found-hero');
        expect(lostFound).toContain('is-merged');
        expect(lostFound).toContain('data-action="lost-found-create-open"');

        expect(bare).toContain('Phone: densify Lost');
        expect(bare).toMatch(/\.social-neo\[data-panel="lost-and-found"\] #social-neo-command-region/);
        expect(bare).toMatch(/\.social-neo\[data-panel="lost-and-found"\] \.social-neo-lost-found-hero-head[\s\S]*flex-direction:\s*column/);
        expect(bare).toMatch(/grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);

        expect(page).toMatch(/social-lost-found\.js\?v=/);
    });

    it('densifies phone surveys hero with chip lane/tab rows and compact stats', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const surveys = readSource('assets/js/pages/social-surveys.js');
        const page = readSource('assets/js/pages/social-page.js');

        expect(surveys).toContain('social-neo-surveys-hero');
        expect(surveys).toContain('is-merged');
        expect(surveys).toContain('social-neo-surveys-hero-grid--lanes');
        expect(surveys).toContain('data-action="survey-create-open"');

        expect(bare).toContain('Phone: densify Surveys');
        expect(bare).toMatch(/\.social-neo\[data-panel="surveys"\] #social-neo-command-region/);
        expect(bare).toMatch(/\.social-neo\[data-panel="surveys"\] \.social-neo-surveys-hero-head[\s\S]*flex-direction:\s*column/);
        expect(bare).toMatch(/\.social-neo\[data-panel="surveys"\] \.social-neo-surveys-hero-grid--lanes[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
        expect(bare).toMatch(/\.social-neo\[data-panel="surveys"\] \.social-neo-surveys-hero-grid:not\(\.social-neo-surveys-hero-grid--lanes\)[\s\S]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
        expect(bare).toMatch(/\.social-neo\[data-panel="surveys"\] \.social-neo-surveys-hero-tab-copy small[\s\S]*display:\s*none/);
        expect(bare).toMatch(/grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);

        expect(page).toMatch(/social-surveys\.js\?v=/);
    });

    it('densifies phone research hero with 2x2 stats and lane tabs', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const research = readSource('assets/js/pages/social-research.js');
        const page = readSource('assets/js/pages/social-page.js');

        expect(research).toContain('social-neo-research-hero');
        expect(research).toContain('social-neo-research-tabs');
        expect(research).toContain('data-action="research-create-open"');

        expect(bare).toContain('Phone: densify Research');
        expect(bare).toMatch(/\.social-neo\[data-panel="research"\] #social-neo-command-region/);
        expect(bare).toMatch(/\.social-neo\[data-panel="research"\] \.social-neo-research-hero-head[\s\S]*flex-direction:\s*column/);
        expect(bare).toMatch(/\.social-neo\[data-panel="research"\] \.social-neo-research-hero-stats[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
        expect(bare).toMatch(/\.social-neo\[data-panel="research"\] \.social-neo-research-tabs[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
        expect(bare).toMatch(/\.social-neo\[data-panel="research"\] \.social-neo-research-tab-copy small[\s\S]*display:\s*none/);

        expect(page).toMatch(/social-research\.js\?v=/);
    });

    it('densifies phone community hero with 2x2 stats/tabs and stacked filters', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const community = readSource('assets/js/pages/social-community.js');
        const feedRuntime = readSource('assets/js/pages/social-page-feed-runtime.js');
        const html = readSource('social.html');

        expect(feedRuntime).toContain('renderCommunityHero');
        expect(community).toContain('social-neo-community-hero-toolbar');

        expect(bare).toContain('Phone: densify People / Community');
        expect(bare).toMatch(/\.social-neo\[data-panel="community"\] #social-neo-command-region/);
        expect(bare).toMatch(/\.social-neo\[data-panel="community"\] \.social-neo-community-hero-head[\s\S]*flex-direction:\s*column/);
        expect(bare).toMatch(/\.social-neo\[data-panel="community"\] \.social-neo-community-hero-stats[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
        expect(bare).toMatch(/\.social-neo\[data-panel="community"\] \.social-neo-community-hero-grid[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
        expect(bare).toMatch(/\.social-neo\[data-panel="community"\] \.social-neo-community-hero-tab-copy small[\s\S]*display:\s*none/);
        expect(bare).toMatch(/\.social-neo\[data-panel="community"\] \.social-neo-directory-filters[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
        expect(bare).toMatch(/\.social-neo\[data-panel="community"\] \.social-neo-community-hero-actions > \.lux-secondary-btn\[data-community-tab="requests"\][\s\S]*display:\s*none/);

        expect(html).toMatch(/lux-page-bare-lite\.css\?v=/);
    });

    it('densifies phone workspace hero with 2x3 stats and scrollable hub filters', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const chrome = readSource('assets/js/pages/social-workspace-project-chrome.js');
        const html = readSource('social.html');

        expect(chrome).toContain('social-neo-workspace-hero-stats');

        expect(bare).toContain('Phone: densify Projects / Workspace');
        expect(bare).toMatch(/\.social-neo\[data-panel="workspace"\] #social-neo-command-region/);
        expect(bare).toMatch(/\.social-neo\[data-panel="workspace"\] \.social-neo-workspace-hero-stats[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
        expect(bare).toMatch(/\.social-neo\[data-panel="workspace"\] \.social-project-hub-scope[\s\S]*flex-wrap:\s*nowrap/);
        expect(bare).toMatch(/\.social-neo\[data-panel="workspace"\] \.social-project-hub-scope[\s\S]*overflow-x:\s*auto/);
        expect(bare).toMatch(/\.social-neo\[data-panel="workspace"\] \.social-project-hub-filterbar[\s\S]*flex-direction:\s*column/);
        expect(bare).toMatch(/\.social-neo\[data-panel="workspace"\] \.social-project-hub-contribution[\s\S]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);

        expect(html).toMatch(/lux-page-bare-lite\.css\?v=/);
    });

    it('densifies phone project detail hero with stacked header, 2x2 metrics, and 3x2 tabs', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const panel = readSource('assets/js/pages/social-workspace-panel.js');
        const html = readSource('social.html');

        expect(panel).toContain('social-project-detail-hero');

        expect(bare).toMatch(/\.social-neo\[data-panel="workspace"\] \.social-project-detail-top[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
        expect(bare).toMatch(/\.social-neo\[data-panel="workspace"\] \.social-project-detail-actions \.social-neo-inline[\s\S]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
        expect(bare).toMatch(/\.social-neo\[data-panel="workspace"\] \.social-project-dashboard-strip[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
        expect(bare).toMatch(/\.social-neo\[data-panel="workspace"\] \.social-project-hero-grid\.social-project-tab-row-rich[\s\S]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
        expect(bare).toMatch(/\.social-neo\[data-panel="workspace"\] \.social-project-hero-grid\.social-project-tab-row-rich \.social-project-hero-tab-copy small[\s\S]*display:\s*none/);

        expect(html).toMatch(/lux-page-bare-lite\.css\?v=/);
    });

    it('densifies phone portfolio hero with compact tabs and stacked discover filters', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const portfolioUi = readSource('assets/js/pages/social-workspace-portfolio-ui.js');
        const html = readSource('social.html');

        expect(portfolioUi).toContain('social-neo-portfolio-hero-stats');

        expect(bare).toContain('Phone: densify Portfolio');
        expect(bare).toMatch(/\.social-neo\[data-panel="projects"\] #social-neo-command-region/);
        expect(bare).toMatch(/\.social-neo\[data-panel="projects"\] \.social-neo-portfolio-hero-actions[\s\S]*flex-wrap:\s*wrap/);
        expect(bare).toMatch(/\.social-neo\[data-panel="projects"\] \.social-neo-portfolio-hero-stats[\s\S]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
        expect(bare).toMatch(/\.social-neo\[data-panel="projects"\][\s\S]*\.social-neo-portfolio-hero-tabs[\s\S]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
        expect(bare).toMatch(/\.social-neo\[data-panel="projects"\] \.portfolio-panel-tab-copy small[\s\S]*display:\s*none/);
        expect(bare).toMatch(/\.social-neo\[data-panel="projects"\] \.social-portfolio-search-row[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
        expect(bare).toMatch(/\.social-neo\[data-panel="projects"\] \.social-portfolio-tag-row[\s\S]*overflow-x:\s*auto/);

        expect(html).toMatch(/lux-page-bare-lite\.css\?v=/);
    });

    it('densifies phone events hero with 2x2 stats/tabs and stacked lane filters', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const events = readSource('assets/js/pages/social-events.js');
        const html = readSource('social.html');

        expect(events).toContain('social-neo-events-hero-stats');

        expect(bare).toContain('Phone: densify Events');
        expect(bare).toMatch(/\.social-neo\[data-panel="events"\] #social-neo-command-region/);
        expect(bare).toMatch(/\.social-neo\[data-panel="events"\] \.social-neo-events-hero-stats[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
        expect(bare).toMatch(/\.social-neo\[data-panel="events"\] \.social-neo-events-hero-grid[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
        expect(bare).toMatch(/\.social-neo\[data-panel="events"\] \.social-neo-events-hero-tab-copy small[\s\S]*display:\s*none/);
        expect(bare).toMatch(/\.social-neo\[data-panel="events"\] \.social-neo-section-head--events-student[\s\S]*flex-direction:\s*column/);

        expect(html).toMatch(/lux-page-bare-lite\.css\?v=/);
    });

    it('densifies phone alerts panel with 3x2 category filters', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const alerts = readSource('assets/js/pages/social-alerts.js');
        const html = readSource('social.html');

        expect(alerts).toContain('sn-alerts-panel');

        expect(bare).toContain('Phone: densify Alerts');
        expect(bare).toMatch(/\.social-neo\[data-panel="alerts"\] #social-neo-command-region/);
        expect(bare).toMatch(/\.social-neo\[data-panel="alerts"\] \.sn-alerts-category-filters[\s\S]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
        expect(bare).toMatch(/\.social-neo\[data-panel="alerts"\] \.sn-alerts-header__filters[\s\S]*overflow:\s*hidden/);
        expect(bare).toMatch(/\.social-neo\[data-panel="alerts"\] \.sn-alerts-category-filters[\s\S]*overflow:\s*hidden/);
        expect(bare).toMatch(/\.social-neo\[data-panel="alerts"\] \.sn-alerts-category-filters[\s\S]*border-radius:\s*14px/);
        expect(bare).toMatch(/\.social-neo\[data-panel="alerts"\] \.sn-alerts-header__toolbar[\s\S]*flex-direction:\s*column/);
        expect(bare).toMatch(/\.social-neo\[data-panel="alerts"\] \.sn-alert-card[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);

        expect(html).toMatch(/lux-page-bare-lite\.css\?v=/);
    });
});
