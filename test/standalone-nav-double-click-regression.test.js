import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('standalone nav double-click URL regression', () => {
    it('no-ops when re-clicking the active standalone route', () => {
        const navigation = readSource('assets/js/features/navigation.js');

        expect(navigation).toContain('function isSamePageNavigation(pageId) {');
        expect(navigation).toMatch(
            /if \(isSamePageNavigation\(pageId\) \|\| isSamePageNavigation\(resolvedPageId\)\) \{[\s\S]*?window\.scrollTo\(0, 0\);[\s\S]*?return \{ navigationSkipped: true \};/
        );
    });

    it('limits spa-section routing to the index portal shell host', () => {
        const navigation = readSource('assets/js/features/navigation.js');

        expect(navigation).toContain('function isIndexPortalShell(pathname = window.location.pathname) {');
        expect(navigation).toContain('if (isIndexPortalShell() && (normalizedPageId === \'home\' || hasNavigableSection)) {');
        expect(navigation).toContain("return 'spa-section';");
    });

    it('avoids section toggling and spa re-renders on same-page navigation', () => {
        const navigation = readSource('assets/js/features/navigation.js');

        expect(navigation).toMatch(
            /function primeShellSectionTransition[\s\S]*?if \(isSamePageNavigation\(pageId\)\) return true;/
        );
        expect(navigation).toMatch(
            /if \(!isSamePageNavigation\(pageId\)\) \{[\s\S]*?renderNewsWorkspace/
        );
    });
});
