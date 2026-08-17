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
        const foucCss = readSource('assets/css/lux-fouc-ht.css');
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
        expect(html).toContain('assets/js/theme-primer.js?v=20260817-shellfirst2');
        expect(html).toMatch(/lux-shell\.css/);
        expect(html).toMatch(/lux-page-bare-lite\.css/);
        expect(html).not.toMatch(/lux-page-bare\.css(?!-lite)/);
        expect(html).not.toContain('index-luxury.css');
        expect(html).toContain('lux-shell.css');
        expect(html).toContain('lux-shell.css');
        expect(html).toContain('lux-page-bare-lite.css?v=20260806-tttoolscollapse1');
        expect(html).not.toMatch(/lux-page-bare\.css(?!-lite)/);
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).toContain('assets/js/shared/utilities.js?v=');
        expect(html).toContain('assets/js/pages/timetable-runtime.js?v=20260815-bootstrap-schedule2');
        expect(html).toContain('data-timetable-toggle-command');
        expect(html).toContain('id="timetable-command-collapse"');
        expect(html).toContain('class="lux-timetable-command-collapse"');
        expect(html).toContain('[data-timetable-toggle-command]');
        expect(html).toContain('assets/js/features/navigation.js?v=20260817-timetableboot1');
        expect(html).not.toContain('assets/js/pages/planner.js');
        expect(html).toContain('<nav id="prof-nav" aria-label="Professor navigation stub"');
        expect(html).toContain('<nav id="top-nav" aria-label="Top navigation stub"');
        expect(html).toContain('<nav id="admin-nav" aria-label="Admin navigation stub"');
        expect(html).not.toContain('data-timetable-filter="semester"');
        expect(html).not.toContain('data-timetable-filter="faculty"');
        expect(html).not.toContain('id="timetable-filters"');
        expect(html).not.toContain('id="tt-filter-sem"');
        expect(html).not.toContain('id="tt-filter-fac"');
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
        expect(html).toContain('class="lux-timetable-hero-focus lux-timetable-command-focus lux-hero-side lux-focus-panel home-hover-chip"');
        expect(html).not.toContain('page-hero-meta lux-pill-row');
        expect(html).not.toContain('timetable-page-copy');
        expect(html).not.toContain('lux-timetable-hero-badge');
        expect(html).not.toContain('timetable-hero-sem-badge');
        expect(html).not.toContain('lux-timetable-hero-main');
        expect(html).not.toContain('timetable-page-kicker');
        expect(html).not.toContain('timetable-page-title');
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
        expect(timetableRuntime).toContain('let timetableCommandCollapsed = null');
        expect(timetableRuntime).toContain('function ensureTimetableCommandCollapsed()');
        expect(timetableRuntime).toContain('function applyTimetableCommandCollapsed()');
        expect(timetableRuntime).toContain('window.toggleTimetableCommandTools');
        expect(timetableRuntime).toContain("matchMedia('(max-width: 920px)')");
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
        expect(timetableRuntime).toContain("shell.querySelectorAll(':scope > .sch-grid-topline')");
        expect(timetableRuntime).not.toContain('function renderTimetableGridTopline');
        expect(timetableRuntime).not.toContain('timetable-grid-week-label');
        expect(timetableRuntime).not.toContain('timetable-grid-week-current');
        expect(timetableRuntime).not.toContain('GMT+4');
        expect(timetableRuntime).toContain('sch-weeklist-root');
        expect(timetableRuntime).toContain('sch-day-col-label');
        expect(timetableRuntime).not.toContain("timeLabels.className = 'sch-time-labels'");
        expect(timetableRuntime).not.toContain('timeLabelHtml');
        expect(timetableRuntime).not.toContain('sch-time-col--header');
        expect(timetableRuntime).toContain("is-today");
        expect(timetableRuntime).not.toContain("shell.style.setProperty('--sch-slot-height'");
        expect(timetableRuntime).not.toContain("shell.style.setProperty('--sch-slot-count'");
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
        expect(timetableRuntime).not.toContain('class="sch-slot-bg"');
        expect(timetableRuntime).not.toContain('class="schedule-now-line" style="--sch-now-top:');
        expect(timetableRuntime).toContain('class="schedule-session-grid lux-timetable-session-grid${dayItems.length >= 4 ? \' lux-timetable-session-grid--dense\' : \'\'}"');
        expect(timetableRuntime).toContain('class="schedule-session-card lux-timetable-session-card home-hover-chip${markerClass}"');
        expect(timetableRuntime).toContain('schedule-session-context-row');
        expect(timetableRuntime).not.toContain('schedule-session-code');
        expect(timetableRuntime).toContain('const hasPanelHeader = Boolean(item.roleBadge || marker || facultyActionsEnabled)');
        expect(timetableRuntime).toContain('lms-session-panel-kicker">Session details');
        expect(timetableRuntime).toContain('schedule-session-identity');
        expect(timetableRuntime).toContain('function getLmsSessionCourseName(item)');
        expect(timetableRuntime).toContain('getDomain()');
        expect(timetableRuntime).toContain('getActiveCurriculum(facultyCode)');
        expect(timetableRuntime).toContain('function renderLmsSessionDetails(item, options = {})');
        expect(timetableRuntime).toContain("renderLmsSessionDetails(item, { surface: 'session' })");
        expect(timetableRuntime).toContain("renderLmsSessionDetails(item, { surface: 'timetable' })");
        expect(timetableRuntime).toContain('lms-session-details--timetable');
        expect(timetableRuntime).toContain('lms-session-details--session');
        expect(timetableRuntime).toContain('lms-session-summary');
        expect(timetableRuntime).toContain('lms-session-detail-grid');
        expect(timetableRuntime).toContain('fas fa-book-open');
        expect(timetableRuntime).toContain('fas fa-hourglass-half');
        expect(timetableRuntime).toContain('lms-session-summary-item--duration');
        expect(timetableRuntime).toContain("row('Hours:', hours, 'far fa-clock')");
        expect(timetableRuntime).toContain("row('Type:', type, 'fas fa-tag')");
        expect(timetableRuntime).toContain("row('Duration:', duration, 'fas fa-hourglass-half')");
        expect(timetableRuntime).not.toContain('<strong>Hours:</strong>');
        expect(timetableRuntime).not.toContain('<strong>Duration:</strong>');
        expect(timetableRuntime).toContain('Hours:');
        expect(timetableRuntime).toContain('Educational course:');
        expect(timetableRuntime).toContain('Professor:');
        expect(timetableRuntime).toContain('Audience:');
        expect(timetableRuntime).toContain('Duration:');
        expect(timetableRuntime).toContain('Comment:');
        expect(timetableRuntime).not.toContain('class="ev-title"');
        expect(layoutCss).not.toContain('.ev-title');
        expect(foucCss).not.toContain('.ev-title');
        expect(timetableRuntime).not.toContain('schedule-session-focus');
        expect(timetableRuntime).not.toContain('schedule-session-meta-row');
        expect(timetableRuntime).not.toContain('schedule-session-pill lux-timetable-session-pill home-hover-chip type');
        expect(timetableRuntime).toContain('lux-timetable-session-grid--dense');
        expect(timetableRuntime).toContain('class="lux-secondary-btn schedule-session-action lux-timetable-session-action"');
        expect(timetableRuntime).toContain('class="headInfo sch-weeklist-day${isToday ? \' is-today\' : \'\'}"');
        expect(timetableRuntime).toContain('weeklist-container sch-weeklist-container');
        expect(timetableRuntime).not.toContain('sch-day-lanes');
        expect(timetableRuntime).not.toContain('class="sch-lane"');
        expect(timetableRuntime).not.toContain('lux-timetable-day-lanes');
        expect(timetableRuntime).toContain("board.className = 'schedule-sessions-board lux-timetable-sessions-board';");
        expect(timetableRuntime).toContain('<div class="ev-draft">WEEK</div>');
        expect(timetableRuntime).toContain('class="sch-event weeklist-item sch-weeklist-item${markerClass}" ${toneAttr}');
        expect(timetableRuntime).not.toContain('class="lms-session-panel-head"');
        expect(timetableRuntime).toContain('data-sch-event-tone=');
        expect(timetableRuntime).not.toMatch(
            /<div class="ev-meta"><i class="fas fa-building"><\/i>/
        );
        expect(foucCss).toContain('position: relative');
        expect(foucCss).toContain('height: auto');
        expect(foucCss).toContain('white-space: normal');
        expect(foucCss).toContain('text-overflow: clip');
        expect(timetableRuntime).not.toContain('lux-timetable-event');
        expect(timetableRuntime).toContain('buildTimetableEmptyWeekNotice');
        expect(timetableRuntime).toContain('sch-empty-week-notice');
        expect(timetableRuntime).not.toMatch(
            /renderUnifiedWeeklyScheduleGrid[\s\S]*?showScheduleSurfaceEmpty\(container, emptyMessage/
        );
        expect(timetableRuntime).not.toContain('syncTimetableFilterDefaults');
        expect(timetableRuntime).toContain('KIU_STATE.activeSemester');
        expect(timetableRuntime).toContain('getCurrentFaculty()');
        expect(timetableRuntime).toContain('lux-primary-btn');
        expect(timetableRuntime).toContain('lux-secondary-btn');
        expect(timetableRuntime).not.toContain('style="height:${slotHeight}px; cursor:default;"');
        expect(timetableRuntime).not.toContain('style="top:${nowTopPx}px;"');
        expect(timetableRuntime).not.toContain('style="background:${color};"');
        expect(timetableRuntime).not.toContain('style="--sch-week-badge-bg:');
        expect(timetableRuntime).not.toContain('--sch-event-line:${color}');
        expect(layoutCss).toContain('body:not(.lux-route-timetable):not(.lux-route-admin-scheduler) .sch-time-col');
        expect(html).toContain('layout-schedule-board.css');
        expect(html).toContain('layout-schedule-board.css?v=20260806-weeklist-inline1');
        expect(boardCss).toContain('.schedule-sessions-board');
        expect(boardCss).toContain('grid-template-columns: minmax(0, 1fr) auto');
        expect(boardCss).toContain('grid-template-columns: repeat(2, minmax(0, 1fr))');
        expect(boardCss).toContain('.schedule-session-grid:has(> .schedule-session-card:first-child)');
        expect(boardCss).toContain('align-self: stretch');
        expect(boardCss).toContain('.schedule-session-grid::after');
        expect(boardCss).not.toContain('grid-column: 1 / 3');
        expect(boardCss).toContain('.lms-session-details');
        expect(boardCss).toContain('.lms-session-details--session');
        expect(boardCss).toContain('.lms-session-details--timetable');
        expect(boardCss).toContain('.schedule-session-card > .lms-session-details:first-child');
        expect(boardCss).not.toContain('.lms-session-panel-kicker');
        expect(boardCss).toContain('.lms-session-detail-row');
        expect(boardCss).toContain('.lms-session-summary-label');
        expect(boardCss).toContain('.lms-session-summary-value');
        expect(boardCss).toContain('.lms-session-details--timetable .lms-session-summary .lms-session-detail-row');
        expect(boardCss).toContain('.lms-session-details--timetable .lms-session-summary .lms-session-detail-label');
        expect(boardCss).toContain('.lms-session-details--timetable .lms-session-summary .lms-session-detail-value');
        expect(boardCss).toContain('font-weight: 800');
        expect(boardCss).toContain('.lms-session-details--timetable .lms-session-detail-label');
        expect(boardCss).toContain('.lms-session-details--timetable .lms-session-detail-value');
        expect(boardCss).toContain('font-size: 12px');
        expect(boardCss).toContain('font-size: 13px');
        expect(boardCss).toContain('grid-template-columns: repeat(3, minmax(0, 1fr))');
        expect(boardCss).toContain('border-bottom: 2px solid color-mix');
        expect(boardCss).toContain('border-right: 2px solid color-mix');
        expect(boardCss).toContain('display: inline');
        expect(boardCss).toContain('display: flex');
        expect(boardCss).toContain('overflow-wrap: anywhere');
        expect(boardCss).toContain('word-break: break-word');
        expect(boardCss).toMatch(/\.lms-session-details--timetable \.lms-session-summary\s*\{[^}]*flex-direction:\s*column/);
        expect(boardCss).toMatch(/\.lms-session-details--timetable \.lms-session-summary \.lms-session-detail-label\s*\{[^}]*display:\s*inline/);
        expect(boardCss).toMatch(/\.lms-session-details--timetable \.lms-session-summary \.lms-session-detail-value\s*\{[^}]*display:\s*inline/);
        expect(boardCss).not.toContain('.lms-session-details--timetable .lms-session-summary-item strong');
        expect(boardCss).toContain('.schedule-session-identity');
        expect(boardCss).toContain('flex-direction: row');
        expect(boardCss).toMatch(/\.schedule-session-identity\s*\{[^}]*flex-direction:\s*column/);
        expect(foucCss).toContain('.lms-session-details--timetable .lms-session-summary .lms-session-detail-label');
        expect(foucCss).toContain('.lms-session-details--timetable .lms-session-summary .lms-session-detail-value');
        expect(foucCss).toMatch(/\.lms-session-details--timetable \.lms-session-summary\s*\{[^}]*flex-direction:\s*column/);
        expect(foucCss).not.toContain('.lms-session-details--timetable .lms-session-summary-item strong');
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

    it('keeps timetable animation work bounded on weak devices and reuses render models', () => {
        const runtime = readSource('assets/js/pages/timetable-runtime.js');
        const loading = readSource('assets/js/pages/timetable-loading-runtime.js');
        const assembly = readSource('assets/js/shared/lux-assembly-loading-runtime.js');
        expect(runtime).toContain('timetableRenderNormalizationCache');
        expect(runtime).toContain('getCachedTimetableWeekEntries');
        expect(runtime).toContain('const dayIndex = new Map');
        expect(loading).toContain('lowEndTimetableDevice');
        expect(loading).toContain("document.body?.classList.add('timetable-low-end')");
        expect(loading).toContain("granularSelector = lowEndTimetableDevice");
        expect(loading).toContain("['#timetable-master-container']");
        expect(loading).toContain('timetable-low-end');
        expect(loading).toContain('disableBlur: lowEndTimetableDevice');
        expect(loading).toContain("maxTotalAssemblyMs: lowEndTimetableDevice ? 1400 : 2450");
        expect(assembly).toContain('const disableBlur = options.disableBlur === true;');
        expect(assembly).toContain("filter: disableBlur ? 'none' : 'blur(.5px)'");
        expect(readSource('assets/js/features/luxury-particle-background.js')).toContain('assemblyBooting');
    });

    it('keeps timetable on the shared standalone mobile shell contract instead of navigate polling', () => {
        const html = readSource('timetable.html');

        expect(html).toContain('window.__KIU_STANDALONE_MOBILE_SHELL_CONFIG = {');
        expect(html).toContain("activeTarget: 'timetable'");
        expect(html).toContain('assets/js/pages/standalone-mobile-shell.js?v=20260816-lms-mobilefix1');
        expect(html).not.toContain('(function initMobileExperience(){');
        expect(html).not.toContain("var ht=setInterval(function(){if(typeof window.navigate==='function')");
    });

    it('marks layout-only shell and glass-root grid host', () => {
        const html = readSource('timetable.html');
        const runtime = readSource('assets/js/pages/timetable-runtime.js');
        expect(html).toContain('data-lux-layout-only="1"');
        expect(html).toMatch(/lux-timetable-stage[\s\S]*data-lux-glass-root="1"/);
        expect(runtime).toContain("shell.dataset.luxGlassRoot = '1'");
        expect(runtime).toContain("kiu:portal-bootstrap-complete");
    });

    it('uses shared layout primitives and typography in static shell', () => {
        const html = readSource('timetable.html');
        expect(html).toContain('ttgrid1');
        expect(html).toContain('lux-timetable-command home-hover-chip');
        expect(html).not.toContain('lux-timetable-filters');
        expect(html).not.toContain('id="tt-filter-sem"');
        expect(html).not.toContain('id="tt-filter-fac"');
        expect(html).toContain('lux-timetable-view-switcher home-hover-chip');
        expect(html).toContain('lux-timetable-week-nav home-hover-chip');
        expect(html).toContain('lux-timetable-overview-row schedule-overview-row home-hover-chip');
        expect(html).toContain('lux-layout-primitives.css');
        expect(html).not.toContain('lux-section-kicker lux-page-kicker');
        expect(html).toContain('lux-card-copy lux-card-meta');
        expect(html).not.toContain('lux-route-field-label');
        expect(html).toContain('id="timetable-stage-copy" class="lux-card-copy"');
    });

    it('bare-lite timetable block is layout-only', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const ttBlock = bare.split('/* ── Timetable route')[1]?.split('/* ── Staff / students hub')[0] || '';
        expect(ttBlock).toContain('body.lux-route-timetable .lux-timetable-page');
        expect(ttBlock).toContain('body.lux-route-timetable .lux-timetable-command-grid');
        expect(ttBlock).toContain('grid-template-columns: minmax(0, 1.35fr) minmax(250px, 0.95fr)');
        expect(ttBlock).not.toContain('lux-timetable-filters');
        expect(ttBlock).toContain('body.lux-route-timetable .lux-timetable-command-focus');
        expect(ttBlock).toContain('body.lux-route-timetable .lux-timetable-command-toggle');
        expect(ttBlock).toContain('min-height: 44px');
        expect(ttBlock).toContain('.lux-timetable-command.is-collapsed .lux-timetable-command-collapse');
        expect(ttBlock).toContain('.lux-timetable-command-collapse.is-collapsed');
        expect(ttBlock).toContain('display: none');
        expect(ttBlock).not.toMatch(/backdrop-filter/);
        expect(bare).not.toContain('--tt-fade-');
    });

    it('keeps timetable week lists single-column while sessions own two slots', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const board = readSource('assets/css/layout-schedule-board.css');
        expect(bare).toContain('.sch-weeklist-items {');
        expect(bare).toContain('display: flex');
        expect(bare).toContain('flex-direction: column');
        expect(bare).not.toMatch(/\.sch-weeklist-items:has/);
        expect(board).toContain('grid-template-columns: repeat(2, minmax(0, 1fr))');
        expect(board).toContain('.schedule-session-grid:has(> .schedule-session-card:first-child)');
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

    it('uses shared timetable panel chrome without a standalone hero', () => {
        const html = readSource('timetable.html');
        expect(html).not.toContain('page-hero lux-hero lux-timetable-hero');
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
        expect(bare).toContain('body.lux-route-timetable .lux-timetable-stage');
        expect(bare).toContain('padding: 20px 0');
        expect(bare).toContain('body.lux-route-timetable #app-content');
        expect(bare).toContain('padding-inline: 0');
        expect(bare).toContain('padding-left: 0 !important');
        expect(bare).toContain('padding-right: 0 !important');
        expect(bare).toContain('body.lux-route-timetable #page-timetable .sch-grid-shell .sch-weeklist-root');
        expect(bare).toContain('body.lux-route-timetable #page-timetable .sch-grid-shell > #timetable-grid');
        expect(bare).toContain('body.lux-route-timetable #page-timetable .sch-grid-shell .sch-weeklist-container');
        expect(bare).toMatch(/body\.lux-route-timetable #page-timetable \.sch-grid-shell > #timetable-grid[\s\S]*overflow-x:\s*auto/);
        expect(bare).toMatch(/body\.lux-route-timetable #page-timetable \.sch-grid-shell > #timetable-grid[\s\S]*width:\s*100%/);
        expect(bare).toContain('margin-bottom: -14px');
        expect(bare).toContain('padding-bottom: 0');
        expect(bare).toContain('body.lux-route-timetable #page-timetable .sch-grid-shell.is-profile .sch-weeklist-root');
        expect(bare).toContain('body.lux-route-timetable #page-timetable .sch-weeklist-container');
        expect(bare).toContain('grid-template-columns: repeat(7, minmax(0, 1fr))');
        expect(bare).toContain('@media (max-width: 720px)');
        expect(bare).toContain('body.lux-route-timetable #page-timetable .sch-weeklist-container');
        expect(bare).toContain('max-width: 100%');
        expect(fouc).toMatch(/:is\(body\.lux-route-admin-scheduler #page-admin-scheduler, body\.lux-route-timetable #page-timetable\) \.sch-weeklist-container/);
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
        expect(primitives).not.toContain('.lux-timetable-hero-badge');
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
        expect(fouc).not.toContain('.lux-timetable-hero-badge');
        expect(fouc).toContain('.lux-timetable-hero-focus .lux-hero-signal.home-hover-chip');
        expect(fouc).toContain('.lux-timetable-hero-focus .lux-focus-panel__chip.home-hover-chip');
        expect(fouc).toMatch(/body\.lux-route-timetable \.lux-timetable-page[\s\S]*overflow:\s*visible/);
    });

    it('timetable phone/tablet layout contains scroll and clears the mobile shell', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('@media (max-width: 1100px)');
        expect(bare).toMatch(/@media \(max-width: 1100px\)[\s\S]*\.lux-timetable-command-grid[\s\S]*minmax\(0,\s*1fr\)\s+minmax\(0,\s*1\.2fr\)/);
        expect(bare).toMatch(/@media \(max-width: 1100px\)[\s\S]*\.lux-timetable-command-focus[\s\S]*grid-column:\s*1\s*\/\s*-1/);
        expect(bare).toMatch(/body\.lux-route-timetable #page-timetable \.sch-grid-shell > #timetable-grid[\s\S]*overflow-x:\s*auto/);
        expect(bare).toContain('body.lux-route-timetable #page-timetable .sch-grid-wrap');
        expect(bare).toMatch(/body\.lux-route-timetable \.lux-timetable-page[\s\S]*safe-area-inset-bottom/);
        expect(bare).toMatch(/@media \(max-width: 720px\)[\s\S]*\.lux-timetable-view-switcher-btn[\s\S]*min-height:\s*44px/);
        expect(bare).toMatch(/@media \(max-width: 720px\)[\s\S]*#page-timetable \.sch-weeklist-day-head[\s\S]*min-height:\s*64px/);
        expect(bare).toMatch(/body\.lux-route-timetable #app-content[\s\S]*overflow-x:\s*hidden/);
    });
});
