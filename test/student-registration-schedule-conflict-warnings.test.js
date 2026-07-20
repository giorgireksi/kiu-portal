import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function loadEnrollmentConflictHelpers() {
    const enrollmentSource = readSource('assets/js/pages/registration-enrollment.js');
    const vm = require('vm');
    const context = {
        console,
        canonicalCourseKey: (value) => String(value || '').trim().toUpperCase(),
        convertTimeToMinutes: (timeStr) => {
            const match = String(timeStr || '').match(/(\d{1,2}):(\d{2})/);
            if (!match) return NaN;
            return (Number(match[1]) * 60) + Number(match[2]);
        },
        normalizeScheduleDayLabel: (value, fallback = '') => String(value || fallback || '').trim()
    };
    vm.createContext(context);
    const fnBlock = [
        enrollmentSource.match(/function normalizeStudentScheduleDayKey\(day\) \{[\s\S]*?\n\}/)?.[0],
        enrollmentSource.match(/function resolveStudentScheduleInterval\(entry\) \{[\s\S]*?\n\}/)?.[0],
        enrollmentSource.match(/function studentScheduleEntriesOverlap\(left, right\) \{[\s\S]*?\n\}/)?.[0],
        enrollmentSource.match(/function findStudentEnrollmentScheduleConflict\(schedule, courseId, normalizedGroup\) \{[\s\S]*?\n\}/)?.[0]
    ].filter(Boolean).join('\n\n');
    vm.runInContext(fnBlock, context);
    return context;
}

describe('student registration schedule conflict warnings', () => {
    it('detects interval overlap on the same day', () => {
        const ctx = loadEnrollmentConflictHelpers();
        const schedule = [{
            courseId: 'ECON101',
            courseName: 'Microeconomics',
            groupId: 'g1',
            groupName: 'G1',
            day: 'Monday',
            time: '10:00',
            duration: '110min',
            sessionType: 'lecture'
        }];
        const conflict = ctx.findStudentEnrollmentScheduleConflict(schedule, 'ECON102', {
            day: 'Monday',
            time: '10:30',
            duration: '110min',
            sessionType: 'seminar'
        });
        expect(conflict?.groupName).toBe('G1');
    });

    it('allows replacing the same course and session type bucket', () => {
        const ctx = loadEnrollmentConflictHelpers();
        const schedule = [{
            courseId: 'ECON101',
            groupId: 'g1',
            day: 'Monday',
            time: '10:00',
            sessionType: 'lecture'
        }];
        const conflict = ctx.findStudentEnrollmentScheduleConflict(schedule, 'ECON101', {
            day: 'Monday',
            time: '10:00',
            sessionType: 'lecture'
        });
        expect(conflict).toBeNull();
    });

    it('does not block enrollment after schedule-conflict audit', () => {
        const enrollmentSource = readSource('assets/js/pages/registration-enrollment.js');
        const selectFn = enrollmentSource.match(/function selectCourseGroup\(courseId, courseName, groupId\) \{[\s\S]*?\n\}/)?.[0] || '';
        expect(selectFn).toContain('findStudentEnrollmentScheduleConflict');
        expect(selectFn).toContain('warningOnly: true');
        expect(selectFn).not.toMatch(/scheduleConflict[\s\S]*?alert\(/);
        expect(selectFn).not.toMatch(/schedule-conflict[\s\S]*?return false/);
        expect(selectFn).toContain('return { ok: true, conflict: scheduleConflict || null }');
    });

    it('shows overlap warning only on Choose click, not in picker UI', () => {
        const registrationSource = readSource('assets/js/pages/student-registration.js');
        expect(registrationSource).not.toContain('function getStudentCourseSectionScheduleConflict');
        expect(registrationSource).not.toContain('has-schedule-conflict');
        expect(registrationSource).not.toContain('registration-section-picker-conflict-note');
        expect(registrationSource).not.toContain('Some sections overlap your current timetable');
        expect(registrationSource).toContain('formatStudentScheduleConflictChooseConfirm');
    });

    it('exports shared conflict helpers on window', () => {
        const enrollmentSource = readSource('assets/js/pages/registration-enrollment.js');
        expect(enrollmentSource).toContain('window.findStudentEnrollmentScheduleConflict = findStudentEnrollmentScheduleConflict');
        expect(enrollmentSource).toContain('window.formatStudentScheduleConflictWarning = formatStudentScheduleConflictWarning');
        expect(enrollmentSource).toContain('window.formatStudentScheduleConflictChooseConfirm = formatStudentScheduleConflictChooseConfirm');
    });

    it('does not treat back-to-back sessions as overlap', () => {
        const ctx = loadEnrollmentConflictHelpers();
        const schedule = [{
            courseId: 'ECON101',
            groupName: 'G1',
            day: 'Monday',
            time: '10:00',
            duration: '110min',
            sessionType: 'lecture'
        }];
        const conflict = ctx.findStudentEnrollmentScheduleConflict(schedule, 'ECON102', {
            day: 'Monday',
            time: '11:50',
            duration: '110min',
            sessionType: 'seminar'
        });
        expect(conflict).toBeNull();
    });

    it('persists endTime on student schedule entries', () => {
        const enrollmentSource = readSource('assets/js/pages/registration-enrollment.js');
        const selectFn = enrollmentSource.match(/function selectCourseGroup\(courseId, courseName, groupId\) \{[\s\S]*?\n\}/)?.[0] || '';
        expect(selectFn).toContain('endTime: normalizedGroup.endTime');
    });

    it('confirms overlap on Choose before calling selectCourseGroup', () => {
        const registrationSource = readSource('assets/js/pages/student-registration.js');
        const chooseFn = registrationSource.match(/function chooseStudentCourseSection\(courseId, groupId\) \{[\s\S]*?\n\}/)?.[0] || '';
        const selectIndex = chooseFn.indexOf('selectCourseGroup(');
        const conflictIndex = chooseFn.indexOf('findStudentEnrollmentScheduleConflict');
        expect(conflictIndex).toBeGreaterThan(-1);
        expect(conflictIndex).toBeLessThan(selectIndex);
        expect(chooseFn).toContain('window.confirm');
        expect(chooseFn).toContain('formatStudentScheduleConflictChooseConfirm');
        expect(chooseFn).not.toMatch(/selectCourseGroup[\s\S]*?showToast/);
    });
});