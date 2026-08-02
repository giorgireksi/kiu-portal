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
        return global.__kiuSocialRuntime?.social || global.__kiuSocialState?.()?.social || {};
    }

    function currentUserId() {
        if (typeof global.__kiuSocialCurrentUserId === 'function') return text(global.__kiuSocialCurrentUserId());
        return text(global.__kiuSocialState?.()?.user?.id || '');
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
            return (Array.isArray(hub.savedPosts) ? hub.savedPosts : [])
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
        const role = text(global.__kiuSocialCurrentUser?.()?.role || global.__kiuSocialState?.()?.user?.role || '').toLowerCase();
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
        const canCurator = Boolean(options.canCuratorPin);
        const curatorPinned = Boolean(options.isCuratorPinned ?? isCuratorPinned(normalized, id));
        const personalPinned = Boolean(options.isPersonalPinned ?? isPersonalPinned(normalized, id));
        const parts = [];
        if (canCurator) {
            parts.push(`<button class="lux-secondary-btn lux-secondary-btn-sm social-module-pin-btn ${curatorPinned ? 'lux-primary-btn' : 'lux-secondary-btn'}" type="button" data-action="module-curator-pin" data-pin-module="${escapeHtml(normalized)}" data-entity-id="${escapeHtml(id)}" title="${curatorPinned ? 'Unpin highlight' : 'Pin highlight'}"><i class="fas fa-thumbtack" aria-hidden="true"></i></button>`);
        }
        if (options.showPersonal !== false && normalized !== 'research' && normalized !== 'photo') {
            parts.push(`<button class="lux-secondary-btn lux-secondary-btn-sm social-module-pin-btn ${personalPinned ? 'lux-primary-btn' : 'lux-secondary-btn'}" type="button" data-action="module-personal-pin" data-pin-module="${escapeHtml(normalized)}" data-entity-id="${escapeHtml(id)}" title="${personalPinned ? 'Unpin' : 'Pin for me'}"><i class="fas fa-bookmark" aria-hidden="true"></i></button>`);
        }
        return parts.length ? `<span class="social-module-pin-actions">${parts.join('')}</span>` : '';
    }

    function renderPinnedSections(module, sections, renderItem, emptyCopy = 'No pinned items yet.') {
        const highlighted = Array.isArray(sections?.highlighted) ? sections.highlighted : [];
        const yours = Array.isArray(sections?.yours) ? sections.yours : [];
        if (!highlighted.length && !yours.length) {
            return `<div class="social-neo-empty">${escapeHtml(emptyCopy)}</div>`;
        }
        const blocks = [];
        if (highlighted.length) {
            blocks.push(`<section class="social-pin-section"><h3 class="social-pin-section-title">Highlighted</h3><div class="social-pin-section-list">${highlighted.map(renderItem).join('')}</div></section>`);
        }
        if (yours.length) {
            blocks.push(`<section class="social-pin-section"><h3 class="social-pin-section-title">Your pins</h3><div class="social-pin-section-list">${yours.map(renderItem).join('')}</div></section>`);
        }
        return blocks.join('');
    }

    global.KiuSocialPinModel = {
        MODULES,
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
        viewerCanCuratorPin
    };
}(typeof window !== 'undefined' ? window : globalThis));
