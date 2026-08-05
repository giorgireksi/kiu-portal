/* Wave bag KiuApp */
window.KiuApp=window.KiuApp||{};const __kiuAppApi=window.KiuApp;window.__kiuAppApi=__kiuAppApi;
function __kiuAppExpose(map){Object.keys(map).forEach((k)=>{__kiuAppApi[k]=map[k];window[k]=map[k];});}

/* Compatibility-first runtime/bootstrap slice extracted from the legacy core.js bundle. Active routes now load split files directly. */

(function ensurePortalApiRuntimeAvailability() {
    const fallbackPromise = Promise.resolve(null);
    const noop = () => null;
    const asyncNoop = () => fallbackPromise;
    const asyncArray = () => Promise.resolve([]);
    const asyncNull = () => Promise.resolve(null);
    const portalUiNoop = () => null;
    portalUiNoop.__kiuFallback = true;

    function isFallbackPortalAction(fn) {
        return typeof fn === 'function' && fn.__kiuFallback === true;
    }

    function getFallbackNavigationRole() {
        try {
            const params = new URLSearchParams(window.location.search || '');
            const requested = String(params.get('view') || localStorage.getItem('currentUserRole') || '').trim().toLowerCase();
            return requested || 'student';
        } catch (error) {
            return 'student';
        }
    }

    function resolveFallbackPortalRouteUrl(pageId, role = getFallbackNavigationRole()) {
        const normalizedRole = String(role || 'student').trim().toLowerCase() || 'student';
        const normalizedPageId = String(pageId === 'profile' ? 'personal-data' : (pageId || 'home')).trim().toLowerCase() || 'home';
        if (normalizedPageId === 'profile-view' && typeof isAdminImpersonationMode === 'function' && isAdminImpersonationMode()) {
            return 'personal-data.html';
        }
        if (normalizedPageId === 'home') {
            return `index.html?view=${encodeURIComponent(normalizedRole)}#home`;
        }
        if (normalizedPageId === 'library' && normalizedRole === 'admin') return 'admin-library.html';
        if (normalizedPageId === 'orders' && normalizedRole === 'admin') return 'admin-orders.html';
        const routeMap = {
            'admin-tools': 'admin-tools.html',
            'admin-scheduler': 'admin-scheduler.html',
            'staff': 'staff.html',
            'students-admin': 'students-admin.html',
            'profile-view': 'profile-view.html',
            'social': 'social.html',
            'news': 'news.html',
            'exams': 'exams.html',
            'library': 'library.html',
            'orders': 'orders.html',
            'lms': 'lms.html',
            'programs': 'programs.html',
            'registration': 'registration.html',
            'study-card': 'study-card.html',
            'timetable': 'timetable.html',
            'gradebook': 'gradebook.html',
            'faculty-gradebook': 'faculty-gradebook.html',
            'faculty-schedule': 'faculty-schedule.html',
            'personal-data': 'personal-data.html',
            'student-service': 'student-service.html',
            'chancellery': 'chancellery.html',
            'calendar': 'calendar.html'
        };
        return routeMap[normalizedPageId] || `${normalizedPageId}.html`;
    }

    if (typeof window.resolvePortalRouteUrl !== 'function') {
        window.resolvePortalRouteUrl = resolveFallbackPortalRouteUrl;
    }

    function getFallbackRoutePageFromTrigger(trigger) {
        if (!trigger || typeof trigger.getAttribute !== 'function') return '';
        if (trigger.id === 'mob-act-profile') {
            return 'personal-data';
        }
        const explicitTarget = String(
            trigger.getAttribute('data-nav-target')
            || trigger.getAttribute('data-route-page')
            || trigger.getAttribute('data-registration-nav')
            || trigger.getAttribute('data-student-service-navigate')
            || ''
        ).trim();
        if (explicitTarget) return explicitTarget;
        if (trigger.hasAttribute('data-admin-focus')) return 'admin-tools';
        if (trigger.hasAttribute('data-nav-orders')) return 'orders';
        if (trigger.hasAttribute('data-nav-social')) return 'social';
        if (trigger.hasAttribute('data-nav-exams')) return 'exams';
        const onclick = String(trigger.getAttribute('onclick') || '');
        const match = onclick.match(/navigate\(['"]([^'"]+)['"]\)/);
        return match ? String(match[1] || '').trim() : '';
    }

    function performFallbackRouteNavigation(pageId) {
        const targetPage = String(pageId || '').trim();
        if (!targetPage) return false;
        if (typeof window.__kiuCoreNavigate === 'function') {
            window.__kiuCoreNavigate(targetPage);
            return true;
        }
        if (typeof window.navigate === 'function' && window.navigate.__kiuEarlyNavigateFallback !== true) {
            window.navigate(targetPage);
            return true;
        }
        const targetUrl = typeof window.resolvePortalRouteUrl === 'function'
            ? window.resolvePortalRouteUrl(targetPage, getFallbackNavigationRole())
            : resolveFallbackPortalRouteUrl(targetPage, getFallbackNavigationRole());
        window.location.assign(targetUrl);
        return true;
    }

    if (typeof window.navigate !== 'function') {
        const earlyNavigateFallback = function earlyNavigateFallback(pageId) {
            return performFallbackRouteNavigation(pageId);
        };
        earlyNavigateFallback.__kiuEarlyNavigateFallback = true;
        window.navigate = earlyNavigateFallback;
    }

    if (!window.__kiuRouteClickRescueInstalled) {
        document.addEventListener('click', function rescueRouteClick(event) {
            const target = event.target;
            const trigger = target && typeof target.closest === 'function'
                ? target.closest('#mob-act-profile,[data-nav-target],[data-route-page],[data-registration-nav],[data-student-service-navigate],[data-admin-focus],[data-nav-orders],[data-nav-social],[data-nav-exams],[onclick*="navigate("]')
                : null;
            if (!trigger) return;
            if (trigger.hasAttribute('disabled') || trigger.getAttribute('aria-disabled') === 'true') return;
            if (typeof event.button === 'number' && event.button !== 0) return;
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            const targetPage = getFallbackRoutePageFromTrigger(trigger);
            if (!targetPage) return;
            const beforeHref = window.location.href;
            const beforeNavigationIntent = Number(window.__kiuNavigationIntentSequence || 0);
            window.setTimeout(() => {
                if (window.location.href !== beforeHref) return;
                if (Number(window.__kiuNavigationIntentSequence || 0) !== beforeNavigationIntent) return;
                performFallbackRouteNavigation(targetPage);
            }, 0);
        }, true);
        window.__kiuRouteClickRescueInstalled = true;
    }

    // Wave 20: chrome/compat fallbacks live in portal-compat-runtime.js (load before app.js).
    if (typeof window.__kiuCreatePortalCompatApi === 'function' && !window.KiuPortalCompat) {
        window.__kiuCreatePortalCompatApi({});
    }


    // Wave 21: portal API stubs live in portal-api-stubs-runtime.js (load before app.js).
    if (typeof window.__kiuCreatePortalApiStubsApi === 'function' && !window.KiuPortalApiStubs) {
        window.__kiuCreatePortalApiStubsApi({});
    }

    function normalizePeopleFacultyFilter(facultyFilter = getCurrentFaculty()) {
        if (facultyFilter === 'all') return 'all';
        return normalizeFacultyCode(facultyFilter || getCurrentFaculty() || 'ECON', 'ECON');
    }

    function isEvenSemester() {
        const configuredSemester = parseInt(KIU_STATE?.activeSemester ?? KIU_EMPTY_STATE?.activeSemester, 10);
        if (Number.isFinite(configuredSemester) && configuredSemester > 0) {
            return configuredSemester % 2 === 0;
        }
        const now = new Date();
        const month = now.getMonth() + 1;
        return month >= 2 && month <= 7;
    }

    function calculateStudentSemester(course) {
        if (!course) return null;
        return course * 2 - (isEvenSemester() ? 0 : 1);
    }

    function getAllStaff(type = 'professors', facultyFilter = getCurrentFaculty()) {
        const facultyProfiles = (typeof KIU_STATE !== 'undefined' && KIU_STATE.facultyProfiles)
            || (typeof KIU_EMPTY_STATE !== 'undefined' && KIU_EMPTY_STATE.facultyProfiles)
            || {};
        const normalizedFilter = normalizePeopleFacultyFilter(facultyFilter);
        const result = [];
        Object.keys(facultyProfiles).forEach((fac) => {
            const normalizedFaculty = normalizeFacultyCode(fac, fac);
            if (normalizedFilter !== 'all' && normalizedFaculty !== normalizedFilter) return;
            const members = facultyProfiles[fac]?.[type] || [];
            members.forEach((member) => {
                result.push({
                    ...member,
                    facultyCode: normalizedFaculty,
                    faculty: normalizedFaculty,
                    facultyName: facultyProfiles[fac]?.name || fac
                });
            });
        });
        return result;
    }

    function getAllStudents(facultyFilter = getCurrentFaculty()) {
        const facultyProfiles = (typeof KIU_STATE !== 'undefined' && KIU_STATE.facultyProfiles)
            || (typeof KIU_EMPTY_STATE !== 'undefined' && KIU_EMPTY_STATE.facultyProfiles)
            || {};
        const normalizedFilter = normalizePeopleFacultyFilter(facultyFilter);
        const result = [];
        Object.keys(facultyProfiles).forEach((fac) => {
            const normalizedFaculty = normalizeFacultyCode(fac, fac);
            if (normalizedFilter !== 'all' && normalizedFaculty !== normalizedFilter) return;
            (facultyProfiles[fac]?.students || []).forEach((student) => {
                const course = student.course || Math.ceil((student.semester || 1) / 2);
                const explicitSemester = parseInt(student.semester, 10);
                result.push({
                    ...student,
                    course,
                    semester: Number.isFinite(explicitSemester) && explicitSemester > 0
                        ? explicitSemester
                        : calculateStudentSemester(course),
                    facultyCode: normalizedFaculty,
                    faculty: normalizedFaculty,
                    facultyName: facultyProfiles[fac]?.name || fac
                });
            });
        });
        return result;
    }

    if (typeof window.normalizePeopleFacultyFilter !== 'function') {
        __kiuAppExpose({
            normalizePeopleFacultyFilter,
        });
    }
    if (typeof window.isEvenSemester !== 'function') {
        __kiuAppExpose({
            isEvenSemester,
        });
    }
    if (typeof window.calculateStudentSemester !== 'function') {
        __kiuAppExpose({
            calculateStudentSemester,
        });
    }
    if (typeof window.getAllStaff !== 'function') {
        __kiuAppExpose({
            getAllStaff,
        });
    }
    if (typeof window.getAllStudents !== 'function') {
        __kiuAppExpose({
            getAllStudents,
        });
    }
    function normalizeGradebookGroupIdentifier(value) {
        return String(value || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '');
    }

    function normalizeGradebookRosterKey(value) {
        return normalizeGradebookGroupIdentifier(value);
    }

    if (typeof window.getEnrolledStudentsForGroup !== 'function') {
        window.getEnrolledStudentsForGroup = function getEnrolledStudentsForGroup(courseId, groupId) {
            const domain = getDomain();
            const students = [];
            const seen = new Set();
            const normalizedCourseId = canonicalCourseKey(courseId);
            const normalizedGroupId = canonicalCourseKey(groupId);
            const targetGroup = (typeof getAvailableGroupsForSubject === 'function' ? getAvailableGroupsForSubject(courseId) : (KIU_STATE.availableGroups?.[courseId] || []))
                .find(group => canonicalCourseKey(group?.id || group?.groupId || group?.name || '') === normalizedGroupId);
            const targetFaculty = normalizeFacultyCode(targetGroup?.faculty || (typeof deriveFacultyFromSubjectId === 'function' ? deriveFacultyFromSubjectId(courseId) : '') || '', '');
            Object.entries(KIU_STATE.studentSchedulesByStudent || {}).forEach(([studentId, schedule]) => {
                const scheduleEntries = Array.isArray(schedule)
                    ? schedule
                    : (schedule && typeof schedule === 'object')
                        ? Object.entries(schedule).map(([scheduledCourseId, scheduledGroupId]) => ({
                            courseId: scheduledCourseId,
                            groupId: scheduledGroupId
                        }))
                        : [];
                const isEnrolled = scheduleEntries.some(item => (
                    canonicalCourseKey(item?.courseId || item?.sourceCourseId || '') === normalizedCourseId
                    && canonicalCourseKey(item?.groupId || item?.groupName || '') === normalizedGroupId
                    && (!targetFaculty || normalizeFacultyCode(item?.faculty || targetFaculty, targetFaculty) === targetFaculty)
                ));
                if (!isEnrolled || seen.has(studentId)) return;
                const student = domain.usersById?.[studentId] || getAllStudents(targetFaculty || 'all').find(item => item.id === studentId);
                if (targetFaculty && normalizeFacultyCode(student?.facultyCode || student?.faculty || '', '') !== targetFaculty) return;
                students.push({
                    id: studentId,
                    name: student?.name || student?.nameEn || `Student ${studentId}`
                });
                seen.add(studentId);
            });
            return students.sort((a, b) => String(a.name).localeCompare(String(b.name)));
        };
    }

    if (typeof window.syncAvailableGroupEnrollmentCounts !== 'function') {
        window.syncAvailableGroupEnrollmentCounts = function syncAvailableGroupEnrollmentCounts() {
            Object.entries(KIU_STATE.availableGroups || {}).forEach(([courseId, groups]) => {
                (groups || []).forEach(group => {
                    group.registered = getEnrolledStudentsForGroup(courseId, group.id).length;
                });
            });
        };
    }

    if (typeof window.resolveGradebookRosterKey !== 'function') {
        window.resolveGradebookRosterKey = function resolveGradebookRosterKey(courseId, groupId, enrolledStudents = []) {
            const keys = Object.keys(KIU_STATE.studentGrades || {});
            const subject = getDomain().subjectsById?.[courseId] || KIU_STATE.curriculum.find(item => item.id === courseId);
            const rawCourseId = String(courseId || '').trim();
            const rawGroupId = String(groupId || '').trim();
            const groupNorm = normalizeGradebookGroupIdentifier(groupId);
            const courseNorm = normalizeGradebookGroupIdentifier(courseId);
            const subjectCodeNorm = normalizeGradebookGroupIdentifier(subject?.code || '');
            const firstSegmentNorm = normalizeGradebookGroupIdentifier(String(courseId || '').split('-')[0]);
            const exactCandidates = [
                `${rawCourseId}::${rawGroupId}`,
                `${courseNorm}::${groupNorm}`,
                `${subjectCodeNorm}::${groupNorm}`,
                `${firstSegmentNorm}::${groupNorm}`,
                `${rawCourseId}_${rawGroupId}`.toLowerCase(),
                `${courseNorm}_${groupNorm}`,
                `${subjectCodeNorm}_${groupNorm}`,
                `${firstSegmentNorm}_${groupNorm}`,
                rawCourseId,
                subject?.code || '',
                courseNorm,
                subjectCodeNorm,
                firstSegmentNorm
            ].filter(Boolean);
            const normalizedKeyMap = new Map();
            keys.forEach(key => {
                const normalizedKey = normalizeGradebookRosterKey(key);
                if (normalizedKey && !normalizedKeyMap.has(normalizedKey)) {
                    normalizedKeyMap.set(normalizedKey, key);
                }
            });

            for (const candidate of exactCandidates) {
                const resolvedKey = normalizedKeyMap.get(normalizeGradebookRosterKey(candidate));
                if (resolvedKey) return resolvedKey;
            }

            const enrolledIds = new Set((enrolledStudents || []).map(student => String(student?.id || '').trim()).filter(Boolean));
            let bestKey = null;
            let bestScore = -1;
            let bestRosterSize = -1;

            keys.forEach(key => {
                const roster = Array.isArray(KIU_STATE.studentGrades[key]) ? KIU_STATE.studentGrades[key] : [];
                const normalizedKey = normalizeGradebookRosterKey(key);
                let score = roster.length > 0 ? 1 : 0;
                if (groupNorm && normalizedKey.endsWith(groupNorm)) score += 2;
                if (courseNorm && normalizedKey === courseNorm) score += 4;
                if (subjectCodeNorm && normalizedKey === subjectCodeNorm) score += 4;
                if (firstSegmentNorm && normalizedKey === firstSegmentNorm) score += 2;
                if (courseNorm && groupNorm && normalizedKey === `${courseNorm}${groupNorm}`) score += 8;
                if (subjectCodeNorm && groupNorm && normalizedKey === `${subjectCodeNorm}${groupNorm}`) score += 8;
                if (firstSegmentNorm && groupNorm && normalizedKey === `${firstSegmentNorm}${groupNorm}`) score += 8;
                roster.forEach(student => {
                    if (enrolledIds.has(String(student?.id || '').trim())) score += 4;
                });
                if (score > bestScore || (score === bestScore && roster.length > bestRosterSize)) {
                    bestScore = score;
                    bestRosterSize = roster.length;
                    bestKey = key;
                }
            });

            return bestKey || exactCandidates[0] || `${courseNorm || 'course'}_${groupNorm || 'group'}`;
        };
    }

    if (typeof window.buildGradebookStudents !== 'function') {
        window.buildGradebookStudents = function buildGradebookStudents(courseId, groupId) {
            const enrolledStudents = getEnrolledStudentsForGroup(courseId, groupId);
            const rosterKey = resolveGradebookRosterKey(courseId, groupId, enrolledStudents);
            const existingRoster = JSON.parse(JSON.stringify(KIU_STATE.studentGrades?.[rosterKey] || []))
                .map(student => ensureGradeRecordHistories(student));

            if (!enrolledStudents.length) {
                return {
                    rosterKey,
                    students: existingRoster
                };
            }

            const mergedStudents = enrolledStudents.map(student => {
                const existing = existingRoster.find(entry => entry.id === student.id) || {};
                return ensureGradeRecordHistories({
                    id: student.id,
                    name: existing.name || student.name,
                    q1: existing.q1 || 0,
                    qa: existing.qa || 0,
                    mid: existing.mid || 0,
                    final: existing.final || 0,
                    assessments: existing.assessments || {}
                });
            });

            return {
                rosterKey,
                students: mergedStudents
            };
        };
    }

    if (typeof window.getGradebookGroupsForCurrentUser !== 'function') {
        window.getGradebookGroupsForCurrentUser = function getGradebookGroupsForCurrentUser(filterOverrides = null) {
            const currentUser = getCurrentUser();
            const currentFaculty = getCurrentFaculty();
            const currentIdentityKeys = (() => {
                if (typeof getUserNameVariants === 'function') {
                    return getUserNameVariants(currentUser);
                }
                const fallback = new Set();
                [currentUser?.name, currentUser?.nameEn, currentUser?.email].forEach(value => {
                    const normalized = typeof normalizePersonNameKey === 'function'
                        ? normalizePersonNameKey(value)
                        : String(value || '').trim().toLowerCase();
                    if (normalized) fallback.add(normalized);
                });
                return fallback;
            })();
            const semesterFilter = String(
                filterOverrides?.semester ?? document.getElementById('fs-filter-sem')?.value ?? ''
            ).trim();
            const facultyFilter = String(
                filterOverrides?.faculty ?? document.getElementById('fs-filter-fac')?.value ?? currentFaculty ?? ''
            ).trim();
            const groups = [];

            Object.entries(KIU_STATE.availableGroups || {}).forEach(([courseId, courseGroups]) => {
                (courseGroups || []).forEach(group => {
                    if (semesterFilter && semesterFilter !== 'all' && String(group?.semester || KIU_STATE.activeSemester || '').trim() !== semesterFilter) return;
                    if (facultyFilter && facultyFilter !== 'all' && String(group?.faculty || '').trim()) {
                        const groupFaculty = typeof normalizeFacultyCode === 'function'
                            ? normalizeFacultyCode(group.faculty, '')
                            : String(group.faculty || '').trim().toUpperCase();
                        const selectedFaculty = typeof normalizeFacultyCode === 'function'
                            ? normalizeFacultyCode(facultyFilter, '')
                            : String(facultyFilter || '').trim().toUpperCase();
                        if (groupFaculty && selectedFaculty && groupFaculty !== selectedFaculty) return;
                    }
                    const isAssigned = currentUser?.role === USER_ROLES.ADMIN
                        ? (() => {
                            if (!currentFaculty || currentFaculty === 'all') return true;
                            const groupFaculty = typeof normalizeFacultyCode === 'function'
                                ? normalizeFacultyCode(group.faculty, '')
                                : String(group.faculty || '').trim().toUpperCase();
                            const selectedFaculty = typeof normalizeFacultyCode === 'function'
                                ? normalizeFacultyCode(currentFaculty, '')
                                : String(currentFaculty || '').trim().toUpperCase();
                            return !selectedFaculty || groupFaculty === selectedFaculty;
                        })()
                        : (() => {
                            const profKey = typeof normalizePersonNameKey === 'function'
                                ? normalizePersonNameKey(group.prof)
                                : String(group.prof || '').trim().toLowerCase();
                            const taKey = typeof normalizePersonNameKey === 'function'
                                ? normalizePersonNameKey(group.ta)
                                : String(group.ta || '').trim().toLowerCase();
                            return currentIdentityKeys.has(profKey) || currentIdentityKeys.has(taKey);
                        })();
                    if (!isAssigned) return;

                    const subject = getDomain().subjectsById?.[courseId] || KIU_STATE.curriculum.find(item => item.id === courseId);
                    const enrolledStudents = getEnrolledStudentsForGroup(courseId, group.id);
                    groups.push({
                        courseId,
                        groupId: group.id,
                        groupName: group.name || group.id,
                        subjectName: subject?.name || courseId,
                        icon: subject?.icon || 'fas fa-book',
                        day: group.day,
                        time: group.time,
                        duration: group.duration,
                        room: group.room,
                        semester: group.semester,
                        capacity: group.capacity || 40,
                        enrolledCount: enrolledStudents.length || group.registered || 0
                    });
                });
            });

            return groups.sort((a, b) => String(a.subjectName).localeCompare(String(b.subjectName)) || String(a.groupName).localeCompare(String(b.groupName)));
        };
    }
    if (typeof window.resolveCanonicalLmsResourceKey !== 'function') {
        window.resolveCanonicalLmsResourceKey = function resolveCanonicalLmsResourceKey(resourceKey) {
            return String(resourceKey || '').trim();
        };
    }
    if (typeof window.normalizeLmsQuizAssessmentType !== 'function') {
        window.normalizeLmsQuizAssessmentType = function normalizeLmsQuizAssessmentType(value = 'quiz') {
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
        };
    }
    if (typeof window.getLmsQuizById !== 'function') {
        window.getLmsQuizById = function getLmsQuizById(resourceKey, quizId) {
            const normalizedResourceKey = resolveCanonicalLmsResourceKey(resourceKey);
            const workspace = KIU_STATE?.lmsQuizBuilder?.[normalizedResourceKey];
            const quizzes = Array.isArray(workspace?.quizzes) ? workspace.quizzes : [];
            return quizzes.find(item => String(item?.id || '') === String(quizId || '')) || null;
        };
    }
    if (typeof window.getLmsQuizSubmission !== 'function') {
        window.getLmsQuizSubmission = function getLmsQuizSubmission(resourceKey, quizId, studentId) {
            const normalizedResourceKey = resolveCanonicalLmsResourceKey(resourceKey);
            const workspace = KIU_STATE?.lmsQuizBuilder?.[normalizedResourceKey];
            const quizStore = workspace?.submissions?.[quizId] || KIU_STATE?.groupQuizSubmissions?.[normalizedResourceKey]?.[quizId] || {};
            return quizStore?.[String(studentId || '')] || null;
        };
    }
    if (typeof window.resolveLmsQuizSourceFromAssessmentEntry !== 'function') {
        window.resolveLmsQuizSourceFromAssessmentEntry = function resolveLmsQuizSourceFromAssessmentEntry(entry = {}) {
            const resourceKey = resolveCanonicalLmsResourceKey(String(entry?.sourceResourceKey || '').trim());
            const quizId = String(entry?.sourceQuizId || '').trim();
            if (!resourceKey || !quizId) return null;
            const quiz = typeof getLmsQuizById === 'function' ? getLmsQuizById(resourceKey, quizId) : null;
            if (!quiz) return null;
            return { resourceKey, quizId, quiz };
        };
    }
    if (typeof window.getAssessmentEntryDisplayContext !== 'function') {
        window.getAssessmentEntryDisplayContext = function getAssessmentEntryDisplayContext(criterion, entry = {}) {
            const normalizedCriterion = typeof normalizeGradebookCriterion === 'function'
                ? normalizeGradebookCriterion(criterion)
                : String(criterion || 'quiz').trim().toLowerCase();
            const criterionMeta = typeof getGradebookCriterionMeta === 'function'
                ? getGradebookCriterionMeta(normalizedCriterion)
                : {
                    key: normalizedCriterion,
                    label: normalizedCriterion || 'Assessment',
                    pluralLabel: `${normalizedCriterion || 'Assessment'}s`
                };
            const entryNumber = typeof normalizeAssessmentNumber === 'function'
                ? normalizeAssessmentNumber(entry?.number, 1)
                : Math.max(1, parseInt(entry?.number, 10) || 1);
            const manualTitle = String(entry?.title || entry?.name || '').trim();
            const linked = typeof resolveLmsQuizSourceFromAssessmentEntry === 'function'
                ? resolveLmsQuizSourceFromAssessmentEntry(entry)
                : null;
            if (!linked?.quiz) {
                return {
                    title: manualTitle || `${criterionMeta.label} ${entryNumber}`,
                    subtitle: '',
                    criterionMeta,
                    entryNumber,
                    linked: null
                };
            }
            const context = typeof resolveActiveLmsQuizContext === 'function'
                ? (resolveActiveLmsQuizContext(linked.resourceKey) || {})
                : {};
            const quiz = linked.quiz;
            return {
                title: String(quiz.title || '').trim() || manualTitle || `${criterionMeta.label} ${entryNumber}`,
                subtitle: [
                    typeof getLmsQuizDisplayLabel === 'function' ? getLmsQuizDisplayLabel(quiz) : '',
                    quiz.weekLabel,
                    context.subject?.name,
                    context.group?.name
                ].filter(Boolean).join('  -  '),
                criterionMeta,
                entryNumber,
                linked
            };
        };
    }
    // getPublicSocialDisplayName fallback: portal-api-stubs-runtime.js
    if (typeof window.ensureSubjectSemesterParityHint !== 'function') {
        window.ensureSubjectSemesterParityHint = function ensureSubjectSemesterParityHintFallback() {
            if (typeof refreshSemesterDropdowns === 'function') refreshSemesterDropdowns();

            const hiddenSemesters = document.getElementById('new-subject-semesters');
            const hintAnchor = document.getElementById('new-subject-semester-parity-hint')
                || document.getElementById('new-subject-semester-picker')
                || hiddenSemesters;
            if (!hintAnchor) return;

            let hint = document.getElementById('new-subject-semester-parity-hint');
            if (!hint) {
                hint = document.createElement('div');
                hint.id = 'new-subject-semester-parity-hint';
                hint.className = 'registration-structured-help lux-admin-tools-parity-callout';
                hintAnchor.insertAdjacentElement('afterend', hint);
            } else {
                hint.classList.add('lux-admin-tools-parity-callout');
            }

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
            const readSemesters = () => {
                if (typeof window.getBuilderSubjectSemesters === 'function') {
                    return window.getBuilderSubjectSemesters();
                }
                if (!hiddenSemesters) return [1];
                try {
                    const parsed = JSON.parse(hiddenSemesters.value || '[1]');
                    return Array.isArray(parsed) ? parsed.filter((entry) => Number(entry) > 0) : [1];
                } catch (error) {
                    return [1];
                }
            };
            const describeParity = (semesters) => {
                if (typeof window.getSemesterParityDescriptionForSemesters === 'function') {
                    return window.getSemesterParityDescriptionForSemesters(semesters);
                }
                const sem = Number(semesters?.[0]);
                if (!Number.isFinite(sem) || sem <= 0) {
                    return 'Select a semester to see the availability rule.';
                }
                return sem % 2 === 1
                    ? `Semester ${sem} is odd. This subject is visible in odd semesters unless the override is enabled.`
                    : `Semester ${sem} is even. This subject is visible in even semesters unless the override is enabled.`;
            };
            const updateHint = () => {
                const extra = exceptionCheckbox instanceof HTMLInputElement && exceptionCheckbox.checked
                    ? ' Override enabled: students in both parity tracks can see this subject.'
                    : '';
                hint.textContent = `${describeParity(readSemesters())}${extra}`;
            };

            if (hiddenSemesters && !hiddenSemesters.dataset.parityHintBound) {
                hiddenSemesters.addEventListener('change', updateHint);
                hiddenSemesters.dataset.parityHintBound = '1';
            }
            if (exceptionCheckbox && !exceptionCheckbox.dataset.parityHintBound) {
                exceptionCheckbox.addEventListener('change', updateHint);
                exceptionCheckbox.dataset.parityHintBound = '1';
            }

            updateHint();
        };
    }
    if (typeof window.renderAdminQaTestingCard !== 'function') {
        window.renderAdminQaTestingCard = function renderAdminQaTestingCardFallback() {
            const existingCard = document.getElementById('admin-qa-test-card');
            if (existingCard) existingCard.remove();
        };
    }

    function normalizeRuntimeScriptKey(src) {
        const raw = String(src || '').trim();
        if (!raw) return '';
        try {
            const url = new URL(raw, window.location.href);
            return `${url.pathname.replace(/\\/g, '/').toLowerCase()}${url.search}`;
        } catch (error) {
            const [path, query = ''] = raw.split('?');
            return `${path.replace(/\\/g, '/').toLowerCase()}${query ? `?${query}` : ''}`;
        }
    }

    function normalizeRuntimeScriptPath(src) {
        const key = normalizeRuntimeScriptKey(src);
        const queryIndex = key.indexOf('?');
        return queryIndex >= 0 ? key.slice(0, queryIndex) : key;
    }

    function findExistingRuntimeScript(src) {
        const targetKey = normalizeRuntimeScriptKey(src);
        if (!targetKey) return null;
        return Array.from(document.scripts || []).find((script) => {
            const candidate = script.getAttribute('src') || script.src || '';
            return normalizeRuntimeScriptKey(candidate) === targetKey;
        }) || null;
    }

    function findRuntimeScriptByPath(src) {
        const normalizedPath = normalizeRuntimeScriptPath(src);
        if (!normalizedPath) return null;
        return Array.from(document.scripts || []).find((script) => {
            const candidate = script.getAttribute('src') || script.src || '';
            return normalizeRuntimeScriptPath(candidate) === normalizedPath;
        }) || null;
    }

    function removeRuntimeScriptsWithPath(pathname) {
        const normalizedPath = normalizeRuntimeScriptPath(pathname);
        if (!normalizedPath) return;
        Array.from(document.scripts || []).forEach((script) => {
            const candidate = script.getAttribute('src') || script.src || '';
            if (normalizeRuntimeScriptPath(candidate) === normalizedPath) {
                script.remove();
            }
        });
    }

    function hasRuntimeScriptAlreadyExecuted(script) {
        if (!script) return false;
        if (
            script.dataset.kiuLoaded === '1'
            || script.readyState === 'loaded'
            || script.readyState === 'complete'
        ) {
            return true;
        }
        const current = document.currentScript;
        if (current && current !== script) {
            try {
                if (script.compareDocumentPosition(current) & Node.DOCUMENT_POSITION_FOLLOWING) {
                    return true;
                }
            } catch (error) { }
        }
        return !current && document.readyState !== 'loading';
    }

    function loadRuntimeScriptOnce(entry) {
        const src = typeof entry === 'string' ? entry : entry?.src;
        const asModule = Boolean(typeof entry === 'object' && entry?.module);
        return new Promise((resolve, reject) => {
            const targetKey = normalizeRuntimeScriptKey(src);
            const existing = findExistingRuntimeScript(src) || findRuntimeScriptByPath(src);
            if (existing) {
                const markLoaded = () => {
                    existing.dataset.kiuLoaded = '1';
                    existing.dataset.kiuRuntimeVersion = targetKey;
                    resolve(true);
                };
                if (hasRuntimeScriptAlreadyExecuted(existing)) {
                    markLoaded();
                    return;
                }
                existing.addEventListener('load', markLoaded, { once: true });
                existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
                return;
            }

            removeRuntimeScriptsWithPath(src);

            const script = document.createElement('script');
            script.src = src;
            if (asModule) {
                script.type = 'module';
            } else {
                script.defer = true;
            }
            script.dataset.kiuRuntimeVersion = targetKey;
            script.onload = () => {
                script.dataset.kiuLoaded = '1';
                resolve(true);
            };
            script.onerror = () => reject(new Error(`Failed to load ${src}`));
            document.head.appendChild(script);
        });
    }

    const SOCIAL_RUNTIME_VERSION = '20260728-socshell14';
    const SOCIAL_RUNTIME_SCRIPT_GROUPS = [
        [
            'assets/js/shared/social-lite-project-runtime.js?v=20260719-socproj1',
            'assets/js/shared/social-lite-content-runtime.js?v=20260726-socfix38',
            'assets/js/shared/social-lite-invite-runtime.js?v=20260720-w18',
            'assets/js/shared/social-runtime-lite.js?v=flashoff1'
        ],
        [
            'assets/js/pages/social-mobile.js?v=20260624-event-edit2',
            'assets/js/shared/lux-scroll-rail.js?v=20260611-scrollrail1',
            'assets/js/pages/social-render-plan.js?v=20260726-socfix25',
            'assets/js/pages/social-ui-kernel.js?v=20260718-portlazy1'
        ],
        [
            { src: 'assets/js/pages/social-task-model.js?v=20260720-w23task1', module: true },
            'assets/js/pages/social-task-model-bridge.js?v=20260720-w23task1'
        ],
        [
            { src: 'assets/js/pages/social-form-model.js?v=20260720-w23form1', module: true },
            'assets/js/pages/social-form-model-bridge.js?v=20260720-w23form1'
        ],
        [
            'assets/js/pages/social-workspace-week-plan-model.js?v=20260719-wswplan1'
        ],
        [
            { src: 'assets/js/pages/social-workspace-risk-model.js?v=20260720-w20risk1', module: true },
            'assets/js/pages/social-workspace-risk-model-bridge.js?v=20260720-w20risk1'
        ],
        [
            { src: 'assets/js/pages/social-entity-model.js?v=20260719-entity2', module: true },
            'assets/js/pages/social-entity-model-bridge.js?v=20260719-entity2'
        ],
        [
            { src: 'assets/js/pages/social-panel-model.js?v=20260720-w24panel1', module: true },
            'assets/js/pages/social-panel-model-bridge.js?v=20260720-w24panel1'
        ],
        [
            { src: 'assets/js/pages/social-alerts-model.js?v=20260720-w24alerts1', module: true },
            'assets/js/pages/social-alerts-model-bridge.js?v=20260720-w24alerts1'
        ],
        [
            { src: 'assets/js/pages/social-profile-model.js?v=20260720-w25profile1', module: true },
            'assets/js/pages/social-profile-model-bridge.js?v=20260720-w25profile1'
        ],
        [
            'assets/js/pages/social-fingerprint-model.js?v=20260719-fp3',
            'assets/js/pages/social-chrome-model.js?v=20260719-chrome2',
            'assets/js/pages/social-workspace-stubs.js?v=20260719-wsstubs1'
        ],
        [
            'assets/js/pages/social-dialog-router.js?v=20260726-socfix25',
            `assets/js/pages/social-overlay-chrome.js?v=${SOCIAL_RUNTIME_VERSION}`,
            'assets/js/pages/social-shell-nav.js?v=20260726-socfix26',
            `assets/js/pages/social-page-events.js?v=${SOCIAL_RUNTIME_VERSION}`
        ],
        [
            'assets/js/pages/social-page-survey-runtime.js?v=20260726-socstack47',
            'assets/js/pages/social-page-feed-runtime.js?v=20260805-health-scroll2',
            'assets/js/pages/social-page-shell-runtime.js?v=20260726-socfix25',
            `assets/js/pages/social-page-interactions-runtime.js?v=${SOCIAL_RUNTIME_VERSION}`
        ],
        [
            `assets/js/pages/social-page-boot-runtime.js?v=${SOCIAL_RUNTIME_VERSION}`,
            'assets/js/pages/social-page.js?v=20260726-socstack57'
        ]
    ];
    let socialRuntimeLoadPromise = null;
    window.ensurePortalSocialRuntimeLoaded = function ensurePortalSocialRuntimeLoaded() {
        const needsRebuiltSocialPage = Boolean(document.getElementById('public-social-root'));
        const hasRebuiltSocialShell = needsRebuiltSocialPage
            && window.__KIU_SOCIAL_PAGE_REBUILT
            && window.__KIU_SOCIAL_MOBILE_SHELL_INIT;
        if (
            window.__KIU_SOCIAL_RUNTIME_LOADED
            || (
                window.__KIU_SOCIAL_RUNTIME_READY
                && typeof window.renderPublicSocialPage === 'function'
                && typeof window.openPortalDirectChat === 'function'
                && (!needsRebuiltSocialPage || window.__KIU_SOCIAL_PAGE_REBUILT)
            )
        ) {
            window.__KIU_SOCIAL_RUNTIME_LOADED = true;
            return Promise.resolve(true);
        }
        if (socialRuntimeLoadPromise) return socialRuntimeLoadPromise;
        const scriptGroups = hasRebuiltSocialShell
            ? [SOCIAL_RUNTIME_SCRIPT_GROUPS[0]]
            : SOCIAL_RUNTIME_SCRIPT_GROUPS;
        // Within a group, preserve array order (module leaf before classic bridge).
        // Promise.all raced bridges ahead of ESM evaluation and left window exports unset.
        socialRuntimeLoadPromise = scriptGroups
            .reduce(
                (chain, group) => chain.then(() => group.reduce(
                    (inner, entry) => inner.then(() => loadRuntimeScriptOnce(entry)),
                    Promise.resolve()
                )),
                Promise.resolve()
            )
            .then(() => {
                window.__KIU_SOCIAL_RUNTIME_LOADED = true;
                if (typeof window.hydratePortalSocialRuntime === 'function') {
                    return Promise.resolve(window.hydratePortalSocialRuntime()).then(() => true).catch(() => true);
                }
                return true;
            })
            .catch((error) => {
                console.warn('Could not lazy-load the social runtime.', error);
                socialRuntimeLoadPromise = null;
                return false;
        });
        return socialRuntimeLoadPromise;
    };

    const NEWS_RUNTIME_VERSION = '20260714-news-modules1';
    const NEWS_RUNTIME_SCRIPTS = [
        `assets/js/pages/news/news-runtime.js?v=${NEWS_RUNTIME_VERSION}`,
        `assets/js/pages/news/news-api.js?v=${NEWS_RUNTIME_VERSION}`,
        `assets/js/pages/news/news-replies.js?v=${NEWS_RUNTIME_VERSION}`,
        `assets/js/pages/news/news-feed-render.js?v=${NEWS_RUNTIME_VERSION}`,
        `assets/js/pages/news/news-publisher.js?v=${NEWS_RUNTIME_VERSION}`,
        `assets/js/pages/news/news-events.js?v=${NEWS_RUNTIME_VERSION}`,
        `assets/js/pages/news.js?v=${NEWS_RUNTIME_VERSION}`
    ];
    let newsRuntimeLoadPromise = null;
    window.ensurePortalNewsRuntimeLoaded = function ensurePortalNewsRuntimeLoaded() {
        if (typeof window.renderNewsWorkspace === 'function') {
            window.__KIU_NEWS_RUNTIME_LOADED = true;
            return Promise.resolve(true);
        }
        if (window.__KIU_NEWS_RUNTIME_LOADED) return Promise.resolve(true);
        if (newsRuntimeLoadPromise) return newsRuntimeLoadPromise;
        newsRuntimeLoadPromise = NEWS_RUNTIME_SCRIPTS
            .reduce((chain, src) => chain.then(() => loadRuntimeScriptOnce(src)), Promise.resolve())
            .then(() => {
                window.__KIU_NEWS_RUNTIME_LOADED = typeof window.renderNewsWorkspace === 'function';
                return window.__KIU_NEWS_RUNTIME_LOADED;
            })
            .catch((error) => {
                console.warn('Could not lazy-load the news runtime.', error);
                newsRuntimeLoadPromise = null;
                return false;
        });
        return newsRuntimeLoadPromise;
    };

    const ORDERS_RUNTIME_CORE_SCRIPT = 'assets/js/shared/orders-runtime-core.js?v=20260730-rolelink1';
    const ORDERS_RUNTIME_SCRIPTS = [
        ORDERS_RUNTIME_CORE_SCRIPT,
        'assets/js/shared/orders-inbox.js?v=20260730-rolelink1'
    ];
    const ADMIN_ORDERS_RUNTIME_SCRIPTS = [
        ORDERS_RUNTIME_CORE_SCRIPT,
        'assets/js/shared/orders-workspace.js?v=20260730-rolelink1'
    ];
    let ordersRuntimeLoadPromise = null;
    let adminOrdersRuntimeLoadPromise = null;
    window.ensurePortalOrdersRuntimeLoaded = function ensurePortalOrdersRuntimeLoaded() {
        if (typeof renderOrdersInboxPage === 'function') {
            window.__KIU_ORDERS_RUNTIME_LOADED = true;
            return Promise.resolve(true);
        }
        if (window.__KIU_ORDERS_RUNTIME_LOADED) return Promise.resolve(true);
        if (ordersRuntimeLoadPromise) return ordersRuntimeLoadPromise;
        ordersRuntimeLoadPromise = ORDERS_RUNTIME_SCRIPTS
            .reduce((chain, src) => chain.then(() => loadRuntimeScriptOnce(src)), Promise.resolve())
            .then(() => {
                window.__KIU_ORDERS_RUNTIME_LOADED = typeof renderOrdersInboxPage === 'function';
                return window.__KIU_ORDERS_RUNTIME_LOADED;
            })
            .catch((error) => {
                console.warn('Could not lazy-load the orders runtime.', error);
                ordersRuntimeLoadPromise = null;
                return false;
        });
        return ordersRuntimeLoadPromise;
    };
    window.ensurePortalAdminOrdersRuntimeLoaded = function ensurePortalAdminOrdersRuntimeLoaded() {
        if (typeof renderAdminOrders === 'function') {
            window.__KIU_ADMIN_ORDERS_RUNTIME_LOADED = true;
            return Promise.resolve(true);
        }
        if (window.__KIU_ADMIN_ORDERS_RUNTIME_LOADED) return Promise.resolve(true);
        if (adminOrdersRuntimeLoadPromise) return adminOrdersRuntimeLoadPromise;
        adminOrdersRuntimeLoadPromise = ADMIN_ORDERS_RUNTIME_SCRIPTS
            .reduce((chain, src) => chain.then(() => loadRuntimeScriptOnce(src)), Promise.resolve())
            .then(() => {
                window.__KIU_ADMIN_ORDERS_RUNTIME_LOADED = typeof renderAdminOrders === 'function';
                return window.__KIU_ADMIN_ORDERS_RUNTIME_LOADED;
            })
            .catch((error) => {
                console.warn('Could not lazy-load the admin orders runtime.', error);
                adminOrdersRuntimeLoadPromise = null;
                return false;
        });
        return adminOrdersRuntimeLoadPromise;
    };

    const LIBRARY_CATALOG_SYNC_SCRIPT = 'assets/js/shared/library-catalog-sync.js?v=20260714-libcleanup1';
    const LIBRARY_CATALOG_VIEW_SCRIPT = 'assets/js/shared/library-catalog-view.js?v=20260714-libcleanup1';
    const LIBRARY_RUNTIME_SCRIPT = 'assets/js/pages/library.js?v=20260714-libcleanup1';
    let libraryRuntimeLoadPromise = null;
    window.ensurePortalLibraryRuntimeLoaded = function ensurePortalLibraryRuntimeLoaded() {
        if (typeof window.renderLibraryPageShellContext === 'function') {
            window.__KIU_LIBRARY_RUNTIME_LOADED = true;
            return Promise.resolve(true);
        }
        if (window.__KIU_LIBRARY_RUNTIME_LOADED) return Promise.resolve(true);
        if (libraryRuntimeLoadPromise) return libraryRuntimeLoadPromise;
        libraryRuntimeLoadPromise = loadRuntimeScriptOnce(LIBRARY_CATALOG_SYNC_SCRIPT)
            .then(() => loadRuntimeScriptOnce(LIBRARY_CATALOG_VIEW_SCRIPT))
            .then(() => loadRuntimeScriptOnce(LIBRARY_RUNTIME_SCRIPT))
            .then(() => {
                window.__KIU_LIBRARY_RUNTIME_LOADED = typeof window.renderLibraryPageShellContext === 'function';
                return window.__KIU_LIBRARY_RUNTIME_LOADED;
            })
            .catch((error) => {
                console.warn('Could not lazy-load the library runtime.', error);
                libraryRuntimeLoadPromise = null;
                return false;
            });
        return libraryRuntimeLoadPromise;
    };

    const LMS_CLASSROOM_TABS_RUNTIME_SCRIPT = 'assets/js/pages/lms-classroom-tabs-runtime.js?v=20260715-lms-lazy7';
    const LMS_SECTION_QUIZ_RUNTIME_SCRIPT = 'assets/js/pages/lms-section-quiz-runtime.js?v=20260729-lmsgbshare5';
    const LMS_RUNTIME_SCRIPT = 'assets/js/pages/lms.js?v=20260714-lmspro2';
    let lmsRuntimeLoadPromise = null;
    window.ensurePortalLmsRuntimeLoaded = function ensurePortalLmsRuntimeLoaded() {
        if (typeof window.openLMSCourse === 'function' && typeof window.switchLMSTab === 'function') {
            window.__KIU_LMS_RUNTIME_LOADED = true;
            return Promise.resolve(true);
        }
        if (window.__KIU_LMS_RUNTIME_LOADED) return Promise.resolve(true);
        if (lmsRuntimeLoadPromise) return lmsRuntimeLoadPromise;
        lmsRuntimeLoadPromise = loadRuntimeScriptOnce(LMS_CLASSROOM_TABS_RUNTIME_SCRIPT)
            .then(() => loadRuntimeScriptOnce(LMS_SECTION_QUIZ_RUNTIME_SCRIPT))
            .then(() => loadRuntimeScriptOnce(LMS_RUNTIME_SCRIPT))
            .then(() => {
                window.__KIU_LMS_RUNTIME_LOADED = typeof window.openLMSCourse === 'function' && typeof window.switchLMSTab === 'function';
                return window.__KIU_LMS_RUNTIME_LOADED;
            })
            .catch((error) => {
                console.warn('Could not lazy-load the LMS runtime.', error);
                lmsRuntimeLoadPromise = null;
                return false;
            });
        return lmsRuntimeLoadPromise;
    };

    const REGISTRATION_PICKER_ASSET_TOKEN = '20260725-portalmodal1';
    const registrationRuntimeAsset = (path) => `${path}?v=${REGISTRATION_PICKER_ASSET_TOKEN}`;
    const REGISTRATION_RUNTIME_SCRIPTS = [
        registrationRuntimeAsset('assets/js/pages/registration-shared.js'),
        registrationRuntimeAsset('assets/js/pages/registration-enrollment.js'),
        { src: 'assets/js/shared/curriculum-library-model.js?v=20260720-e5clm1', module: true },
        'assets/js/shared/curriculum-library-model-bridge.js?v=20260720-e5clm1',
        'assets/js/pages/registration-semester-runtime.js?v=20260804-programsemesters1',
        'assets/js/pages/registration-curriculum-runtime.js?v=20260724-peelfix2',
        registrationRuntimeAsset('assets/js/pages/registration.js'),
        'assets/js/pages/curriculum-semester-picker.js?v=20260804-programsemesters1',
        'assets/js/pages/curriculum-library-scroll.js?v=20260606-scrollrail1',
        'assets/js/pages/student-registration-eligibility-runtime.js?v=20260725-portalmodal2',
        'assets/js/pages/student-registration-choice-runtime.js?v=20260727-peelfix2',
        'assets/js/pages/student-registration.js?v=20260727-peelfix2',
        'assets/js/pages/admin-registration-track.js?v=20260731-regmig1',
        'assets/js/pages/admin-registration-seats-runtime.js?v=20260719-regseats1',
        'assets/js/pages/admin-registration-cms-runtime.js?v=20260724-peelfix2',
        'assets/js/pages/admin-registration-boot-runtime.js?v=20260724-peelfix1',
        'assets/js/pages/admin-registration.js?v=20260725-portalmodal1'
    ];
    const REGISTRATION_STUDENT_ROUTE_RUNTIME_SCRIPTS = [
        registrationRuntimeAsset('assets/js/pages/timetable-runtime.js'),
        registrationRuntimeAsset('assets/js/pages/registration-shared.js'),
        registrationRuntimeAsset('assets/js/pages/registration-enrollment.js'),
        registrationRuntimeAsset('assets/js/pages/student-registration-eligibility-runtime.js'),
        'assets/js/pages/student-registration-choice-runtime.js?v=20260727-peelfix2',
        'assets/js/pages/student-registration.js?v=20260727-peelfix2',
        registrationRuntimeAsset('assets/js/pages/registration-student-route.js')
    ];
    let registrationRuntimeLoadPromise = null;
    function isStandaloneRegistrationRoute() {
        return Boolean(document.getElementById('page-registration') && document.body.classList.contains('lux-route-registration'));
    }
    function isRegistrationPickerRuntimeCurrent() {
        return window.REGISTRATION_PICKER_BUILD === REGISTRATION_PICKER_ASSET_TOKEN;
    }
    const REGISTRATION_STUDENT_STATIC_RUNTIME_PATHS = [
        'assets/js/pages/timetable-runtime.js',
        'assets/js/pages/registration-shared.js',
        'assets/js/pages/registration-enrollment.js',
        'assets/js/pages/student-registration-eligibility-runtime.js',
        'assets/js/pages/student-registration.js',
        'assets/js/pages/registration-student-route.js'
    ];
    function hasStandaloneRegistrationStaticBundle() {
        if (!isStandaloneRegistrationRoute()) return false;
        return REGISTRATION_STUDENT_STATIC_RUNTIME_PATHS.every((path) => {
            const script = findExistingRuntimeScript(registrationRuntimeAsset(path));
            return script && script.dataset.kiuStatic === '1';
        });
    }
    function waitForStandaloneRegistrationStaticBundle() {
        if (registrationRuntimeLoadPromise) return registrationRuntimeLoadPromise;
        registrationRuntimeLoadPromise = REGISTRATION_STUDENT_ROUTE_RUNTIME_SCRIPTS
            .reduce((chain, src) => chain.then(() => loadRuntimeScriptOnce(src)), Promise.resolve())
            .then(() => {
                window.__KIU_REGISTRATION_RUNTIME_LOADED = true;
                return true;
            })
            .catch((error) => {
                console.warn('Could not wait for the standalone registration runtime bundle.', error);
                registrationRuntimeLoadPromise = null;
                return false;
            });
        return registrationRuntimeLoadPromise;
    }

    window.ensurePortalRegistrationRuntimeLoaded = function ensurePortalRegistrationRuntimeLoaded() {
        const isStudentRoute = isStandaloneRegistrationRoute();
        if (isStudentRoute && typeof window.renderStudentRegStructures === 'function') {
            window.__KIU_REGISTRATION_RUNTIME_LOADED = true;
            return Promise.resolve(true);
        }
        if (isStudentRoute && (isRegistrationPickerRuntimeCurrent() || hasStandaloneRegistrationStaticBundle())) {
            return waitForStandaloneRegistrationStaticBundle();
        }
        if (isStudentRoute && !isRegistrationPickerRuntimeCurrent() && !hasStandaloneRegistrationStaticBundle()) {
            window.__KIU_REGISTRATION_RUNTIME_LOADED = false;
            registrationRuntimeLoadPromise = null;
            removeRuntimeScriptsWithPath(registrationRuntimeAsset('assets/js/pages/student-registration.js'));
            removeRuntimeScriptsWithPath(registrationRuntimeAsset('assets/js/pages/registration-enrollment.js'));
            removeRuntimeScriptsWithPath(registrationRuntimeAsset('assets/js/pages/registration-shared.js'));
            removeRuntimeScriptsWithPath(registrationRuntimeAsset('assets/js/pages/registration-student-route.js'));
            removeRuntimeScriptsWithPath(registrationRuntimeAsset('assets/js/pages/timetable-runtime.js'));
        }
        if (!isStudentRoute) {
            if (
                typeof window.renderCurriculumTable === 'function'
                && typeof window.bootAdminRegistrationCms === 'function'
                && typeof window.bindFacultyRegistrationCmsData === 'function'
            ) {
                window.__KIU_REGISTRATION_RUNTIME_LOADED = true;
                return Promise.resolve(true);
            }
        }
        if (window.__KIU_REGISTRATION_RUNTIME_LOADED && (!isStudentRoute || isRegistrationPickerRuntimeCurrent())) {
            return Promise.resolve(true);
        }
        if (window.__KIU_REGISTRATION_RUNTIME_LOADED) {
            window.__KIU_REGISTRATION_RUNTIME_LOADED = false;
            registrationRuntimeLoadPromise = null;
        }
        if (registrationRuntimeLoadPromise) return registrationRuntimeLoadPromise;
        const scriptsToLoad = isStudentRoute ? REGISTRATION_STUDENT_ROUTE_RUNTIME_SCRIPTS : REGISTRATION_RUNTIME_SCRIPTS;
        registrationRuntimeLoadPromise = scriptsToLoad
            .reduce((chain, src) => chain.then(() => loadRuntimeScriptOnce(src)), Promise.resolve())
            .then(() => {
                window.__KIU_REGISTRATION_RUNTIME_LOADED = true;
                return true;
            })
            .catch((error) => {
                console.warn('Could not lazy-load the registration runtime.', error);
                registrationRuntimeLoadPromise = null;
                return false;
            });
        return registrationRuntimeLoadPromise;
    };

    if (window.__KIU_API_RUNTIME_LOADED || window.__KIU_API_RUNTIME_REQUESTED) return;
    const currentScript = document.currentScript;
    if (!currentScript || !currentScript.src) return;
    const currentUrl = new URL(currentScript.src, window.location.href);
    const apiUrl = new URL('./api.js', currentUrl);
    apiUrl.search = currentUrl.search;
    const existingApiScript = Array.from(document.scripts || []).find((scriptEl) => {
        if (!scriptEl?.src) return false;
        try {
            const scriptUrl = new URL(scriptEl.src, window.location.href);
            return scriptUrl.pathname === apiUrl.pathname;
        } catch (error) {
            return false;
        }
    });
    if (existingApiScript) return;
    window.__KIU_API_RUNTIME_REQUESTED = true;

    const script = document.createElement('script');
    script.src = apiUrl.toString();
    script.async = false;
    script.onload = () => {
        window.__KIU_API_RUNTIME_REQUESTED = false;
    };
    script.onerror = () => {
        window.__KIU_API_RUNTIME_REQUESTED = false;
    };
    const insertionParent = currentScript.parentNode || document.head;
    if (currentScript.parentNode) {
        insertionParent.insertBefore(script, currentScript.nextSibling);
        return;
    }
    document.head.appendChild(script);
})();

const USER_ROLES = {
    STUDENT: 'student',
    PROFESSOR: 'professor',
    TA: 'ta',
    ADMIN: 'admin',
    STUDENT_SERVICE: 'student_service'
};

const ACTIVE_SESSION_KEY = 'KIU_ACTIVE_SESSION_USER_ID';
const ACTIVE_ROLE_IMPERSONATION_KEY = 'KIU_ACTIVE_ROLE_IMPERSONATION';
const PENDING_ROLE_SWITCH_KEY = 'KIU_PENDING_ROLE_SWITCH_ROLE';
const MANUAL_TESTING_STATE_VERSION = 8;
const REAL_TESTING_CLEANUP_FLAG = 'KIU_REAL_TESTING_CLEANUP_V8';
const TIMETABLE_WEEK_STORAGE_KEY = 'KIU_TIMETABLE_WEEK_START';
const PROFILE_CALENDAR_WEEK_STORAGE_KEY = 'KIU_PROFILE_CALENDAR_WEEK_START';
const SCHEDULER_WEEK_STORAGE_KEY = 'KIU_SCHEDULER_WEEK_START';
const PERMISSION_MATRIX = {
    [USER_ROLES.STUDENT]: ['portal.student', 'registration.manage', 'lms.view', 'library.view', 'orders.view'],
    [USER_ROLES.PROFESSOR]: ['portal.professor', 'gradebook.manage', 'attendance.manage', 'lms.manage', 'profile.view'],
    [USER_ROLES.TA]: ['portal.ta', 'attendance.manage', 'gradebook.view', 'lms.assist', 'profile.view'],
    [USER_ROLES.STUDENT_SERVICE]: ['portal.student_service', 'student-service.manage', 'knowledge.manage', 'library.view', 'orders.view'],
    [USER_ROLES.ADMIN]: ['*']
};

// Check if role is stored in localStorage
let currentUserRole = (() => {
    try {
        const storedRole = localStorage.getItem('currentUserRole');
        const pendingRole = localStorage.getItem(PENDING_ROLE_SWITCH_KEY);
        const rawAuthState = localStorage.getItem('KIU_AUTH_STATE');
        const authState = rawAuthState ? JSON.parse(rawAuthState) : null;
        const authenticatedRole = String(authState?.role || '').trim().toLowerCase();
        if (authenticatedRole && authenticatedRole !== USER_ROLES.ADMIN) {
            return authenticatedRole;
        }
        if (authenticatedRole === USER_ROLES.ADMIN && Object.values(USER_ROLES).includes(pendingRole) && pendingRole !== USER_ROLES.ADMIN) {
            return pendingRole;
        }
        return Object.values(USER_ROLES).includes(storedRole)
            ? storedRole
            : (authenticatedRole || USER_ROLES.STUDENT);
    } catch (e) {
        return USER_ROLES.STUDENT;
    }
})(); 
let currentUser = null;

function getAuthenticatedAccountRole() {
    const sessionRole = String(currentUser?.role || '').trim().toLowerCase();
    if (sessionRole) return sessionRole;
    try {
        const rawAuthState = localStorage.getItem('KIU_AUTH_STATE');
        const authState = rawAuthState ? JSON.parse(rawAuthState) : null;
        return String(authState?.role || '').trim().toLowerCase();
    } catch (error) {
        return '';
    }
}

function resolveStoredWorkspaceRole() {
    try {
        const viewRole = String(new URLSearchParams(window.location.search || '').get('view') || '').trim().toLowerCase();
        if (Object.values(USER_ROLES).includes(viewRole) && viewRole !== USER_ROLES.ADMIN) {
            return viewRole;
        }
    } catch (error) {}
    try {
        if (sessionStorage.getItem(ACTIVE_ROLE_IMPERSONATION_KEY) === '1') {
            const memoryRole = String(currentUserRole || '').trim().toLowerCase();
            if (Object.values(USER_ROLES).includes(memoryRole) && memoryRole !== USER_ROLES.ADMIN) {
                return memoryRole;
            }
        }
    } catch (error) {}
    try {
        const pendingRole = String(localStorage.getItem(PENDING_ROLE_SWITCH_KEY) || '').trim().toLowerCase();
        if (Object.values(USER_ROLES).includes(pendingRole) && pendingRole !== USER_ROLES.ADMIN) {
            return pendingRole;
        }
        const storedRole = String(localStorage.getItem('currentUserRole') || '').trim().toLowerCase();
        if (Object.values(USER_ROLES).includes(storedRole) && storedRole !== USER_ROLES.ADMIN) {
            return storedRole;
        }
    } catch (error) {}
    return '';
}

function isRoleImpersonationEnabled() {
    const authenticatedRole = getAuthenticatedAccountRole();
    if (authenticatedRole && authenticatedRole !== USER_ROLES.ADMIN) {
        return false;
    }
    try {
        if (sessionStorage.getItem(ACTIVE_ROLE_IMPERSONATION_KEY) === '1') return true;
    } catch (e) {
        // Ignore storage access issues and fall through to persisted role check.
    }
    const workspaceRole = resolveStoredWorkspaceRole();
    if (authenticatedRole === USER_ROLES.ADMIN && workspaceRole) {
        return true;
    }
    if (!authenticatedRole && workspaceRole) {
        return true;
    }
    return false;
}

function canonicalCourseKey(value) {
    return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function ensureArray(value) {
    if (Array.isArray(value)) return value;
    if (value == null) return [];
    return [value];
}

var normalizeFacultyCode = window.normalizeFacultyCode || function (value, fallback = 'ECON') {
    const normalizedFallback = String(fallback || 'ECON').trim().toUpperCase() || 'ECON';
    const raw = String(value || '').trim().toUpperCase();
    if (!raw) return normalizedFallback;

    const aliasMap = {
        ECON: 'ECON',
        MANAGEMENT: 'ECON',
        BUSINESS: 'ECON',
        CS: 'CS',
        COMPUTER_SCIENCE: 'CS',
        COMPUTERSCIENCE: 'CS',
        LAW: 'LAW',
        MED: 'MED',
        MEDICINE: 'MED',
        ARTS: 'ARTS',
        ARTS_HUMANITIES: 'ARTS',
        HUMANITIES: 'ARTS'
    };

    return aliasMap[raw] || raw;
};
__kiuAppExpose({
    normalizeFacultyCode,
});

if (typeof window.getCurrentFaculty !== 'function') {
    window.getCurrentFaculty = function getCurrentFaculty() {
        const stateUser = typeof getCurrentUserFromState === 'function' ? getCurrentUserFromState(typeof KIU_STATE !== 'undefined' ? KIU_STATE : null) : null;
        const authUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
        const activeUser = stateUser || authUser || currentUser || null;
        const selectedFaculty = (() => {
            try {
                return localStorage.getItem('currentFaculty') || localStorage.getItem('KIU_FACULTY_CONTEXT') || '';
            } catch (e) {
                return '';
            }
        })();
        const role = activeUser?.role || currentUserRole || USER_ROLES.STUDENT;

        if (role === USER_ROLES.ADMIN) {
            return normalizeFacultyCode(
                selectedFaculty || activeUser?.facultyCode || activeUser?.faculty || 'ECON',
                'ECON'
            );
        }

        return normalizeFacultyCode(
            activeUser?.facultyCode || activeUser?.faculty || selectedFaculty || 'ECON',
            'ECON'
        );
    };
}

if (typeof window.getFacultyProfile !== 'function') {
    window.getFacultyProfile = function getFacultyProfile(code) {
        const profiles = (typeof KIU_STATE !== 'undefined' && KIU_STATE?.facultyProfiles)
            || (typeof KIU_EMPTY_STATE !== 'undefined' && KIU_EMPTY_STATE?.facultyProfiles)
            || {};
        return profiles[normalizeFacultyCode(code, 'ECON')] || profiles.ECON || {};
    };
}

if (typeof window.getFacultyColor !== 'function') {
    window.getFacultyColor = function getFacultyColor(code) {
        const normalized = normalizeFacultyCode(code, 'ECON');
        const palette = { CS: '#5b21b6', ECON: '#a4262c', LAW: '#107c41', MED: '#065f46', ARTS: '#b45309' };
        return palette[normalized] || palette.ECON;
    };
}

if (typeof window.getFacultyLabel !== 'function') {
    window.getFacultyLabel = function getFacultyLabel(code) {
        const labels = {
            CS: 'Computer Science',
            ECON: 'Business Management',
            LAW: 'Law',
            MED: 'Medicine',
            ARTS: 'Arts & Humanities'
        };
        const normalized = normalizeFacultyCode(code, 'ECON');
        return labels[normalized] || normalized;
    };
}

var minutesToTimeString = window.minutesToTimeString || function (totalMinutes) {
    const safeMinutes = Number.isFinite(totalMinutes) ? totalMinutes : 0;
    const normalizedMinutes = ((Math.round(safeMinutes) % 1440) + 1440) % 1440;
    const hours = String(Math.floor(normalizedMinutes / 60)).padStart(2, '0');
    const minutes = String(normalizedMinutes % 60).padStart(2, '0');
    return `${hours}:${minutes}`;
};
__kiuAppExpose({
    minutesToTimeString,
});

var parseTimeString = window.parseTimeString || function (timeStr) {
    const raw = String(timeStr || '').trim();
    if (!raw) return NaN;

    const twelveHour = raw.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
    if (twelveHour) {
        let hours = parseInt(twelveHour[1], 10);
        const minutes = parseInt(twelveHour[2], 10);
        if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return NaN;
        const meridiem = twelveHour[3].toUpperCase();
        if (meridiem === 'PM' && hours < 12) hours += 12;
        if (meridiem === 'AM' && hours === 12) hours = 0;
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
};
__kiuAppExpose({
    parseTimeString,
});

var normalizeTimeString = window.normalizeTimeString || function (timeStr, fallback = '') {
    const parsed = parseTimeString(timeStr);
    if (!Number.isFinite(parsed)) return fallback;
    return minutesToTimeString(parsed);
};
__kiuAppExpose({
    normalizeTimeString,
});

var convertTimeToMinutes = window.convertTimeToMinutes || function (timeStr) {
    const parsed = parseTimeString(timeStr);
    return Number.isFinite(parsed) ? parsed : 0;
};
__kiuAppExpose({
    convertTimeToMinutes,
});

if (typeof window.normalizeScheduleGroup !== 'function') {
    window.normalizeScheduleGroup = function (subjectId, group) {
        if (!group) return null;
        const rawTime = String(group.time || group.startTime || '09:00');
        const timeMatch = rawTime.match(/(\d{1,2}):(\d{2})/);
        const startHour = timeMatch ? Number(timeMatch[1]) : 9;
        const startMinute = timeMatch ? Number(timeMatch[2]) : 0;
        const durationMinutes = Number(String(group.duration || '110').match(/\d+/)?.[0] || 110);
        const totalMinutes = (startHour * 60) + startMinute + durationMinutes;
        const endHour = String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0');
        const endMinute = String(totalMinutes % 60).padStart(2, '0');
        return {
            ...group,
            id: group.id || group.name || `${subjectId || 'GROUP'}-AUTO`,
            name: group.name || group.id || 'Group',
            faculty: String(group.faculty || '').trim().toUpperCase() || 'ECON',
            duration: group.duration || '110min',
            time: rawTime,
            endTime: group.endTime || `${endHour}:${endMinute}`,
            room: group.room || '',
            sessionType: group.sessionType || group.classType || group.type || 'lecture',
            registered: Number(group.registered || 0),
            capacity: Number(group.capacity || 0),
            weekOverrides: group.weekOverrides && typeof group.weekOverrides === 'object' ? group.weekOverrides : {}
        };
    };
}
__kiuAppExpose({
    normalizeScheduleGroup: window.normalizeScheduleGroup,
});

const SINGLE_RUNTIME_ROUTE_BY_FILE = {
    'admin-library.html': 'library',
    'admin-orders.html': 'orders',
    'chancellery.html': 'chancellery',
    'exams.html': 'exams',
    'faculty-gradebook.html': 'faculty-gradebook',
    'faculty-schedule.html': 'faculty-schedule',
    'library.html': 'library',
    'lms.html': 'lms',
    'news.html': 'news',
    'orders.html': 'orders',
    'personal-data.html': 'personal-data',
    'profile.html': 'profile',
    'programs.html': 'programs',
    'registration.html': 'registration',
    'student-service.html': 'student-service',
    'study-card.html': 'study-card',
    'timetable.html': 'timetable'
};

function getRuntimeRouteIntentFromPathname(pathname = window.location.pathname) {
    const normalizedPath = String(pathname || '').replace(/\\/g, '/').toLowerCase();
    const fileName = normalizedPath.split('/').filter(Boolean).pop() || '';
    if (!fileName || fileName === 'index.html' || fileName === 'login.html') return '';
    if (SINGLE_RUNTIME_ROUTE_BY_FILE[fileName]) return SINGLE_RUNTIME_ROUTE_BY_FILE[fileName];
    if (!fileName.endsWith('.html')) return '';
    return fileName.replace(/\.html$/i, '');
}

function enforceSingleRuntimeEntrypoint() {
    // Safety default: disabled to prevent route ping-pong between index and standalone shells.
    if (localStorage.getItem('KIU_ENABLE_SINGLE_RUNTIME_REDIRECT') !== '1') return;
    const normalizedPath = String(window.location.pathname || '').replace(/\\/g, '/').toLowerCase();
    const fileName = normalizedPath.split('/').filter(Boolean).pop() || '';
    if (fileName === 'student-service.html') return;
    const routeIntent = getRuntimeRouteIntentFromPathname();
    if (!routeIntent) return;
    try {
        localStorage.setItem('KIU_PENDING_ADMIN_PAGE', routeIntent);
    } catch (e) {
        console.warn('Unable to persist route intent before runtime redirect.', e);
    }
    const targetUrl = new URL('index.html', window.location.href);
    if (window.location.search) targetUrl.search = window.location.search;
    if (window.location.hash) targetUrl.hash = window.location.hash;
    window.location.replace(targetUrl.toString());
}

enforceSingleRuntimeEntrypoint();

/* English localization: assets/js/app/english-localization.js (loaded after this file). */


/* Mobile sidebar navigation: auto-close on nav click.
   Overlay dismiss, auto-collapse, swipe gestures, and
   bottom-nav are handled by the Mobile Experience
   Controller in index.html. */

(function initMobileSidebarNavClose() {
    // When a sidebar nav item is clicked on mobile, close the sidebar
    document.addEventListener('click', function(e) {
        if (window.innerWidth > 768) return;
        var navItem = e.target.closest('.lux-nav-item');
        if (!navItem) return;
        // Small delay so navigation fires first
        setTimeout(function() {
            if (!document.body.classList.contains('lux-sidebar-collapsed')) {
                if (typeof window.toggleSidebar === 'function') {
                    window.toggleSidebar();
                }
            }
        }, 120);
    });
})();

(function installMobileRoleSwitcherShortcut() {
    function closeInlineMobileSheet() {
        if (typeof window.closeSheet === 'function') {
            try {
                window.closeSheet();
                return;
            } catch (error) {}
        }
        var sheet = document.getElementById('mobile-action-sheet');
        if (!sheet) return;
        sheet.classList.remove('is-open');
        sheet.hidden = true;
        sheet.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function openRoleSwitcher() {
        if (typeof window.openRoleSwitcherPanel === 'function') {
            return window.openRoleSwitcherPanel();
        }
        var explicitRoleButton = document.getElementById('lux-role-picker-btn');
        if (explicitRoleButton) {
            explicitRoleButton.click();
            return true;
        }
        var fallbackPicker = document.querySelector('.lux-picker-btn');
        if (fallbackPicker) {
            fallbackPicker.click();
            return true;
        }
        return false;
    }

    document.addEventListener('click', function(event) {
        var trigger = event.target && typeof event.target.closest === 'function'
            ? event.target.closest('#mob-act-admin')
            : null;
        if (!trigger) return;
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === 'function') {
            event.stopImmediatePropagation();
        }
        closeInlineMobileSheet();
        var schedule = window.requestAnimationFrame || function(callback) {
            return window.setTimeout(callback, 0);
        };
        schedule(function() {
            openRoleSwitcher();
        });
    }, true);
})();

(function registerPortalServiceWorker() {
    const PORTAL_CACHE_RESET_KEY = 'KIU_PORTAL_CACHE_RESET_VERSION';
    const PORTAL_CACHE_RESET_VERSION = '20260805-switchperf3-debug';

    async function clearPortalSiteCaches(force = false) {
        try {
            const seenVersion = localStorage.getItem(PORTAL_CACHE_RESET_KEY);
            if (!force && seenVersion === PORTAL_CACHE_RESET_VERSION) return false;
        } catch (error) {}

        if ('serviceWorker' in navigator) {
            try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                await Promise.all(registrations.map((registration) => {
                    try {
                        registration.active?.postMessage({ type: 'PURGE_PORTAL_CACHES' });
                    } catch (error) {}
                    return registration.unregister();
                }));
            } catch (error) {}
        }

        if ('caches' in window) {
            try {
                const keys = await caches.keys();
                await Promise.all(keys.filter((key) => String(key || '').startsWith('kiu-portal-shell-')).map((key) => caches.delete(key)));
            } catch (error) {}
        }

        try {
            localStorage.setItem(PORTAL_CACHE_RESET_KEY, PORTAL_CACHE_RESET_VERSION);
        } catch (error) {}
        return true;
    }

    __kiuAppExpose({
        clearPortalSiteCaches,
    });
    window.clearPortalSiteCache = () => clearPortalSiteCaches(true);

    async function ensureManifestLink() {
        if (document.querySelector('link[rel="manifest"]')) return;
        const link = document.createElement('link');
        link.rel = 'manifest';
        link.href = 'manifest.webmanifest?v=20260604-styleguard2';
        document.head.appendChild(link);
    }

    const IS_LOCAL_DEV = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';

    async function registerWorker() {
        if (!('serviceWorker' in navigator)) return;
        if (window.location.protocol !== 'https:' && !IS_LOCAL_DEV) {
            return;
        }
        // On localhost, do NOT run a service worker: its Cache Storage serves
        // stale JS/CSS (ignores the dev server's no-store), so edits silently
        // never appear. Unregister any existing worker and wipe its caches so
        // every reload is fresh. Registration stays enabled for real HTTPS.
        if (IS_LOCAL_DEV) {
            try {
                await clearPortalSiteCaches(true);
            } catch (error) {}
            return;
        }
        try {
            await clearPortalSiteCaches(false);
            await ensureManifestLink();
            await navigator.serviceWorker.register(`service-worker.js?v=${PORTAL_CACHE_RESET_VERSION}`, { scope: './' });
        } catch (error) {
            console.warn('Service worker registration failed.', error);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', registerWorker, { once: true });
    } else {
        registerWorker();
    }
})();
