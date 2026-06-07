import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('shell section location sync', () => {
    it('keeps index shell section navigation aligned with the browser URL', () => {
        const navigation = readSource('assets/js/features/navigation.js');

        expect(navigation).toContain('function syncShellSectionLocation(pageId, role = getEffectiveUserRole()) {');
        expect(navigation).toContain('const nextUrl = new URL(resolveShellRouteUrl(pageId, role), window.location.href);');
        expect(navigation).toContain('window.history.replaceState({}, document.title, nextUrl.toString());');
        expect(navigation).toContain('const targetSection = getNavigablePageSection(pageId);');
        expect(navigation).toContain('if (!targetSection) return false;');
        expect(navigation).toContain('syncShellSectionLocation(pageId, effectiveRole);');
    });

    it('does not rewrite standalone route URLs to index.html shell hashes', () => {
        const navigation = readSource('assets/js/features/navigation.js');

        expect(navigation).toContain('function isIndexPortalShell(pathname = window.location.pathname) {');
        expect(navigation).toContain("return !entry || entry === 'index';");
        expect(navigation).toMatch(
            /function syncShellSectionLocation[\s\S]*?if \(!isIndexPortalShell\(\)\) return;/
        );
    });
});
