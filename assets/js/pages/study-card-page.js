function getStudyCardSemesterLabel(semesterNumber) {
    const safeSemester = Math.max(1, parseInt(semesterNumber, 10) || 1);
    const academicYearStart = 2024 + Math.floor((safeSemester - 1) / 2);
    const season = safeSemester % 2 === 0 ? 'Spring' : 'Fall';
    return `${academicYearStart}/${academicYearStart + 1} ${season} Semester - ${safeSemester}`;
}

function getStudyCardLetterGrade(score, hasAnyScore) {
    if (!hasAnyScore) {
        return { label: '-', toneToken: 'empty' };
    }
    if (score >= 91) return { label: 'A', toneToken: 'grade-a' };
    if (score >= 81) return { label: 'B', toneToken: 'grade-b' };
    if (score >= 71) return { label: 'C', toneToken: 'grade-c' };
    if (score >= 61) return { label: 'D', toneToken: 'grade-d' };
    if (score >= 51) return { label: 'E', toneToken: 'grade-e' };
    if (score >= 41) return { label: 'FX', toneToken: 'grade-fx' };
    return { label: 'F', toneToken: 'grade-f' };
}

function ensureStudyCardAssessmentEntryDisplayContext() {
    if (typeof window.resolveLmsQuizSourceFromAssessmentEntry !== 'function') {
        window.resolveLmsQuizSourceFromAssessmentEntry = function resolveLmsQuizSourceFromAssessmentEntry(entry = {}) {
            const resourceKey = typeof resolveCanonicalLmsResourceKey === 'function'
                ? resolveCanonicalLmsResourceKey(String(entry?.sourceResourceKey || '').trim())
                : String(entry?.sourceResourceKey || '').trim();
            const quizId = String(entry?.sourceQuizId || '').trim();
            if (!resourceKey || !quizId) return null;
            if (typeof getLmsQuizById !== 'function') return null;
            const quiz = getLmsQuizById(resourceKey, quizId);
            if (!quiz) return null;
            return { resourceKey, quizId, quiz };
        };
    }
    if (typeof window.getAssessmentEntryDisplayContext === 'function') return;
    window.getAssessmentEntryDisplayContext = function getAssessmentEntryDisplayContext(criterion, entry = {}) {
        const normalizedCriterion = typeof normalizeGradebookCriterion === 'function'
            ? normalizeGradebookCriterion(criterion)
            : String(criterion || '').trim().toLowerCase();
        const criterionMeta = typeof getGradebookCriterionMeta === 'function'
            ? getGradebookCriterionMeta(normalizedCriterion)
            : { label: normalizedCriterion || 'Assessment' };
        const entryNumber = typeof normalizeAssessmentNumber === 'function'
            ? normalizeAssessmentNumber(entry?.number, 1)
            : (parseInt(entry?.number, 10) || 1);
        const manualTitle = String(entry?.title || entry?.name || '').trim();
        const linked = typeof resolveLmsQuizSourceFromAssessmentEntry === 'function'
            ? resolveLmsQuizSourceFromAssessmentEntry(entry)
            : null;
        if (!linked?.quiz || typeof resolveActiveLmsQuizContext !== 'function' || typeof getLmsQuizDisplayLabel !== 'function') {
            return {
                title: manualTitle || `${criterionMeta.label} ${entryNumber}`,
                subtitle: '',
                criterionMeta,
                entryNumber,
                linked: null
            };
        }
        const context = resolveActiveLmsQuizContext(linked.resourceKey) || {};
        const quiz = linked.quiz;
        return {
            title: String(quiz.title || '').trim() || manualTitle || `${criterionMeta.label} ${entryNumber}`,
            subtitle: [getLmsQuizDisplayLabel(quiz), quiz.weekLabel, context.subject?.name, context.group?.name].filter(Boolean).join(' - '),
            criterionMeta,
            entryNumber,
            linked
        };
    };
}

function normalizeStudyCardIdentifier(value) {
    if (typeof normalizeIdentifier === 'function') {
        return normalizeIdentifier(value);
    }
    return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function getStudyCardCanonicalCourseKey(value) {
    if (typeof canonicalCourseKey === 'function') {
        return canonicalCourseKey(value);
    }
    return String(value || '').trim().toLowerCase();
}

function resolveStudyCardFacultyCode(value, fallback = '') {
    if (typeof normalizeFacultyCode === 'function') {
        return normalizeFacultyCode(value, fallback);
    }
    return String(value || fallback || '').trim().toUpperCase();
}

function getStudyCardCourseEctsValue(course) {
    const direct = Number(course?.ects);
    if (Number.isFinite(direct) && direct > 0) return direct;
    const parsed = parseInt(String(course?.ects || '').match(/\d+/)?.[0] || '0', 10);
    return Number.isFinite(parsed) ? parsed : 0;
}

function getStudyCardEnrolledStudentsForGroup(courseId, groupId) {
    const domain = typeof getDomain === 'function' ? getDomain() : {};
    const students = [];
    const seen = new Set();
    const normalizedCourseId = getStudyCardCanonicalCourseKey(courseId);
    const normalizedGroupId = getStudyCardCanonicalCourseKey(groupId);
    const availableGroups = typeof getAvailableGroupsForSubject === 'function'
        ? getAvailableGroupsForSubject(courseId)
        : (KIU_STATE.availableGroups?.[courseId] || []);
    const targetGroup = (availableGroups || []).find((group) => (
        getStudyCardCanonicalCourseKey(group?.id || group?.groupId || group?.name || '') === normalizedGroupId
    ));
    const targetFaculty = resolveStudyCardFacultyCode(
        targetGroup?.faculty || (typeof deriveFacultyFromSubjectId === 'function' ? deriveFacultyFromSubjectId(courseId) : '') || '',
        ''
    );

    Object.entries(KIU_STATE.studentSchedulesByStudent || {}).forEach(([studentId, schedule]) => {
        const scheduleEntries = Array.isArray(schedule)
            ? schedule
            : (schedule && typeof schedule === 'object')
                ? Object.entries(schedule).map(([scheduledCourseId, scheduledGroupId]) => ({
                    courseId: scheduledCourseId,
                    groupId: scheduledGroupId
                }))
                : [];
        const isEnrolled = scheduleEntries.some((item) => (
            getStudyCardCanonicalCourseKey(item?.courseId || item?.sourceCourseId || '') === normalizedCourseId
            && getStudyCardCanonicalCourseKey(item?.groupId || item?.groupName || '') === normalizedGroupId
            && (!targetFaculty || resolveStudyCardFacultyCode(item?.faculty || targetFaculty, targetFaculty) === targetFaculty)
        ));
        if (!isEnrolled || seen.has(studentId)) return;

        const student = domain.usersById?.[studentId] || null;
        const studentFaculty = resolveStudyCardFacultyCode(student?.facultyCode || student?.faculty || '', '');
        if (targetFaculty && studentFaculty && studentFaculty !== targetFaculty) return;

        students.push({
            id: studentId,
            name: student?.name || student?.nameEn || `Student ${studentId}`
        });
        seen.add(studentId);
    });

    return students.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
}

function resolveStudyCardRosterKey(courseId, groupId, enrolledStudents = []) {
    const keys = Object.keys(KIU_STATE.studentGrades || {});
    const domain = typeof getDomain === 'function' ? getDomain() : {};
    const subject = domain.subjectsById?.[courseId] || (KIU_STATE.curriculum || []).find((item) => item.id === courseId);
    const groupNorm = normalizeStudyCardIdentifier(groupId);
    const courseNorm = normalizeStudyCardIdentifier(courseId);
    const subjectCodeNorm = normalizeStudyCardIdentifier(subject?.code || '');
    const firstSegmentNorm = normalizeStudyCardIdentifier(String(courseId || '').split('-')[0]);
    const exactCandidates = [
        `${String(courseId || '').toLowerCase()}_${String(groupId || '').toLowerCase()}`,
        `${courseNorm}_${groupNorm}`,
        `${subjectCodeNorm}_${groupNorm}`,
        `${firstSegmentNorm}_${groupNorm}`
    ].filter(Boolean);

    for (const candidate of exactCandidates) {
        if (keys.includes(candidate)) return candidate;
    }

    const enrolledIds = new Set((enrolledStudents || []).map((student) => String(student?.id || student?.studentId || '')));
    let bestKey = null;
    let bestScore = -1;

    keys.forEach((key) => {
        let score = 0;
        if (normalizeStudyCardIdentifier(key).endsWith(groupNorm)) score += 2;
        const roster = KIU_STATE.studentGrades[key] || [];
        roster.forEach((student) => {
            if (enrolledIds.has(String(student?.id || student?.studentId || ''))) score += 4;
        });
        if (score > bestScore) {
            bestScore = score;
            bestKey = key;
        }
    });

    return bestKey || `${courseNorm || 'course'}_${groupNorm || 'group'}`;
}

function getStudyCardSubjectTokens(courseId, subject) {
    const tokens = new Set();
    [
        courseId,
        subject?.id,
        subject?.code,
        subject?.courseId,
        subject?.subjectId,
        subject?.name
    ].forEach((value) => {
        const token = normalizeStudyCardIdentifier(value);
        if (token) tokens.add(token);
    });
    return Array.from(tokens);
}

function resolveStudyCardGradeRecord(courseId, groupId, enrolledStudents, studentId, primaryRosterId, subject) {
    const rosters = KIU_STATE.studentGrades || {};
    const findStudentRecord = (roster) => Array.isArray(roster)
        ? roster.find((entry) => String(entry?.id) === String(studentId)) || null
        : null;
    const primaryRecord = findStudentRecord(rosters[primaryRosterId]);
    if (primaryRecord) {
        return { rosterId: primaryRosterId, record: primaryRecord };
    }

    const courseTokens = getStudyCardSubjectTokens(courseId, subject);
    const groupToken = normalizeStudyCardIdentifier(groupId || 'default');
    const enrolledStudentIds = new Set((enrolledStudents || []).map((student) => String(student?.id || student?.studentId || '')));
    let bestMatch = { score: 0, rosterId: primaryRosterId, record: null };

    Object.entries(rosters).forEach(([candidateRosterId, roster]) => {
        const record = findStudentRecord(roster);
        if (!record) return;

        const keyToken = normalizeStudyCardIdentifier(candidateRosterId);
        const recordCourseToken = normalizeStudyCardIdentifier(record.courseId || record.subjectId || record.idCourse || record.subject);
        const recordGroupToken = normalizeStudyCardIdentifier(record.groupId || record.group || record.sectionId);
        let score = 0;

        if (candidateRosterId === primaryRosterId) score += 12;
        if (groupToken && (keyToken.includes(groupToken) || recordGroupToken === groupToken)) score += 3;
        if (enrolledStudentIds.has(String(studentId))) score += 1;

        courseTokens.forEach((token) => {
            if (!token) return;
            if (keyToken.includes(token)) score += 5;
            if (recordCourseToken === token) score += 6;
        });

        if (typeof resolveSubjectIdFromRosterId === 'function') {
            const domain = typeof getDomain === 'function' ? getDomain() : {};
            const subjectList = Object.values(domain.subjectsById || {}).concat(KIU_STATE.curriculum || []);
            const resolvedSubjectId = normalizeStudyCardIdentifier(resolveSubjectIdFromRosterId(candidateRosterId, subjectList));
            if (resolvedSubjectId && courseTokens.includes(resolvedSubjectId)) score += 6;
        }

        if (score > bestMatch.score) {
            bestMatch = { score, rosterId: candidateRosterId, record };
        }
    });

    return bestMatch.score >= 5
        ? { rosterId: bestMatch.rosterId, record: bestMatch.record }
        : { rosterId: primaryRosterId, record: null };
}

function closeStudyCardAssessmentWindow() {
    const existing = document.getElementById('study-card-assessment-window');
    if (existing) existing.remove();
    document.body.classList.remove('study-card-assessment-open');
}

function bindStudyCardAssessmentDelegates() {
    if (window.__studyCardAssessmentDelegatesBound) return;
    window.__studyCardAssessmentDelegatesBound = true;

    document.addEventListener('click', (event) => {
        const closeTrigger = event.target.closest('[data-study-card-assessment-close]');
        if (closeTrigger) {
            event.preventDefault();
            closeStudyCardAssessmentWindow();
            return;
        }

        const assessmentTrigger = event.target.closest('[data-study-card-assessment-key]');
        if (!assessmentTrigger) return;
        event.preventDefault();
        const cacheKey = assessmentTrigger.getAttribute('data-study-card-assessment-key');
        if (cacheKey) openStudyCardAssessmentWindow(cacheKey);
    });
}

function renderStudyCardAssessmentMetricsStrip(subject = {}) {
    const summary = subject.summary || null;
    if (!summary) return '';

    const scoreLabel = escapeHtml(String(summary.outcome?.scoreLabel ?? subject.overallScore ?? 0));
    const letterLabel = escapeHtml(String(summary.outcome?.letterLabel ?? subject.letterMeta?.label ?? '-'));
    const completedCount = Number(summary.completedCount || 0);
    const pendingCount = Number(summary.pendingCount || 0);
    const toneToken = escapeHtml(subject.letterMeta?.toneToken || 'grade-f');
    const letterEmpty = letterLabel === '-' ? ' is-empty' : '';

    return `
        <div class="lux-strip-grid lux-strip-grid--adaptive study-card-overlay-metrics">
            <article class="lux-strip-card surface-card">
                <div class="lux-card-body lux-mini-panel">
                    <div class="study-card-summary-card-kicker">Overall score</div>
                    <h3>${scoreLabel}</h3>
                    <p>Visible course score based on recorded assessments.</p>
                </div>
            </article>
            <article class="lux-strip-card surface-card">
                <div class="lux-card-body lux-mini-panel study-card-overlay-metrics-letter">
                    <div class="study-card-summary-card-kicker">Letter grade</div>
                    <div class="study-card-overlay-metrics-grade">
                        <span class="grade-circle study-card-grade-circle study-card-grade-circle--${toneToken}${letterEmpty}">${letterLabel}</span>
                    </div>
                    <p>Letter outcome for this subject roster.</p>
                </div>
            </article>
            <article class="lux-strip-card surface-card">
                <div class="lux-card-body lux-mini-panel">
                    <div class="study-card-summary-card-kicker">Completed</div>
                    <h3>${completedCount}</h3>
                    <p>Graded assessment items already on your transcript.</p>
                </div>
            </article>
            <article class="lux-strip-card surface-card">
                <div class="lux-card-body lux-mini-panel">
                    <div class="study-card-summary-card-kicker">Pending review</div>
                    <h3>${pendingCount}</h3>
                    <p>Items waiting for faculty review or final recording.</p>
                </div>
            </article>
        </div>
    `;
}

function openStudyCardAssessmentWindow(cacheKey) {
    const cache = window.__studyCardAssessmentCache || {};
    const subject = cache[cacheKey];
    if (!subject) return;

    closeStudyCardAssessmentWindow();
    document.body.classList.add('study-card-assessment-open');

    const rosterId = String(subject.rosterId || '').trim();
    if (rosterId && typeof currentRosterId !== 'undefined') {
        currentRosterId = rosterId;
    }

    const overlay = document.createElement('div');
    overlay.id = 'study-card-assessment-window';
    overlay.className = 'study-card-assessment-overlay';
    overlay.onclick = (event) => {
        if (event.target === overlay) closeStudyCardAssessmentWindow();
    };

    overlay.innerHTML = `
        <div class="study-card-assessment-window">
            <div class="study-card-assessment-window__header">
                <div class="study-card-assessment-window__copy">
                    <div class="study-card-summary-kicker">Subject assessment</div>
                    <div class="study-card-summary-title study-card-assessment-window__title">${escapeHtml(subject.courseName)}</div>
                    <div class="study-card-summary-copy study-card-assessment-window__meta">${escapeHtml(subject.courseId)} · ${escapeHtml(subject.professorLabel)}</div>
                    <div class="study-card-summary-copy study-card-assessment-window__meta">Group: ${escapeHtml(subject.groupName)} · Roster: ${escapeHtml(subject.rosterId || '-')}</div>
                </div>
                <div class="study-card-assessment-window__actions">
                    <span class="grade-circle study-card-grade-circle study-card-grade-circle--${escapeHtml(subject.letterMeta?.toneToken || 'grade-f')}${subject.letterMeta?.label === '-' ? ' is-empty' : ''}">${escapeHtml(subject.letterMeta?.label || '-')}</span>
                    <span class="lux-status-pill study-card-assessment-pill"><i class="fas fa-chart-line"></i> Score ${escapeHtml(String(subject.overallScore || 0))}</span>
                    <button type="button" class="lux-secondary-btn" data-study-card-assessment-close>
                        <i class="fas fa-window-minimize"></i> Minimize
                    </button>
                </div>
            </div>
            <div class="study-card-assessment-window__body study-card-assessment-window__body--gradebook study-card-gradebook-overlay">
                ${renderStudyCardAssessmentMetricsStrip(subject)}
                ${subject.summary && typeof renderGradebookModernWeights === 'function'
                    ? renderGradebookModernWeights(subject.scheme || {}, subject.summary, { studentView: true })
                    : ''}
                ${subject.summary && typeof renderGradebookModernTranscript === 'function'
                    ? renderGradebookModernTranscript(subject.summary, { rosterId: subject.rosterId || '' })
                    : ''}
                ${subject.summary && typeof renderGradebookModernTimeline === 'function'
                    ? renderGradebookModernTimeline(subject.summary)
                    : ''}
                <div class="study-card-assessment-window__history-head">
                    <div>
                        <div class="study-card-assessment-window__history-kicker">Detailed score history</div>
                        <div class="study-card-assessment-window__history-copy">Every saved attempt and update for this subject. Use Details in the transcript above for a focused view.</div>
                    </div>
                </div>
                <div class="study-card-assessment-window__history-list">
                    ${subject.historyHtml || '<div class="study-card-history-empty">No recorded scores yet.</div>'}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    const syncGradebookOverlayVisuals = () => {
        if (typeof syncGradebookVisualCustomProperties === 'function') {
            syncGradebookVisualCustomProperties(overlay);
        }
    };
    syncGradebookOverlayVisuals();
    const scheduleFrame = window.requestAnimationFrame || ((callback) => window.setTimeout(callback, 0));
    scheduleFrame(syncGradebookOverlayVisuals);
}

function ensureStudyCardContentShell(container) {
    if (!container || container.dataset.studyCardContentShell === '1') return;
    container.dataset.studyCardContentShell = '1';
    container.innerHTML = `
        <div class="study-card-shell">
            <section id="study-card-summary-region" class="study-card-shell__summary"></section>
            <section id="study-card-terms-region" class="study-card-shell__terms"></section>
        </div>
    `;
}

function renderStudyCardSummaryRegion(context) {
    return `
        <div class="lux-hero-stage study-card-summary-stage">
            <div class="lux-hero-main">
                <div class="study-card-summary-kicker">Academic Record Snapshot</div>
                <div class="study-card-summary-title">${escapeHtml(context.latestTermLabel || 'No active term')}</div>
                <div class="study-card-summary-copy">Semester-by-semester grade signals and assessment history for the courses currently attached to your student record.</div>
                <div class="study-card-summary-chip-row">
                    <span class="lux-status-pill"><i class="fas fa-layer-group"></i> ${context.totalSemesters} semester${context.totalSemesters === 1 ? '' : 's'}</span>
                    <span class="lux-status-pill"><i class="fas fa-book"></i> ${context.totalSubjects} subject${context.totalSubjects === 1 ? '' : 's'}</span>
                    <span class="lux-status-pill"><i class="fas fa-award"></i> ${context.totalEcts} ECTS tracked</span>
                    <span class="lux-status-pill"><i class="fas fa-chart-line"></i> ${escapeHtml(context.averageScoreLabel)}</span>
                </div>
            </div>
            <aside class="lux-hero-side">
                <div class="lux-hero-side-head">
                    <strong>${context.totalSubjects}</strong>
                    <span>Subject coverage and assessment history in the same summary language used on the home dashboard.</span>
                </div>
                <div class="lux-hero-signal-list">
                    <div class="lux-hero-signal">
                        <span>Latest term</span>
                        <strong>${escapeHtml(context.latestTermLabel || 'No term')}</strong>
                        <em>Most recent semester represented in the study card.</em>
                    </div>
                    <div class="lux-hero-signal">
                        <span>Average score</span>
                        <strong>${escapeHtml(context.averageScoreLabel)}</strong>
                        <em>Average across subjects that already have scores.</em>
                    </div>
                    <div class="lux-hero-signal">
                        <span>Assessment history</span>
                        <strong>${context.assessmentEntryTotal}</strong>
                        <em>Saved entries available through the assessment detail window.</em>
                    </div>
                </div>
            </aside>
        </div>
        <div class="lux-strip-grid lux-strip-grid--adaptive">
            <article class="lux-strip-card surface-card">
                <div class="lux-card-body lux-mini-panel">
                    <div class="study-card-summary-card-kicker">Latest term</div>
                    <h3>${escapeHtml(context.latestTermLabel || 'No term')}</h3>
                    <p>Most recent semester represented in the study card.</p>
                </div>
            </article>
            <article class="lux-strip-card surface-card">
                <div class="lux-card-body lux-mini-panel">
                    <div class="study-card-summary-card-kicker">Subjects with scores</div>
                    <h3>${context.scoredSubjects}</h3>
                    <p>Courses already carrying visible assessment outcomes.</p>
                </div>
            </article>
            <article class="lux-strip-card surface-card">
                <div class="lux-card-body lux-mini-panel">
                    <div class="study-card-summary-card-kicker">Average score</div>
                    <h3>${escapeHtml(context.averageScoreLabel)}</h3>
                    <p>Average across the scored subjects currently on record.</p>
                </div>
            </article>
            <article class="lux-strip-card surface-card">
                <div class="lux-card-body lux-mini-panel">
                    <div class="study-card-summary-card-kicker">Assessment history</div>
                    <h3>${context.assessmentEntryTotal}</h3>
                    <p>Saved assessment entries available through the detail window.</p>
                </div>
            </article>
        </div>
    `;
}

function renderStudyCardTermsRegion(context) {
    const assessmentWindowCache = {};
    const html = context.sortedTerms.map((termNum, index) => {
        const rows = context.semesterBuckets[termNum]
            .sort((a, b) => String(a.courseName || '').localeCompare(String(b.courseName || ''), undefined, { sensitivity: 'base' }))
            .map((subject) => {
                const assessmentCacheKey = `study-card-${toDomToken(subject.courseId)}-${toDomToken(subject.groupName)}-${termNum}`;
                assessmentWindowCache[assessmentCacheKey] = subject;
                return `
                <tr class="study-card-term-row">
                    <td class="study-card-cell study-card-cell--subject">
                        <div>${escapeHtml(subject.courseName)}</div>
                        <div class="study-card-subject-meta study-card-cell-meta">${escapeHtml(subject.courseId)}</div>
                    </td>
                    <td class="study-card-cell study-card-cell--professor">
                        <div>${escapeHtml(subject.professorLabel)}</div>
                        <div class="study-card-prof-meta study-card-cell-meta">${escapeHtml(subject.groupName)}</div>
                    </td>
                    <td class="study-card-cell study-card-cell--ects">${subject.ects}</td>
                    <td class="study-card-cell study-card-cell--score">${subject.overallScore}</td>
                    <td class="study-card-cell study-card-cell--grade">
                        <div class="grade-circle study-card-grade-circle study-card-grade-circle--${escapeHtml(subject.letterMeta.toneToken || 'grade-f')}${subject.letterMeta.label === '-' ? ' is-empty' : ''}">${escapeHtml(subject.letterMeta.label)}</div>
                    </td>
                    <td class="study-card-cell study-card-cell--assessment">
                        <button type="button" class="lux-primary-btn study-card-assessment-btn" data-study-card-assessment-key="${escapeHtml(assessmentCacheKey)}"><i class="fas fa-up-right-and-down-left-from-center"></i> Assessment</button>
                    </td>
                </tr>
            `;
            }).join('');

        return `
            <div class="study-card-term-block${index === 0 ? ' is-first' : ''}">
                <div class="semester-header study-card-term-header">
                    <span>${escapeHtml(getStudyCardSemesterLabel(termNum))}</span>
                </div>
                <table class="kiu-table study-card-semester-table">
                    <thead>
                        <tr>
                            <th class="study-card-heading study-card-heading--left">Subject</th>
                            <th class="study-card-heading study-card-heading--left">Professor</th>
                            <th>ECTS</th>
                            <th>Score</th>
                            <th>Letter Grade</th>
                            <th class="study-card-heading study-card-heading--right">Assessment</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    }).join('');

    return {
        assessmentWindowCache,
        html
    };
}

function renderStudyCard() {
    const container = document.getElementById('study-card-container');
    if (!container) return;

    const currentUser = getCurrentUser();
    const effectiveRole = typeof getEffectiveUserRole === 'function'
        ? getEffectiveUserRole()
        : (currentUserRole || currentUser?.role || USER_ROLES.STUDENT);
    if (!currentUser || effectiveRole !== USER_ROLES.STUDENT) {
        container.innerHTML = '<div class="study-card-empty">Study Card is only available in the student portal.</div>';
        return;
    }

    const rawSchedule = getCurrentStudentSchedule();
    const seenCourseGroups = new Set();
    const currentSchedule = (rawSchedule || []).filter((item) => {
        const courseId = String(item?.courseId || item?.id || item?.subjectId || '').trim();
        const groupId = String(item?.groupId || item?.group || item?.sectionId || '').trim();
        if (!courseId) return false;
        const dedupeKey = `${normalizeStudyCardIdentifier(courseId)}::${normalizeStudyCardIdentifier(groupId || 'default')}`;
        if (seenCourseGroups.has(dedupeKey)) return false;
        seenCourseGroups.add(dedupeKey);
        return true;
    });

    if (!currentSchedule.length) {
        container.innerHTML = '<div class="study-card-empty">You have no registered subjects yet. Complete Academic Registration to populate your Study Card.</div>';
        return;
    }

    const criteria = window.GRADEBOOK_CRITERIA;
    if (!criteria) {
        container.innerHTML = '<div class="study-card-empty">Gradebook criteria are not loaded. Refresh the page.</div>';
        return;
    }

    try {
    const domain = typeof getDomain === 'function' ? getDomain() : {};
    const subjectsById = domain.subjectsById || {};
    const semesterBuckets = {};

    currentSchedule.forEach((scheduleItem) => {
        const courseId = String(scheduleItem?.courseId || scheduleItem?.id || scheduleItem?.subjectId || '').trim();
        const groupId = String(scheduleItem?.groupId || scheduleItem?.group || scheduleItem?.sectionId || '').trim();
        const availableGroups = Array.isArray(KIU_STATE.availableGroups?.[courseId]) ? KIU_STATE.availableGroups[courseId] : [];
        const groupObj = availableGroups.find((group) => (
            normalizeStudyCardIdentifier(group?.id) === normalizeStudyCardIdentifier(groupId)
        )) || null;
        const subject = subjectsById[courseId] || (KIU_STATE.curriculum || []).find((item) => String(item?.id) === courseId) || null;
        const semester = Math.max(1, parseInt(scheduleItem?.semester || groupObj?.semester || subject?.semester || currentUser?.semester || KIU_STATE.activeSemester || 1, 10) || 1);

        const enrolledStudents = getStudyCardEnrolledStudentsForGroup(courseId, groupId);
        const rosterId = resolveStudyCardRosterKey(courseId, groupId, enrolledStudents);
        const gradeMatch = resolveStudyCardGradeRecord(courseId, groupId, enrolledStudents, currentUser.id, rosterId, subject);
        const gradeRosterId = gradeMatch.rosterId || rosterId;
        const rawRecord = gradeMatch.record || null;
        const record = syncGradeRecordSummaries(ensureGradeRecordHistories(rawRecord || {
            id: currentUser.id,
            name: currentUser.name || currentUser.nameEn || 'Student'
        }));
        const scheme = typeof getGradebookSchemeForRoster === 'function'
            ? getGradebookSchemeForRoster(gradeRosterId, courseId)
            : null;
        const normalizedScheme = scheme && typeof normalizeGradebookGradingScheme === 'function'
            ? normalizeGradebookGradingScheme(scheme)
            : scheme;

        const quizScore = Number(getAssessmentDisplayValue(record, criteria.quiz) || 0);
        const oralQuizScore = Number(getAssessmentDisplayValue(record, criteria.oralQuiz) || 0);
        const homeworkScore = Number(getAssessmentDisplayValue(record, criteria.homework) || 0);
        const midtermScore = Number(getAssessmentDisplayValue(record, criteria.midterm) || 0);
        const examScore = Number(
            typeof getGradebookEffectiveExamScore === 'function'
                ? getGradebookEffectiveExamScore(record)
                : Math.max(
                    Number(getAssessmentDisplayValue(record, criteria.final) || 0),
                    Number(getAssessmentDisplayValue(record, criteria.retake) || 0)
                )
        ) || 0;
        const getScoredAssessmentCount = (criterionKey) => getAssessmentEntries(record, criterionKey)
            .filter((entry) => entry && entry.score !== null && entry.score !== undefined && entry.score !== '')
            .length;
        const examScoreCount = getScoredAssessmentCount(criteria.final.key) + getScoredAssessmentCount(criteria.retake.key);
        const visibleOutcome = typeof getGradebookVisibleOutcome === 'function'
            ? getGradebookVisibleOutcome(record, normalizedScheme || scheme)
            : { scoreLabel: String(Math.max(0, Math.min(100, Math.round((quizScore + oralQuizScore + homeworkScore + midtermScore + examScore) / 5)))) };
        const summary = typeof getGradebookModernSummary === 'function'
            ? getGradebookModernSummary(record, normalizedScheme || scheme, { rosterId: gradeRosterId })
            : null;
        const overallScore = Math.max(0, Math.min(100, parseInt(visibleOutcome.scoreLabel, 10) || 0));
        const hasAnyScore = Object.values(record.assessments || {}).some((entries) => Array.isArray(entries) && entries.length > 0)
            || [quizScore, oralQuizScore, homeworkScore, midtermScore, examScore].some((score) => Number(score) > 0);
        const letterMeta = getStudyCardLetterGrade(overallScore, hasAnyScore);
        const courseName = scheduleItem?.courseName || scheduleItem?.name || subject?.name || courseId || 'Subject';
        const professorLabel = scheduleItem?.prof || groupObj?.prof || groupObj?.teacher || groupObj?.ta || 'Professor TBA';
        const ects = getStudyCardCourseEctsValue(scheduleItem) || getStudyCardCourseEctsValue(subject) || 6;

        if (!semesterBuckets[semester]) semesterBuckets[semester] = [];
        semesterBuckets[semester].push({
            courseId,
            courseName,
            groupName: groupObj?.name || groupId || '-',
            professorLabel,
            ects,
            overallScore,
            letterMeta,
            rosterId: gradeRosterId,
            studentId: currentUser.id,
            studentName: currentUser.name || currentUser.nameEn || 'Student',
            breakdown: [
                { label: 'Quiz', shortLabel: 'Quiz', value: quizScore, count: getScoredAssessmentCount(criteria.quiz.key) },
                { label: 'Oral Quiz', shortLabel: 'Oral', value: oralQuizScore, count: getScoredAssessmentCount(criteria.oralQuiz.key) },
                { label: 'Homework', shortLabel: 'HW', value: homeworkScore, count: getScoredAssessmentCount(criteria.homework.key) },
                { label: 'Midterm', shortLabel: 'Mid', value: midtermScore, count: getScoredAssessmentCount(criteria.midterm.key) },
                { label: 'Exam / Retake', shortLabel: 'Exam', value: examScore, count: examScoreCount }
            ],
            scheme: normalizedScheme || scheme,
            summary,
            weightChips: normalizedScheme && typeof getGradebookSchemeTotalPoints === 'function'
                ? [`Course total ${getGradebookSchemeTotalPoints(normalizedScheme)} pts`]
                : [],
            historyHtml: typeof renderStudyCardHistorySections === 'function'
                ? renderStudyCardHistorySections(record, currentUser.id, currentUser.name || currentUser.nameEn || 'Student')
                : ''
        });
    });

    const sortedTerms = Object.keys(semesterBuckets)
        .map((value) => parseInt(value, 10))
        .filter((value) => Number.isFinite(value))
        .sort((a, b) => b - a);
    const flattenedSubjects = sortedTerms.flatMap((termNum) => semesterBuckets[termNum] || []);
    const scoredSubjects = flattenedSubjects.filter((subject) => Number(subject.overallScore || 0) > 0).length;
    const totalEcts = flattenedSubjects.reduce((sum, subject) => sum + Number(subject.ects || 0), 0);
    const assessmentEntryTotal = flattenedSubjects.reduce((sum, subject) => (
        sum + (subject.breakdown || []).reduce((innerSum, item) => innerSum + Number(item.count || 0), 0)
    ), 0);
    const averageScoreLabel = scoredSubjects
        ? String(Math.round(flattenedSubjects
            .filter((subject) => Number(subject.overallScore || 0) > 0)
            .reduce((sum, subject) => sum + Number(subject.overallScore || 0), 0) / scoredSubjects))
        : 'No scores yet';
    const latestTermLabel = sortedTerms.length ? getStudyCardSemesterLabel(sortedTerms[0]) : '';

    ensureStudyCardContentShell(container);
    const summaryRegion = document.getElementById('study-card-summary-region');
    const termsRegion = document.getElementById('study-card-terms-region');
    const termsRender = renderStudyCardTermsRegion({
        semesterBuckets,
        sortedTerms
    });
    window.__studyCardAssessmentCache = termsRender.assessmentWindowCache;

    const summaryHtml = renderStudyCardSummaryRegion({
        assessmentEntryTotal,
        averageScoreLabel,
        latestTermLabel,
        scoredSubjects,
        sortedTerms,
        totalEcts,
        totalSemesters: sortedTerms.length,
        totalSubjects: flattenedSubjects.length
    });
    if (summaryRegion) {
        summaryRegion.innerHTML = typeof localizeHtmlMarkup === 'function' ? localizeHtmlMarkup(summaryHtml) : summaryHtml;
    }
    if (termsRegion) {
        termsRegion.innerHTML = typeof localizeHtmlMarkup === 'function' ? localizeHtmlMarkup(termsRender.html) : termsRender.html;
    }
    } catch (error) {
        console.error('Study Card render failed.', error);
        container.innerHTML = '<div class="study-card-empty">Could not load your Study Card. Refresh the page or try again later.</div>';
    }
}

function initStudyCardStandalonePage() {
    if (typeof bindStandaloneGradebookShell === 'function') {
        bindStandaloneGradebookShell();
    }
    if (document.getElementById('study-card-container')) {
        renderStudyCard();
    }
}

bindStudyCardAssessmentDelegates();
ensureStudyCardAssessmentEntryDisplayContext();

window.closeStudyCardAssessmentWindow = closeStudyCardAssessmentWindow;
window.openStudyCardAssessmentWindow = openStudyCardAssessmentWindow;
window.renderStudyCard = renderStudyCard;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStudyCardStandalonePage, { once: true });
} else {
    initStudyCardStandalonePage();
}
