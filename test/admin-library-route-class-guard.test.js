import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('admin-library route class guard', () => {
    const luxurySource = readSource('assets/js/features/index-luxury.js')
        + readSource('assets/js/features/luxury-index-sync-runtime.js');
    const chromeSource = readSource('assets/js/features/luxury-shell-chrome.js')
        + readSource('assets/js/features/luxury-shell-topbar-runtime.js');
    const html = readSource('admin-library.html');

    it('resolves admin-library entry to admin-library route token', () => {
        expect(luxurySource).toContain("entry === 'admin-library' || entry === 'admin-orders'");
        expect(luxurySource).toMatch(/if \(entry === 'admin-library' \|\| entry === 'admin-orders'\) return entry;/);
    });

    it('applies admin-library route class without TA library route token', () => {
        expect(luxurySource).toContain('function getLuxRouteBodyClassTokens(pageId, entryId)');
        expect(luxurySource).toContain('function applyLuxRouteBodyClasses(pageId, entryId)');
        expect(luxurySource).toMatch(/if \(entry === 'admin-library'\) \{[\s\S]*tokens\.add\('admin-library'\)/);
        expect(luxurySource).not.toMatch(/if \(entry === 'admin-library'\) \{[\s\S]*tokens\.add\('library'\)/);
        expect(luxurySource).toContain('applyLuxRouteBodyClasses(pageId, entryId)');
    });

    it('re-stabilizes admin library route classes after topbar sync', () => {
        const adminJs = readSource('assets/js/pages/admin-library.js');

        expect(html).toContain('bootAdminLibraryPage');
        expect(html).toContain('assets/js/pages/admin-library.js?v=20260731-sectionsopen1');
        expect(adminJs).toContain('ensureAdminLibraryRouteVisualState');
        expect(adminJs).toContain("body.classList.add('lux-route-admin-library')");
        expect(adminJs).toContain("body.classList.remove('lux-route-library')");
        expect(chromeSource).toContain('ensureAdminLibraryRouteVisualState');
        expect(adminJs).toContain("switchFacultyTheme(fac, { refreshDependentViews: false });");
        expect(adminJs).toContain('window.refreshStandaloneDesktopRouteShellContext({ rerender: false, refreshActiveRoute: false });');
        expect(adminJs).not.toContain('logAdminLibraryLayoutProbe');
        expect(html).not.toContain('logAdminLibraryLayoutProbe');
        expect(html).not.toContain('127.0.0.1:7615/ingest');
    });

    it('reconciles admin-library route classes inside applyPortalPageState', () => {
        expect(luxurySource).toContain('function reconcileAdminLibraryRouteClasses(pageId = getActivePageId(), entryId = getActiveEntryPageId())');
        expect(luxurySource).toContain("document.body.classList.remove('lux-route-library')");
        expect(luxurySource).toContain('reconcileAdminLibraryRouteClasses(pageId, entryId)');
        expect(luxurySource).toContain('isAdminLibraryRouteContext(activePageId, getActiveEntryPageId())');
    });
});
