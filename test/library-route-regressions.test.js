import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('library route regressions', () => {
    it('keeps library as a real standalone route with its own shell bootstrap', () => {
        const html = readSource('library.html');
        const indexHtml = readSource('index.html');
        const pageScript = readSource('assets/js/pages/library.js');
        const appSource = readSource('assets/js/app/app.js');
        const navigationSource = readSource('assets/js/features/navigation.js');
        const sharedCss = readSource('assets/css/index-luxury.css');

        expect(indexHtml).toContain('id="page-library"');
        expect(appSource).toContain("const LIBRARY_RUNTIME_SCRIPT = 'assets/js/pages/library.js?v=20260518-libraryshell1';");
        expect(appSource).toContain('window.ensurePortalLibraryRuntimeLoaded = function ensurePortalLibraryRuntimeLoaded()');
        expect(navigationSource).toContain('const PORTAL_STANDALONE_ROUTE_IDS = new Set([');
        expect(navigationSource).toContain("'library'");

        expect(html).toContain('id="page-library"');
        expect(html).toContain('assets/js/pages/library.js?v=20260518-libraryshell1');
        expect(html).toContain('assets/js/features/navigation.js?v=20260429-shellinit1');
        expect(html).toContain('bootStandaloneLibraryPage');
        expect(html).not.toContain("window.location.replace(target);");
        expect(html).not.toContain('assets/js/shared/social-hub.js');
        expect(html).not.toContain('assets/js/shared/social-render.js');
        expect(html).not.toContain('assets/js/shared/social-media.js');
        expect(html).not.toContain('assets/js/shared/messenger.js');
        expect(html).not.toContain('assets/js/pages/gradebook.js');
        expect(html).not.toContain('assets/js/pages/lms.js');
        expect(html).not.toContain('assets/js/pages/registration.js');
        expect(html).not.toContain('assets/js/pages/planner.js');
        expect(html).not.toContain('assets/js/pages/directories.js');
        expect(html).not.toContain('assets/js/pages/student-registration.js');
        expect(html).not.toContain('assets/js/pages/admin-registration.js');
        expect(html).not.toContain('window.__KIU_STANDALONE_MOBILE_SHELL_CONFIG = {');
        expect(html).not.toContain('assets/js/pages/standalone-mobile-shell.js?v=20260518-standalone-shell1');
        expect(html).not.toContain('data-library-search-field="query"');
        expect(html).not.toContain('data-library-picker-field="topic"');
        expect(html).not.toContain('setInterval(');

        expect(pageScript).toContain('const LIBRARY_PAGE_SHELL_MARKUP = `');
        expect(pageScript).toContain('library-page-hero lux-summary-surface lux-summary-surface--hero');
        expect(pageScript).toContain('library-catalog-card lux-summary-surface lux-summary-surface--panel');
        expect(pageScript).toContain('function ensureLibraryPageShell()');
        expect(pageScript).toContain('function renderLibraryPageShellContext()');
        expect(pageScript).toContain('function renderLibraryPage()');
        expect(pageScript).toContain('function ensureSharedLibraryState()');
        expect(pageScript).toContain('function renderSharedLibraryCatalog()');
        expect(pageScript).toContain('root.innerHTML = LIBRARY_PAGE_SHELL_MARKUP;');
        expect(pageScript).toContain("window.renderLibraryPageShellContext = renderLibraryPageShellContext;");
        expect(pageScript).toContain("window.renderLibraryPage = renderLibraryPage;");
        expect(pageScript).toContain("window.renderSharedLibraryCatalog = renderSharedLibraryCatalog;");
        expect(pageScript).toContain('function createLibraryRow(book, index)');
        expect(pageScript).toContain('function createLibraryPickerOption(field, option, currentValue)');
        expect(pageScript).toContain('function createLibrarySelectOption(value, label)');
        expect(pageScript).toContain('tbody.replaceChildren(fragment);');
        expect(pageScript).toContain('panel.replaceChildren(fragment);');
        expect(pageScript).toContain('el.replaceChildren(fragment);');
        expect(pageScript).toContain('function renderLibraryEmptyState(tbody)');
        expect(pageScript).toContain("renderLibraryPicker(field, options, defaultLabel);");
        expect(sharedCss).toContain('.lux-summary-surface');
        expect(sharedCss).toContain('.lux-summary-surface--hero');
        expect(sharedCss).toContain('.lux-summary-surface--panel');
    });
});
