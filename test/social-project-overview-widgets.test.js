import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social project overview widgets', () => {
    it('uses a 2-column Work | Team layout without plan-column widgets', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const _wsClassic = readSource('assets/js/pages/social-workspace.js');
        const classicBlock = (() => { const a = _wsClassic.indexOf('function renderProjectsWorkspacePanelClassic'); const b = _wsClassic.indexOf('window.renderProjectsWorkspacePanelClassic =', a); return a >= 0 && b > a ? _wsClassic.slice(a, b) : ''; })();
        const overviewBlock = (() => {
            const a = classicBlock.indexOf('const renderOverviewTab');
            const b = classicBlock.indexOf('const renderTeamTab', a + 1);
            return a >= 0 ? classicBlock.slice(a, b > a ? b : undefined) : '';
        })();
        expect(overviewBlock).toContain('social-project-overview-columns--2');
        expect(overviewBlock).toContain('social-project-overview-col--work');
        expect(overviewBlock).toContain('social-project-overview-col--team');
        expect(overviewBlock).not.toContain('social-project-overview-col--plan');
        expect(overviewBlock).not.toContain('social-project-overview-columns--3');
        expect(overviewBlock).not.toContain('renderDeadlineTracker(activeProject)');
        expect(overviewBlock).not.toContain('renderRecentFiles(activeProject)');
        expect(overviewBlock).not.toContain('renderNextMeeting(activeProject)');
        expect(overviewBlock).toContain('renderTaskDependencyGraphPreview(activeProject, runtime)');
        expect(overviewBlock).toContain('renderTaskStatusChart(activeProject)');
        expect(classicBlock).toContain('Task status distribution');
        expect(overviewBlock).toContain('renderWorkloadChart(activeProject)');
        expect(overviewBlock).toContain('renderActivityFeed(activeProject)');
        expect(overviewBlock).not.toContain('renderTaskStatusDonut(activeProject)');
        expect(overviewBlock).not.toContain('social-project-overview-stats-card');
        expect(overviewBlock).not.toContain('social-project-ov-row--charts');
        expect(overviewBlock).not.toContain('renderSparkline(activeProject');
    });

    it('provides a responsive 2-column overview grid with mobile order classes', () => {
        const css = readSource('assets/css/social-projects-lms.css');
        expect(css).toContain('.social-project-overview-columns--2');
        expect(css).toMatch(/social-project-overview-columns--2[\s\S]*?grid-template-columns: minmax\(320px, 1\.3fr\) minmax\(260px, 0\.9fr\)/);
        expect(css).toContain('.social-project-ov-order-1');
        expect(css).toContain('.social-project-ov-order-11');
        expect(css).toContain('.social-project-overview-slot');
        expect(css).toContain('.social-project-overview-slot__scroll');
        // Active layout is --2; --3 may remain as residual CSS but must not be the sole rule.
        expect(css).toMatch(/social-project-overview-columns--2[\s\S]*?grid-template-columns/);
        expect(css).toContain('.social-project-overview-columns--2 .social-project-overview-col');
    });

    it('limits quick actions to four primary buttons with a More actions overflow menu', () => {
        const _wsClassic = readSource('assets/js/pages/social-workspace.js');
        const classicBlock = (() => {
            const a = _wsClassic.indexOf('function renderProjectsWorkspacePanelClassic');
            const b = _wsClassic.indexOf('window.renderProjectsWorkspacePanelClassic =', a);
            return a >= 0 && b > a ? _wsClassic.slice(a, b) : '';
        })();
        const quickActionsBlock = (() => {
            const start = classicBlock.indexOf('const renderQuickActions = (project, options = {}) => {');
            if (start < 0) return '';
            const marker = String.fromCharCode(10) + '        const ';
            const next = classicBlock.indexOf(marker, start + 10);
            return classicBlock.slice(start, next > start ? next : undefined);
        })();
        const overviewBlock = (() => {
            const a = classicBlock.indexOf('const renderOverviewTab');
            const b = classicBlock.indexOf('const renderTeamTab', a + 1);
            return a >= 0 ? classicBlock.slice(a, b > a ? b : undefined) : '';
        })();
        expect(quickActionsBlock).toContain('options?.compact');
        expect(quickActionsBlock).toContain('More actions');
        expect(overviewBlock).toContain('renderQuickActions(activeProject, { compact: true, limit: 4');
        expect(overviewBlock).toContain('social-project-overview-slot');
        expect(overviewBlock).toContain('social-project-overview-brief');
    });
});
