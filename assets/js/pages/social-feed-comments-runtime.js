/* READABILITY: social feed comment thread helpers (peeled from social-feed.js).
 * Sections: Factory | Render | Patch | Reply
 * See docs/human-maintainability.md (H2). */
(function initSocialFeedCommentsRuntime() {
    if (window.__KIU_SOCIAL_FEED_COMMENTS_LOADED) return;
    window.__KIU_SOCIAL_FEED_COMMENTS_LOADED = true;

    // --- READABILITY: Factory ---
    function createKiuSocialFeedCommentsApi(deps) {
        const {
            text,
            escape,
            displayName,
            accountById,
            currentUserId,
            currentUser,
            avatar,
            when,
            postKey,
            state,
            reactionEmoji,
            removePortalSocialComment,
            setPortalSocialFlash
        } = deps || {};

        // --- READABILITY: Render ---
        function commentReactionType(comment) {
            const reactions = comment?.reactions && typeof comment.reactions === 'object' ? comment.reactions : {};
            const userId = currentUserId();
            return Object.keys(reactions).find((type) => Array.isArray(reactions[type]) && reactions[type].some((id) => text(id) === userId)) || '';
        }
        
        /**
         * Renders a single comment bubble with reactions, reply button, and nested replies.
         * Recursively calls itself for child replies, capping depth CSS class at 3.
         * @param {Object} comment  - Comment object with id, body, authorUserId, replies[], reactions.
         * @param {Object} post     - Parent post (used for data-post-id attributes).
         * @param {number} [depth]  - Current nesting depth (0 = root comment).
         * @returns {string} HTML `<article>` markup.
         */
        /**
         * Renders the inline (Reddit-style) reply composer shown directly beneath a
         * comment when it is the active reply target. Carries the parent comment id
         * on the form so the submit handler attaches the reply correctly.
         */
        function renderInlineReplyForm(comment, post, context) {
            const normalizedPostId = postKey(post);
            const formType = context === 'dialog' ? 'dialog-comment' : 'comment';
            const author = displayName(accountById(comment.authorUserId) || { id: comment.authorUserId, displayName: comment.authorName || comment.authorUserId });
            const inputId = `social-reply-input-${text(comment.id)}`;
            return `
                <form class="social-neo-comment-reply-form" data-form="${formType}" data-post-id="${escape(normalizedPostId)}" data-reply-comment-id="${escape(text(comment.id))}" data-reply-author="${escape(author)}">
                    <input class="social-neo-input lux-modern-field" id="${escape(inputId)}" type="text" name="commentBody" placeholder="Reply to @${escape(author)}..." aria-label="Reply to @${escape(author)}..." value="" autocomplete="off">
                    <div class="social-neo-comment-reply-form-actions">
                        <button class="lux-secondary-btn lux-secondary-btn-sm lux-secondary-btn" type="button" data-action="comment-reply-cancel" data-post-id="${escape(normalizedPostId)}" data-comment-id="${escape(text(comment.id))}">Cancel</button>
                        <button class="lux-secondary-btn lux-secondary-btn-sm lux-primary-btn" type="submit">Reply</button>
                    </div>
                    <input type="hidden" name="postId" value="${escape(normalizedPostId)}">
                </form>
            `;
        }
        
        /** The 5 emoji reaction buttons for a comment (extracted so they can be patched in place). */
        function renderCommentReactionButtons(comment, normalizedPostId) {
            const commentReaction = commentReactionType(comment);
            const reactionCounts = comment?.reactionCounts || {};
            return ['like', 'love', 'laugh', 'wow', 'support'].map((reactionType) => `
                <button class="lux-secondary-btn lux-secondary-btn-sm ${commentReaction === reactionType ? 'lux-primary-btn' : 'lux-secondary-btn'}" type="button" data-action="comment-react" data-post-id="${escape(normalizedPostId)}" data-comment-id="${escape(text(comment.id))}" data-reaction-type="${escape(reactionType)}">
                    <span>${reactionEmoji(reactionType)}</span> ${escape(text(reactionCounts[reactionType] || 0))}
                </button>
            `).join('');
        }
        
        function renderCommentNode(comment, post, depth = 0, context = 'feed') {
            const normalizedPostId = postKey(post);
            const commentAuthor = accountById(comment.authorUserId) || { id: comment.authorUserId, displayName: comment.authorName || comment.authorUserId };
            const replyCount = Array.isArray(comment.replies) ? comment.replies.length : 0;
            const depthClass = depth ? ` is-reply social-neo-comment-depth-${Math.min(depth, 3)}` : '';
            const viewer = currentUser();
            const canDeleteComment = Boolean(
                viewer && comment?.authorUserId &&
                (text(viewer.id) === text(comment.authorUserId) || String(viewer.role || '').toLowerCase() === 'admin')
            );
            const isReplyTarget = text(state().ui?.commentReplyTargetByPost?.[normalizedPostId]?.commentId) === text(comment.id);
            return `
                <article class="social-neo-comment${depthClass}" data-comment-id="${escape(text(comment.id))}">
                    <div class="social-neo-comment-row">
                        ${avatar(commentAuthor, 'social-neo-avatar-sm')}
                        <div class="social-neo-comment-body">
                            <div class="social-neo-comment-bubble">
                                <div class="social-neo-comment-head">
                                    <strong>${escape(displayName(commentAuthor))}</strong>
                                    <span>${escape(when(comment.createdAt))}</span>
                                </div>
                                <p>${escape(comment.body || comment.text || '')}</p>
                            </div>
                            <div class="social-neo-comment-actions">
                                <span class="social-neo-comment-reactions">${renderCommentReactionButtons(comment, normalizedPostId)}</span>
                                <button class="lux-secondary-btn lux-secondary-btn-sm lux-secondary-btn social-neo-comment-reply-btn${isReplyTarget ? ' is-active' : ''}" type="button" data-action="comment-reply" data-post-id="${escape(normalizedPostId)}" data-comment-id="${escape(text(comment.id))}" data-author-name="${escape(displayName(commentAuthor))}">
                                    <i class="fas fa-reply"></i> <span class="social-neo-comment-reply-label">Reply${replyCount ? ` (${replyCount})` : ''}</span>
                                </button>
                                ${canDeleteComment ? `
                                <button class="lux-secondary-btn lux-secondary-btn-sm lux-secondary-btn social-neo-comment-delete-btn" type="button" data-action="comment-delete" data-post-id="${escape(normalizedPostId)}" data-comment-id="${escape(text(comment.id))}" aria-label="Delete comment">
                                    <i class="fas fa-trash"></i>
                                </button>
                                ` : ''}
                                <button class="lux-secondary-btn lux-secondary-btn-sm lux-secondary-btn" type="button" data-action="comment-report" data-post-id="${escape(normalizedPostId)}" data-comment-id="${escape(text(comment.id))}">
                                    <i class="fas fa-flag"></i>
                                </button>
                            </div>
                            ${isReplyTarget ? renderInlineReplyForm(comment, post, context) : ''}
                        </div>
                    </div>
                    ${Array.isArray(comment.replies) && comment.replies.length ? `<div class="social-neo-comment-children">${comment.replies.map((reply) => renderCommentNode(reply, post, depth + 1, context)).join('')}</div>` : ''}
                </article>
            `;
        }
        
        /**
         * Renders the full comment thread below a post card.
         * Delegates to renderCommentNode for each root-level comment.
         * @param {Array<Object>} comments - Root-level comments array.
         * @param {Object} post - Parent post.
         * @returns {string} HTML or empty string if no comments.
         */
        function renderCommentThread(comments, post, context = 'feed') {
            const roots = Array.isArray(comments) ? comments : [];
            if (!roots.length) return '';
            return `<div class="social-neo-comment-list">${roots.map((comment) => renderCommentNode(comment, post, 0, context)).join('')}</div>`;
        }
        
        
        // --- READABILITY: Patch ---
        function dialogCommentEl(commentId) {
            const thread = document.getElementById('lux-glass-dialog-comment-thread');
            return thread?.querySelector(`article.social-neo-comment[data-comment-id="${CSS.escape(text(commentId))}"]`) || null;
        }
        function patchCommentReactions(updatedPost, commentId) {
            const article = dialogCommentEl(commentId);
            if (!article) return false;
            const span = article.querySelector(':scope > .social-neo-comment-row > .social-neo-comment-body > .social-neo-comment-actions > .social-neo-comment-reactions');
            if (!span) return false;
            const fresh = findCommentInThread(updatedPost?.comments, commentId);
            if (!fresh) return false;
            span.innerHTML = renderCommentReactionButtons(fresh, postKey(updatedPost));
            return true;
        }
        function patchCommentReactionsByIds(postId, commentId) {
            const normalizedPostId = postKey(postId);
            const normalizedCommentId = text(commentId);
            if (!normalizedPostId || !normalizedCommentId) return false;
            const feed = Array.isArray(state()?.feed) ? state().feed : [];
            const post = feed.find((entry) => text(entry?.id) === normalizedPostId);
            if (!post) return false;
            return Boolean(patchCommentReactions(post, normalizedCommentId));
        }
        // --- READABILITY: Reply ---
        function openInlineReply(post, commentId, authorName) {
            const article = dialogCommentEl(commentId);
            if (!article) return;
            const body = article.querySelector(':scope > .social-neo-comment-row > .social-neo-comment-body');
            if (!body) return;
            body.querySelector(':scope > .social-neo-comment-reply-form')?.remove();
            const comment = findCommentInThread(post?.comments, commentId) || { id: commentId, authorName };
            const holder = document.createElement('div');
            holder.innerHTML = renderInlineReplyForm(comment, post, 'dialog');
            const form = holder.firstElementChild;
            if (form) body.appendChild(form);
            article.querySelector(':scope > .social-neo-comment-row > .social-neo-comment-body > .social-neo-comment-actions .social-neo-comment-reply-btn')?.classList.add('is-active');
            window.requestAnimationFrame(() => {
                relayoutCommentTrunks();
                const input = document.getElementById(`social-reply-input-${text(commentId)}`);
                input?.focus?.({ preventScroll: true });
                const replyForm = body.querySelector(':scope > .social-neo-comment-reply-form');
                replyForm?.scrollIntoView?.({ block: 'end', behavior: 'smooth' });
            });
        }
        function closeInlineReply(commentId) {
            const article = dialogCommentEl(commentId);
            if (!article) return;
            article.querySelector(':scope > .social-neo-comment-row > .social-neo-comment-body > .social-neo-comment-reply-form')?.remove();
            article.querySelector(':scope > .social-neo-comment-row > .social-neo-comment-body > .social-neo-comment-actions .social-neo-comment-reply-btn')?.classList.remove('is-active');
            relayoutCommentTrunks();
        }
        function appendReplyNode(updatedPost, parentCommentId) {
            const article = dialogCommentEl(parentCommentId);
            if (!article) return;
            const parent = findCommentInThread(updatedPost?.comments, parentCommentId);
            const replies = Array.isArray(parent?.replies) ? parent.replies : [];
            if (!replies.length) return;
            const newest = replies[replies.length - 1];
            let children = article.querySelector(':scope > .social-neo-comment-children');
            if (!children) {
                children = document.createElement('div');
                children.className = 'social-neo-comment-children';
                article.appendChild(children);
            }
            let parentDepth = 0;
            for (let p = article.parentElement; p && !p.classList.contains('social-neo-comment-list'); p = p.parentElement) {
                if (p.classList.contains('social-neo-comment-children')) parentDepth++;
            }
            const depth = Math.min(parentDepth + 1, 3);
            const holder = document.createElement('div');
            holder.innerHTML = renderCommentNode(newest, updatedPost, depth, 'dialog');
            if (holder.firstElementChild) children.appendChild(holder.firstElementChild);
            const label = article.querySelector(':scope > .social-neo-comment-row > .social-neo-comment-body > .social-neo-comment-actions .social-neo-comment-reply-label');
            if (label) label.textContent = `Reply (${replies.length})`;
            relayoutCommentTrunks();
        }
        function patchCommentDialogCount(updatedPost) {
            const card = document.querySelector('.lux-glass-dialog-card--comments');
            const heroCopy = card?.querySelector('.social-neo-surveys-hero-copy p');
            const legacySubtitle = card?.querySelector('.lux-glass-dialog-subtitle')
                || document.querySelector('.social-photo-ig-modal .social-photo-ig-comments-subtitle');
            const subtitle = heroCopy || legacySubtitle;
            if (!subtitle && !card) return;
            const collect = (list) => (Array.isArray(list) ? list : []).reduce((n, c) => n + 1 + collect(c?.replies), 0);
            const total = collect(updatedPost?.comments);
            if (heroCopy) {
                heroCopy.textContent = total
                    ? `${total} comment${total === 1 ? '' : 's'} on this post.`
                    : 'Be the first to reply to this post.';
            } else if (legacySubtitle) {
                legacySubtitle.textContent = total ? `${total} comment${total === 1 ? '' : 's'}` : 'No comments yet';
            }
            const statStrong = card?.querySelector('.lux-glass-dialog-comment-stats article:nth-child(2) strong');
            if (statStrong) statStrong.textContent = String(total);
        }
        async function deleteCommentInline(postId, commentId) {
            if (typeof removePortalSocialComment !== 'function') {
                if (typeof setPortalSocialFlash === 'function') setPortalSocialFlash('Social runtime not ready.', 'danger');
                return;
            }
            const article = dialogCommentEl(commentId);
            const updatedPost = await removePortalSocialComment(postId, commentId);
            if (article?.parentNode) article.parentNode.removeChild(article);
            const thread = document.getElementById('lux-glass-dialog-comment-thread');
            const list = thread?.querySelector('.social-neo-comment-list');
            if (list && !list.querySelector('article.social-neo-comment')) {
                list.remove();
                if (!thread.querySelector('.social-neo-empty')) {
                    const empty = document.createElement('div');
                    empty.className = 'social-neo-empty';
                    empty.textContent = 'No comments yet. Be the first to reply.';
                    thread.appendChild(empty);
                }
            }
            if (updatedPost) patchCommentDialogCount(updatedPost);
            relayoutCommentTrunks();
        }
        function relayoutCommentTrunks(scope) {
            const root = scope || document.getElementById('lux-glass-dialog-comment-thread');
            if (!root) return;
            root.querySelectorAll('article.social-neo-comment').forEach((comment) => {
                const kids = comment.querySelector(':scope > .social-neo-comment-children');
                const avatar = comment.querySelector(':scope > .social-neo-comment-row > .social-neo-avatar');
                if (!kids || !avatar) {
                    comment.style.removeProperty('--trunk-top');
                    comment.style.removeProperty('--trunk-bottom');
                    return;
                }
                const lastChild = kids.querySelector(':scope > article.social-neo-comment:last-child');
                const lastAvatar = lastChild?.querySelector(':scope > .social-neo-comment-row > .social-neo-avatar');
                if (!lastAvatar) return;
                const cR = comment.getBoundingClientRect();
                const aR = avatar.getBoundingClientRect();
                const lR = lastAvatar.getBoundingClientRect();
                comment.style.setProperty('--trunk-top', `${Math.round(aR.bottom - cR.top + 2)}px`);
                comment.style.setProperty('--trunk-bottom', `${Math.round(cR.bottom - (lR.top + lR.height / 2))}px`);
            });
        }
        function findCommentInThread(comments, commentId) {
            const normalizedId = text(commentId);
            if (!normalizedId) return null;
            for (const comment of Array.isArray(comments) ? comments : []) {
                if (text(comment?.id) === normalizedId) return comment;
                const replyMatch = findCommentInThread(comment?.replies, normalizedId);
                if (replyMatch) return replyMatch;
            }
            return null;
        }
        

        // --- READABILITY: Export ---
        return {
            commentReactionType,
            renderInlineReplyForm,
            renderCommentReactionButtons,
            renderCommentNode,
            renderCommentThread,
            dialogCommentEl,
            patchCommentReactions,
            patchCommentReactionsByIds,
            openInlineReply,
            closeInlineReply,
            appendReplyNode,
            patchCommentDialogCount,
            deleteCommentInline,
            relayoutCommentTrunks,
            findCommentInThread
        };
    }

    window.createKiuSocialFeedCommentsApi = createKiuSocialFeedCommentsApi;
})();
