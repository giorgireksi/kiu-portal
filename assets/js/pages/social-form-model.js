/* Pure social form / entity helpers (survey parse, dependsOn, path math).
 * ESM leaf: social.html type=module; classic bridge for defer consumers.
 */
'use strict';

function hooks() {
    return window.__kiuSocialFormHooks || window.__kiuSocialWorkspaceHooks || {};
}


function state() {
    const hook = hooks().state;
    if (typeof hook === 'function') return hook();
    if (typeof window.state === 'function' && window.state !== state) return window.state();
    return {};
}

function currentUserId() {
    const hook = hooks().currentUserId;
    if (typeof hook === 'function') return hook();
    if (typeof window.currentUserId === 'function' && window.currentUserId !== currentUserId) {
        return window.currentUserId();
    }
    return '';
}

function text(value) {
    const hook = hooks().text;
    if (typeof hook === 'function') return hook(value);
    return String(value == null ? '' : value).trim();
}

function uniqueStrings(list) {
    const hook = hooks().uniqueStrings;
    if (typeof hook === 'function') return hook(list);
    return [...new Set((Array.isArray(list) ? list : []).map((v) => text(v)).filter(Boolean))];
}

function displayName(account) {
    const hook = hooks().displayName;
    if (typeof hook === 'function') return hook(account);
    return text(account?.displayName || account?.name || account?.id || '');
}

function accountById(id) {
    const hook = hooks().accountById;
    if (typeof hook === 'function') return hook(id);
    return id ? { id } : null;
}

function when(value) {
    const hook = hooks().when;
    if (typeof hook === 'function') return hook(value);
    if (!value) return '';
    try {
        return new Date(value).toLocaleString();
    } catch (e) {
        return String(value);
    }
}

function polylineToSmoothPathD(points = []) {
    const pts = (Array.isArray(points) ? points : []).filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y));
    if (pts.length < 2) return { d: '', midX: 0, midY: 0 };
    if (pts.length === 2) {
        return {
            d: `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`,
            midX: (pts[0].x + pts[1].x) / 2,
            midY: (pts[0].y + pts[1].y) / 2
        };
    }
    // Catmull-Rom to cubic Bezier
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i === 0 ? i : i - 1];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];
        const c1x = p1.x + (p2.x - p0.x) / 6;
        const c1y = p1.y + (p2.y - p0.y) / 6;
        const c2x = p2.x - (p3.x - p1.x) / 6;
        const c2y = p2.y - (p3.y - p1.y) / 6;
        d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`;
    }
    const mid = pts[Math.floor(pts.length / 2)];
    return { d, midX: mid.x, midY: mid.y };
}

function parseDependsOnFromForm(form) {
    if (!form) return [];
    const select = form.querySelector('select[name="projectTaskDependsOnIds"]');
    if (select) {
        return Array.from(select.selectedOptions).map((option) => text(option.value)).filter(Boolean);
    }
    // Hidden inputs preserve map-wired parents when the multi-select is not shown.
    return uniqueStrings(
        Array.from(form.querySelectorAll('input[name="projectTaskDependsOnIds"]'))
            .map((input) => text(input.value))
            .filter(Boolean)
    );
}

function collectSurveyAnswersFromForm(form, questions = []) {
    return questions.map((question) => {
        const qId = text(question.id);
        const questionType = text(question.questionType || 'single_choice');
        if (questionType === 'single_choice') {
            const selected = form.querySelector(`input[name="survey-q-${qId}"]:checked`);
            return { questionId: qId, optionIds: selected ? [text(selected.value)] : [] };
        }
        if (questionType === 'multiple_choice') {
            const selected = Array.from(form.querySelectorAll(`input[name="survey-q-${qId}[]"]:checked`)).map((el) => text(el.value));
            return { questionId: qId, optionIds: selected };
        }
        if (questionType === 'rating') {
            const selected = form.querySelector(`input[name="survey-q-${qId}"]:checked`);
            return { questionId: qId, ratingValue: Number(selected?.value) };
        }
        if (questionType === 'yes_no') {
            const selected = form.querySelector(`input[name="survey-q-${qId}"]:checked`);
            return { questionId: qId, yesNoValue: text(selected?.value) === 'yes' };
        }
        const input = form.querySelector(`[name="survey-q-${qId}"]`);
        return { questionId: qId, textValue: text(input?.value) };
    });
}

const LOST_FOUND_DEFAULT_LISTING_DAYS = 90;

function resolveLostFoundStatus(item = {}) {
    const status = text(item?.status || 'lost').toLowerCase();
    if (status === 'found') return 'found';
    if (status === 'lost') return 'lost';
    const kind = text(item?.kind || 'lost').toLowerCase();
    if (kind === 'found') return 'found';
    const isFound = ['resolved', 'archived', 'claimed'].includes(status);
    return isFound ? 'found' : 'lost';
}

function defaultLostFoundExpiresAt(baseDate = new Date()) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + LOST_FOUND_DEFAULT_LISTING_DAYS);
    return date.toISOString();
}

function resolveLostFoundExpiresAt(item = {}) {
    const explicit = text(item?.expiresAt || item?.endAt || item?.expiresOn);
    if (explicit) return explicit;
    const createdAt = text(item?.createdAt || item?.updatedAt);
    if (!createdAt) return '';
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return '';
    date.setDate(date.getDate() + LOST_FOUND_DEFAULT_LISTING_DAYS);
    return date.toISOString();
}

function normalizeLostFoundItem(item = {}) {
    const status = resolveLostFoundStatus(item);
    return {
        id: text(item?.id),
        status,
        title: text(item?.title || ''),
        description: text(item?.description || ''),
        category: text(item?.category || 'General'),
        locationText: text(item?.locationText || item?.location || ''),
        eventDate: text(item?.eventDate || item?.lostAt || ''),
        imageUrl: text(item?.imageUrl || item?.photoUrl || ''),
        facultyCode: text(item?.facultyCode || item?.faculty || ''),
        authorUserId: text(item?.authorUserId || item?.createdById || ''),
        authorName: text(item?.authorName || ''),
        createdAt: text(item?.createdAt || ''),
        updatedAt: text(item?.updatedAt || item?.createdAt || ''),
        expiresAt: resolveLostFoundExpiresAt(item),
        foundAt: status === 'found' ? text(item?.foundAt || item?.resolvedAt || item?.updatedAt || item?.createdAt) : '',
        foundByUserId: status === 'found' ? text(item?.foundByUserId || item?.resolvedByUserId || item?.authorUserId || item?.createdById) : '',
        contactChatId: text(item?.contactChatId || ''),
        notes: text(item?.notes || ''),
        relatedPageLinks: Array.isArray(item?.relatedPageLinks) ? item.relatedPageLinks : []
    };
}

function lostFoundItems() {
    const runtime = state();
    return Array.isArray(runtime.social?.lostFoundItems) ? runtime.social.lostFoundItems : [];
}

function isLostFoundItemExpired(item = {}, nowMs = Date.now()) {
    const expiresAt = text(item?.expiresAt);
    if (!expiresAt) return false;
    const expiresMs = new Date(expiresAt).getTime();
    return Number.isFinite(expiresMs) && expiresMs <= nowMs;
}


function lostFoundActiveItems() {
    return lostFoundItems()
        .map((item) => normalizeLostFoundItem(item))
        .filter((item) => !isLostFoundItemExpired(item));
}

function lostFoundActiveCount() {
    return lostFoundActiveItems().filter((item) => item.status === 'lost').length;
}

function lostFoundRecoveredCount() {
    return lostFoundActiveItems().filter((item) => item.status === 'found').length;
}

function lostFoundVisibleItems() {
    const runtime = state();
    const search = text(runtime.ui?.lostFoundSearch || '').toLowerCase();
    const chrome = window.KiuSocialChromeModel || {};
    const browseFaculty = typeof chrome.socialBrowseFacultyValue === 'function'
        ? chrome.socialBrowseFacultyValue(runtime)
        : (text(runtime.ui?.socialBrowseFaculty || 'all') || 'all');
    const matchesBrowse = typeof chrome.socialMatchesBrowseFaculty === 'function'
        ? chrome.socialMatchesBrowseFaculty
        : () => true;
    return lostFoundActiveItems()
        .filter((item) => item.status === 'lost')
        .filter((item) => matchesBrowse(item, browseFaculty))
        .filter((item) => {
            if (!search) return true;
            const blob = [
                item.title,
                item.description,
                item.category,
                item.locationText,
                item.authorName
            ].join(' ').toLowerCase();
            return blob.includes(search);
        })
        .sort((left, right) => String(right.updatedAt || right.createdAt || '').localeCompare(String(left.updatedAt || left.createdAt || '')));
}

function lostFoundSuggestionItems(items, draftTitle = '', draftCategory = '', draftLocation = '', excludeId = '') {
    const title = text(draftTitle).toLowerCase();
    const category = text(draftCategory).toLowerCase();
    const location = text(draftLocation).toLowerCase();
    return (Array.isArray(items) ? items : [])
        .filter((item) => normalizeLostFoundItem(item).status === 'lost')
        .map((item) => normalizeLostFoundItem(item))
        .filter((item) => !text(excludeId) || text(item.id) !== text(excludeId))
        .filter((item) => {
            const blob = `${item.title} ${item.category} ${item.locationText}`.toLowerCase();
            if (!title && !category && !location) return false;
            if (title && blob.includes(title)) return true;
            if (category && text(item.category).toLowerCase() === category) return true;
            if (location && blob.includes(location)) return true;
            return false;
        })
        .slice(0, 3);
}

function surveys() {
    return Array.isArray(state().social?.surveys) ? state().social.surveys : [];
}

function surveyResponses() {
    return Array.isArray(state().social?.surveyResponses) ? state().social.surveyResponses : [];
}

function surveyById(surveyId) {
    const normalizedId = text(surveyId);
    return surveys().find((entry) => text(entry?.id) === normalizedId) || null;
}

function hasSurveyResponse(surveyId, userId = currentUserId()) {
    const normalizedSurveyId = text(surveyId);
    const normalizedUserId = text(userId);
    return surveyResponses().some((entry) => text(entry?.surveyId) === normalizedSurveyId && text(entry?.userId) === normalizedUserId);
}

function pendingSurveyCount() {
    return surveys().filter((survey) => text(survey?.status) === 'published' && Boolean(survey?.viewerCanRespond)).length;
}

function surveyStatusLabel(survey) {
    const status = text(survey?.status || 'draft');
    if (status === 'published') return 'Open';
    if (status === 'closed') return 'Closed';
    if (status === 'archived') return 'Archived';
    return 'Draft';
}

function surveyAudienceLabel(survey) {
    const audience = text(survey?.audience || 'campus');
    if (audience === 'faculty') return 'Faculty';
    if (audience === 'group') return 'Group';
    if (audience === 'page') return 'Page';
    if (audience === 'connections') return 'Connections';
    return 'Campus-wide';
}

function defaultSurveyClosesAt(baseDate = new Date(), dayOffset = 7) {
    const next = new Date(baseDate.getTime());
    next.setDate(next.getDate() + dayOffset);
    return next.toISOString();
}

function surveyMatchesLane(survey, lane = 'student') {
    const normalizedLane = text(lane || 'student') || 'student';
    const isOfficial = Boolean(survey?.isOfficial);
    return normalizedLane === 'official' ? isOfficial : !isOfficial;
}

function surveysForTab(tab = 'available') {
    const normalizedTab = text(tab || 'available') || 'available';
    const lane = text(state().ui?.surveysSubTab || 'student') || 'student';
    const search = text(state().ui?.surveysSearch || '').toLowerCase();
    const userId = currentUserId();
    return surveys()
        .filter((survey) => surveyMatchesLane(survey, lane))
        .filter((survey) => {
            if (normalizedTab === 'available') {
                return text(survey?.status) === 'published' && Boolean(survey?.viewerCanRespond);
            }
            if (normalizedTab === 'my-responses') {
                return hasSurveyResponse(survey.id, userId) || Boolean(survey?.viewerHasResponded);
            }
            if (normalizedTab === 'managed') {
                return Boolean(survey?.viewerCanManage);
            }
            if (normalizedTab === 'closed') {
                return ['closed', 'archived'].includes(text(survey?.status));
            }
            return true;
        })
        .filter((survey) => {
            if (!search) return true;
            const blob = [
                survey.title,
                survey.description,
                survey.createdByName,
                surveyAudienceLabel(survey)
            ].join(' ').toLowerCase();
            return blob.includes(search);
        })
        .sort((left, right) => String(right.publishedAt || right.createdAt || '').localeCompare(String(left.publishedAt || left.createdAt || '')));
}

function parseSurveyQuestionBlock(block, index = 0) {
    const prompt = text(block.querySelector(`[name="surveyQuestionPrompt-${index}"]`)?.value || '');
    const questionTypeRaw = text(block.querySelector(`[name="surveyQuestionType-${index}"]`)?.value || 'single_choice') || 'single_choice';
    const questionType = surveyQuestionIsText(questionTypeRaw) ? 'text' : questionTypeRaw;
    const required = block.querySelector(`[name="surveyQuestionRequired-${index}"]`)?.checked !== false;
    const helpText = text(block.querySelector(`[name="surveyQuestionHelp-${index}"]`)?.value || '');
    const minRating = Number(block.querySelector(`[name="surveyQuestionMinRating-${index}"]`)?.value);
    const maxRating = Number(block.querySelector(`[name="surveyQuestionMaxRating-${index}"]`)?.value);
    const maxLength = Number(block.querySelector(`[name="surveyQuestionMaxLength-${index}"]`)?.value);
    const options = Array.from(block.querySelectorAll(`[name="surveyQuestionOption-${index}"]`))
        .map((input, optionIndex) => ({ label: text(input.value), orderIndex: optionIndex }));
    const entry = {
        prompt,
        questionType,
        required,
        helpText
    };
    if (surveyQuestionNeedsOptions(questionType)) {
        entry.options = options.length ? options : [{ label: '' }, { label: '' }];
    } else if (questionType === 'rating') {
        entry.minRating = Number.isFinite(minRating) ? minRating : 1;
        entry.maxRating = Number.isFinite(maxRating) ? maxRating : 5;
    } else if (surveyQuestionIsText(questionType)) {
        entry.maxLength = Number.isFinite(maxLength) ? maxLength : 2000;
    }
    return entry;
}

function surveyQuestionNeedsOptions(questionType) {
    return ['single_choice', 'multiple_choice'].includes(text(questionType));
}

function surveyQuestionIsText(questionType) {
    const type = text(questionType).toLowerCase();
    return type === 'text' || type === 'short_text' || type === 'long_text';
}

function surveyQuestionDefaultMaxLength(question = {}) {
    if (Number.isFinite(question?.maxLength)) return question.maxLength;
    return 2000;
}

function surveyQuestionTypeMeta(questionType = 'single_choice') {
    const normalizedType = surveyQuestionIsText(questionType)
        ? 'text'
        : (text(questionType || 'single_choice') || 'single_choice');
    const metaByType = {
        single_choice: { icon: 'fa-circle-dot', label: 'Single choice' },
        multiple_choice: { icon: 'fa-square-check', label: 'Multiple choice' },
        rating: { icon: 'fa-star-half-stroke', label: 'Rating scale' },
        yes_no: { icon: 'fa-toggle-on', label: 'Yes / No' },
        text: { icon: 'fa-align-left', label: 'Text' }
    };
    return metaByType[normalizedType] || metaByType.single_choice;
}

function parseSurveyQuestionsFromForm(form) {
    return syncSurveyDraftFromForm(form).map((question) => {
        const questionTypeRaw = text(question.questionType || 'single_choice');
        const questionType = surveyQuestionIsText(questionTypeRaw) ? 'text' : questionTypeRaw;
        const entry = {
            prompt: text(question.prompt),
            questionType,
            required: question.required !== false
        };
        if (text(question.helpText)) entry.helpText = text(question.helpText);
        if (surveyQuestionNeedsOptions(questionType)) {
            entry.options = (Array.isArray(question.options) ? question.options : [])
                .map((option, index) => ({ label: text(option.label), orderIndex: index }))
                .filter((option) => text(option.label));
        } else if (questionType === 'rating') {
            entry.minRating = Number.isFinite(question.minRating) ? question.minRating : 1;
            entry.maxRating = Number.isFinite(question.maxRating) ? question.maxRating : 5;
        } else if (surveyQuestionIsText(questionType)) {
            entry.maxLength = Number.isFinite(question.maxLength) ? question.maxLength : 2000;
        }
        return entry;
    }).filter((question) => text(question.prompt));
}

function relationshipBuckets() {
    const userId = currentUserId();
    const relationships = Array.isArray(state().social?.relationships) ? state().social.relationships : [];
    const incoming = [];
    const outgoing = [];
    const connections = [];
    const follows = [];

    relationships.forEach((relationship) => {
        const type = text(relationship?.type).toLowerCase();
        const status = text(relationship?.status).toLowerCase();
        if (type === 'connection-request' && status === 'pending') {
            if (text(relationship.toId) === userId) incoming.push(relationship);
            if (text(relationship.fromId) === userId) outgoing.push(relationship);
            return;
        }
        if (type === 'connection' && status === 'accepted') {
            connections.push(relationship);
            return;
        }
        if (type === 'follow' && text(relationship.fromId) === userId) {
            follows.push(relationship);
        }
    });

    return { incoming, outgoing, connections, follows };
}

function entityDetailStats(type, e) {
    if (!e) return [];
    const arr = (v) => (Array.isArray(v) ? v : []);
    const owner = (uid) => (uid ? displayName(accountById(uid) || { id: uid }) : '');
    const rel = (v) => (v ? when(v) : '');
    const label = (fn, val, fallback) => (typeof fn === 'function' ? fn(val) : fallback);
    if (type === 'project') return [
        ['Status', e.status],
        ['Owner', owner(e.ownerUserId)],
        ['Members', e.memberCount != null ? `${e.memberCount}${(e.maxTeamSize || e.targetTeamSize) ? ` / ${e.maxTeamSize || e.targetTeamSize}` : ''}` : (arr(e.memberIds).length || '')],
        ['Tasks', e.taskCount != null ? `${e.completedTaskCount || 0}/${e.taskCount}` : (arr(e.tasks).length || '')],
        ['Faculty', arr(e.facultyCodes)[0]],
        ['Created', rel(e.createdAt)],
    ];
    if (type === 'portfolio') return [
        ['Status', e.status],
        ['Owner', owner(e.ownerUserId || e.userId)],
        ['Audience', label(typeof portfolioAudienceLabel === 'function' ? portfolioAudienceLabel : null, e.visibilityMode, e.visibilityMode)],
        ['Links', arr(e.externalLinks).length || ''],
        ['Updated', rel(e.updatedAt || e.createdAt)],
    ];
    if (type === 'page') return [
        ['Type', label(typeof pageTypeLabel === 'function' ? pageTypeLabel : null, e, e.pageType || e.type)],
        ['Category', e.category],
        ['Followers', arr(e.followerIds || e.followerUserIds).length || ''],
        ['Location', e.location],
        ['Website', e.website || e.actionUrl],
    ];
    if (type === 'event') return [
        ['When', rel(e.startsAt)],
        ['Location', e.isOnline ? 'Online' : e.location],
        ['Host', e.scopeName],
        ['Category', e.category],
        ['Going', e.attendeeSummary?.going],
        ['Interested', e.attendeeSummary?.interested],
    ];
    if (type === 'survey') return [
        ['Status', label(typeof surveyStatusLabel === 'function' ? surveyStatusLabel : null, e, e.status)],
        ['Questions', e.questionCount != null ? e.questionCount : (arr(e.questions).length || '')],
        ['Responses', e.responseCount],
        ['Audience', label(typeof surveyAudienceLabel === 'function' ? surveyAudienceLabel : null, e, e.audience)],
        ['Closes', rel(e.closesAt)],
    ];
    if (type === 'photo') return [
        ['By', owner(e.authorUserId)],
        ['Category', e.category],
        ['Location', e.photoMeta?.location],
        ['Comments', arr(e.comments).length || ''],
    ];
    if (type === 'lost-found') return [
        ['Status', e.status],
        ['Category', e.category],
        ['Location', e.locationText || e.location],
        ['Date', rel(e.eventDate || e.lostAt)],
    ];
    return [];
}

function isSocialFileUnavailableKey(storageKey = '') {
    try {
        if (typeof window.__kiuIsSocialFileUnavailable === 'function') {
            return window.__kiuIsSocialFileUnavailable(storageKey);
        }
    } catch (error) {}
    return false;
}

function filePreviewUnavailableMarkup() {
    return `
                <div class="social-neo-media is-broken is-unavailable">
                    <span class="social-neo-muted">Image unavailable</span>
                </div>
            `;
}

function filePreview(file) {
    if (!file) return '';
    if (isImage(file)) {
        if (file.storageMissing === true && !text(file.previewDataUrl || file.dataUrl)) {
            return filePreviewUnavailableMarkup();
        }
        const storageKey = text(file.storageKey || file.id || '');
        if (isSocialFileUnavailableKey(storageKey)) {
            return filePreviewUnavailableMarkup();
        }
        const src = fileUrl(file);
        if (src) {
            return `
                <div class="social-neo-media">
                    <img src="${escape(src)}" alt="${escape(text(file.name || 'Image'))}" data-social-file-key="${escape(storageKey)}">
                </div>
            `;
        }
        if (storageKey || file.storageMissing === true) {
            return filePreviewUnavailableMarkup();
        }
    }
    const href = fileUrl(file);
    return `
        <div class="social-neo-file">
            <i class="fas fa-paperclip"></i>
            <div>
                <strong>${escape(text(file.name || 'Attachment'))}</strong>
                <span>${escape(text(file.type || 'File'))}</span>
            </div>
            ${href ? `<a class="lux-ghost-btn" href="${escape(href)}" target="_blank" rel="noopener">Open</a>` : ''}
        </div>
    `;
}

/**
 * Renders a small chip showing an attached file name.
 * Used in the composer and post edit dialogs.
 * @param {Object|null} file  - File reference with a `.name` property, or null.
 * @param {string} [label]    - Fallback label when `file.name` is missing.
 * @returns {string} HTML or empty string.
 */


function postingScopeOptions() {
    const hook = hooks().postingScopeOptions;
    if (typeof hook === 'function') return hook();
    if (typeof window.postingScopeOptions === 'function' && window.postingScopeOptions !== postingScopeOptions) {
        return window.postingScopeOptions();
    }
    return [];
}

function toDateTimeLocalValue(iso = '') {
    if (!text(iso)) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (value) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDateTimeLocalValue(value = '') {
    if (!text(value)) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString();
}
function surveyAudienceCreateLabel(audience = 'campus') {
    const normalized = text(audience || 'campus') || 'campus';
    if (normalized === 'faculty') return 'My faculty';
    if (normalized === 'group') return 'Group members';
    if (normalized === 'page') return 'Page followers';
    if (normalized === 'connections') return 'My connections';
    return 'Campus-wide';
}

function surveyResultsVisibilityLabel(value = 'public_after_close') {
    const normalized = text(value || 'public_after_close') || 'public_after_close';
    if (normalized === 'live_public') return 'Live public';
    if (normalized === 'respondents_after_close') return 'Respondents';
    if (normalized === 'creator_only') return 'Creator only';
    return 'After close';
}

function defaultSurveyDraftQuestions() {
    return [{
        prompt: '',
        questionType: 'single_choice',
        required: true,
        options: [{ label: '' }, { label: '' }]
    }];
}

function defaultSurveyDraftSettings(variant = 'student') {
    const isOfficial = text(variant || 'student') === 'official';
    return {
        audience: isOfficial ? 'campus' : 'faculty',
        resultsVisibility: isOfficial ? 'public_after_close' : 'respondents_after_close',
        promoteFeed: isOfficial,
        closesAt: toDateTimeLocalValue(defaultSurveyClosesAt(new Date(), isOfficial ? 21 : 7))
    };
}

function ensureSurveyDraftSettings(variant = 'student') {
    const runtime = state();
    const defaults = defaultSurveyDraftSettings(variant);
    if (!text(runtime.ui?.surveyDraftAudience)) runtime.ui.surveyDraftAudience = defaults.audience;
    if (!text(runtime.ui?.surveyDraftResultsVisibility)) runtime.ui.surveyDraftResultsVisibility = defaults.resultsVisibility;
    if (typeof runtime.ui?.surveyDraftPromoteFeed !== 'boolean') runtime.ui.surveyDraftPromoteFeed = defaults.promoteFeed;
    if (!text(runtime.ui?.surveyDraftClosesAt)) runtime.ui.surveyDraftClosesAt = defaults.closesAt;
    return {
        audience: text(runtime.ui.surveyDraftAudience || defaults.audience) || defaults.audience,
        resultsVisibility: text(runtime.ui.surveyDraftResultsVisibility || defaults.resultsVisibility) || defaults.resultsVisibility,
        promoteFeed: typeof runtime.ui.surveyDraftPromoteFeed === 'boolean' ? runtime.ui.surveyDraftPromoteFeed : defaults.promoteFeed,
        closesAt: text(runtime.ui.surveyDraftClosesAt || defaults.closesAt) || defaults.closesAt
    };
}




function ensureSurveyDraftQuestions() {
    const runtime = state();
    if (!Array.isArray(runtime.ui?.surveyDraftQuestions) || !runtime.ui.surveyDraftQuestions.length) {
        runtime.ui.surveyDraftQuestions = defaultSurveyDraftQuestions();
    }
    return runtime.ui.surveyDraftQuestions;
}

function ensureSurveyDraftActiveIndex() {
    const runtime = state();
    const draft = ensureSurveyDraftQuestions();
    let index = Number(runtime.ui?.surveyDraftActiveIndex);
    if (!Number.isFinite(index)) index = 0;
    runtime.ui.surveyDraftActiveIndex = Math.min(Math.max(0, index), Math.max(0, draft.length - 1));
    return runtime.ui.surveyDraftActiveIndex;
}

function cloneSurveyDraftQuestions(draft = []) {
    return (Array.isArray(draft) ? draft : []).map((question) => {
        const entry = { ...question };
        if (Array.isArray(question?.options)) {
            entry.options = question.options.map((option) => ({ ...option }));
        }
        return entry;
    });
}


function parseSurveyScopeValue(rawValue = '') {
    const value = text(rawValue);
    const [scopeType, scopeId] = value.includes(':') ? value.split(':') : ['profile', currentUserId()];
    const scope = postingScopeOptions().find((entry) => text(entry.type) === text(scopeType) && text(entry.id) === text(scopeId))
        || { type: 'profile', id: currentUserId(), name: 'My profile' };
    return {
        scopeType: text(scope.type || 'profile') || 'profile',
        scopeId: text(scope.id || currentUserId()) || currentUserId(),
        scopeName: text(scope.name || '')
    };
}


function syncSurveyDraftFromForm(form) {
    if (!form) return ensureSurveyDraftQuestions();
    const runtime = state();
    if (form.surveyScope) runtime.ui.surveyDraftScope = text(form.surveyScope.value || runtime.ui?.surveyDraftScope || '');
    if (form.surveyAudience) runtime.ui.surveyDraftAudience = text(form.surveyAudience.value || runtime.ui?.surveyDraftAudience || 'connections') || 'connections';
    if (form.surveyResultsVisibility) runtime.ui.surveyDraftResultsVisibility = text(form.surveyResultsVisibility.value || runtime.ui?.surveyDraftResultsVisibility || 'respondents_after_close') || 'respondents_after_close';
    if (form.surveyClosesAt) runtime.ui.surveyDraftClosesAt = text(form.surveyClosesAt.value || runtime.ui?.surveyDraftClosesAt || '');
    if (form.surveyTitle) runtime.ui.surveyDraftTitle = text(form.surveyTitle.value || '');
    if (form.surveyDescription) runtime.ui.surveyDraftDescription = text(form.surveyDescription.value || '');
    if (form.surveyAnonymous) runtime.ui.surveyDraftAnonymous = Boolean(form.surveyAnonymous.checked);
    if (form.surveyPromoteFeed) runtime.ui.surveyDraftPromoteFeed = Boolean(form.surveyPromoteFeed.checked);
    const draft = cloneSurveyDraftQuestions(ensureSurveyDraftQuestions());
    const blocks = form.querySelectorAll('[data-survey-question-index]');
    blocks.forEach((block) => {
        const index = Number(block.getAttribute('data-survey-question-index'));
        if (!Number.isFinite(index) || index < 0 || index >= draft.length) return;
        draft[index] = parseSurveyQuestionBlock(block, index);
    });
    runtime.ui.surveyDraftQuestions = draft.length ? draft : defaultSurveyDraftQuestions();
    return runtime.ui.surveyDraftQuestions;
}


export const socialFormModelApi = {
    toDateTimeLocalValue,
    fromDateTimeLocalValue,
    surveyAudienceCreateLabel,
    surveyResultsVisibilityLabel,
    defaultSurveyDraftQuestions,
    defaultSurveyDraftSettings,
    ensureSurveyDraftSettings,
    ensureSurveyDraftQuestions,
    ensureSurveyDraftActiveIndex,
    cloneSurveyDraftQuestions,
    parseSurveyScopeValue,
    syncSurveyDraftFromForm,
    polylineToSmoothPathD,
    parseDependsOnFromForm,
    collectSurveyAnswersFromForm,
    LOST_FOUND_DEFAULT_LISTING_DAYS,
    resolveLostFoundStatus,
    defaultLostFoundExpiresAt,
    resolveLostFoundExpiresAt,
    normalizeLostFoundItem,
    lostFoundItems,
    isLostFoundItemExpired,
    lostFoundActiveItems,
    lostFoundActiveCount,
    lostFoundRecoveredCount,
    lostFoundVisibleItems,
    lostFoundSuggestionItems,
    surveys,
    surveyResponses,
    surveyById,
    hasSurveyResponse,
    pendingSurveyCount,
    surveyStatusLabel,
    surveyAudienceLabel,
    defaultSurveyClosesAt,
    surveyMatchesLane,
    surveysForTab,
    parseSurveyQuestionBlock,
    surveyQuestionNeedsOptions,
    surveyQuestionIsText,
    surveyQuestionDefaultMaxLength,
    surveyQuestionTypeMeta,
    parseSurveyQuestionsFromForm,
    relationshipBuckets,
    entityDetailStats,
    filePreview
};

/** Install classic window / Kiu surface (idempotent). */
export function installSocialFormModel(target = typeof window !== 'undefined' ? window : globalThis) {
    if (!target || target.__KIU_SOCIAL_FORM_MODEL_LOADED) {
        return target?.KiuSocialFormModel || socialFormModelApi;
    }
    target.__KIU_SOCIAL_FORM_MODEL_LOADED = true;
    target.__kiuSocialFormModelExports = socialFormModelApi;
    target.KiuSocialFormModel = socialFormModelApi;
    Object.keys(socialFormModelApi).forEach((key) => {
        target[key] = socialFormModelApi[key];
    });
    return socialFormModelApi;
}

// type=module script tag: assign window surface for classic defer consumers
installSocialFormModel();

