import vm from 'vm';
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

const BOOT_INIT_DEPS = [
    'accountSubtitle', 'activeDialog', 'activeNavPanels', 'avatar', 'buildProjectCreateContext',
    'buildProjectHealthPlanPickModel', 'clearProjectTabPaneCache', 'clearSurveyFlowState',
    'createSocialLazyStub', 'currentUser', 'currentUserId', 'displayName',
    'ensureSocialAlertsModule', 'ensureSocialCommunityModule', 'ensureSocialFeedModule',
    'ensureSocialGroupsModule', 'ensureSocialLostFoundModule', 'ensureSocialMessagesModule',
    'ensureSocialPagesModule', 'ensureSocialPhotographyModule', 'ensureSocialProfileModule',
    'ensureSocialSurveysModule', 'ensureSocialWorkspaceModule', 'escape', 'feedScopeOptions',
    'hasSocialAlertsModule', 'hasSocialCommunityModule', 'hasSocialFeedModule', 'hasSocialGroupsModule',
    'hasSocialLostFoundModule', 'hasSocialMessagesModule', 'hasSocialPagesModule',
    'hasSocialPhotographyModule', 'hasSocialProfileModule', 'hasSocialSurveysModule', 'hasSocialWorkspaceModule',
    'listAttachableEntities', 'normalizeComposerEntityLinks', 'normalizeProjectTaskStatusId',
    'openDialog', 'photographyPosts', 'portfolioEntriesForViewer', 'postEntityLinks',
    'queueDeferredModuleRender', 'renderFileChip', 'renderPostComposeAttachResultsHtml',
    'renderPostComposeShareSection', 'renderProjectHealthPlanCardHtml',
    'renderProjectHealthPlanPickBodyHtml', 'renderSocialPageNow', 'resolveEntityLinkMeta',
    'root', 'setPanel', 'state', 'text', 'findSocialGroupById',
    'setWorkspaceNavCollapsed', 'closeSocialWorkspaceNavAnimated', 'navigateToEntity',
];

const BOOT_SHELL_NAV_DEPS = [
    'invalidateSocialRenderCache', 'pruneExpiredLostFoundItems', 'refreshPhotographyPanelStage',
    'shouldRestoreStackedDialog', 'restorePreviousDialog', 'closeDialog',
    'hasSocialEventsModule', 'ensureSocialEventsModule',
];

const BOOT_PAGE_EVENT_DEPS = [
    'socialInteractionContains', 'syncCommentDraftFromTarget', 'rippleSurveySubmitButton',
    'rippleSurveyChoiceLabel',
];

const ALL_BOOT_FACTORY_DEPS = [...BOOT_INIT_DEPS, ...BOOT_SHELL_NAV_DEPS, ...BOOT_PAGE_EVENT_DEPS];

function extractW18DepKeys(mainSource) {
    const marker = 'const __w18Deps = {';
    const start = mainSource.indexOf(marker);
    expect(start).toBeGreaterThan(-1);
    const bodyStart = start + marker.length;
    const bodyEnd = mainSource.indexOf('};', bodyStart);
    const body = mainSource.slice(bodyStart, bodyEnd);
    return body.split(',')
        .map((part) => part.trim().match(/^(\w+)/)?.[1])
        .filter(Boolean);
}

function stubBootDeps(base = {}) {
    const deps = { ...base };
    for (const name of ALL_BOOT_FACTORY_DEPS) {
        if (deps[name] != null) continue;
        if (name.startsWith('has')) deps[name] = () => false;
        else if (name.startsWith('ensure')) deps[name] = () => Promise.resolve();
        else deps[name] = () => '';
    }
    deps.renderSocialPageNow = () => {};
    deps.queueDeferredModuleRender = () => {};
    deps.setPanel = () => {};
    deps.findSocialGroupById = () => null;
    deps.navigateToEntity = () => {};
    deps.setWorkspaceNavCollapsed = () => {};
    deps.closeSocialWorkspaceNavAnimated = () => Promise.resolve();
    deps.openDialog = () => {};
    deps.closeDialog = () => {};
    deps.currentUser = () => null;
    deps.currentUserId = () => '';
    deps.escape = (v) => v;
    deps.listAttachableEntities = () => [];
    deps.state = () => ({ ui: {}, social: {} });
    deps.root = () => null;
    deps.text = (v) => String(v ?? '').trim();
    deps.activeDialog = () => null;
    deps.createSocialLazyStub = () => () => '';
    return deps;
}

describe('social-page-boot-runtime peel deps', () => {
    it('passes activeDialog and critical boot deps into __w18Deps before factory call', () => {
        const main = readSource('assets/js/pages/social-page.js');
        const wired = extractW18DepKeys(main);
        expect(wired).toContain('activeDialog');
        for (const name of ALL_BOOT_FACTORY_DEPS) {
            expect(wired, `__w18Deps missing ${name}`).toContain(name);
        }
        const depsIdx = main.indexOf('const __w18Deps = {');
        const factoryIdx = main.indexOf('__kiuCreateSocialPageBootApi(__w18Deps)');
        expect(factoryIdx).toBeGreaterThan(depsIdx);
    });

    it('boot factory init succeeds when activeDialog is wired (regression: Missing / ReferenceError)', () => {
        const bootSource = readSource('assets/js/pages/social-page-boot-runtime.js');
        const sandbox = {
            window: {
                __kiuSocialPageFeedDeps: {},
                createKiuSocialShellNavApi: () => ({
                    routeSocialDomain: () => ({ matched: false }),
                    handleShellNavClick: () => ({ handled: false }),
                    buildClickDomainRoutes: () => [],
                }),
                createKiuSocialPageEventsApi: () => ({
                    handleClick: async () => {},
                    handleSubmit: async () => {},
                    handleInput: () => {},
                    handleChange: () => {},
                    handlePointerDown: () => {},
                    handleGlobalKeydown: () => {},
                    bindPhotographyUploadPortalEvents: () => {},
                }),
            },
            console,
            document: {
                getElementById: () => null,
                addEventListener: () => {},
                querySelector: () => null,
            },
        };
        vm.runInNewContext(bootSource, sandbox);
        const deps = stubBootDeps({
            bound: false,
            boundHost: null,
            hostEventAbort: null,
            globalKeydownBound: false,
            scrollLockMediaBound: false,
            socialVisualViewportBound: false,
            renderAttemptCount: 0,
            MAX_RENDER_ATTEMPTS: 24,
            SOCIAL_OVERLAY_PORTAL_ID: 'social-overlay-portal',
            SOCIAL_OVERLAY_SURFACE_SELECTOR: '.lux-glass-dialog-surface',
        });

        expect(() => sandbox.window.__kiuCreateSocialPageBootApi(deps)).not.toThrow();
        expect(typeof sandbox.window.__kiuCreateSocialPageBootApi(deps).boot).toBe('function');
    });

    it('routes call overlay clicks through document capture handler', () => {
        const boot = readSource('assets/js/pages/social-page-boot-runtime.js');
        expect(boot).toContain('social-neo-call-overlay');
        expect(boot).toContain('fromCallOverlay');
        expect(boot).toContain('__kiuSocialPageHandleClick');
    });
});
