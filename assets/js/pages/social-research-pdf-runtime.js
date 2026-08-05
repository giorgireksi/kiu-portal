/* Social Research file viewer — PDF (pdf.js), Word (mammoth), PowerPoint (JSZip). */
(function initSocialResearchPdfRuntime() {
    if (window.__KIU_SOCIAL_RESEARCH_PDF_RUNTIME_LOADED) return;
    window.__KIU_SOCIAL_RESEARCH_PDF_RUNTIME_LOADED = true;

    const PDFJS_VERSION = '3.11.174';
    const PDF_NATURAL_SCALE = 96 / 72;
    const MAMMOTH_CDN = 'https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js';
    const JSZIP_CDN = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';

    let pdfJsLoading = null;
    let mammothLoading = null;
    let jsZipLoading = null;
    let activeDoc = null;
    let activeDocKey = '';
    let activePage = 1;
    let activeZoom = 1;
    let activeViewMode = 'scroll';
    let activeFileKind = 'pdf';
    let activeSlideCount = 0;
    let activeSlidesHtml = [];
    let paintToken = 0;
    let pdfViewportObserver = null;
    let pdfViewportResizeTimer = null;
    let pdfZoomRepaintTimer = null;
    const pdfTextContentCache = new Map();

    function getPdfViewportElement(shell) {
        return shell?.querySelector('[data-research-pdf-viewport]');
    }

    function measurePdfViewportBox(viewportEl) {
        if (!viewportEl) return { width: 0, height: 0 };
        const { padX, padY } = getPdfViewportPadding(viewportEl);
        return {
            width: Math.max(1, viewportEl.clientWidth - padX),
            height: Math.max(1, viewportEl.clientHeight - padY)
        };
    }

    function measurePdfShellBox(shell) {
        const viewportEl = getPdfViewportElement(shell);
        if (!shell || !viewportEl) return { width: 0, height: 0 };
        return measurePdfViewportBox(viewportEl);
    }

    function getPdfViewportPadding(viewportEl) {
        if (!viewportEl) return { padX: 0, padY: 0 };
        const style = window.getComputedStyle(viewportEl);
        return {
            padX: (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0),
            padY: (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0)
        };
    }

    function clearPdfViewportPageSize(shell) {
        const viewportEl = getPdfViewportElement(shell);
        if (viewportEl) {
            ['height', 'minHeight', 'maxHeight'].forEach((prop) => {
                viewportEl.style.removeProperty(prop);
            });
            viewportEl.classList.remove('is-zoomed-past-fit');
        }
        const thumbsHost = shell?.querySelector('[data-research-pdf-thumbs]');
        if (thumbsHost) {
            ['minHeight', 'maxHeight'].forEach((prop) => {
                thumbsHost.style.removeProperty(prop);
            });
        }
    }

    function syncPdfViewportToPage(shell, page, scale) {
        const viewportEl = getPdfViewportElement(shell);
        if (!viewportEl || !page) return;
        disconnectPdfViewportObserver();
        const { padY } = getPdfViewportPadding(viewportEl);
        const rendered = page.getViewport({ scale });
        const heightPx = `${Math.ceil(rendered.height + padY)}px`;
        viewportEl.style.height = heightPx;
        viewportEl.style.minHeight = heightPx;
        viewportEl.style.maxHeight = heightPx;
        if (activeViewMode === 'pages') {
            const thumbsHost = shell?.querySelector('[data-research-pdf-thumbs]');
            if (thumbsHost) {
                thumbsHost.style.minHeight = heightPx;
                thumbsHost.style.maxHeight = heightPx;
            }
            syncPagesViewportOverflow(shell, page, scale);
        } else {
            viewportEl.classList.remove('is-zoomed-past-fit');
        }
        bindPdfViewportObserver(shell);
    }

    function computeDefaultPdfScale(page, shell) {
        const baseViewport = page.getViewport({ scale: 1 });
        const box = measurePdfShellBox(shell);
        if (box.width <= 1) return Math.max(0.1, activeZoom);
        const widthFit = box.width / baseViewport.width;
        const fit = Math.min(widthFit, PDF_NATURAL_SCALE);
        return Math.max(0.1, fit * activeZoom);
    }

    function resolvePdfPageScale(page, shell) {
        return computeDefaultPdfScale(page, shell);
    }

    function syncPagesViewportOverflow(shell, page, scale) {
        const viewportEl = getPdfViewportElement(shell);
        if (!viewportEl) return;
        if (activeViewMode !== 'pages') {
            viewportEl.classList.remove('is-zoomed-past-fit');
            return;
        }
        const box = measurePdfShellBox(shell);
        const rendered = page.getViewport({ scale });
        const overflowsWidth = rendered.width > box.width + 1;
        viewportEl.classList.toggle('is-zoomed-past-fit', overflowsWidth);
    }

    function disconnectPdfViewportObserver() {
        if (pdfViewportObserver) {
            pdfViewportObserver.disconnect();
            pdfViewportObserver = null;
        }
        if (pdfViewportResizeTimer) {
            clearTimeout(pdfViewportResizeTimer);
            pdfViewportResizeTimer = null;
        }
    }

    function bindPdfViewportObserver(shell) {
        disconnectPdfViewportObserver();
        if (!shell || typeof ResizeObserver === 'undefined') return;
        pdfViewportObserver = new ResizeObserver(() => {
            if (activeFileKind !== 'pdf' || !activeDoc) return;
            clearTimeout(pdfViewportResizeTimer);
            pdfViewportResizeTimer = setTimeout(() => {
                repaintPdfPages({ skipSync: true, skipThumbs: true });
            }, 120);
        });
        pdfViewportObserver.observe(shell);
    }

    function getViewerShell() {
        return document.querySelector('[data-research-viewer-shell="1"]')
            || document.querySelector('[data-research-pdf-shell="1"]');
    }

    function getViewerHost(shell) {
        return shell?.querySelector('[data-research-viewer-host]')
            || shell?.querySelector('[data-research-pdf-pages]');
    }

    function getResearchViewerRuntime() {
        if (typeof getPortalSocialRuntimeState === 'function') {
            return getPortalSocialRuntimeState();
        }
        if (typeof window.getPortalSocialRuntimeState === 'function') {
            return window.getPortalSocialRuntimeState();
        }
        if (typeof window.getSocialRuntime === 'function') {
            return window.getSocialRuntime();
        }
        return null;
    }

    function syncViewerStateFromRuntime(shell) {
        const runtime = getResearchViewerRuntime();
        activeViewMode = String(
            runtime?.ui?.researchPdfViewMode
            || shell?.getAttribute('data-view-mode')
            || 'scroll'
        ).trim() || 'scroll';
        activeZoom = Number(runtime?.ui?.researchPdfZoom || 1) || 1;
        activePage = Math.max(1, Number(runtime?.ui?.researchPdfPage || 1) || 1);
        if (shell) shell.setAttribute('data-view-mode', activeViewMode);
    }

    function persistViewerPage(page) {
        activePage = page;
        const runtime = getResearchViewerRuntime();
        if (runtime?.ui) runtime.ui.researchPdfPage = page;
    }

    function persistViewerZoom(zoom) {
        activeZoom = zoom;
        const runtime = getResearchViewerRuntime();
        if (runtime?.ui) runtime.ui.researchPdfZoom = zoom;
    }

    function getShellFileCacheKey(shell) {
        if (!shell) return '';
        const storageKey = String(shell.getAttribute('data-storage-key') || '').trim();
        const fileUrl = String(shell.getAttribute('data-file-url') || '').trim();
        const dataUrl = String(shell.getAttribute('data-data-url') || '').trim();
        return [storageKey, fileUrl, dataUrl].filter(Boolean).join('|');
    }

    function clearPdfDocCache() {
        activeDoc = null;
        activeDocKey = '';
        pdfTextContentCache.clear();
        if (pdfZoomRepaintTimer) {
            clearTimeout(pdfZoomRepaintTimer);
            pdfZoomRepaintTimer = null;
        }
        const shell = getViewerShell();
        if (shell) clearPdfViewportPageSize(shell);
        disconnectPdfViewportObserver();
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function loadExternalScript(src) {
        return new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${src}"]`);
            if (existing) {
                if (existing.dataset.kiuLoaded === '1') {
                    resolve();
                    return;
                }
                existing.addEventListener('load', () => resolve(), { once: true });
                existing.addEventListener('error', () => reject(new Error(`Could not load ${src}`)), { once: true });
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                script.dataset.kiuLoaded = '1';
                resolve();
            };
            script.onerror = () => reject(new Error(`Could not load ${src}`));
            document.head.appendChild(script);
        });
    }

    async function ensurePdfJs() {
        if (window.pdfjsLib) return window.pdfjsLib;
        if (!pdfJsLoading) {
            pdfJsLoading = loadExternalScript(
                `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.js`
            ).then(() => {
                if (!window.pdfjsLib) throw new Error('pdf.js unavailable.');
                window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`;
                return window.pdfjsLib;
            });
        }
        return pdfJsLoading;
    }

    async function ensureMammoth() {
        if (window.mammoth) return window.mammoth;
        if (!mammothLoading) {
            mammothLoading = loadExternalScript(MAMMOTH_CDN).then(() => {
                if (!window.mammoth) throw new Error('Document converter unavailable.');
                return window.mammoth;
            });
        }
        return mammothLoading;
    }

    function sanitizeResearchDocumentHtml(value = '') {
        const template = document.createElement('template');
        template.innerHTML = String(value || '');
        const allowedTags = new Set([
            'A', 'B', 'BLOCKQUOTE', 'BR', 'CODE', 'EM', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
            'HR', 'I', 'IMG', 'LI', 'OL', 'P', 'PRE', 'S', 'SPAN', 'STRONG', 'TABLE', 'TBODY',
            'TD', 'TFOOT', 'TH', 'THEAD', 'TR', 'U', 'UL'
        ]);
        template.content.querySelectorAll('script,style,iframe,object,embed,form,link,meta,svg,math').forEach((node) => node.remove());
        template.content.querySelectorAll('*').forEach((node) => {
            if (!allowedTags.has(node.tagName)) {
                node.replaceWith(...Array.from(node.childNodes));
                return;
            }
            Array.from(node.attributes).forEach((attribute) => {
                const name = attribute.name.toLowerCase();
                const raw = attribute.value.trim();
                if (name.startsWith('on') || name === 'style' || name === 'srcset') {
                    node.removeAttribute(attribute.name);
                    return;
                }
                if (name === 'href') {
                    try {
                        const url = new URL(raw, window.location.origin);
                        if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) node.removeAttribute(attribute.name);
                    } catch (error) {
                        node.removeAttribute(attribute.name);
                    }
                    return;
                }
                if (name === 'src') {
                    const isSafeDataImage = raw.startsWith('data:image/');
                    try {
                        const url = new URL(raw, window.location.origin);
                        if (!isSafeDataImage && !['http:', 'https:'].includes(url.protocol)) node.removeAttribute(attribute.name);
                    } catch (error) {
                        node.removeAttribute(attribute.name);
                    }
                }
            });
            if (node.tagName === 'A') {
                node.setAttribute('rel', 'noopener noreferrer');
                node.setAttribute('target', '_blank');
            }
        });
        return template.innerHTML;
    }

    async function ensureJsZip() {
        if (window.JSZip) return window.JSZip;
        if (!jsZipLoading) {
            jsZipLoading = loadExternalScript(JSZIP_CDN).then(() => {
                if (!window.JSZip) throw new Error('Archive parser unavailable.');
                return window.JSZip;
            });
        }
        return jsZipLoading;
    }

    async function buildResearchFileFetchUrl(shell) {
        const dataUrl = String(shell.getAttribute('data-data-url') || '').trim();
        if (dataUrl) return dataUrl;
        const fileUrl = String(shell.getAttribute('data-file-url') || '').trim();
        if (fileUrl) return fileUrl;
        const storageKey = String(shell.getAttribute('data-storage-key') || '').trim();
        if (!storageKey) return '';
        if (typeof getPortalStoredFileUrl === 'function') {
            return getPortalStoredFileUrl(storageKey, { forDisplay: true, inline: true });
        }
        if (typeof window.resolvePortalSocialFileUrl === 'function') {
            return window.resolvePortalSocialFileUrl({ storageKey }, { forDisplay: true });
        }
        const backend = typeof getKiuPortalBackendUrl === 'function'
            ? String(getKiuPortalBackendUrl() || '').replace(/\/$/, '')
            : '';
        let url = `${backend}/api/files/${encodeURIComponent(storageKey)}?inline=1`;
        const token = typeof getPortalSessionToken === 'function' ? getPortalSessionToken() : '';
        if (token) url += `&token=${encodeURIComponent(token)}`;
        return url;
    }

    async function fetchResearchFileBlob(url) {
        const target = String(url || '').trim();
        if (!target) throw new Error('File source missing.');
        const headers = {};
        const token = typeof getPortalSessionToken === 'function'
            ? getPortalSessionToken()
            : (typeof window.getPortalSessionToken === 'function' ? window.getPortalSessionToken() : '');
        if (token) headers['X-Portal-Session'] = token;
        const response = await fetch(target, {
            method: 'GET',
            credentials: 'include',
            headers,
            cache: 'no-store'
        });
        if (!response.ok) throw new Error(`File fetch failed (${response.status}).`);
        return response.blob();
    }

    async function resolveResearchFileBlob(shell) {
        const url = await buildResearchFileFetchUrl(shell);
        return fetchResearchFileBlob(url);
    }

    async function ensurePdfDocument(shell, token) {
        const pdfjs = await ensurePdfJs();
        const cacheKey = getShellFileCacheKey(shell);
        if (activeDoc && activeDocKey === cacheKey) {
            return pdfjs;
        }
        const blob = await resolveResearchFileBlob(shell);
        if (token !== paintToken) return null;
        const data = await blob.arrayBuffer();
        activeDoc = await pdfjs.getDocument({ data }).promise;
        activeDocKey = cacheKey;
        return pdfjs;
    }

    function patchPdfModeToolbar(mode) {
        const toolbar = document.querySelector('[data-research-viewer-toolbar="1"]');
        if (!toolbar) return;
        toolbar.querySelectorAll('[data-action="research-pdf-mode"]').forEach((btn) => {
            const isActive = text(btn.getAttribute('data-mode')) === mode;
            btn.classList.toggle('is-focused', isActive);
        });
    }

    function text(value) {
        return String(value == null ? '' : value).trim();
    }

    function updateChrome() {
        const zoomLabel = document.querySelector('[data-research-pdf-zoom-label]');
        if (zoomLabel) zoomLabel.textContent = `${Math.round(activeZoom * 100)}%`;
        const pageLabel = document.querySelector('[data-research-pdf-page-label]');
        const total = activeFileKind === 'slides'
            ? (activeSlideCount || 1)
            : (activeDoc?.numPages || 1);
        const noun = activeFileKind === 'slides' ? 'Slide' : 'Page';
        if (pageLabel) pageLabel.textContent = `${noun} ${activePage} / ${total}`;
    }

    function setHostLoading(host, message) {
        if (!host) return;
        host.innerHTML = `<div class="lux-panel-copy social-neo-research-pdf-loading">${escapeHtml(message)}</div>`;
    }

    function setHostError(host, error) {
        if (!host) return;
        host.innerHTML = `<div class="lux-panel-copy">Could not open file. ${escapeHtml(error?.message || error)}</div>`;
    }

    async function paintPdfPage(pageNumber, container, token, pdfjs, shell, options = {}) {
        if (!activeDoc || token !== paintToken) return null;
        const page = await activeDoc.getPage(pageNumber);
        if (token !== paintToken) return null;
        const scale = resolvePdfPageScale(page, shell);
        const viewport = page.getViewport({ scale });
        const cssW = viewport.width;
        const cssH = viewport.height;
        const dpr = window.devicePixelRatio || 1;
        const pageWrap = document.createElement('div');
        pageWrap.className = 'social-neo-research-pdf-page-wrap';
        pageWrap.style.width = `${cssW}px`;
        pageWrap.style.height = `${cssH}px`;
        const canvas = document.createElement('canvas');
        canvas.className = 'social-neo-research-pdf-canvas';
        canvas.dataset.pageNumber = String(pageNumber);
        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(cssH * dpr);
        canvas.style.width = `${cssW}px`;
        canvas.style.height = `${cssH}px`;
        const context = canvas.getContext('2d');
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        await page.render({ canvasContext: context, viewport }).promise;
        if (token !== paintToken) return null;
        pageWrap.appendChild(canvas);
        const textLayerDiv = document.createElement('div');
        textLayerDiv.className = 'textLayer';
        textLayerDiv.style.setProperty('--scale-factor', String(viewport.scale));
        pageWrap.appendChild(textLayerDiv);
        container.appendChild(pageWrap);
        try {
            let textContent = pdfTextContentCache.get(pageNumber);
            if (!textContent) {
                textContent = await page.getTextContent();
                if (token !== paintToken) return null;
                pdfTextContentCache.set(pageNumber, textContent);
            }
            if (token !== paintToken) return null;
            if (typeof pdfjs.TextLayer === 'function') {
                const textLayer = new pdfjs.TextLayer({
                    textContentSource: textContent,
                    container: textLayerDiv,
                    viewport
                });
                await textLayer.render();
            } else if (typeof pdfjs.renderTextLayer === 'function') {
                await pdfjs.renderTextLayer({
                    textContentSource: textContent,
                    container: textLayerDiv,
                    viewport,
                    textDivs: []
                });
            }
        } catch (_error) {
            textLayerDiv.remove();
        }
        return { page, scale };
    }

    function ensurePdfThumbDelegation(shell) {
        if (!shell || shell.dataset.kiuPdfThumbsBound === '1') return;
        shell.dataset.kiuPdfThumbsBound = '1';
        shell.addEventListener('click', (event) => {
            const btn = event.target.closest('.social-neo-research-pdf-thumb');
            if (!btn) return;
            const thumbsHost = shell.querySelector('[data-research-pdf-thumbs]');
            if (!thumbsHost || !thumbsHost.contains(btn)) return;
            const page = Math.max(1, Number(btn.dataset.pageNumber || btn.textContent || 0) || 0);
            if (!page || !activeDoc || activeFileKind !== 'pdf' || activeViewMode !== 'pages') return;
            if (page === activePage) return;
            persistViewerPage(page);
            repaintPdfPages({ skipSync: true, skipThumbs: true });
        });
    }

    function patchPdfThumbActiveState(shell) {
        const thumbsHost = shell?.querySelector('[data-research-pdf-thumbs]');
        if (!thumbsHost) return;
        thumbsHost.querySelectorAll('.social-neo-research-pdf-thumb').forEach((btn) => {
            const page = Math.max(1, Number(btn.dataset.pageNumber || btn.textContent || 0) || 0);
            btn.classList.toggle('is-active', page === activePage);
        });
    }

    function renderPdfThumbs(shell, thumbsHost) {
        if (!thumbsHost || !activeDoc) return;
        ensurePdfThumbDelegation(shell);
        thumbsHost.hidden = activeViewMode !== 'pages';
        thumbsHost.innerHTML = '';
        if (activeViewMode !== 'pages') return;
        for (let i = 1; i <= activeDoc.numPages; i += 1) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `social-neo-research-pdf-thumb${i === activePage ? ' is-active' : ''}`;
            btn.dataset.pageNumber = String(i);
            btn.textContent = String(i);
            thumbsHost.appendChild(btn);
        }
    }

    async function repaintPdfPages(options = {}) {
        const shell = getViewerShell();
        const host = getViewerHost(shell);
        if (!shell || !host || activeFileKind !== 'pdf') return false;
        paintToken += 1;
        const token = paintToken;
        if (!options.skipSync) syncViewerStateFromRuntime(shell);
        if (activeDoc && activePage > activeDoc.numPages) {
            persistViewerPage(activeDoc.numPages);
        }
        try {
            const pdfjs = activeDoc
                ? window.pdfjsLib || await ensurePdfJs()
                : await ensurePdfDocument(shell, token);
            if (!pdfjs || token !== paintToken) return false;
            if (options.rebuildThumbs) {
                const thumbsHost = shell.querySelector('[data-research-pdf-thumbs]');
                renderPdfThumbs(shell, thumbsHost);
                void shell.offsetWidth;
            } else {
                ensurePdfThumbDelegation(shell);
            }
            const staging = document.createDocumentFragment();
            let viewportSyncState = null;
            if (activeViewMode === 'pages') {
                viewportSyncState = await paintPdfPage(activePage, staging, token, pdfjs, shell);
            } else {
                for (let i = 1; i <= activeDoc.numPages; i += 1) {
                    const painted = await paintPdfPage(i, staging, token, pdfjs, shell);
                    if (token !== paintToken) return false;
                    if (!viewportSyncState && painted) viewportSyncState = painted;
                    if (!painted) break;
                }
            }
            if (token !== paintToken) return false;
            if (!staging.childNodes.length) return false;
            host.replaceChildren(...staging.childNodes);
            if (viewportSyncState) {
                syncPdfViewportToPage(shell, viewportSyncState.page, viewportSyncState.scale);
            }
            if (activeViewMode === 'pages') {
                patchPdfThumbActiveState(shell);
            }
            updateChrome();
            return true;
        } catch (error) {
            if (token !== paintToken) return false;
            setHostError(host, error);
            return false;
        }
    }

    async function renderPdfViewer(shell, host, token) {
        syncViewerStateFromRuntime(shell);
        if (!activeDoc || activeDocKey !== getShellFileCacheKey(shell)) {
            setHostLoading(host, 'Loading PDF…');
        }
        const pdfjs = await ensurePdfDocument(shell, token);
        if (!pdfjs || token !== paintToken) return;
        if (activeDoc && activePage > activeDoc.numPages) {
            persistViewerPage(activeDoc.numPages);
        }
        host.innerHTML = '';
        const thumbsHost = shell.querySelector('[data-research-pdf-thumbs]');
        renderPdfThumbs(shell, thumbsHost);
        void shell.offsetWidth;
        ensurePdfThumbDelegation(shell);
        let viewportSyncState = null;
        if (activeViewMode === 'pages') {
            viewportSyncState = await paintPdfPage(activePage, host, token, pdfjs, shell);
        } else {
            for (let i = 1; i <= activeDoc.numPages; i += 1) {
                const painted = await paintPdfPage(i, host, token, pdfjs, shell);
                if (token !== paintToken) return;
                if (!viewportSyncState && painted) viewportSyncState = painted;
            }
        }
        if (viewportSyncState) {
            syncPdfViewportToPage(shell, viewportSyncState.page, viewportSyncState.scale);
        } else {
            bindPdfViewportObserver(shell);
        }
    }

    async function parsePptxSlides(arrayBuffer) {
        const JSZip = await ensureJsZip();
        const zip = await JSZip.loadAsync(arrayBuffer);
        const slidePaths = Object.keys(zip.files)
            .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
            .sort((a, b) => {
                const na = Number(a.match(/slide(\d+)/i)?.[1] || 0);
                const nb = Number(b.match(/slide(\d+)/i)?.[1] || 0);
                return na - nb;
            });
        const media = {};
        await Promise.all(Object.keys(zip.files)
            .filter((name) => /^ppt\/media\//i.test(name))
            .map(async (name) => {
                const blob = await zip.file(name).async('blob');
                media[name.split('/').pop()] = URL.createObjectURL(blob);
            }));
        const slides = [];
        for (const path of slidePaths) {
            const xml = await zip.file(path).async('string');
            const texts = [...xml.matchAll(/<a:t[^>]*>([^<]*)<\/a:t>/g)]
                .map((match) => match[1])
                .filter(Boolean);
            const images = [...xml.matchAll(/<a:blip[^>]*r:embed="([^"]+)"/g)]
                .map((match) => match[1]);
            const relPath = path.replace('slides/', 'slides/_rels/') + '.rels';
            let relXml = '';
            if (zip.file(relPath)) relXml = await zip.file(relPath).async('string');
            const imageHtml = images.map((rid) => {
                const target = relXml.match(new RegExp(`Id="${rid}"[^>]*Target="([^"]+)"`))?.[1]
                    || relXml.match(new RegExp(`Target="([^"]+)"[^>]*Id="${rid}"`))?.[1];
                if (!target) return '';
                const fileName = target.split('/').pop();
                const src = media[fileName];
                return src ? `<img class="social-neo-research-slide-image" src="${src}" alt="">` : '';
            }).join('');
            const textHtml = texts.length
                ? texts.map((line) => `<p>${escapeHtml(line)}</p>`).join('')
                : '<p class="lux-panel-copy">Slide content</p>';
            slides.push(`<article class="social-neo-research-slide-card">${imageHtml}<div class="social-neo-research-slide-text">${textHtml}</div></article>`);
        }
        Object.values(media).forEach((url) => {
            try { setTimeout(() => URL.revokeObjectURL(url), 60000); } catch (_e) {}
        });
        return slides.length ? slides : ['<article class="social-neo-research-slide-card"><p class="lux-panel-copy">No slide content found.</p></article>'];
    }

    function renderActiveSlide(host) {
        if (!host || !activeSlidesHtml.length) return;
        const index = Math.min(activeSlidesHtml.length, Math.max(1, activePage)) - 1;
        host.innerHTML = `<div class="social-neo-research-slides-view lux-scrollbar">${activeSlidesHtml[index]}</div>`;
        updateChrome();
    }

    async function renderSlidesViewer(shell, host, token) {
        setHostLoading(host, 'Loading slides…');
        const blob = await resolveResearchFileBlob(shell);
        if (token !== paintToken) return;
        activeSlidesHtml = await parsePptxSlides(await blob.arrayBuffer());
        activeSlideCount = activeSlidesHtml.length;
        clearPdfDocCache();
        const runtime = getResearchViewerRuntime();
        activePage = Math.min(activeSlideCount, Math.max(1, Number(runtime?.ui?.researchPdfPage || 1) || 1));
        if (runtime?.ui) runtime.ui.researchPdfPage = activePage;
        if (token !== paintToken) return;
        renderActiveSlide(host);
    }

    async function renderDocViewer(shell, host, token) {
        setHostLoading(host, 'Loading document…');
        const blob = await resolveResearchFileBlob(shell);
        if (token !== paintToken) return;
        const mammoth = await ensureMammoth();
        const result = await mammoth.convertToHtml({ arrayBuffer: await blob.arrayBuffer() });
        if (token !== paintToken) return;
        clearPdfDocCache();
        activeSlideCount = 0;
        const safeHtml = sanitizeResearchDocumentHtml(result.value || '<p class="lux-panel-copy">Empty document.</p>');
        host.innerHTML = `<div class="social-neo-research-doc-view lux-scrollbar">${safeHtml}</div>`;
    }

    async function renderViewer(options = {}) {
        const shell = getViewerShell();
        if (!shell) return;
        const host = getViewerHost(shell);
        if (!host) return;
        const nextFileKind = String(shell.getAttribute('data-file-kind') || 'pdf').trim() || 'pdf';
        const nextFileKey = getShellFileCacheKey(shell);
        if (!options.reusePdfCache && (activeFileKind !== nextFileKind || (nextFileKind === 'pdf' && activeDocKey && activeDocKey !== nextFileKey))) {
            clearPdfDocCache();
        }
        paintToken += 1;
        const token = paintToken;
        activeFileKind = nextFileKind;
        if (!options.reusePdfCache) setHostLoading(host, 'Loading file…');
        try {
            if (activeFileKind === 'document') {
                await renderDocViewer(shell, host, token);
            } else if (activeFileKind === 'slides') {
                await renderSlidesViewer(shell, host, token);
            } else {
                await renderPdfViewer(shell, host, token);
            }
            if (token !== paintToken) return;
            updateChrome();
        } catch (error) {
            if (token !== paintToken) return;
            setHostError(host, error);
        }
    }

    function mountSocialResearchFileViewer() {
        const shell = getViewerShell();
        if (!shell) return;
        const host = getViewerHost(shell);
        if (host) setHostLoading(host, 'Loading file…');
        renderViewer();
    }

    function scheduleResearchFileViewerMount() {
        queueMicrotask(() => {
            requestAnimationFrame(() => {
                mountSocialResearchFileViewer();
            });
        });
    }

    function setResearchPdfViewMode(mode) {
        const nextMode = text(mode) === 'pages' ? 'pages' : 'scroll';
        const runtime = getResearchViewerRuntime();
        if (runtime?.ui) runtime.ui.researchPdfViewMode = nextMode;
        activeViewMode = nextMode;
        const shell = getViewerShell();
        if (shell) {
            shell.setAttribute('data-view-mode', nextMode);
            const viewportEl = getPdfViewportElement(shell);
            if (nextMode !== 'pages') viewportEl?.classList.remove('is-zoomed-past-fit');
        }
        patchPdfModeToolbar(nextMode);
        if (activeFileKind === 'pdf' && activeDoc) {
            repaintPdfPages({ skipSync: true, rebuildThumbs: nextMode === 'pages' });
            return true;
        }
        renderViewer();
        return true;
    }

    function schedulePdfZoomRepaint() {
        clearTimeout(pdfZoomRepaintTimer);
        pdfZoomRepaintTimer = setTimeout(() => {
            pdfZoomRepaintTimer = null;
            repaintPdfPages({ skipSync: true, skipThumbs: true });
        }, 100);
    }

    function updateSocialResearchPdfZoom(zoom) {
        const nextZoom = Math.min(2.5, Math.max(0.6, Number(zoom) || 1));
        persistViewerZoom(nextZoom);
        updateChrome();
        if (activeFileKind === 'pdf') {
            if (activeDoc) schedulePdfZoomRepaint();
            else renderViewer();
        }
    }

    function stepSocialResearchPdfPage(delta) {
        if (activeFileKind === 'slides') {
            const total = activeSlideCount || 1;
            persistViewerPage(Math.min(total, Math.max(1, activePage + Number(delta || 0))));
            renderActiveSlide(getViewerHost(getViewerShell()));
            return;
        }
        if (!activeDoc) return;
        persistViewerPage(Math.min(activeDoc.numPages, Math.max(1, activePage + Number(delta || 0))));
        if (activeViewMode === 'pages') {
            repaintPdfPages({ skipSync: true });
            return;
        }
        const canvas = document.querySelector(`[data-research-viewer-host] canvas[data-page-number="${activePage}"], [data-research-pdf-pages] canvas[data-page-number="${activePage}"]`);
        canvas?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        updateChrome();
    }

    window.clearResearchPdfDocCache = clearPdfDocCache;
    window.clearPdfViewportPageSize = clearPdfViewportPageSize;
    window.syncPdfViewportToPage = syncPdfViewportToPage;
    window.getResearchViewerFileCacheKey = getShellFileCacheKey;
    window.resolvePdfPageScale = resolvePdfPageScale;
    window.scheduleResearchFileViewerMount = scheduleResearchFileViewerMount;
    window.mountSocialResearchFileViewer = mountSocialResearchFileViewer;
    window.mountSocialResearchPdfViewer = mountSocialResearchFileViewer;
    window.setResearchPdfViewMode = setResearchPdfViewMode;
    window.repaintResearchPdfPages = repaintPdfPages;
    window.updateSocialResearchPdfZoom = updateSocialResearchPdfZoom;
    window.stepSocialResearchPdfPage = stepSocialResearchPdfPage;
    window.resolveResearchFileBlob = resolveResearchFileBlob;
})();
