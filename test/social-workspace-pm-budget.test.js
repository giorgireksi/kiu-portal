import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { readSocialPageChain, readWorkspaceSurface } from './helpers/social-page-source.js';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social workspace PM + budget restructure', () => {
    it('drops Plan/Deliverables/Check-ins tabs and keeps Budget instead of Outcome', () => {
        const source = readSocialPageChain();
        const _wsClassic = readSource('assets/js/pages/social-workspace.js');
        const classicBlock = readSource('assets/js/pages/social-workspace-panel.js')
            + readSource('assets/js/pages/social-workspace-panel-budget-runtime.js');

        expect(classicBlock).not.toContain("['plan', 'Plan'");
        expect(classicBlock).not.toContain("['files', 'Deliverables'");
        expect(classicBlock).not.toContain("['checkins', 'Check-ins'");
        expect(classicBlock).toContain("['budget', 'Budget'");
        expect(classicBlock).not.toMatch(/\['milestones', 'Milestones'/);
        expect(classicBlock).not.toMatch(/\['meetings', 'Meetings'/);
        expect(classicBlock).not.toMatch(/\['outcome', 'Outcome'/);

        expect(source).not.toContain('renderPlanTab');
        expect(source).not.toContain('renderDeliverablesTab');
        expect(source).not.toContain('renderCheckinsTab');
        expect(classicBlock).toContain('renderBudgetTab');
        expect(source).not.toContain('renderOutcomeTab');
        expect(source).not.toContain('function renderMilestonesTab');
        expect(source).not.toContain('function renderMeetingsTab');

        expect((source + readWorkspaceSurface())).toMatch(/tabAlias\s*=\s*\{[^}]*outcome:\s*'budget'[^}]*\}/);
        expect((source + readWorkspaceSurface())).toMatch(/REMOVED_PROJECT_TABS\s*=\s*new Set\(\[[^\]]*'plan'/);
    });

    it('renders the budget tab with currency selector, cap, categories and expense log', () => {
        const _wsClassic = readSource('assets/js/pages/social-workspace.js');
        const classicBlock = readSource('assets/js/pages/social-workspace-panel.js')
            + readSource('assets/js/pages/social-workspace-panel-budget-runtime.js');

        expect(classicBlock).toContain('data-form="project-budget-settings"');
        expect(classicBlock).toContain('name="projectBudgetCurrency"');
        expect(classicBlock).toContain('name="projectBudgetCap"');
        expect(classicBlock).toContain('data-form="project-budget-category-add"');
        expect(classicBlock).toContain('name="projectBudgetCategoryTitle"');
        expect(classicBlock).toContain('name="projectBudgetCategoryPlanned"');
        expect(classicBlock).toContain('data-form="project-budget-expense-add"');
        expect(classicBlock).toContain('name="projectBudgetExpenseTitle"');
        expect(classicBlock).toContain('name="projectBudgetExpenseAmount"');
        expect(classicBlock).toContain('data-action="project-budget-category-edit"');
        expect(classicBlock).toContain('data-action="project-budget-category-delete"');
        expect(classicBlock).toContain('data-action="project-budget-expense-status"');
        expect(classicBlock).toContain('data-action="project-budget-expense-delete"');
        expect(classicBlock).toContain('formatBudgetMoney');
    });

    it('wires budget form submit handlers and action handlers', () => {
        const source = readSocialPageChain();

        expect((source + readWorkspaceSurface())).toMatch(/formType === 'project-budget-settings'/);
        expect((source + readWorkspaceSurface())).toMatch(/formType === 'project-budget-category-add'/);
        expect((source + readWorkspaceSurface())).toMatch(/formType === 'project-budget-expense-add'/);
        expect(source).toContain('createPortalSocialProjectBudgetCategory');
        expect(source).toContain('createPortalSocialProjectBudgetExpense');
        expect((source + readWorkspaceSurface())).toContain('updatePortalSocialProjectBudgetCategory');
        expect((source + readWorkspaceSurface())).toContain('updatePortalSocialProjectBudgetExpense');
        expect((source + readWorkspaceSurface())).toContain('deletePortalSocialProjectBudgetCategory');
        expect((source + readWorkspaceSurface())).toContain('deletePortalSocialProjectBudgetExpense');
    });

    it('swaps the hero Milestones metric card for a Budget metric card', () => {
        const _wsClassic = readSource('assets/js/pages/social-workspace.js');
        const classicBlock = readSource('assets/js/pages/social-workspace-panel.js');

        expect(classicBlock).toContain("renderMetricCard('fa-wallet', 'Budget'");
        expect(classicBlock).not.toMatch(/renderMetricCard\('fa-flag', 'Milestones'/);
        expect(classicBlock).not.toMatch(/renderMetricCard\('fa-box-archive', 'Deliverables'/);
    });

    it('leaves the portfolio panel and showcase publish action untouched', () => {
        const source = readSocialPageChain();

        expect((source + readSource('assets/js/pages/social-page-feed-runtime.js'))).toContain('function renderProjectsPanel');
        expect((source + readWorkspaceSurface())).toContain('project-showcase-publish');
        expect((source + readWorkspaceSurface())).toContain('publishPortalSocialProjectShowcase');
    });

    it('exposes budget client APIs on the social runtime lite window surface', () => {
        const runtime = readSource('assets/js/shared/social-runtime-lite.js');

        expect(runtime).toContain('createPortalSocialProjectBudgetCategory: createProjectBudgetCategory');
        expect(runtime).toContain('updatePortalSocialProjectBudgetCategory: updateProjectBudgetCategory');
        expect(runtime).toContain('deletePortalSocialProjectBudgetCategory: deleteProjectBudgetCategory');
        expect(runtime).toContain('createPortalSocialProjectBudgetExpense: createProjectBudgetExpense');
        expect(runtime).toContain('updatePortalSocialProjectBudgetExpense: updateProjectBudgetExpense');
        expect(runtime).toContain('deletePortalSocialProjectBudgetExpense: deleteProjectBudgetExpense');
    });

    it('registers budget routes mirroring the tasks pattern', () => {
        const routes = readSource('backend/platform/routes/social-routes.js');

        expect(routes).toContain('/api/social/projects/:id/budget-categories');
        expect(routes).toContain('/api/social/projects/:id/budget-categories/:categoryId');
        expect(routes).toContain('/api/social/projects/:id/budget-expenses');
        expect(routes).toContain('/api/social/projects/:id/budget-expenses/:expenseId');
        expect(routes).not.toContain('/api/social/projects/:id/milestones');
        expect(routes).not.toContain('/api/social/projects/:id/deliverables');
        expect(routes).not.toContain('/api/social/projects/:id/checkins');
    });
});
