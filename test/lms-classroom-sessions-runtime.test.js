import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('lms-classroom-sessions-runtime peel', () => {
    it('owns next-session + marker preview helpers via factory', () => {
        const main = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        const peel = readSource('assets/js/pages/lms-classroom-sessions-runtime.js');
        expect(main).toContain('getLmsNextSessionForGroup');
        expect(main).not.toMatch(/^\s*function getLmsSessionScheduleForWeek\b/m);
        expect(main).not.toMatch(/^\s*function renderLmsNextSessionHtml\b/m);
        expect(peel).toContain('function getLmsSessionScheduleForWeek');
        expect(peel).toContain('function renderLmsNextSessionHtml');
        expect(peel).toContain('__kiuCreateLmsClassroomSessionsApi');
        expect(peel).toContain('__KIU_LMS_CLASSROOM_SESSIONS_LOADED');
        expect(peel).toContain('Object.assign(window, api)');
    });

    it('loads before classroom tabs on lms.html and keeps whiteboard URLs', () => {
        const html = readSource('lms.html');
        const tabs = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        expect(html.indexOf('lms-classroom-sessions-runtime.js'))
            .toBeLessThan(html.indexOf('lms-classroom-tabs-runtime.js'));
        expect(tabs).toContain('assets/js/pages/lms-whiteboard-runtime.js?v=20260719-wbchrome1');
        expect(tabs).toContain('assets/js/pages/lms-whiteboard-chrome-runtime.js?v=20260719-wbchrome1');
    });
});
