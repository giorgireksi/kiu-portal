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

    it('slides the platform sidebar with transform-only desktop motion', () => {
        const css = readShellStackCss();
        const collapsedBlock = css.match(/body\.lux-sidebar-collapsed #lux-shell\s*\{[^}]+\}/)?.[0] || '';

        expect(css).toMatch(/--lux-shell-slide-duration:\s*0\.38s/);
        expect(css).toMatch(/#lux-shell\s*\{[^}]*transition:[\s\S]*transform var\(--lux-shell-slide-duration\)/);
        expect(collapsedBlock).toContain('transform: translate3d(calc(-100% - 20px), 0, 0)');
        expect(collapsedBlock).not.toContain('opacity: 0');
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
        expect(css).toMatch(/\.lux-nav-item \{[^}]*transition:\s*color 0\.18s ease, background 0\.18s ease, box-shadow 0\.18s ease;/);
        expect(css).not.toMatch(/\.lux-nav-item \{[^}]*transition:\s*all /);
        expect(css).toContain('.lux-nav-item:hover:not(.is-active)');
    });
});
