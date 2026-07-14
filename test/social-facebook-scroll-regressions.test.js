import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social facebook scroll regressions', () => {
    it('locks desktop chrome and scrolls only the center column', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const css = readSource('assets/css/social-rebuild.css');
        const lmsCss = readSource('assets/css/social-projects-lms.css');
        const surveysCss = readSource('assets/css/social-surveys-lms.css');
        const html = readSource('social.html');
        const luxuryRuntimeSource = readSource('assets/js/features/luxury-index-runtime.js');

        expect(source).toContain('function syncSocialScrollLayout(');
        expect(source).toContain('function updateSocialMeasuredChrome(');
        expect(source).toContain('function syncSocialVisualViewport(');
        expect(source).toContain('function ensureSocialCenterScrollBounds(');
        expect(source).toContain('function getSocialCenterContentScrollHeight(');
        expect(source).toContain('function getSocialCenterScrollBudget(');
        expect(source).toContain('function scheduleSocialCenterScrollRepair(');
        expect(source).toContain('function bindSocialLayoutObserver(');
        expect(source).toContain('function bindSocialCenterWheelForward(');
        expect(source).toContain('function isSocialMessagesPanel(');
        expect(source).toContain('function centerCanScroll(');
        expect(source).toContain('function clearSocialCenterScrollBounds(');
        expect(source).toContain('socialCenterWheelForwardBound');
        expect(source).toContain('socialCenterScrollStableFrames');
        expect(source).toContain('getBoundingClientRect().height');
        expect(source).toContain('.social-neo-community-card');
        expect(source).toContain('.social-project-detail-hero');
        expect(source).toContain('function socialInnerScrollerCanAbsorbWheel');
        expect(source).toContain('function measureSocialCenterBottom');
        expect(source).toContain('function getSocialCenterContentExtent');
        expect(source).toContain('function getSocialCenterMaxScroll');
        expect(source).toContain('function getSocialCenterViewportHeight');
        expect(source).toContain('[class$="-listings"]');
        expect(source).toContain('[class$="-hub-section"]');
        expect(source).toContain('mergedExtent');
        expect(source).toContain('leafExtent');
        expect(source).toContain('contentBottom');
        expect(source).toContain('mergedOverflowHero');
        expect(source).toContain('nativeScrollRoom');
        expect(source).toContain('function applySocialCenterWheel');
        expect(source).toContain('function socialCenterHasLiveScrollRoom');
        expect(source).toContain('function refreshSocialCenterWheelScroll');
        expect(source).toContain('getBoundingClientRect().top');
        expect(source).toContain('[class$="-shell"]');
        expect(source).toContain('.social-neo-event-feature');
        expect(source).toContain('.social-photo-grid-tile');
        expect(source).toContain('.social-neo-surveys-hero');
        expect(source).not.toContain('function isSocialProjectOverviewWheelTarget');
        expect(source).not.toContain('function getSocialProjectContentExtent');
        expect(source).not.toContain('function socialCenterHasProjectScrollShell');
        expect(source).not.toContain('keepProjectBounds');
        const wheelFn = source.match(/function bindSocialCenterWheelForward[\s\S]*?\n    \}/)?.[0] || '';
        const boundsFn = source.match(/function ensureSocialCenterScrollBounds[\s\S]*?\n    \}/)?.[0] || '';
        expect(wheelFn).toContain('applySocialCenterWheel(center, shell, host, event.deltaY)');
        expect(wheelFn).toContain('socialInnerScrollerCanAbsorbWheel(innerScroller, event.deltaY)');
        expect(wheelFn).toContain('.lux-scroll-rail__viewport');
        expect(wheelFn).toContain('.social-neo-event-feature-desc-viewport');
        expect(wheelFn).not.toContain('isSocialProjectOverviewWheelTarget');
        const maxScrollFn = source.match(/function getSocialCenterMaxScroll[\s\S]*?\n    \}/)?.[0] || '';
        expect(maxScrollFn).toContain('getSocialCenterViewportHeight');
        expect(maxScrollFn).toContain('getSocialCenterScrollBudget');
        expect(maxScrollFn).toContain('contentH - scrollBudget');
        const workspaceModule = readSource('assets/js/pages/social-workspace.js');
        const workspaceHeroFn = workspaceModule.match(/function renderWorkspaceHero[\s\S]*?\n    \}/)?.[0] || '';
        // Workspace hub always merges sectionsHtml into the hero (no is-merged toggle).
        expect(workspaceHeroFn).toContain('social-neo-workspace-hero');
        expect(workspaceHeroFn).toContain('metrics.sectionsHtml');
        expect(boundsFn).not.toContain('keepProjectBounds');
        // asd10 + asd8 feature delta: scroll-lock chrome + project overview overflow
        expect(lmsCss).toMatch(/social-neo-scroll-lock[\s\S]*\.social-project-overview-slot__scroll[\s\S]*max-height: none !important[\s\S]*overflow: visible !important/);
        expect(lmsCss).toMatch(/social-neo-scroll-lock[\s\S]*overscroll-behavior: auto !important/);
        expect(lmsCss).toContain('.social-project-graph-preview-scroll');
        expect(css).toContain('.social-neo-feed-shell');
        expect(css).toContain('.social-neo-workspace-hero');
        expect(css).toContain('.social-project-detail-hero');
        expect(css).toContain('.social-neo-event-feature');
        expect(css).toContain('social-neo-scroll-lock');
        expect(css).toContain('--social-measured-chrome');
        expect(css).toMatch(/social-neo-scroll-lock[\s\S]*#social-neo-center-region/);
        expect(css).toMatch(/social-neo-scroll-lock[\s\S]*overflow-y:\s*auto/);
        expect(surveysCss.length).toBeGreaterThan(100);
        expect(source).toContain("document.body.classList.toggle('social-neo-scroll-lock', shouldLock)");
        expect(source).toContain('function getSocialCenterScroller(');
        expect(source).toContain('scheduleSocialCenterScrollRepair(host);');
        expect(source).toContain('syncSocialScrollLayout(host);');

        expect(luxuryRuntimeSource).toContain('function getSocialCenterScrollRoot(');
        expect(luxuryRuntimeSource).toContain('root: scrollRoot');

        expect(css).toContain('social-neo-scroll-lock');
        expect(css).toContain('@media (min-width: 1181px)');
        expect(css).toContain('--social-measured-chrome');
        expect(css).toMatch(/social-neo-scroll-lock[\s\S]*#public-social-root/);
        expect(css).toMatch(/social-neo-scroll-lock[\s\S]*#social-neo-center-region/);

        expect(html).toContain('assets/css/social-rebuild.css?v=20260713-accentborder2');
        expect(html).toContain('assets/css/social-projects-lms.css?v=20260713-accentborder2');
        expect(html).toContain('assets/css/social-surveys-lms.css?v=20260710-comments-dialog-glass1');
        expect(html).toContain('assets/css/social-photography-lms.css?v=20260710-photo-borders1');
        expect(html).toContain('assets/js/pages/social-page.js?v=20260713-groups-detail9');
    });
});