import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social pages empty regressions', () => {
    it('renders a centered contextual empty state without duplicate create actions', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const pagesModule = readSource('assets/js/pages/social-pages.js');
        const css = readSource('assets/css/social-rebuild.css');
        const html = readSource('social.html');
        const utilities = readSource('assets/js/shared/utilities.js');

        expect(source).toContain('function renderPagesEmptyState(');
        expect(pagesModule).toContain('function renderPagesEmptyState(');
        expect(pagesModule).toContain('social-neo-pages-empty-state');
        expect(pagesModule).toContain('data-action="pages-search-clear"');
        expect(pagesModule).toContain('Clear search');
        expect(pagesModule).toContain('Browse Discover');
        expect(pagesModule).toContain('data-pages-tab="discover"');
        expect((source + pagesModule)).toContain("action === 'pages-search-clear'");
        expect(pagesModule).toContain('social-neo-card social-neo-pages-hero');
        expect(pagesModule).toContain('social-neo-pages-hero-toolbar');
        expect(pagesModule).toContain('renderPagesEmptyState(activeTab, pageSearch)');
        expect(pagesModule).not.toContain('social-neo-empty-hero social-neo-pages-empty-state');

        const emptyStart = pagesModule.indexOf('function renderPagesEmptyState(');
        const emptyEnd = pagesModule.indexOf('function renderPagesPanel()', emptyStart);
        const emptyBlock = pagesModule.slice(emptyStart, emptyEnd);
        expect(emptyBlock).not.toContain('page-create-open');
        expect(emptyBlock).toContain('fa-star');
        expect(emptyBlock).toContain('fa-flag');
        expect(emptyBlock).toContain('fa-magnifying-glass');

        expect(css).toMatch(
            /body\.lux-route-social \.social-neo\[data-panel="pages"\] \.social-neo-pages-grid > \.social-neo-pages-empty-state[\s\S]*justify-self:\s*center/
        );
        expect(css).toMatch(
            /body\.lux-route-social \.social-neo\[data-panel="pages"\] \.social-neo-pages-grid > :only-child:not\(\.social-neo-pages-empty-state\)/
        );
        expect(css).toMatch(
            /body\.lux-route-social \.social-neo\[data-panel="pages"\] \.social-neo-pages-grid > \.social-neo-pages-empty-state[\s\S]*background:\s*transparent\s*!important/
        );
        expect(css).toContain('.social-neo-pages-hero-toolbar');
        expect(css).toMatch(
            /body\.lux-light-mode\.lux-route-social \.social-neo\[data-panel="pages"\] \.social-neo-pages-empty-state/
        );

        expect(utilities).toContain("'.social-neo-empty-hero'");

        expect(html).toContain('assets/css/social-rebuild.css?v=20260713-accentborder2');
    });

    it('renders LMS-style page profile tab strip with icons', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const pagesModule = readSource('assets/js/pages/social-pages.js');
        const css = readSource('assets/css/social-rebuild.css');

        expect(pagesModule).toContain('social-neo-page-profile-tab-strip');
        expect(pagesModule).toContain('role="tablist"');
        expect(pagesModule).toContain('fa-layer-group');
        expect(pagesModule).toContain('fa-certificate');
        expect(pagesModule).toContain('fa-users');
        expect(pagesModule).toContain('fa-circle-info');
        expect((source + pagesModule)).toContain("action === 'page-profile-tab'");

        expect(css).toContain('.social-neo-page-profile-tab-strip');
        expect(css).toContain('@keyframes social-page-tab-slide');
        expect(css).toContain('.social-neo-page-profile-tab-strip .social-neo-page-profile-tab.is-active::after');
    });
});
