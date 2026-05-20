import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('admin impersonation regressions', () => {
  it('preserves the authenticated account snapshot during external navigation', () => {
    const navigationSource = readSource('assets/js/features/navigation.js');
    expect(navigationSource).toContain('const authenticatedUser = currentUser');
    expect(navigationSource).toContain("typeof getStoredAuthState === 'function' ? getStoredAuthState() : null");
    expect(navigationSource).toContain('role: authenticatedUser.role');
    expect(navigationSource).not.toContain("const activeUser = (typeof getCurrentUser === 'function' ? getCurrentUser() : null) || currentUser || null;");
  });

  it('repairs corrupted admin impersonation snapshots when a backend session exists', () => {
    const authSource = readSource('assets/js/app/auth.js');
    expect(authSource).toContain('function hasCorruptedAdminImpersonationSnapshot()');
    expect(authSource).toContain('hasCorruptedAdminImpersonationSnapshot()');
    expect(authSource).toContain('storePortalBackendAuth(payload.account, payload.session);');
  });

  it('uses resolved standalone routes during shell sync instead of only active-page sections', () => {
    const shellSource = readSource('assets/js/features/index-luxury.js');
    expect(shellSource).toContain('function syncLayout()');
    expect(shellSource).toContain('function syncAll()');
    expect(shellSource).toContain('const activePageId = getActivePageId();');
    expect(shellSource).not.toContain("const activePageId = document.querySelector('.page-section.active-page')?.id?.replace(/^page-/, '') || '';");
  });

  it('tries to recover admin role switching when the local auth snapshot was downgraded', () => {
    const utilitiesSource = readSource('assets/js/shared/utilities.js');
    expect(utilitiesSource).toContain('const canRepairAdminSnapshot = Boolean(');
    expect(utilitiesSource).toContain('fetchPortalBackendSession()');
    expect(utilitiesSource).toContain('storePortalBackendAuth(payload.account, payload.session);');
  });
});
