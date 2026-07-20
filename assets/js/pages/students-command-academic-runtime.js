/* Student academic/mobility action helpers. Peeled from students-command-center.js.
 * Load before students-command-center.js. Host installs via mutable deps bag.
 */
(function () {
    if (window.__KIU_STUDENTS_COMMAND_ACADEMIC_LOADED) return;
    window.__KIU_STUDENTS_COMMAND_ACADEMIC_LOADED = true;
    window.__kiuCreateStudentsCommandAcademicApi = function createKiuPeelApi(deps = {}) {
        with (deps) {

        function parseMobilitySubjectIds(value) {
            return String(value || '')
                .split(/[\n,;]+/)
                .map((item) => normalizeText(item, ''))
                .filter(Boolean);
        }

        function saveMobility(recordId) {
            const facultyCode = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
            const record = buildStudentRecords(facultyCode).records.find((item) => item.id === recordId);
            if (!record) return;
            const category = document.getElementById('student-mobility-category')?.value || 'standard';
            const effectiveFrom = document.getElementById('student-mobility-from')?.value || '';
            const effectiveTo = document.getElementById('student-mobility-to')?.value || '';
            const notes = document.getElementById('student-mobility-notes')?.value || '';
            const sourceFaculty = document.getElementById('student-mobility-source-faculty')?.value || record.facultyCode;
            const targetFaculty = document.getElementById('student-mobility-target-faculty')?.value || '';
            const subjectIds = parseMobilitySubjectIds(document.getElementById('student-mobility-transfer-subjects')?.value || '');
            const mobility = {
                ...(record.mobility || {}),
                category,
                effectiveFrom,
                effectiveTo,
                agreementMetadata: { notes },
                history: Array.isArray(record.mobility?.history) ? record.mobility.history : []
            };
            if (category === 'internal_transfer') {
                mobility.sourceFaculty = sourceFaculty;
                mobility.targetFaculty = targetFaculty;
            }
            const curriculumPlan = typeof updateStudentCurriculumPlan === 'function'
                ? updateStudentCurriculumPlan(record, {
                    mode: category === 'internal_transfer' ? 'internal_transfer' : (record.curriculumPlan?.mode || 'standard'),
                    sourceFaculty,
                    targetFaculty: targetFaculty || record.curriculumPlan?.targetFaculty || record.facultyCode,
                    subjectIds,
                    effectiveFrom,
                    notes
                })
                : record.curriculumPlan;
            const next = {
                ...record,
                mobility,
                mobilityCategory: category,
                curriculumPlan,
                updatedAt: todayIso()
            };
            persistStudentRecord(next);
            if (typeof saveState === 'function') saveState();
            showToast('Mobility record saved.');
            renderStudentsPage();
        }

        function executeTransfer(recordId) {
            const facultyCode = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
            const record = buildStudentRecords(facultyCode).records.find((item) => item.id === recordId);
            if (!record) return;
            const targetFaculty = document.getElementById('student-mobility-target-faculty')?.value || '';
            if (!targetFaculty) {
                showToast('Select a target faculty before executing the transfer.');
                return;
            }
            if (typeof executeInternalTransfer !== 'function') {
                showToast('Internal transfer tools are unavailable.');
                return;
            }
            const transferred = executeInternalTransfer(record, {
                sourceFaculty: document.getElementById('student-mobility-source-faculty')?.value || record.facultyCode,
                targetFaculty,
                subjectIds: parseMobilitySubjectIds(document.getElementById('student-mobility-transfer-subjects')?.value || ''),
                effectiveFrom: document.getElementById('student-mobility-from')?.value || todayIso(),
                notes: document.getElementById('student-mobility-notes')?.value || ''
            });
            if (!transferred) {
                showToast('Could not execute transfer. Check source and target faculties.');
                return;
            }
            transferred.department = departmentForFaculty(transferred.facultyCode);
            persistStudentRecord(transferred);
            if (typeof saveState === 'function') saveState();
            if (typeof switchFacultyTheme === 'function') {
                switchFacultyTheme(transferred.facultyCode, { refreshDependentViews: false });
            }
            showToast(`${record.name} transferred to ${facultyName(transferred.facultyCode)}. Faculty context updated.`);
            renderStudentsPage();
        }

        function syncCurriculumPlanSubjectIds(record, courseId, mode = 'add') {
            if (typeof updateStudentCurriculumPlan !== 'function') return record.curriculumPlan || null;
            const normalizedCourse = normalizeText(courseId, '');
            if (!normalizedCourse) return record.curriculumPlan || null;
            const current = Array.isArray(record.curriculumPlan?.subjectIds) ? [...record.curriculumPlan.subjectIds] : [];
            const next = mode === 'remove'
                ? current.filter((item) => normalizeText(item, '') !== normalizedCourse)
                : [...new Set([...current, normalizedCourse])];
            return updateStudentCurriculumPlan(record, { subjectIds: next });
        }

        function persistAcademicEnrollmentChange(recordId, message, courseId = '', mode = 'add') {
            const facultyCode = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
            const record = buildStudentRecords(facultyCode).records.find((item) => item.id === recordId);
            if (!record) return;
            const curriculumPlan = courseId ? syncCurriculumPlanSubjectIds(record, courseId, mode) : (record.curriculumPlan || null);
            const entry = ensureRecordEntry(recordId, record.facultyCode);
            if (entry && curriculumPlan) entry.curriculumPlan = curriculumPlan;
            const nextRecord = {
                ...record,
                curriculumPlan: curriculumPlan || record.curriculumPlan,
                updatedAt: todayIso()
            };
            persistStudentRecord(nextRecord);
            if (typeof saveState === 'function') saveState();
            if (typeof touchStudentAcademicSync === 'function') touchStudentAcademicSync(recordId);
            showToast(message);
            renderStudentsPage();
        }

        function addSubjectEnrollment(recordId, courseId) {
            const normalizedCourse = normalizeText(courseId, '');
            if (!normalizedCourse) {
                showToast('Select a subject to add.');
                return;
            }
            const facultyCode = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
            const record = buildStudentRecords(facultyCode).records.find((item) => item.id === recordId);
            if (!record || typeof addStudentEnrollmentSubject !== 'function') return;
            const added = addStudentEnrollmentSubject(recordId, normalizedCourse, record.facultyCode);
            if (!added) {
                showToast('Subject is already on this student schedule.');
                return;
            }
            persistAcademicEnrollmentChange(recordId, `${normalizedCourse} added to schedule.`, normalizedCourse, 'add');
        }

        function removeSubjectEnrollment(recordId, courseId) {
            const normalizedCourse = normalizeText(courseId, '');
            if (!normalizedCourse || typeof removeStudentEnrollmentSubject !== 'function') return;
            const removed = removeStudentEnrollmentSubject(recordId, normalizedCourse);
            if (!removed) {
                showToast('Subject was not found on the active schedule.');
                return;
            }
            persistAcademicEnrollmentChange(recordId, `${normalizedCourse} removed from schedule.`, normalizedCourse, 'remove');
        }

        function markSubjectComplete(recordId, courseId) {
            const normalizedCourse = normalizeText(courseId, '');
            if (!normalizedCourse || typeof markStudentSubjectComplete !== 'function') return;
            markStudentSubjectComplete(recordId, normalizedCourse);
            const facultyCode = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
            const record = buildStudentRecords(facultyCode).records.find((item) => item.id === recordId);
            if (record) {
                const entry = ensureRecordEntry(recordId, record.facultyCode);
                const completed = new Set((entry?.curriculumPlan?.completedSubjectIds || record.curriculumPlan?.completedSubjectIds || []).map((item) => normalizeText(item, '')));
                completed.add(normalizedCourse);
                const curriculumPlan = typeof updateStudentCurriculumPlan === 'function'
                    ? updateStudentCurriculumPlan(record, { completedSubjectIds: [...completed] })
                    : { ...(record.curriculumPlan || {}), completedSubjectIds: [...completed] };
                persistStudentRecord({ ...record, curriculumPlan, updatedAt: todayIso() });
            }
            if (typeof saveState === 'function') saveState();
            if (typeof touchStudentAcademicSync === 'function') touchStudentAcademicSync(recordId);
            showToast(`${normalizedCourse} marked complete.`);
            renderStudentsPage();
        }

        const api = {
            parseMobilitySubjectIds,
            saveMobility,
            executeTransfer,
            persistAcademicEnrollmentChange,
            addSubjectEnrollment,
            removeSubjectEnrollment,
            markSubjectComplete,
        };
        Object.assign(window, api);
        return api;
        }
    };
})();

