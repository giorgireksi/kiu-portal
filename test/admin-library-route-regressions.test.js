import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('admin-library route regressions', () => {
    it('keeps the shell free of dead imports and inline handlers', () => {
        const html = readSource('admin-library.html');
        const css = readSource('assets/css/admin-library-route.css');

        expect(html).not.toContain('assets/js/shared/messenger.js');
        expect(html).not.toContain('assets/js/pages/gradebook.js');
        expect(html).not.toContain('assets/js/pages/lms.js');
        expect(html).not.toContain('assets/js/pages/registration.js');
        expect(html).not.toContain('assets/js/pages/planner.js');
        expect(html).not.toContain('assets/js/pages/directories.js');
        expect(html).not.toContain('assets/js/pages/student-registration.js');
        expect(html).not.toContain('assets/js/pages/admin-registration.js');
        expect(html).not.toContain('onclick=');
        expect(html).not.toContain('oninput=');
        expect(html).not.toContain('onchange=');
        expect(html).not.toContain('setInterval(');
        expect(html).not.toContain('Ãƒ');
        expect(html).toContain('<nav id="prof-nav" aria-label="Professor navigation stub"');
        expect(html).toContain('<nav id="top-nav" aria-label="Top navigation stub"');
        expect(html).toContain('<nav id="admin-nav" aria-label="Admin navigation stub"');
        expect(html).toContain('<div class="lux-picker-field library-picker-field">');
        expect(html).not.toContain('<label class="lux-picker-field library-picker-field">\r\n                    <span class="lux-picker-label library-picker-label">Topic</span>');
        expect(html).toContain('<button class="mob-sheet-btn" type="button" id="mob-act-admin"><span class="mob-sheet-icon"');
        expect(html).not.toContain('<button class="mob-sheet-btn" id="mob-act-admin"><div class="mob-sheet-icon"');
        expect(html).toContain('data-admin-library-nav-home="true"');
        expect(html).toContain('data-admin-library-open-params="true"');
        expect(html).toContain('data-admin-library-add-book="true"');
        expect(html).toContain('data-admin-library-search="query"');
        expect(html).toContain('data-admin-library-picker-field="topic"');
        expect(html).toContain('data-admin-library-modal-overlay="true"');
        expect(html).toContain("event.target.closest('[data-admin-library-remove-param]')");
        expect(html).toContain("button.dataset.adminLibraryRemoveParam = 'true'");
        expect(html).toContain('renderAdminLibraryChipGroup');
        expect(html).toContain('createAdminLibraryCatalogRow');
        expect(html).toContain('renderAdminLibraryEmptyStateRow');
        expect(html).toContain('window.__KIU_STANDALONE_MOBILE_SHELL_CONFIG = {');
        expect(html).toContain("activeTarget: 'library'");
        expect(html).toContain('assets/js/pages/standalone-mobile-shell.js?v=20260520-admin-library-mobile1');
        expect(html).not.toContain('(function initMobileExperience(){');
        expect(html).toContain('assets/js/features/navigation.js?v=20260429-shellinit1');
        expect(html).toContain('assets/js/features/ui.js?v=20260429-peopleisolation1');
        expect(html).toContain('assets/js/features/index-luxury.js?v=20260504-transparency-refresh1');
        expect(css).toContain("body[data-lux-performance='efficient'].lux-route-admin-library .adlib-table {");
        expect(css).toContain("body[data-lux-performance='efficient'].lux-route-admin-library .adlib-modal-overlay {");
        expect(css).toContain('backdrop-filter: blur(8px);');
        expect(css).toContain("body[data-lux-performance='efficient'].lux-route-admin-library.lux-route-library .content-box.surface-card.library-catalog-card {");
    });
});
