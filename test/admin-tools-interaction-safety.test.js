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

    it('updates registration panes incrementally and scopes expensive runtime work', () => {
        const cms = readSource('assets/js/pages/admin-registration-cms-runtime.js');
        const registration = readSource('assets/js/pages/admin-registration.js');
        const visualRuntime = readSource('assets/js/features/luxury-index-runtime.js');
        const state = readSource('assets/js/app/state.js');

        expect(cms).toContain('The module list is unchanged');
        expect(registration).toContain('Keep the existing module list and update only the selected row plus pane.');
        expect(visualRuntime).toContain('const observerRoot = document.body.classList.contains(\'lux-route-admin-tools\')');
        expect(visualRuntime).toContain('adminToolsRoot && !adminToolsRoot.contains(node)');
        expect(state).toContain('adminRegistrationPendingScrollSnapshot');
        expect(state).toContain('adminRegistrationScrollRestoreFrame');
    });

    it('keeps admin tools shell chrome from caching blank nav or repainting alignment endlessly', () => {
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');
        const alignment = readSource('assets/js/pages/admin-tools-index-alignment.js');

        expect(shellChrome).toContain('function getFallbackNavGroups(role)');
        expect(shellChrome).toContain('const configuredGroups = navByRole[role] || navByRole.student || [];');
        expect(shellChrome).toContain('const groups = configuredGroups.length ? configuredGroups : getFallbackNavGroups(role);');
        expect(shellChrome).toContain("navRoot.dataset.renderSignature = '';");
        expect(shellChrome).toContain('if (navRoot.dataset.renderSignature === signature && navRoot.children.length) return;');

        expect(alignment).toContain("document.getElementById('lux-admin-tools-shell')");
        expect(alignment).toContain('new MutationObserver(queueSync)');
        expect(alignment).toContain("observe(root, { childList: true, subtree: true })");
        expect(alignment).toContain("remove('lux-admin-tools-index-panel')");
        expect(alignment).toContain('clearPresentationalInlineStyle');
        expect(alignment).toContain("getElementById('lux-admin-tools-index-hero')?.remove()");
        expect(alignment).toContain("getElementById('lux-admin-tools-index-strip')?.remove()");
        expect(alignment).not.toContain('function getAlignmentSignature');
        expect(alignment).not.toContain('function getStripMarkup');
        expect(alignment).not.toContain('function renderStrip');
        expect(alignment).not.toContain('function renderHero');
        expect(alignment).not.toContain('Four linked control zones');
        expect(alignment).not.toContain('lux-admin-tools-index-summary');
    });
});
