import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
    socialAlertsModelApi,
    installSocialAlertsModel
} from '../assets/js/pages/social-alerts-model.js';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

const {
    ALERTS_CATEGORIES,
    ALERTS_CATEGORY_EMPTY_MESSAGES,
    classifyNotification,
    classifyNotificationCategory,
    getCategoryUnreadCounts,
    filterNotificationsByView,
    buildNotificationTargetUrl,
    renderAlertsCategoryFilterStrip
} = socialAlertsModelApi;

describe('social-alerts-model', () => {
    beforeEach(() => {
        delete window.__KIU_SOCIAL_ALERTS_MODEL_LOADED;
        delete window.KiuSocialAlertsModel;
        window.__kiuSocialAlertsModelHooks = {
            text: (v) => String(v == null ? '' : v).trim()
        };
        installSocialAlertsModel(window);
    });

    it('exports classification helpers', () => {
        expect(window.__KIU_SOCIAL_ALERTS_MODEL_LOADED).toBe(true);
        expect(Array.isArray(ALERTS_CATEGORIES)).toBe(true);
        expect(window.KiuSocialAlertsModel.classifyNotification).toBe(window.classifyNotification);
    });

    it('classifies notifications by type and text', () => {
        expect(classifyNotification({ type: 'mention' })).toBe('mention');
        expect(classifyNotification({ type: 'call' })).toBe('call');
        expect(classifyNotification({ routeData: { chatId: 'c1' } })).toBe('message');
        expect(classifyNotification({ title: 'hello' })).toBe('system');
        expect(classifyNotificationCategory({ source: 'social' })).toBe('social');
        expect(classifyNotificationCategory({ type: 'grades-published' })).toBe('academic');
        expect(classifyNotificationCategory({ source: 'student-service' })).toBe('support');
    });

    it('filters and counts unread by category', () => {
        const items = [
            { read: false, source: 'social' },
            { read: false, type: 'message', routeData: { chatId: 'c1' } },
            { read: true, source: 'news' },
            { read: false, type: 'mention', title: 'you were mentioned' }
        ];
        const counts = getCategoryUnreadCounts(items);
        expect(counts.all).toBe(3);
        expect(counts.social).toBe(1);
        expect(counts.messages).toBe(1);
        expect(filterNotificationsByView(items, 'mentions')).toHaveLength(1);
        expect(filterNotificationsByView(items, 'all')).toHaveLength(4);
        expect(filterNotificationsByView(items, 'unread').every((n) => !n.read)).toBe(true);
    });

    it('ESM leaf + bridge wired before social-page', () => {
        const page = readSource('assets/js/pages/social-page.js');
        const html = readSource('social.html');
        const mod = readSource('assets/js/pages/social-alerts-model.js');
        const bridge = readSource('assets/js/pages/social-alerts-model-bridge.js');
        expect(mod).toContain('export function installSocialAlertsModel');
        expect(mod).not.toMatch(/^\(function\s+initSocialAlertsModel/m);
        expect(bridge).toContain('KiuSocialAlertsModel');
        for (const name of [
            'classifyNotification',
            'classifyNotificationCategory',
            'getCategoryUnreadCounts',
            'filterNotificationsByView',
            'buildNotificationTargetUrl'
        ]) {
            expect(page).not.toMatch(new RegExp(`function\\s+${name}\\s*\\(`));
            expect(page).toMatch(new RegExp(`const ${name} = window\\.${name}`));
        }
        expect(page).not.toMatch(/const ALERTS_CATEGORIES = \[/);
        expect(html).toMatch(/<script\s+type="module"\s+src="assets\/js\/pages\/social-alerts-model\.js/);
        expect(html).toContain('social-alerts-model-bridge.js');
        expect(html.indexOf('social-alerts-model.js')).toBeLessThan(html.indexOf('social-alerts-model-bridge.js'));
        expect(html.indexOf('social-alerts-model-bridge.js')).toBeLessThan(html.indexOf('social-page.js'));
    });

    it('builds notification target urls', () => {
        expect(buildNotificationTargetUrl({ routeData: { chatId: 'c1' } }))
            .toBe('social.html?panel=messages&chatId=c1');
        expect(buildNotificationTargetUrl({ routePage: 'news', routeData: { postId: 'p1' } }))
            .toBe('social.html?panel=feed&postId=p1');
        expect(buildNotificationTargetUrl({ routePage: 'news', routeData: {} }))
            .toBe('news.html');
        expect(buildNotificationTargetUrl(null)).toBeNull();
    });

    it('exports category filter strip helper with icon tabs and badges', () => {
        expect(window.renderAlertsCategoryFilterStrip).toBe(renderAlertsCategoryFilterStrip);
        expect(ALERTS_CATEGORY_EMPTY_MESSAGES.all).toContain('No notifications');
        const strip = renderAlertsCategoryFilterStrip('all', { all: 3, social: 2 }, { wrapper: true });
        expect(strip).toContain('lux-tab-btn--icon');
        expect(strip).toContain('lux-tab-badge home-hover-chip');
        expect(strip).toContain('data-alerts-filter="social"');
        const buttons = renderAlertsCategoryFilterStrip('social', { social: 1 }, {
            filterAttr: 'data-utility-alerts-filter',
            wrapper: false
        });
        expect(buttons).toContain('data-utility-alerts-filter="social"');
        expect(buttons).toContain('is-active');
        expect(buttons).not.toContain('data-action=');
    });
});
