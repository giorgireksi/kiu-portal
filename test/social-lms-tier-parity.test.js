import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social LMS tier parity (asd10 design)', () => {
    it('uses asd10 isolation formula for --social-fade-surface', () => {
        const css = readSource('assets/css/social-rebuild.css');
        const isolationBlock = css.match(
            /\/\* ═══ Social Route Isolation ═══ \*\/[\s\S]*?body\.lux-route-social #page-social/
        )?.[0] || '';

        expect(isolationBlock).toContain('--social-fade-surface:');
        // asd10: alpha-linked fill, not asd8 0.03+ floor inventon
        expect(isolationBlock).toContain('calc(var(--lux-transparency-alpha, .92) * 0.91)');
        expect(isolationBlock).not.toContain('calc(0.03 + var(--lux-transparency-alpha, .92) * 0.86)');
        expect(isolationBlock).not.toContain('/* Soft tier — cards and stat tiles');
    });

    it('paints post cards with shared isolation surface (no Soft/Large split)', () => {
        const css = readSource('assets/css/social-rebuild.css');
        const isolationPaint = css.match(
            /body\.lux-route-social #page-social :is\(\s*\n\s*\.social-neo-topbar-card,[\s\S]*?backdrop-filter: var\(--social-fade-blur\) !important;/
        )?.[0] || '';

        expect(isolationPaint).toContain('.social-neo-post-card');
        expect(isolationPaint).toContain('background: var(--social-fade-surface)');
        expect(css).not.toContain('/* Soft tier — cards and stat tiles');
        expect(css).not.toContain('/* Large tier — lux-card parity panels');
    });

    it('keeps asd10 isolation as social paint SSOT (no multi-hero tier block)', () => {
        const css = readSource('assets/css/social-rebuild.css');
        expect(css).toContain('/* ═══ Social Route Isolation ═══ */');
        // asd8 multi-hero inventon removed with asd10 CSS
        expect(css).not.toContain('/* Hero tier — lms-clean-hero fixed fill');
    });

    it('renders shared heroes with asd10-native markup (no page-hero inventon)', () => {
        const socialPage = readSource('assets/js/pages/social-page.js');
        const heroBlock = socialPage.match(/function renderSocialLuxHero\([\s\S]*?\n    \}/)?.[0] || '';

        expect(heroBlock).toContain('heroFamily');
        expect(heroBlock).toContain('social-neo-section-title');
        expect(heroBlock).toContain('social-neo-section-kicker');
        expect(heroBlock).toContain('lux-strip-card');
        expect(heroBlock).not.toContain('page-hero-title');
        expect(heroBlock).not.toContain('lms-hero-v2-grid');
        expect(heroBlock).not.toContain('lux-summary-surface');
        // inventon class names must not appear in emitted markup
        expect(heroBlock).not.toMatch(/class=\"\$\{sectionClasses\} page-hero/);
        expect(heroBlock).not.toMatch(/social-lms-tier-hero/);
    });

    it('registers asd10 panel chrome classes (no inventon *-hero extras)', () => {
        const messages = readSource('assets/js/pages/social-messages.js');
        const alerts = readSource('assets/js/pages/social-alerts.js');
        const photography = readSource('assets/js/pages/social-photography.js');

        expect(messages).toContain('social-neo-messages__inbox-header');
        expect(messages).not.toContain('social-neo-messages-hero');
        expect(alerts).toContain('sn-alerts-header');
        expect(alerts).not.toContain('sn-alerts-hero');
        expect(photography).toContain('social-photo-chrome');
        expect(photography).not.toContain('social-photo-hero');
    });

    it('bumps social route cache tags to asd10-social1', () => {
        const html = readSource('social.html');

        expect(html).toContain('social-rebuild.css?v=20260713-accentborder2');
        expect(html).toContain('social-projects-lms.css?v=20260713-accentborder2');
        expect(html).toContain('social-photography-lms.css?v=20260710-photo-borders1');
        expect(html).toContain('social-surveys-lms.css?v=20260710-comments-dialog-glass1');
        expect(html).not.toContain('lux-modals.css');
    });
});
