import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social alerts panel UI regressions', () => {
    it('removes alerts topbar chrome and consolidates controls in the panel', () => {
        const page = readSource('assets/js/pages/social-page.js');
        const alerts = readSource('assets/js/pages/social-alerts.js');
        const css = readSource('assets/css/social-rebuild.css');
        const runtime = readSource('assets/js/shared/social-runtime-lite.js');
        const html = readSource('social.html');

        expect(page).toMatch(/function renderSocialTopbarRegion\([\s\S]*if \(isSocialTopbarSkippedPanel\(activePanel\)\) return '';/);
        expect(page).toMatch(/function renderSectionCommandCenter\([\s\S]*if \(isSocialTopbarSkippedPanel\(activePanel\)\) return '';/);
        expect(page).toContain("activePanel === 'alerts'");
        expect(page).toContain("'alerts-filter'");
        expect(page).toMatch(/action === 'panel-alerts'[\s\S]*renderSocialPageNow\('alerts-filter'\)/);
        expect(page).toMatch(/action === 'panel-alerts'[\s\S]*renderSocialPageNow\('panel-alerts'\)/);
        expect(page).toContain('function isSocialAlertsPanel(');
        expect(page).not.toContain('function renderRail(');
        expect(page).not.toContain('social-neo-rail-region');

        expect(alerts).toContain('sn-alerts-header');
        expect(alerts).toContain('sn-alerts-header__actions');
        expect(alerts).toContain('sn-alerts-header__filters');
        expect(alerts).toContain('sn-alerts-category-filters');
        expect(alerts).toContain('class="social-neo-tab');
        expect(alerts).toContain('data-category=');
        expect(alerts).toContain('social-neo-tab-badge');
        expect(alerts).not.toContain('sn-alerts-pill-bar');
        expect(alerts).not.toContain('sn-alerts-pill');
        expect(alerts).not.toContain('activeStyle');
        expect(alerts).not.toContain('sn-alerts-pill-count');
        expect(alerts).toContain('sn-alert-card__main');
        expect(alerts).toContain('sn-alert-card__aside');
        expect(alerts).toContain('sn-alert-card-badge');
        expect(alerts).toContain('<time datetime=');

        expect(css).toContain('body.lux-route-social .social-neo[data-panel="alerts"] #social-neo-topbar-region');
        expect(css).toMatch(/\[data-panel="alerts"\][\s\S]*#social-neo-command-region[\s\S]*display:\s*none/);
        expect(css).not.toContain('[data-panel="alerts"] #social-neo-rail-region');
        expect(css).toContain('.sn-alerts-category-filters');
        expect(css).toMatch(/\[data-panel="alerts"\][\s\S]*\.sn-alerts-category-filters[\s\S]*\.social-neo-tab\.is-active[\s\S]*rgba\(var\(--sn-accent-rgb\), 0\.18\)/);
        expect(css).toContain('.sn-alert-card__aside');
        expect(css).toContain('.sn-alert-card-actions:empty');

        expect(runtime).toMatch(/function nowLabel\([\s\S]*absDiff < minute/);

        expect(page).toContain("const SOCIAL_ALERTS_MODULE_URL = 'assets/js/pages/social-alerts.js?v=20260714-alerts-click1'");
        expect(html).toContain('assets/css/social-rebuild.css?v=20260713-accentborder2');
        expect(html).toContain('assets/js/pages/social-page.js?v=20260713-groups-detail9');
    });

    it('keeps alert card actions on the alerts panel without same-window navigation', () => {
        const page = readSource('assets/js/pages/social-page.js');
        const alerts = readSource('assets/js/pages/social-alerts.js');

        expect(alerts).toContain('data-action="notification-mark-read"');
        expect(alerts).toContain('data-action="notification-follow"');
        expect(alerts).not.toContain('data-action="notification-read"');
        expect(alerts).toContain('notification.key || notification.id');

        expect(page).toContain('function resolveNotificationFromTrigger');
        expect(page).toContain('function buildNotificationTargetUrl');
        expect(page).toContain('function markAlertNotificationAndRefresh');
        expect(page).toContain('function openNotificationTargetInNewTab');

        const markReadHandler = (page + alerts).match(
            /if \(action === 'notification-mark-read'\) \{[\s\S]*?\n        \}/
        )?.[0] || '';
        expect(markReadHandler).toContain('markAlertNotificationAndRefresh');
        expect(markReadHandler).not.toContain('setPanel(');
        expect(markReadHandler).not.toContain('navigate(');
        expect(markReadHandler).not.toContain('location.assign');

        const followHandler = (page + alerts).match(
            /if \(action === 'notification-follow'\) \{[\s\S]*?\n        \}/
        )?.[0] || '';
        expect(followHandler).toContain('openNotificationTargetInNewTab');
        expect(followHandler).not.toContain('setPanel(');
        expect(followHandler).not.toContain('navigate(');
        expect(followHandler).not.toContain('location.assign');

        const openChatHandler = (page + alerts).match(
            /if \(action === 'notification-open-chat'\) \{[\s\S]*?\n        \}/
        )?.[0] || '';
        expect(openChatHandler).toContain('openNotificationTargetInNewTab');
        expect(openChatHandler).not.toContain("setPanel('messages')");

        const openGroupHandler = (page + alerts).match(
            /if \(action === 'notification-open-group'\) \{[\s\S]*?\n        \}/
        )?.[0] || '';
        expect(openGroupHandler).toContain('openNotificationTargetInNewTab');
        expect(openGroupHandler).not.toContain('focusFeed(');
    });

    it('supports per-card dismiss and filtered clear-all without leaving alerts', () => {
        const page = readSource('assets/js/pages/social-page.js');
        const alerts = readSource('assets/js/pages/social-alerts.js');
        const notificationsService = readSource('backend/platform/domains/notifications-service.js');
        const routeModule = readSource('backend/platform/routes/portal-support-routes.js');
        const css = readSource('assets/css/social-rebuild.css');

        expect(alerts).toContain('data-action="notification-remove"');
        expect(alerts).toContain('data-action="notification-clear-visible"');
        expect(alerts).toContain('sn-alert-card-dismiss');
        expect(alerts).toContain('sn-alerts-clear-visible');
        expect(notificationsService).toContain('function deleteNotification');
        expect(routeModule).toContain("app.post('/api/notifications/delete'");

        expect(page).toContain('function removeAlertNotificationAndRefresh');
        expect(page).toContain('function removeAlertNotificationsAndRefresh');

        const removeHandler = (page + alerts).match(
            /if \(action === 'notification-remove'\) \{[\s\S]*?\n        \}/
        )?.[0] || '';
        expect(removeHandler).toContain('removeAlertNotificationAndRefresh');
        expect(removeHandler).not.toContain('setPanel(');
        expect(removeHandler).not.toContain('navigate(');

        const clearHandler = (page + alerts).match(
            /if \(action === 'notification-clear-visible'\) \{[\s\S]*?\n        \}/
        )?.[0] || '';
        expect(clearHandler).toContain('filterNotificationsByView');
        expect(clearHandler).toContain('removeAlertNotificationsAndRefresh');
        expect(clearHandler).not.toContain('setPanel(');

        expect(css).toContain('.sn-alert-card-dismiss');
        expect(css).toContain('.sn-alerts-clear-visible');
    });
});