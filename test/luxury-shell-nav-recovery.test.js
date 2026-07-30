import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
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

    it('includes Personal Data in desktop role nav for professor, ta, and student service', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');

        expect(luxury).toMatch(/professor:[\s\S]*\['personal-data', 'Personal Data', 'far fa-user'\]/);
        expect(luxury).toMatch(/ta:[\s\S]*\['personal-data', 'Personal Data', 'far fa-user'\]/);
        expect(luxury).toMatch(/student_service:[\s\S]*\['personal-data', 'Personal Data', 'far fa-user'\]/);
    });

    it('includes Orders in student Support nav (desktop + fallback + mobile)', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');
        const indexMobile = readSource('assets/js/pages/index-mobile-shell.js');
        const socialMobile = readSource('assets/js/pages/social-mobile.js');
        const ordersHtml = readSource('orders.html');

        expect(luxury).toMatch(
            /student:[\s\S]*Support[\s\S]*\['library', 'Library', 'fas fa-book'\], \['orders', 'Orders', 'fas fa-book-open'\], \['social', 'Social', 'fas fa-comments'\]/
        );
        expect(shellChrome).toContain(
            "['library', 'Library', 'fas fa-book'], ['orders', 'Orders', 'fas fa-book-open'], ['social', 'Social', 'fas fa-comments']"
        );
        expect(indexMobile).toMatch(
            /Support[\s\S]*\['library', 'Library', 'fas fa-book'\], \['orders', 'Orders', 'fas fa-book-open'\], \['social', 'Social', 'fas fa-comments'\]/
        );
        expect(socialMobile).toContain("['orders', 'Orders', 'fas fa-book-open']");
        expect(ordersHtml).toMatch(
            /student:[\s\S]*\['library', 'Library', 'fas fa-book'\], \['orders', 'Orders', 'fas fa-book-open'\], \['social', 'Social', 'fas fa-comments'\]/
        );
    });

    it('keeps student Support Orders and E-Chancellery as distinct entries', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');
        expect(luxury).toMatch(
            /student:[\s\S]*Support[\s\S]*\['chancellery', 'E-Chancellery', 'fas fa-desktop'\][\s\S]*\['orders', 'Orders', 'fas fa-book-open'\]/
        );
    });

    it('includes E-Chancellery in admin Systems nav (desktop + fallback + mobile)', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');
        const indexMobile = readSource('assets/js/pages/index-mobile-shell.js');
        const socialMobile = readSource('assets/js/pages/social-mobile.js');
        const adminOrdersHtml = readSource('admin-orders.html');

        expect(luxury).toMatch(
            /admin:[\s\S]*Systems[\s\S]*\['orders', 'Orders', 'fas fa-book-open'\], \['chancellery', 'E-Chancellery', 'fas fa-inbox'\], \['social', 'Social', 'fas fa-comments'\]/
        );
        expect(shellChrome).toContain(
            "['orders', 'Orders', 'fas fa-book-open'], ['chancellery', 'E-Chancellery', 'fas fa-inbox'], ['social', 'Social', 'fas fa-comments']"
        );
        expect(indexMobile).toMatch(
            /Systems[\s\S]*\['orders', 'Orders', 'fas fa-book-open'\], \['chancellery', 'E-Chancellery', 'fas fa-inbox'\], \['social', 'Social', 'fas fa-comments'\]/
        );
        expect(socialMobile).toContain("['chancellery', 'E-Chancellery', 'fas fa-inbox']");
        expect(adminOrdersHtml).toMatch(
            /admin:[\s\S]*\['orders', 'Orders', 'fas fa-book-open'\], \['chancellery', 'E-Chancellery', 'fas fa-inbox'\], \['social', 'Social', 'fas fa-comments'\]/
        );
    });

    it('does not project chancelleryRequests into domain.orders / documentRequests', () => {
        const state = readSource('assets/js/app/state.js');
        const domainFn = state.slice(
            state.indexOf('function buildCanonicalDomain'),
            state.indexOf('function getCurrentUserFromState')
        );
        expect(domainFn).not.toMatch(/documentRequests/);
        expect(domainFn).not.toMatch(/orders\s*:/);
        expect(domainFn).not.toMatch(/chancelleryRequests/);
    });

    it('keeps view-as banner disabled (cleanup-only, no paint CSS)', () => {
        const chromeSource = readSource('assets/js/features/luxury-shell-chrome.js');
        const droplist = readSource('assets/css/lux-droplist.css');
        const controls = readSource('assets/css/lux-controls.css');

        expect(chromeSource).toContain('function syncViewAsBanner()');
        expect(chromeSource).toContain("document.getElementById('lux-view-as-banner')");
        expect(chromeSource).toContain("document.body.classList.remove('lux-view-as-active')");
        expect(chromeSource).not.toContain('lux-view-as-banner__copy');
        expect(droplist).not.toContain('.lux-view-as-banner');
        expect(droplist).not.toContain('--lux-view-as-banner-height');
        expect(controls).not.toContain('--lux-view-as-banner-height');
        expect(controls).not.toContain('body.lux-view-as-active #lux-shell');
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