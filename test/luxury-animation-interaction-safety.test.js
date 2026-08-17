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

        expect(toggleBlock).toContain('applySidebarState(next, { persist: true })');
        expect(toggleBlock).not.toContain('__luxIsAnimating');
        expect(toggleBlock).not.toContain('lux-is-animating');
    });

    it('slides the platform sidebar with transform-only desktop bloom motion', () => {
        const css = readShellStackCss();
        expect(css).toMatch(/--lux-shell-slide-duration:\s*0\.3s/);
        expect(css).toMatch(/--lux-shell-scale-closed:\s*0\.92/);
        expect(css).toMatch(/#lux-shell\s*\{[^}]*transition:[\s\S]*transform var\(--lux-shell-slide-duration\)/);
        expect(css).toMatch(
            /lux-sidebar-collapsed[\s\S]*#lux-shell[\s\S]*transform:\s*translate3d\(calc\(-100%[\s\S]*scale\(var\(--lux-shell-scale-closed\)\)/
        );
    });

    it('emits valid time-valued nav stagger variables', () => {
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');
        expect(shellChrome).toContain('const navStagger = () =>');
        expect(shellChrome).toContain(".toFixed(2)}s`");
        expect(shellChrome).toContain('const groupStagger = navStagger()');
        expect(shellChrome).toContain('const itemStagger = navStagger()');
        expect(shellChrome).not.toContain('const groupStagger = Math.min(staggerIndex++, 14)');
    });

    it('does not let touch hover sheen or nav animation bookkeeping flicker the shell', () => {
        const css = readShellStackCss();
        const motion = readSource('assets/js/features/luxury-shell-motion-runtime.js');
        expect(css).toContain('@media (hover: none), (pointer: coarse)');
        expect(css).toContain('transform: translateX(-130%) skewX(-14deg) !important');
        expect(motion).not.toContain("addEventListener('animationstart'");
        expect(motion).not.toContain("endShellChromeMotion('sidebar-toggle')");
        expect(motion).toContain("endShellChromeMotion('shell-transform')");
    });

    it('cascades shell inner chrome on desktop overlay without pausing interaction', () => {
        const css = readShellStackCss();

        expect(css).toContain('@keyframes luxShellNavEnter');
        expect(css).toMatch(
            /@media \(min-width: 1181px\)[\s\S]*body\.lux-unified-shell #lux-shell \.lux-nav-item[\s\S]*opacity:\s*0/
        );
        expect(css).toMatch(
            /@media \(min-width: 1181px\)[\s\S]*body\.lux-unified-shell:not\(\.lux-sidebar-collapsed\) #lux-shell \.lux-nav-item[\s\S]*animation:\s*luxShellNavEnter/
        );
        expect(css).toMatch(
            /@media \(min-width: 1181px\)[\s\S]*body\.lux-unified-shell:not\(\.lux-sidebar-collapsed\) #lux-shell \.lux-nav-item[\s\S]*animation-delay:\s*calc\(var\(--lux-shell-stagger-base\) \+ var\(--lux-nav-stagger/
        );
        expect(css).toMatch(
            /@media \(min-width: 1181px\)[\s\S]*body\.lux-unified-shell\.lux-sidebar-collapsed #lux-shell \.lux-nav-item[\s\S]*animation:\s*none/
        );
        expect(css).toMatch(/\.lux-nav-item \{[^}]*transition:\s*none;/);
        expect(css).toMatch(/\.lux-nav-item::before[\s\S]*opacity:\s*0/);
        expect(css).toMatch(/\.lux-nav-item:hover:not\(\.is-active\)::before[\s\S]*opacity:\s*1/);
        expect(css).not.toMatch(/\.lux-nav-item \{[^}]*transition:[^;]*background/);
        expect(css).not.toMatch(/\.lux-nav-item \{[^}]*transition:\s*all /);
        expect(css).toContain('.lux-nav-item:hover:not(.is-active)');
    });
});
