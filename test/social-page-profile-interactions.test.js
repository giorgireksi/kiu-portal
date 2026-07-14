import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social page profile interactions', () => {
    it('tracks page profile UI state in the render signature', () => {
        const source = readSource('assets/js/pages/social-page.js');

        expect(source).toContain('function buildPagesFingerprint(runtime)');
        expect(source).toContain('buildPagesFingerprint(runtime)');
        expect(source).toContain('text(ui.activePageProfileId || \'\')');
        expect(source).toContain('text(ui.pageProfileTab || \'all\')');
        expect(source).toContain('Boolean(ui.pageProfileEditMode)');
        expect(source).toContain('text(ui.pagesSearch || \'\')');
        expect(source).toContain('text(ui.pagePostType || \'official\')');
        expect(source).not.toContain('text(ui.activePageId || \'\')');
    });

    it('uses surgical patches for fast page follow and report actions', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const runtimeSource = readSource('assets/js/shared/social-runtime-lite.js');

        const pagesModule = readSource('assets/js/pages/social-pages.js');
        const combined = source + pagesModule;
        expect(source).toContain('function patchPageFollowState(pageId)');
        expect(source).toContain('function patchPageComposeBlock(pageId)');
        expect(source).toContain('function patchSocialFlash()');
        expect(combined).toContain("togglePortalSocialFollow('page', pageId, { skipBootstrap: true })");
        expect(combined).toContain('patchPageFollowState(pageId)');
        expect(combined).toContain('patchSocialFlash()');
        expect(source).not.toContain("return withBusy(async () => {\n                await reportPortalSocialContent('page', pageId");

        const followStart = combined.indexOf("if (action === 'page-follow')");
        const followEnd = combined.indexOf("if (action === 'page-about-more')", followStart);
        const followBlock = combined.slice(followStart, followEnd > followStart ? followEnd : followStart + 2000);
        expect(followBlock).not.toContain("return withBusy(async () => {");
        expect(followBlock).toContain('page.isFollowing = !previousFollowing');
        expect(followBlock).toContain("if (!patched)");
        expect(followBlock).toContain("renderSocialPageNow('page-follow')");
        expect(followBlock).toContain('invalidateSocialRenderCache({ center: true })');

        expect(runtimeSource).toContain('function applyFollowMutationLocally(targetType, targetId, payload = {})');
        expect(runtimeSource).toContain('options.skipBootstrap');
        expect(runtimeSource).toContain('loadSocialState(true, { skipRender: true })');
        expect(runtimeSource).toContain("setFlash(payload?.following ? 'Now following.' : 'Follow removed.', 'success', { skipRender: true })");
        expect(runtimeSource).toContain("setFlash('Report submitted.', 'success', { skipRender: true })");
    });

    it('syncs page post type on change for lux picker compatibility', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const pagesModule = readSource('assets/js/pages/social-pages.js');
        const changeCombined = source + pagesModule;

        expect(changeCombined).toContain('form[data-form="page-profile-post"] [name="pagePostType"]');
        expect(changeCombined).toContain("renderSocialPageNow('page-post-type')");

        const inputStart = source.indexOf('function handleInput(event)');
        const inputEnd = source.indexOf('function handleChange(event)', inputStart);
        const inputBlock = source.slice(inputStart, inputEnd);

        expect(inputBlock).not.toContain('pagePostType');
    });

    it('re-enhances lux pickers after center region paint', () => {
        const source = readSource('assets/js/pages/social-page.js');

        expect(source).toContain('window.enhanceUniversalPickers(shell.center)');
        expect(source).toContain('window.enhanceUniversalPickers(freshBlock)');
        expect(source).toContain('window.enhanceUniversalPickers(shell.dialog)');
    });

    it('opens page post compose in a dialog instead of inline form', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const css = readSource('assets/css/social-rebuild.css');

        const pagesModule = readSource('assets/js/pages/social-pages.js');
        const composerStart = pagesModule.indexOf('function renderPageProfileComposer(page, runtime)');
        const composerEnd = pagesModule.indexOf('function renderPagesPanel()', composerStart);
        const composerBlock = pagesModule.slice(composerStart, composerEnd);

        expect(source).toContain('function renderPagePostComposeDialog(runtime, page)');
        expect(readSource('assets/js/pages/social-pages.js')).toContain("kind === 'page-post-compose'");
        expect((source + pagesModule)).toContain("action === 'page-post-compose-open'");
        expect((source + pagesModule)).toContain("openDialog('page-post-compose'");
        expect((source + pagesModule)).toContain('page-post-compose-open');
        expect(source).toContain('page-post-file');
        expect(source).toContain('page-profile-post');

        expect(composerBlock).toContain('page-post-compose-open');
        expect(composerBlock).toContain('social-neo-page-compose-cta');
        expect(composerBlock).not.toContain('data-form="page-profile-post"');

        const pagesSubmit = source + pagesModule;
        const submitStart = pagesSubmit.indexOf("if (formType === 'page-profile-post')");
        const submitEnd = pagesSubmit.indexOf("if (formType === '", submitStart + 10);
        const submitBlock = pagesSubmit.slice(submitStart, submitEnd > submitStart ? submitEnd : submitStart + 1500);
        expect(submitBlock).toContain('closeDialog()');

        expect(css).toContain('.social-neo-page-compose-cta');
        expect(css).toContain('.social-neo-dialog-card--page-post');
    });
});