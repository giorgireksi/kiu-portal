const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('admin scheduler route regressions.test', () => {
    it('bare shell: shared portal stack without retired route paint', () => {
        const html = readSource('admin-scheduler.html');
        expect(html).toContain('lux-shell.css');
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).toContain('lux-layout-primitives.css');
        expect(html).toContain('layout-schedule-board.css');
        expect(html).toContain('lux-modals.css');
        expect(html).toContain('lux-controls.css');
        expect(html).toContain('lux-glass-dialog.js');
        expect(html).not.toMatch(/href=["'][^"']*index-luxury\.css/);
        expect(html).not.toMatch(/href=["'][^"']*lux-surfaces\.css/);
        expect(existsSync(join(process.cwd(), 'assets/css', 'admin-scheduler-route.css'))).toBe(false);
        expect(html).toMatch(/class="[^"]*lux-page-bare/);
        expect(html).toContain('data-lux-layout-only="1"');
        expect(html).toMatch(/sch-main[\s\S]*data-lux-glass-root="1"/);
        expect(html).toMatch(/sch-sidebar[\s\S]*data-lux-glass-root="1"/);
    });

    it('uses shared lux field chrome on filters and palette search', () => {
        const html = readSource('admin-scheduler.html');
        expect(html).toContain('class="lux-picker-label"');
        expect(html).toContain('class="lux-control"');
        expect(html).toContain('class="lux-program-field sch-rail-field"');
        expect(html).toContain('data-admin-scheduler-filter="faculty"');
        expect(html).toContain('data-admin-scheduler-search="palette"');
    });

    it('uses lux-glass-dialog modals instead of sch-modal-overlay shells', () => {
        const html = readSource('admin-scheduler.html');
        expect(html).toContain('lux-glass-dialog-overlay');
        expect(html).toContain('lux-glass-dialog-card');
        expect(html).not.toContain('sch-modal-overlay');
    });

    it('bare-lite owns scheduler layout without sch fade literals or empty-state repaint', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('#page-admin-scheduler');
        expect(bare).toContain('.scheduler-wrap');
        expect(bare).not.toMatch(/--sch-fade-/);
        expect(bare).toContain('.lux-page-shell[data-lux-layout-only="1"]');
        expect(bare).toContain('#page-admin-scheduler .sch-sidebar.lux-panel');
        expect(bare).not.toContain('.sch-empty-state');
        expect(bare).not.toContain('.palette-card.selected');
    });

    it('uses shared timetable/admin-tools panel vocabulary', () => {
        const html = readSource('admin-scheduler.html');
        const js = readSource('assets/js/pages/admin-scheduler.js');
        expect(html).toContain('class="lux-panel lux-soft-chrome sch-sidebar"');
        expect(html).toContain('class="lux-card lux-timetable-stage sch-main"');
        expect(html).toContain('class="lux-stat-row sch-rail-signal-grid"');
        expect(html).toContain('class="lux-field-grid sch-control-grid"');
        expect(html).toContain('class="lux-list sch-palette-list"');
        expect(html).toContain('class="lux-stat lux-soft-chrome home-hover-chip sch-stat-card"');
        expect(html).toContain('class="sch-rail-section sch-filter-section"');
        const filterSection = html.match(/<section class="sch-rail-section sch-filter-section">[\s\S]*?<\/section>/)?.[0] || '';
        expect(filterSection).not.toMatch(/<section class="[^"]*lux-card/);
        expect(html).toContain('class="sch-rail-control-band lux-soft-chrome"');
        expect(html).toContain('class="sch-rail-search-wrap"');
        expect(html).toContain('class="schedule-overview-row lux-timetable-overview-row"');
        expect(html).not.toContain('lux-card lux-timetable-overview-row');
        expect(html).toContain('class="schedule-week-nav lux-timetable-week-nav lux-card"');
        expect(html).toContain('class="sch-grid-wrap lux-timetable-canvas"');
        expect(html).not.toContain('sch-grid-shell');
        expect(html).not.toContain('sch-grid-tag');
        expect(html).not.toContain('lux-summary-surface');
        expect(html).toContain('defer src="assets/js/pages/admin-scheduler.js');
        expect(html).toContain('defer src="assets/js/features/index-luxury.js');
        expect(js).toContain("card.className = `lux-list-row lux-soft-chrome${isActive ? ' is-active' : ''}`");
        expect(js).toContain("state.className = 'lux-empty-state'");
        expect(js).toContain("banner.className = 'lux-alert is-support lux-soft-chrome'");
        expect(js).toContain("card.className = 'sch-event lux-timetable-event'");
        expect(js).toContain("dayLanes.className = 'sch-day-lanes lux-timetable-day-lanes'");
    });

    it('session modal uses flat field shells without double lux-picker-field wrappers', () => {
        const html = readSource('admin-scheduler.html');
        const pickerJs = readSource('assets/js/features/luxury-shell-picker-runtime.js');
        const modalTemplate = html.match(/<template id="sch-modal-template">[\s\S]*?<\/template>/)?.[0] || '';
        expect(modalTemplate).toContain('class="lux-glass-dialog-field sch-input-group"');
        expect(modalTemplate).not.toMatch(/sch-input-group[\s\S]*lux-picker-field/);
        expect(modalTemplate).not.toContain('sch-modal-mode-chip');
        expect(html).toContain('class="lux-secondary-btn schedule-current-week-btn lux-timetable-current-week-btn"');
        expect(pickerJs).toContain(".sch-rail-field, .lux-program-field, .sch-input-group");
    });

    it('scheduler performance and button contracts stay aligned with shared stack', () => {
        const scheduleCss = readSource('assets/css/layout-schedule.css');
        const modalsCss = readSource('assets/css/lux-modals.css');
        const js = readSource('assets/js/pages/admin-scheduler.js');
        const luxuryJs = readSource('assets/js/features/index-luxury.js');
        expect(scheduleCss).toContain(':not(.lux-route-admin-scheduler) .sch-event');
        expect(modalsCss).toContain('.sch-preset-manage-add-row *');
        expect(js).toContain('runWithLuxuryObserversPaused');
        expect(js).toContain('paletteSearchOnly: true');
        expect(js).toContain('lux-ghost-btn lux-icon-btn sch-preset-manage-delete-btn');
        expect(luxuryJs).toContain('isStandaloneSchedulerRouteActive');
    });
});
