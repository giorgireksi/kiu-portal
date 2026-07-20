/**
 * Course-teaching-scope ACL for exams / live-quiz / similar route guards.
 * Client KIU_STATE.studentGrades remains the gradebook source of truth (no server score domain).
 */
function canAccessGradebookCourse(courseId, userId, role = '', action = 'read') {
    const normalizedRole = String(role || '').trim().toLowerCase();
    const normalizedAction = String(action || 'read').trim().toLowerCase();
    if (normalizedRole === 'admin') return true;
    if (!['read', 'score', 'publish', 'finalize'].includes(normalizedAction)) return false;
    if (['publish', 'finalize'].includes(normalizedAction) && normalizedRole !== 'professor') return false;
    if (normalizedRole === 'professor') return this.isCourseTeachingStaff(courseId, userId, normalizedRole);
    if (normalizedRole === 'ta' && ['read', 'score'].includes(normalizedAction)) {
        return this.isCourseTeachingStaff(courseId, userId, normalizedRole);
    }
    return false;
}

module.exports = {
    canAccessGradebookCourse
};
