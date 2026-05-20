const {
    asArray,
    clone,
    makeId,
    nowIso,
    uniqueStrings
} = require('../utils');

function ensureLmsCourse(courseId) {
    const key = String(courseId || '').trim();
    if (!key) return null;
    this.state.lmsCourses[key] = this.state.lmsCourses[key] || {
        id: key,
        title: this.state.courses[key]?.name || key,
        courseId: key,
        assignments: [],
        materials: [],
        concepts: [],
        quizzes: [],
        attendanceSessions: [],
        teachingTeam: [],
        createdAt: nowIso(),
        updatedAt: nowIso()
    };
    return this.state.lmsCourses[key];
}

function getLmsCourse(courseId) {
    const lmsCourse = ensureLmsCourse.call(this, courseId);
    if (!lmsCourse) return null;
    lmsCourse.updatedAt = nowIso();
    this.save();
    return {
        ...clone(lmsCourse),
        course: clone(this.state.courses[courseId] || null),
        sections: Object.values(this.state.sections).filter(section => section.courseId === courseId).map(section => clone(section))
    };
}

function createAssignment(payload = {}) {
    const courseId = String(payload.courseId || '').trim();
    const lmsCourse = ensureLmsCourse.call(this, courseId);
    if (!lmsCourse) return null;
    const assignment = {
        id: String(payload.id || makeId('asn')).trim(),
        title: String(payload.title || 'Assignment').trim(),
        description: String(payload.description || '').trim(),
        dueAt: String(payload.dueAt || '').trim(),
        weekLabel: String(payload.weekLabel || '').trim(),
        attachments: asArray(payload.attachments).map(file => this.normalizeMessageAttachment(file, payload.createdBy || '')).filter(Boolean),
        createdBy: String(payload.createdBy || '').trim(),
        createdAt: String(payload.createdAt || nowIso())
    };
    lmsCourse.assignments.unshift(assignment);
    lmsCourse.updatedAt = nowIso();
    this.save();
    return clone(assignment);
}

function createMaterial(payload = {}) {
    const courseId = String(payload.courseId || '').trim();
    const lmsCourse = ensureLmsCourse.call(this, courseId);
    if (!lmsCourse) return null;
    const material = {
        id: String(payload.id || makeId('mat')).trim(),
        title: String(payload.title || 'Material').trim(),
        description: String(payload.description || '').trim(),
        weekLabel: String(payload.weekLabel || '').trim(),
        attachments: asArray(payload.attachments).map(file => this.normalizeMessageAttachment(file, payload.createdBy || '')).filter(Boolean),
        createdBy: String(payload.createdBy || '').trim(),
        createdAt: String(payload.createdAt || nowIso())
    };
    lmsCourse.materials.unshift(material);
    lmsCourse.updatedAt = nowIso();
    this.save();
    return clone(material);
}

function getStudentEnrollmentsByCourse(courseId) {
    return Object.values(this.state.enrollments)
        .filter(item => item.courseId === String(courseId || '').trim() && String(item.status || 'active') !== 'dropped')
        .map(item => clone(item));
}

function getSectionsByCourse(courseId) {
    const normalizedCourseId = String(courseId || '').trim();
    return Object.values(this.state.sections || {})
        .filter(section => String(section?.courseId || '').trim() === normalizedCourseId)
        .map(section => clone(section));
}

function isCourseTeachingStaff(courseId, userId, role = '') {
    const normalizedCourseId = String(courseId || '').trim();
    const courseScopeIds = uniqueStrings([
        normalizedCourseId,
        normalizedCourseId.includes('::') ? normalizedCourseId.split('::')[0] : ''
    ]);
    const normalizedUserId = String(userId || '').trim();
    const normalizedRole = String(role || '').trim().toLowerCase();
    if (!normalizedCourseId || !normalizedUserId) return false;
    if (normalizedRole === 'admin') return true;
    const sections = courseScopeIds.flatMap(scopeId => getSectionsByCourse.call(this, scopeId));
    const assignedToSection = sections.some(section => {
        const professorIds = uniqueStrings([
            section.professorId,
            section.instructorUserId,
            section.instructorId
        ]);
        const taIds = uniqueStrings([
            ...(Array.isArray(section.taIds) ? section.taIds : []),
            section.assistantUserId,
            section.assistantId,
            section.taId
        ]);
        if (normalizedRole === 'professor') return professorIds.includes(normalizedUserId);
        if (normalizedRole === 'ta') return taIds.includes(normalizedUserId);
        return professorIds.includes(normalizedUserId) || taIds.includes(normalizedUserId);
    });
    if (assignedToSection) return true;
    const teachingTeam = courseScopeIds.flatMap(scopeId => {
        const lmsCourse = this.state.lmsCourses?.[scopeId] || {};
        return Array.isArray(lmsCourse.teachingTeam) ? lmsCourse.teachingTeam : [];
    });
    return teachingTeam.some(member => {
        if (typeof member === 'string') return member === normalizedUserId;
        const memberId = String(member?.userId || member?.id || '').trim();
        const memberRole = String(member?.role || member?.assignmentRole || '').trim().toLowerCase();
        if (memberId !== normalizedUserId) return false;
        if (!normalizedRole || !memberRole) return true;
        return memberRole === normalizedRole || (normalizedRole === 'professor' && memberRole === 'instructor');
    });
}

module.exports = {
    createAssignment,
    createMaterial,
    ensureLmsCourse,
    getLmsCourse,
    getSectionsByCourse,
    getStudentEnrollmentsByCourse,
    isCourseTeachingStaff
};
