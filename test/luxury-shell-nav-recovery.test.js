import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('luxury shell nav recovery', () => {
    it('exposes recoverIndexPortalShell for index portal shell recovery', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');

        expect(luxury).toContain('function recoverIndexPortalShell(options = {})');
        expect(luxury).toContain('window.recoverIndexPortalShell = recoverIndexPortalShell');
        expect(luxury).toMatch(/function recoverIndexPortalShell[\s\S]*rehydrateIndexPortalEntry/);
        expect(luxury).toMatch(/pageshow[\s\S]*rehydrateIndexPortalEntry/);
    });

    it('always clears the loading overlay and rehydrates index on pageshow when needed', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');

        expect(luxury).toMatch(/pageshow[\s\S]*markPortalShellReady/);
        expect(luxury).toContain('kiu-shell-loading');
        expect(luxury).toContain('needsRehydrate');
        expect(luxury).toMatch(/needsRehydrate[\s\S]*rehydrateIndexPortalEntry/);
    });

    it('clears stale nav signatures and retries render when lux-nav is empty', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');

        expect(luxury).toContain('function isLuxNavEmpty()');
        expect(luxury).toContain("navRoot.dataset.renderSignature = ''");
        expect(shellChrome).toMatch(
            /if \(!navRoot\.children\.length && navRoot\.dataset\.renderSignature\)/
        );
        expect(shellChrome).toContain('window.renderNav = renderNav');
        expect(shellChrome).toContain('renderNavRecoveryFallback');
        expect(shellChrome).toMatch(/initializeLuxuryShellChromeBindings[\s\S]*renderNav\(\)/);
    });

    it('uses effective user role for navigation rendering', () => {
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');

        expect(shellChrome).toMatch(
            /function renderNav\(\) \{[\s\S]*getEffectiveUserRole[\s\S]*getEffectiveRole/
        );
    });

    it('offsets fixed shell chrome for view-as banner layout', () => {
        const controls = readSource('assets/css/lux-controls.css');

        expect(controls).toContain('--lux-view-as-banner-height');
        expect(controls).toContain('body.lux-view-as-active #lux-shell');
        expect(controls).toContain('body.lux-view-as-active #lux-topbar');
        expect(controls).toContain('top: var(--lux-view-as-banner-height)');
    });

    it('keeps the VIEW picker in sync and avoids the Portal View placeholder', () => {
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');
        const luxury = readSource('assets/js/features/index-luxury.js');

        expect(shellChrome).toContain('const DEFAULT_ROLE_LABELS');
        expect(shellChrome).toContain('function resolveRolePickerLabel(role)');
        expect(shellChrome).toContain('function seedRolePickerLabel()');
        expect(shellChrome).toContain('window.populateRoleSwitcher = populateRoleSwitcher');
        expect(shellChrome).toMatch(/function syncTopbar\(\) \{[\s\S]*populateRoleSwitcher\(\)/);
        expect(shellChrome).not.toContain("|| 'Portal View'");
        expect(luxury).not.toContain('>Portal View<');
        expect(luxury).toContain('id="lux-role-picker-value">Workspace</strong>');
    });

    it('tears down realtime streams when leaving a page', () => {
        const auth = readSource('assets/js/app/auth.js');
        const utilities = readSource('assets/js/shared/utilities.js');

        expect(auth).toContain('function bindKiuRealtimePageExitTeardown()');
        expect(auth).toContain("window.addEventListener('pagehide', teardownOnExit)");
        expect(auth).toMatch(
            /connectKiuRealtimeEventStream[\s\S]*teardownKiuRealtimeEventStream\(\)/
        );
        expect(utilities).toMatch(
            /fastRedirectRoleSwitch[\s\S]*teardownKiuRealtimeEventStream/
        );
    });
});