(function initPortalNewsWorkspace() {
    const ROOT_ID = 'portal-news-root';
    const ROLE_OPTIONS = [
        ['student', 'Students'],
        ['professor', 'Professors'],
        ['ta', 'Teaching Assistants'],
        ['admin', 'Administrators'],
        ['student_service', 'Student Service']
    ];

    const runtime = {
        bootstrapped: false,
        bootstrapAttempted: false,
        bootstrapPromise: null,
        loading: false,
        error: '',
        renderCache: {},
        posts: [],
        sections: [],
        privileges: [],
        accounts: [],
        selectedSection: 'all',
        search: '',
        searchTimer: null,
        privilegeSearch: '',
        privilegeSearchTimer: null,
        privilegesLoaded: false,
        privilegesLoading: false,
        privilegesPromise: null,
        privilegeTargetId: '',
        replyDrafts: {},
        adminPane: 'compose',
        compose: {
            title: '',
            sectionLabel: 'Academic Updates',
            body: '',
            priority: 'standard',
            allowReplies: true,
            pinned: false,
            audienceRoles: [],
            audienceFacultyCodes: []
        }
    };

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function renderNewsEmptyState(title, copy = '') {
        return `
            <div class="lux-empty-state newsx-empty">
                <i class="fas fa-newspaper"></i>
                <strong class="lux-empty-state__title">${escapeHtml(title)}</strong>
                ${copy ? `<span class="lux-empty-state__copy">${escapeHtml(copy)}</span>` : ''}
            </div>
        `;
    }

    function renderNewsErrorState(copy) {
        return `
            <div class="lux-empty-state lux-error-state newsx-error">
                <i class="fas fa-triangle-exclamation"></i>
                <strong class="lux-empty-state__title">News feed unavailable</strong>
                <span class="lux-empty-state__copy">${escapeHtml(copy || 'The News workspace is unavailable right now.')}</span>
            </div>
        `;
    }

    function q(id) {
        return document.getElementById(id);
    }

    function setNewsRegionMarkup(element, key, markup) {
        if (!element) return;
        if (runtime.renderCache[key] === markup) return;
        element.innerHTML = markup;
        runtime.renderCache[key] = markup;
    }

    function ensureNewsWorkspaceShell(root) {
        if (!root) return null;
        let shell = root.querySelector('[data-news-shell="1"]');
        if (!shell) {
            root.innerHTML = `
                <div class="newsx-shell" data-news-shell="1">
                    <div id="newsx-sidebar-region"></div>
                    <main class="newsx-main">
                        <div id="newsx-hero-region"></div>
                        <div id="newsx-filter-region"></div>
                        <section id="newsx-feed-region" class="newsx-feed"></section>
                    </main>
                    <div id="newsx-admin-region"></div>
                </div>
            `;
            shell = root.querySelector('[data-news-shell="1"]');
            runtime.renderCache = {};
        }
        return {
            sidebar: root.querySelector('#newsx-sidebar-region'),
            hero: root.querySelector('#newsx-hero-region'),
            filter: root.querySelector('#newsx-filter-region'),
            feed: root.querySelector('#newsx-feed-region'),
            admin: root.querySelector('#newsx-admin-region')
        };
    }

    function uniqueStrings(values = []) {
        return [...new Set((values || []).map(value => String(value || '').trim()).filter(Boolean))];
    }

    function toFieldToken(value) {
        return String(value ?? '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9_-]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'field';
    }

    function getCurrentRole() {
        try {
            return String(typeof getEffectiveUserRole === 'function' ? getEffectiveUserRole() : 'student').trim().toLowerCase() || 'student';
        } catch (error) {
            return 'student';
        }
    }

    function getCurrentUserSafe() {
        try {
            return typeof getCurrentUser === 'function' ? (getCurrentUser() || null) : null;
        } catch (error) {
            return null;
        }
    }

    function canManageNews() {
        return getCurrentRole() === 'admin' || (typeof userHasPortalPrivilege === 'function' && userHasPortalPrivilege('manage_news'));
    }

    function canManagePrivileges() {
        return getCurrentRole() === 'admin' || (typeof userHasPortalPrivilege === 'function' && userHasPortalPrivilege('manage_privileges'));
    }

    function canModerateReplies() {
        return canManageNews() || (typeof userHasPortalPrivilege === 'function' && userHasPortalPrivilege('moderate_news_replies'));
    }

    function getFacultyOptions() {
        const emptyState = typeof KIU_EMPTY_STATE !== 'undefined' ? KIU_EMPTY_STATE : null;
        const profiles = KIU_STATE?.facultyProfiles || emptyState?.facultyProfiles || {};
        return Object.entries(profiles).map(([code, profile]) => ({
            code: String(code || '').trim().toUpperCase(),
            label: String(profile?.name || code || '').trim()
        }));
    }

    function formatDateTime(value) {
        if (!value) return 'Unscheduled';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value || '');
        const now = new Date();
        const diffMs = now - date;
        const diffMin = Math.floor(diffMs / 60000);
        const diffHr = Math.floor(diffMs / 3600000);
        const diffDay = Math.floor(diffMs / 86400000);
        if (diffMin < 1) return 'Just now';
        if (diffMin < 60) return `${diffMin}m ago`;
        if (diffHr < 24) return `${diffHr}h ago`;
        if (diffDay === 1) return 'Yesterday';
        if (diffDay < 7) return `${diffDay}d ago`;
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
    }

    function getRoleLabel(roleId = '') {
        return ROLE_OPTIONS.find(([value]) => value === roleId)?.[1] || roleId || 'All accounts';
    }

    async function fetchPrivilegeDefinitions() {
        if (!canManagePrivileges()) {
            runtime.privileges = [];
            return;
        }
        try {
            const currentUser = getCurrentUserSafe();
            const query = new URLSearchParams({ userId: String(currentUser?.id || '') });
            const payload = await kiuPortalFetch(`/api/news/privileges?${query.toString()}`);
            runtime.privileges = Array.isArray(payload?.privileges) ? payload.privileges : [];
        } catch (_e) {
            runtime.privileges = [];
        }
    }

    async function fetchNewsFeed() {
        const currentUser = getCurrentUserSafe();
        if (!currentUser?.id) {
            runtime.posts = [];
            runtime.sections = [];
            return;
        }
        const query = new URLSearchParams({
            userId: String(currentUser?.id || ''),
            section: runtime.selectedSection || 'all',
            search: runtime.search || ''
        });
        try {
            const payload = await kiuPortalFetch(`/api/news/feed?${query.toString()}`);
            runtime.posts = Array.isArray(payload?.items) ? payload.items : [];
            runtime.sections = Array.isArray(payload?.sections) ? payload.sections : [];
        } catch (_e) {
            // API unavailable - keep existing data or default to empty
            if (!runtime.posts) runtime.posts = [];
            if (!runtime.sections) runtime.sections = [];
        }
    }

    async function fetchPrivilegeAccounts() {
        if (!canManagePrivileges()) {
            runtime.accounts = [];
            return;
        }
        try {
            const payload = await kiuPortalFetch('/api/admin/accounts?limit=400&search=');
            runtime.accounts = Array.isArray(payload?.items) ? payload.items : [];
            if (!runtime.privilegeTargetId && runtime.accounts.length) {
                runtime.privilegeTargetId = String(runtime.accounts[0].id || '');
            }
        } catch (_e) {
            runtime.accounts = [];
        }
    }

    function shouldLoadNewsPrivileges() {
        return canManagePrivileges() && (runtime.adminPane === 'privileges' || runtime.privilegesLoaded);
    }

    async function fetchNewsPrivilegeWorkspaceData() {
        await Promise.allSettled([
            fetchPrivilegeDefinitions(),
            fetchPrivilegeAccounts()
        ]);
        runtime.privilegesLoaded = true;
    }

    async function loadNewsPrivilegeWorkspace(force = false) {
        if (!canManagePrivileges()) {
            runtime.privileges = [];
            runtime.accounts = [];
            runtime.privilegesLoaded = false;
            return Promise.resolve();
        }
        if (runtime.privilegesPromise && !force) return runtime.privilegesPromise;
        if (runtime.privilegesLoading && !force) return runtime.privilegesPromise || Promise.resolve();
        if (runtime.privilegesLoaded && !force) return Promise.resolve();
        runtime.privilegesLoading = true;
        runtime.privilegesPromise = fetchNewsPrivilegeWorkspaceData()
            .catch(() => {
                runtime.privileges = [];
                runtime.accounts = [];
            })
            .finally(() => {
                runtime.privilegesLoading = false;
                runtime.privilegesPromise = null;
                renderNewsWorkspace();
            });
        return runtime.privilegesPromise;
    }

    async function bootstrapNewsWorkspace(force = false) {
        if (runtime.bootstrapPromise && !force) return runtime.bootstrapPromise;
        if (runtime.loading || (runtime.bootstrapped && !force)) return runtime.bootstrapPromise || Promise.resolve();
        if (runtime.bootstrapAttempted && runtime.error && !force) return runtime.bootstrapPromise || Promise.resolve();
        const showBlockingLoader = false;
        runtime.bootstrapAttempted = true;
        runtime.loading = showBlockingLoader;
        runtime.error = '';
        runtime.bootstrapPromise = (async () => {
            const tasks = [fetchNewsFeed()];
            if (shouldLoadNewsPrivileges()) {
                tasks.push(fetchNewsPrivilegeWorkspaceData());
            }
            await Promise.allSettled(tasks);
            runtime.bootstrapped = true;
            if (runtime.posts.length) runtime.error = '';
        })().catch(error => {
            if (!runtime.posts.length) {
                runtime.error = error?.message || 'The News workspace is unavailable right now.';
            }
        }).finally(() => {
            runtime.loading = false;
            runtime.bootstrapPromise = null;
            renderNewsWorkspace();
        });
        return runtime.bootstrapPromise;
    }

    function getSectionIcon(key) {
        const map = { 'academic-updates': 'fa-graduation-cap', 'campus-life': 'fa-university', 'events': 'fa-calendar-star', 'announcements': 'fa-bullhorn', 'admissions': 'fa-door-open', 'research': 'fa-flask' };
        return map[String(key || '').toLowerCase()] || 'fa-folder';
    }

    function renderSections() {
        const buttons = [
            `
                <button type="button" class="newsx-section-btn lux-secondary-btn lux-select-card ${runtime.selectedSection === 'all' ? 'is-active' : ''}" data-news-section="all">
                    <span class="newsx-sec-icon"><i class="fas fa-globe"></i></span>
                    <div class="newsx-grow">
                        <div class="newsx-account-name">All Updates</div>
                        <div class="newsx-section-key">All sections</div>
                    </div>
                    <strong>${escapeHtml(String(runtime.posts.length))}</strong>
                </button>
            `
        ].concat((runtime.sections || []).map(section => `
            <button type="button" class="newsx-section-btn lux-secondary-btn lux-select-card ${runtime.selectedSection === section.key ? 'is-active' : ''}" data-news-section="${escapeHtml(section.key || 'general')}">
                <span class="newsx-sec-icon"><i class="fas ${getSectionIcon(section.key)}"></i></span>
                <div class="newsx-grow">
                    <div class="newsx-account-name">${escapeHtml(section.label || 'General')}</div>
                    <div class="newsx-section-key">${escapeHtml(section.key || 'general')}</div>
                </div>
                <strong>${escapeHtml(String(section.count || 0))}</strong>
            </button>
        `)).join('');

        return `
            <aside class="surface-card newsx-panel newsx-sidebar">
                <div class="newsx-sidebar-deco">
                    <div class="newsx-sidebar-deco-icon"><i class="fas fa-newspaper"></i></div>
                    <div>
                        <div class="newsx-kicker newsx-kicker-muted">News</div>
                        <h2 class="newsx-headline newsx-headline-tight">Sections</h2>
                    </div>
                </div>
                <p class="newsx-subtle">Filter news by category.</p>
                <div class="newsx-divider"></div>
                <div class="newsx-section-list">${buttons}</div>
            </aside>
        `;
    }

    function renderAudienceSummary(post) {
        const roles = Array.isArray(post.audienceRoles) && post.audienceRoles.length
            ? post.audienceRoles.map(getRoleLabel).join(', ')
            : 'All account types';
        const faculties = Array.isArray(post.audienceFacultyCodes) && post.audienceFacultyCodes.length
            ? post.audienceFacultyCodes.join(', ')
            : 'All faculties';
        return `
            <div class="newsx-stat-grid lux-strip-grid lux-strip-grid--adaptive">
                <div class="newsx-stat lux-strip-card surface-card lux-summary-surface lux-summary-surface--panel">
                    <div class="lux-card-body lux-mini-panel">
                        <div class="newsx-stat-label">Audience</div>
                        <h3 class="newsx-stat-value">${escapeHtml(roles)}</h3>
                        <p>Who can see this announcement right now.</p>
                    </div>
                </div>
                <div class="newsx-stat lux-strip-card surface-card lux-summary-surface lux-summary-surface--panel">
                    <div class="lux-card-body lux-mini-panel">
                        <div class="newsx-stat-label">Faculty Scope</div>
                        <h3 class="newsx-stat-value">${escapeHtml(faculties)}</h3>
                        <p>Which faculties are included in the current delivery scope.</p>
                    </div>
                </div>
                <div class="newsx-stat lux-strip-card surface-card lux-summary-surface lux-summary-surface--panel">
                    <div class="lux-card-body lux-mini-panel">
                        <div class="newsx-stat-label">Private Replies</div>
                        <h3 class="newsx-stat-value">${escapeHtml(String(post.privateReplyCount || 0))}</h3>
                        <p>Private thread responses attached to this update.</p>
                    </div>
                </div>
            </div>
        `;
    }

    function renderPrivateReplies(post) {
        const privateReplies = Array.isArray(post.privateReplies) ? post.privateReplies : [];
        if (!privateReplies.length) return '';
        return `
            <div class="newsx-private-list">
                ${privateReplies.map(reply => `
                    <div class="newsx-private-item lux-summary-surface lux-summary-surface--panel">
                        <div class="newsx-private-meta">
                            <strong>${escapeHtml(reply.authorName || 'Reply')}</strong>
                            <span>${escapeHtml(formatDateTime(reply.createdAt))}</span>
                        </div>
                        <div>${escapeHtml(reply.body || '')}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderPostHeader(post) {
        const authorName = post.createdByName || 'University';
        const authorInitial = String(authorName).charAt(0).toUpperCase();
        const priorityClass = post.priority === 'critical' ? ' is-priority-critical' : post.priority === 'important' ? ' is-priority-important' : '';
        return `
            <div class="newsx-card-header">
                <div class="newsx-grow">
                    <div class="newsx-chip-row">
                        <span class="newsx-chip lux-status-pill"><i class="fas fa-tag"></i> ${escapeHtml(post.sectionLabel || 'General')}</span>
                        ${post.pinned ? `<span class="newsx-chip lux-status-pill is-pinned"><i class="fas fa-thumbtack"></i> Pinned</span>` : ''}
                        ${post.priority && post.priority !== 'standard' ? `<span class="newsx-chip lux-status-pill${priorityClass}"><i class="fas fa-bell"></i> ${escapeHtml(post.priority)}</span>` : ''}
                    </div>
                    <h3 class="newsx-card-title">${escapeHtml(post.title || 'University update')}</h3>
                    <div class="newsx-author-row">
                        <span class="newsx-avatar">${escapeHtml(authorInitial)}</span>
                        <div class="newsx-meta">
                            <strong class="newsx-author-name">${escapeHtml(authorName)}</strong> - ${escapeHtml(formatDateTime(post.publishedAt || post.updatedAt || post.createdAt))}
                        </div>
                    </div>
                </div>
                ${post.viewerCanModerateReplies ? `<span class="newsx-chip lux-status-pill"><i class="fas fa-user-shield"></i> Moderator</span>` : ''}
            </div>
        `;
    }

    function renderPostBody(post) {
        return `<div class="newsx-card-body">${escapeHtml(post.body || '')}</div>`;
    }

    function renderPostPrivateBox(post) {
        const replyDraft = runtime.replyDrafts[String(post.id || '')] || '';
        const postId = String(post.id || '');
        return `
            <div class="newsx-private-box">
                <div class="newsx-chip-row">
                    ${post.allowReplies !== false
                        ? `<span class="newsx-chip lux-status-pill"><i class="fas fa-lock"></i> Private replies</span>`
                        : `<span class="newsx-chip lux-status-pill"><i class="fas fa-ban"></i> Replies disabled</span>`}
                </div>
                ${renderPrivateReplies(post)}
                ${post.allowReplies !== false ? `
                    <textarea id="news-reply-${escapeHtml(toFieldToken(postId))}" name="news_reply_${escapeHtml(toFieldToken(postId))}" class="newsx-textarea lux-control" rows="3" placeholder="Send a private response to this announcement..." data-news-reply-input="${escapeHtml(postId)}">${escapeHtml(replyDraft)}</textarea>
                    <div class="newsx-btn-row">
                        <button type="button" class="newsx-btn newsx-btn-primary lux-primary-btn" data-news-submit-reply="${escapeHtml(postId)}"><i class="fas fa-paper-plane"></i> Send Private Reply</button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    function renderPublisherPanel() {
        if (!canManageNews()) return '';
        const compose = runtime.compose;
        return `
            <section class="newsx-section">
                <h3 class="newsx-headline">Publisher</h3>
                <p class="newsx-subtle">Compose and publish official announcements.</p>
                <div class="newsx-check-grid newsx-stack-14">
                    <input id="news-compose-title" name="news_compose_title" class="newsx-input lux-control" type="text" value="${escapeHtml(compose.title)}" placeholder="Headline" data-news-compose-field="title">
                    <input id="news-compose-section" name="news_compose_section" class="newsx-input lux-control" type="text" value="${escapeHtml(compose.sectionLabel)}" placeholder="Section label" data-news-compose-field="sectionLabel">
                    <select id="news-compose-priority" name="news_compose_priority" class="newsx-select lux-control" data-news-compose-field="priority">
                        <option value="standard" ${compose.priority === 'standard' ? 'selected' : ''}>Standard priority</option>
                        <option value="important" ${compose.priority === 'important' ? 'selected' : ''}>Important</option>
                        <option value="critical" ${compose.priority === 'critical' ? 'selected' : ''}>Critical</option>
                    </select>
                    <textarea id="news-compose-body" name="news_compose_body" class="newsx-textarea lux-control" rows="7" placeholder="Write the announcement body..." data-news-compose-field="body">${escapeHtml(compose.body)}</textarea>
                </div>
                <div class="newsx-stack-16">
                    <div class="newsx-meta newsx-meta-label">Target Audience</div>
                    <div class="newsx-check-grid">
                        ${ROLE_OPTIONS.map(([roleId, label]) => `
                            <label class="newsx-check lux-check-card lux-summary-surface lux-summary-surface--panel">
                                <input id="news-role-${escapeHtml(toFieldToken(roleId))}" name="news_role_${escapeHtml(toFieldToken(roleId))}" type="checkbox" ${compose.audienceRoles.includes(roleId) ? 'checked' : ''} data-news-audience-role="${escapeHtml(roleId)}">
                                <div>
                                    <strong>${escapeHtml(label)}</strong>
                                    <div class="newsx-meta">Uncheck all for everyone.</div>
                                </div>
                            </label>
                        `).join('')}
                    </div>
                </div>
                <div class="newsx-stack-16">
                    <div class="newsx-meta newsx-meta-label">Faculty Scope</div>
                    <div class="newsx-check-grid">
                        ${getFacultyOptions().map(option => `
                            <label class="newsx-check lux-check-card lux-summary-surface lux-summary-surface--panel">
                                <input id="news-faculty-${escapeHtml(toFieldToken(option.code))}" name="news_faculty_${escapeHtml(toFieldToken(option.code))}" type="checkbox" ${compose.audienceFacultyCodes.includes(option.code) ? 'checked' : ''} data-news-audience-faculty="${escapeHtml(option.code)}">
                                <div>
                                    <strong>${escapeHtml(option.label)}</strong>
                                    <div class="newsx-meta">${escapeHtml(option.code)}</div>
                                </div>
                            </label>
                        `).join('')}
                    </div>
                </div>
                <div class="newsx-check-grid newsx-stack-16">
                    <label class="newsx-check lux-check-card lux-summary-surface lux-summary-surface--panel">
                        <input id="news-compose-allow-replies" name="news_compose_allow_replies" type="checkbox" ${compose.allowReplies ? 'checked' : ''} data-news-compose-boolean="allowReplies">
                        <div>
                            <strong>Allow private replies</strong>
                            <div class="newsx-meta">Readers can respond privately.</div>
                        </div>
                    </label>
                    <label class="newsx-check lux-check-card lux-summary-surface lux-summary-surface--panel">
                        <input id="news-compose-pinned" name="news_compose_pinned" type="checkbox" ${compose.pinned ? 'checked' : ''} data-news-compose-boolean="pinned">
                        <div>
                            <strong>Pin this announcement</strong>
                            <div class="newsx-meta">Stays at top of feed.</div>
                        </div>
                    </label>
                </div>
                <div class="newsx-btn-row newsx-stack-16">
                    <button type="button" class="newsx-btn newsx-btn-primary lux-primary-btn" data-news-publish><i class="fas fa-bullhorn"></i> Publish</button>
                    <button type="button" class="newsx-btn lux-secondary-btn" data-news-reset-compose><i class="fas fa-rotate-left"></i> Reset</button>
                </div>
            </section>
        `;
    }

    function renderPrivilegeManager() {
        if (!canManagePrivileges()) return '';
        if (!runtime.privilegesLoaded || runtime.privilegesLoading) {
            return `
                <section class="newsx-section">
                    <h3 class="newsx-headline">Delegated Privileges</h3>
                    <p class="newsx-subtle">Loading delegated privilege controls only when this pane is opened.</p>
                    ${renderNewsEmptyState('Loading privilege controls...', 'Delegated privilege controls load only when this pane is opened.')}
                </section>
            `;
        }
        const query = String(runtime.privilegeSearch || '').trim().toLowerCase();
        const filteredAccounts = (runtime.accounts || []).filter(account => {
            if (!query) return true;
            return [account.displayName, account.name, account.nameEn, account.email, account.id, account.role, account.facultyCode]
                .some(value => String(value || '').toLowerCase().includes(query));
        });
        const selectedAccount = filteredAccounts.find(account => String(account.id || '') === String(runtime.privilegeTargetId || ''))
            || filteredAccounts[0]
            || null;
        const selectedPrivileges = new Set(uniqueStrings((selectedAccount?.grantedPrivileges || selectedAccount?.effectivePrivileges || []).map(value => String(value || '').trim())));

        return `
            <section class="newsx-section">
                <h3 class="newsx-headline">Delegated Privileges</h3>
                <p class="newsx-subtle">Delegate specific permissions without granting full admin access.</p>
                <input id="news-privilege-search" name="news_privilege_search" class="newsx-input newsx-stack-14 lux-control" type="text" value="${escapeHtml(runtime.privilegeSearch)}" placeholder="Search account" data-news-privilege-search>
                <div class="newsx-account-list">
                    ${filteredAccounts.map(account => `
                        <button type="button" class="newsx-account-card lux-select-card lux-summary-surface lux-summary-surface--panel ${String(selectedAccount?.id || '') === String(account.id || '') ? 'is-active' : ''}" data-news-select-account="${escapeHtml(String(account.id || ''))}">
                            <div class="newsx-account-name">${escapeHtml(account.displayName || account.nameEn || account.name || account.id || 'Account')}</div>
                            <div class="newsx-meta">${escapeHtml(account.email || '')}</div>
                            <div class="newsx-meta">${escapeHtml(account.role || 'account')} - ${escapeHtml(account.facultyCode || 'UNIV')}</div>
                        </button>
                    `).join('') || renderNewsEmptyState('No accounts matched the current search.')}
                </div>
                ${selectedAccount ? `
                    <div class="newsx-check-grid newsx-stack-14">
                        ${(runtime.privileges || []).map(privilege => `
                            <label class="newsx-check lux-check-card lux-summary-surface lux-summary-surface--panel">
                                <input
                                    id="news-privilege-${escapeHtml(toFieldToken(selectedAccount.id))}-${escapeHtml(toFieldToken(privilege.id))}"
                                    name="news_privilege_${escapeHtml(toFieldToken(selectedAccount.id))}_${escapeHtml(toFieldToken(privilege.id))}"
                                    type="checkbox"
                                    ${selectedPrivileges.has(String(privilege.id || '')) && String(selectedAccount.role || '').toLowerCase() !== 'admin' ? 'checked' : ''}
                                    ${String(selectedAccount.role || '').toLowerCase() === 'admin' ? 'disabled' : ''}
                                    data-news-toggle-privilege="${escapeHtml(String(selectedAccount.id || ''))}"
                                    data-news-privilege-id="${escapeHtml(String(privilege.id || ''))}"
                                >
                                <div>
                                    <strong>${escapeHtml(privilege.label || privilege.id || '')}</strong>
                                    <div class="newsx-meta">${escapeHtml(privilege.description || '')}</div>
                                </div>
                            </label>
                        `).join('')}
                    </div>
                    <div class="newsx-btn-row newsx-stack-16">
                        <button type="button" class="newsx-btn newsx-btn-primary lux-primary-btn" data-news-save-privileges="${escapeHtml(String(selectedAccount.id || ''))}"><i class="fas fa-shield-halved"></i> Save Privileges</button>
                    </div>
                ` : ''}
            </section>
        `;
    }

    function renderAdminRail() {
        if (!canManageNews() && !canManagePrivileges()) {
            return `
                <aside class="surface-card newsx-panel newsx-rail">
                    <section class="newsx-section">
                        <h3 class="newsx-headline">Private Replies</h3>
                        <p class="newsx-subtle">Your replies are private -- visible only to you and university staff.</p>
                    </section>
                </aside>
            `;
        }
        const panes = [];
        if (canManageNews()) panes.push(['compose', 'Publisher']);
        if (canManagePrivileges()) panes.push(['privileges', 'Privileges']);
        const paneId = panes.some(([value]) => value === runtime.adminPane) ? runtime.adminPane : panes[0]?.[0] || 'compose';
        runtime.adminPane = paneId;
        return `
            <aside class="surface-card newsx-panel newsx-rail">
                ${panes.length > 1 ? `
                    <div class="newsx-section newsx-pane-switch-wrap">
                        <div class="newsx-pane-switch">
                            ${panes.map(([paneKey, label]) => `
                                <button type="button" class="newsx-pane-btn lux-secondary-btn lux-select-card ${runtime.adminPane === paneKey ? 'is-active' : ''}" data-news-admin-pane="${escapeHtml(paneKey)}">${escapeHtml(label)}</button>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                ${runtime.adminPane === 'privileges' ? renderPrivilegeManager() : renderPublisherPanel()}
            </aside>
        `;
    }

    function renderNewsHero(currentUser) {
        const pinnedCount = runtime.posts.filter(post => post?.pinned).length;
        return `
            <section class="lux-summary-surface lux-summary-surface--hero newsx-hero">
                <div class="newsx-hero-illustration"></div>
                <div class="newsx-kicker"><i class="fas fa-broadcast-tower newsx-icon-leading"></i> University News</div>
                <h1 class="newsx-title">Campus News</h1>
                <p class="newsx-copy">Official announcements, updates, and private channels filtered to what matters to you.</p>
                <div class="newsx-hero-meta">
                    <span class="newsx-badge lux-status-pill"><i class="fas fa-user-circle"></i> ${escapeHtml(currentUser.displayName || currentUser.nameEn || currentUser.name || currentUser.id)}</span>
                    <span class="newsx-badge lux-status-pill"><i class="fas fa-newspaper"></i> ${escapeHtml(String(runtime.posts.length))} updates</span>
                    <span class="newsx-badge lux-status-pill"><i class="fas fa-layer-group"></i> ${escapeHtml(String(runtime.sections.length))} sections</span>
                    ${pinnedCount ? `<span class="newsx-badge lux-status-pill"><i class="fas fa-thumbtack"></i> ${escapeHtml(String(pinnedCount))} pinned</span>` : ''}
                </div>
            </section>
        `;
    }

    function renderNewsFilterBar() {
        return `
            <section class="surface-card newsx-panel newsx-filter">
                <div class="newsx-filter-grid">
                    <input id="news-feed-search" name="news_feed_search" class="newsx-input lux-control" type="text" value="${escapeHtml(runtime.search)}" placeholder="Search by title, body, author, or section..." data-news-search-input>
                    <button type="button" class="newsx-btn lux-secondary-btn" data-news-refresh><i class="fas fa-rotate"></i> Refresh</button>
                </div>
                ${runtime.error ? renderNewsErrorState(runtime.error) : ''}
            </section>
        `;
    }

    function ensureNewsFeedShell(container) {
        if (!container) return null;
        let state = container.querySelector('[data-news-feed-state="1"]');
        let list = container.querySelector('[data-news-feed-list="1"]');
        if (!state || !list) {
            container.innerHTML = `
                <div data-news-feed-state="1"></div>
                <div class="newsx-feed-list" data-news-feed-list="1"></div>
            `;
            state = container.querySelector('[data-news-feed-state="1"]');
            list = container.querySelector('[data-news-feed-list="1"]');
        }
        return { state, list };
    }

    function renderNewsFeedStateMarkup() {
        if (runtime.loading && !runtime.posts.length) {
            return `
                <div class="surface-card newsx-panel newsx-feed-card newsx-loading-card">
                    <div class="newsx-loading-line is-120"></div>
                    <div class="newsx-loading-line is-70"></div>
                    <div class="newsx-loading-line is-50"></div>
                    <div class="newsx-loading-block"></div>
                </div>
                <div class="surface-card newsx-panel newsx-feed-card newsx-loading-card">
                    <div class="newsx-loading-line is-90"></div>
                    <div class="newsx-loading-line is-55"></div>
                    <div class="newsx-loading-line is-40"></div>
                </div>
            `;
        }
        if (!runtime.posts.length) {
            return renderNewsEmptyState('No announcements matched the current section or search.');
        }
        return '';
    }

    function ensureNewsPostShell(host, postId) {
        if (!host) return null;
        let shell = host.querySelector('[data-news-post-shell="1"]');
        if (!shell) {
            host.innerHTML = `
                <article class="surface-card newsx-panel newsx-feed-card" data-news-post-shell="1" data-news-post-id="${escapeHtml(postId)}">
                    <div data-news-post-header="1"></div>
                    <div data-news-post-audience="1"></div>
                    <div class="newsx-divider"></div>
                    <div data-news-post-body="1"></div>
                    <div data-news-post-private="1"></div>
                </article>
            `;
            shell = host.querySelector('[data-news-post-shell="1"]');
        }
        return {
            header: shell?.querySelector('[data-news-post-header="1"]') || null,
            audience: shell?.querySelector('[data-news-post-audience="1"]') || null,
            body: shell?.querySelector('[data-news-post-body="1"]') || null,
            privateBox: shell?.querySelector('[data-news-post-private="1"]') || null
        };
    }

    function renderNewsPostRegions(host, post) {
        const postId = String(post?.id || '');
        const shell = ensureNewsPostShell(host, postId);
        if (!shell) return;
        setNewsRegionMarkup(shell.header, `feed-post-header:${postId}`, renderPostHeader(post));
        setNewsRegionMarkup(shell.audience, `feed-post-audience:${postId}`, renderAudienceSummary(post));
        setNewsRegionMarkup(shell.body, `feed-post-body:${postId}`, renderPostBody(post));
        setNewsRegionMarkup(shell.privateBox, `feed-post-private:${postId}`, renderPostPrivateBox(post));
    }

    function renderNewsFeedRegions(container) {
        const shell = ensureNewsFeedShell(container);
        if (!shell) return;

        const stateMarkup = renderNewsFeedStateMarkup();
        setNewsRegionMarkup(shell.state, 'feed-state', stateMarkup);
        if (stateMarkup) {
            shell.list.replaceChildren();
            return;
        }

        const existingHosts = new Map(
            [...shell.list.querySelectorAll('[data-news-post-host="1"]')].map(node => [String(node.getAttribute('data-news-post-id') || ''), node])
        );
        const fragment = document.createDocumentFragment();

        runtime.posts.forEach(post => {
            const postId = String(post?.id || '');
            let host = existingHosts.get(postId);
            if (!host) {
                host = document.createElement('div');
                host.setAttribute('data-news-post-host', '1');
                host.setAttribute('data-news-post-id', postId);
            }
            renderNewsPostRegions(host, post);
            fragment.appendChild(host);
            existingHosts.delete(postId);
        });

        existingHosts.forEach((_host, postId) => {
            delete runtime.renderCache[`feed-post-header:${postId}`];
            delete runtime.renderCache[`feed-post-audience:${postId}`];
            delete runtime.renderCache[`feed-post-body:${postId}`];
            delete runtime.renderCache[`feed-post-private:${postId}`];
        });

        shell.list.replaceChildren(fragment);
    }

    function buildNewsRenderSignature() {
        return [
            runtime.loading ? 'loading' : 'idle',
            runtime.error || '',
            runtime.selectedSection || 'all',
            runtime.search || '',
            runtime.adminPane || 'compose',
            runtime.privilegeTargetId || '',
            runtime.privilegeSearch || '',
            JSON.stringify(runtime.sections || []),
            JSON.stringify((runtime.posts || []).map((post) => ({
                id: post?.id || '',
                pinned: Boolean(post?.pinned),
                privateReplyCount: Number(post?.privateReplyCount || 0),
                updatedAt: post?.updatedAt || post?.publishedAt || post?.createdAt || ''
            }))),
            JSON.stringify(runtime.compose || {}),
            JSON.stringify(Object.keys(runtime.replyDrafts || {}).sort().map((key) => [key, runtime.replyDrafts[key]])),
            JSON.stringify((runtime.accounts || []).map((item) => ({
                id: item?.id || '',
                role: item?.role || '',
                grantedPrivileges: item?.grantedPrivileges || []
            }))),
            JSON.stringify((runtime.privileges || []).map((item) => ({
                id: item?.id || '',
                label: item?.label || ''
            })))
        ].join('|');
    }

    function renderNewsWorkspace() {
        const root = q(ROOT_ID);
        if (!root) return;

        let currentUser = getCurrentUserSafe();
        if (!currentUser?.id) {
            currentUser = { id: 'local-user', displayName: 'Campus User', name: 'User', role: 'student' };
        }

        if (shouldBootstrapNewsWorkspace() && !runtime.bootstrapped && !runtime.loading && !runtime.bootstrapPromise && !runtime.error) {
            window.setTimeout(() => {
                if (shouldBootstrapNewsWorkspace() && !runtime.bootstrapped && !runtime.bootstrapPromise) {
                    bootstrapNewsWorkspace();
                }
            }, 0);
        }
        const shell = ensureNewsWorkspaceShell(root);
        if (!shell) return;
        const renderSignature = buildNewsRenderSignature();
        if (root.dataset.newsRenderSignature === renderSignature) {
            return;
        }

        setNewsRegionMarkup(shell.sidebar, 'sidebar', renderSections());
        setNewsRegionMarkup(shell.hero, 'hero', renderNewsHero(currentUser));
        setNewsRegionMarkup(shell.filter, 'filter', renderNewsFilterBar());
        renderNewsFeedRegions(shell.feed);
        setNewsRegionMarkup(shell.admin, 'admin', renderAdminRail());
        root.dataset.newsReady = 'true';
        root.dataset.newsRenderSignature = renderSignature;
        document.body.classList.remove('kiu-shell-loading');
    }

    function isNewsWorkspaceVisible() {
        if (typeof getActivePageId === 'function' && getActivePageId() === 'news') return true;
        const page = document.getElementById('page-news');
        if (!page) return false;
        return page.classList.contains('active-page') || page.style.display !== 'none';
    }

    function shouldBootstrapNewsWorkspace() {
        if (document.body?.classList?.contains('lux-route-news')) return true;
        return isNewsWorkspaceVisible();
    }

    function installNewsWorkspaceDelegates() {
        const root = q(ROOT_ID);
        if (!root || root.dataset.newsDelegatesInstalled === 'true') return;

        root.dataset.newsDelegatesInstalled = 'true';

        root.addEventListener('click', event => {
            const action = event.target instanceof Element ? event.target.closest(
                '[data-news-section],[data-news-refresh],[data-news-submit-reply],[data-news-publish],[data-news-reset-compose],[data-news-select-account],[data-news-save-privileges],[data-news-admin-pane]'
            ) : null;
            if (!action) return;

            if (action.hasAttribute('data-news-section')) {
                event.preventDefault();
                window.selectNewsSection(action.getAttribute('data-news-section'));
                return;
            }

            if (action.hasAttribute('data-news-refresh')) {
                event.preventDefault();
                window.refreshNewsWorkspace();
                return;
            }

            if (action.hasAttribute('data-news-submit-reply')) {
                event.preventDefault();
                window.submitNewsReply(action.getAttribute('data-news-submit-reply'));
                return;
            }

            if (action.hasAttribute('data-news-publish')) {
                event.preventDefault();
                window.publishNewsPost();
                return;
            }

            if (action.hasAttribute('data-news-reset-compose')) {
                event.preventDefault();
                window.resetNewsComposer();
                return;
            }

            if (action.hasAttribute('data-news-select-account')) {
                event.preventDefault();
                window.selectNewsPrivilegeAccount(action.getAttribute('data-news-select-account'));
                return;
            }

            if (action.hasAttribute('data-news-save-privileges')) {
                event.preventDefault();
                window.saveNewsAccountPrivileges(action.getAttribute('data-news-save-privileges'));
                return;
            }

            if (action.hasAttribute('data-news-admin-pane')) {
                event.preventDefault();
                window.setNewsAdminPane(action.getAttribute('data-news-admin-pane'));
            }
        });

        root.addEventListener('input', event => {
            const target = event.target;
            if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) return;

            if (target.hasAttribute('data-news-search-input')) {
                window.updateNewsSearch(target.value);
                return;
            }

            if (target.hasAttribute('data-news-reply-input')) {
                window.updateNewsReplyDraft(target.getAttribute('data-news-reply-input'), target.value);
                return;
            }

            if (target.hasAttribute('data-news-compose-field')) {
                window.syncNewsComposeField(target.getAttribute('data-news-compose-field'), target.value);
                return;
            }

            if (target.hasAttribute('data-news-privilege-search')) {
                window.updateNewsPrivilegeSearch(target.value);
            }
        });

        root.addEventListener('change', event => {
            const target = event.target;
            if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) return;

            if (target.hasAttribute('data-news-compose-field')) {
                window.updateNewsComposeField(target.getAttribute('data-news-compose-field'), target.value);
                return;
            }

            if (target.hasAttribute('data-news-audience-role')) {
                window.toggleNewsAudienceRole(target.getAttribute('data-news-audience-role'));
                return;
            }

            if (target.hasAttribute('data-news-audience-faculty')) {
                window.toggleNewsAudienceFaculty(target.getAttribute('data-news-audience-faculty'));
                return;
            }

            if (target.hasAttribute('data-news-compose-boolean')) {
                window.toggleNewsComposeBoolean(target.getAttribute('data-news-compose-boolean'));
                return;
            }

            if (target.hasAttribute('data-news-toggle-privilege')) {
                window.toggleNewsAccountPrivilege(
                    target.getAttribute('data-news-toggle-privilege'),
                    target.getAttribute('data-news-privilege-id')
                );
            }
        });
    }

    window.renderNewsWorkspace = renderNewsWorkspace;
    window.renderNewsPageShellContext = renderNewsWorkspace;
    window.refreshNewsWorkspace = function refreshNewsWorkspace() {
        bootstrapNewsWorkspace(true);
    };
    window.selectNewsSection = function selectNewsSection(sectionKey) {
        const nextSection = String(sectionKey || 'all');
        if (runtime.selectedSection === nextSection) return;
        runtime.selectedSection = nextSection;
        bootstrapNewsWorkspace(true);
    };
    window.updateNewsSearch = function updateNewsSearch(value) {
        const nextSearch = String(value || '');
        if (runtime.search === nextSearch) return;
        runtime.search = nextSearch;
        runtime.error = '';
        if (runtime.searchTimer) window.clearTimeout(runtime.searchTimer);
        runtime.searchTimer = window.setTimeout(() => {
            runtime.searchTimer = null;
            bootstrapNewsWorkspace(true);
        }, 260);
    };
    window.setNewsAdminPane = function setNewsAdminPane(paneId) {
        const nextPane = String(paneId || 'compose');
        if (runtime.adminPane === nextPane) {
            if (runtime.adminPane === 'privileges' && !runtime.privilegesLoaded) {
                loadNewsPrivilegeWorkspace();
            }
            return;
        }
        runtime.adminPane = nextPane;
        if (runtime.adminPane === 'privileges' && !runtime.privilegesLoaded) {
            loadNewsPrivilegeWorkspace();
        }
        renderNewsWorkspace();
    };
    window.syncNewsComposeField = function syncNewsComposeField(field, value) {
        runtime.compose[field] = value;
    };
    window.updateNewsComposeField = function updateNewsComposeField(field, value) {
        if (runtime.compose[field] === value) return;
        runtime.compose[field] = value;
        renderNewsWorkspace();
    };
    window.toggleNewsComposeBoolean = function toggleNewsComposeBoolean(field) {
        if (typeof runtime.compose[field] !== 'boolean') return;
        runtime.compose[field] = !runtime.compose[field];
        renderNewsWorkspace();
    };
    window.toggleNewsAudienceRole = function toggleNewsAudienceRole(roleId) {
        const selected = new Set(uniqueStrings(runtime.compose.audienceRoles || []));
        if (selected.has(roleId)) selected.delete(roleId);
        else selected.add(roleId);
        const nextRoles = [...selected];
        const currentRoles = uniqueStrings(runtime.compose.audienceRoles || []);
        if (currentRoles.length === nextRoles.length && currentRoles.every((value, index) => value === nextRoles[index])) return;
        runtime.compose.audienceRoles = nextRoles;
        renderNewsWorkspace();
    };
    window.toggleNewsAudienceFaculty = function toggleNewsAudienceFaculty(facultyCode) {
        const selected = new Set(uniqueStrings(runtime.compose.audienceFacultyCodes || []));
        if (selected.has(facultyCode)) selected.delete(facultyCode);
        else selected.add(facultyCode);
        const nextFaculties = [...selected];
        const currentFaculties = uniqueStrings(runtime.compose.audienceFacultyCodes || []);
        if (currentFaculties.length === nextFaculties.length && currentFaculties.every((value, index) => value === nextFaculties[index])) return;
        runtime.compose.audienceFacultyCodes = nextFaculties;
        renderNewsWorkspace();
    };
    window.resetNewsComposer = function resetNewsComposer() {
        runtime.compose = {
            title: '',
            sectionLabel: 'Academic Updates',
            body: '',
            priority: 'standard',
            allowReplies: true,
            pinned: false,
            audienceRoles: [],
            audienceFacultyCodes: []
        };
        renderNewsWorkspace();
    };
    window.publishNewsPost = async function publishNewsPost() {
        const actor = getCurrentUserSafe();
        if (!actor?.id) return;
        if (!String(runtime.compose.title || '').trim() || !String(runtime.compose.body || '').trim()) {
            runtime.error = 'Headline and body are required.';
            renderNewsWorkspace();
            return;
        }
        try {
            await kiuPortalFetch('/api/news/posts', {
                method: 'POST',
                body: JSON.stringify({
                    ...runtime.compose,
                    actorId: actor.id,
                    status: 'published'
                })
            });
            window.resetNewsComposer();
            await bootstrapNewsWorkspace(true);
        } catch (error) {
            runtime.error = error?.message || 'The announcement could not be published.';
            renderNewsWorkspace();
        }
    };
    window.updateNewsReplyDraft = function updateNewsReplyDraft(postId, value) {
        runtime.replyDrafts[String(postId || '')] = String(value || '');
    };
    window.submitNewsReply = async function submitNewsReply(postId) {
        const actor = getCurrentUserSafe();
        const body = String(runtime.replyDrafts[String(postId || '')] || '').trim();
        if (!actor?.id || !body) return;
        try {
            await kiuPortalFetch(`/api/news/posts/${encodeURIComponent(String(postId || ''))}/replies`, {
                method: 'POST',
                body: JSON.stringify({
                    actorId: actor.id,
                    body
                })
            });
            runtime.replyDrafts[String(postId || '')] = '';
            await bootstrapNewsWorkspace(true);
        } catch (error) {
            runtime.error = error?.message || 'The private reply could not be sent.';
            renderNewsWorkspace();
        }
    };
    window.updateNewsPrivilegeSearch = function updateNewsPrivilegeSearch(value) {
        runtime.privilegeSearch = String(value || '');
        if (runtime.privilegeSearchTimer) window.clearTimeout(runtime.privilegeSearchTimer);
        runtime.privilegeSearchTimer = window.setTimeout(() => {
            runtime.privilegeSearchTimer = null;
            renderNewsWorkspace();
        }, 120);
    };
    window.selectNewsPrivilegeAccount = function selectNewsPrivilegeAccount(accountId) {
        const nextAccountId = String(accountId || '');
        if (runtime.privilegeTargetId === nextAccountId) return;
        runtime.privilegeTargetId = nextAccountId;
        renderNewsWorkspace();
    };
    window.toggleNewsAccountPrivilege = function toggleNewsAccountPrivilege(accountId, privilegeId) {
        const account = runtime.accounts.find(item => String(item.id || '') === String(accountId || ''));
        if (!account || String(account.role || '').toLowerCase() === 'admin') return;
        const selected = new Set(uniqueStrings(account.grantedPrivileges || []));
        if (selected.has(privilegeId)) selected.delete(privilegeId);
        else selected.add(privilegeId);
        account.grantedPrivileges = [...selected];
        runtime.privilegeTargetId = String(accountId || '');
        renderNewsWorkspace();
    };
    window.saveNewsAccountPrivileges = async function saveNewsAccountPrivileges(accountId) {
        const actor = getCurrentUserSafe();
        const account = runtime.accounts.find(item => String(item.id || '') === String(accountId || ''));
        if (!actor?.id || !account) return;
        try {
            const payload = await kiuPortalFetch(`/api/admin/accounts/${encodeURIComponent(String(accountId || ''))}/privileges`, {
                method: 'POST',
                body: JSON.stringify({
                    actorId: actor.id,
                    privileges: uniqueStrings(account.grantedPrivileges || [])
                })
            });
            if (payload?.account) {
                runtime.accounts = runtime.accounts.map(item => String(item.id || '') === String(payload.account.id || '') ? payload.account : item);
            }
            await bootstrapNewsWorkspace(true);
        } catch (error) {
            runtime.error = error?.message || 'Privileges could not be saved.';
            renderNewsWorkspace();
        }
    };

    window.addEventListener('kiu:news-updated', () => {
        if (!isNewsWorkspaceVisible()) {
            runtime.bootstrapped = false;
            return;
        }
        bootstrapNewsWorkspace(true);
    });

    window.addEventListener('kiu:privileges-updated', () => {
        runtime.bootstrapped = false;
        if (!isNewsWorkspaceVisible()) return;
        bootstrapNewsWorkspace(true);
    });

    function initializeNewsWorkspace() {
        if (!q(ROOT_ID)) return;
        installNewsWorkspaceDelegates();
        renderNewsWorkspace();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeNewsWorkspace, { once: true });
    } else {
        initializeNewsWorkspace();
    }
})();
