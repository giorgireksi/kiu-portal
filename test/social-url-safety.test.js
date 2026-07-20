import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social URL safety regressions', () => {
    it('sanitizes user-controlled social URLs before storage and href rendering', () => {
        const socialPage = readSource('assets/js/pages/social-page.js');
        const socialChrome = readSource('assets/js/pages/social-chrome-model.js');
        const socialContent = readSource('backend/platform/domains/social-content-service.js');

        expect(socialPage).toContain('const getSafeSocialExternalUrl = window.getSafeSocialExternalUrl');
        expect(socialChrome).toContain('function getSafeSocialExternalUrl(value) {');
        // Portfolio discover feed (safe link filter) lives in workspace module
        const socialWorkspace = readSource('assets/js/pages/social-workspace.js');
        expect(socialWorkspace).toContain('const safePortfolioLinks = entry.externalLinks.filter');
        expect(socialWorkspace).toContain('const safeLinkUrl = getSafeSocialExternalUrl(link?.url);');
        // Event cards no longer render raw onlineLink hrefs in the list surface.
        expect(socialPage).not.toContain('href="${escape(text(meeting.onlineLink))}"');
        expect(socialPage).not.toContain('href="${escape(link.url)}"');
        expect(socialContent).toContain("function normalizeSafeExternalUrl(value = '') {");
        expect(socialContent).toContain("actionUrl: normalizeSafeExternalUrl(normalized.actionUrl || normalized.website || ''),");
        expect(socialContent).toContain("onlineLink: normalizeSafeExternalUrl(normalized.onlineLink || ''),");
    });
});
