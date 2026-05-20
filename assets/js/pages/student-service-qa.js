(function initStudentServiceQaModule() {
    if (window.__KIU_STUDENT_SERVICE_QA_MODULE_LOADED) return;
    window.__KIU_STUDENT_SERVICE_QA_MODULE_LOADED = true;

    function ensureStudentServiceStudentQaShell(container) {
        if (!container) return null;
        let shell = container.querySelector('[data-student-service-student-qa-shell="1"]');
        if (!shell) {
            const range = document.createRange();
            range.selectNodeContents(container);
            container.replaceChildren(range.createContextualFragment(`
                <div class="student-service-student-shell" data-student-service-student-qa-shell="1">
                    <div data-student-service-student-qa-ops="1"></div>
                    <div data-student-service-student-qa-composer="1"></div>
                    <div data-student-service-student-qa-feed="1"></div>
                </div>
            `));
            shell = container.querySelector('[data-student-service-student-qa-shell="1"]');
        }
        return {
            ops: shell?.querySelector('[data-student-service-student-qa-ops="1"]') || null,
            composer: shell?.querySelector('[data-student-service-student-qa-composer="1"]') || null,
            feed: shell?.querySelector('[data-student-service-student-qa-feed="1"]') || null
        };
    }

    function renderStudentServiceStudentQaOpsMarkup(ui, myQuestions, myPendingCount, myAnsweredCount, myAcceptedCount, myPublishedCount) {
        return `
            <section class="student-service-zone student-service-zone-ops">
                <div class="student-service-zone-head">
                    <div>
                        <div class="student-service-kicker">Q&A</div>
                        <div class="student-service-zone-title">A campus feed for reusable questions and answers.</div>
                        <div class="student-service-zone-copy">Scroll the feed, open threads inline, and post only when the answer could help more than one student.</div>
                    </div>
                    <button type="button" class="student-service-mini-action" data-student-service-question-composer-toggle="toggle"><i class="fas ${ui.qaComposerExpanded ? 'fa-chevron-up' : 'fa-pen'}"></i> ${ui.qaComposerExpanded ? 'Hide composer' : 'Ask something'}</button>
                </div>
                <div class="student-service-qa-activity-row">
                    <span class="student-service-pill">My questions ${myQuestions.length}</span>
                    <span class="student-service-pill">Pending review ${myPendingCount}</span>
                    <span class="student-service-pill">Answered ${myAnsweredCount}</span>
                    <span class="student-service-pill">Accepted ${myAcceptedCount}</span>
                    <span class="student-service-pill">Published ${myPublishedCount}</span>
                </div>
            </section>
        `;
    }

    function renderStudentServiceStudentQaFeedMarkup(ui, filteredQuestions, selectedQuestion) {
        return `
            <section class="student-service-zone student-service-zone-find">
                <div class="student-service-zone-head">
                    <div>
                        <div class="student-service-kicker">Campus feed</div>
                        <div class="student-service-zone-title">Search first, then open the thread that fits your question.</div>
                        <div class="student-service-zone-copy">Questions stay in one central feed, and each thread expands inline instead of opening a separate detail pane.</div>
                    </div>
                    <span class="student-service-panel-chip">${filteredQuestions.length} question${filteredQuestions.length === 1 ? '' : 's'}</span>
                </div>
                <div class="student-service-find-search student-service-qa-searchbar">
                    <i class="fas fa-search"></i>
                    <input id="student-service-qa-search" type="search" value="${ssEscape(ui.qaSearch || '')}" data-student-service-question-filter-input="qaSearch" placeholder="Search public questions, answers, or keywords">
                </div>
                ${renderStudentServiceQuestionFilterChips({ mode: 'student' })}
                <div class="student-service-qa-feed-wrap">
                    ${renderStudentServiceQuestionFeed(filteredQuestions, { mode: 'student', selectedQuestionId: selectedQuestion?.id || '' }) || '<div class="student-service-empty-state">No public questions match the current filters.</div>'}
                </div>
            </section>
        `;
    }

    window.renderStudentServiceStudentQaHub = function renderStudentServiceStudentQaHub(container) {
        const ui = ensureStudentServiceUiState();
        const currentUser = getStudentServiceCurrentUser();
        const filteredQuestions = getStudentServiceFilteredQuestions(getStudentServiceVisibleQuestions());
        const selectedQuestion = getStudentServiceOpenQuestion(filteredQuestions);
        const allVisibleQuestions = getStudentServiceVisibleQuestions();
        const myQuestions = allVisibleQuestions.filter(question => String(question.authorId || '') === String(currentUser?.id || ''));
        const myPublishedCount = myQuestions.filter(question => question.status === 'published').length;
        const myPendingCount = myQuestions.filter(question => question.status === 'pending_review').length;
        const myAnsweredCount = myQuestions.filter(question => (question.answers || []).some(answer => answer.status === 'published')).length;
        const myAcceptedCount = myQuestions.filter(question => Boolean(question.acceptedAnswerId)).length;
        const shell = ensureStudentServiceStudentQaShell(container);
        if (!shell) return;
        setStudentServiceMarkup(
            shell.ops,
            'student-service-student-qa:ops',
            renderStudentServiceStudentQaOpsMarkup(ui, myQuestions, myPendingCount, myAnsweredCount, myAcceptedCount, myPublishedCount)
        );
        setStudentServiceMarkup(
            shell.composer,
            `student-service-student-qa:composer:${ui.qaComposerExpanded ? 'open' : 'closed'}:${getCurrentUserId() || 'anonymous'}`,
            renderStudentServiceQuestionComposer(currentUser)
        );
        setStudentServiceMarkup(
            shell.feed,
            `student-service-student-qa:feed:${ui.qaSearch || ''}:${ui.qaCategory || ''}:${ui.qaFaculty || ''}:${ui.qaStatus || ''}:${selectedQuestion?.id || ''}:${filteredQuestions.length}`,
            renderStudentServiceStudentQaFeedMarkup(ui, filteredQuestions, selectedQuestion)
        );
    };

    function ensureStudentServiceStaffQaShell(container) {
        if (!container) return null;
        let shell = container.querySelector('[data-student-service-staff-qa-shell="1"]');
        if (!shell) {
            const range = document.createRange();
            range.selectNodeContents(container);
            container.replaceChildren(range.createContextualFragment(`
                <div class="student-service-staff-shell" data-student-service-staff-qa-shell="1">
                    <div data-student-service-staff-qa-summary="1"></div>
                    <div data-student-service-staff-qa-feed="1"></div>
                </div>
            `));
            shell = container.querySelector('[data-student-service-staff-qa-shell="1"]');
        }
        return {
            summary: shell?.querySelector('[data-student-service-staff-qa-summary="1"]') || null,
            feed: shell?.querySelector('[data-student-service-staff-qa-feed="1"]') || null
        };
    }

    function renderStudentServiceStaffQaSummaryMarkup(responderOnly, pendingQuestionsCount, unansweredCount, filteredQuestions) {
        return `
            <section class="student-service-zone student-service-zone-ops">
                <div class="student-service-zone-head">
                    <div>
                        <div class="student-service-kicker">${responderOnly ? 'Responder desk' : 'Q&A desk'}</div>
                        <div class="student-service-zone-title">${responderOnly ? 'Answer faculty-scoped public questions in a feed.' : 'Moderate and answer public questions in one feed.'}</div>
                        <div class="student-service-zone-copy">${responderOnly ? 'Professors and TAs stay inside public academic threads only. Student Service still controls moderation and publication.' : 'The Q&A lane is now feed-first, so moderation and answers happen on the same cards students see.'}</div>
                    </div>
                    <button type="button" class="student-service-mini-action" data-student-service-question-filter-field="qaStatus" data-student-service-question-filter-value="${responderOnly ? 'pending_review' : 'all'}"><i class="fas fa-filter"></i> Reset filters</button>
                </div>
                <div class="student-service-track-grid student-service-track-grid--desk">
                    <article class="student-service-track-card"><span>Pending Q&A</span><strong>${pendingQuestionsCount}</strong></article>
                    <article class="student-service-track-card"><span>Unanswered</span><strong>${unansweredCount}</strong></article>
                    <article class="student-service-track-card"><span>Visible now</span><strong>${filteredQuestions.length}</strong></article>
                    <article class="student-service-track-card"><span>Lane</span><strong>Feed</strong></article>
                </div>
            </section>
        `;
    }

    function renderStudentServiceStaffQaFeedMarkup(ui, filteredQuestions, selectedQuestion) {
        return `
            <section class="student-service-zone student-service-zone-find">
                <div class="student-service-zone-head">
                    <div>
                        <div class="student-service-kicker">Public Q&A feed</div>
                        <div class="student-service-zone-title">Search, filter, open, and answer on the same thread cards.</div>
                        <div class="student-service-zone-copy">No split detail pane here. Open one thread and moderate or reply inline.</div>
                    </div>
                    <span class="student-service-panel-chip">${filteredQuestions.length} question${filteredQuestions.length === 1 ? '' : 's'}</span>
                </div>
                <div class="student-service-find-search student-service-qa-searchbar">
                    <i class="fas fa-search"></i>
                    <input id="student-service-staff-qa-search" type="search" value="${ssEscape(ui.qaSearch || '')}" data-student-service-question-filter-input="qaSearch" placeholder="Search questions, answers, or categories">
                </div>
                ${renderStudentServiceQuestionFilterChips({ mode: 'staff' })}
                <div class="student-service-qa-feed-wrap">
                    ${renderStudentServiceQuestionFeed(filteredQuestions, { mode: 'staff', selectedQuestionId: selectedQuestion?.id || '' }) || '<div class="student-service-empty-state">No questions match the current filters.</div>'}
                </div>
            </section>
        `;
    }

    window.renderStudentServiceStaffQaFeed = function renderStudentServiceStaffQaFeed(container, options = {}) {
        const ui = ensureStudentServiceUiState();
        const filteredQuestions = Array.isArray(options.filteredQuestions) ? options.filteredQuestions : [];
        const selectedQuestion = options.selectedQuestion || getStudentServiceOpenQuestion(filteredQuestions);
        const responderOnly = Boolean(options.responderOnly);
        const pendingQuestionsCount = Number(options.pendingQuestionsCount || 0);
        const unansweredCount = Number(options.unansweredCount || 0);
        const shell = ensureStudentServiceStaffQaShell(container);
        if (!shell) return;
        setStudentServiceMarkup(
            shell.summary,
            `student-service-staff-qa:summary:${responderOnly ? 'responder' : 'moderator'}:${pendingQuestionsCount}:${unansweredCount}:${filteredQuestions.length}`,
            renderStudentServiceStaffQaSummaryMarkup(responderOnly, pendingQuestionsCount, unansweredCount, filteredQuestions)
        );
        setStudentServiceMarkup(
            shell.feed,
            `student-service-staff-qa:feed:${ui.qaSearch || ''}:${ui.qaCategory || ''}:${ui.qaFaculty || ''}:${ui.qaStatus || ''}:${selectedQuestion?.id || ''}:${filteredQuestions.length}`,
            renderStudentServiceStaffQaFeedMarkup(ui, filteredQuestions, selectedQuestion)
        );
    };
})();
