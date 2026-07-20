(function initStudentAcademicHelpers() {
    'use strict';

    if (typeof window.getGradeRecordCombinedKiuPassScore !== 'function') {
        window.getGradeRecordCombinedKiuPassScore = function getGradeRecordCombinedKiuPassScore(record, rosterId = '') {
            void rosterId;
            const safe = record || {};
            const q1 = Number(safe.q1 || 0);
            const qa = Number(safe.qa || 0);
            const mid = Number(safe.mid || 0);
            const fin = Number(safe.final || safe.fin || 0);
            const retake = Number(safe.retake || 0);
            const preFinal = (q1 * 0.10) + (qa * 0.10) + (mid * 0.30);
            const finalCombined = preFinal + (fin * 0.50);
            const retakeCombined = preFinal + (retake * 0.50);
            return Math.max(finalCombined, retakeCombined);
        };
    }


    if (typeof window.isGradeRecordPassedByKiuRule !== 'function') {
        window.isGradeRecordPassedByKiuRule = function isGradeRecordPassedByKiuRule(record, rosterId = '') {
            const safe = record || {};
            const finalScore = Number(safe.final || safe.fin || 0);
            const retakeScore = Number(safe.retake || 0);
            const hasExamOutcome = finalScore > 0 || retakeScore > 0;
            return hasExamOutcome && Number(getGradeRecordCombinedKiuPassScore(safe, rosterId) || 0) >= 51;
        };
    }

    if (typeof window.getStudentCompletedEctsTotal !== 'function') {
        window.getStudentCompletedEctsTotal = function getStudentCompletedEctsTotal(studentId, preferredFaculty = null) {
            const normalizedId = String(studentId || '').trim();
            if (!normalizedId || !window.KIU_STATE) return 0;
            const fac = typeof normalizeFacultyCode === 'function'
                ? normalizeFacultyCode(preferredFaculty || (typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON'), 'ECON')
                : (preferredFaculty || 'ECON');
            const passed = new Set();
            const add = (courseId) => {
                const key = typeof canonicalCourseKey === 'function'
                    ? canonicalCourseKey(courseId)
                    : String(courseId || '').trim().toUpperCase();
                if (key) passed.add(key);
            };
            (KIU_STATE.studentPassedCourses?.[normalizedId] || []).forEach((item) => {
                add(typeof item === 'string' ? item : (item?.id || item?.courseId || item?.n || ''));
            });
            Object.entries(KIU_STATE.studentGrades || {}).forEach(([rosterId, roster]) => {
                const record = (roster || []).find((entry) => String(entry?.id || '') === normalizedId);
                if (!record) return;
                if (Number(getGradeRecordCombinedKiuPassScore(record, rosterId) || 0) < 51) return;
                add(rosterId);
            });
            let total = 0;
            passed.forEach((key) => {
                const curriculum = typeof getActiveCurriculum === 'function' ? getActiveCurriculum(fac) : [];
                const course = (curriculum || []).find((item) => {
                    const id = item?.id || item?.n || item?.courseId || '';
                    const courseKey = typeof canonicalCourseKey === 'function' ? canonicalCourseKey(id) : String(id).toUpperCase();
                    return courseKey === key;
                });
                const ects = Number(course?.ects || course?.credits || 0);
                total += Number.isFinite(ects) && ects > 0 ? ects : 6;
            });
            return total;
        };
    }
})();