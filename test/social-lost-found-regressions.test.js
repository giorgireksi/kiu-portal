import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readAsset(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf-8');
}

function countOccurrences(source, fragment) {
    return source.split(fragment).length - 1;
}

describe('Social Lost & Found regressions', () => {
    it('keeps the new collection in every social state bootstrap path', () => {
        const stateJs = readAsset('assets/js/app/state.js');
        const initialStateJs = readAsset('assets/js/data/initial-state.js');
        const socialRuntimeJs = readAsset('assets/js/shared/social-runtime-lite.js');

        expect(stateJs).toContain('lostFoundItems');
        expect(stateJs).not.toContain('lostFoundComposerOpen');
        expect(initialStateJs).toContain('lostFoundItems');
        expect(socialRuntimeJs).toContain('lostFoundItems');
        expect(socialRuntimeJs).not.toContain('lostFoundScope');
    });

    it('exposes the Lost & Found panel in the social shell and mobile shell', () => {
        const socialPageJs = readAsset('assets/js/pages/social-page.js');
        const communityModuleJs = readAsset('assets/js/pages/social-community.js');
        const lostFoundModuleJs = readAsset('assets/js/pages/social-lost-found.js');
        const alertsModuleJs = readAsset('assets/js/pages/social-alerts.js');
        const messagesModuleJs = readAsset('assets/js/pages/social-messages.js');
        const profileModuleJs = readAsset('assets/js/pages/social-profile.js');
        const socialMobileJs = readAsset('assets/js/pages/social-mobile.js');
        const appJs = readAsset('assets/js/app/app.js');
        const socialHtml = readAsset('social.html');

        expect(socialPageJs).toContain("const SOCIAL_COMMUNITY_MODULE_URL = 'assets/js/pages/social-community.js?v=20260714-community-click1';");
        expect(socialPageJs).toContain("const SOCIAL_LOST_FOUND_MODULE_URL = 'assets/js/pages/social-lost-found.js?v=20260714-lf-click1';");
        expect(socialPageJs).toContain("const SOCIAL_ALERTS_MODULE_URL = 'assets/js/pages/social-alerts.js?v=20260714-alerts-click1';");
        expect(socialPageJs).toContain("const SOCIAL_MESSAGES_MODULE_URL = 'assets/js/pages/social-messages.js?v=20260714-messages-click1';");
        expect(socialPageJs).toContain("const SOCIAL_PROFILE_MODULE_URL = 'assets/js/pages/social-profile.js?v=20260714-profile-click1';");
        expect(socialPageJs).toContain('function ensureSocialCommunityModule()');
        expect(socialPageJs).toContain('function ensureSocialLostFoundModule()');
        expect(socialPageJs).toContain('function ensureSocialAlertsModule()');
        expect(socialPageJs).toContain('function ensureSocialMessagesModule()');
        expect(socialPageJs).toContain('function ensureSocialProfileModule()');
        expect(socialPageJs).not.toContain('â€”');
        expect(socialPageJs).not.toContain('â€¢');
        expect(socialPageJs).not.toContain('â€¦');
        expect(socialPageJs).toContain('window.__kiuSocialCommunityHooks');
        expect(socialPageJs).toContain('window.__kiuSocialMessagesHooks');
        expect(socialPageJs).toContain('window.__kiuSocialProfileHooks');
        expect(socialPageJs).toContain('function ensureSocialShell(host) {');
        expect(socialPageJs).toContain('function setSocialRegionMarkup(node, markup) {');
        expect(socialPageJs).toContain("id=\"social-neo-root\"");
        expect(socialPageJs).not.toContain('host.innerHTML = markup;');
        expect(socialPageJs).toContain('lost-and-found');
        expect(socialPageJs).toContain('panel-lost-found');
        expect(communityModuleJs).toContain('renderCommunityHero(runtime, activeCommunityTab, communityStats, activeBody');
        expect(communityModuleJs).not.toContain('renderDirectorySection');
        expect(socialPageJs).toContain('is-merged');
        expect(socialPageJs).toContain('social-neo-community-hero-divider');
        expect(communityModuleJs).not.toContain('directory-study-chat');
        expect(communityModuleJs).not.toContain('person-mention');
        expect(communityModuleJs).toContain('person-group-invite');
        expect(communityModuleJs).toContain("items.join(' / ')");
        expect(socialPageJs).not.toContain('name="lostFoundFaculty"');
        expect(socialPageJs).not.toContain('name="lostFoundKind"');
        expect(socialPageJs).not.toContain('name="lostFoundScope"');
        expect((socialPageJs + lostFoundModuleJs)).toContain('lost-found-create-open');
        expect(lostFoundModuleJs).toContain('lost-found-delete');
        expect(lostFoundModuleJs).toContain('lost-found-mark-found');
        expect(lostFoundModuleJs).toContain('function renderLostFoundHero');
        expect(lostFoundModuleJs).toContain('social-neo-lost-found-hero');
        expect(lostFoundModuleJs).toContain('social-neo-lost-found-hero-divider');
        expect(lostFoundModuleJs).toContain('is-merged');
        expect(lostFoundModuleJs).toContain('window.renderLostFoundHero = renderLostFoundHero');
        expect(lostFoundModuleJs).toContain('social-neo-lost-found-shell');
        expect(lostFoundModuleJs).toContain('bodyHtml: listingsBody');
        expect(socialPageJs).toMatch(/\$\{escape\(family\)\}-stat/);
        expect(socialPageJs).toContain('is-merged');
        expect(lostFoundModuleJs).not.toContain('<section class="social-neo-stack social-neo-lf-listings">');
        expect(alertsModuleJs).toContain('Moderation queue');
        expect(alertsModuleJs).toContain('notification-mark-read');
        expect(alertsModuleJs).toContain('notification-follow');
        expect(alertsModuleJs).toContain('report-resolve');
        expect(messagesModuleJs).toContain('window.renderMessagesPanel = function renderMessagesPanel()');
        expect((socialPageJs + readAsset('assets/js/pages/social-groups.js'))).toContain('group-thread-search-open');
        expect(messagesModuleJs).toContain('group-call-join');
        expect(profileModuleJs).toContain('window.renderSocialProfilePanel = renderProfilePageBody;');
        expect(profileModuleJs).toContain('Edit Profile');
        expect(socialMobileJs).toContain('lost-and-found');
        expect(socialHtml).toContain('social-runtime-lite.js?v=20260713-post-compose1');
        expect(socialHtml).toContain('assets/js/pages/social-page.js?v=20260713-groups-detail9');
        expect(socialPageJs).toContain('window.__KIU_SOCIAL_PAGE_REBUILT');
        expect(socialMobileJs).toContain('window.__KIU_SOCIAL_MOBILE_SHELL_INIT');
        expect(socialHtml).not.toContain('assets/js/app/app.js?v=20260430-portfoliolux1');
        expect(socialHtml).toContain('mob-nav-lost-found');
        expect(socialHtml).toContain('assets/js/features/ui.js');
        expect(socialHtml).not.toContain('assets/js/pages/social-community.js');
        expect(socialHtml).not.toContain('assets/js/pages/social-lost-found.js');
        expect(socialHtml).not.toContain('assets/js/pages/social-alerts.js');
        expect(socialHtml).not.toContain('assets/js/pages/social-profile.js');
        expect(socialHtml).toContain('id="social-neo-workspace-nav-region"');
        expect(socialHtml).not.toContain('id="social-loading-placeholder"');
        expect(socialHtml).toContain('id="social-neo-root"');
        expect(socialHtml).toContain('id="social-neo-center-region"');
        expect(socialHtml).toContain('id="app-content"');
        expect(socialHtml).toContain('Preparing campus social');
        expect(socialHtml).not.toContain('style="opacity: 0; transition: opacity 0.3s ease;"');
    });

    it('keeps the portfolio showcase wired into the social panel and mobile shortcuts', () => {
        const socialPageJs = readAsset('assets/js/pages/social-page.js');
        const socialMobileJs = readAsset('assets/js/pages/social-mobile.js');
        const runtimeJs = readAsset('assets/js/shared/social-runtime-lite.js');
        const storeJs = readAsset('backend/platform/store.js');

        const workspaceModule = readAsset('assets/js/pages/social-workspace.js');
        expect(workspaceModule).toContain('Build my portfolio');
        expect((socialPageJs + workspaceModule)).toContain('portfolio-contact');
        expect((socialPageJs + workspaceModule)).toContain('projectVisibleFacultyCodesRaw');
        expect(socialPageJs).toContain('renderPortfolioProfileBlock');
        expect(socialMobileJs).toContain('Portfolio');
        expect(runtimeJs).toContain('projectDiscoverSearch');
        expect(runtimeJs).toContain('deletePortalSocialProject');
        // Project visibility helpers live in social-projects-service after domain split.
        const projectsService = readAsset('backend/platform/domains/social-projects-service.js');
        expect(projectsService).toContain('normalizeProjectVisibilityMode');
        expect(projectsService).toContain('deleteSocialProject');
        expect(storeJs).toContain('deleteSocialProject');
    });

    it('keeps only one canonical top-level panel renderer per duplicated social desktop surface', () => {
        const socialPageJs = readAsset('assets/js/pages/social-page.js');

        expect(countOccurrences(socialPageJs, 'function renderProjectsPanel()')).toBe(1);
        expect(countOccurrences(socialPageJs, 'function renderGroupsPanel()')).toBe(1);
        expect(countOccurrences(socialPageJs, 'function renderPagesPanel()')).toBe(1);
        expect(countOccurrences(socialPageJs, 'function renderEventsPanel()')).toBe(1);
        expect(countOccurrences(socialPageJs, 'function renderAlertsPanel()')).toBe(1);
        expect(socialPageJs).toContain('function renderProjectsWorkspacePanelClassic()');
    });

    it('adds efficient-tier surface fallbacks for the heavy social route chrome', () => {
        const socialCss = readAsset('assets/css/social-rebuild.css');

        expect(socialCss).toContain("body[data-lux-performance='efficient'].lux-route-social {");
        expect(socialCss).toContain("body[data-lux-performance='efficient'].lux-route-social .social-neo-topbar-card,");
        expect(socialCss).toContain("body[data-lux-performance='efficient'].lux-route-social .social-neo-dialog-card,");
        expect(socialCss).toContain("body[data-lux-performance='efficient'].lux-route-social .mob-sheet-panel {");
        expect(socialCss).toContain("body[data-lux-performance='efficient'].lux-route-social .mob-sheet-backdrop {");
        expect(socialCss).toContain("body[data-lux-performance='efficient'].lux-light-mode.lux-route-social .social-neo-topbar-card,");
        expect(socialCss).toContain('--sn-blur: 8px;');
        expect(socialCss).toContain('backdrop-filter: blur(2px) !important;');
    });

    it('keeps the social mobile quick navigation aligned with allowed live routes', () => {
        const socialMobileJs = readAsset('assets/js/pages/social-mobile.js');
        const stateJs = readAsset('assets/js/app/state.js');
        const navigationJs = readAsset('assets/js/features/navigation.js');

        expect(socialMobileJs).not.toContain("['email', 'Email', 'fas fa-envelope']");
        expect(socialMobileJs).toContain("['news', 'News', 'fas fa-newspaper']");
        expect(stateJs).not.toContain("'email'");
        expect(navigationJs).toContain("'news': 'news.html'");
        expect(navigationJs).toContain("if (PORTAL_STANDALONE_ROUTE_IDS.has(normalizedPageId)) return 'standalone';");
    });

    it('keeps lost-found item mutations in the render signature and force-render allowlist', () => {
        const socialPageJs = readAsset('assets/js/pages/social-page.js');
        const lostFoundModuleJs = readAsset('assets/js/pages/social-lost-found.js');

        expect(socialPageJs).toContain('function buildLostFoundFingerprint(runtime)');
        expect(socialPageJs).toContain('buildLostFoundFingerprint(runtime)');
        expect(socialPageJs).toContain('function lostFoundActiveCount()');
        expect(socialPageJs).toContain('function lostFoundRecoveredCount()');
        expect(socialPageJs).toContain('lost-found-delete|lost-found-mark-found|lost-found-save');
        expect(socialPageJs).toContain('lost-found-created|lost-found-updated|lost-found-deleted|lost-found-marked-found');
        expect((socialPageJs + lostFoundModuleJs)).toContain("renderSocialPageNow('lost-found-delete')");
        expect((socialPageJs + lostFoundModuleJs)).toContain("renderSocialPageNow('lost-found-mark-found')");
        expect((socialPageJs + lostFoundModuleJs)).toContain("renderSocialPageNow('lost-found-save')");
        expect(socialPageJs).not.toContain('lost-found-filter');
        expect(socialPageJs).not.toContain('data-lost-found-filter');
        expect(lostFoundModuleJs).toContain('function renderLostFoundActionConfirmDialog(kind, item)');
        expect(lostFoundModuleJs).toContain('confirmLostFoundDelete');
        expect(lostFoundModuleJs).toContain('confirmLostFoundMarkFound');
        expect((socialPageJs + lostFoundModuleJs)).toContain("'dialog-lost-found-delete'");
        expect((socialPageJs + lostFoundModuleJs)).toContain("'dialog-lost-found-mark-found'");
        expect((socialPageJs + lostFoundModuleJs)).toContain("openDialog('lost-found-delete', { itemId })");
        expect((socialPageJs + lostFoundModuleJs)).toContain("openDialog('lost-found-mark-found', { itemId })");
    });
    it('retires half-built stories UI (no dead-end story product surface)', () => {
        const socialPageJs = readAsset('assets/js/pages/social-page.js');
        const runtimeJs = readAsset('assets/js/shared/social-runtime-lite.js');

        expect(socialPageJs).toContain("function renderStoryViewer() {");
        expect(socialPageJs).toContain("function renderStoryComposer() {");
        expect(socialPageJs).not.toContain('data-action="story-add"');
        expect(socialPageJs).not.toContain('Your Story');
        expect(runtimeJs).toContain("throw new Error('Stories are not available.')");
    });

});
