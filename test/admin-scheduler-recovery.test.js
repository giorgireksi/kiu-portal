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

    expect(schedulerSource).toContain('assets/js/pages/admin-scheduler.js?v=20260429-schedulerselect1');
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
    expect(schedulerSource).toContain('assets/js/features/navigation.js?v=20260429-shellinit1');
    expect(schedulerSource).toContain('data-prof-quiz-close');
    expect(schedulerSource).toContain('data-admin-scheduler-action="new-session"');
    expect(schedulerSource).toContain('data-admin-scheduler-filter="faculty"');
    expect(schedulerSource).toContain('data-admin-scheduler-search="palette"');
    expect(schedulerSource).toContain('data-admin-scheduler-session-action="create"');
    expect(schedulerSource).toContain('Create Session &amp; Deploy');
    expect(schedulerSource).toContain('<option value="G1"></option>');
    expect(schedulerSource).toContain('<option value="LAB-2"></option>');
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
    expect(controllerSource).toContain("document.querySelectorAll('[data-admin-scheduler-action]')");
    expect(controllerSource).toContain("document.querySelectorAll('[data-admin-scheduler-week]')");
    expect(controllerSource).not.toContain('onclick="selectPaletteItem(');
    expect(controllerSource).not.toContain('onclick="event.stopPropagation(); openSchEditModal(');
    expect(controllerSource).not.toContain('onclick="event.stopPropagation(); schDeleteSession(');
    expect(controllerSource).not.toContain("list.innerHTML = subjects.map((subject) => {");
    expect(controllerSource).not.toContain('html += `<div class=\"sch-slot-bg\"');
    expect(controllerSource).not.toContain('html += `<div class=\"sch-event\"');
    expect(controllerSource).toContain('window.initializeAdminSchedulerPage = initializeAdminSchedulerPage;');
  });

  it('normalizes scheduler select options so faculty and semester labels cannot accumulate in the UI', () => {
    const controllerSource = readSource('assets/js/pages/admin-scheduler.js');
    const luxuryCss = readSource('assets/css/index-luxury.css');
    const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');

    expect(controllerSource).toContain('const SCHEDULER_FACULTY_OPTIONS = [');
    expect(controllerSource).toContain('function normalizeSchedulerSelectOptions()');
    expect(controllerSource).toContain("select.replaceChildren(fragment);");
    expect(controllerSource).toContain("select.removeAttribute('size');");
    expect(controllerSource).toContain("select.dataset.luxPickerLabel = label;");
    expect(shellChrome).toContain('function getCleanPickerLabelText(node)');
    expect(shellChrome).toContain("'.lux-picker-field',");
    expect(shellChrome).toContain('select.dataset.luxPickerLabel = caption;');
    expect(luxuryCss).toContain('Admin scheduler select guard');
    expect(luxuryCss).toContain('body.lux-route-admin-scheduler :is(.sch-filters, .sch-toolbar, .sch-board-toolbar-row, .sch-control-group) select');
    expect(luxuryCss).toContain('body.lux-route-admin-tools .lux-admin-tools-page select:not([multiple])');
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

    expect(countOccurrences(navigationSource, 'function initializePortalShell()')).toBe(1);
    expect(countOccurrences(navigationSource, 'function queueDeferredPortalStartup()')).toBe(1);
    expect(countOccurrences(navigationSource, 'document.addEventListener("DOMContentLoaded", initializePortalShell);')).toBe(1);
  });
});
