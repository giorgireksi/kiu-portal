import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS switch performance', () => {
    it('preloads tab modules in parallel while preserving ordered execution', () => {
        const runtime = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');

        expect(runtime).toContain('function preloadLmsRuntimeScripts(urls = [], relation = \'preload\')');
        expect(runtime).toContain('preloadLmsRuntimeScripts(urls);');
        expect(runtime).toContain('.reduce((chain, url) => chain.then(() => loadLmsScriptOnce(url)), Promise.resolve())');
        expect(runtime).toContain('prefetchLmsRuntimeForTab');
    });

    it('warms LMS tabs on intent and reuses short-lived safe render snapshots', () => {
        const boot = readSource('assets/js/pages/lms-route-boot.js');
        const shell = readSource('assets/js/pages/lms-classroom-tabs-shell-runtime.js');

        expect(boot).toContain("document.addEventListener('pointerover', warmLmsTabRuntime");
        expect(boot).toContain('prefetchLmsRuntimeForTab');
        expect(boot).toContain('scheduleLmsTabRuntimePrefetch();');
        expect(shell).toContain('const LMS_TAB_RENDER_CACHE_TTL_MS = 15000;');
        expect(shell).toContain('function getLmsTabRenderCache(cacheKey) {');
        expect(shell).toContain("tab !== 'live-quiz' && tab !== 'interaction' && tab !== 'whiteboard' && tab !== 'quiz' && tab !== 'monitoring'");
    });
});
