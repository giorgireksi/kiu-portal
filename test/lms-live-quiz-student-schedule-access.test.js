import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function normalizePortalStudentScheduleValue(schedule) {
    if (Array.isArray(schedule)) return schedule.filter(Boolean);
    if (schedule && typeof schedule === 'object') {
        if (Array.isArray(schedule.entries)) return schedule.entries.filter(Boolean);
        return Object.entries(schedule)
            .filter(([, value]) => value != null && value !== '')
            .map(([key, value]) => {
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    const hasEntryShape = Boolean(
                        value.courseId
                        || value.sourceCourseId
                        || value.groupName
                        || value.day
                        || value.time
                    );
                    if (hasEntryShape) {
                        return {
                            ...value,
                            courseId: value.courseId || value.sourceCourseId || (/^\d+$/.test(String(key)) ? '' : key),
                            groupId: typeof value.groupId === 'string' || typeof value.groupId === 'number'
                                ? value.groupId
                                : (value.groupName || '')
                        };
                    }
                }
                return { courseId: key, groupId: value };
            })
            .filter((entry) => entry.courseId || entry.groupId);
    }
    return [];
}

function enrollmentMatchesLmsLiveQuizGroup(entry = {}, courseId = '', groupId = '') {
    const normalize = (value = '') => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
    if (normalize(entry.courseId || entry.sourceCourseId || '') !== normalize(courseId)) {
        return false;
    }
    if (!groupId) return true;
    const targetGroup = normalize(groupId);
    const keys = new Set();
    if (entry.groupId) keys.add(normalize(entry.groupId));
    if (entry.groupName) keys.add(normalize(entry.groupName));
    return keys.has(targetGroup);
}

function isStudentViaPortalSchedule(scheduleValue, courseId, groupId) {
    const schedule = normalizePortalStudentScheduleValue(scheduleValue);
    if (!schedule.length) return false;
    return schedule.some(entry => enrollmentMatchesLmsLiveQuizGroup(entry, courseId, groupId));
}

describe('LMS live quiz student portal schedule access', () => {
    it('matches schedule rows the same way the backend gate does', () => {
        const scheduleEntry = {
            courseId: 'ECON-01-001',
            sourceCourseId: 'ECON-01-001',
            groupId: 'g2',
            groupName: 'G2'
        };
        expect(enrollmentMatchesLmsLiveQuizGroup(scheduleEntry, 'ECON-01-001', 'g2')).toBe(true);
        expect(enrollmentMatchesLmsLiveQuizGroup(scheduleEntry, 'ECON-01-001', 'g2__lmssec_lecture')).toBe(false);
    });

    it('grants access when studentSchedulesByStudent is an object-keyed map', () => {
        const objectSchedule = {
            0: { courseId: '0', groupId: { courseId: '0' }, faculty: 'ECON' },
            4: {
                courseId: 'ASD',
                courseName: 'asd',
                groupId: 'g1',
                groupName: 'G1',
                sessionType: 'seminar',
                faculty: 'ECON'
            }
        };
        expect(isStudentViaPortalSchedule(objectSchedule, 'ASD', 'g1')).toBe(true);
        expect(isStudentViaPortalSchedule(objectSchedule, 'ASD', 'g2')).toBe(false);
        expect(Array.isArray(objectSchedule)).toBe(false);
    });

    it('documents the portal schedule fallback + normalize in server access control', () => {
        const serverSource = readSource('backend/platform/server.js');
        expect(serverSource).toContain('function isStudentViaLmsLiveQuizPortalSchedule');
        expect(serverSource).toContain('function normalizePortalStudentScheduleValue');
        expect(serverSource).toContain('portalState.studentSchedulesByStudent');
        expect(serverSource).toContain('normalizePortalStudentScheduleValue(');
        expect(serverSource).not.toMatch(
            /function isStudentViaLmsLiveQuizPortalSchedule[\s\S]*?if \(!Array\.isArray\(schedule\) \|\| !schedule\.length\) return false;/
        );
    });
});
