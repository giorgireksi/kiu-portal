import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('planner legacy delegation regressions', () => {
    it('keeps legacy scheduler and broad-calendar interactions on delegated hooks', () => {
        const schedulerSource = readSource('assets/js/pages/admin-scheduler.js');
        const timetableSource = readSource('assets/js/pages/timetable-runtime.js');

        expect(schedulerSource).toContain('document.addEventListener(\'click\'');
        expect(schedulerSource).toContain('document.addEventListener(\'input\'');
        expect(schedulerSource).toContain('[data-scheduler-session-action]');
        expect(schedulerSource).toContain('[data-scheduler-day-add]');
        expect(schedulerSource).toContain('[data-scheduler-preset-remove]');
        expect(schedulerSource).toContain('[data-scheduler-staff-picker-person]');
        expect(schedulerSource).not.toContain('onclick=');
        expect(schedulerSource).not.toContain('onmouseenter=');
        expect(schedulerSource).not.toContain('onmouseleave=');
        expect(timetableSource).toContain('function bindPlannerScheduleSurfaceDelegates()');
        expect(timetableSource).toContain('document.addEventListener(\'click\', handlePlannerScheduleSurfaceClick)');
        expect(timetableSource).toContain('[data-timetable-week-shift]');
        expect(timetableSource).toContain('[data-schedule-current-week');
        expect(timetableSource).toContain('[data-schedule-open-lms]');
        expect(timetableSource).toContain('function renderScheduleControls');
        expect(timetableSource).not.toContain('onclick=');
        expect(timetableSource).not.toMatch(/Ã|â€”|ï¿½/);
    });
});
