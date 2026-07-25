/* Home dashboard widget markup renderers. */
    function renderListRowsMarkup(rows) {
        return ((rows && rows.length) ? rows : [{ icon: 'fas fa-circle-info', title: 'Nothing new yet', copy: 'Open the related workspace to start activity here.' }]).map((row) => `
            <div class="lux-list-row lux-soft-chrome home-hover-chip">
                <i class="${escapeHtml(row.icon || 'fas fa-circle')}"></i>
                <div>
                    <strong>${escapeHtml(row.title || 'Portal update')}</strong>
                    <span>${escapeHtml(row.copy || '')}</span>
                </div>
            </div>
        `).join('');
    }

    function renderQuickTilesMarkup(tiles) {
        return ((tiles && tiles.length) ? tiles : []).map((tile) => `
            <button class="lux-quick-btn lux-soft-chrome home-hover-chip" type="button" data-nav-target="${escapeHtml(tile.pageId)}">
                <div class="lux-quick-top">
                    <div class="icon"><i class="${escapeHtml(tile.icon)}"></i></div>
                    <div class="lux-quick-meta-badge">${escapeHtml(tile.meta || 'Workspace')}</div>
                </div>
                <strong>${escapeHtml(tile.label)}</strong>
                <span>${escapeHtml(tile.copy || '')}</span>
                <div class="lux-quick-bottom">
                    <div class="lux-quick-meter"><span style="width:${clampPercent(tile.progress, 0)}%"></span></div>
                    <em>${escapeHtml(tile.status || 'Open workspace')}</em>
                </div>
            </button>
        `).join('');
    }

    function renderAdminOpsMarkup(config) {
        if (!config || !Array.isArray(config.groups) || !config.groups.length) return '';
        return `
            <section class="lux-soft-chrome lux-admin-ops-panel">
                <div class="lux-card-head lux-admin-ops-head">
                    <div>
                        <div class="lux-card-title">${escapeHtml(config.title || 'Admin operations')}</div>
                        <div class="lux-admin-ops-copy">${escapeHtml(config.copy || '')}</div>
                    </div>
                    <button class="lux-secondary-btn" type="button" data-nav-target="admin-tools">Open full tools page</button>
                </div>
                <div class="lux-admin-ops-grid">
                    ${config.groups.map((group) => `
                        <div class="lux-admin-op-card lux-soft-chrome">
                            <div class="lux-admin-op-head">
                                <strong>${escapeHtml(group.title || 'Operations')}</strong>
                                <span>${escapeHtml(group.copy || '')}</span>
                            </div>
                            <div class="lux-admin-op-actions">
                                ${(group.buttons || []).map((button) => {
                                    if (button.type === 'provision') {
                                        return `<button class="lux-admin-op-btn lux-secondary-btn" type="button" data-admin-provision="${escapeHtml(button.role)}"><i class="${escapeHtml(button.icon || 'fas fa-plus')}"></i><span>${escapeHtml(button.label)}</span></button>`;
                                    }
                                    if (button.type === 'focus') {
                                        return `<button class="lux-admin-op-btn lux-secondary-btn" type="button" data-admin-focus="${escapeHtml(button.focus)}"><i class="${escapeHtml(button.icon || 'fas fa-layer-group')}"></i><span>${escapeHtml(button.label)}</span></button>`;
                                    }
                                    return `<button class="lux-admin-op-btn lux-secondary-btn" type="button" data-nav-target="${escapeHtml(button.pageId)}"><i class="${escapeHtml(button.icon || 'fas fa-arrow-right')}"></i><span>${escapeHtml(button.label)}</span></button>`;
                                }).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    }

    function renderHeroFocusAsideMarkup(heroAside) {
        const aside = heroAside || {};
        const kicker = aside.kicker || 'Live overview';
        const chip = aside.chip || 'Status';
        const headline = aside.headline || '—';
        const copy = aside.copy || '';
        const meta = aside.meta && typeof aside.meta === 'object' ? aside.meta : { icon: 'fa-circle-dot', text: '' };

        return `
                    <aside class="lms-hero-focus lux-hero-side lux-focus-panel lux-soft-chrome home-hover-chip" aria-label="${escapeHtml(kicker)}">
                        <div class="lms-hero-focus-head">
                            <div class="lms-hero-focus-kicker">${escapeHtml(kicker)}</div>
                            <span class="lux-pill lux-soft-chrome home-hover-chip lms-hero-focus-chip" aria-label="Status">${escapeHtml(chip)}</span>
                        </div>
                        <div class="lms-hero-focus-body">
                            <div class="lms-hero-focus-title">${escapeHtml(headline)}</div>
                            <p class="lms-hero-focus-copy">${escapeHtml(copy)}</p>
                        </div>
                        <div class="lms-hero-focus-meta">
                            <span class="lux-pill lux-soft-chrome home-hover-chip"><i class="fas ${escapeHtml(meta.icon || 'fa-circle-dot')}"></i> ${escapeHtml(meta.text || '')}</span>
                        </div>
                    </aside>`;
    }



    function renderHeroWidgetMarkup(heroModel, role) {
        const model = heroModel || buildHomeModel(role);
        return `
            <section class="lux-soft-chrome lux-hero lux-builder-hero page-hero lux-summary-surface--hero">
                <div class="lux-hero-stage">
                    <div class="lux-hero-main">
                        <div class="lux-kicker">${escapeHtml(model.kicker || ROLE_LABELS[role] || 'Portal View')}</div>
                        <h1 class="page-hero-title">${escapeHtml(model.title)}</h1>
                        <p class="page-hero-copy">${escapeHtml(model.copy)}</p>
                        <div class="lux-pill-row">
                            ${(model.pills || []).map((pill) => `<span class="lux-pill lux-soft-chrome home-hover-chip">${escapeHtml(pill)}</span>`).join('')}
                        </div>
                        <div class="lux-hero-actions">
                            ${(model.actions || []).map(([pageId, label], index) => `
                                <button class="${index === 0 ? 'lux-primary-btn' : index === 1 ? 'lux-secondary-btn' : 'lux-ghost-btn'}" type="button" data-nav-target="${escapeHtml(pageId)}">${escapeHtml(label)}</button>
                            `).join('')}
                        </div>
                    </div>
                    ${renderHeroFocusAsideMarkup(model.heroAside)}
                </div>
                <div class="lux-stat-row">
                    ${(model.stats || []).map(([value, label]) => `<div class="lux-stat lux-soft-chrome home-hover-chip"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`).join('')}
                </div>
            </section>
        `;
    }

    function renderWidgetContent(widget, role) {
        if (widget.renderType === 'alert') {
            if (!widget.alert) return '';
            const alertTone = ['green', 'royal', 'support', 'warm'].includes(widget.alert.tone) ? ` is-${widget.alert.tone}` : '';
            return `
                <div class="lux-soft-chrome lux-alert${alertTone}">
                    <div class="lux-alert-icon"><i class="${escapeHtml(widget.alert.icon)}"></i></div>
                    <div class="lux-alert-copy">
                        <strong>${escapeHtml(widget.alert.title)}</strong>
                        <span>${escapeHtml(widget.alert.copy)}</span>
                    </div>
                    <button class="lux-primary-btn" type="button" data-nav-target="${escapeHtml(widget.alert.actionPage)}">${escapeHtml(widget.alert.actionLabel)}</button>
                </div>
            `;
        }
        if (widget.renderType === 'hero') return renderHeroWidgetMarkup(widget.heroModel, role);
        if (widget.renderType === 'quick') {
            return `
                <section class="lux-soft-chrome lux-dashboard-section lux-builder-section">
                    <div class="lux-card-head">
                        <div>
                            <div class="lux-card-title">${escapeHtml(widget.title)}</div>
                            <div class="lux-builder-copy">${escapeHtml(widget.copy || '')}</div>
                        </div>
                        <div class="lux-card-meta">${escapeHtml(widget.meta || '')}</div>
                    </div>
                    <div class="lux-quick-grid lux-quick-grid--embedded">${renderQuickTilesMarkup(widget.tiles)}</div>
                </section>
            `;
        }
        if (widget.renderType === 'admin-ops') return renderAdminOpsMarkup(widget.adminOperations);
        return `
            <section class="lux-soft-chrome lux-card lux-builder-card">
                <div class="lux-card-head">
                    <div>
                        <div class="lux-card-title">${escapeHtml(widget.title)}</div>
                        <div class="lux-builder-copy">${escapeHtml(widget.copy || '')}</div>
                    </div>
                    <div class="lux-card-meta">${escapeHtml(widget.meta || '')}</div>
                </div>
                <div class="lux-list">${renderListRowsMarkup(widget.rows)}</div>
                ${widget.pageId ? `<div class="lux-builder-card-foot"><button class="lux-ghost-btn" type="button" data-nav-target="${escapeHtml(widget.pageId)}">Open ${escapeHtml(pageLabel(widget.pageId))}</button></div>` : ''}
            </section>
        `;
    }
