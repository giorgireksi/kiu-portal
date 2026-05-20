import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('app navigation fallback regressions', () => {
  it('installs an early navigate fallback before navigation.js boot completes', () => {
    const source = readSource('assets/js/app/app.js');

    expect(source).toContain('function getFallbackNavigationRole() {');
    expect(source).toContain('function resolveFallbackPortalRouteUrl(pageId, role = getFallbackNavigationRole()) {');
    expect(source).toContain('function getFallbackRoutePageFromTrigger(trigger) {');
    expect(source).toContain('function performFallbackRouteNavigation(pageId) {');
    expect(source).toContain("if (trigger.id === 'mob-act-profile') return 'profile-view';");
    expect(source).toContain("if (trigger.hasAttribute('data-admin-focus')) return 'admin-tools';");
    expect(source).toContain("if (typeof window.__kiuCoreNavigate === 'function') {");
    expect(source).toContain('window.__kiuCoreNavigate(targetPage);');
    expect(source).toContain("if (typeof window.resolvePortalRouteUrl !== 'function') {");
    expect(source).toContain("if (typeof window.navigate !== 'function') {");
    expect(source).toContain('const earlyNavigateFallback = function earlyNavigateFallback(pageId) {');
    expect(source).toContain('earlyNavigateFallback.__kiuEarlyNavigateFallback = true;');
    expect(source).toContain('window.navigate = earlyNavigateFallback;');
    expect(source).toContain("window.__kiuRouteClickRescueInstalled");
    expect(source).toContain("document.addEventListener('click', function rescueRouteClick(event) {");
    expect(source).toContain(`target.closest('#mob-act-profile,[data-nav-target],[data-route-page],[data-registration-nav],[data-student-service-navigate],[data-admin-focus],[data-nav-orders],[data-nav-social],[data-nav-exams],[onclick*="navigate("]')`);
    expect(source).toContain("performFallbackRouteNavigation(targetPage);");
    expect(source).toContain("'profile-view': 'profile-view.html'");
    expect(source).toContain("'student-service': 'student-service.html'");
    expect(source).toContain("if (normalizedPageId === 'home') {");
    expect(source).toContain("return `index.html?view=${encodeURIComponent(normalizedRole)}#home`;");
  });

  it('publishes the real navigate runtime so legacy mobile wrappers can rebind to it', () => {
    const source = readSource('assets/js/features/navigation.js');

    expect(source).toContain('window.__kiuCoreNavigate = navigate;');
    expect(source).toContain('window.navigate = navigate;');
    expect(source).toContain('window.__mobileNavHooked = false;');
    expect(source).toContain("window.dispatchEvent(new Event('kiu:navigate-runtime-ready'));");
  });
});
