import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('lms topbar layout guard', () => {
    const luxurySource = readSource('assets/js/features/index-luxury.js');
    const chromeSource = readSource('assets/js/features/luxury-shell-chrome.js');
    const classroomSource = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
    const lmsHtml = readSource('lms.html');

    it('resolves standalone sub-section page ids back to entry route token', () => {
        expect(luxurySource).toContain('function resolveLuxRouteBodyToken(pageId, entryId)');
        expect(luxurySource).toContain('page.startsWith(`${entry}-`)');
        expect(luxurySource).toContain('resolveLuxRouteBodyToken(pageId, entryId)');
    });

    it('applies resolved route token in applyPortalPageState', () => {
        expect(luxurySource).toContain('`lux-route-${sanitizeBodyToken(resolveLuxRouteBodyToken(pageId, entryId))}`');
    });

    it('skips legacy visual refresh on LMS route during shell sync', () => {
        expect(luxurySource).toContain('function isLuxRouteWorkspace(pageId = getActivePageId(), entryId = getActiveEntryPageId())');
        expect(luxurySource).toMatch(/if \(!onAdminToolsRoute && !onLmsRoute\) \{\s*\n\s*queueLegacyVisualRefresh/);
        expect(luxurySource).toMatch(/if \(!isLuxRouteWorkspace\(\)\) \{\s*\n\s*queueLegacyVisualRefresh/);
    });

    it('skips legacy visual decoration inside LMS workspace nodes', () => {
        expect(luxurySource).toContain("node.closest('#page-lms, #page-lms-groups, #page-lms-inner, #lms-content-area')");
        expect(luxurySource).toContain("document.body?.classList?.contains('lux-route-lms')");
    });

    it('does not enhance LMS selects with universal picker widgets', () => {
        expect(chromeSource).toContain("select.closest('body.lux-route-lms, #page-lms, #page-lms-groups, #page-lms-inner, #lms-content-area')");
    });

    it('re-stabilizes LMS route class after topbar sync', () => {
        expect(chromeSource).toContain('window.ensureLmsRouteVisualState');
        expect(lmsHtml).toContain('window.ensureLmsRouteVisualState = ensureLmsRouteVisualState');
        expect(lmsHtml).toContain("className !== 'lux-route-lms'");
    });

    it('re-syncs LMS visual shell after opening group list', () => {
        expect(classroomSource).toContain('scheduleLmsVisualShellSync');
        expect(classroomSource).toMatch(/updateLmsBulkSelectionCount\(\);\s*\n\s*if \(typeof scheduleLmsVisualShellSync === 'function'\) scheduleLmsVisualShellSync\(\);/);
    });
});
