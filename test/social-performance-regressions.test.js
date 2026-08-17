import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social performance safeguards', () => {
    it('reuses the shared modal stylesheet instead of injecting a duplicate version', () => {
        const html = readSource('social.html');
        const page = readSource('assets/js/pages/social-page.js');
        expect(html).toContain('data-kiu-social-dialog-styles="assets/css/lux-modals.css?v=20260816-socialmodals1"');
        expect(page).toContain("const SOCIAL_DIALOG_STYLES_URL = 'assets/css/lux-modals.css?v=20260816-socialmodals1';");
        expect(page).toContain("link.getAttribute('href') === SOCIAL_DIALOG_STYLES_URL");
        expect(page).not.toContain('lux-modals.css?v=20260808-loadperf1');
    });

    it('cache-busts the optimized route runtimes', () => {
        const html = readSource('social.html');
        const page = readSource('assets/js/pages/social-page.js');
        expect(html).toContain('social-page.js?v=20260818-shellfailopen1');
        expect(html).toContain('lux-fouc-ht.css?v=20260816-hovergpu1');
        expect(html).toContain('luxury-shell-motion-runtime.js?v=20260818-navmotionfix1');
        expect(page).toContain('social-community.js?v=20260816-socialperf1');
        expect(page).toContain('SOCIAL_DYNAMIC_SCRIPT_TIMEOUT_MS');
        expect(page).toContain('loadSocialDynamicScript');
        expect(page).toContain("renderSocialPageNow('photography-module')");
        expect(page).toContain('mountActivePhotography');
        expect(page).toContain('attempt < 120');
        expect(page).toContain('waitingForMount');
    });

    it('coalesces duplicate deferred module remounts before rendering', () => {
        const html = readSource('social.html');
        const shell = readSource('assets/js/pages/social-page-shell-runtime.js');
        expect(html).toContain('social-page-shell-runtime.js?v=20260815-socialassemblyclean1&perf=20260816-dedupe5');
        expect(shell).toContain('const deferredModuleRenderQueue = new Set();');
        expect(shell).toContain('if (deferredModuleRenderQueue.has(renderReason)) return;');
        expect(shell).toContain('queueMicrotask(flush)');
        expect(shell).toContain('__kiuDeferredModuleRenderKey');
        expect(shell).toContain('delete liveHost.__kiuDeferredModuleRenderKey');
        expect(shell).toContain("renderReason === 'photography-module'");
    });

    it('parallelizes workspace peels and does not serialize chat paint on bootstrap', () => {
        const page = readSource('assets/js/pages/social-page.js');
        const workspace = readSource('assets/js/pages/social-workspace-panel.js');
        const socialRuntime = readSource('assets/js/shared/social-lite-content-runtime.js');
        expect(page).toContain('let socialWorkspaceModulePromise = null;');
        expect(page).toContain('const loadWorkspaceBatch = (urls) => Promise.all(');
        expect(page).toContain('if (socialWorkspaceModulePromise) return socialWorkspaceModulePromise;');
        expect(workspace).toContain('queueProjectChatBootstrap');
        expect(workspace).toContain('ensureProjectWorkspaceChat(activeProject, { skipStateRefresh: true })');
        expect(socialRuntime).toContain('if (options?.skipStateRefresh)');
        expect(socialRuntime).toContain('loadSocialState(true, { skipRender: true })');
    });

    it('filters route-guardian mutations before scheduling reconciliation', () => {
        const page = readSource('assets/js/pages/social-page.js');
        expect(page).toContain('const mutationTouchesSocialHost = (mutations) => mutations.some');
        expect(page).toContain('guardianRenderInProgress || !mutationTouchesSocialHost(mutations)');
        expect(page).toContain("if (!document.getElementById(ROOT_ID)) reconcile();");
        expect(page).toContain('}, 2200);');
    });

    it('uses the optimized shared assembly runtime on Social', () => {
        const html = readSource('social.html');
        const runtime = readSource('assets/js/shared/lux-assembly-loading-runtime.js');
        expect(html).toContain('lux-assembly-loading-runtime.js?v=20260818-contentpaint1');
        expect(runtime).not.toContain('function getCurrentNode(element, root)');
        expect(runtime).toContain('return node.children?.length ? runSiblings(node.children, root, generation)');
        expect(runtime).toContain("soft-restart-skipped-same-content");
        expect(runtime).toContain('state.contentRoot === contentRoot');
        expect(runtime).toContain("if (state.phase === 'pending' && state.root === currentRoot) return;");
        expect(runtime).toContain('const motionRegistry = global.__kiuAssemblyMotionRegistry');
        expect(runtime).toContain('function abortOtherMotions()');
        expect(runtime).toContain('motionRegistry.add(api);');
        expect(runtime).toContain('__kiuAbortAssemblyLoadingMotions');
        expect(runtime).toContain('__kiuShouldBindSocialLoadingFallback');
        expect(readSource('assets/js/pages/social-community-loading-runtime.js'))
            .toContain("window.__kiuShouldBindSocialLoadingFallback('community')");
        expect(readSource('assets/js/pages/social-home-loading-runtime.js'))
            .toContain("window.__kiuShouldBindSocialLoadingFallback('feed')");
        const interactions = readSource('assets/js/pages/social-page-interactions-runtime.js');
        expect(interactions).toContain('SOCIAL_PANEL_MOTION_GLOBAL_BY_PANEL');
        expect(interactions).toContain("projects: '__kiuSocialPortfolioLoadingMotion'");
        expect(interactions).toContain("workspace: '__kiuSocialProjectsLoadingMotion'");
        expect(interactions).toContain('if (r === `${target}-module`)');
        expect(interactions).toContain("if (fastPath || /-module$/.test(reason)) {");
        expect(interactions).toContain('renderCallback();');
        expect(interactions).toContain('Read receipts and realtime upserts must not restart the visible');
        expect(interactions)
            .toContain('if (panelChanged && typeof window.__kiuAbortAssemblyLoadingMotions === \'function\')');
        for (const panel of ['home', 'community', 'groups', 'projects', 'portfolio', 'research', 'pages', 'events', 'surveys', 'photography', 'lost-found', 'messages', 'alerts']) {
            expect(readSource(`assets/js/pages/social-${panel}-loading-runtime.js`))
                .toContain("window.__kiuSocialAssemblyMotionOwner === 'render-pipeline'");
        }
        expect(readSource('assets/js/pages/social-home-loading-runtime.js')).toContain('autoStart: false');
        expect(readSource('assets/js/pages/social-messages-loading-runtime.js')).toContain('phase === \'ready\' && typeof motion.abort === \'function\'');
        expect(interactions).toContain('queueSocialPortfolioMotion(shell.center, activePanel, reason);');
        expect(interactions).toContain('queueSocialProjectsMotion(shell.center, activePanel, reason);');
        expect(interactions).toContain('socialPortfolioMotionFrame = 0;');
        expect(readSource('assets/js/pages/social-portfolio-loading-runtime.js')).toContain("activePanel !== 'projects'");
    });

    it('fails open when hydration or a dynamic module stalls', () => {
        const boot = readSource('assets/js/pages/social-page-boot-runtime.js');
        const page = readSource('assets/js/pages/social-page.js');
        const interactions = readSource('assets/js/pages/social-page-interactions-runtime.js');
        const worker = readSource('service-worker.js');
        expect(boot).toContain('Social state hydration timed out.');
        expect(boot).toContain('Social ${activePanel} startup timed out.');
        expect(page).toContain('discardSocialDynamicScript');
        expect(page).toContain('Social module load timed out.');
        expect(interactions).toContain("console.error('[Social] Render degraded:', error);");
        expect(interactions).toContain('social-module-retry');
        expect(page).toContain('__kiuRetrySocialModule');
        expect(page).toContain("return ['workspace', 'projects'];");
        expect(readSource('assets/js/pages/social-fingerprint-model.js')).toContain('module-failure');
        expect(worker).toContain("CACHE_NAME = 'kiu-portal-shell-v20260818-shellstage2'");
        expect(worker).toContain('await isUsableStaticAssetResponse(networkResponse, request)');
    });

    it('uses an indexed directory fallback for relationship cards', () => {
        const community = readSource('assets/js/pages/social-community.js');
        expect(community).toContain('const directoryById = new Map();');
        expect(community).toContain('directoryById.get(userId)');
        expect(community).not.toContain('directory.find((entry) => text(entry.id) === userId)');
    });
});
