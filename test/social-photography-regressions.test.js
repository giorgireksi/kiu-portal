import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social-photography-regressions (bare-shell era)', () => {
    it('social domain paint CSS removed; behavior tests deferred to JS modules', () => {
        expect(existsSync(join(process.cwd(), 'assets/css/social-rebuild.css'))).toBe(false);
        expect(existsSync(join(process.cwd(), 'assets/css/social-projects-lms.css'))).toBe(false);
    });

    it('resolves photography publish hooks lazily and recovers blob preview files', () => {
        const photo = readSource('assets/js/pages/social-photography.js');
        expect(photo).toContain('function resolvePhotographyHook(name)');
        expect(photo).toContain('resolvePhotographyUploadFile(draft)');
        expect(photo).toMatch(/resolvePhotographyHook\('submitSocialPost'\)/);
        expect(photo).toMatch(/resolvePhotographyHook\('root'\)/);
    });

    it('refreshFeed only applies home feed scope on the feed panel', () => {
        const runtime = readSource('assets/js/shared/social-runtime-lite.js');
        expect(runtime).toMatch(/const activePanel = text\(runtime\.ui\?\.activePanel/);
        expect(runtime).toMatch(/if \(activePanel === 'feed'\) \{[\s\S]*feedScopeType/);
    });

    it('runtime guards social/feed/directory responses by requesting user id', () => {
        const runtime = readSource('assets/js/shared/social-runtime-lite.js');
        expect(runtime).toContain('const requestUserId = text(user.id);');
        expect(runtime).toMatch(/loadSocialState[\s\S]*if \(text\(currentUserId\(\)\) !== requestUserId\) return runtime\.social;/);
        expect(runtime).toMatch(/refreshFeed[\s\S]*if \(text\(currentUserId\(\)\) !== requestUserId\) return runtime\.feed;/);
        expect(runtime).toMatch(/loadDirectory[\s\S]*if \(text\(currentUserId\(\)\) !== requestUserId\) return runtime\.directory;/);
    });

    it('resets project discovery filters when account identity changes', () => {
        const runtime = readSource('assets/js/shared/social-runtime-lite.js');
        expect(runtime).toContain('function syncRuntimeIdentity(user = currentUser())');
        expect(runtime).toContain('function resetWorkspaceDiscoveryUiForIdentityChange()');
        expect(runtime).toContain("runtime.ui.projectHubScope = 'mine';");
        expect(runtime).toContain("runtime.ui.projectDiscoverFaculty = 'all';");
        expect(runtime).toContain('const identityChanged = syncRuntimeIdentity(user);');
    });

    it('photography publish refreshes feed stage after submit', () => {
        const photo = readSource('assets/js/pages/social-photography.js');
        expect(photo).toMatch(/resolvePhotographyHook\('refreshPhotographyPanelStage'\)/);
        expect(photo).toMatch(/resolvePhotographyHook\('invalidateSocialRenderCache'\)/);
    });

    it('panel photographyPosts uses portal feed without forcing empty array', () => {
        const panel = readSource('assets/js/pages/social-panel-model.js');
        expect(panel).toMatch(/const fromPortal = getPortalPhotographyPosts\(\);/);
        expect(panel).toMatch(/arguments\.length \? fn\(feed\) : fn\(\)/);
        const page = readSource('assets/js/pages/social-page.js');
        expect(page).toMatch(/__kiuSocialPanelHooks/);
        expect(page).toMatch(/getPortalPhotographyPosts/);
    });

    it('photography remove uses author-only guard and two-step delete dialog', () => {
        const photo = readSource('assets/js/pages/social-photography.js');
        expect(photo).toContain('function canRemovePhotographyPost(post)');
        expect(photo).toMatch(/authorUserId\) === currentUserId\(\)/);
        expect(photo).toContain('photography-delete-open');
        expect(photo).toContain('dialog-photography-delete');
        expect(photo).toContain('confirmPhotographyDelete');
        expect(photo).toContain('renderPhotographyDeleteDialog');
        expect(photo).toMatch(/resolvePhotographyHook\('deletePortalSocialPost'\)/);
        const router = readSource('assets/js/pages/social-dialog-router.js');
        expect(router).toContain("kind === 'photography-delete'");
        const page = readSource('assets/js/pages/social-page.js');
        expect(page).toMatch(/deletePortalSocialPost/);
    });

    it('photography explore feed uses centered scroll column with square media tiles', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toMatch(/\[data-panel="photography"\][\s\S]*?\.social-photo-feed-list[\s\S]*?flex-direction:\s*column/);
        expect(bare).toMatch(/\[data-panel="photography"\][\s\S]*?\.social-photo-feed-list[\s\S]*?clamp\(600px,\s*70vw,\s*760px\)/);
        expect(bare).toMatch(/\[data-panel="photography"\][\s\S]*?\.social-photo-feed-media img[\s\S]*?object-fit:\s*contain/);
        expect(bare).not.toMatch(/\[data-panel="photography"\][\s\S]*?\.social-photo-feed-media[\s\S]*?aspect-ratio:\s*1/);
        expect(bare).not.toMatch(/\[data-panel="photography"\][\s\S]*?\.social-photo-feed-media img[\s\S]*?max-height:\s*72vh/);
    });

    it('photography comments dialog uses IG split modal with shared lux glass shell', () => {
        const photo = readSource('assets/js/pages/social-photography.js');
        const modals = readSource('assets/css/lux-modals.css');
        expect(photo).toContain('social-photo-ig-modal lux-glass-dialog-card lux-glass-dialog-card--social-glass');
        expect(modals).toContain('.social-photo-ig-modal-body');
        expect(modals).toMatch(/\.social-photo-ig-media-pane img[\s\S]*?object-fit:\s*contain/);
        expect(modals).toContain('grid-template-columns: minmax(0, 1fr) minmax(420px, 520px)');
    });

    it('photography grid uses performant tile markup and CSS', () => {
        const photo = readSource('assets/js/pages/social-photography.js');
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(photo).toContain('social-photo-grid-tile-img');
        expect(photo).toContain('data-photo-src="${escape(src)}"');
        expect(photo).toContain('bindPhotographyGridImages');
        expect(photo).toContain('createImageBitmap');
        expect(photo).toContain('data-lux-transparency-exempt="1"');
        expect(bare).toContain('content-visibility: auto');
        expect(bare).toMatch(/\.social-photo-grid-tile:hover img[\s\S]*?transform:\s*none/);
        expect(bare).toContain('gap: 3px');
    });
});
