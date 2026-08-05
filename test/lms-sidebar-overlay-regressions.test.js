import { describe, expect, it } from 'vitest';

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('lms sidebar overlay regressions', () => {
    it('relies on global unified-shell overlay instead of LMS-only desktop push overrides', () => {
        const shellCss = readSource('assets/css/lux-shell.css');
        const html = readSource('lms.html');
        expect(shellCss).toMatch(
            /@media \(min-width: 1181px\)[\s\S]*body\.lux-unified-shell #app-content[\s\S]*margin-left:\s*0/
        );

        expect(html).not.toContain('ensureLmsDesktopSidebarOverlayDefaults');
        expect(html).not.toContain('bindLmsDesktopSidebarOverlayDismiss');
        expect(html).not.toContain('closeLmsDesktopSidebarOverlay');
    });
});