/* Home dashboard prefs / palette helpers. */
    const ADVANCED_HOME_LAYOUT_VERSION = 5;
    const HOME_SCOPE_SEPARATOR = '::';
    const HOME_GRID_COLUMNS = 12;
    const HOME_GRID_ROW_HEIGHT = 28;
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
        surfaceTransparency: '70',
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

    function getDashboardVisuals(_scopeKey = getHomeScopeKey()) {
        const entry = getDashboardPreferenceEntry();
        return {
            ...buildAdvancedDefaultVisuals(),
            ...(entry.visuals || {})
        };
    }

    function setDashboardVisuals(values, persist = true, _scopeKey = getHomeScopeKey()) {
        updateDashboardPreferenceEntry((entry) => {
            entry.visuals = {
                ...buildAdvancedDefaultVisuals(),
                ...(entry.visuals || {}),
                ...(values || {}),
                paletteFaculty: '*'
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

    function isVisualPaletteScopedToFaculty(visuals, _facultyCode = getCurrentFacultyCode()) {
        // Palette selection is a global portal preference. Keep this API for
        // compatibility with older callers, but never reject it by faculty.
        return Boolean(visuals && typeof visuals === 'object');
    }

    function resolvePaletteKey() {
        const visuals = getDashboardVisuals();
        const stored = visuals?.paletteKey || localStorage.getItem('kiuLuxuryPalette') || localStorage.getItem('kiu-palette');
        if (stored === 'carbon-black' || stored === 'arctic-white') return 'platinum-silver';
        if (stored === 'custom' || isBuiltInLuxuryPaletteKey(stored)) return stored;
        return visuals?.paletteKey || 'ocean-teal'; // Default matches ADVANCED_DEFAULT_VISUALS
    }

    function resolveCustomPalette() {
        const visuals = getDashboardVisuals();
        if (isVisualPaletteScopedToFaculty(visuals) && visuals.customPalette?.accent && visuals.customPalette?.accent2) {
            return visuals.customPalette;
        }
        try {
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
            localStorage.setItem('kiuLuxuryPaletteFaculty', '*');
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
                paletteFaculty: '*',
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
            localStorage.setItem('kiu-palette', 'custom'); // Sync for utilities.js compatibility
            setDashboardVisuals({
                paletteKey: 'custom',
                paletteFaculty: '*',
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
        try {
            const resolvedPaletteKey = hasCustomColors ? 'custom' : (visuals.paletteKey || palette.key);
            localStorage.setItem('kiuLuxuryPalette', resolvedPaletteKey);
            localStorage.setItem('kiuLuxuryPaletteFaculty', '*');
            localStorage.setItem('kiu-palette', resolvedPaletteKey);
            if (hasCustomColors && custom?.accent && custom?.accent2) {
                localStorage.setItem('kiuLuxuryCustomPalette', JSON.stringify({ accent: custom.accent, accent2: custom.accent2 }));
                localStorage.removeItem('kiuLuxuryCustomPaletteFaculty');
            }
        } catch (_error) {}
        document.body.dataset.luxFaculty = facultyPalette.facultyCode;
        if (typeof window.queueLuxuryTransparencyRefresh === 'function') {
            window.queueLuxuryTransparencyRefresh(getDashboardVisuals().surfaceTransparency || localStorage.getItem('kiuLuxurySurfaceTransparency'));
        }
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
        root.style.setProperty('--lux-topbar-fill-alpha', String(topbarFillMin));
        root.style.setProperty('--lux-topbar-raised-alpha', String(topbarRaisedMin));
        root.style.setProperty('--lux-button-glow', glowConfig.buttonGlow);
        /* PERF/FIX: Respect saved transparency instead of hardcoding 0.03 */
        var _savedTransVal = parseInt(getDashboardVisuals().surfaceTransparency || localStorage.getItem('kiuLuxurySurfaceTransparency') || '70', 10);
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

/* Home dashboard editor stub — customize mode removed; keep stopHomeEditor for defensive shell calls. */
    stopHomeEditor = function ({ message = '', refresh = true } = {}) {
        if (typeof HOME_EDITOR_STATE === 'object' && HOME_EDITOR_STATE) {
            HOME_EDITOR_STATE.editing = false;
            HOME_EDITOR_STATE.role = '';
            HOME_EDITOR_STATE.draftLayout = null;
            HOME_EDITOR_STATE.draftCustomShortcuts = [];
            HOME_EDITOR_STATE.dragState = null;
            HOME_EDITOR_STATE.selectedWidgetId = '';
        }
        if (message && typeof showToast === 'function') showToast(message);
        if (refresh && typeof renderHomeShell === 'function') renderHomeShell();
    };

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
            <button class="lux-quick-btn lux-soft-chrome home-hover-chip" type="button" data-nav-target="${escapeHtml(tile.pageId)}">
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
            <section class="lux-soft-chrome lux-admin-ops-panel">
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
                                        return `<button class="lux-admin-op-btn lux-secondary-btn" type="button" data-admin-provision="${escapeHtml(button.role)}"><i class="${escapeHtml(button.icon || 'fas fa-plus')}"></i><span>${escapeHtml(button.label)}</span></button>`;
                                    }
                                    if (button.type === 'focus') {
                                        return `<button class="lux-admin-op-btn lux-secondary-btn" type="button" data-admin-focus="${escapeHtml(button.focus)}"><i class="${escapeHtml(button.icon || 'fas fa-layer-group')}"></i><span>${escapeHtml(button.label)}</span></button>`;
                                    }
                                    return `<button class="lux-admin-op-btn lux-secondary-btn" type="button" data-nav-target="${escapeHtml(button.pageId)}"><i class="${escapeHtml(button.icon || 'fas fa-arrow-right')}"></i><span>${escapeHtml(button.label)}</span></button>`;
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
                            <span class="lux-pill lux-soft-chrome home-hover-chip lms-hero-focus-chip" aria-label="Status">${escapeHtml(chip)}</span>
                        </div>
                        <div class="lms-hero-focus-body">
                            <div class="lms-hero-focus-title">${escapeHtml(headline)}</div>
                            <p class="lms-hero-focus-copy">${escapeHtml(copy)}</p>
                        </div>
                        <div class="lms-hero-focus-meta">
                            <span class="lux-pill lux-soft-chrome home-hover-chip"><i class="fas ${escapeHtml(meta.icon || 'fa-circle-dot')}"></i> ${escapeHtml(meta.text || '')}</span>
                        </div>
                    </aside>`;
    }



    function renderHeroWidgetMarkup(heroModel, role) {
        const model = heroModel || buildHomeModel(role);
        return `
            <section class="lux-soft-chrome lux-hero lux-builder-hero page-hero lux-summary-surface--hero">
                <div class="lux-hero-stage">
                    <div class="lux-hero-main">
                        <div class="lux-kicker">${escapeHtml(model.kicker || ROLE_LABELS[role] || 'Portal View')}</div>
                        <h1 class="page-hero-title">${escapeHtml(model.title)}</h1>
                        <p class="page-hero-copy">${escapeHtml(model.copy)}</p>
                        <div class="lux-pill-row">
                            ${(model.pills || []).map((pill) => `<span class="lux-pill lux-soft-chrome home-hover-chip">${escapeHtml(pill)}</span>`).join('')}
                        </div>
                        <div class="lux-hero-actions">
                            ${(model.actions || []).map(([pageId, label, actionType], index) => {
                                const actionAttribute = actionType === 'utility'
                                    ? `data-action="${escapeHtml(pageId)}"`
                                    : `data-nav-target="${escapeHtml(pageId)}"`;
                                return `<button class="${index === 0 ? 'lux-primary-btn' : index === 1 ? 'lux-secondary-btn' : 'lux-ghost-btn'}" type="button" ${actionAttribute}>${escapeHtml(label)}</button>`;
                            }).join('')}
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

    function renderStudentOverline(label, icon) {
        return `<div class="lux-student-compact-overline"><i class="${escapeHtml(icon)}" aria-hidden="true"></i><span>${escapeHtml(label)}</span></div>`;
    }

    function renderStudentEmptyBlock(title, copy, icon, extraClass = 'lux-student-work-empty') {
        return `
            <div class="${escapeHtml(extraClass)}">
                <i class="${escapeHtml(icon)}" aria-hidden="true"></i>
                <div>
                    <strong>${escapeHtml(title)}</strong>
                    <span>${escapeHtml(copy)}</span>
                </div>
            </div>
        `;
    }

    function renderStudentHeaderMarkup(compactModel = {}, heroModel = {}) {
        const context = compactModel.context || {};
        const status = compactModel.status || {};
        const stats = compactModel.stats || {};
        const tone = ['green', 'warm', 'support'].includes(status.tone) ? ` is-${status.tone}` : '';
        const term = stats.semester || 'S1';
        const gpa = !stats.performance || stats.performance === '--' ? '—' : String(stats.performance);
        const rawEcts = stats.completedEcts;
        const ectsMissing = rawEcts == null || rawEcts === '' || String(rawEcts).toLowerCase() === 'unavailable';
        const ects = ectsMissing ? '—' : String(rawEcts);
        const metaLine = `${term} · GPA ${gpa} · ECTS ${ects}`;
        return `
            <section class="lux-student-compact-header lux-student-pulse-header">
                <div class="lux-student-compact-heading">
                    <div class="lux-kicker">Student Dashboard</div>
                    <h1>${escapeHtml(context.firstName || heroModel.title || 'Student')}</h1>
                    <p>${escapeHtml(`${context.facultyName || 'Faculty'} · ${context.termLabel || 'Current term'}`)}</p>
                    <p class="lux-student-compact-meta">${escapeHtml(metaLine)}</p>
                </div>
                <div class="lux-student-compact-status${tone}">
                    <span>${escapeHtml(status.label || context.registrationLabel || 'Registration status')}</span>
                    ${status.actionLabel ? `<button class="lux-ghost-btn" type="button" data-nav-target="${escapeHtml(status.actionPage || 'lms')}">${escapeHtml(status.actionLabel)}</button>` : ''}
                </div>
            </section>
        `;
    }

    function renderStudentWeekStripMarkup(weekStrip = {}) {
        if (weekStrip.empty) {
            return renderStudentEmptyBlock(
                weekStrip.emptyTitle || 'No listed classes yet',
                weekStrip.emptyCopy || 'Register to unlock your week strip and timetable.',
                'fas fa-calendar-week',
                'lux-student-week-empty'
            );
        }
        const days = Array.isArray(weekStrip.days) ? weekStrip.days : [];
        return `
            <div class="lux-student-week-strip" role="list">
                ${days.map((day) => `
                    <div class="lux-soft-chrome home-hover-chip lux-student-week-day${day.isToday ? ' is-today' : ''}${day.hasSessions ? ' has-sessions' : ''}" role="listitem">
                        <span class="lux-student-week-day-label">${escapeHtml(day.label || '')}</span>
                        <strong>${escapeHtml(day.hasSessions ? String(day.count) : '—')}</strong>
                        <small>${escapeHtml(day.hasSessions ? (day.title || 'Class') : 'Free')}</small>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderStudentStudyPanelMarkup(pulse = {}) {
        const known = Boolean(pulse.known);
        const perf = pulse.performance && typeof pulse.performance === 'object'
            ? pulse.performance
            : { value: pulse.performance || '--', label: pulse.performanceLabel || 'GPA' };
        if (known) {
            return `
                <div class="lux-student-study-panel">
                    <strong>${escapeHtml(String(pulse.completed))} / ${escapeHtml(String(pulse.target))} ECTS</strong>
                    <span>${escapeHtml(perf.label || 'GPA')} ${escapeHtml(perf.value || '--')} · ${escapeHtml(pulse.semester || 'S1')}</span>
                </div>
            `;
        }
        return `
            <div class="lux-student-study-panel is-quiet">
                <strong>Study card</strong>
                <span>Credits &amp; GPA live on your study card when posted.</span>
            </div>
        `;
    }

    function renderStudentEventsMarkup(events = []) {
        const items = Array.isArray(events) ? events.slice(0, 4) : [];
        if (!items.length) {
            return renderStudentEmptyBlock(
                'No upcoming events',
                'Open Social to browse campus events.',
                'fas fa-calendar-check'
            );
        }
        return `
            <div class="lux-student-event-list">
                ${items.map((item) => `
                    <button class="lux-student-event-row" type="button" data-nav-target="${escapeHtml(item.pageId || 'social')}">
                        <i class="${escapeHtml(item.icon || 'fas fa-calendar-check')}" aria-hidden="true"></i>
                        <div>
                            <strong>${escapeHtml(item.title || 'Campus event')}</strong>
                            <span>${escapeHtml([item.meta, item.when].filter(Boolean).join(' · '))}</span>
                        </div>
                    </button>
                `).join('')}
            </div>
        `;
    }

    function renderStudentWorkColumnMarkup(workDue = {}, events = []) {
        const items = Array.isArray(workDue.items) ? workDue.items : [];
        if (workDue.available && items.length) {
            return {
                body: `
                    ${renderStudentOverline('Work due', 'fas fa-clipboard-list')}
                    ${renderStudentWorkDueMarkup(workDue)}
                `,
                ctaPage: 'lms',
                ctaLabel: 'Browse LMS'
            };
        }
        return {
            body: `
                ${renderStudentOverline('Events', 'fas fa-calendar-check')}
                ${renderStudentEventsMarkup(events)}
            `,
            ctaPage: 'social',
            ctaLabel: 'Open social'
        };
    }

    function renderStudentCommandMarkup(compactModel = {}) {
        const weekStrip = compactModel.weekStrip || {};
        const schedule = Array.isArray(compactModel.schedule) ? compactModel.schedule : [];
        const workColumn = renderStudentWorkColumnMarkup(compactModel.workDue || {}, compactModel.events || []);
        const nextRows = schedule.slice(0, 4).map((row) => `
            <div class="lux-student-compact-schedule-row">
                <time>${escapeHtml(row.time || '--:--')}</time>
                <strong>${escapeHtml(row.title || 'Scheduled class')}</strong>
                <span>${escapeHtml(row.meta || '')}</span>
            </div>
        `).join('');
        return `
            <section class="lux-student-command lux-student-pulse-command">
                <div class="lux-soft-chrome lux-student-cell lux-student-command-column">
                    ${renderStudentOverline('This week', 'fas fa-calendar-week')}
                    ${renderStudentWeekStripMarkup(weekStrip)}
                    ${schedule.length ? `
                        ${renderStudentOverline('Next', 'fas fa-clock')}
                        <div class="lux-student-compact-schedule lux-student-week-next">${nextRows}</div>
                    ` : ''}
                    <button class="lux-ghost-btn lux-student-compact-link" type="button" data-nav-target="timetable">Open timetable <i class="fas fa-arrow-right" aria-hidden="true"></i></button>
                </div>
                <div class="lux-soft-chrome lux-student-cell lux-student-command-column lux-student-work-column">
                    ${workColumn.body}
                    <button class="lux-ghost-btn lux-student-compact-link" type="button" data-nav-target="${escapeHtml(workColumn.ctaPage)}">${escapeHtml(workColumn.ctaLabel)} <i class="fas fa-arrow-right" aria-hidden="true"></i></button>
                </div>
            </section>
        `;
    }

    function renderStudentWorkDueMarkup(workDue = {}) {
        const items = Array.isArray(workDue.items) ? workDue.items : [];
        if (!workDue.available) {
            return renderStudentEmptyBlock(
                workDue.emptyTitle || 'Work signals unavailable',
                workDue.emptyCopy || 'Open LMS to sync assignments and due work.',
                'fas fa-clipboard-list'
            );
        }
        if (!items.length) {
            return renderStudentEmptyBlock(
                workDue.emptyTitle || 'No open assignments',
                workDue.emptyCopy || 'Nothing due right now.',
                'fas fa-clipboard-list'
            );
        }
        return `
            <div class="lux-student-work-list">
                ${items.map((item) => `
                    <button class="lux-student-work-row is-${escapeHtml(item.tone || 'missing')}" type="button" data-nav-target="${escapeHtml(item.pageId || 'lms')}">
                        <i class="${escapeHtml(item.icon || 'fas fa-clipboard-list')}" aria-hidden="true"></i>
                        <div>
                            <span class="lux-student-work-tone">${escapeHtml(item.label || 'Needs submit')}</span>
                            <strong>${escapeHtml(item.title || 'Assignment')}</strong>
                            <span>${escapeHtml(item.meta || '')}</span>
                        </div>
                    </button>
                `).join('')}
            </div>
        `;
    }

    function renderStudentCampusUpdatesMarkup(campusUpdates = []) {
        const items = Array.isArray(campusUpdates) && campusUpdates.length
            ? campusUpdates.slice(0, 4)
            : [{ title: 'No new updates', meta: 'News, orders, and notifications will appear here.', when: '', pageId: 'news', icon: 'fas fa-bell' }];
        return `
            <div class="lux-student-news-list lux-student-updates-list">
                ${items.map((item) => `
                    <button class="lux-student-news-row lux-student-update-row" type="button" data-nav-target="${escapeHtml(item.pageId || 'news')}">
                        <i class="${escapeHtml(item.icon || 'fas fa-bell')}" aria-hidden="true"></i>
                        <div>
                            <strong>${escapeHtml(item.title || 'Campus update')}</strong>
                            <span>${escapeHtml([item.meta, item.when].filter(Boolean).join(' · '))}</span>
                        </div>
                    </button>
                `).join('')}
            </div>
        `;
    }

    function renderStudentLifeSnapshotMarkup(lifeSnapshot = []) {
        const rows = Array.isArray(lifeSnapshot) ? lifeSnapshot.slice(0, 5) : [];
        if (!rows.length) return '';
        return `
            <div class="lux-student-life-snapshot">
                ${rows.map((row) => `
                    <button class="lux-student-life-row" type="button" data-nav-target="${escapeHtml(row.pageId || 'study-card')}">
                        <i class="${escapeHtml(row.icon || 'fas fa-circle')}" aria-hidden="true"></i>
                        <span>${escapeHtml(row.label || '')}</span>
                        <strong>${escapeHtml(row.value || '')}</strong>
                    </button>
                `).join('')}
            </div>
        `;
    }

    function renderStudentShortcutsMarkup(shortcuts = []) {
        const items = Array.isArray(shortcuts) ? shortcuts.slice(0, 4) : [];
        if (!items.length) return '';
        return `
            <div class="lux-student-shortcut-row">
                ${items.map((item) => `
                    <button class="lux-ghost-btn lux-student-shortcut-chip" type="button" data-nav-target="${escapeHtml(item.pageId || 'lms')}">${escapeHtml(item.label || 'Open')}</button>
                `).join('')}
            </div>
        `;
    }

    function renderStudentSummaryMarkup(compactModel = {}) {
        const updates = Array.isArray(compactModel.campusUpdates) ? compactModel.campusUpdates : [];
        const updatesCtaPage = updates.find((item) => item.pageId)?.pageId || 'news';
        return `
            <section class="lux-student-summary-strip lux-student-pulse-summary">
                <div class="lux-soft-chrome lux-student-cell lux-student-summary-panel lux-student-news-panel">
                    ${renderStudentOverline('Updates', 'fas fa-bell')}
                    ${renderStudentCampusUpdatesMarkup(updates)}
                    <button class="lux-ghost-btn lux-student-compact-link" type="button" data-nav-target="${escapeHtml(updatesCtaPage)}">Open updates <i class="fas fa-arrow-right" aria-hidden="true"></i></button>
                </div>
                <div class="lux-soft-chrome lux-student-cell lux-student-attention-panel lux-student-study-column">
                    ${renderStudentOverline('Study', 'far fa-address-card')}
                    ${renderStudentStudyPanelMarkup(compactModel.academicPulse || {})}
                    ${renderStudentLifeSnapshotMarkup(compactModel.lifeSnapshot || [])}
                    ${renderStudentShortcutsMarkup(compactModel.shortcuts || [])}
                    <button class="lux-ghost-btn lux-student-compact-link" type="button" data-nav-target="study-card">Open study card <i class="fas fa-arrow-right" aria-hidden="true"></i></button>
                </div>
            </section>
        `;
    }

    function renderStudentScoreListMarkup(scores = []) {
        const items = Array.isArray(scores) ? scores.slice(0, 4) : [];
        if (!items.length) {
            return renderStudentEmptyBlock(
                'No recent score updates',
                'Last graded assessments will appear here when professors post them.',
                'fas fa-chart-line'
            );
        }
        return `
            <div class="lux-student-score-list">
                ${items.map((item) => `
                    <button class="lux-student-score-row" type="button" data-nav-target="${escapeHtml(item.pageId || 'study-card')}">
                        <i class="${escapeHtml(item.icon || 'fas fa-chart-line')}" aria-hidden="true"></i>
                        <div>
                            <strong>${escapeHtml(item.title || 'Subject')}</strong>
                            <span>${escapeHtml(item.meta || '')}</span>
                        </div>
                    </button>
                `).join('')}
            </div>
        `;
    }

    function renderStudentCampusFeedMarkup(campusFeed = []) {
        const items = Array.isArray(campusFeed) ? campusFeed.slice(0, 4) : [];
        if (!items.length) {
            return renderStudentEmptyBlock(
                'Campus feed is quiet',
                'Open Social to see campus posts.',
                'fas fa-comments'
            );
        }
        return `
            <div class="lux-student-feed-list">
                ${items.map((item) => `
                    <button class="lux-student-feed-row" type="button" data-nav-target="${escapeHtml(item.pageId || 'social')}">
                        <i class="${escapeHtml(item.icon || 'fas fa-comments')}" aria-hidden="true"></i>
                        <div>
                            <strong>${escapeHtml(item.title || 'Campus post')}</strong>
                            <span>${escapeHtml([item.meta, item.when].filter(Boolean).join(' · '))}</span>
                        </div>
                    </button>
                `).join('')}
            </div>
        `;
    }

    function renderStudentExtraMarkup(compactModel = {}) {
        return `
            <section class="lux-student-extra-strip lux-student-pulse-extra">
                <div class="lux-soft-chrome lux-student-cell lux-student-extra-panel lux-student-scores-panel">
                    ${renderStudentOverline('Last updated', 'fas fa-chart-line')}
                    ${renderStudentScoreListMarkup(compactModel.scores || [])}
                    <button class="lux-ghost-btn lux-student-compact-link" type="button" data-nav-target="study-card">Open study card <i class="fas fa-arrow-right" aria-hidden="true"></i></button>
                </div>
                <div class="lux-soft-chrome lux-student-cell lux-student-extra-panel lux-student-feed-panel">
                    ${renderStudentOverline('Campus feed', 'fas fa-comments')}
                    ${renderStudentCampusFeedMarkup(compactModel.campusFeed || [])}
                    <button class="lux-ghost-btn lux-student-compact-link" type="button" data-nav-target="social">Open social <i class="fas fa-arrow-right" aria-hidden="true"></i></button>
                </div>
            </section>
        `;
    }

    function renderWidgetContent(widget, role) {
        if (widget.renderType === 'alert') {
            if (!widget.alert) return '';
            const alertTone = ['green', 'royal', 'support', 'warm'].includes(widget.alert.tone) ? ` is-${widget.alert.tone}` : '';
            return `
                <div class="lux-soft-chrome lux-alert${alertTone}">
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
        if (widget.renderType === 'student-header') return renderStudentHeaderMarkup(widget.compactModel, widget.heroModel);
        if (widget.renderType === 'student-command') return renderStudentCommandMarkup(widget.compactModel);
        if (widget.renderType === 'student-summary') return renderStudentSummaryMarkup(widget.compactModel);
        if (widget.renderType === 'student-extra') return renderStudentExtraMarkup(widget.compactModel);
        if (widget.renderType === 'quick') {
            return `
                <section class="lux-soft-chrome lux-dashboard-section lux-builder-section">
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
        return `
            <section class="lux-soft-chrome lux-card lux-builder-card">
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

/* Home dashboard shell bind and renderDynamicHomeShell — static merged page (no customize/editor). */
    function bindHomeShellActions(homeShell) {
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
        if (typeof bindCacheClearLaunchButtons === 'function') {
            bindCacheClearLaunchButtons(homeShell);
        }
    }

    function buildStaticHomeSectionsHtml(widgets, role) {
        const fullWidth = new Set(['alert', 'hero', 'admin-ops', 'quick', 'student-header', 'student-command', 'student-summary', 'student-extra']);
        let html = '';
        let halfBuffer = [];
        const flushHalf = () => {
            if (!halfBuffer.length) return;
            const cells = halfBuffer.map(({ widget, content }) => {
                const widgetId = escapeHtml(widget.widgetId || widget.renderType || 'widget');
                const renderType = escapeHtml(widget.renderType || 'widget');
                return `<div class="lux-home-cell" data-home-widget-id="${widgetId}" data-home-render-type="${renderType}">${content}</div>`;
            }).join('');
            html += `<section class="lux-home-band lux-home-band--split" data-home-band="split">${cells}</section>`;
            halfBuffer = [];
        };
        (widgets || []).forEach((widget) => {
            const content = typeof renderWidgetContent === 'function' ? renderWidgetContent(widget, role) : '';
            if (!content) return;
            const widgetId = escapeHtml(widget.widgetId || widget.renderType || 'section');
            const renderType = escapeHtml(widget.renderType || 'section');
            if (fullWidth.has(widget.renderType)) {
                flushHalf();
                html += `<section class="lux-home-band lux-home-band--full" data-band="${renderType}" data-home-widget-id="${widgetId}" data-home-render-type="${renderType}">${content}</section>`;
                return;
            }
            halfBuffer.push({ widget, content });
            if (halfBuffer.length >= 2) flushHalf();
        });
        flushHalf();
        return html;
    }

    function getStaticHomeWidgets(role, model) {
        const definitions = typeof buildSystemWidgetDefinitions === 'function'
            ? buildSystemWidgetDefinitions(role, model)
            : [];
        return (definitions || []).filter((widget) => {
            if (!widget) return false;
            if (widget.visible === false) return false;
            if (widget.defaultVisible === false) return false;
            // Skip user-only editor types in static home
            if (widget.sourceType === 'custom' || widget.sourceType === 'pinned') return false;
            if (widget.renderType === 'shortcut' || widget.renderType === 'pinned') return false;
            return true;
        });
    }

    renderDynamicHomeShell = function (homeShell) {
        const role = getEffectiveRole();
        const model = buildHomeModel(role);
        const widgets = getStaticHomeWidgets(role, model);
        const title = model.title || 'Workspace overview';
        const copy = model.copy || 'Your faculty workspace at a glance.';
        const kicker = model.kicker || 'Home';
        const mergedContent = buildStaticHomeSectionsHtml(widgets, role);
        const toolbar = role === 'student' ? '' : `
                <div class="lux-home-toolbar">
                    <div>
                        <div class="lux-kicker">${escapeHtml(kicker)}</div>
                        <strong>${escapeHtml(title)}</strong>
                        ${copy ? `<p>${escapeHtml(copy)}</p>` : ''}
                    </div>
                </div>
        `;

        homeShell.innerHTML = `
            <div class="lux-home-page is-${escapeHtml(model.variant || role)}" data-role="${escapeHtml(model.variant || role)}" data-home-density="${role === 'student' ? 'compact' : 'standard'}" data-home-root="1">
                ${toolbar ? toolbar.replace('class="lux-home-toolbar"', 'class="lux-home-toolbar" data-home-region="toolbar"') : ''}
                <div class="lux-home-merged lux-soft-chrome" data-lux-glass-root="1" data-home-region="dashboard">
                    ${mergedContent}
                </div>
            </div>
        `;
        bindHomeShellActions(homeShell);
    };

    const __legacySyncTopbar = syncTopbar;
    syncTopbar = function () {
        __legacySyncTopbar();
        applySidebarState();
        const editButton = document.getElementById('lux-dashboard-edit-btn');
        if (editButton) {
            editButton.hidden = true;
            editButton.style.setProperty('display', 'none', 'important');
        }
    };

    // Live background is owned by luxury-background.js; installer still exports this no-op.
    startBackground = function () {};
