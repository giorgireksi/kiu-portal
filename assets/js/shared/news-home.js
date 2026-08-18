(function initNewsHomeShared() {
    const PENDING_POST_KEY = 'KIU_PENDING_NEWS_POST';
    const LAST_SEEN_PREFIX = 'kiu-news-last-seen:';

    function escapeHtml(value) {
        if (typeof window !== 'undefined' && typeof window.escapeHtml === 'function') {
            const shared = window.escapeHtml;
            if (shared !== escapeHtml) return shared(value);
        }
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function normalizeNewsMarkdownHexColor(value = '') {
        const raw = String(value || '').trim().toLowerCase();
        const hexMatch = raw.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
        if (!hexMatch) return '';
        const hex = hexMatch[1];
        if (hex.length === 3) {
            return `#${hex.split('').map(ch => ch + ch).join('')}`;
        }
        return `#${hex}`;
    }

    function renderNewsMarkdownInline(text) {
        let html = escapeHtml(text);
        html = html.replace(/«size:(\d{1,2})»([\s\S]*?)«\/size»/g, (_, size, inner) => {
            const px = Math.max(8, Math.min(96, Number.parseInt(size, 10) || 16));
            return `<span class="newsx-md-size" style="font-size:${px}px">${inner}</span>`;
        });
        html = html.replace(/«bg:(#[0-9a-fA-F]{3,6})»([\s\S]*?)«\/bg»/g, (_, color, inner) => {
            const safe = normalizeNewsMarkdownHexColor(color);
            return safe
                ? `<mark class="newsx-md-highlight" style="background-color:${safe}">${inner}</mark>`
                : inner;
        });
        html = html.replace(/«(#[0-9a-fA-F]{3,6})»([\s\S]*?)«\/»/g, (_, color, inner) => {
            const safe = normalizeNewsMarkdownHexColor(color);
            return safe
                ? `<span class="newsx-md-color" style="color:${safe}">${inner}</span>`
                : inner;
        });
        html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        html = html.replace(/__([^_]+)__/g, '<u class="newsx-md-underline">$1</u>');
        html = html.replace(/==([^=]+)==/g, '<mark class="newsx-md-highlight">$1</mark>');
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        html = html.replace(/\^([^^]+)\^/g, '<small class="newsx-md-small">$1</small>');
        html = html.replace(/(^|[\s(])((https?:\/\/)[^\s<]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>');
        return html;
    }

    function renderNewsMarkdownAlignedParagraph(line) {
        const match = String(line || '').match(/^::(left|center|right)::\s+(.+)$/);
        if (!match) return '';
        const align = match[1];
        const body = match[2];
        return `<p class="newsx-md-align-${align}">${renderNewsMarkdownInline(body)}</p>`;
    }

    function isNewsMarkdownBlockStart(line) {
        const trimmed = String(line || '').trim();
        if (!trimmed) return false;
        return /^::(left|center|right)::\s+/.test(trimmed)
            || /^###\s/.test(trimmed)
            || /^##\s/.test(trimmed)
            || /^#\s/.test(trimmed)
            || /^>\s?/.test(trimmed)
            || /^[-*]\s+/.test(trimmed)
            || /^\d+\.\s+/.test(trimmed);
    }

    function renderNewsMarkdownHtml(value) {
        const raw = String(value || '').trim();
        if (!raw) return '';
        const lines = raw.split('\n');
        const blocks = [];
        let index = 0;

        while (index < lines.length) {
            const line = lines[index];
            if (!String(line || '').trim()) {
                index += 1;
                continue;
            }

            const heading4 = line.match(/^###\s+(.+)$/);
            if (heading4) {
                blocks.push(`<h4 class="newsx-md-h4">${renderNewsMarkdownInline(heading4[1])}</h4>`);
                index += 1;
                continue;
            }

            const heading3 = line.match(/^##\s+(.+)$/);
            if (heading3) {
                blocks.push(`<h3 class="newsx-md-h3">${renderNewsMarkdownInline(heading3[1])}</h3>`);
                index += 1;
                continue;
            }

            const heading2 = line.match(/^#\s+(.+)$/);
            if (heading2) {
                blocks.push(`<h2 class="newsx-md-h2">${renderNewsMarkdownInline(heading2[1])}</h2>`);
                index += 1;
                continue;
            }

            const alignedParagraph = renderNewsMarkdownAlignedParagraph(line);
            if (alignedParagraph) {
                blocks.push(alignedParagraph);
                index += 1;
                continue;
            }

            if (/^>\s?/.test(line)) {
                const quoteLines = [];
                while (index < lines.length && /^>\s?/.test(lines[index])) {
                    quoteLines.push(String(lines[index]).replace(/^>\s?/, ''));
                    index += 1;
                }
                blocks.push(`<blockquote class="newsx-md-quote">${renderNewsMarkdownInline(quoteLines.join(' '))}</blockquote>`);
                continue;
            }

            if (/^[-*]\s+/.test(line)) {
                const items = [];
                while (index < lines.length && /^[-*]\s+/.test(lines[index])) {
                    items.push(String(lines[index]).replace(/^[-*]\s+/, ''));
                    index += 1;
                }
                blocks.push(`<ul>${items.map(item => `<li>${renderNewsMarkdownInline(item)}</li>`).join('')}</ul>`);
                continue;
            }

            if (/^\d+\.\s+/.test(line)) {
                const items = [];
                while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
                    items.push(String(lines[index]).replace(/^\d+\.\s+/, ''));
                    index += 1;
                }
                blocks.push(`<ol>${items.map(item => `<li>${renderNewsMarkdownInline(item)}</li>`).join('')}</ol>`);
                continue;
            }

            const paragraphLines = [];
            while (index < lines.length && String(lines[index] || '').trim() && !isNewsMarkdownBlockStart(lines[index])) {
                paragraphLines.push(lines[index]);
                index += 1;
            }
            if (paragraphLines.length) {
                blocks.push(`<p>${paragraphLines.map(renderNewsMarkdownInline).join('<br>')}</p>`);
            }
        }

        return blocks.join('');
    }

    function serializeNewsEditorColorFromStyle(styleValue = '') {
        const raw = String(styleValue || '').trim();
        if (!raw) return '';
        if (raw.startsWith('#')) return normalizeNewsMarkdownHexColor(raw);
        const rgbMatch = raw.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i);
        if (!rgbMatch) return '';
        const toHex = num => Math.max(0, Math.min(255, Number.parseInt(num, 10) || 0))
            .toString(16)
            .padStart(2, '0');
        return normalizeNewsMarkdownHexColor(`#${toHex(rgbMatch[1])}${toHex(rgbMatch[2])}${toHex(rgbMatch[3])}`);
    }

    function serializeNewsEditorInlineNode(child) {
        const tag = child.tagName.toLowerCase();
        const inner = serializeNewsEditorInline(child);
        if (tag === 'strong' || tag === 'b') return `**${inner}**`;
        if (tag === 'em' || tag === 'i') return `*${inner}*`;
        if (tag === 'u' || (tag === 'span' && child.classList.contains('newsx-md-underline'))) return `__${inner}__`;
        if (tag === 'code') return `\`${inner}\``;
        if (tag === 'small' && child.classList.contains('newsx-md-small')) return `^${inner}^`;
        if (tag === 'mark' || child.classList.contains('newsx-md-highlight')) {
            const bg = serializeNewsEditorColorFromStyle(child.style?.backgroundColor);
            return bg ? `«bg:${bg}»${inner}«/bg»` : `==${inner}==`;
        }
        if (tag === 'span') {
            const fontSize = Number.parseInt(child.style?.fontSize, 10);
            if (Number.isFinite(fontSize) && fontSize >= 8 && fontSize <= 96) {
                return `«size:${fontSize}»${inner}«/size»`;
            }
            const color = serializeNewsEditorColorFromStyle(child.style?.color);
            if (color) return `«${color}»${inner}«/»`;
            const bg = serializeNewsEditorColorFromStyle(child.style?.backgroundColor);
            if (bg) return `«bg:${bg}»${inner}«/bg»`;
        }
        if (tag === 'a') {
            const href = String(child.getAttribute('href') || '').trim();
            return href ? `[${inner}](${href})` : inner;
        }
        if (tag === 'br') return '\n';
        if (tag === 'font') {
            const color = serializeNewsEditorColorFromStyle(child.getAttribute('color') || child.style?.color);
            if (color) return `«${color}»${inner}«/»`;
        }
        return inner;
    }

    function serializeNewsEditorAlignPrefix(node) {
        if (node.classList.contains('newsx-md-align-center')) return '::center::';
        if (node.classList.contains('newsx-md-align-right')) return '::right::';
        if (node.classList.contains('newsx-md-align-left')) return '::left::';
        const align = String(node.style?.textAlign || '').trim().toLowerCase();
        if (align === 'center') return '::center::';
        if (align === 'right') return '::right::';
        if (align === 'left') return '::left::';
        return '';
    }

    function serializeNewsEditorInline(node) {
        if (!node) return '';
        if (node.nodeType === 3) return node.textContent || '';
        if (node.nodeType !== 1) return '';
        let out = '';
        node.childNodes.forEach(child => {
            if (child.nodeType === 3) {
                out += child.textContent || '';
                return;
            }
            if (child.nodeType !== 1) return;
            out += serializeNewsEditorInlineNode(child);
        });
        return out;
    }

    function serializeNewsEditorParagraphText(node) {
        const align = serializeNewsEditorAlignPrefix(node);
        const text = serializeNewsEditorInline(node).trim();
        if (!text) return '';
        return align ? `${align} ${text}` : text;
    }

    function serializeNewsEditorBlock(node) {
        if (!node || node.nodeType !== 1) return '';
        const tag = node.tagName.toLowerCase();
        if (tag === 'h2' && node.classList.contains('newsx-md-h2')) {
            return `# ${serializeNewsEditorInline(node).trim()}`;
        }
        if (tag === 'h3' && node.classList.contains('newsx-md-h3')) {
            return `## ${serializeNewsEditorInline(node).trim()}`;
        }
        if (tag === 'h4' && node.classList.contains('newsx-md-h4')) {
            return `### ${serializeNewsEditorInline(node).trim()}`;
        }
        if (tag === 'h2') return `# ${serializeNewsEditorInline(node).trim()}`;
        if (tag === 'h3') return `## ${serializeNewsEditorInline(node).trim()}`;
        if (tag === 'h4') return `### ${serializeNewsEditorInline(node).trim()}`;
        if (tag === 'blockquote' || node.classList.contains('newsx-md-quote')) {
            return `> ${serializeNewsEditorInline(node).trim()}`;
        }
        if (tag === 'ul') {
            return [...node.children]
                .filter(child => child.tagName.toLowerCase() === 'li')
                .map(li => `- ${serializeNewsEditorInline(li).trim()}`)
                .join('\n');
        }
        if (tag === 'ol') {
            return [...node.children]
                .filter(child => child.tagName.toLowerCase() === 'li')
                .map((li, index) => `${index + 1}. ${serializeNewsEditorInline(li).trim()}`)
                .join('\n');
        }
        if (tag === 'p' || tag === 'div') {
            const blockChildren = [...node.children].filter(child => {
                const childTag = child.tagName.toLowerCase();
                return ['h2', 'h3', 'h4', 'blockquote', 'ul', 'ol', 'p', 'div'].includes(childTag);
            });
            if (blockChildren.length) {
                return blockChildren.map(serializeNewsEditorBlock).filter(Boolean).join('\n\n');
            }
            return serializeNewsEditorParagraphText(node);
        }
        return serializeNewsEditorInline(node).trim();
    }

    function serializeNewsEditorHtml(rootEl) {
        if (!rootEl || typeof rootEl !== 'object') return '';
        const blocks = [];
        [...rootEl.childNodes].forEach(node => {
            if (node.nodeType === 3) {
                const text = String(node.textContent || '').trim();
                if (text) blocks.push(text);
                return;
            }
            if (node.nodeType !== 1) return;
            const block = serializeNewsEditorBlock(node);
            if (block) blocks.push(block);
        });
        return blocks.join('\n\n').trim();
    }

    function serializeNewsTitleEditorHtml(rootEl) {
        if (!rootEl || typeof rootEl !== 'object') return '';
        const raw = serializeNewsEditorInline(rootEl).replace(/\s+/g, ' ').trim();
        return raw;
    }

    function stripNewsMarkdownPlainText(value) {
        let text = String(value || '');
        text = text.replace(/«size:\d{1,2}»([\s\S]*?)«\/size»/g, '$1');
        text = text.replace(/«bg:(#[0-9a-fA-F]{3,6})»([\s\S]*?)«\/bg»/gi, '$2');
        text = text.replace(/«(#[0-9a-fA-F]{3,6})»([\s\S]*?)«\/»/gi, '$2');
        text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1');
        text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
        text = text.replace(/\*([^*]+)\*/g, '$1');
        text = text.replace(/__([^_]+)__/g, '$1');
        text = text.replace(/==([^=]+)==/g, '$1');
        text = text.replace(/`([^`]+)`/g, '$1');
        text = text.replace(/\^([^^]+)\^/g, '$1');
        text = text.replace(/^::(left|center|right)::\s+/gm, '');
        return text.replace(/\s+/g, ' ').trim();
    }

    function renderNewsTitleMarkdownHtml(value) {
        return renderNewsMarkdownInline(String(value || '').trim());
    }

    function getCurrentUserId() {
        try {
            return String(typeof getCurrentUser === 'function' ? (getCurrentUser()?.id || '') : '').trim();
        } catch (error) {
            return '';
        }
    }

    function getNewsLastSeenAt(userId = getCurrentUserId()) {
        const key = `${LAST_SEEN_PREFIX}${String(userId || 'anonymous')}`;
        return String(localStorage.getItem(key) || '').trim();
    }

    function markNewsSeen(userId = getCurrentUserId()) {
        const key = `${LAST_SEEN_PREFIX}${String(userId || 'anonymous')}`;
        localStorage.setItem(key, new Date().toISOString());
        if (window.__newsHomeSnapshot) {
            window.__newsHomeSnapshot.unread = 0;
        }
    }

    function countUnreadNewsItems(items = [], lastSeenAt = '') {
        if (!lastSeenAt) return (items || []).length;
        const seenMs = new Date(lastSeenAt).getTime();
        if (Number.isNaN(seenMs)) return (items || []).length;
        return (items || []).filter((post) => {
            const stamp = post?.publishedAt || post?.updatedAt || post?.createdAt || '';
            const ms = new Date(stamp).getTime();
            return !Number.isNaN(ms) && ms > seenMs;
        }).length;
    }

    function stashNewsDeepLinkPostId(postId) {
        const id = String(postId || '').trim();
        if (!id) return;
        localStorage.setItem(PENDING_POST_KEY, id);
    }

    function resolveNewsDeepLinkPostId() {
        const params = new URLSearchParams(window.location.search || '');
        const fromUrl = params.get('postId') || params.get('newsPostId');
        if (fromUrl) return String(fromUrl).trim();
        const pending = localStorage.getItem(PENDING_POST_KEY);
        if (pending) {
            localStorage.removeItem(PENDING_POST_KEY);
            return String(pending).trim();
        }
        return '';
    }

    function buildNewsDeepLink(postId) {
        const id = String(postId || '').trim();
        if (!id) return 'news.html';
        return `news.html?postId=${encodeURIComponent(id)}`;
    }

    async function prefetchNewsHomeSnapshot(options = {}) {
        const userId = String(options.userId || getCurrentUserId()).trim();
        if (!userId || typeof kiuPortalFetch !== 'function') return window.__newsHomeSnapshot || null;
        if (!options.force && document.body?.classList?.contains('lux-route-news')) {
            const existing = window.__newsHomeSnapshot;
            if (existing?.fetchedAt && (Date.now() - existing.fetchedAt) < 45000) return existing;
        }
        try {
            const query = new URLSearchParams({
                userId,
                limit: String(options.limit || 3),
                featured: '1'
            });
            if (options.courseId) query.set('courseId', String(options.courseId));
            const payload = await kiuPortalFetch(`/api/news/feed?${query.toString()}`);
            const items = Array.isArray(payload?.items) ? payload.items : [];
            const lastSeenAt = getNewsLastSeenAt(userId);
            const snapshot = {
                items,
                unread: countUnreadNewsItems(items, lastSeenAt),
                fetchedAt: Date.now()
            };
            window.__newsHomeSnapshot = snapshot;
            return snapshot;
        } catch (error) {
            return window.__newsHomeSnapshot || null;
        }
    }

    function getNewsHomeSnapshot() {
        return window.__newsHomeSnapshot || { items: [], unread: 0, fetchedAt: 0 };
    }

    function buildNewsHomeStripHtml(snapshot = getNewsHomeSnapshot()) {
        const items = Array.isArray(snapshot?.items) ? snapshot.items : [];
        const unread = Number(snapshot?.unread || 0);
        if (!items.length) return '';
        const rows = items.map((post) => {
            const postId = String(post?.id || '');
            const href = buildNewsDeepLink(postId);
            const priority = String(post?.priority || 'standard');
            const badge = post?.pinned
                ? '<span class="lux-status-pill home-hover-chip is-pinned">Pinned</span>'
                : (priority !== 'standard' ? `<span class="lux-status-pill home-hover-chip">${escapeHtml(priority)}</span>` : '');
            return `
                <a class="news-home-strip-item" href="${escapeHtml(href)}">
                    <div class="news-home-strip-item-title">${escapeHtml(post?.title || 'University update')}</div>
                    <div class="news-home-strip-item-meta lux-card-meta">${escapeHtml(post?.sectionLabel || 'News')}${badge ? ` · ${badge}` : ''}</div>
                </a>
            `;
        }).join('');
        return `
            <section class="lux-card news-home-strip" data-news-home-strip="1">
                <div class="lux-card-head">
                    <div>
                        <div class="lux-card-title">Campus News</div>
                        <div class="lux-card-copy">Official university announcements for your role and faculty.</div>
                    </div>
                    <a class="newsx-btn lux-secondary-btn" href="news.html">${unread > 0 ? `View all (${unread} new)` : 'View all'}</a>
                </div>
                <div class="news-home-strip-list">${rows}</div>
            </section>
        `;
    }

    function notifyHomeNewsMotion() {
        // The strip mounts directly without a startup transition.
    }

    function mountNewsHomeStrip(host = document.getElementById('lux-home-shell')) {
        if (!host) return;
        if (host.dataset?.homeRenderReady !== '1') return;
        host.querySelector('[data-news-home-strip="1"]')?.remove();
        if (typeof getEffectiveRole === 'function' && getEffectiveRole() === 'student') return;
        const markup = buildNewsHomeStripHtml();
        if (!markup) return;
        const grid = host.querySelector('[data-dashboard-canvas="1"], .lux-home-grid, .lux-widget-stack');
        if (grid) {
            grid.insertAdjacentHTML('afterbegin', markup);
            notifyHomeNewsMotion();
            return;
        }
        host.insertAdjacentHTML('afterbegin', markup);
        notifyHomeNewsMotion();
    }

    Object.assign(window, {
        renderNewsMarkdownHtml,
        renderNewsTitleMarkdownHtml,
        serializeNewsEditorHtml,
        serializeNewsTitleEditorHtml,
        stripNewsMarkdownPlainText,
        markNewsSeen,
        stashNewsDeepLinkPostId,
        resolveNewsDeepLinkPostId,
        buildNewsDeepLink,
        prefetchNewsHomeSnapshot,
        getNewsHomeSnapshot,
        mountNewsHomeStrip
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (document.body?.classList?.contains('lux-route-news')) return;
            prefetchNewsHomeSnapshot().then(() => {
                if (typeof getActivePageId === 'function' && getActivePageId() === 'home') {
                    mountNewsHomeStrip();
                }
            });
        }, { once: true });
    } else if (!document.body?.classList?.contains('lux-route-news')) {
        prefetchNewsHomeSnapshot();
    }
})();
