/* Deferred social profile panel extracted from social-page.js. */
(function initSocialProfileModule() {
    if (window.__KIU_SOCIAL_PROFILE_MODULE_LOADED) return;
    window.__KIU_SOCIAL_PROFILE_MODULE_LOADED = true;

    const hooks = window.__kiuSocialProfileHooks || {};
    const {
        state,
        text,
        currentUserId,
        profileAccount,
        profileCover,
        profilePostCount,
        profileFriendCount,
        profileFollowingCount,
        profileBio,
        avatar,
        displayName,
        roleLabel,
        facultyLabel,
        profilePosts,
        renderPost,
        profileFriends,
        profileFollowingItems,
        savedPostRecords,
        currentSocialProfileSettings,
        renderPortfolioProfileBlock,
        escape,
        renderFileChip,
        setPanel,
        openDialog,
        renderSocialPageNow,
        withBusy,
        root,
        invalidateSocialRenderCache,
        hydrateMyPortfolioDocument,
        openPortalDirectChat,
        setActiveChat,
        closeDialog,
        updatePortalSocialProfile,
        readFileAsDataUrl
    } = hooks;

    if (
        typeof state !== 'function'
        || typeof text !== 'function'
        || typeof currentUserId !== 'function'
        || typeof profileAccount !== 'function'
        || typeof profileCover !== 'function'
        || typeof profilePostCount !== 'function'
        || typeof profileFriendCount !== 'function'
        || typeof profileFollowingCount !== 'function'
        || typeof profileBio !== 'function'
        || typeof avatar !== 'function'
        || typeof displayName !== 'function'
        || typeof roleLabel !== 'function'
        || typeof facultyLabel !== 'function'
        || typeof profilePosts !== 'function'
        || typeof renderPost !== 'function'
        || typeof profileFriends !== 'function'
        || typeof profileFollowingItems !== 'function'
        || typeof savedPostRecords !== 'function'
        || typeof currentSocialProfileSettings !== 'function'
        || typeof renderPortfolioProfileBlock !== 'function'
        || typeof escape !== 'function'
        || typeof renderFileChip !== 'function'
        || typeof setPanel !== 'function'
        || typeof openDialog !== 'function'
        || typeof renderSocialPageNow !== 'function'
        || typeof withBusy !== 'function'
        || typeof root !== 'function'
        || typeof invalidateSocialRenderCache !== 'function'
        || typeof hydrateMyPortfolioDocument !== 'function'
        || typeof openPortalDirectChat !== 'function'
        || typeof setActiveChat !== 'function'
        || typeof closeDialog !== 'function'
        || typeof updatePortalSocialProfile !== 'function'
        || typeof readFileAsDataUrl !== 'function'
    ) {
        throw new Error('Social profile hooks are unavailable.');
    }

    function renderProfilePageBody() {
        const runtime = state();
        const userId = text(runtime.ui.activeProfileUserId || currentUserId());
        const account = profileAccount(userId);
        const isOwn = text(userId) === currentUserId();
        const profileTab = text(runtime.ui.profileTab || 'posts');
        const isEditing = runtime.ui.editProfileMode && isOwn;

        if (!account) {
            return `
                <div class="social-neo-card">
                    <div class="social-neo-empty">Profile not found.</div>
                </div>
            `;
        }

        const coverUrl = profileCover(account);
        const postCount = profilePostCount(userId);
        const friendCount = profileFriendCount(userId);
        const followingCount = profileFollowingCount(userId);
        const bio = profileBio(account);

        const renderTabs = () => `
            <div class="social-neo-profile-tabs">
                <button class="social-neo-profile-tab ${profileTab === 'posts' ? 'is-active' : ''}" type="button" data-action="profile-tab-posts">Posts</button>
                <button class="social-neo-profile-tab ${profileTab === 'friends' ? 'is-active' : ''}" type="button" data-action="profile-tab-friends">Friends</button>
                <button class="social-neo-profile-tab ${profileTab === 'following' ? 'is-active' : ''}" type="button" data-action="profile-tab-following">Following</button>
                <button class="social-neo-profile-tab ${profileTab === 'saved' ? 'is-active' : ''}" type="button" data-action="profile-tab-saved">Saved</button>
                <button class="social-neo-profile-tab ${profileTab === 'about' ? 'is-active' : ''}" type="button" data-action="profile-tab-about">About</button>
            </div>
        `;

        const renderHeader = () => `
            <div class="social-neo-profile-cover ${isOwn ? 'is-own' : ''}" ${!isOwn ? '' : 'data-action="profile-edit-cover"'}>
                ${coverUrl ? `<img class="social-neo-profile-cover-img" src="${escape(coverUrl)}" alt="Cover">` : ''}
                <div class="social-neo-profile-cover-overlay"></div>
                ${isOwn ? `<div class="social-neo-profile-cover-hint"><i class="fas fa-camera"></i> Update cover photo</div>` : ''}
            </div>
            <div class="social-neo-profile-header">
                <div class="social-neo-profile-avatar-wrap">
                    ${avatar(account, 'social-neo-profile-avatar')}
                </div>
                <div class="social-neo-profile-identity">
                    <div>
                        <div class="social-neo-profile-name">${escape(displayName(account))}</div>
                        <div class="social-neo-profile-role">
                            <span class="social-neo-pill">${escape(roleLabel(account?.role))}</span>
                            <span class="social-neo-pill">${escape(facultyLabel(account?.facultyCode || account?.faculty))}</span>
                        </div>
                    </div>
                    <div class="social-neo-profile-actions">
                        ${isOwn
                            ? `<button class="lux-primary-btn" type="button" data-action="profile-edit"><i class="fas fa-edit"></i> Edit Profile</button>`
                            : `<button class="lux-secondary-btn" type="button" data-action="profile-message" data-user-id="${escape(userId)}"><i class="fas fa-envelope"></i> Message</button>`
                        }
                    </div>
                </div>
                <div class="social-neo-profile-stats">
                    <button class="social-neo-profile-stat" type="button" data-action="profile-tab-posts">
                        <strong>${escape(postCount)}</strong>
                        <span>Posts</span>
                    </button>
                    <button class="social-neo-profile-stat" type="button" data-action="profile-tab-friends">
                        <strong>${escape(friendCount)}</strong>
                        <span>Friends</span>
                    </button>
                    <button class="social-neo-profile-stat" type="button" data-action="profile-tab-following">
                        <strong>${escape(followingCount)}</strong>
                        <span>Following</span>
                    </button>
                </div>
            </div>
        `;

        const renderPostsTab = () => {
            const posts = profilePosts(userId);
            if (!posts.length) {
                return `<div class="social-neo-empty">No posts yet.</div>`;
            }
            return `<div class="social-neo-profile-posts">
                ${posts.map((post) => renderPost(post)).join('')}
            </div>`;
        };

        const renderFriendsTab = () => {
            const friends = profileFriends(userId);
            if (!friends.length) {
                return `<div class="social-neo-empty">No friends yet.</div>`;
            }
            return `
                <div class="social-neo-profile-friends">
                    ${friends.slice(0, 12).map((friend) => `
                        <button class="social-neo-friend-chip" type="button" data-action="profile-view" data-user-id="${escape(text(friend.id))}">
                            ${avatar(friend, 'social-neo-avatar')}
                            <strong>${escape(displayName(friend).split(' ')[0])}</strong>
                            <span>${escape(roleLabel(friend?.role))}</span>
                        </button>
                    `).join('')}
                </div>
            `;
        };

        const renderFollowingTab = () => {
            const items = profileFollowingItems(userId);
            if (!items.length) {
                return `<div class="social-neo-empty">No followed pages or joined groups yet.</div>`;
            }
            return `
                <div class="social-neo-list">
                    ${items.map((item) => `
                        <article class="social-neo-entity-card">
                            <div>
                                <strong>${escape(item.name)}</strong>
                                <span>${escape(item.subtitle)}</span>
                                <div class="social-neo-badge-row">
                                    <span class="social-neo-pill">${escape(item.type === 'page' ? 'Page' : 'Group')}</span>
                                </div>
                            </div>
                            <button class="lux-secondary-btn" type="button" data-action="focus-feed" data-scope-type="${escape(item.type)}" data-scope-id="${escape(item.id)}">Open</button>
                        </article>
                    `).join('')}
                </div>
            `;
        };

        const renderSavedTab = () => {
            const savedPosts = savedPostRecords();
            if (!savedPosts.length) {
                return `<div class="social-neo-empty">Saved posts will appear here.</div>`;
            }
            return `<div class="social-neo-stack">${savedPosts.map((post) => renderPost(post)).join('')}</div>`;
        };

        const renderAboutTab = () => {
            if (isEditing) {
                return `
                    <form class="social-neo-profile-edit" data-form="edit-profile">
                        <div class="social-neo-profile-edit-field">
                            <label for="profileDisplayName">Display Name</label>
                            <input class="social-neo-input lux-control" id="profileDisplayName" name="profileDisplayName" type="text" placeholder="How people know you on campus" value="${escape(runtime.ui.profileDisplayName || displayName(account))}">
                        </div>
                        <div class="social-neo-profile-edit-field">
                            <label for="profileBio">Bio</label>
                            <textarea class="social-neo-textarea lux-control" id="profileBio" name="profileBio" rows="4" placeholder="Tell people about yourself...">${escape(runtime.ui.profileBio || bio)}</textarea>
                        </div>
                        <div class="social-neo-profile-edit-field">
                            <label for="profileLocation">Location</label>
                            <input class="social-neo-input lux-control" id="profileLocation" name="profileLocation" type="text" placeholder="City, Country" value="${escape(runtime.ui.profileLocation || text(account?.location || ''))}">
                        </div>
                        <div class="social-neo-profile-edit-field">
                            <label for="profileWebsite">Website</label>
                            <input class="social-neo-input lux-control" id="profileWebsite" name="profileWebsite" type="url" placeholder="https://..." value="${escape(runtime.ui.profileWebsite || text(account?.website || ''))}">
                        </div>
                        <div class="social-neo-profile-edit-field">
                            <label for="profileBirthday">Birthday</label>
                            <input class="social-neo-input lux-control" id="profileBirthday" name="profileBirthday" type="date" value="${escape(runtime.ui.profileBirthday || text(account?.birthday || ''))}">
                        </div>
                        <div class="social-neo-profile-edit-field">
                            <label for="profileInterests">Interests</label>
                            <input class="social-neo-input lux-control" id="profileInterests" name="profileInterests" type="text" placeholder="AI, robotics, economics" value="${escape(runtime.ui.profileInterests || (Array.isArray(account?.interests) ? account.interests.join(', ') : ''))}">
                        </div>
                        <div class="social-neo-profile-edit-field">
                            <label for="profileAvailability">Availability</label>
                            <input class="social-neo-input lux-control" id="profileAvailability" name="profileAvailability" type="text" placeholder="Weekdays after 15:00" value="${escape(runtime.ui.profileAvailability || text(account?.availability || ''))}">
                        </div>
                        <div class="social-neo-profile-edit-field">
                            <label for="profileOfficeHours">Office Hours</label>
                            <input class="social-neo-input lux-control" id="profileOfficeHours" name="profileOfficeHours" type="text" placeholder="Tue 14:00-16:00 / Faculty Hub" value="${escape(runtime.ui.profileOfficeHours || text(account?.officeHours || ''))}">
                        </div>
                        <div class="social-neo-profile-edit-field">
                            <label for="profileVisibility">Profile Visibility</label>
                            <select class="social-neo-select lux-control" id="profileVisibility" name="profileVisibility" data-lux-native data-lux-picker-enhanced="true">
                                <option value="campus" ${(runtime.ui.profileVisibility || currentSocialProfileSettings(userId).visibility || 'campus') === 'campus' ? 'selected' : ''}>Campus only</option>
                                <option value="connections" ${(runtime.ui.profileVisibility || currentSocialProfileSettings(userId).visibility || 'campus') === 'connections' ? 'selected' : ''}>Connections only</option>
                                <option value="public" ${(runtime.ui.profileVisibility || currentSocialProfileSettings(userId).visibility || 'campus') === 'public' ? 'selected' : ''}>Public</option>
                            </select>
                        </div>
                        <div class="social-neo-profile-edit-field">
                            <label for="profileDefaultAudience">Default Post Audience</label>
                            <select class="social-neo-select lux-control" id="profileDefaultAudience" name="profileDefaultAudience" data-lux-native data-lux-picker-enhanced="true">
                                <option value="campus" ${(runtime.ui.profileDefaultAudience || currentSocialProfileSettings(userId).defaultAudience || 'campus') === 'campus' ? 'selected' : ''}>Campus</option>
                                <option value="connections" ${(runtime.ui.profileDefaultAudience || currentSocialProfileSettings(userId).defaultAudience || 'campus') === 'connections' ? 'selected' : ''}>Connections</option>
                                <option value="private" ${(runtime.ui.profileDefaultAudience || currentSocialProfileSettings(userId).defaultAudience || 'campus') === 'private' ? 'selected' : ''}>Only me</option>
                            </select>
                        </div>
                        <div class="social-neo-profile-edit-field">
                            <label for="profileDigestFrequency">Digest Frequency</label>
                            <select class="social-neo-select lux-control" id="profileDigestFrequency" name="profileDigestFrequency" data-lux-native data-lux-picker-enhanced="true">
                                <option value="daily" ${(runtime.ui.profileDigestFrequency || currentSocialProfileSettings(userId).digestFrequency || 'daily') === 'daily' ? 'selected' : ''}>Daily digest</option>
                                <option value="weekly" ${(runtime.ui.profileDigestFrequency || currentSocialProfileSettings(userId).digestFrequency || 'daily') === 'weekly' ? 'selected' : ''}>Weekly digest</option>
                                <option value="off" ${(runtime.ui.profileDigestFrequency || currentSocialProfileSettings(userId).digestFrequency || 'daily') === 'off' ? 'selected' : ''}>Off</option>
                            </select>
                        </div>
                        <div class="social-neo-profile-edit-field">
                            <label for="profileEventReminderLeadHours">Event Reminder Lead Time</label>
                            <input class="social-neo-input lux-control" id="profileEventReminderLeadHours" name="profileEventReminderLeadHours" type="number" min="0" max="168" placeholder="24" value="${escape(String(runtime.ui.profileEventReminderLeadHours ?? currentSocialProfileSettings(userId).eventReminderLeadHours ?? 24))}">
                        </div>
                        <div class="social-neo-profile-edit-actions">
                            <button class="lux-secondary-btn" type="button" data-action="profile-edit-cancel">Cancel</button>
                            <button class="lux-primary-btn" type="submit"><i class="fas fa-save"></i> Save</button>
                        </div>
                    </form>
                `;
            }

            return `
                <div class="social-neo-profile-about">
                    ${bio ? `<div class="social-neo-profile-bio">${escape(bio)}</div>` : ''}
                    ${Array.isArray(account?.interests) && account.interests.length ? `
                        <div class="social-neo-badge-row">
                            ${account.interests.slice(0, 6).map((interest) => `<span class="social-neo-pill">${escape(interest)}</span>`).join('')}
                        </div>
                    ` : ''}
                    <div class="social-neo-profile-about-card">
                        <div class="social-neo-profile-about-row">
                            <i class="fas fa-user"></i>
                            <span>Role</span>
                            <span>${escape(roleLabel(account?.role))}</span>
                        </div>
                        <div class="social-neo-profile-about-row">
                            <i class="fas fa-building"></i>
                            <span>Faculty</span>
                            <span>${escape(facultyLabel(account?.facultyCode || account?.faculty))}</span>
                        </div>
                        ${account?.location ? `
                        <div class="social-neo-profile-about-row">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>Location</span>
                            <span>${escape(account.location)}</span>
                        </div>` : ''}
                        ${account?.website ? `
                        <div class="social-neo-profile-about-row">
                            <i class="fas fa-link"></i>
                            <span>Website</span>
                            <span><a href="${escape(account.website)}" target="_blank" rel="noopener">${escape(account.website)}</a></span>
                        </div>` : ''}
                        ${account?.birthday ? `
                        <div class="social-neo-profile-about-row">
                            <i class="fas fa-birthday-cake"></i>
                            <span>Birthday</span>
                            <span>${escape(account.birthday)}</span>
                        </div>` : ''}
                        ${account?.email ? `
                        <div class="social-neo-profile-about-row">
                            <i class="fas fa-envelope"></i>
                            <span>Email</span>
                            <span>${escape(account.email)}</span>
                        </div>` : ''}
                        ${account?.availability ? `
                        <div class="social-neo-profile-about-row">
                            <i class="fas fa-clock"></i>
                            <span>Availability</span>
                            <span>${escape(account.availability)}</span>
                        </div>` : ''}
                        ${account?.officeHours ? `
                        <div class="social-neo-profile-about-row">
                            <i class="fas fa-calendar"></i>
                            <span>Office hours</span>
                            <span>${escape(account.officeHours)}</span>
                        </div>` : ''}
                        <div class="social-neo-profile-about-row">
                            <i class="fas fa-eye"></i>
                            <span>Visibility</span>
                            <span>${escape(text(currentSocialProfileSettings(userId).visibility || 'campus'))}</span>
                        </div>
                        <div class="social-neo-profile-about-row">
                            <i class="fas fa-bullhorn"></i>
                            <span>Default audience</span>
                            <span>${escape(text(currentSocialProfileSettings(userId).defaultAudience || 'campus'))}</span>
                        </div>
                        <div class="social-neo-profile-about-row">
                            <i class="fas fa-inbox"></i>
                            <span>Digest</span>
                            <span>${escape(text(currentSocialProfileSettings(userId).digestFrequency || 'daily'))}</span>
                        </div>
                        <div class="social-neo-profile-about-row">
                            <i class="fas fa-bell"></i>
                            <span>Event reminders</span>
                            <span>${escape(`${Number(currentSocialProfileSettings(userId).eventReminderLeadHours ?? 24)} hours before`)}</span>
                        </div>
                    </div>
                </div>
            `;
        };

        return `
            <div class="social-neo-profile">
                ${renderHeader()}
                ${renderPortfolioProfileBlock(userId, { isOwn })}
                ${renderTabs()}
                <div class="social-neo-stack social-neo-grid-mt-12">
                ${profileTab === 'posts' ? renderPostsTab() : profileTab === 'friends' ? renderFriendsTab() : profileTab === 'following' ? renderFollowingTab() : profileTab === 'saved' ? renderSavedTab() : renderAboutTab()}
                </div>
            </div>
        `;
    }

    const PROFILE_OWNED_DIALOG_KINDS = new Set(['profile-cover']);

    function renderProfileOwnedDialog(runtime, dialog) {
        if (!dialog) return '';
        const kind = text(dialog.type);
        if (!PROFILE_OWNED_DIALOG_KINDS.has(kind)) return '';
        if (kind === 'profile-cover') {
            return `<div class="lux-glass-dialog-backdrop" data-action="dialog-close">
                <form class="lux-glass-dialog-card" data-form="dialog-profile-cover" data-action="noop">
                    ${typeof socialNeoDialogHead === 'function' ? socialNeoDialogHead('Update cover photo', 'Paste an image URL or upload a file for your profile banner.') : ''}
                    <input class="social-neo-input lux-control" name="coverImageUrl" type="url" placeholder="https://..." value="${escape(text(dialog.coverImage || ''))}">
                    ${renderFileChip(state().ui?.coverImageFile, 'Cover image ready')}
                    <div class="social-neo-inline social-neo-quick-actions">
                        <label class="lux-secondary-btn lux-secondary-btn-pointer">
                            <i class="fas fa-image"></i> Upload image
                            <input name="coverImageFile" type="file" accept="image/*" hidden>
                        </label>
                    </div>
                    ${typeof socialNeoDialogActions === 'function' ? socialNeoDialogActions({ cancelLabel: 'Cancel', submitLabel: 'Update cover' }) : ''}
                </form>
            </div>`;
        }
        return '';
    }

    window.renderSocialProfilePanel = renderProfilePageBody;
    window.renderProfileOwnedDialog = renderProfileOwnedDialog;
    window.PROFILE_OWNED_DIALOG_KINDS = PROFILE_OWNED_DIALOG_KINDS;

    function isSocialProfileClickAction(action) {
        const a = text(action || '');
        return Boolean(a) && a.startsWith('profile-');
    }

    function handleSocialProfileClick(action, trigger) {
        if (!isSocialProfileClickAction(action)) return false;
        if (action === 'profile-portfolio-open') {
            state().ui.activeProjectId = '';
            state().ui.projectTab = 'overview';
            state().ui.portfolioPanelTab = 'mine';
            setPanel('projects');
            if (state().ui.portfolioPanelTab === 'mine') {
                return withBusy(async () => {
                    await hydrateMyPortfolioDocument(true);
                    renderSocialPageNow('profile-portfolio-open');
                });
            }
            return renderSocialPageNow('profile-portfolio-open');
        }

if (action === 'profile-tab-posts') { state().ui.profileTab = 'posts'; return renderSocialPageNow('profile-tab'); }

if (action === 'profile-tab-friends') { state().ui.profileTab = 'friends'; return renderSocialPageNow('profile-tab'); }

if (action === 'profile-tab-saved') { state().ui.profileTab = 'saved'; return renderSocialPageNow('profile-tab'); }

if (action === 'profile-tab-about') { state().ui.profileTab = 'about'; return renderSocialPageNow('profile-tab'); }

if (action === 'profile-tab-following') { state().ui.profileTab = 'following'; return renderSocialPageNow('profile-tab'); }

        if (action === 'profile-view') {
            const userId = trigger.getAttribute('data-user-id');
            state().ui.activeProfileUserId = text(userId || currentUserId());
            state().ui.profileTab = 'posts';
            setPanel('profile');
            invalidateSocialRenderCache({ center: true });
            return renderSocialPageNow('profile-view');
        }

        if (action === 'profile-edit') {
            state().ui.editProfileMode = true;
            state().ui.profileTab = 'about';
            renderSocialPageNow('profile-edit');
            window.requestAnimationFrame(() => {
                root()?.querySelector('[data-profile-tab="about"], .social-neo-profile-about, form[data-form="profile"]')
                    ?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
            });
            return;
        }

        if (action === 'profile-edit-cancel') { state().ui.editProfileMode = false; return renderSocialPageNow('profile-cancel'); }

        if (action === 'profile-edit-cover') return openDialog('profile-cover', { coverImage: profileCover(profileAccount(currentUserId())) });

        if (action === 'profile-message') {
            return withBusy(async () => {
                const chat = await openPortalDirectChat(trigger.getAttribute('data-user-id'));
                if (chat?.id) { setActiveChat(chat.id); setPanel('messages'); }
            });
        }
        return false;
    }

    window.handleSocialProfileClick = handleSocialProfileClick;
    window.isSocialProfileClickAction = isSocialProfileClickAction;

    function isSocialProfileSubmitForm(formType) {
        const f = text(formType || '');
        return f === 'edit-profile' || f === 'dialog-profile-cover';
    }

    function handleSocialProfileSubmit(formType, form, runtime, event) {
        if (!isSocialProfileSubmitForm(formType)) return false;
        if (formType === 'edit-profile') {
            return withBusy(async () => {
                const payload = {
                    displayName: text(form.profileDisplayName?.value || runtime.ui?.profileDisplayName),
                    bio: text(form.profileBio?.value || runtime.ui?.profileBio),
                    location: text(form.profileLocation?.value || runtime.ui?.profileLocation),
                    website: text(form.profileWebsite?.value || runtime.ui?.profileWebsite),
                    interests: text(form.profileInterests?.value || runtime.ui?.profileInterests),
                    availability: text(form.profileAvailability?.value || runtime.ui?.profileAvailability),
                    officeHours: text(form.profileOfficeHours?.value || runtime.ui?.profileOfficeHours),
                    birthday: text(form.profileBirthday?.value || runtime.ui?.profileBirthday),
                    coverImage: text(runtime.ui?.profileCoverImage || profileCover(profileAccount(currentUserId()))),
                    visibility: text(form.profileVisibility?.value || runtime.ui?.profileVisibility || currentSocialProfileSettings().visibility || 'campus') || 'campus',
                    defaultAudience: text(form.profileDefaultAudience?.value || runtime.ui?.profileDefaultAudience || currentSocialProfileSettings().defaultAudience || 'campus') || 'campus',
                    digestFrequency: text(form.profileDigestFrequency?.value || runtime.ui?.profileDigestFrequency || currentSocialProfileSettings().digestFrequency || 'daily') || 'daily',
                    eventReminderLeadHours: Number(form.profileEventReminderLeadHours?.value || runtime.ui?.profileEventReminderLeadHours || currentSocialProfileSettings().eventReminderLeadHours || 24)
                };
                await updatePortalSocialProfile(payload);
                runtime.ui.editProfileMode = false;
                renderSocialPageNow('profile-saved');
            });
        }

        if (formType === 'dialog-profile-cover') {
            return withBusy(async () => {
                const coverImage = text(form.coverImageUrl?.value || '') || await readFileAsDataUrl(runtime.ui?.coverImageFile || null);
                if (!coverImage) throw new Error('Provide an image URL or upload a cover image first.');
                await updatePortalSocialProfile({ coverImage });
                runtime.ui.coverImageFile = null;
                runtime.ui.profileCoverImage = coverImage;
                closeDialog();
            });
        }
        return false;
    }

    window.handleSocialProfileSubmit = handleSocialProfileSubmit;
    window.isSocialProfileSubmitForm = isSocialProfileSubmitForm;

    function isSocialProfileInputTarget(target) {
        if (!target || typeof target.matches !== 'function') return false;
        try {

        if (target.closest && target.closest('form[data-form="edit-profile"]')) return true;

        } catch (e) {}
        return false;
    }

    function handleSocialProfileInput(target, runtime, event) {
        if (!isSocialProfileInputTarget(target)) return false;
        if (target.matches('form[data-form="edit-profile"] [name="profileDisplayName"]')) runtime.ui.profileDisplayName = target.value;
        if (target.matches('form[data-form="edit-profile"] [name="profileBio"]')) runtime.ui.profileBio = target.value;
        if (target.matches('form[data-form="edit-profile"] [name="profileLocation"]')) runtime.ui.profileLocation = target.value;
        if (target.matches('form[data-form="edit-profile"] [name="profileWebsite"]')) runtime.ui.profileWebsite = target.value;
        if (target.matches('form[data-form="edit-profile"] [name="profileBirthday"]')) runtime.ui.profileBirthday = target.value;
        if (target.matches('form[data-form="edit-profile"] [name="profileInterests"]')) runtime.ui.profileInterests = target.value;
        if (target.matches('form[data-form="edit-profile"] [name="profileAvailability"]')) runtime.ui.profileAvailability = target.value;
        if (target.matches('form[data-form="edit-profile"] [name="profileOfficeHours"]')) runtime.ui.profileOfficeHours = target.value;
        if (target.matches('form[data-form="edit-profile"] [name="profileVisibility"]')) runtime.ui.profileVisibility = target.value;
        if (target.matches('form[data-form="edit-profile"] [name="profileDefaultAudience"]')) runtime.ui.profileDefaultAudience = target.value;
        if (target.matches('form[data-form="edit-profile"] [name="profileDigestFrequency"]')) runtime.ui.profileDigestFrequency = target.value;
        if (target.matches('form[data-form="edit-profile"] [name="profileEventReminderLeadHours"]')) runtime.ui.profileEventReminderLeadHours = target.value;

        return true;
    }

    function isSocialProfileChangeTarget(target) {
        if (!target || typeof target.matches !== 'function') return false;
        try {

        if (target.name === 'coverImageFile') return true;

        } catch (e) {}
        return false;
    }

    function handleSocialProfileChange(target, runtime, event) {
        if (!isSocialProfileChangeTarget(target)) return false;
        if (target.name === 'coverImageFile') {
            runtime.ui.coverImageFile = target.files?.[0] || null;
            renderSocialPageNow('cover-image-file');
        }

        return true;
    }

    window.handleSocialProfileInput = handleSocialProfileInput;
    window.isSocialProfileInputTarget = isSocialProfileInputTarget;
    window.handleSocialProfileChange = handleSocialProfileChange;
    window.isSocialProfileChangeTarget = isSocialProfileChangeTarget;

})();
