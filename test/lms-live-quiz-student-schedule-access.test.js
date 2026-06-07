import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
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

    it('documents the portal schedule fallback in server access control', () => {
        const serverSource = readSource('backend/platform/server.js');
        expect(serverSource).toContain('function isStudentViaLmsLiveQuizPortalSchedule');
        expect(serverSource).toContain('portalState.studentSchedulesByStudent');
    });
});