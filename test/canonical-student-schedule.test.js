import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('canonical student schedule shape', () => {
    it('normalizes object-shaped schedules before building enrollments', () => {
        const state = readSource('assets/js/app/state.js');
        expect(state).toContain('normalizeStudentScheduleValue(schedule).map(item => ({');
        expect(state).toContain('hasEntryShape');
    });

    it('coerces object groupId like the portal server normalize', () => {
        const state = readSource('assets/js/app/state.js');
        expect(state).toContain("typeof value.groupId === 'string' || typeof value.groupId === 'number'");
        expect(state).toContain('(value.groupName || \'\')');
        expect(state).toContain('if (!groupId && /^\\d+$/.test(courseId)) return false');
    });
});
