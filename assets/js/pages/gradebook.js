/* Gradebook page logic extracted from the legacy core.js bundle. Active routes now load split files directly. */

// --- GRADEBOOK LOGIC ---
let currentRosterId = 'law_g2';
let mockStudents = KIU_STATE.studentGrades[currentRosterId];
let currentGradebookSection = null;
let currentGradebookCriterion = 'quiz';
let currentGradebookAssessmentNumber = 1;
let lmsEmbeddedGradebookSelectedStudentId = '';
let lmsEmbeddedGradebookRosterFilter = '';
let facultyGradebookFilterState = { semester: '1', faculty: '', subjectId: 'all', groupId: 'all' };
let facultyGradebookEnrollmentByStudentId = new Map();
let facultyGradebookScopedGroups = [];

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
    return GRADEBOOK_SCHEME_COMPONENTS.find(component => component.schemeKey === schemeKey) || null;
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
    GRADEBOOK_SCHEME_COMPONENTS.forEach(component => {
        normalized[component.schemeKey] = normalizeGradebookSchemePoints(
            scheme[component.schemeKey],
            GRADEBOOK_DEFAULT_GRADING_SCHEME[component.schemeKey]
        );
        normalized[getGradebookSchemeCountKey(component.schemeKey)] = normalizeGradebookSchemeCount(
            scheme[getGradebookSchemeCountKey(component.schemeKey)],
            component.defaultCount || 1
        );
    });
    return normalized;
}

function getGradebookSchemeTotalPoints(scheme = {}) {
    return GRADEBOOK_SCHEME_COMPONENTS.reduce(
        (sum, component) => sum + Number(normalizeGradebookGradingScheme(scheme)[component.schemeKey] || 0),
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
    const components = GRADEBOOK_SCHEME_COMPONENTS.map(component => {
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
    GRADEBOOK_SCHEME_COMPONENTS.forEach(component => {
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
    GRADEBOOK_SCHEME_COMPONENTS.forEach(component => {
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
    const scheme = readGradebookGradingSchemeFromDom(shell);
    const courseTotal = getGradebookSchemeTotalPoints(scheme);
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
                        ${GRADEBOOK_SCHEME_COMPONENTS.map(component => {
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
    const idPrefix = String(options.idPrefix || '');
    const totalId = String(options.totalId || 'gradebook-scheme-total-points');
    const shellId = String(options.schemeShellId || `${idPrefix}grading-scheme-shell`);
    const shellLabel = String(options.shellLabel || 'Grading scheme');
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
                        ${GRADEBOOK_SCHEME_COMPONENTS.map(component => {
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
                <button type="button" class="kiu-btn-outline" data-gradebook-click="edit-grading-scheme"><i class="fas fa-pen"></i> Edit</button>
                <button type="button" class="kiu-btn-blue" data-gradebook-click="save-grading-scheme" disabled><i class="fas fa-save"></i> Save</button>
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

function getGradebookWeightControlsMarkup(weights, readOnly = false, options = {}) {
    const idPrefix = String(options.idPrefix || '');
    const totalWarningId = String(options.totalWarningId || 'weight-total-warning');
    const shellLabel = String(options.shellLabel || 'Group weights');
    const fields = [
        { key: 'q1', id: `${idPrefix}weight-q1`, label: 'Quiz weight' },
        { key: 'qa', id: `${idPrefix}weight-qa`, label: 'Homework weight' },
        { key: 'mid', id: `${idPrefix}weight-mid`, label: 'Midterm weight' },
        { key: 'fin', id: `${idPrefix}weight-fin`, label: 'Final / Retake weight' }
    ];
    const totalPct = Math.round(fields.reduce((sum, field) => sum + Number(weights?.[field.key] || 0), 0) * 100);
    const totalStateClass = totalPct === 100 ? 'is-balanced' : 'is-warning';
    if (readOnly) {
        return `
            <div class="gb-weight-shell gb-weight-shell-readonly">
                <div class="gb-weight-label">Weight profile</div>
                <div class="gb-weight-pill-row">
                    ${fields.map(field => `
                        <span class="gb-weight-pill">
                            ${escapeHtml(field.label.replace(' weight', ''))}: ${Math.round(Number(weights?.[field.key] || 0) * 100)}%
                        </span>
                    `).join('')}
                </div>
                <div class="gb-weight-total ${totalStateClass}">Total: ${totalPct}%</div>
            </div>
        `;
    }
    return `
        <div class="gb-weight-shell">
            <div class="gb-weight-label">${escapeHtml(shellLabel)}</div>
            <div class="gb-weight-field-grid">
                ${fields.map(field => `
                    <div class="gb-weight-field">
                        <label class="gb-weight-field-label" for="${field.id}">${escapeHtml(field.label)}</label>
                        <input id="${field.id}" class="gb-weight-input" type="number" min="0" max="100" value="${Math.round(Number(weights?.[field.key] || 0) * 100)}" data-gradebook-weight="${field.key}" data-lms-subject-weight-input="${field.key}">
                    </div>
                `).join('')}
            </div>
            <div id="${escapeHtml(totalWarningId)}" class="gb-weight-total ${totalStateClass}">Total: ${totalPct}%</div>
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

function getGradebookSchemeComponentForCriterion(criterionKey) {
    const normalized = normalizeGradebookCriterion(criterionKey);
    return GRADEBOOK_SCHEME_COMPONENTS.find(
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
    const schemeComponent = GRADEBOOK_SCHEME_COMPONENTS.find(
        component => component.criterionKey === normalized || component.altCriterionKey === normalized
    );
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

function parseLmsCourseKeyForGradebook(courseKey) {
    if (typeof parseLmsCourseKey === 'function') {
        return parseLmsCourseKey(courseKey);
    }
    const raw = String(courseKey || '').trim();
    if (!raw.includes('::')) {
        return { courseId: raw, groupId: null, resourceKey: raw, sectionType: '' };
    }
    const [courseId, ...groupParts] = raw.split('::');
    const groupJoined = groupParts.join('::');
    const sectionMatch = groupJoined.match(/^(.*)::(materials|workspace|quiz|monitoring|attendance|calls|concepts|live-quiz)$/i);
    if (sectionMatch) {
        return {
            courseId: courseId || raw,
            groupId: sectionMatch[1] || null,
            resourceKey: raw,
            sectionType: String(sectionMatch[2] || '').toLowerCase()
        };
    }
    return {
        courseId: courseId || raw,
        groupId: groupJoined || null,
        resourceKey: raw,
        sectionType: ''
    };
}

function resolveCanonicalLmsResourceKeyForGradebook(resourceKey) {
    if (typeof resolveCanonicalLmsResourceKey === 'function') {
        return resolveCanonicalLmsResourceKey(resourceKey);
    }
    return String(resourceKey || '').trim();
}

function normalizeLmsQuizAssessmentTypeForGradebook(value = 'quiz') {
    if (typeof normalizeLmsQuizAssessmentType === 'function') {
        return normalizeLmsQuizAssessmentType(value);
    }
    const normalized = String(value || 'quiz').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const aliases = {
        quiz: 'quiz',
        oral: 'oral-quiz',
        oralquiz: 'oral-quiz',
        'oral-quiz': 'oral-quiz',
        midterm: 'midterm',
        'midterm-exam': 'midterm',
        final: 'final',
        'final-exam': 'final',
        retake: 'retake'
    };
    return aliases[normalized] || 'quiz';
}

function getLmsQuizzesForGradebook(resourceKey) {
    if (typeof ensureLmsQuizzesForKey === 'function') {
        return ensureLmsQuizzesForKey(resourceKey);
    }
    const normalizedKey = resolveCanonicalLmsResourceKeyForGradebook(resourceKey);
    const workspace = KIU_STATE.lmsQuizBuilder?.[normalizedKey]
        || KIU_STATE.lmsQuizBuilder?.[String(resourceKey || '').trim()]
        || null;
    if (!workspace || typeof workspace !== 'object') return [];
    return [
        ...(Array.isArray(workspace.drafts) ? workspace.drafts : []),
        ...(Array.isArray(workspace.published) ? workspace.published : []),
        ...(Array.isArray(workspace.closed) ? workspace.closed : [])
    ];
}

function getLmsQuizSubmissionForGradebook(resourceKey, quizId, studentId) {
    if (typeof getLmsQuizSubmission === 'function') {
        return getLmsQuizSubmission(resourceKey, quizId, studentId);
    }
    const normalizedKey = resolveCanonicalLmsResourceKeyForGradebook(resourceKey);
    const workspace = KIU_STATE.lmsQuizBuilder?.[normalizedKey]
        || KIU_STATE.lmsQuizBuilder?.[String(resourceKey || '').trim()]
        || null;
    const store = workspace?.submissions?.[quizId];
    return store && typeof store === 'object' ? (store[String(studentId)] || null) : null;
}

function buildLmsQuizGradebookNoteForGradebook(resourceKey, quiz = {}, noteSuffix = '') {
    if (typeof buildLmsQuizGradebookNote === 'function') {
        return buildLmsQuizGradebookNote(resourceKey, quiz, noteSuffix);
    }
    return [quiz?.title || quiz?.weekLabel || '', noteSuffix || ''].filter(Boolean).join(' - ');
}

function isGradebookLmsQuizRuntimeAvailable() {
    const builder = KIU_STATE.lmsQuizBuilder;
    return Boolean(builder && typeof builder === 'object' && Object.keys(builder).length);
}

function getLmsQuizResourceKeysForCurrentGradebookRoster() {
    if (!isGradebookLmsQuizRuntimeAvailable()) return [];
    const rosterKey = String(currentRosterId || '').trim();
    if (!rosterKey) return [];
    const matches = [];
    Object.keys(KIU_STATE.lmsQuizBuilder || {}).forEach(resourceKey => {
        const parsed = parseLmsCourseKeyForGradebook(resourceKey);
        if (!parsed.courseId || !parsed.groupId) return;
        const enrolledStudents = getEnrolledStudentsForGroup(parsed.courseId, parsed.groupId);
        const candidateRosterKey = resolveGradebookRosterKey(parsed.courseId, parsed.groupId, enrolledStudents);
        if (String(candidateRosterKey) === rosterKey) {
            matches.push(resolveCanonicalLmsResourceKeyForGradebook(resourceKey));
        }
    });
    return [...new Set(matches)];
}

function getLmsQuizResourceKeysForStudentHistory(studentId = '') {
    if (!isGradebookLmsQuizRuntimeAvailable()) return [];
    const normalizedStudentId = String(studentId || '').trim();
    const rosterMatches = getLmsQuizResourceKeysForCurrentGradebookRoster();
    const studentMatches = [];

    Object.keys(KIU_STATE.lmsQuizBuilder || {}).forEach(resourceKey => {
        const normalizedResourceKey = resolveCanonicalLmsResourceKeyForGradebook(resourceKey);
        const workspace = typeof ensureLmsQuizBuilderWorkspace === 'function'
            ? ensureLmsQuizBuilderWorkspace(normalizedResourceKey)
            : (KIU_STATE.lmsQuizBuilder?.[normalizedResourceKey] || KIU_STATE.lmsQuizBuilder?.[resourceKey] || null);
        const hasSubmission = Object.values(workspace?.submissions || {}).some(store =>
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
    const normalizedResourceKey = resolveCanonicalLmsResourceKeyForGradebook(resourceKey);
    const normalizedCriterion = normalizeGradebookCriterion(criterion);
    const quizCriterion = normalizeGradebookCriterion(normalizeLmsQuizAssessmentTypeForGradebook(quiz.assessmentType));
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
        note: buildLmsQuizGradebookNoteForGradebook(
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
    if (studentId && isGradebookLmsQuizRuntimeAvailable()) {
        getLmsQuizResourceKeysForStudentHistory(studentId).forEach(resourceKey => {
            getLmsQuizzesForGradebook(resourceKey).forEach(quiz => {
                const submission = getLmsQuizSubmissionForGradebook(resourceKey, quiz.id, studentId);
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
                    <div class="study-card-history-entry">
                        <div class="study-card-history-entry-head">
                            <div class="study-card-history-entry-main">
                                <div class="study-card-history-entry-badges">
                                    <div class="study-card-history-entry-title">${escapeHtml(displayMeta.title)}</div>
                                    ${pendingReview ? '<span class="study-card-history-entry-pill"><i class="fas fa-triangle-exclamation"></i> Waiting for evaluation</span>' : ''}
                                </div>
                                ${displayMeta.subtitle ? `<div class="study-card-history-entry-subtitle">${escapeHtml(displayMeta.subtitle)}</div>` : ''}
                                <div class="study-card-history-entry-meta">${escapeHtml(formatAssessmentHistoryTimestamp(entry.updatedAt))}${entry.updatedBy ? ` - ${escapeHtml(entry.updatedBy)}` : ''}</div>
                                ${entry.note ? `<div class="study-card-history-entry-note">${escapeHtml(entry.note)}</div>` : ''}
                            </div>
                            <div class="study-card-history-entry-score">${entry.score === null || entry.score === undefined ? 'Pending' : Number(entry.score)}</div>
                        </div>
                        <div class="study-card-history-entry-history">
                            ${entryHistory.map(historyItem => `
                                <div class="study-card-history-entry-history-row">
                                    <span>${escapeHtml(historyItem.action === 'created' ? 'Created' : historyItem.action === 'legacy-import' ? 'Imported' : historyItem.action === 'scored' ? 'Scored' : historyItem.action === 'submitted' ? 'Submitted' : 'Updated')}${historyItem.updatedBy ? ` by ${escapeHtml(historyItem.updatedBy)}` : ''}${historyItem.note ? ` - ${escapeHtml(historyItem.note)}` : ''}</span>
                                    <strong class="study-card-history-entry-history-score">${historyItem.score === null || historyItem.score === undefined ? 'Pending' : Number(historyItem.score)}</strong>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('')
            : '<div class="study-card-history-empty">No recorded scores yet.</div>';

        return `
            <div class="study-card-history-section">
                <div class="study-card-history-section-head">
                    <div>
                        <div class="study-card-history-section-kicker">${escapeHtml(meta.pluralLabel)} History</div>
                        <div class="study-card-history-section-copy">${recordedCount} recorded score${recordedCount === 1 ? '' : 's'}${latestDisplay ? ` - Latest: ${escapeHtml(latestDisplay.title)}` : ''}</div>
                    </div>
                    <div class="study-card-history-section-total">${Number.isFinite(aggregateValue) ? aggregateValue : 0}</div>
                </div>
                <div class="study-card-history-entry-list">
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

function renderStudentEvaluationHistorySections(record) {
    const safeRecord = syncGradeRecordSummaries(ensureGradeRecordHistories(record));
    return getStudentEvaluationHistorySectionDefs(safeRecord).map(meta => {
        const entries = getAssessmentEntries(safeRecord, meta.key);
        const body = entries.length
            ? entries.map(entry => `
                <div class="study-card-history-row">
                    <div class="study-card-history-row-main">
                        <div class="study-card-history-row-title">${escapeHtml(`${meta.label} ${normalizeAssessmentNumber(entry.number, 1)}`)}</div>
                        <div class="study-card-history-row-meta">${escapeHtml(formatAssessmentHistoryTimestamp(entry.updatedAt))}${entry.updatedBy ? ` - ${escapeHtml(entry.updatedBy)}` : ''}</div>
                    </div>
                    <div class="study-card-history-row-actions">
                        <strong class="study-card-history-row-score">${Number(entry.score || 0)}</strong>
                        ${canEdit ? `
                            <button class="lux-secondary-btn study-card-history-row-btn" data-gradebook-click="open-score-edit" data-gradebook-student-id="${escapeHtml(String(studentId))}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-number="${escapeHtml(String(normalizeAssessmentNumber(entry.number, 1)))}" data-gradebook-score="${escapeHtml(String(Number(entry.score || 0)))}" data-gradebook-student-name="${escapeHtml(String(studentName || ''))}">Edit</button>
                        ` : ''}
                    </div>
                </div>
            `).join('')
            : '<div class="study-card-history-empty">No recorded scores yet.</div>';
        return `
            <div class="study-card-history-section">
                <div class="study-card-history-section-head">
                    <div class="study-card-history-section-kicker">${escapeHtml(meta.pluralLabel)} History</div>
                    <div class="study-card-history-section-total">${Number(safeRecord[meta.legacyKey] || 0)}</div>
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
                <div class="study-card-history-row">
                    <div class="study-card-history-row-main">
                        <div class="study-card-history-row-title">${escapeHtml(`${meta.label} ${normalizeAssessmentNumber(entry.number, 1)}`)}</div>
                        <div class="study-card-history-row-meta">${escapeHtml(formatAssessmentHistoryTimestamp(entry.updatedAt))}${entry.updatedBy ? ` - ${escapeHtml(entry.updatedBy)}` : ''}</div>
                    </div>
                    <strong class="study-card-history-row-score">${Number(entry.score || 0)}</strong>
                </div>
            `).join('')
            : '<div class="study-card-history-empty">No recorded scores yet.</div>';
        const sectionId = toDomToken(meta.key);
        const scoreInputId = `eval-score-${toDomToken(studentId)}-${sectionId}`;
        const historyBodyId = `eval-history-${toDomToken(studentId)}-${sectionId}`;
        const nextNumber = entries.length ? normalizeAssessmentNumber(entries[entries.length - 1].number, 1) + 1 : 1;
        const latestSummary = latestEntry
            ? `${escapeHtml(meta.label)} ${normalizeAssessmentNumber(latestEntry.number, 1)}: ${Number(latestEntry.score || 0)}`
            : 'No recorded scores yet.';
        return `
            <div class="study-card-history-section">
                <div class="study-card-history-section-head">
                    <div>
                        <div class="study-card-history-section-kicker">${escapeHtml(meta.pluralLabel || `${meta.label}s`)} History</div>
                        <div class="study-card-history-section-total">Current: ${Number.isFinite(latestValue) ? latestValue : 0}</div>
                        <div class="study-card-history-section-copy">Latest: ${latestSummary}</div>
                    </div>
                    ${canEdit ? `
                        <div class="study-card-history-section-actions">
                            <span class="study-card-history-section-kicker">Next #${nextNumber}</span>
                            <input id="${scoreInputId}" type="number" min="0" max="100" placeholder="Score" class="study-card-history-section-input">
                            <button class="lux-primary-btn study-card-history-section-btn" data-gradebook-click="save-entry" data-gradebook-student-id="${escapeHtml(String(studentId))}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-number="0" data-gradebook-input-id="${escapeHtml(String(scoreInputId))}" data-gradebook-student-name="${escapeHtml(String(studentName || ''))}"><i class="fas fa-save"></i> Add score</button>
                        </div>
                    ` : ''}
                </div>
                <div class="study-card-history-section-toolbar">
                    <button type="button" class="lux-secondary-btn study-card-history-row-btn" data-gradebook-click="toggle-history" data-gradebook-history-id="${escapeHtml(String(historyBodyId))}"><i class="fas fa-clock"></i> History</button>
                    ${meta.custom ? `<button type="button" class="lux-secondary-btn study-card-history-row-btn" data-gradebook-click="remove-custom-section" data-gradebook-student-id="${escapeHtml(String(studentId))}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-student-name="${escapeHtml(String(studentName || ''))}"><i class="fas fa-trash"></i> Remove</button>` : ''}
                </div>
                <div id="${historyBodyId}" hidden>
                    <div class="study-card-history-section-body">${body}</div>
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
                    <div class="gb-eval-entry-card">
                        <div class="gb-eval-entry-head">
                            <div class="gb-eval-entry-main">
                                <div class="gb-eval-entry-badges">
                                    <div class="gb-eval-entry-title">${escapeHtml(displayMeta.title)}</div>
                                    ${linkedQuizSource ? `<span class="gb-eval-entry-pill is-linked">${escapeHtml(getGradebookCriterionMeta(meta.key).label)} ${entryNumber}</span>` : ''}
                                    ${pendingReview ? `<span class="gb-eval-entry-pill is-pending"><i class="fas fa-triangle-exclamation"></i> Needs evaluation</span>` : ''}
                                </div>
                                ${displayMeta.subtitle ? `<div class="gb-eval-entry-subtitle">${escapeHtml(displayMeta.subtitle)}</div>` : ''}
                                <div class="gb-eval-entry-meta">${escapeHtml(formatAssessmentHistoryTimestamp(entry.updatedAt))}${entry.updatedBy ? ` - ${escapeHtml(entry.updatedBy)}` : ''}</div>
                                ${entry.note ? `<div class="gb-eval-entry-note">${escapeHtml(entry.note)}</div>` : ''}
                            </div>
                            <div class="gb-eval-entry-actions">
                                ${hasScore ? `<strong class="gb-eval-entry-score">${Number(entry.score || 0)}</strong>` : `<span class="gb-eval-entry-score is-pending">Pending</span>`}
                                ${canEdit ? `
                                    ${linkedQuizSource ? `
                                        <button class="kiu-btn-outline gb-eval-entry-btn" data-gradebook-click="open-linked-quiz" data-gradebook-student-id="${escapeHtml(String(studentId))}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-number="${escapeHtml(String(entryNumber))}"><i class="fas fa-file-alt"></i> ${pendingReview ? 'Open & Evaluate Quiz' : 'Open Submitted Quiz'}</button>
                                    ` : ''}
                                    ${hasScore ? `
                                        <button class="kiu-btn-outline gb-eval-entry-btn" data-gradebook-click="open-score-edit" data-gradebook-student-id="${escapeHtml(String(studentId))}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-number="${escapeHtml(String(entryNumber))}" data-gradebook-score="${escapeHtml(String(Number(entry.score || 0)))}" data-gradebook-student-name="${escapeHtml(String(studentName || ''))}">Edit points</button>
                                    ` : `
                                        <input id="${scoreInputId}" type="number" min="0" max="${Number(meta.maxScore || 100)}" placeholder="Score" class="gb-eval-entry-input">
                                        <button class="kiu-btn-blue gb-eval-entry-btn gb-eval-entry-btn-primary" data-gradebook-click="save-entry" data-gradebook-student-id="${escapeHtml(String(studentId))}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-number="${escapeHtml(String(entryNumber))}" data-gradebook-input-id="${escapeHtml(String(scoreInputId))}" data-gradebook-student-name="${escapeHtml(String(studentName || ''))}"><i class="fas fa-save"></i> Save</button>
                                    `}
                                    <button class="kiu-btn-outline gb-eval-entry-btn gb-eval-entry-btn-danger" data-gradebook-click="remove-entry" data-gradebook-student-id="${escapeHtml(String(studentId))}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-number="${escapeHtml(String(entryNumber))}" data-gradebook-student-name="${escapeHtml(String(studentName || ''))}"><i class="fas fa-trash"></i> Remove</button>
                                ` : ''}
                                <button type="button" class="kiu-btn-outline gb-eval-entry-btn" data-gradebook-click="toggle-history" data-gradebook-history-id="${escapeHtml(String(entryHistoryId))}">Changes</button>
                            </div>
                    </div>
                        <div id="${entryHistoryId}" hidden class="gb-eval-entry-history">
                            ${entryHistory.map(historyItem => `
                                <div class="gb-eval-entry-history-row">
                                    <span>${escapeHtml(historyItem.action === 'created' ? 'Created' : historyItem.action === 'legacy-import' ? 'Imported' : historyItem.action === 'scored' ? 'Scored' : 'Updated')}${historyItem.updatedBy ? ` by ${escapeHtml(historyItem.updatedBy)}` : ''}</span>
                                    <strong class="gb-eval-entry-history-score">${historyItem.score === null || historyItem.score === undefined ? 'Pending' : Number(historyItem.score)}</strong>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('')
            : '<div class="gb-eval-empty-inline">No recorded scores yet.</div>';

        return `
            <div id="evaluation-section-${sectionId}" class="gb-eval-section-card">
                <div class="gb-eval-section-head">
                    <div>
                        <div class="gb-eval-section-badges">
                            <div class="gb-eval-section-kicker">${escapeHtml(meta.pluralLabel || `${meta.label}s`)} History</div>
                            ${pendingSectionCount ? `<span class="gb-eval-entry-pill is-pending"><i class="fas fa-triangle-exclamation"></i> ${pendingSectionCount} waiting for evaluation</span>` : ''}
                        </div>
                        <div class="gb-eval-section-current">Current: ${Number.isFinite(latestValue) ? latestValue : 0}</div>
                        <div class="gb-eval-section-copy">Latest: ${latestSummary}</div>
                    </div>
                    <div class="gb-eval-section-actions">
                        ${canEdit && meta.custom ? `<button type="button" class="kiu-btn-outline gb-eval-section-btn gb-eval-section-btn-danger" data-gradebook-click="remove-custom-section" data-gradebook-student-id="${escapeHtml(String(studentId))}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-student-name="${escapeHtml(String(studentName || ''))}"><i class="fas fa-trash"></i> Remove</button>` : ''}
                        <button type="button" class="kiu-btn-outline gb-eval-section-btn" data-gradebook-click="toggle-history" data-gradebook-history-id="${escapeHtml(String(historyBodyId))}"><i class="fas fa-clock"></i> History</button>
                        ${canEdit && meta.custom ? `<button type="button" class="kiu-btn-blue gb-eval-section-btn gb-eval-section-btn-primary" data-gradebook-click="create-entry" data-gradebook-student-id="${escapeHtml(String(studentId))}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-student-name="${escapeHtml(String(studentName || ''))}"><i class="fas fa-plus"></i> Add Entry</button>` : ''}
                    </div>
                </div>
                <div id="${historyBodyId}"${isOpen ? '' : ' hidden'}>
                    <div class="gb-eval-section-body">${body}</div>
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
            <button type="button" class="lux-secondary-btn gb-modal-action-btn gb-modal-load-more" data-gradebook-click="open-history" data-gradebook-student-id="${escapeHtml(String(studentId))}" data-gradebook-student-name="${escapeHtml(String(studentName || ''))}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-force-view-only="true">
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

function renderGradebookScoreHistoryPanel(options = {}) {
    const record = ensureGradeRecordHistories(options.record || {});
    const criterion = options.criterion || currentGradebookCriterion;
    const assessmentNumber = normalizeAssessmentNumber(options.assessmentNumber ?? currentGradebookAssessmentNumber, 1);
    const studentId = String(options.studentId || record.id || '');
    const studentName = String(options.studentName || record.name || '');
    const canEdit = options.canEdit === undefined
        ? [USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(getEffectiveUserRole())
        : Boolean(options.canEdit);
    const interactiveHistory = canEdit && !options.readOnlyHistory;
    const { entry, timeline, criterionMeta } = getAssessmentScoreHistoryTimeline(record, criterion, assessmentNumber);
    const maxScore = Number(criterionMeta?.maxScore || 100);
    if (!entry || !timeline.length) {
        return `
            <div class="gb-score-history-panel gb-score-history-panel--empty">
                <div class="gb-empty-state">
                    <i class="fas fa-clock-rotate-left"></i>
                    <strong>No score history yet</strong>
                    <span>Score changes will appear here after you save.</span>
                </div>
            </div>
        `;
    }
    const compactCap = options.compact && options.readOnlyHistory ? 6 : timeline.length;
    const visibleTimeline = timeline.slice(0, compactCap);
    const hiddenTimeline = timeline.slice(compactCap);
    const buildRow = (historyItem, index, timelineRef) => {
        const scoreValue = historyItem.score === null || historyItem.score === undefined
            ? null
            : Number(historyItem.score);
        const isCurrent = index === 0;
        const scoreLabel = scoreValue === null || !Number.isFinite(scoreValue)
            ? 'Pending'
            : `${scoreValue}${maxScore ? ` / ${maxScore}` : ''}`;
        const olderItem = timelineRef[index + 1] || null;
        const changeLabel = formatGradebookScoreHistoryChangeLabel(historyItem, olderItem);
        const changeMarkup = changeLabel
            ? `<div class="gb-score-history-change">${escapeHtml(changeLabel)}</div>`
            : '';
        const rowClass = `gb-score-history-row${isCurrent ? ' is-current' : ''}`;
        const rowBody = `
            <div class="gb-score-history-scoreline">
                <strong>${escapeHtml(scoreLabel)}</strong>
                ${isCurrent ? '<span class="gb-status-badge lux-status-pill is-graded">Current</span>' : ''}
            </div>
            ${changeMarkup}
            <div class="gb-score-history-meta">
                <span>${escapeHtml(formatAssessmentHistoryTimestamp(historyItem.updatedAt))}</span>
                ${historyItem.updatedBy ? `<span>${escapeHtml(historyItem.updatedBy)}</span>` : ''}
            </div>
        `;
        if (!interactiveHistory) {
            return `<div class="${rowClass}">${rowBody}</div>`;
        }
        const scoreAttr = Number.isFinite(scoreValue) ? String(scoreValue) : '';
        return `
            <button type="button" class="${rowClass}"
                data-gradebook-click="open-score-edit"
                data-gradebook-student-id="${escapeHtml(studentId)}"
                data-gradebook-criterion="${escapeHtml(String(criterion))}"
                data-gradebook-number="${escapeHtml(String(assessmentNumber))}"
                data-gradebook-score="${escapeHtml(scoreAttr)}"
                data-gradebook-student-name="${escapeHtml(studentName)}"
                title="Change this score">
                ${rowBody}
            </button>
        `;
    };
    const visibleRows = visibleTimeline.map((historyItem, index) => buildRow(historyItem, index, timeline)).join('');
    const hiddenRows = hiddenTimeline.length
        ? hiddenTimeline.map((historyItem, index) => buildRow(historyItem, index + visibleTimeline.length, timeline)).join('')
        : '';
    const expandToggle = hiddenTimeline.length
        ? `<button type="button" class="gb-score-history-toggle" data-gradebook-click="toggle-score-history" data-gradebook-expand-label="Show all ${timeline.length} changes" data-gradebook-collapse-label="Show fewer changes">Show all ${timeline.length} changes</button>`
        : '';
    return `
        <div class="gb-score-history-panel${options.compact ? ' is-compact' : ''}">
            <div class="gb-score-history-list">
                ${visibleRows}
                ${hiddenRows ? `<div class="gb-score-history-more" hidden>${hiddenRows}</div>` : ''}
            </div>
            ${expandToggle}
        </div>
    `;
}

function refreshGradebookAfterStaffScoreChange(options = {}) {
    if (options.closeScoreEditModal !== false) {
        document.getElementById('gradebook-score-edit-modal')?.remove();
    }
    if (isFacultyStandaloneGradebookContext()) {
        loadFacultyGradebookAggregateRoster();
    }
    if (isStaffModernGradebookContext()) {
        initStaffModernGradebook();
    } else {
        initGradebook();
    }
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

function persistStudentEvaluationEntryOnRoster(rosterKey, studentId, criterion, number, scoreValue, studentName = '', options = {}) {
    const rosterId = String(rosterKey || currentRosterId || '').trim();
    if (!rosterId) return null;
    const roster = Array.isArray(KIU_STATE.studentGrades?.[rosterId]) ? KIU_STATE.studentGrades[rosterId] : [];
    const index = roster.findIndex(entry => String(entry.id) === String(studentId));
    const existing = index >= 0 ? roster[index] : null;
    if (!existing) return null;
    const numericScore = Number(scoreValue);
    if (!Number.isFinite(numericScore)) return null;
    const safeRecord = ensureGradeRecordHistories(existing);
    const normalizedCriterion = normalizeGradebookCriterion(criterion);
    const criterionMeta = getGradebookCriterionMeta(normalizedCriterion, safeRecord);
    const entries = getAssessmentEntries(safeRecord, normalizedCriterion);
    const targetNumber = Number.isFinite(Number(number)) && Number(number) > 0
        ? normalizeAssessmentNumber(number, 1)
        : (entries.length ? normalizeAssessmentNumber(entries[entries.length - 1].number, 1) + 1 : 1);
    const saveMode = String(options.saveMode || '').trim();
    const isAdditive = saveMode === 'additive';
    const entry = getDisplayAssessmentEntryForNumber(safeRecord, normalizedCriterion, targetNumber)
        || getAssessmentEntryForNumber(safeRecord, normalizedCriterion, targetNumber);
    const pendingReview = entry
        ? isAssessmentEntryPendingReview(safeRecord, normalizedCriterion, targetNumber)
        : false;
    const existingScore = entry && !pendingReview && entry.score !== null && entry.score !== undefined && entry.score !== ''
        ? Number(entry.score)
        : null;
    const maxScore = Number.isFinite(Number(criterionMeta?.maxScore)) ? Number(criterionMeta.maxScore) : 100;
    let finalScore = numericScore;
    if (isAdditive) {
        finalScore = Math.max(0, Math.min(maxScore, (Number.isFinite(existingScore) ? existingScore : 0) + numericScore));
    } else {
        finalScore = Math.max(0, Math.min(maxScore, numericScore));
    }
    const historyNote = buildGradebookScoreChangeNote(existingScore, finalScore, options.note);
    const updated = setAssessmentScoreOnRecord(safeRecord, normalizedCriterion, targetNumber, finalScore, {
        updatedBy: getSimulatedUserName(),
        note: historyNote,
        historyAction: String(options.historyAction || '').trim() || (Number.isFinite(existingScore) && existingScore !== finalScore ? 'updated' : 'scored')
    });
    if (index >= 0) {
        roster[index] = updated;
    } else {
        roster.push(updated);
    }
    KIU_STATE.studentGrades[rosterId] = roster.map(student => ensureGradeRecordHistories(student));
    return updated;
}

function persistStudentEvaluationEntry(studentId, criterion, number, scoreValue, studentName = '', options = {}) {
    if (![USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(getEffectiveUserRole())) {
        alert('Only professors or teaching assistants can save evaluation scores.');
        return;
    }
    const numericScore = Number(scoreValue);
    if (!Number.isFinite(numericScore)) {
        alert('Please enter a score first.');
        return;
    }
    if (isFacultyStandaloneGradebookContext()) {
        const rosterKeys = resolveFacultyGradebookRosterKeysForStudent(studentId);
        if (!rosterKeys.length) {
            alert('Student not in current filter scope.');
            return;
        }
        let lastUpdated = null;
        rosterKeys.forEach(rosterKey => {
            const updated = persistStudentEvaluationEntryOnRoster(
                rosterKey,
                studentId,
                criterion,
                number,
                scoreValue,
                studentName,
                options
            );
            if (updated) lastUpdated = updated;
        });
        if (!lastUpdated) {
            alert('Student record not found.');
            return;
        }
        saveState();
        if (options.skipModal || isStaffModernGradebookContext()) {
            refreshGradebookAfterStaffScoreChange({ closeScoreEditModal: true });
            return;
        }
        return;
    }
    const updated = persistStudentEvaluationEntryOnRoster(currentRosterId, studentId, criterion, number, scoreValue, studentName, options);
    if (!updated) {
        alert('Student record not found.');
        return;
    }
    mockStudents = KIU_STATE.studentGrades[currentRosterId].map(student => ensureGradeRecordHistories(student));
    saveState();
    if (options.skipModal || isStaffModernGradebookContext()) {
        refreshGradebookAfterStaffScoreChange({ closeScoreEditModal: true });
        return;
    }
    initGradebook();
    openStudentEvaluationHistoryModal(studentId, studentName || updated.name || '', normalizeGradebookCriterion(criterion));
}

function openGradebookScoreEditModal(studentId, criterion, number, currentScore, studentName = '') {
    if (![USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(getEffectiveUserRole())) {
        alert('Only professors or teaching assistants can save evaluation scores.');
        return;
    }
    document.getElementById('gradebook-score-edit-modal')?.remove();
    const inputId = `gradebook-score-edit-${toDomToken(studentId)}-${toDomToken(criterion)}-${normalizeAssessmentNumber(number, 1)}`;
    const reasonId = `${inputId}-reason`;
    const hasExistingScore = currentScore !== null && currentScore !== undefined && currentScore !== ''
        && Number.isFinite(Number(currentScore));
    const scoreValue = hasExistingScore ? String(currentScore) : '';
    const overlay = document.createElement('div');
    overlay.id = 'gradebook-score-edit-modal';
    overlay.className = 'gb-score-edit-overlay';
    overlay.onclick = event => {
        if (event.target === overlay) overlay.remove();
    };
    overlay.innerHTML = `
        <div class="gb-score-edit-card">
            <div>
                <div class="gb-modern-kicker">${hasExistingScore ? 'Change score' : 'Set score'}</div>
                <h3>${escapeHtml(getGradebookCriterionMeta(criterion).label)} ${escapeHtml(String(normalizeAssessmentNumber(number, 1)))}</h3>
                <p>${escapeHtml(studentName || studentId)} · saved scores stay in history.</p>
            </div>
            <label>Score
                <input id="${inputId}" type="number" min="0" max="${Number(getGradebookCriterionMeta(criterion).maxScore || 100)}" value="${escapeHtml(scoreValue)}" placeholder="Enter score">
            </label>
            <label>Note <span class="gb-score-edit-optional">(optional)</span>
                <textarea id="${reasonId}" placeholder="Optional note"></textarea>
            </label>
            <div class="gb-score-edit-actions">
                <button type="button" data-gradebook-click="close-score-edit">Cancel</button>
                <button type="button" class="is-primary" data-gradebook-click="save-score-edit" data-gradebook-student-id="${escapeHtml(String(studentId))}" data-gradebook-criterion="${escapeHtml(String(criterion))}" data-gradebook-number="${escapeHtml(String(normalizeAssessmentNumber(number, 1)))}" data-gradebook-input-id="${escapeHtml(String(inputId))}" data-gradebook-reason-id="${escapeHtml(String(reasonId))}" data-gradebook-student-name="${escapeHtml(String(studentName || ''))}"><i class="fas fa-save"></i> Save score</button>
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
    const reason = String(document.getElementById(reasonId)?.value || '').trim();
    persistStudentEvaluationEntry(studentId, criterion, number, numericScore, studentName, {
        skipModal: true,
        note: reason
    });
    refreshGradebookAfterStaffScoreChange({ closeScoreEditModal: true });
}

function changeStudentEvaluationEntryScore(studentId, criterion, number, currentScore, studentName = '') {
    openGradebookScoreEditModal(studentId, criterion, number, currentScore, studentName);
}

function saveStudentEvaluationEntry(studentId, criterion, numberInputId, scoreInputId, studentName = '', saveMode = '') {
    const number = typeof numberInputId === 'number' || String(numberInputId || '').match(/^\d+$/)
        ? normalizeAssessmentNumber(numberInputId, 0)
        : (numberInputId ? normalizeAssessmentNumber(document.getElementById(numberInputId)?.value, 0) : 0);
    const scoreValue = Number(document.getElementById(scoreInputId)?.value);
    persistStudentEvaluationEntry(studentId, criterion, number, scoreValue, studentName, { saveMode });
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
window.getAssessmentScoreHistoryTimeline = getAssessmentScoreHistoryTimeline;
window.renderGradebookScoreHistoryPanel = renderGradebookScoreHistoryPanel;
window.refreshGradebookAfterStaffScoreChange = refreshGradebookAfterStaffScoreChange;
window.persistStudentEvaluationEntry = persistStudentEvaluationEntry;
window.saveStudentEvaluationEntry = saveStudentEvaluationEntry;
window.getGradebookWeightProfileForRoster = getGradebookWeightProfileForRoster;
window.getGradebookWeightProfileForSubject = getGradebookWeightProfileForSubject;
window.setGradebookSubjectWeightProfile = setGradebookSubjectWeightProfile;
window.getGradebookSchemeForRoster = getGradebookSchemeForRoster;
window.getGradebookSubjectGradingScheme = getGradebookSubjectGradingScheme;
window.setGradebookSubjectGradingScheme = setGradebookSubjectGradingScheme;
window.getGradebookGradingSchemeControlsMarkup = getGradebookGradingSchemeControlsMarkup;
window.renderGradebookSchemeReferenceTable = renderGradebookSchemeReferenceTable;
window.getGradebookCategoryMaxForCriterion = getGradebookCategoryMaxForCriterion;
window.getGradebookModernSummary = getGradebookModernSummary;
window.renderGradebookModernTranscript = renderGradebookModernTranscript;
window.renderGradebookModernTimeline = renderGradebookModernTimeline;
window.resolveGradebookStudentRecord = resolveGradebookStudentRecord;
window.readGradebookGradingSchemeFromDom = readGradebookGradingSchemeFromDom;
window.computeGradebookSchemeBreakdown = computeGradebookSchemeBreakdown;
window.getGradebookSchemeTotalPoints = getGradebookSchemeTotalPoints;
window.getGradebookSchemePerItemMax = getGradebookSchemePerItemMax;
window.getGradebookSchemeItemCount = getGradebookSchemeItemCount;
window.formatGradebookSchemePerItemMax = formatGradebookSchemePerItemMax;
window.setGradebookSchemeShellEditing = setGradebookSchemeShellEditing;
window.refreshGradebookSchemeShellDerivedValues = refreshGradebookSchemeShellDerivedValues;
window.saveGradebookGradingSchemeFromShell = saveGradebookGradingSchemeFromShell;
window.editGradebookGradingSchemeFromElement = editGradebookGradingSchemeFromElement;
window.saveGradebookGradingSchemeFromElement = saveGradebookGradingSchemeFromElement;
window.getGradebookWeightControlsMarkup = getGradebookWeightControlsMarkup;
window.readGradebookWeightProfileFromDom = readGradebookWeightProfileFromDom;
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
            const rosterId = String(actionButton.dataset.gradebookRosterId || '').trim();
            if (rosterId) {
                currentRosterId = rosterId;
            }
            openStudentEvaluationHistoryModal(
                String(actionButton.dataset.gradebookStudentId || ''),
                String(actionButton.dataset.gradebookStudentName || ''),
                String(actionButton.dataset.gradebookCriterion || ''),
                actionButton.dataset.gradebookForceViewOnly === 'true',
                rosterId
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
        if (action === 'lms-gb-select-student') {
            lmsEmbeddedGradebookSelectedStudentId = String(actionButton.dataset.gradebookStudentId || '').trim();
            if (isStaffModernGradebookContext()) {
                initStaffModernGradebook();
            }
            return;
        }
        if (action === 'toggle-score-history') {
            const panel = actionButton.closest('.gb-score-history-panel');
            const more = panel?.querySelector('.gb-score-history-more');
            if (!more) return;
            const expanded = more.hidden;
            more.hidden = !expanded;
            actionButton.textContent = expanded
                ? (actionButton.dataset.gradebookCollapseLabel || 'Show fewer changes')
                : (actionButton.dataset.gradebookExpandLabel || 'Show all changes');
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
            const scoreAttr = actionButton.getAttribute('data-gradebook-score');
            const currentScore = scoreAttr === null || scoreAttr === '' ? null : Number(scoreAttr);
            openGradebookScoreEditModal(
                String(actionButton.dataset.gradebookStudentId || ''),
                String(actionButton.dataset.gradebookCriterion || ''),
                Number(actionButton.dataset.gradebookNumber || 0),
                currentScore,
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
                String(actionButton.dataset.gradebookStudentName || ''),
                String(actionButton.dataset.gradebookSaveMode || '')
            );
            return;
        }
        if (action === 'open-subject-weights') {
            openLmsSubjectWeightsModal();
            return;
        }
        if (action === 'close-subject-weights') {
            closeLmsSubjectWeightsModal();
            return;
        }
        if (action === 'edit-grading-scheme') {
            editGradebookGradingSchemeFromElement(actionButton);
            return;
        }
        if (action === 'save-grading-scheme') {
            const shell = actionButton.closest('[data-gb-scheme-shell]');
            const inSubjectModal = Boolean(shell?.closest('#lms-subject-weights-modal'));
            const saved = saveGradebookGradingSchemeFromElement(actionButton);
            if (!saved) return;
            const groupCount = getLmsSubjectGroupsForBulkWeights(saved.subjectKey).length;
            if (inSubjectModal) {
                closeLmsSubjectWeightsModal();
            }
            if (isStaffModernGradebookContext()) {
                initStaffModernGradebook();
            } else if (document.getElementById('gradebook-body')) {
                initGradebook();
            }
            alert(`Grading scheme saved for this subject (${saved.courseTotal} points, ${groupCount} group${groupCount === 1 ? '' : 's'}).`);
            return;
        }
        if (action === 'apply-subject-weights') {
            applyLmsSubjectWeightsToSelectedGroups();
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
            if (isFacultyStandaloneGradebookContext()) {
                if (target.id === 'fs-filter-subject') {
                    populateFacultyGradebookGroupFilter();
                }
                loadFacultyGradebookAggregateRoster();
                initStaffModernGradebook();
            } else {
            renderGradebookRosterSelection();
            }
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
            return;
        }
    });

    document.addEventListener('input', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) return;
        if (target.matches('[data-lms-subject-scheme-input], [data-lms-subject-scheme-count]')) {
            const shell = target.closest('[data-gb-scheme-shell]');
            if (shell) refreshGradebookSchemeShellDerivedValues(shell);
            return;
        }
        if (!target.matches('[data-lms-gb-roster-filter]')) return;
        lmsEmbeddedGradebookRosterFilter = String(target.value || '');
        if (isStaffModernGradebookContext()) {
            initStaffModernGradebook();
        }
    });
}
window.bindStandaloneGradebookShell = bindStandaloneGradebookShell;
window.closeGradebookSpreadsheet = closeGradebookSpreadsheet;
window.resolveGradebookSpreadsheetShell = resolveGradebookSpreadsheetShell;
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

function openStudentEvaluationHistoryModal(studentId, studentName = '', focusSectionKey = '', forceViewOnly = false, rosterId = '') {
    const resolvedRosterId = String(rosterId || currentRosterId || '').trim();
    if (resolvedRosterId) {
        currentRosterId = resolvedRosterId;
    }
    const rosterSource = resolveGradebookStudentRecord(studentId, resolvedRosterId)
        || { id: studentId, name: studentName || studentId };
    const record = syncGradeRecordSummaries(ensureGradeRecordHistories(rosterSource));
    const displayName = record.name || studentName || record.id;
    const scheme = getGradebookSchemeForRoster(resolvedRosterId);
    const modalSummary = getGradebookModernSummary(record, scheme, { rosterId: resolvedRosterId });
    const existing = document.getElementById('student-evaluation-history-modal');
    if (existing) existing.remove();
    const canEdit = !forceViewOnly && [USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(getEffectiveUserRole());
    const customSectionInputId = `gradebook-custom-section-${toDomToken(record.id)}`;
    const customSectionPanelId = `gradebook-custom-panel-${toDomToken(record.id)}`;
    const namedAttemptCriterionId = `gradebook-named-attempt-type-${toDomToken(record.id)}`;
    const namedAttemptTitleId = `gradebook-named-attempt-title-${toDomToken(record.id)}`;
    const evaluationDefs = getStudentEvaluationHistorySectionDefs(record, resolvedRosterId);
    const focusKey = normalizeGradebookCriterion(focusSectionKey || '');
    const focusMeta = focusKey ? evaluationDefs.find(meta => normalizeGradebookCriterion(meta.key) === focusKey) : null;

    const summaryCards = modalSummary.sections.map(section => {
        const latest = section.latestEntry ? getAssessmentEntryDisplayContext(section.meta.key, section.latestEntry) : null;
        const status = getGradebookEntryStatus(modalSummary.record, section.meta, section.latestEntry);
        const isActiveCategory = focusKey && normalizeGradebookCriterion(section.meta.key) === focusKey;
        const scoreText = status.key === 'pending' ? 'Pending' : Number(section.aggregate || 0);
        return `
        <button type="button" class="gb-modal-category-card ${isActiveCategory ? 'is-active' : ''}" data-gradebook-click="open-history" data-gradebook-student-id="${escapeHtml(String(record.id))}" data-gradebook-student-name="${escapeHtml(String(displayName))}" data-gradebook-criterion="${escapeHtml(String(section.meta.key))}" data-gradebook-force-view-only="true"${resolvedRosterId ? ` data-gradebook-roster-id="${escapeHtml(resolvedRosterId)}"` : ''}>
            <div class="gb-modal-category-top">
                <span>${escapeHtml(section.meta.pluralLabel || section.meta.label)}</span>
                <em class="gb-status-badge lux-status-pill is-${escapeHtml(status.key)}">${escapeHtml(status.label)}</em>
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
    overlay.className = 'gb-modal-overlay';
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
                <button class="lux-secondary-btn gb-modal-action-btn gb-modal-close" data-gradebook-click="close-history-modal"><i class="fas fa-times"></i> Close</button>
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
                        <div id="${customSectionPanelId}" class="gb-custom-section-panel" hidden>
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
    const overviewRosters = document.getElementById('faculty-overview-rosters');
    const overviewEdited = document.getElementById('faculty-overview-edited');
    const overviewSaved = document.getElementById('faculty-overview-saved');
    const stageStatus = document.getElementById('faculty-stage-status');
    if (overviewRosters) {
        overviewRosters.innerHTML = `<i class="fas fa-book"></i> ${groups.length} roster${groups.length === 1 ? '' : 's'}`;
    }
    if (overviewEdited) {
        overviewEdited.innerHTML = '<i class="fas fa-pen-to-square"></i> 0 grades edited';
    }
    if (overviewSaved) {
        overviewSaved.innerHTML = '<i class="fas fa-check"></i> Ready to save';
    }
    if (stageStatus) {
        stageStatus.textContent = groups.length ? 'Roster view active' : 'No rosters available';
    }
    const title = currentUser?.role === USER_ROLES.ADMIN ? 'Faculty Gradebook Rosters' : 'My Active Rosters';
    const subtitle = currentUser?.role === USER_ROLES.ADMIN
        ? 'Faculty-scoped sections available for review and intervention.'
        : 'Choose one of your assigned teaching groups to review grades.';

    if (!groups.length) {
        container.innerHTML = `
            <div class="gb-roster-hero">
                <div class="gb-roster-eyebrow">Gradebook</div>
                <div class="gb-roster-hero-title"><i class="fas fa-chalkboard-teacher"></i> ${title}</div>
                <div class="gb-roster-hero-copy">${subtitle}</div>
            </div>
            ${typeof renderLmsRouteEmptyState === 'function'
                ? renderLmsRouteEmptyState('No Rosters Available', 'No gradebook groups are available for the current session.', 'fa-inbox')
                : `<div class="lms-route-empty"><div class="lms-route-empty-title">No Rosters Available</div><div class="lms-route-empty-copy">No gradebook groups are available for the current session.</div></div>`}
        `;
        return;
    }

    const cards = groups.map(group => `
        <div class="course-card lms-route-card lms-route-panel-compact gb-roster-card" data-gradebook-click="open-section" data-gradebook-course-id="${escapeHtml(String(group.courseId))}" data-gradebook-group-id="${escapeHtml(String(group.groupId))}" data-gradebook-title="${escapeHtml(`${group.subjectName} | ${group.groupName} | ${String(group.day || '').trim()} ${String(group.time || '').trim()}`)}">
            <div class="gb-roster-card-hero">
                <div class="gb-roster-card-head">
                    <div>
                        <div class="gb-roster-eyebrow">${escapeHtml(group.groupName)}</div>
                        <div class="gb-roster-card-title">${escapeHtml(group.subjectName)}</div>
                    </div>
                    <span class="lux-pill gb-roster-count-pill"><i class="fas fa-users"></i> ${group.enrolledCount} students</span>
                </div>
            </div>
            <div class="gb-roster-card-body">
                <div class="gb-roster-kv-grid">
                    <div class="lms-route-kv gb-roster-kv">
                        <div class="gb-roster-kv-label">Schedule</div>
                        <div class="gb-roster-kv-value">${escapeHtml(`${group.day || 'TBD'} ${group.time || ''}`.trim())}</div>
                    </div>
                    <div class="lms-route-kv gb-roster-kv">
                        <div class="gb-roster-kv-label">Room</div>
                        <div class="gb-roster-kv-value">${escapeHtml(group.room || 'TBD')}</div>
                    </div>
                    <div class="lms-route-kv gb-roster-kv">
                        <div class="gb-roster-kv-label">Semester</div>
                        <div class="gb-roster-kv-value">${escapeHtml(group.semester || KIU_STATE.activeSemester || 1)}</div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = `
        <div class="gb-roster-hero">
            <div class="gb-roster-eyebrow">Gradebook</div>
            <div class="gb-roster-hero-title"><i class="fas fa-chalkboard-teacher"></i> ${title}</div>
            <div class="gb-roster-hero-copy">${subtitle}</div>
        </div>
        <div class="gb-roster-card-grid">
            ${cards}
        </div>
    `;
}

function renderGradebookLoadFallback(message = 'This roster currently has no resolved grade rows.') {
    const controlsRoot = document.getElementById('gradebook-assessment-controls');
    const studentViewRoot = document.getElementById('gradebook-student-view');
    const theadRow = document.querySelector('#gradebook-table thead tr');
    const tbody = document.getElementById('gradebook-body');
    const table = document.getElementById('gradebook-table');

    if (studentViewRoot) {
        studentViewRoot.innerHTML = '';
        setGradebookShellVisibility(studentViewRoot, false);
    }
    setGradebookShellVisibility(table, true, 'table');
    if (controlsRoot) {
        controlsRoot.innerHTML = `
            <div class="lms-route-empty gb-sheet-empty">
                <div class="lms-route-empty-title">Grade rows unavailable</div>
                <div class="lms-route-empty-copy">${escapeHtml(message)}</div>
                <div class="lms-route-empty-actions">
                    <button type="button" class="lux-secondary-btn" data-gradebook-action="back"><i class="fas fa-arrow-left"></i> Back to Rosters</button>
                </div>
            </div>
        `;
    }
    if (theadRow) {
        theadRow.innerHTML = `
            <th class="gb-roster-head-cell gb-roster-head-cell--left">Student ID</th>
            <th class="gb-roster-head-cell gb-roster-head-cell--left">Student Name</th>
            <th>Overall Score</th>
            <th>Letter Grade</th>
            <th>Quiz Status</th>
            <th class="gb-roster-head-cell gb-roster-head-cell--left">History</th>
        `;
    }
    if (tbody) {
        tbody.innerHTML = `
            <tr class="gb-roster-empty-row">
                <td colspan="6">
                    <div class="lms-route-empty gb-sheet-empty">
                        <div class="lms-route-empty-title">No student records resolved</div>
                        <div class="lms-route-empty-copy">${escapeHtml(message)}</div>
                    </div>
                </td>
            </tr>
        `;
        syncGradebookVisualCustomProperties(tbody);
    }
    const warn = document.getElementById('weight-total-warning');
    if (warn) {
        warn.innerText = 'Total: 100%';
        warn.classList.remove('is-warning');
        warn.classList.add('is-balanced');
    }
}

function loadGroupStudents(groupId, courseId = null) {
    try {
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
    } catch (error) {
        console.warn('Could not load gradebook roster.', error);
        currentRosterId = String(courseId || groupId || currentRosterId || 'default-roster').trim() || 'default-roster';
        mockStudents = [];
        renderGradebookLoadFallback('The roster data could not be resolved. Please return to the roster list and try a different section.');
    }
}

function getGradebookSpreadsheetShellMarkup() {
    return `
        <div id="gradebook-spreadsheet-view">
            <div class="gb-sheet-head">
                <div class="gb-sheet-title" id="dynamic-gb-title">Open a roster to begin</div>
                <div class="gb-sheet-copy">Select a criterion, enter the assessment number, and use the table to update grades or inspect history.</div>
            </div>

            <div class="gb-sheet-scheme-slot" id="gradebook-sheet-scheme-controls">
                <div class="gb-sheet-copy">Grading scheme loads when a roster is opened.</div>
            </div>

            <div id="gradebook-assessment-controls" class="gb-sheet-controls"></div>

            <div class="gb-sheet-layout">
                <div class="gb-sheet-table-shell">
                    <div class="gb-sheet-table-scroll">
                        <table id="gradebook-table">
                            <thead><tr></tr></thead>
                            <tbody id="gradebook-body"></tbody>
                        </table>
                    </div>
                </div>
                <aside class="gb-sheet-audit">
                    <div class="gb-sheet-audit-head"><i class="fas fa-clock"></i> Audit Trail</div>
                    <div id="audit-logs" class="gb-sheet-audit-list"><div class="gb-sheet-audit-empty"><i class="fas fa-pen-to-square"></i><span>No edits yet.</span></div></div>
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

function resolveGradebookSpreadsheetShell() {
    const luxShell = ensureGradebookSpreadsheetShell();
    if (luxShell) return luxShell;
    if (typeof ensureLmsGradebookShell === 'function') {
        ensureLmsGradebookShell();
    }
    return document.getElementById('gradebook-spreadsheet-view');
}

function setGradebookShellVisibility(element, shown) {
    if (!element) return;
    element.hidden = !shown;
}

function openGradebookSection(courseId, groupId, titleString = '') {
    currentGradebookSection = { courseId, groupId };
    setGradebookShellVisibility(document.getElementById('lux-roster-view'), false);
    setGradebookShellVisibility(document.getElementById('gradebook-roster-selection'), false);
    const spreadsheetShell = resolveGradebookSpreadsheetShell();
    const luxSpreadsheetView = document.getElementById('lux-spreadsheet-view');
    if (luxSpreadsheetView) setGradebookShellVisibility(luxSpreadsheetView, true);
    if (spreadsheetShell) setGradebookShellVisibility(spreadsheetShell, true);
    setGradebookShellVisibility(document.getElementById('faculty-back-btn'), true, 'inline-flex');
    setGradebookShellVisibility(document.getElementById('faculty-save-btn'), true, 'inline-flex');
    const subject = getDomain().subjectsById?.[courseId] || KIU_STATE.curriculum.find(item => item.id === courseId);
    const group = (KIU_STATE.availableGroups?.[courseId] || []).find(item => item.id === groupId) || {};
    document.getElementById('dynamic-gb-title').innerText = titleString || `${subject?.name || courseId} | ${group.name || groupId} | ${group.day || ''} ${group.time || ''}`;
    loadGroupStudents(groupId, courseId);
}

const KIU_GRADEBOOK_STAFF_RETURN_KEY = 'KIU_GRADEBOOK_STAFF_RETURN';

function persistGradebookStaffReturnContext() {
    const staffRole = typeof getEffectiveUserRole === 'function'
        ? getEffectiveUserRole()
        : (currentUserRole || currentUser?.role || '');
    if (![USER_ROLES.ADMIN, USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(staffRole)) return false;
    const activeUserId = typeof getCurrentUserId === 'function'
        ? getCurrentUserId()
        : (KIU_STATE?.auth?.activeUserId || currentUser?.id || '');
    try {
        sessionStorage.setItem(KIU_GRADEBOOK_STAFF_RETURN_KEY, JSON.stringify({
            staffRole,
            activeUserId: String(activeUserId || ''),
            returnUrl: `faculty-gradebook.html${window.location.search || ''}${window.location.hash || ''}`,
            savedAt: Date.now()
        }));
        return true;
    } catch (error) {
        console.warn('Could not persist gradebook staff return context.', error);
        return false;
    }
}

function restoreGradebookStaffReturnContextIfNeeded() {
    if (!isFacultyStandaloneGradebookContext()) return false;
    let raw = '';
    try {
        raw = sessionStorage.getItem(KIU_GRADEBOOK_STAFF_RETURN_KEY) || '';
    } catch (error) {
        return false;
    }
    if (!raw) return false;
    let context = null;
    try {
        context = JSON.parse(raw);
    } catch (error) {
        try { sessionStorage.removeItem(KIU_GRADEBOOK_STAFF_RETURN_KEY); } catch (e) {}
        return false;
    }
    const staffRole = String(context?.staffRole || '').trim().toLowerCase();
    if (![USER_ROLES.ADMIN, USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(staffRole)) {
        try { sessionStorage.removeItem(KIU_GRADEBOOK_STAFF_RETURN_KEY); } catch (e) {}
        return false;
    }
    const currentRole = typeof getEffectiveUserRole === 'function'
        ? getEffectiveUserRole()
        : (currentUserRole || '');
    if (currentRole === staffRole) {
        try { sessionStorage.removeItem(KIU_GRADEBOOK_STAFF_RETURN_KEY); } catch (e) {}
        return false;
    }
    try {
        currentUserRole = staffRole;
        localStorage.setItem('currentUserRole', staffRole);
        if (currentUser?.role === USER_ROLES.ADMIN && staffRole !== USER_ROLES.ADMIN) {
            sessionStorage.setItem(ACTIVE_ROLE_IMPERSONATION_KEY, '1');
        } else {
            sessionStorage.removeItem(ACTIVE_ROLE_IMPERSONATION_KEY);
        }
    } catch (error) {
        console.warn('Could not restore gradebook staff role.', error);
    }
    if (context.activeUserId && typeof setActiveSessionUser === 'function') {
        setActiveSessionUser(context.activeUserId);
    } else if (typeof setActiveSessionUserByRole === 'function') {
        setActiveSessionUserByRole(staffRole);
    }
    if (typeof syncPortalBackendImpersonation === 'function') {
        syncPortalBackendImpersonation(staffRole);
    }
    if (typeof resetRoleSwitchViewState === 'function') {
        resetRoleSwitchViewState();
    }
    if (typeof refreshShellIdentity === 'function') {
        refreshShellIdentity();
    }
    try { sessionStorage.removeItem(KIU_GRADEBOOK_STAFF_RETURN_KEY); } catch (e) {}
    return true;
}

window.persistGradebookStaffReturnContext = persistGradebookStaffReturnContext;
window.restoreGradebookStaffReturnContextIfNeeded = restoreGradebookStaffReturnContextIfNeeded;

function previewGradebookStudentAccount(studentId, studentName = '') {
    if (![USER_ROLES.ADMIN, USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(getEffectiveUserRole())) {
        alert('Only staff can open student impersonation from gradebook.');
        return;
    }
    persistGradebookStaffReturnContext();
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
    setGradebookShellVisibility(document.getElementById('lux-roster-view'), false);
    setGradebookShellVisibility(document.getElementById('gradebook-roster-selection'), false);
    const spreadsheetShell = resolveGradebookSpreadsheetShell();
    const luxSpreadsheetView = document.getElementById('lux-spreadsheet-view');
    if (luxSpreadsheetView) setGradebookShellVisibility(luxSpreadsheetView, true);
    if (spreadsheetShell) setGradebookShellVisibility(spreadsheetShell, true);
    setGradebookShellVisibility(document.getElementById('faculty-back-btn'), true, 'inline-flex');
    setGradebookShellVisibility(document.getElementById('faculty-save-btn'), true, 'inline-flex');
    document.getElementById('dynamic-gb-title').innerText = titleString;
    loadGroupStudents(groupId);
}

function closeGradebookSpreadsheet() {
    const spreadsheetShell = resolveGradebookSpreadsheetShell();
    if (spreadsheetShell) setGradebookShellVisibility(spreadsheetShell, false);
    setGradebookShellVisibility(document.getElementById('lux-spreadsheet-view'), false);
    setGradebookShellVisibility(document.getElementById('lux-roster-view'), true);
    setGradebookShellVisibility(document.getElementById('gradebook-roster-selection'), true, 'block');
    setGradebookShellVisibility(document.getElementById('faculty-back-btn'), false);
    setGradebookShellVisibility(document.getElementById('faculty-save-btn'), false);
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

function getGradebookModernSummary(record, schemeOrWeights, options = {}) {
    const safeRecord = syncGradeRecordSummaries(ensureGradeRecordHistories(record || {}));
    const rosterId = String(options.rosterId || currentRosterId || '').trim();
    const scheme = schemeOrWeights?.quiz !== undefined
        ? normalizeGradebookGradingScheme(schemeOrWeights)
        : getGradebookSchemeForRoster(rosterId);
    const defs = getStudentEvaluationHistorySectionDefs(safeRecord, rosterId)
        .filter(meta => GRADEBOOK_SCHEME_COMPONENTS.some(
            component => component.criterionKey === normalizeGradebookCriterion(meta.key)
                || component.altCriterionKey === normalizeGradebookCriterion(meta.key)
        ) || normalizeGradebookCriterion(meta.key) === 'retake');
    const sections = defs.map(meta => {
        const criterionMeta = getGradebookCriterionMeta(meta.key, safeRecord, rosterId);
        const entries = getDisplayAssessmentEntries(safeRecord, criterionMeta.key);
        const scoredEntries = entries.filter(entry => entry?.score !== null && entry?.score !== undefined && entry?.score !== '');
        const pendingEntries = entries.filter(entry => isAssessmentEntryPendingReview(safeRecord, criterionMeta.key, normalizeAssessmentNumber(entry.number, 1)));
        const latestEntry = entries.length ? entries[entries.length - 1] : null;
        const aggregate = getAssessmentDisplayValue(safeRecord, criterionMeta);
        const categoryMax = getGradebookCategoryMaxForCriterion(criterionMeta.key, scheme, rosterId);
        return {
            meta: criterionMeta,
            entries,
            scoredEntries,
            pendingEntries,
            latestEntry,
            aggregate,
            categoryMax,
            maxScore: Math.max(1, Number(categoryMax || criterionMeta.maxScore || 100))
        };
    });
    const outcome = getGradebookVisibleOutcome(safeRecord, scheme);
    const completedCount = sections.reduce((sum, section) => sum + section.scoredEntries.length, 0);
    const pendingCount = sections.reduce((sum, section) => sum + section.pendingEntries.length, 0);
    const totalEntries = sections.reduce((sum, section) => sum + section.entries.length, 0);
    const missingCore = sections.filter(section => !section.entries.length).length;
    return {
        record: safeRecord,
        sections,
        scheme,
        rosterId,
        outcome,
        completedCount,
        pendingCount,
        totalEntries,
        missingCore,
        progressPercent: Math.max(0, Math.min(100, Number(outcome.scoreLabel) || 0))
    };
}

function getGradebookSchemeRows(scheme = {}) {
    const normalized = normalizeGradebookGradingScheme(scheme);
    const total = getGradebookSchemeTotalPoints(normalized) || 1;
    return GRADEBOOK_SCHEME_COMPONENTS.map(component => ({
        key: component.schemeKey,
        label: component.label,
        value: Number(normalized[component.schemeKey] || 0) / total,
        maxPoints: Number(normalized[component.schemeKey] || 0),
        color: component.color
    }));
}

function getGradebookSchemeContributionRows(summary, scheme = {}) {
    const normalizedScheme = normalizeGradebookGradingScheme(scheme);
    const breakdown = computeGradebookSchemeBreakdown(summary?.record || {}, normalizedScheme);
    const sectionByKey = new Map((summary?.sections || []).map(section => [normalizeGradebookCriterion(section.meta.key), section]));
    return breakdown.components.map(component => {
        const primary = sectionByKey.get(component.criterionKey);
        const alternate = component.altCriterionKey ? sectionByKey.get(component.altCriterionKey) : null;
        const pendingCount = Number((primary?.pendingEntries || []).length + (alternate?.pendingEntries || []).length);
        const weightPoints = component.maxPoints;
        const earned = component.earned;
        const pending = pendingCount > 0 ? Math.max(0, Math.min(weightPoints - earned, weightPoints * 0.35)) : 0;
        const remaining = Math.max(0, weightPoints - earned - pending);
        return {
            schemeKey: component.schemeKey,
            weightKey: component.schemeKey,
            label: component.label,
            color: component.color,
            weightPoints,
            earned,
            pending,
            remaining,
            aggregate: component.rawScore,
            maxScore: component.entryMaxScore,
            pendingCount,
            hasAnyEntry: Boolean((primary?.entries || []).length || (alternate?.entries || []).length)
        };
    });
}

function getGradebookSchemeMaxPotentialPercent(record, scheme = getGradebookSchemeForRoster()) {
    const normalizedScheme = normalizeGradebookGradingScheme(scheme);
    let totalMax = 0;
    let totalEarned = 0;
    GRADEBOOK_SCHEME_COMPONENTS.forEach(component => {
        const maxPoints = Number(normalizedScheme[component.schemeKey] || 0);
        totalMax += maxPoints;
        if (maxPoints <= 0) return;
        const rawScore = component.schemeKey === 'final'
            ? Number(getGradebookCriterionMeta(component.criterionKey, record).maxScore || 100)
            : getGradebookSchemeAssessmentRawScore(record, component);
        const entryMaxForScale = getGradebookSchemeEntryMaxForScale(component, normalizedScheme);
        totalEarned += scaleAssessmentScoreToSchemePoints(rawScore, entryMaxForScale, maxPoints);
    });
    return totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;
}

function buildGradebookTrackDataAttributes(percent) {
    const width = Math.max(0, Math.min(100, Number(percent) || 0));
    return `data-gb-track-width="${escapeHtml(String(width))}"`;
}

function syncGradebookVisualCustomProperties(root = document) {
    if (!root || typeof root.querySelectorAll !== 'function') return;
    root.querySelectorAll('[data-gb-track-width]').forEach((node) => {
        const width = Math.max(0, Math.min(100, Number(node.getAttribute('data-gb-track-width')) || 0));
        node.style.setProperty('--gb-track-width', `${width}%`);
    });
    root.querySelectorAll('[data-gb-progress]').forEach((node) => {
        const progress = Math.max(0, Number(node.getAttribute('data-gb-progress')) || 0);
        node.style.setProperty('--gb-progress', `${progress}deg`);
    });
    root.querySelectorAll('[data-gb-score-width]').forEach((node) => {
        const width = Math.max(0, Math.min(100, Number(node.getAttribute('data-gb-score-width')) || 0));
        node.style.setProperty('--gb-score-width', `${width}%`);
    });
}

function renderGradebookModernWeights(scheme = {}, summary = null, options = {}) {
    const studentView = Boolean(options.studentView);
    const normalizedScheme = normalizeGradebookGradingScheme(scheme);
    const rows = getGradebookSchemeRows(normalizedScheme);
    const courseTotal = getGradebookSchemeTotalPoints(normalizedScheme);
    const contributionRows = summary ? getGradebookSchemeContributionRows(summary, normalizedScheme) : [];
    const totalEarned = contributionRows.reduce((sum, row) => sum + row.earned, 0);
    const totalPending = contributionRows.reduce((sum, row) => sum + row.pending, 0);
    const totalRemaining = contributionRows.reduce((sum, row) => sum + row.remaining, 0);
    const earnedPct = courseTotal > 0 ? (totalEarned / courseTotal) * 100 : 0;
    const pendingPct = courseTotal > 0 ? (totalPending / courseTotal) * 100 : 0;
    const remainingPct = courseTotal > 0 ? (totalRemaining / courseTotal) * 100 : 0;
    const progressRows = summary ? contributionRows : rows.map(row => ({
        ...row,
        schemeKey: row.key,
        weightPoints: row.maxPoints,
        earned: 0,
        pending: 0,
        remaining: row.maxPoints,
        pendingCount: 0
    }));
    const cardTitle = studentView ? 'Your progress' : 'Course grading breakdown';
    const cardCopy = studentView
        ? `Course total is ${courseTotal} points. Each row shows how that component is weighted and your earned, pending, and remaining points.`
        : `Course total is ${courseTotal} points. See how each assessment type is weighted, then track your earned, pending, and remaining points below.`;
    const referenceTableMarkup = studentView
        ? ''
        : renderGradebookSchemeReferenceTable(normalizedScheme, { showCaption: true, showFooter: false, compact: true });
    const progressSectionClass = studentView
        ? 'gb-scheme-progress-section is-student-view'
        : 'gb-scheme-progress-section';
    const progressHeadMarkup = studentView
        ? ''
        : `
                    <div class="gb-scheme-progress-head">
                        <div class="gb-modern-kicker">Your progress</div>
                        <p>Earned, pending review, and remaining points per component.</p>
                    </div>
        `;
    return `
        <div class="lms-route-card lms-route-panel-compact gb-modern-card gb-weight-card${studentView ? ' is-student-view' : ''}">
            <div class="gb-modern-card-head">
                <div>
                    <div class="gb-modern-kicker">Grading scheme</div>
                    <h3>${escapeHtml(cardTitle)}</h3>
                    <p>${escapeHtml(cardCopy)}</p>
                </div>
                <span class="gb-status-badge lux-status-pill is-graded">${courseTotal} pts</span>
            </div>
            ${referenceTableMarkup}
            ${summary ? `
                <div class="${progressSectionClass}">
                    ${progressHeadMarkup}
                    <div class="gb-composition-bar" title="Earned ${totalEarned.toFixed(1)} pts, pending ${totalPending.toFixed(1)} pts, remaining ${totalRemaining.toFixed(1)} pts">
                        <span class="is-earned" ${buildGradebookTrackDataAttributes(earnedPct)}></span>
                        <span class="is-pending" ${buildGradebookTrackDataAttributes(pendingPct)}></span>
                        <span class="is-remaining" ${buildGradebookTrackDataAttributes(remainingPct)}></span>
                </div>
                <div class="gb-composition-legend">
                        <span><i class="is-earned"></i> Earned ${totalEarned.toFixed(1)} pts</span>
                        <span><i class="is-pending"></i> Pending ${totalPending.toFixed(1)} pts</span>
                        <span><i class="is-remaining"></i> Remaining ${totalRemaining.toFixed(1)} pts</span>
                </div>
            <div class="gb-weight-stack">
                        ${progressRows.map(row => {
                            const schemeKey = String(row.schemeKey || row.weightKey || row.key || 'default');
                            const metaLine = getGradebookSchemeComponentMetaLine(normalizedScheme, schemeKey);
                            return `
                            <div class="gb-weight-row gb-weight-row--${escapeHtml(schemeKey)}">
                        <div class="gb-weight-label">
                                    <div class="gb-weight-label-main">
                            <strong>${escapeHtml(row.label)}</strong>
                                        ${metaLine ? `<span class="gb-weight-row-meta">${escapeHtml(metaLine)}</span>` : ''}
                                    </div>
                                    ${metaLine ? '' : `<span>${Math.round(row.weightPoints)} pts max</span>`}
                        </div>
                        <div class="gb-weight-detail">
                                    <span class="gb-weight-stat is-earned">Earned ${row.earned.toFixed(1)} pts</span>
                                    <span class="gb-weight-stat is-pending">Pending ${row.pending.toFixed(1)} pts</span>
                                    <span class="gb-weight-stat is-remaining">Remaining ${row.remaining.toFixed(1)} pts</span>
                        </div>
                        <div class="gb-weight-track is-stacked">
                            <span class="is-earned" ${buildGradebookTrackDataAttributes(row.weightPoints ? (row.earned / row.weightPoints) * 100 : 0)}></span>
                            <span class="is-pending" ${buildGradebookTrackDataAttributes(row.weightPoints ? (row.pending / row.weightPoints) * 100 : 0)}></span>
                            <span class="is-remaining" ${buildGradebookTrackDataAttributes(row.weightPoints ? (row.remaining / row.weightPoints) * 100 : 0)}></span>
                        </div>
                    </div>
                        `;
                        }).join('')}
            </div>
                    <div class="gb-scheme-total gb-scheme-reference-total">Course total: ${courseTotal} points</div>
                </div>
            ` : `<div class="gb-scheme-total gb-scheme-reference-total">Course total: ${courseTotal} points</div>`}
        </div>
    `;
}

function renderGradebookModernTranscript(summary, options = {}) {
    const rosterId = String(options.rosterId || summary?.rosterId || currentRosterId || '').trim();
    const scheme = summary?.scheme || getGradebookSchemeForRoster(rosterId);
    const rosterAttr = rosterId ? ` data-gradebook-roster-id="${escapeHtml(rosterId)}"` : '';
    const rows = summary.sections.map(section => {
        const meta = section.meta;
        const latestDisplay = section.latestEntry ? getAssessmentEntryDisplayContext(meta.key, section.latestEntry) : null;
        const status = getGradebookEntryStatus(summary.record, meta, section.latestEntry);
        const scoreLabel = section.latestEntry && status.key !== 'pending' && section.latestEntry.score !== null && section.latestEntry.score !== undefined && section.latestEntry.score !== ''
            ? String(section.aggregate)
            : (status.key === 'pending' ? 'Pending' : '-');
        const categoryMax = Number(section.categoryMax || getGradebookCategoryMaxForCriterion(meta.key, scheme, rosterId) || 0);
        const maxLabel = categoryMax > 0 ? `/${categoryMax}` : '';
        const component = getGradebookSchemeComponentForCriterion(meta.key);
        const metaLine = component ? getGradebookSchemeComponentMetaLine(scheme, component.schemeKey) : '';
        const subtitle = latestDisplay
            ? escapeHtml(latestDisplay.title)
            : (metaLine ? escapeHtml(metaLine) : 'No assessment recorded yet');
        return `
            <tr class="gb-transcript-row" data-gradebook-click="open-history" data-gradebook-student-id="${escapeHtml(String(summary.record.id))}" data-gradebook-student-name="${escapeHtml(String(summary.record.name || ''))}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-force-view-only="true"${rosterAttr}>
                <td>
                    <div class="gb-subject-cell">
                        <strong>${escapeHtml(meta.pluralLabel || meta.label)}</strong>
                        <span>${subtitle}</span>
                    </div>
                </td>
                <td>${escapeHtml(section.scoredEntries.length ? `${section.scoredEntries.length} graded` : 'No graded items')}</td>
                <td>${escapeHtml(section.pendingEntries.length ? `${section.pendingEntries.length} pending` : '0 pending')}</td>
                <td><strong>${escapeHtml(scoreLabel)}${status.key === 'graded' ? escapeHtml(maxLabel) : ''}</strong></td>
                <td><span class="gb-status-badge lux-status-pill is-${escapeHtml(status.key)}"><i class="fas ${escapeHtml(status.icon)}"></i> ${escapeHtml(status.label)}</span></td>
                <td>
                    <button type="button" class="gb-modern-action" data-gradebook-click="open-history" data-gradebook-student-id="${escapeHtml(String(summary.record.id))}" data-gradebook-student-name="${escapeHtml(String(summary.record.name || ''))}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-force-view-only="true"${rosterAttr}>
                        <i class="fas fa-chevron-down"></i> Details
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    return `
        <div class="lms-route-card lms-route-panel-compact gb-modern-card gb-transcript-card"${rosterAttr}>
            <div class="gb-modern-card-head">
                <div>
                    <div class="gb-modern-kicker">Student Card</div>
                    <h3>Assessment Transcript</h3>
                    <p>Every LMS quiz, manual classroom score, exam, and retake is grouped by assessment type.</p>
                </div>
                <button type="button" class="gb-modern-action is-primary" data-gradebook-click="open-history" data-gradebook-student-id="${escapeHtml(String(summary.record.id))}" data-gradebook-student-name="${escapeHtml(String(summary.record.name || ''))}" data-gradebook-force-view-only="true"${rosterAttr}>
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
            <div class="lms-route-card lms-route-panel-compact gb-modern-card">
                <div class="gb-empty-state">
                    <i class="fas fa-clock"></i>
                    <strong>No assessment activity yet</strong>
                    <span>Submitted quizzes, manual grades, exams, and retakes will appear here after staff records them.</span>
                </div>
            </div>
        `;
    }
    return `
        <div class="lms-route-card lms-route-panel-compact gb-modern-card">
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
                                <span class="gb-status-badge lux-status-pill is-${escapeHtml(item.status.key)}">${escapeHtml(item.status.label)}</span>
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

function renderStudentGradebookWorkspace(record, weights, options = null) {
    const safeRecord = syncGradeRecordSummaries(ensureGradeRecordHistories(record || {}));
    const summary = getGradebookModernSummary(safeRecord, weights, { rosterId: currentRosterId });
    const transcriptMarkup = options?.staffEditable
        ? renderGradebookStaffEditableTranscript(summary, options)
        : '';
    return `
        <div class="gb-modern-workspace">
            <div class="lms-route-panel lms-route-panel-pad-16-20 gb-modern-hero">
                <div class="gb-modern-hero-main">
                    <div>
                        <div class="gb-modern-kicker">Grades</div>
                        <h2>${escapeHtml(safeRecord.name || 'Student Gradebook')}</h2>
                        <p>Transcript-style view of quizzes, homework, exams, retakes, pending reviews, and final grade prediction.</p>
                    </div>
                    <div class="gb-score-orbit" data-gb-progress="${escapeHtml(String(summary.progressPercent * 3.6))}">
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
            <div class="gb-modern-stack">
                ${renderGradebookModernWeights(weights, summary, { studentView: true })}
            </div>
            ${transcriptMarkup}
            <p class="gb-modern-study-card-pointer">Full assessment transcript, per-item history, and timeline are available on your <a href="study-card.html">Study Card</a> for each subject.</p>
        </div>
    `;
}

function isFacultyStandaloneGradebookContext() {
    return Boolean(
        document.body?.classList?.contains('lux-route-faculty-gradebook')
        && document.getElementById('gradebook-faculty-staff-workspace')
    );
}

function isLmsEmbeddedGradebookContext() {
    return Boolean(
        document.body?.classList?.contains('lux-route-lms')
        && document.getElementById('lms-gradebook-wrapper')
        && !document.getElementById('lms-gradebook-wrapper')?.hidden
    );
}

function isStaffModernGradebookContext() {
    return isLmsEmbeddedGradebookContext() || isFacultyStandaloneGradebookContext();
}

function getStaffModernGradebookRoot() {
    return document.getElementById('gradebook-staff-lms-workspace')
        || document.getElementById('gradebook-faculty-staff-workspace');
}

function readFacultyGradebookFiltersFromDom() {
    return {
        semester: String(document.getElementById('fs-filter-sem')?.value || 'all').trim() || 'all',
        faculty: String(document.getElementById('fs-filter-fac')?.value || getCurrentFaculty() || '').trim(),
        subjectId: String(document.getElementById('fs-filter-subject')?.value || 'all').trim() || 'all',
        groupId: String(document.getElementById('fs-filter-group')?.value || 'all').trim() || 'all'
    };
}

function isFacultyGradebookSubjectSelected() {
    return facultyGradebookFilterState?.subjectId && facultyGradebookFilterState.subjectId !== 'all';
}

function mergeFacultyGradebookStudentRecords(primary, secondary) {
    const primaryRecord = syncGradeRecordSummaries(ensureGradeRecordHistories(primary || {}));
    const secondaryRecord = syncGradeRecordSummaries(ensureGradeRecordHistories(secondary || {}));
    return syncGradeRecordSummaries(ensureGradeRecordHistories({
        ...secondaryRecord,
        ...primaryRecord,
        id: primaryRecord.id || secondaryRecord.id,
        name: primaryRecord.name || secondaryRecord.name,
        assessments: {
            ...(secondaryRecord.assessments || {}),
            ...(primaryRecord.assessments || {})
        },
        _gradebookEnrollments: [
            ...(primaryRecord._gradebookEnrollments || []),
            ...(secondaryRecord._gradebookEnrollments || [])
        ]
    }));
}

function getFacultyGradebookFilteredGroups(filters = facultyGradebookFilterState) {
    const baseGroups = typeof getGradebookGroupsForCurrentUser === 'function'
        ? getGradebookGroupsForCurrentUser(filters)
        : [];
    return (baseGroups || []).filter(group => {
        if (filters?.subjectId && filters.subjectId !== 'all' && group.courseId !== filters.subjectId) return false;
        if (filters?.groupId && filters.groupId !== 'all' && group.groupId !== filters.groupId) return false;
        return true;
    });
}

function buildFacultyGradebookAggregateRoster(filterOverrides = {}) {
    const filters = { ...readFacultyGradebookFiltersFromDom(), ...filterOverrides };
    facultyGradebookFilterState = filters;
    const groups = getFacultyGradebookFilteredGroups(filters);
    facultyGradebookScopedGroups = groups;
    facultyGradebookEnrollmentByStudentId = new Map();
    const studentMap = new Map();

    groups.forEach(group => {
        if (typeof buildGradebookStudents !== 'function') return;
        const gradebookState = buildGradebookStudents(group.courseId, group.groupId);
        const rosterKey = String(gradebookState?.rosterKey || '').trim();
        (gradebookState?.students || []).forEach(student => {
            const studentId = String(student?.id || '').trim();
            if (!studentId) return;
            const enrollment = {
                courseId: group.courseId,
                groupId: group.groupId,
                groupName: group.groupName,
                subjectName: group.subjectName,
                rosterKey
            };
            if (!facultyGradebookEnrollmentByStudentId.has(studentId)) {
                facultyGradebookEnrollmentByStudentId.set(studentId, []);
            }
            facultyGradebookEnrollmentByStudentId.get(studentId).push(enrollment);
            if (!studentMap.has(studentId)) {
                studentMap.set(studentId, ensureGradeRecordHistories({
                    ...student,
                    _gradebookEnrollments: [enrollment]
                }));
            } else {
                const existing = studentMap.get(studentId);
                const merged = mergeFacultyGradebookStudentRecords(existing, student);
                merged._gradebookEnrollments = [
                    ...(existing._gradebookEnrollments || []),
                    enrollment
                ];
                studentMap.set(studentId, merged);
            }
        });
    });

    const mergedStudents = [...studentMap.values()].map(student => ensureGradeRecordHistories(student));
    if (groups.length === 1) {
        const onlyGroup = groups[0];
        currentGradebookSection = { courseId: onlyGroup.courseId, groupId: onlyGroup.groupId };
        currentRosterId = buildGradebookStudents(onlyGroup.courseId, onlyGroup.groupId).rosterKey;
    } else if (filters.subjectId !== 'all' && groups.length) {
        const firstGroup = groups[0];
        currentGradebookSection = {
            courseId: filters.subjectId,
            groupId: filters.groupId !== 'all' ? filters.groupId : firstGroup.groupId
        };
        currentRosterId = buildGradebookStudents(firstGroup.courseId, firstGroup.groupId).rosterKey;
    } else {
        currentGradebookSection = null;
        currentRosterId = groups.length
            ? buildGradebookStudents(groups[0].courseId, groups[0].groupId).rosterKey
            : 'default-roster';
    }

    return {
        students: mergedStudents,
        groups,
        filters
    };
}

function loadFacultyGradebookAggregateRoster(filterOverrides = {}) {
    const aggregate = buildFacultyGradebookAggregateRoster(filterOverrides);
    mockStudents = (aggregate.students || []).map(student => ensureGradeRecordHistories(student));
    syncFacultyGradebookInsights();
    return aggregate;
}

function resolveFacultyGradebookRosterKeysForStudent(studentId) {
    const enrollments = facultyGradebookEnrollmentByStudentId.get(String(studentId || '').trim()) || [];
    return [...new Set(enrollments.map(entry => String(entry?.rosterKey || '').trim()).filter(Boolean))];
}

function getFacultyEnrollmentMetaLine(student) {
    const studentId = String(student?.id || '').trim();
    const enrollments = student?._gradebookEnrollments
        || facultyGradebookEnrollmentByStudentId.get(studentId)
        || [];
    if (!enrollments.length) return '';
    return enrollments.map(entry => `${entry.subjectName || entry.courseId} · ${entry.groupName || entry.groupId}`).join(' · ');
}

function shouldShowFacultyEnrollmentMeta(student) {
    if (!isFacultyStandaloneGradebookContext()) return false;
    const enrollments = student?._gradebookEnrollments
        || facultyGradebookEnrollmentByStudentId.get(String(student?.id || '').trim())
        || [];
    return enrollments.length > 1 || facultyGradebookFilterState?.groupId === 'all';
}

function getFacultyGradebookHeroTitle() {
    const filters = facultyGradebookFilterState || readFacultyGradebookFiltersFromDom();
    const count = (mockStudents || []).length;
    const groupCount = facultyGradebookScopedGroups?.length || 0;
    if (filters.subjectId !== 'all' && filters.groupId !== 'all') {
        const scoped = facultyGradebookScopedGroups[0];
        return `${scoped?.subjectName || filters.subjectId} · ${scoped?.groupName || filters.groupId}`;
    }
    if (filters.subjectId !== 'all') {
        const subjectName = facultyGradebookScopedGroups[0]?.subjectName || filters.subjectId;
        return `${subjectName} · all groups · ${count} students`;
    }
    return `All teaching groups · ${count} students · ${groupCount} sections`;
}

function getStaffModernGradebookTitle() {
    if (isFacultyStandaloneGradebookContext()) {
        return getFacultyGradebookHeroTitle();
    }
    return getLmsEmbeddedGradebookTitle();
}

function populateFacultyGradebookGroupFilter() {
    const groupSelect = document.getElementById('fs-filter-group');
    if (!groupSelect) return;
    const filters = readFacultyGradebookFiltersFromDom();
    const semesterFacultyGroups = typeof getGradebookGroupsForCurrentUser === 'function'
        ? getGradebookGroupsForCurrentUser({ ...filters, subjectId: 'all', groupId: 'all' })
        : [];
    const subjectGroups = filters.subjectId === 'all'
        ? semesterFacultyGroups
        : semesterFacultyGroups.filter(group => group.courseId === filters.subjectId);
    const previous = String(groupSelect.value || 'all');
    const options = [
        '<option value="all">All groups</option>',
        ...subjectGroups.map(group => `<option value="${escapeHtml(String(group.groupId))}">${escapeHtml(`${group.subjectName} · ${group.groupName}`)}</option>`)
    ];
    groupSelect.innerHTML = options.join('');
    if ([...groupSelect.options].some(option => option.value === previous)) {
        groupSelect.value = previous;
    } else {
        groupSelect.value = 'all';
    }
}

function populateFacultyGradebookFilters() {
    const subjectSelect = document.getElementById('fs-filter-subject');
    if (!subjectSelect) return;
    const filters = readFacultyGradebookFiltersFromDom();
    const assignedGroups = typeof getGradebookGroupsForCurrentUser === 'function'
        ? getGradebookGroupsForCurrentUser({ ...filters, subjectId: 'all', groupId: 'all' })
        : [];
    const subjects = new Map();
    assignedGroups.forEach(group => {
        if (!subjects.has(group.courseId)) {
            subjects.set(group.courseId, group.subjectName || group.courseId);
        }
    });
    const previousSubject = String(subjectSelect.value || 'all');
    subjectSelect.innerHTML = [
        '<option value="all">All subjects</option>',
        ...[...subjects.entries()].map(([courseId, name]) => `<option value="${escapeHtml(courseId)}">${escapeHtml(name)}</option>`)
    ].join('');
    if ([...subjectSelect.options].some(option => option.value === previousSubject)) {
        subjectSelect.value = previousSubject;
    } else {
        subjectSelect.value = 'all';
    }
    populateFacultyGradebookGroupFilter();
}

function syncFacultyGradebookInsights() {
    if (!isFacultyStandaloneGradebookContext()) return;
    const filters = facultyGradebookFilterState || readFacultyGradebookFiltersFromDom();
    const scheme = getGradebookSchemeForRoster(currentRosterId);
    const criterionMeta = getGradebookCriterionMeta(currentGradebookCriterion);
    const assessmentNumber = normalizeAssessmentNumber(currentGradebookAssessmentNumber, 1);
    const analytics = getGradebookStaffAnalytics(mockStudents, scheme, criterionMeta, assessmentNumber);
    const groupCount = facultyGradebookScopedGroups?.length || 0;

    const setText = (id, value) => {
        const node = document.getElementById(id);
        if (node) node.textContent = value;
    };
    const setList = (id, items) => {
        const node = document.getElementById(id);
        if (!node) return;
        node.innerHTML = items.map(item => `<span>${escapeHtml(item)}</span>`).join('');
    };

    setText('faculty-hero-focus-title', getFacultyGradebookHeroTitle());
    setText('faculty-hero-focus-copy', `${analytics.total} students in scope · ${criterionMeta.label} ${assessmentNumber} · ${analytics.pendingCount} pending review`);
    setText('faculty-insight-section', filters.subjectId === 'all' ? 'All subjects' : (facultyGradebookScopedGroups[0]?.subjectName || filters.subjectId));
    setText('faculty-insight-section-copy', `${groupCount} teaching section${groupCount === 1 ? '' : 's'} match the current filters.`);
    setList('faculty-insight-section-list', [
        `${groupCount} active sections`,
        `${analytics.total} students shown`,
        filters.groupId === 'all' ? 'All groups included' : `Group ${filters.groupId}`
    ]);
    setText('faculty-insight-progress', `${analytics.pendingCount} pending`);
    setText('faculty-insight-progress-copy', `Class average ${analytics.average}% across the filtered roster.`);
    setList('faculty-insight-progress-list', [
        `${criterionMeta.label} ${assessmentNumber}`,
        `${analytics.average}% class average`,
        `${analytics.pendingCount} pending reviews`
    ]);
    setText('faculty-insight-next', analytics.riskCount ? `${analytics.riskCount} at risk` : 'No urgent risks');
    setText('faculty-insight-next-copy', 'Use Set score or Edit score in the student panel; saves are recorded in score history.');
    setList('faculty-insight-next-list', [
        `${analytics.riskCount} below 51%`,
        `${analytics.highest} / ${analytics.lowest} high-low`,
        'Modal save only'
    ]);
    const overviewRosters = document.getElementById('faculty-overview-rosters');
    if (overviewRosters) {
        overviewRosters.innerHTML = `<i class="fas fa-book"></i> ${groupCount} section${groupCount === 1 ? '' : 's'}`;
    }
    const overviewStudents = document.getElementById('faculty-overview-students');
    if (overviewStudents) {
        overviewStudents.innerHTML = `<i class="fas fa-users"></i> ${analytics.total} student${analytics.total === 1 ? '' : 's'}`;
    }
    const stageStatus = document.getElementById('faculty-stage-status');
    if (stageStatus) {
        stageStatus.innerHTML = `<i class="fas fa-circle"></i> ${analytics.total} students · ${criterionMeta.label} ${assessmentNumber}`;
    }
    const stageCopy = document.getElementById('faculty-stage-copy');
    if (stageCopy) {
        stageCopy.textContent = 'Search the roster, select a student, and use Set score or Edit score to record grades with full history.';
    }
}

function initFacultyGradebookPage() {
    if (!isFacultyStandaloneGradebookContext()) return;
    restoreGradebookStaffReturnContextIfNeeded();
    populateFacultyGradebookFilters();
    loadFacultyGradebookAggregateRoster();
    initStaffModernGradebook();
}

function getLmsEmbeddedGradebookTitle() {
    const titleNode = document.getElementById('dynamic-gb-title');
    const title = String(titleNode?.innerText || titleNode?.textContent || '').trim();
    return title || 'Class gradebook';
}

function getLmsSubjectGroupsForBulkWeights(courseId = currentGradebookSection?.courseId) {
    const resolvedCourseId = String(courseId || currentGradebookSection?.courseId || '').trim();
    const groups = resolvedCourseId ? (KIU_STATE.availableGroups?.[resolvedCourseId] || []) : [];
    if (groups.length) {
        return groups.map(group => ({
            courseId: resolvedCourseId,
            groupId: String(group?.id || '').trim(),
            name: String(group?.name || group?.id || 'Group').trim(),
            schedule: [group?.day, group?.time].filter(Boolean).join(' ').trim(),
            rosterKey: resolveGradebookRosterKeyForGroup(resolvedCourseId, group?.id)
        })).filter(item => item.groupId);
    }
    const fallbackGroupId = String(currentGradebookSection?.groupId || '').trim();
    if (fallbackGroupId) {
        return [{
            courseId: resolvedCourseId,
            groupId: fallbackGroupId,
            name: fallbackGroupId,
            schedule: '',
            rosterKey: currentRosterId
        }];
    }
    return [{
        courseId: resolvedCourseId,
        groupId: '',
        name: 'Current group',
        schedule: '',
        rosterKey: currentRosterId
    }];
}

function resolveGradebookRosterKeyForGroup(courseId, groupId) {
    const resolvedCourseId = String(courseId || '').trim();
    const resolvedGroupId = String(groupId || '').trim();
    if (resolvedCourseId && resolvedGroupId && typeof buildGradebookStudents === 'function') {
        try {
            return String(buildGradebookStudents(resolvedCourseId, resolvedGroupId)?.rosterKey || '').trim()
                || currentRosterId;
        } catch (error) {
            console.warn('Could not resolve gradebook roster key for group.', error);
        }
    }
    return resolvedGroupId || currentRosterId;
}

function readGradebookWeightProfileFromDom(root = document) {
    return migrateSchemeToWeightProfile(readGradebookGradingSchemeFromDom(root));
}

function readLmsSubjectWeightProfileFromModal() {
    const modal = document.getElementById('lms-subject-weights-modal');
    return readGradebookGradingSchemeFromDom(modal || document);
}

function closeLmsSubjectWeightsModal() {
    document.getElementById('lms-subject-weights-modal')?.remove();
}

function applyLmsSubjectWeightsToSelectedGroups() {
    if (![USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(getEffectiveUserRole())) {
        alert('Only staff can update subject weights.');
        return;
    }
    const courseId = resolveGradebookCourseIdForWeights();
    if (!courseId) {
        alert('Open a subject group before setting subject weights.');
        return;
    }
    const modal = document.getElementById('lms-subject-weights-modal');
    const shell = modal?.querySelector('[data-gb-scheme-shell]');
    const saved = saveGradebookGradingSchemeFromShell(shell, courseId, { refreshGradebook: false });
    if (!saved) return;
    const groupCount = getLmsSubjectGroupsForBulkWeights(courseId).length;
    closeLmsSubjectWeightsModal();
    if (isStaffModernGradebookContext()) {
        initStaffModernGradebook();
    } else if (document.getElementById('gradebook-body')) {
        initGradebook();
    }
    alert(`Grading scheme saved for this subject (${saved.courseTotal} points, ${groupCount} group${groupCount === 1 ? '' : 's'}).`);
}

function openLmsSubjectWeightsModal() {
    if (![USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(getEffectiveUserRole())) {
        alert('Only staff can configure subject weights.');
        return;
    }
    closeLmsSubjectWeightsModal();
    const courseId = resolveGradebookCourseIdForWeights();
    const groups = getLmsSubjectGroupsForBulkWeights(courseId);
    const currentScheme = getGradebookSubjectGradingScheme(courseId)
        || getGradebookSchemeForRoster(currentRosterId, courseId);
    const subject = courseId
        ? (getDomain()?.subjectsById?.[courseId] || (KIU_STATE.curriculum || []).find(item => item.id === courseId))
        : null;
    const groupListMarkup = groups.length
        ? `<ul class="gb-lms-subject-weights-group-list">${groups.map(group => `
            <li>
                <strong>${escapeHtml(group.name)}</strong>
                ${group.schedule ? `<span>${escapeHtml(group.schedule)}</span>` : ''}
            </li>
        `).join('')}</ul>`
        : '<p class="gb-lms-subject-weights-empty">No groups are registered for this subject yet.</p>';
    const overlay = document.createElement('div');
    overlay.id = 'lms-subject-weights-modal';
    overlay.className = 'gb-score-edit-overlay gb-lms-subject-weights-overlay';
    overlay.onclick = event => {
        if (event.target === overlay) closeLmsSubjectWeightsModal();
    };
    overlay.innerHTML = `
        <div class="gb-score-edit-card gb-lms-subject-weights-card" role="dialog" aria-modal="true" aria-labelledby="lms-subject-weights-title">
            <div>
                <div class="gb-modern-kicker">Subject grading scheme</div>
                <h3 id="lms-subject-weights-title">${escapeHtml(subject?.name || courseId || 'Subject grading scheme')}</h3>
                <p>Set max points per assessment type. The course total applies to every group in this subject automatically.</p>
            </div>
            <div class="gb-lms-subject-weights-groups gb-lms-subject-weights-groups--readonly">
                <div class="gb-modern-kicker">Applies to all groups (${groups.length})</div>
                ${groupListMarkup}
            </div>
            ${getGradebookGradingSchemeControlsMarkup(currentScheme, false, {
                idPrefix: 'lms-subject-',
                totalId: 'lms-subject-scheme-total-points',
                schemeShellId: 'lms-subject-grading-scheme-shell',
                shellLabel: 'Max points per component'
            })}
            <div class="gb-score-edit-actions">
                <button type="button" data-gradebook-click="close-subject-weights">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function resolveLmsEmbeddedStaffSelectedStudentId(students = [], criterionMeta, assessmentNumber) {
    const rosterIds = (students || []).map(student => String(student?.id || '')).filter(Boolean);
    const currentSelection = String(lmsEmbeddedGradebookSelectedStudentId || '').trim();
    if (currentSelection && rosterIds.includes(currentSelection)) {
        return currentSelection;
    }
    const pendingStudent = (students || []).find(student => isAssessmentEntryPendingReview(
        ensureGradeRecordHistories(student),
        criterionMeta.key,
        assessmentNumber
    ));
    if (pendingStudent?.id) {
        return String(pendingStudent.id);
    }
    return rosterIds[0] || '';
}

function renderGradebookStaffEditableTranscript(summary, options = {}) {
    const activeKey = normalizeGradebookCriterion(options.criterion || currentGradebookCriterion);
    const activeNum = normalizeAssessmentNumber(options.assessmentNumber ?? currentGradebookAssessmentNumber, 1);
    const studentId = String(summary.record.id || '');
    const studentName = String(summary.record.name || '');
    const rows = summary.sections.map(section => {
        const meta = section.meta;
        const sectionKey = normalizeGradebookCriterion(meta.key);
        const isActiveSection = sectionKey === activeKey;
        const entry = isActiveSection
            ? (getDisplayAssessmentEntryForNumber(summary.record, meta.key, activeNum)
                || getAssessmentEntryForNumber(summary.record, meta.key, activeNum))
            : section.latestEntry;
        const entryNumber = entry
            ? normalizeAssessmentNumber(entry.number, 1)
            : (isActiveSection ? activeNum : 1);
        const latestDisplay = entry ? getAssessmentEntryDisplayContext(meta.key, entry) : null;
        const status = getGradebookEntryStatus(summary.record, meta, entry);
        const pendingReview = entry
            ? isAssessmentEntryPendingReview(summary.record, meta.key, entryNumber)
            : isActiveSection;
        const linkedQuizSource = entry ? resolveLmsQuizSourceFromAssessmentEntry(entry) : null;
        const hasGradedScore = entry && entry.score !== null && entry.score !== undefined && entry.score !== '' && !pendingReview;
        const scoreLabel = hasGradedScore
            ? String(entry.score)
            : (pendingReview ? 'Pending' : '-');
        const maxLabel = meta.maxScore && hasGradedScore ? `/${meta.maxScore}` : '';
        const currentPoints = hasGradedScore ? Number(entry.score) : 0;
        const scoreEditLabel = hasGradedScore ? 'Edit score' : 'Set score';
        const scoreEditAttr = hasGradedScore ? String(currentPoints) : '';
        const scoreEditor = isActiveSection
            ? `<div class="gb-lms-staff-score-editor">
                <span class="gb-lms-staff-current-score">Current: <strong>${hasGradedScore ? escapeHtml(String(currentPoints)) : (pendingReview ? 'Pending' : '—')}</strong>${meta.maxScore ? escapeHtml(` / ${meta.maxScore}`) : ''}</span>
                <button type="button" class="gb-modern-action is-primary" data-gradebook-click="open-score-edit" data-gradebook-student-id="${escapeHtml(studentId)}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-number="${escapeHtml(String(entryNumber))}" data-gradebook-score="${escapeHtml(scoreEditAttr)}" data-gradebook-student-name="${escapeHtml(studentName)}"><i class="fas fa-pen"></i> ${escapeHtml(scoreEditLabel)}</button>
            </div>`
            : `<strong>${escapeHtml(scoreLabel)}${hasGradedScore ? escapeHtml(maxLabel) : ''}</strong>`;
        const actionButtons = `
            ${linkedQuizSource ? `<button type="button" class="gb-modern-action" data-gradebook-click="open-linked-quiz" data-gradebook-student-id="${escapeHtml(studentId)}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-number="${escapeHtml(String(entryNumber))}"><i class="fas fa-file-alt"></i> ${pendingReview ? 'Evaluate' : 'Quiz paper'}</button>` : ''}
            ${hasGradedScore && !isActiveSection ? `<button type="button" class="gb-modern-action" data-gradebook-click="open-score-edit" data-gradebook-student-id="${escapeHtml(studentId)}" data-gradebook-criterion="${escapeHtml(String(meta.key))}" data-gradebook-number="${escapeHtml(String(entryNumber))}" data-gradebook-score="${escapeHtml(String(Number(entry.score || 0)))}" data-gradebook-student-name="${escapeHtml(studentName)}"><i class="fas fa-pen"></i> Edit</button>` : ''}
            <button type="button" class="gb-modern-action" data-gradebook-click="open-history" data-gradebook-student-id="${escapeHtml(studentId)}" data-gradebook-student-name="${escapeHtml(studentName)}" data-gradebook-criterion="${escapeHtml(String(meta.key))}"><i class="fas fa-clock"></i> History</button>
        `;
        return `
            <tr class="gb-transcript-row gb-lms-staff-transcript-row${isActiveSection ? ' is-active-assessment' : ''}">
                <td>
                    <div class="gb-subject-cell">
                        <strong>${escapeHtml(meta.pluralLabel || meta.label)}</strong>
                        <span>${latestDisplay ? escapeHtml(latestDisplay.title) : (isActiveSection ? `${escapeHtml(meta.label)} ${entryNumber}` : 'No assessment recorded yet')}</span>
                    </div>
                </td>
                <td>${escapeHtml(section.scoredEntries.length ? `${section.scoredEntries.length} graded` : 'No graded items')}</td>
                <td>${escapeHtml(section.pendingEntries.length ? `${section.pendingEntries.length} pending` : '0 pending')}</td>
                <td>${scoreEditor}</td>
                <td><span class="gb-status-badge lux-status-pill is-${escapeHtml(status.key)}"><i class="fas ${escapeHtml(status.icon)}"></i> ${escapeHtml(status.label)}</span></td>
                <td><div class="gb-lms-staff-transcript-actions">${actionButtons}</div></td>
            </tr>
        `;
    }).join('');
    return `
        <div class="lms-route-card lms-route-panel-compact gb-modern-card gb-transcript-card gb-lms-staff-transcript-card">
                    <div class="gb-modern-card-head">
                        <div>
                    <div class="gb-modern-kicker">Staff grading</div>
                    <h3>Assessment transcript</h3>
                    <p>Inline score entry for the active assessment; open history or quiz papers for deeper review.</p>
                        </div>
                <button type="button" class="gb-modern-action is-primary" data-gradebook-click="open-history" data-gradebook-student-id="${escapeHtml(studentId)}" data-gradebook-student-name="${escapeHtml(studentName)}">
                    <i class="fas fa-list"></i> Full grader
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
                            <th>Actions</th>
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

function renderLmsEmbeddedStaffGradeHero(weights, criterionMeta, assessmentNumber, selectedQuizDisplay = null) {
    const analytics = getGradebookStaffAnalytics(mockStudents, weights, criterionMeta, assessmentNumber);
    const canFinalize = getEffectiveUserRole() === USER_ROLES.PROFESSOR || getEffectiveUserRole() === USER_ROLES.ADMIN;
    const title = getStaffModernGradebookTitle();
    const kicker = isFacultyStandaloneGradebookContext() ? 'Teaching gradebook' : 'Class gradebook';
    const schemeDisabled = isFacultyStandaloneGradebookContext() && !isFacultyGradebookSubjectSelected();
    const schemeButton = schemeDisabled
        ? `<button type="button" class="is-disabled" disabled title="Select a subject filter to configure weights"><i class="fas fa-table-list"></i> Grading scheme</button>`
        : `<button type="button" data-gradebook-click="open-subject-weights"><i class="fas fa-table-list"></i> Grading scheme</button>`;
    return `
        <div class="gb-lms-staff-hero lms-route-panel lms-route-panel-pad-16-20">
            <div class="gb-lms-staff-hero-main">
                <div>
                    <div class="gb-modern-kicker">${escapeHtml(kicker)}</div>
                    <h2>${escapeHtml(title)}</h2>
                    <p>Reviewing ${escapeHtml(criterionMeta.label)} ${escapeHtml(String(assessmentNumber))} · use Set score or Edit score to record grades; score history is read-only below.</p>
            </div>
                <div class="gb-staff-actions gb-lms-staff-hero-actions">
                    ${schemeButton}
                    <button type="button" data-gradebook-click="pending-queue"><i class="fas fa-list-check"></i> Review pending</button>
                    <button type="button" data-gradebook-click="export-csv"><i class="fas fa-file-export"></i> Export</button>
                    <button type="button" ${canFinalize ? '' : 'disabled'} data-gradebook-click="publish"><i class="fas fa-bullhorn"></i> Publish</button>
                    <button type="button" ${canFinalize ? '' : 'disabled'} data-gradebook-click="finalize"><i class="fas fa-lock"></i> Finalize</button>
                </div>
            </div>
            <div class="gb-staff-stat-grid lux-strip-grid lux-strip-grid--adaptive gb-lms-staff-stat-grid">
                <div class="lux-strip-card surface-card"><span>Students</span><strong>${analytics.total}</strong></div>
                <div class="lux-strip-card surface-card"><span>Class average</span><strong>${analytics.average}</strong></div>
                <div class="lux-strip-card surface-card"><span>Pending review</span><strong>${analytics.pendingCount}</strong></div>
                <div class="lux-strip-card surface-card"><span>Fail risk</span><strong>${analytics.riskCount}</strong></div>
                <div class="lux-strip-card surface-card"><span>High / low</span><strong>${analytics.highest} / ${analytics.lowest}</strong></div>
            </div>
            ${selectedQuizDisplay ? `
                <div class="lms-route-panel lms-route-panel-compact gb-staff-linked-quiz gb-lms-staff-linked-quiz">
                    <div>
                        <div class="gb-modern-kicker">Linked LMS assessment</div>
                        <strong>${escapeHtml(selectedQuizDisplay.title)}</strong>
                        ${selectedQuizDisplay.subtitle ? `<span>${escapeHtml(selectedQuizDisplay.subtitle)}</span>` : ''}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

function renderLmsEmbeddedStaffAssessmentBar(criterionMeta, assessmentNumber, pendingReviewCount, selectedQuizDisplay = null) {
    const facultyScopeHint = isFacultyStandaloneGradebookContext() && !isFacultyGradebookSubjectSelected()
        ? `<p class="gb-faculty-scope-hint">Select a <strong>subject</strong> filter to configure subject weights or subject-specific sections. Standard criteria can still be graded across all teaching groups.</p>`
        : '';
    const schemeCopy = isFacultyStandaloneGradebookContext()
        ? 'Choose the assessment being reviewed. Narrow subject or group filters to focus the roster.'
        : 'Choose the assessment being reviewed. Use <strong>Grading scheme</strong> to set max points for all groups in this subject.';
    return `
        <div class="lms-route-panel lms-route-panel-compact gb-lms-staff-assessment-bar">
            ${facultyScopeHint}
            <div class="gb-staff-control-grid">
                <label>Assessment criterion
                    <select id="gradebook-criterion-select" data-gradebook-assessment-target="criterion">
                        ${Object.values(GRADEBOOK_CRITERIA).map(meta => `<option value="${meta.key}" ${meta.key === criterionMeta.key ? 'selected' : ''}>${meta.label}</option>`).join('')}
                    </select>
                </label>
                <label>Assessment number
                    <input id="gradebook-assessment-number" type="number" min="1" value="${assessmentNumber}" data-gradebook-assessment-target="number">
                </label>
                <div class="gb-staff-control-copy">
                    ${schemeCopy}
                </div>
            </div>
            ${selectedQuizDisplay ? `
                <div class="lms-route-card lms-route-panel-compact gb-staff-linked-small is-${pendingReviewCount ? 'pending' : 'ready'}">
                    <div class="gb-modern-kicker">Selected LMS quiz</div>
                    <strong>${escapeHtml(selectedQuizDisplay.title)}</strong>
                    ${selectedQuizDisplay.subtitle ? `<div class="gb-staff-linked-subtitle">${escapeHtml(selectedQuizDisplay.subtitle)}</div>` : ''}
                    ${pendingReviewCount
                        ? `<span class="gb-status-badge lux-status-pill is-pending"><i class="fas fa-triangle-exclamation"></i> ${pendingReviewCount} need manual evaluation</span>`
                        : `<span class="gb-status-badge lux-status-pill is-graded"><i class="fas fa-circle-check"></i> No pending manual evaluation</span>`}
                </div>
            ` : ''}
        </div>
    `;
}

function renderLmsEmbeddedStaffRosterList(students, weights, criterionMeta, assessmentNumber, selectedStudentId) {
    const filterText = String(lmsEmbeddedGradebookRosterFilter || '').trim().toLowerCase();
    const roster = (students || []).map(student => syncGradeRecordSummaries(ensureGradeRecordHistories(student)));
    const filtered = roster.filter(student => {
        if (!filterText) return true;
        const haystack = `${student.id || ''} ${student.name || ''}`.toLowerCase();
        return haystack.includes(filterText);
    });
    const listMarkup = filtered.length
        ? filtered.map(student => {
            const studentId = String(student.id || '');
            const outcome = getGradebookVisibleOutcome(student, weights);
            const pending = isAssessmentEntryPendingReview(student, criterionMeta.key, assessmentNumber);
            const isActive = studentId === String(selectedStudentId || '');
            const activeEntry = getDisplayAssessmentEntryForNumber(student, criterionMeta.key, assessmentNumber)
                || getAssessmentEntryForNumber(student, criterionMeta.key, assessmentNumber);
            const activePending = activeEntry
                ? isAssessmentEntryPendingReview(student, criterionMeta.key, assessmentNumber)
                : false;
            const activeScore = activeEntry && !activePending && activeEntry.score !== null && activeEntry.score !== undefined && activeEntry.score !== ''
                ? String(activeEntry.score)
                : (activePending ? 'Pending' : '—');
            const enrollmentMeta = shouldShowFacultyEnrollmentMeta(student)
                ? getFacultyEnrollmentMetaLine(student)
                : '';
            return `
                <button type="button" class="gb-lms-staff-roster-row${isActive ? ' is-active' : ''}" data-gradebook-click="lms-gb-select-student" data-gradebook-student-id="${escapeHtml(studentId)}">
                    <div class="gb-lms-staff-roster-main">
                        <strong>${escapeHtml(student.name || studentId)}</strong>
                        <span class="gb-lms-staff-roster-id">${escapeHtml(studentId)}</span>
                        ${enrollmentMeta ? `<span class="gb-lms-staff-roster-enrollment">${escapeHtml(enrollmentMeta)}</span>` : ''}
                    </div>
                    <div class="gb-lms-staff-roster-foot">
                        <div class="gb-lms-staff-roster-assessment">${escapeHtml(criterionMeta.label)} ${assessmentNumber}: ${escapeHtml(activeScore)}</div>
                        <div class="gb-lms-staff-roster-meta">
                            ${renderGradebookLetterBadge(outcome.letterLabel, outcome.letterLabel)}
                            <span class="gb-lms-staff-roster-score">${escapeHtml(outcome.scoreLabel)}% overall</span>
                            ${pending ? '<span class="gb-status-badge lux-status-pill is-pending">Pending</span>' : ''}
                        </div>
                    </div>
                </button>
            `;
        }).join('')
        : `<div class="gb-empty-state">No students match this filter.</div>`;
    return `
        <aside class="gb-lms-staff-roster lms-route-card lms-route-panel-compact">
            <div class="gb-lms-staff-roster-head">
                <div>
                    <div class="gb-modern-kicker">Roster</div>
                    <h3>${roster.length} students</h3>
                </div>
            </div>
            <label class="gb-lms-staff-roster-search">
                <span class="sr-only">Filter students</span>
                <input type="search" placeholder="Search name or ID" value="${escapeHtml(lmsEmbeddedGradebookRosterFilter)}" data-lms-gb-roster-filter>
            </label>
            <div class="gb-lms-staff-roster-list">${listMarkup}</div>
        </aside>
    `;
}

function renderLmsEmbeddedStaffGradingBreakdown(summary) {
    const rows = (summary?.sections || []).map(section => {
        const meta = section.meta;
        const status = getGradebookEntryStatus(summary.record, meta, section.latestEntry);
        const scoreLabel = section.latestEntry && status.key === 'graded'
            ? String(section.aggregate)
            : (status.key === 'pending' ? 'Pending' : '—');
        return `
            <tr>
                <td>${escapeHtml(meta.label)}</td>
                <td><strong>${escapeHtml(scoreLabel)}</strong></td>
                <td><span class="gb-status-badge lux-status-pill is-${escapeHtml(status.key)}">${escapeHtml(status.label)}</span></td>
            </tr>
        `;
    }).join('');
    return `
        <details class="gb-lms-staff-breakdown">
            <summary>Assessment breakdown</summary>
            <table class="gb-lms-staff-breakdown-table">
                <thead><tr><th>Type</th><th>Score</th><th>Status</th></tr></thead>
                <tbody>${rows || '<tr><td colspan="3">No assessments yet</td></tr>'}</tbody>
            </table>
        </details>
    `;
}

function renderLmsEmbeddedStaffGradingFocus(record, weights, criterionMeta, assessmentNumber) {
    const safeRecord = syncGradeRecordSummaries(ensureGradeRecordHistories(record || {}));
    const summary = getGradebookModernSummary(safeRecord, weights);
    const studentId = String(safeRecord.id || '');
    const studentName = String(safeRecord.name || '');
    const outcome = summary.outcome;
    const entry = getDisplayAssessmentEntryForNumber(safeRecord, criterionMeta.key, assessmentNumber)
        || getAssessmentEntryForNumber(safeRecord, criterionMeta.key, assessmentNumber);
    const entryDisplay = entry ? getAssessmentEntryDisplayContext(criterionMeta.key, entry) : null;
    const pendingReview = isAssessmentEntryPendingReview(safeRecord, criterionMeta.key, assessmentNumber);
    const status = getGradebookEntryStatus(safeRecord, criterionMeta, entry);
    const hasGradedScore = entry && !pendingReview && entry.score !== null && entry.score !== undefined && entry.score !== '';
    const currentPoints = hasGradedScore ? Number(entry.score) : 0;
    const maxScore = Number(criterionMeta.maxScore || 100);
    const linkedQuizSource = entry ? resolveLmsQuizSourceFromAssessmentEntry(entry) : null;
    const scoreEditLabel = hasGradedScore ? 'Edit score' : 'Set score';
    const scoreEditAttr = hasGradedScore ? String(currentPoints) : '';
    const { timeline: scoreTimeline } = getAssessmentScoreHistoryTimeline(safeRecord, criterionMeta.key, assessmentNumber);
    const scoreHistoryOpen = scoreTimeline.length > 6;
    const enrollmentMeta = shouldShowFacultyEnrollmentMeta(safeRecord) ? getFacultyEnrollmentMetaLine(safeRecord) : '';
    const scoreDisplay = hasGradedScore
        ? escapeHtml(String(currentPoints))
        : (pendingReview ? 'Pending' : '—');
    return `
        <div class="gb-lms-staff-focus">
            <div class="gb-lms-staff-focus-header">
                <div class="gb-lms-staff-focus-identity">
                    <strong>${escapeHtml(studentName || studentId)}</strong>
                    <span>${escapeHtml(studentId)}</span>
                    ${enrollmentMeta ? `<span class="gb-lms-staff-focus-enrollment">Graded in: ${escapeHtml(enrollmentMeta)}</span>` : ''}
                </div>
                <div class="gb-lms-staff-focus-summary">
                    ${renderGradebookLetterBadge(outcome.letterLabel, outcome.letterLabel)}
                    <span class="gb-lms-staff-focus-overall">${escapeHtml(outcome.scoreLabel)}%</span>
                    ${pendingReview ? '<span class="gb-status-badge lux-status-pill is-pending">Active pending</span>' : ''}
                </div>
            </div>
            <div class="gb-lms-staff-detail-actions lms-route-panel lms-route-panel-compact">
                <button type="button" class="gb-modern-action is-primary" data-gradebook-click="open-history" data-gradebook-student-id="${escapeHtml(studentId)}" data-gradebook-student-name="${escapeHtml(studentName)}" data-gradebook-criterion="${escapeHtml(String(criterionMeta.key))}">
                    <i class="fas fa-list-check"></i> Full grader
                </button>
                <button type="button" class="gb-modern-action" data-gradebook-click="open-linked-quiz" data-gradebook-student-id="${escapeHtml(studentId)}" data-gradebook-criterion="${escapeHtml(String(criterionMeta.key))}" data-gradebook-number="${escapeHtml(String(assessmentNumber))}">
                    <i class="fas fa-file-alt"></i> Quiz paper
                </button>
                <button type="button" class="gb-modern-action" data-gradebook-click="preview-student" data-gradebook-student-id="${escapeHtml(studentId)}" data-gradebook-student-name="${escapeHtml(studentName)}">
                    <i class="fas fa-user-graduate"></i> Portal preview
                </button>
            </div>
            <div class="lms-route-card lms-route-panel-compact gb-lms-staff-active-card">
                <div class="gb-lms-staff-active-head">
                    <div>
                        <div class="gb-modern-kicker">Active assessment</div>
                        <h3>${escapeHtml(criterionMeta.label)} ${escapeHtml(String(assessmentNumber))}</h3>
                        ${entryDisplay?.title ? `<p>${escapeHtml(entryDisplay.title)}</p>` : ''}
                    </div>
                    <span class="gb-status-badge lux-status-pill is-${escapeHtml(status.key)}"><i class="fas ${escapeHtml(status.icon)}"></i> ${escapeHtml(status.label)}</span>
                </div>
                <div class="gb-lms-staff-score-editor gb-lms-staff-score-editor--focus">
                    <div class="gb-lms-staff-score-stat">
                        <span class="gb-lms-staff-score-stat-label">Assessment score</span>
                        <div class="gb-lms-staff-score-stat-value">
                            <strong>${scoreDisplay}</strong>
                            <span class="gb-lms-staff-score-stat-max">/ ${maxScore}</span>
                            <span class="gb-status-badge lux-status-pill is-${escapeHtml(status.key)}">${escapeHtml(status.label)}</span>
                        </div>
                    </div>
                    <button type="button" class="lux-primary-btn gb-lms-staff-score-cta" data-gradebook-click="open-score-edit" data-gradebook-student-id="${escapeHtml(studentId)}" data-gradebook-criterion="${escapeHtml(String(criterionMeta.key))}" data-gradebook-number="${escapeHtml(String(assessmentNumber))}" data-gradebook-score="${escapeHtml(scoreEditAttr)}" data-gradebook-student-name="${escapeHtml(studentName)}">
                        <i class="fas fa-pen"></i> ${escapeHtml(scoreEditLabel)}
                    </button>
                </div>
                ${linkedQuizSource ? `<div class="gb-lms-staff-detail-actions lms-route-panel lms-route-panel-compact"><button type="button" class="gb-modern-action" data-gradebook-click="open-linked-quiz" data-gradebook-student-id="${escapeHtml(studentId)}" data-gradebook-criterion="${escapeHtml(String(criterionMeta.key))}" data-gradebook-number="${escapeHtml(String(assessmentNumber))}"><i class="fas fa-file-alt"></i> ${pendingReview ? 'Evaluate quiz' : 'Open paper'}</button></div>` : ''}
                <p class="gb-lms-staff-add-hint">${escapeHtml(scoreEditLabel)} opens a dialog where you can save the score; history below is read-only.</p>
            </div>
            <details class="lms-route-card lms-route-panel-compact gb-lms-staff-score-history"${scoreHistoryOpen ? ' open' : ''}>
                <summary>
                    <div class="gb-lms-staff-score-history-head">
                        <div>
                            <span class="gb-modern-kicker">Score history</span>
                            <strong>${escapeHtml(criterionMeta.label)} ${escapeHtml(String(assessmentNumber))}</strong>
                        </div>
                        <span class="gb-score-history-count">${scoreTimeline.length} change${scoreTimeline.length === 1 ? '' : 's'}</span>
                    </div>
                </summary>
                <p class="gb-lms-staff-history-copy">Informational only — use <strong>${escapeHtml(scoreEditLabel)}</strong> above to record changes.</p>
                ${renderGradebookScoreHistoryPanel({
                    record: safeRecord,
                    studentId,
                    studentName,
                    criterion: criterionMeta.key,
                    assessmentNumber,
                    compact: true,
                    readOnlyHistory: true
                })}
            </details>
            ${renderLmsEmbeddedStaffGradingBreakdown(summary)}
        </div>
    `;
}

function renderLmsEmbeddedStaffStudentDetail(record, weights, criterionMeta, assessmentNumber) {
    return `
        <div class="gb-lms-staff-detail">
            ${renderLmsEmbeddedStaffGradingFocus(record, weights, criterionMeta, assessmentNumber)}
        </div>
    `;
}

function renderLmsEmbeddedStaffGradebook(weights, criterionMeta, assessmentNumber, selectedQuizDisplay, pendingReviewCount, selectedStudentId) {
    const selectedRecord = (mockStudents || []).find(student => String(student?.id || '') === String(selectedStudentId || ''))
        || (mockStudents || [])[0]
        || null;
    return `
        <div class="gb-lms-staff-workspace-inner">
            ${renderLmsEmbeddedStaffGradeHero(weights, criterionMeta, assessmentNumber, selectedQuizDisplay)}
            ${renderLmsEmbeddedStaffAssessmentBar(criterionMeta, assessmentNumber, pendingReviewCount, selectedQuizDisplay)}
            <div class="gb-lms-staff-layout">
                ${renderLmsEmbeddedStaffRosterList(mockStudents, weights, criterionMeta, assessmentNumber, selectedStudentId)}
                ${selectedRecord
                    ? renderLmsEmbeddedStaffStudentDetail(selectedRecord, weights, criterionMeta, assessmentNumber)
                    : `<div class="gb-lms-staff-detail"><div class="gb-empty-state">Select a student from the roster to begin grading.</div></div>`}
            </div>
        </div>
    `;
}

function initStaffModernGradebook() {
    mockStudents = Array.isArray(mockStudents)
        ? mockStudents.map(student => ensureGradeRecordHistories(student))
        : [];
    const staffRoot = getStaffModernGradebookRoot();
    if (!staffRoot) return;

    const currentScheme = getGradebookSchemeForRoster(currentRosterId);
    const currentCriterionMeta = getGradebookCriterionMeta(currentGradebookCriterion);
    const assessmentNumber = normalizeAssessmentNumber(currentGradebookAssessmentNumber, 1);
    const pendingReviewStudents = mockStudents.filter(student => isAssessmentEntryPendingReview(student, currentCriterionMeta.key, assessmentNumber));
    const sampleLinkedEntry = mockStudents
        .map(student => getDisplayAssessmentEntryForNumber(student, currentCriterionMeta.key, assessmentNumber) || getAssessmentEntryForNumber(student, currentCriterionMeta.key, assessmentNumber))
        .find(entry => resolveLmsQuizSourceFromAssessmentEntry(entry));
    const selectedQuizDisplay = sampleLinkedEntry ? getAssessmentEntryDisplayContext(currentCriterionMeta.key, sampleLinkedEntry) : null;

    const controlsRoot = document.getElementById('gradebook-assessment-controls');
    const studentViewRoot = document.getElementById('gradebook-student-view');
    const table = document.getElementById('gradebook-table');
    const tbody = document.getElementById('gradebook-body');
    if (controlsRoot) {
        controlsRoot.innerHTML = '';
        setGradebookShellVisibility(controlsRoot, false);
    }
    if (studentViewRoot) {
        studentViewRoot.innerHTML = '';
        setGradebookShellVisibility(studentViewRoot, false);
    }
    setGradebookShellVisibility(table, false);
    if (tbody) tbody.innerHTML = '';
    const theadRow = document.querySelector('#gradebook-table thead tr');
    if (theadRow) theadRow.innerHTML = '';

    const selectedStudentId = resolveLmsEmbeddedStaffSelectedStudentId(mockStudents, currentCriterionMeta, assessmentNumber);
    lmsEmbeddedGradebookSelectedStudentId = selectedStudentId;

    staffRoot.innerHTML = localizeHtmlMarkup(renderLmsEmbeddedStaffGradebook(
        currentScheme,
        currentCriterionMeta,
        assessmentNumber,
        selectedQuizDisplay,
        pendingReviewStudents.length,
        selectedStudentId
    ));
    setGradebookShellVisibility(staffRoot, true);
    syncGradebookVisualCustomProperties(staffRoot);
    calculateFinalGrades();
    syncFacultyGradebookInsights();
}

function initLmsEmbeddedStaffGradebook() {
    initStaffModernGradebook();
}

function getGradebookStaffAnalytics(students = mockStudents, scheme = getGradebookSchemeForRoster(currentRosterId), criterionMeta = getGradebookCriterionMeta(currentGradebookCriterion), assessmentNumber = currentGradebookAssessmentNumber) {
    const roster = (students || []).map(student => syncGradeRecordSummaries(ensureGradeRecordHistories(student)));
    const outcomes = roster.map(record => ({
        record,
        outcome: getGradebookVisibleOutcome(record, scheme),
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
            <div class="lms-route-panel lms-route-panel-pad-16-20 gb-staff-hero">
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
            <div class="gb-staff-stat-grid lux-strip-grid lux-strip-grid--adaptive">
                <div class="lux-strip-card surface-card"><span>Students</span><strong>${analytics.total}</strong></div>
                <div class="lux-strip-card surface-card"><span>Class Average</span><strong>${analytics.average}</strong></div>
                <div class="lux-strip-card surface-card"><span>Pending Review</span><strong>${analytics.pendingCount}</strong></div>
                <div class="lux-strip-card surface-card"><span>Fail Risk</span><strong>${analytics.riskCount}</strong></div>
                <div class="lux-strip-card surface-card"><span>High / Low</span><strong>${analytics.highest} / ${analytics.lowest}</strong></div>
            </div>
            ${selectedQuizDisplay ? `
                <div class="lms-route-panel lms-route-panel-compact gb-staff-linked-quiz">
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
    const scheme = getGradebookSchemeForRoster(currentRosterId);
    const rows = [['Student ID', 'Student Name', 'Score', 'Letter', 'Quiz', 'Oral Quiz', 'Class Assignment', 'Team Project', 'Homework', 'Midterm', 'Final', 'Retake']];
    (mockStudents || []).map(student => syncGradeRecordSummaries(ensureGradeRecordHistories(student))).forEach(record => {
        const outcome = getGradebookVisibleOutcome(record, scheme);
        rows.push([
            record.id || '',
            record.name || '',
            outcome.scoreLabel,
            outcome.letterLabel,
            getAssessmentDisplayValue(record, GRADEBOOK_CRITERIA.quiz),
            getAssessmentDisplayValue(record, GRADEBOOK_CRITERIA.oralQuiz),
            getAssessmentDisplayValue(record, GRADEBOOK_CRITERIA.classAssignment),
            getAssessmentDisplayValue(record, GRADEBOOK_CRITERIA.teamProject),
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
    const staffWorkspace = document.getElementById('gradebook-staff-lms-workspace');
    const isStaffRole = [USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(effectiveRole);
    if (isStaffModernGradebookContext() && isStaffRole) {
        initStaffModernGradebook();
        return;
    }
    if (staffWorkspace) {
        staffWorkspace.innerHTML = '';
        setGradebookShellVisibility(staffWorkspace, false);
    }
    const readOnly = ![USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(effectiveRole);
    const currentScheme = getGradebookSchemeForRoster(currentRosterId);
    const sheetSchemeSlot = document.getElementById('gradebook-sheet-scheme-controls');
    if (sheetSchemeSlot) {
        sheetSchemeSlot.innerHTML = getGradebookGradingSchemeControlsMarkup(currentScheme, false, {
            idPrefix: 'sheet-',
            totalId: 'gradebook-scheme-total-points',
            shellLabel: 'Subject grading scheme'
        });
    }
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
        if (staffWorkspace) {
            staffWorkspace.innerHTML = '';
            setGradebookShellVisibility(staffWorkspace, false);
        }
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
                        <span class="gb-status-badge lux-status-pill is-graded"><i class="fas fa-lock"></i> Student view</span>
                        <span class="gb-status-badge lux-status-pill is-missing"><i class="fas fa-users"></i> Group record</span>
                    </div>
                </div>
            `;
        }
        if (studentViewRoot) {
            setGradebookShellVisibility(studentViewRoot, true, 'block');
            studentViewRoot.innerHTML = localizeHtmlMarkup(renderStudentGradebookWorkspace(record, currentScheme));
            syncGradebookVisualCustomProperties(studentViewRoot);
        }
        setGradebookShellVisibility(table, false);
        if (theadRow) theadRow.innerHTML = '';
        tbody.innerHTML = '';
        return;
    }

    if (studentViewRoot) {
        studentViewRoot.innerHTML = '';
        setGradebookShellVisibility(studentViewRoot, false);
    }
    setGradebookShellVisibility(table, true, 'table');

    if (controlsRoot) {
        controlsRoot.innerHTML = `
            ${renderGradebookStaffOverview(currentScheme, currentCriterionMeta, assessmentNumber, selectedQuizDisplay)}
            <div class="lms-route-panel lms-route-panel-compact gb-staff-control-card">
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
                    ${getGradebookGradingSchemeControlsMarkup(currentScheme, false, {
                        idPrefix: 'staff-',
                        totalId: 'gradebook-scheme-total-points',
                        shellLabel: 'Grading scheme'
                    })}
                    ${selectedQuizDisplay ? `
                    <div class="lms-route-card lms-route-panel-compact gb-staff-linked-small is-${pendingReviewStudents.length ? 'pending' : 'ready'}">
                        <div class="gb-modern-kicker">Selected LMS Quiz</div>
                        <strong>${escapeHtml(selectedQuizDisplay.title)}</strong>
                        ${selectedQuizDisplay.subtitle ? `<div class="gb-staff-linked-subtitle">${escapeHtml(selectedQuizDisplay.subtitle)}</div>` : ''}
                        ${pendingReviewStudents.length
                            ? `<span class="gb-status-badge lux-status-pill is-pending"><i class="fas fa-triangle-exclamation"></i> ${pendingReviewStudents.length} need manual evaluation</span>`
                            : `<span class="gb-status-badge lux-status-pill is-graded"><i class="fas fa-circle-check"></i> No pending manual evaluation</span>`}
                    </div>
                ` : ''}
                </div>
            </div>
        `;
    }

    if (theadRow) {
        theadRow.innerHTML = `
            <th class="gb-roster-head-cell gb-roster-head-cell--left">Student ID</th>
            <th class="gb-roster-head-cell gb-roster-head-cell--left">Student Name</th>
            <th>Overall Score</th>
            <th>Letter Grade</th>
            <th>Quiz Status</th>
            <th class="gb-roster-head-cell gb-roster-head-cell--left">History</th>
        `;
    }

    if (!mockStudents.length) {
        tbody.innerHTML = `
            <tr class="gb-roster-empty-row">
                <td colspan="6">
                    <div class="lms-route-empty gb-sheet-empty">
                        <div class="lms-route-empty-title">No student records resolved</div>
                        <div class="lms-route-empty-copy">This roster currently has no resolved grade rows. If the section should contain students, check enrollment sync or return to the roster list and open a different group.</div>
                    </div>
                </td>
            </tr>
        `;
        syncGradebookVisualCustomProperties(tbody);
        calculateFinalGrades();
        return;
    }

    let html = '';
    mockStudents.forEach((st, i) => {
        const record = ensureGradeRecordHistories(st);
        const currentEntry = getDisplayAssessmentEntryForNumber(record, currentCriterionMeta.key, assessmentNumber)
            || getAssessmentEntryForNumber(record, currentCriterionMeta.key, assessmentNumber);
        const pendingReview = isAssessmentEntryPendingReview(record, currentCriterionMeta.key, assessmentNumber);
        const currentLinkedQuizSource = currentEntry ? resolveLmsQuizSourceFromAssessmentEntry(currentEntry) : null;
        const currentSubmission = currentLinkedQuizSource ? getLmsQuizSubmission(currentLinkedQuizSource.resourceKey, currentLinkedQuizSource.quizId, record.id) : null;
        const quizStatusClass = !currentLinkedQuizSource
            ? 'is-empty'
            : pendingReview || currentSubmission?.status === 'submitted' || currentSubmission?.status === 'auto-submitted'
                ? 'is-pending'
                : currentSubmission?.status === 'graded'
                    ? (currentSubmission.requiresManualReview ? 'is-reviewed' : 'is-auto-graded')
                    : currentSubmission?.status === 'in-progress'
                        ? 'is-in-progress'
                        : 'is-published';
        const quizStatusMarkup = !currentLinkedQuizSource
            ? '<span class="gb-quiz-status-pill is-empty">No linked quiz</span>'
            : pendingReview || currentSubmission?.status === 'submitted' || currentSubmission?.status === 'auto-submitted'
                ? '<span class="gb-quiz-status-pill is-pending"><i class="fas fa-triangle-exclamation"></i> Waiting for evaluation</span>'
                : currentSubmission?.status === 'graded'
                    ? `<span class="gb-quiz-status-pill ${currentSubmission.requiresManualReview ? 'is-reviewed' : 'is-auto-graded'}"><i class="fas ${currentSubmission.requiresManualReview ? 'fa-user-check' : 'fa-bolt'}"></i> ${currentSubmission.requiresManualReview ? 'Reviewed' : 'Auto graded'}</span>`
                    : currentSubmission?.status === 'in-progress'
                        ? '<span class="gb-quiz-status-pill is-in-progress"><i class="fas fa-hourglass-start"></i> In progress</span>'
                        : '<span class="gb-quiz-status-pill is-published"><i class="fas fa-circle-dot"></i> Published</span>';
        const currentEntryDisplay = currentEntry ? getAssessmentEntryDisplayContext(currentCriterionMeta.key, currentEntry) : null;
        html += `
            <tr data-idx="${i}">
                <td class="gb-roster-id-cell">${record.id}</td>
                <td class="gb-roster-name-cell">
                    <div class="gb-roster-student-cell">
                        <div>${escapeHtml(record.name)}</div>
                        <div class="gb-roster-student-actions">
                            <button type="button" class="lux-secondary-btn gb-roster-action-btn" data-gradebook-click="open-history" data-gradebook-student-id="${escapeHtml(String(record.id))}" data-gradebook-student-name="${escapeHtml(String(record.name || ''))}">
                                <i class="fas fa-clock"></i> View all history
                            </button>
                            <button type="button" class="lux-secondary-btn gb-roster-action-btn" data-gradebook-click="preview-student" data-gradebook-student-id="${escapeHtml(String(record.id))}" data-gradebook-student-name="${escapeHtml(String(record.name || ''))}">
                                <i class="fas fa-user-graduate"></i> Student Portal
                            </button>
                        </div>
                    </div>
                </td>
                <td id="pred-${i}" class="gb-roster-score-cell">-</td>
                <td id="letter-${i}" class="gb-roster-letter-cell">-</td>
                <td class="gb-roster-quiz-status-cell">${quizStatusMarkup}</td>
                <td id="history-${i}" class="gb-roster-history-column">
                    <div class="gb-roster-history-cell">
                        <div>${renderAssessmentHistoryChips(record, currentCriterionMeta.key)}</div>
                        ${renderGradebookScoreHistoryPanel({
                            record,
                            studentId: String(record.id || ''),
                            studentName: String(record.name || ''),
                            criterion: currentCriterionMeta.key,
                            assessmentNumber,
                            compact: true,
                            readOnlyHistory: isStaffModernGradebookContext()
                        })}
                        ${currentEntryDisplay?.linked ? `<div class="lms-route-card lms-route-panel-compact gb-roster-linked-summary ${quizStatusClass}"><div class="gb-roster-linked-title">${escapeHtml(currentEntryDisplay.title)}</div>${currentEntryDisplay.subtitle ? `<div class="gb-roster-linked-subtitle">${escapeHtml(currentEntryDisplay.subtitle)}</div>` : ''}${pendingReview ? `<div class="gb-roster-linked-note is-pending"><i class="fas fa-triangle-exclamation"></i> Manual answer still waiting</div>` : ''}</div>` : ''}
                    </div>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = localizeHtmlMarkup(html);
    syncGradebookVisualCustomProperties(tbody);
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
        logs.innerHTML = `<div class="gb-sheet-audit-entry"><em>${time}</em> - ${escapeHtml(getSimulatedUserName())} updated ID ${mockStudents[idx].id} <strong>${criterionMeta.label} ${assessmentNumber}</strong> from ${oldVal} to ${Number(val || 0)}.</div>` + logs.innerHTML;
    }

    KIU_STATE.studentGrades[currentRosterId] = mockStudents.map(student => ensureGradeRecordHistories(student));
    saveState();
    calculateFinalGrades();
}

function calculateFinalGrades() {
    const scheme = getGradebookSchemeForRoster(currentRosterId);
    const courseTotal = getGradebookSchemeTotalPoints(scheme);
    const totalLabel = `Course total: ${courseTotal} points`;
    const warn = document.getElementById('weight-total-warning');
    if (warn) {
        warn.innerText = totalLabel;
        warn.classList.add('is-balanced');
        warn.classList.remove('is-warning');
    }
    document.querySelectorAll('#gradebook-scheme-total-points, #lms-bulk-scheme-total-points, #lms-subject-scheme-total-points, [data-gb-scheme-total]').forEach(node => {
        node.textContent = totalLabel;
    });

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
            predCell.className = 'gb-roster-score-cell';
            return;
        }
        const synced = syncGradeRecordSummaries(st);
        const effectiveExamScore = getGradebookEffectiveExamScore(synced);
        const outcome = getGradebookVisibleOutcome(synced, scheme);
        const safeScore = Math.max(0, Math.min(100, Number(outcome.scoreLabel) || 0));
        const maxPotential = getGradebookSchemeMaxPotentialPercent(synced, scheme);

        const scoreClass = safeScore >= 71 ? 'gb-score-high' : safeScore >= 51 ? 'gb-score-mid' : 'gb-score-low';
        const barClass = safeScore >= 71 ? 'high' : safeScore >= 51 ? 'mid' : 'low';
        predCell.innerHTML = `<div class="${scoreClass}">${safeScore}</div><div class="gb-score-bar"><div class="gb-score-bar-fill ${barClass}" data-gb-score-width="${safeScore}"></div></div>`;
        syncGradebookVisualCustomProperties(predCell);
        
        let letter = 'F';
        let tone = 'danger';
        
        if (maxPotential < 51 && effectiveExamScore === 0) {
            letter = 'F (Predicted)';
            tone = 'danger';
        } else {
            if (safeScore >= 91) { letter = 'A'; tone = 'success'; }
            else if (safeScore >= 81) { letter = 'B'; tone = 'info'; }
            else if (safeScore >= 71) { letter = 'C'; tone = 'warning'; }
            else if (safeScore >= 61) { letter = 'D'; tone = 'warning'; }
            else if (safeScore >= 51) { letter = 'E'; tone = 'warning'; }
            else if (safeScore >= 41) { letter = 'FX'; tone = 'danger'; }
            
            if (effectiveExamScore === 0) {
                tone = 'muted';
            }
        }
        predCell.className = `gb-roster-score-cell is-${tone}`;

        const gradeClass = letter.charAt(0) === 'A' ? 'grade-a' : letter.charAt(0) === 'B' ? 'grade-b' : letter.charAt(0) === 'C' ? 'grade-c' : letter.charAt(0) === 'D' ? 'grade-d' : 'grade-f';
        letterCell.innerHTML = `<span class="gb-letter-badge ${gradeClass}">${letter.length > 2 ? letter : letter}</span>`;
        st.letter = /^[A-Z]/.test(letter) ? letter.charAt(0) : letter;
    });
}

function getGradebookNotificationWeights() {
    return getGradebookSchemeForRoster(currentRosterId);
}

function getGradebookVisibleOutcome(record, scheme = getGradebookSchemeForRoster(currentRosterId)) {
    const fields = ['q1', 'qa', 'mid', 'final'];
    const exception = fields.find(field => ['I', 'M', 'W'].includes(record?.[field])) || '';
    if (exception) {
        return {
            scoreLabel: exception,
            letterLabel: exception === 'I' ? 'Incomplete' : (exception === 'M' ? 'Medical' : 'Withdrawn'),
            letterStored: exception
        };
    }
    const synced = syncGradeRecordSummaries(ensureGradeRecordHistories({ ...(record || {}) }));
    const normalizedScheme = normalizeGradebookGradingScheme(scheme);
    const breakdown = computeGradebookSchemeBreakdown(synced, normalizedScheme);
    const finalScore = getGradebookEffectiveExamScore(synced);
    const safeScore = breakdown.percent;
    const maxPotential = getGradebookSchemeMaxPotentialPercent(synced, normalizedScheme);
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

window.isLmsEmbeddedGradebookContext = isLmsEmbeddedGradebookContext;
window.isFacultyStandaloneGradebookContext = isFacultyStandaloneGradebookContext;
window.isStaffModernGradebookContext = isStaffModernGradebookContext;
window.initLmsEmbeddedStaffGradebook = initLmsEmbeddedStaffGradebook;
window.initStaffModernGradebook = initStaffModernGradebook;
window.initFacultyGradebookPage = initFacultyGradebookPage;
window.buildFacultyGradebookAggregateRoster = buildFacultyGradebookAggregateRoster;
window.loadFacultyGradebookAggregateRoster = loadFacultyGradebookAggregateRoster;
window.populateFacultyGradebookFilters = populateFacultyGradebookFilters;
window.renderLmsEmbeddedStaffRosterList = renderLmsEmbeddedStaffRosterList;
window.renderLmsEmbeddedStaffGradingFocus = renderLmsEmbeddedStaffGradingFocus;
window.renderGradebookStaffEditableTranscript = renderGradebookStaffEditableTranscript;
window.renderStudentGradebookWorkspace = renderStudentGradebookWorkspace;
window.openLmsSubjectWeightsModal = openLmsSubjectWeightsModal;
window.closeLmsSubjectWeightsModal = closeLmsSubjectWeightsModal;
window.applyLmsSubjectWeightsToSelectedGroups = applyLmsSubjectWeightsToSelectedGroups;
window.getLmsSubjectGroupsForBulkWeights = getLmsSubjectGroupsForBulkWeights;
window.GRADEBOOK_CRITERIA = GRADEBOOK_CRITERIA;

