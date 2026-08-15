/* Scheduler create-session + faculty scope sync. Peeled from admin-scheduler.js.
 * Load before admin-scheduler.js. Host installs via mutable deps bag.
 */
(function () {
    if (window.__KIU_ADMIN_SCHEDULER_SESSION_LOADED) return;
    window.__KIU_ADMIN_SCHEDULER_SESSION_LOADED = true;
    window.__kiuCreateAdminSchedulerSessionApi = function createKiuPeelApi(deps = {}) {
        with (deps) {

        function schCreateSession() {
            const isEdit = el('sch-edit-mode')?.value === 'edit';
            const originalCourseId = el('sch-edit-course')?.value || '';
            const originalGroupId = String(el('sch-edit-group')?.value || '').toLowerCase();
            const originalWeekStart = el('sch-edit-weekstart')?.value || getSchedulerWeekStart();
            const originalWasOverride = el('sch-edit-was-override')?.value === '1';

            const courseId = el('sch-subject')?.value?.trim();
            const groupName = el('sch-group')?.value?.trim();
            const day = normalizeSchedulerDayLabel(el('sch-day')?.value, 'ge');
            const time = normalizeTimeString(el('sch-time')?.value, '');
            let endTime = normalizeTimeString(el('sch-endtime')?.value, '');
            let durationMinutes = parseInt(el('sch-duration')?.value, 10);

            if (Number.isNaN(durationMinutes) || el('sch-duration')?.value === 'custom') {
                durationMinutes = convertTimeToMinutes(endTime) - convertTimeToMinutes(time);
                if (durationMinutes <= 0) durationMinutes = 60;
            }
            if (!endTime) {
                endTime = minutesToTimeString(convertTimeToMinutes(time) + durationMinutes);
            }

            const room = el('sch-room')?.value?.trim() || 'TBD';
            const professorSelect = el('sch-prof');
            const taSelect = el('sch-ta');
            const professorValue = professorSelect?.value?.trim() || '';
            const taValue = taSelect?.value?.trim() || '';
            const professor = professorSelect?.dataset?.schedulerStaffLabel?.trim()
                || professorSelect?.selectedOptions?.[0]?.dataset?.schedulerStaffLabel?.trim()
                || professorSelect?.selectedOptions?.[0]?.textContent?.trim()
                || professorValue || 'TBD';
            const ta = taSelect?.dataset?.schedulerStaffLabel?.trim()
                || taSelect?.selectedOptions?.[0]?.dataset?.schedulerStaffLabel?.trim()
                || taSelect?.selectedOptions?.[0]?.textContent?.trim()
                || taValue;
            const professorId = String(professorSelect?.dataset?.schedulerStaffId || (professorSelect?.selectedOptions?.[0]?.dataset?.schedulerStaffLabel ? professorValue : '')).trim();
            const taId = String(taSelect?.dataset?.schedulerStaffId || (taSelect?.selectedOptions?.[0]?.dataset?.schedulerStaffLabel ? taValue : '')).trim();
            const sessionType = typeof inferSchedulerSessionType === 'function'
                ? inferSchedulerSessionType(professor, ta, el('sch-session-type')?.value || 'lecture')
                : (String(el('sch-session-type')?.value || 'lecture').toLowerCase() === 'seminar' ? 'seminar' : 'lecture');
            const capacity = parseInt(el('sch-capacity')?.value || '40', 10) || 40;
            const semester = parseInt(el('sch-semester-hidden')?.value || '3', 10) || 3;
            const weekStart = el('sch-weekstart-hidden')?.value || getSchedulerWeekStart();
            const applyScope = el('sch-apply-scope')?.value || 'selected-week';
            const normalizedGroupId = String(groupName || '').toLowerCase();
            const faculty = normalizeFacultyCode(el('admin-tt-faculty')?.value || localStorage.getItem('currentFaculty') || 'ECON');

            if (!courseId || courseId === '- Add subjects from Curriculum CMS first -') {
                alert('Please select a subject. If empty, add subjects from Curriculum CMS first.');
                return;
            }
            if (!groupName) {
                alert('Please enter a Group ID (e.g. G1).');
                return;
            }
            if (!day || !time) {
                alert('Day and time are required.');
                return;
            }

            const excludeKey = isEdit && originalCourseId && originalGroupId
                ? `${originalCourseId}::${originalGroupId}`
                : `${courseId}::${normalizedGroupId}`;

            const professorOverlap = findScheduleConflict('professor', professor, day, time, endTime, excludeKey, weekStart);
            if (professorOverlap) {
                alert(`CONFLICT: ${professor} is already scheduled for ${professorOverlap.courseId} at this time.`);
                return;
            }

            const roomOverlap = findScheduleConflict('room', room, day, time, endTime, excludeKey, weekStart);
            if (roomOverlap) {
                alert(`CONFLICT: Room ${room} is already booked for ${roomOverlap.courseId} at this time.`);
                return;
            }

            const result = upsertScheduledSession(courseId, {
                id: normalizedGroupId,
                name: groupName,
                faculty,
                semester,
                day,
                time,
                endTime,
                prof: professor,
                profId: professorId,
                ta,
                taId,
                taIds: taId ? [taId] : [],
                room,
                duration: `${durationMinutes}min`,
                sessionType,
                capacity,
                registered: 0
            }, {
                weekStart,
                scope: applyScope
            });

            if (!result?.group) {
                alert('Unable to save this session. Please verify the subject and group details.');
                return;
            }

            const movedSession = isEdit
                && originalCourseId
                && originalGroupId
                && (originalCourseId !== courseId || originalGroupId !== normalizedGroupId);

            if (movedSession && typeof migrateStudentSchedulesForScheduledGroup === 'function') {
                migrateStudentSchedulesForScheduledGroup(originalCourseId, originalGroupId, courseId, result.group);
            }

            if (movedSession && (originalWasOverride || applyScope === 'recurring')) {
                deleteScheduledSession(
                    originalCourseId,
                    originalGroupId,
                    originalWeekStart,
                    originalWasOverride ? 'week-only' : 'visible'
                );
            } else if (isEdit && !movedSession && originalWasOverride && applyScope === 'recurring') {
                deleteScheduledSession(courseId, normalizedGroupId, originalWeekStart, 'week-only');
            }

            saveState();
            closeSchModal();

            const profFilter = el('admin-tt-prof');
            const taFilter = el('admin-tt-ta');
            const currentProfFilter = profFilter?.value || 'all';
            const currentTaFilter = taFilter?.value || 'all';
            const hiddenByFilters = (currentProfFilter !== 'all' && professor !== currentProfFilter)
                || (currentTaFilter !== 'all' && ta !== currentTaFilter);

            if (hiddenByFilters) {
                if (profFilter) profFilter.value = 'all';
                if (taFilter) taFilter.value = 'all';
            }

            renderGrid();

            const button = el('sch-create-btn');
            if (button) {
                const originalHtml = button.innerHTML;
                button.innerHTML = `<i class="fas fa-check"></i> ${isEdit ? 'Session Updated!' : 'Session Created!'}`;
                button.classList.add('is-success-state');
                setTimeout(() => {
                    button.innerHTML = originalHtml;
                    button.classList.remove('is-success-state');
                }, 2000);
            }
        }

        function syncSchedulerFacultyScope(facultyValue) {
            normalizeSchedulerSelectOptions();
            const normalizedFaculty = facultyValue === 'all'
                ? 'all'
                : normalizeFacultyCode(facultyValue, getCurrentFaculty());

            if (el('admin-tt-faculty')) el('admin-tt-faculty').value = normalizedFaculty;

            if (normalizedFaculty !== 'all') {
                localStorage.setItem('currentFaculty', normalizedFaculty);
                if (typeof switchFacultyTheme === 'function') {
                    switchFacultyTheme(normalizedFaculty, { refreshDependentViews: false });
                }
            }

            selectedPaletteSubject = null;
            window.selectedPaletteSubject = null;

            populateProfList();
            queueSchedulerRefresh({ palette: true, grid: true });
        }

        const api = {
            schCreateSession,
            syncSchedulerFacultyScope,
        };
        Object.assign(window, api);
        return api;
        }
    };
})();

