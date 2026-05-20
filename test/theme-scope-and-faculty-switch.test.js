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

describe('faculty switch and scoped visual settings', () => {
  it('sends forced faculty switches back to the role home dashboard', () => {
    const utilities = readSource('assets/js/shared/utilities.js');

    expect(utilities).toContain("localStorage.setItem('KIU_FORCE_HOME_ON_FACULTY_SWITCH', '1')");
    expect(utilities).toContain("resolvePortalRouteUrl('home', activeRole)");
    expect(utilities).toContain('window.location.assign(homeTarget);');
    expect(utilities).not.toContain("const reloadTarget = `${window.location.pathname");
  });

  it('uses role-and-faculty scoped visual settings instead of global theme fallbacks', () => {
    const homeLuxury = readRegisteredHomeChunk();
    const luxury = readSource('assets/js/features/index-luxury.js');
    const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');

    expect(luxury).toContain('function ensureLuxuryHomeDashboardBundle() {');
    expect(homeLuxury).toContain('function getHomeScopeKey(role = getEffectiveRole(), facultyCode = getCurrentFacultyCode())');
    expect(homeLuxury).toContain('const scopedVisuals = entry.visualsByScope?.[scopeKey];');
    expect(homeLuxury).toContain('...(scopedVisuals || entry.visuals || {})');
    expect(luxury).toContain("const stored = String(getDashboardVisuals().themeMode || DEFAULT_HOME_VISUALS.themeMode)");
    expect(luxury).toContain('return sanitizeBackgroundMode(getDashboardVisuals().backgroundMode || DEFAULT_HOME_VISUALS.backgroundMode);');
    expect(homeLuxury).toContain("const stored = visuals?.paletteKey || localStorage.getItem('kiuLuxuryPalette') || localStorage.getItem('kiu-palette');");
    expect(homeLuxury).toContain("if (stored === 'custom' || isBuiltInLuxuryPaletteKey(stored)) return stored;");
    expect(homeLuxury).toContain("return visuals?.paletteKey || 'obsidian-amber';");
    expect(shellChrome).toContain('setDashboardVisuals({ surfaceTransparency: String(value) });');
  });

  it('lets the resolved visual palette own the shell background colors', () => {
    const utilities = readSource('assets/js/shared/utilities.js');
    const index = readSource('index.html');

    expect(utilities).toContain("root.style.setProperty('--kiu-shell-gradient', shellGradient);");
    expect(utilities).toContain("root.style.setProperty('--kiu-gradient-blue', `linear-gradient(135deg, ${primary} 0%, ${nav} 100%)`);");
    expect(index).toContain('assets/js/features/index-luxury.js?v=20260504-transparency-refresh1');
    expect(index).toContain('assets/js/features/index-home-dashboard.js?v=20260517-homejssplit1');
    expect(index).toContain('assets/js/shared/utilities.js?v=20260504-dashboard-fade2');
  });
});
