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

    expect(pageSource).toContain('assets/js/pages/student-registration.js?v=20260430-lmsgrades1');
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
  });
});
