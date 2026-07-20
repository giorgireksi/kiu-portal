import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

/** Bare-shell era: social paint CSS deleted; redesign later from LMS/TT tokens. */
describe('social bare shell era', () => {
    it('social.html uses bare shell (no paint megafiles)', () => {
        const html = readSource('social.html');
        expect(html).toContain('lux-shell.css');
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).not.toMatch(/lux-page-bare\.css(?!-lite)/);
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).toContain('lux-shell.css');
        expect(html).toMatch(/class="[^"]*lux-page-bare/);
        expect(html).not.toMatch(/href=["'][^"']*social-rebuild\.css/);
        expect(html).not.toMatch(/href=["'][^"']*social-material\.css/);
        expect(html).not.toMatch(/href=["'][^"']*index-luxury\.css/);
        expect(html).not.toMatch(/href=["'][^"']*lux-surfaces\.css/);
        expect(html).toContain('lux-full-paint');
        expect(html).toMatch(/lux-shell\.css/);
        expect(html).not.toMatch(/lux-shell-paint\.css/);
        expect(html).toMatch(/lux-focus-panel\.css/);
        for (const f of [
            'social-rebuild.css',
            'social-material.css',
            'social-projects-lms.css',
            'social-surveys-lms.css',
            'social-photography-lms.css',
            'portfolio-editor.css',
        ]) {
            expect(existsSync(join(process.cwd(), 'assets/css', f))).toBe(false);
        }
    });

    it('does not inject lazy social paint stylesheets', () => {
        const page = readSource('assets/js/pages/social-page.js');
        // Bare-shell era: no lazy paint injector; modules remain for behavior.
        expect(page).not.toContain('function ensureSocialStylesheet');
        expect(page).not.toMatch(/social-rebuild\.css|social-projects-lms\.css|social-photography-lms\.css/);
        expect(page).toMatch(/social-projects|social-workspace|SOCIAL_PROJECTS/);
    });

    it('bare-lite keeps layout helpers without nuclear flatten', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('Bare portal layout helpers');
        expect(bare).toContain('body.lux-page-bare');
        expect(bare).not.toContain('backdrop-filter: none');
    });
});
