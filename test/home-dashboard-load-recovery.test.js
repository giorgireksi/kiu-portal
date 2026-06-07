import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('home dashboard load recovery', () => {
    it('preloads the home dashboard bundle on the index portal shell', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');

        expect(luxury).toContain('function scheduleLuxuryHomeDashboardPreload()');
        expect(luxury).toContain('ensureLuxuryHomeDashboardBundle({ preload: true })');
        expect(luxury).toContain('if (typeof isIndexPortalShell === \'function\' && isIndexPortalShell())');
        expect(luxury).toContain('scheduleLuxuryHomeDashboardPreload();');
    });

    it('allows bundle loading while the home section is active even before route classes settle', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');

        expect(luxury).toContain('function ensureLuxuryHomeDashboardBundle(options = {})');
        expect(luxury).toContain('const preload = options.preload === true');
        expect(luxury).toContain('const allowWhileNotHome = options.allowWhileNotHome === true');
        expect(luxury).toContain('allowWhileNotHome: true');
    });

    it('recovers index shell chrome when the dashboard chunk registers or bfcache restores', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');

        expect(luxury).toMatch(
            /window\.__kiuRegisterLuxuryHomeChunk = function registerLuxuryHomeChunk[\s\S]*?if \(isLuxuryHomeRoute\(\)\) renderHomeShell\(\)/
        );
        expect(luxury).toContain("window.addEventListener('pageshow', (event) =>");
        expect(luxury).toMatch(/pageshow[\s\S]*rehydrateIndexPortalEntry/);
        expect(luxury).toContain('needsRehydrate');
    });

    it('surfaces retry UI instead of leaving the loading placeholder forever', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');

        expect(luxury).toContain('function renderHomeShellRecoveryPanel(');
        expect(luxury).toContain('data-home-dashboard-retry="1"');
        expect(luxury).toContain('HOME_DASHBOARD_LOAD_TIMEOUT_MS');
        expect(luxury).toContain('renderHomeShellRecoveryPanel(homeShell');
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

        expect(luxury).toContain('window.renderHomeShell = renderHomeShell');
        expect(luxury).toContain('window.ensureLuxuryHomeDashboardBundle = ensureLuxuryHomeDashboardBundle');
    });

    it('rehydrates the full index portal shell on return entry', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');
        const navigation = readSource('assets/js/features/navigation.js');

        expect(luxury).toContain('function rehydrateIndexPortalEntry(options = {})');
        expect(luxury).toContain('window.rehydrateIndexPortalEntry = rehydrateIndexPortalEntry');
        expect(luxury).toMatch(/rehydrateIndexPortalEntry[\s\S]*syncAll\(\)/);
        expect(luxury).toContain('function scheduleLuxuryHomeDashboardChunkRetry()');
        expect(navigation).toContain('function invokeIndexPortalRehydrate(options = {})');
        expect(navigation).toMatch(/force-home-startup[\s\S]*invokeIndexPortalRehydrate/);
        expect(navigation).toContain("reason: 'deferred-startup'");
        expect(navigation).toContain('function normalizeIndexPortalHomeHash()');
    });

    it('bootstraps index chrome before the home dashboard bundle', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');
        const navigation = readSource('assets/js/features/navigation.js');

        expect(luxury).toContain('function bootstrapIndexPortalChromeSync()');
        expect(luxury).toContain('window.bootstrapIndexPortalChromeSync = bootstrapIndexPortalChromeSync');
        expect(luxury).toContain('window.__kiuIndexChromeBootstrapped = true');
        expect(luxury).toMatch(/bindTopbarControls\(\);[\s\S]*bootstrapIndexPortalChromeSync\(\)/);
        expect(luxury).toContain('function renderHomeChromeSkeleton(');
        expect(luxury).toMatch(/isLuxuryHomeRoute\(\) \{[\s\S]*ensureLuxuryHomeDashboardBundle[\s\S]*renderHomeShell\(\)/);
        expect(luxury).not.toContain('ensureLuxuryHomeDashboardBundle({ preload: false, allowWhileNotHome: true }).finally(runInitialShellSync)');
        expect(luxury).toContain('const scheduleInitialShellSync = window.requestAnimationFrame');
        expect(navigation).toContain('window.__kiuIndexChromeBootstrapped === true');
        expect(navigation).toContain('chromeOnly: useChromeOnly');
    });
});