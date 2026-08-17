import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { readHomeDashboardCss } from './helpers/bare-shell-css.js';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

function readRegisteredHomeChunk() {
  const plainPath = 'assets/js/features/index-home-dashboard.plain.js';
  if (existsSync(join(process.cwd(), plainPath))) {
    return readSource(plainPath);
  }
  const registrationSource = readSource('assets/js/features/index-home-dashboard.js');
  const match = registrationSource.match(/__kiuRegisterLuxuryHomeChunk\('([^']+)'\)/);
  if (!match) return '';
  return Buffer.from(match[1], 'base64').toString('utf8');
}

function readRegisteredAdminToolsChunk() {
  const plainPath = 'assets/js/features/index-admin-tools.plain.js';
  if (existsSync(join(process.cwd(), plainPath))) {
    return readSource(plainPath);
  }
  const registrationSource = readSource('assets/js/features/index-admin-tools.js');
  const match = registrationSource.match(/__kiuRegisterLuxuryAdminToolsChunk\('([^']+)'\)/);
  if (!match) return '';
  return Buffer.from(match[1], 'base64').toString('utf8');
}

describe('global interaction performance guardrails', () => {
  it('does not full-scan every DOM mutation for glass transparency refreshes', () => {
    const utilities = readSource('assets/js/shared/lux-transparency.js');

    expect(utilities).toContain('const SHARED_TRANSPARENCY_OBSERVER_SELECTORS = [');
    expect(utilities).toContain('node.querySelector?.');
    expect(utilities).toContain("typeof window.requestIdleCallback === 'function'");
    expect(utilities).not.toContain('var _debounceMs = transparency > 60 ? 16 : 300;');
    expect(utilities).toContain('function setupTransparencyObserver()');
    expect(utilities).toContain('window.__transparencyObserver');
    expect(utilities).toContain('isLuxTransparencyExemptSubtree');
    expect(utilities).toContain('node.matches?.(SHARED_TRANSPARENCY_OBSERVER_SELECTORS.join');
  });

  it('keeps palette boot safe when transparency loads after shared utilities', () => {
    const utilities = readSource('assets/js/shared/utilities.js');
    const socialHtml = readSource('social.html');
    const transparencyIndex = socialHtml.indexOf('assets/js/shared/lux-transparency.js');
    const utilitiesIndex = socialHtml.indexOf('assets/js/shared/utilities.js');

    expect(utilities).toContain('typeof window.refreshLuxuryTransparencySurfaces === \'function\'');
    expect(utilities).toContain('typeof window.scheduleLuxuryTransparencyBootRefresh === \'function\'');
    expect(transparencyIndex).toBeGreaterThan(-1);
    expect(utilitiesIndex).toBeGreaterThan(-1);
    expect(transparencyIndex).toBeLessThan(utilitiesIndex);
  });

  it('avoids duplicate syncAll boot on standalone LMS routes', () => {
    const utilities = readSource('assets/js/shared/utilities.js');
    const transparency = readSource('assets/js/shared/lux-transparency.js');
    const luxury = readSource('assets/js/features/index-luxury.js');

    expect(transparency).toContain("document.body.classList.contains('lux-route-lms')");
    expect(utilities).toContain('window.refreshStandaloneLmsShellContext({ refreshSubjectDeck: false })');
    expect(luxury).toContain('if (isStandaloneLmsRouteActive() && typeof window.refreshStandaloneLmsShellContext === \'function\')');
    expect(luxury).toContain('function isStandaloneLmsRouteActive()');
  });

  it('avoids duplicate syncAll boot on standalone library routes while preserving deferred particles', () => {
    const luxury = readSource('assets/js/features/index-luxury.js');
    const luxuryBackground = readSource('assets/js/features/luxury-background.js');
    const navigation = readSource('assets/js/features/navigation.js');
    const transparency = readSource('assets/js/shared/lux-transparency.js');
    const routeRuntime = readSource('assets/js/shared/lux-transparency.js');

    expect(luxury).toContain('function isStandaloneLibraryRouteActive()');
    expect(luxury).toContain('isStandaloneLibraryRouteActive()');
    expect(luxury).toContain('refreshStandaloneDesktopRouteShellContext({ rerender: false })');
    expect(luxury).toContain('onStandaloneLibrary');
    expect(luxury).toContain('scheduleParticleInit');
    expect(luxury).toContain('scheduleLibraryRouteBackgroundRefresh');
    expect(luxuryBackground).toContain('lux-route-library');
    expect(luxuryBackground).toContain('requestIdleCallback');
    expect(navigation).toMatch(/entryId === 'orders' \|\| entryId === 'library'/);
    expect(transparency).toContain("document.body.classList.contains('lux-route-library')");
    expect(transparency).toContain('library-catalog-card');
    expect(routeRuntime).toContain("document.body.classList.contains('lux-route-library')");
    expect(routeRuntime).toContain('library-catalog-card');
    expect(navigation).toContain('lux-route-library');
  });

  it('skips repeated transparency work when surfaces already have the current signature', () => {
    const transparency = readSource('assets/js/shared/lux-transparency.js');

    expect(transparency).toContain('const transparencySignature = [');
    expect(transparency).toContain('el.dataset.luxTransparencySignature === transparencySignature');
    expect(transparency).toContain('LUX_TRANSPARENCY_SURFACE_CACHE.signature === signature');
    expect(transparency).toContain('el.dataset.luxTransparencySignature = transparencySignature;');
  });

  it('scopes transparency surface refreshes to active shell roots instead of querying the whole document', () => {
    const transparency = readSource('assets/js/shared/lux-transparency.js');

        expect(transparency).toContain('const INDEX_TRANSPARENCY_GLOBAL_ROOT_SELECTORS = [');
        expect(transparency).toContain('function collectTransparencySurfaceElements(selectorList, rootsOverride)');
        expect(transparency).toContain("const activePage = document.querySelector('.page-section.active-page');");
        expect(transparency).toContain('const surfaceElements = getCachedTransparencySurfaceElements(allSelectors, scopedRoots);');
        expect(transparency).not.toContain("const surfaceElements = document.querySelectorAll(allSelectors.join(', '));");
    });

  it('keeps saveState from scanning every node on the page', () => {
    const state = readSource('assets/js/app/state.js');

    expect(state).toContain("Full-tree scroll scans were a major click-latency source");
    expect(state).toContain('return [];');
    expect(state).not.toContain("const nodes = Array.from(root.querySelectorAll('*')).filter(isScrollableSnapshotTarget);");
  });

  it('filters assembly mutations and uses the weak-device polling interval consistently', () => {
    const runtime = readSource('assets/js/shared/lux-assembly-loading-runtime.js');

    expect(runtime).toContain('const assemblyMutationSelector = [');
    expect(runtime).toContain('function hasRelevantAssemblyMutation(records, observerRoot)');
    expect(runtime).toContain('new MutationObserver((records) => {');
    expect(runtime).toContain('hasRelevantAssemblyMutation(records, observerRoot)');
    expect(runtime).toContain('window.setTimeout(poll, assemblyPollMs)');
    expect(runtime).not.toContain('window.setTimeout(poll, 32)');
  });

  it('coalesces local portal persistence and keeps navigation flush durable', () => {
    const state = readSource('assets/js/app/state.js');
    const api = readSource('assets/js/app/api.js');

    expect(state).toContain('function scheduleKiuLocalPersistence(snapshot)');
    expect(state).toContain('function flushKiuStatePersistence()');
    expect(state).toContain('requestIdleCallback');
    expect(state).toContain('kiuPendingLocalPersistence = {');
    expect(api).toMatch(/saveState\(\);[\s\S]*?flushKiuStatePersistence\(\);/);
  });

  it('does not run expensive shell syncs while role/faculty switches are redirecting', () => {
    const utilities = readSource('assets/js/shared/utilities.js');
    const luxury = readSource('assets/js/features/index-luxury.js');

    expect(utilities).toContain('window.__kiuRoleSwitchRedirectPending = true;');
    expect(utilities).toContain('window.__kiuFacultySwitchRedirectPending = true;');
    expect(utilities).toContain('function fastRedirectRoleSwitch(requestedRole)');
    expect(utilities).toContain("if (typeof fastRedirectRoleSwitch === 'function' && await fastRedirectRoleSwitch(requestedRole))");
    expect(luxury).toContain('if (window.__kiuRoleSwitchRedirectPending || window.__kiuFacultySwitchRedirectPending) return;');
    expect(readSource('assets/js/features/luxury-index-runtime.js')).toContain('frameInterval: isHome ? 16 : (reducedMotion ? 80 : 42)');
  });

  it('keeps the sidebar above the top bar during deferred desktop loading', () => {
    const shell = readSource('assets/css/lux-shell.css');
    const luxury = readSource('assets/js/features/index-luxury.js');

    expect(shell).toContain('z-index: 2147483647 !important;');
    expect(shell).toContain('background-color: rgb(8, 12, 21) !important;');
    expect(shell).toContain('html.kiu-shell-loading #lux-topbar { z-index: 1000 !important; }');
    expect(luxury).toContain("if (isLoading) shell?.style.removeProperty('z-index');");
    expect(luxury).toContain("topbar?.style.setProperty('z-index', '1000', 'important')");
  });

  it('records lightweight startup marks across primer, shell, and route phases', () => {
    const primer = readSource('assets/js/theme-primer.js');
    const navigation = readSource('assets/js/features/navigation.js');
    const chrome = readSource('assets/js/features/luxury-shell-chrome.js');
    const luxury = readSource('assets/js/features/index-luxury.js');

    expect(primer).toContain('window.__kiuMarkPortalBootPhase =');
    expect(primer).toContain("markBootPhase('primer-start')");
    expect(primer).toContain("markBootPhase('body-state-applied')");
    expect(navigation).toContain("'runtime-wait-start'");
    expect(navigation).toContain("'shell-ready'");
    expect(chrome).toContain("'shell-chrome-ready'");
    expect(luxury).toContain("'index-luxury-start'");
  });

  it('preloads split route runtimes without changing dependency execution order', () => {
    const app = readSource('assets/js/app/app.js');

    expect(app).toContain('function preloadRuntimeScript(entry)');
    expect(app).toContain('function preloadRuntimeEntries(entries = [])');
    expect(app).toContain("link.rel = asModule ? 'modulepreload' : 'preload'");
    expect(app).toContain('scriptGroups.forEach(preloadRuntimeEntries);');
    expect(app).toContain('preloadRuntimeEntries(NEWS_RUNTIME_SCRIPTS);');
    expect(app).toContain('preloadRuntimeEntries(REGISTRATION_STUDENT_ROUTE_RUNTIME_SCRIPTS);');
  });

  it('uses lightweight navigate sync instead of full syncAll after navigation', () => {
    const luxury = readSource('assets/js/features/index-luxury.js');
    const syncRuntime = readSource('assets/js/features/luxury-index-sync-runtime.js');

    expect(luxury).toContain('function syncAfterNavigate(pageId) {');
    expect(luxury).toContain('function queueNavigateSync(args, result) {');
    expect(luxury).toContain('syncAfterNavigate(targetPageId);');
    expect(luxury).toContain('__luxPendingNavigateSyncPageId = pageId');
    expect(luxury).toContain("wrapFunction('navigate', queueNavigateSync);");
    expect(luxury).toContain("wrapFunction('switchRole', queueShellSync);");
    expect(luxury).toMatch(/function queueNavigateSync[\s\S]*?syncAfterNavigate\(targetPageId\)/);
    expect(luxury).toContain('function isStandaloneLmsRouteActive() {');
    expect(syncRuntime).toContain("window.refreshStandaloneDesktopRouteShellContext({ rerender: true, refreshActiveRoute: true });");
    expect(syncRuntime).toContain("window.refreshStandaloneDesktopShellChrome()");
    expect(syncRuntime).toMatch(/function queueShellSync[\s\S]*?(refreshStandaloneDesktopRouteShellContext|refreshStandaloneDesktopShellChrome|syncAll\(\))/);
  });

  it('reveals standalone route shells after deferred route renders finish', () => {
    const navigation = readSource('assets/js/features/navigation.js');

    expect(navigation).toContain('function tryMarkPortalShellInteractive() {');
    expect(navigation).toContain('function schedulePortalShellReadyReveal() {');
    expect(navigation).toContain('schedulePortalShellReadyReveal,');
    expect(navigation).toContain('function scheduleRouteContentRender(renderFn) {');
    expect(navigation).toContain('scheduleRouteContentRender,');
    expect(navigation).toContain('window.requestAnimationFrame(() => {\n            window.requestAnimationFrame(run);');
    expect(navigation).not.toContain('const fallbackTimer = window.setTimeout(run, 48);');
    expect(navigation).not.toContain("body.classList.remove('kiu-shell-loading', 'lux-home-page');");
    expect(navigation).toMatch(/finally \{[\s\S]*?schedulePortalShellReadyReveal\(\);[\s\S]*?\}/);
    expect(navigation).toContain('function waitForPortalStartupDependencies()');
    expect(navigation).toContain("kiu:portal-runtime-ready");
    expect(navigation).not.toContain('portalStartupPollDelayMs');
  });

  it('disposes particle WebGL when background animation is off', () => {
    const luxury = readSource('assets/js/features/index-luxury.js');
    const particle = readSource('assets/js/features/luxury-particle-background.js');
    const orchestrator = readSource('assets/js/features/luxury-background.js');

    expect(luxury).toContain('window.__kiuInitLuxuryParticleBackground');
    expect(particle).toContain('staticBackgroundOnly = !animationsEnabled');
    expect(particle).not.toContain("staticBackgroundOnly = getPerformanceTier() === 'efficient'");
    expect(particle).toContain('targetMotion = animationsEnabled ? readPortalMotion() / 100 : 0');
    expect(particle).toContain('function disposeLuxuryParticleBackground()');
    expect(particle).toContain('if (!arePortalBackgroundAnimationsEnabled())');
    expect(particle).toContain('disposeLuxuryParticleBackground();');
    expect(particle).not.toContain('if (staticBackgroundOnly && renderer)');
    expect(orchestrator).toContain('if (!areBackgroundAnimationsEnabled())');
    expect(orchestrator).toContain('await disposeBackgroundEngines()');
  });

  it('does not promote unknown-memory laptops into the high background tier by default', () => {
    const luxury = readSource('assets/js/features/luxury-index-runtime.js');

    expect(luxury).toContain('if (memory >= 8 && cores >= 8 && !coarsePointer && viewportWidth >= 1280) {');
    expect(luxury).not.toContain('(memory >= 8 || !memory) && (cores >= 8 || !cores)');
  });

  it('keeps startup-critical dashboard preference and palette helpers available before the home chunk loads', () => {
    const luxury = readSource('assets/js/features/index-luxury.js');
    const palette = readSource('assets/js/features/luxury-palette-runtime.js');
    const atmosphere = readSource('assets/js/features/luxury-transparency-model-runtime.js');
    const homeLuxury = readRegisteredHomeChunk();
    const count = (source, pattern) => (source.match(pattern) || []).length;

    expect(count(luxury, /function createDashboardPreferenceEntry\(/g)).toBe(1);
    expect(count(luxury, /function getDashboardPreferenceEntry\(/g)).toBe(1);
    expect(count(luxury, /function updateDashboardPreferenceEntry\(/g)).toBe(1);
    expect(count(luxury, /function getDashboardVisuals\(/g)).toBe(1);
    expect(count(luxury, /function setDashboardVisuals\(/g)).toBe(1);
    expect(count(atmosphere, /function applyAtmosphereSettings\(/g)).toBe(1);
    expect(count(palette, /function resolvePaletteKey\(/g)).toBe(1);
    expect(count(palette, /function resolveCustomPalette\(/g)).toBe(1);
    expect(count(palette, /function applyPaletteValues\(/g)).toBe(1);
    expect(count(palette, /function applyPaletteKey\(/g)).toBe(1);
    expect(count(palette, /function applyCustomPalette\(/g)).toBe(1);
    expect(count(palette, /function applyResolvedPalette\(/g)).toBe(1);
    expect(count(homeLuxury, /function createDashboardPreferenceEntry\(/g)).toBe(1);
    expect(count(homeLuxury, /function getDashboardPreferenceEntry\(/g)).toBe(1);
    expect(count(homeLuxury, /function updateDashboardPreferenceEntry\(/g)).toBe(1);
    expect(count(homeLuxury, /function getDashboardVisuals\(/g)).toBe(1);
    expect(count(homeLuxury, /function setDashboardVisuals\(/g)).toBe(1);
    expect(count(homeLuxury, /function applyAtmosphereSettings\(/g)).toBe(1);
    expect(count(homeLuxury, /function resolvePaletteKey\(/g)).toBe(1);
    expect(count(homeLuxury, /function resolveCustomPalette\(/g)).toBe(1);
    expect(count(homeLuxury, /function applyPaletteValues\(/g)).toBe(1);
    expect(count(homeLuxury, /function applyPaletteKey\(/g)).toBe(1);
    expect(count(homeLuxury, /function applyCustomPalette\(/g)).toBe(1);
    expect(count(homeLuxury, /function applyResolvedPalette\(/g)).toBe(1);
    expect(count(homeLuxury, /function cyclePalette\(/g)).toBe(0);
  });

  it('keeps only the live home shell renderer in index-luxury', () => {
    const luxury = readSource('assets/js/features/index-luxury.js');
    const homeShellRuntime = readSource('assets/js/features/luxury-index-home-shell-runtime.js');
    const homeRuntime = readSource('assets/js/features/luxury-index-runtime.js');
    const homeLuxury = readRegisteredHomeChunk();
    const count = (source, pattern) => (source.match(pattern) || []).length;

    expect(count(homeShellRuntime, /function renderHomeShell\(/g)).toBe(1);
    expect(count(homeRuntime, /function scheduleRenderHomeShell\(/g)).toBe(1);
    expect(count(homeRuntime, /function renderHomeShellNow\(/g)).toBe(1);
    expect(count(luxury, /renderDynamicHomeShell\s*=\s*function\s*\(/g)).toBe(0);
    expect(count(homeLuxury, /renderDynamicHomeShell\s*=\s*function\s*\(/g)).toBe(1);
    expect(luxury).toContain('ensureLuxuryHomeDashboardBundle');
    expect(luxury).not.toContain('renderDynamicHomeShell(homeShell);\r\n        return;');
    expect(homeLuxury).not.toContain('function renderDynamicHomeShell(homeShell) {');
  });

  it('keeps soft-chrome quick tiles free of per-role glass surface restates', () => {
    expect(existsSync(join(process.cwd(), 'assets/css/index-luxury.css'))).toBe(false);
    const homeCss = readHomeDashboardCss();
    const count = (source, text) => (source.match(new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;

    for (const role of ['student', 'professor', 'ta', 'admin', 'student_service']) {
      expect(count(homeCss, `.lux-home-grid.is-${role} .lux-quick-btn`)).toBe(0);
    }
    expect(homeCss).toMatch(/\.lux-quick-btn\.lux-soft-chrome/);
  });

  it('ships the static merged home dashboard CSS on the home entry', () => {
    const indexHtml = readSource('index.html');
    expect(existsSync(join(process.cwd(), 'assets/css/index-luxury.css'))).toBe(false);
    const homeCss = readHomeDashboardCss();

    expect(indexHtml).toContain('assets/css/index-home-layout.css');
    expect(indexHtml).toContain('assets/css/index-home-widgets.css');
    expect(indexHtml).toContain('assets/css/index-home-role.css');
    expect(homeCss).toContain('.lux-home-merged');
    expect(homeCss).toContain('.lux-home-band--split');
    expect(indexHtml).not.toContain('index-home-editor.css');
    expect(existsSync(join(process.cwd(), 'assets/css/index-home-editor.css'))).toBe(false);
  });

  it('re-applies transparency when shared modals become visible', () => {
    const utilities = readSource('assets/js/shared/utilities.js');
    const ui = readSource('assets/js/features/ui.js');

    expect(utilities).toContain('scheduleRefresh(() => queueLuxuryTransparencyRefresh(window.__currentTransparency || 0));');
    expect(ui).toContain('scheduleRefresh(() => window.queueLuxuryTransparencyRefresh(window.__currentTransparency || 0));');
  });

  it('keeps the mobile shell bootstrap out of the desktop index parser path', () => {
    const indexHtml = readSource('index.html');
    const mobileShell = readSource('assets/js/pages/index-mobile-shell.js');

    expect(indexHtml).toContain('assets/js/pages/index-mobile-shell.js?v=20260809-homeassembly1');
    expect(indexHtml).not.toContain('(function initMobileExperience(){');
    expect(mobileShell).toContain("(function initMobileExperience() {");
  });

  it('does not eagerly load news or registration page runtimes on the index home entry', () => {
    const indexHtml = readSource('index.html');
    const app = readSource('assets/js/app/app.js');

    expect(indexHtml).not.toContain('assets/js/pages/student-registration.js?v=20260527-studentreg2');
    expect(indexHtml).not.toContain('assets/js/pages/news.js');
    expect(app).toContain('REGISTRATION_PICKER_ASSET_TOKEN');
    expect(app).toContain("registrationRuntimeAsset('assets/js/pages/student-registration.js')");
    expect(app).not.toContain("'assets/js/pages/student-registration.js?v=20260527-studentreg2'");
    expect(app).toContain('window.ensurePortalRegistrationRuntimeLoaded = function ensurePortalRegistrationRuntimeLoaded()');
    expect(app).toContain('const NEWS_RUNTIME_SCRIPTS = [');
    expect(app).toMatch(/assets\/js\/pages\/news\.js\?v=\$\{NEWS_RUNTIME_VERSION\}/);
    expect(app).toContain('window.ensurePortalNewsRuntimeLoaded = function ensurePortalNewsRuntimeLoaded()');
  });

  it('does not ship hidden scheduler admin builder markup on the index home entry', () => {
    const indexHtml = readSource('index.html');
    const ui = readSource('assets/js/features/ui.js');

    expect(indexHtml).not.toContain('id="schedulerModal"');
    expect(indexHtml).not.toContain('id="db-professors"');
    expect(indexHtml).not.toContain('id="db-rooms"');
    expect(indexHtml).not.toContain('id="db-groups"');
    expect(indexHtml).not.toContain('id="admin-generate-submit-btn"');
    expect(indexHtml).not.toContain('id="modal-programs"');
    expect(ui).toContain('function ensureProgramsModal()');
  });

  it('applies theme and palette colors without remounting the WebGL background', () => {
    const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');
    const atmosphere = readSource('assets/js/features/luxury-atmosphere-runtime.js');
    const syncRuntime = readSource('assets/js/features/luxury-index-sync-runtime.js');

    const darkClick = shellChrome.slice(
      shellChrome.indexOf("getElementById('lux-mode-dark')"),
      shellChrome.indexOf("getElementById('lux-mode-light')")
    );
    expect(darkClick).toContain('applyThemeMode');
    expect(darkClick).toContain('syncStudioUi');
    expect(darkClick).not.toContain('syncVisualStateOnly');

    const lightClick = shellChrome.slice(
      shellChrome.indexOf("getElementById('lux-mode-light')"),
      shellChrome.indexOf("getElementById('lux-bg-animation-on')")
    );
    expect(lightClick).toContain('applyThemeMode');
    expect(lightClick).toContain('syncStudioUi');
    expect(lightClick).not.toContain('syncVisualStateOnly');

    const paletteClick = shellChrome.slice(
      shellChrome.indexOf('STUDIO_PALETTES.forEach'),
      shellChrome.indexOf('BACKGROUND_MODES.forEach')
    );
    expect(paletteClick).toContain('applyPaletteKey');
    expect(paletteClick).toContain('syncStudioUi');
    expect(paletteClick).not.toContain('syncVisualStateOnly');

    const applyMix = shellChrome.slice(
      shellChrome.indexOf("getElementById('lux-apply-mix')"),
      shellChrome.indexOf('STUDIO_PALETTES.forEach')
    );
    expect(applyMix).toContain('applyCustomPalette');
    expect(applyMix).toContain('syncStudioUi');
    expect(applyMix).not.toContain('syncVisualStateOnly');

    const themeBlock = atmosphere.slice(
      atmosphere.indexOf('function applyThemeMode'),
      atmosphere.indexOf('function sanitizeBackgroundMode')
    );
    expect(themeBlock).not.toContain('__kiuRefreshLuxuryBackground');
    expect(themeBlock).not.toContain('updateTransparency');
    expect(themeBlock).toContain('__kiuApplyLmsParticleTheme');

    const syncVisualBlock = syncRuntime.slice(
      syncRuntime.indexOf('function syncVisualStateOnly'),
      syncRuntime.indexOf('const api = {')
    );
    expect(syncVisualBlock).not.toContain('__kiuRefreshLuxuryBackground');
    expect(syncVisualBlock).toContain('__kiuApplyLmsParticleTheme');
  });

  it('refreshes the canvas background when luxury theme controls change', () => {
    const luxury = readSource('assets/js/features/index-luxury.js');

    expect(luxury).toContain("if (typeof window.__kiuRefreshLuxuryBackground === 'function') {");
    expect(luxury).toContain('window.__kiuRefreshLuxuryBackground();');
  });

  it('does not ship the dead fallback theme studio block on the index home entry', () => {
    const indexHtml = readSource('index.html');
    const utilities = readSource('assets/js/shared/utilities.js');

    expect(indexHtml).not.toContain('id="modal-studio"');
    expect(indexHtml).not.toContain('class="studio-modal"');
    expect(indexHtml).not.toContain('id="hue-slider"');
    expect(indexHtml).not.toContain('id="sat-slider"');
    expect(indexHtml).not.toContain('id="light-slider"');
    expect(utilities).toContain("if (typeof window.openStudio === 'function' && window.openStudio !== openStudio)");
  });

  it('lazy-creates the luxury studio instead of booting it during shell startup', () => {
    const luxury = readSource('assets/js/features/index-luxury.js');
    const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');

    expect(shellChrome).toContain("const existingStudio = document.getElementById('lux-studio-backdrop');");
    expect(shellChrome).toContain('const backdrop = ensureStudio();');
    expect(luxury).not.toMatch(/ensureHomeShell\(\);\s*ensureStudio\(\);\s*bindUserMenu\(\);/);
  });

  it('keeps professor-home studio copy free of visible mojibake markers', () => {
    const luxury = readSource('assets/js/features/index-luxury.js');
    const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');

    expect(shellChrome).toContain('Color & Motion Studio');
    expect(shellChrome).toContain('Color A');
    expect(shellChrome).toContain('Color B');
    expect(shellChrome).not.toContain('Colour & Motion Studio');
    expect(shellChrome).not.toContain('Colour A');
    expect(shellChrome).not.toContain('Colour B');
    expect(luxury).toContain('function showToast(message) {');
  });

  it('defers home-shell observer setup until the initial shell sync runs', () => {
    const luxury = readSource('assets/js/features/index-luxury.js');

    expect(luxury).toContain('const scheduleInitialShellSync = window.requestIdleCallback || ((cb) => window.setTimeout(cb, 0));');
    expect(luxury).toContain("enhanceUniversalPickers(document.querySelector('.page-section.active-page') || document);");
    expect(luxury).toContain('observeUniversalPickers();');
    expect(luxury).toContain('observeLegacyVisualTree();');
    expect(luxury).toContain("queueLegacyVisualRefresh(document.querySelector('.page-section.active-page') || document.body);");
    expect(luxury).not.toMatch(/applyLuxuryPerformanceProfile\(\);\s*enhanceUniversalPickers\(\);\s*observeUniversalPickers\(\);\s*observeLegacyVisualTree\(\);\s*queueLegacyVisualRefresh\(document.body\);/);
  });

  it('skips rebuilding nav and picker panels when the shell state is unchanged', () => {
    const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');
    const topbarRuntime = readSource('assets/js/features/luxury-shell-topbar-runtime.js');

    expect(shellChrome).toContain("const itemSignature = groups");
    expect(shellChrome).toContain("const signature = `${role}|${activePage}|${itemSignature}`;");
    expect(shellChrome).toContain("if (navRoot.dataset.renderSignature === signature && navRoot.children.length) return;");
    expect(shellChrome).toContain("navRoot.dataset.renderSignature = signature;");
    expect(shellChrome).toContain("if (navRoot.dataset.bound !== '1') {");
    expect(topbarRuntime).toContain("const optionSignature = optionsList.map((opt) => `${opt.value}:${opt.label}`).join('|');");
    expect(topbarRuntime).toContain("if (panel.dataset.renderSignature !== signature) {");
    expect(topbarRuntime).toContain("if (panel.dataset.bound !== '1') {");
  });

  it('caches widget context and system definitions per home model object', () => {
    const luxury = readRegisteredHomeChunk();
    const widgetLayout = readSource('assets/js/features/home-dashboard-widget-layout-runtime.js');

    expect(luxury).toContain('const HOME_WIDGET_CONTEXT_CACHE = new WeakMap();');
    expect(luxury).toContain('const HOME_WIDGET_DEFINITIONS_CACHE = new WeakMap();');
    expect(widgetLayout).toContain('function buildHomeWidgetContextUncached(role, model) {');
    expect(widgetLayout).toContain('function buildHomeWidgetContext(role, model) {');
    expect(widgetLayout).toContain('const cached = HOME_WIDGET_CONTEXT_CACHE.get(model);');
    expect(widgetLayout).toContain('HOME_WIDGET_CONTEXT_CACHE.set(model, { role, value: context });');
    expect(widgetLayout).toContain('function buildSystemWidgetDefinitionsUncached(role, model) {');
    expect(widgetLayout).toContain('function buildSystemWidgetDefinitions(role, model) {');
    expect(widgetLayout).toContain('const cached = HOME_WIDGET_DEFINITIONS_CACHE.get(model);');
    expect(widgetLayout).toContain('HOME_WIDGET_DEFINITIONS_CACHE.set(model, { role, value: definitions });');
  });

  it('sanitizes widget definition text and shared role labels before professor-home surfaces render', () => {
    const widgetLayout = readSource('assets/js/features/home-dashboard-widget-layout-runtime.js');
    const utilities = readSource('assets/js/shared/utilities.js');

    expect(widgetLayout).toContain('function sanitizeWidgetDefinitionText(definition) {');
    expect(widgetLayout).toContain("buildSystemWidgetDefinitionsUncached(role, model).map((definition) => sanitizeWidgetDefinitionText(definition))");
    expect(utilities).toContain("userRoleEl.textContent = `${roleLabels[currentUser.role] || 'University Portal'} - ${facultyLabel}`;");
  });

  it('keeps the professor-home entry shell role-neutral and lets the primer resolve the requested role before reveal', () => {
    const indexHtml = readSource('index.html');
    const primer = readSource('assets/js/theme-primer.js');
    const localization = readSource('assets/js/app/english-localization.js');

    expect(indexHtml).toContain('<title>KIU - Portal</title>');
    expect(indexHtml).not.toContain('<title>KIU - Student Portal</title>');
    expect(indexHtml).not.toContain('<body class="role-student');
    expect(primer).toContain('function getRequestedShellRole() {');
    expect(primer).toContain("b.classList.remove('role-student', 'role-professor', 'role-ta', 'role-admin', 'role-student_service');");
    expect(primer).toContain("b.classList.add('role-' + requestedRole);");
    expect(primer).toContain('document.title = getShellHomeTitle(requestedRole);');
    expect(localization).toContain("const shellTitle = shellRole === USER_ROLES.PROFESSOR");
    expect(localization).not.toContain("if (document?.title !== 'KIU - Student Portal') document.title = 'KIU - Student Portal';");
  });

  it('keeps mobile-only shell scaffolding out of the desktop entry html and recreates it in the mobile runtime', () => {
    const indexHtml = readSource('index.html');
    const mobileShell = readSource('assets/js/pages/index-mobile-shell.js');

    expect(indexHtml).not.toContain('id="mobile-bottom-nav"');
    expect(indexHtml).not.toContain('id="mobile-action-sheet"');
    expect(indexHtml).not.toContain('id="mob-sheet-backdrop"');
    expect(indexHtml).not.toContain('id="mob-sheet-dynamic-nav"');
    expect(mobileShell).toContain('function ensureMobileShellScaffold() {');
    expect(mobileShell).toContain("nav.id = 'mobile-bottom-nav';");
    expect(mobileShell).toContain("sheet.id = 'mobile-action-sheet';");
    expect(mobileShell).toContain('ensureMobileShellScaffold();');
  });

  it('routes mobile theme actions to the palette studio before dashboard customization controls', () => {
    const mobileShell = readSource('assets/js/pages/index-mobile-shell.js');

    expect(mobileShell).toContain("var paletteButton = document.getElementById('lux-palette-btn');");
    expect(mobileShell).toContain('paletteButton.click();');
    expect(mobileShell).toContain("var topbarButton = document.querySelector('.lux-topbar-editor-btn');");
  });

  it('lazy-creates hidden topbar utility panels instead of shipping empty panel containers in the shell chrome', () => {
    const luxury = readSource('assets/js/features/index-luxury.js');
    const pickerRuntime = readSource('assets/js/features/luxury-shell-picker-runtime.js');

    expect(pickerRuntime).toContain('function ensureTopbarUtilityPanel(panelId) {');
    expect(pickerRuntime).toContain("const panel = ensureTopbarUtilityPanel(panelId);");
    expect(luxury).not.toContain('<div class="lux-utility-panel" id="lux-notification-panel"></div>');
    expect(luxury).not.toContain('<div class="lux-utility-panel" id="lux-chat-panel"></div>');
  });

  it('lazy-creates the hidden user menu instead of shipping its button list in the shell chrome', () => {
    const luxury = readSource('assets/js/features/index-luxury.js');
    const pickerRuntime = readSource('assets/js/features/luxury-shell-picker-runtime.js');
    const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');

    expect(pickerRuntime).toContain('function ensureUserMenu() {');
    expect(shellChrome).toContain("const menu = ensureUserMenu();");
    expect(luxury).not.toContain('<div class="lux-user-menu" id="lux-user-menu">');
  });

  it('lazy-creates the shell faculty and role picker panels instead of shipping empty panel containers in the topbar', () => {
    const luxury = readSource('assets/js/features/index-luxury.js');
    const pickerRuntime = readSource('assets/js/features/luxury-shell-picker-runtime.js');
    const topbarRuntime = readSource('assets/js/features/luxury-shell-topbar-runtime.js');

    expect(pickerRuntime).toContain('function ensureShellPickerPanel(panelId) {');
    expect(pickerRuntime).toContain("const rolePanel = ensureShellPickerPanel('lux-role-picker-panel');");
    expect(topbarRuntime).toContain("panel = panel || ensureShellPickerPanel('lux-faculty-picker-panel');");
    expect(topbarRuntime).toContain("panel = panel || ensureShellPickerPanel('lux-role-picker-panel');");
    expect(luxury).not.toContain('<div class="lux-picker-panel" id="lux-faculty-picker-panel"></div>');
    expect(luxury).not.toContain('<div class="lux-picker-panel" id="lux-role-picker-panel"></div>');
  });

  it('does not create shell picker panels during the initial professor-home sync', () => {
    const topbarRuntime = readSource('assets/js/features/luxury-shell-topbar-runtime.js');

    expect(topbarRuntime).toContain('function populateFacultySwitcher(options = {}) {');
    expect(topbarRuntime).toContain("let panel = document.getElementById('lux-faculty-picker-panel');");
    expect(topbarRuntime).toContain("if (!panel && !options.ensurePanel) return;");
    expect(topbarRuntime).toContain('function populateRoleSwitcher(options = {}) {');
    expect(topbarRuntime).toContain("let panel = document.getElementById('lux-role-picker-panel');");
    expect(topbarRuntime).toContain("if (!panel && !options.ensurePanel) return;");
  });

  it('queues transparency on every syncAll but tokensOnly when signatures unchanged', () => {
    const syncRuntime = readSource('assets/js/features/luxury-index-sync-runtime.js');
    const topbarRuntime = readSource('assets/js/features/luxury-shell-topbar-runtime.js');

    expect(syncRuntime).toContain('function buildTransparencySyncSignature(activePageId, transparencyValue) {');
    expect(syncRuntime).toContain('JSON.stringify(visuals.customPalette || {})');
    expect(syncRuntime).toContain("HOME_EDITOR_STATE.editing && HOME_EDITOR_STATE.role === getEffectiveRole() ? 'editing' : 'view'");
    expect(syncRuntime).toContain('var _transparencyUnchanged = window.__luxLastTransparencySyncSignature === _syncTransparencySignature');
    expect(syncRuntime).toContain('_transRefreshOptions.tokensOnly = true');
    expect(syncRuntime).toContain('window.queueLuxuryTransparencyRefresh(parseInt(_syncTransVal, 10), _transRefreshOptions)');
    expect(syncRuntime).not.toContain('window.__luxLastTransparencySyncSignature !== _syncTransparencySignature');
    expect(syncRuntime).toContain('!visualHalfUnchanged');
    expect(syncRuntime).not.toMatch(/populateFacultySwitcher\(\);\s*populateRoleSwitcher\(\);\s*syncLayout\(\)/);
    expect(topbarRuntime).toContain('function buildSyncTopbarSignature()');
    expect(topbarRuntime).toContain('window.__luxLastSyncTopbarSignature === topbarSignature');
  });

  it('coalesces boot transparency and pauses inactive visual observers', () => {
    const transparency = readSource('assets/js/shared/lux-transparency.js');
    const visualRuntime = readSource('assets/js/features/luxury-index-runtime.js');
    const luxury = readSource('assets/js/features/index-luxury.js');
    const syncRuntime = readSource('assets/js/features/luxury-index-sync-runtime.js');

    expect(transparency).toContain('__luxTransparencyBootRefreshScheduled');
    expect(transparency).toContain('function scheduleLuxuryTransparencyBootRefresh');
    expect(transparency).toContain('LUX_TRANSPARENCY_SURFACE_CACHE.signature === signature');
    expect(transparency).toContain('const force = options?.force === true');
    expect(visualRuntime).toContain('function pauseLuxuryVisualObservers()');
    expect(visualRuntime).toContain('function resumeLuxuryVisualObservers()');
    expect(visualRuntime).toContain('function scheduleRenderHomeShell()');
    expect(visualRuntime).toContain('homeRenderSignature');
    expect(luxury).toContain("document.addEventListener('visibilitychange'");
    expect(syncRuntime).toContain('visualHalfUnchanged');
  });

  it('adds keyboard close and focus return hooks for professor-home topbar overlays', () => {
    const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');
    const pickerRuntime = readSource('assets/js/features/luxury-shell-picker-runtime.js');

    expect(pickerRuntime).toContain('function closeUserMenu(options = {}) {');
    expect(shellChrome).toContain("chip.setAttribute('role', 'button');");
    expect(shellChrome).toContain("chip.setAttribute('tabindex', '0');");
    expect(shellChrome).toContain("if (event.key === 'Escape') {");
    expect(shellChrome).toContain('closeUtilityPanels({ restoreFocus: true });');
    expect(shellChrome).toContain('closePickerPanels({ restoreFocus: true });');
    expect(shellChrome).toContain('closeUserMenu({ restoreFocus: true });');
  });

  it('does not ship dead syllabus or registration-selection modals on the index home entry', () => {
    const indexHtml = readSource('index.html');
    const ui = readSource('assets/js/features/ui.js');

    expect(indexHtml).not.toContain('id="modal-syllabus"');
    expect(indexHtml).not.toContain('id="modal-add-concentration-subject"');
    expect(indexHtml).not.toContain('id="modal-add-minor-subject"');
    expect(ui).toContain("if (!overlay) return;");
    expect(ui).toContain('let opened = false;');
    expect(ui).toContain('if (!opened) return;');
  });

  it('does not ship the old mojibake-heavy programs modal payload on the index home entry', () => {
    const indexHtml = readSource('index.html');
    const ui = readSource('assets/js/features/ui.js');

    expect(indexHtml).not.toContain('ÃƒÆ’');
    expect(indexHtml).not.toContain('Ã‚Â');
    expect(indexHtml).not.toContain('Ã¢â‚¬');
    expect(indexHtml).not.toContain('I Module - Mandatory Subjects');
    expect(indexHtml).not.toContain('Probability and Statistics Basics');
    expect(ui).toContain('I Module - Mandatory Subjects');
    expect(ui).toContain('Probability and Statistics Basics');
  });

  it('keeps programs on a standalone route without index SPA injector leftovers', () => {
    const indexHtml = readSource('index.html');
    const ui = readSource('assets/js/features/ui.js');
    const navigation = readSource('assets/js/features/navigation.js');

    expect(indexHtml).not.toContain('id="page-programs"');
    expect(indexHtml).not.toContain('id="modal-announcement"');
    expect(indexHtml).not.toContain('id="modal-event"');
    expect(ui).toContain('function ensureModalScaffold(type)');
    expect(ui).not.toContain('function ensureIndexProgramsPage()');
    expect(ui).not.toContain('window.ensureIndexProgramsPage');
    expect(navigation).not.toContain('ensureIndexProgramsPage');
    expect(navigation).toContain("activePageId === 'programs' && typeof window.renderStudentEducationalProgramPage === 'function'");
  });

  it('keeps index home free of migrated news shell SPA leftovers', () => {
    const indexHtml = readSource('index.html');

    expect(indexHtml).not.toContain('id="page-social"');
    expect(indexHtml).not.toContain('id="public-social-root"');
    expect(indexHtml).not.toContain('id="page-news"');
    expect(indexHtml).not.toContain('id="portal-news-root"');
    expect(indexHtml).not.toContain('id="page-orders"');
    expect(indexHtml).not.toContain('id="page-library"');
    expect(indexHtml).toContain('id="page-home"');
    expect(indexHtml).toContain('id="lux-home-shell"');
  });

  it('does not ship the admin-tools page stub on the index home entry', () => {
    const indexHtml = readSource('index.html');
    const luxury = readSource('assets/js/features/index-luxury.js');
    const adminLuxury = readRegisteredAdminToolsChunk();

    expect(indexHtml).not.toContain('id="page-admin-tools"');
    expect(indexHtml).not.toContain('id="lux-admin-tools-shell"');
    expect(luxury).toContain('function ensureLuxuryAdminToolsBundle() {');
    expect(adminLuxury).toContain("page.id = 'page-admin-tools';");
    expect(adminLuxury).toContain("shell.id = 'lux-admin-tools-shell';");
  });

  it('does not apply flat surface primer overrides immediately on the home route', () => {
    const primer = readSource('assets/js/theme-primer.js');

    expect(primer).toContain("if (!b.classList.contains('lux-route-home') && !shouldSkipFlatSurfaceOverrides()) {");
    expect(primer).toContain('setTimeout(applyFlatSurfaceOverrides, 0);');
    expect(primer).toContain("if (document.body && document.body.classList.contains('lux-route-home')) return;");
  });

  it('keeps the shared font stylesheet local-only instead of pulling Google Fonts at runtime', () => {
    const indexHtml = readSource('index.html');
    const fontsCss = readSource('assets/css/kiu-fonts.css');

    expect(indexHtml).toContain('assets/css/kiu-fonts.css?v=20260515-fonts1');
    expect(fontsCss).not.toContain('fonts.googleapis.com');
    expect(fontsCss).toContain("@font-face {\n  font-family: 'Inter';");
    expect(fontsCss).toContain("@font-face {\n  font-family: 'Noto Sans Georgian';");
    expect(fontsCss).toContain("@font-face {\n  font-family: 'Playfair Display';");
    expect(fontsCss).toContain("@font-face {\n  font-family: 'Manrope';");
  });

  it('does not request the deleted placeholder components stylesheet anywhere in the live shell', () => {
    const indexHtml = readSource('index.html');
    const lmsHtml = readSource('lms.html');
    const socialHtml = readSource('social.html');
    const serviceWorker = readSource('service-worker.js');

    expect(indexHtml).not.toContain('assets/css/components.css');
    expect(lmsHtml).not.toContain('assets/css/components.css');
    expect(socialHtml).not.toContain('assets/css/components.css');
    expect(serviceWorker).not.toContain('assets/css/components.css');
  });

  it('gates expensive structural English overrides by page-root presence', () => {
    const localization = readSource('assets/js/app/english-localization.js');

    expect(localization).toContain('function hasPageRoot(pageId)');
    expect(localization).toContain("if (hasPageRoot('home')) applyStudentDashboardEnglishOverrides();");
    expect(localization).toContain("if (hasPageRoot('orders')) applyOrdersPageEnglishOverrides();");
    expect(localization).toContain("if (hasPageRoot('programs') || document.getElementById('modal-programs')) applyProgramsPageEnglishOverrides();");
    expect(localization).toContain("if (hasPageRoot('timetable')) applyTimetablePageEnglishOverrides();");
    expect(localization).not.toContain("if (hasPageRoot('library')) applyLibraryPageEnglishOverrides();");
    expect(localization).not.toContain('function applyLibraryPageEnglishOverrides');
  });

  it('stores the mojibake replacement table in encoded form instead of raw corrupted source literals', () => {
    const localization = readSource('assets/js/app/english-localization.js');

    expect(localization).toContain('function decodeReplacementKey(base64) {');
    expect(localization).toContain('const ENGLISH_UI_REPLACEMENT_DATA = [');
    expect(localization).toContain("const ENGLISH_UI_REPLACEMENTS = ENGLISH_UI_REPLACEMENT_DATA.map(([fromBase64, to]) => [decodeReplacementKey(fromBase64), to]);");
    expect(localization).not.toContain('const ENGLISH_UI_REPLACEMENTS = [');
  });

  it('does not bootstrap backend or realtime bridges from a local auth snapshot without a session token', () => {
    const auth = readSource('assets/js/app/auth.js');
    const api = readSource('assets/js/app/api.js');

    expect(auth).toContain("if (hasSessionToken) {");
    expect(auth).toContain("if (typeof getPortalSessionToken === 'function' && !getPortalSessionToken()) return true;");
    expect(api).toContain('if (!token) {');
    expect(api).toContain('if (!getPortalSessionToken()) {');
    expect(api).toContain('window.__KIU_PORTAL_BOOTSTRAP_PENDING = false;');
  });

  it('keeps only one chancellery English override implementation in app bootstrap', () => {
    const localization = readSource('assets/js/app/english-localization.js');
    const matches = localization.match(/function applyChancelleryPageEnglishOverrides\(/g) || [];

    expect(matches).toHaveLength(1);
  });

  it('keeps public social helpers out of faculty and live social runtime', () => {
    const faculty = readSource('assets/js/shared/faculty.js');
    const lite = readSource('assets/js/shared/social-runtime-lite.js');
    const count = (source, name) => (source.match(new RegExp(`function ${name}\\(`, 'g')) || []).length;

    expect(count(faculty, 'createPublicSocialPost')).toBe(0);
    expect(count(faculty, 'togglePublicSocialLike')).toBe(0);
    expect(count(faculty, 'addPublicSocialComment')).toBe(0);
    expect(count(faculty, 'deletePublicSocialPost')).toBe(0);
    expect(count(faculty, 'getPublicSocialVisiblePosts')).toBe(0);
    expect(count(lite, 'createPublicSocialPost')).toBe(0);
    expect(count(lite, 'togglePublicSocialLike')).toBe(0);
  });

  it('skips deep text-node localization walks when the root has no broken or Georgian text', () => {
    const localization = readSource('assets/js/app/english-localization.js');

    expect(localization).toContain('function rootHasTranslatableText(root)');
    expect(localization).toContain('function nodeNeedsEnglishLocalization(node)');
    expect(localization).toContain("if (!root.querySelector('option:not([value])')) return;");
    expect(localization).toContain("if (!root.querySelector('[placeholder],[title],[aria-label],input[type=\"button\"],input[type=\"submit\"]')) return;");
    expect(localization).toContain('if (rootHasTranslatableText(root)) {');
    expect(localization).toContain('translateTextNodes(root);');
    expect(localization).toContain('if (node.nodeType === Node.ELEMENT_NODE && nodeNeedsEnglishLocalization(node)) {');
  });

  it('uses device heuristics for performance tier on all routes including home', () => {
    const runtime = readSource('assets/js/features/luxury-index-runtime.js');
    const html = readSource('index.html');
    const luxury = readSource('assets/js/features/index-luxury.js');
    const tierBlock = runtime.slice(
      runtime.indexOf('function getLuxuryPerformanceTier'),
      runtime.indexOf('function getLuxuryBackgroundRenderProfile')
    );
    expect(tierBlock).not.toContain("if (document.body?.classList?.contains('lux-route-home')) return 'high';");
    expect(tierBlock).toContain('navigator.deviceMemory');
    expect(tierBlock).toContain('hardwareConcurrency');
    expect(tierBlock).toContain('cores <= 2');
    expect(html).toContain('luxury-index-runtime.js?v=');
    expect(luxury).toContain("particleQuality: 'auto'");
    expect(luxury).toContain('window.getLuxuryPerformanceTier = getLuxuryPerformanceTier');
    const transparencyModel = readSource('assets/js/features/luxury-transparency-model-runtime.js');
    expect(transparencyModel).toContain('window.getLuxuryPerformanceTier');
    expect(transparencyModel).not.toMatch(/getLuxuryPerformanceTier\(false\) === 'high'/);
  });

    it('busts portal shell SW cache (live stack, no retired luxury CSS)', () => {
    const app = readSource('assets/js/app/app.js');
    const sw = readSource('service-worker.js');
    expect(app).toMatch(/const PORTAL_CACHE_RESET_VERSION = '20\d{6}-[^']+'/);
    expect(sw).toMatch(/const CACHE_NAME = 'kiu-portal-shell-v/);
    expect(sw).toContain('index-home-layout.css');
    expect(sw).toContain('index-home-widgets.css');
    expect(sw).toContain('index-home-role.css');
    expect(sw).not.toContain('index-luxury.css');
    expect(sw).toContain('lux-fouc-ht.css');
    expect(sw).not.toMatch(/SHELL_ASSETS[\s\S]*lux-page-bare-lite\.css/);
    expect(sw).not.toContain("'/assets/css/lux-page-bare-lite.css");
    expect(sw).toContain('function isVersionedAssetUrl(url)');
    expect(sw).toContain('cachedVersioned');
    expect(sw).toContain('isVersionedAssetUrl(url)');
  });

  it('locks particle render to steady 30fps pacing', () => {
    const particles = readSource('assets/js/features/luxury-particle-background.js');
    const fog = readSource('assets/js/features/luxury-vanta-fog-background.js');
    const atmosphere = readSource('assets/js/features/luxury-atmosphere-runtime.js');
    const indexRuntime = readSource('assets/js/features/luxury-index-runtime.js');
    const foucCss = readSource('assets/css/lux-fouc-ht.css');
    const shellCss = readSource('assets/css/lux-shell.css');
    const shell = readSource('assets/js/features/luxury-shell-chrome.js');
    const editorDraft = readSource('assets/js/features/home-dashboard/editor-draft.js');
    const mobileCss = readSource('assets/css/mobile-shell-core.css');
    const renderBlock = particles.slice(
      particles.indexOf('function renderCurrentFrame'),
      particles.indexOf('function render()')
    );
    expect(renderBlock).toContain('readParticleFrameInterval()');
    expect(renderBlock).toContain('lastRenderTime += frameInterval');
    expect(renderBlock).toContain('updateAdaptivePixelScale');
    expect(renderBlock).toContain('renderParticleSceneToScreen');
    expect(particles).toContain('readParticlePacingMultiplier');
    expect(particles).toContain('buildLmsParticleThemeSignature');
    expect(particles).toContain('if (nextSignature === themeSignature) return');
    expect(particles).toContain('lux-render-governor.js');
    expect(particles).toContain('readGovernedFrameIntervalMs');
    expect(fog).toContain('startFogRenderLoop');
    expect(fog).toContain('readFogFrameInterval');
    expect(fog).toContain('readGovernedFrameIntervalMs');
    expect(particles).toContain('readCanvasPixelRatioCap()');
    expect(particles).toContain('startParticleRenderLoop');
    expect(particles).not.toMatch(/setAnimationLoop\(render\)/);
    expect(atmosphere).not.toContain('--lux-canvas-sharpness-blur');
    const transparency = readSource('assets/js/shared/lux-transparency.js');
    expect(transparency).toContain('syncLuxuryOffscreenBackdrop');
    expect(transparency).toContain('flushLuxuryTransparencyAfterScroll');
    expect(transparency).toContain("el.dataset.luxOffscreen === '1'");
    expect(transparency).toContain('filterCssOwnedTransparencySurfaces');
    expect(transparency).toContain('options?.tokensOnly === true');
    expect(transparency).toContain('shouldDeferLuxTransparency');
    expect(transparency).toContain('document.body.classList.contains(\'lux-page-bare\')');
    expect(transparency).toContain('isHomeLegacyGridInnerPanel');
    const bareLite = readSource('assets/css/lux-page-bare-lite.css');
    expect(bareLite).toContain('body.lux-page-bare .lux-page-shell');
    // Global bare blur kill forbidden; scoped admin-tools page-shell demotion is OK.
    expect(bareLite).not.toMatch(/body\.lux-page-bare\s*\{[^}]*backdrop-filter:\s*none/);
    expect(bareLite).toContain('.lux-page-shell[data-lux-layout-only="1"]');
    expect(bareLite).not.toMatch(/body\.lux-page-bare\s*\{[^}]*backdrop-filter:\s*var\(--lux-panel-blur-filter/);
    expect(shellCss).toMatch(/body\.lux-page-bare \.lux-page-shell[\s\S]*backdrop-filter:\s*var\(--lux-panel-blur-filter/);
    expect(shellCss).not.toMatch(/body\.lux-page-bare \.lux-page-shell :is\(\.page-hero, \.lux-panel, \.lux-alert\)[\s\S]*backdrop-filter:\s*none/);
    const homeRole = readSource('assets/css/index-home-role.css');
    const homeFouc = readSource('assets/css/lux-fouc-ht.css');
    expect(homeFouc).toContain('[data-lux-glass-root="1"]');
    expect(homeFouc).toMatch(/body\.lux-route-home #page-home #lux-home-shell[\s\S]*\.lux-home-grid > \.lux-card[\s\S]*backdrop-filter:\s*none/);
    expect(homeRole).toContain('.lux-home-merged');
    expect(homeRole).not.toMatch(/\.lux-home-grid[\s\S]{0,200}var\(--lux-panel-fill/);
    const governor = readSource('assets/js/shared/lux-render-governor.js');
    expect(governor).toContain('getPacingMultiplier');
    const syncRuntime = readSource('assets/js/features/luxury-index-sync-runtime.js');
    expect(syncRuntime).toContain('buildPaletteThemeSignature');
    expect(syncRuntime).toContain('__luxLastParticleThemePaletteSignature');
    expect(indexRuntime).toContain('syncLuxuryOffscreenBackdrop');
    expect(indexRuntime).toContain('__luxHeavySurfaceIoPending');
    expect(indexRuntime).toContain('getHeavySurfaceScrollRoot');
    expect(indexRuntime).toContain('.lux-page-shell');
    expect(indexRuntime).toContain('requestIdleCallback');
    expect(indexRuntime).toContain('#lux-home-shell .lux-home-grid');
    expect(indexRuntime).toContain('#page-admin-scheduler .sch-grid-shell');
    expect(foucCss).toMatch(/\[data-lux-offscreen="1"\]\s*\{\s*backdrop-filter:\s*none !important/);
    expect(foucCss).not.toMatch(/\[data-lux-offscreen="1"\]\s*\{[^}]*box-shadow:\s*none/);
    expect(foucCss).toMatch(/html\.lux-high-transparency[\s\S]*\.lux-home-merged\.lux-soft-chrome[\s\S]*backdrop-filter:\s*none !important/);
    expect(shellCss).toMatch(
        /body\.lux-full-paint\.lux-unified-shell #lux-topbar \.lux-topbar-shell\s*\{[\s\S]*?backdrop-filter:\s*none/
    );
    const bodyBefore = foucCss.slice(foucCss.indexOf('body::before'), foucCss.indexOf('body:not(.lux-light-mode)::before'));
    expect(bodyBefore).not.toContain('will-change');
    expect(shellCss).not.toMatch(/#lux-topbar\s*\{[^}]*will-change/);
    expect(shellCss).not.toMatch(/#lux-shell, \.lux-card\s*\{[^}]*will-change/);
    expect(shellCss).toMatch(/html\.lux-shell-chrome-motion #lux-shell\s*\{[\s\S]*?will-change:\s*transform/);
    expect(shellCss.replace(/html\.lux-shell-chrome-motion #lux-shell\s*\{[\s\S]*?\}/g, '')).not.toMatch(
        /#lux-shell\s*\{[^}]*will-change:\s*transform/
    );
    const canvasBlock = foucCss.slice(foucCss.indexOf('#lux-bg-canvas {'), foucCss.indexOf('#lux-bg-fog'));
    expect(canvasBlock).not.toContain('will-change');
    expect(foucCss).not.toMatch(/html\.lux-high-transparency #lux-shell[\s\S]*--lux-shell-sidebar-blur:\s*none/);
    expect(shellCss).toMatch(/#lux-shell[\s\S]*backdrop-filter:\s*var\(--lux-shell-sidebar-blur\)/);
    expect(particles).toContain('antialias: !(initialQuality.supersample > 1)');
    expect(particles).toMatch(/balanced:\s*\{[\s\S]*?maxDpr:\s*1\.5/);
    expect(particles).not.toMatch(/balanced:\s*\{[\s\S]*?supersample:\s*1\.15/);
    expect(particles).toMatch(/balanced:\s*\{[\s\S]*?supersample:\s*1[,}]/);
    expect(particles).toContain('syncRibbonMeshInScene');
    expect(particles).toContain('scene.remove(ribbonMesh)');
    expect(atmosphere).toContain('scheduleParticleBackgroundRefresh');
    expect(shell).toContain('collectShellPerimeterPoints(rect, 5)');
    expect(shell).toContain("kinds = ['dot', 'spark', 'streak']");
    expect(shell).not.toContain('lux-chip-burst-particle--ring');
    expect(shell).toContain('_lastBurstAt');
    expect(shell).toContain('now - lastAt < 90');
    expect(shell).not.toContain('spawnStudioChipBurstParticles._live');
    expect(shell).toContain('if (bit._done) return');
    expect(shell).toContain('window.spawnLuxChipBurstParticles = spawnStudioChipBurstParticles');
    const studioCss = readSource('assets/css/lux-studio.css');
    expect(studioCss).toContain('lux-chip-burst-particle--spark');
    expect(studioCss).toContain('lux-chip-burst-particle--streak');
    expect(studioCss).not.toContain('lux-chip-burst-particle--ring');
    expect(studioCss).toMatch(/\.lux-mode-btn[\s\S]*:hover:not\(:disabled\)::after[\s\S]*opacity:\s*1/);
    expect(studioCss).toMatch(/:hover:not\(:disabled\)[\s\S]*\[data-glass-blur-quality\]/);
    expect(studioCss).not.toMatch(/filter:\s*brightness\(0\.93\)/);
    const studioChipBlock = studioCss.match(
        /\/\* Soft-chrome chip shells[\s\S]*?@media \(hover: hover\) and \(pointer: fine\)/
    )?.[0] || '';
    expect(studioChipBlock).not.toContain('.lux-studio-section:not(:has');
    expect(studioCss).toMatch(/\.lux-apply-btn::after/);
    expect(studioCss).not.toMatch(/#lux-studio-backdrop \.lux-apply-btn:active[\s\S]*filter:\s*brightness/);
    const motionRuntime = readSource('assets/js/features/luxury-shell-motion-runtime.js');
    expect(motionRuntime).toContain('beginShellChromeMotion');
    expect(motionRuntime).toContain('bindShellChromeMotion');
    expect(motionRuntime).toContain('lux-shell-chrome-motion');
    expect(motionRuntime).toContain('__luxShellHoverBusy');
    expect(motionRuntime).toContain('pulseShellHoverBusy');
    expect(motionRuntime).toContain('beginLuxAnimating');
    expect(motionRuntime).toContain('__luxIsAnimating');
    expect(motionRuntime).toContain("addEventListener('pointerover'");
    expect(motionRuntime).not.toContain('control-hover');
    expect(motionRuntime).not.toContain('control-transition');
    expect(motionRuntime).not.toMatch(/addEventListener\('mouseenter'/);
    expect(motionRuntime).not.toContain('shell-transform');
    expect(motionRuntime).not.toContain('nav-enter');
    expect(motionRuntime).not.toContain("addEventListener('animationstart'");
    expect(motionRuntime).not.toMatch(/queueLuxuryTransparencyRefresh\([^)]*force:\s*true/);
    expect(shell).toContain('.lux-bg-gallery-tile, #lux-bg-gallery-upload');
    expect(shell).not.toMatch(/navigate\(pageTarget\(routePage\)\);\s*if \(typeof syncAll === 'function'\) syncAll\(\);/);
    expect(editorDraft).toContain('stopHomeEditor = function');
    expect(mobileCss).not.toMatch(/#mobile-bottom-nav \{[^}]*backdrop-filter/s);
  });
});
