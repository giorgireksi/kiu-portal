

const DEFERRED_TRANSPARENCY_FLUSH_MS = 420;

const LUX_MODERN_TRANSPARENCY_SURFACE_SELECTORS = [
    '.lux-modern-surface',
    '.lux-modern-table'
];

const SOCIAL_NEO_TRANSPARENCY_SURFACE_SELECTORS = [
    '.social-neo-card', '.social-neo-alert', '.social-neo-topbar-card', '.social-neo-sidebar-card',
    '.social-neo-post-card', '.social-neo-composer-card', '.social-neo-filter-card', '.social-neo-story-card',
    '.social-neo-community-panel', '.social-neo-chat-item', '.social-neo-directory-item', '.social-neo-entity-card',
    '.social-neo-event-card', '.social-neo-message', '.social-neo-empty', '.social-neo-empty-hero', '.social-neo-flash',
    '.social-neo-comment-bubble', '.social-neo-time-group', '.social-neo-stat-grid > div',
    '.social-neo-section-command', '.social-neo-section-metric', '.social-neo-section-task', '.social-neo-events-hero',
    '.social-neo-events-hero-stat', '.social-neo-events-lane', '.social-neo-events-banner',
    '.social-neo-events-list-card', '.social-neo-events-create-card', '.social-neo-events-manage-card',
    '.social-neo-events-manage-item', '.social-neo-events-support-card', '.social-neo-event-date-group',
    '.social-neo-event-feature', '.social-neo-event-feature-meta-item', '.social-neo-group-card',
    '.social-neo-group-create-block', '.social-neo-group-create-picker', '.social-neo-group-member-row',
    '.social-neo-group-thread-panel', '.social-neo-group-thread-section', '.social-neo-pages-hero',
    '.social-neo-page-card', '.social-neo-page-card-rich',
    '.social-neo-page-card-support', '.social-neo-page-compose-block', '.social-neo-page-profile',
    '.social-neo-page-about-card', '.social-neo-thread-head', '.social-neo-thread-compose',
    '.social-neo-thread-messages', '.social-neo-thread-group-hero', '.social-neo-call-card', '.social-neo-call-stage',
    '.social-neo-call-video', '.social-neo-toast', '.social-neo-mobile-tabbar', '.social-neo-mobile-tab',
    '.social-neo-shell-drawer', '.social-neo-shell-drawer-profile', '.social-neo-shell-drawer-nav-card',
    '.social-neo-side-link', '.social-neo-workspace-nav-btn', '.social-neo-shell-nav-btn',
    '.social-neo-feed-hero-tab', '.social-neo-events-hero-tab', '.social-neo-community-hero-tab',
    '.social-neo-groups-hero-tab', '.social-neo-surveys-hero-tab', '.social-neo-composer-cta',
    '.social-neo-feed-hero-stat', '.social-neo-feed-composer-zone', '.social-neo-composer-cta-card',
    '.social-neo-community-hero', '.social-neo-community-hero-stat', '.social-neo-community-card',
    '.social-neo-directory-filters',
    '.social-projects-hero', '.social-projects-hero-rich', '.social-project-create-card', '.social-project-card',
    '.social-project-detail-hero', '.social-project-detail-hero-rich',
    '.social-project-tab-shell', '.social-project-inline-panel', '.social-project-chart-card',
    '.social-project-rich-panel', '.social-project-deliverable-card', '.social-project-checkin-card',
    '.social-project-meeting-card', '.social-project-mini-card',
    '.social-project-activity-item', '.social-project-milestone-item', '.social-project-task-column',
    '.social-project-task-card', '.social-project-team-card', '.social-portfolio-hero', '.social-portfolio-toolbar',
    '.social-portfolio-card', '.social-portfolio-mini-card', '.social-portfolio-stat-tile',
    '.social-portfolio-compose-shell', '.social-portfolio-compose-preview-card', '.social-portfolio-audience-panel',
    '.social-portfolio-link'
];
const SOCIAL_NEO_TRANSPARENCY_SURFACE_CLASSES = SOCIAL_NEO_TRANSPARENCY_SURFACE_SELECTORS
    .filter((selector) => selector.charAt(0) === '.' && !/[ >:+~#\[]/.test(selector))
    .map((selector) => selector.slice(1));
const SOCIAL_NEO_SMALL_TRANSPARENCY_SURFACE_CLASSES = [
    'social-neo-chat-item', 'social-neo-directory-item', 'social-neo-entity-card', 'social-neo-event-card',
    'social-neo-message', 'social-neo-comment-bubble', 'social-neo-time-group', 'social-neo-section-metric',
    'social-neo-section-task', 'social-neo-events-hero-stat', 'social-neo-feed-hero-stat',
    'social-neo-side-link', 'social-neo-workspace-nav-btn', 'social-neo-feed-hero-tab',
    'social-neo-composer-cta', 'social-neo-community-hero-stat', 'social-neo-community-card',
    'social-neo-events-manage-item',
    'social-neo-event-date-group', 'social-neo-event-feature-meta-item', 'social-neo-group-member-row',
    'social-neo-page-card', 'social-project-mini-card',
    'social-project-activity-item', 'social-project-milestone-item', 'social-project-task-card',
    'social-project-team-card', 'social-portfolio-mini-card', 'social-portfolio-stat-tile',
    'social-portfolio-link'
];

function isHomeCssOwnedInnerPanel(el) {
    if (!document.body.classList.contains('lux-route-home') || !el?.classList) return false;
    const isHomeLegacyGridInner = Boolean(el.parentElement?.classList?.contains('lux-home-grid'))
        && (el.classList.contains('lux-panel') || el.classList.contains('lux-card') || el.classList.contains('lux-hero'));
    const isHomeWidgetInner = Boolean(el.closest?.('.lux-grid-widget-body'))
        && !el.classList.contains('lux-grid-widget-body');
    return isHomeLegacyGridInner || isHomeWidgetInner;
}

const SOCIAL_BLUR_HOST_CLASSES = new Set([
    'social-neo-card', 'social-neo-post-card', 'social-neo-topbar-card', 'social-neo-community-panel',
    'social-neo-group-card', 'social-neo-group-thread-panel', 'social-neo-page-card-rich', 'social-neo-events-lane',
    'social-neo-events-support-card', 'social-neo-event-feature', 'social-neo-shell-drawer',
    'social-neo-story-composer-card', 'social-neo-call-card', 'social-neo-empty', 'social-project-detail-hero-rich',
    'social-project-tab-shell', 'social-project-rich-panel', 'social-project-card',
    'social-portfolio-card'
]);

function isSocialBlurHost(el) {
    if (!el?.classList) return false;
    for (const className of el.classList) {
        if (SOCIAL_BLUR_HOST_CLASSES.has(className)) return true;
    }
    return false;
}

function isSocialPaintSurface(el) {
    if (!el?.classList) return false;
    return SOCIAL_NEO_TRANSPARENCY_SURFACE_CLASSES.some((className) => el.classList.contains(className));
}

function shouldKeepSocialFadeCssBackground(el) {
    if (!document.body.classList.contains('lux-route-social')) return false;
    if (!el?.classList) return false;
    if (!el.closest?.('#page-social, #public-social-root')) return false;
    return isSocialPaintSurface(el) || isSocialBlurHost(el);
}

function shouldKeepHomeFadeCssBackground(el) {
    return isHomeCssOwnedInnerPanel(el);
}

const CSS_OWNED_HOST_SELECTOR = '.page-hero, .lux-panel, .lux-alert';
const CSS_OWNED_PRIMITIVE_SELECTOR = '.lux-soft-chrome, .lux-focus-panel, .lms-hero-focus, .lux-timetable-hero-focus';
const CSS_OWNED_CHIP_SELECTOR = [
    '.lux-summary-surface',
    '.lux-strip-card',
    '.lux-stat-card',
    '.lux-status-pill',
    '.lux-control',
    '.lux-pill',
    '.lux-primary-btn',
    '.lux-secondary-btn',
    '.lux-destructive-btn',
    '.lux-data-card',
    '.lux-metric-card',
    '.lux-inline-card',
    '.lux-info-card',
    '.lux-select-card',
    '.lux-person-card',
    '.lux-subcard',
    '.surface-card',
    '.home-hover-chip',
].join(', ');

function hasOwnedClassPrefix(el, prefixes) {
    for (const className of el.classList) {
        if (prefixes.some((prefix) => className.startsWith(prefix))) return true;
    }
    return false;
}

/** Route-scoped surfaces identified by body class + closest root + class prefix. */
function isRouteOwnedSurface(el) {
    if (!el?.classList) return false;

    if (document.body.classList.contains('lux-route-lms')) {
        if (el.matches?.(
            '.lms-route-panel, .lms-route-workspace-chrome, .lms-route-card, .lms-route-tab-strip, ' +
            '.lms-route-empty, .lms-clean-subjects, .lux-lms-hero, .lms-hero-v2, ' +
            '.lux-lms-group-card, .lux-lms-subject-card'
        )) return true;
        if (el.matches?.('.lux-card-body') && el.closest?.('.lms-clean-subjects--merged, .lux-lms-subject-card')) return true;
        if (el.closest?.('.lms-quiz-builder') && hasOwnedClassPrefix(el, ['lms-quiz-'])) return true;
    }

    if (document.body.classList.contains('lux-route-profile-view')) {
        if (el.classList.contains('pv-shell')) return false;
        if (hasOwnedClassPrefix(el, ['pv-']) || el.classList.contains('upload-zone')) return true;
    }

    if (document.body.classList.contains('lux-route-timetable')) {
        if (hasOwnedClassPrefix(el, ['lux-timetable-', 'schedule-']) || el.classList.contains('filter-shell')) return true;
    }

    if (document.body.classList.contains('lux-route-exams') || document.body.classList.contains('lux-route-exam')) {
        if (hasOwnedClassPrefix(el, ['ex2-']) || el.parentElement?.classList?.contains('ex2-mini-grid')) return true;
        if (el.matches?.('.lms-route-panel, .exam-confirm-card, .exam-dashboard-shell')) return true;
    }

    if (document.body.classList.contains('lux-route-news')
        && el.closest?.('#page-news, #portal-news-root, .newsx-modal-overlay, #newsx-publisher-modal, #newsx-confirm-modal, #newsx-sections-modal, #newsx-post-detail-modal')) {
        if (hasOwnedClassPrefix(el, ['newsx-']) || (el.id && el.id.startsWith('newsx-'))) return true;
    }

    if (document.body.classList.contains('lux-route-registration')
        && el.closest?.('#page-registration, .registration-structured-modal-card, .registration-section-picker-dialog, .modal-content')) {
        if (hasOwnedClassPrefix(el, ['registration-'])
            || el.matches?.('.filter-shell, .reg-tab, .admin-chip, .wave2-chip, .lux-modern-surface, .lux-timetable-hero, .lux-timetable-command, .lux-timetable-stage, .lux-timetable-filters')) {
            return true;
        }
    }

    if (document.body.classList.contains('lux-route-faculty-gradebook')
        && el.closest?.('.lux-faculty-gradebook-page, #page-faculty-gradebook')) {
        if (hasOwnedClassPrefix(el, ['lux-fg-', 'gb-', 'lux-faculty-'])) return true;
    }

    if (document.body.classList.contains('lux-route-admin-scheduler')
        && (el.closest?.('#page-admin-scheduler')
            || el.closest?.('#schModalOverlay, #schPresetManagerOverlay, #profQuizModalOverlay'))) {
        if (hasOwnedClassPrefix(el, ['sch-', 'palette-'])
            || el.matches?.('.lux-strip-card')
            || el.matches?.(
                '.sch-form-section.home-hover-chip, .sch-conflict-alert.home-hover-chip, ' +
                '.sch-modal-mode-chip.home-hover-chip, .sch-preset-manage-item.home-hover-chip, ' +
                '.sch-modal-close-muted.home-hover-chip, .sch-preset-manage-link.home-hover-chip'
            )
            || ((el.tagName === 'SELECT' || el.tagName === 'INPUT')
                && el.closest?.('.sch-control-group, .lux-picker-field, .sch-board-toolbar-row, .sch-search-shell, .lux-glass-dialog-card, #schModalOverlay, #schPresetManagerOverlay'))) {
            return true;
        }
    }

    if (document.body.classList.contains('lux-route-staff') && el.closest?.('#staff-content')) {
        if (hasOwnedClassPrefix(el, ['staff-hub-']) || el.closest?.('.staff-hub-form-settings')) return true;
        if (el.matches?.(
            '.staff-hub-builder-rail.home-hover-chip, .staff-hub-builder-canvas.home-hover-chip, ' +
            '.staff-hub-profile-panel.home-hover-chip, .staff-hub-section-field-workspace.home-hover-chip, ' +
            '.staff-hub-profile-row.home-hover-chip, .staff-hub-studio-field-row.home-hover-chip, ' +
            '.staff-hub-builder-type.home-hover-chip, .staff-hub-studio-quick-btn.home-hover-chip, ' +
            '.staff-hub-copy-bar.home-hover-chip, .staff-hub-profile-list-shell.home-hover-chip'
        )) return true;
    }

    if (document.body.classList.contains('lux-route-students-admin')
        && el.closest?.('#students-content')
        && !el.closest?.('#students-admin-lms-modal')) {
        if (hasOwnedClassPrefix(el, ['students-hub-']) || el.closest?.('.students-hub-form-settings')) return true;
        if (el.matches?.(
            '.students-hub-builder-rail.home-hover-chip, .students-hub-builder-canvas.home-hover-chip, ' +
            '.students-hub-profile-panel.home-hover-chip, .students-hub-section-field-workspace.home-hover-chip, ' +
            '.students-hub-profile-row.home-hover-chip, .students-hub-studio-field-row.home-hover-chip, ' +
            '.students-hub-builder-type.home-hover-chip, .students-hub-studio-quick-btn.home-hover-chip, ' +
            '.students-hub-copy-bar.home-hover-chip, .students-hub-profile-list-shell.home-hover-chip'
        )) return true;
    }

    if (document.body.classList.contains('lux-route-study-card')
        && el.closest?.('#page-study-card, #study-card-container, .study-card-command-deck, .study-card-page-shell')) {
        if (hasOwnedClassPrefix(el, ['study-card-']) || el.id === 'study-card-container') return true;
    }

    if (document.body.classList.contains('lux-route-personal-data') && el.closest?.('#page-personal-data')) {
        if (hasOwnedClassPrefix(el, ['personal-data-', 'profile-']) || el.classList.contains('filter-shell')) return true;
    }

    if (document.body.classList.contains('lux-route-programs') && el.closest?.('#page-programs')) {
        if (hasOwnedClassPrefix(el, ['lux-program-', 'lux-prog-', 'lux-module-', 'lux-subject-'])) return true;
    }

    if (document.body.classList.contains('lux-route-chancellery')
        && el.closest?.('#page-chancellery, #chancellery-document-editor-overlay, #chancellery-appeal-overlay, #chancellery-forward-overlay, #chancellery-case-overlay')) {
        if (hasOwnedClassPrefix(el, ['lux-chancellery-', 'orders-recipient-filter-editor-', 'chancellery-document-', 'chancellery-appeal-', 'chancellery-forward-', 'chancellery-case-'])
            || el.classList.contains('lux-queue-item')
            || el.classList.contains('lux-thread-entry')) return true;
        if (el.closest?.('#chancellery-document-editor-overlay, #chancellery-appeal-overlay, #chancellery-forward-overlay, #chancellery-case-overlay') && el.matches?.(
            '.lux-primary-btn, .lux-secondary-btn, .lux-tab-btn, .lux-control'
        )) return true;
    }

    if (document.body.classList.contains('lux-route-student-service')
        && el.closest?.('#page-student-service, .student-service-shell')) {
        if (hasOwnedClassPrefix(el, ['student-service-'])) return true;
    }

    if (!document.body.classList.contains('lux-route-admin-orders')
        && el.closest?.('#page-orders, #orders-inbox-root')) {
        if (hasOwnedClassPrefix(el, ['orders-']) || el.classList.contains('lux-hero-signal')) return true;
    }

    if (document.body.classList.contains('lux-route-admin-orders')
        && el.closest?.('#admin-orders-root, #admin-orders-create-overlay, #admin-orders-thread-overlay, #admin-orders-recipient-filter-overlay, #modal-studio')) {
        if (hasOwnedClassPrefix(el, ['orders-', 'admin-orders-'])) return true;
        if (el.matches?.(
            '.lux-card-head, .lux-card-title, .lux-card-copy, .lux-control, ' +
            '.lux-primary-btn, .lux-secondary-btn, .lux-picker-btn, .lux-status-pill'
        )) return true;
    }

    if (document.body.classList.contains('lux-route-library') && el.closest?.('#page-library')) {
        if (el.matches?.('.library-catalog-filters-panel, .admin-library-catalog-card, .admin-library-tabs, .admin-library-catalog-foot, .lux-hero-signal, .lux-picker-btn')) return true;
    }

    if ((document.body.classList.contains('lux-route-admin-library') || document.body.classList.contains('lux-entry-admin-library'))
        && (el.closest?.('#page-library') || el.classList.contains('admin-library-modal'))) {
        if (el.matches?.(
            '.alib-panel, .admin-library-chip, .admin-library-param-group, .library-catalog-filters-panel, ' +
            '.admin-library-catalog-card, .admin-library-tabs, .admin-library-catalog-foot, .admin-library-modal, ' +
            '.admin-library-schema-field-row.home-hover-chip, .admin-library-schema-add-form.home-hover-chip, ' +
            '.admin-library-schema-empty.home-hover-chip, .admin-library-schema-droplist-editor-body.home-hover-chip, ' +
            '.admin-library-sections-panel.home-hover-chip, .admin-library-section-row.home-hover-chip, ' +
            '.admin-library-chip.home-hover-chip, .admin-library-param-group.home-hover-chip'
        )) return true;
    }

    return false;
}

/** True when FOUC / route CSS owns paint (engine must not apply inline glass). */
function isCssOwnedSurface(el) {
    if (!el?.classList) return false;

    if (el.matches?.(CSS_OWNED_HOST_SELECTOR)) return true;
    if (el.matches?.(CSS_OWNED_PRIMITIVE_SELECTOR)) return true;
    if (el.matches?.(CSS_OWNED_CHIP_SELECTOR)) return true;

    if (document.body.classList.contains('lux-page-bare')) {
        const desk = el.closest?.('[data-lux-glass-root="1"]');
        if (desk && el !== desk) return true;
        if (el.matches?.('.lux-card') && el.closest?.('.page-section, [data-lux-glass-root="1"]')) return true;
        if (el.closest?.('.page-section') && el.matches?.('select, input, table')) return true;
    }

    if (isHomeCssOwnedInnerPanel(el)) return true;

    return isRouteOwnedSurface(el);
}

/** Registration outer glass hosts — CSS owns frosted blur; never force matte solid at max transparency. */
function isRegistrationGlassHost(el) {
    if (!el?.matches || !document.body.classList.contains('lux-route-registration')) return false;
    if (!el.closest?.('#page-registration')) return false;
    return el.matches('.registration-studio-shell[data-lux-glass-root="1"]');
}

/** Registration matte chips + active tab — CSS owns paint; never flatten at max transparency. */
function shouldPreserveRegistrationCssPaint(el) {
    if (!el?.matches || !document.body.classList.contains('lux-route-registration')) return false;
    if (!el.closest?.('#page-registration')) return false;
    if (isRegistrationGlassHost(el)) return true;
    if (el.classList.contains('home-hover-chip')) return true;
    if (el.classList.contains('reg-tab') && el.classList.contains('active')) return true;
    return false;
}

const GLOBAL_DYNAMIC_PAINT_CLASSES = new Set([
    'lux-card', 'lux-panel', 'lux-page-shell', 'surface-card', 'content-box', 'kiu-card', 'page-hero',
    'schedule-toolbar-host', 'schedule-toolbar', 'lux-modern-surface', 'lux-modern-table',
    'lux-strip-card', 'lux-stat-card', 'lux-person-card', 'lux-subcard',
    'lux-admin-op-card', 'lux-admin-ops-panel', 'lux-hero', 'lux-dashboard-section',
    'lux-hero-signal', 'lux-hero-side-head', 'lux-control', 'lux-status-pill',
    'lux-primary-btn', 'lux-secondary-btn',
]);

function shouldApplyDynamicBackground(el) {
    if (!el?.classList) return false;
    if (el.getAttribute('data-lux-glass-root') === '1') return true;
    for (const className of el.classList) {
        if (GLOBAL_DYNAMIC_PAINT_CLASSES.has(className)) return true;
    }
    if (document.body.classList.contains('lux-route-social')) {
        if (el.classList.contains('lux-primary-btn')
            || el.classList.contains('lux-secondary-btn')
            || el.classList.contains('lux-ghost-btn')
            || el.classList.contains('lux-destructive-btn')) {
            return false;
        }
        return isSocialPaintSurface(el) || isSocialBlurHost(el)
            || el.classList.contains('social-neo-card')
            || el.parentElement?.classList?.contains('social-neo-stat-grid')
            || [...el.classList].some((className) =>
                className.startsWith('social-neo-') ||
                className.startsWith('social-project') ||
                className.startsWith('social-portfolio'));
    }
    return isRouteOwnedSurface(el);
}

function shouldKeepRouteFadeCssBackground(el) {
    if (el?.getAttribute?.('data-lux-layout-only') === '1') return true;
    if (el?.getAttribute?.('data-lux-glass-root') === '1') return true;
    if (shouldKeepHomeFadeCssBackground(el)) return true;
    if (shouldKeepSocialFadeCssBackground(el)) return true;
    return isCssOwnedSurface(el);
}

function stripInlineGlassPaint(el, transparencySignature) {
    el.style.removeProperty('background-color');
    el.style.removeProperty('background');
    el.style.removeProperty('backdrop-filter');
    el.style.removeProperty('-webkit-backdrop-filter');
    el.dataset.luxTransparencySignature = transparencySignature;
}

function buildHomeStyleSurfaceBackground(lightMode, amount) {
    if (lightMode) {
        return `radial-gradient(circle at 6% 0%, rgba(255,255,255, ${(amount * 0.88).toFixed(2)}), transparent 34%), radial-gradient(circle at 74% 0%, rgba(var(--lux-accent-rgb), ${(amount * 0.24).toFixed(2)}), transparent 42%), radial-gradient(circle at 100% 96%, rgba(var(--lux-home-secondary-rgb), ${(amount * 0.14).toFixed(2)}), transparent 40%), linear-gradient(135deg, rgba(var(--lux-accent-rgb), ${(amount * 0.065).toFixed(2)}), rgba(255,255,255, ${(amount * 0.84).toFixed(2)}) 44%, rgba(247,241,232, ${(amount * 0.70).toFixed(2)}))`;
    }
    return `radial-gradient(circle at 6% 0%, rgba(255,255,255, ${(amount * 0.08).toFixed(2)}), transparent 32%), radial-gradient(circle at 74% 0%, rgba(var(--lux-accent-rgb), ${(amount * 0.28).toFixed(2)}), transparent 42%), radial-gradient(circle at 100% 96%, rgba(var(--lux-home-secondary-rgb), ${(amount * 0.18).toFixed(2)}), transparent 40%), linear-gradient(135deg, rgba(var(--lux-accent-rgb), ${(amount * 0.10).toFixed(2)}), rgba(10,15,24, ${(amount * 0.89).toFixed(2)}) 44%, rgba(7,10,18, ${(amount * 0.80).toFixed(2)}))`;
}

function buildLuxuryRoutePanelGradient(lightMode, isSmallSurface) {
    return isSmallSurface
        ? 'var(--lux-panel-surface-soft)'
        : 'var(--lux-panel-surface)';
}

Object.assign(window, {
    isSocialBlurHost,
    isSocialPaintSurface,
    shouldKeepSocialFadeCssBackground,
    isRouteOwnedSurface,
    isCssOwnedSurface,
    isRegistrationGlassHost,
    shouldPreserveRegistrationCssPaint,
    shouldApplyDynamicBackground,
    shouldKeepRouteFadeCssBackground,
    shouldKeepHomeFadeCssBackground,
    stripInlineGlassPaint,
    buildHomeStyleSurfaceBackground,
    buildLuxuryRoutePanelGradient,
    matchesTransparencyObserver,
    appendRouteOwnedSurfaces,
});

const SHARED_TRANSPARENCY_OBSERVER_SELECTORS = [
    '.lux-card', '.lux-panel', '.lux-person-card', '.lux-subcard', '.lux-hero', '.lux-stack', '.lux-dashboard-section',
    '.lux-grid-widget', '.lux-home-card', '.lux-admin-ops-card',
    '.lux-builder-card', '.lux-builder-section', '.surface-card',
    '.content-box', '.kiu-card', '.page-card', '.section-card', '.panel-card', '.dashboard-card', '.tabs-container',
    '.modal-content', '.page-hero', '.lux-person-head', '.lux-inline-meta', '.lux-card-actions', '.lux-card-head',
    '.lux-card-body', '.lux-panel-body', '.lux-page-shell', '.lux-stat-card', '.lux-stat',
    '.lux-page-kicker', '.lux-status-pill', '.lux-control',
    '[data-lux-glass-root="1"]',
    '.schedule-chip', '.schedule-view-switcher', '.schedule-week-arrow',
    '.schedule-toolbar-host', '.schedule-toolbar', '.schedule-week-nav', '.schedule-overview-row', '.schedule-view-row',
    ...LUX_MODERN_TRANSPARENCY_SURFACE_SELECTORS,
    ...SOCIAL_NEO_TRANSPARENCY_SURFACE_SELECTORS
];

function matchesTransparencyObserver(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE || !node.classList?.length) return false;
    if (shouldApplyDynamicBackground(node) || isRouteOwnedSurface(node)) return true;
    if (node.matches?.(SHARED_TRANSPARENCY_OBSERVER_SELECTORS.join(', '))) return true;
    if (node.querySelector?.('[data-lux-glass-root="1"], .lux-card, .lux-panel, .lux-hero, .social-neo-card')) return true;
    return false;
}

const TRANSPARENCY_CORE_SELECTORS = [
    '.lux-card', '.lux-panel', '.lux-dashboard-section', '.lux-hero',
    '.lux-grid-widget', '.lux-home-card', '.lux-admin-ops-card', '.lux-builder-card', '.lux-builder-section',
    '.lux-page-shell', '.lux-stat-card', '.lux-stat', '.surface-card', '.content-box', '.kiu-card', '.page-card',
    '.section-card', '.panel-card', '.dashboard-card', '.tabs-container', '.modal-content', '.page-hero',
    '.portal-msg-page-top', '.portal-msg-panel', '.portal-msg-group-modal',
    '.lux-admin-op-card', '.lux-admin-ops-panel', '[data-lux-glass-root="1"]',
    '.lux-person-card', '.lux-subcard', '.lux-stack', '.lux-person-head', '.lux-inline-meta', '.lux-card-actions',
    '.lux-grid-widget-body', '.lux-widget-container', '.lux-card-head', '.lux-card-body', '.lux-panel-body',
    '.lux-page-kicker', '.lux-status-pill',
    '#modal-studio.admin-orders-studio', '#modal-studio .admin-orders-studio-card',
    '#modal-studio .admin-orders-palette-option', '#modal-studio .admin-orders-mode-btn',
    '#modal-studio .admin-orders-background-btn', '#modal-studio .admin-orders-apply-btn',
    '.schedule-chip', '.schedule-view-switcher', '.schedule-week-arrow',
    '.schedule-toolbar-host', '.schedule-toolbar', '.schedule-week-nav',
    '.schedule-overview-row', '.schedule-view-row',
    ...SOCIAL_NEO_TRANSPARENCY_SURFACE_SELECTORS,
    ...LUX_MODERN_TRANSPARENCY_SURFACE_SELECTORS
];

function appendRouteOwnedSurfaces(elements, rootsOverride) {
    const seen = new Set(elements);
    const explicitRoots = normalizeTransparencyRoots(rootsOverride);
    const scanRoots = explicitRoots.length
        ? explicitRoots
        : [document.querySelector('.page-section.active-page')].filter(Boolean);
    if (!scanRoots.length && document.body) scanRoots.push(document.body);

    scanRoots.forEach((root) => {
        if (!root || root.nodeType !== Node.ELEMENT_NODE) return;
        const stack = [root];
        while (stack.length) {
            const el = stack.pop();
            if (!el || el.nodeType !== Node.ELEMENT_NODE) continue;
            if (el.classList?.length && isRouteOwnedSurface(el) && !seen.has(el)) {
                seen.add(el);
                elements.push(el);
            }
            for (let i = el.children.length - 1; i >= 0; i -= 1) stack.push(el.children[i]);
        }
    });
    return elements;
}
const INDEX_TRANSPARENCY_GLOBAL_ROOT_SELECTORS = [
    '#lux-shell', '#lux-topbar', '#mobile-bottom-nav', '#mobile-action-sheet', '#modal-overlay',
    '#social-shortcuts-top-nav-portal',
    '.lux-picker-panel'
];

function normalizeTransparencyRoots(roots) {
    if (!Array.isArray(roots)) return [];
    return roots.filter((root) => root && typeof root.querySelectorAll === 'function');
}

const LUX_TRANSPARENCY_SELECTOR_CACHE = typeof WeakMap === 'function' ? new WeakMap() : null;
const LUX_TRANSPARENCY_SURFACE_CACHE = {
    signature: '',
    elements: []
};

function resetTransparencySurfaceCache() {
    LUX_TRANSPARENCY_SURFACE_CACHE.signature = '';
    LUX_TRANSPARENCY_SURFACE_CACHE.elements = [];
}

function buildTransparencyRootSignature() {
    const activePage = document.querySelector('.page-section.active-page');
    const modalOverlay = document.getElementById('modal-overlay');
    const mobileSheet = document.getElementById('mobile-action-sheet');
    const mobileNav = document.getElementById('mobile-bottom-nav');
    const studio = document.querySelector('.lux-studio-backdrop');
    return [
        activePage?.id || 'no-page',
        modalOverlay?.classList.contains('active') ? 'modal-on' : 'modal-off',
        mobileSheet && !mobileSheet.hidden && mobileSheet.style.display !== 'none' ? 'sheet-on' : 'sheet-off',
        mobileNav && !mobileNav.hidden && mobileNav.style.display !== 'none' ? 'nav-on' : 'nav-off',
        studio?.classList.contains('is-open') ? 'studio-on' : 'studio-off',
        document.body?.dataset?.luxPage || '',
        document.body?.dataset?.luxEntry || ''
    ].join('|');
}

function collectTransparencySurfaceElements(selectorList, rootsOverride) {
    let selector = '';
    if (Array.isArray(selectorList)) {
        selector = LUX_TRANSPARENCY_SELECTOR_CACHE?.get(selectorList) || '';
        if (!selector) {
            selector = selectorList.join(', ');
            LUX_TRANSPARENCY_SELECTOR_CACHE?.set(selectorList, selector);
        }
    } else {
        selector = String(selectorList || '').trim();
    }
    if (!selector) return [];

    const explicitRoots = normalizeTransparencyRoots(rootsOverride);
    if (explicitRoots.length) {
        const elements = new Set();
        explicitRoots.forEach((root) => {
            if (!root || typeof root.querySelectorAll !== 'function') return;
            if (typeof root.matches === 'function' && root.matches(selector)) {
                elements.add(root);
            }
            root.querySelectorAll(selector).forEach((el) => elements.add(el));
        });
        return finalizeTransparencySurfaceElements(
            appendRouteOwnedSurfaces(Array.from(elements), explicitRoots)
        );
    }

    if (!document.querySelector('.page-section')) {
        return finalizeTransparencySurfaceElements(
            appendRouteOwnedSurfaces(Array.from(document.querySelectorAll(selector)), explicitRoots)
        );
    }

    const roots = new Set();
    const activePage = document.querySelector('.page-section.active-page');
    if (activePage) roots.add(activePage);

    INDEX_TRANSPARENCY_GLOBAL_ROOT_SELECTORS.forEach((rootSelector) => {
        document.querySelectorAll(rootSelector).forEach((root) => {
            if (!root) return;
            if (
                root.id === 'modal-overlay'
                && !root.classList.contains('active')
                && root.style.display !== 'flex'
                && root.style.display !== 'block'
            ) {
                return;
            }
            if (root.id === 'mobile-action-sheet' && (root.hidden || root.style.display === 'none')) return;
            if (root.id === 'mobile-bottom-nav' && (root.hidden || root.style.display === 'none')) return;
            roots.add(root);
        });
    });

    if (!roots.size) {
        return finalizeTransparencySurfaceElements(
            appendRouteOwnedSurfaces(Array.from(document.querySelectorAll(selector)), explicitRoots)
        );
    }

    const elements = new Set();
    roots.forEach((root) => {
        if (!root || typeof root.querySelectorAll !== 'function') return;
        if (typeof root.matches === 'function' && root.matches(selector)) {
            elements.add(root);
        }
        root.querySelectorAll(selector).forEach((el) => elements.add(el));
    });

    return finalizeTransparencySurfaceElements(
        appendRouteOwnedSurfaces(Array.from(elements), explicitRoots)
    );
}

function filterCssOwnedTransparencySurfaces(elements) {
    if (!Array.isArray(elements) || !elements.length) return elements;
    const keepHomeFade = typeof window.shouldKeepHomeFadeCssBackground === 'function'
        ? window.shouldKeepHomeFadeCssBackground
        : null;
    return elements.filter((el) => {
        if (!el) return false;
        if (typeof shouldKeepRouteFadeCssBackground === 'function' && shouldKeepRouteFadeCssBackground(el)) {
            return false;
        }
        if (keepHomeFade && keepHomeFade(el)) return false;
        if (window.__luxCssNativeGlass !== false && el.classList?.contains('lux-modern-surface')) {
            return false;
        }
        return true;
    });
}

function finalizeTransparencySurfaceElements(elements) {
    return filterCssOwnedTransparencySurfaces(elements);
}

function filterCssOwnedTransparencySurfaces(elements) {
    if (!Array.isArray(elements) || !elements.length) return elements;
    const keepHomeFade = typeof window.shouldKeepHomeFadeCssBackground === 'function'
        ? window.shouldKeepHomeFadeCssBackground
        : null;
    return elements.filter((el) => {
        if (!el) return false;
        if (typeof shouldKeepRouteFadeCssBackground === 'function' && shouldKeepRouteFadeCssBackground(el)) {
            return false;
        }
        if (keepHomeFade && keepHomeFade(el)) return false;
        if (window.__luxCssNativeGlass !== false && el.classList?.contains('lux-modern-surface')) {
            return false;
        }
        return true;
    });
}

function finalizeTransparencySurfaceElements(elements) {
    return filterCssOwnedTransparencySurfaces(elements);
}

function getCachedTransparencySurfaceElements(selectorList, rootsOverride) {
    const explicitRoots = normalizeTransparencyRoots(rootsOverride);
    if (explicitRoots.length) {
        return collectTransparencySurfaceElements(selectorList, explicitRoots);
    }

    const signature = buildTransparencyRootSignature();
    if (LUX_TRANSPARENCY_SURFACE_CACHE.signature === signature && LUX_TRANSPARENCY_SURFACE_CACHE.elements.length) {
        LUX_TRANSPARENCY_SURFACE_CACHE.elements = LUX_TRANSPARENCY_SURFACE_CACHE.elements.filter((el) => el && el.isConnected);
        return LUX_TRANSPARENCY_SURFACE_CACHE.elements;
    }

    const elements = collectTransparencySurfaceElements(selectorList);
    LUX_TRANSPARENCY_SURFACE_CACHE.signature = signature;
    LUX_TRANSPARENCY_SURFACE_CACHE.elements = elements.filter((el) => el && el.isConnected);
    return LUX_TRANSPARENCY_SURFACE_CACHE.elements;
}

const HIGH_TRANSPARENCY_TEXT_RESET_SELECTORS = [
    '.lux-card-head', '.lux-card-title', '.lux-card-meta', '.lux-builder-copy', '.lux-card-body', '.lux-panel-body',
    '.lux-grid-widget-body', '.lux-widget-container', '.lux-inline-meta', '.lux-card-actions', '.lux-page-kicker',
    '.lux-person-head', '.lux-admin-ops-head', '[class*="-head"]', '[class*="-meta"]', '[class*="-title"]',
    '[class*="-copy"]', '[class*="-label"]',
    '[class*="-kicker"]'
];

const HIGH_TRANSPARENCY_SURFACE_SELECTORS = [
    '.lux-card', '.lux-panel', '.lux-subcard', '.lux-hero', '.lux-stat', '.lux-stat-card', '.lux-home-card',
    '.lux-grid-widget', '.lux-admin-ops-card', '.lux-builder-card', '.lux-builder-section', '.lux-dashboard-section',
    '.lux-page-shell', '.surface-card', '.content-box', '.kiu-card', '.page-card', '.section-card', '.panel-card',
    '.dashboard-card', '.tabs-container', '.modal-content', '.page-hero', '.lux-modern-surface', '.lux-modern-table',
    '.lux-utility-panel', '.lux-person-card', '.lux-stack', '#page-admin-scheduler .sch-sidebar',
    '#page-admin-scheduler .sch-grid-shell',
    '#page-timetable .sch-grid-shell',
    '#page-admin-scheduler .palette-card', '#page-admin-scheduler .sch-stat-card',
    '#page-admin-scheduler .sch-grid-tag',
    '#page-admin-scheduler .sch-empty-state', '#page-admin-scheduler .sch-grid-empty', '.lux-lms-group-card',
    '.lms-route-panel', '.lms-route-hero', '.portal-msg-page-top', '.portal-msg-panel', '.portal-msg-group-modal',
    '.admin-hero',
    '.adlib-hero'
];

function buildHighTransparencyScopedSelectors(bodySelector, selectors) {
    return selectors.map((selector) =>
        `html.lux-high-transparency.lux-high-transparency.lux-high-transparency ${bodySelector} ${selector}`
    ).join(',');
}

function buildHighTransparencyTextResetCss(bodySelector) {
    return `${buildHighTransparencyScopedSelectors(bodySelector, HIGH_TRANSPARENCY_TEXT_RESET_SELECTORS)}{` +
        'background:transparent!important;' +
        'background-image:none!important;' +
        'box-shadow:none!important;' +
        'backdrop-filter:none!important;' +
        '-webkit-backdrop-filter:none!important;' +
    '}';
}

function buildHighTransparencySurfaceCss(bodySelector, backgroundValue) {
    return `${buildHighTransparencyScopedSelectors(bodySelector, HIGH_TRANSPARENCY_SURFACE_SELECTORS)}{` +
        `background:${backgroundValue}!important;` +
    '}';
}

function buildStudentsAdminHighTransparencyCss() {
    return '';
}

function applyStudentsAdminManagedSurface(el, percentage, signature) {
    return false;
}

function applyStudentsAdminSurfaceFades(percentage) {
    return;
}

window.applyStudentsAdminSurfaceFades = applyStudentsAdminSurfaceFades;

function clampLuxuryTransparencyPercentage(value, fallback = 70) {
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(0, Math.min(100, parsed));
}

function mapLuxuryTransparencyFillRatio(value) {
    const percentage = clampLuxuryTransparencyPercentage(value, 0);
    return (percentage + 1) / 101;
}

function resolveGlassBlurQualityKey() {
    const fromBody = String(document.body?.dataset?.luxGlassBlurQuality || '').trim().toLowerCase();
    if (fromBody === 'auto' || fromBody === 'high' || fromBody === 'balanced' || fromBody === 'performance') return fromBody;
    if (typeof window.getGlassBlurQuality === 'function') {
        const fromApi = String(window.getGlassBlurQuality() || '').trim().toLowerCase();
        if (fromApi === 'auto' || fromApi === 'high' || fromApi === 'balanced' || fromApi === 'performance') return fromApi;
    }
    try {
        const stored = String(localStorage.getItem('kiuLuxuryGlassBlurQuality') || '').trim().toLowerCase();
        if (stored === 'auto' || stored === 'high' || stored === 'balanced' || stored === 'performance') return stored;
    } catch (_error) {  }
    return 'auto';
}

function resolveGlassBlurQualityMultiplier(qualityKey = resolveGlassBlurQualityKey()) {
    if (qualityKey === 'auto') {
        const tier = window.getLuxuryBackgroundRenderProfile?.().tier || 'standard';
        if (tier === 'efficient') return 0.25;
        if (tier === 'high') return 1;
        return 0.5;
    }
    if (qualityKey === 'balanced') return 0.5;
    if (qualityKey === 'performance') return 0.25;
    return 1;
}

function buildLuxuryTransparencyModel(value, lightMode = false) {
    if (typeof window.__kiuBuildLuxuryTransparencyModel === 'function') {
        return window.__kiuBuildLuxuryTransparencyModel(value, lightMode);
    }
    const percentage = clampLuxuryTransparencyPercentage(value);
    const fillRatio = mapLuxuryTransparencyFillRatio(percentage);
    const transparencyRatio = fillRatio;
    const colorFadeRatio = Math.max(0.01, Math.min(1, fillRatio * 0.92));
    return {
        percentage,
        transparencyRatio,
        fillRatio,
        colorFadeRatio,
        panelAlpha: lightMode
            ? Math.max(0.12, 0.12 + (fillRatio * 0.83))
            : Math.max(0.08, 0.08 + (fillRatio * 0.84)),
        raisedAlpha: lightMode
            ? 0.03 + (fillRatio * 0.16)
            : 0.02 + (fillRatio * 0.14),
        glassAlpha: lightMode
            ? 0.02 + (fillRatio * 0.10)
            : 0.015 + (fillRatio * 0.08),
        panelFillAlpha: lightMode
            ? 0.04 + (fillRatio * 0.20)
            : 0.03 + (fillRatio * 0.16),
        raisedFillAlpha: lightMode
            ? 0.02 + (fillRatio * 0.14)
            : 0.015 + (fillRatio * 0.12),
        utilityFillAlpha: lightMode
            ? 0.05 + (fillRatio * 0.22)
            : 0.04 + (fillRatio * 0.18),
        utilityAlpha: lightMode
            ? 0.18 + (fillRatio * 0.66)
            : 0.16 + (fillRatio * 0.70),
        topbarFillAlpha: lightMode
            ? 0.16 + (fillRatio * 0.62)
            : 0.14 + (fillRatio * 0.72),
        topbarRaisedAlpha: 0.04 + (fillRatio * 0.16),
        glassHighlightAlpha: lightMode
            ? 0.01 + (fillRatio * 0.04)
            : 0.006 + (fillRatio * 0.02),
        highTransparency: percentage <= 20
    };
}

function applyLiveTransparencyTokens(transparencyModel, fillRatio, percentage) {
    const glowPercent = typeof window.getGlowStrength === 'function'
        ? window.getGlowStrength()
        : (typeof getGlowStrength === 'function' ? getGlowStrength() : 50);
    const glowConfig = typeof window.resolveGlowTokenConfig === 'function'
        ? window.resolveGlowTokenConfig(glowPercent)
        : (typeof resolveGlowTokenConfig === 'function' ? resolveGlowTokenConfig(glowPercent) : null);
    if (typeof window.__kiuApplyTransparencyTokenState === 'function') {
        window.__kiuApplyTransparencyTokenState({
            panelAlpha: transparencyModel.panelAlpha.toFixed(3),
            fillRatio: transparencyModel.fillRatio.toFixed(3),
            colorFadeRatio: transparencyModel.colorFadeRatio.toFixed(3),
            raisedAlpha: transparencyModel.raisedAlpha.toFixed(3),
            glassAlpha: transparencyModel.glassAlpha.toFixed(3),
            panelFillAlpha: transparencyModel.panelFillAlpha.toFixed(3),
            raisedFillAlpha: transparencyModel.raisedFillAlpha.toFixed(3),
            utilityFillAlpha: transparencyModel.utilityFillAlpha.toFixed(3),
            utilityAlpha: transparencyModel.utilityAlpha.toFixed(3),
            topbarFillAlpha: transparencyModel.topbarFillAlpha.toFixed(3),
            topbarRaisedAlpha: transparencyModel.topbarRaisedAlpha.toFixed(3),
            glassHighlightAlpha: transparencyModel.glassHighlightAlpha.toFixed(3)
        }, glowConfig ? {
            panelGlow: glowConfig.panelGlow,
            glowScale: glowConfig.glowScale,
            cardGlowAlpha: glowConfig.cardGlowAlpha
        } : {});
    }
    const glassBlurQuality = resolveGlassBlurQualityKey();
    const glassBlurMult = resolveGlassBlurQualityMultiplier(glassBlurQuality);
    const blurAmount = (2 + fillRatio * 22) * glassBlurMult;
    const saturateAmount = 100 + (fillRatio * 45);
    const blurPx = `${blurAmount}px`;
    [document.documentElement, document.body].filter(Boolean).forEach((target) => {
        target.style.setProperty('--lux-transparency-blur', blurPx);
        target.style.setProperty('--lux-glass-blur', blurPx);
        target.style.setProperty('--lux-glass-blur-quality-mult', String(glassBlurMult));
        target.style.setProperty('--lux-transparency-saturate', `${saturateAmount}%`);
        target.style.setProperty('--lux-transparency-percentage', `${percentage}%`);
    });
}

function updateTransparency(value, options = {}) {
    const scopedRoots = normalizeTransparencyRoots(options?.roots);
    const percentage = clampLuxuryTransparencyPercentage(value);
    const forceRefresh = options?.force === true;
    const live = options?.live === true;

    const shouldPersist = !live && options?.persist !== false;

    const display = document.getElementById('transparency-display') || document.getElementById('lux-transparency-value');
    if (display) {
        display.textContent = `${percentage}%`;
    }

    if (!live) {
        const slider = document.getElementById('transparency-slider') || document.getElementById('lux-transparency-slider');
        if (slider) {
            slider.value = percentage;
        }
    }

    const isLightTheme = document.documentElement.dataset.luxThemeMode === 'light';
    const fillRatio = mapLuxuryTransparencyFillRatio(percentage);
    const transparencyModel = buildLuxuryTransparencyModel(percentage, isLightTheme);

    if (shouldPersist && typeof window.setDashboardVisuals === 'function') {
        try {
            window.setDashboardVisuals({ surfaceTransparency: String(percentage) });
        } catch (error) {}
    }

    if (shouldPersist) {
        if (typeof window.__kiuApplyTransparencyPreferenceState === 'function') {
            window.__kiuApplyTransparencyPreferenceState(percentage, transparencyModel.transparencyRatio);
        } else {
            localStorage.setItem('kiuLuxurySurfaceTransparency', percentage.toString());
            localStorage.setItem('kiuLuxurySurfaceTransparencyValue', transparencyModel.transparencyRatio.toFixed(2));
            document.documentElement.dataset.luxTransparency = percentage.toString();
        }
    } else if (!live) {
        document.documentElement.dataset.luxTransparency = percentage.toString();
    }

    document.documentElement.classList.toggle('lux-fully-opaque', percentage >= 99);

    if (live) {
        window.__currentTransparency = percentage;
        const wasHigh = document.documentElement.classList.contains('lux-high-transparency');
        if (transparencyModel.highTransparency !== wasHigh) {

        } else {
            applyLiveTransparencyTokens(transparencyModel, fillRatio, percentage);
            return;
        }
    }

    if (transparencyModel.highTransparency) {

        var _isLight = isLightTheme;
        var _panelA = transparencyModel.panelAlpha;
        var _pa = _panelA.toFixed(3);
        var _bg = 'var(--lux-panel-surface)';
        var _bodySelector = _isLight ? 'body.lux-light-mode' : 'body:not(.lux-light-mode)';
        var _bodyBg = _isLight
            ? 'linear-gradient(180deg,rgba(245,240,232,' + _pa + '),rgba(240,235,226,' + _pa + '))'
            : 'linear-gradient(180deg,rgba(12,17,26,' + _pa + '),rgba(7,10,16,' + _pa + '))';
        var _animationsOff = document.body && document.body.dataset.luxBackgroundAnimation === 'off';
        var _staticFill = _animationsOff ? String(document.body.dataset.luxStaticBackground || '').trim().toLowerCase() : '';
        if (_animationsOff && _staticFill === 'dark') {
            _bodyBg = '#05080f';
        } else if (_animationsOff && _staticFill === 'white') {
            _bodyBg = '#ffffff';
        } else if (_animationsOff && _staticFill === 'colored' && !_isLight) {
            _bodyBg = 'var(--lux-shell-background)';
        }

        var highTransparencyCss =
            'html.lux-high-transparency.lux-high-transparency.lux-high-transparency{--lux-hero-glow:0!important}' +
            buildHighTransparencySurfaceCss(_bodySelector, _bg) +
            buildStudentsAdminHighTransparencyCss(_bodySelector, _isLight, _panelA) +
            buildHighTransparencyTextResetCss(_bodySelector);

        if (_animationsOff && (_staticFill === 'dark' || _staticFill === 'white')) {
            highTransparencyCss +=
                'html.lux-high-transparency.lux-high-transparency.lux-high-transparency ' + _bodySelector + '::before{background:' + _bodyBg + '!important}';
        }
        if (typeof window.__kiuApplyHighTransparencyState === 'function') {
            window.__kiuApplyHighTransparencyState(true, highTransparencyCss);
        } else {
            document.documentElement.classList.add('lux-high-transparency');
            var existingStyle = document.getElementById('lux-high-trans-primer');
            if (!existingStyle) {
                existingStyle = document.createElement('style');
                existingStyle.id = 'lux-high-trans-primer';
                existingStyle.textContent = ':root{}';
                document.head.appendChild(existingStyle);
            }
            existingStyle.media = 'all';
            existingStyle.textContent = highTransparencyCss || ':root{}';
        }
    } else {
        if (typeof window.__kiuApplyHighTransparencyState === 'function') {
            window.__kiuApplyHighTransparencyState(false);
        } else {
            document.documentElement.classList.remove('lux-high-transparency');
            var primerStyle = document.getElementById('lux-high-trans-primer');
            if (primerStyle) {
                primerStyle.textContent = ':root{}';
                primerStyle.media = 'all';
            }
        }
    }

    if (live) {
        applyLiveTransparencyTokens(transparencyModel, fillRatio, percentage);
        return;
    }

    const glowPercent = typeof getGlowStrength === 'function' ? getGlowStrength() : 50;
    const glowConfig = typeof resolveGlowTokenConfig === 'function'
        ? resolveGlowTokenConfig(glowPercent)
        : (() => {
            const pct = Math.min(100, Math.max(0, Math.round(Number(glowPercent) || 50)));
            const glowScale = pct / 50;
            return {
                percent: pct,
                glowScale: String(glowScale),
                buttonGlow: String(0.12 + (pct / 100) * 0.68),
                panelGlow: String((pct / 100) * 0.40),
                cardGlowAlpha: String((0.016 * glowScale).toFixed(4))
            };
        })();
    if (typeof window.__kiuApplyTransparencyTokenState === 'function') {
        window.__kiuApplyTransparencyTokenState({
            panelAlpha: transparencyModel.panelAlpha.toFixed(3),
            fillRatio: transparencyModel.fillRatio.toFixed(3),
            colorFadeRatio: transparencyModel.colorFadeRatio.toFixed(3),
            raisedAlpha: transparencyModel.raisedAlpha.toFixed(3),
            glassAlpha: transparencyModel.glassAlpha.toFixed(3),
            panelFillAlpha: transparencyModel.panelFillAlpha.toFixed(3),
            raisedFillAlpha: transparencyModel.raisedFillAlpha.toFixed(3),
            utilityFillAlpha: transparencyModel.utilityFillAlpha.toFixed(3),
            utilityAlpha: transparencyModel.utilityAlpha.toFixed(3),
            topbarFillAlpha: transparencyModel.topbarFillAlpha.toFixed(3),
            topbarRaisedAlpha: transparencyModel.topbarRaisedAlpha.toFixed(3),
            glassHighlightAlpha: transparencyModel.glassHighlightAlpha.toFixed(3)
        }, {
            panelGlow: glowConfig.panelGlow,
            glowScale: glowConfig.glowScale,
            cardGlowAlpha: glowConfig.cardGlowAlpha
        });
    } else {
        const root = document.documentElement;
        root.style.setProperty('--lux-panel-alpha', transparencyModel.panelAlpha.toFixed(3));
        root.style.setProperty('--lux-transparency-alpha', transparencyModel.fillRatio.toFixed(3));
        root.style.setProperty('--lux-color-fade-alpha', transparencyModel.colorFadeRatio.toFixed(3));
        root.style.setProperty('--lux-raised-alpha', transparencyModel.raisedAlpha.toFixed(3));
        root.style.setProperty('--lux-glass-alpha', transparencyModel.glassAlpha.toFixed(3));
        root.style.setProperty('--lux-panel-fill-alpha', transparencyModel.panelFillAlpha.toFixed(3));
        root.style.setProperty('--lux-raised-fill-alpha', transparencyModel.raisedFillAlpha.toFixed(3));
        root.style.setProperty('--lux-utility-fill-alpha', transparencyModel.utilityFillAlpha.toFixed(3));
        root.style.setProperty('--lux-utility-alpha', transparencyModel.utilityAlpha.toFixed(3));
        root.style.setProperty('--lux-topbar-fill-alpha', transparencyModel.topbarFillAlpha.toFixed(3));
        root.style.setProperty('--lux-topbar-raised-alpha', transparencyModel.topbarRaisedAlpha.toFixed(3));
        root.style.setProperty('--lux-glass-highlight-alpha', transparencyModel.glassHighlightAlpha.toFixed(3));
        root.style.setProperty('--lux-panel-glow', glowConfig.panelGlow);
        root.style.setProperty('--lux-glow-scale', glowConfig.glowScale);
        root.style.setProperty('--lux-card-glow-alpha', glowConfig.cardGlowAlpha);
    }

    if (options?.tokensOnly === true) {
        applyLiveTransparencyTokens(transparencyModel, fillRatio, percentage);
        window.__currentTransparency = percentage;
        return;
    }

    const glassBlurQuality = resolveGlassBlurQualityKey();
    const glassBlurMult = resolveGlassBlurQualityMultiplier(glassBlurQuality);
    const blurAmount = (2 + fillRatio * 22) * glassBlurMult;
    const saturateAmount = 100 + (fillRatio * 45);
    const surfaceFillAmount = transparencyModel.panelFillAlpha;
    const structuralClasses = [
        'lux-card-head', 'lux-card-title', 'lux-card-meta', 'lux-builder-copy', 'lux-card-body', 'lux-panel-body',
        'lux-grid-widget-body', 'lux-widget-container', 'lux-inline-meta', 'lux-card-actions', 'lux-page-kicker',
        'lux-person-head',
        'lux-admin-ops-head'
    ];
    const TIMETABLE_GRID_CELL_CLASS_NAMES = [
        'sch-header-row', 'sch-time-col', 'sch-time-labels', 'sch-day-col', 'sch-time-slot', 'sch-body', 'sch-lane',
        'sch-slot-bg', 'sch-event', 'sch-day-lanes',
        'sch-grid-shell'
    ];
    const isTimetableGridCell = (el) => {
        if (!document.body.classList.contains('lux-route-timetable') || !el?.classList) return false;
        if (!el.closest?.('.sch-grid-shell[data-tt-grid="1"]')) return false;
        return TIMETABLE_GRID_CELL_CLASS_NAMES.some((className) => el.classList.contains(className));
    };
    const isTableGridCell = (el, tableSelector) => (
        Boolean(el.closest?.(tableSelector)) &&
        (el.tagName === 'TD' || el.tagName === 'TH' || el.tagName === 'TR')
    );
    const isStructuralSurface = (el) => (
        isTimetableGridCell(el) ||
        structuralClasses.some((className) => el.classList.contains(className)) ||
        (document.body.classList.contains('lux-route-admin-scheduler')
            && (Boolean(el.closest?.('#page-admin-scheduler')) || Boolean(el.closest?.('#schModalOverlay, #schPresetManagerOverlay, #profQuizModalOverlay')))
            && isRouteOwnedSurface(el)) ||
        (document.body.classList.contains('lux-route-admin-scheduler') && (
            el.classList.contains('sch-modal') ||
            el.closest?.('#schModalOverlay, #schPresetManagerOverlay, #profQuizModalOverlay')
        )) ||
        (document.body.classList.contains('lux-route-admin-library') && (
            el.classList.contains('admin-library-modal') ||
            el.classList.contains('admin-library-modal-overlay') ||
            el.classList.contains('admin-library-catalog-row') ||
            el.classList.contains('admin-library-catalog-cell') ||
            el.classList.contains('admin-library-empty-row') ||
            el.classList.contains('admin-library-empty-cell')
        )) ||
        (document.body.classList.contains('lux-route-admin-orders') && (
            isCssOwnedSurface(el) ||
            isTableGridCell(el, '.orders-admin-table')
        )) ||
        (Boolean(el.closest?.('#page-orders, #orders-inbox-root'))
            && !document.body.classList.contains('lux-route-admin-orders')
            && isRouteOwnedSurface(el)) ||
        (document.body.classList.contains('lux-route-faculty-gradebook')
            && Boolean(el.closest?.('.lux-faculty-gradebook-page, #page-faculty-gradebook'))
            && (isCssOwnedSurface(el) || isTableGridCell(el, '#gradebook-table'))) ||
        (document.body.classList.contains('lux-route-timetable') && isCssOwnedSurface(el)) ||
        (document.body.classList.contains('lux-route-registration')
            && Boolean(el.closest?.('#page-registration'))
            && isCssOwnedSurface(el)) ||
        (document.body.classList.contains('lux-route-chancellery')
            && Boolean(el.closest?.('#page-chancellery'))
            && isCssOwnedSurface(el)) ||
        (document.body.classList.contains('lux-route-profile-view') && isCssOwnedSurface(el)) ||
        (document.body.classList.contains('lux-route-profile-view')
            && isTableGridCell(el, '.pv-financial-table'))
    );
    const buildDynamicSurfaceBackground = (el, lightMode, amount) => {

        const isHomeDashboardSurface = Boolean(el.matches?.(
            '#page-home #lux-home-shell .lux-home-grid > .lux-panel, ' +
            '#page-home #lux-home-shell .lux-home-grid > .lux-card, ' +
            '#page-home #lux-home-shell .lux-home-grid > .lux-hero, ' +
            '#page-home #lux-home-shell .lux-grid-widget > .lux-grid-widget-body'
        ));
        if (isHomeDashboardSurface) {
            return buildHomeStyleSurfaceBackground(lightMode, amount);
        }

        if (shouldKeepRouteFadeCssBackground(el)) {
            return '';
        }

        const softChrome = (
            el.classList.contains('lux-status-pill') ||
            el.classList.contains('lux-control') ||
            el.classList.contains('lux-strip-card') ||
            el.classList.contains('lux-subcard') ||
            el.classList.contains('lux-stat-card') ||
            el.classList.contains('lux-pill') ||
            el.classList.contains('lux-picker-btn') ||
            SOCIAL_NEO_SMALL_TRANSPARENCY_SURFACE_CLASSES.some((className) => el.classList.contains(className))
        );
        return buildLuxuryRoutePanelGradient(lightMode, softChrome);
    };

    const isStudyCardGradebookProgressSegment = (el) => (
        document.body.classList.contains('lux-route-study-card') &&
        el.tagName === 'SPAN' &&
        Boolean(el.closest?.(
            '.study-card-assessment-window__body--gradebook .gb-composition-bar, ' +
            '.study-card-assessment-window__body--gradebook .gb-weight-track'
        ))
    );

    const isTimetableLayoutWrapper = (el) => document.body.classList.contains('lux-route-timetable') && (
        el.classList.contains('lux-timetable-controls') ||
        el.classList.contains('schedule-toolbar-host') ||
        el.classList.contains('schedule-toolbar') ||
        el.classList.contains('lux-timetable-view-row') ||
        el.classList.contains('schedule-view-row') ||
        el.classList.contains('lux-timetable-command-grid') ||
        (el.classList.contains('sch-grid-shell') && el.dataset?.ttGrid === '1')
    );

    const blurPx = `${blurAmount}px`;
    const blurTargets = [document.documentElement, document.body].filter(Boolean);
    blurTargets.forEach((target) => {
      target.style.setProperty('--lux-transparency-blur', blurPx);
      target.style.setProperty('--lux-glass-blur', blurPx);
      target.style.setProperty('--lux-glass-blur-quality-mult', String(glassBlurMult));
      target.style.setProperty('--lux-transparency-saturate', `${saturateAmount}%`);
      target.style.setProperty('--lux-transparency-percentage', `${percentage}%`);
    });
    if (document.body) {
      document.body.dataset.luxGlassBlurQuality = glassBlurQuality;
    }
    document.documentElement.style.setProperty('--lux-transparency-percentage', `${percentage}%`);
    const docStyle = document.documentElement.style;
    const transparencySignature = [
        percentage,
        glassBlurQuality,
        document.body.classList.contains('lux-light-mode') ? 'light' : 'dark',
        docStyle.getPropertyValue('--lux-glass-tint-rgb').trim()
            || document.documentElement.dataset.luxGlassTintRgb
            || '',
        docStyle.getPropertyValue('--lux-accent-rgb').trim()
            || document.documentElement.dataset.luxAccentRgb
            || '',
        docStyle.getPropertyValue('--lux-topbar-tint-rgb').trim()
            || document.documentElement.dataset.luxTopbarTintRgb
            || ''
    ].join('|');

    if (
        !forceRefresh
        && !scopedRoots.length
        && window.__luxLastAppliedTransparencySignature === transparencySignature
    ) {
        window.__currentTransparency = percentage;
        return;
    }
    window.__luxLastAppliedTransparencySignature = transparencySignature;

    const allSelectors = TRANSPARENCY_CORE_SELECTORS;

    const surfaceElements = getCachedTransparencySurfaceElements(allSelectors, scopedRoots);

    surfaceElements.forEach(el => {

        if (
            !forceRefresh &&
            fillRatio > 0 &&
            el.dataset.luxTransparencySignature === transparencySignature
        ) {
            return;
        }

        if (!el.isConnected || el.hidden || el.getAttribute('aria-hidden') === 'true' || el.style.display === 'none') return;

        if (
            el.id === 'lux-studio-backdrop' ||
            el.classList.contains('lux-studio-backdrop') ||
            el.classList.contains('lux-studio-panel') ||
            el.closest?.('#lux-studio-backdrop, #lux-bg-mode-params-backdrop')
        ) {
            stripInlineGlassPaint(el, transparencySignature);
            return;
        }
        const isOrdersInboxSurface = Boolean(el.closest?.(
            '#page-orders .orders-inbox-shell, #orders-inbox-root .orders-inbox-shell, #admin-orders-root .orders-inbox-shell'
        ));
        if (isOrdersInboxSurface) {
            stripInlineGlassPaint(el, transparencySignature);
            return;
        }
        if (isTimetableLayoutWrapper(el)) {
            stripInlineGlassPaint(el, transparencySignature);
            return;
        }
        if (isStudyCardGradebookProgressSegment(el)) {
            stripInlineGlassPaint(el, transparencySignature);
            return;
        }
        if (el.closest?.('#kiu-structured-form-modal')) {
            stripInlineGlassPaint(el, transparencySignature);
            return;
        }
        if (el.closest?.('#course-selection-modal-bg')) {
            stripInlineGlassPaint(el, transparencySignature);
            return;
        }
        if (el.closest?.('#schModalOverlay') || el.closest?.('#schPresetManagerOverlay')) {
            stripInlineGlassPaint(el, transparencySignature);
            return;
        }
        if (isLuxTransparencyExemptSubtree(el)) {
            stripInlineGlassPaint(el, transparencySignature);
            return;
        }

        if (el.getAttribute('data-lux-layout-only') === '1') {
            stripInlineGlassPaint(el, transparencySignature);
            return;
        }
        if (
            document.body.classList.contains('lux-page-bare')
            && Boolean(el.closest?.('[data-lux-glass-root="1"]'))
            && el !== el.closest?.('[data-lux-glass-root="1"]')
        ) {
            stripInlineGlassPaint(el, transparencySignature);
            return;
        }

        const isLightMode = document.body.classList.contains('lux-light-mode');

        if (fillRatio > 0) {
            const alpha = fillRatio;
            if (applyStudentsAdminManagedSurface(el, percentage, transparencySignature)) {
                return;
            }
            if (!forceRefresh && el.dataset.luxTransparencySignature === transparencySignature) return;
            if (isStructuralSurface(el)) {
                
                if (percentage >= 99 && document.body.classList.contains('lux-route-registration') && el.closest?.('#page-registration')) {
                    if (shouldPreserveRegistrationCssPaint(el)) {
                        stripInlineGlassPaint(el, transparencySignature);
                        return;
                    }
                    const isFocusPanel = el.classList.contains('lux-timetable-hero-focus') || el.classList.contains('registration-hero-aside');
                    var _solidBg = isFocusPanel
                        ? (isLightMode
                            ? 'var(--lux-panel-surface)'
                            : 'var(--lux-panel-surface)')
                        : (isLightMode
                            ? 'var(--lux-panel-surface-soft)'
                            : 'var(--lux-panel-surface-soft)');
                    el.style.setProperty('background', _solidBg, 'important');
                    el.style.setProperty('backdrop-filter', 'none', 'important');
                    el.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
                    el.dataset.luxTransparencySignature = transparencySignature;
                    return;
                }
                el.style.removeProperty('background-color');
                el.style.removeProperty('background');
                el.style.removeProperty('backdrop-filter');
                el.style.removeProperty('-webkit-backdrop-filter');
                el.dataset.luxTransparencySignature = transparencySignature;
                return;
            }

            if (percentage >= 99 && isCssOwnedSurface(el) && el.closest?.('#page-registration')) {
                if (shouldPreserveRegistrationCssPaint(el)) {
                    stripInlineGlassPaint(el, transparencySignature);
                    return;
                }
                const isFocusPanel = el.classList.contains('lux-timetable-hero-focus') || el.classList.contains('registration-hero-aside');
                var _solidBg2 = isFocusPanel
                    ? (isLightMode
                        ? 'var(--lux-panel-surface)'
                        : 'var(--lux-panel-surface)')
                    : (isLightMode
                        ? 'var(--lux-panel-surface-soft)'
                        : 'var(--lux-panel-surface-soft)');
                el.style.setProperty('background', _solidBg2, 'important');
                el.style.setProperty('backdrop-filter', 'none', 'important');
                el.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
                el.dataset.luxTransparencySignature = transparencySignature;
                return;
            }

            if (el.id === 'lux-shell') {
                stripInlineGlassPaint(el, transparencySignature);
                return;
            }

            const isTopbarSoftChromeSurface = (
                el.id === 'lux-topbar' ||
                el.classList.contains('lux-topbar-shell') ||
                (
                    Boolean(el.closest?.('#lux-topbar')) &&
                    (
                        el.classList.contains('lux-picker-btn') ||
                        el.classList.contains('lux-icon-btn') ||
                        el.classList.contains('lux-user-chip') ||
                        el.classList.contains('lux-sidebar-toggle-btn') ||
                        el.classList.contains('lux-topbar-editor-btn')
                    )
                )
            );

            const isHomeFreeformShell = (
                document.body.classList.contains('lux-route-home') &&
                (
                    el.classList.contains('lux-grid-widget') ||
                    el.classList.contains('lux-grid-widget-body')
                )
            );
            if (
                isHomeFreeformShell ||
                isTopbarSoftChromeSurface ||
                el.classList.contains('lux-soft-chrome') ||
                el.classList.contains('lux-focus-panel') ||
                el.classList.contains('lms-hero-focus') ||
                el.classList.contains('lux-timetable-hero-focus') ||
                el.classList.contains('lux-primary-btn') ||
                el.classList.contains('lux-secondary-btn') ||
                el.classList.contains('lux-ghost-btn') ||
                el.classList.contains('lux-admin-op-btn')
            ) {
                stripInlineGlassPaint(el, transparencySignature);
                return;
            }
            if (shouldKeepRouteFadeCssBackground(el)) {
                stripInlineGlassPaint(el, transparencySignature);
                return;
            }

            const isSocialRouteSurface = document.body.classList.contains('lux-route-social');
            const keepSocialFadeCss = shouldKeepSocialFadeCssBackground(el);
            const keepCssOwnedSurface = isCssOwnedSurface(el);

            const isWrapperInnerPanel = document.body.classList.contains('lux-page-bare')
                && !Boolean(el.closest?.('.lux-page-shell[data-lux-layout-only="1"]'))
                && Boolean(el.closest?.('.lux-page-shell'))
                && !el.classList.contains('lux-page-shell');
            const isHomeLegacyGridInnerPanel = document.body.classList.contains('lux-route-home')
                && Boolean(el.parentElement?.classList?.contains('lux-home-grid'))
                && (el.classList.contains('lux-panel') || el.classList.contains('lux-card') || el.classList.contains('lux-hero'));
            const isHomeWidgetInnerPanel = document.body.classList.contains('lux-route-home')
                && Boolean(el.closest?.('.lux-grid-widget-body'))
                && !el.classList.contains('lux-grid-widget-body');
            const isOffscreenObserved = el.dataset.luxObservedSurface === '1' && el.dataset.luxOffscreen === '1';
            const suppressBlur = isWrapperInnerPanel || isHomeLegacyGridInnerPanel || isHomeWidgetInnerPanel || isOffscreenObserved || (isSocialRouteSurface &&
                shouldApplyDynamicBackground(el) &&
                !isSocialPaintSurface(el) &&
                !isSocialBlurHost(el));
            const backdropValue = (suppressBlur || keepSocialFadeCss || keepCssOwnedSurface)
                ? 'none'
                : `blur(${blurAmount}px) saturate(${saturateAmount}%)`;

            el.style.setProperty('backdrop-filter', backdropValue, 'important');
            el.style.setProperty('-webkit-backdrop-filter', backdropValue, 'important');
            if (!keepSocialFadeCss && !keepCssOwnedSurface && shouldApplyDynamicBackground(el)) {
                const _dynBg = buildDynamicSurfaceBackground(el, isLightMode, surfaceFillAmount);
                if (_dynBg) el.style.setProperty('background', _dynBg, 'important');
            }
            el.dataset.luxTransparencySignature = transparencySignature;
        } else {

            el.style.removeProperty('background-color');
            el.style.removeProperty('background');
            el.style.removeProperty('backdrop-filter');
            el.style.removeProperty('-webkit-backdrop-filter');
            delete el.dataset.luxTransparencySignature;
        }
    });

    window.__currentTransparency = percentage;

    if (surfaceElements.length > 0) {
        document.documentElement.classList.remove('lux-transparency-pending');
    }
}

function isLuxTransparencyExemptSubtree(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;
    if (node.closest && node.closest('[data-lux-transparency-exempt="1"]')) return true;
    if (node.closest && node.closest('#social-neo-overlay-portal')) return true;
    if (node.closest && node.closest('.lms-glass-dialog-overlay, .lms-quiz-board-overlay, .gb-modal-overlay')) return true;
    if (node.closest && node.closest('#lux-studio-backdrop, .lux-studio-panel, #lux-bg-mode-params-backdrop')) return true;
    return false;
}

function setupTransparencyObserver() {
    if (window.__transparencyObserver) return; // Already set up

    const observer = new MutationObserver((mutations) => {
        const transparency = window.__currentTransparency || 0;
        if (transparency === 0) return; // No need to observe if transparency is off

        let needsUpdate = false;
        const pendingRoots = new Set();

        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType !== Node.ELEMENT_NODE) continue;
                if (isLuxTransparencyExemptSubtree(node)) continue;
                if (matchesTransparencyObserver(node)) {
                    needsUpdate = true;
                    pendingRoots.add(node);
                }
            }
        }

        if (needsUpdate && transparency > 0) {
            const rootSig = buildTransparencyRootSignature();
            if (rootSig !== window.__luxTransparencyObserverRootSignature) {
                resetTransparencySurfaceCache();
                window.__luxTransparencyObserverRootSignature = rootSig;
            }
            window.clearTimeout(window.__transparencyRefreshTimer);
            var _debounceMs = window.__luxIsAnimating ? 420 : 220;
            window.__transparencyRefreshTimer = window.setTimeout(() => {
                window.__transparencyRefreshTimer = null;
                const scopedRoots = Array.from(pendingRoots).filter((root) => root && root.isConnected);
                const runTransparencyRefresh = () => {
                    requestAnimationFrame(() => {
                        if (scopedRoots.length) {
                            refreshLuxuryTransparencySurfaces(window.__currentTransparency || transparency, { roots: scopedRoots });
                            return;
                        }
                        updateTransparency(window.__currentTransparency || transparency);
                    });
                };
                if (typeof window.requestIdleCallback === 'function') {
                    window.requestIdleCallback(runTransparencyRefresh, { timeout: 900 });
                } else {
                    runTransparencyRefresh();
                }
            }, _debounceMs);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    window.__transparencyObserver = observer;
}

function setTransparency(mode) {
    if (mode === 'on') {
        updateTransparency(13); // Default to 13%
    } else {
        updateTransparency(0);
    }
}

function refreshLuxuryTransparencySurfaces(value, options = {}) {
    const savedValue = value ?? localStorage.getItem('kiuLuxurySurfaceTransparency') ?? window.__currentTransparency ?? 13;
    const percentage = parseInt(savedValue, 10);
    if (!Number.isFinite(percentage)) return;
    const scopedRoots = normalizeTransparencyRoots(options?.roots);
    if (!scopedRoots.length) {
        resetTransparencySurfaceCache();
    }

    const force = options?.force === true;
    if (force) {
        collectTransparencySurfaceElements(['[data-lux-transparency-signature]'], scopedRoots).forEach((el) => {
            delete el.dataset.luxTransparencySignature;
        });
    }
    updateTransparency(percentage, {
        force,
        persist: false,
        roots: scopedRoots,
        tokensOnly: options?.tokensOnly === true
    });
}

function flushDeferredLuxTransparencyRefresh() {
    const pending = window.__luxDeferredTransparencyRefresh;
    if (!pending) return;
    window.__luxDeferredTransparencyRefresh = null;
    window.clearTimeout(window.__luxDeferredTransparencyFlushTimer);
    window.__luxDeferredTransparencyFlushTimer = null;
    queueLuxuryTransparencyRefresh(pending.value, pending.options);
}

/* Governor-busy deferral is a delay, never a drop: run the parked refresh directly
 * (not via the queue) so a stuck-busy governor cannot swallow a visual change. */
function armDeferredLuxTransparencyFlush() {
    if (window.__luxDeferredTransparencyFlushTimer) return;
    window.__luxDeferredTransparencyFlushTimer = window.setTimeout(() => {
        window.__luxDeferredTransparencyFlushTimer = null;
        const pending = window.__luxDeferredTransparencyRefresh;
        if (!pending) return;
        window.__luxDeferredTransparencyRefresh = null;
        refreshLuxuryTransparencySurfaces(pending.value, pending.options);
    }, DEFERRED_TRANSPARENCY_FLUSH_MS);
}

function queueLuxuryTransparencyRefresh(value, options = {}) {
    if (window.__kiuSuppressLuxTransparencyRefresh) return;
    if (
        typeof window.shouldDeferLuxTransparency === 'function'
        && window.shouldDeferLuxTransparency()
        && options?.force !== true
        && options?.tokensOnly !== true
    ) {
        window.__luxDeferredTransparencyRefresh = { value, options };
        armDeferredLuxTransparencyFlush();
        return;
    }

    if (window.__luxIsScrolling && options?.force !== true) {
        window.__luxPendingScrollTransparencyValue = value;
        window.__luxPendingScrollTransparencyFlush = true;
        return;
    }
    const run = () => {
        if (window.__kiuSuppressLuxTransparencyRefresh) return;
        if (window.__luxIsScrolling && options?.force !== true) {
            window.__luxPendingScrollTransparencyValue = value;
            window.__luxPendingScrollTransparencyFlush = true;
            return;
        }
        refreshLuxuryTransparencySurfaces(value, options);
    };
    if (typeof window.__kiuQueueLuxuryRefreshOperation === 'function') {
        window.__kiuQueueLuxuryRefreshOperation(run);
        return;
    }
    window.clearTimeout(window.__luxTransparencyPaletteRefreshTimer);
    window.__luxTransparencyPaletteRefreshTimer = window.setTimeout(() => {
        window.__luxTransparencyPaletteRefreshTimer = null;
        if (typeof window.requestAnimationFrame === 'function') {
            window.requestAnimationFrame(run);
        } else {
            run();
        }
    }, 0);
}

function flushLuxuryTransparencyAfterScroll() {
    if (window.__luxIsScrolling) return;
    if (!window.__luxPendingScrollTransparencyFlush) return;
    window.__luxPendingScrollTransparencyFlush = false;
    const pendingRoots = window.__luxPendingScrollTransparencyRoots;
    window.__luxPendingScrollTransparencyRoots = null;
    const value = window.__luxPendingScrollTransparencyValue ?? window.__currentTransparency ?? 13;
    const options = pendingRoots?.length
        ? { roots: pendingRoots, force: false, persist: false }
        : { force: false, persist: false };
    queueLuxuryTransparencyRefresh(value, options);
}

function scheduleLuxuryTransparencyBootRefresh(value) {

    if (window.__luxTransparencyBootRefreshScheduled) {
        window.__luxTransparencyBootRefreshValue = value;
        return;
    }
    window.__luxTransparencyBootRefreshScheduled = true;
    window.__luxTransparencyBootRefreshValue = value;
    const refresh = () => queueLuxuryTransparencyRefresh(
        window.__luxTransparencyBootRefreshValue ?? value,
        { persist: false }
    );
    refresh();
    window.clearTimeout(window.__luxTransparencyBootRefreshTimer);
    window.__luxTransparencyBootRefreshTimer = window.setTimeout(() => {
        window.__luxTransparencyBootRefreshTimer = null;
        refresh();
    }, 240);
}

function syncLuxuryOffscreenBackdrop(el) {
    if (!el?.dataset || el.dataset.luxObservedSurface !== '1') return;
    if (el.dataset.luxOffscreen === '1') {

        el.style.setProperty('backdrop-filter', 'none', 'important');
        el.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
        return;
    }

    if (window.__luxIsScrolling) {
        window.__luxPendingScrollTransparencyFlush = true;
        if (!window.__luxPendingScrollTransparencyRoots) {
            window.__luxPendingScrollTransparencyRoots = [];
        }
        if (!window.__luxPendingScrollTransparencyRoots.includes(el)) {
            window.__luxPendingScrollTransparencyRoots.push(el);
        }
        return;
    }
    delete el.dataset.luxTransparencySignature;
    queueLuxuryTransparencyRefresh(window.__currentTransparency ?? 13, { roots: [el], force: false });
}

if (typeof window.onLuxGovernorStateChange === 'function') {
    window.onLuxGovernorStateChange((busy) => {
        if (!busy) flushDeferredLuxTransparencyRefresh();
    });
}

window.updateTransparency = updateTransparency;
window.refreshLuxuryTransparencySurfaces = refreshLuxuryTransparencySurfaces;
window.queueLuxuryTransparencyRefresh = queueLuxuryTransparencyRefresh;
window.flushLuxuryTransparencyAfterScroll = flushLuxuryTransparencyAfterScroll;
window.syncLuxuryOffscreenBackdrop = syncLuxuryOffscreenBackdrop;
window.scheduleLuxuryTransparencyBootRefresh = scheduleLuxuryTransparencyBootRefresh;
window.buildLuxuryTransparencyModel = buildLuxuryTransparencyModel;
window.mapLuxuryTransparencyFillRatio = mapLuxuryTransparencyFillRatio;
window.clampLuxuryTransparencyPercentage = clampLuxuryTransparencyPercentage;

(function bootLuxTransparencyIfNeeded() {
    try {
        if (typeof setupTransparencyObserver === 'function') setupTransparencyObserver();
        const saved = localStorage.getItem('kiuLuxurySurfaceTransparency');
        const pct = parseInt(saved || window.__currentTransparency || '13', 10);
        if (pct > 0 && typeof scheduleLuxuryTransparencyBootRefresh === 'function') {
            scheduleLuxuryTransparencyBootRefresh(pct);
        }
    } catch (e) {  }
})();
