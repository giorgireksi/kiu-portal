import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('home dashboard load recovery', () => {
    it('preloads the home dashboard bundle on the index portal shell', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');
        const homeRuntime = readSource('assets/js/features/luxury-index-runtime.js');

        expect(luxury).toContain('scheduleLuxuryHomeDashboardPreload');
        expect(luxury).toContain('scheduleLuxuryHomeDashboardPreload();');
        expect(homeRuntime).toContain('function scheduleLuxuryHomeDashboardPreload()');
        expect(homeRuntime).toContain('ensureLuxuryHomeDashboardBundle({ preload: true })');
        expect(homeRuntime).toContain('window.requestAnimationFrame(run)');
        expect(homeRuntime).not.toContain('requestIdleCallback(run, { timeout: 1200 })');
    });

    it('allows bundle loading while the home section is active even before route classes settle', () => {
        const homeRuntime = readSource('assets/js/features/luxury-index-runtime.js');

        expect(homeRuntime).toContain('function ensureLuxuryHomeDashboardBundle(options = {})');
        expect(homeRuntime).toContain('const preload = options.preload === true');
        expect(homeRuntime).toContain('const allowWhileNotHome = options.allowWhileNotHome === true');
        expect(homeRuntime).toContain('allowWhileNotHome: true');
    });

    it('recovers index shell chrome when the dashboard chunk registers or bfcache restores', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');
        const homeRuntime = readSource('assets/js/features/luxury-index-runtime.js');

        expect(homeRuntime).toMatch(
            /window\.__kiuRegisterLuxuryHomeChunk = function registerLuxuryHomeChunk[\s\S]*?if \(isLuxuryHomeRoute\(\)\) renderHomeShell\(\)/
        );
        expect(luxury).toContain("window.addEventListener('pageshow', (event) =>");
        expect(luxury).toMatch(/pageshow[\s\S]*rehydrateIndexPortalEntry/);
        expect(luxury).toContain('needsRehydrate');
    });

    it('surfaces retry UI instead of leaving the loading placeholder forever', () => {
        const homeRuntime = readSource('assets/js/features/luxury-index-runtime.js');

        expect(homeRuntime).toContain('function renderHomeShellRecoveryPanel(');
        expect(homeRuntime).toContain('data-home-dashboard-retry="1"');
        expect(homeRuntime).toContain('HOME_DASHBOARD_LOAD_TIMEOUT_MS');
        expect(homeRuntime).toContain('renderHomeShellRecoveryPanel(homeShell');
    });

    it('coalesces navigate sync to the latest page id', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');

        expect(luxury).toContain('let __luxPendingNavigateSyncPageId = null');
        expect(luxury).toMatch(
            /function queueNavigateSync[\s\S]*?__luxPendingNavigateSyncPageId = pageId[\s\S]*?syncAfterNavigate\(targetPageId\)/
        );
        expect(luxury).not.toMatch(
            /function queueNavigateSync[\s\S]*?if \(queuedNavigateSyncFrame\) return;[\s\S]*?syncAfterNavigate\(args\?\.\[0\]\)/
        );
    });

    it('exports renderHomeShell for navigation and recovery hooks', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');

        expect(luxury).toContain('__kiuLuxExpose({');
        expect(luxury).toContain('renderHomeShell,');
        expect(luxury).toContain('ensureLuxuryHomeDashboardBundle,');
    });

    it('rehydrates the full index portal shell on return entry', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');
        const navigation = readSource('assets/js/features/navigation.js');
        const homeRuntime = readSource('assets/js/features/luxury-index-runtime.js');

        expect(luxury).toContain('function rehydrateIndexPortalEntry(options = {})');
        expect(luxury).toContain('rehydrateIndexPortalEntry,');
        expect(luxury).toMatch(/rehydrateIndexPortalEntry[\s\S]*syncAll\(\)/);
        expect(homeRuntime).toContain('function scheduleLuxuryHomeDashboardChunkRetry()');
        expect(navigation).toContain('function invokeIndexPortalRehydrate(options = {})');
        expect(navigation).toMatch(/force-home-startup[\s\S]*invokeIndexPortalRehydrate/);
        expect(navigation).toContain("reason: 'deferred-startup'");
        expect(navigation).toContain('function normalizeIndexPortalHomeHash()');
    });

    it('bootstraps index chrome before the home dashboard bundle', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');
        const navigation = readSource('assets/js/features/navigation.js');

        expect(luxury).toContain('function bootstrapIndexPortalChromeSync()');
        expect(luxury).toContain('bootstrapIndexPortalChromeSync,');
        expect(luxury).toContain('window.__kiuIndexChromeBootstrapped = true');
        expect(luxury).toMatch(/bindTopbarControls\(\);[\s\S]*bootstrapIndexPortalChromeSync\(\)/);
        expect(luxury).toContain('function renderHomeChromeSkeleton(');
        expect(luxury).toMatch(/ensureLuxuryHomeDashboardBundle[\s\S]*renderHomeShell\(\)/);
        expect(luxury).not.toContain('ensureLuxuryHomeDashboardBundle({ preload: false, allowWhileNotHome: true }).finally(runInitialShellSync)');
        expect(luxury).toContain('const scheduleInitialShellSync = window.requestIdleCallback || ((cb) => window.setTimeout(cb, 0));');
        expect(navigation).toContain('window.__kiuIndexChromeBootstrapped === true');
        expect(navigation).toContain('chromeOnly: useChromeOnly');
    });
});
