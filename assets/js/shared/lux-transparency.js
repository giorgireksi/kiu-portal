/* READABILITY: Luxury transparency / glass engine — route surfaces, tokens, chrome coupling.
 * Sections: Boot | Tokens | Surfaces | Route | Apply
 * See docs/human-maintainability.md (H2). */
// --- READABILITY: Boot ---
/* Luxury surface transparency engine (peeled from utilities.js).
// --- READABILITY: Apply ---
 * Load immediately after assets/js/shared/utilities.js on every page that uses utilities.
 */
/**
// --- READABILITY: Surfaces ---
 * Update and apply panel transparency based on slider value
 * @param {string|number} value - Opacity percentage (0-100)
 */
const LUX_MODERN_TRANSPARENCY_SURFACE_SELECTORS = [
    '.lux-modern-surface',
    '.lux-modern-table'
];

const SOCIAL_NEO_TRANSPARENCY_SURFACE_SELECTORS = [
    '.social-neo-card',
    '.social-neo-alert',
    '.social-neo-topbar-card',
    '.social-neo-sidebar-card',
    '.social-neo-post-card',
    '.social-neo-composer-card',
    '.social-neo-filter-card',
    '.social-neo-story-card',
    '.social-neo-community-panel',
    '.social-neo-chat-item',
    '.social-neo-directory-item',
    '.social-neo-entity-card',
    '.social-neo-event-card',
    '.social-neo-message',
    '.social-neo-empty',
    '.social-neo-empty-hero',
    '.social-neo-flash',
    '.social-neo-comment-bubble',
    '.social-neo-time-group',
    '.social-neo-stat-grid > div',
    '.social-neo-section-command',
    '.social-neo-section-metric',
    '.social-neo-section-task',
    '.social-neo-events-hero',
    '.social-neo-events-hero-stat',
    '.social-neo-events-lane',
    '.social-neo-events-banner',
    '.social-neo-events-list-card',
    '.social-neo-events-create-card',
    '.social-neo-events-manage-card',
    '.social-neo-events-manage-item',
    '.social-neo-events-support-card',
    '.social-neo-event-date-group',
    '.social-neo-event-feature',
    '.social-neo-event-feature-meta-item',
    '.social-neo-group-card',
    '.social-neo-group-create-block',
    '.social-neo-group-create-picker',
    '.social-neo-group-member-row',
    '.social-neo-group-thread-panel',
    '.social-neo-group-thread-section',
    '.social-neo-pages-hero',
    '.social-neo-pages-wizard',
    '.social-neo-pages-wizard-step',
    '.social-neo-page-card',
    '.social-neo-page-card-rich',
    '.social-neo-page-card-support',
    '.social-neo-page-compose-block',
    '.social-neo-page-profile',
    '.social-neo-page-about-card',
    '.social-neo-thread-head',
    '.social-neo-thread-compose',
    '.social-neo-thread-messages',
    '.social-neo-thread-group-hero',
    '.social-neo-call-card',
    '.social-neo-call-stage',
    '.social-neo-call-video',
    '.social-neo-dialog-card',
    '.social-neo-dialog-card--project-create',
    '.social-neo-dialog-preview',
    '.social-neo-toast',
    '.social-neo-mobile-tabbar',
    '.social-neo-mobile-tab',
    '.social-neo-shell-drawer',
    '.social-neo-shell-drawer-profile',
    '.social-neo-shell-drawer-nav-card',
    '.social-projects-hero',
    '.social-projects-hero-rich',
    '.social-project-create-card',
    '.social-project-card',
    '.social-project-metric-card',
    '.social-project-detail-hero',
    '.social-project-detail-hero-rich',
    '.social-project-tab-shell',
    '.social-project-inline-panel',
    '.social-project-chart-card',
    '.social-project-rich-panel',
    '.social-project-deliverable-card',
    '.social-project-checkin-card',
    '.social-project-meeting-card',
    '.social-project-mini-card',
    '.social-project-ring-card',
    '.social-project-activity-item',
    '.social-project-milestone-item',
    '.social-project-task-column',
    '.social-project-task-card',
    '.social-project-team-card',
    '.social-portfolio-hero',
    '.social-portfolio-toolbar',
    '.social-portfolio-card',
    '.social-portfolio-mini-card',
    '.social-portfolio-stat-tile',
    '.social-portfolio-compose-shell',
    '.social-portfolio-compose-preview-card',
    '.social-portfolio-audience-panel',
    '.social-portfolio-link'
];
const SOCIAL_NEO_TRANSPARENCY_SURFACE_CLASSES = SOCIAL_NEO_TRANSPARENCY_SURFACE_SELECTORS
    .filter((selector) => selector.charAt(0) === '.' && !/[ >:+~#\[]/.test(selector))
    .map((selector) => selector.slice(1));
const SOCIAL_NEO_SMALL_TRANSPARENCY_SURFACE_CLASSES = [
    'social-neo-chat-item',
    'social-neo-directory-item',
    'social-neo-entity-card',
    'social-neo-event-card',
    'social-neo-message',
    'social-neo-comment-bubble',
    'social-neo-time-group',
    'social-neo-section-metric',
    'social-neo-section-task',
    'social-neo-events-hero-stat',
    'social-neo-events-manage-item',
    'social-neo-event-date-group',
    'social-neo-event-feature-meta-item',
    'social-neo-group-member-row',
    'social-neo-pages-wizard-step',
    'social-neo-page-card',
    'social-project-metric-card',
    'social-project-mini-card',
    'social-project-activity-item',
    'social-project-milestone-item',
    'social-project-task-card',
    'social-project-team-card',
    'social-portfolio-mini-card',
    'social-portfolio-stat-tile',
    'social-portfolio-link'
];

const STAFF_ROUTE_TRANSPARENCY_SURFACE_SELECTORS = [
    '.staff-hub-hero',
    '.staff-hub-command-panel',
    '.staff-hub-command-card',
    '.staff-hub-focus-card',
    '.staff-hub-mini-card',
    '.staff-hub-metric-card',
    '.staff-hub-controls',
    '.staff-hub-directory-panel',
    '.staff-hub-profile',
    '.staff-hub-info-card',
    '.staff-hub-warning',
    '.staff-hub-modal',
    '.staff-hub-list-item'
];

const STUDENTS_ADMIN_ROUTE_TRANSPARENCY_SURFACE_SELECTORS = [
    '.students-hub-hero',
    '.students-hub-profile',
    '.students-hub-profile-header',
    '.students-hub-info-card',
    '.students-hub-controls',
    '.students-hub-directory-panel',
    '.students-hub-list-item',
    '.students-hub-modal',
    '.students-hub-warning'
];

const SOCIAL_BLUR_HOST_CLASSES = new Set([
    'social-neo-card',
    'social-neo-post-card',
    'social-neo-topbar-card',
    'social-neo-community-panel',
    'social-neo-group-card',
    'social-neo-group-thread-panel',
    'social-neo-page-card-rich',
    'social-neo-events-lane',
    'social-neo-events-support-card',
    'social-neo-event-feature',
    'social-neo-dialog-card',
    'social-neo-shell-drawer',
    'social-neo-story-composer-card',
    'social-neo-call-card',
    'social-neo-empty',
    'social-project-detail-hero-rich',
    'social-project-tab-shell',
    'social-project-rich-panel',
    'social-project-card',
    'social-portfolio-card'
]);

const isSocialBlurHost = window.isSocialBlurHost;
const isSocialPaintSurface = window.isSocialPaintSurface;
const shouldKeepSocialFadeCssBackground = window.shouldKeepSocialFadeCssBackground;
const shouldKeepAdminLibraryFadeCssBackground = window.shouldKeepAdminLibraryFadeCssBackground;
const shouldKeepLibraryFadeCssBackground = window.shouldKeepLibraryFadeCssBackground;
const shouldKeepExamsFadeCssBackground = window.shouldKeepExamsFadeCssBackground;
const shouldKeepAdminToolsFadeCssBackground = window.shouldKeepAdminToolsFadeCssBackground;
const shouldKeepAdminOrdersFadeCssBackground = window.shouldKeepAdminOrdersFadeCssBackground;
const shouldKeepSchedulerFadeCssBackground = window.shouldKeepSchedulerFadeCssBackground;
const shouldKeepFacultyGradebookFadeCssBackground = window.shouldKeepFacultyGradebookFadeCssBackground;
const shouldKeepTimetableFadeCssBackground = window.shouldKeepTimetableFadeCssBackground;
const shouldKeepExamPortalFadeCssBackground = window.shouldKeepExamPortalFadeCssBackground;
const shouldKeepProfileViewFadeCssBackground = window.shouldKeepProfileViewFadeCssBackground;
// --- READABILITY: Route ---
const shouldKeepRouteFadeCssBackground = window.shouldKeepRouteFadeCssBackground;
const shouldKeepPersonalDataFadeCssBackground = window.shouldKeepPersonalDataFadeCssBackground;
const shouldKeepRegistrationFadeCssBackground = window.shouldKeepRegistrationFadeCssBackground;
const shouldKeepNewsFadeCssBackground = window.shouldKeepNewsFadeCssBackground;
const shouldKeepLmsFadeCssBackground = window.shouldKeepLmsFadeCssBackground;
const shouldKeepStaffFadeCssBackground = window.shouldKeepStaffFadeCssBackground;
const shouldKeepStudentsAdminFadeCssBackground = window.shouldKeepStudentsAdminFadeCssBackground;
const stripInlineGlassPaint = window.stripInlineGlassPaint;
const shouldKeepStudyCardFadeCssBackground = window.shouldKeepStudyCardFadeCssBackground;
const shouldKeepProgramsFadeCssBackground = window.shouldKeepProgramsFadeCssBackground;
const shouldKeepChancelleryFadeCssBackground = window.shouldKeepChancelleryFadeCssBackground;
const shouldKeepStudentServiceFadeCssBackground = window.shouldKeepStudentServiceFadeCssBackground;
const shouldKeepOrdersFadeCssBackground = window.shouldKeepOrdersFadeCssBackground;
const buildHomeStyleSurfaceBackground = window.buildHomeStyleSurfaceBackground;
const buildLuxuryRoutePanelGradient = window.buildLuxuryRoutePanelGradient;

const SHARED_TRANSPARENCY_OBSERVER_SELECTORS = [
    '.lux-card', '.lux-panel', '.lux-person-card', '.lux-subcard',
    '.lux-hero', '.lux-stack', '.lux-dashboard-section',
    '.lux-grid-widget', '.lux-home-card', '.lux-admin-ops-card',
    '.lux-builder-card', '.lux-builder-section', '.surface-card',
    '.content-box', '.kiu-card', '.page-card', '.section-card',
    '.panel-card', '.dashboard-card', '.tabs-container',
    '.modal-content', '.page-hero', '.lux-person-head',
    '.lux-inline-meta', '.lux-card-actions', '.lux-card-head',
    '.lux-card-body', '.lux-panel-body',
    '.lux-page-shell', '.lux-stat-card', '.lux-stat',
    '.lux-page-kicker', '.lux-status-pill', '.lux-control',
    '.lux-faculty-command', '.lux-faculty-command-deck', '.lux-faculty-command-head', '.lux-faculty-command-grid',
    '.lux-faculty-insight', '.lux-faculty-insight-grid', '.lux-faculty-insight-label',
    '.lux-faculty-insight-value', '.lux-faculty-insight-list',
    '.lux-faculty-stage', '.lux-faculty-stage-head', '.lux-faculty-hero-focus',
    '.lux-faculty-hero-main', '.lux-faculty-hero-top', '.lux-faculty-filters',
    '.lux-faculty-controls', '.lux-faculty-controls-row', '.lux-faculty-overview-row',
    '.lux-faculty-filter-title',
    '.lux-fg-control-band', '.lux-fg-filters', '.lux-fg-ops-panel', '.lux-fg-ops-grid',
    '.lux-fg-ops-tile', '.lux-fg-workspace', '.lux-fg-action-band', '.lux-fg-toolbar',
    '.schedule-chip', '.schedule-view-switcher', '.schedule-week-arrow',
    '.schedule-toolbar-host', '.schedule-toolbar', '.schedule-week-nav',
    '.schedule-overview-row', '.schedule-view-row',
    '.lms-clean-stat', '.lms-clean-signal-panel', '.lms-clean-mini',
    '.lms-clean-metric-card', '.lms-clean-subject-card',
    ...LUX_MODERN_TRANSPARENCY_SURFACE_SELECTORS,
    ...SOCIAL_NEO_TRANSPARENCY_SURFACE_SELECTORS
];
const SHARED_TRANSPARENCY_OBSERVER_SELECTOR = SHARED_TRANSPARENCY_OBSERVER_SELECTORS.join(', ');
const INDEX_TRANSPARENCY_GLOBAL_ROOT_SELECTORS = [
    '#lux-shell',
    '#lux-topbar',
    '#mobile-bottom-nav',
    '#mobile-action-sheet',
    '#modal-overlay',
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
        return Array.from(elements);
    }

    if (!document.querySelector('.page-section')) {
        return Array.from(document.querySelectorAll(selector));
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
        return Array.from(document.querySelectorAll(selector));
    }

    const elements = new Set();
    roots.forEach((root) => {
        if (!root || typeof root.querySelectorAll !== 'function') return;
        if (typeof root.matches === 'function' && root.matches(selector)) {
            elements.add(root);
        }
        root.querySelectorAll(selector).forEach((el) => elements.add(el));
    });

    return Array.from(elements);
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
    '.lux-card-head',
    '.lux-card-title',
    '.lux-card-meta',
    '.lux-builder-copy',
    '.lux-card-body',
    '.lux-panel-body',
    '.lux-grid-widget-body',
    '.lux-widget-container',
    '.lux-inline-meta',
    '.lux-card-actions',
    '.lux-page-kicker',
    '.lux-person-head',
    '.lux-admin-ops-head',
    '[class*="-head"]',
    '[class*="-meta"]',
    '[class*="-title"]',
    '[class*="-copy"]',
    '[class*="-label"]',
    '[class*="-kicker"]'
];

const HIGH_TRANSPARENCY_SURFACE_SELECTORS = [
    '.lux-card',
    '.lux-panel',
    '.lux-subcard',
    '.lux-hero',
    '.lux-stat',
    '.lux-stat-card',
    '.lux-home-card',
    '.lux-grid-widget',
    '.lux-admin-ops-card',
    '.lux-builder-card',
    '.lux-builder-section',
    '.lux-dashboard-section',
    '.lux-page-shell',
    '.surface-card',
    '.content-box',
    '.kiu-card',
    '.page-card',
    '.section-card',
    '.panel-card',
    '.dashboard-card',
    '.tabs-container',
    '.modal-content',
    '.page-hero',
    '.lux-modern-surface',
    '.lux-modern-table',
    '.lux-utility-panel',
    '.lux-person-card',
    '.lux-stack',
    /* registration soft shells: owned by registration-route.css (skip high-trans flat wash) */
    '#page-admin-scheduler .sch-rail-hero',
    '#page-admin-scheduler .sch-rail-section',
    '#page-admin-scheduler .sch-grid-shell',
    '#page-admin-scheduler .sch-modal',
    '#page-admin-scheduler .palette-card',
    '#page-admin-scheduler .sch-stat-card',
    '#page-admin-scheduler .sch-grid-tag',
    '#page-admin-scheduler .sch-legend-pill',
    '#page-admin-scheduler .sch-empty-state',
    '#page-admin-scheduler .sch-grid-empty',
    '.lms-clean-stat',
    '.lms-clean-signal-panel',
    '.lms-clean-mini',
    '.lms-clean-metric-card',
    '.lms-clean-subject-card',
    '.lms-clean-empty',
    '.lms-banner',
    '.lux-lms-group-card',
    '.lms-route-panel',
        '.lms-route-hero',
    '.lms-clean-hero',
        '.portal-msg-page-top',
    '.portal-msg-panel',
    '.portal-msg-group-modal',
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
    if (fromBody === 'high' || fromBody === 'balanced' || fromBody === 'performance') return fromBody;
    if (typeof window.getGlassBlurQuality === 'function') {
        const fromApi = String(window.getGlassBlurQuality() || '').trim().toLowerCase();
        if (fromApi === 'high' || fromApi === 'balanced' || fromApi === 'performance') return fromApi;
    }
    try {
        const stored = String(localStorage.getItem('kiuLuxuryGlassBlurQuality') || '').trim().toLowerCase();
        if (stored === 'high' || stored === 'balanced' || stored === 'performance') return stored;
    } catch (_error) { /* ignore */ }
    return 'high';
}

function resolveGlassBlurQualityMultiplier(qualityKey = resolveGlassBlurQualityKey()) {
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

function updateTransparency(value, options = {}) {
    const scopedRoots = normalizeTransparencyRoots(options?.roots);
    const percentage = clampLuxuryTransparencyPercentage(value);
    const forceRefresh = options?.force === true;

    // Update display
    const display = document.getElementById('transparency-display') || document.getElementById('lux-transparency-value');
    if (display) {
        display.textContent = `${percentage}%`;
    }

    // Update slider if exists
    const slider = document.getElementById('transparency-slider') || document.getElementById('lux-transparency-slider');
    if (slider) {
        slider.value = percentage;
    }

    const isLightTheme = document.documentElement.dataset.luxThemeMode === 'light';
    const fillRatio = mapLuxuryTransparencyFillRatio(percentage);
    const transparencyModel = buildLuxuryTransparencyModel(percentage, isLightTheme);

    if (options?.persist !== false && typeof window.setDashboardVisuals === 'function') {
        try {
            window.setDashboardVisuals({ surfaceTransparency: String(percentage) });
        } catch (error) {}
    }


    if (typeof window.__kiuApplyTransparencyPreferenceState === 'function') {
        window.__kiuApplyTransparencyPreferenceState(percentage, transparencyModel.transparencyRatio);
    } else {
        // Store in localStorage
        localStorage.setItem('kiuLuxurySurfaceTransparency', percentage.toString());
        localStorage.setItem('kiuLuxurySurfaceTransparencyValue', transparencyModel.transparencyRatio.toFixed(2));

        // Sync CSS data attribute for CSS-only high-opacity overrides
        document.documentElement.dataset.luxTransparency = percentage.toString();
    }

    document.documentElement.classList.toggle('lux-fully-opaque', percentage >= 99);

    // CSS-ONLY FIX: Toggle lux-high-transparency class and injected primer CSS.
    // At >= 80%, CSS rules suppress accent radial gradients on ALL surfaces.
    if (transparencyModel.highTransparency) {
        // Update or create the primer style with current panel alpha
        var _isLight = isLightTheme;
        var _panelA = transparencyModel.panelAlpha;
        var _pa = _panelA.toFixed(3);
        var _darkBg = 'var(--lux-panel-ht-surface)';
        var _lightBg = 'var(--lux-panel-ht-surface)';
        var _bg = _isLight ? _lightBg : _darkBg;
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
            _bodyBg = 'var(--lux-static-colored-page-haze)';
        }
        var _sidebarBg = _isLight
            ? 'linear-gradient(180deg,rgba(248,244,237,' + _pa + '),rgba(242,237,228,' + _pa + '))'
            : 'linear-gradient(180deg,rgba(10,14,22,' + _pa + '),rgba(6,9,15,' + _pa + '))';

        var highTransparencyCss =
            'html.lux-high-transparency.lux-high-transparency.lux-high-transparency{--lux-hero-glow:0!important;--lux-glow-scale:0!important;--lux-card-glow-alpha:0!important;--lux-panel-glow:0!important}' +
            buildHighTransparencySurfaceCss(_bodySelector, _bg) +
            buildStudentsAdminHighTransparencyCss(_bodySelector, _isLight, _panelA) +
            buildHighTransparencyTextResetCss(_bodySelector) +
            'html.lux-high-transparency.lux-high-transparency.lux-high-transparency ' + _bodySelector + '::before{background:' + _bodyBg + '!important}' +
            'html.lux-high-transparency.lux-high-transparency.lux-high-transparency ' + _bodySelector + ' .lux-sidebar{background:' + _sidebarBg + '!important}';
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

// --- READABILITY: Tokens ---
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
    }


    // Calculate effects (remapped fill ratio: slider 0% = former 1% behavior)
    // Floor keeps Glass Blur High/Balanced/Performance steps readable at low opacity.
    const glassBlurQuality = resolveGlassBlurQualityKey();
    const glassBlurMult = resolveGlassBlurQualityMultiplier(glassBlurQuality);
    const blurAmount = (2 + fillRatio * 22) * glassBlurMult;
    const saturateAmount = 100 + (fillRatio * 45);
    const surfaceFillAmount = transparencyModel.panelFillAlpha;
    const registrationGlassSelectors = [
        '.registration-hero', '.registration-workspace', '.registration-insight-card',
        '.registration-focus-card', '.registration-state-card',
        '.registration-module-list-card', '.registration-module-pane-card',
        '.registration-track-card', '.registration-footer-bar',
        '.registration-mini-metric', '.registration-course-row',
        '.registration-module-choice', '.registration-track-group'
    ];
    const registrationGlassClasses = [
        'registration-hero', 'registration-workspace', 'registration-insight-card',
        'registration-focus-card', 'registration-state-card',
        'registration-module-list-card', 'registration-module-pane-card',
        'registration-track-card', 'registration-footer-bar',
        'registration-mini-metric', 'registration-course-row',
        'registration-module-choice', 'registration-track-group'
    ];
    const schedulerGlassSelectors = [
        '#page-admin-scheduler .sch-rail-hero', '#page-admin-scheduler .sch-rail-section',
        '#page-admin-scheduler .sch-grid-shell', '#page-admin-scheduler .sch-modal',
        '#page-admin-scheduler .palette-card', '#page-admin-scheduler .sch-stat-card',
        '#page-admin-scheduler .sch-grid-tag', '#page-admin-scheduler .sch-legend-pill',
        '#page-admin-scheduler .sch-action-btn', '#page-admin-scheduler .sch-week-arrow',
        '#page-admin-scheduler .sch-empty-state', '#page-admin-scheduler .sch-grid-empty',
        '#page-admin-scheduler .lux-strip-card',
        '#page-admin-scheduler .sch-control-group select',
        '#page-admin-scheduler .sch-board-toolbar-row select',
        '#page-admin-scheduler .sch-search-shell input',
        '#page-admin-scheduler .sch-modal input',
        '#page-admin-scheduler .sch-modal select'
    ];
    const schedulerGlassClasses = [
        'sch-rail-hero', 'sch-rail-section',
        'sch-grid-shell', 'sch-modal',
        'palette-card', 'sch-stat-card', 'sch-grid-tag', 'sch-legend-pill',
        'sch-action-btn', 'sch-week-arrow',
        'sch-empty-state', 'sch-grid-empty', 'lux-strip-card'
    ];
    const lmsGlassSelectors = [
        '.lms-clean-stat', '.lms-clean-signal-panel', '.lms-clean-mini',
        '.lms-clean-metric-card', '.lms-clean-subject-card',
        '.lms-clean-action-secondary', '.lms-clean-signal-pill',
        '.lms-clean-empty', '.lms-banner', '.lux-lms-group-card',
        '#lms-content-area .lms-quiz-builder .lms-quiz-studio-hero',
        '#lms-content-area .lms-quiz-builder .lms-quiz-studio-main-card',
        '#lms-content-area .lms-quiz-builder .lms-quiz-tool-panel',
        '#lms-content-area .lms-quiz-builder .lms-quiz-saved-card',
        '#lms-content-area .lms-quiz-builder .lms-quiz-studio-stat-card',
        '#lms-content-area .lms-quiz-builder .lms-quiz-rules-card',
        '#lms-content-area .lms-quiz-builder .lms-quiz-question-nav-card',
        '#lms-content-area .lms-quiz-builder .lms-quiz-question-editor-card'
    ];
    const lmsGlassClasses = [
        'lms-clean-stat', 'lms-clean-signal-panel', 'lms-clean-mini',
        'lms-clean-metric-card', 'lms-clean-subject-card',
        'lms-clean-action-secondary', 'lms-clean-signal-pill',
        'lms-clean-empty', 'lms-banner', 'lux-lms-group-card'
    ];
    const lmsQuizBuilderGlassClasses = [
        'lms-quiz-studio-hero', 'lms-quiz-studio-main-card', 'lms-quiz-tool-panel',
        'lms-quiz-saved-card', 'lms-quiz-studio-stat-card', 'lms-quiz-rules-card',
        'lms-quiz-question-nav-card', 'lms-quiz-question-editor-card',
        'lms-quiz-variant-question-card', 'lms-quiz-variant-workspace', 'lms-quiz-card',
        'lms-live-monitor-card', 'lms-quiz-board-empty', 'lms-quiz-card-empty',
        'lms-quiz-empty-state', 'lms-quiz-policy-card'
    ];
    const isLmsRoute = document.body.classList.contains('lux-route-lms');
    const structuralClasses = [
        'lux-card-head',
        'lux-card-title',
        'lux-card-meta',
        'lux-builder-copy',
        'lux-card-body',
        'lux-panel-body',
        'lux-grid-widget-body',
        'lux-widget-container',
        'lux-inline-meta',
        'lux-card-actions',
        'lux-page-kicker',
        'lux-person-head',
        'lux-admin-ops-head'
    ];
    const TIMETABLE_GRID_CELL_CLASS_NAMES = [
        'sch-header-row',
        'sch-time-col',
        'sch-time-labels',
        'sch-day-col',
        'sch-time-slot',
        'sch-body',
        'sch-lane',
        'sch-slot-bg',
        'sch-event',
        'sch-day-lanes',
        'schedule-grid-shell'
    ];
    const isTimetableGridCell = (el) => {
        if (!document.body.classList.contains('lux-route-timetable') || !el?.classList) return false;
        if (!el.closest?.('.lux-timetable-grid-shell, .schedule-grid-shell[data-tt-grid="1"]')) return false;
        return TIMETABLE_GRID_CELL_CLASS_NAMES.some((className) => el.classList.contains(className));
    };
    const isStructuralSurface = (el) => (
        isTimetableGridCell(el) ||
        structuralClasses.some((className) => el.classList.contains(className)) ||
        (document.body.classList.contains('lux-route-admin-scheduler') && (
            el.classList.contains('sch-sidebar') ||
            el.classList.contains('sch-main') ||
            el.classList.contains('sch-grid-root') ||
            el.classList.contains('sch-header-row') ||
            el.classList.contains('sch-time-col') ||
            el.classList.contains('sch-day-col') ||
            el.classList.contains('sch-time-labels') ||
            el.classList.contains('sch-time-slot') ||
            el.classList.contains('sch-body') ||
            el.classList.contains('sch-lane') ||
            el.classList.contains('sch-slot-bg') ||
            el.classList.contains('sch-event') ||
            el.classList.contains('sch-day-lanes')
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
            // Keep only true layout/structural chrome transparent; panels, cards,
            // controls and the studio modal are painted as glass by the engine
            // so they match the admin-tools recipe exactly.
            el.classList.contains('admin-orders-studio-header') ||
            el.classList.contains('admin-orders-studio-body') ||
            el.classList.contains('admin-orders-studio-close') ||
            el.classList.contains('orders-admin-shell') ||
            el.classList.contains('orders-admin-table__delete') ||
            (Boolean(el.closest?.('.orders-admin-table')) && (
                el.tagName === 'TR' ||
                el.tagName === 'TH' ||
                el.tagName === 'TD'
            ))
        )) ||
        (Boolean(el.closest?.('#page-orders, #orders-inbox-root')) &&
            !document.body.classList.contains('lux-route-admin-orders') && (
            el.classList.contains('orders-inbox-shell') ||
            el.classList.contains('orders-inbox-hero') ||
            el.classList.contains('orders-list-card') ||
            el.classList.contains('orders-detail-card') ||
            el.classList.contains('orders-inbox-hero-side') ||
            el.classList.contains('lux-hero-signal') ||
            el.classList.contains('lux-hero-side-head') ||
            el.classList.contains('orders-list-wrap') ||
            el.classList.contains('orders-status-filter') ||
            el.classList.contains('orders-item') ||
            el.classList.contains('orders-metric-card') ||
            el.classList.contains('orders-attachment-card') ||
            el.classList.contains('orders-recipient-card') ||
            el.classList.contains('orders-detail-panel') ||
            el.classList.contains('orders-detail-empty') ||
            el.classList.contains('lux-control') ||
            el.classList.contains('lux-status-pill')
        )) ||
        (document.body.classList.contains('lux-route-faculty-gradebook') && (
            Boolean(el.closest?.('.lux-faculty-gradebook-page')) && (
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
                [...el.classList].some((className) => className.startsWith('lux-fg-'))
            )
        )) ||
        (document.body.classList.contains('lux-route-faculty-gradebook') && (
            [...el.classList].some((className) => className.startsWith('gb-')) ||
            (Boolean(el.closest?.('#gradebook-table')) && (
                el.tagName === 'TD' || el.tagName === 'TH' || el.tagName === 'TR'
            ))
        )) ||
        (document.body.classList.contains('lux-route-timetable') && (
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
            el.classList.contains('lux-status-pill')
        )) ||
        /* Registration: same structural strip path as timetable (CSS --tt-fade-surface-soft owns fill) */
        (document.body.classList.contains('lux-route-registration') && (
            el.classList.contains('lux-timetable-hero') ||
            el.classList.contains('lux-timetable-command') ||
            el.classList.contains('lux-timetable-stage') ||
            el.classList.contains('lux-timetable-hero-focus') ||
            el.classList.contains('lux-timetable-filters') ||
            el.classList.contains('registration-hero-shell') ||
            el.classList.contains('registration-hero-aside') ||
            el.classList.contains('registration-insight-card') ||
            el.classList.contains('registration-workspace') ||
            el.classList.contains('registration-term-shell') ||
            el.classList.contains('registration-footer-bar') ||
            el.classList.contains('registration-progress-shell') ||
            el.classList.contains('registration-module-list-card') ||
            el.classList.contains('registration-module-pane-card') ||
            el.classList.contains('registration-state-card') ||
            el.classList.contains('registration-track-card') ||
            el.classList.contains('registration-course-row') ||
            el.classList.contains('registration-module-choice') ||
            el.classList.contains('registration-shell-empty') ||
            el.classList.contains('filter-shell') ||
            el.classList.contains('lux-card') ||
            el.classList.contains('lux-status-pill') ||
            el.classList.contains('lux-pill')
        )) ||
        (document.body.classList.contains('lux-route-chancellery') && Boolean(el.closest?.('#page-chancellery')) && (
            el.classList.contains('page-hero') ||
            el.classList.contains('lux-chancellery-hero') ||
            el.classList.contains('lux-chancellery-hero-card') ||
            el.classList.contains('lux-chancellery-command-bar') ||
            el.classList.contains('filter-shell') ||
            el.classList.contains('lux-chancellery-focus-card') ||
            el.classList.contains('lux-chancellery-snapshot-card') ||
            el.classList.contains('lux-chancellery-subcard') ||
            el.classList.contains('lux-chancellery-queue-item') ||
            el.classList.contains('lux-chancellery-thread-entry') ||
            el.classList.contains('lux-chancellery-focus-row') ||
            el.classList.contains('lux-chancellery-main-panel') ||
            el.classList.contains('lux-card') ||
            el.classList.contains('lux-subcard') ||
            el.classList.contains('lux-stat-card') ||
            el.classList.contains('lux-queue-item') ||
            el.classList.contains('lux-thread-entry') ||
            el.classList.contains('lux-control') ||
            el.classList.contains('lux-chancellery-control') ||
            el.classList.contains('lux-status-pill') ||
            el.classList.contains('lux-strip-card') ||
            el.classList.contains('surface-card') ||
            el.classList.contains('content-box')
        )) ||
        (document.body.classList.contains('lux-route-profile-view') && (
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
            el.classList.contains('lux-select-card')
        )) ||
        (document.body.classList.contains('lux-route-profile-view') && (
            ([...el.classList].some((className) => className.startsWith('pv-') && className !== 'pv-shell')) ||
            (Boolean(el.closest?.('.pv-financial-table')) && (
                el.tagName === 'TD' || el.tagName === 'TH' || el.tagName === 'TR'
            ))
        ))
    );
    const buildDynamicSurfaceBackground = (el, lightMode, amount) => {
        // Home dashboard keeps amount-scaled recipe (exception).
        // Outer freeform shells stay transparent; only inner panel/card/section/hero paint.
        const isHomeDashboardSurface = Boolean(el.matches?.(
            '#page-home #lux-home-shell .lux-home-grid > .lux-panel, ' +
            '#page-home #lux-home-shell .lux-home-grid > .lux-card, ' +
            '#page-home #lux-home-shell .lux-home-grid > .lux-hero, ' +
            '#page-home #lux-home-shell .lux-grid-widget > .lux-grid-widget-body > .lux-dashboard-section, ' +
            '#page-home #lux-home-shell .lux-grid-widget > .lux-grid-widget-body > .lux-panel, ' +
            '#page-home #lux-home-shell .lux-grid-widget > .lux-grid-widget-body > .lux-card, ' +
            '#page-home #lux-home-shell .lux-grid-widget > .lux-grid-widget-body > .lux-hero'
        ));
        if (isHomeDashboardSurface) {
            return buildHomeStyleSurfaceBackground(lightMode, amount);
        }
        // CSS-owned route glass: do not invent inline paint
        if (shouldKeepRouteFadeCssBackground(el)) {
            return '';
        }
        // Residual hosts still on the engine list (not yet keep-listed): shared panel tokens
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
    const shouldApplyDynamicBackground = (el) =>
        el.classList.contains('lux-card') ||
        el.classList.contains('lux-panel') ||
        el.classList.contains('lux-page-shell') ||
        el.classList.contains('surface-card') ||
        el.classList.contains('content-box') ||
        el.classList.contains('kiu-card') ||
        el.classList.contains('page-hero') ||
        el.classList.contains('schedule-toolbar-host') ||
        el.classList.contains('schedule-toolbar') ||
        el.classList.contains('lux-modern-surface') ||
        el.classList.contains('lux-modern-table') ||
        el.classList.contains('lux-program-hero') ||
        el.classList.contains('lux-program-filter-shell') ||
        el.classList.contains('lux-program-stage') ||
        el.classList.contains('lux-program-overview-card') ||
        el.classList.contains('lux-program-focus-panel') ||
        el.classList.contains('lux-program-publish-pill') ||
        el.classList.contains('lux-program-metric') ||
        el.classList.contains('lux-program-focus-stat') ||
        el.classList.contains('lux-program-semester-chip') ||
        el.classList.contains('lux-module-option') ||
        el.classList.contains('lux-subject-row') ||
        el.id === 'study-card-container' ||
        el.classList.contains('study-card-semester-table') ||
        el.classList.contains('study-card-summary-stage') ||
        el.classList.contains('lux-strip-card') ||
        el.classList.contains('study-card-grade-circle') ||
        el.classList.contains('study-card-assessment-window__chip') ||
        el.classList.contains('study-card-assessment-window__card') ||
        el.classList.contains('study-card-assessment-pill') ||
        el.classList.contains('study-card-term-header') ||
        el.classList.contains('study-card-term-row') ||
        el.classList.contains('personal-data-toolbar') ||
        el.classList.contains('profile-card') ||
        el.classList.contains('personal-data-stats-card') ||
        el.classList.contains('personal-data-facts-card') ||
        el.classList.contains('personal-data-record-card') ||
        el.classList.contains('personal-data-kpi-card') ||
        el.classList.contains('personal-data-mini') ||
        el.classList.contains('personal-data-record-item') ||
        el.classList.contains('personal-data-card-meta') ||
        el.classList.contains('lux-meta-pair-card') ||
        el.classList.contains('personal-data-hero-panel') ||
        el.classList.contains('newsx-panel') ||
        el.classList.contains('newsx-hero') ||
        el.classList.contains('newsx-feed-card') ||
        el.classList.contains('newsx-filter') ||
        el.classList.contains('newsx-sidebar') ||
        el.classList.contains('newsx-rail') ||
        el.classList.contains('newsx-section') ||
        el.classList.contains('newsx-stat') ||
        el.classList.contains('newsx-private-item') ||
        el.classList.contains('newsx-check') ||
        el.classList.contains('newsx-account-card') ||
        el.classList.contains('newsx-section-btn') ||
        el.classList.contains('newsx-pane-btn') ||
        el.classList.contains('student-service-canvas') ||
        el.classList.contains('student-service-zone') ||
        el.classList.contains('student-service-article-card') ||
        el.classList.contains('student-service-ticket-row') ||
        el.classList.contains('student-service-lane-card') ||
        el.classList.contains('student-service-ticket-card') ||
        el.classList.contains('student-service-ops-card') ||
        el.classList.contains('student-service-article-preview') ||
        el.classList.contains('student-service-ticket-stat') ||
        el.classList.contains('student-service-track-card') ||
        el.classList.contains('student-service-ops-ticket') ||
        el.classList.contains('student-service-ops-lane') ||
        el.classList.contains('student-service-ticket-thread') ||
        el.classList.contains('student-service-home-panel') ||
        el.classList.contains('student-service-home-card') ||
        el.classList.contains('student-service-home-ticket') ||
        el.classList.contains('student-service-home-topic') ||
        el.classList.contains('student-service-lane-choice-card') ||
        el.classList.contains('library-page-hero') ||
        el.classList.contains('library-filter-shell') ||
        el.classList.contains('library-catalog-card') ||
        el.classList.contains('library-tabs') ||
        el.classList.contains('library-picker-panel') ||
        el.classList.contains('library-catalog-foot') ||
        el.classList.contains('alib-panel') ||
        el.classList.contains('library-overview-card') ||
        el.classList.contains('library-hero-metric') ||
        el.classList.contains('library-hero-signal-card') ||
        el.classList.contains('admin-library-metric-card') ||
        el.classList.contains('admin-library-param-group') ||
        el.classList.contains('admin-library-chip') ||
        (document.body.classList.contains('lux-route-library') && (
            (el.classList.contains('lux-strip-card') && el.closest?.('#page-library')) ||
            (el.classList.contains('lux-hero-signal') && el.closest?.('#page-library')) ||
            (el.classList.contains('lux-picker-btn') && el.closest?.('.library-filter-shell')) ||
            (el.classList.contains('lux-control') && el.closest?.('.library-filter-shell'))
        )) ||
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
        el.classList.contains('lux-admin-tools-hero') ||
        el.classList.contains('lux-admin-op-card') ||
        el.classList.contains('lux-admin-ops-panel') ||
        el.classList.contains('lux-admin-provision-card') ||
        el.classList.contains('lux-admin-tools-index-hero') ||
        el.classList.contains('lux-admin-tools-index-panel') ||
        el.classList.contains('lux-admin-tools-index-summary') ||
        el.classList.contains('lux-admin-tools-index-command') ||
        el.classList.contains('lux-admin-tools-index-command-card') ||
        el.classList.contains('lux-admin-tools-index-subpanel') ||
        (document.body.classList.contains('lux-route-admin-tools') && (
            (el.classList.contains('lux-panel') && el.closest?.('#lux-admin-tools-shell')) ||
            (el.classList.contains('lux-card') && el.closest?.('#lux-admin-tools-shell')) ||
            (el.classList.contains('lux-subcard') && el.closest?.('#lux-admin-tools-shell')) ||
            (el.classList.contains('lux-stat-card') && el.closest?.('#lux-admin-tools-shell')) ||
            (el.classList.contains('lux-grid-widget') && el.closest?.('#lux-admin-tools-shell')) ||
            (el.classList.contains('lux-strip-card') && el.closest?.('#lux-admin-tools-shell')) ||
            (el.classList.contains('admin-reg-tab') && el.closest?.('#lux-admin-tools-shell')) ||
            (el.classList.contains('lux-control') && el.closest?.('#lux-admin-tools-shell')) ||
            (el.classList.contains('lux-picker-btn') && el.closest?.('#lux-admin-tools-shell')) ||
            (el.id === 'admin-reg-content-container' && el.closest?.('#lux-admin-tools-shell')) ||
            (el.id === 'curriculum-library-modules-root' && el.closest?.('#lux-admin-tools-shell'))
        )) ||
        (document.body.classList.contains('lux-route-admin-orders') &&
            Boolean(el.closest?.('#admin-orders-root, #modal-studio')) && (
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
            el.classList.contains('orders-recipient-list-shell') ||
            el.classList.contains('orders-recipient-list-empty') ||
            el.classList.contains('lux-hero-side-head') ||
            el.classList.contains('lux-hero-signal') ||
            el.classList.contains('lux-stat-card') ||
            el.classList.contains('lux-card') ||
            el.classList.contains('lux-control') ||
            el.classList.contains('lux-status-pill') ||
            el.classList.contains('lux-primary-btn') ||
            el.classList.contains('lux-secondary-btn') ||
            el.classList.contains('admin-orders-studio-card') ||
            el.classList.contains('admin-orders-palette-option') ||
            el.classList.contains('admin-orders-mode-btn') ||
            el.classList.contains('admin-orders-background-btn') ||
            el.classList.contains('admin-orders-apply-btn')
        )) ||
        (document.body.classList.contains('lux-route-social') && (            el.classList.contains('social-neo-card') ||
            SOCIAL_NEO_TRANSPARENCY_SURFACE_CLASSES.some((className) => el.classList.contains(className)) ||
            el.parentElement?.classList?.contains('social-neo-stat-grid') ||
            [...el.classList].some((className) =>
                className.startsWith('social-neo-') ||
                className.startsWith('social-project') ||
                className.startsWith('social-portfolio')
            )
        )) ||
        (document.body.classList.contains('lux-route-staff') && Boolean(el.closest?.('#staff-content')) && (
                                    el.classList.contains('staff-hub-controls') ||
            el.classList.contains('staff-hub-directory-panel') ||
            el.classList.contains('staff-hub-profile') ||
            el.classList.contains('staff-hub-info-card') ||
            el.classList.contains('staff-hub-warning') ||
            el.classList.contains('staff-hub-modal') ||
            el.classList.contains('staff-hub-list-item') ||
                        el.classList.contains('lux-card') ||
            el.classList.contains('lux-person-card') ||
            el.classList.contains('lux-subcard') ||
            el.classList.contains('surface-card') ||
            el.classList.contains('content-box')
        )) ||
        (document.body.classList.contains('lux-route-students-admin') &&
            Boolean(el.closest?.('#students-content')) &&
            !el.closest?.('#students-admin-lms-modal') && (
            el.classList.contains('students-hub-hero') ||
            el.classList.contains('students-hub-profile') ||
            el.classList.contains('students-hub-profile-header') ||
            el.classList.contains('students-hub-info-card') ||
            el.classList.contains('students-hub-controls') ||
            el.classList.contains('students-hub-directory-panel') ||
            el.classList.contains('students-hub-list-item') ||
            el.classList.contains('students-hub-modal') ||
            el.classList.contains('students-hub-warning')
        )) ||
        registrationGlassClasses.some((className) => el.classList.contains(className)) ||
        (document.body.classList.contains('lux-route-admin-scheduler') && Boolean(el.closest?.('#page-admin-scheduler')) && (
            schedulerGlassClasses.some((className) => el.classList.contains(className)) ||
            ((el.tagName === 'SELECT' || el.tagName === 'INPUT') &&
                el.closest?.('.sch-control-group, .sch-board-toolbar-row, .sch-search-shell, .sch-modal'))
        )) ||
        lmsGlassClasses.some((className) => el.classList.contains(className)) ||
        (isLmsRoute && Boolean(el.closest?.('.lms-quiz-builder')) &&
            lmsQuizBuilderGlassClasses.some((className) => el.classList.contains(className)));

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
        el.classList.contains('lux-timetable-grid-shell') ||
        (el.classList.contains('schedule-grid-shell') && el.dataset?.ttGrid === '1')
    );

    // KEY FIX: Use CSS custom properties to override !important rules
    // CSS variables can be set via JavaScript and will work with !important in CSS
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
    const rootComputedStyle = window.getComputedStyle(document.documentElement);
    const transparencySignature = [
        percentage,
        glassBlurQuality,
        document.body.classList.contains('lux-light-mode') ? 'light' : 'dark',
        rootComputedStyle.getPropertyValue('--lux-glass-tint-rgb').trim(),
        rootComputedStyle.getPropertyValue('--lux-accent-rgb').trim(),
        rootComputedStyle.getPropertyValue('--lux-topbar-tint-rgb').trim()
    ].join('|');

    // COMPREHENSIVE: Get ALL elements that could be widgets/panels/cards
    // Use multiple selector strategies to catch everything
    const allSelectors = window.__luxTransparencyAllSelectors || (window.__luxTransparencyAllSelectors = [
        // Luxury dashboard elements
        '.lux-card', '.lux-panel', '.lux-dashboard-section', '.lux-hero',
        '.lux-grid-widget', '.lux-home-card', '.lux-admin-ops-card',
        '.lux-builder-card', '.lux-builder-section',
        '.lux-page-shell', '.lux-stat-card', '.lux-stat',

        // Generic surface/card elements
        '.surface-card', '.content-box', '.kiu-card', '.page-card',
        '.section-card', '.panel-card', '.dashboard-card',
        '.tabs-container', '.modal-content', '.page-hero',
        ...registrationGlassSelectors,
        ...schedulerGlassSelectors,
        ...lmsGlassSelectors,

        // Programs page large surfaces
        '.lux-program-hero', '.lux-program-filter-shell', '.lux-program-stage',
        '.lux-program-overview-card', '.lux-program-focus-panel',
        '.lux-program-publish-pill', '.lux-program-metric',
        '.lux-program-focus-stat', '.lux-program-semester-chip',
        '.lux-module-option', '.lux-subject-row',

        // Profile view surfaces
        '#profile-view-root .pv-shell', '.pv-hero', '.pv-meta', '.pv-left', '.pv-right',

        // Study Card surfaces
        '#study-card-container', '.study-card-semester-table', '.study-card-summary-stage',
        '.study-card-grade-circle', '.study-card-assessment-window__chip',
        '.study-card-assessment-window__card', '.study-card-assessment-pill',
        '.study-card-term-header', '.study-card-term-row',
                '#study-card-container .lux-strip-card',

        // Personal Data surfaces
        '.personal-data-toolbar', '.profile-card', '.personal-data-stats-card',
        '.personal-data-facts-card', '.personal-data-record-card',
        '.personal-data-kpi-card', '.personal-data-mini', '.personal-data-record-item',
        '.personal-data-card-meta', '.lux-meta-pair-card', '.personal-data-hero-panel',
        '#page-personal-data .lux-strip-card',

        // News workspace surfaces
        '.newsx-panel', '.newsx-hero', '.newsx-feed-card', '.newsx-filter',
        '.newsx-sidebar', '.newsx-rail', '.newsx-section', '.newsx-stat',
        '.newsx-private-item', '.newsx-check', '.newsx-account-card',
        '.newsx-section-btn', '.newsx-pane-btn',

        // Student Service large surfaces (CSS-owned via --ssvc-fade-*)
        '.student-service-command-bar-shell',
        '.student-service-canvas', '.student-service-zone',
        '.student-service-article-card',
        '.student-service-ticket-row',
        '.student-service-lane-card', '.student-service-ticket-card',
        '.student-service-ops-card',         '.student-service-article-preview', '.student-service-ticket-stat',
        '.student-service-track-card', '.student-service-ops-ticket',
        '.student-service-ops-lane',         '.student-service-home-panel',
        '.student-service-home-card', '.student-service-home-ticket',
        '.student-service-home-topic', '.student-service-lane-choice-card',

        // Social large surfaces
        
        '.social-neo-card',
        ...SOCIAL_NEO_TRANSPARENCY_SURFACE_SELECTORS,

        // Staff command center surfaces
        ...STAFF_ROUTE_TRANSPARENCY_SURFACE_SELECTORS,
        '#staff-content .lux-card', '#staff-content .lux-person-card',
        '#staff-content .lux-subcard', '#staff-content .surface-card',
        '#staff-content .content-box', '#staff-content .lux-strip-card',
        '#staff-content .lux-data-card',

        // Students admin LMS surfaces
        ...STUDENTS_ADMIN_ROUTE_TRANSPARENCY_SURFACE_SELECTORS,

        // Library large surfaces
        '.library-page-hero', '.library-filter-shell', '.library-catalog-card',
        '.library-tabs', '.library-picker-panel', '.library-catalog-foot',
        '.alib-panel',
        '#page-library .alib-panel', '#page-library .lux-strip-card', '.library-overview-card',
        '.library-hero-metric', '.library-hero-signal-card',
        '.admin-library-metric-card',         '.admin-library-param-group', '.admin-library-chip',
        '.library-filter-shell .lux-picker-btn', '.library-filter-shell .lux-control',

        // Exams large surfaces
        '.ex2-hero', '.ex2-workspace-panel', '.ex2-workspace-head', '.ex2-workspace-section',
        '.ex2-panel', '.ex2-toolbar', '.ex2-card',
        '.ex2-stat-card', '.ex2-stat-chip', '.ex2-cohort-card', '.ex2-session-card',
        '.ex2-list-card', '.ex2-question-card', '.ex2-review-card',
        '.ex2-side-card', '.ex2-select-card', '.ex2-live-sidebar',
        '.ex2-q-card', '.ex2-q-card-head', '.ex2-empty-state',
        '.ex2-timeline-card', '.ex2-split-box', '.ex2-auto-gen-box',
        '.ex2-qnav-bar', '.ex2-progress-step', '.ex2-mini-grid > div',

        // Admin Tools large surfaces
        '.lux-admin-tools-hero', '.lux-admin-op-card', '.lux-admin-ops-panel',
        '.lux-admin-provision-card', '.lux-admin-tools-index-hero',
        '.lux-admin-tools-index-panel', '.lux-admin-tools-index-command',
        '#lux-admin-tools-shell .lux-panel',
        '#lux-admin-tools-shell .lux-card',
        '#lux-admin-tools-shell .lux-subcard',
        '#lux-admin-tools-shell .lux-stat-card',
        '#lux-admin-tools-shell .lux-grid-widget',
        '#lux-admin-tools-shell .lux-strip-card',
        '#lux-admin-tools-shell .admin-reg-tab',
        '#lux-admin-tools-shell .lux-control',
        '#lux-admin-tools-shell .lux-picker-btn',
        '#lux-admin-tools-shell #admin-reg-content-container',
        '#lux-admin-tools-shell #curriculum-library-modules-root',
        '.lux-admin-tools-index-summary', '.lux-admin-tools-index-command-card',
        '.lux-admin-tools-index-subpanel',

        // Staff directory elements
        '.lux-person-card', '.lux-subcard', '.lux-stack', '.lux-person-head',
        '.lux-inline-meta', '.lux-card-actions',

        // Widget structural elements
        '.lux-grid-widget-body', '.lux-widget-container',
        '.lux-card-head', '.lux-card-body', '.lux-panel-body',

        // Admin Orders specific elements
        '.lux-page-kicker', '.lux-status-pill',
        '#admin-orders-root .orders-admin-shell', '#admin-orders-root .orders-admin-hero',
        '#admin-orders-root .orders-admin-panel', '#admin-orders-root .orders-admin-hero-side',
        '#admin-orders-root .orders-detail-panel', '#admin-orders-root .orders-admin-table-wrap',
        '#admin-orders-root .orders-metric-card', '#admin-orders-root .orders-recipient-row',
        '#admin-orders-root .orders-recipient-card', '#admin-orders-root .orders-attachment-card',
        '#admin-orders-root .orders-detail-empty', '#admin-orders-root .orders-detail-card',
        '#admin-orders-root .orders-recipient-list-shell', '#admin-orders-root .orders-recipient-list-empty',
        '#admin-orders-root .lux-hero-side-head', '#admin-orders-root .lux-hero-signal',
        '#admin-orders-root .lux-stat-card', '#admin-orders-root .lux-card',
        '#admin-orders-root .lux-control', '#admin-orders-root .lux-primary-btn',
        '#admin-orders-root .lux-secondary-btn',
        '#modal-studio.admin-orders-studio', '#modal-studio .admin-orders-studio-card',
        '#modal-studio .admin-orders-palette-option', '#modal-studio .admin-orders-mode-btn',
        '#modal-studio .admin-orders-background-btn', '#modal-studio .admin-orders-apply-btn',
        '#modal-studio .lux-control',

        // Schedule/Timetable specific elements
        '.schedule-chip', '.schedule-view-switcher', '.schedule-week-arrow',
        '.schedule-toolbar-host', '.schedule-toolbar', '.schedule-week-nav',
        '.schedule-overview-row', '.schedule-view-row',

        // Form controls that need transparency
        '.lux-control',

        ...LUX_MODERN_TRANSPARENCY_SURFACE_SELECTORS
    ]);

    const surfaceElements = getCachedTransparencySurfaceElements(allSelectors, scopedRoots);

    surfaceElements.forEach(el => {
        // Skip if element is hidden
        if (el.offsetParent === null && el.style.display === 'none') return;
        // Studio owns fixed 50% glass in lux-studio.css — never engine-paint.
        if (
            el.id === 'lux-studio-backdrop' ||
            el.classList.contains('lux-studio-backdrop') ||
            el.classList.contains('lux-studio-panel') ||
            el.closest?.('#lux-studio-backdrop, #lux-bg-mode-params-backdrop')
        ) {
            el.style.removeProperty('background-color');
            el.style.removeProperty('background');
            el.style.removeProperty('backdrop-filter');
            el.style.removeProperty('-webkit-backdrop-filter');
            delete el.dataset.luxTransparencySignature;
            return;
        }
        const isOrdersInboxSurface = Boolean(el.closest?.(
            '#page-orders .orders-inbox-shell, #orders-inbox-root .orders-inbox-shell, #admin-orders-root .orders-inbox-shell'
        ));
        if (isOrdersInboxSurface) {
            el.style.removeProperty('background-color');
            el.style.removeProperty('background');
            el.style.removeProperty('backdrop-filter');
            el.style.removeProperty('-webkit-backdrop-filter');
            delete el.dataset.luxTransparencySignature;
            return;
        }
        if (isTimetableLayoutWrapper(el)) {
            el.style.removeProperty('background-color');
            el.style.removeProperty('background');
            el.style.removeProperty('backdrop-filter');
            el.style.removeProperty('-webkit-backdrop-filter');
            delete el.dataset.luxTransparencySignature;
            return;
        }
        if (isStudyCardGradebookProgressSegment(el)) {
            el.style.removeProperty('background-color');
            el.style.removeProperty('background');
            el.style.removeProperty('backdrop-filter');
            el.style.removeProperty('-webkit-backdrop-filter');
            delete el.dataset.luxTransparencySignature;
            return;
        }
        if (el.closest?.('#kiu-structured-form-modal')) {
            el.style.removeProperty('background-color');
            el.style.removeProperty('background');
            el.style.removeProperty('backdrop-filter');
            el.style.removeProperty('-webkit-backdrop-filter');
            delete el.dataset.luxTransparencySignature;
            return;
        }
        if (el.closest?.('#course-selection-modal-bg')) {
            el.style.removeProperty('background-color');
            el.style.removeProperty('background');
            el.style.removeProperty('backdrop-filter');
            el.style.removeProperty('-webkit-backdrop-filter');
            delete el.dataset.luxTransparencySignature;
            return;
        }
        if (el.closest?.('#schModalOverlay') || el.closest?.('#schPresetManagerOverlay')) {
            el.style.removeProperty('background-color');
            el.style.removeProperty('background');
            el.style.removeProperty('backdrop-filter');
            el.style.removeProperty('-webkit-backdrop-filter');
            delete el.dataset.luxTransparencySignature;
            return;
        }
        if (
            document.body.classList.contains('lux-route-admin-tools') &&
            Boolean(el.closest?.('#lux-admin-tools-shell')) &&
            (
                (el.closest?.('.lux-admin-tools-index-panel') && !el.classList.contains('lux-admin-tools-index-panel') && (
                    el.classList.contains('lux-admin-tools-index-panel-shell') ||
                    el.classList.contains('lux-admin-tools-index-subpanel') ||
                    el.classList.contains('curriculum-library-module-option') ||
                    el.id === 'curriculum-library-modules-root' ||
                    el.id === 'admin-reg-content-container'
                )) ||
                (el.closest?.('.lux-curriculum-subject-card') && !el.classList.contains('lux-curriculum-subject-card')) ||
                el.classList.contains('lux-curriculum-subject-card__head') ||
                el.classList.contains('lux-curriculum-subject-card__body') ||
                el.classList.contains('lux-curriculum-subject-card__footer') ||
                el.classList.contains('lux-curriculum-subject-card__chips') ||
                el.closest?.('.lux-curriculum-subject-card__chips') ||
                el.classList.contains('curriculum-library-panel--detail') ||
                el.classList.contains('curriculum-library-panel') ||
                el.classList.contains('curriculum-library-row-list')
            )
        ) {
            el.style.removeProperty('background-color');
            el.style.removeProperty('background');
            el.style.removeProperty('backdrop-filter');
            el.style.removeProperty('-webkit-backdrop-filter');
            delete el.dataset.luxTransparencySignature;
            return;
        }

        // Detect current mode
        const isLightMode = document.body.classList.contains('lux-light-mode');

        if (fillRatio > 0) {
            const alpha = fillRatio;
            if (applyStudentsAdminManagedSurface(el, percentage, transparencySignature)) {
                return;
            }
            if (!forceRefresh && el.dataset.luxTransparencySignature === transparencySignature) return;
            if (isStructuralSurface(el)) {
                /* Registration full-opacity override: force solid inline bg at >=99% so
                   no canvas particles bleed through (cloned from timetable behaviour). */
                if (percentage >= 99 && document.body.classList.contains('lux-route-registration') && el.closest?.('#page-registration')) {
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
            // Registration full-opacity: solid base under panel tokens (particle bleed guard)
            if (percentage >= 99 && shouldKeepRegistrationFadeCssBackground(el) && el.closest?.('#page-registration')) {
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
            // Bare pages: never invent glass; strip any inline paint
            if (document.body?.classList?.contains('lux-page-bare')) {
                stripInlineGlassPaint(el, transparencySignature);
                return;
            }
            // Soft-chrome / focus-panel / liquid glass CTAs: CSS owns material + transparency tokens
            // Topbar shell + controls always match builder-card soft-chrome (no engine glass).
            const isTopbarSoftChromeSurface = (
                el.id === 'lux-topbar' ||
                el.classList.contains('lux-topbar-shell') ||
                (
                    Boolean(el.closest?.('#lux-topbar')) &&
                    (
                        el.classList.contains('lux-picker-btn') ||
                        el.classList.contains('lux-icon-btn') ||
                        el.classList.contains('lux-user-chip') ||
                        el.classList.contains('lux-search') ||
                        el.classList.contains('lux-sidebar-toggle-btn') ||
                        el.classList.contains('lux-topbar-editor-btn') ||
                        (el.tagName === 'INPUT' && Boolean(el.closest?.('.lux-search')))
                    )
                )
            );
            // Home freeform shells: transparent frames only — never engine glass/blur.
            // Bleed was outer lux-grid-widget glass taller than content-sized soft-chrome.
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

            // Smart glass effect: preserve existing backgrounds
            const computedStyle = window.getComputedStyle(el);
            const existingBackground = computedStyle.backgroundImage;

            // Check if element has gradient or complex background from CSS
            const hasComplexBackground = existingBackground &&
                (existingBackground.includes('gradient') ||
                    existingBackground.includes('radial') ||
                    existingBackground.includes('linear'));

            const isSocialRouteSurface = document.body.classList.contains('lux-route-social');
            const keepSocialFadeCss = shouldKeepSocialFadeCssBackground(el);
            const keepAdminLibraryFadeCss = shouldKeepAdminLibraryFadeCssBackground(el);
            // Real social surfaces now frost like admin-tools; only layout
            // wrappers (non-paint surfaces) keep blur suppressed.
            // Single-wrapper frost (registration model) for routes whose glass
            // uses the shared .lux-page-shell wrapper: blur ONLY that wrapper,
            // suppress blur on inner panels. Registration blurs one wrapper and
            // reads clean; timetable/LMS were ALSO blurring inner panels (e.g.
            // the LMS hero) on top of the wrapper — a nested double-blur that
            // looks heavier/different. Suppressing it makes them match
            // registration: one clean frost, panels just tint the pre-blurred
            // backdrop. Scoped to these routes so other pages are untouched.
            const isWrapperFrostRoute = document.body.classList.contains('lux-route-timetable')
                || document.body.classList.contains('lux-route-lms');
            const isWrapperInnerPanel = isWrapperFrostRoute && Boolean(el.closest?.('.lux-page-shell')) && !el.classList.contains('lux-page-shell');
            const suppressBlur = isWrapperInnerPanel || (isSocialRouteSurface &&
                shouldApplyDynamicBackground(el) &&
                !isSocialPaintSurface(el) &&
                !isSocialBlurHost(el));
            const backdropValue = (suppressBlur || keepSocialFadeCss || keepAdminLibraryFadeCss)
                ? 'none'
                : `blur(${blurAmount}px) saturate(${saturateAmount}%)`;

            if (hasComplexBackground) {
                // For elements with CSS gradients: apply backdrop-filter AND override background with dynamic alpha
                el.style.setProperty('backdrop-filter', backdropValue, 'important');
                el.style.setProperty('-webkit-backdrop-filter', backdropValue, 'important');

                // CRITICAL FIX: Override hardcoded gradient backgrounds with dynamic alpha
                // This handles .lux-card and similar elements that use hardcoded alpha values
                if (shouldApplyDynamicBackground(el) && !keepSocialFadeCss && !keepAdminLibraryFadeCss) {
                    {
                        const _dynBg = buildDynamicSurfaceBackground(el, isLightMode, surfaceFillAmount);
                        if (_dynBg) el.style.setProperty('background', _dynBg, 'important');
                    }
                }
            } else {
                // For simple elements: apply blur only, let CSS handle backgrounds
                el.style.setProperty('backdrop-filter', backdropValue, 'important');
                el.style.setProperty('-webkit-backdrop-filter', backdropValue, 'important');
                if (
                    !keepSocialFadeCss &&
                    !keepAdminLibraryFadeCss &&
                    (
                        registrationGlassClasses.some(className => el.classList.contains(className)) ||
                        (document.body.classList.contains('lux-route-admin-scheduler') && Boolean(el.closest?.('#page-admin-scheduler')) && (
                            schedulerGlassClasses.some(className => el.classList.contains(className)) ||
                            ((el.tagName === 'SELECT' || el.tagName === 'INPUT') &&
                                el.closest?.('.sch-control-group, .sch-board-toolbar-row, .sch-search-shell, .sch-modal'))
                        )) ||
                        lmsGlassClasses.some(className => el.classList.contains(className)) ||
                        shouldApplyDynamicBackground(el)
                    )
                ) {
                    {
                        const _dynBg2 = buildDynamicSurfaceBackground(el, isLightMode, surfaceFillAmount);
                        if (_dynBg2) el.style.setProperty('background', _dynBg2, 'important');
                    }
                }
            }
            el.dataset.luxTransparencySignature = transparencySignature;
        } else {
            // Remove transparency - clear inline styles to let CSS take over
            el.style.removeProperty('background-color');
            el.style.removeProperty('background');
            el.style.removeProperty('backdrop-filter');
            el.style.removeProperty('-webkit-backdrop-filter');
            delete el.dataset.luxTransparencySignature;
        }
    });

    // Store current percentage for MutationObserver
    window.__currentTransparency = percentage;

    // FOUC PREVENTION: Only remove the pending class if surfaces were actually styled.
    // If no surfaces exist yet, keep the class — the MutationObserver will catch
    // newly added surfaces and trigger updateTransparency() again.
    if (surfaceElements.length > 0) {
        document.documentElement.classList.remove('lux-transparency-pending');
    }
}

/**
 * Set up MutationObserver to apply transparency to dynamically added elements
 */
function isLuxTransparencyExemptSubtree(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;
    if (node.closest && node.closest('[data-lux-transparency-exempt="1"]')) return true;
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
                if (
                    (node.matches && node.matches(SHARED_TRANSPARENCY_OBSERVER_SELECTOR)) ||
                    (node.querySelector && node.querySelector(SHARED_TRANSPARENCY_OBSERVER_SELECTOR))
                ) {
                    needsUpdate = true;
                    pendingRoots.add(node);
                }
            }
        }

        // Re-apply transparency if new elements were added, but debounce the full pass.
        if (needsUpdate && transparency > 0) {
            resetTransparencySurfaceCache();
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

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    window.__transparencyObserver = observer;
}

/**
 * Set panel transparency mode (legacy support)
 * @param {string} mode - 'on' or 'off'
 */
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
    collectTransparencySurfaceElements(['[data-lux-transparency-signature]'], scopedRoots).forEach((el) => {
        delete el.dataset.luxTransparencySignature;
    });
    updateTransparency(percentage, { force: true, persist: false, roots: scopedRoots });
}

function queueLuxuryTransparencyRefresh(value, options = {}) {
    const run = () => refreshLuxuryTransparencySurfaces(value, options);
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

function scheduleLuxuryTransparencyBootRefresh(value) {
    const refresh = () => queueLuxuryTransparencyRefresh(value, { persist: false });
    refresh();
    window.clearTimeout(window.__luxTransparencyBootRefreshTimer);
    window.__luxTransparencyBootRefreshTimer = window.setTimeout(() => {
        window.__luxTransparencyBootRefreshTimer = null;
        refresh();
    }, 240);
}

window.updateTransparency = updateTransparency;
window.refreshLuxuryTransparencySurfaces = refreshLuxuryTransparencySurfaces;
window.queueLuxuryTransparencyRefresh = queueLuxuryTransparencyRefresh;
window.scheduleLuxuryTransparencyBootRefresh = scheduleLuxuryTransparencyBootRefresh;
window.buildLuxuryTransparencyModel = buildLuxuryTransparencyModel;
window.mapLuxuryTransparencyFillRatio = mapLuxuryTransparencyFillRatio;
window.clampLuxuryTransparencyPercentage = clampLuxuryTransparencyPercentage;


// If utilities already ran initPalette before this file loaded, restore surfaces now.
(function bootLuxTransparencyIfNeeded() {
    try {
        if (typeof setupTransparencyObserver === 'function') setupTransparencyObserver();
        const saved = localStorage.getItem('kiuLuxurySurfaceTransparency');
        const pct = parseInt(saved || window.__currentTransparency || '13', 10);
        if (pct > 0 && typeof scheduleLuxuryTransparencyBootRefresh === 'function') {
            scheduleLuxuryTransparencyBootRefresh(pct);
        }
    } catch (e) { /* ignore */ }
})();
