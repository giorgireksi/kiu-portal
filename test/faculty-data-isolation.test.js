import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('faculty data isolation guardrails', () => {
  it('scopes student registration track choices and section picking by faculty', () => {
    const studentRegistration = readSource('assets/js/pages/student-registration.js');
    const registration = readSource('assets/js/pages/registration.js');

    expect(studentRegistration).toContain('function getStudentRegistrationScopeKey');
    expect(studentRegistration).toContain('return `${studentId}::${normalizedFaculty}`;');
    expect(studentRegistration).toContain('getScopedStudentRegistrationTrackSelection(tabId)?.[tabId]');
    expect(studentRegistration).toContain('const activeFaculty = normalizeFacultyCode(getCurrentFaculty(), \'ECON\');');
    expect(studentRegistration).toContain('return groupFaculty === activeFaculty;');
    expect(studentRegistration).toContain('This section belongs to another faculty or is no longer available.');
    expect(registration).toContain('if (groupFaculty !== normalizedPreferredFaculty)');
    expect(registration).toContain('faculty: normalizedPreferredFaculty');
  });

  it('filters saved student schedules to the student faculty before reading or writing', () => {
    const state = readSource('assets/js/app/state.js');
    const service = readSource('assets/js/pages/student-service.js');

    expect(state).toContain('function resolveStudentScheduleEntryFaculty');
    expect(state).toContain('function isStudentScheduleEntryInFaculty');
    expect(state).toContain('.filter(entry => isStudentScheduleEntryInFaculty(entry, studentFaculty))');
    expect(state).toContain('faculty: entry?.faculty || normalizeFacultyCode(studentFaculty, \'ECON\')');
    expect(state).toContain('const currentSchedule = normalizeStudentScheduleValue(KIU_STATE.studentSchedulesByStudent?.[activeUser.id])');
    expect(state).toContain('KIU_STATE.studentSchedule = JSON.parse(JSON.stringify(currentSchedule));');
    expect(service).toContain('function getStudentServiceStudentSchedule(studentId)');
    expect(service).toContain('return entryFaculty === activeFaculty;');
  });

  it('prevents scheduler and roster updates from matching same course/group ids across faculties', () => {
    const faculty = readSource('assets/js/shared/faculty.js');
    const messenger = readSource('assets/js/shared/messenger.js');
    const state = readSource('assets/js/app/state.js');

    expect(faculty).toContain('function doesScheduledEntryBelongToGroupFaculty');
    expect(faculty).toContain('if (!doesScheduledEntryBelongToGroupFaculty(entry, studentId, groupData, courseId)) return entry;');
    expect(faculty).toContain('removeStudentSchedulesForScheduledGroup(courseId, groupId, targetGroup);');
    expect(faculty).toContain('normalizeFacultyCode(group?.faculty || deriveFacultyFromSubjectId(courseId), normalizedFaculty) === normalizedFaculty');
    expect(messenger).toContain('const targetFaculty = normalizeFacultyCode');
    expect(messenger).toContain('if (targetFaculty && normalizeFacultyCode(student?.facultyCode || student?.faculty || \'\', \'\') !== targetFaculty) return;');
    expect(state).toContain('return sameFacultyPersona || sameFacultyCandidate || null;');
  });

  it('keeps people directories scoped to the active faculty unless all faculties is explicit', () => {
    const app = readSource('assets/js/app/app.js');
    const messenger = readSource('assets/js/shared/messenger.js');
    const directories = readSource('assets/js/pages/directories.js');
    const faculty = readSource('assets/js/shared/faculty.js');
    const state = readSource('assets/js/app/state.js');
    const homeModel = readSource('assets/js/features/luxury-home-model.js');

    expect(app).toContain('function normalizePeopleFacultyFilter(facultyFilter = getCurrentFaculty())');
    expect(app).toContain("function getAllStaff(type = 'professors', facultyFilter = getCurrentFaculty())");
    expect(app).toContain('function getAllStudents(facultyFilter = getCurrentFaculty())');
    expect(app).toContain("if (normalizedFilter !== 'all' && normalizedFaculty !== normalizedFilter) return;");
    expect(app).toContain('window.getAllStaff = getAllStaff;');
    expect(app).toContain('window.getAllStudents = getAllStudents;');
    expect(messenger).not.toContain('function normalizePeopleFacultyFilter(facultyFilter = getCurrentFaculty())');
    expect(messenger).not.toContain("function getAllStaff(type = 'professors', facultyFilter = getCurrentFaculty())");
    expect(messenger).not.toContain('function getAllStudents(facultyFilter = getCurrentFaculty())');
    expect(directories).toContain("const fac = getCurrentFaculty();");
    expect(directories).toContain("const totalStudents = getAllStudents(fac).length;");
    expect(directories).toContain('function clearStaffAssignmentsFromGroups(member, type, facultyCode = getCurrentFaculty())');
    expect(directories).toContain('if (groupFaculty !== normalizedFaculty) return group;');
    expect(directories).toContain("normalizeFacultyCode(user.facultyCode || user.faculty || fac, fac) === normalizeFacultyCode(fac, fac)");
    expect(faculty).toContain('return getAllStudents(getCurrentFaculty()).map(student => ({');
    expect(state).toContain('usersByFacultyRole');
    expect(homeModel).toContain("getAllStaff('professors', facultyCode)");
  });
});
