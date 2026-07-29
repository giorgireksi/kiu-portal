import { describe, expect, it } from 'vitest';
import { expectRetiredCss, readSource } from './helpers/bare-shell-css.js';

describe('staff / students-admin CSS-owned panel glass', () => {
    it('defines generic CSS-owned surface helpers in lux-transparency route runtime', () => {
        const runtime = readSource('assets/js/shared/lux-transparency.js');
        expect(runtime).toContain('function isCssOwnedSurface(el)');
        expect(runtime).toMatch(/students-hub-|staff-hub-/);
        expect(runtime).toContain("closest?.('#staff-content')");
        expect(runtime).toContain("closest?.('#students-content')");
        const host = readSource('assets/js/shared/lux-transparency.js');
        expect(host).toContain('isCssOwnedSurface');
        expect(host).toMatch(/stripInlineGlassPaint/);
    });

    it('staff-command-center and students-admin route skins stay retired', () => {
        expectRetiredCss('staff-command-center.css');
        expectRetiredCss('students-admin-lms.css');
    });

    it('paints staff and students directory panels via route-scoped fouc matte block', () => {
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(fouc).toContain('body.lux-route-students-admin #students-content :is(');
        expect(fouc).toContain('.students-hub-controls.home-hover-chip');
        expect(fouc).toContain('.students-hub-form-section.lux-data-card.home-hover-chip');
        expect(fouc).toContain('.students-hub-profile-metric.lux-data-card.home-hover-chip');
        expect(fouc).toContain('.students-hub-info-card.lux-data-card.home-hover-chip');
        expect(fouc).toContain('.students-hub-profile-field.lux-soft-chrome.home-hover-chip');
        expect(fouc).toContain('body.lux-route-staff #staff-content :is(');
        expect(fouc).toContain('.staff-hub-directory-panel.home-hover-chip');
        expect(fouc).toContain('.staff-hub-profile-field.lux-soft-chrome.home-hover-chip');
        expect(fouc).toContain('.students-hub-form-section.lux-data-card');
        expect(fouc).toContain('.students-hub-profile-metric.lux-data-card');
    });

    it('dual-writes students profile layout selectors in bare-lite', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('#students-content .students-hub-avatar');
        expect(bare).toContain('#students-content .students-hub-kicker');
        expect(bare).toContain('--students-hub-progress, var(--staff-hub-progress, 0%)');
        expect(bare).toContain('.students-hub-form-section:not(.home-hover-chip)');
        expect(bare).toContain('.students-hub-profile-field:not(.home-hover-chip)');
        expect(bare).toContain('--lux-field-radius');
        expect(bare).toContain('.students-hub-profile-metrics');
        expect(bare).toContain('.students-hub-academic-stack');
    });
});
