import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social project task views', () => {
    it('uses LMS-style Work Desk packaged list', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const _wsClassic = readSource('assets/js/pages/social-workspace.js');
        const classicBlock = (() => { const a = _wsClassic.indexOf('function renderProjectsWorkspacePanelClassic'); const b = _wsClassic.indexOf('window.renderProjectsWorkspacePanelClassic =', a); return a >= 0 && b > a ? _wsClassic.slice(a, b) : ''; })();
        const tasksTabBlock = (() => { const start = classicBlock.indexOf('const renderTasksTab = () => {'); if (start < 0) return ''; let depth = 0; for (let i = start; i < classicBlock.length; i++) { const ch = classicBlock[i]; if (ch === '{') depth += 1; else if (ch === '}') { depth -= 1; if (depth === 0) return classicBlock.slice(start, i + 1); } } return ''; })();
        const css = readSource('assets/css/social-projects-lms.css');

        expect(tasksTabBlock).toContain('spt-desk');
        expect(tasksTabBlock).toContain('spt-desk-focus');
        expect(tasksTabBlock).toContain('spt-desk-package');
        expect(tasksTabBlock).toContain('renderDeskTaskTreeForest');
        expect(readSource('assets/js/pages/social-workspace.js')).toContain('function renderProjectTaskDeskCard');
        expect(tasksTabBlock).toContain('orderDeskTasksByDependency');
        expect(tasksTabBlock).toContain('resolveDeskTaskReadiness');
        expect(tasksTabBlock).toContain("['ready', 'Ready'");
        expect(tasksTabBlock).toContain("['week', 'Due 7d'");
        expect(tasksTabBlock).toContain('renderSectionStats');
        expect(readSource('assets/js/pages/social-workspace.js')).toContain('spt-desk-row');
        expect(classicBlock).toContain('spt-desk-hygiene-bar');
        expect(classicBlock).toContain('spt-desk-health');
        expect(source).toContain('project-task-time-window');
        expect(classicBlock).toContain('applyTimeWindow');
        expect(source).toContain('readDeskSavedViews');
        expect(classicBlock).toContain('spt-desk-views');
        expect(classicBlock).toContain('spt-desk-more-filters');
        expect(source).toContain('project-task-desk-link-start');
        expect(source).toContain('project-task-desk-link-pick');
        expect(source).toContain('function refreshProjectTasksTabPane');
        expect(source).toContain('function refreshProjectTasksTabBody');
        expect(source).toContain('function ensureProjectTaskGraphPositionForTask');
        expect(source).toContain('refreshDeskAfterGraphMembership');
        expect(source).toContain('data-task-body-root');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain("classList.toggle('is-collapsed'");
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain("openDialog('project-task-detail'");
        expect(source).toContain('function renderProjectTaskDetailModal');
        expect(readSource('assets/js/pages/social-workspace.js')).toContain('function renderProjectTaskDetailModal');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain("refreshProjectTasksTabPane('project-task-move')");
        expect(source).not.toContain('project-task-desk-peek');
        expect(source).not.toContain('spt-desk-row-expand');
        // Dense ops chrome removed from default rows
        expect(source).not.toContain('spt-desk-status-row');
        expect(source).not.toContain('spt-desk-col-signal');
        expect(source).not.toContain('spt-desk-package-metrics');
        expect(source).not.toContain('social-project-task-board--kanban');

        expect(css).toContain('padding: 0 !important');
        expect(css).toContain('.spt-desk-card.spt-desk-row.is-detail-open');
        expect(css).toContain('.spt-desk-colhead');
        expect(css).toContain('--spt-col-status');
        expect(css).toContain('spt-desk-toolbar--lms');
        expect(css).toContain('.spt-desk-hygiene-bar');
    });

    it('styles LMS desk list, tree, and filters', () => {
        const css = readSource('assets/css/social-projects-lms.css');
        expect(css).toContain('.social-project-task-list-table');
        expect(css).toContain('.social-project-task-deps-chip');
        expect(css).toContain('.spt-desk-tree-toggle');
        expect(css).toContain('.spt-desk-focus-track');
        expect(css).toContain('.spt-desk-queue');
        expect(css).toContain('.spt-desk-health');
        expect(css).toContain('.spt-desk-window');
        expect(css).toContain('.spt-desk-views');
        expect(css).toContain('.spt-desk-link-banner');
        expect(css).toContain('.spt-desk-more-filters');
        expect(css).toContain('.spt-desk-status-chip[data-signal="ready"]');
        const rebuild = readSource('assets/css/social-rebuild.css');
        expect(rebuild).toContain('is-tab-reveal');
        expect(rebuild).toContain('is-desk-refreshing');
    });
});
