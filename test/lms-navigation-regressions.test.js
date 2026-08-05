import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS navigation regressions', () => {
    it('keeps standalone LMS shell refresh separate from global navigate wrapping', () => {
        const lmsHtml = readSource('lms.html');
        const routeBoot = readSource('assets/js/pages/lms-route-boot.js');

        expect(routeBoot).toContain('function refreshStandaloneLmsShellContext(options = {}) {');
        expect(routeBoot).toContain('window.refreshStandaloneLmsShellContext = refreshStandaloneLmsShellContext;');
        expect(routeBoot).not.toContain('refreshLmsFacultyScopedView');
        expect(routeBoot).not.toContain('scrollToLmsSubjects');
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
        const luxurySync = readSource('assets/js/features/luxury-index-sync-runtime.js');
        const luxurySource = readSource('assets/js/features/index-luxury.js');

        expect(luxurySource).toContain('function isStandaloneLmsRouteActive() {');
        expect(luxurySync).toContain('window.refreshStandaloneDesktopRouteShellContext({ rerender: true, refreshActiveRoute: true });');
        expect(luxurySync).toContain('typeof window.refreshStandaloneDesktopShellChrome === \'function\'');
    });

    it('switches LMS tabs immediately instead of blocking on lazy runtime preload', () => {
        const boot = readSource('assets/js/pages/lms-route-boot.js');
        expect(boot).toMatch(/data-lms-tab[\s\S]*switchLMSTab\(tabId\)/);
        expect(boot).not.toMatch(/await ensureLmsExtendedRuntimeForTab\(tabId\);\s*\n\s*if \(typeof window\.switchLMSTab/);
        expect(boot).toContain('[data-lms-tab-loading]');
    });

    it('keeps standalone LMS course and tab state per browser tab across refreshes', () => {
        const boot = readSource('assets/js/pages/lms-route-boot.js');
        const tabsShell = readSource('assets/js/pages/lms-classroom-tabs-shell-runtime.js');
        const tabs = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        const sectionRuntime = readSource('assets/js/pages/lms-section-quiz-runtime.js');
        const messenger = readSource('assets/js/shared/messenger.js');
        const faculty = readSource('assets/js/shared/faculty.js');
        expect(boot).toContain("const LMS_STANDALONE_VIEW_STATE_KEY = 'KIU_LMS_STANDALONE_VIEW_STATE';");
        expect(boot).toContain('sessionStorage.setItem(LMS_STANDALONE_VIEW_STATE_KEY');
        expect(boot).toContain('restoreLmsStandaloneViewState');
        expect(tabsShell).toContain('window.persistLmsStandaloneViewState({ tab });');
        expect(tabs).toContain('window.clearLmsStandaloneViewState()');
        expect(sectionRuntime).toContain('window.persistLmsStandaloneViewState({ sectionType: normalized });');
        expect(messenger).toContain("sessionStorage.setItem('KIU_PENDING_LMS_GROUP'");
        expect(faculty).toContain("sessionStorage.setItem('KIU_PENDING_LMS_GROUP'");
        expect(messenger).not.toContain("localStorage.setItem('KIU_PENDING_LMS_GROUP'");
        expect(faculty).not.toContain("localStorage.setItem('KIU_PENDING_LMS_GROUP'");
    });
});
