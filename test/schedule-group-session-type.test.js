import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function loadFacultySessionTypeHelpers() {
    const facultySource = readSource('assets/js/shared/faculty-schedule-runtime.js');
    const vm = require('vm');
    const context = {
        console,
        KIU_STATE: { availableGroups: {} }
    };
    vm.createContext(context);
    const stubs = `
        function normalizeFacultyCode(value, fallback = 'ECON') {
            return String(value || fallback || 'ECON').trim().toUpperCase() || 'ECON';
        }
        function deriveFacultyFromSubjectId() { return 'ECON'; }
        function normalizeTimeString(value) { return String(value || '09:00'); }
        function convertTimeToMinutes() { return 540; }
        function minutesToTimeString() { return '11:50'; }
        function formatLocalDateISO() { return '2026-01-05'; }
        function getWeekStartDate(value) { return value || new Date(); }
        function parseLocalDate(value) { return value || new Date(); }
        function normalizeScheduleDayLabel(value) { return String(value || 'Monday'); }
        function extractScheduleTime() { return '09:00'; }
        function repairScheduleDisplayText(value) { return String(value || ''); }
        function compareWeekStartISO() { return 0; }
        function isGroupActiveForWeek() { return true; }
    `;
    const fnBlock = [
        stubs,
        facultySource.match(/function normalizeScheduleGroup\(subjectId, group\) \{[\s\S]*?\n\}/)?.[0],
        facultySource.match(/function inferSchedulerSessionType\(professor = '', ta = '', explicitType = ''\) \{[\s\S]*?\n\}/)?.[0],
        facultySource.match(/function migrateAvailableGroupsSessionTypes\(\) \{[\s\S]*?\n\}/)?.[0]
    ].filter(Boolean).join('\n\n');
    vm.runInContext(fnBlock, context);
    return context;
}

describe('schedule group session type classification', () => {
    it('classifies TA-only rows as seminar even when stored as lecture', () => {
        const { normalizeScheduleGroup } = loadFacultySessionTypeHelpers();
        const normalized = normalizeScheduleGroup('ECON101', {
            id: 'g2',
            name: 'G2',
            sessionType: 'lecture',
            prof: '',
            ta: 'QA TA Alpha'
        });
        expect(normalized.sessionType).toBe('seminar');
    });

    it('keeps professor-led rows on the lecture tab', () => {
        const { normalizeScheduleGroup } = loadFacultySessionTypeHelpers();
        const normalized = normalizeScheduleGroup('ECON101', {
            id: 'g1',
            name: 'G1',
            sessionType: 'lecture',
            prof: 'QA Prof Alpha',
            ta: ''
        });
        expect(normalized.sessionType).toBe('lecture');
    });

    it('treats rows with both instructors as lecture sessions', () => {
        const { normalizeScheduleGroup } = loadFacultySessionTypeHelpers();
        const normalized = normalizeScheduleGroup('ECON101', {
            id: 'g3',
            name: 'G3',
            sessionType: 'seminar',
            prof: 'QA Prof Alpha',
            ta: 'QA TA Alpha'
        });
        expect(normalized.sessionType).toBe('lecture');
    });

    it('infers scheduler session type from instructor roster before dropdown default', () => {
        const { inferSchedulerSessionType } = loadFacultySessionTypeHelpers();
        expect(inferSchedulerSessionType('TBD', 'QA TA Alpha', 'lecture')).toBe('seminar');
        expect(inferSchedulerSessionType('QA Prof Alpha', 'TBD', 'seminar')).toBe('lecture');
        expect(inferSchedulerSessionType('QA Prof Alpha', 'QA TA Alpha', 'seminar')).toBe('seminar');
    });

    it('migrates misclassified availableGroups session types on hydrate', () => {
        const ctx = loadFacultySessionTypeHelpers();
        ctx.KIU_STATE.availableGroups = {
            ECON101: [{
                id: 'g2',
                name: 'G2',
                sessionType: 'lecture',
                prof: '',
                ta: 'QA TA Alpha'
            }]
        };
        const updated = ctx.migrateAvailableGroupsSessionTypes();
        expect(updated).toBe(1);
        expect(ctx.KIU_STATE.availableGroups.ECON101[0].sessionType).toBe('seminar');
    });

    it('checks TA-only assignment before trusting stored lecture labels', () => {
        const facultySource = readSource('assets/js/shared/faculty-schedule-runtime.js');
        const normalizeFn = facultySource.match(
            /function normalizeScheduleGroup\(subjectId, group\) \{[\s\S]*?\n\}/
        )?.[0] || '';
        const taOnlyIndex = normalizeFn.indexOf('hasAssignedTa && !hasAssignedProf');
        const lectureLabelIndex = normalizeFn.indexOf("rawSessionType.includes('lecture')");
        expect(taOnlyIndex).toBeGreaterThan(-1);
        expect(lectureLabelIndex).toBeGreaterThan(-1);
        expect(taOnlyIndex).toBeLessThan(lectureLabelIndex);
    });
});