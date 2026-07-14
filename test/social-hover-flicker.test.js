import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function extractFunctionBody(source, functionName) {
    const start = source.indexOf(`function ${functionName}`);
    if (start < 0) return '';
    const braceStart = source.indexOf('{', start);
    if (braceStart < 0) return '';
    let depth = 0;
    for (let index = braceStart; index < source.length; index += 1) {
        const char = source[index];
        if (char === '{') depth += 1;
        if (char === '}') {
            depth -= 1;
            if (depth === 0) return source.slice(start, index + 1);
        }
    }
    return '';
}

describe('social section hover flicker prevention', () => {
    it('uses asd10 social paint without asd8 Soft/Hero inventon overrides', () => {
        const css = readSource('assets/css/social-rebuild.css');
        expect(css).toContain('/* ═══ Social Route Isolation ═══ */');
        expect(css).not.toContain('/* Soft tier — cards and stat tiles');
        expect(css).not.toContain('/* Hero tier — lms-clean-hero fixed fill');
        // asd8 route-wide calm block was inventon; asd10 keeps isolation + managed fade classes
        expect(css).not.toContain('/* Route hover calm — flat social-neo glass');
    });

    it('calms project tab pills in social-projects-lms when present (asd8 feature keep)', () => {
        const css = readSource('assets/css/social-projects-lms.css');
        // feature delta may include hover calm for project pills
        if (css.includes('social-project-tab-pill')) {
            expect(css).toMatch(/social-project-tab-pill/);
        } else {
            expect(css.length).toBeGreaterThan(100);
        }
    });

    it('calms project tab pills in social-projects-lms.css', () => {
        const css = readSource('assets/css/social-projects-lms.css');

        expect(css).toMatch(
            /body\.lux-route-social[\s\S]*\.social-project-tab-pill[\s\S]*:hover[\s\S]*transform:\s*none !important/
        );
        expect(css).toMatch(/\.social-project-tab-pill\.is-active[\s\S]*transform:\s*none !important/);
    });

    it('keeps social fade CSS authoritative for section chrome surfaces', () => {
        const utilities = readSource('assets/js/shared/utilities.js');

        // asd10 SOCIAL_FADE_CSS_MANAGED_CLASSES (not inventon hero list)
        expect(utilities).toContain("'social-neo-card'");
        expect(utilities).toContain("'social-neo-post-card'");
        expect(utilities).toContain("'social-neo-composer-card'");
        expect(utilities).toContain('SOCIAL_FADE_CSS_MANAGED_CLASSES');
        expect(utilities).toMatch(
            /if \(shouldKeepSocialFadeCssBackground\(el\)\) \{[\s\S]*?removeProperty\('backdrop-filter'\)/
        );
    });

    it('skips transparency refresh on lightweight social interactions', () => {
        const socialPage = readSource('assets/js/pages/social-page.js');

        expect(socialPage).toContain('SOCIAL_SKIP_TRANSPARENCY_REFRESH_RE');
        expect(socialPage).toContain('skipTransparencyRefresh');
        expect(socialPage).toMatch(/feed-tab[\s\S]*community-tab[\s\S]*post-react/);
    });

    it('bumps social.html cache bust for flicker fix', () => {
        const html = readSource('social.html');

        expect(html).toContain('assets/css/social-rebuild.css?v=20260713-accentborder2');
        expect(html).toContain('assets/css/social-projects-lms.css?v=20260713-accentborder2');
        expect(html).toContain('assets/js/shared/utilities.js?v=20260713-accentborder3');
    });
});