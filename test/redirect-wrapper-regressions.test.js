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

function expectRedirectDietStack(html) {
    expect(countStylesheets(html)).toBe(3);
    expect(html).toContain('assets/css/lux-tokens.css');
    expect(html).toContain('assets/css/lux-controls.css');
    expect(html).toContain('assets/css/redirect-route.css');
    expect(html).not.toContain('assets/css/lux-surfaces.css');
    expect(html).not.toContain('assets/css/lux-focus-panel.css');
    expect(html).not.toContain('lux-summary-surface');
    expect(html).not.toContain('lux-status-pill');
    expect(html).not.toContain('assets/css/lux-layout-primitives.css');
}

describe('Redirect wrapper regressions', () => {
    it('keeps calendar.html as a zero-runtime alias to timetable.html', () => {
        const calendarHtml = readAsset('calendar.html');
        const navigationJs = readAsset('assets/js/features/navigation.js');
        const stateJs = readAsset('assets/js/app/state.js');

        expect(navigationJs).toContain("if (normalizedPageId === 'calendar') return 'timetable';");
        expect(navigationJs).toContain("'calendar': 'alias-redirect'");
        expect(stateJs).not.toContain("'calendar'");
        expect(calendarHtml).toContain('url=timetable.html');
        expect(calendarHtml).toContain("window.location.replace('timetable.html');");
        expect(countInlineScripts(calendarHtml)).toBe(1);
        expect(countExternalScripts(calendarHtml)).toBe(0);
        expectRedirectDietStack(calendarHtml);
        expect(calendarHtml).not.toContain('assets/js/');
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
        expectRedirectDietStack(gradebookHtml);
        expect(gradebookHtml).not.toContain('assets/js/');
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
        expectRedirectDietStack(facultyScheduleHtml);
        expect(facultyScheduleHtml).not.toContain('assets/js/');
        expect(facultyScheduleHtml).not.toContain('fonts.googleapis.com');
        expect(facultyScheduleHtml).not.toContain('fontawesome');
        expect(facultyScheduleHtml).not.toContain('lux-unified-shell');
        expect(facultyScheduleHtml).not.toContain('kiu-shell-loading');
        expect(facultyScheduleHtml).not.toContain('mobile-bottom-nav');
        expect(facultyScheduleHtml).not.toContain('mobile-action-sheet');
        expect(facultyScheduleHtml).not.toContain('id="prof-nav"');
    });

    it('keeps profile.html as a zero-runtime alias to personal-data.html', () => {
        const profileHtml = readAsset('profile.html');
        expect(profileHtml).toContain('url=personal-data.html');
        expect(profileHtml).toContain("window.location.replace('personal-data.html');");
        expect(countInlineScripts(profileHtml)).toBe(1);
        expect(countExternalScripts(profileHtml)).toBe(0);
        expectRedirectDietStack(profileHtml);
    });
});
