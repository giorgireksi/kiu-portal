/* QA thread click + student feed markup peeled from student-service-qa.js.
 * Load before student-service-qa.js. Free vars resolve at call time via window assigns.
 */
(function () {
    if (window.__KIU_STUDENT_SERVICE_QA_THREAD_LOADED) return;
    window.__KIU_STUDENT_SERVICE_QA_THREAD_LOADED = true;
    window.__kiuCreateStudentServiceQaThreadApi = function createKiuStudentServiceQaThreadApi(deps = {}) {
        void deps;
function handleStudentServiceQaThreadClick(event) {

    const openQuestionButton = event.target.closest('[data-student-service-open-question]');

    if (openQuestionButton) {

        event.preventDefault();

        openStudentServiceQuestion(openQuestionButton.dataset.studentServiceOpenQuestion || '');

        return true;

    }



    const questionFeedbackButton = event.target.closest('[data-student-service-question-feedback]');

    if (questionFeedbackButton) {

        event.preventDefault();

        setStudentServiceQuestionFeedback(

            questionFeedbackButton.dataset.studentServiceQuestionId || '',

            questionFeedbackButton.dataset.studentServiceQuestionFeedback || '',

            questionFeedbackButton

        );

        return true;

    }



    const ownerResolutionButton = event.target.closest('[data-student-service-owner-resolution]');

    if (ownerResolutionButton) {

        event.preventDefault();

        setStudentServiceQuestionOwnerResolution(

            ownerResolutionButton.dataset.studentServiceQuestionId || '',

            ownerResolutionButton.dataset.studentServiceOwnerResolution || '',

            ownerResolutionButton

        );

        return true;

    }



    const questionFlagButton = event.target.closest('[data-student-service-question-flag-field]');

    if (questionFlagButton) {

        event.preventDefault();

        toggleStudentServiceQuestionFlag(

            questionFlagButton.dataset.studentServiceQuestionId || '',

            questionFlagButton.dataset.studentServiceQuestionFlagField || '',

            questionFlagButton.dataset.studentServiceQuestionFlagValue === 'true'

        );

        return true;

    }



    const publishQuestionButton = event.target.closest('[data-student-service-question-publish]');

    if (publishQuestionButton) {

        event.preventDefault();

        publishStudentServiceQuestion(publishQuestionButton.dataset.studentServiceQuestionId || '');

        return true;

    }



    const convertQuestionButton = event.target.closest('[data-student-service-question-convert]');

    if (convertQuestionButton) {

        event.preventDefault();

        const questionId = convertQuestionButton.dataset.studentServiceQuestionId || '';

        const destination = convertQuestionButton.dataset.studentServiceQuestionConvert || '';

        if (destination === 'ticket') convertStudentServiceQuestionToTicket(questionId);

        if (destination === 'article') convertStudentServiceQuestionToArticle(questionId);

        return true;

    }



    const mergeQuestionButton = event.target.closest('[data-student-service-question-merge]');

    if (mergeQuestionButton) {

        event.preventDefault();

        mergeStudentServiceQuestionPrompt(mergeQuestionButton.dataset.studentServiceQuestionId || '');

        return true;

    }



    const answerHelpfulButton = event.target.closest('[data-student-service-answer-helpful]');

    if (answerHelpfulButton) {

        event.preventDefault();

        setStudentServiceAnswerFeedback(

            answerHelpfulButton.dataset.studentServiceQuestionId || '',

            answerHelpfulButton.dataset.studentServiceAnswerId || '',

            answerHelpfulButton

        );

        return true;

    }



    const deleteAnswerButton = event.target.closest('[data-student-service-delete-answer]');

    if (deleteAnswerButton) {

        event.preventDefault();

        flashStudentServiceActionButton(deleteAnswerButton, 'acting');

        openStudentServiceDeleteConfirm(

            deleteAnswerButton.dataset.studentServiceQuestionId || '',

            deleteAnswerButton.dataset.studentServiceDeleteAnswer || ''

        );

        return true;

    }



    const deleteQuestionButton = event.target.closest('[data-student-service-delete-question]');

    if (deleteQuestionButton) {

        event.preventDefault();

        flashStudentServiceActionButton(deleteQuestionButton, 'acting');

        openStudentServiceDeleteQuestionConfirm(deleteQuestionButton.dataset.studentServiceQuestionId || '');

        return true;

    }



    const replyToAnswerButton = event.target.closest('[data-student-service-reply-to-answer]');

    if (replyToAnswerButton) {

        event.preventDefault();

        setStudentServiceReplyTarget(

            replyToAnswerButton.dataset.studentServiceQuestionId || '',

            replyToAnswerButton.dataset.studentServiceReplyToAnswer || ''

        );

        return true;

    }



    const cancelReplyButton = event.target.closest('[data-student-service-cancel-reply]');

    if (cancelReplyButton) {

        event.preventDefault();

        clearStudentServiceReplyTarget();

        return true;

    }



    const submitAnswerButton = event.target.closest('[data-student-service-submit-answer]');

    if (submitAnswerButton) {

        event.preventDefault();

        if (isStudentServiceInlineReplyOpen() && submitAnswerButton.closest('.student-service-qa-thread-compose')) {

            alert('Use the Reply button under the comment you are answering, or cancel the inline reply first.');

            return true;

        }

        const isInlineSubmit = Boolean(submitAnswerButton.closest('.student-service-qa-comment-reply-shell'));

        submitStudentServiceQuestionAnswer(

            submitAnswerButton.dataset.studentServiceSubmitAnswer || '',

            submitAnswerButton,

            { forceInlineReply: isInlineSubmit }

        );

        return true;

    }



    return false;

}



function ensureStudentServiceStudentQaShell(container) {

    if (!container) return null;

    let shell = container.querySelector('[data-student-service-student-qa-shell="1"]');

    if (!shell) {

        const range = document.createRange();

        range.selectNodeContents(container);

        container.replaceChildren(range.createContextualFragment(`

            <div class="student-service-student-shell" data-student-service-student-qa-shell="1">

                <div data-student-service-student-qa-feed="1"></div>

            </div>

        `));

        shell = container.querySelector('[data-student-service-student-qa-shell="1"]');

    }

    return {

        feed: shell?.querySelector('[data-student-service-student-qa-feed="1"]') || null

    };

}



function renderStudentServiceStudentQaFeedMarkup(ui, filteredQuestions, selectedQuestion) {

    return `

        <section class="student-service-zone student-service-zone-find">

            <div class="lux-panel-head">

                <div>

                    <div class="student-service-kicker">Campus feed</div>

                    <div class="lux-panel-title">Search first, then open the thread that fits your question.</div>

                    <div class="lux-panel-copy">Questions stay in one central feed, and each thread expands inline instead of opening a separate detail pane.</div>

                </div>

                <span class="student-service-panel-chip">${filteredQuestions.length} question${filteredQuestions.length === 1 ? '' : 's'}</span>

            </div>

            <div class="student-service-find-search student-service-qa-searchbar">

                <i class="fas fa-search"></i>

                <input id="student-service-qa-search" type="search" value="${ssEscape(ui.qaSearch || '')}" data-student-service-question-filter-input="qaSearch" placeholder="Search public questions, answers, or keywords">

            </div>

            <div class="student-service-qa-feed-wrap">

                ${renderStudentServiceQuestionFeed(filteredQuestions, { mode: 'student', selectedQuestionId: selectedQuestion?.id || '' }) || '<div class="student-service-empty-state">No public questions match your search.</div>'}

            </div>

        </section>

    `;

}



        const api = { handleStudentServiceQaThreadClick, ensureStudentServiceStudentQaShell, renderStudentServiceStudentQaFeedMarkup };
        Object.assign(window, api);
        return api;
    };
    window.__kiuCreateStudentServiceQaThreadApi({});
})();
