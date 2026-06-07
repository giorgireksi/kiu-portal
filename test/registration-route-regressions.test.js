import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('registration route regressions', () => {
  it('keeps the registration shell free of dead social helper and legacy page-pack imports', () => {
    const html = readSource('registration.html');
    const routeControllerSource = readSource('assets/js/pages/registration-student-route.js');
    const messengerSource = readSource('assets/js/shared/messenger.js');
    const uiScript = readSource('assets/js/features/ui.js');

    expect(html).not.toContain('assets/js/shared/social-hub.js');
    expect(html).not.toContain('assets/js/shared/social-render.js');
        expect(html).not.toContain('assets/js/shared/social-media.js');
        expect(html).toContain('assets/js/shared/messenger.js?v=20260605-regpicker3');
        expect(html).not.toContain('assets/js/pages/gradebook.js');
        expect(html).not.toContain('assets/js/pages/lms.js');
        expect(html).not.toContain('assets/js/pages/registration.js');
        expect(html).not.toContain('assets/js/pages/directories.js');
        expect(html).toContain('assets/css/registration-route.css?v=20260605-regtabs1');
        expect(html).toContain('<div id="modal-overlay" class="modal-overlay"></div>');
    expect(html).not.toContain('id="modal-announcement"');
    expect(html).not.toContain('id="modal-event"');
    expect(html).not.toContain('id="modal-syllabus"');
    expect(html).not.toContain('id="modal-programs"');
    expect(html).not.toContain('id="modal-program-courses"');
    expect(routeControllerSource).toContain('function refreshRegistrationUI() {');
    expect(routeControllerSource).toContain('function updateEctsProgress() {');
    expect(messengerSource).toContain('function renderPortalMessengerWorkspace()');
    expect(uiScript).toContain('function ensureSyllabusModal()');
    expect(uiScript).toContain('data-show-program-courses="1"');
  });

  it('keeps the live registration route controller on explicit selected-course and ects-progress contracts', () => {
    const html = readSource('registration.html');
    const routeControllerSource = readSource('assets/js/pages/registration-student-route.js');
    const routeCss = readSource('assets/css/registration-route.css');

    expect(html).toContain('registration-summary-card registration-summary-card--hero');
    expect(html).toContain('admin-chip wave2-chip wave2-chip--hero');
    expect(html).toContain('registration-signal-card registration-signal-card--hold');
    expect(html).toContain('registration-summary-card registration-summary-card--ects');
    expect(html).toContain('registration-helper-note');
    expect(html).toContain('registration-progress-shell');
    expect(html).toContain('registration-progress-metrics');
    expect(html).toContain('registration-progress-track');
    expect(html).toContain('class="registration-progress-bar"');
    expect(html).toContain('class="registration-progress-value"');
    expect(routeControllerSource).toContain("bar.style.setProperty('--registration-ects-progress', `${percentage}%`);");
    expect(routeControllerSource).toContain("bar.classList.toggle('is-complete', isComplete);");
    expect(routeControllerSource).toContain("txt.classList.toggle('is-complete', isComplete);");
    expect(routeControllerSource).toContain('class="registration-selected-empty"');
    expect(routeControllerSource).toContain('class="registration-selected-row"');
    expect(routeControllerSource).toContain('class="registration-selected-cell registration-selected-cell--left"');
    expect(routeControllerSource).toContain('class="registration-selected-cell registration-selected-cell--title"');
    expect(routeControllerSource).not.toContain("bar.style.background = 'var(--kiu-green)'");
    expect(routeControllerSource).not.toContain("txt.style.color = 'var(--kiu-green)'");
    expect(routeControllerSource).not.toContain('<td style="text-align:left;">${course.groupName}</td>');
    expect(routeControllerSource).not.toContain('<td style="text-align:left; font-weight:600;">${course.courseName}</td>');
    expect(routeCss).toContain('.registration-summary-label');
    expect(routeCss).toContain('.registration-summary-value');
    expect(routeCss).toContain('.registration-summary-copy');
    expect(routeCss).toContain('.registration-signal-card');
    expect(routeCss).toContain('.registration-hero .wave2-chip--hero');
    expect(routeCss).toContain('.registration-helper-note');
    expect(routeCss).toContain('.registration-progress-shell');
    expect(routeCss).toContain('.registration-progress-track');
    expect(routeCss).toContain('.registration-progress-bar.is-complete {');
    expect(routeCss).toContain('.registration-progress-value.is-complete {');
  });

  it('keeps registration runtime flows on classes and data-only custom properties instead of inline visual styling', () => {
    const routeControllerSource = readSource('assets/js/pages/registration-student-route.js');
    const studentRegistrationSource = readSource('assets/js/pages/student-registration.js');
    const sharedRegistrationSource = readSource('assets/js/pages/registration-shared.js');

    expect(routeControllerSource).toContain("bar.style.setProperty('--registration-ects-progress', `${percentage}%`);");
    expect(routeControllerSource).not.toContain("bar.style.background =");
    expect(routeControllerSource).not.toContain("txt.style.color =");
    expect(routeControllerSource).not.toContain('style="');
    expect(routeControllerSource).not.toContain('style=');
    expect(routeControllerSource).not.toContain('cssText');

    expect(studentRegistrationSource).not.toContain('style="');
    expect(studentRegistrationSource).not.toContain('style=');
    expect(studentRegistrationSource).not.toContain('.style.');
    expect(studentRegistrationSource).not.toContain('cssText');

    expect(sharedRegistrationSource).not.toContain('style="');
    expect(sharedRegistrationSource).not.toContain('style=');
    expect(sharedRegistrationSource).not.toContain('.style.');
    expect(sharedRegistrationSource).not.toContain('cssText');
    expect(sharedRegistrationSource).toContain('function getAssignedCourseCurriculumDetails');
    expect(sharedRegistrationSource).toContain('function normalizeAssignedSemesterRestriction');
    expect(sharedRegistrationSource).toContain('function getSemesterRestrictionFieldConfig');
    expect(sharedRegistrationSource).toContain('function getTrackGroupProgress');
  });

  it('keeps the shared portal runtime diagnostic banner on shared surface classes instead of inline chrome', () => {
    const apiSource = readSource('assets/js/app/api.js');
    const sharedSurfaceSource = readSource('assets/css/lux-surfaces.css');

    expect(apiSource).toContain("banner.className = 'kiu-portal-runtime-diagnostic';");
    expect(apiSource).toContain('class="kiu-portal-runtime-diagnostic__row"');
    expect(apiSource).toContain('class="kiu-portal-runtime-diagnostic__title"');
    expect(apiSource).toContain('class="kiu-portal-runtime-diagnostic__message"');
    expect(apiSource).toContain('class="kiu-portal-runtime-diagnostic__close"');
    expect(apiSource).not.toContain('banner.style.cssText = [');
    expect(apiSource).not.toContain('<div style="display:flex; justify-content:space-between;');
    expect(apiSource).not.toContain('data-close-portal-diagnostic="1" style="border:0; background:transparent;');
    expect(sharedSurfaceSource).toContain('.kiu-portal-runtime-diagnostic {');
    expect(sharedSurfaceSource).toContain('.kiu-portal-runtime-diagnostic__row {');
    expect(sharedSurfaceSource).toContain(".kiu-portal-runtime-diagnostic[data-diagnostic-kind='backend-timeout'] {");
  });

  it('removes dead registration route fallback selectors that depended on old inline styles', () => {
    const routeCss = readSource('assets/css/registration-route.css');
    const legacyRegistrationSource = readSource('assets/js/pages/registration.js');
    const studentRegistrationSource = readSource('assets/js/pages/student-registration.js');
    const routeControllerSource = readSource('assets/js/pages/registration-student-route.js');

    expect(routeCss).not.toContain(".only-student[style*='position: fixed']");
    expect(routeCss).not.toContain("#student-reg-content-container [style*='background:#f8fbff']");
    expect(routeCss).not.toContain(".registration-course-row [style*='color:#64748b']");
    expect(routeCss).not.toContain(".registration-state-card [style*='background:white']");
    expect(routeCss).not.toContain(".registration-track-card [style*='background:#f8fafc']");
    expect(legacyRegistrationSource).not.toContain("background:#f8fbff");
    expect(studentRegistrationSource).not.toContain("background:#f8fbff");
    expect(routeControllerSource).not.toContain("style=\"text-align:left;\"");
  });

  it('uses delegated shell actions instead of inline registration HTML handlers', () => {
    const html = readSource('registration.html');
    const routeControllerSource = readSource('assets/js/pages/registration-student-route.js');
    const uiScript = readSource('assets/js/features/ui.js');

    expect(html).not.toContain('onclick="switchRegTab(');
    expect(html).not.toContain('onclick="closeAllModals(');
    expect(html).not.toContain('onclick="navigate(');
    expect(html).not.toContain('onclick="showProgramCourses(');
    expect(html).toContain('data-reg-tab="program"');
    expect(html).toContain('class="reg-tabs reg-tabs--plain"');
    expect(html).toContain('<button type="button" class="reg-tab active"');
    expect(html).toContain('data-registration-nav="timetable"');
    expect(html).toContain('lux-primary-btn wave2-action-btn wave2-action-btn--primary');
    expect(html).toContain('lux-secondary-btn wave2-action-btn wave2-action-btn--secondary');
    expect(html).toContain('registration-progress-submit wave2-action-btn wave2-action-btn--primary');
    expect(html).toContain('registration-hero lux-summary-surface lux-summary-surface--hero');
    expect(html).toContain('registration-focus-card registration-summary-card registration-summary-card--hero lux-hero-side-head');
    expect(html).toContain('registration-insight-card registration-summary-card registration-summary-card--hold lux-summary-surface lux-summary-surface--panel');
    expect(routeControllerSource).toContain('function initializeRegistrationShellInteractions()');
    expect(routeControllerSource).toContain('function handleRegistrationShellClick(event)');
    expect(routeControllerSource).toContain("event.target.closest('[data-modal-close]')");
    expect(uiScript).toContain('data-modal-close="1"');
  });

  it('keeps the student registration adapters wired from the slimmer shell', () => {
    const html = readSource('registration.html');
    const routeControllerSource = readSource('assets/js/pages/registration-student-route.js');
    const timetableRuntimeSource = readSource('assets/js/pages/timetable-runtime.js');
    const studentRegistrationSource = readSource('assets/js/pages/student-registration.js');
    const legacyRegistrationSource = readSource('assets/js/pages/registration.js');

    expect(html).toContain('assets/js/pages/timetable-runtime.js?v=20260605-regpicker3');
    expect(html).not.toContain('assets/js/pages/planner.js');
    expect(html).toContain('assets/js/pages/registration-enrollment.js');
    expect(html).toContain('assets/js/pages/student-registration.js?v=20260606-regtrack1');
    expect(html).toContain('assets/js/pages/registration-shared.js?v=20260606-regtrack1');
    expect(html).not.toContain('assets/js/pages/admin-registration.js');
    expect(html).toContain('assets/js/pages/registration-student-route.js?v=20260606-regtrack1');
    expect(timetableRuntimeSource).toContain('function renderTimetable() {');
    expect(timetableRuntimeSource).toContain('function renderStudentCalendarSchedule() {');
    expect(routeControllerSource).toContain('function getRegistrationGroupStats(courseId, group) {');
    expect(routeControllerSource).toContain('renderStudentRegStructures(window.__studentRegActiveTab || \'prog\')');
    expect(studentRegistrationSource).toContain('function getStudentRegistrationDataForTab(faculty, tabId) {');
    expect(studentRegistrationSource).toContain('function buildStudentRegistrationDataFromStandaloneState(faculty) {');
    expect(studentRegistrationSource).toContain('buildStudentRegistrationDataFromCms');
    expect(studentRegistrationSource).toContain('function renderStudentRegStructures(tabId = \'prog\')');
    expect(studentRegistrationSource).toContain('function openStudentCourseSectionPicker(courseId, courseName =');
    expect(studentRegistrationSource).toContain("{ id: 'history', label: 'History' }");
    expect(studentRegistrationSource).toContain("{ id: 'selected', label: 'Selected<br>Courses' }");
    expect(studentRegistrationSource).toContain("tab.setAttribute('data-reg-tab', desired.id);");
    expect(studentRegistrationSource).toContain('function sanitizeRegistrationTabStripVisuals(tabsHost)');
    expect(studentRegistrationSource).toContain("const newTab = document.createElement('button');");
    expect(studentRegistrationSource).toContain("tab.removeAttribute('onclick');");
    expect(studentRegistrationSource).toContain("tab.hidden = true;");
    expect(studentRegistrationSource).toContain("tab.hidden = false;");
    expect(studentRegistrationSource).toContain("el.hidden = !hidden;");
    expect(studentRegistrationSource).not.toContain("tab.style.display = 'none';");
    expect(legacyRegistrationSource).not.toContain("target.style.display = 'block';");
  });

  it('keeps registration avatars local instead of third-party placeholder services', () => {
    const routeControllerSource = readSource('assets/js/pages/registration-student-route.js');
    const legacyRegistrationSource = readSource('assets/js/pages/registration.js');
    const routeCss = readSource('assets/css/registration-route.css');
    const utilitiesSource = readSource('assets/js/shared/utilities.js');

    expect(routeControllerSource).toContain('function getRegistrationAvatarSrc(person, options = {}) {');
    expect(routeControllerSource).not.toContain('ui-avatars.com');
    expect(legacyRegistrationSource).toContain('function getRegistrationAvatarSrc(person, options = {}) {');
    expect(legacyRegistrationSource).not.toContain('ui-avatars.com');
    expect(legacyRegistrationSource).not.toContain('via.placeholder.com');
    expect(legacyRegistrationSource).toContain('badge.hidden = normalized.length === 0;');
    expect(legacyRegistrationSource).toContain("badge.classList.add('registration-condition-badge');");
    expect(legacyRegistrationSource).toContain("container.style.removeProperty('display');");
    expect(legacyRegistrationSource).toContain('class="registration-condition-chip"');
    expect(legacyRegistrationSource).toContain('class="registration-condition-result"');
    expect(legacyRegistrationSource).toContain('class="registration-antireq-chip"');
    expect(legacyRegistrationSource).toContain('class="registration-antireq-option');
    expect(legacyRegistrationSource).toContain("button.classList.toggle('is-active', active);");
    expect(routeCss).toContain('.registration-condition-chip {');
    expect(routeCss).toContain('.registration-condition-badge {');
    expect(routeCss).toContain('.registration-condition-result {');
    expect(routeCss).toContain('.registration-parity-exception {');
    expect(routeCss).toContain('.registration-antireq-chip {');
    expect(routeCss).toContain('.registration-antireq-option.is-active {');
    expect(utilitiesSource).toContain("window.getInitialsAvatarDataUrl = function getInitialsAvatarDataUrl(name, options = {}) {");
    expect(utilitiesSource).toContain('data:image/svg+xml;charset=UTF-8,');
  });

  it('keeps the curriculum-library split on explicit classes instead of inline presentation hooks', () => {
    const legacyRegistrationSource = readSource('assets/js/pages/registration.js');
    const sharedLuxurySource = readSource('assets/css/index-luxury.css');
    const adminToolsLuxurySource = readSource('assets/css/admin-tools-luxury.css');

    expect(legacyRegistrationSource).toContain('class="curriculum-library-layout"');
    expect(legacyRegistrationSource).toContain('class="curriculum-library-module-option');
    expect(legacyRegistrationSource).toContain('class="curriculum-library-module-option-radio"');
    expect(legacyRegistrationSource).toContain('class="lux-surface curriculum-library-panel curriculum-library-panel--detail"');
    expect(legacyRegistrationSource).toContain('class="lux-secondary-btn curriculum-library-subject-delete-btn lux-curriculum-subject-card__delete"');
    expect(legacyRegistrationSource).toContain('class="curriculum-library-table-empty"');
    expect(legacyRegistrationSource).toContain('class="lux-secondary-btn curriculum-library-table-delete-btn"');
    expect(legacyRegistrationSource).not.toContain('label style="display:flex; flex-direction:column; gap:6px;');
    expect(legacyRegistrationSource).not.toContain('data-curriculum-add-module="1" style="padding:6px 10px;');
    expect(legacyRegistrationSource).not.toContain('bar.style.background =');
    expect(legacyRegistrationSource).not.toContain('txt.style.color =');
    expect(legacyRegistrationSource).not.toContain('statStatus.style.color =');
    expect(legacyRegistrationSource).not.toContain('econStatus.style.color =');
    expect(adminToolsLuxurySource).toContain('.curriculum-library-module-option {');
    expect(adminToolsLuxurySource).toContain('.curriculum-library-panel--detail {');
    expect(adminToolsLuxurySource).not.toContain('[style*="ECTS"]');
    expect(adminToolsLuxurySource).not.toContain('[style*="color:#7c3aed"]');
    expect(adminToolsLuxurySource).not.toContain('[style*="color:#7C3AED"]');
    expect(adminToolsLuxurySource).not.toContain('[style*="color:rgb(124, 58, 237)"]');
    expect(sharedLuxurySource).not.toContain('.curriculum-library-module-option {');
    expect(sharedLuxurySource).not.toContain('.curriculum-library-panel--detail {');
    expect(sharedLuxurySource).not.toContain('label[style*="radio"]');
    expect(sharedLuxurySource).not.toContain('.lux-surface[style*="min-height"]');
  });

  it('keeps the selected-course table on explicit registration classes', () => {
    const legacyRegistrationSource = readSource('assets/js/pages/registration.js');
    const routeCss = readSource('assets/css/registration-route.css');

    expect(legacyRegistrationSource).toContain('class="registration-selected-empty"');
    expect(legacyRegistrationSource).toContain('class="registration-selected-row"');
    expect(legacyRegistrationSource).toContain('class="registration-selected-cell registration-selected-cell--left"');
    expect(legacyRegistrationSource).toContain('class="registration-selected-cell registration-selected-cell--title"');
    expect(legacyRegistrationSource).not.toContain('<td style="text-align:left;">${c.groupName}</td>');
    expect(legacyRegistrationSource).not.toContain('<td style="text-align:left; font-weight:600;">${c.courseName}</td>');
    expect(routeCss).toContain('.registration-selected-empty {');
    expect(routeCss).toContain('.registration-selected-cell--title {');
  });

  it('keeps the advanced student module table on explicit registration classes', () => {
    const studentRegistrationSource = readSource('assets/js/pages/student-registration.js');
    const routeCss = readSource('assets/css/registration-route.css');

    expect(studentRegistrationSource).toContain('class="registration-advanced-module-row"');
    expect(studentRegistrationSource).toContain('class="registration-advanced-course-row"');
    expect(studentRegistrationSource).toContain('class="registration-advanced-status registration-advanced-status--blocked"');
    expect(studentRegistrationSource).toContain('class="registration-advanced-status registration-advanced-status--selected"');
    expect(studentRegistrationSource).toContain('class="registration-advanced-status registration-advanced-status--open"');
    expect(studentRegistrationSource).toContain('class="lux-secondary-btn registration-advanced-action-btn registration-advanced-action-btn--locked"');
    expect(studentRegistrationSource).toContain('class="lux-primary-btn registration-advanced-action-btn"');
    expect(studentRegistrationSource).toContain('class="registration-advanced-course-note registration-advanced-course-note--semester"');
    expect(studentRegistrationSource).toContain('class="registration-advanced-course-note registration-advanced-course-note--blocked"');
    expect(studentRegistrationSource).not.toContain('<tr style="background:#f8fafc; border-bottom:1px solid #e2e8f0; color:#334155; font-size:13px; cursor:pointer;"');
    expect(studentRegistrationSource).not.toContain(`statusIcon = \`<i class="fas fa-times" style="color:#ef4444; font-size:18px;"></i>\``);
    expect(studentRegistrationSource).not.toContain(`statusIcon = \`<div style="width:18px; height:18px; border:2px solid #cbd5e1; border-radius:3px; display:inline-block;"></div>\``);
    expect(routeCss).toContain('.registration-advanced-module-row {');
    expect(routeCss).toContain('.registration-advanced-course-row {');
    expect(routeCss).toContain('.registration-advanced-status--open {');
    expect(routeCss).toContain('.registration-advanced-action-btn--locked {');
  });

  it('keeps the student section picker on explicit registration classes instead of cssText styling', () => {
    const studentRegistrationSource = readSource('assets/js/pages/student-registration.js');
    const routeCss = readSource('assets/css/registration-route.css');
    const pickerSource = studentRegistrationSource.slice(
      studentRegistrationSource.indexOf('function buildStudentCourseSectionActionButton'),
      studentRegistrationSource.indexOf('function chooseStudentCourseSection')
    );

    expect(studentRegistrationSource).toContain("modal.className = 'registration-section-picker-backdrop';");
    expect(studentRegistrationSource).toContain("dialog.className = 'registration-section-picker-dialog';");
    expect(studentRegistrationSource).toContain("header.className = 'registration-section-picker-head';");
    expect(studentRegistrationSource).toContain("content.className = 'registration-section-picker-content';");
    expect(studentRegistrationSource).toContain("button.className = 'lux-secondary-btn registration-section-picker-action-btn is-selected';");
    expect(studentRegistrationSource).toContain("button.className = 'lux-secondary-btn registration-section-picker-action-btn is-full';");
    expect(studentRegistrationSource).toContain("button.className = 'lux-primary-btn registration-section-picker-action-btn';");
    expect(studentRegistrationSource).toContain("tableWrap.className = 'registration-section-picker-table-wrap';");
    expect(studentRegistrationSource).toContain("table.className = 'registration-section-picker-table';");
    expect(pickerSource).not.toContain("modal.style.cssText = 'position:fixed;");
    expect(pickerSource).not.toContain("tableWrap.style.cssText = 'overflow:auto;");
    expect(pickerSource).not.toContain("button.style.cssText = 'padding:8px 12px;");
    expect(routeCss).toContain('.registration-section-picker-backdrop {');
    expect(routeCss).toContain('.registration-section-picker-dialog {');
    expect(routeCss).toContain('.registration-section-picker-action-btn.is-full {');
    expect(routeCss).toContain('.registration-section-picker-table-wrap {');
  });

  it('keeps the selected/history views and course action states on explicit registration classes', () => {
    const studentRegistrationSource = readSource('assets/js/pages/student-registration.js');
    const routeCss = readSource('assets/css/registration-route.css');

    expect(studentRegistrationSource).toContain("wrapper.className = 'registration-render-error';");
    expect(studentRegistrationSource).toContain("input.className = 'registration-module-choice-radio';");
    expect(studentRegistrationSource).toContain("container.className = 'registration-state-list';");
    expect(studentRegistrationSource).toContain("title.className = 'registration-state-title';");
    expect(studentRegistrationSource).toContain("code.className = 'registration-state-meta';");
    expect(studentRegistrationSource).toContain("summary.className = 'registration-state-summary';");
    expect(studentRegistrationSource).toContain("row.className = 'registration-history-row';");
    expect(studentRegistrationSource).toContain("locked.className = 'registration-course-action-state is-locked';");
    expect(studentRegistrationSource).toContain("noSections.className = 'registration-course-action-state is-empty';");
    expect(studentRegistrationSource).toContain("button.className = 'lux-primary-btn registration-course-picker-btn';");
    expect(studentRegistrationSource).toContain("line.className = className ? `registration-course-meta-line ${className}` : 'registration-course-meta-line';");
    expect(studentRegistrationSource).toContain("empty.className = 'registration-course-empty';");
    expect(studentRegistrationSource).not.toContain("empty.style.margin = '0';");
    expect(studentRegistrationSource).not.toContain("locked.style.cssText = 'display:inline-flex;");
    expect(studentRegistrationSource).not.toContain("container.style.cssText = 'display:grid; gap:14px;'");
    expect(routeCss).toContain('.registration-render-error {');
    expect(routeCss).toContain('.registration-state-list {');
    expect(routeCss).toContain('.registration-course-action-state.is-empty {');
    expect(routeCss).toContain('.registration-course-meta-line.is-danger {');
    expect(routeCss).toContain('.registration-course-empty {');
  });

  it('keeps the structured registration form modal on explicit route classes instead of cssText styling', () => {
    const studentRegistrationSource = readSource('assets/js/pages/student-registration.js');
    const routeCss = readSource('assets/css/registration-route.css');
    const structuredFormSource = studentRegistrationSource.slice(
      studentRegistrationSource.indexOf('function buildStructuredFormFieldNode'),
      studentRegistrationSource.indexOf('function getStructuredFormValue')
    );

    expect(studentRegistrationSource).toContain("wrapper.className = 'registration-structured-field';");
    expect(studentRegistrationSource).toContain("label.className = 'registration-structured-label';");
    expect(studentRegistrationSource).toContain("control.className = `registration-structured-control registration-structured-control--textarea${field.readonly || field.disabled ? ' is-muted' : ''}`;");
    expect(studentRegistrationSource).toContain("modal.className = 'registration-structured-modal-backdrop';");
    expect(studentRegistrationSource).toContain("card.className = 'registration-structured-modal-card';");
    expect(studentRegistrationSource).toContain("header.className = 'registration-structured-modal-head';");
    expect(studentRegistrationSource).toContain("form.className = 'registration-structured-form';");
    expect(studentRegistrationSource).toContain("grid.className = 'registration-structured-grid';");
    expect(studentRegistrationSource).toContain("cancelBtn.className = 'lux-secondary-btn registration-structured-modal-action';");
    expect(studentRegistrationSource).toContain("submitBtn.className = 'lux-primary-btn registration-structured-modal-action';");
    expect(structuredFormSource).not.toContain("wrapper.style.cssText = 'display:flex;");
    expect(structuredFormSource).not.toContain("modal.style.cssText = 'position:fixed;");
    expect(structuredFormSource).not.toContain("grid.style.cssText = 'display:grid;");
    expect(routeCss).toContain('.registration-structured-field {');
    expect(routeCss).toContain('.registration-structured-modal-backdrop {');
    expect(routeCss).toContain('.registration-structured-grid {');
    expect(routeCss).toContain('.registration-structured-modal-action {');
  });

  it('keeps the shared structured registration form helper on the same explicit route classes', () => {
    const sharedRegistrationSource = readSource('assets/js/pages/registration-shared.js');
    const routeCss = readSource('assets/css/registration-route.css');
    const structuredFormSource = sharedRegistrationSource.slice(
      sharedRegistrationSource.indexOf('function buildStructuredFormFieldNode'),
      sharedRegistrationSource.indexOf('function getCourseEctsValue')
    );

    expect(sharedRegistrationSource).toContain("wrapper.className = 'registration-structured-field';");
    expect(sharedRegistrationSource).toContain("label.className = 'registration-structured-label';");
    expect(sharedRegistrationSource).toContain("control.className = `registration-structured-control registration-structured-control--textarea${field.readonly || field.disabled ? ' is-muted' : ''}`;");
    expect(sharedRegistrationSource).toContain("modal.className = 'registration-structured-modal-backdrop';");
    expect(sharedRegistrationSource).toContain("card.className = 'registration-structured-modal-card';");
    expect(sharedRegistrationSource).toContain("header.className = 'registration-structured-modal-head';");
    expect(sharedRegistrationSource).toContain("form.className = 'registration-structured-form';");
    expect(sharedRegistrationSource).toContain("grid.className = 'registration-structured-grid';");
    expect(sharedRegistrationSource).toContain("cancelButton.className = 'lux-secondary-btn registration-structured-modal-action';");
    expect(sharedRegistrationSource).toContain("submitButton.className = 'lux-primary-btn registration-structured-modal-action';");
    expect(structuredFormSource).not.toContain("wrapper.style.cssText = 'display:flex;");
    expect(structuredFormSource).not.toContain("modal.style.cssText = 'position:fixed;");
    expect(structuredFormSource).not.toContain("grid.style.cssText = 'display:grid;");
    expect(structuredFormSource).not.toContain("closeButton.style.cssText = 'width:40px;");
    expect(routeCss).toContain('.registration-structured-field {');
    expect(routeCss).toContain('.registration-structured-modal-backdrop {');
    expect(routeCss).toContain('.registration-structured-grid {');
    expect(routeCss).toContain('.registration-structured-modal-action {');
  });
});
