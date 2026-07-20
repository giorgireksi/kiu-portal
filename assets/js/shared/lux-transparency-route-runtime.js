/* Route shouldKeep* fade ownership helpers. Peeled from lux-transparency.js.
 * Load before lux-transparency.js.
 */
(function initLuxTransparencyRouteRuntime() {
    if (window.__KIU_LUX_TRANSPARENCY_ROUTE_LOADED) return;
    window.__KIU_LUX_TRANSPARENCY_ROUTE_LOADED = true;

    window.__kiuCreateLuxTransparencyRouteApi = function createKiuPeelApi(deps = {}) {
        const d = deps;
        void d;
        /* Non-strict factory body: free vars resolve to window globals at call time. */

function isSocialBlurHost(el) {
    if (!el?.classList) return false;
    for (const className of el.classList) {
        if (SOCIAL_BLUR_HOST_CLASSES.has(className)) return true;
    }
    return false;
}

// A "paint surface" is a real social card/panel/box (from the curated surface
// list) — as opposed to a layout wrapper (social-neo-shell / -center / region
// containers / stat grids). Only paint surfaces receive the admin-tools glass
// recipe + blur; wrappers stay on their flat CSS background so glass never stacks.
function isSocialPaintSurface(el) {
    if (!el?.classList) return false;
    return SOCIAL_NEO_TRANSPARENCY_SURFACE_CLASSES.some((className) => el.classList.contains(className));
}

function shouldKeepSocialFadeCssBackground(el) {
    if (!document.body.classList.contains('lux-route-social')) return false;
    if (!el?.classList) return false;
    if (!el.closest?.('#page-social, #public-social-root')) return false;
    // CSS owns --social-fade-* → panel tokens on curated surfaces (timetable model).
    return isSocialPaintSurface(el) || isSocialBlurHost(el);
}

function shouldKeepAdminLibraryFadeCssBackground(el) {
    if (!document.body.classList.contains('lux-route-admin-library') &&
        !document.body.classList.contains('lux-entry-admin-library')) {
        return false;
    }
    if (!el?.classList) return false;
    if (!el.closest?.('#page-library') && !el.classList.contains('admin-library-modal')) return false;
    return (
        el.classList.contains('lux-panel') ||
        el.classList.contains('lux-strip-card') ||
        el.classList.contains('admin-library-modal') ||
        el.classList.contains('lux-stat-card') ||
        el.classList.contains('lux-pill') ||
        el.classList.contains('admin-library-chip') ||
        el.classList.contains('admin-library-param-group') ||
        el.classList.contains('library-catalog-card') ||
        el.classList.contains('library-filter-shell') ||
        el.classList.contains('library-page-hero') ||
        el.classList.contains('alib-panel') ||
        el.classList.contains('lux-control')
    );
}

function shouldKeepLibraryFadeCssBackground(el) {
    if (!document.body.classList.contains('lux-route-library')) return false;
    if (!el?.classList) return false;
    if (!el.closest?.('#page-library')) return false;
    return (
        el.classList.contains('library-page-hero') ||
        el.classList.contains('library-filter-shell') ||
        el.classList.contains('library-catalog-card') ||
        el.classList.contains('library-tabs') ||
        el.classList.contains('library-picker-panel') ||
        el.classList.contains('library-catalog-foot') ||
        el.classList.contains('library-overview-card') ||
        el.classList.contains('library-hero-metric') ||
        el.classList.contains('library-hero-signal-card') ||
        el.classList.contains('lux-strip-card') ||
        el.classList.contains('lux-hero-signal') ||
        el.classList.contains('lux-picker-btn') ||
        el.classList.contains('lux-control')
    );
}

function shouldKeepExamsFadeCssBackground(el) {
    if (!document.body.classList.contains('lux-route-exams') &&
        !document.body.classList.contains('lux-route-exam')) {
        return false;
    }
    if (document.body.classList.contains('lux-route-exam')) {
        return shouldKeepExamPortalFadeCssBackground(el);
    }
    if (!el?.classList) return false;
    return (
        el.classList.contains('ex2-hero') ||
        el.classList.contains('ex2-workspace-panel') ||
        el.classList.contains('ex2-workspace-head') ||
        el.classList.contains('ex2-workspace-section') ||
        el.classList.contains('ex2-stat-chip') ||
        el.classList.contains('ex2-panel') ||
        el.classList.contains('ex2-toolbar') ||
        el.classList.contains('ex2-card') ||
        el.classList.contains('ex2-stat-card') ||
        el.classList.contains('ex2-cohort-card') ||
        el.classList.contains('ex2-session-card') ||
        el.classList.contains('ex2-list-card') ||
        el.classList.contains('ex2-question-card') ||
        el.classList.contains('ex2-review-card') ||
        el.classList.contains('ex2-side-card') ||
        el.classList.contains('ex2-select-card') ||
        el.classList.contains('ex2-live-sidebar') ||
        el.classList.contains('ex2-q-card') ||
        el.classList.contains('ex2-q-card-head') ||
        el.classList.contains('ex2-empty-state') ||
        el.classList.contains('ex2-timeline-card') ||
        el.classList.contains('ex2-split-box') ||
        el.classList.contains('ex2-auto-gen-box') ||
        el.classList.contains('ex2-qnav-bar') ||
        el.classList.contains('ex2-progress-step') ||
        el.parentElement?.classList?.contains('ex2-mini-grid')
    );
}

function shouldKeepAdminToolsFadeCssBackground(el) {
    if (!document.body.classList.contains('lux-route-admin-tools')) return false;
    if (!el?.classList) return false;
    if (!el.closest?.('#lux-admin-tools-shell')) return false;
    return (
        el.classList.contains('lux-admin-tools-index-hero') ||
        el.classList.contains('lux-admin-tools-index-panel') ||
        el.classList.contains('lux-admin-tools-hero') ||
        el.classList.contains('lux-admin-op-card') ||
        el.classList.contains('lux-admin-ops-panel') ||
        el.classList.contains('lux-admin-provision-card') ||
        el.classList.contains('lux-admin-tools-index-summary') ||
        el.classList.contains('lux-admin-tools-index-command') ||
        el.classList.contains('lux-admin-tools-index-command-card') ||
        el.classList.contains('lux-admin-tools-index-subpanel') ||
        el.classList.contains('lux-panel') ||
        el.classList.contains('lux-card') ||
        el.classList.contains('lux-subcard') ||
        el.classList.contains('lux-stat-card') ||
        el.classList.contains('lux-grid-widget') ||
        el.classList.contains('lux-strip-card') ||
        el.classList.contains('lux-control') ||
        el.classList.contains('lux-picker-btn') ||
        el.id === 'admin-reg-content-container' ||
        el.id === 'curriculum-library-modules-root'
    );
}

function shouldKeepAdminOrdersFadeCssBackground(el) {
    if (!document.body.classList.contains('lux-route-admin-orders')) return false;
    if (!el?.classList) return false;
    if (!el.closest?.('#admin-orders-root, #modal-studio')) return false;
    return (
        el.classList.contains('orders-admin-shell') ||
        el.classList.contains('orders-admin-hero') ||
        el.classList.contains('orders-admin-panel') ||
        el.classList.contains('orders-admin-hero-side') ||
        el.classList.contains('orders-detail-panel') ||
        el.classList.contains('orders-admin-table-wrap') ||
        el.classList.contains('admin-orders-studio') ||
        el.classList.contains('orders-metric-card') ||
        el.classList.contains('orders-recipient-row') ||
        el.classList.contains('orders-recipient-card') ||
        el.classList.contains('orders-attachment-card') ||
        el.classList.contains('orders-detail-empty') ||
        el.classList.contains('orders-detail-card') ||
        el.classList.contains('lux-hero-signal') ||
        el.classList.contains('lux-stat-card') ||
        el.classList.contains('admin-orders-studio-card') ||
        el.classList.contains('lux-control') ||
        el.classList.contains('lux-status-pill')
    );
}

function shouldKeepSchedulerFadeCssBackground(el) {
    if (!document.body.classList.contains('lux-route-admin-scheduler')) return false;
    if (!el?.classList) return false;
    if (!el.closest?.('#page-admin-scheduler')) return false;
    return (
        el.classList.contains('sch-rail-hero') ||
        el.classList.contains('sch-rail-section') ||
        el.classList.contains('sch-grid-shell') ||
        el.classList.contains('sch-modal') ||
        el.classList.contains('sch-stat-card') ||
        el.classList.contains('palette-card') ||
        el.classList.contains('sch-grid-tag') ||
        el.classList.contains('sch-empty-state') ||
        el.classList.contains('sch-grid-empty') ||
        el.classList.contains('sch-week-arrow') ||
        el.classList.contains('lux-strip-card') ||
        el.classList.contains('lux-control') ||
        ((el.tagName === 'SELECT' || el.tagName === 'INPUT') &&
            Boolean(el.closest?.('.sch-control-group, .sch-search-shell, .sch-modal')))
    );
}

/** Faculty gradebook: CSS owns --fg-fade-* → panel tokens. */
function shouldKeepFacultyGradebookFadeCssBackground(el) {
    if (!document.body.classList.contains('lux-route-faculty-gradebook')) return false;
    if (!el?.classList) return false;
    if (!el.closest?.('.lux-faculty-gradebook-page, #page-faculty-gradebook')) return false;
    return (
        el.classList.contains('lux-faculty-hero') ||
        el.classList.contains('lux-faculty-command-deck') ||
        el.classList.contains('lux-faculty-hero-focus') ||
        el.classList.contains('lux-faculty-command') ||
        el.classList.contains('lux-faculty-stage') ||
        el.classList.contains('lux-faculty-insight') ||
        el.classList.contains('lux-faculty-filters') ||
        el.classList.contains('lux-faculty-controls') ||
        el.classList.contains('lux-fg-control-band') ||
        el.classList.contains('lux-fg-ops-panel') ||
        el.classList.contains('lux-fg-ops-tile') ||
        el.classList.contains('lux-fg-workspace') ||
        el.classList.contains('lux-status-pill') ||
        el.classList.contains('lux-primary-btn') ||
        el.classList.contains('lux-secondary-btn') ||
        el.classList.contains('lux-card') ||
        el.classList.contains('lux-control') ||
        [...el.classList].some((className) => className.startsWith('gb-') || className.startsWith('lux-fg-'))
    );
}

/** Timetable: CSS owns --tt-fade-* → panel tokens (also covered by isStructuralSurface). */
function shouldKeepTimetableFadeCssBackground(el) {
    if (!document.body.classList.contains('lux-route-timetable')) return false;
    if (!el?.classList) return false;
    return (
        el.classList.contains('lux-timetable-hero') ||
        el.classList.contains('lux-timetable-command') ||
        el.classList.contains('lux-timetable-stage') ||
        el.classList.contains('lux-timetable-hero-focus') ||
        el.classList.contains('lux-timetable-filters') ||
        el.classList.contains('lux-timetable-view-switcher') ||
        el.classList.contains('lux-timetable-week-nav') ||
        el.classList.contains('lux-timetable-overview-row') ||
        el.classList.contains('lux-timetable-insight') ||
        el.classList.contains('lux-timetable-grid-shell') ||
        el.classList.contains('lux-timetable-canvas') ||
        el.classList.contains('lux-timetable-day-section') ||
        el.classList.contains('lux-timetable-session-card') ||
        el.classList.contains('schedule-day-section') ||
        el.classList.contains('schedule-session-card') ||
        el.classList.contains('schedule-view-switcher') ||
        el.classList.contains('schedule-week-nav') ||
        el.classList.contains('schedule-overview-row') ||
        el.classList.contains('schedule-chip') ||
        el.classList.contains('lux-status-pill') ||
        el.classList.contains('lux-control') ||
        el.classList.contains('filter-shell')
    );
}

/** Exam portal (lux-route-exam) + exams studio share panel glass. */
function shouldKeepExamPortalFadeCssBackground(el) {
    if (!document.body.classList.contains('lux-route-exam')) return false;
    if (!el?.classList) return false;
    return (
        el.classList.contains('lms-route-panel') ||
        el.classList.contains('lms-route-card') ||
        el.classList.contains('page-hero') ||
        el.classList.contains('lux-card') ||
        el.classList.contains('lux-panel') ||
        el.classList.contains('lux-control') ||
        el.classList.contains('lux-status-pill')
    );
}


/** Profile view: CSS owns --pv-fade-* → panel tokens. */
function shouldKeepProfileViewFadeCssBackground(el) {
    if (!document.body.classList.contains('lux-route-profile-view')) return false;
    if (!el?.classList) return false;
    // Shell host is painted by route CSS tokens; do not force engine fade keep.
    if (el.classList.contains('pv-shell')) return false;
    return (
        el.classList.contains('pv-hero') ||
        el.classList.contains('pv-meta') ||
        el.classList.contains('pv-left') ||
        el.classList.contains('pv-right') ||
        el.classList.contains('pv-stat-card') ||
        el.classList.contains('pv-tab') ||
        el.classList.contains('pv-modal-card') ||
        el.classList.contains('pv-profile-edit-card') ||
        el.classList.contains('pv-session-list-row') ||
        el.classList.contains('pv-document-card') ||
        el.classList.contains('pv-course-row') ||
        el.classList.contains('pv-financial-status-card') ||
        el.classList.contains('upload-zone') ||
        el.classList.contains('surface-card') ||
        el.classList.contains('lux-summary-surface') ||
        el.classList.contains('lux-strip-card') ||
        el.classList.contains('lux-inline-card') ||
        el.classList.contains('lux-data-card') ||
        el.classList.contains('lux-info-card') ||
        el.classList.contains('lux-status-pill') ||
        el.classList.contains('lux-control') ||
        el.classList.contains('lux-select-card') ||
        [...el.classList].some((className) => className.startsWith('pv-'))
    );
}

/** True when route CSS owns glass (strip inline; do not invent paint). */
function shouldKeepRouteFadeCssBackground(el) {
    return (
        shouldKeepPersonalDataFadeCssBackground(el) ||
        shouldKeepNewsFadeCssBackground(el) ||
        shouldKeepLmsFadeCssBackground(el) ||
        shouldKeepStaffFadeCssBackground(el) ||
        shouldKeepStudentsAdminFadeCssBackground(el) ||
        shouldKeepStudyCardFadeCssBackground(el) ||
        shouldKeepProgramsFadeCssBackground(el) ||
        shouldKeepChancelleryFadeCssBackground(el) ||
        shouldKeepStudentServiceFadeCssBackground(el) ||
        shouldKeepOrdersFadeCssBackground(el) ||
        shouldKeepLibraryFadeCssBackground(el) ||
        shouldKeepAdminLibraryFadeCssBackground(el) ||
        shouldKeepExamsFadeCssBackground(el) ||
        shouldKeepAdminToolsFadeCssBackground(el) ||
        shouldKeepAdminOrdersFadeCssBackground(el) ||
        shouldKeepSchedulerFadeCssBackground(el) ||
        shouldKeepSocialFadeCssBackground(el) ||
        shouldKeepFacultyGradebookFadeCssBackground(el) ||
        shouldKeepTimetableFadeCssBackground(el) ||
        shouldKeepExamPortalFadeCssBackground(el) ||
        shouldKeepProfileViewFadeCssBackground(el) ||
        shouldKeepRegistrationFadeCssBackground(el)
    );
}

/** Personal-data panels are CSS-owned focus soft-shell (engine inline !important otherwise wins). */
function shouldKeepPersonalDataFadeCssBackground(el) {
    if (!document.body.classList.contains('lux-route-personal-data')) return false;
    if (!el?.classList) return false;
    if (!el.closest?.('#page-personal-data')) return false;
    return (
        el.classList.contains('page-hero') ||
        el.classList.contains('personal-data-hero') ||
        el.classList.contains('filter-shell') ||
        el.classList.contains('personal-data-command') ||
        el.classList.contains('personal-data-toolbar') ||
        el.classList.contains('profile-card') ||
        el.classList.contains('personal-data-identity-card') ||
        el.classList.contains('personal-data-merged') ||
        el.classList.contains('personal-data-kpi-card') ||
        el.classList.contains('personal-data-stats-card') ||
        el.classList.contains('personal-data-facts-card') ||
        el.classList.contains('personal-data-record-card') ||
        el.classList.contains('personal-data-hero-panel') ||
        el.classList.contains('lux-summary-surface') ||
        el.classList.contains('lux-data-card') ||
        el.classList.contains('lux-metric-card') ||
        el.classList.contains('lux-strip-card') ||
        el.classList.contains('lux-status-pill') ||
        el.classList.contains('lux-modern-surface') ||
        el.classList.contains('lux-modern-table') ||
        el.classList.contains('personal-data-subjects-table') ||
        el.classList.contains('personal-data-subjects-table-wrap') ||
        el.classList.contains('lux-soft-chrome') ||
        el.classList.contains('lux-control') ||
        el.tagName === 'SELECT' ||
        el.tagName === 'TABLE' ||
        el.tagName === 'INPUT'
    );
}

/** Registration shells/panels are CSS-owned focus soft-shell (opacity vars + engine otherwise wins). */
function shouldKeepRegistrationFadeCssBackground(el) {
    if (!document.body.classList.contains('lux-route-registration')) return false;
    if (!el?.classList) return false;
    if (!el.closest?.('#page-registration, .registration-structured-modal-card, .registration-section-picker-dialog, .modal-content')) {
        return false;
    }
    return (
        el.classList.contains('registration-page-stack') ||
        el.classList.contains('registration-page-shell') ||
        el.classList.contains('registration-hero-shell') ||
        el.classList.contains('registration-command-band') ||
        el.classList.contains('registration-metrics-band') ||
        el.classList.contains('registration-studio-panel') ||
        el.classList.contains('registration-footer-bar') ||
        el.classList.contains('registration-progress-shell') ||
        el.classList.contains('registration-hero') ||
        el.classList.contains('registration-workspace') ||
        el.classList.contains('registration-insight-card') ||
        el.classList.contains('registration-focus-card') ||
        el.classList.contains('registration-summary-card') ||
        el.classList.contains('registration-state-card') ||
        el.classList.contains('registration-track-card') ||
        el.classList.contains('registration-module-list-card') ||
        el.classList.contains('registration-module-pane-card') ||
        el.classList.contains('registration-module-choice') ||
        el.classList.contains('registration-course-row') ||
        el.classList.contains('registration-track-group') ||
        el.classList.contains('registration-term-shell') ||
        el.classList.contains('filter-shell') ||
        el.classList.contains('registration-shell-empty') ||
        el.classList.contains('registration-empty-state') ||
        el.classList.contains('registration-render-error') ||
        el.classList.contains('registration-hero-aside') ||
        el.classList.contains('registration-mini-metric') ||
        el.classList.contains('registration-structured-modal-card') ||
        el.classList.contains('registration-section-picker-dialog') ||
        el.classList.contains('lux-soft-chrome') ||
        el.matches?.('.lms-hero-focus, .lux-focus-panel') ||
        el.classList.contains('lux-focus-panel') ||
        el.classList.contains('lux-timetable-hero') ||
        el.classList.contains('lux-timetable-hero-top') ||
        el.classList.contains('lux-timetable-hero-focus') ||
        el.classList.contains('lux-timetable-command') ||
        el.classList.contains('lux-timetable-stage') ||
        el.classList.contains('lux-timetable-filters') ||
        el.classList.contains('lux-modern-surface') ||
        el.classList.contains('admin-chip') ||
        el.classList.contains('wave2-chip') ||
        el.classList.contains('lux-status-pill') ||
        el.classList.contains('lux-pill') ||
        el.classList.contains('reg-tab') ||
        el.classList.contains('lux-control') ||
        el.tagName === 'SELECT' ||
        el.tagName === 'INPUT'
    );
}

/** News shells/panels are CSS-owned focus soft-shell (engine inline !important otherwise wins). */
function shouldKeepNewsFadeCssBackground(el) {
    if (!document.body.classList.contains('lux-route-news')) return false;
    if (!el?.classList) return false;
    const inNews =
        el.closest?.('#page-news, #portal-news-root, #newsx-publisher-modal, #newsx-confirm-modal, #newsx-sections-modal, .newsx-modal-overlay');
    if (!inNews) return false;
    return (
        el.classList.contains('newsx-shell') ||
        el.classList.contains('newsx-panel') ||
        el.classList.contains('newsx-feed-card') ||
        el.classList.contains('newsx-post-card--editorial') ||
        el.classList.contains('newsx-section-btn') ||
        el.classList.contains('newsx-stat') ||
        el.classList.contains('newsx-private-item') ||
        el.classList.contains('newsx-account-card') ||
        el.classList.contains('newsx-check') ||
        el.classList.contains('newsx-empty') ||
        el.classList.contains('newsx-error') ||
        el.classList.contains('newsx-hero') ||
        el.classList.contains('newsx-filter') ||
        el.classList.contains('newsx-sidebar') ||
        el.classList.contains('newsx-rail') ||
        el.classList.contains('newsx-section') ||
        el.classList.contains('newsx-pane-btn') ||
        el.classList.contains('newsx-publisher-modal') ||
        el.classList.contains('newsx-confirm-modal') ||
        el.classList.contains('newsx-sections-modal') ||
        el.classList.contains('lux-panel') ||
        el.classList.contains('lux-modern-surface') ||
        el.classList.contains('lux-soft-chrome') ||
        el.id === 'newsx-publisher-modal' ||
        el.id === 'newsx-confirm-modal' ||
        el.id === 'newsx-sections-modal'
    );
}

/* LMS: keep the glass CSS-owned (same as registration → no flicker). The JS
   transparency engine setting/re-applying inline backdrop-filter on the LMS
   wrapper is what re-rasterizes over the moving canvas and flickers. Routing
   these through the keep-CSS path makes JS STRIP its inline backdrop and let
   the stable CSS rule own the frost — exactly why registration doesn't flicker. */
function shouldKeepLmsFadeCssBackground(el) {
    if (!document.body.classList.contains('lux-route-lms')) return false;
    if (!el?.classList) return false;
    if (!el.closest?.('#page-lms')) return false;
    // CSS owns glass via --lms-fade-* → --lux-panel-*; strip inline paint (timetable model).
    return (
        el.classList.contains('lux-page-shell') ||
        el.classList.contains('lms-route-stage') ||
        el.classList.contains('lms-route-panel') ||
        el.classList.contains('lms-route-card') ||
        el.classList.contains('lms-route-workspace-chrome') ||
        el.classList.contains('lms-route-tab-strip') ||
        el.classList.contains('page-hero') ||
        el.classList.contains('lux-lms-hero') ||
        el.classList.contains('lms-clean-hero') ||
        el.classList.contains('lms-hero-v2') ||
        el.classList.contains('lms-hero-focus') ||
        el.classList.contains('lux-focus-panel') ||
        el.classList.contains('lms-clean-subjects') ||
        el.classList.contains('lms-clean-subject-card') ||
        el.classList.contains('lux-lms-subject-card') ||
        el.classList.contains('lux-lms-group-card') ||
        el.classList.contains('lms-route-empty') ||
        el.classList.contains('lux-card') ||
        el.classList.contains('lux-panel') ||
        el.classList.contains('surface-card') ||
        el.classList.contains('lux-status-pill')
    );
}

/** Staff hub: CSS owns --staff-fade-* → panel tokens. */
function shouldKeepStaffFadeCssBackground(el) {
    if (!document.body.classList.contains('lux-route-staff')) return false;
    if (!el?.classList) return false;
    if (!el.closest?.('#staff-content')) return false;
    return (
        el.classList.contains('page-hero') ||
        el.classList.contains('staff-hub-hero') ||
        el.classList.contains('staff-hub-controls') ||
        el.classList.contains('staff-hub-directory-panel') ||
        el.classList.contains('staff-hub-profile') ||
        el.classList.contains('staff-hub-form-settings-head') ||
        el.classList.contains('staff-hub-builder-rail') ||
        el.classList.contains('staff-hub-builder-canvas') ||
        el.classList.contains('staff-hub-filter-deck') ||
        el.classList.contains('staff-hub-info-card') ||
        el.classList.contains('staff-hub-warning') ||
        el.classList.contains('staff-hub-list-item') ||
        el.classList.contains('staff-hub-modal') ||
        el.classList.contains('lux-card') ||
        el.classList.contains('lux-person-card') ||
        el.classList.contains('lux-strip-card') ||
        el.classList.contains('lux-control') ||
        el.classList.contains('lux-status-pill')
    );
}

/** Students admin: CSS owns --sadmin-fade-* → panel tokens. */
function shouldKeepStudentsAdminFadeCssBackground(el) {
    if (!document.body.classList.contains('lux-route-students-admin')) return false;
    if (!el?.classList) return false;
    if (!el.closest?.('#students-content')) return false;
    return (
        el.classList.contains('page-hero') ||
        el.classList.contains('students-hub-hero') ||
        el.classList.contains('students-hub-controls') ||
        el.classList.contains('students-hub-directory-panel') ||
        el.classList.contains('students-hub-profile') ||
        el.classList.contains('students-hub-form-settings-head') ||
        el.classList.contains('students-hub-builder-rail') ||
        el.classList.contains('students-hub-builder-canvas') ||
        el.classList.contains('students-hub-filter-deck') ||
        el.classList.contains('students-hub-info-card') ||
        el.classList.contains('students-hub-warning') ||
        el.classList.contains('students-hub-list-item') ||
        el.classList.contains('students-hub-modal') ||
        el.classList.contains('lux-card') ||
        el.classList.contains('lux-person-card') ||
        el.classList.contains('lux-strip-card') ||
        el.classList.contains('lux-control') ||
        el.classList.contains('lux-status-pill')
    );
}

function stripInlineGlassPaint(el, transparencySignature) {
    el.style.removeProperty('background-color');
    el.style.removeProperty('background');
    el.style.removeProperty('backdrop-filter');
    el.style.removeProperty('-webkit-backdrop-filter');
    el.dataset.luxTransparencySignature = transparencySignature;
}

/** Study card: CSS owns --sc-fade-* → panel tokens. */
function shouldKeepStudyCardFadeCssBackground(el) {
    if (!document.body.classList.contains('lux-route-study-card')) return false;
    if (!el?.classList) return false;
    if (!el.closest?.('#page-study-card, #study-card-container, .study-card-page-shell')) return false;
    return (
        el.classList.contains('study-card-page-shell') ||
        el.classList.contains('study-card-workspace') ||
        el.classList.contains('study-card-page-head') ||
        el.classList.contains('study-card-title-row') ||
        el.classList.contains('study-card-control-band') ||
        el.classList.contains('study-card-control-actions') ||
        el.id === 'study-card-container' ||
        el.classList.contains('study-card-semester-table') ||
        el.classList.contains('study-card-summary-stage') ||
        el.classList.contains('study-card-term-row') ||
        el.classList.contains('study-card-term-header') ||
        el.classList.contains('study-card-assessment-window') ||
        el.classList.contains('study-card-assessment-window__card') ||
        el.classList.contains('study-card-assessment-window__chip') ||
        el.classList.contains('study-card-assessment-panel') ||
        el.classList.contains('study-card-assessment-layout') ||
        el.classList.contains('study-card-assessment-pill') ||
        el.classList.contains('study-card-grade-circle') ||
        el.classList.contains('lux-strip-card') ||
        el.classList.contains('lux-status-pill') ||
        el.classList.contains('lux-control')
    );
}

/** Programs: CSS owns --prog-fade-* → panel tokens. */
function shouldKeepProgramsFadeCssBackground(el) {
    if (!document.body.classList.contains('lux-route-programs')) return false;
    if (!el?.classList) return false;
    if (!el.closest?.('#page-programs')) return false;
    return (
        el.classList.contains('lux-program-command-deck') ||
        el.classList.contains('lux-program-hero') ||
        el.classList.contains('lux-program-filter-shell') ||
        el.classList.contains('lux-program-stage') ||
        el.classList.contains('lux-program-overview-card') ||
        el.classList.contains('lux-program-focus-panel') ||
        el.classList.contains('lux-prog-control-band') ||
        el.classList.contains('lux-prog-ops-panel') ||
        el.classList.contains('lux-prog-ops-tile') ||
        el.classList.contains('lux-prog-workspace') ||
        el.classList.contains('lux-prog-toolbar') ||
        el.classList.contains('lux-program-shell-section--module-rail') ||
        el.classList.contains('lux-program-shell-section--subject-panel') ||
        el.classList.contains('lux-program-module-option') ||
        el.classList.contains('lux-module-option') ||
        el.classList.contains('lux-program-subject-card') ||
        el.classList.contains('lux-subject-row') ||
        el.classList.contains('lux-program-empty-state') ||
        el.classList.contains('lux-program-summary-card') ||
        el.classList.contains('lux-program-metric') ||
        el.classList.contains('lux-program-publish-pill') ||
        el.classList.contains('lux-status-pill') ||
        el.classList.contains('lux-control') ||
        el.classList.contains('surface-card')
    );
}

/** Chancellery: CSS owns --chan-fade-* → panel tokens. */
function shouldKeepChancelleryFadeCssBackground(el) {
    if (!document.body.classList.contains('lux-route-chancellery')) return false;
    if (!el?.classList) return false;
    if (!el.closest?.('#page-chancellery')) return false;
    return (
        el.classList.contains('page-hero') ||
        el.classList.contains('lux-chancellery-hero-card') ||
        el.classList.contains('lux-chancellery-command-bar') ||
        el.classList.contains('filter-shell') ||
        el.classList.contains('lux-chancellery-snapshot-card') ||
        el.classList.contains('lux-chancellery-subcard') ||
        el.classList.contains('lux-chancellery-queue-item') ||
        el.classList.contains('lux-chancellery-thread-entry') ||
        el.classList.contains('lux-chancellery-main-panel') ||
        el.classList.contains('lux-queue-item') ||
        el.classList.contains('lux-thread-entry') ||
        el.classList.contains('lux-card') ||
        el.classList.contains('lux-stat-card') ||
        el.classList.contains('lux-subcard') ||
        el.classList.contains('lux-strip-card') ||
        el.classList.contains('lux-hero-signal') ||
        el.classList.contains('lux-control') ||
        el.classList.contains('lux-status-pill')
    );
}

/** Student service: CSS owns --ssvc-fade-* → panel tokens. */
function shouldKeepStudentServiceFadeCssBackground(el) {
    if (!document.body.classList.contains('lux-route-student-service')) return false;
    if (!el?.classList) return false;
    if (!el.closest?.('#page-student-service, .student-service-shell')) return false;
    return (
        el.classList.contains('student-service-command-bar-shell') ||
        el.classList.contains('student-service-canvas') ||
        el.classList.contains('student-service-zone') ||
        el.classList.contains('student-service-article-card') ||
        el.classList.contains('student-service-ticket-row') ||
        el.classList.contains('student-service-lane-card') ||
        el.classList.contains('student-service-ticket-card') ||
        el.classList.contains('student-service-ops-card') ||
        el.classList.contains('student-service-track-card') ||
        el.classList.contains('student-service-home-panel') ||
        el.classList.contains('student-service-home-card') ||
        el.classList.contains('student-service-home-ticket') ||
        el.classList.contains('student-service-lane-choice-card') ||
        el.classList.contains('lux-card') ||
        el.classList.contains('lux-control') ||
        el.classList.contains('lux-status-pill')
    );
}

/** Student orders inbox: CSS owns --orders-fade-* → panel tokens. */
function shouldKeepOrdersFadeCssBackground(el) {
    if (!document.body.classList.contains('lux-route-orders') && !el.closest?.('#page-orders, #orders-inbox-root')) {
        return false;
    }
    if (document.body.classList.contains('lux-route-admin-orders')) return false;
    if (!el?.classList) return false;
    if (!el.closest?.('#page-orders, #orders-inbox-root')) return false;
    return (
        el.classList.contains('orders-inbox-shell') ||
        el.classList.contains('orders-inbox-hero') ||
        el.classList.contains('orders-list-card') ||
        el.classList.contains('orders-detail-card') ||
        el.classList.contains('orders-inbox-hero-side') ||
        el.classList.contains('orders-list-wrap') ||
        el.classList.contains('orders-status-filter') ||
        el.classList.contains('orders-item') ||
        el.classList.contains('orders-metric-card') ||
        el.classList.contains('orders-attachment-card') ||
        el.classList.contains('orders-recipient-card') ||
        el.classList.contains('orders-detail-panel') ||
        el.classList.contains('orders-detail-empty') ||
        el.classList.contains('lux-hero-signal') ||
        el.classList.contains('lux-control') ||
        el.classList.contains('lux-status-pill') ||
        el.classList.contains('lux-card')
    );
}

function buildHomeStyleSurfaceBackground(lightMode, amount) {
    // Home remains special-cased; still amount-scaled. Prefer CSS --home-fade-* when possible.
    if (lightMode) {
        return `radial-gradient(circle at 6% 0%, rgba(255,255,255, ${(amount * 0.88).toFixed(2)}), transparent 34%), radial-gradient(circle at 74% 0%, rgba(var(--lux-accent-rgb), ${(amount * 0.24).toFixed(2)}), transparent 42%), radial-gradient(circle at 100% 96%, rgba(var(--lux-home-secondary-rgb), ${(amount * 0.14).toFixed(2)}), transparent 40%), linear-gradient(135deg, rgba(var(--lux-accent-rgb), ${(amount * 0.065).toFixed(2)}), rgba(255,255,255, ${(amount * 0.84).toFixed(2)}) 44%, rgba(247,241,232, ${(amount * 0.70).toFixed(2)}))`;
    }
    return `radial-gradient(circle at 6% 0%, rgba(255,255,255, ${(amount * 0.08).toFixed(2)}), transparent 32%), radial-gradient(circle at 74% 0%, rgba(var(--lux-accent-rgb), ${(amount * 0.28).toFixed(2)}), transparent 42%), radial-gradient(circle at 100% 96%, rgba(var(--lux-home-secondary-rgb), ${(amount * 0.18).toFixed(2)}), transparent 40%), linear-gradient(135deg, rgba(var(--lux-accent-rgb), ${(amount * 0.10).toFixed(2)}), rgba(10,15,24, ${(amount * 0.89).toFixed(2)}) 44%, rgba(7,10,18, ${(amount * 0.80).toFixed(2)}))`;
}

/** Non-home route glass: CSS tokens only (timetable blueprint). lightMode kept for call-site compat. */
function buildLuxuryRoutePanelGradient(lightMode, isSmallSurface) {
    return isSmallSurface
        ? 'var(--lux-panel-surface-soft)'
        : 'var(--lux-panel-surface)';
}

        const api = {
            isSocialBlurHost,
            isSocialPaintSurface,
            shouldKeepSocialFadeCssBackground,
            shouldKeepAdminLibraryFadeCssBackground,
            shouldKeepLibraryFadeCssBackground,
            shouldKeepExamsFadeCssBackground,
            shouldKeepAdminToolsFadeCssBackground,
            shouldKeepAdminOrdersFadeCssBackground,
            shouldKeepSchedulerFadeCssBackground,
            shouldKeepFacultyGradebookFadeCssBackground,
            shouldKeepTimetableFadeCssBackground,
            shouldKeepExamPortalFadeCssBackground,
            shouldKeepProfileViewFadeCssBackground,
            shouldKeepRouteFadeCssBackground,
            shouldKeepPersonalDataFadeCssBackground,
            shouldKeepRegistrationFadeCssBackground,
            shouldKeepNewsFadeCssBackground,
            shouldKeepLmsFadeCssBackground,
            shouldKeepStaffFadeCssBackground,
            shouldKeepStudentsAdminFadeCssBackground,
            stripInlineGlassPaint,
            shouldKeepStudyCardFadeCssBackground,
            shouldKeepProgramsFadeCssBackground,
            shouldKeepChancelleryFadeCssBackground,
            shouldKeepStudentServiceFadeCssBackground,
            shouldKeepOrdersFadeCssBackground,
            buildHomeStyleSurfaceBackground,
            buildLuxuryRoutePanelGradient,
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateLuxTransparencyRouteApi({});
})();
