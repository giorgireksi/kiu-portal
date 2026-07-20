/* Curriculum eligibility + gradebook score helpers. Peeled from student-registration.js.
 * Load before student-registration.js.
 */
(function initStudentRegistrationEligibilityRuntime() {
    if (window.__KIU_STUDENT_REGISTRATION_ELIGIBILITY_LOADED) return;
    window.__KIU_STUDENT_REGISTRATION_ELIGIBILITY_LOADED = true;

    window.__kiuCreateStudentRegistrationEligibilityApi = function createKiuPeelApi(deps = {}) {
        const d = deps;
        void d;
        /* Non-strict factory body: free vars resolve to window globals at call time. */

function canonicalCourseKey(value) {
    return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function normalizeSubjectTitleKey(value) {
    return cleanupEncodingArtifacts(toEnglishText(String(value || '')))
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function getAllCurriculumSubjects() {
    const fp = KIU_STATE.facultyProfiles || KIU_EMPTY_STATE.facultyProfiles;
    const subjects = [];
    const seen = new Set();

    Object.keys(fp || {}).forEach(fac => {
        (getActiveCurriculum(fac) || []).forEach(subject => {
            const key = canonicalCourseKey(subject?.id);
            if (!key || seen.has(key)) return;
            seen.add(key);
            subjects.push(subject);
        });
    });

    (KIU_STATE.curriculum || []).forEach(subject => {
        const key = canonicalCourseKey(subject?.id);
        if (!key || seen.has(key)) return;
        seen.add(key);
        subjects.push(subject);
    });

    return subjects;
}

function findCurriculumSubjectByIdOrTitle(subjectId, subjectTitle = '', preferredFaculty = null) {
    const targetKey = canonicalCourseKey(subjectId);
    const titleKey = normalizeSubjectTitleKey(subjectTitle);
    const allSubjects = getAllCurriculumSubjects();

    if (targetKey && preferredFaculty) {
        const preferredById = (getActiveCurriculum(preferredFaculty) || [])
            .find(subject => canonicalCourseKey(subject?.id) === targetKey);
        if (preferredById) return preferredById;
    }

    if (targetKey) {
        const exactById = allSubjects.find(subject => canonicalCourseKey(subject?.id) === targetKey);
        if (exactById) return exactById;
    }

    if (titleKey && preferredFaculty) {
        const preferredByTitle = (getActiveCurriculum(preferredFaculty) || [])
            .find(subject => normalizeSubjectTitleKey(subject?.name) === titleKey);
        if (preferredByTitle) return preferredByTitle;
    }

    if (!titleKey) return null;
    return allSubjects.find(subject => normalizeSubjectTitleKey(subject?.name) === titleKey) || null;
}

function getEquivalentCurriculumSubjectIds(subjectId, subjectTitle = '', preferredFaculty = null) {
    const matchedSubject = findCurriculumSubjectByIdOrTitle(subjectId, subjectTitle, preferredFaculty);
    const matchedTitleKey = normalizeSubjectTitleKey(matchedSubject?.name || subjectTitle);
    const ids = new Set();
    if (subjectId) ids.add(String(subjectId).trim());
    if (matchedSubject?.id) ids.add(String(matchedSubject.id).trim());
    if (!matchedTitleKey) return [...ids].filter(Boolean);

    getAllCurriculumSubjects().forEach(subject => {
        if (normalizeSubjectTitleKey(subject?.name) === matchedTitleKey && subject?.id) {
            ids.add(String(subject.id).trim());
        }
    });

    return [...ids].filter(Boolean);
}

function findAvailableGroupForAssignedSubject(courseId, courseName, groupId) {
    const normalizedGroupId = String(groupId || '').trim().toLowerCase();
    if (!normalizedGroupId) return null;

    const activeFaculty = normalizeFacultyCode(getCurrentFaculty(), 'ECON');
    const candidateIds = getEquivalentCurriculumSubjectIds(courseId, courseName, getCurrentFaculty());
    for (const candidateId of candidateIds) {
        const group = (KIU_STATE.availableGroups?.[candidateId] || [])
            .find(item => {
                if (String(item?.id || '').trim().toLowerCase() !== normalizedGroupId) return false;
                const derivedFaculty = typeof deriveFacultyFromSubjectId === 'function' ? deriveFacultyFromSubjectId(candidateId) : '';
                const groupFaculty = normalizeFacultyCode(item?.faculty || derivedFaculty || activeFaculty, activeFaculty);
                return groupFaculty === activeFaculty;
            });
        if (group) return { courseId: candidateId, group };
    }
    return null;
}

// Legacy admin quiz/exam studio helpers were removed from the standalone student registration runtime.
// The live exams route now owns that surface in assets/js/pages/exams-console.js, and registration/admin-tools do not mount admin-exams roots.

function parseRequiredCourseIds(condText) {
    const raw = String(condText || '').trim();
    if (!raw || raw.toLowerCase() === 'none') return [];
    const matches = raw.toUpperCase().match(/[A-Z]+(?:-[A-Z0-9]+)+/g) || [];
    return [...new Set(matches)];
}

function getCourseByIdForRegistration(courseId, preferredFaculty = null, subjectTitle = '') {
    return findCurriculumSubjectByIdOrTitle(courseId, subjectTitle, preferredFaculty);
}

function resolveSubjectIdFromRosterId(rosterId, subjectList) {
    const byCanonical = new Map((subjectList || []).map(s => [canonicalCourseKey(s.id), s.id]));
    const raw = String(rosterId || '').trim().toUpperCase();
    if (!raw) return null;

    const base = raw.split('::')[0];
    const candidates = [
        base,
        base.replace(/_/g, '-'),
        base.replace(/[_-]?G\d+$/i, ''),
        base.replace(/[_-]?GROUP\d+$/i, '')
    ];

    for (const candidate of candidates) {
        const key = canonicalCourseKey(candidate);
        if (byCanonical.has(key)) return byCanonical.get(key);
    }

    const compactBase = canonicalCourseKey(base.replace(/[_-]?G\d+$/i, ''));
    if (!compactBase) return null;
    const prefixMatches = (subjectList || [])
        .map(s => ({ id: s.id, key: canonicalCourseKey(s.id) }))
        .filter(s => s.key.startsWith(compactBase))
        .sort((a, b) => a.key.length - b.key.length);

    return prefixMatches[0]?.id || null;
}

function getRegisteredOrPassedCourses(studentId) {
    const keySet = new Set();
    const addCourse = (courseId) => {
        const key = canonicalCourseKey(courseId);
        if (key) keySet.add(key);
    };

    // Explicitly passed courses (if maintained externally).
    (KIU_STATE.studentPassedCourses?.[studentId] || []).forEach(addCourse);

    const fp = KIU_STATE.facultyProfiles || KIU_EMPTY_STATE.facultyProfiles;
    const subjectList = [
        ...Object.keys(fp || {}).flatMap(fac => getActiveCurriculum(fac) || []),
        ...(KIU_STATE.curriculum || [])
    ].filter((subj, idx, arr) => subj?.id && arr.findIndex(s => s?.id === subj.id) === idx);

    Object.entries(KIU_STATE.studentGrades || {}).forEach(([rosterId, roster]) => {
        const record = (roster || []).find(entry => String(entry.id) === String(studentId));
        if (!record) return;
        if (!isGradeRecordPassedByKiuRule(record)) return;

        const resolvedSubjectId = resolveSubjectIdFromRosterId(rosterId, subjectList);
        addCourse(resolvedSubjectId);
    });

    return keySet;
}

function getCurrentStudentSemesterNumber(student) {
    const explicitSemester = parseInt(student?.semester, 10);
    if (Number.isFinite(explicitSemester) && explicitSemester > 0) return explicitSemester;

    const activeSemester = parseInt(KIU_STATE.activeSemester, 10);
    if (Number.isFinite(activeSemester) && activeSemester > 0) return activeSemester;

    const courseYear = parseInt(student?.course, 10);
    if (Number.isFinite(courseYear) && courseYear > 0) {
        const calculatedSemester = parseInt(calculateStudentSemester(courseYear), 10);
        if (Number.isFinite(calculatedSemester) && calculatedSemester > 0) return calculatedSemester;
    }

    return 1;
}

function evaluateStudentCourseEligibility(student, courseDef, passedCourseSet, studentSemester) {
    const reasons = [];
    const normalizedStudentSemester = Number.isFinite(studentSemester) ? studentSemester : getCurrentStudentSemesterNumber(student);
    const assignmentRestriction = normalizeAssignedSemesterRestriction(courseDef?.semesterRuleMode, courseDef?.allowedSemesters);
    const assignmentRestrictionReason = getAssignedSemesterRestrictionReason(courseDef, normalizedStudentSemester);
    if (assignmentRestrictionReason) {
        reasons.push(assignmentRestrictionReason);
    }
    const courseSemester = parseInt(courseDef?.semester, 10);
    const allowBothParity = String(courseDef?.parityMode || courseDef?.semesterParity || '').toLowerCase() === 'both';

    if (assignmentRestriction.semesterRuleMode === 'all' && !allowBothParity && Number.isFinite(courseSemester) && courseSemester > 0) {
        const isParityMismatch = (normalizedStudentSemester % 2) !== (courseSemester % 2);
        if (isParityMismatch) {
            const expectedParity = courseSemester % 2 === 0 ? 'even' : 'odd';
            reasons.push(`Restricted to ${expectedParity}-semester students only.`);
        }
    }

    const requiredCourseIds = parseRequiredCourseIds(courseDef?.cond);
    if (requiredCourseIds.length > 0) {
        const missing = requiredCourseIds.filter(reqId => !passedCourseSet.has(canonicalCourseKey(reqId)));
        if (missing.length > 0) {
            reasons.push(`Prerequisite course(s) not completed: ${missing.join(', ')}`);
        }
    }

    const antiCourseIds = parseRequiredCourseIds(courseDef?.antireq);
    if (antiCourseIds.length > 0) {
        const blocked = antiCourseIds.filter(reqId => passedCourseSet.has(canonicalCourseKey(reqId)));
        if (blocked.length > 0) {
            reasons.push(`Anti-requisite restriction: ${blocked.join(', ')}`);
        }
    }

    return { allowed: reasons.length === 0, reasons };
}

function parseEctsProgress(rawValue, fallbackMax = 0) {
    const text = String(rawValue || '').trim();
    if (!text) return { max: Number(fallbackMax) || 0, completed: 0 };

    const parts = text.includes('/') ? text.split('/') : text.includes('-') ? text.split('-') : [text];
    const max = parseInt(parts[0], 10);
    const completed = parseInt(parts[1], 10);

    return {
        max: Number.isFinite(max) ? max : (Number(fallbackMax) || 0),
        completed: Number.isFinite(completed) ? completed : 0
    };
}

function formatEctsProgress(max, completed = 0) {
    const safeMax = Number.isFinite(Number(max)) ? Number(max) : 0;
    const safeCompleted = Number.isFinite(Number(completed)) ? Number(completed) : 0;
    return `${safeMax}/${safeCompleted}`;
}

function closeStructuredFormModal() {
    if (typeof window.__kiuStructuredFormCleanup === 'function') {
        window.__kiuStructuredFormCleanup();
        window.__kiuStructuredFormCleanup = null;
    }
    const existing = document.getElementById('kiu-structured-form-modal');
    if (existing) existing.remove();
}

function escapeHtml(value) {
    if (typeof window !== 'undefined' && typeof window.escapeHtml === 'function') {
        const shared = window.escapeHtml;
        if (shared !== escapeHtml) return shared(value);
    }
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function jsQuote(value) {
    return `'${String(value == null ? '' : value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function toPositiveInt(value, fallback = 0) {
    const parsed = parseInt(String(value == null ? '' : value).trim(), 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function buildStructuredFormFieldNode(field) {
    const wrapper = document.createElement('div');
    wrapper.className = 'registration-structured-field';

    const id = field.name;
    const label = document.createElement('label');
    label.htmlFor = id;
    label.className = 'registration-structured-label';
    label.textContent = field.label || field.name;
    wrapper.appendChild(label);

    let control;
    if (field.type === 'textarea') {
        control = document.createElement('textarea');
        control.rows = field.rows || 3;
        control.className = `registration-structured-control registration-structured-control--textarea${field.readonly || field.disabled ? ' is-muted' : ''}`;
        control.value = field.value == null ? '' : String(field.value);
    } else if (field.type === 'select') {
        control = document.createElement('select');
        control.className = `registration-structured-control${field.disabled ? ' is-muted' : ''}`;
        (field.options || []).forEach((opt) => {
            const option = document.createElement('option');
            option.value = String(opt.value);
            option.textContent = String(opt.label);
            option.selected = String(opt.value) === String(field.value);
            control.appendChild(option);
        });
    } else {
        control = document.createElement('input');
        control.type = field.type || 'text';
        control.className = `registration-structured-control${field.readonly || field.disabled ? ' is-muted' : ''}`;
        control.value = field.value == null ? '' : String(field.value);
        if (field.min != null) control.min = String(field.min);
        if (field.max != null) control.max = String(field.max);
        if (field.step != null) control.step = String(field.step);
    }

    control.id = id;
    control.name = id;
    if (field.placeholder) control.placeholder = String(field.placeholder);
    if (field.readonly) control.readOnly = true;
    if (field.disabled) control.disabled = true;
    wrapper.appendChild(control);

    if (field.help) {
        const help = document.createElement('div');
        help.className = 'registration-structured-help';
        help.textContent = String(field.help);
        wrapper.appendChild(help);
    }

    return wrapper;
}

function openStructuredFormModal(config) {
    closeStructuredFormModal();

    const fields = config.fields || [];
    const modal = document.createElement('div');
    modal.id = 'kiu-structured-form-modal';
    modal.className = 'registration-structured-modal-backdrop';

    const card = document.createElement('div');
    card.className = 'registration-structured-modal-card';

    const header = document.createElement('div');
    header.className = 'registration-structured-modal-head';
    const headerCopy = document.createElement('div');
    headerCopy.className = 'registration-structured-modal-copy';
    const headerTitle = document.createElement('div');
    headerTitle.className = 'registration-structured-modal-title';
    headerTitle.textContent = config.title || 'Edit Item';
    const headerSubtitle = document.createElement('div');
    headerSubtitle.className = 'registration-structured-modal-subtitle';
    headerSubtitle.textContent = config.subtitle || 'Fill in the details below.';
    headerCopy.append(headerTitle, headerSubtitle);
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.id = 'kiu-structured-form-close';
    closeBtn.className = 'registration-structured-modal-close';
    closeBtn.textContent = '×';
    header.append(headerCopy, closeBtn);

    const form = document.createElement('form');
    form.id = 'kiu-structured-form';
    form.className = 'registration-structured-form';
    const body = document.createElement('div');
    body.className = 'registration-structured-modal-body';
    const grid = document.createElement('div');
    grid.className = 'registration-structured-grid';
    fields.forEach((field) => grid.appendChild(buildStructuredFormFieldNode(field)));
    body.appendChild(grid);
    const footer = document.createElement('div');
    footer.className = 'registration-structured-modal-footer';
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.id = 'kiu-structured-form-cancel';
    cancelBtn.className = 'lux-secondary-btn registration-structured-modal-action';
    cancelBtn.textContent = 'Cancel';
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'lux-primary-btn registration-structured-modal-action';
    submitBtn.textContent = config.submitLabel || 'Save';
    footer.append(cancelBtn, submitBtn);
    form.append(body, footer);
    card.append(header, form);
    modal.appendChild(card);
    document.body.appendChild(modal);

    const onKeyDown = (event) => {
        if (event.key === 'Escape') close();
    };
    const close = () => closeStructuredFormModal();
    window.__kiuStructuredFormCleanup = () => {
        window.removeEventListener('keydown', onKeyDown);
    };
    if (closeBtn) closeBtn.onclick = close;
    if (cancelBtn) cancelBtn.onclick = close;
    window.addEventListener('keydown', onKeyDown);
    if (modal) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) close();
        });
    }

    if (form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const values = {};
            fields.forEach(field => {
                const el = document.getElementById(field.name);
                values[field.name] = el ? el.value : '';
            });
            if (typeof config.onSave === 'function') {
                config.onSave(values, close);
            } else {
                close();
            }
        });
    }

    setTimeout(() => {
        const firstField = modal?.querySelector('input, textarea, select');
        if (firstField && typeof firstField.focus === 'function') firstField.focus();
    }, 0);
}

window.STUDENT_REGISTRATION_GRADEBOOK_CRITERIA = window.STUDENT_REGISTRATION_GRADEBOOK_CRITERIA || {
    quiz: { key: 'quiz', legacyKey: 'q1', aggregateMode: 'sum', maxScore: 10 },
    homework: { key: 'homework', legacyKey: 'qa', aggregateMode: 'average', maxScore: 100 },
    midterm: { key: 'midterm', legacyKey: 'mid', aggregateMode: 'sum', maxScore: 100 },
    final: { key: 'final', legacyKey: 'final', aggregateMode: 'sum', maxScore: 100 },
    retake: { key: 'retake', legacyKey: 'retake', aggregateMode: 'sum', maxScore: 100 }
};
var STUDENT_REGISTRATION_GRADEBOOK_CRITERIA = window.STUDENT_REGISTRATION_GRADEBOOK_CRITERIA;

function getStudentRegistrationGradebookCriterionMeta(criterionKey) {
    return STUDENT_REGISTRATION_GRADEBOOK_CRITERIA[String(criterionKey || '').trim()] || {
        key: String(criterionKey || '').trim(),
        legacyKey: null,
        aggregateMode: 'average',
        maxScore: 100
    };
}

function normalizeStudentRegistrationAssessmentNumber(value, fallback = 1) {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function sortStudentRegistrationAssessmentEntries(entries = []) {
    return [...entries].sort((a, b) => normalizeStudentRegistrationAssessmentNumber(a?.number, 1) - normalizeStudentRegistrationAssessmentNumber(b?.number, 1));
}

function aggregateStudentRegistrationAssessmentEntries(entries = [], mode = 'average') {
    const scores = (entries || []).reduce((list, entry) => {
        const numericScore = Number(entry?.score);
        if (Number.isFinite(numericScore)) list.push(numericScore);
        return list;
    }, []);
    if (!scores.length) return 0;
    if (mode === 'sum') return Math.min(100, Math.round(scores.reduce((sum, score) => sum + score, 0)));
    if (mode === 'latest') return scores[scores.length - 1];
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function ensureStudentRegistrationGradeRecordHistories(record = {}) {
    const safeRecord = { ...(record || {}) };
    safeRecord.assessments = safeRecord.assessments && typeof safeRecord.assessments === 'object'
        ? { ...safeRecord.assessments }
        : {};

    Object.values(STUDENT_REGISTRATION_GRADEBOOK_CRITERIA).forEach((meta) => {
        let entries = Array.isArray(safeRecord.assessments[meta.key]) ? safeRecord.assessments[meta.key] : [];
        entries = entries
            .filter((entry) => entry && typeof entry === 'object')
            .map((entry, index) => ({
                ...entry,
                number: normalizeStudentRegistrationAssessmentNumber(entry.number, index + 1),
                score: Number.isFinite(Number(entry.score)) ? Number(entry.score) : null,
                history: Array.isArray(entry.history) ? entry.history.filter((item) => item && typeof item === 'object') : []
            }));

        if (!entries.length && Number.isFinite(Number(safeRecord[meta.legacyKey])) && Number(safeRecord[meta.legacyKey]) > 0) {
            entries.push({
                number: 1,
                score: Number(safeRecord[meta.legacyKey]),
                updatedAt: safeRecord.updatedAt || null,
                updatedBy: safeRecord.updatedBy || null,
                history: []
            });
        }

        safeRecord.assessments[meta.key] = sortStudentRegistrationAssessmentEntries(entries);
        if (meta.legacyKey) {
            safeRecord[meta.legacyKey] = aggregateStudentRegistrationAssessmentEntries(safeRecord.assessments[meta.key], meta.aggregateMode);
        }
    });

    return safeRecord;
}

function getStudentRegistrationAssessmentDisplayValue(record, meta) {
    const safeRecord = ensureStudentRegistrationGradeRecordHistories(record || {});
    const entries = sortStudentRegistrationAssessmentEntries(safeRecord.assessments?.[meta?.key] || []);
    if (entries.length) {
        return aggregateStudentRegistrationAssessmentEntries(entries, meta?.aggregateMode || 'average');
    }
    if (meta?.legacyKey && Number.isFinite(Number(safeRecord?.[meta.legacyKey]))) {
        return Number(safeRecord[meta.legacyKey]);
    }
    return 0;
}

function getStudentEffectiveFinalRetakeScore(record) {
    const safeRecord = ensureStudentRegistrationGradeRecordHistories(record || {});
    const finalScore = Number(getStudentRegistrationAssessmentDisplayValue(safeRecord, STUDENT_REGISTRATION_GRADEBOOK_CRITERIA.final) || safeRecord.final || 0);
    const retakeScore = Number(getStudentRegistrationAssessmentDisplayValue(safeRecord, STUDENT_REGISTRATION_GRADEBOOK_CRITERIA.retake) || safeRecord.retake || 0);
    return Math.max(finalScore, retakeScore);
}

function getGradebookWeightProfile(rosterId = '') {
    if (typeof getGradebookWeightProfileForRoster === 'function') {
        return getGradebookWeightProfileForRoster(rosterId);
    }
    const q1 = Number(document.getElementById('weight-q1')?.value || 10) / 100;
    const qa = Number(document.getElementById('weight-qa')?.value || 10) / 100;
    const mid = Number(document.getElementById('weight-mid')?.value || 30) / 100;
    const fin = Number(document.getElementById('weight-fin')?.value || 50) / 100;
    return {
        q1: Number.isFinite(q1) ? q1 : 0.10,
        qa: Number.isFinite(qa) ? qa : 0.10,
        mid: Number.isFinite(mid) ? mid : 0.30,
        fin: Number.isFinite(fin) ? fin : 0.50
    };
}

function getGradeRecordCombinedKiuPassScore(record, rosterId = '') {
    const safeRecord = ensureStudentRegistrationGradeRecordHistories(record || {});
    const weights = getGradebookWeightProfile(rosterId);
    const toWeightedPercentPoints = (meta, value, weightFraction) => {
        const numericValue = Number(value || 0);
        const maxScore = Math.max(1, Number(meta?.maxScore || 100));
        return Math.max(0, Math.min(1, numericValue / maxScore)) * (weightFraction * 100);
    };
    const quizMeta = getStudentRegistrationGradebookCriterionMeta(STUDENT_REGISTRATION_GRADEBOOK_CRITERIA.quiz.key);
    const homeworkMeta = getStudentRegistrationGradebookCriterionMeta(STUDENT_REGISTRATION_GRADEBOOK_CRITERIA.homework.key);
    const midtermMeta = getStudentRegistrationGradebookCriterionMeta(STUDENT_REGISTRATION_GRADEBOOK_CRITERIA.midterm.key);
    const finalMeta = getStudentRegistrationGradebookCriterionMeta(STUDENT_REGISTRATION_GRADEBOOK_CRITERIA.final.key);
    const retakeMeta = getStudentRegistrationGradebookCriterionMeta(STUDENT_REGISTRATION_GRADEBOOK_CRITERIA.retake.key);
    const preFinalScore = toWeightedPercentPoints(quizMeta, getStudentRegistrationAssessmentDisplayValue(safeRecord, STUDENT_REGISTRATION_GRADEBOOK_CRITERIA.quiz), weights.q1)
        + toWeightedPercentPoints(homeworkMeta, getStudentRegistrationAssessmentDisplayValue(safeRecord, STUDENT_REGISTRATION_GRADEBOOK_CRITERIA.homework), weights.qa)
        + toWeightedPercentPoints(midtermMeta, getStudentRegistrationAssessmentDisplayValue(safeRecord, STUDENT_REGISTRATION_GRADEBOOK_CRITERIA.midterm), weights.mid);
    const finalCombined = preFinalScore + toWeightedPercentPoints(finalMeta, getStudentRegistrationAssessmentDisplayValue(safeRecord, STUDENT_REGISTRATION_GRADEBOOK_CRITERIA.final) || safeRecord.final || 0, weights.fin);
    const retakeCombined = preFinalScore + toWeightedPercentPoints(retakeMeta, getStudentRegistrationAssessmentDisplayValue(safeRecord, STUDENT_REGISTRATION_GRADEBOOK_CRITERIA.retake) || safeRecord.retake || 0, weights.fin);
    return Math.max(finalCombined, retakeCombined);
}

function isGradeRecordPassedByKiuRule(record, rosterId = '') {
    const safeRecord = ensureStudentRegistrationGradeRecordHistories(record || {});
    const finalScore = Number(getStudentRegistrationAssessmentDisplayValue(safeRecord, STUDENT_REGISTRATION_GRADEBOOK_CRITERIA.final) || safeRecord.final || 0);
    const retakeScore = Number(getStudentRegistrationAssessmentDisplayValue(safeRecord, STUDENT_REGISTRATION_GRADEBOOK_CRITERIA.retake) || safeRecord.retake || 0);
    const hasExamOutcome = finalScore > 0 || retakeScore > 0;
    return hasExamOutcome && getGradeRecordCombinedKiuPassScore(safeRecord, rosterId) >= 51;
}

function getStudentPassedCourseSet(studentId) {
    const passed = new Set();
    const add = (courseId) => {
        const key = canonicalCourseKey(courseId);
        if (key) passed.add(key);
    };

    (KIU_STATE.studentPassedCourses?.[studentId] || []).forEach(add);

    Object.entries(KIU_STATE.studentGrades || {}).forEach(([rosterId, roster]) => {
        const record = (roster || []).find(entry => String(entry.id) === String(studentId));
        if (!record) return;
        if (!isGradeRecordPassedByKiuRule(record, rosterId)) return;

        const subjectList = [
            ...Object.keys(KIU_STATE.facultyProfiles || {}).flatMap(fac => getActiveCurriculum(fac) || []),
            ...(KIU_STATE.curriculum || [])
        ];
        const resolved = resolveSubjectIdFromRosterId(rosterId, subjectList);
        if (resolved) add(resolved);
    });

    return passed;
}

function getStudentCompletedEctsForCourseIds(studentId, courseIds, preferredFaculty = null) {
    const passed = getStudentPassedCourseSet(studentId);
    return (courseIds || []).reduce((sum, courseRef) => {
        const courseId = typeof courseRef === 'string' ? courseRef : (courseRef?.id || courseRef?.n || courseRef?.courseId || '');
        const course = getCourseByIdForRegistration(courseId, preferredFaculty);
        if (!course) return sum;
        return passed.has(canonicalCourseKey(courseId)) ? sum + getCourseEctsValue(course) : sum;
    }, 0);
}

        const api = {
            canonicalCourseKey,
            normalizeSubjectTitleKey,
            getAllCurriculumSubjects,
            findCurriculumSubjectByIdOrTitle,
            getEquivalentCurriculumSubjectIds,
            findAvailableGroupForAssignedSubject,
            parseRequiredCourseIds,
            getCourseByIdForRegistration,
            resolveSubjectIdFromRosterId,
            getRegisteredOrPassedCourses,
            getCurrentStudentSemesterNumber,
            evaluateStudentCourseEligibility,
            parseEctsProgress,
            formatEctsProgress,
            closeStructuredFormModal,
            escapeHtml,
            jsQuote,
            toPositiveInt,
            buildStructuredFormFieldNode,
            openStructuredFormModal,
            getStudentRegistrationGradebookCriterionMeta,
            normalizeStudentRegistrationAssessmentNumber,
            sortStudentRegistrationAssessmentEntries,
            aggregateStudentRegistrationAssessmentEntries,
            ensureStudentRegistrationGradeRecordHistories,
            getStudentRegistrationAssessmentDisplayValue,
            getStudentEffectiveFinalRetakeScore,
            getGradebookWeightProfile,
            getGradeRecordCombinedKiuPassScore,
            isGradeRecordPassedByKiuRule,
            getStudentPassedCourseSet,
            getStudentCompletedEctsForCourseIds,
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateStudentRegistrationEligibilityApi({});
})();
