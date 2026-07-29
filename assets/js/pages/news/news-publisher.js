/* News page module: publisher — classic script, shares globals with sibling news/* modules. */
const PUBLISHER_SECTIONS = [
    { id: 'message', label: 'Message', icon: 'fa-pen-to-square' },
    { id: 'audience', label: 'Audience', icon: 'fa-users' },
    { id: 'presentation', label: 'Presentation', icon: 'fa-sliders' },
    { id: 'schedule', label: 'Schedule', icon: 'fa-clock' }
];

function patchNewsPublisherAttachmentRegion() {
    if (!runtime.publisherModalOpen) return;
    const host = q('newsx-publisher-panel')?.querySelector('[data-news-publisher-attachments-host="1"]');
    if (!host) return;
    const compose = runtime.compose;
    const attachments = Array.isArray(compose.attachments) ? compose.attachments : [];
    const markup = `
        <div class="newsx-attachment-toolbar">
            <label class="newsx-btn lux-secondary-btn newsx-attach-btn">
                <i class="fas fa-paperclip"></i> Add files (${attachments.length}/${NEWS_MAX_ATTACHMENTS})
                <input type="file" class="newsx-attach-input" multiple data-news-attach hidden>
            </label>
            <div class="newsx-attachment-chip-row">
                ${attachments.map((file, index) => `
                    <span class="newsx-attachment-chip home-hover-chip">
                        <i class="fas fa-${isNewsImageAttachment(file) ? 'image' : 'file'}"></i>
                        ${escapeHtml(String(file.name || `File ${index + 1}`))}
                        <button type="button" class="newsx-attachment-remove" data-news-remove-attachment="${escapeHtml(String(file.id || index))}" aria-label="Remove attachment"><i class="fas fa-times"></i></button>
                    </span>
                `).join('')}
            </div>
        </div>
    `;
    setNewsRegionMarkup(host, 'publisher-attachments', markup);
    syncNewsPublisherLiveRegions();
}

function ensurePublisherUi() {
    if (!runtime.publisherUi) {
        runtime.publisherUi = { activeSection: 'message', audienceMode: 'everyone', scheduleMode: 'immediate' };
    }
    if (!runtime.publisherUi.activeSection) runtime.publisherUi.activeSection = 'message';
    if (!runtime.publisherUi.audienceMode) runtime.publisherUi.audienceMode = 'everyone';
    if (!runtime.publisherUi.scheduleMode) runtime.publisherUi.scheduleMode = 'immediate';
    return runtime.publisherUi;
}

function isPublisherAudienceRestricted(compose = runtime.compose) {
    return Boolean(
        uniqueStrings(compose?.audienceRoles || []).length
        || uniqueStrings(compose?.audienceFacultyCodes || []).length
        || uniqueStrings(compose?.courseIds || []).length
        || String(compose?.programCode || '').trim()
    );
}

function getPublisherAudienceSummary(compose = runtime.compose) {
    if (!isPublisherAudienceRestricted(compose)) return 'Everyone on campus';
    const parts = [];
    const roles = uniqueStrings(compose.audienceRoles || []);
    const faculties = uniqueStrings(compose.audienceFacultyCodes || []);
    const courses = uniqueStrings(compose.courseIds || []);
    if (roles.length) parts.push(`${roles.length} role${roles.length === 1 ? '' : 's'}`);
    if (faculties.length) parts.push(`${faculties.length} facult${faculties.length === 1 ? 'y' : 'ies'}`);
    if (courses.length) parts.push(`${courses.length} course${courses.length === 1 ? '' : 's'}`);
    if (String(compose.programCode || '').trim()) parts.push(String(compose.programCode).trim().toUpperCase());
    return parts.join(' · ') || 'Restricted groups';
}

function getPublisherScheduleSummary(compose = runtime.compose, ui = ensurePublisherUi()) {
    const publishAt = String(compose.publishAt || '').trim();
    if (ui.scheduleMode === 'scheduled' && publishAt) {
        const publishMs = new Date(publishAt).getTime();
        if (!Number.isNaN(publishMs) && publishMs > Date.now()) {
            return `Scheduled for ${formatDateTime(publishAt)}`;
        }
    }
    return 'Publish immediately';
}

function resolveNewsPublisherPrimaryAction(compose = runtime.compose, ui = ensurePublisherUi()) {
    const publishAt = String(compose.publishAt || '').trim();
    if (ui.scheduleMode === 'scheduled') {
        return { label: 'Schedule', icon: 'fa-clock', action: 'schedule' };
    }
    const publishMs = publishAt ? new Date(publishAt).getTime() : NaN;
    if (!Number.isNaN(publishMs) && publishMs > Date.now()) {
        return { label: 'Schedule', icon: 'fa-clock', action: 'schedule' };
    }
    return { label: 'Publish now', icon: 'fa-bullhorn', action: 'publish' };
}

function getPublisherMessageSummary(compose = runtime.compose) {
    const title = stripNewsTitlePlainText(compose.title);
    if (title) return title.length > 42 ? `${title.slice(0, 42)}…` : title;
    return 'No headline yet';
}

function getPublisherPresentationSummary(compose = runtime.compose) {
    const priority = String(compose.priority || 'standard');
    const priorityLabel = priority.charAt(0).toUpperCase() + priority.slice(1);
    const hints = [];
    if (compose.pinned) hints.push('Pinned');
    const replyLabel = getNewsReplyModeLabel(compose.replyMode || (compose.allowReplies === false ? 'none' : 'private'));
    if (replyLabel !== 'Private replies') hints.push(replyLabel);
    const base = `${priorityLabel} priority`;
    return hints.length ? `${base} · ${hints.join(' · ')}` : base;
}

function getPublisherSectionSubtitle(sectionId, compose = runtime.compose, ui = ensurePublisherUi()) {
    switch (String(sectionId || '').trim()) {
        case 'message':
            return getPublisherMessageSummary(compose);
        case 'audience':
            return getPublisherAudienceSummary(compose);
        case 'presentation':
            return getPublisherPresentationSummary(compose);
        case 'schedule':
            return getPublisherScheduleSummary(compose, ui);
        default:
            return '';
    }
}

function renderNewsPublisherSectionNavInner() {
    const compose = runtime.compose;
    const ui = ensurePublisherUi();
    const activeSection = ui.activeSection || 'message';
    return PUBLISHER_SECTIONS.map(section => {
        const isActive = activeSection === section.id;
        return `
            <button type="button" role="tab" class="newsx-publisher-section-tab home-hover-chip ${isActive ? 'is-active' : ''}" data-news-publisher-section-nav="${section.id}" data-lux-skip-modern-button="true" aria-selected="${isActive ? 'true' : 'false'}">
                <span class="newsx-publisher-section-tab-icon" aria-hidden="true"><i class="fas ${section.icon}"></i></span>
                <span class="newsx-publisher-section-tab-text">
                    <strong>${escapeHtml(section.label)}</strong>
                    <small>${escapeHtml(getPublisherSectionSubtitle(section.id, compose, ui))}</small>
                </span>
            </button>
        `;
    }).join('');
}



function getNewsTitleEditor() {
    return q('newsx-publisher-panel')?.querySelector('#news-compose-title');
}

function getNewsBodyEditor() {
    return q('newsx-publisher-panel')?.querySelector('#news-compose-body');
}

let newsLastFocusedEditor = null;
let newsEditorSelectionListenerBound = false;

function getNewsActiveEditor() {
    const title = getNewsTitleEditor();
    const body = getNewsBodyEditor();
    const selection = window.getSelection();
    let node = selection?.anchorNode;
    if (node?.nodeType === 3) node = node.parentElement;
    if (title && node && title.contains(node)) return title;
    if (body && node && body.contains(node)) return body;
    const active = document.activeElement;
    if (title && active === title) return title;
    if (body && active === body) return body;
    if (newsLastFocusedEditor === title || newsLastFocusedEditor === body) return newsLastFocusedEditor;
    return body || title;
}

function isNewsTitleEditorActive() {
    return getNewsActiveEditor() === getNewsTitleEditor();
}

function serializeNewsTitleEditor() {
    const editor = getNewsTitleEditor();
    if (!editor || typeof window.serializeNewsTitleEditorHtml !== 'function') {
        return String(runtime.compose.title || '');
    }
    return window.serializeNewsTitleEditorHtml(editor);
}

function serializeNewsBodyEditor() {
    const editor = getNewsBodyEditor();
    if (!editor || typeof window.serializeNewsEditorHtml !== 'function') {
        return String(runtime.compose.body || '');
    }
    return window.serializeNewsEditorHtml(editor);
}

function syncComposeFromNewsEditor(editor) {
    if (!editor) return;
    const isTitle = editor.dataset?.newsComposeEditor === 'title';
    const next = isTitle ? serializeNewsTitleEditor() : serializeNewsBodyEditor();
    editor.dataset.newsEditorSource = next;
    const field = isTitle ? 'title' : 'body';
    if (runtime.compose[field] === next) return;
    runtime.compose[field] = next;
    if (runtime.publisherModalOpen) syncNewsPublisherLiveRegions();
}


function syncComposeFromNewsBodyEditor() {
    syncComposeFromNewsEditor(getNewsBodyEditor());
}

function ensureNewsEditorClass(tagName, className) {
    const editor = getNewsActiveEditor();
    const selection = window.getSelection();
    if (!editor || !selection?.rangeCount) return;
    let node = selection.anchorNode;
    if (node?.nodeType === 3) node = node.parentElement;
    const block = node?.closest?.(tagName);
    if (block && editor.contains(block)) block.classList.add(className);
}

let newsEditorToolbarTimer = null;

function getNewsEditorToolbar() {
    return q('newsx-publisher-panel')?.querySelector('[data-news-editor-toolbar="1"]');
}

function getNewsEditorBlock() {
    const editor = getNewsActiveEditor();
    const selection = window.getSelection();
    if (!editor || editor.dataset?.newsComposeEditor === 'title' || !selection?.rangeCount) return null;
    let node = selection.anchorNode;
    if (node?.nodeType === 3) node = node.parentElement;
    if (!node || !editor.contains(node)) return null;
    return node.closest('p, h2, h3, h4, blockquote, li, div');
}

function normalizeNewsEditorHexColor(value = '') {
    const raw = String(value || '').trim();
    const match = raw.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (!match) return '';
    const hex = match[1];
    if (hex.length === 3) return `#${hex.split('').map(ch => ch + ch).join('')}`;
    return `#${hex}`;
}

function ensureNewsEditorBlockAlign(align = 'left') {
    const block = getNewsEditorBlock();
    if (!block) return;
    block.classList.remove('newsx-md-align-left', 'newsx-md-align-center', 'newsx-md-align-right');
    if (align === 'center') block.classList.add('newsx-md-align-center');
    else if (align === 'right') block.classList.add('newsx-md-align-right');
    else block.classList.add('newsx-md-align-left');
    block.style.textAlign = align;
}

function clearNewsEditorFormatting() {
    const editor = getNewsActiveEditor();
    if (!editor) return;
    document.execCommand('removeFormat');
    editor.querySelectorAll('.newsx-md-size, .newsx-md-color, .newsx-md-highlight, .newsx-md-underline, .newsx-md-small').forEach(node => {
        const parent = node.parentNode;
        if (!parent) return;
        while (node.firstChild) parent.insertBefore(node.firstChild, node);
        parent.removeChild(node);
    });
    if (editor.dataset?.newsComposeEditor !== 'title') {
        getNewsEditorBlock()?.classList.remove('newsx-md-align-left', 'newsx-md-align-center', 'newsx-md-align-right');
        const block = getNewsEditorBlock();
        if (block) block.style.textAlign = '';
    }
}

function applyNewsEditorStyle(style = 'normal') {
    if (isNewsTitleEditorActive()) return;
    const editor = getNewsBodyEditor();
    if (!editor) return;
    editor.focus();
    const next = String(style || 'normal').trim();
    if (next === 'h1') {
        document.execCommand('formatBlock', false, 'h2');
        ensureNewsEditorClass('h2', 'newsx-md-h2');
    } else if (next === 'h2') {
        document.execCommand('formatBlock', false, 'h3');
        ensureNewsEditorClass('h3', 'newsx-md-h3');
    } else if (next === 'h3') {
        document.execCommand('formatBlock', false, 'h4');
        ensureNewsEditorClass('h4', 'newsx-md-h4');
    } else {
        document.execCommand('formatBlock', false, 'p');
    }
    syncComposeFromNewsBodyEditor();
    syncNewsEditorToolbarState();
}

function applyNewsEditorColor(type, value) {
    const editor = getNewsActiveEditor();
    if (!editor) return;
    editor.focus();
    const color = normalizeNewsEditorHexColor(value);
    if (!color) return;
    if (type === 'highlight') {
        if (!document.execCommand('hiliteColor', false, color)) {
            document.execCommand('backColor', false, color);
        }
    } else {
        document.execCommand('foreColor', false, color);
    }
}

function applyNewsEditorLink() {
    const editor = getNewsActiveEditor();
    const selection = window.getSelection();
    if (!editor) return;
    editor.focus();
    const url = String(window.prompt('Link URL (https://...)', 'https://') || '').trim();
    if (!url) return;
    const selected = selection?.toString() || '';
    if (!selected) {
        const label = String(window.prompt('Link text', url) || '').trim() || url;
        document.execCommand('insertHTML', false, `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`);
    } else {
        document.execCommand('createLink', false, url);
    }
}

function syncNewsEditorToolbarState() {
    const toolbar = getNewsEditorToolbar();
    if (!toolbar || !runtime.publisherModalOpen) return;
    const titleActive = isNewsTitleEditorActive();
    const setActive = (cmd, active) => {
        toolbar.querySelectorAll(`[data-news-editor-cmd="${cmd}"]`).forEach(button => {
            button.classList.toggle('is-active', Boolean(active));
        });
    };
    const setDisabled = (cmd, disabled) => {
        toolbar.querySelectorAll(`[data-news-editor-cmd="${cmd}"]`).forEach(button => {
            button.disabled = Boolean(disabled);
        });
    };
    toolbar.querySelectorAll('[data-news-editor-block-only="1"]').forEach(node => {
        if (node.matches('button, select, input')) {
            node.disabled = titleActive;
        } else {
            node.classList.toggle('is-disabled', titleActive);
        }
    });
    try {
        setActive('bold', document.queryCommandState('bold'));
        setActive('italic', document.queryCommandState('italic'));
        setActive('underline', document.queryCommandState('underline'));
        if (!titleActive) {
            setActive('list', document.queryCommandState('insertUnorderedList'));
            setActive('orderedList', document.queryCommandState('insertOrderedList'));
        } else {
            setActive('list', false);
            setActive('orderedList', false);
        }
        setDisabled('undo', !document.queryCommandEnabled('undo'));
        setDisabled('redo', !document.queryCommandEnabled('redo'));
    } catch (error) {
        /* ponytail: queryCommand* may throw outside editable focus */
    }
    const block = titleActive ? null : getNewsEditorBlock();
    const styleSelect = toolbar.querySelector('[data-news-editor-style]');
    if (styleSelect) {
        if (!block || titleActive) styleSelect.value = 'normal';
        else {
            const tag = block.tagName.toLowerCase();
            if (tag === 'h2') styleSelect.value = 'h1';
            else if (tag === 'h3') styleSelect.value = 'h2';
            else if (tag === 'h4') styleSelect.value = 'h3';
            else styleSelect.value = 'normal';
        }
    }
    ['left', 'center', 'right'].forEach(align => {
        const active = block && (
            block.classList.contains(`newsx-md-align-${align}`)
            || String(block.style?.textAlign || '').toLowerCase() === align
        );
        setActive(`align${align[0].toUpperCase()}${align.slice(1)}`, active);
    });
}

function scheduleNewsEditorToolbarSync() {
    if (newsEditorToolbarTimer) window.clearTimeout(newsEditorToolbarTimer);
    newsEditorToolbarTimer = window.setTimeout(() => {
        newsEditorToolbarTimer = null;
        syncNewsEditorToolbarState();
    }, 0);
}

function renderNewsEditorRibbon() {
    return `
        <div class="newsx-editor-ribbon home-hover-chip" data-news-editor-toolbar="1" aria-label="Formatting ribbon">
            <div class="newsx-editor-ribbon-group">
                <button type="button" class="newsx-md-snippet-btn lux-modern-button" data-news-editor-cmd="undo" data-lux-button-tone="secondary" aria-label="Undo"><i class="fas fa-rotate-left"></i></button>
                <button type="button" class="newsx-md-snippet-btn lux-modern-button" data-news-editor-cmd="redo" data-lux-button-tone="secondary" aria-label="Redo"><i class="fas fa-rotate-right"></i></button>
            </div>
            <div class="newsx-editor-ribbon-divider" aria-hidden="true"></div>
            <div class="newsx-editor-ribbon-group" data-news-editor-block-only="1">
                <label class="newsx-editor-ribbon-label">
                    <span class="newsx-meta">Style</span>
                    <select class="newsx-editor-style-select lux-control" data-news-editor-style data-news-editor-block-only="1" aria-label="Paragraph style">
                        <option value="normal">Normal</option>
                        <option value="h1">Heading 1</option>
                        <option value="h2">Heading 2</option>
                        <option value="h3">Heading 3</option>
                    </select>
                </label>
            </div>
            <div class="newsx-editor-ribbon-divider" aria-hidden="true"></div>
            <div class="newsx-editor-ribbon-group">
                <button type="button" class="newsx-md-snippet-btn lux-modern-button" data-news-editor-cmd="bold" data-lux-button-tone="primary" aria-label="Bold"><i class="fas fa-bold"></i></button>
                <button type="button" class="newsx-md-snippet-btn lux-modern-button" data-news-editor-cmd="italic" data-lux-button-tone="primary" aria-label="Italic"><i class="fas fa-italic"></i></button>
                <button type="button" class="newsx-md-snippet-btn lux-modern-button" data-news-editor-cmd="underline" data-lux-button-tone="primary" aria-label="Underline"><i class="fas fa-underline"></i></button>
                <label class="newsx-editor-color-btn" title="Font color">
                    <span class="newsx-meta">A</span>
                    <input type="color" class="newsx-editor-color-input" data-news-editor-color="fore" value="#1f2937" aria-label="Font color">
                </label>
                <label class="newsx-editor-color-btn" title="Highlight color">
                    <span class="newsx-meta"><i class="fas fa-highlighter"></i></span>
                    <input type="color" class="newsx-editor-color-input" data-news-editor-color="highlight" value="#fff59d" aria-label="Highlight color">
                </label>
            </div>
            <div class="newsx-editor-ribbon-divider" aria-hidden="true"></div>
            <div class="newsx-editor-ribbon-group" data-news-editor-block-only="1">
                <button type="button" class="newsx-md-snippet-btn lux-modern-button" data-news-editor-cmd="list" data-news-editor-block-only="1" data-lux-button-tone="primary" aria-label="Bullet list"><i class="fas fa-list-ul"></i></button>
                <button type="button" class="newsx-md-snippet-btn lux-modern-button" data-news-editor-cmd="orderedList" data-news-editor-block-only="1" data-lux-button-tone="primary" aria-label="Numbered list"><i class="fas fa-list-ol"></i></button>
                <button type="button" class="newsx-md-snippet-btn lux-modern-button" data-news-editor-cmd="alignLeft" data-news-editor-block-only="1" data-lux-button-tone="primary" aria-label="Align left"><i class="fas fa-align-left"></i></button>
                <button type="button" class="newsx-md-snippet-btn lux-modern-button" data-news-editor-cmd="alignCenter" data-news-editor-block-only="1" data-lux-button-tone="primary" aria-label="Align center"><i class="fas fa-align-center"></i></button>
                <button type="button" class="newsx-md-snippet-btn lux-modern-button" data-news-editor-cmd="alignRight" data-news-editor-block-only="1" data-lux-button-tone="primary" aria-label="Align right"><i class="fas fa-align-right"></i></button>
            </div>
            <div class="newsx-editor-ribbon-divider" aria-hidden="true"></div>
            <div class="newsx-editor-ribbon-group">
                <button type="button" class="newsx-md-snippet-btn lux-modern-button" data-news-editor-cmd="link" data-lux-button-tone="primary" aria-label="Insert link"><i class="fas fa-link"></i></button>
                <button type="button" class="newsx-md-snippet-btn lux-modern-button" data-news-editor-cmd="quote" data-news-editor-block-only="1" data-lux-button-tone="primary" aria-label="Quote"><i class="fas fa-quote-left"></i></button>
                <button type="button" class="newsx-md-snippet-btn lux-modern-button" data-news-editor-cmd="clear" data-lux-button-tone="secondary" aria-label="Clear formatting"><i class="fas fa-eraser"></i></button>
            </div>
        </div>
    `;
}

function bindNewsEditorKeyboardShortcuts(editor) {
    editor.addEventListener('keydown', event => {
        if (!(event.ctrlKey || event.metaKey)) return;
        const key = String(event.key || '').toLowerCase();
        if (key === 'b') { event.preventDefault(); applyNewsEditorCommand('bold'); }
        else if (key === 'i') { event.preventDefault(); applyNewsEditorCommand('italic'); }
        else if (key === 'u') { event.preventDefault(); applyNewsEditorCommand('underline'); }
        else if (key === 'z' && !event.shiftKey) { event.preventDefault(); applyNewsEditorCommand('undo'); }
        else if (key === 'y' || (key === 'z' && event.shiftKey)) { event.preventDefault(); applyNewsEditorCommand('redo'); }
    });
}

function ensureNewsEditorSelectionListener() {
    if (newsEditorSelectionListenerBound) return;
    newsEditorSelectionListenerBound = true;
    document.addEventListener('selectionchange', () => {
        if (!runtime.publisherModalOpen) return;
        const title = getNewsTitleEditor();
        const body = getNewsBodyEditor();
        const selection = window.getSelection();
        const node = selection?.anchorNode;
        if (!node) return;
        const element = node.nodeType === 3 ? node.parentElement : node;
        if ((title && title.contains(element)) || (body && body.contains(element))) {
            scheduleNewsEditorToolbarSync();
        }
    });
}

function mountNewsTitleEditor({ force = false } = {}) {
    const editor = getNewsTitleEditor();
    if (!editor) return;
    const source = String(runtime.compose.title || '');
    if (!force && editor.dataset.newsEditorMounted === '1' && editor.dataset.newsEditorSource === source) {
        return;
    }
    const html = typeof window.renderNewsTitleMarkdownHtml === 'function'
        ? window.renderNewsTitleMarkdownHtml(source)
        : escapeHtml(source);
    editor.innerHTML = html || '';
    editor.dataset.newsEditorSource = source;
    editor.dataset.newsEditorMounted = '1';
    if (editor.dataset.newsEditorListeners === '1') return;
    editor.dataset.newsEditorListeners = '1';
    editor.addEventListener('focusin', () => { newsLastFocusedEditor = editor; });
    editor.addEventListener('input', () => syncComposeFromNewsEditor(editor));
    editor.addEventListener('paste', event => {
        event.preventDefault();
        const text = String(event.clipboardData?.getData('text/plain') || '').replace(/\s+/g, ' ');
        document.execCommand('insertText', false, text);
    });
    editor.addEventListener('keydown', event => {
        if (event.key === 'Enter') event.preventDefault();
    });
    bindNewsEditorKeyboardShortcuts(editor);
    ensureNewsEditorSelectionListener();
    syncNewsEditorToolbarState();
}

function mountNewsBodyEditor({ force = false } = {}) {
    const editor = getNewsBodyEditor();
    if (!editor) return;
    const source = String(runtime.compose.body || '');
    if (!force && editor.dataset.newsEditorMounted === '1' && editor.dataset.newsEditorSource === source) {
        return;
    }
    const html = typeof window.renderNewsMarkdownHtml === 'function'
        ? window.renderNewsMarkdownHtml(source)
        : escapeHtml(source);
    editor.innerHTML = html || '';
    editor.dataset.newsEditorSource = source;
    editor.dataset.newsEditorMounted = '1';
    if (editor.dataset.newsEditorListeners === '1') return;
    editor.dataset.newsEditorListeners = '1';
    editor.addEventListener('focusin', () => { newsLastFocusedEditor = editor; });
    editor.addEventListener('input', () => syncComposeFromNewsEditor(editor));
    editor.addEventListener('paste', event => {
        event.preventDefault();
        const text = event.clipboardData?.getData('text/plain') || '';
        document.execCommand('insertText', false, text);
    });
    bindNewsEditorKeyboardShortcuts(editor);
    ensureNewsEditorSelectionListener();
    syncNewsEditorToolbarState();
}

function applyNewsEditorCommand(cmd, value = '') {
    const editor = getNewsActiveEditor();
    if (!editor) return;
    editor.focus();
    const command = String(cmd || '').trim();
    const isTitle = editor.dataset?.newsComposeEditor === 'title';
    const blockOnly = new Set(['list', 'orderedList', 'alignLeft', 'alignCenter', 'alignRight', 'quote']);
    if (isTitle && blockOnly.has(command)) return;
    if (command === 'undo') document.execCommand('undo');
    else if (command === 'redo') document.execCommand('redo');
    else if (command === 'bold') document.execCommand('bold');
    else if (command === 'italic') document.execCommand('italic');
    else if (command === 'underline') document.execCommand('underline');
    else if (command === 'list') document.execCommand('insertUnorderedList');
    else if (command === 'orderedList') document.execCommand('insertOrderedList');
    else if (command === 'alignLeft') {
        document.execCommand('justifyLeft');
        ensureNewsEditorBlockAlign('left');
    } else if (command === 'alignCenter') {
        document.execCommand('justifyCenter');
        ensureNewsEditorBlockAlign('center');
    } else if (command === 'alignRight') {
        document.execCommand('justifyRight');
        ensureNewsEditorBlockAlign('right');
    } else if (command === 'quote') {
        document.execCommand('formatBlock', false, 'blockquote');
        ensureNewsEditorClass('blockquote', 'newsx-md-quote');
    } else if (command === 'link') applyNewsEditorLink();
    else if (command === 'clear') clearNewsEditorFormatting();
    else if (command === 'foreColor' || command === 'highlight') applyNewsEditorColor(command === 'highlight' ? 'highlight' : 'fore', value);
    syncComposeFromNewsEditor(editor);
    syncNewsEditorToolbarState();
}

function renderNewsFontSizeControl(fieldKey, currentPx, ariaLabel) {
    const { mode, value } = resolveNewsFontSizeSelectMode(currentPx, fieldKey);
    const isCustom = mode === 'custom';
    return `
        <div class="newsx-font-size-control">
            <span class="newsx-font-size-control-icon" aria-hidden="true">Aa</span>
            <select class="newsx-font-size-select lux-control" data-news-compose-font-size-mode="${escapeHtml(fieldKey)}" aria-label="${escapeHtml(ariaLabel)}">
                <option value="custom"${isCustom ? ' selected' : ''}>Custom…</option>
                ${NEWS_FONT_SIZE_PRESETS.map(px => `<option value="${px}"${mode === 'preset' && px === value ? ' selected' : ''}>${px}</option>`).join('')}
            </select>
            <input type="number" class="newsx-font-size-custom lux-control" data-news-compose-font-size-custom="${escapeHtml(fieldKey)}" min="${NEWS_FONT_SIZE_MIN}" max="${NEWS_FONT_SIZE_MAX}" step="1" value="${value}" aria-label="${escapeHtml(ariaLabel)} custom value"${isCustom ? '' : ' hidden'}>
        </div>
    `;
}

function renderNewsPublisherFieldLabelRow(label, forId, fieldKey, currentPx) {
    return `
        <div class="newsx-publisher-field-label-row">
            <label class="newsx-field-label" for="${escapeHtml(forId)}">${escapeHtml(label)}</label>
            ${renderNewsFontSizeControl(fieldKey, currentPx, `${label} font size`)}
        </div>
    `;
}

function syncNewsComposeTypographyUi() {
    if (!runtime.publisherModalOpen) return;
    const panel = q('newsx-publisher-panel');
    if (!panel) return;
    const compose = runtime.compose;
    const titleSize = getNewsTypographyPx(compose, 'titleFontSize');
    const bodySize = getNewsTypographyPx(compose, 'bodyFontSize');
    const excerptSize = getNewsTypographyPx(compose, 'excerptFontSize');
    const titleInput = panel.querySelector('#news-compose-title');
    const bodyInput = panel.querySelector('#news-compose-body');
    const excerptInput = panel.querySelector('#news-compose-excerpt');
    if (titleInput) titleInput.style.fontSize = `${titleSize}px`;
    if (bodyInput) bodyInput.style.fontSize = `${bodySize}px`;
    if (excerptInput) excerptInput.style.fontSize = `${excerptSize}px`;
    panel.querySelectorAll('[data-news-compose-font-size-mode]').forEach(select => {
        const field = select.getAttribute('data-news-compose-font-size-mode');
        if (!field) return;
        const px = getNewsTypographyPx(compose, field);
        const { mode, value } = resolveNewsFontSizeSelectMode(px, field);
        select.value = mode === 'preset' ? String(value) : 'custom';
        const customInput = panel.querySelector(`[data-news-compose-font-size-custom="${field}"]`);
        if (!customInput) return;
        customInput.hidden = mode !== 'custom';
        if (String(customInput.value) !== String(value)) customInput.value = String(value);
    });
}

function renderNewsPublisherPaneShell(sectionId, title, copy, bodyMarkup, activeSection) {
    return `
        <section class="newsx-publisher-pane home-hover-chip ${activeSection === sectionId ? 'is-active' : ''}" data-news-publisher-pane="${sectionId}" data-news-publisher-section="${sectionId}" ${activeSection === sectionId ? '' : 'hidden'}>
            <header class="newsx-publisher-pane-header">
                <h3 class="newsx-publisher-pane-title">${escapeHtml(title)}</h3>
                ${copy ? `<p class="newsx-publisher-pane-copy">${escapeHtml(copy)}</p>` : ''}
            </header>
            <div class="newsx-publisher-pane-body">${bodyMarkup}</div>
        </section>
    `;
}

function renderNewsPublisherMessagePane(activeSection) {
    const compose = runtime.compose;
    const attachments = Array.isArray(compose.attachments) ? compose.attachments : [];
    const titleStyle = getNewsTypographyStyle(compose, 'titleFontSize');
    const bodyStyle = getNewsTypographyStyle(compose, 'bodyFontSize');
    const excerptStyle = getNewsTypographyStyle(compose, 'excerptFontSize');
    return renderNewsPublisherPaneShell('message', 'Message', 'What you are publishing to the campus feed.', `
        <div class="newsx-publisher-field-stack">
            <div class="newsx-publisher-field newsx-publisher-field--message-compose">
                ${renderNewsEditorRibbon()}
            </div>
            <div class="newsx-publisher-field">
                ${renderNewsPublisherFieldLabelRow('Headline', 'news-compose-title', 'titleFontSize', compose.titleFontSize)}
                <div id="news-compose-title" class="newsx-rich-editor newsx-rich-editor--headline lux-control" contenteditable="true" role="textbox" aria-multiline="false" data-news-compose-editor="title" data-placeholder="Headline" style="${titleStyle}"></div>
            </div>
            <div class="newsx-publisher-field">
                <label class="newsx-field-label" for="news-compose-section">Feed category</label>
                <input id="news-compose-section" name="news_compose_section" class="newsx-input lux-control" type="text" list="news-section-suggestions" value="${escapeHtml(compose.sectionLabel)}" placeholder="Academic Updates" data-news-compose-field="sectionLabel">
                <datalist id="news-section-suggestions">
                    ${getNewsSectionSuggestions().map(label => `<option value="${escapeHtml(label)}"></option>`).join('')}
                </datalist>
            </div>
            <div class="newsx-publisher-field">
                ${renderNewsPublisherFieldLabelRow('Body', 'news-compose-body', 'bodyFontSize', compose.bodyFontSize)}
                <div id="news-compose-body" class="newsx-rich-editor newsx-card-body newsx-card-body--rich lux-control" contenteditable="true" role="textbox" aria-multiline="true" data-news-compose-editor="body" data-placeholder="Write the announcement body..." style="${bodyStyle}"></div>
                <div class="newsx-meta newsx-compose-hint">Use the ribbon for styles, lists, alignment, links, and colors. Shortcuts: Ctrl/Cmd+B, I, U, Z, Y.</div>
            </div>
            <div class="newsx-publisher-field">
                ${renderNewsPublisherFieldLabelRow('Card excerpt (optional)', 'news-compose-excerpt', 'excerptFontSize', compose.excerptFontSize)}
                <input id="news-compose-excerpt" name="news_compose_excerpt" class="newsx-input lux-control" type="text" value="${escapeHtml(compose.excerpt)}" placeholder="Short preview line for the feed card" data-news-compose-field="excerpt" style="${excerptStyle}">
            </div>
            <div class="newsx-publisher-field">
                <label class="newsx-field-label">Attachments</label>
                <div data-news-publisher-attachments-host="1">
                    <div class="newsx-attachment-toolbar">
                        <label class="newsx-btn lux-secondary-btn newsx-attach-btn">
                            <i class="fas fa-paperclip"></i> Add files (${attachments.length}/${NEWS_MAX_ATTACHMENTS})
                            <input type="file" class="newsx-attach-input" multiple data-news-attach hidden>
                        </label>
                        <div class="newsx-attachment-chip-row">
                            ${attachments.map((file, index) => `
                                <span class="newsx-attachment-chip home-hover-chip">
                                    <i class="fas fa-${isNewsImageAttachment(file) ? 'image' : 'file'}"></i>
                                    ${escapeHtml(String(file.name || `File ${index + 1}`))}
                                    <button type="button" class="newsx-attachment-remove" data-news-remove-attachment="${escapeHtml(String(file.id || index))}" aria-label="Remove attachment"><i class="fas fa-times"></i></button>
                                </span>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `, activeSection);
}

function renderNewsPublisherAudiencePane(activeSection) {
    const compose = runtime.compose;
    const ui = ensurePublisherUi();
    const audienceMode = ui.audienceMode === 'restricted' || isPublisherAudienceRestricted(compose) ? 'restricted' : 'everyone';
    return renderNewsPublisherPaneShell('audience', 'Audience', 'Who should see this announcement?', `
        <div class="newsx-publisher-audience-mode">
            <label class="newsx-publisher-radio-card home-hover-chip">
                <input type="radio" name="news_audience_mode" value="everyone" ${audienceMode === 'everyone' ? 'checked' : ''} data-news-audience-mode="everyone">
                <span><strong>Everyone on campus</strong><span class="newsx-meta">No role or faculty filters</span></span>
            </label>
            <label class="newsx-publisher-radio-card home-hover-chip">
                <input type="radio" name="news_audience_mode" value="restricted" ${audienceMode === 'restricted' ? 'checked' : ''} data-news-audience-mode="restricted">
                <span><strong>Restrict to specific groups</strong><span class="newsx-meta">Roles, faculties, or course scope</span></span>
            </label>
        </div>
        <div class="newsx-publisher-audience-restricted ${audienceMode === 'restricted' ? 'is-visible' : ''}">
            <div class="newsx-publisher-audience-block">
                <div class="newsx-meta newsx-meta-label">Roles</div>
                <div class="newsx-publisher-audience-grid">
                    ${ROLE_OPTIONS.map(([roleId, label]) => `
                        <label class="newsx-check lux-check-card newsx-publisher-toggle-card home-hover-chip">
                            <input id="news-role-${escapeHtml(toFieldToken(roleId))}" name="news_role_${escapeHtml(toFieldToken(roleId))}" type="checkbox" ${compose.audienceRoles.includes(roleId) ? 'checked' : ''} data-news-audience-role="${escapeHtml(roleId)}">
                            <div><strong>${escapeHtml(label)}</strong></div>
                        </label>
                    `).join('')}
                </div>
            </div>
            <div class="newsx-publisher-audience-block">
                <div class="newsx-meta newsx-meta-label">Faculties</div>
                <div class="newsx-publisher-audience-grid">
                    ${getFacultyOptions().map(option => `
                        <label class="newsx-check lux-check-card newsx-publisher-toggle-card home-hover-chip">
                            <input id="news-faculty-${escapeHtml(toFieldToken(option.code))}" name="news_faculty_${escapeHtml(toFieldToken(option.code))}" type="checkbox" ${compose.audienceFacultyCodes.includes(option.code) ? 'checked' : ''} data-news-audience-faculty="${escapeHtml(option.code)}">
                            <div><strong>${escapeHtml(option.label)}</strong><div class="newsx-meta">${escapeHtml(option.code)}</div></div>
                        </label>
                    `).join('')}
                </div>
            </div>
        </div>
        <div class="newsx-publisher-audience-block">
            <div class="newsx-meta newsx-meta-label">Advanced scope (optional)</div>
            <div class="newsx-publisher-field-stack">
                <div class="newsx-publisher-field">
                    <label class="newsx-field-label" for="news-compose-course-ids">Course IDs</label>
                    <input id="news-compose-course-ids" class="newsx-input lux-control" type="text" value="${escapeHtml(formatNewsCourseIdsInput(compose.courseIds))}" placeholder="e.g. ECON101, CS201" data-news-compose-field="courseIds">
                </div>
                <div class="newsx-publisher-field">
                    <label class="newsx-field-label" for="news-compose-program-code">Program code</label>
                    <input id="news-compose-program-code" class="newsx-input lux-control" type="text" value="${escapeHtml(compose.programCode || '')}" placeholder="Optional program filter" data-news-compose-field="programCode">
                </div>
            </div>
            <div class="newsx-meta">Leave blank to include all enrolled students in the selected groups.</div>
        </div>
    `, activeSection);
}

function renderNewsPublisherPresentationPane(activeSection) {
    const compose = runtime.compose;
    return renderNewsPublisherPaneShell('presentation', 'Presentation', 'How the announcement appears and behaves on the feed.', `
        <div class="newsx-publisher-field">
            <label class="newsx-field-label" for="news-compose-priority">Priority</label>
            <select id="news-compose-priority" name="news_compose_priority" class="newsx-select lux-control" data-news-compose-field="priority">
                <option value="standard" ${compose.priority === 'standard' ? 'selected' : ''}>Standard</option>
                <option value="important" ${compose.priority === 'important' ? 'selected' : ''}>Important</option>
                <option value="critical" ${compose.priority === 'critical' ? 'selected' : ''}>Critical</option>
            </select>
        </div>
        <div class="newsx-publisher-field">
            <label class="newsx-field-label" for="news-compose-reply-mode">Replies</label>
            <select id="news-compose-reply-mode" name="news_compose_reply_mode" class="newsx-select lux-control" data-news-compose-field="replyMode">
                <option value="none" ${(compose.replyMode || 'private') === 'none' ? 'selected' : ''}>No replies</option>
                <option value="private" ${(compose.replyMode || 'private') === 'private' ? 'selected' : ''}>Private only</option>
                <option value="public" ${compose.replyMode === 'public' ? 'selected' : ''}>Public only</option>
                <option value="both" ${compose.replyMode === 'both' ? 'selected' : ''}>Public + private</option>
            </select>
            <div class="newsx-meta">Choose whether readers can comment publicly, reply privately, both, or not at all.</div>
        </div>
        <div class="newsx-publisher-delivery-toggles">
            <label class="newsx-check lux-check-card newsx-publisher-toggle-card home-hover-chip">
                <input id="news-compose-pinned" name="news_compose_pinned" type="checkbox" ${compose.pinned ? 'checked' : ''} data-news-compose-boolean="pinned">
                <div><strong>Pin to top</strong><span class="newsx-meta">Keep above other feed items</span></div>
            </label>
        </div>
    `, activeSection);
}

function renderNewsPublisherSchedulePane(activeSection) {
    const compose = runtime.compose;
    const ui = ensurePublisherUi();
    const scheduleMode = ui.scheduleMode === 'scheduled' ? 'scheduled' : 'immediate';
    return renderNewsPublisherPaneShell('schedule', 'Schedule', 'When the announcement goes live on the feed.', `
        <div class="newsx-publisher-schedule-mode">
            <label class="newsx-publisher-radio-card home-hover-chip">
                <input type="radio" name="news_schedule_mode" value="immediate" ${scheduleMode === 'immediate' ? 'checked' : ''} data-news-schedule-mode="immediate">
                <span><strong>Publish immediately</strong><span class="newsx-meta">Goes live as soon as you publish</span></span>
            </label>
            <label class="newsx-publisher-radio-card home-hover-chip">
                <input type="radio" name="news_schedule_mode" value="scheduled" ${scheduleMode === 'scheduled' ? 'checked' : ''} data-news-schedule-mode="scheduled">
                <span><strong>Schedule for later</strong><span class="newsx-meta">Choose a future publish time</span></span>
            </label>
        </div>
        <div class="newsx-publisher-field-stack">
            <div class="newsx-publisher-field">
                <label class="newsx-field-label" for="news-compose-publish-at">Publish at</label>
                <input id="news-compose-publish-at" class="newsx-input lux-control" type="datetime-local" value="${escapeHtml(toDatetimeLocalValue(compose.publishAt))}" data-news-compose-field="publishAt" ${scheduleMode === 'scheduled' ? '' : 'disabled'}>
            </div>
            <div class="newsx-publisher-field">
                <label class="newsx-field-label" for="news-compose-expires-at">Expires (optional)</label>
                <input id="news-compose-expires-at" class="newsx-input lux-control" type="datetime-local" value="${escapeHtml(toDatetimeLocalValue(compose.expiresAt))}" data-news-compose-field="expiresAt">
                <div class="newsx-meta">Hidden from the feed after this time.</div>
            </div>
        </div>
    `, activeSection);
}

function renderNewsPublisherPanes(activeSection) {
    return `
        <div class="newsx-publisher-panes">
            ${renderNewsPublisherMessagePane(activeSection)}
            ${renderNewsPublisherAudiencePane(activeSection)}
            ${renderNewsPublisherPresentationPane(activeSection)}
            ${renderNewsPublisherSchedulePane(activeSection)}
        </div>
    `;
}

function renderNewsPublisherMain() {
    const ui = ensurePublisherUi();
    const activeSection = ui.activeSection || 'message';
    return `
        <div class="newsx-publisher-studio" data-news-publisher-studio="1">
            ${renderNewsPublisherPanes(activeSection)}
        </div>
    `;
}


function renderNewsPublisherErrorBanner() {
    if (!runtime.error || !runtime.publisherModalOpen) return '';
    return `
        <div class="newsx-publisher-error lux-error-state" role="alert">
            <i class="fas fa-triangle-exclamation"></i>
            <span>${escapeHtml(runtime.error)}</span>
        </div>
    `;
}

function syncNewsPublisherPrimaryCta() {
    const panel = q('newsx-publisher-panel');
    const button = panel?.querySelector('[data-news-publisher-primary="1"]');
    if (!button) return;
    const primary = resolveNewsPublisherPrimaryAction();
    button.innerHTML = `<i class="fas ${primary.icon}"></i> ${escapeHtml(primary.label)}`;
    button.setAttribute('data-news-publisher-primary-action', primary.action);
}

function syncNewsPublisherLiveRegions() {
    if (!runtime.publisherModalOpen) return;
    const panel = q('newsx-publisher-panel');
    if (!panel) return;
    const summaryHost = panel.querySelector('[data-news-publisher-summary-strip-host="1"]');
    const errorHost = panel.querySelector('[data-news-publisher-error-host="1"]');
    if (summaryHost) setNewsRegionMarkup(summaryHost, 'publisher-summary', renderNewsPublisherSectionNavInner());
    if (errorHost) setNewsRegionMarkup(errorHost, 'publisher-error', renderNewsPublisherErrorBanner());
    syncNewsPublisherPrimaryCta();
    syncNewsComposeTypographyUi();
}

function setNewsPublisherActiveSection(sectionId) {
    const next = String(sectionId || 'message').trim() || 'message';
    const ui = ensurePublisherUi();
    if (ui.activeSection === next) return;
    ui.activeSection = next;
    const panel = q('newsx-publisher-panel');
    if (!panel) return;
    panel.querySelectorAll('[data-news-publisher-pane]').forEach(pane => {
        const isActive = pane.getAttribute('data-news-publisher-pane') === next;
        pane.classList.toggle('is-active', isActive);
        pane.toggleAttribute('hidden', !isActive);
    });
    panel.querySelectorAll('[data-news-publisher-section-nav]').forEach(nav => {
        const isActive = nav.getAttribute('data-news-publisher-section-nav') === next;
        nav.classList.toggle('is-active', isActive);
        nav.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
}

function syncNewsPublisherScheduleModeUi() {
    const ui = ensurePublisherUi();
    const panel = q('newsx-publisher-panel');
    const publishInput = panel?.querySelector('#news-compose-publish-at');
    if (publishInput) publishInput.disabled = ui.scheduleMode !== 'scheduled';
}

function syncNewsPublisherAudienceModeUi() {
    const ui = ensurePublisherUi();
    const panel = q('newsx-publisher-panel');
    const restricted = panel?.querySelector('.newsx-publisher-audience-restricted');
    if (restricted) restricted.classList.toggle('is-visible', ui.audienceMode === 'restricted');
}


function renderNewsPublisherFooter() {
    const compose = runtime.compose;
    const isEdit = Boolean(compose.editingPostId);
    const primary = resolveNewsPublisherPrimaryAction();
    return `
        <div data-news-publisher-error-host="1">${renderNewsPublisherErrorBanner()}</div>
        <footer class="newsx-publisher-footer">
            <div class="newsx-publisher-footer-actions newsx-publisher-footer-actions--start">
                <button type="button" class="newsx-btn lux-secondary-btn" data-news-close-publisher>Cancel</button>
            </div>
            <div class="newsx-publisher-footer-actions">
                ${isEdit ? `<button type="button" class="newsx-btn lux-secondary-btn newsx-publisher-footer-danger" data-lux-button-tone="danger" data-news-delete-post="${escapeHtml(String(compose.editingPostId))}"><i class="fas fa-trash"></i> Delete</button>` : ''}
                <button type="button" class="newsx-btn lux-secondary-btn newsx-publisher-footer-draft-mobile" data-news-save-draft><i class="fas fa-floppy-disk"></i> Save draft</button>
                <button type="button" class="newsx-btn newsx-btn-primary lux-primary-btn" data-news-publisher-primary="1" data-news-publisher-primary-action="${primary.action}"><i class="fas ${primary.icon}"></i> ${escapeHtml(primary.label)}</button>
            </div>
        </footer>
    `;
}

function syncNewsSectionsDraftFromDom() {
    const panel = q('newsx-sections-panel');
    if (!panel) return;
    panel.querySelectorAll('[data-news-sections-label]').forEach(input => {
        const index = Number.parseInt(input.getAttribute('data-news-sections-label'), 10);
        if (!Number.isFinite(index) || !runtime.sectionsDraft[index]) return;
        runtime.sectionsDraft[index].label = String(input.value || '');
    });
}

function renderNewsSectionsModal() {
    const drafts = Array.isArray(runtime.sectionsDraft) ? runtime.sectionsDraft : [];
    const rows = drafts.map((entry, index) => {
        const key = entry.key || normalizeNewsSectionKey(entry.label);
        const count = entry.key ? getNewsSectionCountByKey(entry.key) : 0;
        const pendingTargetKey = runtime.sectionsReassignments?.[key] || '';
        const pendingTarget = pendingTargetKey
            ? drafts.find(item => (item.key || normalizeNewsSectionKey(item.label)) === pendingTargetKey)
            : null;
        return `
            <div class="newsx-sections-row" data-news-sections-row="${index}">
                <label class="newsx-sections-row-label">
                    <span class="newsx-meta">Name</span>
                    <input class="newsx-input lux-control" type="text" value="${escapeHtml(entry.label || '')}" data-news-sections-label="${index}" aria-label="Section name">
                </label>
                <div class="newsx-sections-row-meta">
                    <span class="newsx-meta newsx-sections-key" title="Section key">${escapeHtml(key)}</span>
                    <span class="newsx-sections-count" title="Announcements in this section">${escapeHtml(String(count))}</span>
                    ${pendingTarget ? `<span class="newsx-sections-pending" title="Announcements will move on save">→ ${escapeHtml(pendingTarget.label || pendingTargetKey)}</span>` : ''}
                </div>
                <button type="button" class="newsx-btn lux-secondary-btn newsx-sections-remove-btn" data-news-sections-remove="${index}" title="Remove section" aria-label="Remove section"><i class="fas fa-trash"></i></button>
            </div>
        `;
    }).join('');

    return `
        <div class="newsx-sections-head">
            <div>
                <div class="newsx-kicker">News</div>
                <h2 id="newsx-sections-title" class="newsx-headline newsx-headline-tight">Manage sections</h2>
            </div>
            <button type="button" class="newsx-btn lux-secondary-btn" data-news-close-sections-manager aria-label="Close"><i class="fas fa-times"></i></button>
        </div>
        <p class="newsx-subtle">Add, rename, or remove feed categories. Sections with announcements must be reassigned before removal.</p>
        ${runtime.sectionsError ? `<div class="newsx-publisher-error">${escapeHtml(runtime.sectionsError)}</div>` : ''}
        <div class="newsx-sections-list">${rows || '<p class="newsx-subtle">No sections yet.</p>'}</div>
        <div class="newsx-sections-add-row">
            <input id="news-sections-add-label" name="news_sections_add_label" class="newsx-input lux-control" type="text" placeholder="New section name" data-news-sections-add-input autocomplete="off">
            <button type="button" class="newsx-btn lux-secondary-btn" data-news-sections-add><i class="fas fa-plus"></i> Add section</button>
        </div>
        <div class="newsx-sections-actions">
            <button type="button" class="newsx-btn lux-secondary-btn" data-news-close-sections-manager>Cancel</button>
            <button type="button" class="newsx-btn newsx-btn-primary lux-primary-btn" data-news-sections-save>Save changes</button>
        </div>
    `;
}

function renderNewsSectionsModalContent() {
    const panel = q('newsx-sections-panel');
    if (!panel) return;
    setNewsRegionMarkup(panel, 'sections-modal', renderNewsSectionsModal());
}

function renderNewsPublisherHeader() {
    const compose = runtime.compose;
    const isEdit = Boolean(compose.editingPostId);
    return `
        <div class="newsx-publisher-header">
            <div>
                <div class="newsx-kicker">Publisher Studio</div>
                <h2 id="newsx-publisher-title" class="newsx-headline">${isEdit ? 'Edit announcement' : 'Create announcement'}</h2>
                <p class="newsx-publisher-subtitle newsx-subtle">Official campus news</p>
            </div>
            <div class="newsx-publisher-header-actions">
                <button type="button" class="newsx-btn lux-secondary-btn" data-news-save-draft><i class="fas fa-floppy-disk"></i> Save draft</button>
                <button type="button" class="newsx-btn lux-secondary-btn" data-news-close-publisher aria-label="Close publisher"><i class="fas fa-times"></i></button>
            </div>
        </div>
    `;
}

function renderNewsPublisherModal() {
    return `
        ${renderNewsPublisherHeader()}
        <nav class="newsx-publisher-section-nav" role="tablist" aria-label="Publisher sections" data-news-publisher-summary-strip-host="1">${renderNewsPublisherSectionNavInner()}</nav>
        <div class="newsx-publisher-body">
            <main class="newsx-publisher-main" data-news-publisher-main-host="1">${renderNewsPublisherMain()}</main>
        </div>
        ${renderNewsPublisherFooter()}
    `;
}

window.setNewsPublisherActiveSection = setNewsPublisherActiveSection;
