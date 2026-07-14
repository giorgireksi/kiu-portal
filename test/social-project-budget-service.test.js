import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');

function seedAccount(store, id, role = 'student') {
    store.state.accounts[id] = {
        id,
        displayName: id,
        email: `${id}@example.com`,
        role,
        facultyCode: 'ECON'
    };
}

describe('social project budget service', () => {
    function seedProject(store) {
        seedAccount(store, 'owner-1');
        seedAccount(store, 'member-1');
        seedAccount(store, 'advisor-1', 'professor');
        const project = store.createSocialProject({ title: 'Capstone' }, 'owner-1');
        store.inviteSocialProjectMember(project.id, 'member-1', 'member', 'owner-1');
        store.updateSocialProject(project.id, { advisorUserId: 'advisor-1', budgetCurrency: 'USD', budgetCap: 1000 }, 'owner-1');
        return project;
    }

    it('creates, updates, and deletes budget categories', () => {
        const store = new PlatformStore({});
        const project = seedProject(store);

        const category = store.createSocialProjectBudgetCategory(project.id, { title: 'Materials', plannedAmount: 400 }, 'owner-1');
        expect(category.title).toBe('Materials');
        expect(category.plannedAmount).toBe(400);

        const updated = store.updateSocialProjectBudgetCategory(project.id, category.id, { title: 'Materials & Supplies', plannedAmount: 500 }, 'owner-1');
        expect(updated.title).toBe('Materials & Supplies');
        expect(updated.plannedAmount).toBe(500);

        const deleted = store.deleteSocialProjectBudgetCategory(project.id, category.id, 'owner-1');
        expect(deleted).toEqual({ ok: true, categoryId: category.id });
    });

    it('creates, updates, and deletes budget expenses in USD and GEL', () => {
        const store = new PlatformStore({});
        const project = seedProject(store);
        const category = store.createSocialProjectBudgetCategory(project.id, { title: 'Travel', plannedAmount: 300 }, 'owner-1');

        const expenseUsd = store.createSocialProjectBudgetExpense(project.id, { title: 'Bus tickets', amount: 50, currency: 'USD', categoryId: category.id }, 'member-1');
        expect(expenseUsd.amount).toBe(50);
        expect(expenseUsd.currency).toBe('USD');
        expect(expenseUsd.status).toBe('draft');

        const expenseGel = store.createSocialProjectBudgetExpense(project.id, { title: 'Printing', amount: 80, currency: 'GEL' }, 'member-1');
        expect(expenseGel.currency).toBe('GEL');

        const submitted = store.updateSocialProjectBudgetExpense(project.id, expenseUsd.id, { status: 'submitted' }, 'member-1');
        expect(submitted.status).toBe('submitted');

        const approved = store.updateSocialProjectBudgetExpense(project.id, expenseUsd.id, { status: 'approved' }, 'advisor-1');
        expect(approved.status).toBe('approved');
        expect(approved.approvedById).toBe('advisor-1');

        const deleted = store.deleteSocialProjectBudgetExpense(project.id, expenseGel.id, 'owner-1');
        expect(deleted).toEqual({ ok: true, expenseId: expenseGel.id });
    });

    it('blocks non-managers from approving or rejecting expenses', () => {
        const store = new PlatformStore({});
        const project = seedProject(store);
        const expense = store.createSocialProjectBudgetExpense(project.id, { title: 'Snacks', amount: 20, currency: 'USD' }, 'member-1');
        store.updateSocialProjectBudgetExpense(project.id, expense.id, { status: 'submitted' }, 'member-1');

        const blocked = store.updateSocialProjectBudgetExpense(project.id, expense.id, { status: 'approved' }, 'member-1');
        expect(blocked).toBeNull();
    });

    it('computes budget rollups in decorateSocialProject', () => {
        const store = new PlatformStore({});
        const project = seedProject(store);
        store.createSocialProjectBudgetCategory(project.id, { title: 'Materials', plannedAmount: 400 }, 'owner-1');
        store.createSocialProjectBudgetCategory(project.id, { title: 'Travel', plannedAmount: 300 }, 'owner-1');
        const expense = store.createSocialProjectBudgetExpense(project.id, { title: 'Bus', amount: 120, currency: 'USD' }, 'member-1');
        store.updateSocialProjectBudgetExpense(project.id, expense.id, { status: 'submitted' }, 'member-1');
        const expense2 = store.createSocialProjectBudgetExpense(project.id, { title: 'Ink', amount: 40, currency: 'USD' }, 'member-1');
        store.updateSocialProjectBudgetExpense(project.id, expense2.id, { status: 'approved' }, 'owner-1');

        const decorated = store.decorateSocialProject(store.getSocialProjectRecord(project.id), 'owner-1');
        expect(decorated.budgetPlannedTotal).toBe(700);
        expect(decorated.budgetSpentTotal).toBe(40);
        expect(decorated.budgetPendingTotal).toBe(120);
        expect(decorated.budgetCap).toBe(1000);
        expect(decorated.budgetUtilizationPercent).toBe(Math.round((40 / 1000) * 100));
        expect(decorated.budgetOverCap).toBe(false);
        expect(decorated.budgetByCategory.length).toBe(2);
    });

    it('cascade-deletes budget collections when the project is deleted', () => {
        const store = new PlatformStore({});
        const project = seedProject(store);
        store.createSocialProjectBudgetCategory(project.id, { title: 'Materials', plannedAmount: 400 }, 'owner-1');
        store.createSocialProjectBudgetExpense(project.id, { title: 'Bus', amount: 120, currency: 'USD' }, 'member-1');

        store.deleteSocialProject(project.id, 'owner-1');

        expect(store.state.social.projectBudgetCategories.filter((c) => c.projectId === project.id)).toEqual([]);
        expect(store.state.social.projectBudgetExpenses.filter((e) => e.projectId === project.id)).toEqual([]);
    });
});
