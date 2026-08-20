/* Social page DOM event handlers + submit/input/change domain routes.
 * Eager: social.html after social-shell-nav.js, before social-page.js.
 * Page installs via createKiuSocialPageEventsApi(deps).
 */
(function initSocialPageEvents() {
    'use strict';
    if (window.__KIU_SOCIAL_PAGE_EVENTS_LOADED) return;
    window.__KIU_SOCIAL_PAGE_EVENTS_LOADED = true;

    function createKiuSocialPageEventsApi(deps) {
        if (!deps || typeof deps !== 'object') throw new Error('page events deps required');
        const text = typeof deps.text === 'function' ? deps.text : (v) => String(v == null ? '' : v).trim();
        const state = deps.state;
        const root = deps.root || (() => null);
        const socialInteractionContains = deps.socialInteractionContains || (() => false);
        const routeSocialDomain = deps.routeSocialDomain || (() => ({ matched: false }));
        const handleShellNavClick = deps.handleShellNavClick || (() => ({ handled: false }));
        const clickDomainRoutes = Array.isArray(deps.clickDomainRoutes) ? deps.clickDomainRoutes : [];
        const syncCommentDraftFromTarget = deps.syncCommentDraftFromTarget || (() => {});
        const rippleSurveySubmitButton = deps.rippleSurveySubmitButton || (() => {});
        const rippleSurveyChoiceLabel = deps.rippleSurveyChoiceLabel || (() => {});
        const closeDialog = deps.closeDialog || (() => {});
        const restorePreviousDialog = deps.restorePreviousDialog || (() => {});
        const shouldRestoreStackedDialog = deps.shouldRestoreStackedDialog || (() => false);
        const closeSocialWorkspaceNavAnimated = deps.closeSocialWorkspaceNavAnimated || (() => {});
        const renderSocialPageNow = deps.renderSocialPageNow || (() => {});
        const applyPhotographyUploadFile = deps.applyPhotographyUploadFile || (() => {});
        const hasSocialWorkspaceModule = deps.hasSocialWorkspaceModule || (() => false);
        const ensureSocialWorkspaceModule = deps.ensureSocialWorkspaceModule || (() => Promise.resolve());
        const hasSocialGroupsModule = deps.hasSocialGroupsModule || (() => false);
        const ensureSocialGroupsModule = deps.ensureSocialGroupsModule || (() => Promise.resolve());
        const hasSocialFeedModule = deps.hasSocialFeedModule || (() => false);
        const ensureSocialFeedModule = deps.ensureSocialFeedModule || (() => Promise.resolve());
        const hasSocialPagesModule = deps.hasSocialPagesModule || (() => false);
        const ensureSocialPagesModule = deps.ensureSocialPagesModule || (() => Promise.resolve());
        const hasSocialEventsModule = deps.hasSocialEventsModule || (() => false);
        const ensureSocialEventsModule = deps.ensureSocialEventsModule || (() => Promise.resolve());
        const hasSocialSurveysModule = deps.hasSocialSurveysModule || (() => false);
        const ensureSocialSurveysModule = deps.ensureSocialSurveysModule || (() => Promise.resolve());
        const hasSocialResearchModule = deps.hasSocialResearchModule || (() => false);
        const ensureSocialResearchModule = deps.ensureSocialResearchModule || (() => Promise.resolve());
        const hasSocialPhotographyModule = deps.hasSocialPhotographyModule || (() => false);
        const ensureSocialPhotographyModule = deps.ensureSocialPhotographyModule || (() => Promise.resolve());
        const hasSocialLostFoundModule = deps.hasSocialLostFoundModule || (() => false);
        const ensureSocialLostFoundModule = deps.ensureSocialLostFoundModule || (() => Promise.resolve());
        const hasSocialMessagesModule = deps.hasSocialMessagesModule || (() => false);
        const ensureSocialMessagesModule = deps.ensureSocialMessagesModule || (() => Promise.resolve());
        const hasSocialProfileModule = deps.hasSocialProfileModule || (() => false);
        const ensureSocialProfileModule = deps.ensureSocialProfileModule || (() => Promise.resolve());
        const hasSocialAlertsModule = deps.hasSocialAlertsModule || (() => false);
        const ensureSocialAlertsModule = deps.ensureSocialAlertsModule || (() => Promise.resolve());
        const hasSocialCommunityModule = deps.hasSocialCommunityModule || (() => false);
        const ensureSocialCommunityModule = deps.ensureSocialCommunityModule || (() => Promise.resolve());
        const revealShell = deps.revealShell || (() => {});
        const flashSocialError = deps.flashSocialError || ((message) => {
            if (typeof setPortalSocialFlash === 'function') {
                setPortalSocialFlash(message, 'danger');
            }
        });

        function isGraphStackChildLayerOpen() {
            const region = document.getElementById('lux-glass-dialog-region');
            const childSlot = region?.querySelector('[data-project-task-graph-child-slot="1"]');
            if (childSlot?.hidden) return false;
            return Boolean(region?.querySelector(
                '.social-project-task-graph-child-slot > .lux-glass-dialog-backdrop, '
                + '.social-project-task-graph-child-slot .social-project-health-child-slot > .lux-glass-dialog-backdrop'
            ));
        }

        function shouldBlockGraphSurfaceClick(event, trigger = null) {
            if (!isGraphStackChildLayerOpen()) return false;
            const surface = (trigger || event.target)?.closest?.(
                '[data-project-task-graph-stage], .social-project-task-graph-canvas'
            );
            return Boolean(surface);
        }

        function handleSocialFileImageError(event) {
            const img = event.target;
            if (!img?.matches?.('img[data-social-file-key]')) return;
            if (!socialInteractionContains(img)) return;
            const storageKey = text(img.getAttribute('data-social-file-key'));
            if (!storageKey) return;
            if (typeof window.__kiuMarkSocialFileUnavailable === 'function') {
                window.__kiuMarkSocialFileUnavailable(storageKey);
            }
        }

        async function handleClick(event) {
            if (event.__kiuSocialHandled) return;
            if (event.target?.closest?.('label.social-photo-upload-dropzone, input[name="photographyUploadFile"]')) return;
            if (shouldBlockGraphSurfaceClick(event)) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            const trigger = event.target.closest('[data-action]');
            if (!trigger || !socialInteractionContains(trigger)) return;
            if (shouldBlockGraphSurfaceClick(event, trigger)) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            const action = text(trigger.getAttribute('data-action'));
            if (!action) return;
            if (action === 'noop') return;
            if (action === 'social-pagination-mode' || action === 'social-pagination-page') {
                event.__kiuSocialHandled = true;
                event.preventDefault();
                window.KiuSocialPagination?.handleAction(action, trigger);
                return;
            }
            if (trigger.matches('input[type="file"]')) return;
            const draggedNode = trigger.classList?.contains('social-project-task-graph-node-g')
                ? trigger
                : trigger.closest?.('.social-project-task-graph-node-g');
            if (draggedNode?.dataset?.kiuDragged === '1') {
                delete draggedNode.dataset.kiuDragged;
                return;
            }
            if (draggedNode?.dataset?.kiuGraphSelected === '1') {
                delete draggedNode.dataset.kiuGraphSelected;
                return;
            }

            if (document.body?.classList.contains('kiu-shell-loading')
                || document.documentElement?.classList.contains('kiu-shell-loading')) {
                revealShell();
            }

            if (action === 'module-curator-pin' || action === 'module-personal-pin') {
                event.__kiuSocialHandled = true;
                event.preventDefault();
                event.stopPropagation();
                const module = text(trigger.getAttribute('data-pin-module') || '');
                const entityId = text(trigger.getAttribute('data-entity-id') || '');
                const kind = action === 'module-curator-pin' ? 'curator' : 'personal';
                const togglePin = typeof window.togglePortalSocialModulePin === 'function'
                    ? window.togglePortalSocialModulePin
                    : null;
                if (!togglePin) {
                    flashSocialError('Pin state could not be updated.');
                    return;
                }
                try {
                    await togglePin(module, entityId, kind);
                    window.KiuSocialPinModel?.setPinApiUnavailable?.(false);
                    if (typeof renderSocialPageNow === 'function') renderSocialPageNow('module-pin');
                } catch (error) {
                    const pinUnavailable = /Pin API unavailable/i.test(text(error?.message || ''));
                    if (pinUnavailable) {
                        window.KiuSocialPinModel?.setPinApiUnavailable?.(true);
                        if (typeof renderSocialPageNow === 'function') renderSocialPageNow('pin-api-unavailable');
                    }
                    flashSocialError(error?.message || 'Pin state could not be updated.');
                }
                return;
            }

            if (action === 'social-module-retry') {
                event.__kiuSocialHandled = true;
                event.preventDefault();
                const panel = text(trigger.getAttribute('data-social-module-panel') || '');
                const retry = window.__kiuRetrySocialModule;
                if (typeof retry === 'function') {
                    await retry(panel);
                }
                return;
            }
            const shellNav = handleShellNavClick(action, trigger);
            if (shellNav.handled) {
                event.__kiuSocialHandled = true;
                event.preventDefault();
                try {
                    const navResult = shellNav.result;
                    if (navResult && typeof navResult.then === 'function') await navResult;
                    return navResult;
                } catch (error) {
                    console.error('[Social] Shell nav action failed:', action, error);
                    flashSocialError(error?.message || 'Action failed.');
                }
                return;
            }

            const clickDomain = routeSocialDomain(action, clickDomainRoutes, {
                invoke: (handler) => handler(action, trigger)
            });
            if (!clickDomain.matched) return;

            event.__kiuSocialHandled = true;
            event.preventDefault();
            try {
                const clickResult = clickDomain.result;
                if (clickResult && typeof clickResult.then === 'function') await clickResult;
                return clickResult;
            } catch (error) {
                console.error('[Social] Click action failed:', action, error);
                flashSocialError(error?.message || 'Action failed.');
            }
        }

        async function handleSubmit(event) {
            const form = event.target.closest('form[data-form]');
            if (!form || !socialInteractionContains(form)) return;
            event.preventDefault();
            const formType = text(form.getAttribute('data-form'));
            const runtime = state();

            const submitDomain = routeSocialDomain(formType, [
                {
                    is: 'isSocialWorkspaceSubmitForm',
                    fallback: (t) => t === 'create-project' || t === 'create-portfolio' || t === 'portfolio-settings' || t === 'project-settings' || String(t || '').startsWith('project-') || String(t || '').startsWith('dialog-project'),
                    has: hasSocialWorkspaceModule,
                    ensure: ensureSocialWorkspaceModule,
                    handle: 'handleSocialWorkspaceSubmit'
                },
                {
                    is: 'isSocialGroupsSubmitForm',
                    fallback: (t) => t === 'create-group' || t === 'group-settings' || t === 'dialog-group-invite' || t === 'dialog-group-leave',
                    has: hasSocialGroupsModule,
                    ensure: ensureSocialGroupsModule,
                    handle: 'handleSocialGroupsSubmit'
                },
                {
                    is: 'isSocialFeedSubmitForm',
                    fallback: (t) => t === 'post-compose' || t === 'comment' || t === 'dialog-comment' || t === 'add-story' || String(t || '').startsWith('dialog-post-') || String(t || '').startsWith('dialog-comment-'),
                    has: hasSocialFeedModule,
                    ensure: ensureSocialFeedModule,
                    handle: 'handleSocialFeedSubmit'
                },
                {
                    is: 'isSocialPagesSubmitForm',
                    fallback: (t) => t === 'create-page' || t === 'pages-search' || t === 'update-page-profile' || t === 'page-profile-post',
                    has: hasSocialPagesModule,
                    ensure: ensureSocialPagesModule,
                    handle: 'handleSocialPagesSubmit'
                },
                {
                    is: 'isSocialEventsSubmitForm',
                    fallback: (t) => t === 'create-event' || t === 'dialog-event-delete',
                    has: hasSocialEventsModule,
                    ensure: ensureSocialEventsModule,
                    handle: 'handleSocialEventsSubmit'
                },
                {
                    is: 'isSocialSurveysSubmitForm',
                    fallback: (t) => String(t || '').startsWith('survey-') || String(t || '').startsWith('dialog-survey-'),
                    has: hasSocialSurveysModule,
                    ensure: ensureSocialSurveysModule,
                    handle: 'handleSocialSurveysSubmit'
                },
                {
                    is: 'isSocialResearchSubmitForm',
                    fallback: (t) => t === 'research-create',
                    has: hasSocialResearchModule,
                    ensure: ensureSocialResearchModule,
                    handle: 'handleSocialResearchSubmit'
                },
                {
                    is: 'isSocialPhotographySubmitForm',
                    fallback: (t) => t === 'photography-upload' || t === 'dialog-photography-delete' || t === 'dialog-photography-edit',
                    has: hasSocialPhotographyModule,
                    ensure: ensureSocialPhotographyModule,
                    handle: 'handleSocialPhotographySubmit'
                },
                {
                    is: 'isSocialLostFoundSubmitForm',
                    fallback: (t) => t === 'lost-found-item' || String(t || '').startsWith('dialog-lost-found-'),
                    has: hasSocialLostFoundModule,
                    ensure: ensureSocialLostFoundModule,
                    handle: 'handleSocialLostFoundSubmit'
                },
                {
                    is: 'isSocialMessagesSubmitForm',
                    fallback: (t) => t === 'send-message' || t === 'dialog-message-delete' || t === 'dialog-chat-hide',
                    has: hasSocialMessagesModule,
                    ensure: ensureSocialMessagesModule,
                    handle: 'handleSocialMessagesSubmit'
                },
                {
                    is: 'isSocialProfileSubmitForm',
                    fallback: (t) => t === 'edit-profile' || t === 'dialog-profile-cover',
                    has: hasSocialProfileModule,
                    ensure: ensureSocialProfileModule,
                    handle: 'handleSocialProfileSubmit'
                }
            ], { invoke: (handler) => handler(formType, form, runtime, event) });
            if (!submitDomain.matched) return;
            try {
                const result = submitDomain.result;
                if (result && typeof result.then === 'function') await result;
            } catch (error) {
                console.error('[Social] Submit action failed:', formType, error);
                flashSocialError(error?.message || 'Action failed.');
            }
        }

        function handlePointerDown(event) {
            const target = event.target;
            if (!target || !socialInteractionContains(target)) return;
            const submitBtn = target.closest?.('.social-neo-survey-submit-btn');
            if (submitBtn) {
                rippleSurveySubmitButton(submitBtn, event);
                return;
            }
            const input = target.matches?.('.social-neo-survey-take-choice input[type="radio"], .social-neo-survey-take-choice input[type="checkbox"]')
                ? target
                : null;
            const label = input
                ? input.closest('.social-neo-survey-take-choice')
                : target.closest?.('.social-neo-survey-take-choice');
            if (!label) return;
            rippleSurveyChoiceLabel(label, event);
        }

        function handleInput(event) {
            const runtime = state();
            const target = event.target;
            if (!target || !socialInteractionContains(target)) return;

            const inputDomain = routeSocialDomain(target, [
                {
                    is: 'isSocialWorkspaceInputTarget',
                    fallback: () => false,
                    has: hasSocialWorkspaceModule,
                    ensure: ensureSocialWorkspaceModule,
                    handle: 'handleSocialWorkspaceInput'
                },
                {
                    is: 'isSocialFeedInputTarget',
                    fallback: () => false,
                    has: hasSocialFeedModule,
                    ensure: ensureSocialFeedModule,
                    handle: 'handleSocialFeedInput'
                },
                {
                    is: 'isSocialCommunityInputTarget',
                    fallback: () => false,
                    has: hasSocialCommunityModule,
                    ensure: ensureSocialCommunityModule,
                    handle: 'handleSocialCommunityInput'
                },
                {
                    is: 'isSocialPagesInputTarget',
                    fallback: () => false,
                    has: hasSocialPagesModule,
                    ensure: ensureSocialPagesModule,
                    handle: 'handleSocialPagesInput'
                },
                {
                    is: 'isSocialGroupsInputTarget',
                    fallback: () => false,
                    has: hasSocialGroupsModule,
                    ensure: ensureSocialGroupsModule,
                    handle: 'handleSocialGroupsInput'
                },
                {
                    is: 'isSocialEventsInputTarget',
                    fallback: () => false,
                    has: hasSocialEventsModule,
                    ensure: ensureSocialEventsModule,
                    handle: 'handleSocialEventsInput'
                },
                {
                    is: 'isSocialSurveysInputTarget',
                    fallback: () => false,
                    has: hasSocialSurveysModule,
                    ensure: ensureSocialSurveysModule,
                    handle: 'handleSocialSurveysInput'
                },
                {
                    is: 'isSocialResearchInputTarget',
                    fallback: (el) => Boolean(el?.closest?.('[data-form="research-create"]')
                        || el?.getAttribute?.('data-bind') === 'research-search'
                        || String(el?.name || '').startsWith('research')),
                    has: hasSocialResearchModule,
                    ensure: ensureSocialResearchModule,
                    handle: 'handleSocialResearchInput'
                },
                {
                    is: 'isSocialProfileInputTarget',
                    fallback: () => false,
                    has: hasSocialProfileModule,
                    ensure: ensureSocialProfileModule,
                    handle: 'handleSocialProfileInput'
                },
                {
                    is: 'isSocialAlertsInputTarget',
                    fallback: () => false,
                    has: hasSocialAlertsModule,
                    ensure: ensureSocialAlertsModule,
                    handle: 'handleSocialAlertsInput'
                },
                {
                    is: 'isSocialPhotographyInputTarget',
                    fallback: () => false,
                    has: hasSocialPhotographyModule,
                    ensure: ensureSocialPhotographyModule,
                    handle: 'handleSocialPhotographyInput'
                },
                {
                    is: 'isSocialLostFoundInputTarget',
                    fallback: () => false,
                    has: hasSocialLostFoundModule,
                    ensure: ensureSocialLostFoundModule,
                    handle: 'handleSocialLostFoundInput'
                },
                {
                    is: 'isSocialMessagesInputTarget',
                    fallback: () => false,
                    has: hasSocialMessagesModule,
                    ensure: ensureSocialMessagesModule,
                    handle: 'handleSocialMessagesInput'
                }
            ], {
                fireAndForget: true,
                invoke: (handler) => handler(target, runtime, event)
            });
            if (inputDomain.matched) return;

            syncCommentDraftFromTarget(target);
        }

        function handleChange(event) {
            if (event.__kiuSocialChangeHandled) return;
            const runtime = state();
            const target = event.target;
            if (!target || !socialInteractionContains(target)) return;

            if (target.matches?.('select[name="socialBrowseFaculty"]')) {
                event.__kiuSocialChangeHandled = true;
                const next = text(target.value || 'all') || 'all';
                runtime.ui.socialBrowseFaculty = next;
                runtime.ui.projectDiscoverFaculty = next === 'all' ? 'all' : next;
                runtime.ui.researchFaculty = next === 'all' ? '' : next;
                renderSocialPageNow('social-browse-faculty');
                return;
            }

            if (target.matches?.('[data-action="social-pagination-page-size"]')) {
                event.__kiuSocialChangeHandled = true;
                window.KiuSocialPagination?.handleAction('social-pagination-page-size', target);
                return;
            }

            const changeDomain = routeSocialDomain(target, [
                {
                    is: 'isSocialWorkspaceChangeTarget',
                    fallback: (t) => t.name === 'projectMediaFile',
                    has: hasSocialWorkspaceModule,
                    ensure: ensureSocialWorkspaceModule,
                    handle: 'handleSocialWorkspaceChange'
                },
                {
                    is: 'isSocialFeedChangeTarget',
                    fallback: () => false,
                    has: hasSocialFeedModule,
                    ensure: ensureSocialFeedModule,
                    handle: 'handleSocialFeedChange'
                },
                {
                    is: 'isSocialCommunityChangeTarget',
                    fallback: () => false,
                    has: hasSocialCommunityModule,
                    ensure: ensureSocialCommunityModule,
                    handle: 'handleSocialCommunityChange'
                },
                {
                    is: 'isSocialPagesChangeTarget',
                    fallback: () => false,
                    has: hasSocialPagesModule,
                    ensure: ensureSocialPagesModule,
                    handle: 'handleSocialPagesChange'
                },
                {
                    is: 'isSocialGroupsChangeTarget',
                    fallback: () => false,
                    has: hasSocialGroupsModule,
                    ensure: ensureSocialGroupsModule,
                    handle: 'handleSocialGroupsChange'
                },
                {
                    is: 'isSocialEventsChangeTarget',
                    fallback: () => false,
                    has: hasSocialEventsModule,
                    ensure: ensureSocialEventsModule,
                    handle: 'handleSocialEventsChange'
                },
                {
                    is: 'isSocialSurveysChangeTarget',
                    fallback: () => false,
                    has: hasSocialSurveysModule,
                    ensure: ensureSocialSurveysModule,
                    handle: 'handleSocialSurveysChange'
                },
                {
                    is: 'isSocialResearchChangeTarget',
                    fallback: (el) => Boolean(el?.getAttribute?.('data-bind')?.startsWith?.('research-')
                        || String(el?.name || '').startsWith('research')),
                    has: hasSocialResearchModule,
                    ensure: ensureSocialResearchModule,
                    handle: 'handleSocialResearchChange'
                },
                {
                    is: 'isSocialProfileChangeTarget',
                    fallback: () => false,
                    has: hasSocialProfileModule,
                    ensure: ensureSocialProfileModule,
                    handle: 'handleSocialProfileChange'
                },
                {
                    is: 'isSocialLostFoundChangeTarget',
                    fallback: () => false,
                    has: hasSocialLostFoundModule,
                    ensure: ensureSocialLostFoundModule,
                    handle: 'handleSocialLostFoundChange'
                },
                {
                    is: 'isSocialMessagesChangeTarget',
                    fallback: () => false,
                    has: hasSocialMessagesModule,
                    ensure: ensureSocialMessagesModule,
                    handle: 'handleSocialMessagesChange'
                },
                {
                    is: 'isSocialPhotographyChangeTarget',
                    fallback: () => false,
                    has: hasSocialPhotographyModule,
                    ensure: ensureSocialPhotographyModule,
                    handle: 'handleSocialPhotographyChange'
                }
            ], {
                fireAndForget: true,
                invoke: (handler) => handler(target, runtime, event)
            });
            if (changeDomain.matched) return;

            syncCommentDraftFromTarget(target);
        }

        function handleGlobalKeydown(event) {
            const host = root();
            if (!host) return;
            const activeTag = String(document.activeElement?.tagName || '').toLowerCase();
            const isTyping = ['input', 'textarea', 'select'].includes(activeTag) || Boolean(document.activeElement?.isContentEditable);
            if (event.key === 'Escape') {
                const runtime = state();
                if (runtime.ui?.socialDialog) {
                    event.preventDefault();
                    const activeType = text(runtime.ui.socialDialog?.type || '');
                    if (shouldRestoreStackedDialog(activeType)) {
                        restorePreviousDialog();
                    } else {
                        closeDialog();
                    }
                    return;
                }
                if (runtime.ui?.workspaceNavOpen) {
                    event.preventDefault();
                    closeSocialWorkspaceNavAnimated();
                    return;
                }
                if (runtime.ui?.shellDrawerOpen) {
                    event.preventDefault();
                    runtime.ui.shellDrawerOpen = false;
                    renderSocialPageNow('escape-shell-drawer');
                    return;
                }
                if (typeof isPortalStoryViewerOpen === 'function' && isPortalStoryViewerOpen()) {
                    event.preventDefault();
                    if (typeof closePortalStoryViewer === 'function') closePortalStoryViewer();
                    return;
                }
                if (typeof isPortalStoryComposerOpen === 'function' && isPortalStoryComposerOpen()) {
                    event.preventDefault();
                    if (typeof closePortalStoryComposer === 'function') closePortalStoryComposer();
                    return;
                }
                const callOverlay = document.getElementById('social-neo-call-overlay');
                if (callOverlay?.classList.contains('is-open')) {
                    event.preventDefault();
                    if (typeof window.dismissSocialCallOverlay === 'function') {
                        window.dismissSocialCallOverlay().catch(() => null);
                    }
                    return;
                }
            }
            if ((event.ctrlKey || event.metaKey) && String(event.key || '').toLowerCase() === 'k') {
                event.preventDefault();
                const search = host.querySelector('input[type="search"], input[name="lostFoundSearch"], [data-bind="directory-search"], [data-bind="pages-search"], [name="projectDiscoverSearch"]');
                if (search && typeof search.focus === 'function') search.focus({ preventScroll: false });
                return;
            }
            if (!isTyping && event.key === '/') {
                const search = host.querySelector('input[type="search"], input[name="lostFoundSearch"], [data-bind="directory-search"], [data-bind="pages-search"], [name="projectDiscoverSearch"]');
                if (search && typeof search.focus === 'function') {
                    event.preventDefault();
                    search.focus({ preventScroll: false });
                }
            }
            if (!isTyping && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
                const focused = document.activeElement;
                if (focused?.getAttribute('role') === 'tab') {
                    const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
                    const idx = tabs.indexOf(focused);
                    if (idx >= 0) {
                        const next = event.key === 'ArrowRight'
                            ? tabs[(idx + 1) % tabs.length]
                            : tabs[(idx - 1 + tabs.length) % tabs.length];
                        if (next) {
                            next.focus();
                            next.click();
                            event.preventDefault();
                        }
                    }
                }
            }
        }

        let portalEventAbort = null;
        let overlayCaptureClickBound = false;
        let overlayCaptureChangeBound = false;

        function handlePhotographyUploadDragEnter(event) {
            const dropzone = event.target?.closest?.('[data-photography-drop]');
            if (!dropzone) return;
            event.preventDefault();
            dropzone.classList.add('is-dragover');
        }

        function handlePhotographyUploadDragOver(event) {
            const dropzone = event.target?.closest?.('[data-photography-drop]');
            if (!dropzone) return;
            event.preventDefault();
            dropzone.classList.add('is-dragover');
        }

        function handlePhotographyUploadDragLeave(event) {
            const dropzone = event.target?.closest?.('[data-photography-drop]');
            if (!dropzone) return;
            const related = event.relatedTarget;
            if (related && dropzone.contains(related)) return;
            dropzone.classList.remove('is-dragover');
        }

        function handlePhotographyUploadDrop(event) {
            const dropzone = event.target?.closest?.('[data-photography-drop]');
            if (!dropzone) return;
            event.preventDefault();
            dropzone.classList.remove('is-dragover');
            const file = event.dataTransfer?.files?.[0] || null;
            if (file) applyPhotographyUploadFile(file);
        }

        function resolveTaskProofDropzone(event) {
            return event.target?.closest?.('[data-proof-drop]') || null;
        }

        function handleTaskProofUploadDragEnter(event) {
            const dropzone = resolveTaskProofDropzone(event);
            if (!dropzone) return;
            event.preventDefault();
            dropzone.classList.add('is-dragover');
        }

        function handleTaskProofUploadDragOver(event) {
            const dropzone = resolveTaskProofDropzone(event);
            if (!dropzone) return;
            event.preventDefault();
            dropzone.classList.add('is-dragover');
        }

        function handleTaskProofUploadDragLeave(event) {
            const dropzone = resolveTaskProofDropzone(event);
            if (!dropzone) return;
            const related = event.relatedTarget;
            if (related && dropzone.contains(related)) return;
            dropzone.classList.remove('is-dragover');
        }

        function handleTaskProofUploadDrop(event) {
            const dropzone = resolveTaskProofDropzone(event);
            if (!dropzone) return;
            event.preventDefault();
            dropzone.classList.remove('is-dragover');
            const input = dropzone.querySelector('input[name="projectTaskProofFiles"]');
            const files = event.dataTransfer?.files || null;
            if (!input || !files?.length) return;
            const addProof = typeof window.addPortalSocialProjectTaskProof === 'function'
                ? window.addPortalSocialProjectTaskProof
                : null;
            const status = dropzone.closest('.spt-proof-section')?.querySelector('[data-proof-status]');
            if (status) {
                status.classList.remove('is-error');
                status.textContent = 'Uploading proof images…';
            }
            if (addProof) {
                Promise.resolve(addProof(
                    input.getAttribute('data-project-id'),
                    input.getAttribute('data-task-id'),
                    Array.from(files),
                    { silent: true }
                )).then((uploadedTask) => {
                    if (!uploadedTask) {
                        if (status) {
                            status.classList.add('is-error');
                            status.textContent = 'No compatible images were added. Use PNG, JPG, WEBP, or GIF files up to 10 MB.';
                        }
                        return;
                    }
                    const refreshGraph = window.__kiuSocialWorkspaceHooks?.refreshProjectTaskGraphDialog
                        || window.refreshProjectTaskGraphDialog;
                    if (typeof refreshGraph === 'function') {
                        try { refreshGraph(['selection']); } catch (error) {}
                    }
                    const rerender = window.__kiuSocialWorkspaceHooks?.renderDialogOnlyNow
                        || window.renderSocialPageNow;
                    if (typeof rerender === 'function') rerender('task-proof-upload');
                }).catch((uploadError) => {
                    if (status) {
                        status.classList.add('is-error');
                        status.textContent = uploadError?.message || 'Proof images could not be uploaded.';
                    }
                    if (typeof window.setPortalSocialFlash === 'function') window.setPortalSocialFlash(uploadError?.message || 'Proof images could not be uploaded.', 'danger');
                });
                return;
            }
            // Last-resort support for older cached runtimes: let the native input
            // change handler process the drop if its FileList setter is writable.
            try {
                input.files = files;
                input.dispatchEvent(new Event('change', { bubbles: true }));
            } catch (error) {}
        }

        function bindTaskProofUploadEvents(node, signal) {
            node.addEventListener('dragenter', handleTaskProofUploadDragEnter, { signal });
            node.addEventListener('dragover', handleTaskProofUploadDragOver, { signal });
            node.addEventListener('dragleave', handleTaskProofUploadDragLeave, { signal });
            node.addEventListener('drop', handleTaskProofUploadDrop, { signal });
        }

        function bindPhotographyUploadPortalEvents(portal, signal) {
            portal.addEventListener('dragenter', handlePhotographyUploadDragEnter, { signal });
            portal.addEventListener('dragover', handlePhotographyUploadDragOver, { signal });
            portal.addEventListener('dragleave', handlePhotographyUploadDragLeave, { signal });
            portal.addEventListener('drop', handlePhotographyUploadDrop, { signal });
        }
        return {
            handleClick,
            handleSubmit,
            handlePointerDown,
            handleInput,
            handleChange,
            handleGlobalKeydown,
            handleSocialFileImageError,
            handlePhotographyUploadDragEnter,
            handlePhotographyUploadDragOver,
            handlePhotographyUploadDragLeave,
            handlePhotographyUploadDrop,
            bindPhotographyUploadPortalEvents,
            handleTaskProofUploadDragEnter,
            handleTaskProofUploadDragOver,
            handleTaskProofUploadDragLeave,
            handleTaskProofUploadDrop,
            bindTaskProofUploadEvents
        };
    }

    window.createKiuSocialPageEventsApi = createKiuSocialPageEventsApi;
})();
