/* Social render-plan coordinator — always loaded with social-page (not lazy). */
(function initSocialRenderPlan() {
    if (window.__KIU_SOCIAL_RENDER_PLAN_LOADED) return;
    window.__KIU_SOCIAL_RENDER_PLAN_LOADED = true;

    function resolveSocialRenderPlan(reason, activePanel, runtime) {
        const hooks = window.__kiuSocialRenderPlanHooks || {};
        const text = typeof hooks.text === 'function' ? hooks.text : (value) => String(value == null ? '' : value).trim();
        const activeDialog = typeof hooks.activeDialog === 'function' ? hooks.activeDialog : () => null;
        const WORKSPACE_DIALOG_KEEP_CENTER = hooks.WORKSPACE_DIALOG_KEEP_CENTER instanceof Set
            ? hooks.WORKSPACE_DIALOG_KEEP_CENTER
            : new Set();

        const fullPlan = {
            flash: true,
            topbar: true,
            command: true,
            center: true,
            workspaceNav: true,
            drawer: true,
            mobileTab: true,
            toast: true,
            dialog: true,
            storyViewer: true,
            storyComposer: true
        };
        const drawerOpen = Boolean(runtime?.ui?.shellDrawerOpen);
        const isMobileViewport = window.innerWidth <= 768;

        if (
            reason === 'workspace-nav-open'
            || reason === 'workspace-nav-close'
            || reason === 'escape-workspace-nav'
            || reason === 'workspace-nav-collapse'
            || reason === 'workspace-nav-expand'
        ) {
            return {
                flash: false,
                topbar: false,
                command: false,
                center: false,
                workspaceNav: true,
                drawer: false,
                mobileTab: false,
                toast: false,
                dialog: false,
                storyViewer: false,
                storyComposer: false
            };
        }

        if (!reason || reason === 'boot' || /-module$/.test(reason)) {
            const plan = { ...fullPlan };
            if (!isMobileViewport) plan.mobileTab = false;
            if (!drawerOpen && reason !== 'shell-drawer-open') plan.drawer = false;
            return plan;
        }

        if (reason === 'panel' || reason === 'chat' || reason === 'mobile-nav') {
            const plan = {
                ...fullPlan,
                flash: false,
                toast: false,
                dialog: false,
                storyViewer: false,
                storyComposer: false
            };
            if (!isMobileViewport) plan.mobileTab = false;
            if (!drawerOpen) plan.drawer = false;
            return plan;
        }

        if (reason === 'dialog-close' || /^dialog-/.test(reason)) {
            const plan = {
                flash: false,
                topbar: false,
                command: false,
                center: false,
                workspaceNav: false,
                drawer: false,
                mobileTab: false,
                toast: false,
                dialog: true,
                storyViewer: false,
                storyComposer: false
            };
            if (reason !== 'dialog-close' && activeDialog() && ['projects', 'groups', 'pages', 'events', 'lost-and-found', 'workspace', 'photography'].includes(activePanel)) {
                if (!WORKSPACE_DIALOG_KEEP_CENTER.has(text(activeDialog()?.type || ''))) {
                    plan.center = true;
                }
            }
            if (reason !== 'dialog-close' && activeDialog() && activePanel === 'surveys') {
                plan.center = true;
            }
            if (reason === 'dialog-close' && ['projects', 'workspace', 'photography'].includes(activePanel)) {
                plan.center = true;
            }
            return plan;
        }

        if (reason === 'flash' || reason === 'flash-clear' || reason === 'page-report') {
            return {
                flash: true,
                topbar: false,
                command: false,
                center: false,
                workspaceNav: false,
                drawer: false,
                mobileTab: false,
                toast: false,
                dialog: false,
                storyViewer: false,
                storyComposer: false
            };
        }

        const relationshipMutationReasons = new Set([
            'connection-send',
            'connection-cancel',
            'connection-accept',
            'connection-decline',
            'connection-remove'
        ]);
        if (relationshipMutationReasons.has(reason)) {
            const plan = {
                ...fullPlan,
                flash: true,
                topbar: false,
                command: false,
                drawer: false,
                mobileTab: false,
                toast: false,
                dialog: false,
                storyViewer: false,
                storyComposer: false
            };

            if (!isMobileViewport) plan.mobileTab = false;
            if (!drawerOpen) plan.drawer = false;
            return plan;
        }

        const eventMutationReasons = new Set([
            'event-created',
            'event-deleted',
            'event-rsvp',
            'event-rsvp-optimistic',
            'event-rsvp-rollback'
        ]);
        if (eventMutationReasons.has(reason)) {
            const plan = {
                ...fullPlan,
                flash: true,
                topbar: false,
                command: false,
                drawer: false,
                mobileTab: false,
                toast: false,
                dialog: false,
                storyViewer: false,
                storyComposer: false
            };

            if (!isMobileViewport) plan.mobileTab = false;
            if (!drawerOpen) plan.drawer = false;
            return plan;
        }

        const groupMutationReasons = new Set([
            'group-membership',
            'group-request',
            'group-member-removed',
            'group-updated',
            'group-left',
            'group-created',
            'group-invite-sent'
        ]);
        if (groupMutationReasons.has(reason)) {
            const plan = {
                ...fullPlan,
                flash: true,
                topbar: false,
                command: false,
                drawer: false,
                mobileTab: false,
                toast: false,
                dialog: text(activeDialog()?.type || '') === 'group-detail',
                storyViewer: false,
                storyComposer: false
            };

            if (!isMobileViewport) plan.mobileTab = false;
            if (!drawerOpen) plan.drawer = false;
            return plan;
        }

        const surveyMutationReasons = new Set([
            'survey-closed',
            'survey-deleted',
            'survey-response-submitted',
            'survey-created'
        ]);
        if (surveyMutationReasons.has(reason)) {
            const plan = {
                ...fullPlan,
                flash: true,
                topbar: false,
                command: false,
                drawer: false,
                mobileTab: false,
                toast: false,
                dialog: false,
                storyViewer: false,
                storyComposer: false
            };

            if (!isMobileViewport) plan.mobileTab = false;
            if (!drawerOpen) plan.drawer = false;
            return plan;
        }

        // Comment reactions are pure surgical DOM (dialog chips). Never rebuild center —
        // that remounts photography feed cards / images behind the comments modal.
        if (reason === 'comment-react') {
            return {
                flash: false,
                topbar: false,
                command: false,
                center: false,
                workspaceNav: false,
                drawer: false,
                mobileTab: false,
                toast: false,
                dialog: false,
                storyViewer: false,
                storyComposer: false
            };
        }

        // Comment replies inside the open comments modal are applied via
        // surgical DOM patches (see the comment-* handlers) so the dialog never
        // re-renders — this keeps the feed-behind in sync without any flicker.
        const centerOnlyReasons = new Set([
            'post-save',
            'post-react',
            'post-pin',
            'post-file',
            'feed',
            'feed-error',
            'comment-reply',
            'comment-reply-cancel',
            'comment-report',
            'comment-created',
            'profile-tab',
            'profile-edit',
            'profile-cancel',
            'pages-search',
            'events-tab',
            'group-member-search',
            'portfolio-filter-tag',
            'portfolio-compose-open',
            'portfolio-compose-close',
            'portfolio-compose-reset',
            'portfolio-edit',
            'portfolio-edit-cancel',
            'projects-back',
            'project-tab',
            'project-faculty-toggle',
            'project-selected-add',
            'project-selected-remove',
            'page-profile-tab',
            'page-profile-edit-toggle',
            'page-profile-edit-cancel',
            'lost-found-input',
            'lost-found-delete',
            'lost-found-mark-found',
            'lost-found-save',
            'lost-found-created',
            'lost-found-updated',
            'lost-found-deleted',
            'lost-found-marked-found',
            'lost-found-expired',
            'panel-lost-and-found',
            'surveys-tab',
            'surveys-lane',
            'surveys-input',
            'survey-create-input',
            'survey-create-open',
            'survey-created',
            'survey-take-open',
            'survey-take-close',
            'survey-results-open',
            'survey-results-close',
            'survey-response-submitted',
            'survey-deleted',
            'survey-closed',
            'survey-question-add',
            'survey-question-prev',
            'survey-question-next',
            'panel-surveys',
            'photography-tab',
            'photography-search-input',
            'photography-profile-back',
            'photography-view-profile',
            'group-member-faculty',
            'project-invite-faculty',
            'portfolio-discover-faculty',
            'portfolio-discover-role',
            'portfolio-discover-search',
            'portfolio-panel-tab',
            'project-task-create-open',
            'project-task-toggle-my',
            'project-task-quick-add',
            'project-task-search',
            'project-task-filter',
            'project-task-created',
            'project-task-updated',
            'project-settings-saved',
            'project-budget-settings-saved',
            'project-created',
            'project-task-checklist-add',
            'project-task-checklist-remove',
            'project-open',
            'messages-filter',
            'alerts-filter',
            'event-rsvp',
            'event-rsvp-optimistic',
            'event-rsvp-rollback',
            'notification-read',
            'notification-mark-read',
            'notification-follow',
            'notification-removed',
            'notifications-refresh',
            'chat-read',
            'chat-upsert',
            'message-sent',
            'panel-messages',
            'panel-alerts',
            'panel-feed',
            'panel-community',
            'panel-events',
            'panel-pages',
            'panel-groups',
            'panel-workspace',
            'panel-projects',
            'panel-profile',
            'profile-view',
            'feed-tab',
            'feed-scope',
            'post-updated',
            'post-deleted',
            'post-shared',
            'event-created',
            'event-deleted',
            'group-membership',
            'group-request',
            'group-member-removed',
            'group-updated',
            'group-left',
            'page-follow',
            'pages-tab',
            'report-resolve',
            'directory-search',
            'directory-role',
            'project-left',
            'message-delete',
            'chat-hide',
            'alerts-mark-category-read',
            'project-task-focus',
            'project-task-view',
            'project-task-time-window',
            'project-task-move',
            'project-task-search',
            'project-task-filter',
            'project-task-filter-overdue',
            'project-task-desk-toggle-package',
            'project-task-desk-expand',
            'project-task-desk-hygiene-dismiss',
            'project-task-desk-link-start',
            'project-task-desk-link-cancel',
            'project-task-desk-link-pick',
            'project-task-desk-dep-add-parent',
            'project-task-desk-dep-add-child',
            'project-task-desk-dep-remove',
            'project-task-desk-view-save',
            'project-task-desk-view-delete',
            'project-task-desk-view-load',
            'project-task-desk-view-clear',
            'project-task-desk',
            'task-graph-group-member',
        ]);
        if (centerOnlyReasons.has(reason)) {
            const plan = {
                ...fullPlan,
                flash: false,
                topbar: false,
                command: false,
                workspaceNav: false,
                drawer: false,
                mobileTab: false,
                toast: false,
                dialog: false,
                storyViewer: false,
                storyComposer: false
            };

            if (!isMobileViewport) plan.mobileTab = false;
            if (!drawerOpen && reason !== 'shell-drawer-open' && reason !== 'shell-drawer-close') plan.drawer = false;
            return plan;
        }

        // Toast add/dismiss must only touch the toast region — never re-render an
        // open dialog (that caused the comments modal to flicker on reply submit).
        // Runtime emits toast-added | toast-dismiss | toast-removed | toasts-cleared
        // (also accept toast-dismissed / toast-clear aliases).
        if (
            reason === 'toast-added'
            || reason === 'toast-dismiss'
            || reason === 'toast-dismissed'
            || reason === 'toast-removed'
            || reason === 'toast-clear'
            || reason === 'toasts-cleared'
        ) {
            return {
                flash: false,
                topbar: false,
                command: false,
                center: false,
                workspaceNav: false,
                drawer: false,
                mobileTab: false,
                toast: true,
                dialog: false,
                storyViewer: false,
                storyComposer: false
            };
        }

        const groupCreateDialogReasons = new Set([
            'group-member-add',
            'group-member-remove',
            'group-member-search',
            'group-member-faculty'
        ]);
        if (groupCreateDialogReasons.has(reason) && text(activeDialog()?.type || '') === 'group-create') {
            return {
                flash: false,
                topbar: false,
                command: false,
                center: false,
                drawer: false,
                mobileTab: false,
                toast: false,
                dialog: true,
                storyViewer: false,
                storyComposer: false
            };
        }

        const projectRiskDialogReasons = new Set([
            'project-risk-select-group',
            'project-risk-select-task',
            'project-risk-toggle-group',
            'project-risk-task-compose',
            'project-risk-edit',
            'project-risk-cancel-edit',
            'project-risk-compose-open',
            'project-risk-compose-cancel'
        ]);
        if (projectRiskDialogReasons.has(reason) && text(activeDialog()?.type || '') === 'project-risk') {
            return {
                flash: false,
                topbar: false,
                command: false,
                center: false,
                drawer: false,
                mobileTab: false,
                toast: false,
                dialog: true,
                storyViewer: false,
                storyComposer: false
            };
        }

        const projectCreateDialogReasons = new Set([
            'project-creator-member-add',
            'project-creator-member-remove',
            'project-member-search',
            'project-invite-faculty',
            'project-faculty-toggle'
        ]);
        if (projectCreateDialogReasons.has(reason) && text(activeDialog()?.type || '') === 'project-create') {
            return {
                flash: false,
                topbar: false,
                command: false,
                center: false,
                drawer: false,
                mobileTab: false,
                toast: false,
                dialog: true,
                storyViewer: false,
                storyComposer: false
            };
        }

        const projectTaskDialogReasons = new Set([
            'project-task-checklist-add',
            'project-task-checklist-remove'
        ]);
        const projectTaskDialogType = text(activeDialog()?.type || '');
        if (projectTaskDialogReasons.has(reason) && (projectTaskDialogType === 'project-task-create' || projectTaskDialogType === 'project-task-edit' || projectTaskDialogType === 'project-task-detail')) {
            return {
                flash: false,
                topbar: false,
                command: false,
                center: false,
                drawer: false,
                mobileTab: false,
                toast: false,
                dialog: true,
                storyViewer: false,
                storyComposer: false
            };
        }

        const portfolioEditorDialogReasons = new Set([
            'portfolio-save',
            'portfolio-published',
            'portfolio-unpublished',
            'portfolio-custom-open',
            'portfolio-custom-close',
            'portfolio-custom-template',
            'portfolio-custom-next',
            'portfolio-custom-back',
            'portfolio-custom-field-add',
            'portfolio-custom-field-remove',
            'portfolio-custom-save',
            'portfolio-entry-add',
            'portfolio-entry-remove',
            'portfolio-section-toggle',
            'portfolio-publish-visibility'
        ]);
        if (portfolioEditorDialogReasons.has(reason) && text(activeDialog()?.type || '') === 'portfolio-editor') {
            return {
                flash: false,
                topbar: false,
                command: false,
                center: false,
                drawer: false,
                mobileTab: false,
                toast: false,
                dialog: true,
                storyViewer: false,
                storyComposer: false
            };
        }

        const portfolioCreateDialogReasons = new Set([
            'project-faculty-toggle',
            'portfolio-create-input'
        ]);
        if (portfolioCreateDialogReasons.has(reason) && text(activeDialog()?.type || '') === 'portfolio-create') {
            return {
                flash: false,
                topbar: false,
                command: false,
                center: false,
                drawer: false,
                mobileTab: false,
                toast: false,
                dialog: true,
                storyViewer: false,
                storyComposer: false
            };
        }

        const pageMembersDialogReasons = new Set([
            'page-members-search',
            'page-members-filter'
        ]);
        if (pageMembersDialogReasons.has(reason) && text(activeDialog()?.type || '') === 'page-members') {
            return {
                flash: false,
                topbar: false,
                command: false,
                center: false,
                drawer: false,
                mobileTab: false,
                toast: false,
                dialog: true,
                storyViewer: false,
                storyComposer: false
            };
        }

        const pagePostComposeDialogReasons = new Set([
            'page-post-type',
            'page-post-file'
        ]);
        if (pagePostComposeDialogReasons.has(reason) && text(activeDialog()?.type || '') === 'page-post-compose') {
            return {
                flash: false,
                topbar: false,
                command: false,
                center: false,
                drawer: false,
                mobileTab: false,
                toast: false,
                dialog: true,
                storyViewer: false,
                storyComposer: false
            };
        }

        const postComposeDialogReasons = new Set([
            'post-compose-file',
            'post-compose-entity-remove'
        ]);
        if (postComposeDialogReasons.has(reason) && text(activeDialog()?.type || '') === 'post-compose') {
            return {
                flash: false,
                topbar: false,
                command: false,
                center: false,
                drawer: false,
                mobileTab: false,
                toast: false,
                dialog: true,
                storyViewer: false,
                storyComposer: false
            };
        }

        const postComposeAttachDialogReasons = new Set([
            'post-compose-attach-filter',
            'post-compose-attach-pick-add',
            'post-compose-entity-remove',
            'post-compose-attach-search'
        ]);
        if (postComposeAttachDialogReasons.has(reason) && text(activeDialog()?.type || '') === 'post-compose-attach') {
            return {
                flash: false,
                topbar: false,
                command: false,
                center: false,
                drawer: false,
                mobileTab: false,
                toast: false,
                dialog: true,
                storyViewer: false,
                storyComposer: false
            };
        }

        const pageCreateDialogReasons = new Set([
            'page-wizard-next',
            'page-wizard-prev'
        ]);
        if (pageCreateDialogReasons.has(reason) && text(activeDialog()?.type || '') === 'page-create') {
            return {
                flash: false,
                topbar: false,
                command: false,
                center: false,
                drawer: false,
                mobileTab: false,
                toast: false,
                dialog: true,
                storyViewer: false,
                storyComposer: false
            };
        }

        const photographyUploadDialogReasons = new Set([
            'photography-upload-next',
            'photography-upload-back',
            'photography-upload-file',
            'photography-upload-drop'
        ]);
        if (photographyUploadDialogReasons.has(reason) && text(activeDialog()?.type || '') === 'photography-upload') {
            return {
                flash: false,
                topbar: false,
                command: false,
                center: false,
                drawer: false,
                mobileTab: false,
                toast: false,
                dialog: true,
                storyViewer: false,
                storyComposer: false
            };
        }

        const eventCreateDialogReasons = new Set([
            'event-create-input',
            'event-online-toggle',
            'event-image'
        ]);
        if (eventCreateDialogReasons.has(reason) && text(activeDialog()?.type || '') === 'event-create') {
            return {
                flash: false,
                topbar: false,
                command: false,
                center: false,
                drawer: false,
                mobileTab: false,
                toast: false,
                dialog: true,
                storyViewer: false,
                storyComposer: false
            };
        }

        const lostFoundCreateDialogReasons = new Set([
            'lost-found-input'
        ]);
        if (lostFoundCreateDialogReasons.has(reason) && text(activeDialog()?.type || '') === 'lost-found-create') {
            return {
                flash: false,
                topbar: false,
                command: false,
                center: false,
                drawer: false,
                mobileTab: false,
                toast: false,
                dialog: true,
                storyViewer: false,
                storyComposer: false
            };
        }

        if (false) {
            return {
                flash: false,
                topbar: false,
                command: false,
                center: false,
                drawer: false,
                mobileTab: false,
                toast: false,
                dialog: true,
                storyViewer: false,
                storyComposer: false
            };
        }

        const centerAndRailReasons = new Set([
            'chat',
            'chat-hide',
            'message-file',
            'message-sent',
            'group-thread-panel-toggle',
            'group-thread-panel-close',
            'group-thread-search-open',
            'group-thread-search-submit',
            'group-thread-search-input',
            'group-thread-search-next',
            'group-thread-search-prev',
            'group-thread-search-clear',
            'group-thread-invite-faculty',
            'group-thread-invite-search',
            'group-thread-notify',
            'group-panel-file-filter',
            'thread-jump-latest'
        ]);
        if (centerAndRailReasons.has(reason) && (activePanel === 'messages' || (activePanel === 'workspace' && text(runtime?.ui?.projectTab || '') === 'chat'))) {
            const plan = {
                ...fullPlan,
                flash: false,
                topbar: false,
                command: false,
                drawer: false,
                mobileTab: false,
                toast: false,
                dialog: false,
                storyViewer: false,
                storyComposer: false
            };

            if (!isMobileViewport) plan.mobileTab = false;
            return plan;
        }

        const centerAndCommandReasons = new Set([
            'feed-refresh',
            'post-submit'
        ]);
        if (centerAndCommandReasons.has(reason) && activePanel === 'feed') {
            const plan = {
                ...fullPlan,
                flash: false,
                topbar: false,
                drawer: false,
                mobileTab: false,
                toast: false,
                dialog: false,
                storyViewer: false,
                storyComposer: false
            };
            if (isMobileViewport) {
                plan.mobileTab = true;
            }
            return plan;
        }

        const plan = { ...fullPlan };
        if (!isMobileViewport) plan.mobileTab = false;
        if (!drawerOpen && reason !== 'shell-drawer-open' && reason !== 'shell-drawer-close') plan.drawer = false;
        return plan;
    
    }

    window.__kiuResolveSocialRenderPlan = resolveSocialRenderPlan;
    window.resolveSocialRenderPlan = resolveSocialRenderPlan;
})();
