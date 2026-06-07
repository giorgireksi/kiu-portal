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

    it('keeps admin tools shell chrome from caching blank nav or repainting alignment endlessly', () => {
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');
        const alignment = readSource('assets/js/pages/admin-tools-index-alignment.js');

        expect(shellChrome).toContain('function getFallbackNavGroups(role)');
        expect(shellChrome).toContain('const configuredGroups = navByRole[role] || navByRole.student || [];');
        expect(shellChrome).toContain('const groups = configuredGroups.length ? configuredGroups : getFallbackNavGroups(role);');
        expect(shellChrome).toContain("navRoot.dataset.renderSignature = '';");
        expect(shellChrome).toContain('if (navRoot.dataset.renderSignature === signature && navRoot.children.length) return;');

        expect(alignment).toContain('function getAlignmentSignature(page)');
        expect(alignment).toContain('if (page.dataset.adminToolsIndexSignature !== signature) {');
        expect(alignment).toContain('page.dataset.adminToolsIndexSignature = getAlignmentSignature(page);');
        expect(alignment).toContain("document.getElementById('lux-admin-tools-shell')");
        expect(alignment).toContain('observer.observe(observerRoot, { childList: true, subtree: true });');
    });
});
