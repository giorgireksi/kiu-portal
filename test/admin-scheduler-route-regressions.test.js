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
        expect(html).toContain('layout-schedule.css');
        expect(html).not.toContain('layout-schedule-board.css');
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
        expect(html).toMatch(/class="sch-sidebar"[^>]*data-lux-glass-root="1"/);
        expect(html).not.toMatch(/sch-rail-hero[^>]*data-lux-glass-root="1"/);
        expect(html).not.toMatch(/sch-filter-section/);
        expect(html).not.toMatch(/sch-palette-section[^>]*data-lux-glass-root="1"/);
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
        expect(html).toContain('schmodal2');
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
        expect(bare).toContain('.sch-sidebar > .sch-rail-hero.lux-hero');
        expect(bare).toContain('.sch-sidebar > .sch-palette-section');
        expect(bare).toContain('border-top: 1px solid var(--sch-grid-border)');
        expect(bare).not.toContain('.sch-empty-state');
        expect(bare).not.toContain('.sch-preset-search-field');
        expect(bare).not.toContain('#page-admin-scheduler .sch-form-section');
        expect(bare).toContain('body.lux-route-admin-scheduler .sch-visually-hidden');
        expect(bare).toContain('body.lux-route-admin-scheduler #profQuizModalOverlay .quiz-questions-head');
    });

    it('densifies scheduler sidebar rail stats filters and palette', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const html = readSource('admin-scheduler.html');
        expect(bare).toMatch(/#page-admin-scheduler \.sch-stat-card\s*\{[^}]*min-height:\s*0/);
        expect(bare).not.toMatch(/#page-admin-scheduler \.sch-stat-card\s*\{[^}]*min-height:\s*144px/);
        expect(bare).toMatch(/#page-admin-scheduler \.sch-stat-card\s*\{[\s\S]*?padding:\s*8px 10px/);
        expect(bare).toMatch(/#page-admin-scheduler \.sch-stat-card strong\s*\{[\s\S]*?font-size:\s*20px/);
        expect(bare).toMatch(/#page-admin-scheduler \.sch-rail-hero\.lux-hero\s*\{[\s\S]*?padding:\s*12px/);
        expect(bare).toMatch(/#page-admin-scheduler \.sch-rail-section\s*\{[\s\S]*?padding:\s*12px/);
        expect(bare).toMatch(/#page-admin-scheduler \.palette-card\s*\{[\s\S]*?padding:\s*8px 10px 8px 14px/);
        expect(html).toContain('lux-page-bare-lite.css?v=20260731-schrail1');
    });

    it('stat and palette chips use shared home-hover-chip lift contract', () => {
        const html = readSource('admin-scheduler.html');
        const js = readSource('assets/js/pages/admin-scheduler.js');
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const fouc = readSource('assets/css/lux-fouc-ht.css');

        expect(html).toContain('home-hover-chip');
        expect(js).toContain('home-hover-chip');
        expect(bare).not.toMatch(/#page-admin-scheduler \.palette-card[\s\S]*transform:\s*none/);
        expect(fouc).toMatch(/\.home-hover-chip[\s\S]*var\(--home-chip-hover-lift/);
        expect(fouc).not.toMatch(/#page-admin-scheduler \.sch-sidebar \.home-hover-chip:hover[\s\S]*transform:\s*none/);
    });

    it('lazy-loads professor quiz runtime instead of booting it in HTML', () => {
        const html = readSource('admin-scheduler.html');
        const js = readSource('assets/js/pages/admin-scheduler.js');
        const quiz = readSource('assets/js/pages/admin-scheduler-quiz-runtime.js');

        expect(html).not.toContain('prof-quiz-modal-template');
        expect(html).not.toContain('admin-scheduler-quiz-runtime.js');
        expect(js).toContain('loadSchedulerQuizApi');
        expect(js).toContain('admin-scheduler-quiz-runtime.js');
        expect(js).not.toContain('buildProfessorQuizQuestionCard');
        expect(quiz).toContain('__kiuCreateAdminSchedulerQuizApi');
        expect(quiz).toContain('openProfQuizModal');
    });

    it('rebuilds filter selects from scheduler constants', () => {
        const html = readSource('admin-scheduler.html');
        const js = readSource('assets/js/pages/admin-scheduler.js');

        expect(html).not.toMatch(/id="admin-tt-faculty"[^>]*>[\s\S]*?<option value="ECON">Management<\/option>/);
        expect(js).toContain('SCHEDULER_FACULTY_OPTIONS');
        expect(js).toContain("rebuildSchedulerSelect(el('admin-tt-faculty'), SCHEDULER_FACULTY_OPTIONS");
    });

    it('uses shared scheduler grid and sidebar structure', () => {
        const html = readSource('admin-scheduler.html');
        const js = readSource('assets/js/pages/admin-scheduler.js');
        expect(html).toContain('class="sch-sidebar"');
        expect(html).toContain('class="sch-rail-hero lux-hero"');
        expect(html).toContain('class="sch-stat-card lux-strip-card lux-soft-chrome home-hover-chip"');
        expect(html).toContain('class="sch-main"');
        expect(html).toContain('class="sch-grid-wrap"');
        expect(html).toContain('class="sch-grid-shell"');
        expect(html).toContain('class="sch-grid-topline"');
        expect(html).toContain('class="sch-grid-tag"');
        expect(html).toContain('class="sch-week-nav"');
        expect(html).toContain('class="sch-grid-week-label"');
        expect(html).toContain('class="sch-grid-empty lux-soft-chrome"');
        expect(html).toContain('sch-preset-manage-empty" class="sch-empty-state lux-summary-surface lux-summary-surface--panel home-hover-chip"');
        expect(html).not.toContain('lux-timetable-stage');
        expect(html).toContain('defer src="assets/js/pages/admin-scheduler.js');
        expect(html).toContain('defer src="assets/js/features/index-luxury.js');
        expect(js).toContain("card.className = `palette-card lux-strip-card lux-soft-chrome home-hover-chip${isActive ? ' selected' : ''}`");
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
        expect(modalTemplate).toContain('sch-form-section home-hover-chip');
        expect(modalTemplate).toContain('lux-secondary-btn sch-modal-close-muted');
        expect(modalTemplate).toContain('lux-secondary-btn sch-preset-manage-link home-hover-chip');
        expect(modalTemplate).toContain('sch-modal-mode-chip');
        expect(modalTemplate).toContain('sch-input-label-spacer');
        expect(html).toContain('class="lux-primary-btn sch-week-current-btn"');
        expect(pickerJs).toContain("wrapper.className = 'lux-picker-field lux-universal-picker-field'");
        expect(pickerJs).toContain('resolvePickerTriggerClass');
        expect(pickerJs).toContain('lux-picker-btn--compact');
    });

    it('modal fields keep global CTA chrome for controls and pickers', () => {
        const modals = readSource('assets/css/lux-modals.css');
        expect(modals).toContain('.lux-picker-btn--compact');
        expect(modals).toMatch(/\[data-lux-transparency-exempt="1"\] \.sch-modal :is\([\s\S]*?\.lux-control[\s\S]*?\.lux-picker-btn--compact/);
        expect(modals).not.toContain('.lux-picker-btn--field');
        const modalFieldRule = modals.match(/\[data-lux-transparency-exempt="1"\] \.sch-modal :is\([\s\S]*?\) \{[^}]*\}/)?.[0] || '';
        expect(modalFieldRule).toContain('width: 100%');
        expect(modalFieldRule).not.toContain('var(--lux-panel-control');
    });

    it('preset manager uses shared CTA chrome on shells and buttons', () => {
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const modals = readSource('assets/css/lux-modals.css');
        const js = readSource('assets/js/pages/admin-scheduler.js');

        expect(js).toContain('lux-secondary-btn sch-preset-manage-delete-btn');
        expect(js).toContain("item.className = 'sch-preset-manage-item home-hover-chip'");
        expect(fouc).toContain('.sch-preset-manage-item.home-hover-chip');
        expect(fouc).toContain('--lux-soft-chrome-surface');
        expect(fouc).not.toMatch(/#schPresetManagerOverlay \.sch-preset-manage-search[\s\S]*?var\(--lux-panel-control/);
        expect(bare).toMatch(/\.sch-search-shell \.lux-control[\s\S]*?padding-left:\s*40px/);
        expect(bare).not.toMatch(/#schPresetManagerOverlay \.sch-combo-save-input[\s\S]*?border-radius:\s*14px/);
        expect(modals).toContain('.sch-preset-manage-item-actions *');
    });

    it('scheduler performance and button contracts stay aligned with shared stack', () => {
        const scheduleCss = readSource('assets/css/layout-schedule.css');
        const modalsCss = readSource('assets/css/lux-modals.css');
        const js = readSource('assets/js/pages/admin-scheduler.js');
        const luxuryJs = readSource('assets/js/features/index-luxury.js');
        expect(scheduleCss).toContain(':not(.lux-route-admin-scheduler) .sch-event');
        expect(modalsCss).toContain('.sch-preset-manage-add-row *');
        expect(js).toContain('runWithLuxuryObserversPaused');
        expect(js).toContain('openLuxPortalModal');
        expect(js).not.toContain('openLuxGlassDialogOverlay');
        expect(js).toContain('isStandaloneAdminSchedulerPage');
        expect(js).toContain('paletteSearchOnly: true');
        expect(js).toContain("item.className = 'sch-preset-manage-item home-hover-chip'");
        expect(js).toContain('lux-secondary-btn sch-preset-manage-delete-btn');
        expect(luxuryJs).toContain('isStandaloneSchedulerRouteActive');
    });

    it('session modal copy stays readable on CTA fields and conflict alerts', () => {
        const modals = readSource('assets/css/lux-modals.css');
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(modals).toContain('#schModalOverlay .sch-conflict-alert.show[data-conflict-state=\'danger\']');
        expect(modals).toContain('#schModalOverlay .lux-control::placeholder');
        expect(modals).toMatch(/#schModalOverlay[\s\S]*?\.sch-inline-required[\s\S]*?#f87171/);
        expect(modals).toContain(':is(#schModalOverlay, #schPresetManagerOverlay) .sch-form-section.home-hover-chip');
        expect(modals).not.toMatch(/#schModalOverlay[^\{]*\.sch-form-section\.home-hover-chip\s*\{[^}]*background:\s*var\(--lux-panel-modal-section/);
        expect(fouc).toContain('#schModalOverlay');
        expect(fouc).toContain('.sch-form-section.home-hover-chip');
        expect(fouc).not.toContain("#schModalOverlay .sch-conflict-alert.show[data-conflict-state='danger']");
    });

    it('session modal uses warmglass card without frosted glass-root host', () => {
        const html = readSource('admin-scheduler.html');
        const modalTemplate = html.match(/<template id="sch-modal-template">[\s\S]*?<\/template>/)?.[0] || '';
        expect(modalTemplate).toContain('class="sch-modal"');
        expect(modalTemplate).not.toMatch(/class="sch-modal"[^>]*data-lux-glass-root="1"/);
        expect(modalTemplate).not.toContain('sch-modal-head-accent');
    });

    it('session modal fields use lux-control and preset overlay is transparency exempt', () => {
        const html = readSource('admin-scheduler.html');
        const tokens = readSource('assets/css/lux-tokens.css');
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const modals = readSource('assets/css/lux-modals.css');
        const chrome = readSource('assets/js/features/luxury-shell-chrome.js');

        expect(html).toContain('id="schModalOverlay" data-admin-scheduler-modal-overlay="true" data-lux-transparency-exempt="1"');
        expect(html).toContain('id="schPresetManagerOverlay" data-admin-scheduler-preset-overlay="true" data-lux-transparency-exempt="1"');
        expect(html).toMatch(/id="sch-subject"[^>]*class="lux-control"|class="lux-control"[^>]*id="sch-subject"/);
        expect(html).toMatch(/id="sch-endtime"[^>]*class="lux-control"|class="lux-control"[^>]*id="sch-endtime"/);
        expect(html).toMatch(/id="sch-capacity"[^>]*class="lux-control"|class="lux-control"[^>]*id="sch-capacity"/);
        expect(html).toMatch(/id="sch-session-type"[^>]*class="lux-control"|class="lux-control"[^>]*id="sch-session-type"/);
        expect(html).toMatch(/id="sch-preset-search"[^>]*class="lux-control/);
        expect(tokens).toContain('--lux-panel-control:');
        expect(tokens).toContain('--lux-elev-1:');
        expect(bare).not.toMatch(/#schModalOverlay[\s\S]*min-height:\s*48px[\s\S]*padding:\s*12px 14px/);
        expect(bare).not.toMatch(
            /\[id="schModalOverlay"\][\s\S]*?\.sch-modal-title\s*\{[\s\S]*?font-size/
        );
        expect(bare).not.toMatch(/\[id="schModalOverlay"\][\s\S]*\.sch-form-section-title\s*\{/);
        expect(modals).toMatch(
            /\[data-lux-transparency-exempt="1"\] #schModalOverlay \.sch-modal-foot[\s\S]*?justify-content:\s*flex-end/
        );
        expect(chrome).toContain('originalParent.insertBefore(node, nativeSelect)');
    });
});
