/* Student service helpful/ops/question/ticket/attachment submit helpers. Peeled from student-service.js.
 * Load before student-service.js.
 */
(function initStudentServiceOpsRuntime() {
    if (window.__KIU_STUDENT_SERVICE_OPS_LOADED) return;
    window.__KIU_STUDENT_SERVICE_OPS_LOADED = true;

    window.__kiuCreateStudentServiceOpsApi = function createKiuPeelApi(deps = {}) {
        const d = deps;
        void d;
        /* Non-strict factory body: free vars resolve to window globals at call time. */

function ssForwardToLoadedModule(hasModule, ensureModule, name, localFn, args, fallback) {
    if (typeof hasModule === 'function' && hasModule()) {
        const impl = typeof resolveStudentServiceExportImpl === 'function'
            ? resolveStudentServiceExportImpl(name)
            : undefined;
        if (typeof impl === 'function' && impl !== localFn) return impl.apply(null, args);
        const w = window[name];
        if (typeof w === 'function' && w !== localFn) return w.apply(null, args);
    }
    if (typeof ensureModule === 'function') ensureModule().catch(() => null);
    return fallback;
}


function updateStudentServiceOwnerResolutionButtons(root, question = {}) {
    if (!root) return;
    const ownerStatus = String(question.ownerResolutionStatus || '').trim().toLowerCase();
    root.querySelectorAll('[data-student-service-owner-resolution]').forEach(button => {
        const value = String(button.dataset.studentServiceOwnerResolution || '').trim().toLowerCase();
        const isActive = ownerStatus === value;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        const icon = button.querySelector('i');
        if (icon && value === 'answered') icon.className = `fas ${isActive ? 'fa-check-circle' : 'far fa-circle'}`;
        if (icon && value === 'unanswered') icon.className = `fas ${isActive ? 'fa-hourglass-half' : 'far fa-hourglass'}`;
    });
}

function renderStudentServiceOwnerResolutionButtonMarkup(question, skipLuxButton = 'data-lux-skip-modern-button="true"') {
    if (!canCurrentUserSetStudentServiceOwnerResolution(question)) return '';
    const ownerStatus = String(question.ownerResolutionStatus || '').trim().toLowerCase();
    const answeredActive = ownerStatus === 'answered';
    const unansweredActive = ownerStatus === 'unanswered';
    return `
        <button type="button" class="lux-secondary-btn student-service-qa-detail-action-btn student-service-qa-detail-action-btn--owner-resolution student-service-qa-owner-resolution-btn${answeredActive ? ' is-active' : ''}" ${skipLuxButton} data-student-service-question-id="${ssEscape(question.id)}" data-student-service-owner-resolution="answered" aria-pressed="${answeredActive ? 'true' : 'false'}"><i class="${answeredActive ? 'fas fa-check-circle' : 'far fa-circle'}" aria-hidden="true"></i><span>Mark as answered</span></button>
        <button type="button" class="lux-secondary-btn student-service-qa-detail-action-btn student-service-qa-detail-action-btn--owner-resolution student-service-qa-owner-resolution-btn${unansweredActive ? ' is-active' : ''}" ${skipLuxButton} data-student-service-question-id="${ssEscape(question.id)}" data-student-service-owner-resolution="unanswered" aria-pressed="${unansweredActive ? 'true' : 'false'}"><i class="${unansweredActive ? 'fas fa-hourglass-half' : 'far fa-hourglass'}" aria-hidden="true"></i><span>Still unanswered</span></button>
    `;
}

function renderStudentServiceQuestionHelpfulButtonMarkup(question, skipLuxButton = 'data-lux-skip-modern-button="true"') {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'renderStudentServiceQuestionHelpfulButtonMarkup', renderStudentServiceQuestionHelpfulButtonMarkup, arguments, '');
}

function updateStudentServiceQuestionHelpfulButton(button, question = {}) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'updateStudentServiceQuestionHelpfulButton', updateStudentServiceQuestionHelpfulButton, arguments, undefined);
}

function triggerStudentServiceHelpfulAnimation(button, voted = true) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'triggerStudentServiceHelpfulAnimation', triggerStudentServiceHelpfulAnimation, arguments, undefined);
}

function flashStudentServiceActionButton(button, outcome = 'acting') {
    if (!button) return;
    button.classList.remove('is-acting', 'is-success', 'is-error');
    void button.offsetWidth;
    if (outcome === 'success') button.classList.add('is-success');
    else if (outcome === 'error') button.classList.add('is-error');
    else button.classList.add('is-acting');
    const ms = outcome === 'error' ? 420 : 520;
    window.setTimeout(() => button.classList.remove('is-acting', 'is-success', 'is-error'), ms);
}

function setStudentServiceActionButtonPending(button, pending = true) {
    if (!button) return;
    button.classList.toggle('is-pending', pending);
    if (pending) button.setAttribute('aria-busy', 'true');
    else button.removeAttribute('aria-busy');
}

function patchStudentServiceQuestionHelpfulUi(questionId, options = {}) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'patchStudentServiceQuestionHelpfulUi', patchStudentServiceQuestionHelpfulUi, arguments, undefined);
}

function isStudentServiceAnswerHelpfulVoted(answer = {}) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'isStudentServiceAnswerHelpfulVoted', isStudentServiceAnswerHelpfulVoted, arguments, false);
}

function renderStudentServiceAnswerHelpfulButtonMarkup(question, answer, skipLuxButton = 'data-lux-skip-modern-button="true"') {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'renderStudentServiceAnswerHelpfulButtonMarkup', renderStudentServiceAnswerHelpfulButtonMarkup, arguments, '');
}

function updateStudentServiceAnswerHelpfulButton(button, answer = {}) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'updateStudentServiceAnswerHelpfulButton', updateStudentServiceAnswerHelpfulButton, arguments, undefined);
}

function patchStudentServiceAnswerHelpfulBtn(questionId, answerId, options = {}) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'patchStudentServiceAnswerHelpfulBtn', patchStudentServiceAnswerHelpfulBtn, arguments, undefined);
}

function removeStudentServiceAnswerBranch(questionId, answerId) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'removeStudentServiceAnswerBranch', removeStudentServiceAnswerBranch, arguments, undefined);
}

function applyStudentServiceQuestionMutation(questionId, options = {}) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'applyStudentServiceQuestionMutation', applyStudentServiceQuestionMutation, arguments, undefined);
}

function patchStudentServiceOpenQuestionThread(questionId) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'patchStudentServiceOpenQuestionThread', patchStudentServiceOpenQuestionThread, arguments, undefined);
}

function ensureStudentServiceOperationsShell(root) {
    if (!root) return null;
    let shell = root.querySelector('[data-student-service-ops-shell="1"]');
    if (!shell) {
        const range = document.createRange();
        range.selectNodeContents(root);
        root.replaceChildren(range.createContextualFragment(`
            <div class="student-service-ops-shell" data-student-service-ops-shell="1">
                <div data-student-service-ops-head="1"></div>
                <div class="student-service-ops-grid">
                    <div data-student-service-ops-stats="1"></div>
                    <div data-student-service-ops-queue="1"></div>
                    <div data-student-service-ops-lanes="1"></div>
                </div>
            </div>
        `));
        shell = root.querySelector('[data-student-service-ops-shell="1"]');
    }
    return {
        head: shell?.querySelector('[data-student-service-ops-head="1"]') || null,
        stats: shell?.querySelector('[data-student-service-ops-stats="1"]') || null,
        queue: shell?.querySelector('[data-student-service-ops-queue="1"]') || null,
        lanes: shell?.querySelector('[data-student-service-ops-lanes="1"]') || null
    };
}

function renderStudentServiceOperationsHeadMarkup() {
    return `
        <div class="student-service-ops-head">
            <div>
                <div class="student-service-kicker">Desk focus</div>
                <div class="student-service-zone-title">Queue control with useful context attached.</div>
                <div class="student-service-zone-copy">This strip stays secondary to the student hub and keeps the live desk state visible for staff without turning the page into a spreadsheet.</div>
            </div>
            <div class="student-service-ops-actions">
                <button type="button" class="student-service-mini-action" data-student-service-open-panel="tickets"><i class="fas fa-inbox"></i> Open inbox</button>
                <button type="button" class="student-service-mini-action" data-student-service-open-panel="articles"><i class="fas fa-book-open"></i> Knowledge base</button>
            </div>
        </div>
    `;
}

function renderStudentServiceOperationsStatsMarkup(openTickets, assignedToMe, waitingForService, waitingForStudent, handoffNeeded) {
    return `
        <article class="student-service-ops-card lux-summary-surface lux-summary-surface--panel">
            <div class="student-service-ops-label">Live queue</div>
            <div class="student-service-ops-value">${openTickets.length}</div>
            <div class="student-service-ops-copy">Open cases across the visible support lane.</div>
            <div class="student-service-ops-pill-row">
                <span class="student-service-pill">Assigned ${assignedToMe}</span>
                <span class="student-service-pill">Waiting ${waitingForService + waitingForStudent}</span>
                <span class="student-service-pill">Handoffs ${handoffNeeded}</span>
            </div>
        </article>
    `;
}

function renderStudentServiceOperationsQueueMarkup(urgentQueue) {
    return `
        <article class="student-service-ops-card student-service-ops-card--queue lux-summary-surface lux-summary-surface--panel">
            <div class="student-service-ops-label">Next useful case</div>
            <div class="student-service-ops-list">
                ${urgentQueue.length ? urgentQueue.map(ticket => `
                    <button type="button" class="student-service-ops-ticket" data-student-service-open-ticket="${ssEscape(ticket.id)}" data-student-service-open-ticket-panel="tickets">
                        <div class="student-service-ops-ticket-top">
                            <strong>${ssEscape(ticket.title)}</strong>
                            <span class="student-service-status ${ssEscape(getStudentServiceStatusClass(ticket.status))}">${ssEscape(ticket.status)}</span>
                        </div>
                        <div class="student-service-ops-ticket-copy">${ssEscape(ticket.studentName)} | ${ssEscape(getStudentServiceSupportArea(ticket.serviceArea).label)}</div>
                        <div class="student-service-ops-ticket-copy">Updated ${ssFormatDateTime(ticket.updatedAt || ticket.createdAt)} | Assignee ${ssEscape(ticket.assignedToName || 'Unassigned')}</div>
                    </button>
                `).join('') : '<div class="student-service-empty-state">No open tickets need desk attention right now.</div>'}
            </div>
        </article>
    `;
}

function renderStudentServiceOperationsLanesMarkup(topicCounts) {
    return `
        <article class="student-service-ops-card lux-summary-surface lux-summary-surface--panel">
            <div class="student-service-ops-label">Service lanes</div>
            <div class="student-service-ops-lanes">
                ${topicCounts.slice(0, 4).map(({ area, open, articles: articleCount }) => `
                    <button type="button" class="student-service-ops-lane" data-student-service-focus-area="${ssEscape(area.id)}">
                        <strong>${ssEscape(area.label)}</strong>
                        <span>${open} open | ${articleCount} articles</span>
                    </button>
                `).join('')}
            </div>
        </article>
    `;
}

function renderStudentServiceOperationsStrip(root, currentUser, tickets, articles) {
    if (!root || getEffectiveUserRole() !== USER_ROLES.STUDENT_SERVICE) return;
    const openTickets = tickets.filter(ticket => !['Resolved', 'Closed'].includes(ticket.status));
    const assignedToMe = openTickets.filter(ticket => String(ticket.assignedToId || '') === String(currentUser?.id || '')).length;
    const waitingForService = tickets.filter(ticket => ticket.status === 'Waiting for Service').length;
    const waitingForStudent = tickets.filter(ticket => ticket.status === 'Waiting for Student').length;
    const handoffNeeded = openTickets.filter(ticket => ['Requested', 'In Progress', 'Waiting'].includes(ticket.handoff?.status)).length;
    const urgentQueue = sortStudentServiceTicketsForStaff(openTickets).slice(0, 3);
    const topicCounts = STUDENT_SERVICE_SUPPORT_AREAS.map(area => ({
        area,
        open: openTickets.filter(ticket => ticket.serviceArea === area.id).length,
        articles: articles.filter(article => article.serviceArea === area.id && article.published).length
    })).sort((left, right) => right.open - left.open);
    const shell = ensureStudentServiceOperationsShell(root);
    if (!shell) return;
    setStudentServiceMarkup(shell.head, 'student-service-ops:head', renderStudentServiceOperationsHeadMarkup());
    setStudentServiceMarkup(shell.stats, 'student-service-ops:stats', renderStudentServiceOperationsStatsMarkup(openTickets, assignedToMe, waitingForService, waitingForStudent, handoffNeeded));
    setStudentServiceMarkup(shell.queue, 'student-service-ops:queue', renderStudentServiceOperationsQueueMarkup(urgentQueue));
    setStudentServiceMarkup(shell.lanes, 'student-service-ops:lanes', renderStudentServiceOperationsLanesMarkup(topicCounts));
}

function renderStudentServiceHomeWorkspaceRebuilt() {
    const root = document.getElementById('student-service-home-workspace');
    if (!root) return;
    if (getEffectiveUserRole() !== USER_ROLES.STUDENT_SERVICE) {
        root.replaceChildren();
        return;
    }
    const currentUser = getStudentServiceCurrentUser();
    const { tickets, articles } = ensureStudentServiceStores();
    renderStudentServiceOperationsStrip(root, currentUser, tickets, articles);
}

function setStudentServiceQuestionFilter(field, value) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'setStudentServiceQuestionFilter', setStudentServiceQuestionFilter, arguments, undefined);
}

function setStudentServiceQuestionComposerExpanded(expanded) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'setStudentServiceQuestionComposerExpanded', setStudentServiceQuestionComposerExpanded, arguments, undefined);
}

function setStudentServiceDraftQuestionField(field, value) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'setStudentServiceDraftQuestionField', setStudentServiceDraftQuestionField, arguments, undefined);
}

function openStudentServiceQuestion(questionId) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'openStudentServiceQuestion', openStudentServiceQuestion, arguments, undefined);
}

function setStudentServiceReplyTarget(questionId, answerId) {
    const ui = ensureStudentServiceUiState();
    const normalizedQuestionId = String(questionId || '').trim();
    const normalizedAnswerId = String(answerId || '').trim();
    const isSameTarget = ui.replyingToQuestionId === normalizedQuestionId
        && ui.replyingToAnswerId === normalizedAnswerId;
    ui.serviceLane = 'qa';
    ui.selectedQuestionId = normalizedQuestionId || ui.selectedQuestionId;
    if (isSameTarget) {
        closeStudentServiceInlineReply();
        return;
    }
    openStudentServiceInlineReply(normalizedQuestionId, normalizedAnswerId);
}

function clearStudentServiceReplyTarget() {
    closeStudentServiceInlineReply();
}

function getStudentServiceQuestionStatusLabel(question) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'getStudentServiceQuestionStatusLabel', getStudentServiceQuestionStatusLabel, arguments, null);
}

function getStudentServiceQuestionStatusClass(question) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'getStudentServiceQuestionStatusClass', getStudentServiceQuestionStatusClass, arguments, []);
}

function getStudentServiceQuestionAnswerCount(question) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'getStudentServiceQuestionAnswerCount', getStudentServiceQuestionAnswerCount, arguments, null);
}

function renderStudentServiceQuestionList(questions = [], options = {}) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'renderStudentServiceQuestionList', renderStudentServiceQuestionList, arguments, '');
}

function renderStudentServiceQuestionComposer(currentUser) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'renderStudentServiceQuestionComposer', renderStudentServiceQuestionComposer, arguments, '');
}

function renderStudentServiceQuestionComposerFormMarkup(currentUser) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'renderStudentServiceQuestionComposerFormMarkup', renderStudentServiceQuestionComposerFormMarkup, arguments, '');
}

function renderStudentServiceQuestionComposerModalActionsMarkup() {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'renderStudentServiceQuestionComposerModalActionsMarkup', renderStudentServiceQuestionComposerModalActionsMarkup, arguments, '');
}

function renderStudentServiceQuestionComposerModalShell(currentUser) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'renderStudentServiceQuestionComposerModalShell', renderStudentServiceQuestionComposerModalShell, arguments, '');
}

function renderStudentServiceQuestionCardPreviewMarkup(question = {}) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'renderStudentServiceQuestionCardPreviewMarkup', renderStudentServiceQuestionCardPreviewMarkup, arguments, '');
}

function renderStudentServiceQuestionFeed(questions = [], options = {}) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'renderStudentServiceQuestionFeed', renderStudentServiceQuestionFeed, arguments, '');
}

function renderStudentServiceCommentReplyShell(question, answer, skipLuxButton) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'renderStudentServiceCommentReplyShell', renderStudentServiceCommentReplyShell, arguments, '');
}


function syncStudentServiceDeleteConfirmGate() {
    const modalRoot = document.getElementById('student-service-modal-root');
    if (!modalRoot || modalRoot.hasAttribute('hidden')) return;
    const modal = modalRoot.querySelector('[data-student-service-delete-confirm="true"]');
    if (!modal) return;
    const mode = modal.dataset.studentServiceDeleteMode || '';
    if (mode !== 'article') return;
    const confirmButton = modal.querySelector('[data-student-service-delete-confirm-gate="true"]');
    if (!confirmButton) return;
    const attestations = Array.from(modal.querySelectorAll('[data-student-service-delete-attest]'));
    const ready = attestations.length > 0 && attestations.every(input => input.checked);
    confirmButton.disabled = !ready;
}

function mountStudentServiceDeleteConfirmShell(html) {
    const modalRoot = ensureStudentServiceModalRoot();
    if (!modalRoot) return;
    modalRoot.innerHTML = html;
    modalRoot.removeAttribute('hidden');
    const focusTarget = modalRoot.querySelector('.student-service-qa-delete-confirm-btn')
        || modalRoot.querySelector('[data-student-service-cancel-delete]');
    focusTarget?.focus?.();
}

function openStudentServiceDeleteConfirm(questionId, answerId) {
    closeStudentServiceQuestionComposerModal();
    closeStudentServiceDeleteConfirm();
    closeStudentServiceInlineReply();
    const question = getStudentServiceQuestionById(questionId);
    const answer = findStudentServiceAnswerRecord(question, answerId);
    if (!question || !answer || !canCurrentUserDeleteStudentServiceAnswer(question, answer)) return;
    mountStudentServiceDeleteConfirmShell(renderStudentServiceDeleteConfirmShell({
        mode: 'comment',
        question,
        answer,
        skipLuxButton: 'data-lux-skip-modern-button="true"'
    }));
}

function openStudentServiceDeleteQuestionConfirm(questionId) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'openStudentServiceDeleteQuestionConfirm', openStudentServiceDeleteQuestionConfirm, arguments, undefined);
}

function getStudentServiceArticleById(articleId) {
    const normalizedId = String(articleId || '').trim();
    if (!normalizedId) return null;
    return (ensureStudentServiceStores().articles || []).find(article => String(article.id || '').trim() === normalizedId) || null;
}

function openStudentServiceDeleteArticleConfirm(articleId) {
    if (!canShowStudentServiceArticleEditorActions()) return;
    closeStudentServiceQuestionComposerModal();
    closeStudentServiceDeleteConfirm();
    closeStudentServiceInlineReply();
    const article = getStudentServiceArticleById(articleId);
    if (!article) return;
    mountStudentServiceDeleteConfirmShell(renderStudentServiceDeleteConfirmShell({
        mode: 'article',
        article,
        skipLuxButton: 'data-lux-skip-modern-button="true"'
    }));
    syncStudentServiceDeleteConfirmGate();
}

function isStudentServiceQuestionComposerModalOpen() {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'isStudentServiceQuestionComposerModalOpen', isStudentServiceQuestionComposerModalOpen, arguments, false);
}

function mountStudentServiceQuestionComposerModal() {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'mountStudentServiceQuestionComposerModal', mountStudentServiceQuestionComposerModal, arguments, undefined);
}

function openStudentServiceQuestionComposerModal() {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'openStudentServiceQuestionComposerModal', openStudentServiceQuestionComposerModal, arguments, undefined);
}

function studentServiceShouldRestoreBodyScroll() {
    return !isStudentServiceQuestionThreadModalOpen()
        && !isStudentServiceQuestionComposerModalOpen()
        && !document.querySelector('[data-student-service-delete-confirm="true"]')
        && !isStudentServiceInboxFilterEditorOpen()
        && !isStudentServiceGuidanceModalOpen();
}

function isStudentServiceGuidanceModalOpen() {
    const modalRoot = document.getElementById('student-service-modal-root');
    return Boolean(modalRoot && !modalRoot.hasAttribute('hidden')
        && modalRoot.querySelector('[data-student-service-guidance-modal="true"]'));
}

function buildStudentServiceGuidanceModalContext(areaId = '') {
    const visibleArticles = getStudentServiceVisibleArticles();
    const visibleTickets = getStudentServiceVisibleTickets();
    const ui = ensureStudentServiceUiState();
    const normalizedAreaId = String(areaId || '').trim();
    if (normalizedAreaId) {
        const area = getStudentServiceSupportArea(normalizedAreaId);
        ui.activeSupportArea = area.id;
        ui.draftTicket.serviceArea = area.id;
        ui.draftTicket.category = getStudentServiceDefaultCategoryForArea(area.id);
    }
    const __ssBuildGuidanceCtx = window['buildStudentServiceGuidanceBrowserContext'];
    if (typeof __ssBuildGuidanceCtx !== 'function') return null;
    return __ssBuildGuidanceCtx(visibleArticles, visibleTickets);
}

function renderStudentServiceGuidanceModalShell(ctx) {
    const __ssRenderGuidanceBrowser = window['renderStudentServiceGuidanceBrowserMarkup'];
    const browserMarkup = typeof __ssRenderGuidanceBrowser === 'function' && ctx
        ? __ssRenderGuidanceBrowser(ctx.ui, ctx.filteredArticles, ctx.activeArea, ctx.selectedArea, ctx.selectedArticle)
        : renderStudentServiceEmptyState('Guidance could not load.', 'student-service-empty-state-large');
    return `
        <div class="student-service-guidance-modal-backdrop" data-student-service-dismiss-guidance-modal="true">
            <div class="student-service-guidance-modal" role="dialog" aria-modal="true" aria-labelledby="student-service-guidance-modal-title" data-student-service-guidance-modal="true">
                <div class="student-service-guidance-modal-accent" aria-hidden="true"></div>
                <header class="student-service-guidance-modal-head">
                    <div class="student-service-guidance-modal-heading">
                        <span class="student-service-guidance-modal-icon-chip"><i class="fas fa-book-open" aria-hidden="true"></i></span>
                        <div class="student-service-guidance-modal-title">
                            <strong id="student-service-guidance-modal-title">Rules & guidance</strong>
                            <span>Browse official guidance before opening a private case.</span>
                        </div>
                    </div>
                    <button type="button" class="lux-secondary-btn student-service-guidance-modal-close" data-lux-skip-modern-button="true" data-student-service-cancel-guidance-modal="true" aria-label="Close"><i class="fas fa-times" aria-hidden="true"></i></button>
                </header>
                <div class="student-service-guidance-modal-body">
                    ${browserMarkup}
                </div>
            </div>
        </div>
    `;
}

function mountStudentServiceGuidanceModal(areaId = '') {
    const ctx = buildStudentServiceGuidanceModalContext(areaId);
    const modalRoot = ensureStudentServiceModalRoot();
    modalRoot.innerHTML = renderStudentServiceGuidanceModalShell(ctx);
    modalRoot.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    modalRoot.querySelector('[data-student-service-article-search-input]')?.focus?.();
}

function openStudentServiceGuidanceModal(areaId = '') {
    const ui = ensureStudentServiceUiState();
    ui.serviceLane = 'service';
    ui.studentTab = 'get_help';
    closeStudentServiceDeleteConfirm({ restoreThread: false });
    closeStudentServiceQuestionComposerModal();
    closeStudentServiceQuestionThreadModal();
    closeStudentServiceInboxFilterEditorModal();
    const launch = () => mountStudentServiceGuidanceModal(areaId);
    const __ssRenderGuidanceBrowser = window['renderStudentServiceGuidanceBrowserMarkup'];
    if (typeof __ssRenderGuidanceBrowser === 'function') {
        launch();
        return;
    }
    ensureStudentServiceServiceModule().then(launch).catch(() => null);
}

function closeStudentServiceGuidanceModal() {
    const modalRoot = document.getElementById('student-service-modal-root');
    if (!modalRoot || !isStudentServiceGuidanceModalOpen()) return;
    modalRoot.innerHTML = '';
    modalRoot.setAttribute('hidden', '');
    if (studentServiceShouldRestoreBodyScroll()) {
        document.body.style.overflow = '';
    }
}

function remountStudentServiceGuidanceModal() {
    if (!isStudentServiceGuidanceModalOpen()) return;
    mountStudentServiceGuidanceModal();
}

function closeStudentServiceQuestionComposerModal() {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'closeStudentServiceQuestionComposerModal', closeStudentServiceQuestionComposerModal, arguments, undefined);
}

function remountStudentServiceQuestionComposerModal() {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'remountStudentServiceQuestionComposerModal', remountStudentServiceQuestionComposerModal, arguments, undefined);
}

function renderStudentServiceAnswerCardMarkup(question, answer, options = {}) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'renderStudentServiceAnswerCardMarkup', renderStudentServiceAnswerCardMarkup, arguments, '');
}

function renderStudentServiceAnswerThreadNode(question, threadEntry, cardOptions) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'renderStudentServiceAnswerThreadNode', renderStudentServiceAnswerThreadNode, arguments, '');
}

function renderStudentServiceQuestionDetailActionsMarkup(question, options = {}) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'renderStudentServiceQuestionDetailActionsMarkup', renderStudentServiceQuestionDetailActionsMarkup, arguments, '');
}

function renderStudentServiceQuestionDetail(question, options = {}) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'renderStudentServiceQuestionDetail', renderStudentServiceQuestionDetail, arguments, '');
}


function openStudentServiceTicket(ticketId) {
    return ssForwardToLoadedModule(hasStudentServiceTicketsModule, ensureStudentServiceTicketsModule, 'openStudentServiceTicket', openStudentServiceTicket, arguments, undefined);
}


function openStudentServiceArticle(articleId) {
    const ui = ensureStudentServiceUiState();
    const nextArticleId = articleId || '';
    if (ui.serviceLane === 'service' && ui.selectedArticleId === nextArticleId) {
        return;
    }
    ui.serviceLane = 'service';
    ui.selectedArticleId = nextArticleId;
    renderStudentServicePage();
}

function openStudentServiceArticleFromTicket(articleId) {
    return ssForwardToLoadedModule(hasStudentServiceTicketsModule, ensureStudentServiceTicketsModule, 'openStudentServiceArticleFromTicket', openStudentServiceArticleFromTicket, arguments, undefined);
}


function setStudentServiceArticleSearch(value) {
    const ui = ensureStudentServiceUiState();
    const nextValue = String(value || '');
    if (ui.articleSearch === nextValue) return;
    ui.articleSearch = nextValue;
    if (isStudentServiceGuidanceModalOpen()) {
        remountStudentServiceGuidanceModal();
        return;
    }
    ui.serviceLane = 'service';
    renderStudentServicePage();
}

let studentServiceTicketFilterRenderTimer = null;

function scheduleStudentServiceTicketFilterRender() {
    return ssForwardToLoadedModule(hasStudentServiceTicketsModule, ensureStudentServiceTicketsModule, 'scheduleStudentServiceTicketFilterRender', scheduleStudentServiceTicketFilterRender, arguments, undefined);
}

function setStudentServiceTicketFilter(field, value, options = {}) {
    return ssForwardToLoadedModule(hasStudentServiceTicketsModule, ensureStudentServiceTicketsModule, 'setStudentServiceTicketFilter', setStudentServiceTicketFilter, arguments, undefined);
}

function switchStudentServicePanel(panel) {
    const ui = ensureStudentServiceUiState();
    const nextLane = panel === 'qa' ? 'qa' : 'service';
    const nextPanel = ['tickets', 'articles', 'qa'].includes(panel) ? panel : 'tickets';
    if (ui.serviceLane === nextLane && ui.staffPanel === nextPanel) return;
    ui.serviceLane = nextLane;
    ui.staffPanel = nextPanel;
    renderStudentServicePage();
}

function switchStudentServiceStudentTab(tab) {
    const ui = ensureStudentServiceUiState();
    const nextTab = tab === 'my_tickets' ? 'my_tickets' : 'get_help';
    if (ui.serviceLane === 'service' && ui.studentTab === nextTab) return;
    ui.serviceLane = 'service';
    ui.studentTab = nextTab;
    renderStudentServicePage();
}

function toggleStudentServiceDetailSection(sectionKey) {
    const ui = ensureStudentServiceUiState();
    ui.detailSections[sectionKey] = !ui.detailSections[sectionKey];
    renderStudentServicePage();
}

async function refreshStudentServiceDataAndRender(force = true) {
    const ui = ensureStudentServiceUiState();
    const openQuestionId = String(ui.selectedQuestionId || '').trim();
    try {
        await fetchStudentServiceBootstrap(force);
    } catch (error) {}
    if (openQuestionId && patchStudentServiceOpenQuestionThread(openQuestionId)) {
        patchStudentServiceQuestionCardStats(openQuestionId);
        syncStudentServiceRenderSignature();
        return;
    }
    const container = document.getElementById('page-student-service');
    if (container) delete container.dataset.studentServiceRenderSignature;
    renderStudentServicePage();
    if (isStudentServiceTicketThreadModalOpen()) {
        remountStudentServiceTicketThreadModal();
    }
    scrollStudentServiceTicketChatLog();
}

function studentServiceApiPath(path) {
    if (typeof assertStudentServiceApiPath === 'function') {
        return assertStudentServiceApiPath(path);
    }
    return path;
}

function getStudentServiceBackendStaleMessage(remoteVersion = '') {
    const expected = String(window.STUDENT_SERVICE_API_MANIFEST_VERSION || '').trim();
    const remote = String(remoteVersion || '').trim();
    if (!expected) return '';
    if (!remote) {
        return 'Student Service backend is out of date (missing API manifest). Restart the local backend with "npm run stop:local && npm run start:local", then hard-refresh this page.';
    }
    if (expected === remote) return '';
    return `Student Service backend is out of date (server ${remote}, page ${expected}). Restart the local backend with "npm run stop:local && npm run start:local", then hard-refresh this page.`;
}

function ensureStudentServiceBackendContract(remoteVersion = '') {
    const message = getStudentServiceBackendStaleMessage(remoteVersion);
    if (!message) {
        STUDENT_SERVICE_RUNTIME.backendStale = false;
        STUDENT_SERVICE_RUNTIME.backendStaleMessage = '';
        return true;
    }
    STUDENT_SERVICE_RUNTIME.backendStale = true;
    STUDENT_SERVICE_RUNTIME.backendStaleMessage = message;
    console.error(message);
    return false;
}

function formatStudentServiceApiError(error, path = '') {
    const message = String(error?.message || '').trim();
    if (message === 'Route not found.') {
        const staleMessage = STUDENT_SERVICE_RUNTIME.backendStaleMessage
            || getStudentServiceBackendStaleMessage(STUDENT_SERVICE_RUNTIME.backendManifestVersion);
        if (staleMessage) return staleMessage;
        return `Student Service route is missing on the running backend (${path || 'unknown path'}). Restart the local backend with "npm run stop:local && npm run start:local", then hard-refresh this page.`;
    }
    return message || 'Student Service request failed.';
}

const STUDENT_SERVICE_MAX_ATTACHMENTS = 5;
const STUDENT_SERVICE_ATTACHMENT_ACCEPT = 'image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.zip,.txt';

function ensureStudentServiceAttachmentInput() {
    return ssForwardToLoadedModule(hasStudentServiceAttachmentsModule, ensureStudentServiceAttachmentsModule, 'ensureStudentServiceAttachmentInput', ensureStudentServiceAttachmentInput, arguments, undefined);
}

function ensureStudentServiceDraftAttachments(ui) {
    return ssForwardToLoadedModule(hasStudentServiceAttachmentsModule, ensureStudentServiceAttachmentsModule, 'ensureStudentServiceDraftAttachments', ensureStudentServiceDraftAttachments, arguments, undefined);
}

function getStudentServiceDraftAttachments(composerId) {
    return ssForwardToLoadedModule(hasStudentServiceAttachmentsModule, ensureStudentServiceAttachmentsModule, 'getStudentServiceDraftAttachments', getStudentServiceDraftAttachments, arguments, []);
}

function getStudentServiceAnswerComposerId(questionId, parentAnswerId = '') {
    return ssForwardToLoadedModule(hasStudentServiceAttachmentsModule, ensureStudentServiceAttachmentsModule, 'getStudentServiceAnswerComposerId', getStudentServiceAnswerComposerId, arguments, '');
}

function addStudentServiceDraftAttachment(composerId, file) {
    return ssForwardToLoadedModule(hasStudentServiceAttachmentsModule, ensureStudentServiceAttachmentsModule, 'addStudentServiceDraftAttachment', addStudentServiceDraftAttachment, arguments, undefined);
}

function removeStudentServiceDraftAttachment(composerId, attachmentId) {
    return ssForwardToLoadedModule(hasStudentServiceAttachmentsModule, ensureStudentServiceAttachmentsModule, 'removeStudentServiceDraftAttachment', removeStudentServiceDraftAttachment, arguments, undefined);
}

function clearStudentServiceDraftAttachments(composerId) {
    return ssForwardToLoadedModule(hasStudentServiceAttachmentsModule, ensureStudentServiceAttachmentsModule, 'clearStudentServiceDraftAttachments', clearStudentServiceDraftAttachments, arguments, undefined);
}

async function persistStudentServiceDraftAttachments(composerId) {
    return ssForwardToLoadedModule(hasStudentServiceAttachmentsModule, ensureStudentServiceAttachmentsModule, 'persistStudentServiceDraftAttachments', persistStudentServiceDraftAttachments, arguments, []);
}

function resolveStudentServiceAttachmentUrl(file) {
    return ssForwardToLoadedModule(hasStudentServiceAttachmentsModule, ensureStudentServiceAttachmentsModule, 'resolveStudentServiceAttachmentUrl', resolveStudentServiceAttachmentUrl, arguments, '');
}

function isStudentServiceImageAttachment(file) {
    return ssForwardToLoadedModule(hasStudentServiceAttachmentsModule, ensureStudentServiceAttachmentsModule, 'isStudentServiceImageAttachment', isStudentServiceImageAttachment, arguments, false);
}

function isStudentServiceVideoAttachment(file) {
    return ssForwardToLoadedModule(hasStudentServiceAttachmentsModule, ensureStudentServiceAttachmentsModule, 'isStudentServiceVideoAttachment', isStudentServiceVideoAttachment, arguments, false);
}

function renderStudentServiceAttachmentGalleryMarkup(attachments = []) {
    return ssForwardToLoadedModule(hasStudentServiceAttachmentsModule, ensureStudentServiceAttachmentsModule, 'renderStudentServiceAttachmentGalleryMarkup', renderStudentServiceAttachmentGalleryMarkup, arguments, '');
}

function renderStudentServiceAttachmentChipsMarkup(composerId, drafts) {
    return ssForwardToLoadedModule(hasStudentServiceAttachmentsModule, ensureStudentServiceAttachmentsModule, 'renderStudentServiceAttachmentChipsMarkup', renderStudentServiceAttachmentChipsMarkup, arguments, '');
}

function renderStudentServiceAttachmentPickerMarkup(composerId, options = {}) {
    return ssForwardToLoadedModule(hasStudentServiceAttachmentsModule, ensureStudentServiceAttachmentsModule, 'renderStudentServiceAttachmentPickerMarkup', renderStudentServiceAttachmentPickerMarkup, arguments, '');
}

function pickStudentServiceAttachments(composerId) {
    return ssForwardToLoadedModule(hasStudentServiceAttachmentsModule, ensureStudentServiceAttachmentsModule, 'pickStudentServiceAttachments', pickStudentServiceAttachments, arguments, undefined);
}

async function postStudentService(path, body = {}) {
    if (typeof kiuPortalFetch !== 'function') {
        throw new Error('Student Service backend is unavailable.');
    }
    if (STUDENT_SERVICE_RUNTIME.backendStale) {
        throw new Error(STUDENT_SERVICE_RUNTIME.backendStaleMessage || getStudentServiceBackendStaleMessage(''));
    }
    const resolvedPath = studentServiceApiPath(path);
    try {
        return await kiuPortalFetch(resolvedPath, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body || {})
        });
    } catch (error) {
        error.message = formatStudentServiceApiError(error, resolvedPath);
        throw error;
    }
}

async function submitStudentServiceTicket() {
    return ssForwardToLoadedModule(hasStudentServiceTicketsModule, ensureStudentServiceTicketsModule, 'submitStudentServiceTicket', submitStudentServiceTicket, arguments, null);
}

async function replyStudentServiceTicket() {
    return ssForwardToLoadedModule(hasStudentServiceTicketsModule, ensureStudentServiceTicketsModule, 'replyStudentServiceTicket', replyStudentServiceTicket, arguments, null);
}

async function updateStudentServiceTicketStatus(status) {
    return ssForwardToLoadedModule(hasStudentServiceTicketsModule, ensureStudentServiceTicketsModule, 'updateStudentServiceTicketStatus', updateStudentServiceTicketStatus, arguments, null);
}

async function assignStudentServiceTicketToCurrentUser() {
    return ssForwardToLoadedModule(hasStudentServiceTicketsModule, ensureStudentServiceTicketsModule, 'assignStudentServiceTicketToCurrentUser', assignStudentServiceTicketToCurrentUser, arguments, null);
}

async function submitStudentServiceQuestion() {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'submitStudentServiceQuestion', submitStudentServiceQuestion, arguments, null);
}

async function submitStudentServiceQuestionAnswer(questionId, triggerElement = null, options = {}) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'submitStudentServiceQuestionAnswer', submitStudentServiceQuestionAnswer, arguments, null);
}

function patchStudentServiceOwnerResolutionUi(questionId) {
    const question = getStudentServiceQuestionById(questionId);
    if (!question) return false;
    const host = getStudentServiceQuestionThreadHost(questionId);
    const detail = host?.querySelector('.student-service-qa-detail');
    if (detail) {
        updateStudentServiceOwnerResolutionButtons(detail, question);
        const meta = detail.querySelector('.student-service-qa-detail-meta');
        if (meta) {
            meta.querySelectorAll('.student-service-pill--owner-answered, .student-service-pill--owner-unanswered').forEach(node => node.remove());
            const ownerPill = renderStudentServiceOwnerResolutionPillMarkup(question);
            if (ownerPill) meta.insertAdjacentHTML('beforeend', ownerPill);
        }
    }
    patchStudentServiceQuestionCardStats(questionId);
    return true;
}

async function setStudentServiceQuestionOwnerResolution(questionId, status, triggerButton = null) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'setStudentServiceQuestionOwnerResolution', setStudentServiceQuestionOwnerResolution, arguments, null);
}

async function setStudentServiceQuestionFeedback(questionId, value, triggerButton = null) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'setStudentServiceQuestionFeedback', setStudentServiceQuestionFeedback, arguments, null);
}

async function setStudentServiceAnswerFeedback(questionId, answerId, triggerButton = null) {
    return ssForwardToLoadedModule(hasStudentServiceQaModule, ensureStudentServiceQaModule, 'setStudentServiceAnswerFeedback', setStudentServiceAnswerFeedback, arguments, null);
}

        const api = {
            updateStudentServiceOwnerResolutionButtons,
            renderStudentServiceOwnerResolutionButtonMarkup,
            renderStudentServiceQuestionHelpfulButtonMarkup,
            updateStudentServiceQuestionHelpfulButton,
            triggerStudentServiceHelpfulAnimation,
            flashStudentServiceActionButton,
            setStudentServiceActionButtonPending,
            patchStudentServiceQuestionHelpfulUi,
            isStudentServiceAnswerHelpfulVoted,
            renderStudentServiceAnswerHelpfulButtonMarkup,
            updateStudentServiceAnswerHelpfulButton,
            patchStudentServiceAnswerHelpfulBtn,
            removeStudentServiceAnswerBranch,
            applyStudentServiceQuestionMutation,
            patchStudentServiceOpenQuestionThread,
            ensureStudentServiceOperationsShell,
            renderStudentServiceOperationsHeadMarkup,
            renderStudentServiceOperationsStatsMarkup,
            renderStudentServiceOperationsQueueMarkup,
            renderStudentServiceOperationsLanesMarkup,
            renderStudentServiceOperationsStrip,
            renderStudentServiceHomeWorkspaceRebuilt,
            setStudentServiceQuestionFilter,
            setStudentServiceQuestionComposerExpanded,
            setStudentServiceDraftQuestionField,
            openStudentServiceQuestion,
            setStudentServiceReplyTarget,
            clearStudentServiceReplyTarget,
            getStudentServiceQuestionStatusLabel,
            getStudentServiceQuestionStatusClass,
            getStudentServiceQuestionAnswerCount,
            renderStudentServiceQuestionList,
            renderStudentServiceQuestionComposer,
            renderStudentServiceQuestionComposerFormMarkup,
            renderStudentServiceQuestionComposerModalActionsMarkup,
            renderStudentServiceQuestionComposerModalShell,
            renderStudentServiceQuestionCardPreviewMarkup,
            renderStudentServiceQuestionFeed,
            renderStudentServiceCommentReplyShell,
            syncStudentServiceDeleteConfirmGate,
            mountStudentServiceDeleteConfirmShell,
            openStudentServiceDeleteConfirm,
            openStudentServiceDeleteQuestionConfirm,
            getStudentServiceArticleById,
            openStudentServiceDeleteArticleConfirm,
            isStudentServiceQuestionComposerModalOpen,
            mountStudentServiceQuestionComposerModal,
            openStudentServiceQuestionComposerModal,
            studentServiceShouldRestoreBodyScroll,
            isStudentServiceGuidanceModalOpen,
            buildStudentServiceGuidanceModalContext,
            renderStudentServiceGuidanceModalShell,
            mountStudentServiceGuidanceModal,
            openStudentServiceGuidanceModal,
            closeStudentServiceGuidanceModal,
            remountStudentServiceGuidanceModal,
            closeStudentServiceQuestionComposerModal,
            remountStudentServiceQuestionComposerModal,
            renderStudentServiceAnswerCardMarkup,
            renderStudentServiceAnswerThreadNode,
            renderStudentServiceQuestionDetailActionsMarkup,
            renderStudentServiceQuestionDetail,
            openStudentServiceTicket,
            openStudentServiceArticle,
            openStudentServiceArticleFromTicket,
            setStudentServiceArticleSearch,
            scheduleStudentServiceTicketFilterRender,
            setStudentServiceTicketFilter,
            switchStudentServicePanel,
            switchStudentServiceStudentTab,
            toggleStudentServiceDetailSection,
            refreshStudentServiceDataAndRender,
            studentServiceApiPath,
            getStudentServiceBackendStaleMessage,
            ensureStudentServiceBackendContract,
            formatStudentServiceApiError,
            ensureStudentServiceAttachmentInput,
            ensureStudentServiceDraftAttachments,
            getStudentServiceDraftAttachments,
            getStudentServiceAnswerComposerId,
            addStudentServiceDraftAttachment,
            removeStudentServiceDraftAttachment,
            clearStudentServiceDraftAttachments,
            persistStudentServiceDraftAttachments,
            resolveStudentServiceAttachmentUrl,
            isStudentServiceImageAttachment,
            isStudentServiceVideoAttachment,
            renderStudentServiceAttachmentGalleryMarkup,
            renderStudentServiceAttachmentChipsMarkup,
            renderStudentServiceAttachmentPickerMarkup,
            pickStudentServiceAttachments,
            postStudentService,
            submitStudentServiceTicket,
            replyStudentServiceTicket,
            updateStudentServiceTicketStatus,
            assignStudentServiceTicketToCurrentUser,
            submitStudentServiceQuestion,
            submitStudentServiceQuestionAnswer,
            patchStudentServiceOwnerResolutionUi,
            setStudentServiceQuestionOwnerResolution,
            setStudentServiceQuestionFeedback,
            setStudentServiceAnswerFeedback,
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateStudentServiceOpsApi({});
})();
