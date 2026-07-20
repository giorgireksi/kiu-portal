import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social post actions regressions', () => {
    it('keeps feed mutations, dialogs, and comment drafts in the render pipeline', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const feedModule = readSource('assets/js/pages/social-feed.js');
        const runtimeSource = readSource('assets/js/shared/social-runtime-lite.js');
        const appSource = readSource('assets/js/app/app.js');
        const html = readSource('social.html');
        const sw = readSource('service-worker.js');

        expect(html).toMatch(/assets\/js\/pages\/social-page\.js\?v=/);
        expect(html).toMatch(/assets\/js\/shared\/social-runtime-lite\.js\?v=/);

        expect(appSource).toMatch(/assets\/js\/pages\/social-page\.js\?v=/);
        expect(appSource).toMatch(/assets\/js\/shared\/social-runtime-lite\.js\?v=/);

        expect(source).toContain('const postKey = window.postKey');
        expect(source).toContain('const buildFeedFingerprint = window.buildFeedFingerprint');
        expect(readSource('assets/js/pages/social-chrome-model.js')).toContain('function postKey(postOrId)');
        expect(readSource('assets/js/pages/social-fingerprint-model.js')).toContain('function buildFeedFingerprint(runtime)');
        expect(source).toContain('function syncCommentDraftFromTarget(target)');
        expect(source).toContain('function reactionLabel(reactionType)');
        expect(source).toContain('function renderPostReactionMetrics(reactionCounts = {})');
        // Post card markup + reaction/save patches live in social-feed.js.
        expect(source + feedModule).toContain('const hasViewerReaction = Boolean(viewerReaction)');
        expect(source + feedModule).toContain('data-reaction-type="${escape(viewerReaction || \'like\')}"');
        expect(feedModule).toContain('function renderPost(post)');
        expect(feedModule).toContain('function patchPostReactions(postId)');
        expect(source).toContain('function renderPost(post)');
        expect(source).toContain('window.renderPost !== renderPost');
        expect(source).toContain('function patchPostReactions(postId)');
        expect(source).toContain('window.patchPostReactions !== patchPostReactions');
        expect(source + feedModule).not.toContain('fa-heart social-neo-metric-heart');
        expect(source).toContain('async function boot()');
        expect(source).toContain('if (runHydrate) await runHydrate();');
        expect(source).toContain('text(dialog?.type || \'\')');
        expect(source).not.toContain('activeDialog()?.kind');
        const forceRenderSource = readSource('assets/js/pages/social-fingerprint-model.js');
        expect(forceRenderSource).toContain('page-open-profile|page-about-more|page-members-open|page-members-filter');
        expect(forceRenderSource).toContain('page-profile-back|page-profile-tab|page-profile-edit-|page-post-type');
        expect(source).toContain('isSocialForceRenderReason(reason)');
        expect((source + feedModule)).toContain('\'post-react\'');
        expect((source + feedModule)).toContain('\'post-pin\'');
        expect((source + feedModule)).toContain("renderSocialPageNow('post-react')");
        expect((source + feedModule)).toContain("renderSocialPageNow('post-pin')");
        expect((source + feedModule)).toContain('patchCommentReactions(updatedPost, reactCommentId)');
        expect(source).toContain('delete shell.center.__kiuLastMarkup');
        expect(runtimeSource).toContain('pendingRenderReason');
        expect(runtimeSource).toContain('function mergeFeedPost(post)');
        expect(runtimeSource).toContain('function invalidateSocialFeedRenderCache()');
        expect(runtimeSource).toContain('function isFeedRenderReason(reason = \'\')');
        expect(runtimeSource).toContain('mergeFeedPost(updatedPost)');
        expect(runtimeSource).toContain('function applyOptimisticPostReaction(post, userId, reactionType = \'like\')');
        const reactToPostBlock = runtimeSource.match(/async function reactToPost[\s\S]*?(?=\n    async function )/)?.[0] || '';
        const reactToCommentBlock = runtimeSource.match(/async function reactToComment[\s\S]*?(?=\n    async function )/)?.[0] || '';
        expect(reactToPostBlock).not.toContain('await refreshFeed(true)');
        expect(reactToCommentBlock).not.toContain('await refreshFeed(true)');
        expect(source).toContain("reason === 'dialog-close' || /^dialog-/.test(reason)");
        expect(source).toContain('boundHost = host');
        expect((source + feedModule)).toContain('syncCommentDraftFromTarget(commentInput)');
        expect((source + feedModule)).toContain('const postId = postKey(commentForm.getAttribute(\'data-post-id\'))');
        expect((source + feedModule)).toContain('const postId = postKey(form.getAttribute(\'data-post-id\'))');
        expect((source + feedModule)).toContain('const bodySource = event.target?.name === \'commentBody\' ? event.target : commentInput');
        expect(readSource('assets/js/pages/social-feed.js')).toContain('const dialogCommentDraft = String(runtime.ui?.commentDraftByPost?.[dialogNormalizedPostId] || \'\')');
        expect(source).toContain('CSS.escape(postId)');
        expect((source + feedModule)).toContain('data-action="post-compose-open"');
        expect((source + feedModule)).toContain('trigger.closest(\'.social-neo-composer-card\')');
        expect((source + feedModule)).toContain('composerTextarea?.value || runtime.ui?.composerText');
        expect((source + feedModule)).toContain('form[data-form="post-compose"]');
        expect((source + feedModule)).toContain('form[data-form="comment"][data-post-id="');
        expect(source).not.toMatch(/function renderPost\(post\)[\s\S]*function renderPost\(post\)/);

        expect(sw).toContain('function isSocialRuntimeScriptRequest(url, request)');
        expect(sw).toContain('function handleSocialRuntimeScriptRequest(request, event)');
    });
});
