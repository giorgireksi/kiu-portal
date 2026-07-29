/* Social Research PDF viewer — lazy pdf.js (same CDN pattern as LMS whiteboard). */
(function initSocialResearchPdfRuntime() {
    if (window.__KIU_SOCIAL_RESEARCH_PDF_RUNTIME_LOADED) return;
    window.__KIU_SOCIAL_RESEARCH_PDF_RUNTIME_LOADED = true;

    const PDFJS_VERSION = '3.11.174';
    let pdfJsLoading = null;
    let activeDoc = null;
    let activePage = 1;
    let activeZoom = 1;
    let activeViewMode = 'scroll';
    let paintToken = 0;

    async function ensurePdfJs() {
        if (window.pdfjsLib) return window.pdfjsLib;
        if (!pdfJsLoading) {
            pdfJsLoading = new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.js`;
                script.onload = () => {
                    if (!window.pdfjsLib) {
                        reject(new Error('pdf.js unavailable.'));
                        return;
                    }
                    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                        `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`;
                    resolve(window.pdfjsLib);
                };
                script.onerror = () => reject(new Error('Could not load PDF parser.'));
                document.head.appendChild(script);
            });
        }
        return pdfJsLoading;
    }

    async function resolvePdfSource(shell) {
        const dataUrl = String(shell.getAttribute('data-data-url') || '').trim();
        if (dataUrl) {
            const response = await fetch(dataUrl);
            return response.arrayBuffer();
        }
        const fileUrl = String(shell.getAttribute('data-file-url') || '').trim();
        if (fileUrl) {
            const response = await fetch(fileUrl);
            if (!response.ok) throw new Error('PDF fetch failed.');
            return response.arrayBuffer();
        }
        throw new Error('PDF source missing.');
    }

    function updateChrome() {
        const zoomLabel = document.querySelector('[data-research-pdf-zoom-label]');
        if (zoomLabel) zoomLabel.textContent = `${Math.round(activeZoom * 100)}%`;
        const pageLabel = document.querySelector('[data-research-pdf-page-label]');
        const total = activeDoc?.numPages || 1;
        if (pageLabel) pageLabel.textContent = `Page ${activePage} / ${total}`;
    }

    async function paintPage(pageNumber, container, token) {
        if (!activeDoc || token !== paintToken) return;
        const page = await activeDoc.getPage(pageNumber);
        if (token !== paintToken) return;
        const viewport = page.getViewport({ scale: activeZoom * 1.25 });
        const canvas = document.createElement('canvas');
        canvas.className = 'social-neo-research-pdf-canvas';
        canvas.dataset.pageNumber = String(pageNumber);
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d');
        await page.render({ canvasContext: context, viewport }).promise;
        if (token !== paintToken) return;
        container.appendChild(canvas);
    }

    async function renderViewer() {
        const shell = document.querySelector('[data-research-pdf-shell="1"]');
        if (!shell) return;
        const pagesHost = shell.querySelector('[data-research-pdf-pages]');
        const thumbsHost = shell.querySelector('[data-research-pdf-thumbs]');
        if (!pagesHost) return;
        paintToken += 1;
        const token = paintToken;
        pagesHost.innerHTML = '<div class="lux-panel-copy social-neo-research-pdf-loading">Loading PDF…</div>';
        try {
            const pdfjs = await ensurePdfJs();
            const data = await resolvePdfSource(shell);
            activeDoc = await pdfjs.getDocument({ data }).promise;
            activeViewMode = String(shell.getAttribute('data-view-mode') || 'scroll');
            const runtime = typeof window.getSocialRuntime === 'function' ? window.getSocialRuntime() : null;
            activeZoom = Number(runtime?.ui?.researchPdfZoom || 1) || 1;
            activePage = Math.max(1, Number(runtime?.ui?.researchPdfPage || 1) || 1);
            if (token !== paintToken) return;
            pagesHost.innerHTML = '';
            if (thumbsHost) {
                thumbsHost.hidden = activeViewMode !== 'pages';
                thumbsHost.innerHTML = '';
            }
            if (activeViewMode === 'pages') {
                await paintPage(activePage, pagesHost, token);
                if (thumbsHost) {
                    for (let i = 1; i <= activeDoc.numPages; i += 1) {
                        const btn = document.createElement('button');
                        btn.type = 'button';
                        btn.className = `social-neo-research-pdf-thumb${i === activePage ? ' is-active' : ''}`;
                        btn.textContent = String(i);
                        btn.addEventListener('click', () => {
                            activePage = i;
                            if (runtime?.ui) runtime.ui.researchPdfPage = i;
                            renderViewer();
                        });
                        thumbsHost.appendChild(btn);
                    }
                }
            } else {
                for (let i = 1; i <= activeDoc.numPages; i += 1) {
                    await paintPage(i, pagesHost, token);
                    if (token !== paintToken) return;
                }
            }
            updateChrome();
        } catch (error) {
            pagesHost.innerHTML = `<div class="lux-panel-copy">Could not open PDF. ${String(error?.message || error)}</div>`;
        }
    }

    function mountSocialResearchPdfViewer() {
        const shell = document.querySelector('[data-research-pdf-shell="1"]');
        if (!shell) return;
        renderViewer();
    }

    function updateSocialResearchPdfZoom(zoom) {
        activeZoom = Math.min(2.5, Math.max(0.6, Number(zoom) || 1));
        const runtime = typeof window.getSocialRuntime === 'function' ? window.getSocialRuntime() : null;
        if (runtime?.ui) runtime.ui.researchPdfZoom = activeZoom;
        updateChrome();
        renderViewer();
    }

    function stepSocialResearchPdfPage(delta) {
        if (!activeDoc) return;
        activePage = Math.min(activeDoc.numPages, Math.max(1, activePage + Number(delta || 0)));
        const runtime = typeof window.getSocialRuntime === 'function' ? window.getSocialRuntime() : null;
        if (runtime?.ui) runtime.ui.researchPdfPage = activePage;
        if (activeViewMode === 'pages') renderViewer();
        else {
            const canvas = document.querySelector(`[data-research-pdf-pages] canvas[data-page-number="${activePage}"]`);
            canvas?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            updateChrome();
        }
    }

    window.mountSocialResearchPdfViewer = mountSocialResearchPdfViewer;
    window.updateSocialResearchPdfZoom = updateSocialResearchPdfZoom;
    window.stepSocialResearchPdfPage = stepSocialResearchPdfPage;
})();
