import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('standalone navigate resolve', () => {
    it('defines alias resolution for gradebook, calendar, and profile', () => {
        const navigation = readSource('assets/js/features/navigation.js');

        expect(navigation).toContain('function resolveAliasPageId(pageId, role = getEffectiveUserRole())');
        expect(navigation).toContain("if (normalizedPageId === 'calendar') return 'timetable';");
        expect(navigation).toContain("return 'faculty-gradebook';");
        expect(navigation).toContain('resolveAliasPageId(pageId, role)');
        expect(navigation).toContain('function assignStandalonePortalRoute(pageId, role = getEffectiveUserRole())');
    });

    it('hard-navigates standalone hosts through resolvePortalRouteUrl before SPA logic', () => {
        const navigation = readSource('assets/js/features/navigation.js');

        expect(navigation).toMatch(
            /if \(!isIndexPortalShell\(\)\) \{[\s\S]*?assignStandalonePortalRoute\(pageId, effectiveRole\);[\s\S]*?return;/
        );
    });

    it('allows gradebook alias in access checks for teaching roles', () => {
        const navigation = readSource('assets/js/features/navigation.js');

        expect(navigation).toContain('const resolvedPageId = resolveAliasPageId(pageId, effectiveRole);');
        expect(navigation).toContain('!_allowedPagesCache.has(pageId) && !_allowedPagesCache.has(resolvedPageId)');
    });
});

describe('gradebook staff return context', () => {
    it('persists and restores staff session around student portal preview', () => {
        const gradebook = readSource('assets/js/pages/gradebook.js');

        expect(gradebook).toContain("const KIU_GRADEBOOK_STAFF_RETURN_KEY = 'KIU_GRADEBOOK_STAFF_RETURN';");
        expect(gradebook).toContain('function persistGradebookStaffReturnContext()');
        expect(gradebook).toContain('function restoreGradebookStaffReturnContextIfNeeded()');
        expect(gradebook).toMatch(/persistGradebookStaffReturnContext\(\);[\s\S]*?const targetUser =/);
        expect(gradebook).toMatch(/restoreGradebookStaffReturnContextIfNeeded\(\);[\s\S]*?populateFacultyGradebookFilters/);
    });
});

describe('faculty gradebook mobile nav', () => {
    it('uses faculty-gradebook as the active bottom nav target instead of portal home', () => {
        const html = readSource('faculty-gradebook.html');

        expect(html).toContain('data-nav-target="faculty-gradebook"');
        expect(html).not.toMatch(/id="mob-nav-home"[^>]*data-nav-target="home"/);
    });
});
