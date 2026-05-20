/* Planner, timetable, and calendar logic extracted from core.js. Source of truth remains root core.js compatibility bundle. */

// --- ADMIN TERM-PLANNER ENGINE ---
function initAdminTermPlanner() {
    refreshSemesterDropdowns();
    const allSubjects = typeof getAllCurriculumSubjects === 'function' ? getAllCurriculumSubjects() : (KIU_STATE.curriculum || []);

    // Populate active semester select
    const semSelect = document.getElementById('admin-active-semester');
    if (semSelect) {
        const activeSemester = parseInt(KIU_STATE.activeSemester || 3, 10);
        if (activeSemester > MAX_SEMESTER_DROPDOWN) semSelect.dataset.customSemesterValue = String(activeSemester);
        populateSemesterSelectOptions(semSelect, { includeCustom: true, numberPrefix: 'Semester' });
        semSelect.value = String(activeSemester);
    }
    
    // Set registration toggle
    const regToggle = document.getElementById('admin-reg-status');
    const regIcon = document.getElementById('admin-reg-icon');
    const regText = document.getElementById('admin-reg-text');
    if (regToggle) {
        regToggle.checked = KIU_STATE.registrationOpen !== false;
        if (regToggle.checked) {
            if(regIcon) { regIcon.className = 'fas fa-toggle-on'; regIcon.style.color = 'var(--kiu-green)'; }
            if(regText) regText.innerText = 'Registration Window Open';
        } else {
            if(regIcon) { regIcon.className = 'fas fa-toggle-off'; regIcon.style.color = 'var(--kiu-red)'; }
            if(regText) regText.innerText = 'Registration Window Closed';
        }
    }
    
    // Populate Master Subject dropdown for Section Generator
    const subSelect = document.getElementById('admin-generate-subject');
    if (subSelect) {
        let html = '';
        allSubjects.forEach(sub => {
            html += `<option value="${sub.id}">${sub.id} - ${sub.name}</option>`;
        });
        subSelect.innerHTML = localizeHtmlMarkup(html);
    }
}

function changeActiveSemester(val) {
    const semSelect = document.getElementById('admin-active-semester');
    const resolvedSemester = val === CUSTOM_SEMESTER_OPTION
        ? getSemesterNumberFromControl(semSelect, KIU_STATE.activeSemester || 3)
        : (parseInt(val, 10) || getSemesterNumberFromControl(semSelect, KIU_STATE.activeSemester || 3));
    KIU_STATE.activeSemester = resolvedSemester;
    saveState();
    refreshShellIdentity();
    const curriculumSemFilter = document.getElementById('filter-curriculum-semester');
    if (curriculumSemFilter) {
        if (resolvedSemester > MAX_SEMESTER_DROPDOWN) {
            curriculumSemFilter.dataset.customSemesterValue = String(resolvedSemester);
        }
        populateSemesterSelectOptions(curriculumSemFilter, { includeAll: true, includeCustom: true, numberPrefix: 'Sem' });
        curriculumSemFilter.value = String(resolvedSemester);
        renderCurriculumTable();
    }
    alert(`System globally updated to Semester ${resolvedSemester}. Students will now see this term's courses.`);
}

function toggleRegistrationStatus() {
    const regToggle = document.getElementById('admin-reg-status');
    KIU_STATE.registrationOpen = regToggle.checked;
    saveState();
    refreshShellIdentity();
    
    const regIcon = document.getElementById('admin-reg-icon');
    const regText = document.getElementById('admin-reg-text');
    if (KIU_STATE.registrationOpen) {
        if(regIcon) { regIcon.className = 'fas fa-toggle-on'; regIcon.style.color = 'var(--kiu-green)'; }
        if(regText) regText.innerText = 'Registration Window Open';
    } else {
        if(regIcon) { regIcon.className = 'fas fa-toggle-off'; regIcon.style.color = 'var(--kiu-red)'; }
        if(regText) regText.innerText = 'Registration Window Closed';
        alert('Registration globally closed. Students cannot modify schedules.');
    }
}

function updateGenerateSubjects(context = 'admin') {
    const prefix = context === 'modal' ? 'modal-' : 'admin-';
    const facultyInput = document.getElementById(`${prefix}generate-faculty`);
    const subSelect = document.getElementById(`${prefix}generate-subject`);
    const allSubjects = typeof getAllCurriculumSubjects === 'function' ? getAllCurriculumSubjects() : (KIU_STATE.curriculum || []);
    
    if (subSelect) {
        const faculty = facultyInput ? facultyInput.value : 'all';
        let html = '';
        allSubjects.forEach(sub => {
            const matchesFac = (faculty === 'Computer Science' && sub.id.startsWith('CS')) ||
                              (faculty === 'Business Management' && sub.id.startsWith('BM')) ||
                              (faculty === 'Law' && sub.id.startsWith('LAW')) || 
                              (faculty === 'Mathematics' && sub.id.startsWith('MATH')) ||
                              (faculty === 'all' || !faculty);
            
            if (matchesFac) {
                html += `<option value="${sub.id}">${sub.id} - ${sub.name}</option>`;
            }
        });
        subSelect.innerHTML = localizeHtmlMarkup(html || '<option value="">No subjects found</option>');
    }
}
// [REMOVED Phase 36: Old inline generator logic]



// Timetable, schedule-surface, and profile-calendar runtime moved to assets/js/pages/timetable-runtime.js.

// --- STUDY CARD ENGINE ---
function renderStudyCard() {
    const container = document.getElementById('study-card-container');
    if (!container) return; // Not on the study-card page
    
    const effectiveRole = typeof getEffectiveUserRole === 'function'
        ? getEffectiveUserRole()
        : (currentUserRole || USER_ROLES.STUDENT);
    if (effectiveRole !== USER_ROLES.STUDENT) {
        container.innerHTML = '<div style="padding:40px; text-align:center; color:var(--kiu-text-muted);">Study Card is only available in the student portal.</div>';
        return;
    }
    
    const currentSchedule = getCurrentStudentSchedule();
    if (!currentSchedule || currentSchedule.length === 0) {
        container.innerHTML = '<div style="padding:40px; text-align:center; color:var(--kiu-text-muted);">You have no registered subjects. Please complete Academic Registration.</div>';
        return;
    }

    // 1. Group Schedule by Semester
    const semesterBuckets = {}; // { 3: [subject1, subject2], 2: [subject3] }
    
    currentSchedule.forEach(s => {
        // Resolve Semester
        let targetSem = 3; // Default Fallback for mocks
        const groupObj = KIU_STATE.availableGroups && KIU_STATE.availableGroups[s.courseId] && KIU_STATE.availableGroups[s.courseId].find(x => x.id === s.groupId);
        if (groupObj && groupObj.semester) {
            targetSem = parseInt(groupObj.semester);
        } else if (KIU_STATE.activeSemester) {
            targetSem = parseInt(KIU_STATE.activeSemester);
        }
        
        if (!semesterBuckets[targetSem]) semesterBuckets[targetSem] = [];
        // Map Grades
        const rosterId = resolveGradebookRosterKey(s.courseId, s.groupId, getEnrolledStudentsForGroup(s.courseId, s.groupId));
        const studentGradesList = KIU_STATE.studentGrades && KIU_STATE.studentGrades[rosterId] ? KIU_STATE.studentGrades[rosterId] : [];
        const myUserId = getCurrentUserId() || '60111';
        
        // Find My Grade Object 
        const myGradeObjRaw = studentGradesList.find(st => st.id === myUserId) || null;
        const myGradeObj = myGradeObjRaw ? ensureGradeRecordHistories(myGradeObjRaw) : null; // Handle robust legacy array formats
        
        let subGrade = 0, finGrade = 0, hwGrade = 0, qGrade = 0;
        if (myGradeObj && typeof myGradeObj === 'object') {
            subGrade = myGradeObj.mid || 0;
            finGrade = myGradeObj.final || 0;
            hwGrade = myGradeObj.qa || 0;
            qGrade = myGradeObj.q1 || 0;
        }
        const total = subGrade + finGrade + hwGrade + qGrade;
        
        // Map Letter Grade
        let letter = 'F', color = 'var(--kiu-red)';
        if (total >= 91) { letter = 'A'; color = 'var(--lux-accent)'; }
        else if (total >= 81) { letter = 'B'; color = 'var(--lux-accent-2)'; }
        else if (total >= 71) { letter = 'C'; color = 'rgba(var(--lux-home-secondary-rgb, 110, 160, 255), 0.96)'; }
        else if (total >= 61) { letter = 'D'; color = '#d4a24d'; }
        else if (total >= 51) { letter = 'E'; color = '#c97b4b'; }
        else if (total === 0 && !myGradeObj) { letter = '-'; color = 'var(--lux-text-muted)'; } // Not graded yet

        semesterBuckets[targetSem].push({
            courseName: s.courseName || s.name,
            prof: s.prof || groupObj?.prof || '-',
            ects: s.ects || 6,
            totalPoint: total,
            letterGrade: letter,
            gradeColor: color,
            details: {
                mid: subGrade,
                fin: finGrade,
                hw: hwGrade,
                qz: qGrade,
                historyHtml: myGradeObj ? renderStudyCardHistorySections(myGradeObj) : '<div style="font-size:12px; color: var(--lux-text-muted);">No assessment history yet.</div>'
            }
        });
    });

    // 2. Generate Semantic Blocks based on Terms
    let html = '';
    const sortedTerms = Object.keys(semesterBuckets).sort((a,b) => b - a); // Descending Semester
    
    sortedTerms.forEach(termNum => {
        const semTitle = getStudyCardSemesterLabel(termNum);
        
        html += `<div class="semester-header" style="margin-top: ${html === '' ? '0' : '30px'};"><span>${semTitle}</span><span style="display:flex; gap: 60px;"><span>Instructor</span><span>ECTS</span><span>Points</span><span>Grade</span><span>Details</span></span></div>`;
        html += `<table class="kiu-table"><tbody>`;
        
        semesterBuckets[termNum].forEach(subj => {
            html += `<tr>
                <td style="width: 30%;">${subj.courseName}</td>
                <td style="width: 20%;">${subj.prof} <i class="fas fa-info-circle" style="color:var(--kiu-text-muted); margin-left:5px;"></i></td>
                <td style="width: 10%; text-align:center;">${subj.ects}</td>
                <td style="width: 10%; text-align:center;">${subj.totalPoint}</td>
                <td style="width: 10%; text-align:center;">
                    <div class="grade-circle study-card-grade-circle" style="border-color:${subj.gradeColor}; background:linear-gradient(180deg, ${subj.gradeColor}26, rgba(10,15,24,0.96)); ${subj.letterGrade === '-' ? 'color:transparent;' : ''}">${subj.letterGrade}</div>
                </td>
                <td style="width: 20%; text-align:right;">
                    <div class="grade-popover-container">
                        <button type="button" class="lux-secondary-btn" data-planner-grade-details="1"><i class="fas fa-chevron-down"></i> Grade Details</button>
                        <div class="grade-popover">
                            <table>
                                <tr><th>Midterm</th><th>Final</th><th>Homework</th><th>Quiz</th></tr>
                                <tr><td>${subj.details.mid}</td><td>${subj.details.fin}</td><td>${subj.details.hw}</td><td>${subj.details.qz}</td></tr>
                            </table>
                            <div style="display:grid; gap:10px; margin-top:12px;">
                                ${subj.details.historyHtml}
                            </div>
                        </div>
                    </div>
                </td>
            </tr>`;
        });
        
        html += `</tbody></table>`;
    });
    
    container.innerHTML = localizeHtmlMarkup(html);
}

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

function normalizeStudyCardIdentifier(value) {
    if (typeof normalizeIdentifier === 'function') {
        return normalizeIdentifier(value);
    }
    return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
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
    ].forEach(value => {
        const token = normalizeStudyCardIdentifier(value);
        if (token) tokens.add(token);
    });
    return Array.from(tokens);
}

function resolveStudyCardGradeRecord(courseId, groupId, enrolledStudents, studentId, primaryRosterId, subject) {
    const rosters = KIU_STATE.studentGrades || {};
    const findStudentRecord = (roster) => Array.isArray(roster)
        ? roster.find(entry => String(entry?.id) === String(studentId)) || null
        : null;
    const primaryRecord = findStudentRecord(rosters[primaryRosterId]);
    if (primaryRecord) {
        return { rosterId: primaryRosterId, record: primaryRecord };
    }

    const courseTokens = getStudyCardSubjectTokens(courseId, subject);
    const groupToken = normalizeStudyCardIdentifier(groupId || 'default');
    const enrolledStudentIds = new Set((enrolledStudents || []).map(student => String(student?.id || student?.studentId || '')));
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

        courseTokens.forEach(token => {
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

bindStudyCardAssessmentDelegates();

function ensurePlannerLegacyInteractiveStyles() {
    if (document.getElementById('planner-legacy-interactive-styles')) return;
    const style = document.createElement('style');
    style.id = 'planner-legacy-interactive-styles';
    style.textContent = `
        .grid-slot-interactive:hover {
            background: rgba(0, 0, 0, 0.02);
        }
        .calendar-event-card {
            transition: 0.15s ease;
        }
        .calendar-event-card:hover {
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
            transform: translateY(-1px);
        }
    `;
    document.head.appendChild(style);
}

function bindPlannerLegacyDelegates() {
    if (window.__plannerLegacyDelegatesBound) return;
    window.__plannerLegacyDelegatesBound = true;
    ensurePlannerLegacyInteractiveStyles();
    document.addEventListener('click', (event) => {
        const gradeDetailsTrigger = event.target.closest('[data-planner-grade-details]');
        if (gradeDetailsTrigger) {
            event.preventDefault();
            toggleGradeDetails(gradeDetailsTrigger);
            return;
        }

        const schedulerStatsTrigger = event.target.closest('[data-scheduler-stats]');
        if (schedulerStatsTrigger) {
            event.preventDefault();
            event.stopPropagation();
            showSlotStats(
                String(schedulerStatsTrigger.getAttribute('data-scheduler-course') || ''),
                String(schedulerStatsTrigger.getAttribute('data-scheduler-group') || '')
            );
            return;
        }

        const schedulerDeleteTrigger = event.target.closest('[data-scheduler-delete]');
        if (schedulerDeleteTrigger) {
            event.preventDefault();
            event.stopPropagation();
            deleteSection(
                String(schedulerDeleteTrigger.getAttribute('data-scheduler-course') || ''),
                String(schedulerDeleteTrigger.getAttribute('data-scheduler-group') || '')
            );
            return;
        }

        const schedulerEditTrigger = event.target.closest('[data-scheduler-edit]');
        if (schedulerEditTrigger) {
            event.preventDefault();
            openSchedulerEditModal(
                String(schedulerEditTrigger.getAttribute('data-scheduler-course') || ''),
                String(schedulerEditTrigger.getAttribute('data-scheduler-group') || '')
            );
            return;
        }

        const schedulerOpenTrigger = event.target.closest('[data-scheduler-open]');
        if (schedulerOpenTrigger) {
            event.preventDefault();
            openSchedulerModal(
                String(schedulerOpenTrigger.getAttribute('data-scheduler-day') || ''),
                String(schedulerOpenTrigger.getAttribute('data-scheduler-time') || '')
            );
            return;
        }

        const bcNavTrigger = event.target.closest('[data-bc-nav]');
        if (bcNavTrigger) {
            event.preventDefault();
            bcNav(parseInt(bcNavTrigger.getAttribute('data-bc-nav') || '0', 10) || 0);
            return;
        }

        const bcYearTrigger = event.target.closest('[data-bc-year]');
        if (bcYearTrigger) {
            event.preventDefault();
            bcJumpYear(parseInt(bcYearTrigger.getAttribute('data-bc-year') || '0', 10) || 0);
            return;
        }

        const bcDateTrigger = event.target.closest('[data-bc-date]');
        if (bcDateTrigger) {
            event.preventDefault();
            bcDayClick(String(bcDateTrigger.getAttribute('data-bc-date') || ''));
            return;
        }

        const bcAddTrigger = event.target.closest('[data-bc-add]');
        if (bcAddTrigger) {
            event.preventDefault();
            bcAddEvent();
        }
    });
}

bindPlannerLegacyDelegates();

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
                            ${(subject.weightChips || []).map(chip => `
                                <span class="lms-route-pill" style="background:rgba(var(--lux-accent-rgb),0.08); border-color:rgba(var(--lux-accent-rgb),0.14); color:var(--lux-text);">
                                    ${escapeHtml(chip)}
                                </span>
                            `).join('')}
                        </div>
                        <div class="lms-route-card-grid" style="grid-template-columns:repeat(auto-fit, minmax(160px, 1fr));">
                            ${(subject.breakdown || []).map(item => `
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
    const currentSchedule = (rawSchedule || []).filter(item => {
        const courseId = String(item?.courseId || item?.id || item?.subjectId || '').trim();
        const groupId = String(item?.groupId || item?.group || item?.sectionId || '').trim();
        if (!courseId) return false;
        const dedupeKey = `${normalizeIdentifier(courseId)}::${normalizeIdentifier(groupId || 'default')}`;
        if (seenCourseGroups.has(dedupeKey)) return false;
        seenCourseGroups.add(dedupeKey);
        return true;
    });

    if (!currentSchedule.length) {
        container.innerHTML = '<div style="padding:40px; text-align:center; color:var(--kiu-text-muted);">You have no registered subjects yet. Complete Academic Registration to populate your Study Card.</div>';
        return;
    }

    const domain = getDomain?.() || {};
    const subjectsById = domain.subjectsById || {};
    const semesterBuckets = {};

    currentSchedule.forEach(scheduleItem => {
        const courseId = String(scheduleItem?.courseId || scheduleItem?.id || scheduleItem?.subjectId || '').trim();
        const groupId = String(scheduleItem?.groupId || scheduleItem?.group || scheduleItem?.sectionId || '').trim();
        const availableGroups = Array.isArray(KIU_STATE.availableGroups?.[courseId]) ? KIU_STATE.availableGroups[courseId] : [];
        const groupObj = availableGroups.find(group => normalizeIdentifier(group?.id) === normalizeIdentifier(groupId)) || null;
        const subject = subjectsById[courseId] || (KIU_STATE.curriculum || []).find(item => String(item?.id) === courseId) || null;
        const semester = Math.max(1, parseInt(scheduleItem?.semester || groupObj?.semester || subject?.semester || currentUser?.semester || KIU_STATE.activeSemester || 1, 10) || 1);

        const enrolledStudents = getEnrolledStudentsForGroup(courseId, groupId);
        const rosterId = resolveGradebookRosterKey(courseId, groupId, enrolledStudents);
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
        const examScore = Number((typeof getGradebookEffectiveExamScore === 'function'
            ? getGradebookEffectiveExamScore(record)
            : getStudentEffectiveFinalRetakeScore(record)) || 0);
        const getScoredAssessmentCount = (criterionKey) => getAssessmentEntries(record, criterionKey)
            .filter(entry => entry && entry.score !== null && entry.score !== undefined && entry.score !== '')
            .length;
        const examScoreCount = getScoredAssessmentCount(GRADEBOOK_CRITERIA.final.key) + getScoredAssessmentCount(GRADEBOOK_CRITERIA.retake.key);
        const visibleOutcome = typeof getGradebookVisibleOutcome === 'function'
            ? getGradebookVisibleOutcome(record, weightProfile)
            : {
                scoreLabel: String(Math.max(0, Math.min(100, Math.round(Number(getGradeRecordCombinedKiuPassScore(record, gradeRosterId) || 0)))))
            };
        const overallScore = Math.max(0, Math.min(100, parseInt(visibleOutcome.scoreLabel, 10) || 0));
        const hasAnyScore = Object.values(record.assessments || {}).some(entries => Array.isArray(entries) && entries.length > 0)
            || [quizScore, oralQuizScore, homeworkScore, midtermScore, examScore].some(score => Number(score) > 0);
        const letterMeta = getStudyCardLetterGrade(overallScore, hasAnyScore);
        const courseName = scheduleItem?.courseName || scheduleItem?.name || subject?.name || courseId || 'Subject';
        const professorLabel = scheduleItem?.prof || groupObj?.prof || groupObj?.teacher || groupObj?.ta || 'Professor TBA';
        const ects = getCourseEctsValue(scheduleItem) || getCourseEctsValue(subject) || 6;

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
        .map(value => parseInt(value, 10))
        .filter(value => Number.isFinite(value))
        .sort((a, b) => b - a);

    const assessmentWindowCache = {};
    const html = sortedTerms.map((termNum, index) => {
        const rows = semesterBuckets[termNum]
            .sort((a, b) => String(a.courseName || '').localeCompare(String(b.courseName || ''), undefined, { sensitivity: 'base' }))
            .map(subject => {
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

    window.__studyCardAssessmentCache = assessmentWindowCache;
    container.innerHTML = localizeHtmlMarkup(html);
}

// --- ADMIN MASTER GRID ENGINE ---
let lastGridState = '';

const debouncedPaletteSearch = debounce(() => {
    renderAdminCurriculumPalette();
}, 250);

let adminToolsPlannerDelegatesBound = false;

function bindAdminToolsPlannerDelegates() {
    if (adminToolsPlannerDelegatesBound) return;
    adminToolsPlannerDelegatesBound = true;

    document.addEventListener('click', (event) => {
        const paletteItem = event.target.closest('[data-admin-planner-palette-subject]');
        if (paletteItem) {
            event.preventDefault();
            selectPaletteSubject(
                paletteItem.dataset.adminPlannerPaletteSubject || '',
                paletteItem.dataset.adminPlannerPaletteName || ''
            );
            return;
        }

        const refreshTrigger = event.target.closest('[data-admin-planner-refresh-system-ops]');
        if (refreshTrigger) {
            event.preventDefault();
            refreshAdminSystemOpsDashboard(true);
        }
    });
}

function renderAdminCurriculumPalette() {
    bindAdminToolsPlannerDelegates();
    const palette = document.getElementById('admin-curriculum-palette');
    const searchInput = document.getElementById('palette-search');
    const targetFacEl = document.getElementById('admin-tt-faculty');
    const allSubjects = typeof getAllCurriculumSubjects === 'function' ? getAllCurriculumSubjects() : (KIU_STATE.curriculum || []);
    if (!palette || !targetFacEl) return;
    
    const targetFac = targetFacEl.value;
    
    const query = searchInput ? searchInput.value.toLowerCase() : '';
    let html = '';
    
    // Group subjects by Faculty
    const categories = {
        'Computer Science': [],
        'Business Management': [],
        'Law': [],
        'Medicine': [],
        'Arts & Humanities': []
    };
    
    const activeFaculties = targetFac === 'all'
        ? Object.keys(categories)
        : [targetFac];
    
    allSubjects.forEach(sub => {
        const matchesSearch = sub.id.toLowerCase().includes(query) || sub.name.toLowerCase().includes(query);
        
        let derivedFaculty = 'Law';
        if (sub.faculty === 'CS' || sub.id.startsWith('CS') || sub.id.startsWith('STAT') || sub.id.startsWith('CALC')) derivedFaculty = 'Computer Science';
        else if (sub.faculty === 'ECON' || sub.id.startsWith('ECON') || sub.id.startsWith('PM')) derivedFaculty = 'Business Management';
        else if (sub.faculty === 'MED') derivedFaculty = 'Medicine';
        else if (sub.faculty === 'ARTS') derivedFaculty = 'Arts & Humanities';

        if (matchesSearch && activeFaculties.includes(derivedFaculty)) {
            categories[derivedFaculty].push(sub);
        }
    });
    
    activeFaculties.forEach(fac => {
        if (categories[fac].length > 0) {
            const facColor = fac === 'Computer Science' ? '#0f6cbd' : (fac === 'Business Management' ? '#a4262c' : '#107c41');
            html += `<div style="font-size: 11px; font-weight: 800; color: ${facColor}; text-transform: uppercase; margin-bottom: 8px; margin-top: 10px; padding-bottom: 4px; border-bottom: 1px solid #edebe9; display: flex; align-items: center; justify-content: space-between;">
                ${fac}
                <span style="background: ${facColor}20; padding: 2px 6px; border-radius: 10px; font-size: 10px; color: ${facColor};">${categories[fac].length}</span>
            </div>`;
            
            categories[fac].forEach(sub => {
            html += `
                    <div class="palette-item" data-admin-planner-palette-subject="${escapeHtml(sub.id)}" data-admin-planner-palette-name="${escapeHtml(sub.name)}" style="background:white; border:1px solid #edebe9; border-left: 3px solid ${facColor}; padding:10px 12px; border-radius:6px; font-size:12px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; transition:0.2s; box-shadow:0 1px 3px rgba(0,0,0,0.02); margin-bottom:5px;">
                        <div style="display:flex; flex-direction:column;">
                            <span style="font-weight:700; color:#201f1e;">${sub.id}</span>
                            <span style="font-size:10px; color:#605e5c; line-height: 1.3; margin-top: 2px;">${sub.name}</span>
                        </div>
                        <i class="fas fa-plus-circle" style="color: ${facColor}; opacity:0.8;"></i>
                    </div>
                `;
            });
        }
    });
    
    if (html === '') {
        html = '<div style="font-size: 12px; color: #605e5c; text-align: center; margin-top: 20px;">No subjects found.</div>';
    }
    
    palette.innerHTML = localizeHtmlMarkup(html);
}

function selectPaletteSubject(id, name) {
    document.querySelectorAll('.palette-item').forEach(el => {
        el.style.borderColor = 'var(--kiu-border)';
        el.style.background = 'white';
    });
    // Multi-highlight support for visual feedback
    const items = document.querySelectorAll('.palette-item');
    for (let item of items) {
        if (item.innerText.includes(id)) {
            item.style.borderColor = 'var(--kiu-blue)';
            item.style.background = '#f1f8ff';
        }
    }
    const subSelect = document.getElementById('admin-generate-subject');
    if (subSelect) subSelect.value = id;
}

function generateClassGroup() {
    if (!hasPermission('*')) {
        alert('Only administrators can create official teaching sessions.');
        return;
    }
    const courseId = document.getElementById('modal-generate-subject')?.value?.trim() ||
                     _modalField('admin-generate-subject')?.value?.trim();
    const groupId  = (_modalField('admin-generate-group')?.value  || '').trim();
    const day      = _modalField('admin-generate-day')?.value     || '';
    const time     = normalizeTimeString(_modalField('admin-generate-time')?.value, '');
    let   endTime  = normalizeTimeString(_modalField('admin-generate-endtime')?.value, '');
    const capacity = _modalField('admin-generate-capacity')?.value || '40';
    const room     = (_modalField('admin-generate-room')?.value   || '').trim();
    const prof     = (_modalField('admin-generate-prof')?.value   || '').trim();
    const ta       = (_modalField('admin-generate-ta')?.value     || '').trim();
    const editCourseId = (_modalField('admin-generate-edit-course')?.value || '').trim();
    const editGroupId = (_modalField('admin-generate-edit-group')?.value || '').trim().toLowerCase();
    const isEdit = Boolean(editCourseId && editGroupId);

    // Resolve faculty: from palette filter or from the subject's own faculty tag
    const paletteFac = document.getElementById('admin-tt-faculty')?.value || 'all';
    let faculty = paletteFac !== 'all' ? paletteFac : 'Law';

    // Try to get from the subject's registered faculty in curriculum
    if (courseId) {
        const allSubjects = typeof getAllCurriculumSubjects === 'function' ? getAllCurriculumSubjects() : (KIU_STATE.curriculum || []);
        const subj = allSubjects.find(s => s.id === courseId);
        if (subj?.faculty) {
            const facDisplayMap = { CS: 'Computer Science', ECON: 'Business Management', LAW: 'Law', MED: 'Medicine', ARTS: 'Arts' };
            faculty = facDisplayMap[subj.faculty] || subj.faculty;
        }
    }

    const durEl = _modalField('admin-generate-duration');
    const durMins = parseInt(durEl?.value || 110);

    const targetSemester = getSemesterNumberFromControl(
        _modalField('admin-generate-semester') || document.getElementById('admin-tt-semester'),
        3
    );

    if (!courseId || courseId.includes('No subjects')) {
        alert('Please select a valid subject. Add subjects for this faculty+semester in the Curriculum CMS first.');
        return;
    }
    if (isEdit && !groupId) {
        alert('Group ID is required while editing a session.');
        return;
    }
    if (!day || !time) {
        alert('Day and time are required.');
        return;
    }

    const finalGroupId = groupId || `G-${Math.floor(Math.random()*900)+100}`;
    const finalProf    = prof  || 'TBD';
    const finalRoom    = room  || 'TBD';
    const excludeConflictId = isEdit ? `${editCourseId}::${editGroupId}` : null;

    // Recalculate endTime if blank
    if (!endTime && time) endTime = minutesToTimeString(convertTimeToMinutes(time) + durMins);

    if (finalProf !== 'TBD') {
        const overlap = checkProfessorOverlap(finalProf, day, time, endTime, excludeConflictId);
        if (overlap) { alert(`CONFLICT: ${finalProf} is already assigned to ${overlap.courseId} (${overlap.id}).`); return; }
    }
    if (finalRoom !== 'TBD') {
        const overlap = checkRoomOverlap(finalRoom, day, time, endTime, excludeConflictId);
        if (overlap) { alert(`CONFLICT: Room ${finalRoom} is booked for ${overlap.courseId} (${overlap.id}).`); return; }
    }

    const newGroup = {
        id: finalGroupId.toLowerCase(),
        name: finalGroupId,
        faculty: faculty,
        semester: targetSemester,
        day: day,
        time: time,
        endTime: endTime,
        prof: finalProf,
        ta: ta,
        room: finalRoom,
        duration: `${durMins}min`,
        capacity: parseInt(capacity) || 40,
        registered: 0
    };

    if (!KIU_STATE.availableGroups[courseId]) KIU_STATE.availableGroups[courseId] = [];

    if (isEdit) {
        const sourceGroups = KIU_STATE.availableGroups[editCourseId] || [];
        const sourceIndex = sourceGroups.findIndex(g => String(g.id).toLowerCase() === editGroupId);
        const existingGroup = sourceIndex >= 0 ? sourceGroups[sourceIndex] : null;
        const preservedRegistered = existingGroup?.registered || 0;

        newGroup.registered = preservedRegistered;

        if (existingGroup && editCourseId === courseId && editGroupId === newGroup.id) {
            sourceGroups[sourceIndex] = {
                ...existingGroup,
                ...newGroup
            };
        } else {
            if (sourceIndex >= 0) sourceGroups.splice(sourceIndex, 1);
            KIU_STATE.availableGroups[courseId].push(newGroup);
        }
    } else {
        KIU_STATE.availableGroups[courseId].push(newGroup);
    }

    saveState();
    closeSchedulerModal();
    renderAdminMasterGrid();
    alert(`Session ${isEdit ? 'updated' : 'created'}: ${courseId} - Group ${finalGroupId} | ${day} ${time}-${endTime} | ${faculty} Sem ${targetSemester}`);
}

function renderAdminMasterGrid() {
    const container = document.getElementById('admin-master-grid-container');
    if (!container) return;
    
    const targetFacEl = document.getElementById('admin-tt-faculty');
    const targetSemEl = document.getElementById('admin-tt-semester');
    const targetGroupEl = document.getElementById('admin-tt-group');
    const targetProfEl = document.getElementById('admin-tt-prof');
    
    if (!targetFacEl || !targetSemEl) return;
    
    const targetFac = targetFacEl.value;
    const targetSem = parseInt(targetSemEl.value);
    const targetGroup = targetGroupEl ? targetGroupEl.value : 'all';
    const targetProf = targetProfEl ? targetProfEl.value : 'all';
    
    // Performance cache REMOVED. Bruteforce render HTML unconditionally.
    
    let items = [];
    for (const cId in KIU_STATE.availableGroups) {
        KIU_STATE.availableGroups[cId].forEach(g => {
            // Hotfix: mock data lacks explicit semester and faculty mapped locally inside groups.
            // Derive faculty dynamically based on ID prefixes if missing.
            let derivedFaculty = g.faculty;
            if (!derivedFaculty) {
                if (cId.startsWith('CS') || cId.startsWith('STAT') || cId.startsWith('CALC')) derivedFaculty = 'Computer Science';
                else if (cId.startsWith('ECON') || cId.startsWith('PM')) derivedFaculty = 'Business Management';
                else derivedFaculty = 'Law';
            }
            
            const groupSem = parseInt(g.semester || 3); // Default to sem 3
            
            if (groupSem === targetSem && (targetFac === 'all' || derivedFaculty === targetFac)) {
                if (targetGroup !== 'all' && g.id !== targetGroup) return;
                if (targetProf !== 'all' && g.prof !== targetProf) return;
                
                items.push({ courseId: cId, ...g, faculty: derivedFaculty });
            }
        });
    }
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
    const activeFaculties = targetFac === 'all' ? ['Computer Science', 'Business Management', 'Law'] : [targetFac];
    
    let html = `<div style="display: flex; flex-direction: column; min-height: 800px; height: 100%; border: 1px solid #e1dfdd; border-radius: 8px; overflow: hidden; background: white; font-family: 'Segoe UI', system-ui, sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <!-- Calendar Header -->
        <div style="display: flex; background: #ffffff; border-bottom: 2px solid #edebe9; position: sticky; top: 0; z-index: 20;">
            <div style="width: 70px; border-right: 1px solid #edebe9; flex-shrink: 0; padding: 12px; text-align: center; color: #605e5c; font-size: 11px; font-weight: 700; text-transform: uppercase; background: #faf9f8; display: flex; align-items: center; justify-content: center;">
                GMT+4
            </div>
            <div style="display: flex; flex: 1;">`;
            
    days.forEach((d, idx) => {
        // Today styling mockup
        const todayStyling = idx === 0 ? `color: #0f6cbd; border-bottom: 4px solid #0f6cbd; padding-bottom: 8px;` : `color: #323130; padding-bottom: 12px;`;
        
        let subHeaders = '';
        if (activeFaculties.length > 1) {
            subHeaders = `<div style="display: flex; width: 100%; margin-top: 8px; font-size: 10px; font-weight: 600; color: #a19f9d; text-transform: uppercase;">`;
            activeFaculties.forEach((fac, fIdx) => {
                const bRight = fIdx < activeFaculties.length - 1 ? 'border-right: 1px dashed #edebe9;' : '';
                const facAcronym = fac === 'Computer Science' ? 'CS' : (fac === 'Business Management' ? 'BUS' : 'LAW');
                subHeaders += `<div style="flex: 1; text-align: center; ${bRight}">${facAcronym}</div>`;
            });
            subHeaders += `</div>`;
        }
        
        html += `<div style="flex: 1; display: flex; flex-direction: column; align-items: center; border-right: 1px solid #edebe9; padding-top: 12px; background: ${idx === 0 ? '#f3f2f1' : '#ffffff'};">
            <div style="font-size: 14px; font-weight: 700; ${todayStyling}">${d}</div>
            ${subHeaders}
        </div>`;
    });
    
    html += `</div></div>
        
        <!-- Calendar Body (Scrollable) -->
        <div style="display: flex; flex: 1; overflow-y: auto; position: relative; height: 1320px;">
            <!-- Time Sidebar -->
            <div style="width: 70px; border-right: 1px solid #edebe9; background: #faf9f8; flex-shrink: 0; display: flex; flex-direction: column;">`;
            
    timeSlots.forEach(t => {
        html += `<div style="height: 120px; border-bottom: 1px solid #edebe9; position: relative; box-sizing: border-box;">
            <span style="position: absolute; right: 6px; top: -8px; font-size: 12px; font-weight: 600; color: #605e5c; background: #faf9f8; padding: 0 4px; border-radius: 4px;">${t}</span>
        </div>`;
    });
    
    html += `</div>`;
    
    days.forEach((d, idx) => {
        const bgDay = idx === 0 ? 'background: #ffffff;' : 'background: #ffffff;';
        html += `<div style="flex: 1; border-right: 1px solid #edebe9; position: relative; z-index: 2; display: flex; ${bgDay}" class="scheduler-col">`;
        
        activeFaculties.forEach((fac, fIdx) => {
            const laneBorder = fIdx < activeFaculties.length - 1 ? 'border-right: 1px dashed #edebe9;' : '';
            html += `<div style="flex: 1; position: relative; ${laneBorder}">`;
            
            // 1. Draw Invisible Clickable Slots Background
            timeSlots.forEach(t => {
                html += `<div data-scheduler-open="1" data-scheduler-day="${escapeHtml(d)}" data-scheduler-time="${escapeHtml(t)}" class="grid-slot-interactive" style="height: 120px; width: 100%; border-bottom: 1px solid #e1dfdd; box-sizing: border-box; cursor: crosshair;"></div>`;
            });
            
            // 2. Draw Absolute Positioned Events
            const colItems = items.filter(i => i.day === d && i.faculty === fac);
            
            colItems.forEach(si => {
                const startMins = convertTimeToMinutes(si.time) - (9 * 60); 
                const topPx = (startMins / 60) * 120;
                
                const durMatch = si.duration ? si.duration.match(/\d+/) : null;
                const durMins = durMatch ? parseInt(durMatch[0]) : 110;
                const heightPx = (durMins / 60) * 120;
                
                const isCS = si.faculty === 'Computer Science';
                const isBiz = si.faculty === 'Business Management';
                
                const color = isCS ? '#0f6cbd' : (isBiz ? '#a4262c' : '#107c41');
                const bgColor = isCS ? '#e5f0fa' : (isBiz ? '#fdf3f4' : '#eaf6ed');
                const hoverShadow = 'box-shadow: 0 4px 8px rgba(0,0,0,0.15);';
                
                // Unassigned Badges Check
                const unassignedWarning = (si.prof === 'TBD' || si.room === 'TBD') 
                    ? `<div style="position:absolute; top:-6px; right:-6px; background:#a4262c; color:white; font-size:8px; padding:2px 4px; border-radius:10px; font-weight:bold; box-shadow:0 1px 3px rgba(0,0,0,0.2); z-index:20;">DRAFT</div>` 
                    : '';
                
                html += `
                <div class="calendar-event-card" data-scheduler-edit="1" data-scheduler-course="${escapeHtml(si.courseId)}" data-scheduler-group="${escapeHtml(si.id)}" style="position: absolute; top: ${topPx}px; left: 4px; right: 4px; height: ${heightPx - 8}px; background: ${bgColor}; border-left: 4px solid ${color}; padding: 6px 8px; border-radius: 4px; border: 1px solid ${color}; box-sizing: border-box; cursor: pointer; overflow: hidden; z-index: 10;">
                    ${unassignedWarning}
                    <div style="font-weight: 700; color: #201f1e; font-size: 11px; margin-bottom: 2px; line-height: 1.2;">
                        ${si.courseId} <span style="font-weight: normal; color: #605e5c;">(${si.id})</span>
                    </div>
                    <div style="font-size: 10px; color: ${si.prof === 'TBD' ? '#a4262c' : '#484644'}; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; margin-bottom: 2px; font-weight: ${si.prof === 'TBD' ? 'bold' : 'normal'};">
                        <i class="fas fa-user-circle" style="opacity: 0.7;"></i> ${si.prof === 'TBD' ? 'No Professor' : si.prof}
                    </div>
                    <div style="font-size: 10px; color: ${si.room === 'TBD' ? '#a4262c' : '#484644'}; font-weight: 600;">
                        <i class="fas fa-map-marker-alt" style="opacity: 0.7;"></i> ${si.room === 'TBD' ? 'No Room' : si.room}
                    </div>
                    <i class="fas fa-circle-info trash-hover" data-scheduler-stats="1" data-scheduler-course="${escapeHtml(si.courseId)}" data-scheduler-group="${escapeHtml(si.id)}" style="position: absolute; bottom: 6px; right: 26px; color: #201f1e; opacity: 0; cursor: pointer; font-size: 12px; transition: 0.2s;"></i>
                    <i class="fas fa-trash trash-hover" data-scheduler-delete="1" data-scheduler-course="${escapeHtml(si.courseId)}" data-scheduler-group="${escapeHtml(si.id)}" style="position: absolute; bottom: 6px; right: 6px; color: #a4262c; opacity: 0; cursor: pointer; font-size: 12px; transition: 0.2s;"></i>
                </div>`;
            });
            
            html += `</div>`; // End Faculty Lane
        });
        
        html += `</div>`; // End Day Column
    });
    
    html += `</div></div></div>`;
    container.innerHTML = localizeHtmlMarkup(html);
}

// Helper: get the MODAL version of a field (last element with that ID, since modal is appended last in DOM)
function _modalField(id) {
    const all = document.querySelectorAll('#' + id);
    return all.length > 0 ? all[all.length - 1] : null;
}

function setLegacySchedulerModalMode(mode = 'create') {
    const isEdit = mode === 'edit';
    const editCourseEl = _modalField('admin-generate-edit-course');
    const editGroupEl = _modalField('admin-generate-edit-group');
    if (!isEdit) {
        if (editCourseEl) editCourseEl.value = '';
        if (editGroupEl) editGroupEl.value = '';
    }

    const submitBtn = _modalField('admin-generate-submit-btn') || document.getElementById('admin-generate-submit-btn');
    if (submitBtn) {
        submitBtn.innerHTML = isEdit
            ? '<i class="fas fa-pen-to-square"></i> Save Session Changes'
            : '<i class="fas fa-plus-circle"></i> Create Session';
    }
}

function openSchedulerModal(day, time) {
    const faculty = document.getElementById('admin-tt-faculty')?.value || 'all';
    refreshSemesterDropdowns();
    const semester = getSemesterNumberFromControl('admin-tt-semester', 3);
    setLegacySchedulerModalMode('create');

    // Populate subject dropdown FILTERED by faculty+semester only
    const subSelect = document.getElementById('modal-generate-subject');
    if (subSelect) {
        const allSubjects = typeof getAllCurriculumSubjects === 'function' ? getAllCurriculumSubjects() : (KIU_STATE.curriculum || []);
        const filtered = allSubjects.filter(s => {
            const sFac = s.faculty || '';
            const facMatch = faculty === 'all' ||
                sFac === faculty ||
                (faculty === 'Computer Science' && (sFac === 'CS' || s.id.startsWith('CALC') || s.id.startsWith('STAT') || s.id.startsWith('CS'))) ||
                (faculty === 'Business Management' && (sFac === 'ECON' || s.id.startsWith('ECON') || s.id.startsWith('PM'))) ||
                (faculty === 'Law' && (sFac === 'LAW' || s.id.startsWith('LAW')));
            const semMatch = !s.semester || parseInt(s.semester) === semester;
            return facMatch && semMatch;
        });

        subSelect.innerHTML = filtered.length > 0
            ? filtered.map(s => `<option value="${s.id}">${s.id} - ${s.name}</option>`).join('')
            : '<option value="">No subjects for this faculty/semester. Add subjects first.</option>';

        const paletteHighlight = document.getElementById('admin-generate-subject');
        if (paletteHighlight?.value) subSelect.value = paletteHighlight.value;
    }

    // Pre-fill fields
    const dayEl = _modalField('admin-generate-day');
    if (dayEl) dayEl.value = day;

    const timeEl = _modalField('admin-generate-time');
    if (timeEl) timeEl.value = normalizeTimeString(time, '09:00');

    const semEl = _modalField('admin-generate-semester');
    if (semEl) semEl.value = semester;

    const facEl = _modalField('admin-generate-faculty');
    if (facEl) { facEl.value = faculty; facEl.dataset.rawFac = faculty; }

    // Auto end time
    const durEl = _modalField('admin-generate-duration');
    const endEl = _modalField('admin-generate-endtime');
    if (timeEl?.value && durEl && endEl) endEl.value = minutesToTimeString(convertTimeToMinutes(timeEl.value) + parseInt(durEl.value || 110, 10));

    // Show the overlay
    const overlay = document.getElementById('modal-overlay');
    const schedulerModal = document.getElementById('schedulerModal');
    if (!overlay || !schedulerModal) { console.error('schedulerModal or overlay not found'); return; }

    // Hide all other modal-content panels, show only schedulerModal's panel
    document.querySelectorAll('#modal-overlay .modal-content').forEach(el => el.style.display = 'none');
    const mc = schedulerModal.querySelector('.modal-content');
    if (mc) mc.style.display = 'block';
    overlay.classList.add('active');
}

function openSchedulerEditModal(courseId, groupId) {
    const groups = KIU_STATE.availableGroups?.[courseId] || [];
    const target = groups.find(g => String(g.id).toLowerCase() === String(groupId).toLowerCase());
    if (!target) {
        alert('Session not found for editing. Please refresh and try again.');
        return;
    }

    openSchedulerModal(target.day || 'Day TBD', normalizeTimeString(target.time, '09:00'));
    setLegacySchedulerModalMode('edit');

    const subjectEl = document.getElementById('modal-generate-subject');
    if (subjectEl) {
        if (!subjectEl.querySelector(`option[value="${courseId}"]`)) {
            subjectEl.insertAdjacentHTML('beforeend', `<option value="${courseId}">${courseId} - ${target.name || courseId}</option>`);
        }
        subjectEl.value = courseId;
    }

    const durationMin = parseInt(String(target.duration || '110').match(/\d+/)?.[0] || '110', 10);
    const endValue = normalizeTimeString(target.endTime || '', '') || minutesToTimeString(convertTimeToMinutes(target.time) + durationMin);

    const groupEl = _modalField('admin-generate-group');
    if (groupEl) groupEl.value = target.name || target.id || groupId;
    const dayEl = _modalField('admin-generate-day');
    if (dayEl && target.day) dayEl.value = target.day;
    const timeEl = _modalField('admin-generate-time');
    if (timeEl) timeEl.value = normalizeTimeString(target.time || '', '09:00');
    const roomEl = _modalField('admin-generate-room');
    if (roomEl) roomEl.value = (target.room && target.room !== 'TBD') ? target.room : '';
    const profEl = _modalField('admin-generate-prof');
    if (profEl) profEl.value = (target.prof && target.prof !== 'TBD') ? target.prof : '';
    const taEl = _modalField('admin-generate-ta');
    if (taEl) taEl.value = target.ta || '';
    const capEl = _modalField('admin-generate-capacity');
    if (capEl) capEl.value = String(target.capacity || 40);
    const endEl = _modalField('admin-generate-endtime');
    if (endEl) endEl.value = endValue;

    const durationEl = _modalField('admin-generate-duration');
    if (durationEl) {
        if ([...durationEl.options].some(opt => opt.value === String(durationMin))) {
            durationEl.value = String(durationMin);
        } else {
            durationEl.insertAdjacentHTML('beforeend', `<option value="${durationMin}">${durationMin} Min (Custom)</option>`);
            durationEl.value = String(durationMin);
        }
    }

    const semEl = _modalField('admin-generate-semester');
    if (semEl && target.semester) semEl.value = target.semester;

    const editCourseEl = _modalField('admin-generate-edit-course');
    if (editCourseEl) editCourseEl.value = courseId;
    const editGroupEl = _modalField('admin-generate-edit-group');
    if (editGroupEl) editGroupEl.value = String(groupId).toLowerCase();
}

function closeSchedulerModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.remove('active');

    const schedulerModal = document.getElementById('schedulerModal');
    if (schedulerModal) {
        const mc = schedulerModal.querySelector('.modal-content');
        if (mc) mc.style.display = 'none';
    }

    // Clear modal-specific inputs
    ['admin-generate-group', 'admin-generate-prof', 'admin-generate-room', 'admin-generate-ta'].forEach(id => {
        const el = _modalField(id);
        if (el) el.value = '';
    });
    setLegacySchedulerModalMode('create');
}


function minutesToTimeString(totalMinutes) {
    const mins = Number.isFinite(totalMinutes) ? Math.round(totalMinutes) : 0;
    const bounded = ((mins % 1440) + 1440) % 1440;
    const hours = Math.floor(bounded / 60);
    const minutes = bounded % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function parseTimeString(timeStr) {
    const raw = String(timeStr || '').trim().replace(/\u00A0/g, ' ');
    if (!raw) return NaN;

    const twelveHour = raw.match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*([AaPp][Mm])$/);
    if (twelveHour) {
        let hours = parseInt(twelveHour[1], 10);
        const minutes = parseInt(twelveHour[2] || '0', 10);
        const period = twelveHour[3].toUpperCase();
        if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return NaN;
        if (period === 'AM') hours = hours === 12 ? 0 : hours;
        if (period === 'PM') hours = hours === 12 ? 12 : hours + 12;
        return hours * 60 + minutes;
    }

    const twentyFourHour = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (twentyFourHour) {
        const hours = parseInt(twentyFourHour[1], 10);
        const minutes = parseInt(twentyFourHour[2], 10);
        if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return NaN;
        return hours * 60 + minutes;
    }

    return NaN;
}

function normalizeTimeString(timeStr, fallback = '') {
    const parsed = parseTimeString(timeStr);
    if (!Number.isFinite(parsed)) return fallback;
    return minutesToTimeString(parsed);
}

function convertTimeToMinutes(timeStr) {
    const parsed = parseTimeString(timeStr);
    return Number.isFinite(parsed) ? parsed : 0;
}

function checkProfessorOverlap(prof, day, start, end, excludeId, weekStart = getCurrentWeekStartISO()) {
    if (!prof || prof === '-') return null;
    const sMin = convertTimeToMinutes(start);
    const eMin = convertTimeToMinutes(end);
    const sessions = getAvailableScheduleItemsForWeek(weekStart);
    for (const session of sessions) {
        if (session.prof !== prof || session.day !== day) continue;
        if (excludeId && `${session.courseId}::${session.id}` === excludeId) continue;
        const gsMin = convertTimeToMinutes(session.time);
        const geMin = convertTimeToMinutes(session.endTime || session.time);
        if (sMin < geMin && eMin > gsMin) return session;
    }
    return null;
}

function checkRoomOverlap(room, day, start, end, excludeId, weekStart = getCurrentWeekStartISO()) {
    if (!room || room === '-') return null;
    const sMin = convertTimeToMinutes(start);
    const eMin = convertTimeToMinutes(end);
    const sessions = getAvailableScheduleItemsForWeek(weekStart);
    for (const session of sessions) {
        if (session.room !== room || session.day !== day) continue;
        if (excludeId && `${session.courseId}::${session.id}` === excludeId) continue;
        const gsMin = convertTimeToMinutes(session.time);
        const geMin = convertTimeToMinutes(session.endTime || session.time);
        if (sMin < geMin && eMin > gsMin) return session;
    }
    return null;
}

function autoSetEndTime(context = 'admin') {
    const prefix = context === 'modal' ? 'modal-' : 'admin-';
    const resolveField = (id) => {
        if (typeof _modalField === 'function') {
            const modalField = _modalField(id);
            if (modalField) return modalField;
        }
        return document.getElementById(id);
    };
    const timeInput = resolveField(`${prefix}generate-time`);
    const endInput = resolveField(`${prefix}generate-endtime`);
    const durationInput = resolveField(`${prefix}generate-duration`);
    
    if (!timeInput || !timeInput.value || !endInput) return;
    
    const customDur = durationInput ? parseInt(durationInput.value, 10) : 110;
    const startMins = parseTimeString(timeInput.value);
    if (!Number.isFinite(startMins) || !Number.isFinite(customDur)) return;
    endInput.value = minutesToTimeString(startMins + customDur);
}

const adminSystemOpsRuntime = {
    loading: false,
    loaded: false,
    status: null,
    systems: [],
    syncRuns: [],
    conflicts: [],
    auditEvents: [],
    lastLoadedAt: '',
    lastError: ''
};

function adminOpsEscape(value) {
    if (typeof escapeHtml === 'function') return escapeHtml(String(value ?? ''));
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function adminOpsFormatDateTime(value) {
    if (!value) return 'Not recorded';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return adminOpsEscape(value);
    return date.toLocaleString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function adminOpsFormatStatusLabel(value, fallback = 'Unknown') {
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized) return fallback;
    return normalized
        .split(/[_\s-]+/)
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function getAdminOpsTone(value) {
    const normalized = String(value || '').trim().toLowerCase();
    const accentTone = getFacultyThemeTone(getCurrentFaculty(), {
        useCurrentPalette: true,
        softAlpha: 0.12,
        tintAlpha: 0.18,
        borderAlpha: 0.24
    });
    if (['ready', 'completed', 'resolved', 'active', 'open'].includes(normalized)) {
        return { bg: '#dcfce7', text: '#166534' };
    }
    if (['configured', 'queued', 'in_progress', 'in-progress', 'pending', 'waiting'].includes(normalized)) {
        return { bg: accentTone.softBg, text: accentTone.accent };
    }
    if (['failed', 'error', 'disabled', 'blocked'].includes(normalized)) {
        return { bg: '#fee2e2', text: '#b91c1c' };
    }
    return { bg: '#f1f5f9', text: '#475569' };
}

function ensureAdminSystemOpsRoot() {
    const dashboard = document.querySelector('#page-admin-tools .dashboard-admin')
        || document.querySelector('#page-home .only-admin.dashboard-admin');
    if (!dashboard) return null;
    let root = document.getElementById('admin-system-ops-root');
    if (!root) {
        root = document.createElement('div');
        root.id = 'admin-system-ops-root';
        root.className = 'content-box admin-card';
        root.style.marginTop = '24px';
        root.style.marginBottom = '24px';
        const firstCard = dashboard.querySelector('.content-box.admin-card');
        if (firstCard) dashboard.insertBefore(root, firstCard);
        else dashboard.appendChild(root);
    }
    return root;
}

function focusAdminSystemOps() {
    const root = ensureAdminSystemOpsRoot();
    if (!root) return;
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (!adminSystemOpsRuntime.loaded && !adminSystemOpsRuntime.loading) {
        refreshAdminSystemOpsDashboard();
    }
}

function renderAdminSystemOpsDashboard() {
    bindAdminToolsPlannerDelegates();
    const root = ensureAdminSystemOpsRoot();
    if (!root) return;

    const runtime = adminSystemOpsRuntime;
    const systems = Array.isArray(runtime.systems) && runtime.systems.length
        ? runtime.systems
        : (Array.isArray(runtime.status?.systems) ? runtime.status.systems : []);
    const syncRuns = Array.isArray(runtime.syncRuns) ? runtime.syncRuns : [];
    const conflicts = Array.isArray(runtime.conflicts) ? runtime.conflicts : [];
    const auditEvents = Array.isArray(runtime.auditEvents) ? runtime.auditEvents : [];
    const readySystems = systems.filter(system => String(system.status || '').trim().toLowerCase() === 'ready').length;
    const authoritativeSystems = systems.filter(system => system.isAuthoritative !== false).length;
    const openConflicts = conflicts.filter(conflict => String(conflict.resolutionStatus || '').trim().toLowerCase() !== 'resolved').length;
    const latestSync = syncRuns[0] || null;
    const accentTone = getFacultyThemeTone(getCurrentFaculty(), {
        useCurrentPalette: true,
        softAlpha: 0.12,
        tintAlpha: 0.18,
        borderAlpha: 0.24
    });

    root.innerHTML = `
        <div class="admin-card-title">
            <div class="admin-card-title-icon">
                <i class="fas fa-server" style="font-size:14px;"></i>
            </div>
            <div style="flex:1;">
                <div class="admin-card-title-text">University Systems and Sync</div>
                <div class="admin-card-subtitle">Live backend readiness, connected systems, sync history, open conflicts, and audit activity.</div>
            </div>
            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                <span style="font-size:11px; color:var(--kiu-text-muted);">${runtime.lastLoadedAt ? `Last refresh: ${adminOpsEscape(adminOpsFormatDateTime(runtime.lastLoadedAt))}` : 'Waiting for first refresh'}</span>
                <button type="button" class="kiu-btn-outline" data-admin-planner-refresh-system-ops="1" ${runtime.loading ? 'disabled' : ''}>
                    <i class="fas fa-rotate-right"></i> ${runtime.loading ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(170px, 1fr)); gap:14px; margin-top:18px;">
            <div class="content-box surface-card" style="padding:16px;">
                <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:var(--kiu-text-muted);">Environment</div>
                <div style="font-size:24px; font-weight:900; color:var(--kiu-navy); margin-top:8px;">${adminOpsEscape(adminOpsFormatStatusLabel(runtime.status?.environment, 'Unknown'))}</div>
            </div>
            <div class="content-box surface-card" style="padding:16px;">
                <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:var(--kiu-text-muted);">Connected systems</div>
                <div style="font-size:24px; font-weight:900; color:${accentTone.accent}; margin-top:8px;">${systems.length}</div>
                <div style="font-size:11px; color:var(--kiu-text-muted); margin-top:6px;">${readySystems} ready</div>
            </div>
            <div class="content-box surface-card" style="padding:16px;">
                <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:var(--kiu-text-muted);">Authoritative sources</div>
                <div style="font-size:24px; font-weight:900; color:#0f766e; margin-top:8px;">${authoritativeSystems}</div>
                <div style="font-size:11px; color:var(--kiu-text-muted); margin-top:6px;">Systems marked as source of truth</div>
            </div>
            <div class="content-box surface-card" style="padding:16px;">
                <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:var(--kiu-text-muted);">Open conflicts</div>
                <div style="font-size:24px; font-weight:900; color:#b91c1c; margin-top:8px;">${openConflicts}</div>
                <div style="font-size:11px; color:var(--kiu-text-muted); margin-top:6px;">${latestSync ? `Latest sync: ${adminOpsEscape(adminOpsFormatStatusLabel(latestSync.runStatus || latestSync.status, 'Unknown'))}` : 'No sync runs recorded yet'}</div>
            </div>
            <div class="content-box surface-card" style="padding:16px;">
                <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:var(--kiu-text-muted);">Connected mailboxes</div>
                <div style="font-size:24px; font-weight:900; color:#2563eb; margin-top:8px;">${Number(runtime.status?.connectedMailboxes || 0)}</div>
                <div style="font-size:11px; color:var(--kiu-text-muted); margin-top:6px;">${Number(runtime.status?.failedMailboxes || 0)} with sync failure state</div>
            </div>
        </div>
        <div style="display:grid; grid-template-columns:minmax(360px, 1.1fr) minmax(300px, 0.9fr); gap:18px; margin-top:18px; align-items:start;">
            <div class="content-box surface-card" style="padding:18px;">
                <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:14px;">
                    <div>
                        <div style="font-size:15px; font-weight:900; color:var(--kiu-navy);">System registry</div>
                        <div style="font-size:12px; color:var(--kiu-text-muted); margin-top:4px;">Identity, SIS, finance, HR, curriculum, and portal collaboration services.</div>
                    </div>
                    <span style="font-size:11px; color:var(--kiu-text-muted);">Storage: ${adminOpsEscape(runtime.status?.storageMode || 'Unknown')}</span>
                </div>
                <div style="display:grid; gap:10px;">
                    ${systems.map(system => {
                        const tone = getAdminOpsTone(system.status);
                        return `
                            <div style="padding:14px; border:1px solid var(--kiu-border); border-radius:14px; background:white;">
                                <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
                                    <strong style="font-size:13px; color:var(--kiu-navy);">${adminOpsEscape(system.displayName || system.systemCode)}</strong>
                                    <span style="font-size:10px; font-weight:800; color:${tone.text}; background:${tone.bg}; padding:4px 8px; border-radius:999px;">${adminOpsEscape(adminOpsFormatStatusLabel(system.status, 'Unknown'))}</span>
                                </div>
                                <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
                                    <span style="font-size:10px; padding:4px 8px; border-radius:999px; background:#f8fafc; color:#334155; border:1px solid var(--kiu-border);">${adminOpsEscape(adminOpsFormatStatusLabel(system.ownerDomain, 'External'))}</span>
                                    <span style="font-size:10px; padding:4px 8px; border-radius:999px; background:${accentTone.softBg}; color:${accentTone.accent}; border:1px solid ${accentTone.border};">${adminOpsEscape(adminOpsFormatStatusLabel(system.syncMode, 'Unknown'))}</span>
                                    <span style="font-size:10px; padding:4px 8px; border-radius:999px; background:${system.isAuthoritative !== false ? '#dcfce7' : '#f8fafc'}; color:${system.isAuthoritative !== false ? '#166534' : '#475569'};">${system.isAuthoritative !== false ? 'Source of truth' : 'Dependent system'}</span>
                                    <span style="font-size:10px; padding:4px 8px; border-radius:999px; background:${system.apiKeyConfigured ? '#dcfce7' : '#fff7ed'}; color:${system.apiKeyConfigured ? '#166534' : '#9a3412'};">${system.apiKeyConfigured ? 'Credentials set' : 'Credentials missing'}</span>
                                </div>
                                <div style="font-size:11px; color:var(--kiu-text-muted); margin-top:8px; line-height:1.6;">
                                    Endpoint: ${adminOpsEscape(system.baseUrl || 'Not configured')}<br>
                                    Last checked: ${adminOpsEscape(adminOpsFormatDateTime(system.lastCheckedAt))}
                                </div>
                            </div>
                        `;
                    }).join('') || '<div style="padding:18px; text-align:center; color:var(--kiu-text-muted); border:1px dashed var(--kiu-border); border-radius:14px;">No integration systems are registered yet.</div>'}
                </div>
            </div>
            <div style="display:grid; gap:18px;">
                <div class="content-box surface-card" style="padding:18px;">
                    <div style="font-size:15px; font-weight:900; color:var(--kiu-navy); margin-bottom:14px;">Platform readiness</div>
                    <div style="display:grid; gap:10px;">
                        ${[
                            { label: 'Backend bridge', ready: Boolean(runtime.status?.backendUrl), detail: runtime.status?.backendUrl || 'Not configured' },
                            { label: 'Microsoft sign-in', ready: Boolean(runtime.status?.microsoftReady), detail: runtime.status?.microsoftReady ? 'Configured' : 'Not configured' },
                            { label: 'Microsoft mail consent', ready: Boolean(runtime.status?.microsoftMailReady), detail: runtime.status?.microsoftMailReady ? `${Number(runtime.status?.connectedMailboxes || 0)} mailbox connections` : 'Mail consent is not configured yet' },
                            { label: 'Shared uploads', ready: Boolean(runtime.status?.uploadsReady), detail: runtime.status?.uploadsReady ? 'Uploads directory ready' : 'Uploads path missing' },
                            { label: 'TURN / RTC relay', ready: Boolean(runtime.status?.turnConfigured), detail: runtime.status?.turnConfigured ? 'TURN servers configured' : 'TURN not configured yet' }
                        ].map(item => `
                            <div style="padding:12px; border-radius:14px; border:1px solid var(--kiu-border); background:white; display:flex; align-items:flex-start; justify-content:space-between; gap:12px;">
                                <div>
                                    <div style="font-size:12px; font-weight:800; color:var(--kiu-navy);">${adminOpsEscape(item.label)}</div>
                                    <div style="font-size:11px; color:var(--kiu-text-muted); margin-top:4px;">${adminOpsEscape(item.detail)}</div>
                                </div>
                                <span style="font-size:10px; font-weight:800; color:${item.ready ? '#166534' : '#b91c1c'}; background:${item.ready ? '#dcfce7' : '#fee2e2'}; padding:4px 8px; border-radius:999px;">${item.ready ? 'Ready' : 'Attention'}</span>
                            </div>
                        `).join('')}
                    </div>
                    ${runtime.lastError ? `<div style="margin-top:12px; padding:12px; border-radius:14px; background:#fee2e2; color:#991b1b; font-size:12px; line-height:1.6;">${adminOpsEscape(runtime.lastError)}</div>` : ''}
                </div>
                <div class="content-box surface-card" style="padding:18px;">
                    <div style="font-size:15px; font-weight:900; color:var(--kiu-navy); margin-bottom:14px;">Recent sync runs</div>
                    <div style="display:grid; gap:10px;">
                        ${syncRuns.slice(0, 5).map(run => {
                            const tone = getAdminOpsTone(run.runStatus || run.status);
                            return `
                                <div style="padding:12px; border-radius:14px; border:1px solid var(--kiu-border); background:white;">
                                    <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                                        <strong style="font-size:12px; color:var(--kiu-navy);">${adminOpsEscape(adminOpsFormatStatusLabel(run.systemCode, 'System'))}</strong>
                                        <span style="font-size:10px; font-weight:800; color:${tone.text}; background:${tone.bg}; padding:4px 8px; border-radius:999px;">${adminOpsEscape(adminOpsFormatStatusLabel(run.runStatus || run.status, 'Unknown'))}</span>
                                    </div>
                                    <div style="font-size:11px; color:#475569; margin-top:6px;">Scope: ${adminOpsEscape(adminOpsFormatStatusLabel(run.syncScope || run.scope, 'Full'))}</div>
                                    <div style="font-size:11px; color:var(--kiu-text-muted); margin-top:6px;">Seen ${Number(run.recordsSeen || 0)} | Changed ${Number(run.recordsChanged || 0)}</div>
                                    <div style="font-size:11px; color:var(--kiu-text-muted); margin-top:6px;">Started ${adminOpsEscape(adminOpsFormatDateTime(run.startedAt))}</div>
                                    ${run.errorSummary ? `<div style="font-size:11px; color:#991b1b; margin-top:6px;">${adminOpsEscape(run.errorSummary)}</div>` : ''}
                                </div>
                            `;
                        }).join('') || '<div style="padding:16px; text-align:center; color:var(--kiu-text-muted); border:1px dashed var(--kiu-border); border-radius:14px;">No sync runs have been recorded yet.</div>'}
                    </div>
                </div>
            </div>
        </div>
        <div style="display:grid; grid-template-columns:minmax(320px, 0.95fr) minmax(360px, 1.05fr); gap:18px; margin-top:18px; align-items:start;">
            <div class="content-box surface-card" style="padding:18px;">
                <div style="font-size:15px; font-weight:900; color:var(--kiu-navy); margin-bottom:14px;">Open reconciliation conflicts</div>
                <div style="display:grid; gap:10px;">
                    ${conflicts.slice(0, 6).map(conflict => {
                        const tone = getAdminOpsTone(conflict.resolutionStatus);
                        return `
                            <div style="padding:14px; border-radius:14px; border:1px solid var(--kiu-border); background:white;">
                                <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                                    <strong style="font-size:12px; color:var(--kiu-navy);">${adminOpsEscape(adminOpsFormatStatusLabel(conflict.systemCode, 'System'))} / ${adminOpsEscape(adminOpsFormatStatusLabel(conflict.entityType, 'Record'))}</strong>
                                    <span style="font-size:10px; font-weight:800; color:${tone.text}; background:${tone.bg}; padding:4px 8px; border-radius:999px;">${adminOpsEscape(adminOpsFormatStatusLabel(conflict.resolutionStatus, 'Open'))}</span>
                                </div>
                                <div style="font-size:11px; color:#475569; margin-top:6px;">Field: ${adminOpsEscape(conflict.conflictField)}</div>
                                <div style="font-size:11px; color:var(--kiu-text-muted); margin-top:6px;">Local: ${adminOpsEscape(conflict.localRecordId || 'n/a')} | External: ${adminOpsEscape(conflict.externalRecordKey || 'n/a')}</div>
                                <div style="margin-top:8px; padding:10px; border-radius:12px; background:#f8fafc; font-size:11px; color:#334155; line-height:1.6;">
                                    Portal value: ${adminOpsEscape(typeof conflict.localValue === 'object' ? JSON.stringify(conflict.localValue) : conflict.localValue ?? 'null')}<br>
                                    External value: ${adminOpsEscape(typeof conflict.externalValue === 'object' ? JSON.stringify(conflict.externalValue) : conflict.externalValue ?? 'null')}
                                </div>
                            </div>
                        `;
                    }).join('') || '<div style="padding:16px; text-align:center; color:var(--kiu-text-muted); border:1px dashed var(--kiu-border); border-radius:14px;">No open conflicts are recorded right now.</div>'}
                </div>
            </div>
            <div class="content-box surface-card" style="padding:18px;">
                <div style="font-size:15px; font-weight:900; color:var(--kiu-navy); margin-bottom:14px;">Audit trail</div>
                <div style="display:grid; gap:10px;">
                    ${auditEvents.slice(0, 8).map(event => `
                        <div style="padding:12px 14px; border:1px solid var(--kiu-border); border-radius:14px; background:white;">
                            <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
                                <strong style="font-size:12px; color:var(--kiu-navy);">${adminOpsEscape(adminOpsFormatStatusLabel(event.eventDomain, 'Domain'))} / ${adminOpsEscape(adminOpsFormatStatusLabel(event.eventType, 'Event'))}</strong>
                                <span style="font-size:10px; padding:4px 8px; border-radius:999px; background:#f8fafc; color:#475569; border:1px solid var(--kiu-border);">${adminOpsEscape(adminOpsFormatStatusLabel(event.sourceSystem, 'Portal'))}</span>
                            </div>
                            <div style="font-size:11px; color:#475569; margin-top:6px;">Entity: ${adminOpsEscape(event.entityType)} / ${adminOpsEscape(event.entityId)}</div>
                            <div style="font-size:11px; color:var(--kiu-text-muted); margin-top:6px;">Actor: ${adminOpsEscape(event.actorUserId || 'system')} ${event.actorRole ? `(${adminOpsEscape(adminOpsFormatStatusLabel(event.actorRole, 'Role'))})` : ''}</div>
                            <div style="font-size:11px; color:var(--kiu-text-muted); margin-top:6px;">${adminOpsEscape(adminOpsFormatDateTime(event.createdAt))}</div>
                        </div>
                    `).join('') || '<div style="padding:16px; text-align:center; color:var(--kiu-text-muted); border:1px dashed var(--kiu-border); border-radius:14px;">No audit events have been recorded yet.</div>'}
                </div>
            </div>
        </div>
    `;
}

async function refreshAdminSystemOpsDashboard(force = false) {
    const root = ensureAdminSystemOpsRoot();
    if (!root) return;
    if (adminSystemOpsRuntime.loading) return;

    adminSystemOpsRuntime.loading = true;
    if (!adminSystemOpsRuntime.loaded) {
        renderAdminSystemOpsDashboard();
    } else if (!force) {
        renderAdminSystemOpsDashboard();
    } else {
        adminSystemOpsRuntime.lastError = '';
        renderAdminSystemOpsDashboard();
    }

    try {
        const [
            status,
            systems,
            syncRuns,
            conflicts,
            auditEvents
        ] = await Promise.all([
            typeof fetchPortalPlatformStatus === 'function' ? fetchPortalPlatformStatus() : Promise.resolve(null),
            typeof fetchPortalIntegrationSystems === 'function' ? fetchPortalIntegrationSystems() : Promise.resolve([]),
            typeof fetchPortalSyncRuns === 'function' ? fetchPortalSyncRuns({ limit: 10 }) : Promise.resolve([]),
            typeof fetchPortalSyncConflicts === 'function' ? fetchPortalSyncConflicts({ limit: 10 }) : Promise.resolve([]),
            typeof fetchPortalAuditEvents === 'function' ? fetchPortalAuditEvents({ limit: 12 }) : Promise.resolve([])
        ]);

        adminSystemOpsRuntime.status = status || null;
        adminSystemOpsRuntime.systems = Array.isArray(systems) ? systems : [];
        adminSystemOpsRuntime.syncRuns = Array.isArray(syncRuns) ? syncRuns : [];
        adminSystemOpsRuntime.conflicts = Array.isArray(conflicts) ? conflicts : [];
        adminSystemOpsRuntime.auditEvents = Array.isArray(auditEvents) ? auditEvents : [];
        adminSystemOpsRuntime.loaded = true;
        adminSystemOpsRuntime.lastLoadedAt = new Date().toISOString();
        adminSystemOpsRuntime.lastError = status
            ? ''
            : 'The portal backend did not return platform status. Start the local bridge or production backend to see live system health.';
    } catch (error) {
        adminSystemOpsRuntime.lastError = error?.message || 'Could not load system operations data.';
    } finally {
        adminSystemOpsRuntime.loading = false;
        renderAdminSystemOpsDashboard();
    }
}

function showSlotStats(courseId, groupId) {
    const groups = KIU_STATE.availableGroups[courseId] || [];
    const g = groups.find(x => x.id === groupId);
    if (!g) return;
    
    const occupancy = Math.round((g.registered / g.capacity) * 100);
    alert(`--- SECTION INSIGHTS ---\nSubject: ${courseId}\nGroup: ${g.id}\nProfessor: ${g.prof}\nRoom: ${g.room}\nEnrollment: ${g.registered} / ${g.capacity} (${occupancy}%)\nStatus: ${occupancy > 90 ? 'AT CAPACITY' : 'OPEN'}`);
}

function deleteSection(courseId, groupId) {
    if (!confirm(`Are you sure you want to PERMANENTLY delete Section [${groupId}] for ${courseId}? Students will be automatically unenrolled.`)) return;
    
    if (KIU_STATE.availableGroups[courseId]) {
        KIU_STATE.availableGroups[courseId] = KIU_STATE.availableGroups[courseId].filter(g => g.id !== groupId);
    }
    
    saveState();
    renderAdminMasterGrid();
}

function onAdminDashboardLoad() {
    const fac = getAdminRegistrationFaculty();
    const activeSem = String(KIU_STATE.activeSemester || 3);
    ensureAdminSystemOpsRoot();
    renderAdminSystemOpsDashboard();
    refreshAdminSystemOpsDashboard();

    // Sync curriculum filters first so the library opens on the active term
    const ff = document.getElementById('filter-curriculum-faculty');
    if (ff) ff.value = fac;
    syncCurriculumFacultyBadge(fac);
    const semFilter = document.getElementById('filter-curriculum-semester');
    if (semFilter) semFilter.value = activeSem;

    renderCurriculumTable();
    renderAdminCurriculumPalette();
    renderAdminMasterGrid();
    populateAntiReqDropdown();

    // Init faculty context badge in header
    const ctxBadge = document.getElementById('admin-faculty-context');
    if (ctxBadge) {
        ctxBadge.textContent = getFacultyLabel(fac);
        ctxBadge.style.background = 'rgba(255,255,255,0.2)';
    }

    // Sync user management faculty dropdown to current faculty
    const nuf = document.getElementById('new-user-faculty');
    if (nuf) nuf.value = fac;

    updateSubjectCodePreview();
    renderRecentlyCreated();

    // Keep the Registration Structure CMS alive after refreshes.
    if (document.getElementById('admin-reg-content-container')) {
        ensureAdminRegistrationCmsDefaults(fac);
        bootAdminRegistrationCms(adminRegActiveTab || 'prog');
    }
    if (document.getElementById('admin-exams-root')) {
        ensureAdminExamState(fac);
        renderAdminExamSection();
    }
    renderAdminQaTestingCard();
}

// =============================================
// BROAD ACADEMIC CALENDAR (2024-2040)
// =============================================
function renderBroadCalendar() {
    const container = document.getElementById('broad-calendar-container');
    if (!container) return;

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    let viewYear  = parseInt(container.dataset.viewYear  || currentYear);
    let viewMonth = parseInt(container.dataset.viewMonth || currentMonth);

    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const dayNames   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    // Get events for this month
    if (!KIU_STATE.calendarEvents) KIU_STATE.calendarEvents = {};
    const monthKey = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}`;
    const events = KIU_STATE.calendarEvents[monthKey] || [];

    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth+1, 0).getDate();

    let html = `
    <div style="background:white; border-radius:12px; border:1px solid var(--kiu-border); overflow:hidden;">
        <!-- Header -->
        <div style="display:flex; justify-content:space-between; align-items:center; padding:18px 24px; background:var(--kiu-gradient-blue); color:white;">
            <button type="button" data-bc-nav="-1" style="background:rgba(255,255,255,0.2); border:none; color:white; width:34px; height:34px; border-radius:50%; cursor:pointer; font-size:16px;">&#8249;</button>
            <div style="text-align:center;">
                <div style="font-size:18px; font-weight:700;">${monthNames[viewMonth]} ${viewYear}</div>
                <div style="font-size:11px; opacity:0.8;">Academic Calendar / ${viewYear < currentYear ? 'Past' : viewYear > currentYear ? 'Future' : 'Current Year'}</div>
            </div>
            <button type="button" data-bc-nav="1" style="background:rgba(255,255,255,0.2); border:none; color:white; width:34px; height:34px; border-radius:50%; cursor:pointer; font-size:16px;">&#8250;</button>
        </div>

        <!-- Year Jump -->
        <div style="padding:10px 24px; background:#f8f9fa; border-bottom:1px solid var(--kiu-border); display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
            <span style="font-size:11px; font-weight:700; color:var(--kiu-text-muted);">Jump to year:</span>
            ${Array.from({length: 2040-2024+1}, (_,i) => 2024+i).map(y =>
                `<button type="button" data-bc-year="${y}" style="padding:3px 8px; border-radius:6px; border:1px solid var(--kiu-border); font-size:11px; font-weight:${y===viewYear?'800':'400'}; background:${y===viewYear?'var(--kiu-blue)':'white'}; color:${y===viewYear?'white':'var(--kiu-text-main)'}; cursor:pointer;">${y}</button>`
            ).join('')}
        </div>

        <!-- Day headers -->
        <div style="display:grid; grid-template-columns:repeat(7,1fr); background:#f8f9fa; border-bottom:1px solid var(--kiu-border);">
            ${dayNames.map(d => `<div style="text-align:center; padding:8px; font-size:11px; font-weight:700; color:var(--kiu-text-muted);">${d}</div>`).join('')}
        </div>

        <!-- Days grid -->
        <div style="display:grid; grid-template-columns:repeat(7,1fr);">
    `;

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        html += `<div style="padding:8px; min-height:80px; background:#fafafa; border:1px solid #f0f0f0;"></div>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const isToday = (d === new Date().getDate() && viewMonth === currentMonth && viewYear === currentYear);
        const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const dayEvents = events.filter(e => e.date === dateStr);

        html += `<div data-bc-date="${dateStr}" style="padding:6px 8px; min-height:80px; border:1px solid #f0f0f0; background:${isToday ? '#eff6ff' : 'white'}; vertical-align:top; cursor:pointer;">
            <div style="font-size:13px; font-weight:700; color:${isToday ? 'var(--kiu-blue)' : 'var(--kiu-text-main)'}; ${isToday ? 'background:var(--kiu-blue); color:white; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center;' : ''}">${d}</div>
            ${dayEvents.map(ev => `
                <div style="margin-top:3px; padding:2px 5px; background:${ev.color || '#dbeafe'}; color:${ev.textColor || '#1e40af'}; border-radius:4px; font-size:10px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${ev.title}">${ev.title}</div>
            `).join('')}
        </div>`;
    }

    // Fill remaining cells
    const totalCells = firstDay + daysInMonth;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 0; i < remaining; i++) {
        html += `<div style="padding:8px; min-height:80px; background:#fafafa; border:1px solid #f0f0f0;"></div>`;
    }

    html += `</div>`;

    // Add Event Panel
    const canEdit = currentUserRole === USER_ROLES.ADMIN;
    if (canEdit) {
        html += `
        <div style="padding:16px 24px; border-top:1px solid var(--kiu-border); background:#f8f9fa; display:flex; gap:10px; align-items:flex-end; flex-wrap:wrap;">
            <div><label style="font-size:11px; font-weight:700; color:var(--kiu-text-muted);">DATE</label><br>
            <input type="date" id="bc-event-date" style="padding:7px 10px; border:1px solid var(--kiu-border); border-radius:6px; outline:none; font-size:12px; margin-top:3px;"></div>
            <div style="flex:1; min-width:200px;"><label style="font-size:11px; font-weight:700; color:var(--kiu-text-muted);">EVENT TITLE</label><br>
            <input type="text" id="bc-event-title" placeholder="e.g. Midterm Exams Start" style="width:100%; padding:7px 10px; border:1px solid var(--kiu-border); border-radius:6px; outline:none; font-size:12px; margin-top:3px;"></div>
            <div><label style="font-size:11px; font-weight:700; color:var(--kiu-text-muted);">TYPE</label><br>
            <select id="bc-event-type" style="padding:7px 10px; border:1px solid var(--kiu-border); border-radius:6px; outline:none; font-size:12px; margin-top:3px; background:white;">
                <option value="#dbeafe|#1e40af">Academic</option>
                <option value="#dcfce7|#166534">Holiday</option>
                <option value="#fef3c7|#92400e">Exam</option>
                <option value="#fce7f3|#831843">Deadline</option>
            </select></div>
            <button type="button" class="kiu-btn-blue" data-bc-add="1" style="border-radius:6px; padding:8px 16px; font-size:12px;"><i class="fas fa-plus"></i> Add Event</button>
        </div>`;
    }

    html += `</div>`;
    container.innerHTML = localizeHtmlMarkup(html);
    container.dataset.viewYear  = viewYear;
    container.dataset.viewMonth = viewMonth;
    if (typeof renderStudentCalendarSchedule === 'function') renderStudentCalendarSchedule();
}

function bcNav(dir) {
    const c = document.getElementById('broad-calendar-container');
    if (!c) return;
    let y = parseInt(c.dataset.viewYear), m = parseInt(c.dataset.viewMonth);
    m += dir;
    if (m < 0)  { m = 11; y--; }
    if (m > 11) { m = 0;  y++; }
    y = Math.max(2024, Math.min(2040, y));
    c.dataset.viewYear = y; c.dataset.viewMonth = m;
    renderBroadCalendar();
}

function bcJumpYear(year) {
    const c = document.getElementById('broad-calendar-container');
    if (!c) return;
    c.dataset.viewYear = year;
    renderBroadCalendar();
}

function bcDayClick(dateStr) {
    if (!KIU_STATE.calendarEvents) KIU_STATE.calendarEvents = {};
    const monthKey = dateStr.substring(0,7);
    const events = (KIU_STATE.calendarEvents[monthKey] || []).filter(e => e.date === dateStr);
    if (events.length === 0) {
        const d = document.getElementById('bc-event-date');
        if (d) d.value = dateStr;
        return;
    }
    alert(`Events on ${dateStr}:\n${events.map(e => '- ' + e.title).join('\n')}`);
}

function bcAddEvent() {
    if (currentUserRole !== USER_ROLES.ADMIN) {
        alert('Only administrators can add official academic calendar events.');
        return;
    }
    const date  = document.getElementById('bc-event-date')?.value;
    const title = document.getElementById('bc-event-title')?.value?.trim();
    const type  = document.getElementById('bc-event-type')?.value || '#dbeafe|#1e40af';
    if (!date || !title) { alert('Please enter a date and title.'); return; }

    if (!KIU_STATE.calendarEvents) KIU_STATE.calendarEvents = {};
    const monthKey = date.substring(0,7);
    if (!KIU_STATE.calendarEvents[monthKey]) KIU_STATE.calendarEvents[monthKey] = [];

    const [bg, fg] = type.split('|');
    KIU_STATE.calendarEvents[monthKey].push({ date, title, color: bg, textColor: fg, addedBy: currentUserRole });
    saveState();

    document.getElementById('bc-event-title').value = '';
    renderBroadCalendar();
}

// =============================================
// PER-GROUP MATERIALS KEY (fix for isolation)
// =============================================
// Materials and assignments are now keyed by "courseId::groupId" to keep them separate
function getGroupKey(courseId, groupId) {
    return groupId ? `${courseId}::${groupId}` : courseId;
}

window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (currentUserRole === 'admin') onAdminDashboardLoad();
        if (document.getElementById('admin-generate-time')) autoSetEndTime();
    }, 1500);
});
// Planner route boot

