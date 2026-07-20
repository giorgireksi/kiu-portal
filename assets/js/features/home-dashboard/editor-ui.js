/* Home dashboard editor panel and desktop gestures. */
    function renderEditorPanel(role, model, layout, systemDefinitions, desktopEditor) {
        const selectedWidget = getSelectedDraftWidget(layout);
        const selectedWidgetDesktopRect = selectedWidget && desktopEditor ? getWidgetDesktopRect(selectedWidget, getHomeViewportWidthForDesktop()) : null;
        const hiddenDefinitions = systemDefinitions.filter((definition) => {
            const existing = layout.find((widget) => widget.widgetId === definition.widgetId && widget.sourceType === 'system');
            return !existing || existing.visible === false;
        });
        const pinOptions = buildPinnedRecordOptions(role, model);
        HOME_EDITOR_STATE.availablePins = pinOptions;
        const shortcutDestinations = getShortcutDestinationOptions(role);
        const shortcutIconOptions = [['fas fa-book-reader', 'Book'], ['fas fa-calendar-week', 'Calendar'], ['fas fa-headset', 'Support'], ['fas fa-file-signature', 'Document'], ['fas fa-comments', 'Chat'], ['fas fa-book-open', 'Orders'], ['fas fa-layer-group', 'Systems'], ['fas fa-link', 'Link']];
        const mobileVisible = sortLayoutForDisplay(layout);
        const libraryHtml = hiddenDefinitions.length
            ? hiddenDefinitions.map((definition) => `<button class="lux-editor-library-item" type="button" data-restore-widget="${escapeHtml(definition.widgetId)}"><strong>${escapeHtml(definition.label)}</strong><span>${escapeHtml(definition.copy || definition.title || 'Restore widget')}</span></button>`).join('')
            : '<div class="lux-editor-empty">All system widgets are already visible for this role.</div>';
        const pinHtml = pinOptions.length
            ? pinOptions.map((item, index) => `<button class="lux-editor-library-item" type="button" data-pin-widget="${escapeHtml(String(index))}"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.copy)}</span></button>`).join('')
            : '<div class="lux-editor-empty">No pin-ready records are available in this view yet.</div>';
        const destinationOptions = shortcutDestinations.map((item) => `<option value="${escapeHtml(item.pageId)}">${escapeHtml(item.label)}</option>`).join('');
        const iconOptions = shortcutIconOptions.map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join('');
        const widthOptions = selectedWidget
            ? [...new Set([selectedWidget.minW || 2, 2, 3, 4, 5, 6, 8, 10, 12, selectedWidget.maxW || HOME_GRID_COLUMNS])]
                .filter((value) => value >= (selectedWidget.minW || 2) && value <= (selectedWidget.maxW || HOME_GRID_COLUMNS))
                .sort((a, b) => a - b)
            : [];
        const heightOptions = selectedWidget
            ? [...new Set([selectedWidget.minH || 3, 2, 3, 4, 5, 6, 8, 10, 12, selectedWidget.maxH || 12])]
                .filter((value) => value >= (selectedWidget.minH || 3) && value <= (selectedWidget.maxH || 12))
                .sort((a, b) => a - b)
            : [];
        const selectedWidgetHtml = selectedWidget
            ? `
                <section class="lux-panel lux-editor-card lux-editor-card--size lux-soft-chrome">
                    <div class="lux-card-head">
                        <div><div class="lux-card-title">Selected panel size</div><div class="lux-builder-copy">Make this widget smaller or larger without leaving the workspace.</div></div>
                        <div class="lux-card-meta">${escapeHtml(selectedWidgetDesktopRect ? `${Math.round(selectedWidgetDesktopRect.width)}Ã—${Math.round(selectedWidgetDesktopRect.height)} px` : `${selectedWidget.w}Ã—${selectedWidget.h}`)}</div>
                    </div>
                    <div class="lux-editor-size-card-head">
                        <div>
                            <strong>${escapeHtml(selectedWidget.label)}</strong>
                            <span>${escapeHtml(selectedWidget.title || selectedWidget.label)}</span>
                        </div>
                        <div class="lux-editor-size-badge">${escapeHtml(selectedWidget.minimized ? 'Minimized' : 'Live on canvas')}</div>
                    </div>
                    <div class="lux-editor-size-actions">
                        <button class="lux-widget-size-btn lux-widget-size-btn--labelled" type="button" data-widget-size="${escapeHtml(selectedWidget.instanceId)}" data-size-axis="w" data-size-direction="-1">Narrower</button>
                        <button class="lux-widget-size-btn lux-widget-size-btn--labelled" type="button" data-widget-size="${escapeHtml(selectedWidget.instanceId)}" data-size-axis="w" data-size-direction="1">Wider</button>
                        <button class="lux-widget-size-btn lux-widget-size-btn--labelled" type="button" data-widget-size="${escapeHtml(selectedWidget.instanceId)}" data-size-axis="h" data-size-direction="-1">Shorter</button>
                        <button class="lux-widget-size-btn lux-widget-size-btn--labelled" type="button" data-widget-size="${escapeHtml(selectedWidget.instanceId)}" data-size-axis="h" data-size-direction="1">Taller</button>
                    </div>
                    <div class="lux-editor-size-axis">
                        <div class="lux-editor-size-axis-head"><span>Width</span><strong>${escapeHtml(selectedWidgetDesktopRect ? `${Math.round(selectedWidgetDesktopRect.width)} px` : `${selectedWidget.w} columns`)}</strong></div>
                        <div class="lux-editor-size-choice-row">
                            ${widthOptions.map((value) => `<button class="lux-editor-size-choice${selectedWidget.w === value ? ' is-active' : ''}" type="button" data-widget-dimension="${escapeHtml(selectedWidget.instanceId)}" data-dimension-axis="w" data-dimension-value="${escapeHtml(String(value))}">${escapeHtml(String(value))}</button>`).join('')}
                        </div>
                    </div>
                    <div class="lux-editor-size-axis">
                        <div class="lux-editor-size-axis-head"><span>Height</span><strong>${escapeHtml(selectedWidgetDesktopRect ? `${Math.round(selectedWidgetDesktopRect.height)} px` : `${selectedWidget.h} rows`)}</strong></div>
                        <div class="lux-editor-size-choice-row">
                            ${heightOptions.map((value) => `<button class="lux-editor-size-choice${selectedWidget.h === value ? ' is-active' : ''}" type="button" data-widget-dimension="${escapeHtml(selectedWidget.instanceId)}" data-dimension-axis="h" data-dimension-value="${escapeHtml(String(value))}">${escapeHtml(String(value))}</button>`).join('')}
                        </div>
                    </div>
                    <div class="lux-editor-size-note">Current range: width ${escapeHtml(String(selectedWidget.minW || 2))}-${escapeHtml(String(selectedWidget.maxW || HOME_GRID_COLUMNS))}, height ${escapeHtml(String(selectedWidget.minH || 3))}-${escapeHtml(String(selectedWidget.maxH || 12))}.</div>
                </section>
            `
            : `
                <section class="lux-panel lux-editor-card lux-editor-card--size lux-soft-chrome">
                    <div class="lux-card-head">
                        <div><div class="lux-card-title">Selected panel size</div><div class="lux-builder-copy">Pick any widget from the canvas to adjust its size here.</div></div>
                        <div class="lux-card-meta">No selection</div>
                    </div>
                    <div class="lux-editor-empty">Select a widget on the canvas to resize it from this panel.</div>
                </section>
            `;
        const mobileEditorHtml = desktopEditor ? '' : `
            <section class="lux-panel lux-editor-card lux-soft-chrome">
                <div class="lux-card-head">
                    <div><div class="lux-card-title">Touch editor</div><div class="lux-builder-copy">Move widgets up or down and tune their size from this list preview.</div></div>
                    <div class="lux-card-meta">Mobile / tablet</div>
                </div>
                <div class="lux-editor-mobile-list">
                    ${mobileVisible.map((widget) => `
                        <div class="lux-editor-mobile-item">
                            <div class="lux-editor-mobile-copy">
                                <strong>${escapeHtml(widget.label)}</strong>
                                <span>${escapeHtml(String(widget.w) + 'x' + String(widget.h))}</span>
                            </div>
                            <div class="lux-editor-mobile-actions">
                                <button type="button" data-widget-move="${escapeHtml(widget.instanceId)}" data-move-direction="-1"><i class="fas fa-arrow-up"></i></button>
                                <button type="button" data-widget-move="${escapeHtml(widget.instanceId)}" data-move-direction="1"><i class="fas fa-arrow-down"></i></button>
                                <button type="button" data-widget-size="${escapeHtml(widget.instanceId)}" data-size-axis="w" data-size-direction="-1"><i class="fas fa-left-right"></i></button>
                                <button type="button" data-widget-size="${escapeHtml(widget.instanceId)}" data-size-axis="w" data-size-direction="1"><i class="fas fa-arrows-left-right"></i></button>
                                <button type="button" data-widget-size="${escapeHtml(widget.instanceId)}" data-size-axis="h" data-size-direction="-1"><i class="fas fa-up-down"></i></button>
                                <button type="button" data-widget-size="${escapeHtml(widget.instanceId)}" data-size-axis="h" data-size-direction="1"><i class="fas fa-arrows-up-down"></i></button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
        const inspectorState = HOME_EDITOR_STATE.inspectorState || getDefaultInspectorState();
        const minimizedWidgets = sortLayoutForDisplay(layout).filter((widget) => widget.minimized);
        const minimizedHtml = minimizedWidgets.length
            ? minimizedWidgets.map((widget) => `<button class="lux-editor-library-item lux-editor-library-item--restore" type="button" data-widget-minimize="${escapeHtml(widget.instanceId)}"><strong>${escapeHtml(widget.label)}</strong><span>Restore this minimized panel to the canvas.</span></button>`).join('')
            : '<div class="lux-editor-empty">No minimized widgets are waiting in this layout.</div>';
        if (desktopEditor && inspectorState.collapsed) {
            return `
                <button class="lux-home-editor-chip" type="button" data-inspector-toggle="open" style="left:${Math.round(inspectorState.x)}px; top:${Math.round(inspectorState.y)}px;">
                    <i class="fas fa-sliders"></i>
                    <span>Dashboard tools</span>
                </button>
            `;
        }
        return `
            <aside class="lux-home-editor-panel--builder${desktopEditor ? ' is-floating' : ''}" data-inspector-panel="1" style="${desktopEditor ? `left:${Math.round(inspectorState.x)}px; top:${Math.round(inspectorState.y)}px; width:${Math.round(inspectorState.width)}px;` : ''}">
                ${desktopEditor ? `
                    <div class="lux-home-editor-header" data-inspector-drag-handle="1">
                        <div class="lux-home-editor-header-copy">
                            <strong>Dashboard tools</strong>
                            <span>Floating workspace inspector</span>
                        </div>
                        <div class="lux-home-editor-header-actions">
                            <button class="lux-widget-size-btn" type="button" data-inspector-toggle="collapse" title="Collapse inspector"><i class="fas fa-minus"></i></button>
                        </div>
                    </div>
                ` : ''}
                <div class="lux-home-editor-body">
                ${selectedWidgetHtml}
                <section class="lux-panel lux-editor-card lux-soft-chrome">
                    <div class="lux-card-head">
                        <div><div class="lux-card-title">Widget library</div><div class="lux-builder-copy">Restore hidden system panels or add optional sections for this role and faculty.</div></div>
                        <div class="lux-card-meta">${escapeHtml(getFacultyName(getCurrentFacultyCode()))}</div>
                    </div>
                    <div class="lux-editor-library-grid">${libraryHtml}</div>
                </section>
                <section class="lux-panel lux-editor-card lux-soft-chrome">
                    <div class="lux-card-head">
                        <div><div class="lux-card-title">Pin records</div><div class="lux-builder-copy">Add small dashboard cards for live records already available in this portal.</div></div>
                        <div class="lux-card-meta">Pinned</div>
                    </div>
                    <div class="lux-editor-library-grid">${pinHtml}</div>
                </section>
                <section class="lux-panel lux-editor-card lux-soft-chrome">
                    <div class="lux-card-head">
                        <div><div class="lux-card-title">Minimized panels</div><div class="lux-builder-copy">Restore panels you tucked away without losing their saved place in this role and faculty layout.</div></div>
                        <div class="lux-card-meta">Canvas</div>
                    </div>
                    <div class="lux-editor-library-grid">${minimizedHtml}</div>
                </section>
                <section class="lux-panel lux-editor-card lux-soft-chrome">
                    <div class="lux-card-head">
                        <div><div class="lux-card-title">New shortcut tile</div><div class="lux-builder-copy">Create your own internal portal shortcut without touching the underlying logic.</div></div>
                        <div class="lux-card-meta">Internal pages</div>
                    </div>
                    <label class="lux-editor-field"><span>Label</span><input id="lux-shortcut-label" type="text" placeholder="For example: Open staff board"></label>
                    <label class="lux-editor-field"><span>Destination</span><select id="lux-shortcut-page">${destinationOptions}</select></label>
                    <label class="lux-editor-field"><span>Description</span><input id="lux-shortcut-copy" type="text" placeholder="A short note about what this shortcut opens"></label>
                    <div class="lux-editor-field-grid">
                        <label class="lux-editor-field"><span>Icon</span><select id="lux-shortcut-icon">${iconOptions}</select></label>
                    </div>
                    <button class="lux-primary-btn" id="lux-add-shortcut-btn" type="button">Add shortcut tile</button>
                </section>
                ${mobileEditorHtml}
                <section class="lux-panel lux-editor-card lux-soft-chrome">
                    <div class="lux-card-head">
                        <div><div class="lux-card-title">Reset & defaults</div><div class="lux-builder-copy">Return the active dashboard or the full home experience to the KIU defaults whenever you want.</div></div>
                        <div class="lux-card-meta">Safe reset</div>
                    </div>
                    <div class="lux-editor-reset-grid">
                        <button class="lux-ghost-btn" type="button" data-home-reset="current-role">Reset current role layout</button>
                        <button class="lux-ghost-btn" type="button" data-home-reset="all-layouts">Reset all role layouts</button>
                        <button class="lux-ghost-btn" type="button" data-home-reset="home-defaults">Reset home to KIU defaults</button>
                    </div>
                </section>
                </div>
            </aside>
        `;
    }

    function ensureCanvasGuide(canvas) {
        if (!canvas) return null;
        let guide = canvas.querySelector('.lux-widget-guide');
        if (!guide) {
            guide = document.createElement('div');
            guide.className = 'lux-widget-guide';
            guide.innerHTML = `
                <span class="lux-widget-guide-origin"></span>
                <span class="lux-widget-guide-dot"></span>
                <span class="lux-widget-guide-label"></span>
            `;
            canvas.appendChild(guide);
        }
        return guide;
    }

    function updateCanvasGuide(canvas, preview) {
        const guide = ensureCanvasGuide(canvas);
        if (!guide || !preview) return;
        const guideLabel = guide.querySelector('.lux-widget-guide-label');
        guide.classList.add('is-visible');
        if (preview.left != null) {
            guide.style.left = `${Math.round(preview.left)}px`;
            guide.style.top = `${Math.round(preview.top)}px`;
            guide.style.width = `${Math.round(preview.width)}px`;
            guide.style.height = `${Math.round(preview.height)}px`;
            if (guideLabel) guideLabel.textContent = `${Math.round(preview.width)} x ${Math.round(preview.height)} px`;
            return;
        }
        const metrics = getDesktopCanvasMetrics(Math.round(canvas.getBoundingClientRect().width || getHomeViewportWidthForDesktop()));
        const left = Math.max(0, (Math.max(1, Number(preview.x) || 1) - 1) * (metrics.cellWidth + metrics.gapX));
        const top = Math.max(0, (Math.max(1, Number(preview.y) || 1) - 1) * (metrics.rowHeight + metrics.gapY));
        const width = toDesktopPixelWidth(preview.w || 4, metrics);
        const height = toDesktopPixelHeight(preview.h || 4, metrics);
        guide.style.left = `${Math.round(left)}px`;
        guide.style.top = `${Math.round(top)}px`;
        guide.style.width = `${Math.round(width)}px`;
        guide.style.height = `${Math.round(height)}px`;
        if (guideLabel) guideLabel.textContent = `${preview.w} x ${preview.h}  â€¢  ${preview.x},${preview.y}`;
    }

    function clearCanvasGuide(canvas) {
        const guide = canvas?.querySelector('.lux-widget-guide');
        if (guide) {
            guide.classList.remove('is-visible');
            const guideLabel = guide.querySelector('.lux-widget-guide-label');
            if (guideLabel) guideLabel.textContent = '';
        }
    }

    function beginDesktopWidgetGesture(event, widgetId, mode, homeShell) {
        if (!HOME_EDITOR_STATE.editing || !isDesktopHomeEditorViewport()) return;
        const canvas = homeShell.querySelector('.lux-dashboard-canvas');
        const widget = HOME_EDITOR_STATE.draftLayout?.find((item) => item.instanceId === widgetId);
        if (!canvas || !widget) return;
        HOME_EDITOR_STATE.selectedWidgetId = widgetId;
        bringDraftWidgetToFront(widgetId, { render: false });
        event.preventDefault();
        event.stopPropagation();
        const rect = canvas.getBoundingClientRect();
        const viewportWidth = Math.round(rect.width);
        const originRect = getWidgetDesktopRect(widget, viewportWidth);
        const widgetElement = homeShell.querySelector(`[data-widget-id="${CSS.escape(widgetId)}"]`);
        const minWidth = getWidgetMinDesktopWidth(widget, getDesktopCanvasMetrics(viewportWidth));
        const maxWidth = getWidgetMaxDesktopWidth(widget, getDesktopCanvasMetrics(viewportWidth));
        const minHeight = getWidgetMinDesktopHeight(widget, getDesktopCanvasMetrics(viewportWidth));
        const maxHeight = getWidgetMaxDesktopHeight(widget, getDesktopCanvasMetrics(viewportWidth));
        const rightEdge = originRect.left + originRect.width;
        const bottomEdge = originRect.top + originRect.height;
        const originalCanvasHeight = Number.parseFloat(canvas.style.height) || canvas.getBoundingClientRect().height || 0;
        const activePointerTarget = event.currentTarget;
        try {
            activePointerTarget?.setPointerCapture?.(event.pointerId);
        } catch (captureError) {
            // Pointer capture is best-effort; window-level listeners below keep the gesture working.
        }

        const applyLiveRect = (nextRect) => {
            if (!widgetElement) return;
            if (mode === 'move') {
                widgetElement.style.left = `${originRect.left}px`;
                widgetElement.style.top = `${originRect.top}px`;
                widgetElement.style.width = `${originRect.width}px`;
                widgetElement.style.height = `${originRect.height}px`;
                widgetElement.style.transform = `translate3d(${nextRect.left - originRect.left}px, ${nextRect.top - originRect.top}px, 0)`;
            } else {
                widgetElement.style.transform = 'translate3d(0, 0, 0)';
                widgetElement.style.left = `${nextRect.left}px`;
                widgetElement.style.top = `${nextRect.top}px`;
                widgetElement.style.width = `${nextRect.width}px`;
                widgetElement.style.height = `${nextRect.height}px`;
            }
            widgetElement.style.zIndex = String(getHighestWidgetZIndex(HOME_EDITOR_STATE.draftLayout) + 1);
            canvas.style.height = `${Math.max(originalCanvasHeight, Math.ceil(nextRect.top + nextRect.height + 72))}px`;
        };

        const buildLiveRect = (dx, dy) => {
            let nextRect = { ...originRect };
            if (mode === 'move') {
                nextRect.left = originRect.left + dx;
                nextRect.top = originRect.top + dy;
            } else {
                if (mode === 'resize-east' || mode === 'resize-corner') {
                    nextRect.width = originRect.width + dx;
                }
                if (mode === 'resize-south' || mode === 'resize-corner') {
                    nextRect.height = originRect.height + dy;
                }
                if (mode === 'resize-west') {
                    nextRect.width = clampNumber(originRect.width - dx, minWidth, maxWidth);
                    nextRect.left = rightEdge - nextRect.width;
                }
                if (mode === 'resize-north') {
                    nextRect.height = clampNumber(originRect.height - dy, minHeight, maxHeight);
                    nextRect.top = bottomEdge - nextRect.height;
                }
            }
            return normalizeDesktopRect(widget, nextRect, viewportWidth);
        };

        HOME_EDITOR_STATE.dragState = {
            mode,
            widgetId,
            startX: event.clientX,
            startY: event.clientY,
            viewportWidth,
            originRect: { ...originRect },
            preview: { ...originRect }
        };
        updateCanvasGuide(canvas, HOME_EDITOR_STATE.dragState.preview);
        widgetElement?.classList.add('is-live-moving');
        document.body.classList.add('lux-dashboard-gesture-active');

        const handleMove = (moveEvent) => {
            if (!HOME_EDITOR_STATE.dragState) return;
            const dx = moveEvent.clientX - HOME_EDITOR_STATE.dragState.startX;
            const dy = moveEvent.clientY - HOME_EDITOR_STATE.dragState.startY;
            HOME_EDITOR_STATE.dragState.preview = buildLiveRect(dx, dy);
            if (HOME_EDITOR_STATE.dragState.frame) return;
            HOME_EDITOR_STATE.dragState.frame = window.requestAnimationFrame(() => {
                const state = HOME_EDITOR_STATE.dragState;
                if (!state) return;
                state.frame = 0;
                applyLiveRect(state.preview);
                updateCanvasGuide(canvas, state.preview);
            });
        };

        const finishGesture = () => {
            const state = HOME_EDITOR_STATE.dragState;
            if (!state) return;
            if (state.frame) {
                window.cancelAnimationFrame(state.frame);
                state.frame = 0;
            }
            const preview = state.preview;
            applyLiveRect(preview);
            const desktopEditor = isDesktopHomeEditorViewport();
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', finishGesture);
            window.removeEventListener('pointercancel', finishGesture);
            try {
                activePointerTarget?.releasePointerCapture?.(event.pointerId);
            } catch (captureError) {
                // Matching the best-effort capture above.
            }
            widgetElement?.classList.remove('is-live-moving');
            document.body.classList.remove('lux-dashboard-gesture-active');
            clearCanvasGuide(canvas);
            HOME_EDITOR_STATE.dragState = null;
            updateDraftWidget(widgetId, (next) => {
                if (desktopEditor) {
                    const gridRect = desktopRectToGridRect(next, preview, viewportWidth);
                    next.x = gridRect.x;
                    next.y = gridRect.y;
                    next.w = gridRect.w;
                    next.h = gridRect.h;
                    next.desktopRect = { ...preview };
                    next.restoreDesktopRect = { ...next.desktopRect };
                    next.desktopRectViewportWidth = viewportWidth;
                    next.restoreDesktopRectViewportWidth = viewportWidth;
                } else {
                    next.desktopRect = null;
                    next.restoreDesktopRect = null;
                }
                if (!next.minimized) {
                    next.restoreRect = { ...(next.restoreRect || {}), x: next.x, y: next.y, w: next.w, h: next.h };
                }
            }, { stabilize: true, priority: widgetId });
        };

        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', finishGesture);
        window.addEventListener('pointercancel', finishGesture);
    }
