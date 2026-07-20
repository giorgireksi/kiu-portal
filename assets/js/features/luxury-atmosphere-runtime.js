/* Luxury atmosphere: theme / background / particles / fog / studio mixer.
 * Peeled from index-luxury.js. Load before index-luxury.js.
 */
(function initLuxuryAtmosphereRuntime() {
    'use strict';
    if (window.__KIU_LUXURY_ATMOSPHERE_LOADED) return;
    window.__KIU_LUXURY_ATMOSPHERE_LOADED = true;

    window.__kiuCreateLuxuryAtmosphereApi = function createKiuLuxuryAtmosphereApi(deps = {}) {
        const d = deps;

        function getDashboardVisuals(...a) { return d.getDashboardVisuals(...a); }
        function setDashboardVisuals(...a) { return d.setDashboardVisuals(...a); }
        function getDashboardPreferenceEntry(...a) { return d.getDashboardPreferenceEntry(...a); }
        function updateDashboardPreferenceEntry(...a) { return d.updateDashboardPreferenceEntry(...a); }
        function getHomeScopeKey(...a) { return d.getHomeScopeKey(...a); }
        function applyResolvedPalette(...a) { return d.applyResolvedPalette?.(...a); }
        function applySharedLightModeRootTokens(...a) { return d.applySharedLightModeRootTokens?.(...a); }
        function applyAtmosphereSettings(...a) { return d.applyAtmosphereSettings?.(...a); }
        function updateTransparency(...a) {
            if (typeof d.updateTransparency === 'function') return d.updateTransparency(...a);
            if (typeof window.updateTransparency === 'function') return window.updateTransparency(...a);
        }
        function syncStudioUi(...a) { return d.syncStudioUi?.(...a); }
        function showToast(...a) { return d.showToast?.(...a); }

        const DEFAULT_HOME_VISUALS = d.DEFAULT_HOME_VISUALS;
        const BACKGROUND_MODES = d.BACKGROUND_MODES;
        const PARTICLE_QUALITY_OPTIONS = d.PARTICLE_QUALITY_OPTIONS;
        const FOG_COLOR_PRESETS = d.FOG_COLOR_PRESETS;
        const DEFAULT_FOG_SETTINGS = d.DEFAULT_FOG_SETTINGS;

        function getThemeMode() {
            if (window.__KIU_FORCE_DARK_ROUTE__) return 'dark';
            const stored = String(getDashboardVisuals().themeMode || DEFAULT_HOME_VISUALS.themeMode).trim().toLowerCase();
            return stored === 'light' ? 'light' : 'dark';
        }
        function applyThemeMode(mode, persist) {
            const nextMode = mode === 'light' ? 'light' : 'dark';
            const root = document.documentElement;
            document.body.classList.toggle('lux-light-mode', nextMode === 'light');
            document.body.dataset.luxThemeMode = nextMode;
            root.classList.toggle('lux-light-mode', nextMode === 'light');
            root.dataset.luxThemeMode = nextMode;
            applySharedLightModeRootTokens(nextMode);
            if (persist) {
                localStorage.setItem('kiuLuxuryThemeMode', nextMode);
                setDashboardVisuals({ themeMode: nextMode });
            }
            applyResolvedPalette();
            // Re-apply transparency so inline backgrounds recalculate for the new mode
            if (typeof updateTransparency === 'function') {
                const saved = getDashboardVisuals().surfaceTransparency
                    || localStorage.getItem('kiuLuxurySurfaceTransparency')
                    || DEFAULT_HOME_VISUALS.surfaceTransparency;
                updateTransparency(parseInt(saved));
            }
            if (typeof window.__kiuRefreshLuxuryBackground === 'function') {
                window.__kiuRefreshLuxuryBackground();
            }
        }
        function sanitizeBackgroundMode(mode) {
            const normalized = String(mode || '').trim().toLowerCase();
            if (normalized === 'tunnel') return 'orbit';
            if (normalized === 'grid') return 'corners';
            if (normalized === 'constellation') return 'peak';
            if (normalized === 'aurora') return 'orbit';
            if (normalized === 'mesh') return 'corners';
            return BACKGROUND_MODES.some((item) => item.key === normalized) ? normalized : 'peak';
        }
        function areBackgroundAnimationsEnabled() {
            const scopeKey = getHomeScopeKey();
            const entry = getDashboardPreferenceEntry();
            const stored = String(localStorage.getItem('kiuLuxuryBackgroundAnimationsEnabled') || '').trim().toLowerCase();
            if (stored) {
                return !(stored === '0' || stored === 'false' || stored === 'off');
            }
            const scopedVisuals = entry.visualsByScope?.[scopeKey];
            if (scopedVisuals && typeof scopedVisuals.backgroundAnimationsEnabled === 'boolean') {
                return scopedVisuals.backgroundAnimationsEnabled;
            }
            if (
                entry.visuals
                && typeof entry.visuals === 'object'
                && Object.prototype.hasOwnProperty.call(entry.visuals, 'backgroundAnimationsEnabled')
                && typeof entry.visuals.backgroundAnimationsEnabled === 'boolean'
            ) {
                return entry.visuals.backgroundAnimationsEnabled;
            }
            return true;
        }
        function getBackgroundMode() {
            return sanitizeBackgroundMode(getDashboardVisuals().backgroundMode || DEFAULT_HOME_VISUALS.backgroundMode);
        }
        function setBackgroundAnimationsEnabled(enabled, persist = true) {
            const nextValue = enabled !== false;
            document.body.dataset.luxBackgroundAnimation = nextValue ? 'on' : 'off';
            if (persist) {
                localStorage.setItem('kiuLuxuryBackgroundAnimationsEnabled', nextValue ? '1' : '0');
                setDashboardVisuals({ backgroundAnimationsEnabled: nextValue });
            }
            applyAtmosphereSettings();
            if (typeof window.__kiuRefreshLuxuryBackground === 'function') {
                window.__kiuRefreshLuxuryBackground();
            }
            syncStudioUi();
            showToast(nextValue ? 'Background animations on' : 'Background animations off');
        }
        function setBackgroundMode(mode, persist) {
            const validMode = sanitizeBackgroundMode(mode);
            document.body.dataset.luxBackgroundMode = validMode;
            if (persist) {
                localStorage.setItem('kiuLuxuryBackgroundMode', validMode);
                setDashboardVisuals({ backgroundMode: validMode });
            }
            if (typeof window.__kiuRefreshLuxuryBackground === 'function') {
                window.__kiuRefreshLuxuryBackground(validMode);
            }
            syncStudioUi();
            showToast(`Background: ${BACKGROUND_MODES.find((item) => item.key === validMode)?.label || validMode}`);
        }
        function getParticleMotion() {
            const raw = getDashboardVisuals().particleMotion ?? localStorage.getItem('kiuLuxuryParticleMotion') ?? DEFAULT_HOME_VISUALS.particleMotion;
            const value = Number(raw);
            if (Number.isNaN(value)) return DEFAULT_HOME_VISUALS.particleMotion;
            return Math.min(120, Math.max(0, Math.round(value)));
        }
        function setParticleMotion(value, persist = true) {
            const nextValue = Math.min(120, Math.max(0, Math.round(Number(value) || DEFAULT_HOME_VISUALS.particleMotion)));
            if (persist) {
                localStorage.setItem('kiuLuxuryParticleMotion', String(nextValue));
                setDashboardVisuals({ particleMotion: nextValue });
            }
            if (typeof window.__kiuRefreshLuxuryBackground === 'function') {
                window.__kiuRefreshLuxuryBackground();
            }
            syncStudioUi();
        }
        function getParticleDensity() {
            const raw = getDashboardVisuals().particleDensity ?? localStorage.getItem('kiuLuxuryParticleDensity') ?? DEFAULT_HOME_VISUALS.particleDensity;
            const value = Number(raw);
            if (Number.isNaN(value)) return DEFAULT_HOME_VISUALS.particleDensity;
            return Math.min(100, Math.max(35, Math.round(value)));
        }
        function setParticleDensity(value, persist = true) {
            const nextValue = Math.min(100, Math.max(35, Math.round(Number(value) || DEFAULT_HOME_VISUALS.particleDensity)));
            if (persist) {
                localStorage.setItem('kiuLuxuryParticleDensity', String(nextValue));
                setDashboardVisuals({ particleDensity: nextValue });
            }
            if (typeof window.__kiuRefreshLuxuryBackground === 'function') {
                window.__kiuRefreshLuxuryBackground();
            }
            syncStudioUi();
        }
        function getParticleAmount() {
            const raw = getDashboardVisuals().particleAmount ?? localStorage.getItem('kiuLuxuryParticleAmount') ?? DEFAULT_HOME_VISUALS.particleAmount;
            const value = Number(raw);
            if (Number.isNaN(value)) return DEFAULT_HOME_VISUALS.particleAmount;
            return Math.min(150, Math.max(50, Math.round(value)));
        }
        function setParticleAmount(value, persist = true) {
            const nextValue = Math.min(150, Math.max(50, Math.round(Number(value) || DEFAULT_HOME_VISUALS.particleAmount)));
            if (persist) {
                localStorage.setItem('kiuLuxuryParticleAmount', String(nextValue));
                setDashboardVisuals({ particleAmount: nextValue });
            }
            if (typeof window.__kiuRefreshLuxuryBackground === 'function') {
                window.__kiuRefreshLuxuryBackground();
            }
            syncStudioUi();
        }
        function getParticleSharpness() {
            const raw = getDashboardVisuals().particleSharpness ?? localStorage.getItem('kiuLuxuryParticleSharpness') ?? DEFAULT_HOME_VISUALS.particleSharpness;
            const value = Number(raw);
            if (Number.isNaN(value)) return DEFAULT_HOME_VISUALS.particleSharpness;
            return Math.min(100, Math.max(0, Math.round(value)));
        }
        function setParticleSharpness(value, persist = true) {
            const nextValue = Math.min(100, Math.max(0, Math.round(Number(value) || DEFAULT_HOME_VISUALS.particleSharpness)));
            if (persist) {
                localStorage.setItem('kiuLuxuryParticleSharpness', String(nextValue));
                setDashboardVisuals({ particleSharpness: nextValue });
            }
            // Map 0-100 to blur 1.0px-0px (higher sharpness = less blur)
            const blurPx = ((100 - nextValue) / 100 * 1.0).toFixed(2);
            document.documentElement.style.setProperty('--lux-canvas-sharpness-blur', blurPx + 'px');
            syncStudioUi();
        }
        function getParticleQuality() {
            const stored = String(
                getDashboardVisuals().particleQuality ?? localStorage.getItem('kiuLuxuryParticleQuality') ?? DEFAULT_HOME_VISUALS.particleQuality
            ).trim().toLowerCase();
            return PARTICLE_QUALITY_OPTIONS.some((item) => item.key === stored) ? stored : DEFAULT_HOME_VISUALS.particleQuality;
        }
        function setParticleQuality(level, persist = true) {
            const nextLevel = PARTICLE_QUALITY_OPTIONS.some((item) => item.key === level) ? level : DEFAULT_HOME_VISUALS.particleQuality;
            document.body.dataset.luxParticleQuality = nextLevel;
            if (persist) {
                localStorage.setItem('kiuLuxuryParticleQuality', nextLevel);
                setDashboardVisuals({ particleQuality: nextLevel });
            }
            if (typeof window.__kiuRefreshLuxuryBackground === 'function') {
                window.__kiuRefreshLuxuryBackground();
            }
            syncStudioUi();
            showToast(`Particle quality: ${PARTICLE_QUALITY_OPTIONS.find((item) => item.key === nextLevel)?.label || nextLevel}`);
        }
        const DEFAULT_STUDIO_MIXER = {
            hA: 30,
            sA: 72,
            lA: 48,
            hB: 45,
            sB: 80,
            lB: 58,
            ratio: 50
        };
        function clampNumber(value, min, max, fallback) {
            const numeric = Number(value);
            if (!Number.isFinite(numeric)) return fallback;
            return Math.min(max, Math.max(min, numeric));
        }
        function sanitizeFogHexColor(value, fallback) {
            const normalized = String(value || '').trim();
            if (/^#[0-9a-fA-F]{6}$/.test(normalized)) return normalized.toLowerCase();
            return fallback;
        }
        function readStoredFogSettings() {
            try {
                const raw = localStorage.getItem('kiuLuxuryFogSettings');
                if (!raw) return null;
                const parsed = JSON.parse(raw);
                return parsed && typeof parsed === 'object' ? parsed : null;
            } catch (error) {
                return null;
            }
        }
        function sanitizeFogSettings(value) {
            const source = value && typeof value === 'object' ? value : {};
            return {
                highlightColor: sanitizeFogHexColor(source.highlightColor, DEFAULT_FOG_SETTINGS.highlightColor),
                midtoneColor: sanitizeFogHexColor(source.midtoneColor, DEFAULT_FOG_SETTINGS.midtoneColor),
                lowlightColor: sanitizeFogHexColor(source.lowlightColor, DEFAULT_FOG_SETTINGS.lowlightColor),
                baseColor: sanitizeFogHexColor(source.baseColor, DEFAULT_FOG_SETTINGS.baseColor),
                blurFactor: clampNumber(source.blurFactor, 0, 1, DEFAULT_FOG_SETTINGS.blurFactor),
                speed: clampNumber(source.speed, 0, 3, DEFAULT_FOG_SETTINGS.speed),
                zoom: clampNumber(source.zoom, 0.2, 4, DEFAULT_FOG_SETTINGS.zoom)
            };
        }
        function getFogSettings() {
            const stored = readStoredFogSettings();
            const visuals = getDashboardVisuals();
            return sanitizeFogSettings(stored || visuals.fogSettings || DEFAULT_FOG_SETTINGS);
        }
        function refreshActiveFogBackground() {
            if (getBackgroundMode() !== 'fog') return;
            if (typeof window.__kiuRefreshLuxuryVantaFogBackground === 'function') {
                window.__kiuRefreshLuxuryVantaFogBackground();
                return;
            }
            if (typeof window.__kiuApplyLmsFogTheme === 'function') {
                window.__kiuApplyLmsFogTheme();
            }
        }
        function setFogSettings(patch, persist = true) {
            const nextSettings = sanitizeFogSettings({
                ...getFogSettings(),
                ...(patch && typeof patch === 'object' ? patch : {})
            });
            if (persist) {
                localStorage.setItem('kiuLuxuryFogSettings', JSON.stringify(nextSettings));
                setDashboardVisuals({ fogSettings: nextSettings });
            }
            refreshActiveFogBackground();
            syncStudioUi();
        }
        function applyFogPreset(preset, persist = true) {
            const colors = FOG_COLOR_PRESETS[preset === 'light' ? 'light' : 'dark'];
            if (!colors) return;
            setFogSettings(colors, persist);
            showToast(`Fog preset: ${preset === 'light' ? 'Light' : 'Dark'}`);
        }
        function normalizeFogProfileBank(value) {
            return String(value || '').trim().toLowerCase() === 'light' ? 'light' : 'dark';
        }
        function defaultFogProfileMotion() {
            return {
                blurFactor: DEFAULT_FOG_SETTINGS.blurFactor,
                speed: DEFAULT_FOG_SETTINGS.speed,
                zoom: DEFAULT_FOG_SETTINGS.zoom
            };
        }
        function buildDefaultLightFogProfiles() {
            const motion = defaultFogProfileMotion();
            const light = FOG_COLOR_PRESETS.light;
            return [
                {
                    id: 'fog-light-soft-dawn',
                    name: 'Soft Dawn',
                    themeMode: 'light',
                    settings: sanitizeFogSettings({
                        highlightColor: '#fff1f2',
                        midtoneColor: light.midtoneColor,
                        lowlightColor: '#bae6fd',
                        baseColor: light.baseColor,
                        ...motion
                    })
                },
                {
                    id: 'fog-light-pale-mist',
                    name: 'Pale Mist',
                    themeMode: 'light',
                    settings: sanitizeFogSettings({
                        highlightColor: '#e0f2fe',
                        midtoneColor: '#7dd3fc',
                        lowlightColor: '#fef08a',
                        baseColor: '#f8fafc',
                        ...motion
                    })
                },
                {
                    id: 'fog-light-sun-haze',
                    name: 'Sun Haze',
                    themeMode: 'light',
                    settings: sanitizeFogSettings({
                        highlightColor: light.highlightColor,
                        midtoneColor: '#fde68a',
                        lowlightColor: light.lowlightColor,
                        baseColor: light.baseColor,
                        ...motion
                    })
                }
            ];
        }
        function sanitizeFogProfile(entry) {
            if (!entry || typeof entry !== 'object') return null;
            const id = String(entry.id || '').trim();
            const name = String(entry.name || '').trim();
            if (!id || !name) return null;
            return {
                id,
                name,
                themeMode: normalizeFogProfileBank(entry.themeMode),
                settings: sanitizeFogSettings(entry.settings)
            };
        }
        function readStoredFogProfiles() {
            try {
                const raw = localStorage.getItem('kiuLuxuryFogProfiles');
                if (!raw) return null;
                const parsed = JSON.parse(raw);
                return Array.isArray(parsed) ? parsed : null;
            } catch (error) {
                return null;
            }
        }
        function writeStoredFogProfiles(profiles) {
            try {
                localStorage.setItem('kiuLuxuryFogProfiles', JSON.stringify(Array.isArray(profiles) ? profiles : []));
            } catch (error) {
                return false;
            }
            return true;
        }
        function syncFogProfilesStorage(profiles) {
            return writeStoredFogProfiles(
                (Array.isArray(profiles) ? profiles : [])
                    .map(sanitizeFogProfile)
                    .filter(Boolean)
            );
        }
        function fogProfileSettingsEqual(left, right) {
            const a = sanitizeFogSettings(left);
            const b = sanitizeFogSettings(right);
            return a.highlightColor === b.highlightColor
                && a.midtoneColor === b.midtoneColor
                && a.lowlightColor === b.lowlightColor
                && a.baseColor === b.baseColor
                && a.blurFactor === b.blurFactor
                && a.speed === b.speed
                && a.zoom === b.zoom;
        }
        function mergeFogProfileStores(entryProfiles, storedProfiles) {
            const storedById = new Map();
            storedProfiles.forEach((profile) => {
                const normalized = sanitizeFogProfile(profile);
                if (normalized) storedById.set(normalized.id, normalized);
            });
            const entryById = new Map();
            entryProfiles.forEach((profile) => {
                const normalized = sanitizeFogProfile(profile);
                if (normalized) entryById.set(normalized.id, normalized);
            });
            const merged = entryProfiles.map((profile) => {
                const normalized = sanitizeFogProfile(profile);
                if (!normalized) return null;
                const stored = storedById.get(normalized.id);
                if (!stored) return normalized;
                if (!fogProfileSettingsEqual(normalized.settings, stored.settings)
                    || normalized.name !== stored.name
                    || normalized.themeMode !== stored.themeMode) {
                    return stored;
                }
                return normalized;
            }).filter(Boolean);
            storedProfiles.forEach((profile) => {
                const normalized = sanitizeFogProfile(profile);
                if (!normalized || entryById.has(normalized.id)) return;
                merged.push(normalized);
            });
            return merged;
        }
        function ensureFogProfileStore() {
            const entry = getDashboardPreferenceEntry();
            const entryProfiles = (Array.isArray(entry.fogProfiles) ? entry.fogProfiles : [])
                .map(sanitizeFogProfile)
                .filter(Boolean);
            const storedRaw = readStoredFogProfiles();
            const storedProfiles = storedRaw
                ? storedRaw.map(sanitizeFogProfile).filter(Boolean)
                : [];
            let merged = mergeFogProfileStores(entryProfiles, storedProfiles);
            const hasLightBank = merged.some((profile) => profile.themeMode === 'light');
            if (!hasLightBank) {
                merged = [...merged, ...buildDefaultLightFogProfiles()];
            }
            const entryJson = JSON.stringify(entryProfiles);
            const mergedJson = JSON.stringify(merged);
            if (entryJson !== mergedJson) {
                updateDashboardPreferenceEntry((nextEntry) => {
                    nextEntry.fogProfiles = merged;
                }, { persist: true });
            }
            syncFogProfilesStorage(merged);
            return getDashboardPreferenceEntry().fogProfiles || merged;
        }
        function getAllFogProfiles() {
            return ensureFogProfileStore()
                .map(sanitizeFogProfile)
                .filter(Boolean);
        }
        function getFogProfiles(bank) {
            const activeBank = normalizeFogProfileBank(bank ?? getThemeMode());
            return getAllFogProfiles().filter((profile) => profile.themeMode === activeBank);
        }
        function slugFogProfileName(name) {
            return String(name || 'profile').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'profile';
        }
        function saveFogProfile(name, bank) {
            const trimmed = String(name || '').trim();
            if (!trimmed) return null;
            const profile = {
                id: `fog-${slugFogProfileName(trimmed)}-${Date.now().toString(36)}`,
                name: trimmed,
                themeMode: normalizeFogProfileBank(bank ?? getThemeMode()),
                settings: sanitizeFogSettings(getFogSettings())
            };
            updateDashboardPreferenceEntry((entry) => {
                const store = Array.isArray(entry.fogProfiles) ? entry.fogProfiles : [];
                entry.fogProfiles = [...store, profile];
                syncFogProfilesStorage(entry.fogProfiles);
            }, { persist: true });
            showToast(`Fog profile saved: ${trimmed}`);
            return profile;
        }
        function applyFogProfile(id) {
            const profileId = String(id || '').trim();
            if (!profileId) return false;
            const profile = getAllFogProfiles().find((item) => item.id === profileId);
            if (!profile) return false;
            setFogSettings(profile.settings, true);
            showToast(`Fog profile applied: ${profile.name}`);
            return true;
        }
        function deleteFogProfile(id) {
            const profileId = String(id || '').trim();
            if (!profileId) return false;
            const profile = getAllFogProfiles().find((item) => item.id === profileId);
            if (!profile) return false;
            updateDashboardPreferenceEntry((entry) => {
                entry.fogProfiles = (entry.fogProfiles || []).filter((item) => item.id !== profileId);
                syncFogProfilesStorage(entry.fogProfiles);
            }, { persist: true });
            showToast(`Fog profile removed: ${profile.name}`);
            return true;
        }
        function updateFogProfile(id, patch = {}) {
            const profileId = String(id || '').trim();
            if (!profileId) return null;
            const existing = getAllFogProfiles().find((item) => item.id === profileId);
            if (!existing) return null;
            const name = String(patch.name ?? existing.name).trim();
            if (!name) return null;
            const nextProfile = {
                id: profileId,
                name,
                themeMode: existing.themeMode,
                settings: sanitizeFogSettings(patch.settings ?? existing.settings)
            };
            updateDashboardPreferenceEntry((entry) => {
                if (!Array.isArray(entry.fogProfiles)) entry.fogProfiles = [];
                const index = entry.fogProfiles.findIndex((item) => item.id === profileId);
                if (index >= 0) entry.fogProfiles[index] = nextProfile;
                else entry.fogProfiles.push(nextProfile);
                syncFogProfilesStorage(entry.fogProfiles);
            }, { persist: true });
            showToast(`Fog profile updated: ${name}`);
            return nextProfile;
        }
        function reorderFogProfiles(orderedIds, bank) {
            const ids = Array.isArray(orderedIds)
                ? orderedIds.map((id) => String(id || '').trim()).filter(Boolean)
                : [];
            if (!ids.length) return false;
            const activeBank = normalizeFogProfileBank(bank ?? getThemeMode());
            const allProfiles = getAllFogProfiles();
            const bankProfiles = allProfiles.filter((profile) => profile.themeMode === activeBank);
            if (ids.length !== bankProfiles.length) return false;
            const byId = new Map(bankProfiles.map((profile) => [profile.id, profile]));
            if (ids.some((id) => !byId.has(id))) return false;
            const reorderedQueue = ids.map((id) => byId.get(id));
            const queue = [...reorderedQueue];
            const nextProfiles = allProfiles.map((profile) => (
                profile.themeMode === activeBank ? queue.shift() : profile
            ));
            updateDashboardPreferenceEntry((entry) => {
                entry.fogProfiles = nextProfiles;
                syncFogProfilesStorage(entry.fogProfiles);
            }, { persist: true });
            return true;
        }
        function findMatchingFogProfileId(settings, bank) {
            const normalized = sanitizeFogSettings(settings);
            const match = getFogProfiles(bank).find((profile) => {
                const stored = profile.settings;
                return stored.highlightColor === normalized.highlightColor
                    && stored.midtoneColor === normalized.midtoneColor
                    && stored.lowlightColor === normalized.lowlightColor
                    && stored.baseColor === normalized.baseColor
                    && stored.blurFactor === normalized.blurFactor
                    && stored.speed === normalized.speed
                    && stored.zoom === normalized.zoom;
            });
            return match?.id || '';
        }
        function sanitizeStudioMixerState(value) {
            const source = value || {};
            return {
                hA: clampNumber(source.hA, 0, 360, DEFAULT_STUDIO_MIXER.hA),
                sA: clampNumber(source.sA, 0, 100, DEFAULT_STUDIO_MIXER.sA),
                lA: clampNumber(source.lA, 20, 80, DEFAULT_STUDIO_MIXER.lA),
                hB: clampNumber(source.hB, 0, 360, DEFAULT_STUDIO_MIXER.hB),
                sB: clampNumber(source.sB, 0, 100, DEFAULT_STUDIO_MIXER.sB),
                lB: clampNumber(source.lB, 20, 80, DEFAULT_STUDIO_MIXER.lB),
                ratio: clampNumber(source.ratio, 0, 100, DEFAULT_STUDIO_MIXER.ratio)
            };
        }
        function getStudioMixerState() {
            const stateMixer = getDashboardVisuals().mixerState;
            if (stateMixer) {
                return sanitizeStudioMixerState(stateMixer);
            }
            try {
                const raw = localStorage.getItem('kiuLuxuryMixerState');
                return sanitizeStudioMixerState(raw ? JSON.parse(raw) : DEFAULT_STUDIO_MIXER);
            } catch (e) {
                return { ...DEFAULT_STUDIO_MIXER };
            }
        }
        function setStudioMixerState(state, persist) {
            const nextState = sanitizeStudioMixerState(state);
            if (persist) {
                localStorage.setItem('kiuLuxuryMixerState', JSON.stringify(nextState));
                setDashboardVisuals({ mixerState: nextState });
            }
            return nextState;
        }
        function readStudioMixerInputs() {
            return sanitizeStudioMixerState({
                hA: document.getElementById('lux-hA')?.value,
                sA: document.getElementById('lux-sA')?.value,
                lA: document.getElementById('lux-lA')?.value,
                hB: document.getElementById('lux-hB')?.value,
                sB: document.getElementById('lux-sB')?.value,
                lB: document.getElementById('lux-lB')?.value,
                ratio: document.getElementById('lux-mix-ratio')?.value
            });
        }
        function writeStudioMixerInputs(state) {
            const nextState = sanitizeStudioMixerState(state);
            const bindings = {
                'lux-hA': nextState.hA,
                'lux-sA': nextState.sA,
                'lux-lA': nextState.lA,
                'lux-hB': nextState.hB,
                'lux-sB': nextState.sB,
                'lux-lB': nextState.lB,
                'lux-mix-ratio': nextState.ratio
            };
            Object.entries(bindings).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) element.value = String(value);
            });
            return nextState;
        }

        const api = {
            getThemeMode,
            applyThemeMode,
            sanitizeBackgroundMode,
            areBackgroundAnimationsEnabled,
            getBackgroundMode,
            setBackgroundAnimationsEnabled,
            setBackgroundMode,
            getParticleMotion,
            setParticleMotion,
            getParticleDensity,
            setParticleDensity,
            getParticleAmount,
            setParticleAmount,
            getParticleSharpness,
            setParticleSharpness,
            getParticleQuality,
            setParticleQuality,
            DEFAULT_STUDIO_MIXER,
            clampNumber,
            sanitizeFogHexColor,
            readStoredFogSettings,
            sanitizeFogSettings,
            getFogSettings,
            refreshActiveFogBackground,
            setFogSettings,
            applyFogPreset,
            normalizeFogProfileBank,
            defaultFogProfileMotion,
            buildDefaultLightFogProfiles,
            sanitizeFogProfile,
            readStoredFogProfiles,
            writeStoredFogProfiles,
            syncFogProfilesStorage,
            fogProfileSettingsEqual,
            mergeFogProfileStores,
            ensureFogProfileStore,
            getAllFogProfiles,
            getFogProfiles,
            slugFogProfileName,
            saveFogProfile,
            applyFogProfile,
            deleteFogProfile,
            updateFogProfile,
            reorderFogProfiles,
            findMatchingFogProfileId,
            sanitizeStudioMixerState,
            getStudioMixerState,
            setStudioMixerState,
            readStudioMixerInputs,
            writeStudioMixerInputs
        };
        Object.assign(window, api);
        return api;
    };
})();
