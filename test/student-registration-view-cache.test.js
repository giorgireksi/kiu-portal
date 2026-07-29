import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('student registration view cache', () => {
    it('fingerprints enrollment schedule in prog-style view signatures', () => {
        const source = readSource('assets/js/pages/student-registration.js');

        expect(source).toContain('function buildStudentRegistrationEnrollmentSignature(userId, faculty)');
        expect(source).toContain('reg:${registrationSig}|sched:${scheduleSig}');
        expect(source).toMatch(
            /buildStudentRegistrationViewSignature[\s\S]*buildStudentRegistrationEnrollmentSignature\(user\?\.id, faculty\)/
        );
    });

    it('invalidates view cache after section choose and clear flows', () => {
        const source = readSource('assets/js/pages/student-registration.js');
        const enrollment = readSource('assets/js/pages/registration-enrollment.js');

        expect(source).toMatch(/chooseStudentCourseSection[\s\S]*invalidateStudentRegistrationViewCache\(\)/);
        expect(source).toMatch(/unselectCourseGroup\(courseId, groupId\);[\s\S]*invalidateStudentRegistrationViewCache\(\)/);
        expect(enrollment).toContain('invalidateStudentRegistrationViewCache()');
        expect(enrollment).toMatch(/function selectCourseGroup[\s\S]*invalidateStudentRegistrationViewCache\(\)/);
        expect(enrollment).toMatch(/function removeStudentCourseEnrollment[\s\S]*invalidateStudentRegistrationViewCache\(\)/);
        expect(enrollment).toMatch(/function unselectCourseGroup[\s\S]*invalidateStudentRegistrationViewCache\(\)/);
    });

    it('aligns schedule session helpers with effective student role', () => {
        const state = readSource('assets/js/app/state.js');

        expect(state).toContain('function resolveStudentScheduleSessionUser()');
        expect(state).toMatch(/resolveStudentScheduleSessionUser\(\)[\s\S]*getEffectiveUserRole/);
        expect(state).toMatch(/function getCurrentStudentSchedule\(\) \{[\s\S]*resolveStudentScheduleSessionUser\(\)/);
        expect(state).toMatch(/function setCurrentStudentSchedule\(schedule\) \{[\s\S]*resolveStudentScheduleSessionUser\(\)/);
        expect(state).not.toMatch(/function getCurrentStudentSchedule\(\) \{[\s\S]*currentUser\.role !== USER_ROLES\.STUDENT/);
        expect(state).not.toMatch(/function setCurrentStudentSchedule\(schedule\) \{[\s\S]*currentUser\.role !== USER_ROLES\.STUDENT/);
    });
});
