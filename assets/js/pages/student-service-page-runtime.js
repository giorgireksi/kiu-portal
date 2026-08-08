/* Wave bag: Wave 26 student-service-page */
window.KiuStudentServicePage = window.KiuStudentServicePage || {};
const __kiuSspApi = window.KiuStudentServicePage;
window.__kiuSspApi = __kiuSspApi;
function __kiuSspExpose(map) {
    Object.keys(map).forEach((key) => {
        __kiuSspApi[key] = map[key];
        window[key] = map[key];
    });
}

/* Student service page runtime — articles, page shell, render, bootstrap.
 * Peeled from student-service.js. Load before student-service.js.
 */
(function initStudentServicePageRuntime() {
    'use strict';
    if (window.__KIU_STUDENT_SERVICE_PAGE_RUNTIME_LOADED) return;
    window.__KIU_STUDENT_SERVICE_PAGE_RUNTIME_LOADED = true;

    window.__kiuCreateStudentServicePageApi = function createKiuStudentServicePageApi(deps = {}) {
        const d = deps;
        const USER_ROLES = d.USER_ROLES ?? window.USER_ROLES;
        const STUDENT_SERVICE_RUNTIME = d.STUDENT_SERVICE_RUNTIME ?? window.STUDENT_SERVICE_RUNTIME;
        const STUDENT_SERVICE_API_PATHS = d.STUDENT_SERVICE_API_PATHS ?? window.STUDENT_SERVICE_API_PATHS;
        function __kiuSspResolveDep(name) {
            return function __kiuSspDepForward(...args) {
                const fromDeps = d[name];
                if (typeof fromDeps === 'function' && fromDeps !== __kiuSspDepForward) {
                    return fromDeps.apply(this, args);
                }
                const kiu = window.KiuStudentService?.[name];
                if (typeof kiu === 'function' && kiu !== __kiuSspDepForward) {
                    return kiu.apply(this, args);
                }
                const model = window.KiuStudentServiceModel?.[name];
                if (typeof model === 'function' && model !== __kiuSspDepForward) {
                    return model.apply(this, args);
                }
                const globalFn = window[name];
                if (typeof globalFn === 'function' && globalFn !== __kiuSspDepForward) {
                    return globalFn.apply(this, args);
                }
                throw new Error('Missing dep: ' + name);
            };
        }
        function bindStudentServiceDelegatedInteractions(...a) {
            const fn = d.bindStudentServiceDelegatedInteractions || window.bindStudentServiceDelegatedInteractions;
            if (typeof fn !== 'function') throw new Error('Missing dep: bindStudentServiceDelegatedInteractions');
            return fn.apply(this, a);
        }
        function bindStudentServiceRealtimeRefreshListener(...a) {
            const fn = d.bindStudentServiceRealtimeRefreshListener || window.bindStudentServiceRealtimeRefreshListener;
            if (typeof fn !== 'function') throw new Error('Missing dep: bindStudentServiceRealtimeRefreshListener');
            return fn.apply(this, a);
        }
        const buildStudentServiceArticleFingerprint = __kiuSspResolveDep('buildStudentServiceArticleFingerprint');
        function buildStudentServiceChromeSignature(...a) {
            const fn = d.buildStudentServiceChromeSignature || window.buildStudentServiceChromeSignature;
            if (typeof fn !== 'function') throw new Error('Missing dep: buildStudentServiceChromeSignature');
            return fn.apply(this, a);
        }
        function buildStudentServiceQaContentFingerprint(...a) {
            const fn = d.buildStudentServiceQaContentFingerprint || window.buildStudentServiceQaContentFingerprint;
            if (typeof fn !== 'function') throw new Error('Missing dep: buildStudentServiceQaContentFingerprint');
            return fn.apply(this, a);
        }
        function canCurrentUserModerateStudentService(...a) {
            const fn = d.canCurrentUserModerateStudentService || window.canCurrentUserModerateStudentService;
            if (typeof fn !== 'function') throw new Error('Missing dep: canCurrentUserModerateStudentService');
            return fn.apply(this, a);
        }
        const canShowStudentServiceArticleEditorActions = __kiuSspResolveDep('canShowStudentServiceArticleEditorActions');
        function closeStudentServiceDeleteConfirm(...a) {
            const fn = d.closeStudentServiceDeleteConfirm || window.closeStudentServiceDeleteConfirm;
            if (typeof fn !== 'function') throw new Error('Missing dep: closeStudentServiceDeleteConfirm');
            return fn.apply(this, a);
        }
        function ensureStudentServiceQaModule(...a) {
            const fn = d.ensureStudentServiceQaModule || window.ensureStudentServiceQaModule;
            if (typeof fn !== 'function') throw new Error('Missing dep: ensureStudentServiceQaModule');
            return fn.apply(this, a);
        }
        function ensureStudentServiceStores(...a) {
            const fn = d.ensureStudentServiceStores || window.ensureStudentServiceStores;
            if (typeof fn !== 'function') throw new Error('Missing dep: ensureStudentServiceStores');
            return fn.apply(this, a);
        }
        function ensureStudentServiceTicketsModule(...a) {
            const fn = d.ensureStudentServiceTicketsModule || window.ensureStudentServiceTicketsModule;
            if (typeof fn !== 'function') throw new Error('Missing dep: ensureStudentServiceTicketsModule');
            return fn.apply(this, a);
        }
        function ensureStudentServiceUiState(...a) {
            const fn = d.ensureStudentServiceUiState || window.ensureStudentServiceUiState;
            if (typeof fn !== 'function') throw new Error('Missing dep: ensureStudentServiceUiState');
            return fn.apply(this, a);
        }
        function flashStudentServiceActionButton(...a) {
            const fn = d.flashStudentServiceActionButton || window.flashStudentServiceActionButton;
            if (typeof fn !== 'function') throw new Error('Missing dep: flashStudentServiceActionButton');
            return fn.apply(this, a);
        }
        function getActivePageId(...a) {
            const fn = d.getActivePageId || window.getActivePageId;
            if (typeof fn !== 'function') throw new Error('Missing dep: getActivePageId');
            return fn.apply(this, a);
        }
        function getCurrentUserId(...a) {
            const fn = d.getCurrentUserId || window.getCurrentUserId;
            if (typeof fn !== 'function') throw new Error('Missing dep: getCurrentUserId');
            return fn.apply(this, a);
        }
        function getEffectiveUserRole(...a) {
            const fn = d.getEffectiveUserRole || window.getEffectiveUserRole;
            if (typeof fn !== 'function') throw new Error('Missing dep: getEffectiveUserRole');
            return fn.apply(this, a);
        }
        function getStudentServiceArticleById(...a) {
            const fn = d.getStudentServiceArticleById || window.getStudentServiceArticleById;
            if (typeof fn !== 'function') throw new Error('Missing dep: getStudentServiceArticleById');
            return fn.apply(this, a);
        }
        function getStudentServiceCurrentUser(...a) {
            const fn = d.getStudentServiceCurrentUser || window.getStudentServiceCurrentUser;
            if (typeof fn !== 'function') throw new Error('Missing dep: getStudentServiceCurrentUser');
            return fn.apply(this, a);
        }
        function getStudentServiceFilteredQuestions(...a) {
            const fn = d.getStudentServiceFilteredQuestions || window.getStudentServiceFilteredQuestions;
            if (typeof fn !== 'function') throw new Error('Missing dep: getStudentServiceFilteredQuestions');
            return fn.apply(this, a);
        }
        function getStudentServiceLane(...a) {
            const fn = d.getStudentServiceLane || window.getStudentServiceLane;
            if (typeof fn !== 'function') throw new Error('Missing dep: getStudentServiceLane');
            return fn.apply(this, a);
        }
        const getStudentServicePublishedInboxFilterLayout = __kiuSspResolveDep('getStudentServicePublishedInboxFilterLayout');
        function getStudentServiceSupportArea(...a) {
            const fn = d.getStudentServiceSupportArea || window.getStudentServiceSupportArea;
            if (typeof fn !== 'function') throw new Error('Missing dep: getStudentServiceSupportArea');
            return fn.apply(this, a);
        }
        function getStudentServiceVisibleArticles(...a) {
            const fn = d.getStudentServiceVisibleArticles || window.getStudentServiceVisibleArticles;
            if (typeof fn !== 'function') throw new Error('Missing dep: getStudentServiceVisibleArticles');
            return fn.apply(this, a);
        }
        function getStudentServiceVisibleQuestions(...a) {
            const fn = d.getStudentServiceVisibleQuestions || window.getStudentServiceVisibleQuestions;
            if (typeof fn !== 'function') throw new Error('Missing dep: getStudentServiceVisibleQuestions');
            return fn.apply(this, a);
        }
        function getStudentServiceVisibleTickets(...a) {
            const fn = d.getStudentServiceVisibleTickets || window.getStudentServiceVisibleTickets;
            if (typeof fn !== 'function') throw new Error('Missing dep: getStudentServiceVisibleTickets');
            return fn.apply(this, a);
        }
        function hasStudentServiceQaModule(...a) {
            const fn = d.hasStudentServiceQaModule || window.hasStudentServiceQaModule;
            if (typeof fn !== 'function') throw new Error('Missing dep: hasStudentServiceQaModule');
            return fn.apply(this, a);
        }
        function hasStudentServiceServiceModule(...a) {
            const fn = d.hasStudentServiceServiceModule || window.hasStudentServiceServiceModule;
            if (typeof fn !== 'function') throw new Error('Missing dep: hasStudentServiceServiceModule');
            return fn.apply(this, a);
        }
        function hasStudentServiceTicketsModule(...a) {
            const fn = d.hasStudentServiceTicketsModule || window.hasStudentServiceTicketsModule;
            if (typeof fn !== 'function') throw new Error('Missing dep: hasStudentServiceTicketsModule');
            return fn.apply(this, a);
        }
        function isStudentServiceQaBodyStale(...a) {
            const fn = d.isStudentServiceQaBodyStale || window.isStudentServiceQaBodyStale;
            if (typeof fn !== 'function') throw new Error('Missing dep: isStudentServiceQaBodyStale');
            return fn.apply(this, a);
        }
        function kiuPortalFetch(...a) {
            const fn = d.kiuPortalFetch || window.kiuPortalFetch;
            if (typeof fn !== 'function') throw new Error('Missing dep: kiuPortalFetch');
            return fn.apply(this, a);
        }
        function postStudentService(...a) {
            const fn = d.postStudentService || window.postStudentService;
            if (typeof fn !== 'function') throw new Error('Missing dep: postStudentService');
            return fn.apply(this, a);
        }
        function pruneStudentHubArticleSelections(...a) {
            const fn = d.pruneStudentHubArticleSelections || window.pruneStudentHubArticleSelections;
            if (typeof fn !== 'function') throw new Error('Missing dep: pruneStudentHubArticleSelections');
            return fn.apply(this, a);
        }
        function renderStudentServiceBootstrapLoadingShell(...a) {
            const fn = d.renderStudentServiceBootstrapLoadingShell || window.renderStudentServiceBootstrapLoadingShell;
            if (typeof fn !== 'function') throw new Error('Missing dep: renderStudentServiceBootstrapLoadingShell');
            return fn.apply(this, a);
        }
        function renderStudentServiceHomeWorkspaceRebuilt(...a) {
            const fn = d.renderStudentServiceHomeWorkspaceRebuilt || window.renderStudentServiceHomeWorkspaceRebuilt;
            if (typeof fn !== 'function') throw new Error('Missing dep: renderStudentServiceHomeWorkspaceRebuilt');
            return fn.apply(this, a);
        }
        function renderStudentServiceLaneChooser(...a) {
            const fn = d.renderStudentServiceLaneChooser || window.renderStudentServiceLaneChooser;
            if (typeof fn !== 'function') throw new Error('Missing dep: renderStudentServiceLaneChooser');
            return fn.apply(this, a);
        }
        function renderStudentServiceMyTicketsHub(...a) {
            const fn = d.renderStudentServiceMyTicketsHub || window.renderStudentServiceMyTicketsHub;
            if (typeof fn !== 'function') throw new Error('Missing dep: renderStudentServiceMyTicketsHub');
            return fn.apply(this, a);
        }
        function renderStudentServicePageChromeRebuilt(...a) {
            const fn = d.renderStudentServicePageChromeRebuilt || window.renderStudentServicePageChromeRebuilt;
            if (typeof fn !== 'function') throw new Error('Missing dep: renderStudentServicePageChromeRebuilt');
            return fn.apply(this, a);
        }
        function renderStudentServiceResponderServiceLane(...a) {
            const fn = d.renderStudentServiceResponderServiceLane || window.renderStudentServiceResponderServiceLane;
            if (typeof fn !== 'function') throw new Error('Missing dep: renderStudentServiceResponderServiceLane');
            return fn.apply(this, a);
        }
        function renderStudentServiceStaffWorkbench(...a) {
            const fn = d.renderStudentServiceStaffWorkbench || window.renderStudentServiceStaffWorkbench;
            if (typeof fn !== 'function') throw new Error('Missing dep: renderStudentServiceStaffWorkbench');
            return fn.apply(this, a);
        }
        function renderStudentServiceStudentHub(...a) {
            const fn = d.renderStudentServiceStudentHub || window.renderStudentServiceStudentHub;
            if (typeof fn !== 'function') throw new Error('Missing dep: renderStudentServiceStudentHub');
            return fn.apply(this, a);
        }
        function renderStudentServiceStudentQaHub(...a) {
            const fn = d.renderStudentServiceStudentQaHub || window.renderStudentServiceStudentQaHub;
            if (typeof fn !== 'function') throw new Error('Missing dep: renderStudentServiceStudentQaHub');
            return fn.apply(this, a);
        }
        function resolveStudentServiceArticleServiceAreaId(...a) {
            const fn = d.resolveStudentServiceArticleServiceAreaId || window.resolveStudentServiceArticleServiceAreaId;
            if (typeof fn !== 'function') throw new Error('Missing dep: resolveStudentServiceArticleServiceAreaId');
            return fn.apply(this, a);
        }
        function scheduleKiuRealtimeBootstrap(...a) {
            const fn = d.scheduleKiuRealtimeBootstrap || window.scheduleKiuRealtimeBootstrap;
            if (typeof fn !== 'function') throw new Error('Missing dep: scheduleKiuRealtimeBootstrap');
            return fn.apply(this, a);
        }
        function scheduleStudentServiceBootstrap(...a) {
            const fn = d.scheduleStudentServiceBootstrap || window.scheduleStudentServiceBootstrap;
            if (typeof fn !== 'function') throw new Error('Missing dep: scheduleStudentServiceBootstrap');
            return fn.apply(this, a);
        }
        function scheduleStudentServiceThreadRelayout(...a) {
            const fn = d.scheduleStudentServiceThreadRelayout || window.scheduleStudentServiceThreadRelayout;
            if (typeof fn !== 'function') throw new Error('Missing dep: scheduleStudentServiceThreadRelayout');
            return fn.apply(this, a);
        }
        function setStudentServiceMarkup(...a) {
            const fn = d.setStudentServiceMarkup || window.setStudentServiceMarkup;
            if (typeof fn !== 'function') throw new Error('Missing dep: setStudentServiceMarkup');
            return fn.apply(this, a);
        }
        function shouldDeferStudentServiceStudentHubUntilBootstrap(...a) {
            const fn = d.shouldDeferStudentServiceStudentHubUntilBootstrap || window.shouldDeferStudentServiceStudentHubUntilBootstrap;
            if (typeof fn !== 'function') throw new Error('Missing dep: shouldDeferStudentServiceStudentHubUntilBootstrap');
            return fn.apply(this, a);
        }
        const syncStudentServiceWorkspaceBackendSession = __kiuSspResolveDep('syncStudentServiceWorkspaceBackendSession');
        async function deleteStudentServiceArticle(articleId) {
            const normalizedArticleId = String(articleId || '').trim();
            if (!normalizedArticleId || !canShowStudentServiceArticleEditorActions()) return;
            const article = getStudentServiceArticleById(normalizedArticleId);
            if (!article) return;
            try {
                await postStudentService(STUDENT_SERVICE_API_PATHS.articlesDelete(normalizedArticleId), {});
                closeStudentServiceDeleteConfirm({ restoreThread: false });
                const ui = ensureStudentServiceUiState();
                if (ui.articleEditorId === normalizedArticleId || ui.selectedArticleId === normalizedArticleId) {
                    ui.articleEditorId = '';
                    ui.selectedArticleId = '';
                    ui.articleDraftMode = false;
                }
                KIU_STATE.studentServiceArticles = (KIU_STATE.studentServiceArticles || [])
                    .filter(item => String(item.id || '').trim() !== normalizedArticleId);
                pruneStudentHubArticleSelections(KIU_STATE.studentServiceArticles);
                await refreshStudentServiceDataAndRender();
            } catch (error) {
                console.error('Student Service article deletion failed.', error);
                const confirmBtn = document.querySelector('[data-student-service-confirm-article-delete]');
                flashStudentServiceActionButton(confirmBtn, 'error');
                alert(error?.message || 'Article could not be removed.');
            }
        }

        async function deleteStudentServiceQuestion(questionId) {
            if (hasStudentServiceQaModule()
                && typeof window.deleteStudentServiceQuestion === 'function'
                && window.deleteStudentServiceQuestion !== deleteStudentServiceQuestion) {
                return window.deleteStudentServiceQuestion.apply(null, arguments);
            }
            ensureStudentServiceQaModule().catch(() => null);
            return null;
        }

        async function deleteStudentServiceQuestionAnswer(questionId, answerId) {
            if (hasStudentServiceQaModule()
                && typeof window.deleteStudentServiceQuestionAnswer === 'function'
                && window.deleteStudentServiceQuestionAnswer !== deleteStudentServiceQuestionAnswer) {
                return window.deleteStudentServiceQuestionAnswer.apply(null, arguments);
            }
            ensureStudentServiceQaModule().catch(() => null);
            return null;
        }

        async function publishStudentServiceQuestion(questionId) {
            if (hasStudentServiceQaModule()
                && typeof window.publishStudentServiceQuestion === 'function'
                && window.publishStudentServiceQuestion !== publishStudentServiceQuestion) {
                return window.publishStudentServiceQuestion.apply(null, arguments);
            }
            ensureStudentServiceQaModule().catch(() => null);
            return null;
        }

        async function toggleStudentServiceQuestionFlag(questionId, field, value) {
            if (hasStudentServiceQaModule()
                && typeof window.toggleStudentServiceQuestionFlag === 'function'
                && window.toggleStudentServiceQuestionFlag !== toggleStudentServiceQuestionFlag) {
                return window.toggleStudentServiceQuestionFlag.apply(null, arguments);
            }
            ensureStudentServiceQaModule().catch(() => null);
            return null;
        }

        async function convertStudentServiceQuestionToTicket(questionId) {
            if (hasStudentServiceQaModule()
                && typeof window.convertStudentServiceQuestionToTicket === 'function'
                && window.convertStudentServiceQuestionToTicket !== convertStudentServiceQuestionToTicket) {
                return window.convertStudentServiceQuestionToTicket.apply(null, arguments);
            }
            ensureStudentServiceQaModule().catch(() => null);
            return null;
        }

        async function convertStudentServiceQuestionToArticle(questionId) {
            if (hasStudentServiceQaModule()
                && typeof window.convertStudentServiceQuestionToArticle === 'function'
                && window.convertStudentServiceQuestionToArticle !== convertStudentServiceQuestionToArticle) {
                return window.convertStudentServiceQuestionToArticle.apply(null, arguments);
            }
            ensureStudentServiceQaModule().catch(() => null);
            return null;
        }

        async function mergeStudentServiceQuestionPrompt(questionId) {
            if (hasStudentServiceQaModule()
                && typeof window.mergeStudentServiceQuestionPrompt === 'function'
                && window.mergeStudentServiceQuestionPrompt !== mergeStudentServiceQuestionPrompt) {
                return window.mergeStudentServiceQuestionPrompt.apply(null, arguments);
            }
            ensureStudentServiceQaModule().catch(() => null);
            return null;
        }

        function applyStudentServiceMacro(macroId) {
            const role = getEffectiveUserRole();
            if (![USER_ROLES.ADMIN, USER_ROLES.STUDENT_SERVICE].includes(role)) return;
            const { macros } = ensureStudentServiceStores();
            const macro = macros.find(item => item.id === macroId);
            if (!macro) return;
            const textarea = document.getElementById('student-service-staff-reply');
            if (!textarea) return;
            const existing = textarea.value.trim();
            textarea.value = existing ? `${existing}\n\n${macro.message}` : macro.message;
            textarea.focus();
        }

        async function addStudentServiceInternalNote() {
            if (hasStudentServiceTicketsModule()
                && typeof window.addStudentServiceInternalNote === 'function'
                && window.addStudentServiceInternalNote !== addStudentServiceInternalNote) {
                return window.addStudentServiceInternalNote.apply(null, arguments);
            }
            ensureStudentServiceTicketsModule().catch(() => null);
            return null;
        }

        async function updateStudentServiceHandoff() {
            if (hasStudentServiceTicketsModule()
                && typeof window.updateStudentServiceHandoff === 'function'
                && window.updateStudentServiceHandoff !== updateStudentServiceHandoff) {
                return window.updateStudentServiceHandoff.apply(null, arguments);
            }
            ensureStudentServiceTicketsModule().catch(() => null);
            return null;
        }

        function renderStudentServiceCollapsibleSection(sectionKey, title, content) {
            const ui = ensureStudentServiceUiState();
            const isOpen = Boolean(ui.detailSections?.[sectionKey]);
            return `
                <div class="content-box surface-card student-service-detail-card">
                    <button type="button" class="student-service-detail-toggle" data-student-service-detail-section="${ssEscape(sectionKey)}">
                        <span class="student-service-detail-title">${ssEscape(title)}</span>
                        <span class="student-service-detail-icon">${isOpen ? '&minus;' : '+'}</span>
                    </button>
                    ${isOpen ? `<div class="student-service-detail-body">${content}</div>` : ''}
                </div>
            `;
        }

        function editStudentServiceArticle(articleId) {
            const ui = ensureStudentServiceUiState();
            const nextArticleId = articleId || '';
            if (
                ui.serviceLane === 'service'
                && ui.staffPanel === 'articles'
                && ui.articleEditorId === nextArticleId
                && ui.selectedArticleId === nextArticleId
            ) {
                return;
            }
            ui.serviceLane = 'service';
            ui.staffPanel = 'articles';
            ui.articleDraftMode = false;
            ui.articleEditorId = nextArticleId;
            ui.selectedArticleId = nextArticleId;
            const article = ensureStudentServiceStores().articles.find(item => item.id === nextArticleId);
            if (article?.serviceArea) {
                ui.activeSupportArea = getStudentServiceSupportArea(article.serviceArea).id;
            }
            invalidateStudentServiceRenderSignature();
            renderStudentServicePage();
        }

        async function saveStudentServiceArticle(publish) {
            if (!canShowStudentServiceArticleEditorActions()) return;
            await syncStudentServiceWorkspaceBackendSession();
            if (!canCurrentUserModerateStudentService()) {
                alert('Only Student Service staff can save articles.');
                return;
            }
            const currentUser = getStudentServiceCurrentUser();
            if (!currentUser) return;
            const title = document.getElementById('student-service-article-title')?.value.trim() || '';
            const summary = document.getElementById('student-service-article-summary')?.value.trim() || '';
            const content = document.getElementById('student-service-article-content')?.value.trim() || '';
            if (!title || !summary || !content) {
                alert('Please complete article title, summary, and content.');
                return;
            }
            const ui = ensureStudentServiceUiState();
            const articleId = ui.articleEditorId || `svc-article-${Date.now()}`;
            const supportArea = getStudentServiceSupportArea(resolveStudentServiceArticleServiceAreaId(ui));
            try {
                const payload = await postStudentService(STUDENT_SERVICE_API_PATHS.articlesCreate(), {
                    id: articleId,
                    title,
                    summary,
                    content,
                    serviceArea: supportArea.id,
                    category: supportArea.category,
                    published: Boolean(publish)
                });
                const article = payload?.article || null;
                ui.serviceLane = 'service';
                ui.staffPanel = 'articles';
                ui.articleDraftMode = false;
                ui.articleEditorId = article?.id || articleId;
                ui.selectedArticleId = article?.id || articleId;
                await refreshStudentServiceDataAndRender();
            } catch (error) {
                console.error('Student Service article save failed.', error);
                alert(error?.message || 'Article could not be saved.');
            }
        }

        function startStudentServiceNewArticle() {
            const ui = ensureStudentServiceUiState();
            ui.serviceLane = 'service';
            ui.staffPanel = 'articles';
            ui.articleDraftMode = true;
            ui.articleEditorId = '';
            ui.selectedArticleId = '';
            invalidateStudentServiceRenderSignature();
            renderStudentServicePage();
        }


        function renderStudentServiceLaneSwitcher(selectedLane) {
            if (!selectedLane) return '';
            return `
                <section class="student-service-lane-switcher-shell">
                    <div class="student-service-lane-switcher-copy">
                        <div class="student-service-kicker">Workspace lanes</div>
                        <div class="student-service-zone-copy">Switch between public Q&A and private Student Service without leaving the page.</div>
                    </div>
                    <div class="student-service-lane-switcher" role="group" aria-label="Workspace lanes">
                        <button type="button" class="student-service-lane-switcher-btn ${selectedLane === 'service' ? 'is-active lux-primary-btn' : 'lux-secondary-btn'}" data-student-service-lane="service" aria-pressed="${selectedLane === 'service' ? 'true' : 'false'}"><i class="fas fa-headset"></i> Student Service</button>
                        <button type="button" class="student-service-lane-switcher-btn ${selectedLane === 'qa' ? 'is-active lux-primary-btn' : 'lux-secondary-btn'}" data-student-service-lane="qa" aria-pressed="${selectedLane === 'qa' ? 'true' : 'false'}"><i class="fas fa-comments"></i> Q&A</button>
                        <button type="button" class="student-service-lane-switcher-reset student-service-mini-action" data-student-service-clear-lane="true"><i class="fas fa-border-all"></i> Choose again</button>
                    </div>
                </section>
            `;
        }


        function ensureStudentServicePageShell(container) {
            if (!container) return null;
            let shell = container.querySelector('[data-student-service-page-shell="1"]');
            if (!shell) {
                const range = document.createRange();
                range.selectNodeContents(container);
                container.replaceChildren(range.createContextualFragment(`
                    <div class="student-service-shell" data-student-service-page-shell="1" data-lux-glass-root="1">
                        <div data-student-service-page-hero="1"></div>
                        <div data-student-service-page-switcher="1"></div>
                        <div data-student-service-page-workflow="1"></div>
                        <div data-student-service-page-overview="1"></div>
                        <section id="student-service-page-body" class="student-service-canvas">
                            <div class="student-service-loading-state">
                                <i class="fas fa-spinner fa-spin student-service-loading-icon"></i>
                                Loading Student Service Center...
                            </div>
                        </section>
                    </div>
                `));
                shell = container.querySelector('[data-student-service-page-shell="1"]');
            }
            return {
                hero: shell?.querySelector('[data-student-service-page-hero="1"]') || null,
                switcher: shell?.querySelector('[data-student-service-page-switcher="1"]') || null,
                workflow: shell?.querySelector('[data-student-service-page-workflow="1"]') || null,
                overview: shell?.querySelector('[data-student-service-page-overview="1"]') || null,
                body: shell?.querySelector('#student-service-page-body') || null
            };
        }


        function renderStudentServiceHomeWorkspace() {
            return renderStudentServiceHomeWorkspaceRebuilt();
        }

        function renderStudentServiceStudentView(container, visibleArticles, visibleTickets) {
            return renderStudentServiceStudentViewRebuilt(container, visibleArticles, visibleTickets);
        }

        function renderStudentServiceStaffView(container, visibleArticles, visibleTickets) {
            return renderStudentServiceStaffViewRebuilt(container, visibleArticles, visibleTickets);
        }

        function renderStudentServiceStudentViewRebuilt(container, visibleArticles, visibleTickets) {
            const ui = ensureStudentServiceUiState();
            const lane = getStudentServiceLane();
            if (lane === 'qa') {
                return renderStudentServiceStudentQaHub(container);
            }
            return ui.studentTab === 'my_tickets'
                ? renderStudentServiceMyTicketsHub(container, visibleTickets)
                : renderStudentServiceStudentHub(container, visibleArticles, visibleTickets);
        }

        function renderStudentServiceStaffViewRebuilt(container, visibleArticles, visibleTickets) {
            const role = getEffectiveUserRole();
            const lane = getStudentServiceLane();
            const responderOnly = [USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(role) && !canCurrentUserModerateStudentService();
            if (lane === 'qa') {
                return renderStudentServiceStaffWorkbench(container, visibleArticles, visibleTickets, { lane: 'qa' });
            }
            if (responderOnly) {
                return renderStudentServiceResponderServiceLane(container, visibleArticles);
            }
            return renderStudentServiceStaffWorkbench(container, visibleArticles, visibleTickets, { lane: 'service' });
        }


        function buildStudentServiceBodySignature(role, currentUser, visibleArticles, visibleTickets) {
            const ui = ensureStudentServiceUiState();
            return [
                role,
                String(currentUser?.id || ''),
                getStudentServiceLane(),
                ui.staffPanel || '',
                ui.studentTab || '',
                ui.articleSearch || '',
                ui.ticketSearch || '',
                ui.ticketStatus || '',
                ui.ticketCategory || '',
                ui.ticketServiceArea || '',
                ui.ticketAssignee || '',
                ui.ticketFaculty || '',
                ui.selectedTicketId || '',
                ui.selectedArticleId || '',
                ui.articleEditorId || '',
                ui.articleDraftMode ? '1' : '0',
                ui.qaSearch || '',
                ui.draftQuestion?.askMode || 'public',
                ui.draftQuestion?.anonymousMode ? '1' : '0',
                JSON.stringify(ui.customTicketFilters || {}),
                JSON.stringify(getStudentServicePublishedInboxFilterLayout().filters || []),
                ui.activeSupportArea || '',
                visibleArticles.length,
                buildStudentServiceArticleFingerprint(visibleArticles),
                visibleTickets.length,
                buildStudentServiceQaContentFingerprint(getStudentServiceFilteredQuestions(getStudentServiceVisibleQuestions())),
                STUDENT_SERVICE_RUNTIME.loaded ? 'loaded' : 'loading',
                STUDENT_SERVICE_RUNTIME.loadFailed ? 'failed' : 'ok',
                hasStudentServiceQaModule() ? 'qa-ready' : 'qa-pending',
                hasStudentServiceServiceModule() ? 'service-ready' : 'service-pending'
            ].join('|');
        }

        function buildStudentServiceRenderSignature(role, currentUser, visibleArticles, visibleTickets) {
            return [
                buildStudentServiceChromeSignature(role, currentUser, visibleArticles, visibleTickets),
                buildStudentServiceBodySignature(role, currentUser, visibleArticles, visibleTickets)
            ].join('::');
        }

        function ensureStudentServiceDefaultLaneForStaff(role) {
            if (!STUDENT_SERVICE_LANES.includes(getStudentServiceLane())
                && [USER_ROLES.ADMIN, USER_ROLES.STUDENT_SERVICE, USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(role)) {
                const ui = ensureStudentServiceUiState();
                ui.serviceLane = 'service';
                if ([USER_ROLES.ADMIN, USER_ROLES.STUDENT_SERVICE].includes(role)) {
                    ui.staffPanel = 'tickets';
                }
                writeStudentServiceStoredLane('service');
            }
        }

        function renderStudentServicePage() {
            const container = document.getElementById('page-student-service');
            if (!container) return;
            if (typeof window.preloadStudentServiceWorkspaceModules === 'function') {
                window.preloadStudentServiceWorkspaceModules();
            }
            ensureStudentServiceStores();
            if (shouldBootstrapStudentServiceWorkspace() && !STUDENT_SERVICE_RUNTIME.loaded && !STUDENT_SERVICE_RUNTIME.bootstrapPromise && typeof kiuPortalFetch === 'function') {
                scheduleStudentServiceBootstrap();
            }
            const role = getEffectiveUserRole();
            ensureStudentServiceDefaultLaneForStaff(role);
            writeStudentServiceStoredLane(getStudentServiceLane());
            const visibleArticles = getStudentServiceVisibleArticles();
            const visibleTickets = getStudentServiceVisibleTickets();
            const currentUser = getStudentServiceCurrentUser();
            const chromeSignature = buildStudentServiceChromeSignature(role, currentUser, visibleArticles, visibleTickets);
            const bodySignature = buildStudentServiceBodySignature(role, currentUser, visibleArticles, visibleTickets);
            const renderSignature = `${chromeSignature}::${bodySignature}`;
            if (container.dataset.studentServiceRenderSignature === renderSignature) {
                if (isStudentServiceQaBodyStale()) {
                    delete container.dataset.studentServiceRenderSignature;
                } else {
                    scheduleStudentServiceThreadRelayout();
                    return;
                }
            }
            const scrollAnchors = captureStudentServiceScrollAnchors();
            if (container.dataset.studentServiceChromeSignature !== chromeSignature) {
                renderStudentServicePageChromeRebuilt(role, currentUser, visibleArticles, visibleTickets);
                renderStudentServiceHomeWorkspace();
                container.dataset.studentServiceChromeSignature = chromeSignature;
            }
            const bodyContainer = document.getElementById('student-service-page-body');
            const selectedLane = getStudentServiceLane();
            if (!selectedLane) {
                if (bodyContainer) {
                    setStudentServiceMarkup(
                        bodyContainer,
                        `student-service-page-body:lane-chooser:${role}:${getCurrentUserId() || 'anonymous'}:${visibleArticles.length}:${visibleTickets.length}`,
                        renderStudentServiceLaneChooser(role, currentUser, visibleArticles, visibleTickets)
                    );
                }
                container.dataset.studentServiceRenderSignature = renderSignature;
                restoreStudentServiceScrollAnchors(scrollAnchors);
                restoreStudentServiceOpenQuestionFromUi();
                return;
            }
            if (role === USER_ROLES.STUDENT) {
                const ui = ensureStudentServiceUiState();
                if (shouldDeferStudentServiceStudentHubUntilBootstrap(role, ui)) {
                    if (bodyContainer) {
                        setStudentServiceMarkup(
                            bodyContainer,
                            'student-service-page-body:bootstrap-loading',
                            renderStudentServiceBootstrapLoadingShell()
                        );
                    }
                } else {
                    renderStudentServiceStudentView(bodyContainer || container, visibleArticles, visibleTickets);
                }
                container.dataset.studentServiceRenderSignature = renderSignature;
                restoreStudentServiceScrollAnchors(scrollAnchors);
                restoreStudentServiceOpenQuestionFromUi();
                scrollStudentServiceTicketChatLog();
                return;
            }
            if ([USER_ROLES.ADMIN, USER_ROLES.STUDENT_SERVICE, USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(role)) {
                renderStudentServiceStaffViewRebuilt(bodyContainer || container, visibleArticles, visibleTickets);
                container.dataset.studentServiceRenderSignature = renderSignature;
                restoreStudentServiceScrollAnchors(scrollAnchors);
                restoreStudentServiceOpenQuestionFromUi();
                scrollStudentServiceTicketChatLog();
                return;
            }
            if (bodyContainer) {
                setStudentServiceMarkup(
                    bodyContainer,
                    'student-service-page-body:unavailable',
                    `
                        <div class="student-service-empty-state student-service-empty-state-large">
                            <div class="student-service-empty-title">Student Service Center</div>
                            <div class="student-service-empty-copy">This workspace is available to students, Student Service staff, and administrators.</div>
                        </div>
                    `
                );
            }
            container.dataset.studentServiceRenderSignature = renderSignature;
            restoreStudentServiceScrollAnchors(scrollAnchors);
            restoreStudentServiceOpenQuestionFromUi();
        }

        function isStudentServiceWorkspaceVisible() {
            if (typeof getActivePageId === 'function' && getActivePageId() === 'student-service') return true;
            const page = document.getElementById('page-student-service');
            if (!page) return false;
            return page.classList.contains('active-page') || page.style.display !== 'none';
        }

        function shouldBootstrapStudentServiceWorkspace() {
            if (document.body?.classList?.contains('lux-route-student-service')) return true;
            return isStudentServiceWorkspaceVisible();
        }

        function handleStudentServiceQaThreadClick(event) {
            if (hasStudentServiceQaModule()
                && typeof window.handleStudentServiceQaThreadClick === 'function'
                && window.handleStudentServiceQaThreadClick !== handleStudentServiceQaThreadClick) {
                return window.handleStudentServiceQaThreadClick.apply(null, arguments);
            }
            ensureStudentServiceQaModule().catch(() => null);
            return;
        }

        /* Delegated interactions: student-service-events.js */



        async function bootstrapStudentServicePage() {
            if (!document.getElementById('page-student-service')) return;
            if (typeof getEffectiveUserRole !== 'function' || typeof USER_ROLES === 'undefined') {
                window.setTimeout(bootstrapStudentServicePage, 30);
                return;
            }
            try {
                if (typeof pinStudentServiceWorkspaceRole === 'function') {
                    pinStudentServiceWorkspaceRole({ refreshChrome: true });
                }
                await syncStudentServiceWorkspaceBackendSession();
                if (typeof scheduleKiuRealtimeBootstrap === 'function') {
                    scheduleKiuRealtimeBootstrap();
                }
                bindStudentServiceRealtimeRefreshListener();
                bindStudentServiceDelegatedInteractions();
                renderStudentServicePage();
                if (shouldBootstrapStudentServiceWorkspace()) {
                    if (typeof markPortalShellReady === 'function') {
                        markPortalShellReady();
                    } else if (typeof window.__kiuStartShellReveal === 'function') {
                        window.__kiuStartShellReveal({ degraded: true });
                    } else {
                        document.documentElement.classList.remove('kiu-shell-loading');
                        document.body?.classList.remove('kiu-shell-loading');
                    }
                }
            } catch (error) {
                console.error('Student Service bootstrap failed.', error);
            }
        }

        __kiuSspExpose({
            renderStudentServicePage,
            renderStudentServiceAttachmentPickerMarkup,
            renderStudentServiceAttachmentGalleryMarkup,
            getStudentServiceAnswerComposerId,
            openStudentServiceGuidanceModal,
            closeStudentServiceGuidanceModal,
            fetchStudentServiceBootstrap: window.fetchStudentServiceBootstrap,
            applyStudentServiceBootstrap: window.applyStudentServiceBootstrap,
            preloadStudentServiceWorkspaceModules: window.preloadStudentServiceWorkspaceModules,
        });
        window.__kiuRelayoutStudentServiceCommentTrunks = relayoutStudentServiceCommentTrunks;
        __kiuSspExpose({
            getStudentServiceEffectiveInboxFilterLayout,
            getStudentServicePublicInboxFilterLayout,
            invalidateStudentServiceRenderSignature,
            pickStudentHubFeaturedArticle,
            resolveStudentHubArticle,
            getStudentServiceFilteredStaffTickets,
            getStudentServiceFilteredStudentTickets,
            buildStudentServiceStudentInboxFilterLayout,
            renderStudentServiceStudentInboxFiltersMarkup,
            ssFormatRelativeTime,
            renderStudentServiceInboxFiltersMarkup,
            renderStudentServiceInboxDropdownFiltersMarkup,
            renderStudentServiceStaffPanelSwitchMarkup,
        });

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', bootstrapStudentServicePage);
        } else {
            bootstrapStudentServicePage();
        }


        const api = {
            deleteStudentServiceArticle,
            deleteStudentServiceQuestion,
            deleteStudentServiceQuestionAnswer,
            publishStudentServiceQuestion,
            toggleStudentServiceQuestionFlag,
            convertStudentServiceQuestionToTicket,
            convertStudentServiceQuestionToArticle,
            mergeStudentServiceQuestionPrompt,
            applyStudentServiceMacro,
            addStudentServiceInternalNote,
            updateStudentServiceHandoff,
            renderStudentServiceCollapsibleSection,
            editStudentServiceArticle,
            saveStudentServiceArticle,
            startStudentServiceNewArticle,
            renderStudentServiceLaneSwitcher,
            ensureStudentServicePageShell,
            renderStudentServiceHomeWorkspace,
            renderStudentServiceStudentView,
            renderStudentServiceStaffView,
            renderStudentServiceStudentViewRebuilt,
            renderStudentServiceStaffViewRebuilt,
            buildStudentServiceBodySignature,
            buildStudentServiceRenderSignature,
            ensureStudentServiceDefaultLaneForStaff,
            renderStudentServicePage,
            isStudentServiceWorkspaceVisible,
            shouldBootstrapStudentServiceWorkspace,
            handleStudentServiceQaThreadClick,
            bootstrapStudentServicePage
        };
        Object.assign(window, api);
        return api;
    };
})();
