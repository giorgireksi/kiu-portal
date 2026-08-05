import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function readRegisteredHomeChunk() {
  const plainPath = 'assets/js/features/index-home-dashboard.plain.js';
  if (existsSync(join(process.cwd(), plainPath))) {
    return readSource(plainPath);
  }
  const registrationSource = readSource('assets/js/features/index-home-dashboard.js');
  const match = registrationSource.match(/__kiuRegisterLuxuryHomeChunk\('([^']+)'\)/);

  if (!match) {
    throw new Error('Home dashboard bundle registration payload was not found.');
  }

  return Buffer.from(match[1], 'base64').toString('utf8');
}

describe('faculty switch and scoped visual settings', () => {
  it('sends forced faculty switches back to the role home dashboard', () => {
    const utilities = readSource('assets/js/shared/utilities.js')
      + readSource('assets/js/shared/lux-transparency.js');

    expect(utilities).toContain("localStorage.setItem('KIU_FORCE_HOME_ON_FACULTY_SWITCH', '1')");
    expect(utilities).toContain("resolvePortalRouteUrl('home', activeRole)");
    expect(utilities).toContain('window.location.assign(homeTarget);');
    expect(utilities).not.toContain("const reloadTarget = `${window.location.pathname");
  });

  it('uses role-and-faculty scoped visual settings instead of global theme fallbacks', () => {
    const homeLuxury = readRegisteredHomeChunk();
    const luxury = readSource('assets/js/features/luxury-index-runtime.js')
      + readSource('assets/js/features/luxury-atmosphere-runtime.js');
    const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');

    expect(luxury).toContain('function ensureLuxuryHomeDashboardBundle(options = {}) {');
    expect(homeLuxury).toContain('function getHomeScopeKey(role = getEffectiveRole(), facultyCode = getCurrentFacultyCode())');
    expect(homeLuxury).toContain('const scopedVisuals = entry.visualsByScope?.[scopeKey];');
    expect(homeLuxury).toContain('...(scopedVisuals || entry.visuals || {})');
    expect(luxury).toContain("const stored = String(getDashboardVisuals().themeMode || DEFAULT_HOME_VISUALS.themeMode)");
    expect(luxury).toContain('return sanitizeBackgroundMode(getDashboardVisuals().backgroundMode || DEFAULT_HOME_VISUALS.backgroundMode);');
    expect(homeLuxury).toContain("const stored = visuals?.paletteKey || localStorage.getItem('kiuLuxuryPalette') || localStorage.getItem('kiu-palette');");
    expect(homeLuxury).toContain("if (stored === 'custom' || isBuiltInLuxuryPaletteKey(stored)) return stored;");
    expect(homeLuxury).toContain("return visuals?.paletteKey || 'ocean-teal';");
    expect(shellChrome).toContain('setDashboardVisuals({ surfaceTransparency: String(value) });');
  });

  it('persists glass blur quality through atmosphere and studio chrome', () => {
    const luxury = readSource('assets/js/features/index-luxury.js');
    const atmosphere = readSource('assets/js/features/luxury-atmosphere-runtime.js');
    const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');
    expect(luxury).toContain("glassBlurQuality: 'auto'");
    expect(shellChrome).toContain('id="lux-glass-blur-quality-grid"');
    expect(shellChrome).toContain('setGlassBlurQuality(mode.key, true)');
    expect(atmosphere).toContain('kiuLuxuryGlassBlurQuality');
    expect(atmosphere).toContain('setDashboardVisuals({ glassBlurQuality: nextLevel })');
  });

  it('persists panel color glow strength through atmosphere and studio chrome', () => {
    const luxury = readSource('assets/js/features/index-luxury.js');
    const atmosphere = readSource('assets/js/features/luxury-atmosphere-runtime.js');
    const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');
    const tokens = readSource('assets/css/lux-tokens.css');
    const transparencyModel = readSource('assets/js/features/luxury-transparency-model-runtime.js');
    expect(luxury).toContain('glowStrength: 50');
    expect(shellChrome).toContain('Panel Color Glow');
    expect(shellChrome).toContain('id="lux-glow-strength-slider"');
    expect(shellChrome).toContain("window.setGlowStrength(parseInt(value, 10), false, { live: true })");
    expect(shellChrome).toContain("glowStrengthSlider.addEventListener('change'");
    expect(shellChrome).toContain('window.setGlowStrength(value, true)');
    expect(atmosphere).toContain('function getGlowStrength');
    expect(atmosphere).toContain('function setGlowStrength');
    expect(atmosphere).toContain('kiuLuxuryGlowStrength');
    expect(atmosphere).toContain('setDashboardVisuals({ glowStrength: nextPercent })');
    expect(atmosphere).toContain('if (options?.live) {');
    expect(atmosphere).toContain('return nextPercent;');
    expect(atmosphere).toContain('glowScale = pct / 50');
    expect(transparencyModel).toContain('resolveGlowTokenConfig');
    expect(tokens).toContain('var(--lux-panel-glow, 0.22)');
    expect(tokens).toContain('calc(var(--lux-panel-glow, 0.22) * 0.90)');
  });

  it('lets the resolved visual palette own the shell background colors', () => {
    const utilities = readSource('assets/js/shared/utilities.js')
      + readSource('assets/js/shared/lux-transparency.js');
    const luxury = readSource('assets/js/features/index-luxury.js')
      + readSource('assets/js/features/luxury-index-sync-runtime.js')
      + readSource('assets/js/features/luxury-transparency-model-runtime.js')
      + readSource('assets/js/features/luxury-palette-runtime.js');
    const tokens = readSource('assets/css/lux-tokens.css');
    const index = readSource('index.html');

    expect(tokens).toContain('--lux-panel-alpha: 0.74;');
    expect(tokens).toContain('--lux-canvas-opacity: 0.82;');
    expect(tokens).toContain('--lux-panel-fill-alpha: 0.08;');
    expect(tokens).toContain('--lux-grid-row-height: 28px;');
    expect(luxury).not.toContain('--lux-panel-alpha: 0.74;');
    expect(luxury).not.toContain('--lux-panel-fill-alpha: 0.08;');
    expect(luxury).toContain("window.__kiuBuildLuxuryTransparencyModel = typeof buildLuxuryTransparencyModel === 'function'");
    expect(luxury).toContain("window.buildLuxuryTransparencyModel = typeof buildLuxuryTransparencyModel === 'function'");
    expect(luxury).toContain("window.__kiuQueueLuxuryRefreshOperation = typeof queueLuxuryRefreshOperation === 'function'");
    expect(luxury).toContain("window.__kiuApplyTransparencyPreferenceState = typeof applyLuxuryTransparencyPreferenceState === 'function'");
    expect(luxury).toContain("window.__kiuApplyHighTransparencyState = typeof applyLuxuryHighTransparencyState === 'function'");
    expect(luxury).toContain("styleEl.media = 'all';");
    expect(luxury).toContain("styleEl.textContent = ':root{}';");
    expect(luxury).not.toContain("document.getElementById('lux-high-trans-primer')?.remove();");
    expect(luxury).toContain('window.__kiuApplyResolvedPalette = applyResolvedPalette;');
    expect(luxury).toContain("window.getDashboardVisuals = typeof getDashboardVisuals === 'function'");
    expect(luxury).toContain("window.setDashboardVisuals = typeof setDashboardVisuals === 'function'");
    expect(luxury).toContain("window.applyPaletteKey = typeof applyPaletteKey === 'function'");
    expect(luxury).toContain("window.applyThemeMode = typeof applyThemeMode === 'function'");
    expect(luxury).toContain("window.setBackgroundMode = typeof setBackgroundMode === 'function'");
    expect(luxury).toContain("window.syncAll = typeof syncAll === 'function'");
    expect(luxury).toContain("window.syncVisualStateOnly = typeof syncVisualStateOnly === 'function'");
    expect(utilities).toContain("if (typeof window.__kiuApplyResolvedPalette === 'function') {");
    expect(utilities).toContain('window.__kiuApplyResolvedPalette();');
    expect(utilities).toContain("const hasCanonicalLuxuryPaletteOwner = typeof window.__kiuApplyResolvedPalette === 'function';");
    expect(utilities).toContain('if (!hasCanonicalLuxuryPaletteOwner) {');
    expect(utilities).toContain("if (typeof window.__kiuApplyHighTransparencyState === 'function') {");
    expect(utilities).toContain("window.__kiuApplyHighTransparencyState(true, highTransparencyCss);");
    expect(utilities).toContain("window.__kiuApplyHighTransparencyState(false);");
    expect(utilities).toContain("primerStyle.media = 'all';");
    expect(utilities).toContain("primerStyle.textContent = ':root{}';");
    expect(utilities).not.toContain('if (primerStyle) primerStyle.remove();');
    expect(utilities).toContain("if (typeof window.__kiuBuildLuxuryTransparencyModel === 'function') {");
    expect(utilities).toContain('return window.__kiuBuildLuxuryTransparencyModel(value, lightMode);');
    expect(utilities).toContain("if (typeof window.__kiuQueueLuxuryRefreshOperation === 'function') {");
    expect(utilities).toContain('window.__kiuQueueLuxuryRefreshOperation(run);');
    expect(utilities).toContain("if (typeof window.__kiuApplyTransparencyPreferenceState === 'function') {");
    expect(utilities).toContain("window.__kiuApplyTransparencyPreferenceState(percentage, transparencyModel.transparencyRatio);");
    expect(utilities).toContain("root.style.setProperty('--lux-transparency-alpha', transparencyModel.fillRatio.toFixed(3));");
    expect(utilities).not.toContain("document.documentElement.style.setProperty('--lux-transparency-alpha', surfaceFillAmount.toFixed(3));");
    expect(utilities).toContain("root.style.setProperty('--kiu-shell-gradient', shellGradient);");
    expect(utilities).toContain("root.style.setProperty('--kiu-gradient-blue', `linear-gradient(135deg, ${primary} 0%, ${nav} 100%)`);");
    expect(index).toContain('assets/js/features/index-luxury.js?v=20260730-echancellery1');
    expect(index).toContain('assets/js/features/index-home-dashboard.js?v=20260725-panelrevert1');
    expect(index).toContain('assets/js/shared/utilities.js?v=20260725-portalmodal1');
  });
});
