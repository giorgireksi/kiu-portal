import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { join } from 'path';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social comment actions regressions', () => {
    it('persists comment reactions on the stored post record', () => {
        const store = new PlatformStore({});
        store.state.accounts['user-a'] = { id: 'user-a', displayName: 'User A', email: 'a@example.com', role: 'student', facultyCode: 'ECON' };
        store.state.accounts['user-b'] = { id: 'user-b', displayName: 'User B', email: 'b@example.com', role: 'student', facultyCode: 'ECON' };

        const post = store.createSocialPost({ body: 'Test post', scopeType: 'profile', scopeId: 'user-a' }, 'user-a');
        expect(post?.id).toBeTruthy();

        const commented = store.addSocialComment(post.id, { authorUserId: 'user-b', body: 'Nice post' });
        const commentId = commented?.comments?.[0]?.id;
        expect(commentId).toBeTruthy();

        const reacted = store.toggleSocialCommentReaction(post.id, commentId, 'user-a', 'like');
        expect(reacted?.comments?.[0]?.reactionCounts?.like).toBe(1);

        const stored = store.getSocialPostRecord(post.id);
        expect(stored?.comments?.[0]?.reactionCounts?.like).toBe(1);

        const toggledOff = store.toggleSocialCommentReaction(post.id, commentId, 'user-a', 'like');
        expect(toggledOff?.comments?.[0]?.reactionCounts?.like || 0).toBe(0);
        expect(store.getSocialPostRecord(post.id)?.comments?.[0]?.reactionCounts?.like || 0).toBe(0);
    });

    it('keeps comment action handlers, dialogs, and render pipeline wired in the frontend', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const runtimeSource = readSource('assets/js/shared/social-runtime-lite.js');
        const html = readSource('social.html');
        const serviceSource = readSource('backend/platform/domains/social-content-service.js');

        expect(html).toContain('assets/js/pages/social-page.js?v=20260606-postactions6');
        expect(html).toContain('assets/js/shared/social-runtime-lite.js?v=20260606-postactions6');

        expect(serviceSource).toContain('const stack = [...asArray(comments)]');
        expect(serviceSource).toContain('if (Array.isArray(comment.replies) && comment.replies.length)');

        expect(source).toContain('function focusCommentComposeInput(host, postId)');
        expect(source).toContain('function collectCommentReactionFingerprint(comments = [], limit = 12, collected = [])');
        expect(source).toContain("renderSocialPageNow('comment-react')");
        expect(source).toContain("openDialog('comment-report'");
        expect(source).toContain("kind === 'comment-report'");
        expect(source).toContain('dialog-comment-report');
        expect(source).toContain("'comment-react'");
        expect(source).toContain("'comment-report'");
        expect(source).toContain('commentReplyFocusPostId');
        expect(source).toContain('focusCommentComposeInput(host, focusPostId)');

        expect(runtimeSource).toContain('function mergeFeedPost(post)');
        expect(runtimeSource).toContain("queueRender('report-created')");
        expect(runtimeSource).toContain("document.getElementById('public-social-root')");
        expect(runtimeSource).toContain('function applyOptimisticCommentReaction(post, commentId, userId, reactionType = \'like\')');
        expect(runtimeSource).toContain('function mutationRequest(path, options = {})');
        expect(runtimeSource).toContain('SOCIAL_MUTATION_TIMEOUT_MS = 12000');
        expect(runtimeSource).toContain("queueRender('comment-react')");
        const reactToCommentBlock = runtimeSource.match(/async function reactToComment[\s\S]*?(?=\n    async function )/)?.[0] || '';
        expect(reactToCommentBlock).not.toContain('await refreshFeed(true)');

        expect(source).toContain('pendingCommentReactions');
        expect(source).toMatch(/reason === 'boot' \|\| \/\^\(comment-\|post-react\|post-save\|post-pin\)\/\./);

        const apiSource = readSource('assets/js/app/api.js');
        expect(apiSource).toContain('Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : KIU_PORTAL_BACKEND_TIMEOUT_MS');
    });

    it('keeps comment reaction buttons hit-testable in CSS', () => {
        const css = readSource('assets/css/social-rebuild.css');
        expect(css).toMatch(/body\.lux-route-social \.social-neo-comment-bubble\s*\{\s*content-visibility: visible;\s*contain: layout style;\s*contain-intrinsic-size: auto 180px;/);
        expect(css).toMatch(/body\.lux-route-social \.social-neo-comment-actions\s*\{[^}]*pointer-events: auto;/);
        expect(css).toMatch(/body\.lux-route-social \.social-neo-comment-actions \.social-neo-btn\s*\{[^}]*pointer-events: auto;/);
    });
});