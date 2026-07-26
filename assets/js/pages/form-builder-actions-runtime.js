/* Builder input/events peeled from form-builder-runtime.js. Load before host. */
(function () {
    if (window.__KIU_FORM_BUILDER_ACTIONS_LOADED) return;
    window.__KIU_FORM_BUILDER_ACTIONS_LOADED = true;
    window.__kiuCreateFormBuilderActionsApi = function createKiuFormBuilderActionsApi(deps = {}) {
        const d = deps;
        const H = d.H;
        const NS = d.NS;
        const datasetFromElement = d.datasetFromElement;
        const getTypes = d.getTypes;
        const getType = d.getType;
        const handleBuilderAction = d.handleBuilderAction;
        const saveDroplistOptionsLines = d.saveDroplistOptionsLines;
        const syncStudioPreviewFocus = d.syncStudioPreviewFocus;
        const parseOptionsFromLines = d.parseOptionsFromLines;
        const contentRootEl = d.contentRootEl;
        const ds = d.ds;
        const filterStudioStepNav = d.filterStudioStepNav;
        const markBuilderDirty = d.markBuilderDirty;
        const notifyBlueprintSaved = d.notifyBlueprintSaved;
        const sectionTitleDisplay = d.sectionTitleDisplay;
        const updateStudioSaveStatus = d.updateStudioSaveStatus;
        const syncFieldKeyFromLabel = d.syncFieldKeyFromLabel;
        const scheduleDroplistOptionsSave = d.scheduleDroplistOptionsSave;
        const droplistOptionsSaveTimers = d.droplistOptionsSaveTimers;
        const reorderStaffFormSectionLocal = d.reorderStaffFormSectionLocal;
        const reorderStaffFormFieldLocal = d.reorderStaffFormFieldLocal;
        void d;
    function handleBuilderInput(el, callbacks) {
        const inputType = ds(el, 'staffBuilderInput', 'studentBuilderInput');
        const data = datasetFromElement(el);
        if (!inputType || !data.typeId) return;
        const state = callbacks.getState?.() || {};
        const bucket = data.bucket === 'droplist' ? 'droplist' : 'input';

        if (inputType === 'step-search') {
            filterStudioStepNav(contentRootEl(), el.value);
            return;
        }

        if (inputType === 'section-filter-group') {
            if (!data.sectionId || typeof window[H.updateSection] !== 'function') return;
            const result = window[H.updateSection](data.typeId, null, data.sectionId, { filterGroup: el.checked });
            if (result?.error) {
                callbacks.onToast?.(result.error);
                return;
            }
            markBuilderDirty(callbacks);
            notifyBlueprintSaved(callbacks, data.typeId);
            return;
        }

        if (inputType === 'section-title' || inputType === 'section-description') {
            if (!data.sectionId || typeof window[H.updateSection] !== 'function') return;
            let text = String(el.value ?? '').trim();
            if (/[<>]/.test(text)) text = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            if (text.length > 160) text = text.slice(0, 160);
            if (el.value !== text) el.value = text;
            const patch = inputType === 'section-title' ? { title: text } : { description: text };
            const result = window[H.updateSection](data.typeId, null, data.sectionId, patch);
            if (result?.error) {
                callbacks.onToast?.(result.error);
                return;
            }
            if (inputType === 'section-title') {
                const root = contentRootEl();
                const navItem = root?.querySelector(`.${H.hub}-studio-step-nav-item[data-${H.data}-section-id="${data.sectionId}"]`);
                const titleSpan = navItem?.querySelector(('.' + H.hub + '-studio-step-nav-title'));
                const displayTitle = sectionTitleDisplay(el.value);
                if (titleSpan) titleSpan.textContent = displayTitle;
                const detailHead = root?.querySelector(`.${H.hub}-studio-step-detail[data-${H.data}-section-id="${data.sectionId}"] strong`);
                if (detailHead) detailHead.textContent = displayTitle;
                const builderTitle = root?.querySelector(`.${H.hub}-profile-row[data-${H.data}-section-id="${data.sectionId}"] [data-${H.data}-builder-input="section-title"]`);
                if (builderTitle && builderTitle !== el) builderTitle.value = el.value;
            }
            markBuilderDirty(callbacks);
            return;
        }

        if (!data.sectionId || !data.fieldId || typeof window[H.updateField] !== 'function') return;

        if (inputType === 'droplist-options-lines') {
            saveDroplistOptionsLines(el, callbacks, { refresh: true });
            return;
        }

        const patch = {};
        if (inputType === 'label') {
            let text = String(el.value ?? '').trim();
            if (/[<>]/.test(text)) text = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            text = text.slice(0, 160) || 'New field';
            const lower = text.toLowerCase();
            const markers = ['admin workspace', 'staff form settings', 'staff directory', 'form blueprint', 'staff-hub-'];
            let hits = 0;
            markers.forEach((marker) => { if (lower.includes(marker)) hits += 1; });
            if (hits >= 2 || (hits >= 1 && text.length > 48) || text.length > 120) text = 'New field';
            patch.label = text;
            if (el.value !== patch.label) el.value = patch.label;
        }
        if (inputType === 'key') {
            patch.key = el.value;
            const locked = { ...(state.lockedFieldKeys || {}) };
            locked[data.fieldId] = true;
            callbacks.setState?.({ lockedFieldKeys: locked, builderDirty: true });
            updateStudioSaveStatus(true);
        }
        if (inputType === 'type') patch.type = el.value;
        if (inputType === 'required') patch.required = el.checked;
        if (inputType === 'showInDirectoryFilter') patch.showInDirectoryFilter = el.checked;
        if (inputType === 'placeholder') patch.placeholder = el.value;
        if (inputType === 'help') patch.help = el.value;
        if (inputType === 'width-full') patch.width = el.checked ? 'full' : 'half';
        if (!Object.keys(patch).length) return;

        const result = window[H.updateField](data.typeId, bucket, data.sectionId, data.fieldId, patch);
        if (result?.error) {
            callbacks.onToast?.(result.error);
            return;
        }

        if (inputType === 'label') {
            syncFieldKeyFromLabel(state, data.typeId, bucket, data.sectionId, data.fieldId, el.value, callbacks);
        }
        if (inputType !== 'key') markBuilderDirty(callbacks);
    }

    function handleBuilderCopyChange(el, callbacks) {
        const copyKey = ds(el, 'staffBuilderCopy', 'studentBuilderCopy');
        if (!copyKey) return;
        const patch = {};
        if (copyKey === 'source') patch.copySourceTypeId = el.value || null;
        if (copyKey === 'sections') patch.copySections = el.checked;
        if (copyKey === 'inputs') patch.copySections = el.checked;
        if (copyKey === 'droplists') patch.copySections = el.checked;
        callbacks.setState?.(patch);
    }

    function syncStudioPopoverRowState(popover, rowOpenClass) {
        const row = popover?.closest(('.' + H.hub + '-studio-field-row'));
        if (!row) return;
        row.classList.toggle(rowOpenClass, Boolean(popover?.open));
        const trigger = popover?.querySelector(('.' + H.hub + '-studio-type-trigger, summary'));
        if (trigger) trigger.setAttribute('aria-expanded', popover?.open ? 'true' : 'false');
    }

    function syncStudioPopoverPlacement(popover) {
        const row = popover?.closest(('.' + H.hub + '-studio-field-row'));
        if (!row) {
            return;
        }
        if (!popover?.open) {
            row.classList.remove('is-flip-menu-up');
            return;
        }
        const menu = popover.querySelector(('.' + H.hub + '-studio-type-menu, .' + H.hub + '-studio-field-menu-panel'));
        const workspace = row.closest(('.' + H.hub + '-studio-layout, .' + H.hub + '-section-field-workspace, .' + H.hub + '-section-builder-panel'));
        if (!menu || !workspace) {
            row.classList.remove('is-flip-menu-up');
            return;
        }
        const workspaceRect = workspace.getBoundingClientRect();
        const rowRect = row.getBoundingClientRect();
        const menuHeight = menu.offsetHeight || 220;
        const spaceBelow = workspaceRect.bottom - rowRect.bottom;
        const isCanvasWorkspace = workspace.classList.contains((H.hub + '-section-field-workspace'));
        const rowIndex = Array.from(row.parentElement?.children || []).indexOf(row);
        const rowCount = row.parentElement?.children?.length || 0;
        const nearBottom = rowIndex >= Math.max(0, rowCount - 2);
        row.classList.toggle('is-flip-menu-up', spaceBelow < menuHeight + 12 || (isCanvasWorkspace && nearBottom && spaceBelow < menuHeight + 48));
    }

    function closeOtherStudioPopovers(root, keepPopover) {
        root.querySelectorAll(('.' + H.hub + '-studio-type-popover[open], .' + H.hub + '-studio-field-menu[open]')).forEach((popover) => {
            if (popover === keepPopover) return;
            popover.open = false;
        });
    }

    function closeOpenStudioPopovers(root) {
        root.querySelectorAll(('.' + H.hub + '-studio-type-popover[open], .' + H.hub + '-studio-field-menu[open]')).forEach((popover) => {
            popover.open = false;
        });
    }

    function isStudioPopoverInteractionTarget(target) {
        return Boolean(target?.closest?.(
            ('.' + H.hub + '-studio-type-menu, .' + H.hub + '-studio-field-menu-panel, .' + H.hub + '-studio-type-trigger, .' + H.hub + '-studio-type-popover summary, .' + H.hub + '-studio-field-menu summary, .' + H.hub + '-studio-type-menu-viewport, .' + H.hub + '-studio-field-menu-viewport')
        ));
    }

    function closeStudioPopoverForAction(el) {
        if (!el) return;
        const popover = el.closest(('.' + H.hub + '-studio-type-popover, .' + H.hub + '-studio-field-menu'));
        if (popover) popover.open = false;
    }

    function clearStaffBuilderDropIndicators(dropList, rowSelector) {
        if (!dropList) return;
        dropList.querySelectorAll(rowSelector).forEach((row) => {
            row.classList.remove('is-drop-before', 'is-drop-after');
        });
    }

    function resolveStaffBuilderDropIndex(rows, dragRow, targetRow, placeBefore) {
        const fromIndex = rows.indexOf(dragRow);
        if (fromIndex < 0) return -1;
        if (!targetRow || targetRow === dragRow) return fromIndex;
        const targetIndex = rows.indexOf(targetRow);
        if (targetIndex < 0) return fromIndex;
        if (placeBefore) {
            return fromIndex < targetIndex ? targetIndex - 1 : targetIndex;
        }
        return fromIndex < targetIndex ? targetIndex : targetIndex + 1;
    }

    function findStaffBuilderDropTarget(dropList, rowSelector, clientY, dragRow) {
        const rows = Array.from(dropList.querySelectorAll(rowSelector)).filter((row) => row !== dragRow);
        let targetRow = null;
        let placeBefore = true;
        rows.forEach((row) => {
            const rect = row.getBoundingClientRect();
            if (clientY < rect.top || clientY > rect.bottom) return;
            targetRow = row;
            placeBefore = clientY < rect.top + rect.height / 2;
        });
        return { targetRow, placeBefore };
    }

    function finishStaffBuilderDragReorder(dragState, callbacks) {
        if (!dragState) return;
        const { dropList, rowSelector, dragRow, kind, typeId, sectionId, dragId } = dragState;
        const rows = Array.from(dropList.querySelectorAll(rowSelector));
        const fromIndex = rows.indexOf(dragRow);
        let toIndex = fromIndex;
        if (dragState.dropTarget?.targetRow) {
            toIndex = resolveStaffBuilderDropIndex(
                rows,
                dragRow,
                dragState.dropTarget.targetRow,
                dragState.dropTarget.placeBefore
            );
        }
        clearStaffBuilderDropIndicators(dropList, rowSelector);
        dragRow.classList.remove('is-dragging');
        if (dragState.handle?.releasePointerCapture) {
            try {
                dragState.handle.releasePointerCapture(dragState.pointerId);
            } catch (_error) {
                void _error;
            }
        }
        if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;
        let result;
        if (kind === 'profile') {
            result = reorderStaffFormSectionLocal(typeId, dragId, toIndex);
        } else {
            result = reorderStaffFormFieldLocal(typeId, sectionId, dragId, toIndex);
        }
        if (result?.error) callbacks.onToast?.(result.error);
        markBuilderDirty(callbacks);
        notifyBlueprintSaved(callbacks, typeId);
        callbacks.onRefresh?.();
    }

    function bindStaffBuilderDragReorder(root, callbacks = {}) {
        let dragState = null;

        const endDrag = (event) => {
            if (!dragState || event.pointerId !== dragState.pointerId) return;
            finishStaffBuilderDragReorder(dragState, callbacks);
            dragState = null;
        };

        root.addEventListener('pointerdown', (event) => {
            const handle = event.target.closest(('[' + ('data-' + H.data + '-') + 'field-drag-handle], [' + ('data-' + H.data + '-') + 'profile-drag-handle]'));
            if (!handle || !root.contains(handle)) return;
            const dragRow = handle.closest(('.' + H.hub + '-studio-field-row, .' + H.hub + '-profile-row'));
            if (!dragRow || dragRow.classList.contains('is-remove-pending')) return;
            const dropList = handle.closest(('[' + ('data-' + H.data + '-') + 'field-drop-list], [' + ('data-' + H.data + '-') + 'profile-drop-list]'));
            if (!dropList) return;
            event.preventDefault();
            event.stopPropagation();
            closeOpenStudioPopovers(root);
            const isProfile = Boolean(handle.matches(('[' + ('data-' + H.data + '-') + 'profile-drag-handle]')));
            dragState = {
                handle,
                dragRow,
                dropList,
                pointerId: event.pointerId,
                kind: isProfile ? 'profile' : 'field',
                rowSelector: isProfile ? ('.' + H.hub + '-profile-row') : ('.' + H.hub + '-studio-field-row'),
                dragId: isProfile ? ds(dragRow, 'staffSectionId', 'studentSectionId') : ds(dragRow, 'staffFieldId', 'studentFieldId'),
                typeId: ds(dragRow, 'staffTypeId', 'studentTypeId') || ds(dropList, 'staffTypeId', 'studentTypeId') || '',
                sectionId: ds(dragRow, 'staffSectionId', 'studentSectionId') || ds(dropList, 'staffSectionId', 'studentSectionId') || ''
            };
            handle.setPointerCapture(event.pointerId);
            dragRow.classList.add('is-dragging');
        }, true);

        root.addEventListener('pointermove', (event) => {
            if (!dragState || event.pointerId !== dragState.pointerId) return;
            clearStaffBuilderDropIndicators(dragState.dropList, dragState.rowSelector);
            const { targetRow, placeBefore } = findStaffBuilderDropTarget(
                dragState.dropList,
                dragState.rowSelector,
                event.clientY,
                dragState.dragRow
            );
            if (targetRow) {
                targetRow.classList.add(placeBefore ? 'is-drop-before' : 'is-drop-after');
                dragState.dropTarget = { targetRow, placeBefore };
            } else {
                dragState.dropTarget = null;
            }
        });

        root.addEventListener('pointerup', endDrag);
        root.addEventListener('pointercancel', endDrag);
    }

    function bindStaffFormBuilderEvents(callbacks = {}) {
        const boundKey = NS === 'staff' ? '__staffFormBuilderBound' : '__studentFormBuilderBound';
        if (window[boundKey]) return;
        window[boundKey] = true;

        const root = contentRootEl();
        if (!root) return;

        root.addEventListener('click', (event) => {
            const actionEl = event.target.closest(('[' + ('data-' + H.data + '-') + 'builder-action]'));
            if (actionEl && root.contains(actionEl)) {
                event.preventDefault();
                handleBuilderAction(ds(actionEl, 'staffBuilderAction', 'studentBuilderAction'), actionEl, callbacks);
                return;
            }

            const profileRow = event.target.closest(('.' + H.hub + '-profile-row'));
            if (!profileRow || !root.contains(profileRow)) return;
            if (event.target.closest('input, button, textarea, select, label, a')) return;
            event.preventDefault();
            handleBuilderAction('select-section', profileRow, callbacks);
        });

        document.addEventListener('pointerdown', (event) => {
            const hasOpenPopover = root.querySelector(('.' + H.hub + '-studio-type-popover[open], .' + H.hub + '-studio-field-menu[open]'));
            if (!hasOpenPopover) return;
            if (isStudioPopoverInteractionTarget(event.target)) return;
            closeOpenStudioPopovers(root);
        });

        root.addEventListener('toggle', (event) => {
            const typePopover = event.target.closest(('.' + H.hub + '-studio-type-popover'));
            if (typePopover && root.contains(typePopover)) {
                if (typePopover.open) {
                    closeOtherStudioPopovers(root, typePopover);
                }
                syncStudioPopoverRowState(typePopover, 'is-type-menu-open');
                requestAnimationFrame(() => syncStudioPopoverPlacement(typePopover));
                return;
            }

            const fieldMenu = event.target.closest(('.' + H.hub + '-studio-field-menu'));
            if (fieldMenu && root.contains(fieldMenu)) {
                if (fieldMenu.open) {
                    closeOtherStudioPopovers(root, fieldMenu);
                }
                syncStudioPopoverRowState(fieldMenu, 'is-field-menu-open');
                requestAnimationFrame(() => syncStudioPopoverPlacement(fieldMenu));
                return;
            }

        }, true);

        root.addEventListener('input', (event) => {
            const inputEl = event.target.closest(('[' + ('data-' + H.data + '-') + 'builder-input]'));
            if (!inputEl || !root.contains(inputEl)) return;
            if (ds(inputEl, 'staffBuilderInput', 'studentBuilderInput') === 'droplist-options-lines') {
                scheduleDroplistOptionsSave(inputEl, callbacks);
                return;
            }
            handleBuilderInput(inputEl, callbacks);
        });

        root.addEventListener('change', (event) => {
            const copyEl = event.target.closest(('[' + ('data-' + H.data + '-') + 'builder-copy]'));
            if (copyEl && root.contains(copyEl)) {
                handleBuilderCopyChange(copyEl, callbacks);
                return;
            }
            const inputEl = event.target.closest(('[' + ('data-' + H.data + '-') + 'builder-input]'));
            if (!inputEl || !root.contains(inputEl)) return;
            if (ds(inputEl, 'staffBuilderInput', 'studentBuilderInput') === 'droplist-options-lines') return;
            handleBuilderInput(inputEl, callbacks);
        });

        root.addEventListener('blur', (event) => {
            const inputEl = event.target.closest(('[' + ('data-' + H.data + '-') + 'builder-input="droplist-options-lines"]'));
            if (!inputEl || !root.contains(inputEl)) return;
            const pending = droplistOptionsSaveTimers.get(inputEl);
            if (pending) {
                clearTimeout(pending);
                droplistOptionsSaveTimers.delete(inputEl);
            }
            saveDroplistOptionsLines(inputEl, callbacks, { refresh: true });
        }, true);

        bindStaffBuilderDragReorder(root, callbacks);
    }


        const api = { handleBuilderInput, handleBuilderCopyChange, syncStudioPopoverRowState, syncStudioPopoverPlacement, closeOtherStudioPopovers, closeOpenStudioPopovers, isStudioPopoverInteractionTarget, closeStudioPopoverForAction, clearStaffBuilderDropIndicators, resolveStaffBuilderDropIndex, findStaffBuilderDropTarget, finishStaffBuilderDragReorder, bindStaffBuilderDragReorder, bindStaffFormBuilderEvents };
        return api;
    };
})();
