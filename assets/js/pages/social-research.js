/* Social Research publications panel — file deposit catalog + reader. */
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
            window.setPortalSocialFlash('Could not open the research deposit dialog.', 'danger');
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

    const RESEARCH_FILE_ACCEPT = [
        '.pdf', '.ppt', '.pptx', '.doc', '.docx',
        'application/pdf',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ].join(',');

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

    function itemFiles(item) {
        if (Array.isArray(item?.files) && item.files.length) return item.files;
        if (item?.pdf) return [{ ...item.pdf, fileKind: 'pdf' }];
        return [];
    }

    function itemFileKind(item) {
        const kind = text(item?.fileKind || itemFiles(item)[0]?.fileKind || '').toLowerCase();
        if (kind === 'pdf' || kind === 'slides' || kind === 'document' || kind === 'other') return kind;
        if (text(item?.format).toLowerCase() === 'pdf') return 'pdf';
        return itemFiles(item).length ? 'other' : 'other';
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
            if (format === 'pdf' || format === 'slides' || format === 'document') {
                return itemFileKind(item) === format;
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
                ...itemFiles(item).map((file) => file?.fileName),
                ...(Array.isArray(item.topics) ? item.topics : [])
            ].map((part) => text(part).toLowerCase()).join(' ');
            return hay.includes(search);
        });
    }

    function laneLabel(lane) {
        return text(lane) === 'student' ? 'Student Research' : 'Faculty & Staff';
    }

    function fileKindLabel(kind) {
        const value = text(kind).toLowerCase();
        if (value === 'pdf') return 'PDF';
        if (value === 'slides') return 'Slides';
        if (value === 'document') return 'Document';
        return 'File';
    }

    function formatBytes(size) {
        const bytes = Math.max(0, Number(size) || 0);
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${Math.round(bytes / 102.4) / 10} KB`;
        return `${Math.round(bytes / (1024 * 102.4)) / 10} MB`;
    }

    function readingMeta(item) {
        const files = itemFiles(item);
        if (!files.length) {
            if (text(item?.bodyText || item?.bodyHtml || '')) return 'Archive text';
            return 'Deposit';
        }
        if (files.length === 1) {
            const primary = files[0];
            if (itemFileKind(item) === 'pdf') {
                const pages = Number(primary?.pageCount || 0);
                return pages > 0 ? `${pages}p` : 'PDF';
            }
            return formatBytes(primary?.sizeBytes);
        }
        return `${files.length} files`;
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
                authorLane: defaultLaneForUser(),
                title: '',
                abstract: '',
                topics: 'Research',
                facultyCode: text(currentUser()?.facultyCode || currentUser()?.faculty || ''),
                doiOrUrl: '',
                courseCode: '',
                advisorName: '',
                files: [],
                fileMeta: []
            };
        }
        const draft = runtime.ui.researchDraft;
        if (!Array.isArray(draft.files)) draft.files = [];
        if (!Array.isArray(draft.fileMeta)) draft.fileMeta = [];
        return draft;
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
                ? 'Your drafts and published research deposits.'
                : 'Faculty and staff scholarship deposits for the campus.';

        return `
            <section class="social-neo-card social-neo-research-hero home-hover-chip">
                <div class="social-neo-research-hero-head">
                    <div class="social-neo-research-hero-copy">
                        <span class="social-neo-overline lux-section-kicker">Research</span>
                        <strong class="lux-card-title social-neo-research-title">Papers, slides &amp; documents</strong>
                        <p class="lux-panel-copy social-neo-research-copy home-hover-chip">${escape(kicker)}</p>
                    </div>
                    <div class="social-neo-research-hero-actions">
                        <button class="lux-primary-btn" type="button" data-action="research-create-open">
                            <i class="fas fa-upload"></i> Deposit
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
        const format = text(ui.researchFormat || 'all') || 'all';
        return `
            <div class="social-neo-research-toolbar home-hover-chip">
                <label class="social-neo-research-filter">
                    <span class="lux-section-kicker">Search</span>
                    <input class="social-neo-input lux-control" id="${escape(searchId)}" type="search"
                        placeholder="Search title, author, file..."
                        data-bind="research-search" value="${escape(ui.researchSearch || '')}" autocomplete="off">
                </label>
                <label class="social-neo-research-filter">
                    <span class="lux-section-kicker">Type</span>
                    <select class="social-neo-select lux-control" data-bind="research-format" data-lux-picker-label="Type">
                        <option value="all" ${format === 'all' ? 'selected' : ''}>All</option>
                        <option value="pdf" ${format === 'pdf' ? 'selected' : ''}>PDF</option>
                        <option value="slides" ${format === 'slides' ? 'selected' : ''}>Slides</option>
                        <option value="document" ${format === 'document' ? 'selected' : ''}>Documents</option>
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
        const kind = itemFileKind(item);
        const files = itemFiles(item);
        const status = text(item.status) === 'draft' ? '<span class="lux-status-pill home-hover-chip is-warning">Draft</span>' : '';
        const fileHint = files[0]?.fileName || '';
        return `
            <button class="social-neo-card social-neo-research-card home-hover-chip" type="button"
                data-action="research-reader-open" data-research-id="${escape(item.id)}">
                <div class="social-neo-research-card-top">
                    <span class="lux-status-pill home-hover-chip ${kind === 'pdf' ? 'is-warning' : kind === 'slides' ? 'is-info' : 'is-muted'}">${escape(fileKindLabel(kind))}</span>
                    ${status}
                    <span class="lux-status-pill home-hover-chip is-muted">${escape(laneLabel(item.authorLane))}</span>
                </div>
                <strong class="lux-card-copy social-neo-research-card-title">${escape(item.title || 'Untitled')}</strong>
                <span class="lux-panel-copy social-neo-research-card-meta">
                    ${escape(item.authorName || 'Author')}
                    ${item.facultyCode ? ` · ${escape(item.facultyCode)}` : ''}
                </span>
                ${item.abstract ? `<p class="lux-panel-copy social-neo-research-card-abstract">${escape(item.abstract)}</p>` : ''}
                ${fileHint ? `<span class="lux-panel-copy social-neo-research-card-file">${escape(fileHint)}${files.length > 1 ? ` · +${files.length - 1}` : ''}</span>` : ''}
                <span class="lux-panel-copy social-neo-research-card-foot">
                    ${escape(readingMeta(item))}
                    ${item.publishedAt || item.createdAt ? ` · ${escape(dateLabel(item.publishedAt || item.createdAt))}` : ''}
                </span>
            </button>
        `;
    }

    function renderLegacyArchiveBody(item) {
        const html = text(item?.bodyHtml || '');
        if (html) {
            const plain = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            if (plain) return `<p class="lux-panel-copy">${escape(plain)}</p>`;
        }
        const paragraphs = text(item?.bodyText || '')
            .split(/\n{2,}/)
            .map((block) => text(block))
            .filter(Boolean);
        if (!paragraphs.length) return '';
        return paragraphs.map((block) => {
            const lines = block.split('\n').map((line) => escape(line)).join('<br>');
            return `<p class="lux-panel-copy social-neo-research-article-p">${lines}</p>`;
        }).join('');
    }

    function renderFileList(item, activeIndex) {
        const files = itemFiles(item);
        if (!files.length) return '';
        return `
            <div class="social-neo-research-file-list">
                <span class="lux-section-kicker">Files</span>
                <ul class="social-neo-research-files">
                    ${files.map((file, index) => {
                        const url = typeof fileUrl === 'function' ? fileUrl(file, { forDisplay: true }) : '';
                        const kind = text(file.fileKind) || itemFileKind({ ...item, files: [file] });
                        return `
                            <li class="social-neo-research-file-row ${index === activeIndex ? 'is-active' : ''}">
                                <button class="lux-secondary-btn social-neo-research-file-select" type="button"
                                    data-action="research-file-select" data-file-index="${index}">
                                    <strong>${escape(file.fileName || 'file')}</strong>
                                    <small>${escape(fileKindLabel(kind))} · ${escape(formatBytes(file.sizeBytes))}</small>
                                </button>
                                ${url ? `
                                    <a class="lux-secondary-btn" href="${escape(url)}" download="${escape(file.fileName || 'file')}">
                                        <i class="fas fa-download"></i> Download
                                    </a>
                                ` : ''}
                            </li>
                        `;
                    }).join('')}
                </ul>
            </div>
        `;
    }

    function renderResearchReader(item) {
        if (!item) return '';
        const files = itemFiles(item);
        const activeIndex = Math.min(
            Math.max(0, Number(state()?.ui?.researchActiveFileIndex) || 0),
            Math.max(0, files.length - 1)
        );
        const active = files[activeIndex] || null;
        const activeKind = text(active?.fileKind) || itemFileKind(item);
        const isPdf = activeKind === 'pdf' && active;
        const viewMode = text(state()?.ui?.researchPdfViewMode || 'scroll') || 'scroll';
        const pdfUrl = isPdf && typeof fileUrl === 'function'
            ? fileUrl(active, { forDisplay: true })
            : '';
        const legacyBody = !files.length ? renderLegacyArchiveBody(item) : '';

        return `
            <section class="social-neo-card social-neo-research-reader" data-research-reader="1">
                <div class="social-neo-research-reader-head">
                    <button class="lux-secondary-btn" type="button" data-action="research-reader-close">
                        <i class="fas fa-arrow-left"></i> Back to Research
                    </button>
                    <span class="lux-panel-copy">${escape(laneLabel(item.authorLane))} · ${escape(fileKindLabel(itemFileKind(item)))} · ${escape(readingMeta(item))}</span>
                </div>
                <div class="social-neo-research-reader-titleblock">
                    <span class="lux-section-kicker">${escape(fileKindLabel(itemFileKind(item)))}</span>
                    <h1 class="lux-page-title social-neo-research-reader-title">${escape(item.title || 'Untitled')}</h1>
                    <p class="lux-panel-copy">
                        ${escape(item.authorName || 'Author')}
                        ${item.facultyCode ? ` · ${escape(item.facultyCode)}` : ''}
                        ${item.publishedAt || item.createdAt ? ` · ${escape(dateLabel(item.publishedAt || item.createdAt))}` : ''}
                    </p>
                    <div class="social-neo-research-reader-actions">
                        <button class="lux-secondary-btn" type="button" data-action="research-save" data-research-id="${escape(item.id)}">
                            <i class="fas fa-bookmark"></i> ${item.isSaved ? 'Saved' : 'Save'}
                        </button>
                        ${item.canManage ? `
                            <button class="lux-secondary-btn lux-danger-btn" type="button" data-action="research-delete" data-research-id="${escape(item.id)}">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        ` : ''}
                    </div>
                </div>
                ${item.abstract ? `
                    <div class="social-neo-research-abstract">
                        <span class="lux-section-kicker">Abstract</span>
                        <p class="lux-panel-copy">${escape(item.abstract)}</p>
                    </div>
                ` : ''}
                ${renderFileList(item, activeIndex)}
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
                        data-storage-key="${escape(active?.storageKey || '')}"
                        data-data-url="${escape(active?.dataUrl || '')}"
                        data-file-url="${escape(pdfUrl || '')}">
                        <aside class="social-neo-research-pdf-thumbs lux-scrollbar" data-research-pdf-thumbs hidden></aside>
                        <div class="social-neo-research-pdf-viewport lux-scrollbar" data-research-pdf-viewport>
                            <div class="social-neo-research-pdf-pages" data-research-pdf-pages></div>
                        </div>
                    </div>
                ` : active ? `
                    <div class="social-neo-research-download-panel lux-empty-state">
                        <i class="fas fa-file-arrow-down" aria-hidden="true"></i>
                        <strong class="lux-empty-state__title">Download to open</strong>
                        <span class="lux-empty-state__copy">${escape(active.fileName || 'This file')} opens in PowerPoint, Word, or another desktop app.</span>
                        ${typeof fileUrl === 'function' ? `
                            <div class="lux-empty-state__action">
                                <a class="lux-primary-btn" href="${escape(fileUrl(active, { forDisplay: true }))}" download="${escape(active.fileName || 'file')}">
                                    <i class="fas fa-download"></i> Download
                                </a>
                            </div>
                        ` : ''}
                    </div>
                ` : legacyBody ? `
                    <article class="social-neo-research-article-body">
                        <span class="lux-section-kicker">Archive text</span>
                        ${legacyBody}
                    </article>
                ` : '<p class="lux-panel-copy">No files on this deposit.</p>'}
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

    function renderDepositFileList(draft) {
        const meta = Array.isArray(draft.fileMeta) ? draft.fileMeta : [];
        if (!meta.length) {
            return '<span class="lux-panel-copy" data-research-files-label>Drop PDF, PPT, or Word files — or browse</span>';
        }
        return `
            <ul class="social-neo-research-deposit-files" data-research-files-label>
                ${meta.map((file, index) => `
                    <li>
                        <span class="lux-panel-copy">${escape(file.fileName || 'file')} · ${escape(formatBytes(file.sizeBytes))}</span>
                        <button class="lux-ghost-btn" type="button" data-action="research-file-remove" data-file-index="${index}" aria-label="Remove file">
                            <i class="fas fa-times"></i>
                        </button>
                    </li>
                `).join('')}
            </ul>
        `;
    }

    function renderResearchCreateDialog(runtime = state()) {
        void runtime;
        const draft = ensureResearchDraft();
        draft.authorLane = resolveAuthorLane(draft.authorLane);
        const role = currentUser()?.role;
        const staff = isStaffRole(role);
        const admin = isAdminRole(role);
        const studentLocked = !staff;
        const facultyLocked = staff && !admin;
        const lane = text(draft.authorLane) === 'student' ? 'student' : 'faculty';
        const laneBlock = studentLocked ? `
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
                        `;
        return `
            <div class="lux-glass-dialog-backdrop" data-action="dialog-close" role="dialog" aria-modal="true" aria-label="Deposit to Research">
            <form class="lux-glass-dialog-card lux-glass-dialog-card--form lux-glass-dialog-card--social-glass social-neo-research-create"
                data-form="research-create" data-action="noop" data-lux-transparency-exempt="1" autocomplete="off">
                <div class="lux-glass-dialog-section-head lux-glass-dialog-head">
                    <div class="lux-glass-dialog-heading">
                        <strong class="lux-glass-dialog-title"><i class="fas fa-upload" aria-hidden="true"></i> Deposit to Research</strong>
                        <span class="lux-glass-dialog-subtitle">Add metadata and drop PDF, PowerPoint, or Word files.</span>
                    </div>
                    <button class="lux-ghost-btn lux-glass-dialog-close-btn" type="button" data-action="dialog-close" aria-label="Close"><i class="fas fa-times"></i></button>
                </div>
                <div class="lux-glass-dialog-body social-neo-research-create-body">
                    <fieldset class="social-neo-research-fieldset">
                        <legend class="social-neo-label">Audience lane</legend>
                        ${laneBlock}
                    </fieldset>
                    <label class="lux-glass-dialog-field">
                        <span class="social-neo-label">Title *</span>
                        <input class="social-neo-input lux-control" name="researchTitle" required value="${escape(draft.title || '')}" placeholder="Publication title" autocomplete="off">
                    </label>
                    <label class="lux-glass-dialog-field">
                        <span class="social-neo-label">Abstract</span>
                        <textarea class="social-neo-textarea lux-control" name="researchAbstract" rows="3" placeholder="Optional short summary" autocomplete="off">${escape(draft.abstract || '')}</textarea>
                    </label>
                    <div class="social-neo-form-grid social-neo-form-grid-2">
                        <label class="lux-glass-dialog-field">
                            <span class="social-neo-label">Faculty</span>
                            <input class="social-neo-input lux-control" name="researchFaculty" value="${escape(draft.facultyCode || '')}" placeholder="e.g. ECON" autocomplete="off">
                        </label>
                        <label class="lux-glass-dialog-field">
                            <span class="social-neo-label">Topic</span>
                            <select class="social-neo-select lux-control" name="researchTopic" data-lux-picker-label="Topic" autocomplete="off">
                                ${RESEARCH_TOPICS.map((topic) => `<option value="${escape(topic)}" ${text(draft.topics) === topic ? 'selected' : ''}>${escape(topic)}</option>`).join('')}
                            </select>
                        </label>
                    </div>
                    <label class="lux-glass-dialog-field">
                        <span class="social-neo-label">DOI / external link</span>
                        <input class="social-neo-input lux-control" name="researchDoi" value="${escape(draft.doiOrUrl || '')}" placeholder="https://..." autocomplete="off">
                    </label>
                    ${lane === 'student' ? `
                        <div class="social-neo-form-grid social-neo-form-grid-2">
                            <label class="lux-glass-dialog-field">
                                <span class="social-neo-label">Course code</span>
                                <input class="social-neo-input lux-control" name="researchCourse" value="${escape(draft.courseCode || '')}" placeholder="e.g. MGT201" autocomplete="off">
                            </label>
                            <label class="lux-glass-dialog-field">
                                <span class="social-neo-label">Advisor</span>
                                <input class="social-neo-input lux-control" name="researchAdvisor" value="${escape(draft.advisorName || '')}" placeholder="Optional" autocomplete="off">
                            </label>
                        </div>
                    ` : ''}
                    <label class="lux-glass-dialog-field social-neo-research-dropzone lux-soft-chrome home-hover-chip">
                        <span class="social-neo-label">Files *</span>
                        <input class="social-neo-input lux-control" type="file" name="researchFiles" multiple
                            accept="${escape(RESEARCH_FILE_ACCEPT)}">
                        ${renderDepositFileList(draft)}
                    </label>
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
                                <strong class="lux-empty-state__title">No deposits in this lane</strong>
                                <span class="lux-empty-state__copy">Drop PDF, slides, or documents — student and faculty streams stay separate.</span>
                                <div class="lux-empty-state__action">
                                    <button class="lux-primary-btn" type="button" data-action="research-create-open"><i class="fas fa-upload"></i> Deposit</button>
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
        if (action === 'research-file-remove') {
            const draft = ensureResearchDraft();
            const index = Number(trigger?.getAttribute('data-file-index'));
            if (Number.isInteger(index) && index >= 0) {
                draft.files = draft.files.filter((_, i) => i !== index);
                draft.fileMeta = draft.fileMeta.filter((_, i) => i !== index);
            }
            openDialog('research-create', {});
            return renderSocialPageNow('research-create-open');
        }
        if (action === 'research-reader-open') {
            runtime.ui.researchReaderId = text(trigger?.getAttribute('data-research-id') || '');
            runtime.ui.researchActiveFileIndex = 0;
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
        if (action === 'research-file-select') {
            runtime.ui.researchActiveFileIndex = Math.max(0, Number(trigger?.getAttribute('data-file-index') || 0) || 0);
            invalidateSocialRenderCache?.({ center: true });
            const result = renderSocialPageNow('research-reader-open');
            queueMicrotask(() => window.mountSocialResearchPdfViewer?.());
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

    function appendDraftFiles(fileList) {
        const draft = ensureResearchDraft();
        const incoming = Array.from(fileList || []).slice(0, 6);
        incoming.forEach((file) => {
            if (draft.files.length >= 6) return;
            draft.files.push(file);
            draft.fileMeta.push({
                fileName: file.name,
                sizeBytes: file.size,
                mimeType: file.type
            });
        });
        return draft;
    }

    function syncDraftFromForm(form) {
        const draft = ensureResearchDraft();
        const laneInput = form.querySelector('input[name="researchLane"]:checked')
            || form.querySelector('input[name="researchLane"][type="hidden"]');
        draft.authorLane = resolveAuthorLane(laneInput?.value || defaultLaneForUser());
        draft.title = text(form.researchTitle?.value || '');
        draft.abstract = text(form.researchAbstract?.value || '');
        draft.facultyCode = text(form.researchFaculty?.value || '');
        draft.topics = text(form.researchTopic?.value || 'Research');
        draft.doiOrUrl = text(form.researchDoi?.value || '');
        draft.courseCode = text(form.researchCourse?.value || '');
        draft.advisorName = text(form.researchAdvisor?.value || '');
        const fileInput = form.querySelector('input[name="researchFiles"]');
        if (fileInput?.files?.length) appendDraftFiles(fileInput.files);
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
        if (publish && !draft.files.length) {
            addPortalSocialToast?.({ title: 'File required', text: 'Attach at least one PDF, PPT, or Word file to publish.', icon: 'fa-circle-exclamation' });
            return true;
        }
        if (typeof createPortalSocialResearch !== 'function') return true;
        return withBusy(async () => {
            await createPortalSocialResearch({
                title: draft.title,
                abstract: draft.abstract,
                authorLane: draft.authorLane,
                facultyCode: draft.facultyCode,
                topics: draft.topics,
                doiOrUrl: draft.doiOrUrl,
                courseCode: draft.courseCode,
                advisorName: draft.advisorName,
                files: draft.files,
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
        if (target.name === 'researchLane') {
            syncDraftFromForm(target.closest('form'));
            openDialog('research-create', {});
            return renderSocialPageNow('research-create-open');
        }
        if (target.name === 'researchFiles' && target.files?.length) {
            appendDraftFiles(target.files);
            target.value = '';
            openDialog('research-create', {});
            return renderSocialPageNow('research-create-open');
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
        if (target.name === 'researchLane' || target.name === 'researchFiles') {
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
