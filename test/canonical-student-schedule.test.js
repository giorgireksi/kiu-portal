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

    it('repairs non-array studentSchedulesByStudent during ensureCanonicalState', () => {
        const state = readSource('assets/js/app/state.js');
        expect(state).toContain('if (!Array.isArray(schedule)) {');
        expect(state).toContain('KIU_STATE.studentSchedulesByStudent[studentId] = normalizeStudentScheduleValue(schedule);');
    });
});
