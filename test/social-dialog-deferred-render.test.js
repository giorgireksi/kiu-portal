import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import vm from 'vm';

function noop() {}

function loadShellRuntime(queueDeps = {}) {
    const renders = [];
    const host = { __kiuForceCenterOnly: false };
    const sandbox = {
        window: {},
        document: {
            body: { classList: { add: noop, remove: noop }, dataset: {} },
            documentElement: { dataset: {} }
        },
        localStorage: { getItem: () => '', setItem: noop },
        String,
        Boolean,
        Number,
        Array,
        Promise,
        console
    };
    sandbox.window.window = sandbox.window;
    vm.runInNewContext(
        readFileSync(join(process.cwd(), 'assets/js/pages/social-page-shell-runtime.js'), 'utf8'),
        sandbox
    );
    const stub = () => noop;
    const deps = {
        text: (v) => String(v == null ? '' : v).trim(),
        state: () => ({ ui: {} }),
        root: () => host,
        escape: (v) => v,
        activeNavPanels: () => [],
        activeDialog: queueDeps.activeDialog || (() => null),
        getSocialCenterScroller: stub,
        socialScrollLockActive: () => false,
        isSocialRouteDesktopScroll: () => false,
        scrollSocialCenterTo: stub,
        getSocialCenterContentScrollHeight: () => 0,
        getSocialCenterMaxScroll: () => 0,
        getSocialCenterViewportHeight: () => 0,
        socialCenterHasLiveScrollRoom: () => false,
        clearSocialCenterScrollBounds: stub,
        restoreInteractionState: stub,
        ensureSocialOverlayPortal: stub,
        socialOverlayLockArtifactsPresent: () => false,
        clearSocialOverlayLockArtifacts: stub,
        shellIdentitySignature: () => '',
        currentUser: () => null,
        currentFacultyCode: () => '',
        syncSocialVisualShell: stub,
        renderSocialPageNow: (reason) => { renders.push(reason); },
        invalidateSocialRenderCache: stub,
        createSocialLazyStub: () => () => '',
        hasSocialGroupsModule: () => false,
        ensureSocialGroupsModule: () => Promise.resolve()
    };
    const api = sandbox.window.__kiuCreateSocialPageShellApi(deps);
    return { api, host, renders };
}

function loadShellNav(overrides = {}) {
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
    const handlerCalls = [];
    sandbox.window.handleSocialGroupsClick = (event) => {
        handlerCalls.push(event);
        return 'group-handler';
    };
    const deferredRenders = [];
    const api = sandbox.window.createKiuSocialShellNavApi({
        text: (v) => String(v == null ? '' : v).trim(),
        state: () => ({ ui: { activePanel: 'groups' } }),
        setPanel: noop,
        invalidateSocialRenderCache: noop,
        renderSocialPageNow: noop,
        withBusy: (fn) => fn(),
        pruneExpiredLostFoundItems: async () => {},
        refreshPhotographyPanelStage: () => false,
        currentUserId: () => 'u1',
        activeDialog: () => null,
        shouldRestoreStackedDialog: () => false,
        restorePreviousDialog: noop,
        closeDialog: noop,
        closeSocialWorkspaceNavAnimated: noop,
        setWorkspaceNavCollapsed: noop,
        root: () => null,
        findSocialGroupById: () => null,
        openDialog: noop,
        navigateToEntity: noop,
        queueDeferredModuleRender: (reason) => { deferredRenders.push(reason); },
        hasSocialWorkspaceModule: () => false,
        ensureSocialWorkspaceModule: () => Promise.resolve(),
        hasSocialGroupsModule: overrides.hasSocialGroupsModule || (() => false),
        ensureSocialGroupsModule: overrides.ensureSocialGroupsModule || (() => Promise.resolve()),
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
    return { api, sandbox, handlerCalls, deferredRenders };
}

describe('social dialog deferred render', () => {
    it('queueDeferredModuleRender skips forceCenterOnly while a dialog is active', async () => {
        const { api, host, renders } = loadShellRuntime({
            activeDialog: () => ({ type: 'group-create' })
        });
        api.queueDeferredModuleRender('groups-module');
        await Promise.resolve();
        expect(host.__kiuForceCenterOnly).toBe(false);
        expect(renders).toEqual(['groups-module']);
    });

    it('queueDeferredModuleRender sets forceCenterOnly when no dialog is active', async () => {
        const { api, host, renders } = loadShellRuntime();
        api.queueDeferredModuleRender('groups-module');
        await Promise.resolve();
        expect(host.__kiuForceCenterOnly).toBe(true);
        expect(renders).toEqual(['groups-module']);
    });

    it('keeps dialog render plan when forceCenterOnly is set but a dialog is active', () => {
        const interactions = readFileSync(
            join(process.cwd(), 'assets/js/pages/social-page-interactions-runtime.js'),
            'utf8'
        );
        expect(interactions).toContain('if (!activeDialog()) {');
        expect(interactions).toContain('renderPlan.dialog = false;');
    });

    describe('routeSocialDomain group-create-open', () => {
        let api;
        let handlerCalls;
        let deferredRenders;

        beforeEach(() => {
            ({ api, handlerCalls, deferredRenders } = loadShellNav({
                ensureSocialGroupsModule: () => Promise.resolve().then(() => {
                    // Module load completes after click; handler becomes available.
                })
            }));
        });

        it('invokes handleSocialGroupsClick after ensure instead of only queueing render', async () => {
            const routes = api.buildClickDomainRoutes();
            const routed = api.routeSocialDomain('group-create-open', routes, {
                invoke: (handler) => handler({ preventDefault: noop })
            });
            expect(routed.matched).toBe(true);
            await routed.result;
            expect(handlerCalls).toHaveLength(1);
            expect(deferredRenders).toHaveLength(0);
        });

        it('does not short-circuit to onMissing before handler runs', () => {
            const shellNav = readFileSync(
                join(process.cwd(), 'assets/js/pages/social-shell-nav.js'),
                'utf8'
            );
            expect(shellNav).not.toMatch(/if \(typeof route\.onMissing === 'function'\) \{\s*route\.ensure\(\)\.then\(route\.onMissing\)/);
            expect(shellNav).toContain('resolveSocialRouteFn');
            const routes = api.buildClickDomainRoutes();
            const groupsRoute = routes.find((route) => route.handle === 'handleSocialGroupsClick');
            expect(groupsRoute.onMissing).toBeUndefined();
        });

        it('resolves workspace handlers from KiuSocialWorkspace when window export is absent', async () => {
            const sandbox = {
                window: {
                    KiuSocialWorkspace: {
                        handleSocialWorkspaceClick: (action) => `workspace:${action}`
                    },
                    isSocialWorkspaceClickAction: (action) => String(action || '').startsWith('portfolio-')
                },
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
            const wsApi = sandbox.window.createKiuSocialShellNavApi({
                text: (v) => String(v == null ? '' : v).trim(),
                state: () => ({ ui: {} }),
                setPanel: noop,
                invalidateSocialRenderCache: noop,
                renderSocialPageNow: noop,
                hasSocialWorkspaceModule: () => true,
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
                ensureSocialCommunityModule: () => Promise.resolve(),
                queueDeferredModuleRender: noop
            });
            const routes = wsApi.buildClickDomainRoutes();
            const routed = wsApi.routeSocialDomain('portfolio-create-open', routes, {
                invoke: (handler) => handler('portfolio-create-open', { getAttribute: () => '' })
            });
            expect(routed.matched).toBe(true);
            expect(routed.result).toBe('workspace:portfolio-create-open');
        });
    });
});
