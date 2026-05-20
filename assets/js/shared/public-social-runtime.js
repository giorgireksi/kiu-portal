/* Public social runtime extracted from faculty.js. */

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
        root.innerHTML = `<div class="surface-card" style="padding:24px; text-align:center; color:var(--kiu-text-muted);">Sign in to use the campus social workspace.</div>`;
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
                <button type="button" data-legacy-click="openPublicSocialEntity('page', '${escapeHtml(page.id)}')" style="text-align:left; border:1px solid ${uiState.view === 'entity' && activeEntityType === 'page' && activeEntityId === String(page.id) ? 'rgba(10,132,255,0.35)' : '#dbe5f0'}; background:${uiState.view === 'entity' && activeEntityType === 'page' && activeEntityId === String(page.id) ? 'rgba(239,246,255,0.96)' : '#ffffff'}; border-radius:18px; padding:14px; cursor:pointer;">
                    <div style="font-size:14px; font-weight:800; color:var(--kiu-navy);">${escapeHtml(page.name)}</div>
                    <div style="font-size:12px; color:var(--kiu-text-muted); margin-top:6px;">${escapeHtml(page.description || page.facultyName || 'Page')}</div>
                    <div style="font-size:11px; color:var(--kiu-text-muted); margin-top:8px;">${followerCount} follower${followerCount === 1 ? '' : 's'}</div>
                </button>
            `;
        }).join('')
        : `<div style="padding:14px; border:1px dashed #dbe5f0; border-radius:18px; color:var(--kiu-text-muted); font-size:12px;">No pages yet. Create the first real page when you need one.</div>`;

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
                <article style="background:#ffffff; border:1px solid #dbe5f0; border-radius:24px; padding:20px; box-shadow:0 16px 32px rgba(15,23,42,0.06); display:grid; gap:14px;">
                    <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap;">
                        <div>
                            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                                <button type="button" data-legacy-click="openPublicSocialEntity('${scopeType}', '${escapeHtml(scopeId)}')" style="border:none; background:none; padding:0; cursor:pointer; font-size:16px; font-weight:900; color:var(--kiu-navy);">${escapeHtml(post.scopeName || post.authorName || 'Portal post')}</button>
                                <span style="font-size:11px; color:var(--kiu-text-muted);">${escapeHtml(formatLmsDateTime(post.createdAt))}</span>
                            </div>
                            <div style="font-size:12px; color:var(--kiu-text-muted); margin-top:4px;">
                                Posted by ${escapeHtml(post.postedByName || post.authorName || 'Portal user')}
                                ${post.audienceFacultyCode && String(post.audienceFacultyCode).toLowerCase() !== 'all' ? ` for ${escapeHtml(getFacultyLabel(post.audienceFacultyCode))}` : ' for all faculties'}
                            </div>
                        </div>
                        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                            ${ownScope ? '' : `<button type="button" class="kiu-btn-outline" data-legacy-click="togglePublicSocialTargetFollow('${scopeType}', '${escapeHtml(scopeId)}')" style="padding:8px 12px; font-size:12px;">${following ? 'Following' : 'Follow'}</button>`}
                            ${canDelete ? `<button type="button" class="kiu-btn-outline" data-legacy-click="deletePublicSocialPost('${escapeHtml(post.id)}')" style="padding:8px 12px; font-size:12px;"><i class="fas fa-trash"></i> Delete</button>` : ''}
                        </div>
                    </div>
                    ${post.text ? `<div style="white-space:pre-wrap; font-size:14px; line-height:1.65; color:var(--kiu-text-main);">${escapeHtml(post.text)}</div>` : ''}
                    ${post.image?.dataUrl ? `<div><img src="${post.image.dataUrl}" alt="Post image" style="width:100%; max-height:420px; object-fit:cover; border-radius:20px; border:1px solid #dbe5f0;"></div>` : ''}
                    <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                        <button type="button" class="${isLiked ? 'kiu-btn-blue' : 'kiu-btn-outline'}" data-legacy-click="togglePublicSocialLike('${escapeHtml(post.id)}')" style="padding:9px 14px; font-size:12px;"><i class="fas fa-heart"></i> ${likeCount} Like${likeCount === 1 ? '' : 's'}</button>
                        <span style="font-size:12px; color:var(--kiu-text-muted);">${commentCount} comment${commentCount === 1 ? '' : 's'}</span>
                    </div>
                    <div style="display:grid; gap:10px;">
                        ${(post.comments || []).map(comment => `
                            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:16px; padding:12px 14px;">
                                <div style="font-size:12px; font-weight:800; color:var(--kiu-navy);">${escapeHtml(comment.authorName || 'Portal user')}</div>
                                <div style="font-size:13px; color:var(--kiu-text-main); margin-top:6px; white-space:pre-wrap;">${escapeHtml(comment.text || '')}</div>
                            </div>
                        `).join('')}
                        <div style="display:flex; gap:10px; align-items:flex-start; flex-wrap:wrap;">
                            <input id="public-social-comment-${toDomToken(post.id)}" type="text" placeholder="Add a real comment..." style="flex:1; min-width:220px; border:1px solid var(--kiu-border); border-radius:14px; padding:11px 12px; outline:none;">
                            <button type="button" class="kiu-btn-outline" data-legacy-click="addPublicSocialComment('${escapeHtml(post.id)}')" style="padding:10px 14px; font-size:12px;">Comment</button>
                        </div>
                    </div>
                </article>
            `;
        }).join('')
        : `
            <div style="background:#ffffff; border:1px dashed #dbe5f0; border-radius:24px; padding:32px; text-align:center; color:var(--kiu-text-muted);">
                <div style="font-size:20px; font-weight:900; color:var(--kiu-navy);">No social posts yet</div>
                <div style="font-size:13px; margin-top:8px;">This is the real empty state. Create a page or publish the first real update when you're ready.</div>
            </div>
        `;

    root.innerHTML = `
        <div style="display:grid; grid-template-columns:minmax(0, 1.8fr) minmax(280px, 0.95fr); gap:24px;">
            <div style="display:grid; gap:20px;">
                <div class="surface-card" style="padding:24px;">
                    <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap;">
                        <div>
                            <div style="font-size:28px; font-weight:900; color:var(--kiu-navy);">${uiState.view === 'entity' && activeEntity ? escapeHtml(activeEntity.name) : 'Campus Social'}</div>
                            <div style="font-size:13px; color:var(--kiu-text-muted); margin-top:6px;">${uiState.view === 'entity' && activeEntity ? escapeHtml(activeEntity.description || 'Real page view') : 'A real social workspace with no seeded demo content.'}</div>
                        </div>
                        <div style="display:flex; gap:10px; flex-wrap:wrap;">
                            <button type="button" class="${uiState.view === 'feed' ? 'kiu-btn-blue' : 'kiu-btn-outline'}" data-legacy-click="setPublicSocialView('feed')" style="padding:10px 14px; font-size:12px;">Feed</button>
                            <button type="button" class="${uiState.view === 'following' ? 'kiu-btn-blue' : 'kiu-btn-outline'}" data-legacy-click="setPublicSocialView('following')" style="padding:10px 14px; font-size:12px;">Following</button>
                            ${uiState.view === 'entity' ? `<button type="button" class="kiu-btn-outline" data-legacy-click="setPublicSocialView('feed')" style="padding:10px 14px; font-size:12px;">Back to Feed</button>` : ''}
                        </div>
                    </div>
                    <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap; margin-top:18px;">
                        <div class="schedule-chip"><i class="fas fa-file-alt"></i> ${KIU_STATE.publicSocialPosts.length} post${KIU_STATE.publicSocialPosts.length === 1 ? '' : 's'}</div>
                        <div class="schedule-chip"><i class="fas fa-flag"></i> ${KIU_STATE.publicSocialPages.length} page${KIU_STATE.publicSocialPages.length === 1 ? '' : 's'}</div>
                        <label style="display:inline-flex; align-items:center; gap:8px; font-size:12px; color:var(--kiu-text-muted); font-weight:700;">
                            Faculty
                            <select data-legacy-change="KIU_STATE.publicSocialUi.facultyFilter=this.value; saveState(); renderPublicSocialPage();" style="min-width:180px;">
                                ${facultyOptions}
                            </select>
                        </label>
                    </div>
                </div>

                <div class="surface-card" style="padding:24px; display:grid; gap:14px;">
                    <div style="font-size:18px; font-weight:900; color:var(--kiu-navy);">Create Post</div>
                    <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
                        <label style="display:grid; gap:6px; font-size:12px; font-weight:700; color:var(--kiu-text-muted);">
                            Post As
                            <select data-legacy-change="KIU_STATE.publicSocialUi.composeAs=this.value; saveState(); renderPublicSocialPage();">
                                ${composeOptions}
                            </select>
                        </label>
                        <label style="display:grid; gap:6px; font-size:12px; font-weight:700; color:var(--kiu-text-muted);">
                            Audience
                            <select id="public-social-audience">
                                ${facultyOptions}
                            </select>
                        </label>
                    </div>
                    <textarea id="public-social-text" placeholder="Share a real update..." style="width:100%; min-height:120px; border:1px solid var(--kiu-border); border-radius:16px; padding:14px; outline:none; resize:vertical;"></textarea>
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
                        <div id="public-social-file-label" style="font-size:12px; color:var(--kiu-blue); font-weight:700;">${getPublicSocialDraftFile()?.name ? `<i class="fas fa-image"></i> ${escapeHtml(getPublicSocialDraftFile().name)}` : 'No image selected'}</div>
                        <div style="display:flex; gap:10px; flex-wrap:wrap;">
                            <button type="button" class="kiu-btn-outline" data-legacy-click="pickPublicSocialFile()"><i class="fas fa-image"></i> Add Image</button>
                            <button type="button" class="kiu-btn-blue" data-legacy-click="createPublicSocialPost()"><i class="fas fa-paper-plane"></i> Publish</button>
                        </div>
                    </div>
                </div>

                <div style="display:grid; gap:16px;">
                    ${postMarkup}
                </div>
            </div>

            <aside style="display:grid; gap:20px; align-content:start;">
                <div class="surface-card" style="padding:24px; display:grid; gap:14px;">
                    <div>
                        <div style="font-size:18px; font-weight:900; color:var(--kiu-navy);">${escapeHtml(getPublicSocialDisplayName(currentUser))}</div>
                        <div style="font-size:12px; color:var(--kiu-text-muted); margin-top:6px;">${escapeHtml(getPortalMessengerRoleLabel(currentUser.role))} · ${escapeHtml(getFacultyLabel(normalizeFacultyCode(currentUser.facultyCode || currentUser.faculty || getCurrentFaculty(), getCurrentFaculty())))}</div>
                    </div>
                    <button type="button" class="${uiState.view === 'entity' && activeEntityType === 'profile' && activeEntityId === currentProfileScopeId ? 'kiu-btn-blue' : 'kiu-btn-outline'}" data-legacy-click="openPublicSocialEntity('profile', '${currentProfileScopeId}')" style="padding:10px 14px; font-size:12px;">Open My Profile Feed</button>
                </div>

                <div class="surface-card" style="padding:24px; display:grid; gap:14px;">
                    <div style="font-size:18px; font-weight:900; color:var(--kiu-navy);">My Pages</div>
                    ${pageCards}
                </div>

                <div class="surface-card" style="padding:24px; display:grid; gap:12px;">
                    <div style="font-size:18px; font-weight:900; color:var(--kiu-navy);">Create Page</div>
                    <input id="public-social-page-name" type="text" placeholder="Page name" style="width:100%; border:1px solid var(--kiu-border); border-radius:14px; padding:11px 12px; outline:none;">
                    <select id="public-social-page-faculty">
                        ${facultyOptions}
                    </select>
                    <textarea id="public-social-page-description" placeholder="What is this page for?" style="width:100%; min-height:96px; border:1px solid var(--kiu-border); border-radius:16px; padding:12px 14px; outline:none; resize:vertical;"></textarea>
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
