(function initSocialPinModel(global) {
    if (global.KiuSocialPinModel) return;

    const MODULES = ['portfolio', 'research', 'event', 'survey', 'photo', 'lostFound'];

    function text(value) {
        return String(value == null ? '' : value).trim();
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function normalizeModule(value = '') {
        const raw = text(value);
        if (MODULES.includes(raw)) return raw;
        if (raw === 'events') return 'event';
        if (raw === 'surveys') return 'survey';
        if (raw === 'photography' || raw === 'expose') return 'photo';
        if (raw === 'lost-found' || raw === 'lostfound') return 'lostFound';
        return '';
    }

    function socialHub() {
        if (typeof global.getPortalSocialRuntimeState === 'function') {
            return global.getPortalSocialRuntimeState()?.social || {};
        }
        return global.__kiuSocialLiteRuntime?.social || {};
    }

    function currentUserId() {
        if (typeof global.getCurrentUser === 'function') return text(global.getCurrentUser()?.id);
        if (typeof global.getCurrentUserId === 'function') return text(global.getCurrentUserId());
        return text(global.currentUser?.id || '');
    }

    function currentUserRole() {
        if (typeof global.getCurrentUser === 'function') return text(global.getCurrentUser()?.role).toLowerCase();
        return text(global.currentUser?.role || '').toLowerCase();
    }

    function curatorPinIds(module) {
        const normalized = normalizeModule(module);
        const hub = socialHub();
        const bucket = hub.moduleCuratorPins && typeof hub.moduleCuratorPins === 'object' ? hub.moduleCuratorPins : {};
        return Array.isArray(bucket[normalized]) ? bucket[normalized].map((id) => text(id)).filter(Boolean) : [];
    }

    function userPinIds(module) {
        const normalized = normalizeModule(module);
        const viewerId = currentUserId();
        if (!normalized || !viewerId) return [];
        const hub = socialHub();
        if (normalized === 'research') {
            return (Array.isArray(hub.researchPublications) ? hub.researchPublications : [])
                .filter((item) => Boolean(item?.isSaved))
                .map((item) => text(item.id))
                .filter(Boolean);
        }
        if (normalized === 'photo') {
            const savedHub = global.KIU_STATE?.socialHub;
            return (Array.isArray(savedHub?.savedPosts) ? savedHub.savedPosts : [])
                .filter((item) => text(item?.userId) === viewerId && text(item?.itemType) === 'post')
                .map((item) => text(item?.itemId))
                .filter(Boolean);
        }
        const bucket = hub.userPins && typeof hub.userPins === 'object' ? hub.userPins : {};
        return Array.isArray(bucket[normalized]) ? bucket[normalized].map((id) => text(id)).filter(Boolean) : [];
    }

    function isCuratorPinned(module, entityId) {
        return curatorPinIds(module).includes(text(entityId));
    }

    function isPersonalPinned(module, entityId) {
        return userPinIds(module).includes(text(entityId));
    }

    function sortWithCuratorPins(module, items = [], getId = (item) => text(item?.id)) {
        const order = new Map(curatorPinIds(module).map((id, index) => [id, index]));
        return [...items].sort((left, right) => {
            const leftId = text(getId(left));
            const rightId = text(getId(right));
            const leftRank = order.has(leftId) ? order.get(leftId) : Number.MAX_SAFE_INTEGER;
            const rightRank = order.has(rightId) ? order.get(rightId) : Number.MAX_SAFE_INTEGER;
            if (leftRank !== rightRank) return leftRank - rightRank;
            return text(right?.updatedAt || right?.createdAt || '').localeCompare(text(left?.updatedAt || left?.createdAt || ''));
        });
    }

    function applyPinFlags(module, items = [], getId = (item) => text(item?.id)) {
        return items.map((item) => {
            const id = text(getId(item));
            return {
                ...item,
                isCuratorPinned: isCuratorPinned(module, id),
                isPinnedByViewer: isPersonalPinned(module, id),
                isPinned: isCuratorPinned(module, id) || isPersonalPinned(module, id)
            };
        });
    }

    function partitionPinnedTab(module, items = [], getId = (item) => text(item?.id)) {
        const curatorSet = new Set(curatorPinIds(module));
        const personalSet = new Set(userPinIds(module));
        const highlighted = [];
        const yours = [];
        const seen = new Set();
        curatorPinIds(module).forEach((id) => {
            const item = items.find((entry) => text(getId(entry)) === id);
            if (item && !seen.has(id)) {
                highlighted.push(item);
                seen.add(id);
            }
        });
        userPinIds(module).forEach((id) => {
            if (curatorSet.has(id)) return;
            const item = items.find((entry) => text(getId(entry)) === id);
            if (item && !seen.has(id)) {
                yours.push(item);
                seen.add(id);
            }
        });
        const all = [...highlighted, ...yours];
        return { highlighted, yours, all, curatorSet, personalSet };
    }

    function renderPinTabButton(module, activeTab, options = {}) {
        const normalized = normalizeModule(module);
        const action = text(options.action || `${normalized}-tab`);
        const tabValue = text(options.tabValue || 'pinned');
        const label = text(options.label || 'Pinned');
        const isActive = text(activeTab) === tabValue;
        return `<button class="${isActive ? 'lux-primary-btn' : 'lux-secondary-btn'} lux-secondary-btn-sm" type="button" role="tab" aria-selected="${isActive ? 'true' : 'false'}" data-action="${escapeHtml(action)}" data-${escapeHtml(normalized)}-tab="${escapeHtml(tabValue)}"><i class="fas fa-thumbtack" aria-hidden="true"></i> ${escapeHtml(label)}</button>`;
    }

    function viewerCanCuratorPin(module, item) {
        const normalized = normalizeModule(module);
        const viewerId = currentUserId();
        if (!normalized || !item || !viewerId) return false;
        const role = currentUserRole();
        if (role === 'admin') return true;
        if (normalized === 'portfolio') {
            return Boolean(item.canEdit) || text(item.ownerUserId || item.userId) === viewerId;
        }
        if (normalized === 'research') return Boolean(item.canManage);
        if (normalized === 'event') {
            return Boolean(item.viewerCanEdit || item.viewerCanDelete || item.viewerIsEditor);
        }
        if (normalized === 'survey') return Boolean(item.viewerCanManage);
        if (normalized === 'photo') {
            return text(item.authorUserId || item.postedById) === viewerId;
        }
        if (normalized === 'lostFound') {
            return text(item.authorUserId) === viewerId || ['admin', 'student_service'].includes(role);
        }
        return false;
    }

    function renderModulePinActions(module, entityId, options = {}) {
        const normalized = normalizeModule(module);
        const id = text(entityId);
        if (!id) return '';
        const showPersonal = options.showPersonal !== false && normalized !== 'research' && normalized !== 'photo';
        if (!showPersonal) return '';
        const personalPinned = Boolean(options.isPersonalPinned ?? isPersonalPinned(normalized, id));
        const pinAttrs = `data-pin-module="${escapeHtml(normalized)}" data-entity-id="${escapeHtml(id)}"`;
        const label = personalPinned ? 'Saved' : 'Save';
        const title = personalPinned ? 'Remove from saved' : 'Save for later';
        return `<span class="social-module-pin-actions"><button class="lux-secondary-btn lux-secondary-btn-sm social-module-pin-btn ${personalPinned ? 'lux-primary-btn' : 'lux-secondary-btn'}" type="button" data-action="module-personal-pin" ${pinAttrs} title="${escapeHtml(title)}"><i class="fas fa-bookmark" aria-hidden="true"></i> ${escapeHtml(label)}</button></span>`;
    }

    function renderPinnedSections(module, sections, renderItem, emptyCopy = 'No pinned items yet.', options = {}) {
        const highlighted = Array.isArray(sections?.highlighted) ? sections.highlighted : [];
        const yours = Array.isArray(sections?.yours) ? sections.yours : [];
        const emptyClass = text(options.emptyClass || 'social-neo-empty home-hover-chip');
        if (!highlighted.length && !yours.length) {
            return `<div class="${escapeHtml(emptyClass)}">${escapeHtml(emptyCopy)}</div>`;
        }
        const blocks = [];
        if (highlighted.length) {
            blocks.push(`<section class="social-pin-section"><h3 class="lux-section-kicker social-pin-section-title">Highlighted</h3><div class="social-pin-section-list">${highlighted.map(renderItem).join('')}</div></section>`);
        }
        if (yours.length) {
            blocks.push(`<section class="social-pin-section"><h3 class="lux-section-kicker social-pin-section-title">Your pins</h3><div class="social-pin-section-list">${yours.map(renderItem).join('')}</div></section>`);
        }
        return blocks.join('');
    }

    const PIN_API_UNAVAILABLE_MESSAGE = 'Pin API unavailable — restart platform backend (npm run stop:local && npm run start:local).';
    const PIN_API_BANNER_MESSAGE = 'Pins won\'t save until the platform backend is restarted. Run: npm run stop:local && npm run start:local';

    async function checkPinApiHealth() {
        const backendUrl = typeof global.getKiuPortalBackendUrl === 'function'
            ? text(global.getKiuPortalBackendUrl()).replace(/\/$/, '')
            : '';
        if (!backendUrl) return { ok: false, backendUrl: '' };
        try {
            const response = await fetch(`${backendUrl}/health`, { cache: 'no-store' });
            if (!response.ok) return { ok: false, backendUrl };
            const payload = await response.json().catch(() => null);
            return { ok: Boolean(payload?.socialPinApiVersion), backendUrl };
        } catch (error) {
            return { ok: false, backendUrl };
        }
    }

    function setPinApiUnavailable(unavailable) {
        if (typeof global.getPortalSocialRuntimeState !== 'function') return;
        const runtime = global.getPortalSocialRuntimeState();
        if (runtime?.ui) runtime.ui.pinApiUnavailable = Boolean(unavailable);
    }

    global.KiuSocialPinModel = {
        MODULES,
        PIN_API_UNAVAILABLE_MESSAGE,
        PIN_API_BANNER_MESSAGE,
        normalizeModule,
        curatorPinIds,
        userPinIds,
        isCuratorPinned,
        isPersonalPinned,
        sortWithCuratorPins,
        applyPinFlags,
        partitionPinnedTab,
        renderPinTabButton,
        renderModulePinActions,
        renderPinnedSections,
        viewerCanCuratorPin,
        checkPinApiHealth,
        setPinApiUnavailable
    };
}(typeof window !== 'undefined' ? window : globalThis));
