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
            <article class="ex2-question-card">
                <div class="ex2-question-head">
                    <div>
                        <div class="ex2-status is-neutral">Q${index + 1}</div>
                        <h3>Multiple Choice</h3>
                    </div>
                    <div class="ex2-inline-actions">
                        <label class="ex2-field" style="margin:0;min-width:80px;">
                            <span style="font-size:11px;">Points</span>
                            <input class="ex2-input" type="number" min="1" value="${escapeHtml(String(question.score || 1))}" style="width:70px;" data-exam-change-call="${updateFunc}" data-exam-change-args='["${escapeHtml(question.id)}","score","$value"]'>
                        </label>
                        <label class="ex2-field" style="margin:0;min-width:110px;">
                            <span style="font-size:11px;">Options</span>
                            <input class="ex2-input" type="number" min="2" max="8" value="${escapeHtml(String((question.options || []).length || question.optionCount || 4))}" style="width:86px;" data-exam-change-call="${updateFunc}" data-exam-change-args='["${escapeHtml(question.id)}","optionCount","$value"]'>
                        </label>
                    </div>
                </div>
                <div class="ex2-form-grid">
                    <label class="ex2-field ex2-field-span">
                        <span>Question text</span>
                        <textarea class="ex2-textarea" rows="3" data-exam-input-call="${syncFunc}" data-exam-input-args='["${escapeHtml(question.id)}","text","$value"]' data-exam-change-call="${updateFunc}" data-exam-change-args='["${escapeHtml(question.id)}","text","$value"]'>${escapeHtml(question.text)}</textarea>
                    </label>
                    <label class="ex2-field">
                        <span>Correct option</span>
                        <select class="ex2-select" data-exam-change-call="${updateFunc}" data-exam-change-args='["${escapeHtml(question.id)}","correctOption","$value"]'>
                            ${(question.options || []).map((opt, oi) => `<option value="${oi}"${Number(question.correctOption) === oi ? ' selected' : ''}>Option ${oi + 1}</option>`).join('')}
                        </select>
                    </label>
                    <div class="ex2-field ex2-field-span">
                        <span>Options</span>
                        <div class="ex2-options">
                            ${(question.options || []).map((opt, oi) => `<label class="ex2-option"><span>${oi + 1}</span><input class="ex2-input" type="text" value="${escapeHtml(opt)}" data-exam-input-call="${optionSyncFunc}" data-exam-input-args='["${escapeHtml(question.id)}",${oi},"$value"]' data-exam-change-call="${optionUpdateFunc}" data-exam-change-args='["${escapeHtml(question.id)}",${oi},"$value"]'></label>`).join('')}
                        </div>
                    </div>
                </div>
            </article>
        `;
    }

    function renderVariantCard(variant, index, bank) {
        const qIds = new Set(variant.questionIds || []);
        const resolved = bank.filter((q) => qIds.has(q.id));
        const totalScore = resolved.reduce((s, q) => s + (q.score || 1), 0);
        return `
            <article class="ex2-question-card">
                <div class="ex2-question-head">
                    <div>
                        <div class="ex2-status is-neutral">${escapeHtml(variant.label)}</div>
                        <div class="ex2-meta">${resolved.length} questions Â· ${totalScore} points Â· Shuffle: ${variant.shuffleQuestions ? 'Yes' : 'No'}</div>
                    </div>
                    <div class="ex2-inline-actions">
                        <button type="button" class="ex2-btn is-ghost" data-exam-call="removeVariant" data-exam-args='["${escapeHtml(variant.id)}"]'><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="ex2-mini-list">
                    ${resolved.map((q, qi) => `<div class="ex2-list-item compact"><div><strong>Q${qi + 1}</strong> <span>MCQ Â· ${q.score} pts</span></div><div style="max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(q.text || 'No text')}</div></div>`).join('')}
                </div>
            </article>
        `;
    }

    function renderStepDetails(draft) {
        return `
            <div class="ex2-form-grid">
                <label class="ex2-field">
                    <span>Exam title</span>
                    <input id="exam-template-title" name="exam_template_title" class="ex2-input" type="text" value="${escapeHtml(draft.title)}" placeholder="e.g. Microeconomics Midterm" data-exam-input-call="syncExamTemplateField" data-exam-input-args='["title","$value"]' data-exam-change-call="updateExamTemplateField" data-exam-change-args='["title","$value"]'>
                </label>
                <label class="ex2-field">
                    <span>Subject</span>
                    <select id="exam-template-subject" name="exam_template_subject" class="ex2-select" data-exam-change-call="updateExamTemplateField" data-exam-change-args='["subjectId","$value"]'>
                        ${getSubjectOptions().map((item) => `<option value="${escapeHtml(item.id)}"${draft.subjectId === item.id ? ' selected' : ''}>${escapeHtml(item.name)}${item.facultyCode ? ` (${escapeHtml(item.facultyCode)})` : ''}</option>`).join('')}
                    </select>
                </label>
                <label class="ex2-field">
                    <span>Course year / grade</span>
                    <select id="exam-template-course-number" name="exam_template_course_number" class="ex2-select" data-exam-change-call="updateExamTemplateField" data-exam-change-args='["courseNumber","$value"]'>
                        ${renderCourseYearOptions(draft.courseNumber)}
                    </select>
                </label>
                <label class="ex2-field">
                    <span>Course number / code</span>
                    <input id="exam-template-course-code" name="exam_template_course_code" class="ex2-input" type="text" value="${escapeHtml(draft.courseCode || '')}" placeholder="e.g. 221 or ECON-S1-234" data-exam-input-call="syncExamTemplateField" data-exam-input-args='["courseCode","$value"]' data-exam-change-call="updateExamTemplateField" data-exam-change-args='["courseCode","$value"]'>
                </label>
                <label class="ex2-field">
                    <span>Exam type</span>
                    <select id="exam-template-type" name="exam_template_type" class="ex2-select" data-exam-change-call="updateExamTemplateField" data-exam-change-args='["examType","$value"]'>
                        <option value="digital"${draft.examType === 'digital' ? ' selected' : ''}>Digital (Laptop)</option>
                        <option value="paper"${draft.examType === 'paper' ? ' selected' : ''}>Paper (Printed)</option>
                    </select>
                </label>
                <label class="ex2-field">
                    <span>Duration (minutes)</span>
                    <input id="exam-template-duration" name="exam_template_duration" class="ex2-input" type="number" min="1" value="${escapeHtml(String(draft.durationMinutes))}" data-exam-change-call="updateExamTemplateField" data-exam-change-args='["durationMinutes","$value"]'>
                </label>
                <label class="ex2-field">
                    <span>Passing points</span>
                    <input id="exam-template-pass" name="exam_template_pass" class="ex2-input" type="number" min="0" value="${escapeHtml(String(draft.passingScore))}" data-exam-change-call="updateExamTemplateField" data-exam-change-args='["passingScore","$value"]'>
                </label>
                <label class="ex2-field">
                    <span>Quiz value points</span>
                    <input id="exam-template-weight" name="exam_template_weight" class="ex2-input" type="number" min="0" value="${escapeHtml(String(draft.gradingWeight))}" data-exam-change-call="updateExamTemplateField" data-exam-change-args='["gradingWeight","$value"]'>
                </label>
                <label class="ex2-field">
                    <span><i class="fas fa-lock"></i> Default question points</span>
                    <input id="exam-template-default-score" name="exam_template_default_score" class="ex2-input" type="number" min="1" value="${escapeHtml(String(draft.defaultQuestionScore || 1))}" data-exam-change-call="updateExamTemplateField" data-exam-change-args='["defaultQuestionScore","$value"]'>
                </label>
                <label class="ex2-field">
                    <span><i class="fas fa-lock"></i> Default options per question</span>
                    <input id="exam-template-default-options" name="exam_template_default_options" class="ex2-input" type="number" min="2" max="8" value="${escapeHtml(String(draft.defaultOptionCount || 4))}" data-exam-change-call="updateExamTemplateField" data-exam-change-args='["defaultOptionCount","$value"]'>
                </label>
                <label class="ex2-field ex2-field-span">
                    <span>Instructions (auto-appended: Academic Integrity Policy)</span>
                    <textarea id="exam-template-instructions" name="exam_template_instructions" class="ex2-textarea" rows="5" data-exam-input-call="syncExamTemplateField" data-exam-input-args='["instructions","$value"]' data-exam-change-call="updateExamTemplateField" data-exam-change-args='["instructions","$value"]'>${escapeHtml(draft.instructions)}</textarea>
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
            <div class="ex2-stack">
                <div class="ex2-panel-head" style="padding:0;">
                    <div><h3>Question Bank (${total} questions Â· ${totalScore} points)</h3><p>Each question is a multiple-choice item. Navigate using the controls below.</p></div>
                </div>
                <div class="ex2-qnav-bar">
                    <div class="ex2-qnav-controls">
                        <button type="button" class="ex2-btn is-secondary" ${page <= 0 ? 'disabled' : ''} data-exam-call="navigateBankQuestion" data-exam-args='[${page - 1}]' title="Previous question"><i class="fas fa-chevron-left"></i></button>
                        <div class="ex2-qnav-indicator">
                            <label>Question</label>
                            <input type="number" class="ex2-qnav-input" min="1" max="${total}" value="${page + 1}" data-exam-change-call="navigateBankQuestion" data-exam-change-args='["$bankIndex:${total - 1}"]'>
                            <span>of ${total}</span>
                        </div>
                        <button type="button" class="ex2-btn is-secondary" ${page >= total - 1 ? 'disabled' : ''} data-exam-call="navigateBankQuestion" data-exam-args='[${page + 1}]' title="Next question"><i class="fas fa-chevron-right"></i></button>
                    </div>
                    <div class="ex2-qnav-actions">
                        <button type="button" class="ex2-btn is-primary" data-exam-call="addExamBankQuestion" data-exam-args='["mcq"]'><i class="fas fa-plus"></i> Add Question</button>
                        ${total > 1 ? `<button type="button" class="ex2-btn is-ghost" data-exam-call="removeExamBankQuestion" data-exam-args='["${escapeHtml(question?.id || '')}"]' title="Delete this question"><i class="fas fa-trash"></i></button>` : ''}
                    </div>
                </div>
                <div class="ex2-qnav-dots">
                    ${bank.map((q, i) => `<button type="button" class="ex2-qnav-dot ${i === page ? 'is-active' : ''} ${q.text ? 'has-content' : ''}" data-exam-call="navigateBankQuestion" data-exam-args='[${i}]' title="Q${i + 1}">${i + 1}</button>`).join('')}
                </div>
                ${question ? renderQuestionEditor(question, page, 'bank') : `<div class="ex2-empty">No questions yet. Click "Add Question" to begin.</div>`}
            </div>
        `;
    }

    function renderStepVariants(draft) {
        const bank = draft.questionBank || [];
        const variants = draft.variants || [];
        return `
            <div class="ex2-stack">
                <div class="ex2-panel-head" style="padding:0;">
                    <div><h3>Exam Variants (${variants.length})</h3><p>Auto-generate variants from your ${bank.length}-question bank, or create them manually.</p></div>
                </div>
                <div class="ex2-auto-gen-box">
                    <div class="ex2-side-kicker">Auto-Generate Variants</div>
                    <div class="ex2-form-grid" style="margin-top:12px;">
                        <label class="ex2-field">
                            <span>Number of variants</span>
                            <input id="exam-auto-gen-count" class="ex2-input" type="number" min="1" max="26" value="${runtime.autoGenVariantCount}" data-exam-change-call="setAutoGenVariantCount" data-exam-change-args='["$value"]'>
                        </label>
                        <label class="ex2-field">
                            <span>Questions per variant</span>
                            <input id="exam-auto-gen-per" class="ex2-input" type="number" min="1" value="${runtime.autoGenQuestionsPerVariant}" data-exam-change-call="setAutoGenQuestionsPerVariant" data-exam-change-args='["$value"]'>
                        </label>
                    </div>
                    <div style="margin-top:14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
                        <button type="button" class="ex2-btn is-primary" data-exam-call="runAutoGenerateVariants"><i class="fas fa-wand-magic-sparkles"></i> Generate ${runtime.autoGenVariantCount} Variants (${runtime.autoGenQuestionsPerVariant} each)</button>
                        ${bank.length < runtime.autoGenVariantCount * runtime.autoGenQuestionsPerVariant ? `<span class="ex2-muted" style="font-size:12px;"><i class="fas fa-info-circle"></i> Bank has ${bank.length} questions, some overlap will occur</span>` : `<span class="ex2-muted" style="font-size:12px;"><i class="fas fa-check-circle" style="color:#208b64;"></i> Bank has enough for zero overlap</span>`}
                    </div>
                </div>
                <div class="ex2-inline-actions" style="margin-top:8px;">
                    <button type="button" class="ex2-btn is-secondary" data-exam-call="addManualVariant"><i class="fas fa-plus"></i> Add Manual Variant</button>
                </div>
                ${variants.length ? variants.map((v, vi) => renderVariantCard(v, vi, bank)).join('') : `<div class="ex2-empty">No variants created yet. Use auto-generate above or add manually.</div>`}
            </div>
        `;
    }

    function renderStepReview(draft) {
        const bank = draft.questionBank || [];
        const variants = draft.variants || [];
        const totalScore = bank.reduce((s, q) => s + (q.score || 1), 0);
        return `
            <div class="ex2-stack">
                <div class="ex2-review-card">
                    <h3>${escapeHtml(draft.title || 'Untitled Exam')}</h3>
                    <div class="ex2-meta">${escapeHtml(draft.subjectName || 'No subject')} Â· ${draft.examType === 'paper' ? 'Paper' : 'Digital'} Â· ${draft.durationMinutes} min</div>
                    <p style="margin-top:10px;">${escapeHtml(draft.instructions || 'No instructions added.')}</p>
                </div>
                <div class="ex2-mini-grid">
                    <div><strong>${bank.length}</strong><span>Question Bank</span></div>
                    <div><strong>${variants.length}</strong><span>Variants</span></div>
                    <div><strong>${totalScore}</strong><span>Total points</span></div>
                </div>
                ${variants.map((v, i) => {
                    const vQuestions = bank.filter((q) => (v.questionIds || []).includes(q.id));
                    return `<div class="ex2-list-card" style="padding:16px;"><h3>${escapeHtml(v.label)}</h3><div class="ex2-meta">${vQuestions.length} questions Â· ${vQuestions.reduce((s, q) => s + (q.score || 1), 0)} points</div></div>`;
                }).join('')}
                ${!variants.length ? `<div class="ex2-warning"><i class="fas fa-triangle-exclamation"></i> No variants created. Go to the Variants step to generate them before submitting.</div>` : ''}
                <div class="ex2-review-card" style="border-color:rgba(var(--lux-accent-rgb),0.3);">
                    <div class="ex2-side-kicker">Academic Integrity Notice</div>
                    <p style="font-size:13px;color:var(--lux-text-muted);line-height:1.6;">All examinations are conducted under the university's Academic Integrity Policy. Use of unauthorized materials, communication with other students, or any form of cheating will result in disciplinary action including course failure and potential expulsion.</p>
                </div>
            </div>
        `;
    }

    window.renderExamTemplateBuilder = function renderExamTemplateBuilder() {
        const draft = getTemplateDraft();
        const STEPS = ['details', 'questions', 'variants', 'review'];
        const STEP_LABELS = { details: 'Details', questions: 'Question Bank', variants: 'Variants', review: 'Review' };
        const STEP_ICONS = { details: 'fa-sliders', questions: 'fa-bank', variants: 'fa-shuffle', review: 'fa-check-circle' };
        const bankCount = (draft.questionBank || draft.questions || []).length;
        const variantCount = (draft.variants || []).length;
        const totalPts = (draft.questionBank || draft.questions || []).reduce((s, q) => s + (parseInt(q.score, 10) || 0), 0);

        const stepDone = (step) => {
            if (step === 'details') return !!(draft.subjectId && draft.title);
            if (step === 'questions') return bankCount > 0;
            if (step === 'variants') return variantCount > 0;
            return false;
        };

        return `
            <div class="ex2-builder-fullscreen">
                <div class="ex2-builder-header">
                    <div>
                        <button type="button" class="ex2-btn is-ghost" data-exam-call="cancelExamDraft"><i class="fas fa-arrow-left"></i> Back to library</button>
                        <h2 style="margin-top:8px;">${escapeHtml(draft.title || (draft.editingTemplateId ? 'Edit Quiz' : 'New Quiz'))}</h2>
                    </div>
                    <div class="ex2-inline-actions">
                        <button type="button" class="ex2-btn is-ghost" data-exam-call="exportQuizAs" data-exam-args='["pdf"]'><i class="fas fa-file-pdf"></i> PDF</button>
                        <button type="button" class="ex2-btn is-ghost" data-exam-call="exportQuizAs" data-exam-args='["docx"]'><i class="fas fa-file-word"></i> DOCX</button>
                        <button type="button" class="ex2-btn is-ghost" data-exam-call="saveExamTemplateDraft"><i class="fas fa-save"></i> Save Draft</button>
                        <button type="button" class="ex2-btn is-primary" data-exam-call="saveAndSubmitExamTemplate"><i class="fas fa-paper-plane"></i> Submit to Admin</button>
                    </div>
                </div>
                <div class="ex2-progress-bar">
                    ${STEPS.map((step, i) => {
                        const done = stepDone(step);
                        const active = runtime.templateStep === step;
                        return `<button type="button" class="ex2-progress-step${active ? ' is-active' : ''}${done && !active ? ' is-done' : ''}" data-exam-call="setExamTemplateStep" data-exam-args='["${step}"]' aria-current="${active ? 'step' : 'false'}"><span class="step-num">${done && !active ? `<i class="fas fa-check"></i>` : (i + 1)}</span><span class="step-label"><i class="fas ${STEP_ICONS[step]}"></i>${STEP_LABELS[step]}</span></button>`;
                    }).join('')}
                </div>
                <div class="ex2-builder-layout">
                    <div class="ex2-panel" style="animation: exSlideIn .3s ease;">
                        ${runtime.templateStep === 'details' ? renderStepDetails(draft)
                            : runtime.templateStep === 'questions' ? renderStepQuestions(draft)
                            : runtime.templateStep === 'variants' ? renderStepVariants(draft)
                            : renderStepReview(draft)}
                    </div>
                    <div class="ex2-live-sidebar">
                        <h3>Quiz Overview</h3>
                        <div class="ex2-sidebar-stat"><span>Subject</span><strong>${escapeHtml(draft.subjectName || 'Not set')}</strong></div>
                        <div class="ex2-sidebar-stat"><span>Type</span><strong>${escapeHtml(draft.examType === 'paper' ? 'Paper' : 'Digital')}</strong></div>
                        <div class="ex2-sidebar-stat"><span>Duration</span><strong>${draft.durationMinutes || 90} min</strong></div>
                        <div class="ex2-sidebar-stat"><span>Course Year</span><strong>${escapeHtml(formatCourseYearLabel(draft.courseNumber))}</strong></div>
                        <div class="ex2-sidebar-stat"><span>Course No.</span><strong>${escapeHtml(draft.courseCode || 'Optional')}</strong></div>
                        <div class="ex2-sidebar-stat"><span>Passing Points</span><strong>${draft.passingScore || 50} pts</strong></div>
                        <div class="ex2-sidebar-stat"><span>Quiz Value</span><strong>${draft.gradingWeight || 30} pts</strong></div>
                        <div class="ex2-sidebar-stat"><span>New Q Default</span><strong>${draft.defaultQuestionScore || 1} pts / ${draft.defaultOptionCount || 4} options</strong></div>
                        <div style="border-top:1px solid var(--lux-border);margin:14px 0;"></div>
                        <div class="ex2-sidebar-stat"><span>Questions</span><strong>${bankCount}</strong></div>
                        <div class="ex2-sidebar-stat"><span>Total Points</span><strong>${totalPts}</strong></div>
                        <div class="ex2-sidebar-stat"><span>Variants</span><strong>${variantCount}</strong></div>
                        ${variantCount > 0 ? `<div class="ex2-sidebar-stat"><span>Q/Variant</span><strong>${(draft.variants[0]?.questionIds || []).length}</strong></div>` : ''}
                        <div style="border-top:1px solid var(--lux-border);margin:14px 0;"></div>
                        <button type="button" class="ex2-btn is-secondary" style="width:100%;justify-content:center;" data-exam-call="openShareModal" data-exam-args='["${escapeHtml(draft.editingTemplateId)}"]'><i class="fas fa-share-nodes"></i> Share Quiz</button>
                    </div>
                </div>
            </div>
            ${runtime.showShareModal ? renderShareModal(draft) : ''}
        `;
    };
})();
