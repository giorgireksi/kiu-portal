const CHANCELLERY_DOCUMENT_SECTION_TYPES = Object.freeze([
    'title',
    'paragraph',
    'courseLabel',
    'examOptions',
    'description'
]);

let chancelleryDocumentEditorDirty = false;
let chancelleryDocumentEditorDraft = null;
let chancelleryDocumentEditorSaveInFlight = false;
let chancelleryAppealPendingSubjectKey = '';

function escapeChancelleryDocumentHtml(value) {
    if (typeof escapeHtml === 'function') return escapeHtml(value);
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function slugifyChancelleryDocumentToken(label = '', fallback = 'option') {
    const slug = String(label || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return slug || fallback;
}

function buildDefaultChancelleryDocumentTemplate() {
    return {
        version: 1,
        letterhead: {
            institutionKa: 'სსიპ ქუთაისის საერთაშორისო უნივერსიტეტის',
            institutionEn: 'LEPL Kutaisi International University',
            schoolLabel: 'სკოლის/School',
            programLabel: 'პროგრამა/Program',
            nameEnLabel: 'სახელი გვარი ინგლისურად',
            nameKaLabel: 'სახელი გვარი ქართულად',
            personalNumberLabel: 'პირადი ნომერი'
        },
        sections: [
            {
                id: 'title_appeal',
                type: 'title',
                text: 'განცხადება აპელაციის თაობაზე / Appeal Request'
            },
            {
                id: 'course_line',
                type: 'courseLabel',
                label: 'საგანი/Course:'
            },
            {
                id: 'exam_choice',
                type: 'examOptions',
                options: [
                    { id: 'midterm', label: 'შუალედური გამოცდა Midterm Exam' },
                    { id: 'final', label: 'დასკვნითი გამოცდა Final Exam' },
                    { id: 'retake', label: 'დამატებითი გამოცდა Retake exam' }
                ]
            },
            {
                id: 'description',
                type: 'description',
                label: 'შეფასების გასაჩივრების შესახებ მოკლე აღწერილობა/Brief description on the assessment appeal:',
                helper: 'გთხოვთ, სააპელაციო განაცხადის შევსებისას აუცილებლად მიუთითოთ საკითხი ან ნომერი, რომლის შეფასებასაც ასაჩივრებთ, ასევე დაურთოთ მოკლე განმარტება, რატომ მიიჩნევთ, რომ შეფასება საჭიროებს გადახედვას.',
                placeholder: ''
            }
        ],
        submitLabel: 'გაგზავნა'
    };
}

function normalizeChancelleryDocumentExamOption(option = {}, index = 0) {
    const label = String(option?.label ?? option?.text ?? '').trim();
    if (!label) return null;
    const id = String(option?.id || option?.value || '').trim()
        || slugifyChancelleryDocumentToken(label, `exam_${index + 1}`);
    return { id, label };
}

function normalizeChancelleryDocumentSection(section = {}, index = 0) {
    const type = String(section?.type || '').trim();
    if (!CHANCELLERY_DOCUMENT_SECTION_TYPES.includes(type)) return null;
    const id = String(section?.id || '').trim() || `section_${type}_${index + 1}`;
    if (type === 'title') {
        const text = String(section?.text || section?.label || '').trim();
        if (!text) return null;
        return { id, type, text };
    }
    if (type === 'paragraph') {
        const text = String(section?.text || '').trim();
        if (!text) return null;
        return { id, type, text };
    }
    if (type === 'courseLabel') {
        return { id, type, label: String(section?.label || 'საგანი/Course:').trim() || 'საგანი/Course:' };
    }
    if (type === 'examOptions') {
        const options = (Array.isArray(section?.options) ? section.options : [])
            .map((option, optionIndex) => normalizeChancelleryDocumentExamOption(option, optionIndex))
            .filter(Boolean);
        if (!options.length) return null;
        return { id, type, options };
    }
    return {
        id,
        type: 'description',
        label: String(section?.label || '').trim()
            || 'შეფასების გასაჩივრების შესახებ მოკლე აღწერილობა/Brief description on the assessment appeal:',
        helper: String(section?.helper || '').trim(),
        placeholder: String(section?.placeholder || '').trim()
    };
}

function normalizeChancelleryDocumentLetterhead(letterhead = {}) {
    const defaults = buildDefaultChancelleryDocumentTemplate().letterhead;
    return {
        institutionKa: String(letterhead?.institutionKa ?? defaults.institutionKa).trim() || defaults.institutionKa,
        institutionEn: String(letterhead?.institutionEn ?? defaults.institutionEn).trim() || defaults.institutionEn,
        schoolLabel: String(letterhead?.schoolLabel ?? defaults.schoolLabel).trim() || defaults.schoolLabel,
        programLabel: String(letterhead?.programLabel ?? defaults.programLabel).trim() || defaults.programLabel,
        nameEnLabel: String(letterhead?.nameEnLabel ?? defaults.nameEnLabel).trim() || defaults.nameEnLabel,
        nameKaLabel: String(letterhead?.nameKaLabel ?? defaults.nameKaLabel).trim() || defaults.nameKaLabel,
        personalNumberLabel: String(letterhead?.personalNumberLabel ?? defaults.personalNumberLabel).trim()
            || defaults.personalNumberLabel
    };
}

function normalizeChancelleryDocumentTemplate(template = null) {
    const defaults = buildDefaultChancelleryDocumentTemplate();
    if (template == null || typeof template !== 'object') return structuredClone
        ? structuredClone(defaults)
        : JSON.parse(JSON.stringify(defaults));
    const sections = (Array.isArray(template.sections) ? template.sections : [])
        .map((section, index) => normalizeChancelleryDocumentSection(section, index))
        .filter(Boolean);
    const seen = new Set();
    const deduped = [];
    sections.forEach((section) => {
        if (seen.has(section.id)) return;
        seen.add(section.id);
        deduped.push(section);
    });
    return {
        version: 1,
        letterhead: normalizeChancelleryDocumentLetterhead(template.letterhead),
        sections: deduped.length ? deduped : defaults.sections.map((item) => ({ ...item, options: item.options ? item.options.map((opt) => ({ ...opt })) : undefined })),
        submitLabel: String(template.submitLabel || defaults.submitLabel).trim() || defaults.submitLabel
    };
}

function getChancelleryDocumentTemplateCache() {
    if (!KIU_STATE.chancelleryDocumentTemplateByFaculty
        || typeof KIU_STATE.chancelleryDocumentTemplateByFaculty !== 'object') {
        KIU_STATE.chancelleryDocumentTemplateByFaculty = {};
    }
    return KIU_STATE.chancelleryDocumentTemplateByFaculty;
}

function getCachedChancelleryDocumentTemplate(faculty) {
    const facultyCode = typeof normalizeFacultyCode === 'function'
        ? normalizeFacultyCode(faculty || 'ECON', 'ECON')
        : String(faculty || 'ECON').trim().toUpperCase() || 'ECON';
    const cache = getChancelleryDocumentTemplateCache();
    return normalizeChancelleryDocumentTemplate(cache[facultyCode] || buildDefaultChancelleryDocumentTemplate());
}

function setCachedChancelleryDocumentTemplate(template, faculty) {
    const facultyCode = typeof normalizeFacultyCode === 'function'
        ? normalizeFacultyCode(faculty || 'ECON', 'ECON')
        : String(faculty || 'ECON').trim().toUpperCase() || 'ECON';
    const normalized = normalizeChancelleryDocumentTemplate(template);
    getChancelleryDocumentTemplateCache()[facultyCode] = normalized;
    return normalized;
}

function matchesChancelleryLayoutDateRange(request, dateFrom, dateTo) {
    const requestDate = String(request?.date || request?.createdAt || '').slice(0, 10);
    if (!requestDate) return true;
    if (dateFrom && requestDate < dateFrom) return false;
    if (dateTo && requestDate > dateTo) return false;
    return true;
}

async function fetchChancelleryDocumentTemplate(faculty, options = {}) {
    const facultyCode = typeof normalizeFacultyCode === 'function'
        ? normalizeFacultyCode(faculty || 'ECON', 'ECON')
        : String(faculty || 'ECON').trim().toUpperCase() || 'ECON';
    if (options.preferDirty !== false && isChancelleryDocumentEditorOpen() && chancelleryDocumentEditorDirty) {
        return getCachedChancelleryDocumentTemplate(facultyCode);
    }
    if (typeof kiuPortalFetch !== 'function') {
        return getCachedChancelleryDocumentTemplate(facultyCode);
    }
    try {
        const payload = await kiuPortalFetch(
            `/api/chancellery/document-template?facultyCode=${encodeURIComponent(facultyCode)}`
        );
        if (payload?.documentTemplate) {
            if (isChancelleryDocumentEditorOpen() && chancelleryDocumentEditorDirty) {
                return getCachedChancelleryDocumentTemplate(facultyCode);
            }
            return setCachedChancelleryDocumentTemplate(payload.documentTemplate, facultyCode);
        }
    } catch (_error) {
        /* keep cached / default */
    }
    return getCachedChancelleryDocumentTemplate(facultyCode);
}

async function saveChancelleryDocumentTemplate(template, faculty) {
    const facultyCode = typeof normalizeFacultyCode === 'function'
        ? normalizeFacultyCode(faculty || 'ECON', 'ECON')
        : String(faculty || 'ECON').trim().toUpperCase() || 'ECON';
    const normalized = normalizeChancelleryDocumentTemplate(template);
    if (typeof kiuPortalFetch !== 'function') {
        throw new Error('Portal API is unavailable. Start the local backend to save the appeal document.');
    }
    const payload = await kiuPortalFetch('/api/chancellery/document-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            facultyCode,
            documentTemplate: normalized
        })
    });
    if (payload?.error) throw new Error(payload.error);
    return setCachedChancelleryDocumentTemplate(payload?.documentTemplate || normalized, facultyCode);
}


function resolveChancelleryAppealIdentity(user = null) {
    const current = user || (typeof getCurrentUser === 'function' ? getCurrentUser() : null) || {};
    const nameEn = String(current.nameEn || current.name || 'Student').trim() || 'Student';
    const nameKa = String(current.name || '').trim();
    const facultyCode = current.facultyCode || current.faculty
        || (typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON');
    const school = typeof getFacultyLabel === 'function'
        ? getFacultyLabel(facultyCode)
        : String(facultyCode || '');
    return {
        school,
        program: String(current.program || '').trim() || '—',
        nameEn,
        nameKa: nameKa && nameKa !== nameEn ? nameKa : nameKa || '—',
        personalNumber: String(current.personalNumber || current.nationalId || current.id || '').trim() || '—'
    };
}

function getChancelleryDocumentPreviewIdentity() {
    return {
        school: 'Sample School',
        program: 'Sample Program',
        nameEn: 'GIORGI / BABUNASHVILI',
        nameKa: 'გიორგი / ბაბუნაშვილი',
        personalNumber: '00000000000'
    };
}

function markChancelleryDocumentEditorDirty() {
    chancelleryDocumentEditorDirty = true;
}

function docEditInput(attrs = {}, value, { multiline = false, rows = 2 } = {}) {
    const className = String(attrs.class || 'chancellery-doc-edit').trim() || 'chancellery-doc-edit';
    const attrStr = Object.entries(attrs)
        .filter(([key]) => key !== 'class')
        .map(([key, val]) => `${key}="${escapeChancelleryDocumentHtml(val)}"`)
        .join(' ');
    if (multiline) {
        return `<textarea class="${escapeChancelleryDocumentHtml(className)}" rows="${rows}" ${attrStr}>${escapeChancelleryDocumentHtml(value || '')}</textarea>`;
    }
    return `<input class="${escapeChancelleryDocumentHtml(className)}" type="text" ${attrStr} value="${escapeChancelleryDocumentHtml(value || '')}">`;
}

function renderChancelleryAppealDocumentMarkup({
    template,
    subject,
    identity,
    mode = 'fill'
} = {}) {
    const isEdit = mode === 'edit';
    const letterhead = template.letterhead || {};
    const examName = 'chancellery-appeal-exam';
    const messageId = 'chancellery-appeal-message';
    const titleId = 'chancellery-appeal-title';

    const brandKa = isEdit
        ? docEditInput({ 'data-doc-letterhead': 'institutionKa' }, letterhead.institutionKa, { multiline: true, rows: 2 })
        : `<div class="chancellery-doc-line">${escapeChancelleryDocumentHtml(letterhead.institutionKa)}</div>`;
    const brandEn = isEdit
        ? docEditInput({ 'data-doc-letterhead': 'institutionEn' }, letterhead.institutionEn, { multiline: true, rows: 2 })
        : `<div class="chancellery-doc-line chancellery-doc-muted">${escapeChancelleryDocumentHtml(letterhead.institutionEn)}</div>`;

    const identityPairs = [
        ['schoolLabel', letterhead.schoolLabel, identity.school],
        ['programLabel', letterhead.programLabel, identity.program],
        ['nameEnLabel', letterhead.nameEnLabel, identity.nameEn],
        ['nameKaLabel', letterhead.nameKaLabel, identity.nameKa],
        ['personalNumberLabel', letterhead.personalNumberLabel, identity.personalNumber]
    ];
    const identityRows = identityPairs.map(([key, label, value]) => `
        <div class="chancellery-doc-identity-row" data-doc-identity-row="${escapeChancelleryDocumentHtml(key)}">
            ${isEdit
                ? docEditInput({ 'data-doc-letterhead': key, class: 'chancellery-doc-edit chancellery-doc-edit--label' }, label)
                : `<span class="chancellery-doc-label">${escapeChancelleryDocumentHtml(label)}</span>`}
            <span class="chancellery-doc-value">${escapeChancelleryDocumentHtml(value)}</span>
        </div>
    `).join('');

    const sectionsMarkup = (template.sections || []).map((section) => {
        const sid = escapeChancelleryDocumentHtml(section.id);
        if (section.type === 'title') {
            return `
                <div class="chancellery-doc-title" data-doc-section-id="${sid}" data-doc-section-type="title" id="${titleId}">
                    ${isEdit
                        ? docEditInput({ 'data-doc-section-text': '1' }, section.text, { multiline: true, rows: 2 })
                        : escapeChancelleryDocumentHtml(section.text)}
                </div>
            `;
        }
        if (section.type === 'paragraph') {
            return `
                <div class="chancellery-doc-paragraph" data-doc-section-id="${sid}" data-doc-section-type="paragraph">
                    ${isEdit
                        ? docEditInput({ 'data-doc-section-text': '1' }, section.text, { multiline: true, rows: 3 })
                        : escapeChancelleryDocumentHtml(section.text)}
                </div>
            `;
        }
        if (section.type === 'courseLabel') {
            return `
                <div class="chancellery-doc-course" data-doc-section-id="${sid}" data-doc-section-type="courseLabel">
                    ${isEdit
                        ? docEditInput({ 'data-doc-section-label': '1', class: 'chancellery-doc-edit chancellery-doc-edit--inline' }, section.label)
                        : `<span class="chancellery-doc-label">${escapeChancelleryDocumentHtml(section.label)}</span>`}
                    <span class="chancellery-doc-value">${escapeChancelleryDocumentHtml(subject?.subjectName || '—')}</span>
                </div>
            `;
        }
        if (section.type === 'examOptions') {
            return `
                <div class="chancellery-doc-exams" data-doc-section-id="${sid}" data-doc-section-type="examOptions" role="radiogroup" aria-label="Exam">
                    ${(section.options || []).map((option) => `
                        <label class="chancellery-doc-exam" data-doc-exam-option="${escapeChancelleryDocumentHtml(option.id)}">
                            <input type="radio" name="${examName}" value="${escapeChancelleryDocumentHtml(option.id)}"${isEdit ? ' disabled' : ''}>
                            ${isEdit
                                ? docEditInput({ 'data-doc-exam-label': '1' }, option.label, { multiline: true, rows: 2 })
                                : `<span>${escapeChancelleryDocumentHtml(option.label)}</span>`}
                        </label>
                    `).join('')}
                </div>
            `;
        }
        return `
            <div class="chancellery-doc-description" data-doc-section-id="${sid}" data-doc-section-type="description">
                ${isEdit
                    ? docEditInput({ 'data-doc-section-label': '1' }, section.label, { multiline: true, rows: 2 })
                    : `<div class="chancellery-doc-label">${escapeChancelleryDocumentHtml(section.label)}</div>`}
                ${isEdit
                    ? docEditInput({ 'data-doc-section-helper': '1' }, section.helper, { multiline: true, rows: 3 })
                    : (section.helper ? `<p class="chancellery-doc-helper">${escapeChancelleryDocumentHtml(section.helper)}</p>` : '')}
                ${isEdit
                    ? `<div class="chancellery-doc-placeholder-row"><span class="chancellery-doc-muted">Placeholder</span>${docEditInput({ 'data-doc-section-placeholder': '1' }, section.placeholder)}</div>`
                    : ''}
                <textarea id="${messageId}" class="chancellery-doc-message" rows="8" placeholder="${escapeChancelleryDocumentHtml(section.placeholder || '')}"${isEdit ? ' readonly' : ''}></textarea>
            </div>
        `;
    }).join('');

    const submitLabelControl = isEdit
        ? docEditInput({ 'data-doc-submit-label': '1', class: 'chancellery-doc-edit chancellery-doc-edit--submit' }, template.submitLabel || 'გაგზავნა')
        : '';

    const actions = isEdit ? `
        <div class="chancellery-doc-actions">
            <button type="button" class="lux-secondary-btn" data-chancellery-doc-action="reset-default"><i class="fas fa-rotate-left"></i> Reset to default</button>
            <button type="button" class="lux-primary-btn" data-chancellery-doc-action="save-editor"><i class="fas fa-save"></i> Save document</button>
        </div>
        ${submitLabelControl ? `<div class="chancellery-doc-submit-label-row"><span class="chancellery-doc-muted">Submit button</span>${submitLabelControl}</div>` : ''}
    ` : `
        <div class="chancellery-doc-actions">
            <button type="button" class="lux-primary-btn" data-chancellery-action="submit-appeal-document">
                ${escapeChancelleryDocumentHtml(template.submitLabel || 'გაგზავნა')}
            </button>
        </div>
    `;

    const closeAction = isEdit
        ? 'data-chancellery-doc-action="close-editor"'
        : 'data-chancellery-action="close-appeal-modal"';

    return `
        <div class="chancellery-doc-shell">
            <button type="button" class="lux-secondary-btn chancellery-doc-close" data-lux-skip-modern-button="true" ${closeAction} aria-label="Close"><i class="fas fa-times"></i></button>
            <article class="chancellery-appeal-document chancellery-doc-page">
                <header class="chancellery-doc-letterhead">
                    <div class="chancellery-doc-brand">
                        <div class="chancellery-doc-kicker">KIU</div>
                        ${brandKa}
                        ${brandEn}
                    </div>
                    <div class="chancellery-doc-identity">
                        ${identityRows}
                    </div>
                </header>
                ${sectionsMarkup}
                ${actions}
            </article>
        </div>
    `;
}

function syncChancelleryDocumentEditorDraftFromDom() {
    const overlay = document.getElementById('chancellery-document-editor-overlay');
    if (!overlay || !chancelleryDocumentEditorDraft) return chancelleryDocumentEditorDraft;
    const draft = chancelleryDocumentEditorDraft;
    draft.letterhead = normalizeChancelleryDocumentLetterhead({
        institutionKa: overlay.querySelector('[data-doc-letterhead="institutionKa"]')?.value,
        institutionEn: overlay.querySelector('[data-doc-letterhead="institutionEn"]')?.value,
        schoolLabel: overlay.querySelector('[data-doc-letterhead="schoolLabel"]')?.value,
        programLabel: overlay.querySelector('[data-doc-letterhead="programLabel"]')?.value,
        nameEnLabel: overlay.querySelector('[data-doc-letterhead="nameEnLabel"]')?.value,
        nameKaLabel: overlay.querySelector('[data-doc-letterhead="nameKaLabel"]')?.value,
        personalNumberLabel: overlay.querySelector('[data-doc-letterhead="personalNumberLabel"]')?.value
    });
    draft.submitLabel = String(overlay.querySelector('[data-doc-submit-label]')?.value || '').trim() || 'გაგზავნა';
    draft.sections = (draft.sections || []).map((section) => {
        const root = overlay.querySelector(`[data-doc-section-id="${section.id}"]`);
        if (!root) return section;
        if (section.type === 'title' || section.type === 'paragraph') {
            return { ...section, text: String(root.querySelector('[data-doc-section-text]')?.value || '').trim() };
        }
        if (section.type === 'courseLabel') {
            return { ...section, label: String(root.querySelector('[data-doc-section-label]')?.value || '').trim() };
        }
        if (section.type === 'description') {
            return {
                ...section,
                label: String(root.querySelector('[data-doc-section-label]')?.value || '').trim(),
                helper: String(root.querySelector('[data-doc-section-helper]')?.value || '').trim(),
                placeholder: String(root.querySelector('[data-doc-section-placeholder]')?.value || '').trim()
            };
        }
        if (section.type === 'examOptions') {
            const options = Array.from(root.querySelectorAll('[data-doc-exam-option]')).map((row, index) => {
                const label = String(row.querySelector('[data-doc-exam-label]')?.value || '').trim();
                const id = String(row.getAttribute('data-doc-exam-option') || '').trim()
                    || slugifyChancelleryDocumentToken(label, `exam_${index + 1}`);
                return normalizeChancelleryDocumentExamOption({ id, label }, index);
            }).filter(Boolean);
            return { ...section, options };
        }
        return section;
    });
    chancelleryDocumentEditorDraft = normalizeChancelleryDocumentTemplate(draft);
    return chancelleryDocumentEditorDraft;
}

function ensureChancelleryDocumentEditorOverlay() {
    let overlay = document.getElementById('chancellery-document-editor-overlay');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'chancellery-document-editor-overlay';
    overlay.className = 'modal-overlay chancellery-doc-fullscreen-overlay';
    overlay.hidden = true;
    overlay.innerHTML = '<div class="modal-content lux-panel chancellery-document-editor-modal chancellery-doc-fullscreen-modal" role="dialog" aria-modal="true" aria-labelledby="chancellery-document-editor-title"></div>';
    document.body.appendChild(overlay);
    return overlay;
}

function isChancelleryDocumentEditorOpen() {
    const overlay = document.getElementById('chancellery-document-editor-overlay');
    return Boolean(overlay && !overlay.hidden);
}

function closeChancelleryDocumentEditor() {
    const overlay = document.getElementById('chancellery-document-editor-overlay');
    if (!overlay) return;
    overlay.hidden = true;
    overlay.classList.remove('active');
    chancelleryDocumentEditorDirty = false;
    chancelleryDocumentEditorDraft = null;
}

function renderChancelleryDocumentEditorModalMarkup(draft) {
    return `
        <div class="chancellery-doc-toolbar">
            <div>
                <div class="lux-section-kicker" id="chancellery-document-editor-title">Edit appeal document</div>
                <div class="lux-panel-copy lux-meta">Controls the student appeal form for this faculty. Edit text in place.</div>
            </div>
        </div>
        ${renderChancelleryAppealDocumentMarkup({
            template: draft,
            subject: { subjectName: 'Sample course' },
            identity: getChancelleryDocumentPreviewIdentity(),
            mode: 'edit'
        })}
    `;
}

function refreshChancelleryDocumentEditorModal() {
    const overlay = ensureChancelleryDocumentEditorOverlay();
    const panel = overlay.querySelector('.chancellery-document-editor-modal');
    if (!panel || !chancelleryDocumentEditorDraft) return;
    panel.innerHTML = renderChancelleryDocumentEditorModalMarkup(chancelleryDocumentEditorDraft);
}

async function openChancelleryDocumentEditor() {
    if (typeof getEffectiveUserRole === 'function' && getEffectiveUserRole() !== USER_ROLES.ADMIN) return;
    const faculty = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
    const template = await fetchChancelleryDocumentTemplate(faculty, { force: true, preferDirty: false });
    chancelleryDocumentEditorDraft = normalizeChancelleryDocumentTemplate(template);
    chancelleryDocumentEditorDirty = false;
    const overlay = ensureChancelleryDocumentEditorOverlay();
    refreshChancelleryDocumentEditorModal();
    overlay.hidden = false;
    overlay.classList.add('active');
}

async function saveChancelleryDocumentEditorDraft() {
    if (chancelleryDocumentEditorSaveInFlight) return;
    const faculty = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
    syncChancelleryDocumentEditorDraftFromDom();
    const draft = normalizeChancelleryDocumentTemplate(chancelleryDocumentEditorDraft);
    chancelleryDocumentEditorSaveInFlight = true;
    try {
        await saveChancelleryDocumentTemplate(draft, faculty);
        chancelleryDocumentEditorDirty = false;
        chancelleryDocumentEditorDraft = draft;
        if (typeof showToast === 'function') showToast('Appeal document saved.');
        closeChancelleryDocumentEditor();
        if (typeof renderChancelleryPage === 'function') renderChancelleryPage();
    } catch (error) {
        alert(error?.message || 'Could not save appeal document.');
    } finally {
        chancelleryDocumentEditorSaveInFlight = false;
    }
}

function bindChancelleryDocumentEditorDelegates() {
    if (document.documentElement.dataset.chancelleryDocumentEditorBound === '1') return;
    document.addEventListener('click', (event) => {
        const trigger = event.target.closest('[data-chancellery-doc-action]');
        if (!trigger) {
            if (event.target.id === 'chancellery-document-editor-overlay') {
                closeChancelleryDocumentEditor();
            }
            return;
        }
        const action = trigger.getAttribute('data-chancellery-doc-action');
        if (action === 'close-editor') {
            closeChancelleryDocumentEditor();
            return;
        }
        if (action === 'save-editor') {
            saveChancelleryDocumentEditorDraft();
            return;
        }
        if (action === 'reset-default') {
            chancelleryDocumentEditorDraft = normalizeChancelleryDocumentTemplate(
                buildDefaultChancelleryDocumentTemplate()
            );
            markChancelleryDocumentEditorDirty();
            refreshChancelleryDocumentEditorModal();
        }
    });
    document.addEventListener('input', (event) => {
        if (!event.target.closest?.('#chancellery-document-editor-overlay')) return;
        markChancelleryDocumentEditorDirty();
    });
    document.documentElement.dataset.chancelleryDocumentEditorBound = '1';
}

function ensureChancelleryAppealOverlay() {
    let overlay = document.getElementById('chancellery-appeal-overlay');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'chancellery-appeal-overlay';
    overlay.className = 'modal-overlay chancellery-doc-fullscreen-overlay';
    overlay.hidden = true;
    overlay.innerHTML = `
        <div class="modal-content lux-panel chancellery-appeal-modal chancellery-doc-fullscreen-modal" role="dialog" aria-modal="true" aria-labelledby="chancellery-appeal-title">
            <div id="chancellery-appeal-panel" class="chancellery-appeal-panel"></div>
        </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
}

function closeChancelleryAppealModal() {
    const overlay = document.getElementById('chancellery-appeal-overlay');
    if (!overlay) return;
    overlay.hidden = true;
    overlay.classList.remove('active');
    chancelleryAppealPendingSubjectKey = '';
}

async function openChancelleryAppealModal(subjectKey = '') {
    if (typeof getEffectiveUserRole === 'function' && getEffectiveUserRole() !== USER_ROLES.STUDENT) return;
    const key = String(subjectKey || document.getElementById('chancellery-subject-select')?.value || '').trim();
    const subjects = typeof getStudentGradedSubjectsForChancellery === 'function'
        ? getStudentGradedSubjectsForChancellery()
        : [];
    const subject = subjects.find((item) => `${item.subjectId}::${item.groupId}` === key);
    if (!subject) {
        alert('Choose a graded subject before opening the appeal form.');
        return;
    }
    const faculty = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
    const template = await fetchChancelleryDocumentTemplate(faculty);
    const identity = resolveChancelleryAppealIdentity();
    chancelleryAppealPendingSubjectKey = key;
    const overlay = ensureChancelleryAppealOverlay();
    const panel = overlay.querySelector('#chancellery-appeal-panel');
    if (panel) {
        panel.innerHTML = renderChancelleryAppealDocumentMarkup({
            template,
            subject,
            identity,
            mode: 'fill'
        });
    }
    overlay.hidden = false;
    overlay.classList.add('active');
}

function readChancelleryAppealFormValues() {
    const overlay = document.getElementById('chancellery-appeal-overlay');
    const examOption = String(overlay?.querySelector('input[name="chancellery-appeal-exam"]:checked')?.value || '').trim();
    const message = String(overlay?.querySelector('#chancellery-appeal-message')?.value || '').trim();
    return { examOption, message, subjectKey: chancelleryAppealPendingSubjectKey };
}

function bindChancelleryAppealModalDelegates() {
    if (document.documentElement.dataset.chancelleryAppealModalBound === '1') return;
    document.addEventListener('click', (event) => {
        if (event.target.id === 'chancellery-appeal-overlay') {
            closeChancelleryAppealModal();
        }
    });
    document.documentElement.dataset.chancelleryAppealModalBound = '1';
}

bindChancelleryDocumentEditorDelegates();
bindChancelleryAppealModalDelegates();
