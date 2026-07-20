/* Pure portfolio data helpers for social workspace.
 * Loaded before social-workspace.js (see ensureSocialWorkspaceModule).
 * Uses __kiuSocialWorkspaceHooks for text / accounts / faculty when available.
 */
(function initSocialWorkspacePortfolioModel() {
    'use strict';
    if (window.__KIU_SOCIAL_WORKSPACE_PORTFOLIO_MODEL_LOADED) return;
    window.__KIU_SOCIAL_WORKSPACE_PORTFOLIO_MODEL_LOADED = true;

    function hooks() {
        return window.__kiuSocialWorkspaceHooks || {};
    }

    function text(value) {
        const hook = hooks().text;
        if (typeof hook === 'function') return hook(value);
        return String(value == null ? '' : value).trim();
    }

    function uniqueStrings(values) {
        const hook = hooks().uniqueStrings;
        if (typeof hook === 'function') return hook(values);
        const seen = new Set();
        const out = [];
        (Array.isArray(values) ? values : []).forEach((item) => {
            const v = text(item);
            if (!v || seen.has(v)) return;
            seen.add(v);
            out.push(v);
        });
        return out;
    }

    function accountById(id) {
        const hook = hooks().accountById;
        if (typeof hook === 'function') return hook(id);
        return null;
    }

    function currentUserId() {
        const hook = hooks().currentUserId;
        if (typeof hook === 'function') return hook();
        return '';
    }

    function currentUser() {
        const hook = hooks().currentUser;
        if (typeof hook === 'function') return hook();
        return null;
    }

    function currentFacultyCode() {
        const hook = hooks().currentFacultyCode;
        if (typeof hook === 'function') return hook();
        return '';
    }

    function portfolioStatus(value, raw = {}) {
        const normalized = text(value).toLowerCase();
        if (normalized === 'published' || normalized === 'draft') return normalized;
        if (raw?.showcasePageId || raw?.showcaseEnabled) return 'published';
        return 'draft';
    }

    function portfolioVisibilityMode(raw = {}) {
        const normalized = text(raw?.visibilityMode || '').toLowerCase();
        if (['all_logged_in', 'students_only', 'tas_only', 'professors_only', 'staff_only', 'custom'].includes(normalized)) {
            return normalized;
        }
        const legacy = text(raw?.visibility || '').toLowerCase();
        if (legacy === 'public') return 'all_logged_in';
        return 'custom';
    }

    function parsePortfolioTextList(value) {
        return uniqueStrings(
            String(value || '')
                .split(/[\n,]/)
                .map((item) => text(item))
                .filter(Boolean)
        );
    }

    function parsePortfolioLinksInput(value) {
        return String(value || '')
            .split('\n')
            .map((line) => text(line))
            .filter(Boolean)
            .map((line) => {
                const parts = line.split('|').map((item) => text(item));
                if (parts.length > 1) {
                    return { label: parts[0] || parts[1], url: parts.slice(1).join(' | ') };
                }
                return { label: line, url: line };
            })
            .filter((item) => text(item.url));
    }

    function serializePortfolioLinks(items = []) {
        return (Array.isArray(items) ? items : [])
            .map((item) => {
                const label = text(item?.label || '');
                const url = text(item?.url || item?.href || '');
                if (!url) return '';
                return label && label !== url ? `${label} | ${url}` : url;
            })
            .filter(Boolean)
            .join('\n');
    }

    function portfolioAudienceLabel(mode) {
        const labels = {
            all_logged_in: 'All logged-in users',
            students_only: 'Campus peers',
            tas_only: 'TAs only',
            professors_only: 'Professors only',
            staff_only: 'Staff only',
            custom: 'Custom audience'
        };
        return labels[text(mode).toLowerCase()] || 'Custom audience';
    }

    function normalizePortfolioEntry(raw = {}) {
        const ownerUserId = text(raw?.ownerUserId || raw?.authorUserId || '');
        const owner = accountById(ownerUserId) || { id: ownerUserId };
        const facultyCodes = uniqueStrings([
            ...(Array.isArray(raw?.facultyCodes) ? raw.facultyCodes : []),
            ...(Array.isArray(raw?.facultyTags) ? raw.facultyTags : []),
            text(raw?.ownerFacultyCode || owner?.facultyCode || owner?.faculty || '')
        ].filter(Boolean));
        const visibleFacultyCodes = uniqueStrings([
            ...(Array.isArray(raw?.visibleFacultyCodes) ? raw.visibleFacultyCodes : []),
            ...(text(raw?.visibility || '').toLowerCase() === 'faculty' ? facultyCodes : [])
        ].filter(Boolean));
        const mediaItems = (Array.isArray(raw?.mediaItems) ? raw.mediaItems : [])
            .map((item) => item && typeof item === 'object' ? item : null)
            .filter(Boolean);
        const entry = {
            ...raw,
            id: text(raw?.id || ''),
            title: text(raw?.title || raw?.name || 'Portfolio showcase'),
            summary: text(raw?.summary || raw?.description || ''),
            description: text(raw?.description || raw?.summary || ''),
            ownerUserId,
            owner,
            ownerRole: text(owner?.role || raw?.ownerRole || 'student').toLowerCase(),
            ownerFacultyCode: text(raw?.ownerFacultyCode || owner?.facultyCode || owner?.faculty || facultyCodes[0] || ''),
            facultyCodes,
            facultyTags: facultyCodes,
            hashtags: uniqueStrings([...(Array.isArray(raw?.hashtags) ? raw.hashtags : []), ...(Array.isArray(raw?.tags) ? raw.tags : [])]),
            skillTags: uniqueStrings([...(Array.isArray(raw?.skillTags) ? raw.skillTags : []), ...(Array.isArray(raw?.skills) ? raw.skills : [])]),
            mediaItems,
            externalLinks: (Array.isArray(raw?.externalLinks) ? raw.externalLinks : [])
                .map((item) => item && typeof item === 'object' ? { label: text(item.label || item.url), url: text(item.url || '') } : null)
                .filter((item) => text(item?.url)),
            status: portfolioStatus(raw?.status, raw),
            visibilityMode: portfolioVisibilityMode(raw),
            visibleRoles: uniqueStrings(Array.isArray(raw?.visibleRoles) ? raw.visibleRoles.map((item) => text(item).toLowerCase()) : []),
            visibleFacultyCodes,
            visibleUserIds: uniqueStrings(Array.isArray(raw?.visibleUserIds) ? raw.visibleUserIds : []),
            hiddenUserIds: uniqueStrings(Array.isArray(raw?.hiddenUserIds) ? raw.hiddenUserIds : []),
            createdAt: text(raw?.createdAt || ''),
            updatedAt: text(raw?.updatedAt || raw?.createdAt || ''),
            canEdit: text(ownerUserId) === currentUserId() || ['admin', 'student_service'].includes(text(currentUser()?.role || '').toLowerCase())
        };
        return entry;
    }

    function canViewerAccessPortfolioEntry(entry, viewer) {
        const resolvedViewer = viewer === undefined ? currentUser() : viewer;
        const viewerId = text(resolvedViewer?.id || '');
        if (!viewerId || !entry) return false;
        if (entry.canEdit) return true;
        if (entry.hiddenUserIds.includes(viewerId)) return false;
        if (entry.status !== 'published') return false;
        const viewerRole = text(resolvedViewer?.role || '').toLowerCase();
        const viewerFaculty = text(resolvedViewer?.facultyCode || resolvedViewer?.faculty || currentFacultyCode() || '');
        if (entry.visibilityMode === 'all_logged_in') return true;
        if (entry.visibilityMode === 'students_only') return viewerRole === 'student';
        if (entry.visibilityMode === 'tas_only') return viewerRole === 'ta';
        if (entry.visibilityMode === 'professors_only') return viewerRole === 'professor';
        if (entry.visibilityMode === 'staff_only') return ['professor', 'ta', 'admin', 'student_service'].includes(viewerRole);
        if (entry.visibleUserIds.includes(viewerId)) return true;
        if (entry.visibleRoles.includes(viewerRole)) return true;
        if (viewerFaculty && entry.visibleFacultyCodes.includes(viewerFaculty)) return true;
        return false;
    }

    function portfolioMatchesRoleFilter(entry, roleFilter) {
        const filter = text(roleFilter || 'all');
        if (!filter || filter === 'all') return true;
        return text(entry.visibilityMode) === filter;
    }

    function clonePortfolioDocument(doc) {
        try {
            return JSON.parse(JSON.stringify(doc || {}));
        } catch (error) {
            return doc || null;
        }
    }

    function portfolioMakeId(prefix = 'portfolio') {
        return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
    }

    function portfolioFieldValue(type, value) {
        const normalizedType = text(type || 'text');
        if (normalizedType === 'dateRange') {
            const source = value && typeof value === 'object' ? value : {};
            return {
                type: normalizedType,
                value: {
                    start: text(source.start),
                    end: text(source.end),
                    current: Boolean(source.current)
                }
            };
        }
        if (normalizedType === 'link') {
            return { type: normalizedType, value: { label: text(value?.label || value?.url), url: text(value?.url || value) } };
        }
        if (normalizedType === 'file') {
            return { type: normalizedType, value: value || null };
        }
        return { type: normalizedType, value: text(value) };
    }

    const api = {
        portfolioStatus,
        portfolioVisibilityMode,
        parsePortfolioTextList,
        parsePortfolioLinksInput,
        serializePortfolioLinks,
        portfolioAudienceLabel,
        normalizePortfolioEntry,
        canViewerAccessPortfolioEntry,
        portfolioMatchesRoleFilter,
        clonePortfolioDocument,
        portfolioMakeId,
        portfolioFieldValue
    };

    window.KiuSocialWorkspacePortfolioModel = api;
})();
