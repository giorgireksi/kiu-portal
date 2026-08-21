/* Social profile/page/group mutation + invite helpers. Peeled from social-runtime-lite.js.
 * Load before social-runtime-lite.js.
 */
(function () {
    if (window.__KIU_SOCIAL_LITE_INVITE_LOADED) return;
    window.__KIU_SOCIAL_LITE_INVITE_LOADED = true;
    window.__kiuCreateSocialLiteInviteApi = function createKiuPeelApi(deps = {}) {
        with (deps) {

        async function saveProfileEdits(userId, fields) {
            const normalizedId = text(userId);
            if (!normalizedId) return;
            const account = getProfileById(normalizedId);
            if (!account) return;
            const nextAccount = { ...account };
            if (fields.displayName !== undefined) nextAccount.displayName = text(fields.displayName);
            if (fields.bio !== undefined) nextAccount.bio = text(fields.bio);
            if (fields.location !== undefined) nextAccount.location = text(fields.location);
            if (fields.website !== undefined) nextAccount.website = text(fields.website);
            if (fields.birthday !== undefined) nextAccount.birthday = text(fields.birthday);
            if (fields.availability !== undefined) nextAccount.availability = text(fields.availability);
            if (fields.officeHours !== undefined) nextAccount.officeHours = text(fields.officeHours);
            if (fields.coverImage !== undefined) nextAccount.coverImage = text(fields.coverImage);
            if (fields.interests !== undefined) {
                nextAccount.interests = Array.isArray(fields.interests)
                    ? fields.interests.map((entry) => text(entry)).filter(Boolean)
                    : text(fields.interests).split(',').map((entry) => text(entry)).filter(Boolean);
            }
            await portalRequest('/api/accounts/upsert', {
                method: 'POST',
                body: JSON.stringify({ account: nextAccount })
            });
            await portalRequest(`/api/social/profiles/${encodeURIComponent(normalizedId)}`, {
                method: 'POST',
                body: JSON.stringify({
                    actorId: currentUserId() || normalizedId,
                    visibility: text(fields.visibility || runtime.social?.profiles?.[normalizedId]?.visibility || 'public'),
                    defaultAudience: text(fields.defaultAudience || runtime.social?.profiles?.[normalizedId]?.defaultAudience || 'campus'),
                    digestFrequency: text(fields.digestFrequency || runtime.social?.profiles?.[normalizedId]?.digestFrequency || 'daily'),
                    eventReminderLeadHours: Number(fields.eventReminderLeadHours || runtime.social?.profiles?.[normalizedId]?.eventReminderLeadHours || 24)
                })
            });
            runtime.accountsById[normalizedId] = nextAccount;
            await loadSocialState(true);
            runtime.ui.profileDisplayName = text(fields.displayName || nextAccount.displayName || '');
            runtime.ui.profileBio = text(fields.bio || '');
            runtime.ui.profileLocation = text(fields.location || '');
            runtime.ui.profileWebsite = text(fields.website || '');
            runtime.ui.profileBirthday = text(fields.birthday || '');
            runtime.ui.profileInterests = Array.isArray(nextAccount.interests) ? nextAccount.interests.join(', ') : text(fields.interests || '');
            runtime.ui.profileAvailability = text(fields.availability || nextAccount.availability || '');
            runtime.ui.profileOfficeHours = text(fields.officeHours || nextAccount.officeHours || '');
            runtime.ui.profileCoverImage = text(fields.coverImage || nextAccount.coverImage || '');
            runtime.ui.profileVisibility = text(fields.visibility || runtime.social?.profiles?.[normalizedId]?.visibility || 'public');
            runtime.ui.profileDefaultAudience = text(fields.defaultAudience || runtime.social?.profiles?.[normalizedId]?.defaultAudience || 'campus');
            runtime.ui.profileDigestFrequency = text(fields.digestFrequency || runtime.social?.profiles?.[normalizedId]?.digestFrequency || 'daily');
            runtime.ui.profileEventReminderLeadHours = text(fields.eventReminderLeadHours || runtime.social?.profiles?.[normalizedId]?.eventReminderLeadHours || '24');
            runtime.ui.editProfileMode = false;
            queueRender('profile-saved');
        }

        async function updateSocialPage(pageId, input = {}) {
            const actorId = currentUserId();
            if (!actorId || !text(pageId)) throw new Error('Page settings could not be updated.');
            const payload = await portalRequest(`/api/social/pages/${encodeURIComponent(text(pageId))}`, {
                method: 'POST',
                body: JSON.stringify({
                    actorId,
                    ...input
                })
            });
            await loadSocialState(true);
            queueRender('page-updated');
            return payload?.page || null;
        }

        async function updateSocialGroup(groupId, input = {}) {
            const actorId = currentUserId();
            if (!actorId || !text(groupId)) throw new Error('Group settings could not be updated.');
            const payload = await portalRequest(`/api/social/groups/${encodeURIComponent(text(groupId))}`, {
                method: 'POST',
                body: JSON.stringify({
                    actorId,
                    ...input
                })
            });
            (Array.isArray(payload?.chats) ? payload.chats : []).forEach((chat) => upsertChat(chat, false));
            await loadSocialState(true);
            queueRender('group-updated');
            return payload?.group || null;
        }

        async function removeSocialGroupMember(groupId, memberId) {
            const actorId = currentUserId();
            if (!actorId || !text(groupId) || !text(memberId)) throw new Error('Group member could not be removed.');
            const payload = await portalRequest(`/api/social/groups/${encodeURIComponent(text(groupId))}/members/${encodeURIComponent(text(memberId))}?actorId=${encodeURIComponent(actorId)}`, {
                method: 'DELETE',
                body: JSON.stringify({ actorId })
            });
            (Array.isArray(payload?.chats) ? payload.chats : []).forEach((chat) => upsertChat(chat, false));
            await loadSocialState(true);
            queueRender('group-member-removed');
            return payload?.group || null;
        }

        async function deleteSocialGroup(groupId) {
            const actorId = currentUserId();
            if (!actorId || !text(groupId)) throw new Error('Group could not be deleted.');
            const payload = await portalRequest(`/api/social/groups/${encodeURIComponent(text(groupId))}?actorId=${encodeURIComponent(actorId)}`, {
                method: 'DELETE',
                body: JSON.stringify({ actorId })
            });
            await hydrateRuntime(true);
            setFlash('Group deleted.', 'success', { skipRender: true });
            return payload || null;
        }

        async function deleteSocialEvent(eventId) {
            const actorId = currentUserId();
            if (!actorId || !text(eventId)) throw new Error('Event could not be deleted.');
            const payload = await portalRequest(`/api/social/events/${encodeURIComponent(text(eventId))}?actorId=${encodeURIComponent(actorId)}`, {
                method: 'DELETE',
                body: JSON.stringify({ actorId })
            });
            await loadSocialState(true);
            setFlash('Event deleted.', 'success', { skipRender: true });
            queueRender('event-deleted');
            return payload || null;
        }

        async function deleteChatMessage(chatId, messageId) {
            const actorId = currentUserId();
            if (!actorId || !text(chatId) || !text(messageId)) throw new Error('Message could not be removed.');
            const payload = await portalRequest(`/api/messenger/chats/${encodeURIComponent(text(chatId))}/messages/${encodeURIComponent(text(messageId))}?actorId=${encodeURIComponent(actorId)}`, {
                method: 'DELETE',
                body: JSON.stringify({ actorId })
            });
            if (payload?.chat) upsertChat(payload.chat, true);
            setFlash('Message removed.', 'success', { skipRender: true });
            return payload?.chat || null;
        }

        async function inviteSocialGroupMember(groupId, memberId, note = '') {
            const actorId = currentUserId();
            if (!actorId || !text(groupId) || !text(memberId)) throw new Error('Group invitation could not be sent.');
            const payload = await portalRequest(`/api/social/groups/${encodeURIComponent(text(groupId))}/invite`, {
                method: 'POST',
                body: JSON.stringify({
                    actorId,
                    memberId: text(memberId),
                    note: text(note || '')
                })
            });
            (Array.isArray(payload?.chats) ? payload.chats : []).forEach((chat) => upsertChat(chat, false));
            await loadSocialState(true);
            queueRender('group-invite-sent');
            return payload || null;
        }

        const api = {
            saveProfileEdits,
            updateSocialPage,
            updateSocialGroup,
            removeSocialGroupMember,
            deleteSocialGroup,
            deleteSocialEvent,
            deleteChatMessage,
            inviteSocialGroupMember,
        };
        Object.assign(window, api);
        return api;
        }
    };
})();

