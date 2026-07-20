import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('calendar ui regressions', () => {
    it('keeps calendar route as timetable redirect and drops dead calendar island from ui.js', () => {
        const uiSource = readSource('assets/js/features/ui.js');
        const calendarHtml = readSource('calendar.html');
        const timetableHtml = readSource('timetable.html');

        // Route ownership: calendar is a redirect stub, not a live workspace.
        expect(calendarHtml).toMatch(/timetable\.html|location\.replace|meta[^>]+refresh/i);
        expect(timetableHtml.length).toBeGreaterThan(0);

        // Dead island removed (no product callers; calendar.html no longer hosts #calendar-root).
        expect(uiSource).not.toContain('function bindCalendarDelegates(root)');
        expect(uiSource).not.toContain('function renderCalendarPage()');
        expect(uiSource).not.toContain('function switchCalendarTab(tab)');
        expect(uiSource).not.toContain('function calculateMatrix()');
        expect(uiSource).not.toContain('function openBatchComm(');
        expect(uiSource).not.toContain('function toggleProfileMenu(');

        // Live shared modal helpers for registration/programs remain.
        expect(uiSource).toContain('function ensureProgramsModal()');
        expect(uiSource).toContain('function ensureLuxModalsCss()');
        expect(uiSource).toContain('function showProgramCourses()');
        expect(uiSource).toContain('function openModal_ensureCss(');
    });
});
