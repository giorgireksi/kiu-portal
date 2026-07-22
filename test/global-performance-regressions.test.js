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

    expect(utilities).toContain('const SHARED_TRANSPARENCY_OBSERVER_SELECTOR = SHARED_TRANSPARENCY_OBSERVER_SELECTORS.join');
    expect(utilities).toContain('node.querySelector(SHARED_TRANSPARENCY_OBSERVER_SELECTOR)');
    expect(utilities).toContain("typeof window.requestIdleCallback === 'function'");
    expect(utilities).not.toContain('var _debounceMs = transparency > 60 ? 16 : 300;');
    expect(utilities).toContain('function setupTransparencyObserver()');
    expect(utilities).toContain('window.__transparencyObserver');
    expect(utilities).toContain('isLuxTransparencyExemptSubtree');
    expect(utilities).toContain('node.matches(SHARED_TRANSPARENCY_OBSERVER_SELECTOR)');
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
    const utilities = readSource('assets/js/shared/utilities.js');

    expect(luxury).toContain('function isStandaloneLibraryRouteActive()');
    expect(luxury).toContain('isStandaloneLibraryRouteActive()');
    expect(luxury).toContain('refreshStandaloneDesktopRouteShellContext({ rerender: false })');
    expect(luxury).toContain('onStandaloneLibrary');
    expect(luxury).toContain('scheduleParticleInit');
    expect(luxury).toContain('scheduleLibraryRouteBackgroundRefresh');
    expect(luxuryBackground).toContain('lux-route-library');
    expect(luxuryBackground).toContain('requestIdleCallback');
    expect(navigation).toMatch(/entryId === 'orders' \|\| entryId === 'library'/);
    expect(utilities).toContain("document.body.classList.contains('lux-route-library')");
    expect(utilities).toContain('library-catalog-card');
    expect(navigation).toContain('lux-route-library');
  });

  it('skips repeated transparency work when surfaces already have the current signature', () => {
    const transparency = readSource('assets/js/shared/lux-transparency.js');

    expect(transparency).toContain('const transparencySignature = [');
    expect(transparency).toContain('el.dataset.luxTransparencySignature === transparencySignature');
    expect(transparency).toContain('Early signature skip');
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

  it('uses lightweight navigate sync instead of full syncAll after navigation', () => {
    const luxury = readSource('assets/js/features/index-luxury.js');

    expect(luxury).toContain('function syncAfterNavigate(pageId) {');
    expect(luxury).toContain('function queueNavigateSync(args, result) {');
    expect(luxury).toContain('syncAfterNavigate(targetPageId);');
    expect(luxury).toContain('__luxPendingNavigateSyncPageId = pageId');
    expect(luxury).toContain("wrapFunction('navigate', queueNavigateSync);");
    expect(luxury).toContain("wrapFunction('switchRole', queueShellSync);");
    expect(luxury).toMatch(/function queueNavigateSync[\s\S]*?syncAfterNavigate\(targetPageId\)/);
    expect(luxury).toContain('function isStandaloneLmsRouteActive() {');
    expect(luxury).toContain("window.refreshStandaloneDesktopRouteShellContext({ rerender: true, refreshActiveRoute: true });");
    expect(luxury).toContain("window.refreshStandaloneDesktopShellChrome()");
    expect(luxury).toMatch(/function queueShellSync[\s\S]*?(refreshStandaloneDesktopRouteShellContext|refreshStandaloneDesktopShellChrome|syncAll\(\))/);
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
    expect(navigation).toContain('const PORTAL_STARTUP_MAX_ATTEMPTS = 48;');
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
    const homeLuxury = readRegisteredHomeChunk();
    const count = (source, pattern) => (source.match(pattern) || []).length;

    expect(count(luxury, /function createDashboardPreferenceEntry\(/g)).toBe(1);
    expect(count(luxury, /function getDashboardPreferenceEntry\(/g)).toBe(1);
    expect(count(luxury, /function updateDashboardPreferenceEntry\(/g)).toBe(1);
    expect(count(luxury, /function getDashboardVisuals\(/g)).toBe(1);
    expect(count(luxury, /function setDashboardVisuals\(/g)).toBe(1);
    expect(count(luxury, /function applyAtmosphereSettings\(/g)).toBe(1);
    expect(count(luxury, /function resolvePaletteKey\(/g)).toBe(1);
    expect(count(luxury, /function resolveCustomPalette\(/g)).toBe(1);
    expect(count(luxury, /function applyPaletteValues\(/g)).toBe(1);
    expect(count(luxury, /function applyPaletteKey\(/g)).toBe(1);
    expect(count(luxury, /function applyCustomPalette\(/g)).toBe(1);
    expect(count(luxury, /function applyResolvedPalette\(/g)).toBe(1);
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
    expect(count(homeLuxury, /function cyclePalette\(/g)).toBe(1);
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

  it('ships the home dashboard builder CSS only on the home entry', () => {
    const indexHtml = readSource('index.html');
    expect(existsSync(join(process.cwd(), 'assets/css/index-luxury.css'))).toBe(false);
    const homeCss = readHomeDashboardCss();
    const editorCss = readSource('assets/css/index-home-editor.css');

        expect(indexHtml).toContain('assets/css/index-home-layout.css');
        expect(indexHtml).toContain('assets/css/index-home-widgets.css');
        expect(indexHtml).toContain('assets/css/index-home-role.css');
    expect(homeCss).toContain('.lux-home-grid--builder {');
    expect(editorCss).toContain('.lux-home-editor-panel--builder {');
    expect(homeCss).toContain('#page-home.page-section>#lux-home-shell>.lux-home-grid--builder');
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

    expect(indexHtml).toContain('assets/js/pages/index-mobile-shell.js?v=20260514-home-mobile-shell1');
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

    expect(shellChrome).toContain("const itemSignature = groups");
    expect(shellChrome).toContain("const signature = `${role}|${activePage}|${itemSignature}`;");
    expect(shellChrome).toContain("if (navRoot.dataset.renderSignature === signature && navRoot.children.length) return;");
    expect(shellChrome).toContain("navRoot.dataset.renderSignature = signature;");
    expect(shellChrome).toContain("const optionSignature = optionsList.map((opt) => `${opt.value}:${opt.label}`).join('|');");
    expect(shellChrome).toContain("if (panel.dataset.renderSignature !== signature) {");
    expect(shellChrome).toContain("if (navRoot.dataset.bound !== '1') {");
    expect(shellChrome).toContain("if (panel.dataset.bound !== '1') {");
  });

  it('caches widget context and system definitions per home model object', () => {
    const luxury = readRegisteredHomeChunk();

    expect(luxury).toContain('const HOME_WIDGET_CONTEXT_CACHE = new WeakMap();');
    expect(luxury).toContain('const HOME_WIDGET_DEFINITIONS_CACHE = new WeakMap();');
    expect(luxury).toContain('function buildHomeWidgetContextUncached(role, model) {');
    expect(luxury).toContain('function buildHomeWidgetContext(role, model) {');
    expect(luxury).toContain('const cached = HOME_WIDGET_CONTEXT_CACHE.get(model);');
    expect(luxury).toContain('HOME_WIDGET_CONTEXT_CACHE.set(model, { role, value: context });');
    expect(luxury).toContain('function buildSystemWidgetDefinitionsUncached(role, model) {');
    expect(luxury).toContain('function buildSystemWidgetDefinitions(role, model) {');
    expect(luxury).toContain('const cached = HOME_WIDGET_DEFINITIONS_CACHE.get(model);');
    expect(luxury).toContain('HOME_WIDGET_DEFINITIONS_CACHE.set(model, { role, value: definitions });');
  });

  it('sanitizes widget definition text and shared role labels before professor-home surfaces render', () => {
    const luxury = readRegisteredHomeChunk();
    const utilities = readSource('assets/js/shared/utilities.js');

    expect(luxury).toContain('function sanitizeWidgetDefinitionText(definition) {');
    expect(luxury).toContain("buildSystemWidgetDefinitionsUncached(role, model).map((definition) => sanitizeWidgetDefinitionText(definition))");
    expect(utilities).toContain("userRoleEl.textContent = `${roleLabels[currentUser.role] || 'University Portal'} - ${facultyLabel}`;");
  });

  it('keeps the professor-home entry shell role-neutral and lets the primer resolve the requested role before reveal', () => {
    const indexHtml = readSource('index.html');
    const primer = readSource('assets/js/theme-primer.js');
    const app = readSource('assets/js/app/app.js');

    expect(indexHtml).toContain('<title>KIU - Portal</title>');
    expect(indexHtml).not.toContain('<title>KIU - Student Portal</title>');
    expect(indexHtml).not.toContain('<body class="role-student');
    expect(primer).toContain('function getRequestedShellRole() {');
    expect(primer).toContain("b.classList.remove('role-student', 'role-professor', 'role-ta', 'role-admin', 'role-student_service');");
    expect(primer).toContain("b.classList.add('role-' + requestedRole);");
    expect(primer).toContain('document.title = getShellHomeTitle(requestedRole);');
    expect(app).toContain("const shellTitle = shellRole === USER_ROLES.PROFESSOR");
    expect(app).not.toContain("if (document?.title !== 'KIU - Student Portal') document.title = 'KIU - Student Portal';");
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
    const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');

    expect(shellChrome).toContain('function ensureTopbarUtilityPanel(panelId) {');
    expect(shellChrome).toContain("const panel = ensureTopbarUtilityPanel(panelId);");
    expect(luxury).not.toContain('<div class="lux-utility-panel" id="lux-notification-panel"></div>');
    expect(luxury).not.toContain('<div class="lux-utility-panel" id="lux-chat-panel"></div>');
  });

  it('lazy-creates the hidden user menu instead of shipping its button list in the shell chrome', () => {
    const luxury = readSource('assets/js/features/index-luxury.js');
    const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');

    expect(shellChrome).toContain('function ensureUserMenu() {');
    expect(shellChrome).toContain("const menu = ensureUserMenu();");
    expect(luxury).not.toContain('<div class="lux-user-menu" id="lux-user-menu">');
  });

  it('lazy-creates the shell faculty and role picker panels instead of shipping empty panel containers in the topbar', () => {
    const luxury = readSource('assets/js/features/index-luxury.js');
    const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');

    expect(shellChrome).toContain('function ensureShellPickerPanel(panelId) {');
    expect(shellChrome).toContain("const rolePanel = ensureShellPickerPanel('lux-role-picker-panel');");
    expect(shellChrome).toContain("panel = panel || ensureShellPickerPanel('lux-faculty-picker-panel');");
    expect(shellChrome).toContain("panel = panel || ensureShellPickerPanel('lux-role-picker-panel');");
    expect(luxury).not.toContain('<div class="lux-picker-panel" id="lux-faculty-picker-panel"></div>');
    expect(luxury).not.toContain('<div class="lux-picker-panel" id="lux-role-picker-panel"></div>');
  });

  it('does not create shell picker panels during the initial professor-home sync', () => {
    const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');

    expect(shellChrome).toContain('function populateFacultySwitcher(options = {}) {');
    expect(shellChrome).toContain("let panel = document.getElementById('lux-faculty-picker-panel');");
    expect(shellChrome).toContain("if (!panel && !options.ensurePanel) return;");
    expect(shellChrome).toContain('function populateRoleSwitcher(options = {}) {');
    expect(shellChrome).toContain("let panel = document.getElementById('lux-role-picker-panel');");
    expect(shellChrome).toContain("if (!panel && !options.ensurePanel) return;");
  });

  it('always re-applies transparency after syncAll atmosphere/perf (no signature skip)', () => {
    const syncRuntime = readSource('assets/js/features/luxury-index-sync-runtime.js');

    expect(syncRuntime).toContain('function buildTransparencySyncSignature(activePageId, transparencyValue) {');
    expect(syncRuntime).toContain('JSON.stringify(visuals.customPalette || {})');
    expect(syncRuntime).toContain("HOME_EDITOR_STATE.editing && HOME_EDITOR_STATE.role === getEffectiveRole() ? 'editing' : 'view'");
    // Signature is recorded for diagnostics, but refresh must always run so glass tokens win.
    expect(syncRuntime).toContain('window.__luxLastTransparencySyncSignature = buildTransparencySyncSignature(activePageId, _syncTransVal);');
    expect(syncRuntime).toContain("window.queueLuxuryTransparencyRefresh(parseInt(_syncTransVal, 10), { persist: false });");
    expect(syncRuntime).not.toContain('window.__luxLastTransparencySyncSignature !== _syncTransparencySignature');
  });

  it('coalesces boot transparency and pauses inactive visual observers', () => {
    const transparency = readSource('assets/js/shared/lux-transparency.js');
    const visualRuntime = readSource('assets/js/features/luxury-index-runtime.js');
    const luxury = readSource('assets/js/features/index-luxury.js');
    const syncRuntime = readSource('assets/js/features/luxury-index-sync-runtime.js');

    expect(transparency).toContain('__luxTransparencyBootRefreshScheduled');
    expect(transparency).toContain('function scheduleLuxuryTransparencyBootRefresh');
    expect(transparency).toContain('Early signature skip');
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

    expect(shellChrome).toContain('function closeUserMenu(options = {}) {');
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
    expect(fontsCss).toContain("@font-face {\n    font-family: 'Inter';");
    expect(fontsCss).toContain("@font-face {\n    font-family: 'Noto Sans Georgian';");
    expect(fontsCss).toContain("@font-face {\n    font-family: 'Playfair Display';");
    expect(fontsCss).toContain("@font-face {\n    font-family: 'Manrope';");
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
    const app = readSource('assets/js/app/app.js');

    expect(app).toContain('function hasPageRoot(pageId)');
    expect(app).toContain("if (hasPageRoot('home')) applyStudentDashboardEnglishOverrides();");
    expect(app).toContain("if (hasPageRoot('orders')) applyOrdersPageEnglishOverrides();");
    expect(app).toContain("if (hasPageRoot('programs') || document.getElementById('modal-programs')) applyProgramsPageEnglishOverrides();");
    expect(app).toContain("if (hasPageRoot('timetable')) applyTimetablePageEnglishOverrides();");
    expect(app).not.toContain("if (hasPageRoot('library')) applyLibraryPageEnglishOverrides();");
    expect(app).not.toContain('function applyLibraryPageEnglishOverrides');
  });

  it('stores the mojibake replacement table in encoded form instead of raw corrupted source literals', () => {
    const app = readSource('assets/js/app/app.js');

    expect(app).toContain('function decodeReplacementKey(base64) {');
    expect(app).toContain('const ENGLISH_UI_REPLACEMENT_DATA = [');
    expect(app).toContain("const ENGLISH_UI_REPLACEMENTS = ENGLISH_UI_REPLACEMENT_DATA.map(([fromBase64, to]) => [decodeReplacementKey(fromBase64), to]);");
    expect(app).not.toContain('const ENGLISH_UI_REPLACEMENTS = [');
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
    const app = readSource('assets/js/app/app.js');
    const matches = app.match(/function applyChancelleryPageEnglishOverrides\(/g) || [];

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
    const app = readSource('assets/js/app/app.js');

    expect(app).toContain('function rootHasTranslatableText(root)');
    expect(app).toContain('function nodeNeedsEnglishLocalization(node)');
    expect(app).toContain("if (!root.querySelector('option:not([value])')) return;");
    expect(app).toContain("if (!root.querySelector('[placeholder],[title],[aria-label],input[type=\"button\"],input[type=\"submit\"]')) return;");
    expect(app).toContain('if (rootHasTranslatableText(root)) {');
    expect(app).toContain('translateTextNodes(root);');
    expect(app).toContain('if (node.nodeType === Node.ELEMENT_NODE && nodeNeedsEnglishLocalization(node)) {');
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
    expect(luxury).toContain("particleQuality: 'high'");
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
  });

  it('locks particle render to steady 30fps pacing', () => {
    const particles = readSource('assets/js/features/luxury-particle-background.js');
    const fog = readSource('assets/js/features/luxury-vanta-fog-background.js');
    const atmosphere = readSource('assets/js/features/luxury-atmosphere-runtime.js');
    const shell = readSource('assets/js/features/luxury-shell-chrome.js');
    const editorDraft = readSource('assets/js/features/home-dashboard/editor-draft.js');
    const mobileCss = readSource('assets/css/mobile-shell-core.css');
    const renderBlock = particles.slice(
      particles.indexOf('function renderCurrentFrame'),
      particles.indexOf('function render()')
    );
    expect(renderBlock).toContain('TARGET_FPS = 30');
    expect(renderBlock).toContain('lastRenderTime += frameInterval');
    expect(renderBlock).not.toContain('window.__luxIsScrolling');
    expect(particles).toContain('fps: 30');
    expect(fog).toContain('scaleMobile: 1.5');
    expect(atmosphere).toContain('scheduleParticleBackgroundRefresh');
    expect(shell).toContain('collectShellPerimeterPoints(rect, 5)');
    expect(shell).toContain("kinds = ['dot', 'spark', 'streak']");
    expect(shell).not.toContain('lux-chip-burst-particle--ring');
    expect(shell).toContain('_lastBurstAt');
    expect(shell).toContain('now - lastAt < 90');
    expect(shell).not.toContain('spawnStudioChipBurstParticles._live');
    expect(shell).toContain('if (bit._done) return');
    const studioCss = readSource('assets/css/lux-studio.css');
    expect(studioCss).toContain('lux-chip-burst-particle--spark');
    expect(studioCss).toContain('lux-chip-burst-particle--streak');
    expect(studioCss).not.toContain('lux-chip-burst-particle--ring');
    expect(shell).toContain('.lux-bg-gallery-tile, #lux-bg-gallery-upload');
    expect(shell).not.toMatch(/navigate\(pageTarget\(routePage\)\);\s*if \(typeof syncAll === 'function'\) syncAll\(\);/);
    expect(editorDraft).toContain('function setSelectedDraftWidget(instanceId, { render = false');
    expect(mobileCss).not.toMatch(/#mobile-bottom-nav \{[^}]*backdrop-filter/s);
  });
});
