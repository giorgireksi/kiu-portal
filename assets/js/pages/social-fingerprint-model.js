/* Social render fingerprint helpers (pure).
 * Eager: social.html before social-page.js.
 */
(function initSocialFingerprintModel() {
    'use strict';
    if (window.__KIU_SOCIAL_FINGERPRINT_MODEL_LOADED) return;
    window.__KIU_SOCIAL_FINGERPRINT_MODEL_LOADED = true;

    function hooks() {
        return window.__kiuSocialFingerprintHooks || {};
    }

    function pick(name, fallback) {
        const hook = hooks()[name];
        if (typeof hook === 'function') return hook;
        if (typeof window[name] === 'function' && window[name] !== fallback) return window[name];
        return typeof fallback === 'function' ? fallback : () => fallback;
    }

    function text(value) {
        return pick('text', (v) => String(v == null ? '' : v).trim())(value);
    }

    function postKey(post) {
        return pick('postKey', (p) => String(p?.id || p || ''))(post);
    }

    function isPostSaved(postId) {
        return pick('isPostSaved', () => false)(postId);
    }

    function collectCommentReactionFingerprint(comments = [], limit = 12, collected = []) {
        if (!Array.isArray(comments) || collected.length >= limit) return collected;
        comments.forEach((comment) => {
            if (collected.length >= limit) return;
            collected.push([text(comment?.id), JSON.stringify(comment?.reactionCounts || {})]);
            if (Array.isArray(comment?.replies) && comment.replies.length) {
                collectCommentReactionFingerprint(comment.replies, limit, collected);
            }
        });
        return collected;
    }

    function summarizeCommentReactions(comments = []) {
        return JSON.stringify(collectCommentReactionFingerprint(comments).slice(0, 12));
    }

    function buildFeedFingerprint(runtime) {
        const feed = Array.isArray(runtime?.feed) ? runtime.feed : [];
        const feedSlice = feed.slice(0, 24).map((post) => [
            postKey(post),
            text(post?.viewerReaction || ''),
            JSON.stringify(post?.reactionCounts || {}),
            isPostSaved(postKey(post)) ? '1' : '0',
            post?.isPinned ? '1' : '0',
            Number(post?.replyCount || 0),
            Number(post?.shareCount || 0),
            summarizeCommentReactions(post?.comments)
        ].join(':')).join('|');
        const drafts = JSON.stringify(runtime?.ui?.commentDraftByPost || {});
        const replies = JSON.stringify(runtime?.ui?.commentReplyTargetByPost || {});
        return `${feedSlice}::${drafts}::${replies}`;
    }

    function buildRelationshipsFingerprint(runtime) {
        const relationships = Array.isArray(runtime?.social?.relationships) ? runtime.social.relationships : [];
        return relationships.slice(0, 48).map((relationship) => [
            text(relationship?.id),
            text(relationship?.type),
            text(relationship?.status),
            text(relationship?.fromId),
            text(relationship?.toId)
        ].join(':')).join('|');
    }

    function buildLostFoundFingerprint(runtime) {
        const items = Array.isArray(runtime?.social?.lostFoundItems) ? runtime.social.lostFoundItems : [];
        return items.slice(0, 48).map((item) => [
            text(item?.id),
            text(item?.status),
            text(item?.expiresAt),
            text(item?.updatedAt || item?.createdAt)
        ].join(':')).join('|');
    }

    function buildSurveysFingerprint(runtime) {
        const items = Array.isArray(runtime?.social?.surveys) ? runtime.social.surveys : [];
        const responses = Array.isArray(runtime?.social?.surveyResponses) ? runtime.social.surveyResponses : [];
        const responseCount = responses.length;
        return [
            String(responseCount),
            items.slice(0, 48).map((item) => [
                text(item?.id),
                text(item?.status),
                text(item?.closesAt),
                item?.viewerHasResponded ? '1' : '0',
                item?.viewerCanRespond ? '1' : '0',
                item?.viewerCanManage ? '1' : '0',
                item?.viewerCanViewResults ? '1' : '0',
                String(item?.responseCount || 0),
                text(item?.updatedAt || item?.createdAt)
            ].join(':')).join('|')
        ].join('||');
    }

    function buildEventsFingerprint(runtime) {
        const items = Array.isArray(runtime?.social?.events) ? runtime.social.events : [];
        return [
            String(items.length),
            items.slice(0, 48).map((item) => [
                text(item?.id),
                text(item?.viewerRsvpStatus),
                item?.viewerCanEdit ? '1' : '0',
                item?.viewerCanDelete ? '1' : '0',
                Number(item?.attendeeSummary?.going || 0),
                Number(item?.attendeeSummary?.interested || 0)
            ].join(':')).join('|')
        ].join('||');
    }

    function buildGroupsFingerprint(runtime) {
        const items = Array.isArray(runtime?.social?.groups) ? runtime.social.groups : [];
        return items.slice(0, 48).map((item) => [
            text(item?.id),
            text(item?.membershipState || item?.viewerMembershipState || ''),
            item?.viewerIsMember ? '1' : '0',
            Number(item?.memberCount || 0),
            (Array.isArray(item?.pendingMemberIds) ? item.pendingMemberIds.length : 0),
            text(item?.visibility || ''),
            item?.isManager ? '1' : '0'
        ].join(':')).join('|');
    }

    function buildDirectoryFingerprint(runtime) {
        const items = Array.isArray(runtime?.directory) ? runtime.directory : [];
        return [
            String(items.length),
            items.slice(0, 48).map((item) => text(item?.id || item?.userId || '')).join(',')
        ].join(':');
    }

    function buildReportsFingerprint(runtime) {
        const items = Array.isArray(runtime?.social?.reports) ? runtime.social.reports : [];
        return items.slice(0, 48).map((item) => [
            text(item?.id),
            text(item?.reportStatus || item?.status || '')
        ].join(':')).join('|');
    }

    function buildNotificationsFingerprint(runtime) {
        const items = Array.isArray(runtime?.notifications) ? runtime.notifications : [];
        return items.slice(0, 48).map((item) => [
            text(item?.id),
            item?.isRead ? '1' : '0',
            text(item?.createdAt)
        ].join(':')).join('|');
    }

    function buildChatsFingerprint(runtime) {
        const items = Array.isArray(runtime?.chats) ? runtime.chats : [];
        return items.slice(0, 48).map((item) => [
            text(item?.id),
            Number(item?.unreadCount || 0),
            text(item?.lastMessageAt || item?.updatedAt || '')
        ].join(':')).join('|');
    }

    function buildProjectsFingerprint(runtime) {
        const items = Array.isArray(runtime?.social?.projects) ? runtime.social.projects : [];
        return items.slice(0, 48).map((item) => [
            text(item?.id),
            text(item?.status),
            String((Array.isArray(item?.tasks) ? item.tasks : []).length),
            String((Array.isArray(item?.members) ? item.members : []).length),
            text(item?.updatedAt || item?.createdAt)
        ].join(':')).join('|');
    }

    function buildPortfolioFingerprint(runtime) {
        const doc = runtime?.ui?.myPortfolio || null;
        const sections = Array.isArray(doc?.sections) ? doc.sections : [];
        const entryCount = sections.reduce((sum, section) => sum + (Array.isArray(section?.entries) ? section.entries.length : 0), 0);
        return [
            text(doc?.status || ''),
            String(sections.length),
            String(entryCount),
            text(runtime?.ui?.portfolioSaveStatus || '')
        ].join(':');
    }

    function buildPhotographyUiFingerprint(runtime) {
        const ui = runtime?.ui || {};
        return [
            text(ui.photographyTab || 'explore'),
            text(ui.photographySearch || ''),
            text(ui.photographyProfileUserId || ''),
            ui.photographyMyProfile ? '1' : '0',
            text(ui.photographyMyProfileTab || '')
        ].join(':');
    }

    function buildPagesFingerprint(runtime) {
        const pages = Array.isArray(runtime?.social?.pages) ? runtime.social.pages : [];
        return pages.slice(0, 48).map((page) => [
            text(page?.id),
            page?.isFollowing ? '1' : '0'
        ].join(':')).join('|');
    }



    function currentUser() {
        return pick('currentUser', () => null)();
    }

    function currentUserId() {
        return pick('currentUserId', () => '')();
    }

    function currentFacultyCode() {
        return pick('currentFacultyCode', () => '')();
    }

    function activeDialog() {
        return pick('activeDialog', () => null)();
    }

    function isPortalStoryViewerOpen() {
        return pick('isPortalStoryViewerOpen', () => false)();
    }

    function isPortalStoryComposerOpen() {
        return pick('isPortalStoryComposerOpen', () => false)();
    }

    function buildSocialRenderSignature(activePanel, runtime) {
        const ui = runtime?.ui || {};
        const dialog = activeDialog();
        return [
            activePanel,
            text(currentUser()?.role || 'student'),
            text(currentUserId() || ''),
            text(typeof currentFacultyCode === 'function' ? currentFacultyCode() : ''),
            text(ui.activeChatId || ''),
            JSON.stringify(ui.groupThreadSearchByChat || {}),
            JSON.stringify(ui.groupThreadPanelByChat || {}),
            JSON.stringify(ui.messageFileByChat || {}),
            JSON.stringify(ui.groupThreadJumpMessageByChat || {}),
            JSON.stringify(ui.groupThreadSearchIndexByChat || {}),
            JSON.stringify(ui.groupPanelFileFilter || {}),
            text(ui.homeFeedFilter || ''),
            text(ui.feedScopeType || ''),
            text(ui.feedScopeId || ''),
            text(ui.communityTab || ''),
            text(ui.directorySearch || ''),
            text(ui.directoryRole || 'all'),
            text(ui.groupsTab || 'discover'),
            text(ui.groupName || ''),
            text(ui.groupDescription || ''),
            text(ui.groupVisibility || 'public'),
            text(ui.groupMaxMembers || ''),
            text(ui.groupInviteSearch || ''),
            text(ui.groupInviteFaculty || 'all'),
            (Array.isArray(ui.groupInviteSelectedIds) ? ui.groupInviteSelectedIds.map((item) => text(item)).filter(Boolean).join(',') : ''),
            text(ui.eventsSubTab || ''),
            text(ui.eventsComposerSection || ''),
            text(ui.activeScopeType || ''),
            text(ui.activeScopeId || ''),
            text(ui.eventScope || ''),
            Boolean(ui.eventIsOnline),
            text(ui.eventImageFile?.name || ''),
            text(ui.messagesFilter || ''),
            text(ui.alertsFilter || ''),
            text(ui.activeProfileUserId || ''),
            text(ui.activeProjectId || ''),
            text(ui.projectTab || ''),
            text(ui.projectName || ''),
            text(ui.projectSummary || ''),
            text(ui.projectDescription || ''),
            text(ui.projectInviteSearch || ''),
            text(ui.projectInviteFaculty || 'all'),
            (Array.isArray(ui.projectInviteSelectedIds) ? ui.projectInviteSelectedIds.map((item) => text(item)).filter(Boolean).join(',') : ''),
            (Array.isArray(ui.projectFacultyCodes) ? ui.projectFacultyCodes.map((item) => text(item)).filter(Boolean).join(',') : ''),
            Boolean(ui.projectComposerOpen),
            text(ui.activePageProfileId || ''),
            text(ui.pageProfileTab || 'all'),
            Boolean(ui.pageProfileEditMode),
            text(ui.pagesSearch || ''),
            text(ui.pagePostType || 'official'),
            text(ui.pagesTab || 'discover'),
            text(ui.pageWizardStep || ''),
            ui.callOpen ? 'call-open' : 'call-closed',
            text(dialog?.type || ''),
            text(dialog?.postId || dialog?.eventId || dialog?.groupId || dialog?.chatId || dialog?.taskId || dialog?.columnId || ''),
            isPortalStoryViewerOpen() ? 'story-viewer-open' : 'story-viewer-closed',
            isPortalStoryComposerOpen() ? 'story-composer-open' : 'story-composer-closed',
            Boolean(ui.projectTaskMyOnly),
            text(ui.projectTaskSearch || ''),
            text(ui.projectTaskFilterPriority || ''),
            text(ui.projectTaskFilterAssignee || ''),
            Boolean(ui.projectTaskFilterOverdue),
            text(ui.projectTaskViewMode || 'desk'),
            text(ui.projectTaskFocus || 'all'),
            text(ui.projectTaskTimeWindow || 'all'),
            text(ui.projectTaskDeskActiveViewId || ''),
            text(ui.projectTaskDeskLink?.taskId || ''),
            text(ui.projectTaskDeskLink?.role || ''),
            text(ui.projectTaskDeskExpandedTaskId || ''),
            (Array.isArray(ui.projectTaskDeskHygieneHidden) ? ui.projectTaskDeskHygieneHidden.join(',') : ''),
            (Array.isArray(ui.projectTaskDeskCollapsedPackages) ? ui.projectTaskDeskCollapsedPackages.map((id) => text(id)).filter(Boolean).join(',') : ''),
            (Array.isArray(ui.projectTaskDeskCollapsedTreeIds) ? ui.projectTaskDeskCollapsedTreeIds.map((id) => text(id)).filter(Boolean).join(',') : ''),
            text(ui.projectTaskGraphMode || 'explore'),
            Boolean(ui.projectTaskGraphShowInferred),
            Boolean(ui.projectTaskGraphShowFlow),
            text(ui.projectTaskGraphLayout || 'force'),
            text(ui.projectHubScope || 'mine'),
            text(ui.projectHubStatus || 'all'),
            text(ui.projectHubViewMode || 'grid'),
            text(ui.lostFoundEditId || ''),
            text(ui.lostFoundSearch || ''),
            text(ui.lostFoundExpiresAt || ''),
            text(ui.surveysTab || 'available'),
            text(ui.surveysSubTab || 'student'),
            text(ui.surveysSearch || ''),
            text(ui.surveyTakingId || ''),
            text(ui.surveyResultsId || ''),
            text(ui.profileTab || ''),
            Boolean(ui.editProfileMode),
            text(ui.photographyTab || 'explore'),
            text(ui.photographySearch || ''),
            text(ui.photographyProfileUserId || ''),
            Boolean(ui.photographyMyProfile),
            text(ui.projectDiscoverSearch || ''),
            text(ui.projectDiscoverFaculty || ''),
            text(ui.projectDiscoverRole || ''),
            text(ui.projectDiscoverTag || ''),
            text(ui.projectRiskGroupId || ''),
            text(ui.projectRiskTaskId || ''),
            text(ui.projectRiskEditId || ''),
            Boolean(ui.projectRiskComposeOpen),
            (Array.isArray(ui.projectRiskExpandedGroupIds) ? ui.projectRiskExpandedGroupIds.map((id) => text(id)).filter(Boolean).join(',') : ''),
            Boolean(ui.workspaceNavCollapsed),
            text(ui.portfolioPanelTab || ''),
            Boolean(ui.portfolioCustomBuilderOpen),
            text(ui.customBuilderStep || ''),
            text(ui.customBuilderTemplate || ''),
            text(ui.customBuilderName || ''),
            JSON.stringify(Array.isArray(ui.customBuilderFields) ? ui.customBuilderFields : []),
            text(ui.portfolioSaveStatus || ''),
            text(ui.publishVisibility || ''),
            Boolean(ui.publishConsent),
            JSON.stringify(ui.openPortfolioSections || {}),
            text(ui.myPortfolio?.status || ''),
            buildFeedFingerprint(runtime),
            buildRelationshipsFingerprint(runtime),
            buildLostFoundFingerprint(runtime),
            buildSurveysFingerprint(runtime),
            buildEventsFingerprint(runtime),
            buildGroupsFingerprint(runtime),
            buildNotificationsFingerprint(runtime),
            buildChatsFingerprint(runtime),
            buildProjectsFingerprint(runtime),
            buildPortfolioFingerprint(runtime),
            buildPhotographyUiFingerprint(runtime),
            buildPagesFingerprint(runtime),
            buildDirectoryFingerprint(runtime),
            buildReportsFingerprint(runtime),
            text(runtime?.flash?.message || ''),
            text(runtime?.flash?.tone || '')
        ].join('|');
    }

    const SOCIAL_FORCE_RENDER_REASON_RE = /^(feed-tab|feed-scope|feed-error|hydrate|hydrate-accounts|hydrate-error|social-bootstrap|post-created|post-updated|post-deleted|post-shared|dialog-|post-submit|connection-|community-tab|pages-tab|pages-search|page-open-profile|page-about-more|page-members-open|page-members-filter|page-members-search|page-post-compose-open|post-compose-open|post-compose-attach-filter|post-compose-attach-pick-add|post-compose-entity-remove|post-compose-attach-search|post-compose-file|page-post-file|page-profile-post|page-profile-back|page-profile-tab|page-profile-edit-|page-post-type|page-create-open|page-wizard-next|page-wizard-prev|page-follow|groups-tab|group-create-open|group-leave-wizard-next|group-leave-wizard-prev|group-member-add|group-member-remove|group-member-search|group-member-faculty|group-membership|group-request|group-member-removed|group-updated|group-left|project-create-open|portfolio-create-open|project-creator-member-add|project-creator-member-remove|project-member-search|project-invite-faculty|project-faculty-toggle|project-left|project-chat-ready|project-open-chat|project-column-tasks-|project-task-detail-|project-task-created|project-task-updated|project-task-priority-|project-task-budget|project-task-filter|project-task-search|project-task-toggle-my|project-budget-settings-saved|project-budget-category-|project-budget-expense-|directory|directory-search|directory-role|events-tab|event-create-open|event-edit-open|event-created|event-updated|event-deleted|event-rsvp|event-rsvp-optimistic|event-rsvp-rollback|lost-found-create-open|lost-found-delete|lost-found-mark-found|lost-found-save|lost-found-created|lost-found-updated|lost-found-deleted|lost-found-marked-found|lost-found-expired|panel-lost-and-found|panel-feed|panel-community|panel-events|panel-pages|panel-groups|panel-workspace|panel-projects|panel-profile|profile-view|surveys-tab|surveys-lane|surveys-input|survey-create-open|survey-create-input|survey-created|survey-take-open|survey-take-close|survey-results-open|survey-results-close|survey-response-submitted|survey-deleted|survey-closed|survey-close|survey-export|survey-question-|panel-surveys|photography-|panel-photography|message-|chat|chat-read|chat-upsert|message-sent|message-delete|message-file|chat-hide|group-thread-search-|group-thread-panel-close|thread-jump-latest|group-panel-file-filter|notification-read|notifications-refresh|panel-messages|panel-alerts|portfolio-panel-tab|mobile-nav|workspace-nav-open|workspace-nav-close|workspace-nav-collapse|workspace-nav-expand|project-task-desk-expand|project-task-desk-tree-toggle|project-task-desk-hygiene-dismiss|project-task-time-window|project-task-desk-view-save|project-task-desk-view-delete|project-task-desk-view-load|project-task-desk-view-clear|project-task-desk-link-start|project-task-desk-link-cancel|project-task-desk-link-pick|project-task-desk-dep-add-parent|project-task-desk-dep-add-child|project-task-desk-dep-remove|task-graph-group-member|escape-workspace-nav|alerts-mark|report-resolve)/;

    function isSocialForceRenderReason(reason) {
        return SOCIAL_FORCE_RENDER_REASON_RE.test(text(reason));
    }

    const api = {
        isSocialForceRenderReason,
        buildSocialRenderSignature,
        collectCommentReactionFingerprint,
        summarizeCommentReactions,
        buildFeedFingerprint,
        buildRelationshipsFingerprint,
        buildLostFoundFingerprint,
        buildSurveysFingerprint,
        buildEventsFingerprint,
        buildGroupsFingerprint,
        buildDirectoryFingerprint,
        buildReportsFingerprint,
        buildNotificationsFingerprint,
        buildChatsFingerprint,
        buildProjectsFingerprint,
        buildPortfolioFingerprint,
        buildPhotographyUiFingerprint,
        buildPagesFingerprint
    };

    window.KiuSocialFingerprintModel = api;
    Object.keys(api).forEach((key) => {
        window[key] = api[key];
    });
})();
