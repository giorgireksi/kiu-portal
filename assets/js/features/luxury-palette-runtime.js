/* Luxury palette + color helpers.
 * Peeled from index-luxury.js. Load before index-luxury.js (and before atmosphere).
 */
(function initLuxuryPaletteRuntime() {
    'use strict';
    if (window.__KIU_LUXURY_PALETTE_LOADED) return;
    window.__KIU_LUXURY_PALETTE_LOADED = true;

    window.__kiuCreateLuxuryPaletteApi = function createKiuLuxuryPaletteApi(deps = {}) {
        const d = deps;

        function getDashboardVisuals(...a) { return d.getDashboardVisuals(...a); }
        function setDashboardVisuals(...a) { return d.setDashboardVisuals(...a); }
        function getCurrentFacultyCode(...a) { return d.getCurrentFacultyCode(...a); }
        function getThemeMode(...a) {
            if (typeof d.getThemeMode === 'function') return d.getThemeMode(...a);
            if (typeof window.getThemeMode === 'function') return window.getThemeMode(...a);
            return 'dark';
        }
        function isBuiltInLuxuryPaletteKey(...a) { return d.isBuiltInLuxuryPaletteKey(...a); }
        function getFacultyProfile(...a) {
            if (typeof d.getFacultyProfile === 'function') return d.getFacultyProfile(...a);
            if (typeof window.getFacultyProfile === 'function') return window.getFacultyProfile(...a);
            return null;
        }

        const LUXURY_PALETTES = d.LUXURY_PALETTES;
        const DEFAULT_HOME_VISUALS = d.DEFAULT_HOME_VISUALS;
        const GLOBAL_LUXURY_PALETTE_SCOPE = d.GLOBAL_LUXURY_PALETTE_SCOPE;

        function hexToRgbTriplet(hex) {
            const cleaned = String(hex || '').trim().replace('#', '');
            if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return '200,130,42';
            const r = parseInt(cleaned.slice(0, 2), 16);
            const g = parseInt(cleaned.slice(2, 4), 16);
            const b = parseInt(cleaned.slice(4, 6), 16);
            return `${r},${g},${b}`;
        }
        function getPaletteByKey(key) {
            return LUXURY_PALETTES.find((palette) => palette.key === key)
                || LUXURY_PALETTES.find((palette) => palette.key === DEFAULT_HOME_VISUALS.paletteKey)
                || LUXURY_PALETTES[0];
        }
        function hslToRgb(h, s, l) {
            const hue = Number(h || 0);
            const sat = Number(s || 0) / 100;
            const lig = Number(l || 0) / 100;
            const k = (n) => (n + hue / 30) % 12;
            const a = sat * Math.min(lig, 1 - lig);
            const f = (n) => lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
            return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
        }
        function mixHsl(h1, s1, l1, h2, s2, l2, ratio) {
            const start = Number(h1 || 0);
            const end = Number(h2 || 0);
            let delta = end - start;
            if (Math.abs(delta) > 180) delta -= Math.sign(delta) * 360;
            const mix = Number(ratio || 0);
            return [
                (start + delta * mix + 360) % 360,
                Number(s1 || 0) + (Number(s2 || 0) - Number(s1 || 0)) * mix,
                Number(l1 || 0) + (Number(l2 || 0) - Number(l1 || 0)) * mix
            ];
        }
        function rgbTripletToString(rgb) {
            return `${rgb[0]},${rgb[1]},${rgb[2]}`;
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
        function buildLightModeBackdropTokens(accentRgb, accent2Rgb, options = {}) {
            const ink = String(options.inkRgb || '32,26,20').trim();
            const line = options.lineRgb || blendRgbTriplets(ink, accentRgb, 0.62);
            const particle = options.particleRgb || blendRgbTriplets(ink, accent2Rgb, 0.54);
            const haze = options.hazeRgb || blendRgbTriplets('239,228,213', accentRgb, 0.18);
            const glow = options.glowRgb || blendRgbTriplets(accentRgb, accent2Rgb, 0.35);
            return { line, particle, haze, glow };
        }
        function rgbTripletToHex(triplet, fallback = '#c8822a') {
            const parts = String(triplet || '')
                .split(',')
                .slice(0, 3)
                .map((part) => Math.max(0, Math.min(255, Math.round(Number(part.trim()) || 0))));
            if (parts.length !== 3 || parts.some((value) => !Number.isFinite(value))) return fallback;
            return `#${parts.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
        }
        let __luxColorProbeContext = null;
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
        function getFacultyLuxuryPaletteState(facultyCode = getCurrentFacultyCode()) {
            const normalizedFaculty = String(facultyCode || 'ECON').toUpperCase();
            const fallbackPalette = getPaletteByKey(DEFAULT_HOME_VISUALS.paletteKey);
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
            const scopedFaculty = String(visuals?.paletteFaculty || '').trim().toUpperCase();
            if (!scopedFaculty && (visuals?.paletteKey || visuals?.customPalette?.accent)) return true;
            if (scopedFaculty === GLOBAL_LUXURY_PALETTE_SCOPE || scopedFaculty === 'GLOBAL') return true;
            return scopedFaculty === String(facultyCode || '').trim().toUpperCase();
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
        function resolvePaletteKey() {
            const visuals = getDashboardVisuals();
            const stored = visuals?.paletteKey || localStorage.getItem('kiuLuxuryPalette') || localStorage.getItem('kiu-palette');
            if (stored === 'custom' || isBuiltInLuxuryPaletteKey(stored)) return stored;
            return visuals?.paletteKey || DEFAULT_HOME_VISUALS.paletteKey;
        }
        function applyPaletteValues(accent, accent2, persist, key) {
            const paletteClasses = ['obsidian-amber', 'slate-sapphire', 'pine-jade', 'burgundy-rose', 'sand-pearl', 'ink-orchid', 'ocean-teal'];
            paletteClasses.forEach((palette) => document.body.classList.remove(`palette-${palette}`));
            if (key && key !== 'custom' && paletteClasses.includes(key)) {
                document.body.classList.add(`palette-${key}`);
            }
            if (persist) {
                localStorage.setItem('kiuLuxuryPalette', key || 'custom');
                localStorage.setItem('kiuLuxuryPaletteFaculty', getCurrentFacultyCode());
                localStorage.setItem('kiu-palette', key);
            }
            if (typeof window.queueLuxuryTransparencyRefresh === 'function') {
                var _palTransVal = getDashboardVisuals().surfaceTransparency || localStorage.getItem('kiuLuxurySurfaceTransparency');
                window.queueLuxuryTransparencyRefresh(_palTransVal);
            }
            if (typeof window.__kiuApplyResolvedPalette === 'function') {
                window.__kiuApplyResolvedPalette();
                return;
            }
            const root = document.documentElement;
            root.style.setProperty('--lux-accent', accent);
            root.style.setProperty('--lux-accent-2', accent2);
            root.style.setProperty('--lux-accent-rgb', colorToRgbTriplet(accent));
            if (typeof window.__kiuApplyLmsParticleTheme === 'function') {
                window.__kiuApplyLmsParticleTheme();
            }
            if (typeof window.__kiuRefreshLuxuryBackground === 'function') {
                window.__kiuRefreshLuxuryBackground();
            }
        }
        function applyPaletteKey(key, persist) {
            const palette = getPaletteByKey(key);
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
            applyPaletteValues(palette.accent, palette.accent2, persist, palette.key);
        }
        function applyCustomPalette(accent, accent2, persist) {
            if (persist) {
                localStorage.setItem('kiuLuxuryCustomPalette', JSON.stringify({ accent, accent2 }));
                localStorage.setItem('kiuLuxuryCustomPaletteFaculty', getCurrentFacultyCode());
                localStorage.setItem('kiu-palette', 'custom');
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
            applyPaletteValues(accent, accent2, persist, 'custom');
        }
        function applyResolvedPalette() {
            const root = document.documentElement;
            const facultyPalette = getFacultyLuxuryPaletteState(getCurrentFacultyCode());
            const visuals = getDashboardVisuals();
            const visualsAreScoped = isVisualPaletteScopedToFaculty(visuals, facultyPalette.facultyCode);
            const palette = getPaletteByKey(visualsAreScoped ? (visuals.paletteKey || facultyPalette.paletteKey) : facultyPalette.paletteKey);
            const custom = visualsAreScoped && visuals.customPalette?.accent ? visuals.customPalette : resolveCustomPalette();
            const lightMode = getThemeMode() === 'light';
            const accent = visualsAreScoped
                ? (visuals.accentColor || custom?.accent || palette.accent || facultyPalette.accent)
                : facultyPalette.accent;
            const accent2 = visualsAreScoped
                ? (visuals.accentColor2 || custom?.accent2 || palette.accent2 || facultyPalette.accent2)
                : facultyPalette.accent2;
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
            const particleColor = visualsAreScoped ? (visuals.particleColor || accent2) : facultyPalette.accent2;
            const lineColor = visualsAreScoped ? (visuals.lineColor || accent) : facultyPalette.accent;
            const glowColor = visualsAreScoped ? (visuals.glowColor || accent2) : facultyPalette.accent2;
            const hazeColor = visualsAreScoped ? (visuals.hazeColor || accent) : facultyPalette.accent;
            const lightBackdrop = lightMode
                ? buildLightModeBackdropTokens(accentRgb, accent2Rgb, {
                    lineRgb: palette.lightLineRgb,
                    particleRgb: palette.lightParticleRgb
                })
                : null;
            root.style.setProperty('--lux-accent', accent);
            root.style.setProperty('--lux-accent-2', accent2);
            root.style.setProperty('--lux-accent-rgb', accentRgb);
            root.style.setProperty('--lux-glass-tint-rgb', colorToRgbTriplet(glassTint, lightMode ? '246,239,229' : '16,23,38'));
            root.style.setProperty('--lux-topbar-tint-rgb', colorToRgbTriplet(topbarTint, lightMode ? '239,228,213' : '11,18,32'));
            root.style.setProperty('--lux-shell-start-rgb', shellStartRgb);
            root.style.setProperty('--lux-shell-end-rgb', shellEndRgb);
            root.style.setProperty('--lux-shell-glow-rgb', shellGlowRgb);
            root.style.setProperty('--lux-home-secondary-rgb', accent2Rgb);
            root.style.setProperty(
                '--lux-bg-particle-rgb',
                lightBackdrop ? lightBackdrop.particle : colorToRgbTriplet(particleColor, accent2Rgb)
            );
            root.style.setProperty(
                '--lux-bg-line-rgb',
                lightBackdrop ? lightBackdrop.line : colorToRgbTriplet(lineColor, accentRgb)
            );
            root.style.setProperty(
                '--lux-bg-glow-rgb',
                lightBackdrop ? lightBackdrop.glow : colorToRgbTriplet(glowColor, accent2Rgb)
            );
            root.style.setProperty(
                '--lux-bg-haze-rgb',
                lightBackdrop ? lightBackdrop.haze : colorToRgbTriplet(hazeColor, accentRgb)
            );
            root.style.setProperty('--kiu-blue', accent);
            root.style.setProperty('--kiu-dark-blue', rgbTripletToHex(shellEndRgb, accent));
            root.style.setProperty('--kiu-navy', rgbTripletToHex(shellEndRgb, accent));
            root.style.setProperty('--kiu-gradient-blue', `linear-gradient(135deg, ${accent} 0%, ${accent2} 100%)`);
            root.style.setProperty('--kiu-shell-gradient', lightMode
                ? `radial-gradient(circle at 16% 10%, rgba(${accentRgb}, 0.12), transparent 30%), radial-gradient(circle at 84% 82%, rgba(${accent2Rgb}, 0.10), transparent 28%), linear-gradient(180deg, #fffaf3 0%, #f4ede2 100%)`
                : `radial-gradient(circle at 12% 8%, rgba(${accentRgb}, 0.18), transparent 32%), radial-gradient(circle at 84% 80%, rgba(${accent2Rgb}, 0.12), transparent 30%), radial-gradient(circle at 50% -12%, rgba(${shellGlowRgb}, 0.10), transparent 42%), linear-gradient(180deg, rgba(${shellStartRgb}, 0.42), rgba(${shellEndRgb}, 0.78) 48%, rgba(4,7,13,0.98) 100%)`);
            document.body.dataset.luxFaculty = facultyPalette.facultyCode;
            if (typeof window.queueLuxuryTransparencyRefresh === 'function') {
                window.queueLuxuryTransparencyRefresh(getDashboardVisuals().surfaceTransparency || localStorage.getItem('kiuLuxurySurfaceTransparency'));
            }
            if (typeof window.__kiuApplyLmsParticleTheme === 'function') {
                window.__kiuApplyLmsParticleTheme();
            }
        }

        window.__kiuApplyResolvedPalette = applyResolvedPalette;
        const api = {
            hexToRgbTriplet,
            getPaletteByKey,
            hslToRgb,
            mixHsl,
            rgbTripletToString,
            blendRgbTriplets,
            buildLightModeBackdropTokens,
            rgbTripletToHex,
            colorToRgbTriplet,
            sanitizeColorInput,
            getFacultyLuxuryPaletteState,
            isVisualPaletteScopedToFaculty,
            resolveCustomPalette,
            resolvePaletteKey,
            applyPaletteValues,
            applyPaletteKey,
            applyCustomPalette,
            applyResolvedPalette
        };
        Object.assign(window, api);
        return api;
    };
})();
