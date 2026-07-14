import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social messages panel UI regressions', () => {
    it('removes messages topbar chrome and consolidates controls in the inbox', () => {
        const page = readSource('assets/js/pages/social-page.js');
        const messages = readSource('assets/js/pages/social-messages.js');
        const css = readSource('assets/css/social-rebuild.css');
        const html = readSource('social.html');

        expect(page).toMatch(/function renderSocialTopbarRegion\([\s\S]*if \(isSocialTopbarSkippedPanel\(activePanel\)\) return '';/);
        expect(page).toMatch(/function renderSectionCommandCenter\([\s\S]*if \(isSocialTopbarSkippedPanel\(activePanel\)\) return '';/);
        expect(page).toContain("activePanel === 'messages'");
        expect(page).toContain('renderPlan.topbar = false');
        expect(page).toContain('renderPlan.command = false');
        expect(page).toContain("setSocialRegionMarkup(shell.topbar, '')");
        expect(page).toContain("activePanel === 'messages'\n                    ? []");
        expect(page).toContain("'messages-filter'");
        expect(page).toMatch(/action === 'panel-messages'[\s\S]*renderSocialPageNow\('messages-filter'\)/);

        expect(messages).toContain('social-neo-messages__inbox-header');
        expect(messages).toContain('social-neo-messages__inbox-toolbar');
        expect(messages).toContain('social-neo-messages__inbox-subtitle');
        expect(messages).toContain('social-neo-messages__inbox-filters');
        expect(messages).toContain('social-neo-messages__inbox-empty');
        expect(messages).toContain('social-neo-messages__inbox-alerts-btn');
        expect(messages).toContain('fa-bell');
        expect(messages).not.toContain('social-neo-messages__inbox-alerts-link');
        expect(messages).not.toMatch(/social-neo-tabs social-neo-messages__inbox-filters/);
        expect(messages).toMatch(/data-messages-filter="all"[\s\S]*data-messages-filter="unread"/);
        expect(messages).toContain('data-action="panel-alerts"');
        expect(messages).not.toContain('social-neo-shell-topbar-main');
        expect(messages).not.toContain('social-neo-messages__status-strip');
        expect(messages).not.toContain('social-neo-messages__inbox-meta');
        expect(messages).not.toContain('social-neo-topbar-pill');
        expect(messages).not.toContain('social-neo-thread-group-hero');
        expect(messages).toContain('social-neo-thread-head__main');
        expect(messages).toContain('social-neo-group-thread-toolbar is-compact');
        expect(messages).not.toContain('social-neo-group-thread-toolbar-summary');
        expect(messages).toContain('social-neo-messages__unread-badge');

        expect(page).toMatch(/__kiuSocialMessagesHooks[\s\S]*unreadNotifications/);

        expect(css).toContain('body.lux-route-social .social-neo[data-panel="messages"] #social-neo-topbar-region');
        expect(css).toMatch(/\[data-panel="messages"\][\s\S]*#social-neo-topbar-region[\s\S]*display:\s*none/);
        expect(css).toContain('.social-neo-messages__inbox-header');
        expect(css).toMatch(/\[data-panel="messages"\][\s\S]*\.social-neo-messages__inbox[\s\S]*grid-template-rows:\s*auto minmax\(0,\s*1fr\)/);
        expect(css).toContain('--social-msg-bubble-in');
        expect(css).toContain('.social-neo-messages__inbox-empty');
        expect(css).toContain('.social-neo-messages__inbox-alerts-btn');
        expect(css).toMatch(/\.social-neo-tabs:not\(\.social-neo-messages__inbox-filters\)/);
        expect(css).toMatch(/\[data-panel="messages"\][\s\S]*\.social-neo-messages[\s\S]*grid-template-columns:\s*minmax\(300px,\s*320px\)/);

        expect(page).toContain("const SOCIAL_MESSAGES_MODULE_URL = 'assets/js/pages/social-messages.js?v=20260714-messages-click1'");
        expect(html).toContain('assets/css/social-rebuild.css?v=20260713-accentborder2');
        expect(html).toContain('assets/js/pages/social-page.js?v=20260713-groups-detail9');
    });

    it('uses fade-soft surfaces on messages inbox and thread shell (events/portfolio parity)', () => {
        const css = readSource('assets/css/social-rebuild.css');
        const utilities = readSource('assets/js/shared/utilities.js');
        const html = readSource('social.html');

        const messagesInboxBlock = css.match(
            /body\.lux-route-social \.social-neo\[data-panel="messages"\] \.social-neo-messages__inbox\s*\{[\s\S]*?\n\}/
        )?.[0] || '';
        expect(messagesInboxBlock).toContain('var(--social-fade-surface-soft)');
        expect(messagesInboxBlock).not.toContain('backdrop-filter');

        const messagesThreadShellBlock = css.match(
            /body\.lux-route-social \.social-neo\[data-panel="messages"\] \.social-neo-messages__thread-shell[\s\S]*?\{[\s\S]*?\n\}/
        )?.[0] || '';
        expect(messagesThreadShellBlock).toContain('var(--social-fade-surface-soft)');
        expect(messagesThreadShellBlock).not.toContain('backdrop-filter');

        const paintSelectorsBlock = utilities.match(
            /const SOCIAL_NEO_TRANSPARENCY_SURFACE_SELECTORS = \[[\s\S]*?\];/
        )?.[0] || '';
        expect(paintSelectorsBlock).toContain("'.social-neo-messages-hero'");
        expect(utilities).toContain("'social-neo-messages__thread-stream'");

        // Thread interiors are CSS-managed fade surfaces (no dedicated isMessagesThreadInteriorSurface helper).
        expect(utilities).toContain("'social-neo-thread-head'");
        expect(utilities).toContain("'social-neo-thread-messages'");
        expect(utilities).toContain("'social-neo-thread-compose'");
        expect(utilities).toContain("'social-neo-messages__thread-stream'");

        expect(html).toContain('assets/css/social-rebuild.css?v=20260713-accentborder2');
        expect(html).toContain('assets/js/shared/utilities.js?v=20260713-accentborder3');
    });
});