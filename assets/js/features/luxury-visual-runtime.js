/* Scheduler-sized visual observer runtime.
 * The home/admin route loaders remain in luxury-index-runtime.js; scheduler
 * only needs the shared transparency/performance observer API.
 */
(function installLuxuryVisualRuntime() {
    'use strict';

    function createLuxuryVisualRuntime() {
    const LUX_HEAVY_SCROLL_SURFACE_SELECTOR = [
        '.lux-grid-widget',
        '.lux-card',
        '.lux-panel',
        '.surface-card',
        '.content-box',
        '.social-neo-post-card',
        '.social-neo-card',
        '.social-neo-alert',
        '.social-neo-chat-item',
        '.social-neo-directory-item',
        '.social-neo-entity-card',
        '.social-neo-event-card',
        '.social-neo-message',
        '.social-neo-empty',
        '.lms-clean-subject-card',
        '.lux-lms-group-card',
        '.newsx-panel',
        '.newsx-header-bar',
        '.newsx-feed-card',
        '.newsx-filter',
        '.newsx-section',
        '.newsx-private-item',

        '.student-service-ticket-stat',
        '.student-service-home-card',
        '.student-service-track-card',
        '.student-service-lane-card',
        '.student-service-ticket-card',
        '.student-service-ops-card',
        '.student-service-home-panel',
        '.student-service-article-card',
        '.student-service-ticket-row',
        '.student-service-home-ticket',
        '.student-service-home-topic',
        '.student-service-ops-ticket',
        '.student-service-hero',
        '.student-service-hero-aside',
        '.student-service-hero-aside-stat',
        '.student-service-canvas',
        '.student-service-zone',
        '.student-service-lane-choice-card',
        '.registration-hero',
        '.registration-workspace',
        '.registration-insight-card',
        '.registration-focus-card',
        '.registration-state-card',
        '.registration-module-list-card',
        '.registration-module-pane-card',
        '.registration-track-card',

        '.registration-course-row',
        '.registration-module-choice',
        '.registration-track-group',
        '.lux-admin-op-card',
        '.lux-admin-ops-panel',
        '.lux-admin-provision-card',
        '.admin-reg-tab',
        '#admin-reg-content-container',
        '#curriculum-library-modules-root',
        '.career-history-item',
        '.career-provider-route-card',
        '.career-intake-check',
        '.career-review-item',
        '.career-agent-log',
        '.career-agent-output',
        '.career-agent-node',
        '.career-agent-mini',
        '.career-wizard-card',
        '.career-report-workspace',
        '.orders-item',
        '.orders-inbox-workspace-detail',
        '.orders-metric-card',
        '.student-service-ticket-card',
        '.student-service-ticket-row',
        '.student-service-article-card',
        '.student-service-home-ticket',
        '.student-service-track-card',
        '.student-service-ops-ticket',
        '.ex2-card',
        '.ex2-question-card',
        '.ex2-review-card',
        '.lux-page-shell',
        '.newsx-feed',
        '#lux-home-shell .lux-home-merged.lux-soft-chrome',
        '#lux-home-shell .lux-home-grid',
        '#page-admin-scheduler .sch-grid-shell',
        '#page-timetable .sch-grid-shell',
        '#page-staff .staff-hub-command-panel',
        '#page-chancellery .chancellery-queue-panel',
        '#lms-content-area .lms-quiz-builder .lms-quiz-studio-main-card'
    ].join(', ');

    let __luxHeavySurfaceObserver = null;
    let __luxHeavySurfaceRefreshTimer = null;

    function getHeavySurfaceScrollRoot() {
        if (document.body.classList.contains('social-neo-scroll-lock')) {
            return document.getElementById('social-neo-center-region')
                || document.querySelector('.social-neo-center');
        }
        const appContent = document.getElementById('app-content');
        if (appContent && appContent.scrollHeight > appContent.clientHeight + 1) {
            return appContent;
        }
        return null;
    }

    let __luxHeavySurfaceObserverSignature = '';

    function refreshHeavySurfaceObservation() {
        if (!('IntersectionObserver' in window) || !document.body) return;
        const scrollRoot = getHeavySurfaceScrollRoot();
        const observerSignature = `${scrollRoot?.id || scrollRoot?.className || 'null'}|${LUX_HEAVY_SCROLL_SURFACE_SELECTOR}`;
        if (__luxHeavySurfaceObserver && __luxHeavySurfaceObserverSignature === observerSignature) {
            document.querySelectorAll(LUX_HEAVY_SCROLL_SURFACE_SELECTOR).forEach((node) => {
                if (!node || node.dataset.luxObservedSurface === '1') return;
                if (node.closest('#lux-home-shell .lux-home-merged') && !node.classList.contains('lux-home-merged')) return;
                if (node.closest('#lux-home-shell .lux-home-grid') && !node.classList.contains('lux-home-grid')) return;
                if (node.closest('#library-schema-overlay')) return;
                if (scrollRoot && !scrollRoot.contains(node)) return;
                node.dataset.luxObservedSurface = '1';
                node.dataset.luxOffscreen = '0';
                __luxHeavySurfaceObserver.observe(node);
            });
            return;
        }
        __luxHeavySurfaceObserverSignature = observerSignature;
        if (__luxHeavySurfaceObserver) {
            __luxHeavySurfaceObserver.disconnect();
            __luxHeavySurfaceObserver = null;
        }
        __luxHeavySurfaceObserver = new IntersectionObserver((entries) => {
            // Batch IO callbacks into one rAF so fast scroll does not N× queue refreshes.
            if (!window.__luxHeavySurfaceIoPending) {
                window.__luxHeavySurfaceIoPending = [];
            }
            entries.forEach((entry) => {
                if (!entry?.target?.dataset) return;
                entry.target.dataset.luxOffscreen = entry.isIntersecting ? '0' : '1';
                window.__luxHeavySurfaceIoPending.push(entry.target);
            });
            if (window.__luxHeavySurfaceIoRaf) return;
            const flushIo = () => {
                window.__luxHeavySurfaceIoRaf = 0;
                const pending = window.__luxHeavySurfaceIoPending || [];
                window.__luxHeavySurfaceIoPending = [];
                if (typeof window.syncLuxuryOffscreenBackdrop !== 'function') return;
                const seen = new Set();
                pending.forEach((el) => {
                    if (!el || seen.has(el)) return;
                    seen.add(el);
                    window.syncLuxuryOffscreenBackdrop(el);
                });
            };
            if (typeof window.requestAnimationFrame === 'function') {
                window.__luxHeavySurfaceIoRaf = window.requestAnimationFrame(flushIo);
            } else {
                flushIo();
            }
        }, {
            root: scrollRoot,
            rootMargin: '300px 0px 300px 0px',
            threshold: 0.01
        });
        document.querySelectorAll(LUX_HEAVY_SCROLL_SURFACE_SELECTOR).forEach((node) => {
            if (!node) return;
            if (node.closest('#lux-home-shell .lux-home-merged') && !node.classList.contains('lux-home-merged')) return;
            if (node.closest('#lux-home-shell .lux-home-grid') && !node.classList.contains('lux-home-grid')) return;
            if (node.closest('#library-schema-overlay')) return;
            if (scrollRoot && !scrollRoot.contains(node)) return;
            if (node.closest('.social-neo[data-panel="messages"]')) {
                if (node.classList.contains('social-neo-message')) return;
                if (node.closest('.social-neo-chat-items') && (
                    node.classList.contains('social-neo-chat-item')
                    || node.classList.contains('social-neo-empty')
                    || node.classList.contains('social-neo-messages__inbox-empty')
                )) return;
            }
            node.dataset.luxObservedSurface = '1';
            node.dataset.luxOffscreen = '0';
            __luxHeavySurfaceObserver.observe(node);
        });
    }

    function queueHeavySurfaceObservationRefresh() {
        if (__luxHeavySurfaceRefreshTimer) window.clearTimeout(__luxHeavySurfaceRefreshTimer);
        __luxHeavySurfaceRefreshTimer = window.setTimeout(() => {
            __luxHeavySurfaceRefreshTimer = null;
            const runner = window.requestIdleCallback || ((cb) => window.setTimeout(cb, 0));
            runner(() => refreshHeavySurfaceObservation(), { timeout: 600 });
        }, 120);
    }
    const LUX_LEGACY_VISUAL_SELECTOR = [
        '.content-box',
        '.surface-card',
        '.page-card',
        '.section-card',
        '.panel-card',
        '.kiu-card',
        '.dashboard-card',
        '.tabs-container',
        '.modal-content',
        '.page-hero',
        '.accordion-item',
        '.kiu-table',
        'table',
        '.tab',
        '.reg-tab',
        '.pv-tab',
        '.nav-item'
    ].join(',');

    const LUX_LEGACY_VISUAL_VALUE_PATTERN = /(var\(--kiu|#fff|#ffffff|#f8f9fa|#f8fafc|#f1f5f9|#eef2ff|#eff6ff|#e2e8f0|#cbd5e1|#94a3b8|#64748b|#475569|#334155|#1e3a8a|#2563eb|#3b82f6|#10b981|#168b66|#dc2626|white|black|rgba?\([^)]*(255|248|245|37|59|92|220|38|130|139)[^)]*\))/i;
    const LUX_LEGACY_SURFACE_CLASS_PATTERN = /\b(content-box|surface-card|page-card|section-card|panel-card|kiu-card|dashboard-card|tabs-container|modal-content|page-hero|accordion-item|filter-shell|library-catalog-filters-panel|admin-library-catalog-card|pv-(left|right|meta|stat)|sch-(sidebar|main|modal|grid-wrap|toolbar|day-col|time-col)|admin-card)\b/i;
    const LUX_LEGACY_PILL_CLASS_PATTERN = /\b(pill|badge|chip|tag|status)\b/i;
    // Whole tokens only — do not match lux-tab-btn / *-tab suffixes.
    const LUX_LEGACY_TAB_CLASS_PATTERN = /(?:^|[\s"'])(?:tab|reg-tab|pv-tab|nav-item)(?=[\s"']|$)/i;
    const LUX_LEGACY_BUTTON_CLASS_PATTERN = /\b(sch-btn|pv-action-btn|lux-primary-btn|lux-secondary-btn|lux-ghost-btn)\b/i;
    const LUX_LEGACY_VISUAL_PROPS = new Set([
        'background',
        'background-color',
        'color',
        'border',
        'border-color',
        'border-top',
        'border-right',
        'border-bottom',
        'border-left',
        'border-top-color',
        'border-right-color',
        'border-bottom-color',
        'border-left-color',
        'box-shadow',
        'backdrop-filter',
        '-webkit-backdrop-filter'
    ]);

    function getLuxuryPerformanceTier(reducedMotion = false) {
        if (reducedMotion) return 'efficient';
        const coarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        const memory = Number(navigator.deviceMemory || 0);
        const cores = Number(navigator.hardwareConcurrency || 0);
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
        // Only mark truly constrained devices as efficient — many laptops report
        // 4 cores and were getting an overly heavy throttle before.
        if ((memory && memory <= 2) || (cores && cores <= 2) || (coarsePointer && viewportWidth < 720)) {
            return 'efficient';
        }
        if (memory >= 8 && cores >= 8 && !coarsePointer && viewportWidth >= 1280) {
            return 'high';
        }
        return 'standard';
    }

    function getLuxuryBackgroundRenderProfile(reducedMotion = false) {
        const tier = getLuxuryPerformanceTier(reducedMotion);
        if (tier === 'efficient') {
            return {
                tier,
                pixelRatioCap: 1,
                frameInterval: reducedMotion ? 140 : 33,
                glassBlur: 14,
                transparencyBlur: 12,
                transparencySaturate: '124%',
                glassAlpha: '0.052',
                utilityAlpha: '0.8',
                cardGlowAlpha: '0.05'
            };
        }
        if (tier === 'high') {
            const isHome = document.body?.classList?.contains('lux-route-home') || document.body?.classList?.contains('lux-route-timetable');
            const isTimetable = document.body?.classList?.contains('lux-route-timetable');
            return {
                tier,
                pixelRatioCap: isTimetable ? 3 : (isHome ? 2.5 : 1.5),
                frameInterval: isHome ? 16 : (reducedMotion ? 80 : 42),
                glassBlur: 20,
                transparencyBlur: 18,
                transparencySaturate: '148%',
                glassAlpha: '0.068',
                utilityAlpha: '0.84',
                cardGlowAlpha: '0.07'
            };
        }
        return {
            tier,
            pixelRatioCap: 1.25,
            frameInterval: reducedMotion ? 100 : 22,
            glassBlur: 18,
            transparencyBlur: 16,
            transparencySaturate: '138%',
            glassAlpha: '0.06',
            utilityAlpha: '0.82',
            cardGlowAlpha: '0.06'
        };
    }

    function applyLuxuryPerformanceProfile() {
        if (!document.body) return;
        const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const profile = getLuxuryBackgroundRenderProfile(reducedMotion);
        const root = document.documentElement;
        document.body.dataset.luxPerformance = profile.tier;
        // Canvas/render caps only — glass fill/blur owned by updateTransparency.
        root.style.setProperty('--lux-canvas-pixel-ratio-cap', `${profile.pixelRatioCap}`);
        root.style.setProperty('--lux-canvas-frame-interval', `${profile.frameInterval}`);
    }

    function hasLegacyVisualValue(value = '') {
        return LUX_LEGACY_VISUAL_VALUE_PATTERN.test(String(value || '').toLowerCase());
    }

    function resolveLegacyTone(value = '') {
        const normalized = String(value || '').toLowerCase();
        if (/(dc2626|fee2e2|fca5a5|red|danger|error)/.test(normalized)) return 'danger';
        if (/(10b981|168b66|34d399|green|success|emerald|done)/.test(normalized)) return 'success';
        if (/(f59e0b|d97706|fbbf24|amber|orange|warn|warning)/.test(normalized)) return 'warn';
        if (/(64748b|94a3b8|slate|muted|secondary|ghost)/.test(normalized)) return 'secondary';
        return 'primary';
    }

    function shouldSkipLegacyVisualNode(node) {
        if (!node || node.nodeType !== 1) return true;
        if (/^(SCRIPT|STYLE|LINK|META|TITLE|NOSCRIPT|CANVAS|SVG|PATH)$/.test(node.tagName)) return true;
        if (node.closest('.lux-timetable-page, .social-neo, #social-neo-overlay-portal')) return true;
        if (node.closest?.('#admin-orders-create-overlay, #admin-orders-thread-overlay')) return true;
        if (node.classList?.contains('lms-session-marker-type-chip') || node.closest?.('.lms-session-marker-type-chips')) return true;
        if (document.body?.classList?.contains('lux-route-lms')) return true;
        if (node.closest('#page-lms, #page-lms-groups, #page-lms-inner, #lms-content-area')) return true;
        // Study card owns shell paint via --sc-fade-* (study-card-route.css); skip lux-modern-surface stamp.
        if (document.body?.classList?.contains('lux-route-study-card')) return true;
        if (node.closest?.('#page-study-card, .study-card-command-deck, .study-card-page-shell')) return true;
        if (document.body?.classList?.contains('lux-route-registration') && node.closest?.('#page-registration')) {
            if (node.matches?.('.page-hero, [data-lux-glass-root="1"], .reg-tab, .reg-tabs')) return true;
            if (node.classList?.contains('home-hover-chip')) return true;
        }
        if (node.classList?.contains('curriculum-library-scroll-btn')) return true;
        if (node.classList?.contains('curriculum-library-scroll-controls')) return true;
        if (node.classList?.contains('lux-scroll-rail__btn')) return true;
        if (node.classList?.contains('lux-scroll-rail__dock')) return true;
        if (node.classList?.contains('lux-scroll-rail__controls')) return true;
        if (node.closest?.('.lux-scroll-rail__dock, .lux-scroll-rail__controls')) return true;
        if (node.classList?.contains('curriculum-library-panel') || node.classList?.contains('curriculum-library-panel--detail')) return true;
        if (node.id === 'curriculum-module-rail-region' || node.id === 'curriculum-subject-panel-region') return true;
        if (node.classList?.contains('lux-prog-toolbar')) return true;
        if (node.classList?.contains('lux-program-shell-section')) return true;
        if (node.closest?.('#curriculum-library-workspace-root, #lux-admin-curriculum-deck .lux-admin-curriculum-workspace')) return true;
        if (node.classList?.contains('lux-program-subject-card')) return true;
        if (
            node.classList?.contains('lux-subject-row__code') ||
            node.classList?.contains('lux-subject-row__body') ||
            node.classList?.contains('lux-subject-row__secondary') ||
            node.classList?.contains('lux-subject-row__stats') ||
            node.classList?.contains('lux-subject-row__chips') ||
            node.classList?.contains('lux-subject-row__actions')
        ) return true;
        if (node.closest?.('.lux-program-subject-card')) return true;
        if (node.closest?.('.curriculum-library-panel, .curriculum-library-panel--detail, .curriculum-library-scroll-controls')) return true;
        if (node.closest?.('#kiu-structured-form-modal')) return true;
        if (node.closest?.('#kiu-admin-reg-manage-modal')) return true;
        if (node.closest?.('#kiu-luxury-confirm-modal')) return true;
        if (node.closest?.('#kiu-subject-builder-modal')) return true;
        if (node.closest?.('#library-schema-overlay, #library-schema-droplist-overlay, #library-sections-overlay')) return true;
        if (node.closest?.('#portal-news-root')) return true;
        if (node.closest?.('#page-chancellery')) return true;

        if (node.closest?.('#course-selection-modal-bg')) return true;
        if (node.closest?.('#schModalOverlay')) return true;
        if (node.closest?.('#schPresetManagerOverlay')) return true;
        if (node.closest?.('#staff-command-modal-root, #students-admin-modal-root')) return true;
        if (node.classList?.contains('palette-card')) return true;
        if (node.closest?.('#palette-list')) return true;
        if (node.classList?.contains('gb-lms-staff-roster-row')) return true;
        if (node.classList?.contains('gb-staff-quick-chip')) return true;
        if (node.dataset?.luxVisualSkip === '1') return true;
        return Boolean(node.closest('#lux-shell, #lux-topbar, #lux-studio-backdrop, #mobile-bottom-nav, #mobile-action-sheet, #lux-home-shell, .lux-picker-panel'));
    }

    function sanitizeLegacyVisualInlineStyle(styleText, options = {}) {
        const text = String(styleText || '').trim();
        if (!text) return { kept: [], removed: [] };
        const kept = [];
        const removed = [];
        text.split(';').forEach((entry) => {
            const part = entry.trim();
            if (!part) return;
            const colonIndex = part.indexOf(':');
            if (colonIndex === -1) {
                kept.push(part);
                return;
            }
            const prop = part.slice(0, colonIndex).trim().toLowerCase();
            const value = part.slice(colonIndex + 1).trim();
            const shouldStrip = LUX_LEGACY_VISUAL_PROPS.has(prop) || prop.startsWith('border-');
            if (shouldStrip && (options.stripAllVisuals || hasLegacyVisualValue(value))) {
                removed.push(prop);
                return;
            }
            kept.push(`${prop}: ${value}`);
        });
        return { kept, removed };
    }

    function decorateLegacyVisualNode(node) {
        if (shouldSkipLegacyVisualNode(node)) return;
        if (
            document.body.classList.contains('lux-route-students-admin') &&
            (node.id === 'students-content' || node.closest?.('#students-content'))
        ) {
            return;
        }
        if (
            document.body.classList.contains('lux-route-staff') &&
            (node.id === 'staff-content' || node.closest?.('#staff-content'))
        ) {
            return;
        }
        if (node.id === 'profile-view-root' || node.closest?.('#profile-view-root')) {
            return;
        }
        if (node.closest?.('#lux-fog-profiles-section, .lux-fog-profile-drag-ghost')) {
            if (/^(BUTTON|A)$/.test(node.tagName) && !node.dataset.luxSkipModernButton) {
                node.dataset.luxSkipModernButton = 'true';
            }
            return;
        }
        const className = typeof node.className === 'string' ? node.className : '';
        const styleText = node.getAttribute('style') || '';
        const combinedVisualHint = `${className} ${styleText}`;
        const tone = resolveLegacyTone(combinedVisualHint);
        const tagName = node.tagName;
        const inputType = (node.getAttribute('type') || '').toLowerCase();
        const isField = /^(INPUT|SELECT|TEXTAREA)$/.test(tagName) && !/^(checkbox|radio|range|color|file|hidden)$/i.test(inputType);
        const isButton = /^(BUTTON|A)$/.test(tagName) || LUX_LEGACY_BUTTON_CLASS_PATTERN.test(className);
        const isTab = node.getAttribute('role') === 'tab' || LUX_LEGACY_TAB_CLASS_PATTERN.test(className);
        const isTable = tagName === 'TABLE' || /\bkiu-table\b/i.test(className);
        const isPill = !isButton && LUX_LEGACY_PILL_CLASS_PATTERN.test(className);
        const isSurface = !isField && !isButton && !isTab && !isTable && (
            LUX_LEGACY_SURFACE_CLASS_PATTERN.test(className)
            || (/^(DIV|SECTION|ARTICLE|LI|UL|OL|FIELDSET|FORM|MAIN|ASIDE|HEADER)$/.test(tagName) && /(background|box-shadow|border|backdrop-filter)/i.test(styleText))
        );
        if (isField) node.classList.add('lux-modern-field');
        if (isButton && !node.dataset.luxSkipModernButton && !/\blux-tab-btn\b/i.test(className)) {
            node.classList.add('lux-modern-button');
            node.dataset.luxButtonTone = tone;
        }
        if (isTab) node.classList.add('lux-modern-tab');
        if (isTable) node.classList.add('lux-modern-table');
        if (isPill) {
            node.classList.add('lux-modern-pill');
            node.dataset.luxTone = tone;
        }
        if (isSurface) {
            node.classList.add('lux-modern-surface');
            node.dataset.luxTone = tone;
        }

        if (styleText) {
            // Never strip glass applied by the transparency engine.
            if (node.dataset?.luxTransparencySignature) {
                return;
            }
            const sanitized = sanitizeLegacyVisualInlineStyle(styleText, {
                stripAllVisuals: isField || isButton || isTab || isSurface || isTable || isPill
            });
            if (sanitized.removed.length) {
                sanitized.removed.forEach((prop) => node.style.removeProperty(prop));
            }
            if (!node.getAttribute('style') || !String(node.getAttribute('style') || '').trim()) {
                node.removeAttribute('style');
            }
        }
    }

    function sanitizeLegacyVisualTree(root = document.body) {
        if (!root || !document.body) return;
        document.body.classList.add('lux-unified-shell', 'lux-site-modernized');
        if (root.nodeType === 1) decorateLegacyVisualNode(root);
        if (typeof root.querySelectorAll !== 'function') return;
        root.querySelectorAll(LUX_LEGACY_VISUAL_SELECTOR).forEach((node) => decorateLegacyVisualNode(node));
    }

    let queuedLegacyVisualFrame = null;
    const queuedLegacyVisualRoots = new Set();

    function queueUniqueLegacyVisualRoot(root) {
        if (!root || root.nodeType !== 1) return;
        for (const existingRoot of queuedLegacyVisualRoots) {
            if (!existingRoot || typeof existingRoot.contains !== 'function') continue;
            if (existingRoot === root || existingRoot.contains(root)) {
                return;
            }
            if (typeof root.contains === 'function' && root.contains(existingRoot)) {
                queuedLegacyVisualRoots.delete(existingRoot);
            }
        }
        queuedLegacyVisualRoots.add(root);
    }

    function shouldSkipLegacyVisualRefresh(root) {
        if (!root || root.nodeType !== 1) return false;
        if (root.id === 'page-student-service' || root.id === 'page-chancellery') return true;
        if (root.id === 'profile-view-root') return true;
        return typeof root.closest === 'function' && (
            Boolean(root.closest('#page-student-service')) ||
            Boolean(root.closest('#page-chancellery')) ||
            Boolean(root.closest('#profile-view-root'))
        );
    }

    function queueLegacyVisualRefresh(root = document.body) {
        if (!root || shouldSkipLegacyVisualRefresh(root)) return;
        if (
            typeof window.shouldDeferLuxLegacyVisualRefresh === 'function'
            && window.shouldDeferLuxLegacyVisualRefresh()
        ) {
            window.__luxDeferredLegacyVisualRoot = root;
            return;
        }
        queueUniqueLegacyVisualRoot(root);
        if (queuedLegacyVisualFrame) return;
        const run = () => {
            queuedLegacyVisualFrame = null;
            const roots = Array.from(queuedLegacyVisualRoots);
            queuedLegacyVisualRoots.clear();
            roots.forEach((entry) => sanitizeLegacyVisualTree(entry));
        };
        if (window.__luxIsScrolling || window.__luxIsAnimating) {
            queuedLegacyVisualFrame = window.setTimeout(() => {
                const idleRunner = window.requestIdleCallback || ((callback) => window.setTimeout(callback, 0));
                idleRunner(run, { timeout: 250 });
            }, 120);
            return;
        }
        queuedLegacyVisualFrame = window.requestAnimationFrame(run);
    }

    if (typeof window.onLuxGovernorStateChange === 'function' && !window.__luxLegacyVisualGovernorFlushBound) {
        window.__luxLegacyVisualGovernorFlushBound = true;
        window.onLuxGovernorStateChange((busy) => {
            if (busy || !window.__luxDeferredLegacyVisualRoot) return;
            const root = window.__luxDeferredLegacyVisualRoot;
            window.__luxDeferredLegacyVisualRoot = null;
            queueLegacyVisualRefresh(root);
        });
    }

    function observeLegacyVisualTree() {
        if (window.__luxLegacyVisualObserver || !window.MutationObserver || !document.body) return;
        /* PERFORMANCE: Debounce — collect 150ms of DOM changes, then process once */
        let _legacyDebounceTimer = null;
        let _legacyPendingNodes = new Set();
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                mutation.addedNodes.forEach((node) => {
                    if (!node || node.nodeType !== 1) return;
                    if (shouldSkipLegacyVisualRefresh(node)) return;
                    if (
                        !(node.matches && node.matches(LUX_LEGACY_VISUAL_SELECTOR)) &&
                        !(node.querySelector && node.querySelector(LUX_LEGACY_VISUAL_SELECTOR))
                    ) {
                        return;
                    }
                    _legacyPendingNodes.add(node);
                });
            }
            if (!_legacyDebounceTimer) {
                _legacyDebounceTimer = setTimeout(() => {
                    _legacyDebounceTimer = null;
                    const nodes = Array.from(_legacyPendingNodes);
                    _legacyPendingNodes.clear();
                    nodes.forEach((n) => queueLegacyVisualRefresh(n));
                    queueHeavySurfaceObservationRefresh();
                }, 150);
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false /* PERF: stop watching style/class — caused feedback loops */
        });
        window.__luxLegacyVisualObserver = observer;
        window.__luxLegacyVisualObserversPaused = false;
    }

    function pauseLuxuryVisualObservers() {
        window.__luxLegacyVisualObserversPaused = true;
        if (__luxHeavySurfaceRefreshTimer) {
            window.clearTimeout(__luxHeavySurfaceRefreshTimer);
            __luxHeavySurfaceRefreshTimer = null;
        }
        if (__luxHeavySurfaceObserver) {
            __luxHeavySurfaceObserver.disconnect();
            __luxHeavySurfaceObserver = null;
        }
        if (window.__luxLegacyVisualObserver) {
            window.__luxLegacyVisualObserver.disconnect();
            window.__luxLegacyVisualObserver = null;
        }
        if (typeof window.pauseLuxuryPickerObservers === 'function') {
            window.pauseLuxuryPickerObservers();
        }
    }

    function resumeLuxuryVisualObservers() {
        const wasPaused = window.__luxLegacyVisualObserversPaused
            || !window.__luxLegacyVisualObserver;
        window.__luxLegacyVisualObserversPaused = false;
        if (typeof window.resumeLuxuryPickerObservers === 'function') {
            window.resumeLuxuryPickerObservers();
        }
        observeLegacyVisualTree();
        if (!wasPaused) return;
        queueHeavySurfaceObservationRefresh();
        const activeRoot = document.querySelector('.page-section.active-page') || document.body;
        queueLegacyVisualRefresh(activeRoot);
        if (typeof window.enhanceUniversalPickers === 'function') {
            window.enhanceUniversalPickers(activeRoot);
        }
    }

        return {
            refreshHeavySurfaceObservation,
            queueHeavySurfaceObservationRefresh,
            getLuxuryPerformanceTier,
            getLuxuryBackgroundRenderProfile,
            applyLuxuryPerformanceProfile,
            queueLegacyVisualRefresh,
            observeLegacyVisualTree,
            pauseLuxuryVisualObservers,
            resumeLuxuryVisualObservers
        };
    }


    window.__kiuCreateLuxuryVisualRuntime = createLuxuryVisualRuntime;
})();
