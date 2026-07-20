import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
    socialPanelModelApi,
    installSocialPanelModel
} from '../assets/js/pages/social-panel-model.js';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function defaultHooks(extra = {}) {
    return {
        text: (v) => String(v == null ? '' : v).trim(),
        state: () => ({
            feed: [
                { id: 'p1' },
                { id: 'p2' },
                { id: 'ph1', category: 'Photography', media: [{ url: 'a.jpg' }] }
            ],
            social: {
                groups: [{ id: 'g1', membershipState: 'member', memberCount: 3 }],
                projects: [{ id: 'pr1', role: 'owner', status: 'active' }],
                pages: [{ id: 'pg1', isFollowing: true }],
                events: [{ id: 'e1' }],
                reports: []
            },
            directory: [{ id: 'u2' }],
            ui: { activeProfileUserId: 'u1' }
        }),
        relationshipBuckets: () => ({
            connections: [{ fromId: 'u1', toId: 'u2' }],
            incoming: [],
            outgoing: []
        }),
        isJoinedGroup: (g) => g?.membershipState === 'member',
        roleLabel: (r) => String(r || ''),
        currentUser: () => ({ id: 'u1', role: 'student' }),
        currentUserId: () => 'u1',
        isManagedPage: () => false,
        isImage: () => true,
        pendingSurveyCount: () => 2,
        surveys: () => [{ id: 's1' }, { id: 's2' }],
        lostFoundActiveCount: () => 4,
        lostFoundRecoveredCount: () => 1,
        activeChats: () => [{ id: 'c1' }],
        unreadMessages: () => 3,
        currentCall: () => null,
        unreadNotifications: () => 5,
        notificationItems: () => [{ type: 'mention', title: 'hi' }],
        classifyNotification: () => 'mention',
        profilePostCount: () => 7,
        profileFriendCount: () => 2,
        profileFollowingCount: () => 3,
        profileAccount: () => ({ role: 'student' }),
        ...extra
    };
}

function reinstall(extra = {}) {
    delete window.__KIU_SOCIAL_PANEL_MODEL_LOADED;
    delete window.KiuSocialPanelModel;
    window.__kiuSocialPanelHooks = defaultHooks(extra);
    installSocialPanelModel(window);
}

const {
    activeNavPanels,
    getSocialPanelConfig,
    filterFeedForHome,
    postingScopeOptions,
    feedScopeOptions,
    eventScopeOptions
} = socialPanelModelApi;

describe('social-panel-model', () => {
    beforeEach(() => {
        reinstall();
    });

    it('exports nav + panel config helpers', () => {
        expect(window.__KIU_SOCIAL_PANEL_MODEL_LOADED).toBe(true);
        expect(typeof activeNavPanels).toBe('function');
        expect(window.KiuSocialPanelModel.getSocialPanelConfig).toBe(window.getSocialPanelConfig);
    });

    it('builds active nav panels with counts', () => {
        const panels = activeNavPanels();
        const byId = Object.fromEntries(panels.map((p) => [p.id, p]));
        expect(byId.feed.count).toBe(3);
        expect(byId.groups.count).toBe(1);
        expect(byId.surveys.count).toBe(2);
        expect(byId.photography.count).toBe(1);
        expect(byId.messages.count).toBe(3);
        expect(byId.alerts.count).toBe(5);
    });

    it('builds panel config pills', () => {
        const runtime = window.__kiuSocialPanelHooks.state();
        const config = getSocialPanelConfig('feed', runtime);
        expect(config.feed.title).toBe('Campus Home');
        expect(config.feed.pills.find((p) => p.label === 'Posts').value).toBe(3);
        expect(config.messages.pills.find((p) => p.label === 'Active call').value).toBe('Idle');
        expect(config.profile.pills.find((p) => p.label === 'Posts').value).toBe(7);
        expect(config.alerts.pills.find((p) => p.label === 'Mentions').value).toBe(1);
    });

    it('filters home feed by lane', () => {
        reinstall({
            currentUserId: () => 'u1',
            isManagedPage: () => false,
            pageOrGroupPublic: () => false,
            isJoinedGroup: (g) => g?.membershipState === 'member',
            relationshipBuckets: () => ({
                connections: [{ fromId: 'u1', toId: 'u2' }],
                incoming: [],
                outgoing: []
            }),
            state: () => ({
                social: {
                    pages: [{ id: 'pg1', isFollowing: true }],
                    groups: [{ id: 'g1', membershipState: 'member' }]
                }
            })
        });
        const feed = [
            { id: '1', authorUserId: 'u2', category: 'News' },
            { id: '2', scopeType: 'group', scopeId: 'g1', category: 'News' },
            { id: '3', category: 'Photography' },
            { id: '4', audience: 'campus', category: 'News' }
        ];
        expect(filterFeedForHome(feed, 'following').map((p) => p.id)).toEqual(['1', '2']);
        expect(filterFeedForHome(feed, 'groups').map((p) => p.id)).toEqual(['2']);
        expect(filterFeedForHome(feed, 'campus').map((p) => p.id)).toEqual(['1', '2', '4']);
        expect(filterFeedForHome(feed, 'all').some((p) => p.id === '3')).toBe(false);
    });

    it('ESM leaf + bridge wired before social-page', () => {
        const page = readSource('assets/js/pages/social-page.js');
        const html = readSource('social.html');
        const mod = readSource('assets/js/pages/social-panel-model.js');
        const bridge = readSource('assets/js/pages/social-panel-model-bridge.js');
        expect(mod).toContain('export function installSocialPanelModel');
        expect(mod).not.toMatch(/^\(function\s+initSocialPanelModel/m);
        expect(bridge).toContain('KiuSocialPanelModel');
        expect(page).not.toMatch(/function\s+activeNavPanels\s*\(/);
        expect(page).not.toMatch(/function\s+getSocialPanelConfig\s*\(/);
        expect(page).not.toMatch(/function\s+filterFeedForHome\s*\(/);
        expect(page).not.toMatch(/function\s+photographyPosts\s*\(/);
        expect(page).not.toMatch(/function\s+postingScopeOptions\s*\(/);
        expect(page).not.toMatch(/function\s+feedScopeOptions\s*\(/);
        expect(page).toMatch(/const activeNavPanels = window\.activeNavPanels/);
        expect(page).toMatch(/KiuSocialPanelModel/);
        expect(page).toMatch(/const filterFeedForHome = window\.filterFeedForHome/);
        expect(page).toMatch(/const photographyPosts = window\.photographyPosts/);
        expect(page).toMatch(/const postingScopeOptions = window\.postingScopeOptions/);
        expect(html).toMatch(/<script\s+type="module"\s+src="assets\/js\/pages\/social-panel-model\.js/);
        expect(html).toContain('social-panel-model-bridge.js');
        expect(html.indexOf('social-panel-model.js')).toBeLessThan(html.indexOf('social-panel-model-bridge.js'));
        expect(html.indexOf('social-panel-model-bridge.js')).toBeLessThan(html.indexOf('social-page.js'));
    });

    it('builds posting and feed scope options', () => {
        reinstall({
            currentUserId: () => 'u1',
            isManagedPage: (p) => p?.isManager,
            isJoinedGroup: (g) => g?.membershipState === 'member',
            pageOrGroupPublic: () => true,
            state: () => ({
                feed: [],
                social: {
                    pages: [{ id: 'pg1', name: 'Lab', isManager: true }],
                    groups: [{ id: 'g1', name: 'Club', membershipState: 'member' }]
                }
            })
        });
        const post = postingScopeOptions();
        expect(post.some((o) => o.type === 'profile' && o.id === 'u1')).toBe(true);
        expect(post.some((o) => o.type === 'page' && o.id === 'pg1')).toBe(true);
        expect(post.some((o) => o.type === 'group' && o.id === 'g1')).toBe(true);
        expect(eventScopeOptions()).toEqual(post);
        const feed = feedScopeOptions();
        expect(feed[0]).toMatchObject({ type: '', id: '' });
        expect(feed.some((o) => o.type === 'page' && o.id === 'pg1')).toBe(true);
    });
});
