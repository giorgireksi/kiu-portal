const {
    asArray,
    clone,
    makeId,
    normalizeCode,
    nowIso
} = require('../utils');

function socialText(value) {
    return String(value || '').trim();
}

function socialCompareNewest(left, right) {
    return socialText(right || '').localeCompare(socialText(left || ''));
}

function isSocialStaffActor(userId) {
    const role = socialText(this.getSocialAccount?.(userId)?.role || '').toLowerCase();
    return ['professor', 'ta', 'admin', 'student_service'].includes(role);
}

function getSocialConnectionIds(userId) {
    const normalizedUserId = socialText(userId);
    if (!normalizedUserId) return [];
    return asArray(this.state.social.relationships)
        .filter((item) => socialText(item?.type).toLowerCase() === 'connection')
        .map((item) => {
            const fromId = socialText(item?.fromId);
            const toType = socialText(item?.toType).toLowerCase();
            const toId = socialText(item?.toId);
            if (toType !== 'profile') return '';
            if (fromId === normalizedUserId) return toId;
            if (toId === normalizedUserId) return fromId;
            return '';
        })
        .filter(Boolean);
}

function normalizeSocialScopeType(value) {
    const normalized = socialText(value).toLowerCase();
    if (['profile', 'page', 'group'].includes(normalized)) return normalized;
    return 'profile';
}

function normalizeSocialAudience(value) {
    const normalized = socialText(value).toLowerCase();
    if (['campus', 'faculty', 'group', 'page', 'connections', 'private'].includes(normalized)) return normalized;
    return 'campus';
}

function normalizeSocialVisibility(value, fallback = 'public') {
    const normalized = socialText(value).toLowerCase();
    if (['public', 'private', 'faculty'].includes(normalized)) return normalized;
    return socialText(fallback).toLowerCase() || 'public';
}

function normalizeSurveyQuestionType(value) {
    const normalized = socialText(value).toLowerCase();
    if (['single_choice', 'multiple_choice', 'text', 'rating', 'yes_no'].includes(normalized)) {
        return normalized;
    }
    if (normalized === 'single' || normalized === 'radio') return 'single_choice';
    if (normalized === 'multi' || normalized === 'checkbox') return 'multiple_choice';
    if (normalized === 'text' || normalized === 'short' || normalized === 'short_text') return 'text';
    if (normalized === 'long' || normalized === 'long_text') return 'text';
    if (normalized === 'scale') return 'rating';
    return 'single_choice';
}

function normalizeSurveyStatus(value) {
    const normalized = socialText(value).toLowerCase();
    if (['draft', 'published', 'closed', 'archived'].includes(normalized)) return normalized;
    return 'draft';
}

function normalizeSurveyResultsVisibility(value) {
    const normalized = socialText(value).toLowerCase();
    if (['creator_only', 'respondents_after_close', 'scope_after_close', 'public_after_close', 'live_public'].includes(normalized)) {
        return normalized;
    }
    return 'creator_only';
}

function normalizeSurveyQuestionOption(option = {}, index = 0) {
    const label = socialText(option.label || option.text || '');
    if (!label) return null;
    return {
        id: socialText(option.id || makeId('surveyopt')),
        label,
        orderIndex: Number.isFinite(option.orderIndex) ? option.orderIndex : index,
        value: socialText(option.value || label)
    };
}

function normalizeSurveyQuestion(question = {}, index = 0) {
    const prompt = socialText(question.prompt || question.text || question.title || '');
    if (!prompt) return null;
    const questionType = normalizeSurveyQuestionType(question.questionType || question.type);
    const options = asArray(question.options)
        .map((option, optionIndex) => normalizeSurveyQuestionOption(option, optionIndex))
        .filter(Boolean);
    if (['single_choice', 'multiple_choice'].includes(questionType) && options.length < 2) return null;
    return {
        id: socialText(question.id || makeId('surveyq')),
        surveyId: socialText(question.surveyId || ''),
        orderIndex: Number.isFinite(question.orderIndex) ? question.orderIndex : index,
        prompt,
        helpText: socialText(question.helpText || ''),
        questionType,
        required: question.required !== false,
        minSelections: Math.max(0, Number(question.minSelections) || 0),
        maxSelections: Math.max(1, Number(question.maxSelections) || (questionType === 'single_choice' ? 1 : options.length || 1)),
        minRating: Math.max(1, Number(question.minRating) || 1),
        maxRating: Math.min(10, Math.max(2, Number(question.maxRating) || 5)),
        maxLength: Math.max(50, Number(question.maxLength) || (questionType === 'text' ? 2000 : 500)),
        options,
        createdAt: socialText(question.createdAt || nowIso()),
        updatedAt: socialText(question.updatedAt || nowIso())
    };
}

function normalizeSurveyQuestions(questions = [], surveyId = '') {
    return asArray(questions)
        .map((question, index) => {
            const normalized = normalizeSurveyQuestion({ ...question, surveyId: socialText(surveyId || question.surveyId || '') }, index);
            if (normalized) normalized.surveyId = socialText(surveyId || normalized.surveyId);
            return normalized;
        })
        .filter(Boolean);
}

function ensureSurveyCollections(state) {
    if (!state.social || typeof state.social !== 'object') state.social = {};
    if (!Array.isArray(state.social.surveys)) state.social.surveys = [];
    if (!Array.isArray(state.social.surveyQuestions)) state.social.surveyQuestions = [];
    if (!Array.isArray(state.social.surveyResponses)) state.social.surveyResponses = [];
}

function getSocialSurveyRecord(surveyId) {
    ensureSurveyCollections(this.state);
    return asArray(this.state.social.surveys).find((item) => socialText(item?.id) === socialText(surveyId)) || null;
}

function listSurveyQuestions(surveyId) {
    ensureSurveyCollections(this.state);
    return asArray(this.state.social.surveyQuestions)
        .filter((item) => socialText(item?.surveyId) === socialText(surveyId))
        .sort((left, right) => Number(left?.orderIndex || 0) - Number(right?.orderIndex || 0));
}

function getSurveyResponseForUser(surveyId, userId) {
    ensureSurveyCollections(this.state);
    return asArray(this.state.social.surveyResponses).find((item) =>
        socialText(item?.surveyId) === socialText(surveyId) && socialText(item?.userId) === socialText(userId)
    ) || null;
}

function isSurveyExpired(survey) {
    const closesAt = socialText(survey?.closesAt || '');
    if (!closesAt) return false;
    const closesMs = new Date(closesAt).getTime();
    return Number.isFinite(closesMs) && closesMs <= Date.now();
}

function deriveSurveyStatus(survey) {
    const stored = normalizeSurveyStatus(survey?.status);
    if (stored === 'archived') return 'archived';
    if (stored === 'closed') return 'closed';
    if (isSurveyExpired(survey)) return 'closed';
    return stored;
}

function canViewSocialSurvey(survey, userId) {
    if (!survey) return false;
    const status = deriveSurveyStatus(survey);
    if (status === 'draft') {
        return canManageSocialSurvey.call(this, survey, userId);
    }
    const normalizedUserId = socialText(userId);
    const authorUserId = socialText(survey.createdById);
    const scopeType = normalizeSocialScopeType(survey.scopeType);
    const scopeId = socialText(survey.scopeId);
    const audience = normalizeSocialAudience(survey.audience || (scopeType === 'group' ? 'group' : scopeType === 'page' ? 'page' : 'campus'));
    const visibility = normalizeSocialVisibility(survey.visibility, 'public');

    if (scopeType === 'page') {
        const page = this.getSocialPageRecord(scopeId);
        if (!this.canViewSocialPage(page, normalizedUserId)) return false;
    }
    if (scopeType === 'group') {
        const group = this.getSocialGroupRecord(scopeId);
        if (!this.canViewSocialGroup(group, normalizedUserId)) return false;
    }

    if (this.isSocialAdmin(normalizedUserId) || normalizedUserId === authorUserId) return true;
    if (canManageSocialSurvey.call(this, survey, normalizedUserId)) return true;

    if (audience === 'private') {
        return normalizedUserId === authorUserId;
    }
    if (audience === 'connections') {
        if (!normalizedUserId) return false;
        return normalizedUserId === authorUserId || this.isSocialConnection(authorUserId, normalizedUserId);
    }
    if (audience === 'faculty') {
        if (!normalizedUserId) return false;
        const facultyCode = normalizeCode(survey.audienceFacultyCode || survey.facultyCode || this.getSocialActorFacultyCode(authorUserId));
        return !facultyCode || facultyCode === 'ALL' || this.getSocialActorFacultyCode(normalizedUserId) === facultyCode;
    }
    if (audience === 'group') {
        const group = this.getSocialGroupRecord(scopeId);
        return this.canViewSocialGroup(group, normalizedUserId);
    }
    if (audience === 'page') {
        const page = this.getSocialPageRecord(scopeId);
        return this.canViewSocialPage(page, normalizedUserId);
    }
    if (visibility === 'faculty') {
        if (!normalizedUserId) return false;
        const facultyCode = normalizeCode(survey.facultyCode || survey.audienceFacultyCode || '');
        if (!facultyCode || facultyCode === 'ALL') return true;
        return this.getSocialActorFacultyCode(normalizedUserId) === facultyCode;
    }
    if (visibility === 'private') {
        if (!normalizedUserId) return false;
        return normalizedUserId === authorUserId || Boolean(getSurveyResponseForUser.call(this, survey.id, normalizedUserId));
    }
    return visibility === 'public' ? true : Boolean(normalizedUserId);
}

function canManageSocialSurvey(survey, userId) {
    const normalizedUserId = socialText(userId);
    if (!normalizedUserId || !survey) return false;
    if (this.isSocialAdmin(normalizedUserId)) return true;
    if (Boolean(survey.isOfficial) && !isSocialStaffActor.call(this, normalizedUserId)) return false;
    if (socialText(survey.createdById) === normalizedUserId) return true;
    const scopeType = normalizeSocialScopeType(survey.scopeType);
    const scopeId = socialText(survey.scopeId);
    if (scopeType === 'group' && scopeId) {
        const group = this.getSocialGroupRecord(scopeId);
        if (group && this.canManageSocialGroup(group, normalizedUserId)) return true;
    }
    if (scopeType === 'page' && scopeId) {
        const page = this.getSocialPageRecord(scopeId);
        if (page && this.canManageSocialPage(page, normalizedUserId)) return true;
    }
    return false;
}

function canRespondToSocialSurvey(survey, userId) {
    const normalizedUserId = socialText(userId);
    if (!normalizedUserId || !survey) return false;
    if (!canViewSocialSurvey.call(this, survey, normalizedUserId)) return false;
    if (deriveSurveyStatus(survey) !== 'published') return false;
    if (isSurveyExpired(survey)) return false;
    if (!survey.allowMultipleResponses && getSurveyResponseForUser.call(this, survey.id, normalizedUserId)) return false;
    return true;
}

function canViewSocialSurveyResults(survey, userId) {
    const normalizedUserId = socialText(userId);
    if (!normalizedUserId || !survey) return false;
    if (canManageSocialSurvey.call(this, survey, normalizedUserId)) return true;
    const visibility = normalizeSurveyResultsVisibility(survey.resultsVisibility);
    const status = deriveSurveyStatus(survey);
    const hasResponded = Boolean(getSurveyResponseForUser.call(this, survey.id, normalizedUserId));
    if (visibility === 'live_public') return canViewSocialSurvey.call(this, survey, normalizedUserId);
    if (visibility === 'public_after_close' && status === 'closed') return canViewSocialSurvey.call(this, survey, normalizedUserId);
    if (visibility === 'scope_after_close' && status === 'closed' && canViewSocialSurvey.call(this, survey, normalizedUserId)) return true;
    if (visibility === 'respondents_after_close' && status === 'closed' && hasResponded) return true;
    return false;
}

function decorateSocialSurveyQuestion(question) {
    if (!question) return null;
    return clone(question);
}

function decorateSocialSurvey(survey, viewerUserId = '') {
    if (!survey) return null;
    const decorated = clone(survey);
    decorated.status = deriveSurveyStatus(decorated);
    const questions = listSurveyQuestions.call(this, decorated.id).map((question) => decorateSocialSurveyQuestion(question));
    const responses = asArray(this.state.social.surveyResponses).filter((item) => socialText(item?.surveyId) === socialText(decorated.id));
    const viewerResponse = viewerUserId ? getSurveyResponseForUser.call(this, decorated.id, viewerUserId) : null;
    decorated.questionCount = questions.length;
    decorated.responseCount = responses.length;
    decorated.viewerHasResponded = Boolean(viewerResponse);
    decorated.viewerCanManage = canManageSocialSurvey.call(this, decorated, viewerUserId);
    decorated.viewerCanRespond = canRespondToSocialSurvey.call(this, decorated, viewerUserId);
    decorated.viewerCanViewResults = canViewSocialSurveyResults.call(this, decorated, viewerUserId);
    decorated.questions = questions;
    return decorated;
}

function closeExpiredSurveys() {
    ensureSurveyCollections(this.state);
    let changed = false;
    this.state.social.surveys = asArray(this.state.social.surveys).map((survey) => {
        if (normalizeSurveyStatus(survey.status) !== 'published') return survey;
        if (!isSurveyExpired(survey)) return survey;
        changed = true;
        return {
            ...survey,
            status: 'closed',
            closedAt: socialText(survey.closedAt || nowIso()),
            updatedAt: nowIso()
        };
    });
    if (changed) this.save();
    return changed;
}

function notifySurveyPublished(survey, actorId = '') {
    const scopeType = normalizeSocialScopeType(survey?.scopeType);
    const scopeId = socialText(survey?.scopeId);
    const creatorId = socialText(actorId || survey?.createdById);
    const scopeName = socialText(survey?.scopeName || 'Campus');
    const title = socialText(survey?.title || 'Survey');
    const notify = (userId) => {
        const recipientUserId = socialText(userId);
        if (!recipientUserId || recipientUserId === creatorId) return;
        this.createNotification({
            recipientUserId,
            sourceDomain: 'social',
            type: 'survey-published',
            title: 'New survey available',
            body: `${scopeName} published "${title}".`,
            routePage: 'social',
            routeData: { surveyId: socialText(survey?.id) }
        });
    };
    const audience = normalizeSocialAudience(survey?.audience || (scopeType === 'group' ? 'group' : scopeType === 'page' ? 'page' : 'campus'));
    if (scopeType === 'page' || audience === 'page') {
        this.getSocialFollowerIds('page', scopeId).forEach(notify);
        return;
    }
    if (scopeType === 'group' || audience === 'group') {
        const group = this.getSocialGroupRecord(scopeId);
        this.getSocialGroupMemberIds(group).forEach(notify);
        return;
    }
    if (audience === 'connections') {
        getSocialConnectionIds.call(this, creatorId).forEach(notify);
        return;
    }
    if (audience === 'faculty') {
        const facultyCode = normalizeCode(survey?.audienceFacultyCode || survey?.facultyCode || this.getSocialActorFacultyCode(creatorId));
        if (typeof this.getSocialMentionableAccounts === 'function') {
            this.getSocialMentionableAccounts()
                .filter((account) => !facultyCode || normalizeCode(this.getSocialActorFacultyCode(account?.id)) === facultyCode)
                .forEach((account) => notify(account?.id));
        }
        return;
    }
    if (audience === 'campus' && Boolean(survey?.isOfficial) && typeof this.getSocialMentionableAccounts === 'function') {
        this.getSocialMentionableAccounts().forEach((account) => notify(account?.id));
    }
}

function createSocialSurvey(payload = {}, actorId = '') {
    const creatorId = socialText(actorId || '');
    const title = socialText(payload.title);
    if (!creatorId || !title) return null;
    ensureSurveyCollections(this.state);
    const scopeType = normalizeSocialScopeType(payload.scopeType || 'profile');
    const scopeId = socialText(payload.scopeId || (scopeType === 'profile' ? creatorId : ''));
    if (!scopeId) return null;
    if (scopeType === 'group') {
        const group = this.getSocialGroupRecord(scopeId);
        if (!group || !(this.isSocialGroupMember(group, creatorId) || this.canManageSocialGroup(group, creatorId))) return null;
    }
    if (scopeType === 'page') {
        const page = this.getSocialPageRecord(scopeId);
        const isManager = this.canManageSocialPage(page, creatorId);
        const isFollower = this.isSocialFollowingTarget(creatorId, 'page', scopeId);
        if (!page || !(isManager || isFollower)) return null;
    }
    const closesAt = socialText(payload.closesAt || '');
    if (!closesAt || new Date(closesAt).getTime() <= Date.now()) return null;
    const questions = normalizeSurveyQuestions(payload.questions || [], '');
    if (!questions.length) return null;
    const publishNow = payload.publish !== false && payload.status !== 'draft';
    const isOfficial = Boolean(payload.isOfficial);
    if (isOfficial && !isSocialStaffActor.call(this, creatorId)) return null;
    const audience = normalizeSocialAudience(payload.audience || (scopeType === 'group' ? 'group' : scopeType === 'page' ? 'page' : 'campus'));
    if (audience === 'campus' && !isOfficial && !this.isSocialAdmin(creatorId)) return null;
    const visibility = normalizeSocialVisibility(payload.visibility || (audience === 'faculty' ? 'faculty' : 'public'), 'public');
    const scopeName = socialText(payload.scopeName || (
        scopeType === 'group'
            ? this.getSocialGroupRecord(scopeId)?.name
            : scopeType === 'page'
                ? this.getSocialPageRecord(scopeId)?.name
                : this.getSocialActorDisplayName(creatorId)
    ));
    const survey = {
        id: socialText(payload.id || makeId('survey')),
        title,
        description: socialText(payload.description || ''),
        status: publishNow ? 'published' : 'draft',
        visibility,
        audience,
        facultyCode: normalizeCode(payload.facultyCode || payload.audienceFacultyCode || this.getSocialActorFacultyCode(creatorId)),
        audienceFacultyCode: normalizeCode(payload.audienceFacultyCode || payload.facultyCode || this.getSocialActorFacultyCode(creatorId)),
        scopeType,
        scopeId,
        scopeName,
        createdById: creatorId,
        createdByName: this.getSocialActorDisplayName(creatorId),
        allowAnonymous: Boolean(payload.allowAnonymous),
        allowMultipleResponses: Boolean(payload.allowMultipleResponses),
        promoteToFeed: Boolean(payload.promoteToFeed),
        isOfficial,
        feedPostId: '',
        resultsVisibility: normalizeSurveyResultsVisibility(payload.resultsVisibility || (payload.allowAnonymous ? 'creator_only' : 'public_after_close')),
        closesAt,
        publishedAt: publishNow ? nowIso() : '',
        closedAt: '',
        createdAt: nowIso(),
        updatedAt: nowIso()
    };
    this.state.social.surveys.unshift(survey);
    questions.forEach((question, index) => {
        const nextQuestion = {
            ...question,
            surveyId: survey.id,
            orderIndex: index,
            createdAt: nowIso(),
            updatedAt: nowIso()
        };
        this.state.social.surveyQuestions.unshift(nextQuestion);
    });
    if (publishNow && survey.promoteToFeed && typeof this.createSocialPost === 'function') {
        const body = socialText(payload.feedPostBody || `New survey: ${title}${survey.description ? ` — ${survey.description}` : ''}`);
        const post = this.createSocialPost({
            body,
            category: 'Survey',
            postType: 'post',
            linkedSurveyId: survey.id,
            entityLinks: [{ type: 'survey', id: survey.id }],
            scopeType,
            scopeId,
            scopeName,
            audience
        }, creatorId);
        if (post?.id) survey.feedPostId = socialText(post.id);
    }
    this.saveSocialMutation(creatorId, 'survey-created', 'social-survey', survey.id, null, survey);
    if (publishNow) notifySurveyPublished.call(this, survey, creatorId);
    return decorateSocialSurvey.call(this, survey, creatorId);
}

function closeSocialSurvey(surveyId, actorId = '') {
    const survey = getSocialSurveyRecord.call(this, surveyId);
    const normalizedActorId = socialText(actorId);
    if (!survey || !canManageSocialSurvey.call(this, survey, normalizedActorId)) return null;
    if (deriveSurveyStatus(survey) === 'closed') return decorateSocialSurvey.call(this, survey, normalizedActorId);
    const beforeState = clone(survey);
    survey.status = 'closed';
    survey.closedAt = nowIso();
    survey.updatedAt = nowIso();
    this.saveSocialMutation(normalizedActorId, 'survey-closed', 'social-survey', socialText(survey.id), beforeState, clone(survey));
    return decorateSocialSurvey.call(this, survey, normalizedActorId);
}

function submitSocialSurveyResponse(surveyId, payload = {}, actorId = '') {
    const normalizedActorId = socialText(actorId || '');
    const survey = getSocialSurveyRecord.call(this, surveyId);
    if (!survey || !normalizedActorId) return null;
    if (!canRespondToSocialSurvey.call(this, survey, normalizedActorId)) return null;
    const questions = listSurveyQuestions.call(this, survey.id);
    const answers = asArray(payload.answers);
    const normalizedAnswers = [];
    questions.forEach((question) => {
        const answer = answers.find((item) => socialText(item?.questionId) === socialText(question.id)) || {};
        const questionType = normalizeSurveyQuestionType(question.questionType);
        const entry = { questionId: socialText(question.id) };
        if (questionType === 'single_choice') {
            const optionId = socialText(asArray(answer.optionIds)[0] || answer.optionId || '');
            if (!optionId && question.required) return;
            entry.optionIds = optionId ? [optionId] : [];
        } else if (questionType === 'multiple_choice') {
            entry.optionIds = asArray(answer.optionIds).map((item) => socialText(item)).filter(Boolean);
            if (!entry.optionIds.length && question.required) return;
        } else if (questionType === 'rating') {
            const ratingValue = Number(answer.ratingValue);
            if (!Number.isFinite(ratingValue) && question.required) return;
            entry.ratingValue = ratingValue;
        } else if (questionType === 'yes_no') {
            if (typeof answer.yesNoValue !== 'boolean' && question.required) return;
            entry.yesNoValue = Boolean(answer.yesNoValue);
        } else {
            entry.textValue = socialText(answer.textValue || '');
            if (!entry.textValue && question.required) return;
        }
        normalizedAnswers.push(entry);
    });
    if (!normalizedAnswers.length) return null;
    const requiredMissing = questions.some((question) => {
        if (!question.required) return false;
        const answer = normalizedAnswers.find((item) => socialText(item.questionId) === socialText(question.id));
        if (!answer) return true;
        const questionType = normalizeSurveyQuestionType(question.questionType);
        if (questionType === 'single_choice' || questionType === 'multiple_choice') {
            return !asArray(answer.optionIds).length;
        }
        if (questionType === 'rating') return !Number.isFinite(answer.ratingValue);
        if (questionType === 'yes_no') return typeof answer.yesNoValue !== 'boolean';
        return !socialText(answer.textValue);
    });
    if (requiredMissing) return null;
    const response = {
        id: socialText(makeId('surveyresp')),
        surveyId: socialText(survey.id),
        userId: normalizedActorId,
        respondentFacultyCode: normalizeCode(this.getSocialActorFacultyCode(normalizedActorId)),
        isAnonymous: Boolean(survey.allowAnonymous),
        answers: normalizedAnswers,
        submittedAt: nowIso(),
        createdAt: nowIso(),
        updatedAt: nowIso()
    };
    this.state.social.surveyResponses.unshift(response);
    if (socialText(survey.createdById) && socialText(survey.createdById) !== normalizedActorId) {
        this.createNotification({
            recipientUserId: socialText(survey.createdById),
            sourceDomain: 'social',
            type: 'survey-response',
            title: 'New survey response',
            body: `${this.getSocialActorDisplayName(normalizedActorId)} responded to "${survey.title}".`,
            routePage: 'social',
            routeData: { surveyId: socialText(survey.id) }
        });
    }
    this.saveSocialMutation(normalizedActorId, 'survey-response-submitted', 'social-survey-response', response.id, null, response);
    return decorateSocialSurvey.call(this, survey, normalizedActorId);
}

function getSocialSurveyResults(surveyId, viewerUserId = '') {
    const survey = getSocialSurveyRecord.call(this, surveyId);
    if (!survey || !canViewSocialSurveyResults.call(this, survey, viewerUserId)) return null;
    const questions = listSurveyQuestions.call(this, survey.id);
    const responses = asArray(this.state.social.surveyResponses).filter((item) => socialText(item?.surveyId) === socialText(survey.id));
    const results = questions.map((question) => {
        const questionType = normalizeSurveyQuestionType(question.questionType);
        const base = {
            questionId: socialText(question.id),
            prompt: socialText(question.prompt),
            questionType,
            responseCount: responses.length
        };
        if (questionType === 'single_choice' || questionType === 'multiple_choice') {
            const counts = {};
            asArray(question.options).forEach((option) => {
                counts[socialText(option.id)] = 0;
            });
            responses.forEach((response) => {
                const answer = asArray(response.answers).find((item) => socialText(item?.questionId) === socialText(question.id));
                asArray(answer?.optionIds).forEach((optionId) => {
                    const key = socialText(optionId);
                    if (Object.prototype.hasOwnProperty.call(counts, key)) counts[key] += 1;
                });
            });
            const total = Object.values(counts).reduce((sum, value) => sum + value, 0) || responses.length || 1;
            base.options = asArray(question.options).map((option) => {
                const count = counts[socialText(option.id)] || 0;
                return {
                    id: socialText(option.id),
                    label: socialText(option.label),
                    count,
                    percent: Math.round((count / total) * 100)
                };
            });
        } else if (questionType === 'rating') {
            const values = responses.map((response) => {
                const answer = asArray(response.answers).find((item) => socialText(item?.questionId) === socialText(question.id));
                return Number(answer?.ratingValue);
            }).filter((value) => Number.isFinite(value));
            const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
            base.average = Math.round(average * 10) / 10;
            base.distribution = values;
        } else if (questionType === 'yes_no') {
            let yes = 0;
            let no = 0;
            responses.forEach((response) => {
                const answer = asArray(response.answers).find((item) => socialText(item?.questionId) === socialText(question.id));
                if (answer?.yesNoValue === true) yes += 1;
                else if (answer?.yesNoValue === false) no += 1;
            });
            base.yes = yes;
            base.no = no;
        } else if (canManageSocialSurvey.call(this, survey, viewerUserId)) {
            base.textResponses = responses.map((response) => {
                const answer = asArray(response.answers).find((item) => socialText(item?.questionId) === socialText(question.id));
                return socialText(answer?.textValue);
            }).filter(Boolean);
        }
        return base;
    });
    return {
        surveyId: socialText(survey.id),
        title: socialText(survey.title),
        responseCount: responses.length,
        results
    };
}

function listSocialSurveys(filters = {}, viewerUserId = '') {
    closeExpiredSurveys.call(this);
    ensureSurveyCollections(this.state);
    const statusFilter = socialText(filters.status).toLowerCase();
    return asArray(this.state.social.surveys)
        .filter((survey) => canViewSocialSurvey.call(this, survey, viewerUserId))
        .filter((survey) => !statusFilter || deriveSurveyStatus(survey) === statusFilter)
        .map((survey) => decorateSocialSurvey.call(this, survey, viewerUserId))
        .sort((left, right) => socialCompareNewest(left?.publishedAt || left?.createdAt, right?.publishedAt || right?.createdAt));
}

function getSocialSurvey(surveyId, viewerUserId = '') {
    closeExpiredSurveys.call(this);
    const survey = getSocialSurveyRecord.call(this, surveyId);
    if (!survey || !canViewSocialSurvey.call(this, survey, viewerUserId)) return null;
    return decorateSocialSurvey.call(this, survey, viewerUserId);
}

function deleteSocialSurvey(surveyId, actorId = '') {
    const survey = getSocialSurveyRecord.call(this, surveyId);
    const normalizedActorId = socialText(actorId);
    if (!survey || !canManageSocialSurvey.call(this, survey, normalizedActorId)) return null;
    const surveyIdText = socialText(survey.id);
    this.state.social.surveys = asArray(this.state.social.surveys).filter((item) => socialText(item?.id) !== surveyIdText);
    this.state.social.surveyQuestions = asArray(this.state.social.surveyQuestions).filter((item) => socialText(item?.surveyId) !== surveyIdText);
    this.state.social.surveyResponses = asArray(this.state.social.surveyResponses).filter((item) => socialText(item?.surveyId) !== surveyIdText);
    this.saveSocialMutation(normalizedActorId, 'survey-deleted', 'social-survey', surveyIdText, clone(survey), null);
    return { id: surveyIdText };
}

module.exports = {
    canManageSocialSurvey,
    canRespondToSocialSurvey,
    canViewSocialSurvey,
    canViewSocialSurveyResults,
    closeExpiredSurveys,
    closeSocialSurvey,
    createSocialSurvey,
    decorateSocialSurvey,
    deleteSocialSurvey,
    getSocialSurvey,
    getSocialSurveyResults,
    listSocialSurveys,
    submitSocialSurveyResponse
};