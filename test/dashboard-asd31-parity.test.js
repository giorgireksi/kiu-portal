import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { readHomeDashboardCss } from './helpers/bare-shell-css.js';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('dashboard asd31 shell/panel parity', () => {
    it('index omits flat lux-shell-chrome; dashboard-paint owns nav enter', () => {
        const index = readSource('index.html');
        const shellPaint = readSource('assets/css/lux-shell.css');
        expect(index).not.toMatch(/lux-shell-chrome\.css/);
        expect(index).toMatch(/lux-shell\.css\?v=/);
        expect(index).not.toMatch(/lux-shell-paint\.css/);
        expect(shellPaint).toContain('@keyframes luxShellNavEnter');
        expect(shellPaint).not.toMatch(
            /body\.lux-full-paint:not\(\.lux-light-mode\) #lux-topbar \.lux-topbar-shell[\s\S]{0,200}radial-gradient/
        );
    });

    it('home dashboard uses focus-fill material block, not home-panel tier split', () => {
        const homeCss = readHomeDashboardCss();
        const tokens = readSource('assets/css/lux-tokens.css');
        expect(tokens).not.toContain('--lux-home-panel-fill');
        expect(homeCss).toMatch(
            /body\.lux-unified-shell:not\(\.lux-route-students-admin\) #page-home #lux-home-shell[\s\S]*?\.lux-soft-chrome/
        );
        expect(homeCss).not.toMatch(
            /#page-home #lux-home-shell \.lux-soft-chrome[\s\S]{0,120}background-image:\s*none/
        );
        expect(homeCss).toMatch(/#page-home #lux-home-shell[\s\S]*?\.lux-stat[\s\S]{0,200}font-family:/);
    });

    it('keeps asd31 depth/atmosphere (glow tokens + transparency fallbacks + overlay)', () => {
        const homeCss = readHomeDashboardCss();
        const tokens = readSource('assets/css/lux-tokens.css');
        const homeLines = homeCss.split(/\r?\n/).length;
        expect(homeLines).toBeGreaterThanOrEqual(250);
        expect(homeCss).toContain('html[data-lux-transparency="0"]');
        expect(homeCss).toMatch(
            /#lux-bg-overlay[\s\S]{0,200}rgba\(var\(--lux-bg-glow-rgb\)/
        );
        expect(homeCss).not.toContain('--lux-raised-fill-alpha:');
        expect(tokens).toContain('--lux-bg-glow-rgb: 216, 170, 86');
        expect(tokens).toContain('--lux-bg-particle-rgb: 216, 170, 86');
        expect(tokens).toContain('--lux-raised-fill-alpha: 0.045');
    });
});
