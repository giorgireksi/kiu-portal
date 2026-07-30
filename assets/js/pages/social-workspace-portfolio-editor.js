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

    function renderBuiltinEntry(sectionKey, entry, index) {
        const fields = entry?.fields || {};
        if (sectionKey === 'education') {
            return `
                <article class="portfolio-entry-card" data-section-key="${escapeHtml(sectionKey)}" data-entry-index="${index}">
                    <div class="portfolio-entry-grid">
                        <label><span>School</span><input class="social-neo-input lux-control" name="portfolioEducationSchool" value="${escapeHtml(fieldText(fields.school))}"></label>
                        <label><span>Degree</span><input class="social-neo-input lux-control" name="portfolioEducationDegree" value="${escapeHtml(fieldText(fields.degree))}"></label>
                        ${renderDateRangeInputs('portfolioEducationDates', fields.dates)}
                        <label class="portfolio-entry-span-2"><span>Notes</span><textarea class="social-neo-textarea lux-control" name="portfolioEducationNote" rows="2">${escapeHtml(fieldText(fields.note))}</textarea></label>
                    </div>
                    <button class="lux-ghost-btn lux-secondary-btn-sm" type="button" data-action="portfolio-entry-remove" data-section-key="${escapeHtml(sectionKey)}" data-entry-index="${index}"><i class="fas fa-trash"></i> Remove</button>
                </article>
            `;
        }
        if (sectionKey === 'experience') {
            return `
                <article class="portfolio-entry-card" data-section-key="${escapeHtml(sectionKey)}" data-entry-index="${index}">
                    <div class="portfolio-entry-grid">
                        <label><span>Role</span><input class="social-neo-input lux-control" name="portfolioExperienceRole" value="${escapeHtml(fieldText(fields.role))}"></label>
                        <label><span>Organization</span><input class="social-neo-input lux-control" name="portfolioExperienceOrganization" value="${escapeHtml(fieldText(fields.organization))}"></label>
                        ${renderDateRangeInputs('portfolioExperienceDates', fields.dates)}
                        <label class="portfolio-entry-span-2"><span>Description</span><textarea class="social-neo-textarea lux-control" name="portfolioExperienceDescription" rows="3">${escapeHtml(fieldText(fields.description))}</textarea></label>
                    </div>
                    <button class="lux-ghost-btn lux-secondary-btn-sm" type="button" data-action="portfolio-entry-remove" data-section-key="${escapeHtml(sectionKey)}" data-entry-index="${index}"><i class="fas fa-trash"></i> Remove</button>
                </article>
            `;
        }
        if (sectionKey === 'projects') {
            return `
                <article class="portfolio-entry-card" data-section-key="${escapeHtml(sectionKey)}" data-entry-index="${index}">
                    <div class="portfolio-entry-grid">
                        <label><span>Title</span><input class="social-neo-input lux-control" name="portfolioProjectTitle" value="${escapeHtml(fieldText(fields.title))}"></label>
                        <label><span>Link</span><input class="social-neo-input lux-control" name="portfolioProjectLink" value="${escapeHtml(fieldLinkUrl(fields.link))}"></label>
                        <label class="portfolio-entry-span-2"><span>Description</span><textarea class="social-neo-textarea lux-control" name="portfolioProjectDescription" rows="3">${escapeHtml(fieldText(fields.description))}</textarea></label>
                    </div>
                    <button class="lux-ghost-btn lux-secondary-btn-sm" type="button" data-action="portfolio-entry-remove" data-section-key="${escapeHtml(sectionKey)}" data-entry-index="${index}"><i class="fas fa-trash"></i> Remove</button>
                </article>
            `;
        }
        if (sectionKey === 'skills') {
            return `
                <article class="portfolio-entry-card" data-section-key="${escapeHtml(sectionKey)}" data-entry-index="${index}">
                    <label class="portfolio-entry-span-2"><span>Skills (comma separated)</span><input class="social-neo-input lux-control" name="portfolioSkillsTags" value="${escapeHtml(fieldText(fields.tags))}" placeholder="Research, Python, UX writing"></label>
                </article>
            `;
        }
        return '';
    }

    function renderCustomEntry(sectionKey, section, entry, index) {
        const defs = Array.isArray(section.fieldDefinitions) ? section.fieldDefinitions : [];
        const fields = entry?.fields || {};
        return `
            <article class="portfolio-entry-card" data-section-key="${escapeHtml(sectionKey)}" data-entry-index="${index}">
                <div class="portfolio-entry-grid">
                    ${defs.map((def) => {
                        const key = text(def.key);
                        const label = text(def.label || key || 'Field');
                        const field = fields[key];
                        if (text(def.type) === 'dateRange') {
                            return `<div class="portfolio-entry-span-2">${renderDateRangeInputs(`portfolioCustom_${sectionKey}_${key}`, field)}</div>`;
                        }
                        if (text(def.type) === 'link') {
                            return `<label class="portfolio-entry-span-2"><span>${escapeHtml(label)}</span><input class="social-neo-input lux-control" data-field-key="${escapeHtml(key)}" value="${escapeHtml(fieldLinkUrl(field))}" placeholder="https://"></label>`;
                        }
                        return `<label class="portfolio-entry-span-2"><span>${escapeHtml(label)}</span><input class="social-neo-input lux-control" data-field-key="${escapeHtml(key)}" value="${escapeHtml(fieldText(field))}"></label>`;
                    }).join('')}
                </div>
                <button class="lux-ghost-btn lux-secondary-btn-sm" type="button" data-action="portfolio-entry-remove" data-section-key="${escapeHtml(sectionKey)}" data-entry-index="${index}"><i class="fas fa-trash"></i> Remove</button>
            </article>
        `;
    }

    function renderSection(sectionKey, section, options = {}) {
        if (!section) return '';
        const openSections = options.openPortfolioSections || {};
        const isOpen = openSections[sectionKey] !== false;
        const label = text(section.label || sectionKey);
        const entries = Array.isArray(section.entries) ? section.entries : [];
        const isSkills = sectionKey === 'skills';
        const entryMarkup = entries.length
            ? entries.map((entry, index) => (
                sectionKey.startsWith('custom_')
                    ? renderCustomEntry(sectionKey, section, entry, index)
                    : renderBuiltinEntry(sectionKey, entry, index)
            )).join('')
            : `<div class="portfolio-section-empty">No entries yet.</div>`;

        return `
            <article class="portfolio-section-card sns-portfolio-editor-panel ${isOpen ? 'is-open' : ''}" data-section-key="${escapeHtml(sectionKey)}">
                <button class="portfolio-section-toggle" type="button" data-action="portfolio-section-toggle" data-section-key="${escapeHtml(sectionKey)}" aria-expanded="${isOpen ? 'true' : 'false'}">
                    <strong>${escapeHtml(label)}</strong>
                    <span class="social-neo-pill home-hover-chip">${escapeHtml(String(entries.length))}</span>
                    <i class="fas fa-chevron-down" aria-hidden="true"></i>
                </button>
                <div class="portfolio-section-body" ${isOpen ? '' : 'hidden'}>
                    ${entryMarkup}
                    ${isSkills ? '' : `<button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="portfolio-entry-add" data-section-key="${escapeHtml(sectionKey)}"><i class="fas fa-plus"></i> Add entry</button>`}
                </div>
            </article>
        `;
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
        const sectionOrder = Array.isArray(doc.sectionOrder) && doc.sectionOrder.length
            ? doc.sectionOrder
            : Object.keys(doc.sections || {});
        const status = text(options.portfolioSaveStatus || 'Changes autosave as you type.');
        const linkValue = basicsLinkUrl(basics.links);

        return `
            <div class="portfolio-editor-stack" data-form="portfolio-editor">
                <header class="portfolio-editor-toolbar">
                    <span class="portfolio-save-status">${escapeHtml(status)}</span>
                    <div class="portfolio-editor-actions">
                        <button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="portfolio-custom-open"><i class="fas fa-layer-group"></i> Custom section</button>
                        <button class="lux-primary-btn lux-secondary-btn-sm" type="button" data-action="portfolio-save"><i class="fas fa-save"></i> Save</button>
                    </div>
                </header>
                <section class="portfolio-basics-card sns-portfolio-editor-panel">
                    <div class="social-neo-section-head">
                        <div><strong>Profile basics</strong><span>Name, headline, and summary shown at the top of your showcase.</span></div>
                    </div>
                    <div class="portfolio-entry-grid">
                        <label><span>Name</span><input class="social-neo-input lux-control" name="portfolioBasicsName" value="${escapeHtml(text(basics.name))}"></label>
                        <label><span>Email</span><input class="social-neo-input lux-control" name="portfolioBasicsEmail" value="${escapeHtml(text(basics.email))}"></label>
                        <label class="portfolio-entry-span-2"><span>Headline</span><input class="social-neo-input lux-control" name="portfolioBasicsHeadline" value="${escapeHtml(text(basics.headline))}" placeholder="Economics researcher · startup builder"></label>
                        <label class="portfolio-entry-span-2"><span>Summary</span><textarea class="social-neo-textarea lux-control" name="portfolioBasicsSummary" rows="3">${escapeHtml(text(basics.summary))}</textarea></label>
                        <label class="portfolio-entry-span-2"><span>Profile link</span><input class="social-neo-input lux-control" name="portfolioBasicsLink" value="${escapeHtml(linkValue)}" placeholder="https://"></label>
                    </div>
                </section>
                ${sectionOrder.map((sectionKey) => renderSection(sectionKey, doc.sections?.[sectionKey], options)).join('')}
                ${renderPublishPanel(doc, options)}
            </div>
        `;
    }

    window.KiuPortfolioEditor = {
        renderEditor,
        renderSection
    };

    if (!window.KiuPortfolioCustomBuilder) {
        const TEMPLATE_FIELDS = {
            awards: [
                { key: 'title', type: 'text', label: 'Award' },
                { key: 'issuer', type: 'text', label: 'Issuer' },
                { key: 'dates', type: 'dateRange', label: 'Dates' }
            ],
            certifications: [
                { key: 'name', type: 'text', label: 'Certification' },
                { key: 'link', type: 'link', label: 'Credential link' }
            ],
            blank: [
                { key: 'title', type: 'text', label: 'Title' },
                { key: 'details', type: 'text', label: 'Details' }
            ]
        };

        function renderCustomBuilderHead(subtitle) {
            return `
                <div class="lux-glass-dialog-section-head lux-glass-dialog-head portfolio-custom-dialog-head">
                    <div class="social-neo-surveys-hero-copy">
                        <span class="social-neo-section-kicker">Portfolio</span>
                        <h2>Custom section</h2>
                        <p class="lux-glass-dialog-portfolio-editor-subtitle">${escapeHtml(subtitle)}</p>
                    </div>
                    <button class="lux-ghost-btn lux-glass-dialog-close-btn" type="button" data-action="portfolio-custom-close" aria-label="Close"><i class="fas fa-times"></i></button>
                </div>`;
        }

        const CUSTOM_BUILDER_BACKDROP = 'lux-glass-dialog-backdrop lux-glass-dialog-backdrop--stacked-child lux-glass-dialog-backdrop--portfolio-custom';
        const CUSTOM_BUILDER_CARD = 'lux-glass-dialog-card lux-glass-dialog-card--form lux-glass-dialog-card--compact lux-glass-dialog-card--portfolio-custom lux-glass-dialog-card--social-glass portfolio-custom-builder-card';

        window.KiuPortfolioCustomBuilder = {
            templateFields(templateId) {
                return (TEMPLATE_FIELDS[text(templateId)] || TEMPLATE_FIELDS.blank).map((field) => ({ ...field }));
            },
            renderCustomBuilderDialog(ui = {}) {
                const step = Number(ui.customBuilderStep || 1);
                const fields = Array.isArray(ui.customBuilderFields) ? ui.customBuilderFields : [];
                if (step === 1) {
                    return `
                        <div class="${CUSTOM_BUILDER_BACKDROP}" data-action="portfolio-custom-close" role="dialog" aria-modal="true" aria-label="Custom section">
                            <form class="${CUSTOM_BUILDER_CARD}" data-action="noop" data-lux-transparency-exempt="1" autocomplete="off">
                                ${renderCustomBuilderHead('Pick a starter template for your custom portfolio section.')}
                                <div class="lux-glass-dialog-body lux-glass-dialog-body--portfolio-custom">
                                    <div class="portfolio-custom-template-grid">
                                        <button class="portfolio-custom-template-card lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="portfolio-custom-template" data-template-id="awards"><strong>Awards</strong><span>Title, issuer, and dates.</span></button>
                                        <button class="portfolio-custom-template-card lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="portfolio-custom-template" data-template-id="certifications"><strong>Certifications</strong><span>Name and credential link.</span></button>
                                        <button class="portfolio-custom-template-card lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="portfolio-custom-template" data-template-id="blank"><strong>Blank</strong><span>Start from a simple title and details pair.</span></button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    `;
                }
                return `
                    <div class="${CUSTOM_BUILDER_BACKDROP}" data-action="portfolio-custom-close" role="dialog" aria-modal="true" aria-label="Custom section">
                        <form class="${CUSTOM_BUILDER_CARD}" data-action="noop" data-lux-transparency-exempt="1" autocomplete="off">
                            ${renderCustomBuilderHead('Name your section and customize the fields students will fill in.')}
                            <div class="lux-glass-dialog-body lux-glass-dialog-body--portfolio-custom">
                                <label class="lux-glass-dialog-field">
                                    <span class="social-neo-label">Section name</span>
                                    <input class="social-neo-input lux-control" name="portfolioCustomSectionName" value="${escapeHtml(text(ui.customBuilderName))}" autocomplete="off">
                                </label>
                                <div class="portfolio-custom-field-list">
                                    ${fields.map((field, index) => `
                                        <label class="lux-glass-dialog-field">
                                            <span class="social-neo-label">Field label</span>
                                            <input class="social-neo-input lux-control" name="portfolioCustomFieldLabel" data-field-index="${index}" value="${escapeHtml(text(field.label))}" autocomplete="off">
                                        </label>
                                    `).join('')}
                                </div>
                                <div class="portfolio-custom-field-actions">
                                    <button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="portfolio-custom-field-add" data-field-type="text">Text field</button>
                                    <button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="portfolio-custom-field-add" data-field-type="link">Link field</button>
                                    <button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="portfolio-custom-field-add" data-field-type="dateRange">Date range</button>
                                </div>
                            </div>
                            <div class="lux-glass-dialog-form-actions">
                                <button class="lux-secondary-btn lux-secondary-btn-sm" type="button" data-action="portfolio-custom-back">Back</button>
                                <button class="lux-primary-btn lux-secondary-btn-sm" type="button" data-action="portfolio-custom-save">Add section</button>
                            </div>
                        </form>
                    </div>
                `;
            }
        };
    }

    if (!window.KiuPortfolioApi) {
        async function portfolioRequest(path, options = {}) {
            const response = await fetch(path, {
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
                ...options
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
