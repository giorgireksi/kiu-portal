import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { readSocialHtml, socialModuleUrlToken } from './helpers/social-page-source.js';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social-group-detail-dialog (shared shell CSS)', () => {
    it('group detail dialog wires shared chip and typography classes', () => {
        const groups = readSource('assets/js/pages/social-groups.js');
        const feed = readSource('assets/js/pages/social-page-feed-runtime.js');

        expect(groups).toContain('function renderGroupDetailDialog');
        expect(groups).toContain('lux-glass-dialog-card--group-detail');
        expect(groups).toContain('lux-glass-dialog-title lux-card-title');
        expect(groups).toContain('social-neo-pill lux-status-pill home-hover-chip');
        expect(groups).toContain('social-neo-group-detail-section lux-soft-chrome home-hover-chip');
        expect(groups).toContain('social-neo-group-detail-desc lux-card-copy');
        expect(groups).toContain('social-neo-item-line lux-soft-chrome home-hover-chip');
        expect(groups).toContain('lux-glass-dialog-hint lux-card-meta');
        expect(groups).toContain('lux-primary-btn home-hover-chip');
        expect(groups).toContain('lux-secondary-btn home-hover-chip');
        expect(groups).toContain('lux-glass-dialog-cancel-btn home-hover-chip');
        expect(groups).toContain('<strong class="lux-card-title">About</strong>');
        expect(groups).toContain('<span class="lux-card-copy">Group description and purpose.</span>');

        expect(feed).toContain('lux-glass-dialog-card--group-detail');
        expect(feed).toContain('social-neo-group-detail-section lux-soft-chrome home-hover-chip');
        expect(feed).toContain('lux-glass-dialog-title lux-card-title');
        expect(feed).toContain('social-neo-pill lux-status-pill home-hover-chip');
        expect(feed).toContain('social-neo-item-line lux-soft-chrome home-hover-chip');
        expect(feed).toContain('lux-primary-btn home-hover-chip');
        expect(feed).toContain('lux-glass-dialog-cancel-btn home-hover-chip');
    });

    it('lux-modals includes group-detail overflow rules', () => {
        const modals = readSource('assets/css/lux-modals.css');
        expect(modals).toContain('#social-neo-overlay-portal .lux-glass-dialog-card--group-detail .social-neo-group-detail-section');
        expect(modals).toMatch(
            /\.lux-glass-dialog-card--group-detail \.social-neo-group-detail-section[\s\S]*?overflow:\s*visible/
        );
        expect(modals).toMatch(
            /\.lux-glass-dialog-card--group-detail \.social-neo-group-detail-section[\s\S]*?contain:\s*none/
        );
    });

    it('lux-fouc-ht includes group-detail matte paint block', () => {
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(fouc).toContain('/* Social group-detail dialog: matte inners (motion → global .home-hover-chip SSOT). */');
        expect(fouc).toContain('#social-neo-overlay-portal .lux-glass-dialog-card--group-detail');
        expect(fouc).toMatch(
            /\.lux-glass-dialog-card--group-detail[\s\S]*?:is\(\s*\.lux-soft-chrome\.home-hover-chip\s*\)/
        );
        expect(fouc).toMatch(
            /\.lux-glass-dialog-card--group-detail \.social-neo-group-detail-section[\s\S]*?overflow:\s*visible/
        );
    });

    it('social.html cache-busts group-detail CSS and scripts', () => {
        const html = readSocialHtml();
        const page = readSource('assets/js/pages/social-page.js');
        expect(html).toMatch(/lux-modals\.css\?v=/);
        expect(html).toMatch(/lux-fouc-ht\.css\?v=/);
        expect(html).toMatch(/social-page-feed-runtime\.js\?v=/);
        expect(html).toMatch(/social-page\.js\?v=/);
        expect(page).toContain(socialModuleUrlToken('social-groups.js'));
    });
});
