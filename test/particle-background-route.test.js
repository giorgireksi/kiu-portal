import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { readHomeDashboardCss } from './helpers/bare-shell-css.js';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    const source = readFileSync(full, 'utf8');
    if (relativePath === 'assets/js/features/index-luxury.js') {
        return [
            relativePath,
            'assets/js/features/luxury-atmosphere-runtime.js',
            'assets/js/features/luxury-palette-runtime.js',
            'assets/js/features/luxury-transparency-model-runtime.js',
            'assets/js/features/luxury-index-runtime.js',
            'assets/js/features/luxury-index-sync-runtime.js',
        ].map((file) => readFileSync(join(process.cwd(), file), 'utf8')).join('\n');
    }
    if (relativePath === 'assets/js/features/luxury-shell-chrome.js') {
        return [
            'assets/js/features/luxury-shell-studio-runtime.js',
            relativePath,
            'assets/js/features/luxury-shell-picker-runtime.js',
            'assets/js/features/luxury-shell-topbar-runtime.js',
        ].map((file) => readFileSync(join(process.cwd(), file), 'utf8')).join('\n');
    }
    return source;
}

describe('particle background route integration', () => {
    it('exposes portal particle background globals', () => {
        const particle = readSource('assets/js/features/luxury-particle-background.js');
        const orchestrator = readSource('assets/js/features/luxury-background.js');
        expect(particle).toContain('window.__kiuInitLuxuryParticleBackground = initLuxuryParticleBackground');
        expect(orchestrator).toContain('window.__kiuRefreshLuxuryBackground');
        expect(particle).toContain('function applyLmsParticleTheme()');
        expect(particle).toContain('lux-bg-canvas');
        /* Orchestrator ES-imports these named exports */
        expect(particle).toContain('export {');
        expect(particle).toContain('disposeLuxuryParticleBackground');
        expect(particle).toContain('probeWebGlAvailable');
        expect(orchestrator).toContain('import("./luxury-particle-background.js');
    });

    it('migrates legacy background mode names to particle variants', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');
        expect(luxury).toContain("if (normalized === 'constellation') return 'peak'");
        expect(luxury).toContain("if (normalized === 'aurora') return 'orbit'");
        expect(luxury).toContain("if (normalized === 'mesh') return 'corners'");
        expect(luxury).toContain("key: 'peak'");
        expect(luxury).toContain('particleMotion');
        expect(luxury).toContain('particleDensity');
        expect(luxury).toContain('particleQuality');
    });

    it('initializes particle background from index-luxury ready hook', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');
        expect(luxury).toContain('window.__kiuInitLuxuryParticleBackground');
        expect(luxury).not.toContain('startBackground();');
    });

    it('lazy-loads background orchestrator after the shell is ready', () => {
        const htmlFiles = [
            'index.html',
            'lms.html',
            'profile-view.html',
            'orders.html'
        ];
        htmlFiles.forEach((file) => {
            const html = readSource(file);
            expect(html).not.toContain('luxury-background.js');
        });
        expect(readSource('assets/js/features/index-luxury.js'))
            .toContain("import('./luxury-background.js?v=20260817-timetablebg1')");
    });

    it('lazy-creates LMS particle canvas via orchestrator (no static markup)', () => {
        const html = readSource('lms.html');
        const orchestrator = readSource('assets/js/features/luxury-background.js');
        expect(html).not.toContain('<canvas id="lux-bg-canvas"');
        expect(readSource('assets/js/features/index-luxury.js')).toContain('ensureLuxuryBackgroundRuntime');
        expect(orchestrator).toContain('scheduleBackgroundSelfInit');
        expect(orchestrator).toContain('window.__kiuInitLuxuryParticleBackground');
    });

    it('reads LMS css variables for particle theme colors', () => {
        const particle = readSource('assets/js/features/luxury-particle-background.js');
        expect(particle).toContain("--lux-accent");
        expect(particle).toContain("--lux-accent-2");
        expect(particle).toContain("--lux-bg");
        expect(particle).toContain('lux-light-mode');
    });

    it('does not freeze motion based on performance tier', () => {
        const particle = readSource('assets/js/features/luxury-particle-background.js');
        expect(particle).toContain('staticBackgroundOnly = !animationsEnabled');
        expect(particle).not.toContain("staticBackgroundOnly = getPerformanceTier() === 'efficient'");
        expect(particle).not.toContain('targetMotion = reducedMotion || staticBackgroundOnly');
        const orchestrator = readSource('assets/js/features/luxury-background.js');
        expect(orchestrator).toContain('scheduleBackgroundSelfInit');
    });

    it('disposes WebGL engines when background animations are off', () => {
        const particle = readSource('assets/js/features/luxury-particle-background.js');
        const orchestrator = readSource('assets/js/features/luxury-background.js');
        const css = readSource('assets/css/lux-fouc-ht.css');

        const refreshBlock = particle.slice(
            particle.indexOf('function refreshLuxuryParticleBackground'),
            particle.indexOf('function disposeLuxuryParticleBackground')
        );
        expect(refreshBlock).toContain('if (!arePortalBackgroundAnimationsEnabled())');
        expect(refreshBlock).toContain('disposeLuxuryParticleBackground();');
        expect(refreshBlock).not.toContain('if (staticBackgroundOnly && renderer)');

        expect(particle).toContain('canvas.style.display = "none"');
        expect(particle).toContain('window.__kiuLuxuryParticleBackgroundReady = false');
        expect(particle).not.toContain('__kiuWebGlUnavailable = true');

        expect(orchestrator).toContain('function areBackgroundAnimationsEnabled');
        expect(orchestrator).toContain('async function disposeBackgroundEngines');
        expect(orchestrator).toContain('if (!areBackgroundAnimationsEnabled())');
        expect(orchestrator).toContain('await disposeBackgroundEngines()');

        expect(css).toContain('body[data-lux-background-animation="off"]:not([data-lux-static-background="gallery"]) #lux-bg-canvas');
        expect(css).toContain('body[data-lux-background-animation="off"]:not([data-lux-static-background="gallery"]) #lux-bg-fog');
    });

    it('uses full-opacity particle presentation when background animation is on', () => {
        const css = readHomeDashboardCss() + '\n' + readSource('assets/css/lux-fouc-ht.css');
        expect(css).toContain('body[data-lux-background-animation="on"] #lux-bg-canvas');
        expect(css).toMatch(/body\[data-lux-background-animation="on"\] #lux-bg-canvas[\s\S]*opacity:\s*1/);
        expect(css).toContain('body[data-lux-background-animation="on"] #lux-bg-overlay');

        const luxury = readSource('assets/js/features/index-luxury.js');
        expect(luxury).toContain("backgroundAnimationsEnabled ? '1' : '0'");
        expect(luxury).toContain("setProperty('--lux-overlay-opacity', '0')");
    });

    it('snaps particle density and motion on portal refresh', () => {
        const particle = readSource('assets/js/features/luxury-particle-background.js');
        expect(particle).toContain('function applyParticleSettingsNow()');
        expect(particle).toContain('uniforms.uDensityFade.value = targetDensity');
        expect(particle).toContain('mapPortalDensityToShader');
        expect(particle).toContain('applyParticleSettingsNow();');
    });

    it('builds darkened light-mode backdrop tokens from palette accents', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');
        expect(luxury).toContain('function buildLightModeBackdropTokens');
        expect(luxury).toMatch(/lightMode[\s\S]*buildLightModeBackdropTokens\(accentRgb, accent2Rgb/);
        expect(luxury).toContain('lightLineRgb');
        expect(luxury).toContain('lightBackdrop.particle');
    });

    it('uses palette particle tokens and avoids white wash in light mode', () => {
        const particle = readSource('assets/js/features/luxury-particle-background.js');
        expect(particle).toContain('function rgbTripletToColor');
        expect(particle).toContain('--lux-bg-line-rgb');
        expect(particle).toContain('--lux-bg-particle-rgb');
        expect(particle).toContain('--lux-bg-haze-rgb');
        expect(particle).toMatch(/if \(lightMode\) \{[\s\S]*rgbTripletToColor\(lineRgb/);
        expect(particle).not.toMatch(/lightMode \? 0\.68 : 0\.58/);
        expect(particle).toContain('material.blending = lightMode ? THREE.NormalBlending : THREE.AdditiveBlending');
        expect(particle).toContain('material.needsUpdate = true');
        expect(particle).toContain('ribbonMaterial.blending = lightMode ? THREE.NormalBlending : THREE.AdditiveBlending');
        expect(particle).toContain('function ensureContrastAgainstBackground');
        expect(particle).toContain('uAlphaFloor');
    });

    it('refreshes resolved palette on theme toggle and faculty switch', () => {
        const atmosphere = readSource('assets/js/features/luxury-atmosphere-runtime.js');
        const paletteRuntime = readSource('assets/js/features/luxury-palette-runtime.js');
        const utilities = readSource('assets/js/shared/utilities.js');
        const themeBlock = atmosphere.slice(
            atmosphere.indexOf('function applyThemeMode'),
            atmosphere.indexOf('function sanitizeBackgroundMode')
        );
        expect(themeBlock).toContain('applyResolvedPalette()');
        expect(paletteRuntime).toMatch(/applyPaletteValues[\s\S]*__kiuApplyResolvedPalette/);
        expect(utilities).toMatch(/applyFacultyLuxuryTheme[\s\S]*__kiuApplyResolvedPalette/);
        expect(utilities).toContain('__kiuApplyLmsParticleTheme');
    });

    it('rebuilds variant geometry when studio switches particle mode', () => {
        const particle = readSource('assets/js/features/luxury-particle-background.js');
        const refreshBlock = particle.slice(
            particle.indexOf('function refreshLuxuryParticleBackground'),
            particle.indexOf('function disposeLuxuryParticleBackground')
        );
        expect(refreshBlock).toContain('setVariant(validMode)');
        expect(refreshBlock).not.toMatch(/activeVariantName\s*=\s*validMode[\s\S]*setVariant\(validMode\)/);
        expect(particle).toContain('const nextVariant = normalizeVariantKey(readPortalVariant())');
    });

    it('does not loseContext on shared lux-bg-canvas during dispose, and guards WebGLRenderer create', () => {
        const particle = readSource('assets/js/features/luxury-particle-background.js');
        const disposeBlock = particle.slice(
            particle.indexOf('function disposeLuxuryParticleBackground'),
            particle.indexOf('function initLuxuryParticleBackground')
        );
        expect(disposeBlock).not.toContain('loseContext');
        expect(disposeBlock).toContain('renderer?.dispose()');
        expect(particle).toContain('__kiuLuxuryParticleBackgroundUnavailable = true');
        expect(particle).toMatch(/try\s*\{\s*renderer\s*=\s*new\s+THREE\.WebGLRenderer/);
        expect(particle).toContain('ensureUsableParticleCanvas');
    });

    it('caps particle quality on efficient tier only when quality is auto', () => {
        const particle = readSource('assets/js/features/luxury-particle-background.js');
        const resolveQualityBlock = particle.slice(
            particle.indexOf('function resolveQuality'),
            particle.indexOf('function detectQualityProfile')
        );
        expect(resolveQualityBlock).toMatch(/if \(resolvedKey === "auto"\)[\s\S]*getPerformanceTier\(\) === "efficient"/);
        const afterAutoBlock = resolveQualityBlock.replace(
            /if \(resolvedKey === "auto"\) \{[\s\S]*?\n  \}/,
            ''
        );
        expect(afterAutoBlock).not.toContain('getPerformanceTier() === "efficient"');
    });

    it('registers fog in the Color & Motion Studio background catalog', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');

        expect(luxury).toMatch(/const BACKGROUND_MODES = \[[\s\S]*key: 'fog'/);
        expect(luxury).toContain("label: 'Volumetric Fog'");
        expect(luxury).toContain("icon: 'fas fa-smog'");
        expect(shellChrome).toContain('BACKGROUND_MODES.forEach((mode) => {');
        expect(shellChrome).toContain('button.dataset.bgMode = mode.key');
    });

    it('accepts fog as a canonical background mode', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');
        const sanitizeBlock = luxury.slice(
            luxury.indexOf('function sanitizeBackgroundMode'),
            luxury.indexOf('function areBackgroundAnimationsEnabled')
        );
        expect(sanitizeBlock).toContain('BACKGROUND_MODES.some((item) => item.key === normalized)');
        expect(luxury).not.toContain("if (normalized === 'fog') return 'peak'");
    });

    it('keeps legacy background mode migration unchanged when fog is added', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');
        expect(luxury).toContain("if (normalized === 'tunnel') return 'orbit'");
        expect(luxury).toContain("if (normalized === 'grid') return 'corners'");
        expect(luxury).toContain("if (normalized === 'constellation') return 'peak'");
        expect(luxury).toContain("if (normalized === 'aurora') return 'orbit'");
        expect(luxury).toContain("if (normalized === 'mesh') return 'corners'");
        expect(luxury).not.toContain("if (normalized === 'fog') return");
    });

    it('routes fog through the background orchestrator with mutual dispose', () => {
        const orchestrator = readSource('assets/js/features/luxury-background.js');
        const particle = readSource('assets/js/features/luxury-particle-background.js');
        const fog = readSource('assets/js/features/luxury-vanta-fog-background.js');
        const foucCss = readSource('assets/css/lux-fouc-ht.css');

        expect(orchestrator).toContain('function isFogMode');
        expect(orchestrator).toContain('__kiuDisposeLuxuryParticleBackground');
        expect(orchestrator).toContain('__kiuDisposeLuxuryVantaFogBackground');
        expect(orchestrator).toContain('import("./luxury-vanta-fog-background.js?v=20260723-adaptive1")');
        expect(orchestrator).toContain('scheduleBackgroundSelfInit');
        expect(orchestrator).toContain('window.__kiuRefreshLuxuryBackground');
        expect(particle).not.toContain('window.__kiuRefreshLuxuryBackground = refreshLuxuryParticleBackground');
        expect(particle).toContain('window.__kiuRefreshLuxuryParticleBackground = refreshLuxuryParticleBackground');
        expect(particle).toContain('function isFogBackgroundMode');
        expect(particle).toContain('=== "fog"');
        expect(fog).toContain('applyLmsFogTheme');
        expect(fog).toContain('function getFogRenderScale');
        expect(fog).toContain('scale: nextRenderScale');
        expect(fog).toContain('window.__kiuApplyLmsFogTheme');
        expect(fog).not.toContain('__kiuLuxuryParticleBackgroundUnavailable');
        expect(foucCss).toContain('#lux-bg-fog');
        expect(foucCss).toContain('body[data-lux-background-mode="fog"][data-lux-background-animation="on"] #lux-bg-fog');
        expect(foucCss).toContain('body[data-lux-background-mode="fog"][data-lux-background-animation="on"] #lux-bg-canvas');
    });

    it('exposes dedicated fog settings separate from particle controls', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');
        const fog = readSource('assets/js/features/luxury-vanta-fog-background.js');

        expect(luxury).toContain('function getFogSettings');
        expect(luxury).toContain('function setFogSettings');
        expect(luxury).toContain('function applyFogPreset');
        expect(luxury).toContain('function ensureFogProfileStore');
        expect(luxury).toContain('function getFogProfiles');
        expect(luxury).toContain('function saveFogProfile');
        expect(luxury).toContain('function applyFogProfile');
        expect(luxury).toContain('function deleteFogProfile');
        expect(luxury).toContain('function updateFogProfile');
        expect(luxury).toContain('function reorderFogProfiles');
        expect(luxury).toContain('entry.fogProfiles');
        expect(luxury).toContain('kiuLuxuryFogProfiles');
        expect(luxury).toContain('readStoredFogProfiles');
        expect(luxury).toContain('writeStoredFogProfiles');
        expect(luxury).toContain('syncFogProfilesStorage');
        expect(luxury).toContain("highlightColor: '#b794f6'");
        expect(shellChrome).toContain('id="lux-bg-mode-panels-store"');
        expect(shellChrome).toContain('id="lux-bg-settings-panel-fog"');
        expect(shellChrome).toContain('data-bg-mode-panel="fog"');
        expect(shellChrome).toContain('lux-bg-mode-item');
        expect(shellChrome).toContain('lux-bg-mode-settings-btn');
        // index-luxury.css retired; mode chrome is DOM/classes in luxury-shell-chrome (asserted above).
        expect(existsSync(join(process.cwd(), 'assets/css/index-luxury.css'))).toBe(false);
        expect(shellChrome).toContain('lux-bg-mode-params-backdrop');
        expect(shellChrome).toContain('function openBgModeParamsPopup');
        expect(shellChrome).toContain('lux-fog-blur-slider');
        expect(shellChrome).toContain('lux-fog-speed-slider');
        expect(shellChrome).toContain('lux-fog-zoom-slider');
        expect(shellChrome).toContain('id="lux-fog-profiles-section"');
        expect(shellChrome).toContain('id="lux-fog-profile-list"');
        expect(shellChrome).toContain('id="lux-fog-profile-name-input"');
        expect(shellChrome).toContain('id="lux-fog-profile-add"');
        expect(shellChrome).toContain('data-fog-profile-add');
        expect(shellChrome).toContain('data-fog-profile-save-edit');
        expect(shellChrome).toContain('data-fog-profile-discard-edit');
        expect(shellChrome).toContain('data-fog-profile-apply');
        expect(shellChrome).toContain('data-fog-profile-edit');
        expect(shellChrome).toContain('data-fog-profile-delete');
        expect(shellChrome).toContain("FOG_PARAMS_TEMPLATE_VERSION = '7'");
        expect(shellChrome).toContain('lux-fog-profile-index');
        expect(shellChrome).toContain('data-fog-profile-drag-handle');
        expect(shellChrome).toContain('data-lux-skip-modern-button="true"');
        expect(shellChrome).toContain('data-fog-profile-bank');
        expect(shellChrome).toContain('function buildFogProfileGhostMarkup');
        expect(shellChrome).toContain('function bindFogProfileListDrag');
        expect(shellChrome).toContain('function createFogProfileDragGhost');
        expect(shellChrome).toContain('function flipFogProfileSiblings');
        expect(shellChrome).toContain('function animateFogProfileGhostDrop');
        expect(shellChrome).toContain('prefersReducedFogProfileMotion');
        expect(shellChrome).toContain('function readFogSettingsFromStudioInputs');
        expect(shellChrome).toContain('function resolveFogSettingsForProfileSave');
        expect(shellChrome).toContain('function syncFogProfileEditPreview');
        expect(shellChrome).toContain("editBar.classList.toggle('is-editing', editing)");
        expect(shellChrome).toContain('is-edit-active');
        expect(shellChrome).toContain('function notifyFogProfileApiMissing');
        expect(shellChrome).toContain('function flashFogProfileAction');
        expect(shellChrome).toContain('function bindFogStudioControls');
        expect(shellChrome).toContain('fogControlsBound');
        expect(shellChrome).toContain('lux-bg-mode-params-dialog');
        expect(shellChrome).toContain('isFogProfileEditing()');
        expect(shellChrome).toContain('commitFogProfileEdit');
        expect(shellChrome).toContain('id="lux-fog-profile-edit-bar"');
        expect(shellChrome).toContain('id="lux-fog-profile-save-edit"');
        expect(shellChrome).toContain('id="lux-fog-profile-discard-edit"');
        expect(shellChrome).toContain('function renderFogProfileList');
        expect(shellChrome).toContain('function startFogProfileEdit');
        expect(shellChrome).toContain('function commitFogProfileEdit');
        expect(shellChrome).toContain('function cancelFogProfileEdit');
        expect(shellChrome).toContain('function bindFogProfileControls');
        expect(shellChrome).toContain('fogProfileEditState');
        expect(fog).toContain('window.getFogSettings');
        expect(fog).toContain('blurFactor: settings.blurFactor');
        expect(fog).not.toContain('readPortalMotion');
    });

    it('keeps saved fog profiles when visual settings reset', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');
        const resetBlock = luxury.slice(
            luxury.indexOf('function resetVisualSettings'),
            luxury.indexOf('function resetHomeToDefaults')
        );
        expect(resetBlock).not.toContain('fogProfiles');
        expect(resetBlock).toContain('kiuLuxuryStaticBackgroundFill');
    });

    it('exposes static background fill options when animation is off', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');
        const atmosphere = readSource('assets/js/features/luxury-atmosphere-runtime.js');
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');
        const foucCss = readSource('assets/css/lux-fouc-ht.css');

        expect(luxury).toContain('STATIC_BACKGROUND_FILL_OPTIONS');
        expect(luxury).toContain("staticBackgroundFill: 'colored'");
        expect(atmosphere).toContain('function getStaticBackgroundFill');
        expect(atmosphere).toContain('function setStaticBackgroundFill');
        expect(shellChrome).toContain('id="lux-static-bg-section"');
        expect(shellChrome).toContain('id="lux-static-bg-colored"');
        expect(shellChrome).toContain('id="lux-static-bg-dark"');
        expect(shellChrome).toContain('id="lux-static-bg-white"');
        expect(shellChrome).toContain('data-static-bg-fill');
        expect(shellChrome).toContain('setStaticBackgroundFill');
        expect(readSource('index.html')).toContain('luxury-shell-chrome.js?v=20260818-bootmarks1');
        expect(foucCss).toContain('data-lux-static-background="dark"');
        expect(foucCss).toContain('data-lux-static-background="white"');
        expect(foucCss).toContain('not(.lux-light-mode)[data-lux-background-animation="off"][data-lux-static-background="colored"]');
        expect(foucCss).toContain('var(--lux-shell-background)');
        expect(foucCss).toContain('calc(0.18 * var(--lux-glow-scale, 1))');
        expect(foucCss).not.toContain('--lux-glow-scale: 0');
        const tokensCss = readSource('assets/css/lux-tokens.css');
        expect(tokensCss).not.toContain('--lux-static-colored-page-haze');
        const transparency = readSource('assets/js/shared/lux-transparency.js');
        expect(transparency).toContain("var(--lux-shell-background)");
        const primer = readSource('assets/js/theme-primer.js');
        expect(primer).toContain("staticBackgroundFill === 'colored'");
        expect(primer).toContain("var(--lux-shell-background)");
    });

    it('opens per-mode settings in a dedicated parameters popup', () => {
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');
        expect(shellChrome).toContain('dataset.bgModeSettings');
        expect(shellChrome).toContain('openBgModeParamsPopup(mode.key)');
        expect(shellChrome).toContain('function closeBgModeParamsPopup');
        expect(shellChrome).toContain('mountBgModePanelInPopup');
        expect(shellChrome).toContain('id="lux-bg-params-body"');
        expect(shellChrome).toContain('id="lux-bg-settings-panel-particle"');
        expect(shellChrome).toContain('data-bg-mode-panel="peak layered orbit corners"');
        expect(shellChrome).toContain('id="lux-bg-panel-particle-copy"');
        expect(shellChrome).toContain('function syncStudioModePanels');
        expect(shellChrome).not.toContain('syncStudioBackgroundPanels');
        expect(shellChrome).not.toContain('lux-bg-mode-settings-host');
        expect(shellChrome).not.toContain('dataset.bgModeParams');
        expect(shellChrome).not.toContain('lux-fog-settings-section');
        expect(shellChrome).not.toContain('lux-particle-settings-wrap');
    });

    it('keeps global studio controls outside the parameters popup store', () => {
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');
        const popupStart = shellChrome.indexOf('function ensureBgModeParamsPopup');
        const storeStart = shellChrome.indexOf('id="lux-bg-mode-panels-store"', popupStart);
        const storeEnd = shellChrome.indexOf('function openBgModeParamsPopup', storeStart);
        const storeBlock = shellChrome.slice(storeStart, storeEnd);

        expect(storeBlock).not.toContain('id="lux-palette-grid"');
        expect(storeBlock).not.toContain('id="lux-transparency-slider"');
        expect(storeBlock).not.toContain('id="lux-reset-visuals"');
        expect(storeBlock).not.toContain('id="lux-apply-mix"');
        expect(shellChrome).toContain('id="lux-palette-grid"');
        expect(shellChrome).toContain('id="lux-transparency-slider"');
        expect(shellChrome).toContain('id="lux-glass-blur-quality-grid"');
        expect(shellChrome).toContain('id="lux-bg-animation-on"');
        expect(shellChrome).toContain('id="lux-reset-visuals"');
        expect(shellChrome).toContain('id="lux-apply-mix"');
    });

    it('exposes glass blur quality studio control with blur scaling', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');
        const atmosphere = readSource('assets/js/features/luxury-atmosphere-runtime.js');
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');
        const transparency = readSource('assets/js/shared/lux-transparency.js');
        const primer = readSource('assets/js/theme-primer.js');

        expect(luxury).toContain("glassBlurQuality: 'auto'");
        expect(luxury).toContain('GLASS_BLUR_QUALITY_OPTIONS');
        expect(atmosphere).toContain('function getGlassBlurQuality');
        expect(atmosphere).toContain('function setGlassBlurQuality');
        expect(atmosphere).toContain('kiuLuxuryGlassBlurQuality');
        expect(shellChrome).toContain('Glass Blur');
        expect(shellChrome).toContain('setGlassBlurQuality(mode.key, true)');
        expect(shellChrome).toContain('[data-glass-blur-quality]');
        expect(transparency).toContain('resolveGlassBlurQualityMultiplier');
        expect(transparency).toContain("target.style.setProperty('--lux-glass-blur'");
        expect(transparency).toContain('(2 + fillRatio * 22) * glassBlurMult');
        expect(transparency).toContain('--lux-glass-blur-quality-mult');
        expect(primer).toContain('kiuLuxuryGlassBlurQuality');
        expect(primer).toContain("document.body.dataset.luxGlassBlurQuality = glassBlurQuality");
        const tokens = readSource('assets/css/lux-tokens.css');
        expect(tokens).toContain('--home-fade-blur: blur(var(--lux-transparency-blur');
        expect(tokens).toContain('Glass blur owned by updateTransparency');
    });

    it('exposes panel color glow studio control scaled by --lux-glow-scale', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');
        const atmosphere = readSource('assets/js/features/luxury-atmosphere-runtime.js');
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');
        const tokens = readSource('assets/css/lux-tokens.css');
        const transparencyModel = readSource('assets/js/features/luxury-transparency-model-runtime.js');

        expect(luxury).toContain('glowStrength: 50');
        expect(atmosphere).toContain('function getGlowStrength');
        expect(atmosphere).toContain('function setGlowStrength');
        expect(atmosphere).toContain('kiuLuxuryGlowStrength');
        expect(atmosphere).toContain('normalizeGlowStrengthPercent');
        expect(shellChrome).toContain('Panel Color Glow');
        expect(shellChrome).toContain('id="lux-glow-strength-slider"');
        expect(shellChrome).toContain("window.setGlowStrength(parseInt(value, 10), false, { live: true })");
        expect(shellChrome).toContain("glowStrengthSlider.addEventListener('change'");
        expect(shellChrome).toContain('window.setGlowStrength(value, true)');
        expect(shellChrome).toContain('lux-glow-strength-value');
        expect(atmosphere).toContain('if (options?.live) {');
        expect(atmosphere).toContain('return nextPercent;');
        expect(transparencyModel).toContain('resolveGlowTokenConfig');
        expect(tokens).toContain('var(--lux-panel-glow, 0.22)');
        expect(tokens).toContain('calc(var(--lux-panel-glow, 0.22) * 0.90)');
        const transparency = readSource('assets/js/shared/lux-transparency.js');
        const primer = readSource('assets/js/theme-primer.js');
        expect(transparency).not.toContain('--lux-glow-scale:0!important');
        expect(transparency).toContain('var(--lux-panel-surface)');
        expect(transparency).toContain('glowConfig.glowScale');
        expect(primer).not.toContain('--lux-glow-scale:0!important');
        expect(tokens).not.toMatch(/lux-high-transparency[\s\S]*--lux-glow-scale:\s*0/);
    });

    it('ships fog profile script cache versions on luxury html entry points', () => {
        const htmlFiles = {
            'index.html': 'index-luxury.js?v=',
            'lms.html': 'index-luxury.js?v=',
            'profile-view.html': 'index-luxury.js?v=',
            'orders.html': 'index-luxury.js?v=',
            'students-admin.html': 'index-luxury.js?v=',
            'admin-tools.html': 'index-luxury.js?v='
        };
        Object.entries(htmlFiles).forEach(([file, luxuryTag]) => {
            const html = readSource(file);
            expect(html).toContain(luxuryTag);
            expect(html).toContain('luxury-shell-chrome.js?v=');
        });
    });

    it('drives fog profile drag ghost classes from shell chrome (no dedicated CSS sheet)', () => {
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');
        expect(shellChrome).toContain('lux-fog-profile-drag-ghost');
        expect(shellChrome).toContain('is-drag-source');
        expect(shellChrome).toContain('function buildFogProfileGhostMarkup');
        expect(shellChrome).toContain('function animateFogProfileGhostDrop');
        expect(existsSync(join(process.cwd(), 'assets/css/index-luxury.css'))).toBe(false);
    });

    it('stores fog profiles in separate dark and light banks', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');
        expect(luxury).toContain('themeMode: normalizeFogProfileBank(entry.themeMode)');
        expect(luxury).toContain('function buildDefaultLightFogProfiles');
        expect(luxury).toContain('function getAllFogProfiles');
        expect(luxury).toContain('profile.themeMode === activeBank ? queue.shift() : profile');
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');
        expect(shellChrome).toContain('activeFogProfileBank');
        expect(shellChrome).toContain('resolveActiveFogProfileBank()');
    });

    it('prefers live fog settings from localStorage when reading profile save state', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');
        const getFogBlock = luxury.slice(
            luxury.indexOf('function getFogSettings'),
            luxury.indexOf('function refreshActiveFogBackground')
        );
        expect(getFogBlock).toContain('readStoredFogSettings()');
        expect(getFogBlock).toContain('stored || visuals.fogSettings');
        expect(luxury).toContain('if (!Array.isArray(entry.fogProfiles)) entry.fogProfiles = []');
        expect(luxury).toContain('function mergeFogProfileStores');
        const storeBlock = luxury.slice(
            luxury.indexOf('function ensureFogProfileStore'),
            luxury.indexOf('function getFogProfiles')
        );
        expect(storeBlock).toContain('mergeFogProfileStores(entryProfiles, storedProfiles)');
        expect(storeBlock).not.toMatch(/if \(Array\.isArray\(entry\.fogProfiles\) && entry\.fogProfiles\.length > 0\)[\s\S]*syncFogProfilesStorage\(entry\.fogProfiles\)/);
    });

    it('commits profile edits from studio inputs', () => {
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');
        const commitBlock = shellChrome.slice(
            shellChrome.indexOf('function commitFogProfileEdit'),
            shellChrome.indexOf('function startFogProfileEdit')
        );
        expect(commitBlock).toContain('resolveFogSettingsForProfileSave()');
        expect(commitBlock).toContain('settings');
        expect(commitBlock).not.toContain('settings: window.getFogSettings()');
        const closeBlock = shellChrome.slice(
            shellChrome.indexOf('function closeBgModeParamsPopup'),
            shellChrome.indexOf('function syncStudioModePanels')
        );
        expect(closeBlock).toContain('Save profile changes before closing?');
    });

    it('delegates fog profile actions from the parameters dialog', () => {
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');
        const bindBlock = shellChrome.slice(
            shellChrome.indexOf('function bindFogProfileControls'),
            shellChrome.indexOf('function bindFogStudioControls')
        );
        expect(bindBlock).toContain('lux-bg-mode-params-dialog');
        expect(bindBlock).toContain('fogControlsBound');
        expect(bindBlock).not.toContain("getElementById('lux-fog-profiles-section')");
        const openBlock = shellChrome.slice(
            shellChrome.indexOf('function openBgModeParamsPopup'),
            shellChrome.indexOf('function closeBgModeParamsPopup')
        );
        expect(openBlock).toContain("if (modeKey === 'fog')");
        expect(openBlock).toContain('bindFogProfileControls()');
        expect(openBlock).toContain('bindFogProfileListDrag()');
    });

    it('preserves fog profile order when merging stores', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');
        const mergeBlock = luxury.slice(
            luxury.indexOf('function mergeFogProfileStores'),
            luxury.indexOf('function ensureFogProfileStore')
        );
        expect(mergeBlock).toContain('entryProfiles.map');
        expect(mergeBlock).not.toContain('Array.from(mergedById.values())');
    });

    it('uses adaptive particle quality and wires DPR/frame caps on home', () => {
        const particle = readSource('assets/js/features/luxury-particle-background.js');
        const runtime = readSource('assets/js/features/luxury-index-runtime.js');
        const luxury = readSource('assets/js/features/index-luxury.js');
        const resolveQualityBlock = particle.slice(
            particle.indexOf('function resolveQuality'),
            particle.indexOf('function detectQualityProfile')
        );
        expect(resolveQualityBlock).toContain('mapPerformanceTierToQuality');
        expect(resolveQualityBlock).toContain('getPerformanceTier() === "efficient"');
        expect(runtime).toContain('--lux-canvas-pixel-ratio-cap');
        expect(runtime).toContain('--lux-canvas-frame-interval');
        expect(runtime).toContain('pixelRatioCap: isTimetable ? 3 : (isHome ? 2.5 : 1.5)');
        expect(runtime).toContain('frameInterval: isHome ? 16 : (reducedMotion ? 80 : 42)');
        expect(luxury).toMatch(/particleQuality:\s*'auto'/);
        const dprBlock = particle.slice(
            particle.indexOf('function getRenderPixelRatio'),
            particle.indexOf('function setQuality')
        );
        expect(dprBlock).toContain('Math.min(dpr * supersample, quality.maxDpr, readCanvasPixelRatioCap())');
        expect(dprBlock).toContain('readCanvasPixelRatioCap()');
        expect(particle).toMatch(/high:\s*\{[\s\S]*?maxDpr:\s*3\.7/);
        expect(particle).toMatch(/balanced:\s*\{[\s\S]*?maxDpr:\s*1\.5/);
        expect(particle).not.toMatch(/balanced:\s*\{[\s\S]*?supersample:\s*1\.15/);
        expect(particle).toContain('readCanvasFrameInterval()');
        expect(particle).toContain('startParticleRenderLoop');
        expect(particle).not.toMatch(/setAnimationLoop\(render\)/);
        expect(particle).toMatch(/engineReady = true;[\s\S]*syncSettingsFromPortal\(\)/);
        expect(particle).toContain('antialias: !(initialQuality.supersample > 1)');
        expect(particle).toContain('syncRibbonMeshInScene');
        expect(particle).toContain('scene.remove(ribbonMesh)');
    });

    it('keeps canvas filter none when background animation is on', () => {
        const css = readHomeDashboardCss() + '\n' + readSource('assets/css/lux-fouc-ht.css');
        const canvasDefault = css.slice(
            css.indexOf('#lux-bg-canvas {\n    opacity: var(--lux-canvas-opacity);'),
            css.indexOf('#lux-bg-overlay {')
        );
        expect(canvasDefault).not.toContain('blur(0.1px)');
        expect(css).toMatch(
            /body\[data-lux-background-animation="on"\] #lux-bg-canvas[\s\S]*?filter:\s*none/
        );
        expect(css).toMatch(
            /body\[data-lux-background-animation="on"\] #lux-bg-overlay[\s\S]*?opacity:\s*0/
        );
    });

    it('cache-busts particle and luxury background assets', () => {
        const html = readSource('index.html');
        const luxury = readSource('assets/js/features/index-luxury.js');
        const background = readSource('assets/js/features/luxury-background.js');
        expect(html).not.toContain('luxury-background.js');
        expect(html).toContain('index-luxury.js?v=');
        expect(html).toContain('luxury-index-runtime.js?v=');
        expect(html).not.toContain('index-luxury.css');
        expect(luxury).toContain("import('./luxury-background.js?v=20260817-timetablebg1')");
        expect(background).toContain('import("./luxury-particle-background.js?v=20260818-visualqueue1")');
        expect(background).toContain('import("./luxury-vanta-fog-background.js?v=20260723-adaptive1")');
    });
    it('supports gallery static background fill and media mount', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');
        const atmosphere = readSource('assets/js/features/luxury-atmosphere-runtime.js');
        const runtime = readSource('assets/js/features/luxury-background-gallery-runtime.js');
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');
        const foucCss = readSource('assets/css/lux-fouc-ht.css');

        expect(luxury).toContain("key: 'gallery'");
        expect(atmosphere).toContain('getBackgroundGallerySelection');
        expect(atmosphere).toContain('clearBackgroundGallery');
        expect(runtime).toContain('lux-bg-media');
        expect(shellChrome).toContain('lux-bg-gallery-open-images');
        expect(shellChrome).toContain('lux-bg-gallery-open-videos');
        expect(foucCss).toContain('data-lux-static-background="gallery"');
        expect(foucCss).toContain('100dvh');
    });

});
