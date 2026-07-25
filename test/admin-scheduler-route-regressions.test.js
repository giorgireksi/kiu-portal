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
        expect(html).toContain('lux-droplist.css');
        expect(html).toContain('lux-controls.css');
        expect(html).toContain('lux-glass-dialog.js');
        expect(html).not.toMatch(/href=["'][^"']*index-luxury\.css/);
        expect(html).not.toMatch(/href=["'][^"']*lux-surfaces\.css/);
        expect(existsSync(join(process.cwd(), 'assets/css', 'admin-scheduler-route.css'))).toBe(false);
        expect(html).toMatch(/class="[^"]*lux-page-bare/);
        expect(html).toContain('data-lux-layout-only="1"');
        expect(html).toMatch(/sch-grid-shell[\s\S]*data-lux-glass-root="1"/);
        expect(html).toMatch(/sch-rail-hero[\s\S]*data-lux-glass-root="1"/);
        expect(html).toMatch(/sch-filter-section[\s\S]*data-lux-glass-root="1"/);
        expect(html).toMatch(/sch-palette-section[\s\S]*data-lux-glass-root="1"/);
        expect(html).not.toMatch(/class="[^"]*sch-sidebar[^"]*"[^>]*data-lux-glass-root="1"/);
    });

    it('uses shared lux field chrome on filters and palette search', () => {
        const html = readSource('admin-scheduler.html');
        expect(html).toContain('class="lux-control"');
        expect(html).toContain('class="sch-control-group"');
        expect(html).toContain('data-admin-scheduler-filter="faculty"');
        expect(html).toContain('data-admin-scheduler-search="palette"');
    });

    it('uses sch-modal-overlay shells for scheduler modals', () => {
        const html = readSource('admin-scheduler.html');
        expect(html).toContain('sch-modal-overlay');
        expect(html).toContain('class="sch-modal"');
        expect(html).toContain('sch-modal-mode-chip');
        expect(html).toContain('sch-modal-close-muted');
        expect(html).not.toContain('lux-glass-dialog-card');
        expect(html).not.toContain('lux-glass-dialog-overlay');
    });

    it('bare-lite owns scheduler layout without sch fade literals or empty-state repaint', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('#page-admin-scheduler');
        expect(bare).toContain('.scheduler-wrap');
        expect(bare).not.toMatch(/--sch-fade-/);
        expect(bare).toContain('.lux-page-shell[data-lux-layout-only="1"]');
        expect(bare).toContain('#page-admin-scheduler .sch-sidebar');
        expect(bare).not.toContain('.sch-empty-state');
        expect(bare).not.toContain('.palette-card.selected');
    });

    it('uses shared scheduler grid and sidebar structure', () => {
        const html = readSource('admin-scheduler.html');
        const js = readSource('assets/js/pages/admin-scheduler.js');
        expect(html).toContain('class="sch-sidebar"');
        expect(html).toContain('class="sch-rail-hero lux-hero"');
        expect(html).toContain('class="sch-stat-card lux-strip-card lux-soft-chrome"');
        expect(html).toContain('class="sch-main"');
        expect(html).toContain('class="sch-grid-wrap"');
        expect(html).toContain('class="sch-grid-shell"');
        expect(html).toContain('class="sch-grid-topline"');
        expect(html).toContain('class="sch-grid-tag"');
        expect(html).toContain('class="sch-week-nav"');
        expect(html).toContain('class="sch-grid-week-label"');
        expect(html).toContain('class="sch-grid-empty lux-soft-chrome"');
        expect(html).not.toContain('lux-summary-surface');
        expect(html).not.toContain('lux-timetable-stage');
        expect(html).toContain('defer src="assets/js/pages/admin-scheduler.js');
        expect(html).toContain('defer src="assets/js/features/index-luxury.js');
        expect(js).toContain("card.className = `palette-card lux-strip-card lux-soft-chrome${isActive ? ' selected' : ''}`");
        expect(js).toContain("state.className = 'sch-empty-state lux-soft-chrome'");
        expect(js).toContain("banner.className = 'sch-info-banner lux-soft-chrome'");
        expect(js).toContain("card.className = 'sch-event'");
        expect(js).toContain("dayLanes.className = 'sch-day-lanes'");
        expect(js).toContain("title.className = 'sch-day-col-label'");
        expect(js).toContain("label.className = 'sch-time-slot-copy'");
    });

    it('session modal uses flat field shells without double lux-picker-field wrappers', () => {
        const html = readSource('admin-scheduler.html');
        const pickerJs = readSource('assets/js/features/luxury-shell-picker-runtime.js');
        const modalTemplate = html.match(/<template id="sch-modal-template">[\s\S]*?<\/template>/)?.[0] || '';
        expect(modalTemplate).toContain('class="sch-input-group"');
        expect(modalTemplate).not.toContain('lux-glass-dialog-field');
        expect(modalTemplate).toContain('sch-modal-mode-chip');
        expect(modalTemplate).toContain('sch-input-label-spacer');
        expect(html).toContain('class="lux-primary-btn sch-week-current-btn"');
        expect(pickerJs).toContain('.sch-control-group');
        expect(pickerJs).toContain('.sch-input-group');
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
        expect(js).toContain('sch-preset-manage-delete-btn');
        expect(luxuryJs).toContain('isStandaloneSchedulerRouteActive');
    });
});
