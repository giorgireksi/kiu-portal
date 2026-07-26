const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('students admin route regressions.test', () => {
    it('bare shell: no luxury/surfaces paint sheets; flat bare CSS', () => {
        const html = readSource('students-admin.html');
        expect(html).toContain('lux-shell.css');
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).not.toMatch(/lux-page-bare\.css(?!-lite)/);
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).toMatch(/class="[^"]*lux-page-bare/);
        // Must not load the shared luxury paint sheet (looks like full design if present)
        expect(html).not.toMatch(/href=["'][^"']*index-luxury\.css/);
        expect(html).not.toMatch(/href=["'][^"']*lux-surfaces\.css/);
        expect(existsSync(join(process.cwd(), 'assets/css', 'students-admin-lms.css'))).toBe(false);
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('body.lux-page-bare');
        expect(bare).not.toContain('backdrop-filter: none');
        const shell = readSource('assets/css/lux-shell.css');
        expect(shell).toContain('body.lux-page-bare .lux-page-shell');
        expect(shell).not.toContain('body.lux-page-bare .lux-page-shell :is(.page-hero, .lux-panel, .lux-alert)');
    });

    it('eager-loads student form builder with student namespace (not staff data attrs)', () => {
        const html = readSource('students-admin.html');
        const builderJs = readSource('assets/js/pages/form-builder-runtime.js');
        const studentsJs = readSource('assets/js/pages/students-command-center.js');
        const actionsJs = readSource('assets/js/pages/form-builder-actions-runtime.js');
        expect(html).toContain('student-form-builder-runtime.js');
        expect(html).toContain('form-builder-runtime.js');
        expect(html).toContain('form-builder-actions-runtime.js');
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('.students-hub-builder-layout');
        expect(bare).toContain('.students-hub-form-settings-head');
        expect(bare).toContain('.students-hub-directory-panel');
        expect(bare).toContain('.students-hub-controls-head');
        const directoryJs = readSource('assets/js/pages/directory-filters-runtime.js');
        expect(directoryJs).toContain('${H.hub}-command-bar');
        expect(directoryJs).toContain('${H.hub}-section-copy');
        expect(builderJs).toContain("data-${H.data}-builder-action");
        expect(actionsJs).toContain("'__studentFormBuilderBound'");
        expect(studentsJs).toContain('__studentFormBuilderBound');
        expect(studentsJs).toContain("__KIU_FORM_BUILDER_NS__ = 'student'");
    });
});
