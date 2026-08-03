/* Social workspace portfolio UI (hero, create, discover panel, editor shell).
 * Lazy: loaded by ensureSocialWorkspaceModule before social-workspace.js.
 * Workspace installs via createKiuSocialWorkspacePortfolioUiApi(deps).
 */
(function initSocialWorkspacePortfolioUi() {
    'use strict';
    if (window.__KIU_SOCIAL_WORKSPACE_PORTFOLIO_UI_LOADED) return;
    window.__KIU_SOCIAL_WORKSPACE_PORTFOLIO_UI_LOADED = true;

    function createKiuSocialWorkspacePortfolioUiApi(deps) {
        if (!deps || typeof deps !== 'object') throw new Error('workspace portfolio-ui deps required');
        const {
            accountById,
            avatar,
            currentFacultyCode,
            currentUser,
            currentUserId,
            displayName,
            ensureMyPortfolioDocument,
            escape,
            facultyLabel,
            fileUrl,
            getSafeSocialExternalUrl,
            isImage,
            neoActions,
            neoField,
            neoHead,
            portfolioAudienceLabel,
            portfolioDraftExists,
            portfolioEntriesForViewer,
            portfolioMatchesRoleFilter,
            PORTFOLIO_DISCOVER_ROLE_TARGETS,
            roleLabel,
            state,
            text,
            uniqueStrings,
            when
        } = deps;

        const portfolioPill = (innerHtml, extra = '') => `<span class="social-neo-pill lux-status-pill ${extra}">${innerHtml}</span>`;

        const renderPortfolioCardTextRail = ({ entryId, dataAttr, ariaLabel, body, railClass, controlsClass, viewportClass, textClass, textTag = 'p' }) => `
            <div class="lux-scroll-rail ${railClass}" data-lux-scroll-rail ${dataAttr}="${escape(entryId)}">
                <div class="lux-scroll-rail__controls ${controlsClass}" hidden aria-hidden="true">
                    <div class="lux-scroll-rail__dock lux-scroll-rail__dock--vertical" role="group" aria-label="${escape(ariaLabel)}">
                        <button type="button" class="lux-scroll-rail__btn" data-lux-scroll="up" aria-label="Scroll up"><i class="fas fa-chevron-up" aria-hidden="true"></i></button>
                        <span class="lux-scroll-rail__spine" aria-hidden="true"></span>
                        <button type="button" class="lux-scroll-rail__btn" data-lux-scroll="down" aria-label="Scroll down"><i class="fas fa-chevron-down" aria-hidden="true"></i></button>
                    </div>
                </div>
                <div class="lux-scrollbar lux-scroll-rail__viewport ${viewportClass}" aria-label="${escape(ariaLabel)}">
                    <${textTag} class="${textClass}">${escape(body)}</${textTag}>
                </div>
            </div>
        `;

        function renderPortfolioHero(runtime, metrics = {}) {
            const canCreate = Boolean(metrics.canCreate);
            const allEntries = Array.isArray(metrics.allEntries) ? metrics.allEntries : [];
            const myEntries = Array.isArray(metrics.myEntries) ? metrics.myEntries : [];
            const tagOptions = Array.isArray(metrics.tagOptions) ? metrics.tagOptions : [];
            const facultyOptions = Array.isArray(metrics.facultyOptions) ? metrics.facultyOptions : [];
            const portfolioPanelTabs = Array.isArray(metrics.portfolioPanelTabs) ? metrics.portfolioPanelTabs : [];
            const portfolioPanelTab = text(metrics.portfolioPanelTab || 'discover') || 'discover';
            const discoverFaculty = text(metrics.discoverFaculty || 'all') || 'all';
            const discoverRole = text(metrics.discoverRole || 'all') || 'all';
            const discoverSearch = text(metrics.discoverSearch || '');
            const discoverTag = text(metrics.discoverTag || '').toLowerCase();
            const editing = text(metrics.editing || '');
            const hasDraft = Boolean(metrics.hasDraft);
            const publishedCount = allEntries.filter((entry) => entry.status === 'published').length;
            const stats = [
                { label: 'Published', value: publishedCount },
                { label: 'Your entries', value: myEntries.length },
                { label: 'Discovery tags', value: tagOptions.length },
            ];
            const createCta = canCreate ? `
                <button class="lux-primary-btn social-neo-portfolio-hero-create-btn" type="button" data-action="portfolio-create-open">
                    <i class="fas fa-file-arrow-up"></i> ${hasDraft ? 'Continue my portfolio' : 'Upload my resume'}
                </button>
                ${hasDraft ? `${portfolioPill('<strong>Draft saved</strong><span>Ready to publish</span>', 'social-portfolio-draft-pill')}` : ''}
            ` : '';
            const bodyHtml = text(metrics.bodyHtml || '');
            const merged = Boolean(bodyHtml);
            const discoverFilters = portfolioPanelTab === 'discover' ? `
                <div class="social-neo-portfolio-hero-discover lux-soft-chrome home-hover-chip">
                    <div class="social-portfolio-toolbar-head">
                        <div>
                            <strong>Discover talent across campus</strong>
                            <span class="lms-route-meta-12">Filter by faculty, audience, and tags without losing the social feel of the feed.</span>
                        </div>
                    </div>
                    <div class="social-portfolio-search-row lux-soft-chrome home-hover-chip">
                        <label class="social-portfolio-search">
                            <i class="fas fa-search"></i>
                            <input class="lux-control" type="search" name="projectDiscoverSearch" value="${escape(discoverSearch)}" placeholder="Search projects, skills, hashtags, people, or faculties">
                        </label>
                        <select class="social-neo-select lux-control lux-universal-native-select" name="projectDiscoverRole" data-lux-picker>
                            ${PORTFOLIO_DISCOVER_ROLE_TARGETS.map(([value, label]) => `<option value="${escape(value)}" ${discoverRole === value ? 'selected' : ''}>${escape(label)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="social-portfolio-tag-row lux-soft-chrome home-hover-chip">
                        <button class="${!discoverTag ? 'lux-primary-btn' : 'lux-secondary-btn'} lux-secondary-btn-sm" type="button" data-action="portfolio-filter-tag" data-tag="">All tags</button>
                        ${tagOptions.map((tag) => `
                            <button class="${discoverTag === text(tag).toLowerCase() ? 'lux-primary-btn' : 'lux-secondary-btn'} lux-secondary-btn-sm" type="button" data-action="portfolio-filter-tag" data-tag="${escape(text(tag).toLowerCase())}">
                                #${escape(text(tag).replace(/^#/, ''))}
                            </button>
                        `).join('')}
                    </div>
                </div>
            ` : '';
            return `
                <section class="social-neo-card social-neo-portfolio-hero social-neo-community-panel social-neo-community-panel--portfolio home-hover-chip${merged ? ' is-merged' : ''}">
                    <div class="social-neo-portfolio-hero-head">
                        <div class="social-neo-portfolio-hero-actions">
                            ${(window.renderSocialBrowseFacultyHeroControl || (window.KiuSocialChromeModel || {}).renderSocialBrowseFacultyHeroControl)?.(runtime) || ''}
                            ${createCta}
                            <button class="lux-secondary-btn social-neo-portfolio-hero-profile-btn" type="button" data-action="profile-portfolio-open">
                                <i class="fas fa-id-card"></i> Open profile portfolio
                            </button>
                        </div>
                    </div>
                    <div class="social-neo-portfolio-hero-stats home-hover-chip">
                        ${stats.map((stat) => `
                            <article class="social-neo-portfolio-hero-stat social-neo-events-hero-stat lux-strip-card surface-card lux-soft-chrome home-hover-chip">
                                <strong>${escape(String(stat.value))}</strong>
                                <span>${escape(stat.label)}</span>
                            </article>
                        `).join('')}
                    </div>
                    <div class="social-neo-portfolio-hero-tabs-row">
                        <div class="portfolio-panel-tabs social-neo-portfolio-hero-tabs" role="tablist" aria-label="Portfolio views">
                            ${portfolioPanelTabs.map((tab) => `
                                <button class="${portfolioPanelTab === tab.tab ? 'lux-primary-btn' : 'lux-secondary-btn'} portfolio-panel-tab" type="button" role="tab" data-action="portfolio-panel-tab" ${tab.attrs} aria-selected="${portfolioPanelTab === tab.tab ? 'true' : 'false'}" aria-pressed="${portfolioPanelTab === tab.tab ? 'true' : 'false'}">
                                    <span class="portfolio-panel-tab-copy">
                                        <strong>${escape(tab.label)}</strong>
                                        <small>${escape(tab.helper)}</small>
                                    </span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    ${discoverFilters}
                    ${merged ? `
                        <div class="social-neo-portfolio-hero-divider" aria-hidden="true"></div>
                        <div class="social-neo-portfolio-hero-body">${bodyHtml}</div>
                    ` : ''}
                </section>
            `;
        }
        function renderPortfolioCreateDialog(runtime) {
            const allEntries = portfolioEntriesForViewer();
            const currentFaculty = currentFacultyCode();
            const facultyOptions = uniqueStrings(['all', currentFaculty, ...allEntries.flatMap((entry) => entry.facultyCodes || [])]).filter(Boolean);
            const draftFaculties = Array.isArray(runtime.ui?.projectFacultyCodes) && runtime.ui.projectFacultyCodes.length
                ? runtime.ui.projectFacultyCodes
                : [((window.KiuSocialChromeModel || {}).socialDefaultCreateFaculty?.(runtime) || currentFaculty)];
            const mediaItems = Array.isArray(runtime.ui?.projectMediaItems) ? runtime.ui.projectMediaItems : [];
            const editing = text(runtime.ui?.projectEditId || '');
            const customAudienceOpen = text(runtime.ui?.projectVisibility || 'all_logged_in') === 'custom';
            const roleTargets = [
                ['all_logged_in', 'All logged-in'],
                ['students_only', 'Students'],
                ['tas_only', 'TAs'],
                ['professors_only', 'Professors'],
                ['staff_only', 'Staff'],
                ['custom', 'Custom']
            ];
            const title = editing ? 'Edit portfolio entry' : 'Create portfolio entry';
            const subtitle = editing
                ? 'Adjust the story, visuals, and audience from one polished editor.'
                : 'Present completed work as a polished campus showcase entry.';
            const submitLabel = editing ? 'Save portfolio entry' : 'Publish portfolio card';
            return `<div class="lux-glass-dialog-backdrop" data-action="dialog-close">
                <form class="lux-glass-dialog-card lux-glass-dialog-card--form lux-glass-dialog-card--portfolio-create lux-glass-dialog-card lux-glass-dialog-card--social-glass" data-form="${editing ? 'portfolio-settings' : 'create-portfolio'}" ${editing ? `data-project-id="${escape(editing)}"` : ''} data-action="noop" data-lux-transparency-exempt="1">
                    ${neoHead(title, subtitle, { icon: 'fas fa-briefcase' })}
                    <div class="lux-glass-dialog-body lux-glass-dialog-body--portfolio-create">
                        <section class="lux-glass-dialog-portfolio-create-section">
                            <div class="social-neo-form-grid social-neo-form-grid-2">
                                ${neoField('Title', `<input class="social-neo-input lux-control" type="text" name="projectName" value="${escape(text(runtime.ui?.projectName || ''))}" placeholder="Sustainable marketplace app" required>`)}
                                ${neoField('Short summary', `<input class="social-neo-input lux-control" type="text" name="projectSummary" value="${escape(text(runtime.ui?.projectSummary || ''))}" placeholder="Two-line hook that makes people stop scrolling">`)}
                            </div>
                            ${neoField('Description', `<textarea class="social-neo-textarea lux-control" name="projectDescription" rows="4" placeholder="Explain what you built, why it matters, what stage it is in, and what kind of collaboration or opportunity you want.">${escape(text(runtime.ui?.projectDescription || ''))}</textarea>`)}
                            <div class="social-neo-form-grid social-neo-form-grid-3">
                                ${neoField('Hashtags', `<input class="social-neo-input lux-control" type="text" name="projectHashtags" value="${escape(text(runtime.ui?.projectHashtags || ''))}" placeholder="ai, startup, uiux">`)}
                                ${neoField('Skill tags', `<input class="social-neo-input lux-control" type="text" name="projectSkillTags" value="${escape(text(runtime.ui?.projectSkillTags || ''))}" placeholder="react, branding, research">`)}
                                ${neoField('Context', `<input class="social-neo-input lux-control" type="text" name="projectCourseTag" value="${escape(text(runtime.ui?.projectCourseTag || ''))}" placeholder="Capstone, thesis, startup, freelance">`)}
                            </div>
                            ${neoField('External links', `<textarea class="social-neo-textarea lux-control" name="projectExternalLinks" rows="3" placeholder="Prototype | https://...&#10;GitHub | https://...">${escape(text(runtime.ui?.projectExternalLinks || ''))}</textarea>`)}
                            <div class="social-neo-form-grid social-neo-form-grid-3">
                                <label class="lux-glass-dialog-field">
                                    <span class="social-neo-label">Status</span>
                                    <select class="social-neo-select lux-control" name="projectStatus" data-lux-picker>
                                        ${['draft', 'published'].map((status) => `<option value="${escape(status)}" ${text(runtime.ui?.projectStatus || 'draft') === status ? 'selected' : ''}>${escape(status)}</option>`).join('')}
                                    </select>
                                </label>
                                <label class="lux-glass-dialog-field">
                                    <span class="social-neo-label">Audience</span>
                                    <select class="social-neo-select lux-control" name="projectVisibility" data-lux-picker>
                                        ${roleTargets.map(([value, label]) => `<option value="${escape(value)}" ${text(runtime.ui?.projectVisibility || 'all_logged_in') === value ? 'selected' : ''}>${escape(label)}</option>`).join('')}
                                    </select>
                                </label>
                                ${neoField('Media upload', `<input class="social-neo-input lux-control" type="file" name="projectMediaFile" accept="image/*,.pdf,.ppt,.pptx,.doc,.docx,.zip,.fig,.sketch">`)}
                            </div>
                            <div class="lux-glass-dialog-portfolio-create-faculties">
                                <span class="social-neo-label">Faculty tags *</span>
                                <div class="social-neo-badge-row social-neo-badge-row-mt-8">
                                    ${uniqueStrings([currentFaculty, 'BUS', 'CS', 'LAW', 'MED', 'ARTS', ...facultyOptions.filter((code) => code !== 'all')]).map((facultyCode) => `
                                        <button class="lux-secondary-btn ${draftFaculties.includes(facultyCode) ? 'lux-primary-btn' : 'lux-secondary-btn'} lux-secondary-btn-sm" type="button" data-action="project-faculty-toggle" data-faculty="${escape(facultyCode)}">${escape(facultyCode)}</button>
                                    `).join('')}
                                </div>
                            </div>
                            ${customAudienceOpen ? `
                                <div class="social-neo-form-grid social-neo-form-grid-2">
                                    ${neoField('Custom roles', `<input class="social-neo-input lux-control" type="text" name="projectVisibleRolesRaw" value="${escape((runtime.ui?.projectVisibleRoles || []).join(', '))}" placeholder="student, professor, ta">`)}
                                    ${neoField('Custom faculties', `<input class="social-neo-input lux-control" type="text" name="projectVisibleFacultyCodesRaw" value="${escape((runtime.ui?.projectVisibleFacultyCodes || []).join(', '))}" placeholder="BUS, CS, LAW">`)}
                                    ${neoField('Allowed user IDs', `<input class="social-neo-input lux-control" type="text" name="projectVisibleUserIds" value="${escape(text(runtime.ui?.projectVisibleUserIds || ''))}" placeholder="student-001, professor-014">`)}
                                    ${neoField('Hidden user IDs', `<input class="social-neo-input lux-control" type="text" name="projectHiddenUserIds" value="${escape(text(runtime.ui?.projectHiddenUserIds || ''))}" placeholder="Optional direct exclusions">`)}
                                </div>
                            ` : ''}
                            ${mediaItems.length ? `
                                <div class="social-portfolio-media-strip">
                                    ${mediaItems.map((item) => {
                                        const url = fileUrl(item);
                                        if (url && isImage(item)) {
                                            return `<img src="${escape(url)}" alt="${escape(text(item.name || 'Portfolio media'))}">`;
                                        }
                                        return `<span class="social-neo-pill">${escape(text(item.name || 'Uploaded media'))}</span>`;
                                    }).join('')}
                                </div>
                            ` : ''}
                        </section>
                    </div>
                    ${neoActions({
                        cancelLabel: editing ? 'Discard edit' : 'Cancel',
                        cancelAction: editing ? 'portfolio-edit-cancel' : 'dialog-close',
                        submitLabel: submitLabel,
                        submitIcon: 'fas fa-briefcase'
                    })}
                </form>
            </div>`;
        }

        function renderMyPortfolioPanel() {
            const portfolio = ensureMyPortfolioDocument();
            const runtime = state();
            if (typeof window.KiuPortfolioEditor?.renderEditor === 'function') {
                return window.KiuPortfolioEditor.renderEditor(portfolio, {
                    openPortfolioSections: runtime.ui?.openPortfolioSections || {},
                    publishVisibility: runtime.ui?.publishVisibility || portfolio.visibilityMode || 'staff_only',
                    publishConsent: Boolean(runtime.ui?.publishConsent),
                    portfolioSaveStatus: runtime.ui?.portfolioSaveStatus || 'Changes autosave as you type.'
                });
            }
            return `<section class="social-neo-card"><div class="social-neo-empty">Portfolio editor is loading.</div></section>`;
        }

        function renderPortfolioViewerDialog(dialog) {
            const userId = text(dialog?.userId || state().ui?.viewingPortfolioUserId || '');
            const owner = accountById(userId) || {};
            const portfolio = state().ui?.viewingPortfolio;
            const error = text(state().ui?.viewingPortfolioError || '');
            const ownerName = displayName(owner) || text(portfolio?.basics?.name) || 'Portfolio';
            let bodyMarkup = '<div class="social-neo-empty">Loading portfolio…</div>';
            if (error) {
                bodyMarkup = `<div class="social-neo-empty">${escape(error)}</div>`;
            } else if (portfolio && typeof window.KiuPortfolioEditor?.renderViewer === 'function') {
                bodyMarkup = window.KiuPortfolioEditor.renderViewer(portfolio);
            }
            return `<div class="lux-glass-dialog-backdrop" data-action="dialog-close" role="dialog" aria-modal="true" aria-label="${escape(ownerName)} portfolio">
                <div class="lux-glass-dialog-card lux-glass-dialog-card--form lux-glass-dialog-card--portfolio-editor lux-glass-dialog-card--portfolio-viewer lux-glass-dialog-card--social-glass sns-portfolio-editor-dialog" data-action="noop" data-lux-transparency-exempt="1">
                    <div class="lux-glass-dialog-section-head lux-glass-dialog-head social-neo-surveys-hero-head portfolio-editor-dialog-head">
                        <div class="social-neo-surveys-hero-copy">
                            <span class="social-neo-section-kicker">Portfolio</span>
                            <h2>${escape(ownerName)}</h2>
                            <p class="lux-glass-dialog-portfolio-editor-subtitle">Campus portfolio showcase</p>
                        </div>
                        <button class="lux-ghost-btn lux-glass-dialog-close-btn" type="button" data-action="dialog-close" aria-label="Close"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="lux-glass-dialog-body lux-glass-dialog-body--portfolio-editor lux-glass-dialog-body--portfolio-viewer">
                        ${bodyMarkup}
                    </div>
                </div>
            </div>`;
        }

        function renderPortfolioEditorDialog() {
            return `<div class="lux-glass-dialog-backdrop" data-action="dialog-close" role="dialog" aria-modal="true" aria-label="My portfolio">
                <div class="lux-glass-dialog-card lux-glass-dialog-card--form lux-glass-dialog-card--portfolio-editor lux-glass-dialog-card--social-glass sns-portfolio-editor-dialog" data-action="noop" data-lux-transparency-exempt="1">
                    <div class="lux-glass-dialog-section-head lux-glass-dialog-head social-neo-surveys-hero-head portfolio-editor-dialog-head">
                        <div class="social-neo-surveys-hero-copy">
                            <span class="social-neo-section-kicker">Portfolio</span>
                            <h2>My portfolio</h2>
                            <p class="lux-glass-dialog-portfolio-editor-subtitle">Upload your resume, add a short About, and optionally attach subjects or projects.</p>
                        </div>
                        <button class="lux-ghost-btn lux-glass-dialog-close-btn" type="button" data-action="dialog-close" aria-label="Close"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="lux-glass-dialog-body lux-glass-dialog-body--portfolio-editor">
                        ${renderMyPortfolioPanel()}
                    </div>
                </div>
                ${renderPortfolioCustomBuilderOverlay()}
            </div>`;
        }

        function renderPortfolioCustomBuilderOverlay() {
            if (!state().ui?.portfolioCustomBuilderOpen) return '';
            if (typeof window.KiuPortfolioCustomBuilder?.renderCustomBuilderDialog !== 'function') return '';
            return window.KiuPortfolioCustomBuilder.renderCustomBuilderDialog(state().ui || {});
        }

        function renderPortfolioProfileBlock(userId, { isOwn = false } = {}) {
            const items = portfolioEntriesForViewer()
                .filter((entry) => text(entry.ownerUserId) === text(userId))
                .slice(0, 3);
            if (!items.length && !isOwn) return '';
            return `
                <section class="social-neo-card social-portfolio-profile-block">
                    <div class="social-neo-section-head">
                        <div><strong>${isOwn ? 'Your portfolio' : 'Portfolio highlights'}</strong><span>${isOwn ? 'Showcase projects, research, design, and startup work inside campus social.' : 'Visible showcase entries from this profile.'}</span></div>
                        <div class="social-neo-inline social-neo-inline-gap-8-wrap">
                            <span class="social-neo-pill lux-status-pill"><strong>${escape(items.length)}</strong><span>Visible</span></span>
                            ${isOwn ? `<button class="lux-primary-btn lux-secondary-btn-sm" type="button" data-action="profile-portfolio-open"><i class="fas fa-briefcase"></i> Open Portfolio</button>` : ''}
                        </div>
                    </div>
                    ${items.length ? `
                        <div class="social-portfolio-mini-grid">
                            ${items.map((entry) => `
                                <article class="social-portfolio-mini-card home-hover-chip">
                                    <div class="social-neo-badge-row">
                                        ${portfolioPill(escape(portfolioAudienceLabel(entry.visibilityMode)))}
                                        ${portfolioPill(escape(entry.status))}
                                    </div>
                                    <strong>${escape(entry.title)}</strong>
                                    <p>${escape(entry.summary || entry.description || 'Portfolio entry')}</p>
                                    <div class="social-neo-inline social-neo-inline-between-gap-8-wrap">
                                        <div class="social-neo-badge-row">${entry.hashtags.slice(0, 2).map((tag) => portfolioPill(`#${escape(tag.replace(/^#/, ''))}`)).join('')}</div>
                                        <button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="project-open" data-project-id="${escape(entry.id)}">Open</button>
                                    </div>
                                </article>
                            `).join('')}
                        </div>
                    ` : `<div class="social-neo-empty">Build your first portfolio by uploading a resume and a short About for campus discovery.</div>`}
                </section>
            `;
        }

        function renderProjectsPanel() {
            const runtime = state();
            const portfolioPanelTab = text(runtime.ui?.portfolioPanelTab || 'discover') || 'discover';
            const viewer = currentUser();
            const canCreate = Boolean(viewer);
            const allEntries = portfolioEntriesForViewer();
            const chrome = window.KiuSocialChromeModel || {};
            const discoverFaculty = typeof chrome.socialBrowseFacultyValue === 'function'
                ? chrome.socialBrowseFacultyValue(runtime)
                : (text(runtime.ui?.projectDiscoverFaculty || 'all') || 'all');
            const discoverRole = text(runtime.ui?.projectDiscoverRole || 'all') || 'all';
            const discoverSearch = text(runtime.ui?.projectDiscoverSearch || '').toLowerCase();
            const discoverTag = text(runtime.ui?.projectDiscoverTag || '').toLowerCase();
            const openId = text(runtime.ui?.activeProjectId || '');
            const currentFaculty = currentFacultyCode();
            const facultyOptions = uniqueStrings(['all', currentFaculty, ...allEntries.flatMap((entry) => entry.facultyCodes || [])]).filter(Boolean);
            const tagOptions = uniqueStrings(allEntries.flatMap((entry) => entry.hashtags || [])).slice(0, 12);
            const matchesBrowse = typeof chrome.socialMatchesBrowseFaculty === 'function'
                ? chrome.socialMatchesBrowseFaculty
                : (entry, faculty) => faculty === 'all' || (entry.facultyCodes || []).includes(faculty);
            const filteredEntries = allEntries.filter((entry) => {
                if (!matchesBrowse(entry, discoverFaculty)) return false;
                if (!portfolioMatchesRoleFilter(entry, discoverRole)) return false;
                if (discoverTag && !(entry.hashtags || []).some((tag) => text(tag).toLowerCase() === discoverTag.replace(/^#/, ''))) return false;
                if (discoverSearch) {
                    const blob = `${entry.title} ${entry.summary} ${entry.description} ${(entry.hashtags || []).join(' ')} ${(entry.skillTags || []).join(' ')} ${displayName(entry.owner)} ${facultyLabel(entry.ownerFacultyCode)}`.toLowerCase();
                    if (!blob.includes(discoverSearch)) return false;
                }
                return true;
            });
            const myEntries = allEntries.filter((entry) => text(entry.ownerUserId) === currentUserId());
            const highlightedOpenId = openId && filteredEntries.some((entry) => entry.id === openId) ? openId : '';
            const editing = text(runtime.ui?.projectEditId || '');
            const hasDraft = Boolean(editing || portfolioDraftExists());
            const portfolioPanelTabs = [
                { tab: 'mine', label: 'My portfolio', helper: 'Upload resume and publish', attrs: 'data-portfolio-tab="mine"' },
                { tab: 'discover', label: 'Discover', helper: 'Browse talent across campus', attrs: 'data-portfolio-tab="discover"' },
                { tab: 'pinned', label: 'Pinned', helper: 'Highlights and your pins', attrs: 'data-portfolio-tab="pinned"' },
            ];
            const pinModel = window.KiuSocialPinModel;
            function renderPortfolioDiscoverCard(entry, index = 0) {
                const owner = entry.owner;
                const isOpen = highlightedOpenId === entry.id;
                const mediaPreview = entry.mediaItems[0] || null;
                const mediaUrl = mediaPreview ? fileUrl(mediaPreview) : '';
                const featured = index === 0 || (index > 0 && index % 5 === 0);
                return `
                                <article class="social-neo-post-card social-neo-entity-card social-portfolio-card lux-soft-chrome home-hover-chip ${isOpen ? 'is-open' : ''} ${featured ? 'is-featured' : ''}">
                                    <div class="social-portfolio-card-head">
                                        <div class="social-neo-person">
                                            ${avatar(owner, 'social-neo-avatar-sm')}
                                            <div>
                                                <strong class="lux-card-copy">${escape(displayName(owner))}</strong>
                                                <div class="social-neo-muted lms-route-meta-12">${escape(roleLabel(owner?.role))} / ${escape(facultyLabel(entry.ownerFacultyCode || currentFaculty))}</div>
                                            </div>
                                        </div>
                                        <div class="social-neo-badge-row">
                                            ${featured ? portfolioPill('<strong>Featured</strong><span>Showcase pick</span>', 'social-portfolio-featured-pill') : ''}
                                            ${portfolioPill(escape(portfolioAudienceLabel(entry.visibilityMode)))}
                                            ${portfolioPill(escape(entry.status === 'published' ? 'Published' : 'Draft'))}
                                            ${portfolioPill(escape(when(entry.updatedAt || entry.createdAt)))}
                                        </div>
                                    </div>
                                    ${mediaUrl && isImage(mediaPreview) ? `<div class="social-portfolio-cover"><img src="${escape(mediaUrl)}" alt="${escape(entry.title)}" onerror="this.closest('.social-portfolio-cover')?.classList.add('is-broken');this.remove();"></div>` : ''}
                                    <div class="social-portfolio-body">
                                        ${renderPortfolioCardTextRail({
                                            entryId: text(entry.id),
                                            dataAttr: 'data-portfolio-title-rail',
                                            ariaLabel: 'Portfolio title',
                                            body: text(entry.title),
                                            railClass: 'social-portfolio-card-title-rail',
                                            controlsClass: 'social-portfolio-card-title-controls',
                                            viewportClass: 'social-portfolio-card-title-viewport',
                                            textClass: 'social-portfolio-card-title lux-card-copy',
                                            textTag: 'h3',
                                        })}
                                        ${renderPortfolioCardTextRail({
                                            entryId: text(entry.id),
                                            dataAttr: 'data-portfolio-summary-rail',
                                            ariaLabel: 'Portfolio summary',
                                            body: isOpen ? (entry.description || entry.summary || 'Portfolio showcase') : (entry.summary || entry.description || 'Portfolio showcase'),
                                            railClass: 'social-portfolio-card-summary-rail',
                                            controlsClass: 'social-portfolio-card-summary-controls',
                                            viewportClass: 'social-portfolio-card-summary-viewport',
                                            textClass: 'social-portfolio-card-summary lux-panel-copy',
                                            textTag: 'p',
                                        })}
                                        <div class="social-neo-badge-row">
                                            ${(entry.facultyCodes || []).slice(0, 3).map((facultyCode) => portfolioPill(escape(facultyLabel(facultyCode)))).join('')}
                                            ${(entry.skillTags || []).slice(0, 4).map((skill) => portfolioPill(escape(skill))).join('')}
                                            ${(entry.hashtags || []).slice(0, 4).map((tag) => `<button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="portfolio-filter-tag" data-tag="${escape(text(tag).toLowerCase())}">#${escape(text(tag).replace(/^#/, ''))}</button>`).join('')}
                                        </div>
                                    </div>
                                    ${isOpen ? `
                                        <div class="social-portfolio-expanded">
                                            ${(() => {
                                                const safePortfolioLinks = entry.externalLinks.filter((link) => getSafeSocialExternalUrl(link?.url));
                                                return safePortfolioLinks.length ? `
                                                <div class="social-portfolio-links">
                                                    ${safePortfolioLinks.map((link) => {
                                                        const safeLinkUrl = getSafeSocialExternalUrl(link?.url);
                                                        return `<a class="social-portfolio-link" href="${escape(safeLinkUrl)}" target="_blank" rel="noopener noreferrer">${escape(link.label || safeLinkUrl)} <i class="fas fa-arrow-up-right-from-square"></i></a>`;
                                                    }).join('')}
                                                </div>
                                            ` : '';
                                            })()}
                                            ${entry.mediaItems.length > 1 ? `
                                                <div class="social-portfolio-media-strip">
                                                    ${entry.mediaItems.slice(0, 6).map((item) => {
                                                        const url = fileUrl(item);
                                                        if (url && isImage(item)) return `<img src="${escape(url)}" alt="${escape(text(item.name || entry.title))}" onerror="this.remove();">`;
                                                        return portfolioPill(escape(text(item.name || 'Attachment')));
                                                    }).join('')}
                                                </div>
                                            ` : ''}
                                        </div>
                                    ` : ''}
                                    <div class="social-portfolio-actions">
                                        ${pinModel ? `<div class="social-portfolio-card-pin">${pinModel.renderModulePinActions('portfolio', entry.id, { canCuratorPin: pinModel.viewerCanCuratorPin('portfolio', entry) })}</div>` : ''}
                                        ${entry.isPortfolioDocument ? `
                                            ${(() => {
                                                const resumeUrl = entry.resume ? fileUrl(entry.resume) : (entry.mediaItems[0] ? fileUrl(entry.mediaItems[0]) : '');
                                                return resumeUrl
                                                    ? `<a class="lux-secondary-btn" href="${escape(resumeUrl)}" target="_blank" rel="noopener noreferrer"><i class="fas fa-file-pdf"></i> View resume</a>`
                                                    : `<button class="lux-secondary-btn" type="button" data-action="portfolio-doc-open" data-user-id="${escape(entry.ownerUserId)}" data-project-id="${escape(text(entry.id))}">View portfolio</button>`;
                                            })()}
                                            ${(Array.isArray(entry.extras) && entry.extras.length) ? `
                                                <div class="social-portfolio-extras">
                                                    ${entry.extras.slice(0, 4).map((extra) => portfolioPill(escape(text(extra.title || extra.kind || 'Extra')))).join('')}
                                                </div>
                                            ` : ''}
                                            ${entry.canEdit ? `<button class="lux-primary-btn" type="button" data-action="portfolio-create-open"><i class="fas fa-pen"></i> Edit portfolio</button>` : `<button class="lux-primary-btn" type="button" data-action="portfolio-contact" data-project-id="${escape(entry.id)}" data-user-id="${escape(entry.ownerUserId)}"><i class="fas fa-envelope"></i> Message creator</button>`}
                                        ` : `
                                            <button class="lux-secondary-btn" type="button" data-action="${isOpen ? 'projects-back' : 'project-open'}" data-project-id="${escape(entry.id)}">${isOpen ? 'Hide details' : 'Open entry'}</button>
                                            ${entry.canEdit ? `<button class="lux-primary-btn" type="button" data-action="portfolio-edit" data-project-id="${escape(entry.id)}"><i class="fas fa-pen"></i> Edit</button>` : `<button class="lux-primary-btn" type="button" data-action="portfolio-contact" data-project-id="${escape(entry.id)}" data-user-id="${escape(entry.ownerUserId)}"><i class="fas fa-envelope"></i> Message creator</button>`}
                                            ${entry.canEdit ? `<button class="lux-secondary-btn" type="button" data-action="portfolio-delete" data-project-id="${escape(entry.id)}"><i class="fas fa-trash"></i> Remove</button>` : ''}
                                        `}
                                    </div>
                                </article>
                            `;
            }
            const discoverFeedMarkup = portfolioPanelTab === 'pinned'
                ? (pinModel
                    ? pinModel.renderPinnedSections('portfolio', pinModel.partitionPinnedTab('portfolio', filteredEntries), (entry) => renderPortfolioDiscoverCard(entry), 'No pinned portfolio entries yet.')
                    : `<div class="social-neo-empty social-neo-portfolio-feed-empty">No pinned portfolio entries yet.</div>`)
                : filteredEntries.length ? (pinModel ? pinModel.sortWithCuratorPins('portfolio', filteredEntries) : filteredEntries).map((entry, index) => renderPortfolioDiscoverCard(entry, index)).join('') : `<div class="social-neo-empty social-neo-portfolio-feed-empty">No portfolio entries matched the current filters.</div>`;
            const panelBodyMarkup = portfolioPanelTab === 'mine'
                ? renderMyPortfolioPanel()
                : `<div class="social-portfolio-feed">${discoverFeedMarkup}</div>`;
            return `
                <div class="social-neo-stack social-neo-portfolio-shell social-neo-portfolio-shell--merged">
                    ${renderPortfolioHero(runtime, {
                        canCreate,
                        allEntries,
                        myEntries,
                        tagOptions,
                        facultyOptions,
                        portfolioPanelTab,
                        portfolioPanelTabs,
                        discoverFaculty,
                        discoverRole,
                        discoverSearch: text(runtime.ui?.projectDiscoverSearch || ''),
                        discoverTag,
                        editing,
                        hasDraft,
                        bodyHtml: panelBodyMarkup,
                    })}
                    ${renderPortfolioCustomBuilderOverlay()}
                </div>
            `;
        }


        return {
            renderPortfolioHero,
            renderPortfolioCreateDialog,
            renderMyPortfolioPanel,
            renderPortfolioEditorDialog,
            renderPortfolioViewerDialog,
            renderPortfolioCustomBuilderOverlay,
            renderPortfolioProfileBlock,
            renderProjectsPanel
        };
    }

    window.createKiuSocialWorkspacePortfolioUiApi = createKiuSocialWorkspacePortfolioUiApi;
})();
