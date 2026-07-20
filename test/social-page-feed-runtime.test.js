import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social-page-feed-runtime peel', () => {
    it('owns entity/compose helpers outside social-page.js via factory', () => {
        const main = readSource('assets/js/pages/social-page.js');
        const feed = readSource('assets/js/pages/social-page-feed-runtime.js');
        expect(main).toContain('__kiuCreateSocialPageFeedApi');
        expect(main).not.toMatch(/^\s*function navigateToEntity\b/m);
        expect(main).not.toMatch(/^\s*function patchPostComposeDialog\b/m);
        expect(main).not.toMatch(/^\s*function renderEntityDetailDialog\b/m);
        expect(feed).toContain('function navigateToEntity');
        expect(feed).toContain('function patchPostComposeDialog');
        expect(feed).toContain('__kiuCreateSocialPageFeedApi');
        expect(feed).toContain('__KIU_SOCIAL_PAGE_FEED_LOADED');
    });

    it('loads before social-page.js on social.html', () => {
        const html = readSource('social.html');
        expect(html).toContain('social-page-feed-runtime.js');
        expect(html.indexOf('social-page-feed-runtime.js'))
            .toBeLessThan(html.indexOf('assets/js/pages/social-page.js'));
    });
});
