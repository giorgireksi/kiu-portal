/* LMS materials runtime extracted from lms.js. */

function buildLmsMaterialDraftFileShellHtml(draft = null) {
    if (!draft) {
        return `
            <div class="lms-route-file-shell lms-material-draft-file is-empty" data-lms-material-draft-file>
                <div class="lms-route-kv-label">Selected file</div>
                <div class="lms-route-file-shell-title">No file attached yet</div>
                <div class="lms-route-file-shell-meta">Use Upload File to choose a PDF, slide deck, or reference document.</div>
            </div>
        `;
    }
    return `
        <div class="lms-route-file-shell lms-material-draft-file" data-lms-material-draft-file>
            <div class="lms-route-kv-label">Selected file</div>
            <div class="lms-route-file-shell-title">${escapeHtml(draft.name || 'Attachment')}</div>
            <div class="lms-route-file-shell-meta">${escapeHtml(draft.type || 'application/octet-stream')}</div>
        </div>
    `;
}

function syncLmsMaterialDraftUi(resourceKey, labelId = '') {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    const draft = typeof getLmsDraftFile === 'function' ? getLmsDraftFile('material', resourceKey) : null;
    const resolvedLabelId = labelId || `lms-material-file-label-${toDomToken(resourceKey)}`;
    const label = document.getElementById(resolvedLabelId);
    if (label) {
        label.classList.toggle('is-positive', Boolean(draft));
        label.innerHTML = draft
            ? `<i class="fas fa-paperclip"></i> ${escapeHtml(draft.name)}`
            : 'No file selected yet';
    }
    const shell = document.querySelector('[data-lms-material-draft-file]');
    if (shell) {
        shell.outerHTML = buildLmsMaterialDraftFileShellHtml(draft);
    }
    const titleInput = document.getElementById('new-material-title');
    if (draft && titleInput && !titleInput.value.trim()) {
        const baseName = String(draft.name || '').replace(/\.[^.]+$/, '').trim();
        if (baseName) titleInput.value = baseName;
    }
}

function buildLmsMaterialsCreateBoxHtml(resourceKey, fileLabelId) {
    const draft = typeof getLmsDraftFile === 'function' ? getLmsDraftFile('material', resourceKey) : null;
    const pillClass = draft ? 'lms-route-pill is-positive' : 'lms-route-pill';
    const pillHtml = draft
        ? `<i class="fas fa-paperclip"></i> ${escapeHtml(draft.name)}`
        : 'No file selected yet';
    return `
        <div class="lms-route-panel lms-route-panel-compact">
            <div class="lms-route-card-head lms-route-card-head-mb-16">
                <div>
                    <div class="lms-route-card-title">Upload Material</div>
                    <div class="lms-route-copy lms-route-copy-mt-6">Add lecture notes, slides, PDFs, or reference files for this teaching group.</div>
                </div>
                <div id="${fileLabelId}" class="${pillClass}">${pillHtml}</div>
            </div>
            ${buildLmsMaterialDraftFileShellHtml(draft)}
            <div class="lms-route-field-grid lms-route-field-grid-mt-12">
                <div class="lms-route-field">
                    <label class="lms-route-field-label" for="new-material-title">Material Title</label>
                    <input id="new-material-title" class="lms-route-input lux-control" type="text" placeholder="Material title">
                </div>
                <div class="lms-route-field">
                    <label class="lms-route-field-label" for="new-material-description">Description</label>
                    <input id="new-material-description" class="lms-route-input lux-control" type="text" placeholder="Short description for students">
                </div>
                <div class="lms-route-field">
                    <label class="lms-route-field-label" for="new-material-week">Teaching Week</label>
                    <select id="new-material-week" class="lms-route-select lux-control">
                        ${buildLmsWeekSelectOptions(resourceKey, '')}
                    </select>
                </div>
            </div>
            <div class="lms-route-actions lms-route-actions-mt-16">
                <button class="lux-secondary-btn" data-lms-click="pickLocalLmsFile('material', '${resourceKey}', '${fileLabelId}')"><i class="fas fa-paperclip"></i> Upload File</button>
                <button class="lux-primary-btn" data-lms-click="createLmsMaterial('${resourceKey}')"><i class="fas fa-cloud-upload-alt"></i> Save Material</button>
            </div>
        </div>
    `;
}

function buildLmsMaterialsWeekBannerHtml(resourceKey, activeCount, pinnedCount, archivedCount, canManage) {
    return `
        <div class="lms-route-panel lms-route-panel-pad-16-20">
            <div class="lms-route-card-head">
                <div class="lms-route-inline lms-route-inline-center lms-route-inline-gap-12">
                    <i class="fas fa-folder-open lms-route-lead-icon"></i>
                    <div>
                        <div class="lms-route-card-title">Materials</div>
                            <div class="lms-route-copy lms-route-copy-mt-4">${activeCount} active files &middot; ${pinnedCount} pinned &middot; ${archivedCount} archived</div>
                    </div>
                </div>
                <div class="lms-route-inline lms-route-inline-gap-8">
                    ${canManage ? '<button class="lux-secondary-btn lms-route-btn-compact" data-lms-click="openLmsWeekManagerModal(&#39;' + resourceKey + '&#39;)"><i class="fas fa-calendar-week"></i> Manage Weeks</button>' : ''}
                </div>
            </div>
        </div>
    `;
}

function buildLmsMaterialsCardHtml(resourceKey, item, canManage) {
    return `
                        <div class="lms-route-card lms-route-panel-compact lms-material-card">
                            <div class="lms-route-card-head lms-material-card-head">
                                <div>
                                    <div class="lms-route-card-title">${escapeHtml(item.title || 'Untitled material')}</div>
                                    <div class="lms-route-card-copy lms-route-copy-mt-6">${escapeHtml(item.description || 'Shared course material')}</div>
                                </div>
                                <div class="lms-route-inline lms-route-inline-center lms-route-inline-gap-8 lms-material-card-actions">
                                    ${item.pinned ? '<span class="lms-route-pill"><i class="fas fa-thumbtack"></i> Pinned</span>' : ''}
                                    ${canManage ? `
                                        <button class="lux-secondary-btn lms-route-btn-compact lms-route-btn-compact-square" data-lms-click="toggleLmsMaterialPinned('${resourceKey}', '${item.id}')"><i class="fas fa-thumbtack"></i></button>
                                        <button class="lux-secondary-btn lms-route-btn-compact lms-route-btn-compact-square" data-lms-click="moveLmsMaterial('${resourceKey}', '${item.id}', -1)"><i class="fas fa-arrow-up"></i></button>
                                        <button class="lux-secondary-btn lms-route-btn-compact lms-route-btn-compact-square" data-lms-click="moveLmsMaterial('${resourceKey}', '${item.id}', 1)"><i class="fas fa-arrow-down"></i></button>
                                        <button class="lux-secondary-btn lms-route-btn-compact lms-route-btn-compact-square" data-lms-click="toggleLmsMaterialArchived('${resourceKey}', '${item.id}')"><i class="fas fa-box-archive"></i></button>
                                        <button class="lux-secondary-btn lms-route-btn-compact lms-route-btn-compact-square lms-route-btn-danger" data-lms-click="deleteLmsMaterial('${resourceKey}', '${item.id}')"><i class="fas fa-trash"></i></button>
                                    ` : ''}
                                </div>
                            </div>
                            <div class="lms-route-meta lms-route-meta-12 lms-route-copy-mt-12 lms-material-card-meta">${joinLmsMeta([`Uploaded by ${item.uploadedBy || 'Course staff'}`, formatLmsDateTime(item.uploadedAt)])}</div>
                            ${renderLmsStoredFileAttachmentShell(item.file, {
                                label: 'Attachment',
                                title: item.file?.name || 'Attachment',
                                downloadLabel: 'Download',
                                shellClass: 'lms-route-file-shell lms-material-card-attachment'
                            })}
                        </div>
                    `;
}

function buildLmsMaterialsListMarkup(resourceKey, activeItems, archivedItems, canManage) {
    const groupedMaterials = groupLmsItemsByWeek(resourceKey, activeItems, item => item.weekLabel);
    const cards = groupedMaterials.length ? groupedMaterials.map(([weekLabel, weekItems], index) => {
        const body = weekItems.length
            ? `
                <div class="lms-route-card-grid lms-material-card-grid">
                    ${weekItems.map(item => buildLmsMaterialsCardHtml(resourceKey, item, canManage)).join('')}
                </div>
            `
            : renderLmsWeekPanelEmptyState('No Material Yet', 'No materials were uploaded for this week yet.', 'fa-file-lines');
        return renderLmsRouteWeekAccordion(
            weekLabel,
            `${weekItems.length} material${weekItems.length === 1 ? '' : 's'} in this section`,
            body,
            index === 0
        );
    }).join('') : renderLmsRouteEmptyState('No Materials Yet', 'This LMS group does not have any published materials yet.', 'fa-folder-open');

    const archivedPanel = canManage && archivedItems.length ? `
        <div class="lms-route-panel lms-route-panel-compact">
            <div class="lms-route-card-head lms-route-card-head-mb-16">
                <div>
                    <div class="lms-route-card-title"><i class="fas fa-box-archive"></i> Archived materials</div>
                    <div class="lms-route-copy lms-route-copy-mt-6">Restore archived items back into the active weekly materials list.</div>
                </div>
            </div>
                <div class="lms-route-stack lms-route-copy-mt-12 lms-route-stack-gap-10">
                    ${archivedItems.map(item => `
                    <div class="lms-route-card lms-route-panel-compact lms-route-inline lms-route-inline-between lms-route-inline-gap-12 lms-route-inline-center lms-material-archive-item">
                        <div>
                            <div class="lms-route-card-title lms-route-card-title-14">${escapeHtml(item.title || item.file?.name || 'Archived material')}</div>
                            <div class="lms-route-meta lms-route-meta-11 lms-route-copy-mt-4">${joinLmsMeta([item.weekLabel || 'General', item.file?.name || 'Attachment'])}</div>
                        </div>
                        <button class="lux-secondary-btn" data-lms-click="toggleLmsMaterialArchived('${resourceKey}', '${item.id}')"><i class="fas fa-rotate-left"></i> Restore</button>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : '';
    return `<div class="lms-route-stack">${cards}${archivedPanel}</div>`;
}

function renderLmsMaterialsLibrary(resourceKey) {
    const items = ensureLmsMaterialsForKey(resourceKey);
    const activeItems = items.filter(item => !item.archived);
    const archivedItems = items.filter(item => item.archived);
    const canManage = canManageLmsGroupContent();
    const token = toDomToken(resourceKey);
    const fileLabelId = `lms-material-file-label-${token}`;

    const weekBanner = buildLmsMaterialsWeekBannerHtml(
        resourceKey,
        activeItems.length,
        items.filter(item => item.pinned).length,
        archivedItems.length,
        canManage
    );
    const createBox = canManage
        ? buildLmsMaterialsCreateBoxHtml(resourceKey, fileLabelId)
        : '';
    return `${weekBanner}${createBox}${buildLmsMaterialsListMarkup(resourceKey, activeItems, archivedItems, canManage)}`;
}

async function createLmsMaterial(resourceKey) {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    const title = document.getElementById('new-material-title')?.value.trim();
    const description = document.getElementById('new-material-description')?.value.trim();
    const weekLabel = document.getElementById('new-material-week')?.value || '';
    const file = getLmsDraftFile('material', resourceKey);
    if (!title) {
        alert('Please add a material title.');
        return;
    }
    if (!file) {
        alert('Please upload a file for this material.');
        return;
    }
    try {
        const persistedFile = await persistLmsStoredFile(file, 'material');
        const materials = ensureLmsMaterialsForKey(resourceKey);
        materials.unshift({
            id: `material_${Date.now()}`,
            title,
            description,
            weekLabel,
            file: persistedFile,
            pinned: false,
            archived: false,
            sortOrder: 0,
            uploadedBy: getSimulatedUserName(),
            uploadedAt: new Date().toISOString()
        });
        materials.forEach((item, index) => { item.sortOrder = index; });
        clearLmsDraftFile('material', resourceKey);
        saveState();
        rerenderCurrentLmsTab();
        alert('Material saved successfully.');
    } catch (error) {
        console.error('Could not save LMS material.', error);
        alert('Material could not be saved.');
    }
}

function deleteLmsMaterial(resourceKey, materialId) {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    if (!canManageLmsGroupContent()) {
        alert('Only admins, professors, and teaching assistants can remove group materials.');
        return;
    }
    const materials = ensureLmsMaterialsForKey(resourceKey);
    const removedMaterial = materials.find(item => item.id === materialId);
    queueStoredFileDelete(removedMaterial?.file);
    KIU_STATE.groupMaterials[resourceKey] = materials.filter(item => item.id !== materialId);
    saveState();
    rerenderCurrentLmsTab();
}

function updateLmsMaterialState(resourceKey, materialId, patch = {}) {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    if (!canManageLmsGroupContent()) {
        alert('Only admins, professors, and teaching assistants can manage group materials.');
        return;
    }
    const materials = ensureLmsMaterialsForKey(resourceKey);
    const material = materials.find(item => String(item.id) === String(materialId));
    if (!material) return;
    Object.assign(material, patch, { updatedAt: new Date().toISOString() });
    saveState();
    rerenderCurrentLmsTab();
}

function toggleLmsMaterialPinned(resourceKey, materialId) {
    const material = ensureLmsMaterialsForKey(resourceKey).find(item => String(item.id) === String(materialId));
    updateLmsMaterialState(resourceKey, materialId, { pinned: !material?.pinned });
}

function toggleLmsMaterialArchived(resourceKey, materialId) {
    const material = ensureLmsMaterialsForKey(resourceKey).find(item => String(item.id) === String(materialId));
    updateLmsMaterialState(resourceKey, materialId, { archived: !material?.archived, pinned: material?.archived ? material.pinned : false });
}

function moveLmsMaterial(resourceKey, materialId, direction = 0) {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    if (!canManageLmsGroupContent()) {
        alert('Only admins, professors, and teaching assistants can reorder materials.');
        return;
    }
    const materials = ensureLmsMaterialsForKey(resourceKey);
    materials.forEach((item, index) => { item.sortOrder = index; });
    const index = materials.findIndex(item => String(item.id) === String(materialId));
    const targetIndex = index + Number(direction || 0);
    if (index < 0 || targetIndex < 0 || targetIndex >= materials.length) return;
    const [material] = materials.splice(index, 1);
    materials.splice(targetIndex, 0, material);
    materials.forEach((item, order) => { item.sortOrder = order; item.updatedAt = new Date().toISOString(); });
    saveState();
    rerenderCurrentLmsTab();
}

if (typeof window !== 'undefined') {
    window.renderLmsMaterialsLibrary = window.renderLmsMaterialsLibrary || renderLmsMaterialsLibrary;
    window.createLmsMaterial = window.createLmsMaterial || createLmsMaterial;
    window.deleteLmsMaterial = window.deleteLmsMaterial || deleteLmsMaterial;
    window.toggleLmsMaterialPinned = window.toggleLmsMaterialPinned || toggleLmsMaterialPinned;
    window.toggleLmsMaterialArchived = window.toggleLmsMaterialArchived || toggleLmsMaterialArchived;
    window.moveLmsMaterial = window.moveLmsMaterial || moveLmsMaterial;
    window.syncLmsMaterialDraftUi = window.syncLmsMaterialDraftUi || syncLmsMaterialDraftUi;
}
