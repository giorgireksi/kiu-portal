/* Social page entity/compose + panel/shell helpers.
 * Peeled from social-page.js. Load before social-page.js on social.html.
 */
(function initSocialPageFeedRuntime() {
    'use strict';
    if (window.__KIU_SOCIAL_PAGE_FEED_LOADED) return;
    window.__KIU_SOCIAL_PAGE_FEED_LOADED = true;
    window.__kiuCreateSocialPageFeedApi = function createKiuSocialPageFeedApi(deps = {}) {
        const d = deps;
        function __dep(name) {
            return function (...a) {
                const fn = d[name] || window[name];
                if (typeof fn !== 'function') throw new Error('Missing social feed dep: ' + name);
                return fn.apply(this, a);
            };
        }
        const accountSubtitle = __dep('accountSubtitle');
        const activeDialog = __dep('activeDialog');
        const activeNavPanels = __dep('activeNavPanels');
        const avatar = __dep('avatar');
        const buildProjectCreateContext = __dep('buildProjectCreateContext');
        const buildProjectHealthPlanPickModel = __dep('buildProjectHealthPlanPickModel');
        const clearProjectTabPaneCache = __dep('clearProjectTabPaneCache');
        const clearSurveyFlowState = __dep('clearSurveyFlowState');
        const createSocialLazyStub = __dep('createSocialLazyStub');
        const currentUser = __dep('currentUser');
        const currentUserId = __dep('currentUserId');
        const displayName = __dep('displayName');
        const ensureSocialAlertsModule = __dep('ensureSocialAlertsModule');
        const ensureSocialCommunityModule = __dep('ensureSocialCommunityModule');
        const ensureSocialEventsModule = __dep('ensureSocialEventsModule');
        const ensureSocialFeedModule = __dep('ensureSocialFeedModule');
        const ensureSocialGroupsModule = __dep('ensureSocialGroupsModule');
        const ensureSocialLostFoundModule = __dep('ensureSocialLostFoundModule');
        const ensureSocialMessagesModule = __dep('ensureSocialMessagesModule');
        const ensureSocialPagesModule = __dep('ensureSocialPagesModule');
        const ensureSocialPhotographyModule = __dep('ensureSocialPhotographyModule');
        const ensureSocialProfileModule = __dep('ensureSocialProfileModule');
        const ensureSocialSurveysModule = __dep('ensureSocialSurveysModule');
        const ensureSocialWorkspaceModule = __dep('ensureSocialWorkspaceModule');
        const escape = __dep('escape');
        const feedScopeOptions = __dep('feedScopeOptions');
        const find = __dep('find');
        const hasSocialAlertsModule = __dep('hasSocialAlertsModule');
        const hasSocialCommunityModule = __dep('hasSocialCommunityModule');
        const hasSocialEventsModule = __dep('hasSocialEventsModule');
        const hasSocialFeedModule = __dep('hasSocialFeedModule');
        const hasSocialGroupsModule = __dep('hasSocialGroupsModule');
        const hasSocialLostFoundModule = __dep('hasSocialLostFoundModule');
        const hasSocialMessagesModule = __dep('hasSocialMessagesModule');
        const hasSocialPagesModule = __dep('hasSocialPagesModule');
        const hasSocialPhotographyModule = __dep('hasSocialPhotographyModule');
        const hasSocialSurveysModule = __dep('hasSocialSurveysModule');
        const hasSocialWorkspaceModule = __dep('hasSocialWorkspaceModule');
        const markup = __dep('markup');
        const normalizeComposerEntityLinks = __dep('normalizeComposerEntityLinks');
        const normalizeProjectTaskStatusId = __dep('normalizeProjectTaskStatusId');
        const openDialog = __dep('openDialog');
        const photographyPosts = __dep('photographyPosts');
        const portfolioEntriesForViewer = __dep('portfolioEntriesForViewer');
        const postEntityLinks = __dep('postEntityLinks');
        const queueDeferredModuleRender = __dep('queueDeferredModuleRender');
        const renderFileChip = __dep('renderFileChip');
        const renderProjectHealthPlanCardHtml = __dep('renderProjectHealthPlanCardHtml');
        const renderProjectHealthPlanPickBodyHtml = __dep('renderProjectHealthPlanPickBodyHtml');
        const renderSocialPageNow = __dep('renderSocialPageNow');
        const resolve = __dep('resolve');
        const resolveEntityLinkMeta = __dep('resolveEntityLinkMeta');
        const root = __dep('root');
        const setPanel = __dep('setPanel');
        const state = __dep('state');
        const text = __dep('text');
        const PANEL_KEY = d.PANEL_KEY ?? window.PANEL_KEY;
        const WORKSPACE_NAV_COLLAPSED_KEY = d.WORKSPACE_NAV_COLLAPSED_KEY ?? window.WORKSPACE_NAV_COLLAPSED_KEY;
        function navigateToEntity(type, id) {
            if (!type || !id) return;
            if (type === 'group') {
                setPanel('groups');
                if (findSocialGroupById(id)) return openDialog('group-detail', { groupId: id });
                state().ui.groupsTab = 'joined';
                return renderSocialPageNow('panel-groups');
            }
            if (type === 'project') {
                state().ui.activeProjectId = id;
                state().ui.projectTab = 'overview';
                clearProjectTabPaneCache(id);
                state().ui.activePanel = 'workspace';
                state().ui.shellDrawerOpen = false;
                try { localStorage.setItem(PANEL_KEY, 'workspace'); } catch (error) {}
                return renderSocialPageNow('project-open');
            }
            if (type === 'portfolio') {
                const entry = portfolioEntriesForViewer().find((item) => text(item?.id) === id);
                const userId = text(entry?.userId || entry?.ownerUserId || id);
                if (userId === currentUserId()) {
                    setPanel('projects');
                    state().ui.portfolioPanelTab = 'mine';
                    return renderSocialPageNow('profile-portfolio-open');
                }
                state().ui.activePortfolioUserId = userId;
                setPanel('projects');
                state().ui.portfolioPanelTab = 'discover';
                return renderSocialPageNow('portfolio-doc-open');
            }
            if (type === 'page') {
                state().ui.activePageProfileId = id;
                setPanel('pages');
                return renderSocialPageNow('page-open-profile');
            }
            if (type === 'event') {
                state().ui.focusEventId = id;
                setPanel('events');
                return renderSocialPageNow('panel-events');
            }
            if (type === 'survey') {
                const runtime = state();
                runtime.ui.surveyTakingId = id;
                runtime.ui.surveyResultsId = '';
                runtime.ui.surveyResultsPayload = null;
                clearSurveyFlowState(runtime, { keepTakingId: true });
                setPanel('surveys');
                return renderSocialPageNow('survey-take-open');
            }
            if (type === 'photo') {
                setPanel('photography');
                state().ui.photographyFocusPostId = id;
                return renderSocialPageNow('panel-photography');
            }
            if (type === 'lost-found') {
                setPanel('lost-and-found');
                state().ui.lostFoundFocusId = id;
                return renderSocialPageNow('panel-lost-and-found');
            }
        }
        function entityDetailEntity(type, id) {
            const s = state().social || {};
            const find = (arr) => (Array.isArray(arr) ? arr : []).find((x) => text(x?.id) === id);
            if (type === 'project') return find(s.projects);
            if (type === 'portfolio') return portfolioEntriesForViewer().find((x) => text(x?.id) === id);
            if (type === 'page') return find(s.pages);
            if (type === 'event') return find(s.events);
            if (type === 'survey') return find(s.surveys);
            if (type === 'photo') return photographyPosts().find((x) => text(x?.id) === id);
            if (type === 'lost-found') return find(s.lostFoundItems);
            if (type === 'group') return find(s.groups);
            return null;
        }
        function entityDetailDescription(type, id) {
            const e = entityDetailEntity(type, id);
            if (!e) return '';
            return text(e.summary || e.description || e.tagline || e.about || e.body || e.headline || e.locationText || e.location || '').slice(0, 600);
        }
        // ponytail: one enriched popup for every entity type; per-type stat rows instead of 7 bespoke modals.
        const entityDetailStats = window.entityDetailStats || (window.KiuSocialFormModel || {}).entityDetailStats;
        function renderEntityDetailDialog(runtime, dialog = activeDialog()) {
            const type = text(dialog?.entityType || '').toLowerCase();
            const id = text(dialog?.entityId || '');
            const meta = resolveEntityLinkMeta({ type, id });
            const entity = entityDetailEntity(type, id);
            const desc = entityDetailDescription(type, id) || 'No additional details available.';
            const stats = entityDetailStats(type, entity)
                .filter(([, value]) => value !== undefined && value !== null && text(String(value)) !== '')
                .map(([k, value]) => `<div class="social-neo-item-line"><span>${escape(k)}</span><strong>${escape(String(value))}</strong></div>`)
                .join('');
            const tags = (Array.isArray(entity?.skillTags) && entity.skillTags.length ? entity.skillTags
                : (Array.isArray(entity?.hashtags) ? entity.hashtags : (Array.isArray(entity?.tags) ? entity.tags : [])))
                .slice(0, 8);
            const tagsHtml = tags.length
                ? `<div class="social-neo-badge-row">${tags.map((tag) => `<span class="social-neo-pill">${escape(text(tag))}</span>`).join('')}</div>`
                : '';
            return `<div class="lux-glass-dialog-backdrop" data-action="dialog-close" role="dialog" aria-modal="true" aria-label="${escape(meta.title)}">
                <div class="lux-glass-dialog-card lux-glass-dialog-card--form lux-glass-dialog-card--group-detail lux-glass-dialog-card--social-glass" data-action="noop" data-lux-transparency-exempt="1">
                    <div class="lux-glass-dialog-section-head lux-glass-dialog-head social-neo-group-detail-head">
                        <div class="social-neo-group-detail-identity">
                            <div class="social-neo-group-card-icon social-neo-group-card-avatar social-neo-group-detail-avatar"><i class="fas ${escape(meta.icon)}"></i></div>
                            <div class="lux-glass-dialog-heading">
                                <strong class="lux-glass-dialog-title">${escape(meta.title)}</strong>
                                <span class="lux-glass-dialog-subtitle social-neo-group-detail-meta">
                                    <span class="social-neo-pill">${escape(meta.sectionLabel)}</span>
                                    <span>${escape(meta.subtitle)}</span>
                                </span>
                            </div>
                        </div>
                        <button class="lux-ghost-btn lux-glass-dialog-close-btn" type="button" data-action="dialog-close" aria-label="Close"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="lux-glass-dialog-body lux-glass-dialog-body--group-detail">
                        <section class="lux-glass-dialog-group-section social-neo-group-detail-section">
                            <div class="lux-glass-dialog-group-section-head">
                                <strong>About</strong>
                                <span>${escape(meta.sectionLabel)} description.</span>
                            </div>
                            <p class="social-neo-group-detail-desc">${escape(desc)}</p>
                            ${tagsHtml}
                        </section>
                        ${stats ? `
                        <section class="lux-glass-dialog-group-section social-neo-group-detail-section">
                            <div class="lux-glass-dialog-group-section-head">
                                <strong>Details</strong>
                                <span>Key facts about this ${escape(meta.sectionLabel.toLowerCase())}.</span>
                            </div>
                            <div class="social-neo-list social-neo-group-detail-list">${stats}</div>
                        </section>` : ''}
                    </div>
                    <div class="lux-glass-dialog-form-actions lux-glass-dialog-actions social-neo-group-detail-actions">
                        <button class="lux-primary-btn" type="button" data-action="entity-goto" data-entity-type="${escape(type)}" data-entity-id="${escape(id)}"><i class="fas fa-arrow-right"></i> Open full view</button>
                        <button class="lux-secondary-btn lux-glass-dialog-cancel-btn" type="button" data-action="dialog-close">Close</button>
                    </div>
                </div>
            </div>`;
        }
        const isMineAttachableEntity = window.isMineAttachableEntity || (window.KiuSocialEntityModel || {}).isMineAttachableEntity;
        const listAttachableEntities = window.listAttachableEntities || (window.KiuSocialEntityModel || {}).listAttachableEntities;
        function renderComposerEntityChips(links = []) {
            const normalized = normalizeComposerEntityLinks(links);
            if (!normalized.length) return '';
            return `
                <div class="social-neo-post-compose-chips">
                    ${normalized.map((link) => {
                        const meta = resolveEntityLinkMeta(link);
                        return `
                            <div class="social-neo-post-compose-chip">
                                <i class="fas ${escape(meta.icon)}" aria-hidden="true"></i>
                                <span><strong>${escape(meta.title)}</strong> · ${escape(meta.sectionLabel)}</span>
                                <button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="post-compose-entity-remove" data-entity-type="${escape(meta.type)}" data-entity-id="${escape(meta.id)}" aria-label="Remove attachment">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }
        function renderPostEntityLinks(post) {
            const links = postEntityLinks(post);
            if (!links.length) return '';
            return `
                <div class="social-neo-post-entity-links">
                    ${links.map((link) => {
                        const meta = resolveEntityLinkMeta(link);
                        const surveyExtra = meta.type === 'survey'
                            ? `<button class="lux-primary-btn lux-secondary-btn-sm" type="button" data-action="survey-take-open" data-survey-id="${escape(meta.id)}"><i class="fas fa-play"></i> Take survey</button>`
                            : `<button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="entity-link-open" data-entity-type="${escape(meta.type)}" data-entity-id="${escape(meta.id)}">Open <i class="fas fa-arrow-right"></i></button>`;
                        return `
                            <article class="social-neo-post-entity-card">
                                <div class="social-neo-post-entity-card-copy">
                                    <span class="social-neo-pill"><i class="fas ${escape(meta.icon)}"></i> ${escape(meta.sectionLabel)}</span>
                                    <strong>${escape(meta.title)}</strong>
                                    <span class="social-neo-muted">${escape(meta.subtitle)}</span>
                                </div>
                                ${surveyExtra}
                            </article>
                        `;
                    }).join('')}
                </div>
            `;
        }
        function clearPostComposeDraft(runtime = state()) {
            const ui = runtime.ui || (runtime.ui = {});
            ui.composerText = '';
            ui.composerFile = null;
            ui.composerEntityLinks = [];
            ui.postComposeAttachSection = 'survey';
            ui.postComposeAttachFilter = 'mine';
            ui.postComposeAttachSearch = '';
        }
        const renderPostComposeShareSection = createSocialLazyStub('renderPostComposeShareSection', hasSocialFeedModule, ensureSocialFeedModule, '', null);
        const renderPostComposeAttachResultsHtml = createSocialLazyStub('renderPostComposeAttachResultsHtml', hasSocialFeedModule, ensureSocialFeedModule, '', null);
        function patchPostComposeAttachDialog(runtime = state()) {
            if (text(activeDialog()?.type || '') !== 'post-compose-attach') return false;
            const card = document.querySelector('.lux-glass-dialog-card--post-compose-attach');
            if (!card) return false;
            const filter = text(runtime.ui?.postComposeAttachFilter || 'mine') || 'mine';
            const list = card.querySelector('.social-neo-post-compose-attach-results');
            if (list) list.innerHTML = renderPostComposeAttachResultsHtml(runtime);
            card.querySelectorAll('[data-action="post-compose-attach-filter"]').forEach((btn) => {
                const isActive = text(btn.getAttribute('data-filter') || '') === filter;
                btn.classList.toggle('lux-primary-btn', isActive);
                btn.classList.toggle('lux-secondary-btn', !isActive);
            });
            const count = normalizeComposerEntityLinks(runtime.ui?.composerEntityLinks).length;
            const done = card.querySelector('.social-neo-post-compose-attach-done');
            if (done) {
                const badge = count
                    ? `<span class="lux-glass-dialog-submit-badge">${escape(String(count))}</span>`
                    : '';
                done.innerHTML = `<i class="fas fa-check"></i> Done${badge}`;
            }
            const meta = card.querySelector('.social-neo-post-compose-attach-count');
            if (meta) {
                const section = text(runtime.ui?.postComposeAttachSection || 'survey') || 'survey';
                const search = text(runtime.ui?.postComposeAttachSearch || '');
                const rows = listAttachableEntities(section, filter, search);
                meta.textContent = `${rows.length} available · ${count} attached`;
            }
            return true;
        }
        function renderPostComposeAttachDialog(runtime, dialog = activeDialog()) {
            if (hasSocialFeedModule() && typeof window.renderPostComposeAttachDialog === 'function') {
                return window.renderPostComposeAttachDialog(runtime, dialog);
            }
            ensureSocialFeedModule().catch(() => null);
            return '';
        }
        function patchPostComposeDialog(runtime = state()) {
            if (text(activeDialog()?.type || '') !== 'post-compose') return false;
            const form = document.querySelector('form[data-form="post-compose"].lux-glass-dialog-card--post-compose');
            if (!form) return false;
            const invite = form.querySelector('.lux-glass-dialog-group-section--invite');
            if (!invite) return false;
            const wrap = document.createElement('div');
            wrap.innerHTML = renderPostComposeShareSection(runtime).trim();
            const nextInvite = wrap.firstElementChild;
            if (!nextInvite) return false;
            invite.replaceWith(nextInvite);
            const entityLinks = normalizeComposerEntityLinks(runtime.ui?.composerEntityLinks);
            const submit = form.querySelector('.lux-glass-dialog-submit-btn');
            if (submit) {
                const badge = entityLinks.length
                    ? `<span class="lux-glass-dialog-submit-badge">${escape(String(entityLinks.length))}</span>`
                    : '';
                submit.innerHTML = `<i class="fas fa-paper-plane"></i> Publish${badge}`;
            }
            const fileHost = form.querySelector('.social-neo-post-compose-file-host');
            if (fileHost) fileHost.innerHTML = renderFileChip(runtime.ui?.composerFile);
            return true;
        }
        const renderPostComposeDialog = createSocialLazyStub('renderPostComposeDialog', hasSocialFeedModule, ensureSocialFeedModule, '', null);
        const renderPost = createSocialLazyStub('renderPost', hasSocialFeedModule, ensureSocialFeedModule, '', () => queueDeferredModuleRender('feed-module'));
        function renderSocialLuxHero(options = {}) {
            const {
                sectionClasses = 'social-neo-card',
                heroFamily = 'social-neo-panel-hero',
                kicker = '',
                kickerIcon = '',
                title = '',
                copy = '',
                actionsHtml = '',
                stats = [],
                bodyHtml = '',
                extraHtml = '',
            } = options;
            const family = text(heroFamily) || 'social-neo-panel-hero';
            // asd10-aligned hero markup (CSS Isolation owns glass)
            const kickerMarkup = kicker
                ? `<div class="social-neo-section-kicker">${kickerIcon ? `<i class="fas ${escape(kickerIcon)}" aria-hidden="true"></i> ` : ''}${escape(kicker)}</div>`
                : '';
            const titleMarkup = title ? `<h2 class="social-neo-section-title">${escape(title)}</h2>` : '';
            const copyMarkup = copy ? `<p class="social-neo-section-copy social-neo-muted">${escape(copy)}</p>` : '';
            const statsList = Array.isArray(stats) ? stats : [];
            const statsMarkup = statsList.length
                ? `<div class="${escape(family)}-stats">${statsList.map((stat) => {
                    const icon = text(stat?.icon) ? `<i class="fas ${escape(stat.icon)}" aria-hidden="true"></i>` : '';
                    const isEvents = family === 'social-neo-events-hero';
                    const statClass = isEvents
                        ? `${escape(family)}-stat social-neo-events-hero-stat lux-strip-card surface-card`
                        : `${escape(family)}-stat`;
                    return `<article class="${statClass}">
                        ${icon && isEvents ? `<span class="${escape(family)}-stat-icon">${icon}</span>` : ''}
                        <strong>${escape(stat?.value ?? '')}</strong>
                        <span>${escape(stat?.label ?? '')}</span>
                    </article>`;
                }).join('')}</div>`
                : '';
            const headMarkup = (kickerMarkup || titleMarkup || copyMarkup || actionsHtml)
                ? `<div class="${escape(family)}-head">
                    <div class="${escape(family)}-copy">
                        ${kickerMarkup}
                        ${titleMarkup}
                        ${copyMarkup}
                    </div>
                    ${actionsHtml ? `<div class="${escape(family)}-actions">${actionsHtml}</div>` : ''}
                </div>`
                : '';
            return `
                <section class="${sectionClasses}">
                    ${headMarkup}
                    ${statsMarkup}
                    ${extraHtml || ''}
                    ${bodyHtml || ''}
                </section>
            `;
        }
        let socialVisualShellSynced = false;
        function syncSocialVisualShell() {
            if (typeof window.updateTransparency !== 'function') return;
            const saved = parseInt(localStorage.getItem('kiuLuxurySurfaceTransparency') || '13', 10);
            if (!Number.isNaN(saved)) {
                window.updateTransparency(saved, { persist: false });
            }
        }
        /**
         * Renders the Feed hero card — the banner at the top of the Home panel.
         * Contains: kicker/headline, stat counters, filter tabs, feed scope selector, and quick-tip hints.
         * @param {Object}   runtime      - Current runtime state.
         * @param {string}   activeFilter  - Active tab id ('all'|'following'|'groups'|'pages'|'campus').
         * @param {Object}   metrics       - Counters: { following, joinedGroups }.
         * @param {Array}    scopeOptions  - Feed scope dropdown options (from `feedScopeOptions()`).
         * @param {string}   feedScopeId   - DOM id for the feed scope `<select>`.
         * @returns {string} HTML `<div class="social-neo-feed-hero">` zone markup.
         */
        /**
         * Renders the entire Home / Feed panel.
         * Layout: feed-shell wrapper → merged header card (hero + stories + composer) → post stack.
         *
         * This is the default panel — shown when `activePanel` is 'feed' or unrecognised.
         * @returns {string} HTML for the `social-neo-center` region.
         */
        const renderEventsHero = createSocialLazyStub('renderEventsHero', hasSocialEventsModule, ensureSocialEventsModule, '', () => queueDeferredModuleRender('events-module'));
        const renderEventsPanel = createSocialLazyStub('renderEventsPanel', hasSocialEventsModule, ensureSocialEventsModule, '', () => queueDeferredModuleRender('events-module'));
        const renderGroupsHero = createSocialLazyStub('renderGroupsHero', hasSocialGroupsModule, ensureSocialGroupsModule, '', () => queueDeferredModuleRender('groups-module'));
        const renderFeedHero = createSocialLazyStub('renderFeedHero', hasSocialFeedModule, ensureSocialFeedModule, '', null);
        const renderFeedPanel = createSocialLazyStub('renderFeedPanel', hasSocialFeedModule, ensureSocialFeedModule, '', () => queueDeferredModuleRender('feed-module'));
        const renderRelationshipActions = createSocialLazyStub('renderRelationshipActions', hasSocialGroupsModule, ensureSocialGroupsModule, '', () => queueDeferredModuleRender('groups-module'));
        function renderCommunityPanel() {
            if (hasSocialCommunityModule()) return window.renderCommunityPanel();
            ensureSocialCommunityModule().then(() => queueDeferredModuleRender('community-module')).catch(() => null);
            return '<div class="social-neo-stack social-neo-module-loading" aria-busy="true"></div>';
        }
        /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
           GROUPS PANEL - Facebook-style group discovery & management
           â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
        function resolveWorkspacePanelExport(name) {
            const sw = window.KiuSocialWorkspace;
            return sw && typeof sw[name] === 'function' ? sw[name] : null;
        }
        function renderProjectsWorkspacePanelClassic() {
            const impl = resolveWorkspacePanelExport('renderProjectsWorkspacePanelClassic');
            if (typeof impl === 'function' && impl !== renderProjectsWorkspacePanelClassic) {
                return impl();
            }
            ensureSocialWorkspaceModule().then(() => queueDeferredModuleRender('workspace-module')).catch(() => null);
            return `
                <section class="social-neo-card">
                    <div class="social-neo-empty-hero">
                        <i class="fas fa-diagram-project"></i>
                        <strong>Loading Projects</strong>
                        <span>Preparing workspaces and delivery tools.</span>
                    </div>
                </section>
            `;
        }
        function renderLostFoundPanel() {
            if (hasSocialLostFoundModule()) return window.renderLostFoundPanel();
            ensureSocialLostFoundModule().then(() => queueDeferredModuleRender('lost-found-module')).catch(() => null);
            return '<div class="social-neo-stack social-neo-module-loading" aria-busy="true"></div>';
        }
        function renderSurveysPanel() {
            if (hasSocialSurveysModule()) return window.renderSurveysPanel();
            ensureSocialSurveysModule().then(() => queueDeferredModuleRender('surveys-module')).catch(() => null);
            return '<div class="social-neo-stack social-neo-module-loading" aria-busy="true"></div>';
        }
        function renderPhotographyPanel() {
            if (hasSocialPhotographyModule()) return window.renderPhotographyPanel();
            ensureSocialPhotographyModule().then(() => queueDeferredModuleRender('photography-module')).catch(() => null);
            return '<div class="social-neo-stack social-neo-module-loading" aria-busy="true"></div>';
        }
        function renderMessagesPanel() {
            if (hasSocialMessagesModule()) return window.renderMessagesPanel();
            ensureSocialMessagesModule().then(() => queueDeferredModuleRender('messages-module')).catch(() => null);
            return '<div class="social-neo-stack social-neo-module-loading" aria-busy="true"></div>';
        }
        const renderPortfolioHero = createSocialLazyStub('renderPortfolioHero', hasSocialWorkspaceModule, ensureSocialWorkspaceModule, '', null);
        function renderCommunityHero(runtime, activeTab, metrics = {}, bodyHtml = '', options = {}) {
            const profiles = Number(metrics.profiles || 0);
            const requests = Number(metrics.requests || 0);
            const connections = Number(metrics.connections || 0);
            const staff = Number(metrics.staff || 0);
            const stats = [
                { label: 'Profiles', value: profiles },
                { label: 'Requests', value: requests },
                { label: 'Connections', value: connections },
                { label: 'Staff', value: staff },
            ];
            const tabs = [
                { tab: 'people', label: 'People', icon: 'fa-user-group', helper: 'Browse campus directory' },
                { tab: 'requests', label: 'Requests', icon: 'fa-user-check', helper: 'Pending invites' },
                { tab: 'connections', label: 'Connections', icon: 'fa-handshake', helper: 'Your network' },
                { tab: 'staff', label: 'Staff', icon: 'fa-chalkboard-user', helper: 'Faculty and staff' },
            ];
            const merged = Boolean(bodyHtml);
            const panelClass = text(options.panelClass || '');
            const sectionClasses = [
                'social-neo-card',
                'social-neo-community-hero',
                'social-neo-community-panel',
                'social-neo-community-panel--hero',
                merged ? 'is-merged' : '',
                panelClass
            ].filter(Boolean).join(' ');
            return `
                <section class="${sectionClasses}">
                    <div class="social-neo-community-hero-head">
                        <div class="social-neo-community-hero-copy">
                            <span class="social-neo-section-kicker">Campus directory</span>
                            <h2>People, connections, and staff</h2>
                            <p>Browse profiles, manage requests, and find faculty.</p>
                        </div>
                        <div class="social-neo-community-hero-actions">
                            <button class="lux-secondary-btn" type="button" data-action="panel-community" data-community-tab="requests" aria-pressed="${activeTab === 'requests' ? 'true' : 'false'}">
                                <i class="fas fa-user-check"></i> View requests
                            </button>
                        </div>
                    </div>
                    <div class="social-neo-community-hero-stats">
                        ${stats.map((stat) => `
                            <article class="social-neo-community-hero-stat social-neo-events-hero-stat lux-strip-card surface-card">
                                <strong>${escape(String(stat.value))}</strong>
                                <span>${escape(stat.label)}</span>
                            </article>
                        `).join('')}
                    </div>
                    <div class="social-neo-community-hero-grid">
                        ${tabs.map((tab) => `
                            <button class="lux-secondary-btn social-neo-community-hero-tab ${activeTab === tab.tab ? 'is-focused' : ''}" type="button" data-action="panel-community" data-community-tab="${escape(tab.tab)}" aria-pressed="${activeTab === tab.tab ? 'true' : 'false'}">
                                <span class="social-neo-community-hero-tab-icon"><i class="fas ${escape(tab.icon)}"></i></span>
                                <span class="social-neo-community-hero-tab-copy">
                                    <strong>${escape(tab.label)}</strong>
                                    <small>${escape(tab.helper)}</small>
                                </span>
                            </button>
                        `).join('')}
                    </div>
                    ${merged ? `
                        <div class="social-neo-community-hero-divider" aria-hidden="true"></div>
                        <div class="social-neo-stack social-neo-community-layout">${bodyHtml}</div>
                    ` : ''}
                </section>
            `;
        }
        const renderWorkspaceHero = createSocialLazyStub('renderWorkspaceHero', hasSocialWorkspaceModule, ensureSocialWorkspaceModule, '', null);
        function buildProjectCreateInviteContext(runtime, baseContext) {
            if (hasSocialWorkspaceModule() && typeof window.buildProjectCreateInviteContext === 'function') {
                return window.buildProjectCreateInviteContext(runtime, baseContext);
            }
            ensureSocialWorkspaceModule().catch(() => null);
            return {
                ...(baseContext || buildProjectCreateContext(runtime)),
                selectedMemberIds: [],
                candidateAccounts: [],
                facultyOptions: [],
                facultyFilter: 'all',
                memberSearch: '',
                selectedMembersMarkup: '',
                searchResultsMarkup: ''
            };
        }
        function resolveActiveSocialProject(runtime, projectId) {
            const projects = Array.isArray(runtime.social?.projects) ? runtime.social.projects : [];
            const id = text(projectId || runtime.ui?.activeProjectId || '');
            return projects.find((project) => text(project?.id) === id) || null;
        }
        function renderProjectTaskChecklistBlock(project, checklist, options = {}) {
            const compact = Boolean(options.compact);
            const rows = (Array.isArray(checklist) ? checklist : [])
                .map((item) => ({ id: text(item.id), label: text(item.label), done: Boolean(item.done) }));
            const head = compact ? '' : `
                <div class="social-neo-section-head social-project-task-checklist-head">
                    <div><span class="social-neo-label">Checklist</span><span>Break the task into small, trackable steps.</span></div>
                    <button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="project-task-checklist-add" data-project-id="${escape(text(project.id))}"><i class="fas fa-plus"></i> Add step</button>
                </div>
            `;
            const addBtn = compact ? `<div class="social-project-task-checklist-toolbar"><button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="project-task-checklist-add" data-project-id="${escape(text(project.id))}"><i class="fas fa-plus"></i> Add step</button></div>` : '';
            return `
                <div class="lux-glass-dialog-field social-project-task-checklist-field">
                    ${head}
                    ${addBtn}
                    <div class="social-project-task-checklist-rows" data-project-id="${escape(text(project.id))}">
                        ${rows.length ? rows.map((item, index) => `
                            <label class="social-project-task-checklist-row">
                                <input type="checkbox" name="projectTaskChecklistDone" data-checklist-id="${escape(text(item.id || `new-${index + 1}`))}" ${item.done ? 'checked' : ''}>
                                <input class="social-neo-input lux-control" type="text" name="projectTaskChecklistLabel" data-checklist-id="${escape(text(item.id || `new-${index + 1}`))}" value="${escape(text(item.label || ''))}" placeholder="Step description">
                                <button class="lux-secondary-btn lux-secondary-btn-icon" type="button" title="Remove step" data-action="project-task-checklist-remove" data-project-id="${escape(text(project.id))}" data-checklist-id="${escape(text(item.id || `new-${index + 1}`))}"><i class="fas fa-times"></i></button>
                            </label>
                        `).join('') : `<div class="social-neo-empty social-project-task-checklist-empty">No steps yet. Add one to track progress on this task.</div>`}
                    </div>
                </div>
            `;
        }
        const renderDeskTaskTreeForest = createSocialLazyStub('renderDeskTaskTreeForest', hasSocialWorkspaceModule, ensureSocialWorkspaceModule, '', null);
        const renderProjectTaskDeskCard = createSocialLazyStub('renderProjectTaskDeskCard', hasSocialWorkspaceModule, ensureSocialWorkspaceModule, '', null);
        const renderProjectTaskColumnList = createSocialLazyStub('renderProjectTaskColumnList', hasSocialWorkspaceModule, ensureSocialWorkspaceModule, '', null);
        const renderProjectTaskDeleteConfirmDialog = createSocialLazyStub('renderProjectTaskDeleteConfirmDialog', hasSocialWorkspaceModule, ensureSocialWorkspaceModule, '', null);
        const renderProjectTaskFormFields = createSocialLazyStub('renderProjectTaskFormFields', hasSocialWorkspaceModule, ensureSocialWorkspaceModule, '', null);
        function parseTaskChecklistFromForm(form) {
            const labels = Array.from(form.querySelectorAll('input[name="projectTaskChecklistLabel"]'));
            const doneBy = {};
            Array.from(form.querySelectorAll('input[name="projectTaskChecklistDone"]')).forEach((checkbox) => {
                doneBy[text(checkbox.getAttribute('data-checklist-id') || '')] = Boolean(checkbox.checked);
            });
            return labels.map((input, index) => ({
                id: text(input.getAttribute('data-checklist-id') || `check${index + 1}`),
                label: text(input.value || ''),
                done: Boolean(doneBy[text(input.getAttribute('data-checklist-id') || '')])
            })).filter((item) => item.label);
        }
        function syncTaskChecklistInput(target, isCheckbox) {
            const runtime = state();
            const itemId = text(target.getAttribute('data-checklist-id') || '');
            const rows = Array.isArray(runtime.ui?.projectTaskChecklist) ? runtime.ui.projectTaskChecklist : [];
            const existing = rows.find((item) => text(item.id) === itemId);
            if (existing) {
                existing.label = isCheckbox ? existing.label : target.value;
                existing.done = isCheckbox ? Boolean(target.checked) : existing.done;
            } else if (!isCheckbox) {
                rows.push({ id: itemId, label: target.value, done: false });
                runtime.ui.projectTaskChecklist = rows;
            }
        }
        function getProjectHealthDialogCard() {
            return document.querySelector(
                '.social-project-health-anchor .lux-glass-dialog-card--project-health-fs, '
                + '.lux-glass-dialog-card--project-health-fs, '
                + '.lux-glass-dialog-card--project-health'
            );
        }
        /** Patch only My plan card — avoid full Health remount/flicker. */
        function patchProjectHealthPlanCard(runtime = state()) {
            const root = getProjectHealthDialogCard();
            const live = root?.querySelector('.sph-card--plan');
            if (!live) return false;
            const projectId = text(activeDialog()?.projectId || runtime.ui?.activeProjectId || '');
            const project = resolveActiveSocialProject(runtime, projectId);
            if (!project) return false;
            const wrap = document.createElement('div');
            wrap.innerHTML = renderProjectHealthPlanCardHtml(runtime, project).trim();
            const next = wrap.firstElementChild;
            if (!next) return false;
            live.replaceWith(next);
            return true;
        }
        function taskMatchesPlanPickDueFilter(task, dueFilter, nowMs) {
            const filter = text(dueFilter || 'all') || 'all';
            const dueMs = Date.parse(text(task?.dueAt || ''));
            const hasDue = Number.isFinite(dueMs);
            if (filter === 'all') return true;
            if (filter === 'none') return !hasDue;
            if (filter === 'overdue') {
                return hasDue && dueMs < nowMs && normalizeProjectTaskStatusId(task?.status) !== 'done';
            }
            const days = filter === '7d' ? 7 : filter === '14d' ? 14 : filter === '30d' ? 30 : filter === '60d' ? 60 : 0;
            if (!days) return true;
            // Includes overdue and due within N days.
            return hasDue && dueMs <= nowMs + days * 86400000;
        }
        function resolveTaskPackageId(taskId, groups = []) {
            const tid = text(taskId);
            if (!tid) return '';
            for (const group of groups) {
                const members = (Array.isArray(group?.memberTaskIds) ? group.memberTaskIds : []).map((id) => text(id));
                if (members.includes(tid)) return text(group?.id);
            }
            return '';
        }
        const renderProjectHealthPlanPickRailHtml = createSocialLazyStub('renderProjectHealthPlanPickRailHtml', hasSocialWorkspaceModule, ensureSocialWorkspaceModule, '', null);
        const renderProjectHealthPlanPickResultsHtml = createSocialLazyStub('renderProjectHealthPlanPickResultsHtml', hasSocialWorkspaceModule, ensureSocialWorkspaceModule, '', null);
        const renderProjectHealthPlanPickToolbarHtml = createSocialLazyStub('renderProjectHealthPlanPickToolbarHtml', hasSocialWorkspaceModule, ensureSocialWorkspaceModule, '', null);
        function patchProjectHealthPlanPick(runtime = state()) {
            const card = document.querySelector('.lux-glass-dialog-card--health-plan-pick');
            if (!card) return false;
            const dialog = activeDialog();
            if (text(dialog?.type || '') !== 'project-health-plan-pick') return false;
            const model = buildProjectHealthPlanPickModel(runtime, dialog);
            if (!model) return false;
            const body = card.querySelector('.sph-pick-body');
            const apply = card.querySelector('[data-action="project-health-plan-pick-apply"]');
            if (body) body.innerHTML = renderProjectHealthPlanPickBodyHtml(model);
            if (apply) {
                apply.disabled = !model.selectedCount;
                apply.setAttribute('data-project-id', model.projectId);
                apply.setAttribute('data-window', model.horizon);
                apply.innerHTML = `<i class="fas fa-plus"></i> Add ${model.selectedCount || 0} to ${escape(model.horizonLabel)} plan`;
            }
            // Sync checkboxes without remounting search row
            const openOnly = card.querySelector('input[data-filter="openOnly"]');
            const hidePlanned = card.querySelector('input[data-filter="hidePlanned"]');
            if (openOnly) openOnly.checked = model.openOnly;
            if (hidePlanned) hidePlanned.checked = model.hidePlanned;
            return true;
        }
        const projectRiskOptionLabel = createSocialLazyStub('projectRiskOptionLabel', hasSocialWorkspaceModule, ensureSocialWorkspaceModule, '', null);
        const projectRiskScaleRank = createSocialLazyStub('projectRiskScaleRank', hasSocialWorkspaceModule, ensureSocialWorkspaceModule, 0, null);
        const projectRiskScaleOptionLabel = createSocialLazyStub('projectRiskScaleOptionLabel', hasSocialWorkspaceModule, ensureSocialWorkspaceModule, '', null);
        const formatProjectRiskScore = createSocialLazyStub('formatProjectRiskScore', hasSocialWorkspaceModule, ensureSocialWorkspaceModule, '', null);
        const projectRiskExposureScore = createSocialLazyStub('projectRiskExposureScore', hasSocialWorkspaceModule, ensureSocialWorkspaceModule, 0, null);
        const projectRiskExposureTier = createSocialLazyStub('projectRiskExposureTier', hasSocialWorkspaceModule, ensureSocialWorkspaceModule, '', null);
        const projectRiskIsActiveStatus = createSocialLazyStub('projectRiskIsActiveStatus', hasSocialWorkspaceModule, ensureSocialWorkspaceModule, false, null);
        const sortProjectRisksForRegister = createSocialLazyStub('sortProjectRisksForRegister', hasSocialWorkspaceModule, ensureSocialWorkspaceModule, [], null);
        const projectRiskRegisterSummary = createSocialLazyStub('projectRiskRegisterSummary', hasSocialWorkspaceModule, ensureSocialWorkspaceModule, null, null);
        const projectRiskLinkedTaskIdList = createSocialLazyStub('projectRiskLinkedTaskIdList', hasSocialWorkspaceModule, ensureSocialWorkspaceModule, [], null);
        const projectRiskLinksTask = createSocialLazyStub('projectRiskLinksTask', hasSocialWorkspaceModule, ensureSocialWorkspaceModule, false, null);
        function countProjectRisksForTask(risks, taskId) {
            return (Array.isArray(risks) ? risks : []).filter((risk) => projectRiskLinksTask(risk, taskId)).length;
        }
        const buildProjectRiskCountByTaskId = createSocialLazyStub('buildProjectRiskCountByTaskId', hasSocialWorkspaceModule, ensureSocialWorkspaceModule, {}, null);
        const renderProjectRiskScaleOptions = createSocialLazyStub('renderProjectRiskScaleOptions', hasSocialWorkspaceModule, ensureSocialWorkspaceModule, '', null);
        const renderEventCreateDialog = createSocialLazyStub('renderEventCreateDialog', hasSocialEventsModule, ensureSocialEventsModule, '', () => queueDeferredModuleRender('events-module'));
        const renderPageCreateDialog = createSocialLazyStub('renderPageCreateDialog', hasSocialPagesModule, ensureSocialPagesModule, '', () => queueDeferredModuleRender('pages-module'));
        function buildGroupCreateInviteContext(runtime) {
            // Invite context lives in social-groups.js; page only needs the dialog entrypoints.
            return null;
        }
        function renderGroupCreateInviteSection(runtime, inviteContext) {
            return '';
        }
        const renderGroupCreateDialog = createSocialLazyStub('renderGroupCreateDialog', hasSocialGroupsModule, ensureSocialGroupsModule, '', () => queueDeferredModuleRender('groups-module'));
        function findSocialGroupById(groupId) {
            const id = text(groupId);
            if (!id) return null;
            return (Array.isArray(state().social?.groups) ? state().social.groups : [])
                .find((item) => text(item?.id) === id) || null;
        }
        function renderGroupDetailMemberLine(group, memberId) {
            return '';
        }
        function renderGroupDetailDialog(runtime, dialog = activeDialog()) {
            if (hasSocialGroupsModule() && typeof window.renderGroupDetailDialog === 'function') {
                return window.renderGroupDetailDialog(runtime, dialog);
            }
            ensureSocialGroupsModule().catch(() => null);
            return '';
        }
        function renderGroupsPanel() {
            if (hasSocialGroupsModule()) return window.renderGroupsPanel();
            ensureSocialGroupsModule().then(() => queueDeferredModuleRender('groups-module')).catch(() => null);
            return '<div class="social-neo-stack social-neo-module-loading" aria-busy="true"></div>';
        }
        const renderPagesHero = createSocialLazyStub('renderPagesHero', hasSocialPagesModule, ensureSocialPagesModule, '', () => queueDeferredModuleRender('pages-module'));
        const renderPagesEmptyState = createSocialLazyStub('renderPagesEmptyState', hasSocialPagesModule, ensureSocialPagesModule, '', () => queueDeferredModuleRender('pages-module'));
        const renderPagePostComposeDialog = createSocialLazyStub('renderPagePostComposeDialog', hasSocialPagesModule, ensureSocialPagesModule, '', () => queueDeferredModuleRender('pages-module'));
        const renderPageProfileComposer = createSocialLazyStub('renderPageProfileComposer', hasSocialPagesModule, ensureSocialPagesModule, '', () => queueDeferredModuleRender('pages-module'));
        function renderPagesPanel() {
            if (hasSocialPagesModule()) return window.renderPagesPanel();
            ensureSocialPagesModule().then(() => queueDeferredModuleRender('pages-module')).catch(() => null);
            return '<div class="social-neo-stack social-neo-module-loading" aria-busy="true"></div>';
        }
        function renderAlertsPanel() {
            if (hasSocialAlertsModule()) return window.renderAlertsPanel();
            ensureSocialAlertsModule().then(() => queueDeferredModuleRender('alerts-module')).catch(() => null);
            return '<div class="social-neo-stack social-neo-module-loading" aria-busy="true"></div>';
        }
        const PORTFOLIO_DISCOVER_ROLE_TARGETS = [
            ['all', 'All audiences'],
            ['all_logged_in', 'All logged-in'],
            ['students_only', 'Students'],
            ['tas_only', 'TAs'],
            ['professors_only', 'Professors'],
            ['staff_only', 'Staff'],
            ['custom', 'Custom'],
        ];
        function renderProjectsPanel() {
            const impl = resolveWorkspacePanelExport('renderProjectsPanel');
            if (typeof impl === 'function' && impl !== renderProjectsPanel) {
                return impl();
            }
            ensureSocialWorkspaceModule().then(() => queueDeferredModuleRender('workspace-module')).catch(() => null);
            return `
                <section class="social-neo-card">
                    <div class="social-neo-empty-hero">
                        <i class="fas fa-briefcase"></i>
                        <strong>Loading Portfolio</strong>
                        <span>Preparing showcase discovery and your portfolio.</span>
                    </div>
                </section>
            `;
        }
        function renderProfilePageBody() {
            if (typeof window.renderSocialProfilePanel === 'function') {
                return window.renderSocialProfilePanel();
            }
            ensureSocialProfileModule().then(() => queueDeferredModuleRender('profile-module')).catch(() => null);
            return `
                <div class="social-neo-card">
                    <div class="social-neo-empty">Loading profile...</div>
                </div>
            `;
        }
        function renderShellPrimaryNav(activePanel) {
            const panels = activeNavPanels();
            return `
                <div class="social-neo-shell-primary-nav" role="tablist" aria-label="Social navigation">
                    ${panels.map((panel) => `
                        <button class="social-neo-shell-nav-btn ${text(activePanel) === panel.id ? 'is-active' : ''}" type="button" data-action="panel-${escape(panel.id)}">
                            <span class="social-neo-shell-nav-icon" data-panel-tone="${escape(panel.id)}">
                                <i class="fas ${escape(panel.icon)}"></i>
                            </span>
                            <span class="social-neo-shell-nav-copy">
                                <strong class="social-neo-shell-nav-title">${escape(panel.label)}</strong>
                                <small class="social-neo-shell-nav-helper">${escape(panel.helper)}</small>
                            </span>
                            ${panel.count > 0 ? `<em class="social-neo-shell-nav-count social-neo-shell-nav-count-label">${escape(panel.count)}</em>` : ''}
                        </button>
                    `).join('')}
                </div>
            `;
        }
        // Mobile nav is owned by #mobile-bottom-nav + social-mobile.js (no in-shell dual tabbar).
        function renderMobileTabBar() {
            return '';
        }
        function renderShellDrawer(activePanel) {
            const runtime = state();
            const panels = activeNavPanels();
            const user = currentUser() || {};
            const open = Boolean(runtime.ui?.shellDrawerOpen);
            if (!open) return '';
            return `
                <div class="social-neo-shell-drawer-backdrop" data-action="shell-drawer-close"></div>
                <aside class="social-neo-shell-drawer" aria-label="Social navigation drawer">
                    <section class="social-neo-card social-neo-shell-drawer-profile social-neo-shell-drawer-profile-card">
                        <div class="social-neo-shell-drawer-head">
                            <button class="social-neo-person social-neo-clickable social-neo-person-start-gap-12 social-neo-shell-drawer-profile-chip" type="button" data-action="panel-profile" data-user-id="${escape(currentUserId())}">
                                ${avatar(user)}
                                <div class="social-neo-shell-drawer-profile-copy">
                                    <strong class="social-neo-shell-drawer-profile-name">${escape(displayName(user))}</strong>
                                    <span class="social-neo-shell-drawer-profile-subtitle">${escape(accountSubtitle(user))}</span>
                                </div>
                            </button>
                            <button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="shell-drawer-close"><i class="fas fa-times"></i></button>
                        </div>
                        <div class="social-neo-inline social-neo-inline-gap-4 social-neo-shell-drawer-actions">
                            <button class="lux-secondary-btn lux-secondary-btn-sm social-neo-shell-drawer-action-btn" type="button" data-action="panel-profile" data-user-id="${escape(currentUserId())}"><i class="fas fa-user"></i> Profile</button>
                            <button class="lux-secondary-btn lux-secondary-btn-sm social-neo-shell-drawer-action-btn" type="button" data-action="panel-messages"><i class="fas fa-paper-plane"></i> Messages</button>
                        </div>
                    </section>
                    <section class="social-neo-card social-neo-shell-drawer-nav-card">
                        <div class="social-neo-sidebar-nav social-neo-shell-drawer-nav">
                            ${panels.map((panel) => `
                                <button class="social-neo-side-link social-neo-shell-drawer-nav-btn ${text(activePanel) === panel.id ? 'is-active' : ''}" type="button" data-action="panel-${escape(panel.id)}">
                                    <span class="social-neo-side-main social-neo-shell-drawer-nav-main">
                                        <span class="social-neo-side-icon social-neo-shell-drawer-nav-icon" data-panel-tone="${escape(panel.id)}"><i class="fas ${escape(panel.icon)}"></i></span>
                                        <span class="social-neo-side-copy social-neo-shell-drawer-nav-copy">
                                            <strong class="social-neo-shell-drawer-nav-title">${escape(panel.label)}</strong>
                                            <small class="social-neo-shell-drawer-nav-helper">${escape(panel.helper)}</small>
                                        </span>
                                    </span>
                                    ${panel.count > 0 ? `<em class="social-neo-side-count social-neo-shell-drawer-nav-count">${escape(panel.count)}</em>` : ''}
                                </button>
                            `).join('')}
                        </div>
                    </section>
                </aside>
            `;
        }
        const WORKSPACE_NAV_ANIM_MS = 280;
        let workspaceNavCloseTimer = 0;
        function getSocialWorkspaceNavRegion(host) {
            const rootHost = host || root();
            return rootHost?.querySelector('#social-neo-workspace-nav-region')
                || document.getElementById('social-neo-workspace-nav-region');
        }
        function animateSocialWorkspaceNavOpen(host) {
            const region = getSocialWorkspaceNavRegion(host);
            const panel = region?.querySelector('.social-neo-workspace-nav--overlay');
            if (!region || !panel) return;
            region.classList.remove('is-open');
            panel.classList.remove('is-open');
            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(() => {
                    region.classList.add('is-open');
                    panel.classList.add('is-open');
                });
            });
        }
        function closeSocialWorkspaceNavAnimated(done) {
            const host = root();
            const runtime = state();
            if (!runtime.ui?.workspaceNavOpen) {
                if (typeof done === 'function') done();
                return Promise.resolve();
            }
            if (window.__kiuWorkspaceNavClosing) {
                if (typeof done === 'function') done();
                return Promise.resolve();
            }
            const region = getSocialWorkspaceNavRegion(host);
            const panel = region?.querySelector('.social-neo-workspace-nav--overlay');
            if (!region || !panel) {
                runtime.ui.workspaceNavOpen = false;
                renderSocialPageNow('workspace-nav-close');
                if (typeof done === 'function') done();
                return Promise.resolve();
            }
            window.__kiuWorkspaceNavClosing = true;
            region.classList.remove('is-open');
            panel.classList.remove('is-open');
            return new Promise((resolve) => {
                let settled = false;
                const finish = () => {
                    if (settled) return;
                    settled = true;
                    window.clearTimeout(workspaceNavCloseTimer);
                    panel.removeEventListener('transitionend', onEnd);
                    window.__kiuWorkspaceNavClosing = false;
                    runtime.ui.workspaceNavOpen = false;
                    renderSocialPageNow('workspace-nav-close');
                    if (typeof done === 'function') done();
                    resolve();
                };
                const onEnd = (event) => {
                    if (event.target !== panel) return;
                    if (event.propertyName && event.propertyName !== 'transform') return;
                    finish();
                };
                panel.addEventListener('transitionend', onEnd);
                workspaceNavCloseTimer = window.setTimeout(finish, WORKSPACE_NAV_ANIM_MS + 40);
            });
        }







        const api = {
            navigateToEntity,
            entityDetailEntity,
            entityDetailDescription,
            renderEntityDetailDialog,
            renderComposerEntityChips,
            renderPostEntityLinks,
            clearPostComposeDraft,
            patchPostComposeAttachDialog,
            renderPostComposeAttachDialog,
            patchPostComposeDialog,
            renderPostComposeShareSection,
            renderPostComposeAttachResultsHtml,
            renderSocialLuxHero,
            syncSocialVisualShell,
            renderFeedPanel,
            renderEventsPanel,
            renderPost,
            renderPostComposeDialog,
            renderRelationshipActions,
            renderCommunityPanel,
            renderProjectsWorkspacePanelClassic,
            renderLostFoundPanel,
            renderSurveysPanel,
            renderPhotographyPanel,
            renderMessagesPanel,
            renderCommunityHero,
            renderWorkspaceHero,
            renderPortfolioHero,
            renderProjectTaskFormFields,
            buildProjectCreateInviteContext,
            resolveActiveSocialProject,
            renderProjectTaskChecklistBlock,
            parseTaskChecklistFromForm,
            syncTaskChecklistInput,
            getProjectHealthDialogCard,
            patchProjectHealthPlanCard,
            taskMatchesPlanPickDueFilter,
            resolveTaskPackageId,
            patchProjectHealthPlanPick,
            countProjectRisksForTask,
            projectRiskScaleRank,
            buildGroupCreateInviteContext,
            renderGroupCreateInviteSection,
            findSocialGroupById,
            renderGroupDetailMemberLine,
            renderGroupDetailDialog,
            renderGroupsPanel,
            renderGroupsHero,
            renderGroupCreateDialog,
            renderEventsHero,
            renderEventCreateDialog,
            renderPagesHero,
            renderPageCreateDialog,
            renderPagesPanel,
            renderAlertsPanel,
            renderProjectsPanel,
            renderProfilePageBody,
            renderShellPrimaryNav,
            renderMobileTabBar,
            renderShellDrawer,
            getSocialWorkspaceNavRegion,
            animateSocialWorkspaceNavOpen,
            closeSocialWorkspaceNavAnimated
};
        Object.assign(window, api);
        return api;
    };
})();
