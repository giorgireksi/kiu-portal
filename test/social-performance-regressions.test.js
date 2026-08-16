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
        expect(html).toContain('social-page.js?v=20260816-socialperf1');
        expect(page).toContain('social-community.js?v=20260816-socialperf1');
    });

    it('coalesces duplicate deferred module remounts before rendering', () => {
        const html = readSource('social.html');
        const shell = readSource('assets/js/pages/social-page-shell-runtime.js');
        expect(html).toContain('social-page-shell-runtime.js?v=20260815-socialassemblyclean1&perf=20260816-dedupe1');
        expect(shell).toContain('const deferredModuleRenderQueue = new Set();');
        expect(shell).toContain('if (deferredModuleRenderQueue.has(renderReason)) return;');
        expect(shell).toContain('queueMicrotask(flush)');
    });

    it('filters route-guardian mutations before scheduling reconciliation', () => {
        const page = readSource('assets/js/pages/social-page.js');
        expect(page).toContain('const mutationTouchesSocialHost = (mutations) => mutations.some');
        expect(page).toContain('guardianRenderInProgress || !mutationTouchesSocialHost(mutations)');
        expect(page).toContain("if (!document.getElementById(ROOT_ID)) reconcile();");
        expect(page).toContain('}, 1000);');
    });

    it('uses the optimized shared assembly runtime on Social', () => {
        const html = readSource('social.html');
        const runtime = readSource('assets/js/shared/lux-assembly-loading-runtime.js');
        expect(html).toContain('lux-assembly-loading-runtime.js?v=20260815-socialassemblyclean1&perf=20260816-singleowner2');
        expect(runtime).not.toContain('function getCurrentNode(element, root)');
        expect(runtime).toContain('return node.children?.length ? runSiblings(node.children, root, generation)');
        expect(runtime).toContain("soft-restart-skipped-same-content");
        expect(runtime).toContain('state.contentRoot === contentRoot');
        expect(runtime).toContain("if (state.phase === 'pending' && state.root === currentRoot) return;");
        expect(runtime).toContain('const motionRegistry = global.__kiuAssemblyMotionRegistry');
        expect(runtime).toContain('function abortOtherMotions()');
        expect(runtime).toContain('motionRegistry.add(api);');
        expect(runtime).toContain('__kiuAbortAssemblyLoadingMotions');
        expect(readSource('assets/js/pages/social-page-interactions-runtime.js'))
            .toContain('if (panelChanged && typeof window.__kiuAbortAssemblyLoadingMotions === \'function\')');
        for (const panel of ['home', 'community', 'groups', 'projects', 'portfolio', 'research', 'pages', 'events', 'surveys', 'photography', 'lost-found', 'messages', 'alerts']) {
            expect(readSource(`assets/js/pages/social-${panel}-loading-runtime.js`))
                .toContain("window.__kiuSocialAssemblyMotionOwner === 'render-pipeline'");
        }
    });

    it('uses an indexed directory fallback for relationship cards', () => {
        const community = readSource('assets/js/pages/social-community.js');
        expect(community).toContain('const directoryById = new Map();');
        expect(community).toContain('directoryById.get(userId)');
        expect(community).not.toContain('directory.find((entry) => text(entry.id) === userId)');
    });
});
