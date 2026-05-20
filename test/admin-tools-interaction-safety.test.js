import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('admin tools interaction safety', () => {
    it('keeps the standalone admin-tools workspace offset from the luxury sidebar on desktop', () => {
        const css = readSource('assets/css/admin-tools-luxury.css');

        expect(css).toContain('body.lux-route-admin-tools #app-content {');
        expect(css).toContain('margin-left: var(--lux-sidebar-width) !important;');
        expect(css).toContain('width: calc(100% - var(--lux-sidebar-width)) !important;');
    });

    it('keeps admin registration tabs compatible with data-driven tab buttons', () => {
        const source = readSource('assets/js/pages/admin-registration.js');

        expect(source).toContain('const tabRouteTarget = String(');
        expect(source).toContain("tab.dataset?.target");
        expect(source).toContain("tab.dataset?.adminToolsRegTab");
        expect(source).toContain("tab.getAttribute('data-target')");
        expect(source).toContain("tab.getAttribute('data-admin-tools-reg-tab')");
        expect(source).toContain("tabRouteTarget === tabTarget");
    });
});
