(function initStudentAcademicRuntime() {
    'use strict';

    function escapeHtml(value) {
        const shared = typeof window !== 'undefined' ? window.escapeHtml : null;
        if (typeof shared === 'function' && shared !== escapeHtml) return shared(value);
        return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }


    function normalizeText(value, fallback = '') {
        const raw = value == null ? '' : String(value);
        const cleaned = typeof cleanupEncodingArtifacts === 'function' ? cleanupEncodingArtifacts(raw) : raw;
        const translated = typeof toEnglishText === 'function' ? toEnglishText(cleaned) : cleaned;
        const finalValue = String(translated || '').trim();
        return finalValue || fallback;
    }

    function courseKey(value) {
        if (typeof canonicalCourseKey === 'function') return canonicalCourseKey(value);
        return normalizeText(value, '').toUpperCase();
    }

    function normalizeScheduleEntries(scheduleValue) {
        const rawEntries = typeof normalizeStudentScheduleValue === 'function'
            ? normalizeStudentScheduleValue(scheduleValue).map((entry) => ({ ...entry }))
            : (Array.isArray(scheduleValue) ? scheduleValue.map((entry) => ({ ...entry })) : []);
        if (typeof window.flattenStudentScheduleEntry !== 'function') return rawEntries;
        return rawEntries
            .map((entry) => window.flattenStudentScheduleEntry(entry))
            .filter(Boolean);
    }

    function facultyLabel(code) {
        const profile = typeof getFacultyProfile === 'function' ? getFacultyProfile(code) : null;
        return normalizeText(profile?.fullName || profile?.name || code || 'Faculty', 'Faculty');
    }

    function resolveCourseFromCurriculum(courseId, preferredFaculty) {
        const fac = typeof normalizeFacultyCode === 'function'
            ? normalizeFacultyCode(preferredFaculty || (typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON'), 'ECON')
            : (preferredFaculty || 'ECON');
        const curriculum = typeof getActiveCurriculum === 'function' ? getActiveCurriculum(fac) : [];
        const key = courseKey(courseId);
        return (curriculum || []).find((item) => {
            const id = item?.id || item?.n || item?.courseId || '';
            return courseKey(id) === key;
        }) || null;
    }

    function resolveCourseName(courseId, preferredFaculty) {
        const course = resolveCourseFromCurriculum(courseId, preferredFaculty);
        return normalizeText(course?.name || course?.title || course?.n || courseId, courseId);
    }

    function resolveCourseEcts(courseId, preferredFaculty) {
        const course = resolveCourseFromCurriculum(courseId, preferredFaculty);
        const ects = Number(course?.ects || course?.credits || 0);
        return Number.isFinite(ects) && ects > 0 ? ects : 6;
    }

    function getPassedCourseIds(studentId) {
        const passed = new Set();
        const add = (courseId) => {
            const key = courseKey(courseId);
            if (key) passed.add(key);
        };
        (KIU_STATE?.studentPassedCourses?.[studentId] || []).forEach((item) => {
            add(typeof item === 'string' ? item : (item?.id || item?.courseId || item?.n || ''));
        });
        Object.entries(KIU_STATE?.studentGrades || {}).forEach(([rosterId, roster]) => {
            const record = (roster || []).find((entry) => String(entry?.id || '') === String(studentId));
            if (!record) return;
            if (typeof isGradeRecordPassedByKiuRule === 'function') {
                if (!isGradeRecordPassedByKiuRule(record, rosterId)) return;
            } else {
                const score = typeof getGradeRecordCombinedKiuPassScore === 'function'
                    ? Number(getGradeRecordCombinedKiuPassScore(record, rosterId) || 0)
                    : Number((record.q1 || 0) + (record.qa || 0) + (record.mid || 0) + (record.final || 0));
                if (score < 51) return;
            }
            const subjectList = Object.keys(KIU_STATE.facultyProfiles || {}).flatMap((fac) => (
                typeof getActiveCurriculum === 'function' ? getActiveCurriculum(fac) : []
            ));
            const resolved = typeof resolveSubjectIdFromRosterId === 'function'
                ? resolveSubjectIdFromRosterId(rosterId, subjectList)
                : rosterId;
            if (resolved) add(resolved);
        });
        return passed;
    }

    function resolveGradeLetterFromScore(score) {
        const safeScore = Number(score || 0);
        if (safeScore >= 91) return 'A';
        if (safeScore >= 81) return 'B';
        if (safeScore >= 71) return 'C';
        if (safeScore >= 61) return 'D';
        if (safeScore >= 51) return 'E';
        if (safeScore >= 41) return 'FX';
        return 'F';
    }

    function getGradeOutcomeForRecord(record, rosterId = '') {
        const safeRecord = record || {};
        const finalScore = Number(safeRecord.final || 0);
        const retakeScore = Number(safeRecord.retake || 0);
        const hasExamOutcome = finalScore > 0 || retakeScore > 0;
        const score = typeof getGradeRecordCombinedKiuPassScore === 'function'
            ? Number(getGradeRecordCombinedKiuPassScore(safeRecord, rosterId) || 0)
            : Number((safeRecord.q1 || 0) + (safeRecord.qa || 0) + (safeRecord.mid || 0) + (safeRecord.final || 0));
        const passed = typeof isGradeRecordPassedByKiuRule === 'function'
            ? isGradeRecordPassedByKiuRule(safeRecord, rosterId)
            : (hasExamOutcome && score >= 51);
        const failed = hasExamOutcome && !passed;
        const gradeLetter = safeRecord.letter
            ? String(safeRecord.letter).trim().charAt(0).toUpperCase()
            : resolveGradeLetterFromScore(score);
        return {
            score,
            hasExamOutcome,
            passed,
            failed,
            gradeLetter,
            gradeSource: 'gradebook',
            rosterId
        };
    }

    function getGradeForSubject(studentId, courseId) {
        const key = courseKey(courseId);
        let best = null;
        Object.entries(KIU_STATE?.studentGrades || {}).forEach(([rosterId, roster]) => {
            const record = (roster || []).find((entry) => String(entry?.id || '') === String(studentId));
            if (!record) return;
            const rosterKey = courseKey(rosterId);
            const resolved = typeof resolveSubjectIdFromRosterId === 'function'
                ? resolveSubjectIdFromRosterId(rosterId, [courseId])
                : rosterId;
            if (courseKey(resolved) !== key && rosterKey !== key) return;
            const outcome = getGradeOutcomeForRecord(record, rosterId);
            if (!best || outcome.score > best.score) best = outcome;
        });
        return best;
    }

    function scanGradebookSubjectsWithoutSchedule(studentId, preferredFaculty, subjectMap, upsertSubject) {
        const subjectList = Object.keys(KIU_STATE?.facultyProfiles || {}).flatMap((fac) => (
            typeof getActiveCurriculum === 'function' ? getActiveCurriculum(fac) : []
        ));
        Object.entries(KIU_STATE?.studentGrades || {}).forEach(([rosterId, roster]) => {
            const record = (roster || []).find((entry) => String(entry?.id || '') === String(studentId));
            if (!record) return;
            const outcome = getGradeOutcomeForRecord(record, rosterId);
            if (!outcome.hasExamOutcome) return;
            const resolved = typeof resolveSubjectIdFromRosterId === 'function'
                ? resolveSubjectIdFromRosterId(rosterId, subjectList)
                : rosterId;
            const courseId = resolved || rosterId;
            if (!courseId || subjectMap.has(courseKey(courseId))) return;
            const derivedFaculty = typeof deriveFacultyFromSubjectId === 'function'
                ? deriveFacultyFromSubjectId(courseId)
                : preferredFaculty;
            const entryFaculty = typeof normalizeFacultyCode === 'function'
                ? normalizeFacultyCode(derivedFaculty || preferredFaculty, preferredFaculty)
                : (derivedFaculty || preferredFaculty);
            upsertSubject(courseId, {
                name: resolveCourseName(courseId, entryFaculty),
                ects: resolveCourseEcts(courseId, entryFaculty),
                faculty: entryFaculty,
                status: outcome.passed ? 'completed' : 'failed',
                gradeScore: outcome.score,
                gradeLetter: outcome.gradeLetter,
                gradeSource: outcome.gradeSource,
                hasExamOutcome: true,
                passed: outcome.passed,
                failed: outcome.failed,
                rosterId: outcome.rosterId,
                schedule: null
            });
        });
    }

    function defaultCurriculumPlan(record) {
        return {
            mode: 'standard',
            sourceFaculty: record?.facultyCode || '',
            targetFaculty: record?.facultyCode || '',
            subjectIds: [],
            completedSubjectIds: [],
            effectiveFrom: '',
            notes: ''
        };
    }

    function resolveProgramRequiredEcts(facultyCode) {
        const curriculum = typeof getActiveCurriculum === 'function' ? getActiveCurriculum(facultyCode) : [];
        const total = (curriculum || []).reduce((sum, item) => {
            const ects = Number(item?.ects || item?.credits || 0);
            return sum + (Number.isFinite(ects) && ects > 0 ? ects : 0);
        }, 0);
        return total > 0 ? total : 180;
    }

    function resolveAverageGradeLabel(performance = {}) {
        const copy = normalizeText(performance?.quaternary || '', '');
        return copy || 'No grades yet';
    }

    function buildScheduleItemsFromSubjects(subjects = [], preferredFaculty) {
        const accent = typeof getFacultyColor === 'function'
            ? getFacultyColor(preferredFaculty)
            : '#008080';
        const weekStart = typeof getWeekStart === 'function' ? getWeekStart(new Date()) : null;
        return subjects
            .filter((item) => item.status === 'enrolled' && item.schedule)
            .map((item) => {
                let entry = { ...item.schedule };
                if (
                    typeof resolveScheduledGroupForWeek === 'function'
                    && entry.courseId
                    && entry.groupId
                ) {
                    const resolved = resolveScheduledGroupForWeek(entry.courseId, entry.groupId, weekStart);
                    if (resolved) entry = { ...entry, ...resolved };
                }
                return {
                    courseId: item.courseId,
                    courseName: item.name,
                    id: entry.groupId || entry.groupName || 'G1',
                    groupId: entry.groupId || entry.groupName || 'G1',
                    day: entry.day || 'TBD',
                    time: entry.time || '09:00',
                    room: entry.room || '',
                    duration: entry.duration || '110min',
                    prof: entry.prof || '',
                    faculty: item.faculty || preferredFaculty,
                    accent
                };
            });
    }

    function formatAcademicSyncLabel(studentId) {
        const stamp = window.__kiuStudentAcademicSyncAt?.[studentId];
        if (!stamp) return 'Not synced yet';
        const parsed = new Date(stamp);
        if (Number.isNaN(parsed.getTime())) return 'Synced';
        const deltaMs = Date.now() - parsed.getTime();
        if (deltaMs < 60000) return 'just now';
        if (deltaMs < 3600000) return `${Math.floor(deltaMs / 60000)}m ago`;
        return parsed.toLocaleString();
    }

    function applyApiEnrollmentsToStudentState(studentId, enrollments) {
        const normalizedId = normalizeText(studentId, '');
        if (!normalizedId || !Array.isArray(enrollments) || !enrollments.length) return false;
        if (!KIU_STATE.studentSchedulesByStudent || typeof KIU_STATE.studentSchedulesByStudent !== 'object') {
            KIU_STATE.studentSchedulesByStudent = {};
        }
        const schedule = normalizeScheduleEntries(KIU_STATE.studentSchedulesByStudent[normalizedId]);
        const existingKeys = new Set(schedule.map((entry) => courseKey(entry?.courseId || entry?.sourceCourseId || '')));
        let mutated = false;
        enrollments.forEach((enrollment) => {
            const courseId = normalizeText(enrollment?.courseId || enrollment?.course?.id || '', '');
            if (!courseId || existingKeys.has(courseKey(courseId))) return;
            const section = enrollment?.section || {};
            schedule.push({
                courseId,
                courseName: normalizeText(enrollment?.course?.name || enrollment?.course?.title || courseId, courseId),
                groupId: normalizeText(section?.id || enrollment?.sectionId || 'G1', 'G1'),
                groupName: normalizeText(section?.name || section?.id || 'G1', 'G1'),
                day: normalizeText(section?.day || 'TBD', 'TBD'),
                time: normalizeText(section?.time || 'TBD', 'TBD'),
                duration: normalizeText(section?.duration || '110min', '110min'),
                prof: normalizeText(section?.prof || 'TBD', 'TBD'),
                room: normalizeText(section?.room || 'TBD', 'TBD'),
                faculty: normalizeText(enrollment?.course?.faculty || section?.faculty || '', ''),
                ects: Number(enrollment?.course?.ects || 6) || 6
            });
            existingKeys.add(courseKey(courseId));
            mutated = true;
        });
        if (!mutated) return false;
        if (typeof commitStudentScheduleEntriesForSchedulerMutation === 'function') {
            commitStudentScheduleEntriesForSchedulerMutation(normalizedId, schedule);
        } else {
            KIU_STATE.studentSchedulesByStudent[normalizedId] = JSON.parse(JSON.stringify(schedule));
        }
        return true;
    }

    function touchStudentAcademicSync(studentId) {
        const normalizedId = normalizeText(studentId, '');
        if (!normalizedId) return;
        if (!window.__kiuStudentAcademicSyncAt || typeof window.__kiuStudentAcademicSyncAt !== 'object') {
            window.__kiuStudentAcademicSyncAt = {};
        }
        window.__kiuStudentAcademicSyncAt[normalizedId] = new Date().toISOString();
    }

    async function hydrateStudentAcademicRecord(studentId, record = {}) {
        const normalizedId = normalizeText(studentId || record?.id || '', '');
        const baseRecord = { ...record, id: normalizedId || record?.id };
        if (normalizedId && typeof fetchStudentAcademicEnrollments === 'function') {
            try {
                const payload = await fetchStudentAcademicEnrollments(normalizedId);
                if (payload?.enrollments?.length) {
                    applyApiEnrollmentsToStudentState(normalizedId, payload.enrollments);
                }
            } catch (_) {
                // Local KIU_STATE fallback for offline/file mode.
            }
        }
        touchStudentAcademicSync(normalizedId);
        return loadStudentAcademicSnapshot(baseRecord);
    }

    function loadStudentAcademicSnapshot(record) {
        const studentId = String(record?.id || '');
        const preferredFaculty = record?.facultyCode || (typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON');
        const user = (KIU_STATE?.users || []).find((item) => String(item?.id || '') === studentId) || null;
        const schedule = normalizeScheduleEntries(KIU_STATE?.studentSchedulesByStudent?.[studentId]);
        const passedKeys = getPassedCourseIds(studentId);
        const curriculumPlan = record?.curriculumPlan && typeof record.curriculumPlan === 'object'
            ? { ...defaultCurriculumPlan(record), ...record.curriculumPlan }
            : defaultCurriculumPlan(record);
        const performance = typeof getUserPerformanceSummary === 'function'
            ? getUserPerformanceSummary({ ...user, ...record, role: USER_ROLES?.STUDENT || 'student' })
            : { primary: record?.semester || '-', secondary: String(Number(record?.gpa || 0).toFixed(2)), tertiary: '0', quaternary: '-' };
        if (typeof getStudentCompletedEctsTotal === 'function') {
            performance.tertiary = String(getStudentCompletedEctsTotal(studentId, preferredFaculty));
        }
        const signals = typeof getStudentDirectorySignals === 'function'
            ? getStudentDirectorySignals({ ...record, gpa: Number(record?.gpa || user?.gpa || 0) })
            : { holdLabel: 'Clear', holdTone: 'success' };

        const subjectMap = new Map();
        const upsertSubject = (courseId, patch) => {
            const key = courseKey(courseId);
            if (!key) return;
            const existing = subjectMap.get(key) || {
                courseId,
                name: resolveCourseName(courseId, preferredFaculty),
                ects: resolveCourseEcts(courseId, preferredFaculty),
                faculty: preferredFaculty,
                status: 'planned',
                gradeScore: null,
                schedule: null
            };
            subjectMap.set(key, { ...existing, ...patch, courseId: existing.courseId || courseId });
        };

        schedule.forEach((entry) => {
            const courseId = entry?.courseId || entry?.sourceCourseId || '';
            const derivedFaculty = typeof deriveFacultyFromSubjectId === 'function'
                ? deriveFacultyFromSubjectId(courseId)
                : preferredFaculty;
            const entryFaculty = typeof normalizeFacultyCode === 'function'
                ? normalizeFacultyCode(entry?.faculty || derivedFaculty || preferredFaculty, preferredFaculty)
                : (entry?.faculty || preferredFaculty);
            const grade = getGradeForSubject(studentId, courseId);
            const isPassed = passedKeys.has(courseKey(courseId)) || Boolean(grade?.passed);
            const isFailed = Boolean(grade?.failed);
            upsertSubject(courseId, {
                name: normalizeText(entry?.courseName || resolveCourseName(courseId, entryFaculty), courseId),
                ects: Number(entry?.ects || resolveCourseEcts(courseId, entryFaculty)) || 6,
                faculty: entryFaculty,
                status: isPassed ? 'completed' : (isFailed ? 'failed' : 'enrolled'),
                gradeScore: grade?.score ?? null,
                gradeLetter: grade?.gradeLetter ?? null,
                gradeSource: grade?.gradeSource ?? null,
                schedule: entry
            });
        });

        (curriculumPlan.subjectIds || []).forEach((courseId) => {
            if (passedKeys.has(courseKey(courseId))) {
                upsertSubject(courseId, { status: 'completed' });
                return;
            }
            const grade = getGradeForSubject(studentId, courseId);
            if (grade?.failed) {
                upsertSubject(courseId, {
                    status: 'failed',
                    gradeScore: grade.score,
                    gradeLetter: grade.gradeLetter,
                    gradeSource: grade.gradeSource
                });
                return;
            }
            if (!subjectMap.has(courseKey(courseId))) {
                upsertSubject(courseId, { status: 'planned' });
            }
        });

        (curriculumPlan.completedSubjectIds || []).forEach((courseId) => {
            upsertSubject(courseId, { status: 'completed' });
        });

        passedKeys.forEach((key) => {
            if (subjectMap.has(key)) return;
            const courseId = [...(KIU_STATE?.studentPassedCourses?.[studentId] || [])]
                .map((item) => (typeof item === 'string' ? item : (item?.id || item?.courseId || '')))
                .find((id) => courseKey(id) === key) || key;
            const grade = getGradeForSubject(studentId, courseId);
            upsertSubject(courseId, {
                status: 'completed',
                gradeScore: grade?.score ?? null,
                gradeLetter: grade?.gradeLetter ?? null,
                gradeSource: grade?.gradeSource ?? null
            });
        });

        scanGradebookSubjectsWithoutSchedule(studentId, preferredFaculty, subjectMap, upsertSubject);

        const subjects = [...subjectMap.values()].sort((a, b) => a.name.localeCompare(b.name));
        const completedEcts = subjects
            .filter((item) => item.status === 'completed')
            .reduce((sum, item) => sum + (Number(item.ects) || 0), 0);
        const enrolledEcts = subjects
            .filter((item) => item.status === 'enrolled')
            .reduce((sum, item) => sum + (Number(item.ects) || 0), 0);
        const programRequiredEcts = resolveProgramRequiredEcts(preferredFaculty);
        const remainingEcts = Math.max(0, programRequiredEcts - completedEcts);
        const plannedCount = subjects.filter((item) => item.status === 'planned').length;
        const failedCount = subjects.filter((item) => item.status === 'failed').length;
        const subjectsByStatus = {
            enrolled: subjects.filter((item) => item.status === 'enrolled'),
            completed: subjects.filter((item) => item.status === 'completed'),
            failed: subjects.filter((item) => item.status === 'failed'),
            planned: subjects.filter((item) => item.status === 'planned')
        };
        const scheduleItems = buildScheduleItemsFromSubjects(subjects, preferredFaculty);
        const progressPercent = programRequiredEcts > 0
            ? Math.min(100, Math.round((completedEcts / programRequiredEcts) * 100))
            : 0;

        return {
            studentId,
            preferredFaculty,
            performance,
            signals,
            curriculumPlan,
            subjects,
            subjectsByStatus,
            scheduleItems,
            completedEcts,
            enrolledEcts,
            programRequiredEcts,
            remainingEcts,
            progressPercent,
            averageGradeLabel: resolveAverageGradeLabel(performance),
            lastSyncedLabel: formatAcademicSyncLabel(studentId),
            subjectCount: subjects.length,
            enrolledCount: subjectsByStatus.enrolled.length,
            completedCount: subjectsByStatus.completed.length,
            failedCount,
            plannedCount
        };
    }

    function listAvailableCurriculumCourses(facultyCode, excludeIds = []) {
        const fac = typeof normalizeFacultyCode === 'function'
            ? normalizeFacultyCode(facultyCode, 'ECON')
            : facultyCode;
        const exclude = new Set((excludeIds || []).map(courseKey));
        return (typeof getActiveCurriculum === 'function' ? getActiveCurriculum(fac) : [])
            .map((item) => {
                const courseId = item?.id || item?.n || item?.courseId || '';
                return {
                    courseId,
                    name: normalizeText(item?.name || item?.title || item?.n || courseId, courseId),
                    ects: Number(item?.ects || item?.credits || 6) || 6
                };
            })
            .filter((item) => item.courseId && !exclude.has(courseKey(item.courseId)));
    }

    function addStudentEnrollmentSubject(studentId, courseId, facultyCode) {
        const normalizedId = normalizeText(studentId, '');
        const normalizedCourse = normalizeText(courseId, '');
        if (!normalizedId || !normalizedCourse) return false;
        if (!KIU_STATE.studentSchedulesByStudent || typeof KIU_STATE.studentSchedulesByStudent !== 'object') {
            KIU_STATE.studentSchedulesByStudent = {};
        }
        const schedule = normalizeScheduleEntries(KIU_STATE.studentSchedulesByStudent[normalizedId]);
        if (schedule.some((entry) => courseKey(entry?.courseId || entry?.sourceCourseId) === courseKey(normalizedCourse))) {
            return false;
        }
        const fac = typeof normalizeFacultyCode === 'function'
            ? normalizeFacultyCode(facultyCode || (typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON'), 'ECON')
            : (facultyCode || 'ECON');
        const groups = KIU_STATE.availableGroups?.[normalizedCourse] || [];
        const group = groups.find((item) => {
            const groupFaculty = typeof normalizeFacultyCode === 'function'
                ? normalizeFacultyCode(item?.faculty || fac, fac)
                : (item?.faculty || fac);
            return groupFaculty === fac;
        }) || groups[0] || null;
        schedule.push({
            courseId: normalizedCourse,
            courseName: resolveCourseName(normalizedCourse, fac),
            groupId: group?.id || 'G1',
            groupName: group?.name || 'G1',
            day: group?.day || 'TBD',
            time: group?.time || 'TBD',
            duration: group?.duration || '110min',
            prof: group?.prof || 'TBD',
            room: group?.room || 'TBD',
            faculty: fac,
            ects: resolveCourseEcts(normalizedCourse, fac)
        });
        if (typeof commitStudentScheduleEntriesForSchedulerMutation === 'function') {
            commitStudentScheduleEntriesForSchedulerMutation(normalizedId, schedule);
        } else {
            KIU_STATE.studentSchedulesByStudent[normalizedId] = JSON.parse(JSON.stringify(schedule));
        }
        return true;
    }

    function removeStudentEnrollmentSubject(studentId, courseId) {
        const normalizedId = normalizeText(studentId, '');
        const normalizedCourse = normalizeText(courseId, '');
        if (!normalizedId || !normalizedCourse || !KIU_STATE.studentSchedulesByStudent) return false;
        const schedule = normalizeScheduleEntries(KIU_STATE.studentSchedulesByStudent[normalizedId]);
        const next = schedule.filter((entry) => courseKey(entry?.courseId || entry?.sourceCourseId) !== courseKey(normalizedCourse));
        if (next.length === schedule.length) return false;
        if (typeof commitStudentScheduleEntriesForSchedulerMutation === 'function') {
            commitStudentScheduleEntriesForSchedulerMutation(normalizedId, next);
        } else {
            KIU_STATE.studentSchedulesByStudent[normalizedId] = next;
        }
        return true;
    }

    function markStudentSubjectComplete(studentId, courseId) {
        const normalizedId = normalizeText(studentId, '');
        const normalizedCourse = normalizeText(courseId, '');
        if (!normalizedId || !normalizedCourse) return false;
        if (!KIU_STATE.studentPassedCourses || typeof KIU_STATE.studentPassedCourses !== 'object') {
            KIU_STATE.studentPassedCourses = {};
        }
        if (!Array.isArray(KIU_STATE.studentPassedCourses[normalizedId])) {
            KIU_STATE.studentPassedCourses[normalizedId] = [];
        }
        const key = courseKey(normalizedCourse);
        const exists = KIU_STATE.studentPassedCourses[normalizedId].some((item) => (
            courseKey(typeof item === 'string' ? item : (item?.id || item?.courseId || '')) === key
        ));
        if (!exists) KIU_STATE.studentPassedCourses[normalizedId].push(normalizedCourse);
        return true;
    }

    function updateStudentCurriculumPlan(record, patch) {
        const base = record?.curriculumPlan && typeof record.curriculumPlan === 'object'
            ? record.curriculumPlan
            : defaultCurriculumPlan(record);
        return { ...base, ...(patch || {}) };
    }

    function parseSubjectIdList(value) {
        return String(value || '')
            .split(/[\n,;]+/)
            .map((item) => normalizeText(item, ''))
            .filter(Boolean);
    }

    function executeInternalTransfer(record, options = {}) {
        if (!record?.id) return null;
        const sourceFaculty = typeof normalizeFacultyCode === 'function'
            ? normalizeFacultyCode(options.sourceFaculty || record.facultyCode, record.facultyCode)
            : (options.sourceFaculty || record.facultyCode);
        const targetFaculty = typeof normalizeFacultyCode === 'function'
            ? normalizeFacultyCode(options.targetFaculty || '', sourceFaculty)
            : (options.targetFaculty || sourceFaculty);
        if (!targetFaculty || targetFaculty === sourceFaculty) return null;

        const subjectIds = Array.isArray(options.subjectIds)
            ? options.subjectIds.map((item) => normalizeText(item, '')).filter(Boolean)
            : parseSubjectIdList(options.subjectIds);
        const effectiveFrom = normalizeText(options.effectiveFrom, new Date().toISOString().slice(0, 10));
        const notes = normalizeText(options.notes, '');
        const mobility = record.mobility && typeof record.mobility === 'object' ? { ...record.mobility } : {};
        mobility.category = 'internal_transfer';
        mobility.sourceFaculty = sourceFaculty;
        mobility.targetFaculty = targetFaculty;
        mobility.effectiveFrom = effectiveFrom;
        mobility.agreementMetadata = { ...(mobility.agreementMetadata || {}), notes };
        mobility.history = Array.isArray(mobility.history) ? [...mobility.history] : [];
        mobility.history.push({
            from: sourceFaculty,
            to: targetFaculty,
            effectiveFrom,
            notes,
            subjectIds: [...subjectIds]
        });

        const oldProfile = KIU_STATE.facultyProfiles?.[sourceFaculty];
        if (oldProfile?.students) {
            oldProfile.students = oldProfile.students.filter((item) => String(item?.id || '') !== String(record.id));
        }

        const completedSubjectIds = Array.isArray(record.curriculumPlan?.completedSubjectIds)
            ? [...record.curriculumPlan.completedSubjectIds]
            : [];
        return {
            ...record,
            facultyCode: targetFaculty,
            faculty: facultyLabel(targetFaculty),
            department: typeof departmentForFaculty === 'function'
                ? departmentForFaculty(targetFaculty)
                : facultyLabel(targetFaculty),
            mobility,
            mobilityCategory: 'internal_transfer',
            curriculumPlan: {
                mode: 'internal_transfer',
                sourceFaculty,
                targetFaculty,
                subjectIds,
                completedSubjectIds,
                effectiveFrom,
                notes
            },
            updatedAt: new Date().toISOString().slice(0, 10)
        };
    }

    function subjectStatusTone(status) {
        if (status === 'completed') return 'is-success';
        if (status === 'enrolled') return 'is-warning';
        if (status === 'failed') return 'is-danger';
        return '';
    }

    function subjectStatusLabel(status) {
        if (status === 'completed') return 'Completed';
        if (status === 'enrolled') return 'Enrolled';
        if (status === 'failed') return 'Failed';
        return 'Planned';
    }

    function renderSubjectGradeCopy(item) {
        return item.gradeScore != null && item.gradeScore > 0 ? `${Math.round(item.gradeScore)}%` : '—';
    }

    function renderSubjectScheduleCopy(item) {
        if (!item.schedule) return '—';
        return `${normalizeText(item.schedule.day, 'TBD')} ${normalizeText(item.schedule.time, '')}`.trim();
    }

    function renderSubjectGroupCopy(item) {
        if (!item.schedule) return '—';
        return normalizeText(item.schedule.groupName || item.schedule.groupId, '—');
    }

    function renderSubjectRoomCopy(item) {
        if (!item.schedule) return '—';
        return normalizeText(item.schedule.room, '—');
    }

    function renderSubjectProfCopy(item) {
        if (!item.schedule) return '—';
        return normalizeText(item.schedule.prof, '—');
    }

    const ACADEMIC_SUBJECT_LISTS = {
        enrolled: {
            title: 'Active enrollments',
            description: 'Current subjects on the student schedule with section and room detail.',
            emptyHint: 'Enroll subjects from Planned curriculum.',
            icon: 'fa-calendar-check',
            tableHead: '<th>Subject</th><th>ECTS</th><th>Grade</th><th>Group</th><th>Schedule</th><th>Room</th><th>Professor</th><th>Actions</th>',
            colspan: 8
        },
        completed: {
            title: 'Passed subjects',
            description: 'Completed credits from gradebook results, manual completion, or curriculum plan.',
            emptyHint: 'Completed credits will show here.',
            icon: 'fa-circle-check',
            tableHead: '<th>Subject</th><th>ECTS</th><th>Grade</th><th>Term</th><th>Source</th>',
            colspan: 5
        },
        failed: {
            title: 'Failed subjects',
            description: 'Subjects with a recorded exam outcome that did not meet the pass threshold.',
            emptyHint: 'No failed exam outcomes recorded.',
            icon: 'fa-circle-xmark',
            tableHead: '<th>Subject</th><th>ECTS</th><th>Grade</th><th>Letter</th><th>Outcome</th><th>Source</th>',
            colspan: 6
        },
        planned: {
            title: 'Planned curriculum',
            description: 'Subjects assigned to the mobility or curriculum plan that are not yet enrolled.',
            emptyHint: 'No planned subjects outside the active schedule.',
            icon: 'fa-list-check',
            tableHead: '<th>Subject</th><th>ECTS</th><th>Status</th><th>Actions</th>',
            colspan: 4
        }
    };

    function renderAcademicSubjectSection(listKey, title, count, description) {
        return `
            <button class="students-hub-form-section lux-data-card home-hover-chip students-hub-academic-section students-hub-academic-section-btn"
                    type="button"
                    data-student-action="open-academic-subjects"
                    data-academic-list="${escapeHtml(listKey)}">
                <div class="students-hub-section-head students-hub-academic-section-head">
                    <div>
                        <h3>${escapeHtml(title)} <span class="students-hub-academic-count">${escapeHtml(String(count))}</span></h3>
                        <p>${escapeHtml(description)}</p>
                    </div>
                    <span class="students-hub-academic-section-cta">View details <i class="fas fa-chevron-right" aria-hidden="true"></i></span>
                </div>
            </button>
        `;
    }

    function normalizeAcademicSubjectsFilters(filters = {}) {
        const sort = ['name', 'ects', 'grade'].includes(filters.sort) ? filters.sort : 'name';
        return {
            query: String(filters.query || '').trim(),
            sort
        };
    }

    function academicSubjectMatchesQuery(item, query) {
        if (!query) return true;
        const needle = query.toLowerCase();
        const name = String(item?.name || '').toLowerCase();
        const courseId = String(item?.courseId || '').toLowerCase();
        return name.includes(needle) || courseId.includes(needle);
    }

    function sortAcademicSubjectItems(items, sortKey) {
        const list = [...(items || [])];
        const byName = (a, b) => String(a?.name || '').localeCompare(String(b?.name || ''), undefined, { sensitivity: 'base' });
        if (sortKey === 'ects') {
            return list.sort((a, b) => {
                const diff = Number(b?.ects || 0) - Number(a?.ects || 0);
                return diff || byName(a, b);
            });
        }
        if (sortKey === 'grade') {
            return list.sort((a, b) => {
                const aScore = a?.gradeScore != null && a.gradeScore > 0 ? Number(a.gradeScore) : -1;
                const bScore = b?.gradeScore != null && b.gradeScore > 0 ? Number(b.gradeScore) : -1;
                if (aScore < 0 && bScore < 0) return byName(a, b);
                if (aScore < 0) return 1;
                if (bScore < 0) return -1;
                return bScore - aScore || byName(a, b);
            });
        }
        return list.sort(byName);
    }

    function filterAndSortAcademicSubjects(items, filters = {}) {
        const normalized = normalizeAcademicSubjectsFilters(filters);
        const filtered = (items || []).filter((item) => academicSubjectMatchesQuery(item, normalized.query));
        return {
            items: sortAcademicSubjectItems(filtered, normalized.sort),
            query: normalized.query,
            sort: normalized.sort
        };
    }

    function renderAcademicSubjectsEmptyState(listKey, title, emptyHint, icon) {
        return `
            <div class="students-hub-academic-modal-empty is-list-${escapeHtml(listKey)}">
                <span class="students-hub-academic-modal-empty-icon" aria-hidden="true">
                    <i class="fas ${escapeHtml(icon)}"></i>
                </span>
                <strong class="students-hub-academic-modal-empty-title">${escapeHtml(title)}</strong>
                <p class="students-hub-academic-modal-empty-hint">${escapeHtml(emptyHint)}</p>
            </div>
        `;
    }

    function renderAcademicSubjectsTable(tableHead, rows) {
        return `
            <div class="students-hub-academic-modal-panel">
                <div class="students-hub-academic-table-wrap is-modal-scroll">
                    <table class="students-hub-academic-table">
                        <thead><tr>${tableHead}</tr></thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function renderAcademicSubjectsToolbar(filters = {}, options = {}) {
        const normalized = normalizeAcademicSubjectsFilters(filters);
        const disabled = options.disabled ? ' disabled' : '';
        const hasActive = Boolean(normalized.query) || normalized.sort !== 'name';
        const clearHidden = hasActive ? '' : ' is-hidden';
        return `
            <div class="students-hub-academic-modal-toolbar">
                <label class="students-hub-academic-modal-search" for="academic-subjects-search">
                    <i class="fas fa-search" aria-hidden="true"></i>
                    <input id="academic-subjects-search"
                           class="lux-control"
                           type="search"
                           value="${escapeHtml(normalized.query)}"
                           placeholder="Search subject or code"
                           autocomplete="off"${disabled}>
                </label>
                <select id="academic-subjects-sort" class="lux-control students-hub-academic-modal-sort" aria-label="Sort subjects"${disabled}>
                    <option value="name"${normalized.sort === 'name' ? ' selected' : ''}>Name</option>
                    <option value="ects"${normalized.sort === 'ects' ? ' selected' : ''}>ECTS</option>
                    <option value="grade"${normalized.sort === 'grade' ? ' selected' : ''}>Grade</option>
                </select>
                <button class="lux-secondary-btn students-hub-academic-modal-clear${clearHidden}"
                        type="button"
                        data-student-action="clear-academic-subjects-filters"${disabled}>Clear</button>
            </div>
        `;
    }

    function renderEnrolledSubjectRow(record, item) {
        const actions = [
            `<button class="lux-secondary-btn" type="button" data-student-action="mark-subject-complete" data-staff-id="${escapeHtml(record.id)}" data-subject-id="${escapeHtml(item.courseId)}"><i class="fas fa-check"></i> Complete</button>`,
            `<button class="lux-secondary-btn lux-danger-btn" type="button" data-student-action="remove-subject" data-staff-id="${escapeHtml(record.id)}" data-subject-id="${escapeHtml(item.courseId)}"><i class="fas fa-minus"></i> Remove</button>`
        ].join('');
        return `
            <tr>
                <td><strong>${escapeHtml(item.name)}</strong><div class="students-hub-meta">${escapeHtml(item.courseId)}</div></td>
                <td>${escapeHtml(String(item.ects || 0))}</td>
                <td>${escapeHtml(renderSubjectGradeCopy(item))}</td>
                <td>${escapeHtml(renderSubjectGroupCopy(item))}</td>
                <td>${escapeHtml(renderSubjectScheduleCopy(item))}</td>
                <td>${escapeHtml(renderSubjectRoomCopy(item))}</td>
                <td>${escapeHtml(renderSubjectProfCopy(item))}</td>
                <td><div class="students-hub-inline-actions">${actions}</div></td>
            </tr>
        `;
    }

    function renderCompletedSubjectRow(item, semesterLabel) {
        return `
            <tr>
                <td><strong>${escapeHtml(item.name)}</strong><div class="students-hub-meta">${escapeHtml(item.courseId)}</div></td>
                <td>${escapeHtml(String(item.ects || 0))}</td>
                <td>${escapeHtml(renderSubjectGradeCopy(item))}</td>
                <td>${escapeHtml(semesterLabel)}</td>
                <td>${item.gradeScore != null && item.gradeScore > 0 ? 'Gradebook' : 'Manual / plan'}</td>
            </tr>
        `;
    }

    function renderFailedSubjectRow(item, renderStatusChip) {
        return `
            <tr>
                <td><strong>${escapeHtml(item.name)}</strong><div class="students-hub-meta">${escapeHtml(item.courseId)}</div></td>
                <td>${escapeHtml(String(item.ects || 0))}</td>
                <td>${escapeHtml(renderSubjectGradeCopy(item))}</td>
                <td>${escapeHtml(item.gradeLetter || 'F')}</td>
                <td>${renderStatusChip('Failed', 'is-danger')}</td>
                <td>${escapeHtml(item.gradeSource === 'gradebook' ? 'Gradebook' : 'Schedule')}</td>
            </tr>
        `;
    }

    function renderPlannedSubjectRow(record, item, renderStatusChip) {
        return `
            <tr>
                <td><strong>${escapeHtml(item.name)}</strong><div class="students-hub-meta">${escapeHtml(item.courseId)}</div></td>
                <td>${escapeHtml(String(item.ects || 0))}</td>
                <td>${renderStatusChip('Planned', '')}</td>
                <td>
                    <button class="lux-secondary-btn" type="button" data-student-action="add-subject" data-staff-id="${escapeHtml(record.id)}" data-subject-id="${escapeHtml(item.courseId)}"><i class="fas fa-plus"></i> Enroll</button>
                </td>
            </tr>
        `;
    }

    function buildAcademicSubjectLists(record) {
        const snapshot = loadStudentAcademicSnapshot(record);
        return {
            snapshot,
            lists: {
                enrolled: { items: snapshot.subjectsByStatus.enrolled, count: snapshot.enrolledCount },
                completed: { items: snapshot.subjectsByStatus.completed, count: snapshot.completedCount },
                failed: { items: snapshot.subjectsByStatus.failed, count: snapshot.failedCount || 0 },
                planned: { items: snapshot.subjectsByStatus.planned, count: snapshot.plannedCount }
            }
        };
    }

    function renderAcademicSubjectRowsForList(record, listKey, items, helpers = {}) {
        const renderStatusChip = typeof helpers.renderStatusChip === 'function'
            ? helpers.renderStatusChip
            : (value, tone) => `<span class="students-hub-chip lux-status-pill ${tone || ''}">${escapeHtml(value)}</span>`;
        const snapshot = loadStudentAcademicSnapshot(record);
        const semesterLabel = normalizeText(record?.semester || snapshot.performance?.primary || '—', '—');
        if (listKey === 'enrolled') return items.map((item) => renderEnrolledSubjectRow(record, item)).join('');
        if (listKey === 'completed') return items.map((item) => renderCompletedSubjectRow(item, semesterLabel)).join('');
        if (listKey === 'failed') return items.map((item) => renderFailedSubjectRow(item, renderStatusChip)).join('');
        if (listKey === 'planned') return items.map((item) => renderPlannedSubjectRow(record, item, renderStatusChip)).join('');
        return '';
    }

    function renderAcademicSubjectsModalContent(record, listKey, helpers = {}, filters = {}) {
        const meta = ACADEMIC_SUBJECT_LISTS[listKey];
        if (!meta) return null;
        const { lists } = buildAcademicSubjectLists(record);
        const list = lists[listKey];
        const totalCount = list.count;
        const { items: filteredItems, query, sort } = filterAndSortAcademicSubjects(list.items, filters);
        const filteredCount = filteredItems.length;
        const hasQuery = Boolean(query);
        const isEmpty = totalCount === 0;
        const noMatches = !isEmpty && filteredCount === 0;
        const toolbarHtml = renderAcademicSubjectsToolbar({ query, sort }, { disabled: isEmpty });
        let contentHtml;
        if (isEmpty) {
            contentHtml = renderAcademicSubjectsEmptyState(listKey, meta.title, meta.emptyHint, meta.icon);
        } else if (noMatches) {
            contentHtml = renderAcademicSubjectsEmptyState(
                listKey,
                'No matching subjects',
                'No subjects match your filters.',
                'fa-filter'
            );
        } else {
            contentHtml = renderAcademicSubjectsTable(
                meta.tableHead,
                renderAcademicSubjectRowsForList(record, listKey, filteredItems, helpers)
            );
        }
        const countLabel = hasQuery ? `${filteredCount}/${totalCount}` : String(totalCount);
        return {
            listKey,
            title: meta.title,
            count: countLabel,
            totalCount,
            filteredCount,
            description: meta.description,
            icon: meta.icon,
            isEmpty,
            bodyHtml: `${toolbarHtml}${contentHtml}`
        };
    }

    function renderStudentAcademicProfile(record, helpers = {}) {
        const renderBlueprintSummary = typeof helpers.renderBlueprintSummary === 'function'
            ? helpers.renderBlueprintSummary
            : () => '';

        const { snapshot } = buildAcademicSubjectLists(record);

        const programLabel = normalizeText(record?.program || record?.department || '—', '—');
        const cohortLabel = normalizeText(record?.cohort || '—', '—');
        const semesterLabel = normalizeText(record?.semester || snapshot.performance?.primary || '—', '—');
        const facultyLabelCopy = facultyLabel(snapshot.preferredFaculty);

        return `
            <div class="students-hub-academic-stack">
                <section class="students-hub-form-section lux-data-card home-hover-chip students-hub-academic-overview">
                    <div class="students-hub-academic-overview-grid">
                        <div class="students-hub-academic-overview-meta">
                            <div><span>Program</span><strong>${escapeHtml(programLabel)}</strong></div>
                            <div><span>Faculty</span><strong>${escapeHtml(facultyLabelCopy)}</strong></div>
                            <div><span>Semester</span><strong>${escapeHtml(semesterLabel)}</strong></div>
                            <div><span>Cohort</span><strong>${escapeHtml(cohortLabel)}</strong></div>
                        </div>
                        <div class="students-hub-academic-overview-scores">
                            <div><span>Official GPA</span><strong>${escapeHtml(snapshot.performance.secondary)}</strong></div>
                            <div><span>Average grade</span><strong>${escapeHtml(snapshot.averageGradeLabel)}</strong></div>
                        </div>
                    </div>
                    <div class="students-hub-academic-progress">
                        <div class="students-hub-academic-progress-head">
                            <strong>Credit progress</strong>
                            <span>${escapeHtml(String(snapshot.completedEcts))} / ${escapeHtml(String(snapshot.programRequiredEcts))} ECTS · ${escapeHtml(String(snapshot.remainingEcts))} left</span>
                        </div>
                        <div class="students-hub-progress-track students-hub-academic-progress-track">
                            <span class="students-hub-progress-fill" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${escapeHtml(String(snapshot.progressPercent))}" style="--students-hub-progress:${escapeHtml(String(snapshot.progressPercent))}%;"></span>
                        </div>
                        <div class="students-hub-academic-progress-stats">
                            <span>${escapeHtml(String(snapshot.completedEcts))} completed</span>
                            <span>${escapeHtml(String(snapshot.enrolledEcts))} enrolled</span>
                            <span>${escapeHtml(String(snapshot.failedCount || 0))} failed</span>
                            <span>${escapeHtml(String(snapshot.plannedCount))} planned</span>
                            <span>Synced ${escapeHtml(snapshot.lastSyncedLabel)}</span>
                        </div>
                    </div>
                </section>

                <section class="students-hub-form-section lux-data-card students-hub-academic-schedule-card is-embed-compact">
                    <div id="student-academic-schedule-controls"
                         class="students-hub-academic-schedule-controls"
                         data-schedule-surface-scope="student-admin"
                         data-schedule-student-id="${escapeHtml(record.id)}"></div>
                    <div id="student-academic-schedule-canvas" class="students-hub-academic-schedule-canvas schedule-surface-host" data-lux-transparency-exempt="1"></div>
                </section>

                ${renderAcademicSubjectSection(
                    'enrolled',
                    ACADEMIC_SUBJECT_LISTS.enrolled.title,
                    snapshot.enrolledCount,
                    ACADEMIC_SUBJECT_LISTS.enrolled.description
                )}

                ${renderAcademicSubjectSection(
                    'completed',
                    ACADEMIC_SUBJECT_LISTS.completed.title,
                    snapshot.completedCount,
                    ACADEMIC_SUBJECT_LISTS.completed.description
                )}

                ${renderAcademicSubjectSection(
                    'failed',
                    ACADEMIC_SUBJECT_LISTS.failed.title,
                    snapshot.failedCount || 0,
                    ACADEMIC_SUBJECT_LISTS.failed.description
                )}

                ${renderAcademicSubjectSection(
                    'planned',
                    ACADEMIC_SUBJECT_LISTS.planned.title,
                    snapshot.plannedCount,
                    ACADEMIC_SUBJECT_LISTS.planned.description
                )}

                <details class="students-hub-academic-blueprint">
                    <summary>Program summary (blueprint fields)</summary>
                    <section class="students-hub-form-section lux-data-card students-hub-academic-blueprint-body">
                        ${renderBlueprintSummary()}
                    </section>
                </details>
            </div>
        `;
    }

    function renderStudentProfileMetrics(record, helpers = {}) {
        const renderStatusChip = typeof helpers.renderStatusChip === 'function'
            ? helpers.renderStatusChip
            : (value, tone) => `<span class="students-hub-chip lux-status-pill ${tone || ''}">${escapeHtml(value)}</span>`;
        const snapshot = loadStudentAcademicSnapshot(record);
        const mobilityLabel = normalizeText(record?.mobilityLabel || 'Standard enrollment', 'Standard enrollment');
        const holdTone = snapshot.signals?.holdTone === 'danger'
            ? 'is-danger'
            : snapshot.signals?.holdTone === 'warning'
                ? 'is-warning'
                : 'is-success';
        return `
            <div class="students-hub-profile-metrics">
                <article class="students-hub-profile-metric lux-data-card home-hover-chip">
                    <span>GPA</span>
                    <strong>${escapeHtml(snapshot.performance.secondary)}</strong>
                </article>
                <article class="students-hub-profile-metric lux-data-card home-hover-chip">
                    <span>ECTS</span>
                    <strong>${escapeHtml(String(snapshot.completedEcts))} done</strong>
                    <small>${escapeHtml(String(snapshot.enrolledEcts))} enrolled</small>
                </article>
                <article class="students-hub-profile-metric lux-data-card home-hover-chip">
                    <span>Subjects</span>
                    <strong>${escapeHtml(String(snapshot.subjectCount))}</strong>
                </article>
                <article class="students-hub-profile-metric lux-data-card home-hover-chip">
                    <span>Mobility</span>
                    <div class="students-hub-profile-metric-chips">
                        ${renderStatusChip(mobilityLabel)}
                        ${renderStatusChip(snapshot.signals?.holdLabel || 'Clear', holdTone)}
                    </div>
                </article>
            </div>
        `;
    }

    function renderPersonalDataSubjectsSection(user, record = {}) {
        const root = document.getElementById('personal-data-subjects-root');
        if (!root) return;
        const snapshot = loadStudentAcademicSnapshot({
            ...record,
            id: record?.id || user?.id,
            facultyCode: record?.facultyCode || user?.facultyCode || user?.faculty || (typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON'),
            gpa: record?.gpa ?? user?.gpa,
            semester: record?.semester ?? user?.semester
        });
        // ponytail: semester/year + TA aren't in the data model yet — render em-dash until backend supplies them.
        const cleanValue = (value) => {
            const text = normalizeText(value, '').trim();
            return text && text.toUpperCase() !== 'TBD' ? text : '';
        };
        const yearSemCopy = (item) => {
            const year = cleanValue(item.year || item.academicYear);
            const sem = cleanValue(item.semester || item.term);
            const parts = [year && `Y${year}`, sem && `S${sem}`].filter(Boolean);
            return parts.length ? parts.join(' · ') : '—';
        };
        const staffCopy = (item) => {
            const prof = cleanValue(item.schedule && item.schedule.prof) || cleanValue(item.professor);
            const ta = cleanValue(item.schedule && item.schedule.ta) || cleanValue(item.ta);
            return `<div>Prof: ${escapeHtml(prof || '—')}</div><div class="personal-data-subjects-meta">TA: ${escapeHtml(ta || '—')}</div>`;
        };
        const scheduleCopy = (item) => {
            if (!item.schedule) return '—';
            const dayTime = `${normalizeText(item.schedule.day, 'TBD')} ${normalizeText(item.schedule.time, '')}`.trim();
            const room = cleanValue(item.schedule.room);
            return room ? `${escapeHtml(dayTime)}<div class="personal-data-subjects-meta">${escapeHtml(room)}</div>` : escapeHtml(dayTime);
        };
        const gradeCopy = (item) => (item.gradeScore != null && item.gradeScore > 0 ? `${Math.round(item.gradeScore)}%` : '—');
        const subjectCourseIdLabel = (item) => {
            if (typeof window.formatStudyCardCourseIdLabel === 'function') {
                return window.formatStudyCardCourseIdLabel(item.courseId, item);
            }
            const label = normalizeText(item.courseId, '');
            return label && label !== '0' ? label : normalizeText(item.name, '-');
        };
        const subjectTitleCell = (item, metaExtra = '') => `
            <div class="lux-card-title">${escapeHtml(item.name)}</div>
            <div class="personal-data-subjects-meta">${escapeHtml(subjectCourseIdLabel(item))}${metaExtra}</div>
        `;

        const currentSubjects = snapshot.subjects.filter((item) => item.status === 'enrolled' || item.status === 'planned');
        const failedSubjects = snapshot.subjectsByStatus ? snapshot.subjectsByStatus.failed : snapshot.subjects.filter((item) => item.status === 'failed');

        const currentRows = currentSubjects.length ? currentSubjects.map((item) => {
            const tone = subjectStatusTone(item.status);
            return `
                <tr>
                    <td>${subjectTitleCell(item, ` · ${escapeHtml(String(item.ects || 0))} ECTS`)}</td>
                    <td>${yearSemCopy(item)}</td>
                    <td>${staffCopy(item)}</td>
                    <td>${scheduleCopy(item)}</td>
                    <td><span class="lux-status-pill${tone ? ` ${tone}` : ''}">${escapeHtml(subjectStatusLabel(item.status))}</span></td>
                </tr>
            `;
        }).join('') : `
            <tr><td colspan="5" class="personal-data-subjects-empty">No subjects you are currently studying.</td></tr>
        `;

        const retakeBlock = failedSubjects.length ? `
            <div class="personal-data-subjects-summary personal-data-retake-head">
                <span class="is-danger">⚠ Needs retake</span>
                <span>${escapeHtml(String(failedSubjects.length))} to repeat</span>
            </div>
            <div class="personal-data-subjects-table-wrap home-hover-chip">
                <table class="personal-data-subjects-table">
                    <thead>
                        <tr>
                            <th class="lms-route-field-label">Subject</th>
                            <th class="lms-route-field-label">Grade</th>
                            <th class="lms-route-field-label">Failed on</th>
                            <th class="lms-route-field-label">Retake in</th>
                        </tr>
                    </thead>
                    <tbody>${failedSubjects.map((item) => `
                        <tr>
                            <td>${subjectTitleCell(item)}</td>
                            <td>${escapeHtml(gradeCopy(item))}</td>
                            <td>${yearSemCopy(item)}</td>
                            <td>Awaiting re-registration</td>
                        </tr>
                    `).join('')}</tbody>
                </table>
            </div>
            <p class="lux-card-copy personal-data-card-copy">Passed retakes drop off this list automatically once a passing grade is recorded.</p>
        ` : '';

        root.innerHTML = `
            <div class="personal-data-subjects-summary">
                <span>${escapeHtml(String(snapshot.completedCount))} completed</span>
                <span>${escapeHtml(String(snapshot.enrolledCount))} enrolled</span>
                <span>${escapeHtml(String(snapshot.completedEcts))} ECTS done</span>
            </div>
            <div class="personal-data-subjects-table-wrap home-hover-chip">
                <table class="personal-data-subjects-table">
                    <thead>
                        <tr>
                            <th class="lms-route-field-label">Subject</th>
                            <th class="lms-route-field-label">Year / Sem</th>
                            <th class="lms-route-field-label">Staff</th>
                            <th class="lms-route-field-label">Schedule</th>
                            <th class="lms-route-field-label">Status</th>
                        </tr>
                    </thead>
                    <tbody>${currentRows}</tbody>
                </table>
            </div>
            ${retakeBlock}
        `;
    }

    function toggleMobilityTransferPanel(category) {
        const isInternal = category === 'internal_transfer';
        document.querySelectorAll('[data-student-transfer-panel="internal"]').forEach((element) => {
            element.classList.toggle('is-hidden', !isInternal);
        });
        document.querySelectorAll('[data-student-action="execute-transfer"]').forEach((element) => {
            element.classList.toggle('is-hidden', !isInternal);
        });
    }

    window.loadStudentAcademicSnapshot = loadStudentAcademicSnapshot;
    window.hydrateStudentAcademicRecord = hydrateStudentAcademicRecord;
    window.touchStudentAcademicSync = touchStudentAcademicSync;
    window.applyApiEnrollmentsToStudentState = applyApiEnrollmentsToStudentState;
    window.renderPersonalDataSubjectsSection = renderPersonalDataSubjectsSection;
    window.toggleMobilityTransferPanel = toggleMobilityTransferPanel;
    window.renderStudentAcademicProfile = renderStudentAcademicProfile;
    window.renderAcademicSubjectsModalContent = renderAcademicSubjectsModalContent;
    window.renderStudentProfileMetrics = renderStudentProfileMetrics;
    window.addStudentEnrollmentSubject = addStudentEnrollmentSubject;
    window.removeStudentEnrollmentSubject = removeStudentEnrollmentSubject;
    window.markStudentSubjectComplete = markStudentSubjectComplete;
    window.updateStudentCurriculumPlan = updateStudentCurriculumPlan;
    window.executeInternalTransfer = executeInternalTransfer;
    window.listAvailableCurriculumCourses = listAvailableCurriculumCourses;
})();