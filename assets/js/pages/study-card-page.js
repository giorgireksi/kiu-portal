function getStudyCardSemesterLabel(semesterNumber) {
    const safeSemester = Math.max(1, parseInt(semesterNumber, 10) || 1);
    const academicYearStart = 2024 + Math.floor((safeSemester - 1) / 2);
    const season = safeSemester % 2 === 0 ? 'Spring' : 'Fall';
    return `${academicYearStart}/${academicYearStart + 1} ${season} Semester - ${safeSemester}`;
}

function getStudyCardLetterGrade(score, hasAnyScore) {
    if (!hasAnyScore) {
        return { label: '-', color: '#94a3b8' };
    }
    if (score >= 91) return { label: 'A', color: 'var(--lux-accent)' };
    if (score >= 81) return { label: 'B', color: 'var(--lux-accent-2)' };
    if (score >= 71) return { label: 'C', color: 'rgba(var(--lux-home-secondary-rgb, 110, 160, 255), 0.96)' };
    if (score >= 61) return { label: 'D', color: '#d4a24d' };
    if (score >= 51) return { label: 'E', color: '#c97b4b' };
    if (score >= 41) return { label: 'FX', color: '#d46b6b' };
    return { label: 'F', color: '#d46b6b' };
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
    if (document.body.dataset.studyCardAssessmentOverflow !== undefined) {
        document.body.style.overflow = document.body.dataset.studyCardAssessmentOverflow;
        delete document.body.dataset.studyCardAssessmentOverflow;
    }
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

function openStudyCardAssessmentWindow(cacheKey) {
    const cache = window.__studyCardAssessmentCache || {};
    const subject = cache[cacheKey];
    if (!subject) return;

    closeStudyCardAssessmentWindow();

    document.body.dataset.studyCardAssessmentOverflow = document.body.style.overflow || '';
    document.body.style.overflow = 'hidden';

    const overlay = document.createElement('div');
    overlay.id = 'study-card-assessment-window';
    overlay.style.cssText = 'position:fixed; inset:0; z-index:7200; background:rgba(15,23,42,0.72); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; padding:24px;';
    overlay.onclick = (event) => {
        if (event.target === overlay) closeStudyCardAssessmentWindow();
    };

    overlay.innerHTML = `
        <div class="study-card-assessment-window">
            <div class="study-card-assessment-window__header">
                <div style="min-width:0;">
                    <div class="study-card-assessment-window__title">${escapeHtml(subject.courseName)}</div>
                    <div class="study-card-assessment-window__meta">${escapeHtml(subject.courseId)} · ${escapeHtml(subject.professorLabel)}</div>
                    <div class="study-card-assessment-window__meta">Group: ${escapeHtml(subject.groupName)} · Roster: ${escapeHtml(subject.rosterId || '-')}</div>
                </div>
                <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end;">
                    <span class="lms-route-pill"><i class="fas fa-chart-line"></i> Score ${escapeHtml(String(subject.overallScore || 0))}</span>
                    <span class="lms-route-pill"><i class="fas fa-award"></i> ${escapeHtml(subject.letterMeta?.label || '-')}</span>
                    <button type="button" class="lux-secondary-btn" data-study-card-assessment-close>
                        <i class="fas fa-window-minimize"></i> Minimize
                    </button>
                </div>
            </div>
            <div class="study-card-assessment-window__body">
                <div style="display:grid; gap:12px; margin-bottom:16px;">
                    <div style="display:flex; gap:10px; flex-wrap:wrap;">
                        ${(subject.weightChips || []).map((chip) => `
                            <span class="lms-route-pill" style="background:rgba(var(--lux-accent-rgb),0.08); border-color:rgba(var(--lux-accent-rgb),0.14); color:var(--lux-text);">
                                ${escapeHtml(chip)}
                            </span>
                        `).join('')}
                    </div>
                    <div class="lms-route-card-grid" style="grid-template-columns:repeat(auto-fit, minmax(160px, 1fr));">
                        ${(subject.breakdown || []).map((item) => `
                            <div class="lms-route-card" style="padding:16px;">
                                <div class="lms-route-eyebrow">${escapeHtml(item.label)}</div>
                                <div class="lms-route-title" style="font-size:26px; margin-top:8px;">${escapeHtml(String(item.value ?? 0))}</div>
                                <div class="lms-route-copy" style="margin-top:8px;">${escapeHtml(String(item.count || 0))} saved entr${item.count === 1 ? 'y' : 'ies'}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div style="display:flex; justify-content:space-between; gap:12px; align-items:center; margin-bottom:14px; flex-wrap:wrap;">
                    <div>
                        <div style="font-size:12px; font-weight:800; text-transform:uppercase; color:rgba(var(--lux-accent-rgb),0.82);">Raw Assessment History</div>
                        <div style="font-size:13px; color:var(--lux-text-muted); margin-top:4px;">Each saved attempt, score, and update is shown here without aggregate summary cards.</div>
                    </div>
                </div>
                <div style="display:grid; gap:12px;">
                    ${subject.historyHtml}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
}

function ensureStudyCardContentShell(container) {
    if (!container || container.dataset.studyCardContentShell === '1') return;
    container.dataset.studyCardContentShell = '1';
    container.innerHTML = `
        <div class="study-card-shell" style="display:grid; gap:24px;">
            <section id="study-card-summary-region" style="display:grid; gap:16px;"></section>
            <section id="study-card-terms-region" style="display:grid; gap:24px;"></section>
        </div>
    `;
}

function renderStudyCardSummaryRegion(context) {
    return `
        <div style="display:flex; justify-content:space-between; gap:18px; flex-wrap:wrap; align-items:flex-start;">
            <div>
                <div style="font-size:12px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:var(--lux-text-muted);">Academic Record Snapshot</div>
                <div style="font-size:28px; font-weight:900; color:var(--lux-text); margin-top:8px;">${escapeHtml(context.latestTermLabel || 'No active term')}</div>
                <div style="font-size:13px; color:var(--lux-text-muted); margin-top:8px; max-width:640px;">Semester-by-semester grade signals and assessment history for the courses currently attached to your student record.</div>
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <span class="lux-status-pill"><i class="fas fa-layer-group"></i> ${context.totalSemesters} semester${context.totalSemesters === 1 ? '' : 's'}</span>
                <span class="lux-status-pill"><i class="fas fa-book"></i> ${context.totalSubjects} subject${context.totalSubjects === 1 ? '' : 's'}</span>
                <span class="lux-status-pill"><i class="fas fa-award"></i> ${context.totalEcts} ECTS tracked</span>
                <span class="lux-status-pill"><i class="fas fa-chart-line"></i> ${escapeHtml(context.averageScoreLabel)}</span>
            </div>
        </div>
        <div class="lms-route-card-grid" style="grid-template-columns:repeat(auto-fit,minmax(190px,1fr));">
            <div class="lms-route-card" style="padding:18px;">
                <div class="lms-route-eyebrow">Latest term</div>
                <div class="lms-route-title" style="font-size:20px; margin-top:8px;">${escapeHtml(context.latestTermLabel || 'No term')}</div>
                <div class="lms-route-copy" style="margin-top:8px;">Most recent semester represented in the study card.</div>
            </div>
            <div class="lms-route-card" style="padding:18px;">
                <div class="lms-route-eyebrow">Subjects with scores</div>
                <div class="lms-route-title" style="font-size:20px; margin-top:8px;">${context.scoredSubjects}</div>
                <div class="lms-route-copy" style="margin-top:8px;">Courses already carrying visible assessment outcomes.</div>
            </div>
            <div class="lms-route-card" style="padding:18px;">
                <div class="lms-route-eyebrow">Average score</div>
                <div class="lms-route-title" style="font-size:20px; margin-top:8px;">${escapeHtml(context.averageScoreLabel)}</div>
                <div class="lms-route-copy" style="margin-top:8px;">Average across the scored subjects currently on record.</div>
            </div>
            <div class="lms-route-card" style="padding:18px;">
                <div class="lms-route-eyebrow">Assessment history</div>
                <div class="lms-route-title" style="font-size:20px; margin-top:8px;">${context.assessmentEntryTotal}</div>
                <div class="lms-route-copy" style="margin-top:8px;">Saved assessment entries available through the detail window.</div>
            </div>
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
                <tr>
                    <td style="width:28%; font-weight:700;">
                        <div>${escapeHtml(subject.courseName)}</div>
                        <div class="study-card-subject-meta" style="font-size:11px; margin-top:6px;">${escapeHtml(subject.courseId)}</div>
                    </td>
                    <td style="width:18%;">
                        <div>${escapeHtml(subject.professorLabel)}</div>
                        <div class="study-card-prof-meta" style="font-size:11px; margin-top:6px;">${escapeHtml(subject.groupName)}</div>
                    </td>
                    <td style="width:10%; text-align:center; font-weight:800;">${subject.ects}</td>
                    <td style="width:10%; text-align:center; font-weight:900; color:var(--lux-text);">${subject.overallScore}</td>
                    <td style="width:10%; text-align:center;">
                        <div class="grade-circle study-card-grade-circle" style="border-color:${subject.letterMeta.color}; box-shadow:inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px ${subject.letterMeta.color}33; background:linear-gradient(180deg, ${subject.letterMeta.color}26, rgba(10,15,24,0.96)); ${subject.letterMeta.label === '-' ? 'color:transparent;' : ''}">${escapeHtml(subject.letterMeta.label)}</div>
                    </td>
                    <td style="width:24%; text-align:right;">
                        <button type="button" class="lux-primary-btn study-card-assessment-btn" data-study-card-assessment-key="${escapeHtml(assessmentCacheKey)}"><i class="fas fa-up-right-and-down-left-from-center"></i> Assessment</button>
                    </td>
                </tr>
            `;
            }).join('');

        return `
            <div style="margin-top:${index === 0 ? '0' : '30px'};">
                <div class="semester-header">
                    <span>${escapeHtml(getStudyCardSemesterLabel(termNum))}</span>
                </div>
                <table class="kiu-table study-card-semester-table">
                    <thead>
                        <tr>
                            <th style="text-align:left;">Subject</th>
                            <th style="text-align:left;">Professor</th>
                            <th>ECTS</th>
                            <th>Score</th>
                            <th>Letter Grade</th>
                            <th style="text-align:right;">Assessment</th>
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
        container.innerHTML = '<div style="padding:40px; text-align:center; color:var(--kiu-text-muted);">Study Card is only available in the student portal.</div>';
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
        container.innerHTML = '<div style="padding:40px; text-align:center; color:var(--kiu-text-muted);">You have no registered subjects yet. Complete Academic Registration to populate your Study Card.</div>';
        return;
    }

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
        const weightProfile = typeof getGradebookWeightProfileForRoster === 'function'
            ? getGradebookWeightProfileForRoster(gradeRosterId)
            : { q1: 0.10, qa: 0.10, mid: 0.30, fin: 0.50 };

        const quizScore = Number(getAssessmentDisplayValue(record, GRADEBOOK_CRITERIA.quiz) || 0);
        const oralQuizScore = Number(getAssessmentDisplayValue(record, GRADEBOOK_CRITERIA.oralQuiz) || 0);
        const homeworkScore = Number(getAssessmentDisplayValue(record, GRADEBOOK_CRITERIA.homework) || 0);
        const midtermScore = Number(getAssessmentDisplayValue(record, GRADEBOOK_CRITERIA.midterm) || 0);
        const examScore = Number(
            typeof getGradebookEffectiveExamScore === 'function'
                ? getGradebookEffectiveExamScore(record)
                : Math.max(
                    Number(getAssessmentDisplayValue(record, GRADEBOOK_CRITERIA.final) || 0),
                    Number(getAssessmentDisplayValue(record, GRADEBOOK_CRITERIA.retake) || 0)
                )
        ) || 0;
        const getScoredAssessmentCount = (criterionKey) => getAssessmentEntries(record, criterionKey)
            .filter((entry) => entry && entry.score !== null && entry.score !== undefined && entry.score !== '')
            .length;
        const examScoreCount = getScoredAssessmentCount(GRADEBOOK_CRITERIA.final.key) + getScoredAssessmentCount(GRADEBOOK_CRITERIA.retake.key);
        const visibleOutcome = typeof getGradebookVisibleOutcome === 'function'
            ? getGradebookVisibleOutcome(record, weightProfile)
            : { scoreLabel: String(Math.max(0, Math.min(100, Math.round((quizScore + oralQuizScore + homeworkScore + midtermScore + examScore) / 5)))) };
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
                { label: 'Quiz', shortLabel: 'Quiz', value: quizScore, count: getScoredAssessmentCount(GRADEBOOK_CRITERIA.quiz.key) },
                { label: 'Oral Quiz', shortLabel: 'Oral', value: oralQuizScore, count: getScoredAssessmentCount(GRADEBOOK_CRITERIA.oralQuiz.key) },
                { label: 'Homework', shortLabel: 'HW', value: homeworkScore, count: getScoredAssessmentCount(GRADEBOOK_CRITERIA.homework.key) },
                { label: 'Midterm', shortLabel: 'Mid', value: midtermScore, count: getScoredAssessmentCount(GRADEBOOK_CRITERIA.midterm.key) },
                { label: 'Exam / Retake', shortLabel: 'Exam', value: examScore, count: examScoreCount }
            ],
            weightChips: [
                `Quiz ${Math.round(Number(weightProfile.q1 || 0) * 100)}%`,
                `Homework ${Math.round(Number(weightProfile.qa || 0) * 100)}%`,
                `Midterm ${Math.round(Number(weightProfile.mid || 0) * 100)}%`,
                `Final / Retake ${Math.round(Number(weightProfile.fin || 0) * 100)}%`
            ],
            historyHtml: renderStudyCardHistorySections(record, currentUser.id, currentUser.name || currentUser.nameEn || 'Student')
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
}

function initStudyCardStandalonePage() {
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
