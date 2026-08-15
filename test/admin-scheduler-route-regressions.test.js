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

    it('opens a read-only staff profile picker for scheduler assignments', () => {
        const html = readSource('admin-scheduler.html');
        const js = readSource('assets/js/pages/admin-scheduler.js');
        const session = readSource('assets/css/admin-scheduler-session-modal.css');
        expect(js).toContain('schStaffPickerOverlay');
        expect(js).toContain('data-scheduler-staff-picker-person');
        expect(js).toContain('data-scheduler-staff-picker-choose');
        expect(js).toContain('getAllStaff(expectedRole === \'ta\' ? \'tas\' : \'professors\'');
        // Live staff fetch must be role-scoped and paginated: the backend
        // clamps unscoped listings to 200 alphabetical accounts, which can
        // silently drop newly provisioned TAs/professors from the picker.
        expect(js).toContain('kiuPortalFetch(`/api/accounts?role=${encodeURIComponent(role)}&limit=${pageSize}&offset=${offset}`)');
        expect(js).toContain("fetchSchedulerLiveStaffAccountsByRole('ta')");
        expect(js).toContain("fetchSchedulerLiveStaffAccountsByRole('professor')");
        expect(js).toContain('Account identity');
        expect(js).toContain('Profile details');
        expect(js).toContain('lux-glass-dialog-overlay sch-staff-picker-overlay');
        expect(js).toContain('lux-glass-dialog-card lux-glass-dialog-card--hub-dialog sch-staff-picker');
        expect(js).toContain('refreshTransparency: false');
        expect(js).toContain('hydrateFieldValuesFromRecord');
        expect(js).toContain('getStaffFormSchema');
        expect(js).toContain('data-scheduler-staff-picker-section');
        expect(js).toContain('schedulerStaffPickerAvatarSource');
        expect(js).toContain('fa-check" aria-hidden="true"></i> Choose this person');
        expect(js).toContain('aria-pressed="${key === schedulerStaffPickerState.selectedId ? \'true\' : \'false\'}"');
        expect(js).toContain('function renderSchedulerStaffPickerRoster(visibleRecords)');
        expect(js).toContain('function syncSchedulerStaffPickerSelection()');
        expect(js).toContain("event.target?.id === 'schStaffPickerOverlay'");
        expect(js).toContain('closeSchedulerStaffPicker();');
        expect(js).toContain('profileMarkup: new Map()');
        expect(js).toContain('profileSectionsByType: new Map()');
        expect(js).toContain('renderSchedulerStaffPicker({ roster: false })');
        expect(js).toContain("!/^admin$/i.test(String(section.id || '').trim())");
        expect(html).toContain('staff-form-blueprint.js?v=20260804-staffsections1');
        expect(html).toContain('form-blueprint-runtime.js?v=20260804-staffsections1');
        expect(html).toContain('form-renderer-runtime.js?v=20260804-staffsections1');
        expect(session).toContain('.sch-staff-picker-body');
        expect(session).toContain('.sch-staff-picker-detail-grid');
        expect(session).toContain('.sch-staff-picker-person.is-selected');
        expect(session).toContain('width: min(1180px, 100%)');
        expect(session).toContain('.staff-hub-form-section');
        expect(session).toContain('.sch-staff-picker-tabs');
        expect(session).toContain('.sch-staff-picker-person::after');
        expect(session).toContain('@keyframes schStaffPickerProfileReveal');
        expect(session).toContain('@media (prefers-reduced-motion: reduce)');
        expect(session).toContain('[data-scheduler-staff-picker-choose]:not(:disabled):hover');
        expect(session).toMatch(/@media \(max-width: 1024px\)[\s\S]*?\.sch-staff-picker-overlay[\s\S]*?calc\(72px \+ env\(safe-area-inset-bottom/);
        expect(session).toMatch(/\.sch-staff-picker-tabs[\s\S]*?flex-wrap:\s*nowrap/);
        expect(session).toMatch(/@media \(max-width: 720px\)[\s\S]*?\.sch-staff-picker-avatar[\s\S]*?width:\s*44px/);
        expect(session).toMatch(/@media \(max-width: 720px\)[\s\S]*?\.sch-staff-picker-foot[\s\S]*?min-height:\s*44px/);
        expect(session).toContain('scrolled profile/avatar cannot bleed');
        const pickerCss = session.match(/\/\* ── Read-only staff assignment picker ── \*\/[\s\S]*?(?=\n@media|\n#schModalOverlay)/)?.[0] || '';
        expect(pickerCss).not.toContain('backdrop-filter');
        expect(pickerCss).not.toContain('box-shadow');
        expect(pickerCss).not.toContain('var(--lux-modal-glass-surface');
        expect(pickerCss).not.toContain('var(--lux-modal-glass-shadow');
    });

    it('uses sch-modal-overlay shells for scheduler modals', () => {
        const html = readSource('admin-scheduler.html');
        expect(html).toContain('staffpickermobile1');
        expect(html).toContain('admin-scheduler-session-modal.css');
        expect(html).toMatch(/mobile-shell-core\.css[\s\S]*admin-scheduler-session-modal\.css/);
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
        expect(bare).toContain('#page-admin-scheduler .sch-rail-hero.lux-hero');
        expect(bare).toContain('#page-admin-scheduler .sch-palette-list');
        expect(bare).toContain('grid-template-columns: repeat(7, minmax(180px, 1fr))');
        expect(bare).toContain('grid-template-columns: minmax(0, 1fr)');
        expect(bare).not.toContain('.sch-empty-state');
        expect(bare).not.toMatch(/#page-admin-scheduler \.sch-preset-search-field\s*\{[^}]*background:/);
        expect(bare).toContain(':is(#page-admin-scheduler, #schPresetManagerOverlay) .sch-form-section');
        expect(bare).not.toMatch(/#page-admin-scheduler \.sch-form-section\s*\{/);
        expect(bare).toContain('#page-admin-scheduler .sch-visually-hidden');
        expect(bare).toContain('#page-admin-scheduler .quiz-questions-head');
        expect(bare).toContain('.sch-weeklist-items {');
        expect(bare).toContain('display: flex');
        expect(bare).toContain('flex-direction: column');
        expect(bare).toContain('@media (max-width: 720px)');
        expect(bare).toContain('body.lux-route-admin-scheduler #page-admin-scheduler .sch-weeklist-container');
        expect(bare).toContain('max-width: 100%');
        expect(bare).not.toMatch(/\.sch-weeklist-items:has/);
    });

    it('densifies scheduler sidebar rail stats filters and palette', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const html = readSource('admin-scheduler.html');
        expect(bare).toMatch(/#page-admin-scheduler \.sch-stat-card\s*\{[^}]*display:\s*flex/);
        expect(bare).not.toMatch(/#page-admin-scheduler \.sch-stat-card\s*\{[^}]*min-height:\s*144px/);
        expect(bare).toMatch(/#page-admin-scheduler \.sch-stat-card\s*\{[\s\S]*?padding:\s*6px 8px/);
        expect(bare).toMatch(/#page-admin-scheduler \.sch-stat-card strong\s*\{[\s\S]*?font-size:\s*22px/);
        expect(bare).toMatch(/#page-admin-scheduler \.sch-rail-hero\.lux-hero\s*\{[\s\S]*?padding:\s*6px 8px/);
        expect(bare).toMatch(/#page-admin-scheduler \.sch-rail-section\s*\{[\s\S]*?padding:\s*6px 8px/);
        expect(bare).toMatch(/#page-admin-scheduler \.palette-card\s*\{[\s\S]*?padding:\s*10px 12px 10px 16px/);
        expect(bare).toMatch(/#page-admin-scheduler \.scheduler-wrap\s*\{[\s\S]*?grid-template-columns:\s*1fr/);
        expect(bare).toMatch(/#page-admin-scheduler \.sch-sidebar\s*\{[^}]*grid-template-columns:\s*1fr/);
        expect(bare).toMatch(/#page-admin-scheduler \.sch-rail-signal-grid\.lux-strip-grid\s*\{[\s\S]*?repeat\(4,/);
        expect(bare).toMatch(/#page-admin-scheduler \.sch-control-grid\s*\{[\s\S]*?minmax\(150px,\s*1fr\)/);
        expect(bare).toMatch(/#page-admin-scheduler \.sch-palette-list\s*\{[\s\S]*?flex-direction:\s*row/);
        expect(bare).toMatch(/#page-admin-scheduler \.sch-rail-section\.sch-palette-section\s*\{[\s\S]*?grid-template-columns:\s*1fr auto/);
        expect(html).not.toContain('Filters apply to both the session grid');
        expect(html).not.toContain('Scheduled in current board scope.');
        expect(bare).toMatch(/#page-admin-scheduler \.sch-sidebar\s*\{[\s\S]*?align-items:\s*start/);
        expect(bare).toMatch(/#page-admin-scheduler \.sch-rail-hero\.lux-hero\s*\{[\s\S]*?height:\s*fit-content/);
        expect(bare).toMatch(/#page-admin-scheduler \.sch-rail-hero\.lux-hero\s*\{[\s\S]*?min-height:\s*0/);
        expect(bare).toMatch(/#page-admin-scheduler \.sch-rail-section\s*\{[\s\S]*?height:\s*fit-content/);
        expect(html).toContain('lux-page-bare-lite.css?v=20260804-commandmerge1');
        expect(bare).toContain('body.lux-route-admin-scheduler #app-content');
        expect(bare).toContain('padding-left: 0 !important');
        expect(bare).toContain('padding-right: 0 !important');
    });

    it('stat and palette chips use shared home-hover-chip lift contract', () => {
        const html = readSource('admin-scheduler.html');
        const js = readSource('assets/js/pages/admin-scheduler.js');
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const fouc = readSource('assets/css/lux-fouc-ht.css');

        expect(html).toContain('home-hover-chip');
        expect(js).toContain('home-hover-chip');
        expect(bare).not.toMatch(/#page-admin-scheduler \.palette-card:hover[^}]*transform:\s*none/);
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
        const fouc = readSource('assets/css/lux-fouc-ht.css');
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
        expect(html).toContain('assets/css/lux-fouc-ht.css?v=20260806-hidetopbar2');
        expect(html).toContain('assets/js/pages/admin-scheduler.js?v=20260815-staff-directory-picker5');
        expect(html).toContain('defer src="assets/js/features/index-luxury.js');
        expect(js).toContain("card.className = `palette-card lux-strip-card lux-soft-chrome home-hover-chip${isActive ? ' selected' : ''}`");
        expect(js).toContain("state.className = 'sch-empty-state lux-soft-chrome'");
        expect(js).not.toContain('sch-info-banner');
        expect(js).toContain("card.className = 'sch-event weeklist-item sch-weeklist-item'");
        expect(js).toContain('function buildSchedulerEventDetails(session)');
        expect(js).toContain("details.className = 'lms-session-details lms-session-details--session'");
        expect(js).toContain('getSchedulerEventCourseName(session.courseId)');
        expect(js).toContain('getDomain()');
        expect(js).toContain('getActiveCurriculum(');
        expect(js).toContain("buildSummaryItem('far fa-clock', 'Hours:', time, 'lms-session-summary-item--hours')");
        expect(js).toContain("buildSummaryItem('fas fa-book-open', 'Educational course:', getSchedulerEventCourseName(session.courseId), 'lms-session-summary-item--course')");
        expect(js).toContain("buildSummaryItem('fas fa-tag', 'Type:', getSchedulerEventTypeLabel(session), 'lms-session-summary-item--type')");
        expect(js).toContain("buildSummaryItem('fas fa-hourglass-half', 'Duration:', formatSchedulerLmsDuration(session.duration), 'lms-session-summary-item--duration')");
        expect(js).toContain("getSchedulerEventCourseName(session.courseId)");
        expect(js).toContain("lms-session-detail-grid");
        expect(js).toContain("fas fa-book-open");
        expect(js).toContain("fas fa-hourglass-half");
        expect(js).not.toContain("panelHead.className = 'lms-session-panel-head'");
        expect(js).not.toContain("panelKicker.textContent = 'Session details'");
        expect(js).not.toContain('buildSchedulerEventMeta');
        expect(js).not.toContain('ev-duration');
        expect(js).not.toContain('ev-title');
        expect(fouc).toContain('.lms-session-details');
        expect(fouc).toContain('.lms-session-detail-row');
        expect(fouc).toContain('.lms-session-summary-label');
        expect(fouc).toContain('.lms-session-summary-value');
        expect(fouc).toContain('.lms-session-details--timetable .lms-session-detail-label');
        expect(fouc).toContain('.lms-session-details--timetable .lms-session-detail-value');
        expect(fouc).toContain('font-size: 12px');
        expect(fouc).toContain('font-size: 13px');
        expect(fouc).toContain('grid-template-columns: repeat(3, minmax(0, 1fr))');
        expect(fouc).toContain('border-bottom: 2px solid color-mix');
        expect(fouc).toContain('border-right: 2px solid color-mix');
        expect(fouc).not.toContain('.lms-session-panel-head');
        expect(fouc).not.toContain('.lms-session-panel-kicker');
        expect(fouc).toContain('display: flex');
        expect(fouc).toContain('display: inline');
        expect(fouc).toContain('white-space: normal');
        expect(fouc).toContain('text-overflow: clip');
        expect(js).toContain("actions.className = 'ev-actions'");
        expect(js).toContain("document.createElement('button')");
        expect(js).toContain('ev-action ev-action--${action}');
        expect(js).toContain("buildSchedulerEventAction('delete'");
        expect(js).not.toContain('schShowStats');
        expect(js).not.toContain('ev-action--stats');
        expect(js).not.toContain("action === 'stats'");
        expect(js).not.toContain('sch-time-labels');
        expect(js).not.toContain('sch-time-slot-copy');
        expect(js).not.toContain('sch-time-col--header');
        expect(js).not.toContain('sch-day-lanes');
        expect(js).toContain("weekList.className = 'weeklist-container sch-weeklist-container'");
        expect(js).toContain("addButton.dataset.schedulerDayAdd = entry.en");
        expect(js).toContain("openSchModal(\n                    addNode.dataset.schedulerDayAdd");
        expect(js).toContain("title.className = 'day-name sch-day-col-label'");
        expect(fouc).toContain('.ev-actions');
        expect(fouc).toContain('.ev-action');
        expect(fouc).toContain('flex-direction: column');
        expect(fouc).toContain('bottom: 10px');
    });
    it('session modal uses flat field shells without double lux-picker-field wrappers', () => {
        const html = readSource('admin-scheduler.html');
        const modals = readSource('assets/css/lux-modals.css');
        const session = readSource('assets/css/admin-scheduler-session-modal.css');
        const pickerJs = readSource('assets/js/features/luxury-shell-picker-runtime.js');
        const modalTemplate = html.match(/<template id="sch-modal-template">[\s\S]*?<\/template>/)?.[0] || '';
        expect(modalTemplate).toContain('class="sch-input-group"');
        expect(modalTemplate).not.toContain('lux-glass-dialog-field');
        expect((modalTemplate.match(/<section class="sch-form-section/g) || [])).toHaveLength(4);
        expect(modalTemplate).toContain('sch-form-section--identity');
        expect(modalTemplate).toContain('sch-form-section--schedule');
        expect(modalTemplate).toContain('sch-form-section--staffing');
        expect(modalTemplate).toContain('sch-form-section--scope');
        expect(modalTemplate).toContain('sch-modal-head sch-modal-head-accent');
        expect(modalTemplate).toContain('data-admin-scheduler-modal-close="true"');
        expect(modalTemplate).toContain('fas fa-times sch-modal-close-muted');
        expect(modalTemplate).not.toMatch(/<button[^>]*sch-modal-close-muted/);
        expect(modalTemplate).toContain('class="sch-preset-manage-link"');
        expect(modalTemplate).toContain('fas fa-sliders-h');
        expect(modalTemplate).toContain('id="sch-conflict-msg"');
        expect(modalTemplate).toContain('data-conflict-state="hidden"');
        expect(modalTemplate).toContain(' role="status" aria-live="polite" hidden');
        expect(modalTemplate).toContain('sch-modal-foot');
        expect(modalTemplate).not.toContain('sch-modal-foot lux-btn-row-stack');
        expect(modalTemplate).toContain('sch-modal-mode-chip');
        expect(modalTemplate).toContain('id="sch-modal-subtitle"');
        expect(modalTemplate).toContain('id="sch-modal-week"');
        expect(modalTemplate).not.toContain('sch-modal-context');
        expect(modalTemplate).toContain('sch-input-label-spacer');
        expect(modalTemplate).toContain('Group ID');
        expect(modalTemplate).not.toContain('sch-input-label-action');
        expect(modalTemplate).toContain('id="sch-prof"');
        expect(modalTemplate).toContain('id="sch-ta"');
        expect(modalTemplate).toContain('data-lux-picker-label="Professor"');
        expect(modalTemplate).toContain('data-lux-picker-label="Teaching assistant"');
        expect(modalTemplate).toMatch(/<select[^>]*\bid="sch-prof"/);
        expect(modalTemplate).toMatch(/<select[^>]*\bid="sch-ta"/);
        expect(modalTemplate).not.toMatch(/<input[^>]*type="hidden"[^>]*id="sch-prof"/);
        expect(modalTemplate).not.toMatch(/<input[^>]*type="hidden"[^>]*id="sch-ta"/);
        expect(modalTemplate).toMatch(/id="sch-prof"[\s\S]*?id="sch-semester-hidden"/);
        expect(html).toContain('class="lux-primary-btn sch-week-current-btn"');
        expect(pickerJs).toContain("wrapper.className = 'lux-picker-field lux-universal-picker-field'");
        expect(pickerJs).toContain('resolvePickerTriggerClass');
        expect(pickerJs).toContain('lux-picker-btn--compact');
        expect(session).toContain('justify-content: flex-end');
        expect(session).not.toContain('font-weight: 600 !important');
        expect(session).not.toMatch(/min-height:\s*48px/);
        expect(modals).toMatch(
            /#schPresetManagerOverlay\[data-lux-transparency-exempt="1"\] \.sch-modal-foot[\s\S]*?justify-content:\s*space-between/
        );
    });

    it('modal fields keep global CTA chrome for scheduler overlays', () => {
        const modals = readSource('assets/css/lux-modals.css');
        const session = readSource('assets/css/admin-scheduler-session-modal.css');
        const controls = readSource('assets/css/lux-controls.css');
        expect(modals).toContain('.lux-picker-btn--compact');
        expect(modals).toMatch(
            /:is\(\s*#schModalOverlay\[data-lux-transparency-exempt="1"\],[\s\S]*?#schPresetManagerOverlay\[data-lux-transparency-exempt="1"\]\s*\)[\s\S]*?\.sch-modal :is\([\s\S]*?\.lux-control[\s\S]*?\.lux-picker-btn--compact/
        );
        expect(modals).not.toContain('.lux-picker-btn--field');
        const fieldLayoutRule =
            modals.match(
                /:is\(\s*#schModalOverlay\[data-lux-transparency-exempt="1"\],[\s\S]*?#schPresetManagerOverlay\[data-lux-transparency-exempt="1"\]\s*\)[\s\S]*?\.sch-modal :is\([\s\S]*?\) \{[^}]*\}/
            )?.[0] || '';
        expect(fieldLayoutRule).toContain('width: 100%');
        expect(fieldLayoutRule).not.toContain('var(--lux-panel-control');
        expect(session).not.toMatch(/border-width:\s*1px !important/);
        expect(controls).toMatch(/\.lux-picker-btn--compact[\s\S]*?var\(--lux-btn-well\)/);
        expect(controls).toMatch(/\.lux-picker-btn--compact[\s\S]*?var\(--lux-btn-pill-radius/);
        expect(modals).not.toContain('#schModalOverlay *');
        expect(modals).toContain('#schModalOverlay[data-lux-transparency-exempt="1"]');
        expect(modals).toContain('.sch-preset-manage-link:not(.lux-secondary-btn)');
    });

    it('preset manager uses shared CTA chrome on shells and buttons', () => {
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const modals = readSource('assets/css/lux-modals.css');
        const js = readSource('assets/js/pages/admin-scheduler.js');

        expect(js).toContain('lux-secondary-btn sch-preset-manage-delete-btn');
        expect(bare).toContain('#schPresetManagerOverlay .sch-preset-manage-delete-btn');
        expect(bare).not.toContain('#schModalOverlay .sch-preset-manage-delete-btn');
        expect(js).toContain("item.className = 'sch-preset-manage-item home-hover-chip'");
        expect(fouc).toContain('.sch-preset-manage-item.home-hover-chip');
        expect(fouc).toContain('--lux-soft-chrome-surface');
        expect(fouc).not.toMatch(/#schPresetManagerOverlay \.sch-preset-manage-search[\s\S]*?var\(--lux-panel-control/);
        expect(bare).toMatch(/\.sch-search-shell \.lux-control[\s\S]*?padding-left:\s*40px/);
        expect(bare).not.toMatch(/#schPresetManagerOverlay \.sch-combo-save-input\s*\{[^}]*border-radius:\s*14px/);
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

    it('session modal copy stays readable on conflict alerts and labels', () => {
        const session = readSource('assets/css/admin-scheduler-session-modal.css');
        const modals = readSource('assets/css/lux-modals.css');
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        const js = readSource('assets/js/pages/admin-scheduler.js');
        expect(session).toContain('#schModalOverlay[data-lux-transparency-exempt="1"] .sch-conflict-alert.show[data-conflict-state=\'danger\']');
        expect(session).toContain('.sch-conflict-alert.show:not([hidden])');
        expect(session).not.toContain('#schModalOverlay[data-lux-transparency-exempt="1"] .sch-create-btn');
        expect(modals).toMatch(/\.sch-modal-foot \.lux-primary-btn[\s\S]*?--lux-panel-cta-accent/);
        expect(session).toContain('font-family: inherit');
        expect(session).not.toContain('.lux-picker-option');
        expect(js).toContain('messageBox.hidden = false');
        expect(js).toContain('messageBox.hidden = true');
        expect(modals).toMatch(
            /:is\(\s*#schModalOverlay\[data-lux-transparency-exempt="1"\],[\s\S]*?\.lux-control::placeholder/
        );
        expect(modals).toMatch(
            /:is\(\s*#schModalOverlay\[data-lux-transparency-exempt="1"\],[\s\S]*?#schPresetManagerOverlay\[data-lux-transparency-exempt="1"\]\s*\)[\s\S]*?\.lux-control::placeholder/
        );
        expect(modals).toMatch(
            /#schPresetManagerOverlay\[data-lux-transparency-exempt="1"\] \.sch-inline-required[\s\S]*?var\(--lux-btn-danger-border/
        );
        expect(session).toMatch(
            /#schModalOverlay\[data-lux-transparency-exempt="1"\] :is\(\s*\.sch-inline-required[\s\S]*?font-size:\s*10px/
        );
        expect(session).not.toMatch(/\[data-lux-transparency-exempt="1"\]\s+#schModalOverlay/);
        expect(session).toContain('#schModalOverlay[data-lux-transparency-exempt="1"]');
        expect(session).toContain('#schModalOverlay[data-lux-transparency-exempt="1"] .sch-form-section');
        expect(fouc).not.toContain('#schModalOverlay');
        expect(fouc).toContain('.sch-form-section.home-hover-chip');
        expect(fouc).not.toMatch(/body\.lux-route-admin-scheduler \.sch-modal-head-accent\s*\{/);
        expect(fouc).not.toMatch(/body\.lux-route-admin-scheduler \.sch-modal-subtitle,/);
        expect(modals).not.toContain('#schModalOverlay *');
        expect(modals).toContain('#schModalOverlay[data-lux-transparency-exempt="1"]');
        expect(modals).toContain('.sch-preset-manage-link:not(.lux-secondary-btn)');
    });

    it('session modal uses warmglass card without frosted glass-root host', () => {
        const html = readSource('admin-scheduler.html');
        const modalTemplate = html.match(/<template id="sch-modal-template">[\s\S]*?<\/template>/)?.[0] || '';
        expect(modalTemplate).toContain('class="sch-modal"');
        expect(modalTemplate).not.toMatch(/class="sch-modal"[^>]*data-lux-glass-root="1"/);
        expect(modalTemplate).toContain('sch-modal-head-accent');
    });

    it('session modal fields use lux-control and preset overlay is transparency exempt', () => {
        const html = readSource('admin-scheduler.html');
        const tokens = readSource('assets/css/lux-tokens.css');
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const modals = readSource('assets/css/lux-modals.css');
        const chrome = readSource('assets/js/features/luxury-shell-chrome.js');

        expect(html).toContain('id="schModalOverlay" data-admin-scheduler-modal-overlay="true" data-lux-transparency-exempt="1" data-sch-session-modal-ssot="1"');
        expect(html).toContain('id="schPresetManagerOverlay" data-admin-scheduler-preset-overlay="true" data-lux-transparency-exempt="1"');
        expect(html).toMatch(/id="sch-subject"[^>]*class="lux-control"|class="lux-control"[^>]*id="sch-subject"/);
        expect(html).toMatch(/id="sch-endtime"[^>]*class="lux-control"|class="lux-control"[^>]*id="sch-endtime"/);
        expect(html).toMatch(/id="sch-capacity"[^>]*class="lux-control"|class="lux-control"[^>]*id="sch-capacity"/);
        expect(html).toMatch(/id="sch-session-type"[^>]*class="lux-control"|class="lux-control"[^>]*id="sch-session-type"/);
        expect(html).toMatch(/id="sch-preset-search"[^>]*class="lux-control/);
        expect(tokens).toContain('--lux-panel-control:');
        expect(tokens).toContain('--lux-elev-1:');
        const session = readSource('assets/css/admin-scheduler-session-modal.css');
        expect(bare).not.toMatch(/#schModalOverlay \.lux-control\s*\{[^}]*min-height:\s*48px[^}]*padding:\s*12px 14px/);
        expect(bare).not.toMatch(
            /\[id="schModalOverlay"\][\s\S]*?\.sch-modal-title\s*\{[\s\S]*?font-size/
        );
        expect(bare).not.toMatch(/\[id="schModalOverlay"\][\s\S]*\.sch-form-section-title\s*\{/);
        expect(session).toMatch(
            /#schModalOverlay\[data-lux-transparency-exempt="1"\] \.sch-modal-foot[\s\S]*?justify-content:\s*flex-end/
        );
        expect(modals).toMatch(/\.sch-modal-foot \.sch-create-btn[\s\S]*?min-width:\s*240px/);
        expect(modals).toContain('.lux-picker-field > .lux-picker-btn--compact');
        expect(chrome).toContain('originalParent.insertBefore(node, nativeSelect)');
    });
});
