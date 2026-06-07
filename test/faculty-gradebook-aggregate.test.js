import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('faculty gradebook aggregate roster', () => {
    const gradebook = readSource('assets/js/pages/gradebook.js');
    const messenger = readSource('assets/js/shared/messenger.js');
    const appJs = readSource('assets/js/app/app.js');

    it('extends group lookup with optional filter overrides', () => {
        expect(messenger).toContain('function getGradebookGroupsForCurrentUser(filterOverrides = null)');
        expect(messenger).toContain('filterOverrides?.semester');
        expect(appJs).toContain('getGradebookGroupsForCurrentUser(filterOverrides = null)');
    });

    it('merges students and tracks enrollments for faculty saves', () => {
        const buildFn = gradebook.match(/function buildFacultyGradebookAggregateRoster\([\s\S]*?\n}\n/);
        expect(buildFn?.[0]).toBeTruthy();
        expect(buildFn[0]).toContain('facultyGradebookEnrollmentByStudentId');
        expect(buildFn[0]).toContain('_gradebookEnrollments');
        expect(buildFn[0]).toContain('buildGradebookStudents');
        expect(buildFn[0]).toContain('studentMap');
    });

    it('fans out score persistence across matching roster keys', () => {
        const persistFn = gradebook.match(/function persistStudentEvaluationEntry\([\s\S]*?\n}\n/);
        expect(persistFn?.[0]).toContain('persistStudentEvaluationEntryOnRoster');
        expect(persistFn[0]).toContain('rosterKeys.forEach');
        expect(gradebook).toContain('refreshGradebookAfterStaffScoreChange');
        expect(gradebook).toMatch(/function refreshGradebookAfterStaffScoreChange[\s\S]*?loadFacultyGradebookAggregateRoster/);
    });

    it('populates cascading subject and group filters', () => {
        expect(gradebook).toContain('function populateFacultyGradebookFilters()');
        expect(gradebook).toContain('function populateFacultyGradebookGroupFilter()');
        expect(gradebook).toContain("target.id === 'fs-filter-subject'");
    });

    it('caps compact score history and supports expand toggle', () => {
        const panelFn = gradebook.match(/function renderGradebookScoreHistoryPanel\([\s\S]*?\n}\n/);
        expect(panelFn?.[0]).toContain('compactCap');
        expect(panelFn[0]).toContain('toggle-score-history');
        expect(gradebook).toContain("action === 'toggle-score-history'");
    });
});
