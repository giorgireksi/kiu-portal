import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social project hub structure', () => {
    it('renders a 3-column discovery hub with scope chips and context rail', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const _wsClassic = readSource('assets/js/pages/social-workspace.js');
        const classicBlock = (() => { const a = _wsClassic.indexOf('function renderProjectsWorkspacePanelClassic'); const b = _wsClassic.indexOf('window.renderProjectsWorkspacePanelClassic =', a); return a >= 0 && b > a ? _wsClassic.slice(a, b) : ''; })();

        expect(classicBlock).toContain('social-neo-workspace-shell--merged');
        expect(classicBlock).toContain('sectionsHtml:');
        expect(classicBlock).toContain('social-project-hub-layout');
        expect(classicBlock).toContain('social-project-hub-filter-group');
        expect(classicBlock).toContain('social-project-hub-main');
        expect(classicBlock).toContain('social-project-hub-rail');
        expect(classicBlock).toContain('data-action="project-hub-scope"');
        expect(classicBlock).toContain("['mine', 'Mine']");
        expect(classicBlock).toContain("['faculty', 'Faculty']");
        expect(classicBlock).toContain("['all', 'All']");
        expect(classicBlock).toContain("['attention', 'Needs attention']");
        expect(classicBlock).not.toContain("['recruiting', 'Recruiting']");
        expect(classicBlock).toContain('projectNeedsMyAttention');
        expect(classicBlock).toContain('data-action="project-hub-view"');
        expect(classicBlock).toContain('data-action="project-hub-status"');
        expect(classicBlock).toContain('data-action="project-hub-skill"');
        expect(classicBlock).toContain('data-action="project-hub-open-task"');
        expect(classicBlock).toContain('My Work');
        expect(classicBlock).toContain('My projects');
        expect(classicBlock).toContain('Recently active');
        expect(classicBlock).toContain('name="projectDiscoverSearch"');
        expect(classicBlock).toContain('projectHubScope');
        expect(classicBlock).toContain('projectHubViewMode');
        expect(classicBlock).toContain('projectHubStatus');
        expect(classicBlock).toContain('social-project-card-role');
        expect(classicBlock).toContain('skillTags');
        // Faculty select is independent of scope: All faculties option + filter when !== 'all'
        expect(classicBlock).toContain("const hubFacultyOptions = ['all'");
        expect(classicBlock).toContain("code === 'all' ? 'All faculties'");
        expect(classicBlock).toContain("discoverFaculty !== 'all'");
        expect(classicBlock).toContain('matchesHubFaculty');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain("action === 'project-hub-scope'");
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain("action === 'project-hub-open-task'");
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain("scope === 'recruiting'");
        expect(source).toContain("text(ui.projectHubScope || 'mine')");
        expect(source).toContain("text(ui.projectHubViewMode || 'grid')");
        expect(source).toContain("text(ui.projectHubStatus || 'all')");
        expect(source).toContain('Course group projects');
        const workspaceModule = readSource('assets/js/pages/social-workspace.js');
        expect(workspaceModule).toContain('Create workspace');
        expect(classicBlock).toContain('data-action="project-create-open"');
    });

    it('styles hub layout with responsive stacking', () => {
        const css = readSource('assets/css/social-projects-lms.css');
        expect(css).toContain('.social-project-hub-layout');
        expect(css).toContain('.social-project-hub-filters');
        expect(css).toContain('.social-project-hub-main');
        expect(css).toContain('.social-project-hub-rail');
        expect(css).toContain('.social-project-hub-grid');
        expect(css).toContain('.social-project-hub-my-work');
        expect(css).toMatch(/social-project-hub-layout[\s\S]*?grid-template-columns/);
        expect(css).toMatch(/@media \(max-width: 760px\)[\s\S]*?social-project-hub-layout[\s\S]*?grid-template-columns: 1fr/);
    });
});
