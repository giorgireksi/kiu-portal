/* READABILITY: Gradebook data model — criteria, schemes, weights, assessment records, LMS quiz grade mapping.
 * Sections: Criteria | Schemes | Weights | Records | QuizMap(peel)
 * See docs/human-maintainability.md (H2). */
// --- READABILITY: Weights ---
/* Gradebook model: criteria, schemes, weights, assessment records, LMS quiz grade mapping.
   Load before gradebook-workspace.js and gradebook-staff.js. */
/* Gradebook page logic extracted from the legacy core.js bundle. Active routes now load split files directly. */

// --- GRADEBOOK LOGIC ---
let currentRosterId = 'law_g2';
let mockStudents = KIU_STATE.studentGrades[currentRosterId];
let currentGradebookSection = null;
let currentGradebookCriterion = 'quiz';
// --- READABILITY: Records ---
let currentGradebookAssessmentNumber = 1;
let lmsEmbeddedGradebookSelectedStudentId = '';
let lmsEmbeddedGradebookRosterFilter = '';
let gradebookAssessmentNumberInputTimer = null;
let facultyGradebookFilterState = { semester: '1', faculty: '', subjectId: 'all', groupId: 'all' };
let facultyGradebookEnrollmentByStudentId = new Map();
let facultyGradebookScopedGroups = [];

function getSimulatedUserName() {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : (window.currentUser || window.authenticatedUser || null);
    if (!user) return 'Unknown User';
    if (user.role === 'admin' || user.role === window.USER_ROLES?.ADMIN) {
        return user.name || user.nameEn || user.email || 'System Administrator';
    }
    return user.nameEn || user.name || user.email || user.id || 'Unknown User';
}

// --- READABILITY: Criteria ---
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
    classAssignment: {
        key: 'class-assignment',
        label: 'Class assignment',
        pluralLabel: 'Class assignments',
        legacyKey: 'classAssignment',
        aggregateMode: 'average',
        maxScore: 100
    },
    teamProject: {
        key: 'team-project',
        label: 'Team project',
        pluralLabel: 'Team projects',
        legacyKey: 'teamProject',
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

const GRADEBOOK_EVALUATION_SECTION_ORDER = [
    'quiz',
    'oral-quiz',
    'class-assignment',
    'team-project',
    'homework',
    'midterm',
    'final',
    'retake'
];
const GRADEBOOK_DEFAULT_WEIGHT_PROFILE = Object.freeze({
    q1: 0.10,
    qa: 0.10,
    mid: 0.30,
    fin: 0.50
});
// --- READABILITY: Schemes ---
const GRADEBOOK_SCHEME_COMPONENTS = Object.freeze([
    { schemeKey: 'quiz', criterionKey: 'quiz', label: 'Quiz', color: '#38bdf8', defaultCount: 5 },
    { schemeKey: 'oralQuiz', criterionKey: 'oral-quiz', label: 'Oral quiz', color: '#a78bfa', defaultCount: 3 },
    { schemeKey: 'classAssignment', criterionKey: 'class-assignment', label: 'Class assignment', color: '#34d399', defaultCount: 3 },
    { schemeKey: 'teamProject', criterionKey: 'team-project', label: 'Team project', color: '#2dd4bf', defaultCount: 1 },
    { schemeKey: 'homework', criterionKey: 'homework', label: 'Homework', color: '#22c55e', defaultCount: 5 },
    { schemeKey: 'midterm', criterionKey: 'midterm', label: 'Midterm', color: '#f59e0b', defaultCount: 1 },
    { schemeKey: 'final', criterionKey: 'final', label: 'Final', color: '#ef4444', altCriterionKey: 'retake', defaultCount: 1 }
]);
const GRADEBOOK_DEFAULT_GRADING_SCHEME = Object.freeze({
    quiz: 10,
    oralQuiz: 10,
    classAssignment: 15,
    teamProject: 15,
    homework: 10,
    midterm: 20,
    final: 20
});

function ensureGradebookSubjectSchemeStore() {
    if (!KIU_STATE.gradebookSubjectSchemes || typeof KIU_STATE.gradebookSubjectSchemes !== 'object') {
        KIU_STATE.gradebookSubjectSchemes = {};
    }
    return KIU_STATE.gradebookSubjectSchemes;
}

// --- Per-subject assessment components (dynamic add/remove + shared profiles) ---
function cloneGradebookComponents(list) {
    return (Array.isArray(list) ? list : []).map(component => ({ ...component }));
}

function ensureGradebookSubjectComponentStore() {
    if (!KIU_STATE.gradebookSubjectComponents || typeof KIU_STATE.gradebookSubjectComponents !== 'object') {
        KIU_STATE.gradebookSubjectComponents = {};
    }
    return KIU_STATE.gradebookSubjectComponents;
}

function ensureGradebookComponentProfileStore() {
    if (!Array.isArray(KIU_STATE.gradebookComponentProfiles) || !KIU_STATE.gradebookComponentProfiles.length) {
        KIU_STATE.gradebookComponentProfiles = [
            { id: 'standard', name: 'Standard', components: cloneGradebookComponents(GRADEBOOK_SCHEME_COMPONENTS) }
        ];
    }
    return KIU_STATE.gradebookComponentProfiles;
}

function getGradebookSubjectComponents(subjectId) {
    const key = resolveGradebookCourseIdForWeights(subjectId);
    const store = ensureGradebookSubjectComponentStore();
    if (key && Array.isArray(store[key]) && store[key].length) {
        return cloneGradebookComponents(store[key]);
    }
    return null;
}

function setGradebookSubjectComponents(subjectId, components, options = {}) {
    const key = resolveGradebookCourseIdForWeights(subjectId);
    if (!key) return null;
    const store = ensureGradebookSubjectComponentStore();
    store[key] = cloneGradebookComponents(components);
    if (options.persist !== false) saveState();
    return store[key];
}

// ponytail: module-level override scopes the active component list to one synchronous
// render pass; not reentrant across async (no async render path reads it mid-flight).
let gradebookActiveComponentsOverride = null;
function withGradebookComponents(components, fn) {
    const prev = gradebookActiveComponentsOverride;
    gradebookActiveComponentsOverride = Array.isArray(components) && components.length ? components : null;
    try {
        return fn();
    } finally {
        gradebookActiveComponentsOverride = prev;
    }
}

function getActiveGradebookSchemeComponents(subjectId) {
    if (gradebookActiveComponentsOverride) return gradebookActiveComponentsOverride;
    const stored = getGradebookSubjectComponents(subjectId);
    return stored || GRADEBOOK_SCHEME_COMPONENTS;
}

function gradebookSubjectIdFromRoster(rosterId) {
    return String(rosterId || '').split('::')[0].trim();
}

function normalizeGradebookSchemePoints(value, fallback = 0) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return Math.max(0, Number(fallback) || 0);
    return Math.max(0, Math.round(numeric));
}

function getGradebookSchemeCountKey(schemeKey) {
    return `${String(schemeKey || '').trim()}Count`;
}

function normalizeGradebookSchemeCount(value, fallback = 1) {
    const numeric = Number(value);
    const safeFallback = Math.max(1, Math.round(Number(fallback) || 1));
    if (!Number.isFinite(numeric)) return safeFallback;
    return Math.max(1, Math.round(numeric));
}

function getGradebookSchemeComponentBySchemeKey(schemeKey) {
    return getActiveGradebookSchemeComponents().find(component => component.schemeKey === schemeKey) || null;
}

function getGradebookSchemeItemCount(scheme = {}, component) {
    const resolved = component || getGradebookSchemeComponentBySchemeKey(scheme?.schemeKey);
    if (!resolved) return 1;
    const countKey = getGradebookSchemeCountKey(resolved.schemeKey);
    return normalizeGradebookSchemeCount(
        scheme[countKey],
        resolved.defaultCount || 1
    );
}

function getGradebookSchemePerItemMax(scheme = {}, component) {
    const resolved = typeof component === 'string'
        ? getGradebookSchemeComponentBySchemeKey(component)
        : component;
    if (!resolved) return 0;
    const normalized = normalizeGradebookGradingScheme(scheme);
    const categoryMax = Number(normalized[resolved.schemeKey] || 0);
    const itemCount = getGradebookSchemeItemCount(normalized, resolved);
    if (categoryMax <= 0 || itemCount <= 0) return 0;
    return categoryMax / itemCount;
}

function formatGradebookSchemePerItemMax(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return '0';
    const rounded = Math.round(numeric * 100) / 100;
    if (Number.isInteger(rounded)) return String(rounded);
    return rounded.toFixed(2).replace(/\.?0+$/, '');
}

function getGradebookCriterionAggregateMode(criterion) {
    const normalized = normalizeGradebookCriterion(criterion);
    const defaultMeta = Object.values(GRADEBOOK_CRITERIA).find(meta => meta.key === normalized);
    return defaultMeta?.aggregateMode || 'average';
}

function getGradebookSchemeEntryMaxForScale(component, normalizedScheme = {}) {
    const categoryMax = Number(normalizeGradebookGradingScheme(normalizedScheme)[component.schemeKey] || 0);
    const perItemMax = getGradebookSchemePerItemMax(normalizedScheme, component);
    const aggregateMode = getGradebookCriterionAggregateMode(component.criterionKey);
    if (categoryMax <= 0) return Math.max(1, perItemMax || 1);
    return aggregateMode === 'sum' ? categoryMax : Math.max(perItemMax, 1);
}

function normalizeGradebookGradingScheme(scheme = {}) {
    const normalized = {};
    getActiveGradebookSchemeComponents().forEach(component => {
        normalized[component.schemeKey] = normalizeGradebookSchemePoints(
            scheme[component.schemeKey],
            GRADEBOOK_DEFAULT_GRADING_SCHEME[component.schemeKey] ?? component.defaultMax
        );
        normalized[getGradebookSchemeCountKey(component.schemeKey)] = normalizeGradebookSchemeCount(
            scheme[getGradebookSchemeCountKey(component.schemeKey)],
            component.defaultCount || 1
        );
    });
    return normalized;
}

function getGradebookSchemeTotalPoints(scheme = {}) {
    const normalized = normalizeGradebookGradingScheme(scheme);
    return getActiveGradebookSchemeComponents().reduce(
        (sum, component) => sum + Number(normalized[component.schemeKey] || 0),
        0
    );
}

function migrateLegacyWeightProfileToScheme(profile = {}) {
    const weights = normalizeGradebookWeightProfile(profile);
    const courseTotal = 100;
    return normalizeGradebookGradingScheme({
        quiz: Math.round(Number(weights.q1 || 0) * courseTotal * 0.5),
        oralQuiz: GRADEBOOK_DEFAULT_GRADING_SCHEME.oralQuiz,
        classAssignment: GRADEBOOK_DEFAULT_GRADING_SCHEME.classAssignment,
        teamProject: GRADEBOOK_DEFAULT_GRADING_SCHEME.teamProject,
        homework: Math.round(Number(weights.qa || 0) * courseTotal),
        midterm: Math.round(Number(weights.mid || 0) * courseTotal),
        final: Math.round(Number(weights.fin || 0) * courseTotal)
    });
}

function getGradebookSubjectGradingScheme(courseId) {
    const subjectKey = resolveGradebookCourseIdForWeights(courseId);
    if (!subjectKey) return null;
    const schemeStore = ensureGradebookSubjectSchemeStore();
    if (schemeStore[subjectKey]) {
        return normalizeGradebookGradingScheme(schemeStore[subjectKey]);
    }
    const legacyWeights = getGradebookWeightProfileForSubject(subjectKey);
    if (legacyWeights) {
        return migrateLegacyWeightProfileToScheme(legacyWeights);
    }
    return null;
}

function setGradebookSubjectGradingScheme(courseId, nextScheme = {}, options = {}) {
    const subjectKey = resolveGradebookCourseIdForWeights(courseId);
    if (!subjectKey) return { ...GRADEBOOK_DEFAULT_GRADING_SCHEME };
    const schemeStore = ensureGradebookSubjectSchemeStore();
    const normalized = normalizeGradebookGradingScheme({
        ...(getGradebookSubjectGradingScheme(subjectKey) || GRADEBOOK_DEFAULT_GRADING_SCHEME),
        ...nextScheme
    });
    schemeStore[subjectKey] = normalized;
    const rosterStore = ensureGradebookWeightStore();
    getLmsSubjectGroupsForBulkWeights(subjectKey).forEach(group => {
        const rosterKey = String(group?.rosterKey || '').trim();
        if (rosterKey) {
            rosterStore[rosterKey] = { ...normalized, __gradingScheme: true };
        }
    });
    if (options.persist !== false) {
        saveState();
        if (document.getElementById('study-card-container') && typeof renderStudyCard === 'function') {
            renderStudyCard();
        }
    }
    return normalized;
}

function getGradebookSchemeForRoster(rosterId = currentRosterId, courseId) {
    const subjectScheme = getGradebookSubjectGradingScheme(courseId);
    if (subjectScheme) {
        return subjectScheme;
    }
    const rosterKey = String(rosterId || currentRosterId || '').trim();
    const store = ensureGradebookWeightStore();
    if (rosterKey && store[rosterKey]) {
        const entry = store[rosterKey];
        if (entry.__gradingScheme || entry.quiz !== undefined) {
            return normalizeGradebookGradingScheme(entry);
        }
        return migrateLegacyWeightProfileToScheme(entry);
    }
    return { ...GRADEBOOK_DEFAULT_GRADING_SCHEME };
}

function getGradebookSchemeAssessmentRawScore(record, component) {
    const safeRecord = syncGradeRecordSummaries(ensureGradeRecordHistories(record || {}));
    if (component.altCriterionKey) {
        const finalMeta = getGradebookCriterionMeta(component.criterionKey, safeRecord);
        const altMeta = getGradebookCriterionMeta(component.altCriterionKey, safeRecord);
        const finalScore = Number(getAssessmentDisplayValue(safeRecord, finalMeta) || 0);
        const altScore = Number(getAssessmentDisplayValue(safeRecord, altMeta) || 0);
        return Math.max(finalScore, altScore);
    }
    const meta = getGradebookCriterionMeta(component.criterionKey, safeRecord);
    return Number(getAssessmentDisplayValue(safeRecord, meta) || 0);
}

function scaleAssessmentScoreToSchemePoints(rawScore, entryMaxScore, schemeMaxPoints) {
    const maxPoints = Number(schemeMaxPoints || 0);
    if (maxPoints <= 0) return 0;
    const entryMax = Math.max(1, Number(entryMaxScore || 100));
    const numeric = Number(rawScore || 0);
    return Math.max(0, Math.min(maxPoints, (numeric / entryMax) * maxPoints));
}

function computeGradebookSchemeBreakdown(record, scheme = getGradebookSchemeForRoster()) {
    const normalizedScheme = normalizeGradebookGradingScheme(scheme);
    const components = getActiveGradebookSchemeComponents().map(component => {
        const maxPoints = Number(normalizedScheme[component.schemeKey] || 0);
        const perItemMax = getGradebookSchemePerItemMax(normalizedScheme, component);
        const itemCount = getGradebookSchemeItemCount(normalizedScheme, component);
        const meta = getGradebookCriterionMeta(component.criterionKey, record);
        const rawScore = getGradebookSchemeAssessmentRawScore(record, component);
        const entryMaxForScale = getGradebookSchemeEntryMaxForScale(component, normalizedScheme);
        const earned = scaleAssessmentScoreToSchemePoints(rawScore, entryMaxForScale, maxPoints);
        return {
            ...component,
            maxPoints,
            perItemMax,
            itemCount,
            rawScore,
            earned,
            entryMaxScore: Number(meta.maxScore || perItemMax || 100)
        };
    });
    const totalMax = components.reduce((sum, row) => sum + row.maxPoints, 0);
    const totalEarned = components.reduce((sum, row) => sum + row.earned, 0);
    const percent = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;
    return { components, totalMax, totalEarned, percent };
}

function readGradebookGradingSchemeFromDom(root = document) {
    const scope = root && typeof root.querySelector === 'function' ? root : document;
    const scheme = {};
    getActiveGradebookSchemeComponents().forEach(component => {
        const input = scope.querySelector(`[data-lms-subject-scheme-input="${component.schemeKey}"]`);
        const countInput = scope.querySelector(`[data-lms-subject-scheme-count="${component.schemeKey}"]`);
        scheme[component.schemeKey] = input?.value;
        scheme[getGradebookSchemeCountKey(component.schemeKey)] = countInput?.value;
    });
    return normalizeGradebookGradingScheme(scheme);
}

function getGradebookSchemePerItemDisplay(scheme, component) {
    const normalized = normalizeGradebookGradingScheme(scheme);
    const itemCount = getGradebookSchemeItemCount(normalized, component);
    const perItem = formatGradebookSchemePerItemMax(getGradebookSchemePerItemMax(normalized, component));
    return { itemCount, perItem };
}

function setGradebookSchemeShellEditing(shell, isEditing) {
    if (!shell || typeof shell.querySelector !== 'function') return;
    shell.classList.toggle('is-locked', !isEditing);
    shell.dataset.gbSchemeLocked = isEditing ? 'false' : 'true';
    shell.querySelectorAll('[data-lms-subject-scheme-input], [data-lms-subject-scheme-count]').forEach(input => {
        if (!(input instanceof HTMLInputElement)) return;
        input.readOnly = !isEditing;
        input.tabIndex = isEditing ? 0 : -1;
        input.classList.toggle('is-locked', !isEditing);
    });
    const editButton = shell.querySelector('[data-gradebook-click="edit-grading-scheme"]');
    const saveButton = shell.querySelector('[data-gradebook-click="save-grading-scheme"]');
    if (editButton) editButton.disabled = Boolean(isEditing);
    if (saveButton) saveButton.disabled = !isEditing;
}

function refreshGradebookSchemeShellDerivedValues(shell) {
    if (!shell || typeof shell.querySelector !== 'function') return;
    const draft = readGradebookGradingSchemeFromDom(shell);
    getActiveGradebookSchemeComponents().forEach(component => {
        const perItemNode = shell.querySelector(`[data-gb-scheme-per-item="${component.schemeKey}"]`);
        if (!perItemNode) return;
        const { itemCount, perItem } = getGradebookSchemePerItemDisplay(draft, component);
        perItemNode.textContent = `${perItem} pt${Number(perItem) === 1 ? '' : 's'} each`;
        perItemNode.setAttribute('title', `${itemCount} item${itemCount === 1 ? '' : 's'} × ${perItem} per item`);
    });
    const totalNode = shell.querySelector('[data-gb-scheme-total]');
    if (totalNode) {
        const totalPoints = getGradebookSchemeTotalPoints(draft);
        totalNode.textContent = `Course total: ${totalPoints} points`;
    }
}

function saveGradebookGradingSchemeFromShell(shell, courseId, options = {}) {
    if (!shell) {
        alert('Grading scheme controls are not available.');
        return null;
    }
    if (shell.classList.contains('is-locked')) {
        alert('Click Edit before saving the grading scheme.');
        return null;
    }
    const subjectKey = resolveGradebookCourseIdForWeights(courseId);
    if (!subjectKey) {
        alert('Open a subject group before saving the grading scheme.');
        return null;
    }
    const subjectComponents = getGradebookSubjectComponents(subjectKey);
    const scheme = withGradebookComponents(subjectComponents, () => readGradebookGradingSchemeFromDom(shell));
    const courseTotal = withGradebookComponents(subjectComponents, () => getGradebookSchemeTotalPoints(scheme));
    if (courseTotal <= 0) {
        alert('Course total must be greater than zero.');
        return null;
    }
    setGradebookSubjectGradingScheme(subjectKey, scheme, options);
    setGradebookSchemeShellEditing(shell, false);
    refreshGradebookSchemeShellDerivedValues(shell);
    if (options.refreshGradebook !== false) {
        if (isStaffModernGradebookContext()) {
            initStaffModernGradebook();
        } else if (document.getElementById('gradebook-body')) {
            initGradebook();
        }
    }
    return { scheme, courseTotal, subjectKey };
}

function editGradebookGradingSchemeFromElement(trigger) {
    const shell = trigger?.closest?.('[data-gb-scheme-shell]');
    if (!shell) return;
    setGradebookSchemeShellEditing(shell, true);
    const firstInput = shell.querySelector('[data-lms-subject-scheme-input], [data-lms-subject-scheme-count]');
    if (firstInput instanceof HTMLInputElement) {
        firstInput.focus();
        firstInput.select?.();
    }
}

function saveGradebookGradingSchemeFromElement(trigger, courseId) {
    const shell = trigger?.closest?.('[data-gb-scheme-shell]');
    return saveGradebookGradingSchemeFromShell(shell, courseId, { refreshGradebook: false });
}

function getGradebookSchemeComponentMetaLine(scheme = {}, schemeKey = '') {
    const component = getGradebookSchemeComponentBySchemeKey(schemeKey);
    if (!component) return '';
    const normalized = normalizeGradebookGradingScheme(scheme);
    const { itemCount, perItem } = getGradebookSchemePerItemDisplay(normalized, component);
    const categoryMax = Number(normalized[component.schemeKey] || 0);
    const itemLabel = `${itemCount} item${itemCount === 1 ? '' : 's'}`;
    return `${itemLabel} · ${perItem} pts each · ${categoryMax} pts max`;
}

function renderGradebookSchemeReferenceTable(scheme = {}, options = {}) {
    const normalized = normalizeGradebookGradingScheme(scheme);
    const courseTotal = getGradebookSchemeTotalPoints(normalized);
    const compact = Boolean(options.compact);
    const showFooter = options.showFooter !== false;
    const showCaption = Boolean(options.showCaption);
    return `
        <div class="gb-scheme-reference-section${compact ? ' is-compact' : ''}" data-gb-scheme-reference>
            ${showCaption ? '<p class="gb-scheme-reference-copy">How points are distributed for this subject.</p>' : ''}
            <div class="gb-scheme-reference-table-wrap">
                <table class="gb-scheme-table gb-scheme-table--reference">
                    <thead>
                        <tr>
                            <th scope="col">Component</th>
                            <th scope="col">Items</th>
                            <th scope="col">Category max</th>
                            <th scope="col">Per item</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${getActiveGradebookSchemeComponents().map(component => {
                            const countKey = getGradebookSchemeCountKey(component.schemeKey);
                            const { perItem } = getGradebookSchemePerItemDisplay(normalized, component);
                            const categoryMax = Number(normalized[component.schemeKey] || 0);
                            return `
                            <tr>
                                <td>${escapeHtml(component.label)}</td>
                                <td class="gb-scheme-ref-num">${escapeHtml(String(normalized[countKey]))}</td>
                                <td class="gb-scheme-ref-num">${escapeHtml(String(categoryMax))}</td>
                                <td class="gb-scheme-ref-per-item">${escapeHtml(`${perItem} pt${Number(perItem) === 1 ? '' : 's'} each`)}</td>
                            </tr>
                        `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            ${showFooter ? `<div class="gb-scheme-total gb-scheme-reference-total">Course total: ${courseTotal} points</div>` : ''}
        </div>
    `;
}

function getGradebookGradingSchemeControlsMarkup(scheme = {}, readOnly = false, options = {}) {
    return withGradebookComponents(
        getGradebookSubjectComponents(options.subjectId),
        () => getGradebookGradingSchemeControlsMarkupInner(scheme, readOnly, options)
    );
}

function getGradebookGradingSchemeControlsMarkupInner(scheme = {}, readOnly = false, options = {}) {
    const idPrefix = String(options.idPrefix || '');
    const totalId = String(options.totalId || 'gradebook-scheme-total-points');
    const shellId = String(options.schemeShellId || `${idPrefix}grading-scheme-shell`);
    const shellLabel = String(options.shellLabel || 'Grading scheme');
    const subjectId = String(options.subjectId || '');
    const normalized = normalizeGradebookGradingScheme(scheme);
    const totalPoints = getGradebookSchemeTotalPoints(normalized);
    if (readOnly) {
        return `
            <div class="gb-scheme-shell gb-scheme-shell-readonly" data-gb-scheme-shell>
                <div class="gb-scheme-label">${escapeHtml(shellLabel)}</div>
                ${renderGradebookSchemeReferenceTable(normalized, { showCaption: false })}
            </div>
        `;
    }
    return `
        <div
            id="${escapeHtml(shellId)}"
            class="gb-scheme-shell is-locked"
            data-gb-scheme-shell
            data-gb-scheme-locked="true"
        >
            <div class="gb-scheme-label">${escapeHtml(shellLabel)}</div>
            <div class="gb-scheme-table-wrap">
                <table class="gb-scheme-table">
                    <thead>
                        <tr>
                            <th scope="col">Component</th>
                            <th scope="col">Items</th>
                            <th scope="col">Category max</th>
                            <th scope="col">Per item</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${getActiveGradebookSchemeComponents().map(component => {
                            const countKey = getGradebookSchemeCountKey(component.schemeKey);
                            const { itemCount, perItem } = getGradebookSchemePerItemDisplay(normalized, component);
                            return `
                            <tr>
                                <td>${escapeHtml(component.label)}</td>
                                <td>
                                    <input
                                        id="${escapeHtml(`${idPrefix}scheme-count-${component.schemeKey}`)}"
                                        class="gb-scheme-input gb-scheme-input-count is-locked"
                                        type="number"
                                        min="1"
                                        step="1"
                                        value="${normalized[countKey]}"
                                        readonly
                                        tabindex="-1"
                                        data-lms-subject-scheme-count="${escapeHtml(component.schemeKey)}"
                                    >
                                </td>
                                <td>
                                    <input
                                        id="${escapeHtml(`${idPrefix}scheme-${component.schemeKey}`)}"
                                        class="gb-scheme-input is-locked"
                                        type="number"
                                        min="0"
                                        step="1"
                                        value="${normalized[component.schemeKey]}"
                                        readonly
                                        tabindex="-1"
                                        data-lms-subject-scheme-input="${escapeHtml(component.schemeKey)}"
                                    >
                                </td>
                                <td>
                                    <span
                                        class="gb-scheme-per-item"
                                        data-gb-scheme-per-item="${escapeHtml(component.schemeKey)}"
                                        title="${escapeHtml(`${itemCount} items × ${perItem} per item`)}"
                                    >${escapeHtml(`${perItem} pt${Number(perItem) === 1 ? '' : 's'} each`)}</span>
                                </td>
                            </tr>
                        `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            <div class="gb-scheme-shell-actions">
                <button type="button" class="lux-secondary-btn" data-gradebook-click="edit-grading-scheme"><i class="fas fa-pen"></i> Edit</button>
                <button type="button" class="lux-secondary-btn" data-gradebook-click="manage-components" data-gradebook-subject-id="${escapeHtml(subjectId)}"><i class="fas fa-sliders-h"></i> Manage components</button>
                <button type="button" class="lux-primary-btn" data-gradebook-click="save-grading-scheme" disabled><i class="fas fa-save"></i> Save</button>
            </div>
            <div id="${escapeHtml(totalId)}" class="gb-scheme-total" data-gb-scheme-total>Course total: ${totalPoints} points</div>
        </div>
    `;
}

function ensureGradebookWeightStore() {
    if (!KIU_STATE.gradebookWeights || typeof KIU_STATE.gradebookWeights !== 'object') {
        KIU_STATE.gradebookWeights = {};
    }
    return KIU_STATE.gradebookWeights;
}

function ensureGradebookSubjectWeightStore() {
    if (!KIU_STATE.gradebookSubjectWeights || typeof KIU_STATE.gradebookSubjectWeights !== 'object') {
        KIU_STATE.gradebookSubjectWeights = {};
    }
    return KIU_STATE.gradebookSubjectWeights;
}

function resolveGradebookCourseIdForWeights(courseId) {
    if (isFacultyStandaloneGradebookContext()
        && facultyGradebookFilterState?.subjectId
        && facultyGradebookFilterState.subjectId !== 'all') {
        return String(facultyGradebookFilterState.subjectId).trim();
    }
    return String(courseId || currentGradebookSection?.courseId || '').trim();
}

function getGradebookWeightProfileForSubject(courseId) {
    const subjectKey = resolveGradebookCourseIdForWeights(courseId);
    if (!subjectKey) return null;
    const store = ensureGradebookSubjectWeightStore();
    if (!store[subjectKey]) return null;
    return normalizeGradebookWeightProfile(store[subjectKey]);
}

function setGradebookSubjectWeightProfile(courseId, nextProfile = {}, options = {}) {
    const subjectKey = resolveGradebookCourseIdForWeights(courseId);
    if (!subjectKey) return { ...GRADEBOOK_DEFAULT_WEIGHT_PROFILE };
    const store = ensureGradebookSubjectWeightStore();
    const normalized = normalizeGradebookWeightProfile({
        ...(getGradebookWeightProfileForSubject(subjectKey) || GRADEBOOK_DEFAULT_WEIGHT_PROFILE),
        ...nextProfile
    });
    store[subjectKey] = normalized;
    const rosterStore = ensureGradebookWeightStore();
    getLmsSubjectGroupsForBulkWeights(subjectKey).forEach(group => {
        const rosterKey = String(group?.rosterKey || '').trim();
        if (rosterKey) {
            rosterStore[rosterKey] = { ...normalized };
        }
    });
    if (options.persist !== false) {
        saveState();
        if (document.getElementById('study-card-container') && typeof renderStudyCard === 'function') {
            renderStudyCard();
        }
    }
    return normalized;
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

function migrateSchemeToWeightProfile(scheme = {}) {
    const normalized = normalizeGradebookGradingScheme(scheme);
    const total = getGradebookSchemeTotalPoints(normalized) || 100;
    const share = key => Number(normalized[key] || 0) / total;
    return normalizeGradebookWeightProfile({
        q1: share('quiz') + share('oralQuiz') + share('classAssignment') + share('teamProject'),
        qa: share('homework'),
        mid: share('midterm'),
        fin: share('final')
    });
}

function getGradebookWeightProfileForRoster(rosterId = currentRosterId, courseId) {
    return migrateSchemeToWeightProfile(getGradebookSchemeForRoster(rosterId, courseId));
}

function setGradebookWeightProfileForRoster(rosterId = currentRosterId, nextProfile = {}, options = {}) {
    const rosterKey = String(rosterId || currentRosterId || '').trim();
    if (!rosterKey) return getGradebookWeightProfileForRoster();
    const store = ensureGradebookWeightStore();
    store[rosterKey] = normalizeGradebookWeightProfile({
        ...getGradebookWeightProfileForRoster(rosterKey, options.courseId),
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

function getGradebookSchemeComponentForCriterion(criterionKey) {
    const normalized = normalizeGradebookCriterion(criterionKey);
    return getActiveGradebookSchemeComponents().find(
        component => component.criterionKey === normalized || component.altCriterionKey === normalized
    ) || null;
}

function getGradebookCategoryMaxForCriterion(criterionKey, scheme = null, rosterId = currentRosterId) {
    const component = getGradebookSchemeComponentForCriterion(criterionKey);
    if (!component) {
        const meta = Object.values(GRADEBOOK_CRITERIA).find(item => item.key === normalizeGradebookCriterion(criterionKey));
        return Number(meta?.maxScore || 0);
    }
    const normalizedScheme = normalizeGradebookGradingScheme(
        scheme || getGradebookSchemeForRoster(rosterId)
    );
    return Number(normalizedScheme[component.schemeKey] || 0);
}

function resolveGradebookStudentRecord(studentId, rosterId = currentRosterId) {
    const targetId = String(studentId || '').trim();
    const rosterKey = String(rosterId || currentRosterId || '').trim();
    const rosterList = rosterKey && Array.isArray(KIU_STATE.studentGrades?.[rosterKey])
        ? KIU_STATE.studentGrades[rosterKey]
        : [];
    return (mockStudents || []).find(student => String(student?.id || '') === targetId)
        || rosterList.find(student => String(student?.id || '') === targetId)
        || Object.values(KIU_STATE.studentGrades || {}).flat().find(student => String(student?.id || '') === targetId)
        || (targetId ? { id: targetId, name: targetId } : null);
}

function getGradebookCriterionMeta(criterion, record = null, rosterId = currentRosterId) {
    const normalized = normalizeGradebookCriterion(criterion);
    const defaultMeta = Object.values(GRADEBOOK_CRITERIA).find(meta => meta.key === normalized);
    const schemeComponent = withGradebookComponents(getGradebookSubjectComponents(gradebookSubjectIdFromRoster(rosterId)),
        () => getActiveGradebookSchemeComponents().find(
            component => component.criterionKey === normalized || component.altCriterionKey === normalized
        ));
    const scheme = getGradebookSchemeForRoster(rosterId);
    const perItemMax = schemeComponent ? getGradebookSchemePerItemMax(scheme, schemeComponent) : 0;
    if (defaultMeta) {
        return perItemMax > 0 ? { ...defaultMeta, maxScore: perItemMax } : defaultMeta;
    }
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

// --- READABILITY: QuizMap (peeled → gradebook-quiz-map-runtime.js; load before this host) ---
// parseLmsCourseKeyForGradebook … getDisplayAssessmentEntryForNumber live on window via Pattern C peel.

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
                action: meta.historyAction || (existingEntry && (existingEntry.score === null || existingEntry.score === undefined) ? 'scored' : (existingEntry ? 'updated' : 'scored')),
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

function setAssessmentCommentOnRecord(record, criterion, number, commentText, meta = {}) {
    const trimmedComment = String(commentText || '').trim();
    let safeRecord = ensureGradeRecordHistories(record);
    const normalizedCriterion = normalizeGradebookCriterion(criterion);
    const targetNumber = normalizeAssessmentNumber(number, 1);
    let existingEntry = getDisplayAssessmentEntryForNumber(safeRecord, normalizedCriterion, targetNumber)
        || getAssessmentEntryForNumber(safeRecord, normalizedCriterion, targetNumber);
    if (!existingEntry) {
        safeRecord = createAssessmentEntryOnRecord(safeRecord, normalizedCriterion, targetNumber, {
            updatedBy: meta.updatedBy || getSimulatedUserName(),
            note: trimmedComment
        });
        existingEntry = getAssessmentEntryForNumber(safeRecord, normalizedCriterion, targetNumber);
    }
    const entries = getAssessmentEntries(safeRecord, normalizedCriterion);
    const existingIndex = entries.findIndex(entry => normalizeAssessmentNumber(entry.number, 1) === targetNumber);
    const now = new Date().toISOString();
    const currentScore = existingEntry?.score ?? null;
    const nextEntry = {
        number: targetNumber,
        score: currentScore,
        updatedAt: now,
        updatedBy: meta.updatedBy || getSimulatedUserName(),
        title: existingEntry?.title || '',
        note: trimmedComment,
        sourceResourceKey: existingEntry?.sourceResourceKey || '',
        sourceQuizId: existingEntry?.sourceQuizId || '',
        sourceAssessmentType: existingEntry?.sourceAssessmentType || '',
        sourceAssessmentNumber: existingEntry?.sourceAssessmentNumber || targetNumber,
        history: [
            ...(Array.isArray(existingEntry?.history) ? existingEntry.history.map(normalizeAssessmentHistoryEntry) : []),
            {
                score: currentScore,
                updatedAt: now,
                updatedBy: meta.updatedBy || getSimulatedUserName(),
                action: 'commented',
                title: existingEntry?.title || '',
                note: trimmedComment,
                sourceResourceKey: existingEntry?.sourceResourceKey || '',
                sourceQuizId: existingEntry?.sourceQuizId || '',
                sourceAssessmentType: existingEntry?.sourceAssessmentType || '',
                sourceAssessmentNumber: existingEntry?.sourceAssessmentNumber || targetNumber
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
    if (!entries.length) return '<span class="gb-history-chip-empty">No history yet</span>';
    return entries.map(entry => `
        <span class="gb-history-chip">
            ${escapeHtml(formatAssessmentHistoryLabel(criterion, entry))}
        </span>
    `).join('');
}

function renderStudyCardAssessmentActivityFeed(record, options = {}) {
    const safeRecord = syncGradeRecordSummaries(ensureGradeRecordHistories(record || {}));
    const rosterId = String(options.rosterId || currentRosterId || '').trim();
    const sections = getStudentEvaluationHistorySectionDefs(safeRecord, rosterId);
    const maxItems = Math.max(1, Number(options.maxItems || 12));
    const events = [];
    sections.forEach((meta) => {
        getDisplayAssessmentEntries(safeRecord, meta.key).forEach((entry) => {
            const entryNumber = normalizeAssessmentNumber(entry.number, 1);
            const displayMeta = getAssessmentEntryDisplayContext(meta.key, entry);
            const status = getGradebookEntryStatus(safeRecord, meta, entry);
            events.push({ meta, entry, entryNumber, displayMeta, status });
        });
    });
    events.sort((left, right) => {
        const leftTime = new Date(left.entry.updatedAt || 0).getTime() || 0;
        const rightTime = new Date(right.entry.updatedAt || 0).getTime() || 0;
        return rightTime - leftTime;
    });
    const visibleEvents = events.slice(0, maxItems);
    if (!visibleEvents.length) {
        return '';
    }
    return `
        <div class="study-card-activity-feed">
            ${visibleEvents.map((item) => {
                const scoreLabel = item.status.key === 'pending'
                    ? 'Pending'
                    : (item.entry.score === null || item.entry.score === undefined || item.entry.score === ''
                        ? '—'
                        : Number(item.entry.score));
                const note = String(item.entry.note || '').trim();
                const notePreview = note && shouldDisplayGradebookHistoryNote(note)
                    ? `<p class="study-card-activity-item-note"><i class="fas fa-comment-dots"></i> ${escapeHtml(note)}</p>`
                    : '';
                return `
                    <button type="button" class="study-card-activity-item is-${escapeHtml(item.status.key)}" data-gradebook-click="open-category-history" data-gradebook-criterion="${escapeHtml(String(item.meta.key))}" data-gradebook-category-label="${escapeHtml(item.meta.label)}">
                        <div class="study-card-activity-item-main">
                            <span class="study-card-activity-item-badge">${escapeHtml(item.meta.label)}</span>
                            <strong class="study-card-activity-item-title">${escapeHtml(item.displayMeta.title || `${item.meta.label} ${item.entryNumber}`)}</strong>
                            ${item.displayMeta.subtitle ? `<span class="study-card-activity-item-subtitle">${escapeHtml(item.displayMeta.subtitle)}</span>` : ''}
                            <span class="study-card-activity-item-meta">${escapeHtml(formatAssessmentHistoryTimestamp(item.entry.updatedAt))}${item.entry.updatedBy ? ` · ${escapeHtml(item.entry.updatedBy)}` : ''}</span>
                            ${notePreview}
                        </div>
                        <div class="study-card-activity-item-side">
                            <strong class="study-card-activity-item-score">${escapeHtml(String(scoreLabel))}</strong>
                            <span class="gb-status-badge lux-status-pill is-${escapeHtml(item.status.key)}"><i class="fas ${escapeHtml(item.status.icon)}"></i> ${escapeHtml(item.status.label)}</span>
                        </div>
                    </button>
                `;
            }).join('')}
        </div>
    `;
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

function getStudentEvaluationHistorySectionDefs(record = null, rosterId = currentRosterId) {
    const defs = getGradebookSectionDefs(rosterId, record);
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

function closeStudentEvaluationHistoryModal() {
    document.getElementById('student-evaluation-history-modal')?.remove();
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
    refreshGradebookAfterStaffScoreChange({ closeScoreEditModal: false });
    openStudentEvaluationHistoryModal(studentId, studentName, sectionKey);
}

function addGradebookCustomSection(studentId, inputId, studentName = '') {
    const input = document.getElementById(inputId);
    const rawLabel = String(input?.value || '').trim();
    addGradebookCustomSectionByLabel(studentId, rawLabel, studentName);
}

function toggleGradebookCustomSectionComposer(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    const shouldShow = panel.hidden;
    setGradebookShellVisibility(panel, shouldShow);
    if (shouldShow) panel.querySelector('input')?.focus();
}

function toggleStudentEvaluationSectionHistory(historyId) {
    const panel = document.getElementById(historyId);
    if (!panel) return;
    setGradebookShellVisibility(panel, panel.hidden);
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
    refreshGradebookAfterStaffScoreChange({ closeScoreEditModal: false });
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
    refreshGradebookAfterStaffScoreChange({ closeScoreEditModal: false });
    openStudentEvaluationHistoryModal(studentId, studentName || updated.name || '', normalizedCriterion);
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
            const scoreInputId = `eval-score-modern-${toDomToken(studentId)}-${sectionId}-${entryNumber}`;
            return `
                <article class="gb-modal-history-card is-${escapeHtml(status.key)}">
                    <div class="gb-modal-history-main">
                        <div class="gb-modal-history-icon"><i class="fas ${escapeHtml(status.icon)}"></i></div>
                        <div>
                            <div class="gb-modal-history-title">
                                <strong>${escapeHtml(displayMeta.title)}</strong>
                                <span class="gb-status-badge lux-status-pill is-${escapeHtml(status.key)}">${escapeHtml(status.label)}</span>
                            </div>
                            <div class="gb-modal-history-kind">${escapeHtml(status.key === 'pending' ? 'Pending review queue' : status.key === 'graded' ? 'Graded result' : 'Recorded attempt')}</div>
                            ${displayMeta.subtitle ? `<div class="gb-modal-history-subtitle">${escapeHtml(displayMeta.subtitle)}</div>` : ''}
                            <div class="gb-modal-history-meta">${escapeHtml(formatAssessmentHistoryTimestamp(entry.updatedAt))}${entry.updatedBy ? ` · ${escapeHtml(entry.updatedBy)}` : ''}</div>
                            ${entry.note ? `<div class="gb-modal-history-note">${escapeHtml(entry.note)}</div>` : ''}
                            ${renderGradebookScoreHistoryPanel({
                                record: safeRecord,
                                studentId,
                                studentName,
                                criterion: meta.key,
                                assessmentNumber: entryNumber,
                                canEdit,
                                compact: true
                            })}
                        </div>
                    </div>
                    <div class="gb-modal-history-score">
                        <strong>${status.key === 'pending' ? 'Pending' : (entry.score === null || entry.score === undefined ? '-' : Number(entry.score))}</strong>
                        <span>${escapeHtml(meta.label)}</span>
                    </div>
                    ${canEdit ? `
                        <div class="gb-modal-history-actions">
                            ${linkedQuizSource ? `<button type="button" class="lux-secondary-btn gb-modal-action-btn" data-gradebook-click="open-linked-quiz" data-gradebook-student-id="${escapeHtml(String(studentId))}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-number="${escapeHtml(String(entryNumber))}"><i class="fas fa-file-alt"></i> ${pendingReview ? 'Evaluate' : 'Paper'}</button>` : ''}
                            ${status.key === 'graded'
                                ? `<button type="button" class="lux-secondary-btn gb-modal-action-btn" data-gradebook-click="open-score-edit" data-gradebook-student-id="${escapeHtml(String(studentId))}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-number="${escapeHtml(String(entryNumber))}" data-gradebook-score="${escapeHtml(String(Number(entry.score || 0)))}" data-gradebook-student-name="${escapeHtml(String(studentName || ''))}"><i class="fas fa-pen"></i> Edit</button>`
                                : `<input id="${scoreInputId}" type="number" min="0" max="${Number(meta.maxScore || 100)}" placeholder="Score"><button type="button" class="lux-primary-btn gb-modal-action-btn gb-modal-action-btn-primary" data-gradebook-click="save-entry" data-gradebook-student-id="${escapeHtml(String(studentId))}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-number="${escapeHtml(String(entryNumber))}" data-gradebook-input-id="${escapeHtml(String(scoreInputId))}" data-gradebook-student-name="${escapeHtml(String(studentName || ''))}"><i class="fas fa-save"></i> Save</button>`}
                            <button type="button" class="lux-secondary-btn gb-modal-action-btn gb-modal-action-btn-danger" data-gradebook-click="remove-entry" data-gradebook-student-id="${escapeHtml(String(studentId))}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-number="${escapeHtml(String(entryNumber))}" data-gradebook-student-name="${escapeHtml(String(studentName || ''))}"><i class="fas fa-trash"></i> Remove</button>
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
            <button type="button" class="lux-secondary-btn gb-modal-action-btn gb-modal-load-more" data-gradebook-click="open-history" data-gradebook-student-id="${escapeHtml(String(studentId))}" data-gradebook-student-name="${escapeHtml(String(studentName || ''))}" data-gradebook-criterion="${escapeHtml(String(meta.key))}"${canEdit ? '' : ' data-gradebook-force-view-only="true"'}>
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
                        ${pendingCount ? `<span class="gb-status-badge lux-status-pill is-pending">${pendingCount} pending</span>` : `<span class="gb-status-badge lux-status-pill is-graded">Ready</span>`}
                        ${!isFocusedView ? `<button type="button" class="lux-secondary-btn gb-modal-action-btn" data-gradebook-click="toggle-history" data-gradebook-history-id="${escapeHtml(String(historyBodyId))}"><i class="fas fa-chevron-down"></i> Toggle</button>` : ''}
                        ${canEdit && meta.custom ? `<button type="button" class="lux-secondary-btn gb-modal-action-btn gb-modal-action-btn-danger" data-gradebook-click="remove-custom-section" data-gradebook-student-id="${escapeHtml(String(studentId))}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-student-name="${escapeHtml(String(studentName || ''))}"><i class="fas fa-trash"></i></button>` : ''}
                        ${canEdit ? `<button type="button" class="lux-primary-btn gb-modal-action-btn gb-modal-action-btn-primary" data-gradebook-click="create-entry" data-gradebook-student-id="${escapeHtml(String(studentId))}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-student-name="${escapeHtml(String(studentName || ''))}"><i class="fas fa-plus"></i> Add</button>` : ''}
                    </div>
                </div>
                <div id="${historyBodyId}" class="gb-modal-section-body"${isOpen ? '' : ' hidden'}>
                    ${cards}
                    ${moreButton}
                </div>
            </section>
        `;
    }).join('');
}

function getAssessmentScoreHistoryTimeline(record, criterion, number) {
    const safeRecord = ensureGradeRecordHistories(record || {});
    const normalizedCriterion = normalizeGradebookCriterion(criterion);
    const targetNumber = normalizeAssessmentNumber(number, 1);
    const entry = getDisplayAssessmentEntryForNumber(safeRecord, normalizedCriterion, targetNumber)
        || getAssessmentEntryForNumber(safeRecord, normalizedCriterion, targetNumber);
    if (!entry) {
        return {
            entry: null,
            timeline: [],
            currentScore: null,
            criterionMeta: getGradebookCriterionMeta(normalizedCriterion, safeRecord)
        };
    }
    const rawHistory = Array.isArray(entry.history) && entry.history.length
        ? entry.history.map(normalizeAssessmentHistoryEntry)
        : [{
            score: entry.score,
            updatedAt: entry.updatedAt,
            updatedBy: entry.updatedBy,
            action: 'saved',
            note: entry.note || ''
        }];
    const timeline = [...rawHistory].sort((a, b) => {
        const left = new Date(a.updatedAt || 0).getTime() || 0;
        const right = new Date(b.updatedAt || 0).getTime() || 0;
        return right - left;
    });
    return {
        entry,
        timeline,
        currentScore: entry.score,
        criterionMeta: getGradebookCriterionMeta(normalizedCriterion, safeRecord)
    };
}

const GRADEBOOK_HISTORY_SYSTEM_NOTES = new Set([
    'score correction',
    'restored from score history'
]);

function shouldDisplayGradebookHistoryNote(note) {
    const trimmed = String(note || '').trim();
    if (!trimmed) return false;
    return !GRADEBOOK_HISTORY_SYSTEM_NOTES.has(trimmed.toLowerCase());
}

function formatGradebookScoreHistoryChangeLabel(historyItem, olderItem = null) {
    const note = String(historyItem?.note || '').trim();
    if (shouldDisplayGradebookHistoryNote(note)) {
        return note;
    }
    const currentScore = historyItem?.score === null || historyItem?.score === undefined
        ? null
        : Number(historyItem.score);
    const previousScore = olderItem && olderItem.score !== null && olderItem.score !== undefined
        ? Number(olderItem.score)
        : null;
    if (Number.isFinite(currentScore) && Number.isFinite(previousScore) && currentScore !== previousScore) {
        return `Changed from ${previousScore} to ${currentScore}`;
    }
    if (Number.isFinite(currentScore) && String(historyItem?.action || '') === 'scored') {
        return `Score set to ${currentScore}`;
    }
    return '';
}

function buildGradebookScoreChangeNote(previousScore, nextScore, userNote = '') {
    const trimmedNote = String(userNote || '').trim();
    if (trimmedNote) return trimmedNote;
    const next = Number(nextScore);
    if (!Number.isFinite(next)) return '';
    const previous = previousScore === null || previousScore === undefined || previousScore === ''
        ? null
        : Number(previousScore);
    if (Number.isFinite(previous) && previous !== next) {
        return `Changed from ${previous} to ${next}`;
    }
    return `Score set to ${next}`;
}

/* Score history panel: gradebook-history-ui-runtime.js */
