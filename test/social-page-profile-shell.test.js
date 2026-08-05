import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { readSocialHtml, socialModuleUrlToken } from './helpers/social-page-source.js';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social-page-profile-shell (shared shell CSS)', () => {
    it('page profile dual-writes shared chip and typography classes', () => {
        const pages = readSource('assets/js/pages/social-pages.js');

        expect(pages).toContain('social-neo-card social-neo-page-profile home-hover-chip');
        expect(pages).toContain('h3 class="lux-card-title"');
        expect(pages).toContain('p class="lux-card-copy"');
        expect(pages).toContain('social-neo-pill lux-status-pill home-hover-chip');
        expect(pages).toContain('social-neo-page-profile-back home-hover-chip');
        expect(pages).toContain('social-neo-page-profile-tab home-hover-chip');
        expect(pages).toContain('social-neo-page-compose-block lux-soft-chrome home-hover-chip');
        expect(pages).toContain('social-neo-page-compose-block social-neo-page-compose-cta lux-soft-chrome home-hover-chip');
        expect(pages).toContain('strong class="lux-card-title">Join the conversation');
        expect(pages).toContain('social-neo-empty-hero home-hover-chip');
        expect(pages).toContain('social-neo-page-about-card home-hover-chip');
        expect(pages).toContain('social-neo-page-people-card home-hover-chip');
        expect(pages).toContain('social-neo-entity-card home-hover-chip');
        expect(pages).not.toMatch(/social-neo-pages-hero-tab[\s\S]{0,120}home-hover-chip/);
    });

    it('lux-fouc-ht allowlists profile shells and tabs for lift motion', () => {
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(fouc).toContain('.social-neo-page-profile');
        expect(fouc).toContain('.social-neo-page-compose-block');
        expect(fouc).toContain('.social-neo-page-about-card');
        expect(fouc).toContain('.social-neo-empty-hero');
        expect(fouc).toMatch(
            /body\.lux-route-social :is\(\s*\.social-neo-page-profile-tabs,\s*\.social-neo-page-profile-tab-strip\s*\)[\s\S]*?overflow:\s*visible/
        );
        expect(fouc).toMatch(
            /\.social-neo-page-profile-tab\.home-hover-chip[\s\S]*?overflow:\s*visible/
        );
    });

    it('cache-busts pages module and fouc for profile shell', () => {
        const html = readSocialHtml();
        const page = readSource('assets/js/pages/social-page.js');
        expect(html).toMatch(/lux-fouc-ht\.css\?v=/);
        expect(html).toMatch(/social-page\.js\?v=/);
        expect(page).toContain(socialModuleUrlToken('social-pages.js'));
    });
});
