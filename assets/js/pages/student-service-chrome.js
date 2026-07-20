/* Student Service chrome UI (command bar, lane chooser, delete confirm shell).
 * Peeled from student-service.js. Load after student-service-model.js and before student-service.js.
 * Free vars resolve at call time against globals from student-service.js.
 */
if (!window.__KIU_STUDENT_SERVICE_CHROME_LOADED) {
window.__KIU_STUDENT_SERVICE_CHROME_LOADED = true;

function buildStudentServiceLaneMetrics(role, currentUser, visibleArticles, visibleTickets) {
    const totalTickets = Array.isArray(visibleTickets) ? visibleTickets : [];
    const totalArticles = Array.isArray(visibleArticles) ? visibleArticles : [];
    const visibleQuestions = getStudentServiceVisibleQuestions();
    const myTickets = currentUser?.id
        ? totalTickets.filter(ticket => String(ticket.studentId || '') === String(currentUser.id || '')).length
        : 0;
    const myQuestionRecords = currentUser?.id
        ? visibleQuestions.filter(question => String(question.authorId || '') === String(currentUser.id || ''))
        : [];
    const myQuestions = myQuestionRecords.length;
    const myPublishedQuestions = myQuestionRecords.filter(question => question.status === 'published').length;
    const myAnsweredQuestions = myQuestionRecords.filter(question => (question.answers || []).some(answer => answer.status === 'published')).length;
    const myAcceptedQuestions = myQuestionRecords.filter(question => Boolean(question.acceptedAnswerId)).length;
    const openTickets = totalTickets.filter(ticket => !['Resolved', 'Closed'].includes(ticket.status));
    const publishedQuestions = visibleQuestions.filter(question => question.status === 'published').length;
    const unansweredQuestions = visibleQuestions.filter(question => !(question.answers || []).some(answer => answer.status === 'published')).length;
    const waitingForService = totalTickets.filter(ticket => ticket.status === 'Waiting for Service').length;
    const waitingForStudent = totalTickets.filter(ticket => ticket.status === 'Waiting for Student').length;

    return {
        totalTickets,
        totalArticles,
        visibleQuestions,
        myTickets,
        myQuestions,
        myPublishedQuestions,
        myAnsweredQuestions,
        myAcceptedQuestions,
        openTickets,
        publishedQuestions,
        unansweredQuestions,
        waitingForService,
        waitingForStudent,
        servicePrimaryCount: role === USER_ROLES.STUDENT ? myTickets : openTickets.length,
        qaPrimaryCount: role === USER_ROLES.STUDENT ? myQuestions : unansweredQuestions
    };
}

function renderStudentServiceChooserHeader() {
    return `
        <section class="student-service-command-bar-shell student-service-command-bar-shell--chooser">
            <div class="student-service-command-bar">
                <strong class="student-service-command-bar-title">Student Service</strong>
                <span class="student-service-command-bar-metrics">Choose how you want help</span>
            </div>
        </section>
    `;
}

function renderStudentServiceQaCommandBarStats(role, metrics, ui) {
    if (hasStudentServiceQaModule()
        && typeof window.renderStudentServiceQaCommandBarStats === 'function'
        && window.renderStudentServiceQaCommandBarStats !== renderStudentServiceQaCommandBarStats) {
        return window.renderStudentServiceQaCommandBarStats.apply(null, arguments);
    }
    ensureStudentServiceQaModule().catch(() => null);
    return '';
}

function renderStudentServiceStaffPanelSwitchMarkup(panel = 'tickets') {
    const activePanel = panel === 'articles' ? 'articles' : 'tickets';
    return `
        <div class="student-service-panel-switch student-service-desk-mode-switch" role="group" aria-label="Desk mode">
            <button type="button" class="student-service-desk-mode-btn ${activePanel === 'tickets' ? 'is-active lux-primary-btn' : 'lux-secondary-btn'}" data-student-service-panel-switch="tickets"><i class="fas fa-inbox"></i> Inbox</button>
            <button type="button" class="student-service-desk-mode-btn ${activePanel === 'articles' ? 'is-active lux-primary-btn' : 'lux-secondary-btn'}" data-student-service-panel-switch="articles"><i class="fas fa-book-open"></i> Knowledge</button>
        </div>
    `;
}

function renderStudentServiceCommandBar(role, selectedLane, ui, metrics) {
    if (!selectedLane) return '';
    const responderOnly = [USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(role) && !canCurrentUserModerateStudentService();
    const isStudent = role === USER_ROLES.STUDENT;
    const panel = ui.staffPanel || 'tickets';
    const laneTabs = `
        <div class="student-service-command-bar-segment" role="group" aria-label="Workspace lanes">
            <button type="button" class="student-service-command-bar-btn ${selectedLane === 'service' ? 'is-active lux-primary-btn' : 'lux-secondary-btn'}" data-student-service-lane="service" aria-pressed="${selectedLane === 'service' ? 'true' : 'false'}"><i class="fas fa-headset"></i> ${isStudent ? 'Help' : 'Service'}</button>
            <button type="button" class="student-service-command-bar-btn ${selectedLane === 'qa' ? 'is-active lux-primary-btn' : 'lux-secondary-btn'}" data-student-service-lane="qa" aria-pressed="${selectedLane === 'qa' ? 'true' : 'false'}"><i class="fas fa-comments"></i> Q&A</button>
        </div>
    `;
    let modeTabs = '';
    if (isStudent && selectedLane === 'service') {
        modeTabs = `
            <div class="student-service-command-bar-segment" role="group" aria-label="Student tabs">
                <button type="button" class="student-service-command-bar-btn ${ui.studentTab !== 'my_tickets' ? 'is-active lux-primary-btn' : 'lux-secondary-btn'}" data-student-service-student-tab="get_help"><i class="fas fa-paper-plane"></i> Get help</button>
                <button type="button" class="student-service-command-bar-btn ${ui.studentTab === 'my_tickets' ? 'is-active lux-primary-btn' : 'lux-secondary-btn'}" data-student-service-student-tab="my_tickets"><i class="fas fa-inbox"></i> My tickets</button>
            </div>
        `;
    }
    const metricsLine = selectedLane === 'service'
        ? (isStudent
            ? `${metrics.servicePrimaryCount} tickets · ${metrics.totalArticles.length} articles`
            : `${metrics.servicePrimaryCount} open · ${metrics.waitingForService + metrics.waitingForStudent} waiting · ${metrics.totalArticles.length} articles`)
        : '';
    let actions = '';
    if (!isStudent && selectedLane === 'service' && !responderOnly && panel === 'tickets' && canCurrentUserModerateStudentService()) {
        actions = `
            <div class="student-service-command-bar-actions">
                <button type="button" class="student-service-mini-action" data-student-service-edit-inbox-filters="true"><i class="fas fa-pen"></i> Edit layout</button>
            </div>
        `;
    } else if (selectedLane === 'qa' && isStudent) {
        actions = `<button type="button" class="lux-primary-btn student-service-command-bar-cta" data-student-service-question-composer-toggle="open"><i class="fas fa-pen"></i> Ask</button>`;
    }
    const title = isStudent
        ? 'Student Service'
        : (role === USER_ROLES.STUDENT_SERVICE ? 'Student Service Workspace' : 'Student Service');
    if (selectedLane === 'qa') {
        return `
            <section class="student-service-command-bar-shell student-service-command-bar-shell--qa" data-student-service-command-bar="true">
                <div class="student-service-command-bar student-service-command-bar--qa">
                    <div class="student-service-command-bar-top">
                        <div class="student-service-command-bar-main">
                            ${laneTabs}
                        </div>
                        <div class="student-service-command-bar-meta">
                            ${renderStudentServiceQaCommandBarStats(role, metrics, ui)}
                            ${actions}
                        </div>
                    </div>
                </div>
            </section>
        `;
    }
    const studentModeTabs = modeTabs
        ? `<div class="student-service-command-bar-actions">${modeTabs}</div>`
        : '';
    return `
        <section class="student-service-command-bar-shell" data-student-service-command-bar="true">
            <div class="student-service-command-bar">
                <div class="student-service-command-bar-main">
                    <strong class="student-service-command-bar-title">${ssEscape(title)}</strong>
                    ${laneTabs}
                </div>
                <div class="student-service-command-bar-meta">
                    <span class="student-service-command-bar-metrics">${ssEscape(metricsLine)}</span>
                    ${studentModeTabs}
                    ${actions}
                </div>
            </div>
        </section>
    `;
}

function renderStudentServiceDeleteConfirmShell(options = {}) {
    const {
        mode = 'comment',
        question = {},
        answer = {},
        article = {},
        skipLuxButton = 'data-lux-skip-modern-button="true"'
    } = options;
    const isQuestionDelete = mode === 'question';
    const isArticleDelete = mode === 'article';
    const dialogTitle = isArticleDelete
        ? 'Remove article'
        : isQuestionDelete
            ? 'Delete question'
            : 'Delete comment';
    const dialogSubtitle = isArticleDelete
        ? 'This permanently removes the article from the knowledge base.'
        : isQuestionDelete
            ? 'This removes the question and all comments permanently.'
            : 'This cannot be undone.';
    const confirmLabel = isArticleDelete
        ? 'Remove article'
        : isQuestionDelete
            ? 'Delete question'
            : 'Delete comment';
    const authorName = isArticleDelete
        ? 'Knowledge base'
        : isQuestionDelete
            ? (getStudentServiceQuestionAuthorLabel(question) || 'Student')
            : (answer.responderName || answer.authorDisplayName || 'Responder');
    const previewTitle = isArticleDelete
        ? String(article.title || 'Untitled article')
        : isQuestionDelete
            ? String(question.title || 'Untitled question')
            : '';
    const previewBody = isArticleDelete
        ? String(article.summary || article.content || '')
        : isQuestionDelete
            ? String(question.body || '')
            : String(answer.body || '');
    const previewTime = isArticleDelete
        ? ssFormatDateTime(article.updatedAt || article.createdAt)
        : isQuestionDelete
            ? ssFormatDateTime(question.updatedAt || question.createdAt)
            : ssFormatDateTime(answer.updatedAt || answer.createdAt);
    const confirmAttrs = isArticleDelete
        ? `data-student-service-confirm-article-delete="${ssEscape(article.id)}" data-student-service-delete-confirm-gate="true" disabled`
        : isQuestionDelete
            ? `data-student-service-confirm-question-delete="${ssEscape(question.id)}"`
            : `data-student-service-confirm-delete="${ssEscape(answer.id)}" data-student-service-question-id="${ssEscape(question.id)}"`;
    const modalMode = isArticleDelete ? 'article' : isQuestionDelete ? 'question' : 'comment';
    const modalClass = [
        'student-service-qa-delete-modal',
        'student-service-qa-delete-confirm',
        isQuestionDelete ? 'is-question-delete' : '',
        isArticleDelete ? 'is-article-delete' : ''
    ].filter(Boolean).join(' ');
    const attestationMarkup = isArticleDelete
        ? `
            <div class="student-service-qa-delete-confirm-attestations">
                <label class="student-service-qa-delete-confirm-attest">
                    <input type="checkbox" data-student-service-delete-attest="removal">
                    <span>I understand this article will be permanently removed.</span>
                </label>
                ${isArticleDelete && article.published ? `
                <label class="student-service-qa-delete-confirm-attest">
                    <input type="checkbox" data-student-service-delete-attest="published">
                    <span>This article is published and visible to students.</span>
                </label>
                ` : ''}
            </div>
        `
        : '';
    return `
        <div class="student-service-qa-delete-modal-backdrop" data-student-service-dismiss-delete-modal="true">
            <div class="${modalClass}" role="dialog" aria-modal="true" aria-labelledby="student-service-delete-modal-title" data-student-service-delete-confirm="true" data-student-service-delete-mode="${modalMode}">
                <div class="student-service-qa-delete-confirm-accent" aria-hidden="true"></div>
                <div class="student-service-qa-delete-confirm-head">
                    <div class="student-service-qa-delete-confirm-heading">
                        <span class="student-service-qa-delete-confirm-icon-chip"><i class="fas fa-trash" aria-hidden="true"></i></span>
                        <div class="student-service-qa-delete-confirm-title">
                            <strong class="student-service-qa-delete-confirm-dialog-title" id="student-service-delete-modal-title">${ssEscape(dialogTitle)}</strong>
                            <span class="student-service-qa-delete-confirm-dialog-subtitle">${ssEscape(dialogSubtitle)}</span>
                        </div>
                    </div>
                    <button type="button" class="social-neo-btn social-neo-btn-ghost student-service-qa-delete-confirm-close" ${skipLuxButton} data-student-service-cancel-delete="true" aria-label="Close"><i class="fas fa-times" aria-hidden="true"></i></button>
                </div>
                <div class="student-service-qa-delete-confirm-preview">
                    <div class="student-service-qa-delete-confirm-author">
                        <span class="social-neo-avatar social-neo-avatar-sm is-fallback student-service-qa-avatar student-service-qa-avatar-sm">${ssEscape(ssInitials(authorName, isArticleDelete ? 'K' : isQuestionDelete ? 'S' : 'R'))}</span>
                        <div class="student-service-qa-delete-confirm-author-meta">
                            <strong>${ssEscape(authorName)}</strong>
                            <span>${ssEscape(previewTime)}</span>
                        </div>
                    </div>
                    ${previewTitle ? `<div class="student-service-qa-delete-confirm-question-title">${ssEscape(previewTitle)}</div>` : ''}
                    <blockquote class="student-service-qa-delete-confirm-quote">${ssTextBlock(previewBody)}</blockquote>
                    ${isQuestionDelete ? '<p class="student-service-qa-delete-confirm-warning">All comments on this thread will also be removed.</p>' : ''}
                    ${attestationMarkup}
                </div>
                <div class="student-service-qa-delete-confirm-actions">
                    <button type="button" class="social-neo-btn social-neo-btn-ghost student-service-qa-delete-confirm-cancel" ${skipLuxButton} data-student-service-cancel-delete="true">Cancel</button>
                    <button type="button" class="social-neo-btn social-neo-btn-danger student-service-qa-delete-confirm-btn" ${skipLuxButton} ${confirmAttrs}>${ssEscape(confirmLabel)}</button>
                </div>
            </div>
        </div>
    `;
}

function renderStudentServiceLaneChooser(role, currentUser, visibleArticles, visibleTickets) {
    const metrics = buildStudentServiceLaneMetrics(role, currentUser, visibleArticles, visibleTickets);
    const serviceCopy = role === USER_ROLES.STUDENT
        ? 'Private help, official rules, and tracked ticket threads when the issue is personal or sensitive.'
        : [USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(role)
            ? 'Read official guidance and see where private student cases stay with Student Service.'
            : 'Private queue work, article publishing, and operational service follow-up.'
    ;
    const qaCopy = role === USER_ROLES.STUDENT
        ? 'Browse the campus feed, post questions instantly, and reply in open threads.'
        : [USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(role)
            ? 'Answer faculty-scoped questions in open chat threads alongside students and staff.'
            : 'Moderate threads, pin useful answers, and keep the public feed healthy.'
    ;

    return `
        <div class="student-service-lane-chooser">
            <section class="student-service-zone student-service-zone-chooser">
                <div class="student-service-lane-choice-grid" role="group" aria-label="Choose Student Service lane">
                    <button type="button" class="student-service-lane-choice-card student-service-lane-choice-card--service" data-student-service-lane="service">
                        <div class="student-service-lane-choice-kicker">Private support</div>
                        <div class="student-service-lane-choice-title">Student Service</div>
                        <div class="student-service-lane-choice-copy">${ssEscape(serviceCopy)}</div>
                        <div class="student-service-lane-choice-stats">
                            <span>${metrics.servicePrimaryCount} ${role === USER_ROLES.STUDENT ? 'my tickets' : 'active tickets'}</span>
                            <span>${metrics.totalArticles.length} guidance articles</span>
                        </div>
                        <span class="student-service-lane-choice-cta">Open Student Service <i class="fas fa-arrow-right"></i></span>
                    </button>
                    <button type="button" class="student-service-lane-choice-card student-service-lane-choice-card--qa" data-student-service-lane="qa">
                        <div class="student-service-lane-choice-kicker">Public answers</div>
                        <div class="student-service-lane-choice-title">Q&A</div>
                        <div class="student-service-lane-choice-copy">${ssEscape(qaCopy)}</div>
                        <div class="student-service-lane-choice-stats">
                            <span>${metrics.publishedQuestions} published questions</span>
                            <span>${metrics.qaPrimaryCount} ${role === USER_ROLES.STUDENT ? 'my questions' : 'unanswered'}</span>
                        </div>
                        <span class="student-service-lane-choice-cta">Open Q&A <i class="fas fa-arrow-right"></i></span>
                    </button>
                </div>
            </section>
        </div>
    `;
}

function buildStudentServiceChromeSignature(role, currentUser, visibleArticles, visibleTickets) {
    const ui = ensureStudentServiceUiState();
    const metrics = buildStudentServiceLaneMetrics(role, currentUser, visibleArticles, visibleTickets);
    return [
        role,
        String(currentUser?.id || ''),
        getStudentServiceLane(),
        ui.studentTab || '',
        ui.staffPanel || '',
        metrics.servicePrimaryCount,
        metrics.myQuestions,
        metrics.unansweredQuestions,
        metrics.publishedQuestions,
        metrics.totalArticles.length,
        visibleArticles.length,
        visibleTickets.length,
        STUDENT_SERVICE_RUNTIME.loaded ? 'loaded' : 'loading',
        STUDENT_SERVICE_RUNTIME.loadFailed ? 'failed' : 'ok'
    ].join('|');
}

function renderStudentServicePageChromeRebuilt(role, currentUser, visibleArticles, visibleTickets) {
    const container = document.getElementById('page-student-service');
    if (!container) return;
    const ui = ensureStudentServiceUiState();
    const selectedLane = getStudentServiceLane();
    const metrics = buildStudentServiceLaneMetrics(role, currentUser, visibleArticles, visibleTickets);
    const shell = ensureStudentServicePageShell(container);
    if (!shell) return;

    if (selectedLane) {
        setStudentServiceMarkup(
            shell.hero,
            `student-service-page:command-bar:${selectedLane}:${ui.staffPanel || ''}:${ui.studentTab || ''}:${ui.qaSearch || ''}:${metrics.unansweredQuestions}:${metrics.publishedQuestions}:${metrics.myQuestions}`,
            renderStudentServiceCommandBar(role, selectedLane, ui, metrics)
        );
        setStudentServiceMarkup(shell.switcher, 'student-service-page:switcher', '');
        setStudentServiceMarkup(shell.workflow, 'student-service-page:workflow', '');
        setStudentServiceMarkup(
            shell.overview,
            `student-service-page:overview:${STUDENT_SERVICE_RUNTIME.loadFailed ? 'failed' : 'ok'}`,
            STUDENT_SERVICE_RUNTIME.loadFailed ? renderStudentServiceBootstrapErrorBanner() : ''
        );
        return;
    }

    setStudentServiceMarkup(shell.hero, 'student-service-page:chooser-header', renderStudentServiceChooserHeader());
    setStudentServiceMarkup(shell.switcher, 'student-service-page:switcher', '');
    setStudentServiceMarkup(shell.workflow, 'student-service-page:workflow', '');
    setStudentServiceMarkup(
        shell.overview,
        `student-service-page:overview:${STUDENT_SERVICE_RUNTIME.loadFailed ? 'failed' : 'ok'}`,
        STUDENT_SERVICE_RUNTIME.loadFailed ? renderStudentServiceBootstrapErrorBanner() : ''
    );
}

window.buildStudentServiceLaneMetrics = buildStudentServiceLaneMetrics;
window.renderStudentServiceChooserHeader = renderStudentServiceChooserHeader;
window.renderStudentServiceQaCommandBarStats = renderStudentServiceQaCommandBarStats;
window.renderStudentServiceStaffPanelSwitchMarkup = renderStudentServiceStaffPanelSwitchMarkup;
window.renderStudentServiceCommandBar = renderStudentServiceCommandBar;
window.renderStudentServiceDeleteConfirmShell = renderStudentServiceDeleteConfirmShell;
window.renderStudentServiceLaneChooser = renderStudentServiceLaneChooser;
window.buildStudentServiceChromeSignature = buildStudentServiceChromeSignature;
window.renderStudentServicePageChromeRebuilt = renderStudentServicePageChromeRebuilt;
}
