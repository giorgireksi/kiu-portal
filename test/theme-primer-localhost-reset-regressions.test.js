import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { JSDOM } from 'jsdom';

function readSource(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('theme primer localhost reset regressions', () => {
  it('contains the localhost stale-service-worker recovery path', () => {
    const source = readSource('assets/js/theme-primer.js');

    expect(source).toContain("var PORTAL_CACHE_RESET_VERSION = '20260606-postactions6';");
    expect(source).toContain('function maybeResetStaleLocalPortalWorker() {');
    expect(source).toContain('if (!navigator.serviceWorker || !navigator.serviceWorker.controller) return;');
    expect(source).toContain("var resetMarker = 'KIU_PORTAL_LOCAL_SW_RESET_' + PORTAL_CACHE_RESET_VERSION;");
    expect(source).toContain("String(key || '').indexOf('kiu-portal-shell-') === 0");
    expect(source).toContain('window.location.reload();');
  });

  it('marks the new cache reset version in the app bootstrap and service worker', () => {
    const appSource = readSource('assets/js/app/app.js');
    const workerSource = readSource('service-worker.js');

    expect(appSource).toContain("const PORTAL_CACHE_RESET_VERSION = '20260606-postactions6';");
    expect(appSource).toContain("manifest.webmanifest?v=20260604-styleguard2");
    expect(workerSource).toContain("const CACHE_NAME = 'kiu-portal-shell-v20260606-postactions6';");
    expect(workerSource).toContain("/assets/css/base.css?v=20260604-styleguard2");
    expect(workerSource).toContain("/assets/css/index-luxury.css?v=20260604-styleguard2");
  });
});
