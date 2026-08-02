(function initSocialSurveysModule() {
    if (window.__KIU_SOCIAL_SURVEYS_MODULE_LOADED) return;
    window.__KIU_SOCIAL_SURVEYS_MODULE_LOADED = true;

    const hooks = window.__kiuSocialSurveysHooks || {};
    const {
        state,
        currentUser,
        currentUserId,
        text,
        escape,
        when,
        controlId,
        surveysForTab,
        surveyById,
        surveyStatusLabel,
        surveyAudienceLabel,
        canPublishOfficialSurveys,
        ensureSurveyDraftSettings,
        ensureSurveyDraftQuestions,
        ensureSurveyDraftActiveIndex,
        surveyQuestionTypeMeta,
        surveyQuestionNeedsOptions,
        surveyQuestionDefaultMaxLength,
        surveyAudienceCreateLabel,
        surveyResultsVisibilityLabel,
        toDateTimeLocalValue,
        postingScopeOptions,
        activeDialog,
        setPanel,
        openDialog,
        closeDialog,
        renderSocialPageNow,
        withBusy,
        clearSurveyFlowState,
        defaultSurveyDraftQuestions,
        defaultSurveyDraftSettings,
        closePortalSocialSurvey,
        deletePortalSocialSurvey,
        loadPortalSocialSurveyResults,
        invalidateSocialRenderCache,
        patchSurveyCreateQuestionsPanel,
        syncSurveyDraftFromForm,
        createPortalSocialSurvey,
        respondPortalSocialSurvey,
        fromDateTimeLocalValue,
        restorePreviousDialog,
        isStaffAccount,
        parseSurveyQuestionsFromForm,
        parseSurveyScopeValue,
        collectSurveyAnswersFromForm,
        isSurveyAnswerProvided,
        addPortalSocialToast,
        flashSurveySubmitButton,
        setSurveySubmitButtonIcon,
        setSurveySubmitButtonLabel,
        waitForSurveySubmitAnimation
    } = hooks;

    if (
        typeof state !== 'function'
        || typeof currentUser !== 'function'
        || typeof text !== 'function'
        || typeof escape !== 'function'
        || typeof surveysForTab !== 'function'
        || typeof surveyById !== 'function'
        || typeof canPublishOfficialSurveys !== 'function'
        || typeof ensureSurveyDraftSettings !== 'function'
        || typeof ensureSurveyDraftQuestions !== 'function'
        || typeof ensureSurveyDraftActiveIndex !== 'function'
        || typeof surveyQuestionTypeMeta !== 'function'
        || typeof surveyQuestionNeedsOptions !== 'function'
        || typeof surveyQuestionDefaultMaxLength !== 'function'
        || typeof surveyAudienceCreateLabel !== 'function'
        || typeof surveyResultsVisibilityLabel !== 'function'
        || typeof toDateTimeLocalValue !== 'function'
        || typeof postingScopeOptions !== 'function'
        || typeof activeDialog !== 'function'
        || typeof setPanel !== 'function'
        || typeof openDialog !== 'function'
        || typeof closeDialog !== 'function'
        || typeof renderSocialPageNow !== 'function'
        || typeof withBusy !== 'function'
        || typeof clearSurveyFlowState !== 'function'
        || typeof defaultSurveyDraftQuestions !== 'function'
        || typeof defaultSurveyDraftSettings !== 'function'
        || typeof closePortalSocialSurvey !== 'function'
        || typeof deletePortalSocialSurvey !== 'function'
        || typeof loadPortalSocialSurveyResults !== 'function'
        || typeof invalidateSocialRenderCache !== 'function'
        || typeof patchSurveyCreateQuestionsPanel !== 'function'
        || typeof syncSurveyDraftFromForm !== 'function'
        || typeof createPortalSocialSurvey !== 'function'
        || typeof respondPortalSocialSurvey !== 'function'
        || typeof fromDateTimeLocalValue !== 'function'
        || typeof restorePreviousDialog !== 'function'
        || typeof isStaffAccount !== 'function'
        || typeof parseSurveyQuestionsFromForm !== 'function'
        || typeof parseSurveyScopeValue !== 'function'
        || typeof collectSurveyAnswersFromForm !== 'function'
        || typeof isSurveyAnswerProvided !== 'function'
        || typeof addPortalSocialToast !== 'function'
        || typeof flashSurveySubmitButton !== 'function'
        || typeof setSurveySubmitButtonIcon !== 'function'
        || typeof setSurveySubmitButtonLabel !== 'function'
        || typeof waitForSurveySubmitAnimation !== 'function'
    ) {
        throw new Error('Social surveys hooks are unavailable.');
    }

    function renderSurveysHero(runtime, metrics = {}, options = {}) {
        const openCount = Number(metrics.open || 0);
        const respondedCount = Number(metrics.responded || 0);
        const managedCount = Number(metrics.managed || 0);
        const totalCount = Number(metrics.total || 0);
        const activeTab = text(options.tab || runtime.ui?.surveysTab || 'available') || 'available';
        const activeLane = text(options.lane || runtime.ui?.surveysSubTab || 'student') || 'student';
        const searchValue = text(options.searchValue || '');
        const controlIdFn = typeof options.controlId === 'function' ? options.controlId : (name) => text(name);
        const searchId = controlIdFn('surveys-search');
        const isOfficialLane = activeLane === 'official';
        const canCreate = typeof options.canCreate === 'boolean'
            ? options.canCreate
            : (!isOfficialLane || canPublishOfficialSurveys(currentUser()));
        const showManaged = !isOfficialLane || canPublishOfficialSurveys(currentUser());
        const stats = [
            { label: 'Open', value: openCount },
            { label: 'Responded', value: respondedCount },
            ...(showManaged ? [{ label: 'Managed', value: managedCount }] : []),
            { label: 'Total', value: totalCount }
        ];
        const laneTabs = [
            { lane: 'student', label: 'Student surveys', icon: 'fa-clipboard-list', helper: 'Community polls and peer feedback' },
            { lane: 'official', label: 'Official surveys', icon: 'fa-landmark', helper: 'University-wide staff surveys' }
        ];
        const tabs = [
            { tab: 'available', label: 'Available', icon: 'fa-inbox', helper: 'Surveys you can take now' },
            { tab: 'my-responses', label: 'My responses', icon: 'fa-check-double', helper: 'What you already answered' },
            ...(showManaged ? [{ tab: 'managed', label: 'Manage', icon: 'fa-sliders', helper: 'Surveys you created' }] : []),
            { tab: 'closed', label: 'Closed', icon: 'fa-archive', helper: 'Completed surveys' },
            { tab: 'pinned', label: 'Pinned', icon: 'fa-thumbtack', helper: 'Highlighted and saved surveys' }
        ];
        const laneCopy = isOfficialLane
            ? { kicker: 'Official feedback', title: 'University services, policy, and academic experience', text: 'Take official campus surveys published by staff and track published results.' }
            : { kicker: 'Campus feedback', title: 'Share your voice on courses, services, and campus life', text: 'Take open surveys, track what you have answered, and publish polls for your community.' };
        const createLabel = isOfficialLane ? 'Publish official survey' : 'Create survey';
        const createIcon = isOfficialLane ? 'fa-landmark' : 'fa-plus';
        const bodyHtml = text(options.bodyHtml || '');
        const merged = Boolean(bodyHtml);
        return `
            <section class="social-neo-card social-neo-surveys-hero home-hover-chip${merged ? ' is-merged' : ''}">
                <div class="social-neo-surveys-hero-head">
                    <div class="social-neo-surveys-hero-copy">
                        <span class="social-neo-section-kicker">${escape(laneCopy.kicker)}</span>
                        <h2>${escape(laneCopy.title)}</h2>
                        <p>${escape(laneCopy.text)}</p>
                    </div>
                    <div class="social-neo-surveys-hero-actions">
                        ${(window.renderSocialBrowseFacultyHeroControl || (window.KiuSocialChromeModel || {}).renderSocialBrowseFacultyHeroControl)?.(runtime) || ''}
                        ${canCreate ? `
                        <button class="lux-primary-btn social-neo-surveys-hero-create-btn" type="button" data-action="survey-create-open">
                            <i class="fas ${escape(createIcon)}"></i>
                            <span>${escape(createLabel)}</span>
                        </button>
                        ` : ''}
                    </div>
                </div>
                <div class="social-neo-surveys-hero-stats home-hover-chip">
                    ${stats.map((stat) => `
                        <article class="social-neo-surveys-hero-stat social-neo-events-hero-stat lux-strip-card surface-card lux-soft-chrome home-hover-chip">
                            <strong>${escape(String(stat.value))}</strong>
                            <span>${escape(stat.label)}</span>
                        </article>
                    `).join('')}
                </div>
                <div class="social-neo-surveys-hero-grid social-neo-surveys-hero-grid--lanes home-hover-chip">
                    ${laneTabs.map((entry) => `
                        <button class="lux-secondary-btn social-neo-surveys-hero-tab ${activeLane === entry.lane ? 'is-focused' : ''}" type="button"
                                data-action="surveys-lane-${escape(entry.lane)}" aria-pressed="${activeLane === entry.lane ? 'true' : 'false'}">
                            <span class="social-neo-surveys-hero-tab-icon"><i class="fas ${escape(entry.icon)}"></i></span>
                            <span class="social-neo-surveys-hero-tab-copy">
                                <strong>${escape(entry.label)}</strong>
                                <small>${escape(entry.helper)}</small>
                            </span>
                        </button>
                    `).join('')}
                </div>
                <div class="social-neo-surveys-hero-grid home-hover-chip">
                    ${tabs.map((entry) => `
                        <button class="lux-secondary-btn social-neo-surveys-hero-tab ${activeTab === entry.tab ? 'is-focused' : ''}" type="button"
                                data-action="panel-surveys" data-surveys-tab="${escape(entry.tab)}" aria-pressed="${activeTab === entry.tab ? 'true' : 'false'}">
                            <span class="social-neo-surveys-hero-tab-icon"><i class="fas ${escape(entry.icon)}"></i></span>
                            <span class="social-neo-surveys-hero-tab-copy">
                                <strong>${escape(entry.label)}</strong>
                                <small>${escape(entry.helper)}</small>
                            </span>
                        </button>
                    `).join('')}
                </div>
                <div class="social-neo-surveys-hero-toolbar home-hover-chip">
                    <label for="${escape(searchId)}">
                        <span class="social-neo-label">Search</span>
                        <input class="social-neo-input lux-control" id="${escape(searchId)}" type="search" name="surveysSearch" placeholder="Search title, organizer, or audience" value="${escape(searchValue)}">
                    </label>
                </div>
                ${merged ? `
                    <div class="social-neo-surveys-hero-divider" aria-hidden="true"></div>
                    <div class="social-neo-stack social-neo-survey-listings">${bodyHtml}</div>
                ` : ''}
            </section>
        `;
    }

    function isQuestionRequired(question) {
        return question?.required !== false;
    }

    function surveyQuestionIsText(questionType) {
        const type = text(questionType).toLowerCase();
        return type === 'text' || type === 'short_text' || type === 'long_text';
    }

    function questionRequiredAttr(question) {
        return isQuestionRequired(question) ? ' required' : '';
    }

    function questionMaxLengthAttr(question) {
        const maxLength = Number(question?.maxLength);
        return Number.isFinite(maxLength) && maxLength > 0 ? ` maxlength="${maxLength}"` : '';
    }

    function savedAnswerForQuestion(savedAnswers, questionId) {
        if (!Array.isArray(savedAnswers)) return null;
        const normalizedId = text(questionId);
        return savedAnswers.find((entry) => text(entry?.questionId) === normalizedId) || null;
    }

    function choiceCheckedAttr(savedAnswer, value, inputType) {
        if (!savedAnswer) return '';
        const normalizedValue = text(value);
        if (inputType === 'checkbox') {
            const optionIds = Array.isArray(savedAnswer.optionIds) ? savedAnswer.optionIds.map((entry) => text(entry)) : [];
            return optionIds.includes(normalizedValue) ? ' checked' : '';
        }
        if (savedAnswer.yesNoValue !== undefined && savedAnswer.yesNoValue !== null) {
            const yesNoValue = savedAnswer.yesNoValue ? 'yes' : 'no';
            return normalizedValue === yesNoValue ? ' checked' : '';
        }
        if (Number.isFinite(savedAnswer.ratingValue)) {
            return normalizedValue === text(savedAnswer.ratingValue) ? ' checked' : '';
        }
        const optionIds = Array.isArray(savedAnswer.optionIds) ? savedAnswer.optionIds.map((entry) => text(entry)) : [];
        return optionIds.includes(normalizedValue) ? ' checked' : '';
    }

    function renderTakeChoiceLabel(inputType, name, value, qId, label, question, extraInputAttrs = '', checkedAttr = '') {
        const modifier = inputType === 'radio'
            ? 'social-neo-survey-take-choice--radio'
            : 'social-neo-survey-take-choice--checkbox';
        return `
            <label class="social-neo-survey-take-choice lux-soft-chrome home-hover-chip ${modifier}">
                <input type="${inputType}" name="${name}" value="${value}" data-question-id="${qId}"${questionRequiredAttr(question)}${extraInputAttrs}${checkedAttr}>
                <span>${label}</span>
            </label>
        `;
    }

    function renderQuestionInput(question, surveyId, savedAnswers = null) {
        const questionType = text(question?.questionType || 'single_choice');
        const qId = text(question?.id);
        const savedAnswer = savedAnswerForQuestion(savedAnswers, qId);
        if (questionType === 'single_choice' || questionType === 'multiple_choice') {
            const inputType = questionType === 'single_choice' ? 'radio' : 'checkbox';
            const name = questionType === 'single_choice' ? `survey-q-${escape(qId)}` : `survey-q-${escape(qId)}[]`;
            return `
                <div class="social-neo-stack social-neo-survey-take-choice-list">
                    ${(Array.isArray(question.options) ? question.options : []).map((option) => renderTakeChoiceLabel(
                        inputType,
                        name,
                        escape(text(option.id)),
                        escape(qId),
                        escape(text(option.label)),
                        question,
                        '',
                        choiceCheckedAttr(savedAnswer, text(option.id), inputType)
                    )).join('')}
                </div>
            `;
        }
        if (questionType === 'rating') {
            const min = Number(question.minRating) || 1;
            const max = Number(question.maxRating) || 5;
            const values = [];
            for (let value = min; value <= max; value += 1) values.push(value);
            return `
                <div class="social-neo-survey-take-choice-list social-neo-survey-take-choice-list--inline social-neo-survey-rating-row">
                    ${values.map((value) => renderTakeChoiceLabel(
                        'radio',
                        `survey-q-${escape(qId)}`,
                        escape(String(value)),
                        escape(qId),
                        escape(String(value)),
                        question,
                        ' data-rating="1"',
                        choiceCheckedAttr(savedAnswer, String(value), 'radio')
                    )).join('')}
                </div>
            `;
        }
        if (questionType === 'yes_no') {
            return `
                <div class="social-neo-survey-take-choice-list social-neo-survey-take-choice-list--inline">
                    ${renderTakeChoiceLabel('radio', `survey-q-${escape(qId)}`, 'yes', escape(qId), 'Yes', question, ' data-yes-no="1"', choiceCheckedAttr(savedAnswer, 'yes', 'radio'))}
                    ${renderTakeChoiceLabel('radio', `survey-q-${escape(qId)}`, 'no', escape(qId), 'No', question, ' data-yes-no="1"', choiceCheckedAttr(savedAnswer, 'no', 'radio'))}
                </div>
            `;
        }
        if (surveyQuestionIsText(questionType)) {
            const required = questionRequiredAttr(question);
            const maxLength = questionMaxLengthAttr(question);
            const savedText = escape(text(savedAnswer?.textValue || ''));
            return `<textarea class="social-neo-textarea lux-control" name="survey-q-${escape(qId)}" rows="4" data-question-id="${escape(qId)}" data-text="1" placeholder="Your answer"${required}${maxLength}>${savedText}</textarea>`;
        }
        return '';
    }

    function renderTakeSurvey(survey) {
        const questions = Array.isArray(survey?.questions) ? survey.questions : [];
        return `
            <div class="social-neo-surveys-take-shell">
                <button class="lux-secondary-btn home-hover-chip" type="button" data-action="survey-take-close">&larr; Back to Surveys</button>
                <header class="social-neo-card social-neo-survey-take-hero home-hover-chip">
                    <div class="social-neo-section-head">
                        <div>
                            <strong>${escape(text(survey.title))}</strong>
                            <span>${escape(String(questions.length))} question${questions.length === 1 ? '' : 's'}${survey.allowAnonymous ? ' · Anonymous' : ''}</span>
                        </div>
                    </div>
                    ${text(survey.description) ? `<p class="social-neo-muted">${escape(text(survey.description))}</p>` : ''}
                </header>
                <form class="social-neo-stack" data-form="survey-response" data-survey-id="${escape(text(survey.id))}">
                    ${questions.map((question, index) => `
                        <section class="social-neo-card social-neo-survey-take-card lux-soft-chrome home-hover-chip" data-question-id="${escape(text(question.id))}" style="--survey-stagger: ${index}">
                            <div class="social-neo-survey-take-card-head">
                                <span class="social-neo-survey-take-card-index">Question ${index + 1} of ${questions.length}</span>
                                <span class="social-neo-label">${escape(text(question.prompt))}${question.required === false ? '' : ' *'}</span>
                            </div>
                            ${text(question.helpText) ? `<small class="social-neo-muted">${escape(text(question.helpText))}</small>` : ''}
                            ${renderQuestionInput(question, survey.id)}
                        </section>
                    `).join('')}
                    <div class="social-neo-inline social-neo-events-form-actions social-neo-survey-submit-actions">
                        <span class="social-neo-flex-spacer"></span>
                        <button class="lux-primary-btn social-neo-survey-submit-btn home-hover-chip" type="submit">
                            <span class="social-neo-survey-submit-btn-icon" aria-hidden="true"><i class="fas fa-paper-plane"></i></span>
                            <span class="social-neo-survey-submit-btn-label">Submit responses</span>
                        </button>
                    </div>
                </form>
            </div>
        `;
    }

    function surveyQuestionTypeLabel(questionType = '') {
        const map = {
            single_choice: 'Single choice',
            multiple_choice: 'Multiple choice',
            rating: 'Rating',
            yes_no: 'Yes / No',
            text: 'Text',
            short_text: 'Text',
            long_text: 'Text'
        };
        return map[text(questionType)] || text(questionType || 'Question');
    }

    function buildRatingHistogram(distribution, min = 1, max = 5) {
        const bins = {};
        for (let value = min; value <= max; value += 1) bins[value] = 0;
        (Array.isArray(distribution) ? distribution : []).forEach((entry) => {
            const value = Math.round(Number(entry));
            if (Number.isFinite(value) && value >= min && value <= max) bins[value] += 1;
        });
        const total = Object.values(bins).reduce((sum, count) => sum + count, 0) || 1;
        return Object.keys(bins)
            .sort((left, right) => Number(left) - Number(right))
            .map((key) => {
                const count = bins[key];
                return {
                    value: Number(key),
                    count,
                    percent: Math.round((count / total) * 100)
                };
            });
    }

    function renderRatingStars(average = 0, max = 5) {
        const stars = [];
        for (let index = 1; index <= max; index += 1) {
            const filled = average >= index;
            const half = !filled && average >= index - 0.5;
            const icon = filled ? 'fa-star' : (half ? 'fa-star-half-stroke' : 'fa-star');
            const modifier = filled || half ? 'is-filled' : '';
            stars.push(`<i class="fas ${icon} social-neo-survey-results-star ${modifier}" aria-hidden="true"></i>`);
        }
        return stars.join('');
    }

    function renderChoiceResults(item) {
        const options = [...(Array.isArray(item.options) ? item.options : [])].sort((left, right) => Number(right.count || 0) - Number(left.count || 0));
        if (!options.length) {
            return `<div class="social-neo-survey-results-empty lux-soft-chrome home-hover-chip"><i class="fas fa-chart-simple"></i><span class="lux-card-copy">No responses yet for this question.</span></div>`;
        }
        return `
            <div class="social-neo-list social-neo-survey-result-rows">
                ${options.map((option, index) => `
                    <article class="social-neo-survey-result-row home-hover-chip" style="--survey-stagger: ${index}">
                        <div class="social-neo-survey-result-row-head">
                            <span class="social-neo-survey-result-rank">#${index + 1}</span>
                            <strong class="social-neo-survey-result-label">${escape(text(option.label))}</strong>
                            <span class="social-neo-pill social-neo-survey-result-pill home-hover-chip">${escape(String(option.percent || 0))}%</span>
                            <span class="social-neo-muted social-neo-survey-result-count">${escape(String(option.count || 0))} vote${Number(option.count || 0) === 1 ? '' : 's'}</span>
                        </div>
                        <div class="social-neo-survey-result-bar is-animated" style="--survey-pct: ${escape(String(option.percent || 0))}"></div>
                    </article>
                `).join('')}
            </div>
        `;
    }

    function renderRatingResults(item) {
        const histogram = buildRatingHistogram(item.distribution);
        if (!histogram.some((bin) => bin.count > 0) && !Number.isFinite(item.average)) {
            return `<div class="social-neo-survey-results-empty lux-soft-chrome home-hover-chip"><i class="fas fa-star"></i><span class="lux-card-copy">No ratings submitted yet.</span></div>`;
        }
        return `
            <div class="social-neo-survey-results-rating-summary">
                <div class="social-neo-survey-results-rating-avg lux-soft-chrome home-hover-chip">
                    <div class="social-neo-survey-results-stars" aria-hidden="true">${renderRatingStars(Number(item.average) || 0)}</div>
                    <strong>${escape(String(item.average || 0))}</strong>
                    <span class="social-neo-muted">average</span>
                </div>
                <div class="social-neo-survey-results-rating-histogram">
                    ${histogram.map((bin) => `
                        <div class="social-neo-survey-results-rating-bin home-hover-chip">
                            <span class="social-neo-survey-results-rating-bin-label">${escape(String(bin.value))}★</span>
                            <div class="social-neo-survey-result-bar is-animated is-compact" style="--survey-pct: ${escape(String(bin.percent || 0))}"></div>
                            <span class="social-neo-muted">${escape(String(bin.count || 0))}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    function renderYesNoResults(item) {
        const yes = Number(item.yes || 0);
        const no = Number(item.no || 0);
        const total = yes + no;
        if (!total) {
            return `<div class="social-neo-survey-results-empty lux-soft-chrome home-hover-chip"><i class="fas fa-circle-question"></i><span class="lux-card-copy">No yes/no responses yet.</span></div>`;
        }
        const yesPct = Math.round((yes / total) * 100);
        const noPct = 100 - yesPct;
        return `
            <div class="social-neo-survey-results-yesno">
                <div class="social-neo-survey-results-yesno-track lux-soft-chrome home-hover-chip" style="--survey-yes-pct: ${yesPct}">
                    <span class="social-neo-survey-results-yesno-yes">Yes ${escape(String(yesPct))}% (${escape(String(yes))})</span>
                    <span class="social-neo-survey-results-yesno-no">No ${escape(String(noPct))}% (${escape(String(no))})</span>
                </div>
            </div>
        `;
    }

    function renderTextResults(item) {
        const responses = Array.isArray(item.textResponses) ? item.textResponses.filter(Boolean) : [];
        if (!responses.length) {
            return `<div class="social-neo-survey-results-empty lux-soft-chrome home-hover-chip"><i class="fas fa-quote-left"></i><span class="lux-card-copy">No written responses to show.</span></div>`;
        }
        const visible = responses.slice(0, 8);
        return `
            <div class="social-neo-list social-neo-survey-results-quotes">
                ${visible.map((entry, index) => `
                    <blockquote class="social-neo-survey-results-quote lux-soft-chrome home-hover-chip" style="--survey-stagger: ${index}">
                        <p>${escape(text(entry))}</p>
                    </blockquote>
                `).join('')}
                ${responses.length > 8 ? `<div class="social-neo-muted social-neo-survey-results-more">+${responses.length - 8} more responses in export</div>` : ''}
            </div>
        `;
    }

    function renderQuestionResultBody(item) {
        const questionType = text(item.questionType || '');
        if (questionType === 'single_choice' || questionType === 'multiple_choice') return renderChoiceResults(item);
        if (questionType === 'rating') return renderRatingResults(item);
        if (questionType === 'yes_no') return renderYesNoResults(item);
        if (surveyQuestionIsText(questionType)) return renderTextResults(item);
        return `<div class="social-neo-survey-results-empty lux-soft-chrome home-hover-chip"><i class="fas fa-circle-info"></i><span class="lux-card-copy">Results are not available for this question type.</span></div>`;
    }

    function renderQuestionResultCard(item, index) {
        return `
            <section class="lux-glass-dialog-group-section social-neo-survey-results-question lux-soft-chrome home-hover-chip" style="--survey-stagger: ${index}">
                <div class="lux-glass-dialog-group-section-head social-neo-survey-results-question-head">
                    <div>
                        <strong class="lux-card-title">Question ${index + 1}</strong>
                        <span class="lux-card-copy">${escape(text(item.prompt))}</span>
                    </div>
                    <span class="social-neo-pill social-neo-survey-results-type-pill home-hover-chip">${escape(surveyQuestionTypeLabel(item.questionType))}</span>
                </div>
                ${renderQuestionResultBody(item)}
            </section>
        `;
    }

    function renderSurveyResultsDialog(survey, results) {
        const resultItems = Array.isArray(results?.results) ? results.results : [];
        const responseCount = Number(results?.responseCount || survey.responseCount || 0);
        const questionCount = Array.isArray(survey.questions) ? survey.questions.length : resultItems.length;
        const metaParts = [
            escape(text(survey.createdByName || 'Campus member')),
            `${escape(String(responseCount))} responses`,
            survey.closesAt ? `Ends ${escape(when(survey.closesAt))}` : '',
            survey.allowAnonymous ? 'Anonymous' : ''
        ].filter(Boolean);
        const questionsMarkup = resultItems.length
            ? resultItems.map((item, index) => renderQuestionResultCard(item, index)).join('')
            : `<div class="social-neo-survey-results-empty social-neo-survey-results-empty--panel lux-soft-chrome home-hover-chip"><i class="fas fa-chart-column"></i><strong class="lux-card-title">No question results yet</strong><span class="lux-card-copy">Responses will appear here once participants submit answers.</span></div>`;

        return `
            <div class="lux-glass-dialog-backdrop" data-action="dialog-close">
                <div class="lux-glass-dialog-card lux-glass-dialog-card--form lux-glass-dialog-card--survey-create lux-glass-dialog-card--survey-results lux-glass-dialog-card lux-glass-dialog-card--social-glass social-neo-surveys-results-dialog" data-action="noop" data-lux-transparency-exempt="1">
                    <div class="lux-glass-dialog-head social-neo-surveys-hero-head social-neo-surveys-results-dialog-head">
                        <div class="social-neo-surveys-hero-copy">
                            <span class="social-neo-section-kicker lux-section-kicker"><i class="fas fa-chart-column" aria-hidden="true"></i> Survey results</span>
                            <h2 class="lux-card-title">${escape(text(survey.title))}</h2>
                            <p class="lux-card-copy">${metaParts.join(' · ')}</p>
                            ${text(survey.description) ? `<p class="social-neo-survey-results-desc lux-card-copy">${escape(text(survey.description))}</p>` : ''}
                        </div>
                        <button class="lux-ghost-btn lux-glass-dialog-close-btn" type="button" data-action="dialog-close" aria-label="Close results"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="social-neo-surveys-hero-stats social-neo-surveys-results-kpis">
                        <article class="social-neo-surveys-hero-stat social-neo-events-hero-stat lux-strip-card surface-card lux-soft-chrome home-hover-chip"><strong>${escape(String(responseCount))}</strong><span>Responses</span></article>
                        <article class="social-neo-surveys-hero-stat social-neo-events-hero-stat lux-strip-card surface-card lux-soft-chrome home-hover-chip"><strong>${escape(String(questionCount))}</strong><span>Questions</span></article>
                        <article class="social-neo-surveys-hero-stat social-neo-events-hero-stat lux-strip-card surface-card lux-soft-chrome home-hover-chip"><strong>${escape(surveyStatusLabel(survey))}</strong><span>Status</span></article>
                        <article class="social-neo-surveys-hero-stat social-neo-events-hero-stat lux-strip-card surface-card lux-soft-chrome home-hover-chip"><strong>${escape(surveyAudienceLabel(survey))}</strong><span>Audience</span></article>
                    </div>
                    <div class="lux-scroll-rail lux-glass-dialog-body lux-glass-dialog-body--survey-results" data-lux-scroll-rail>
                        <div class="lux-scroll-rail__controls social-neo-survey-results-scroll-controls" aria-hidden="true">
                            <div class="lux-scroll-rail__dock" role="group" aria-label="Scroll survey results">
                                <button type="button" class="lux-scroll-rail__btn" data-lux-scroll="up" aria-label="Scroll results up"><i class="fas fa-chevron-up" aria-hidden="true"></i></button>
                                <span class="lux-scroll-rail__spine" aria-hidden="true"></span>
                                <button type="button" class="lux-scroll-rail__btn" data-lux-scroll="down" aria-label="Scroll results down"><i class="fas fa-chevron-down" aria-hidden="true"></i></button>
                            </div>
                        </div>
                        <div class="lux-scrollbar lux-scroll-rail__viewport social-neo-surveys-results-body">
                            <div class="social-neo-stack social-neo-surveys-results-questions">
                                ${questionsMarkup}
                            </div>
                        </div>
                    </div>
                    <div class="lux-glass-dialog-form-actions lux-glass-dialog-actions social-neo-surveys-results-dialog-actions">
                        ${survey.viewerCanManage ? `
                            <div class="social-neo-inline social-neo-inline-gap-8-wrap social-neo-surveys-results-actions">
                                <button class="lux-secondary-btn lux-secondary-btn-sm home-hover-chip" type="button" data-action="survey-export" data-survey-id="${escape(text(survey.id))}"><i class="fas fa-file-export"></i> Export JSON</button>
                                ${text(survey.status) === 'published' ? `<button class="lux-secondary-btn lux-secondary-btn-sm home-hover-chip" type="button" data-action="survey-close" data-survey-id="${escape(text(survey.id))}"><i class="fas fa-lock"></i> Close survey</button>` : ''}
                            </div>
                        ` : '<span class="social-neo-flex-spacer"></span>'}
                        <button class="lux-primary-btn lux-glass-dialog-submit-btn home-hover-chip" type="button" data-action="dialog-close">Close</button>
                    </div>
                </div>
            </div>
        `;
    }

    window.renderSurveyResultsDialog = renderSurveyResultsDialog;

    const renderSurveyCardDescRail = (surveyId, body) => `
        <div class="lux-scroll-rail social-neo-survey-card-desc-rail" data-lux-scroll-rail data-survey-desc-rail="${escape(surveyId)}">
            <div class="lux-scroll-rail__controls social-neo-survey-card-desc-controls" hidden aria-hidden="true">
                <div class="lux-scroll-rail__dock lux-scroll-rail__dock--vertical" role="group" aria-label="Survey description">
                    <button type="button" class="lux-scroll-rail__btn" data-lux-scroll="up" aria-label="Scroll description up"><i class="fas fa-chevron-up" aria-hidden="true"></i></button>
                    <span class="lux-scroll-rail__spine" aria-hidden="true"></span>
                    <button type="button" class="lux-scroll-rail__btn" data-lux-scroll="down" aria-label="Scroll description down"><i class="fas fa-chevron-down" aria-hidden="true"></i></button>
                </div>
            </div>
            <div class="lux-scrollbar lux-scroll-rail__viewport social-neo-survey-card-desc-viewport" aria-label="Survey description">
                <div class="social-neo-muted social-neo-survey-card-desc">${escape(body)}</div>
            </div>
        </div>
    `;

    function renderSurveyCard(survey) {
        const status = surveyStatusLabel(survey);
        const canTake = Boolean(survey.viewerCanRespond);
        const hasResponded = Boolean(survey.viewerHasResponded);
        const canViewResults = Boolean(survey.viewerCanViewResults);
        const pinModel = window.KiuSocialPinModel;
        const pinActions = pinModel ? pinModel.renderModulePinActions('survey', survey.id, {
            canCuratorPin: pinModel.viewerCanCuratorPin('survey', survey)
        }) : '';
        return `
            <article class="social-neo-card social-neo-entity-card social-neo-survey-card home-hover-chip" data-survey-id="${escape(text(survey.id))}">
                <div class="social-neo-inline social-neo-inline-between-start-wrap social-neo-survey-card-head">
                    <div>
                        <div class="social-neo-inline social-neo-inline-gap-8-wrap social-neo-survey-card-title-row">
                            <strong>${escape(text(survey.title))}</strong>
                            <span class="social-neo-pill home-hover-chip">${escape(status)}</span>
                            ${survey.isOfficial ? '<span class="social-neo-pill home-hover-chip"><i class="fas fa-landmark"></i> Official</span>' : ''}
                        </div>
                        <div class="social-neo-muted social-neo-survey-card-meta">${escape(text(survey.createdByName || 'Campus member'))}${survey.closesAt ? ` · Ends ${escape(when(survey.closesAt))}` : ''}</div>
                    </div>
                    <div class="social-neo-badge-row social-neo-survey-card-summary">
                        <span class="social-neo-pill home-hover-chip"><i class="fas fa-users"></i> ${escape(surveyAudienceLabel(survey))}</span>
                        <span class="social-neo-pill home-hover-chip"><i class="fas fa-list-ol"></i> ${escape(String(survey.questionCount || 0))} questions</span>
                        ${survey.allowAnonymous ? '<span class="social-neo-pill home-hover-chip"><i class="fas fa-user-secret"></i> Anonymous</span>' : ''}
                    </div>
                </div>
                ${text(survey.description) ? renderSurveyCardDescRail(text(survey.id), text(survey.description)) : ''}
                <div class="social-neo-inline social-neo-inline-between-gap-8-wrap social-neo-survey-card-actions">
                    <div class="social-neo-inline social-neo-inline-gap-8-wrap">
                        ${canTake ? `<button class="lux-primary-btn lux-secondary-btn-sm" type="button" data-action="survey-take-open" data-survey-id="${escape(text(survey.id))}"><i class="fas fa-play"></i> Take survey</button>` : ''}
                        ${hasResponded && !canTake ? `<button class="lux-secondary-btn lux-secondary-btn-sm" type="button" disabled><i class="fas fa-check"></i> Completed</button>` : ''}
                    </div>
                    <div class="social-neo-inline social-neo-inline-gap-8-wrap">
                        ${pinActions}
                        ${canViewResults ? `<button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="survey-results-open" data-survey-id="${escape(text(survey.id))}"><i class="fas fa-chart-column"></i> Results</button>` : ''}
                        ${survey.viewerCanManage ? `<button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="survey-export" data-survey-id="${escape(text(survey.id))}"><i class="fas fa-file-export"></i> Export</button>` : ''}
                        ${survey.viewerCanManage && text(survey.status) === 'published' ? `<button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="survey-close" data-survey-id="${escape(text(survey.id))}"><i class="fas fa-lock"></i> Close</button>` : ''}
                        ${survey.viewerCanManage ? `<button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="survey-delete" data-survey-id="${escape(text(survey.id))}"><i class="fas fa-trash"></i> Remove</button>` : ''}
                    </div>
                </div>
            </article>
        `;
    }

    function surveyDraftReadyQuestionCount(draft = []) {
        return (Array.isArray(draft) ? draft : []).filter((question) => text(question.prompt)).length;
    }

    function formatSurveyQuestionCountStat(draft = []) {
        const total = Array.isArray(draft) ? draft.length : 0;
        const ready = surveyDraftReadyQuestionCount(draft);
        return ready === total ? String(total) : `${ready}/${total}`;
    }

    function surveyQuestionRailLabel(question = {}) {
        const prompt = text(question.prompt);
        if (!prompt) return '(empty)';
        return prompt.length > 42 ? `${prompt.slice(0, 42)}…` : prompt;
    }

    function renderSurveyDraftDeleteConfirmDialog(kind, dialog = {}) {
        const draft = ensureSurveyDraftQuestions();
        const questionIndex = Number(dialog.questionIndex);
        const question = draft[questionIndex];
        if (!question || !Number.isFinite(questionIndex) || questionIndex < 0) return '';
        const isQuestionDelete = kind === 'survey-draft-question-delete';
        if (isQuestionDelete) {
            const typeMeta = surveyQuestionTypeMeta(question.questionType);
            const promptText = text(question.prompt) || 'Untitled question';
            return `<div class="lux-glass-dialog-backdrop" data-action="dialog-close">
                <form class="lux-glass-dialog-card social-neo-delete-confirm" data-form="dialog-survey-draft-question-delete" data-action="noop">
                    <div class="social-neo-delete-confirm-accent" aria-hidden="true"></div>
                    <div class="lux-glass-dialog-section-head lux-glass-dialog-head">
                        <div class="lux-glass-dialog-heading">
                            <span class="social-neo-delete-confirm-icon-chip home-hover-chip"><i class="fas fa-trash" aria-hidden="true"></i></span>
                            <div class="social-neo-delete-confirm-title">
                                <strong class="lux-glass-dialog-title">Delete question</strong>
                                <span class="lux-glass-dialog-subtitle">This removes the question from your survey draft.</span>
                            </div>
                        </div>
                        <button class="lux-ghost-btn lux-glass-dialog-close-btn" type="button" data-action="dialog-close" aria-label="Close"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="social-neo-delete-confirm-preview">
                        <strong class="lux-glass-dialog-preview-title">Question ${escape(String(questionIndex + 1))}</strong>
                        <blockquote class="social-neo-delete-confirm-quote">${escape(promptText)}</blockquote>
                        <div class="social-neo-muted social-neo-muted-mt-6">${escape(typeMeta.label)}</div>
                    </div>
                    <div class="social-neo-delete-confirm-actions">
                        <button class="lux-secondary-btn lux-glass-dialog-cancel-btn" type="button" data-action="dialog-close">Cancel</button>
                        <button class="lux-primary-btn lux-btn-danger lux-glass-dialog-submit-btn" type="submit">Remove question</button>
                    </div>
                    <input type="hidden" name="questionIndex" value="${escape(String(questionIndex))}">
                </form>
            </div>`;
        }
        const optionIndex = Number(dialog.optionIndex);
        const options = Array.isArray(question.options) ? question.options : [];
        const option = options[optionIndex];
        if (!Number.isFinite(optionIndex) || optionIndex < 0 || !option || options.length <= 2) return '';
        const optionLabel = text(option.label) || 'Empty choice';
        return `<div class="lux-glass-dialog-backdrop" data-action="dialog-close">
            <form class="lux-glass-dialog-card social-neo-delete-confirm" data-form="dialog-survey-draft-choice-delete" data-action="noop">
                <div class="social-neo-delete-confirm-accent" aria-hidden="true"></div>
                <div class="lux-glass-dialog-section-head lux-glass-dialog-head">
                    <div class="lux-glass-dialog-heading">
                        <span class="social-neo-delete-confirm-icon-chip home-hover-chip"><i class="fas fa-trash" aria-hidden="true"></i></span>
                        <div class="social-neo-delete-confirm-title">
                            <strong class="lux-glass-dialog-title">Remove choice</strong>
                            <span class="lux-glass-dialog-subtitle">This removes the answer choice from the question.</span>
                        </div>
                    </div>
                    <button class="lux-ghost-btn lux-glass-dialog-close-btn" type="button" data-action="dialog-close" aria-label="Close"><i class="fas fa-times"></i></button>
                </div>
                <div class="social-neo-delete-confirm-preview">
                    <strong class="lux-glass-dialog-preview-title">Choice ${escape(String(optionIndex + 1))}</strong>
                    <blockquote class="social-neo-delete-confirm-quote">${escape(optionLabel)}</blockquote>
                    <div class="social-neo-muted social-neo-muted-mt-6">Question ${escape(String(questionIndex + 1))}</div>
                </div>
                <div class="social-neo-delete-confirm-actions">
                    <button class="lux-secondary-btn lux-glass-dialog-cancel-btn" type="button" data-action="dialog-close">Cancel</button>
                    <button class="lux-primary-btn lux-btn-danger lux-glass-dialog-submit-btn" type="submit">Remove choice</button>
                </div>
                <input type="hidden" name="questionIndex" value="${escape(String(questionIndex))}">
                <input type="hidden" name="optionIndex" value="${escape(String(optionIndex))}">
            </form>
        </div>`;
    }

    function renderSurveyChoiceRows(question = {}, index = 0) {
        const options = Array.isArray(question.options) && question.options.length
            ? question.options
            : [{ label: '' }, { label: '' }];
        const optionsRemovable = options.length > 2;
        return `
            <div class="social-neo-survey-question-options">
                <div class="social-neo-survey-question-options-head">
                    <strong>Answer choices</strong>
                    <button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="survey-question-option-add" data-question-index="${escape(String(index))}">
                        <i class="fas fa-plus"></i> Add choice
                    </button>
                </div>
                <div class="social-neo-survey-choice-list social-neo-survey-question-options-list">
                    ${options.map((option, optionIndex) => `
                        <div class="social-neo-survey-choice-row social-neo-survey-question-option-row ${optionsRemovable ? '' : 'social-neo-survey-choice-row--no-remove'}">
                            <input class="social-neo-input lux-control" type="text" name="surveyQuestionOption-${escape(String(index))}" value="${escape(text(option?.label || ''))}" placeholder="Choice ${escape(String(optionIndex + 1))}" required>
                            ${optionsRemovable ? `
                                <button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="survey-question-option-remove" data-question-index="${escape(String(index))}" data-option-index="${escape(String(optionIndex))}" aria-label="Remove choice">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    function renderSurveyQuestionEditor(question = {}, index = 0, questionCount = 1) {
        const questionType = text(question?.questionType || 'single_choice') || 'single_choice';
        const typeMeta = surveyQuestionTypeMeta(questionType);
        const typeOptions = [
            { value: 'single_choice', label: 'Single choice' },
            { value: 'multiple_choice', label: 'Multiple choice' },
            { value: 'yes_no', label: 'Yes / No' },
            { value: 'rating', label: 'Rating' },
            { value: 'text', label: 'Text' }
        ];
        const promptId = controlId(`survey-question-prompt-${index}`);
        const helpId = controlId(`survey-question-help-${index}`);
        const typeId = controlId(`survey-question-type-${index}`);
        const minRatingId = controlId(`survey-question-min-${index}`);
        const maxRatingId = controlId(`survey-question-max-${index}`);
        const maxLengthId = controlId(`survey-question-maxlen-${index}`);
        const minRating = Number.isFinite(Number(question?.minRating)) ? Number(question.minRating) : 1;
        const maxRating = Number.isFinite(Number(question?.maxRating)) ? Number(question.maxRating) : 5;
        const maxLength = Number.isFinite(Number(question?.maxLength)) ? Number(question.maxLength) : surveyQuestionDefaultMaxLength(question);
        const ratingValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        return `
            <article class="social-neo-survey-question-editor" data-survey-question-index="${escape(String(index))}">
                <div class="social-neo-survey-question-editor-head">
                    <div>
                        <strong>Question ${escape(String(index + 1))}</strong>
                        <span class="social-neo-muted">${escape(typeMeta.label)}</span>
                    </div>
                    ${questionCount > 1 ? `
                        <button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="survey-question-remove" data-question-index="${escape(String(index))}">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    ` : ''}
                </div>
                <label class="lux-glass-dialog-field" for="${escape(typeId)}">
                    <span class="social-neo-label">Question type</span>
                    <select class="social-neo-select lux-control" id="${escape(typeId)}" name="surveyQuestionType-${escape(String(index))}" data-lux-picker>
                        <option value="single_choice" ${questionType === 'single_choice' ? 'selected' : ''}>Single choice</option>
                        <option value="multiple_choice" ${questionType === 'multiple_choice' ? 'selected' : ''}>Multiple choice</option>
                        <option value="yes_no" ${questionType === 'yes_no' ? 'selected' : ''}>Yes / No</option>
                        <option value="rating" ${questionType === 'rating' ? 'selected' : ''}>Rating</option>
                        <option value="text" ${questionType === 'text' ? 'selected' : ''}>Text</option>
                    </select>
                </label>
                <label class="lux-glass-dialog-field" for="${escape(promptId)}">
                    <span class="social-neo-label">Question text</span>
                    <input class="social-neo-input lux-control" id="${escape(promptId)}" type="text" name="surveyQuestionPrompt-${escape(String(index))}" value="${escape(text(question.prompt))}" placeholder="What should we ask?" required>
                </label>
                <label class="social-neo-survey-question-help" for="${escape(helpId)}">
                    <span class="social-neo-label">Helper text (optional)</span>
                    <input class="social-neo-input lux-control" id="${escape(helpId)}" type="text" name="surveyQuestionHelp-${escape(String(index))}" value="${escape(text(question.helpText))}" placeholder="Optional guidance for respondents">
                </label>
                ${surveyQuestionNeedsOptions(questionType) ? renderSurveyChoiceRows(question, index) : ''}
                ${questionType === 'rating' ? `
                    <div class="social-neo-survey-question-config-block">
                        <strong class="social-neo-survey-question-config-title">Rating scale</strong>
                        <div class="social-neo-form-grid-2 social-neo-survey-question-config-grid">
                            <label class="lux-glass-dialog-field" for="${escape(minRatingId)}">
                                <span class="social-neo-label">From</span>
                                <select class="social-neo-select lux-control" id="${escape(minRatingId)}" name="surveyQuestionMinRating-${escape(String(index))}" data-lux-picker>
                                    ${ratingValues.map((value) => `<option value="${escape(String(value))}" ${minRating === value ? 'selected' : ''}>${escape(String(value))}</option>`).join('')}
                                </select>
                            </label>
                            <label class="lux-glass-dialog-field" for="${escape(maxRatingId)}">
                                <span class="social-neo-label">To</span>
                                <select class="social-neo-select lux-control" id="${escape(maxRatingId)}" name="surveyQuestionMaxRating-${escape(String(index))}" data-lux-picker>
                                    ${ratingValues.map((value) => `<option value="${escape(String(value))}" ${maxRating === value ? 'selected' : ''}>${escape(String(value))}</option>`).join('')}
                                </select>
                            </label>
                        </div>
                    </div>
                ` : ''}
                ${surveyQuestionIsText(questionType) ? `
                    <label class="social-neo-survey-question-max-length" for="${escape(maxLengthId)}">
                        <span class="social-neo-label">Max length</span>
                        <input class="social-neo-input lux-control" id="${escape(maxLengthId)}" type="number" name="surveyQuestionMaxLength-${escape(String(index))}" min="50" max="5000" value="${escape(String(maxLength))}">
                    </label>
                ` : ''}
                <label class="lux-checkbox social-neo-checkbox social-neo-survey-question-required">
                    <input type="checkbox" name="surveyQuestionRequired-${escape(String(index))}" ${question.required === false ? '' : 'checked'}>
                    <span>Required question</span>
                </label>
            </article>`;
    }

    function renderSurveyQuestionRail(draft = [], activeIndex = 0) {
        const readyCount = surveyDraftReadyQuestionCount(draft);
        return `
            <div class="social-neo-survey-question-rail-head">
                <strong>Question list</strong>
                <span class="social-neo-muted">${escape(String(readyCount))} of ${escape(String(draft.length))} ready</span>
            </div>
            <div class="social-neo-survey-question-rail-list" role="list">
                ${draft.map((question, index) => {
                    const typeMeta = surveyQuestionTypeMeta(question.questionType);
                    const isActive = index === activeIndex;
                    const isEmpty = !text(question.prompt);
                    const isRequired = question.required !== false;
                    return `
                    <button class="social-neo-survey-question-rail-item ${isActive ? 'is-active' : ''} ${isEmpty ? 'is-empty' : ''} ${isRequired ? 'is-required' : ''}" type="button" role="listitem" data-action="survey-question-select" data-question-index="${escape(String(index))}" aria-current="${isActive ? 'true' : 'false'}">
                        <span class="social-neo-survey-question-rail-icon" aria-hidden="true"><i class="fas ${escape(typeMeta.icon)}"></i></span>
                        <span class="social-neo-survey-question-rail-copy">
                            <strong>Q${escape(String(index + 1))} ${escape(surveyQuestionRailLabel(question))}</strong>
                            <small>${escape(typeMeta.label)}${isRequired ? ' · Required' : ''}</small>
                        </span>
                        ${isEmpty ? '<span class="social-neo-survey-question-rail-warn" aria-label="Missing question text" title="Add question text">!</span>' : ''}
                    </button>`;
                }).join('')}
            </div>
            <button class="lux-secondary-btn lux-secondary-btn-sm social-neo-survey-question-rail-add" type="button" data-action="survey-question-add">
                <i class="fas fa-plus"></i> Add question
            </button>`;
    }

    function renderSurveyCreateQuestionsMarkup() {
        const draftQuestions = ensureSurveyDraftQuestions();
        const activeQuestionIndex = ensureSurveyDraftActiveIndex();
        const activeQuestion = draftQuestions[activeQuestionIndex] || draftQuestions[0];
        return `
            <div class="lux-glass-dialog-group-section-head social-neo-surveys-create-questions-head">
                <strong>Questions</strong>
                <span>Pick a question from the list, then edit it on the right.</span>
            </div>
            <div class="social-neo-surveys-create-question-layout">
                <aside class="social-neo-survey-question-rail">${renderSurveyQuestionRail(draftQuestions, activeQuestionIndex)}</aside>
                <div class="social-neo-survey-question-editor-wrap">${renderSurveyQuestionEditor(activeQuestion, activeQuestionIndex, draftQuestions.length)}</div>
            </div>`;
    }

    function renderSurveyCreateDialog(runtime) {
        const dialog = activeDialog() || {};
        const variant = text(dialog.variant || runtime.ui?.surveysSubTab || 'student') || 'student';
        const isOfficial = variant === 'official';
        const userRole = text(currentUser()?.role || 'student');
        const isStaff = ['professor', 'ta', 'admin', 'student_service'].includes(userRole);
        if (isOfficial && !isStaff) {
            return `<div class="lux-glass-dialog-backdrop" data-action="dialog-close">
                <div class="lux-glass-dialog-card lux-glass-dialog-card--form lux-glass-dialog-card--survey-create lux-glass-dialog-card lux-glass-dialog-card--social-glass social-neo-surveys-hero social-neo-surveys-create-hero" data-lux-transparency-exempt="1">
                    <div class="social-neo-surveys-hero-head">
                        <div class="social-neo-surveys-hero-copy">
                            <span class="social-neo-section-kicker">Official surveys</span>
                            <h2>University-wide feedback</h2>
                            <p>Faculty and administrators can publish official campus surveys here.</p>
                        </div>
                        <button class="lux-ghost-btn lux-glass-dialog-close-btn" type="button" data-action="dialog-close" aria-label="Close"><i class="fas fa-times"></i></button>
                    </div>
                    <p class="social-neo-muted">Official surveys for services, policy, and course evaluation are published by staff accounts.</p>
                    <button class="lux-primary-btn social-neo-surveys-hero-create-btn" type="button" data-action="dialog-close">Got it</button>
                </div>
            </div>`;
        }
        const titleId = controlId('survey-title');
        const descriptionId = controlId('survey-description');
        const closesAtId = controlId('survey-closes-at');
        const scopeId = controlId('survey-scope');
        const anonymousId = controlId('surveyAnonymous');
        const promoteFeedId = controlId('surveyPromoteFeed');
        const closesAtMin = toDateTimeLocalValue(new Date().toISOString());
        const draftSettings = ensureSurveyDraftSettings(variant);
        const scopeOptions = postingScopeOptions();
        const selectedScope = text(runtime.ui?.surveyDraftScope || `${text(scopeOptions[0]?.type || 'profile')}:${text(scopeOptions[0]?.id || currentUserId())}`);
        const draftQuestions = ensureSurveyDraftQuestions();
        const selectedAudience = text(runtime.ui?.surveyDraftAudience || draftSettings.audience) || draftSettings.audience;
        const selectedResultsVisibility = text(runtime.ui?.surveyDraftResultsVisibility || draftSettings.resultsVisibility) || draftSettings.resultsVisibility;
        const selectedClosesAt = text(runtime.ui?.surveyDraftClosesAt || draftSettings.closesAt) || draftSettings.closesAt;
        const closesStatLabel = when(fromDateTimeLocalValue(selectedClosesAt)) || 'Soon';
        const audienceStatLabel = surveyAudienceCreateLabel(selectedAudience);
        const visibilityStatLabel = surveyResultsVisibilityLabel(selectedResultsVisibility);
        const draftTitle = text(runtime.ui?.surveyDraftTitle || '');
        const draftDescription = text(runtime.ui?.surveyDraftDescription || '');
        const promoteFeedChecked = typeof runtime.ui?.surveyDraftPromoteFeed === 'boolean'
            ? runtime.ui.surveyDraftPromoteFeed
            : draftSettings.promoteFeed;
        const anonymousChecked = Boolean(runtime.ui?.surveyDraftAnonymous);
        const studentAudienceOptions = [
            { value: 'faculty', label: 'My faculty' },
            { value: 'connections', label: 'My connections' },
            { value: 'group', label: 'Group members' },
            { value: 'page', label: 'Page followers' }
        ];
        const officialAudienceOptions = [{ value: 'campus', label: 'Campus-wide' }];
        const audienceOptions = isOfficial ? officialAudienceOptions : studentAudienceOptions;
        const resultsOptions = isOfficial
            ? [
                { value: 'public_after_close', label: 'Public after close' },
                { value: 'live_public', label: 'Live public aggregates' },
                { value: 'creator_only', label: 'Creator only' }
            ]
            : [
                { value: 'respondents_after_close', label: 'Respondents after close' },
                { value: 'creator_only', label: 'Creator only' },
                { value: 'public_after_close', label: 'Public after close' }
            ];
        const title = isOfficial ? 'Publish official survey' : 'Create student survey';
        const subtitle = isOfficial
            ? 'Collect campus-wide feedback on services, policy, and academic experience.'
            : 'Run polls for your faculty, connections, group, or page followers.';
        const submitLabel = isOfficial ? 'Publish official survey' : 'Publish survey';
        const submitIcon = isOfficial ? 'fa-landmark' : 'fa-paper-plane';
        const titlePlaceholder = isOfficial ? 'e.g. Library services evaluation' : 'e.g. Study group session feedback';
        return `<div class="lux-glass-dialog-backdrop" data-action="dialog-close">
            <form class="lux-glass-dialog-card lux-glass-dialog-card--form lux-glass-dialog-card--survey-create lux-glass-dialog-card lux-glass-dialog-card--social-glass social-neo-surveys-hero social-neo-surveys-create-hero ${isOfficial ? 'social-neo-surveys-create-hero--official' : 'social-neo-surveys-create-hero--student'}" data-form="survey-create" data-action="noop" data-lux-transparency-exempt="1">
                ${isOfficial ? '<input type="hidden" name="surveyIsOfficial" value="true">' : ''}
                <div class="lux-glass-dialog-head social-neo-surveys-hero-head">
                    <div class="social-neo-surveys-hero-copy">
                        <span class="social-neo-section-kicker">${isOfficial ? 'Official survey' : 'Student survey'}</span>
                        <h2>${escape(title)}</h2>
                        <p>${escape(subtitle)}</p>
                    </div>
                    <button class="lux-ghost-btn lux-glass-dialog-close-btn" type="button" data-action="dialog-close" aria-label="Cancel"><i class="fas fa-times"></i></button>
                </div>
                <div class="lux-glass-dialog-body lux-glass-dialog-body--survey-create">
                <div class="social-neo-surveys-hero-stats">
                    <article class="social-neo-surveys-hero-stat social-neo-events-hero-stat lux-strip-card surface-card lux-soft-chrome home-hover-chip"><strong>${escape(formatSurveyQuestionCountStat(draftQuestions))}</strong><span>Questions</span></article>
                    <article class="social-neo-surveys-hero-stat social-neo-events-hero-stat lux-strip-card surface-card lux-soft-chrome home-hover-chip"><strong>${escape(audienceStatLabel)}</strong><span>Audience</span></article>
                    <article class="social-neo-surveys-hero-stat social-neo-events-hero-stat lux-strip-card surface-card lux-soft-chrome home-hover-chip"><strong>${escape(closesStatLabel)}</strong><span>Closes</span></article>
                    <article class="social-neo-surveys-hero-stat social-neo-events-hero-stat lux-strip-card surface-card lux-soft-chrome home-hover-chip"><strong>${escape(visibilityStatLabel)}</strong><span>Visibility</span></article>
                </div>
                <section class="lux-glass-dialog-group-section">
                    <div class="lux-glass-dialog-group-section-head">
                        <strong>Survey settings</strong>
                        <span>Scope, audience, schedule, and visibility.</span>
                    </div>
                    <div class="social-neo-form-grid-2 social-neo-surveys-create-settings-grid">
                        <label class="lux-glass-dialog-field" for="${escape(scopeId)}">
                            <span class="social-neo-label">Publish as</span>
                            <select class="social-neo-select lux-control" id="${escape(scopeId)}" name="surveyScope" data-lux-picker>
                                ${scopeOptions.map((scope) => {
                                    const value = `${text(scope.type)}:${text(scope.id)}`;
                                    return `<option value="${escape(value)}" ${selectedScope === value ? 'selected' : ''}>${escape(text(scope.name))}</option>`;
                                }).join('')}
                            </select>
                        </label>
                        <label class="lux-glass-dialog-field">
                            <span class="social-neo-label">Audience</span>
                            <select class="social-neo-select lux-control" name="surveyAudience" data-lux-picker>
                                ${audienceOptions.map((option) => `<option value="${escape(option.value)}" ${selectedAudience === option.value ? 'selected' : ''}>${escape(option.label)}</option>`).join('')}
                            </select>
                        </label>
                        <label class="lux-glass-dialog-field">
                            <span class="social-neo-label">Faculty</span>
                            ${(window.KiuSocialChromeModel || {}).renderSocialBrowseFacultySelect
                                ? (window.KiuSocialChromeModel.renderSocialBrowseFacultySelect(runtime, {
                                    name: 'surveyFaculty',
                                    includeAll: false,
                                    required: true,
                                    value: text(runtime.ui?.surveyDraftFaculty || '') || ((window.KiuSocialChromeModel || {}).socialDefaultCreateFaculty?.(runtime) || ''),
                                    label: 'Faculty'
                                }))
                                : `<select class="social-neo-select lux-control" name="surveyFaculty" required data-lux-picker><option value="">Select faculty</option></select>`}
                        </label>
                        <label class="lux-glass-dialog-field" for="${escape(closesAtId)}">
                            <span class="social-neo-label">Closes</span>
                            <input class="social-neo-input lux-control" id="${escape(closesAtId)}" type="datetime-local" name="surveyClosesAt" min="${escape(closesAtMin)}" value="${escape(selectedClosesAt)}" required>
                        </label>
                        <label class="lux-glass-dialog-field">
                            <span class="social-neo-label">Results visibility</span>
                            <select class="social-neo-select lux-control" name="surveyResultsVisibility" data-lux-picker>
                                ${resultsOptions.map((option) => `<option value="${escape(option.value)}" ${selectedResultsVisibility === option.value ? 'selected' : ''}>${escape(option.label)}</option>`).join('')}
                            </select>
                        </label>
                    </div>
                    <div class="lux-checkbox-row social-neo-inline social-neo-surveys-create-toggle-row social-neo-inline-gap-14-wrap">
                        <label class="lux-checkbox lux-checkbox--chip social-neo-checkbox" for="${escape(anonymousId)}">
                            <input id="${escape(anonymousId)}" type="checkbox" name="surveyAnonymous" value="yes" ${anonymousChecked ? 'checked' : ''}>
                            <span>Anonymous</span>
                        </label>
                        <label class="lux-checkbox lux-checkbox--chip social-neo-checkbox" for="${escape(promoteFeedId)}">
                            <input id="${escape(promoteFeedId)}" type="checkbox" name="surveyPromoteFeed" value="yes" ${promoteFeedChecked ? 'checked' : ''}>
                            <span>Promote to feed</span>
                        </label>
                    </div>
                    <p class="social-neo-muted social-neo-surveys-create-toggle-hint">Anonymous hides respondent identities. Promote to feed shares the survey in the campus feed.</p>
                </section>
                <div class="social-neo-surveys-hero-toolbar social-neo-surveys-create-toolbar--split">
                    <label for="${escape(titleId)}">
                        <span class="social-neo-label">Title</span>
                        <input class="social-neo-input lux-control" id="${escape(titleId)}" type="text" name="surveyTitle" placeholder="${escape(titlePlaceholder)}" value="${escape(draftTitle)}" required>
                    </label>
                    <label for="${escape(descriptionId)}">
                        <span class="social-neo-label">Description</span>
                        <textarea class="social-neo-textarea lux-control" id="${escape(descriptionId)}" rows="2" name="surveyDescription" placeholder="Explain why you are collecting responses and how they will be used.">${escape(draftDescription)}</textarea>
                    </label>
                </div>
                <div class="social-neo-surveys-create-questions">${renderSurveyCreateQuestionsMarkup()}</div>
                </div>
                <div class="lux-glass-dialog-actions">
                    <button class="lux-secondary-btn" type="button" data-action="dialog-close">Cancel</button>
                    <button class="lux-primary-btn social-neo-surveys-hero-create-btn" type="submit"><i class="fas ${escape(submitIcon)}"></i><span>${escape(submitLabel)}</span></button>
                </div>
            </form>
        </div>`;
    }

    window.renderSurveyDraftDeleteConfirmDialog = renderSurveyDraftDeleteConfirmDialog;
    window.renderSurveyCreateDialog = renderSurveyCreateDialog;
    window.renderSurveyCreateQuestionsMarkup = renderSurveyCreateQuestionsMarkup;
    window.formatSurveyQuestionCountStat = formatSurveyQuestionCountStat;

    window.renderSurveysHero = renderSurveysHero;
    window.renderSurveyResultsDialog = renderSurveyResultsDialog;

    window.renderSurveysPanel = function renderSurveysPanel() {
        const runtime = state();
        const takingId = text(runtime.ui?.surveyTakingId || '');
        if (takingId) {
            const survey = (Array.isArray(runtime.social?.surveys) ? runtime.social.surveys : [])
                .find((item) => text(item?.id) === takingId);
            if (survey && survey.viewerCanRespond) {
                return renderTakeSurvey(survey);
            }
            runtime.ui.surveyTakingId = '';
        }
        const activeTab = text(runtime.ui?.surveysTab || 'available') || 'available';
        const activeLane = text(runtime.ui?.surveysSubTab || 'student') || 'student';
        const searchValue = text(runtime.ui?.surveysSearch || '');
        const isOfficialLane = activeLane === 'official';
        const canCreate = !isOfficialLane || canPublishOfficialSurveys();
        const pinModel = window.KiuSocialPinModel;
        const chrome = window.KiuSocialChromeModel || {};
        const browseFaculty = typeof chrome.socialBrowseFacultyValue === 'function'
            ? chrome.socialBrowseFacultyValue(runtime)
            : (text(runtime.ui?.socialBrowseFaculty || 'all') || 'all');
        const matchesBrowse = typeof chrome.socialMatchesBrowseFaculty === 'function'
            ? chrome.socialMatchesBrowseFaculty
            : () => true;
        const lanePool = (Array.isArray(runtime.social?.surveys) ? runtime.social.surveys : [])
            .filter((survey) => surveyMatchesLane(survey, activeLane))
            .filter((survey) => {
                if (!matchesBrowse(survey, browseFaculty)) return false;
                const isOfficial = Boolean(survey?.isOfficial);
                return isOfficialLane === isOfficial;
            })
            .filter((survey) => {
                if (!searchValue) return true;
                const hay = `${text(survey?.title)} ${text(survey?.description)} ${text(survey?.createdByName)} ${surveyAudienceLabel(survey)}`.toLowerCase();
                return hay.includes(searchValue.toLowerCase());
            });
        const allForTab = activeTab === 'pinned' ? lanePool : surveysForTab(activeTab).filter((survey) => {
            if (!matchesBrowse(survey, browseFaculty)) return false;
            const isOfficial = Boolean(survey?.isOfficial);
            if (isOfficialLane !== isOfficial) return false;
            if (!searchValue) return true;
            const hay = `${text(survey?.title)} ${text(survey?.description)} ${text(survey?.createdByName)} ${surveyAudienceLabel(survey)}`.toLowerCase();
            return hay.includes(searchValue.toLowerCase());
        });
        let surveys = allForTab;
        let pinnedSections = null;
        if (activeTab === 'pinned' && pinModel) {
            pinnedSections = pinModel.partitionPinnedTab('survey', lanePool);
            surveys = pinnedSections.all;
        } else if (pinModel) {
            surveys = pinModel.sortWithCuratorPins('survey', surveys);
        }
        const openCount = allForTab.filter((survey) => text(survey?.status) === 'published' && survey.viewerCanRespond).length;
        const respondedCount = allForTab.filter((survey) => survey.viewerHasResponded).length;
        const managedCount = allForTab.filter((survey) => survey.viewerCanManage).length;
        const heroMetrics = {
            open: openCount,
            responded: respondedCount,
            managed: managedCount,
            total: allForTab.length
        };
        const emptyCopy = (() => {
            if (isOfficialLane) {
                if (activeTab === 'available') {
                    return 'No open official surveys for you right now. Staff publish campus-wide polls on this lane.';
                }
                return 'Switch tabs to see open or completed official surveys.';
            }
            if (activeTab === 'available') {
                return 'Student polls reach your faculty, connections, group, or page — not the whole campus. Create one or check Manage for surveys you published.';
            }
            if (activeTab === 'managed') {
                return 'You have not created a student survey yet.';
            }
            if (activeTab === 'my-responses') {
                return 'You have not answered any student surveys yet.';
            }
            if (activeTab === 'pinned') {
                return 'No pinned surveys yet. Highlight campus polls or pin surveys for yourself.';
            }
            return 'Create a survey or switch tabs to see other student polls.';
        })();
        const listingsBody = activeTab === 'pinned' && pinnedSections && pinModel
            ? pinModel.renderPinnedSections('survey', pinnedSections, (survey) => renderSurveyCard(survey), 'No pinned surveys yet.')
            : `
            ${surveys.length ? surveys.map((survey) => renderSurveyCard(survey)).join('') : `
                <div class="social-neo-empty-hero social-neo-surveys-empty">
                    <i class="fas fa-clipboard-list"></i>
                    <strong>No surveys in this view</strong>
                    <span>${escape(emptyCopy)}</span>
                    ${canCreate ? '<button class="lux-primary-btn" type="button" data-action="survey-create-open">Create survey</button>' : ''}
                </div>
            `}
        `;
        const heroOptions = {
            tab: activeTab,
            lane: activeLane,
            searchValue,
            controlId,
            canCreate,
            bodyHtml: listingsBody
        };
        return `
            <div class="social-neo-stack social-neo-surveys-shell">
                ${renderSurveysHero(runtime, heroMetrics, heroOptions)}
            </div>
        `;
    };

    function isSocialSurveysClickAction(action) {
        const a = text(action || '');
        if (!a) return false;
        return a.startsWith('survey-') || a.startsWith('surveys-');
    }

    function handleSocialSurveysClick(action, trigger) {
        if (!isSocialSurveysClickAction(action)) return false;
        if (action === 'surveys-lane-student') {
            state().ui.surveysSubTab = 'student';
            return renderSocialPageNow('surveys-lane');
        }

        if (action === 'surveys-lane-official') {
            state().ui.surveysSubTab = 'official';
            if (!canPublishOfficialSurveys() && text(state().ui.surveysTab) === 'managed') {
                state().ui.surveysTab = 'available';
            }
            return renderSocialPageNow('surveys-lane');
        }

        if (action === 'survey-create-open') {
            const variant = text(state().ui?.surveysSubTab || 'student') || 'student';
            if (variant === 'official' && !canPublishOfficialSurveys()) return;
            const scopeOptions = postingScopeOptions();
            const firstScope = scopeOptions[0] || { type: 'profile', id: currentUserId() };
            const defaults = defaultSurveyDraftSettings(variant);
            state().ui.surveyDraftQuestions = defaultSurveyDraftQuestions();
            state().ui.surveyDraftScope = `${text(firstScope.type)}:${text(firstScope.id)}`;
            state().ui.surveyDraftAudience = defaults.audience;
            state().ui.surveyDraftResultsVisibility = defaults.resultsVisibility;
            state().ui.surveyDraftPromoteFeed = defaults.promoteFeed;
            state().ui.surveyDraftClosesAt = defaults.closesAt;
            state().ui.surveyDraftTitle = '';
            state().ui.surveyDraftDescription = '';
            state().ui.surveyDraftAnonymous = false;
            state().ui.surveyDraftActiveIndex = 0;
            setPanel('surveys');
            return openDialog('survey-create', { variant });
        }

        if (action === 'survey-question-select') {
            const form = document.querySelector('form[data-form="survey-create"]');
            const index = Number(trigger.getAttribute('data-question-index'));
            syncSurveyDraftFromForm(form);
            if (Number.isFinite(index)) state().ui.surveyDraftActiveIndex = index;
            return patchSurveyCreateQuestionsPanel();
        }

        if (action === 'survey-question-add') {
            const form = document.querySelector('form[data-form="survey-create"]');
            syncSurveyDraftFromForm(form);
            ensureSurveyDraftQuestions().push({
                prompt: '',
                questionType: 'single_choice',
                required: true,
                options: [{ label: '' }, { label: '' }]
            });
            state().ui.surveyDraftActiveIndex = ensureSurveyDraftQuestions().length - 1;
            return patchSurveyCreateQuestionsPanel();
        }

        if (action === 'survey-question-remove') {
            const form = document.querySelector('form[data-form="survey-create"]');
            const index = Number(trigger.getAttribute('data-question-index'));
            syncSurveyDraftFromForm(form);
            return openDialog('survey-draft-question-delete', { questionIndex: index });
        }

        if (action === 'survey-question-option-add') {
            const form = document.querySelector('form[data-form="survey-create"]');
            const index = Number(trigger.getAttribute('data-question-index'));
            syncSurveyDraftFromForm(form);
            const draft = ensureSurveyDraftQuestions();
            if (draft[index]) {
                draft[index].options = [...(Array.isArray(draft[index].options) ? draft[index].options : []), { label: '' }];
            }
            return patchSurveyCreateQuestionsPanel({ skipSync: true });
        }

        if (action === 'survey-question-option-remove') {
            const form = document.querySelector('form[data-form="survey-create"]');
            const questionIndex = Number(trigger.getAttribute('data-question-index'));
            const optionIndex = Number(trigger.getAttribute('data-option-index'));
            syncSurveyDraftFromForm(form);
            const draft = ensureSurveyDraftQuestions();
            const optionCount = Array.isArray(draft[questionIndex]?.options) ? draft[questionIndex].options.length : 0;
            if (optionCount <= 2) return;
            return openDialog('survey-draft-choice-delete', { questionIndex, optionIndex });
        }

        if (action === 'survey-close') {
            return withBusy(async () => {
                if (typeof closePortalSocialSurvey !== 'function') throw new Error('Survey close is unavailable.');
                await closePortalSocialSurvey(text(trigger.getAttribute('data-survey-id')));
                invalidateSocialRenderCache({ center: true });
                renderSocialPageNow('survey-closed');
            });
        }

        if (action === 'survey-export') {
            return withBusy(async () => {
                const surveyId = text(trigger.getAttribute('data-survey-id'));
                if (typeof loadPortalSocialSurveyResults !== 'function') throw new Error('Survey export is unavailable.');
                const results = await loadPortalSocialSurveyResults(surveyId);
                const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `survey-${surveyId}-results.json`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                URL.revokeObjectURL(url);
            });
        }

        if (action === 'survey-take-open') {
            const runtime = state();
            runtime.ui.surveyTakingId = text(trigger.getAttribute('data-survey-id'));
            runtime.ui.surveyResultsId = '';
            runtime.ui.surveyResultsPayload = null;
            clearSurveyFlowState(runtime, { keepTakingId: true });
            setPanel('surveys');
            return renderSocialPageNow('survey-take-open');
        }

        if (action === 'survey-take-close') {
            clearSurveyFlowState(state());
            return renderSocialPageNow('survey-take-close');
        }

        if (action === 'survey-results-open') {
            const surveyId = text(trigger.getAttribute('data-survey-id'));
            return withBusy(async () => {
                if (typeof loadPortalSocialSurveyResults !== 'function') throw new Error('Survey results are unavailable.');
                const results = await loadPortalSocialSurveyResults(surveyId);
                const runtime = state();
                clearSurveyFlowState(runtime);
                runtime.ui.surveyResultsPayload = results;
                setPanel('surveys');
                return openDialog('survey-results', { surveyId, results });
            });
        }

        if (action === 'survey-results-close') {
            closeDialog();
            return;
        }

        if (action === 'survey-delete') {
            return withBusy(async () => {
                if (typeof deletePortalSocialSurvey !== 'function') throw new Error('Survey deletion is unavailable.');
                await deletePortalSocialSurvey(text(trigger.getAttribute('data-survey-id')));
                invalidateSocialRenderCache({ center: true });
                renderSocialPageNow('survey-deleted');
            });
        }
        return false;
    }

    window.handleSocialSurveysClick = handleSocialSurveysClick;
    window.isSocialSurveysClickAction = isSocialSurveysClickAction;

    function isSocialSurveysSubmitForm(formType) {
        const f = text(formType || '');
        return f.startsWith('survey-') || f.startsWith('dialog-survey-');
    }

    function handleSocialSurveysSubmit(formType, form, runtime, event) {
        if (!isSocialSurveysSubmitForm(formType)) return false;
        if (formType === 'survey-create') {
            return withBusy(async () => {
                const dialog = activeDialog() || {};
                const variant = text(dialog.variant || state().ui?.surveysSubTab || 'student') || 'student';
                const isOfficial = variant === 'official' || Boolean(form.surveyIsOfficial?.value);
                if (isOfficial && !isStaffAccount(currentUser())) {
                    throw new Error('Only staff accounts can publish official surveys.');
                }
                const closesAt = fromDateTimeLocalValue(form.surveyClosesAt?.value || '');
                if (!closesAt) throw new Error('Close date is required.');
                if (new Date(closesAt).getTime() <= Date.now()) throw new Error('Close date must be in the future.');
                syncSurveyDraftFromForm(form);
                const draft = ensureSurveyDraftQuestions();
                const emptyIndex = draft.findIndex((question) => !text(question.prompt));
                if (emptyIndex >= 0) {
                    state().ui.surveyDraftActiveIndex = emptyIndex;
                    patchSurveyCreateQuestionsPanel();
                    throw new Error(`Question ${emptyIndex + 1} needs text before publishing.`);
                }
                const questions = parseSurveyQuestionsFromForm(form);
                if (!questions.length) throw new Error('Add at least one question.');
                questions.forEach((question) => {
                    if (surveyQuestionNeedsOptions(question.questionType) && (!Array.isArray(question.options) || question.options.length < 2)) {
                        throw new Error('Choice questions need at least two options.');
                    }
                    if (text(question.questionType) === 'rating' && Number(question.maxRating) < Number(question.minRating)) {
                        throw new Error('Rating max must be greater than or equal to min.');
                    }
                });
                const scope = parseSurveyScopeValue(form.surveyScope?.value || state().ui?.surveyDraftScope || '');
                let audience = text(form.surveyAudience?.value || (isOfficial ? 'campus' : 'faculty')) || (isOfficial ? 'campus' : 'faculty');
                if (!isOfficial && audience === 'campus') audience = 'faculty';
                if (scope.scopeType === 'group' && audience === 'campus') audience = 'group';
                if (scope.scopeType === 'page' && audience === 'campus') audience = 'page';
                const visibility = audience === 'faculty' ? 'faculty' : 'public';
                const facultyCode = text(form.surveyFaculty?.value || state().ui?.surveyDraftFaculty || '')
                    || ((window.KiuSocialChromeModel || {}).socialDefaultCreateFaculty?.(state()) || '');
                if (!facultyCode || facultyCode === 'all') throw new Error('Faculty is required.');
                let resultsVisibility = text(form.surveyResultsVisibility?.value || (isOfficial ? 'public_after_close' : 'respondents_after_close'))
                    || (isOfficial ? 'public_after_close' : 'respondents_after_close');
                const allowAnonymous = Boolean(form.surveyAnonymous?.checked);
                if (allowAnonymous && resultsVisibility === 'live_public') resultsVisibility = 'creator_only';
                if (typeof createPortalSocialSurvey !== 'function') throw new Error('Survey creation is unavailable.');
                await createPortalSocialSurvey({
                    title: text(form.surveyTitle?.value),
                    description: text(form.surveyDescription?.value),
                    closesAt,
                    allowAnonymous,
                    audience,
                    visibility,
                    facultyCode,
                    audienceFacultyCode: facultyCode,
                    scopeType: scope.scopeType,
                    scopeId: scope.scopeId,
                    scopeName: scope.scopeName,
                    promoteToFeed: Boolean(form.surveyPromoteFeed?.checked),
                    resultsVisibility: allowAnonymous ? (resultsVisibility === 'public_after_close' ? 'creator_only' : resultsVisibility) : resultsVisibility,
                    isOfficial,
                    questions
                });
                state().ui.surveyDraftQuestions = defaultSurveyDraftQuestions();
                state().ui.surveyDraftTitle = '';
                state().ui.surveyDraftDescription = '';
                state().ui.surveyDraftActiveIndex = 0;
                closeDialog();
                setPanel('surveys');
                renderSocialPageNow('survey-created');
            });
        }

        if (formType === 'survey-response') {
            return withBusy(async () => {
                const surveyId = text(form.getAttribute('data-survey-id'));
                const survey = surveyById(surveyId);
                if (!survey) throw new Error('Survey not found.');
                const questions = Array.isArray(survey.questions) ? survey.questions : [];
                const submitBtn = form.querySelector('.social-neo-survey-submit-btn');
                flashSurveySubmitButton(submitBtn, 'acting');
                form.querySelectorAll('.social-neo-survey-take-card.is-invalid').forEach((card) => {
                    card.classList.remove('is-invalid');
                });
                const missingRequired = questions.filter((question) => question?.required !== false && !isSurveyAnswerProvided(form, question));
                if (missingRequired.length) {
                    submitBtn?.classList.remove('is-acting');
                    missingRequired.forEach((question) => {
                        const card = form.querySelector(`.social-neo-survey-take-card[data-question-id="${text(question.id)}"]`);
                        card?.classList.add('is-invalid');
                    });
                    const firstInvalid = form.querySelector('.social-neo-survey-take-card.is-invalid');
                    firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstInvalid?.classList.add('is-shaking');
                    flashSurveySubmitButton(submitBtn, 'error');
                    await waitForSurveySubmitAnimation(520);
                    firstInvalid?.classList.remove('is-shaking');
                    submitBtn?.classList.remove('is-error');
                    throw new Error('Please answer all required questions before submitting.');
                }
                const answers = collectSurveyAnswersFromForm(form, questions);
                if (typeof respondPortalSocialSurvey !== 'function') throw new Error('Survey response is unavailable.');
                if (!submitBtn?.classList.contains('is-acting')) flashSurveySubmitButton(submitBtn, 'acting');
                await waitForSurveySubmitAnimation(420);
                flashSurveySubmitButton(submitBtn, 'submitting');
                setSurveySubmitButtonLabel(submitBtn, 'Submitting…');
                submitBtn?.setAttribute('disabled', '');
                try {
                    await respondPortalSocialSurvey(surveyId, answers);
                } catch (error) {
                    flashSurveySubmitButton(submitBtn, 'error');
                    setSurveySubmitButtonLabel(submitBtn, 'Submit responses');
                    setSurveySubmitButtonIcon(submitBtn, 'fa-paper-plane');
                    submitBtn?.removeAttribute('disabled');
                    await waitForSurveySubmitAnimation(520);
                    submitBtn?.classList.remove('is-error');
                    throw error;
                }
                flashSurveySubmitButton(submitBtn, 'success');
                setSurveySubmitButtonLabel(submitBtn, 'Submitted!');
                setSurveySubmitButtonIcon(submitBtn, 'fa-circle-check');
                await waitForSurveySubmitAnimation(450);
                const runtime = state();
                clearSurveyFlowState(runtime);
                runtime.ui.surveysTab = 'my-responses';
                setPanel('surveys');
                if (typeof addPortalSocialToast === 'function') {
                    addPortalSocialToast({
                        type: 'success',
                        title: 'Responses submitted',
                        text: `Thank you for completing ${text(survey.title) || 'the survey'}.`,
                        icon: 'fa-circle-check'
                    });
                }
                invalidateSocialRenderCache({ center: true });
                renderSocialPageNow('survey-response-submitted');
            });
        }

        if (formType === 'dialog-survey-draft-question-delete') {
            const index = Number(form.questionIndex?.value);
            const draft = ensureSurveyDraftQuestions().filter((_, entryIndex) => entryIndex !== index);
            state().ui.surveyDraftQuestions = draft.length ? draft : defaultSurveyDraftQuestions();
            const activeIndex = ensureSurveyDraftActiveIndex();
            if (activeIndex >= draft.length) state().ui.surveyDraftActiveIndex = Math.max(0, draft.length - 1);
            return restorePreviousDialog();
        }

        if (formType === 'dialog-survey-draft-choice-delete') {
            const questionIndex = Number(form.questionIndex?.value);
            const optionIndex = Number(form.optionIndex?.value);
            const draft = ensureSurveyDraftQuestions();
            if (draft[questionIndex] && Array.isArray(draft[questionIndex].options) && draft[questionIndex].options.length > 2) {
                draft[questionIndex].options = draft[questionIndex].options.filter((_, entryIndex) => entryIndex !== optionIndex);
            }
            return restorePreviousDialog();
        }
        return false;
    }

    window.handleSocialSurveysSubmit = handleSocialSurveysSubmit;
    window.isSocialSurveysSubmitForm = isSocialSurveysSubmitForm;

    function isSocialSurveysInputTarget(target) {
        if (!target || typeof target.matches !== 'function') return false;
        try {

        if (target.matches('form[data-form="survey-response"] [data-text="1"], input[name="surveysSearch"]')) return true;
        if (target.closest && target.closest('form[data-form="survey-create"]')) return true;

        } catch (e) {}
        return false;
    }

    function handleSocialSurveysInput(target, runtime, event) {
        if (!isSocialSurveysInputTarget(target)) return false;
        if (target.matches('form[data-form="survey-response"] [data-text="1"]')) {
            if (text(target.value).trim()) {
                target.closest('.social-neo-survey-take-card')?.classList.remove('is-invalid');
            }
            return;
        }
        if (target.matches('input[name="surveysSearch"]')) runtime.ui.surveysSearch = target.value;
        if (target.matches('input[name="surveysSearch"]')) {
            renderSocialPageNow('surveys-input');
            return;
        }
        if (target.matches('form[data-form="survey-create"] [name="surveyTitle"]')) runtime.ui.surveyDraftTitle = target.value;
        if (target.matches('form[data-form="survey-create"] [name="surveyDescription"]')) runtime.ui.surveyDraftDescription = target.value;
        if (target.matches('form[data-form="survey-create"] [name^="surveyQuestionPrompt-"], form[data-form="survey-create"] [name^="surveyQuestionHelp-"], form[data-form="survey-create"] [name^="surveyQuestionOption-"], form[data-form="survey-create"] [name^="surveyQuestionMaxLength-"]')) {
            syncSurveyDraftFromForm(target.closest('form'));
        }

        return true;
    }

    function isSocialSurveysChangeTarget(target) {
        if (!target || typeof target.matches !== 'function') return false;
        try {

        if (target.matches('.social-neo-survey-take-choice input[type="radio"], .social-neo-survey-take-choice input[type="checkbox"]')) return true;
        if (target.closest && target.closest('form[data-form="survey-create"]')) return true;

        } catch (e) {}
        return false;
    }

    function handleSocialSurveysChange(target, runtime, event) {
        if (!isSocialSurveysChangeTarget(target)) return false;
        if (target.matches('.social-neo-survey-take-choice input[type="radio"], .social-neo-survey-take-choice input[type="checkbox"]')) {
            animateSurveyChoiceInteraction(target);
            target.closest('.social-neo-survey-take-card')?.classList.remove('is-invalid');
            return;
        }
        if (target.matches('form[data-form="survey-create"] select[name^="surveyQuestionType-"]')) {
            const form = target.closest('form');
            syncSurveyDraftFromForm(form);
            const index = Number(text(target.name).replace('surveyQuestionType-', ''));
            const draft = ensureSurveyDraftQuestions();
            const question = draft[index];
            if (question) {
                const questionType = text(question.questionType || 'single_choice') || 'single_choice';
                if (surveyQuestionNeedsOptions(questionType)) {
                    question.options = Array.isArray(question.options) && question.options.length >= 2
                        ? question.options
                        : [{ label: '' }, { label: '' }];
                } else if (questionType === 'rating') {
                    question.minRating = Number.isFinite(question.minRating) ? question.minRating : 1;
                    question.maxRating = Number.isFinite(question.maxRating) ? question.maxRating : 5;
                    delete question.options;
                } else {
                    delete question.options;
                }
            }
            return patchSurveyCreateQuestionsPanel();
        }
        if (target.matches('form[data-form="survey-create"] select[name^="surveyQuestionMinRating-"], form[data-form="survey-create"] select[name^="surveyQuestionMaxRating-"]')) {
            syncSurveyDraftFromForm(target.closest('form'));
            return patchSurveyCreateQuestionsPanel();
        }
        if (target.matches('form[data-form="survey-create"] [name="surveyScope"], form[data-form="survey-create"] [name="surveyAudience"], form[data-form="survey-create"] [name="surveyResultsVisibility"], form[data-form="survey-create"] [name="surveyClosesAt"]')) {
            syncSurveyDraftFromForm(target.closest('form'));
            return rerenderSurveyCreateDialog();
        }
        if (target.matches('form[data-form="survey-create"] [name="surveyAnonymous"], form[data-form="survey-create"] [name="surveyPromoteFeed"]')) {
            syncSurveyDraftFromForm(target.closest('form'));
            return;
        }

        return true;
    }

    window.handleSocialSurveysInput = handleSocialSurveysInput;
    window.isSocialSurveysInputTarget = isSocialSurveysInputTarget;
    window.handleSocialSurveysChange = handleSocialSurveysChange;
    window.isSocialSurveysChangeTarget = isSocialSurveysChangeTarget;

})();
