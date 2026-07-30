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
        const luxTransparency = readSource('assets/js/shared/lux-transparency.js');
        const structuralStart = luxTransparency.indexOf('const isStructuralSurface = (el) =>');
        const timetableStructuralBranch = luxTransparency.slice(
            structuralStart,
            luxTransparency.indexOf("(document.body.classList.contains('lux-route-registration')", structuralStart)
        );
        const inlineHandlerMatches = html.match(/on(click|input|change|mouseover|mouseout|mouseenter|mouseleave)=/g) || [];

        expect(inlineHandlerMatches).toHaveLength(0);
        expect(html).not.toContain('id="modal-studio"');
        expect(html).not.toContain('<style>');
        expect(html).not.toContain('timetable-route.css');
        expect(html).toContain('lux-page-bare');
        expect(html).toContain('assets/js/theme-primer.js?v=20260730-navpreload1');
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
        expect(html).toContain('assets/js/pages/timetable-runtime.js?v=20260729-ttgrid1');
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
        expect(html).toContain('class="lux-timetable-view-switcher home-hover-chip"');
        expect(html).not.toContain('lux-soft-chrome');
        expect(html).toContain('class="schedule-week-nav lux-timetable-week-nav home-hover-chip"');
        expect(html).not.toMatch(/lux-timetable-overview-row[^>]*lux-card|lux-card[^>]*lux-timetable-overview-row/);
        expect(html).not.toMatch(/lux-timetable-view-switcher[^>]*lux-card|lux-card[^>]*lux-timetable-view-switcher/);
        expect(html).not.toMatch(/lux-timetable-week-nav[^>]*lux-card|lux-card[^>]*lux-timetable-week-nav/);
        expect(html).not.toContain('lux-timetable-next-compact');
        expect(html).not.toContain('id="timetable-insight-next"');
        expect(html).toContain('class="lux-timetable-hero-focus lux-hero-side lux-focus-panel home-hover-chip"');
        expect(html).toContain('page-hero-badge lux-pill lux-timetable-hero-badge home-hover-chip');
        expect(html).toContain('lux-focus-panel__chip lux-timetable-focus-time home-hover-chip');
        expect(html).toContain('class="schedule-chip lux-status-pill home-hover-chip is-muted lux-timetable-chip"');
        expect(html).toContain('lux-timetable-focus-subline');
        expect(html).toContain('id="timetable-hero-focus-time"');
        expect(html).toContain('id="timetable-hero-focus-facts"');
        expect(html).toContain('class="lux-timetable-focus-head"');
        expect(html).toContain('lux-timetable-hero');
        expect(html).toContain('class="lux-card lux-timetable-command home-hover-chip"');
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
        expect(timetableRuntime).toContain('sch-empty-week-notice lux-soft-chrome');
        expect(timetableRuntime).toContain('schedule-session-card lux-timetable-session-card');
        expect(timetableRuntime).toContain('function renderTimetable() {');
        expect(timetableRuntime).toContain('[data-schedule-current-week], [data-timetable-action="current-week"]');
        expect(timetableRuntime).toContain('currentWeekButton.dataset.scheduleCurrentWeek = \'1\'');
        expect(navigationSource).toContain("activePageId === 'timetable' && typeof window.renderTimetable === 'function'");
        expect(navigationSource).toContain('window.__kiuStandaloneRouteContentBootKey = bootKey');
        expect(navigationSource).toContain('refreshStandaloneDesktopRouteContent(pageId, { reason: \'standalone-default-content\' })');
        expect(timetableRuntime).toContain('emptyMessage: `No timetable sessions found for ${formatWeekRangeLabel(weekStart)}.`');
        expect(timetableRuntime).not.toContain('schedule-session-modal');
        expect(timetableRuntime).toContain("shell.className = `sch-grid-shell");
        expect(timetableRuntime).toContain("shell.dataset.luxGlassRoot = '1'");
        expect(timetableRuntime).toContain("shell.dataset.ttGrid = '1'");
        expect(timetableRuntime).toContain('sch-grid-topline');
        expect(timetableRuntime).toContain('timetable-grid-week-label');
        expect(timetableRuntime).toContain('sch-grid-root');
        expect(timetableRuntime).toContain('sch-time-col--header');
        expect(timetableRuntime).toContain('sch-day-col-label');
        expect(timetableRuntime).toContain('sch-time-slot-copy');
        expect(timetableRuntime).toContain("is-today");
        expect(timetableRuntime).toContain("shell.style.setProperty('--sch-slot-height'");
        expect(timetableRuntime).toContain("shell.style.setProperty('--sch-slot-count'");
        expect(timetableRuntime).toContain('queueLuxuryTransparencyRefresh');
        expect(timetableRuntime).toContain('lux-timetable-view-switcher home-hover-chip');
        expect(timetableRuntime).toContain('lux-timetable-week-nav home-hover-chip');
        expect(timetableRuntime).toContain('lux-timetable-overview-row home-hover-chip');
        expect(timetableRuntime).toContain('lux-timetable-day-section home-hover-chip');
        expect(timetableRuntime).toContain('lux-timetable-session-card home-hover-chip');
        expect(timetableRuntime).toContain('home-hover-chip ${emptyClassName}');
        expect(timetableRuntime).toContain('class="schedule-chip lux-status-pill home-hover-chip is-muted lux-timetable-chip"');
        expect(timetableRuntime).not.toContain("shell.style.setProperty('--sch-shell-min-height',");
        expect(timetableRuntime).not.toContain("body.style.setProperty('--sch-body-min-height',");
        expect(timetableRuntime).toContain("section.className = 'schedule-day-section lux-timetable-day-section home-hover-chip';");
        expect(timetableRuntime).toContain('class="sch-time-slot"><span class="sch-time-slot-copy"');
        expect(timetableRuntime).toContain('class="sch-slot-bg"');
        expect(timetableRuntime).toContain('class="schedule-now-line" style="--sch-now-top:');
        expect(timetableRuntime).toContain('class="schedule-session-grid lux-timetable-session-grid${dayItems.length >= 4 ? \' lux-timetable-session-grid--dense\' : \'\'}"');
        expect(timetableRuntime).toContain('class="schedule-session-card lux-timetable-session-card home-hover-chip${markerClass}"');
        expect(timetableRuntime).toContain('class="schedule-session-code-row lux-timetable-session-code-row"');
        expect(timetableRuntime).toContain('class="schedule-session-code lux-timetable-session-code"');
        expect(timetableRuntime).toContain('class="schedule-session-pill lux-timetable-session-pill home-hover-chip type"');
        expect(timetableRuntime).toContain('class="schedule-session-title lux-timetable-session-title"');
        expect(timetableRuntime).toContain('class="schedule-session-subtitle lux-timetable-session-subtitle"');
        expect(timetableRuntime).toContain('formatTimetableHeroFocusTitle(item)');
        expect(timetableRuntime).toContain('lux-timetable-session-grid--dense');
        expect(timetableRuntime).toContain('class="schedule-session-meta-row lux-timetable-session-meta-row"');
        expect(timetableRuntime).toContain('class="lux-secondary-btn schedule-session-action lux-timetable-session-action"');
        expect(timetableRuntime).toContain('class="sch-day-col${isToday ? \' is-today\' : \'\'}"');
        expect(timetableRuntime).toContain('dayLanes.className = \'sch-day-lanes\'');
        expect(timetableRuntime).toContain('class="sch-lane"');
        expect(timetableRuntime).not.toContain('lux-timetable-day-lanes');
        expect(timetableRuntime).toContain("board.className = 'schedule-sessions-board lux-timetable-sessions-board';");
        expect(timetableRuntime).toContain('<div class="ev-draft">WEEK</div>');
        expect(timetableRuntime).toContain('class="sch-event${markerClass}" ${toneAttr} style="--sch-event-top:');
        expect(timetableRuntime).toContain('data-sch-event-tone=');
        expect(timetableRuntime).not.toContain('lux-timetable-event');
        expect(timetableRuntime).toContain('buildTimetableEmptyWeekNotice');
        expect(timetableRuntime).toContain('sch-empty-week-notice');
        expect(timetableRuntime).not.toMatch(
            /renderUnifiedWeeklyScheduleGrid[\s\S]*?showScheduleSurfaceEmpty\(container, emptyMessage/
        );
        expect(timetableRuntime).toContain('syncTimetableFilterDefaults');
        expect(timetableRuntime).toContain('KIU_STATE.activeSemester');
        expect(timetableRuntime).toContain('syncTimetableFilterDefaults()');
        expect(timetableRuntime).toContain('lux-primary-btn');
        expect(timetableRuntime).toContain('lux-secondary-btn');
        expect(timetableRuntime).not.toContain('style="height:${slotHeight}px; cursor:default;"');
        expect(timetableRuntime).not.toContain('style="top:${nowTopPx}px;"');
        expect(timetableRuntime).not.toContain('style="background:${color};"');
        expect(timetableRuntime).not.toContain('style="--sch-week-badge-bg:');
        expect(timetableRuntime).not.toContain('--sch-event-line:${color}');
        expect(layoutCss).toContain('body:not(.lux-route-timetable):not(.lux-route-admin-scheduler) .sch-time-col');
        expect(html).toContain('layout-schedule-board.css');
        expect(boardCss).toContain('.schedule-sessions-board');
        expect(layoutCss).not.toContain('.schedule-sessions-board');
        expect(existsSync(join(process.cwd(), 'assets/css/admin-scheduler-route.css'))).toBe(false);
        expect(timetableRuntime).toContain('function formatTimetableHeroFocusTitle(session)');
        expect(timetableRuntime).toContain('function renderTimetableHeroFocusPanel(');
        expect(timetableRuntime).toContain('lux-hero-signal home-hover-chip');
        expect(timetableRuntime).toContain('function renderTimetableHeroFocusFacts(session');
        expect(timetableRuntime).not.toContain('timetable-insight-next');
        expect(timetableRuntime).not.toContain('renderTimetableNextCompactFacts');
        expect(existsSync(join(process.cwd(), 'assets/css/index-luxury.css'))).toBe(false);
        expect(timetableStructuralBranch).toContain('isCssOwnedSurface(el)');
        expect(timetableStructuralBranch).not.toContain("el.classList.contains('lux-timetable-session-card')");
        expect(luxTransparency).toContain('const isTimetableGridCell = (el) => {');
        expect(luxTransparency).toContain('TIMETABLE_GRID_CELL_CLASS_NAMES');
        expect(luxTransparency).toContain('isTimetableGridCell(el) ||');
        expect(luxTransparency).toContain('.sch-grid-shell[data-tt-grid="1"]');
        expect(luxTransparency).not.toContain('const isTimetableLargeSurface');
        expect(luxTransparency).not.toContain('if (isTimetableLargeSurface)');
        expect(luxTransparency).not.toContain("'.lux-timetable-command', '.lux-timetable-insight'");
        expect(luxTransparency).toContain('const isTimetableLayoutWrapper = (el) => document.body.classList.contains(\'lux-route-timetable\')');
        expect(luxTransparency).toContain("el.classList.contains('lux-timetable-controls')");
        expect(luxTransparency).toContain("el.classList.contains('schedule-toolbar-host')");
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

    it('marks layout-only shell and glass-root grid host', () => {
        const html = readSource('timetable.html');
        const runtime = readSource('assets/js/pages/timetable-runtime.js');
        expect(html).toContain('data-lux-layout-only="1"');
        expect(html).not.toMatch(/lux-timetable-stage[\s\S]*data-lux-glass-root="1"/);
        expect(runtime).toContain("shell.dataset.luxGlassRoot = '1'");
    });

    it('uses shared layout primitives and typography in static shell', () => {
        const html = readSource('timetable.html');
        expect(html).toContain('ttgrid1');
        expect(html).toContain('lux-timetable-command home-hover-chip');
        expect(html).toContain('lux-timetable-filters home-hover-chip');
        expect(html).toContain('lux-timetable-view-switcher home-hover-chip');
        expect(html).toContain('lux-timetable-week-nav home-hover-chip');
        expect(html).toContain('lux-timetable-overview-row schedule-overview-row home-hover-chip');
        expect(html).toContain('lux-layout-primitives.css');
        expect(html).toContain('lux-section-kicker lux-page-kicker');
        expect(html).toContain('lux-card-copy lux-card-meta');
        expect(html).toContain('lux-route-field-label');
        expect(html).toMatch(/id="tt-filter-sem"[^>]*lux-control|class="[^"]*lux-control[^"]*"[^>]*id="tt-filter-sem"/);
        expect(html).not.toMatch(/id="tt-filter-sem"[\s\S]*?<option value="1" selected>/);
        expect(html).toContain('id="timetable-stage-copy" class="lux-card-copy"');
    });

    it('bare-lite timetable block is layout-only', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const ttBlock = bare.split('/* ── Timetable route')[1]?.split('/* ── Staff / students hub')[0] || '';
        expect(ttBlock).toContain('body.lux-route-timetable .lux-timetable-page');
        expect(ttBlock).toContain('body.lux-route-timetable .lux-timetable-command-grid');
        expect(ttBlock).not.toMatch(/backdrop-filter/);
        expect(bare).not.toContain('--tt-fade-');
    });

    it('shared layout primitives define timetable text roles', () => {
        const primitives = readSource('assets/css/lux-layout-primitives.css');
        expect(primitives).toContain('.lux-page-kicker');
        expect(primitives).toContain('.lux-card-meta');
        expect(primitives).toContain('.schedule-empty-title');
        expect(primitives).toContain('.schedule-empty-copy');
    });

    it('fouc-ht matte paints timetable hero inners and stage session cards', () => {
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(fouc).toMatch(/body\.lux-route-timetable \.lux-timetable-page :is\(/);
        expect(fouc).toContain('.lux-timetable-command');
        expect(fouc).toContain('.lux-timetable-session-card');
    });

    it('runtime empty state uses shared empty text primitives', () => {
        const runtime = readSource('assets/js/pages/timetable-runtime.js');
        expect(runtime).toContain('lux-empty-state__title schedule-empty-title');
        expect(runtime).toContain('lux-empty-state__copy schedule-empty-copy');
        expect(runtime).not.toMatch(/showScheduleSurfaceEmpty\(container, `\s*<div class="schedule-empty-state">/);
    });

    it('uses page-hero glass host and shared panel chrome markup', () => {
        const html = readSource('timetable.html');
        expect(html).toContain('page-hero lux-hero lux-timetable-hero');
        expect(html).toMatch(/lux-timetable-stage-status[^"]*lux-status-pill home-hover-chip is-muted/);
        expect(html).not.toContain('lux-soft-chrome');
    });

    it('fouc-ht matte covers page lux-card shells and stage empty states', () => {
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(fouc).toMatch(/body\.lux-route-timetable \.lux-timetable-page \.lux-card:not\(\[data-lux-glass-root="1"\]\)/);
        expect(fouc).toContain('.schedule-empty-state');
        expect(fouc).toContain('.schedule-grid-empty');
        expect(fouc).toContain('.schedule-day-section');
    });

    it('shares admin scheduler grid layout and paint with timetable route', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(bare).toContain(':is(#page-admin-scheduler, #page-timetable) .sch-grid-shell');
        expect(bare).toContain(':is(#page-admin-scheduler #scheduler-grid, #page-timetable #timetable-grid)');
        expect(bare).toContain('body.lux-route-timetable #page-timetable .sch-grid-shell');
        expect(fouc).toMatch(/:is\(body\.lux-route-admin-scheduler #page-admin-scheduler, body\.lux-route-timetable #page-timetable\) \.sch-header-row/);
    });

    it('fouc-ht resets timetable page shell motion and chips lift on hover/touch', () => {
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(fouc).toContain('.lux-timetable-command');
        expect(fouc).toContain('.lux-timetable-session-card');
        expect(fouc).toMatch(/\.home-hover-chip[\s\S]*var\(--home-chip-hover-lift/);
        expect(fouc).toMatch(/:is\(\.page-hero, \[data-lux-glass-root="1"\]\):not\(\.home-hover-chip\)[\s\S]*transition:\s*none/);
        const ttBlock = fouc.split('/* Timetable + registration pages')[1]?.split('/* Picker hosts are layout-only')[0] || '';
        expect(ttBlock).not.toMatch(/@media \(hover: hover\)[\s\S]*\.lux-timetable-command[\s\S]*:active[\s\S]*translate3d\(0,\s*0,\s*0\)/);
    });

    it('shared layout primitives define schedule chip typography', () => {
        const primitives = readSource('assets/css/lux-layout-primitives.css');
        expect(primitives).toContain('.lux-status-pill.lux-timetable-chip');
        expect(primitives).toContain('font-size: 12px');
        expect(primitives).toContain('font-weight: 700');
        expect(primitives).toContain('.lux-timetable-hero-badge');
        expect(primitives).toContain('border-radius: 999px');
        const board = readSource('assets/css/layout-schedule-board.css');
        expect(board).toMatch(/\.schedule-chip\s*\{\s*padding:/);
        expect(board).not.toMatch(/\.schedule-chip\s*\{[^}]*font-size/);
    });

    it('fouc-ht does not treat picker fields as timetable matte hover shells', () => {
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        const ttBlock = fouc.split('/* Timetable + registration pages')[1]?.split('/* Picker hosts are layout-only')[0] || '';
        expect(ttBlock).not.toContain('.lux-picker-field,');
        expect(fouc).toContain('.lux-timetable-page .lux-picker-field');
        expect(fouc).toMatch(/body\.lux-unified-shell :is\([\s\S]*\.home-hover-chip[\s\S]*>\s*\*:not\(\.lux-picker-panel\)/);
    });

    it('timetable page panels avoid corner text clip and hero badges use pill matte', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(bare).toContain('body.lux-route-timetable .lux-timetable-hero.page-hero');
        expect(bare).toMatch(/lux-timetable-hero-main[\s\S]*overflow:\s*visible/);
        expect(bare).toContain('body.lux-route-timetable .lux-timetable-hero-focus');
        expect(bare).toContain('body.lux-route-timetable .lux-timetable-stage');
        expect(bare).toContain('max-width: 56ch');
        expect(fouc).toMatch(/body\.lux-route-timetable \.lux-timetable-page :is\(\.page-hero-badge\.home-hover-chip, \.lux-timetable-hero-badge\.home-hover-chip\)[\s\S]*border-radius:\s*999px/);
        expect(fouc).toContain('.lux-timetable-hero-focus .lux-hero-signal.home-hover-chip');
        expect(fouc).toContain('.lux-timetable-hero-focus .lux-focus-panel__chip.home-hover-chip');
        expect(fouc).toMatch(/body\.lux-route-timetable \.lux-timetable-page[\s\S]*overflow:\s*visible/);
    });
});
