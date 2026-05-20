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
        escape
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
            <div class="social-neo-profile-cover ${isOwn ? 'is-own' : ''}" ${!isOwn ? '' : `data-action="profile-edit-cover" style="cursor:pointer"`}>
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
                            ? `<button class="social-neo-btn social-neo-btn-primary" type="button" data-action="profile-edit"><i class="fas fa-edit"></i> Edit Profile</button>`
                            : `<button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="profile-message" data-user-id="${escape(userId)}"><i class="fas fa-envelope"></i> Message</button>`
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
                            <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="focus-feed" data-scope-type="${escape(item.type)}" data-scope-id="${escape(item.id)}">Open</button>
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
                            <input class="social-neo-input" id="profileDisplayName" name="profileDisplayName" type="text" placeholder="How people know you on campus" value="${escape(runtime.ui.profileDisplayName || displayName(account))}">
                        </div>
                        <div class="social-neo-profile-edit-field">
                            <label for="profileBio">Bio</label>
                            <textarea class="social-neo-textarea" id="profileBio" name="profileBio" rows="4" placeholder="Tell people about yourself...">${escape(runtime.ui.profileBio || bio)}</textarea>
                        </div>
                        <div class="social-neo-profile-edit-field">
                            <label for="profileLocation">Location</label>
                            <input class="social-neo-input" id="profileLocation" name="profileLocation" type="text" placeholder="City, Country" value="${escape(runtime.ui.profileLocation || text(account?.location || ''))}">
                        </div>
                        <div class="social-neo-profile-edit-field">
                            <label for="profileWebsite">Website</label>
                            <input class="social-neo-input" id="profileWebsite" name="profileWebsite" type="url" placeholder="https://..." value="${escape(runtime.ui.profileWebsite || text(account?.website || ''))}">
                        </div>
                        <div class="social-neo-profile-edit-field">
                            <label for="profileBirthday">Birthday</label>
                            <input class="social-neo-input" id="profileBirthday" name="profileBirthday" type="date" value="${escape(runtime.ui.profileBirthday || text(account?.birthday || ''))}">
                        </div>
                        <div class="social-neo-profile-edit-field">
                            <label for="profileInterests">Interests</label>
                            <input class="social-neo-input" id="profileInterests" name="profileInterests" type="text" placeholder="AI, robotics, economics" value="${escape(runtime.ui.profileInterests || (Array.isArray(account?.interests) ? account.interests.join(', ') : ''))}">
                        </div>
                        <div class="social-neo-profile-edit-field">
                            <label for="profileAvailability">Availability</label>
                            <input class="social-neo-input" id="profileAvailability" name="profileAvailability" type="text" placeholder="Weekdays after 15:00" value="${escape(runtime.ui.profileAvailability || text(account?.availability || ''))}">
                        </div>
                        <div class="social-neo-profile-edit-field">
                            <label for="profileOfficeHours">Office Hours</label>
                            <input class="social-neo-input" id="profileOfficeHours" name="profileOfficeHours" type="text" placeholder="Tue 14:00-16:00 / Faculty Hub" value="${escape(runtime.ui.profileOfficeHours || text(account?.officeHours || ''))}">
                        </div>
                        <div class="social-neo-profile-edit-field">
                            <label for="profileVisibility">Profile Visibility</label>
                            <select class="social-neo-select" id="profileVisibility" name="profileVisibility" data-lux-native data-lux-picker-enhanced="true">
                                <option value="campus" ${(runtime.ui.profileVisibility || currentSocialProfileSettings(userId).visibility || 'campus') === 'campus' ? 'selected' : ''}>Campus only</option>
                                <option value="connections" ${(runtime.ui.profileVisibility || currentSocialProfileSettings(userId).visibility || 'campus') === 'connections' ? 'selected' : ''}>Connections only</option>
                                <option value="public" ${(runtime.ui.profileVisibility || currentSocialProfileSettings(userId).visibility || 'campus') === 'public' ? 'selected' : ''}>Public</option>
                            </select>
                        </div>
                        <div class="social-neo-profile-edit-field">
                            <label for="profileDefaultAudience">Default Post Audience</label>
                            <select class="social-neo-select" id="profileDefaultAudience" name="profileDefaultAudience" data-lux-native data-lux-picker-enhanced="true">
                                <option value="campus" ${(runtime.ui.profileDefaultAudience || currentSocialProfileSettings(userId).defaultAudience || 'campus') === 'campus' ? 'selected' : ''}>Campus</option>
                                <option value="connections" ${(runtime.ui.profileDefaultAudience || currentSocialProfileSettings(userId).defaultAudience || 'campus') === 'connections' ? 'selected' : ''}>Connections</option>
                                <option value="private" ${(runtime.ui.profileDefaultAudience || currentSocialProfileSettings(userId).defaultAudience || 'campus') === 'private' ? 'selected' : ''}>Only me</option>
                            </select>
                        </div>
                        <div class="social-neo-profile-edit-field">
                            <label for="profileDigestFrequency">Digest Frequency</label>
                            <select class="social-neo-select" id="profileDigestFrequency" name="profileDigestFrequency" data-lux-native data-lux-picker-enhanced="true">
                                <option value="daily" ${(runtime.ui.profileDigestFrequency || currentSocialProfileSettings(userId).digestFrequency || 'daily') === 'daily' ? 'selected' : ''}>Daily digest</option>
                                <option value="weekly" ${(runtime.ui.profileDigestFrequency || currentSocialProfileSettings(userId).digestFrequency || 'daily') === 'weekly' ? 'selected' : ''}>Weekly digest</option>
                                <option value="off" ${(runtime.ui.profileDigestFrequency || currentSocialProfileSettings(userId).digestFrequency || 'daily') === 'off' ? 'selected' : ''}>Off</option>
                            </select>
                        </div>
                        <div class="social-neo-profile-edit-field">
                            <label for="profileEventReminderLeadHours">Event Reminder Lead Time</label>
                            <input class="social-neo-input" id="profileEventReminderLeadHours" name="profileEventReminderLeadHours" type="number" min="0" max="168" placeholder="24" value="${escape(String(runtime.ui.profileEventReminderLeadHours ?? currentSocialProfileSettings(userId).eventReminderLeadHours ?? 24))}">
                        </div>
                        <div class="social-neo-profile-edit-actions">
                            <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="profile-edit-cancel">Cancel</button>
                            <button class="social-neo-btn social-neo-btn-primary" type="submit"><i class="fas fa-save"></i> Save</button>
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
                <div class="social-neo-stack" style="margin-top:12px">
                ${profileTab === 'posts' ? renderPostsTab() : profileTab === 'friends' ? renderFriendsTab() : profileTab === 'following' ? renderFollowingTab() : profileTab === 'saved' ? renderSavedTab() : renderAboutTab()}
                </div>
            </div>
        `;
    }


    window.renderSocialProfilePanel = renderProfilePageBody;
})();
