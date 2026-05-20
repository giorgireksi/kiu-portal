/* Gradebook page logic extracted from core.js. Source of truth remains root core.js compatibility bundle. */

// --- GRADEBOOK LOGIC ---
let currentRosterId = 'law_g2';
let mockStudents = KIU_STATE.studentGrades[currentRosterId];
let currentGradebookSection = null;
let currentGradebookCriterion = 'quiz';
let currentGradebookAssessmentNumber = 1;

const GRADEBOOK_CRITERIA = {
    week: {
        key: 'week',
        label: 'Week',
        pluralLabel: 'Weeks',
        legacyKey: 'week',
        aggregateMode: 'average'
    },
    quiz: {
        key: 'quiz',
        label: 'Quiz',
        pluralLabel: 'Quizzes',
        legacyKey: 'q1',
        aggregateMode: 'sum',
        maxScore: 10
    },
    oralQuiz: {
        key: 'oral-quiz',
        label: 'Oral Quiz',
        pluralLabel: 'Oral Quizzes',
        legacyKey: 'oralQuiz',
        aggregateMode: 'sum',
        maxScore: 10
    },
    homework: {
        key: 'homework',
        label: 'Homework',
        pluralLabel: 'Homework',
        legacyKey: 'qa',
        aggregateMode: 'average',
        maxScore: 100
    },
    midterm: {
        key: 'midterm',
        label: 'Midterm Exam',
        pluralLabel: 'Midterm Exams',
        legacyKey: 'mid',
        aggregateMode: 'sum',
        maxScore: 100
    },
    final: {
        key: 'final',
        label: 'Final Exam',
        pluralLabel: 'Final Exams',
        legacyKey: 'final',
        aggregateMode: 'sum',
        maxScore: 100
    },
    retake: {
        key: 'retake',
        label: 'Retake',
        pluralLabel: 'Retakes',
        legacyKey: 'retake',
        aggregateMode: 'sum',
        maxScore: 100
    }
};

const GRADEBOOK_EVALUATION_SECTION_ORDER = ['quiz', 'oral-quiz', 'midterm', 'final', 'retake'];
const GRADEBOOK_DEFAULT_WEIGHT_PROFILE = Object.freeze({
    q1: 0.10,
    qa: 0.10,
    mid: 0.30,
    fin: 0.50
});

function ensureGradebookWeightStore() {
    if (!KIU_STATE.gradebookWeights || typeof KIU_STATE.gradebookWeights !== 'object') {
        KIU_STATE.gradebookWeights = {};
    }
    return KIU_STATE.gradebookWeights;
}

function normalizeGradebookWeightFraction(value, fallback) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    if (numeric > 1) {
        return Math.max(0, Math.min(1, numeric / 100));
    }
    return Math.max(0, Math.min(1, numeric));
}

function normalizeGradebookWeightProfile(profile = {}) {
    return {
        q1: normalizeGradebookWeightFraction(profile.q1, GRADEBOOK_DEFAULT_WEIGHT_PROFILE.q1),
        qa: normalizeGradebookWeightFraction(profile.qa, GRADEBOOK_DEFAULT_WEIGHT_PROFILE.qa),
        mid: normalizeGradebookWeightFraction(profile.mid, GRADEBOOK_DEFAULT_WEIGHT_PROFILE.mid),
        fin: normalizeGradebookWeightFraction(profile.fin, GRADEBOOK_DEFAULT_WEIGHT_PROFILE.fin)
    };
}

function getGradebookWeightProfileForRoster(rosterId = currentRosterId) {
    const store = ensureGradebookWeightStore();
    const rosterKey = String(rosterId || currentRosterId || '').trim();
    if (!rosterKey) return { ...GRADEBOOK_DEFAULT_WEIGHT_PROFILE };
    return normalizeGradebookWeightProfile(store[rosterKey] || GRADEBOOK_DEFAULT_WEIGHT_PROFILE);
}

function setGradebookWeightProfileForRoster(rosterId = currentRosterId, nextProfile = {}, options = {}) {
    const rosterKey = String(rosterId || currentRosterId || '').trim();
    if (!rosterKey) return getGradebookWeightProfileForRoster();
    const store = ensureGradebookWeightStore();
    store[rosterKey] = normalizeGradebookWeightProfile({
        ...getGradebookWeightProfileForRoster(rosterKey),
        ...nextProfile
    });
    if (options.persist !== false) {
        saveState();
        if (document.getElementById('study-card-container') && typeof renderStudyCard === 'function') {
            renderStudyCard();
        }
    }
    return store[rosterKey];
}

function updateGradebookWeightInput(weightKey, rawValue) {
    if (![USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(getEffectiveUserRole())) return;
    const currentWeights = getGradebookWeightProfileForRoster(currentRosterId);
    const nextWeights = {
        ...currentWeights,
        [weightKey]: normalizeGradebookWeightFraction(rawValue, currentWeights[weightKey] ?? GRADEBOOK_DEFAULT_WEIGHT_PROFILE[weightKey] ?? 0)
    };
    setGradebookWeightProfileForRoster(currentRosterId, nextWeights);
    initGradebook();
}

function getGradebookWeightControlsMarkup(weights, readOnly = false) {
    const fields = [
        { key: 'q1', id: 'weight-q1', label: 'Quiz weight' },
        { key: 'qa', id: 'weight-qa', label: 'Homework weight' },
        { key: 'mid', id: 'weight-mid', label: 'Midterm weight' },
        { key: 'fin', id: 'weight-fin', label: 'Final / Retake weight' }
    ];
    const totalPct = Math.round(fields.reduce((sum, field) => sum + Number(weights?.[field.key] || 0), 0) * 100);
    const warningColor = totalPct === 100 ? 'var(--lux-text-muted)' : '#f97316';
    if (readOnly) {
        return `
            <div class="lms-route-kv" style="min-width:280px;">
                <div class="lms-route-kv-label">Weight profile</div>
                <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:10px;">
                    ${fields.map(field => `
                        <span class="lms-route-pill" style="background:rgba(var(--lux-accent-rgb),0.08); border-color:rgba(var(--lux-accent-rgb),0.14); color:var(--lux-text);">
                            ${escapeHtml(field.label.replace(' weight', ''))}: ${Math.round(Number(weights?.[field.key] || 0) * 100)}%
                        </span>
                    `).join('')}
                </div>
                <div style="font-size:11px; color:${warningColor}; margin-top:10px; font-weight:800;">Total: ${totalPct}%</div>
            </div>
        `;
    }
    return `
        <div class="lms-route-kv" style="min-width:320px;">
            <div class="lms-route-kv-label">Group weights</div>
            <div class="lms-route-field-grid" style="grid-template-columns:repeat(2, minmax(130px, 1fr)); margin-top:10px;">
                ${fields.map(field => `
                    <div class="lms-route-field">
                        <label class="lms-route-field-label" for="${field.id}">${escapeHtml(field.label)}</label>
                        <input id="${field.id}" class="lms-route-input" type="number" min="0" max="100" value="${Math.round(Number(weights?.[field.key] || 0) * 100)}" data-gradebook-weight="${field.key}">
                    </div>
                `).join('')}
            </div>
            <div id="weight-total-warning" style="font-size:11px; color:${warningColor}; margin-top:8px; font-weight:800;">Total: ${totalPct}%</div>
        </div>
    `;
}

function normalizeGradebookCriterion(value = 'quiz') {
    const normalized = String(value || 'quiz').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return normalized || 'quiz';
}

function humanizeAssessmentKey(value) {
    return String(value || '')
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, char => char.toUpperCase());
}

function getGradebookCriterionMeta(criterion, record = null) {
    const normalized = normalizeGradebookCriterion(criterion);
    const defaultMeta = Object.values(GRADEBOOK_CRITERIA).find(meta => meta.key === normalized);
    if (defaultMeta) return defaultMeta;
    const label = record?.assessmentSectionLabels?.[normalized] || humanizeAssessmentKey(normalized) || 'Section';
    return {
        key: normalized,
        label,
        pluralLabel: `${label}s`,
        legacyKey: null,
        aggregateMode: 'average',
        maxScore: 100,
        custom: true
    };
}

function ensureGradebookCustomSectionsForRoster(rosterId = currentRosterId) {
    if (!KIU_STATE.gradebookCustomSections || typeof KIU_STATE.gradebookCustomSections !== 'object') {
        KIU_STATE.gradebookCustomSections = {};
    }
    if (!Array.isArray(KIU_STATE.gradebookCustomSections[rosterId])) {
        KIU_STATE.gradebookCustomSections[rosterId] = [];
    }
    return KIU_STATE.gradebookCustomSections[rosterId];
}

function getGradebookSectionDefs(rosterId = currentRosterId, record = null) {
    const defaultKeys = new Set(Object.values(GRADEBOOK_CRITERIA).map(meta => meta.key));
    const customSections = ensureGradebookCustomSectionsForRoster(rosterId).map(section => ({
        key: normalizeGradebookCriterion(section.key),
        label: section.label || humanizeAssessmentKey(section.key),
        pluralLabel: section.pluralLabel || `${section.label || humanizeAssessmentKey(section.key)}s`,
        legacyKey: null,
        aggregateMode: section.aggregateMode || 'average',
        custom: true
    }));
    const detectedSections = Object.keys(record?.assessments || {})
        .filter(key => !defaultKeys.has(key) && !customSections.some(section => section.key === key))
        .map(key => ({
            key,
            label: record?.assessmentSectionLabels?.[key] || humanizeAssessmentKey(key),
            pluralLabel: `${record?.assessmentSectionLabels?.[key] || humanizeAssessmentKey(key)}s`,
            legacyKey: null,
        aggregateMode: 'average',
        custom: true
    })).sort((a, b) => String(a.label || '').localeCompare(String(b.label || ''), undefined, { numeric: true, sensitivity: 'base' }));
    return [
        ...Object.values(GRADEBOOK_CRITERIA),
        ...customSections.filter(section => !defaultKeys.has(section.key)),
        ...detectedSections.sort((a, b) => String(a.label || '').localeCompare(String(b.label || ''), undefined, { numeric: true, sensitivity: 'base' }))
    ];
}

function normalizeAssessmentNumber(value, fallback = 1) {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function isFiniteGradeScore(value) {
    return Number.isFinite(Number(value));
}

function normalizeAssessmentHistoryEntry(entry = {}) {
    const normalizedScore = entry.score === null || entry.score === undefined || entry.score === ''
        ? null
        : Number(entry.score);
    return {
        score: Number.isFinite(normalizedScore) ? normalizedScore : null,
        updatedAt: entry.updatedAt || null,
        updatedBy: entry.updatedBy || null,
        action: entry.action || 'updated',
        note: entry.note || '',
        title: entry.title || '',
        sourceResourceKey: entry.sourceResourceKey || '',
        sourceQuizId: entry.sourceQuizId || '',
        sourceAssessmentType: entry.sourceAssessmentType || '',
        sourceAssessmentNumber: entry.sourceAssessmentNumber || null
    };
}

function normalizeAssessmentEntry(entry = {}, fallbackNumber = 1) {
    const normalizedHistory = Array.isArray(entry.history)
        ? entry.history.filter(item => item && typeof item === 'object').map(normalizeAssessmentHistoryEntry)
        : [];
    const normalizedScore = entry.score === null || entry.score === undefined || entry.score === ''
        ? null
        : Number(entry.score);
    const safeScore = Number.isFinite(normalizedScore) ? normalizedScore : null;
    return {
        number: normalizeAssessmentNumber(entry.number, fallbackNumber),
        score: safeScore,
        updatedAt: entry.updatedAt || (normalizedHistory.at(-1)?.updatedAt || null),
        updatedBy: entry.updatedBy || (normalizedHistory.at(-1)?.updatedBy || null),
        title: entry.title || (normalizedHistory.at(-1)?.title || ''),
        note: entry.note || '',
        history: normalizedHistory,
        sourceResourceKey: entry.sourceResourceKey || (normalizedHistory.at(-1)?.sourceResourceKey || ''),
        sourceQuizId: entry.sourceQuizId || (normalizedHistory.at(-1)?.sourceQuizId || ''),
        sourceAssessmentType: entry.sourceAssessmentType || (normalizedHistory.at(-1)?.sourceAssessmentType || ''),
        sourceAssessmentNumber: entry.sourceAssessmentNumber || (normalizedHistory.at(-1)?.sourceAssessmentNumber || null)
    };
}

function aggregateAssessmentEntries(entries, mode = 'average') {
    const scores = (entries || [])
        .reduce((list, entry) => {
            const rawScore = entry?.score;
            if (rawScore === null || rawScore === undefined || rawScore === '') {
                return list;
            }
            const numericScore = Number(rawScore);
            if (Number.isFinite(numericScore)) {
                list.push(numericScore);
            }
            return list;
        }, []);
    if (!scores.length) return 0;
    if (mode === 'latest') return scores[scores.length - 1];
    if (mode === 'sum') return Math.min(100, Math.round(scores.reduce((sum, score) => sum + score, 0)));
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function sortAssessmentEntries(entries = []) {
    return [...entries].sort((a, b) => normalizeAssessmentNumber(a?.number, 1) - normalizeAssessmentNumber(b?.number, 1));
}

function syncGradeRecordSummaries(record) {
    const safeRecord = record || {};
    safeRecord.assessments = safeRecord.assessments || {};
    Object.values(GRADEBOOK_CRITERIA).forEach(meta => {
        const entries = sortAssessmentEntries(safeRecord.assessments[meta.key] || []);
        safeRecord.assessments[meta.key] = entries;
        safeRecord[meta.legacyKey] = aggregateAssessmentEntries(entries, meta.aggregateMode);
    });
    return safeRecord;
}

function ensureGradeRecordHistories(record = {}) {
    const safeRecord = { ...(record || {}) };
    safeRecord.assessments = safeRecord.assessments || {};

    Object.values(GRADEBOOK_CRITERIA).forEach(meta => {
        let entries = Array.isArray(safeRecord.assessments[meta.key]) ? safeRecord.assessments[meta.key] : [];
        entries = entries
            .filter(entry => entry && typeof entry === 'object')
            .map(entry => normalizeAssessmentEntry(entry, 1));

        if (!entries.length && isFiniteGradeScore(safeRecord[meta.legacyKey]) && Number(safeRecord[meta.legacyKey]) > 0) {
            const now = safeRecord.updatedAt || null;
            entries.push({
                number: 1,
                score: Number(safeRecord[meta.legacyKey]),
                updatedAt: now,
                updatedBy: safeRecord.updatedBy || null,
                history: [{
                    score: Number(safeRecord[meta.legacyKey]),
                    updatedAt: now,
                    updatedBy: safeRecord.updatedBy || null,
                    action: 'legacy-import'
                }]
            });
        }

        safeRecord.assessments[meta.key] = sortAssessmentEntries(entries);
    });

    return syncGradeRecordSummaries(safeRecord);
}

function getAssessmentEntries(record, criterion) {
    const normalizedCriterion = normalizeGradebookCriterion(criterion);
    return sortAssessmentEntries(ensureGradeRecordHistories(record).assessments[normalizedCriterion] || []);
}

function getAssessmentScoreForNumber(record, criterion, number) {
    const targetNumber = normalizeAssessmentNumber(number, 1);
    const entry = getAssessmentEntries(record, criterion).find(item => normalizeAssessmentNumber(item.number, 1) === targetNumber);
    return entry ? Number(entry.score || 0) : 0;
}

function getAssessmentEntryForNumber(record, criterion, number) {
    const targetNumber = normalizeAssessmentNumber(number, 1);
    return getAssessmentEntries(record, criterion).find(item => normalizeAssessmentNumber(item.number, 1) === targetNumber) || null;
}

function isAssessmentEntryPendingReview(record, criterion, number) {
    const entry = getDisplayAssessmentEntryForNumber(record, criterion, number) || getAssessmentEntryForNumber(record, criterion, number);
    if (!entry) return false;
    const source = resolveLmsQuizSourceFromAssessmentEntry(entry);
    if (source?.resourceKey && source?.quizId && record?.id) {
        const submission = getLmsQuizSubmission(source.resourceKey, source.quizId, record.id);
        if (submission) {
            return Boolean(submission.requiresManualReview && ['submitted', 'auto-submitted'].includes(String(submission.status || '')));
        }
    }
    const hasLinkedQuiz = Boolean(String(entry.sourceQuizId || '').trim() && String(entry.sourceResourceKey || '').trim());
    const hasScore = entry.score !== null && entry.score !== undefined && entry.score !== '';
    return hasLinkedQuiz && !hasScore;
}

function getLmsQuizResourceKeysForCurrentGradebookRoster() {
    const rosterKey = String(currentRosterId || '').trim();
    if (!rosterKey) return [];
    const matches = [];
    Object.keys(KIU_STATE.lmsQuizBuilder || {}).forEach(resourceKey => {
        const parsed = parseLmsCourseKey(resourceKey);
        if (!parsed.courseId || !parsed.groupId) return;
        const enrolledStudents = getEnrolledStudentsForGroup(parsed.courseId, parsed.groupId);
        const candidateRosterKey = resolveGradebookRosterKey(parsed.courseId, parsed.groupId, enrolledStudents);
        if (String(candidateRosterKey) === rosterKey) {
            matches.push(resolveCanonicalLmsResourceKey(resourceKey));
        }
    });
    return [...new Set(matches)];
}

function getLmsQuizResourceKeysForStudentHistory(studentId = '') {
    const normalizedStudentId = String(studentId || '').trim();
    const rosterMatches = getLmsQuizResourceKeysForCurrentGradebookRoster();
    const studentMatches = [];

    Object.keys(KIU_STATE.lmsQuizBuilder || {}).forEach(resourceKey => {
        const normalizedResourceKey = resolveCanonicalLmsResourceKey(resourceKey);
        const workspace = ensureLmsQuizBuilderWorkspace(normalizedResourceKey);
        const hasSubmission = Object.values(workspace.submissions || {}).some(store =>
            store && typeof store === 'object' && Object.prototype.hasOwnProperty.call(store, normalizedStudentId)
        );
        if (hasSubmission) {
            studentMatches.push(normalizedResourceKey);
        }
    });

    const combined = [...new Set([...rosterMatches, ...studentMatches])];
    if (rosterMatches.length) {
        return combined;
    }
    return studentMatches.length ? [...new Set(studentMatches)] : combined;
}

function buildDisplayAssessmentEntryFromLmsQuiz(resourceKey, quiz, submission, criterion) {
    if (!quiz || !submission) return null;
    const normalizedResourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    const normalizedCriterion = normalizeGradebookCriterion(criterion);
    const quizCriterion = normalizeGradebookCriterion(normalizeLmsQuizAssessmentType(quiz.assessmentType));
    if (quizCriterion !== normalizedCriterion) return null;
    const visibleScore = submission.finalScoreRaw ?? submission.gradebookScore ?? null;
    const history = Array.isArray(submission.history) && submission.history.length
        ? submission.history.map(item => ({
            score: item.finalScoreRaw ?? item.score ?? item.gradebookScore ?? null,
            updatedAt: item.updatedAt || item.timestamp || submission.reviewedAt || submission.submittedAt || quiz.updatedAt || quiz.createdAt,
            updatedBy: item.updatedBy || item.actor || submission.reviewedBy || submission.studentName || 'LMS Quiz',
            action: item.action || item.type || 'submitted'
        }))
        : [{
            score: visibleScore,
            updatedAt: submission.reviewedAt || submission.submittedAt || submission.startedAt || quiz.updatedAt || quiz.createdAt,
            updatedBy: submission.reviewedBy || submission.studentName || 'LMS Quiz',
            action: submission.requiresManualReview && ['submitted', 'auto-submitted'].includes(String(submission.status || ''))
                ? 'submitted'
                : (submission.reviewedAt ? 'scored' : 'submitted')
        }];
    return {
        number: normalizeAssessmentNumber(quiz.assessmentNumber, 1),
        score: visibleScore,
        updatedAt: submission.reviewedAt || submission.submittedAt || submission.startedAt || quiz.updatedAt || quiz.createdAt,
        updatedBy: submission.reviewedBy || submission.studentName || 'LMS Quiz',
        note: buildLmsQuizGradebookNote(
            normalizedResourceKey,
            quiz,
            submission.requiresManualReview && ['submitted', 'auto-submitted'].includes(String(submission.status || ''))
                ? (submission.gradebookScore === null || submission.gradebookScore === undefined ? 'Submitted / waiting for review' : 'Objective part auto-scored / waiting for review')
                : 'Submitted quiz'
        ),
        sourceResourceKey: normalizedResourceKey,
        sourceQuizId: quiz.id,
        sourceAssessmentType: quiz.assessmentType || normalizedCriterion,
        sourceAssessmentNumber: normalizeAssessmentNumber(quiz.assessmentNumber, 1),
        history
    };
}

function getDisplayAssessmentEntries(record, criterion) {
    const normalizedCriterion = normalizeGradebookCriterion(criterion);
    const baseEntries = getAssessmentEntries(record, normalizedCriterion).map(entry => ({
        ...entry,
        history: Array.isArray(entry.history) ? [...entry.history] : entry.history
    }));
    const mergedEntries = new Map();
    const genericByNumber = new Map();

    baseEntries.forEach(entry => {
        const number = normalizeAssessmentNumber(entry.number, 1);
        const sourceKey = `${String(entry.sourceResourceKey || '').trim()}::${String(entry.sourceQuizId || '').trim()}`;
        const hasLinkedSource = Boolean(String(entry.sourceResourceKey || '').trim() && String(entry.sourceQuizId || '').trim());
        if (hasLinkedSource) {
            mergedEntries.set(sourceKey, entry);
        } else if (!genericByNumber.has(number)) {
            genericByNumber.set(number, entry);
        }
    });

    const studentId = String(record?.id || '').trim();
    if (studentId) {
        getLmsQuizResourceKeysForStudentHistory(studentId).forEach(resourceKey => {
            ensureLmsQuizzesForKey(resourceKey).forEach(quiz => {
                const submission = getLmsQuizSubmission(resourceKey, quiz.id, studentId);
                if (!submission || submission.status === 'not-started') return;
                const displayEntry = buildDisplayAssessmentEntryFromLmsQuiz(resourceKey, quiz, submission, normalizedCriterion);
                if (!displayEntry) return;
                const sourceKey = `${displayEntry.sourceResourceKey}::${displayEntry.sourceQuizId}`;
                const entryNumber = normalizeAssessmentNumber(displayEntry.number, 1);
                const existingLinked = mergedEntries.get(sourceKey);
                if (existingLinked) {
                    mergedEntries.set(sourceKey, {
                        ...existingLinked,
                        ...displayEntry,
                        history: displayEntry.history?.length ? displayEntry.history : existingLinked.history
                    });
                    return;
                }
                if (genericByNumber.has(entryNumber)) {
                    const genericEntry = genericByNumber.get(entryNumber);
                    genericByNumber.delete(entryNumber);
                    mergedEntries.set(sourceKey, {
                        ...genericEntry,
                        ...displayEntry,
                        history: displayEntry.history?.length ? displayEntry.history : genericEntry.history
                    });
                    return;
                }
                mergedEntries.set(sourceKey, displayEntry);
            });
        });
    }

    const finalEntries = [
        ...genericByNumber.values(),
        ...mergedEntries.values()
    ];
    return sortAssessmentEntries(finalEntries);
}

function getDisplayAssessmentEntryForNumber(record, criterion, number) {
    const targetNumber = normalizeAssessmentNumber(number, 1);
    return getDisplayAssessmentEntries(record, criterion)
        .find(item => normalizeAssessmentNumber(item.number, 1) === targetNumber) || null;
}

function getAssessmentDisplayValue(record, meta) {
    const entries = getDisplayAssessmentEntries(record, meta?.key);
    if (entries.length) {
        return aggregateAssessmentEntries(entries, meta?.aggregateMode || 'average');
    }
    if (meta?.legacyKey && Number.isFinite(Number(record?.[meta.legacyKey]))) {
        return Number(record[meta.legacyKey]);
    }
    return 0;
}

function createAssessmentEntryOnRecord(record, criterion, number, meta = {}) {
    const safeRecord = ensureGradeRecordHistories(record);
    const normalizedCriterion = normalizeGradebookCriterion(criterion);
    const targetNumber = normalizeAssessmentNumber(number, 1);
    const entries = getAssessmentEntries(safeRecord, normalizedCriterion);
    if (entries.some(entry => normalizeAssessmentNumber(entry.number, 1) === targetNumber)) {
        return syncGradeRecordSummaries(safeRecord);
    }
    const now = new Date().toISOString();
    entries.push({
        number: targetNumber,
        score: null,
        updatedAt: now,
        updatedBy: meta.updatedBy || getSimulatedUserName(),
        title: meta.title || '',
        note: meta.note || '',
        sourceResourceKey: meta.sourceResourceKey || '',
        sourceQuizId: meta.sourceQuizId || '',
        sourceAssessmentType: meta.sourceAssessmentType || '',
        sourceAssessmentNumber: meta.sourceAssessmentNumber || targetNumber,
        history: [{
            score: null,
            updatedAt: now,
            updatedBy: meta.updatedBy || getSimulatedUserName(),
            action: 'created',
            title: meta.title || '',
            note: meta.note || '',
            sourceResourceKey: meta.sourceResourceKey || '',
            sourceQuizId: meta.sourceQuizId || '',
            sourceAssessmentType: meta.sourceAssessmentType || '',
            sourceAssessmentNumber: meta.sourceAssessmentNumber || targetNumber
        }]
    });
    safeRecord.assessments[normalizedCriterion] = sortAssessmentEntries(entries);
    return syncGradeRecordSummaries(safeRecord);
}

function setAssessmentScoreOnRecord(record, criterion, number, score, meta = {}) {
    const safeRecord = ensureGradeRecordHistories(record);
    const normalizedCriterion = normalizeGradebookCriterion(criterion);
    const targetNumber = normalizeAssessmentNumber(number, 1);
    const criterionMeta = getGradebookCriterionMeta(normalizedCriterion, safeRecord);
    const maxScore = Number.isFinite(Number(criterionMeta?.maxScore)) ? Number(criterionMeta.maxScore) : 100;
    const numericScore = Math.max(0, Math.min(maxScore, Number(score || 0)));
    const entries = getAssessmentEntries(safeRecord, normalizedCriterion);
    const existingIndex = entries.findIndex(entry => normalizeAssessmentNumber(entry.number, 1) === targetNumber);
    const existingEntry = existingIndex >= 0 ? entries[existingIndex] : null;
    const now = new Date().toISOString();
    const nextEntry = {
        number: targetNumber,
        score: numericScore,
        updatedAt: now,
        updatedBy: meta.updatedBy || getSimulatedUserName(),
        title: meta.title || existingEntry?.title || '',
        note: meta.note || existingEntry?.note || '',
        sourceResourceKey: meta.sourceResourceKey || existingEntry?.sourceResourceKey || '',
        sourceQuizId: meta.sourceQuizId || existingEntry?.sourceQuizId || '',
        sourceAssessmentType: meta.sourceAssessmentType || existingEntry?.sourceAssessmentType || '',
        sourceAssessmentNumber: meta.sourceAssessmentNumber || existingEntry?.sourceAssessmentNumber || targetNumber,
        history: [
            ...(Array.isArray(existingEntry?.history) ? existingEntry.history.map(normalizeAssessmentHistoryEntry) : []),
            {
                score: numericScore,
                updatedAt: now,
                updatedBy: meta.updatedBy || getSimulatedUserName(),
                action: existingEntry && (existingEntry.score === null || existingEntry.score === undefined) ? 'scored' : (existingEntry ? 'updated' : 'scored'),
                title: meta.title || existingEntry?.title || '',
                note: meta.note || existingEntry?.note || '',
                sourceResourceKey: meta.sourceResourceKey || existingEntry?.sourceResourceKey || '',
                sourceQuizId: meta.sourceQuizId || existingEntry?.sourceQuizId || '',
                sourceAssessmentType: meta.sourceAssessmentType || existingEntry?.sourceAssessmentType || '',
                sourceAssessmentNumber: meta.sourceAssessmentNumber || existingEntry?.sourceAssessmentNumber || targetNumber
            }
        ]
    };

    if (existingIndex >= 0) {
        entries[existingIndex] = nextEntry;
    } else {
        entries.push(nextEntry);
    }

    safeRecord.assessments[normalizedCriterion] = sortAssessmentEntries(entries);
    return syncGradeRecordSummaries(safeRecord);
}

function formatAssessmentHistoryLabel(criterion, entry) {
    const displayMeta = getAssessmentEntryDisplayContext(criterion, entry);
    const scoreLabel = entry?.score === null || entry?.score === undefined || entry?.score === ''
        ? 'Pending'
        : Number(entry.score || 0);
    const base = `${displayMeta.title}: ${scoreLabel}`;
    const extras = [displayMeta.subtitle || '', entry?.note || ''].filter(Boolean);
    return extras.length ? `${base} - ${extras.join(' - ')}` : base;
}

function renderAssessmentHistoryChips(record, criterion) {
    const entries = getDisplayAssessmentEntries(record, criterion);
    if (!entries.length) return '<span style="color: var(--kiu-text-muted);">No history yet</span>';
    return entries.map(entry => `
        <span style="display:inline-flex; align-items:center; gap:6px; padding:4px 8px; border-radius:999px; background:#eff6ff; color:#1d4ed8; font-size:11px; font-weight:700; margin:2px 4px 2px 0;">
            ${escapeHtml(formatAssessmentHistoryLabel(criterion, entry))}
        </span>
    `).join('');
}

function renderStudyCardHistorySections(record, studentId = '', studentName = '') {
    const safeRecord = syncGradeRecordSummaries(ensureGradeRecordHistories(record));
    const sections = getStudentEvaluationHistorySectionDefs(safeRecord);
    return sections.map(meta => {
        const entries = getDisplayAssessmentEntries(safeRecord, meta.key);
        const recordedCount = entries.filter(entry => entry?.score !== null && entry?.score !== undefined && entry?.score !== '').length;
        const aggregateValue = aggregateAssessmentEntries(entries, meta.aggregateMode || 'average');
        const latestEntry = entries.length ? entries[entries.length - 1] : null;
        const latestDisplay = latestEntry ? getAssessmentEntryDisplayContext(meta.key, latestEntry) : null;
        const sectionBody = entries.length
            ? entries.map(entry => {
                const entryNumber = normalizeAssessmentNumber(entry.number, 1);
                const displayMeta = getAssessmentEntryDisplayContext(meta.key, entry);
                const pendingReview = isAssessmentEntryPendingReview(safeRecord, meta.key, entryNumber);
                const entryHistory = Array.isArray(entry.history) && entry.history.length
                    ? entry.history
                    : [{
                        score: entry.score,
                        updatedAt: entry.updatedAt,
                        updatedBy: entry.updatedBy,
                        action: 'saved',
                        note: entry.note || ''
                    }];
                return `
                    <div style="display:grid; gap:8px; padding:12px 14px; border:1px solid rgba(var(--lux-accent-rgb),0.12); border-radius:14px; background:rgba(255,255,255,0.03);">
                        <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start; flex-wrap:wrap;">
                            <div style="min-width:0; display:grid; gap:5px;">
                                <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                                    <div style="font-size:13px; font-weight:900; color:var(--lux-text);">${escapeHtml(displayMeta.title)}</div>
                                    ${pendingReview ? '<span style="display:inline-flex; align-items:center; gap:6px; padding:4px 8px; border-radius:999px; background:rgba(var(--lux-accent-rgb),0.12); color:var(--lux-accent); font-size:10px; font-weight:800;"><i class="fas fa-triangle-exclamation"></i> Waiting for evaluation</span>' : ''}
                                </div>
                                ${displayMeta.subtitle ? `<div style="font-size:11px; color:var(--lux-text-muted);">${escapeHtml(displayMeta.subtitle)}</div>` : ''}
                                <div style="font-size:11px; color:var(--lux-text-muted);">${escapeHtml(formatAssessmentHistoryTimestamp(entry.updatedAt))}${entry.updatedBy ? ` - ${escapeHtml(entry.updatedBy)}` : ''}</div>
                                ${entry.note ? `<div style="font-size:11px; color:var(--lux-text-muted);">${escapeHtml(entry.note)}</div>` : ''}
                            </div>
                            <div style="font-size:16px; font-weight:900; color:var(--lux-accent);">${entry.score === null || entry.score === undefined ? 'Pending' : Number(entry.score)}</div>
                        </div>
                        <div style="display:grid; gap:4px; padding-top:8px; border-top:1px dashed rgba(var(--lux-accent-rgb),0.14);">
                            ${entryHistory.map(historyItem => `
                                <div style="display:flex; justify-content:space-between; gap:12px; font-size:11px; color:var(--lux-text-muted);">
                                    <span>${escapeHtml(historyItem.action === 'created' ? 'Created' : historyItem.action === 'legacy-import' ? 'Imported' : historyItem.action === 'scored' ? 'Scored' : historyItem.action === 'submitted' ? 'Submitted' : 'Updated')}${historyItem.updatedBy ? ` by ${escapeHtml(historyItem.updatedBy)}` : ''}${historyItem.note ? ` - ${escapeHtml(historyItem.note)}` : ''}</span>
                                    <strong style="color:var(--lux-text);">${historyItem.score === null || historyItem.score === undefined ? 'Pending' : Number(historyItem.score)}</strong>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('')
            : '<div style="font-size:12px; color: var(--lux-text-muted); padding:8px 0;">No recorded scores yet.</div>';

        return `
            <div style="padding:12px 14px; border:1px solid rgba(var(--lux-accent-rgb),0.12); border-radius:14px; background:rgba(255,255,255,0.03);">
                <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start; flex-wrap:wrap; margin-bottom:10px;">
                    <div>
                        <div style="font-size:11px; font-weight:800; text-transform:uppercase; color:rgba(var(--lux-accent-rgb),0.76);">${escapeHtml(meta.pluralLabel)} History</div>
                        <div style="font-size:12px; color:var(--lux-text-muted); margin-top:4px;">${recordedCount} recorded score${recordedCount === 1 ? '' : 's'}${latestDisplay ? ` - Latest: ${escapeHtml(latestDisplay.title)}` : ''}</div>
                    </div>
                    <div style="font-size:14px; font-weight:900; color:var(--lux-accent);">${Number.isFinite(aggregateValue) ? aggregateValue : 0}</div>
                </div>
                <div style="display:grid; gap:8px;">
                    ${sectionBody}
                </div>
            </div>
        `;
    }).join('');
}

function getGradebookEffectiveExamScore(record = {}) {
    const safeRecord = syncGradeRecordSummaries(ensureGradeRecordHistories({ ...(record || {}) }));
    const finalScore = Number(getAssessmentDisplayValue(safeRecord, GRADEBOOK_CRITERIA.final) || 0);
    const retakeScore = Number(getAssessmentDisplayValue(safeRecord, GRADEBOOK_CRITERIA.retake) || 0);
    return Math.max(finalScore, retakeScore);
}

function formatAssessmentHistoryTimestamp(value) {
    if (!value) return 'Unknown time';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString();
}

function getStudentEvaluationHistorySectionDefs(record = null) {
    const defs = getGradebookSectionDefs(currentRosterId, record);
    const byKey = new Map(defs.map(meta => [normalizeGradebookCriterion(meta.key), meta]));
    const orderedDefaults = GRADEBOOK_EVALUATION_SECTION_ORDER
        .map(key => byKey.get(key))
        .filter(Boolean);
    const customDefs = defs
        .filter(meta => meta.custom && !GRADEBOOK_EVALUATION_SECTION_ORDER.includes(normalizeGradebookCriterion(meta.key)))
        .sort((a, b) => String(a.label || '').localeCompare(String(b.label || ''), undefined, { numeric: true, sensitivity: 'base' }));
    return [...orderedDefaults, ...customDefs];
}

function suggestGradebookCustomSectionLabel(baseLabel, record = null) {
    const label = String(baseLabel || '').trim();
    if (!label) return '';
    const usedLabels = new Set(
        getGradebookSectionDefs(currentRosterId, record)
            .map(meta => normalizeGradebookCriterion(meta.label || meta.key))
    );
    let candidate = label;
    let suffix = 2;
    while (usedLabels.has(normalizeGradebookCriterion(candidate))) {
        candidate = `${label} ${suffix}`;
        suffix += 1;
    }
    return candidate;
}

function renderStudentEvaluationHistorySections(record) {
    const safeRecord = syncGradeRecordSummaries(ensureGradeRecordHistories(record));
    return getStudentEvaluationHistorySectionDefs(safeRecord).map(meta => {
        const entries = getAssessmentEntries(safeRecord, meta.key);
        const body = entries.length
            ? entries.map(entry => `
                <div style="display:flex; justify-content:space-between; gap:14px; padding:10px 12px; border:1px solid rgba(var(--lux-accent-rgb),0.12); border-radius:14px; background:rgba(255,255,255,0.03); margin-bottom:8px;">
                    <div style="min-width:0;">
                        <div style="font-size:13px; font-weight:800; color:var(--lux-text);">${escapeHtml(`${meta.label} ${normalizeAssessmentNumber(entry.number, 1)}`)}</div>
                        <div style="font-size:11px; color:var(--lux-text-muted); margin-top:4px;">${escapeHtml(formatAssessmentHistoryTimestamp(entry.updatedAt))}${entry.updatedBy ? ` - ${escapeHtml(entry.updatedBy)}` : ''}</div>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
                        <strong style="font-size:15px; color:var(--lux-accent);">${Number(entry.score || 0)}</strong>
                        ${canEdit ? `
                            <button class="lux-secondary-btn" style="padding:5px 8px; font-size:10px; font-weight:800;" data-gradebook-click="open-score-edit" data-gradebook-student-id="${escapeHtml(String(studentId))}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-number="${escapeHtml(String(normalizeAssessmentNumber(entry.number, 1)))}" data-gradebook-score="${escapeHtml(String(Number(entry.score || 0)))}" data-gradebook-student-name="${escapeHtml(String(studentName || ''))}">Edit</button>
                        ` : ''}
                    </div>
                </div>
            `).join('')
            : '<div style="font-size:12px; color: var(--lux-text-muted); padding:4px 0;">No recorded scores yet.</div>';
        return `
            <div style="padding:12px 14px; border:1px solid rgba(var(--lux-accent-rgb),0.12); border-radius:14px; background:rgba(255,255,255,0.03);">
                <div style="display:flex; justify-content:space-between; gap:12px; align-items:center; margin-bottom:10px;">
                    <div style="font-size:11px; font-weight:800; text-transform:uppercase; color:rgba(var(--lux-accent-rgb),0.76);">${escapeHtml(meta.pluralLabel)} History</div>
                    <div style="font-size:12px; font-weight:800; color:var(--lux-accent);">${Number(safeRecord[meta.legacyKey] || 0)}</div>
                </div>
                ${body}
            </div>
        `;
    }).join('');
}

function closeStudentEvaluationHistoryModal() {
    document.getElementById('student-evaluation-history-modal')?.remove();
}

function renderStudentEvaluationHistorySections(record, studentId, studentName = '') {
    const safeRecord = syncGradeRecordSummaries(ensureGradeRecordHistories(record));
    const canEdit = [USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(getEffectiveUserRole());
    const sections = getStudentEvaluationHistorySectionDefs(safeRecord);
    return sections.map(meta => {
        const entries = getAssessmentEntries(safeRecord, meta.key);
        const latestValue = aggregateAssessmentEntries(entries, meta.aggregateMode || 'average');
        const latestEntry = entries.length ? entries[entries.length - 1] : null;
        const body = entries.length
            ? entries.map(entry => `
                <div style="display:flex; justify-content:space-between; gap:14px; padding:10px 12px; border:1px solid rgba(var(--lux-accent-rgb),0.12); border-radius:14px; background:rgba(255,255,255,0.03); margin-bottom:8px;">
                    <div style="min-width:0;">
                        <div style="font-size:13px; font-weight:800; color:var(--lux-text);">${escapeHtml(`${meta.label} ${normalizeAssessmentNumber(entry.number, 1)}`)}</div>
                        <div style="font-size:11px; color:var(--lux-text-muted); margin-top:4px;">${escapeHtml(formatAssessmentHistoryTimestamp(entry.updatedAt))}${entry.updatedBy ? ` - ${escapeHtml(entry.updatedBy)}` : ''}</div>
                    </div>
                    <strong style="font-size:15px; color:var(--lux-accent);">${Number(entry.score || 0)}</strong>
                </div>
            `).join('')
            : '<div style="font-size:12px; color: var(--lux-text-muted); padding:4px 0;">No recorded scores yet.</div>';
        const sectionId = toDomToken(meta.key);
        const scoreInputId = `eval-score-${toDomToken(studentId)}-${sectionId}`;
        const historyBodyId = `eval-history-${toDomToken(studentId)}-${sectionId}`;
        const nextNumber = entries.length ? normalizeAssessmentNumber(entries[entries.length - 1].number, 1) + 1 : 1;
        const latestSummary = latestEntry
            ? `${escapeHtml(meta.label)} ${normalizeAssessmentNumber(latestEntry.number, 1)}: ${Number(latestEntry.score || 0)}`
            : 'No recorded scores yet.';
        return `
            <div style="padding:12px 14px; border:1px solid rgba(var(--lux-accent-rgb),0.12); border-radius:14px; background:rgba(255,255,255,0.03);">
                <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start; margin-bottom:10px; flex-wrap:wrap;">
                    <div>
                        <div style="font-size:11px; font-weight:800; text-transform:uppercase; color:rgba(var(--lux-accent-rgb),0.76);">${escapeHtml(meta.pluralLabel || `${meta.label}s`)} History</div>
                        <div style="font-size:12px; font-weight:800; color:var(--lux-accent); margin-top:4px;">Current: ${Number.isFinite(latestValue) ? latestValue : 0}</div>
                        <div style="font-size:11px; color:var(--lux-text-muted); margin-top:5px;">Latest: ${latestSummary}</div>
                    </div>
                    ${canEdit ? `
                        <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                            <span style="font-size:11px; font-weight:800; color:rgba(var(--lux-accent-rgb),0.72); text-transform:uppercase;">Next #${nextNumber}</span>
                            <input id="${scoreInputId}" type="number" min="0" max="100" placeholder="Score" style="width:110px; padding:8px 10px; border:1px solid rgba(var(--lux-accent-rgb),0.14); border-radius:10px; outline:none; background:rgba(255,255,255,0.04); color:var(--lux-text);">
                            <button class="lux-primary-btn" style="padding:8px 12px; font-size:12px; font-weight:800;" data-gradebook-click="save-entry" data-gradebook-student-id="${escapeHtml(String(studentId))}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-number="0" data-gradebook-input-id="${escapeHtml(String(scoreInputId))}" data-gradebook-student-name="${escapeHtml(String(studentName || ''))}"><i class="fas fa-save"></i> Add score</button>
                        </div>
                    ` : ''}
                </div>
                <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:10px;">
                    <button type="button" class="lux-secondary-btn" style="padding:7px 10px; font-size:11px; font-weight:800;" data-gradebook-click="toggle-history" data-gradebook-history-id="${escapeHtml(String(historyBodyId))}"><i class="fas fa-clock"></i> History</button>
                    ${meta.custom ? `<button type="button" class="lux-secondary-btn" style="padding:7px 10px; font-size:11px; font-weight:800; color:#d46b6b; border-color:rgba(212,107,107,0.24);" data-gradebook-click="remove-custom-section" data-gradebook-student-id="${escapeHtml(String(studentId))}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-student-name="${escapeHtml(String(studentName || ''))}"><i class="fas fa-trash"></i> Remove</button>` : ''}
                </div>
                <div id="${historyBodyId}" style="display:none;">
                    <div style="display:flex; flex-direction:column; gap:8px;">${body}</div>
                </div>
            </div>
        `;
    }).join('');
}

function addGradebookCustomSectionByLabel(studentId, rawLabel, studentName = '') {
    if (![USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(getEffectiveUserRole())) {
        alert('Only professors, teaching assistants, or admins can add custom evaluation sections.');
        return;
    }
    const label = String(rawLabel || '').trim();
    if (!label) {
        alert('Please enter a section name first.');
        return;
    }
    const safeLabel = suggestGradebookCustomSectionLabel(label);
    const sectionKey = normalizeGradebookCriterion(safeLabel);
    if (Object.values(GRADEBOOK_CRITERIA).some(meta => meta.key === sectionKey)) {
        alert('That section already exists.');
        return;
    }
    const sections = ensureGradebookCustomSectionsForRoster(currentRosterId);
    if (sections.some(section => normalizeGradebookCriterion(section.key) === sectionKey)) {
        alert('That section already exists.');
        return;
    }
    sections.push({
        key: sectionKey,
        label: safeLabel,
        pluralLabel: safeLabel.endsWith('s') ? safeLabel : `${safeLabel}s`,
        aggregateMode: 'average',
        createdAt: new Date().toISOString()
    });
    saveState();
    openStudentEvaluationHistoryModal(studentId, studentName, sectionKey);
}

function addGradebookCustomSection(studentId, inputId, studentName = '') {
    const input = document.getElementById(inputId);
    const rawLabel = String(input?.value || '').trim();
    addGradebookCustomSectionByLabel(studentId, rawLabel, studentName);
}

function addGradebookSuggestedSection(studentId, baseLabel, studentName = '') {
    const normalized = normalizeGradebookCriterion(baseLabel);
    const aliasMap = {
        'quiz': 'quiz',
        'oral-quiz': 'oral-quiz',
        'oralquiz': 'oral-quiz',
        'midterm': 'midterm',
        'midterm-exam': 'midterm',
        'final': 'final',
        'final-exam': 'final',
        'retake': 'retake'
    };
    createStudentEvaluationAttempt(studentId, aliasMap[normalized] || normalized, studentName);
}

function toggleGradebookCustomSectionComposer(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    const shouldShow = getComputedStyle(panel).display === 'none';
    panel.style.display = shouldShow ? 'block' : 'none';
    if (shouldShow) panel.querySelector('input')?.focus();
}

function toggleStudentEvaluationSectionHistory(historyId) {
    const panel = document.getElementById(historyId);
    if (!panel) return;
    panel.style.display = getComputedStyle(panel).display === 'none' ? 'block' : 'none';
}

function createStudentEvaluationAttempt(studentId, criterion, studentName = '', title = '') {
    if (![USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(getEffectiveUserRole())) {
        alert('Only professors or teaching assistants can create evaluation attempts.');
        return;
    }
    const roster = Array.isArray(KIU_STATE.studentGrades?.[currentRosterId]) ? KIU_STATE.studentGrades[currentRosterId] : (Array.isArray(mockStudents) ? mockStudents : []);
    const index = roster.findIndex(entry => String(entry.id) === String(studentId));
    const existing = index >= 0 ? roster[index] : (mockStudents || []).find(entry => String(entry.id) === String(studentId));
    if (!existing) {
        alert('Student record not found.');
        return;
    }
    const safeRecord = ensureGradeRecordHistories(existing);
    const normalizedCriterion = normalizeGradebookCriterion(criterion);
    const entries = getAssessmentEntries(safeRecord, normalizedCriterion);
    const occupiedNumbers = new Set(entries.map(entry => normalizeAssessmentNumber(entry.number, 1)));
    let nextNumber = 1;
    while (occupiedNumbers.has(nextNumber)) {
        nextNumber += 1;
    }
    const updated = createAssessmentEntryOnRecord(safeRecord, normalizedCriterion, nextNumber, {
        updatedBy: getSimulatedUserName(),
        title: String(title || '').trim()
    });
    if (index >= 0) {
        roster[index] = updated;
    } else {
        roster.push(updated);
    }
    KIU_STATE.studentGrades[currentRosterId] = roster.map(student => ensureGradeRecordHistories(student));
    mockStudents = KIU_STATE.studentGrades[currentRosterId].map(student => ensureGradeRecordHistories(student));
    saveState();
    initGradebook();
    openStudentEvaluationHistoryModal(studentId, studentName || updated.name || '', normalizedCriterion);
}

function createNamedStudentEvaluationAttempt(studentId, criterionSelectId, titleInputId, studentName = '') {
    if (![USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(getEffectiveUserRole())) {
        alert('Only professors or teaching assistants can create evaluation attempts.');
        return;
    }
    const criterion = document.getElementById(criterionSelectId)?.value || 'quiz';
    const titleInput = document.getElementById(titleInputId);
    const title = String(titleInput?.value || '').trim();
    if (!title) {
        alert('Write the quiz, oral quiz, exam, or paper title first.');
        titleInput?.focus();
        return;
    }
    createStudentEvaluationAttempt(studentId, criterion, studentName, title);
}

function removeStudentEvaluationEntry(studentId, criterion, number, studentName = '') {
    if (![USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(getEffectiveUserRole())) {
        alert('Only professors or teaching assistants can remove evaluation attempts.');
        return;
    }
    const normalizedCriterion = normalizeGradebookCriterion(criterion);
    const targetNumber = normalizeAssessmentNumber(number, 1);
    const roster = Array.isArray(KIU_STATE.studentGrades?.[currentRosterId]) ? KIU_STATE.studentGrades[currentRosterId] : (Array.isArray(mockStudents) ? mockStudents : []);
    const index = roster.findIndex(entry => String(entry.id) === String(studentId));
    const existing = index >= 0 ? roster[index] : (mockStudents || []).find(entry => String(entry.id) === String(studentId));
    if (!existing) {
        alert('Student record not found.');
        return;
    }
    const safeRecord = ensureGradeRecordHistories(existing);
    const entries = getAssessmentEntries(safeRecord, normalizedCriterion);
    const existingIndex = entries.findIndex(entry => normalizeAssessmentNumber(entry.number, 1) === targetNumber);
    if (existingIndex < 0) {
        alert('Attempt not found.');
        return;
    }
    if (!confirm(`Remove ${getGradebookCriterionMeta(normalizedCriterion).label} ${targetNumber}?`)) return;
    entries.splice(existingIndex, 1);
    safeRecord.assessments[normalizedCriterion] = sortAssessmentEntries(entries);
    const updated = syncGradeRecordSummaries(safeRecord);
    if (index >= 0) {
        roster[index] = updated;
    } else {
        roster.push(updated);
    }
    KIU_STATE.studentGrades[currentRosterId] = roster.map(student => ensureGradeRecordHistories(student));
    mockStudents = KIU_STATE.studentGrades[currentRosterId].map(student => ensureGradeRecordHistories(student));
    saveState();
    initGradebook();
    openStudentEvaluationHistoryModal(studentId, studentName || updated.name || '', normalizedCriterion);
}

function renderStudentEvaluationHistorySectionsV2(record, studentId, studentName = '', focusSectionKey = '') {
    const safeRecord = syncGradeRecordSummaries(ensureGradeRecordHistories(record));
    const canEdit = [USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(getEffectiveUserRole());
    const sections = getStudentEvaluationHistorySectionDefs(safeRecord);
    return sections.map(meta => {
        const entries = getDisplayAssessmentEntries(safeRecord, meta.key);
        const latestValue = aggregateAssessmentEntries(entries, meta.aggregateMode || 'average');
        const latestEntry = entries.length ? entries[entries.length - 1] : null;
        const latestDisplay = latestEntry ? getAssessmentEntryDisplayContext(meta.key, latestEntry) : null;
        const pendingSectionCount = entries.filter(entry => isAssessmentEntryPendingReview(safeRecord, meta.key, entry.number)).length;
        const sectionId = toDomToken(meta.key);
        const historyBodyId = `eval-history-${toDomToken(studentId)}-${sectionId}`;
        const isOpen = String(focusSectionKey || '').toLowerCase() === String(meta.key || '').toLowerCase();
        const latestSummary = latestEntry
            ? `${escapeHtml(latestDisplay.title)}: ${latestEntry.score === null || latestEntry.score === undefined ? 'Pending' : Number(latestEntry.score)}`
            : 'No recorded scores yet.';

        const body = entries.length
            ? entries.map(entry => {
                const entryNumber = normalizeAssessmentNumber(entry.number, 1);
                const entryHistoryId = `eval-entry-history-${toDomToken(studentId)}-${sectionId}-${entryNumber}`;
                const inlineQuizPanelId = `eval-inline-quiz-${toDomToken(studentId)}-${sectionId}-${entryNumber}`;
                const entryHistory = Array.isArray(entry.history) && entry.history.length
                    ? entry.history
                    : [{
                        score: entry.score,
                        updatedAt: entry.updatedAt,
                        updatedBy: entry.updatedBy,
                        action: 'saved'
                    }];
                const scoreInputId = `eval-score-${toDomToken(studentId)}-${sectionId}-${entryNumber}`;
                const hasScore = entry.score !== null && entry.score !== undefined && Number.isFinite(Number(entry.score));
                const linkedQuizSource = resolveLmsQuizSourceFromAssessmentEntry(entry);
                const displayMeta = getAssessmentEntryDisplayContext(meta.key, entry);
                const pendingReview = isAssessmentEntryPendingReview(safeRecord, meta.key, entryNumber);
                return `
                    <div style="display:flex; flex-direction:column; gap:8px; padding:12px 14px; border:1px solid rgba(148,163,184,0.18); border-radius:14px; background:#ffffff;">
                        <div style="display:flex; justify-content:space-between; gap:14px; align-items:flex-start; flex-wrap:wrap;">
                            <div style="min-width:0; display:grid; gap:6px;">
                                <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                                    <div style="font-size:13px; font-weight:900; color:var(--kiu-navy);">${escapeHtml(displayMeta.title)}</div>
                                    ${linkedQuizSource ? `<span style="display:inline-flex; align-items:center; gap:6px; padding:4px 8px; border-radius:999px; background:#eff6ff; color:#1d4ed8; font-size:10px; font-weight:800;">${escapeHtml(getGradebookCriterionMeta(meta.key).label)} ${entryNumber}</span>` : ''}
                                    ${pendingReview ? `<span style="display:inline-flex; align-items:center; gap:6px; padding:4px 8px; border-radius:999px; background:#fff7ed; color:#c2410c; font-size:10px; font-weight:800;"><i class="fas fa-triangle-exclamation"></i> Needs evaluation</span>` : ''}
                                </div>
                                ${displayMeta.subtitle ? `<div style="font-size:11px; color:#475569;">${escapeHtml(displayMeta.subtitle)}</div>` : ''}
                                <div style="font-size:11px; color:var(--kiu-text-muted);">${escapeHtml(formatAssessmentHistoryTimestamp(entry.updatedAt))}${entry.updatedBy ? ` - ${escapeHtml(entry.updatedBy)}` : ''}</div>
                                ${entry.note ? `<div style="font-size:11px; color:#64748b;">${escapeHtml(entry.note)}</div>` : ''}
                            </div>
                            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:flex-end;">
                                ${hasScore ? `<strong style="font-size:15px; color:var(--kiu-blue);">${Number(entry.score || 0)}</strong>` : `<span style="font-size:12px; font-weight:800; color:#f59e0b;">Pending</span>`}
                                ${canEdit ? `
                                    ${linkedQuizSource ? `
                                        <button class="kiu-btn-outline" style="padding:5px 8px; font-size:10px; font-weight:800;" data-gradebook-click="open-linked-quiz" data-gradebook-student-id="${escapeHtml(String(studentId))}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-number="${escapeHtml(String(entryNumber))}"><i class="fas fa-file-alt"></i> ${pendingReview ? 'Open & Evaluate Quiz' : 'Open Submitted Quiz'}</button>
                                    ` : ''}
                                    ${hasScore ? `
                                        <button class="kiu-btn-outline" style="padding:5px 8px; font-size:10px; font-weight:800;" data-gradebook-click="open-score-edit" data-gradebook-student-id="${escapeHtml(String(studentId))}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-number="${escapeHtml(String(entryNumber))}" data-gradebook-score="${escapeHtml(String(Number(entry.score || 0)))}" data-gradebook-student-name="${escapeHtml(String(studentName || ''))}">Edit points</button>
                                    ` : `
                                        <input id="${scoreInputId}" type="number" min="0" max="${Number(meta.maxScore || 100)}" placeholder="Score" style="width:96px; padding:7px 9px; border:1px solid var(--kiu-border); border-radius:10px; outline:none;">
                                        <button class="kiu-btn-blue" style="padding:7px 10px; font-size:11px; font-weight:800;" data-gradebook-click="save-entry" data-gradebook-student-id="${escapeHtml(String(studentId))}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-number="${escapeHtml(String(entryNumber))}" data-gradebook-input-id="${escapeHtml(String(scoreInputId))}" data-gradebook-student-name="${escapeHtml(String(studentName || ''))}"><i class="fas fa-save"></i> Save</button>
                                    `}
                                    <button class="kiu-btn-outline" style="padding:5px 8px; font-size:10px; font-weight:800; color:#dc2626; border-color:#fecaca;" data-gradebook-click="remove-entry" data-gradebook-student-id="${escapeHtml(String(studentId))}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-number="${escapeHtml(String(entryNumber))}" data-gradebook-student-name="${escapeHtml(String(studentName || ''))}"><i class="fas fa-trash"></i> Remove</button>
                                ` : ''}
                                <button type="button" class="kiu-btn-outline" style="padding:5px 8px; font-size:10px; font-weight:800;" data-gradebook-click="toggle-history" data-gradebook-history-id="${escapeHtml(String(entryHistoryId))}">Changes</button>
                            </div>
                    </div>
                        <div id="${entryHistoryId}" style="display:none; padding-top:8px; border-top:1px dashed #e2e8f0;">
                            ${entryHistory.map(historyItem => `
                                <div style="display:flex; justify-content:space-between; gap:12px; font-size:11px; color:var(--kiu-text-muted); padding:3px 0;">
                                    <span>${escapeHtml(historyItem.action === 'created' ? 'Created' : historyItem.action === 'legacy-import' ? 'Imported' : historyItem.action === 'scored' ? 'Scored' : 'Updated')}${historyItem.updatedBy ? ` by ${escapeHtml(historyItem.updatedBy)}` : ''}</span>
                                    <strong style="color:var(--kiu-navy);">${historyItem.score === null || historyItem.score === undefined ? 'Pending' : Number(historyItem.score)}</strong>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('')
            : '<div style="font-size:12px; color: var(--kiu-text-muted); padding:4px 0;">No recorded scores yet.</div>';

        return `
            <div id="evaluation-section-${sectionId}" style="padding:12px 14px; border:1px solid #e2e8f0; border-radius:14px; background:#f8fafc;">
                <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start; margin-bottom:10px; flex-wrap:wrap;">
                    <div>
                        <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                            <div style="font-size:11px; font-weight:800; text-transform:uppercase; color:#64748b;">${escapeHtml(meta.pluralLabel || `${meta.label}s`)} History</div>
                            ${pendingSectionCount ? `<span style="display:inline-flex; align-items:center; gap:6px; padding:4px 8px; border-radius:999px; background:#fff7ed; color:#c2410c; font-size:10px; font-weight:800;"><i class="fas fa-triangle-exclamation"></i> ${pendingSectionCount} waiting for evaluation</span>` : ''}
                        </div>
                        <div style="font-size:12px; font-weight:800; color:var(--kiu-blue); margin-top:4px;">Current: ${Number.isFinite(latestValue) ? latestValue : 0}</div>
                        <div style="font-size:11px; color:var(--kiu-text-muted); margin-top:5px;">Latest: ${latestSummary}</div>
                    </div>
                    <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                        ${canEdit && meta.custom ? `<button type="button" class="kiu-btn-outline" style="padding:7px 10px; font-size:11px; font-weight:800; color:#dc2626; border-color:#fecaca;" data-gradebook-click="remove-custom-section" data-gradebook-student-id="${escapeHtml(String(studentId))}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-student-name="${escapeHtml(String(studentName || ''))}"><i class="fas fa-trash"></i> Remove</button>` : ''}
                        <button type="button" class="kiu-btn-outline" style="padding:7px 10px; font-size:11px; font-weight:800;" data-gradebook-click="toggle-history" data-gradebook-history-id="${escapeHtml(String(historyBodyId))}"><i class="fas fa-clock"></i> History</button>
                        ${canEdit && meta.custom ? `<button type="button" class="kiu-btn-blue" style="padding:7px 10px; font-size:11px; font-weight:800;" data-gradebook-click="create-entry" data-gradebook-student-id="${escapeHtml(String(studentId))}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-student-name="${escapeHtml(String(studentName || ''))}"><i class="fas fa-plus"></i> Add Entry</button>` : ''}
                    </div>
                </div>
                <div id="${historyBodyId}" style="display:${isOpen ? 'block' : 'none'};">
                    <div style="display:flex; flex-direction:column; gap:8px;">${body}</div>
                </div>
            </div>
        `;
    }).join('') || `
        <div class="gb-modal-empty">
            <i class="fas fa-filter"></i>
            <strong>No matching assessment section</strong>
            <span>The selected assessment type is not available for this student card.</span>
        </div>
    `;
}

function renderStudentEvaluationHistorySectionsV3(record, studentId, studentName = '', focusSectionKey = '', canEditOverride = null) {
    const safeRecord = syncGradeRecordSummaries(ensureGradeRecordHistories(record));
    const canEdit = canEditOverride === null
        ? [USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(getEffectiveUserRole())
        : Boolean(canEditOverride);
    const focusKey = normalizeGradebookCriterion(focusSectionKey || '');
    const isFocusedView = Boolean(focusKey);
    const sectionDefs = getStudentEvaluationHistorySectionDefs(safeRecord);
    const sections = isFocusedView
        ? sectionDefs.filter(meta => normalizeGradebookCriterion(meta.key) === focusKey)
        : sectionDefs;
    return sections.map(meta => {
        const entries = getDisplayAssessmentEntries(safeRecord, meta.key);
        const orderedEntries = [...entries].sort((a, b) => {
            const aPending = isAssessmentEntryPendingReview(safeRecord, meta.key, normalizeAssessmentNumber(a.number, 1)) ? 1 : 0;
            const bPending = isAssessmentEntryPendingReview(safeRecord, meta.key, normalizeAssessmentNumber(b.number, 1)) ? 1 : 0;
            if (bPending !== aPending) return bPending - aPending;
            const left = new Date(a.updatedAt || 0).getTime() || 0;
            const right = new Date(b.updatedAt || 0).getTime() || 0;
            return right - left;
        });
        const visibleEntries = isFocusedView ? orderedEntries : orderedEntries.slice(0, 8);
        const hiddenCount = Math.max(0, orderedEntries.length - visibleEntries.length);
        const current = aggregateAssessmentEntries(entries, meta.aggregateMode || 'average');
        const pendingCount = entries.filter(entry => isAssessmentEntryPendingReview(safeRecord, meta.key, entry.number)).length;
        const gradedCount = entries.filter(entry => !isAssessmentEntryPendingReview(safeRecord, meta.key, entry.number) && entry.score !== null && entry.score !== undefined && entry.score !== '').length;
        const sectionId = toDomToken(meta.key);
        const isOpen = isFocusedView || pendingCount > 0;
        const historyBodyId = `eval-history-modern-${toDomToken(studentId)}-${sectionId}`;
        const cards = visibleEntries.length ? visibleEntries.map(entry => {
            const entryNumber = normalizeAssessmentNumber(entry.number, 1);
            const displayMeta = getAssessmentEntryDisplayContext(meta.key, entry);
            const linkedQuizSource = resolveLmsQuizSourceFromAssessmentEntry(entry);
            const pendingReview = isAssessmentEntryPendingReview(safeRecord, meta.key, entryNumber);
            const status = pendingReview
                ? { key: 'pending', label: 'Pending review', icon: 'fa-hourglass-half' }
                : (entry.score === null || entry.score === undefined || entry.score === '')
                    ? { key: 'missing', label: 'Not scored', icon: 'fa-circle-minus' }
                    : { key: 'graded', label: 'Graded', icon: 'fa-circle-check' };
            const entryHistory = Array.isArray(entry.history) && entry.history.length
                ? entry.history
                : [{ score: entry.score, updatedAt: entry.updatedAt, updatedBy: entry.updatedBy, action: 'saved' }];
            const scoreInputId = `eval-score-modern-${toDomToken(studentId)}-${sectionId}-${entryNumber}`;
            return `
                <article class="gb-modal-history-card is-${escapeHtml(status.key)}">
                    <div class="gb-modal-history-main">
                        <div class="gb-modal-history-icon"><i class="fas ${escapeHtml(status.icon)}"></i></div>
                        <div>
                            <div class="gb-modal-history-title">
                                <strong>${escapeHtml(displayMeta.title)}</strong>
                                <span class="gb-status-badge is-${escapeHtml(status.key)}">${escapeHtml(status.label)}</span>
                            </div>
                            <div class="gb-modal-history-kind">${escapeHtml(status.key === 'pending' ? 'Pending review queue' : status.key === 'graded' ? 'Graded result' : 'Recorded attempt')}</div>
                            ${displayMeta.subtitle ? `<p>${escapeHtml(displayMeta.subtitle)}</p>` : ''}
                            <p>${escapeHtml(formatAssessmentHistoryTimestamp(entry.updatedAt))}${entry.updatedBy ? ` · ${escapeHtml(entry.updatedBy)}` : ''}</p>
                            ${entry.note ? `<p>${escapeHtml(entry.note)}</p>` : ''}
                            <div class="gb-modal-change-list">
                                ${entryHistory.slice(-3).map(historyItem => `
                                    <span>${escapeHtml(historyItem.action || 'updated')}: ${historyItem.score === null || historyItem.score === undefined ? 'Pending' : Number(historyItem.score)}${historyItem.updatedBy ? ` · ${escapeHtml(historyItem.updatedBy)}` : ''}</span>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="gb-modal-history-score">
                        <strong>${status.key === 'pending' ? 'Pending' : (entry.score === null || entry.score === undefined ? '-' : Number(entry.score))}</strong>
                        <span>${escapeHtml(meta.label)}</span>
                    </div>
                    ${canEdit ? `
                        <div class="gb-modal-history-actions">
                            ${linkedQuizSource ? `<button type="button" data-gradebook-click="open-linked-quiz" data-gradebook-student-id="${escapeHtml(String(studentId))}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-number="${escapeHtml(String(entryNumber))}"><i class="fas fa-file-alt"></i> ${pendingReview ? 'Evaluate' : 'Paper'}</button>` : ''}
                            ${status.key === 'graded'
                                ? `<button type="button" data-gradebook-click="open-score-edit" data-gradebook-student-id="${escapeHtml(String(studentId))}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-number="${escapeHtml(String(entryNumber))}" data-gradebook-score="${escapeHtml(String(Number(entry.score || 0)))}" data-gradebook-student-name="${escapeHtml(String(studentName || ''))}"><i class="fas fa-pen"></i> Edit</button>`
                                : `<input id="${scoreInputId}" type="number" min="0" max="${Number(meta.maxScore || 100)}" placeholder="Score"><button type="button" data-gradebook-click="save-entry" data-gradebook-student-id="${escapeHtml(String(studentId))}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-number="${escapeHtml(String(entryNumber))}" data-gradebook-input-id="${escapeHtml(String(scoreInputId))}" data-gradebook-student-name="${escapeHtml(String(studentName || ''))}"><i class="fas fa-save"></i> Save</button>`}
                            <button type="button" class="is-danger" data-gradebook-click="remove-entry" data-gradebook-student-id="${escapeHtml(String(studentId))}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-number="${escapeHtml(String(entryNumber))}" data-gradebook-student-name="${escapeHtml(String(studentName || ''))}"><i class="fas fa-trash"></i> Remove</button>
                        </div>
                    ` : ''}
                </article>
            `;
        }).join('') : `
            <div class="gb-modal-empty">
                <i class="fas fa-inbox"></i>
                <strong>No ${escapeHtml(meta.pluralLabel || meta.label)} yet</strong>
                <span>This section will update when an assessment is submitted, graded, or manually recorded.</span>
            </div>
        `;
        const moreButton = hiddenCount ? `
            <button type="button" class="gb-modal-load-more" data-gradebook-click="open-history" data-gradebook-student-id="${escapeHtml(String(studentId))}" data-gradebook-student-name="${escapeHtml(String(studentName || ''))}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-force-view-only="true">
                Show all ${escapeHtml(String(entries.length))} ${escapeHtml(meta.pluralLabel || meta.label)}
            </button>
        ` : '';
        return `
            <section class="gb-modal-section">
                <div class="gb-modal-section-head">
                    <div>
                        <div class="gb-modern-kicker">${escapeHtml(meta.pluralLabel || meta.label)}</div>
                        <h3>${escapeHtml(meta.label)} history</h3>
                        <p>Current ${Number.isFinite(current) ? current : 0} · ${entries.length} item${entries.length === 1 ? '' : 's'} · ${pendingCount} pending</p>
                    </div>
                    <div class="gb-modal-section-actions">
                        ${pendingCount ? `<span class="gb-status-badge is-pending">${pendingCount} pending</span>` : `<span class="gb-status-badge is-graded">Ready</span>`}
                        ${!isFocusedView ? `<button type="button" data-gradebook-click="toggle-history" data-gradebook-history-id="${escapeHtml(String(historyBodyId))}"><i class="fas fa-chevron-down"></i> Toggle</button>` : ''}
                        ${canEdit && meta.custom ? `<button type="button" class="is-danger" data-gradebook-click="remove-custom-section" data-gradebook-student-id="${escapeHtml(String(studentId))}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-student-name="${escapeHtml(String(studentName || ''))}"><i class="fas fa-trash"></i></button>` : ''}
                        ${canEdit ? `<button type="button" class="is-primary" data-gradebook-click="create-entry" data-gradebook-student-id="${escapeHtml(String(studentId))}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-student-name="${escapeHtml(String(studentName || ''))}"><i class="fas fa-plus"></i> Add</button>` : ''}
                    </div>
                </div>
                <div id="${historyBodyId}" class="gb-modal-section-body" style="display:${isOpen ? 'grid' : 'none'};">
                    ${cards}
                    ${moreButton}
                </div>
            </section>
        `;
    }).join('');
}

function removeGradebookCustomSectionByKey(studentId, sectionKey, studentName = '') {
    if (![USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(getEffectiveUserRole())) {
        alert('Only professors, teaching assistants, or admins can remove custom evaluation sections.');
        return;
    }
    const normalizedKey = normalizeGradebookCriterion(sectionKey);
    const sectionMeta = getGradebookSectionDefs(currentRosterId).find(meta => meta.key === normalizedKey);
    if (!sectionMeta || !sectionMeta.custom) {
        alert('Only custom sections can be removed.');
        return;
    }
    if (!confirm(`Remove "${sectionMeta.label}" and all of its saved scores?`)) return;

    const roster = Array.isArray(KIU_STATE.studentGrades?.[currentRosterId]) ? KIU_STATE.studentGrades[currentRosterId] : (Array.isArray(mockStudents) ? mockStudents : []);
    const cleanedRoster = roster.map(student => {
        const safeStudent = ensureGradeRecordHistories(student);
        if (safeStudent.assessments) {
            delete safeStudent.assessments[normalizedKey];
        }
        if (safeStudent.assessmentSectionLabels) {
            delete safeStudent.assessmentSectionLabels[normalizedKey];
        }
        return syncGradeRecordSummaries(safeStudent);
    });

    const customSections = ensureGradebookCustomSectionsForRoster(currentRosterId);
    KIU_STATE.gradebookCustomSections[currentRosterId] = customSections.filter(section => normalizeGradebookCriterion(section.key) !== normalizedKey);
    KIU_STATE.studentGrades[currentRosterId] = cleanedRoster;
    mockStudents = cleanedRoster.map(student => ensureGradeRecordHistories(student));
    saveState();
    initGradebook();
    openStudentEvaluationHistoryModal(studentId, studentName);
}

function persistStudentEvaluationEntry(studentId, criterion, number, scoreValue, studentName = '') {
    if (![USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(getEffectiveUserRole())) {
        alert('Only professors or teaching assistants can save evaluation scores.');
        return;
    }
    const numericScore = Number(scoreValue);
    if (!Number.isFinite(numericScore)) {
        alert('Please enter a score first.');
        return;
    }
    const roster = Array.isArray(KIU_STATE.studentGrades?.[currentRosterId]) ? KIU_STATE.studentGrades[currentRosterId] : (Array.isArray(mockStudents) ? mockStudents : []);
    const index = roster.findIndex(entry => String(entry.id) === String(studentId));
    const existing = index >= 0 ? roster[index] : (mockStudents || []).find(entry => String(entry.id) === String(studentId));
    if (!existing) {
        alert('Student record not found.');
        return;
    }
    const safeRecord = ensureGradeRecordHistories(existing);
    const normalizedCriterion = normalizeGradebookCriterion(criterion);
    const entries = getAssessmentEntries(safeRecord, normalizedCriterion);
    const targetNumber = Number.isFinite(Number(number)) && Number(number) > 0
        ? normalizeAssessmentNumber(number, 1)
        : (entries.length ? normalizeAssessmentNumber(entries[entries.length - 1].number, 1) + 1 : 1);
    const updated = setAssessmentScoreOnRecord(safeRecord, normalizedCriterion, targetNumber, numericScore, {
        updatedBy: getSimulatedUserName()
    });
    if (index >= 0) {
        roster[index] = updated;
    } else {
        roster.push(updated);
    }
    KIU_STATE.studentGrades[currentRosterId] = roster.map(student => ensureGradeRecordHistories(student));
    mockStudents = KIU_STATE.studentGrades[currentRosterId].map(student => ensureGradeRecordHistories(student));
    saveState();
    initGradebook();
    openStudentEvaluationHistoryModal(studentId, studentName || updated.name || '', normalizedCriterion);
}

function openGradebookScoreEditModal(studentId, criterion, number, currentScore, studentName = '') {
    if (![USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(getEffectiveUserRole())) {
        alert('Only professors or teaching assistants can save evaluation scores.');
        return;
    }
    document.getElementById('gradebook-score-edit-modal')?.remove();
    const inputId = `gradebook-score-edit-${toDomToken(studentId)}-${toDomToken(criterion)}-${normalizeAssessmentNumber(number, 1)}`;
    const reasonId = `${inputId}-reason`;
    const overlay = document.createElement('div');
    overlay.id = 'gradebook-score-edit-modal';
    overlay.className = 'gb-score-edit-overlay';
    overlay.onclick = event => {
        if (event.target === overlay) overlay.remove();
    };
    overlay.innerHTML = `
        <div class="gb-score-edit-card">
            <div>
                <div class="gb-modern-kicker">Score Correction</div>
                <h3>Edit ${escapeHtml(getGradebookCriterionMeta(criterion).label)} ${escapeHtml(String(normalizeAssessmentNumber(number, 1)))}</h3>
                <p>${escapeHtml(studentName || studentId)} · changes are kept in the assessment history.</p>
            </div>
            <label>New score
                <input id="${inputId}" type="number" min="0" max="${Number(getGradebookCriterionMeta(criterion).maxScore || 100)}" value="${escapeHtml(String(currentScore ?? ''))}">
            </label>
            <label>Reason / note
                <textarea id="${reasonId}" placeholder="Optional correction reason for audit trail"></textarea>
            </label>
            <div class="gb-score-edit-actions">
                <button type="button" data-gradebook-click="close-score-edit">Cancel</button>
                <button type="button" class="is-primary" data-gradebook-click="save-score-edit" data-gradebook-student-id="${escapeHtml(String(studentId))}" data-gradebook-criterion="${escapeHtml(String(criterion))}" data-gradebook-number="${escapeHtml(String(normalizeAssessmentNumber(number, 1)))}" data-gradebook-input-id="${escapeHtml(String(inputId))}" data-gradebook-reason-id="${escapeHtml(String(reasonId))}" data-gradebook-student-name="${escapeHtml(String(studentName || ''))}"><i class="fas fa-save"></i> Save correction</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => document.getElementById(inputId)?.focus(), 20);
}

function saveGradebookScoreEdit(studentId, criterion, number, inputId, reasonId, studentName = '') {
    const numericScore = Number(document.getElementById(inputId)?.value);
    if (!Number.isFinite(numericScore)) {
        alert('Please enter a valid score.');
        return;
    }
    persistStudentEvaluationEntry(studentId, criterion, number, numericScore, studentName);
    document.getElementById('gradebook-score-edit-modal')?.remove();
}

function changeStudentEvaluationEntryScore(studentId, criterion, number, currentScore, studentName = '') {
    openGradebookScoreEditModal(studentId, criterion, number, currentScore, studentName);
}

function saveStudentEvaluationEntry(studentId, criterion, numberInputId, scoreInputId, studentName = '') {
    const number = typeof numberInputId === 'number' || String(numberInputId || '').match(/^\d+$/)
        ? normalizeAssessmentNumber(numberInputId, 0)
        : (numberInputId ? normalizeAssessmentNumber(document.getElementById(numberInputId)?.value, 0) : 0);
    const scoreValue = Number(document.getElementById(scoreInputId)?.value);
    persistStudentEvaluationEntry(studentId, criterion, number, scoreValue, studentName);
}

window.openStudentEvaluationHistoryModal = openStudentEvaluationHistoryModal;
window.openStudentFullEvaluationHistoryModal = function (studentId, studentName = '') {
    return openStudentEvaluationHistoryModal(studentId, studentName, '', true);
};
window.closeStudentEvaluationHistoryModal = closeStudentEvaluationHistoryModal;
window.addGradebookCustomSection = addGradebookCustomSection;
window.addGradebookCustomSectionByLabel = addGradebookCustomSectionByLabel;
window.addGradebookSuggestedSection = addGradebookSuggestedSection;
window.createNamedStudentEvaluationAttempt = createNamedStudentEvaluationAttempt;
window.toggleGradebookCustomSectionComposer = toggleGradebookCustomSectionComposer;
window.toggleStudentEvaluationSectionHistory = toggleStudentEvaluationSectionHistory;
window.removeGradebookCustomSectionByKey = removeGradebookCustomSectionByKey;
window.removeStudentEvaluationEntry = removeStudentEvaluationEntry;
window.changeStudentEvaluationEntryScore = changeStudentEvaluationEntryScore;
window.openGradebookScoreEditModal = openGradebookScoreEditModal;
window.saveGradebookScoreEdit = saveGradebookScoreEdit;
window.persistStudentEvaluationEntry = persistStudentEvaluationEntry;
window.saveStudentEvaluationEntry = saveStudentEvaluationEntry;
window.getGradebookWeightProfileForRoster = getGradebookWeightProfileForRoster;
window.updateGradebookWeightInput = updateGradebookWeightInput;
window.getGradebookVisibleOutcome = getGradebookVisibleOutcome;
window.getGradebookEffectiveExamScore = getGradebookEffectiveExamScore;
function bindStandaloneGradebookShell() {
    if (window.__gradebookShellDelegatesBound) return;
    window.__gradebookShellDelegatesBound = true;

    document.addEventListener('click', (event) => {
        const actionButton = event.target.closest('[data-gradebook-click], [data-gradebook-action]');
        if (!actionButton) return;
        const action = String(actionButton.dataset.gradebookClick || actionButton.dataset.gradebookAction || '').trim();
        if (action === 'back') {
            closeGradebookSpreadsheet();
            return;
        }
        if (action === 'save') {
            saveGrades();
            return;
        }
        if (action === 'open-section') {
            openGradebookSection(
                String(actionButton.dataset.gradebookCourseId || ''),
                String(actionButton.dataset.gradebookGroupId || ''),
                String(actionButton.dataset.gradebookTitle || '')
            );
            return;
        }
        if (action === 'open-history') {
            openStudentEvaluationHistoryModal(
                String(actionButton.dataset.gradebookStudentId || ''),
                String(actionButton.dataset.gradebookStudentName || ''),
                String(actionButton.dataset.gradebookCriterion || ''),
                actionButton.dataset.gradebookForceViewOnly === 'true'
            );
            return;
        }
        if (action === 'preview-student') {
            previewGradebookStudentAccount(
                String(actionButton.dataset.gradebookStudentId || ''),
                String(actionButton.dataset.gradebookStudentName || '')
            );
            return;
        }
        if (action === 'pending-queue') {
            openGradebookPendingQueue();
            return;
        }
        if (action === 'export-csv') {
            exportGradebookCsv();
            return;
        }
        if (action === 'publish') {
            markGradebookSectionPublished();
            return;
        }
        if (action === 'finalize') {
            markGradebookSectionFinalized();
            return;
        }
        if (action === 'open-linked-quiz') {
            openStudentQuizPaperFromHistory(
                String(actionButton.dataset.gradebookStudentId || ''),
                String(actionButton.dataset.gradebookCriterion || ''),
                Number(actionButton.dataset.gradebookNumber || 0)
            );
            return;
        }
        if (action === 'open-score-edit') {
            openGradebookScoreEditModal(
                String(actionButton.dataset.gradebookStudentId || ''),
                String(actionButton.dataset.gradebookCriterion || ''),
                Number(actionButton.dataset.gradebookNumber || 0),
                Number(actionButton.dataset.gradebookScore || 0),
                String(actionButton.dataset.gradebookStudentName || '')
            );
            return;
        }
        if (action === 'save-entry') {
            saveStudentEvaluationEntry(
                String(actionButton.dataset.gradebookStudentId || ''),
                String(actionButton.dataset.gradebookCriterion || ''),
                actionButton.dataset.gradebookNumber || '',
                String(actionButton.dataset.gradebookInputId || ''),
                String(actionButton.dataset.gradebookStudentName || '')
            );
            return;
        }
        if (action === 'remove-entry') {
            removeStudentEvaluationEntry(
                String(actionButton.dataset.gradebookStudentId || ''),
                String(actionButton.dataset.gradebookCriterion || ''),
                Number(actionButton.dataset.gradebookNumber || 0),
                String(actionButton.dataset.gradebookStudentName || '')
            );
            return;
        }
        if (action === 'toggle-history') {
            toggleStudentEvaluationSectionHistory(String(actionButton.dataset.gradebookHistoryId || ''));
            return;
        }
        if (action === 'remove-custom-section') {
            removeGradebookCustomSectionByKey(
                String(actionButton.dataset.gradebookStudentId || ''),
                String(actionButton.dataset.gradebookCriterion || ''),
                String(actionButton.dataset.gradebookStudentName || '')
            );
            return;
        }
        if (action === 'create-entry') {
            createStudentEvaluationAttempt(
                String(actionButton.dataset.gradebookStudentId || ''),
                String(actionButton.dataset.gradebookCriterion || ''),
                String(actionButton.dataset.gradebookStudentName || '')
            );
            return;
        }
        if (action === 'toggle-custom-composer') {
            toggleGradebookCustomSectionComposer(String(actionButton.dataset.gradebookPanelId || ''));
            return;
        }
        if (action === 'create-named-attempt') {
            createNamedStudentEvaluationAttempt(
                String(actionButton.dataset.gradebookStudentId || ''),
                String(actionButton.dataset.gradebookCriterionSelectId || ''),
                String(actionButton.dataset.gradebookTitleInputId || ''),
                String(actionButton.dataset.gradebookStudentName || '')
            );
            return;
        }
        if (action === 'add-custom-section') {
            addGradebookCustomSection(
                String(actionButton.dataset.gradebookStudentId || ''),
                String(actionButton.dataset.gradebookInputId || ''),
                String(actionButton.dataset.gradebookStudentName || '')
            );
            return;
        }
        if (action === 'close-history-modal') {
            closeStudentEvaluationHistoryModal();
            return;
        }
        if (action === 'close-score-edit') {
            document.getElementById('gradebook-score-edit-modal')?.remove();
            return;
        }
        if (action === 'save-score-edit') {
            saveGradebookScoreEdit(
                String(actionButton.dataset.gradebookStudentId || ''),
                String(actionButton.dataset.gradebookCriterion || ''),
                Number(actionButton.dataset.gradebookNumber || 0),
                String(actionButton.dataset.gradebookInputId || ''),
                String(actionButton.dataset.gradebookReasonId || ''),
                String(actionButton.dataset.gradebookStudentName || '')
            );
        }
    });

    document.addEventListener('change', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLSelectElement || target instanceof HTMLInputElement)) return;

        if (target.matches('[data-gradebook-roster-filter]')) {
            renderGradebookRosterSelection();
            return;
        }

        if (target.matches('[data-gradebook-weight]')) {
            updateGradebookWeightInput(String(target.dataset.gradebookWeight || '').trim(), target.value);
            return;
        }

        if (target.matches('[data-gradebook-assessment-target="criterion"]')) {
            setGradebookAssessmentTarget(target.value, document.getElementById('gradebook-assessment-number')?.value);
            return;
        }

        if (target.matches('[data-gradebook-assessment-target="number"]')) {
            setGradebookAssessmentTarget(document.getElementById('gradebook-criterion-select')?.value, target.value);
        }
    });
}
window.bindStandaloneGradebookShell = bindStandaloneGradebookShell;
if (typeof window.openStudentQuizPaperFromHistory !== 'function') {
    window.openStudentQuizPaperFromHistory = function (...args) {
        if (typeof window.openStudentQuizPaperFromHistoryImpl === 'function') {
            return window.openStudentQuizPaperFromHistoryImpl(...args);
        }
        console.warn('Student quiz paper history is not ready yet.');
        return null;
    };
}
window.renderStudentEvaluationHistorySections = renderStudentEvaluationHistorySectionsV3;

function openStudentEvaluationHistoryModal(studentId, studentName = '', focusSectionKey = '', forceViewOnly = false) {
    const rosterSource = (mockStudents || []).find(student => String(student.id) === String(studentId))
        || Object.values(KIU_STATE.studentGrades || {}).flat().find(student => String(student.id) === String(studentId))
        || { id: studentId, name: studentName || studentId };
    const record = syncGradeRecordSummaries(ensureGradeRecordHistories(rosterSource));
    const displayName = record.name || studentName || record.id;
    const modalSummary = getGradebookModernSummary(record, getGradebookWeightProfileForRoster(currentRosterId));
    const existing = document.getElementById('student-evaluation-history-modal');
    if (existing) existing.remove();
    const canEdit = !forceViewOnly && [USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(getEffectiveUserRole());
    const customSectionInputId = `gradebook-custom-section-${toDomToken(record.id)}`;
    const customSectionPanelId = `gradebook-custom-panel-${toDomToken(record.id)}`;
    const namedAttemptCriterionId = `gradebook-named-attempt-type-${toDomToken(record.id)}`;
    const namedAttemptTitleId = `gradebook-named-attempt-title-${toDomToken(record.id)}`;
    const evaluationDefs = getStudentEvaluationHistorySectionDefs(record);
    const focusKey = normalizeGradebookCriterion(focusSectionKey || '');
    const focusMeta = focusKey ? evaluationDefs.find(meta => normalizeGradebookCriterion(meta.key) === focusKey) : null;

    const summaryCards = modalSummary.sections.map(section => {
        const latest = section.latestEntry ? getAssessmentEntryDisplayContext(section.meta.key, section.latestEntry) : null;
        const status = getGradebookEntryStatus(modalSummary.record, section.meta, section.latestEntry);
        const isActiveCategory = focusKey && normalizeGradebookCriterion(section.meta.key) === focusKey;
        const scoreText = status.key === 'pending' ? 'Pending' : Number(section.aggregate || 0);
        return `
        <button type="button" class="gb-modal-category-card ${isActiveCategory ? 'is-active' : ''}" data-gradebook-click="open-history" data-gradebook-student-id="${escapeHtml(String(record.id))}" data-gradebook-student-name="${escapeHtml(String(displayName))}" data-gradebook-criterion="${escapeHtml(String(section.meta.key))}" data-gradebook-force-view-only="true">
            <div class="gb-modal-category-top">
                <span>${escapeHtml(section.meta.pluralLabel || section.meta.label)}</span>
                <em class="gb-status-badge is-${escapeHtml(status.key)}">${escapeHtml(status.label)}</em>
            </div>
            <div class="gb-modal-category-body">
                <strong>${escapeHtml(String(scoreText))}</strong>
                <div>
                    <small>${section.scoredEntries.length} graded</small>
                    <small>${section.pendingEntries.length} pending</small>
                </div>
            </div>
            <small>${section.scoredEntries.length} graded · ${section.pendingEntries.length} pending</small>
            <div class="gb-modal-category-latest">
                <span>${latest ? escapeHtml(latest.title) : 'No activity yet'}</span>
            </div>
        </button>
    `;
    }).join('');

    const overlay = document.createElement('div');
    overlay.id = 'student-evaluation-history-modal';
    overlay.style.cssText = 'position:fixed; inset:0; z-index:7000; background:rgba(15,23,42,0.72); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; padding:24px;';
    overlay.onclick = (event) => {
        if (event.target === overlay) closeStudentEvaluationHistoryModal();
    };

    overlay.innerHTML = `
        <div class="gb-modal-shell">
            <div class="gb-modal-hero">
                <div>
                    <div class="gb-modern-kicker">${focusMeta ? escapeHtml(focusMeta.pluralLabel || focusMeta.label) : 'Full Evaluation History'}</div>
                    <h2>${escapeHtml(displayName)}</h2>
                    <p>Student ID: ${escapeHtml(record.id)} · ${canEdit ? 'TA / Professor review workspace' : 'Read-only student record'}</p>
                </div>
                <div class="gb-modal-score">
                    <strong>${escapeHtml(modalSummary.outcome.scoreLabel)}</strong>
                    <span>${escapeHtml(modalSummary.outcome.letterLabel)}</span>
                </div>
                <button class="gb-modal-close" data-gradebook-click="close-history-modal"><i class="fas fa-times"></i> Close</button>
            </div>
            <div class="gb-modal-body">
                <div class="gb-modal-category-grid ${focusMeta ? 'is-filtered' : ''}">
                    ${summaryCards}
                </div>
                ${canEdit ? `
                    <div class="gb-staff-create-panel">
                        <div class="gb-staff-create-card">
                            <div class="gb-modern-card-head">
                                <div>
                                    <div class="gb-modern-kicker">Staff Actions</div>
                                    <h3>Create named paper/manual attempt</h3>
                                    <p>Use this for paper quizzes, oral quizzes, midterms, finals, retakes, or manual classroom assessments.</p>
                                </div>
                                <button type="button" class="gb-modern-action is-primary" data-gradebook-click="toggle-custom-composer" data-gradebook-panel-id="${escapeHtml(String(customSectionPanelId))}"><i class="fas fa-plus"></i> Custom Section</button>
                            </div>
                            <div class="gb-staff-create-grid">
                                <label>Section
                                    <select id="${namedAttemptCriterionId}">
                                        ${evaluationDefs.map(meta => `<option value="${escapeHtml(meta.key)}">${escapeHtml(meta.label)}</option>`).join('')}
                                    </select>
                                </label>
                                <label>Assessment name
                                    <input id="${namedAttemptTitleId}" type="text" placeholder="e.g. Paper Quiz - Week 6, Oral Exam 2, Midterm Part B">
                                </label>
                                <button type="button" class="gb-modern-action is-primary" data-gradebook-click="create-named-attempt" data-gradebook-student-id="${escapeHtml(String(record.id))}" data-gradebook-criterion-select-id="${escapeHtml(String(namedAttemptCriterionId))}" data-gradebook-title-input-id="${escapeHtml(String(namedAttemptTitleId))}" data-gradebook-student-name="${escapeHtml(String(displayName))}"><i class="fas fa-plus"></i> Create</button>
                            </div>
                            <div class="gb-quick-actions">
                                <span>Quick create</span>
                                <button type="button" data-gradebook-click="create-entry" data-gradebook-student-id="${escapeHtml(String(record.id))}" data-gradebook-criterion="quiz" data-gradebook-student-name="${escapeHtml(String(displayName))}">Quiz</button>
                                <button type="button" data-gradebook-click="create-entry" data-gradebook-student-id="${escapeHtml(String(record.id))}" data-gradebook-criterion="oral-quiz" data-gradebook-student-name="${escapeHtml(String(displayName))}">Oral Quiz</button>
                                <button type="button" data-gradebook-click="create-entry" data-gradebook-student-id="${escapeHtml(String(record.id))}" data-gradebook-criterion="midterm" data-gradebook-student-name="${escapeHtml(String(displayName))}">Midterm</button>
                                <button type="button" data-gradebook-click="create-entry" data-gradebook-student-id="${escapeHtml(String(record.id))}" data-gradebook-criterion="final" data-gradebook-student-name="${escapeHtml(String(displayName))}">Final Exam</button>
                                <button type="button" data-gradebook-click="create-entry" data-gradebook-student-id="${escapeHtml(String(record.id))}" data-gradebook-criterion="retake" data-gradebook-student-name="${escapeHtml(String(displayName))}">Retake</button>
                            </div>
                        </div>
                        <div id="${customSectionPanelId}" class="gb-custom-section-panel" style="display:none;">
                            <div class="gb-modern-kicker">Custom section name</div>
                            <div>
                                <input id="${customSectionInputId}" type="text" placeholder="Project Review, Oral Practice, Mock Test...">
                                <button class="gb-modern-action is-primary" data-gradebook-click="add-custom-section" data-gradebook-student-id="${escapeHtml(String(record.id))}" data-gradebook-input-id="${escapeHtml(String(customSectionInputId))}" data-gradebook-student-name="${escapeHtml(String(displayName))}"><i class="fas fa-plus"></i> Add section</button>
                            </div>
                        </div>
                    </div>
                ` : ''}
                <div class="gb-modal-history-grid">
                    ${renderStudentEvaluationHistorySectionsV3(record, record.id, displayName, focusSectionKey, canEdit)}
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function renderGradebookRosterSelection() {
    const container = document.getElementById('gradebook-roster-selection');
    if (!container) return;

    const currentUser = getCurrentUser();
    const groups = getGradebookGroupsForCurrentUser();
    const title = currentUser?.role === USER_ROLES.ADMIN ? 'Faculty Gradebook Rosters' : 'My Active Rosters';
    const subtitle = currentUser?.role === USER_ROLES.ADMIN
        ? 'Faculty-scoped sections available for review and intervention.'
        : 'Choose one of your assigned teaching groups to review grades.';

    if (!groups.length) {
        container.innerHTML = `
            <div class="lms-route-hero">
                <div class="lms-route-eyebrow">Gradebook</div>
                <div class="lms-route-title" style="margin-top:10px;"><i class="fas fa-chalkboard-teacher"></i> ${title}</div>
                <div class="lms-route-copy" style="margin-top:12px;">${subtitle}</div>
            </div>
            ${typeof renderLmsRouteEmptyState === 'function'
                ? renderLmsRouteEmptyState('No Rosters Available', 'No gradebook groups are available for the current session.', 'fa-inbox')
                : `<div class="lms-route-empty"><div class="lms-route-empty-title">No Rosters Available</div><div class="lms-route-empty-copy">No gradebook groups are available for the current session.</div></div>`}
        `;
        return;
    }

    const cards = groups.map(group => `
        <div class="course-card" data-gradebook-click="open-section" data-gradebook-course-id="${escapeHtml(String(group.courseId))}" data-gradebook-group-id="${escapeHtml(String(group.groupId))}" data-gradebook-title="${escapeHtml(`${group.subjectName} | ${group.groupName} | ${String(group.day || '').trim()} ${String(group.time || '').trim()}`)}" style="cursor:pointer;">
            <div class="lms-route-hero" style="border-radius:0; border:0; box-shadow:none; min-height:140px; display:flex; align-items:flex-end;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; width:100%; gap:12px;">
                    <div>
                        <div class="lms-route-eyebrow">${escapeHtml(group.groupName)}</div>
                        <div class="lms-route-title" style="font-size:24px; margin-top:8px;">${escapeHtml(group.subjectName)}</div>
                    </div>
                    <span class="lms-route-pill" style="background:rgba(255,255,255,0.14); color:#fff; border-color:rgba(255,255,255,0.18);"><i class="fas fa-users"></i> ${group.enrolledCount} students</span>
                </div>
            </div>
            <div class="lms-route-panel" style="border:0; border-top:1px solid var(--lux-border); border-radius:0 0 22px 22px; box-shadow:none;">
                <div class="lms-route-kv-grid">
                    <div class="lms-route-kv">
                        <div class="lms-route-kv-label">Schedule</div>
                        <div class="lms-route-kv-value" style="font-size:18px;">${escapeHtml(`${group.day || 'TBD'} ${group.time || ''}`.trim())}</div>
                    </div>
                    <div class="lms-route-kv">
                        <div class="lms-route-kv-label">Room</div>
                        <div class="lms-route-kv-value" style="font-size:18px;">${escapeHtml(group.room || 'TBD')}</div>
                    </div>
                    <div class="lms-route-kv">
                        <div class="lms-route-kv-label">Semester</div>
                        <div class="lms-route-kv-value" style="font-size:18px;">${escapeHtml(group.semester || KIU_STATE.activeSemester || 1)}</div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = `
        <div class="lms-route-hero">
            <div class="lms-route-eyebrow">Gradebook</div>
            <div class="lms-route-title" style="margin-top:10px;"><i class="fas fa-chalkboard-teacher"></i> ${title}</div>
            <div class="lms-route-copy" style="margin-top:12px;">${subtitle}</div>
        </div>
        <div class="lms-route-card-grid" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
            ${cards}
        </div>
    `;
}

function loadGroupStudents(groupId, courseId = null) {
    if (courseId) {
        const gradebookState = buildGradebookStudents(courseId, groupId);
        currentRosterId = gradebookState.rosterKey;
        mockStudents = gradebookState.students.map(student => ensureGradeRecordHistories(student));
        if (!KIU_STATE.studentGrades[currentRosterId]) {
            KIU_STATE.studentGrades[currentRosterId] = JSON.parse(JSON.stringify(mockStudents));
        }
    } else {
        if (!KIU_STATE.studentGrades[groupId]) {
            groupId = 'default_g1';
        }
        currentRosterId = groupId;
        mockStudents = JSON.parse(JSON.stringify(KIU_STATE.studentGrades[currentRosterId] || []))
            .map(student => ensureGradeRecordHistories(student));
    }
    if (document.getElementById('gradebook-body')) {
        initGradebook();
    }
}

function getGradebookSpreadsheetShellMarkup() {
    return `
        <div id="gradebook-spreadsheet-view">
            <div style="margin-bottom:18px;">
                <div style="font-size:18px; font-weight:900; letter-spacing:-0.2px; color:var(--lux-text); margin-bottom:6px;" id="dynamic-gb-title">Open a roster to begin</div>
                <div style="font-size:12px; line-height:1.55; color:var(--lux-text-muted);">Select a criterion, enter the assessment number, and use the table to update grades or inspect history.</div>
            </div>

            <div style="display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:12px; margin-bottom:16px;">
                <div style="padding:12px; border-radius:14px; background:var(--lux-panel); border:1px solid var(--lux-border);">
                    <label for="weight-q1" style="display:block; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:var(--lux-text-muted);">Quiz weight</label>
                    <input id="weight-q1" type="number" min="0" max="100" value="10" data-gradebook-weight="q1" style="width:100%; margin-top:6px; border:1px solid var(--lux-border); border-radius:10px; padding:10px 12px; background:var(--lux-panel); color:var(--lux-text); font-size:13px; font-weight:700; outline:none;">
                    <div style="margin-top:8px; font-size:11px; font-weight:800; color:var(--lux-text-muted);">Used in weighted score.</div>
                </div>
                <div style="padding:12px; border-radius:14px; background:var(--lux-panel); border:1px solid var(--lux-border);">
                    <label for="weight-qa" style="display:block; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:var(--lux-text-muted);">Homework weight</label>
                    <input id="weight-qa" type="number" min="0" max="100" value="10" data-gradebook-weight="qa" style="width:100%; margin-top:6px; border:1px solid var(--lux-border); border-radius:10px; padding:10px 12px; background:var(--lux-panel); color:var(--lux-text); font-size:13px; font-weight:700; outline:none;">
                    <div style="margin-top:8px; font-size:11px; font-weight:800; color:var(--lux-text-muted);">Coursework balance.</div>
                </div>
                <div style="padding:12px; border-radius:14px; background:var(--lux-panel); border:1px solid var(--lux-border);">
                    <label for="weight-mid" style="display:block; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:var(--lux-text-muted);">Midterm weight</label>
                    <input id="weight-mid" type="number" min="0" max="100" value="30" data-gradebook-weight="mid" style="width:100%; margin-top:6px; border:1px solid var(--lux-border); border-radius:10px; padding:10px 12px; background:var(--lux-panel); color:var(--lux-text); font-size:13px; font-weight:700; outline:none;">
                    <div style="margin-top:8px; font-size:11px; font-weight:800; color:var(--lux-text-muted);">Midterm lane value.</div>
                </div>
                <div style="padding:12px; border-radius:14px; background:var(--lux-panel); border:1px solid var(--lux-border);">
                    <label for="weight-fin" style="display:block; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:var(--lux-text-muted);">Final weight</label>
                    <input id="weight-fin" type="number" min="0" max="100" value="50" data-gradebook-weight="fin" style="width:100%; margin-top:6px; border:1px solid var(--lux-border); border-radius:10px; padding:10px 12px; background:var(--lux-panel); color:var(--lux-text); font-size:13px; font-weight:700; outline:none;">
                    <div style="margin-top:8px; font-size:11px; font-weight:800; color:var(--lux-text-muted);" id="weight-total-warning">Total: 100%</div>
                </div>
            </div>

            <div id="gradebook-assessment-controls" style="margin-bottom:16px;"></div>

            <div style="display:grid; grid-template-columns:minmax(0, 1fr) 280px; gap:16px; align-items:start;">
                <div style="background:var(--lux-panel); border:1px solid var(--lux-border); border-radius:16px; overflow:hidden;">
                    <div style="overflow:auto; max-height:700px;">
                        <table id="gradebook-table" style="width:100%; border-collapse:collapse;">
                            <thead><tr></tr></thead>
                            <tbody id="gradebook-body"></tbody>
                        </table>
                    </div>
                </div>
                <aside style="position:sticky; top:20px; padding:16px; background:var(--lux-panel); border:1px solid var(--lux-border); border-radius:16px;">
                    <div style="font-size:13px; font-weight:800; color:var(--lux-accent); margin-bottom:8px;"><i class="fas fa-clock"></i> Audit Trail</div>
                    <div id="audit-logs" style="max-height:620px; overflow:auto; display:grid; gap:10px; font-size:12px; line-height:1.6; color:var(--lux-text);"><div style="padding:48px 24px; text-align:center; color:var(--lux-text-muted);"><i class="fas fa-pen-to-square" style="display:block; margin-bottom:12px; font-size:38px; opacity:0.35;"></i>No edits yet.</div></div>
                </aside>
            </div>
        </div>
    `;
}

function ensureGradebookSpreadsheetShell() {
    const mount = document.getElementById('lux-spreadsheet-view');
    if (!mount) return null;
    let shell = document.getElementById('gradebook-spreadsheet-view');
    if (shell) return shell;
    mount.innerHTML = getGradebookSpreadsheetShellMarkup();
    shell = document.getElementById('gradebook-spreadsheet-view');
    return shell;
}

function openGradebookSection(courseId, groupId, titleString = '') {
    currentGradebookSection = { courseId, groupId };
    document.getElementById('gradebook-roster-selection').style.display = 'none';
    const spreadsheetShell = ensureGradebookSpreadsheetShell();
    if (spreadsheetShell) spreadsheetShell.style.display = 'block';
    const subject = getDomain().subjectsById?.[courseId] || KIU_STATE.curriculum.find(item => item.id === courseId);
    const group = (KIU_STATE.availableGroups?.[courseId] || []).find(item => item.id === groupId) || {};
    document.getElementById('dynamic-gb-title').innerText = titleString || `${subject?.name || courseId} | ${group.name || groupId} | ${group.day || ''} ${group.time || ''}`;
    loadGroupStudents(groupId, courseId);
}

function previewGradebookStudentAccount(studentId, studentName = '') {
    if (![USER_ROLES.ADMIN, USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(getEffectiveUserRole())) {
        alert('Only staff can open student impersonation from gradebook.');
        return;
    }
    const targetUser = (KIU_STATE?.users || []).find(user => String(user?.id || '') === String(studentId)) || null;
    if (!targetUser?.id || String(targetUser.role || '') !== USER_ROLES.STUDENT) {
        alert('A real student account is required for student impersonation.');
        return;
    }
    try {
        currentUserRole = USER_ROLES.STUDENT;
        localStorage.setItem('currentUserRole', USER_ROLES.STUDENT);
        if (currentUser?.role && currentUser.role !== USER_ROLES.STUDENT) {
            sessionStorage.setItem(ACTIVE_ROLE_IMPERSONATION_KEY, '1');
        }
    } catch (e) {
        console.warn('Could not persist gradebook student impersonation.', e);
    }
    if (typeof setActiveSessionUser === 'function') {
        setActiveSessionUser(targetUser.id);
    }
    if ((targetUser.facultyCode || targetUser.faculty) && typeof localStorage !== 'undefined') {
        localStorage.setItem('currentFaculty', targetUser.facultyCode || targetUser.faculty);
    }
    if (typeof syncPortalBackendImpersonation === 'function') {
        syncPortalBackendImpersonation(USER_ROLES.STUDENT);
    }
    if (typeof resetRoleSwitchViewState === 'function') {
        resetRoleSwitchViewState();
    }
    if (currentGradebookSection?.courseId && currentGradebookSection?.groupId && typeof navigate === 'function') {
        const subject = getDomain().subjectsById?.[currentGradebookSection.courseId] || (KIU_STATE.curriculum || []).find(item => item.id === currentGradebookSection.courseId) || null;
        const group = (KIU_STATE.availableGroups?.[currentGradebookSection.courseId] || []).find(item => item.id === currentGradebookSection.groupId) || null;
        const courseKey = `${currentGradebookSection.courseId}::${currentGradebookSection.groupId}`;
        const title = [subject?.name || currentGradebookSection.courseId, group?.name || currentGradebookSection.groupId].filter(Boolean).join(' | ');
        const openLmsGradebookPreview = () => {
            navigate('lms');
            setTimeout(() => {
                openLMSCourse(courseKey, title);
                switchLMSTab('quiz');
            }, 180);
        };
        if (typeof openLMSCourse === 'function' && typeof switchLMSTab === 'function') {
            openLmsGradebookPreview();
            return;
        }
        if (typeof ensurePortalLmsRuntimeLoaded === 'function') {
            Promise.resolve(ensurePortalLmsRuntimeLoaded()).then((loaded) => {
                if (loaded && typeof openLMSCourse === 'function' && typeof switchLMSTab === 'function') {
                    openLmsGradebookPreview();
                    return;
                }
                navigate('profile');
            });
            return;
        }
    }
    if (typeof navigate === 'function') {
        navigate('profile');
    }
}

window.previewGradebookStudentAccount = previewGradebookStudentAccount;

function openGradebookForGroup(groupId, titleString) {
    document.getElementById('gradebook-roster-selection').style.display = 'none';
    const spreadsheetShell = ensureGradebookSpreadsheetShell();
    if (spreadsheetShell) spreadsheetShell.style.display = 'block';
    document.getElementById('dynamic-gb-title').innerText = titleString;
    loadGroupStudents(groupId);
}

function closeGradebookSpreadsheet() {
    const spreadsheetShell = document.getElementById('gradebook-spreadsheet-view');
    if (spreadsheetShell) spreadsheetShell.style.display = 'none';
    document.getElementById('gradebook-roster-selection').style.display = 'block';
    if (typeof renderGradebookRosterSelection === 'function') {
        renderGradebookRosterSelection();
    }
}

function getGradebookLetterBadgeClass(letter = '') {
    const normalized = String(letter || '').trim().toUpperCase();
    if (normalized.startsWith('A')) return 'grade-a';
    if (normalized.startsWith('B')) return 'grade-b';
    if (normalized.startsWith('C')) return 'grade-c';
    if (normalized.startsWith('D') || normalized.startsWith('E')) return 'grade-d';
    if (normalized === 'PENDING' || normalized === 'INCOMPLETE') return 'grade-pending';
    return 'grade-f';
}

function renderGradebookLetterBadge(letter = 'Pending', label = '') {
    const display = String(letter || 'Pending').trim();
    return `<span class="gb-letter-badge ${getGradebookLetterBadgeClass(display)}" title="${escapeHtml(label || display)}">${escapeHtml(display.length > 2 ? display : display.charAt(0) || display)}</span>`;
}

function getGradebookEntryStatus(record, meta, entry) {
    if (!entry) {
        return {
            key: 'missing',
            label: 'Not recorded',
            icon: 'fa-circle-minus'
        };
    }
    const pending = isAssessmentEntryPendingReview(record, meta.key, normalizeAssessmentNumber(entry.number, 1));
    if (pending) {
        return {
            key: 'pending',
            label: 'Pending review',
            icon: 'fa-hourglass-half'
        };
    }
    const hasScore = entry.score !== null && entry.score !== undefined && entry.score !== '';
    if (hasScore) {
        return {
            key: 'graded',
            label: 'Graded',
            icon: 'fa-circle-check'
        };
    }
    return {
        key: 'missing',
        label: 'Not recorded',
        icon: 'fa-circle-minus'
    };
}

function getGradebookModernSummary(record, weights) {
    const safeRecord = syncGradeRecordSummaries(ensureGradeRecordHistories(record || {}));
    const defs = getStudentEvaluationHistorySectionDefs(safeRecord)
        .filter(meta => ['quiz', 'oral-quiz', 'homework', 'midterm', 'final', 'retake'].includes(normalizeGradebookCriterion(meta.key)));
    const sections = defs.map(meta => {
        const entries = getDisplayAssessmentEntries(safeRecord, meta.key);
        const scoredEntries = entries.filter(entry => entry?.score !== null && entry?.score !== undefined && entry?.score !== '');
        const pendingEntries = entries.filter(entry => isAssessmentEntryPendingReview(safeRecord, meta.key, normalizeAssessmentNumber(entry.number, 1)));
        const latestEntry = entries.length ? entries[entries.length - 1] : null;
        const aggregate = getAssessmentDisplayValue(safeRecord, meta);
        return {
            meta,
            entries,
            scoredEntries,
            pendingEntries,
            latestEntry,
            aggregate,
            maxScore: Math.max(1, Number(meta.maxScore || 100))
        };
    });
    const outcome = getGradebookVisibleOutcome(safeRecord, weights);
    const completedCount = sections.reduce((sum, section) => sum + section.scoredEntries.length, 0);
    const pendingCount = sections.reduce((sum, section) => sum + section.pendingEntries.length, 0);
    const totalEntries = sections.reduce((sum, section) => sum + section.entries.length, 0);
    const missingCore = sections.filter(section => !section.entries.length).length;
    return {
        record: safeRecord,
        sections,
        outcome,
        completedCount,
        pendingCount,
        totalEntries,
        missingCore,
        progressPercent: Math.max(0, Math.min(100, Number(outcome.scoreLabel) || 0))
    };
}

function getGradebookWeightRows(weights = {}) {
    return [
        { key: 'q1', label: 'Quiz', value: Number(weights.q1 || 0), color: '#38bdf8' },
        { key: 'qa', label: 'Homework', value: Number(weights.qa || 0), color: '#22c55e' },
        { key: 'mid', label: 'Midterm', value: Number(weights.mid || 0), color: '#f59e0b' },
        { key: 'fin', label: 'Final / Retake', value: Number(weights.fin || 0), color: '#ef4444' }
    ];
}

function getGradebookWeightedContributionRows(summary, weights = {}) {
    const sectionByKey = new Map((summary?.sections || []).map(section => [normalizeGradebookCriterion(section.meta.key), section]));
    const map = [
        { weightKey: 'q1', sectionKey: 'quiz', label: 'Quiz', color: '#38bdf8' },
        { weightKey: 'qa', sectionKey: 'homework', label: 'Homework', color: '#22c55e' },
        { weightKey: 'mid', sectionKey: 'midterm', label: 'Midterm', color: '#f59e0b' },
        { weightKey: 'fin', sectionKey: 'final', altSectionKey: 'retake', label: 'Final / Retake', color: '#ef4444' }
    ];
    return map.map(item => {
        const weightPoints = Math.max(0, Number(weights?.[item.weightKey] || 0) * 100);
        const primary = sectionByKey.get(item.sectionKey);
        const alternate = item.altSectionKey ? sectionByKey.get(item.altSectionKey) : null;
        const chosen = alternate && Number(alternate.aggregate || 0) > Number(primary?.aggregate || 0) ? alternate : primary;
        const maxScore = Math.max(1, Number(chosen?.maxScore || chosen?.meta?.maxScore || 100));
        const aggregate = Math.max(0, Number(chosen?.aggregate || 0));
        const earned = Math.max(0, Math.min(weightPoints, (aggregate / maxScore) * weightPoints));
        const pendingCount = Number((primary?.pendingEntries || []).length + (alternate?.pendingEntries || []).length);
        const hasAnyEntry = Boolean((primary?.entries || []).length || (alternate?.entries || []).length);
        const pending = pendingCount > 0 ? Math.max(0, Math.min(weightPoints - earned, weightPoints * 0.35)) : 0;
        const remaining = Math.max(0, weightPoints - earned - pending);
        return {
            ...item,
            weightPoints,
            earned,
            pending,
            remaining,
            aggregate,
            maxScore,
            pendingCount,
            hasAnyEntry
        };
    });
}

function renderGradebookModernWeights(weights = {}, summary = null) {
    const rows = getGradebookWeightRows(weights);
    const total = rows.reduce((sum, row) => sum + row.value, 0);
    const contributionRows = summary ? getGradebookWeightedContributionRows(summary, weights) : [];
    const totalEarned = contributionRows.reduce((sum, row) => sum + row.earned, 0);
    const totalPending = contributionRows.reduce((sum, row) => sum + row.pending, 0);
    const totalRemaining = contributionRows.reduce((sum, row) => sum + row.remaining, 0);
    return `
        <div class="gb-modern-card gb-weight-card">
            <div class="gb-modern-card-head">
                <div>
                    <div class="gb-modern-kicker">Weight Profile</div>
                    <h3>Earned vs possible grade weight</h3>
                    <p>Shows how much of the final 100% is already earned, pending staff review, or still not recorded.</p>
                </div>
                <span class="gb-status-badge ${Math.round(total * 100) === 100 ? 'is-graded' : 'is-pending'}">${Math.round(total * 100)}%</span>
            </div>
            ${summary ? `
                <div class="gb-composition-bar" title="Earned ${Math.round(totalEarned)}%, pending ${Math.round(totalPending)}%, remaining ${Math.round(totalRemaining)}%">
                    <span class="is-earned" style="width:${Math.max(0, Math.min(100, totalEarned))}%;"></span>
                    <span class="is-pending" style="width:${Math.max(0, Math.min(100, totalPending))}%;"></span>
                    <span class="is-remaining" style="width:${Math.max(0, Math.min(100, totalRemaining))}%;"></span>
                </div>
                <div class="gb-composition-legend">
                    <span><i class="is-earned"></i> Earned ${Math.round(totalEarned)}%</span>
                    <span><i class="is-pending"></i> Pending ${Math.round(totalPending)}%</span>
                    <span><i class="is-remaining"></i> Remaining ${Math.round(totalRemaining)}%</span>
                </div>
            ` : ''}
            <div class="gb-weight-stack">
                ${(summary ? contributionRows : rows.map(row => ({ ...row, weightPoints: row.value * 100, earned: 0, pending: 0, remaining: row.value * 100, pendingCount: 0 }))).map(row => `
                    <div class="gb-weight-row">
                        <div class="gb-weight-label">
                            <strong>${escapeHtml(row.label)}</strong>
                            <span>${Math.round(row.weightPoints)}% weight</span>
                        </div>
                        <div class="gb-weight-detail">
                            <span>Earned ${row.earned.toFixed(1)}%</span>
                            <span>Pending ${row.pending.toFixed(1)}%</span>
                            <span>Remaining ${row.remaining.toFixed(1)}%</span>
                        </div>
                        <div class="gb-weight-track is-stacked">
                            <span class="is-earned" style="width:${row.weightPoints ? Math.max(0, Math.min(100, (row.earned / row.weightPoints) * 100)) : 0}%; background:${row.color};"></span>
                            <span class="is-pending" style="width:${row.weightPoints ? Math.max(0, Math.min(100, (row.pending / row.weightPoints) * 100)) : 0}%;"></span>
                            <span class="is-remaining" style="width:${row.weightPoints ? Math.max(0, Math.min(100, (row.remaining / row.weightPoints) * 100)) : 0}%;"></span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderGradebookModernTranscript(summary) {
    const rows = summary.sections.map(section => {
        const meta = section.meta;
        const latestDisplay = section.latestEntry ? getAssessmentEntryDisplayContext(meta.key, section.latestEntry) : null;
        const status = getGradebookEntryStatus(summary.record, meta, section.latestEntry);
        const scoreLabel = section.latestEntry && status.key !== 'pending' && section.latestEntry.score !== null && section.latestEntry.score !== undefined && section.latestEntry.score !== ''
            ? String(section.aggregate)
            : (status.key === 'pending' ? 'Pending' : '-');
        const maxLabel = meta.maxScore ? `/${meta.maxScore}` : '';
        return `
            <tr class="gb-transcript-row" data-gradebook-click="open-history" data-gradebook-student-id="${escapeHtml(String(summary.record.id))}" data-gradebook-student-name="${escapeHtml(String(summary.record.name || ''))}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-force-view-only="true">
                <td>
                    <div class="gb-subject-cell">
                        <strong>${escapeHtml(meta.pluralLabel || meta.label)}</strong>
                        <span>${latestDisplay ? escapeHtml(latestDisplay.title) : 'No assessment recorded yet'}</span>
                    </div>
                </td>
                <td>${escapeHtml(section.scoredEntries.length ? `${section.scoredEntries.length} graded` : 'No graded items')}</td>
                <td>${escapeHtml(section.pendingEntries.length ? `${section.pendingEntries.length} pending` : '0 pending')}</td>
                <td><strong>${escapeHtml(scoreLabel)}${status.key === 'graded' ? escapeHtml(maxLabel) : ''}</strong></td>
                <td><span class="gb-status-badge is-${escapeHtml(status.key)}"><i class="fas ${escapeHtml(status.icon)}"></i> ${escapeHtml(status.label)}</span></td>
                <td>
                    <button type="button" class="gb-modern-action" data-gradebook-click="open-history" data-gradebook-student-id="${escapeHtml(String(summary.record.id))}" data-gradebook-student-name="${escapeHtml(String(summary.record.name || ''))}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-force-view-only="true">
                        <i class="fas fa-chevron-down"></i> Details
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    return `
        <div class="gb-modern-card gb-transcript-card">
            <div class="gb-modern-card-head">
                <div>
                    <div class="gb-modern-kicker">Student Card</div>
                    <h3>Assessment Transcript</h3>
                    <p>Every LMS quiz, manual classroom score, exam, and retake is grouped by assessment type.</p>
                </div>
                <button type="button" class="gb-modern-action is-primary" data-gradebook-click="open-history" data-gradebook-student-id="${escapeHtml(String(summary.record.id))}" data-gradebook-student-name="${escapeHtml(String(summary.record.name || ''))}" data-gradebook-force-view-only="true">
                    <i class="fas fa-list"></i> Full history
                </button>
            </div>
            <div class="gb-transcript-shell">
                <table class="gb-transcript-table">
                    <thead>
                        <tr>
                            <th>Assessment</th>
                            <th>Graded</th>
                            <th>Pending</th>
                            <th>Score</th>
                            <th>Status</th>
                            <th>Detailed</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows || `<tr><td colspan="6"><div class="gb-empty-state">No grade categories are available for this group yet.</div></td></tr>`}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderGradebookModernTimeline(summary) {
    const events = summary.sections.flatMap(section => section.entries.map(entry => ({
        section,
        entry,
        display: getAssessmentEntryDisplayContext(section.meta.key, entry),
        status: getGradebookEntryStatus(summary.record, section.meta, entry)
    }))).sort((a, b) => {
        const left = new Date(a.entry.updatedAt || 0).getTime() || 0;
        const right = new Date(b.entry.updatedAt || 0).getTime() || 0;
        return right - left;
    });
    if (!events.length) {
        return `
            <div class="gb-modern-card">
                <div class="gb-empty-state">
                    <i class="fas fa-clock"></i>
                    <strong>No assessment activity yet</strong>
                    <span>Submitted quizzes, manual grades, exams, and retakes will appear here after staff records them.</span>
                </div>
            </div>
        `;
    }
    return `
        <div class="gb-modern-card">
            <div class="gb-modern-card-head">
                <div>
                    <div class="gb-modern-kicker">Timeline</div>
                    <h3>Recent assessment activity</h3>
                    <p>Pending work is tracked separately from failed or zero scores.</p>
                </div>
            </div>
            <div class="gb-timeline">
                ${events.map(item => `
                    <div class="gb-timeline-item is-${escapeHtml(item.status.key)}">
                        <div class="gb-timeline-dot"><i class="fas ${escapeHtml(item.status.icon)}"></i></div>
                        <div class="gb-timeline-body">
                            <div class="gb-timeline-title">
                                <strong>${escapeHtml(item.display.title)}</strong>
                                <span class="gb-status-badge is-${escapeHtml(item.status.key)}">${escapeHtml(item.status.label)}</span>
                            </div>
                            <div class="gb-timeline-meta">${escapeHtml(item.section.meta.label)}${item.display.subtitle ? ` - ${escapeHtml(item.display.subtitle)}` : ''}</div>
                            <div class="gb-timeline-meta">${escapeHtml(formatAssessmentHistoryTimestamp(item.entry.updatedAt))}${item.entry.updatedBy ? ` - ${escapeHtml(item.entry.updatedBy)}` : ''}</div>
                            ${item.entry.note ? `<div class="gb-timeline-note">${escapeHtml(item.entry.note)}</div>` : ''}
                        </div>
                        <div class="gb-timeline-score">${item.status.key === 'pending' ? 'Pending' : (item.entry.score === null || item.entry.score === undefined ? '-' : Number(item.entry.score))}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderStudentGradebookWorkspace(record, weights) {
    const safeRecord = syncGradeRecordSummaries(ensureGradeRecordHistories(record || {}));
    const summary = getGradebookModernSummary(safeRecord, weights);
    return `
        <div class="gb-modern-workspace">
            <div class="gb-modern-hero">
                <div class="gb-modern-hero-main">
                    <div>
                        <div class="gb-modern-kicker">Grades</div>
                        <h2>${escapeHtml(safeRecord.name || 'Student Gradebook')}</h2>
                        <p>Transcript-style view of quizzes, homework, exams, retakes, pending reviews, and final grade prediction.</p>
                    </div>
                    <div class="gb-score-orbit" style="--gb-progress:${summary.progressPercent * 3.6}deg;">
                        <div>
                            <strong>${escapeHtml(summary.outcome.scoreLabel)}</strong>
                            <span>${escapeHtml(summary.outcome.letterLabel)}</span>
                        </div>
                    </div>
                </div>
                <div class="gb-modern-stats">
                    <div><span>Completed</span><strong>${summary.completedCount}</strong></div>
                    <div><span>Pending Review</span><strong>${summary.pendingCount}</strong></div>
                    <div><span>Missing Categories</span><strong>${summary.missingCore}</strong></div>
                    <div><span>Letter</span>${renderGradebookLetterBadge(summary.outcome.letterLabel, summary.outcome.letterLabel)}</div>
                </div>
            </div>
            <div class="gb-modern-grid">
                ${renderGradebookModernWeights(weights, summary)}
                <div class="gb-modern-card">
                    <div class="gb-modern-card-head">
                        <div>
                            <div class="gb-modern-kicker">Explanation</div>
                            <h3>What affects the final grade</h3>
                        </div>
                    </div>
                    <div class="gb-explain-list">
                        <div><i class="fas fa-circle-check"></i><span>Only graded items affect the visible score.</span></div>
                        <div><i class="fas fa-hourglass-half"></i><span>Pending reviews are not treated as zero or failed.</span></div>
                        <div><i class="fas fa-repeat"></i><span>Retake can replace the final exam when it is higher.</span></div>
                    </div>
                </div>
            </div>
            ${renderGradebookModernTranscript(summary)}
            ${renderGradebookModernTimeline(summary)}
        </div>
    `;
}

function getGradebookStaffAnalytics(students = mockStudents, weights = getGradebookWeightProfileForRoster(currentRosterId), criterionMeta = getGradebookCriterionMeta(currentGradebookCriterion), assessmentNumber = currentGradebookAssessmentNumber) {
    const roster = (students || []).map(student => syncGradeRecordSummaries(ensureGradeRecordHistories(student)));
    const outcomes = roster.map(record => ({
        record,
        outcome: getGradebookVisibleOutcome(record, weights),
        pending: isAssessmentEntryPendingReview(record, criterionMeta.key, assessmentNumber)
    }));
    const numericScores = outcomes.map(item => Number(item.outcome.scoreLabel)).filter(Number.isFinite);
    const average = numericScores.length ? Math.round(numericScores.reduce((sum, score) => sum + score, 0) / numericScores.length) : 0;
    return {
        total: roster.length,
        average,
        highest: numericScores.length ? Math.max(...numericScores) : 0,
        lowest: numericScores.length ? Math.min(...numericScores) : 0,
        pendingCount: outcomes.filter(item => item.pending).length,
        riskCount: outcomes.filter(item => Number(item.outcome.scoreLabel) < 51).length,
        gradeDistribution: outcomes.reduce((acc, item) => {
            const key = String(item.outcome.letterStored || item.outcome.letterLabel || 'F').charAt(0).toUpperCase() || 'F';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {})
    };
}

function renderGradebookStaffOverview(weights, criterionMeta, assessmentNumber, selectedQuizDisplay = null) {
    const analytics = getGradebookStaffAnalytics(mockStudents, weights, criterionMeta, assessmentNumber);
    const canFinalize = getEffectiveUserRole() === USER_ROLES.PROFESSOR || getEffectiveUserRole() === USER_ROLES.ADMIN;
    return `
        <div class="gb-staff-workspace">
            <div class="gb-staff-hero">
                <div>
                    <div class="gb-modern-kicker">TA / Professor Gradebook</div>
                    <h2>${escapeHtml(criterionMeta.label)} ${escapeHtml(String(assessmentNumber))}</h2>
                    <p>Review pending submissions, edit scores with history, and monitor class performance before publishing grades.</p>
                </div>
                <div class="gb-staff-actions">
                    <button type="button" data-gradebook-click="pending-queue"><i class="fas fa-list-check"></i> Review pending</button>
                    <button type="button" data-gradebook-click="export-csv"><i class="fas fa-file-export"></i> Export</button>
                    <button type="button" ${canFinalize ? '' : 'disabled'} data-gradebook-click="publish"><i class="fas fa-bullhorn"></i> Publish</button>
                    <button type="button" ${canFinalize ? '' : 'disabled'} data-gradebook-click="finalize"><i class="fas fa-lock"></i> Finalize</button>
                </div>
            </div>
            <div class="gb-staff-stat-grid">
                <div><span>Students</span><strong>${analytics.total}</strong></div>
                <div><span>Class Average</span><strong>${analytics.average}</strong></div>
                <div><span>Pending Review</span><strong>${analytics.pendingCount}</strong></div>
                <div><span>Fail Risk</span><strong>${analytics.riskCount}</strong></div>
                <div><span>High / Low</span><strong>${analytics.highest} / ${analytics.lowest}</strong></div>
            </div>
            ${selectedQuizDisplay ? `
                <div class="gb-staff-linked-quiz">
                    <div>
                        <div class="gb-modern-kicker">Linked LMS Assessment</div>
                        <strong>${escapeHtml(selectedQuizDisplay.title)}</strong>
                        ${selectedQuizDisplay.subtitle ? `<span>${escapeHtml(selectedQuizDisplay.subtitle)}</span>` : ''}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

function openGradebookPendingQueue() {
    const criterionMeta = getGradebookCriterionMeta(currentGradebookCriterion);
    const assessmentNumber = normalizeAssessmentNumber(currentGradebookAssessmentNumber, 1);
    const pending = (mockStudents || [])
        .map(student => ensureGradeRecordHistories(student))
        .filter(student => isAssessmentEntryPendingReview(student, criterionMeta.key, assessmentNumber));
    if (!pending.length) {
        alert('No pending manual reviews for the selected assessment.');
        return;
    }
    const first = pending[0];
    openStudentEvaluationHistoryModal(first.id, first.name || '', criterionMeta.key);
}

function exportGradebookCsv() {
    const weights = getGradebookWeightProfileForRoster(currentRosterId);
    const rows = [['Student ID', 'Student Name', 'Score', 'Letter', 'Quiz', 'Homework', 'Midterm', 'Final', 'Retake']];
    (mockStudents || []).map(student => syncGradeRecordSummaries(ensureGradeRecordHistories(student))).forEach(record => {
        const outcome = getGradebookVisibleOutcome(record, weights);
        rows.push([
            record.id || '',
            record.name || '',
            outcome.scoreLabel,
            outcome.letterLabel,
            getAssessmentDisplayValue(record, GRADEBOOK_CRITERIA.quiz),
            getAssessmentDisplayValue(record, GRADEBOOK_CRITERIA.homework),
            getAssessmentDisplayValue(record, GRADEBOOK_CRITERIA.midterm),
            getAssessmentDisplayValue(record, GRADEBOOK_CRITERIA.final),
            getAssessmentDisplayValue(record, GRADEBOOK_CRITERIA.retake)
        ]);
    });
    const csv = rows.map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gradebook-${currentRosterId || 'group'}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function markGradebookSectionPublished() {
    if (![USER_ROLES.PROFESSOR, USER_ROLES.ADMIN].includes(getEffectiveUserRole())) {
        alert('Only professor or admin can publish grades.');
        return;
    }
    KIU_STATE.gradebookPublications = KIU_STATE.gradebookPublications || {};
    const key = `${currentRosterId}::${normalizeGradebookCriterion(currentGradebookCriterion)}::${normalizeAssessmentNumber(currentGradebookAssessmentNumber, 1)}`;
    KIU_STATE.gradebookPublications[key] = {
        status: 'published',
        updatedAt: new Date().toISOString(),
        updatedBy: getSimulatedUserName()
    };
    saveState();
    alert('Selected assessment published.');
}

function markGradebookSectionFinalized() {
    if (![USER_ROLES.PROFESSOR, USER_ROLES.ADMIN].includes(getEffectiveUserRole())) {
        alert('Only professor or admin can finalize grades.');
        return;
    }
    KIU_STATE.gradebookPublications = KIU_STATE.gradebookPublications || {};
    const key = `${currentRosterId}::${normalizeGradebookCriterion(currentGradebookCriterion)}::${normalizeAssessmentNumber(currentGradebookAssessmentNumber, 1)}`;
    KIU_STATE.gradebookPublications[key] = {
        status: 'finalized',
        updatedAt: new Date().toISOString(),
        updatedBy: getSimulatedUserName()
    };
    saveState();
    alert('Selected assessment finalized.');
}

window.openGradebookPendingQueue = openGradebookPendingQueue;
window.exportGradebookCsv = exportGradebookCsv;
window.markGradebookSectionPublished = markGradebookSectionPublished;
window.markGradebookSectionFinalized = markGradebookSectionFinalized;

function initGradebook() {
    mockStudents = Array.isArray(mockStudents)
        ? mockStudents.map(student => ensureGradeRecordHistories(student))
        : [];
    const tbody = document.getElementById('gradebook-body');
    if (!tbody) return;
    const effectiveRole = getEffectiveUserRole();
    const readOnly = ![USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(effectiveRole);
    const currentWeights = getGradebookWeightProfileForRoster(currentRosterId);
    [
        ['weight-q1', currentWeights.q1],
        ['weight-qa', currentWeights.qa],
        ['weight-mid', currentWeights.mid],
        ['weight-fin', currentWeights.fin]
    ].forEach(([id, value]) => {
        const input = document.getElementById(id);
        if (input) input.value = String(Math.round(Number(value || 0) * 100));
    });
    const currentCriterionMeta = getGradebookCriterionMeta(currentGradebookCriterion);
    const assessmentNumber = normalizeAssessmentNumber(currentGradebookAssessmentNumber, 1);
    const pendingReviewStudents = mockStudents.filter(student => isAssessmentEntryPendingReview(student, currentCriterionMeta.key, assessmentNumber));
    const sampleLinkedEntry = mockStudents
        .map(student => getDisplayAssessmentEntryForNumber(student, currentCriterionMeta.key, assessmentNumber) || getAssessmentEntryForNumber(student, currentCriterionMeta.key, assessmentNumber))
        .find(entry => resolveLmsQuizSourceFromAssessmentEntry(entry));
    const selectedQuizDisplay = sampleLinkedEntry ? getAssessmentEntryDisplayContext(currentCriterionMeta.key, sampleLinkedEntry) : null;
    const theadRow = document.querySelector('#gradebook-table thead tr');
    const controlsRoot = document.getElementById('gradebook-assessment-controls');
    const studentViewRoot = document.getElementById('gradebook-student-view');
    const table = document.getElementById('gradebook-table');

    if (effectiveRole === USER_ROLES.STUDENT) {
        const currentUserId = String(getCurrentUserId() || '');
        const record = mockStudents.find(student => String(student?.id || '') === currentUserId) || {
            id: currentUserId,
            name: getCurrentUser()?.name || getCurrentUser()?.nameEn || 'Student'
        };
        if (controlsRoot) {
            controlsRoot.innerHTML = `
                <div class="gb-student-context-bar">
                    <div>
                        <div class="gb-modern-kicker">Official LMS Record</div>
                        <strong>Read-only student grade view</strong>
                        <span>Scores are synchronized with quizzes, exams, manual classroom assessments, and the Study Card record.</span>
                    </div>
                    <div class="gb-context-actions">
                        <span class="gb-status-badge is-graded"><i class="fas fa-lock"></i> Student view</span>
                        <span class="gb-status-badge is-missing"><i class="fas fa-users"></i> Group record</span>
                    </div>
                </div>
            `;
        }
        if (studentViewRoot) {
            studentViewRoot.style.display = 'block';
            studentViewRoot.innerHTML = localizeHtmlMarkup(renderStudentGradebookWorkspace(record, currentWeights));
        }
        if (table) table.style.display = 'none';
        if (theadRow) theadRow.innerHTML = '';
        tbody.innerHTML = '';
        return;
    }

    if (studentViewRoot) {
        studentViewRoot.innerHTML = '';
        studentViewRoot.style.display = 'none';
    }
    if (table) table.style.display = '';

    if (controlsRoot) {
        controlsRoot.innerHTML = `
            ${renderGradebookStaffOverview(currentWeights, currentCriterionMeta, assessmentNumber, selectedQuizDisplay)}
            <div class="gb-staff-control-card">
                <div class="gb-staff-control-grid">
                    <label>Assessment criterion
                        <select id="gradebook-criterion-select" data-gradebook-assessment-target="criterion">
                            ${Object.values(GRADEBOOK_CRITERIA).map(meta => `<option value="${meta.key}" ${meta.key === currentCriterionMeta.key ? 'selected' : ''}>${meta.label}</option>`).join('')}
                        </select>
                    </label>
                    <label>Assessment number
                        <input id="gradebook-assessment-number" type="number" min="1" value="${assessmentNumber}" data-gradebook-assessment-target="number">
                    </label>
                    <div class="gb-staff-control-copy">
                        Choose the exact assessment being reviewed. Pending rows identify submitted written answers and exams that need TA/professor action.
                    </div>
                </div>
                <div class="gb-staff-weight-panel">
                    ${getGradebookWeightControlsMarkup(currentWeights, false)}
                    ${selectedQuizDisplay ? `
                    <div class="gb-staff-linked-small is-${pendingReviewStudents.length ? 'pending' : 'ready'}">
                        <div class="gb-modern-kicker">Selected LMS Quiz</div>
                        <strong>${escapeHtml(selectedQuizDisplay.title)}</strong>
                        ${selectedQuizDisplay.subtitle ? `<div class="lms-route-meta" style="font-size:11px; margin-top:4px;">${escapeHtml(selectedQuizDisplay.subtitle)}</div>` : ''}
                        ${pendingReviewStudents.length
                            ? `<span class="gb-status-badge is-pending"><i class="fas fa-triangle-exclamation"></i> ${pendingReviewStudents.length} need manual evaluation</span>`
                            : `<span class="gb-status-badge is-graded"><i class="fas fa-circle-check"></i> No pending manual evaluation</span>`}
                    </div>
                ` : ''}
                </div>
            </div>
        `;
    }

    if (theadRow) {
        theadRow.innerHTML = `
            <th style="text-align:left;">Student ID</th>
            <th style="text-align:left;">Student Name</th>
            <th>Overall Score</th>
            <th>Letter Grade</th>
            <th>Quiz Status</th>
            <th style="text-align:left;">History</th>
        `;
    }

    let html = '';
    mockStudents.forEach((st, i) => {
        const record = ensureGradeRecordHistories(st);
        const currentEntry = getDisplayAssessmentEntryForNumber(record, currentCriterionMeta.key, assessmentNumber)
            || getAssessmentEntryForNumber(record, currentCriterionMeta.key, assessmentNumber);
        const pendingReview = isAssessmentEntryPendingReview(record, currentCriterionMeta.key, assessmentNumber);
        const currentLinkedQuizSource = currentEntry ? resolveLmsQuizSourceFromAssessmentEntry(currentEntry) : null;
        const currentSubmission = currentLinkedQuizSource ? getLmsQuizSubmission(currentLinkedQuizSource.resourceKey, currentLinkedQuizSource.quizId, record.id) : null;
        const quizStatusMarkup = !currentLinkedQuizSource
            ? '<span style="display:inline-flex; align-items:center; gap:6px; padding:5px 9px; border-radius:999px; background:#f8fafc; color:#64748b; font-size:10px; font-weight:800;">No linked quiz</span>'
            : pendingReview || currentSubmission?.status === 'submitted' || currentSubmission?.status === 'auto-submitted'
                ? '<span style="display:inline-flex; align-items:center; gap:6px; padding:5px 9px; border-radius:999px; background:#fff7ed; color:#c2410c; font-size:10px; font-weight:800;"><i class="fas fa-triangle-exclamation"></i> Waiting for evaluation</span>'
                : currentSubmission?.status === 'graded'
                    ? `<span style="display:inline-flex; align-items:center; gap:6px; padding:5px 9px; border-radius:999px; background:${currentSubmission.requiresManualReview ? '#ecfdf5' : '#eff6ff'}; color:${currentSubmission.requiresManualReview ? '#047857' : '#1d4ed8'}; font-size:10px; font-weight:800;"><i class="fas ${currentSubmission.requiresManualReview ? 'fa-user-check' : 'fa-bolt'}"></i> ${currentSubmission.requiresManualReview ? 'Reviewed' : 'Auto graded'}</span>`
                    : currentSubmission?.status === 'in-progress'
                        ? '<span style="display:inline-flex; align-items:center; gap:6px; padding:5px 9px; border-radius:999px; background:#eff6ff; color:#1d4ed8; font-size:10px; font-weight:800;"><i class="fas fa-hourglass-start"></i> In progress</span>'
                        : '<span style="display:inline-flex; align-items:center; gap:6px; padding:5px 9px; border-radius:999px; background:#f8fafc; color:#475569; font-size:10px; font-weight:800;"><i class="fas fa-circle-dot"></i> Published</span>';
        const currentEntryDisplay = currentEntry ? getAssessmentEntryDisplayContext(currentCriterionMeta.key, currentEntry) : null;
        html += `
            <tr data-idx="${i}">
                <td style="text-align:left;">${record.id}</td>
                <td style="text-align:left; font-weight:bold;">
                    <div style="display:grid; gap:8px;">
                        <div>${escapeHtml(record.name)}</div>
                        <div style="display:flex; gap:8px; flex-wrap:wrap;">
                            <button type="button" class="kiu-btn-outline" style="width:max-content; padding:6px 10px; font-size:11px; font-weight:800;" data-gradebook-click="open-history" data-gradebook-student-id="${escapeHtml(String(record.id))}" data-gradebook-student-name="${escapeHtml(String(record.name || ''))}">
                                <i class="fas fa-clock"></i> View all history
                            </button>
                            <button type="button" class="kiu-btn-outline" style="width:max-content; padding:6px 10px; font-size:11px; font-weight:800;" data-gradebook-click="preview-student" data-gradebook-student-id="${escapeHtml(String(record.id))}" data-gradebook-student-name="${escapeHtml(String(record.name || ''))}">
                                <i class="fas fa-user-graduate"></i> Student Portal
                            </button>
                        </div>
                    </div>
                </td>
                <td id="pred-${i}" style="font-weight:bold;">-</td>
                <td id="letter-${i}" style="font-weight:bold; font-size: 14px;">-</td>
                <td style="text-align:center;">${quizStatusMarkup}</td>
                <td id="history-${i}" style="text-align:left; line-height:1.6;">
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        <div>${renderAssessmentHistoryChips(record, currentCriterionMeta.key)}</div>
                        ${currentEntryDisplay?.linked ? `<div style="display:grid; gap:4px; padding:10px 12px; border-radius:12px; background:#f8fbff; border:1px solid ${pendingReview ? '#fdba74' : '#dbe7f5'};"><div style="font-size:11px; font-weight:900; color:var(--kiu-navy);">${escapeHtml(currentEntryDisplay.title)}</div>${currentEntryDisplay.subtitle ? `<div style="font-size:10px; color:#64748b;">${escapeHtml(currentEntryDisplay.subtitle)}</div>` : ''}${pendingReview ? `<div style="display:inline-flex; align-items:center; gap:6px; width:max-content; padding:4px 8px; border-radius:999px; background:#fff7ed; color:#c2410c; font-size:10px; font-weight:800;"><i class="fas fa-triangle-exclamation"></i> Manual answer still waiting</div>` : ''}</div>` : ''}
                    </div>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = localizeHtmlMarkup(html);
    calculateFinalGrades();
}

function setGradebookAssessmentTarget(criterion, number) {
    currentGradebookCriterion = normalizeGradebookCriterion(criterion);
    currentGradebookAssessmentNumber = normalizeAssessmentNumber(number, 1);
    initGradebook();
}

function updateGrade(idx, val) {
    if (![USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(getEffectiveUserRole())) return;
    const criterion = normalizeGradebookCriterion(currentGradebookCriterion);
    const criterionMeta = getGradebookCriterionMeta(criterion);
    const assessmentNumber = normalizeAssessmentNumber(currentGradebookAssessmentNumber, 1);
    const existingRecord = ensureGradeRecordHistories(mockStudents[idx]);
    const oldVal = getAssessmentScoreForNumber(existingRecord, criterion, assessmentNumber);
    mockStudents[idx] = setAssessmentScoreOnRecord(existingRecord, criterion, assessmentNumber, val, {
        updatedBy: getSimulatedUserName()
    });

    // Add Audit Log
    const logs = document.getElementById('audit-logs');
    if (logs) {
        if(logs.innerText.includes('No edits')) logs.innerHTML = '';
        const date = new Date();
        const time = date.getHours() + ':' + ('0'+date.getMinutes()).slice(-2);
        logs.innerHTML = `<div style="color:var(--kiu-text-main);"><em>${time}</em> - ${escapeHtml(getSimulatedUserName())} updated ID ${mockStudents[idx].id} <strong>${criterionMeta.label} ${assessmentNumber}</strong> from ${oldVal} to ${Number(val || 0)}.</div>` + logs.innerHTML;
    }

    KIU_STATE.studentGrades[currentRosterId] = mockStudents.map(student => ensureGradeRecordHistories(student));
    saveState();
    calculateFinalGrades();
}

function calculateFinalGrades() {
    const weights = getGradebookWeightProfileForRoster(currentRosterId);
    const wQ1 = Number(weights.q1 || 0);
    const wQa = Number(weights.qa || 0);
    const wMid = Number(weights.mid || 0);
    const wFin = Number(weights.fin || 0);
    const toWeightedPercentPoints = (meta, value, weightFraction) => {
        const numericValue = Number(value || 0);
        const maxScore = Math.max(1, Number(meta?.maxScore || 100));
        return Math.max(0, Math.min(1, numericValue / maxScore)) * (weightFraction * 100);
    };
    const quizMeta = getGradebookCriterionMeta(GRADEBOOK_CRITERIA.quiz.key);
    const homeworkMeta = getGradebookCriterionMeta(GRADEBOOK_CRITERIA.homework.key);
    const midtermMeta = getGradebookCriterionMeta(GRADEBOOK_CRITERIA.midterm.key);
    const finalMeta = getGradebookCriterionMeta(GRADEBOOK_CRITERIA.final.key);

    const totalW = wQ1 + wQa + wMid + wFin;
    const warn = document.getElementById('weight-total-warning');
    if (warn) {
        warn.innerText = `Total: ${Math.round(totalW * 100)}%`;
        if (Math.round(totalW * 100) !== 100) {
            warn.style.color = "var(--kiu-red)";
        } else {
            warn.style.color = "var(--kiu-text-muted)";
        }
    }

    mockStudents.forEach((st, i) => {
        const predCell = document.getElementById(`pred-${i}`);
        const letterCell = document.getElementById(`letter-${i}`);
        if (!predCell) return;

        // Check for exceptions in any field
        const fields = ['q1', 'qa', 'mid', 'final'];
        let exception = null;
        fields.forEach(f => {
            if (['I', 'M', 'W'].includes(st[f])) exception = st[f];
        });

        if (exception) {
            predCell.innerHTML = `<span class="gb-score-mid">${exception}</span>`;
            const excLabel = exception === "I" ? "Incomplete" : (exception === "M" ? "Medical" : "Withdrawn");
            letterCell.innerHTML = `<span class="gb-letter-badge grade-c">${excLabel.charAt(0)}</span>`;
            letterCell.style.color = "";
            return;
        }
        const synced = syncGradeRecordSummaries(st);
        const effectiveExamScore = getGradebookEffectiveExamScore(synced);
        const score = toWeightedPercentPoints(quizMeta, getAssessmentDisplayValue(synced, GRADEBOOK_CRITERIA.quiz), wQ1)
            + toWeightedPercentPoints(homeworkMeta, getAssessmentDisplayValue(synced, GRADEBOOK_CRITERIA.homework), wQa)
            + toWeightedPercentPoints(midtermMeta, getAssessmentDisplayValue(synced, GRADEBOOK_CRITERIA.midterm), wMid)
            + toWeightedPercentPoints(finalMeta, effectiveExamScore, wFin);
        
        let safeScore = Math.max(0, Math.min(100, Math.round(score)));
        
        // Calculate max potential if final is maxed
        // Suppose the final is untouched (0), what would be the score if final was 100?
        let maxPotential = toWeightedPercentPoints(quizMeta, getAssessmentDisplayValue(synced, GRADEBOOK_CRITERIA.quiz), wQ1)
            + toWeightedPercentPoints(homeworkMeta, getAssessmentDisplayValue(synced, GRADEBOOK_CRITERIA.homework), wQa)
            + toWeightedPercentPoints(midtermMeta, getAssessmentDisplayValue(synced, GRADEBOOK_CRITERIA.midterm), wMid)
            + toWeightedPercentPoints(finalMeta, Number(finalMeta?.maxScore || 100), wFin);

        const scoreClass = safeScore >= 71 ? 'gb-score-high' : safeScore >= 51 ? 'gb-score-mid' : 'gb-score-low';
        const barClass = safeScore >= 71 ? 'high' : safeScore >= 51 ? 'mid' : 'low';
        predCell.innerHTML = `<div class="${scoreClass}">${safeScore}</div><div class="gb-score-bar"><div class="gb-score-bar-fill ${barClass}" style="width:${safeScore}%"></div></div>`;
        
        let letter = 'F';
        let color = 'var(--kiu-red)';
        
        if (maxPotential < 51 && effectiveExamScore === 0) {
            letter = 'F (Predicted)';
            color = 'var(--kiu-red)';
            predCell.style.color = color;
        } else {
            if (safeScore >= 91) { letter = 'A'; color = 'var(--kiu-green)'; }
            else if (safeScore >= 81) { letter = 'B'; color = 'var(--kiu-blue)'; }
            else if (safeScore >= 71) { letter = 'C'; color = 'var(--kiu-orange)'; }
            else if (safeScore >= 61) { letter = 'D'; color = 'var(--kiu-orange)'; }
            else if (safeScore >= 51) { letter = 'E'; color = 'var(--kiu-orange)'; }
            else if (safeScore >= 41) { letter = 'FX'; color = 'var(--kiu-red)'; }
            
            if (effectiveExamScore === 0) {
                // Not final yet
                predCell.style.color = 'var(--kiu-text-main)';
            } else {
                predCell.style.color = color;
            }
        }

        const gradeClass = letter.charAt(0) === 'A' ? 'grade-a' : letter.charAt(0) === 'B' ? 'grade-b' : letter.charAt(0) === 'C' ? 'grade-c' : letter.charAt(0) === 'D' ? 'grade-d' : 'grade-f';
        letterCell.innerHTML = `<span class="gb-letter-badge ${gradeClass}">${letter.length > 2 ? letter : letter}</span>`;
        letterCell.style.color = "";
        st.letter = /^[A-Z]/.test(letter) ? letter.charAt(0) : letter;
    });
}

function getGradebookNotificationWeights() {
    return getGradebookWeightProfileForRoster(currentRosterId);
}

function getGradebookVisibleOutcome(record, weights = getGradebookNotificationWeights()) {
    const fields = ['q1', 'qa', 'mid', 'final'];
    const exception = fields.find(field => ['I', 'M', 'W'].includes(record?.[field])) || '';
    if (exception) {
        return {
            scoreLabel: exception,
            letterLabel: exception === 'I' ? 'Incomplete' : (exception === 'M' ? 'Medical' : 'Withdrawn'),
            letterStored: exception
        };
    }
    const toWeightedPercentPoints = (meta, value, weightFraction) => {
        const numericValue = Number(value || 0);
        const maxScore = Math.max(1, Number(meta?.maxScore || 100));
        return Math.max(0, Math.min(1, numericValue / maxScore)) * (weightFraction * 100);
    };
    const synced = syncGradeRecordSummaries(ensureGradeRecordHistories({ ...(record || {}) }));
    const quizMeta = getGradebookCriterionMeta(GRADEBOOK_CRITERIA.quiz.key);
    const homeworkMeta = getGradebookCriterionMeta(GRADEBOOK_CRITERIA.homework.key);
    const midtermMeta = getGradebookCriterionMeta(GRADEBOOK_CRITERIA.midterm.key);
    const finalMeta = getGradebookCriterionMeta(GRADEBOOK_CRITERIA.final.key);
    const finalScore = getGradebookEffectiveExamScore(synced);
    const safeScore = Math.max(0, Math.min(100, Math.round(
        toWeightedPercentPoints(quizMeta, getAssessmentDisplayValue(synced, GRADEBOOK_CRITERIA.quiz), weights.q1)
        + toWeightedPercentPoints(homeworkMeta, getAssessmentDisplayValue(synced, GRADEBOOK_CRITERIA.homework), weights.qa)
        + toWeightedPercentPoints(midtermMeta, getAssessmentDisplayValue(synced, GRADEBOOK_CRITERIA.midterm), weights.mid)
        + toWeightedPercentPoints(finalMeta, finalScore, weights.fin)
    )));
    const maxPotential = toWeightedPercentPoints(quizMeta, getAssessmentDisplayValue(synced, GRADEBOOK_CRITERIA.quiz), weights.q1)
        + toWeightedPercentPoints(homeworkMeta, getAssessmentDisplayValue(synced, GRADEBOOK_CRITERIA.homework), weights.qa)
        + toWeightedPercentPoints(midtermMeta, getAssessmentDisplayValue(synced, GRADEBOOK_CRITERIA.midterm), weights.mid)
        + toWeightedPercentPoints(finalMeta, Number(finalMeta?.maxScore || 100), weights.fin);
    let letterLabel = 'F';
    if (maxPotential < 51 && finalScore === 0) {
        letterLabel = 'F (Predicted)';
    } else if (safeScore >= 91) {
        letterLabel = 'A';
    } else if (safeScore >= 81) {
        letterLabel = 'B';
    } else if (safeScore >= 71) {
        letterLabel = 'C';
    } else if (safeScore >= 61) {
        letterLabel = 'D';
    } else if (safeScore >= 51) {
        letterLabel = 'E';
    } else if (safeScore >= 41) {
        letterLabel = 'FX';
    }
    return {
        scoreLabel: String(safeScore),
        letterLabel,
        letterStored: /^[A-Z]/.test(letterLabel) ? letterLabel.charAt(0) : letterLabel
    };
}

function notifyGradebookStudentsAboutChanges(previousRoster = [], nextRoster = []) {
    const previousById = new Map((previousRoster || []).map(record => [String(record?.id || ''), record]));
    const weights = getGradebookNotificationWeights();
    const actorName = typeof getSimulatedUserName === 'function' ? getSimulatedUserName() : 'Teaching staff';
    nextRoster.forEach(record => {
        const studentId = String(record?.id || '');
        if (!studentId) return;
        const previousRecord = previousById.get(studentId) || null;
        const previousOutcome = previousRecord ? getGradebookVisibleOutcome(previousRecord, weights) : null;
        const nextOutcome = getGradebookVisibleOutcome(record, weights);
        if (previousOutcome && previousOutcome.scoreLabel === nextOutcome.scoreLabel && previousOutcome.letterLabel === nextOutcome.letterLabel) {
            return;
        }
        createPortalSystemNotification({
            userId: studentId,
            source: 'school',
            type: 'grade-evaluated',
            title: 'Grade evaluated',
            text: `${actorName} updated your visible score to ${nextOutcome.scoreLabel} (${nextOutcome.letterLabel}).`,
            routePage: 'lms',
            routeData: { rosterId: currentRosterId || '' },
            duplicateWindowMs: 1000
        });
    });
}

function saveGrades() {
    const previousRoster = Array.isArray(KIU_STATE.studentGrades?.[currentRosterId])
        ? KIU_STATE.studentGrades[currentRosterId].map(student => ensureGradeRecordHistories({ ...(student || {}) }))
        : [];
    const nextRoster = mockStudents.map(student => ensureGradeRecordHistories(student));
    notifyGradebookStudentsAboutChanges(previousRoster, nextRoster);
    KIU_STATE.studentGrades[currentRosterId] = nextRoster;
    saveState();
    const changedCount = nextRoster.filter(record => {
        const previousRecord = previousRoster.find(item => String(item?.id || '') === String(record?.id || ''));
        if (!previousRecord) return true;
        return JSON.stringify(previousRecord) !== JSON.stringify(record);
    }).length;
    if (typeof recordPortalAudit === 'function') {
        recordPortalAudit('grades', 'saved', 'gradebook', currentRosterId || 'default-roster', {
            afterState: {
                rosterId: currentRosterId || '',
                changedStudents: changedCount,
                totalStudents: nextRoster.length
            }
        });
    }
    if (typeof recordPortalSyncRun === 'function') {
        recordPortalSyncRun('sis', {
            scope: 'grades',
            status: 'queued',
            recordsSeen: nextRoster.length,
            recordsChanged: changedCount,
            notes: `Grade save queued from roster ${currentRosterId || 'default-roster'}.`
        });
    }
    if (document.getElementById('study-card-container')) renderStudyCard();
    alert('Grades saved. Student notifications and audit records were updated.');
}

function applyGradeCurvePrompt() {
    if (![USER_ROLES.PROFESSOR, USER_ROLES.ADMIN].includes(getEffectiveUserRole())) {
        alert('Only professors or administrators can apply a grade curve.');
        return;
    }
    const bonus = prompt("Enter flat bonus points to add to all students (Curve):", "5");
    if (bonus === null) return;
    const points = parseInt(bonus, 10);
    if (isNaN(points)) return;

    mockStudents.forEach((student, index) => {
        const record = ensureGradeRecordHistories(student);
        const finalEntries = getAssessmentEntries(record, 'final');
        if (finalEntries.length) {
            const lastEntry = finalEntries[finalEntries.length - 1];
            mockStudents[index] = setAssessmentScoreOnRecord(record, 'final', lastEntry.number, Math.min(100, Number(lastEntry.score || 0) + points), {
                updatedBy: `${getSimulatedUserName()} (curve)`
            });
            return;
        }

        const midEntries = getAssessmentEntries(record, 'midterm');
        const targetNumber = midEntries.length ? midEntries[midEntries.length - 1].number : 1;
        const currentScore = midEntries.length ? Number(midEntries[midEntries.length - 1].score || 0) : 0;
        mockStudents[index] = setAssessmentScoreOnRecord(record, 'midterm', targetNumber, Math.min(100, currentScore + points), {
            updatedBy: `${getSimulatedUserName()} (curve)`
        });
    });

    alert(`CURVE APPLIED: Added ${points} points to all eligible students in this group.`);
    initGradebook();
    saveState();
}


