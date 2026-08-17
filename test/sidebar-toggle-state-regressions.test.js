import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('sidebar toggle state regressions', () => {
    it('derives toggle state from the live body class instead of stale localStorage', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');

        expect(luxury).toMatch(
            /function isSidebarCollapsed\(\)[\s\S]*document\.body\.classList\.contains\('lux-sidebar-collapsed'\)/
        );
        expect(luxury).toMatch(
            /function toggleSidebar\(\)[\s\S]*const next = !document\.body\.classList\.contains\('lux-sidebar-collapsed'\)/
        );
        expect(luxury).toMatch(
            /function applySidebarState[\s\S]*document\.documentElement\.classList\.toggle\('lux-sidebar-collapsed'/
        );
        expect(luxury).not.toContain("beginShellChromeMotion(320, 'sidebar-toggle')");
    });

    it('does not auto-close desktop nav on outside clicks escape or nav picks', () => {
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');

        expect(shellChrome).not.toContain('function bindDesktopSidebarOverlayDismiss()');
        expect(shellChrome).not.toContain('function closeDesktopSidebarOverlay()');
        expect(shellChrome).not.toContain('__kiuDesktopSidebarOverlayBound');
    });

    it('styles the shell hide button as a full labeled pill', () => {
        const shellCss = readSource('assets/css/lux-shell.css');

        expect(shellCss).toMatch(/\.lux-shell-head \.lux-sidebar-close-btn[\s\S]*width:\s*100%/);
        expect(shellCss).toMatch(/\.lux-shell-head \.lux-sidebar-close-btn[\s\S]*min-height:\s*50px/);
        expect(shellCss).not.toMatch(/body\.lux-unified-shell \.lux-sidebar-close-label[\s\S]*display:\s*none/);
        expect(shellCss).toMatch(/body\.lux-full-paint[\s\S]*--lux-topbar-shift:\s*0/);
        expect(shellCss).toMatch(/body\.lux-full-paint[\s\S]*transform:\s*translate3d\(var\(--lux-topbar-shift/);
        expect(shellCss).toMatch(
            /body:not\(\.lux-sidebar-collapsed\) #lux-topbar \.lux-sidebar-toggle-btn[\s\S]*visibility:\s*hidden/
        );
        expect(shellCss).not.toMatch(
            /body:not\(\.lux-sidebar-collapsed\) #lux-topbar \.lux-sidebar-toggle-btn\s*\{\s*display:\s*none/
        );
    });
});
