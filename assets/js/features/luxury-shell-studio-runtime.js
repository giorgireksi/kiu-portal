/* Luxury shell studio — fog profile UI.
 * Peeled from luxury-shell-chrome.js. Load before luxury-shell-chrome.js.
 */
(function initLuxuryShellStudioRuntime() {
    'use strict';
    if (window.__KIU_LUXURY_SHELL_STUDIO_LOADED) return;
    window.__KIU_LUXURY_SHELL_STUDIO_LOADED = true;

    window.__kiuCreateLuxuryShellStudioApi = function createKiuLuxuryShellStudioApi(deps = {}) {
        const d = deps;

        function getFogSettings(...a) {
            if (typeof d.getFogSettings === 'function') return d.getFogSettings(...a);
            if (typeof window.getFogSettings === 'function') return window.getFogSettings(...a);
            return null;
        }
        function setFogSettings(...a) {
            if (typeof d.setFogSettings === 'function') return d.setFogSettings(...a);
            if (typeof window.setFogSettings === 'function') return window.setFogSettings(...a);
        }
        function escapeHtml(...a) {
            if (typeof d.escapeHtml === 'function') return d.escapeHtml(...a);
            if (typeof window.escapeHtml === 'function') return window.escapeHtml(...a);
            return String(a[0] ?? '');
        }
        function resolveActiveFogProfileBank(...a) {
            if (typeof d.resolveActiveFogProfileBank === 'function') return d.resolveActiveFogProfileBank(...a);
            return 'dark';
        }
        function flashFogProfileAction(...a) {
            return d.flashFogProfileAction?.(...a);
        }
        function notifyFogProfileApiMissing(...a) {
            return d.notifyFogProfileApiMissing?.(...a);
        }
        const FOG_COLOR_FIELDS = d.FOG_COLOR_FIELDS || [];

        let fogProfileEditState = null;

        function isFogProfileEditing() {
            return !!fogProfileEditState;
        }

        function readFogSettingsFromStudioInputs() {
            const patch = {};
            FOG_COLOR_FIELDS.forEach((field) => {
                const input = document.querySelector(`[data-fog-color="${field.key}"]`);
                if (input?.value) patch[field.key] = input.value;
            });
            const blurSlider = document.getElementById('lux-fog-blur-slider');
            const speedSlider = document.getElementById('lux-fog-speed-slider');
            const zoomSlider = document.getElementById('lux-fog-zoom-slider');
            if (blurSlider) patch.blurFactor = Number(blurSlider.value);
            if (speedSlider) patch.speed = Number(speedSlider.value);
            if (zoomSlider) patch.zoom = Number(zoomSlider.value);
            const base = typeof getFogSettings === 'function'
                ? getFogSettings()
                : (typeof window.getFogSettings === 'function' ? window.getFogSettings() : null);
            if (!base && !Object.keys(patch).length) return null;
            return { ...(base || {}), ...patch };
        }

        function resolveFogSettingsForProfileSave() {
            const fromInputs = readFogSettingsFromStudioInputs();
            if (fromInputs && typeof fromInputs === 'object') return fromInputs;
            if (typeof window.getFogSettings === 'function') return window.getFogSettings();
            if (typeof getFogSettings === 'function') return getFogSettings();
            return null;
        }

        function syncFogProfileEditPreview() {
            if (!isFogProfileEditing()) return;
            syncFogProfileEditUi();
            renderFogProfileList();
        }

        function isFogProfileEditDirty() {
            if (!fogProfileEditState) return false;
            const nameInput = String(document.getElementById('lux-fog-profile-name-input')?.value || '').trim();
            if (nameInput !== fogProfileEditState.name) return true;
            const current = resolveFogSettingsForProfileSave();
            if (!current) return false;
            const snapshot = fogProfileEditState.snapshot;
            return FOG_COLOR_FIELDS.some((field) => current[field.key] !== snapshot[field.key])
                || current.blurFactor !== snapshot.blurFactor
                || current.speed !== snapshot.speed
                || current.zoom !== snapshot.zoom;
        }

        function syncFogProfileEditUi() {
            const editBar = document.getElementById('lux-fog-profile-edit-bar');
            const editLabel = document.getElementById('lux-fog-profile-edit-label');
            const addButton = document.getElementById('lux-fog-profile-add');
            const saveEditButton = document.getElementById('lux-fog-profile-save-edit');
            const discardEditButton = document.getElementById('lux-fog-profile-discard-edit');
            const nameInput = document.getElementById('lux-fog-profile-name-input');
            const editing = isFogProfileEditing();
            const dirty = editing && isFogProfileEditDirty();
            if (editBar) {
                editBar.hidden = !editing;
                editBar.classList.toggle('is-editing', editing);
            }
            if (editLabel) editLabel.textContent = fogProfileEditState?.name || '';
            if (addButton) addButton.disabled = editing;
            if (discardEditButton) {
                discardEditButton.disabled = !editing;
                discardEditButton.classList.toggle('is-edit-active', editing);
            }
            if (saveEditButton) {
                saveEditButton.disabled = !editing || !dirty;
                saveEditButton.classList.toggle('is-edit-active', editing && dirty);
            }
            if (nameInput) nameInput.placeholder = editing ? 'Rename profile' : 'Profile name';
            document.querySelectorAll('[data-fog-profile-edit]').forEach((button) => {
                button.disabled = editing && button.dataset.fogProfileEdit !== fogProfileEditState?.id;
            });
        }

        function clearFogProfileEditState({ restoreSnapshot = false } = {}) {
            if (!fogProfileEditState) return;
            if (restoreSnapshot && typeof setFogSettings === 'function') {
                setFogSettings(fogProfileEditState.snapshot, true);
            }
            fogProfileEditState = null;
            syncFogProfileEditUi();
        }

        function cancelFogProfileEdit(button = null) {
            clearFogProfileEditState({ restoreSnapshot: true });
            const nameInput = document.getElementById('lux-fog-profile-name-input');
            if (nameInput) nameInput.value = '';
            syncFogStudioInputs();
            renderFogProfileList();
            flashFogProfileAction(button || document.getElementById('lux-fog-profile-discard-edit'), 'success');
        }

        function commitFogProfileEdit(button = null) {
            const trigger = button || document.getElementById('lux-fog-profile-save-edit');
            if (!fogProfileEditState || typeof window.updateFogProfile !== 'function') {
                if (typeof window.updateFogProfile !== 'function') notifyFogProfileApiMissing();
                flashFogProfileAction(trigger, 'error');
                return;
            }
            const settings = resolveFogSettingsForProfileSave();
            if (!settings) {
                flashFogProfileAction(trigger, 'error');
                return;
            }
            const nameInput = document.getElementById('lux-fog-profile-name-input');
            const name = String(nameInput?.value || '').trim();
            if (!name) {
                flashFogProfileAction(trigger, 'error');
                nameInput?.focus();
                return;
            }
            const updated = window.updateFogProfile(fogProfileEditState.id, {
                name,
                settings
            });
            if (!updated) {
                flashFogProfileAction(trigger, 'error');
                return;
            }
            fogProfileEditState = null;
            if (nameInput) nameInput.value = '';
            syncFogProfileEditUi();
            renderFogProfileList();
            flashFogProfileAction(trigger, 'success');
        }

        function startFogProfileEdit(profileId, button = null) {
            const id = String(profileId || '').trim();
            if (!id || typeof getFogProfiles !== 'function') return;
            if (fogProfileEditState?.id === id) return;
            if (fogProfileEditState && fogProfileEditState.id !== id) {
                if (isFogProfileEditDirty() && !confirm('Discard unsaved changes?')) return;
                clearFogProfileEditState({ restoreSnapshot: true });
                const nameInput = document.getElementById('lux-fog-profile-name-input');
                if (nameInput) nameInput.value = '';
            }
            const profile = getActiveFogProfiles().find((item) => item.id === id);
            if (!profile) return;
            if (typeof applyFogProfile === 'function') applyFogProfile(id);
            fogProfileEditState = {
                id: profile.id,
                name: profile.name,
                snapshot: { ...profile.settings }
            };
            const nameInput = document.getElementById('lux-fog-profile-name-input');
            if (nameInput) nameInput.value = profile.name;
            syncFogProfileEditUi();
            renderFogProfileList();
            flashFogProfileAction(button || document.querySelector(`[data-fog-profile-edit="${id}"]`), 'success');
        }

        function buildFogProfileSwatchesMarkup(settings) {
            if (!settings || typeof settings !== 'object') return '';
            return FOG_COLOR_FIELDS.map((field) => {
                const color = String(settings[field.key] || '#000000');
                return `<span class="lux-fog-profile-swatch" style="background:${escapeHtml(color)}" title="${escapeHtml(field.label)}"></span>`;
            }).join('');
        }

        function renderFogProfileList() {
            const list = document.getElementById('lux-fog-profile-list');
            if (!list || typeof getFogProfiles !== 'function') return;
            const profiles = getActiveFogProfiles();
            const activeId = typeof findMatchingFogProfileId === 'function'
                ? findMatchingFogProfileId(
                    typeof getFogSettings === 'function' ? getFogSettings() : null,
                    resolveActiveFogProfileBank()
                )
                : '';
            const fragment = document.createDocumentFragment();
            profiles.forEach((profile, index) => {
                const isEditing = fogProfileEditState?.id === profile.id;
                const item = document.createElement('div');
                item.className = `lux-fog-profile-item${profile.id === activeId ? ' is-active' : ''}${isEditing ? ' is-editing' : ''}`;
                item.setAttribute('role', 'listitem');
                item.dataset.fogProfileId = profile.id;
                const swatchSettings = isEditing ? (resolveFogSettingsForProfileSave() || profile.settings) : profile.settings;
                item.innerHTML = `
                    <button type="button" class="lux-fog-profile-drag-handle" data-fog-profile-drag-handle data-lux-skip-modern-button="true" aria-label="Reorder ${escapeHtml(profile.name)}"${isEditing ? ' disabled' : ''}><i class="fas fa-grip-vertical"></i></button>
                    <span class="lux-fog-profile-index" aria-hidden="true">${index + 1}</span>
                    <button type="button" class="lux-fog-profile-item-main" data-fog-profile-apply-row="${escapeHtml(profile.id)}" data-lux-skip-modern-button="true" aria-label="Apply ${escapeHtml(profile.name)}"${isEditing ? ' disabled' : ''}>
                        <div class="lux-fog-profile-item-label">${escapeHtml(profile.name)}</div>
                        <div class="lux-fog-profile-swatches">${buildFogProfileSwatchesMarkup(swatchSettings)}</div>
                    </button>
                    <div class="lux-fog-profile-item-actions">
                        <button type="button" class="lux-fog-profile-action-btn" data-fog-profile-apply="${escapeHtml(profile.id)}" data-lux-skip-modern-button="true" aria-label="Apply ${escapeHtml(profile.name)}"${isEditing ? ' disabled' : ''}><i class="fas fa-download"></i><span>Apply</span></button>
                        <button type="button" class="lux-fog-profile-action-btn lux-fog-profile-action-btn--edit" data-fog-profile-edit="${escapeHtml(profile.id)}" data-lux-skip-modern-button="true" aria-label="Edit ${escapeHtml(profile.name)}"><i class="fas fa-pen"></i></button>
                        <button type="button" class="lux-fog-profile-action-btn lux-fog-profile-action-btn--danger" data-fog-profile-delete="${escapeHtml(profile.id)}" data-lux-skip-modern-button="true" aria-label="Delete ${escapeHtml(profile.name)}"${isEditing ? ' disabled' : ''}><i class="fas fa-trash-alt"></i></button>
                    </div>
                `;
                fragment.appendChild(item);
            });
            list.replaceChildren(fragment);
            const emptyState = document.getElementById('lux-fog-profile-empty');
            if (emptyState) emptyState.hidden = profiles.length > 0;
            syncFogProfileBankUi();
            syncFogProfileEditUi();
        }

        function buildFogProfileGhostMarkup(row) {
            const index = row.querySelector('.lux-fog-profile-index')?.textContent || '';
            const label = row.querySelector('.lux-fog-profile-item-label')?.textContent || '';
            const swatches = row.querySelector('.lux-fog-profile-swatches')?.innerHTML || '';
            return `
                <span class="lux-fog-profile-index" aria-hidden="true">${escapeHtml(index)}</span>
                <div class="lux-fog-profile-item-main">
                    <div class="lux-fog-profile-item-label">${escapeHtml(label)}</div>
                    <div class="lux-fog-profile-swatches">${swatches}</div>
                </div>
            `;
        }

        function syncFogProfileIndexBadges(list) {
            if (!list) return;
            list.querySelectorAll('.lux-fog-profile-item').forEach((row, index) => {
                const badge = row.querySelector('.lux-fog-profile-index');
                if (badge) badge.textContent = String(index + 1);
            });
        }

        function prefersReducedFogProfileMotion() {
            return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
        }

        function readFogProfileDragMetrics(row, event) {
            const rowRect = row.getBoundingClientRect();
            return {
                rowRect,
                offsetX: event.clientX - rowRect.left,
                offsetY: event.clientY - rowRect.top,
                shell: row.closest('.lux-fog-profile-list-shell')
            };
        }

        function createFogProfileDragGhost(row, metrics) {
            const ghost = document.createElement('div');
            ghost.className = 'lux-fog-profile-drag-ghost is-lifting';
            ghost.setAttribute('aria-hidden', 'true');
            ghost.innerHTML = buildFogProfileGhostMarkup(row);
            ghost.style.width = `${metrics.rowRect.width}px`;
            ghost.style.height = `${metrics.rowRect.height}px`;
            ghost.style.left = `${metrics.rowRect.left}px`;
            ghost.style.top = `${metrics.rowRect.top}px`;
            document.body.appendChild(ghost);
            return ghost;
        }

        function setFogProfilePlaceholder(row, metrics) {
            row.classList.add('is-drag-source');
            row.style.setProperty('--lux-fog-drag-slot-h', `${metrics.rowRect.height}px`);
            row.style.minHeight = `${metrics.rowRect.height}px`;
            row.style.height = `${metrics.rowRect.height}px`;
        }

        function updateFogProfileDragGhost(dragState) {
            const { ghost, offsetX, offsetY } = dragState;
            if (!ghost) return;
            const targetLeft = dragState.clientX - offsetX;
            const targetTop = dragState.clientY - offsetY;
            const follow = prefersReducedFogProfileMotion() ? 1 : 0.38;
            dragState.ghostLeft += (targetLeft - dragState.ghostLeft) * follow;
            dragState.ghostTop += (targetTop - dragState.ghostTop) * follow;
            const velocityX = dragState.clientX - (dragState.lastClientX ?? dragState.clientX);
            dragState.lastClientX = dragState.clientX;
            const tilt = prefersReducedFogProfileMotion()
                ? 0
                : Math.max(-3, Math.min(3, velocityX * 0.18));
            ghost.style.left = `${dragState.ghostLeft}px`;
            ghost.style.top = `${dragState.ghostTop}px`;
            ghost.style.transform = `rotate(${tilt - 1.5}deg) scale(1.05)`;
        }

        function flipFogProfileSiblings(list, placeholderRow, mutateFn) {
            const siblings = Array.from(list.querySelectorAll('.lux-fog-profile-item')).filter((row) => row !== placeholderRow);
            if (siblings.length > 12) { mutateFn(); if (!prefersReducedFogProfileMotion()) syncFogProfileIndexBadges(list); return; }
            const firstRects = new Map(siblings.map((row) => [row, row.getBoundingClientRect()]));
            mutateFn();
            if (prefersReducedFogProfileMotion()) {
                syncFogProfileIndexBadges(list);
                return;
            }
            siblings.forEach((row) => {
                const first = firstRects.get(row);
                const last = row.getBoundingClientRect();
                const deltaY = first.top - last.top;
                if (Math.abs(deltaY) < 1) return;
                row.style.transition = 'none';
                row.style.transform = `translateY(${deltaY}px)`;
                window.requestAnimationFrame(() => {
                    row.style.transition = 'transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)';
                    row.style.transform = '';
                    const cleanup = () => {
                        row.style.transition = '';
                        row.removeEventListener('transitionend', cleanup);
                    };
                    row.addEventListener('transitionend', cleanup);
                });
            });
            syncFogProfileIndexBadges(list);
        }

        function moveFogProfilePlaceholder(list, clientY, placeholderRow) {
            const rows = Array.from(list.querySelectorAll('.lux-fog-profile-item'));
            const dragIndex = rows.indexOf(placeholderRow);
            if (dragIndex < 0) return;
            let overRow = null;
            rows.forEach((row) => {
                if (row === placeholderRow) return;
                const rect = row.getBoundingClientRect();
                if (clientY < rect.top || clientY > rect.bottom) return;
                overRow = row;
            });
            if (!overRow) return;
            const overIndex = rows.indexOf(overRow);
            const rect = overRow.getBoundingClientRect();
            const placeBefore = clientY < rect.top + rect.height / 2;
            if (placeBefore && dragIndex > overIndex) {
                flipFogProfileSiblings(list, placeholderRow, () => list.insertBefore(placeholderRow, overRow));
                return;
            }
            if (!placeBefore && dragIndex < overIndex) {
                flipFogProfileSiblings(list, placeholderRow, () => overRow.after(placeholderRow));
            }
        }

        function autoScrollFogProfileShell(shell, clientY) {
            if (!shell) return;
            const rect = shell.getBoundingClientRect();
            const edge = 28;
            const speed = 7;
            if (clientY < rect.top + edge) shell.scrollTop -= speed;
            else if (clientY > rect.bottom - edge) shell.scrollTop += speed;
        }

        function clearFogProfileDragTransforms(list) {
            if (!list) return;
            list.querySelectorAll('.lux-fog-profile-item').forEach((row) => {
                row.style.removeProperty('transform');
                row.style.removeProperty('transition');
            });
        }

        function cleanupFogProfileDragState(dragState) {
            if (!dragState) return;
            if (dragState.rafId) window.cancelAnimationFrame(dragState.rafId);
            dragState.ghost?.remove();
            const placeholderRow = dragState.placeholderRow || dragState.dragRow;
            if (placeholderRow) {
                placeholderRow.classList.remove('is-drag-source', 'is-dragging', 'is-settling');
                placeholderRow.style.removeProperty('min-height');
                placeholderRow.style.removeProperty('height');
                placeholderRow.style.removeProperty('--lux-fog-drag-slot-h');
            }
            dragState.list?.classList.remove('is-reordering');
            clearFogProfileDragTransforms(dragState.list);
        }

        function animateFogProfileGhostDrop(dragState) {
            const { ghost, placeholderRow, reducedMotion } = dragState;
            if (!ghost || reducedMotion || !placeholderRow) return Promise.resolve();
            const slotRect = placeholderRow.getBoundingClientRect();
            ghost.classList.remove('is-lifting');
            ghost.classList.add('is-dropping');
            ghost.style.left = `${slotRect.left}px`;
            ghost.style.top = `${slotRect.top}px`;
            ghost.style.width = `${slotRect.width}px`;
            ghost.style.height = `${slotRect.height}px`;
            ghost.style.transform = 'rotate(0deg) scale(1)';
            return new Promise((resolve) => {
                let settled = false;
                const finish = () => {
                    if (settled) return;
                    settled = true;
                    ghost.removeEventListener('transitionend', finish);
                    resolve();
                };
                ghost.addEventListener('transitionend', finish);
                window.setTimeout(finish, 280);
            });
        }

        function finishFogProfileDragReorder(dragState) {
            if (!dragState?.list) return;
            const placeholderRow = dragState.placeholderRow || dragState.dragRow;
            if (dragState.handle?.releasePointerCapture) {
                try {
                    dragState.handle.releasePointerCapture(dragState.pointerId);
                } catch (_error) {
                    void _error;
                }
            }
            if (placeholderRow && !dragState.reducedMotion) {
                placeholderRow.classList.add('is-settling');
                window.setTimeout(() => placeholderRow.classList.remove('is-settling'), 320);
            }
            const orderedIds = Array.from(dragState.list.querySelectorAll('.lux-fog-profile-item'))
                .map((row) => String(row.dataset.fogProfileId || '').trim())
                .filter(Boolean);
            const startOrder = Array.isArray(dragState.startOrder) ? dragState.startOrder : [];
            if (!orderedIds.length || orderedIds.join('|') === startOrder.join('|')) return;
            if (typeof window.reorderFogProfiles !== 'function') {
                notifyFogProfileApiMissing();
                renderFogProfileList();
                return;
            }
            if (!window.reorderFogProfiles(orderedIds, resolveActiveFogProfileBank())) renderFogProfileList();
        }

        function scheduleFogProfileDragFrame(dragState) {
            if (!dragState || dragState.reducedMotion) return;
            dragState.rafId = window.requestAnimationFrame(() => {
                if (!dragState) return;
                updateFogProfileDragGhost(dragState);
                scheduleFogProfileDragFrame(dragState);
            });
        }

        function bindFogProfileListDrag() {
            const list = document.getElementById('lux-fog-profile-list');
            if (!list || list.dataset.fogDragBound === '1') return;
            list.dataset.fogDragBound = '1';
            let dragState = null;
            const endDrag = async (event) => {
                if (!dragState || event.pointerId !== dragState.pointerId) return;
                const active = dragState;
                dragState = null;
                await animateFogProfileGhostDrop(active);
                cleanupFogProfileDragState(active);
                finishFogProfileDragReorder(active);
            };
            list.addEventListener('pointerdown', (event) => {
                const handle = event.target.closest('[data-fog-profile-drag-handle]');
                if (!handle || handle.disabled || !list.contains(handle)) return;
                if (isFogProfileEditing()) return;
                const dragRow = handle.closest('.lux-fog-profile-item');
                if (!dragRow) return;
                event.preventDefault();
                event.stopPropagation();
                const startOrder = Array.from(list.querySelectorAll('.lux-fog-profile-item'))
                    .map((row) => String(row.dataset.fogProfileId || '').trim())
                    .filter(Boolean);
                const reducedMotion = prefersReducedFogProfileMotion();
                const metrics = readFogProfileDragMetrics(dragRow, event);
                dragState = {
                    list,
                    handle,
                    dragRow,
                    placeholderRow: dragRow,
                    pointerId: event.pointerId,
                    startOrder,
                    reducedMotion,
                    clientX: event.clientX,
                    clientY: event.clientY,
                    offsetX: metrics.offsetX,
                    offsetY: metrics.offsetY,
                    shell: metrics.shell
                };
                list.classList.add('is-reordering');
                handle.setPointerCapture(event.pointerId);
                if (reducedMotion) {
                    dragRow.classList.add('is-dragging');
                    return;
                }
                dragState.ghost = createFogProfileDragGhost(dragRow, metrics);
                setFogProfilePlaceholder(dragRow, metrics);
                dragState.ghostLeft = metrics.rowRect.left;
                dragState.ghostTop = metrics.rowRect.top;
                dragState.lastClientX = event.clientX;
                scheduleFogProfileDragFrame(dragState);
            }, true);
            list.addEventListener('pointermove', (event) => {
                if (!dragState || event.pointerId !== dragState.pointerId) return;
                dragState.clientX = event.clientX;
                dragState.clientY = event.clientY;
                autoScrollFogProfileShell(dragState.shell, event.clientY);
                if (dragState.reducedMotion) {
                    moveFogProfilePlaceholder(list, event.clientY, dragState.placeholderRow);
                    return;
                }
                moveFogProfilePlaceholder(list, event.clientY, dragState.placeholderRow);
            });
            list.addEventListener('pointerup', endDrag);
            list.addEventListener('pointercancel', endDrag);
        }

        function notifyFogProfileApiMissing() {
            if (typeof showToast === 'function') {
                showToast('Fog profile storage is unavailable. Hard-refresh the page.');
            }
        }

        function saveFogProfileFromInput(button = null) {
            const trigger = button || document.getElementById('lux-fog-profile-add');
            if (isFogProfileEditing()) return;
            if (typeof window.saveFogProfile !== 'function') {
                notifyFogProfileApiMissing();
                flashFogProfileAction(trigger, 'error');
                return;
            }
            const input = document.getElementById('lux-fog-profile-name-input');
            const name = String(input?.value || '').trim();
            if (!name) {
                flashFogProfileAction(trigger, 'error');
                input?.focus();
                return;
            }
            const profile = window.saveFogProfile(name, resolveActiveFogProfileBank());
            if (!profile) {
                flashFogProfileAction(trigger, 'error');
                return;
            }
            if (input) input.value = '';
            renderFogProfileList();
            flashFogProfileAction(trigger, 'success');
        }

        function bindFogProfileControls() {
            const dialog = document.querySelector('#lux-bg-mode-params-backdrop .lux-bg-mode-params-dialog');
            if (!dialog || dialog.dataset.fogControlsBound === '1') return;
            dialog.dataset.fogControlsBound = '1';
            dialog.addEventListener('click', (event) => {
                const bankButton = event.target.closest('[data-fog-profile-bank]');
                if (bankButton) {
                    event.preventDefault();
                    setActiveFogProfileBank(bankButton.dataset.fogProfileBank);
                    return;
                }
                const saveEditButton = event.target.closest('[data-fog-profile-save-edit]');
                if (saveEditButton) {
                    event.preventDefault();
                    commitFogProfileEdit(saveEditButton);
                    return;
                }
                const discardEditButton = event.target.closest('[data-fog-profile-discard-edit]');
                if (discardEditButton) {
                    event.preventDefault();
                    cancelFogProfileEdit(discardEditButton);
                    return;
                }
                const addButton = event.target.closest('[data-fog-profile-add]');
                if (addButton) {
                    event.preventDefault();
                    if (addButton.disabled) return;
                    saveFogProfileFromInput(addButton);
                    return;
                }
                const applyButton = event.target.closest('[data-fog-profile-apply], [data-fog-profile-apply-row]');
                if (applyButton) {
                    event.preventDefault();
                    if (applyButton.disabled) return;
                    const profileId = String(applyButton.dataset.fogProfileApply || applyButton.dataset.fogProfileApplyRow || '').trim();
                    if (!profileId || typeof window.applyFogProfile !== 'function') {
                        if (typeof window.applyFogProfile !== 'function') notifyFogProfileApiMissing();
                        flashFogProfileAction(applyButton, 'error');
                        return;
                    }
                    if (fogProfileEditState && isFogProfileEditDirty() && !confirm('Discard unsaved changes?')) return;
                    if (fogProfileEditState) clearFogProfileEditState({ restoreSnapshot: true });
                    const nameInput = document.getElementById('lux-fog-profile-name-input');
                    if (nameInput) nameInput.value = '';
                    window.applyFogProfile(profileId);
                    renderFogProfileList();
                    flashFogProfileAction(applyButton, 'success');
                    return;
                }
                const profileShell = event.target.closest('.lux-fog-profile-item');
                if (
                    profileShell
                    && !event.target.closest('button, a, input, select, textarea')
                ) {
                    const main = profileShell.querySelector('[data-fog-profile-apply-row]');
                    if (main && !main.disabled) {
                        event.preventDefault();
                        main.click();
                    }
                    return;
                }
                const editButton = event.target.closest('[data-fog-profile-edit]');
                if (editButton) {
                    event.preventDefault();
                    if (editButton.disabled) return;
                    startFogProfileEdit(editButton.dataset.fogProfileEdit, editButton);
                    return;
                }
                const deleteButton = event.target.closest('[data-fog-profile-delete]');
                if (deleteButton) {
                    event.preventDefault();
                    if (deleteButton.disabled) return;
                    const profileId = String(deleteButton.dataset.fogProfileDelete || '').trim();
                    if (!profileId || typeof window.deleteFogProfile !== 'function') {
                        if (typeof window.deleteFogProfile !== 'function') notifyFogProfileApiMissing();
                        flashFogProfileAction(deleteButton, 'error');
                        return;
                    }
                    const profileName = deleteButton.getAttribute('aria-label')?.replace(/^Delete\s+/, '') || 'this profile';
                    if (!confirm(`Remove fog profile "${profileName}"?`)) return;
                    if (fogProfileEditState?.id === profileId) clearFogProfileEditState({ restoreSnapshot: false });
                    window.deleteFogProfile(profileId);
                    const nameInput = document.getElementById('lux-fog-profile-name-input');
                    if (nameInput) nameInput.value = '';
                    renderFogProfileList();
                    flashFogProfileAction(deleteButton, 'success');
                }
            });
            dialog.addEventListener('input', (event) => {
                if (event.target?.id === 'lux-fog-profile-name-input') syncFogProfileEditPreview();
            });
            dialog.addEventListener('keydown', (event) => {
                if (event.target?.id !== 'lux-fog-profile-name-input' || event.key !== 'Enter') return;
                event.preventDefault();
                if (isFogProfileEditing()) {
                    commitFogProfileEdit(document.getElementById('lux-fog-profile-save-edit'));
                    return;
                }
                saveFogProfileFromInput(document.getElementById('lux-fog-profile-add'));
            });
        }


        const api = {
            isFogProfileEditing,
            readFogSettingsFromStudioInputs,
            resolveFogSettingsForProfileSave,
            syncFogProfileEditPreview,
            isFogProfileEditDirty,
            syncFogProfileEditUi,
            clearFogProfileEditState,
            cancelFogProfileEdit,
            commitFogProfileEdit,
            startFogProfileEdit,
            buildFogProfileSwatchesMarkup,
            renderFogProfileList,
            buildFogProfileGhostMarkup,
            syncFogProfileIndexBadges,
            prefersReducedFogProfileMotion,
            readFogProfileDragMetrics,
            createFogProfileDragGhost,
            setFogProfilePlaceholder,
            updateFogProfileDragGhost,
            flipFogProfileSiblings,
            moveFogProfilePlaceholder,
            autoScrollFogProfileShell,
            clearFogProfileDragTransforms,
            cleanupFogProfileDragState,
            animateFogProfileGhostDrop,
            finishFogProfileDragReorder,
            scheduleFogProfileDragFrame,
            bindFogProfileListDrag,
            notifyFogProfileApiMissing,
            saveFogProfileFromInput,
            bindFogProfileControls
        };
        Object.assign(window, api);
        return api;
    };
})();
