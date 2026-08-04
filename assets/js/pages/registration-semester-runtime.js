/* Semester/curriculum condition helpers. Peeled from registration.js.
 * Load before registration.js.
 */
(function initRegistrationSemesterRuntime() {
    if (window.__KIU_REGISTRATION_SEMESTER_LOADED) return;
    window.__KIU_REGISTRATION_SEMESTER_LOADED = true;

    window.__kiuCreateRegistrationSemesterApi = function createKiuPeelApi(deps = {}) {
        const d = deps;
        void d;
        /* Non-strict factory body: free vars resolve to window globals at call time. */
        const MAX_SEMESTER_DROPDOWN = typeof window.MAX_SEMESTER_DROPDOWN === 'number' ? window.MAX_SEMESTER_DROPDOWN : 12;
        window.MAX_SEMESTER_DROPDOWN = MAX_SEMESTER_DROPDOWN;
        const CUSTOM_SEMESTER_OPTION = '__custom_semester__';

function normalizeSemesterList(value) {
    const source = Array.isArray(value) ? value : [value];
    return [...new Set(source
        .map((entry) => toRegistrationPositiveInt(entry, 0))
        .filter((entry) => entry > 0))]
        .sort((left, right) => left - right);
}

function normalizeSubjectSemesters(subject) {
    if (!subject) return [];
    if (Array.isArray(subject.semesters) && subject.semesters.length) {
        return normalizeSemesterList(subject.semesters);
    }
    return normalizeSemesterList(subject.semester);
}

function getProgramSemesterCount(faculty, subjects = []) {
    const normalizedFaculty = String(faculty || (typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : '') || '').trim().toUpperCase();
    const bucket = typeof KIU_STATE !== 'undefined'
        ? KIU_STATE?.adminProgramStructures?.[normalizedFaculty]
        : null;
    const configured = toRegistrationPositiveInt(bucket?.programSemesterCount, 0);
    if (configured > 0) return Math.min(configured, MAX_SEMESTER_DROPDOWN);
    const highestAssigned = (Array.isArray(subjects) ? subjects : []).reduce((highest, subject) => (
        Math.max(highest, ...normalizeSubjectSemesters(subject))
    ), 0);
    return Math.max(1, Math.min(highestAssigned || 1, MAX_SEMESTER_DROPDOWN));
}

function getProgramSemesterList(faculty, subjects = []) {
    return Array.from({ length: getProgramSemesterCount(faculty, subjects) }, (_, index) => index + 1);
}

function getConfiguredProgramSemesterCount(faculty) {
    const normalizedFaculty = String(faculty || (typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : '') || '').trim().toUpperCase();
    const configured = toRegistrationPositiveInt(
        typeof KIU_STATE !== 'undefined' ? KIU_STATE?.adminProgramStructures?.[normalizedFaculty]?.programSemesterCount : 0,
        0
    );
    return configured > 0 ? Math.min(configured, MAX_SEMESTER_DROPDOWN) : 0;
}

function formatSemesterRoman(value) {
    const number = toRegistrationPositiveInt(value, 0);
    const numerals = [
        [10, 'X'],
        [9, 'IX'],
        [5, 'V'],
        [4, 'IV'],
        [1, 'I']
    ];
    let remaining = number;
    let result = '';
    numerals.forEach(([unit, symbol]) => {
        while (remaining >= unit) {
            result += symbol;
            remaining -= unit;
        }
    });
    return result || String(number || '?');
}

function renderSemesterDistributionCells(semesterList, assignedSemesters = []) {
    const assigned = new Set(normalizeSemesterList(assignedSemesters));
    return (Array.isArray(semesterList) ? semesterList : []).map((semester) => {
        const active = assigned.has(semester);
        const label = `Semester ${semester}`;
        return `<span class="lux-program-semester-cell${active ? ' is-active' : ''}" aria-label="${label}" title="${label}"><i class="fas fa-check" aria-hidden="true"></i></span>`;
    }).join('');
}

function renderSemesterDistributionHeader(semesterList) {
    return (Array.isArray(semesterList) ? semesterList : []).map((semester) => (
        `<span class="lux-program-semester-head-cell">${formatSemesterRoman(semester)}</span>`
    )).join('');
}

function subjectMatchesSemesterFilter(subject, filter) {
    if (!filter || filter === 'all') return true;
    const target = toRegistrationPositiveInt(filter, 0);
    if (!target) return true;
    return normalizeSubjectSemesters(subject).includes(target);
}

function formatSubjectSemestersLabel(semesters) {
    const list = normalizeSemesterList(semesters);
    if (!list.length) return 'No semesters';
    if (list.length === 1) return `Semester ${list[0]}`;
    return `Semesters ${list.join(', ')}`;
}

function formatCurriculumSubjectDisplayName(subject) {
    const name = String(subject?.name || '').trim();
    const code = String(subject?.id || '').trim();
    if (name && name.length > 2 && !/^\d+$/.test(name)) return name;
    if (name && /^\d+$/.test(name)) return `Course ${name}`;
    return code || name || 'Untitled Subject';
}

function formatCurriculumSubjectSubtitle(subject) {
    const name = String(subject?.name || '').trim();
    const code = String(subject?.id || '').trim();
    if (!code) return '';
    if (name && (/^\d+$/.test(name) || name.length <= 2)) return code;
    return '';
}

function getBuilderSubjectSemesters() {
    const hidden = document.getElementById('new-subject-semesters');
    if (!hidden) return [1];
    try {
        const parsed = JSON.parse(hidden.value || '[]');
        const list = normalizeSemesterList(parsed);
        return list.length ? list : [1];
    } catch (error) {
        return [1];
    }
}

function setBuilderSubjectSemesters(semesters) {
    const hidden = document.getElementById('new-subject-semesters');
    const list = normalizeSemesterList(semesters);
    const resolved = list.length ? list : [1];
    if (hidden) hidden.value = JSON.stringify(resolved);
    return resolved;
}

function getPrimarySemesterFromBuilder() {
    const semesters = getBuilderSubjectSemesters();
    return semesters[0] || 1;
}

function getSemesterParityDescriptionForSemesters(semesters) {
    const list = normalizeSemesterList(semesters);
    if (!list.length) {
        return 'Select at least one semester to see the availability rule.';
    }
    const parities = new Set(list.map((semester) => semester % 2));
    if (parities.size > 1) {
        return `Semesters ${list.join(', ')} span odd and even tracks. Use the override below if students in both tracks should see this subject.`;
    }
    return getSemesterParityDescription(list[0]);
}

function toRegistrationPositiveInt(value, fallback = 0) {
    const parsed = parseInt(String(value == null ? '' : value).trim(), 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function populateSemesterSelectOptions(control, config = {}) {
    const selectEl = typeof control === 'string' ? document.getElementById(control) : control;
    if (!(selectEl instanceof HTMLSelectElement)) return;

    const includeAll = config.includeAll === true;
    const includeCustom = config.includeCustom === true;
    const numberPrefix = config.numberPrefix || 'Semester';
    const previousValue = String(selectEl.value || selectEl.dataset.previousSemesterValue || (includeAll ? 'all' : '1'));
    const customValue = parseInt(selectEl.dataset.customSemesterValue || '', 10);
    const semesterLimit = config.programScoped
        ? (getConfiguredProgramSemesterCount(config.faculty) || MAX_SEMESTER_DROPDOWN)
        : MAX_SEMESTER_DROPDOWN;
    const customLabel = Number.isFinite(customValue)
        && (!config.programScoped || !getConfiguredProgramSemesterCount(config.faculty) || customValue <= semesterLimit)
        && customValue > semesterLimit
        ? `${numberPrefix} ${customValue}`
        : null;

    const options = [];
    if (includeAll) options.push({ value: 'all', label: 'All Semesters' });
    for (let semester = 1; semester <= semesterLimit; semester += 1) {
        options.push({ value: String(semester), label: `${numberPrefix} ${semester}` });
    }
    if (customLabel) {
        options.push({ value: String(customValue), label: customLabel });
    }
    if (includeCustom) {
        options.push({ value: CUSTOM_SEMESTER_OPTION, label: 'Custom Semester...' });
    }

    selectEl.innerHTML = options.map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`).join('');
    const resolvedValue = options.some((option) => option.value === previousValue)
        ? previousValue
        : (includeAll ? 'all' : '1');
    selectEl.value = resolvedValue;
    selectEl.dataset.previousSemesterValue = resolvedValue;

    if (!selectEl.dataset.customSemesterBound && includeCustom) {
        selectEl.addEventListener('change', () => {
            if (selectEl.value !== CUSTOM_SEMESTER_OPTION) {
                selectEl.dataset.previousSemesterValue = selectEl.value;
                return;
            }

            const entered = prompt('Enter a semester number:', selectEl.dataset.customSemesterValue || String(MAX_SEMESTER_DROPDOWN + 1));
            const fallbackValue = selectEl.dataset.previousSemesterValue || (includeAll ? 'all' : '1');
            const parsed = parseInt(String(entered || '').trim(), 10);
            if (!Number.isFinite(parsed) || parsed < 1) {
                selectEl.value = fallbackValue;
                return;
            }

            if (config.programScoped && parsed > semesterLimit) {
                selectEl.value = fallbackValue;
                return;
            }
            if (parsed > MAX_SEMESTER_DROPDOWN) {
                selectEl.dataset.customSemesterValue = String(parsed);
            } else {
                delete selectEl.dataset.customSemesterValue;
            }

            populateSemesterSelectOptions(selectEl, config);
            selectEl.value = String(parsed);
            selectEl.dataset.previousSemesterValue = selectEl.value;
            selectEl.dispatchEvent(new Event('change'));
        });
        selectEl.dataset.customSemesterBound = '1';
    }
}

function getSemesterNumberFromControl(control, fallback = 1) {
    const selectEl = typeof control === 'string' ? document.getElementById(control) : control;
    if (!(selectEl instanceof HTMLSelectElement)) return fallback;
    const rawValue = selectEl.value === CUSTOM_SEMESTER_OPTION
        ? (selectEl.dataset.customSemesterValue || fallback)
        : (selectEl.value || fallback);
    const parsed = parseInt(String(rawValue).trim(), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getSemesterParityDescription(semesterValue) {
    const semester = parseInt(semesterValue, 10);
    if (!Number.isFinite(semester) || semester <= 0) {
        return 'Select a semester to see the availability rule.';
    }
    return semester % 2 === 1
        ? `Semester ${semester} is odd. This subject is visible in odd semesters unless the override is enabled.`
        : `Semester ${semester} is even. This subject is visible in even semesters unless the override is enabled.`;
}

const SEMESTER_DROPDOWN_CONFIGS = [
    { id: 'filter-curriculum-semester', includeAll: true, includeCustom: true, numberPrefix: 'Sem', programScoped: true },
    { id: 'admin-active-semester', includeCustom: true, numberPrefix: 'Semester' },
    { id: 'admin-tt-semester', includeCustom: true, numberPrefix: 'Sem' },
    { id: 'admin-generate-semester', includeCustom: true, numberPrefix: 'Sem' },
    { id: 'stu-reg-semester', includeCustom: true, numberPrefix: 'Semester' },
    { id: 'new-user-semester', includeCustom: true, numberPrefix: 'Semester' }
];

function refreshSemesterDropdowns() {
    SEMESTER_DROPDOWN_CONFIGS.forEach((cfg) => {
        document.querySelectorAll(`#${cfg.id}`).forEach((selectEl) => populateSemesterSelectOptions(selectEl, cfg));
    });
}

function ensureSubjectSemesterParityHint() {
    refreshSemesterDropdowns();
    const hint = document.getElementById('new-subject-semester-parity-hint');
    const hiddenSemesters = document.getElementById('new-subject-semesters');
    if (!hint) return;
    hint.classList.add('registration-structured-help', 'lux-admin-tools-parity-callout');

    let exceptionWrap = document.getElementById('new-subject-semester-parity-exception-wrap');
    if (!exceptionWrap) {
        exceptionWrap = document.createElement('div');
        exceptionWrap.id = 'new-subject-semester-parity-exception-wrap';
        exceptionWrap.className = 'registration-parity-exception lux-admin-tools-parity-exception';
        exceptionWrap.innerHTML = `
            <input id="new-subject-parity-both-checkbox" class="registration-parity-exception-checkbox" type="checkbox">
            <label for="new-subject-parity-both-checkbox" class="registration-parity-exception-label">Make this subject available in both odd and even semesters</label>
        `;
        hint.insertAdjacentElement('afterend', exceptionWrap);
    }

    const exceptionCheckbox = document.getElementById('new-subject-parity-both-checkbox');
    const updateHint = () => {
        const semesters = getBuilderSubjectSemesters();
        const extra = exceptionCheckbox instanceof HTMLInputElement && exceptionCheckbox.checked
            ? ' Override enabled: students in both parity tracks can see this subject.'
            : '';
        hint.textContent = `${getSemesterParityDescriptionForSemesters(semesters)}${extra}`;
    };

    if (hiddenSemesters && !hiddenSemesters.dataset.parityHintBound) {
        hiddenSemesters.addEventListener('change', updateHint);
        hiddenSemesters.dataset.parityHintBound = '1';
    }
    if (exceptionCheckbox instanceof HTMLInputElement && !exceptionCheckbox.dataset.parityHintBound) {
        exceptionCheckbox.addEventListener('change', updateHint);
        exceptionCheckbox.dataset.parityHintBound = '1';
    }

    updateHint();
}

function toggleConditionBox() {
    const checkbox = document.getElementById('has-condition-checkbox');
    const container = document.getElementById('condition-box-container');
    if (!(checkbox instanceof HTMLInputElement) || !container) return;
    if (checkbox.checked) {
        container.hidden = false;
        container.style.removeProperty('display');
        filterSubjects('');
    } else {
        container.hidden = true;
        clearConditionSelection();
    }
}

function getSelectedConditionEntries() {
    const badge = document.getElementById('selected-condition-badge');
    if (!badge) return [];
    try {
        const parsed = JSON.parse(badge.dataset.conditions || '[]');
        return Array.isArray(parsed)
            ? parsed.filter((entry) => entry && entry.code && entry.code !== 'None')
            : [];
    } catch (_) {
        return [];
    }
}

function renderSelectedConditionEntries(entries) {
    const badge = document.getElementById('selected-condition-badge');
    const text = document.getElementById('selected-condition-text');
    const input = document.getElementById('subject-search-input');
    if (!badge || !text) return;

    const normalized = [...new Map((entries || [])
        .map((entry) => [String(entry.code || '').trim(), { code: String(entry.code || '').trim(), name: String(entry.name || entry.code || '').trim() }]))
        .values()]
        .filter((entry) => entry.code && entry.code !== 'None');

    badge.classList.add('registration-condition-badge');
    badge.dataset.conditions = JSON.stringify(normalized);
    badge.dataset.value = normalized.length > 0
        ? normalized.map((entry) => `[REQ] ${entry.code}`).join(', ')
        : 'None';
    badge.hidden = normalized.length === 0;
    text.innerHTML = normalized.map((entry) => `
        <span class="registration-condition-chip home-hover-chip">
            <span>[${escapeHtml(entry.code)}] ${escapeHtml(entry.name)}</span>
            <button type="button" class="registration-condition-chip-remove" data-condition-action="remove" data-subject-code="${escapeHtml(entry.code)}">&times;</button>
        </span>
    `).join('');
    if (input) input.hidden = false;
}

function addConditionSelection(code, name) {
    const normalizedCode = String(code || '').trim();
    if (!normalizedCode) return;
    const entries = getSelectedConditionEntries();
    if (!entries.some((entry) => entry.code === normalizedCode)) {
        entries.push({ code: normalizedCode, name: String(name || normalizedCode).trim() || normalizedCode });
    }
    renderSelectedConditionEntries(entries);
}

function removeConditionSelection(code) {
    const normalizedCode = String(code || '').trim();
    renderSelectedConditionEntries(getSelectedConditionEntries().filter((entry) => entry.code !== normalizedCode));
}

function clearConditionSelection() {
    renderSelectedConditionEntries([]);
    const input = document.getElementById('subject-search-input');
    if (input) input.value = '';
    const list = document.getElementById('subject-search-results');
    if (list) list.hidden = true;
}

        const api = {
            normalizeSemesterList,
            normalizeSubjectSemesters,
            getProgramSemesterCount,
            getProgramSemesterList,
            getConfiguredProgramSemesterCount,
            formatSemesterRoman,
            renderSemesterDistributionCells,
            renderSemesterDistributionHeader,
            subjectMatchesSemesterFilter,
            formatSubjectSemestersLabel,
            formatCurriculumSubjectDisplayName,
            formatCurriculumSubjectSubtitle,
            getBuilderSubjectSemesters,
            setBuilderSubjectSemesters,
            getPrimarySemesterFromBuilder,
            getSemesterParityDescriptionForSemesters,
            toRegistrationPositiveInt,
            populateSemesterSelectOptions,
            getSemesterNumberFromControl,
            getSemesterParityDescription,
            refreshSemesterDropdowns,
            ensureSubjectSemesterParityHint,
            SEMESTER_DROPDOWN_CONFIGS,
            toggleConditionBox,
            getSelectedConditionEntries,
            renderSelectedConditionEntries,
            addConditionSelection,
            removeConditionSelection,
            clearConditionSelection,
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateRegistrationSemesterApi({});
})();
