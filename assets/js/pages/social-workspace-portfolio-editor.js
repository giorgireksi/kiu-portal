/* Portfolio editor renderer + API client (restored after bare-shell peel).
 * Exposes window.KiuPortfolioEditor, window.KiuPortfolioApi, window.KiuPortfolioCustomBuilder.
 */
(function initSocialWorkspacePortfolioEditor() {
    'use strict';
    if (window.__KIU_SOCIAL_WORKSPACE_PORTFOLIO_EDITOR_LOADED) return;
    window.__KIU_SOCIAL_WORKSPACE_PORTFOLIO_EDITOR_LOADED = true;

    function text(value) {
        return String(value == null ? '' : value).trim();
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function fieldText(field) {
        if (!field || typeof field !== 'object') return text(field);
        return text(field.value);
    }

    function fieldLinkUrl(field) {
        const value = field?.value;
        if (value && typeof value === 'object') {
            if (text(value.type) === 'link') return fieldLinkUrl(value);
            const url = value.url;
            if (url && typeof url === 'object') return fieldLinkUrl({ value: url });
            return text(url || value.href);
        }
        return text(value);
    }

    function basicsLinkUrl(links) {
        const item = Array.isArray(links) && links[0] ? links[0] : null;
        if (!item) return '';
        if (text(item.type) === 'link') return fieldLinkUrl(item);
        if (typeof item.url === 'string') return text(item.url);
        if (item.url && typeof item.url === 'object') return fieldLinkUrl({ value: item.url });
        return text(item.url || item.href || '');
    }

    function fieldDateRange(field) {
        const value = field?.value && typeof field.value === 'object' ? field.value : {};
        return {
            start: text(value.start),
            end: text(value.end),
            current: Boolean(value.current)
        };
    }

    function renderDateRangeInputs(prefix, field) {
        const dates = fieldDateRange(field);
        return `
            <div class="portfolio-date-range">
                <label><span>Start</span><input class="social-neo-input lux-control" type="month" name="${escapeHtml(prefix)}Start" value="${escapeHtml(dates.start)}"></label>
                <label><span>End</span><input class="social-neo-input lux-control" type="month" name="${escapeHtml(prefix)}End" value="${escapeHtml(dates.end)}" ${dates.current ? 'disabled' : ''}></label>
                <label class="portfolio-date-current"><input type="checkbox" name="${escapeHtml(prefix)}Current" ${dates.current ? 'checked' : ''}><span>Current</span></label>
            </div>
        `;
    }

    function extraKindLabel(kind) {
        const labels = { subject: 'Subject / course', project: 'Project', link: 'Link', note: 'Note' };
        return labels[text(kind)] || 'Note';
    }

    function renderExtrasList(extras) {
        const items = Array.isArray(extras) ? extras : [];
        if (!items.length) {
            return `<div class="portfolio-section-empty">No extras yet. Add subjects, projects, or links if you want.</div>`;
        }
        return items.map((extra, index) => {
            const kind = text(extra.kind || 'note') || 'note';
            return `
                <article class="portfolio-extra-card" data-extra-index="${index}">
                    <div class="portfolio-entry-grid">
                        <label>
                            <span>Type</span>
                            <select class="social-neo-select lux-control" name="portfolioExtraKind" data-extra-index="${index}">
                                ${['subject', 'project', 'link', 'note'].map((option) => `
                                    <option value="${escapeHtml(option)}" ${kind === option ? 'selected' : ''}>${escapeHtml(extraKindLabel(option))}</option>
                                `).join('')}
                            </select>
                        </label>
                        <label><span>Title</span><input class="social-neo-input lux-control" name="portfolioExtraTitle" data-extra-index="${index}" value="${escapeHtml(text(extra.title))}" placeholder="Course, project, or highlight"></label>
                        <label class="portfolio-entry-span-2"><span>Details</span><textarea class="social-neo-textarea lux-control" name="portfolioExtraDetail" data-extra-index="${index}" rows="2" placeholder="Optional context">${escapeHtml(text(extra.detail))}</textarea></label>
                        <label class="portfolio-entry-span-2"><span>Link</span><input class="social-neo-input lux-control" name="portfolioExtraUrl" data-extra-index="${index}" value="${escapeHtml(text(extra.url))}" placeholder="https:// (optional)"></label>
                    </div>
                    <button class="lux-ghost-btn lux-secondary-btn-sm" type="button" data-action="portfolio-extra-remove" data-extra-index="${index}"><i class="fas fa-trash"></i> Remove</button>
                </article>
            `;
        }).join('');
    }

    function portfolioFileUrl(file) {
        if (!file || typeof file !== 'object') return '';
        const preview = text(file.previewDataUrl || file.dataUrl);
        const storageMissing = file.storageMissing === true;
        if (storageMissing) return preview;
        const storageKey = text(file.storageKey || file.id || '');
        const backend = text(file.storageBackend).toLowerCase();
        if (storageKey && typeof window.getPortalStoredFileUrl === 'function' && (backend === 'bridge' || backend === '' || !preview)) {
            return window.getPortalStoredFileUrl(storageKey, { inline: false, forDisplay: false });
        }
        return preview;
    }

    function safeExternalHref(url) {
        const value = text(url);
        return /^https?:\/\//i.test(value) ? value : '';
    }

    function renderResumeViewerBlock(resume) {
        const name = text(resume?.name || 'resume.pdf') || 'resume.pdf';
        const url = portfolioFileUrl(resume);
        if (!url) return '';
        return `
            <section class="portfolio-basics-card sns-portfolio-editor-panel">
                <div class="social-neo-section-head">
                    <div>
                        <strong>Resume</strong>
                        <span>Download or open the uploaded resume PDF.</span>
                    </div>
                </div>
                <div class="portfolio-entry-grid">
                    <div class="portfolio-entry-span-2 portfolio-resume-status">
                        <a class="lux-secondary-btn" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer"><i class="fas fa-file-pdf"></i> ${escapeHtml(name)}</a>
                    </div>
                </div>
            </section>
        `;
    }

    function renderExtrasViewerList(extras) {
        const items = Array.isArray(extras) ? extras : [];
        if (!items.length) {
            return `<div class="portfolio-section-empty">No additional subjects, projects, or links shared.</div>`;
        }
        return items.map((extra) => {
            const kind = text(extra.kind || 'note') || 'note';
            const title = text(extra.title) || extraKindLabel(kind);
            const detail = text(extra.detail);
            const link = safeExternalHref(extra.url);
            return `
                <article class="portfolio-extra-card portfolio-extra-card--readonly">
                    <div class="portfolio-entry-grid">
                        <div><span class="social-neo-muted">${escapeHtml(extraKindLabel(kind))}</span><strong class="portfolio-viewer-extra-title">${escapeHtml(title)}</strong></div>
                        ${detail ? `<p class="portfolio-viewer-extra-detail portfolio-entry-span-2">${escapeHtml(detail)}</p>` : ''}
                        ${link ? `<p class="portfolio-entry-span-2"><a class="social-portfolio-link" href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link)} <i class="fas fa-arrow-up-right-from-square"></i></a></p>` : ''}
                    </div>
                </article>
            `;
        }).join('');
    }

    function renderViewer(portfolio, options = {}) {
        const doc = portfolio && typeof portfolio === 'object' ? portfolio : {};
        const basics = doc.basics || {};
        const extras = Array.isArray(doc.extras) ? doc.extras : [];
        const linkValue = basicsLinkUrl(basics.links);
        const safeLink = safeExternalHref(linkValue);
        const name = text(basics.name);
        const email = text(basics.email);
        const headline = text(basics.headline);
        const summary = text(basics.summary);

        return `
            <div class="portfolio-editor-stack is-readonly" data-form="portfolio-viewer">
                ${renderResumeViewerBlock(doc.resume)}
                <section class="portfolio-basics-card sns-portfolio-editor-panel">
                    <div class="social-neo-section-head">
                        <div>
                            <strong>About</strong>
                            <span>Profile summary and contact details.</span>
                        </div>
                    </div>
                    <div class="portfolio-entry-grid portfolio-viewer-fields">
                        ${name ? `<div><span class="social-neo-muted">Name</span><strong>${escapeHtml(name)}</strong></div>` : ''}
                        ${email ? `<div><span class="social-neo-muted">Email</span><span>${escapeHtml(email)}</span></div>` : ''}
                        ${headline ? `<div class="portfolio-entry-span-2"><span class="social-neo-muted">Headline</span><strong>${escapeHtml(headline)}</strong></div>` : ''}
                        ${summary ? `<div class="portfolio-entry-span-2"><span class="social-neo-muted">About</span><p>${escapeHtml(summary)}</p></div>` : ''}
                        ${safeLink ? `<div class="portfolio-entry-span-2"><span class="social-neo-muted">Profile link</span><a class="social-portfolio-link" href="${escapeHtml(safeLink)}" target="_blank" rel="noopener noreferrer">${escapeHtml(safeLink)} <i class="fas fa-arrow-up-right-from-square"></i></a></div>` : ''}
                    </div>
                </section>
                <section class="portfolio-basics-card sns-portfolio-editor-panel">
                    <div class="social-neo-section-head">
                        <div>
                            <strong>Extras</strong>
                            <span>Subjects, projects, and links shared with this portfolio.</span>
                        </div>
                    </div>
                    <div class="portfolio-extras-list">
                        ${renderExtrasViewerList(extras)}
                    </div>
                </section>
            </div>
        `;
    }

    function renderResumeBlock(resume) {
        const name = text(resume?.name || '');
        const hasFile = Boolean(text(resume?.storageKey) || text(resume?.dataUrl));
        return `
            <section class="portfolio-basics-card sns-portfolio-editor-panel">
                <div class="social-neo-section-head">
                    <div>
                        <strong>Resume PDF</strong>
                        <span>Build your resume elsewhere, then upload it here for interviews and Discover.</span>
                    </div>
                </div>
                <div class="portfolio-entry-grid">
                    <label class="portfolio-entry-span-2">
                        <span>Upload resume</span>
                        <input class="social-neo-input lux-control" type="file" name="portfolioResumeFile" accept=".pdf,application/pdf">
                    </label>
                    <div class="portfolio-entry-span-2 portfolio-resume-status">
                        ${hasFile
                            ? `<span class="social-neo-pill lux-status-pill"><strong>Ready</strong><span>${escapeHtml(name || 'resume.pdf')}</span></span>
                               <button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="portfolio-resume-clear">Remove file</button>`
                            : `<span class="social-neo-muted">No resume uploaded yet.</span>`}
                    </div>
                </div>
            </section>
        `;
    }

    function renderSection() {
        return '';
    }

    function renderPublishPanel(portfolio, options = {}) {
        const publishVisibility = text(options.publishVisibility || portfolio.visibilityMode || 'staff_only') || 'staff_only';
        const isPublished = text(portfolio.status) === 'published';
        const consent = Boolean(options.publishConsent);
        const audiences = [
            ['staff_only', 'Staff & faculty', 'Visible to professors, TAs, and campus staff.'],
            ['students_only', 'Campus peers', 'Published to student discovery across campus social.']
        ];
        return `
            <section class="portfolio-publish-panel sns-portfolio-editor-panel">
                <div class="social-neo-section-head">
                    <div>
                        <strong>Publish portfolio</strong>
                        <span>Choose who can discover your showcase once you publish.</span>
                    </div>
                    <span class="social-neo-pill home-hover-chip">${escapeHtml(isPublished ? 'Published' : 'Draft')}</span>
                </div>
                <div class="portfolio-audience-cards">
                    ${audiences.map(([mode, title, copy]) => `
                        <button class="portfolio-audience-card lux-secondary-btn lux-secondary-btn-sm ${publishVisibility === mode ? 'is-selected' : ''}" type="button" data-action="portfolio-publish-visibility" data-visibility="${escapeHtml(mode)}">
                            <strong>${escapeHtml(title)}</strong>
                            <span>${escapeHtml(copy)}</span>
                        </button>
                    `).join('')}
                </div>
                ${publishVisibility === 'students_only' ? `
                    <label class="portfolio-consent-row">
                        <input type="checkbox" name="portfolioPublishConsent" ${consent ? 'checked' : ''}>
                        <span>I understand I can unpublish anytime and my portfolio will appear in campus discovery.</span>
                    </label>
                ` : ''}
                <div class="portfolio-publish-actions">
                    <button class="lux-primary-btn lux-secondary-btn-sm" type="button" data-action="portfolio-publish-save"><i class="fas fa-globe"></i> ${isPublished ? 'Update publish settings' : 'Publish portfolio'}</button>
                    ${isPublished ? `<button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="portfolio-unpublish"><i class="fas fa-eye-slash"></i> Unpublish</button>` : ''}
                </div>
            </section>
        `;
    }

    function renderEditor(portfolio, options = {}) {
        const doc = portfolio && typeof portfolio === 'object' ? portfolio : {};
        const basics = doc.basics || {};
        const extras = Array.isArray(doc.extras) ? doc.extras : [];
        const status = text(options.portfolioSaveStatus || 'Changes autosave as you type.');
        const linkValue = basicsLinkUrl(basics.links);

        return `
            <div class="portfolio-editor-stack" data-form="portfolio-editor">
                <header class="portfolio-editor-toolbar">
                    <span class="portfolio-save-status">${escapeHtml(status)}</span>
                    <div class="portfolio-editor-actions">
                        <button class="lux-primary-btn lux-secondary-btn-sm" type="button" data-action="portfolio-save"><i class="fas fa-save"></i> Save</button>
                    </div>
                </header>
                ${renderResumeBlock(doc.resume)}
                <section class="portfolio-basics-card sns-portfolio-editor-panel">
                    <div class="social-neo-section-head">
                        <div>
                            <strong>Discover card</strong>
                            <span>A short About helps people skim before opening your resume.</span>
                        </div>
                    </div>
                    <div class="portfolio-entry-grid">
                        <label><span>Name</span><input class="social-neo-input lux-control" name="portfolioBasicsName" value="${escapeHtml(text(basics.name))}"></label>
                        <label><span>Email</span><input class="social-neo-input lux-control" name="portfolioBasicsEmail" value="${escapeHtml(text(basics.email))}"></label>
                        <label class="portfolio-entry-span-2"><span>Headline</span><input class="social-neo-input lux-control" name="portfolioBasicsHeadline" value="${escapeHtml(text(basics.headline))}" placeholder="CS student · product intern · research assistant"></label>
                        <label class="portfolio-entry-span-2"><span>About</span><textarea class="social-neo-textarea lux-control" name="portfolioBasicsSummary" rows="3" placeholder="1–3 sentences: what you study, what you want, one proof point.">${escapeHtml(text(basics.summary))}</textarea></label>
                        <label class="portfolio-entry-span-2"><span>Profile link</span><input class="social-neo-input lux-control" name="portfolioBasicsLink" value="${escapeHtml(linkValue)}" placeholder="https:// (optional)"></label>
                    </div>
                </section>
                <section class="portfolio-basics-card sns-portfolio-editor-panel">
                    <div class="social-neo-section-head">
                        <div>
                            <strong>Optional extras</strong>
                            <span>Subjects, projects, or links — only if you want more than the resume.</span>
                        </div>
                        <button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="portfolio-extra-add"><i class="fas fa-plus"></i> Add extra</button>
                    </div>
                    <div class="portfolio-extras-list">
                        ${renderExtrasList(extras)}
                    </div>
                </section>
                ${renderPublishPanel(doc, options)}
            </div>
        `;
    }

    window.KiuPortfolioEditor = {
        renderEditor,
        renderViewer,
        renderSection
    };

    if (!window.KiuPortfolioCustomBuilder) {
        window.KiuPortfolioCustomBuilder = {
            templateFields() { return []; },
            renderCustomBuilderDialog() { return ''; }
        };
    }

    if (!window.KiuPortfolioApi) {
        async function portfolioRequest(path, options = {}) {
            const method = text(options.method || 'GET') || 'GET';
            const getToken = typeof getPortalSessionToken === 'function'
                ? getPortalSessionToken
                : (typeof window.getPortalSessionToken === 'function' ? window.getPortalSessionToken : null);
            const token = getToken ? text(getToken()) : '';
            const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
            if (token) headers['X-Portal-Session'] = token;

            const portalFetch = typeof kiuPortalFetch === 'function'
                ? kiuPortalFetch
                : (typeof window.kiuPortalFetch === 'function' ? window.kiuPortalFetch : null);
            if (portalFetch) {
                return portalFetch(path, { ...options, method, headers });
            }

            const backendUrl = typeof getKiuPortalBackendUrl === 'function'
                ? text(getKiuPortalBackendUrl()).replace(/\/$/, '')
                : (typeof window.getKiuPortalBackendUrl === 'function'
                    ? text(window.getKiuPortalBackendUrl()).replace(/\/$/, '')
                    : '');
            const url = backendUrl && path.startsWith('/') ? `${backendUrl}${path}` : path;
            const response = await fetch(url, {
                credentials: 'same-origin',
                cache: 'no-store',
                ...options,
                method,
                headers
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok || payload.ok === false) {
                const error = new Error(text(payload.error || payload.message || 'Portfolio request failed.'));
                error.status = response.status;
                throw error;
            }
            return payload;
        }

        window.KiuPortfolioApi = {
            async loadMyPortfolio() {
                const payload = await portfolioRequest('/api/social/portfolio/me');
                return payload.portfolio || null;
            },
            async loadPortfolio(userId) {
                const normalizedUserId = text(userId);
                if (!normalizedUserId) return null;
                const payload = await portfolioRequest(`/api/social/portfolio/${encodeURIComponent(normalizedUserId)}`);
                return payload.portfolio || null;
            },
            async saveMyPortfolio(portfolio) {
                const payload = await portfolioRequest('/api/social/portfolio/me', {
                    method: 'PUT',
                    body: JSON.stringify(portfolio || {})
                });
                return payload.portfolio || null;
            },
            async publishMyPortfolio(body = {}) {
                const payload = await portfolioRequest('/api/social/portfolio/me/publish', {
                    method: 'POST',
                    body: JSON.stringify(body || {})
                });
                return payload.portfolio || null;
            },
            async unpublishMyPortfolio() {
                const payload = await portfolioRequest('/api/social/portfolio/me/unpublish', { method: 'POST', body: '{}' });
                return payload.portfolio || null;
            },
            async addCustomSection(body = {}) {
                const payload = await portfolioRequest('/api/social/portfolio/me/sections', {
                    method: 'POST',
                    body: JSON.stringify(body || {})
                });
                return payload.portfolio || null;
            }
        };
    }
})();
