import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function readBuffer(relativePath) {
  return readFileSync(join(process.cwd(), relativePath));
}

function countOccurrences(source, fragment) {
  return source.split(fragment).length - 1;
}

describe('admin scheduler recovery and realtime boot loop fixes', () => {
  it('loads one canonical admin scheduler controller and disables the legacy inline engines', () => {
    const schedulerSource = readSource('admin-scheduler.html');

    expect(schedulerSource).toContain('assets/js/pages/admin-scheduler.js?v=20260606-schpalette1');
    expect(schedulerSource).toContain('assets/css/admin-scheduler-route.css?v=20260606-schpalette1');
    expect(schedulerSource).toContain('assets/js/features/luxury-shell-chrome.js?v=20260606-pickerscroll1');
    expect(schedulerSource).toContain('assets/js/shared/utilities.js?v=20260606-schmodal4');
    expect(schedulerSource).toContain('assets/js/features/index-luxury.js?v=20260606-schpalette1');
    expect(schedulerSource).toContain('type="hidden" id="sch-prof"');
    expect(schedulerSource).toContain('type="hidden" id="sch-ta"');
    expect(schedulerSource).toContain('sch-form-section-title">Session Type</div>');
    expect(schedulerSource).not.toContain('sch-profs-list');
    expect(schedulerSource).not.toContain('Search by name...');
    expect(schedulerSource).not.toContain('sch-input-row-prof');
    expect(schedulerSource).toContain('sch-modal-head sch-modal-head-accent');
    expect(schedulerSource).toContain('<div id="page-admin-scheduler" class="page-section active-page">');
    expect(schedulerSource).not.toContain('Ãƒ');
    expect(countOccurrences(schedulerSource, 'type="application/x-kiu-disabled"')).toBeGreaterThanOrEqual(2);
    expect(schedulerSource).toContain('assets/js/app/auth.js?v=20260429-authfix2');
    expect(schedulerSource).toContain('assets/js/shared/faculty.js?v=20260429-peopleisolation1');
    expect(schedulerSource).not.toContain('assets/js/shared/messenger.js');
    expect(schedulerSource).not.toContain('assets/js/app/api.js');
    expect(schedulerSource).not.toContain('assets/js/features/ui.js');
    expect(schedulerSource).toContain('<nav id="prof-nav" aria-label="Professor navigation stub"');
    expect(schedulerSource).toContain('<nav id="top-nav" aria-label="Top navigation stub"');
    expect(schedulerSource).toContain('<nav id="admin-nav" aria-label="Admin navigation stub"');
    expect(schedulerSource).toContain('<label class="sch-control-group">');
    expect(schedulerSource).not.toContain('<label class="sch-control-group" for="admin-tt-faculty">');
    expect(schedulerSource).toContain('assets/js/features/navigation.js?v=20260604-standaloneboot2');
    expect(schedulerSource).toContain('data-prof-quiz-close');
    expect(schedulerSource).not.toContain('sch-actions-section');
    expect(schedulerSource).not.toContain('sch-board-hero');
    expect(schedulerSource).not.toContain('sch-board-legend');
    expect(schedulerSource).toContain('sch-grid-topline-end');
    expect(schedulerSource).toContain('id="scheduler-week-label"');
    expect(schedulerSource).toContain('data-admin-scheduler-week="current"');
    expect(schedulerSource).toContain('data-admin-scheduler-filter="faculty"');
    expect(schedulerSource).toContain('data-admin-scheduler-search="palette"');
    expect(schedulerSource).toContain('data-admin-scheduler-session-action="create"');
    expect(schedulerSource).toContain('Create Session &amp; Deploy');
    expect(schedulerSource).toContain('data-scheduler-preset-manage="group"');
    expect(schedulerSource).toContain('data-scheduler-preset-manage="room"');
    expect(schedulerSource).toContain('<template id="sch-preset-manager-template">');
    expect(schedulerSource).toContain('id="schPresetManagerOverlay"');
    expect(schedulerSource).toContain('id="sch-preset-search"');
    expect(schedulerSource).toContain('id="sch-preset-list"');
    expect(schedulerSource).toContain('sch-form-section-title">All presets</div>');
    expect(schedulerSource).toContain('sch-preset-manage-helper');
    expect(schedulerSource).not.toContain('id="sch-preset-restore-hidden"');
    expect(schedulerSource).not.toContain('data-scheduler-preset-restore="true"');
    expect(schedulerSource).not.toContain('id="sch-group-draft"');
    expect(schedulerSource).not.toContain('data-scheduler-preset-save="group"');
    expect(schedulerSource).not.toContain('data-scheduler-preset-save="room"');
    expect(schedulerSource).not.toContain('id="schPresetManagerOverlay" data-admin-scheduler-preset-overlay="true"><div class="sch-modal"');
    expect(schedulerSource).toContain('<select id="sch-group"');
    expect(schedulerSource).toContain('<select id="sch-room"');
    expect(schedulerSource).not.toContain('list="db-groups"');
    expect(schedulerSource).not.toContain('list="db-rooms"');
    expect(schedulerSource).not.toContain('id="db-groups"');
    expect(schedulerSource).not.toContain('id="db-rooms"');
    expect(schedulerSource).toContain('data-admin-scheduler-session-field="time"');
    expect(schedulerSource).toContain('data-admin-scheduler-modal-overlay="true"');
    expect(schedulerSource).toContain('<template id="prof-quiz-modal-template">');
    expect(schedulerSource).toContain('<template id="sch-modal-template">');
    expect(schedulerSource).toContain('<button class="mob-sheet-btn" type="button" id="mob-act-admin"><span class="mob-sheet-icon"');
    expect(schedulerSource).not.toContain('<button class="mob-sheet-btn" id="mob-act-admin"><div class="mob-sheet-icon"');
    expect(schedulerSource).not.toContain('id="profQuizModalOverlay"><div class="sch-modal" style=');
    expect(schedulerSource).not.toContain('id="schModalOverlay" data-admin-scheduler-modal-overlay="true"><div class="sch-modal"');
    expect(schedulerSource).toContain('class="sch-visually-hidden"');
    expect(schedulerSource).toContain('class="sch-input-row sch-input-row-subject"');
    expect(schedulerSource).not.toContain('onclick="openSchedulerQuickCreate()"');
    expect(schedulerSource).not.toContain('onclick="if(event.target===this)closeSchModal()"');
    expect(schedulerSource).not.toContain('onclick="removeProfQuizQuestion(');
    expect(schedulerSource).not.toContain('onchange="profQuizQuestions[');
    expect(schedulerSource).not.toContain('function bindAdminSchedulerInteractions()');
    expect(schedulerSource).not.toContain('setInterval(function(){if(typeof window.navigate===\'function\')');
  });

  it('ships admin-scheduler.html without a UTF-8 BOM', () => {
    const buffer = readBuffer('admin-scheduler.html');

    expect(buffer[0]).not.toBe(0xef);
    expect(buffer[1]).not.toBe(0xbb);
    expect(buffer[2]).not.toBe(0xbf);
  });

  it('routes scheduler mutations through the shared faculty scheduler APIs and migration helpers', () => {
    const controllerSource = readSource('assets/js/pages/admin-scheduler.js');

    expect(controllerSource).toContain('getAvailableScheduleItemsForWeek(');
    expect(controllerSource).toContain('resolveScheduledGroupForWeek(');
    expect(controllerSource).toContain('upsertScheduledSession(');
    expect(controllerSource).toContain('deleteScheduledSession(');
    expect(controllerSource).toContain('migrateStudentSchedulesForScheduledGroup(');
    expect(controllerSource).toContain('function ensureMountedTemplate(templateId, nodeId)');
    expect(controllerSource).toContain('function bindProfessorQuizModalListeners(modal)');
    expect(controllerSource).toContain('function bindSchedulerCreateModalListeners(modal)');
    expect(controllerSource).toContain('function buildSchedulerPaletteCard(subject, facultyCode, isActive)');
    expect(controllerSource).toContain('function buildSchedulerSlotBackground(entry, slot, semester, weekStart)');
    expect(controllerSource).toContain('function buildSchedulerEventCard(session, weekStart)');
    expect(controllerSource).toContain('data-prof-quiz-question-remove');
    expect(controllerSource).toContain('data-prof-quiz-question-text');
    expect(controllerSource).toContain('data-prof-quiz-question-points');
    expect(controllerSource).toContain('data-scheduler-subject-id');
    expect(controllerSource).toContain('data-scheduler-slot-day');
    expect(controllerSource).toContain('data-scheduler-session-action');
    expect(controllerSource).toContain('list.replaceChildren(fragment);');
    expect(controllerSource).toContain('container.replaceChildren(fragment);');
    expect(controllerSource).not.toContain("document.querySelectorAll('[data-admin-scheduler-action]')");
    expect(controllerSource).toContain("document.querySelectorAll('[data-admin-scheduler-week]')");
    expect(controllerSource).not.toContain("labelSchedulerSelect('grid-view-fac'");
    expect(controllerSource).not.toContain("setText('sch-board-palette-count'");
    expect(controllerSource).not.toContain('onclick="selectPaletteItem(');
    expect(controllerSource).not.toContain('onclick="event.stopPropagation(); openSchEditModal(');
    expect(controllerSource).not.toContain('onclick="event.stopPropagation(); schDeleteSession(');
    expect(controllerSource).not.toContain("list.innerHTML = subjects.map((subject) => {");
    expect(controllerSource).not.toContain('html += `<div class=\"sch-slot-bg\"');
    expect(controllerSource).not.toContain('html += `<div class=\"sch-event\"');
    expect(controllerSource).toContain("const schedulerPage = el('page-admin-scheduler');");
    expect(controllerSource).toContain("document.body.classList.remove('lux-home-page', 'lux-route-home', 'kiu-shell-loading');");
    expect(controllerSource).toContain('const SCHEDULER_PALETTE_SEARCH_DEBOUNCE_MS = 120;');
    expect(controllerSource).toContain('function queueSchedulerRefresh(options = {})');
    expect(controllerSource).toContain("queueSchedulerRefresh({ palette: true, grid: true });");
    expect(controllerSource).toContain('window.initializeAdminSchedulerPage = initializeAdminSchedulerPage;');
  });

  it('normalizes scheduler select options so faculty and semester labels cannot accumulate in the UI', () => {
    const controllerSource = readSource('assets/js/pages/admin-scheduler.js');
    const routeCss = readSource('assets/css/admin-scheduler-route.css');
    const luxuryCss = readSource('assets/css/index-luxury.css');
    const adminToolsCss = readSource('assets/css/admin-tools-luxury.css');
    const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');
    const utilitiesSource = readSource('assets/js/shared/utilities.js');

    expect(controllerSource).toContain('const SCHEDULER_FACULTY_OPTIONS = [');
    expect(controllerSource).toContain('function normalizeSchedulerSelectOptions()');
    expect(controllerSource).toContain("select.replaceChildren(fragment);");
    expect(controllerSource).toContain("select.removeAttribute('size');");
    expect(controllerSource).toContain("select.dataset.luxPickerLabel = label;");
    expect(shellChrome).toContain('function resolveExternalPickerLabel(select)');
    expect(shellChrome).toContain('lux-picker-btn--compact');
    expect(shellChrome).toContain('wirePickerButtonAriaLabel(button, externalLabel, select)');
    expect(shellChrome).toContain('function getCleanPickerLabelText(node)');
    expect(shellChrome).toContain("'.lux-picker-field',");
    expect(shellChrome).toContain('select.dataset.luxPickerLabel = caption;');
    expect(shellChrome).toContain('sch-session-picker-panel');
    expect(shellChrome).toContain('lux-picker-panel-scroll');
    expect(shellChrome).toContain("select.closest('#schModalOverlay, #schPresetManagerOverlay')");
    expect(shellChrome).toContain('function isPickerScrollExempt(panel, scrollTarget)');
    expect(shellChrome).toContain('function clearLuxPickerPanelListeners(panel)');
    expect(shellChrome).toContain('const scrollHandler = (event) => {');
    expect(shellChrome).toContain('panel.contains(scrollTarget)');
    expect(shellChrome).toContain('const exemptRoot = scrollTarget.closest?.(PICKER_SCROLL_EXEMPT_SELECTORS)');
    expect(shellChrome).toContain("if (isPickerScrollExempt(panel, event.target)) return;");
    expect(shellChrome).toContain('panel._luxPickerScrollHandler = scrollHandler');
    expect(shellChrome).toContain('panel._luxPickerWheelHandler = wheelHandler');
    expect(shellChrome).toContain('event.stopPropagation()');
    expect(shellChrome).toContain('clearLuxPickerPanelListeners(panel)');
    expect(controllerSource).toContain('window.closePickerPanels()');
    expect(routeCss).toContain('--sch-fade-surface');
    expect(routeCss).toContain('--sch-fade-control');
    expect(routeCss).toContain('--sch-grid-chrome-bg');
    expect(routeCss).toContain('--sch-grid-time-pill-bg');
    expect(routeCss).toContain('--sch-event-control');
    expect(routeCss).toContain('#page-admin-scheduler .sch-time-labels');
    expect(routeCss).toContain('#page-admin-scheduler .sch-time-slot-copy');
    expect(routeCss).toContain('background: var(--sch-grid-time-pill-bg) !important');
    expect(routeCss).toContain('background: var(--sch-event-control) !important');
    expect(routeCss).toContain('#page-admin-scheduler .sch-stat-card');
    expect(routeCss).toContain('.sch-control-group select:not(.lux-universal-native-select)');
    expect(routeCss).toContain('.sch-board-toolbar-row select:not(.lux-universal-native-select)');
    expect(routeCss).toContain('.sch-filter-section select.lux-universal-native-select');
    expect(routeCss).toContain('.sch-filter-section .lux-picker-panel:not(.is-open)');
    expect(routeCss).toContain('.sch-filter-section:has(.lux-picker-panel.is-open)');
    expect(routeCss).toContain('#schModalOverlay .lux-picker-field > .lux-picker-label');
    expect(routeCss).toContain('#schModalOverlay .lux-picker-btn .lux-picker-caption');
    expect(luxuryCss).toContain('select:not(.lux-universal-native-select)');
    expect(routeCss).toContain('body.lux-route-admin-scheduler .sch-modal-overlay {');
    expect(routeCss).toContain('display: none;');
    expect(routeCss).toContain('body.lux-route-admin-scheduler .sch-modal-overlay.open {');
    expect(routeCss).toContain('pointer-events: auto;');
    expect(controllerSource).toContain('getSchedulerFacultyTone(facultyCode)');
    expect(controllerSource).toContain("card.style.setProperty('--sch-event-rgb', tone.rgb)");
    expect(luxuryCss).not.toContain('Admin scheduler select guard');
    expect(luxuryCss).not.toContain('body.lux-route-admin-scheduler #app-content {');
    expect(luxuryCss).not.toMatch(
      /body\.lux-route-admin-scheduler \.sch-sidebar[\s\S]{0,220}linear-gradient\(180deg, rgba\(13, 19, 31/
    );
    expect(luxuryCss).not.toMatch(
      /body\.lux-route-admin-scheduler \.sch-main[\s\S]{0,220}linear-gradient\(180deg, rgba\(13, 19, 31/
    );
    expect(luxuryCss).not.toMatch(
      /body\.lux-route-admin-scheduler \.sch-header-row[\s\S]{0,180}linear-gradient\(180deg, rgba\(255, 255, 255/
    );
    expect(luxuryCss).not.toMatch(
      /body\.lux-route-admin-scheduler \.sch-time-labels[\s\S]{0,180}linear-gradient\(180deg, rgba\(255, 255, 255/
    );
    expect(luxuryCss).not.toMatch(
      /body\.lux-route-admin-scheduler \.sch-event \.ev-trash[\s\S]{0,120}top: 10px/
    );
    expect(utilitiesSource).toContain('isSchedulerLargeSurface');
    expect(utilitiesSource).toContain('isSchedulerSoftSurface');
    expect(utilitiesSource).toContain('isSchedulerControlSurface');
    expect(utilitiesSource).toContain('sch-time-labels');
    expect(utilitiesSource).toContain('#page-admin-scheduler .lux-strip-card');
    expect(adminToolsCss).toContain('body.lux-route-admin-tools .lux-admin-tools-page select:not([multiple])');
    expect(routeCss).toContain('--sch-fade-modal-overlay');
    expect(routeCss).toContain('--sch-fade-modal-fill');
    expect(routeCss).toContain('--sch-fade-modal-head-bg');
    expect(routeCss).toContain('#schModalOverlay .sch-form-section');
    expect(routeCss).toContain('background: var(--sch-fade-modal-fill)');
    expect(routeCss).toContain('html.lux-high-transparency body.lux-route-admin-scheduler:not(.lux-light-mode) #schModalOverlay .sch-modal');
    expect(utilitiesSource).toContain("el.closest?.('#schModalOverlay')");
    expect(controllerSource).toContain("modal.dataset.luxSchModal = '1'");
    expect(controllerSource).toContain('queueLuxuryTransparencyRefresh(undefined, { roots: [modal] })');
  });

  it('keeps the session modal on the scheduler fade glass and transparency contract', () => {
    const routeCss = readSource('assets/css/admin-scheduler-route.css');
    const utilities = readSource('assets/js/shared/utilities.js');
    const luxury = readSource('assets/js/features/index-luxury.js');
    const controller = readSource('assets/js/pages/admin-scheduler.js');

    expect(routeCss).toContain('--sch-fade-modal-overlay');
    expect(routeCss).toContain('--sch-fade-modal-fill');
    expect(routeCss).toContain('--sch-fade-modal-head-bg');
    expect(routeCss).toContain('#schModalOverlay .sch-modal-head-accent');
    expect(routeCss).toContain('background: var(--sch-fade-modal-overlay)');
    expect(routeCss).toContain('#schModalOverlay .sch-create-btn.lux-primary-btn:not(.lux-modern-button)');
    expect(routeCss).toContain('#schModalOverlay .lux-picker-panel.lux-universal-picker-panel');
    expect(routeCss).toContain('--sch-picker-visible-options: 4');
    expect(routeCss).toContain('--sch-picker-option-height: 62px');
    expect(routeCss).toContain('--sch-picker-panel-max-height');
    expect(routeCss).toContain('.sch-session-picker-panel');
    expect(routeCss).toContain('max-height: var(--sch-picker-panel-max-height)');
    expect(routeCss).toContain('overflow-y: auto');
    expect(routeCss).toContain('#schModalOverlay.open .sch-modal-body');
    expect(routeCss).toContain('overscroll-behavior: contain');
    expect(routeCss).toContain('#schPresetManagerOverlay');
    expect(routeCss).toContain('#schModalOverlay .sch-preset-manage-link');
    expect(utilities).toContain("el.closest?.('#schModalOverlay')");
    expect(utilities).toContain("el.closest?.('#schPresetManagerOverlay')");
    expect(luxury).toContain("node.closest?.('#schModalOverlay')");
    expect(luxury).toContain("node.closest?.('#schPresetManagerOverlay')");
    expect(controller).toContain("modal.dataset.luxSchModal = '1'");
    expect(controller).toContain("modal.querySelector('.sch-modal')?.setAttribute('data-lux-glass-root', '1')");
    expect(controller).toContain('queueLuxuryTransparencyRefresh(undefined, { roots: [modal] })');
    expect(controller).toContain('enhanceUniversalPickers(modal)');
    expect(controller).not.toContain('schedulerProfInputBound');
    expect(controller).not.toContain('schedulerTaInputBound');
    expect(controller).not.toContain('sch-profs-list');
    expect(controller).toContain("el('sch-prof').value = profFilter && profFilter !== 'all' ? profFilter : ''");
    expect(controller).toContain("el('sch-ta').value = taFilter && taFilter !== 'all' ? taFilter : ''");
    expect(controller).toContain('SCHEDULER_SESSION_PRESETS_KEY');
    expect(controller).toContain("'kiuSchedulerSessionPresets'");
    expect(controller).toContain('SCHEDULER_DEFAULT_GROUP_PRESETS');
    expect(controller).toContain("'G1'");
    expect(controller).toContain("'LAB-2'");
    expect(controller).toContain('saveSchedulerSessionPreset');
    expect(controller).toContain('refreshSchedulerGroupRoomPickers');
    expect(controller).toContain('markSchedulerDurationCustom');
    expect(controller).toContain('handleSchedulerManualTimeEdit');
    expect(controller).toContain('openSchedulerPresetManager');
    expect(controller).toContain('closeSchedulerPresetManager');
    expect(controller).toContain('deleteSchedulerSessionPreset');
    expect(controller).toContain('hideSchedulerDefaultPreset');
    expect(controller).toContain('handleSchedulerPresetManagerRemove');
    expect(controller).toContain('getVisibleSchedulerDefaultPresets');
    expect(controller).toContain('hiddenGroups');
    expect(controller).toContain('hiddenRooms');
    expect(controller).not.toContain('restoreSchedulerHiddenDefaults');
    expect(controller).toContain('filterSchedulerPresetManagerList');
    expect(controller).toContain('renderSchedulerPresetManagerList');
    expect(controller).toContain("'sch-preset-manager-template'");
    expect(controller).not.toContain('handleSchedulerPresetSave');
    expect(controller).not.toContain("['sch-time', 'sch-duration']");
    expect(controller).not.toContain('schedulerEndTimeBound');
  });

  it('keeps subject palette selection stable without full list rebuild on click', () => {
    const controller = readSource('assets/js/pages/admin-scheduler.js');
    const luxury = readSource('assets/js/features/index-luxury.js');
    const routeCss = readSource('assets/css/admin-scheduler-route.css');

    expect(controller).toContain('function syncPaletteSelectionState(');
    expect(controller).toContain("card.classList.toggle('selected'");
    expect(controller).toContain('syncPaletteSelectionState(id)');
    expect(controller).not.toMatch(/function selectPaletteItem\([\s\S]{0,320}renderPalette\(\)/);
    expect(luxury).toContain("node.classList?.contains('palette-card')");
    expect(luxury).toContain("node.closest?.('#palette-list')");
    expect(routeCss).not.toContain('.palette-card:hover {\n    transform: translateY(-2px)');
    expect(routeCss).toContain('#page-admin-scheduler .palette-card:focus-visible');
    expect(routeCss).toContain('#page-admin-scheduler .palette-card.lux-modern-button');
  });

  it('mounts group/room preset popup manager on template contract with localStorage delete and search', () => {
    const schedulerSource = readSource('admin-scheduler.html');
    const controller = readSource('assets/js/pages/admin-scheduler.js');
    const routeCss = readSource('assets/css/admin-scheduler-route.css');

    expect(schedulerSource).toContain('data-admin-scheduler-preset-overlay="true"');
    expect(schedulerSource).toContain('data-scheduler-preset-add="true"');
    expect(schedulerSource).toContain('data-admin-scheduler-preset-close');
    expect(schedulerSource).toContain('data-admin-scheduler-preset-done');
    expect(controller).toContain('writeSchedulerSessionPresets');
    expect(controller).toContain('readSchedulerSessionPresets');
    expect(controller).toContain('data-scheduler-preset-manage');
    expect(controller).toContain('data-scheduler-preset-remove');
    expect(controller).not.toContain('data-scheduler-preset-delete');
    expect(controller).not.toContain('data-scheduler-preset-hide');
    expect(controller).not.toContain('data-scheduler-preset-restore');
    expect(controller).toContain('getVisibleSchedulerDefaultPresets(');
    expect(controller).toContain("el('sch-preset-search')");
    expect(controller).toContain("classList.add('open')");
    expect(routeCss).toContain('body.lux-route-admin-scheduler .sch-modal-overlay.open');
    expect(routeCss).toContain('pointer-events: auto');
    expect(routeCss).not.toContain('.sch-preset-manage-hide-btn');
    expect(routeCss).toContain('.sch-preset-manage-helper');
    expect(schedulerSource).not.toContain('onclick="openSchedulerPresetManager(');
  });

  it('bootstraps realtime for the authenticated user only and dedupes scheduled startup', () => {
    const authSource = readSource('assets/js/app/auth.js');

    expect(authSource).toContain('await syncUserToRealtimeBridge(currentUser);');
    expect(authSource).not.toContain('await syncAllKnownUsersToRealtimeBridge();');
    expect(authSource).toContain('const alreadyScheduledForCurrentUser = runtime.bootstrapScheduledHandle && runtime.bootstrapScheduledFor === currentUserId;');
    expect(authSource).toContain('if (!force && (alreadyScheduledForCurrentUser || runtime.bootstrapPromise)) return;');
    expect(authSource).toContain('runtime.bootstrapScheduledHandle = setTimeout(() => {');
  });

  it('keeps only one authoritative portal shell initializer in navigation', () => {
    const navigationSource = readSource('assets/js/features/navigation.js');
    const utilitiesSource = readSource('assets/js/shared/utilities.js');

    expect(countOccurrences(navigationSource, 'function initializePortalShell()')).toBe(1);
    expect(countOccurrences(navigationSource, 'function queueDeferredPortalStartup()')).toBe(1);
    expect(countOccurrences(navigationSource, 'document.addEventListener("DOMContentLoaded", initializePortalShell);')).toBe(1);
    expect(utilitiesSource).toContain("const shouldRenderHomeShell = typeof getActivePageId === 'function'");
    expect(utilitiesSource).toContain("if (shouldRenderHomeShell && typeof renderHomeShell === 'function') {");
  });
});
