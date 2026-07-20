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
            <textarea id="news-reply-inline-${escapeHtml(token)}" name="news_reply_inline_${escapeHtml(token)}" class="newsx-textarea lux-control" rows="2" placeholder="Reply to ${escapeHtml(parentReply?.authorName || 'reply')}..." data-news-reply-input="${escapeHtml(postId)}" data-news-reply-parent="${escapeHtml(parentReplyId)}" data-news-reply-visibility="${escapeHtml(channel)}">${escapeHtml(draft)}</textarea>
            <div class="newsx-btn-row">
                <button type="button" class="newsx-btn newsx-btn-primary lux-primary-btn" data-news-reply-submit="${escapeHtml(postId)}" data-news-reply-parent="${escapeHtml(parentReplyId)}" data-news-reply-visibility="${escapeHtml(channel)}"><i class="fas fa-paper-plane"></i> Send</button>
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
                        <button type="button" class="newsx-btn lux-secondary-btn newsx-reply-reply-btn" data-news-reply-reply="${escapeHtml(replyId)}" data-post-id="${escapeHtml(postId)}" data-author-name="${escapeHtml(authorName)}" data-news-reply-visibility="${escapeHtml(channel)}"><i class="fas fa-reply"></i> Reply${Array.isArray(reply.children) && reply.children.length ? ` (${reply.children.length})` : ''}</button>
                        ${reply.viewerCanDelete ? `<button type="button" class="newsx-btn lux-secondary-btn newsx-reply-delete-btn" data-news-reply-delete="${escapeHtml(replyId)}" data-post-id="${escapeHtml(postId)}" aria-label="Delete reply"><i class="fas fa-trash"></i></button>` : ''}
                        <button type="button" class="newsx-btn lux-secondary-btn newsx-reply-report-btn" data-news-reply-report="${escapeHtml(replyId)}" data-post-id="${escapeHtml(postId)}" aria-label="Report reply"><i class="fas fa-flag"></i></button>
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

function renderReplyChannelPanel(post, visibility = 'private', open = false) {
    const postId = String(post.id || '');
    const channel = String(visibility || 'private').trim().toLowerCase() === 'public' ? 'public' : 'private';
    const isPublic = channel === 'public';
    const replies = isPublic ? post.publicReplies : post.privateReplies;
    const replyCount = String(isPublic ? (post.publicReplyCount || 0) : (post.privateReplyCount || 0));
    const draftKey = newsReplyDraftKey(postId, '', channel);
    const replyDraft = runtime.replyDrafts[draftKey] || '';
    const fieldToken = toFieldToken(`${postId}-${channel}`);
    const foldKey = `${postId}|${channel}`;
    const icon = isPublic ? 'fa-comments' : 'fa-lock';
    const summaryLabel = isPublic ? 'Public chat' : 'Private reply';
    const placeholder = isPublic
        ? 'Join the public conversation...'
        : 'Send a private response to this announcement...';
    const submitLabel = isPublic ? 'Post comment' : 'Send Private Reply';
    return `
        <details class="newsx-reply-fold newsx-private-fold"${open ? ' open' : ''} data-news-reply-channel="${escapeHtml(channel)}">
            <summary class="newsx-private-fold-summary newsx-reply-fold-summary">
                <i class="fas ${icon}"></i> ${summaryLabel}
                <span class="newsx-private-count">${escapeHtml(replyCount)}</span>
            </summary>
            <div class="newsx-private-fold-body newsx-reply-fold-body">
                ${renderReplyList(replies, post, channel)}
                ${!Array.isArray(replies) || !replies.length ? `<p class="newsx-reply-empty">${isPublic ? 'No public comments yet.' : 'Only you and staff can see private replies here.'}</p>` : ''}
                <textarea id="news-reply-${escapeHtml(fieldToken)}" name="news_reply_${escapeHtml(fieldToken)}" class="newsx-textarea lux-control" rows="2" placeholder="${escapeHtml(placeholder)}" data-news-reply-input="${escapeHtml(postId)}" data-news-reply-visibility="${escapeHtml(channel)}">${escapeHtml(replyDraft)}</textarea>
                <div class="newsx-btn-row">
                    <button type="button" class="newsx-btn newsx-btn-primary lux-primary-btn" data-news-submit-reply="${escapeHtml(postId)}" data-news-reply-visibility="${escapeHtml(channel)}"><i class="fas fa-paper-plane"></i> ${submitLabel}</button>
                </div>
            </div>
        </details>
    `;
}

function renderPostRepliesBox(post, openState = {}) {
    const mode = resolveNewsReplyMode(post);
    const postId = String(post.id || '');
    if (mode === 'none') {
        return `<p class="newsx-private-fold-muted"><i class="fas fa-ban"></i> Replies disabled</p>`;
    }
    if (mode === 'private') {
        return renderReplyChannelPanel(post, 'private', openState.private === true);
    }
    if (mode === 'public') {
        return renderReplyChannelPanel(post, 'public', openState.public === true);
    }
    const activeTab = runtime.newsReplyActiveTab[postId] === 'private' ? 'private' : 'public';
    return `
        <div class="newsx-reply-shell" data-news-reply-shell="${escapeHtml(postId)}">
            <div class="newsx-reply-tabs" role="tablist" aria-label="Reply channels">
                <button type="button" class="newsx-reply-tab ${activeTab === 'public' ? 'is-active' : ''}" data-news-reply-tab="${escapeHtml(postId)}" data-news-reply-tab-channel="public" role="tab" aria-selected="${activeTab === 'public' ? 'true' : 'false'}">
                    <i class="fas fa-comments"></i> Public
                    <span class="newsx-private-count">${escapeHtml(String(post.publicReplyCount || 0))}</span>
                </button>
                <button type="button" class="newsx-reply-tab ${activeTab === 'private' ? 'is-active' : ''}" data-news-reply-tab="${escapeHtml(postId)}" data-news-reply-tab-channel="private" role="tab" aria-selected="${activeTab === 'private' ? 'true' : 'false'}">
                    <i class="fas fa-lock"></i> Private
                    <span class="newsx-private-count">${escapeHtml(String(post.privateReplyCount || 0))}</span>
                </button>
            </div>
            <div class="newsx-reply-tab-panel">
                ${activeTab === 'public'
                    ? renderReplyChannelPanel(post, 'public', openState.public === true)
                    : renderReplyChannelPanel(post, 'private', openState.private === true)}
            </div>
        </div>
    `;
}

function collectNewsReplyFoldOpenState(postId, repliesBox) {
    const openState = { public: false, private: false };
    repliesBox?.querySelectorAll('details.newsx-reply-fold[data-news-reply-channel]').forEach((fold) => {
        const channel = String(fold.getAttribute('data-news-reply-channel') || '').trim().toLowerCase();
        if (channel === 'public' || channel === 'private') {
            openState[channel] = fold.open;
        }
    });
    if (runtime.newsReplyFoldOpen?.[`${postId}|public`] === true) openState.public = true;
    if (runtime.newsReplyFoldOpen?.[`${postId}|private`] === true) openState.private = true;
    return openState;
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

