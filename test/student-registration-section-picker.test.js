import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('student registration section picker', () => {
  it('exports the section picker functions and uses delegated student registration hooks', () => {
    const pageSource = readSource('registration.html');
    const registrationSource = readSource('assets/js/pages/student-registration.js');

    expect(pageSource).toContain('assets/js/pages/student-registration.js');
    expect(registrationSource).toContain('function openStudentCourseSectionPicker(courseId, courseName =');
    expect(registrationSource).toContain('function setStudentCourseSectionType(type)');
    expect(registrationSource).toContain('function bindStudentRegistrationDelegates()');
    expect(registrationSource).toContain("document.addEventListener('click', handleStudentRegistrationClick);");
    expect(registrationSource).toContain("document.addEventListener('change', handleStudentRegistrationChange);");
    expect(registrationSource).toContain("button.dataset.studentCoursePicker = courseId;");
    expect(registrationSource).toContain("button.dataset.studentCourseName = courseMeta.name || courseId;");
    expect(registrationSource).toContain("button.dataset.studentTrackToggle = groupDomId;");
    expect(registrationSource).toContain('function buildStudentCourseSectionActionButton(courseId, group, selected, isFull) {');
    expect(registrationSource).toContain("button.dataset.studentCourseSectionChoose = escapeHtml(courseId);");
    expect(registrationSource).toContain("button.dataset.studentCourseSectionType = type;");
    expect(registrationSource).toContain('content.replaceChildren(fragment);');
    expect(registrationSource).toContain('window.openStudentCourseSectionPicker = openStudentCourseSectionPicker;');
    expect(registrationSource).toContain('window.setStudentCourseSectionType = setStudentCourseSectionType;');
    expect(registrationSource).toContain('window.chooseStudentCourseSection = chooseStudentCourseSection;');
    expect(registrationSource).toContain('typePinned: false');
    expect(registrationSource).toContain('studentCourseSectionPickerState.typePinned = true');
    expect(registrationSource).toContain('function getStudentSectionInstructorLabel(group, sessionType =');
    expect(registrationSource).toContain('dataset.studentCourseRemove = courseId');
    expect(registrationSource).toContain('dataset.studentCourseSectionClear = escapeHtml(courseId)');
    expect(registrationSource).toContain('function removeStudentCourseSelection(courseId, courseName =');
    expect(registrationSource).toContain('function buildStudentCourseSectionPickerFooter(courseId, courseName, hasSubjectSelection)');
    expect(registrationSource).toContain("const REGISTRATION_PICKER_BUILD = '20260605-regpicker3'");
    expect(registrationSource).toContain('window.REGISTRATION_PICKER_BUILD = REGISTRATION_PICKER_BUILD');
  });

  it('exports full subject removal from registration enrollment', () => {
    const enrollmentSource = readSource('assets/js/pages/registration-enrollment.js');
    expect(enrollmentSource).toContain('function removeStudentCourseEnrollment(courseId)');
    expect(enrollmentSource).toContain('window.removeStudentCourseEnrollment = removeStudentCourseEnrollment;');
  });

  it('uses three-tier verification before removing a section from the picker row', () => {
    const registrationSource = readSource('assets/js/pages/student-registration.js');
    expect(registrationSource).toContain('function runRegistrationRemoveVerification');
    expect(registrationSource).toContain('function buildStudentCourseSectionRemoveVerification');
    const clearFn = registrationSource.match(/function clearStudentCourseSection\(courseId, groupId\) \{[\s\S]*?^}/m)?.[0] || '';
    const verifyIndex = clearFn.indexOf('runRegistrationRemoveVerification');
    const unselectIndex = clearFn.indexOf('unselectCourseGroup(courseId, groupId)');
    expect(verifyIndex).toBeGreaterThan(-1);
    expect(unselectIndex).toBeGreaterThan(verifyIndex);
    expect(registrationSource).toContain('function runRegistrationRemoveVerification');
    expect(registrationSource).toMatch(/function runRegistrationRemoveVerification[\s\S]*?window\.confirm[\s\S]*?window\.confirm[\s\S]*?window\.prompt/);
  });

  it('uses three-tier verification before removing a subject from registration', () => {
    const registrationSource = readSource('assets/js/pages/student-registration.js');
    expect(registrationSource).toContain('function buildStudentCourseSubjectRemoveVerification');
    const removeFn = registrationSource.match(/function removeStudentCourseSelection\(courseId, courseName = ''\) \{[\s\S]*?^}/m)?.[0] || '';
    expect(removeFn).toContain('runRegistrationRemoveVerification');
    expect(removeFn).toContain('buildStudentCourseSubjectRemoveVerification');
    const verifyIndex = removeFn.indexOf('runRegistrationRemoveVerification');
    const enrollIndex = removeFn.indexOf('removeStudentCourseEnrollment');
    expect(verifyIndex).toBeGreaterThan(-1);
    expect(enrollIndex).toBeGreaterThan(verifyIndex);
  });

  it('keeps the section picker open after Choose and refreshes rows in place', () => {
    const registrationSource = readSource('assets/js/pages/student-registration.js');
    const chooseFn = registrationSource.match(/function chooseStudentCourseSection\(courseId, groupId\) \{[\s\S]*?\n\}/)?.[0] || '';
    const successBlock = chooseFn.match(/if \(result !== false\) \{[\s\S]*?\}/)?.[0] || '';
    expect(successBlock).toContain('renderStudentCourseSectionPicker()');
    expect(successBlock).not.toContain('closeStudentCourseSectionPicker()');
    const clearFn = registrationSource.match(/function clearStudentCourseSection\(courseId, groupId\) \{[\s\S]*?\n\}/)?.[0] || '';
    expect(clearFn).toContain('renderStudentCourseSectionPicker()');
    expect(clearFn).not.toContain('closeStudentCourseSectionPicker()');
  });

  it('shows professor names on lecture rows and TA names on seminar rows', () => {
    const registrationSource = readSource('assets/js/pages/student-registration.js');
    const instructorFn = registrationSource.match(
      /function getStudentSectionInstructorLabel\(group, sessionType = ''\) \{[\s\S]*?\n\}/
    )?.[0] || '';
    expect(instructorFn).toContain("normalizedType === 'seminar'");
    expect(instructorFn).toContain('if (hasProf) return prof;');
    expect(instructorFn).not.toContain('(TA:');
  });
});
