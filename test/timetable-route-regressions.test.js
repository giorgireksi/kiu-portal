import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('timetable route regressions', () => {
    it('keeps the timetable html free of inline control handlers and dead studio fallback markup', () => {
        const html = readSource('timetable.html');
        const timetableRuntime = readSource('assets/js/pages/timetable-runtime.js');
        const navigationSource = readSource('assets/js/features/navigation.js');
        const layoutCss = readSource('assets/css/layout-schedule.css');
        const boardCss = readSource('assets/css/layout-schedule-board.css');
        const themePrimer = readSource('assets/js/theme-primer.js');
        const utilities = readSource('assets/js/shared/utilities.js');
        const timetableStructuralBranch = utilities.slice(
            utilities.indexOf("document.body.classList.contains('lux-route-timetable')"),
            utilities.indexOf("document.body.classList.contains('lux-route-profile-view')")
        );
        const inlineHandlerMatches = html.match(/on(click|input|change|mouseover|mouseout|mouseenter|mouseleave)=/g) || [];

        expect(inlineHandlerMatches).toHaveLength(0);
        expect(html).not.toContain('id="modal-studio"');
        expect(html).not.toContain('<style>');
        expect(html).not.toContain('timetable-route.css');
        expect(html).toContain('lux-page-bare');
        expect(html).toContain('assets/js/theme-primer.js?v=20260604-styleguard2');
        expect(html).toMatch(/lux-shell\.css/);
        expect(html).toMatch(/lux-page-bare-lite\.css/);
        expect(html).not.toMatch(/lux-page-bare\.css(?!-lite)/);
        expect(html).not.toContain('index-luxury.css');
        expect(html).toContain('lux-shell.css');
        expect(html).toContain('lux-shell.css');
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).not.toMatch(/lux-page-bare\.css(?!-lite)/);
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).toContain('assets/js/shared/utilities.js?v=');
        expect(html).toContain('assets/js/pages/timetable-runtime.js?v=20260717-softchrome1');
        expect(html).toContain('assets/js/features/navigation.js?v=20260605-ttboot1');
        expect(html).not.toContain('assets/js/pages/planner.js');
        expect(html).toContain('<nav id="prof-nav" aria-label="Professor navigation stub"');
        expect(html).toContain('<nav id="top-nav" aria-label="Top navigation stub"');
        expect(html).toContain('<nav id="admin-nav" aria-label="Admin navigation stub"');
        expect(html).toContain('data-timetable-filter="semester"');
        expect(html).toContain('data-timetable-filter="faculty"');
        expect(html).toContain('data-timetable-week-shift="-1"');
        expect(html).toContain('data-timetable-week-shift="1"');
        expect(html).toContain('data-schedule-current-week="1"');
        expect(html).toContain('data-schedule-view="sessions"');
        expect(html).toContain('data-schedule-view="timetable"');
        expect(html).toContain('function ensureTimetableRouteReady()');
        expect(html).toContain('window.__timetableStaticControlsBound');
        expect(html).toContain('class="lux-timetable-view-switcher lux-card"');
        expect(html).not.toContain('lux-soft-chrome');
        expect(html).toContain('class="schedule-week-nav lux-timetable-week-nav lux-card"');
        expect(html).not.toContain('lux-timetable-next-compact');
        expect(html).not.toContain('id="timetable-insight-next"');
        expect(html).toContain('class="lux-timetable-hero-focus lux-hero-side"');
        expect(html).toContain('Your next class');
        expect(html).toContain('lux-timetable-focus-subline');
        expect(html).toContain('id="timetable-hero-focus-time"');
        expect(html).toContain('id="timetable-hero-focus-facts"');
        expect(html).toContain('class="lux-timetable-focus-head"');
        expect(html).toContain('lux-timetable-hero');
        expect(html).toContain('class="lux-card lux-timetable-command"');
        expect(html).toContain('class="lux-card lux-timetable-stage"');
        expect(html).not.toContain('â€”');
        expect(html).not.toContain('id="timetable-insight-next-time"');
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
        expect(timetableRuntime).toContain('function getScheduleToneToken(facultyCode) {');
        expect(timetableRuntime).toContain('function buildScheduleToneDataAttribute(facultyCode) {');
        expect(timetableRuntime).not.toContain('lux-soft-chrome');
        expect(timetableRuntime).toContain('schedule-session-card lux-timetable-session-card');
        expect(timetableRuntime).toContain('function renderTimetable() {');
        expect(timetableRuntime).toContain('[data-schedule-current-week], [data-timetable-action="current-week"]');
        expect(timetableRuntime).toContain('currentWeekButton.dataset.scheduleCurrentWeek = \'1\'');
        expect(navigationSource).toContain("activePageId === 'timetable' && typeof window.renderTimetable === 'function'");
        expect(navigationSource).toContain('window.__kiuStandaloneRouteContentBootKey = bootKey');
        expect(navigationSource).toContain('refreshStandaloneDesktopRouteContent(pageId, { reason: \'standalone-default-content\' })');
        expect(timetableRuntime).toContain('emptyMessage: `No timetable sessions found for ${formatWeekRangeLabel(weekStart)}.`');
        expect(timetableRuntime).not.toContain('schedule-session-modal');
        expect(timetableRuntime).toContain("shell.className = `schedule-grid-shell lux-timetable-grid-shell");
        expect(timetableRuntime).toContain("shell.dataset.ttGrid = '1'");
        expect(timetableRuntime).toContain('queueLuxuryTransparencyRefresh');
        expect(timetableRuntime).toContain("toggle.className = 'schedule-view-switcher lux-timetable-view-switcher';");
        expect(timetableRuntime).toContain("weekNav.className = 'schedule-week-nav lux-timetable-week-nav';");
        expect(timetableRuntime).toContain("overviewRow.className = 'schedule-overview-row lux-timetable-overview-row';");
        expect(timetableRuntime).toContain('class="schedule-chip lux-status-pill lux-timetable-chip"');
        expect(timetableRuntime).toContain("shell.style.setProperty('--sch-shell-min-height',");
        expect(timetableRuntime).toContain("body.style.setProperty('--sch-body-min-height',");
        expect(timetableRuntime).toContain("section.className = 'schedule-day-section lux-timetable-day-section';");
        expect(timetableRuntime).toContain('class="sch-time-slot lux-timetable-time-slot" style="--sch-slot-height:');
        expect(timetableRuntime).toContain('class="sch-slot-bg lux-timetable-slot-bg" style="--sch-slot-height:');
        expect(timetableRuntime).toContain('class="schedule-now-line" style="--sch-now-top:');
        expect(timetableRuntime).toContain('class="schedule-session-grid lux-timetable-session-grid${dayItems.length >= 4 ? \' lux-timetable-session-grid--dense\' : \'\'}"');
        expect(timetableRuntime).toContain('class="schedule-session-card lux-timetable-session-card${markerClass}"');
        expect(timetableRuntime).toContain('class="schedule-session-code-row lux-timetable-session-code-row"');
        expect(timetableRuntime).toContain('class="schedule-session-code lux-timetable-session-code"');
        expect(timetableRuntime).toContain('class="schedule-session-pill lux-timetable-session-pill type"');
        expect(timetableRuntime).toContain('class="schedule-session-title lux-timetable-session-title"');
        expect(timetableRuntime).toContain('class="schedule-session-subtitle lux-timetable-session-subtitle"');
        expect(timetableRuntime).toContain('formatTimetableHeroFocusTitle(item)');
        expect(timetableRuntime).toContain('lux-timetable-session-grid--dense');
        expect(timetableRuntime).toContain('class="schedule-session-meta-row lux-timetable-session-meta-row"');
        expect(timetableRuntime).toContain('class="lux-secondary-btn schedule-session-action lux-timetable-session-action"');
        expect(timetableRuntime).toContain('class="sch-time-col lux-timetable-time-col"');
        expect(timetableRuntime).toContain('class="sch-day-col lux-timetable-day-col ${isToday ? \'today\' : \'\'}"');
        expect(timetableRuntime).toContain('dayLanes.className = \'sch-day-lanes lux-timetable-day-lanes\';');
        expect(timetableRuntime).toContain('class="sch-lane lux-timetable-lane"');
        expect(timetableRuntime).toContain("board.className = 'schedule-sessions-board lux-timetable-sessions-board';");
        expect(timetableRuntime).toContain('class="ev-draft sch-week-badge lux-timetable-week-badge" ${toneAttr}>WEEK</div>');
        expect(timetableRuntime).toContain('class="sch-event lux-timetable-event${markerClass}" ${toneAttr} style="--sch-event-top:');
        expect(timetableRuntime).toContain('class="sch-event-topline lux-timetable-event-topline"');
        expect(timetableRuntime).toContain('class="sch-event-code lux-timetable-event-code"');
        expect(timetableRuntime).toContain('class="sch-event-pill lux-timetable-event-pill"');
        expect(timetableRuntime).toContain('class="ev-title lux-timetable-event-title"');
        expect(timetableRuntime).toContain('class="ev-meta lux-timetable-event-meta"');
        expect(timetableRuntime).toContain("showScheduleSurfaceEmpty(container, emptyMessage, 'schedule-grid-empty lux-timetable-grid-empty');");
        expect(timetableRuntime).not.toContain('kiu-btn-blue');
        expect(timetableRuntime).not.toContain('kiu-btn-outline');
        expect(timetableRuntime).not.toContain('style="height:${slotHeight}px; cursor:default;"');
        expect(timetableRuntime).not.toContain('style="top:${nowTopPx}px;"');
        expect(timetableRuntime).not.toContain('style="background:${color};"');
        expect(timetableRuntime).not.toContain('style="--sch-week-badge-bg:');
        expect(timetableRuntime).not.toContain('--sch-event-line:${color}');
        expect(layoutCss).toContain('body:not(.lux-route-timetable) .sch-time-col');
        expect(html).toContain('layout-schedule-board.css');
        expect(boardCss).toContain('.schedule-sessions-board');
        expect(layoutCss).not.toContain('.schedule-sessions-board');
        expect(existsSync(join(process.cwd(), 'assets/css/admin-scheduler-route.css'))).toBe(false);
        // Multi-panel shells on panel tokens (timetable blueprint).
            /\.lux-timetable-command[\s\S]*?\.lux-timetable-stage[\s\S]*?background:\s*var\(--tt-fade-surface\)/
        );
        expect(timetableRuntime).toContain('function formatTimetableHeroFocusTitle(session)');
        expect(timetableRuntime).toContain('function renderTimetableHeroFocusPanel(');
        expect(timetableRuntime).toContain('function renderTimetableHeroFocusFacts(session');
        expect(timetableRuntime).not.toContain('timetable-insight-next');
        expect(timetableRuntime).not.toContain('renderTimetableNextCompactFacts');
        expect(existsSync(join(process.cwd(), 'assets/css/index-luxury.css'))).toBe(false);
        expect(timetableStructuralBranch).toContain("el.classList.contains('lux-timetable-hero')");
        expect(timetableStructuralBranch).toContain("el.classList.contains('lux-timetable-command')");
        expect(timetableStructuralBranch).toContain("el.classList.contains('lux-timetable-session-card')");
        expect(utilities).toContain('const isTimetableGridCell = (el) => {');
        expect(utilities).toContain('TIMETABLE_GRID_CELL_CLASS_NAMES');
        expect(utilities).toContain('isTimetableGridCell(el) ||');
        expect(utilities).toContain('.lux-timetable-grid-shell, .schedule-grid-shell[data-tt-grid="1"]');
        expect(utilities).not.toContain('const isTimetableLargeSurface');
        expect(utilities).not.toContain('if (isTimetableLargeSurface)');
        expect(utilities).not.toContain("'.lux-timetable-command', '.lux-timetable-insight'");
        expect(utilities).toContain('const isTimetableLayoutWrapper = (el) => document.body.classList.contains(\'lux-route-timetable\')');
        expect(utilities).toContain("el.classList.contains('lux-timetable-controls')");
        expect(utilities).toContain("el.classList.contains('schedule-toolbar-host')");
        expect(themePrimer).toContain("document.body.classList.contains('lux-route-timetable')");
        expect(themePrimer).toContain('applyFlatSurfaceOverrides');
        expect(html).not.toContain('function flattenTimetableControlRows()');
        expect(html).not.toContain('setTimeout(flattenTimetableControlRows, 700);');
    });

    it('keeps timetable on the shared standalone mobile shell contract instead of navigate polling', () => {
        const html = readSource('timetable.html');

        expect(html).toContain('window.__KIU_STANDALONE_MOBILE_SHELL_CONFIG = {');
        expect(html).toContain("activeTarget: 'timetable'");
        expect(html).toContain('assets/js/pages/standalone-mobile-shell.js?v=20260520-timetable-mobile1');
        expect(html).not.toContain('(function initMobileExperience(){');
        expect(html).not.toContain("var ht=setInterval(function(){if(typeof window.navigate==='function')");
    });

    it('paints soft-chrome / focus tier matte without nested blur', () => {
            /\.lux-soft-chrome[\s\S]{0,800}backdrop-filter:\s*none\s*!important/
        );
        // focus listed in soft matte :is() with backdrop-filter: none
            /Soft chrome \/ focus matte[\s\S]{0,1200}backdrop-filter:\s*none\s*!important/
        );
    });
});
