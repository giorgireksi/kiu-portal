/* Social Research publications panel — catalog, compose, reader. */
(function initSocialResearchModule() {
    if (window.__KIU_SOCIAL_RESEARCH_MODULE_LOADED) return;
    window.__KIU_SOCIAL_RESEARCH_MODULE_LOADED = true;

    function resolveResearchHook(name) {
        const bag = window.__kiuSocialResearchHooks || {};
        return typeof bag[name] === 'function' ? bag[name] : null;
    }

    function state(...a) {
        const fn = resolveResearchHook('state');
        if (fn) return fn(...a);
        if (typeof window.getPortalSocialRuntimeState === 'function') {
            return window.getPortalSocialRuntimeState() || { ui: {}, social: {} };
        }
        return { ui: {}, social: {} };
    }
    function currentUser(...a) { return (resolveResearchHook('currentUser') || (() => null))(...a); }
    function currentUserId(...a) { return (resolveResearchHook('currentUserId') || (() => ''))(...a); }
    function text(...a) {
        const fn = resolveResearchHook('text');
        return fn ? fn(...a) : String(a[0] == null ? '' : a[0]).trim();
    }
    function escape(...a) {
        const fn = resolveResearchHook('escape');
        if (fn) return fn(...a);
        return String(a[0] == null ? '' : a[0])
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    function when(...a) { return (resolveResearchHook('when') || text)(...a); }
    function controlId(...a) { return (resolveResearchHook('controlId') || ((id) => id))(...a); }
    function openDialog(...a) {
        const fn = resolveResearchHook('openDialog')
            || window.__kiuOpenSocialDialog
            || window.openSocialDialog;
        if (typeof fn === 'function') return fn(...a);
        console.error('[Social] research openDialog hook missing — cannot open Publish dialog');
        if (typeof window.setPortalSocialFlash === 'function') {
            window.setPortalSocialFlash('Could not open the research composer.', 'danger');
        }
        return undefined;
    }
    function closeDialog(...a) {
        const fn = resolveResearchHook('closeDialog')
            || window.__kiuCloseSocialDialog
            || window.closeSocialDialog;
        if (typeof fn === 'function') return fn(...a);
        return undefined;
    }
    function setPanel(...a) { return (resolveResearchHook('setPanel') || (() => {}))(...a); }
    function renderSocialPageNow(...a) {
        const fn = resolveResearchHook('renderSocialPageNow')
            || window.renderSocialPageNow
            || window.__kiuSocialLiteRenderPage;
        return typeof fn === 'function' ? fn(...a) : undefined;
    }
    function withBusy(...a) {
        const fn = resolveResearchHook('withBusy');
        return fn ? fn(...a) : (typeof a[0] === 'function' ? a[0]() : undefined);
    }
    function invalidateSocialRenderCache(...a) {
        return (resolveResearchHook('invalidateSocialRenderCache') || (() => {}))(...a);
    }
    function createPortalSocialResearch(...a) {
        return (resolveResearchHook('createPortalSocialResearch') || window.createPortalSocialResearch)?.(...a);
    }
    function togglePortalSocialResearchSave(...a) {
        return (resolveResearchHook('togglePortalSocialResearchSave') || window.togglePortalSocialResearchSave)?.(...a);
    }
    function deletePortalSocialResearch(...a) {
        return (resolveResearchHook('deletePortalSocialResearch') || window.deletePortalSocialResearch)?.(...a);
    }
    function fileUrl(...a) {
        return (resolveResearchHook('fileUrl') || window.resolvePortalSocialFileUrl || ((v) => v))(...a);
    }
    function addPortalSocialToast(...a) {
        return (resolveResearchHook('addPortalSocialToast') || window.addPortalSocialToast || (() => {}))(...a);
    }

    const RESEARCH_TOPICS = [
        'Research',
        'Working paper',
        'Preprint',
        'Course essay',
        'Capstone',
        'Lab note',
        'Literature review',
        'Case study'
    ];

    function publications() {
        return Array.isArray(state()?.social?.researchPublications)
            ? state().social.researchPublications
            : [];
    }

    function isStaffRole(role) {
        return ['professor', 'ta', 'admin', 'student_service'].includes(text(role).toLowerCase());
    }

    function isAdminRole(role) {
        return text(role).toLowerCase() === 'admin';
    }

    function defaultLaneForUser() {
        return isStaffRole(currentUser()?.role) ? 'faculty' : 'student';
    }

    function resolveAuthorLane(requested) {
        const role = currentUser()?.role;
        if (!isStaffRole(role)) return 'student';
        if (isAdminRole(role) && text(requested).toLowerCase() === 'student') return 'student';
        return 'faculty';
    }

    function activeResearchTab() {
        const tab = text(state()?.ui?.researchTab || 'faculty').toLowerCase();
        if (tab === 'student' || tab === 'mine') return tab;
        return 'faculty';
    }

    function researchById(id) {
        const needle = text(id);
        return publications().find((item) => text(item?.id) === needle) || null;
    }

    function filterPublicationsForTab(tab) {
        const ui = state()?.ui || {};
        const search = text(ui.researchSearch || '').toLowerCase();
        const format = text(ui.researchFormat || 'all').toLowerCase();
        const faculty = text(ui.researchFaculty || '').toLowerCase();
        const userId = text(currentUserId?.() || '');

        return publications().filter((item) => {
            if (tab === 'mine') {
                if (!userId) return false;
                return text(item.authorUserId) === userId
                    || (Array.isArray(item.coAuthorIds) && item.coAuthorIds.map(text).includes(userId));
            }
            if (text(item.status) !== 'published') return false;
            if (tab === 'faculty') return text(item.authorLane) === 'faculty';
            if (tab === 'student') return text(item.authorLane) === 'student';
            return false;
        }).filter((item) => {
            if (format === 'article' || format === 'pdf') {
                return text(item.format).toLowerCase() === format;
            }
            return true;
        }).filter((item) => {
            if (!faculty || faculty === 'all') return true;
            return text(item.facultyCode).toLowerCase() === faculty;
        }).filter((item) => {
            if (!search) return true;
            const hay = [
                item.title,
                item.abstract,
                item.bodyText,
                item.authorName,
                ...(Array.isArray(item.topics) ? item.topics : [])
            ].map((part) => text(part).toLowerCase()).join(' ');
            return hay.includes(search);
        });
    }

    function laneLabel(lane) {
        return text(lane) === 'student' ? 'Student Research' : 'Faculty & Staff';
    }

    function formatLabel(format) {
        return text(format).toLowerCase() === 'pdf' ? 'PDF' : 'Article';
    }

    function readingMeta(item) {
        if (text(item?.format).toLowerCase() === 'pdf') {
            const pages = Number(item?.pdf?.pageCount || 0);
            return pages > 0 ? `${pages}p` : 'PDF';
        }
        const words = text(item?.bodyText || item?.abstract || '').split(/\s+/).filter(Boolean).length;
        const minutes = Math.max(1, Math.round(words / 180));
        return `${minutes} min`;
    }

    function dateLabel(value) {
        const raw = text(value);
        if (!raw) return '';
        const date = new Date(raw);
        if (Number.isNaN(date.getTime())) return raw.slice(0, 10);
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
    }

    function facultyOptions() {
        const codes = new Set();
        publications().forEach((item) => {
            const code = text(item.facultyCode);
            if (code) codes.add(code);
        });
        const current = text(currentUser()?.facultyCode || currentUser()?.faculty || '');
        if (current) codes.add(current);
        return [...codes].sort();
    }

    function ensureResearchDraft() {
        const runtime = state();
        runtime.ui = runtime.ui || {};
        if (!runtime.ui.researchDraft || typeof runtime.ui.researchDraft !== 'object') {
            runtime.ui.researchDraft = {
                format: 'article',
                authorLane: defaultLaneForUser(),
                title: '',
                abstract: '',
                bodyText: '',
                topics: 'Research',
                facultyCode: text(currentUser()?.facultyCode || currentUser()?.faculty || ''),
                doiOrUrl: '',
                courseCode: '',
                advisorName: '',
                pdfFile: null,
                pdfMeta: null
            };
        }
        return runtime.ui.researchDraft;
    }

    function renderResearchHero(items) {
        const tab = activeResearchTab();
        const all = publications();
        const facultyCount = all.filter((item) => text(item.authorLane) === 'faculty' && text(item.status) === 'published').length;
        const studentCount = all.filter((item) => text(item.authorLane) === 'student' && text(item.status) === 'published').length;
        const mineCount = filterPublicationsForTab('mine').length;
        const tabs = [
            { tab: 'faculty', label: 'Faculty & Staff', helper: 'Scholarship stream', icon: 'fa-chalkboard-user', count: facultyCount },
            { tab: 'student', label: 'Student Research', helper: 'Separate student lane', icon: 'fa-graduation-cap', count: studentCount },
            { tab: 'mine', label: 'Mine', helper: 'Drafts & published', icon: 'fa-user', count: mineCount }
        ];
        const kicker = tab === 'student'
            ? 'Student papers and course research — kept separate from faculty.'
            : tab === 'mine'
                ? 'Your drafts and published research items.'
                : 'Faculty and staff scholarship for the campus.';

        return `
            <section class="social-neo-card social-neo-research-hero home-hover-chip">
                <div class="social-neo-research-hero-head">
                    <div class="social-neo-research-hero-copy">
                        <span class="social-neo-overline lux-section-kicker">Research</span>
                        <strong class="lux-card-title social-neo-research-title">Papers, articles &amp; PDFs</strong>
                        <p class="lux-panel-copy social-neo-research-copy home-hover-chip">${escape(kicker)}</p>
                    </div>
                    <div class="social-neo-research-hero-actions">
                        <button class="lux-primary-btn" type="button" data-action="research-create-open">
                            <i class="fas fa-pen"></i> Publish
                        </button>
                    </div>
                </div>
                <div class="social-neo-research-hero-stats home-hover-chip">
                    <article class="social-neo-research-stat social-neo-events-hero-stat lux-strip-card surface-card lux-soft-chrome home-hover-chip"><strong>${facultyCount}</strong><span>Faculty</span></article>
                    <article class="social-neo-research-stat social-neo-events-hero-stat lux-strip-card surface-card lux-soft-chrome home-hover-chip"><strong>${studentCount}</strong><span>Student</span></article>
                    <article class="social-neo-research-stat social-neo-events-hero-stat lux-strip-card surface-card lux-soft-chrome home-hover-chip"><strong>${mineCount}</strong><span>Mine</span></article>
                    <article class="social-neo-research-stat social-neo-events-hero-stat lux-strip-card surface-card lux-soft-chrome home-hover-chip"><strong>${items.length}</strong><span>Showing</span></article>
                </div>
                <div class="social-neo-research-tabs" role="tablist" aria-label="Research lanes">
                    ${tabs.map((entry) => `
                        <button class="lux-secondary-btn social-neo-research-tab ${tab === entry.tab ? 'is-focused' : ''}" type="button"
                            data-action="panel-research" data-research-tab="${escape(entry.tab)}"
                            aria-pressed="${tab === entry.tab ? 'true' : 'false'}">
                            <span class="social-neo-research-tab-icon"><i class="fas ${escape(entry.icon)}"></i></span>
                            <span class="social-neo-research-tab-copy">
                                <strong>${escape(entry.label)}</strong>
                                <small>${escape(entry.helper)} · ${entry.count}</small>
                            </span>
                        </button>
                    `).join('')}
                </div>
            </section>
        `;
    }

    function renderResearchFilters() {
        const ui = state()?.ui || {};
        const searchId = typeof controlId === 'function' ? controlId('research-search') : 'research-search';
        const faculties = facultyOptions();
        return `
            <div class="social-neo-research-toolbar home-hover-chip">
                <label class="social-neo-research-filter">
                    <span class="lux-section-kicker">Search</span>
                    <input class="social-neo-input lux-control" id="${escape(searchId)}" type="search"
                        placeholder="Search title, author, topic..."
                        data-bind="research-search" value="${escape(ui.researchSearch || '')}" autocomplete="off">
                </label>
                <label class="social-neo-research-filter">
                    <span class="lux-section-kicker">Type</span>
                    <select class="social-neo-select lux-control" data-bind="research-format" data-lux-picker-label="Type">
                        <option value="all" ${text(ui.researchFormat || 'all') === 'all' ? 'selected' : ''}>All types</option>
                        <option value="article" ${text(ui.researchFormat) === 'article' ? 'selected' : ''}>Articles</option>
                        <option value="pdf" ${text(ui.researchFormat) === 'pdf' ? 'selected' : ''}>PDFs</option>
                    </select>
                </label>
                <label class="social-neo-research-filter">
                    <span class="lux-section-kicker">Faculty</span>
                    <select class="social-neo-select lux-control" data-bind="research-faculty" data-lux-picker-label="Faculty">
                        <option value="">All faculties</option>
                        ${faculties.map((code) => `<option value="${escape(code)}" ${text(ui.researchFaculty) === code ? 'selected' : ''}>${escape(code)}</option>`).join('')}
                    </select>
                </label>
            </div>
        `;
    }

    function renderResearchCard(item) {
        const isPdf = text(item.format).toLowerCase() === 'pdf';
        const status = text(item.status) === 'draft' ? '<span class="lux-status-pill home-hover-chip is-warning">Draft</span>' : '';
        return `
            <button class="social-neo-card social-neo-research-card home-hover-chip" type="button"
                data-action="research-reader-open" data-research-id="${escape(item.id)}">
                <div class="social-neo-research-card-top">
                    <span class="lux-status-pill home-hover-chip ${isPdf ? 'is-warning' : 'is-info'}">${escape(formatLabel(item.format))}</span>
                    ${status}
                    <span class="lux-status-pill home-hover-chip is-muted">${escape(laneLabel(item.authorLane))}</span>
                </div>
                <strong class="lux-card-copy social-neo-research-card-title">${escape(item.title || 'Untitled')}</strong>
                <span class="lux-panel-copy social-neo-research-card-meta">
                    ${escape(item.authorName || 'Author')}
                    ${item.facultyCode ? ` · ${escape(item.facultyCode)}` : ''}
                </span>
                ${item.abstract ? `<p class="lux-panel-copy social-neo-research-card-abstract">${escape(item.abstract)}</p>` : ''}
                <span class="lux-panel-copy social-neo-research-card-foot">
                    ${escape(readingMeta(item))}
                    ${item.publishedAt || item.createdAt ? ` · ${escape(dateLabel(item.publishedAt || item.createdAt))}` : ''}
                </span>
            </button>
        `;
    }

    function renderArticleBody(bodyText) {
        const paragraphs = text(bodyText)
            .split(/\n{2,}/)
            .map((block) => text(block))
            .filter(Boolean);
        if (!paragraphs.length) return '<p class="lux-panel-copy">No article body yet.</p>';
        return paragraphs.map((block) => {
            const lines = block.split('\n').map((line) => escape(line)).join('<br>');
            return `<p class="lux-panel-copy social-neo-research-article-p">${lines}</p>`;
        }).join('');
    }

    function renderResearchReader(item) {
        if (!item) return '';
        const isPdf = text(item.format).toLowerCase() === 'pdf';
        const viewMode = text(state()?.ui?.researchPdfViewMode || 'scroll') || 'scroll';
        const pdfUrl = isPdf && typeof fileUrl === 'function'
            ? fileUrl(item.pdf || {}, { forDisplay: true })
            : '';

        return `
            <section class="social-neo-card social-neo-research-reader">
                <div class="social-neo-research-reader-head">
                    <button class="lux-secondary-btn" type="button" data-action="research-reader-close">
                        <i class="fas fa-arrow-left"></i> Back to Research
                    </button>
                    <span class="lux-panel-copy">${escape(laneLabel(item.authorLane))} · ${escape(formatLabel(item.format))} · ${escape(readingMeta(item))}</span>
                </div>
                <div class="social-neo-research-reader-titleblock">
                    <span class="lux-section-kicker">${escape(formatLabel(item.format))}</span>
                    <h1 class="lux-page-title social-neo-research-reader-title">${escape(item.title || 'Untitled')}</h1>
                    <p class="lux-panel-copy">
                        ${escape(item.authorName || 'Author')}
                        ${item.facultyCode ? ` · ${escape(item.facultyCode)}` : ''}
                        ${item.publishedAt || item.createdAt ? ` · ${escape(dateLabel(item.publishedAt || item.createdAt))}` : ''}
                    </p>
                    <div class="social-neo-research-reader-actions">
                        <button class="lux-secondary-btn" type="button" data-action="research-save" data-research-id="${escape(item.id)}">
                            <i class="fas ${item.isSaved ? 'fa-bookmark' : 'fa-bookmark'}"></i> ${item.isSaved ? 'Saved' : 'Save'}
                        </button>
                        ${item.canManage ? `
                            <button class="lux-secondary-btn lux-danger-btn" type="button" data-action="research-delete" data-research-id="${escape(item.id)}">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        ` : ''}
                        ${isPdf && pdfUrl ? `
                            <a class="lux-secondary-btn" href="${escape(pdfUrl)}" download="${escape(item.pdf?.fileName || 'paper.pdf')}">
                                <i class="fas fa-download"></i> Download
                            </a>
                        ` : ''}
                    </div>
                </div>
                ${item.abstract ? `
                    <div class="social-neo-research-abstract">
                        <span class="lux-section-kicker">Abstract</span>
                        <p class="lux-panel-copy">${escape(item.abstract)}</p>
                    </div>
                ` : ''}
                ${isPdf ? `
                    <div class="social-neo-research-pdf-toolbar">
                        <button class="lux-secondary-btn ${viewMode === 'scroll' ? 'is-focused' : ''}" type="button" data-action="research-pdf-mode" data-mode="scroll">Scroll</button>
                        <button class="lux-secondary-btn ${viewMode === 'pages' ? 'is-focused' : ''}" type="button" data-action="research-pdf-mode" data-mode="pages">Pages</button>
                        <button class="lux-secondary-btn" type="button" data-action="research-pdf-zoom" data-delta="-0.1"><i class="fas fa-minus"></i></button>
                        <span class="lux-panel-copy" data-research-pdf-zoom-label>100%</span>
                        <button class="lux-secondary-btn" type="button" data-action="research-pdf-zoom" data-delta="0.1"><i class="fas fa-plus"></i></button>
                        <button class="lux-secondary-btn" type="button" data-action="research-pdf-prev"><i class="fas fa-chevron-left"></i></button>
                        <span class="lux-panel-copy" data-research-pdf-page-label>Page 1</span>
                        <button class="lux-secondary-btn" type="button" data-action="research-pdf-next"><i class="fas fa-chevron-right"></i></button>
                    </div>
                    <div class="social-neo-research-pdf-shell" data-research-pdf-shell="1" data-view-mode="${escape(viewMode)}"
                        data-storage-key="${escape(item.pdf?.storageKey || '')}"
                        data-data-url="${escape(item.pdf?.dataUrl || '')}"
                        data-file-url="${escape(pdfUrl || '')}">
                        <aside class="social-neo-research-pdf-thumbs lux-scrollbar" data-research-pdf-thumbs hidden></aside>
                        <div class="social-neo-research-pdf-viewport lux-scrollbar" data-research-pdf-viewport>
                            <div class="social-neo-research-pdf-pages" data-research-pdf-pages></div>
                        </div>
                    </div>
                ` : `
                    <article class="social-neo-research-article-body">
                        ${renderArticleBody(item.bodyText)}
                    </article>
                `}
                ${item.doiOrUrl || (Array.isArray(item.topics) && item.topics.length) ? `
                    <div class="social-neo-research-meta-strip lux-panel-copy">
                        ${Array.isArray(item.topics) && item.topics.length ? `<span>Topics: ${escape(item.topics.join(', '))}</span>` : ''}
                        ${item.doiOrUrl ? `<span>Link: <a href="${escape(item.doiOrUrl)}" target="_blank" rel="noopener noreferrer">${escape(item.doiOrUrl)}</a></span>` : ''}
                        ${item.courseCode ? `<span>Course: ${escape(item.courseCode)}</span>` : ''}
                        ${item.advisorName ? `<span>Advisor: ${escape(item.advisorName)}</span>` : ''}
                    </div>
                ` : ''}
            </section>
        `;
    }

    function renderResearchCreateDialog(runtime = state()) {
        const draft = ensureResearchDraft();
        draft.authorLane = resolveAuthorLane(draft.authorLane);
        const role = currentUser()?.role;
        const staff = isStaffRole(role);
        const admin = isAdminRole(role);
        const studentLocked = !staff;
        const facultyLocked = staff && !admin;
        const lane = text(draft.authorLane) === 'student' ? 'student' : 'faculty';
        const format = text(draft.format) === 'pdf' ? 'pdf' : 'article';
        return `
            <div class="lux-glass-dialog-backdrop" data-action="dialog-close" role="dialog" aria-modal="true" aria-label="Publish to Research">
            <form class="lux-glass-dialog-card lux-glass-dialog-card--form lux-glass-dialog-card--social-glass social-neo-research-create"
                data-form="research-create" data-action="noop" data-lux-transparency-exempt="1">
                <div class="lux-glass-dialog-head">
                    <div>
                        <span class="lux-section-kicker">Research</span>
                        <strong class="lux-card-title">Publish to Research</strong>
                        <p class="lux-panel-copy">Choose article or PDF. Student and faculty streams stay separate.</p>
                    </div>
                    <button class="lux-secondary-btn" type="button" data-action="dialog-close" aria-label="Close"><i class="fas fa-times"></i></button>
                </div>
                <div class="lux-glass-dialog-body social-neo-research-create-body">
                    <fieldset class="social-neo-research-fieldset">
                        <legend class="lux-section-kicker">Audience lane</legend>
                        ${studentLocked ? `
                            <label class="social-neo-research-choice lux-soft-chrome home-hover-chip is-active">
                                <input type="radio" name="researchLane" value="student" checked disabled>
                                <span><strong>Student Research</strong><small>Locked for student accounts</small></span>
                            </label>
                            <input type="hidden" name="researchLane" value="student">
                        ` : facultyLocked ? `
                            <label class="social-neo-research-choice lux-soft-chrome home-hover-chip is-active">
                                <input type="radio" name="researchLane" value="faculty" checked disabled>
                                <span><strong>Faculty &amp; Staff</strong><small>Professional scholarship stream</small></span>
                            </label>
                            <input type="hidden" name="researchLane" value="faculty">
                        ` : `
                            <label class="social-neo-research-choice lux-soft-chrome home-hover-chip ${lane !== 'student' ? 'is-active' : ''}">
                                <input type="radio" name="researchLane" value="faculty" ${lane !== 'student' ? 'checked' : ''}>
                                <span><strong>Faculty &amp; Staff</strong><small>Professional scholarship stream</small></span>
                            </label>
                            <label class="social-neo-research-choice lux-soft-chrome home-hover-chip ${lane === 'student' ? 'is-active' : ''}">
                                <input type="radio" name="researchLane" value="student" ${lane === 'student' ? 'checked' : ''}>
                                <span><strong>Student Research</strong><small>Separate student lane</small></span>
                            </label>
                        `}
                    </fieldset>
                    <fieldset class="social-neo-research-fieldset">
                        <legend class="lux-section-kicker">Format</legend>
                        <div class="social-neo-research-format-grid">
                            <label class="social-neo-research-format-card lux-soft-chrome home-hover-chip ${format === 'article' ? 'is-active' : ''}">
                                <input type="radio" name="researchFormat" value="article" ${format === 'article' ? 'checked' : ''}>
                                <i class="fas fa-font" aria-hidden="true"></i>
                                <strong>Article</strong>
                                <small>Medium-style long-form</small>
                            </label>
                            <label class="social-neo-research-format-card lux-soft-chrome home-hover-chip ${format === 'pdf' ? 'is-active' : ''}">
                                <input type="radio" name="researchFormat" value="pdf" ${format === 'pdf' ? 'checked' : ''}>
                                <i class="fas fa-file-pdf" aria-hidden="true"></i>
                                <strong>PDF file</strong>
                                <small>Drop or browse</small>
                            </label>
                        </div>
                    </fieldset>
                    <label class="social-neo-research-field">
                        <span class="lux-section-kicker">Title *</span>
                        <input class="social-neo-input lux-control" name="researchTitle" required value="${escape(draft.title || '')}" placeholder="Publication title" autocomplete="off">
                    </label>
                    <div class="social-neo-research-field-grid">
                        <label class="social-neo-research-field">
                            <span class="lux-section-kicker">Faculty</span>
                            <input class="social-neo-input lux-control" name="researchFaculty" value="${escape(draft.facultyCode || '')}" placeholder="e.g. ECON" autocomplete="off">
                        </label>
                        <label class="social-neo-research-field">
                            <span class="lux-section-kicker">Topic</span>
                            <select class="social-neo-select lux-control" name="researchTopic" data-lux-picker-label="Topic">
                                ${RESEARCH_TOPICS.map((topic) => `<option value="${escape(topic)}" ${text(draft.topics) === topic ? 'selected' : ''}>${escape(topic)}</option>`).join('')}
                            </select>
                        </label>
                    </div>
                    <label class="social-neo-research-field">
                        <span class="lux-section-kicker">Abstract</span>
                        <textarea class="social-neo-input lux-control" name="researchAbstract" rows="3" placeholder="Short summary">${escape(draft.abstract || '')}</textarea>
                    </label>
                    ${format === 'article' ? `
                        <label class="social-neo-research-field">
                            <span class="lux-section-kicker">Article body</span>
                            <textarea class="social-neo-input lux-control social-neo-research-body-input" name="researchBody" rows="10" placeholder="Write the long-form article...">${escape(draft.bodyText || '')}</textarea>
                        </label>
                    ` : `
                        <label class="social-neo-research-dropzone lux-soft-chrome home-hover-chip">
                            <span class="lux-section-kicker">PDF file *</span>
                            <input class="social-neo-input lux-control" type="file" name="researchPdfFile" accept="application/pdf,.pdf">
                            <span class="lux-panel-copy" data-research-pdf-filename>${escape(draft.pdfMeta?.fileName || draft.pdfFile?.name || 'Drop PDF here or browse')}</span>
                        </label>
                    `}
                    <label class="social-neo-research-field">
                        <span class="lux-section-kicker">DOI / external link</span>
                        <input class="social-neo-input lux-control" name="researchDoi" value="${escape(draft.doiOrUrl || '')}" placeholder="https://..." autocomplete="off">
                    </label>
                    ${lane === 'student' ? `
                        <div class="social-neo-research-field-grid">
                            <label class="social-neo-research-field">
                                <span class="lux-section-kicker">Course code</span>
                                <input class="social-neo-input lux-control" name="researchCourse" value="${escape(draft.courseCode || '')}" placeholder="e.g. MGT201" autocomplete="off">
                            </label>
                            <label class="social-neo-research-field">
                                <span class="lux-section-kicker">Advisor</span>
                                <input class="social-neo-input lux-control" name="researchAdvisor" value="${escape(draft.advisorName || '')}" placeholder="Optional" autocomplete="off">
                            </label>
                        </div>
                    ` : ''}
                </div>
                <div class="lux-glass-dialog-form-actions lux-glass-dialog-actions">
                    <button class="lux-secondary-btn home-hover-chip" type="submit" name="researchIntent" value="draft">Save draft</button>
                    <button class="lux-primary-btn lux-glass-dialog-submit-btn home-hover-chip" type="submit" name="researchIntent" value="publish"><i class="fas fa-paper-plane"></i> Publish</button>
                </div>
            </form>
            </div>
        `;
    }

    function renderResearchPanel() {
        const readerId = text(state()?.ui?.researchReaderId || '');
        if (readerId) {
            const item = researchById(readerId);
            if (item) {
                return `<div class="social-neo-stack social-neo-research-shell">${renderResearchReader(item)}</div>`;
            }
            state().ui.researchReaderId = '';
        }
        const tab = activeResearchTab();
        const items = filterPublicationsForTab(tab);
        return `
            <div class="social-neo-stack social-neo-research-shell">
                ${renderResearchHero(items)}
                <section class="social-neo-card social-neo-research-catalog home-hover-chip">
                    ${renderResearchFilters()}
                    ${items.length
                        ? `<div class="social-neo-research-grid">${items.map(renderResearchCard).join('')}</div>`
                        : `<div class="lux-empty-state social-neo-research-empty">
                                <i class="fas fa-book-open" aria-hidden="true"></i>
                                <strong class="lux-empty-state__title">No publications in this lane</strong>
                                <span class="lux-empty-state__copy">Publish an article or PDF — student and faculty streams stay separate.</span>
                                <div class="lux-empty-state__action">
                                    <button class="lux-primary-btn" type="button" data-action="research-create-open"><i class="fas fa-pen"></i> Publish</button>
                                </div>
                           </div>`}
                </section>
            </div>
        `;
    }

    function isSocialResearchClickAction(action) {
        const a = text(action);
        return a.startsWith('research-') || a === 'panel-research';
    }

    function handleSocialResearchClick(action, trigger) {
        if (!isSocialResearchClickAction(action)) return false;
        const runtime = state();
        runtime.ui = runtime.ui || {};

        if (action === 'panel-research') {
            const tab = text(trigger?.getAttribute('data-research-tab') || '');
            if (tab === 'faculty' || tab === 'student' || tab === 'mine') {
                runtime.ui.researchTab = tab;
            }
            runtime.ui.researchReaderId = '';
            setPanel('research');
            invalidateSocialRenderCache({ center: true });
            return renderSocialPageNow(tab ? 'research-tab' : 'panel-research');
        }
        if (action === 'research-create-open') {
            ensureResearchDraft();
            return openDialog('research-create', {});
        }
        if (action === 'research-reader-open') {
            runtime.ui.researchReaderId = text(trigger?.getAttribute('data-research-id') || '');
            runtime.ui.researchPdfViewMode = 'scroll';
            runtime.ui.researchPdfZoom = 1;
            runtime.ui.researchPdfPage = 1;
            invalidateSocialRenderCache?.({ center: true });
            const result = renderSocialPageNow('research-reader-open');
            queueMicrotask(() => {
                if (typeof window.mountSocialResearchPdfViewer === 'function') {
                    window.mountSocialResearchPdfViewer();
                }
            });
            return result;
        }
        if (action === 'research-reader-close') {
            runtime.ui.researchReaderId = '';
            invalidateSocialRenderCache?.({ center: true });
            return renderSocialPageNow('research-reader-close');
        }
        if (action === 'research-pdf-mode') {
            runtime.ui.researchPdfViewMode = text(trigger?.getAttribute('data-mode') || 'scroll') || 'scroll';
            invalidateSocialRenderCache?.({ center: true });
            const result = renderSocialPageNow('research-reader-open');
            queueMicrotask(() => window.mountSocialResearchPdfViewer?.());
            return result;
        }
        if (action === 'research-pdf-zoom') {
            const delta = Number(trigger?.getAttribute('data-delta') || 0);
            const next = Math.min(2.5, Math.max(0.6, Number(runtime.ui.researchPdfZoom || 1) + delta));
            runtime.ui.researchPdfZoom = next;
            window.updateSocialResearchPdfZoom?.(next);
            return true;
        }
        if (action === 'research-pdf-prev') {
            window.stepSocialResearchPdfPage?.(-1);
            return true;
        }
        if (action === 'research-pdf-next') {
            window.stepSocialResearchPdfPage?.(1);
            return true;
        }
        if (action === 'research-save') {
            const id = text(trigger?.getAttribute('data-research-id') || '');
            if (!id || typeof togglePortalSocialResearchSave !== 'function') return true;
            return withBusy(async () => {
                await togglePortalSocialResearchSave(id);
                invalidateSocialRenderCache?.({ center: true });
                renderSocialPageNow('research-saved');
            });
        }
        if (action === 'research-delete') {
            const id = text(trigger?.getAttribute('data-research-id') || '');
            if (!id || typeof deletePortalSocialResearch !== 'function') return true;
            if (!window.confirm('Delete this publication?')) return true;
            return withBusy(async () => {
                await deletePortalSocialResearch(id);
                runtime.ui.researchReaderId = '';
                invalidateSocialRenderCache?.({ center: true });
                renderSocialPageNow('research-deleted');
            });
        }
        return false;
    }

    function syncDraftFromForm(form) {
        const draft = ensureResearchDraft();
        const laneInput = form.querySelector('input[name="researchLane"]:checked')
            || form.querySelector('input[name="researchLane"][type="hidden"]');
        const formatInput = form.querySelector('input[name="researchFormat"]:checked');
        draft.authorLane = resolveAuthorLane(laneInput?.value || defaultLaneForUser());
        draft.format = text(formatInput?.value || 'article') === 'pdf' ? 'pdf' : 'article';
        draft.title = text(form.researchTitle?.value || '');
        draft.abstract = text(form.researchAbstract?.value || '');
        draft.bodyText = text(form.researchBody?.value || '');
        draft.facultyCode = text(form.researchFaculty?.value || '');
        draft.topics = text(form.researchTopic?.value || 'Research');
        draft.doiOrUrl = text(form.researchDoi?.value || '');
        draft.courseCode = text(form.researchCourse?.value || '');
        draft.advisorName = text(form.researchAdvisor?.value || '');
        const fileInput = form.querySelector('input[name="researchPdfFile"]');
        if (fileInput?.files?.[0]) {
            draft.pdfFile = fileInput.files[0];
            draft.pdfMeta = { fileName: fileInput.files[0].name, sizeBytes: fileInput.files[0].size };
        }
        return draft;
    }

    function handleSocialResearchSubmit(formType, form, runtime, event) {
        if (formType !== 'research-create') return false;
        event?.preventDefault?.();
        const draft = syncDraftFromForm(form);
        const submitter = event?.submitter;
        const intent = text(submitter?.value || form.researchIntent?.value || 'publish');
        const publish = intent !== 'draft';
        if (!draft.title) {
            addPortalSocialToast?.({ title: 'Title required', text: 'Add a publication title.', icon: 'fa-circle-exclamation' });
            return true;
        }
        if (draft.format === 'pdf' && !draft.pdfFile && !draft.pdfMeta?.storageKey) {
            addPortalSocialToast?.({ title: 'PDF required', text: 'Attach a PDF file.', icon: 'fa-circle-exclamation' });
            return true;
        }
        if (draft.format === 'article' && publish && !draft.bodyText && !draft.abstract) {
            addPortalSocialToast?.({ title: 'Content required', text: 'Add an abstract or article body.', icon: 'fa-circle-exclamation' });
            return true;
        }
        if (typeof createPortalSocialResearch !== 'function') return true;
        return withBusy(async () => {
            await createPortalSocialResearch({
                title: draft.title,
                abstract: draft.abstract,
                bodyText: draft.bodyText,
                format: draft.format,
                authorLane: draft.authorLane,
                facultyCode: draft.facultyCode,
                topics: draft.topics,
                doiOrUrl: draft.doiOrUrl,
                courseCode: draft.courseCode,
                advisorName: draft.advisorName,
                file: draft.pdfFile,
                publish,
                status: publish ? 'published' : 'draft'
            });
            runtime.ui.researchDraft = null;
            closeDialog?.();
            setPanel?.('research');
            invalidateSocialRenderCache?.({ center: true });
            renderSocialPageNow('research-created');
        });
    }

    function handleSocialResearchInput(target) {
        if (!target) return false;
        if (text(target.getAttribute('data-bind')) === 'research-search') {
            state().ui.researchSearch = text(target.value || '');
            renderSocialPageNow('research-input');
            return true;
        }
        if (target.name === 'researchFormat' || target.name === 'researchLane') {
            syncDraftFromForm(target.closest('form'));
            openDialog('research-create', {});
            return renderSocialPageNow('research-create-open');
        }
        if (target.name === 'researchPdfFile' && target.files?.[0]) {
            const draft = ensureResearchDraft();
            draft.pdfFile = target.files[0];
            draft.pdfMeta = { fileName: target.files[0].name, sizeBytes: target.files[0].size };
            const label = target.closest('label')?.querySelector('[data-research-pdf-filename]');
            if (label) label.textContent = target.files[0].name;
            return true;
        }
        return false;
    }

    function handleSocialResearchChange(target) {
        if (!target) return false;
        const bind = text(target.getAttribute('data-bind'));
        if (bind === 'research-format') {
            state().ui.researchFormat = text(target.value || 'all') || 'all';
            renderSocialPageNow('research-input');
            return true;
        }
        if (bind === 'research-faculty') {
            state().ui.researchFaculty = text(target.value || '');
            renderSocialPageNow('research-input');
            return true;
        }
        if (target.name === 'researchFormat' || target.name === 'researchLane') {
            return handleSocialResearchInput(target);
        }
        return false;
    }

    function isSocialResearchSubmitForm(formType) {
        return text(formType) === 'research-create';
    }

    function isSocialResearchInputTarget(el) {
        return Boolean(el?.closest?.('[data-form="research-create"]')
            || el?.getAttribute?.('data-bind') === 'research-search'
            || String(el?.name || '').startsWith('research'));
    }

    function isSocialResearchChangeTarget(el) {
        return Boolean(el?.getAttribute?.('data-bind')?.startsWith?.('research-')
            || String(el?.name || '').startsWith('research'));
    }

    window.renderResearchPanel = renderResearchPanel;
    window.renderResearchCreateDialog = renderResearchCreateDialog;
    window.isSocialResearchClickAction = isSocialResearchClickAction;
    window.handleSocialResearchClick = handleSocialResearchClick;
    window.isSocialResearchSubmitForm = isSocialResearchSubmitForm;
    window.handleSocialResearchSubmit = handleSocialResearchSubmit;
    window.isSocialResearchInputTarget = isSocialResearchInputTarget;
    window.handleSocialResearchInput = handleSocialResearchInput;
    window.isSocialResearchChangeTarget = isSocialResearchChangeTarget;
    window.handleSocialResearchChange = handleSocialResearchChange;
})();
