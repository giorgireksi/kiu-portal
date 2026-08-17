import { describe, expect, it } from 'vitest';
import { expectRetiredCss, readSource } from './helpers/bare-shell-css.js';

describe('global sidebar overlay regressions', () => {
    it('keeps unified-shell content full width and overlays the platform sidebar on desktop', () => {
        const shellCss = readSource('assets/css/lux-shell.css');

        expect(shellCss).toMatch(
            /@media \(min-width: 1181px\)[\s\S]*body\.lux-unified-shell #app-content[\s\S]*margin-left:\s*0/
        );
        expect(shellCss).toMatch(
            /@media \(min-width: 1181px\)[\s\S]*body\.lux-unified-shell #app-content[\s\S]*width:\s*100%/
        );
        expect(shellCss).toContain('transition: opacity 0.12s linear');
        expect(shellCss).not.toMatch(
            /body\.lux-unified-shell:not\(\.lux-sidebar-collapsed\)::before/
        );
        expect(shellCss).toMatch(
            /@media \(min-width: 1181px\)[\s\S]*body\.lux-unified-shell:not\(\.lux-sidebar-collapsed\) #lux-shell[\s\S]*z-index:\s*70/
        );
        expect(shellCss).toMatch(
            /@media \(min-width: 1181px\)[\s\S]*body\.lux-unified-shell:not\(\.lux-sidebar-collapsed\) #lux-topbar[\s\S]*z-index:\s*60/
        );
        expect(shellCss).not.toMatch(
            /@media \(min-width: 1181px\)[\s\S]*body\.lux-unified-shell:not\(\.lux-sidebar-collapsed\) #app-content[\s\S]*margin-left:\s*var\(--lux-sidebar-width\)/
        );
    });

});
