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
        expect(shell).toContain("label: 'Feed'");
        expect(shell).toContain("label: 'Exposé'");
        expect(shell).toContain("label: 'Saved'");
        expect(shell).toContain('social-shortcuts-top-nav');

        expect(interactions).toContain('renderSocialShortcutsTopNav');
        expect(interactions).toContain('useShortcutsTopNav');
        expect(interactions).toContain('isPhoneSocialShortcutsViewport');
        expect(interactions).toContain('renderSocialShortcutsTopNavFallback');
        expect(interactions).toContain('bindSocialShortcutsViewportWatcher');
        expect(interactions).toContain('syncSocialShortcutsTopNavPortal');
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
        expect(shortcutsCss).toMatch(/\.social-shortcuts-top-nav::after/);
        expect(shortcutsCss).toMatch(/linear-gradient\(to right/);
        expect(shortcutsCss).not.toContain('max-width: 1180px');
        expect(shortcutsCss).not.toContain('position: sticky');

        expect(html).toMatch(/lux-page-bare-lite\.css\?v=20260807-socialtopnav10/);
        expect(html).toMatch(/social-page-interactions-runtime\.js\?v=20260807-socialtopnav10/);
        expect(sw).toContain("CACHE_NAME = 'kiu-portal-shell-v20260807-socialtopnav10'");
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

        expect(page).toContain("social-feed.js?v=20260807-socialtopnav10");
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

        expect(page).toContain("social-messages.js?v=20260807-socialtopnav10");
    });
});
