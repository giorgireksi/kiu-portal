import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function readRegisteredChunk(relativePath, registrationName) {
    const source = readSource(relativePath);
    const pattern = new RegExp(`${registrationName}\\('([^']+)'\\)`);
    const match = source.match(pattern);

    if (!match) {
        throw new Error(`Registration payload ${registrationName} was not found in ${relativePath}.`);
    }

    return Buffer.from(match[1], 'base64').toString('utf8');
}

describe('admin-tools route regressions', () => {
    it('keeps admin-tools route styling scoped and efficient-tier safe', () => {
        const html = readSource('admin-tools.html');
        const css = readSource('assets/css/admin-tools-luxury.css');
        const luxury = readSource('assets/js/features/index-luxury.js');
        const adminToolsBundle = readRegisteredChunk('assets/js/features/index-admin-tools.js', '__kiuRegisterLuxuryAdminToolsChunk');
        const registration = readSource('assets/js/pages/registration.js');
        const adminRegistration = readSource('assets/js/pages/admin-registration.js');
        const planner = readSource('assets/js/pages/planner.js');

        expect(html).toContain('assets/css/admin-tools-luxury.css');
        expect(html).toContain('assets/js/features/index-admin-tools.js?v=20260517-admintoolsjssplit1');
        expect(html).not.toContain('assets/js/pages/lms.js');
        expect(html).not.toContain('assets/js/pages/student-registration.js');
        expect(html).not.toContain('Ãƒ');
        expect(html).not.toContain('onclick=');
        expect(html).not.toContain('setInterval(');
        expect(html).not.toContain('<style>');
        expect(html).toContain('window.__KIU_STANDALONE_MOBILE_SHELL_CONFIG = {');
        expect(html).toContain("activeTarget: 'admin-tools'");
        expect(html).toContain('assets/js/pages/standalone-mobile-shell.js?v=20260520-admin-tools-mobile1');
        expect(html).not.toContain('(function initMobileExperience(){');
        expect(css).not.toContain('Ã¢');
        expect(css).not.toContain('transition: all');
        expect(css).not.toContain('body.lux-unified-shell .lux-primary-btn');
        expect(css).not.toContain('body.lux-unified-shell .lux-panel');
        expect(css).toContain('body.lux-unified-shell.lux-route-admin-tools .lux-primary-btn');
        expect(css).toContain('body.lux-unified-shell.lux-route-admin-tools .lux-panel');
        expect(css).toContain("body[data-lux-performance='efficient'].lux-route-admin-tools .modal-overlay {");
        expect(css).toContain("body[data-lux-performance='efficient'].lux-route-admin-tools #lux-admin-tools-shell .lux-admin-tools-page .lux-subcard,");
        expect(luxury).toContain('function ensureLuxuryAdminToolsBundle() {');
        expect(luxury).not.toContain('data-admin-tools-add-module="1"');
        expect(luxury).not.toContain('onclick="addCurriculumLibraryModule()"');
        expect(luxury).not.toContain('oninput="debouncedFilterSubjects(this.value)"');
        expect(luxury).not.toContain('onchange="toggleConditionBox()"');
        expect(luxury).not.toContain('onclick="addSubjectToSystem()"');
        expect(luxury).not.toContain('onclick="switchAdminRegTab(');
        expect(adminToolsBundle).toContain('data-admin-tools-add-module="1"');
        expect(adminToolsBundle).toContain('data-admin-tools-prereq-search="1"');
        expect(adminToolsBundle).toContain('data-admin-tools-toggle-condition="1"');
        expect(adminToolsBundle).toContain('data-admin-tools-save-subject="1"');
        expect(adminToolsBundle).toContain('data-admin-tools-reg-tab="prog"');
        expect(registration).not.toContain('onclick="addCurriculumLibraryModule()"');
        expect(registration).not.toContain('onchange="selectCurriculumLibraryModule(');
        expect(registration).not.toContain('onclick="editCurriculumLibraryModule(');
        expect(registration).not.toContain('onclick="deleteCurriculumLibraryModule(');
        expect(registration).not.toContain('onclick="focusCurriculumSubjectBuilder()"');
        expect(registration).toContain('data-curriculum-add-module="1"');
        expect(registration).toContain('data-curriculum-module-select=');
        expect(registration).toContain('data-curriculum-edit-module=');
        expect(registration).toContain('data-curriculum-delete-module=');
        expect(registration).toContain('data-curriculum-focus-builder="1"');
        expect(registration).toContain('data-curriculum-delete-subject=');
        expect(adminRegistration).toContain('function bindAdminRegistrationCmsDelegates()');
        expect(adminRegistration).toContain('bindAdminRegistrationCmsDelegates();');
        expect(adminRegistration).not.toMatch(/onclick=|oninput=|onchange=|onmouseover=|onmouseout=/);
        expect(adminRegistration).not.toContain('function renderAdminRegStructures(');
        expect(adminRegistration).not.toContain('function renderAdminRegModulesAdvanced(');
        expect(adminRegistration).not.toContain('function updateConcTable(');
        expect(adminRegistration).not.toContain('onclick="addNewAdminRegModule(\'prog\')"');
        expect(adminRegistration).not.toContain('onclick="addNewAdminRegModule(\'free\')"');
        expect(adminRegistration).not.toContain('onchange="selectProgModule(');
        expect(adminRegistration).not.toContain('onchange="selectFreeModule(');
        expect(adminRegistration).not.toContain('onclick="editProgSubModule(');
        expect(adminRegistration).not.toContain('onclick="editFreeSubModule(');
        expect(adminRegistration).toContain('data-admin-reg-add-module="prog"');
        expect(adminRegistration).toContain('data-admin-reg-add-module="free"');
        expect(adminRegistration).toContain('data-admin-reg-select-module=');
        expect(adminRegistration).toContain('data-admin-reg-module-tab="prog"');
        expect(adminRegistration).toContain('data-admin-reg-module-tab="free"');
        expect(adminRegistration).toContain('data-admin-reg-edit-module=');
        expect(adminRegistration).toContain('data-admin-reg-delete-module=');
        expect(adminRegistration).toContain('data-admin-reg-add-subject=');
        expect(adminRegistration).toContain('data-admin-reg-edit-submodule=');
        expect(adminRegistration).toContain('data-admin-reg-delete-submodule=');
        expect(adminRegistration).toContain('data-admin-reg-add-conc-program="1"');
        expect(adminRegistration).toContain('data-admin-reg-select-conc-program=');
        expect(adminRegistration).toContain('data-admin-reg-delete-conc-program=');
        expect(adminRegistration).toContain('data-admin-reg-add-conc-group=');
        expect(adminRegistration).toContain('data-admin-reg-toggle-conc-group=');
        expect(adminRegistration).toContain('data-admin-reg-edit-conc-group=');
        expect(adminRegistration).toContain('data-admin-reg-delete-conc-group=');
        expect(adminRegistration).toContain('data-admin-reg-add-conc-subject=');
        expect(adminRegistration).toContain('data-admin-reg-edit-conc-course=');
        expect(adminRegistration).toContain('data-admin-reg-delete-conc-course=');
        expect(adminRegistration).not.toContain('onclick="editConcGroup(');
        expect(adminRegistration).not.toContain('onclick="deleteConcGroup(');
        expect(adminRegistration).not.toContain('onclick="addSubjectToConcGroup(');
        expect(adminRegistration).not.toContain('onclick="editConcCourseName(');
        expect(adminRegistration).not.toContain('onclick="removeConcCourse(');
        expect(adminRegistration).toContain('data-admin-reg-add-minor-program="1"');
        expect(adminRegistration).toContain('data-admin-reg-select-minor-program=');
        expect(adminRegistration).toContain('data-admin-reg-delete-minor-program=');
        expect(adminRegistration).toContain('data-admin-reg-add-minor-group=');
        expect(adminRegistration).toContain('data-admin-reg-toggle-minor-group=');
        expect(adminRegistration).toContain('data-admin-reg-edit-minor-group=');
        expect(adminRegistration).toContain('data-admin-reg-delete-minor-group=');
        expect(adminRegistration).toContain('data-admin-reg-add-minor-subject=');
        expect(adminRegistration).toContain('data-admin-reg-edit-minor-course=');
        expect(adminRegistration).toContain('function loadAvailableSubjects()');
        expect(adminRegistration).not.toContain('function filterAndDisplaySubjects(');
        expect(adminRegistration).not.toContain('function addSelectedSubject(');
        expect((adminRegistration.match(/function renderFreeTab\(container, modules, tabType\)/g) || [])).toHaveLength(1);
        expect((adminRegistration.match(/function renderConcTab\(container, modules, tabType\)/g) || [])).toHaveLength(1);
        expect(planner).toContain('function bindAdminToolsPlannerDelegates()');
        expect(planner).not.toContain('onclick="refreshAdminSystemOpsDashboard(true)"');
        expect(planner).not.toContain('onclick="selectPaletteSubject(');
        expect(planner).toContain('data-admin-planner-refresh-system-ops="1"');
        expect(planner).toContain('data-admin-planner-palette-subject=');
        expect(planner).toContain('data-admin-planner-palette-name=');
    });
});
