import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readAsset(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf-8');
}

describe('Social photography regressions', () => {
    it('exposes the photography panel in shell, runtime, and mobile', () => {
        const socialPageJs = readAsset('assets/js/pages/social-page.js');
        const socialRuntimeJs = readAsset('assets/js/shared/social-runtime-lite.js');
        const socialMobileJs = readAsset('assets/js/pages/social-mobile.js');
        const socialHtml = readAsset('social.html');

        expect(socialPageJs).toContain("const SOCIAL_PHOTOGRAPHY_MODULE_URL = 'assets/js/pages/social-photography.js?v=20260714-photo-click1';");
        expect(socialPageJs).toContain('function ensureSocialPhotographyModule()');
        expect(socialPageJs).toContain('window.__kiuSocialPhotographyHooks');
        expect(socialPageJs).toContain('renderCommentThread');
        expect(socialPageJs).toContain('function isCommentDialog()');
        expect(socialPageJs).toContain("'photography-comments'");
        expect(socialPageJs).toContain("'photography'");
        expect(socialPageJs).toContain('panel-photography');
        expect(socialPageJs).toContain("text(post?.category) !== 'Photography'");
        expect(socialPageJs).not.toContain('kiu_photography_data');
        expect(socialRuntimeJs).toContain('photography');
        expect(socialRuntimeJs).not.toContain("runtime.ui.activePanel === 'photography') runtime.ui.activePanel = 'feed'");
        expect(socialRuntimeJs).toContain('getPortalPhotographyPosts');
        expect(socialMobileJs).toContain("'photography'");
        expect(socialMobileJs).toContain("return 'photography'");
        expect(socialHtml).toContain('data-social-panel="photography"');
        expect(socialHtml).toContain('mobile-nav-row--seven');
        expect(socialHtml).toContain('social-photography-lms.css');
    });

    it('keeps photography module scoped and image-only feed UX', () => {
        const moduleJs = readAsset('assets/js/pages/social-photography.js');
        const css = readAsset('assets/css/social-photography-lms.css');

        expect(moduleJs).toContain('social-photo-shell');
        expect(moduleJs).toContain('social-photo-chrome');
        expect(moduleJs).toContain('social-photo-tab-segment');
        expect(moduleJs).toContain('social-photo-explore-grid');
        expect(moduleJs).toContain('social-photo-content-stage');
        expect(moduleJs).toContain('social-photo-discover-strip');
        expect(moduleJs).toContain('social-photo-feed-card');
        expect(moduleJs).toContain('social-photo-feed-actions');
        expect(moduleJs).toContain('social-photo-feed-editorial');
        expect(moduleJs).toContain('social-neo-reaction-picker');
        expect(moduleJs).toContain('renderPostReactionMetrics');
        expect(moduleJs).toContain('social-neo-post-reaction-btn');
        expect(moduleJs).not.toContain('social-photo-feed-action-btn');
        expect(moduleJs).not.toContain('fa-heart');
        expect(moduleJs).toContain('photography-open-comments');
        expect(moduleJs).toContain('renderPhotographyCommentsDialog');
        expect(moduleJs).toContain('data-form="dialog-comment"');
        expect(moduleJs).toContain('data-photography-tab="explore"');
        expect(moduleJs).toContain('data-photography-tab="following"');
        expect(moduleJs).not.toContain('data-form="comment"');
        expect(moduleJs).not.toContain('social-photo-ledger-card');
        expect(moduleJs).not.toContain('This week on campus');
        expect(moduleJs).not.toContain('Contact Sheet');
        expect(moduleJs).toContain('social-photo-chrome');
        expect(moduleJs).not.toContain('social-lms-tier-hero');
        expect(moduleJs).not.toContain('lms-hero-v2-grid');
        expect(moduleJs).toContain('Campus Exposé');
        expect(moduleJs).toContain('Share a photo');
        expect(moduleJs).toContain('social-photo-grid-tile-fallback');
        expect(moduleJs).toContain("alt=\"\"");
        expect(moduleJs).toContain('is-broken');
        expect(moduleJs).toContain('name="photographyUploadFile"');
        expect(moduleJs).toContain('social-photo-upload-file-input');
        expect(moduleJs).not.toContain('reel');
        expect(moduleJs).not.toContain('social-neo-story-ring');
        expect(moduleJs).not.toContain('kiu_photography_data');
        expect(css).toContain('data-panel="photography"');
        expect(css).toContain('#social-neo-center-region');
        expect(css).toContain('#public-social-root .social-photo-tab');
        expect(css).toContain('#public-social-root .social-photo-grid-tile');
        expect(css).toContain('social-photo-chrome');
        expect(css).toContain('background: transparent !important');
        expect(css).toContain('--social-fade-shadow-soft');
        expect(css).toContain('lux-light-mode');
        expect(css).toContain('social-photo-tab-segment');
        expect(css).toContain('social-photo-explore-grid');
        expect(css).toContain('auto-fill');
        expect(css).toContain('social-photo-grid-tile-fallback');
        expect(css).toContain('social-photo-discover-strip');
        expect(css).toContain('social-photo-feed-actions');
        expect(css).toContain('social-photo-feed-editorial');
        expect(css).toContain('social-photo-feed-reactions');
        expect(css).not.toContain('social-photo-feed-action-btn');
        expect(css).not.toContain('#f87171');
        expect(css).toContain('social-photo-ig-modal');
        expect(css).toContain('Fraunces');
        expect(css).toContain('DM Mono');
        expect(css).not.toContain('reel');
    });

    it('wires photography my-profile view and chrome actions', () => {
        const moduleJs = readAsset('assets/js/pages/social-photography.js');
        const socialPageJs = readAsset('assets/js/pages/social-page.js');

        expect(moduleJs).toContain('social-photo-my-header');
        expect(moduleJs).toContain('social-photo-my-hero');
        expect(moduleJs).toContain('social-photo-my-head');
        expect(moduleJs).toContain('social-photo-my-tabs');
        expect(moduleJs).toContain('social-photo-shell--my-profile');
        expect(moduleJs).toContain('photography-my-profile-open');
        expect(moduleJs).toContain('runtime.ui?.photographyMyProfile');
        expect((socialPageJs + moduleJs)).toContain('photography-my-profile-open');
        expect((socialPageJs + moduleJs)).toContain('photography-my-profile-close');
        expect((socialPageJs + moduleJs)).toContain('photography-my-profile-tab');
        expect(socialPageJs).toContain('photographyMyProfile');
        expect(socialPageJs).toContain('photographyMyProfileTab');
    });

    it('styles my-profile header with theme tokens for dark and light parity', () => {
        const css = readAsset('assets/css/social-photography-lms.css');

        expect(css).toContain('.social-neo[data-panel="photography"] .social-photo-my-header');
        expect(css).toContain('background: var(--social-fade-surface) !important');
        expect(css).toContain('.social-neo[data-panel="photography"] .social-photo-my-info h2');
        expect(css).toContain('color: var(--sn-txt) !important');
        expect(css).toContain('.social-neo[data-panel="photography"] .social-photo-my-tab.is-active');
        expect(css).toContain('social-photo-my-profile-btn');
        expect(css).toContain('html body.lux-light-mode.lux-route-social .social-neo[data-panel="photography"] .social-photo-my-header');
        expect(css).not.toMatch(/\.social-photo-my-header[\s\S]*background:\s*rgba\(255,\s*255,\s*255/);
        expect(css).not.toMatch(/\.social-photo-my-info h2[\s\S]*color:\s*#[0-9a-f]{3,6}/i);
    });

    it('persists photo metadata on the backend post shape', () => {
        const contentService = readAsset('backend/platform/domains/social-content-service.js');
        expect(contentService).toContain('photoMeta:');
    });

    it('routes photography upload wizard through dialog re-renders', () => {
        const socialPageJs = readAsset('assets/js/pages/social-page.js');
        const socialRuntimeJs = readAsset('assets/js/shared/social-runtime-lite.js');
        const moduleJs = readAsset('assets/js/pages/social-photography.js');
        const css = readAsset('assets/css/social-photography-lms.css');

        expect(readAsset('assets/js/pages/social-render-plan.js')).toContain('photographyUploadDialogReasons');
        const planJs = readAsset('assets/js/pages/social-render-plan.js');
        expect(planJs).toContain("'photography-upload-next'");
        expect(planJs).toContain("'photography-upload-back'");
        expect(planJs).toContain("'photography-upload-file'");
        expect(planJs).toContain("'photography-upload-drop'");
        expect(socialPageJs).toContain('function applyPhotographyUploadFile(file)');
        expect(socialPageJs).toContain('function revokePhotographyUploadPreview(draft = {})');
        expect(socialPageJs).toContain('URL.createObjectURL(file)');
        expect(socialPageJs).toContain('photographyUploadDraft.fileName');
        expect(socialPageJs).toContain('function bindPhotographyUploadDialogFileInput()');
        expect(socialPageJs).toContain('bindPhotographyUploadDialogFileInput();');
        expect(socialPageJs).toContain('label.social-photo-upload-dropzone');
        expect((socialPageJs + moduleJs)).toContain('Choose an image before continuing.');
        expect(socialPageJs).toContain('PHOTOGRAPHY_UPLOAD_MAX_BYTES');
        expect((socialPageJs + moduleJs)).toContain("runtime.ui.photographyTab = 'explore'");
        expect((socialPageJs + moduleJs)).toContain("host.__kiuLastRenderSignature = ''");
        expect(socialPageJs).toContain('getPortalStoredFileUrl');
        expect(socialRuntimeJs).toContain('Could not attach image to post.');
        expect(socialRuntimeJs).toContain('Photo published without an image attachment.');
        expect((socialPageJs + moduleJs)).toContain("openDialog('photography-upload'");
        expect(socialPageJs).toContain("if (closingType === 'photography-upload')");
        expect(socialPageJs).toContain('function bindOverlayPortalEvents()');
        expect(socialPageJs).toContain('bindOverlayPortalEvents();');
        expect(socialPageJs).toContain('function bindOverlayCaptureClick()');
        expect(socialPageJs).toContain('bindOverlayCaptureClick();');
        expect(socialPageJs).toContain('function bindOverlayCaptureChange()');
        expect(socialPageJs).toContain('bindOverlayCaptureChange();');
        expect(socialPageJs).toContain('function ensurePhotographyUploadFileSink()');
        expect(socialPageJs).toContain('PHOTOGRAPHY_UPLOAD_FILE_SINK_ID');
        expect(socialPageJs).toContain('function openPhotographyUploadFilePicker()');
        expect(socialPageJs).toContain('function bindPhotographyUploadFileSinkChange()');
        expect(socialPageJs).toContain('handlePhotographyUploadFileSinkChange');
        expect(socialPageJs).toContain('accept = \'image/*\'');
        expect(socialPageJs).toContain('__kiuSocialChangeHandled');
        expect(socialPageJs).toContain('ensureSocialOverlayPortal();');
        expect(socialPageJs).toMatch(/function bindEvents\(\)[\s\S]*ensureSocialOverlayPortal\(\);[\s\S]*bindOverlayPortalEvents\(\);/);
        expect(socialPageJs).toMatch(/renderSocialPageNow\(`dialog-\$\{type\}`\);[\s\S]*ensureSocialOverlayPortal\(\);[\s\S]*bindOverlayPortalEvents\(\);/);
        expect(socialPageJs).toContain('syncOverlayPortalVisibility();');
        expect(socialPageJs).toContain('SOCIAL_OVERLAY_SURFACE_SELECTOR');
        expect(socialPageJs).not.toContain('portal.hidden || !portal.contains(event.target)');
        expect(socialPageJs).not.toMatch(/if \(portal\.dataset\.kiuOverlayEventsBound === '1'\) return;/);
        expect(socialPageJs).toContain('kiuOverlayEventsBound');
        expect(socialPageJs).toContain('handlePhotographyUploadDragEnter');
        expect(socialPageJs).toContain('event.__kiuSocialHandled');
        expect(socialPageJs).toContain("trigger.matches('input[type=\"file\"]')");
        expect(socialPageJs).toContain('bindPhotographyUploadPortalEvents');
        expect(socialPageJs).toContain('function socialDialogRegion()');
        expect(socialPageJs).toContain('function photographyUploadForm()');
        expect(socialPageJs).not.toContain('portalBound');
        const centerOnlyBlock = socialPageJs.match(/const centerOnlyReasons = new Set\(\[([\s\S]*?)\]\);/)?.[1] || '';
        expect(centerOnlyBlock).not.toContain("'photography-upload-next'");
        expect(centerOnlyBlock).not.toContain("'photography-upload-back'");
        expect(moduleJs).toContain('data-photography-drop');
        expect(moduleJs).toContain('data-lux-transparency-exempt="1"');
        expect(moduleJs).not.toContain('data-action="photography-upload-pick"');
        expect(moduleJs).not.toContain('for="kiu-photography-upload-file-sink"');
        expect(moduleJs).toContain('social-neo-btn-pointer');

        expect(moduleJs).not.toContain('data-action="photography-upload-file"');
        expect(moduleJs).toMatch(/social-photo-upload-dropzone[\s\S]*name="photographyUploadFile"/);
        expect(css).toContain('.social-photo-upload-file-input');
        expect(moduleJs).toContain('social-photo-upload-choose-btn');
        expect(moduleJs).toContain('social-photo-upload-step1');
        expect(moduleJs).toContain('const hasFile = Boolean(draft.file || text(draft.fileName');
        expect(moduleJs).toContain('Replace image');
        expect(moduleJs).toContain('!hasFile ? \'disabled\'');
        expect(css).not.toContain('social-photo-upload-choose-btn');
        expect(css).toContain('.social-photo-upload-dropzone.is-dragover');
        expect(css).toContain('.social-photo-viewfinder');
        expect(css).toContain('pointer-events: none');
        expect(css).toContain('#social-neo-overlay-portal .social-photo-upload-head');
        expect(css).toContain('#social-neo-overlay-portal .social-photo-upload-card');
    });
});