import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social mobile runtime regressions', () => {
  it('uses runtime events instead of polling for mobile nav readiness', () => {
    const source = readSource('assets/js/pages/social-mobile.js');

    expect(source).toContain("const SOCIAL_RUNTIME_EVENT = 'kiu:social-runtime-update';");
    expect(source).toContain('window.addEventListener(SOCIAL_RUNTIME_EVENT, handleSocialRuntimeEvent);');
    expect(source).toContain("window.addEventListener('load', ensureNavigateHooks, { once: true });");
    expect(source).toContain("if (typeof window.resolvePortalRouteUrl === 'function') {");
    expect(source).not.toContain('setInterval(');
    expect(source).not.toContain('waitForNavigate');
  });

  it('forces a rerender when deferred social panel modules finish loading', () => {
    const source = readSource('assets/js/pages/social-page.js');

    expect(source).toContain("function queueDeferredModuleRender(reason) {");
    expect(source).toContain("if (host) host.__kiuLastRenderSignature = '';");
    expect(source).toContain("ensureSocialMessagesModule().then(() => queueDeferredModuleRender('messages-module')).catch(() => null);");
    expect(source).toContain("if (reason !== 'boot' && !/-module$/.test(reason) && host.__kiuLastRenderSignature === renderSignature) {");
  });
});
