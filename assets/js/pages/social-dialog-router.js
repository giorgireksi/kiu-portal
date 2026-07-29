/* Social dialog kind → deferred-module render router.
 * Eager: social.html before social-page.js.
 * Page installs deps via createKiuSocialDialogRenderer(deps).
 */
(function initSocialDialogRouter() {
    'use strict';
    if (window.__KIU_SOCIAL_DIALOG_ROUTER_LOADED) return;
    window.__KIU_SOCIAL_DIALOG_ROUTER_LOADED = true;

    const GROUP_FALLBACK = [
        'group-create', 'group-detail', 'group-invite', 'group-leave',
        'group-panel-media', 'group-panel-members', 'group-panel-files',
        'group-panel-links', 'group-panel-invite', 'group-panel-settings'
    ];
    const PAGES_FALLBACK = ['page-about', 'page-members', 'page-create', 'page-post-compose'];
    const FEED_FALLBACK = [
        'post-compose', 'post-compose-attach', 'post-edit', 'post-share', 'post-report',
        'post-delete', 'post-comments', 'comment-report', 'comment-delete'
    ];
    const EVENTS_FALLBACK = ['event-create', 'event-delete'];
    const MESSAGES_FALLBACK = ['message-delete', 'chat-hide'];
    const PROFILE_FALLBACK = ['profile-cover'];
    const WORKSPACE_FALLBACK = [
        'project-create', 'project-task-create', 'project-task-edit', 'project-task-graph',
        'project-task-graph-history', 'project-task-graph-schedule-help', 'project-column-tasks',
        'project-task-detail', 'project-task-delete', 'project-settings', 'project-health',
        'project-health-plan-pick', 'project-risk', 'portfolio-create', 'portfolio-editor', 'project-leave'
    ];

    function kindOwned(setName, fallback, kind) {
        const set = window[setName];
        if (typeof set !== 'undefined' && set && typeof set.has === 'function') return set.has(kind);
        return fallback.includes(kind);
    }

    function createKiuSocialDialogRenderer(deps) {
        if (!deps || typeof deps !== 'object') throw new Error('dialog renderer deps required');
        const text = typeof deps.text === 'function' ? deps.text : (v) => String(v == null ? '' : v).trim();
        const state = deps.state;
        const activeDialog = deps.activeDialog;
        const queueDeferredModuleRender = deps.queueDeferredModuleRender || (() => {});
        const lostFoundItems = deps.lostFoundItems || (() => []);
        const normalizeLostFoundItem = deps.normalizeLostFoundItem || ((item) => item);
        const surveyById = deps.surveyById || (() => null);
        const renderEntityDetailDialog = deps.renderEntityDetailDialog || (() => '');
        const workspaceStub = deps.renderWorkspaceOwnedDialogStub;

        function renderDialog() {
            const dialog = activeDialog();
            if (!dialog) return '';
            const runtime = state();
            const kind = text(dialog.type);

            if (kind === 'photography-upload') {
                if (deps.hasSocialPhotographyModule()
                    && typeof window.renderPhotographyUploadDialog === 'function') {
                    return window.renderPhotographyUploadDialog(dialog);
                }
                deps.ensureSocialPhotographyModule()
                    .then(() => queueDeferredModuleRender('photography-module'))
                    .catch(() => null);
                return '';
            }
            if (kind === 'photography-comments' && deps.hasSocialPhotographyModule()
                && typeof window.renderPhotographyCommentsDialog === 'function') {
                return window.renderPhotographyCommentsDialog(dialog);
            }
            if (kind === 'photography-delete' && deps.hasSocialPhotographyModule()
                && typeof window.renderPhotographyDeleteDialog === 'function') {
                return window.renderPhotographyDeleteDialog(dialog);
            }

            if (kindOwned('GROUP_OWNED_DIALOG_KINDS', GROUP_FALLBACK, kind)) {
                if (deps.hasSocialGroupsModule() && typeof window.renderGroupOwnedDialog === 'function') {
                    return window.renderGroupOwnedDialog(runtime, dialog);
                }
                deps.ensureSocialGroupsModule().then(() => queueDeferredModuleRender('groups-module')).catch(() => null);
                return '';
            }

            if (kindOwned('PAGES_OWNED_DIALOG_KINDS', PAGES_FALLBACK, kind)) {
                if (deps.hasSocialPagesModule() && typeof window.renderPagesOwnedDialog === 'function') {
                    return window.renderPagesOwnedDialog(runtime, dialog);
                }
                deps.ensureSocialPagesModule().then(() => queueDeferredModuleRender('pages-module')).catch(() => null);
                return '';
            }

            if (kindOwned('FEED_OWNED_DIALOG_KINDS', FEED_FALLBACK, kind)) {
                if (deps.hasSocialFeedModule() && typeof window.renderFeedOwnedDialog === 'function') {
                    return window.renderFeedOwnedDialog(runtime, dialog);
                }
                deps.ensureSocialFeedModule().then(() => queueDeferredModuleRender('feed-module')).catch(() => null);
                return '';
            }

            if (kindOwned('EVENTS_OWNED_DIALOG_KINDS', EVENTS_FALLBACK, kind)) {
                if (deps.hasSocialEventsModule() && typeof window.renderEventsOwnedDialog === 'function') {
                    return window.renderEventsOwnedDialog(runtime, dialog);
                }
                deps.ensureSocialEventsModule().catch(() => null);
                return '';
            }

            if (kindOwned('MESSAGES_OWNED_DIALOG_KINDS', MESSAGES_FALLBACK, kind)) {
                if (deps.hasSocialMessagesModule() && typeof window.renderMessagesOwnedDialog === 'function') {
                    return window.renderMessagesOwnedDialog(runtime, dialog);
                }
                deps.ensureSocialMessagesModule().catch(() => null);
                return '';
            }

            if (kindOwned('PROFILE_OWNED_DIALOG_KINDS', PROFILE_FALLBACK, kind)) {
                if (deps.hasSocialProfileModule() && typeof window.renderProfileOwnedDialog === 'function') {
                    return window.renderProfileOwnedDialog(runtime, dialog);
                }
                deps.ensureSocialProfileModule().catch(() => null);
                return '';
            }

            if (kind === 'lost-found-create') {
                if (deps.hasSocialLostFoundModule() && typeof window.renderLostFoundCreateDialog === 'function') {
                    return window.renderLostFoundCreateDialog(state());
                }
                deps.ensureSocialLostFoundModule().catch(() => null);
                return '';
            }
            if (kind === 'lost-found-delete' || kind === 'lost-found-mark-found') {
                if (deps.hasSocialLostFoundModule() && typeof window.renderLostFoundActionConfirmDialog === 'function') {
                    const item = lostFoundItems().map((entry) => normalizeLostFoundItem(entry))
                        .find((entry) => text(entry.id) === text(dialog.itemId));
                    if (!item) return '';
                    return window.renderLostFoundActionConfirmDialog(kind, item);
                }
                deps.ensureSocialLostFoundModule().catch(() => null);
                return '';
            }
            if (kind === 'survey-create') {
                if (deps.hasSocialSurveysModule() && typeof window.renderSurveyCreateDialog === 'function') {
                    return window.renderSurveyCreateDialog(state());
                }
                deps.ensureSocialSurveysModule().catch(() => null);
                return '';
            }
            if (kind === 'research-create') {
                if (deps.hasSocialResearchModule() && typeof window.renderResearchCreateDialog === 'function') {
                    return window.renderResearchCreateDialog(state());
                }
                deps.ensureSocialResearchModule()
                    .then(() => queueDeferredModuleRender('research-module'))
                    .catch(() => null);
                return '';
            }
            if (kind === 'survey-results') {
                if (deps.hasSocialSurveysModule() && typeof window.renderSurveyResultsDialog === 'function') {
                    const survey = surveyById(dialog.surveyId);
                    if (!survey) return '';
                    return window.renderSurveyResultsDialog(survey, dialog.results || null);
                }
                deps.ensureSocialSurveysModule().catch(() => null);
                return '';
            }
            if (kind === 'survey-draft-question-delete' || kind === 'survey-draft-choice-delete') {
                if (deps.hasSocialSurveysModule() && typeof window.renderSurveyDraftDeleteConfirmDialog === 'function') {
                    return window.renderSurveyDraftDeleteConfirmDialog(kind, dialog);
                }
                deps.ensureSocialSurveysModule().catch(() => null);
                return '';
            }

            if (kind === 'entity-detail') {
                return renderEntityDetailDialog(runtime, dialog);
            }
            if (kindOwned('WORKSPACE_OWNED_DIALOG_KINDS', WORKSPACE_FALLBACK, kind)) {
                const renderOwned = (window.KiuSocialWorkspace && window.KiuSocialWorkspace.renderWorkspaceOwnedDialog)
                    || window.renderWorkspaceOwnedDialog;
                if (deps.hasSocialWorkspaceModule() && typeof renderOwned === 'function'
                    && renderOwned !== workspaceStub) {
                    return renderOwned(runtime, dialog);
                }
                deps.ensureSocialWorkspaceModule().then(() => queueDeferredModuleRender('workspace-module')).catch(() => null);
                return '';
            }
            return '';
        }

        return renderDialog;
    }

    window.createKiuSocialDialogRenderer = createKiuSocialDialogRenderer;
})();
