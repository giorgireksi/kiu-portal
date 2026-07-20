import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import vm from 'vm';

function loadShellNav() {
    const runtime = {
        ui: {
            activePanel: 'feed',
            homeFeedFilter: 'all',
            communityTab: 'people',
            pagesTab: 'discover',
            activePageProfileId: '',
            photographyTab: 'explore',
            messagesFilter: 'all',
            alertsFilter: 'all',
            surveysTab: 'available'
        }
    };
    const renders = [];
    const sandbox = {
        window: {},
        document: { body: {} },
        String,
        Boolean,
        Promise,
        console
    };
    sandbox.window.window = sandbox.window;
    vm.runInNewContext(
        readFileSync(join(process.cwd(), 'assets/js/pages/social-shell-nav.js'), 'utf8'),
        sandbox
    );
    const api = sandbox.window.createKiuSocialShellNavApi({
        text: (v) => String(v == null ? '' : v).trim(),
        state: () => runtime,
        setPanel: (panel) => { runtime.ui.activePanel = panel; },
        invalidateSocialRenderCache: () => {},
        renderSocialPageNow: (reason) => { renders.push(reason); return reason; },
        withBusy: (fn) => fn(),
        pruneExpiredLostFoundItems: async () => {},
        refreshPhotographyPanelStage: () => false,
        currentUserId: () => 'u1',
        activeDialog: () => null,
        shouldRestoreStackedDialog: () => false,
        restorePreviousDialog: () => {},
        closeDialog: () => {},
        closeSocialWorkspaceNavAnimated: () => 'nav-closed',
        setWorkspaceNavCollapsed: () => {},
        root: () => null,
        findSocialGroupById: () => null,
        openDialog: (type, payload) => ({ type, payload }),
        navigateToEntity: () => 'navigated',
        queueDeferredModuleRender: () => {},
        hasSocialWorkspaceModule: () => false,
        ensureSocialWorkspaceModule: () => Promise.resolve(),
        hasSocialGroupsModule: () => false,
        ensureSocialGroupsModule: () => Promise.resolve(),
        hasSocialPagesModule: () => false,
        ensureSocialPagesModule: () => Promise.resolve(),
        hasSocialSurveysModule: () => false,
        ensureSocialSurveysModule: () => Promise.resolve(),
        hasSocialPhotographyModule: () => false,
        ensureSocialPhotographyModule: () => Promise.resolve(),
        hasSocialEventsModule: () => false,
        ensureSocialEventsModule: () => Promise.resolve(),
        hasSocialFeedModule: () => false,
        ensureSocialFeedModule: () => Promise.resolve(),
        hasSocialLostFoundModule: () => false,
        ensureSocialLostFoundModule: () => Promise.resolve(),
        hasSocialProfileModule: () => false,
        ensureSocialProfileModule: () => Promise.resolve(),
        hasSocialMessagesModule: () => false,
        ensureSocialMessagesModule: () => Promise.resolve(),
        hasSocialAlertsModule: () => false,
        ensureSocialAlertsModule: () => Promise.resolve(),
        hasSocialCommunityModule: () => false,
        ensureSocialCommunityModule: () => Promise.resolve()
    });
    return { api, runtime, renders, sandbox };
}

describe('social-shell-nav', () => {
    let api;
    let runtime;
    let renders;
    let sandbox;

    beforeEach(() => {
        ({ api, runtime, renders, sandbox } = loadShellNav());
    });

    it('switches feed/community panels and peels from social-page', () => {
        expect(sandbox.window.__KIU_SOCIAL_SHELL_NAV_LOADED).toBe(true);
        const feed = api.handleShellNavClick('panel-feed', {
            getAttribute: (name) => (name === 'data-home-filter' ? 'following' : '')
        });
        expect(feed.handled).toBe(true);
        expect(runtime.ui.activePanel).toBe('feed');
        expect(runtime.ui.homeFeedFilter).toBe('following');
        // Already on feed with filter change → feed-tab reason
        expect(feed.result).toBe('feed-tab');
        expect(renders).toContain('feed-tab');

        runtime.ui.activePanel = 'community';
        renders.length = 0;
        const feedAgain = api.handleShellNavClick('panel-feed', {
            getAttribute: () => ''
        });
        expect(feedAgain.result).toBe('panel-feed');
        expect(renders).toContain('panel-feed');

        runtime.ui.activePanel = 'community';
        runtime.ui.communityTab = 'people';
        const community = api.handleShellNavClick('panel-community', {
            getAttribute: (name) => (name === 'data-community-tab' ? 'suggestions' : '')
        });
        expect(community.handled).toBe(true);
        expect(community.result).toBe('community-tab');

        const unknown = api.handleShellNavClick('post-react', { getAttribute: () => '' });
        expect(unknown.handled).toBe(false);

        const page = readFileSync(join(process.cwd(), 'assets/js/pages/social-page.js'), 'utf8');
        const html = readFileSync(join(process.cwd(), 'social.html'), 'utf8');
        expect(page).not.toMatch(/function\s+routeSocialDomain\s*\(/);
        expect(page).not.toMatch(/function\s+beginShellPanelTabSwitch\s*\(/);
        expect(page).toContain('createKiuSocialShellNavApi');
        expect(page).toContain('handleShellNavClick');
        expect(html).toContain('social-shell-nav.js');
        expect(html.indexOf('social-shell-nav.js')).toBeLessThan(html.indexOf('social-page.js'));
    });

    it('builds click domain routes for deferred modules', () => {
        const routes = api.buildClickDomainRoutes();
        expect(routes.some((r) => r.handle === 'handleSocialFeedClick')).toBe(true);
        expect(routes.some((r) => r.handle === 'handleSocialWorkspaceClick')).toBe(true);
        expect(api.routeSocialDomain('post-like', routes, {
            invoke: () => 'ok'
        }).matched).toBe(true);
    });
});
