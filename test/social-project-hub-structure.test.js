import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social-project-hub-structure (bare-shell era)', () => {
    it('social domain paint CSS removed; behavior tests deferred to JS modules', () => {
        expect(existsSync(join(process.cwd(), 'assets/css/social-rebuild.css'))).toBe(false);
        expect(existsSync(join(process.cwd(), 'assets/css/social-projects-lms.css'))).toBe(false);
    });

    it('workspace hub uses shared lux controls and layout hooks', () => {
        const panel = readSource('assets/js/pages/social-workspace-panel.js');
        const bare = readSource('assets/css/lux-page-bare-lite.css');

        expect(panel).toContain('name="projectDiscoverSearch"');
        expect(panel).toMatch(/class="lux-control"[^>]*name="projectDiscoverSearch"/);
        expect(panel).not.toMatch(/social-neo-input[^>]*name="projectDiscoverSearch"/);
        expect(panel).toContain('lux-universal-native-select');
        expect(panel).toContain('social-project-hub-rail-card lux-soft-chrome home-hover-chip');
        expect(panel).toContain('social-project-card-new home-hover-chip');
        expect(panel).toContain('social-project-metric-card lux-soft-chrome home-hover-chip');
        expect(panel).toContain('social-project-hub-discover lux-soft-chrome home-hover-chip');
        expect(panel).toContain('social-project-hub-filterbar lux-soft-chrome home-hover-chip');
        expect(panel).toContain('lms-route-meta-12');

        const chrome = readSource('assets/js/pages/social-workspace-project-chrome.js');
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(chrome).toContain('social-neo-community-panel--workspace home-hover-chip');
        expect(chrome).toContain('social-neo-workspace-hero-stats home-hover-chip');
        expect(chrome).toContain('social-neo-workspace-hero-stat social-neo-events-hero-stat lux-strip-card surface-card lux-soft-chrome home-hover-chip');
        expect(fouc).toContain('.social-neo-workspace-hero-stat');
        expect(fouc).toContain('.social-neo-workspace-hero-stats');

        expect(bare).toContain('.social-project-hub-layout {');
        expect(bare).toContain('.social-neo-workspace-hub-section');
        expect(bare).toMatch(/\.social-project-hub-filterbar \{[\s\S]{0,180}?overflow:\s*visible/);
        const hubSectionRule = bare.slice(
            bare.indexOf('body.lux-route-social .social-neo-workspace-hub-section,'),
            bare.indexOf('body.lux-route-social .social-project-hub-search-row')
        );
        expect(hubSectionRule).toContain('overflow: visible');
        expect(hubSectionRule).not.toContain('--social-chip-surface');
        expect(bare).toContain('.social-project-hub-main-head strong {');
        expect(bare).toContain('.social-project-card-new-title {');
        expect(bare).toContain('.social-project-card-new-progress-bar {');
        expect(bare).toContain('.social-project-row-title {');
        expect(bare).toContain('.social-project-hub-rail .social-project-row');
        expect(bare).toContain('"status title cta"');

        const hubBlockStart = bare.indexOf('/* Social: project hub cards & list */');
        expect(hubBlockStart).toBeGreaterThan(-1);
        const hubBlock = bare.slice(hubBlockStart, hubBlockStart + 4000);
        expect(hubBlock).not.toContain('--sn-bdr');
        expect(hubBlock).not.toContain('--sn-bg');

        expect(bare).toContain('.social-project-hub-grid .social-project-card-new-summary');
        expect(bare).toMatch(/\.social-project-hub-grid[\s\S]*?minmax\(168px/);
        expect(bare).toContain('.social-project-hub-grid .social-project-card-new-cta');
        expect(bare).toContain('.social-project-hub-grid .social-project-hub-cta-tile');
        expect(bare).toContain('minmax(140px, 1fr)');

        const railCardRule = bare.slice(
            bare.indexOf('body.lux-route-social .social-project-hub-rail-card {'),
            bare.indexOf('body.lux-route-social .social-project-hub-contribution {')
        );
        expect(railCardRule).toContain('min-width: 0');
        expect(railCardRule).not.toContain('background: transparent');
        expect(bare).not.toMatch(/\.social-project-hub-rail-card\s*\{[^}]*background:\s*transparent/);
        expect(fouc).toContain('.social-project-hub-rail-card');
        expect(fouc).toMatch(
            /\.social-project-hub-rail-card,\s*\n\s*\.social-project-hub-cta-tile\s*\n\s*\)\.home-hover-chip:hover/
        );
    });
});
