import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS navigation regressions', () => {
    it('keeps standalone LMS shell refresh separate from global navigate wrapping', () => {
        const lmsHtml = readSource('lms.html');

        expect(lmsHtml).toContain('function refreshStandaloneLmsShellContext(options = {}) {');
        expect(lmsHtml).toContain('window.refreshStandaloneLmsShellContext = refreshStandaloneLmsShellContext;');
        expect(lmsHtml).toContain('refreshLmsFacultyScopedView() {');
        expect(lmsHtml).toContain('refreshStandaloneLmsShellContext({ refreshSubjectDeck: true, forceSubjectDeck: true });');
        expect(lmsHtml).not.toContain('window.navigate = function(pageId) {');
        expect(lmsHtml).not.toContain('window.switchFacultyTheme = function(value) {');
        expect(lmsHtml).not.toContain('function hookLmsNavigationVisualSync() {');
    });

    it('clears stale force-home role-switch state when LMS is the active standalone route', () => {
        const navigationSource = readSource('assets/js/features/navigation.js');
        const utilitiesSource = readSource('assets/js/shared/utilities.js');

        expect(navigationSource).toContain("if (standaloneEntryId && getPortalRouteMode(standaloneEntryId, { hasNavigableSection: false }) === 'standalone') {");
        expect(navigationSource).toContain("localStorage.removeItem('KIU_FORCE_HOME_ON_ROLE_SWITCH');");
        expect(utilitiesSource).toContain('async function refreshLmsUiAfterInPlaceRoleSwitch() {');
        expect(utilitiesSource).toContain("window.__kiuRoleSwitchRedirectPending = false;");
    });

    it('uses the lightweight LMS shell refresh during standalone LMS role or faculty changes', () => {
        const luxurySource = readSource('assets/js/features/index-luxury.js');

        expect(luxurySource).toContain('function isStandaloneLmsRouteActive() {');
        expect(luxurySource).toContain("window.refreshStandaloneDesktopRouteShellContext({ rerender: true, refreshActiveRoute: true });");
        expect(luxurySource).toContain('typeof window.refreshStandaloneDesktopShellChrome === \'function\'');
        expect(luxurySource).not.toContain('function queueShellSync(args, result) {\n        if (result?.navigationSkipped) return;\n        if (window.__kiuRoleSwitchRedirectPending || window.__kiuFacultySwitchRedirectPending) return;\n        if (queuedShellSyncFrame) return;\n        queuedShellSyncFrame = window.requestAnimationFrame(() => {\n            queuedShellSyncFrame = null;\n            if (window.__kiuRoleSwitchRedirectPending || window.__kiuFacultySwitchRedirectPending) return;\n            syncAll();');
    });
});
