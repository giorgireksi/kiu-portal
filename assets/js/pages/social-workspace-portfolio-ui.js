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
            roleLabel,
            state,
            text,
            uniqueStrings,
            when
        } = deps;

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
                <button class="social-neo-btn social-neo-btn-primary social-neo-portfolio-hero-create-btn" type="button" data-action="portfolio-create-open">
                    <i class="fas fa-pen"></i> ${hasDraft ? 'Continue my portfolio' : 'Build my portfolio'}
                </button>
                ${hasDraft ? `<span class="social-neo-pill social-portfolio-draft-pill"><strong>Draft saved</strong><span>Ready to publish</span></span>` : ''}
            ` : '';
            const bodyHtml = text(metrics.bodyHtml || '');
            const merged = Boolean(bodyHtml);
            const discoverFilters = portfolioPanelTab === 'discover' ? `
                <div class="social-neo-portfolio-hero-discover">
                    <div class="social-portfolio-toolbar-head">
                        <div>
                            <strong>Discover talent across campus</strong>
                            <span>Filter by faculty, audience, and tags without losing the social feel of the feed.</span>
                        </div>
                    </div>
                    <div class="social-portfolio-search-row">
                        <label class="social-portfolio-search">
                            <i class="fas fa-search"></i>
                            <input class="social-neo-input" type="search" name="projectDiscoverSearch" value="${escape(discoverSearch)}" placeholder="Search projects, skills, hashtags, people, or faculties">
                        </label>
                        <select class="social-neo-select" name="projectDiscoverFaculty" data-lux-picker>
                            ${facultyOptions.map((facultyCode) => `<option value="${escape(facultyCode)}" ${discoverFaculty === facultyCode ? 'selected' : ''}>${escape(facultyCode === 'all' ? 'All faculties' : facultyLabel(facultyCode))}</option>`).join('')}
                        </select>
                        <select class="social-neo-select" name="projectDiscoverRole" data-lux-picker>
                            ${PORTFOLIO_DISCOVER_ROLE_TARGETS.map(([value, label]) => `<option value="${escape(value)}" ${discoverRole === value ? 'selected' : ''}>${escape(label)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="social-portfolio-tag-row">
                        <button class="social-neo-btn ${!discoverTag ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'} social-neo-btn-sm" type="button" data-action="portfolio-filter-tag" data-tag="">All tags</button>
                        ${tagOptions.map((tag) => `
                            <button class="social-neo-btn ${discoverTag === text(tag).toLowerCase() ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'} social-neo-btn-sm" type="button" data-action="portfolio-filter-tag" data-tag="${escape(text(tag).toLowerCase())}">
                                #${escape(text(tag).replace(/^#/, ''))}
                            </button>
                        `).join('')}
                    </div>
                </div>
            ` : '';
            return `
                <section class="social-neo-card social-neo-portfolio-hero social-neo-community-panel social-neo-community-panel--portfolio${merged ? ' is-merged' : ''}">
                    <div class="social-neo-portfolio-hero-head">
                        <div class="social-neo-portfolio-hero-actions">
                            ${createCta}
                            <button class="social-neo-btn social-neo-btn-ghost social-neo-portfolio-hero-profile-btn" type="button" data-action="profile-portfolio-open">
                                <i class="fas fa-id-card"></i> Open profile portfolio
                            </button>
                        </div>
                    </div>
                    <div class="social-neo-portfolio-hero-stats">
                        ${stats.map((stat) => `
                            <article class="social-neo-portfolio-hero-stat social-neo-events-hero-stat lux-strip-card surface-card">
                                <strong>${escape(String(stat.value))}</strong>
                                <span>${escape(stat.label)}</span>
                            </article>
                        `).join('')}
                    </div>
                    <div class="social-neo-portfolio-hero-tabs-row">
                        <div class="portfolio-panel-tabs social-neo-portfolio-hero-tabs" role="tablist" aria-label="Portfolio views">
                            ${portfolioPanelTabs.map((tab) => `
                                <button class="social-neo-btn portfolio-panel-tab ${portfolioPanelTab === tab.tab ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'}" type="button" role="tab" data-action="portfolio-panel-tab" ${tab.attrs} aria-selected="${portfolioPanelTab === tab.tab ? 'true' : 'false'}" aria-pressed="${portfolioPanelTab === tab.tab ? 'true' : 'false'}">
                                    <strong>${escape(tab.label)}</strong>
                                    <span>${escape(tab.helper)}</span>
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
                : [currentFaculty];
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
            return `<div class="social-neo-dialog-backdrop" data-action="dialog-close">
                <form class="social-neo-dialog-card social-neo-dialog-card--form social-neo-dialog-card--portfolio-create social-neo-dialog-card--lms-create" data-form="${editing ? 'portfolio-settings' : 'create-portfolio'}" ${editing ? `data-project-id="${escape(editing)}"` : ''} data-action="noop" data-lux-transparency-exempt="1">
                    ${neoHead(title, subtitle, { icon: 'fas fa-briefcase' })}
                    <div class="social-neo-dialog-body social-neo-dialog-body--portfolio-create">
                        <section class="social-neo-dialog-portfolio-create-section">
                            <div class="social-neo-form-grid social-neo-form-grid-2">
                                ${neoField('Title', `<input class="social-neo-input" type="text" name="projectName" value="${escape(text(runtime.ui?.projectName || ''))}" placeholder="Sustainable marketplace app" required>`)}
                                ${neoField('Short summary', `<input class="social-neo-input" type="text" name="projectSummary" value="${escape(text(runtime.ui?.projectSummary || ''))}" placeholder="Two-line hook that makes people stop scrolling">`)}
                            </div>
                            ${neoField('Description', `<textarea class="social-neo-textarea" name="projectDescription" rows="4" placeholder="Explain what you built, why it matters, what stage it is in, and what kind of collaboration or opportunity you want.">${escape(text(runtime.ui?.projectDescription || ''))}</textarea>`)}
                            <div class="social-neo-form-grid social-neo-form-grid-3">
                                ${neoField('Hashtags', `<input class="social-neo-input" type="text" name="projectHashtags" value="${escape(text(runtime.ui?.projectHashtags || ''))}" placeholder="ai, startup, uiux">`)}
                                ${neoField('Skill tags', `<input class="social-neo-input" type="text" name="projectSkillTags" value="${escape(text(runtime.ui?.projectSkillTags || ''))}" placeholder="react, branding, research">`)}
                                ${neoField('Context', `<input class="social-neo-input" type="text" name="projectCourseTag" value="${escape(text(runtime.ui?.projectCourseTag || ''))}" placeholder="Capstone, thesis, startup, freelance">`)}
                            </div>
                            ${neoField('External links', `<textarea class="social-neo-textarea" name="projectExternalLinks" rows="3" placeholder="Prototype | https://...&#10;GitHub | https://...">${escape(text(runtime.ui?.projectExternalLinks || ''))}</textarea>`)}
                            <div class="social-neo-form-grid social-neo-form-grid-3">
                                <label class="social-neo-dialog-field">
                                    <span class="social-neo-label">Status</span>
                                    <select class="social-neo-select" name="projectStatus" data-lux-picker>
                                        ${['draft', 'published'].map((status) => `<option value="${escape(status)}" ${text(runtime.ui?.projectStatus || 'draft') === status ? 'selected' : ''}>${escape(status)}</option>`).join('')}
                                    </select>
                                </label>
                                <label class="social-neo-dialog-field">
                                    <span class="social-neo-label">Audience</span>
                                    <select class="social-neo-select" name="projectVisibility" data-lux-picker>
                                        ${roleTargets.map(([value, label]) => `<option value="${escape(value)}" ${text(runtime.ui?.projectVisibility || 'all_logged_in') === value ? 'selected' : ''}>${escape(label)}</option>`).join('')}
                                    </select>
                                </label>
                                ${neoField('Media upload', `<input class="social-neo-input" type="file" name="projectMediaFile" accept="image/*,.pdf,.ppt,.pptx,.doc,.docx,.zip,.fig,.sketch">`)}
                            </div>
                            <div class="social-neo-dialog-portfolio-create-faculties">
                                <span class="social-neo-label">Faculty tags</span>
                                <div class="social-neo-badge-row social-neo-badge-row-mt-8">
                                    ${uniqueStrings([currentFaculty, 'BUS', 'CS', 'LAW', 'MED', 'ARTS', ...facultyOptions.filter((code) => code !== 'all')]).map((facultyCode) => `
                                        <button class="social-neo-btn ${draftFaculties.includes(facultyCode) ? 'social-neo-btn-primary' : 'social-neo-btn-ghost'} social-neo-btn-sm" type="button" data-action="project-faculty-toggle" data-faculty="${escape(facultyCode)}">${escape(facultyCode)}</button>
                                    `).join('')}
                                </div>
                            </div>
                            ${customAudienceOpen ? `
                                <div class="social-neo-form-grid social-neo-form-grid-2">
                                    ${neoField('Custom roles', `<input class="social-neo-input" type="text" name="projectVisibleRolesRaw" value="${escape((runtime.ui?.projectVisibleRoles || []).join(', '))}" placeholder="student, professor, ta">`)}
                                    ${neoField('Custom faculties', `<input class="social-neo-input" type="text" name="projectVisibleFacultyCodesRaw" value="${escape((runtime.ui?.projectVisibleFacultyCodes || []).join(', '))}" placeholder="BUS, CS, LAW">`)}
                                    ${neoField('Allowed user IDs', `<input class="social-neo-input" type="text" name="projectVisibleUserIds" value="${escape(text(runtime.ui?.projectVisibleUserIds || ''))}" placeholder="student-001, professor-014">`)}
                                    ${neoField('Hidden user IDs', `<input class="social-neo-input" type="text" name="projectHiddenUserIds" value="${escape(text(runtime.ui?.projectHiddenUserIds || ''))}" placeholder="Optional direct exclusions">`)}
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

        function renderPortfolioEditorDialog() {
            return `<div class="social-neo-dialog-backdrop" data-action="dialog-close"><div class="social-neo-dialog-card social-neo-dialog-card--portfolio-editor" data-action="noop" data-lux-transparency-exempt="1">
                    <div class="social-neo-dialog-editor-topbar">
                        <button class="social-neo-btn social-neo-btn-ghost social-neo-dialog-close-btn" type="button" data-action="dialog-close" aria-label="Close"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="social-neo-dialog-body social-neo-dialog-body--portfolio-editor">
                        ${renderMyPortfolioPanel()}
                        ${renderPortfolioCustomBuilderOverlay()}
                    </div>
                </div>
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
                            <span class="social-neo-pill"><strong>${escape(items.length)}</strong><span>Visible</span></span>
                            ${isOwn ? `<button class="social-neo-btn social-neo-btn-primary social-neo-btn-sm" type="button" data-action="profile-portfolio-open"><i class="fas fa-briefcase"></i> Open Portfolio</button>` : ''}
                        </div>
                    </div>
                    ${items.length ? `
                        <div class="social-portfolio-mini-grid">
                            ${items.map((entry) => `
                                <article class="social-portfolio-mini-card">
                                    <div class="social-neo-badge-row">
                                        <span class="social-neo-pill">${escape(portfolioAudienceLabel(entry.visibilityMode))}</span>
                                        <span class="social-neo-pill">${escape(entry.status)}</span>
                                    </div>
                                    <strong>${escape(entry.title)}</strong>
                                    <p>${escape(entry.summary || entry.description || 'Portfolio entry')}</p>
                                    <div class="social-neo-inline social-neo-inline-between-gap-8-wrap">
                                        <div class="social-neo-badge-row">${entry.hashtags.slice(0, 2).map((tag) => `<span class="social-neo-pill">#${escape(tag.replace(/^#/, ''))}</span>`).join('')}</div>
                                        <button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="project-open" data-project-id="${escape(entry.id)}">Open</button>
                                    </div>
                                </article>
                            `).join('')}
                        </div>
                    ` : `<div class="social-neo-empty">Build your first portfolio card to share work, ideas, and startup-ready projects with the university community.</div>`}
                </section>
            `;
        }

        function renderProjectsPanel() {
            const runtime = state();
            const portfolioPanelTab = text(runtime.ui?.portfolioPanelTab || 'discover') || 'discover';
            const viewer = currentUser();
            const canCreate = Boolean(viewer);
            const allEntries = portfolioEntriesForViewer();
            const discoverFaculty = text(runtime.ui?.projectDiscoverFaculty || currentFacultyCode()) || currentFacultyCode();
            const discoverRole = text(runtime.ui?.projectDiscoverRole || 'all') || 'all';
            const discoverSearch = text(runtime.ui?.projectDiscoverSearch || '').toLowerCase();
            const discoverTag = text(runtime.ui?.projectDiscoverTag || '').toLowerCase();
            const openId = text(runtime.ui?.activeProjectId || '');
            const currentFaculty = currentFacultyCode();
            const facultyOptions = uniqueStrings(['all', currentFaculty, ...allEntries.flatMap((entry) => entry.facultyCodes || [])]).filter(Boolean);
            const tagOptions = uniqueStrings(allEntries.flatMap((entry) => entry.hashtags || [])).slice(0, 12);
            const filteredEntries = allEntries.filter((entry) => {
                if (discoverFaculty !== 'all' && !(entry.facultyCodes || []).includes(discoverFaculty)) return false;
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
                { tab: 'mine', label: 'My portfolio', helper: 'Build and publish your showcase', attrs: 'data-portfolio-tab="mine"' },
                { tab: 'discover', label: 'Discover', helper: 'Browse talent across campus', attrs: 'data-portfolio-tab="discover"' },
            ];
            const discoverFeedMarkup = filteredEntries.length ? filteredEntries.map((entry, index) => {
                            const owner = entry.owner;
                            const isOpen = highlightedOpenId === entry.id;
                            const mediaPreview = entry.mediaItems[0] || null;
                            const mediaUrl = mediaPreview ? fileUrl(mediaPreview) : '';
                            const featured = index === 0 || (index > 0 && index % 5 === 0);
                            return `
                                <article class="social-neo-post-card social-portfolio-card ${isOpen ? 'is-open' : ''} ${featured ? 'is-featured' : ''}">
                                    <div class="social-portfolio-card-head">
                                        <div class="social-neo-person">
                                            ${avatar(owner, 'social-neo-avatar-sm')}
                                            <div>
                                                <strong>${escape(displayName(owner))}</strong>
                                                <div class="social-neo-muted">${escape(roleLabel(owner?.role))} / ${escape(facultyLabel(entry.ownerFacultyCode || currentFaculty))}</div>
                                            </div>
                                        </div>
                                        <div class="social-neo-badge-row">
                                            ${featured ? `<span class="social-neo-pill social-portfolio-featured-pill"><strong>Featured</strong><span>Showcase pick</span></span>` : ''}
                                            <span class="social-neo-pill">${escape(portfolioAudienceLabel(entry.visibilityMode))}</span>
                                            <span class="social-neo-pill">${escape(entry.status === 'published' ? 'Published' : 'Draft')}</span>
                                            <span class="social-neo-pill">${escape(when(entry.updatedAt || entry.createdAt))}</span>
                                        </div>
                                    </div>
                                    ${mediaUrl && isImage(mediaPreview) ? `<div class="social-portfolio-cover"><img src="${escape(mediaUrl)}" alt="${escape(entry.title)}"></div>` : ''}
                                    <div class="social-portfolio-body">
                                        <h3>${escape(entry.title)}</h3>
                                        <p>${escape(isOpen ? (entry.description || entry.summary || 'Portfolio showcase') : (entry.summary || entry.description || 'Portfolio showcase'))}</p>
                                        <div class="social-neo-badge-row">
                                            ${(entry.facultyCodes || []).slice(0, 3).map((facultyCode) => `<span class="social-neo-pill">${escape(facultyLabel(facultyCode))}</span>`).join('')}
                                            ${(entry.skillTags || []).slice(0, 4).map((skill) => `<span class="social-neo-pill">${escape(skill)}</span>`).join('')}
                                            ${(entry.hashtags || []).slice(0, 4).map((tag) => `<button class="social-neo-btn social-neo-btn-ghost social-neo-btn-sm" type="button" data-action="portfolio-filter-tag" data-tag="${escape(text(tag).toLowerCase())}">#${escape(text(tag).replace(/^#/, ''))}</button>`).join('')}
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
                                                        if (url && isImage(item)) return `<img src="${escape(url)}" alt="${escape(text(item.name || entry.title))}">`;
                                                        return `<span class="social-neo-pill">${escape(text(item.name || 'Attachment'))}</span>`;
                                                    }).join('')}
                                                </div>
                                            ` : ''}
                                        </div>
                                    ` : ''}
                                    <div class="social-portfolio-actions">
                                        ${entry.isPortfolioDocument ? `
                                            <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="portfolio-doc-open" data-user-id="${escape(entry.ownerUserId)}">View portfolio</button>
                                            ${entry.canEdit ? `<button class="social-neo-btn social-neo-btn-primary" type="button" data-action="portfolio-create-open"><i class="fas fa-pen"></i> Edit portfolio</button>` : `<button class="social-neo-btn social-neo-btn-primary" type="button" data-action="portfolio-contact" data-project-id="${escape(entry.id)}" data-user-id="${escape(entry.ownerUserId)}"><i class="fas fa-envelope"></i> Message creator</button>`}
                                        ` : `
                                            <button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="${isOpen ? 'projects-back' : 'project-open'}" data-project-id="${escape(entry.id)}">${isOpen ? 'Hide details' : 'Open entry'}</button>
                                            ${entry.canEdit ? `<button class="social-neo-btn social-neo-btn-primary" type="button" data-action="portfolio-edit" data-project-id="${escape(entry.id)}"><i class="fas fa-pen"></i> Edit</button>` : `<button class="social-neo-btn social-neo-btn-primary" type="button" data-action="portfolio-contact" data-project-id="${escape(entry.id)}" data-user-id="${escape(entry.ownerUserId)}"><i class="fas fa-envelope"></i> Message creator</button>`}
                                            ${entry.canEdit ? `<button class="social-neo-btn social-neo-btn-ghost" type="button" data-action="portfolio-delete" data-project-id="${escape(entry.id)}"><i class="fas fa-trash"></i> Remove</button>` : ''}
                                        `}
                                    </div>
                                </article>
                            `;
            }).join('') : `<div class="social-neo-empty social-neo-portfolio-feed-empty">No portfolio entries matched the current filters.</div>`;
            const panelBodyMarkup = portfolioPanelTab === 'mine'
                ? renderMyPortfolioPanel()
                : `<div class="social-portfolio-feed social-project-scroll-list social-project-scroll-list--portfolio">${discoverFeedMarkup}</div>`;
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
            renderPortfolioCustomBuilderOverlay,
            renderPortfolioProfileBlock,
            renderProjectsPanel
        };
    }

    window.createKiuSocialWorkspacePortfolioUiApi = createKiuSocialWorkspacePortfolioUiApi;
})();
