import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social page card about regressions', () => {
    it('removes managers panel and adds truncated about with more dialog', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const pagesModule = readSource('assets/js/pages/social-pages.js');
        const css = readSource('assets/css/social-rebuild.css');

        const cardStart = pagesModule.indexOf('const renderPageCard = (page) => {');
        const cardEnd = pagesModule.indexOf('const renderProfileComposer = (page) =>', cardStart);
        const cardBlock = pagesModule.slice(cardStart, cardEnd);

        expect(cardBlock).toContain('social-neo-page-card-about-text');
        expect(cardBlock).toContain('data-action="page-about-more"');
        expect(cardBlock).toContain('social-neo-page-card-about-more');
        expect(pagesModule).toContain('PAGE_ABOUT_PREVIEW_MAX');
        expect(cardBlock).not.toContain('<strong>Managers</strong>');

        expect(readSource('assets/js/pages/social-pages.js')).toContain("kind === 'page-about'");
        expect((source + pagesModule)).toContain("action === 'page-about-more'");
        expect((source + pagesModule)).toContain("openDialog('page-about'");
        expect(source).toContain('page-about-more|page-members-open|page-members-filter|page-members-search');
        expect(source).toContain('page-profile-back');

        expect(css).toMatch(/\.social-neo-page-card-about-text[\s\S]*-webkit-line-clamp:\s*3/);
        expect(css).toContain('.social-neo-page-card-about-more');
        expect(css).toContain('.social-neo-page-about-dialog-body');

        const profileAboutStart = pagesModule.indexOf('const renderProfileAbout = (page) => {');
        const profileAboutEnd = pagesModule.indexOf('const renderPageProfile = (page) => {', profileAboutStart);
        const profileAboutBlock = pagesModule.slice(profileAboutStart, profileAboutEnd);

        expect(profileAboutBlock).toContain('social-neo-page-card-about-text');
        expect(profileAboutBlock).toContain('data-action="page-about-more"');
        expect(profileAboutBlock).toContain('People on this page');
        expect(profileAboutBlock).toContain('social-neo-page-people-stats');
        expect(profileAboutBlock).toContain('data-action="page-members-open"');
        expect(profileAboutBlock).not.toContain('<strong>Admins</strong>');
        expect(profileAboutBlock).not.toContain('<strong>Followers</strong>');
        expect(css).toContain('.social-neo-page-about-card .social-neo-page-card-about-text');

        expect(readSource('assets/js/pages/social-pages.js')).toContain("kind === 'page-members'");
        expect((source + pagesModule)).toContain("action === 'page-members-open'");
        expect((source + pagesModule)).toContain("openDialog('page-members'");
        expect(source).toContain('page-members-open|page-members-filter|page-members-search');
        expect(css).toContain('.social-neo-page-people-card');
        expect(css).toContain('.social-neo-page-members-filters');
    });
});
