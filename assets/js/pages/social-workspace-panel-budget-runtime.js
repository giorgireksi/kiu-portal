/* Budget/chat/activity tab helpers peeled from social-workspace-panel.js. */
(function initSocialWorkspacePanelBudget() {
    'use strict';
    if (window.__KIU_SOCIAL_WORKSPACE_PANEL_BUDGET_LOADED) return;
    window.__KIU_SOCIAL_WORKSPACE_PANEL_BUDGET_LOADED = true;

    window.__kiuCreateSocialWorkspacePanelBudgetApi = function createKiuSocialWorkspacePanelBudgetApi(deps) {
        if (!deps || typeof deps !== 'object') throw new Error('panel budget deps required');
        const {
            escape, text, displayName, avatar, accountById, state,
            ensureSocialMessagesModule, hasSocialMessagesModule,
            ensureProjectWorkspaceChat, resolveProjectWorkspaceChat,
            renderMessagesThreadShell, setActiveChat, queueDeferredModuleRender,
            renderSocialPageNow, currentUserId
        } = deps;
            const formatBudgetMoney = (amount, currency = '') => {
                const value = Number(amount || 0);
                const rounded = Math.round(value * 100) / 100;
                const suffix = currency ? ` ${currency}` : '';
                return `${rounded.toLocaleString(undefined, { maximumFractionDigits: 2 })}${suffix}`;
            };
            const budgetCurrency = text(activeProject?.budgetCurrency || '') || 'USD';
            const budgetSpent = countNum(activeProject?.budgetSpentTotal);
            const budgetPlanned = countNum(activeProject?.budgetPlannedTotal);
            const budgetPending = countNum(activeProject?.budgetPendingTotal);
            const budgetCapValue = countNum(activeProject?.budgetCap);
            const budgetBase = budgetCapValue > 0 ? budgetCapValue : budgetPlanned;
            const budgetRemaining = countNum(activeProject?.budgetRemaining);
            const budgetUtilization = countNum(activeProject?.budgetUtilizationPercent);
            const budgetOverCap = Boolean(activeProject?.budgetOverCap);
            const budgetCategories = Array.isArray(activeProject?.budgetCategories) ? activeProject.budgetCategories : [];
            const budgetExpenses = Array.isArray(activeProject?.budgetExpenses) ? activeProject.budgetExpenses : [];
            const budgetByCategory = Array.isArray(activeProject?.budgetByCategory) ? activeProject.budgetByCategory : [];
            const renderBudgetTab = () => `
                <section class="social-neo-stack">
                    <div class="social-project-dashboard-grid">
                        ${renderProgressRing(budgetUtilization, 'Budget used', `${formatBudgetMoney(budgetSpent, budgetCurrency)} of ${formatBudgetMoney(budgetBase, budgetCurrency)}`, '#f97316')}
                        ${renderMetricCard('fa-wallet', 'Spent', formatBudgetMoney(budgetSpent, budgetCurrency), `${formatBudgetMoney(budgetPending, budgetCurrency)} pending`, '#f59336')}
                        ${renderMetricCard('fa-coins', 'Planned', formatBudgetMoney(budgetPlanned, budgetCurrency), `${budgetCategories.length} categories`, '#3b82f6')}
                        ${renderMetricCard(budgetOverCap ? 'fa-triangle-exclamation' : 'fa-bank', 'Cap', formatBudgetMoney(budgetCapValue, budgetCurrency) || 'Not set', budgetOverCap ? 'Over cap' : (budgetCapValue > 0 ? `${formatBudgetMoney(Math.max(0, budgetRemaining), budgetCurrency)} left` : 'No cap set'), budgetOverCap ? '#f43f5e' : '#10b981')}
                    </div>
                    <div class="social-project-budget-spend-bar">
                        <div class="social-neo-section-head">
                            <div><strong>Spend against plan</strong><span>${escape(String(budgetUtilization))}% of ${escape(budgetCapValue > 0 ? 'cap' : 'planned')} used.</span></div>
                            <span class="social-neo-pill ${budgetOverCap ? 'is-tone-rose' : ''}">${escape(formatBudgetMoney(budgetSpent, budgetCurrency))} / ${escape(formatBudgetMoney(budgetBase, budgetCurrency))}</span>
                        </div>
                        <div class="social-project-deadline-bar"><div class="social-project-deadline-fill ${budgetOverCap ? 'is-overdue' : ''}" style="width:${Math.min(100, budgetUtilization)}%"></div></div>
                    </div>
                    ${activeProject.isManager ? `
                        <form class="social-neo-card social-project-rich-panel social-neo-stack" data-form="project-budget-settings" data-project-id="${escape(text(activeProject.id))}">
                            <div class="social-neo-section-head">
                                <div><strong>Budget settings</strong><span>Choose the currency and optional spend cap for this workspace.</span></div>
                            </div>
                            <div class="social-neo-grid-2">
                                <label><span class="social-neo-label">Currency</span>
                                    <select class="social-neo-select lux-control" name="projectBudgetCurrency" data-lux-picker>
                                        <option value="USD" ${budgetCurrency === 'USD' ? 'selected' : ''}>USD — US Dollar</option>
                                        <option value="GEL" ${budgetCurrency === 'GEL' ? 'selected' : ''}>GEL — Georgian Lari</option>
                                    </select>
                                </label>
                                <label><span class="social-neo-label">Spend cap (0 = unset)</span><input class="social-neo-input lux-control" type="number" min="0" step="0.01" name="projectBudgetCap" value="${escape(String(budgetCapValue || 0))}"></label>
                            </div>
                            <div class="social-neo-inline social-neo-inline-end"><button class="lux-primary-btn" type="submit"><i class="fas fa-check"></i> Save budget settings</button></div>
                        </form>
                    ` : ''}
                    <section class="social-neo-card social-project-rich-panel">
                        <div class="social-neo-section-head">
                            <div><strong>Budget categories</strong><span>Plan allocation across materials, travel, software, and more.</span></div>
                            <span class="social-neo-pill">${escape(String(budgetCategories.length))} categories</span>
                        </div>
                        ${activeProject.viewerCanContribute ? `
                            <form data-form="project-budget-category-add" data-project-id="${escape(text(activeProject.id))}" class="social-neo-grid-3 social-project-budget-add-row">
                                <label><span class="social-neo-label">Category title</span><input class="social-neo-input lux-control" type="text" name="projectBudgetCategoryTitle" placeholder="Materials" required></label>
                                <label><span class="social-neo-label">Planned amount</span><input class="social-neo-input lux-control" type="number" min="0" step="0.01" name="projectBudgetCategoryPlanned" placeholder="0.00"></label>
                                <div class="social-neo-inline social-neo-inline-end"><button class="lux-primary-btn" type="submit"><i class="fas fa-plus"></i> Add category</button></div>
                            </form>
                        ` : ''}
                        <div class="social-project-budget-category-list">
                            ${budgetCategories.length ? budgetCategories.map((category) => {
                                const rollup = budgetByCategory.find((entry) => text(entry?.categoryId) === text(category.id)) || { spent: 0, count: 0 };
                                return `
                                    <article class="social-project-budget-category-item">
                                        <div class="social-project-budget-category-head">
                                            <div>
                                                <strong>${escape(text(category.title || 'Category'))}</strong>
                                                <span>${escape(text(category.description || ''))}</span>
                                            </div>
                                            <div class="social-neo-badge-row">
                                                <span class="social-neo-pill">Planned ${escape(formatBudgetMoney(category.plannedAmount, budgetCurrency))}</span>
                                                <span class="social-neo-pill is-tone-${rollup.spent > category.plannedAmount ? 'rose' : 'emerald'}">Spent ${escape(formatBudgetMoney(rollup.spent, budgetCurrency))}</span>
                                                <span class="social-neo-pill">${escape(String(rollup.count || 0))} expenses</span>
                                            </div>
                                        </div>
                                        ${activeProject.viewerCanContribute ? `
                                            <div class="social-project-budget-category-actions">
                                                <button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="project-budget-category-edit" data-project-id="${escape(text(activeProject.id))}" data-category-id="${escape(text(category.id))}"><i class="fas fa-pen"></i> Edit</button>
                                                <button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="project-budget-category-delete" data-project-id="${escape(text(activeProject.id))}" data-category-id="${escape(text(category.id))}"><i class="fas fa-trash"></i> Remove</button>
                                            </div>
                                        ` : ''}
                                    </article>
                                `;
                            }).join('') : `<div class="social-neo-empty">No budget categories yet. Add one to start planning spend.</div>`}
                        </div>
                    </section>
                    <section class="social-neo-card social-project-rich-panel">
                        <div class="social-neo-section-head">
                            <div><strong>Expense log</strong><span>Track real spend and submit it for approval.</span></div>
                            <span class="social-neo-pill">${escape(String(budgetExpenses.length))} entries</span>
                        </div>
                        ${activeProject.viewerCanContribute ? `
                            <form data-form="project-budget-expense-add" data-project-id="${escape(text(activeProject.id))}" class="social-neo-stack social-project-budget-expense-add">
                                <div class="social-neo-grid-3">
                                    <label><span class="social-neo-label">Expense title</span><input class="social-neo-input lux-control" type="text" name="projectBudgetExpenseTitle" placeholder="Bus tickets" required></label>
                                    <label><span class="social-neo-label">Amount</span><input class="social-neo-input lux-control" type="number" min="0" step="0.01" name="projectBudgetExpenseAmount" placeholder="0.00" required></label>
                                    <label><span class="social-neo-label">Category</span>
                                        <select class="social-neo-select lux-control" name="projectBudgetExpenseCategoryId" data-lux-picker>
                                            <option value="">Uncategorized</option>
                                            ${budgetCategories.map((category) => `<option value="${escape(text(category.id))}">${escape(text(category.title))}</option>`).join('')}
                                        </select>
                                    </label>
                                </div>
                                <div class="social-neo-inline social-neo-inline-end"><button class="lux-primary-btn" type="submit"><i class="fas fa-plus"></i> Log expense</button></div>
                            </form>
                        ` : ''}
                        <div class="social-project-budget-expense-list">
                            ${budgetExpenses.length ? budgetExpenses.map((expense) => {
                                const status = text(expense?.status || 'draft');
                                const statusMeta = {
                                    draft: { label: 'Draft', tone: 'slate' },
                                    submitted: { label: 'Submitted', tone: 'amber' },
                                    approved: { label: 'Approved', tone: 'emerald' },
                                    paid: { label: 'Paid', tone: 'emerald' },
                                    rejected: { label: 'Rejected', tone: 'rose' }
                                }[status] || { label: status, tone: 'slate' };
                                const category = budgetCategories.find((entry) => text(entry?.id) === text(expense?.categoryId));
                                const canReviewBudget = Boolean(activeProject.isManager || text(activeProject.role || '') === 'advisor');
                                return `
                                    <article class="social-project-budget-expense-item">
                                        <div class="social-project-budget-expense-head">
                                            <div>
                                                <strong>${escape(text(expense?.title || 'Expense'))}</strong>
                                                <span>${escape(text(category?.title || 'Uncategorized'))} · ${escape(when(expense?.incurredAt || expense?.createdAt || ''))}</span>
                                            </div>
                                            <div class="social-neo-badge-row">
                                                <span class="social-neo-pill">${escape(formatBudgetMoney(expense?.amount, text(expense?.currency || budgetCurrency)))}</span>
                                                <span class="social-neo-pill is-tone-${escape(statusMeta.tone)}">${escape(statusMeta.label)}</span>
                                            </div>
                                        </div>
                                        ${text(expense?.description) ? `<p class="social-project-budget-expense-note">${escape(text(expense.description))}</p>` : ''}
                                        ${activeProject.viewerCanContribute ? `
                                            <div class="social-project-budget-expense-actions">
                                                ${expense?.submittedById && status === 'draft' ? `<span class="social-neo-muted">Logged by ${escape(displayName(accountById(expense.submittedById) || { id: expense.submittedById }))}</span>` : ''}
                                                ${status === 'draft' ? `<button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="project-budget-expense-status" data-project-id="${escape(text(activeProject.id))}" data-expense-id="${escape(text(expense.id))}" data-status="submitted"><i class="fas fa-paper-plane"></i> Submit</button>` : ''}
                                                ${canReviewBudget && status === 'submitted' ? `<button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="project-budget-expense-status" data-project-id="${escape(text(activeProject.id))}" data-expense-id="${escape(text(expense.id))}" data-status="approved"><i class="fas fa-check"></i> Approve</button>` : ''}
                                                ${canReviewBudget && status === 'submitted' ? `<button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="project-budget-expense-status" data-project-id="${escape(text(activeProject.id))}" data-expense-id="${escape(text(expense.id))}" data-status="rejected"><i class="fas fa-xmark"></i> Reject</button>` : ''}
                                                ${canReviewBudget && status === 'approved' ? `<button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="project-budget-expense-status" data-project-id="${escape(text(activeProject.id))}" data-expense-id="${escape(text(expense.id))}" data-status="paid"><i class="fas fa-money-bill-wave"></i> Mark paid</button>` : ''}
                                                <button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="project-budget-expense-delete" data-project-id="${escape(text(activeProject.id))}" data-expense-id="${escape(text(expense.id))}"><i class="fas fa-trash"></i> Remove</button>
                                            </div>
                                        ` : ''}
                                    </article>
                                `;
                            }).join('') : `<div class="social-neo-empty">No expenses logged yet.</div>`}
                        </div>
                    </section>
                </section>
            `;

        return { formatBudgetMoney, renderBudgetTab };
    };
})();
