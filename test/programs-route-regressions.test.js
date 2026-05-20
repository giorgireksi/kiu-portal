import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('programs route regressions', () => {
    it('keeps programs free of dead social/page-pack imports and polling-based boot waits', () => {
        const html = readSource('programs.html');
        const programsPage = readSource('assets/js/pages/programs-page.js');
        const navigation = readSource('assets/js/features/navigation.js');

        expect(html).not.toContain('assets/js/shared/social-hub.js');
        expect(html).not.toContain('assets/js/shared/social-render.js');
        expect(html).not.toContain('assets/js/shared/social-media.js');
        expect(html).not.toContain('assets/js/shared/messenger.js');
        expect(html).not.toContain('assets/js/pages/gradebook.js');
        expect(html).not.toContain('assets/js/pages/lms.js');
        expect(html).not.toContain('assets/js/pages/planner.js');
        expect(html).not.toContain('assets/js/pages/directories.js');
        expect(html).not.toContain('assets/js/pages/student-registration.js');
        expect(html).not.toContain('assets/js/pages/admin-registration.js');
        expect(html).not.toContain('assets/js/pages/registration.js');
        expect(html).toContain('assets/js/pages/programs-page.js?v=20260515-programs-page1');
        expect(html).toContain('id="programs-hero-title"');
        expect(html).toContain('id="programs-hero-copy"');
        expect(html).toContain('id="programs-hero-faculty-badge"');
        expect(html).toContain('id="student-program-semester-filter"');
        expect(html).toContain('id="student-program-search"');
        expect(html).toContain('id="student-program-search-clear"');
        expect(html).toContain('id="student-program-filter-note"');
        expect(html).toContain('data-programs-search="1"');
        expect(html).toContain('data-programs-semester-filter="1"');
        expect(html).toContain('data-programs-clear-search="1"');
        expect(html).toContain("function ensureProgramsNavigateHooks(){if(typeof window.navigate!=='function')return false;hookProgramsNavigationVisualSync();return true}");
        expect(html).toContain("window.addEventListener('load', ensureProgramsNavigateHooks, {once:true});");
        expect(html).toContain("function ensureNavigateHooks(){if(typeof window.navigate!=='function')return false;hookNav();buildRoleNav();return true}");
        expect(html).toContain("window.addEventListener('load',ensureNavigateHooks,{once:true});");
        expect(html).not.toContain('setInterval(function(){if(typeof window.navigate===');
        expect(html).not.toContain('programsNavigationHookTimer');
        expect(html).not.toContain('Boot Curriculum Library view on standalone load');
        expect(programsPage).toContain('window.studentEducationalProgramUiState = window.studentEducationalProgramUiState || {');
        expect(programsPage).toContain('function renderStudentEducationalProgramPage()');
        expect(programsPage).toContain('window.renderStudentEducationalProgramPage = renderStudentEducationalProgramPage;');
        expect(programsPage).toContain('function bindProgramsPageDelegates()');
        expect(programsPage).toContain('function ensureProgramsContentShell(root)');
        expect(programsPage).toContain('function renderProgramsOverviewRegion(context)');
        expect(programsPage).toContain('function renderProgramsModuleRailRegion(context)');
        expect(programsPage).toContain('function renderProgramsSubjectPanelRegion(context)');
        expect(programsPage).toContain('programs-overview-region');
        expect(programsPage).toContain('programs-module-rail-region');
        expect(programsPage).toContain('programs-subject-panel-region');
        expect(programsPage).toContain('overviewRegion.innerHTML = renderProgramsOverviewRegion(renderContext);');
        expect(programsPage).toContain('moduleRailRegion.innerHTML = renderProgramsModuleRailRegion(renderContext);');
        expect(programsPage).toContain('function renderProgramsSubjectPanelLoadingRegion(context)');
        expect(programsPage).toContain('function scheduleProgramsSubjectPanelRender(context, region)');
        expect(programsPage).toContain('window.requestIdleCallback');
        expect(programsPage).toContain('scheduleProgramsSubjectPanelRender(renderContext, subjectPanelRegion);');
        expect(programsPage).not.toContain('heroMetaEl.innerHTML');
        expect(programsPage).not.toContain('filterShell.innerHTML');
        expect(programsPage).not.toContain('before registration.');
        expect(programsPage).not.toContain('live subject counts from the Curriculum Library.');
        expect(programsPage).toContain('data-programs-semester=');
        expect(programsPage).toContain('data-programs-module-radio=');
        expect(programsPage).not.toContain('onclick=');
        expect(programsPage).not.toContain('oninput=');
        expect(programsPage).not.toContain('onchange=');
        expect(navigation).toContain("const STANDALONE_REGISTRATION_RUNTIME_GUARDS = {");
        expect(navigation).toContain("'programs': () => typeof window.renderStudentEducationalProgramPage === 'function'");
    });
});
