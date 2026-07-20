/* Home dashboard widget markup renderers. */
    function renderListRowsMarkup(rows) {
        return ((rows && rows.length) ? rows : [{ icon: 'fas fa-circle-info', title: 'Nothing new yet', copy: 'Open the related workspace to start activity here.' }]).map((row) => `
            <div class="lux-list-row lux-soft-chrome">
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
            <button class="lux-quick-btn lux-soft-chrome" type="button" data-nav-target="${escapeHtml(tile.pageId)}">
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
            <section class="lux-panel lux-admin-ops-panel lux-soft-chrome">
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
                                        return `<button class="lux-admin-op-btn" type="button" data-admin-provision="${escapeHtml(button.role)}"><i class="${escapeHtml(button.icon || 'fas fa-plus')}"></i><span>${escapeHtml(button.label)}</span></button>`;
                                    }
                                    if (button.type === 'focus') {
                                        return `<button class="lux-admin-op-btn" type="button" data-admin-focus="${escapeHtml(button.focus)}"><i class="${escapeHtml(button.icon || 'fas fa-layer-group')}"></i><span>${escapeHtml(button.label)}</span></button>`;
                                    }
                                    return `<button class="lux-admin-op-btn" type="button" data-nav-target="${escapeHtml(button.pageId)}"><i class="${escapeHtml(button.icon || 'fas fa-arrow-right')}"></i><span>${escapeHtml(button.label)}</span></button>`;
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
                    <aside class="lms-hero-focus lux-hero-side lux-focus-panel lux-soft-chrome" aria-label="${escapeHtml(kicker)}">
                        <div class="lms-hero-focus-head">
                            <div class="lms-hero-focus-kicker">${escapeHtml(kicker)}</div>
                            <span class="lms-hero-focus-chip" aria-label="Status">${escapeHtml(chip)}</span>
                        </div>
                        <div class="lms-hero-focus-body">
                            <div class="lms-hero-focus-title">${escapeHtml(headline)}</div>
                            <p class="lms-hero-focus-copy">${escapeHtml(copy)}</p>
                        </div>
                        <div class="lms-hero-focus-meta">
                            <span><i class="fas ${escapeHtml(meta.icon || 'fa-circle-dot')}"></i> ${escapeHtml(meta.text || '')}</span>
                        </div>
                    </aside>`;
    }



    function renderHeroWidgetMarkup(heroModel, role) {
        const model = heroModel || buildHomeModel(role);
        return `
            <section class="lux-panel lux-hero lux-builder-hero page-hero lux-soft-chrome lux-summary-surface--hero">
                <div class="lux-hero-stage">
                    <div class="lux-hero-main">
                        <div class="lux-kicker">${escapeHtml(model.kicker || ROLE_LABELS[role] || 'Portal View')}</div>
                        <h1 class="page-hero-title">${escapeHtml(model.title)}</h1>
                        <p class="page-hero-copy">${escapeHtml(model.copy)}</p>
                        <div class="lux-pill-row">
                            ${(model.pills || []).map((pill) => `<span class="lux-pill lux-soft-chrome">${escapeHtml(pill)}</span>`).join('')}
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
                    ${(model.stats || []).map(([value, label]) => `<div class="lux-stat lux-soft-chrome"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`).join('')}
                </div>
            </section>
        `;
    }

    function renderWidgetContent(widget, role) {
        if (widget.renderType === 'alert') {
            if (!widget.alert) return '';
            const alertTone = ['green', 'royal', 'support', 'warm'].includes(widget.alert.tone) ? ` is-${widget.alert.tone}` : '';
            return `
                <div class="lux-panel lux-soft-chrome lux-alert${alertTone}">
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
                <section class="lux-panel lux-dashboard-section lux-builder-section lux-soft-chrome">
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
        if (widget.renderType === 'shortcut' || widget.renderType === 'pinned') {
            return `
                <section class="lux-panel lux-card lux-builder-card lux-soft-chrome">
                    <div class="lux-shortcut-head">
                        <div class="lux-shortcut-icon"><i class="${escapeHtml(widget.icon)}"></i></div>
                        <div class="lux-card-meta">${escapeHtml(widget.meta || (widget.renderType === 'pinned' ? 'Pinned' : 'Shortcut'))}</div>
                    </div>
                    <div class="lux-shortcut-body">
                        <strong>${escapeHtml(widget.title || widget.label)}</strong>
                        <p>${escapeHtml(widget.copy || '')}</p>
                    </div>
                    <div class="lux-shortcut-foot">
                        <span class="lux-shortcut-status">${escapeHtml(widget.status || 'Open')}</span>
                        <button class="lux-secondary-btn" type="button" data-nav-target="${escapeHtml(widget.pageId)}">${escapeHtml(widget.renderType === 'pinned' ? 'Open record' : 'Open shortcut')}</button>
                    </div>
                </section>
            `;
        }
        return `
            <section class="lux-panel lux-card lux-builder-card lux-soft-chrome">
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

    function sortLayoutForDisplay(layout) {
        return (layout || []).filter((widget) => widget.visible !== false).slice().sort((a, b) => a.y - b.y || a.x - b.x || String(a.label).localeCompare(String(b.label)));
    }

    function renderWidgetEditorToolbar(widget, desktopEditor, isSelected = false) {
        const sizeCopy = widget.minimized ? `Minimized / ${widget.w} Ã— ${widget.h}` : `${widget.w} Ã— ${widget.h}`;
        if (!HOME_EDITOR_STATE.editing) return '';
        if (desktopEditor) return '';
        return `
            <div class="lux-widget-toolbar lux-widget-toolbar--builder" data-widget-drag-zone="${escapeHtml(widget.instanceId)}" title="${desktopEditor ? 'Drag this widget to a new position' : 'Desktop drag available on larger screens'}">
                <div class="lux-widget-toolbar-copy">
                    <button class="lux-widget-grab" type="button" data-widget-drag-handle="${escapeHtml(widget.instanceId)}" title="${desktopEditor ? 'Drag to move widget' : 'Desktop drag available on larger screens'}">
                        <i class="fas fa-grip-lines"></i>
                    </button>
                    <div>
                        <strong>${escapeHtml(widget.label)}</strong>
                        <span>${escapeHtml(sizeCopy)}</span>
                    </div>
                </div>
                <div class="lux-widget-toolbar-actions">
                    <button class="lux-widget-size-btn lux-widget-size-btn--labelled${isSelected ? ' is-active' : ''}" type="button" data-widget-select="${escapeHtml(widget.instanceId)}" title="Open size controls for this widget">Size</button>
                    ${desktopEditor ? '' : `
                        <button class="lux-widget-move-btn" type="button" data-widget-move="${escapeHtml(widget.instanceId)}" data-move-direction="-1" title="Move earlier"><i class="fas fa-arrow-up"></i></button>
                        <button class="lux-widget-move-btn" type="button" data-widget-move="${escapeHtml(widget.instanceId)}" data-move-direction="1" title="Move later"><i class="fas fa-arrow-down"></i></button>
                    `}
                    <button class="lux-widget-size-btn" type="button" data-widget-minimize="${escapeHtml(widget.instanceId)}" title="${widget.minimized ? 'Restore widget' : 'Minimize widget'}"><i class="fas ${widget.minimized ? 'fa-window-restore' : 'fa-window-minimize'}"></i></button>
                    <button class="lux-widget-size-btn lux-widget-size-btn--labelled" type="button" data-widget-size="${escapeHtml(widget.instanceId)}" data-size-axis="w" data-size-direction="-1" title="Make narrower">W-</button>
                    <button class="lux-widget-size-btn lux-widget-size-btn--labelled" type="button" data-widget-size="${escapeHtml(widget.instanceId)}" data-size-axis="w" data-size-direction="1" title="Make wider">W+</button>
                    <button class="lux-widget-size-btn lux-widget-size-btn--labelled" type="button" data-widget-size="${escapeHtml(widget.instanceId)}" data-size-axis="h" data-size-direction="-1" title="Make shorter">H-</button>
                    <button class="lux-widget-size-btn lux-widget-size-btn--labelled" type="button" data-widget-size="${escapeHtml(widget.instanceId)}" data-size-axis="h" data-size-direction="1" title="Make taller">H+</button>
                    <button class="lux-widget-remove" type="button" data-widget-hide="${escapeHtml(widget.instanceId)}" title="${widget.sourceType === 'system' ? 'Hide section' : 'Remove widget'}"><i class="fas fa-xmark"></i></button>
                </div>
            </div>
        `;
    }

    // Fixed professional layout (asd32): full-width bands + uniform 3-per-row spans.
    function professionalColumnSpan(widget) {
        if (Number.isFinite(Number(widget.span))) return Math.max(1, Math.min(12, Number(widget.span)));
        switch (widget.renderType) {
            case 'hero':
            case 'alert':
            case 'admin-ops':
            case 'quick':
                return 12;
            default:
                return 4;
        }
    }

    function renderWidgetShellMarkup(widget, role, renderMode, desktopEditor, viewportWidth = 0, overlapIds = null) {
        const isOverlapping = overlapIds instanceof Set && overlapIds.has(widget.instanceId);
        const desktopRect = getWidgetDesktopRect(widget, viewportWidth);
        const content = widget.minimized
            ? `
                <section class="lux-panel lux-widget-minimized-card lux-soft-chrome">
                    <div class="lux-widget-minimized-icon"><i class="${escapeHtml(widget.icon || 'fas fa-window-maximize')}"></i></div>
                    <div class="lux-widget-minimized-copy">
                        <strong>${escapeHtml(widget.label)}</strong>
                        <span>${escapeHtml(widget.meta || 'Dashboard panel')}</span>
                    </div>
                    <button class="lux-secondary-btn" type="button" data-widget-minimize="${escapeHtml(widget.instanceId)}">Restore</button>
                </section>
            `
            : renderWidgetContent(widget, role);
        if (!content) return '';
        const style = viewportWidth > 0
            ? `grid-column: span ${professionalColumnSpan(widget)}; z-index:${Number(widget.zIndex) || 1};`
            : renderMode === 'presentation'
                ? `grid-column:${widget.x} / span ${widget.w}; grid-row:${widget.y} / span ${widget.h}; z-index:${Number(widget.zIndex) || 1};`
                : 'grid-column:1 / -1;';
        const dragZoneAttr = HOME_EDITOR_STATE.editing && desktopEditor
            ? ` data-widget-drag-zone="${escapeHtml(widget.instanceId)}" title="Drag this widget to move it"`
            : '';
        return `
            <article class="lux-grid-widget${widget.minimized ? ' is-minimized' : ''}${HOME_EDITOR_STATE.selectedWidgetId === widget.instanceId ? ' is-selected' : ''}${HOME_EDITOR_STATE.dragState?.widgetId === widget.instanceId ? ' is-ghost-source' : ''}${isOverlapping ? ' is-overlapping' : ''}" data-widget-id="${escapeHtml(widget.instanceId)}" data-widget-type="${escapeHtml(widget.renderType)}" data-widget-selectable="${escapeHtml(widget.instanceId)}"${dragZoneAttr} style="${style}">
                ${HOME_EDITOR_STATE.editing && isOverlapping ? '<div class="lux-widget-overlap-badge" title="This widget overlaps another widget" aria-label="Overlapping widget">&#9888;&#65039;</div>' : ''}
                ${renderWidgetEditorToolbar(widget, desktopEditor, HOME_EDITOR_STATE.selectedWidgetId === widget.instanceId)}
                <div class="lux-grid-widget-body">${content}</div>
                ${desktopEditor && !widget.minimized ? `
                    <button class="lux-widget-resize-handle lux-widget-resize-handle--north" type="button" data-widget-resize="${escapeHtml(widget.instanceId)}" data-widget-resize-mode="resize-north" title="Drag to resize from top"><i class="fas fa-up-down"></i></button>
                    <button class="lux-widget-resize-handle lux-widget-resize-handle--west" type="button" data-widget-resize="${escapeHtml(widget.instanceId)}" data-widget-resize-mode="resize-west" title="Drag to resize from left"><i class="fas fa-left-right"></i></button>
                    <button class="lux-widget-resize-handle lux-widget-resize-handle--east" type="button" data-widget-resize="${escapeHtml(widget.instanceId)}" data-widget-resize-mode="resize-east" title="Drag to resize width"><i class="fas fa-left-right"></i></button>
                    <button class="lux-widget-resize-handle lux-widget-resize-handle--south" type="button" data-widget-resize="${escapeHtml(widget.instanceId)}" data-widget-resize-mode="resize-south" title="Drag to resize height"><i class="fas fa-up-down"></i></button>
                    <button class="lux-widget-resize-handle lux-widget-resize-handle--corner" type="button" data-widget-resize="${escapeHtml(widget.instanceId)}" data-widget-resize-mode="resize-corner" title="Drag to resize"><i class="fas fa-up-right-and-down-left-from-center"></i></button>
                ` : ''}
            </article>
        `;
    }
