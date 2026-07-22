/* Home dashboard prefs / palette helpers. */
    const ADVANCED_HOME_LAYOUT_VERSION = 5;
    const HOME_SCOPE_SEPARATOR = '::';
    const HOME_GRID_COLUMNS = 12;
    const HOME_GRID_ROW_HEIGHT = 28;
    const HOME_DESKTOP_EDITOR_BREAKPOINT = 1120;
    const HOME_WINDOW_SNAP = 12;
    const HOME_WINDOW_MIN_WIDTH = 220;
    const HOME_WINDOW_MIN_HEIGHT = 150;
    const ADVANCED_DEFAULT_VISUALS = {
        themeMode: 'dark',
        backgroundMode: 'orbit',
        backgroundIntensity: 'standard',
        glowStrength: 50,
        paletteKey: 'ocean-teal',
        paletteFaculty: '*',
        customPalette: null,
        accentColor: '',
        accentColor2: '',
        glassTint: '',
        particleColor: '',
        lineColor: '',
        glowColor: '',
        hazeColor: '',
        surfaceTransparency: '13',
        glassBlurQuality: 'high'
    };
    const HOME_WIDGET_CONTEXT_CACHE = new WeakMap();
    const HOME_WIDGET_DEFINITIONS_CACHE = new WeakMap();

    function buildAdvancedDefaultVisuals() {
        return {
            ...ADVANCED_DEFAULT_VISUALS,
            customPalette: null
        };
    }

    function isDesktopHomeEditorViewport() {
        return (window.innerWidth || 0) >= HOME_DESKTOP_EDITOR_BREAKPOINT;
    }


    function getHomeScopeKey(role = getEffectiveRole(), facultyCode = getCurrentFacultyCode()) {
        return `${String(role || 'student')}${HOME_SCOPE_SEPARATOR}${String(facultyCode || 'ECON')}`;
    }

    function clearHomeEditorState() {
        HOME_EDITOR_STATE.editing = false;
        HOME_EDITOR_STATE.role = '';
        HOME_EDITOR_STATE.draftLayout = null;
        HOME_EDITOR_STATE.draftCustomShortcuts = [];
        HOME_EDITOR_STATE.dragState = null;
        HOME_EDITOR_STATE.inspectorState = null;
        HOME_EDITOR_STATE.inspectorDragState = null;
        HOME_EDITOR_STATE.selectedWidgetId = '';
    }

    function createDashboardPreferenceEntry() {
        return {
            version: ADVANCED_HOME_LAYOUT_VERSION,
            visuals: buildAdvancedDefaultVisuals(),
            visualsByScope: {},
            layoutsByRole: {},
            customShortcutsByRole: {},
            layoutsByScope: {},
            editorUiByScope: {}
        };
    }

    function normalizeScopeLayoutEntry(scopeEntry) {
        if (!scopeEntry || typeof scopeEntry !== 'object') return null;
        const workspaceWidgets = Array.isArray(scopeEntry.workspaceWidgets)
            ? scopeEntry.workspaceWidgets
            : (Array.isArray(scopeEntry.widgets) ? scopeEntry.widgets : []);
        const presentationWidgets = Array.isArray(scopeEntry.presentationWidgets) ? scopeEntry.presentationWidgets : [];
        return {
            version: Number(scopeEntry.version || 0) || 0,
            workspaceWidgets,
            presentationWidgets
        };
    }

    function getDashboardPreferenceEntry() {
        const store = ensureDashboardPreferenceStore();
        const userId = getDashboardPreferenceUserId();
        if (!store[userId] || typeof store[userId] !== 'object') {
            store[userId] = createDashboardPreferenceEntry();
        }
        const entry = store[userId];
        const previousVersion = Number(entry.version || 0);
        if (!entry.visuals || typeof entry.visuals !== 'object') entry.visuals = buildAdvancedDefaultVisuals();
        if (!entry.visualsByScope || typeof entry.visualsByScope !== 'object') entry.visualsByScope = {};
        if (!entry.layoutsByRole || typeof entry.layoutsByRole !== 'object') entry.layoutsByRole = {};
        if (!entry.customShortcutsByRole || typeof entry.customShortcutsByRole !== 'object') entry.customShortcutsByRole = {};
        if (!entry.layoutsByScope || typeof entry.layoutsByScope !== 'object') entry.layoutsByScope = {};
        if (!entry.editorUiByScope || typeof entry.editorUiByScope !== 'object') entry.editorUiByScope = {};
        if (previousVersion > 0 && previousVersion < ADVANCED_HOME_LAYOUT_VERSION) {
            Object.keys(entry.layoutsByScope).forEach((scopeKey) => {
                const normalizedScope = normalizeScopeLayoutEntry(entry.layoutsByScope[scopeKey]);
                if (!normalizedScope) return;
                normalizedScope.workspaceWidgets.forEach((widget) => {
                    if (!widget || typeof widget !== 'object') return;
                    delete widget.desktopRect;
                    delete widget.restoreDesktopRect;
                    delete widget.zIndex;
                });
                normalizedScope.presentationWidgets.forEach((widget) => {
                    if (!widget || typeof widget !== 'object') return;
                    delete widget.desktopRect;
                    delete widget.restoreDesktopRect;
                    delete widget.zIndex;
                });
                entry.layoutsByScope[scopeKey] = {
                    version: previousVersion,
                    workspaceWidgets: normalizedScope.workspaceWidgets,
                    presentationWidgets: normalizedScope.presentationWidgets
                };
            });
        }
        entry.version = ADVANCED_HOME_LAYOUT_VERSION;
        return entry;
    }

    function updateDashboardPreferenceEntry(mutator, { persist = false } = {}) {
        const store = ensureDashboardPreferenceStore();
        const userId = getDashboardPreferenceUserId();
        const nextEntry = cloneDeep(getDashboardPreferenceEntry(), createDashboardPreferenceEntry());
        mutator(nextEntry);
        nextEntry.version = ADVANCED_HOME_LAYOUT_VERSION;
        if (!nextEntry.visuals || typeof nextEntry.visuals !== 'object') nextEntry.visuals = buildAdvancedDefaultVisuals();
        if (!nextEntry.visualsByScope || typeof nextEntry.visualsByScope !== 'object') nextEntry.visualsByScope = {};
        if (!nextEntry.layoutsByRole || typeof nextEntry.layoutsByRole !== 'object') nextEntry.layoutsByRole = {};
        if (!nextEntry.customShortcutsByRole || typeof nextEntry.customShortcutsByRole !== 'object') nextEntry.customShortcutsByRole = {};
        if (!nextEntry.layoutsByScope || typeof nextEntry.layoutsByScope !== 'object') nextEntry.layoutsByScope = {};
        if (!nextEntry.editorUiByScope || typeof nextEntry.editorUiByScope !== 'object') nextEntry.editorUiByScope = {};
        store[userId] = nextEntry;
        if (persist && typeof saveState === 'function') saveState();
        return nextEntry;
    }

    function getDefaultInspectorState() {
        const width = Math.min(390, Math.max(320, (window.innerWidth || 1440) - 48));
        return {
            collapsed: false,
            x: Math.max(24, (window.innerWidth || 1440) - width - 28),
            y: 132,
            width
        };
    }

    function sanitizeInspectorState(value) {
        const base = getDefaultInspectorState();
        const width = Math.max(300, Math.min(Number(value?.width) || base.width, Math.max(300, (window.innerWidth || 1440) - 32)));
        const maxX = Math.max(12, (window.innerWidth || 1440) - width - 12);
        const maxY = Math.max(12, (window.innerHeight || 900) - 120);
        return {
            collapsed: value?.collapsed === true,
            width,
            x: Math.max(12, Math.min(Number(value?.x) || base.x, maxX)),
            y: Math.max(96, Math.min(Number(value?.y) || base.y, maxY))
        };
    }

    function getSavedInspectorState(scopeKey = getHomeScopeKey()) {
        const entry = getDashboardPreferenceEntry();
        return sanitizeInspectorState(entry.editorUiByScope?.[scopeKey] || {});
    }

    function setSavedInspectorState(values, scopeKey = getHomeScopeKey(), persist = true) {
        const nextState = sanitizeInspectorState({
            ...(getSavedInspectorState(scopeKey) || {}),
            ...(values || {})
        });
        updateDashboardPreferenceEntry((entry) => {
            entry.editorUiByScope = entry.editorUiByScope || {};
            entry.editorUiByScope[scopeKey] = nextState;
        }, { persist });
        return nextState;
    }

    function getDashboardVisuals(scopeKey = getHomeScopeKey()) {
        const entry = getDashboardPreferenceEntry();
        const scopedVisuals = entry.visualsByScope?.[scopeKey];
        return {
            ...buildAdvancedDefaultVisuals(),
            ...(scopedVisuals || entry.visuals || {})
        };
    }

    function setDashboardVisuals(values, persist = true, scopeKey = getHomeScopeKey()) {
        updateDashboardPreferenceEntry((entry) => {
            entry.visualsByScope = entry.visualsByScope || {};
            entry.visualsByScope[scopeKey] = {
                ...buildAdvancedDefaultVisuals(),
                ...(entry.visuals || {}),
                ...(entry.visualsByScope?.[scopeKey] || {}),
                ...(values || {})
            };
        }, { persist });
    }



    function resetHomeToDefaults() {
        [
            'kiuLuxuryThemeMode',
            'kiuLuxuryBackgroundMode',
            'kiuLuxuryBackgroundIntensity',
            'kiuLuxuryGlowStrength',
            'kiuLuxurySurfaceTransparency',
            'kiuLuxurySurfaceTransparencyValue',
            'kiuLuxuryPalette',
            'kiuLuxuryPaletteFaculty',
            'kiuLuxuryCustomPalette',
            'kiuLuxuryCustomPaletteFaculty',
            'kiuLuxuryMixerState'
        ].forEach((key) => localStorage.removeItem(key));
        updateDashboardPreferenceEntry((entry) => {
            entry.visuals = buildAdvancedDefaultVisuals();
            entry.visualsByScope = {};
            entry.layoutsByRole = {};
            entry.customShortcutsByRole = {};
            entry.layoutsByScope = {};
            entry.editorUiByScope = {};
        }, { persist: true });
        clearHomeEditorState();
        showToast('Home restored to KIU defaults.');
        syncAll();
    }


    function resetAllSavedHomeLayouts() {
        updateDashboardPreferenceEntry((entry) => {
            entry.layoutsByRole = {};
            entry.customShortcutsByRole = {};
            entry.layoutsByScope = {};
            entry.editorUiByScope = {};
        }, { persist: true });
        clearHomeEditorState();
        showToast('All dashboard layouts reset.');
        syncAll();
    }

    let __luxColorProbeContext = null;
    function rgbTripletToHex(triplet, fallback = '#c8822a') {
        const parts = String(triplet || '')
            .split(',')
            .slice(0, 3)
            .map((part) => Math.max(0, Math.min(255, Math.round(Number(part.trim()) || 0))));
        if (parts.length !== 3 || parts.some((value) => !Number.isFinite(value))) return fallback;
        return `#${parts.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
    }

    function colorToRgbTriplet(value, fallback = '200,130,42') {
        const input = String(value || '').trim();
        if (!input) return fallback;
        if (/^#[0-9a-fA-F]{6}$/.test(input)) return hexToRgbTriplet(input);
        if (!__luxColorProbeContext) {
            const probe = document.createElement('canvas');
            probe.width = 1;
            probe.height = 1;
            __luxColorProbeContext = probe.getContext('2d');
        }
        const context = __luxColorProbeContext;
        if (!context) return fallback;
        try {
            context.fillStyle = '#000000';
            context.fillStyle = input;
            const normalized = context.fillStyle || '';
            if (/^#[0-9a-fA-F]{6}$/.test(normalized)) return hexToRgbTriplet(normalized);
            const match = normalized.match(/rgba?\(([^)]+)\)/i);
            if (!match) return fallback;
            return match[1].split(',').slice(0, 3).map((part) => String(Math.round(Number(part.trim()) || 0))).join(',');
        } catch (e) {
            return fallback;
        }
    }

    function sanitizeColorInput(value, fallback = '') {
        const input = String(value || '').trim();
        if (!input) return fallback;
        if (/^#[0-9a-fA-F]{6}$/.test(input)) return input;
        const rgb = colorToRgbTriplet(input, '');
        if (rgb) return rgbTripletToHex(rgb, fallback || '#c8822a');
        return fallback || '#c8822a';
    }

    function blendRgbTriplets(a, b, ratio = 0.5) {
        const mix = Math.max(0, Math.min(1, Number(ratio) || 0));
        const parse = (triplet, fallback) => String(triplet || fallback)
            .split(',')
            .slice(0, 3)
            .map((part, index) => {
                const fallbackParts = String(fallback || '0,0,0').split(',');
                const numeric = Number(part?.trim?.() ?? part);
                return Math.max(0, Math.min(255, Number.isFinite(numeric) ? numeric : Number(fallbackParts[index] || 0)));
            });
        const first = parse(a, '0,0,0');
        const second = parse(b, '0,0,0');
        return [
            Math.round(first[0] + (second[0] - first[0]) * mix),
            Math.round(first[1] + (second[1] - first[1]) * mix),
            Math.round(first[2] + (second[2] - first[2]) * mix)
        ].join(',');
    }

    function getFacultyLuxuryPaletteState(facultyCode = getCurrentFacultyCode()) {
        const normalizedFaculty = String(facultyCode || 'ECON').toUpperCase();
        const fallbackPalette = getPaletteByKey('obsidian-amber'); // Always use default, not faculty-based
        let facultyProfile = null;
        try {
            if (typeof getFacultyProfile === 'function') facultyProfile = getFacultyProfile(normalizedFaculty) || null;
        } catch (e) {}
        const accent = sanitizeColorInput(facultyProfile?.color, fallbackPalette.accent || '#c8822a');
        const nav = sanitizeColorInput(facultyProfile?.navColor, '#091220');
        const accentRgb = colorToRgbTriplet(accent, colorToRgbTriplet(fallbackPalette.accent || '#c8822a'));
        const navRgb = colorToRgbTriplet(nav, '9,18,32');
        const accent2Rgb = blendRgbTriplets(accentRgb, '255,232,188', 0.42);
        return {
            facultyCode: normalizedFaculty,
            paletteKey: fallbackPalette.key,
            accent,
            accent2: rgbTripletToHex(accent2Rgb, fallbackPalette.accent2 || accent),
            accentRgb,
            accent2Rgb,
            nav,
            navRgb,
            shellStartRgb: blendRgbTriplets(navRgb, accentRgb, 0.26),
            shellEndRgb: blendRgbTriplets(navRgb, '4,7,13', 0.34),
            shellGlowRgb: accent2Rgb,
            topbarTintRgb: blendRgbTriplets(navRgb, accentRgb, 0.2),
            glassTintRgb: blendRgbTriplets(navRgb, accentRgb, 0.18),
            hazeRgb: blendRgbTriplets(accentRgb, accent2Rgb, 0.28)
        };
    }

    function isVisualPaletteScopedToFaculty(visuals, facultyCode = getCurrentFacultyCode()) {
        return String(visuals?.paletteFaculty || '').toUpperCase() === String(facultyCode || '').toUpperCase();
    }

    function resolvePaletteKey() {
        const visuals = getDashboardVisuals();
        const stored = visuals?.paletteKey || localStorage.getItem('kiuLuxuryPalette') || localStorage.getItem('kiu-palette');
        if (stored === 'carbon-black' || stored === 'arctic-white') return 'platinum-silver';
        if (stored === 'custom' || isBuiltInLuxuryPaletteKey(stored)) return stored;
        return visuals?.paletteKey || 'ocean-teal'; // Default matches ADVANCED_DEFAULT_VISUALS
    }

    function resolveCustomPalette() {
        const facultyCode = getCurrentFacultyCode();
        const visuals = getDashboardVisuals();
        if (isVisualPaletteScopedToFaculty(visuals, facultyCode) && visuals.customPalette?.accent && visuals.customPalette?.accent2) {
            return visuals.customPalette;
        }
        try {
            if (String(localStorage.getItem('kiuLuxuryCustomPaletteFaculty') || '').toUpperCase() !== facultyCode) return null;
            const raw = localStorage.getItem('kiuLuxuryCustomPalette');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function applyPaletteValues(accent, accent2, persist, key) {
        const root = document.documentElement;
        root.style.setProperty('--lux-accent', accent);
        root.style.setProperty('--lux-accent-2', accent2);
        root.style.setProperty('--lux-accent-rgb', colorToRgbTriplet(accent));

        // === Handle background palette classes ===
        const paletteClasses = ['obsidian-amber', 'slate-sapphire', 'pine-jade', 'burgundy-rose', 'sand-pearl', 'ink-orchid', 'ocean-teal', 'platinum-silver'];

        // Remove all palette classes first
        paletteClasses.forEach(p => document.body.classList.remove(`palette-${p}`));

        // Clear any inline background style
        document.body.style.background = '';

        // Add class if valid preset (NOT 'custom')
        if (key && key !== 'custom' && paletteClasses.includes(key)) {
            document.body.classList.add(`palette-${key}`);
        }

        // Also sync to old utilities.js key for compatibility
        if (persist) {
            localStorage.setItem('kiuLuxuryPalette', key || 'custom');
            localStorage.setItem('kiuLuxuryPaletteFaculty', getCurrentFacultyCode());
            localStorage.setItem('kiu-palette', key); // Sync for utilities.js compatibility
        }
    
        /* Rebuild inline glass backgrounds after palette variables/classes change. */
        if (typeof window.queueLuxuryTransparencyRefresh === 'function') {
            var _palTransVal = getDashboardVisuals().surfaceTransparency || localStorage.getItem('kiuLuxurySurfaceTransparency');
            window.queueLuxuryTransparencyRefresh(_palTransVal);
        }
        if (typeof window.__kiuRefreshLuxuryBackground === 'function') {
            window.__kiuRefreshLuxuryBackground();
        }
}

    function applyPaletteKey(key, persist) {
        const palette = getPaletteByKey(key);
        const lightMode = getThemeMode() === 'light';
        const liveAccent = lightMode && palette.lightAccent ? palette.lightAccent : palette.accent;
        const liveAccent2 = lightMode && (palette.lightAccent2 || palette.lightAccent)
            ? (palette.lightAccent2 || palette.lightAccent)
            : palette.accent2;
        applyPaletteValues(liveAccent, liveAccent2, persist, palette.key);
        if (persist) {
            localStorage.removeItem('kiuLuxuryCustomPalette');
            localStorage.removeItem('kiuLuxuryCustomPaletteFaculty');
            setDashboardVisuals({
                paletteKey: palette.key,
                paletteFaculty: getCurrentFacultyCode(),
                customPalette: null,
                accentColor: palette.accent,
                accentColor2: palette.accent2,
                glassTint: '',
                particleColor: '',
                lineColor: '',
                glowColor: '',
                hazeColor: ''
            });
        }
    }

    function applyCustomPalette(accent, accent2, persist) {
        applyPaletteValues(accent, accent2, persist, 'custom');

        // Remove all palette classes so background reverts to default dark
        const paletteClasses = ['obsidian-amber', 'slate-sapphire', 'pine-jade', 'burgundy-rose', 'sand-pearl', 'ink-orchid', 'ocean-teal', 'platinum-silver'];
        paletteClasses.forEach(p => document.body.classList.remove(`palette-${p}`));

        // Clear inline background style
        document.body.style.background = '';

        if (persist) {
            localStorage.setItem('kiuLuxuryCustomPalette', JSON.stringify({ accent, accent2 }));
            localStorage.setItem('kiuLuxuryCustomPaletteFaculty', getCurrentFacultyCode());
            localStorage.setItem('kiu-palette', 'custom'); // Sync for utilities.js compatibility
            setDashboardVisuals({
                paletteKey: 'custom',
                paletteFaculty: getCurrentFacultyCode(),
                customPalette: { accent, accent2 },
                accentColor: accent,
                accentColor2: accent2,
                glassTint: '',
                particleColor: '',
                lineColor: '',
                glowColor: '',
                hazeColor: ''
            });
        }
    }

    function applyResolvedPalette() {
        const root = document.documentElement;
        const facultyPalette = getFacultyLuxuryPaletteState(getCurrentFacultyCode());
        const visuals = getDashboardVisuals();
        const visualsAreScoped = isVisualPaletteScopedToFaculty(visuals, facultyPalette.facultyCode);
        const palette = getPaletteByKey(visualsAreScoped ? (visuals.paletteKey || facultyPalette.paletteKey) : facultyPalette.paletteKey);
        const custom = visualsAreScoped && visuals.customPalette?.accent ? visuals.customPalette : resolveCustomPalette();
        const lightMode = getThemeMode() === 'light';
        const hasCustomColors = Boolean(custom?.accent) || visuals.paletteKey === 'custom';
        const useLightAccent = lightMode && Boolean(palette.lightAccent) && !hasCustomColors;
        const accent = useLightAccent
            ? palette.lightAccent
            : (visualsAreScoped
                ? (visuals.accentColor || custom?.accent || palette.accent || facultyPalette.accent)
                : facultyPalette.accent);
        const accent2 = useLightAccent
            ? (palette.lightAccent2 || palette.lightAccent)
            : (visualsAreScoped
                ? (visuals.accentColor2 || custom?.accent2 || palette.accent2 || facultyPalette.accent2)
                : facultyPalette.accent2);
        const accentRgb = colorToRgbTriplet(accent, facultyPalette.accentRgb);
        const accent2Rgb = colorToRgbTriplet(accent2, facultyPalette.accent2Rgb || accentRgb);
        const shellStartRgb = visualsAreScoped
            ? (lightMode
                ? blendRgbTriplets('248,240,229', accentRgb, 0.12)
                : blendRgbTriplets(facultyPalette.navRgb, accentRgb, 0.34))
            : facultyPalette.shellStartRgb;
        const shellEndRgb = visualsAreScoped
            ? (lightMode
                ? blendRgbTriplets('255,249,241', accent2Rgb, 0.06)
                : blendRgbTriplets('4,7,13', accentRgb, 0.18))
            : facultyPalette.shellEndRgb;
        const shellGlowRgb = visualsAreScoped
            ? blendRgbTriplets(accentRgb, accent2Rgb, 0.46)
            : facultyPalette.shellGlowRgb;
        const glassTint = visualsAreScoped && visuals.glassTint
            ? visuals.glassTint
            : (lightMode
                ? rgbTripletToHex(blendRgbTriplets('255,255,255', accent2Rgb, visualsAreScoped ? 0.12 : 0.16), '#eadfce')
                : (visualsAreScoped
                    ? rgbTripletToHex(blendRgbTriplets('10,16,28', accentRgb, 0.24), facultyPalette.nav || accent)
                    : facultyPalette.nav));
        const topbarTint = visualsAreScoped
            ? (lightMode
                ? rgbTripletToHex(blendRgbTriplets('246,237,226', accentRgb, 0.16), '#e6d8c6')
                : rgbTripletToHex(blendRgbTriplets('11,18,32', accentRgb, 0.24), facultyPalette.nav || accent))
            : (lightMode
                ? rgbTripletToHex(blendRgbTriplets('246,237,226', facultyPalette.accentRgb, 0.2), '#e6d8c6')
                : facultyPalette.nav);
        const particleColor = visualsAreScoped && visuals.particleColor ? visuals.particleColor : facultyPalette.accent2;
        const lineColor = visualsAreScoped && visuals.lineColor ? visuals.lineColor : facultyPalette.accent;
        const glowColor = visualsAreScoped && visuals.glowColor ? visuals.glowColor : facultyPalette.accent2;
        const hazeColor = visualsAreScoped && visuals.hazeColor ? visuals.hazeColor : facultyPalette.accent;
        root.style.setProperty('--lux-accent', accent);
        root.style.setProperty('--lux-accent-2', accent2);
        root.style.setProperty('--lux-accent-rgb', accentRgb);
        root.style.setProperty('--lux-glass-tint-rgb', colorToRgbTriplet(glassTint, lightMode ? '246,239,229' : '16,23,38'));
        root.style.setProperty('--lux-topbar-tint-rgb', colorToRgbTriplet(topbarTint, lightMode ? '239,228,213' : '11,18,32'));
        const neutralGlassTintByKey = {
            'platinum-silver': lightMode
                ? { glass: '130, 136, 142', topbar: '120, 126, 132' }
                : { glass: '38, 42, 48', topbar: '10, 12, 14' }
        };
        const neutralTint = neutralGlassTintByKey[palette.key];
        if (neutralTint && !hasCustomColors) {
            root.style.setProperty('--lux-glass-tint-rgb', neutralTint.glass);
            root.style.setProperty('--lux-topbar-tint-rgb', neutralTint.topbar);
        }
        root.style.setProperty('--lux-shell-start-rgb', shellStartRgb);
        root.style.setProperty('--lux-shell-end-rgb', shellEndRgb);
        root.style.setProperty('--lux-shell-glow-rgb', shellGlowRgb);
        root.style.setProperty('--lux-home-secondary-rgb', accent2Rgb);
        root.style.setProperty('--lux-bg-particle-rgb', colorToRgbTriplet(particleColor, accent2Rgb));
        root.style.setProperty('--lux-bg-line-rgb', colorToRgbTriplet(lineColor, accentRgb));
        root.style.setProperty('--lux-bg-glow-rgb', colorToRgbTriplet(glowColor, accent2Rgb));
        root.style.setProperty('--lux-bg-haze-rgb', colorToRgbTriplet(hazeColor, accentRgb));
        root.style.setProperty('--kiu-blue', accent);
        root.style.setProperty('--kiu-dark-blue', rgbTripletToHex(shellEndRgb, accent));
        root.style.setProperty('--kiu-navy', rgbTripletToHex(shellEndRgb, accent));
        root.style.setProperty('--kiu-gradient-blue', `linear-gradient(135deg, ${accent} 0%, ${accent2} 100%)`);
        root.style.setProperty('--kiu-shell-gradient', lightMode
            ? `radial-gradient(circle at 16% 10%, rgba(${accentRgb}, 0.12), transparent 30%), radial-gradient(circle at 84% 82%, rgba(${accent2Rgb}, 0.10), transparent 28%), linear-gradient(180deg, rgba(${colorToRgbTriplet(glassTint, '246,239,229')}, 0.96), rgba(${colorToRgbTriplet(glassTint, '246,239,229')}, 0.88))`
            : `radial-gradient(circle at 12% 8%, rgba(${accentRgb}, 0.18), transparent 32%), radial-gradient(circle at 84% 80%, rgba(${accent2Rgb}, 0.12), transparent 30%), radial-gradient(circle at 50% -12%, rgba(${shellGlowRgb}, 0.10), transparent 42%), linear-gradient(180deg, rgba(${shellStartRgb}, 0.42), rgba(${shellEndRgb}, 0.78) 48%, rgba(${shellEndRgb}, 0.98) 100%)`);
        document.body.dataset.luxFaculty = facultyPalette.facultyCode;
        if (typeof window.queueLuxuryTransparencyRefresh === 'function') {
            window.queueLuxuryTransparencyRefresh(getDashboardVisuals().surfaceTransparency || localStorage.getItem('kiuLuxurySurfaceTransparency'));
        }
    }

    function cyclePalette() {
        const currentKey = resolvePaletteKey() === 'custom'
            ? 'obsidian-amber'
            : resolvePaletteKey();
        const currentIndex = Math.max(0, LUXURY_PALETTES.findIndex((palette) => palette.key === currentKey));
        const next = LUXURY_PALETTES[(currentIndex + 1) % LUXURY_PALETTES.length];
        applyPaletteKey(next.key, true);
        syncAll();
        showToast(`Accent palette: ${STUDIO_PALETTES.find(s => s.key === next.key)?.name || next.key}`);
    }

    function applyAtmosphereSettings() {
        const root = document.documentElement;
        const intensity = getBackgroundIntensity();
        const glowPercent = typeof getGlowStrength === 'function' ? getGlowStrength() : 50;
        const lightMode = getThemeMode() === 'light';
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
        const canvasOpacity = lightMode
            ? (intensity === 'high' ? '0.68' : intensity === 'low' ? '0.46' : '0.58')
            : (intensity === 'high' ? '0.96' : intensity === 'low' ? '0.72' : '0.84');
        const overlayOpacity = lightMode
            ? (intensity === 'high' ? '0.22' : intensity === 'low' ? '0.34' : '0.28')
            : (intensity === 'high' ? '0.06' : intensity === 'low' ? '0.16' : '0.11');
        const hazeTop = lightMode
            ? (intensity === 'high' ? '0.02' : intensity === 'low' ? '0.08' : '0.05')
            : (intensity === 'high' ? '0.004' : intensity === 'low' ? '0.014' : '0.008');
        const hazeBottom = lightMode
            ? (intensity === 'high' ? '0.06' : intensity === 'low' ? '0.12' : '0.09')
            : (intensity === 'high' ? '0.1' : intensity === 'low' ? '0.16' : '0.13');
        root.style.setProperty('--lux-canvas-opacity', canvasOpacity);
        root.style.setProperty('--lux-overlay-opacity', overlayOpacity);
        root.style.setProperty('--lux-page-haze-top', hazeTop);
        root.style.setProperty('--lux-page-haze-bottom', hazeBottom);
        root.style.setProperty('--lux-panel-fill-alpha', String(panelFillMin));
        root.style.setProperty('--lux-raised-fill-alpha', String(raisedFillMin));
        root.style.setProperty('--lux-utility-fill-alpha', String(utilityFillMin));
        root.style.setProperty('--lux-glass-highlight-alpha', String(lightMode ? 0.02 : 0.012));
        root.style.setProperty('--lux-glass-blur', lightMode ? '8px' : '8px');
        root.style.setProperty('--lux-topbar-fill-alpha', String(topbarFillMin));
        root.style.setProperty('--lux-topbar-raised-alpha', String(topbarRaisedMin));
        root.style.setProperty('--lux-button-glow', glowConfig.buttonGlow);
        /* PERF/FIX: Respect saved transparency instead of hardcoding 0.03 */
        var _savedTransVal = parseInt(getDashboardVisuals().surfaceTransparency || localStorage.getItem('kiuLuxurySurfaceTransparency') || '13', 10);
        var _panelA = _savedTransVal >= 95 ? (lightMode ? 0.95 : 0.92) : Math.max(0.03, _savedTransVal / 100 * 0.92);
        root.style.setProperty('--lux-panel-glow', glowConfig.panelGlow);
        root.style.setProperty('--lux-glow-scale', glowConfig.glowScale);
        root.style.setProperty('--lux-panel-alpha', String(_panelA));
        root.style.setProperty('--lux-raised-alpha', String(0.012));
        root.style.setProperty('--lux-glass-alpha', String(0.006));
        root.style.setProperty('--lux-card-glow-alpha', glowConfig.cardGlowAlpha);
        root.style.setProperty('--lux-utility-alpha', String(lightMode ? 0.02 : 0.08));
        root.style.setProperty('--lux-grid-row-height', `${HOME_GRID_ROW_HEIGHT}px`);
        document.body.dataset.luxBackgroundIntensity = intensity;
        document.body.dataset.luxGlowStrength = String(glowConfig.percent);
    }

/* Home dashboard geometry — factory peel (home-dashboard-widget-layout-runtime.js). */
    const __homeLayoutApi = typeof window.__kiuCreateHomeDashboardWidgetLayoutApi === "function"
        ? window.__kiuCreateHomeDashboardWidgetLayoutApi({
        HOME_GRID_COLUMNS,
        HOME_GRID_ROW_HEIGHT,
        HOME_WINDOW_SNAP,
        HOME_WINDOW_MIN_WIDTH,
        HOME_WINDOW_MIN_HEIGHT,
        HOME_WIDGET_CONTEXT_CACHE,
        HOME_WIDGET_DEFINITIONS_CACHE,
        ADVANCED_HOME_LAYOUT_VERSION,
        HOME_DEFAULT_WIDGET_GEOMETRY: typeof HOME_DEFAULT_WIDGET_GEOMETRY !== "undefined" ? HOME_DEFAULT_WIDGET_GEOMETRY : window.HOME_DEFAULT_WIDGET_GEOMETRY,
        ROLE_LABELS: typeof ROLE_LABELS !== "undefined" ? ROLE_LABELS : window.ROLE_LABELS,
        getHomeViewportWidthForDesktop: typeof getHomeViewportWidthForDesktop === "function" ? getHomeViewportWidthForDesktop : window.getHomeViewportWidthForDesktop,
        getEffectiveRole: typeof getEffectiveRole === "function" ? getEffectiveRole : window.getEffectiveRole,
        getCurrentFacultyCode: typeof getCurrentFacultyCode === "function" ? getCurrentFacultyCode : window.getCurrentFacultyCode,
        getCurrentUserSafe: typeof getCurrentUserSafe === "function" ? getCurrentUserSafe : window.getCurrentUserSafe,
        getHomeScopeKey: typeof getHomeScopeKey === "function" ? getHomeScopeKey : window.getHomeScopeKey,
        getDashboardPreferenceEntry: typeof getDashboardPreferenceEntry === "function" ? getDashboardPreferenceEntry : window.getDashboardPreferenceEntry,
        normalizeScopeLayoutEntry: typeof normalizeScopeLayoutEntry === "function" ? normalizeScopeLayoutEntry : window.normalizeScopeLayoutEntry,
        getFacultyName: typeof getFacultyName === "function" ? getFacultyName : window.getFacultyName,
        cleanupUiText: typeof cleanupUiText === "function" ? cleanupUiText : window.cleanupUiText,
        getSubjectLabel: typeof getSubjectLabel === "function" ? getSubjectLabel : window.getSubjectLabel,
        getDomainSafe: typeof getDomainSafe === "function" ? getDomainSafe : window.getDomainSafe,
        clampPercent: typeof clampPercent === "function" ? clampPercent : window.clampPercent,
        formatRelativeTime: typeof formatRelativeTime === "function" ? formatRelativeTime : window.formatRelativeTime,
        getStudentScheduleRows: typeof getStudentScheduleRows === "function" ? getStudentScheduleRows : window.getStudentScheduleRows,
        getFacultyScheduleRows: typeof getFacultyScheduleRows === "function" ? getFacultyScheduleRows : window.getFacultyScheduleRows,
        getOrdersSnapshot: typeof getOrdersSnapshot === "function" ? getOrdersSnapshot : window.getOrdersSnapshot,
        getMessengerSnapshot: typeof getMessengerSnapshot === "function" ? getMessengerSnapshot : window.getMessengerSnapshot,
        getNotificationSnapshot: typeof getNotificationSnapshot === "function" ? getNotificationSnapshot : window.getNotificationSnapshot,
        getRecentHomeUpdates: typeof getRecentHomeUpdates === "function" ? getRecentHomeUpdates : window.getRecentHomeUpdates,
        getStudentPerformanceMetric: typeof getStudentPerformanceMetric === "function" ? getStudentPerformanceMetric : window.getStudentPerformanceMetric,
        getStudentScoreRows: typeof getStudentScoreRows === "function" ? getStudentScoreRows : window.getStudentScoreRows,
        getOrderRowsForWidget: typeof getOrderRowsForWidget === "function" ? getOrderRowsForWidget : window.getOrderRowsForWidget,
        getMessengerRowsForWidget: typeof getMessengerRowsForWidget === "function" ? getMessengerRowsForWidget : window.getMessengerRowsForWidget,
        getStudentRequestRowsForWidget: typeof getStudentRequestRowsForWidget === "function" ? getStudentRequestRowsForWidget : window.getStudentRequestRowsForWidget,
        getTicketRowsForWidget: typeof getTicketRowsForWidget === "function" ? getTicketRowsForWidget : window.getTicketRowsForWidget,
        getArticleRowsForWidget: typeof getArticleRowsForWidget === "function" ? getArticleRowsForWidget : window.getArticleRowsForWidget,
        getAttendanceRowsForWidget: typeof getAttendanceRowsForWidget === "function" ? getAttendanceRowsForWidget : window.getAttendanceRowsForWidget,
        getGradebookRowsForWidget: typeof getGradebookRowsForWidget === "function" ? getGradebookRowsForWidget : window.getGradebookRowsForWidget,
        getAdminStudentRows: typeof getAdminStudentRows === "function" ? getAdminStudentRows : window.getAdminStudentRows,
        getCurrentFacultyOrders: typeof getCurrentFacultyOrders === "function" ? getCurrentFacultyOrders : window.getCurrentFacultyOrders,
        sanitizeShortcutDefinition: typeof sanitizeShortcutDefinition === "function" ? sanitizeShortcutDefinition : window.sanitizeShortcutDefinition,
        serializeHomeLayout: window.serializeHomeLayout,
        resolveHomeLayout: window.resolveHomeLayout,
        getActiveCurriculum: typeof getActiveCurriculum === "function" ? getActiveCurriculum : window.getActiveCurriculum,
        getAllStudents: typeof getAllStudents === "function" ? getAllStudents : window.getAllStudents,
        getCurrentStudentSemesterNumber: typeof getCurrentStudentSemesterNumber === "function" ? getCurrentStudentSemesterNumber : window.getCurrentStudentSemesterNumber,
        getStudentCompletedEctsTotal: typeof getStudentCompletedEctsTotal === "function" ? getStudentCompletedEctsTotal : window.getStudentCompletedEctsTotal,
        getEffectiveTuitionBalance: typeof getEffectiveTuitionBalance === "function" ? getEffectiveTuitionBalance : window.getEffectiveTuitionBalance,
        getCurrentFacultyScheduleItems: typeof getCurrentFacultyScheduleItems === "function" ? getCurrentFacultyScheduleItems : window.getCurrentFacultyScheduleItems,
        ensureAdminExamState: typeof ensureAdminExamState === "function" ? ensureAdminExamState : window.ensureAdminExamState,
        ensureStudentServiceStores: typeof ensureStudentServiceStores === "function" ? ensureStudentServiceStores : window.ensureStudentServiceStores,
        })
        : {};
    const {
        sanitizeGridInteger,
        normalizeWidgetWidth,
        normalizeWidgetHeight,
        normalizeWidgetX,
        normalizeWidgetY,
        clampNumber,
        getDesktopCanvasMetrics,
        toDesktopPixelWidth,
        toDesktopPixelHeight,
        toGridWidthFromPixels,
        toGridHeightFromPixels,
        getWidgetMinDesktopWidth,
        getWidgetMaxDesktopWidth,
        getWidgetMinDesktopHeight,
        getWidgetMaxDesktopHeight,
        normalizeDesktopRect,
        gridRectToDesktopRect,
        getWidgetDesktopRect,
        desktopRectToGridRect,
        getHighestWidgetZIndex,
        normalizeLayoutZIndices,
        sortLayoutForCanvas,
        computeDesktopCanvasHeight,
        desktopRectsOverlap,
        getWidgetOverlapIds,
        findNextDesktopRect,
        buildPairListRows,
        cloneLayoutWidgets,
        widgetsOverlap,
        createWidgetInstance,
        createShortcutWidgetInstance,
        createPinnedWidgetInstance,
        normalizeStoredLayoutWidget,
        findNextAvailableSlot,
        stabilizeLayout,
        stepWidgetSize,
        buildHomeWidgetContextUncached,
        buildHomeWidgetContext,
        withGeometry,
        buildSystemWidgetDefinitionsUncached,
        sanitizeWidgetRowText,
        sanitizeWidgetDefinitionText,
        buildSystemWidgetDefinitions,
        buildHomeWidgetDefinitions,
        buildPinnedRecordOptions,
        resolveHomeLayout,
        serializeHomeLayout,
        resolveSavedHomeLayout,
        deserializeScopedWidgets,
        getScopeLayoutSource,
        getWidgetPresentationMetrics,
        resolvePresentationWidgetWidth,
        resolvePresentationWidgetHeight,
        buildPresentationLayout,
    } = __homeLayoutApi;

/* Home dashboard editor draft/save helpers. */

function ensureHomeEditorCss() {
    if (typeof document === 'undefined') return Promise.resolve();
    const existing = document.querySelector('link[data-kiu-home-editor-css]');
    if (existing) {
        if (existing.sheet || existing.dataset.kiuReady === '1') return Promise.resolve();
        return new Promise((resolve) => {
            existing.addEventListener('load', () => resolve(), { once: true });
            existing.addEventListener('error', () => resolve(), { once: true });
        });
    }
    return new Promise((resolve) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'assets/css/index-home-editor.css?v=20260720-dedupe2';
        link.setAttribute('data-kiu-home-editor-css', '1');
        link.addEventListener('load', () => {
            link.dataset.kiuReady = '1';
            resolve();
        }, { once: true });
        link.addEventListener('error', () => resolve(), { once: true });
        document.head.appendChild(link);
    });
}


    getWorkingHomeLayout = function (role, model) {
        if (HOME_EDITOR_STATE.editing && HOME_EDITOR_STATE.role === role && Array.isArray(HOME_EDITOR_STATE.draftLayout)) {
            return HOME_EDITOR_STATE.draftLayout;
        }
        return resolveSavedHomeLayout(role, model);
    };

    ensureHomeEditorDraft = function (role, model) {
        HOME_EDITOR_STATE.editing = true;
        HOME_EDITOR_STATE.role = role;
        HOME_EDITOR_STATE.scopeKey = getHomeScopeKey(role, getCurrentFacultyCode());
        HOME_EDITOR_STATE.availablePins = buildPinnedRecordOptions(role, model);
        // Load the editable workspace layout here so the inspector preserves the real
        // widget positions and sizes the user just arranged.
        HOME_EDITOR_STATE.draftLayout = normalizeLayoutZIndices(cloneLayoutWidgets(resolveHomeLayout(role, model)));
        HOME_EDITOR_STATE.inspectorState = getSavedInspectorState(HOME_EDITOR_STATE.scopeKey);
        HOME_EDITOR_STATE.inspectorDragState = null;
        HOME_EDITOR_STATE.selectedWidgetId = '';
    };

    stopHomeEditor = function ({ message = '', refresh = true } = {}) {
        clearHomeEditorState();
        if (message) showToast(message);
        if (refresh) {
            renderHomeShell();
            if (typeof syncTopbar === 'function') syncTopbar();
        }
    };

    saveHomeEditor = function (role) {
        const scopeKey = getHomeScopeKey(role, getCurrentFacultyCode());
        const inspectorState = sanitizeInspectorState(HOME_EDITOR_STATE.inspectorState || getSavedInspectorState(scopeKey));
        const workspaceWidgets = serializeHomeLayout(HOME_EDITOR_STATE.draftLayout);
        const presentationWidgets = serializeHomeLayout(HOME_EDITOR_STATE.draftLayout);
        updateDashboardPreferenceEntry((entry) => {
            entry.layoutsByScope[scopeKey] = {
                version: ADVANCED_HOME_LAYOUT_VERSION,
                workspaceWidgets,
                presentationWidgets
            };
            entry.editorUiByScope = entry.editorUiByScope || {};
            entry.editorUiByScope[scopeKey] = inspectorState;
            delete entry.layoutsByRole[role];
            delete entry.customShortcutsByRole[role];
        }, { persist: true });
        stopHomeEditor({ message: `${ROLE_LABELS[role] || 'Dashboard'} saved for ${getFacultyName(getCurrentFacultyCode())}.`, refresh: false });
        syncAll();
    };

    resetCurrentRoleLayoutDraft = function (role, model) {
        HOME_EDITOR_STATE.availablePins = buildPinnedRecordOptions(role, model);
        HOME_EDITOR_STATE.draftLayout = cloneLayoutWidgets(resolveHomeLayout(role, model, []));
        HOME_EDITOR_STATE.inspectorState = getSavedInspectorState(getHomeScopeKey(role, getCurrentFacultyCode()));
        HOME_EDITOR_STATE.selectedWidgetId = '';
        renderHomeShell();
        showToast(`${ROLE_LABELS[role] || 'Dashboard'} reset to KIU defaults for this faculty.`);
    };

    updateDraftWidget = function (instanceId, mutator, { stabilize = true, priority = instanceId, render = true } = {}) {
        if (!HOME_EDITOR_STATE.editing || !Array.isArray(HOME_EDITOR_STATE.draftLayout)) return;
        HOME_EDITOR_STATE.draftLayout = HOME_EDITOR_STATE.draftLayout.map((widget) => {
            if (widget.instanceId !== instanceId) return widget;
            const next = { ...widget };
            mutator(next);
            next.w = normalizeWidgetWidth(next.w, widget.w, next.minW || widget.minW || 2, next.maxW || widget.maxW || HOME_GRID_COLUMNS);
            next.h = normalizeWidgetHeight(next.h, widget.h, next.minH || widget.minH || 3, next.maxH || widget.maxH || 12);
            next.x = normalizeWidgetX(next.x, next.w, widget.x);
            next.y = normalizeWidgetY(next.y, widget.y);
            return next;
        });
        if (stabilize) HOME_EDITOR_STATE.draftLayout = stabilizeLayout(HOME_EDITOR_STATE.draftLayout, priority);
        if (render) renderHomeShell();
    };

    function getSelectedDraftWidget(layout = HOME_EDITOR_STATE.draftLayout) {
        const visible = sortLayoutForDisplay(layout).filter((widget) => widget.visible !== false);
        if (!visible.length) return null;
        if (!HOME_EDITOR_STATE.selectedWidgetId) return null;
        return visible.find((widget) => widget.instanceId === HOME_EDITOR_STATE.selectedWidgetId) || null;
    }

    function setSelectedDraftWidget(instanceId, { render = false, bringToFront = false } = {}) {
        const visible = sortLayoutForDisplay(HOME_EDITOR_STATE.draftLayout).filter((widget) => widget.visible !== false);
        HOME_EDITOR_STATE.selectedWidgetId = instanceId
            ? (visible.find((widget) => widget.instanceId === instanceId)?.instanceId || '')
            : '';
        if (bringToFront && HOME_EDITOR_STATE.selectedWidgetId) {
            bringDraftWidgetToFront(HOME_EDITOR_STATE.selectedWidgetId, { render: false });
        }
        if (render) {
            renderHomeShell();
            return;
        }
        const homeShell = document.getElementById('lux-home-shell');
        if (!homeShell) return;
        const selectedId = HOME_EDITOR_STATE.selectedWidgetId;
        homeShell.querySelectorAll('[data-widget-id].is-selected').forEach((node) => {
            node.classList.remove('is-selected');
        });
        homeShell.querySelectorAll('[data-widget-select].is-active').forEach((node) => {
            node.classList.remove('is-active');
        });
        if (!selectedId) return;
        const widgetEl = homeShell.querySelector(`[data-widget-id="${CSS.escape(selectedId)}"]`);
        widgetEl?.classList.add('is-selected');
        homeShell.querySelectorAll(`[data-widget-select="${CSS.escape(selectedId)}"]`).forEach((node) => {
            node.classList.add('is-active');
        });
    }

    function setDraftWidgetDimensions(instanceId, values, { render = true } = {}) {
        const widget = HOME_EDITOR_STATE.draftLayout?.find((item) => item.instanceId === instanceId);
        if (!widget) return;
        setSelectedDraftWidget(instanceId, { render: false });
        const metrics = getDesktopCanvasMetrics(getHomeViewportWidthForDesktop());
        const desktopEditor = isDesktopHomeEditorViewport();
        const nextRect = desktopEditor
            ? normalizeDesktopRect(widget, {
                left: values?.left ?? values?.x ?? (widget.desktopRect?.left ?? gridRectToDesktopRect(widget, metrics.width).left),
                top: values?.top ?? values?.y ?? (widget.desktopRect?.top ?? gridRectToDesktopRect(widget, metrics.width).top),
                width: values?.width != null
                    ? values.width
                    : toDesktopPixelWidth(values?.w ?? widget.w, metrics),
                height: values?.height != null
                    ? values.height
                    : toDesktopPixelHeight(values?.h ?? widget.h, metrics)
            }, metrics.width)
            : normalizeWidgetRect(widget, {
                x: values?.x ?? widget.x,
                y: values?.y ?? widget.y,
                w: values?.w ?? (values?.width != null ? toGridWidthFromPixels(values.width, widget, metrics) : widget.w),
                h: values?.h ?? (values?.height != null ? toGridHeightFromPixels(values.height, widget, metrics) : widget.h)
            });
        updateDraftWidget(instanceId, (next) => {
            if (desktopEditor) {
                const gridRect = desktopRectToGridRect(next, nextRect, metrics.width);
                next.x = gridRect.x;
                next.y = gridRect.y;
                next.w = gridRect.w;
                next.h = gridRect.h;
                next.desktopRect = { ...nextRect };
                next.restoreDesktopRect = { ...nextRect };
                next.desktopRectViewportWidth = metrics.width;
                next.restoreDesktopRectViewportWidth = metrics.width;
            } else {
                next.x = nextRect.x;
                next.y = nextRect.y;
                next.w = nextRect.w;
                next.h = nextRect.h;
                next.desktopRect = null;
                next.restoreDesktopRect = null;
            }
            if (!next.minimized) {
                next.restoreRect = { ...(next.restoreRect || {}), x: next.x, y: next.y, w: next.w, h: next.h };
            }
        }, { render, stabilize: true, priority: instanceId });
    }

    function setDraftWidgetDimension(instanceId, axis, value, { render = true } = {}) {
        const widget = HOME_EDITOR_STATE.draftLayout?.find((item) => item.instanceId === instanceId);
        if (!widget) return;
        setDraftWidgetDimensions(instanceId, axis === 'h' ? { h: value } : { w: value }, { render });
    }

    function applyDesktopRectToDraftWidget(next, rect, viewportWidth = 0) {
        const desktopRect = normalizeDesktopRect(next, rect, viewportWidth);
        const gridRect = desktopRectToGridRect(next, desktopRect, viewportWidth);
        next.desktopRect = desktopRect;
        next.x = gridRect.x;
        next.y = gridRect.y;
        next.w = gridRect.w;
        next.h = gridRect.h;
        next.desktopRectViewportWidth = viewportWidth || getHomeViewportWidthForDesktop();
        next.restoreDesktopRectViewportWidth = next.desktopRectViewportWidth;
    }

    function bringDraftWidgetToFront(instanceId, { render = true } = {}) {
        const widget = HOME_EDITOR_STATE.draftLayout?.find((item) => item.instanceId === instanceId);
        if (!widget) return;
        updateDraftWidget(instanceId, (next) => {
            next.zIndex = getHighestWidgetZIndex(HOME_EDITOR_STATE.draftLayout) + 1;
        }, { stabilize: false, render });
    }

    moveDraftWidget = function (sourceId, targetId) {
        if (!HOME_EDITOR_STATE.editing || !Array.isArray(HOME_EDITOR_STATE.draftLayout) || sourceId === targetId) return;
        const source = HOME_EDITOR_STATE.draftLayout.find((widget) => widget.instanceId === sourceId);
        const target = HOME_EDITOR_STATE.draftLayout.find((widget) => widget.instanceId === targetId);
        if (!source || !target) return;
        const nextSourceY = target.y;
        const nextTargetY = source.y;
        HOME_EDITOR_STATE.draftLayout = HOME_EDITOR_STATE.draftLayout.map((widget) => {
            if (widget.instanceId === sourceId) return { ...widget, y: nextSourceY };
            if (widget.instanceId === targetId) return { ...widget, y: nextTargetY };
            return widget;
        });
        HOME_EDITOR_STATE.draftLayout = stabilizeLayout(HOME_EDITOR_STATE.draftLayout, sourceId);
        renderHomeShell();
    };

    function nudgeDraftWidget(instanceId, direction) {
        const visible = (HOME_EDITOR_STATE.draftLayout || []).filter((widget) => widget.visible !== false).slice().sort((a, b) => a.y - b.y || a.x - b.x);
        const index = visible.findIndex((widget) => widget.instanceId === instanceId);
        if (index === -1) return;
        const swapIndex = index + direction;
        if (swapIndex < 0 || swapIndex >= visible.length) return;
        moveDraftWidget(visible[index].instanceId, visible[swapIndex].instanceId);
    }

    function setDraftWidgetSize(instanceId, axis, direction) {
        const widget = HOME_EDITOR_STATE.draftLayout?.find((item) => item.instanceId === instanceId);
        if (!widget) return;
        setSelectedDraftWidget(instanceId, { render: false });
        if (isDesktopHomeEditorViewport()) {
            const viewportWidth = getHomeViewportWidthForDesktop();
            const rect = getWidgetDesktopRect(widget, viewportWidth);
            const metrics = getDesktopCanvasMetrics(viewportWidth);
            const widthStep = Math.max(HOME_WINDOW_SNAP * 2, Math.round(metrics.cellWidth + metrics.gapX));
            const heightStep = Math.max(HOME_WINDOW_SNAP * 2, Math.round(metrics.rowHeight + metrics.gapY));
            setDraftWidgetDimensions(instanceId, axis === 'w'
                ? { width: rect.width + (direction > 0 ? widthStep : -widthStep) }
                : { height: rect.height + (direction > 0 ? heightStep : -heightStep) });
            return;
        }
        const nextRect = resolveNearestOpenRect(HOME_EDITOR_STATE.draftLayout, instanceId, {
            x: widget.x,
            y: widget.y,
            w: axis === 'w' ? stepWidgetSize(widget, 'w', direction) : widget.w,
            h: axis === 'h' ? stepWidgetSize(widget, 'h', direction) : widget.h
        });
        updateDraftWidget(instanceId, (next) => {
            next.x = nextRect.x;
            next.y = nextRect.y;
            next.w = nextRect.w;
            next.h = nextRect.h;
            next.desktopRect = null;
            next.restoreDesktopRect = null;
            if (!next.minimized) {
                next.restoreRect = { ...(next.restoreRect || {}), x: nextRect.x, y: nextRect.y, w: nextRect.w, h: nextRect.h };
            }
        }, { priority: instanceId });
    }

    function toggleDraftWidgetMinimize(instanceId) {
        const widget = HOME_EDITOR_STATE.draftLayout?.find((item) => item.instanceId === instanceId);
        if (!widget) return;
        setSelectedDraftWidget(instanceId, { render: false });
        updateDraftWidget(instanceId, (next) => {
            if (next.minimized) {
                next.minimized = false;
                if (next.restoreDesktopRect) {
                    applyDesktopRectToDraftWidget(next, next.restoreDesktopRect, getHomeViewportWidthForDesktop());
                }
                if (next.restoreRect) {
                    next.x = normalizeWidgetX(next.restoreRect.x, next.restoreRect.w || next.w, next.x);
                    next.y = normalizeWidgetY(next.restoreRect.y, next.y);
                    next.w = normalizeWidgetWidth(next.restoreRect.w, next.w, next.minW || 2, next.maxW || HOME_GRID_COLUMNS);
                    next.h = normalizeWidgetHeight(next.restoreRect.h, next.h, next.minH || 3, next.maxH || 12);
                }
            } else {
                next.restoreRect = { x: next.x, y: next.y, w: next.w, h: next.h };
                next.restoreDesktopRect = next.desktopRect ? { ...next.desktopRect } : getWidgetDesktopRect(next, getHomeViewportWidthForDesktop());
                next.minimized = true;
                next.w = normalizeWidgetWidth(Math.min(3, next.w), Math.min(3, next.w), 2, next.maxW || HOME_GRID_COLUMNS);
                next.h = 2;
                if (isDesktopHomeEditorViewport()) {
                    applyDesktopRectToDraftWidget(next, {
                        left: next.restoreDesktopRect?.left ?? 0,
                        top: next.restoreDesktopRect?.top ?? 0,
                        width: Math.min(280, next.restoreDesktopRect?.width || 280),
                        height: 112
                    }, getHomeViewportWidthForDesktop());
                }
            }
        });
    }

    function normalizeWidgetRect(widget, values = {}) {
        const width = normalizeWidgetWidth(values.w ?? widget.w, widget.w, widget.minW || 2, widget.maxW || HOME_GRID_COLUMNS);
        const height = normalizeWidgetHeight(values.h ?? widget.h, widget.h, widget.minH || 3, widget.maxH || 12);
        return {
            x: normalizeWidgetX(values.x ?? widget.x, width, widget.x),
            y: normalizeWidgetY(values.y ?? widget.y, widget.y),
            w: width,
            h: height
        };
    }

    function resolveNearestOpenRect(layout, widgetId, proposed) {
        const widget = (layout || []).find((item) => item.instanceId === widgetId);
        if (!widget) return proposed;
        const candidate = normalizeWidgetRect(widget, proposed);
        const others = (layout || []).filter((item) => item.visible !== false && item.instanceId !== widgetId);
        if (!others.some((other) => widgetsOverlap({ ...candidate, instanceId: widgetId, visible: true }, other))) return candidate;
        let best = null;
        let bestScore = Number.POSITIVE_INFINITY;
        const maxRow = Math.max(
            candidate.y + 28,
            widget.y + widget.h + 18,
            ...others.map((other) => other.y + other.h + 10),
            24
        );
        for (let row = 1; row <= maxRow; row += 1) {
            for (let col = 1; col <= (HOME_GRID_COLUMNS - candidate.w + 1); col += 1) {
                const test = { instanceId: widgetId, visible: true, x: col, y: row, w: candidate.w, h: candidate.h };
                if (others.some((other) => widgetsOverlap(test, other))) continue;
                const score = Math.abs(col - candidate.x) * 3 + Math.abs(row - candidate.y) + (row > candidate.y ? 0.2 : 0);
                if (!best || score < bestScore) {
                    best = { x: col, y: row, w: candidate.w, h: candidate.h };
                    bestScore = score;
                }
            }
        }
        if (best) return best;
        return {
            x: 1,
            y: Math.max(1, ...others.map((other) => other.y + other.h + 1)),
            w: candidate.w,
            h: candidate.h
        };
    }

    function setInspectorState(values, { persist = true, render = true } = {}) {
        const scopeKey = HOME_EDITOR_STATE.scopeKey || getHomeScopeKey();
        const nextState = sanitizeInspectorState({
            ...(HOME_EDITOR_STATE.inspectorState || getSavedInspectorState(scopeKey)),
            ...(values || {})
        });
        HOME_EDITOR_STATE.inspectorState = nextState;
        if (persist) setSavedInspectorState(nextState, scopeKey, true);
        if (render) renderHomeShell();
        return nextState;
    }

    hideDraftWidget = function (widget) {
        if (!widget || !HOME_EDITOR_STATE.editing) return;
        if (widget.softLock && !window.confirm(`Hide "${widget.label}" from this dashboard? You can restore it later from the widget library.`)) return;
        if (widget.sourceType === 'system') {
            HOME_EDITOR_STATE.draftLayout = HOME_EDITOR_STATE.draftLayout.map((item) => (
                item.instanceId === widget.instanceId ? { ...item, visible: false } : item
            ));
        } else {
            HOME_EDITOR_STATE.draftLayout = HOME_EDITOR_STATE.draftLayout.filter((item) => item.instanceId !== widget.instanceId);
        }
        HOME_EDITOR_STATE.draftLayout = stabilizeLayout(HOME_EDITOR_STATE.draftLayout);
        if (HOME_EDITOR_STATE.selectedWidgetId === widget.instanceId) {
            HOME_EDITOR_STATE.selectedWidgetId = sortLayoutForDisplay(HOME_EDITOR_STATE.draftLayout).find((item) => item.visible !== false)?.instanceId || '';
        }
        renderHomeShell();
    };

    restoreDraftWidget = function (widgetId, role, model) {
        const definition = buildSystemWidgetDefinitions(role, model).find((item) => item.widgetId === widgetId);
        if (!definition) return;
        const existing = HOME_EDITOR_STATE.draftLayout.find((item) => item.widgetId === widgetId && item.sourceType === 'system');
        if (existing) {
            updateDraftWidget(existing.instanceId, (next) => {
                const resolved = resolveNearestOpenRect(HOME_EDITOR_STATE.draftLayout, existing.instanceId, definition);
                next.visible = true;
                next.minimized = false;
                next.x = resolved.x;
                next.y = resolved.y;
                next.w = resolved.w;
                next.h = resolved.h;
                next.zIndex = getHighestWidgetZIndex(HOME_EDITOR_STATE.draftLayout) + 1;
            });
            setSelectedDraftWidget(existing.instanceId, { render: false });
            return;
        }
        const widget = createWidgetInstance(definition, { visible: true });
        const slot = resolveNearestOpenRect(HOME_EDITOR_STATE.draftLayout, widget.instanceId, widget);
        HOME_EDITOR_STATE.draftLayout.push({ ...widget, ...slot, minimized: false, zIndex: getHighestWidgetZIndex(HOME_EDITOR_STATE.draftLayout) + 1 });
        HOME_EDITOR_STATE.draftLayout = stabilizeLayout(HOME_EDITOR_STATE.draftLayout, definition.widgetId);
        HOME_EDITOR_STATE.selectedWidgetId = widget.instanceId;
        renderHomeShell();
    };

    createDraftShortcut = function (role, values) {
        const widget = createShortcutWidgetInstance(values, role);
        if (!widget) return;
        const slot = findNextAvailableSlot(HOME_EDITOR_STATE.draftLayout, widget.w, widget.h);
        HOME_EDITOR_STATE.draftLayout.push({ ...widget, ...slot, zIndex: getHighestWidgetZIndex(HOME_EDITOR_STATE.draftLayout) + 1 });
        HOME_EDITOR_STATE.draftLayout = stabilizeLayout(HOME_EDITOR_STATE.draftLayout, widget.instanceId);
        HOME_EDITOR_STATE.selectedWidgetId = widget.instanceId;
        renderHomeShell();
        showToast(`Added shortcut: ${widget.label}`);
    };

    function createDraftPinnedWidget(spec) {
        const widget = createPinnedWidgetInstance(spec);
        if (!widget) return;
        const slot = findNextAvailableSlot(HOME_EDITOR_STATE.draftLayout, widget.w, widget.h);
        HOME_EDITOR_STATE.draftLayout.push({ ...widget, ...slot, zIndex: getHighestWidgetZIndex(HOME_EDITOR_STATE.draftLayout) + 1 });
        HOME_EDITOR_STATE.draftLayout = stabilizeLayout(HOME_EDITOR_STATE.draftLayout, widget.instanceId);
        HOME_EDITOR_STATE.selectedWidgetId = widget.instanceId;
        renderHomeShell();
        showToast(`Pinned: ${widget.label}`);
    }

/* Home dashboard widget markup renderers. */
    function renderListRowsMarkup(rows) {
        return ((rows && rows.length) ? rows : [{ icon: 'fas fa-circle-info', title: 'Nothing new yet', copy: 'Open the related workspace to start activity here.' }]).map((row) => `
            <div class="lux-list-row lux-soft-chrome home-hover-chip">
                <i class="${escapeHtml(row.icon || 'fas fa-circle')}"></i>
                <div>
                    <strong>${escapeHtml(row.title || 'Portal update')}</strong>
                    <span>${escapeHtml(row.copy || '')}</span>
                </div>
            </div>
        `).join('');
    }

    function renderQuickTilesMarkup(tiles) {
        return ((tiles && tiles.length) ? tiles : []).map((tile) => `
            <button class="lux-quick-btn lux-soft-chrome" type="button" data-nav-target="${escapeHtml(tile.pageId)}">
                <div class="lux-quick-top">
                    <div class="icon"><i class="${escapeHtml(tile.icon)}"></i></div>
                    <div class="lux-quick-meta-badge">${escapeHtml(tile.meta || 'Workspace')}</div>
                </div>
                <strong>${escapeHtml(tile.label)}</strong>
                <span>${escapeHtml(tile.copy || '')}</span>
                <div class="lux-quick-bottom">
                    <div class="lux-quick-meter"><span style="width:${clampPercent(tile.progress, 0)}%"></span></div>
                    <em>${escapeHtml(tile.status || 'Open workspace')}</em>
                </div>
            </button>
        `).join('');
    }

    function renderAdminOpsMarkup(config) {
        if (!config || !Array.isArray(config.groups) || !config.groups.length) return '';
        return `
            <section class="lux-panel lux-admin-ops-panel lux-soft-chrome">
                <div class="lux-card-head lux-admin-ops-head">
                    <div>
                        <div class="lux-card-title">${escapeHtml(config.title || 'Admin operations')}</div>
                        <div class="lux-admin-ops-copy">${escapeHtml(config.copy || '')}</div>
                    </div>
                    <button class="lux-secondary-btn" type="button" data-nav-target="admin-tools">Open full tools page</button>
                </div>
                <div class="lux-admin-ops-grid">
                    ${config.groups.map((group) => `
                        <div class="lux-admin-op-card lux-soft-chrome">
                            <div class="lux-admin-op-head">
                                <strong>${escapeHtml(group.title || 'Operations')}</strong>
                                <span>${escapeHtml(group.copy || '')}</span>
                            </div>
                            <div class="lux-admin-op-actions">
                                ${(group.buttons || []).map((button) => {
                                    if (button.type === 'provision') {
                                        return `<button class="lux-admin-op-btn" type="button" data-admin-provision="${escapeHtml(button.role)}"><i class="${escapeHtml(button.icon || 'fas fa-plus')}"></i><span>${escapeHtml(button.label)}</span></button>`;
                                    }
                                    if (button.type === 'focus') {
                                        return `<button class="lux-admin-op-btn" type="button" data-admin-focus="${escapeHtml(button.focus)}"><i class="${escapeHtml(button.icon || 'fas fa-layer-group')}"></i><span>${escapeHtml(button.label)}</span></button>`;
                                    }
                                    return `<button class="lux-admin-op-btn" type="button" data-nav-target="${escapeHtml(button.pageId)}"><i class="${escapeHtml(button.icon || 'fas fa-arrow-right')}"></i><span>${escapeHtml(button.label)}</span></button>`;
                                }).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    }

    function renderHeroFocusAsideMarkup(heroAside) {
        const aside = heroAside || {};
        const kicker = aside.kicker || 'Live overview';
        const chip = aside.chip || 'Status';
        const headline = aside.headline || '—';
        const copy = aside.copy || '';
        const meta = aside.meta && typeof aside.meta === 'object' ? aside.meta : { icon: 'fa-circle-dot', text: '' };

        return `
                    <aside class="lms-hero-focus lux-hero-side lux-focus-panel lux-soft-chrome home-hover-chip" aria-label="${escapeHtml(kicker)}">
                        <div class="lms-hero-focus-head">
                            <div class="lms-hero-focus-kicker">${escapeHtml(kicker)}</div>
                            <span class="lms-hero-focus-chip" aria-label="Status">${escapeHtml(chip)}</span>
                        </div>
                        <div class="lms-hero-focus-body">
                            <div class="lms-hero-focus-title">${escapeHtml(headline)}</div>
                            <p class="lms-hero-focus-copy">${escapeHtml(copy)}</p>
                        </div>
                        <div class="lms-hero-focus-meta">
                            <span><i class="fas ${escapeHtml(meta.icon || 'fa-circle-dot')}"></i> ${escapeHtml(meta.text || '')}</span>
                        </div>
                    </aside>`;
    }



    function renderHeroWidgetMarkup(heroModel, role) {
        const model = heroModel || buildHomeModel(role);
        return `
            <section class="lux-panel lux-hero lux-builder-hero page-hero lux-soft-chrome lux-summary-surface--hero">
                <div class="lux-hero-stage">
                    <div class="lux-hero-main">
                        <div class="lux-kicker">${escapeHtml(model.kicker || ROLE_LABELS[role] || 'Portal View')}</div>
                        <h1 class="page-hero-title">${escapeHtml(model.title)}</h1>
                        <p class="page-hero-copy">${escapeHtml(model.copy)}</p>
                        <div class="lux-pill-row">
                            ${(model.pills || []).map((pill) => `<span class="lux-pill lux-soft-chrome home-hover-chip">${escapeHtml(pill)}</span>`).join('')}
                        </div>
                        <div class="lux-hero-actions">
                            ${(model.actions || []).map(([pageId, label], index) => `
                                <button class="${index === 0 ? 'lux-primary-btn' : index === 1 ? 'lux-secondary-btn' : 'lux-ghost-btn'}" type="button" data-nav-target="${escapeHtml(pageId)}">${escapeHtml(label)}</button>
                            `).join('')}
                        </div>
                    </div>
                    ${renderHeroFocusAsideMarkup(model.heroAside)}
                </div>
                <div class="lux-stat-row">
                    ${(model.stats || []).map(([value, label]) => `<div class="lux-stat lux-soft-chrome home-hover-chip"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`).join('')}
                </div>
            </section>
        `;
    }

    function renderWidgetContent(widget, role) {
        if (widget.renderType === 'alert') {
            if (!widget.alert) return '';
            const alertTone = ['green', 'royal', 'support', 'warm'].includes(widget.alert.tone) ? ` is-${widget.alert.tone}` : '';
            return `
                <div class="lux-panel lux-soft-chrome lux-alert${alertTone}">
                    <div class="lux-alert-icon"><i class="${escapeHtml(widget.alert.icon)}"></i></div>
                    <div class="lux-alert-copy">
                        <strong>${escapeHtml(widget.alert.title)}</strong>
                        <span>${escapeHtml(widget.alert.copy)}</span>
                    </div>
                    <button class="lux-primary-btn" type="button" data-nav-target="${escapeHtml(widget.alert.actionPage)}">${escapeHtml(widget.alert.actionLabel)}</button>
                </div>
            `;
        }
        if (widget.renderType === 'hero') return renderHeroWidgetMarkup(widget.heroModel, role);
        if (widget.renderType === 'quick') {
            return `
                <section class="lux-panel lux-dashboard-section lux-builder-section lux-soft-chrome">
                    <div class="lux-card-head">
                        <div>
                            <div class="lux-card-title">${escapeHtml(widget.title)}</div>
                            <div class="lux-builder-copy">${escapeHtml(widget.copy || '')}</div>
                        </div>
                        <div class="lux-card-meta">${escapeHtml(widget.meta || '')}</div>
                    </div>
                    <div class="lux-quick-grid lux-quick-grid--embedded">${renderQuickTilesMarkup(widget.tiles)}</div>
                </section>
            `;
        }
        if (widget.renderType === 'admin-ops') return renderAdminOpsMarkup(widget.adminOperations);
        if (widget.renderType === 'shortcut' || widget.renderType === 'pinned') {
            return `
                <section class="lux-panel lux-card lux-builder-card lux-soft-chrome">
                    <div class="lux-shortcut-head">
                        <div class="lux-shortcut-icon"><i class="${escapeHtml(widget.icon)}"></i></div>
                        <div class="lux-card-meta">${escapeHtml(widget.meta || (widget.renderType === 'pinned' ? 'Pinned' : 'Shortcut'))}</div>
                    </div>
                    <div class="lux-shortcut-body">
                        <strong>${escapeHtml(widget.title || widget.label)}</strong>
                        <p>${escapeHtml(widget.copy || '')}</p>
                    </div>
                    <div class="lux-shortcut-foot">
                        <span class="lux-shortcut-status">${escapeHtml(widget.status || 'Open')}</span>
                        <button class="lux-secondary-btn" type="button" data-nav-target="${escapeHtml(widget.pageId)}">${escapeHtml(widget.renderType === 'pinned' ? 'Open record' : 'Open shortcut')}</button>
                    </div>
                </section>
            `;
        }
        return `
            <section class="lux-panel lux-card lux-builder-card lux-soft-chrome">
                <div class="lux-card-head">
                    <div>
                        <div class="lux-card-title">${escapeHtml(widget.title)}</div>
                        <div class="lux-builder-copy">${escapeHtml(widget.copy || '')}</div>
                    </div>
                    <div class="lux-card-meta">${escapeHtml(widget.meta || '')}</div>
                </div>
                <div class="lux-list">${renderListRowsMarkup(widget.rows)}</div>
                ${widget.pageId ? `<div class="lux-builder-card-foot"><button class="lux-ghost-btn" type="button" data-nav-target="${escapeHtml(widget.pageId)}">Open ${escapeHtml(pageLabel(widget.pageId))}</button></div>` : ''}
            </section>
        `;
    }

    function sortLayoutForDisplay(layout) {
        return (layout || []).filter((widget) => widget.visible !== false).slice().sort((a, b) => a.y - b.y || a.x - b.x || String(a.label).localeCompare(String(b.label)));
    }

    function renderWidgetEditorToolbar(widget, desktopEditor, isSelected = false) {
        const sizeCopy = widget.minimized ? `Minimized / ${widget.w} Ã— ${widget.h}` : `${widget.w} Ã— ${widget.h}`;
        if (!HOME_EDITOR_STATE.editing) return '';
        if (desktopEditor) return '';
        return `
            <div class="lux-widget-toolbar lux-widget-toolbar--builder" data-widget-drag-zone="${escapeHtml(widget.instanceId)}" title="${desktopEditor ? 'Drag this widget to a new position' : 'Desktop drag available on larger screens'}">
                <div class="lux-widget-toolbar-copy">
                    <button class="lux-widget-grab" type="button" data-widget-drag-handle="${escapeHtml(widget.instanceId)}" title="${desktopEditor ? 'Drag to move widget' : 'Desktop drag available on larger screens'}">
                        <i class="fas fa-grip-lines"></i>
                    </button>
                    <div>
                        <strong>${escapeHtml(widget.label)}</strong>
                        <span>${escapeHtml(sizeCopy)}</span>
                    </div>
                </div>
                <div class="lux-widget-toolbar-actions">
                    <button class="lux-widget-size-btn lux-widget-size-btn--labelled${isSelected ? ' is-active' : ''}" type="button" data-widget-select="${escapeHtml(widget.instanceId)}" title="Open size controls for this widget">Size</button>
                    ${desktopEditor ? '' : `
                        <button class="lux-widget-move-btn" type="button" data-widget-move="${escapeHtml(widget.instanceId)}" data-move-direction="-1" title="Move earlier"><i class="fas fa-arrow-up"></i></button>
                        <button class="lux-widget-move-btn" type="button" data-widget-move="${escapeHtml(widget.instanceId)}" data-move-direction="1" title="Move later"><i class="fas fa-arrow-down"></i></button>
                    `}
                    <button class="lux-widget-size-btn" type="button" data-widget-minimize="${escapeHtml(widget.instanceId)}" title="${widget.minimized ? 'Restore widget' : 'Minimize widget'}"><i class="fas ${widget.minimized ? 'fa-window-restore' : 'fa-window-minimize'}"></i></button>
                    <button class="lux-widget-size-btn lux-widget-size-btn--labelled" type="button" data-widget-size="${escapeHtml(widget.instanceId)}" data-size-axis="w" data-size-direction="-1" title="Make narrower">W-</button>
                    <button class="lux-widget-size-btn lux-widget-size-btn--labelled" type="button" data-widget-size="${escapeHtml(widget.instanceId)}" data-size-axis="w" data-size-direction="1" title="Make wider">W+</button>
                    <button class="lux-widget-size-btn lux-widget-size-btn--labelled" type="button" data-widget-size="${escapeHtml(widget.instanceId)}" data-size-axis="h" data-size-direction="-1" title="Make shorter">H-</button>
                    <button class="lux-widget-size-btn lux-widget-size-btn--labelled" type="button" data-widget-size="${escapeHtml(widget.instanceId)}" data-size-axis="h" data-size-direction="1" title="Make taller">H+</button>
                    <button class="lux-widget-remove" type="button" data-widget-hide="${escapeHtml(widget.instanceId)}" title="${widget.sourceType === 'system' ? 'Hide section' : 'Remove widget'}"><i class="fas fa-xmark"></i></button>
                </div>
            </div>
        `;
    }

    // Fixed professional layout (asd32): full-width bands + uniform 3-per-row spans.
    function professionalColumnSpan(widget) {
        if (Number.isFinite(Number(widget.span))) return Math.max(1, Math.min(12, Number(widget.span)));
        switch (widget.renderType) {
            case 'hero':
            case 'alert':
            case 'admin-ops':
            case 'quick':
                return 12;
            default:
                return 4;
        }
    }

    function renderWidgetShellMarkup(widget, role, renderMode, desktopEditor, viewportWidth = 0, overlapIds = null) {
        const isOverlapping = overlapIds instanceof Set && overlapIds.has(widget.instanceId);
        const desktopRect = getWidgetDesktopRect(widget, viewportWidth);
        const content = widget.minimized
            ? `
                <section class="lux-panel lux-widget-minimized-card lux-soft-chrome">
                    <div class="lux-widget-minimized-icon"><i class="${escapeHtml(widget.icon || 'fas fa-window-maximize')}"></i></div>
                    <div class="lux-widget-minimized-copy">
                        <strong>${escapeHtml(widget.label)}</strong>
                        <span>${escapeHtml(widget.meta || 'Dashboard panel')}</span>
                    </div>
                    <button class="lux-secondary-btn" type="button" data-widget-minimize="${escapeHtml(widget.instanceId)}">Restore</button>
                </section>
            `
            : renderWidgetContent(widget, role);
        if (!content) return '';
        const style = viewportWidth > 0
            ? `grid-column: span ${professionalColumnSpan(widget)}; z-index:${Number(widget.zIndex) || 1};`
            : renderMode === 'presentation'
                ? `grid-column:${widget.x} / span ${widget.w}; grid-row:${widget.y} / span ${widget.h}; z-index:${Number(widget.zIndex) || 1};`
                : 'grid-column:1 / -1;';
        const dragZoneAttr = HOME_EDITOR_STATE.editing && desktopEditor
            ? ` data-widget-drag-zone="${escapeHtml(widget.instanceId)}" title="Drag this widget to move it"`
            : '';
        return `
            <article class="lux-grid-widget${widget.minimized ? ' is-minimized' : ''}${HOME_EDITOR_STATE.selectedWidgetId === widget.instanceId ? ' is-selected' : ''}${HOME_EDITOR_STATE.dragState?.widgetId === widget.instanceId ? ' is-ghost-source' : ''}${isOverlapping ? ' is-overlapping' : ''}" data-widget-id="${escapeHtml(widget.instanceId)}" data-widget-type="${escapeHtml(widget.renderType)}" data-widget-selectable="${escapeHtml(widget.instanceId)}"${dragZoneAttr} style="${style}">
                ${HOME_EDITOR_STATE.editing && isOverlapping ? '<div class="lux-widget-overlap-badge" title="This widget overlaps another widget" aria-label="Overlapping widget">&#9888;&#65039;</div>' : ''}
                ${renderWidgetEditorToolbar(widget, desktopEditor, HOME_EDITOR_STATE.selectedWidgetId === widget.instanceId)}
                <div class="lux-grid-widget-body">${content}</div>
                ${desktopEditor && !widget.minimized ? `
                    <button class="lux-widget-resize-handle lux-widget-resize-handle--north" type="button" data-widget-resize="${escapeHtml(widget.instanceId)}" data-widget-resize-mode="resize-north" title="Drag to resize from top"><i class="fas fa-up-down"></i></button>
                    <button class="lux-widget-resize-handle lux-widget-resize-handle--west" type="button" data-widget-resize="${escapeHtml(widget.instanceId)}" data-widget-resize-mode="resize-west" title="Drag to resize from left"><i class="fas fa-left-right"></i></button>
                    <button class="lux-widget-resize-handle lux-widget-resize-handle--east" type="button" data-widget-resize="${escapeHtml(widget.instanceId)}" data-widget-resize-mode="resize-east" title="Drag to resize width"><i class="fas fa-left-right"></i></button>
                    <button class="lux-widget-resize-handle lux-widget-resize-handle--south" type="button" data-widget-resize="${escapeHtml(widget.instanceId)}" data-widget-resize-mode="resize-south" title="Drag to resize height"><i class="fas fa-up-down"></i></button>
                    <button class="lux-widget-resize-handle lux-widget-resize-handle--corner" type="button" data-widget-resize="${escapeHtml(widget.instanceId)}" data-widget-resize-mode="resize-corner" title="Drag to resize"><i class="fas fa-up-right-and-down-left-from-center"></i></button>
                ` : ''}
            </article>
        `;
    }

/* Home dashboard editor panel and desktop gestures. */
    function renderEditorPanel(role, model, layout, systemDefinitions, desktopEditor) {
        const selectedWidget = getSelectedDraftWidget(layout);
        const selectedWidgetDesktopRect = selectedWidget && desktopEditor ? getWidgetDesktopRect(selectedWidget, getHomeViewportWidthForDesktop()) : null;
        const hiddenDefinitions = systemDefinitions.filter((definition) => {
            const existing = layout.find((widget) => widget.widgetId === definition.widgetId && widget.sourceType === 'system');
            return !existing || existing.visible === false;
        });
        const pinOptions = buildPinnedRecordOptions(role, model);
        HOME_EDITOR_STATE.availablePins = pinOptions;
        const shortcutDestinations = getShortcutDestinationOptions(role);
        const shortcutIconOptions = [['fas fa-book-reader', 'Book'], ['fas fa-calendar-week', 'Calendar'], ['fas fa-headset', 'Support'], ['fas fa-file-signature', 'Document'], ['fas fa-comments', 'Chat'], ['fas fa-book-open', 'Orders'], ['fas fa-layer-group', 'Systems'], ['fas fa-link', 'Link']];
        const mobileVisible = sortLayoutForDisplay(layout);
        const libraryHtml = hiddenDefinitions.length
            ? hiddenDefinitions.map((definition) => `<button class="lux-editor-library-item" type="button" data-restore-widget="${escapeHtml(definition.widgetId)}"><strong>${escapeHtml(definition.label)}</strong><span>${escapeHtml(definition.copy || definition.title || 'Restore widget')}</span></button>`).join('')
            : '<div class="lux-editor-empty">All system widgets are already visible for this role.</div>';
        const pinHtml = pinOptions.length
            ? pinOptions.map((item, index) => `<button class="lux-editor-library-item" type="button" data-pin-widget="${escapeHtml(String(index))}"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.copy)}</span></button>`).join('')
            : '<div class="lux-editor-empty">No pin-ready records are available in this view yet.</div>';
        const destinationOptions = shortcutDestinations.map((item) => `<option value="${escapeHtml(item.pageId)}">${escapeHtml(item.label)}</option>`).join('');
        const iconOptions = shortcutIconOptions.map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join('');
        const widthOptions = selectedWidget
            ? [...new Set([selectedWidget.minW || 2, 2, 3, 4, 5, 6, 8, 10, 12, selectedWidget.maxW || HOME_GRID_COLUMNS])]
                .filter((value) => value >= (selectedWidget.minW || 2) && value <= (selectedWidget.maxW || HOME_GRID_COLUMNS))
                .sort((a, b) => a - b)
            : [];
        const heightOptions = selectedWidget
            ? [...new Set([selectedWidget.minH || 3, 2, 3, 4, 5, 6, 8, 10, 12, selectedWidget.maxH || 12])]
                .filter((value) => value >= (selectedWidget.minH || 3) && value <= (selectedWidget.maxH || 12))
                .sort((a, b) => a - b)
            : [];
        const selectedWidgetHtml = selectedWidget
            ? `
                <section class="lux-panel lux-editor-card lux-editor-card--size lux-soft-chrome">
                    <div class="lux-card-head">
                        <div><div class="lux-card-title">Selected panel size</div><div class="lux-builder-copy">Make this widget smaller or larger without leaving the workspace.</div></div>
                        <div class="lux-card-meta">${escapeHtml(selectedWidgetDesktopRect ? `${Math.round(selectedWidgetDesktopRect.width)}Ã—${Math.round(selectedWidgetDesktopRect.height)} px` : `${selectedWidget.w}Ã—${selectedWidget.h}`)}</div>
                    </div>
                    <div class="lux-editor-size-card-head">
                        <div>
                            <strong>${escapeHtml(selectedWidget.label)}</strong>
                            <span>${escapeHtml(selectedWidget.title || selectedWidget.label)}</span>
                        </div>
                        <div class="lux-editor-size-badge">${escapeHtml(selectedWidget.minimized ? 'Minimized' : 'Live on canvas')}</div>
                    </div>
                    <div class="lux-editor-size-actions">
                        <button class="lux-widget-size-btn lux-widget-size-btn--labelled" type="button" data-widget-size="${escapeHtml(selectedWidget.instanceId)}" data-size-axis="w" data-size-direction="-1">Narrower</button>
                        <button class="lux-widget-size-btn lux-widget-size-btn--labelled" type="button" data-widget-size="${escapeHtml(selectedWidget.instanceId)}" data-size-axis="w" data-size-direction="1">Wider</button>
                        <button class="lux-widget-size-btn lux-widget-size-btn--labelled" type="button" data-widget-size="${escapeHtml(selectedWidget.instanceId)}" data-size-axis="h" data-size-direction="-1">Shorter</button>
                        <button class="lux-widget-size-btn lux-widget-size-btn--labelled" type="button" data-widget-size="${escapeHtml(selectedWidget.instanceId)}" data-size-axis="h" data-size-direction="1">Taller</button>
                    </div>
                    <div class="lux-editor-size-axis">
                        <div class="lux-editor-size-axis-head"><span>Width</span><strong>${escapeHtml(selectedWidgetDesktopRect ? `${Math.round(selectedWidgetDesktopRect.width)} px` : `${selectedWidget.w} columns`)}</strong></div>
                        <div class="lux-editor-size-choice-row">
                            ${widthOptions.map((value) => `<button class="lux-editor-size-choice${selectedWidget.w === value ? ' is-active' : ''}" type="button" data-widget-dimension="${escapeHtml(selectedWidget.instanceId)}" data-dimension-axis="w" data-dimension-value="${escapeHtml(String(value))}">${escapeHtml(String(value))}</button>`).join('')}
                        </div>
                    </div>
                    <div class="lux-editor-size-axis">
                        <div class="lux-editor-size-axis-head"><span>Height</span><strong>${escapeHtml(selectedWidgetDesktopRect ? `${Math.round(selectedWidgetDesktopRect.height)} px` : `${selectedWidget.h} rows`)}</strong></div>
                        <div class="lux-editor-size-choice-row">
                            ${heightOptions.map((value) => `<button class="lux-editor-size-choice${selectedWidget.h === value ? ' is-active' : ''}" type="button" data-widget-dimension="${escapeHtml(selectedWidget.instanceId)}" data-dimension-axis="h" data-dimension-value="${escapeHtml(String(value))}">${escapeHtml(String(value))}</button>`).join('')}
                        </div>
                    </div>
                    <div class="lux-editor-size-note">Current range: width ${escapeHtml(String(selectedWidget.minW || 2))}-${escapeHtml(String(selectedWidget.maxW || HOME_GRID_COLUMNS))}, height ${escapeHtml(String(selectedWidget.minH || 3))}-${escapeHtml(String(selectedWidget.maxH || 12))}.</div>
                </section>
            `
            : `
                <section class="lux-panel lux-editor-card lux-editor-card--size lux-soft-chrome">
                    <div class="lux-card-head">
                        <div><div class="lux-card-title">Selected panel size</div><div class="lux-builder-copy">Pick any widget from the canvas to adjust its size here.</div></div>
                        <div class="lux-card-meta">No selection</div>
                    </div>
                    <div class="lux-editor-empty">Select a widget on the canvas to resize it from this panel.</div>
                </section>
            `;
        const mobileEditorHtml = desktopEditor ? '' : `
            <section class="lux-panel lux-editor-card lux-soft-chrome">
                <div class="lux-card-head">
                    <div><div class="lux-card-title">Touch editor</div><div class="lux-builder-copy">Move widgets up or down and tune their size from this list preview.</div></div>
                    <div class="lux-card-meta">Mobile / tablet</div>
                </div>
                <div class="lux-editor-mobile-list">
                    ${mobileVisible.map((widget) => `
                        <div class="lux-editor-mobile-item">
                            <div class="lux-editor-mobile-copy">
                                <strong>${escapeHtml(widget.label)}</strong>
                                <span>${escapeHtml(String(widget.w) + 'x' + String(widget.h))}</span>
                            </div>
                            <div class="lux-editor-mobile-actions">
                                <button type="button" data-widget-move="${escapeHtml(widget.instanceId)}" data-move-direction="-1"><i class="fas fa-arrow-up"></i></button>
                                <button type="button" data-widget-move="${escapeHtml(widget.instanceId)}" data-move-direction="1"><i class="fas fa-arrow-down"></i></button>
                                <button type="button" data-widget-size="${escapeHtml(widget.instanceId)}" data-size-axis="w" data-size-direction="-1"><i class="fas fa-left-right"></i></button>
                                <button type="button" data-widget-size="${escapeHtml(widget.instanceId)}" data-size-axis="w" data-size-direction="1"><i class="fas fa-arrows-left-right"></i></button>
                                <button type="button" data-widget-size="${escapeHtml(widget.instanceId)}" data-size-axis="h" data-size-direction="-1"><i class="fas fa-up-down"></i></button>
                                <button type="button" data-widget-size="${escapeHtml(widget.instanceId)}" data-size-axis="h" data-size-direction="1"><i class="fas fa-arrows-up-down"></i></button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
        const inspectorState = HOME_EDITOR_STATE.inspectorState || getDefaultInspectorState();
        const minimizedWidgets = sortLayoutForDisplay(layout).filter((widget) => widget.minimized);
        const minimizedHtml = minimizedWidgets.length
            ? minimizedWidgets.map((widget) => `<button class="lux-editor-library-item lux-editor-library-item--restore" type="button" data-widget-minimize="${escapeHtml(widget.instanceId)}"><strong>${escapeHtml(widget.label)}</strong><span>Restore this minimized panel to the canvas.</span></button>`).join('')
            : '<div class="lux-editor-empty">No minimized widgets are waiting in this layout.</div>';
        if (desktopEditor && inspectorState.collapsed) {
            return `
                <button class="lux-home-editor-chip" type="button" data-inspector-toggle="open" style="left:${Math.round(inspectorState.x)}px; top:${Math.round(inspectorState.y)}px;">
                    <i class="fas fa-sliders"></i>
                    <span>Dashboard tools</span>
                </button>
            `;
        }
        return `
            <aside class="lux-home-editor-panel--builder${desktopEditor ? ' is-floating' : ''}" data-inspector-panel="1" style="${desktopEditor ? `left:${Math.round(inspectorState.x)}px; top:${Math.round(inspectorState.y)}px; width:${Math.round(inspectorState.width)}px;` : ''}">
                ${desktopEditor ? `
                    <div class="lux-home-editor-header" data-inspector-drag-handle="1">
                        <div class="lux-home-editor-header-copy">
                            <strong>Dashboard tools</strong>
                            <span>Floating workspace inspector</span>
                        </div>
                        <div class="lux-home-editor-header-actions">
                            <button class="lux-widget-size-btn" type="button" data-inspector-toggle="collapse" title="Collapse inspector"><i class="fas fa-minus"></i></button>
                        </div>
                    </div>
                ` : ''}
                <div class="lux-home-editor-body">
                ${selectedWidgetHtml}
                <section class="lux-panel lux-editor-card lux-soft-chrome">
                    <div class="lux-card-head">
                        <div><div class="lux-card-title">Widget library</div><div class="lux-builder-copy">Restore hidden system panels or add optional sections for this role and faculty.</div></div>
                        <div class="lux-card-meta">${escapeHtml(getFacultyName(getCurrentFacultyCode()))}</div>
                    </div>
                    <div class="lux-editor-library-grid">${libraryHtml}</div>
                </section>
                <section class="lux-panel lux-editor-card lux-soft-chrome">
                    <div class="lux-card-head">
                        <div><div class="lux-card-title">Pin records</div><div class="lux-builder-copy">Add small dashboard cards for live records already available in this portal.</div></div>
                        <div class="lux-card-meta">Pinned</div>
                    </div>
                    <div class="lux-editor-library-grid">${pinHtml}</div>
                </section>
                <section class="lux-panel lux-editor-card lux-soft-chrome">
                    <div class="lux-card-head">
                        <div><div class="lux-card-title">Minimized panels</div><div class="lux-builder-copy">Restore panels you tucked away without losing their saved place in this role and faculty layout.</div></div>
                        <div class="lux-card-meta">Canvas</div>
                    </div>
                    <div class="lux-editor-library-grid">${minimizedHtml}</div>
                </section>
                <section class="lux-panel lux-editor-card lux-soft-chrome">
                    <div class="lux-card-head">
                        <div><div class="lux-card-title">New shortcut tile</div><div class="lux-builder-copy">Create your own internal portal shortcut without touching the underlying logic.</div></div>
                        <div class="lux-card-meta">Internal pages</div>
                    </div>
                    <label class="lux-editor-field"><span>Label</span><input id="lux-shortcut-label" type="text" placeholder="For example: Open staff board"></label>
                    <label class="lux-editor-field"><span>Destination</span><select id="lux-shortcut-page">${destinationOptions}</select></label>
                    <label class="lux-editor-field"><span>Description</span><input id="lux-shortcut-copy" type="text" placeholder="A short note about what this shortcut opens"></label>
                    <div class="lux-editor-field-grid">
                        <label class="lux-editor-field"><span>Icon</span><select id="lux-shortcut-icon">${iconOptions}</select></label>
                    </div>
                    <button class="lux-primary-btn" id="lux-add-shortcut-btn" type="button">Add shortcut tile</button>
                </section>
                ${mobileEditorHtml}
                <section class="lux-panel lux-editor-card lux-soft-chrome">
                    <div class="lux-card-head">
                        <div><div class="lux-card-title">Reset & defaults</div><div class="lux-builder-copy">Return the active dashboard or the full home experience to the KIU defaults whenever you want.</div></div>
                        <div class="lux-card-meta">Safe reset</div>
                    </div>
                    <div class="lux-editor-reset-grid">
                        <button class="lux-ghost-btn" type="button" data-home-reset="current-role">Reset current role layout</button>
                        <button class="lux-ghost-btn" type="button" data-home-reset="all-layouts">Reset all role layouts</button>
                        <button class="lux-ghost-btn" type="button" data-home-reset="home-defaults">Reset home to KIU defaults</button>
                    </div>
                </section>
                </div>
            </aside>
        `;
    }

    function ensureCanvasGuide(canvas) {
        if (!canvas) return null;
        let guide = canvas.querySelector('.lux-widget-guide');
        if (!guide) {
            guide = document.createElement('div');
            guide.className = 'lux-widget-guide';
            guide.innerHTML = `
                <span class="lux-widget-guide-origin"></span>
                <span class="lux-widget-guide-dot"></span>
                <span class="lux-widget-guide-label"></span>
            `;
            canvas.appendChild(guide);
        }
        return guide;
    }

    function updateCanvasGuide(canvas, preview) {
        const guide = ensureCanvasGuide(canvas);
        if (!guide || !preview) return;
        const guideLabel = guide.querySelector('.lux-widget-guide-label');
        guide.classList.add('is-visible');
        if (preview.left != null) {
            guide.style.left = `${Math.round(preview.left)}px`;
            guide.style.top = `${Math.round(preview.top)}px`;
            guide.style.width = `${Math.round(preview.width)}px`;
            guide.style.height = `${Math.round(preview.height)}px`;
            if (guideLabel) guideLabel.textContent = `${Math.round(preview.width)} x ${Math.round(preview.height)} px`;
            return;
        }
        const metrics = getDesktopCanvasMetrics(Math.round(canvas.getBoundingClientRect().width || getHomeViewportWidthForDesktop()));
        const left = Math.max(0, (Math.max(1, Number(preview.x) || 1) - 1) * (metrics.cellWidth + metrics.gapX));
        const top = Math.max(0, (Math.max(1, Number(preview.y) || 1) - 1) * (metrics.rowHeight + metrics.gapY));
        const width = toDesktopPixelWidth(preview.w || 4, metrics);
        const height = toDesktopPixelHeight(preview.h || 4, metrics);
        guide.style.left = `${Math.round(left)}px`;
        guide.style.top = `${Math.round(top)}px`;
        guide.style.width = `${Math.round(width)}px`;
        guide.style.height = `${Math.round(height)}px`;
        if (guideLabel) guideLabel.textContent = `${preview.w} x ${preview.h}  â€¢  ${preview.x},${preview.y}`;
    }

    function clearCanvasGuide(canvas) {
        const guide = canvas?.querySelector('.lux-widget-guide');
        if (guide) {
            guide.classList.remove('is-visible');
            const guideLabel = guide.querySelector('.lux-widget-guide-label');
            if (guideLabel) guideLabel.textContent = '';
        }
    }

    function beginDesktopWidgetGesture(event, widgetId, mode, homeShell) {
        if (!HOME_EDITOR_STATE.editing || !isDesktopHomeEditorViewport()) return;
        const canvas = homeShell.querySelector('.lux-dashboard-canvas');
        const widget = HOME_EDITOR_STATE.draftLayout?.find((item) => item.instanceId === widgetId);
        if (!canvas || !widget) return;
        HOME_EDITOR_STATE.selectedWidgetId = widgetId;
        bringDraftWidgetToFront(widgetId, { render: false });
        event.preventDefault();
        event.stopPropagation();
        const rect = canvas.getBoundingClientRect();
        const viewportWidth = Math.round(rect.width);
        const originRect = getWidgetDesktopRect(widget, viewportWidth);
        const widgetElement = homeShell.querySelector(`[data-widget-id="${CSS.escape(widgetId)}"]`);
        const minWidth = getWidgetMinDesktopWidth(widget, getDesktopCanvasMetrics(viewportWidth));
        const maxWidth = getWidgetMaxDesktopWidth(widget, getDesktopCanvasMetrics(viewportWidth));
        const minHeight = getWidgetMinDesktopHeight(widget, getDesktopCanvasMetrics(viewportWidth));
        const maxHeight = getWidgetMaxDesktopHeight(widget, getDesktopCanvasMetrics(viewportWidth));
        const rightEdge = originRect.left + originRect.width;
        const bottomEdge = originRect.top + originRect.height;
        const originalCanvasHeight = Number.parseFloat(canvas.style.height) || canvas.getBoundingClientRect().height || 0;
        const activePointerTarget = event.currentTarget;
        try {
            activePointerTarget?.setPointerCapture?.(event.pointerId);
        } catch (captureError) {
            // Pointer capture is best-effort; window-level listeners below keep the gesture working.
        }

        const applyLiveRect = (nextRect) => {
            if (!widgetElement) return;
            if (mode === 'move') {
                widgetElement.style.left = `${originRect.left}px`;
                widgetElement.style.top = `${originRect.top}px`;
                widgetElement.style.width = `${originRect.width}px`;
                widgetElement.style.height = `${originRect.height}px`;
                widgetElement.style.transform = `translate3d(${nextRect.left - originRect.left}px, ${nextRect.top - originRect.top}px, 0)`;
            } else {
                widgetElement.style.transform = 'translate3d(0, 0, 0)';
                widgetElement.style.left = `${nextRect.left}px`;
                widgetElement.style.top = `${nextRect.top}px`;
                widgetElement.style.width = `${nextRect.width}px`;
                widgetElement.style.height = `${nextRect.height}px`;
            }
            widgetElement.style.zIndex = String(getHighestWidgetZIndex(HOME_EDITOR_STATE.draftLayout) + 1);
            canvas.style.height = `${Math.max(originalCanvasHeight, Math.ceil(nextRect.top + nextRect.height + 72))}px`;
        };

        const buildLiveRect = (dx, dy) => {
            let nextRect = { ...originRect };
            if (mode === 'move') {
                nextRect.left = originRect.left + dx;
                nextRect.top = originRect.top + dy;
            } else {
                if (mode === 'resize-east' || mode === 'resize-corner') {
                    nextRect.width = originRect.width + dx;
                }
                if (mode === 'resize-south' || mode === 'resize-corner') {
                    nextRect.height = originRect.height + dy;
                }
                if (mode === 'resize-west') {
                    nextRect.width = clampNumber(originRect.width - dx, minWidth, maxWidth);
                    nextRect.left = rightEdge - nextRect.width;
                }
                if (mode === 'resize-north') {
                    nextRect.height = clampNumber(originRect.height - dy, minHeight, maxHeight);
                    nextRect.top = bottomEdge - nextRect.height;
                }
            }
            return normalizeDesktopRect(widget, nextRect, viewportWidth);
        };

        HOME_EDITOR_STATE.dragState = {
            mode,
            widgetId,
            startX: event.clientX,
            startY: event.clientY,
            viewportWidth,
            originRect: { ...originRect },
            preview: { ...originRect }
        };
        updateCanvasGuide(canvas, HOME_EDITOR_STATE.dragState.preview);
        widgetElement?.classList.add('is-live-moving');
        document.body.classList.add('lux-dashboard-gesture-active');

        const handleMove = (moveEvent) => {
            if (!HOME_EDITOR_STATE.dragState) return;
            const dx = moveEvent.clientX - HOME_EDITOR_STATE.dragState.startX;
            const dy = moveEvent.clientY - HOME_EDITOR_STATE.dragState.startY;
            HOME_EDITOR_STATE.dragState.preview = buildLiveRect(dx, dy);
            if (HOME_EDITOR_STATE.dragState.frame) return;
            HOME_EDITOR_STATE.dragState.frame = window.requestAnimationFrame(() => {
                const state = HOME_EDITOR_STATE.dragState;
                if (!state) return;
                state.frame = 0;
                applyLiveRect(state.preview);
                updateCanvasGuide(canvas, state.preview);
            });
        };

        const finishGesture = () => {
            const state = HOME_EDITOR_STATE.dragState;
            if (!state) return;
            if (state.frame) {
                window.cancelAnimationFrame(state.frame);
                state.frame = 0;
            }
            const preview = state.preview;
            applyLiveRect(preview);
            const desktopEditor = isDesktopHomeEditorViewport();
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', finishGesture);
            window.removeEventListener('pointercancel', finishGesture);
            try {
                activePointerTarget?.releasePointerCapture?.(event.pointerId);
            } catch (captureError) {
                // Matching the best-effort capture above.
            }
            widgetElement?.classList.remove('is-live-moving');
            document.body.classList.remove('lux-dashboard-gesture-active');
            clearCanvasGuide(canvas);
            HOME_EDITOR_STATE.dragState = null;
            updateDraftWidget(widgetId, (next) => {
                if (desktopEditor) {
                    const gridRect = desktopRectToGridRect(next, preview, viewportWidth);
                    next.x = gridRect.x;
                    next.y = gridRect.y;
                    next.w = gridRect.w;
                    next.h = gridRect.h;
                    next.desktopRect = { ...preview };
                    next.restoreDesktopRect = { ...next.desktopRect };
                    next.desktopRectViewportWidth = viewportWidth;
                    next.restoreDesktopRectViewportWidth = viewportWidth;
                } else {
                    next.desktopRect = null;
                    next.restoreDesktopRect = null;
                }
                if (!next.minimized) {
                    next.restoreRect = { ...(next.restoreRect || {}), x: next.x, y: next.y, w: next.w, h: next.h };
                }
            }, { stabilize: true, priority: widgetId });
        };

        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', finishGesture);
        window.addEventListener('pointercancel', finishGesture);
    }

/* Home dashboard shell bind and renderDynamicHomeShell. */
    function bindHomeShellActions(homeShell, role, model) {
        homeShell.querySelectorAll('[data-nav-target]').forEach((button) => button.addEventListener('click', () => {
            if (typeof navigate === 'function') navigate(pageTarget(button.dataset.navTarget));
        }));
        homeShell.querySelectorAll('[data-admin-provision]').forEach((button) => button.addEventListener('click', () => {
            if (typeof openUnifiedAdminProvision === 'function') openUnifiedAdminProvision(button.dataset.adminProvision);
        }));
        homeShell.querySelectorAll('[data-admin-focus]').forEach((button) => button.addEventListener('click', () => {
            queueAdminToolsFocus(button.dataset.adminFocus);
            if (typeof navigate === 'function') navigate('admin-tools');
        }));
        if (!HOME_EDITOR_STATE.editing) return;
        homeShell.querySelectorAll('[data-widget-select]').forEach((button) => button.addEventListener('click', () => {
            setSelectedDraftWidget(button.dataset.widgetSelect, { bringToFront: true });
        }));
        homeShell.querySelectorAll('[data-widget-selectable]').forEach((panel) => panel.addEventListener('click', (event) => {
            if (event.target.closest('button, a, input, select, textarea, label, [data-widget-drag-zone], [data-widget-drag-handle], [data-widget-resize]')) return;
            setSelectedDraftWidget(panel.dataset.widgetSelectable, { bringToFront: true });
        }));
        homeShell.querySelectorAll('[data-widget-hide]').forEach((button) => button.addEventListener('click', () => {
            const widget = HOME_EDITOR_STATE.draftLayout?.find((item) => item.instanceId === button.dataset.widgetHide);
            hideDraftWidget(widget);
        }));
        homeShell.querySelectorAll('[data-widget-size]').forEach((button) => button.addEventListener('click', () => {
            setDraftWidgetSize(button.dataset.widgetSize, button.dataset.sizeAxis, Number(button.dataset.sizeDirection || 0));
        }));
        homeShell.querySelectorAll('[data-widget-dimension]').forEach((button) => button.addEventListener('click', () => {
            setDraftWidgetDimension(button.dataset.widgetDimension, button.dataset.dimensionAxis, Number(button.dataset.dimensionValue || 0));
        }));
        homeShell.querySelectorAll('[data-widget-minimize]').forEach((button) => button.addEventListener('click', () => {
            toggleDraftWidgetMinimize(button.dataset.widgetMinimize);
        }));
        homeShell.querySelectorAll('[data-widget-move]').forEach((button) => button.addEventListener('click', () => {
            nudgeDraftWidget(button.dataset.widgetMove, Number(button.dataset.moveDirection || 0));
        }));
        homeShell.querySelectorAll('[data-restore-widget]').forEach((button) => button.addEventListener('click', () => restoreDraftWidget(button.dataset.restoreWidget, role, model)));
        homeShell.querySelector('[data-inspector-toggle="open"]')?.addEventListener('click', () => setInspectorState({ collapsed: false }));
        homeShell.querySelector('[data-inspector-toggle="collapse"]')?.addEventListener('click', () => setInspectorState({ collapsed: true }));
        homeShell.querySelectorAll('[data-pin-widget]').forEach((button) => button.addEventListener('click', () => {
            const index = Number(button.dataset.pinWidget);
            const item = HOME_EDITOR_STATE.availablePins?.[index];
            if (item) createDraftPinnedWidget(item);
        }));
        homeShell.querySelectorAll('[data-home-reset]').forEach((button) => button.addEventListener('click', () => {
            const action = button.dataset.homeReset;
            if (action === 'current-role') return resetCurrentRoleLayoutDraft(role, model);
            if (action === 'all-layouts') return window.confirm('Reset every saved dashboard layout for this user?') && resetAllSavedHomeLayouts();
            if (action === 'home-defaults' && window.confirm('Reset all layouts and visual settings for the home page?')) resetHomeToDefaults();
        }));
        homeShell.querySelector('#lux-add-shortcut-btn')?.addEventListener('click', () => createDraftShortcut(role, { id: `shortcut-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, pageId: homeShell.querySelector('#lux-shortcut-page')?.value, label: homeShell.querySelector('#lux-shortcut-label')?.value, copy: homeShell.querySelector('#lux-shortcut-copy')?.value, icon: homeShell.querySelector('#lux-shortcut-icon')?.value, tone: 'default' }));
        if (isDesktopHomeEditorViewport()) {
            homeShell.querySelectorAll('[data-widget-drag-handle]').forEach((button) => button.addEventListener('pointerdown', (event) => beginDesktopWidgetGesture(event, button.dataset.widgetDragHandle, 'move', homeShell)));
            homeShell.querySelectorAll('[data-widget-drag-zone]').forEach((zone) => zone.addEventListener('pointerdown', (event) => {
                if (event.target.closest('button, a, input, select, textarea, [data-widget-hide], [data-widget-size], [data-widget-move]')) return;
                setSelectedDraftWidget(zone.dataset.widgetDragZone, { render: false });
                beginDesktopWidgetGesture(event, zone.dataset.widgetDragZone, 'move', homeShell);
            }));
            homeShell.querySelectorAll('[data-widget-resize]').forEach((button) => button.addEventListener('pointerdown', (event) => beginDesktopWidgetGesture(event, button.dataset.widgetResize, button.dataset.widgetResizeMode || 'resize-corner', homeShell)));
            homeShell.querySelector('[data-inspector-drag-handle="1"]')?.addEventListener('pointerdown', (event) => {
                const panel = homeShell.querySelector('[data-inspector-panel="1"]');
                if (!panel) return;
                event.preventDefault();
                const start = HOME_EDITOR_STATE.inspectorState || getSavedInspectorState(HOME_EDITOR_STATE.scopeKey);
                const originX = event.clientX;
                const originY = event.clientY;
                const moveInspector = (moveEvent) => {
                    const next = sanitizeInspectorState({
                        ...start,
                        x: start.x + (moveEvent.clientX - originX),
                        y: start.y + (moveEvent.clientY - originY)
                    });
                    HOME_EDITOR_STATE.inspectorState = next;
                    panel.style.left = `${Math.round(next.x)}px`;
                    panel.style.top = `${Math.round(next.y)}px`;
                };
                const stopInspector = () => {
                    window.removeEventListener('pointermove', moveInspector);
                    window.removeEventListener('pointerup', stopInspector);
                    setInspectorState(HOME_EDITOR_STATE.inspectorState, { persist: true, render: false });
                };
                window.addEventListener('pointermove', moveInspector);
                window.addEventListener('pointerup', stopInspector);
            });
        }
    }

    function getHomeViewportWidthForDesktop() {
        const windowWidth = window.innerWidth || document.documentElement.clientWidth || 1440;
        const page = document.getElementById('page-home') || document.getElementById('app-content');
        if (page) {
            const rect = page.getBoundingClientRect();
            const availableRightEdge = Math.max(rect.width, windowWidth - Math.max(0, rect.left));
            return Math.max(980, Math.round(availableRightEdge));
        }
        return Math.max(980, Math.round(windowWidth));
    }

    renderDynamicHomeShell = function (homeShell) {
        const role = getEffectiveRole();
        if (HOME_EDITOR_STATE.editing && HOME_EDITOR_STATE.role && HOME_EDITOR_STATE.role !== role) stopHomeEditor({ refresh: false });
        const model = buildHomeModel(role);
        const systemDefinitions = buildSystemWidgetDefinitions(role, model);
        const editing = HOME_EDITOR_STATE.editing && HOME_EDITOR_STATE.role === role;
        const desktopViewport = (window.innerWidth || 0) >= 980;
        const desktopEditor = editing && isDesktopHomeEditorViewport();
        const renderMode = desktopViewport ? 'workspace' : 'stacked';
        const viewportWidth = desktopViewport ? getHomeViewportWidthForDesktop() : 0;
        const layout = getWorkingHomeLayout(role, model);
        const visibleWidgets = desktopViewport
            ? sortLayoutForCanvas(layout, viewportWidth)
            : sortLayoutForDisplay(layout);
        const overlapIds = editing
            ? getWidgetOverlapIds(layout, viewportWidth, desktopEditor)
            : new Set();
        const desktopWidthStyle = desktopViewport
            ? ` style="width:${viewportWidth}px !important; max-width:none !important; min-width:${viewportWidth}px !important;"`
            : '';
        const desktopCanvasStyle = desktopWidthStyle;

        const toolbarHtml = editing
            ? '<button class="lux-ghost-btn" type="button" data-home-editor="cancel">Cancel</button><button class="lux-primary-btn" type="button" data-home-editor="save">Save layout</button>'
            : '<button class="lux-secondary-btn" type="button" data-home-editor="open">Customize dashboard</button>';
        const editorHtml = editing ? renderEditorPanel(role, model, layout, systemDefinitions, desktopEditor) : '';
        homeShell.innerHTML = `
            <div class="lux-home-grid lux-home-grid--builder is-${escapeHtml(model.variant || role)}" data-role="${escapeHtml(model.variant || role)}" data-editing="${editing ? 'true' : 'false'}"${desktopWidthStyle}>
                <div class="lux-home-toolbar lux-home-toolbar--builder">
                    <div><div class="lux-kicker">Home Dashboard</div><strong>${editing ? 'Editing layout for this role and faculty' : 'Personal workspace layout'}</strong><p>${editing ? 'Drag and resize sections on desktop, use reorder controls on smaller screens, and save a separate dashboard for this role and faculty.' : 'This homepage can be customized per role and faculty without changing the underlying portal logic.'}</p></div>
                    <div class="lux-home-toolbar-actions">${toolbarHtml}</div>
                </div>
                <div class="lux-home-workbench"${desktopWidthStyle}>
                    <div class="lux-dashboard-canvas${renderMode === 'stacked' ? ' is-stacked' : ' is-desktop'}${editing ? ' is-editing' : ''}" data-dashboard-canvas="1"${desktopCanvasStyle}>${visibleWidgets.map((widget) => renderWidgetShellMarkup(widget, role, renderMode, desktopEditor, viewportWidth, overlapIds)).join('')}</div>
                    ${editorHtml}
                </div>
            </div>
        `;

        homeShell.querySelector('[data-home-editor="open"]')?.addEventListener('click', () => {
            const start = () => {
                ensureHomeEditorDraft(role, model);
                renderHomeShell();
                syncTopbar();
            };
            if (typeof ensureHomeEditorCss === 'function') {
                Promise.resolve(ensureHomeEditorCss()).then(start);
            } else {
                start();
            }
        });
        homeShell.querySelector('[data-home-editor="cancel"]')?.addEventListener('click', () => stopHomeEditor({ message: 'Dashboard editor closed.' }));
        homeShell.querySelector('[data-home-editor="save"]')?.addEventListener('click', () => saveHomeEditor(role));
        bindHomeShellActions(homeShell, role, model);
    };

    const __legacySyncTopbar = syncTopbar;
    syncTopbar = function () {
        __legacySyncTopbar();
        applySidebarState();
        const editButton = document.getElementById('lux-dashboard-edit-btn');
        if (editButton) {
            editButton.title = getActivePageId() === 'home'
                ? (HOME_EDITOR_STATE.editing ? 'Close dashboard editor' : 'Customize this dashboard')
                : 'Open the home page and customize the dashboard';
        }
    };

    // Live background is owned by luxury-background.js; installer still exports this no-op.
    startBackground = function () {};
