(function () {
    function decodeLuxuryRouteChunkSource(base64Source) {
        const binary = window.atob(String(base64Source || ''));
        const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
        return new TextDecoder('utf-8').decode(bytes);
    }

    function createLuxuryAdminToolsRuntime(deps = {}) {
        const getActivePageId = typeof deps.getActivePageId === 'function' ? deps.getActivePageId : () => 'home';
        const executeAdminToolsChunk = typeof deps.executeAdminToolsChunk === 'function' ? deps.executeAdminToolsChunk : null;
        const decodeLuxuryHomeChunkSource = decodeLuxuryRouteChunkSource;
    /* Route-owned admin tools luxury bundle loader */
    let renderLuxuryAdminToolsPage = function ensureLuxuryAdminToolsPageRender() {
        if (!isLuxuryAdminToolsRoute()) return Promise.resolve(false);
        return ensureLuxuryAdminToolsBundle().then((loaded) => {
            if (!loaded) return false;
            return renderLuxuryAdminToolsPage();
        });
    };
    let __luxAdminToolsBundlePromise = null;
    let __luxAdminToolsChunkRetryAttempts = 0;
    let __luxAdminToolsChunkRetryTimer = null;

    function installLuxuryAdminToolsChunk(decodedSource) {
        const exports = Function(`
let renderLuxuryAdminToolsPage = function ensureLuxuryAdminToolsPageRender() {};
${decodedSource}
return {
    renderLuxuryAdminToolsPage: typeof renderLuxuryAdminToolsPage === 'function' ? renderLuxuryAdminToolsPage : null
};
`)();
        if (typeof exports?.renderLuxuryAdminToolsPage === 'function') {
            renderLuxuryAdminToolsPage = exports.renderLuxuryAdminToolsPage;
        }
    }

    function isLuxuryAdminToolsRoute() {
        return getActivePageId() === 'admin-tools' || document.body?.classList?.contains('lux-route-admin-tools');
    }

    function scheduleLuxuryAdminToolsChunkRetry() {
        const retryDelaysMs = [50, 200, 500];
        if (__luxAdminToolsChunkRetryAttempts >= retryDelaysMs.length) {
            __luxAdminToolsChunkRetryAttempts = 0;
            return;
        }
        if (__luxAdminToolsChunkRetryTimer) {
            window.clearTimeout(__luxAdminToolsChunkRetryTimer);
        }
        const delayMs = retryDelaysMs[__luxAdminToolsChunkRetryAttempts];
        __luxAdminToolsChunkRetryAttempts += 1;
        __luxAdminToolsChunkRetryTimer = window.setTimeout(() => {
            __luxAdminToolsChunkRetryTimer = null;
            if (window.__kiuLuxuryAdminToolsDashboardLoaded === true) {
                __luxAdminToolsChunkRetryAttempts = 0;
                if (isLuxuryAdminToolsRoute()) renderLuxuryAdminToolsPage();
                return;
            }
            const encoded = String(window.__kiuLuxuryAdminToolsChunkBase64 || '').trim();
            const plainUrl = String(window.__kiuLuxuryAdminToolsChunkUrl || '').trim();
            if (encoded || plainUrl) {
                __luxAdminToolsChunkRetryAttempts = 0;
                ensureLuxuryAdminToolsBundle().then((loaded) => {
                    if (loaded && isLuxuryAdminToolsRoute()) renderLuxuryAdminToolsPage();
                });
                return;
            }
            scheduleLuxuryAdminToolsChunkRetry();
        }, delayMs);
    }

    window.__kiuLuxuryAdminToolsChunkBase64 = window.__kiuLuxuryAdminToolsChunkBase64 || '';
    window.__kiuLuxuryAdminToolsChunkUrl = window.__kiuLuxuryAdminToolsChunkUrl || '';
    window.__kiuRegisterLuxuryAdminToolsChunk = function registerLuxuryAdminToolsChunk(base64Source) {
        window.__kiuLuxuryAdminToolsChunkBase64 = String(base64Source || '');
        window.__kiuLuxuryAdminToolsChunkUrl = '';
        ensureLuxuryAdminToolsBundle().then((loaded) => {
            if (!loaded) {
                scheduleLuxuryAdminToolsChunkRetry();
                return;
            }
            if (isLuxuryAdminToolsRoute()) renderLuxuryAdminToolsPage();
        });
    };
    window.__kiuRegisterLuxuryAdminToolsChunkUrl = function registerLuxuryAdminToolsChunkUrl(url) {
        window.__kiuLuxuryAdminToolsChunkUrl = String(url || '');
        window.__kiuLuxuryAdminToolsChunkBase64 = '';
        ensureLuxuryAdminToolsBundle().then((loaded) => {
            if (!loaded) {
                scheduleLuxuryAdminToolsChunkRetry();
                return;
            }
            if (isLuxuryAdminToolsRoute()) renderLuxuryAdminToolsPage();
        });
    };

    function ensureLuxuryAdminToolsBundle() {
        if (!isLuxuryAdminToolsRoute()) return Promise.resolve(false);
        if (window.__kiuLuxuryAdminToolsDashboardLoaded === true) return Promise.resolve(true);
        if (__luxAdminToolsBundlePromise) return __luxAdminToolsBundlePromise;
        __luxAdminToolsBundlePromise = Promise.resolve().then(async () => {
            const plainUrl = String(window.__kiuLuxuryAdminToolsChunkUrl || '').trim();
            const encoded = String(window.__kiuLuxuryAdminToolsChunkBase64 || '').trim();
            let sourceText = '';
            if (plainUrl) {
                const response = await fetch(plainUrl, { credentials: 'same-origin', cache: 'force-cache' });
                if (!response.ok) throw new Error(`Admin tools plain chunk HTTP ${response.status}`);
                sourceText = await response.text();
            } else if (encoded) {
                sourceText = decodeLuxuryHomeChunkSource(encoded);
            } else {
                scheduleLuxuryAdminToolsChunkRetry();
                return false;
            }
            __luxAdminToolsChunkRetryAttempts = 0;
            if (executeAdminToolsChunk && encoded && !plainUrl) {
                executeAdminToolsChunk(encoded);
            } else {
                installLuxuryAdminToolsChunk(sourceText);
            }
            window.__kiuLuxuryAdminToolsDashboardLoaded = true;
            return true;
        }).then((loaded) => {
            if (!loaded) return false;
            return true;
        }).catch((error) => {
            console.error('Failed to load route-owned admin tools luxury bundle.', error);
            return false;
        }).finally(() => {
            __luxAdminToolsBundlePromise = null;
        });
        return __luxAdminToolsBundlePromise;
    }

    window.ensureLuxuryAdminToolsBundle = ensureLuxuryAdminToolsBundle;

        const registerLuxuryAdminToolsChunk = window.__kiuRegisterLuxuryAdminToolsChunk;
        return {
            renderLuxuryAdminToolsPage: (...args) => renderLuxuryAdminToolsPage(...args),
            ensureLuxuryAdminToolsBundle,
            scheduleLuxuryAdminToolsChunkRetry,
            registerLuxuryAdminToolsChunk
        };
    }

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
        '.orders-detail-card',
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
    const LUX_LEGACY_TAB_CLASS_PATTERN = /\b(tab|reg-tab|pv-tab|nav-item)\b/i;
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
        if (node.closest?.('#page-study-card, .study-card-page-shell')) return true;
        if (node.closest('#page-registration .reg-tabs')) return true;
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
        if (isButton && !node.dataset.luxSkipModernButton) {
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

    function createLuxuryHomeDashboardRuntime(deps = {}) {
        const ensureHomeShell = typeof deps.ensureHomeShell === 'function' ? deps.ensureHomeShell : () => null;
        const escapeHtml = typeof deps.escapeHtml === 'function' ? deps.escapeHtml : (value) => String(value ?? '');
        const getActivePageId = typeof deps.getActivePageId === 'function' ? deps.getActivePageId : () => 'home';
        const isIndexPortalShell = typeof deps.isIndexPortalShell === 'function' ? deps.isIndexPortalShell : () => false;
        const executeHomeChunk = typeof deps.executeHomeChunk === 'function' ? deps.executeHomeChunk : null;
        const queueHeavySurfaceObservationRefresh = typeof deps.queueHeavySurfaceObservationRefresh === 'function'
            ? deps.queueHeavySurfaceObservationRefresh
            : () => {};
    /* Dashboard Builder Overrides */
    /* Route-owned home dashboard and editor bundle loader */
    const HOME_DASHBOARD_LOAD_TIMEOUT_MS = 10000;
    let renderDynamicHomeShell = function noopRenderDynamicHomeShell() {};
    let startBackground = function noopStartBackground() {};
    let __luxHomeShellResizeTimer = null;
    let __luxHomeDashboardBundlePromise = null;
    let __luxHomeShellLoadTimeout = null;
    let __luxHomeShellLoadGeneration = 0;
    let __luxHomeDashboardChunkRetryTimer = null;
    let __luxHomeDashboardChunkRetryAttempts = 0;

    function installLuxuryHomeDashboardChunk(decodedSource) {
        const exports = Function(`
let renderDynamicHomeShell = function noopRenderDynamicHomeShell() {};
let startBackground = function noopStartBackground() {};
${decodedSource}
return {
    renderDynamicHomeShell: typeof renderDynamicHomeShell === 'function' ? renderDynamicHomeShell : null,
    startBackground: typeof startBackground === 'function' ? startBackground : null,
    buildHomeWidgetDefinitions: typeof buildHomeWidgetDefinitions === 'function' ? buildHomeWidgetDefinitions : null
};
`)();
        if (typeof exports?.renderDynamicHomeShell === 'function') {
            renderDynamicHomeShell = exports.renderDynamicHomeShell;
        }
        if (typeof exports?.startBackground === 'function') {
            startBackground = exports.startBackground;
        }
        if (typeof exports?.buildHomeWidgetDefinitions === 'function') {
            window.buildHomeWidgetDefinitions = exports.buildHomeWidgetDefinitions;
        }
    }

    function homeShellHasLoadingPlaceholder(homeShell = document.getElementById('lux-home-shell')) {
        return Boolean(homeShell?.querySelector?.('[data-home-loading-shell="1"]'));
    }

    function homeShellHasDashboardContent(homeShell = document.getElementById('lux-home-shell')) {
        if (!homeShell) return false;
        return Boolean(
            homeShell.querySelector('[data-dashboard-canvas="1"], .lux-home-page, .lux-home-merged, .lux-home-band, .lux-grid-widget, .lux-dashboard-section, .lux-widget-stack, .lux-home-grid--builder')
        );
    }

    function clearHomeShellLoadTimeout() {
        if (__luxHomeShellLoadTimeout) {
            window.clearTimeout(__luxHomeShellLoadTimeout);
            __luxHomeShellLoadTimeout = null;
        }
    }

    function renderHomeShellLoadingPlaceholder(homeShell) {
        homeShell.innerHTML = `
            <div class="lux-home-grid is-loading" data-home-loading-shell="1" data-lux-glass-root="1">
                <section class="lux-card">
                    <div class="lux-card-body lux-stack-grid">
                        <div class="lux-kicker">Dashboard</div>
                        <div class="page-hero-title lux-home-loading-title">Preparing your KIU workspace</div>
                        <div class="lux-card-copy">Loading the faculty-scoped home dashboard, recent updates, schedule context, registration status, and quick actions for the active portal role.</div>
                        <div class="lux-pill-row">
                            <span class="lux-status-pill is-muted"><i class="fas fa-layer-group"></i> Home shell</span>
                            <span class="lux-status-pill is-muted"><i class="fas fa-bell"></i> Notifications</span>
                            <span class="lux-status-pill is-muted"><i class="fas fa-calendar-week"></i> Schedule</span>
                            <span class="lux-status-pill is-muted"><i class="fas fa-user-shield"></i> Role context</span>
                        </div>
                    </div>
                </section>
            </div>
        `;
    }

    function renderHomeShellRecoveryPanel(homeShell, { title, copy, showRetry = true } = {}) {
        clearHomeShellLoadTimeout();
        if (homeShell?.dataset) delete homeShell.dataset.homeRenderSignature;
        const safeTitle = escapeHtml(title || 'Dashboard could not load');
        const safeCopy = escapeHtml(copy || 'The home dashboard bundle did not finish loading. Try again or refresh the page.');
        homeShell.innerHTML = `
            <div class="lux-home-grid is-loading" data-home-recovery-shell="1" data-lux-glass-root="1">
                <section class="lux-card">
                    <div class="lux-card-body lux-stack-grid">
                        <div class="lux-kicker">Dashboard</div>
                        <div class="page-hero-title lux-home-loading-title">${safeTitle}</div>
                        <div class="lux-card-copy">${safeCopy}</div>
                        ${showRetry ? '<button class="lux-primary-btn" type="button" data-home-dashboard-retry="1">Retry loading dashboard</button>' : ''}
                    </div>
                </section>
            </div>
        `;
        if (!showRetry) return;
        const retryButton = homeShell.querySelector('[data-home-dashboard-retry="1"]');
        if (!retryButton || retryButton.__luxHomeRetryBound) return;
        retryButton.__luxHomeRetryBound = true;
        retryButton.addEventListener('click', () => {
            window.__kiuLuxuryHomeDashboardLoaded = false;
            __luxHomeDashboardBundlePromise = null;
            renderHomeShell();
        });
    }

    function scheduleHomeShellLoadTimeout(generation) {
        clearHomeShellLoadTimeout();
        __luxHomeShellLoadTimeout = window.setTimeout(() => {
            __luxHomeShellLoadTimeout = null;
            if (generation !== __luxHomeShellLoadGeneration) return;
            if (!isLuxuryHomeRoute()) return;
            const homeShell = document.getElementById('lux-home-shell');
            if (!homeShell || homeShellHasDashboardContent(homeShell)) return;
            renderHomeShellRecoveryPanel(homeShell, {
                title: 'Dashboard is taking longer than expected',
                copy: 'The home dashboard is still loading. You can retry now without leaving this page.'
            });
        }, HOME_DASHBOARD_LOAD_TIMEOUT_MS);
    }

    let __luxHomeShellRenderFrame = null;

    function buildHomeShellRenderSignature() {
        const role = String(typeof window.getEffectiveRole === 'function' ? window.getEffectiveRole() : '');
        const faculty = String(typeof window.getCurrentFacultyCode === 'function' ? window.getCurrentFacultyCode() : '');
        const editor = window.HOME_EDITOR_STATE || {};
        const editing = editor.editing ? '1' : '0';
        const draftLen = Array.isArray(editor.draftLayout) ? editor.draftLayout.length : 0;
        const selected = String(editor.selectedWidgetId || '');
        const viewport = (window.innerWidth || 0) >= 900 ? 'desktop' : 'stacked';
        const scope = typeof window.getHomeScopeKey === 'function'
            ? String(window.getHomeScopeKey(role, faculty) || '')
            : `${role}|${faculty}`;
        const layoutStamp = typeof window.buildHomeDataFingerprint === 'function'
            ? String(window.buildHomeDataFingerprint(role) || '')
            : '';
        return [role, faculty, editing, draftLen, selected, viewport, scope, layoutStamp].join('|');
    }

    function renderHomeShellNow() {
        const homeShell = ensureHomeShell();
        if (!homeShell) return;
        const loadGeneration = ++__luxHomeShellLoadGeneration;
        if (isLuxuryHomeRoute() && window.__kiuLuxuryHomeDashboardLoaded !== true) {
            if (!homeShell.textContent.trim() || homeShell.querySelector('[data-home-recovery-shell="1"]')) {
                renderHomeShellLoadingPlaceholder(homeShell);
                delete homeShell.dataset.homeRenderSignature;
            }
            scheduleHomeShellLoadTimeout(loadGeneration);
            ensureLuxuryHomeDashboardBundle({ preload: false, allowWhileNotHome: true }).then((loaded) => {
                if (loadGeneration !== __luxHomeShellLoadGeneration) return;
                if (!isLuxuryHomeRoute()) return;
                if (loaded) {
                    scheduleRenderHomeShell();
                    return;
                }
                renderHomeShellRecoveryPanel(homeShell, {
                    title: 'Dashboard could not load',
                    copy: 'The home dashboard bundle was not available yet. Retry once the portal scripts finish loading.'
                });
            });
            return;
        }
        clearHomeShellLoadTimeout();
        try {
            const signature = buildHomeShellRenderSignature();
            if (
                homeShell.dataset.homeRenderSignature === signature
                && homeShellHasDashboardContent(homeShell)
                && !homeShellHasLoadingPlaceholder(homeShell)
            ) {
                return;
            }
            renderDynamicHomeShell(homeShell);
            homeShell.dataset.homeRenderSignature = signature;
            if (typeof window.mountNewsHomeStrip === 'function') {
                window.mountNewsHomeStrip(homeShell);
            }
            // Paint immediately after DOM write, then once more next frame so
            // late-mounted widgets (async strips) still receive glass paint.
            const repaintHomeSurfaces = () => {
                if (typeof window.refreshLuxuryTransparencySurfaces === 'function') {
                    window.refreshLuxuryTransparencySurfaces(undefined, { roots: [homeShell] });
                } else if (typeof window.queueLuxuryTransparencyRefresh === 'function') {
                    window.queueLuxuryTransparencyRefresh(undefined, { roots: [homeShell] });
                }
            };
            repaintHomeSurfaces();
            const idleRunner = window.requestIdleCallback || ((cb) => window.setTimeout(cb, 120));
            idleRunner(repaintHomeSurfaces);
            queueHeavySurfaceObservationRefresh();
        } catch (error) {
            console.error('Home dashboard render failed.', error);
            delete homeShell.dataset.homeRenderSignature;
            renderHomeShellRecoveryPanel(homeShell, {
                title: 'Dashboard render failed',
                copy: 'Something went wrong while building the home dashboard. Retry or refresh the page.'
            });
        }
    }

    function scheduleRenderHomeShell() {
        if (typeof window.requestAnimationFrame !== 'function') {
            renderHomeShellNow();
            return;
        }
        if (__luxHomeShellRenderFrame) return;
        __luxHomeShellRenderFrame = window.requestAnimationFrame(() => {
            __luxHomeShellRenderFrame = null;
            renderHomeShellNow();
        });
    }

    function renderHomeShell() {
        scheduleRenderHomeShell();
    }

    function isLuxuryHomeRoute() {
        return getActivePageId() === 'home';
    }

    function scheduleLuxuryHomeDashboardPreload() {
        if (typeof isIndexPortalShell !== 'function' || !isIndexPortalShell()) return;
        const run = () => ensureLuxuryHomeDashboardBundle({ preload: true });
        // Fetch ASAP on next frame — idle timeout 1200ms delayed home fill.
        if (typeof window.requestAnimationFrame === 'function') {
            window.requestAnimationFrame(run);
            return;
        }
        window.setTimeout(run, 0);
    }

    window.__kiuLuxuryHomeChunkBase64 = window.__kiuLuxuryHomeChunkBase64 || '';
    window.__kiuLuxuryHomeChunkUrl = window.__kiuLuxuryHomeChunkUrl || '';
    window.__kiuRegisterLuxuryHomeChunk = function registerLuxuryHomeChunk(base64Source) {
        // Legacy base64 path (admin-tools style callers / older bundles).
        window.__kiuLuxuryHomeChunkBase64 = String(base64Source || '');
        window.__kiuLuxuryHomeChunkUrl = '';
        ensureLuxuryHomeDashboardBundle({ preload: true }).then((loaded) => {
            if (!loaded) return;
            if (isLuxuryHomeRoute()) renderHomeShell();
        });
    };
    window.__kiuRegisterLuxuryHomeChunkUrl = function registerLuxuryHomeChunkUrl(url) {
        window.__kiuLuxuryHomeChunkUrl = String(url || '');
        window.__kiuLuxuryHomeChunkBase64 = '';
        ensureLuxuryHomeDashboardBundle({ preload: true }).then((loaded) => {
            if (!loaded) return;
            if (isLuxuryHomeRoute()) renderHomeShell();
        });
    };

    function decodeLuxuryHomeChunkSource(base64Source) {
        const binary = window.atob(String(base64Source || ''));
        const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
        return new TextDecoder('utf-8').decode(bytes);
    }

    function scheduleLuxuryHomeDashboardChunkRetry() {
        const retryDelaysMs = [50, 200, 500];
        if (__luxHomeDashboardChunkRetryAttempts >= retryDelaysMs.length) {
            __luxHomeDashboardChunkRetryAttempts = 0;
            return;
        }
        if (__luxHomeDashboardChunkRetryTimer) {
            window.clearTimeout(__luxHomeDashboardChunkRetryTimer);
        }
        const delayMs = retryDelaysMs[__luxHomeDashboardChunkRetryAttempts];
        __luxHomeDashboardChunkRetryAttempts += 1;
        __luxHomeDashboardChunkRetryTimer = window.setTimeout(() => {
            __luxHomeDashboardChunkRetryTimer = null;
            if (window.__kiuLuxuryHomeDashboardLoaded === true) {
                __luxHomeDashboardChunkRetryAttempts = 0;
                return;
            }
            const encoded = String(window.__kiuLuxuryHomeChunkBase64 || '').trim();
            const plainUrl = String(window.__kiuLuxuryHomeChunkUrl || '').trim();
            if (encoded || plainUrl) {
                __luxHomeDashboardChunkRetryAttempts = 0;
                ensureLuxuryHomeDashboardBundle({ preload: false, allowWhileNotHome: true }).then((loaded) => {
                    if (loaded && isLuxuryHomeRoute()) renderHomeShell();
                });
                return;
            }
            scheduleLuxuryHomeDashboardChunkRetry();
        }, delayMs);
    }

    function ensureLuxuryHomeDashboardBundle(options = {}) {
        const preload = options.preload === true;
        const allowWhileNotHome = options.allowWhileNotHome === true;
        if (!preload && !allowWhileNotHome && !isLuxuryHomeRoute()) return Promise.resolve(false);
        if (typeof isIndexPortalShell === 'function' && !isIndexPortalShell() && !preload) {
            return Promise.resolve(false);
        }
        if (window.__kiuLuxuryHomeDashboardLoaded === true) return Promise.resolve(true);
        if (__luxHomeDashboardBundlePromise) return __luxHomeDashboardBundlePromise;
        __luxHomeDashboardBundlePromise = Promise.resolve().then(async () => {
            const plainUrl = String(window.__kiuLuxuryHomeChunkUrl || '').trim();
            const encoded = String(window.__kiuLuxuryHomeChunkBase64 || '').trim();
            let sourceText = '';
            if (plainUrl) {
                const response = await fetch(plainUrl, { credentials: 'same-origin', cache: 'force-cache' });
                if (!response.ok) throw new Error(`Home dashboard plain chunk HTTP ${response.status}`);
                sourceText = await response.text();
            } else if (encoded) {
                sourceText = decodeLuxuryHomeChunkSource(encoded);
            } else {
                if (typeof isIndexPortalShell === 'function' && isIndexPortalShell()) {
                    scheduleLuxuryHomeDashboardChunkRetry();
                }
                return false;
            }
            __luxHomeDashboardChunkRetryAttempts = 0;
            if (executeHomeChunk && encoded && !plainUrl) {
                executeHomeChunk(encoded);
            } else {
                installLuxuryHomeDashboardChunk(sourceText);
            }
            window.__kiuLuxuryHomeDashboardLoaded = true;
            return true;
        }).then((loaded) => {
            if (!loaded) return false;
            return true;
        }).catch((error) => {
            console.error('Failed to load route-owned home dashboard luxury bundle.', error);
            return false;
        }).finally(() => {
            __luxHomeDashboardBundlePromise = null;
        });
        return __luxHomeDashboardBundlePromise;
    }

        const registerLuxuryHomeChunk = window.__kiuRegisterLuxuryHomeChunk;
        return {
            homeShellHasLoadingPlaceholder,
            homeShellHasDashboardContent,
            renderHomeShellRecoveryPanel,
            renderHomeShell,
            scheduleRenderHomeShell,
            isLuxuryHomeRoute,
            scheduleLuxuryHomeDashboardPreload,
            scheduleLuxuryHomeDashboardChunkRetry,
            ensureLuxuryHomeDashboardBundle,
            registerLuxuryHomeChunk: window.__kiuRegisterLuxuryHomeChunk,
            registerLuxuryHomeChunkUrl: window.__kiuRegisterLuxuryHomeChunkUrl
        };
    }

    Object.assign(window, {
        __kiuDecodeLuxuryRouteChunkSource: decodeLuxuryRouteChunkSource,
        __kiuCreateLuxuryAdminToolsRuntime: createLuxuryAdminToolsRuntime,
        __kiuCreateLuxuryVisualRuntime: createLuxuryVisualRuntime,
        __kiuCreateLuxuryHomeDashboardRuntime: createLuxuryHomeDashboardRuntime
    });
})();
