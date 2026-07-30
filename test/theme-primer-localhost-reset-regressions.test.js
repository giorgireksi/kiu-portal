import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { JSDOM } from 'jsdom';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('theme primer localhost reset regressions', () => {
  it('contains the localhost stale-service-worker recovery path', () => {
    const source = readSource('assets/js/theme-primer.js');

    expect(source).toContain("var PORTAL_CACHE_RESET_VERSION = '20260609-bootguard1';");
    expect(source).toContain('function maybeResetStaleLocalPortalWorker() {');
    expect(source).toContain('if (!navigator.serviceWorker || !navigator.serviceWorker.controller) return;');
    expect(source).toContain("var resetMarker = 'KIU_PORTAL_LOCAL_SW_RESET_' + PORTAL_CACHE_RESET_VERSION;");
    expect(source).toContain("String(key || '').indexOf('kiu-portal-shell-') === 0");
    expect(source).toContain('window.location.reload();');
    // Do not preload a hardcoded navigation.js bust — page script tags use different ?v= values.
    expect(source).not.toContain('preloadSharedShellRuntime');
    expect(source).not.toContain('assets/js/features/navigation.js?v=20260609-bootguard1');
  });

  it('marks the new cache reset version in the app bootstrap and service worker', () => {
    const appSource = readSource('assets/js/app/app.js');
    const workerSource = readSource('service-worker.js');

    // Versions drift with shell diets — assert live SW stack, not a frozen bust string.
    expect(appSource).toMatch(/const PORTAL_CACHE_RESET_VERSION = '20\d{6}-[^']+'/);
    expect(appSource).toContain("manifest.webmanifest?v=");
    expect(workerSource).toMatch(/const CACHE_NAME = 'kiu-portal-shell-v/);
    expect(workerSource).not.toContain('/assets/css/base.css');
    expect(workerSource).toContain('/assets/css/lux-tokens.css');
    expect(workerSource).not.toContain('/assets/css/index-luxury.css');
    expect(workerSource).toContain('/assets/css/lux-fouc-ht.css');
    expect(workerSource).toContain('/assets/css/index-home-layout.css');
    expect(workerSource).toContain('/assets/css/index-home-widgets.css');
    expect(workerSource).toContain('/assets/css/index-home-role.css');
    expect(workerSource).not.toContain('/assets/css/mobile-responsive.css');
    expect(workerSource).toContain('/assets/css/mobile-shell-core.css');
    expect(workerSource).toContain('/assets/css/mobile-shell.css');
    expect(workerSource).toContain('/assets/js/theme-primer.js');
    expect(workerSource).toContain('/assets/js/features/navigation.js');
  });
});
