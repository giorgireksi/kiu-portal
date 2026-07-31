const { asArray, clone, normalizeCode } = require('../utils');

const CHANCELLERY_DOCUMENT_VERSION = 3;
const CHANCELLERY_PAGE_WIDTH = 794;
const CHANCELLERY_PAGE_HEIGHT = 1123;

const CHANCELLERY_DOCUMENT_ELEMENT_TYPES = Object.freeze([
    'text',
    'mergeField',
    'inputText',
    'inputLong',
    'inputChoice',
    'table',
    'shape',
    'image'
]);

const CHANCELLERY_DOCUMENT_SECTION_TYPES = Object.freeze([
    'title',
    'paragraph',
    'courseLabel',
    'examOptions',
    'description'
]);

const CHANCELLERY_MERGE_FIELD_ALIASES = Object.freeze({
    full_name: 'name',
    english_name: 'nameEn',
    institutional_email: 'email',
    student_id: 'studentId',
    faculty_school: 'faculty',
    personal_number: 'personalNumber',
    national_id: 'nationalId',
    phone: 'phone',
    program: 'program',
    cohort: 'cohort',
    semester: 'semester',
    student_status: 'status',
    department: 'department',
    campus: 'campus',
    biography: 'bio'
});

const CHANCELLERY_SYNTHETIC_MERGE_FIELDS = Object.freeze([
    { key: 'course', label: 'Course (selected subject)' },
    { key: 'courseCode', label: 'Course code (selected subject)' }
]);

function normalizeChancelleryDocumentFacultyCode(facultyCode = '') {
    return normalizeCode(facultyCode || 'ECON') || 'ECON';
}

function slugifyChancelleryDocumentToken(label = '', fallback = 'option') {
    const slug = String(label || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return slug || fallback;
}

function escapeChancelleryDocumentHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function resolveChancelleryMergeFieldKey(key = '') {
    const raw = String(key || '').trim();
    if (!raw) return '';
    return CHANCELLERY_MERGE_FIELD_ALIASES[raw] || raw;
}

function sanitizeChancelleryDocumentInlineStyle(style = '') {
    const allowed = new Set([
        'font-family', 'font-size', 'color', 'background-color', 'line-height',
        'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'text-align'
    ]);
    return String(style || '')
        .split(';')
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
            const colon = part.indexOf(':');
            if (colon < 0) return '';
            const prop = part.slice(0, colon).trim().toLowerCase();
            const val = part.slice(colon + 1).trim();
            if (!allowed.has(prop) || !val) return '';
            if (/url\s*\(|expression\s*\(|javascript:|@import/i.test(val)) return '';
            return `${prop}: ${val.slice(0, 120)}`;
        })
        .filter(Boolean)
        .join('; ');
}

function sanitizeChancelleryDocumentTextHtml(html = '') {
    let value = String(html || '');
    value = value.replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '');
    value = value.replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*\/?\s*>/gi, '');
    value = value.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    value = value.replace(/\sstyle\s*=\s*("([^"]*)"|'([^']*)')/gi, (_match, _quoted, dq, sq) => {
        const cleaned = sanitizeChancelleryDocumentInlineStyle(dq || sq || '');
        return cleaned ? ` style="${cleaned}"` : '';
    });
    value = value.replace(/<\/?(?!\/?(?:p|br|strong|b|em|i|u|span|div|font|ul|ol|li|table|thead|tbody|tr|td|th)\b)[a-z0-9-]+\b[^>]*>/gi, '');
    return value.trim();
}

function sanitizeChancelleryDocumentImageSrc(src = '') {
    const value = String(src || '').trim();
    if (!value) return '';
    if (/^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(value) && value.length <= 1_500_000) {
        return value.replace(/\s+/g, '');
    }
    if (/^https?:\/\//i.test(value) || value.startsWith('/') || value.startsWith('assets/')) {
        return value.slice(0, 2000);
    }
    return '';
}

function sanitizeChancelleryDocumentColor(value = '', fallback = '#111111') {
    const raw = String(value || '').trim();
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw)) return raw;
    if (/^rgba?\([\d\s.,%]+\)$/i.test(raw)) return raw;
    if (raw === 'transparent' || raw === 'none') return raw;
    return fallback;
}

function normalizeChancellerySizePercentArray(values, count) {
    const n = Math.max(1, Number(count) || 1);
    const source = Array.isArray(values) ? values.map(Number).filter((v) => Number.isFinite(v) && v > 0) : [];
    let arr = source.length === n ? source.slice(0, n) : Array.from({ length: n }, () => 100 / n);
    const sum = arr.reduce((total, value) => total + value, 0) || 1;
    return arr.map((value) => clampNumber((value / sum) * 100, 1, 100, 100 / n));
}

function normalizeChancelleryImageCrop(crop = {}) {
    const top = clampNumber(crop?.top, 0, 0.45, 0);
    const right = clampNumber(crop?.right, 0, 0.45, 0);
    const bottom = clampNumber(crop?.bottom, 0, 0.45, 0);
    const left = clampNumber(crop?.left, 0, 0.45, 0);
    return { top, right, bottom, left };
}

function buildChancelleryTableCells(rows, cols, existing = []) {
    const rowCount = clampNumber(rows, 1, 12, 1);
    const colCount = clampNumber(cols, 1, 12, 3);
    const source = Array.isArray(existing) ? existing : [];
    const cells = [];
    for (let r = 0; r < rowCount; r += 1) {
        const row = [];
        const sourceRow = Array.isArray(source[r]) ? source[r] : [];
        for (let c = 0; c < colCount; c += 1) {
            const cell = sourceRow[c] || {};
            const vAlign = String(cell.vAlign || '').trim();
            row.push({
                html: sanitizeChancelleryDocumentTextHtml(cell.html || cell.text || ''),
                fill: sanitizeChancelleryDocumentColor(cell.fill, 'transparent'),
                vAlign: ['top', 'middle', 'bottom'].includes(vAlign) ? vAlign : 'top',
                colspan: clampNumber(cell.colspan, 1, Math.max(1, colCount - c), 1),
                rowspan: clampNumber(cell.rowspan, 1, Math.max(1, rowCount - r), 1)
            });
        }
        cells.push(row);
    }
    return { rows: rowCount, cols: colCount, cells };
}

function clampNumber(value, min, max, fallback) {
    const num = Number(value);
    if (!Number.isFinite(num)) return fallback;
    return Math.min(max, Math.max(min, num));
}

function createChancelleryDocumentElementId(prefix = 'el') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeChancelleryDocumentExamOption(option = {}, index = 0) {
    const label = String(option?.label ?? option?.text ?? '').trim();
    if (!label) return null;
    const id = String(option?.id || option?.value || '').trim()
        || slugifyChancelleryDocumentToken(label, `option_${index + 1}`);
    return { id, label };
}

function normalizeChancelleryDocumentPage(page = {}) {
    return {
        width: clampNumber(page?.width, 320, 2000, CHANCELLERY_PAGE_WIDTH),
        height: clampNumber(page?.height, 480, 3000, CHANCELLERY_PAGE_HEIGHT)
    };
}

function normalizeChancelleryDocumentElement(element = {}, index = 0, page = normalizeChancelleryDocumentPage()) {
    const type = String(element?.type || '').trim();
    if (!CHANCELLERY_DOCUMENT_ELEMENT_TYPES.includes(type)) return null;
    const id = String(element?.id || '').trim() || createChancelleryDocumentElementId(`el_${type}_${index + 1}`);
    const defaultW = type === 'inputChoice' || type === 'table' ? 700 : (type === 'shape' || type === 'image' ? 240 : 360);
    const defaultH = type === 'inputLong' ? 160
        : (type === 'inputChoice' || type === 'table' ? 150
            : (type === 'shape' || type === 'image' ? 120 : 40));
    const w = clampNumber(element?.w, 40, page.width, defaultW);
    const h = clampNumber(element?.h, 24, page.height, defaultH);
    const x = clampNumber(element?.x, 0, Math.max(0, page.width - 20), 48);
    const y = clampNumber(element?.y, 0, Math.max(0, page.height - 20), 48 + index * 48);
    const z = clampNumber(element?.z, 0, 10000, index + 1);
    const base = {
        id,
        type,
        x,
        y,
        w,
        h,
        z,
        locked: element?.locked === true
    };

    if (type === 'text') {
        const html = sanitizeChancelleryDocumentTextHtml(element?.html || element?.text || '');
        if (!html) return null;
        return {
            ...base,
            html,
            lineHeight: clampNumber(element?.lineHeight, 0.8, 3, 1.35),
            paragraphSpacingPt: clampNumber(element?.paragraphSpacingPt, 0, 48, 0)
        };
    }
    if (type === 'mergeField') {
        const fieldKey = resolveChancelleryMergeFieldKey(element?.fieldKey || element?.key || '');
        if (!fieldKey) return null;
        const label = String(element?.label || fieldKey).trim() || fieldKey;
        const underlineAlign = String(element?.underlineAlign || '').trim();
        return {
            ...base,
            fieldKey,
            label,
            underlineBlank: element?.underlineBlank === true,
            underlineLengthPct: clampNumber(element?.underlineLengthPct, 10, 100, 70),
            underlineAlign: ['start', 'center', 'end'].includes(underlineAlign) ? underlineAlign : 'end'
        };
    }
    if (type === 'inputText' || type === 'inputLong') {
        return {
            ...base,
            label: String(element?.label || (type === 'inputLong' ? 'Description' : 'Answer')).trim()
                || (type === 'inputLong' ? 'Description' : 'Answer'),
            placeholder: String(element?.placeholder || '').trim(),
            required: element?.required !== false
        };
    }
    if (type === 'table') {
        const grid = buildChancelleryTableCells(element?.rows, element?.cols, element?.cells);
        return {
            ...base,
            rows: grid.rows,
            cols: grid.cols,
            cells: grid.cells,
            colWidths: normalizeChancellerySizePercentArray(element?.colWidths, grid.cols),
            rowHeights: normalizeChancellerySizePercentArray(element?.rowHeights, grid.rows),
            borderWidth: clampNumber(element?.borderWidth, 0, 8, 1.5),
            borderColor: sanitizeChancelleryDocumentColor(element?.borderColor, '#111111'),
            innerBorderWidth: clampNumber(element?.innerBorderWidth, 0, 8, element?.borderWidth ?? 1.5),
            innerBorderColor: sanitizeChancelleryDocumentColor(element?.innerBorderColor, element?.borderColor || '#111111'),
            headerRow: element?.headerRow === true
        };
    }
    if (type === 'shape') {
        const kind = String(element?.shapeKind || element?.kind || '').trim();
        return {
            ...base,
            shapeKind: ['rect', 'oval', 'line'].includes(kind) ? kind : 'rect',
            cornerRadius: clampNumber(element?.cornerRadius, 0, 200, 0),
            rotation: clampNumber(element?.rotation, -360, 360, 0),
            opacity: clampNumber(element?.opacity, 0, 1, 1),
            strokeWidth: clampNumber(element?.strokeWidth, 0, 12, 1.5),
            strokeColor: sanitizeChancelleryDocumentColor(element?.strokeColor, '#111111'),
            fill: sanitizeChancelleryDocumentColor(element?.fill, 'transparent')
        };
    }
    if (type === 'image') {
        const src = sanitizeChancelleryDocumentImageSrc(element?.src || element?.url || '');
        const fit = String(element?.objectFit || '').trim();
        return {
            ...base,
            src,
            alt: String(element?.alt || '').trim().slice(0, 200),
            objectFit: ['contain', 'cover', 'fill'].includes(fit) ? fit : 'contain',
            crop: normalizeChancelleryImageCrop(element?.crop),
            rotation: clampNumber(element?.rotation, -360, 360, 0),
            opacity: clampNumber(element?.opacity, 0, 1, 1)
        };
    }
    const options = asArray(element?.options)
        .map((option, optionIndex) => normalizeChancelleryDocumentExamOption(option, optionIndex))
        .filter(Boolean);
    return {
        ...base,
        label: String(element?.label || '').trim(),
        mode: String(element?.mode || '').trim() === 'multi' ? 'multi' : 'single',
        layout: String(element?.layout || '').trim() === 'stack' ? 'stack' : 'columns',
        options: options.length ? options : [
            { id: 'option_1', label: 'Option 1' },
            { id: 'option_2', label: 'Option 2' }
        ],
        required: element?.required !== false
    };
}

function buildDefaultChancelleryDocumentElements() {
    let y = 48;
    const gap = 16;
    const elements = [];
    const push = (partial) => {
        const el = { id: createChancelleryDocumentElementId(partial.type), z: elements.length + 1, ...partial, y };
        elements.push(el);
        y += (partial.h || 40) + gap;
    };
    push({
        type: 'text',
        x: 48,
        w: 698,
        h: 64,
        html: '<strong>სსიპ ქუთაისის საერთაშორისო უნივერსიტეტის</strong><br>LEPL Kutaisi International University'
    });
    [
        ['faculty', 'სკოლის/School'],
        ['program', 'პროგრამა/Program'],
        ['nameEn', 'სახელი გვარი ინგლისურად'],
        ['name', 'სახელი გვარი ქართულად'],
        ['personalNumber', 'პირადი ნომერი']
    ].forEach(([fieldKey, label]) => {
        push({ type: 'mergeField', x: 48, w: 698, h: 36, fieldKey, label });
    });
    push({
        type: 'text',
        x: 48,
        w: 698,
        h: 48,
        html: '<div style="text-align:center"><strong>განცხადება აპელაციის თაობაზე / Appeal Request</strong></div>'
    });
    push({ type: 'mergeField', x: 48, w: 698, h: 36, fieldKey: 'course', label: 'საგანი/Course:' });
    push({
        type: 'inputChoice',
        x: 48,
        w: 698,
        h: 150,
        label: '',
        mode: 'single',
        layout: 'columns',
        options: [
            { id: 'midterm', label: 'შუალედური გამოცდა Midterm Exam' },
            { id: 'final', label: 'დასკვნითი გამოცდა Final Exam' },
            { id: 'retake', label: 'დამატებითი გამოცდა Retake exam' }
        ],
        required: true
    });
    push({
        type: 'text',
        x: 48,
        w: 698,
        h: 88,
        html: '<div style="font-size:0.92em"><strong>შეფასების გასაჩივრების შესახებ მოკლე აღწერილობა/Brief description on the assessment appeal:</strong><br>გთხოვთ, სააპელაციო განაცხადის შევსებისას აუცილებლად მიუთითოთ საკითხი ან ნომერი, რომლის შეფასებასაც ასაჩივრებთ, ასევე დაურთოთ მოკლე განმარტება, რატომ მიიჩნევთ, რომ შეფასება საჭიროებს გადახედვას.</div>'
    });
    push({
        type: 'inputLong',
        x: 48,
        w: 698,
        h: 200,
        label: '',
        placeholder: '',
        required: true
    });
    return elements;
}

function buildDefaultChancelleryDocumentTemplate() {
    return {
        version: CHANCELLERY_DOCUMENT_VERSION,
        page: { width: CHANCELLERY_PAGE_WIDTH, height: CHANCELLERY_PAGE_HEIGHT },
        elements: buildDefaultChancelleryDocumentElements(),
        submitLabel: 'გაგზავნა'
    };
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
        const options = asArray(section?.options)
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

function migrateChancelleryDocumentTemplateV1ToElements(template = {}) {
    const letterhead = template.letterhead || {};
    const sections = asArray(template.sections)
        .map((section, index) => normalizeChancelleryDocumentSection(section, index))
        .filter(Boolean);
    let y = 48;
    const elements = [];
    const push = (partial) => {
        elements.push({
            id: createChancelleryDocumentElementId(partial.type),
            z: elements.length + 1,
            x: 48,
            w: 698,
            ...partial,
            y
        });
        y += (partial.h || 40) + 16;
    };
    const institutionKa = String(letterhead.institutionKa || 'სსიპ ქუთაისის საერთაშორისო უნივერსიტეტის').trim();
    const institutionEn = String(letterhead.institutionEn || 'LEPL Kutaisi International University').trim();
    push({
        type: 'text',
        h: 64,
        html: `<strong>${escapeChancelleryDocumentHtml(institutionKa)}</strong><br>${escapeChancelleryDocumentHtml(institutionEn)}`
    });
    [
        ['faculty', letterhead.schoolLabel || 'სკოლის/School'],
        ['program', letterhead.programLabel || 'პროგრამა/Program'],
        ['nameEn', letterhead.nameEnLabel || 'სახელი გვარი ინგლისურად'],
        ['name', letterhead.nameKaLabel || 'სახელი გვარი ქართულად'],
        ['personalNumber', letterhead.personalNumberLabel || 'პირადი ნომერი']
    ].forEach(([fieldKey, label]) => {
        push({ type: 'mergeField', h: 36, fieldKey, label: String(label).trim() });
    });
    if (!sections.length) return buildDefaultChancelleryDocumentElements();
    sections.forEach((section) => {
        if (section.type === 'title') {
            push({
                type: 'text',
                h: 48,
                html: `<div style="text-align:center"><strong>${escapeChancelleryDocumentHtml(section.text)}</strong></div>`
            });
            return;
        }
        if (section.type === 'paragraph') {
            push({ type: 'text', h: 48, html: escapeChancelleryDocumentHtml(section.text) });
            return;
        }
        if (section.type === 'courseLabel') {
            push({ type: 'mergeField', h: 36, fieldKey: 'course', label: section.label });
            return;
        }
        if (section.type === 'examOptions') {
            push({
                type: 'inputChoice',
                h: 150,
                label: '',
                mode: 'single',
                layout: 'columns',
                options: section.options,
                required: true
            });
            return;
        }
        if (section.type === 'description') {
            if (section.label) {
                push({
                    type: 'text',
                    h: 72,
                    html: `<div style="font-size:0.92em"><strong>${escapeChancelleryDocumentHtml(section.label)}</strong></div>`
                });
            }
            push({
                type: 'inputLong',
                h: 200,
                label: '',
                placeholder: section.placeholder || '',
                required: true
            });
        }
    });
    return elements;
}

function migrateChancelleryDocumentTemplateV2BodyHtmlToElements(bodyHtml = '') {
    const html = String(bodyHtml || '');
    if (!html.trim()) return buildDefaultChancelleryDocumentElements();
    let y = 48;
    const elements = [];
    const push = (partial) => {
        elements.push({
            id: createChancelleryDocumentElementId(partial.type),
            z: elements.length + 1,
            x: 48,
            w: 698,
            ...partial,
            y
        });
        y += (partial.h || 40) + 16;
    };

    const chipRe = /data-field-key\s*=\s*["']([^"']+)["'][^>]*data-field-label\s*=\s*["']([^"']*)["']/gi;
    const chipReAlt = /data-field-label\s*=\s*["']([^"']*)["'][^>]*data-field-key\s*=\s*["']([^"']+)["']/gi;
    const chips = [];
    let match;
    while ((match = chipRe.exec(html))) {
        chips.push({ fieldKey: match[1], label: match[2] || match[1] });
    }
    while ((match = chipReAlt.exec(html))) {
        chips.push({ fieldKey: match[2], label: match[1] || match[2] });
    }
    const seen = new Set();
    chips.forEach((chip) => {
        const fieldKey = resolveChancelleryMergeFieldKey(chip.fieldKey);
        if (!fieldKey || seen.has(fieldKey)) return;
        seen.add(fieldKey);
        push({ type: 'mergeField', h: 36, fieldKey, label: chip.label || fieldKey });
    });

    if (/data-student-input\s*=\s*["']examOptions["']/i.test(html)) {
        const optionLabels = [];
        const optionRe = /data-doc-exam-option\s*=\s*["']([^"']+)["'][\s\S]*?(?:data-doc-exam-label[^>]*>|chancellery-doc-exam-label[^>]*>)([^<]+)/gi;
        let optionMatch;
        while ((optionMatch = optionRe.exec(html))) {
            optionLabels.push({
                id: optionMatch[1],
                label: String(optionMatch[2] || '').trim() || optionMatch[1]
            });
        }
        push({
            type: 'inputChoice',
            h: 150,
            label: '',
            mode: 'single',
            layout: 'columns',
            options: optionLabels.length ? optionLabels : [
                { id: 'midterm', label: 'Midterm Exam' },
                { id: 'final', label: 'Final Exam' }
            ],
            required: true
        });
    }

    if (/data-student-input\s*=\s*["'](description|text)["']/i.test(html)) {
        const labelMatch = html.match(/data-input-label\s*=\s*["']([^"']*)["']/i);
        push({
            type: /data-student-input\s*=\s*["']text["']/i.test(html) ? 'inputText' : 'inputLong',
            h: /data-student-input\s*=\s*["']text["']/i.test(html) ? 72 : 200,
            label: labelMatch?.[1] || 'Description',
            placeholder: '',
            required: true
        });
    }

    if (!elements.some((el) => el.type === 'text')) {
        push({
            type: 'text',
            h: 48,
            html: '<strong>განცხადება აპელაციის თაობაზე / Appeal Request</strong>'
        });
    }

    if (!elements.some((el) => el.type === 'inputLong' || el.type === 'inputText')) {
        push({
            type: 'inputLong',
            h: 200,
            label: 'Description',
            placeholder: '',
            required: true
        });
    }

    return elements.length ? elements : buildDefaultChancelleryDocumentElements();
}

function templateHasStudentInput(elements = []) {
    return asArray(elements).some((el) => ['inputText', 'inputLong', 'inputChoice'].includes(el?.type));
}

function normalizeChancelleryDocumentTemplate(template = null) {
    const defaults = buildDefaultChancelleryDocumentTemplate();
    if (template == null || typeof template !== 'object') {
        return clone(defaults);
    }
    const version = Number(template.version || 0);
    const page = normalizeChancelleryDocumentPage(template.page || defaults.page);
    let elements = asArray(template.elements)
        .map((element, index) => normalizeChancelleryDocumentElement(element, index, page))
        .filter(Boolean);

    if (!elements.length) {
        if (asArray(template.sections).length || template.letterhead) {
            elements = migrateChancelleryDocumentTemplateV1ToElements(template)
                .map((element, index) => normalizeChancelleryDocumentElement(element, index, page))
                .filter(Boolean);
        } else if (String(template.bodyHtml || '').trim() || version === 2) {
            elements = migrateChancelleryDocumentTemplateV2BodyHtmlToElements(template.bodyHtml)
                .map((element, index) => normalizeChancelleryDocumentElement(element, index, page))
                .filter(Boolean);
        } else {
            elements = clone(defaults.elements);
        }
    }

    if (!templateHasStudentInput(elements)) {
        elements = [
            ...elements,
            normalizeChancelleryDocumentElement({
                type: 'inputLong',
                x: 48,
                y: Math.min(page.height - 220, 48 + elements.length * 48),
                w: 698,
                h: 200,
                label: 'Description',
                required: true
            }, elements.length, page)
        ].filter(Boolean);
    }

    const seen = new Set();
    const deduped = [];
    elements.forEach((element) => {
        if (seen.has(element.id)) return;
        seen.add(element.id);
        deduped.push(element);
    });

    return {
        version: CHANCELLERY_DOCUMENT_VERSION,
        page,
        elements: deduped.length ? deduped : clone(defaults.elements),
        submitLabel: String(template.submitLabel || defaults.submitLabel).trim() || defaults.submitLabel
    };
}

module.exports = {
    CHANCELLERY_DOCUMENT_VERSION,
    CHANCELLERY_PAGE_WIDTH,
    CHANCELLERY_PAGE_HEIGHT,
    CHANCELLERY_DOCUMENT_ELEMENT_TYPES,
    CHANCELLERY_DOCUMENT_SECTION_TYPES,
    CHANCELLERY_MERGE_FIELD_ALIASES,
    CHANCELLERY_SYNTHETIC_MERGE_FIELDS,
    buildDefaultChancelleryDocumentTemplate,
    buildDefaultChancelleryDocumentElements,
    createChancelleryDocumentElementId,
    migrateChancelleryDocumentTemplateV1ToElements,
    migrateChancelleryDocumentTemplateV2BodyHtmlToElements,
    normalizeChancelleryDocumentFacultyCode,
    normalizeChancelleryDocumentPage,
    normalizeChancelleryDocumentElement,
    normalizeChancelleryDocumentExamOption,
    normalizeChancelleryDocumentSection,
    normalizeChancelleryDocumentTemplate,
    resolveChancelleryMergeFieldKey,
    sanitizeChancelleryDocumentTextHtml,
    sanitizeChancelleryDocumentImageSrc,
    sanitizeChancelleryDocumentColor,
    buildChancelleryTableCells,
    slugifyChancelleryDocumentToken,
    escapeChancelleryDocumentHtml,
    templateHasStudentInput
};
