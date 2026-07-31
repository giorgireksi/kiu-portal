/* News page module: replies — classic script, shares globals with sibling news/* modules. */
function newsReplyDraftKey(postId, parentReplyId, visibility = 'private') {
    const channel = String(visibility || 'private').trim().toLowerCase() === 'public' ? 'public' : 'private';
    const base = parentReplyId ? `${postId}|${parentReplyId}` : String(postId || '');
    return `${base}|${channel}`;
}

function newsReplyTargetKey(postId, visibility = 'private') {
    const channel = String(visibility || 'private').trim().toLowerCase() === 'public' ? 'public' : 'private';
    return `${String(postId || '')}|${channel}`;
}

function renderNewsInlineReplyForm(post, parentReply, visibility = 'private') {
    const postId = String(post.id || '');
    const parentReplyId = String(parentReply?.id || '');
    const channel = String(visibility || 'private').trim().toLowerCase() === 'public' ? 'public' : 'private';
    const draftKey = newsReplyDraftKey(postId, parentReplyId, channel);
    const draft = runtime.replyDrafts[draftKey] || '';
    const token = toFieldToken(`${postId}-${parentReplyId}-${channel}`);
    return `
        <form class="newsx-reply-form" data-news-reply-form="${escapeHtml(parentReplyId)}" data-news-reply-post="${escapeHtml(postId)}" data-news-reply-visibility="${escapeHtml(channel)}">
            <textarea id="news-reply-inline-${escapeHtml(token)}" name="news_reply_inline_${escapeHtml(token)}" class="newsx-textarea lux-control" rows="1" placeholder="Reply to ${escapeHtml(parentReply?.authorName || 'reply')}..." data-news-reply-input="${escapeHtml(postId)}" data-news-reply-parent="${escapeHtml(parentReplyId)}" data-news-reply-visibility="${escapeHtml(channel)}">${escapeHtml(draft)}</textarea>
            <div class="newsx-btn-row">
                <button type="button" class="newsx-btn newsx-btn-primary lux-primary-btn home-hover-chip" data-news-reply-submit="${escapeHtml(postId)}" data-news-reply-parent="${escapeHtml(parentReplyId)}" data-news-reply-visibility="${escapeHtml(channel)}"><i class="fas fa-paper-plane"></i> Send</button>
            </div>
        </form>
    `;
}

function renderNewsReplyNode(reply, post, depth = 0, visibility = 'private') {
    if (!reply) return '';
    const postId = String(post.id || '');
    const replyId = String(reply.id || '');
    const channel = String(visibility || 'private').trim().toLowerCase() === 'public' ? 'public' : 'private';
    const authorName = reply.authorName || 'Reply';
    const authorInitial = String(authorName).charAt(0).toUpperCase() || 'R';
    const likeCount = Number(reply.reactionCounts?.like || 0);
    const viewerReaction = String(reply.viewerReaction || '');
    const isReplyTarget = String(runtime.newsReplyTargetByPost?.[newsReplyTargetKey(postId, channel)] || '') === replyId;
    const depthClass = depth ? ` is-reply newsx-reply-depth-${Math.min(depth, 3)}` : '';
    return `
        <article class="newsx-reply${depthClass}" data-news-reply-id="${escapeHtml(replyId)}">
            <div class="newsx-reply-row">
                <span class="newsx-avatar newsx-reply-avatar">${escapeHtml(authorInitial)}</span>
                <div class="newsx-reply-body">
                    <div class="newsx-reply-bubble">
                        <div class="newsx-reply-head">
                            <strong>${escapeHtml(authorName)}</strong>
                            <span>${escapeHtml(formatDateTime(reply.createdAt))}</span>
                        </div>
                        <p>${escapeHtml(reply.body || '')}</p>
                    </div>
                    <div class="newsx-reply-actions">
                        <button type="button" class="newsx-reply-like${viewerReaction === 'like' ? ' is-active' : ''}" data-news-reply-like="${escapeHtml(replyId)}" data-post-id="${escapeHtml(postId)}">Like${likeCount ? ` ${likeCount}` : ''}</button>
                        <button type="button" class="newsx-btn lux-secondary-btn home-hover-chip newsx-reply-reply-btn" data-news-reply-reply="${escapeHtml(replyId)}" data-post-id="${escapeHtml(postId)}" data-author-name="${escapeHtml(authorName)}" data-news-reply-visibility="${escapeHtml(channel)}"><i class="fas fa-reply"></i> Reply${Array.isArray(reply.children) && reply.children.length ? ` (${reply.children.length})` : ''}</button>
                        ${reply.viewerCanDelete ? `<button type="button" class="newsx-btn lux-secondary-btn home-hover-chip newsx-reply-delete-btn" data-news-reply-delete="${escapeHtml(replyId)}" data-post-id="${escapeHtml(postId)}" aria-label="Delete reply"><i class="fas fa-trash"></i></button>` : ''}
                        <button type="button" class="newsx-btn lux-secondary-btn home-hover-chip newsx-reply-report-btn" data-news-reply-report="${escapeHtml(replyId)}" data-post-id="${escapeHtml(postId)}" aria-label="Report reply"><i class="fas fa-flag"></i></button>
                    </div>
                    ${isReplyTarget ? renderNewsInlineReplyForm(post, reply, channel) : ''}
                </div>
            </div>
            ${Array.isArray(reply.children) && reply.children.length ? `<div class="newsx-reply-children">${reply.children.map(child => renderNewsReplyNode(child, post, depth + 1, channel)).join('')}</div>` : ''}
        </article>
    `;
}

function renderReplyList(replies, post, visibility = 'private') {
    if (!Array.isArray(replies) || !replies.length) return '';
    return `
        <div class="newsx-reply-list">
            ${replies.map(reply => renderNewsReplyNode(reply, post, 0, visibility)).join('')}
        </div>
    `;
}

function renderReplyChannelPanel(post, visibility = 'private') {
    const postId = String(post.id || '');
    const channel = String(visibility || 'private').trim().toLowerCase() === 'public' ? 'public' : 'private';
    const isPublic = channel === 'public';
    const replies = isPublic ? post.publicReplies : post.privateReplies;
    const draftKey = newsReplyDraftKey(postId, '', channel);
    const replyDraft = runtime.replyDrafts[draftKey] || '';
    const fieldToken = toFieldToken(`${postId}-${channel}`);
    const placeholder = isPublic
        ? 'Join the public conversation...'
        : 'Write a private comment...';
    const submitLabel = isPublic ? 'Post comment' : 'Post private comment';
    return `
        <div class="newsx-reply-tab-panel" data-news-reply-channel="${escapeHtml(channel)}" role="tabpanel">
            ${renderReplyList(replies, post, channel)}
            ${!Array.isArray(replies) || !replies.length ? `<p class="newsx-reply-empty">${isPublic ? 'No public comments yet.' : 'Only you and staff can see private comments here.'}</p>` : ''}
            <textarea id="news-reply-${escapeHtml(fieldToken)}" name="news_reply_${escapeHtml(fieldToken)}" class="newsx-textarea lux-control" rows="1" placeholder="${escapeHtml(placeholder)}" data-news-reply-input="${escapeHtml(postId)}" data-news-reply-visibility="${escapeHtml(channel)}">${escapeHtml(replyDraft)}</textarea>
            <div class="newsx-btn-row">
                <button type="button" class="newsx-btn newsx-btn-primary lux-primary-btn home-hover-chip" data-news-submit-reply="${escapeHtml(postId)}" data-news-reply-visibility="${escapeHtml(channel)}"><i class="fas fa-paper-plane"></i> ${submitLabel}</button>
            </div>
        </div>
    `;
}

function renderPostRepliesBox(post) {
    const mode = resolveNewsReplyMode(post);
    const postId = String(post.id || '');
    if (mode === 'none') {
        return `<p class="newsx-private-fold-muted"><i class="fas fa-ban"></i> Replies disabled</p>`;
    }
    const active = String(runtime.newsReplyActiveTab?.[postId] || 'public').trim().toLowerCase() === 'private'
        ? 'private'
        : 'public';
    const publicCount = String(post.publicReplyCount || 0);
    const privateCount = String(post.privateReplyCount || 0);
    return `
        <div class="newsx-reply-shell" data-news-reply-shell="${escapeHtml(postId)}">
            <div class="newsx-reply-tabs" role="tablist" aria-label="Comment channels">
                <button type="button" class="newsx-reply-tab home-hover-chip${active === 'public' ? ' is-active' : ''}" role="tab" aria-selected="${active === 'public' ? 'true' : 'false'}" data-news-reply-tab="${escapeHtml(postId)}" data-news-reply-tab-channel="public"><i class="fas fa-comments" aria-hidden="true"></i> Public <span class="newsx-private-count">${escapeHtml(publicCount)}</span></button>
                <button type="button" class="newsx-reply-tab home-hover-chip${active === 'private' ? ' is-active' : ''}" role="tab" aria-selected="${active === 'private' ? 'true' : 'false'}" data-news-reply-tab="${escapeHtml(postId)}" data-news-reply-tab-channel="private"><i class="fas fa-lock" aria-hidden="true"></i> Private <span class="newsx-private-count">${escapeHtml(privateCount)}</span></button>
            </div>
            ${renderReplyChannelPanel(post, active)}
        </div>
    `;
}

function relayoutNewsReplyTrunks(scope) {
    const root = scope || document.getElementById(ROOT_ID);
    if (!root) return;
    const articles = root.querySelectorAll('article.newsx-reply');
    articles.forEach((comment) => {
        const kids = comment.querySelector(':scope > .newsx-reply-children');
        const avatar = comment.querySelector(':scope > .newsx-reply-row > .newsx-reply-avatar');
        if (!kids || !avatar) {
            comment.style.removeProperty('--trunk-top');
            comment.style.removeProperty('--trunk-bottom');
            return;
        }
        const lastChild = kids.querySelector(':scope > article.newsx-reply:last-child');
        const lastAvatar = lastChild?.querySelector(':scope > .newsx-reply-row > .newsx-reply-avatar');
        if (!lastAvatar) return;
        const cR = comment.getBoundingClientRect();
        const aR = avatar.getBoundingClientRect();
        const lR = lastAvatar.getBoundingClientRect();
        comment.style.setProperty('--trunk-top', `${Math.round(aR.bottom - cR.top + 2)}px`);
        comment.style.setProperty('--trunk-bottom', `${Math.round(cR.bottom - (lR.top + lR.height / 2))}px`);
    });
}

