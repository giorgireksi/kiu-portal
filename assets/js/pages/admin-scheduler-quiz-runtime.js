/* Professor quiz modal — lazy-loaded off admin-scheduler.js (admin route never needs it at boot). */
(function () {
    if (window.__KIU_ADMIN_SCHEDULER_QUIZ_LOADED) return;
    window.__KIU_ADMIN_SCHEDULER_QUIZ_LOADED = true;

    const QUIZ_TEMPLATE_HTML = `<div class="sch-modal-overlay" id="profQuizModalOverlay" data-lux-transparency-exempt="1" hidden aria-hidden="true">
        <div class="sch-modal sch-modal-wide" data-lux-glass-root="1" role="dialog" aria-modal="true" aria-labelledby="prof-quiz-title">
            <div class="sch-modal-head sch-modal-head-accent">
                <div>
                    <div class="quiz-modal-title" id="prof-quiz-title"><i class="fas fa-tasks"></i> Professor Quiz Management</div>
                    <div class="quiz-modal-subtitle" id="prof-quiz-subtitle">Subject - Group</div>
                </div>
                <i class="fas fa-times quiz-modal-close" data-prof-quiz-close role="button" tabindex="0" aria-label="Close"></i>
            </div>
            <div class="sch-modal-body sch-modal-body-pad">
                <input type="hidden" id="pq-course" name="pq-course"><input type="hidden" id="pq-group" name="pq-group"><input type="hidden" id="pq-week" name="pq-week">
                <div class="sch-input-group"><label for="pq-title">Quiz Title</label><input type="text" class="lux-control" id="pq-title" name="pq-title" placeholder="e.g. Midterm Assessment"></div>
                <div class="sch-input-row sch-input-row-two">
                    <div class="sch-input-group"><label for="pq-duration">Duration (min)</label><input type="number" class="lux-control" id="pq-duration" name="pq-duration" value="30"></div>
                    <div class="sch-input-group"><label for="pq-date">Available From</label><input type="date" class="lux-control" id="pq-date" name="pq-date"></div>
                </div>
                <div class="quiz-questions-head">
                    <div class="quiz-questions-head-row">
                        <h4>Questions</h4>
                        <button type="button" class="lux-secondary-btn" data-admin-scheduler-quiz-action="add"><i class="fas fa-plus"></i> Add</button>
                    </div>
                    <div id="pq-questions-list" class="quiz-questions-list"></div>
                </div>
            </div>
            <div class="sch-modal-foot sch-modal-foot-between">
                <button type="button" class="lux-secondary-btn" data-prof-quiz-close><i class="fas fa-arrow-left"></i> Cancel</button>
                <button type="button" class="lux-primary-btn" data-admin-scheduler-quiz-action="save"><i class="fas fa-paper-plane"></i> Deploy Quiz</button>
            </div>
        </div>
    </div>`;

    window.__kiuCreateAdminSchedulerQuizApi = function createKiuSchedulerQuizApi(deps = {}) {
        with (deps) {
            const QUIZ_MODAL_ID = 'profQuizModalOverlay';
            let profQuizQuestions = [];
            let modalMounted = false;

            function ensureProfessorQuizModal() {
                let modal = el(QUIZ_MODAL_ID);
                if (!modal && !modalMounted) {
                    const wrapper = document.createElement('div');
                    wrapper.innerHTML = QUIZ_TEMPLATE_HTML.trim();
                    modal = wrapper.firstElementChild;
                    if (modal) {
                        document.body.appendChild(modal);
                        modalMounted = true;
                    }
                }
                if (modal) bindProfessorQuizModalListeners(modal);
                return modal;
            }

            function buildProfessorQuizEmptyState() {
                const empty = document.createElement('div');
                empty.className = 'quiz-question-empty-state';
                empty.textContent = 'No questions yet.';
                return empty;
            }

            function buildProfessorQuizQuestionCard(question, index) {
                const card = document.createElement('div');
                card.className = 'quiz-question-card lux-soft-chrome';

                const header = document.createElement('div');
                header.className = 'quiz-question-card-head';

                const label = document.createElement('span');
                label.className = 'quiz-question-card-label';
                label.textContent = `Q${index + 1}`;

                const removeButton = document.createElement('button');
                removeButton.type = 'button';
                removeButton.dataset.profQuizQuestionRemove = String(index);
                removeButton.className = 'lux-ghost-btn quiz-question-remove-btn';
                removeButton.setAttribute('aria-label', `Remove question ${index + 1}`);
                const removeIcon = document.createElement('i');
                removeIcon.className = 'fas fa-trash';
                removeButton.appendChild(removeIcon);
                header.append(label, removeButton);

                const questionLabel = document.createElement('label');
                questionLabel.htmlFor = `pq-question-text-${index}`;
                questionLabel.className = 'sch-visually-hidden';
                questionLabel.textContent = `Question ${index + 1} text`;

                const questionInput = document.createElement('input');
                questionInput.type = 'text';
                questionInput.id = `pq-question-text-${index}`;
                questionInput.name = `pq-question-text-${index}`;
                questionInput.placeholder = 'Question text...';
                questionInput.value = question.text || '';
                questionInput.dataset.profQuizQuestionText = String(index);
                questionInput.className = 'lux-control quiz-question-input';

                const pointsRow = document.createElement('div');
                pointsRow.className = 'quiz-question-points-row';

                const pointsLabel = document.createElement('label');
                pointsLabel.htmlFor = `pq-question-points-${index}`;
                pointsLabel.className = 'quiz-question-points-label';
                pointsLabel.textContent = 'Pts:';

                const pointsInput = document.createElement('input');
                pointsInput.type = 'number';
                pointsInput.id = `pq-question-points-${index}`;
                pointsInput.name = `pq-question-points-${index}`;
                pointsInput.value = String(question.points ?? 10);
                pointsInput.dataset.profQuizQuestionPoints = String(index);
                pointsInput.min = '0';
                pointsInput.className = 'lux-control quiz-question-points-input';

                pointsRow.append(pointsLabel, pointsInput);
                card.append(header, questionLabel, questionInput, pointsRow);
                return card;
            }

            function renderProfQuizQuestions() {
                const container = el('pq-questions-list');
                if (!container) return;
                if (!profQuizQuestions.length) {
                    container.replaceChildren(buildProfessorQuizEmptyState());
                    return;
                }
                const fragment = document.createDocumentFragment();
                profQuizQuestions.forEach((question, index) => {
                    fragment.appendChild(buildProfessorQuizQuestionCard(question, index));
                });
                container.replaceChildren(fragment);
            }

            function addProfQuizQuestion() {
                profQuizQuestions.push({ id: `q${Date.now()}`, text: '', points: 10 });
                renderProfQuizQuestions();
                const list = el('pq-questions-list');
                if (list) {
                    window.setTimeout(() => {
                        list.scrollTop = list.scrollHeight;
                    }, 50);
                }
            }

            function removeProfQuizQuestion(index) {
                profQuizQuestions.splice(index, 1);
                renderProfQuizQuestions();
            }

            function closeProfQuizModal() {
                const modal = el(QUIZ_MODAL_ID);
                if (modal) closeSchedulerPortalModal(modal);
            }

            function saveProfQuiz() {
                const courseId = el('pq-course')?.value || '';
                const groupId = el('pq-group')?.value || '';
                const title = el('pq-title')?.value?.trim() || 'Untitled Quiz';
                const quiz = {
                    id: `quiz-${Date.now()}`,
                    subjectId: courseId,
                    groupId,
                    title,
                    durationMinutes: parseInt(el('pq-duration')?.value || '30', 10) || 30,
                    availableFrom: el('pq-date')?.value || '',
                    questions: profQuizQuestions,
                    status: 'published',
                    createdAt: new Date().toISOString()
                };
                const facultyCode = localStorage.getItem('currentFaculty') || 'ECON';
                if (typeof KIU_STATE !== 'undefined' && KIU_STATE.facultyProfiles?.[facultyCode]) {
                    if (!KIU_STATE.facultyProfiles[facultyCode].quizzes) KIU_STATE.facultyProfiles[facultyCode].quizzes = [];
                    KIU_STATE.facultyProfiles[facultyCode].quizzes.push(quiz);
                    if (typeof saveState === 'function') saveState();
                }
                window.alert(`Quiz "${title}" deployed to ${courseId} Group ${groupId.toUpperCase()}!`);
                closeProfQuizModal();
            }

            function bindProfessorQuizModalListeners(modal) {
                bindNodeOnce(modal, 'click', 'schedulerQuizModalClickBound', (event) => {
                    if (event.target === event.currentTarget) {
                        closeProfQuizModal();
                        return;
                    }
                    const quizAction = event.target.closest('[data-admin-scheduler-quiz-action]');
                    if (quizAction) {
                        event.preventDefault();
                        const action = quizAction.dataset.adminSchedulerQuizAction || '';
                        if (action === 'add') addProfQuizQuestion();
                        if (action === 'save') saveProfQuiz();
                        return;
                    }
                    const removeButton = event.target.closest('[data-prof-quiz-question-remove]');
                    if (removeButton) {
                        event.preventDefault();
                        const index = parseInt(removeButton.dataset.profQuizQuestionRemove || '-1', 10);
                        if (Number.isFinite(index) && index >= 0) removeProfQuizQuestion(index);
                        return;
                    }
                    if (event.target.closest('[data-prof-quiz-close]')) {
                        event.preventDefault();
                        closeProfQuizModal();
                    }
                });

                bindNodeOnce(modal, 'input', 'schedulerQuizModalInputBound', (event) => {
                    const textInput = event.target.closest('[data-prof-quiz-question-text]');
                    if (textInput) {
                        const index = parseInt(textInput.dataset.profQuizQuestionText || '-1', 10);
                        if (Number.isFinite(index) && profQuizQuestions[index]) {
                            profQuizQuestions[index].text = textInput.value;
                        }
                        return;
                    }
                    const pointsInput = event.target.closest('[data-prof-quiz-question-points]');
                    if (!pointsInput) return;
                    const index = parseInt(pointsInput.dataset.profQuizQuestionPoints || '-1', 10);
                    if (Number.isFinite(index) && profQuizQuestions[index]) {
                        profQuizQuestions[index].points = Number(pointsInput.value);
                    }
                });
            }

            function openProfQuizModal(courseId, groupId, weekStart) {
                const modal = ensureProfessorQuizModal();
                if (!modal) return;
                setText('prof-quiz-subtitle', `${courseId} · Group ${String(groupId || '').toUpperCase()}`);
                if (el('pq-course')) el('pq-course').value = courseId;
                if (el('pq-group')) el('pq-group').value = groupId;
                if (el('pq-week')) el('pq-week').value = weekStart;
                if (el('pq-title')) el('pq-title').value = '';
                if (el('pq-duration')) el('pq-duration').value = '30';
                if (el('pq-date')) el('pq-date').value = new Date().toISOString().split('T')[0];
                profQuizQuestions = [{ id: 'q1', text: '', points: 10 }];
                renderProfQuizQuestions();
                if (typeof window.enhanceUniversalPickers === 'function') {
                    window.enhanceUniversalPickers(modal);
                }
                openSchedulerPortalModal(modal, { focusSelector: '#pq-title' });
            }

            return { openProfQuizModal, closeProfQuizModal };
        }
    };
})();
