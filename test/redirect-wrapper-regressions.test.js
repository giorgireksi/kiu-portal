import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readAsset(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function countInlineScripts(source) {
    return [...source.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>/gi)].length;
}

function countExternalScripts(source) {
    return [...source.matchAll(/<script\b[^>]*\bsrc=/gi)].length;
}

function countStylesheets(source) {
    return [...source.matchAll(/<link\b[^>]*\brel=["']stylesheet["'][^>]*>/gi)].length;
}

describe('Redirect wrapper regressions', () => {
    it('keeps calendar.html as a zero-runtime alias to timetable.html', () => {
        const calendarHtml = readAsset('calendar.html');
        const navigationJs = readAsset('assets/js/features/navigation.js');
        const stateJs = readAsset('assets/js/app/state.js');

        expect(navigationJs).toContain("'calendar': 'calendar.html'");
        expect(stateJs).not.toContain("'calendar'");
        expect(calendarHtml).toContain('url=timetable.html');
        expect(calendarHtml).toContain("window.location.replace('timetable.html');");
        expect(countInlineScripts(calendarHtml)).toBe(1);
        expect(countExternalScripts(calendarHtml)).toBe(0);
        expect(countStylesheets(calendarHtml)).toBe(5);
        expect(calendarHtml).not.toContain('assets/js/');
        expect(calendarHtml).toContain('assets/css/lux-tokens.css');
        expect(calendarHtml).toContain('assets/css/lux-surfaces.css');
        expect(calendarHtml).toContain('assets/css/lux-controls.css');
        expect(calendarHtml).toContain('assets/css/lux-layout-primitives.css');
        expect(calendarHtml).toContain('assets/css/redirect-route.css');
        expect(calendarHtml).not.toContain('fonts.googleapis.com');
        expect(calendarHtml).not.toContain('fontawesome');
        expect(calendarHtml).not.toContain('lux-unified-shell');
        expect(calendarHtml).not.toContain('kiu-shell-loading');
        expect(calendarHtml).not.toContain('id="prof-nav"');
    });

    it('keeps gradebook.html as a zero-runtime alias to faculty-gradebook.html', () => {
        const gradebookHtml = readAsset('gradebook.html');
        const navigationJs = readAsset('assets/js/features/navigation.js');
        const stateJs = readAsset('assets/js/app/state.js');

        expect(navigationJs).toContain("'gradebook': 'gradebook.html'");
        expect(stateJs).not.toContain("'gradebook'");
        expect(gradebookHtml).toContain('url=faculty-gradebook.html');
        expect(gradebookHtml).toContain("window.location.replace('faculty-gradebook.html');");
        expect(countInlineScripts(gradebookHtml)).toBe(1);
        expect(countExternalScripts(gradebookHtml)).toBe(0);
        expect(countStylesheets(gradebookHtml)).toBe(5);
        expect(gradebookHtml).not.toContain('assets/js/');
        expect(gradebookHtml).toContain('assets/css/lux-tokens.css');
        expect(gradebookHtml).toContain('assets/css/lux-surfaces.css');
        expect(gradebookHtml).toContain('assets/css/lux-controls.css');
        expect(gradebookHtml).toContain('assets/css/lux-layout-primitives.css');
        expect(gradebookHtml).toContain('assets/css/redirect-route.css');
        expect(gradebookHtml).not.toContain('fonts.googleapis.com');
        expect(gradebookHtml).not.toContain('fontawesome');
        expect(gradebookHtml).not.toContain('lux-unified-shell');
        expect(gradebookHtml).not.toContain('kiu-shell-loading');
        expect(gradebookHtml).not.toContain('mobile-bottom-nav');
        expect(gradebookHtml).not.toContain('mobile-action-sheet');
        expect(gradebookHtml).not.toContain('initMobileExperience');
        expect(gradebookHtml).not.toContain('id="prof-nav"');
    });

    it('keeps faculty-schedule.html as a zero-runtime alias to timetable.html', () => {
        const facultyScheduleHtml = readAsset('faculty-schedule.html');
        const navigationJs = readAsset('assets/js/features/navigation.js');
        const stateJs = readAsset('assets/js/app/state.js');

        expect(navigationJs).toContain("'faculty-schedule': 'faculty-schedule.html'");
        expect(stateJs).toContain("'faculty-schedule'");
        expect(stateJs).toContain("'timetable'");
        expect(facultyScheduleHtml).toContain('url=timetable.html');
        expect(facultyScheduleHtml).toContain("window.location.replace('timetable.html');");
        expect(countInlineScripts(facultyScheduleHtml)).toBe(1);
        expect(countExternalScripts(facultyScheduleHtml)).toBe(0);
        expect(countStylesheets(facultyScheduleHtml)).toBe(5);
        expect(facultyScheduleHtml).not.toContain('assets/js/');
        expect(facultyScheduleHtml).toContain('assets/css/lux-tokens.css');
        expect(facultyScheduleHtml).toContain('assets/css/lux-surfaces.css');
        expect(facultyScheduleHtml).toContain('assets/css/lux-controls.css');
        expect(facultyScheduleHtml).toContain('assets/css/lux-layout-primitives.css');
        expect(facultyScheduleHtml).toContain('assets/css/redirect-route.css');
        expect(facultyScheduleHtml).not.toContain('fonts.googleapis.com');
        expect(facultyScheduleHtml).not.toContain('fontawesome');
        expect(facultyScheduleHtml).not.toContain('lux-unified-shell');
        expect(facultyScheduleHtml).not.toContain('kiu-shell-loading');
        expect(facultyScheduleHtml).not.toContain('mobile-bottom-nav');
        expect(facultyScheduleHtml).not.toContain('mobile-action-sheet');
        expect(facultyScheduleHtml).not.toContain('id="prof-nav"');
    });
});
