import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('standalone desktop route bootstrap', () => {
  it('defines a shared standalone desktop route bootstrap contract in navigation', () => {
    const navigation = readSource('assets/js/features/navigation.js');

    expect(navigation).toContain('function bootStandaloneDesktopRoute(config = {}) {');
    expect(navigation).toContain('function refreshStandaloneDesktopShellChrome(options = {}) {');
    expect(navigation).toContain('function refreshStandaloneDesktopRouteContent(pageId, options = {}) {');
    expect(navigation).toContain('function autoBootStandaloneDesktopRoute() {');
    expect(navigation).toContain('function applyStandaloneDesktopRouteVisualState(config = {}) {');
    expect(navigation).toContain('const fallbackTimer = window.setTimeout(run, 48);');
    expect(navigation).toContain("window.requestIdleCallback(() => {");
    expect(navigation).toContain('window.clearTimeout(fallbackTimer);');
    expect(navigation).toContain('window.bootStandaloneDesktopRoute = bootStandaloneDesktopRoute;');
    expect(navigation).toContain('window.refreshStandaloneDesktopShellChrome = refreshStandaloneDesktopShellChrome;');
  });

  it('removes desktop page-local navigate ownership and uses the shared bootstrap', () => {
    const programs = readSource('programs.html');
    const social = readSource('social.html');
    const pages = [
      'news.html',
      'library.html',
      'orders.html',
      'student-service.html',
      'programs.html',
      'chancellery.html',
      'timetable.html',
      'staff.html',
      'students-admin.html',
      'admin-tools.html'
    ].map(readSource);

    expect(programs).not.toContain('window.navigate = function(pageId) {');
    expect(programs).not.toContain('function hookProgramsNavigationVisualSync()');
    expect(social).not.toContain('window.navigate = window.navigate || function navigate(pageId) {');
    pages.forEach((source) => {
      expect(source).toContain('bootStandaloneDesktopRoute');
    });
  });

  it('routes standalone desktop shell refreshes through the shared helper instead of syncAll by default', () => {
    const luxury = readSource('assets/js/features/index-luxury.js');

    expect(luxury).toContain("window.refreshStandaloneDesktopRouteShellContext({ rerender: true, refreshActiveRoute: true });");
    expect(luxury).toContain("window.refreshStandaloneDesktopShellChrome()");
  });
});
