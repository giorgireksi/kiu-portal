/* Transparency model + shortcut helpers. Peeled from index-luxury.js.
 * Load before index-luxury.js.
 */
(function initLuxuryTransparencyModelRuntime() {
    if (window.__KIU_LUXURY_TRANSPARENCY_MODEL_LOADED) return;
    window.__KIU_LUXURY_TRANSPARENCY_MODEL_LOADED = true;

    window.__kiuCreateLuxuryTransparencyModelApi = function createKiuLuxuryTransparencyModelApi(deps = {}) {
        const d = deps;
        const HOME_GRID_ROW_HEIGHT = Number(d.HOME_GRID_ROW_HEIGHT) || Number(window.HOME_GRID_ROW_HEIGHT) || 28;

    function buildLuxuryTransparencyModel(value, lightMode = false) {
        const percentage = Math.max(0, Math.min(100, parseInt(value, 10) || 0));
        const fillRatio = typeof window.mapLuxuryTransparencyFillRatio === 'function'
            ? window.mapLuxuryTransparencyFillRatio(percentage)
            : (percentage + 1) / 101;
        const transparencyRatio = fillRatio;
        const colorFadeRatio = lightMode
            ? Math.max(0.40, Math.min(1, fillRatio * 0.92))
            : Math.max(0.01, Math.min(1, fillRatio * 0.92));
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
    window.__kiuBuildLuxuryTransparencyModel = typeof buildLuxuryTransparencyModel === 'function'
        ? buildLuxuryTransparencyModel
        : window.__kiuBuildLuxuryTransparencyModel;
    window.buildLuxuryTransparencyModel = typeof buildLuxuryTransparencyModel === 'function'
        ? buildLuxuryTransparencyModel
        : window.buildLuxuryTransparencyModel;
    function applyLuxuryTransparencyTokenState(tokenState = {}, options = {}) {
        const root = document.documentElement;
        const propertyMap = {
            '--lux-panel-alpha': tokenState.panelAlpha,
            '--lux-transparency-alpha': tokenState.fillRatio,
            '--lux-color-fade-alpha': tokenState.colorFadeRatio,
            '--lux-raised-alpha': tokenState.raisedAlpha,
            '--lux-glass-alpha': tokenState.glassAlpha,
            '--lux-panel-fill-alpha': tokenState.panelFillAlpha,
            '--lux-raised-fill-alpha': tokenState.raisedFillAlpha,
            '--lux-utility-fill-alpha': tokenState.utilityFillAlpha,
            '--lux-utility-alpha': tokenState.utilityAlpha,
            '--lux-topbar-fill-alpha': tokenState.topbarFillAlpha,
            '--lux-topbar-raised-alpha': tokenState.topbarRaisedAlpha,
            '--lux-glass-highlight-alpha': tokenState.glassHighlightAlpha
        };
        if (Object.prototype.hasOwnProperty.call(options, 'panelGlow')) propertyMap['--lux-panel-glow'] = options.panelGlow;
        if (Object.prototype.hasOwnProperty.call(options, 'glowScale')) propertyMap['--lux-glow-scale'] = options.glowScale;
        if (Object.prototype.hasOwnProperty.call(options, 'cardGlowAlpha')) propertyMap['--lux-card-glow-alpha'] = options.cardGlowAlpha;
        Object.entries(propertyMap).forEach(([name, value]) => {
            if (value == null) return;
            root.style.setProperty(name, String(value));
        });
    }
    window.__kiuApplyTransparencyTokenState = typeof applyLuxuryTransparencyTokenState === 'function'
        ? applyLuxuryTransparencyTokenState
        : window.__kiuApplyTransparencyTokenState;
    function ensureLuxuryHighTransparencyStyleElement() {
        let styleEl = document.getElementById('lux-high-trans-primer');
        if (!styleEl) {
            if (typeof window.__kiuThemePrimerAppendLateStyle === 'function') {
                window.__kiuThemePrimerAppendLateStyle('lux-high-trans-primer', ':root{}');
                styleEl = document.getElementById('lux-high-trans-primer');
            }
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = 'lux-high-trans-primer';
                styleEl.textContent = ':root{}';
                document.head.appendChild(styleEl);
            }
        }
        styleEl.media = 'all';
        if (!String(styleEl.textContent || '').trim()) styleEl.textContent = ':root{}';
        return styleEl;
    }
    function applyLuxuryHighTransparencyState(enabled, cssText = '') {
        const root = document.documentElement;
        if (enabled) {
            root.classList.add('lux-high-transparency');
            const styleEl = ensureLuxuryHighTransparencyStyleElement();
            if (cssText) styleEl.textContent = cssText;
            return;
        }
        root.classList.remove('lux-high-transparency');
        const styleEl = ensureLuxuryHighTransparencyStyleElement();
        styleEl.textContent = ':root{}';
        styleEl.media = 'all';
    }
    function applySharedLightModeRootTokens(mode) {
        if (typeof window.__kiuApplyThemePrimerLightModeTokens === 'function') {
            window.__kiuApplyThemePrimerLightModeTokens(mode);
            return;
        }
        const root = document.documentElement;
        if (mode === 'light') {
            root.style.setProperty('--lux-bg', '#efebe4');
            root.style.setProperty('--lux-bg-soft', '#f7f3ec');
            root.style.setProperty('--lux-surface', '#ffffff');
            root.style.setProperty('--lux-surface-2', '#f5f1ea');
            root.style.setProperty('--lux-surface-3', '#ece6db');
            root.style.setProperty('--lux-border', 'rgba(48,34,22,0.10)');
            root.style.setProperty('--lux-border-strong', 'rgba(48,34,22,0.18)');
            root.style.setProperty('--lux-text', '#201912');
            root.style.setProperty('--lux-text-muted', 'rgba(32,25,18,0.66)');
            root.style.setProperty('--lux-text-soft', 'rgba(32,25,18,0.36)');
            root.style.setProperty('--lux-shadow', '0 24px 54px rgba(62,42,20,0.12)');
            return;
        }
        ['--lux-bg', '--lux-bg-soft', '--lux-surface', '--lux-surface-2', '--lux-surface-3', '--lux-border', '--lux-border-strong', '--lux-text', '--lux-text-muted', '--lux-text-soft', '--lux-shadow']
            .forEach((name) => root.style.removeProperty(name));
    }
    window.__kiuApplyHighTransparencyState = typeof applyLuxuryHighTransparencyState === 'function'
        ? applyLuxuryHighTransparencyState
        : window.__kiuApplyHighTransparencyState;
    function queueLuxuryRefreshOperation(run) {
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
    window.__kiuQueueLuxuryRefreshOperation = typeof queueLuxuryRefreshOperation === 'function'
        ? queueLuxuryRefreshOperation
        : window.__kiuQueueLuxuryRefreshOperation;
    function applyLuxuryTransparencyPreferenceState(percentage, transparencyRatio) {
        const normalizedPercentage = Math.max(0, Math.min(100, parseInt(percentage, 10) || 0));
        const normalizedRatio = Number.isFinite(Number(transparencyRatio))
            ? Number(transparencyRatio)
            : normalizedPercentage / 100;
        localStorage.setItem('kiuLuxurySurfaceTransparency', String(normalizedPercentage));
        localStorage.setItem('kiuLuxurySurfaceTransparencyValue', normalizedRatio.toFixed(2));
        document.documentElement.dataset.luxTransparency = String(normalizedPercentage);
    }
    window.__kiuApplyTransparencyPreferenceState = typeof applyLuxuryTransparencyPreferenceState === 'function'
        ? applyLuxuryTransparencyPreferenceState
        : window.__kiuApplyTransparencyPreferenceState;
    function applyAtmosphereSettings() {
        const root = document.documentElement;
        const particleQuality = getParticleQuality();
        const resolvedQuality = particleQuality === 'auto'
            ? (getLuxuryPerformanceTier(false) === 'high' ? 'high' : getLuxuryPerformanceTier(false) === 'efficient' ? 'low' : 'balanced')
            : particleQuality;
        const lightMode = getThemeMode() === 'light';
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
        const panelFillMin = lightMode ? 0.016 : 0.012;
        const raisedFillMin = lightMode ? 0.008 : 0.006;
        const utilityFillMin = lightMode ? 0.024 : 0.022;
        const topbarFillMin = lightMode ? 0.34 : 0.78;
        const topbarRaisedMin = lightMode ? 0.05 : 0.16;
        const backgroundAnimationsEnabled = areBackgroundAnimationsEnabled();
        // Initialize canvas sharpness for timetable glass quality
        if (typeof getParticleSharpness === 'function') {
            const sharpness = getParticleSharpness();
            const blurPx = ((100 - sharpness) / 100 * 1.0).toFixed(2);
            root.style.setProperty('--lux-canvas-sharpness-blur', blurPx + 'px');
        }
        root.style.setProperty('--lux-canvas-opacity', backgroundAnimationsEnabled ? '1' : '0');
        root.style.setProperty('--lux-overlay-opacity', '0');
        root.style.setProperty('--lux-page-haze-top', backgroundAnimationsEnabled ? '0' : '0');
        root.style.setProperty('--lux-page-haze-bottom', backgroundAnimationsEnabled ? '0' : '0');
        // Panel fill / glass blur are owned by updateTransparency — do not stomp them here.
        root.style.setProperty('--lux-topbar-fill-alpha', String(topbarFillMin));
        root.style.setProperty('--lux-topbar-raised-alpha', String(topbarRaisedMin));
        root.style.setProperty('--lux-button-glow', glowConfig.buttonGlow);
        var _savedTransVal = parseInt(
            getDashboardVisuals().surfaceTransparency
            || localStorage.getItem('kiuLuxurySurfaceTransparency')
            || DEFAULT_HOME_VISUALS.surfaceTransparency,
            10
        );
        var _transparencyModel = typeof window.buildLuxuryTransparencyModel === 'function'
            ? window.buildLuxuryTransparencyModel(_savedTransVal, lightMode)
            : null;
        var _panelA = _transparencyModel ? _transparencyModel.panelAlpha : (_savedTransVal >= 95 ? (lightMode ? 0.95 : 0.92) : Math.max(0.03, _savedTransVal / 100 * 0.92));
        const transparencyTokenState = _transparencyModel
            ? {
                ..._transparencyModel,
                panelAlpha: _panelA
            }
            : {
                panelAlpha: _panelA,
                fillRatio: Math.max(0, 1 - (_savedTransVal / 100)),
                colorFadeRatio: Math.max(0.01, Math.min(1, (Math.max(0, 1 - (_savedTransVal / 100))) * 0.92)),
                raisedAlpha: 0.012,
                glassAlpha: 0.006,
                panelFillAlpha: panelFillMin,
                raisedFillAlpha: raisedFillMin,
                utilityFillAlpha: utilityFillMin,
                utilityAlpha: lightMode ? 0.02 : 0.08,
                topbarFillAlpha: topbarFillMin,
                topbarRaisedAlpha: topbarRaisedMin,
                glassHighlightAlpha: lightMode ? 0.02 : 0.012
            };
        applyLuxuryTransparencyTokenState(transparencyTokenState, {
            panelGlow: glowConfig.panelGlow,
            glowScale: glowConfig.glowScale,
            cardGlowAlpha: glowConfig.cardGlowAlpha
        });
        root.style.setProperty('--lux-grid-row-height', `${HOME_GRID_ROW_HEIGHT}px`);
        document.body.dataset.luxBackgroundIntensity = resolvedQuality;
        document.body.dataset.luxParticleQuality = particleQuality;
        document.body.dataset.luxGlassBlurQuality = typeof getGlassBlurQuality === 'function'
            ? getGlassBlurQuality()
            : (document.body.dataset.luxGlassBlurQuality || 'high');
        document.body.dataset.luxGlowStrength = String(glowConfig.percent);
        document.body.dataset.luxBackgroundAnimation = backgroundAnimationsEnabled ? 'on' : 'off';
        document.body.dataset.luxStaticBackground = typeof getStaticBackgroundFill === 'function'
            ? getStaticBackgroundFill()
            : (document.body.dataset.luxStaticBackground || 'colored');
    }

    function normalizeWidgetSpan(value, fallback = 6) {
        const allowed = [3, 4, 6, 8, 12];
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return fallback;
        return allowed.reduce((closest, option) => (
            Math.abs(option - numeric) < Math.abs(closest - numeric) ? option : closest
        ), fallback);
    }
    function getRoleDefaultWidgetOrder(role) {
        const map = {
            student: ['alert', 'hero', 'summary', 'focus', 'quick', 'updates', 'column-0', 'column-1', 'column-2'],
            professor: ['alert', 'hero', 'quick', 'summary', 'focus', 'updates', 'column-0', 'column-1', 'column-2'],
            ta: ['alert', 'hero', 'summary', 'quick', 'focus', 'updates', 'column-0', 'column-1', 'column-2'],
            admin: ['alert', 'hero', 'admin-ops', 'summary', 'focus', 'updates', 'quick', 'column-0', 'column-1', 'column-2'],
            student_service: ['alert', 'hero', 'summary', 'focus', 'quick', 'updates', 'column-0', 'column-1', 'column-2']
        };
        return map[role] || map.student;
    }
    function sortWidgetsForRole(widgets, role) {
        const order = getRoleDefaultWidgetOrder(role);
        return (widgets || []).slice().sort((a, b) => {
            const aIndex = order.indexOf(a.id);
            const bIndex = order.indexOf(b.id);
            if (aIndex === -1 && bIndex === -1) return String(a.label || a.id).localeCompare(String(b.label || b.id));
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;
            return aIndex - bIndex;
        });
    }
    function getShortcutDestinationOptions(role = getEffectiveRole()) {
        const allowed = typeof getAllowedPagesForRole === 'function'
            ? Array.from(getAllowedPagesForRole(role) || [])
            : Object.keys(PAGE_LABELS);
        return allowed
            .filter((pageId) => PAGE_LABELS[pageId] && pageId !== 'home')
            .map((pageId) => ({ pageId, label: PAGE_LABELS[pageId] }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }
    function sanitizeShortcutDefinition(definition, role = getEffectiveRole()) {
        if (!definition || typeof definition !== 'object') return null;
        const destinations = getShortcutDestinationOptions(role).map((item) => item.pageId);
        const fallbackPage = destinations[0] || 'home';
        const pageId = destinations.includes(definition.pageId) ? definition.pageId : fallbackPage;
        return {
            id: String(definition.id || `shortcut-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
            type: 'shortcut',
            pageId,
            label: cleanupUiText(definition.label, 'Custom Shortcut').slice(0, 48),
            copy: cleanupUiText(definition.copy, 'Open this workspace quickly from your dashboard.').slice(0, 120),
            icon: cleanupUiText(definition.icon, 'fas fa-link'),
            tone: ['warm', 'royal', 'support', 'ink', 'calm', 'default'].includes(definition.tone) ? definition.tone : 'default',
            meta: cleanupUiText(definition.meta, 'Shortcut').slice(0, 32),
            status: cleanupUiText(definition.status, 'Open workspace').slice(0, 48),
            progress: clampPercent(definition.progress ?? 58, 58),
            span: normalizeWidgetSpan(definition.span, 4),
            visible: definition.visible !== false,
            removable: true,
            custom: true,
            critical: false
        };
    }
    function getSavedCustomShortcuts(role = getEffectiveRole()) {
        const items = getDashboardPreferenceEntry().customShortcutsByRole?.[role];
        if (!Array.isArray(items)) return [];
        return items.map((item) => sanitizeShortcutDefinition(item, role)).filter(Boolean);
    }
    function serializeCustomShortcuts(shortcuts, role = getEffectiveRole()) {
        return (shortcuts || [])
            .map((item) => sanitizeShortcutDefinition(item, role))
            .filter(Boolean)
            .map((item) => ({
                id: item.id,
                pageId: item.pageId,
                label: item.label,
                copy: item.copy,
                icon: item.icon,
                tone: item.tone,
                meta: item.meta,
                status: item.status,
                progress: item.progress,
                span: item.span,
                visible: item.visible !== false
            }));
    }

        const api = {
            buildLuxuryTransparencyModel,
            applyLuxuryTransparencyTokenState,
            ensureLuxuryHighTransparencyStyleElement,
            applyLuxuryHighTransparencyState,
            applySharedLightModeRootTokens,
            queueLuxuryRefreshOperation,
            applyLuxuryTransparencyPreferenceState,
            applyAtmosphereSettings,
            normalizeWidgetSpan,
            getRoleDefaultWidgetOrder,
            sortWidgetsForRole,
            getShortcutDestinationOptions,
            sanitizeShortcutDefinition,
            getSavedCustomShortcuts,
            serializeCustomShortcuts,
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateLuxuryTransparencyModelApi({});
})();
