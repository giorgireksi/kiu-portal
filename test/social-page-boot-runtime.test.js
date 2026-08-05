import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import vm from 'vm';
import { readSocialPageSource } from './helpers/social-page-source.js';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

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
    const main = readSource('assets/js/pages/social-page.js');
    const deps = { ...base };
    for (const name of extractW18DepKeys(main)) {
        if (deps[name] != null) continue;
        if (name === 'eventBinding') deps[name] = { bound: false, boundHost: null, hostEventAbort: null };
        else if (name === 'WORKSPACE_DIALOG_KEEP_CENTER') deps[name] = new Set();
        else if (name.startsWith('has')) deps[name] = () => false;
        else if (name.startsWith('ensure')) deps[name] = () => Promise.resolve();
        else if (name.endsWith('_ID') || name.endsWith('_SELECTOR')) deps[name] = name === 'SOCIAL_OVERLAY_PORTAL_ID' ? 'social-overlay-portal' : '.lux-glass-dialog-surface';
        else if (name === 'MAX_RENDER_ATTEMPTS') deps[name] = 24;
        else if (name === 'renderAttemptCount' || name === 'globalKeydownBound' || name === 'scrollLockMediaBound' || name === 'socialVisualViewportBound') deps[name] = false;
        else deps[name] = () => '';
    }
    deps.refreshPortalSocialFeed = () => {};
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
    deps.createSocialWorkspaceStub = () => () => '';
    deps.invalidateSocialRenderCache = () => {};
    deps.revealShell = () => {};
    deps.socialInteractionContains = () => false;
    deps.syncCommentDraftFromTarget = () => {};
    deps.rippleSurveySubmitButton = () => {};
    deps.rippleSurveyChoiceLabel = () => {};
    deps.bound = false;
    deps.boundHost = null;
    deps.hostEventAbort = null;
    deps.globalKeydownBound = false;
    deps.scrollLockMediaBound = false;
    deps.socialVisualViewportBound = false;
    deps.renderAttemptCount = 0;
    deps.MAX_RENDER_ATTEMPTS = 24;
    deps.SOCIAL_OVERLAY_PORTAL_ID = 'social-overlay-portal';
    deps.SOCIAL_OVERLAY_SURFACE_SELECTOR = '.lux-glass-dialog-surface';
    return deps;
}

describe('social-page-boot-runtime peel deps', () => {
    it('passes activeDialog and critical boot deps into __w18Deps before factory call', () => {
        const main = readSource('assets/js/pages/social-page.js');
        const wired = extractW18DepKeys(main);
        expect(wired).toContain('activeDialog');
        expect(wired).toContain('revealShell');
        expect(wired).toContain('invalidateSocialRenderCache');
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
                body: { classList: { contains: () => false } },
            },
            AbortController: class {
                constructor() { this.signal = {}; }
                abort() {}
            },
            requestAnimationFrame: () => {},
        };
        vm.runInNewContext(bootSource, sandbox);
        const deps = stubBootDeps();

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
