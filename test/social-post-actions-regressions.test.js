import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social post actions regressions', () => {
    it('keeps feed mutations, dialogs, and comment drafts in the render pipeline', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const runtimeSource = readSource('assets/js/shared/social-runtime-lite.js');
        const appSource = readSource('assets/js/app/app.js');
        const html = readSource('social.html');
        const sw = readSource('service-worker.js');

        expect(html).toContain('assets/js/pages/social-page.js?v=20260606-postactions6');
        expect(html).toContain('assets/js/shared/social-runtime-lite.js?v=20260606-postactions6');
        expect(html).toContain('KIU_SOCIAL_ROUTE_SW_RESET_20260606-postactions6');

        expect(appSource).toContain('assets/js/pages/social-page.js?v=20260606-postactions6');
        expect(appSource).toContain('assets/js/shared/social-runtime-lite.js?v=20260606-postactions6');

        expect(source).toContain('function postKey(postOrId)');
        expect(source).toContain('function buildFeedFingerprint(runtime)');
        expect(source).toContain('function syncCommentDraftFromTarget(target)');
        expect(source).toContain('function reactionLabel(reactionType)');
        expect(source).toContain('function renderPostReactionMetrics(reactionCounts = {})');
        expect(source).toContain('const hasViewerReaction = Boolean(viewerReaction)');
        expect(source).toContain('data-reaction-type="${escape(viewerReaction || \'like\')}"');
        expect(source).not.toContain('fa-heart social-neo-metric-heart');
        expect(source).toContain('async function boot()');
        expect(source).toContain('if (runHydrate) await runHydrate();');
        expect(source).toContain('text(dialog?.type || \'\')');
        expect(source).not.toContain('activeDialog()?.kind');
        expect(source).toContain('const forceRender = /^(feed|feed-error|hydrate|hydrate-accounts|hydrate-error|social-bootstrap|post-created|dialog-|comment-|post-save|post-pin|post-react|post-submit)/.test(reason)');
        expect(source).toContain('\'post-react\'');
        expect(source).toContain('\'post-pin\'');
        expect(source).toContain("renderSocialPageNow('post-react')");
        expect(source).toContain("renderSocialPageNow('post-pin')");
        expect(source).toContain("renderSocialPageNow('comment-react')");
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
        expect(source).toContain('if (/^dialog-/.test(reason))');
        expect(source).toContain('boundHost = host');
        expect(source).toContain('syncCommentDraftFromTarget(commentInput)');
        expect(source).toContain('const postId = postKey(commentForm.getAttribute(\'data-post-id\'))');
        expect(source).toContain('const postId = postKey(form.getAttribute(\'data-post-id\'))');
        expect(source).toContain('const bodySource = event.target?.name === \'commentBody\' ? event.target : commentInput');
        expect(source).toContain('const commentDraft = String(runtime.ui?.commentDraftByPost?.[normalizedPostId] || \'\')');
        expect(source).toContain('CSS.escape(postId)');
        expect(source).toContain('data-action="composer-focus"');
        expect(source).toContain('trigger.closest(\'.social-neo-composer-card\')');
        expect(source).toContain('composerTextarea?.value || runtime.ui?.composerText');
        expect(source).toContain('form[data-form="comment"][data-post-id="');
        expect(source).not.toMatch(/function renderPost\(post\)[\s\S]*function renderPost\(post\)/);

        expect(sw).toContain('function isSocialRuntimeScriptRequest(url, request)');
        expect(sw).toContain('function handleSocialRuntimeScriptRequest(request, event)');
    });
});