(function initExamConsoleBuilderModule() {
    if (window.__KIU_EXAMS_BUILDER_MODULE_LOADED) return;
    window.__KIU_EXAMS_BUILDER_MODULE_LOADED = true;

    const hooks = window.__kiuExamsBuilderHooks || {};
    const {
        runtime,
        getTemplateDraft,
        getSubjectOptions,
        renderCourseYearOptions,
        formatCourseYearLabel,
        escapeHtml,
        renderShareModal
    } = hooks;

    if (
        !runtime
        || typeof getTemplateDraft !== 'function'
        || typeof getSubjectOptions !== 'function'
        || typeof renderCourseYearOptions !== 'function'
        || typeof formatCourseYearLabel !== 'function'
        || typeof escapeHtml !== 'function'
        || typeof renderShareModal !== 'function'
    ) {
        throw new Error('Exams builder hooks are unavailable.');
    }

    function setAutoGenVariantCount(value) {
        runtime.autoGenVariantCount = Math.max(1, Math.min(26, parseInt(value, 10) || 3));
    }

    function setAutoGenQuestionsPerVariant(value) {
        runtime.autoGenQuestionsPerVariant = Math.max(1, parseInt(value, 10) || 10);
    }

    function renderQuestionEditor(question, index, mode = 'legacy') {
        const removeFunc = mode === 'bank' ? 'removeExamBankQuestion' : 'removeExamQuestion';
        const updateFunc = mode === 'bank' ? 'updateExamBankQuestionField' : 'updateExamQuestionField';
        const syncFunc = mode === 'bank' ? 'syncExamBankQuestionField' : 'syncExamQuestionField';
        const optionUpdateFunc = mode === 'bank' ? 'updateExamBankQuestionOption' : 'updateExamQuestionOption';
        const optionSyncFunc = mode === 'bank' ? 'syncExamBankQuestionOption' : 'syncExamQuestionOption';
        return `
            <article class="ex2-question-card lux-soft-chrome">
                <div class="ex2-question-head">
                    <div>
                        <div class="ex2-status ex2-question-card-status is-neutral">Q${index + 1}</div>
                        <h3 class="ex2-question-card-title ex2-question-card-title--builder lms-route-card-title">Multiple Choice</h3>
                    </div>
                    <div class="ex2-inline-actions">
                        <label class="ex2-field ex2-field--compact ex2-field--points">
                            <span class="ex2-field-label-11 lms-route-field-label">Points</span>
                            <input class="lux-control lms-route-input ex2-input--points" type="number" min="1" value="${escapeHtml(String(question.score || 1))}" data-exam-change-call="${updateFunc}" data-exam-change-args='["${escapeHtml(question.id)}","score","$value"]'>
                        </label>
                        <label class="ex2-field ex2-field--compact ex2-field--options">
                            <span class="ex2-field-label-11 lms-route-field-label">Options</span>
                            <input class="lux-control lms-route-input ex2-input--options" type="number" min="2" max="8" value="${escapeHtml(String((question.options || []).length || question.optionCount || 4))}" data-exam-change-call="${updateFunc}" data-exam-change-args='["${escapeHtml(question.id)}","optionCount","$value"]'>
                        </label>
                    </div>
                </div>
                <div class="ex2-form-grid">
                    <label class="ex2-field ex2-field-span">
                        <span class="ex2-field-label lms-route-field-label">Question text</span>
                        <textarea class="lux-control lms-route-textarea lms-route-textarea-min-110" rows="3" data-exam-input-call="${syncFunc}" data-exam-input-args='["${escapeHtml(question.id)}","text","$value"]' data-exam-change-call="${updateFunc}" data-exam-change-args='["${escapeHtml(question.id)}","text","$value"]'>${escapeHtml(question.text)}</textarea>
                    </label>
                    <label class="ex2-field ex2-field-span ex2-field--picker">
                        <span class="ex2-field-label lms-route-field-label">Correct option</span>
                        <select class="ex2-select lux-control lux-universal-native-select" data-exam-change-call="${updateFunc}" data-exam-change-args='["${escapeHtml(question.id)}","correctOption","$value"]'>
                            ${(question.options || []).map((opt, oi) => `<option value="${oi}"${Number(question.correctOption) === oi ? ' selected' : ''}>Option ${oi + 1}</option>`).join('')}
                        </select>
                    </label>
                    <div class="ex2-field ex2-field-span">
                        <span class="ex2-field-label lms-route-field-label">Options</span>
                        <div class="ex2-options">
                            ${(question.options || []).map((opt, oi) => `<label class="ex2-option"><span class="ex2-option-index">${oi + 1}</span><input class="lux-control lms-route-input" type="text" value="${escapeHtml(opt)}" data-exam-input-call="${optionSyncFunc}" data-exam-input-args='["${escapeHtml(question.id)}",${oi},"$value"]' data-exam-change-call="${optionUpdateFunc}" data-exam-change-args='["${escapeHtml(question.id)}",${oi},"$value"]'></label>`).join('')}
                        </div>
                    </div>
                </div>
            </article>
        `;
    }

    function buildBankIndexById(bank) {
        const indexById = new Map();
        (bank || []).forEach((q, i) => {
            const id = String(q?.id || '').trim();
            if (id) indexById.set(id, i + 1);
        });
        return indexById;
    }

    function resolveVariantQuestions(variant, bank) {
        const bankById = new Map((bank || []).map((q) => [String(q?.id || '').trim(), q]));
        const bankIndexById = buildBankIndexById(bank);
        return (variant?.questionIds || [])
            .map((id) => {
                const key = String(id || '').trim();
                const question = bankById.get(key);
                if (!question) return null;
                return { question, bankNum: bankIndexById.get(key) || 0 };
            })
            .filter(Boolean);
    }

    function renderVariantCard(variant, index, bank) {
        const resolved = resolveVariantQuestions(variant, bank);
        const totalScore = resolved.reduce((s, entry) => s + (entry.question.score || 1), 0);
        return `
            <article class="ex2-question-card lux-soft-chrome">
                <div class="ex2-question-head">
                    <div>
                        <div class="ex2-status ex2-question-card-status is-neutral">${escapeHtml(variant.label)}</div>
                        <div class="ex2-meta ex2-question-card-meta lms-route-meta-12">${resolved.length} questions · ${totalScore} points · Shuffle: ${variant.shuffleQuestions ? 'Yes' : 'No'}</div>
                    </div>
                    <div class="ex2-inline-actions">
                        <button type="button" class="lux-ghost-btn lux-icon-btn" data-exam-call="removeVariant" data-exam-args='["${escapeHtml(variant.id)}"]'><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="ex2-mini-list">
                    ${resolved.map((entry, qi) => {
                        const q = entry.question;
                        const bankNum = entry.bankNum;
                        return `<div class="ex2-list-item ex2-list-item--compact" title="Variant Q${qi + 1} uses bank question Q${bankNum}"><div class="ex2-list-item-head"><strong class="ex2-list-item-title">Q${qi + 1}</strong> <span class="ex2-list-item-meta"><span class="ex2-variant-bank-ref">Bank Q${bankNum}</span> · MCQ · ${q.score} pts</span></div><div class="ex2-list-copy-truncate">${escapeHtml(q.text || 'No text')}</div></div>`;
                    }).join('')}
                </div>
            </article>
        `;
    }

    function renderStepDetails(draft) {
        return `
            <div class="ex2-form-grid">
                <label class="ex2-field">
                    <span class="ex2-field-label lms-route-field-label">Exam title</span>
                    <input id="exam-template-title" name="exam_template_title" class="ex2-input lux-control lms-route-input" type="text" value="${escapeHtml(draft.title)}" placeholder="e.g. Microeconomics Midterm" data-exam-input-call="syncExamTemplateField" data-exam-input-args='["title","$value"]' data-exam-change-call="updateExamTemplateField" data-exam-change-args='["title","$value"]'>
                </label>
                <label class="ex2-field ex2-field-span ex2-field--picker" id="exam-template-subject-field-label">
                    <span class="ex2-field-label lms-route-field-label">Subject</span>
                    <select id="exam-template-subject" name="exam_template_subject" class="ex2-select lux-control lux-universal-native-select" data-exam-change-call="updateExamTemplateField" data-exam-change-args='["subjectId","$value"]' data-lux-picker-search="true" data-lux-picker-search-placeholder="Search by name, code, or faculty…">
                        ${getSubjectOptions().map((item) => {
                            const searchText = [item.name, item.facultyCode, item.facultyLabel, item.id].filter(Boolean).join(' ');
                            return `<option value="${escapeHtml(item.id)}" data-lux-picker-search-text="${escapeHtml(searchText)}"${draft.subjectId === item.id ? ' selected' : ''}>${escapeHtml(item.name)}${item.facultyCode ? ` (${escapeHtml(item.facultyCode)})` : ''}</option>`;
                        }).join('')}
                    </select>
                </label>
                <label class="ex2-field ex2-field-span ex2-field--picker">
                    <span class="ex2-field-label lms-route-field-label">Course year / grade</span>
                    <select id="exam-template-course-number" name="exam_template_course_number" class="ex2-select lux-control lux-universal-native-select" data-exam-change-call="updateExamTemplateField" data-exam-change-args='["courseNumber","$value"]'>
                        ${renderCourseYearOptions(draft.courseNumber)}
                    </select>
                </label>
                <label class="ex2-field">
                    <span class="ex2-field-label lms-route-field-label">Course number / code</span>
                    <input id="exam-template-course-code" name="exam_template_course_code" class="ex2-input lux-control lms-route-input" type="text" value="${escapeHtml(draft.courseCode || '')}" placeholder="e.g. 221 or ECON-S1-234" data-exam-input-call="syncExamTemplateField" data-exam-input-args='["courseCode","$value"]' data-exam-change-call="updateExamTemplateField" data-exam-change-args='["courseCode","$value"]'>
                </label>
                <label class="ex2-field ex2-field-span ex2-field--picker">
                    <span class="ex2-field-label lms-route-field-label">Exam type</span>
                    <select id="exam-template-type" name="exam_template_type" class="ex2-select lux-control lux-universal-native-select" data-exam-change-call="updateExamTemplateField" data-exam-change-args='["examType","$value"]'>
                        <option value="digital"${draft.examType === 'digital' ? ' selected' : ''}>Digital (Laptop)</option>
                        <option value="paper"${draft.examType === 'paper' ? ' selected' : ''}>Paper (Printed)</option>
                    </select>
                </label>
                <label class="ex2-field">
                    <span class="ex2-field-label lms-route-field-label">Duration (minutes)</span>
                    <input id="exam-template-duration" name="exam_template_duration" class="ex2-input lux-control lms-route-input" type="number" min="1" value="${escapeHtml(String(draft.durationMinutes))}" data-exam-change-call="updateExamTemplateField" data-exam-change-args='["durationMinutes","$value"]'>
                </label>
                <label class="ex2-field">
                    <span class="ex2-field-label lms-route-field-label">Passing points</span>
                    <input id="exam-template-pass" name="exam_template_pass" class="ex2-input lux-control lms-route-input" type="number" min="0" value="${escapeHtml(String(draft.passingScore))}" data-exam-change-call="updateExamTemplateField" data-exam-change-args='["passingScore","$value"]'>
                </label>
                <label class="ex2-field">
                    <span class="ex2-field-label lms-route-field-label">Quiz value points</span>
                    <input id="exam-template-weight" name="exam_template_weight" class="ex2-input lux-control lms-route-input" type="number" min="0" value="${escapeHtml(String(draft.gradingWeight))}" data-exam-change-call="updateExamTemplateField" data-exam-change-args='["gradingWeight","$value"]'>
                </label>
                <label class="ex2-field">
                    <span class="ex2-field-label lms-route-field-label"><i class="fas fa-lock"></i> Default question points</span>
                    <input id="exam-template-default-score" name="exam_template_default_score" class="ex2-input lux-control lms-route-input" type="number" min="1" value="${escapeHtml(String(draft.defaultQuestionScore || 1))}" data-exam-change-call="updateExamTemplateField" data-exam-change-args='["defaultQuestionScore","$value"]'>
                </label>
                <label class="ex2-field">
                    <span class="ex2-field-label lms-route-field-label"><i class="fas fa-lock"></i> Default options per question</span>
                    <input id="exam-template-default-options" name="exam_template_default_options" class="ex2-input lux-control lms-route-input" type="number" min="2" max="8" value="${escapeHtml(String(draft.defaultOptionCount || 4))}" data-exam-change-call="updateExamTemplateField" data-exam-change-args='["defaultOptionCount","$value"]'>
                </label>
                <label class="ex2-field ex2-field-span">
                    <span class="ex2-field-label lms-route-field-label">Instructions (auto-appended: Academic Integrity Policy)</span>
                    <textarea id="exam-template-instructions" name="exam_template_instructions" class="ex2-textarea lux-control lms-route-textarea" rows="5" data-exam-input-call="syncExamTemplateField" data-exam-input-args='["instructions","$value"]' data-exam-change-call="updateExamTemplateField" data-exam-change-args='["instructions","$value"]'>${escapeHtml(draft.instructions)}</textarea>
                </label>
            </div>
        `;
    }

    function renderStepQuestions(draft) {
        const bank = draft.questionBank || [];
        const total = bank.length;
        const page = Math.max(0, Math.min(runtime.currentBankPage || 0, total - 1));
        runtime.currentBankPage = page;
        const question = bank[page] || null;
        const totalScore = bank.reduce((s, q) => s + (q.score || 1), 0);
        return `
            <section class="ex2-question-bank">
                <div class="ex2-panel-head ex2-panel-head--flush">
                    <div><h3 class="ex2-builder-section-title lms-route-card-title">Question Bank (${total} questions · ${totalScore} points)</h3><p class="ex2-builder-section-copy lms-route-copy">Each question is a multiple-choice item. Navigate using the controls below.</p></div>
                </div>
                <div class="ex2-qnav-bar lux-soft-chrome">
                    <div class="ex2-qnav-controls">
                        <button type="button" class="lux-secondary-btn lux-icon-btn" ${page <= 0 ? 'disabled' : ''} data-exam-call="navigateBankQuestion" data-exam-args='[${page - 1}]' title="Previous question"><i class="fas fa-chevron-left"></i></button>
                        <div class="ex2-qnav-indicator">
                            <span class="ex2-qnav-label">Question</span>
                            <input type="number" class="ex2-qnav-input lux-control lms-route-input" min="1" max="${total}" value="${page + 1}" data-exam-change-call="navigateBankQuestion" data-exam-change-args='["$bankIndex:${total - 1}"]'>
                            <span class="ex2-qnav-count lms-route-meta-12">of ${total}</span>
                        </div>
                        <button type="button" class="lux-secondary-btn lux-icon-btn" ${page >= total - 1 ? 'disabled' : ''} data-exam-call="navigateBankQuestion" data-exam-args='[${page + 1}]' title="Next question"><i class="fas fa-chevron-right"></i></button>
                    </div>
                    <div class="ex2-qnav-actions">
                        <button type="button" class="lux-primary-btn" data-exam-call="addExamBankQuestion" data-exam-args='["mcq"]'><i class="fas fa-plus"></i> Add Question</button>
                        ${total > 1 ? `<button type="button" class="lux-ghost-btn lux-icon-btn" data-exam-call="removeExamBankQuestion" data-exam-args='["${escapeHtml(question?.id || '')}"]' title="Delete this question"><i class="fas fa-trash"></i></button>` : ''}
                    </div>
                </div>
                <div class="ex2-qnav-dots">
                    ${bank.map((q, i) => `<button type="button" class="ex2-qnav-dot ${i === page ? 'is-active' : ''} ${q.text ? 'has-content' : ''}" data-exam-call="navigateBankQuestion" data-exam-args='[${i}]' title="Q${i + 1}">${i + 1}</button>`).join('')}
                </div>
                ${question ? renderQuestionEditor(question, page, 'bank') : `<div class="ex2-empty ex2-builder-empty lux-soft-chrome"><span class="ex2-builder-empty-copy lms-route-copy">No questions yet. Click "Add Question" to begin.</span></div>`}
            </section>
        `;
    }

    function renderStepVariants(draft) {
        const bank = draft.questionBank || [];
        const variants = draft.variants || [];
        const needsOverlap = bank.length < runtime.autoGenVariantCount * runtime.autoGenQuestionsPerVariant;
        return `
            <section class="ex2-variant-workspace">
                <div class="ex2-panel-head ex2-panel-head--flush">
                    <div><h3 class="ex2-builder-section-title lms-route-card-title">Exam Variants (${variants.length})</h3><p class="ex2-builder-section-copy lms-route-copy">Auto-generate variants from your ${bank.length}-question bank, or create them manually.</p></div>
                </div>
                <div class="ex2-auto-gen-box lux-soft-chrome">
                    <div class="ex2-side-kicker">Auto-Generate Variants</div>
                    <div class="ex2-form-grid ex2-form-grid--mt-12">
                        <label class="ex2-field">
                            <span class="ex2-field-label lms-route-field-label">Number of variants</span>
                            <input id="exam-auto-gen-count" class="lux-control lms-route-input" type="number" min="1" max="26" value="${runtime.autoGenVariantCount}" data-exam-change-call="setAutoGenVariantCount" data-exam-change-args='["$value"]'>
                        </label>
                        <label class="ex2-field">
                            <span class="ex2-field-label lms-route-field-label">Questions per variant</span>
                            <input id="exam-auto-gen-per" class="lux-control lms-route-input" type="number" min="1" value="${runtime.autoGenQuestionsPerVariant}" data-exam-change-call="setAutoGenQuestionsPerVariant" data-exam-change-args='["$value"]'>
                        </label>
                    </div>
                    <div class="ex2-inline-actions ex2-inline-actions--mt-14 ex2-inline-actions--gap-10">
                        <button type="button" class="lux-primary-btn" data-exam-call="runAutoGenerateVariants"><i class="fas fa-wand-magic-sparkles"></i> Generate ${runtime.autoGenVariantCount} Variants (${runtime.autoGenQuestionsPerVariant} each)</button>
                        ${needsOverlap ? `<span class="ex2-variant-hint lms-route-meta-12"><i class="fas fa-info-circle"></i> Bank has ${bank.length} questions, some overlap will occur</span>` : `<span class="ex2-variant-hint lms-route-meta-12 is-positive"><i class="fas fa-check-circle"></i> Bank has enough for zero overlap</span>`}
                    </div>
                </div>
                <div class="ex2-variant-actions">
                    <button type="button" class="lux-secondary-btn" data-exam-call="addManualVariant"><i class="fas fa-plus"></i> Add Manual Variant</button>
                </div>
                ${variants.length ? `<div class="ex2-variant-list">${variants.map((v, vi) => renderVariantCard(v, vi, bank)).join('')}</div>` : `<div class="ex2-empty ex2-builder-empty lux-soft-chrome"><span class="ex2-builder-empty-copy lms-route-copy">No variants created yet. Use auto-generate above or add manually.</span></div>`}
            </section>
        `;
    }

    function renderStepReview(draft) {
        const bank = draft.questionBank || [];
        const variants = draft.variants || [];
        const totalScore = bank.reduce((s, q) => s + (q.score || 1), 0);
        return `
            <div class="ex2-stack">
                <div class="ex2-review-card">
                    <h3 class="ex2-review-card-title">${escapeHtml(draft.title || 'Untitled Exam')}</h3>
                    <div class="ex2-meta ex2-review-card-meta">${escapeHtml(draft.subjectName || 'No subject')} · ${draft.examType === 'paper' ? 'Paper' : 'Digital'} · ${draft.durationMinutes} min</div>
                    <p class="ex2-review-copy">${escapeHtml(draft.instructions || 'No instructions added.')}</p>
                </div>
                <div class="ex2-mini-grid">
                    <div class="ex2-review-summary-card"><strong class="ex2-review-summary-value">${bank.length}</strong><span class="ex2-review-summary-label">Question Bank</span></div>
                    <div class="ex2-review-summary-card"><strong class="ex2-review-summary-value">${variants.length}</strong><span class="ex2-review-summary-label">Variants</span></div>
                    <div class="ex2-review-summary-card"><strong class="ex2-review-summary-value">${totalScore}</strong><span class="ex2-review-summary-label">Total points</span></div>
                </div>
                ${variants.map((v, i) => {
                    const vQuestions = bank.filter((q) => (v.questionIds || []).includes(q.id));
                    return `<div class="ex2-list-card ex2-list-card--pad-16 ex2-variant-summary-card"><h3 class="ex2-variant-summary-title">${escapeHtml(v.label)}</h3><div class="ex2-meta ex2-variant-summary-meta">${vQuestions.length} questions · ${vQuestions.reduce((s, q) => s + (q.score || 1), 0)} points</div></div>`;
                }).join('')}
                ${!variants.length ? `<div class="ex2-warning ex2-builder-warning"><i class="fas fa-triangle-exclamation"></i> <span class="ex2-builder-warning-copy">No variants created. Go to the Variants step to generate them before submitting.</span></div>` : ''}
                <div class="ex2-review-card ex2-review-card--accent">
                    <div class="ex2-side-kicker">Academic Integrity Notice</div>
                    <p class="ex2-review-copy ex2-review-copy--tight">All examinations are conducted under the university's Academic Integrity Policy. Use of unauthorized materials, communication with other students, or any form of cheating will result in disciplinary action including course failure and potential expulsion.</p>
                </div>
            </div>
        `;
    }

    const BUILDER_STEPS = ['details', 'questions', 'variants', 'review'];
    const BUILDER_STEP_LABELS = { details: 'Details', questions: 'Question Bank', variants: 'Variants', review: 'Review' };
    const BUILDER_STEP_ICONS = { details: 'fa-sliders', questions: 'fa-bank', variants: 'fa-shuffle', review: 'fa-check-circle' };

    function isBuilderStepComplete(step, draft) {
        const bankCount = (draft.questionBank || draft.questions || []).length;
        const variantCount = (draft.variants || []).length;
        if (step === 'details') return !!(draft.subjectId && draft.title);
        if (step === 'questions') return bankCount > 0;
        if (step === 'variants') return variantCount > 0;
        return false;
    }

    function renderExamBuilderToolbarMarkup(draft) {
        return `
            <div class="ex2-builder-toolbar-main">
                <button type="button" class="lux-ghost-btn" data-exam-call="cancelExamDraft"><i class="fas fa-arrow-left"></i> Back to library</button>
                <h2 class="ex2-builder-title lms-route-card-title">${escapeHtml(draft.title || (draft.editingTemplateId ? 'Edit Quiz' : 'New Quiz'))}</h2>
            </div>
            <div class="ex2-builder-toolbar-actions">
                <div class="ex2-builder-export-group" role="group" aria-label="Export quiz">
                    <button type="button" class="lux-ghost-btn ex2-builder-export-btn" data-exam-call="exportQuizAs" data-exam-args='["pdf"]'><i class="fas fa-file-pdf"></i><span class="ex2-builder-export-label"> PDF</span></button>
                    <button type="button" class="lux-ghost-btn ex2-builder-export-btn" data-exam-call="exportQuizAs" data-exam-args='["docx"]'><i class="fas fa-file-word"></i><span class="ex2-builder-export-label"> DOCX</span></button>
                </div>
                <button type="button" class="lux-ghost-btn ex2-builder-save-btn" data-exam-call="saveExamTemplateDraft"><i class="fas fa-save"></i> Save Draft</button>
                <button type="button" class="lux-primary-btn ex2-builder-submit-btn" data-exam-call="saveAndSubmitExamTemplate"><i class="fas fa-paper-plane"></i> Submit to Admin</button>
            </div>
        `;
    }

    function renderExamBuilderStepperMarkup(draft) {
        return BUILDER_STEPS.map((step, i) => {
            const done = isBuilderStepComplete(step, draft);
            const active = runtime.templateStep === step;
            return `<button type="button" class="ex2-progress-step${active ? ' is-active' : ''}${done && !active ? ' is-done' : ''}" data-exam-call="setExamTemplateStep" data-exam-args='["${step}"]' aria-current="${active ? 'step' : 'false'}" aria-label="${escapeHtml(BUILDER_STEP_LABELS[step])}"><span class="step-num ex2-progress-step-num">${done && !active ? `<i class="fas fa-check"></i>` : (i + 1)}</span><span class="step-label ex2-progress-step-label"><i class="fas ${BUILDER_STEP_ICONS[step]}"></i>${BUILDER_STEP_LABELS[step]}</span></button>`;
        }).join('');
    }

    function renderExamBuilderStepMarkup() {
        const draft = getTemplateDraft();
        if (runtime.templateStep === 'details') return renderStepDetails(draft);
        if (runtime.templateStep === 'questions') return renderStepQuestions(draft);
        if (runtime.templateStep === 'variants') return renderStepVariants(draft);
        return renderStepReview(draft);
    }

    function renderSummaryChip(label, value) {
        return `
            <span class="ex2-summary-chip lux-soft-chrome">
                <span class="ex2-summary-chip-label">${escapeHtml(label)}</span>
                <strong class="ex2-summary-chip-value">${escapeHtml(value)}</strong>
            </span>
        `;
    }

    function renderSummaryGroup(title, chips, extraClass = '') {
        return `
            <div class="ex2-builder-summary-group${extraClass ? ` ${extraClass}` : ''}">
                <span class="ex2-summary-group-label lms-route-field-label">${escapeHtml(title)}</span>
                <div class="ex2-builder-summary-chips">${chips.join('')}</div>
            </div>
        `;
    }

    function renderExamBuilderSummaryStrip(draft) {
        const bankCount = (draft.questionBank || draft.questions || []).length;
        const variantCount = (draft.variants || []).length;
        const totalPts = (draft.questionBank || draft.questions || []).reduce((s, q) => s + (parseInt(q.score, 10) || 0), 0);
        const qPerVariant = variantCount > 0 ? String((draft.variants[0]?.questionIds || []).length) : '';
        const identityChips = [
            renderSummaryChip('Subject', draft.subjectName || 'Not set'),
            renderSummaryChip('Type', draft.examType === 'paper' ? 'Paper' : 'Digital'),
            renderSummaryChip('Duration', `${draft.durationMinutes || 90} min`),
            renderSummaryChip('Course Year', formatCourseYearLabel(draft.courseNumber)),
            renderSummaryChip('Course No.', draft.courseCode || 'Optional')
        ];
        const gradingChips = [
            renderSummaryChip('Passing', `${draft.passingScore || 50} pts`),
            renderSummaryChip('Quiz Value', `${draft.gradingWeight || 30} pts`),
            renderSummaryChip('Q Default', `${draft.defaultQuestionScore || 1} pts / ${draft.defaultOptionCount || 4} opts`),
            renderSummaryChip('Total Pts', String(totalPts))
        ];
        const contentChips = [
            renderSummaryChip('Questions', String(bankCount)),
            renderSummaryChip('Variants', String(variantCount))
        ];
        if (qPerVariant) contentChips.push(renderSummaryChip('Q/Variant', qPerVariant));
        return `
            <div class="ex2-builder-summary-strip lux-soft-chrome">
                <div class="ex2-builder-summary-groups">
                    ${renderSummaryGroup('Identity', identityChips, 'ex2-summary-group--meta')}
                    ${renderSummaryGroup('Grading', gradingChips)}
                    ${renderSummaryGroup('Content', contentChips)}
                </div>
                <button type="button" class="lux-secondary-btn ex2-builder-summary-share" data-exam-call="openShareModal" data-exam-args='["${escapeHtml(draft.editingTemplateId)}"]'><i class="fas fa-share-nodes"></i> Share Quiz</button>
            </div>
        `;
    }

    window.renderExamBuilderToolbarMarkup = renderExamBuilderToolbarMarkup;
    window.renderExamBuilderStepperMarkup = renderExamBuilderStepperMarkup;
    window.renderExamBuilderSummaryMarkup = function renderExamBuilderSummaryMarkup() {
        return renderExamBuilderSummaryStrip(getTemplateDraft());
    };
    window.renderExamBuilderStepMarkup = renderExamBuilderStepMarkup;
    window.isExamBuilderStepComplete = isBuilderStepComplete;

    window.renderExamTemplateBuilder = function renderExamTemplateBuilder() {
        const draft = getTemplateDraft();
        return `
            <div class="ex2-builder-body" data-exam-builder="1">
                <header class="ex2-builder-toolbar lux-soft-chrome" data-exam-region="builder-toolbar">
                    ${renderExamBuilderToolbarMarkup(draft)}
                </header>
                <nav class="ex2-progress-bar ex2-progress-bar--compact lux-soft-chrome" data-exam-region="builder-stepper" aria-label="Quiz builder steps">
                    ${renderExamBuilderStepperMarkup(draft)}
                </nav>
                <div data-exam-region="builder-summary">
                    ${renderExamBuilderSummaryStrip(draft)}
                </div>
                <div class="ex2-builder-step-body lux-soft-chrome ex2-panel--animated" data-exam-region="builder-step">
                    ${renderExamBuilderStepMarkup()}
                </div>
            </div>
        `;
    };
})();
