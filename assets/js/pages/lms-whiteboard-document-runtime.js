/* LMS whiteboard live document embed layer (PDF/DOCX/XLSX/images). */

const LMS_WHITEBOARD_DOC_HTML_CACHE = {};

function getLmsWhiteboardDocumentViewUrl(storageKey = '', mimeType = '') {
    if (typeof getPortalStoredFileUrl !== 'function') return '';
    const base = getPortalStoredFileUrl(storageKey);
    if (!base) return '';
    return `${base}${base.includes('?') ? '&' : '?'}inline=1`;
}

function isLmsWhiteboardImageMime(mimeType = '', fileName = '') {
    const mime = String(mimeType || '').toLowerCase();
    if (mime.startsWith('image/')) return true;
    return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(String(fileName || '').trim());
}

function isLmsWhiteboardSpreadsheetMime(mimeType = '', fileName = '') {
    const mime = String(mimeType || '').toLowerCase();
    if (mime.includes('spreadsheetml') || mime.includes('excel') || mime === 'text/csv') return true;
    return /\.(xlsx?|csv)$/i.test(String(fileName || '').trim());
}

function isLmsWhiteboardWordMime(mimeType = '', fileName = '') {
    const mime = String(mimeType || '').toLowerCase();
    if (mime.includes('wordprocessingml') || mime.includes('msword')) return true;
    return /\.(docx?)$/i.test(String(fileName || '').trim());
}

function isLmsWhiteboardDocumentMime(mimeType = '', fileName = '') {
    const mime = String(mimeType || '').toLowerCase();
    if (mime.includes('pdf')) return true;
    if (isLmsWhiteboardWordMime(mime, fileName)) return true;
    if (isLmsWhiteboardSpreadsheetMime(mime, fileName)) return true;
    return /\.(pdf|docx?|xlsx?|csv)$/i.test(String(fileName || '').trim());
}

function isLmsWhiteboardImportableFile(file = null) {
    if (!file) return false;
    const mime = String(file.type || '').toLowerCase();
    const fileName = String(file.name || '').trim();
    if (isLmsWhiteboardImageMime(mime, fileName)) return true;
    return isLmsWhiteboardDocumentMime(mime, fileName);
}

function getLmsWhiteboardElementStorageBackend(element = {}) {
    return String(element.storageBackend || 'bridge').trim().toLowerCase() || 'bridge';
}

async function uploadLmsWhiteboardStoredFile(file = null) {
    if (!file) throw new Error('No file selected.');
    const blob = file.blob instanceof Blob ? file.blob : (file instanceof Blob ? file : null);
    if (!blob) throw new Error('Could not read file data.');
    const payload = {
        blob,
        name: file.name || 'document',
        type: file.type || blob.type || 'application/octet-stream',
        size: file.size || blob.size || 0
    };
    if (typeof uploadPortalStoredFile === 'function') {
        try {
            const uploaded = await uploadPortalStoredFile(payload, 'whiteboard');
            if (uploaded?.storageKey) {
                return {
                    storageKey: String(uploaded.storageKey).trim(),
                    storageBackend: String(uploaded.storageBackend || 'bridge').trim().toLowerCase() || 'bridge'
                };
            }
        } catch (error) {
            console.warn('[whiteboard] Bridge upload failed, trying local storage.', error);
        }
    }
    if (typeof putLmsFileBlob === 'function' && typeof buildLmsStoredFileStorageKey === 'function') {
        const storageKey = buildLmsStoredFileStorageKey('whiteboard', payload);
        await putLmsFileBlob(storageKey, payload);
        return { storageKey, storageBackend: 'indexeddb' };
    }
    throw new Error('Could not upload file. Check your connection and try again.');
}

async function resolveLmsWhiteboardFileBlob(element = {}) {
    const storageKey = String(element.storageKey || '').trim();
    if (!storageKey) return null;
    const backend = getLmsWhiteboardElementStorageBackend(element);
    if (backend === 'indexeddb' && typeof getLmsFileBlob === 'function') {
        const record = await getLmsFileBlob(storageKey);
        return record?.blob instanceof Blob ? record.blob : null;
    }
    const url = getLmsWhiteboardDocumentViewUrl(storageKey, element.mimeType);
    if (!url) return null;
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) throw new Error('File not found.');
    return response.blob();
}

async function resolveLmsWhiteboardFileObjectUrl(element = {}) {
    const blob = await resolveLmsWhiteboardFileBlob(element);
    if (!blob) return '';
    return URL.createObjectURL(blob);
}

function revokeLmsWhiteboardDocumentShellUrl(shell) {
    if (!shell) return;
    const prior = String(shell.dataset.lmsWhiteboardBlobUrl || '').trim();
    if (prior) {
        URL.revokeObjectURL(prior);
        delete shell.dataset.lmsWhiteboardBlobUrl;
    }
}

const LMS_WHITEBOARD_A4_ASPECT = 210 / 297;
const LMS_WHITEBOARD_DOCUMENT_BADGE_HEIGHT = 24;

function isLmsWhiteboardPdfMime(mimeType = '', fileName = '') {
    const mime = String(mimeType || '').toLowerCase();
    if (mime.includes('pdf')) return true;
    return /\.pdf$/i.test(String(fileName || '').trim());
}

const LMS_WHITEBOARD_PDFJS_VERSION = '3.11.174';
let lmsWhiteboardPdfJsLoading = null;

async function ensureLmsWhiteboardPdfJs() {
    if (window.pdfjsLib) return window.pdfjsLib;
    if (!lmsWhiteboardPdfJsLoading) {
        lmsWhiteboardPdfJsLoading = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${LMS_WHITEBOARD_PDFJS_VERSION}/build/pdf.min.js`;
            script.onload = () => {
                if (!window.pdfjsLib) {
                    reject(new Error('pdf.js unavailable.'));
                    return;
                }
                window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${LMS_WHITEBOARD_PDFJS_VERSION}/build/pdf.worker.min.js`;
                resolve(window.pdfjsLib);
            };
            script.onerror = () => reject(new Error('Could not load PDF parser.'));
            document.head.appendChild(script);
        });
    }
    return lmsWhiteboardPdfJsLoading;
}

async function paintLmsWhiteboardDocumentPdfCanvas(pdfCanvas, element = {}) {
    if (!pdfCanvas) return;
    const rect = pdfCanvas.getBoundingClientRect();
    const cssW = Math.max(1, Math.floor(rect.width));
    const cssH = Math.max(1, Math.floor(rect.height));
    if (cssW < 2 || cssH < 2) return;
    const dpr = window.devicePixelRatio || 1;
    pdfCanvas.width = Math.round(cssW * dpr);
    pdfCanvas.height = Math.round(cssH * dpr);
    pdfCanvas.style.width = `${cssW}px`;
    pdfCanvas.style.height = `${cssH}px`;
    const ctx = pdfCanvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cssW, cssH);
    try {
        const blob = await resolveLmsWhiteboardFileBlob(element);
        if (!blob) throw new Error('PDF unavailable.');
        const pdfjs = await ensureLmsWhiteboardPdfJs();
        const doc = await pdfjs.getDocument({ data: await blob.arrayBuffer() }).promise;
        const pageNumber = Math.max(1, Number(element.pageIndex || 0) + 1);
        const page = await doc.getPage(Math.min(pageNumber, doc.numPages || pageNumber));
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(cssW / baseViewport.width, cssH / baseViewport.height);
        const viewport = page.getViewport({ scale });
        ctx.save();
        ctx.translate((cssW - viewport.width) / 2, (cssH - viewport.height) / 2);
        await page.render({ canvasContext: ctx, viewport }).promise;
        ctx.restore();
        element.pageAspect = Math.max(0.2, baseViewport.width / baseViewport.height);
        await doc.destroy();
    } catch (error) {
        console.warn('[whiteboard] PDF canvas render failed', error);
        ctx.fillStyle = '#64748b';
        ctx.font = '13px Inter, sans-serif';
        ctx.fillText('Could not render PDF.', 12, 24);
    }
}

async function readLmsWhiteboardPdfAspectRatio(file = null) {
    const blob = file?.blob instanceof Blob ? file.blob : (file instanceof Blob ? file : null);
    if (!blob) return LMS_WHITEBOARD_A4_ASPECT;
    try {
        const pdfjs = await ensureLmsWhiteboardPdfJs();
        const doc = await pdfjs.getDocument({ data: await blob.arrayBuffer() }).promise;
        const page = await doc.getPage(1);
        const viewport = page.getViewport({ scale: 1 });
        const aspect = Math.max(0.2, viewport.width / viewport.height);
        await doc.destroy();
        return aspect;
    } catch (error) {
        console.warn('[whiteboard] PDF aspect probe failed, using A4 fallback.', error);
        return LMS_WHITEBOARD_A4_ASPECT;
    }
}

function applyLmsWhiteboardDocumentShellAspect(element, aspect) {
    if (!element || !aspect) return false;
    const bounds = typeof getLmsWhiteboardElementBounds === 'function'
        ? getLmsWhiteboardElementBounds(element)
        : null;
    const w = bounds?.w ?? element.w;
    const h = bounds?.h ?? element.h;
    const area = Math.max(1, w * h);
    const contentH = Math.sqrt(area / aspect);
    const nextW = contentH * aspect;
    const nextH = contentH + LMS_WHITEBOARD_DOCUMENT_BADGE_HEIGHT;
    element.w = nextW;
    element.h = nextH;
    element.pageAspect = aspect;
    if (typeof normalizeLmsWhiteboardBox === 'function') normalizeLmsWhiteboardBox(element);
    return true;
}

async function readLmsWhiteboardImageAspectRatio(file = null) {
    if (!file || !isLmsWhiteboardImageMime(file.type, file.name)) return 4 / 3;
    return new Promise((resolve) => {
        const url = URL.createObjectURL(file.blob instanceof Blob ? file.blob : file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            const w = img.naturalWidth || 1;
            const h = img.naturalHeight || 1;
            resolve(Math.max(0.2, w / h));
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(4 / 3);
        };
        img.src = url;
    });
}

async function readLmsWhiteboardDocumentAspectRatio(file = null) {
    if (!file) return 4 / 3;
    const mime = file.type || '';
    const name = file.name || '';
    if (isLmsWhiteboardImageMime(mime, name)) return readLmsWhiteboardImageAspectRatio(file);
    if (isLmsWhiteboardPdfMime(mime, name)) return readLmsWhiteboardPdfAspectRatio(file);
    return 4 / 3;
}

async function ensureLmsWhiteboardMammoth() {
    if (window.mammoth) return window.mammoth;
    await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Could not load document converter.'));
        document.head.appendChild(script);
    });
    return window.mammoth;
}

async function ensureLmsWhiteboardSheetJs() {
    if (window.XLSX) return window.XLSX;
    await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Could not load spreadsheet converter.'));
        document.head.appendChild(script);
    });
    return window.XLSX;
}

async function fetchLmsWhiteboardStoredFileBuffer(element = {}) {
    const blob = await resolveLmsWhiteboardFileBlob(element);
    if (!blob) throw new Error('Document unavailable.');
    return blob.arrayBuffer();
}

async function buildLmsWhiteboardDocxSrcdoc(element = {}) {
    const cacheKey = `docx:${String(element.storageKey || '').trim()}`;
    if (LMS_WHITEBOARD_DOC_HTML_CACHE[cacheKey]) return LMS_WHITEBOARD_DOC_HTML_CACHE[cacheKey];
    const buffer = await fetchLmsWhiteboardStoredFileBuffer(element);
    const mammoth = await ensureLmsWhiteboardMammoth();
    const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
    const html = `
        <!DOCTYPE html><html><head><meta charset="utf-8">
        <style>
            html { margin: 0; height: 100%; overflow: auto; }
            body { margin: 0; padding: 0; overflow: visible; font: 14px/1.5 Inter, sans-serif; color: #1f2937; background: #fff; }
            p { margin: 0 0 0.75em; }
            p:last-child { margin-bottom: 0; }
        </style></head><body>${result.value || '<p>Empty document</p>'}</body></html>`;
    LMS_WHITEBOARD_DOC_HTML_CACHE[cacheKey] = html;
    return html;
}

async function buildLmsWhiteboardSpreadsheetSrcdoc(element = {}) {
    const cacheKey = `sheet:${String(element.storageKey || '').trim()}`;
    if (LMS_WHITEBOARD_DOC_HTML_CACHE[cacheKey]) return LMS_WHITEBOARD_DOC_HTML_CACHE[cacheKey];
    const buffer = await fetchLmsWhiteboardStoredFileBuffer(element);
    const XLSX = await ensureLmsWhiteboardSheetJs();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames?.[0];
    const sheet = sheetName ? workbook.Sheets[sheetName] : null;
    const table = sheet ? XLSX.utils.sheet_to_html(sheet) : '<p>Empty spreadsheet</p>';
    const html = `
        <!DOCTYPE html><html><head><meta charset="utf-8">
        <style>
            html { margin: 0; height: 100%; overflow: auto; }
            body { margin: 0; padding: 0; overflow: visible; font: 13px/1.4 Inter, sans-serif; color: #1f2937; background: #fff; }
            table { border-collapse: collapse; width: max-content; min-width: 100%; }
            td, th { border: 1px solid #d1d5db; padding: 4px 8px; white-space: nowrap; }
            th { background: #f3f4f6; font-weight: 600; }
        </style></head><body>${table}</body></html>`;
    LMS_WHITEBOARD_DOC_HTML_CACHE[cacheKey] = html;
    return html;
}

const LMS_WHITEBOARD_DOCUMENT_HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

const LMS_WHITEBOARD_DOCUMENT_EDGE_HANDLES = ['n', 's', 'e', 'w'];

function buildLmsWhiteboardDocumentChromeMarkup() {
    const handles = LMS_WHITEBOARD_DOCUMENT_HANDLES.map(handle => (
        `<span class="lms-whiteboard-document-handle" data-handle="${handle}" data-lms-whiteboard-document-handle="${handle}"></span>`
    )).join('');
    const edges = LMS_WHITEBOARD_DOCUMENT_EDGE_HANDLES.map(handle => (
        `<span class="lms-whiteboard-document-edge-handle" data-handle="${handle}" data-lms-whiteboard-document-handle="${handle}"></span>`
    )).join('');
    return `<div class="lms-whiteboard-document-chrome" data-lms-whiteboard-document-chrome hidden>
        <div class="lms-whiteboard-document-drag-ring" data-lms-whiteboard-document-drag-ring aria-hidden="true"></div>
        ${edges}${handles}</div>`;
}

function hitTestLmsWhiteboardDocumentShellResizeZone(shell, clientX = 0, clientY = 0) {
    if (!shell) return '';
    const rect = shell.getBoundingClientRect();
    const threshold = 10;
    const left = clientX - rect.left;
    const top = clientY - rect.top;
    const right = rect.right - clientX;
    const bottom = rect.bottom - clientY;
    if (left < 0 || top < 0 || right < 0 || bottom < 0) return '';
    const onLeft = left <= threshold;
    const onRight = right <= threshold;
    const onTop = top <= threshold;
    const onBottom = bottom <= threshold;
    if (onTop && onLeft) return 'nw';
    if (onTop && onRight) return 'ne';
    if (onBottom && onLeft) return 'sw';
    if (onBottom && onRight) return 'se';
    if (onTop) return 'n';
    if (onBottom) return 's';
    if (onLeft) return 'w';
    if (onRight) return 'e';
    return '';
}

function paintDocumentChildResizeHandles(ctx, child = {}, scaleX = 1, scaleY = 1) {
    if (typeof getLmsWhiteboardElementBounds !== 'function' || typeof getLmsWhiteboardResizeHandlePoints !== 'function') return;
    const bounds = getLmsWhiteboardElementBounds(child);
    if (!bounds) return;
    const sx = (value = 0) => value * scaleX;
    const sy = (value = 0) => value * scaleY;
    ctx.save();
    ctx.fillStyle = '#f4d06f';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.lineWidth = 1.5;
    getLmsWhiteboardResizeHandlePoints(bounds, child).forEach(handle => {
        ctx.beginPath();
        ctx.arc(sx(handle.x), sy(handle.y), 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    });
    ctx.restore();
}

function paintDocumentChildSelectionChrome(ctx, child = {}, scaleX = 1, scaleY = 1, selected = false) {
    if (!selected) return;
    const bounds = typeof getLmsWhiteboardElementBounds === 'function'
        ? getLmsWhiteboardElementBounds(child)
        : null;
    if (!bounds) return;
    const sx = (value = 0) => value * scaleX;
    const sy = (value = 0) => value * scaleY;
    const x = sx(bounds.x);
    const y = sy(bounds.y);
    const w = sx(Math.abs(bounds.w));
    const h = sy(Math.abs(bounds.h));
    ctx.save();
    ctx.strokeStyle = 'rgba(244, 208, 111, 0.95)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    docOverlayRoundRect(ctx, x - 2, y - 2, w + 4, h + 4, 6);
    ctx.stroke();
    ctx.restore();
    paintDocumentChildResizeHandles(ctx, child, scaleX, scaleY);
}

function syncLmsWhiteboardDocumentPointerCursor(inkCanvas, shell, resourceKey = '', elementId = '', localPoint = null, event = null) {
    const target = inkCanvas || shell;
    if (!target) return;

    if (typeof resolveLmsWhiteboardPointerCursor === 'function'
        && LMS_WHITEBOARD_UI.panning) {
        syncLmsWhiteboardPointerCursor(target, resolveLmsWhiteboardPointerCursor({ resourceKey }));
        return;
    }

    const drawTools = ['pen', 'eraser', 'sticky', 'text'];
    if (drawTools.includes(LMS_WHITEBOARD_UI.tool)) {
        syncLmsWhiteboardPointerCursor(target, 'crosshair');
        return;
    }

    if (LMS_WHITEBOARD_UI.tool !== 'select') {
        syncLmsWhiteboardPointerCursor(target, 'default');
        return;
    }

    const dragStart = LMS_WHITEBOARD_UI.dragStart;
    if (dragStart) {
        if (dragStart.mode === 'marquee') syncLmsWhiteboardPointerCursor(target, 'default');
        else if (dragStart.mode === 'move') syncLmsWhiteboardPointerCursor(target, 'grabbing');
        else if (dragStart.mode === 'resize') {
            syncLmsWhiteboardPointerCursor(target, getLmsWhiteboardResizeHandleCursor(dragStart.handle) || 'grabbing');
        }
        return;
    }

    let cursor = 'default';
    const shellHandle = event ? hitTestLmsWhiteboardDocumentShellResizeZone(shell, event.clientX, event.clientY) : '';
    if (shellHandle) {
        cursor = getLmsWhiteboardResizeHandleCursor(shellHandle);
    } else if (event?.target?.closest?.('[data-lms-whiteboard-document-drag]')) {
        const selectedIds = typeof getLmsWhiteboardSelectedIds === 'function' ? getLmsWhiteboardSelectedIds() : [];
        cursor = selectedIds.includes(elementId) ? 'move' : 'default';
    } else if (localPoint) {
        const selectedIds = typeof getLmsWhiteboardSelectedIds === 'function' ? getLmsWhiteboardSelectedIds() : [];
        if (selectedIds.length === 1) {
            const workspace = typeof ensureLmsWhiteboardWorkspace === 'function'
                ? ensureLmsWhiteboardWorkspace(resourceKey)
                : { elements: [] };
            const child = workspace.elements.find(item => item.id === selectedIds[0]);
            if (child?.parentDocumentId === elementId && typeof hitTestLmsWhiteboardResizeZone === 'function') {
                const resizeCursor = getLmsWhiteboardResizeHandleCursor(
                    hitTestLmsWhiteboardResizeZone(localPoint, child, { local: true })
                );
                if (resizeCursor) cursor = resizeCursor;
            }
        }
        if (cursor === 'default' && typeof findLmsWhiteboardDocumentChildAtPoint === 'function') {
            if (findLmsWhiteboardDocumentChildAtPoint(resourceKey, elementId, localPoint)) cursor = 'move';
        }
        if (cursor === 'default' && selectedIds.includes(elementId)) cursor = 'move';
    } else {
        const selectedIds = typeof getLmsWhiteboardSelectedIds === 'function' ? getLmsWhiteboardSelectedIds() : [];
        if (selectedIds.includes(elementId)) cursor = 'move';
    }

    syncLmsWhiteboardPointerCursor(target, cursor);
}

function inkEventToDocumentLocal(event, shell, element = {}) {
    return clientPointToDocumentLocal(shell, element, event.clientX, event.clientY);
}

function clientPointToDocumentLocal(shell, element = {}, clientX = 0, clientY = 0) {
    const ink = shell?.querySelector?.('[data-lms-whiteboard-document-ink]');
    const rect = ink?.getBoundingClientRect?.() || shell?.getBoundingClientRect?.() || { left: 0, top: 0, width: 1, height: 1 };
    const docW = Math.abs(element.w || 1);
    const docH = Math.abs(element.h || 1);
    return {
        x: ((clientX - rect.left) / Math.max(rect.width, 1)) * docW,
        y: ((clientY - rect.top) / Math.max(rect.height, 1)) * docH
    };
}

function documentLocalToWorld(documentElement = {}, localX = 0, localY = 0) {
    const bounds = typeof getLmsWhiteboardElementBounds === 'function'
        ? getLmsWhiteboardElementBounds(documentElement)
        : {
            x: Number(documentElement.x || 0),
            y: Number(documentElement.y || 0),
            w: Number(documentElement.w || 1),
            h: Number(documentElement.h || 1)
        };
    const docW = Math.abs(bounds.w || 1);
    const docH = Math.abs(bounds.h || 1);
    return {
        x: bounds.x + (localX / docW) * bounds.w,
        y: bounds.y + (localY / docH) * bounds.h
    };
}

function getLmsWhiteboardDocumentChildElements(workspace = {}, documentId = '') {
    const id = String(documentId || '').trim();
    if (!id) return [];
    return (workspace.elements || []).filter(item => String(item.parentDocumentId || '').trim() === id);
}

function hitTestLmsWhiteboardDocumentStrokeLocal(point = {}, stroke = {}) {
    const points = Array.isArray(stroke.points) ? stroke.points : [];
    const threshold = Math.max(8, (Number(stroke.width) || 3) * 2);
    return points.some(([x, y]) => Math.hypot(x - point.x, y - point.y) < threshold);
}

function hitTestLmsWhiteboardDocumentChildLocal(point = {}, child = {}) {
    if (!child?.type) return false;
    if (child.type === 'stroke') return hitTestLmsWhiteboardDocumentStrokeLocal(point, child);
    const w = Math.abs(Number(child.w) || (child.type === 'text' ? 240 : 120));
    const h = Math.abs(Number(child.h) || (child.type === 'text' ? 72 : child.type === 'sticky' ? 120 : 80));
    const x = Math.min(Number(child.x) || 0, (Number(child.x) || 0) + (Number(child.w) || 0));
    const y = Math.min(Number(child.y) || 0, (Number(child.y) || 0) + (Number(child.h) || 0));
    return point.x >= x && point.x <= x + w && point.y >= y && point.y <= y + h;
}

function findLmsWhiteboardDocumentChildAtPoint(resourceKey = '', documentId = '', localPoint = {}) {
    const workspace = typeof ensureLmsWhiteboardWorkspace === 'function'
        ? ensureLmsWhiteboardWorkspace(resourceKey)
        : { elements: [] };
    const children = getLmsWhiteboardDocumentChildElements(workspace, documentId);
    for (let index = children.length - 1; index >= 0; index -= 1) {
        if (hitTestLmsWhiteboardDocumentChildLocal(localPoint, children[index])) return children[index];
    }
    return null;
}

let lmsWhiteboardDocumentInkWindowListeners = null;

function detachLmsWhiteboardDocumentInkWindowListeners() {
    if (!lmsWhiteboardDocumentInkWindowListeners) return;
    if (lmsWhiteboardDocumentInkWindowListeners.onMove) {
        window.removeEventListener('pointermove', lmsWhiteboardDocumentInkWindowListeners.onMove);
    }
    window.removeEventListener('pointerup', lmsWhiteboardDocumentInkWindowListeners.onEnd);
    window.removeEventListener('pointercancel', lmsWhiteboardDocumentInkWindowListeners.onEnd);
    lmsWhiteboardDocumentInkWindowListeners = null;
}

function attachLmsWhiteboardDocumentInkWindowListeners(resourceKey = '', onEnd = null, onMove = null) {
    detachLmsWhiteboardDocumentInkWindowListeners();
    const endHandler = (event) => {
        detachLmsWhiteboardDocumentInkWindowListeners();
        onEnd?.(event);
    };
    const moveHandler = (event) => {
        onMove?.(event);
    };
    lmsWhiteboardDocumentInkWindowListeners = { onEnd: endHandler, onMove: moveHandler };
    if (onMove) window.addEventListener('pointermove', moveHandler);
    window.addEventListener('pointerup', endHandler);
    window.addEventListener('pointercancel', endHandler);
}

function docOverlayRoundRect(ctx, x, y, w, h, radius = 8) {
    const r = Math.min(radius, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function paintLmsWhiteboardDocumentChildOnOverlay(ctx, child = {}, scaleX = 1, scaleY = 1, selected = false) {
    const sx = (value = 0) => value * scaleX;
    const sy = (value = 0) => value * scaleY;
    if (child.type === 'stroke') {
        const points = Array.isArray(child.points) ? child.points : [];
        if (points.length < 1) return;
        ctx.save();
        ctx.strokeStyle = child.color || '#f4d06f';
        ctx.lineWidth = Math.max(1, (Number(child.width) || 3) * Math.min(scaleX, scaleY));
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = Math.max(0.05, Math.min(1, Number(child.opacity) || 1));
        ctx.beginPath();
        ctx.moveTo(sx(points[0][0]), sy(points[0][1]));
        for (let i = 1; i < points.length; i += 1) ctx.lineTo(sx(points[i][0]), sy(points[i][1]));
        if (points.length === 1) ctx.lineTo(sx(points[0][0]) + 0.01, sy(points[0][1]) + 0.01);
        ctx.stroke();
        ctx.restore();
        paintDocumentChildSelectionChrome(ctx, child, scaleX, scaleY, selected);
        return;
    }
    const x = sx(child.x || 0);
    const y = sy(child.y || 0);
    const w = sx(Math.abs(child.w || 120));
    const h = sy(Math.abs(child.h || 80));
    if (child.type === 'sticky') {
        ctx.save();
        ctx.fillStyle = child.color || '#fff3b0';
        docOverlayRoundRect(ctx, x, y, w, h, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.14)';
        docOverlayRoundRect(ctx, x, y, w, h, 8);
        ctx.stroke();
        ctx.fillStyle = '#1f2937';
        const fontSize = Math.max(10, (Number(child.fontSize) || 14) * Math.min(scaleX, scaleY));
        ctx.font = `${fontSize}px Inter, sans-serif`;
        ctx.textBaseline = 'top';
        const text = String(child.text || '').slice(0, 500);
        const lines = text.split('\n');
        let lineY = y + (10 * scaleY);
        lines.forEach(line => {
            ctx.fillText(line, x + (10 * scaleX), lineY);
            lineY += fontSize * 1.35;
        });
        ctx.restore();
    } else if (child.type === 'text') {
        const isDraft = LMS_WHITEBOARD_UI.drawing && LMS_WHITEBOARD_UI.currentStroke?.id === child.id;
        if (isDraft) {
            ctx.save();
            ctx.strokeStyle = 'rgba(244, 208, 111, 0.95)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 4]);
            docOverlayRoundRect(ctx, x, y, w, h, 6);
            ctx.stroke();
            ctx.restore();
        } else {
            ctx.save();
            ctx.fillStyle = child.color || '#f8fafc';
            const baseFontSize = Number(child.fontSize) || 18;
            const scaledFontSize = Math.max(10, baseFontSize * Math.min(scaleX, scaleY));
            ctx.font = `${scaledFontSize}px Inter, sans-serif`;
            ctx.textBaseline = 'top';
            const layout = typeof layoutLmsWhiteboardText === 'function'
                ? layoutLmsWhiteboardText({ text: child.text || '', fontSize: baseFontSize, width: w })
                : { lines: String(child.text || '').split('\n'), lineHeight: scaledFontSize * 1.35 };
            const drawLineHeight = scaledFontSize * 1.35;
            layout.lines.forEach((line, index) => {
                ctx.fillText(line, x + (4 * scaleX), y + (4 * scaleY) + (index * drawLineHeight));
            });
            ctx.restore();
        }
    }
    if (!(LMS_WHITEBOARD_UI.drawing && LMS_WHITEBOARD_UI.currentStroke?.id === child.id)) {
        paintDocumentChildSelectionChrome(ctx, child, scaleX, scaleY, selected);
    }
}

function paintLmsWhiteboardDocumentOverlayCanvas(inkCanvas, element = {}, resourceKey = '') {
    if (!inkCanvas || !element?.id) return;
    const workspace = typeof ensureLmsWhiteboardWorkspace === 'function'
        ? ensureLmsWhiteboardWorkspace(resourceKey)
        : { elements: [] };
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));
    const width = Math.max(inkCanvas.clientWidth, 1);
    const height = Math.max(inkCanvas.clientHeight, 1);
    inkCanvas.width = Math.round(width * dpr);
    inkCanvas.height = Math.round(height * dpr);
    const ctx = inkCanvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const docW = Math.abs(element.w || 1);
    const docH = Math.abs(element.h || 1);
    const scaleX = width / docW;
    const scaleY = height / docH;
    const selectedIds = new Set(
        typeof getLmsWhiteboardSelectedIds === 'function' ? getLmsWhiteboardSelectedIds() : []
    );
    getLmsWhiteboardDocumentChildElements(workspace, element.id).forEach(child => {
        if (LMS_WHITEBOARD_UI.inlineEdit?.elementId === child.id) return;
        paintLmsWhiteboardDocumentChildOnOverlay(ctx, child, scaleX, scaleY, selectedIds.has(child.id));
    });
    if (LMS_WHITEBOARD_UI.currentStroke?.parentDocumentId === element.id) {
        paintLmsWhiteboardDocumentChildOnOverlay(ctx, LMS_WHITEBOARD_UI.currentStroke, scaleX, scaleY, false);
    }
    if (LMS_WHITEBOARD_UI.dragStart?.mode === 'marquee'
        && LMS_WHITEBOARD_UI.dragStart.documentLocal
        && LMS_WHITEBOARD_UI.dragStart.parentDocumentId === element.id
        && typeof drawLmsWhiteboardMarquee === 'function'
        && typeof getLmsWhiteboardMarqueeDragRect === 'function') {
        const localRect = getLmsWhiteboardMarqueeDragRect(LMS_WHITEBOARD_UI.dragStart);
        if (localRect) {
            drawLmsWhiteboardMarquee(ctx, {
                x: localRect.x * scaleX,
                y: localRect.y * scaleY,
                w: localRect.w * scaleX,
                h: localRect.h * scaleY
            });
        }
    }
}

function repaintAllLmsWhiteboardDocumentInks() {
    const canvas = document.querySelector('.lms-whiteboard-canvas');
    if (!canvas) return;
    const resourceKey = LMS_WHITEBOARD_UI.boundKey;
    const workspace = typeof ensureLmsWhiteboardWorkspace === 'function'
        ? ensureLmsWhiteboardWorkspace(resourceKey)
        : { elements: [] };
    canvas.closest('[data-lms-whiteboard-region="stage"]')
        ?.querySelectorAll('[data-lms-whiteboard-document-view]')
        ?.forEach(shell => {
            const elementId = shell.dataset.lmsWhiteboardDocumentView;
            const element = (workspace.elements || []).find(item => item.id === elementId);
            const inkCanvas = shell.querySelector('[data-lms-whiteboard-document-ink]');
            if (element && inkCanvas) paintLmsWhiteboardDocumentOverlayCanvas(inkCanvas, element, resourceKey);
        });
}

function repaintLmsWhiteboardDocumentInk(documentId = '') {
    const id = String(documentId || '').trim();
    if (!id) return;
    const canvas = document.querySelector('.lms-whiteboard-canvas');
    if (!canvas) return;
    const shell = canvas.closest('[data-lms-whiteboard-region="stage"]')
        ?.querySelector(`[data-lms-whiteboard-document-view="${id}"]`);
    if (!shell) return;
    const resourceKey = LMS_WHITEBOARD_UI.boundKey;
    const workspace = typeof ensureLmsWhiteboardWorkspace === 'function'
        ? ensureLmsWhiteboardWorkspace(resourceKey)
        : { elements: [] };
    const element = (workspace.elements || []).find(item => item.id === id);
    const inkCanvas = shell.querySelector('[data-lms-whiteboard-document-ink]');
    if (element && inkCanvas) paintLmsWhiteboardDocumentOverlayCanvas(inkCanvas, element, resourceKey);
}

function syncLmsWhiteboardDocumentSelectionChrome() {
    const selected = new Set(
        typeof getLmsWhiteboardSelectedIds === 'function' ? getLmsWhiteboardSelectedIds() : []
    );
    document.querySelectorAll('[data-lms-whiteboard-document-view]').forEach(shell => {
        const elementId = shell.dataset.lmsWhiteboardDocumentView;
        const isSelected = selected.has(elementId);
        shell.classList.toggle('is-selected', isSelected);
        const chrome = shell.querySelector('[data-lms-whiteboard-document-chrome]');
        if (chrome) chrome.hidden = !isSelected;
        const inkCanvas = shell.querySelector('[data-lms-whiteboard-document-ink]');
        const workspace = typeof ensureLmsWhiteboardWorkspace === 'function'
            ? ensureLmsWhiteboardWorkspace(LMS_WHITEBOARD_UI.boundKey)
            : { elements: [] };
        const element = (workspace.elements || []).find(item => item.id === elementId);
        if (element && inkCanvas) paintLmsWhiteboardDocumentOverlayCanvas(inkCanvas, element, LMS_WHITEBOARD_UI.boundKey);
    });
}

function syncLmsWhiteboardDocumentToolMode() {
    const annotate = ['pen', 'eraser'].includes(LMS_WHITEBOARD_UI.tool);
    const drawOnDocument = annotate || ['sticky', 'text'].includes(LMS_WHITEBOARD_UI.tool);
    document.querySelectorAll('[data-lms-whiteboard-document-view]').forEach(shell => {
        shell.dataset.lmsWhiteboardAnnotate = annotate ? 'true' : 'false';
        const ink = shell.querySelector('[data-lms-whiteboard-document-ink]');
        if (ink) {
            ink.style.pointerEvents = (drawOnDocument || LMS_WHITEBOARD_UI.tool === 'select') ? 'auto' : 'none';
        }
    });
    repaintAllLmsWhiteboardDocumentInks();
}

function handleLmsWhiteboardDocumentTextCommit(resourceKey = '', documentId = '', canvas = null) {
    const workspace = typeof ensureLmsWhiteboardWorkspace === 'function'
        ? ensureLmsWhiteboardWorkspace(resourceKey)
        : { elements: [] };
    const draft = LMS_WHITEBOARD_UI.currentStroke;
    if (!draft?.parentDocumentId || draft.parentDocumentId !== documentId || draft.type !== 'text') return;
    if (typeof finalizeLmsWhiteboardTextBox === 'function') {
        finalizeLmsWhiteboardTextBox(draft);
    } else if (typeof normalizeLmsWhiteboardBox === 'function') {
        normalizeLmsWhiteboardBox(draft);
    }
    const stillExists = workspace.elements.some(item => item.id === draft.id);
    if (stillExists && typeof commitLmsWhiteboardEdit === 'function') {
        commitLmsWhiteboardEdit(resourceKey, 'document-text', { op: { element: draft } });
    }
    if (stillExists && typeof setLmsWhiteboardSelection === 'function') {
        setLmsWhiteboardSelection([draft.id], { skipPaint: true });
    }
    const draftId = draft.id;
    LMS_WHITEBOARD_UI.currentStroke = null;
    LMS_WHITEBOARD_UI.drawing = false;
    repaintLmsWhiteboardDocumentInk(documentId);
    if (stillExists && canvas && typeof openLmsWhiteboardInlineEditor === 'function') {
        openLmsWhiteboardInlineEditor({ resourceKey, elementId: draftId, mode: 'edit-text', canvas, isNew: true });
    }
}

function updateLmsWhiteboardDocumentInkGesture(shell, resourceKey, elementId, localPoint) {
    if (!LMS_WHITEBOARD_UI.drawing && !(LMS_WHITEBOARD_UI.tool === 'select' && LMS_WHITEBOARD_UI.dragStart?.documentLocal)) {
        return false;
    }
    if (LMS_WHITEBOARD_UI.tool === 'pen' && typeof continueLmsWhiteboardDocumentStroke === 'function') {
        continueLmsWhiteboardDocumentStroke(localPoint);
        return true;
    }
    if (LMS_WHITEBOARD_UI.tool === 'eraser' && typeof eraseLmsWhiteboardAtPoint === 'function') {
        eraseLmsWhiteboardAtPoint(resourceKey, localPoint, { parentDocumentId: elementId });
        return true;
    }
    if (LMS_WHITEBOARD_UI.tool === 'text' && LMS_WHITEBOARD_UI.currentStroke?.parentDocumentId === elementId) {
        LMS_WHITEBOARD_UI.currentStroke.w = localPoint.x - LMS_WHITEBOARD_UI.currentStroke.x;
        LMS_WHITEBOARD_UI.currentStroke.h = localPoint.y - LMS_WHITEBOARD_UI.currentStroke.y;
        repaintLmsWhiteboardDocumentInk(elementId);
        return true;
    }
    return false;
}

function handleLmsWhiteboardDocumentToolDown(event, shell, canvas, resourceKey = '', element = {}, elementId = '') {
    const tool = LMS_WHITEBOARD_UI.tool;
    const localPoint = clientPointToDocumentLocal(shell, element, event.clientX, event.clientY);
    if (tool === 'sticky') {
        if (typeof recordLmsWhiteboardHistoryGesture === 'function') recordLmsWhiteboardHistoryGesture(resourceKey);
        const sticky = {
            type: 'sticky',
            id: typeof makeLmsWhiteboardId === 'function' ? makeLmsWhiteboardId('sticky') : `sticky-${Date.now()}`,
            parentDocumentId: elementId,
            x: localPoint.x,
            y: localPoint.y,
            w: LMS_WHITEBOARD_UI.stickyDefaults.w,
            h: LMS_WHITEBOARD_UI.stickyDefaults.h,
            fontSize: LMS_WHITEBOARD_UI.stickyDefaults.fontSize,
            text: 'New note',
            color: LMS_WHITEBOARD_UI.stickyDefaults.color,
            authorId: typeof getLmsWhiteboardActorId === 'function' ? getLmsWhiteboardActorId() : ''
        };
        ensureLmsWhiteboardWorkspace(resourceKey).elements.push(sticky);
        if (typeof setLmsWhiteboardSelection === 'function') setLmsWhiteboardSelection([sticky.id], { skipPaint: true });
        if (typeof commitLmsWhiteboardEdit === 'function') commitLmsWhiteboardEdit(resourceKey, 'document-sticky', { op: { element: sticky } });
        repaintLmsWhiteboardDocumentInk(elementId);
        if (typeof openLmsWhiteboardInlineEditor === 'function') {
            openLmsWhiteboardInlineEditor({ resourceKey, elementId: sticky.id, mode: 'edit-sticky', canvas, isNew: false });
        }
        return;
    }
    if (tool === 'text') {
        if (typeof recordLmsWhiteboardHistoryGesture === 'function') recordLmsWhiteboardHistoryGesture(resourceKey);
        LMS_WHITEBOARD_UI.drawing = true;
        LMS_WHITEBOARD_UI.currentStroke = {
            type: 'text',
            id: typeof makeLmsWhiteboardId === 'function' ? makeLmsWhiteboardId('text') : `text-${Date.now()}`,
            parentDocumentId: elementId,
            x: localPoint.x,
            y: localPoint.y,
            w: 1,
            h: 1,
            fontSize: LMS_WHITEBOARD_UI.textDefaults.fontSize,
            text: '',
            color: LMS_WHITEBOARD_UI.textDefaults.color,
            authorId: typeof getLmsWhiteboardActorId === 'function' ? getLmsWhiteboardActorId() : ''
        };
        ensureLmsWhiteboardWorkspace(resourceKey).elements.push(LMS_WHITEBOARD_UI.currentStroke);
        repaintLmsWhiteboardDocumentInk(elementId);
        return;
    }
}

function bindLmsWhiteboardDocumentShellInteractions(shell, canvas, resourceKey = '') {
    if (!shell || shell.dataset.lmsWhiteboardInteractionsBound) return;
    shell.dataset.lmsWhiteboardInteractionsBound = '1';
    const elementId = shell.dataset.lmsWhiteboardDocumentView;
    const badge = shell.querySelector('[data-lms-whiteboard-document-drag]');
    const inkCanvas = shell.querySelector('[data-lms-whiteboard-document-ink]');

    const startShellMove = (event) => {
        if (LMS_WHITEBOARD_UI.tool !== 'select') return;
        event.preventDefault();
        event.stopPropagation();
        if (typeof beginLmsWhiteboardShellDrag === 'function') {
            beginLmsWhiteboardShellDrag(event, resourceKey, canvas, { elementId, mode: 'move' });
        } else if (typeof setLmsWhiteboardSelection === 'function') {
            setLmsWhiteboardSelection([elementId]);
        }
    };

    badge?.addEventListener('pointerdown', startShellMove);

    shell.addEventListener('pointermove', (event) => {
        if (event.target.closest('[data-lms-whiteboard-document-ink]')) return;
        const workspace = typeof ensureLmsWhiteboardWorkspace === 'function'
            ? ensureLmsWhiteboardWorkspace(resourceKey)
            : { elements: [] };
        const element = (workspace.elements || []).find(item => item.id === elementId);
        if (!element) return;
        const localPoint = inkEventToDocumentLocal(event, shell, element);
        syncLmsWhiteboardDocumentPointerCursor(null, shell, resourceKey, elementId, localPoint, event);
    });
    shell.addEventListener('pointerleave', () => {
        if (typeof refreshLmsWhiteboardPointerCursor === 'function') {
            refreshLmsWhiteboardPointerCursor(canvas, { point: null });
        }
    });

    shell.addEventListener('pointerdown', (event) => {
        if (LMS_WHITEBOARD_UI.tool !== 'select') return;
        if (event.target.closest('[data-lms-whiteboard-document-handle], [data-lms-whiteboard-document-edge-handle], [data-lms-whiteboard-document-drag], [data-lms-whiteboard-document-drag-ring], [data-lms-whiteboard-document-ink]')) {
            return;
        }
        const scrollablePreview = event.target.closest('iframe, .lms-whiteboard-document-frame');
        if (scrollablePreview) {
            if (typeof setLmsWhiteboardSelection === 'function') setLmsWhiteboardSelection([elementId]);
            return;
        }
        if (typeof setLmsWhiteboardSelection === 'function') setLmsWhiteboardSelection([elementId]);
        event.preventDefault();
        event.stopPropagation();
        if (typeof beginLmsWhiteboardShellDrag === 'function') {
            beginLmsWhiteboardShellDrag(event, resourceKey, canvas, { elementId, mode: 'move' });
        }
    });
    badge?.addEventListener('dblclick', async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const workspace = typeof ensureLmsWhiteboardWorkspace === 'function'
            ? ensureLmsWhiteboardWorkspace(resourceKey)
            : { elements: [] };
        const element = (workspace.elements || []).find(item => item.id === elementId);
        if (!element || element.locked) return;
        const isImage = isLmsWhiteboardImageMime(element.mimeType, element.fileName);
        const isPdf = isLmsWhiteboardPdfMime(element.mimeType, element.fileName);
        if (!isImage && !isPdf) return;
        try {
            const blob = await resolveLmsWhiteboardFileBlob(element);
            if (!blob) return;
            const aspect = isImage
                ? await readLmsWhiteboardImageAspectRatio({ type: blob.type, name: element.fileName, blob })
                : await readLmsWhiteboardPdfAspectRatio({ type: blob.type, name: element.fileName, blob });
            if (!applyLmsWhiteboardDocumentShellAspect(element, aspect)) return;
            if (typeof commitLmsWhiteboardEdit === 'function') {
                commitLmsWhiteboardEdit(resourceKey, 'fit-document', { op: { element } });
            }
            if (typeof paintLmsWhiteboardCanvas === 'function') paintLmsWhiteboardCanvas(resourceKey);
            if (typeof repositionLmsWhiteboardDocumentViewers === 'function') repositionLmsWhiteboardDocumentViewers(canvas);
            if (isPdf) {
                shell.dataset.lmsWhiteboardMountedKey = '';
                void mountLmsWhiteboardDocumentViewer(shell, element);
            }
        } catch (error) {
            console.warn('[whiteboard] fit-to-content failed', error);
        }
    });

    shell.querySelectorAll('[data-lms-whiteboard-document-handle], [data-lms-whiteboard-document-edge-handle]').forEach(handle => {
        handle.addEventListener('pointerdown', (event) => {
            if (LMS_WHITEBOARD_UI.tool !== 'select') return;
            event.preventDefault();
            event.stopPropagation();
            if (typeof beginLmsWhiteboardShellDrag === 'function') {
                beginLmsWhiteboardShellDrag(event, resourceKey, canvas, {
                    elementId,
                    mode: 'resize',
                    handle: handle.dataset.handle || handle.dataset.lmsWhiteboardDocumentHandle
                });
            }
        });
    });

    inkCanvas?.addEventListener('pointerdown', (event) => {
        const tool = LMS_WHITEBOARD_UI.tool;
        const drawTools = ['pen', 'eraser', 'sticky', 'text'];
        if (tool !== 'select' && !drawTools.includes(tool)) return;
        if (tool !== 'select' && typeof canEditLmsWhiteboard === 'function' && !canEditLmsWhiteboard(resourceKey)) return;
        event.preventDefault();
        event.stopPropagation();
        const workspace = typeof ensureLmsWhiteboardWorkspace === 'function'
            ? ensureLmsWhiteboardWorkspace(resourceKey)
            : { elements: [] };
        const element = (workspace.elements || []).find(item => item.id === elementId);
        if (!element || element.locked) return;
        const localPoint = inkEventToDocumentLocal(event, shell, element);

        if (tool === 'select') {
            const shellHandle = hitTestLmsWhiteboardDocumentShellResizeZone(shell, event.clientX, event.clientY);
            if (shellHandle && typeof beginLmsWhiteboardShellDrag === 'function') {
                beginLmsWhiteboardShellDrag(event, resourceKey, canvas, {
                    elementId,
                    mode: 'resize',
                    handle: shellHandle
                });
                return;
            }
            const selectedIds = typeof getLmsWhiteboardSelectedIds === 'function' ? getLmsWhiteboardSelectedIds() : [];
            let resizeTarget = null;
            if (selectedIds.length === 1) {
                const selected = workspace.elements.find(item => item.id === selectedIds[0]);
                if (selected?.parentDocumentId === elementId) resizeTarget = selected;
            }
            const childAtPoint = findLmsWhiteboardDocumentChildAtPoint(resourceKey, elementId, localPoint);
            if (!resizeTarget) resizeTarget = childAtPoint;
            if (resizeTarget && typeof hitTestLmsWhiteboardResizeZone === 'function') {
                const resizeHandle = hitTestLmsWhiteboardResizeZone(localPoint, resizeTarget, { local: true });
                if (resizeHandle) {
                    if (typeof setLmsWhiteboardSelection === 'function') setLmsWhiteboardSelection([resizeTarget.id], { skipPaint: true });
                    if (typeof recordLmsWhiteboardHistoryGesture === 'function') recordLmsWhiteboardHistoryGesture(resourceKey);
                    LMS_WHITEBOARD_UI.dragStart = {
                        mode: 'resize',
                        documentLocal: true,
                        parentDocumentId: elementId,
                        handle: resizeHandle,
                        x: localPoint.x,
                        y: localPoint.y,
                        element: JSON.parse(JSON.stringify(resizeTarget))
                    };
                    inkCanvas.setPointerCapture?.(event.pointerId);
                    attachLmsWhiteboardDocumentInkWindowListeners(resourceKey, endInkGesture, inkWindowMove);
                    repaintLmsWhiteboardDocumentInk(elementId);
                    return;
                }
            }
            if (childAtPoint) {
                const current = typeof getLmsWhiteboardSelectedIds === 'function' ? getLmsWhiteboardSelectedIds() : [];
                if (current.includes(childAtPoint.id) && current.length > 1) {
                    if (typeof recordLmsWhiteboardHistoryGesture === 'function') recordLmsWhiteboardHistoryGesture(resourceKey);
                    const elementSnapshots = {};
                    current.forEach(id => {
                        const el = workspace.elements.find(item => item.id === id);
                        if (el) elementSnapshots[id] = JSON.parse(JSON.stringify(el));
                    });
                    LMS_WHITEBOARD_UI.dragStart = {
                        mode: 'move',
                        documentLocal: true,
                        parentDocumentId: elementId,
                        x: localPoint.x,
                        y: localPoint.y,
                        element: JSON.parse(JSON.stringify(childAtPoint)),
                        selectedIds: current,
                        elements: elementSnapshots
                    };
                } else {
                    if (typeof setLmsWhiteboardSelection === 'function') setLmsWhiteboardSelection([childAtPoint.id], { skipPaint: true });
                    if (typeof recordLmsWhiteboardHistoryGesture === 'function') recordLmsWhiteboardHistoryGesture(resourceKey);
                    LMS_WHITEBOARD_UI.dragStart = {
                        mode: 'move',
                        documentLocal: true,
                        parentDocumentId: elementId,
                        x: localPoint.x,
                        y: localPoint.y,
                        element: JSON.parse(JSON.stringify(childAtPoint)),
                        selectedIds: [childAtPoint.id],
                        elements: { [childAtPoint.id]: JSON.parse(JSON.stringify(childAtPoint)) }
                    };
                }
                inkCanvas.setPointerCapture?.(event.pointerId);
                attachLmsWhiteboardDocumentInkWindowListeners(resourceKey, endInkGesture, inkWindowMove);
                return;
            }
            LMS_WHITEBOARD_UI.dragStart = {
                mode: 'marquee',
                documentLocal: true,
                parentDocumentId: elementId,
                x: localPoint.x,
                y: localPoint.y,
                x2: localPoint.x,
                y2: localPoint.y,
                additive: Boolean(event.shiftKey)
            };
            inkCanvas.setPointerCapture?.(event.pointerId);
            attachLmsWhiteboardDocumentInkWindowListeners(resourceKey, endInkGesture, inkWindowMove);
            repaintLmsWhiteboardDocumentInk(elementId);
            return;
        }

        if (tool === 'pen' && typeof beginLmsWhiteboardDocumentStroke === 'function') {
            beginLmsWhiteboardDocumentStroke(resourceKey, elementId, localPoint);
        } else if (tool === 'eraser' && typeof eraseLmsWhiteboardAtPoint === 'function') {
            if (typeof recordLmsWhiteboardHistoryGesture === 'function') recordLmsWhiteboardHistoryGesture(resourceKey);
            eraseLmsWhiteboardAtPoint(resourceKey, localPoint, { parentDocumentId: elementId });
            LMS_WHITEBOARD_UI.drawing = true;
        } else {
            handleLmsWhiteboardDocumentToolDown(event, shell, canvas, resourceKey, element, elementId);
        }
        inkCanvas.setPointerCapture?.(event.pointerId);
        attachLmsWhiteboardDocumentInkWindowListeners(resourceKey, endInkGesture, inkWindowMove);
    });
    inkCanvas?.addEventListener('pointermove', (event) => {
        const workspace = typeof ensureLmsWhiteboardWorkspace === 'function'
            ? ensureLmsWhiteboardWorkspace(resourceKey)
            : { elements: [] };
        const element = (workspace.elements || []).find(item => item.id === elementId);
        if (!element) return;
        const localPoint = inkEventToDocumentLocal(event, shell, element);

        if (LMS_WHITEBOARD_UI.tool === 'select' && LMS_WHITEBOARD_UI.dragStart?.documentLocal) {
            if (LMS_WHITEBOARD_UI.dragStart.mode === 'marquee') {
                LMS_WHITEBOARD_UI.dragStart.x2 = localPoint.x;
                LMS_WHITEBOARD_UI.dragStart.y2 = localPoint.y;
                repaintLmsWhiteboardDocumentInk(elementId);
                return;
            }
            if (LMS_WHITEBOARD_UI.dragStart.mode === 'resize') {
                const child = workspace.elements.find(item => item.id === LMS_WHITEBOARD_UI.dragStart.element?.id);
                if (child && typeof applyLmsWhiteboardElementResize === 'function') {
                    applyLmsWhiteboardElementResize(
                        child,
                        LMS_WHITEBOARD_UI.dragStart.element,
                        LMS_WHITEBOARD_UI.dragStart.handle,
                        localPoint,
                        { local: true }
                    );
                    repaintLmsWhiteboardDocumentInk(elementId);
                    if (LMS_WHITEBOARD_UI.inlineEdit?.elementId === child.id && typeof repositionLmsWhiteboardInlineEditor === 'function') {
                        repositionLmsWhiteboardInlineEditor(canvas);
                    }
                }
                return;
            }
            const dx = localPoint.x - LMS_WHITEBOARD_UI.dragStart.x;
            const dy = localPoint.y - LMS_WHITEBOARD_UI.dragStart.y;
            (LMS_WHITEBOARD_UI.dragStart.selectedIds || []).forEach(id => {
                const child = workspace.elements.find(item => item.id === id);
                const base = LMS_WHITEBOARD_UI.dragStart.elements?.[id];
                if (!child || !base || child.parentDocumentId !== elementId) return;
                if (child.type === 'stroke' && Array.isArray(base.points)) {
                    child.points = base.points.map(([x, y]) => [x + dx, y + dy]);
                } else {
                    child.x = (base.x || 0) + dx;
                    child.y = (base.y || 0) + dy;
                }
            });
            repaintLmsWhiteboardDocumentInk(elementId);
            return;
        }

        if (LMS_WHITEBOARD_UI.tool === 'select' && !LMS_WHITEBOARD_UI.dragStart) {
            syncLmsWhiteboardDocumentPointerCursor(inkCanvas, shell, resourceKey, elementId, localPoint, event);
            return;
        }

        updateLmsWhiteboardDocumentInkGesture(shell, resourceKey, elementId, localPoint);
    });
    const inkWindowMove = (event) => {
        const workspace = typeof ensureLmsWhiteboardWorkspace === 'function'
            ? ensureLmsWhiteboardWorkspace(resourceKey)
            : { elements: [] };
        const element = (workspace.elements || []).find(item => item.id === elementId);
        if (!element) return;
        const localPoint = inkEventToDocumentLocal(event, shell, element);
        if (LMS_WHITEBOARD_UI.tool === 'select' && LMS_WHITEBOARD_UI.dragStart?.documentLocal) {
            if (LMS_WHITEBOARD_UI.dragStart.mode === 'marquee') {
                LMS_WHITEBOARD_UI.dragStart.x2 = localPoint.x;
                LMS_WHITEBOARD_UI.dragStart.y2 = localPoint.y;
                repaintLmsWhiteboardDocumentInk(elementId);
                return;
            }
            if (LMS_WHITEBOARD_UI.dragStart.mode === 'resize') {
                const child = workspace.elements.find(item => item.id === LMS_WHITEBOARD_UI.dragStart.element?.id);
                if (child && typeof applyLmsWhiteboardElementResize === 'function') {
                    applyLmsWhiteboardElementResize(
                        child,
                        LMS_WHITEBOARD_UI.dragStart.element,
                        LMS_WHITEBOARD_UI.dragStart.handle,
                        localPoint,
                        { local: true }
                    );
                    repaintLmsWhiteboardDocumentInk(elementId);
                }
                return;
            }
            const dx = localPoint.x - LMS_WHITEBOARD_UI.dragStart.x;
            const dy = localPoint.y - LMS_WHITEBOARD_UI.dragStart.y;
            (LMS_WHITEBOARD_UI.dragStart.selectedIds || []).forEach(id => {
                const child = workspace.elements.find(item => item.id === id);
                const base = LMS_WHITEBOARD_UI.dragStart.elements?.[id];
                if (!child || !base || child.parentDocumentId !== elementId) return;
                if (child.type === 'stroke' && Array.isArray(base.points)) {
                    child.points = base.points.map(([x, y]) => [x + dx, y + dy]);
                } else {
                    child.x = (base.x || 0) + dx;
                    child.y = (base.y || 0) + dy;
                }
            });
            repaintLmsWhiteboardDocumentInk(elementId);
            return;
        }
        updateLmsWhiteboardDocumentInkGesture(shell, resourceKey, elementId, localPoint);
    };
    const endInkGesture = (event) => {
        if (LMS_WHITEBOARD_UI.tool === 'select' && LMS_WHITEBOARD_UI.dragStart?.documentLocal) {
            const workspace = typeof ensureLmsWhiteboardWorkspace === 'function'
                ? ensureLmsWhiteboardWorkspace(resourceKey)
                : { elements: [] };
            if (LMS_WHITEBOARD_UI.dragStart.mode === 'marquee') {
                const dragStart = LMS_WHITEBOARD_UI.dragStart;
                LMS_WHITEBOARD_UI.dragStart = null;
                if (typeof isLmsWhiteboardMarqueeDragSignificant === 'function'
                    && isLmsWhiteboardMarqueeDragSignificant(dragStart)
                    && typeof getLmsWhiteboardMarqueeDragRect === 'function'
                    && typeof findLmsWhiteboardElementsInMarquee === 'function') {
                    const rect = getLmsWhiteboardMarqueeDragRect(dragStart);
                    const ids = findLmsWhiteboardElementsInMarquee(resourceKey, rect, { parentDocumentId: elementId });
                    if (typeof setLmsWhiteboardSelection === 'function') {
                        setLmsWhiteboardSelection(ids, { skipPaint: true, additive: Boolean(dragStart.additive) });
                    }
                } else if (typeof setLmsWhiteboardSelection === 'function') {
                    setLmsWhiteboardSelection([elementId], { skipPaint: true });
                }
                repaintLmsWhiteboardDocumentInk(elementId);
                if (typeof paintLmsWhiteboardCanvas === 'function') paintLmsWhiteboardCanvas(resourceKey, canvas);
                inkCanvas?.releasePointerCapture?.(event?.pointerId);
                return;
            }
            const targetId = LMS_WHITEBOARD_UI.dragStart.element?.id;
            const moveIds = LMS_WHITEBOARD_UI.dragStart.selectedIds?.length
                ? LMS_WHITEBOARD_UI.dragStart.selectedIds
                : [targetId].filter(Boolean);
            if (LMS_WHITEBOARD_UI.dragStart.mode === 'move' && moveIds.length > 1 && typeof commitLmsWhiteboardEdit === 'function') {
                const ops = moveIds.map(id => {
                    const moved = workspace.elements.find(item => item.id === id);
                    return moved ? { element: moved } : null;
                }).filter(Boolean);
                if (ops.length) commitLmsWhiteboardEdit(resourceKey, 'move-document-child', { ops, forceFullSync: true });
            } else {
                const child = workspace.elements.find(item => item.id === targetId);
                if (child && typeof commitLmsWhiteboardEdit === 'function') {
                    const reason = LMS_WHITEBOARD_UI.dragStart.mode === 'resize' ? 'resize-document-child' : 'move-document-child';
                    commitLmsWhiteboardEdit(resourceKey, reason, { op: { element: child } });
                }
            }
            LMS_WHITEBOARD_UI.dragStart = null;
            LMS_WHITEBOARD_UI.historyGestureRecorded = false;
            repaintLmsWhiteboardDocumentInk(elementId);
            inkCanvas?.releasePointerCapture?.(event?.pointerId);
            return;
        }
        if (!LMS_WHITEBOARD_UI.drawing) return;
        const tool = LMS_WHITEBOARD_UI.tool;
        if (tool === 'text' && LMS_WHITEBOARD_UI.currentStroke?.parentDocumentId === elementId) {
            handleLmsWhiteboardDocumentTextCommit(resourceKey, elementId, canvas);
        } else if (typeof finishLmsWhiteboardDocumentStroke === 'function') {
            finishLmsWhiteboardDocumentStroke(resourceKey);
            repaintLmsWhiteboardDocumentInk(elementId);
        } else {
            LMS_WHITEBOARD_UI.drawing = false;
        }
        inkCanvas?.releasePointerCapture?.(event?.pointerId);
    };
    inkCanvas?.addEventListener('pointerup', endInkGesture);
    inkCanvas?.addEventListener('pointercancel', endInkGesture);
    inkCanvas?.addEventListener('pointerleave', () => {
        if (typeof refreshLmsWhiteboardPointerCursor === 'function') {
            refreshLmsWhiteboardPointerCursor(canvas, { point: null });
        }
    });
    inkCanvas?.addEventListener('dblclick', (event) => {
        if (LMS_WHITEBOARD_UI.tool !== 'select') return;
        const workspace = typeof ensureLmsWhiteboardWorkspace === 'function'
            ? ensureLmsWhiteboardWorkspace(resourceKey)
            : { elements: [] };
        const element = (workspace.elements || []).find(item => item.id === elementId);
        if (!element) return;
        const localPoint = inkEventToDocumentLocal(event, shell, element);
        const child = findLmsWhiteboardDocumentChildAtPoint(resourceKey, elementId, localPoint);
        if (!child || !['sticky', 'text'].includes(child.type)) return;
        event.preventDefault();
        event.stopPropagation();
        if (typeof openLmsWhiteboardInlineEditor === 'function') {
            openLmsWhiteboardInlineEditor({
                resourceKey,
                elementId: child.id,
                mode: child.type === 'sticky' ? 'edit-sticky' : 'edit-text',
                canvas,
                isNew: false
            });
        }
    });
}

function repositionLmsWhiteboardDocumentChrome(shell, canvas, element = {}) {
    const chrome = shell.querySelector('[data-lms-whiteboard-document-chrome]');
    if (!chrome || typeof getLmsWhiteboardResizeHandlePoints !== 'function' || typeof worldToStageOffset !== 'function') return;
    const bounds = typeof getLmsWhiteboardElementBounds === 'function'
        ? getLmsWhiteboardElementBounds(element)
        : null;
    if (!bounds) return;
    const shellOrigin = worldToStageOffset(canvas, bounds.x, bounds.y, 0, 0);
    const shellW = Math.max(shell.offsetWidth || 0, 80);
    const shellH = Math.max(shell.offsetHeight || 0, 80);
    const strip = 10;
    chrome.querySelectorAll('[data-lms-whiteboard-document-edge-handle]').forEach(node => {
        const handleId = node.dataset.handle || node.dataset.lmsWhiteboardDocumentHandle;
        node.style.margin = '0';
        if (handleId === 'n') {
            node.style.left = '0';
            node.style.top = '0';
            node.style.right = 'auto';
            node.style.bottom = 'auto';
            node.style.width = `${shellW}px`;
            node.style.height = `${strip}px`;
        } else if (handleId === 's') {
            node.style.left = '0';
            node.style.bottom = '0';
            node.style.top = 'auto';
            node.style.right = 'auto';
            node.style.width = `${shellW}px`;
            node.style.height = `${strip}px`;
        } else if (handleId === 'e') {
            node.style.top = '0';
            node.style.right = '0';
            node.style.left = 'auto';
            node.style.bottom = 'auto';
            node.style.width = `${strip}px`;
            node.style.height = `${shellH}px`;
        } else if (handleId === 'w') {
            node.style.top = '0';
            node.style.left = '0';
            node.style.right = 'auto';
            node.style.bottom = 'auto';
            node.style.width = `${strip}px`;
            node.style.height = `${shellH}px`;
        }
    });
    chrome.querySelectorAll('.lms-whiteboard-document-handle').forEach(node => {
        if (node.classList.contains('lms-whiteboard-document-edge-handle')) return;
        const handleId = node.dataset.handle || node.dataset.lmsWhiteboardDocumentHandle;
        const handlePoint = getLmsWhiteboardResizeHandlePoints(bounds, element).find(item => item.id === handleId);
        if (!handlePoint) return;
        const handleOffset = worldToStageOffset(canvas, handlePoint.x, handlePoint.y, 0, 0);
        node.style.left = `${handleOffset.left - shellOrigin.left}px`;
        node.style.top = `${handleOffset.top - shellOrigin.top}px`;
    });
}

function repositionLmsWhiteboardDocumentViewers(canvas) {
    if (!canvas || typeof worldToStageOffset !== 'function') return;
    const stage = canvas.closest('[data-lms-whiteboard-region="stage"]');
    const layer = stage?.querySelector('[data-lms-whiteboard-document-layer]');
    if (!layer) return;
    const resourceKey = LMS_WHITEBOARD_UI.boundKey;
    layer.querySelectorAll('[data-lms-whiteboard-document-view]').forEach(shell => {
        const elementId = shell.dataset.lmsWhiteboardDocumentView;
        const workspace = typeof ensureLmsWhiteboardWorkspace === 'function'
            ? ensureLmsWhiteboardWorkspace(resourceKey)
            : { elements: [] };
        const element = (workspace.elements || []).find(item => item.id === elementId);
        if (!element || element.hidden) {
            revokeLmsWhiteboardDocumentShellUrl(shell);
            shell.remove();
            return;
        }
        const bounds = typeof getLmsWhiteboardElementBounds === 'function'
            ? getLmsWhiteboardElementBounds(element)
            : null;
        if (!bounds) return;
        const offset = worldToStageOffset(canvas, bounds.x, bounds.y, bounds.w, bounds.h);
        shell.style.left = `${offset.left}px`;
        shell.style.top = `${offset.top}px`;
        shell.style.width = `${Math.max(offset.width, 80)}px`;
        shell.style.height = `${Math.max(offset.height, 80)}px`;
        const inkCanvas = shell.querySelector('[data-lms-whiteboard-document-ink]');
        if (inkCanvas) paintLmsWhiteboardDocumentOverlayCanvas(inkCanvas, element, resourceKey);
        const pdfCanvas = shell.querySelector('.lms-whiteboard-document-pdf-canvas');
        if (pdfCanvas) void paintLmsWhiteboardDocumentPdfCanvas(pdfCanvas, element);
        repositionLmsWhiteboardDocumentChrome(shell, canvas, element);
        shell.classList.toggle('is-locked', Boolean(element.locked));
    });
    syncLmsWhiteboardDocumentSelectionChrome();
    syncLmsWhiteboardDocumentToolMode();
}

async function mountLmsWhiteboardDocumentViewer(shell, element = {}) {
    const body = shell.querySelector('[data-lms-whiteboard-document-body]') || shell;
    const mime = String(element.mimeType || '').toLowerCase();
    const fileName = String(element.fileName || '').trim();
    const mountKey = `${element.storageKey || ''}:${element.storageBackend || 'bridge'}:${mime}:${fileName}`;
    if (shell.dataset.lmsWhiteboardMountedKey === mountKey) return;
    shell.dataset.lmsWhiteboardMountedKey = mountKey;
    revokeLmsWhiteboardDocumentShellUrl(shell);

    if (isLmsWhiteboardImageMime(mime, fileName)) {
        shell.querySelector('iframe')?.remove();
        let img = shell.querySelector('.lms-whiteboard-document-image');
        if (!img) {
            img = document.createElement('img');
            img.className = 'lms-whiteboard-document-image';
            img.draggable = false;
            img.addEventListener('dragstart', (event) => event.preventDefault());
            body.prepend(img);
        }
        img.draggable = false;
        try {
            const objectUrl = await resolveLmsWhiteboardFileObjectUrl(element);
            if (!objectUrl) throw new Error('Image unavailable.');
            shell.dataset.lmsWhiteboardBlobUrl = objectUrl;
            img.alt = fileName || 'Image';
            img.src = objectUrl;
        } catch (error) {
            img.removeAttribute('src');
            img.alt = 'Could not load image';
        }
        return;
    }

    shell.querySelector('.lms-whiteboard-document-image')?.remove();
    let iframe = shell.querySelector('iframe');
    if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.className = 'lms-whiteboard-document-frame';
        iframe.title = fileName || 'Document';
        body.prepend(iframe);
    }

    if (mime.includes('pdf') || /\.pdf$/i.test(fileName)) {
        shell.querySelector('iframe')?.remove();
        let pdfCanvas = shell.querySelector('.lms-whiteboard-document-pdf-canvas');
        if (!pdfCanvas) {
            pdfCanvas = document.createElement('canvas');
            pdfCanvas.className = 'lms-whiteboard-document-pdf-canvas';
            pdfCanvas.setAttribute('aria-label', fileName || 'PDF preview');
            body.prepend(pdfCanvas);
        }
        revokeLmsWhiteboardDocumentShellUrl(shell);
        await paintLmsWhiteboardDocumentPdfCanvas(pdfCanvas, element);
        return;
    }

    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    iframe.removeAttribute('src');

    if (isLmsWhiteboardWordMime(mime, fileName)) {
        try {
            iframe.srcdoc = await buildLmsWhiteboardDocxSrcdoc(element);
        } catch (error) {
            iframe.srcdoc = '<p style="font:13px sans-serif;padding:12px;">Could not preview document.</p>';
        }
        return;
    }
    if (isLmsWhiteboardSpreadsheetMime(mime, fileName)) {
        try {
            iframe.srcdoc = await buildLmsWhiteboardSpreadsheetSrcdoc(element);
        } catch (error) {
            iframe.srcdoc = '<p style="font:13px sans-serif;padding:12px;">Could not preview spreadsheet.</p>';
        }
        return;
    }
    iframe.srcdoc = '<p style="font:13px sans-serif;padding:12px;">Preview not available for this file type.</p>';
}

function syncLmsWhiteboardDocumentLayer(resourceKey = '', canvas = null) {
    const targetCanvas = canvas || document.querySelector('.lms-whiteboard-canvas');
    if (!targetCanvas) return;
    const stage = targetCanvas.closest('[data-lms-whiteboard-region="stage"]');
    let layer = stage?.querySelector('[data-lms-whiteboard-document-layer]');
    if (!layer && stage) {
        layer = document.createElement('div');
        layer.className = 'lms-whiteboard-document-layer';
        layer.dataset.lmsWhiteboardDocumentLayer = '';
        layer.setAttribute('aria-hidden', 'true');
        const editLayer = stage.querySelector('[data-lms-whiteboard-edit-layer]');
        if (editLayer) editLayer.insertAdjacentElement('afterend', layer);
        else stage.appendChild(layer);
    }
    if (!layer) return;
    const workspace = typeof ensureLmsWhiteboardWorkspace === 'function'
        ? ensureLmsWhiteboardWorkspace(resourceKey)
        : { elements: [] };
    const documents = (workspace.elements || []).filter(item => item.type === 'document' && !item.hidden);
    const activeIds = new Set(documents.map(item => item.id));
    layer.querySelectorAll('[data-lms-whiteboard-document-view]').forEach(node => {
        if (!activeIds.has(node.dataset.lmsWhiteboardDocumentView)) {
            revokeLmsWhiteboardDocumentShellUrl(node);
            node.remove();
        }
    });
    documents.forEach(element => {
        let shell = layer.querySelector(`[data-lms-whiteboard-document-view="${element.id}"]`);
        if (!shell) {
            shell = document.createElement('div');
            shell.className = 'lms-whiteboard-document-view';
            shell.dataset.lmsWhiteboardDocumentView = element.id;
            const safeName = typeof escapeHtml === 'function' ? escapeHtml(element.fileName || 'Document') : (element.fileName || 'Document');
            shell.innerHTML = `
                ${buildLmsWhiteboardDocumentChromeMarkup()}
                <div class="lms-whiteboard-document-body" data-lms-whiteboard-document-body>
                    <iframe class="lms-whiteboard-document-frame" title="${safeName}" sandbox="allow-scripts allow-same-origin"></iframe>
                </div>
                <canvas class="lms-whiteboard-document-ink" data-lms-whiteboard-document-ink aria-hidden="true"></canvas>
                <div class="lms-whiteboard-document-badge" data-lms-whiteboard-document-drag title="Select (V): scroll inside · drag bar to move">${safeName}</div>`;
            layer.appendChild(shell);
            bindLmsWhiteboardDocumentShellInteractions(shell, targetCanvas, resourceKey);
        }
        void mountLmsWhiteboardDocumentViewer(shell, element);
    });
    layer.querySelectorAll('[data-lms-whiteboard-document-view]').forEach(shell => {
        if (!shell.dataset.lmsWhiteboardInteractionsBound) {
            bindLmsWhiteboardDocumentShellInteractions(shell, targetCanvas, resourceKey);
        }
    });
    repositionLmsWhiteboardDocumentViewers(targetCanvas);
}

async function importLmsWhiteboardDocumentFile(resourceKey = '', file = null, point = null) {
    if (!file || !resourceKey) return;
    if (!isLmsWhiteboardImportableFile(file)) return;
    if (typeof canEditLmsWhiteboard === 'function' && !canEditLmsWhiteboard(resourceKey)) return;
    try {
        const fileName = file.name || 'document';
        const uploaded = await uploadLmsWhiteboardStoredFile({
            blob: file,
            name: fileName,
            type: file.type,
            size: file.size
        });
        const aspectRatio = await readLmsWhiteboardDocumentAspectRatio(file);
        const box = typeof computeLmsWhiteboardImportBox === 'function'
            ? computeLmsWhiteboardImportBox({ point, aspectRatio, margin: 0.10, fill: 0.55 })
            : { x: (point?.x || 120) - 200, y: (point?.y || 120) - 150, w: 400, h: 300 };
        if (isLmsWhiteboardPdfMime(file.type, fileName)) {
            box.h += LMS_WHITEBOARD_DOCUMENT_BADGE_HEIGHT;
        }
        const element = {
            type: 'document',
            id: typeof makeLmsWhiteboardId === 'function' ? makeLmsWhiteboardId('document') : `document-${Date.now()}`,
            x: box.x,
            y: box.y,
            w: box.w,
            h: box.h,
            storageKey: uploaded.storageKey,
            storageBackend: uploaded.storageBackend,
            mimeType: file.type || 'application/octet-stream',
            fileName,
            pageIndex: 0,
            pageCount: 1,
            pageAspect: isLmsWhiteboardPdfMime(file.type, fileName) ? aspectRatio : undefined,
            authorId: typeof getLmsWhiteboardActorId === 'function' ? getLmsWhiteboardActorId() : ''
        };
        if (typeof normalizeLmsWhiteboardBox === 'function') normalizeLmsWhiteboardBox(element);
        const workspace = typeof ensureLmsWhiteboardWorkspace === 'function'
            ? ensureLmsWhiteboardWorkspace(resourceKey)
            : null;
        if (!workspace) return;
        workspace.elements.push(element);
        if (typeof setLmsWhiteboardTool === 'function') setLmsWhiteboardTool('select');
        if (typeof setLmsWhiteboardSelection === 'function') setLmsWhiteboardSelection([element.id], { skipPaint: true });
        if (typeof commitLmsWhiteboardEdit === 'function') commitLmsWhiteboardEdit(resourceKey, 'document-import', { op: { element } });
        if (typeof paintLmsWhiteboardCanvas === 'function') paintLmsWhiteboardCanvas(resourceKey);
        syncLmsWhiteboardDocumentLayer(resourceKey);
    } catch (error) {
        console.error('[whiteboard] import failed:', error);
        alert(error?.message || 'Could not import file.');
    }
}

window.syncLmsWhiteboardDocumentLayer = syncLmsWhiteboardDocumentLayer;
window.repositionLmsWhiteboardDocumentViewers = repositionLmsWhiteboardDocumentViewers;
window.syncLmsWhiteboardDocumentSelectionChrome = syncLmsWhiteboardDocumentSelectionChrome;
window.syncLmsWhiteboardDocumentToolMode = syncLmsWhiteboardDocumentToolMode;
window.syncLmsWhiteboardDocumentPointerCursor = syncLmsWhiteboardDocumentPointerCursor;
window.repaintLmsWhiteboardDocumentInk = repaintLmsWhiteboardDocumentInk;
window.repaintAllLmsWhiteboardDocumentInks = repaintAllLmsWhiteboardDocumentInks;
window.findLmsWhiteboardDocumentChildAtPoint = findLmsWhiteboardDocumentChildAtPoint;
window.documentLocalToWorld = documentLocalToWorld;
window.handleLmsWhiteboardDocumentToolDown = handleLmsWhiteboardDocumentToolDown;
window.hitTestLmsWhiteboardDocumentChildLocal = hitTestLmsWhiteboardDocumentChildLocal;
window.importLmsWhiteboardDocumentFile = importLmsWhiteboardDocumentFile;
window.uploadLmsWhiteboardStoredFile = uploadLmsWhiteboardStoredFile;
window.resolveLmsWhiteboardFileBlob = resolveLmsWhiteboardFileBlob;
window.isLmsWhiteboardDocumentMime = isLmsWhiteboardDocumentMime;
window.isLmsWhiteboardImportableFile = isLmsWhiteboardImportableFile;