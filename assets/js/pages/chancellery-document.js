const CHANCELLERY_DOCUMENT_VERSION = 3;
const CHANCELLERY_PAGE_WIDTH = 794;
const CHANCELLERY_PAGE_HEIGHT = 1123;
const CHANCELLERY_DOCUMENT_ELEMENT_TYPES = Object.freeze([
    'text', 'mergeField', 'inputText', 'inputLong', 'inputChoice', 'table', 'shape', 'image'
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

const CHANCELLERY_DEFAULT_BLUEPRINT_FIELDS = Object.freeze([
    { key: 'name', label: 'Full name' },
    { key: 'nameEn', label: 'English name' },
    { key: 'studentId', label: 'Student ID' },
    { key: 'email', label: 'Institutional email' },
    { key: 'phone', label: 'Phone' },
    { key: 'program', label: 'Program' },
    { key: 'cohort', label: 'Cohort' },
    { key: 'semester', label: 'Semester' },
    { key: 'status', label: 'Status' },
    { key: 'faculty', label: 'Faculty / School' },
    { key: 'personalNumber', label: 'Personal number' }
]);

const CHANCELLERY_LAYOUT_PAGE_MARGIN = 48;
const CHANCELLERY_LAYOUT_SNAP_THRESHOLD = 6;
const CHANCELLERY_LAYOUT_TIDY_GAP = 16;

let chancelleryDocumentEditorDirty = false;
let chancelleryDocumentEditorDraft = null;
let chancelleryDocumentEditorSaveInFlight = false;
let chancelleryDocumentEditorPreviewFill = false;
let chancelleryDocumentSelectedId = '';
let chancelleryDocumentSelectedIds = [];
let chancelleryAppealPendingSubjectKey = '';
let chancelleryCanvasDragState = null;
let chancelleryLayoutTidyGap = CHANCELLERY_LAYOUT_TIDY_GAP;
let chancelleryDocumentSavedFormatRange = null;
let chancelleryActiveTableCell = null;
let chancelleryTableSelection = null;

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

function resolveChancelleryMergeFieldKey(key = '') {
    const raw = String(key || '').trim();
    if (!raw) return '';
    return CHANCELLERY_MERGE_FIELD_ALIASES[raw] || raw;
}

function createChancelleryDocumentElementId(prefix = 'el') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function clampChancelleryNumber(value, min, max, fallback) {
    const num = Number(value);
    if (!Number.isFinite(num)) return fallback;
    return Math.min(max, Math.max(min, num));
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
    return arr.map((value) => clampChancelleryNumber((value / sum) * 100, 1, 100, 100 / n));
}

function normalizeChancelleryImageCrop(crop = {}) {
    const top = clampChancelleryNumber(crop?.top, 0, 0.45, 0);
    const right = clampChancelleryNumber(crop?.right, 0, 0.45, 0);
    const bottom = clampChancelleryNumber(crop?.bottom, 0, 0.45, 0);
    const left = clampChancelleryNumber(crop?.left, 0, 0.45, 0);
    return { top, right, bottom, left };
}

function buildChancelleryTableCells(rows, cols, existing = []) {
    const rowCount = clampChancelleryNumber(rows, 1, 12, 1);
    const colCount = clampChancelleryNumber(cols, 1, 12, 3);
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
                colspan: clampChancelleryNumber(cell.colspan, 1, Math.max(1, colCount - c), 1),
                rowspan: clampChancelleryNumber(cell.rowspan, 1, Math.max(1, rowCount - r), 1)
            });
        }
        cells.push(row);
    }
    return { rows: rowCount, cols: colCount, cells };
}

function createEmptyChancelleryTableCell() {
    return { html: '', fill: 'transparent', vAlign: 'top', colspan: 1, rowspan: 1 };
}

function getChancelleryTableCoveredSet(element) {
    const covered = new Set();
    const cells = element?.cells || [];
    cells.forEach((row, r) => {
        (row || []).forEach((cell, c) => {
            if (!cell || covered.has(`${r}:${c}`)) return;
            const cs = Math.max(1, Number(cell.colspan) || 1);
            const rs = Math.max(1, Number(cell.rowspan) || 1);
            for (let rr = r; rr < r + rs; rr += 1) {
                for (let cc = c; cc < c + cs; cc += 1) {
                    if (rr === r && cc === c) continue;
                    covered.add(`${rr}:${cc}`);
                }
            }
        });
    });
    return covered;
}

function getActiveChancelleryTableContext() {
    const active = chancelleryActiveTableCell;
    if (!active || !chancelleryDocumentEditorDraft) return null;
    const element = (chancelleryDocumentEditorDraft.elements || []).find((item) => item.id === active.boxId);
    if (!element || element.type !== 'table') return null;
    const row = Number(active.row);
    const col = Number(active.col);
    const cell = element.cells?.[row]?.[col];
    if (!cell) return null;
    return { element, row, col, cell };
}

function mutateActiveChancelleryTable(mutator) {
    syncChancelleryDocumentEditorDraftFromDom();
    const ctx = getActiveChancelleryTableContext();
    if (!ctx) {
        alert('Click a table cell first.');
        return false;
    }
    const ok = mutator(ctx);
    if (ok === false) return false;
    const grid = buildChancelleryTableCells(ctx.element.rows, ctx.element.cols, ctx.element.cells);
    ctx.element.rows = grid.rows;
    ctx.element.cols = grid.cols;
    ctx.element.cells = grid.cells;
    ctx.element.colWidths = normalizeChancellerySizePercentArray(ctx.element.colWidths, grid.cols);
    ctx.element.rowHeights = normalizeChancellerySizePercentArray(ctx.element.rowHeights, grid.rows);
    const maxRow = grid.rows - 1;
    const maxCol = grid.cols - 1;
    chancelleryActiveTableCell = {
        boxId: ctx.element.id,
        row: Math.min(ctx.row, maxRow),
        col: Math.min(ctx.col, maxCol)
    };
    setChancelleryDocumentSelection([ctx.element.id]);
    markChancelleryDocumentEditorDirty();
    refreshChancelleryDocumentEditorModal();
    requestAnimationFrame(() => {
        const overlay = document.getElementById('chancellery-document-editor-overlay');
        const cell = overlay?.querySelector(
            `[data-doc-box="${ctx.element.id}"] [data-doc-table-row="${chancelleryActiveTableCell.row}"][data-doc-table-col="${chancelleryActiveTableCell.col}"]`
        );
        if (cell) focusChancelleryDocumentTableCell(cell);
    });
    return true;
}

function insertChancelleryTableRow(where = 'below') {
    return mutateActiveChancelleryTable((ctx) => {
        const { element, row } = ctx;
        if ((element.rows || 0) >= 12) {
            alert('Maximum 12 rows.');
            return false;
        }
        const insertAt = where === 'above' ? row : row + 1;
        const newRow = Array.from({ length: element.cols }, () => createEmptyChancelleryTableCell());
        element.cells.splice(insertAt, 0, newRow);
        element.rows = (element.rows || 0) + 1;
        const heights = Array.isArray(element.rowHeights) ? [...element.rowHeights] : [];
        heights.splice(insertAt, 0, 100 / Math.max(1, element.rows));
        element.rowHeights = normalizeChancellerySizePercentArray(heights, element.rows);
        ctx.row = insertAt;
        return true;
    });
}

function deleteChancelleryTableRow() {
    return mutateActiveChancelleryTable((ctx) => {
        const { element, row } = ctx;
        if ((element.rows || 0) <= 1) {
            alert('Keep at least one row.');
            return false;
        }
        element.cells.splice(row, 1);
        element.rows -= 1;
        const heights = Array.isArray(element.rowHeights) ? [...element.rowHeights] : [];
        heights.splice(row, 1);
        element.rowHeights = normalizeChancellerySizePercentArray(heights, element.rows);
        ctx.row = Math.min(row, element.rows - 1);
        return true;
    });
}

function insertChancelleryTableCol(where = 'right') {
    return mutateActiveChancelleryTable((ctx) => {
        const { element, col } = ctx;
        if ((element.cols || 0) >= 12) {
            alert('Maximum 12 columns.');
            return false;
        }
        const insertAt = where === 'left' ? col : col + 1;
        (element.cells || []).forEach((row) => {
            row.splice(insertAt, 0, createEmptyChancelleryTableCell());
        });
        element.cols = (element.cols || 0) + 1;
        const widths = Array.isArray(element.colWidths) ? [...element.colWidths] : [];
        widths.splice(insertAt, 0, 100 / Math.max(1, element.cols));
        element.colWidths = normalizeChancellerySizePercentArray(widths, element.cols);
        ctx.col = insertAt;
        return true;
    });
}

function deleteChancelleryTableCol() {
    return mutateActiveChancelleryTable((ctx) => {
        const { element, col } = ctx;
        if ((element.cols || 0) <= 1) {
            alert('Keep at least one column.');
            return false;
        }
        (element.cells || []).forEach((row) => {
            row.splice(col, 1);
        });
        element.cols -= 1;
        const widths = Array.isArray(element.colWidths) ? [...element.colWidths] : [];
        widths.splice(col, 1);
        element.colWidths = normalizeChancellerySizePercentArray(widths, element.cols);
        ctx.col = Math.min(col, element.cols - 1);
        return true;
    });
}

function mergeChancelleryTableCellRight() {
    return mutateActiveChancelleryTable(({ element, row, col, cell }) => {
        const covered = getChancelleryTableCoveredSet(element);
        if (covered.has(`${row}:${col}`)) {
            alert('Select the main cell of a merge, not a covered cell.');
            return false;
        }
        const span = Math.max(1, Number(cell.colspan) || 1);
        const nextCol = col + span;
        if (nextCol >= element.cols) {
            alert('No cell to the right to merge.');
            return false;
        }
        if (covered.has(`${row}:${nextCol}`)) {
            alert('Cannot merge into a covered cell.');
            return false;
        }
        const next = element.cells[row][nextCol];
        const nextSpan = Math.max(1, Number(next?.colspan) || 1);
        cell.html = [cell.html || '', next?.html || ''].filter(Boolean).join('<br>');
        cell.colspan = span + nextSpan;
        for (let c = nextCol; c < nextCol + nextSpan; c += 1) {
            element.cells[row][c] = createEmptyChancelleryTableCell();
        }
        return true;
    });
}

function splitChancelleryTableCell() {
    return mutateActiveChancelleryTable(({ cell }) => {
        if ((Number(cell.colspan) || 1) <= 1 && (Number(cell.rowspan) || 1) <= 1) {
            alert('This cell is not merged.');
            return false;
        }
        cell.colspan = 1;
        cell.rowspan = 1;
        return true;
    });
}

function getChancelleryTableSelectionBounds() {
    const sel = chancelleryTableSelection;
    if (!sel || !chancelleryDocumentEditorDraft) return null;
    const element = (chancelleryDocumentEditorDraft.elements || []).find((item) => item.id === sel.boxId);
    if (!element || element.type !== 'table') return null;
    const r0 = Math.min(sel.r0, sel.r1);
    const r1 = Math.max(sel.r0, sel.r1);
    const c0 = Math.min(sel.c0, sel.c1);
    const c1 = Math.max(sel.c0, sel.c1);
    return { element, r0, r1, c0, c1 };
}

function setChancelleryTableCellSelection(boxId, row, col, { extend = false } = {}) {
    if (extend && chancelleryTableSelection && chancelleryTableSelection.boxId === boxId) {
        chancelleryTableSelection = {
            ...chancelleryTableSelection,
            r1: row,
            c1: col
        };
    } else {
        chancelleryTableSelection = { boxId, r0: row, c0: col, r1: row, c1: col };
    }
    chancelleryActiveTableCell = { boxId, row, col };
}

function isChancelleryTableCellInSelection(boxId, row, col) {
    if (!chancelleryTableSelection || chancelleryTableSelection.boxId !== boxId) return false;
    const r0 = Math.min(chancelleryTableSelection.r0, chancelleryTableSelection.r1);
    const r1 = Math.max(chancelleryTableSelection.r0, chancelleryTableSelection.r1);
    const c0 = Math.min(chancelleryTableSelection.c0, chancelleryTableSelection.c1);
    const c1 = Math.max(chancelleryTableSelection.c0, chancelleryTableSelection.c1);
    return row >= r0 && row <= r1 && col >= c0 && col <= c1;
}

function mergeChancelleryTableSelection() {
    const bounds = getChancelleryTableSelectionBounds();
    if (!bounds) {
        alert('Shift-click cells to select a rectangle, then merge.');
        return false;
    }
    const { element, r0, r1, c0, c1 } = bounds;
    if (r0 === r1 && c0 === c1) {
        alert('Select more than one cell to merge.');
        return false;
    }
    return mutateActiveChancelleryTable((ctx) => {
        if (ctx.element.id !== element.id) return false;
        const covered = getChancelleryTableCoveredSet(element);
        for (let r = r0; r <= r1; r += 1) {
            for (let c = c0; c <= c1; c += 1) {
                const cell = element.cells[r]?.[c];
                if (!cell) return false;
                if (covered.has(`${r}:${c}`)) {
                    alert('Selection includes covered cells from another merge. Split those first.');
                    return false;
                }
                const cs = Math.max(1, Number(cell.colspan) || 1);
                const rs = Math.max(1, Number(cell.rowspan) || 1);
                if (r + rs - 1 > r1 || c + cs - 1 > c1) {
                    alert('Selection must fully contain any already-merged cells.');
                    return false;
                }
            }
        }
        const anchor = element.cells[r0][c0];
        const parts = [];
        for (let r = r0; r <= r1; r += 1) {
            for (let c = c0; c <= c1; c += 1) {
                if (r === r0 && c === c0) continue;
                const html = element.cells[r][c]?.html || '';
                if (html) parts.push(html);
                element.cells[r][c] = createEmptyChancelleryTableCell();
            }
        }
        if (parts.length) {
            anchor.html = [anchor.html || '', ...parts].filter(Boolean).join('<br>');
        }
        anchor.colspan = c1 - c0 + 1;
        anchor.rowspan = r1 - r0 + 1;
        ctx.row = r0;
        ctx.col = c0;
        chancelleryTableSelection = { boxId: element.id, r0, c0, r1: r0, c1: c0 };
        return true;
    });
}

function distributeChancelleryTableColumns() {
    return mutateActiveChancelleryTable(({ element }) => {
        element.colWidths = normalizeChancellerySizePercentArray([], element.cols);
        return true;
    });
}

function distributeChancelleryTableRows() {
    return mutateActiveChancelleryTable(({ element }) => {
        element.rowHeights = normalizeChancellerySizePercentArray([], element.rows);
        return true;
    });
}

function duplicateChancelleryDocumentBox(elementId = '') {
    syncChancelleryDocumentEditorDraftFromDom();
    const draft = chancelleryDocumentEditorDraft;
    if (!draft) return false;
    const source = (draft.elements || []).find((item) => item.id === (elementId || chancelleryDocumentSelectedId));
    if (!source) {
        alert('Select a box to duplicate.');
        return false;
    }
    const page = draft.page || normalizeChancelleryDocumentPage();
    const maxZ = (draft.elements || []).reduce((max, item) => Math.max(max, Number(item.z) || 0), 0);
    const clone = JSON.parse(JSON.stringify(source));
    clone.id = createChancelleryDocumentElementId(source.type);
    clone.x = clampChancelleryNumber(source.x + 16, 0, page.width - 20, source.x);
    clone.y = clampChancelleryNumber(source.y + 16, 0, page.height - 20, source.y);
    clone.z = maxZ + 1;
    clone.locked = false;
    draft.elements.push(normalizeChancelleryDocumentElement(clone, draft.elements.length, page) || clone);
    setChancelleryDocumentSelection([clone.id]);
    markChancelleryDocumentEditorDirty();
    refreshChancelleryDocumentEditorModal();
    return true;
}

function toggleChancelleryDocumentBoxLock(elementId = '') {
    syncChancelleryDocumentEditorDraftFromDom();
    const element = (chancelleryDocumentEditorDraft?.elements || [])
        .find((item) => item.id === (elementId || chancelleryDocumentSelectedId));
    if (!element) return false;
    element.locked = !element.locked;
    markChancelleryDocumentEditorDirty();
    refreshChancelleryDocumentEditorModal();
    return true;
}

function nudgeChancelleryDocumentBoxZ(direction = 'forward', elementId = '') {
    syncChancelleryDocumentEditorDraftFromDom();
    const elements = chancelleryDocumentEditorDraft?.elements || [];
    const element = elements.find((item) => item.id === (elementId || chancelleryDocumentSelectedId));
    if (!element) return false;
    const sorted = [...elements].sort((a, b) => (a.z - b.z) || String(a.id).localeCompare(String(b.id)));
    const index = sorted.findIndex((item) => item.id === element.id);
    if (index < 0) return false;
    const swapWith = direction === 'backward' ? sorted[index - 1] : sorted[index + 1];
    if (!swapWith) return false;
    const tmp = element.z;
    element.z = swapWith.z;
    swapWith.z = tmp;
    markChancelleryDocumentEditorDirty();
    refreshChancelleryDocumentEditorModal();
    return true;
}

function centerChancelleryDocumentBoxOnPage(elementId = '') {
    syncChancelleryDocumentEditorDraftFromDom();
    const draft = chancelleryDocumentEditorDraft;
    const element = (draft?.elements || []).find((item) => item.id === (elementId || chancelleryDocumentSelectedId));
    if (!element || !draft) return false;
    const page = draft.page || normalizeChancelleryDocumentPage();
    element.x = clampChancelleryNumber((page.width - element.w) / 2, 0, page.width - 20, element.x);
    element.y = clampChancelleryNumber((page.height - element.h) / 2, 0, page.height - 20, element.y);
    markChancelleryDocumentEditorDirty();
    refreshChancelleryDocumentEditorModal();
    return true;
}

function renderChancelleryDocArrangeChrome(element) {
    if (!element) return '';
    return `<div class="chancellery-doc-arrange" role="group" aria-label="Arrange">
        <div class="chancellery-doc-muted">Arrange</div>
        <div class="chancellery-doc-table-actions">
            <button type="button" class="lux-secondary-btn" data-lux-skip-modern-button="true" data-chancellery-doc-action="duplicate-box" data-doc-box-id="${escapeChancelleryDocumentHtml(element.id)}"><i class="fas fa-clone"></i> Duplicate</button>
            <button type="button" class="lux-secondary-btn" data-lux-skip-modern-button="true" data-chancellery-doc-action="toggle-lock" data-doc-box-id="${escapeChancelleryDocumentHtml(element.id)}"><i class="fas fa-${element.locked ? 'lock' : 'lock-open'}"></i> ${element.locked ? 'Unlock' : 'Lock'}</button>
            <button type="button" class="lux-secondary-btn" data-lux-skip-modern-button="true" data-chancellery-doc-action="bring-forward" data-doc-box-id="${escapeChancelleryDocumentHtml(element.id)}"><i class="fas fa-arrow-up"></i> Forward</button>
            <button type="button" class="lux-secondary-btn" data-lux-skip-modern-button="true" data-chancellery-doc-action="send-backward" data-doc-box-id="${escapeChancelleryDocumentHtml(element.id)}"><i class="fas fa-arrow-down"></i> Backward</button>
            <button type="button" class="lux-secondary-btn" data-lux-skip-modern-button="true" data-chancellery-doc-action="center-on-page" data-doc-box-id="${escapeChancelleryDocumentHtml(element.id)}"><i class="fas fa-compress-arrows-alt"></i> Center</button>
        </div>
    </div>`;
}

function normalizeChancelleryDocumentPage(page = {}) {
    return {
        width: clampChancelleryNumber(page?.width, 320, 2000, CHANCELLERY_PAGE_WIDTH),
        height: clampChancelleryNumber(page?.height, 480, 3000, CHANCELLERY_PAGE_HEIGHT)
    };
}

function normalizeChancelleryDocumentOption(option = {}, index = 0) {
    const label = String(option?.label ?? option?.text ?? '').trim();
    if (!label) return null;
    const id = String(option?.id || option?.value || '').trim()
        || slugifyChancelleryDocumentToken(label, `option_${index + 1}`);
    return { id, label };
}

function normalizeChancelleryDocumentElement(element = {}, index = 0, page = normalizeChancelleryDocumentPage()) {
    const type = String(element?.type || '').trim();
    if (!CHANCELLERY_DOCUMENT_ELEMENT_TYPES.includes(type)) return null;
    const id = String(element?.id || '').trim() || createChancelleryDocumentElementId(`el_${type}_${index + 1}`);
    const defaultW = type === 'inputChoice' || type === 'table' ? 700 : (type === 'shape' || type === 'image' ? 240 : 360);
    const defaultH = type === 'inputLong' ? 160
        : (type === 'inputChoice' || type === 'table' ? 150
            : (type === 'shape' || type === 'image' ? 120 : 40));
    const w = clampChancelleryNumber(element?.w, 40, page.width, defaultW);
    const h = clampChancelleryNumber(element?.h, 24, page.height, defaultH);
    const x = clampChancelleryNumber(element?.x, 0, Math.max(0, page.width - 20), 48);
    const y = clampChancelleryNumber(element?.y, 0, Math.max(0, page.height - 20), 48 + index * 48);
    const z = clampChancelleryNumber(element?.z, 0, 10000, index + 1);
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
            lineHeight: clampChancelleryNumber(element?.lineHeight, 0.8, 3, 1.35),
            paragraphSpacingPt: clampChancelleryNumber(element?.paragraphSpacingPt, 0, 48, 0)
        };
    }
    if (type === 'mergeField') {
        const fieldKey = resolveChancelleryMergeFieldKey(element?.fieldKey || element?.key || '');
        if (!fieldKey) return null;
        const underlineAlign = String(element?.underlineAlign || '').trim();
        return {
            ...base,
            fieldKey,
            label: String(element?.label || fieldKey).trim() || fieldKey,
            underlineBlank: element?.underlineBlank === true,
            underlineLengthPct: clampChancelleryNumber(element?.underlineLengthPct, 10, 100, 70),
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
            borderWidth: clampChancelleryNumber(element?.borderWidth, 0, 8, 1.5),
            borderColor: sanitizeChancelleryDocumentColor(element?.borderColor, '#111111'),
            innerBorderWidth: clampChancelleryNumber(element?.innerBorderWidth, 0, 8, element?.borderWidth ?? 1.5),
            innerBorderColor: sanitizeChancelleryDocumentColor(element?.innerBorderColor, element?.borderColor || '#111111'),
            headerRow: element?.headerRow === true
        };
    }
    if (type === 'shape') {
        const kind = String(element?.shapeKind || element?.kind || '').trim();
        return {
            ...base,
            shapeKind: ['rect', 'oval', 'line'].includes(kind) ? kind : 'rect',
            cornerRadius: clampChancelleryNumber(element?.cornerRadius, 0, 200, 0),
            rotation: clampChancelleryNumber(element?.rotation, -360, 360, 0),
            opacity: clampChancelleryNumber(element?.opacity, 0, 1, 1),
            strokeWidth: clampChancelleryNumber(element?.strokeWidth, 0, 12, 1.5),
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
            rotation: clampChancelleryNumber(element?.rotation, -360, 360, 0),
            opacity: clampChancelleryNumber(element?.opacity, 0, 1, 1)
        };
    }
    const options = (Array.isArray(element?.options) ? element.options : [])
        .map((option, optionIndex) => normalizeChancelleryDocumentOption(option, optionIndex))
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
    const elements = [];
    const push = (partial) => {
        elements.push({
            id: createChancelleryDocumentElementId(partial.type),
            z: elements.length + 1,
            ...partial,
            y
        });
        y += (partial.h || 40) + 16;
    };
    push({
        type: 'text', x: 48, w: 698, h: 64,
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
        type: 'text', x: 48, w: 698, h: 48,
        html: '<div style="text-align:center"><strong>განცხადება აპელაციის თაობაზე / Appeal Request</strong></div>'
    });
    push({ type: 'mergeField', x: 48, w: 698, h: 36, fieldKey: 'course', label: 'საგანი/Course:' });
    push({
        type: 'inputChoice', x: 48, w: 698, h: 150, label: '', mode: 'single', layout: 'columns', required: true,
        options: [
            { id: 'midterm', label: 'შუალედური გამოცდა Midterm Exam' },
            { id: 'final', label: 'დასკვნითი გამოცდა Final Exam' },
            { id: 'retake', label: 'დამატებითი გამოცდა Retake exam' }
        ]
    });
    push({
        type: 'text', x: 48, w: 698, h: 88,
        html: '<div style="font-size:0.92em"><strong>შეფასების გასაჩივრების შესახებ მოკლე აღწერილობა/Brief description on the assessment appeal:</strong><br>გთხოვთ, სააპელაციო განაცხადის შევსებისას აუცილებლად მიუთითოთ საკითხი ან ნომერი, რომლის შეფასებასაც ასაჩივრებთ, ასევე დაურთოთ მოკლე განმარტება, რატომ მიიჩნევთ, რომ შეფასება საჭიროებს გადახედვას.</div>'
    });
    push({
        type: 'inputLong', x: 48, w: 698, h: 200, required: true, placeholder: '',
        label: ''
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

function migrateLegacyChancelleryDocumentToElements(template = {}) {
    if (Array.isArray(template.elements) && template.elements.length) {
        return template.elements;
    }
    if (Array.isArray(template.sections) && template.sections.length) {
        let y = 48;
        const elements = [];
        const push = (partial) => {
            elements.push({ id: createChancelleryDocumentElementId(partial.type), z: elements.length + 1, x: 48, w: 698, ...partial, y });
            y += (partial.h || 40) + 16;
        };
        const lh = template.letterhead || {};
        push({
            type: 'text', h: 64,
            html: `<strong>${escapeChancelleryDocumentHtml(lh.institutionKa || 'KIU')}</strong><br>${escapeChancelleryDocumentHtml(lh.institutionEn || 'Kutaisi International University')}`
        });
        [
            ['faculty', lh.schoolLabel || 'School'],
            ['program', lh.programLabel || 'Program'],
            ['nameEn', lh.nameEnLabel || 'Name EN'],
            ['name', lh.nameKaLabel || 'Name KA'],
            ['personalNumber', lh.personalNumberLabel || 'Personal number']
        ].forEach(([fieldKey, label]) => push({ type: 'mergeField', h: 36, fieldKey, label }));
        template.sections.forEach((section) => {
            const type = String(section?.type || '');
            if (type === 'title') push({ type: 'text', h: 48, html: `<div style="text-align:center"><strong>${escapeChancelleryDocumentHtml(section.text || '')}</strong></div>` });
            else if (type === 'paragraph') push({ type: 'text', h: 48, html: escapeChancelleryDocumentHtml(section.text || '') });
            else if (type === 'courseLabel') push({ type: 'mergeField', h: 36, fieldKey: 'course', label: section.label || 'Course' });
            else if (type === 'examOptions') {
                push({
                    type: 'inputChoice', h: 150, label: '', mode: 'single', layout: 'columns', required: true,
                    options: (section.options || []).map((opt, i) => normalizeChancelleryDocumentOption(opt, i)).filter(Boolean)
                });
            } else if (type === 'description') {
                if (section.label) {
                    push({
                        type: 'text', h: 72,
                        html: `<div style="font-size:0.92em"><strong>${escapeChancelleryDocumentHtml(section.label)}</strong></div>`
                    });
                }
                push({ type: 'inputLong', h: 200, label: '', placeholder: section.placeholder || '', required: true });
            }
        });
        return elements;
    }
    if (String(template.bodyHtml || '').trim()) {
        const html = String(template.bodyHtml);
        let y = 48;
        const elements = [];
        const push = (partial) => {
            elements.push({ id: createChancelleryDocumentElementId(partial.type), z: elements.length + 1, x: 48, w: 698, ...partial, y });
            y += (partial.h || 40) + 16;
        };
        const chipRe = /data-field-key\s*=\s*["']([^"']+)["'][^>]*data-field-label\s*=\s*["']([^"']*)["']/gi;
        let match;
        const seen = new Set();
        while ((match = chipRe.exec(html))) {
            const fieldKey = resolveChancelleryMergeFieldKey(match[1]);
            if (!fieldKey || seen.has(fieldKey)) continue;
            seen.add(fieldKey);
            push({ type: 'mergeField', h: 36, fieldKey, label: match[2] || fieldKey });
        }
        if (/data-student-input\s*=\s*["']examOptions["']/i.test(html)) {
            push({
                type: 'inputChoice', h: 150, label: '', mode: 'single', layout: 'columns', required: true,
                options: [
                    { id: 'midterm', label: 'Midterm Exam' },
                    { id: 'final', label: 'Final Exam' },
                    { id: 'retake', label: 'Retake exam' }
                ]
            });
        }
        if (/data-student-input\s*=\s*["'](description|text)["']/i.test(html)) {
            const labelMatch = html.match(/data-input-label\s*=\s*["']([^"']*)["']/i);
            push({
                type: /data-student-input\s*=\s*["']text["']/i.test(html) ? 'inputText' : 'inputLong',
                h: 200,
                label: labelMatch?.[1] || '',
                placeholder: '',
                required: true
            });
        }
        if (!elements.some((el) => el.type === 'inputLong' || el.type === 'inputText' || el.type === 'inputChoice')) {
            push({ type: 'inputLong', h: 200, label: 'Description', placeholder: '', required: true });
        }
        return elements.length ? elements : buildDefaultChancelleryDocumentElements();
    }
    return buildDefaultChancelleryDocumentElements();
}

function normalizeChancelleryDocumentTemplate(template = null) {
    const defaults = buildDefaultChancelleryDocumentTemplate();
    if (template == null || typeof template !== 'object') {
        return JSON.parse(JSON.stringify(defaults));
    }
    const page = normalizeChancelleryDocumentPage(template.page || defaults.page);
    let elements = (Array.isArray(template.elements) ? template.elements : [])
        .map((element, index) => normalizeChancelleryDocumentElement(element, index, page))
        .filter(Boolean);
    if (!elements.length) {
        elements = migrateLegacyChancelleryDocumentToElements(template)
            .map((element, index) => normalizeChancelleryDocumentElement(element, index, page))
            .filter(Boolean);
    }
    if (!elements.some((el) => ['inputText', 'inputLong', 'inputChoice'].includes(el.type))) {
        elements.push(normalizeChancelleryDocumentElement({
            type: 'inputLong', x: 48, y: Math.min(page.height - 220, 48 + elements.length * 48),
            w: 698, h: 200, label: 'Description', required: true
        }, elements.length, page));
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
        elements: deduped,
        submitLabel: String(template.submitLabel || defaults.submitLabel).trim() || defaults.submitLabel
    };
}

function getChancelleryDocumentTemplateCache() {
    if (!window.__kiuChancelleryDocumentTemplates) window.__kiuChancelleryDocumentTemplates = {};
    return window.__kiuChancelleryDocumentTemplates;
}

function matchesChancelleryLayoutDateRange(request, dateFrom, dateTo) {
    const stamp = String(request?.createdAt || request?.date || '').slice(0, 10);
    if (!stamp) return true;
    if (dateFrom && stamp < String(dateFrom).slice(0, 10)) return false;
    if (dateTo && stamp > String(dateTo).slice(0, 10)) return false;
    return true;
}

function getCachedChancelleryDocumentTemplate(faculty) {
    const facultyCode = String(faculty || (typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON')).trim() || 'ECON';
    const cached = getChancelleryDocumentTemplateCache()[facultyCode];
    return cached ? normalizeChancelleryDocumentTemplate(cached) : null;
}

function setCachedChancelleryDocumentTemplate(template, faculty) {
    const facultyCode = String(faculty || (typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON')).trim() || 'ECON';
    getChancelleryDocumentTemplateCache()[facultyCode] = normalizeChancelleryDocumentTemplate(template);
}

async function fetchChancelleryDocumentTemplate(faculty, options = {}) {
    const facultyCode = String(faculty || (typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON')).trim() || 'ECON';
    if (!options.force) {
        const cached = getCachedChancelleryDocumentTemplate(facultyCode);
        if (cached) return cached;
    }
    try {
        if (typeof kiuPortalFetch !== 'function') throw new Error('Portal API is unavailable.');
        const payload = await kiuPortalFetch(
            `/api/chancellery/document-template?facultyCode=${encodeURIComponent(facultyCode)}`
        );
        const template = normalizeChancelleryDocumentTemplate(payload?.documentTemplate || payload);
        setCachedChancelleryDocumentTemplate(template, facultyCode);
        return template;
    } catch (_error) {
        const fallback = normalizeChancelleryDocumentTemplate(buildDefaultChancelleryDocumentTemplate());
        setCachedChancelleryDocumentTemplate(fallback, facultyCode);
        return fallback;
    }
}

async function saveChancelleryDocumentTemplate(template, faculty) {
    const facultyCode = String(faculty || (typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON')).trim() || 'ECON';
    const documentTemplate = normalizeChancelleryDocumentTemplate(template);
    if (typeof kiuPortalFetch !== 'function') throw new Error('Portal API is unavailable.');
    const payload = await kiuPortalFetch('/api/chancellery/document-template', {
        method: 'POST',
        body: JSON.stringify({ facultyCode, documentTemplate })
    });
    const saved = normalizeChancelleryDocumentTemplate(payload?.documentTemplate || documentTemplate);
    setCachedChancelleryDocumentTemplate(saved, facultyCode);
    return saved;
}

function listChancelleryMergeFieldCatalog() {
    const fields = [];
    const seen = new Set();
    const pushField = (key, label) => {
        const resolved = resolveChancelleryMergeFieldKey(key);
        if (!resolved || seen.has(resolved)) return;
        seen.add(resolved);
        fields.push({ key: resolved, label: String(label || resolved).trim() || resolved });
    };
    const pushFieldsFromSchema = (schema) => {
        (Array.isArray(schema?.sections) ? schema.sections : []).forEach((section) => {
            (Array.isArray(section?.fields) ? section.fields : []).forEach((field) => {
                pushField(field.key, field.label || field.key);
            });
        });
    };

    if (typeof getAllStudentFormFields === 'function') {
        getAllStudentFormFields('student').forEach((field) => {
            pushField(field.key, field.label || field.key);
        });
    } else if (typeof getStudentFormSchema === 'function') {
        pushFieldsFromSchema(getStudentFormSchema('student'));
    } else {
        const blueprint = (typeof getStudentFormBlueprint === 'function'
            ? getStudentFormBlueprint()
            : null) || window.KIU_STATE?.studentFormBlueprint || null;
        if (blueprint?.schema) pushFieldsFromSchema(blueprint.schema);
        if (blueprint?.schemas && typeof blueprint.schemas === 'object') {
            Object.values(blueprint.schemas).forEach((schema) => pushFieldsFromSchema(schema));
        }
    }

    if (!fields.length) {
        CHANCELLERY_DEFAULT_BLUEPRINT_FIELDS.forEach((field) => pushField(field.key, field.label));
    }
    CHANCELLERY_SYNTHETIC_MERGE_FIELDS.forEach((field) => pushField(field.key, field.label));
    return fields;
}

function resolveChancelleryAppealFieldValues(user = null, subject = null) {
    const current = user || (typeof getCurrentUser === 'function' ? getCurrentUser() : null) || {};
    const facultyCode = String(current.facultyCode || current.faculty || '').trim();
    const facultyLabel = facultyCode && typeof getFacultyLabel === 'function'
        ? getFacultyLabel(facultyCode)
        : (facultyCode || '');
    const personalNumber = String(current.personalNumber || current.nationalId || '').trim();
    const values = {
        name: String(current.name || '').trim(),
        nameEn: String(current.nameEn || current.name || '').trim(),
        email: String(current.email || '').trim(),
        studentId: String(current.studentId || current.id || '').trim(),
        phone: String(current.phone || '').trim(),
        program: String(current.program || '').trim(),
        cohort: String(current.cohort || '').trim(),
        semester: String(current.semester ?? '').trim(),
        status: String(current.status || current.accountStatus || '').trim(),
        faculty: facultyLabel || facultyCode,
        facultyCode,
        personalNumber,
        nationalId: personalNumber,
        department: String(current.department || '').trim(),
        campus: String(current.campus || '').trim(),
        bio: String(current.bio || '').trim(),
        course: String(subject?.subjectName || subject?.name || '').trim(),
        courseCode: String(subject?.subjectId || subject?.courseCode || subject?.code || '').trim()
    };
    Object.keys(current).forEach((key) => {
        if (values[key] != null && values[key] !== '') return;
        const raw = current[key];
        if (raw == null || typeof raw === 'object') return;
        values[key] = String(raw).trim();
    });
    return values;
}

function getChancelleryDocumentPreviewFieldValues() {
    const values = {};
    listChancelleryMergeFieldCatalog().forEach((field) => {
        const key = String(field?.key || '').trim();
        if (!key) return;
        const label = String(field?.label || key).trim() || key;
        values[key] = `[${label}]`;
    });
    return values;
}

function getChancelleryDocumentEditorFieldValues() {
    if (chancelleryDocumentEditorPreviewFill) {
        return resolveChancelleryAppealFieldValues(null, null);
    }
    return getChancelleryDocumentPreviewFieldValues();
}

function markChancelleryDocumentEditorDirty() {
    chancelleryDocumentEditorDirty = true;
}

function syncChancelleryDocumentPrimarySelection() {
    chancelleryDocumentSelectedIds = (chancelleryDocumentSelectedIds || [])
        .filter((id, index, list) => id && list.indexOf(id) === index);
    chancelleryDocumentSelectedId = chancelleryDocumentSelectedIds.length
        ? chancelleryDocumentSelectedIds[chancelleryDocumentSelectedIds.length - 1]
        : '';
}

function setChancelleryDocumentSelection(ids = [], { primaryId = '' } = {}) {
    const validIds = new Set((chancelleryDocumentEditorDraft?.elements || []).map((el) => el.id));
    const next = (Array.isArray(ids) ? ids : [])
        .map((id) => String(id || '').trim())
        .filter((id) => validIds.has(id));
    if (primaryId && validIds.has(primaryId)) {
        const without = next.filter((id) => id !== primaryId);
        without.push(primaryId);
        chancelleryDocumentSelectedIds = without;
    } else {
        chancelleryDocumentSelectedIds = next;
    }
    syncChancelleryDocumentPrimarySelection();
}

function getSelectedChancelleryDocumentElement() {
    const draft = chancelleryDocumentEditorDraft;
    if (!draft || !chancelleryDocumentSelectedId) return null;
    return (draft.elements || []).find((el) => el.id === chancelleryDocumentSelectedId) || null;
}

function getSelectedChancelleryElements() {
    const draft = chancelleryDocumentEditorDraft;
    if (!draft) return [];
    const byId = new Map((draft.elements || []).map((el) => [el.id, el]));
    return chancelleryDocumentSelectedIds.map((id) => byId.get(id)).filter(Boolean);
}

function getChancelleryElementsBounds(elements = []) {
    if (!elements.length) return null;
    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;
    elements.forEach((el) => {
        left = Math.min(left, el.x);
        top = Math.min(top, el.y);
        right = Math.max(right, el.x + el.w);
        bottom = Math.max(bottom, el.y + el.h);
    });
    return { left, top, right, bottom, width: right - left, height: bottom - top };
}

function applyChancelleryElementDomPosition(element) {
    const node = document.querySelector(`[data-doc-box="${element.id}"]`);
    if (!node) return;
    node.style.left = `${element.x}px`;
    node.style.top = `${element.y}px`;
    node.style.width = `${element.w}px`;
    node.style.height = `${element.h}px`;
}

function clearChancelleryDocGuides() {
    document.querySelectorAll('[data-chancellery-doc-canvas] .chancellery-doc-guide').forEach((node) => node.remove());
}

function renderChancelleryDocGuides(guides = []) {
    const canvas = document.querySelector('[data-chancellery-doc-canvas]');
    if (!canvas) return;
    clearChancelleryDocGuides();
    (guides || []).forEach((guide) => {
        const line = document.createElement('div');
        line.className = `chancellery-doc-guide is-${guide.axis}`;
        if (guide.axis === 'x') {
            line.style.left = `${guide.pos}px`;
            line.style.top = '0';
            line.style.height = '100%';
        } else {
            line.style.top = `${guide.pos}px`;
            line.style.left = '0';
            line.style.width = '100%';
        }
        canvas.appendChild(line);
    });
}

function snapChancelleryBoxPosition(element, others = [], page = normalizeChancelleryDocumentPage()) {
    const margin = CHANCELLERY_LAYOUT_PAGE_MARGIN;
    const threshold = CHANCELLERY_LAYOUT_SNAP_THRESHOLD;
    const xTargets = [
        { pos: margin, guide: margin },
        { pos: page.width / 2 - element.w / 2, guide: page.width / 2 },
        { pos: page.width - margin - element.w, guide: page.width - margin }
    ];
    const yTargets = [
        { pos: margin, guide: margin },
        { pos: page.height / 2 - element.h / 2, guide: page.height / 2 },
        { pos: page.height - margin - element.h, guide: page.height - margin }
    ];
    others.forEach((other) => {
        if (!other || other.id === element.id) return;
        xTargets.push(
            { pos: other.x, guide: other.x },
            { pos: other.x + other.w - element.w, guide: other.x + other.w },
            { pos: other.x + other.w / 2 - element.w / 2, guide: other.x + other.w / 2 },
            { pos: other.x - element.w, guide: other.x },
            { pos: other.x + other.w, guide: other.x + other.w }
        );
        yTargets.push(
            { pos: other.y, guide: other.y },
            { pos: other.y + other.h - element.h, guide: other.y + other.h },
            { pos: other.y + other.h / 2 - element.h / 2, guide: other.y + other.h / 2 },
            { pos: other.y - element.h, guide: other.y },
            { pos: other.y + other.h, guide: other.y + other.h }
        );
    });

    let nextX = element.x;
    let nextY = element.y;
    const guides = [];
    let bestX = threshold + 1;
    let bestY = threshold + 1;
    xTargets.forEach((target) => {
        const delta = Math.abs(element.x - target.pos);
        if (delta <= threshold && delta < bestX) {
            bestX = delta;
            nextX = target.pos;
            guides.push({ axis: 'x', pos: target.guide });
        }
    });
    yTargets.forEach((target) => {
        const delta = Math.abs(element.y - target.pos);
        if (delta <= threshold && delta < bestY) {
            bestY = delta;
            nextY = target.pos;
            guides.push({ axis: 'y', pos: target.guide });
        }
    });
    nextX = clampChancelleryNumber(nextX, 0, page.width - 20, element.x);
    nextY = clampChancelleryNumber(nextY, 0, page.height - 20, element.y);
    const uniqueGuides = [];
    const seen = new Set();
    guides.forEach((guide) => {
        const key = `${guide.axis}:${Math.round(guide.pos)}`;
        if (seen.has(key)) return;
        seen.add(key);
        uniqueGuides.push(guide);
    });
    return { x: nextX, y: nextY, guides: uniqueGuides };
}

function alignChancelleryElements(axis = 'left') {
    const draft = chancelleryDocumentEditorDraft;
    if (!draft) return false;
    const selected = getSelectedChancelleryElements();
    if (!selected.length) return false;
    const page = draft.page || normalizeChancelleryDocumentPage();
    const margin = CHANCELLERY_LAYOUT_PAGE_MARGIN;
    const bounds = selected.length === 1
        ? {
            left: margin,
            top: margin,
            right: page.width - margin,
            bottom: page.height - margin,
            width: page.width - margin * 2,
            height: page.height - margin * 2
        }
        : getChancelleryElementsBounds(selected);
    if (!bounds) return false;

    selected.forEach((el) => {
        if (axis === 'left') el.x = bounds.left;
        else if (axis === 'center') el.x = bounds.left + (bounds.width - el.w) / 2;
        else if (axis === 'right') el.x = bounds.right - el.w;
        else if (axis === 'top') el.y = bounds.top;
        else if (axis === 'middle') el.y = bounds.top + (bounds.height - el.h) / 2;
        else if (axis === 'bottom') el.y = bounds.bottom - el.h;
        el.x = clampChancelleryNumber(el.x, 0, page.width - 20, el.x);
        el.y = clampChancelleryNumber(el.y, 0, page.height - 20, el.y);
    });
    markChancelleryDocumentEditorDirty();
    return true;
}

function distributeChancelleryElements(axis = 'vertical') {
    const selected = getSelectedChancelleryElements();
    if (selected.length < 3) {
        alert('Select at least 3 boxes to distribute evenly.');
        return false;
    }
    const page = chancelleryDocumentEditorDraft?.page || normalizeChancelleryDocumentPage();
    if (axis === 'horizontal') {
        const sorted = [...selected].sort((a, b) => a.x - b.x);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const span = (last.x + last.w) - first.x;
        const totalSize = sorted.reduce((sum, el) => sum + el.w, 0);
        const gap = (span - totalSize) / (sorted.length - 1);
        let cursor = first.x;
        sorted.forEach((el, index) => {
            if (index === 0) {
                cursor = el.x + el.w + gap;
                return;
            }
            if (index === sorted.length - 1) return;
            el.x = clampChancelleryNumber(cursor, 0, page.width - 20, el.x);
            cursor = el.x + el.w + gap;
        });
    } else {
        const sorted = [...selected].sort((a, b) => a.y - b.y);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const span = (last.y + last.h) - first.y;
        const totalSize = sorted.reduce((sum, el) => sum + el.h, 0);
        const gap = (span - totalSize) / (sorted.length - 1);
        let cursor = first.y;
        sorted.forEach((el, index) => {
            if (index === 0) {
                cursor = el.y + el.h + gap;
                return;
            }
            if (index === sorted.length - 1) return;
            el.y = clampChancelleryNumber(cursor, 0, page.height - 20, el.y);
            cursor = el.y + el.h + gap;
        });
    }
    markChancelleryDocumentEditorDirty();
    return true;
}

function tidyChancelleryColumnSpacing(gapPx = chancelleryLayoutTidyGap) {
    const draft = chancelleryDocumentEditorDraft;
    if (!draft?.elements?.length) return false;
    const page = draft.page || normalizeChancelleryDocumentPage();
    const gap = clampChancelleryNumber(gapPx, 0, 200, CHANCELLERY_LAYOUT_TIDY_GAP);
    chancelleryLayoutTidyGap = gap;
    const sorted = [...draft.elements].sort((a, b) => (a.y - b.y) || (a.x - b.x));
    let y = CHANCELLERY_LAYOUT_PAGE_MARGIN;
    sorted.forEach((el) => {
        el.y = clampChancelleryNumber(y, 0, page.height - 20, el.y);
        el.x = clampChancelleryNumber(el.x, 0, page.width - 20, el.x);
        y = el.y + el.h + gap;
    });
    markChancelleryDocumentEditorDirty();
    return true;
}

function createChancelleryDocumentBoxDraft(type = 'text', page = normalizeChancelleryDocumentPage()) {
    const catalog = listChancelleryMergeFieldCatalog();
    const baseY = 80 + ((chancelleryDocumentEditorDraft?.elements || []).length % 8) * 28;
    if (type === 'mergeField') {
        const field = catalog[0] || { key: 'name', label: 'Full name' };
        return normalizeChancelleryDocumentElement({
            type: 'mergeField', x: 80, y: baseY, w: 320, h: 40, fieldKey: field.key, label: field.label
        }, 0, page);
    }
    if (type === 'inputText') {
        return normalizeChancelleryDocumentElement({
            type: 'inputText', x: 80, y: baseY, w: 360, h: 72, label: 'Short answer', required: true
        }, 0, page);
    }
    if (type === 'inputLong') {
        return normalizeChancelleryDocumentElement({
            type: 'inputLong', x: 80, y: baseY, w: 520, h: 160, label: 'Description', required: true
        }, 0, page);
    }
    if (type === 'inputChoice') {
        return normalizeChancelleryDocumentElement({
            type: 'inputChoice', x: 80, y: baseY, w: 698, h: 150, label: '', mode: 'single', layout: 'columns', required: true,
            options: [
                { id: 'option_1', label: 'Option 1' },
                { id: 'option_2', label: 'Option 2' },
                { id: 'option_3', label: 'Option 3' }
            ]
        }, 0, page);
    }
    if (type === 'table') {
        return normalizeChancelleryDocumentElement({
            type: 'table',
            x: 48,
            y: baseY,
            w: 698,
            h: 150,
            rows: 1,
            cols: 3,
            borderWidth: 1.5,
            borderColor: '#111111'
        }, 0, page);
    }
    if (type === 'shape') {
        return normalizeChancelleryDocumentElement({
            type: 'shape', x: 80, y: baseY, w: 240, h: 120,
            strokeWidth: 1.5, strokeColor: '#111111', fill: 'transparent'
        }, 0, page);
    }
    if (type === 'image') {
        return normalizeChancelleryDocumentElement({
            type: 'image', x: 80, y: baseY, w: 160, h: 120, src: '', alt: 'Logo', objectFit: 'contain'
        }, 0, page);
    }
    return normalizeChancelleryDocumentElement({
        type: 'text', x: 80, y: baseY, w: 360, h: 64, html: 'New text'
    }, 0, page);
}

function renderChancelleryMergeFieldUnderlineBlank(element = {}) {
    if (!element?.underlineBlank) return '';
    const align = ['start', 'center', 'end'].includes(element.underlineAlign) ? element.underlineAlign : 'end';
    return `<div class="chancellery-doc-field-blank is-align-${escapeChancelleryDocumentHtml(align)}" aria-hidden="true"></div>`;
}

function renderChancelleryMergeFieldRow(element = {}, valueText = '', { editableChip = false } = {}) {
    const label = String(element.label || element.fieldKey || '').trim();
    const value = String(valueText || '').trim() || '—';
    const hasBlank = element.underlineBlank === true;
    const lengthPct = clampChancelleryNumber(element.underlineLengthPct, 10, 100, 70);
    const valueInner = editableChip
        ? `<span class="chancellery-merge-chip chancellery-doc-value" data-field-key="${escapeChancelleryDocumentHtml(element.fieldKey)}" data-doc-autofill="${escapeChancelleryDocumentHtml(element.fieldKey)}">${escapeChancelleryDocumentHtml(value)}</span>`
        : `<span class="chancellery-doc-value" data-doc-autofill="${escapeChancelleryDocumentHtml(element.fieldKey)}">${escapeChancelleryDocumentHtml(value)}</span>`;
    const valueWrapStyle = hasBlank ? ` style="width:${lengthPct}%"` : '';
    const blank = renderChancelleryMergeFieldUnderlineBlank(element);
    return `<div class="chancellery-doc-merge-field is-value-label${hasBlank ? ' has-underline-blank' : ''}">
        <div class="chancellery-doc-merge-row">
            <span class="chancellery-doc-merge-value-wrap"${valueWrapStyle}>${valueInner}${blank}</span>
            <span class="chancellery-doc-merge-sep">:</span>
            <span class="chancellery-doc-merge-label">${escapeChancelleryDocumentHtml(label)}</span>
        </div>
    </div>`;
}

function renderChancelleryDocBoxInner(element, { mode = 'edit', fieldValues = {}, interactive = true } = {}) {
    if (element.type === 'text') {
        const spacing = `line-height:${Number(element.lineHeight) || 1.35};`
            + (element.paragraphSpacingPt
                ? `--chancellery-p-gap:${Number(element.paragraphSpacingPt) || 0}pt;`
                : '');
        if (mode === 'edit') {
            return `<div class="chancellery-doc-box-text" data-doc-box-text="1" contenteditable="true" style="${spacing}">${element.html}</div>`;
        }
        return `<div class="chancellery-doc-box-text" style="${spacing}">${element.html}</div>`;
    }
    if (element.type === 'table') {
        const outerBorder = `${element.borderWidth || 1.5}px solid ${escapeChancelleryDocumentHtml(element.borderColor || '#111')}`;
        const innerBorder = `${element.innerBorderWidth ?? element.borderWidth ?? 1.5}px solid ${escapeChancelleryDocumentHtml(element.innerBorderColor || element.borderColor || '#111')}`;
        const covered = getChancelleryTableCoveredSet(element);
        const active = chancelleryActiveTableCell
            && chancelleryActiveTableCell.boxId === element.id
            ? chancelleryActiveTableCell
            : null;
        const colWidths = normalizeChancellerySizePercentArray(element.colWidths, element.cols);
        const rowHeights = normalizeChancellerySizePercentArray(element.rowHeights, element.rows);
        const colgroup = `<colgroup>${colWidths.map((w) => `<col style="width:${w}%">`).join('')}</colgroup>`;
        const rowsHtml = (element.cells || []).map((row, rowIndex) => {
            const rowH = rowHeights[rowIndex] || (100 / Math.max(1, element.rows));
            const cellsHtml = (row || []).map((cell, colIndex) => {
                if (covered.has(`${rowIndex}:${colIndex}`)) return '';
                const cs = Math.max(1, Number(cell?.colspan) || 1);
                const rs = Math.max(1, Number(cell?.rowspan) || 1);
                const fill = cell?.fill && cell.fill !== 'transparent' && cell.fill !== 'none'
                    ? escapeChancelleryDocumentHtml(cell.fill)
                    : (element.headerRow && rowIndex === 0 ? '#f3f3f3' : 'transparent');
                const vAlign = ['top', 'middle', 'bottom'].includes(cell?.vAlign) ? cell.vAlign : 'top';
                const isActive = active && active.row === rowIndex && active.col === colIndex;
                const inSel = isChancelleryTableCellInSelection(element.id, rowIndex, colIndex);
                const tag = element.headerRow && rowIndex === 0 ? 'th' : 'td';
                const headerStyle = element.headerRow && rowIndex === 0 ? 'font-weight:700;' : '';
                return `<${tag} class="chancellery-doc-table-cell${isActive ? ' is-active-cell' : ''}${inSel ? ' is-multi-selected' : ''}"
                    style="border:${innerBorder};background:${fill};vertical-align:${vAlign};${headerStyle}"
                    colspan="${cs}" rowspan="${rs}"
                    data-doc-table-cell="1" data-doc-table-row="${rowIndex}" data-doc-table-col="${colIndex}"
                    ${mode === 'edit' ? 'contenteditable="true"' : ''}>${cell?.html || ''}</${tag}>`;
            }).join('');
            return `<tr style="height:${rowH}%">${cellsHtml}</tr>`;
        }).join('');
        return `<table class="chancellery-doc-table" style="border-collapse:collapse;width:100%;height:100%;border:${outerBorder}">${colgroup}<tbody>${rowsHtml}</tbody></table>`;
    }
    if (element.type === 'shape') {
        const kind = element.shapeKind || 'rect';
        const stroke = `${element.strokeWidth || 1.5}px solid ${escapeChancelleryDocumentHtml(element.strokeColor || '#111')}`;
        const fill = escapeChancelleryDocumentHtml(element.fill || 'transparent');
        const opacity = clampChancelleryNumber(element.opacity, 0, 1, 1);
        const rotation = clampChancelleryNumber(element.rotation, -360, 360, 0);
        let shapeStyle = `width:100%;height:100%;box-sizing:border-box;opacity:${opacity};transform:rotate(${rotation}deg);transform-origin:center center;`;
        if (kind === 'oval') {
            shapeStyle += `border:${stroke};background:${fill};border-radius:50%;`;
        } else if (kind === 'line') {
            shapeStyle += `border:none;background:transparent;position:relative;`;
            return `<div class="chancellery-doc-shape is-line" style="${shapeStyle}" aria-hidden="true"><span class="chancellery-doc-shape-line" style="background:${escapeChancelleryDocumentHtml(element.strokeColor || '#111')};height:${Math.max(1, Number(element.strokeWidth) || 1.5)}px"></span></div>`;
        } else {
            const radius = clampChancelleryNumber(element.cornerRadius, 0, 200, 0);
            shapeStyle += `border:${stroke};background:${fill};border-radius:${radius}px;`;
        }
        return `<div class="chancellery-doc-shape is-${escapeChancelleryDocumentHtml(kind)}" style="${shapeStyle}" aria-hidden="true"></div>`;
    }
    if (element.type === 'image') {
        const opacity = clampChancelleryNumber(element.opacity, 0, 1, 1);
        const rotation = clampChancelleryNumber(element.rotation, -360, 360, 0);
        const crop = normalizeChancelleryImageCrop(element.crop);
        const clip = `inset(${(crop.top * 100).toFixed(2)}% ${(crop.right * 100).toFixed(2)}% ${(crop.bottom * 100).toFixed(2)}% ${(crop.left * 100).toFixed(2)}%)`;
        if (element.src) {
            return `<div class="chancellery-doc-image-frame" style="width:100%;height:100%;overflow:hidden;opacity:${opacity}">
                <img class="chancellery-doc-image" src="${escapeChancelleryDocumentHtml(element.src)}" alt="${escapeChancelleryDocumentHtml(element.alt || '')}" style="width:100%;height:100%;object-fit:${escapeChancelleryDocumentHtml(element.objectFit || 'contain')};display:block;clip-path:${clip};transform:rotate(${rotation}deg);transform-origin:center center">
            </div>`;
        }
        return `<div class="chancellery-doc-image-placeholder">${mode === 'edit' ? 'Upload an image in the properties panel' : ''}</div>`;
    }
    if (element.type === 'mergeField') {
        const value = String(fieldValues[element.fieldKey] ?? '').trim() || '—';
        return renderChancelleryMergeFieldRow(element, value, { editableChip: mode === 'edit' });
    }
    if (element.type === 'inputText' || element.type === 'inputLong') {
        const label = element.label
            ? `<div class="chancellery-doc-input-label">${escapeChancelleryDocumentHtml(element.label)}</div>`
            : '';
        if (mode === 'edit') {
            return `${label}<div class="chancellery-doc-input-shell" aria-hidden="true">${element.type === 'inputLong' ? 'Students type here (not editable in template)' : 'Students type here'}</div>`;
        }
        const control = element.type === 'inputLong'
            ? `<textarea class="chancellery-doc-message" data-doc-answer="${escapeChancelleryDocumentHtml(element.id)}" rows="6" placeholder="${escapeChancelleryDocumentHtml(element.placeholder || '')}" ${interactive ? '' : 'readonly'}></textarea>`
            : `<input class="chancellery-doc-message chancellery-doc-message--short" data-doc-answer="${escapeChancelleryDocumentHtml(element.id)}" type="text" placeholder="${escapeChancelleryDocumentHtml(element.placeholder || '')}" ${interactive ? '' : 'readonly'}>`;
        return `${label}${control}`;
    }
    if (element.type !== 'inputChoice') return '';
    const layout = element.layout === 'stack' ? 'stack' : 'columns';
    const optionCount = Math.max(1, (element.options || []).length);
    const options = (element.options || []).map((option) => {
        if (mode === 'edit') {
            return `<div class="chancellery-doc-choice-option"><span class="chancellery-doc-exam-label">${escapeChancelleryDocumentHtml(option.label)}</span><span class="chancellery-doc-exam-mark" aria-hidden="true"></span></div>`;
        }
        const inputType = element.mode === 'multi' ? 'checkbox' : 'radio';
        const name = `chancellery-answer-${element.id}`;
        return `<label class="chancellery-doc-exam"><input type="${inputType}" name="${escapeChancelleryDocumentHtml(name)}" value="${escapeChancelleryDocumentHtml(option.id)}" data-doc-answer="${escapeChancelleryDocumentHtml(element.id)}" ${interactive ? '' : 'disabled'}><span class="chancellery-doc-exam-label">${escapeChancelleryDocumentHtml(option.label)}</span><span class="chancellery-doc-exam-mark" aria-hidden="true"></span></label>`;
    }).join('');
    const label = element.label
        ? `<div class="chancellery-doc-input-label">${escapeChancelleryDocumentHtml(element.label)}</div>`
        : '';
    return `${label}<div class="chancellery-doc-exams is-${layout}" style="--chancellery-exam-cols:${optionCount}">${options}</div>`;
}

function renderChancelleryDocBox(element, options = {}) {
    const { mode = 'edit', selectedIds = [], fieldValues = {}, interactive = true } = options;
    const selected = mode === 'edit' && selectedIds.includes(element.id);
    const locked = element.locked === true;
    const handles = selected && !locked && selectedIds[selectedIds.length - 1] === element.id
        ? '<span class="chancellery-doc-resize-handle" data-doc-resize="se"></span>'
        : '';
    return `
        <div class="chancellery-doc-box is-${escapeChancelleryDocumentHtml(element.type)}${selected ? ' is-selected' : ''}${locked ? ' is-locked' : ''}"
            data-doc-box="${escapeChancelleryDocumentHtml(element.id)}"
            data-doc-box-type="${escapeChancelleryDocumentHtml(element.type)}"
            style="left:${element.x}px;top:${element.y}px;width:${element.w}px;height:${element.h}px;z-index:${element.z}">
            ${renderChancelleryDocBoxInner(element, { mode, fieldValues, interactive })}
            ${handles}
        </div>
    `;
}

function renderChancelleryDocCanvas(template, {
    mode = 'fill',
    selectedIds = [],
    fieldValues = null,
    interactive = true
} = {}) {
    const normalized = normalizeChancelleryDocumentTemplate(template);
    const values = fieldValues || (mode === 'edit'
        ? getChancelleryDocumentPreviewFieldValues()
        : {});
    const sorted = [...(normalized.elements || [])].sort((a, b) => a.z - b.z);
    const boxes = sorted.map((element) => renderChancelleryDocBox(element, {
        mode,
        selectedIds,
        fieldValues: values,
        interactive
    })).join('');
    return `
        <div class="chancellery-doc-canvas-wrap">
            <div class="chancellery-doc-canvas chancellery-doc-letter"
                data-chancellery-doc-canvas="1"
                style="width:${normalized.page.width}px;height:${normalized.page.height}px">
                ${boxes}
            </div>
        </div>
    `;
}

function renderChancelleryDocFormatBar() {
    return `<div class="chancellery-doc-format-bar" role="toolbar" aria-label="Text formatting">
        <select class="chancellery-doc-toolbar-select" data-lux-skip-picker="true" data-chancellery-doc-action="format-font-family" title="Font">
            <option value="">Font</option>
            <option value="Noto Serif, Georgia, serif">Serif</option>
            <option value="Noto Sans, system-ui, sans-serif">Sans</option>
            <option value="Georgia, Times New Roman, serif">Georgia</option>
            <option value="Courier New, monospace">Mono</option>
        </select>
        <select class="chancellery-doc-toolbar-select" data-lux-skip-picker="true" data-chancellery-doc-action="format-font-size-pt" title="Size">
            <option value="">pt</option>
            <option value="10">10</option>
            <option value="11">11</option>
            <option value="12">12</option>
            <option value="14">14</option>
            <option value="16">16</option>
            <option value="18">18</option>
            <option value="20">20</option>
            <option value="24">24</option>
        </select>
        <button type="button" class="lux-secondary-btn" data-lux-skip-modern-button="true" data-chancellery-doc-action="format-text" data-format="bold" title="Bold"><i class="fas fa-bold"></i></button>
        <button type="button" class="lux-secondary-btn" data-lux-skip-modern-button="true" data-chancellery-doc-action="format-text" data-format="italic" title="Italic"><i class="fas fa-italic"></i></button>
        <button type="button" class="lux-secondary-btn" data-lux-skip-modern-button="true" data-chancellery-doc-action="format-text" data-format="underline" title="Underline"><i class="fas fa-underline"></i></button>
        <label class="chancellery-doc-format-color" title="Text color"><input type="color" value="#111111" data-chancellery-doc-action="format-fore-color"></label>
        <label class="chancellery-doc-format-color" title="Highlight"><input type="color" value="#fff59d" data-chancellery-doc-action="format-hilite-color"></label>
        <button type="button" class="lux-secondary-btn" data-lux-skip-modern-button="true" data-chancellery-doc-action="format-text" data-format="insertUnorderedList" title="Bullets"><i class="fas fa-list-ul"></i></button>
        <button type="button" class="lux-secondary-btn" data-lux-skip-modern-button="true" data-chancellery-doc-action="format-text" data-format="insertOrderedList" title="Numbered"><i class="fas fa-list-ol"></i></button>
        <button type="button" class="lux-secondary-btn" data-lux-skip-modern-button="true" data-chancellery-doc-action="format-text" data-format="justifyLeft" title="Align left"><i class="fas fa-align-left"></i></button>
        <button type="button" class="lux-secondary-btn" data-lux-skip-modern-button="true" data-chancellery-doc-action="format-text" data-format="justifyCenter" title="Align center"><i class="fas fa-align-center"></i></button>
        <button type="button" class="lux-secondary-btn" data-lux-skip-modern-button="true" data-chancellery-doc-action="format-text" data-format="justifyRight" title="Align right"><i class="fas fa-align-right"></i></button>
        <button type="button" class="lux-secondary-btn" data-lux-skip-modern-button="true" data-chancellery-doc-action="format-text" data-format="removeFormat" title="Clear formatting"><i class="fas fa-eraser"></i></button>
    </div>`;
}

function renderChancelleryDocPropsPanel(element) {
    if (!element) {
        return `<aside class="chancellery-doc-props"><div class="lux-panel-copy lux-meta">Select a box to edit its properties.</div></aside>`;
    }
    const arrange = renderChancelleryDocArrangeChrome(element);
    const deleteBtn = `<button type="button" class="lux-secondary-btn lux-btn-danger" data-lux-skip-modern-button="true" data-chancellery-doc-action="delete-box" data-doc-box-id="${escapeChancelleryDocumentHtml(element.id)}"><i class="fas fa-trash"></i> Delete</button>`;
    if (element.type === 'text') {
        return `<aside class="chancellery-doc-props">
            <div class="lux-section-kicker">Text box</div>
            ${renderChancelleryDocFormatBar()}
            <div class="lux-panel-copy lux-meta">Select text in the box, then use the format buttons.</div>
            <label class="chancellery-doc-muted">Line spacing<input class="chancellery-doc-edit" type="number" min="0.8" max="3" step="0.05" data-doc-prop="lineHeight" value="${escapeChancelleryDocumentHtml(element.lineHeight ?? 1.35)}"></label>
            <label class="chancellery-doc-muted">Paragraph spacing (pt)<input class="chancellery-doc-edit" type="number" min="0" max="48" step="1" data-doc-prop="paragraphSpacingPt" value="${escapeChancelleryDocumentHtml(element.paragraphSpacingPt ?? 0)}"></label>
            ${arrange}
            ${deleteBtn}
        </aside>`;
    }
    if (element.type === 'table') {
        const active = chancelleryActiveTableCell?.boxId === element.id ? chancelleryActiveTableCell : null;
        const activeCell = active ? element.cells?.[active.row]?.[active.col] : null;
        const fillValue = activeCell && /^#[0-9a-f]{6}$/i.test(activeCell.fill) ? activeCell.fill : '#ffffff';
        const colW = active ? (element.colWidths?.[active.col] ?? (100 / Math.max(1, element.cols))) : '';
        const rowH = active ? (element.rowHeights?.[active.row] ?? (100 / Math.max(1, element.rows))) : '';
        const cellControls = activeCell ? `
            <div class="chancellery-doc-muted">Active cell R${active.row + 1} C${active.col + 1}</div>
            <div class="chancellery-doc-table-actions">
                <button type="button" class="lux-secondary-btn" data-lux-skip-modern-button="true" data-chancellery-doc-action="table-insert-row" data-where="above">Row above</button>
                <button type="button" class="lux-secondary-btn" data-lux-skip-modern-button="true" data-chancellery-doc-action="table-insert-row" data-where="below">Row below</button>
                <button type="button" class="lux-secondary-btn" data-lux-skip-modern-button="true" data-chancellery-doc-action="table-delete-row">Delete row</button>
                <button type="button" class="lux-secondary-btn" data-lux-skip-modern-button="true" data-chancellery-doc-action="table-insert-col" data-where="left">Col left</button>
                <button type="button" class="lux-secondary-btn" data-lux-skip-modern-button="true" data-chancellery-doc-action="table-insert-col" data-where="right">Col right</button>
                <button type="button" class="lux-secondary-btn" data-lux-skip-modern-button="true" data-chancellery-doc-action="table-delete-col">Delete col</button>
                <button type="button" class="lux-secondary-btn" data-lux-skip-modern-button="true" data-chancellery-doc-action="table-merge-right">Merge right</button>
                <button type="button" class="lux-secondary-btn" data-lux-skip-modern-button="true" data-chancellery-doc-action="table-merge-selection">Merge selection</button>
                <button type="button" class="lux-secondary-btn" data-lux-skip-modern-button="true" data-chancellery-doc-action="table-split-cell">Split cell</button>
                <button type="button" class="lux-secondary-btn" data-lux-skip-modern-button="true" data-chancellery-doc-action="table-distribute-cols">Distribute columns</button>
                <button type="button" class="lux-secondary-btn" data-lux-skip-modern-button="true" data-chancellery-doc-action="table-distribute-rows">Distribute rows</button>
            </div>
            <label class="chancellery-doc-muted">Column width %<input class="chancellery-doc-edit" type="number" min="1" max="100" step="0.5" data-doc-prop="colWidthPct" value="${escapeChancelleryDocumentHtml(colW)}"></label>
            <label class="chancellery-doc-muted">Row height %<input class="chancellery-doc-edit" type="number" min="1" max="100" step="0.5" data-doc-prop="rowHeightPct" value="${escapeChancelleryDocumentHtml(rowH)}"></label>
            <label class="chancellery-doc-muted">Cell fill
                <select class="chancellery-doc-toolbar-select" data-doc-prop="cellFillMode" data-lux-skip-picker="true">
                    <option value="transparent" ${!activeCell.fill || activeCell.fill === 'transparent' || activeCell.fill === 'none' ? 'selected' : ''}>Transparent</option>
                    <option value="solid" ${activeCell.fill && activeCell.fill !== 'transparent' && activeCell.fill !== 'none' ? 'selected' : ''}>Solid</option>
                </select>
            </label>
            <label class="chancellery-doc-muted">Fill color<input class="chancellery-doc-edit" type="color" data-doc-prop="cellFill" value="${escapeChancelleryDocumentHtml(fillValue)}"></label>
            <label class="chancellery-doc-muted">Vertical align
                <select class="chancellery-doc-toolbar-select" data-doc-prop="cellVAlign" data-lux-skip-picker="true">
                    <option value="top" ${activeCell.vAlign === 'top' ? 'selected' : ''}>Top</option>
                    <option value="middle" ${activeCell.vAlign === 'middle' ? 'selected' : ''}>Middle</option>
                    <option value="bottom" ${activeCell.vAlign === 'bottom' ? 'selected' : ''}>Bottom</option>
                </select>
            </label>
        ` : `<div class="lux-panel-copy lux-meta">Click a cell (shift-click for multi-select) to edit rows, merge, fill, or align.</div>`;
        return `<aside class="chancellery-doc-props">
            <div class="lux-section-kicker">Table</div>
            ${renderChancelleryDocFormatBar()}
            <label class="chancellery-doc-muted">Rows<input class="chancellery-doc-edit" type="number" min="1" max="12" data-doc-prop="rows" value="${escapeChancelleryDocumentHtml(element.rows)}"></label>
            <label class="chancellery-doc-muted">Columns<input class="chancellery-doc-edit" type="number" min="1" max="12" data-doc-prop="cols" value="${escapeChancelleryDocumentHtml(element.cols)}"></label>
            <label class="chancellery-doc-muted">Outer border width<input class="chancellery-doc-edit" type="number" min="0" max="8" step="0.5" data-doc-prop="borderWidth" value="${escapeChancelleryDocumentHtml(element.borderWidth)}"></label>
            <label class="chancellery-doc-muted">Outer border color<input class="chancellery-doc-edit" type="color" data-doc-prop="borderColor" value="${escapeChancelleryDocumentHtml(/^#[0-9a-f]{6}$/i.test(element.borderColor) ? element.borderColor : '#111111')}"></label>
            <label class="chancellery-doc-muted">Inner border width<input class="chancellery-doc-edit" type="number" min="0" max="8" step="0.5" data-doc-prop="innerBorderWidth" value="${escapeChancelleryDocumentHtml(element.innerBorderWidth ?? element.borderWidth)}"></label>
            <label class="chancellery-doc-muted">Inner border color<input class="chancellery-doc-edit" type="color" data-doc-prop="innerBorderColor" value="${escapeChancelleryDocumentHtml(/^#[0-9a-f]{6}$/i.test(element.innerBorderColor || '') ? element.innerBorderColor : (/^#[0-9a-f]{6}$/i.test(element.borderColor) ? element.borderColor : '#111111'))}"></label>
            <label class="chancellery-doc-muted"><input type="checkbox" data-doc-prop="headerRow" ${element.headerRow ? 'checked' : ''}> Header row</label>
            ${cellControls}
            ${arrange}
            ${deleteBtn}
        </aside>`;
    }
    if (element.type === 'shape') {
        return `<aside class="chancellery-doc-props">
            <div class="lux-section-kicker">Shape / border</div>
            <label class="chancellery-doc-muted">Kind
                <select class="chancellery-doc-toolbar-select" data-doc-prop="shapeKind" data-lux-skip-picker="true">
                    <option value="rect" ${element.shapeKind !== 'oval' && element.shapeKind !== 'line' ? 'selected' : ''}>Rectangle</option>
                    <option value="oval" ${element.shapeKind === 'oval' ? 'selected' : ''}>Oval</option>
                    <option value="line" ${element.shapeKind === 'line' ? 'selected' : ''}>Line</option>
                </select>
            </label>
            <label class="chancellery-doc-muted">Corner radius<input class="chancellery-doc-edit" type="number" min="0" max="200" step="1" data-doc-prop="cornerRadius" value="${escapeChancelleryDocumentHtml(element.cornerRadius ?? 0)}"></label>
            <label class="chancellery-doc-muted">Rotation (°)<input class="chancellery-doc-edit" type="number" min="-360" max="360" step="1" data-doc-prop="rotation" value="${escapeChancelleryDocumentHtml(element.rotation ?? 0)}"></label>
            <label class="chancellery-doc-muted">Opacity<input class="chancellery-doc-edit" type="number" min="0" max="1" step="0.05" data-doc-prop="opacity" value="${escapeChancelleryDocumentHtml(element.opacity ?? 1)}"></label>
            <label class="chancellery-doc-muted">Stroke width<input class="chancellery-doc-edit" type="number" min="0" max="12" step="0.5" data-doc-prop="strokeWidth" value="${escapeChancelleryDocumentHtml(element.strokeWidth)}"></label>
            <label class="chancellery-doc-muted">Stroke color<input class="chancellery-doc-edit" type="color" data-doc-prop="strokeColor" value="${escapeChancelleryDocumentHtml(/^#[0-9a-f]{6}$/i.test(element.strokeColor) ? element.strokeColor : '#111111')}"></label>
            <label class="chancellery-doc-muted">Fill
                <select class="chancellery-doc-toolbar-select" data-doc-prop="fillMode" data-lux-skip-picker="true">
                    <option value="transparent" ${element.fill === 'transparent' || element.fill === 'none' ? 'selected' : ''}>Transparent</option>
                    <option value="solid" ${element.fill !== 'transparent' && element.fill !== 'none' ? 'selected' : ''}>Solid</option>
                </select>
            </label>
            <label class="chancellery-doc-muted">Fill color<input class="chancellery-doc-edit" type="color" data-doc-prop="fill" value="${escapeChancelleryDocumentHtml(/^#[0-9a-f]{6}$/i.test(element.fill) ? element.fill : '#ffffff')}"></label>
            ${arrange}
            ${deleteBtn}
        </aside>`;
    }
    if (element.type === 'image') {
        const crop = normalizeChancelleryImageCrop(element.crop);
        return `<aside class="chancellery-doc-props">
            <div class="lux-section-kicker">Image / logo</div>
            <label class="chancellery-doc-muted">Replace image<input class="chancellery-doc-edit" type="file" accept="image/png,image/jpeg,image/gif,image/webp" data-doc-prop="imageFile"></label>
            <label class="chancellery-doc-muted">Or URL<input class="chancellery-doc-edit" type="text" data-doc-prop="src" value="${escapeChancelleryDocumentHtml(element.src && !element.src.startsWith('data:') ? element.src : '')}" placeholder="https://… or /assets/…"></label>
            <button type="button" class="lux-secondary-btn" data-lux-skip-modern-button="true" data-chancellery-doc-action="clear-image">Clear image</button>
            <label class="chancellery-doc-muted">Alt text<input class="chancellery-doc-edit" type="text" data-doc-prop="alt" value="${escapeChancelleryDocumentHtml(element.alt || '')}"></label>
            <label class="chancellery-doc-muted">Fit
                <select class="chancellery-doc-toolbar-select" data-doc-prop="objectFit" data-lux-skip-picker="true">
                    <option value="contain" ${element.objectFit === 'contain' ? 'selected' : ''}>Contain</option>
                    <option value="cover" ${element.objectFit === 'cover' ? 'selected' : ''}>Cover</option>
                    <option value="fill" ${element.objectFit === 'fill' ? 'selected' : ''}>Fill</option>
                </select>
            </label>
            <label class="chancellery-doc-muted">Crop top<input class="chancellery-doc-edit" type="number" min="0" max="0.45" step="0.01" data-doc-prop="cropTop" value="${escapeChancelleryDocumentHtml(crop.top)}"></label>
            <label class="chancellery-doc-muted">Crop right<input class="chancellery-doc-edit" type="number" min="0" max="0.45" step="0.01" data-doc-prop="cropRight" value="${escapeChancelleryDocumentHtml(crop.right)}"></label>
            <label class="chancellery-doc-muted">Crop bottom<input class="chancellery-doc-edit" type="number" min="0" max="0.45" step="0.01" data-doc-prop="cropBottom" value="${escapeChancelleryDocumentHtml(crop.bottom)}"></label>
            <label class="chancellery-doc-muted">Crop left<input class="chancellery-doc-edit" type="number" min="0" max="0.45" step="0.01" data-doc-prop="cropLeft" value="${escapeChancelleryDocumentHtml(crop.left)}"></label>
            <label class="chancellery-doc-muted">Rotation (°)<input class="chancellery-doc-edit" type="number" min="-360" max="360" step="1" data-doc-prop="rotation" value="${escapeChancelleryDocumentHtml(element.rotation ?? 0)}"></label>
            <label class="chancellery-doc-muted">Opacity<input class="chancellery-doc-edit" type="number" min="0" max="1" step="0.05" data-doc-prop="opacity" value="${escapeChancelleryDocumentHtml(element.opacity ?? 1)}"></label>
            ${arrange}
            ${deleteBtn}
        </aside>`;
    }
    if (element.type === 'mergeField') {
        const options = listChancelleryMergeFieldCatalog()
            .map((field) => `<option value="${escapeChancelleryDocumentHtml(field.key)}" ${field.key === element.fieldKey ? 'selected' : ''}>${escapeChancelleryDocumentHtml(field.label)}</option>`)
            .join('');
        const underlineControls = element.underlineBlank ? `
            <label class="chancellery-doc-muted">Blank length %<input class="chancellery-doc-edit" type="number" min="10" max="100" step="1" data-doc-prop="underlineLengthPct" value="${escapeChancelleryDocumentHtml(element.underlineLengthPct ?? 70)}"></label>
            <label class="chancellery-doc-muted">Blank align
                <select class="chancellery-doc-toolbar-select" data-doc-prop="underlineAlign" data-lux-skip-picker="true">
                    <option value="start" ${element.underlineAlign === 'start' ? 'selected' : ''}>Start</option>
                    <option value="center" ${element.underlineAlign === 'center' ? 'selected' : ''}>Center</option>
                    <option value="end" ${element.underlineAlign !== 'start' && element.underlineAlign !== 'center' ? 'selected' : ''}>End</option>
                </select>
            </label>
        ` : '';
        return `<aside class="chancellery-doc-props">
            <div class="lux-section-kicker">Student field</div>
            <label class="chancellery-doc-muted">Field<select class="chancellery-doc-toolbar-select" data-doc-prop="fieldKey" data-lux-skip-picker="true">${options}</select></label>
            <label class="chancellery-doc-muted">Label<input class="chancellery-doc-edit" type="text" data-doc-prop="label" value="${escapeChancelleryDocumentHtml(element.label)}"></label>
            <label class="chancellery-doc-muted"><input type="checkbox" data-doc-prop="underlineBlank" ${element.underlineBlank ? 'checked' : ''}> Underline blank</label>
            ${underlineControls}
            ${arrange}
            ${deleteBtn}
        </aside>`;
    }
    if (element.type === 'inputChoice') {
        const optionRows = (element.options || []).map((option, index) => `
            <div class="chancellery-doc-exam-edit-row" data-doc-option-index="${index}">
                <input class="chancellery-doc-edit" type="text" data-doc-prop-option-label="${index}" value="${escapeChancelleryDocumentHtml(option.label)}">
                <button type="button" class="lux-secondary-btn" data-lux-skip-modern-button="true" data-chancellery-doc-action="remove-choice-option" data-option-index="${index}" aria-label="Remove"><i class="fas fa-times"></i></button>
            </div>
        `).join('');
        return `<aside class="chancellery-doc-props">
            <div class="lux-section-kicker">Choice input</div>
            <label class="chancellery-doc-muted">Label<input class="chancellery-doc-edit" type="text" data-doc-prop="label" value="${escapeChancelleryDocumentHtml(element.label)}" placeholder="Optional heading"></label>
            <label class="chancellery-doc-muted">Layout
                <select class="chancellery-doc-toolbar-select" data-doc-prop="layout" data-lux-skip-picker="true">
                    <option value="columns" ${element.layout !== 'stack' ? 'selected' : ''}>Columns (paper form)</option>
                    <option value="stack" ${element.layout === 'stack' ? 'selected' : ''}>Stacked list</option>
                </select>
            </label>
            <label class="chancellery-doc-muted">Mode
                <select class="chancellery-doc-toolbar-select" data-doc-prop="mode" data-lux-skip-picker="true">
                    <option value="single" ${element.mode !== 'multi' ? 'selected' : ''}>Single</option>
                    <option value="multi" ${element.mode === 'multi' ? 'selected' : ''}>Multi</option>
                </select>
            </label>
            <div class="chancellery-doc-muted">Options</div>
            ${optionRows}
            <button type="button" class="lux-secondary-btn" data-lux-skip-modern-button="true" data-chancellery-doc-action="add-choice-option"><i class="fas fa-plus"></i> Add option</button>
            ${arrange}
            ${deleteBtn}
        </aside>`;
    }
    return `<aside class="chancellery-doc-props">
        <div class="lux-section-kicker">${element.type === 'inputLong' ? 'Long answer' : 'Short answer'}</div>
        <label class="chancellery-doc-muted">Label<input class="chancellery-doc-edit" type="text" data-doc-prop="label" value="${escapeChancelleryDocumentHtml(element.label)}"></label>
        <label class="chancellery-doc-muted">Placeholder<input class="chancellery-doc-edit" type="text" data-doc-prop="placeholder" value="${escapeChancelleryDocumentHtml(element.placeholder || '')}"></label>
        ${arrange}
        ${deleteBtn}
    </aside>`;
}

function renderChancelleryAppealDocumentMarkup({
    template,
    subject = null,
    fieldValues = null,
    mode = 'fill'
} = {}) {
    const normalized = normalizeChancelleryDocumentTemplate(template);
    const isEdit = mode === 'edit';
    const values = fieldValues || (isEdit
        ? getChancelleryDocumentEditorFieldValues()
        : resolveChancelleryAppealFieldValues(null, subject));
    const canvasMode = isEdit && !chancelleryDocumentEditorPreviewFill ? 'edit' : 'fill';
    const toolbar = isEdit ? `
        <div class="chancellery-doc-editor-toolbar" role="toolbar" aria-label="Canvas tools">
            <button type="button" class="lux-secondary-btn" data-chancellery-doc-action="add-box" data-box-type="text"><i class="fas fa-font"></i> Text</button>
            <button type="button" class="lux-secondary-btn" data-chancellery-doc-action="add-box" data-box-type="mergeField"><i class="fas fa-user-tag"></i> Student field</button>
            <button type="button" class="lux-secondary-btn" data-chancellery-doc-action="add-box" data-box-type="inputText"><i class="fas fa-i-cursor"></i> Short input</button>
            <button type="button" class="lux-secondary-btn" data-chancellery-doc-action="add-box" data-box-type="inputLong"><i class="fas fa-align-left"></i> Long input</button>
            <button type="button" class="lux-secondary-btn" data-chancellery-doc-action="add-box" data-box-type="inputChoice"><i class="fas fa-list"></i> Choice</button>
            <button type="button" class="lux-secondary-btn" data-chancellery-doc-action="add-box" data-box-type="table"><i class="fas fa-table"></i> Table</button>
            <button type="button" class="lux-secondary-btn" data-chancellery-doc-action="add-box" data-box-type="shape"><i class="fas fa-square"></i> Shape</button>
            <button type="button" class="lux-secondary-btn" data-chancellery-doc-action="add-box" data-box-type="image"><i class="fas fa-image"></i> Image</button>
            <span class="chancellery-doc-toolbar-sep" aria-hidden="true"></span>
            <button type="button" class="lux-secondary-btn" data-chancellery-doc-action="align-boxes" data-align="left" title="Align left"><i class="fas fa-align-left"></i></button>
            <button type="button" class="lux-secondary-btn" data-chancellery-doc-action="align-boxes" data-align="center" title="Align center"><i class="fas fa-align-center"></i></button>
            <button type="button" class="lux-secondary-btn" data-chancellery-doc-action="align-boxes" data-align="right" title="Align right"><i class="fas fa-align-right"></i></button>
            <button type="button" class="lux-secondary-btn" data-chancellery-doc-action="align-boxes" data-align="top" title="Align top"><i class="fas fa-arrow-up"></i></button>
            <button type="button" class="lux-secondary-btn" data-chancellery-doc-action="align-boxes" data-align="middle" title="Align middle"><i class="fas fa-arrows-alt-v"></i></button>
            <button type="button" class="lux-secondary-btn" data-chancellery-doc-action="align-boxes" data-align="bottom" title="Align bottom"><i class="fas fa-arrow-down"></i></button>
            <button type="button" class="lux-secondary-btn" data-chancellery-doc-action="distribute-boxes" data-distribute="vertical" title="Distribute vertically"><i class="fas fa-grip-lines"></i></button>
            <button type="button" class="lux-secondary-btn" data-chancellery-doc-action="distribute-boxes" data-distribute="horizontal" title="Distribute horizontally"><i class="fas fa-grip-lines-vertical"></i></button>
            <label class="chancellery-doc-toolbar-field" title="Gap used by Tidy">
                <span class="chancellery-doc-muted">Gap</span>
                <input class="chancellery-doc-gap-input" type="number" min="0" max="200" step="2" value="${escapeChancelleryDocumentHtml(chancelleryLayoutTidyGap)}" data-doc-layout-gap="1" aria-label="Tidy gap in pixels">
            </label>
            <button type="button" class="lux-secondary-btn" data-chancellery-doc-action="tidy-column" title="Tidy equal vertical spacing"><i class="fas fa-stream"></i> Tidy</button>
            <button type="button" class="lux-secondary-btn" data-chancellery-doc-action="toggle-preview">${chancelleryDocumentEditorPreviewFill ? '<i class="fas fa-pen"></i> Edit' : '<i class="fas fa-eye"></i> As student'}</button>
        </div>
    ` : '';
    const actions = isEdit ? `
        <div class="chancellery-doc-actions">
            <button type="button" class="lux-secondary-btn" data-chancellery-doc-action="reset-default"><i class="fas fa-rotate-left"></i> Reset to default</button>
            <button type="button" class="lux-primary-btn" data-chancellery-doc-action="save-editor"><i class="fas fa-save"></i> Save document</button>
        </div>
        <div class="chancellery-doc-submit-label-row"><span class="chancellery-doc-muted">Submit button</span><input class="chancellery-doc-edit chancellery-doc-edit--submit" type="text" data-doc-submit-label="1" value="${escapeChancelleryDocumentHtml(normalized.submitLabel)}"></div>
    ` : `
        <div class="chancellery-doc-actions">
            <button type="button" class="lux-secondary-btn" data-chancellery-doc-action="close-appeal"><i class="fas fa-times"></i> Cancel</button>
            <button type="button" class="lux-secondary-btn" data-chancellery-doc-action="export-pdf"><i class="fas fa-file-pdf"></i> PDF</button>
            <button type="button" class="lux-secondary-btn" data-chancellery-doc-action="export-docx"><i class="fas fa-file-word"></i> Word</button>
            <button type="button" class="lux-primary-btn" data-chancellery-action="submit-appeal-document"><i class="fas fa-paper-plane"></i> ${escapeChancelleryDocumentHtml(normalized.submitLabel || 'გაგზავნა')}</button>
        </div>
    `;
    const props = isEdit && !chancelleryDocumentEditorPreviewFill
        ? renderChancelleryDocPropsPanel(getSelectedChancelleryDocumentElement())
        : '';
    const closeAction = isEdit ? 'close-editor' : 'close-appeal';
    return `
        <div class="chancellery-doc-shell ${isEdit ? 'is-edit' : 'is-fill'}${chancelleryDocumentEditorPreviewFill && isEdit ? ' is-preview' : ''}">
            <button type="button" class="lux-secondary-btn chancellery-doc-close" data-lux-skip-modern-button="true" data-chancellery-doc-action="${closeAction}" aria-label="Close"><i class="fas fa-times"></i></button>
            ${toolbar}
            <div class="chancellery-doc-workspace">
                ${renderChancelleryDocCanvas(normalized, {
                    mode: canvasMode,
                    selectedIds: chancelleryDocumentSelectedIds,
                    fieldValues: values,
                    interactive: canvasMode === 'fill'
                })}
                ${props}
            </div>
            ${actions}
        </div>
    `;
}

function syncChancelleryDocumentEditorDraftFromDom() {
    const overlay = document.getElementById('chancellery-document-editor-overlay');
    if (!overlay || !chancelleryDocumentEditorDraft) return chancelleryDocumentEditorDraft;
    overlay.querySelectorAll('[data-doc-box-text]').forEach((node) => {
        const box = node.closest('[data-doc-box]');
        const id = String(box?.getAttribute('data-doc-box') || '').trim();
        const element = (chancelleryDocumentEditorDraft.elements || []).find((item) => item.id === id);
        if (!element || element.type !== 'text') return;
        element.html = sanitizeChancelleryDocumentTextHtml(node.innerHTML) || 'Text';
    });
    overlay.querySelectorAll('[data-doc-table-cell]').forEach((node) => {
        const box = node.closest('[data-doc-box]');
        const id = String(box?.getAttribute('data-doc-box') || '').trim();
        const element = (chancelleryDocumentEditorDraft.elements || []).find((item) => item.id === id);
        if (!element || element.type !== 'table') return;
        const row = Number(node.getAttribute('data-doc-table-row'));
        const col = Number(node.getAttribute('data-doc-table-col'));
        if (!element.cells?.[row]?.[col]) return;
        element.cells[row][col].html = sanitizeChancelleryDocumentTextHtml(node.innerHTML);
    });
    const submitLabel = overlay.querySelector('[data-doc-submit-label]')?.value;
    if (submitLabel != null) {
        chancelleryDocumentEditorDraft.submitLabel = String(submitLabel).trim() || 'გაგზავნა';
    }
    chancelleryDocumentEditorDraft = normalizeChancelleryDocumentTemplate(chancelleryDocumentEditorDraft);
    return chancelleryDocumentEditorDraft;
}

function ensureChancelleryDocumentEditorOverlay() {
    let overlay = document.getElementById('chancellery-document-editor-overlay');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'chancellery-document-editor-overlay';
    overlay.className = 'modal-overlay chancellery-doc-fullscreen-overlay';
    overlay.hidden = true;
    overlay.innerHTML = '<div class="modal-content chancellery-document-editor-modal chancellery-doc-fullscreen-modal" role="dialog" aria-modal="true" aria-labelledby="chancellery-document-editor-title"></div>';
    document.body.appendChild(overlay);
    return overlay;
}

function closeChancelleryDocumentEditor() {
    const overlay = document.getElementById('chancellery-document-editor-overlay');
    if (!overlay) return;
    overlay.hidden = true;
    overlay.classList.remove('active');
    chancelleryDocumentEditorDirty = false;
    chancelleryDocumentEditorDraft = null;
    chancelleryDocumentEditorPreviewFill = false;
    chancelleryDocumentSelectedId = '';
    chancelleryDocumentSelectedIds = [];
    chancelleryCanvasDragState = null;
    chancelleryDocumentSavedFormatRange = null;
    chancelleryActiveTableCell = null;
    chancelleryTableSelection = null;
    clearChancelleryDocGuides();
}

function refreshChancelleryDocumentEditorModal() {
    const overlay = ensureChancelleryDocumentEditorOverlay();
    const panel = overlay.querySelector('.chancellery-document-editor-modal');
    if (!panel || !chancelleryDocumentEditorDraft) return;
    panel.innerHTML = `
        <div class="chancellery-doc-toolbar">
            <div>
                <div class="lux-section-kicker" id="chancellery-document-editor-title">Edit appeal document</div>
                <div class="lux-panel-copy lux-meta">Canva-style page: drag boxes, resize, insert student fields and inputs.</div>
            </div>
        </div>
        ${renderChancelleryAppealDocumentMarkup({
            template: chancelleryDocumentEditorDraft,
            fieldValues: getChancelleryDocumentEditorFieldValues(),
            mode: 'edit'
        })}
    `;
}

function syncChancelleryDocumentSelectionChrome() {
    const overlay = document.getElementById('chancellery-document-editor-overlay');
    if (!overlay || !chancelleryDocumentEditorDraft) return;
    overlay.querySelectorAll('[data-doc-box]').forEach((node) => {
        const id = String(node.getAttribute('data-doc-box') || '');
        const element = (chancelleryDocumentEditorDraft.elements || []).find((item) => item.id === id);
        const selected = chancelleryDocumentSelectedIds.includes(id);
        const primary = selected && id === chancelleryDocumentSelectedId;
        const locked = element?.locked === true;
        node.classList.toggle('is-selected', selected);
        node.classList.toggle('is-locked', locked);
        const handle = node.querySelector('[data-doc-resize]');
        if (primary && !locked && !handle) {
            node.insertAdjacentHTML('beforeend', '<span class="chancellery-doc-resize-handle" data-doc-resize="se"></span>');
        } else if ((!primary || locked) && handle) {
            handle.remove();
        }
    });
    overlay.querySelectorAll('[data-doc-table-cell]').forEach((cell) => {
        const box = cell.closest('[data-doc-box]');
        const id = box?.getAttribute('data-doc-box');
        const row = Number(cell.getAttribute('data-doc-table-row'));
        const col = Number(cell.getAttribute('data-doc-table-col'));
        const active = chancelleryActiveTableCell
            && chancelleryActiveTableCell.boxId === id
            && chancelleryActiveTableCell.row === row
            && chancelleryActiveTableCell.col === col;
        cell.classList.toggle('is-active-cell', Boolean(active));
        cell.classList.toggle('is-multi-selected', isChancelleryTableCellInSelection(id, row, col));
    });
    const workspace = overlay.querySelector('.chancellery-doc-workspace');
    if (!workspace) return;
    const markup = renderChancelleryDocPropsPanel(getSelectedChancelleryDocumentElement());
    const current = workspace.querySelector('.chancellery-doc-props');
    if (current) current.outerHTML = markup;
    else workspace.insertAdjacentHTML('beforeend', markup);
}

function stashChancelleryDocumentFormatRange() {
    const overlay = document.getElementById('chancellery-document-editor-overlay');
    const selection = window.getSelection?.();
    if (!overlay || !selection || selection.rangeCount < 1) return;
    const range = selection.getRangeAt(0);
    const node = range.commonAncestorContainer;
    const el = node.nodeType === 1 ? node : node.parentElement;
    const editable = el?.closest?.('[data-doc-box-text][contenteditable="true"], [data-doc-table-cell][contenteditable="true"]');
    if (!editable || !overlay.contains(editable)) return;
    try {
        chancelleryDocumentSavedFormatRange = range.cloneRange();
    } catch (_error) {
        chancelleryDocumentSavedFormatRange = null;
    }
}

function restoreChancelleryDocumentFormatRange() {
    const overlay = document.getElementById('chancellery-document-editor-overlay');
    const selection = window.getSelection?.();
    const range = chancelleryDocumentSavedFormatRange;
    if (!overlay || !selection || !range) return null;
    try {
        const node = range.commonAncestorContainer;
        const el = node.nodeType === 1 ? node : node.parentElement;
        const editable = el?.closest?.('[data-doc-box-text][contenteditable="true"], [data-doc-table-cell][contenteditable="true"]');
        if (!editable || !overlay.contains(editable)) return null;
        editable.focus();
        selection.removeAllRanges();
        selection.addRange(range);
        return editable;
    } catch (_error) {
        return null;
    }
}

async function openChancelleryDocumentEditor() {
    if (typeof getEffectiveUserRole === 'function' && getEffectiveUserRole() !== USER_ROLES.ADMIN) return;
    const faculty = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
    const template = await fetchChancelleryDocumentTemplate(faculty, { force: true });
    chancelleryDocumentEditorDraft = normalizeChancelleryDocumentTemplate(template);
    chancelleryDocumentEditorDirty = false;
    chancelleryDocumentEditorPreviewFill = false;
    chancelleryDocumentSelectedId = '';
    chancelleryDocumentSelectedIds = [];
    const overlay = ensureChancelleryDocumentEditorOverlay();
    refreshChancelleryDocumentEditorModal();
    overlay.hidden = false;
    overlay.classList.add('active');
}

async function saveChancelleryDocumentEditorDraft() {
    if (chancelleryDocumentEditorSaveInFlight) return;
    const faculty = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
    chancelleryDocumentEditorPreviewFill = false;
    syncChancelleryDocumentEditorDraftFromDom();
    const draft = normalizeChancelleryDocumentTemplate(chancelleryDocumentEditorDraft);
    if (!draft.elements.some((el) => ['inputText', 'inputLong', 'inputChoice'].includes(el.type))) {
        alert('Add at least one student input (text or choice) so the appeal can be submitted.');
        return;
    }
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

function updateSelectedChancelleryBoxFromProps(target) {
    const element = getSelectedChancelleryDocumentElement();
    if (!element || !target) return;
    if (target.matches('[data-doc-prop="fieldKey"]')) {
        const fieldKey = resolveChancelleryMergeFieldKey(target.value);
        element.fieldKey = fieldKey;
        const catalogItem = listChancelleryMergeFieldCatalog().find((item) => item.key === fieldKey);
        if (catalogItem && !String(element.label || '').trim()) element.label = catalogItem.label;
    }
    if (target.matches('[data-doc-prop="label"]')) element.label = String(target.value || '').trim() || element.label;
    if (target.matches('[data-doc-prop="underlineBlank"]') && element.type === 'mergeField') {
        element.underlineBlank = Boolean(target.checked);
    }
    if (target.matches('[data-doc-prop="underlineLengthPct"]') && element.type === 'mergeField') {
        element.underlineLengthPct = clampChancelleryNumber(target.value, 10, 100, 70);
    }
    if (target.matches('[data-doc-prop="underlineAlign"]') && element.type === 'mergeField') {
        const align = String(target.value || '').trim();
        element.underlineAlign = ['start', 'center', 'end'].includes(align) ? align : 'end';
    }
    if (target.matches('[data-doc-prop="placeholder"]')) element.placeholder = String(target.value || '').trim();
    if (target.matches('[data-doc-prop="mode"]')) element.mode = target.value === 'multi' ? 'multi' : 'single';
    if (target.matches('[data-doc-prop="layout"]')) element.layout = target.value === 'stack' ? 'stack' : 'columns';
    if (target.matches('[data-doc-prop="rows"], [data-doc-prop="cols"]') && element.type === 'table') {
        const rows = target.matches('[data-doc-prop="rows"]') ? Number(target.value) : element.rows;
        const cols = target.matches('[data-doc-prop="cols"]') ? Number(target.value) : element.cols;
        const grid = buildChancelleryTableCells(rows, cols, element.cells);
        element.rows = grid.rows;
        element.cols = grid.cols;
        element.cells = grid.cells;
        element.colWidths = normalizeChancellerySizePercentArray(element.colWidths, grid.cols);
        element.rowHeights = normalizeChancellerySizePercentArray(element.rowHeights, grid.rows);
    }
    if (target.matches('[data-doc-prop="borderWidth"]') && element.type === 'table') {
        element.borderWidth = clampChancelleryNumber(target.value, 0, 8, 1.5);
    }
    if (target.matches('[data-doc-prop="borderColor"]') && element.type === 'table') {
        element.borderColor = sanitizeChancelleryDocumentColor(target.value, '#111111');
    }
    if (target.matches('[data-doc-prop="innerBorderWidth"]') && element.type === 'table') {
        element.innerBorderWidth = clampChancelleryNumber(target.value, 0, 8, 1.5);
    }
    if (target.matches('[data-doc-prop="innerBorderColor"]') && element.type === 'table') {
        element.innerBorderColor = sanitizeChancelleryDocumentColor(target.value, '#111111');
    }
    if (target.matches('[data-doc-prop="headerRow"]') && element.type === 'table') {
        element.headerRow = Boolean(target.checked);
    }
    if (target.matches('[data-doc-prop="colWidthPct"], [data-doc-prop="rowHeightPct"]') && element.type === 'table') {
        const active = chancelleryActiveTableCell?.boxId === element.id ? chancelleryActiveTableCell : null;
        if (active) {
            if (target.matches('[data-doc-prop="colWidthPct"]')) {
                const widths = normalizeChancellerySizePercentArray(element.colWidths, element.cols);
                widths[active.col] = clampChancelleryNumber(target.value, 1, 100, widths[active.col]);
                element.colWidths = normalizeChancellerySizePercentArray(widths, element.cols);
            }
            if (target.matches('[data-doc-prop="rowHeightPct"]')) {
                const heights = normalizeChancellerySizePercentArray(element.rowHeights, element.rows);
                heights[active.row] = clampChancelleryNumber(target.value, 1, 100, heights[active.row]);
                element.rowHeights = normalizeChancellerySizePercentArray(heights, element.rows);
            }
        }
    }
    if (target.matches('[data-doc-prop="cellFillMode"], [data-doc-prop="cellFill"], [data-doc-prop="cellVAlign"]') && element.type === 'table') {
        const active = chancelleryActiveTableCell?.boxId === element.id ? chancelleryActiveTableCell : null;
        const cell = active ? element.cells?.[active.row]?.[active.col] : null;
        if (cell) {
            if (target.matches('[data-doc-prop="cellFillMode"]')) {
                cell.fill = target.value === 'solid'
                    ? sanitizeChancelleryDocumentColor(
                        document.querySelector('#chancellery-document-editor-overlay [data-doc-prop="cellFill"]')?.value,
                        '#ffffff'
                    )
                    : 'transparent';
            }
            if (target.matches('[data-doc-prop="cellFill"]')) {
                const mode = document.querySelector('#chancellery-document-editor-overlay [data-doc-prop="cellFillMode"]')?.value;
                cell.fill = mode === 'transparent' ? 'transparent' : sanitizeChancelleryDocumentColor(target.value, '#ffffff');
            }
            if (target.matches('[data-doc-prop="cellVAlign"]')) {
                const vAlign = String(target.value || '').trim();
                cell.vAlign = ['top', 'middle', 'bottom'].includes(vAlign) ? vAlign : 'top';
            }
        }
    }
    if (target.matches('[data-doc-prop="lineHeight"]') && element.type === 'text') {
        element.lineHeight = clampChancelleryNumber(target.value, 0.8, 3, 1.35);
    }
    if (target.matches('[data-doc-prop="paragraphSpacingPt"]') && element.type === 'text') {
        element.paragraphSpacingPt = clampChancelleryNumber(target.value, 0, 48, 0);
    }
    if (target.matches('[data-doc-prop="shapeKind"]') && element.type === 'shape') {
        const kind = String(target.value || '').trim();
        element.shapeKind = ['rect', 'oval', 'line'].includes(kind) ? kind : 'rect';
    }
    if (target.matches('[data-doc-prop="cornerRadius"]') && element.type === 'shape') {
        element.cornerRadius = clampChancelleryNumber(target.value, 0, 200, 0);
    }
    if (target.matches('[data-doc-prop="rotation"]') && (element.type === 'shape' || element.type === 'image')) {
        element.rotation = clampChancelleryNumber(target.value, -360, 360, 0);
    }
    if (target.matches('[data-doc-prop="opacity"]') && (element.type === 'shape' || element.type === 'image')) {
        element.opacity = clampChancelleryNumber(target.value, 0, 1, 1);
    }
    if (target.matches('[data-doc-prop="strokeWidth"]') && element.type === 'shape') {
        element.strokeWidth = clampChancelleryNumber(target.value, 0, 12, 1.5);
    }
    if (target.matches('[data-doc-prop="strokeColor"]') && element.type === 'shape') {
        element.strokeColor = sanitizeChancelleryDocumentColor(target.value, '#111111');
    }
    if (target.matches('[data-doc-prop="fillMode"]') && element.type === 'shape') {
        element.fill = target.value === 'solid'
            ? sanitizeChancelleryDocumentColor(document.querySelector('#chancellery-document-editor-overlay [data-doc-prop="fill"]')?.value, '#ffffff')
            : 'transparent';
    }
    if (target.matches('[data-doc-prop="fill"]') && element.type === 'shape') {
        const mode = document.querySelector('#chancellery-document-editor-overlay [data-doc-prop="fillMode"]')?.value;
        element.fill = mode === 'transparent' ? 'transparent' : sanitizeChancelleryDocumentColor(target.value, '#ffffff');
    }
    if (target.matches('[data-doc-prop="src"]') && element.type === 'image') {
        element.src = sanitizeChancelleryDocumentImageSrc(target.value);
    }
    if (target.matches('[data-doc-prop="alt"]') && element.type === 'image') {
        element.alt = String(target.value || '').trim().slice(0, 200);
    }
    if (target.matches('[data-doc-prop="objectFit"]') && element.type === 'image') {
        const fit = String(target.value || '').trim();
        element.objectFit = ['contain', 'cover', 'fill'].includes(fit) ? fit : 'contain';
    }
    if (target.matches('[data-doc-prop="cropTop"], [data-doc-prop="cropRight"], [data-doc-prop="cropBottom"], [data-doc-prop="cropLeft"]') && element.type === 'image') {
        const crop = normalizeChancelleryImageCrop(element.crop);
        if (target.matches('[data-doc-prop="cropTop"]')) crop.top = clampChancelleryNumber(target.value, 0, 0.45, 0);
        if (target.matches('[data-doc-prop="cropRight"]')) crop.right = clampChancelleryNumber(target.value, 0, 0.45, 0);
        if (target.matches('[data-doc-prop="cropBottom"]')) crop.bottom = clampChancelleryNumber(target.value, 0, 0.45, 0);
        if (target.matches('[data-doc-prop="cropLeft"]')) crop.left = clampChancelleryNumber(target.value, 0, 0.45, 0);
        element.crop = crop;
    }
    if (target.matches('[data-doc-prop-option-label]')) {
        const index = Number(target.getAttribute('data-doc-prop-option-label'));
        if (element.options?.[index]) {
            element.options[index].label = String(target.value || '').trim() || `Option ${index + 1}`;
        }
    }
    markChancelleryDocumentEditorDirty();
}

function applyChancelleryDocumentInlineStyle(styleProp = '', styleValue = '') {
    const overlay = document.getElementById('chancellery-document-editor-overlay');
    if (!overlay || !styleProp || !styleValue) return;
    let editable = restoreChancelleryDocumentFormatRange();
    if (!editable) {
        const selection = window.getSelection?.();
        const anchor = selection?.anchorNode;
        editable = anchor?.nodeType === 1
            ? anchor.closest?.('[data-doc-box-text][contenteditable="true"], [data-doc-table-cell][contenteditable="true"]')
            : anchor?.parentElement?.closest?.('[data-doc-box-text][contenteditable="true"], [data-doc-table-cell][contenteditable="true"]');
        if (!editable && chancelleryDocumentSelectedId) {
            editable = overlay.querySelector(`[data-doc-box="${chancelleryDocumentSelectedId}"] [contenteditable="true"]`);
        }
        if (editable) editable.focus();
    }
    if (!editable) return;
    const selection = window.getSelection?.();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    try {
        document.execCommand('styleWithCSS', false, true);
        if (styleProp === 'font-family') {
            document.execCommand('fontName', false, styleValue);
        } else if (styleProp === 'font-size') {
            document.execCommand('fontSize', false, '7');
            editable.querySelectorAll('font[size="7"]').forEach((node) => {
                const span = document.createElement('span');
                span.style.fontSize = styleValue;
                while (node.firstChild) span.appendChild(node.firstChild);
                node.replaceWith(span);
            });
        } else if (styleProp === 'color') {
            document.execCommand('foreColor', false, styleValue);
        } else if (styleProp === 'background-color') {
            try {
                document.execCommand('hiliteColor', false, styleValue);
            } catch (_err) {
                document.execCommand('backColor', false, styleValue);
            }
        }
    } catch (_error) {
        /* ignore unsupported command */
    }
    stashChancelleryDocumentFormatRange();
    syncChancelleryDocumentEditorDraftFromDom();
    markChancelleryDocumentEditorDirty();
}

function applyChancelleryDocumentTextFormat(command = '', value = null) {
    const overlay = document.getElementById('chancellery-document-editor-overlay');
    if (!overlay) return;
    let editable = restoreChancelleryDocumentFormatRange();
    if (!editable) {
        const selection = window.getSelection?.();
        const anchor = selection?.anchorNode;
        editable = anchor?.nodeType === 1
            ? anchor.closest?.('[data-doc-box-text][contenteditable="true"], [data-doc-table-cell][contenteditable="true"]')
            : anchor?.parentElement?.closest?.('[data-doc-box-text][contenteditable="true"], [data-doc-table-cell][contenteditable="true"]');
        if (!editable && chancelleryDocumentSelectedId) {
            editable = overlay.querySelector(`[data-doc-box="${chancelleryDocumentSelectedId}"] [contenteditable="true"]`);
        }
        if (editable) editable.focus();
    }
    if (!editable) return;
    try {
        document.execCommand('styleWithCSS', false, true);
        if (command === 'fontSize' && value != null) {
            document.execCommand('fontSize', false, String(value));
        } else {
            document.execCommand(command, false, value);
        }
    } catch (_error) {
        /* ignore unsupported command */
    }
    stashChancelleryDocumentFormatRange();
    syncChancelleryDocumentEditorDraftFromDom();
    markChancelleryDocumentEditorDirty();
}

function focusChancelleryDocumentTableCell(cell) {
    if (!cell) return;
    cell.focus();
    const selection = window.getSelection?.();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(cell);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    stashChancelleryDocumentFormatRange();
}

function loadChancelleryDocumentImageFile(file) {
    const element = getSelectedChancelleryDocumentElement();
    if (!element || element.type !== 'image' || !file) return;
    if (!/^image\/(png|jpe?g|gif|webp)$/i.test(file.type)) {
        alert('Use a PNG, JPEG, GIF, or WebP image.');
        return;
    }
    if (file.size > 900_000) {
        alert('Image is too large (max ~900KB).');
        return;
    }
    const reader = new FileReader();
    reader.onload = () => {
        const src = sanitizeChancelleryDocumentImageSrc(String(reader.result || ''));
        if (!src) {
            alert('Could not read that image.');
            return;
        }
        element.src = src;
        if (!element.alt) element.alt = String(file.name || 'Image').slice(0, 200);
        markChancelleryDocumentEditorDirty();
        refreshChancelleryDocumentEditorModal();
    };
    reader.readAsDataURL(file);
}

function bindChancelleryDocumentEditorDelegates() {
    if (document.documentElement.dataset.chancelleryDocumentEditorBound === '1') return;

    document.addEventListener('pointerdown', (event) => {
        const overlay = document.getElementById('chancellery-document-editor-overlay');
        if (!overlay || overlay.hidden || chancelleryDocumentEditorPreviewFill) return;
        if (event.target.closest('[data-chancellery-doc-action="format-text"]')) {
            event.preventDefault();
            stashChancelleryDocumentFormatRange();
            return;
        }
        if (event.target.closest('[data-chancellery-doc-action="format-font-family"], [data-chancellery-doc-action="format-font-size-pt"], [data-chancellery-doc-action="format-fore-color"], [data-chancellery-doc-action="format-hilite-color"]')) {
            stashChancelleryDocumentFormatRange();
            return;
        }
        if (event.target.closest('.chancellery-doc-props, .chancellery-doc-editor-toolbar, .chancellery-doc-actions, .chancellery-doc-close')) {
            return;
        }
        const resize = event.target.closest('[data-doc-resize]');
        const box = event.target.closest('[data-doc-box]');
        if (resize && box) {
            event.preventDefault();
            const id = box.getAttribute('data-doc-box');
            const element = (chancelleryDocumentEditorDraft?.elements || []).find((item) => item.id === id);
            if (!element || element.locked) return;
            setChancelleryDocumentSelection(
                chancelleryDocumentSelectedIds.includes(id) ? chancelleryDocumentSelectedIds : [id],
                { primaryId: id }
            );
            chancelleryCanvasDragState = {
                mode: 'resize',
                id,
                startX: event.clientX,
                startY: event.clientY,
                origW: element.w,
                origH: element.h
            };
            box.setPointerCapture?.(event.pointerId);
            return;
        }
        if (box && event.target.closest('[data-doc-box-text], [data-doc-table-cell]')) {
            const id = box.getAttribute('data-doc-box');
            const tableCell = event.target.closest('[data-doc-table-cell]');
            if (tableCell) {
                const row = Number(tableCell.getAttribute('data-doc-table-row'));
                const col = Number(tableCell.getAttribute('data-doc-table-col'));
                setChancelleryTableCellSelection(id, row, col, { extend: Boolean(event.shiftKey) });
            }
            if (id && (!chancelleryDocumentSelectedIds.includes(id) || chancelleryDocumentSelectedIds.length > 1)) {
                syncChancelleryDocumentEditorDraftFromDom();
                setChancelleryDocumentSelection([id]);
            }
            syncChancelleryDocumentSelectionChrome();
            return;
        }
        if (box && !event.target.closest('[data-doc-box-text], [data-doc-table-cell], input, textarea, select, button')) {
            const id = box.getAttribute('data-doc-box');
            const element = (chancelleryDocumentEditorDraft?.elements || []).find((item) => item.id === id);
            if (!element) return;
            syncChancelleryDocumentEditorDraftFromDom();
            if (event.shiftKey) {
                const next = chancelleryDocumentSelectedIds.includes(id)
                    ? chancelleryDocumentSelectedIds.filter((item) => item !== id)
                    : [...chancelleryDocumentSelectedIds, id];
                setChancelleryDocumentSelection(next.length ? next : [id], { primaryId: id });
                refreshChancelleryDocumentEditorModal();
                return;
            }
            if (!chancelleryDocumentSelectedIds.includes(id) || chancelleryDocumentSelectedIds.length > 1) {
                setChancelleryDocumentSelection([id]);
                refreshChancelleryDocumentEditorModal();
                return;
            }
            setChancelleryDocumentSelection([id]);
            if (element.locked) return;
            chancelleryCanvasDragState = {
                mode: 'move',
                id,
                startX: event.clientX,
                startY: event.clientY,
                origX: element.x,
                origY: element.y,
                disableSnap: Boolean(event.altKey)
            };
            box.setPointerCapture?.(event.pointerId);
        }
    });

    document.addEventListener('pointermove', (event) => {
        if (!chancelleryCanvasDragState || !chancelleryDocumentEditorDraft) return;
        const element = (chancelleryDocumentEditorDraft.elements || [])
            .find((item) => item.id === chancelleryCanvasDragState.id);
        if (!element) return;
        const page = chancelleryDocumentEditorDraft.page;
        const dx = event.clientX - chancelleryCanvasDragState.startX;
        const dy = event.clientY - chancelleryCanvasDragState.startY;
        if (chancelleryCanvasDragState.mode === 'move') {
            element.x = clampChancelleryNumber(chancelleryCanvasDragState.origX + dx, 0, page.width - 20, element.x);
            element.y = clampChancelleryNumber(chancelleryCanvasDragState.origY + dy, 0, page.height - 20, element.y);
            if (!event.altKey && !chancelleryCanvasDragState.disableSnap) {
                const others = (chancelleryDocumentEditorDraft.elements || [])
                    .filter((item) => item.id !== element.id);
                const snapped = snapChancelleryBoxPosition(element, others, page);
                element.x = snapped.x;
                element.y = snapped.y;
                renderChancelleryDocGuides(snapped.guides);
            } else {
                clearChancelleryDocGuides();
            }
        } else {
            element.w = clampChancelleryNumber(chancelleryCanvasDragState.origW + dx, 40, page.width - element.x, element.w);
            element.h = clampChancelleryNumber(chancelleryCanvasDragState.origH + dy, 24, page.height - element.y, element.h);
            clearChancelleryDocGuides();
        }
        applyChancelleryElementDomPosition(element);
        markChancelleryDocumentEditorDirty();
    });

    document.addEventListener('pointerup', () => {
        if (!chancelleryCanvasDragState) return;
        chancelleryCanvasDragState = null;
        clearChancelleryDocGuides();
    });

    document.addEventListener('click', (event) => {
        const trigger = event.target.closest('[data-chancellery-doc-action]');
        if (!trigger) {
            if (event.target.id === 'chancellery-document-editor-overlay') closeChancelleryDocumentEditor();
            return;
        }
        const action = trigger.getAttribute('data-chancellery-doc-action');
        if (action === 'close-editor') {
            closeChancelleryDocumentEditor();
            return;
        }
        if (action === 'close-appeal') {
            closeChancelleryAppealModal();
            return;
        }
        if (action === 'export-pdf') {
            exportChancelleryLetter('pdf').catch((error) => alert(error?.message || 'PDF export failed.'));
            return;
        }
        if (action === 'export-docx') {
            exportChancelleryLetter('docx').catch((error) => alert(error?.message || 'Word export failed.'));
            return;
        }
        if (action === 'save-editor') {
            saveChancelleryDocumentEditorDraft();
            return;
        }
        if (action === 'reset-default') {
            chancelleryDocumentEditorDraft = normalizeChancelleryDocumentTemplate(buildDefaultChancelleryDocumentTemplate());
            setChancelleryDocumentSelection([]);
            chancelleryDocumentEditorPreviewFill = false;
            markChancelleryDocumentEditorDirty();
            refreshChancelleryDocumentEditorModal();
            return;
        }
        if (action === 'toggle-preview') {
            syncChancelleryDocumentEditorDraftFromDom();
            chancelleryDocumentEditorPreviewFill = !chancelleryDocumentEditorPreviewFill;
            refreshChancelleryDocumentEditorModal();
            return;
        }
        if (action === 'align-boxes') {
            syncChancelleryDocumentEditorDraftFromDom();
            if (alignChancelleryElements(trigger.getAttribute('data-align') || 'left')) {
                refreshChancelleryDocumentEditorModal();
            }
            return;
        }
        if (action === 'distribute-boxes') {
            syncChancelleryDocumentEditorDraftFromDom();
            if (distributeChancelleryElements(trigger.getAttribute('data-distribute') || 'vertical')) {
                refreshChancelleryDocumentEditorModal();
            }
            return;
        }
        if (action === 'tidy-column') {
            syncChancelleryDocumentEditorDraftFromDom();
            const gapInput = document.querySelector('#chancellery-document-editor-overlay [data-doc-layout-gap]');
            const gap = gapInput ? Number(gapInput.value) : chancelleryLayoutTidyGap;
            if (tidyChancelleryColumnSpacing(gap)) {
                refreshChancelleryDocumentEditorModal();
            }
            return;
        }
        if (action === 'add-box') {
            syncChancelleryDocumentEditorDraftFromDom();
            const type = trigger.getAttribute('data-box-type') || 'text';
            const box = createChancelleryDocumentBoxDraft(type, chancelleryDocumentEditorDraft.page);
            chancelleryDocumentEditorDraft.elements.push(box);
            setChancelleryDocumentSelection([box.id]);
            markChancelleryDocumentEditorDirty();
            refreshChancelleryDocumentEditorModal();
            return;
        }
        if (action === 'format-text') {
            const format = trigger.getAttribute('data-format') || 'bold';
            const fontSize = trigger.getAttribute('data-font-size');
            applyChancelleryDocumentTextFormat(format, fontSize);
            return;
        }
        if (action === 'duplicate-box') {
            duplicateChancelleryDocumentBox(trigger.getAttribute('data-doc-box-id') || '');
            return;
        }
        if (action === 'toggle-lock') {
            toggleChancelleryDocumentBoxLock(trigger.getAttribute('data-doc-box-id') || '');
            return;
        }
        if (action === 'bring-forward') {
            nudgeChancelleryDocumentBoxZ('forward', trigger.getAttribute('data-doc-box-id') || '');
            return;
        }
        if (action === 'send-backward') {
            nudgeChancelleryDocumentBoxZ('backward', trigger.getAttribute('data-doc-box-id') || '');
            return;
        }
        if (action === 'center-on-page') {
            centerChancelleryDocumentBoxOnPage(trigger.getAttribute('data-doc-box-id') || '');
            return;
        }
        if (action === 'clear-image') {
            const element = getSelectedChancelleryDocumentElement();
            if (!element || element.type !== 'image') return;
            element.src = '';
            markChancelleryDocumentEditorDirty();
            refreshChancelleryDocumentEditorModal();
            return;
        }
        if (action === 'table-insert-row') {
            insertChancelleryTableRow(trigger.getAttribute('data-where') || 'below');
            return;
        }
        if (action === 'table-delete-row') {
            deleteChancelleryTableRow();
            return;
        }
        if (action === 'table-insert-col') {
            insertChancelleryTableCol(trigger.getAttribute('data-where') || 'right');
            return;
        }
        if (action === 'table-delete-col') {
            deleteChancelleryTableCol();
            return;
        }
        if (action === 'table-merge-right') {
            mergeChancelleryTableCellRight();
            return;
        }
        if (action === 'table-merge-selection') {
            mergeChancelleryTableSelection();
            return;
        }
        if (action === 'table-split-cell') {
            splitChancelleryTableCell();
            return;
        }
        if (action === 'table-distribute-cols') {
            distributeChancelleryTableColumns();
            return;
        }
        if (action === 'table-distribute-rows') {
            distributeChancelleryTableRows();
            return;
        }
        if (action === 'delete-box') {
            event.preventDefault();
            event.stopPropagation();
            syncChancelleryDocumentEditorDraftFromDom();
            const explicitId = String(trigger.getAttribute('data-doc-box-id') || '').trim();
            const ids = chancelleryDocumentSelectedIds.length > 1
                ? [...chancelleryDocumentSelectedIds]
                : (explicitId
                    ? [explicitId]
                    : (chancelleryDocumentSelectedIds.length
                        ? [...chancelleryDocumentSelectedIds]
                        : (chancelleryDocumentSelectedId ? [chancelleryDocumentSelectedId] : [])));
            if (!ids.length) {
                alert('Select a box to delete.');
                return;
            }
            const elements = chancelleryDocumentEditorDraft.elements || [];
            const isStudentInput = (item) => ['inputText', 'inputLong', 'inputChoice'].includes(item?.type);
            const remainingInputs = elements.filter(isStudentInput);
            const deletingInputs = remainingInputs.filter((item) => ids.includes(item.id));
            if (deletingInputs.length && remainingInputs.length - deletingInputs.length < 1) {
                alert('Keep at least one student input (text or choice) so the appeal can be submitted.');
                return;
            }
            chancelleryDocumentEditorDraft.elements = elements.filter((item) => !ids.includes(item.id));
            setChancelleryDocumentSelection([]);
            markChancelleryDocumentEditorDirty();
            refreshChancelleryDocumentEditorModal();
            return;
        }
        if (action === 'add-choice-option') {
            const element = getSelectedChancelleryDocumentElement();
            if (!element || element.type !== 'inputChoice') return;
            element.options = [
                ...(element.options || []),
                { id: createChancelleryDocumentElementId('option'), label: `Option ${(element.options || []).length + 1}` }
            ];
            markChancelleryDocumentEditorDirty();
            refreshChancelleryDocumentEditorModal();
            return;
        }
        if (action === 'remove-choice-option') {
            const element = getSelectedChancelleryDocumentElement();
            if (!element || element.type !== 'inputChoice') return;
            const index = Number(trigger.getAttribute('data-option-index'));
            if ((element.options || []).length <= 1) {
                alert('Keep at least one option.');
                return;
            }
            element.options.splice(index, 1);
            markChancelleryDocumentEditorDirty();
            refreshChancelleryDocumentEditorModal();
        }
    });

    document.addEventListener('input', (event) => {
        if (!event.target.closest?.('#chancellery-document-editor-overlay')) return;
        if (event.target.matches('[data-doc-layout-gap]')) {
            chancelleryLayoutTidyGap = clampChancelleryNumber(event.target.value, 0, 200, CHANCELLERY_LAYOUT_TIDY_GAP);
            return;
        }
        if (event.target.matches('[data-doc-prop], [data-doc-prop-option-label]')) {
            updateSelectedChancelleryBoxFromProps(event.target);
            return;
        }
        markChancelleryDocumentEditorDirty();
    });

    document.addEventListener('change', (event) => {
        if (!event.target.closest?.('#chancellery-document-editor-overlay')) return;
        if (event.target.matches('[data-doc-prop], [data-doc-prop-option-label]')) {
            updateSelectedChancelleryBoxFromProps(event.target);
            if (event.target.matches('[data-doc-prop="fieldKey"], [data-doc-prop="mode"], [data-doc-prop="layout"], [data-doc-prop="rows"], [data-doc-prop="cols"], [data-doc-prop="borderWidth"], [data-doc-prop="borderColor"], [data-doc-prop="innerBorderWidth"], [data-doc-prop="innerBorderColor"], [data-doc-prop="headerRow"], [data-doc-prop="colWidthPct"], [data-doc-prop="rowHeightPct"], [data-doc-prop="strokeWidth"], [data-doc-prop="strokeColor"], [data-doc-prop="fill"], [data-doc-prop="fillMode"], [data-doc-prop="shapeKind"], [data-doc-prop="cornerRadius"], [data-doc-prop="rotation"], [data-doc-prop="opacity"], [data-doc-prop="objectFit"], [data-doc-prop="src"], [data-doc-prop="cropTop"], [data-doc-prop="cropRight"], [data-doc-prop="cropBottom"], [data-doc-prop="cropLeft"], [data-doc-prop="lineHeight"], [data-doc-prop="paragraphSpacingPt"], [data-doc-prop="cellFillMode"], [data-doc-prop="cellFill"], [data-doc-prop="cellVAlign"], [data-doc-prop="underlineBlank"], [data-doc-prop="underlineLengthPct"], [data-doc-prop="underlineAlign"]')) {
                refreshChancelleryDocumentEditorModal();
            }
        }
        if (event.target.matches('[data-doc-prop="imageFile"]') && event.target.files?.[0]) {
            loadChancelleryDocumentImageFile(event.target.files[0]);
        }
        if (event.target.matches('[data-chancellery-doc-action="format-font-family"]') && event.target.value) {
            applyChancelleryDocumentInlineStyle('font-family', event.target.value);
            event.target.selectedIndex = 0;
        }
        if (event.target.matches('[data-chancellery-doc-action="format-font-size-pt"]') && event.target.value) {
            applyChancelleryDocumentInlineStyle('font-size', `${event.target.value}pt`);
            event.target.selectedIndex = 0;
        }
        if (event.target.matches('[data-chancellery-doc-action="format-fore-color"]')) {
            applyChancelleryDocumentInlineStyle('color', event.target.value);
        }
        if (event.target.matches('[data-chancellery-doc-action="format-hilite-color"]')) {
            applyChancelleryDocumentInlineStyle('background-color', event.target.value);
        }
    });

    document.addEventListener('mouseup', (event) => {
        const overlay = document.getElementById('chancellery-document-editor-overlay');
        if (!overlay || overlay.hidden || chancelleryDocumentEditorPreviewFill) return;
        if (event.target.closest?.('[data-doc-box-text][contenteditable="true"], [data-doc-table-cell][contenteditable="true"]')) {
            stashChancelleryDocumentFormatRange();
        }
    });

    document.addEventListener('keyup', (event) => {
        const overlay = document.getElementById('chancellery-document-editor-overlay');
        if (!overlay || overlay.hidden || chancelleryDocumentEditorPreviewFill) return;
        if (event.target.closest?.('[data-doc-box-text][contenteditable="true"], [data-doc-table-cell][contenteditable="true"]')) {
            stashChancelleryDocumentFormatRange();
        }
    });

    document.addEventListener('keydown', (event) => {
        const overlay = document.getElementById('chancellery-document-editor-overlay');
        if (!overlay || overlay.hidden || chancelleryDocumentEditorPreviewFill) return;
        if (event.key === 'Tab') {
            const cell = event.target.closest?.('[data-doc-table-cell][contenteditable="true"]');
            if (!cell || !overlay.contains(cell)) return;
            const table = cell.closest('table');
            const cells = [...(table?.querySelectorAll('[data-doc-table-cell][contenteditable="true"]') || [])];
            const index = cells.indexOf(cell);
            if (index < 0) return;
            const next = event.shiftKey ? cells[index - 1] : cells[index + 1];
            if (!next) return;
            event.preventDefault();
            syncChancelleryDocumentEditorDraftFromDom();
            const box = next.closest('[data-doc-box]');
            chancelleryActiveTableCell = {
                boxId: box?.getAttribute('data-doc-box') || '',
                row: Number(next.getAttribute('data-doc-table-row')),
                col: Number(next.getAttribute('data-doc-table-col'))
            };
            focusChancelleryDocumentTableCell(next);
            syncChancelleryDocumentSelectionChrome();
            return;
        }
        if (event.key !== 'Delete' && event.key !== 'Backspace') return;
        if (event.target.closest('input, textarea, [contenteditable="true"]')) return;
        if (!chancelleryDocumentSelectedId) return;
        event.preventDefault();
        const deleteBtn = overlay.querySelector('[data-chancellery-doc-action="delete-box"]');
        deleteBtn?.click();
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
        <div class="modal-content chancellery-appeal-modal chancellery-doc-fullscreen-modal" role="dialog" aria-modal="true" aria-labelledby="chancellery-appeal-title">
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
    const fieldValues = resolveChancelleryAppealFieldValues(null, subject);
    chancelleryAppealPendingSubjectKey = key;
    const overlay = ensureChancelleryAppealOverlay();
    const panel = overlay.querySelector('#chancellery-appeal-panel');
    if (panel) {
        panel.innerHTML = renderChancelleryAppealDocumentMarkup({
            template,
            subject,
            fieldValues,
            mode: 'fill'
        });
    }
    overlay.hidden = false;
    overlay.classList.add('active');
}

function readChancelleryAppealFormValues() {
    const overlay = document.getElementById('chancellery-appeal-overlay');
    const faculty = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
    const template = getCachedChancelleryDocumentTemplate(faculty)
        || normalizeChancelleryDocumentTemplate(buildDefaultChancelleryDocumentTemplate());
    const answers = {};
    let message = '';
    let examOption = '';
    let examOptionLabel = '';
    let hasChoice = false;

    (template.elements || []).forEach((element) => {
        if (element.type === 'inputText' || element.type === 'inputLong') {
            const node = overlay?.querySelector(`[data-doc-answer="${element.id}"]`);
            const value = String(node?.value || '').trim();
            answers[element.id] = value;
            if (!message && value) message = value;
            return;
        }
        if (element.type === 'inputChoice') {
            hasChoice = true;
            const nodes = [...(overlay?.querySelectorAll(`[data-doc-answer="${element.id}"]`) || [])];
            if (element.mode === 'multi') {
                const selected = nodes.filter((node) => node.checked).map((node) => node.value);
                answers[element.id] = selected;
                if (!examOption && selected[0]) {
                    examOption = selected[0];
                    examOptionLabel = (element.options || []).find((opt) => opt.id === selected[0])?.label || selected[0];
                }
            } else {
                const selected = nodes.find((node) => node.checked);
                const value = String(selected?.value || '').trim();
                answers[element.id] = value;
                if (!examOption && value) {
                    examOption = value;
                    examOptionLabel = (element.options || []).find((opt) => opt.id === value)?.label || value;
                }
            }
        }
    });

    if (!message) {
        message = String(overlay?.querySelector('.chancellery-doc-message')?.value || '').trim();
    }

    const fieldValues = {};
    overlay?.querySelectorAll('[data-doc-autofill]').forEach((node) => {
        const key = String(node.getAttribute('data-doc-autofill') || '').trim();
        if (!key) return;
        fieldValues[key] = String(node.textContent || '').trim();
    });

    const canvas = overlay?.querySelector('[data-chancellery-doc-canvas]');
    let documentHtmlSnapshot = '';
    if (canvas) {
        const cloneRoot = canvas.cloneNode(true);
        cloneRoot.querySelectorAll('textarea, input').forEach((node) => {
            if (node.tagName === 'TEXTAREA') node.textContent = node.value || '';
            else if (node.type === 'radio' || node.type === 'checkbox') {
                if (node.checked) node.setAttribute('checked', 'checked');
                else node.removeAttribute('checked');
            } else node.setAttribute('value', node.value || '');
            node.setAttribute('readonly', 'readonly');
            node.setAttribute('disabled', 'disabled');
        });
        documentHtmlSnapshot = cloneRoot.outerHTML;
    }

    return {
        examOption,
        examOptionLabel,
        message,
        subjectKey: chancelleryAppealPendingSubjectKey,
        fieldValues,
        answers,
        documentHtmlSnapshot,
        documentElementsSnapshot: buildChancelleryExportElementSnapshot(template, fieldValues, answers),
        hasExamOptions: hasChoice
    };
}

function stripChancelleryHtmlToText(html = '') {
    const host = document.createElement('div');
    host.innerHTML = String(html || '');
    return String(host.textContent || '').replace(/\s+/g, ' ').trim();
}

function buildChancelleryExportElementSnapshot(template, fieldValues = {}, answers = {}) {
    const normalized = normalizeChancelleryDocumentTemplate(template);
    return (normalized.elements || []).map((element) => {
        const item = {
            id: element.id,
            type: element.type,
            x: element.x,
            y: element.y,
            w: element.w,
            h: element.h,
            z: element.z,
            label: element.label || '',
            text: ''
        };
        if (element.type === 'text') {
            item.text = stripChancelleryHtmlToText(element.html);
            item.html = element.html || '';
            item.lineHeight = element.lineHeight;
            item.paragraphSpacingPt = element.paragraphSpacingPt;
        } else if (element.type === 'table') {
            item.rows = element.rows;
            item.cols = element.cols;
            item.borderWidth = element.borderWidth;
            item.borderColor = element.borderColor;
            item.innerBorderWidth = element.innerBorderWidth;
            item.innerBorderColor = element.innerBorderColor;
            item.headerRow = element.headerRow === true;
            item.colWidths = element.colWidths || [];
            item.rowHeights = element.rowHeights || [];
            item.cells = (element.cells || []).map((row) => (row || []).map((cell) => ({
                html: cell.html || '',
                text: stripChancelleryHtmlToText(cell.html || ''),
                fill: cell.fill || 'transparent',
                vAlign: cell.vAlign || 'top',
                colspan: cell.colspan || 1,
                rowspan: cell.rowspan || 1
            })));
            item.text = item.cells.map((row) => row.map((cell) => cell.text).join(' | ')).join('\n');
        } else if (element.type === 'shape') {
            item.strokeWidth = element.strokeWidth;
            item.strokeColor = element.strokeColor;
            item.fill = element.fill;
            item.shapeKind = element.shapeKind || 'rect';
            item.cornerRadius = element.cornerRadius || 0;
            item.rotation = element.rotation || 0;
            item.opacity = element.opacity ?? 1;
            item.text = '';
        } else if (element.type === 'image') {
            item.src = element.src || '';
            item.alt = element.alt || '';
            item.objectFit = element.objectFit || 'contain';
            item.crop = element.crop || { top: 0, right: 0, bottom: 0, left: 0 };
            item.rotation = element.rotation || 0;
            item.opacity = element.opacity ?? 1;
            item.text = element.alt || 'Image';
        } else if (element.type === 'mergeField') {
            item.fieldKey = element.fieldKey;
            item.label = element.label || element.fieldKey;
            item.text = String(fieldValues[element.fieldKey] ?? '').trim() || '—';
            item.underlineBlank = element.underlineBlank === true;
            item.underlineLengthPct = element.underlineLengthPct ?? 70;
            item.underlineAlign = element.underlineAlign || 'end';
        } else if (element.type === 'inputText' || element.type === 'inputLong') {
            item.label = element.label || '';
            item.text = String(answers[element.id] ?? '').trim();
        } else if (element.type === 'inputChoice') {
            item.label = element.label || '';
            item.options = (element.options || []).map((opt) => ({ id: opt.id, label: opt.label }));
            const raw = answers[element.id];
            if (Array.isArray(raw)) {
                item.text = raw
                    .map((id) => (element.options || []).find((opt) => opt.id === id)?.label || id)
                    .filter(Boolean)
                    .join(', ');
            } else {
                item.text = (element.options || []).find((opt) => opt.id === raw)?.label || String(raw || '').trim();
            }
        }
        return item;
    });
}

function buildChancelleryExportModelFromRequest(request = {}) {
    const elements = Array.isArray(request.documentElementsSnapshot) && request.documentElementsSnapshot.length
        ? request.documentElementsSnapshot
        : null;
    const page = { width: CHANCELLERY_PAGE_WIDTH, height: CHANCELLERY_PAGE_HEIGHT };
    return {
        title: `Appeal-${request.id || 'letter'}`,
        subjectName: request.subjectName || '',
        studentName: request.studentName || '',
        htmlSnapshot: String(request.documentHtmlSnapshot || '').trim(),
        page,
        elements: elements || [],
        message: String(request.message || '').trim()
    };
}

function buildChancelleryExportModelFromLiveFill() {
    const formValues = readChancelleryAppealFormValues();
    const faculty = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
    const template = getCachedChancelleryDocumentTemplate(faculty)
        || normalizeChancelleryDocumentTemplate(buildDefaultChancelleryDocumentTemplate());
    return {
        title: 'Appeal-letter',
        subjectName: '',
        studentName: '',
        htmlSnapshot: formValues.documentHtmlSnapshot || '',
        page: template.page,
        elements: formValues.documentElementsSnapshot || [],
        message: formValues.message || ''
    };
}

function ensureChancelleryExportLibraries(format = 'pdf') {
    if (typeof window.ensureChancelleryExportLibraries === 'function') {
        return window.ensureChancelleryExportLibraries(format);
    }
    if (typeof window.ensureExamExportLibraries === 'function') {
        return window.ensureExamExportLibraries(format);
    }
    return Promise.reject(new Error('Export libraries are unavailable.'));
}

function exportChancelleryLetterPdf(model = {}) {
    const payload = model && typeof model === 'object' ? model : {};
    const page = payload.page || { width: CHANCELLERY_PAGE_WIDTH, height: CHANCELLERY_PAGE_HEIGHT };
    const htmlSnapshot = String(payload.htmlSnapshot || '').trim();
    const letterHtml = htmlSnapshot || (() => {
        const sorted = [...(payload.elements || [])].sort((a, b) => (a.y - b.y) || (a.x - b.x));
        return `<div class="chancellery-doc-canvas chancellery-doc-letter" style="position:relative;width:${page.width}px;height:${page.height}px;margin:0 auto;background:#fff;">${sorted.map((el) => {
            let body = '';
            if (el.type === 'table') {
                const outerBorder = `${el.borderWidth || 1.5}px solid ${escapeChancelleryDocumentHtml(el.borderColor || '#111')}`;
                const innerBorder = `${el.innerBorderWidth ?? el.borderWidth ?? 1.5}px solid ${escapeChancelleryDocumentHtml(el.innerBorderColor || el.borderColor || '#111')}`;
                const covered = getChancelleryTableCoveredSet(el);
                const colWidths = normalizeChancellerySizePercentArray(el.colWidths, el.cols);
                const rowHeights = normalizeChancellerySizePercentArray(el.rowHeights, el.rows);
                const colgroup = `<colgroup>${colWidths.map((w) => `<col style="width:${w}%">`).join('')}</colgroup>`;
                body = `<table style="width:100%;height:100%;border-collapse:collapse;border:${outerBorder}">${colgroup}<tbody>${(el.cells || []).map((row, rowIndex) => `<tr style="height:${rowHeights[rowIndex] || (100 / Math.max(1, el.rows))}%">${(row || []).map((cell, colIndex) => {
                    if (covered.has(`${rowIndex}:${colIndex}`)) return '';
                    const fill = cell.fill && cell.fill !== 'transparent' && cell.fill !== 'none'
                        ? escapeChancelleryDocumentHtml(cell.fill)
                        : (el.headerRow && rowIndex === 0 ? '#f3f3f3' : 'transparent');
                    const vAlign = ['top', 'middle', 'bottom'].includes(cell.vAlign) ? cell.vAlign : 'top';
                    const tag = el.headerRow && rowIndex === 0 ? 'th' : 'td';
                    const headerStyle = el.headerRow && rowIndex === 0 ? 'font-weight:700;' : '';
                    return `<${tag} colspan="${Math.max(1, Number(cell.colspan) || 1)}" rowspan="${Math.max(1, Number(cell.rowspan) || 1)}" style="border:${innerBorder};padding:8px;text-align:start;vertical-align:${vAlign};background:${fill};${headerStyle}">${cell.html || escapeChancelleryDocumentHtml(cell.text || '')}</${tag}>`;
                }).join('')}</tr>`).join('')}</tbody></table>`;
            } else if (el.type === 'shape') {
                const kind = el.shapeKind || 'rect';
                const opacity = clampChancelleryNumber(el.opacity, 0, 1, 1);
                const rotation = clampChancelleryNumber(el.rotation, -360, 360, 0);
                if (kind === 'line') {
                    body = `<div style="width:100%;height:100%;opacity:${opacity};transform:rotate(${rotation}deg);display:flex;align-items:center"><div style="width:100%;height:${Math.max(1, Number(el.strokeWidth) || 1.5)}px;background:${escapeChancelleryDocumentHtml(el.strokeColor || '#111')}"></div></div>`;
                } else if (kind === 'oval') {
                    body = `<div style="width:100%;height:100%;box-sizing:border-box;border:${el.strokeWidth || 1.5}px solid ${escapeChancelleryDocumentHtml(el.strokeColor || '#111')};background:${escapeChancelleryDocumentHtml(el.fill || 'transparent')};border-radius:50%;opacity:${opacity};transform:rotate(${rotation}deg)"></div>`;
                } else {
                    body = `<div style="width:100%;height:100%;box-sizing:border-box;border:${el.strokeWidth || 1.5}px solid ${escapeChancelleryDocumentHtml(el.strokeColor || '#111')};background:${escapeChancelleryDocumentHtml(el.fill || 'transparent')};border-radius:${clampChancelleryNumber(el.cornerRadius, 0, 200, 0)}px;opacity:${opacity};transform:rotate(${rotation}deg)"></div>`;
                }
            } else if (el.type === 'image' && el.src) {
                const crop = normalizeChancelleryImageCrop(el.crop);
                const clip = `inset(${(crop.top * 100).toFixed(2)}% ${(crop.right * 100).toFixed(2)}% ${(crop.bottom * 100).toFixed(2)}% ${(crop.left * 100).toFixed(2)}%)`;
                body = `<div style="width:100%;height:100%;overflow:hidden;opacity:${clampChancelleryNumber(el.opacity, 0, 1, 1)}"><img src="${escapeChancelleryDocumentHtml(el.src)}" alt="${escapeChancelleryDocumentHtml(el.alt || '')}" style="width:100%;height:100%;object-fit:${escapeChancelleryDocumentHtml(el.objectFit || 'contain')};display:block;clip-path:${clip};transform:rotate(${clampChancelleryNumber(el.rotation, -360, 360, 0)}deg)"></div>`;
            } else if (el.type === 'mergeField') {
                const hasBlank = el.underlineBlank === true;
                const lengthPct = clampChancelleryNumber(el.underlineLengthPct, 10, 100, 70);
                const align = ['start', 'center', 'end'].includes(el.underlineAlign) ? el.underlineAlign : 'end';
                const blank = hasBlank
                    ? `<div class="chancellery-doc-field-blank is-align-${escapeChancelleryDocumentHtml(align)}" style="width:100%;height:0;border-bottom:1.5px solid #111"></div>`
                    : '';
                const valueWrapStyle = hasBlank ? `width:${lengthPct}%;display:inline-flex;flex-direction:column;` : 'display:inline-flex;flex-direction:column;';
                body = `<div class="chancellery-doc-merge-field is-value-label${hasBlank ? ' has-underline-blank' : ''}" style="display:flex;flex-direction:column;justify-content:center;height:100%">
                    <div class="chancellery-doc-merge-row" style="display:flex;align-items:flex-end;justify-content:flex-end;gap:4px;width:100%">
                        <span class="chancellery-doc-merge-value-wrap" style="${valueWrapStyle}">
                            <span class="chancellery-doc-value" style="font-weight:600;${hasBlank ? '' : 'border-bottom:1px solid rgba(0,0,0,0.25);'}">${escapeChancelleryDocumentHtml(el.text || '')}</span>
                            ${blank}
                        </span>
                        <span class="chancellery-doc-merge-sep">:</span>
                        <span class="chancellery-doc-merge-label">${escapeChancelleryDocumentHtml(el.label || el.fieldKey || '')}</span>
                    </div>
                </div>`;
            } else if (el.type === 'inputText' || el.type === 'inputLong' || el.type === 'inputChoice') {
                body = `<div style="font-weight:600;margin-bottom:4px">${escapeChancelleryDocumentHtml(el.label || '')}</div><div>${escapeChancelleryDocumentHtml(el.text || '')}</div>`;
            } else if (el.html) {
                const spacing = `line-height:${Number(el.lineHeight) || 1.35};`;
                body = `<div style="${spacing}">${el.html}</div>`;
            } else {
                body = escapeChancelleryDocumentHtml(el.text || '');
            }
            return `<div style="position:absolute;left:${el.x}px;top:${el.y}px;width:${el.w}px;min-height:${el.h}px;box-sizing:border-box;padding:4px 6px;overflow:hidden">${body}</div>`;
        }).join('')}</div>`;
    })();

    const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1200');
    if (!win) {
        alert('Allow pop-ups to export PDF.');
        return;
    }
    win.document.open();
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeChancelleryDocumentHtml(payload.title || 'Appeal')}</title>
<style>
@page { size: A4; margin: 12mm; }
html, body { margin: 0; padding: 0; background: #fff; color: #111; }
body { font-family: "Noto Serif", "Noto Sans Georgian", Georgia, "Times New Roman", serif; }
.meta { font-family: "Noto Sans", system-ui, sans-serif; font-size: 12px; color: #444; margin: 0 0 12px; }
.chancellery-doc-canvas, .chancellery-doc-letter { box-shadow: none !important; border: none !important; }
.chancellery-doc-exams.is-columns { display:grid; grid-template-columns:repeat(var(--chancellery-exam-cols, 3),minmax(0,1fr)); gap:0; border:1.5px solid #111; min-height:120px; }
.chancellery-doc-exams.is-columns .chancellery-doc-exam,
.chancellery-doc-exams.is-columns .chancellery-doc-choice-option { display:grid; grid-template-rows:1fr auto; gap:10px; justify-items:center; text-align:center; padding:10px 8px 12px; border-right:1.5px solid #111; box-sizing:border-box; }
.chancellery-doc-exams.is-columns .chancellery-doc-exam:last-child,
.chancellery-doc-exams.is-columns .chancellery-doc-choice-option:last-child { border-right:0; }
.chancellery-doc-exam-mark::before { content:"____"; }
.chancellery-doc-exam:has(input:checked) .chancellery-doc-exam-mark::before { content:"_X_"; font-weight:700; }
.chancellery-doc-exam input { position:absolute; opacity:0; width:0; height:0; }
.chancellery-doc-table { width:100%; height:100%; border-collapse:collapse; }
.chancellery-doc-table td, .chancellery-doc-table th { vertical-align:top; padding:8px; }
.chancellery-doc-shape { box-sizing:border-box; }
.chancellery-doc-image { max-width:100%; }
.chancellery-doc-box-text ul, .chancellery-doc-box-text ol { margin:0.25em 0 0.25em 1.25em; }
.chancellery-doc-field-blank { height:0; border-bottom:1.5px solid #111; }
.chancellery-doc-field-blank.is-align-start { margin-inline-end:auto; }
.chancellery-doc-field-blank.is-align-center { margin-inline:auto; }
.chancellery-doc-field-blank.is-align-end { margin-inline-start:auto; }
.chancellery-doc-merge-row { display:flex; align-items:flex-end; justify-content:flex-end; gap:4px; }
.chancellery-doc-merge-value-wrap { display:inline-flex; flex-direction:column; min-width:0; }
.chancellery-doc-merge-label { white-space:nowrap; }
@media print {
  .no-print { display: none !important; }
}
</style></head><body>
<div class="no-print" style="padding:12px;font-family:system-ui,sans-serif">
  <button type="button" onclick="window.print()">Print / Save as PDF</button>
  <button type="button" onclick="window.close()">Close</button>
</div>
<div class="meta">${escapeChancelleryDocumentHtml([payload.studentName, payload.subjectName].filter(Boolean).join(' · '))}</div>
${letterHtml}
<script>window.addEventListener('load',function(){setTimeout(function(){window.print();},250);});<\/script>
</body></html>`);
    win.document.close();
}

async function exportChancelleryLetterDocx(model = {}) {
    await ensureChancelleryExportLibraries('docx');
    if (typeof window.docx === 'undefined') {
        throw new Error('Word export library failed to load.');
    }
    const payload = model && typeof model === 'object' ? model : {};
    const {
        Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
        Table, TableRow, TableCell, WidthType, BorderStyle, ImageRun
    } = window.docx;
    const children = [];
    children.push(new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: payload.title || 'Appeal letter', bold: true })]
    }));
    if (payload.studentName || payload.subjectName) {
        children.push(new Paragraph({
            children: [new TextRun({
                text: [payload.studentName, payload.subjectName].filter(Boolean).join(' · '),
                italics: true,
                size: 20
            })]
        }));
    }
    children.push(new Paragraph({ children: [] }));

    const rows = [...(payload.elements || [])].sort((a, b) => (a.y - b.y) || (a.x - b.x));
    if (rows.length) {
        for (const el of rows) {
            if (el.type === 'text') {
                if (!el.text) continue;
                children.push(new Paragraph({
                    alignment: AlignmentType.LEFT,
                    spacing: { after: 160 },
                    children: [new TextRun({ text: el.text, size: 22 })]
                }));
                continue;
            }
            if (el.type === 'mergeField') {
                children.push(new Paragraph({
                    spacing: { after: 80 },
                    children: [
                        new TextRun({ text: `${el.label || el.fieldKey || 'Field'}: `, bold: true, size: 22 }),
                        new TextRun({ text: el.text || '—', size: 22 })
                    ]
                }));
                continue;
            }
            if (el.type === 'table' && Table && TableRow && TableCell) {
                const borderColor = String(el.borderColor || '111111').replace('#', '');
                const border = {
                    style: BorderStyle?.SINGLE || 'single',
                    size: Math.max(1, Math.round((el.borderWidth || 1.5) * 8)),
                    color: borderColor
                };
                const borders = { top: border, bottom: border, left: border, right: border };
                const covered = getChancelleryTableCoveredSet(el);
                const tableRows = (el.cells || []).map((row, rowIndex) => {
                    const cells = (row || [])
                        .map((cell, colIndex) => {
                            if (covered.has(`${rowIndex}:${colIndex}`)) return null;
                            const colspan = Math.max(1, Number(cell.colspan) || 1);
                            const fill = cell.fill && cell.fill !== 'transparent' && cell.fill !== 'none'
                                ? String(cell.fill).replace('#', '')
                                : '';
                            const cellOpts = {
                                borders,
                                columnSpan: colspan,
                                width: {
                                    size: Math.round((9000 / Math.max(1, el.cols || 1)) * colspan),
                                    type: WidthType?.DXA || 'dxa'
                                },
                                children: [new Paragraph({
                                    children: [new TextRun({
                                        text: cell.text || stripChancelleryHtmlToText(cell.html || '') || ' ',
                                        size: 20
                                    })]
                                })]
                            };
                            if (fill && /^[0-9a-f]{3,6}$/i.test(fill)) {
                                cellOpts.shading = { type: 'clear', fill };
                            }
                            if (cell.vAlign === 'middle') cellOpts.verticalAlign = 'center';
                            else if (cell.vAlign === 'bottom') cellOpts.verticalAlign = 'bottom';
                            else cellOpts.verticalAlign = 'top';
                            return new TableCell(cellOpts);
                        })
                        .filter(Boolean);
                    return new TableRow({ children: cells });
                });
                if (tableRows.length) {
                    children.push(new Table({ rows: tableRows, width: { size: 9000, type: WidthType?.DXA || 'dxa' } }));
                    children.push(new Paragraph({ children: [] }));
                }
                continue;
            }
            if (el.type === 'shape') {
                children.push(new Paragraph({
                    spacing: { after: 120 },
                    border: {
                        top: { style: BorderStyle?.SINGLE || 'single', size: 12, color: '111111' },
                        bottom: { style: BorderStyle?.SINGLE || 'single', size: 12, color: '111111' },
                        left: { style: BorderStyle?.SINGLE || 'single', size: 12, color: '111111' },
                        right: { style: BorderStyle?.SINGLE || 'single', size: 12, color: '111111' }
                    },
                    children: [new TextRun({ text: ' ', size: 22 })]
                }));
                continue;
            }
            if (el.type === 'image') {
                const dataUrl = String(el.src || '');
                const match = dataUrl.match(/^data:image\/(png|jpe?g|gif|webp);base64,(.+)$/i);
                if (match && ImageRun) {
                    try {
                        const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
                        children.push(new Paragraph({
                            spacing: { after: 120 },
                            children: [new ImageRun({
                                data: bytes,
                                transformation: { width: Math.min(320, el.w || 160), height: Math.min(240, el.h || 120) },
                                type: /png/i.test(match[1]) ? 'png' : 'jpg'
                            })]
                        }));
                        continue;
                    } catch (_error) {
                        /* fall through to alt text */
                    }
                }
                children.push(new Paragraph({
                    spacing: { after: 120 },
                    children: [new TextRun({ text: el.alt || el.text || '[Image]', italics: true, size: 20 })]
                }));
                continue;
            }
            if (el.type === 'inputChoice' || el.type === 'inputText' || el.type === 'inputLong') {
                children.push(new Paragraph({
                    spacing: { before: 120, after: 60 },
                    children: [new TextRun({ text: el.label || 'Answer', bold: true, size: 22 })]
                }));
                children.push(new Paragraph({
                    spacing: { after: 160 },
                    children: [new TextRun({ text: el.text || '—', size: 22 })]
                }));
            }
        }
    } else if (payload.message) {
        children.push(new Paragraph({
            children: [new TextRun({ text: payload.message, size: 22 })]
        }));
    }

    const doc = new Document({
        sections: [{ properties: {}, children }]
    });
    const blob = await Packer.toBlob(doc);
    const filename = `${String(payload.title || 'appeal-letter').replace(/[^a-zA-Z0-9_-]+/g, '_')}.docx`;
    if (typeof window.saveAs === 'function') {
        window.saveAs(blob, filename);
    } else {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        URL.revokeObjectURL(url);
    }
}

async function exportChancelleryLetter(format = 'pdf', source = null) {
    const model = source && typeof source === 'object' && (source.elements || source.htmlSnapshot || source.documentHtmlSnapshot)
        ? (source.htmlSnapshot || source.elements
            ? source
            : buildChancelleryExportModelFromRequest(source))
        : (document.getElementById('chancellery-appeal-overlay') && !document.getElementById('chancellery-appeal-overlay').hidden
            ? buildChancelleryExportModelFromLiveFill()
            : null);
    if (!model) {
        alert('Nothing to export yet.');
        return;
    }
    const normalized = String(format || '').toLowerCase();
    if (normalized === 'pdf') {
        exportChancelleryLetterPdf(model);
        return;
    }
    if (normalized === 'docx' || normalized === 'word') {
        await exportChancelleryLetterDocx(model);
        return;
    }
    alert('Unsupported export format.');
}

function bindChancelleryAppealModalDelegates() {
    if (document.documentElement.dataset.chancelleryAppealModalBound === '1') return;
    document.addEventListener('click', (event) => {
        if (event.target.id === 'chancellery-appeal-overlay') closeChancelleryAppealModal();
    });
    document.documentElement.dataset.chancelleryAppealModalBound = '1';
}

bindChancelleryDocumentEditorDelegates();
bindChancelleryAppealModalDelegates();
