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

        async function handleClick(event) {
            if (event.__kiuSocialHandled) return;
            if (event.target?.closest?.('label.social-photo-upload-dropzone, input[name="photographyUploadFile"]')) return;
            const trigger = event.target.closest('[data-action]');
            if (!trigger || !socialInteractionContains(trigger)) return;
            const action = text(trigger.getAttribute('data-action'));
            if (!action) return;
            if (action === 'noop') return;
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
            event.__kiuSocialHandled = true;
            event.preventDefault();

            const shellNav = handleShellNavClick(action, trigger);
            if (shellNav.handled) return shellNav.result;

            const clickDomain = routeSocialDomain(action, clickDomainRoutes, {
                invoke: (handler) => handler(action, trigger)
            });
            if (clickDomain.matched) return clickDomain.result;
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
                    is: 'isSocialPhotographySubmitForm',
                    fallback: (t) => t === 'photography-upload',
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
            if (submitDomain.matched) return submitDomain.result;
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
                    closeDialog();
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
            handlePhotographyUploadDragEnter,
            handlePhotographyUploadDragOver,
            handlePhotographyUploadDragLeave,
            handlePhotographyUploadDrop,
            bindPhotographyUploadPortalEvents
        };
    }

    window.createKiuSocialPageEventsApi = createKiuSocialPageEventsApi;
})();
