(function initStudentServiceAttachmentsModule() {
    if (window.__KIU_STUDENT_SERVICE_ATTACHMENTS_MODULE_LOADED) return;
    window.__KIU_STUDENT_SERVICE_ATTACHMENTS_MODULE_LOADED = true;

    const STUDENT_SERVICE_MAX_ATTACHMENTS = 5;
    const STUDENT_SERVICE_ATTACHMENT_ACCEPT = 'image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.zip,.txt';

    function normalizeStudentServiceAttachmentRecord(file = {}, index = 0) {
        if (!file || typeof file !== 'object') return null;
        const storageKey = String(file.storageKey || file.id || '').trim();
        if (!storageKey && !String(file.dataUrl || '').trim()) return null;
        return {
            id: String(file.id || `svc-att-${index + 1}`).trim(),
            name: String(file.name || 'attachment').trim(),
            type: String(file.type || 'application/octet-stream').trim(),
            size: Number(file.size || 0),
            storageKey,
            storageBackend: String(file.storageBackend || 'bridge').trim(),
            dataUrl: String(file.dataUrl || '').trim()
        };
    }

    function normalizeStudentServiceAttachments(files = []) {
        return (Array.isArray(files) ? files : [])
            .map((file, index) => normalizeStudentServiceAttachmentRecord(file, index))
            .filter(Boolean)
            .slice(0, STUDENT_SERVICE_MAX_ATTACHMENTS);
    }

    function ensureStudentServiceAttachmentInput() {
        let input = document.getElementById('student-service-attachment-input');
        if (!input) {
            input = document.createElement('input');
            input.type = 'file';
            input.id = 'student-service-attachment-input';
            input.multiple = true;
            input.accept = STUDENT_SERVICE_ATTACHMENT_ACCEPT;
            input.hidden = true;
            document.body.appendChild(input);
        }
        return input;
    }

    function ensureStudentServiceDraftAttachments(ui) {
        if (!ui.draftAttachments || typeof ui.draftAttachments !== 'object') ui.draftAttachments = {};
        return ui.draftAttachments;
    }

    function getStudentServiceDraftAttachments(composerId) {
        const ui = ensureStudentServiceUiState();
        return Array.isArray(ensureStudentServiceDraftAttachments(ui)[composerId]) ? ui.draftAttachments[composerId] : [];
    }

    function syncStudentServiceAttachmentPickerUi(composerId) {
        const toolbar = document.querySelector(`[data-student-service-attachment-toolbar="${composerId}"]`);
        if (!toolbar) {
            renderStudentServicePage();
            return;
        }
        const drafts = getStudentServiceDraftAttachments(composerId);
        const chipsMarkup = renderStudentServiceAttachmentChipsMarkup(composerId, drafts);
        const chipsHost = toolbar.querySelector(`[data-student-service-attachment-chips="${composerId}"]`);
        if (chipsMarkup) {
            if (chipsHost) chipsHost.outerHTML = chipsMarkup;
            else toolbar.insertAdjacentHTML('beforeend', chipsMarkup);
        } else if (chipsHost) {
            chipsHost.remove();
        }
    }

    function addStudentServiceDraftAttachment(composerId, file) {
        if (!file) return;
        const ui = ensureStudentServiceUiState();
        const drafts = ensureStudentServiceDraftAttachments(ui);
        const current = Array.isArray(drafts[composerId]) ? drafts[composerId].slice() : [];
        if (current.length >= STUDENT_SERVICE_MAX_ATTACHMENTS) {
            alert(`You can attach up to ${STUDENT_SERVICE_MAX_ATTACHMENTS} files per message.`);
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            current.push({
                id: `ssvc_att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                name: file.name || 'attachment',
                type: file.type || 'application/octet-stream',
                size: file.size || 0,
                dataUrl: String(reader.result || '')
            });
            drafts[composerId] = current.slice(0, STUDENT_SERVICE_MAX_ATTACHMENTS);
            syncStudentServiceAttachmentPickerUi(composerId);
        };
        reader.readAsDataURL(file);
    }

    function removeStudentServiceDraftAttachment(composerId, attachmentId) {
        const ui = ensureStudentServiceUiState();
        const drafts = ensureStudentServiceDraftAttachments(ui);
        const current = Array.isArray(drafts[composerId]) ? drafts[composerId] : [];
        drafts[composerId] = current.filter(item => String(item.id || '') !== String(attachmentId || ''));
        syncStudentServiceAttachmentPickerUi(composerId);
    }

    function clearStudentServiceDraftAttachments(composerId) {
        const ui = ensureStudentServiceUiState();
        const drafts = ensureStudentServiceDraftAttachments(ui);
        delete drafts[composerId];
    }

    async function persistStudentServiceDraftAttachments(composerId) {
        const drafts = getStudentServiceDraftAttachments(composerId);
        if (!drafts.length) return [];
        if (typeof uploadPortalStoredFile !== 'function') return drafts;
        const uploaded = [];
        for (const draft of drafts) {
            if (draft.storageKey) {
                uploaded.push({
                    id: draft.id,
                    name: draft.name,
                    type: draft.type,
                    size: draft.size,
                    storageKey: draft.storageKey,
                    storageBackend: draft.storageBackend || 'bridge'
                });
                continue;
            }
            const stored = await uploadPortalStoredFile(draft, 'student-service');
            if (stored?.storageKey) {
                uploaded.push({
                    id: draft.id || `ssvc_att_${Date.now()}`,
                    name: stored.name || draft.name,
                    type: stored.type || draft.type,
                    size: stored.size || draft.size,
                    storageKey: stored.storageKey,
                    storageBackend: stored.storageBackend || 'bridge'
                });
            }
        }
        return uploaded.slice(0, STUDENT_SERVICE_MAX_ATTACHMENTS);
    }

    function resolveStudentServiceAttachmentUrl(file) {
        if (!file || typeof file !== 'object') return '';
        if (String(file.storageBackend || '').trim().toLowerCase() === 'bridge'
            && String(file.storageKey || '').trim()
            && typeof getPortalStoredFileUrl === 'function') {
            return getPortalStoredFileUrl(file.storageKey);
        }
        return String(file.dataUrl || '').trim();
    }

    function isStudentServiceImageAttachment(file) {
        return /^image\//i.test(String(file?.type || ''));
    }

    function isStudentServiceVideoAttachment(file) {
        return /^video\//i.test(String(file?.type || ''));
    }

    function renderStudentServiceAttachmentGalleryMarkup(attachments = []) {
        const items = (Array.isArray(attachments) ? attachments : []).filter(file => resolveStudentServiceAttachmentUrl(file));
        if (!items.length) return '';
        return `
            <div class="student-service-attachment-gallery">
                ${items.map((file) => {
                    const url = resolveStudentServiceAttachmentUrl(file);
                    const name = ssEscape(file.name || 'attachment');
                    if (isStudentServiceImageAttachment(file)) {
                        return `<a class="student-service-attachment-item student-service-attachment-image" href="${ssEscape(url)}" target="_blank" rel="noopener noreferrer"><img src="${ssEscape(url)}" alt="${name}" loading="lazy"></a>`;
                    }
                    if (isStudentServiceVideoAttachment(file)) {
                        return `<div class="student-service-attachment-item student-service-attachment-video"><video controls preload="metadata" src="${ssEscape(url)}"></video></div>`;
                    }
                    return `<a class="student-service-attachment-item student-service-attachment-file" href="${ssEscape(url)}" target="_blank" rel="noopener noreferrer"><i class="fas fa-paperclip"></i><span>${name}</span></a>`;
                }).join('')}
            </div>
        `;
    }

    function renderStudentServiceAttachmentChipsMarkup(composerId, drafts) {
        if (!drafts.length) return '';
        return `
            <div class="student-service-attachment-chips" data-student-service-attachment-chips="${ssEscape(composerId)}">
                ${drafts.map((file) => `
                    <span class="student-service-attachment-chip home-hover-chip lux-soft-chrome">
                        <i class="fas ${isStudentServiceImageAttachment(file) ? 'fa-image' : isStudentServiceVideoAttachment(file) ? 'fa-video' : 'fa-file'}"></i>
                        <span>${ssEscape(file.name || 'attachment')}</span>
                        <button type="button" class="student-service-attachment-chip-remove" data-student-service-remove-attachment="${ssEscape(composerId)}" data-student-service-attachment-id="${ssEscape(file.id || '')}" aria-label="Remove attachment"><i class="fas fa-times"></i></button>
                    </span>
                `).join('')}
            </div>
        `;
    }

    function renderStudentServiceAttachmentPickerMarkup(composerId, options = {}) {
        const drafts = getStudentServiceDraftAttachments(composerId);
        const chipsMarkup = renderStudentServiceAttachmentChipsMarkup(composerId, drafts);
        if (options.chipsOnly) return chipsMarkup;
        return `
            <div class="student-service-attachment-toolbar" data-student-service-attachment-toolbar="${ssEscape(composerId)}">
                <button type="button" class="student-service-mini-action lux-secondary-btn" data-student-service-attach="${ssEscape(composerId)}"><i class="fas fa-paperclip"></i> Attach files</button>
                <span class="student-service-attachment-hint">Images, video, PDF, and documents · up to ${STUDENT_SERVICE_MAX_ATTACHMENTS} files</span>
                ${chipsMarkup}
            </div>
        `;
    }

    function pickStudentServiceAttachments(composerId) {
        const input = ensureStudentServiceAttachmentInput();
        input.value = '';
        input.onchange = () => {
            const files = Array.from(input.files || []);
            const remaining = STUDENT_SERVICE_MAX_ATTACHMENTS - getStudentServiceDraftAttachments(composerId).length;
            files.slice(0, Math.max(0, remaining)).forEach(file => addStudentServiceDraftAttachment(composerId, file));
        };
        input.click();
    }

    function getStudentServiceAnswerComposerId(questionId, parentAnswerId = '') {
        const normalizedQuestionId = String(questionId || '').trim();
        const normalizedParentAnswerId = String(parentAnswerId || '').trim();
        return normalizedParentAnswerId
            ? `qa-answer-${normalizedQuestionId}-${normalizedParentAnswerId}`
            : `qa-answer-${normalizedQuestionId}`;
    }

    window.normalizeStudentServiceAttachmentRecord = normalizeStudentServiceAttachmentRecord;
    window.normalizeStudentServiceAttachments = normalizeStudentServiceAttachments;
    window.ensureStudentServiceAttachmentInput = ensureStudentServiceAttachmentInput;
    window.ensureStudentServiceDraftAttachments = ensureStudentServiceDraftAttachments;
    window.getStudentServiceDraftAttachments = getStudentServiceDraftAttachments;
    window.addStudentServiceDraftAttachment = addStudentServiceDraftAttachment;
    window.removeStudentServiceDraftAttachment = removeStudentServiceDraftAttachment;
    window.clearStudentServiceDraftAttachments = clearStudentServiceDraftAttachments;
    window.persistStudentServiceDraftAttachments = persistStudentServiceDraftAttachments;
    window.resolveStudentServiceAttachmentUrl = resolveStudentServiceAttachmentUrl;
    window.isStudentServiceImageAttachment = isStudentServiceImageAttachment;
    window.isStudentServiceVideoAttachment = isStudentServiceVideoAttachment;
    window.renderStudentServiceAttachmentGalleryMarkup = renderStudentServiceAttachmentGalleryMarkup;
    window.renderStudentServiceAttachmentChipsMarkup = renderStudentServiceAttachmentChipsMarkup;
    window.renderStudentServiceAttachmentPickerMarkup = renderStudentServiceAttachmentPickerMarkup;
    window.syncStudentServiceAttachmentPickerUi = syncStudentServiceAttachmentPickerUi;
    window.pickStudentServiceAttachments = pickStudentServiceAttachments;
    window.getStudentServiceAnswerComposerId = getStudentServiceAnswerComposerId;
})();
