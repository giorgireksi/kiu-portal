import { describe, expect, it } from 'vitest';
import { expectRetiredCss } from './helpers/bare-shell-css.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (typeof existsSync === 'function' && !existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('admin tools interaction safety', () => {
    it('uses global unified-shell overlay instead of admin-tools desktop push offsets', () => {
        expectRetiredCss('admin-tools-luxury.css');
        const shellCss = readSource('assets/css/lux-shell.css');

        expect(shellCss).toMatch(
            /@media \(min-width: 1181px\)[\s\S]*body\.lux-unified-shell #app-content[\s\S]*margin-left:\s*0/
        );
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
        expect(alignment).not.toContain('function getStripMarkup');
        expect(alignment).not.toContain('function renderStrip');
        expect(alignment).not.toContain('lux-admin-tools-index-summary');
        expect(alignment).not.toContain('lux-strip-grid lux-strip-grid--adaptive lux-admin-tools-index-strip');
        expect(alignment).toContain('function removeLegacyStrip');
        expect(alignment).toContain('getActiveRegistrationLane(page)');
        expect(alignment).toContain('Four linked control zones');
    });
});
