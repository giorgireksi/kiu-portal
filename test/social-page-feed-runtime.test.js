import vm from 'vm';
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function extractFeedRuntimeDepNames(feedSource) {
    return [...feedSource.matchAll(/const \w+ = __dep\('([^']+)'\)/g)].map((match) => match[1]);
}

function extractSocialFeedDepKeys(mainSource) {
    const marker = 'const __socialFeedDeps = window.__kiuSocialPageFeedDeps = {';
    const start = mainSource.indexOf(marker);
    expect(start).toBeGreaterThan(-1);
    const bodyStart = start + marker.length;
    const bodyEnd = mainSource.indexOf('};', bodyStart);
    const body = mainSource.slice(bodyStart, bodyEnd);
    return body.split(',')
        .map((part) => part.trim().match(/^(\w+)/)?.[1])
        .filter(Boolean);
}

/** Must be present when __kiuCreateSocialPageFeedApi runs — factory calls createSocialLazyStub at init. */
const CRITICAL_FEED_DEPS = [
    'createSocialLazyStub',
    'hasSocialFeedModule',
    'ensureSocialFeedModule',
    'hasSocialEventsModule',
    'ensureSocialEventsModule',
    'hasSocialGroupsModule',
    'ensureSocialGroupsModule',
    'hasSocialPagesModule',
    'ensureSocialPagesModule',
    'hasSocialWorkspaceModule',
    'ensureSocialWorkspaceModule',
    'queueDeferredModuleRender',
];

describe('social-page-feed-runtime peel', () => {
    it('owns entity/compose helpers outside social-page.js via factory', () => {
        const main = readSource('assets/js/pages/social-page.js');
        const feed = readSource('assets/js/pages/social-page-feed-runtime.js');
        expect(main).toContain('__kiuCreateSocialPageFeedApi');
        expect(main).not.toMatch(/^\s*function navigateToEntity\b/m);
        expect(main).not.toMatch(/^\s*function patchPostComposeDialog\b/m);
        expect(main).not.toMatch(/^\s*function renderEntityDetailDialog\b/m);
        expect(feed).toContain('function navigateToEntity');
        expect(feed).toContain('function patchPostComposeDialog');
        expect(feed).toContain('__kiuCreateSocialPageFeedApi');
        expect(feed).toContain('__KIU_SOCIAL_PAGE_FEED_LOADED');
    });

    it('loads before social-page.js on social.html', () => {
        const html = readSource('social.html');
        expect(html).toContain('social-page-feed-runtime.js');
        expect(html.indexOf('social-page-feed-runtime.js'))
            .toBeLessThan(html.indexOf('assets/js/pages/social-page.js'));
    });

    it('passes createSocialLazyStub and critical feed deps into __socialFeedDeps before factory call', () => {
        const main = readSource('assets/js/pages/social-page.js');
        const feed = readSource('assets/js/pages/social-page-feed-runtime.js');
        const wired = extractSocialFeedDepKeys(main);
        const required = extractFeedRuntimeDepNames(feed);

        expect(wired).toContain('createSocialLazyStub');
        for (const name of CRITICAL_FEED_DEPS) {
            expect(wired, `__socialFeedDeps missing ${name}`).toContain(name);
        }

        const depsIdx = main.indexOf('const __socialFeedDeps = window.__kiuSocialPageFeedDeps = {');
        const factoryIdx = main.indexOf('__kiuCreateSocialPageFeedApi(__socialFeedDeps)');
        expect(depsIdx).toBeGreaterThan(-1);
        expect(factoryIdx).toBeGreaterThan(depsIdx);

        const missingCritical = required
            .filter((name) => CRITICAL_FEED_DEPS.includes(name))
            .filter((name) => !wired.includes(name));
        expect(missingCritical, `Missing critical feed deps: ${missingCritical.join(', ')}`).toEqual([]);
    });

    it('exports renderRelationshipActions for community hooks and module checks', () => {
        const feed = readSource('assets/js/pages/social-page-feed-runtime.js');
        const main = readSource('assets/js/pages/social-page.js');
        expect(feed).toMatch(/renderRelationshipActions/);
        expect(main).toMatch(/renderRelationshipActions/);
        expect(main).toMatch(/renderPost,/);
        expect(main).toMatch(/renderCommentThread,/);
    });

    it('exports lazy stub identities for groups/events/pages module checks', () => {
        const feed = readSource('assets/js/pages/social-page-feed-runtime.js');
        const main = readSource('assets/js/pages/social-page.js');
        for (const name of [
            'renderGroupsHero',
            'renderGroupCreateDialog',
            'renderEventsHero',
            'renderEventCreateDialog',
            'renderPagesHero',
            'renderPageCreateDialog',
            'renderWorkspaceHero',
            'renderPortfolioHero',
            'renderProjectTaskFormFields',
        ]) {
            expect(feed, `feed api missing ${name}`).toMatch(new RegExp(`\\b${name}\\b`));
            expect(main, `social-page.js missing ${name} destructure`).toMatch(new RegExp(`\\b${name}\\b`));
        }
    });

    it('dispatches workspace panels from KiuSocialWorkspace instead of window stubs', () => {
        const feed = readSource('assets/js/pages/social-page-feed-runtime.js');
        expect(feed).toMatch(/resolveWorkspacePanelExport/);
        expect(feed).toMatch(/resolveWorkspacePanelExport\('renderProjectsWorkspacePanelClassic'\)/);
        expect(feed).toMatch(/resolveWorkspacePanelExport\('renderProjectsPanel'\)/);
        expect(feed).toMatch(/impl !== renderProjectsWorkspacePanelClassic/);
        expect(feed).not.toMatch(/window\.renderProjectsWorkspacePanelClassic\(\)/);
    });

    it('ensureSocialWorkspaceModule waits for existing script tags', () => {
        const main = readSource('assets/js/pages/social-page.js');
        const start = main.indexOf('function ensureSocialWorkspaceModule()');
        const end = main.indexOf('function hasSocialWorkspaceModule()', start);
        const block = main.slice(start, end);
        expect(main).toMatch(/function loadSocialDynamicScript\(url, label/);
        expect(main).toMatch(/function waitForDynamicScript\(existing/);
        expect(block).toMatch(/loadSocialDynamicScript/);
        expect(block).not.toMatch(/if \(document\.querySelector\(`script\[src="\$\{url\}"\]`\) \{ resolve\(\); return; \}/);
    });

    it('exports projectRiskScaleRank for workspace hooks', () => {
        const feed = readSource('assets/js/pages/social-page-feed-runtime.js');
        const main = readSource('assets/js/pages/social-page.js');
        expect(feed).toMatch(/projectRiskScaleRank/);
        expect(main).toMatch(/projectRiskScaleRank/);
        expect(main).toMatch(/const buildSocialRenderSignature = window\.buildSocialRenderSignature/);
        expect(main).toMatch(/__kiuSocialWorkspaceHooks[\s\S]*projectRiskScaleRank/);
    });

    it('portfolio entity links open portfolio viewer dialog', () => {
        const feed = readSource('assets/js/pages/social-page-feed-runtime.js');
        expect(feed).toContain("if (type === 'portfolio')");
        expect(feed).toContain('openPortfolioViewerForUser(userId)');
        expect(feed).not.toContain('state().ui.activeProjectId = docId');
        expect(feed).not.toContain('activePortfolioUserId');
    });

    it('feed factory init succeeds when createSocialLazyStub is wired (regression: Missing social feed dep)', () => {
        const feedSource = readSource('assets/js/pages/social-page-feed-runtime.js');
        const depNames = extractFeedRuntimeDepNames(feedSource);
        const sandbox = { window: {}, console };
        vm.runInNewContext(feedSource, sandbox);

        const deps = { PANEL_KEY: 'KIU_SOCIAL_ACTIVE_PANEL', WORKSPACE_NAV_COLLAPSED_KEY: 'test' };
        for (const name of depNames) {
            if (name.startsWith('has')) deps[name] = () => false;
            else if (name.startsWith('ensure')) deps[name] = () => Promise.resolve();
            else if (name === 'createSocialLazyStub') {
                deps[name] = (_n, _has, _ensure, fallback) => () => fallback;
            } else deps[name] = () => '';
        }

        expect(() => sandbox.window.__kiuCreateSocialPageFeedApi(deps)).not.toThrow(/Missing social feed dep/);
        expect(typeof sandbox.window.__kiuCreateSocialPageFeedApi(deps).renderFeedPanel).toBe('function');
    });
});
