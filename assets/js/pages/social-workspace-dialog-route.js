/* Social workspace dialog routing (health/graph stacks + owned dialog kinds).
 * Lazy: loaded by ensureSocialWorkspaceModule before social-workspace.js.
 * Workspace installs via createKiuSocialWorkspaceDialogRouteApi(deps).
 */
(function initSocialWorkspaceDialogRoute() {
    'use strict';
    if (window.__KIU_SOCIAL_WORKSPACE_DIALOG_ROUTE_LOADED) return;
    window.__KIU_SOCIAL_WORKSPACE_DIALOG_ROUTE_LOADED = true;

    function createKiuSocialWorkspaceDialogRouteApi(deps) {
        if (!deps || typeof deps !== 'object') throw new Error('workspace dialog-route deps required');
        const {
            accountById,
            activeDialog,
            currentUserId,
            displayName,
            escape,
            filterProjectBoardTasks,
            neoActions,
            neoHead,
            projectTaskGraphStackedBackdropClass,
            renderPortfolioCreateDialog,
            renderPortfolioEditorDialog,
            renderProjectColumnTasksModal,
            renderProjectCreateDialog,
            renderProjectHealthDialog,
            renderProjectHealthPlanPickDialog,
            renderProjectRiskDialog,
            renderProjectSettingsDialog,
            renderProjectTaskCreateDialog,
            renderProjectTaskDeleteConfirmDialog,
            renderProjectTaskDetailModal,
            renderProjectTaskGraphFullscreen,
            renderProjectTaskGraphHistoryDialog,
            renderProjectTaskGraphScheduleHelpDialog,
            resolveActiveSocialProject,
            shouldRenderProjectTaskGraphStack,
            state,
            text,
            wrapProjectTaskGraphStack
        } = deps;

        const PROJECT_HEALTH_OVERLAY_DIALOGS = new Set([
            'project-task-detail',
            'project-task-edit',
            'project-task-create',
            'project-task-delete',
            'project-settings',
            'project-risk',
            'project-health-plan-pick'
        ]);

        const WORKSPACE_OWNED_DIALOG_KINDS = new Set([
            'project-create',
            'project-task-create',
            'project-task-edit',
            'project-task-graph',
            'project-task-graph-history',
            'project-task-graph-schedule-help',
            'project-column-tasks',
            'project-task-detail',
            'project-task-delete',
            'project-settings',
            'project-health',
            'project-health-plan-pick',
            'project-risk',
            'portfolio-create',
            'portfolio-editor',
            'project-leave'
        ]);

        function shouldRenderProjectHealthStack(runtime, kind = '') {
            return runtime.ui?.previousDialog?.type === 'project-health'
                && PROJECT_HEALTH_OVERLAY_DIALOGS.has(text(kind));
        }

        function wrapProjectHealthStack(healthMarkup, childMarkup) {
            if (!healthMarkup && !childMarkup) return '';
            if (!healthMarkup) return childMarkup || '';
            return `<div class="social-project-health-stack">
                <div class="social-project-health-anchor" data-project-health-anchor="1">${healthMarkup}</div>
                <div class="social-project-health-child-slot" data-project-health-child-slot="1">${childMarkup || ''}</div>
            </div>`;
        }

        function renderHealthStackLayers(runtime, childMarkup) {
            const healthDialog = runtime.ui?.previousDialog;
            if (!healthDialog || text(healthDialog.type) !== 'project-health') return childMarkup || '';
            const healthMarkup = renderProjectHealthDialog(runtime, healthDialog);
            const stacked = wrapProjectHealthStack(healthMarkup, childMarkup);
            const graphParent = healthDialog.__restorePrevious;
            if (graphParent && text(graphParent.type) === 'project-task-graph') {
                return wrapProjectTaskGraphStack(
                    renderProjectTaskGraphFullscreen(runtime, graphParent),
                    stacked
                );
            }
            return stacked;
        }

        function maybeWrapStackedProjectDialog(runtime, kind, childMarkup) {
            if (shouldRenderProjectHealthStack(runtime, kind)) {
                return renderHealthStackLayers(runtime, childMarkup);
            }
            if (shouldRenderProjectTaskGraphStack(runtime, kind)) {
                return wrapProjectTaskGraphStack(
                    renderProjectTaskGraphFullscreen(runtime, runtime.ui.previousDialog),
                    childMarkup
                );
            }
            return childMarkup;
        }

        function renderStackedProjectTaskChild(runtime, kind = '') {
            const dialog = activeDialog();
            const normalizedKind = text(kind || dialog?.type);
            if (!dialog || !normalizedKind) return '';
            if (normalizedKind === 'project-task-create' || normalizedKind === 'project-task-edit') {
                return renderProjectTaskCreateDialog(runtime, dialog);
            }
            if (normalizedKind === 'project-task-detail') {
                const project = resolveActiveSocialProject(runtime, dialog?.projectId);
                const taskId = text(dialog?.taskId || '');
                if (!project || !taskId) return '';
                return renderProjectTaskDetailModal(runtime, project, taskId);
            }
            if (normalizedKind === 'project-task-delete') {
                const project = resolveActiveSocialProject(runtime, dialog?.projectId);
                const taskId = text(dialog?.taskId || '');
                if (!project || !taskId || !project.viewerCanContribute) return '';
                const task = (Array.isArray(project.tasks) ? project.tasks : []).find((entry) => text(entry?.id) === taskId) || null;
                if (!task) return '';
                return renderProjectTaskDeleteConfirmDialog(project, task, {
                    backdropClass: projectTaskGraphStackedBackdropClass(runtime, normalizedKind)
                });
            }
            if (normalizedKind === 'project-health') {
                return renderProjectHealthDialog(runtime, dialog);
            }
            if (normalizedKind === 'project-risk') {
                return renderProjectRiskDialog(runtime, dialog);
            }
            if (normalizedKind === 'project-task-graph-history') {
                return renderProjectTaskGraphHistoryDialog(runtime, dialog);
            }
            if (normalizedKind === 'project-task-graph-schedule-help') {
                return renderProjectTaskGraphScheduleHelpDialog(runtime, dialog);
            }
            return '';
        }

        function renderWorkspaceOwnedDialog(runtime, dialog) {
            if (!dialog) return '';
            const kind = text(dialog.type);
            if (!WORKSPACE_OWNED_DIALOG_KINDS.has(kind)) return '';
            if (kind === 'project-create') {
                return renderProjectCreateDialog(state());
            }
            if (kind === 'project-task-create') {
                return maybeWrapStackedProjectDialog(runtime, kind, renderProjectTaskCreateDialog(runtime, dialog));
            }
            if (kind === 'project-task-edit') {
                return maybeWrapStackedProjectDialog(runtime, kind, renderProjectTaskCreateDialog(runtime, dialog));
            }
            if (kind === 'project-task-graph') {
                return renderProjectTaskGraphFullscreen(runtime, dialog);
            }
            if (kind === 'project-task-graph-history') {
                const child = renderProjectTaskGraphHistoryDialog(runtime, dialog);
                if (shouldRenderProjectTaskGraphStack(runtime, kind)) {
                    return wrapProjectTaskGraphStack(renderProjectTaskGraphFullscreen(runtime, runtime.ui.previousDialog), child);
                }
                return child;
            }
            if (kind === 'project-task-graph-schedule-help') {
                const child = renderProjectTaskGraphScheduleHelpDialog(runtime, dialog);
                if (shouldRenderProjectTaskGraphStack(runtime, kind)) {
                    return wrapProjectTaskGraphStack(renderProjectTaskGraphFullscreen(runtime, runtime.ui.previousDialog), child);
                }
                return child;
            }
            if (kind === 'project-column-tasks') {
                const project = resolveActiveSocialProject(runtime, dialog?.projectId);
                const columnId = text(dialog?.columnId || 'todo') || 'todo';
                if (!project) return '';
                const projectTasks = Array.isArray(project.tasks) ? project.tasks : [];
                const columnTasks = filterProjectBoardTasks(runtime, projectTasks)
                    .filter((task) => text(task?.status || 'todo') === columnId);
                return renderProjectColumnTasksModal(runtime, project, columnId, columnTasks);
            }
            if (kind === 'project-task-detail') {
                const project = resolveActiveSocialProject(runtime, dialog?.projectId);
                const taskId = text(dialog?.taskId || '');
                if (!project || !taskId) return '';
                return maybeWrapStackedProjectDialog(runtime, kind, renderProjectTaskDetailModal(runtime, project, taskId));
            }
            if (kind === 'project-task-delete') {
                const project = resolveActiveSocialProject(runtime, dialog?.projectId);
                const taskId = text(dialog?.taskId || '');
                if (!project || !taskId || !project.viewerCanContribute) return '';
                const task = (Array.isArray(project.tasks) ? project.tasks : []).find((entry) => text(entry?.id) === taskId) || null;
                if (!task) return '';
                const child = renderProjectTaskDeleteConfirmDialog(project, task, {
                    backdropClass: projectTaskGraphStackedBackdropClass(runtime, kind)
                });
                return maybeWrapStackedProjectDialog(runtime, kind, child);
            }
            if (kind === 'project-settings') {
                return maybeWrapStackedProjectDialog(runtime, kind, renderProjectSettingsDialog(runtime, dialog));
            }
            if (kind === 'project-health') {
                const child = renderProjectHealthDialog(runtime, dialog);
                if (shouldRenderProjectTaskGraphStack(runtime, kind)) {
                    return wrapProjectTaskGraphStack(renderProjectTaskGraphFullscreen(runtime, runtime.ui.previousDialog), child);
                }
                return child;
            }
            if (kind === 'project-health-plan-pick') {
                return maybeWrapStackedProjectDialog(runtime, kind, renderProjectHealthPlanPickDialog(runtime, dialog));
            }
            if (kind === 'project-risk') {
                return maybeWrapStackedProjectDialog(runtime, kind, renderProjectRiskDialog(runtime, dialog));
            }
            if (kind === 'portfolio-create') {
                return renderPortfolioCreateDialog(state());
            }
            if (kind === 'portfolio-editor') {
                return renderPortfolioEditorDialog();
            }

            if (kind === 'project-leave') {
                const projectItem = (Array.isArray(state().social?.projects) ? state().social.projects : [])
                    .find((item) => text(item.id) === text(dialog.projectId));
                if (!projectItem) return '';
                const currentId = currentUserId();
                const isOwner = text(projectItem.ownerUserId || '') === currentId;
                const nextOwnerId = text(projectItem.nextOwnerUserId || '');
                const nextOwner = nextOwnerId ? accountById(nextOwnerId) || { id: nextOwnerId } : null;
                return `<div class="lux-glass-dialog-backdrop" data-action="dialog-close">
                    <form class="lux-glass-dialog-card" data-form="dialog-project-leave" data-action="noop">
                        ${neoHead('Leave workspace', 'This removes you from the team but keeps the workspace history, tasks, files, and chat intact.')}
                        <div class="lux-glass-dialog-preview">
                            <strong class="lux-glass-dialog-preview-title">${escape(text(projectItem.name || 'Project workspace'))}</strong>
                            <div class="social-neo-muted social-neo-muted-mt-6">${escape(`${projectItem.memberCount || 0} team members`)}</div>
                        </div>
                        <div class="lux-glass-dialog-preview ${isOwner ? 'lux-glass-dialog-preview-danger' : ''}">
                            ${isOwner
                                ? (nextOwner
                                    ? `You own this workspace. If you leave now, ownership transfers to ${escape(displayName(nextOwner))} and the workspace stays active.`
                                    : 'You own this workspace. If you leave now, the workspace stays active but becomes ownerless until someone joins or is assigned later.')
                                : 'Your membership will be removed, but chat history, tasks, and activity remain untouched.'}
                        </div>
                        <label class="social-neo-item-line lux-glass-dialog-checkbox-line">
                            <input type="checkbox" name="confirmProjectLeave" value="yes">
                            <span class="lux-glass-dialog-checkbox-copy">I understand that I am leaving this workspace.</span>
                        </label>
                        ${neoActions({ cancelLabel: 'Cancel', submitLabel: 'Leave workspace' })}
                        <input type="hidden" name="projectId" value="${escape(text(projectItem.id))}">
                        <input type="hidden" name="projectChatId" value="${escape(text(projectItem.chatId || projectItem.groupChatId || ''))}">
                    </form>
                </div>`;
            }

            return '';
        }

        return {
            shouldRenderProjectHealthStack,
            wrapProjectHealthStack,
            renderHealthStackLayers,
            maybeWrapStackedProjectDialog,
            renderStackedProjectTaskChild,
            renderWorkspaceOwnedDialog,
            PROJECT_HEALTH_OVERLAY_DIALOGS,
            WORKSPACE_OWNED_DIALOG_KINDS
        };
    }

    window.createKiuSocialWorkspaceDialogRouteApi = createKiuSocialWorkspaceDialogRouteApi;
})();
