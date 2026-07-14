import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social project task compose panel + sectioned modal', () => {
    it('renders modal trigger on the tasks tab instead of inline compose', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const _wsClassic = readSource('assets/js/pages/social-workspace.js');
        const classicBlock = (() => { const a = _wsClassic.indexOf('function renderProjectsWorkspacePanelClassic'); const b = _wsClassic.indexOf('window.renderProjectsWorkspacePanelClassic =', a); return a >= 0 && b > a ? _wsClassic.slice(a, b) : ''; })();

        expect(classicBlock).toContain('social-project-task-shell');
        const tasksTabBlock = (() => {
                    const start = classicBlock.indexOf('const renderTasksTab = () => {');
                    if (start < 0) return '';
                    let depth = 0;
                    for (let i = start; i < classicBlock.length; i++) {
                        const ch = classicBlock[i];
                        if (ch === '{') depth += 1;
                        else if (ch === '}') {
                            depth -= 1;
                            if (depth === 0) return classicBlock.slice(start, i + 1);
                        }
                    }
                    return '';
                })();
        expect(classicBlock).toContain('social-project-task-shell');
        expect(tasksTabBlock).toContain('social-project-task-shell-header');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('social-project-task-stats-inline');
        expect(tasksTabBlock).toContain('social-project-task-compose-trigger');
        expect(tasksTabBlock).toContain('social-project-task-shell-graph');
        expect(tasksTabBlock).toContain('renderTaskDependencyGraphPreview(activeProject, runtime)');
        expect(tasksTabBlock).not.toContain('social-project-task-shell-toolbar');
        expect(tasksTabBlock).not.toContain('social-project-task-shell-summary');
        expect(tasksTabBlock).not.toContain('Total, overdue, and status counts.');
        expect(classicBlock).toContain('project-task-create-open');
        expect(classicBlock).toContain('Create task');
        expect(classicBlock).not.toContain('data-form="project-task-create"');
        expect(classicBlock).not.toContain('mode: \'inline\'');
        expect(classicBlock).not.toContain('social-project-task-create-row');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain("openDialog('project-task-create'");
        expect(source).toContain('function renderProjectTaskCreateDialog');
        expect(readSource('assets/js/pages/social-workspace.js')).toContain('function renderProjectTaskCreateDialog');
    });

    it('opens the modal with column prefilled via quick-add', () => {
        const source = readSource('assets/js/pages/social-page.js');

        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain("action === 'project-task-quick-add'");
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toMatch(/if \(action === 'project-task-quick-add'\) \{[\s\S]*?openDialog\('project-task-create'[\s\S]*?defaultColumn: column/);
        expect(source).not.toContain('projectTaskComposerFocus');
    });

    it('uses sectioned modal layout and create-another submit mode', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const workspaceModule = readSource('assets/js/pages/social-workspace.js');

        expect(source).toContain('function renderProjectTaskFormFields');
        expect(workspaceModule).toContain('social-neo-dialog-body--project-task-create');
        expect(source).toContain('social-neo-dialog-project-create-section');
        expect(workspaceModule).toContain('data-submit-mode="create-another"');
        expect(readSource('assets/js/pages/social-render-plan.js')).toContain('projectTaskDialogReasons');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toMatch(/submitMode === 'create-another'/);
    });

    it('exposes compose trigger and wide modal CSS', () => {
        const projectsCss = readSource('assets/css/social-projects-lms.css');
        const rebuildCss = readSource('assets/css/social-rebuild.css');
        const portfolioCss = readSource('assets/css/portfolio-editor.css');
        const utilities = readSource('assets/js/shared/utilities.js');

        expect(projectsCss).toContain('.social-project-task-shell');
        expect(projectsCss).toContain('.social-project-task-shell-header');
        expect(projectsCss).toContain('.social-project-task-stats-inline');
        expect(projectsCss).toContain('.social-project-task-compose-trigger');
        expect(projectsCss).not.toContain('.social-project-task-create-row');
        expect(rebuildCss).toContain('.social-neo-dialog-card--project-task-create');
        expect(rebuildCss).toMatch(/social-neo-dialog-card--project-task-create[\s\S]*820px/);
        expect(rebuildCss).toContain('--portfolio-editor-surface');
        expect(portfolioCss).not.toMatch(/social-neo-dialog-card--project-task-create[\s\S]*padding:\s*0/);
        expect(utilities).toContain('.social-neo-dialog-card--project-task-create');
        expect(utilities).toContain('.social-neo-dialog-card--project-column-tasks');
        expect(utilities).toContain('.social-neo-dialog-card--project-task-detail');
        expect(utilities).toContain('.social-neo-dialog-card--project-task-delete');
    });

    it('uses graph-only Tasks tab and centered task detail modal', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const projectsCss = readSource('assets/css/social-projects-lms.css');
        const _wsClassic = readSource('assets/js/pages/social-workspace.js');
        const classicBlock = (() => { const a = _wsClassic.indexOf('function renderProjectsWorkspacePanelClassic'); const b = _wsClassic.indexOf('window.renderProjectsWorkspacePanelClassic =', a); return a >= 0 && b > a ? _wsClassic.slice(a, b) : ''; })();
        const tasksTabBlock = (() => {
                    const start = classicBlock.indexOf('const renderTasksTab = () => {');
                    if (start < 0) return '';
                    let depth = 0;
                    for (let i = start; i < classicBlock.length; i++) {
                        const ch = classicBlock[i];
                        if (ch === '{') depth += 1;
                        else if (ch === '}') {
                            depth -= 1;
                            if (depth === 0) return classicBlock.slice(start, i + 1);
                        }
                    }
                    return '';
                })();

        expect(tasksTabBlock).toContain('data-task-view="');
        expect(tasksTabBlock).toContain('social-project-task-shell-graph');
        expect(tasksTabBlock).toContain('renderTaskDependencyGraphPreview');
        expect(tasksTabBlock).not.toContain('social-project-task-board-track');
        expect(tasksTabBlock).not.toContain('social-project-task-board--kanban');
        expect(tasksTabBlock).not.toContain('social-project-task-lane-body');
        expect(tasksTabBlock).not.toContain('renderProjectTaskColumnList');
        expect(tasksTabBlock).not.toContain('social-project-task-droplist');
        expect(source).not.toContain('data-project-task-column-rail');
        expect(source).not.toContain('syncProjectTaskColumnScrollRails');
        expect(source).not.toContain('social-project-task-column-rail');
        expect(tasksTabBlock).not.toContain('renderProjectTaskDetailModal');
        expect(tasksTabBlock).not.toContain('renderProjectTaskDetailDrawer');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('project-task-detail-open');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain("openDialog('project-task-detail'");
        const workspaceModule = readSource('assets/js/pages/social-workspace.js');
        expect(workspaceModule).toContain('social-project-task-detail-description');
        expect(workspaceModule).toContain('data-lux-transparency-exempt="1"');
        expect(projectsCss).not.toContain('.social-project-task-column-rail');
        expect(workspaceModule).toContain('social-neo-dialog-card--project-task-detail');
    });

    it('opens column and task popups through the overlay dialog portal', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const projectsCss = readSource('assets/css/social-projects-lms.css');
        const rebuildCss = readSource('assets/css/social-rebuild.css');
        const _wsClassic = readSource('assets/js/pages/social-workspace.js');
        const classicBlock = (() => { const a = _wsClassic.indexOf('function renderProjectsWorkspacePanelClassic'); const b = _wsClassic.indexOf('window.renderProjectsWorkspacePanelClassic =', a); return a >= 0 && b > a ? _wsClassic.slice(a, b) : ''; })();
        const tasksTabBlock = (() => {
                    const start = classicBlock.indexOf('const renderTasksTab = () => {');
                    if (start < 0) return '';
                    let depth = 0;
                    for (let i = start; i < classicBlock.length; i++) {
                        const ch = classicBlock[i];
                        if (ch === '{') depth += 1;
                        else if (ch === '}') {
                            depth -= 1;
                            if (depth === 0) return classicBlock.slice(start, i + 1);
                        }
                    }
                    return '';
                })();
        const workspaceDialogs = source.match(/const WORKSPACE_DIALOG_KEEP_CENTER = new Set\(\[[\s\S]*?\]\);/)?.[0] || '';
        const columnModalBlock = (() => { const m = readSource('assets/js/pages/social-workspace.js'); const a = m.indexOf('function renderProjectColumnTasksModal'); const b = m.indexOf('\n    function ', a + 10); return a >= 0 ? m.slice(a, b > a ? b : undefined) : ''; })();
        const workspaceModule = readSource('assets/js/pages/social-workspace.js');
        const detailModalBlock = workspaceModule.match(/function renderProjectTaskDetailModal[\s\S]*?\n    \}/)?.[0] || '';
        const deleteModalBlock = workspaceModule.match(/function renderProjectTaskDeleteConfirmDialog[\s\S]*?\n    \}/)?.[0] || '';
        const createModalBlock = workspaceModule.match(/function renderProjectTaskCreateDialog[\s\S]*?\n    \}/)?.[0] || '';

        expect(source).not.toContain('function renderNeoEditorDialogShell');
        expect(readSource('assets/js/pages/social-workspace.js')).toContain('function renderProjectColumnTasksModal');
        expect(readSource('assets/js/pages/social-workspace.js')).toContain('function renderProjectTaskCard');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('project-column-tasks-open');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toMatch(/project-column-tasks-open[\s\S]*?openDialog\('project-column-tasks'/);
        expect(workspaceModule).toMatch(/kind === 'project-column-tasks'/);
        expect(workspaceModule).toMatch(/kind === 'project-task-detail'/);
        expect(tasksTabBlock).not.toContain('renderProjectColumnTasksModal');
        expect(tasksTabBlock).not.toContain('is-column-tasks-open');
        expect(tasksTabBlock).not.toContain('data-action="project-column-tasks-open"');
        expect(tasksTabBlock).not.toContain('social-project-task-column-head is-clickable');
        expect(tasksTabBlock).toContain('data-task-view="');
        expect(workspaceDialogs).toContain('project-column-tasks');
        expect(workspaceDialogs).toContain('project-task-detail');
        expect(columnModalBlock).toContain('social-neo-dialog-card--project-column-tasks');
        expect(columnModalBlock).toContain('social-neo-dialog-card--lms-create');
        expect(columnModalBlock).toContain('social-neo-section-head social-neo-dialog-head');
        expect(columnModalBlock).toContain('social-neo-form-actions social-neo-dialog-actions');
        expect(columnModalBlock).toContain('social-neo-dialog-cancel-btn');
        expect(columnModalBlock).toContain('social-neo-dialog-project-create-section');
        expect(columnModalBlock).not.toContain('portfolio-editor-head');
        expect(columnModalBlock).not.toContain('renderNeoEditorDialogShell');
        expect(detailModalBlock).toContain('social-neo-dialog-card--project-task-detail');
        expect(detailModalBlock).toContain('social-neo-dialog-card--lms-create');
        expect(detailModalBlock).toContain('social-neo-section-head social-neo-dialog-head');
        expect(detailModalBlock).toContain('social-neo-dialog-subtitle');
        expect(detailModalBlock).toContain('spt-detail-props');
        expect(detailModalBlock).toContain('spt-detail-section');
        expect(detailModalBlock).toContain('social-neo-form-actions social-neo-dialog-actions');
        expect(detailModalBlock).not.toContain('portfolio-editor-head');
        expect(detailModalBlock).not.toContain('portfolio-publish-panel');
        expect(detailModalBlock).not.toContain('renderNeoEditorDialogShell');
        expect(detailModalBlock).not.toContain('metaSummary');
        expect(detailModalBlock).toContain('social-project-task-detail-description');
        expect(detailModalBlock).toContain('project-task-edit-open');
        expect(detailModalBlock).toContain('project-task-delete-open');
        expect(createModalBlock).toContain('social-neo-dialog-card--lms-create');
        expect(createModalBlock).toContain('social-neo-section-head social-neo-dialog-head');
        expect(createModalBlock).toContain('social-neo-form-actions social-neo-dialog-actions');
        expect(createModalBlock).not.toContain('portfolio-publish-panel');
        expect(createModalBlock).not.toContain('renderNeoEditorDialogShell');
        expect(deleteModalBlock).toContain('social-neo-dialog-card--project-task-delete');
        expect(deleteModalBlock).toContain('social-neo-dialog-card--lms-create');
        expect(deleteModalBlock).toContain('social-neo-section-head social-neo-dialog-head');
        expect(deleteModalBlock).toContain('social-neo-form-actions social-neo-dialog-actions');
        expect(deleteModalBlock).not.toContain('renderNeoEditorDialogShell');
        expect(deleteModalBlock).not.toContain('social-neo-delete-confirm-accent');
        expect(detailModalBlock).not.toContain('renderProjectTaskFormFields');
        expect(detailModalBlock).not.toContain('data-form="project-task-drawer"');
        expect(detailModalBlock).not.toContain('Save changes');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain("formType === 'dialog-project-task-delete'");
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('confirmProjectTaskDelete');
        expect(source).toContain('renderProjectTaskDeleteConfirmDialog');
        expect(workspaceDialogs).toContain('project-task-delete');
        expect(source).not.toContain("formType === 'project-task-drawer'");
        expect(projectsCss).toContain('.social-project-task-detail-description');
        expect(rebuildCss).toContain('.social-neo-dialog-card--project-column-tasks');
        expect(rebuildCss).toContain('.social-neo-dialog-card--project-task-detail');
        expect(rebuildCss).toContain('--portfolio-editor-surface');
        expect(rebuildCss).toContain('border: 1px solid var(--sn-bdr) !important');
        expect(rebuildCss).toContain('background: var(--sn-bg3) !important');
        expect(rebuildCss).not.toMatch(/\.social-neo-btn,\s*\{/);
        expect(projectsCss).toContain('.social-neo-dialog-body--project-column-tasks');
        expect(projectsCss).toContain('.social-project-task-column-head.is-clickable');
    });

    it('tracks task popup dialog payload in render signature', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const signatureBlock = source.match(/function buildSocialRenderSignature\([\s\S]*?\n    \}/)?.[0] || '';

        expect(signatureBlock).toContain('dialog?.taskId');
        expect(signatureBlock).toContain('dialog?.columnId');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toMatch(/project-column-tasks-open[\s\S]*?openDialog\('project-column-tasks'/);
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toMatch(/project-task-detail-open[\s\S]*?openDialog\('project-task-detail'/);
    });

    it('sorts tasks by priority and uses large scrollable popup shells', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const rebuildCss = readSource('assets/css/social-rebuild.css');
        const portfolioCss = readSource('assets/css/portfolio-editor.css');
        const workspace = readSource('assets/js/pages/social-workspace.js');
        const both = source + workspace;
        const filterBlock = workspace.match(/function filterProjectBoardTasks\([\s\S]*?\n    \}/)?.[0] || '';

        expect(both).toContain('PROJECT_TASK_PRIORITY_RANK');
        expect(both).toContain('function sortProjectBoardTasksByPriority');
        expect(both).toMatch(/urgent:\s*0,\s*high:\s*1/);
        expect(filterBlock).toContain('sortProjectBoardTasksByPriority(filtered)');
        expect(source).toMatch(/function filterProjectBoardTasks\([\s\S]*window\.filterProjectBoardTasks/);
        expect(rebuildCss).toMatch(/social-neo-dialog-card--project-column-tasks[\s\S]*1180px/);
        expect(rebuildCss).not.toMatch(/\.social-neo-btn,\s*\{/);
        expect(rebuildCss).toMatch(/social-neo-dialog-card--project-task-detail[\s\S]*max-height:\s*min\(94dvh,\s*980px\)/);
        expect(rebuildCss).not.toMatch(/social-neo-dialog-card--project-task-detail[\s\S]*1040px/);
        expect(rebuildCss).toMatch(/social-neo-dialog-body--project-column-tasks[\s\S]*overflow-y:\s*auto/);
        expect(rebuildCss).toMatch(/social-neo-dialog-card--project-column-tasks[\s\S]*flex-direction:\s*column/);
        expect(portfolioCss).not.toContain('social-neo-dialog-body--project-task-create');
    });

    it('keeps task card title and assignee meta styles for dialog cards', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const projectsCss = readSource('assets/css/social-projects-lms.css');
        const cardBlock = projectsCss.match(/body\.lux-route-social \.social-project-task-card\s*\{[\s\S]*?\}/)?.[0] || '';

        expect(readSource('assets/js/pages/social-workspace.js')).toContain('social-project-task-card-title');
        expect(cardBlock).toContain('position: relative');
        expect(projectsCss).toContain('.social-project-task-assignee');
        expect(projectsCss).toContain('.social-project-task-card::before');
    });
});
