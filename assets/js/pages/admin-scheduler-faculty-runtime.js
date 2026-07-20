/* Scheduler faculty/palette scope helpers. Peeled from admin-scheduler.js.
 * Load before admin-scheduler.js. Host installs via mutable deps bag.
 */
(function () {
    if (window.__KIU_ADMIN_SCHEDULER_FACULTY_LOADED) return;
    window.__KIU_ADMIN_SCHEDULER_FACULTY_LOADED = true;
    window.__kiuCreateAdminSchedulerFacultyApi = function createKiuPeelApi(deps = {}) {
        with (deps) {

        function mergeUniqueSubjects(items = []) {
            const seen = new Set();
            return items.filter((item) => {
                const id = String(item?.id || '').trim();
                if (!id || seen.has(id)) return false;
                seen.add(id);
                return true;
            });
        }

        function deriveFaculty(courseId) {
            if (!courseId) return 'ECON';
            const normalized = String(courseId).trim().toUpperCase();
            if (normalized.startsWith('CS') || normalized.startsWith('STAT') || normalized.startsWith('CALC')) return 'CS';
            if (normalized.startsWith('ECON') || normalized.startsWith('PM') || normalized.startsWith('BM')) return 'ECON';
            if (normalized.startsWith('LAW')) return 'LAW';
            return localStorage.getItem('currentFaculty') || 'ECON';
        }

        function normalizeFacultyDisplay(code) {
            const normalized = code === 'all' ? 'all' : normalizeFacultyCode(code, getCurrentFaculty());
            if (normalized === 'all') return 'All Faculties';
            const profile = typeof getFacultyProfile === 'function' ? getFacultyProfile(normalized) : null;
            return profile?.name || normalized;
        }

        function getSchedulerWeekStart() {
            return getStoredWeekStart(SCHEDULER_WEEK_STORAGE_KEY);
        }
        function normalizeSchedulerDayLabel(day, target = 'ge') {
            const raw = String(day || '').trim();
            if (!raw) return '';
            const entries = getWeekDateEntries(getSchedulerWeekStart());
            const lowered = raw.toLowerCase();
            const match = entries.find((entry) =>
                String(entry.ge || '').trim().toLowerCase() === lowered
                || String(entry.en || '').trim().toLowerCase() === lowered
            );
            if (match) return target === 'en' ? match.en : match.ge;
            const orderIndex = DAY_ORDER.findIndex((label) => label.toLowerCase() === lowered);
            if (orderIndex >= 0) {
                const fallbackEntry = entries[orderIndex];
                if (fallbackEntry) return target === 'en' ? fallbackEntry.en : fallbackEntry.ge;
            }
            return raw;
        }

        function getSchedulerFacultyTone(facultyCode, options = {}) {
            return getFacultyThemeTone(normalizeFacultyCode(facultyCode || 'ECON'), {
                softAlpha: 0.14,
                tintAlpha: 0.18,
                strongAlpha: 0.24,
                borderAlpha: 0.28,
                ...options
            });
        }

        function getSchedulerPaletteSubjects() {
            const facultyFilter = el('admin-tt-faculty')?.value || 'all';
            const semesterFilter = parseInt(el('admin-tt-semester')?.value || '0', 10);
            const query = String(el('palette-search')?.value || '').trim().toLowerCase();
            const currentFaculty = localStorage.getItem('currentFaculty') || 'ECON';
            const normalizedFaculty = facultyFilter === 'all'
                ? 'all'
                : normalizeFacultyCode(facultyFilter, currentFaculty);

            let subjects = normalizedFaculty === 'all'
                ? mergeUniqueSubjects(
                    Object.values(KIU_STATE.facultyProfiles || {})
                        .flatMap((profile) => profile.curriculum || [])
                        .concat(KIU_STATE.curriculum || [])
                )
                : getActiveCurriculum(normalizedFaculty);

            if (!subjects.length) {
                subjects = (KIU_STATE.curriculum || []).filter((subject) =>
                    normalizedFaculty === 'all'
                    || normalizeFacultyCode(subject.faculty, currentFaculty) === normalizedFaculty
                );
            }

            return subjects.filter((subject) => {
                const subjectSemester = parseInt(subject.semester || '0', 10);
                const semesterMatches = !semesterFilter || !subjectSemester || subjectSemester === semesterFilter;
                if (!semesterMatches) return false;
                if (!query) return true;
                return String(subject.name || '').toLowerCase().includes(query)
                    || String(subject.id || '').toLowerCase().includes(query);
            });
        }

        const api = {
            mergeUniqueSubjects,
            deriveFaculty,
            normalizeFacultyDisplay,
            getSchedulerWeekStart,
            normalizeSchedulerDayLabel,
            getSchedulerFacultyTone,
            getSchedulerPaletteSubjects,
        };
        Object.assign(window, api);
        return api;
        }
    };
})();
