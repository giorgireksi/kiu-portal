import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social workspace width regressions', () => {
    it('reclaims side gutters and widens the social shell across all panels', () => {
        const css = readSource('assets/css/social-rebuild.css');
        const html = readSource('social.html');

        expect(css).toContain('--sn-page-max: none');
        expect(css).toContain('--sn-page-gutter: clamp(10px, 1vw, 18px)');
        expect(css).toContain('max-width: 100%');
        expect(css).toContain('@media (min-width: 1281px) and (max-width: 1440px)');
        expect(css).toContain('body.lux-route-social #page-social.page-section');
        expect(css).toContain('max-width: none !important');
        expect(css).not.toContain('max-width: min(1560px, calc(100vw - 36px))');
        expect(css).not.toContain('--sn-page-max: 1480px');

        // No 3-column shell (nav | center | rail). Desktop keeps nav + center only.
        expect(css).not.toMatch(/\.social-neo-shell[\s\S]*grid-template-columns:[^;]*minmax\([^)]+\)\s+minmax\(0,\s*1fr\)\s+minmax\(/);
        expect(css).toMatch(/\.social-neo-shell[\s\S]*grid-template-columns:\s*minmax\(220px,\s*260px\)\s+minmax\(0,\s*1fr\)/);
        expect(css).not.toMatch(/@media \(min-width: 1600px\)[\s\S]*\.social-neo-shell[\s\S]*grid-template-columns:\s*minmax\(240px,\s*280px\)\s+minmax\(0,\s*1fr\)/);
        expect(css).toContain('@media (min-width: 1600px)');
        expect(css).toMatch(/@media \(min-width: 1600px\)[\s\S]*\.social-neo-shell[\s\S]*grid-template-columns:\s*minmax\(220px,\s*260px\)\s+minmax\(0,\s*1fr\)/);
        expect(css).toMatch(/\.social-neo-shell[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);

        expect(css).toContain('grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.92fr)');
        expect(css).not.toMatch(/\.social-neo-topbar-copy\s*\{[^}]*max-width:\s*680px/s);

        expect(css).toContain('grid-template-columns: minmax(280px, 0.22fr) minmax(0, 1fr)');
        expect(css).toContain('@media (min-width: 1400px)');
        expect(css).toContain('.social-neo-feed-shell');
        expect(css).toContain('#social-neo-topbar-region');
        expect(css).toContain('#social-neo-command-region');

        expect(html).toContain('assets/css/social-rebuild.css?v=20260713-accentborder2');
    });
});