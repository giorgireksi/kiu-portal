/* Public social runtime extracted from faculty.js.
 * Kept as a compatibility/shared source module while tests and split-runtime
 * contracts still verify this file directly outside the live HTML route stack.
 */

window.PUBLIC_SOCIAL_FACULTIES = window.PUBLIC_SOCIAL_FACULTIES || ['all', 'ECON', 'CS', 'LAW', 'MED', 'ARTS'];

function ensurePublicSocialState() {
    if (!Array.isArray(KIU_STATE.publicSocialPosts)) KIU_STATE.publicSocialPosts = [];
    if (!Array.isArray(KIU_STATE.publicSocialPages)) KIU_STATE.publicSocialPages = [];
    if (!KIU_STATE.publicSocialFollowers || typeof KIU_STATE.publicSocialFollowers !== 'object') KIU_STATE.publicSocialFollowers = {};
    if (!KIU_STATE.publicSocialUi || typeof KIU_STATE.publicSocialUi !== 'object') KIU_STATE.publicSocialUi = {};
    if (typeof KIU_STATE.publicSocialUi.facultyFilter !== 'string') KIU_STATE.publicSocialUi.facultyFilter = 'all';
    if (typeof KIU_STATE.publicSocialUi.view !== 'string') KIU_STATE.publicSocialUi.view = 'feed';
    if (typeof KIU_STATE.publicSocialUi.activeEntityType !== 'string') KIU_STATE.publicSocialUi.activeEntityType = 'feed';
    if (typeof KIU_STATE.publicSocialUi.activeEntityId !== 'string') KIU_STATE.publicSocialUi.activeEntityId = '';
    if (typeof KIU_STATE.publicSocialUi.composeAs !== 'string') KIU_STATE.publicSocialUi.composeAs = 'profile';
    if (typeof KIU_STATE.publicSocialUi.pageSearch !== 'string') KIU_STATE.publicSocialUi.pageSearch = '';
    if (!KIU_STATE.publicSocialDraftFiles || typeof KIU_STATE.publicSocialDraftFiles !== 'object') KIU_STATE.publicSocialDraftFiles = {};
    if (!KIU_STATE.publicSocialSeeded) {
        KIU_STATE.publicSocialSeeded = true;
    }
}

function ensurePublicSocialUiState() {
    ensurePublicSocialState();
    return KIU_STATE.publicSocialUi;
}

function getPublicSocialDraftFile() {
    ensurePublicSocialState();
    return KIU_STATE.publicSocialDraftFiles.composer || null;
}

function clearPublicSocialDraftFile() {
    ensurePublicSocialState();
    delete KIU_STATE.publicSocialDraftFiles.composer;
}

function ensurePublicSocialFileInput() {
    let input = document.getElementById('public-social-file-input');
    if (!input) {
        input = document.createElement('input');
        input.type = 'file';
        input.id = 'public-social-file-input';
        input.accept = 'image/*';
        input.style.display = 'none';
        document.body.appendChild(input);
    }
    return input;
}

function pickPublicSocialFile() {
    const input = ensurePublicSocialFileInput();
    input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            ensurePublicSocialState();
            KIU_STATE.publicSocialDraftFiles.composer = {
                id: `public_social_${Date.now()}`,
                name: file.name,
                type: file.type,
                size: file.size,
                dataUrl: String(reader.result || ''),
                uploadedAt: new Date().toISOString()
            };
            const label = document.getElementById('public-social-file-label');
            if (label) label.innerHTML = `<i class="fas fa-image"></i> ${escapeHtml(file.name)}`;
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

function getPublicSocialPageById(pageId) {
    ensurePublicSocialState();
    return KIU_STATE.publicSocialPages.find(page => String(page.id) === String(pageId)) || null;
}

function getPublicSocialEntityByTypeAndId(entityType, entityId) {
    const normalizedType = String(entityType || '').toLowerCase();
    if (normalizedType === 'page') return getPublicSocialPageById(entityId);
    if (normalizedType === 'profile') {
        const normalizedEntityId = String(entityId || '').replace(/^profile:/i, '');
        const user = getPortalMessengerUserById(normalizedEntityId) || (getCurrentUser() && String(getCurrentUser().id) === String(normalizedEntityId) ? getCurrentUser() : null);
        if (!user) return null;
        const facultyCode = normalizeFacultyCode(user.facultyCode || user.faculty || getCurrentFaculty(), getCurrentFaculty());
        return {
            id: getPublicSocialProfileScopeId(user.id),
            type: 'profile',
            ownerId: String(user.id),
            name: getPublicSocialDisplayName(user),
            facultyCode,
            facultyName: getFacultyLabel(facultyCode),
            description: `${getPortalMessengerRoleLabel(user.role)} profile`,
            createdAt: null,
            followers: []
        };
    }
    return null;
}

function getPublicSocialCurrentComposeTarget(currentUser) {
    ensurePublicSocialState();
    const selected = String(KIU_STATE.publicSocialUi.composeAs || 'profile');
    if (selected === 'profile') {
        const facultyCode = normalizeFacultyCode(currentUser?.facultyCode || currentUser?.faculty || getCurrentFaculty(), getCurrentFaculty());
        return {
            type: 'profile',
            id: String(currentUser?.id || ''),
            name: getPublicSocialDisplayName(currentUser),
            facultyCode,
            facultyName: getFacultyLabel(facultyCode)
        };
    }
    const page = getPublicSocialPageById(selected);
    if (!page) return null;
    return {
        type: 'page',
        id: page.id,
        name: page.name,
        facultyCode: page.facultyCode,
        facultyName: page.facultyName,
        ownerId: page.ownerId,
        ownerName: page.ownerName
    };
}

function getPublicSocialManagedPages(currentUserId) {
    ensurePublicSocialState();
    return KIU_STATE.publicSocialPages.filter(page => String(page.ownerId || '') === String(currentUserId || ''));
}

function isPublicSocialFollowingTarget(targetType, targetId, userId) {
    ensurePublicSocialState();
    const key = getPublicSocialScopeKey(targetType, targetId);
    const followers = Array.isArray(KIU_STATE.publicSocialFollowers[key]) ? KIU_STATE.publicSocialFollowers[key].map(item => String(item)) : [];
    return followers.includes(String(userId || ''));
}

function togglePublicSocialTargetFollow(targetType, targetId) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    ensurePublicSocialState();
    const key = getPublicSocialScopeKey(targetType, targetId);
    if (!Array.isArray(KIU_STATE.publicSocialFollowers[key])) KIU_STATE.publicSocialFollowers[key] = [];
    const userId = String(currentUser.id);
    if (KIU_STATE.publicSocialFollowers[key].map(item => String(item)).includes(userId)) {
        KIU_STATE.publicSocialFollowers[key] = KIU_STATE.publicSocialFollowers[key].filter(item => String(item) !== userId);
    } else {
        KIU_STATE.publicSocialFollowers[key].push(userId);
    }
    saveState();
    renderPublicSocialPage();
}

function setPublicSocialView(view, entityType = 'feed', entityId = '') {
    ensurePublicSocialState();
    KIU_STATE.publicSocialUi.view = view;
    KIU_STATE.publicSocialUi.activeEntityType = entityType;
    KIU_STATE.publicSocialUi.activeEntityId = String(entityId || '');
    saveState();
    renderPublicSocialPage();
}

function openPublicSocialEntity(entityType, entityId) {
    setPublicSocialView('entity', entityType, entityId);
}

function createPublicSocialPage() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert('Please log in first.');
        return;
    }
    const name = String(document.getElementById('public-social-page-name')?.value || '').trim();
    const facultyValue = String(document.getElementById('public-social-page-faculty')?.value || 'all').trim();
    const description = String(document.getElementById('public-social-page-description')?.value || '').trim();
    if (!name) {
        alert('Please enter a page name.');
        return;
    }
    ensurePublicSocialState();
    const facultyCode = facultyValue === 'all' ? 'all' : normalizeFacultyCode(facultyValue, getCurrentFaculty());
    const page = normalizePublicSocialPage({
        id: `public_page_${Date.now()}`,
        name,
        ownerId: String(currentUser.id),
        ownerName: getPublicSocialDisplayName(currentUser),
        facultyCode,
        description,
        createdAt: new Date().toISOString(),
        followers: [String(currentUser.id)]
    });
    KIU_STATE.publicSocialPages.unshift(page);
    KIU_STATE.publicSocialUi.composeAs = page.id;
    const nameEl = document.getElementById('public-social-page-name');
    const descEl = document.getElementById('public-social-page-description');
    if (nameEl) nameEl.value = '';
    if (descEl) descEl.value = '';
    saveState();
    renderPublicSocialPage();
}


function createPublicSocialPost() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert('Please log in first.');
        return;
    }
    const text = String(document.getElementById('public-social-text')?.value || '').trim();
    const facultyFilter = String(document.getElementById('public-social-audience')?.value || 'all').trim();
    const file = getPublicSocialDraftFile();
    if (!text && !file) {
        alert('Please write a post or attach an image.');
        return;
    }

    ensurePublicSocialState();
    const currentFaculty = normalizeFacultyCode(currentUser.facultyCode || currentUser.faculty || getCurrentFaculty(), getCurrentFaculty());
    const audienceFacultyCode = facultyFilter === 'all' ? 'all' : normalizeFacultyCode(facultyFilter, currentFaculty);
    KIU_STATE.publicSocialPosts.unshift({
        id: `public_social_post_${Date.now()}`,
        authorId: String(currentUser.id),
        authorName: currentUser.nameEn || currentUser.name || currentUser.email || currentUser.id,
        authorRole: currentUser.role || 'student',
        authorFacultyCode: currentFaculty,
        authorFacultyName: getFacultyLabel(currentFaculty),
        audienceFacultyCode,
        audienceFacultyName: audienceFacultyCode === 'all' ? 'All Faculties' : getFacultyLabel(audienceFacultyCode),
        text,
        image: cloneStoredFile(file),
        likes: [],
        comments: [],
        createdAt: new Date().toISOString()
    });

    const textEl = document.getElementById('public-social-text');
    const fileLabel = document.getElementById('public-social-file-label');
    if (textEl) textEl.value = '';
    if (fileLabel) fileLabel.textContent = 'No image selected';
    clearPublicSocialDraftFile();
    saveState();
    renderPublicSocialPage();
}

function togglePublicSocialLike(postId) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    ensurePublicSocialState();
    const post = KIU_STATE.publicSocialPosts.find(item => String(item.id) === String(postId));
    if (!post) return;
    const userId = String(currentUser.id);
    post.likes = Array.isArray(post.likes) ? post.likes : [];
    if (post.likes.includes(userId)) {
        post.likes = post.likes.filter(id => id !== userId);
    } else {
        post.likes.push(userId);
    }
    saveState();
    renderPublicSocialPage();
}

function addPublicSocialComment(postId) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    ensurePublicSocialState();
    const post = KIU_STATE.publicSocialPosts.find(item => String(item.id) === String(postId));
    if (!post) return;
    const input = document.getElementById(`public-social-comment-${toDomToken(postId)}`);
    const text = String(input?.value || '').trim();
    if (!text) return;
    post.comments = Array.isArray(post.comments) ? post.comments : [];
    post.comments.push({
        id: `public_comment_${Date.now()}`,
        authorId: String(currentUser.id),
        authorName: currentUser.nameEn || currentUser.name || currentUser.id,
        text,
        createdAt: new Date().toISOString()
    });
    if (input) input.value = '';
    saveState();
    renderPublicSocialPage();
}

function deletePublicSocialPost(postId) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    ensurePublicSocialState();
    const post = KIU_STATE.publicSocialPosts.find(item => String(item.id) === String(postId));
    if (!post) return;
    const canDelete = canManageLmsGroupContent() || String(post.authorId || '') === String(currentUser.id);
    if (!canDelete) {
        alert('You can only delete your own posts unless you are staff.');
        return;
    }
    KIU_STATE.publicSocialPosts = KIU_STATE.publicSocialPosts.filter(item => String(item.id) !== String(postId));
    saveState();
    renderPublicSocialPage();
}

function getPublicSocialVisiblePosts(facultyFilter = 'all') {
    ensurePublicSocialState();
    const uiState = ensurePublicSocialUiState();
    const normalizedFilter = String(facultyFilter || 'all').trim().toUpperCase();
    const currentUser = getCurrentUser();
    const currentUserId = String(currentUser?.id || '');
    const activeView = String(uiState.view || 'feed');
    const activeType = String(uiState.activeEntityType || 'feed');
    const activeId = String(uiState.activeEntityId || '');
    const followingOnly = activeView === 'following';
    const followingTargets = currentUserId
        ? Object.keys(KIU_STATE.publicSocialFollowers || {}).filter(key => {
            const [scopeType, ...scopeIdParts] = String(key).split(':');
            return isPublicSocialFollowingTarget(scopeType, scopeIdParts.join(':'), currentUserId);
        })
        : [];
    return KIU_STATE.publicSocialPosts
        .slice()
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .filter(post => {
            const audience = String(post.audienceFacultyCode || 'all').toUpperCase();
            const author = String(post.authorFacultyCode || post.postedByFacultyCode || 'all').toUpperCase();
            if (normalizedFilter !== 'ALL' && audience !== 'ALL' && audience !== normalizedFilter && author !== normalizedFilter) {
                return false;
            }
            if (activeView === 'entity' && activeType !== 'feed') {
                if (String(post.scopeType || 'profile') !== activeType) return false;
                if (String(post.scopeId || '') !== activeId) return false;
            }
            if (followingOnly) {
                const scopeKey = getPublicSocialScopeKey(post.scopeType || 'profile', post.scopeId || '');
                return followingTargets.includes(scopeKey);
            }
            return true;
        });
}

function isPublicSocialRootRenderable() {
    const root = document.getElementById('public-social-root');
    if (!root) return false;
    const pathname = String(window.location.pathname || '').replace(/\\/g, '/').toLowerCase();
    if (pathname.endsWith('/social.html') || pathname.endsWith('social.html')) return true;
    const page = document.getElementById('page-social') || root.closest('.page-section');
    if (!page) return true;
    if (page.hidden) return false;
    const style = window.getComputedStyle ? window.getComputedStyle(page) : null;
    if (style && (style.display === 'none' || style.visibility === 'hidden')) return false;
    return page.classList.contains('active-page') || (page.getClientRects ? page.getClientRects().length > 0 : true);
}

function renderPublicSocialPage() {
    const root = document.getElementById('public-social-root');
    if (!root || !isPublicSocialRootRenderable()) return;
    const currentUser = getCurrentUser();
    if (!currentUser) {
        root.innerHTML = '<div class="social-empty public-social-empty"><div class="social-empty-title public-social-empty-title">Sign in to use the campus social workspace.</div></div>';
        return;
    }

    ensurePublicSocialState();
    const uiState = ensurePublicSocialUiState();
    const managedPages = getPublicSocialManagedPages(currentUser.id);
    const composeTarget = getPublicSocialCurrentComposeTarget(currentUser);
    if (!composeTarget) {
        KIU_STATE.publicSocialUi.composeAs = 'profile';
    }
    const activeEntityType = String(uiState.activeEntityType || 'feed');
    const activeEntityId = String(uiState.activeEntityId || '');
    const activeEntity = uiState.view === 'entity' ? getPublicSocialEntityByTypeAndId(activeEntityType, activeEntityId) : null;
    const visiblePosts = getPublicSocialVisiblePosts(uiState.facultyFilter || 'all');
    const currentProfileScopeId = getPublicSocialProfileScopeId(currentUser.id);
    const composeOptions = [
        `<option value="profile" ${String(KIU_STATE.publicSocialUi.composeAs || 'profile') === 'profile' ? 'selected' : ''}>${escapeHtml(getPublicSocialDisplayName(currentUser))} profile</option>`,
        ...managedPages.map(page => `<option value="${escapeHtml(page.id)}" ${String(KIU_STATE.publicSocialUi.composeAs || '') === String(page.id) ? 'selected' : ''}>${escapeHtml(page.name)}</option>`)
    ].join('');
    const facultyOptions = (window.PUBLIC_SOCIAL_FACULTIES || ['all']).map(code => {
        const value = String(code || 'all').toLowerCase() === 'all' ? 'all' : normalizeFacultyCode(code, getCurrentFaculty());
        const label = value === 'all' ? 'All Faculties' : getFacultyLabel(value);
        return `<option value="${escapeHtml(value)}" ${String(uiState.facultyFilter || 'all') === value ? 'selected' : ''}>${escapeHtml(label)}</option>`;
    }).join('');
    const pageCards = managedPages.length
        ? managedPages.map(page => {
            const followerCount = Array.isArray(KIU_STATE.publicSocialFollowers[getPublicSocialScopeKey('page', page.id)])
                ? KIU_STATE.publicSocialFollowers[getPublicSocialScopeKey('page', page.id)].length
                : (Array.isArray(page.followers) ? page.followers.length : 0);
            return `
                <button type="button" class="social-card public-social-page-card${uiState.view === 'entity' && activeEntityType === 'page' && activeEntityId === String(page.id) ? ' is-active' : ''}" data-legacy-click="openPublicSocialEntity('page', '${escapeHtml(page.id)}')">
                    <div class="public-social-page-title">${escapeHtml(page.name)}</div>
                    <div class="public-social-page-copy">${escapeHtml(page.description || page.facultyName || 'Page')}</div>
                    <div class="public-social-page-meta">${followerCount} follower${followerCount === 1 ? '' : 's'}</div>
                </button>
            `;
        }).join('')
        : '<div class="social-empty public-social-empty"><div class="social-empty-copy public-social-empty-copy">No pages yet. Create the first real page when you need one.</div></div>';

    const postMarkup = visiblePosts.length
        ? visiblePosts.map(post => {
            const likeCount = Array.isArray(post.likes) ? post.likes.length : 0;
            const commentCount = Array.isArray(post.comments) ? post.comments.length : 0;
            const scopeType = String(post.scopeType || 'profile');
            const scopeId = String(post.scopeId || '');
            const isLiked = Array.isArray(post.likes) && post.likes.map(id => String(id)).includes(String(currentUser.id));
            const ownScope = scopeType === 'profile'
                ? scopeId === currentProfileScopeId
                : String(post.postedById || '') === String(currentUser.id);
            const canDelete = currentUser.role === USER_ROLES.ADMIN
                || canManageLmsGroupContent()
                || String(post.postedById || post.authorId || '') === String(currentUser.id);
            const following = isPublicSocialFollowingTarget(scopeType, scopeId, currentUser.id);
            return `
                <article class="social-post-card public-social-post-card">
                    <div class="public-social-post-head">
                        <div class="public-social-post-head-main">
                            <div class="public-social-post-title-row">
                                <button type="button" class="public-social-scope-btn social-post-author-name" data-legacy-click="openPublicSocialEntity('${scopeType}', '${escapeHtml(scopeId)}')">${escapeHtml(post.scopeName || post.authorName || 'Portal post')}</button>
                                <span class="social-post-meta">${escapeHtml(formatLmsDateTime(post.createdAt))}</span>
                            </div>
                            <div class="public-social-post-byline">
                                Posted by ${escapeHtml(post.postedByName || post.authorName || 'Portal user')}
                                ${post.audienceFacultyCode && String(post.audienceFacultyCode).toLowerCase() !== 'all' ? ` for ${escapeHtml(getFacultyLabel(post.audienceFacultyCode))}` : ' for all faculties'}
                            </div>
                        </div>
                        <div class="public-social-post-actions">
                            ${ownScope ? '' : `<button type="button" class="kiu-btn-outline" data-legacy-click="togglePublicSocialTargetFollow('${scopeType}', '${escapeHtml(scopeId)}')">${following ? 'Following' : 'Follow'}</button>`}
                            ${canDelete ? `<button type="button" class="kiu-btn-outline" data-legacy-click="deletePublicSocialPost('${escapeHtml(post.id)}')"><i class="fas fa-trash"></i> Delete</button>` : ''}
                        </div>
                    </div>
                    ${post.text ? `<div class="social-post-text public-social-post-text">${escapeHtml(post.text)}</div>` : ''}
                    ${post.image?.dataUrl ? `<div class="social-post-media public-social-post-media"><img src="${post.image.dataUrl}" alt="Post image"></div>` : ''}
                    <div class="public-social-reaction-row">
                        <button type="button" class="${isLiked ? 'kiu-btn-blue' : 'kiu-btn-outline'}" data-legacy-click="togglePublicSocialLike('${escapeHtml(post.id)}')"><i class="fas fa-heart"></i> ${likeCount} Like${likeCount === 1 ? '' : 's'}</button>
                        <span class="public-social-comment-count">${commentCount} comment${commentCount === 1 ? '' : 's'}</span>
                    </div>
                    <div class="public-social-comment-list">
                        ${(post.comments || []).map(comment => `
                            <div class="social-comment-card public-social-comment-card">
                                <div class="social-comment-author public-social-comment-author">${escapeHtml(comment.authorName || 'Portal user')}</div>
                                <div class="social-comment-text public-social-comment-text">${escapeHtml(comment.text || '')}</div>
                            </div>
                        `).join('')}
                        <div class="public-social-comment-compose">
                            <input id="public-social-comment-${toDomToken(post.id)}" class="social-input public-social-comment-input" type="text" placeholder="Add a real comment...">
                            <button type="button" class="kiu-btn-outline" data-legacy-click="addPublicSocialComment('${escapeHtml(post.id)}')">Comment</button>
                        </div>
                    </div>
                </article>
            `;
        }).join('')
        : `
            <div class="social-empty public-social-empty">
                <div class="social-empty-title public-social-empty-title">No social posts yet</div>
                <div class="social-empty-copy public-social-empty-copy">This is the real empty state. Create a page or publish the first real update when you're ready.</div>
            </div>
        `;

    root.innerHTML = `
        <div class="public-social-shell">
            <div class="public-social-main">
                <div class="surface-card public-social-card public-social-hero">
                    <div class="public-social-hero-head">
                        <div>
                            <div class="public-social-hero-title">${uiState.view === 'entity' && activeEntity ? escapeHtml(activeEntity.name) : 'Campus Social'}</div>
                            <div class="public-social-hero-copy">${uiState.view === 'entity' && activeEntity ? escapeHtml(activeEntity.description || 'Real page view') : 'A real social workspace with no seeded demo content.'}</div>
                        </div>
                        <div class="public-social-hero-actions">
                            <button type="button" class="${uiState.view === 'feed' ? 'kiu-btn-blue' : 'kiu-btn-outline'}" data-legacy-click="setPublicSocialView('feed')">Feed</button>
                            <button type="button" class="${uiState.view === 'following' ? 'kiu-btn-blue' : 'kiu-btn-outline'}" data-legacy-click="setPublicSocialView('following')">Following</button>
                            ${uiState.view === 'entity' ? `<button type="button" class="kiu-btn-outline" data-legacy-click="setPublicSocialView('feed')">Back to Feed</button>` : ''}
                        </div>
                    </div>
                    <div class="public-social-stats">
                        <div class="schedule-chip"><i class="fas fa-file-alt"></i> ${KIU_STATE.publicSocialPosts.length} post${KIU_STATE.publicSocialPosts.length === 1 ? '' : 's'}</div>
                        <div class="schedule-chip"><i class="fas fa-flag"></i> ${KIU_STATE.publicSocialPages.length} page${KIU_STATE.publicSocialPages.length === 1 ? '' : 's'}</div>
                        <label class="public-social-filter-label">
                            Faculty
                            <select class="social-select" data-legacy-change="KIU_STATE.publicSocialUi.facultyFilter=this.value; saveState(); renderPublicSocialPage();">
                                ${facultyOptions}
                            </select>
                        </label>
                    </div>
                </div>

                <div class="surface-card public-social-card">
                    <div class="social-panel-title">Create Post</div>
                    <div class="public-social-field-row">
                        <label class="public-social-field">
                            Post As
                            <select class="social-select" data-legacy-change="KIU_STATE.publicSocialUi.composeAs=this.value; saveState(); renderPublicSocialPage();">
                                ${composeOptions}
                            </select>
                        </label>
                        <label class="public-social-field">
                            Audience
                            <select id="public-social-audience" class="social-select">
                                ${facultyOptions}
                            </select>
                        </label>
                    </div>
                    <textarea id="public-social-text" class="social-textarea" placeholder="Share a real update..."></textarea>
                    <div class="public-social-file-row">
                        <div id="public-social-file-label" class="social-file-label">${getPublicSocialDraftFile()?.name ? `<i class="fas fa-image"></i> ${escapeHtml(getPublicSocialDraftFile().name)}` : 'No image selected'}</div>
                        <div class="public-social-post-actions">
                            <button type="button" class="kiu-btn-outline" data-legacy-click="pickPublicSocialFile()"><i class="fas fa-image"></i> Add Image</button>
                            <button type="button" class="kiu-btn-blue" data-legacy-click="createPublicSocialPost()"><i class="fas fa-paper-plane"></i> Publish</button>
                        </div>
                    </div>
                </div>

                <div class="public-social-post-list">
                    ${postMarkup}
                </div>
            </div>

            <aside class="public-social-sidebar">
                <div class="surface-card public-social-card">
                    <div>
                        <div class="social-panel-title">${escapeHtml(getPublicSocialDisplayName(currentUser))}</div>
                        <div class="social-panel-copy">${escapeHtml(getPortalMessengerRoleLabel(currentUser.role))} · ${escapeHtml(getFacultyLabel(normalizeFacultyCode(currentUser.facultyCode || currentUser.faculty || getCurrentFaculty(), getCurrentFaculty())))}</div>
                    </div>
                    <button type="button" class="${uiState.view === 'entity' && activeEntityType === 'profile' && activeEntityId === currentProfileScopeId ? 'kiu-btn-blue' : 'kiu-btn-outline'}" data-legacy-click="openPublicSocialEntity('profile', '${currentProfileScopeId}')">Open My Profile Feed</button>
                </div>

                <div class="surface-card public-social-card">
                    <div class="social-panel-title">My Pages</div>
                    <div class="public-social-page-list">${pageCards}</div>
                </div>

                <div class="surface-card public-social-card">
                    <div class="social-panel-title">Create Page</div>
                    <input id="public-social-page-name" type="text" class="social-input" placeholder="Page name">
                    <select id="public-social-page-faculty" class="social-select">
                        ${facultyOptions}
                    </select>
                    <textarea id="public-social-page-description" class="social-textarea" placeholder="What is this page for?"></textarea>
                    <button type="button" class="kiu-btn-blue" data-legacy-click="createPublicSocialPage()"><i class="fas fa-plus"></i> Create Page</button>
                </div>
            </aside>
        </div>
    `;
}

let publicSocialRenderBoostHandle = null;
function schedulePublicSocialRenderBoost() {
    if (!isPublicSocialRootRenderable()) return;
    if (publicSocialRenderBoostHandle) return;
    const schedule = window.requestAnimationFrame || ((cb) => window.setTimeout(cb, 16));
    publicSocialRenderBoostHandle = schedule(() => {
        publicSocialRenderBoostHandle = null;
        if (!isPublicSocialRootRenderable()) return;
        if (typeof window.queuePublicSocialRender === 'function') {
            window.queuePublicSocialRender();
            return;
        }
        renderPublicSocialPage();
    });
}
