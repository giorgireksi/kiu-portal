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
            const runtime = window.STUDENT_SERVICE_RUNTIME || {};
            if (!runtime.pendingOwnerResolutionIds) runtime.pendingOwnerResolutionIds = new Set();
            if (runtime.pendingOwnerResolutionIds.has(normalizedQuestionId)) return;
            let questionBefore = getStudentServiceQuestionRecordById(normalizedQuestionId);
            if (!questionBefore) {
                const visibleQuestion = getStudentServiceQuestionById(normalizedQuestionId);
                if (visibleQuestion && typeof mergeStudentServiceQuestionSnapshot === 'function') {
                    mergeStudentServiceQuestionSnapshot(visibleQuestion);
                    questionBefore = getStudentServiceQuestionRecordById(normalizedQuestionId);
                }
            }
            if (!questionBefore) {
                questionBefore = getStudentServiceQuestionById(normalizedQuestionId);
            }
            if (!questionBefore || !canCurrentUserSetStudentServiceOwnerResolution(questionBefore)) return;
            const storeStatus = String(questionBefore.ownerResolutionStatus || '').trim().toLowerCase();
            const optimisticStatus = storeStatus === normalizedStatus ? '' : normalizedStatus;
            const optimisticQuestion = {
                ...questionBefore,
                ownerResolutionStatus: optimisticStatus,
                updatedAt: typeof ssNowIso === 'function' ? ssNowIso() : new Date().toISOString()
            };
            const actionRoot = triggerButton?.closest('.student-service-qa-detail-actions')
                || getStudentServiceQuestionThreadHost(normalizedQuestionId)?.querySelector('.student-service-qa-detail-actions');
            runtime.suppressRealtimeRefreshUntil = Date.now() + 3000;
            runtime.pendingOwnerResolutionIds.add(normalizedQuestionId);
            if (triggerButton) {
                setStudentServiceActionButtonPending(triggerButton, true);
                updateStudentServiceOwnerResolutionButtons(actionRoot, optimisticQuestion, triggerButton);
                triggerStudentServiceOwnerResolutionAnimation(triggerButton);
                patchStudentServiceQuestionCardStats(normalizedQuestionId);
            }
            if (typeof mergeStudentServiceQuestionSnapshot === 'function') {
                mergeStudentServiceQuestionSnapshot(optimisticQuestion);
            }
            try {
                const payload = await postStudentService(
                    STUDENT_SERVICE_API_PATHS.questionOwnerResolution(normalizedQuestionId),
                    { status: normalizedStatus }
                );
                let questionFromPayload = optimisticQuestion;
                if (payload?.question) {
                    let q = payload.question;
                    if (storeStatus === normalizedStatus
                        && String(q.ownerResolutionStatus || '').trim().toLowerCase() === normalizedStatus) {
                        q = { ...q, ownerResolutionStatus: '' };
                    }
                    mergeStudentServiceQuestionSnapshot(q);
                    questionFromPayload = q;
                } else {
                    const fromStore = getStudentServiceQuestionById(normalizedQuestionId);
                    if (fromStore) questionFromPayload = fromStore;
                }
                runStudentServiceScrollPreserved(() => {
                    patchStudentServiceOwnerResolutionUi(normalizedQuestionId, {
                        triggerButton,
                        actionRoot,
                        question: questionFromPayload
                    });
                    syncStudentServiceRenderSignature();
                    return true;
                });
            } catch (error) {
                console.error('Student Service owner resolution failed.', error);
                if (questionBefore) mergeStudentServiceQuestionSnapshot(questionBefore);
                if (triggerButton && questionBefore) {
                    updateStudentServiceOwnerResolutionButtons(actionRoot, questionBefore, triggerButton);
                    patchStudentServiceQuestionCardStats(normalizedQuestionId);
                    flashStudentServiceActionButton(triggerButton, 'error');
                }
                alert(error?.message || 'Owner resolution could not be saved.');
            } finally {
                runtime.suppressRealtimeRefreshUntil = Date.now() + 1500;
                runtime.pendingOwnerResolutionIds.delete(normalizedQuestionId);
                if (triggerButton) {
                    setStudentServiceActionButtonPending(triggerButton, false);
                }
            }
        }

        async function setStudentServiceQuestionFeedback(questionId, value, triggerButton = null) {
            const normalizedQuestionId = String(questionId || '').trim();
            const normalizedValue = value === 'not_helpful' ? 'not_helpful' : 'helpful';
            if (!normalizedQuestionId) return;
            const runtime = window.STUDENT_SERVICE_RUNTIME || {};
            if (!runtime.pendingQuestionHelpfulIds) runtime.pendingQuestionHelpfulIds = new Set();
            if (runtime.pendingQuestionHelpfulIds.has(normalizedQuestionId)) {
                // #region agent log
                fetch('http://127.0.0.1:7711/ingest/f2047d9d-2016-4ba2-818b-bced76e002bb',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'657d82'},body:JSON.stringify({sessionId:'657d82',runId:'post-fix',hypothesisId:'B',location:'student-service-qa-staff-runtime.js:questionFeedback:pending',message:'question helpful blocked by pending',data:{questionId:normalizedQuestionId,pendingSize:runtime.pendingQuestionHelpfulIds.size},timestamp:Date.now()})}).catch(()=>{});
                // #endregion
                return;
            }
            let questionBefore = getStudentServiceQuestionRecordById(normalizedQuestionId);
            if (!questionBefore) {
                const visibleQuestion = getStudentServiceQuestionById(normalizedQuestionId);
                if (visibleQuestion && typeof mergeStudentServiceQuestionSnapshot === 'function') {
                    mergeStudentServiceQuestionSnapshot(visibleQuestion);
                    questionBefore = getStudentServiceQuestionRecordById(normalizedQuestionId);
                }
            }
            if (!questionBefore) {
                // #region agent log
                fetch('http://127.0.0.1:7711/ingest/f2047d9d-2016-4ba2-818b-bced76e002bb',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'657d82'},body:JSON.stringify({sessionId:'657d82',runId:'post-fix',hypothesisId:'E',location:'student-service-qa-staff-runtime.js:questionFeedback:noRecord',message:'question helpful missing record',data:{questionId:normalizedQuestionId},timestamp:Date.now()})}).catch(()=>{});
                // #endregion
                if (triggerButton) flashStudentServiceActionButton(triggerButton, 'error');
                alert('Question record is not available. Refresh and try again.');
                return;
            }
            const actorId = resolveStudentServiceActorUserId();
            if (!actorId) {
                alert('Sign in to rate this question.');
                return;
            }
            questionBefore = reconcileStudentServiceQuestionViewerHelpful(questionBefore, actorId);
            const ariaPressed = triggerButton?.getAttribute?.('aria-pressed') || null;
            const wasHelpful = triggerButton
                ? ariaPressed === 'true'
                : isStudentServiceQuestionHelpfulVoted(questionBefore, actorId);
            const expectedVoted = !wasHelpful;
            // #region agent log
            fetch('http://127.0.0.1:7711/ingest/f2047d9d-2016-4ba2-818b-bced76e002bb',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'657d82'},body:JSON.stringify({sessionId:'657d82',runId:'post-fix',hypothesisId:'A',location:'student-service-qa-staff-runtime.js:questionFeedback:before',message:'question helpful click intent',data:{questionId:normalizedQuestionId,actorId,wasHelpful,expectedVoted,ariaPressed,storeViewerVote:questionBefore.viewerVote||'',storeViewerHelpfulVote:Boolean(questionBefore.viewerHelpfulVote),helpfulCount:Number(questionBefore.helpfulCount||0),voteCount:(questionBefore.helpfulVotes||[]).length,actorInVotes:(questionBefore.helpfulVotes||[]).some((e)=>String(e?.userId||'')===actorId),ariaDriven:Boolean(triggerButton)},timestamp:Date.now()})}).catch(()=>{});
            // #endregion
            const optimisticQuestion = buildStudentServiceQuestionHelpfulToggleSnapshot(
                questionBefore,
                actorId,
                wasHelpful
            );
            if (!optimisticQuestion) return;
            runtime.suppressRealtimeRefreshUntil = Date.now() + 3000;
            runtime.pendingQuestionHelpfulIds.add(normalizedQuestionId);
            if (triggerButton) setStudentServiceActionButtonPending(triggerButton, true);
            try {
                if (triggerButton) {
                    updateStudentServiceQuestionHelpfulButton(triggerButton, optimisticQuestion);
                    triggerStudentServiceHelpfulAnimation(triggerButton, expectedVoted);
                }
                if (typeof mergeStudentServiceQuestionSnapshot === 'function') {
                    mergeStudentServiceQuestionSnapshot(optimisticQuestion);
                }
                const payload = await postStudentService(
                    STUDENT_SERVICE_API_PATHS.questionFeedback(normalizedQuestionId),
                    { value: normalizedValue }
                );
                let questionFromPayload = optimisticQuestion;
                let payloadVoted = null;
                if (payload?.question) {
                    const q = reconcileStudentServiceQuestionViewerHelpful(payload.question, actorId);
                    payloadVoted = isStudentServiceQuestionHelpfulVoted(q, actorId);
                    mergeStudentServiceQuestionSnapshot(q);
                    questionFromPayload = q;
                } else {
                    const fromStore = getStudentServiceQuestionRecordById(normalizedQuestionId);
                    if (fromStore) {
                        questionFromPayload = reconcileStudentServiceQuestionViewerHelpful(fromStore, actorId);
                    }
                }
                // #region agent log
                fetch('http://127.0.0.1:7711/ingest/f2047d9d-2016-4ba2-818b-bced76e002bb',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'657d82'},body:JSON.stringify({sessionId:'657d82',runId:'post-fix',hypothesisId:'C',location:'student-service-qa-staff-runtime.js:questionFeedback:after',message:'question helpful post result',data:{questionId:normalizedQuestionId,expectedVoted,payloadVoted,forceReconcile:false,hasPayloadQuestion:Boolean(payload?.question),finalVoted:isStudentServiceQuestionHelpfulVoted(questionFromPayload,actorId),finalCount:Number(questionFromPayload.helpfulCount||0),finalAria:triggerButton?.getAttribute?.('aria-pressed')||null},timestamp:Date.now()})}).catch(()=>{});
                // #endregion
                runStudentServiceScrollPreserved(() => {
                    patchStudentServiceQuestionHelpfulUi(normalizedQuestionId, {
                        triggerButton,
                        question: questionFromPayload
                    });
                    syncStudentServiceRenderSignature();
                    return true;
                });
            } catch (error) {
                // #region agent log
                fetch('http://127.0.0.1:7711/ingest/f2047d9d-2016-4ba2-818b-bced76e002bb',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'657d82'},body:JSON.stringify({sessionId:'657d82',runId:'post-fix',hypothesisId:'E',location:'student-service-qa-staff-runtime.js:questionFeedback:error',message:'question helpful post failed',data:{questionId:normalizedQuestionId,error:String(error?.message||error||'')},timestamp:Date.now()})}).catch(()=>{});
                // #endregion
                console.error('Student Service feedback failed.', error);
                if (questionBefore) mergeStudentServiceQuestionSnapshot(questionBefore);
                if (triggerButton && questionBefore) {
                    updateStudentServiceQuestionHelpfulButton(triggerButton, questionBefore);
                    patchStudentServiceQuestionCardStats(normalizedQuestionId, questionBefore);
                    flashStudentServiceActionButton(triggerButton, 'error');
                }
                alert(error?.message || 'Feedback could not be saved.');
            } finally {
                runtime.suppressRealtimeRefreshUntil = Date.now() + 1500;
                runtime.pendingQuestionHelpfulIds.delete(normalizedQuestionId);
                if (triggerButton) setStudentServiceActionButtonPending(triggerButton, false);
            }
        }

        async function setStudentServiceAnswerFeedback(questionId, answerId, triggerButton = null) {
            const normalizedQuestionId = String(questionId || '').trim();
            const normalizedAnswerId = String(answerId || '').trim();
            if (!normalizedQuestionId || !normalizedAnswerId) return;
            const runtime = window.STUDENT_SERVICE_RUNTIME || {};
            if (!runtime.pendingAnswerHelpfulIds) runtime.pendingAnswerHelpfulIds = new Set();
            if (runtime.pendingAnswerHelpfulIds.has(normalizedAnswerId)) {
                // #region agent log
                fetch('http://127.0.0.1:7711/ingest/f2047d9d-2016-4ba2-818b-bced76e002bb',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'657d82'},body:JSON.stringify({sessionId:'657d82',runId:'post-fix',hypothesisId:'B',location:'student-service-qa-staff-runtime.js:answerFeedback:pending',message:'answer helpful blocked by pending',data:{questionId:normalizedQuestionId,answerId:normalizedAnswerId,pendingSize:runtime.pendingAnswerHelpfulIds.size},timestamp:Date.now()})}).catch(()=>{});
                // #endregion
                return;
            }
            const questionBefore = getStudentServiceQuestionRecordById(normalizedQuestionId);
            if (!questionBefore) return;
            const answerBefore = findStudentServiceAnswerRecord(questionBefore, normalizedAnswerId);
            if (!answerBefore) return;
            const actorId = resolveStudentServiceActorUserId();
            if (!actorId) {
                alert('Sign in to rate this answer.');
                return;
            }
            const ariaPressed = triggerButton?.getAttribute?.('aria-pressed') || null;
            const wasHelpful = triggerButton
                ? ariaPressed === 'true'
                : isStudentServiceAnswerHelpfulVoted(answerBefore, actorId);
            const expectedVoted = !wasHelpful;
            // #region agent log
            fetch('http://127.0.0.1:7711/ingest/f2047d9d-2016-4ba2-818b-bced76e002bb',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'657d82'},body:JSON.stringify({sessionId:'657d82',runId:'post-fix',hypothesisId:'A',location:'student-service-qa-staff-runtime.js:answerFeedback:before',message:'answer helpful click intent',data:{questionId:normalizedQuestionId,answerId:normalizedAnswerId,actorId,wasHelpful,expectedVoted,ariaPressed,storeViewerHelpfulVote:Boolean(answerBefore.viewerHelpfulVote),helpfulCount:Number(answerBefore.helpfulCount||0),voteCount:(answerBefore.helpfulVotes||[]).length,actorInVotes:(answerBefore.helpfulVotes||[]).some((e)=>String(e?.userId||'')===actorId),postHelpful:!wasHelpful,ariaDriven:Boolean(triggerButton)},timestamp:Date.now()})}).catch(()=>{});
            // #endregion
            const optimisticAnswer = buildStudentServiceAnswerHelpfulToggleSnapshot(
                answerBefore,
                actorId,
                wasHelpful
            );
            if (!optimisticAnswer) return;
            runtime.suppressRealtimeRefreshUntil = Date.now() + 3000;
            runtime.pendingAnswerHelpfulIds.add(normalizedAnswerId);
            if (triggerButton) setStudentServiceActionButtonPending(triggerButton, true);
            try {
                if (triggerButton) {
                    updateStudentServiceAnswerHelpfulButton(triggerButton, optimisticAnswer);
                    triggerStudentServiceHelpfulAnimation(triggerButton, expectedVoted);
                }
                if (typeof mergeStudentServiceQuestionSnapshot === 'function') {
                    const answers = (questionBefore.answers || []);
                    mergeStudentServiceQuestionSnapshot({
                        ...questionBefore,
                        answers: answers.map((answer) => (
                            String(answer.id) === normalizedAnswerId ? { ...answer, ...optimisticAnswer } : answer
                        )),
                        updatedAt: optimisticAnswer.updatedAt
                    });
                }
                const payload = await postStudentService(
                    STUDENT_SERVICE_API_PATHS.questionAnswerFeedback(normalizedQuestionId, normalizedAnswerId),
                    { helpful: !wasHelpful }
                );
                let answerFromPayload = optimisticAnswer;
                let payloadVoted = null;
                if (payload?.question) {
                    const q = payload.question;
                    mergeStudentServiceQuestionSnapshot(q);
                    const answer = findStudentServiceAnswerRecord(q, normalizedAnswerId);
                    if (answer) {
                        payloadVoted = isStudentServiceAnswerHelpfulVoted(answer, actorId);
                        answerFromPayload = answer;
                    }
                } else {
                    const fromStore = getStudentServiceQuestionRecordById(normalizedQuestionId);
                    const fromAnswer = findStudentServiceAnswerRecord(fromStore, normalizedAnswerId);
                    if (fromAnswer) answerFromPayload = fromAnswer;
                }
                // #region agent log
                fetch('http://127.0.0.1:7711/ingest/f2047d9d-2016-4ba2-818b-bced76e002bb',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'657d82'},body:JSON.stringify({sessionId:'657d82',runId:'post-fix',hypothesisId:'C',location:'student-service-qa-staff-runtime.js:answerFeedback:after',message:'answer helpful post result',data:{questionId:normalizedQuestionId,answerId:normalizedAnswerId,expectedVoted,payloadVoted,forceReconcile:false,hasPayloadQuestion:Boolean(payload?.question),finalVoted:isStudentServiceAnswerHelpfulVoted(answerFromPayload,actorId),finalCount:Number(answerFromPayload.helpfulCount||0),finalAria:triggerButton?.getAttribute?.('aria-pressed')||null},timestamp:Date.now()})}).catch(()=>{});
                // #endregion
                runStudentServiceScrollPreserved(() => {
                    patchStudentServiceAnswerHelpfulBtn(normalizedQuestionId, normalizedAnswerId, {
                        triggerButton,
                        answer: answerFromPayload
                    });
                    syncStudentServiceRenderSignature();
                    return true;
                });
            } catch (error) {
                // #region agent log
                fetch('http://127.0.0.1:7711/ingest/f2047d9d-2016-4ba2-818b-bced76e002bb',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'657d82'},body:JSON.stringify({sessionId:'657d82',runId:'post-fix',hypothesisId:'E',location:'student-service-qa-staff-runtime.js:answerFeedback:error',message:'answer helpful post failed',data:{questionId:normalizedQuestionId,answerId:normalizedAnswerId,error:String(error?.message||error||'')},timestamp:Date.now()})}).catch(()=>{});
                // #endregion
                console.error('Student Service answer feedback failed.', error);
                if (questionBefore) mergeStudentServiceQuestionSnapshot(questionBefore);
                if (triggerButton && answerBefore) {
                    updateStudentServiceAnswerHelpfulButton(triggerButton, answerBefore);
                    flashStudentServiceActionButton(triggerButton, 'error');
                }
                alert(error?.message || 'Feedback could not be saved.');
            } finally {
                runtime.suppressRealtimeRefreshUntil = Date.now() + 1500;
                runtime.pendingAnswerHelpfulIds.delete(normalizedAnswerId);
                if (triggerButton) setStudentServiceActionButtonPending(triggerButton, false);
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
