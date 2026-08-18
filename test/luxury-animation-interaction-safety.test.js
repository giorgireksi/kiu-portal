import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}
function readShellStackCss() {
    return (
        readSource('assets/css/lux-shell.css') +
        '\n' +
        readSource('assets/css/lux-shell.css') +
        '\n' +
        readSource('assets/css/lux-fouc-ht.css')
    );
}

describe('luxury animation interaction safety', () => {
    it('does not ship unused lux-is-animating CSS (class never set at runtime)', () => {
        const css = readShellStackCss();
        expect(css).not.toContain('body.lux-is-animating');
    });

    it('does not pause the luxury background during sidebar toggle', () => {
        const source = readSource('assets/js/features/index-luxury.js');
        const toggleBlock = source.match(/function toggleSidebar\(\)[\s\S]*?\n    \}/)?.[0] || '';

        expect(toggleBlock).toContain('applySidebarState(next, { persist: true, animate: true })');
        expect(toggleBlock).not.toContain('__luxIsAnimating');
        expect(toggleBlock).not.toContain('lux-is-animating');
    });

    it('uses a lightweight opacity-only sidebar show/hide motion', () => {
        const css = readShellStackCss();
        expect(css).toContain('transition: opacity 0.12s linear');
        const collapsed = css.match(/body\.lux-sidebar-collapsed \{[\s\S]*?#lux-shell \{[\s\S]*?\n  \}[\s\S]*?\n\}/)?.[0] || '';
        expect(collapsed).toMatch(/opacity:\s*0[\s\S]*visibility:\s*hidden/);
        expect(collapsed).not.toContain('transition: transform');
    });

    it('keeps nav rows static and updates only the active row after initial render', () => {
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');
        expect(shellChrome).not.toContain('const navStagger = () =>');
        expect(shellChrome).not.toContain('--lux-nav-stagger');
        expect(shellChrome).not.toContain('--lux-shell-footer-stagger');
        expect(shellChrome).toContain('function syncRenderedNavActiveItem(navRoot, activePage)');
        expect(shellChrome).toContain('navRoot.dataset.renderStructureSignature');
    });

    it('does not let touch hover sheen or nav animation bookkeeping flicker the shell', () => {
        const css = readShellStackCss();
        const motion = readSource('assets/js/features/luxury-shell-motion-runtime.js');
        expect(css).toContain('@media (hover: none), (pointer: coarse)');
        expect(css).toContain('transform: translateX(-130%) skewX(-14deg) !important');
        expect(motion).not.toContain("addEventListener('animationstart'");
        expect(motion).not.toContain("endShellChromeMotion('sidebar-toggle')");
        expect(motion).not.toContain("addEventListener('transitionrun'");
        expect(motion).not.toContain("addEventListener('transitionend'");
    });

    it('cascades shell inner chrome on desktop overlay without pausing interaction', () => {
        const css = readShellStackCss();

        expect(css).not.toContain('@keyframes luxShellNavEnter');
        expect(css).toMatch(
            /@media \(min-width: 1181px\)[\s\S]*body\.lux-unified-shell #lux-shell \.lux-nav-item[\s\S]*opacity:\s*1[\s\S]*animation:\s*none/
        );
        expect(css).not.toContain('@keyframes luxRouteContentFade');
        expect(css).not.toContain('.lux-route-content-fade');
        expect(css).toMatch(/\.lux-nav-item \{[^}]*transition:\s*none;/);
        expect(css).toMatch(/\.lux-nav-item::before[\s\S]*opacity:\s*0/);
        expect(css).toMatch(/\.lux-nav-item:hover:not\(\.is-active\)::before[\s\S]*opacity:\s*1/);
        expect(css).not.toMatch(/\.lux-nav-item \{[^}]*transition:[^;]*background/);
        expect(css).not.toMatch(/\.lux-nav-item \{[^}]*transition:\s*all /);
        expect(css).toContain('.lux-nav-item:hover:not(.is-active)');
    });
});
