/* Staff QA command-bar stats + feed markup. Peeled from student-service-qa.js.
 * Load before student-service-qa.js.
 */
(function () {
    if (window.__KIU_STUDENT_SERVICE_QA_STAFF_LOADED) return;
    window.__KIU_STUDENT_SERVICE_QA_STAFF_LOADED = true;
    window.__kiuCreateStudentServiceQaStaffApi = function createKiuPeelApi(deps = {}) {
        with (deps) {

        async function setStudentServiceQuestionOwnerResolution(questionId, status, triggerButton = null) {
            const normalizedQuestionId = String(questionId || '').trim();
            const normalizedStatus = String(status || '').trim().toLowerCase();
            if (!normalizedQuestionId || !['answered', 'unanswered'].includes(normalizedStatus)) return;
            if (triggerButton?.dataset.studentServiceOwnerResolutionPending === 'true') return;
            const questionBefore = getStudentServiceQuestionById(normalizedQuestionId);
            if (!questionBefore || !canCurrentUserSetStudentServiceOwnerResolution(questionBefore)) return;
            const currentStatus = String(questionBefore.ownerResolutionStatus || '').trim().toLowerCase();
            const optimisticStatus = currentStatus === normalizedStatus ? '' : normalizedStatus;
            const optimisticQuestion = {
                ...questionBefore,
                ownerResolutionStatus: optimisticStatus
            };
            const actionRoot = triggerButton?.closest('.student-service-qa-detail-actions')
                || getStudentServiceQuestionThreadHost(normalizedQuestionId)?.querySelector('.student-service-qa-detail-actions');
            if (triggerButton) {
                triggerButton.dataset.studentServiceOwnerResolutionPending = 'true';
                setStudentServiceActionButtonPending(triggerButton, true);
                flashStudentServiceActionButton(triggerButton, 'acting');
                updateStudentServiceOwnerResolutionButtons(actionRoot, optimisticQuestion);
                patchStudentServiceQuestionCardStats(normalizedQuestionId);
            }
            try {
                const payload = await postStudentService(
                    STUDENT_SERVICE_API_PATHS.questionOwnerResolution(normalizedQuestionId),
                    { status: normalizedStatus }
                );
                if (payload?.question) mergeStudentServiceQuestionSnapshot(payload.question);
                runStudentServiceScrollPreserved(() => {
                    if (!patchStudentServiceOwnerResolutionUi(normalizedQuestionId)
                        && !patchStudentServiceOpenQuestionThread(normalizedQuestionId)) {
                        return false;
                    }
                    syncStudentServiceRenderSignature();
                    return true;
                });
                if (triggerButton) flashStudentServiceActionButton(triggerButton, 'success');
            } catch (error) {
                console.error('Student Service owner resolution failed.', error);
                if (triggerButton && questionBefore) {
                    updateStudentServiceOwnerResolutionButtons(actionRoot, questionBefore);
                    patchStudentServiceQuestionCardStats(normalizedQuestionId);
                    flashStudentServiceActionButton(triggerButton, 'error');
                }
                alert(error?.message || 'Owner resolution could not be saved.');
            } finally {
                if (triggerButton) {
                    delete triggerButton.dataset.studentServiceOwnerResolutionPending;
                    setStudentServiceActionButtonPending(triggerButton, false);
                }
            }
        }

        async function setStudentServiceQuestionFeedback(questionId, value, triggerButton = null) {
            const normalizedQuestionId = String(questionId || '').trim();
            const normalizedValue = value === 'not_helpful' ? 'not_helpful' : 'helpful';
            if (!normalizedQuestionId) return;
            if (triggerButton?.dataset.studentServiceHelpfulPending === 'true') return;
            const questionBefore = getStudentServiceQuestionById(normalizedQuestionId);
            const wasHelpful = isStudentServiceQuestionHelpfulVoted(questionBefore || {});
            const optimisticQuestion = questionBefore
                ? {
                    ...questionBefore,
                    viewerVote: wasHelpful ? '' : 'helpful',
                    viewerHelpfulVote: !wasHelpful,
                    helpfulCount: Math.max(0, Number(questionBefore.helpfulCount || 0) + (wasHelpful ? -1 : 1))
                }
                : null;
            if (triggerButton) {
                triggerButton.dataset.studentServiceHelpfulPending = 'true';
                if (optimisticQuestion) {
                    updateStudentServiceQuestionHelpfulButton(triggerButton, optimisticQuestion);
                    const card = getStudentServiceQuestionCardElement(normalizedQuestionId);
                    const statEls = card?.querySelectorAll('.student-service-qa-card-stat');
                    if (statEls?.[1]) {
                        statEls[1].innerHTML = `<i class="far fa-thumbs-up"></i> ${optimisticQuestion.helpfulCount} helpful`;
                    }
                }
                triggerStudentServiceHelpfulAnimation(triggerButton, !wasHelpful);
            }
            try {
                const payload = await postStudentService(
                    STUDENT_SERVICE_API_PATHS.questionFeedback(normalizedQuestionId),
                    { value: normalizedValue }
                );
                if (payload?.question) mergeStudentServiceQuestionSnapshot(payload.question);
                runStudentServiceScrollPreserved(() => {
                    if (!patchStudentServiceQuestionHelpfulUi(normalizedQuestionId)
                        && !patchStudentServiceOpenQuestionThread(normalizedQuestionId)) {
                        return false;
                    }
                    syncStudentServiceRenderSignature();
                    return true;
                });
            } catch (error) {
                console.error('Student Service feedback failed.', error);
                if (triggerButton && questionBefore) {
                    updateStudentServiceQuestionHelpfulButton(triggerButton, questionBefore);
                    patchStudentServiceQuestionCardStats(normalizedQuestionId);
                    flashStudentServiceActionButton(triggerButton, 'error');
                }
                alert(error?.message || 'Feedback could not be saved.');
            } finally {
                if (triggerButton) delete triggerButton.dataset.studentServiceHelpfulPending;
            }
        }

        async function setStudentServiceAnswerFeedback(questionId, answerId, triggerButton = null) {
            const normalizedQuestionId = String(questionId || '').trim();
            const normalizedAnswerId = String(answerId || '').trim();
            if (!normalizedQuestionId || !normalizedAnswerId) return;
            const runtime = (typeof STUDENT_SERVICE_RUNTIME === 'object' && STUDENT_SERVICE_RUNTIME)
                || window.STUDENT_SERVICE_RUNTIME
                || {};
            if (!runtime.pendingAnswerHelpfulIds) runtime.pendingAnswerHelpfulIds = new Set();
            if (
                triggerButton?.dataset.studentServiceHelpfulPending === 'true'
                || runtime.pendingAnswerHelpfulIds.has(normalizedAnswerId)
            ) return;
            const questionBefore = getStudentServiceQuestionById(normalizedQuestionId);
            const answerBefore = findStudentServiceAnswerRecord(questionBefore, normalizedAnswerId);
            const wasHelpful = answerBefore
                ? isStudentServiceAnswerHelpfulVoted(answerBefore)
                : triggerButton?.getAttribute('aria-pressed') === 'true';
            const nextHelpful = !wasHelpful;
            const optimisticAnswer = {
                ...(answerBefore || {}),
                viewerHelpfulVote: nextHelpful,
                helpfulCount: Math.max(0, Number(answerBefore?.helpfulCount || 0) + (wasHelpful ? -1 : 1)),
                updatedAt: typeof ssNowIso === 'function' ? ssNowIso() : new Date().toISOString()
            };
            runtime.pendingAnswerHelpfulIds.add(normalizedAnswerId);
            runtime.suppressRealtimeRefreshUntil = Date.now() + 2000;
            if (triggerButton) {
                triggerButton.dataset.studentServiceHelpfulPending = 'true';
                updateStudentServiceAnswerHelpfulButton(triggerButton, optimisticAnswer);
                triggerStudentServiceHelpfulAnimation(triggerButton, nextHelpful);
            }
            if (answerBefore && questionBefore && typeof mergeStudentServiceQuestionSnapshot === 'function') {
                mergeStudentServiceQuestionSnapshot({
                    ...questionBefore,
                    answers: (questionBefore.answers || []).map((answer) => (
                        String(answer.id) === normalizedAnswerId ? { ...answer, ...optimisticAnswer } : answer
                    )),
                    updatedAt: optimisticAnswer.updatedAt
                });
            }
            try {
                const payload = await postStudentService(
                    STUDENT_SERVICE_API_PATHS.questionAnswerFeedback(normalizedQuestionId, normalizedAnswerId),
                    { helpful: nextHelpful }
                );
                if (payload?.question) mergeStudentServiceQuestionSnapshot(payload.question);
                const answerFromPayload = findStudentServiceAnswerRecord(payload?.question, normalizedAnswerId)
                    || findStudentServiceAnswerRecord(getStudentServiceQuestionById(normalizedQuestionId), normalizedAnswerId)
                    || optimisticAnswer;
                if (triggerButton) updateStudentServiceAnswerHelpfulButton(triggerButton, answerFromPayload);
                const patched = runStudentServiceScrollPreserved(() => {
                    if (patchStudentServiceAnswerHelpfulBtn(normalizedQuestionId, normalizedAnswerId, { triggerButton })) {
                        syncStudentServiceRenderSignature();
                        if (triggerButton) flashStudentServiceActionButton(triggerButton, 'success');
                        return true;
                    }
                    if (patchStudentServiceOpenQuestionThread(normalizedQuestionId)) {
                        syncStudentServiceRenderSignature();
                        if (triggerButton) flashStudentServiceActionButton(triggerButton, 'success');
                        return true;
                    }
                    if (triggerButton) {
                        updateStudentServiceAnswerHelpfulButton(triggerButton, answerFromPayload);
                        flashStudentServiceActionButton(triggerButton, 'success');
                        syncStudentServiceRenderSignature();
                        return true;
                    }
                    return false;
                });
                if (!patched) await refreshStudentServiceDataAndRender(false);
            } catch (error) {
                console.error('Student Service answer feedback failed.', error);
                if (questionBefore) mergeStudentServiceQuestionSnapshot(questionBefore);
                if (triggerButton && answerBefore) {
                    updateStudentServiceAnswerHelpfulButton(triggerButton, answerBefore);
                    flashStudentServiceActionButton(triggerButton, 'error');
                }
                alert(error?.message || 'Feedback could not be saved.');
            } finally {
                runtime.pendingAnswerHelpfulIds.delete(normalizedAnswerId);
                if (triggerButton) delete triggerButton.dataset.studentServiceHelpfulPending;
            }
        }

        async function deleteStudentServiceQuestion(questionId) {
            const normalizedQuestionId = String(questionId || '').trim();
            if (!normalizedQuestionId) return;
            const question = getStudentServiceQuestionById(normalizedQuestionId);
            if (!question || !canCurrentUserDeleteStudentServiceQuestion(question)) return;
            try {
                const payload = await postStudentService(
                    STUDENT_SERVICE_API_PATHS.questionDelete(normalizedQuestionId),
                    {}
                );
                const deletedQuestionId = String(payload?.deletedQuestionId || normalizedQuestionId).trim();
                closeStudentServiceDeleteConfirm({ restoreThread: false });
                closeStudentServiceInlineReply();
                const ui = ensureStudentServiceUiState();
                if (ui.selectedQuestionId === deletedQuestionId) {
                    ui.selectedQuestionId = '';
                    closeStudentServiceQuestionThreadModal();
                    updateStudentServiceQuestionThreadActiveCards('');
                }
                removeStudentServiceQuestionFromSnapshot(deletedQuestionId);
                const patched = runStudentServiceScrollPreserved(() => {
                    if (!removeStudentServiceQuestionCard(deletedQuestionId)) return false;
                    syncStudentServiceRenderSignature();
                    return true;
                });
                if (!patched) {
                    const container = document.getElementById('page-student-service');
                    if (container) delete container.dataset.studentServiceRenderSignature;
                    renderStudentServicePage();
                }
            } catch (error) {
                console.error('Student Service question deletion failed.', error);
                const confirmBtn = document.querySelector('[data-student-service-confirm-question-delete]');
                flashStudentServiceActionButton(confirmBtn, 'error');
                alert(error?.message || 'Question could not be deleted.');
            }
        }

        async function deleteStudentServiceQuestionAnswer(questionId, answerId) {
            const normalizedQuestionId = String(questionId || '').trim();
            const normalizedAnswerId = String(answerId || '').trim();
            if (!normalizedQuestionId || !normalizedAnswerId) return;
            const question = getStudentServiceQuestionById(normalizedQuestionId);
            const answer = findStudentServiceAnswerRecord(question, normalizedAnswerId);
            if (!question || !answer || !canCurrentUserDeleteStudentServiceAnswer(question, answer)) return;
            try {
                const payload = await postStudentService(
                    STUDENT_SERVICE_API_PATHS.questionAnswerDelete(normalizedQuestionId, normalizedAnswerId),
                    {}
                );
                if (payload?.question) {
                    mergeStudentServiceQuestionSnapshot(payload.question);
                } else {
                    const removeIds = collectStudentServiceAnswerBranchIds(
                        normalizedQuestionId,
                        normalizedAnswerId,
                        question.answers
                    );
                    removeStudentServiceAnswersFromSnapshot(normalizedQuestionId, removeIds);
                }
                closeStudentServiceDeleteConfirm();
                closeStudentServiceInlineReply();
                if (!applyStudentServiceQuestionMutation(normalizedQuestionId, {
                    removedAnswerId: normalizedAnswerId,
                    scrollPreserve: true
                })) {
                    const container = document.getElementById('page-student-service');
                    if (container) delete container.dataset.studentServiceRenderSignature;
                    renderStudentServicePage();
                    restoreStudentServiceOpenQuestionFromUi();
                }
            } catch (error) {
                console.error('Student Service answer deletion failed.', error);
                const confirmBtn = document.querySelector('[data-student-service-confirm-delete]');
                flashStudentServiceActionButton(confirmBtn, 'error');
                alert(error?.message || 'Comment could not be deleted.');
            }
        }

        function renderStudentServiceQaCommandBarStats(role, metrics, ui) {
            const filteredCount = getStudentServiceFilteredQuestions(metrics.visibleQuestions).length;
            const stats = role === USER_ROLES.STUDENT
                ? [
                    { label: 'my questions', value: metrics.myQuestions },
                    { label: 'answered', value: metrics.myAnsweredQuestions },
                    { label: 'accepted', value: metrics.myAcceptedQuestions },
                    { label: 'published', value: metrics.myPublishedQuestions }
                ]
                : [
                    { label: 'unanswered', value: metrics.unansweredQuestions },
                    { label: 'visible now', value: filteredCount },
                    { label: 'published', value: metrics.publishedQuestions }
                ];
            return `
                <div class="student-service-command-bar-stat-strip" role="list" aria-label="Q&A workspace stats">
                    ${stats.map(stat => `
                        <span class="student-service-command-bar-stat" role="listitem">
                            <strong>${ssEscape(String(stat.value))}</strong> ${ssEscape(stat.label)}
                        </span>
                    `).join('')}
                </div>
            `;
        }

        function ensureStudentServiceStaffQaShell(container) {
            if (!container) return null;
            let shell = container.querySelector('[data-student-service-staff-qa-shell="1"]');
            if (!shell) {
                const range = document.createRange();
                range.selectNodeContents(container);
                container.replaceChildren(range.createContextualFragment(`
                    <div class="student-service-staff-shell" data-student-service-staff-qa-shell="1">
                        <div data-student-service-staff-qa-feed="1"></div>
                    </div>
                `));
                shell = container.querySelector('[data-student-service-staff-qa-shell="1"]');
            }
            return {
                feed: shell?.querySelector('[data-student-service-staff-qa-feed="1"]') || null
            };
        }

        function renderStudentServiceStaffQaFeedMarkup(ui, filteredQuestions, selectedQuestion) {
            return `
                <section class="student-service-zone student-service-zone-find">
                    <div class="lux-panel-head">
                        <div>
                            <div class="student-service-kicker lux-section-kicker">Public Q&A feed</div>
                            <div class="lux-panel-title lux-page-title">Search, open, and answer on the same thread cards.</div>
                            <div class="lux-panel-copy lux-page-copy">No split detail pane here. Open one thread and moderate or reply inline.</div>
                        </div>
                        <span class="student-service-panel-chip home-hover-chip">${filteredQuestions.length} question${filteredQuestions.length === 1 ? '' : 's'}</span>
                    </div>
                    <div class="student-service-find-search student-service-qa-searchbar">
                        <i class="fas fa-search"></i>
                        <input id="student-service-staff-qa-search" type="search" value="${ssEscape(ui.qaSearch || '')}" data-student-service-question-filter-input="qaSearch" placeholder="Search questions, answers, or categories">
                    </div>
                    <div class="student-service-qa-feed-wrap">
                        ${renderStudentServiceQuestionFeed(filteredQuestions, { mode: 'staff', selectedQuestionId: selectedQuestion?.id || '' }) || '<div class="student-service-empty-state">No questions match your search.</div>'}
                    </div>
                </section>
            `;
        }

        const api = {
            setStudentServiceQuestionOwnerResolution,
            setStudentServiceQuestionFeedback,
            setStudentServiceAnswerFeedback,
            deleteStudentServiceQuestion,
            deleteStudentServiceQuestionAnswer,
            renderStudentServiceQaCommandBarStats,
            ensureStudentServiceStaffQaShell,
            renderStudentServiceStaffQaFeedMarkup,
        };
        Object.assign(window, api);
        return api;
        }
    };
})();
