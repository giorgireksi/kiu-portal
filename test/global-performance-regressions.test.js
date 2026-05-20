import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function readRegisteredHomeChunk() {
  const registrationSource = readSource('assets/js/features/index-home-dashboard.js');
  const match = registrationSource.match(/__kiuRegisterLuxuryHomeChunk\('([^']+)'\)/);

  if (!match) {
    throw new Error('Home dashboard bundle registration payload was not found.');
  }

  return Buffer.from(match[1], 'base64').toString('utf8');
}

function readRegisteredAdminToolsChunk() {
  const registrationSource = readSource('assets/js/features/index-admin-tools.js');
  const match = registrationSource.match(/__kiuRegisterLuxuryAdminToolsChunk\('([^']+)'\)/);

  if (!match) {
    throw new Error('Admin tools bundle registration payload was not found.');
  }

  return Buffer.from(match[1], 'base64').toString('utf8');
}

describe('global interaction performance guardrails', () => {
  it('does not full-scan every DOM mutation for glass transparency refreshes', () => {
    const utilities = readSource('assets/js/shared/utilities.js');

    expect(utilities).toContain('const SHARED_TRANSPARENCY_OBSERVER_SELECTOR = SHARED_TRANSPARENCY_OBSERVER_SELECTORS.join');
    expect(utilities).toContain('node.querySelector(SHARED_TRANSPARENCY_OBSERVER_SELECTOR)');
    expect(utilities).toContain("typeof window.requestIdleCallback === 'function'");
    expect(utilities).not.toContain('var _debounceMs = transparency > 60 ? 16 : 300;');
  });

  it('skips repeated transparency work when surfaces already have the current signature', () => {
    const utilities = readSource('assets/js/shared/utilities.js');

    expect(utilities).toContain('const transparencySignature = [');
    expect(utilities).toContain('el.dataset.luxTransparencySignature === transparencySignature');
    expect(utilities).toContain('el.dataset.luxTransparencySignature = transparencySignature;');
  });

  it('scopes transparency surface refreshes to active shell roots instead of querying the whole document', () => {
    const utilities = readSource('assets/js/shared/utilities.js');

    expect(utilities).toContain('const INDEX_TRANSPARENCY_GLOBAL_ROOT_SELECTORS = [');
    expect(utilities).toContain('function collectTransparencySurfaceElements(selectorList, rootsOverride)');
    expect(utilities).toContain("const activePage = document.querySelector('.page-section.active-page');");
    expect(utilities).toContain('const surfaceElements = collectTransparencySurfaceElements(allSelectors, scopedRoots);');
    expect(utilities).not.toContain("const surfaceElements = document.querySelectorAll(allSelectors.join(', '));");
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
    expect(utilities).toContain("if (typeof fastRedirectRoleSwitch === 'function' && fastRedirectRoleSwitch(requestedRole))");
    expect(luxury).toContain('if (window.__kiuRoleSwitchRedirectPending || window.__kiuFacultySwitchRedirectPending) return;');
    expect(luxury).toContain('frameInterval: reducedMotion ? 80 : 42');
  });

  it('renders a static luxury background on the efficient performance tier', () => {
    const luxury = readSource('assets/js/features/index-luxury.js');
    const homeLuxury = readRegisteredHomeChunk();

    expect(luxury).toContain('function ensureLuxuryHomeDashboardBundle() {');
    expect(homeLuxury).not.toContain('function startBackground() {');
    expect(homeLuxury).toContain('startBackground = function () {');
    expect(homeLuxury).toContain("const staticBackgroundOnly = getLuxuryBackgroundRenderProfile(reducedMotion).tier === 'efficient';");
    expect(homeLuxury).toContain('function renderCurrentFrame(time = 0)');
    expect(homeLuxury).toContain('if (staticBackgroundOnly) {');
    expect(homeLuxury).toContain('renderCurrentFrame(window.performance?.now?.() || Date.now());');
  });

  it('does not promote unknown-memory laptops into the high background tier by default', () => {
    const luxury = readSource('assets/js/features/index-luxury.js');

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
    const homeLuxury = readRegisteredHomeChunk();
    const count = (source, pattern) => (source.match(pattern) || []).length;

    expect(count(luxury, /function renderHomeShell\(/g)).toBe(1);
    expect(count(luxury, /renderDynamicHomeShell\s*=\s*function\s*\(/g)).toBe(0);
    expect(count(homeLuxury, /renderDynamicHomeShell\s*=\s*function\s*\(/g)).toBe(1);
    expect(luxury).toContain('ensureLuxuryHomeDashboardBundle().then((loaded) => {');
    expect(luxury).not.toContain('renderDynamicHomeShell(homeShell);\r\n        return;');
    expect(homeLuxury).not.toContain('function renderDynamicHomeShell(homeShell) {');
  });

  it('keeps only one role-surface background block per home role in index-luxury css', () => {
    const sharedCss = readSource('assets/css/index-luxury.css');
    const homeCss = readSource('assets/css/index-home-dashboard.css');
    const count = (source, text) => (source.match(new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;

    expect(count(sharedCss, '.lux-home-grid.is-student .lux-hero,')).toBe(0);
    expect(count(sharedCss, '.lux-home-grid.is-professor .lux-hero,')).toBe(0);
    expect(count(sharedCss, '.lux-home-grid.is-ta .lux-hero,')).toBe(0);
    expect(count(sharedCss, '.lux-home-grid.is-admin .lux-hero,')).toBe(0);
    expect(count(sharedCss, '.lux-home-grid.is-student_service .lux-hero,')).toBe(0);
    expect(count(homeCss, '.lux-home-grid.is-student .lux-hero,')).toBe(1);
    expect(count(homeCss, '.lux-home-grid.is-professor .lux-hero,')).toBe(1);
    expect(count(homeCss, '.lux-home-grid.is-ta .lux-hero,')).toBe(1);
    expect(count(homeCss, '.lux-home-grid.is-admin .lux-hero,')).toBe(1);
    expect(count(homeCss, '.lux-home-grid.is-student_service .lux-hero,')).toBe(1);
  });

  it('ships the home dashboard builder CSS only on the home entry', () => {
    const indexHtml = readSource('index.html');
    const sharedCss = readSource('assets/css/index-luxury.css');
    const homeCss = readSource('assets/css/index-home-dashboard.css');

    expect(indexHtml).toContain('assets/css/index-home-dashboard.css?v=20260517-homecsssplit1');
    expect(sharedCss).not.toContain('.lux-home-grid--builder {');
    expect(sharedCss).not.toContain('.lux-home-editor-panel--builder {');
    expect(sharedCss).not.toContain('#page-home.page-section>#lux-home-shell>.lux-home-grid--builder');
    expect(homeCss).toContain('.lux-home-grid--builder {');
    expect(homeCss).toContain('.lux-home-editor-panel--builder {');
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

    expect(indexHtml).not.toContain('assets/js/pages/student-registration.js?v=20260430-lmsgrades1');
    expect(indexHtml).not.toContain('assets/js/pages/news.js?v=20260516-newsroute3');
    expect(app).toContain("'assets/js/pages/student-registration.js?v=20260430-lmsgrades1'");
    expect(app).toContain('window.ensurePortalRegistrationRuntimeLoaded = function ensurePortalRegistrationRuntimeLoaded()');
    expect(app).toContain("const NEWS_RUNTIME_SCRIPT = 'assets/js/pages/news.js?v=20260516-newsroute3';");
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

    expect(shellChrome).toContain("const signature = `${role}|${activePage}`;");
    expect(shellChrome).toContain("if (navRoot.dataset.renderSignature === signature) return;");
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

  it('skips syncAll transparency refreshes when professor-home shell state is unchanged', () => {
    const luxury = readSource('assets/js/features/index-luxury.js');

    expect(luxury).toContain('function buildTransparencySyncSignature(activePageId, transparencyValue) {');
    expect(luxury).toContain('JSON.stringify(visuals.customPalette || {})');
    expect(luxury).toContain("HOME_EDITOR_STATE.editing && HOME_EDITOR_STATE.role === getEffectiveRole() ? 'editing' : 'view'");
    expect(luxury).toContain('window.__luxLastTransparencySyncSignature !== _syncTransparencySignature');
    expect(luxury).toContain('window.__luxLastTransparencySyncSignature = _syncTransparencySignature;');
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

  it('lazy-creates the programs shell page and shared home modals instead of shipping them in index html', () => {
    const indexHtml = readSource('index.html');
    const ui = readSource('assets/js/features/ui.js');
    const navigation = readSource('assets/js/features/navigation.js');

    expect(indexHtml).not.toContain('id="page-programs"');
    expect(indexHtml).not.toContain('id="modal-announcement"');
    expect(indexHtml).not.toContain('id="modal-event"');
    expect(ui).toContain('function ensureModalScaffold(type)');
    expect(ui).toContain('function ensureIndexProgramsPage()');
    expect(navigation).toContain("if (pageId === 'programs' && typeof ensureIndexProgramsPage === 'function' && !document.getElementById('page-programs'))");
  });

  it('keeps the migrated news shell section without reintroducing the old social placeholder routes', () => {
    const indexHtml = readSource('index.html');

    expect(indexHtml).not.toContain('id="page-social"');
    expect(indexHtml).not.toContain('id="public-social-root"');
    expect(indexHtml).toContain('id="page-news"');
    expect(indexHtml).toContain('id="portal-news-root"');
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

    expect(primer).toContain("if (!b.classList.contains('lux-route-home')) {");
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
    expect(fontsCss).toContain("@font-face {\n    font-family: 'DM Mono';");
  });

  it('does not request the placeholder components stylesheet on the index home entry', () => {
    const indexHtml = readSource('index.html');
    const componentsCss = readSource('assets/css/components.css');

    expect(componentsCss.trim()).toBe('/* Shared component styles placeholder for compatibility-first refactor. */');
    expect(indexHtml).not.toContain('assets/css/components.css');
  });

  it('gates expensive structural English overrides by page-root presence', () => {
    const app = readSource('assets/js/app/app.js');

    expect(app).toContain('function hasPageRoot(pageId)');
    expect(app).toContain("if (hasPageRoot('home')) applyStudentDashboardEnglishOverrides();");
    expect(app).toContain("if (hasPageRoot('orders')) applyOrdersPageEnglishOverrides();");
    expect(app).toContain("if (hasPageRoot('library')) applyLibraryPageEnglishOverrides();");
    expect(app).toContain("if (hasPageRoot('timetable')) applyTimetablePageEnglishOverrides();");
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
    expect(api).toContain('if (!getPortalSessionToken()) return;');
  });

  it('keeps only one chancellery English override implementation in app bootstrap', () => {
    const app = readSource('assets/js/app/app.js');
    const matches = app.match(/function applyChancelleryPageEnglishOverrides\(/g) || [];

    expect(matches).toHaveLength(1);
  });

  it('keeps only one public social helper implementation in faculty runtime', () => {
    const faculty = readSource('assets/js/shared/faculty.js');
    const publicSocial = readSource('assets/js/shared/public-social-runtime.js');
    const count = (name) => (faculty.match(new RegExp(`function ${name}\\(`, 'g')) || []).length;
    const publicCount = (name) => (publicSocial.match(new RegExp(`function ${name}\\(`, 'g')) || []).length;

    expect(count('createPublicSocialPost')).toBe(0);
    expect(count('togglePublicSocialLike')).toBe(0);
    expect(count('addPublicSocialComment')).toBe(0);
    expect(count('deletePublicSocialPost')).toBe(0);
    expect(count('getPublicSocialVisiblePosts')).toBe(0);
    expect(publicCount('createPublicSocialPost')).toBe(1);
    expect(publicCount('togglePublicSocialLike')).toBe(1);
    expect(publicCount('addPublicSocialComment')).toBe(1);
    expect(publicCount('deletePublicSocialPost')).toBe(1);
    expect(publicCount('getPublicSocialVisiblePosts')).toBe(1);
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
});
