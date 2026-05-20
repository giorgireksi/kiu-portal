/* LMS materials runtime extracted from lms.js. */

function renderLmsMaterialsLibrary(resourceKey) {
    const items = ensureLmsMaterialsForKey(resourceKey);
    const activeItems = items.filter(item => !item.archived);
    const archivedItems = items.filter(item => item.archived);
    const canManage = canManageLmsGroupContent();
    const token = toDomToken(resourceKey);
    const fileLabelId = `lms-material-file-label-${token}`;

    const weekBanner = `
        <div class="lms-route-panel" style="padding:16px 20px;">
            <div class="lms-route-card-head">
                <div style="display:flex;align-items:center;gap:12px;">
                    <i class="fas fa-folder-open" style="font-size:18px;color:var(--lux-accent-2);"></i>
                    <div>
                        <div class="lms-route-card-title">Materials</div>
                            <div class="lms-route-copy" style="margin-top:4px;">${activeItems.length} active files &middot; ${items.filter(item => item.pinned).length} pinned &middot; ${archivedItems.length} archived</div>
                    </div>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    ${canManage ? '<button class="kiu-btn-outline" data-lms-click="openLmsWeekManagerModal(&#39;' + resourceKey + '&#39;)" style="padding:8px 14px;font-size:12px;"><i class="fas fa-calendar-week"></i> Manage Weeks</button>' : ''}
                </div>
            </div>
        </div>
    `;
    const createBox = canManage ? `
        <div class="lms-route-panel">
            <div class="lms-route-card-head" style="margin-bottom:16px;">
                <div>
                    <div class="lms-route-card-title">Upload Material</div>
                    <div class="lms-route-copy" style="margin-top:6px;">Add lecture notes, slides, PDFs, or reference files for this teaching group.</div>
                </div>
                <div id="${fileLabelId}" class="lms-route-pill">No file selected yet</div>
            </div>
            <div class="lms-route-field-grid">
                <div class="lms-route-field">
                    <label class="lms-route-field-label" for="new-material-title">Material Title</label>
                    <input id="new-material-title" class="lms-route-input" type="text" placeholder="Material title">
                </div>
                <div class="lms-route-field">
                    <label class="lms-route-field-label" for="new-material-description">Description</label>
                    <input id="new-material-description" class="lms-route-input" type="text" placeholder="Short description for students">
                </div>
                <div class="lms-route-field">
                    <label class="lms-route-field-label" for="new-material-week">Teaching Week</label>
                    <select id="new-material-week" class="lms-route-select">
                        ${buildLmsWeekSelectOptions(resourceKey, '')}
                    </select>
                </div>
            </div>
            <div class="lms-route-actions" style="margin-top:16px;">
                <button class="kiu-btn-outline" data-lms-click="pickLocalLmsFile('material', '${resourceKey}', '${fileLabelId}')"><i class="fas fa-paperclip"></i> Upload File</button>
                <button class="kiu-btn-blue" data-lms-click="createLmsMaterial('${resourceKey}')"><i class="fas fa-cloud-upload-alt"></i> Save Material</button>
            </div>
        </div>
    ` : '';
    const groupedMaterials = groupLmsItemsByWeek(resourceKey, activeItems, item => item.weekLabel, true);
    const cards = groupedMaterials.length ? groupedMaterials.map(([weekLabel, weekItems], index) => {
        const body = weekItems.length
            ? `
                <div class="lms-route-card-grid">
                    ${weekItems.map(item => `
                        <div class="lms-route-card">
                            <div class="lms-route-card-head">
                                <div>
                                    <div class="lms-route-card-title">${escapeHtml(item.title || 'Untitled material')}</div>
                                    <div class="lms-route-card-copy" style="margin-top:6px;">${escapeHtml(item.description || 'Shared course material')}</div>
                                </div>
                                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                                    ${item.pinned ? '<span class="lms-route-pill"><i class="fas fa-thumbtack"></i> Pinned</span>' : ''}
                                    ${canManage ? `
                                        <button class="kiu-btn-outline" style="padding:7px 10px;" data-lms-click="toggleLmsMaterialPinned('${resourceKey}', '${item.id}')"><i class="fas fa-thumbtack"></i></button>
                                        <button class="kiu-btn-outline" style="padding:7px 10px;" data-lms-click="moveLmsMaterial('${resourceKey}', '${item.id}', -1)"><i class="fas fa-arrow-up"></i></button>
                                        <button class="kiu-btn-outline" style="padding:7px 10px;" data-lms-click="moveLmsMaterial('${resourceKey}', '${item.id}', 1)"><i class="fas fa-arrow-down"></i></button>
                                        <button class="kiu-btn-outline" style="padding:7px 10px;" data-lms-click="toggleLmsMaterialArchived('${resourceKey}', '${item.id}')"><i class="fas fa-box-archive"></i></button>
                                        <button class="kiu-btn-outline" style="padding:7px 10px; color:var(--lux-red); border-color:rgba(220,38,38,0.18);" data-lms-click="deleteLmsMaterial('${resourceKey}', '${item.id}')"><i class="fas fa-trash"></i></button>
                                    ` : ''}
                                </div>
                            </div>
                            <div class="lms-route-meta" style="font-size:12px; margin-top:12px;">${joinLmsMeta([`Uploaded by ${item.uploadedBy || 'Course staff'}`, formatLmsDateTime(item.uploadedAt)])}</div>
                            <div class="lms-route-kv" style="margin-top:14px;">
                                <div class="lms-route-kv-label">Attachment</div>
                                <div class="lms-route-card-title" style="font-size:15px; margin-top:6px;">${escapeHtml(item.file?.name || 'Attachment')}</div>
                            </div>
                            <div class="lms-route-actions" style="margin-top:14px;">
                                ${getStoredFileDownloadHtml(item.file, 'Download')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `
            : renderLmsRouteEmptyState('No Material Yet', 'No materials were uploaded for this week yet.', 'fa-file-lines');
        return renderLmsRouteWeekAccordion(
            weekLabel,
            `${weekItems.length} material${weekItems.length === 1 ? '' : 's'} in this section`,
            body,
            index === 0
        );
    }).join('') : renderLmsRouteEmptyState('No Materials Yet', 'This LMS group does not have any published materials yet.', 'fa-folder-open');

    const archivedPanel = canManage && archivedItems.length ? `
        <div class="lms-route-panel">
            <div class="lms-route-card-title"><i class="fas fa-box-archive"></i> Archived materials</div>
            <div class="lms-route-stack" style="margin-top:12px; gap:10px;">
                ${archivedItems.map(item => `
                    <div class="lms-route-kv" style="display:flex; justify-content:space-between; gap:12px; align-items:center;">
                        <div>
                            <div class="lms-route-card-title" style="font-size:14px;">${escapeHtml(item.title || item.file?.name || 'Archived material')}</div>
                            <div class="lms-route-meta" style="font-size:11px; margin-top:4px;">${joinLmsMeta([item.weekLabel || 'General', item.file?.name || 'Attachment'])}</div>
                        </div>
                        <button class="kiu-btn-outline" data-lms-click="toggleLmsMaterialArchived('${resourceKey}', '${item.id}')"><i class="fas fa-rotate-left"></i> Restore</button>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : '';
    return `${weekBanner}${createBox}<div class="lms-route-stack">${cards}${archivedPanel}</div>`;
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
