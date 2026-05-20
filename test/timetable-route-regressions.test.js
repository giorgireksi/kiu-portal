import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('timetable route regressions', () => {
    it('keeps the timetable html free of inline control handlers and dead studio fallback markup', () => {
        const html = readSource('timetable.html');
        const timetableRuntime = readSource('assets/js/pages/timetable-runtime.js');
        const inlineHandlerMatches = html.match(/on(click|input|change|mouseover|mouseout|mouseenter|mouseleave)=/g) || [];

        expect(inlineHandlerMatches).toHaveLength(0);
        expect(html).not.toContain('id="modal-studio"');
        expect(html).not.toContain('<style>');
        expect(html).toContain('assets/css/timetable-route.css');
        expect(html).toContain('assets/js/pages/timetable-runtime.js?v=20260516-surface-split1');
        expect(html).not.toContain('assets/js/pages/planner.js');
        expect(html).toContain('<nav id="prof-nav" aria-label="Professor navigation stub"');
        expect(html).toContain('<nav id="top-nav" aria-label="Top navigation stub"');
        expect(html).toContain('<nav id="admin-nav" aria-label="Admin navigation stub"');
        expect(html).toContain('data-timetable-filter="semester"');
        expect(html).toContain('data-timetable-filter="faculty"');
        expect(html).toContain('data-timetable-week-shift="-1"');
        expect(html).toContain('data-timetable-week-shift="1"');
        expect(html).toContain('data-timetable-action="current-week"');
        expect(html).not.toContain('â€”');
        expect((html.match(/id="timetable-insight-next"/g) || [])).toHaveLength(1);
        expect(html).toContain('Management &amp; Business');
        expect(html).toContain('Arts &amp; Humanities');
        expect(html).toContain('class="fas fa-circle timetable-stage-status-dot"');
        expect(html).toContain('<button class="mob-sheet-btn" type="button" id="mob-act-admin"><span class="mob-sheet-icon"');
        expect(html).not.toContain('<button class="mob-sheet-btn" id="mob-act-admin"><div class="mob-sheet-icon"');
        expect(html).toContain('function bindTimetableStaticControls()');
        expect(html).not.toContain('session-modal');
        expect(html).not.toContain('schedule-drawer');
        expect(timetableRuntime).toContain('function ensureScheduleSurfaceRegions(container) {');
        expect(timetableRuntime).toContain("const { frame } = showScheduleSurfaceFrame(container);");
        expect(timetableRuntime).toContain("container.dataset.scheduleSurfaceView = view;");
        expect(timetableRuntime).toContain('function renderTimetable() {');
        expect(timetableRuntime).toContain('emptyMessage: `No timetable sessions found for ${formatWeekRangeLabel(weekStart)}.`');
        expect(timetableRuntime).not.toContain('schedule-session-modal');
    });

    it('uses deterministic mobile hook wiring instead of navigate polling', () => {
        const html = readSource('timetable.html');

        expect(html).toContain("function ensureNavigateHooks(){if(typeof window.navigate!=='function')return false;hookNav();buildRoleNav();return true}");
        expect(html).toContain("window.addEventListener('load',ensureNavigateHooks,{once:true});");
        expect(html).not.toContain("var ht=setInterval(function(){if(typeof window.navigate==='function')");
    });
});
