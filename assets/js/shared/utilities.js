/* General utilities extracted from the legacy core.js bundle. Active routes now load split files directly. */

// --- GLOBAL HTML ESCAPE UTILITY (used by messenger.js and others) ---
function escapeHtml(value) {
    if (value == null) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

if (typeof window.getInitialsAvatarDataUrl !== 'function') {
    window.getInitialsAvatarDataUrl = function getInitialsAvatarDataUrl(name, options = {}) {
        const deriveInitials = (value) => {
            if (typeof getInitialsAvatar === 'function') return getInitialsAvatar(value);
            const parts = String(value || '')
                .trim()
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2);
            if (!parts.length) return 'KIU';
            return parts.map((part) => part.charAt(0).toUpperCase()).join('');
        };
        const initials = deriveInitials(name);
        const background = /^#?[0-9a-fA-F]{6}$/.test(String(options.background || '').trim())
            ? `#${String(options.background || '').trim().replace('#', '')}`
            : '#2563eb';
        const color = /^#?[0-9a-fA-F]{6}$/.test(String(options.color || '').trim())
            ? `#${String(options.color || '').trim().replace('#', '')}`
            : '#ffffff';
        const size = Math.max(32, Math.min(256, parseInt(options.size, 10) || 96));
        const fontSize = Math.round(size * 0.38);
        const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${escapeHtml(initials)} avatar">
  <rect width="${size}" height="${size}" fill="${background}"/>
  <text x="50%" y="50%" dy=".06em" fill="${color}" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="${fontSize}" font-weight="800" text-anchor="middle">${escapeHtml(initials)}</text>
</svg>`.trim();
        return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    };
}

// Shared DOM-safe token helper used by social/LMS widgets.
if (typeof window.toDomToken !== 'function') {
    window.toDomToken = function toDomToken(value) {
        return String(value || '').replace(/[^a-zA-Z0-9_-]+/g, '_');
    };
}

if (typeof window.getCurrentFaculty !== 'function') {
    window.getCurrentFaculty = function getCurrentFacultyFallback() {
        try {
            return String(
                localStorage.getItem('currentFaculty')
                || document.body?.dataset?.faculty
                || document.documentElement?.dataset?.faculty
                || window.currentUser?.facultyCode
                || window.currentUser?.faculty
                || 'ECON'
            ).trim() || 'ECON';
        } catch (error) {
            return 'ECON';
        }
    };
}

if (typeof window.getFacultyLabel !== 'function') {
    window.getFacultyLabel = function getFacultyLabelFallback(code) {
        return String(code || 'Faculty').trim() || 'Faculty';
    };
}

if (typeof window.getFacultyColor !== 'function') {
    window.getFacultyColor = function getFacultyColorFallback() {
        return '#C8822A';
    };
}

if (typeof window.getFacultyProfile !== 'function') {
    window.getFacultyProfile = function getFacultyProfileFallback(code) {
        return {
            code: String(code || getCurrentFaculty() || 'ECON').trim() || 'ECON',
            label: getFacultyLabel(code || getCurrentFaculty()),
            color: getFacultyColor(code || getCurrentFaculty()),
            curriculum: []
        };
    };
}

// --- PERFORMANCE: Helper to check if element is visible (not display:none) ---
function _isElementVisible(el) {
    if (!el) return false;
    // Check if element or any parent has display:none
    let current = el;
    while (current && current !== document.body) {
        if (current.hidden) return false;
        if (current.style && current.style.display === 'none') return false;
        current = current.parentElement;
    }
    return true;
}

// --- GENERAL UTILITIES ---
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Always grab the LAST element with that ID (modal fields come after inline duplicates in DOM)
function _modalField(id) {
    const all = document.querySelectorAll('#' + id);
    return all.length > 0 ? all[all.length - 1] : null;
}

function switchAdminPanelTab(tab) {
    ['identity', 'docs', 'finance', 'reg'].forEach(t => {
        const tabEl = document.getElementById('apt-' + t);
        const contentEl = document.getElementById('apc-' + t);
        if (!tabEl || !contentEl) return;
        const active = t === tab;
        tabEl.classList.toggle('active', active);
        tabEl.setAttribute('aria-selected', active ? 'true' : 'false');
        contentEl.hidden = !active;
    });
}

function updateSubjectCodePreview() {
    if (typeof refreshSemesterDropdowns === 'function') refreshSemesterDropdowns();
    const fac = getCurrentFaculty();
    const preview = document.getElementById('new-subject-code-preview');
    // Subject code is now optional - only clear on initial page load if empty
    // Admin can enter their own code or leave blank
    // Show current faculty badge (read-only)
    const facBadge = document.getElementById('add-subject-faculty-badge');
    if (facBadge) {
        facBadge.textContent = getFacultyLabel(fac);
        facBadge.dataset.faculty = normalizeFacultyCode(fac, getCurrentFaculty());
    }
    syncCurriculumFacultyBadge(fac);
    if (typeof populateAntiReqDropdown === 'function') populateAntiReqDropdown();
    if (typeof ensureSubjectSemesterParityHint === 'function') ensureSubjectSemesterParityHint();
}

function syncCurriculumFacultyBadge(faculty = getCurrentFaculty()) {
    const normalizedFaculty = normalizeFacultyCode(faculty, getCurrentFaculty());
    const badge = document.getElementById('curriculum-active-faculty-badge');
    if (badge) {
        badge.innerHTML = `<i class="fas fa-university"></i><span>Active Faculty: ${escapeHtml(getFacultyLabel(normalizedFaculty))}</span>`;
        badge.dataset.faculty = normalizedFaculty;
    }
    const hiddenFilter = document.getElementById('filter-curriculum-faculty');
    if (hiddenFilter) hiddenFilter.value = normalizedFaculty;
}

function getActiveCurriculum(facultyFilter) {
    const fac = facultyFilter || getCurrentFaculty();
    if (typeof getFacultyCurriculumFromProfiles === 'function') {
        return getFacultyCurriculumFromProfiles(fac);
    }
    const fp = getFacultyProfile(fac);
    return Array.isArray(fp?.curriculum) ? fp.curriculum : [];
}

function kiuHexToRgbTriplet(hex, fallback = '200,130,42') {
    const cleaned = String(hex || '').trim().replace('#', '');
    if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return fallback;
    const r = parseInt(cleaned.slice(0, 2), 16);
    const g = parseInt(cleaned.slice(2, 4), 16);
    const b = parseInt(cleaned.slice(4, 6), 16);
    return `${r},${g},${b}`;
}

function kiuRgbTripletToHex(triplet, fallback = '#C8822A') {
    const parts = String(triplet || '')
        .split(',')
        .slice(0, 3)
        .map((part) => Math.max(0, Math.min(255, Math.round(Number(part.trim()) || 0))));
    if (parts.length !== 3 || parts.some((value) => !Number.isFinite(value))) return fallback;
    return `#${parts.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function kiuBlendRgbTriplets(a, b, ratio = 0.5) {
    const mix = Math.max(0, Math.min(1, Number(ratio) || 0));
    const parse = (triplet, fallback) => String(triplet || fallback)
        .split(',')
        .slice(0, 3)
        .map((part, index) => {
            const fallbackParts = String(fallback || '0,0,0').split(',');
            const numeric = Number(part?.trim?.() ?? part);
            return Math.max(0, Math.min(255, Number.isFinite(numeric) ? numeric : Number(fallbackParts[index] || 0)));
        });
    const first = parse(a, '0,0,0');
    const second = parse(b, '0,0,0');
    return [
        Math.round(first[0] + (second[0] - first[0]) * mix),
        Math.round(first[1] + (second[1] - first[1]) * mix),
        Math.round(first[2] + (second[2] - first[2]) * mix)
    ].join(',');
}

function applyFacultyLuxuryTheme(faculty, profile) {
    const normalizedFaculty = normalizeFacultyCode(faculty, 'ECON');
    const fp = profile || getFacultyProfile(normalizedFaculty) || {};
    if (typeof window.__kiuApplyResolvedPalette === 'function') {
        window.__kiuApplyResolvedPalette();
        document.body?.setAttribute('data-lux-faculty', normalizedFaculty);
        return;
    }
    const root = document.documentElement;
    const useUnifiedShellColors = document.body?.classList.contains('lux-unified-shell');
    const forceStudentShellVisuals = (() => {
        try {
            if (typeof window.shouldUseStudentShellVisualRole === 'function') {
                return Boolean(window.shouldUseStudentShellVisualRole());
            }
        } catch (e) { }
        return false;
    })();
    const isAdminView = (() => {
        if (useUnifiedShellColors) return false;
        if (forceStudentShellVisuals) return false;
        try {
            if (typeof getEffectiveUserRole === 'function') return getEffectiveUserRole() === USER_ROLES.ADMIN;
        } catch (e) { }
        return document.body?.classList.contains('role-admin');
    })();
    const primary = fp.color || getFacultyColor(normalizedFaculty);
    const nav = fp.navColor || primary;
    const primaryRgb = kiuHexToRgbTriplet(primary, '200,130,42');
    const navRgb = kiuHexToRgbTriplet(nav, '122,80,24');
    const secondaryRgb = kiuBlendRgbTriplets(primaryRgb, '255,232,188', 0.42);
    const shellStartRgb = kiuBlendRgbTriplets(navRgb, primaryRgb, 0.26);
    const shellEndRgb = kiuBlendRgbTriplets(navRgb, '4,7,13', 0.34);
    const topbarTintRgb = kiuBlendRgbTriplets(navRgb, primaryRgb, 0.2);
    const glassTintRgb = kiuBlendRgbTriplets(navRgb, primaryRgb, 0.18);
    const hazeRgb = kiuBlendRgbTriplets(primaryRgb, secondaryRgb, 0.28);

    root.style.setProperty('--lux-accent', primary);
    root.style.setProperty('--lux-accent-2', kiuRgbTripletToHex(secondaryRgb, primary));
    root.style.setProperty('--lux-accent-rgb', primaryRgb);
    root.style.setProperty('--lux-shell-start-rgb', shellStartRgb);
    root.style.setProperty('--lux-shell-end-rgb', shellEndRgb);
    root.style.setProperty('--lux-shell-glow-rgb', secondaryRgb);
    root.style.setProperty('--lux-topbar-tint-rgb', topbarTintRgb);
    root.style.setProperty('--lux-glass-tint-rgb', glassTintRgb);
    root.style.setProperty('--lux-bg-particle-rgb', secondaryRgb);
    root.style.setProperty('--lux-bg-line-rgb', primaryRgb);
    root.style.setProperty('--lux-bg-glow-rgb', secondaryRgb);
    root.style.setProperty('--lux-bg-haze-rgb', hazeRgb);
    root.style.setProperty('--lux-home-secondary-rgb', secondaryRgb);
    document.body?.setAttribute('data-lux-faculty', normalizedFaculty);

    if (useUnifiedShellColors) {
        const isLightMode = document.body?.classList.contains('lux-light-mode');
        const shellGradient = isLightMode
            ? `radial-gradient(circle at 16% 10%, rgba(${primaryRgb}, 0.10), transparent 30%), radial-gradient(circle at 84% 84%, rgba(${secondaryRgb}, 0.06), transparent 24%), linear-gradient(180deg, #ffffff 0%, #faf7f2 100%)`
            : `radial-gradient(circle at 16% 10%, rgba(${primaryRgb}, 0.16), transparent 30%), radial-gradient(circle at 84% 84%, rgba(${secondaryRgb}, 0.10), transparent 24%), linear-gradient(180deg, rgba(10, 15, 24, 0.96), rgba(5, 8, 14, 0.99))`;
        root.style.setProperty('--kiu-blue', primary);
        root.style.setProperty('--kiu-dark-blue', nav);
        root.style.setProperty('--kiu-navy', nav);
        root.style.setProperty('--kiu-bg', isLightMode ? '#f5f0e8' : '#07111d');
        root.style.setProperty('--kiu-text-main', isLightMode ? '#1e1a16' : '#f4f1ea');
        root.style.setProperty('--kiu-text-muted', isLightMode ? 'rgba(30,26,22,0.6)' : 'rgba(244, 241, 234, 0.68)');
        root.style.setProperty('--kiu-border', isLightMode ? 'rgba(224,215,204,0.8)' : 'rgba(255, 255, 255, 0.08)');
        root.style.setProperty('--kiu-white', isLightMode ? 'rgba(255,255,255,0.85)' : 'rgba(14, 19, 30, 0.74)');
        root.style.setProperty('--kiu-solid-white', '#ffffff');
        root.style.setProperty('--kiu-table-header', isLightMode ? 'rgba(245,240,232,0.6)' : 'rgba(255, 255, 255, 0.04)');
        root.style.setProperty('--kiu-gradient-blue', `linear-gradient(135deg, ${primary} 0%, ${nav} 100%)`);
        root.style.setProperty('--kiu-shadow-blue', `0 14px 34px rgba(${primaryRgb}, ${isLightMode ? '0.16' : '0.32'})`);
        root.style.setProperty('--kiu-shell-gradient', shellGradient);
        if (typeof window.__kiuApplyLmsParticleTheme === 'function') {
            window.__kiuApplyLmsParticleTheme();
        }
        return;
    }

    if (isAdminView) {
        const isLightMode = document.body?.classList.contains('lux-light-mode');
        if (isLightMode) {
            // Light mode admin - use faculty accent on white/light surfaces
            const shellGradient = `radial-gradient(circle at 16% 10%, rgba(${primaryRgb}, 0.10), transparent 30%), radial-gradient(circle at 84% 84%, rgba(${secondaryRgb}, 0.06), transparent 24%), linear-gradient(180deg, #ffffff 0%, #faf7f2 100%)`;
            root.style.setProperty('--kiu-blue', primary);
            root.style.setProperty('--kiu-dark-blue', nav);
            root.style.setProperty('--kiu-navy', nav);
            root.style.setProperty('--kiu-bg', '#f5f0e8');
            root.style.setProperty('--kiu-text-main', '#1e1a16');
            root.style.setProperty('--kiu-text-muted', 'rgba(30,26,22,0.6)');
            root.style.setProperty('--kiu-border', 'rgba(224,215,204,0.8)');
            root.style.setProperty('--kiu-white', 'rgba(255,255,255,0.85)');
            root.style.setProperty('--kiu-solid-white', '#ffffff');
            root.style.setProperty('--kiu-table-header', 'rgba(245,240,232,0.6)');
            root.style.setProperty('--kiu-gradient-blue', `linear-gradient(135deg, ${primary} 0%, ${nav} 100%)`);
            root.style.setProperty('--kiu-shadow-blue', `0 14px 34px rgba(${primaryRgb}, 0.16)`);
            root.style.setProperty('--kiu-shell-gradient', shellGradient);
            if (typeof window.__kiuApplyLmsParticleTheme === 'function') {
                window.__kiuApplyLmsParticleTheme();
            }
        } else {
            // Dark mode admin - original dark theme
            const shellGradient = `radial-gradient(circle at 16% 10%, rgba(${primaryRgb}, 0.16), transparent 30%), radial-gradient(circle at 84% 84%, rgba(${secondaryRgb}, 0.10), transparent 24%), linear-gradient(180deg, rgba(10, 15, 24, 0.96), rgba(5, 8, 14, 0.99))`;
            root.style.setProperty('--kiu-blue', primary);
            root.style.setProperty('--kiu-dark-blue', nav);
            root.style.setProperty('--kiu-navy', nav);
            root.style.setProperty('--kiu-bg', '#07111d');
            root.style.setProperty('--kiu-text-main', '#f4f1ea');
            root.style.setProperty('--kiu-text-muted', 'rgba(244, 241, 234, 0.68)');
            root.style.setProperty('--kiu-border', 'rgba(255, 255, 255, 0.08)');
            root.style.setProperty('--kiu-white', 'rgba(14, 19, 30, 0.74)');
            root.style.setProperty('--kiu-solid-white', '#ffffff');
            root.style.setProperty('--kiu-table-header', 'rgba(255, 255, 255, 0.04)');
            root.style.setProperty('--kiu-gradient-blue', `linear-gradient(135deg, ${primary} 0%, ${nav} 100%)`);
            root.style.setProperty('--kiu-shadow-blue', `0 14px 34px rgba(${primaryRgb}, 0.32)`);
            root.style.setProperty('--kiu-shell-gradient', shellGradient);
            if (typeof window.__kiuApplyLmsParticleTheme === 'function') {
                window.__kiuApplyLmsParticleTheme();
            }
        }
        return;
    }

    if (typeof window.__kiuApplyLmsParticleTheme === 'function') {
        window.__kiuApplyLmsParticleTheme();
    }
}

function warnMissingImpersonationPersona(role) {
    const normalizedRole = String(role || '').trim().toLowerCase();
    if (!normalizedRole || normalizedRole === USER_ROLES.ADMIN) return true;
    if (typeof getPreferredImpersonationUserForRole !== 'function') return true;
    let preferredFaculty = '';
    try {
        preferredFaculty = localStorage.getItem('currentFaculty') || currentUser?.facultyCode || currentUser?.faculty || 'ECON';
    } catch (error) {
        preferredFaculty = currentUser?.facultyCode || currentUser?.faculty || 'ECON';
    }
    const persona = getPreferredImpersonationUserForRole(normalizedRole, preferredFaculty);
    if (persona?.id) return true;
    const roleLabel = normalizedRole.replace(/_/g, ' ');
    const facultyLabel = typeof normalizeFacultyCode === 'function'
        ? normalizeFacultyCode(preferredFaculty || 'ECON', 'ECON')
        : String(preferredFaculty || 'ECON').trim().toUpperCase() || 'ECON';
    alert(`No active ${roleLabel} account is available in ${facultyLabel}. Switch faculty or create or activate one in Staff, then try again.`);
    return false;
}

async function syncPortalBackendImpersonationBeforeRedirect(role) {
    if (typeof syncPortalBackendImpersonation !== 'function') return;
    try {
        await syncPortalBackendImpersonation(role);
    } catch (error) {
        console.warn('Could not sync impersonated role to backend before redirect.', error);
    }
}

const KIU_LMS_RETURN_CONTEXT_KEY = 'KIU_LMS_RETURN_CONTEXT';

function getStandaloneEntryPageIdForRoleSwitch() {
    if (typeof getStandaloneEntryPageId === 'function') {
        return getStandaloneEntryPageId();
    }
    const path = (window.location.pathname || '').replace(/\\/g, '/').toLowerCase();
    const fileName = path.split('/').filter(Boolean).pop() || '';
    return fileName.replace(/\.html$/i, '');
}

function isLmsCourseWorkspaceVisible() {
    const inner = document.getElementById('page-lms-inner');
    if (!inner || inner.hidden) return false;
    const courseKey = typeof currentCourseId !== 'undefined' ? String(currentCourseId || '').trim() : '';
    return Boolean(courseKey);
}

function canApplyInPlaceAdminRoleSwitchOnStandaloneLms() {
    return getStandaloneEntryPageIdForRoleSwitch() === 'lms';
}

function persistLmsReturnContextForRoleSwitch() {
    if (!isLmsCourseWorkspaceVisible()) return false;
    const activeTabEl = document.querySelector('#page-lms-inner [data-lms-tab].is-active');
    const tab = activeTabEl
        ? String(activeTabEl.dataset.lmsTab || activeTabEl.id || '').replace(/^tab-/, '')
        : 'sessions';
    const sectionType = typeof getCurrentLmsSectionType === 'function'
        ? getCurrentLmsSectionType()
        : (typeof currentLmsSectionType !== 'undefined' ? currentLmsSectionType : 'lecture');
    try {
        sessionStorage.setItem(KIU_LMS_RETURN_CONTEXT_KEY, JSON.stringify({
            courseKey: String(currentCourseId || ''),
            tab,
            sectionType: String(sectionType || 'lecture'),
            title: document.getElementById('lms-course-title')?.innerText || ''
        }));
        return true;
    } catch (error) {
        console.warn('Could not persist LMS return context for role switch.', error);
        return false;
    }
}

function resolveRoleSwitchRedirectUrl(requestedRole) {
    let hasLmsReturn = false;
    try {
        hasLmsReturn = Boolean(sessionStorage.getItem(KIU_LMS_RETURN_CONTEXT_KEY));
    } catch (error) {
        hasLmsReturn = false;
    }
    if (hasLmsReturn && typeof resolvePortalRouteUrl === 'function') {
        return resolvePortalRouteUrl('lms', requestedRole);
    }
    if (typeof resolvePortalRouteUrl === 'function') {
        return resolvePortalRouteUrl('home', requestedRole);
    }
    return typeof getRoleHomePage === 'function'
        ? getRoleHomePage(requestedRole)
        : `index.html?view=${encodeURIComponent(requestedRole)}#home`;
}

function persistAdminImpersonationRoleState(requestedRole, impersonatedSessionUser = null) {
    const normalizedRole = String(requestedRole || USER_ROLES.STUDENT).trim().toLowerCase() || USER_ROLES.STUDENT;
    currentUserRole = normalizedRole;
    try {
        localStorage.setItem('currentUserRole', normalizedRole);
        if (normalizedRole === USER_ROLES.ADMIN) {
            localStorage.removeItem(PENDING_ROLE_SWITCH_KEY);
            sessionStorage.removeItem(ACTIVE_ROLE_IMPERSONATION_KEY);
        } else {
            localStorage.setItem(PENDING_ROLE_SWITCH_KEY, normalizedRole);
            sessionStorage.setItem(ACTIVE_ROLE_IMPERSONATION_KEY, '1');
        }
    } catch (error) {
        console.warn('Could not persist admin impersonation role state.', error);
    }
    const persona = impersonatedSessionUser
        || (typeof setActiveSessionUserByRole === 'function' ? setActiveSessionUserByRole(normalizedRole) : null);
    if (persona && (persona.facultyCode || persona.faculty) && normalizedRole !== USER_ROLES.ADMIN) {
        try {
            localStorage.setItem('currentFaculty', persona.facultyCode || persona.faculty);
        } catch (error) {}
    }
    const facultySelect = document.getElementById('faculty-select');
    if (facultySelect) {
        const targetFaculty = normalizedRole === USER_ROLES.ADMIN
            ? normalizeFacultyCode(localStorage.getItem('currentFaculty') || persona?.facultyCode || persona?.faculty || 'ECON', 'ECON')
            : normalizeFacultyCode(persona?.facultyCode || persona?.faculty || localStorage.getItem('currentFaculty') || 'ECON', 'ECON');
        facultySelect.value = targetFaculty;
    }
    if (typeof window.invalidatePageAccessCache === 'function') window.invalidatePageAccessCache();
    if (typeof window.invalidateDomCache === 'function') window.invalidateDomCache();
    if (typeof switchFacultyTheme === 'function') {
        switchFacultyTheme(
            facultySelect?.value || persona?.facultyCode || persona?.faculty || getCurrentFaculty(),
            { refreshDependentViews: false }
        );
    }
    if (typeof resetRoleSwitchViewState === 'function') resetRoleSwitchViewState();
    if (typeof refreshShellIdentity === 'function') refreshShellIdentity();
    if (typeof populateRoleSwitcher === 'function') populateRoleSwitcher();
    return persona;
}

async function refreshLmsUiAfterInPlaceRoleSwitch() {
    try {
        localStorage.removeItem('KIU_FORCE_HOME_ON_ROLE_SWITCH');
    } catch (error) {}
    window.__kiuRoleSwitchRedirectPending = false;
    if (typeof window.clearLmsTabRenderCache === 'function') {
        window.clearLmsTabRenderCache();
    }
    if (typeof refreshLmsQuizTabPresentation === 'function') {
        refreshLmsQuizTabPresentation();
    }
    if (isLmsCourseWorkspaceVisible()) {
        const activeTabEl = document.querySelector('#page-lms-inner [data-lms-tab].is-active');
        const tab = activeTabEl
            ? String(activeTabEl.dataset.lmsTab || activeTabEl.id || '').replace(/^tab-/, '')
            : 'sessions';
        if (typeof window.switchLMSTab === 'function') {
            window.switchLMSTab(tab, { force: true });
        }
        if (typeof window.refreshStandaloneLmsShellContext === 'function') {
            window.refreshStandaloneLmsShellContext({ refreshSubjectDeck: false });
        }
        return;
    }
    if (typeof window.renderLmsSubjectDeck === 'function') {
        window.renderLmsSubjectDeck({ force: true });
    }
    if (typeof window.refreshStandaloneLmsShellContext === 'function') {
        window.refreshStandaloneLmsShellContext({ refreshSubjectDeck: true, forceSubjectDeck: true });
    }
}

async function applyInPlaceAdminRoleSwitchOnStandaloneLms(requestedRole) {
    if (!canApplyInPlaceAdminRoleSwitchOnStandaloneLms()) return false;
    const persona = persistAdminImpersonationRoleState(requestedRole);
    await refreshLmsUiAfterInPlaceRoleSwitch();
    return Boolean(persona || requestedRole);
}

async function restoreLmsReturnContextIfPresent() {
    let raw = '';
    try {
        raw = sessionStorage.getItem(KIU_LMS_RETURN_CONTEXT_KEY) || '';
        if (raw) sessionStorage.removeItem(KIU_LMS_RETURN_CONTEXT_KEY);
    } catch (error) {
        return false;
    }
    if (!raw) return false;

    let payload = null;
    try {
        payload = JSON.parse(raw);
    } catch (error) {
        return false;
    }

    const courseKey = String(payload?.courseKey || '').trim();
    if (!courseKey) return false;

    const sectionType = String(payload?.sectionType || 'lecture').trim() || 'lecture';
    if (typeof setLmsActiveSection === 'function') {
        setLmsActiveSection(sectionType);
    } else if (typeof currentLmsSectionType !== 'undefined') {
        currentLmsSectionType = sectionType;
    }

    const tab = String(payload?.tab || 'quiz').trim() || 'quiz';
    if (typeof window.ensureLmsExtendedRuntimeForTab === 'function') {
        await window.ensureLmsExtendedRuntimeForTab(tab);
    }

    if (typeof openLMSCourse === 'function') {
        openLMSCourse(courseKey, String(payload?.title || courseKey));
    }

    if (tab !== 'sessions' && typeof window.switchLMSTab === 'function') {
        window.switchLMSTab(tab, { force: true });
    }
    return true;
}

window.persistLmsReturnContextForRoleSwitch = persistLmsReturnContextForRoleSwitch;
window.restoreLmsReturnContextIfPresent = restoreLmsReturnContextIfPresent;
window.KIU_LMS_RETURN_CONTEXT_KEY = KIU_LMS_RETURN_CONTEXT_KEY;

function switchRole(newRole) {
    if (!currentUser && typeof loadAuthState === 'function') {
        try { loadAuthState(); } catch (error) {}
    }
    if (!currentUser) {
        alert('Sign in first to switch workspace context.');
        return;
    }
    if (currentUser.role !== USER_ROLES.ADMIN) {
        const pendingImpersonatedRole = (() => {
            try {
                return String(localStorage.getItem(PENDING_ROLE_SWITCH_KEY) || '').trim().toLowerCase();
            } catch (error) {
                return '';
            }
        })();
        const canRepairAdminSnapshot = Boolean(
            pendingImpersonatedRole
            && pendingImpersonatedRole !== USER_ROLES.ADMIN
            && Object.values(USER_ROLES).includes(pendingImpersonatedRole)
            && typeof getPortalSessionToken === 'function'
            && getPortalSessionToken()
            && typeof fetchPortalBackendSession === 'function'
            && typeof storePortalBackendAuth === 'function'
        );
        if (canRepairAdminSnapshot) {
            Promise.resolve(fetchPortalBackendSession())
                .then((payload) => {
                    if (!payload?.account || !payload?.session) return false;
                    storePortalBackendAuth(payload.account, payload.session);
                    if (typeof loadAuthState === 'function') loadAuthState();
                    if (currentUser?.role === USER_ROLES.ADMIN) {
                        switchRole(newRole);
                        return true;
                    }
                    return false;
                })
                .catch((error) => {
                    console.warn('Could not restore the authenticated admin context for role switching.', error);
                    return false;
                })
                .then((restored) => {
                    if (!restored) {
                        alert('Your admin view session needs to be refreshed. Please reopen the page and try again.');
                    }
                });
            return;
        }
        currentUserRole = currentUser.role || USER_ROLES.STUDENT;
        localStorage.setItem('currentUserRole', currentUserRole);
        sessionStorage.removeItem(ACTIVE_ROLE_IMPERSONATION_KEY);
        return;
    }

    const requestedRole = String(newRole || currentUser.role || USER_ROLES.STUDENT).trim().toLowerCase() || USER_ROLES.STUDENT;
    if (!Object.values(USER_ROLES).includes(requestedRole)) {
        alert('Unknown workspace view.');
        return;
    }
    if (typeof window.isStandaloneAdminWorkspaceEntry === 'function' && window.isStandaloneAdminWorkspaceEntry()) {
        const requestedStandaloneRole = String(newRole || currentUser.role || USER_ROLES.STUDENT).trim().toLowerCase() || USER_ROLES.STUDENT;
        if (requestedStandaloneRole !== USER_ROLES.ADMIN && !canApplyInPlaceAdminRoleSwitchOnStandaloneLms()) {
            alert('Open the main portal (Home) to switch to another role view. Faculty changes stay on this page.');
            return;
        }
    }
    void (async () => {
        let preferredFaculty = 'ECON';
        try {
            preferredFaculty = localStorage.getItem('currentFaculty') || currentUser?.facultyCode || currentUser?.faculty || 'ECON';
        } catch (error) {
            preferredFaculty = currentUser?.facultyCode || currentUser?.faculty || 'ECON';
        }
        if (typeof refreshImpersonationDirectoryFromBackend === 'function') {
            await refreshImpersonationDirectoryFromBackend(requestedRole, preferredFaculty);
        }
        if (!warnMissingImpersonationPersona(requestedRole)) return;
        if (canApplyInPlaceAdminRoleSwitchOnStandaloneLms()) {
            await syncPortalBackendImpersonationBeforeRedirect(requestedRole);
            if (await applyInPlaceAdminRoleSwitchOnStandaloneLms(requestedRole)) {
                return;
            }
        }
        if (typeof fastRedirectRoleSwitch === 'function' && await fastRedirectRoleSwitch(requestedRole)) {
            return;
        }
        await continueAdminRoleSwitch(requestedRole);
    })();
}

async function continueAdminRoleSwitch(requestedRole) {
    if (!currentUser || currentUser.role !== USER_ROLES.ADMIN) return;
    const activeUser = {
        ...currentUser,
        role: requestedRole
    };
    if (typeof closeLmsQuizOverlays === 'function') {
        try {
            closeLmsQuizOverlays();
        } catch (error) {
            console.warn('Could not close LMS quiz overlays before switching role.', error);
        }
    }
    try {
        if (requestedRole === USER_ROLES.ADMIN) {
            localStorage.removeItem(PENDING_ROLE_SWITCH_KEY);
        } else {
            localStorage.setItem(PENDING_ROLE_SWITCH_KEY, requestedRole);
        }
    } catch (error) {
        console.warn('Could not persist pending role switch target.', error);
    }

    try {
        sessionStorage.setItem(ACTIVE_ROLE_IMPERSONATION_KEY, String(currentUser?.role && currentUser.role !== activeUser.role ? '1' : '0'));
    } catch (e) {
        console.warn('Could not persist role impersonation state.', e);
    }
    currentUserRole = activeUser.role;
    localStorage.setItem('currentUserRole', activeUser.role);
    const impersonatedSessionUser = typeof setActiveSessionUserByRole === 'function'
        ? (setActiveSessionUserByRole(activeUser.role) || activeUser)
        : activeUser;
    await syncPortalBackendImpersonationBeforeRedirect(activeUser.role);
    const finalizeRoleSwitch = async () => {
        if (canApplyInPlaceAdminRoleSwitchOnStandaloneLms()) {
            await applyInPlaceAdminRoleSwitchOnStandaloneLms(activeUser.role);
            return;
        }
        persistLmsReturnContextForRoleSwitch();
        persistAdminImpersonationRoleState(activeUser.role, impersonatedSessionUser);
        const targetUrl = resolveRoleSwitchRedirectUrl(activeUser.role);
        try {
            if (activeUser.role === USER_ROLES.ADMIN) {
                localStorage.removeItem('KIU_FORCE_HOME_ON_ROLE_SWITCH');
            } else {
                localStorage.setItem('KIU_FORCE_HOME_ON_ROLE_SWITCH', '1');
            }
        } catch (error) {}
        window.__kiuRoleSwitchRedirectPending = true;
        window.location.assign(targetUrl);
    };
    await finalizeRoleSwitch();
}

async function fastRedirectRoleSwitch(requestedRole) {
    if (!currentUser || currentUser.role !== USER_ROLES.ADMIN) return false;
    const normalizedRole = String(requestedRole || USER_ROLES.STUDENT).trim().toLowerCase() || USER_ROLES.STUDENT;
    if (!Object.values(USER_ROLES).includes(normalizedRole)) return false;

    if (typeof teardownKiuRealtimeEventStream === 'function') {
        teardownKiuRealtimeEventStream();
    }

    if (typeof setActiveSessionUserByRole === 'function') {
        setActiveSessionUserByRole(normalizedRole);
    }
    await syncPortalBackendImpersonationBeforeRedirect(normalizedRole);

    if (canApplyInPlaceAdminRoleSwitchOnStandaloneLms()) {
        return applyInPlaceAdminRoleSwitchOnStandaloneLms(normalizedRole);
    }

    window.__kiuRoleSwitchRedirectPending = true;
    persistLmsReturnContextForRoleSwitch();
    persistAdminImpersonationRoleState(normalizedRole);
    try {
        if (normalizedRole === USER_ROLES.ADMIN) {
            localStorage.removeItem('KIU_FORCE_HOME_ON_ROLE_SWITCH');
        } else {
            localStorage.setItem('KIU_FORCE_HOME_ON_ROLE_SWITCH', '1');
        }
    } catch (error) {
        console.warn('Could not persist fast role switch state.', error);
    }

    window.location.assign(resolveRoleSwitchRedirectUrl(normalizedRole));
    return true;
}

if (typeof window.refreshSemesterDropdowns !== 'function') {
    window.refreshSemesterDropdowns = function refreshSemesterDropdownsFallback() {
        const configs = [
            { id: 'filter-curriculum-semester', includeAll: true, includeCustom: true, numberPrefix: 'Sem' },
            { id: 'admin-active-semester', includeCustom: true, numberPrefix: 'Semester' },
            { id: 'admin-tt-semester', includeCustom: true, numberPrefix: 'Sem' },
            { id: 'admin-generate-semester', includeCustom: true, numberPrefix: 'Sem' },
            { id: 'stu-reg-semester', includeCustom: true, numberPrefix: 'Semester' },
            { id: 'new-user-semester', includeCustom: true, numberPrefix: 'Semester' }
        ];

        if (typeof populateSemesterSelectOptions !== 'function') return;
        configs.forEach(cfg => {
            document.querySelectorAll(`#${cfg.id}`).forEach(selectEl => {
                populateSemesterSelectOptions(selectEl, cfg);
            });
        });
    };
}

function switchFacultyTheme(faculty, options = {}) {
    const onStandaloneAdminWorkspace = typeof window.isStandaloneAdminWorkspaceEntry === 'function'
        && window.isStandaloneAdminWorkspaceEntry();
    const forceReloadRequested = options.forceReload === true || options.hardReload === true;
    const forceReload = forceReloadRequested && !onStandaloneAdminWorkspace;
    const refreshDependentViews = !forceReload && options.refreshDependentViews !== false;
    const normalizedFaculty = normalizeFacultyCode(faculty, getCurrentFaculty());
    adminRegScopedFaculty = normalizedFaculty;
    localStorage.setItem('currentFaculty', normalizedFaculty);

    // Update faculty data attribute for dynamic background colors
    document.documentElement.setAttribute('data-faculty', normalizedFaculty);
    document.body.setAttribute('data-faculty', normalizedFaculty);
    const luxFacValue = document.getElementById('lux-faculty-picker-value');
    if (luxFacValue) luxFacValue.textContent = getFacultyLabel(normalizedFaculty);
    
    document.querySelectorAll('#lux-faculty-picker-panel .lux-picker-option').forEach(btn => {
        if (btn.dataset.facultyOption === normalizedFaculty) {
            btn.classList.add('is-active');
        } else {
            btn.classList.remove('is-active');
        }
    });

    const facultySelectEl = document.getElementById('faculty-select');
    if (facultySelectEl && facultySelectEl.value !== normalizedFaculty) {
        facultySelectEl.value = normalizedFaculty;
    }
    const fp = getFacultyProfile(normalizedFaculty);
    const primary = fp.color || getFacultyColor(normalizedFaculty);
    const nav = fp.navColor || primary;
    const hasCanonicalLuxuryPaletteOwner = typeof window.__kiuApplyResolvedPalette === 'function';

    // Keep legacy non-luxury pages working, but avoid duplicate palette writes
    // once the canonical luxury runtime is active.
    if (!hasCanonicalLuxuryPaletteOwner) {
        const root = document.documentElement;
        root.style.setProperty('--kiu-blue', primary);
        root.style.setProperty('--kiu-navy', nav);
    }
    applyFacultyLuxuryTheme(normalizedFaculty, fp);

    // Update the faculty context badge in admin header if present
    const ctxBadge = document.getElementById('admin-faculty-context');
    if (ctxBadge) {
        ctxBadge.textContent = getFacultyLabel(normalizedFaculty);
        ctxBadge.dataset.faculty = normalizedFaculty;
    }
    syncCurriculumFacultyBadge(normalizedFaculty);

    // Refresh add-subject faculty context even though the old faculty input was removed.
    if (
        document.getElementById('add-subject-faculty-badge') ||
        document.getElementById('new-subject-semesters') ||
        document.getElementById('new-subject-semester-lux-btn') ||
        document.getElementById('new-subject-code-preview')
    ) {
        updateSubjectCodePreview();
    }

    if (refreshDependentViews) {
        // PERFORMANCE: Only render if the page/element is currently visible
        // Skip rendering hidden pages to improve performance

        // If on admin CMS, refresh the curriculum table to show only this faculty
        if (document.getElementById('curriculum-table-body') || document.getElementById('curriculum-library-modules-root')) {
            const ff = document.getElementById('filter-curriculum-faculty');
            if (ff) ff.value = normalizedFaculty;
            if (typeof renderCurriculumTable === 'function') renderCurriculumTable();
        }
        if ((document.getElementById('student-educational-program-root') || document.getElementById('page-programs')) &&
            _isElementVisible(document.getElementById('page-programs'))) {
            if (typeof renderStudentEducationalProgramPage === 'function') renderStudentEducationalProgramPage();
        }

        // Re-render Admin Registration Structure CMS if on the page (faculty-scoped)
        if (document.getElementById('admin-reg-content-container') &&
            _isElementVisible(document.getElementById('page-admin-tools'))) {
            if (typeof flushAdminRegistrationStateSave === 'function') {
                flushAdminRegistrationStateSave();
            }
            if (typeof bindFacultyRegistrationCmsData === 'function') {
                bindFacultyRegistrationCmsData(normalizedFaculty);
            }
            if (typeof renderAdminRegistrationModules === 'function') renderAdminRegistrationModules(adminRegActiveTab || 'prog');
        }
        if (document.getElementById('admin-exams-root') &&
            _isElementVisible(document.getElementById('page-exams'))) {
            if (typeof renderAdminExamSection === 'function') renderAdminExamSection();
        }
        if (document.getElementById('admin-orders-root') &&
            _isElementVisible(document.getElementById('page-orders') || document.getElementById('admin-orders-root'))) {
            if (typeof renderAdminOrders === 'function') renderAdminOrders();
        }
        if ((document.getElementById('book-filter-search') || document.getElementById('book-title')) &&
            typeof renderAdminLibrary === 'function' &&
            _isElementVisible(document.querySelector('[id*="library"]') || document.getElementById('page-home'))) {
            renderAdminLibrary();
        }
        if (document.getElementById('admin-master-grid-container') &&
            typeof renderAdminMasterGrid === 'function' &&
            _isElementVisible(document.getElementById('page-admin-scheduler'))) {
            renderAdminMasterGrid();
        }
        if ((document.getElementById('page-orders') || document.getElementById('orders-inbox-root')) &&
            _isElementVisible(document.getElementById('page-orders') || document.getElementById('orders-inbox-root'))) {
            if (typeof renderOrdersInboxPage === 'function') renderOrdersInboxPage();
        }
        if ((document.getElementById('page-social') || document.getElementById('public-social-root')) &&
            _isElementVisible(document.getElementById('page-social') || document.getElementById('public-social-root'))) {
            if (typeof schedulePublicSocialRenderBoost === 'function') schedulePublicSocialRenderBoost();
        }
    }

    const schedulerFacultyFilter = document.getElementById('admin-tt-faculty');
    if (schedulerFacultyFilter && schedulerFacultyFilter.value !== normalizedFaculty) {
        schedulerFacultyFilter.value = normalizedFaculty;
    }

    const timetableFacultyFilter = document.getElementById('tt-filter-fac');
    const activeUser = getCurrentUser();
    if (timetableFacultyFilter && activeUser?.role === USER_ROLES.ADMIN) {
        timetableFacultyFilter.value = normalizedFaculty;
    }

    // Refresh staff page if open and visible
    if (refreshDependentViews && typeof renderStaffPage === 'function' && document.getElementById('staff-content') &&
        _isElementVisible(document.getElementById('staff-content'))) {
        renderStaffPage();
    }
    if (refreshDependentViews && typeof renderStudentsPage === 'function' && document.getElementById('students-content') &&
        _isElementVisible(document.getElementById('students-content'))) {
        renderStudentsPage();
    }

    if (forceReload) {
        const activeRole = typeof getEffectiveUserRole === 'function'
            ? getEffectiveUserRole()
            : (getCurrentUser()?.role || USER_ROLES.STUDENT);
        const homeTarget = typeof resolvePortalRouteUrl === 'function'
            ? resolvePortalRouteUrl('home', activeRole)
            : (typeof getRoleHomePage === 'function' ? getRoleHomePage(activeRole) : `index.html?view=${encodeURIComponent(activeRole)}#home`);
        try { localStorage.setItem('KIU_FORCE_HOME_ON_FACULTY_SWITCH', '1'); } catch (error) {}
        window.__kiuFacultySwitchRedirectPending = true;
        window.location.assign(homeTarget);
        return;
    }

    refreshShellIdentity();

    if (refreshDependentViews && typeof populateProfList === 'function' && document.getElementById('admin-tt-prof') &&
        _isElementVisible(document.getElementById('page-admin-scheduler'))) {
        populateProfList();
    }
    if (refreshDependentViews && typeof renderPalette === 'function' && document.getElementById('palette-list') &&
        _isElementVisible(document.getElementById('page-admin-scheduler'))) {
        renderPalette();
    }
    if (refreshDependentViews && typeof renderGrid === 'function' && document.getElementById('scheduler-grid') &&
        _isElementVisible(document.getElementById('page-admin-scheduler'))) {
        renderGrid();
    }
    if (refreshDependentViews && typeof renderTimetable === 'function' && document.getElementById('timetable-master-container') &&
        _isElementVisible(document.getElementById('page-timetable') || document.getElementById('timetable-master-container'))) {
        renderTimetable();
    }
    if (
        refreshDependentViews &&
        activeUser?.role === USER_ROLES.ADMIN &&
        (document.getElementById('page-admin-tools') || document.getElementById('page-home')) &&
        (_isElementVisible(document.getElementById('page-admin-tools')) || _isElementVisible(document.getElementById('page-home')))
    ) {
        const cmsContainer = document.getElementById('admin-reg-content-container');
        const skipFullAdminToolsRender = onStandaloneAdminWorkspace
            && cmsContainer
            && _isElementVisible(cmsContainer);
        if (!skipFullAdminToolsRender && typeof renderLuxuryAdminToolsPage === 'function') {
            renderLuxuryAdminToolsPage();
        }
        if (typeof onAdminDashboardLoad === 'function') {
            onAdminDashboardLoad();
        }
    }
}

function updateNavigationMenu(role) {
    // Top nav visibility can be refined here if there are specific nav-items
}

function syncRoleSwitcherOptions(roleSelect) {
    if (!roleSelect) return;
    if (!Array.from(roleSelect.options || []).some(option => option.value === USER_ROLES.STUDENT_SERVICE)) {
        roleSelect.insertAdjacentHTML('beforeend', `<option value="${USER_ROLES.STUDENT_SERVICE}">Student Service View</option>`);
    }
    const labels = {
        [USER_ROLES.STUDENT]: 'Student Portal',
        [USER_ROLES.PROFESSOR]: 'Professor View',
        [USER_ROLES.TA]: 'TA View',
        [USER_ROLES.STUDENT_SERVICE]: 'Student Service View',
        [USER_ROLES.ADMIN]: 'Admin View'
    };
    Array.from(roleSelect.options || []).forEach(option => {
        option.textContent = labels[option.value] || option.textContent;
        option.hidden = false;
        option.disabled = false;
    });
    roleSelect.title = 'Admin-only role impersonation. Actual permissions stay tied to the authenticated admin account.';
    roleSelect.disabled = false;
    const effectiveRole = getEffectiveUserRole() || currentUser?.role || USER_ROLES.STUDENT;
    roleSelect.value = effectiveRole;
}

function refreshShellIdentity() {
    const currentUser = getCurrentUser();
    const currentFaculty = getCurrentFaculty();
    const facultyProfile = getFacultyProfile(currentFaculty);
    if (!currentUser) return;
    const effectiveRole = getEffectiveUserRole();

    const greetingEl = document.querySelector('.header-greeting');
    const userNameEl = document.querySelector('.user-name');
    const userRoleEl = document.querySelector('.user-role');
    const avatarEl = document.querySelector('.user-avatar');
    const roleSelect = document.getElementById('role-switcher-select');

    const roleLabels = {
        [USER_ROLES.STUDENT]: 'Student Portal',
        [USER_ROLES.PROFESSOR]: 'Professor Workspace',
        [USER_ROLES.TA]: 'Teaching Assistant Workspace',
        [USER_ROLES.STUDENT_SERVICE]: 'Student Service Center',
        [USER_ROLES.ADMIN]: 'Administration Workspace'
    };

    syncRoleSwitcherOptions(roleSelect);

    if (greetingEl) {
        greetingEl.textContent = effectiveRole === USER_ROLES.ADMIN
            ? facultyProfile?.name ? `${facultyProfile.name} Admin Portal` : 'Administration Workspace'
            : `Welcome, ${currentUser.nameEn || currentUser.name || 'User'}`;
    }

    if (userNameEl) {
        userNameEl.textContent = currentUser.nameEn || currentUser.name || 'Portal User';
    }
    if (userRoleEl) {
        const facultyLabel = facultyProfile?.name || getFacultyLabel(currentFaculty);
        userRoleEl.textContent = `${roleLabels[currentUser.role] || 'University Portal'} - ${facultyLabel}`;
    }

    if (avatarEl) {
        const initialsSource = (currentUser.nameEn || currentUser.name || 'UP')
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part[0]?.toUpperCase() || '')
            .join('') || 'UP';
        avatarEl.textContent = initialsSource;
    }

    if (roleSelect && roleSelect.value !== effectiveRole) {
        roleSelect.value = effectiveRole;
    }

    const studentSemesterEl = document.getElementById('student-hero-semester');
    const studentRegistrationEl = document.getElementById('student-hero-registration');
    const facultyGroupsEl = document.getElementById('faculty-hero-groups');
    const facultySemesterEl = document.getElementById('faculty-hero-semester');
    const facultyRoleEl = document.getElementById('faculty-hero-role');
    const studentSemesterNumber = currentUser?.role === USER_ROLES.STUDENT && typeof getCurrentStudentSemesterNumber === 'function'
        ? getCurrentStudentSemesterNumber(currentUser)
        : (KIU_STATE.activeSemester || 1);

    if (studentSemesterEl) {
        studentSemesterEl.textContent = `S${studentSemesterNumber || 1}`;
    }
    if (studentRegistrationEl) {
        studentRegistrationEl.textContent = KIU_STATE.registrationOpen ? 'Open' : 'Closed';
    }
    if (typeof syncRegistrationHeaderInfo === 'function') {
        syncRegistrationHeaderInfo();
    }
    if (facultyGroupsEl) {
        const assignedGroups = Object.values(KIU_STATE.availableGroups || {}).flat().filter(group => {
            const userName = currentUser.name || currentUser.nameEn || '';
            return group.prof === userName || group.ta === userName;
        }).length;
        facultyGroupsEl.textContent = String(assignedGroups);
    }
    if (facultySemesterEl) {
        facultySemesterEl.textContent = `S${KIU_STATE.activeSemester || 1}`;
    }
    if (facultyRoleEl) {
        facultyRoleEl.textContent = currentUser.role === USER_ROLES.TA
            ? 'TA View'
            : currentUser.role === USER_ROLES.STUDENT_SERVICE
                ? 'Service Team'
                : 'Professor';
    }

    if (typeof refreshFacultyScheduleUI === 'function') {
        refreshFacultyScheduleUI();
    }
    if (typeof refreshStandalonePageContext === 'function') {
        refreshStandalonePageContext();
    }
    const shouldRenderHomeShell = typeof getActivePageId === 'function'
        ? getActivePageId() === 'home'
        : document.body?.classList?.contains('lux-route-home');
    if (shouldRenderHomeShell && typeof renderHomeShell === 'function') {
        renderHomeShell();
    } else if (typeof renderSharedQaRoleTestingCard === 'function') {
        renderSharedQaRoleTestingCard();
    }
}

// --- LMS SHARED UTILITIES ---
function cloneStoredFile(file) {
    if (!file) return null;
    return {
        id: file.id || `file_${Date.now()}`,
        name: file.name || 'download.bin',
        type: file.type || 'application/octet-stream',
        size: file.size || 0,
        dataUrl: file.dataUrl || '',
        storageKey: file.storageKey || '',
        storageBackend: file.storageBackend || (file.storageKey ? 'indexeddb' : (file.dataUrl ? 'inline' : '')),
        uploadedAt: file.uploadedAt || new Date().toISOString()
    };
}

// ============================================
// Colour & Motion Studio - Palette System
// ============================================

/**
 * Open the Colour & Motion Studio modal
 */
function openStudio() {
    try {
        if (typeof window.openStudio === 'function' && window.openStudio !== openStudio) {
            window.openStudio();
            return;
        }
        const modalOverlay = document.getElementById('modal-overlay');
        const modalStudio = document.getElementById('modal-studio');
        if (modalOverlay && modalStudio) {
            modalOverlay.classList.add('active');
            modalStudio.style.display = 'flex';
            if (typeof queueLuxuryTransparencyRefresh === 'function') {
                const scheduleRefresh = typeof window.requestAnimationFrame === 'function'
                    ? window.requestAnimationFrame.bind(window)
                    : (cb) => window.setTimeout(cb, 0);
                scheduleRefresh(() => queueLuxuryTransparencyRefresh(window.__currentTransparency || 0));
            }
        }
    } catch (e) {
        console.warn('Error opening studio:', e);
    }
}

/**
 * Apply a color palette background
 * @param {string} palette - Palette name: obsidian-amber, slate-sapphire, pine-jade, burgundy-rose, sand-pearl, ink-orchid
 * NOTE: Background is now handled by CSS classes - inline styles removed
 */
function applyPalette(palette) {
    const paletteKey = String(palette || '').trim();
    if (typeof window.applyPaletteKey === 'function' && window.applyPaletteKey !== applyPalette) {
        if (paletteKey) {
            window.applyPaletteKey(paletteKey, true);
            if (typeof window.syncVisualStateOnly === 'function') {
                window.syncVisualStateOnly();
            }
        }
        if (typeof closeAllModals === 'function') closeAllModals({});
        return;
    }

    // Remove all existing palette classes
    const paletteList = ['obsidian-amber', 'slate-sapphire', 'pine-jade', 'burgundy-rose', 'sand-pearl', 'ink-orchid', 'ocean-teal'];
    paletteList.forEach(p => {
        document.body.classList.remove(`palette-${p}`);
    });

    // Add new palette class - CSS handles background now
    if (palette && palette.trim() && paletteList.includes(palette)) {
        document.body.classList.add(`palette-${palette}`);
        localStorage.setItem('kiu-palette', palette);
    }

    queueLuxuryTransparencyRefresh();

    // Close the modal after applying
    if (typeof closeAllModals === 'function') closeAllModals({});
}

/**
 * Set interface mode (dark or light)
 * @param {string} mode - 'dark' or 'light'
 */
function setInterfaceMode(mode) {
    const nextMode = mode === 'light' ? 'light' : 'dark';
    if (typeof window.applyThemeMode === 'function' && window.applyThemeMode !== setInterfaceMode) {
        window.applyThemeMode(nextMode, true);
        localStorage.setItem('kiu-interface-mode', nextMode);
        localStorage.removeItem('kiuLuxuryLightMode');
        if (typeof window.syncVisualStateOnly === 'function') {
            window.syncVisualStateOnly();
        }
        return nextMode;
    }

    if (nextMode === 'dark') {
        document.body.classList.remove('lux-light-mode');
    } else if (nextMode === 'light') {
        document.body.classList.add('lux-light-mode');
    }
    localStorage.setItem('kiu-interface-mode', nextMode);

    // Reapply current palette with new mode
    const currentPalette = localStorage.getItem('kiu-palette');
    if (currentPalette) {
        applyPalette(currentPalette);
    }

    // Re-apply transparency so inline backgrounds recalculate for the new mode
    const saved = localStorage.getItem('kiuLuxurySurfaceTransparency') || '13';
    refreshLuxuryTransparencySurfaces(parseInt(saved, 10));
    return nextMode;
}

function toggleLuxuryInterfaceMode() {
    const currentMode = document.documentElement?.dataset?.luxThemeMode === 'light'
        || document.body.classList.contains('lux-light-mode')
        ? 'light'
        : 'dark';
    return setInterfaceMode(currentMode === 'light' ? 'dark' : 'light');
}

function setBackground(background) {
    const nextBackground = String(background || '').trim().toLowerCase();
    if (typeof window.setBackgroundMode === 'function') {
        window.setBackgroundMode(nextBackground, true);
        if (typeof window.syncVisualStateOnly === 'function') {
            window.syncVisualStateOnly();
        }
        if (typeof closeAllModals === 'function') closeAllModals({});
        return nextBackground;
    }
    return nextBackground;
}

function updateCustomColor() {
    const hue = parseInt(document.getElementById('hue-slider')?.value || '156', 10);
    const saturation = parseInt(document.getElementById('sat-slider')?.value || '72', 10);
    const lightness = parseInt(document.getElementById('light-slider')?.value || '34', 10);
    const display = document.getElementById('hsl-display');
    if (display) {
        display.textContent = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        display.style.background = `linear-gradient(135deg, hsl(${hue}, ${saturation}%, ${lightness}%), hsl(${(hue + 24) % 360}, ${saturation}%, ${Math.min(lightness + 12, 80)}%))`;
    }
    return { hue, saturation, lightness };
}

function applyCustomColor() {
    const { hue, saturation, lightness } = updateCustomColor();
    const accent = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    const accent2 = `hsl(${(hue + 24) % 360}, ${saturation}%, ${Math.min(lightness + 12, 80)}%)`;
    if (typeof window.setStudioMixerState === 'function') {
        window.setStudioMixerState({
            hA: hue,
            sA: saturation,
            lA: lightness,
            hB: (hue + 24) % 360,
            sB: saturation,
            lB: Math.min(lightness + 12, 80),
            ratio: 50
        }, true);
    }
    if (typeof window.applyCustomPalette === 'function') {
        window.applyCustomPalette(accent, accent2, true);
        if (typeof window.syncVisualStateOnly === 'function') {
            window.syncVisualStateOnly();
        }
        if (typeof closeAllModals === 'function') closeAllModals({});
        return;
    }
    applyPalette('custom');
}

/**
 * Update and apply panel transparency based on slider value
 * @param {string|number} value - Opacity percentage (0-100)
 */
const LUX_MODERN_TRANSPARENCY_SURFACE_SELECTORS = [
    '.lux-modern-surface',
    '.lux-modern-table'
];

const SOCIAL_NEO_TRANSPARENCY_SURFACE_SELECTORS = [
    '.social-neo-card',
    '.social-neo-alert',
    '.social-neo-topbar-card',
    '.social-neo-sidebar-card',
    '.social-neo-post-card',
    '.social-neo-composer-card',
    '.social-neo-filter-card',
    '.social-neo-story-card',
    '.social-neo-community-panel',
    '.social-neo-chat-item',
    '.social-neo-directory-item',
    '.social-neo-entity-card',
    '.social-neo-event-card',
    '.social-neo-message',
    '.social-neo-empty',
    '.social-neo-empty-hero',
    '.social-neo-flash',
    '.social-neo-comment-bubble',
    '.social-neo-time-group',
    '.social-neo-stat-grid > div',
    '.social-neo-section-command',
    '.social-neo-section-metric',
    '.social-neo-section-task',
    '.social-neo-events-hero',
    '.social-neo-events-hero-stat',
    '.social-neo-events-lane',
    '.social-neo-events-banner',
    '.social-neo-events-list-card',
    '.social-neo-events-create-card',
    '.social-neo-events-manage-card',
    '.social-neo-events-manage-item',
    '.social-neo-events-support-card',
    '.social-neo-event-date-group',
    '.social-neo-event-feature',
    '.social-neo-event-feature-meta-item',
    '.social-neo-group-card',
    '.social-neo-group-create-block',
    '.social-neo-group-create-picker',
    '.social-neo-group-member-row',
    '.social-neo-group-thread-panel',
    '.social-neo-group-thread-section',
    '.social-neo-pages-hero',
    '.social-neo-pages-wizard',
    '.social-neo-pages-wizard-step',
    '.social-neo-pages-hero-stats > article',
    '.social-neo-page-card',
    '.social-neo-page-card-rich',
    '.social-neo-page-card-support',
    '.social-neo-page-compose-block',
    '.social-neo-page-profile',
    '.social-neo-page-about-card',
    '.social-neo-thread-head',
    '.social-neo-thread-compose',
    '.social-neo-thread-messages',
    '.social-neo-thread-group-hero',
    '.social-neo-call-card',
    '.social-neo-call-stage',
    '.social-neo-call-video',
    '.social-neo-dialog-card',
    '.social-neo-dialog-preview',
    '.social-neo-toast',
    '.social-neo-mobile-tabbar',
    '.social-neo-mobile-tab',
    '.social-neo-shell-drawer',
    '.social-neo-shell-drawer-profile',
    '.social-neo-shell-drawer-nav-card',
    '.social-projects-hero',
    '.social-projects-hero-rich',
    '.social-project-create-card',
    '.social-project-card',
    '.social-project-metric-card',
    '.social-project-detail-hero',
    '.social-project-detail-hero-rich',
    '.social-project-tab-shell',
    '.social-project-inline-panel',
    '.social-project-chart-card',
    '.social-project-rich-panel',
    '.social-project-deliverable-card',
    '.social-project-checkin-card',
    '.social-project-meeting-card',
    '.social-project-mini-card',
    '.social-project-ring-card',
    '.social-project-activity-item',
    '.social-project-milestone-item',
    '.social-project-task-column',
    '.social-project-task-card',
    '.social-project-team-card',
    '.social-portfolio-hero',
    '.social-portfolio-toolbar',
    '.social-portfolio-card',
    '.social-portfolio-mini-card',
    '.social-portfolio-stat-tile',
    '.social-portfolio-compose-shell',
    '.social-portfolio-compose-preview-card',
    '.social-portfolio-audience-panel',
    '.social-portfolio-link'
];
const SOCIAL_NEO_TRANSPARENCY_SURFACE_CLASSES = SOCIAL_NEO_TRANSPARENCY_SURFACE_SELECTORS
    .filter((selector) => selector.charAt(0) === '.' && !/[ >:+~#\[]/.test(selector))
    .map((selector) => selector.slice(1));
const SOCIAL_NEO_SMALL_TRANSPARENCY_SURFACE_CLASSES = [
    'social-mini-card',
    'social-comment-card',
    'social-notif-item',
    'social-story-card',
    'social-file-preview',
    'social-neo-chat-item',
    'social-neo-directory-item',
    'social-neo-entity-card',
    'social-neo-event-card',
    'social-neo-message',
    'social-neo-comment-bubble',
    'social-neo-time-group',
    'social-neo-section-metric',
    'social-neo-section-task',
    'social-neo-events-hero-stat',
    'social-neo-events-manage-item',
    'social-neo-event-date-group',
    'social-neo-event-feature-meta-item',
    'social-neo-group-member-row',
    'social-neo-pages-wizard-step',
    'social-neo-page-card',
    'social-project-metric-card',
    'social-project-mini-card',
    'social-project-activity-item',
    'social-project-milestone-item',
    'social-project-task-card',
    'social-project-team-card',
    'social-portfolio-mini-card',
    'social-portfolio-stat-tile',
    'social-portfolio-link'
];

const STAFF_ROUTE_TRANSPARENCY_SURFACE_SELECTORS = [
    '.staff-hub-hero',
    '.staff-hub-command-panel',
    '.staff-hub-command-card',
    '.staff-hub-focus-card',
    '.staff-hub-mini-card',
    '.staff-hub-metric-card',
    '.staff-hub-controls',
    '.staff-hub-directory-panel',
    '.staff-hub-profile',
    '.staff-hub-info-card',
    '.staff-hub-warning',
    '.staff-hub-modal',
    '.staff-hub-list-item',
    '.admin-directory-hero',
    '.admin-directory-controls',
    '.admin-directory-card'
];

const STAFF_ROUTE_SMALL_TRANSPARENCY_SURFACE_CLASSES = [
    'staff-hub-metric-card',
    'staff-hub-command-card',
    'staff-hub-info-card',
    'staff-hub-warning',
    'staff-hub-list-item',
    'staff-hub-mini-card',
    'staff-hub-focus-card',
    'lux-data-card',
    'lux-subcard',
    'lux-person-head',
    'lux-inline-meta'
];

const STUDENTS_ADMIN_ROUTE_TRANSPARENCY_SURFACE_SELECTORS = [
    '.students-lms-hero',
    '.students-lms-profile-header',
    '.students-lms-panel',
    '.students-lms-stat-card',
    '.students-lms-profile-card',
    '.students-lms-table-shell',
    '.students-lms-list-item',
    '.students-lms-modal-card'
];

const STUDENTS_ADMIN_ROUTE_SMALL_TRANSPARENCY_SURFACE_CLASSES = [
    'students-lms-stat-card',
    'students-lms-profile-card',
    'students-lms-list-item'
];

const SOCIAL_BLUR_HOST_CLASSES = new Set([
    'social-neo-card',
    'social-neo-post-card',
    'social-neo-topbar-card',
    'social-neo-community-panel',
    'social-neo-group-card',
    'social-neo-group-thread-panel',
    'social-neo-page-card-rich',
    'social-neo-events-lane',
    'social-neo-events-support-card',
    'social-neo-event-feature',
    'social-neo-dialog-card',
    'social-neo-shell-drawer',
    'social-neo-story-composer-card',
    'social-neo-call-card',
    'social-neo-empty',
    'social-card',
    'social-post-card',
    'social-detail-card',
    'social-hero',
    'social-project-detail-hero-rich',
    'social-project-tab-shell',
    'social-project-rich-panel',
    'social-project-card',
    'social-portfolio-card'
]);

function isSocialBlurHost(el) {
    if (!el?.classList) return false;
    for (const className of el.classList) {
        if (SOCIAL_BLUR_HOST_CLASSES.has(className)) return true;
    }
    return false;
}

// A "paint surface" is a real social card/panel/box (from the curated surface
// list) — as opposed to a layout wrapper (social-neo-shell / -center / region
// containers / stat grids). Only paint surfaces receive the admin-tools glass
// recipe + blur; wrappers stay on their flat CSS background so glass never stacks.
function isSocialPaintSurface(el) {
    if (!el?.classList) return false;
    if (SOCIAL_NEO_TRANSPARENCY_SURFACE_CLASSES.some((className) => el.classList.contains(className))) {
        return true;
    }
    return (
        el.classList.contains('social-hero') ||
        el.classList.contains('social-card') ||
        el.classList.contains('social-post-card') ||
        el.classList.contains('social-mini-card') ||
        el.classList.contains('social-detail-card') ||
        el.classList.contains('social-neo-card')
    );
}

function shouldKeepSocialFadeCssBackground(el) {
    if (!document.body.classList.contains('lux-route-social')) return false;
    if (!el?.classList) return false;
    // Curated social surfaces are painted with the admin-tools glass recipe;
    // everything else inside the shell (layout wrappers) keeps its flat CSS bg.
    if (isSocialPaintSurface(el)) return false;
    return Boolean(el.closest?.('#page-social'));
}

function shouldKeepAdminLibraryFadeCssBackground(_el) {
    return false;
}

function buildHomeStyleSurfaceBackground(lightMode, amount) {
    if (lightMode) {
        return `radial-gradient(circle at 6% 0%, rgba(255,255,255, ${(amount * 0.88).toFixed(2)}), transparent 34%), radial-gradient(circle at 74% 0%, rgba(var(--lux-accent-rgb), ${(amount * 0.24).toFixed(2)}), transparent 42%), radial-gradient(circle at 100% 96%, rgba(var(--lux-home-secondary-rgb), ${(amount * 0.14).toFixed(2)}), transparent 40%), linear-gradient(135deg, rgba(var(--lux-accent-rgb), ${(amount * 0.065).toFixed(2)}), rgba(255,255,255, ${(amount * 0.84).toFixed(2)}) 44%, rgba(247,241,232, ${(amount * 0.70).toFixed(2)}))`;
    }
    return `radial-gradient(circle at 6% 0%, rgba(255,255,255, ${(amount * 0.08).toFixed(2)}), transparent 32%), radial-gradient(circle at 74% 0%, rgba(var(--lux-accent-rgb), ${(amount * 0.28).toFixed(2)}), transparent 42%), radial-gradient(circle at 100% 96%, rgba(var(--lux-home-secondary-rgb), ${(amount * 0.18).toFixed(2)}), transparent 40%), linear-gradient(135deg, rgba(var(--lux-accent-rgb), ${(amount * 0.10).toFixed(2)}), rgba(10,15,24, ${(amount * 0.89).toFixed(2)}) 44%, rgba(7,10,18, ${(amount * 0.80).toFixed(2)}))`;
}

function buildLuxuryRoutePanelGradient(lightMode, isSmallSurface) {
    if (lightMode) {
        if (isSmallSurface) {
            return 'radial-gradient(circle at 8% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .88) * .88)), transparent 34%), ' +
                'radial-gradient(circle at 72% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .88) * .16)), transparent 38%), ' +
                'radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), calc(var(--lux-color-fade-alpha, .88) * .13)), transparent 38%), ' +
                'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .88) * .075)), rgba(255,255,255, calc(var(--lux-transparency-alpha, .88) * .88)) 44%, rgba(247,241,232, calc(var(--lux-transparency-alpha, .88) * .72)))';
        }
        return 'radial-gradient(circle at 8% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .88) * .88)), transparent 34%), ' +
            'radial-gradient(circle at 72% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .88) * .20)), transparent 38%), ' +
            'radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), calc(var(--lux-color-fade-alpha, .88) * .13)), transparent 38%), ' +
            'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .88) * .075)), rgba(255,255,255, calc(var(--lux-transparency-alpha, .88) * .88)) 44%, rgba(247,241,232, calc(var(--lux-transparency-alpha, .88) * .72)))';
    }
    if (isSmallSurface) {
        return 'radial-gradient(circle at 8% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .92) * .075)), transparent 32%), ' +
            'radial-gradient(circle at 72% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .16)), transparent 38%), ' +
            'radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), calc(var(--lux-color-fade-alpha, .92) * .14)), transparent 38%), ' +
            'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .10)), rgba(10,15,24, calc(var(--lux-transparency-alpha, .92) * .91)) 44%, rgba(7,10,18, calc(var(--lux-transparency-alpha, .92) * .84)))';
    }
    return 'radial-gradient(circle at 8% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .92) * .075)), transparent 32%), ' +
        'radial-gradient(circle at 72% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .24)), transparent 38%), ' +
        'radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), calc(var(--lux-color-fade-alpha, .92) * .14)), transparent 38%), ' +
        'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .10)), rgba(10,15,24, calc(var(--lux-transparency-alpha, .92) * .91)) 44%, rgba(7,10,18, calc(var(--lux-transparency-alpha, .92) * .84)))';
}

// Mirrors --staff-fade-control token in staff-command-center.css.
// Panels and cards now share the students-admin painter (buildLuxuryRoutePanelGradient).
function buildStaffFadeBackground(lightMode, tier) {
    if (tier === 'control') {
        if (lightMode) {
            return 'linear-gradient(180deg, rgba(255,255,255, 0.82), rgba(248,244,237, 0.62)), ' +
                'radial-gradient(circle at top right, rgba(var(--lux-accent-rgb), 0.10), transparent 32%)';
        }
        return 'linear-gradient(180deg, rgba(255,255,255, calc(0.04 + var(--lux-glass-alpha, .06))), rgba(255,255,255, 0.02)), ' +
            'radial-gradient(circle at top right, rgba(var(--lux-accent-rgb), 0.10), transparent 32%)';
    }
    return buildLuxuryRoutePanelGradient(lightMode, false);
}

const STAFF_ROUTE_CONTROL_TRANSPARENCY_SURFACE_CLASSES = [
    'staff-hub-control',
    'lux-control',
    'staff-hub-tab',
    'lux-tab-btn',
    'lux-picker-btn',
    'staff-hub-command-badge'
];

const SHARED_TRANSPARENCY_OBSERVER_SELECTORS = [
    '.lux-card', '.lux-panel', '.lux-person-card', '.lux-subcard',
    '.lux-hero', '.lux-stack', '.lux-dashboard-section',
    '.lux-grid-widget', '.lux-home-card', '.lux-admin-ops-card',
    '.lux-builder-card', '.lux-builder-section', '.surface-card',
    '.content-box', '.kiu-card', '.page-card', '.section-card',
    '.panel-card', '.dashboard-card', '.tabs-container',
    '.modal-content', '.page-hero', '.lux-person-head',
    '.lux-inline-meta', '.lux-card-actions', '.lux-card-head',
    '.lux-card-body', '.lux-panel-body',
    '.lux-page-shell', '.lux-stat-card', '.lux-stat',
    '.lux-page-kicker', '.lux-status-pill', '.lux-control',
    '.lux-faculty-command', '.lux-faculty-command-head', '.lux-faculty-command-grid',
    '.lux-faculty-insight', '.lux-faculty-insight-grid', '.lux-faculty-insight-label',
    '.lux-faculty-insight-value', '.lux-faculty-insight-list',
    '.lux-faculty-stage', '.lux-faculty-stage-head', '.lux-faculty-hero-focus',
    '.lux-faculty-hero-main', '.lux-faculty-hero-top', '.lux-faculty-filters',
    '.lux-faculty-controls', '.lux-faculty-controls-row', '.lux-faculty-overview-row',
    '.lux-faculty-filter-title',
    '.schedule-chip', '.schedule-view-switcher', '.schedule-week-arrow',
    '.schedule-toolbar-host', '.schedule-toolbar', '.schedule-week-nav',
    '.schedule-overview-row', '.schedule-view-row',
    '.lms-clean-stat', '.lms-clean-signal-panel', '.lms-clean-mini',
    '.lms-clean-metric-card', '.lms-clean-subject-card',
    ...LUX_MODERN_TRANSPARENCY_SURFACE_SELECTORS,
    ...SOCIAL_NEO_TRANSPARENCY_SURFACE_SELECTORS
];
const SHARED_TRANSPARENCY_OBSERVER_SELECTOR = SHARED_TRANSPARENCY_OBSERVER_SELECTORS.join(', ');
const INDEX_TRANSPARENCY_GLOBAL_ROOT_SELECTORS = [
    '#lux-shell',
    '#lux-topbar',
    '#mobile-bottom-nav',
    '#mobile-action-sheet',
    '#modal-overlay',
    '.lux-studio-backdrop',
    '.lux-picker-panel'
];

function normalizeTransparencyRoots(roots) {
    if (!Array.isArray(roots)) return [];
    return roots.filter((root) => root && typeof root.querySelectorAll === 'function');
}

const LUX_TRANSPARENCY_SELECTOR_CACHE = typeof WeakMap === 'function' ? new WeakMap() : null;
const LUX_TRANSPARENCY_SURFACE_CACHE = {
    signature: '',
    elements: []
};

function resetTransparencySurfaceCache() {
    LUX_TRANSPARENCY_SURFACE_CACHE.signature = '';
    LUX_TRANSPARENCY_SURFACE_CACHE.elements = [];
}

function buildTransparencyRootSignature() {
    const activePage = document.querySelector('.page-section.active-page');
    const modalOverlay = document.getElementById('modal-overlay');
    const mobileSheet = document.getElementById('mobile-action-sheet');
    const mobileNav = document.getElementById('mobile-bottom-nav');
    const studio = document.querySelector('.lux-studio-backdrop');
    return [
        activePage?.id || 'no-page',
        modalOverlay?.classList.contains('active') ? 'modal-on' : 'modal-off',
        mobileSheet && !mobileSheet.hidden && mobileSheet.style.display !== 'none' ? 'sheet-on' : 'sheet-off',
        mobileNav && !mobileNav.hidden && mobileNav.style.display !== 'none' ? 'nav-on' : 'nav-off',
        studio?.classList.contains('is-open') ? 'studio-on' : 'studio-off',
        document.body?.dataset?.luxPage || '',
        document.body?.dataset?.luxEntry || ''
    ].join('|');
}

function collectTransparencySurfaceElements(selectorList, rootsOverride) {
    let selector = '';
    if (Array.isArray(selectorList)) {
        selector = LUX_TRANSPARENCY_SELECTOR_CACHE?.get(selectorList) || '';
        if (!selector) {
            selector = selectorList.join(', ');
            LUX_TRANSPARENCY_SELECTOR_CACHE?.set(selectorList, selector);
        }
    } else {
        selector = String(selectorList || '').trim();
    }
    if (!selector) return [];

    const explicitRoots = normalizeTransparencyRoots(rootsOverride);
    if (explicitRoots.length) {
        const elements = new Set();
        explicitRoots.forEach((root) => {
            if (!root || typeof root.querySelectorAll !== 'function') return;
            if (typeof root.matches === 'function' && root.matches(selector)) {
                elements.add(root);
            }
            root.querySelectorAll(selector).forEach((el) => elements.add(el));
        });
        return Array.from(elements);
    }

    if (!document.querySelector('.page-section')) {
        return Array.from(document.querySelectorAll(selector));
    }

    const roots = new Set();
    const activePage = document.querySelector('.page-section.active-page');
    if (activePage) roots.add(activePage);

    INDEX_TRANSPARENCY_GLOBAL_ROOT_SELECTORS.forEach((rootSelector) => {
        document.querySelectorAll(rootSelector).forEach((root) => {
            if (!root) return;
            if (
                root.id === 'modal-overlay'
                && !root.classList.contains('active')
                && root.style.display !== 'flex'
                && root.style.display !== 'block'
            ) {
                return;
            }
            if (root.id === 'mobile-action-sheet' && (root.hidden || root.style.display === 'none')) return;
            if (root.id === 'mobile-bottom-nav' && (root.hidden || root.style.display === 'none')) return;
            roots.add(root);
        });
    });

    if (!roots.size) {
        return Array.from(document.querySelectorAll(selector));
    }

    const elements = new Set();
    roots.forEach((root) => {
        if (!root || typeof root.querySelectorAll !== 'function') return;
        if (typeof root.matches === 'function' && root.matches(selector)) {
            elements.add(root);
        }
        root.querySelectorAll(selector).forEach((el) => elements.add(el));
    });

    return Array.from(elements);
}

function getCachedTransparencySurfaceElements(selectorList, rootsOverride) {
    const explicitRoots = normalizeTransparencyRoots(rootsOverride);
    if (explicitRoots.length) {
        return collectTransparencySurfaceElements(selectorList, explicitRoots);
    }

    const signature = buildTransparencyRootSignature();
    if (LUX_TRANSPARENCY_SURFACE_CACHE.signature === signature && LUX_TRANSPARENCY_SURFACE_CACHE.elements.length) {
        LUX_TRANSPARENCY_SURFACE_CACHE.elements = LUX_TRANSPARENCY_SURFACE_CACHE.elements.filter((el) => el && el.isConnected);
        return LUX_TRANSPARENCY_SURFACE_CACHE.elements;
    }

    const elements = collectTransparencySurfaceElements(selectorList);
    LUX_TRANSPARENCY_SURFACE_CACHE.signature = signature;
    LUX_TRANSPARENCY_SURFACE_CACHE.elements = elements.filter((el) => el && el.isConnected);
    return LUX_TRANSPARENCY_SURFACE_CACHE.elements;
}

const HIGH_TRANSPARENCY_TEXT_RESET_SELECTORS = [
    '.lux-card-head',
    '.lux-card-title',
    '.lux-card-meta',
    '.lux-builder-copy',
    '.lux-card-body',
    '.lux-panel-body',
    '.lux-grid-widget-body',
    '.lux-widget-container',
    '.lux-inline-meta',
    '.lux-card-actions',
    '.lux-page-kicker',
    '.lux-person-head',
    '.lux-admin-ops-head',
    '[class*="-head"]',
    '[class*="-meta"]',
    '[class*="-title"]',
    '[class*="-copy"]',
    '[class*="-label"]',
    '[class*="-kicker"]'
];

const HIGH_TRANSPARENCY_SURFACE_SELECTORS = [
    '.lux-card',
    '.lux-panel',
    '.lux-subcard',
    '.lux-hero',
    '.lux-stat',
    '.lux-stat-card',
    '.lux-home-card',
    '.lux-grid-widget',
    '.lux-admin-ops-card',
    '.lux-builder-card',
    '.lux-builder-section',
    '.lux-dashboard-section',
    '.lux-page-shell',
    '.surface-card',
    '.content-box',
    '.kiu-card',
    '.page-card',
    '.section-card',
    '.panel-card',
    '.dashboard-card',
    '.tabs-container',
    '.modal-content',
    '.page-hero',
    '.lux-modern-surface',
    '.lux-modern-table',
    '.lux-utility-panel',
    '.lux-person-card',
    '.lux-stack',
    '.registration-hero',
    '.registration-workspace',
    '.registration-insight-card',
    '.registration-focus-card',
    '.registration-state-card',
    '.registration-module-list-card',
    '.registration-module-pane-card',
    '.registration-track-card',
    '.registration-footer-bar',
    '.registration-mini-metric',
    '.registration-course-row',
    '.registration-module-choice',
    '.registration-track-group',
    '#page-admin-scheduler .sch-rail-hero',
    '#page-admin-scheduler .sch-rail-section',
    '#page-admin-scheduler .sch-grid-shell',
    '#page-admin-scheduler .sch-modal',
    '#page-admin-scheduler .palette-card',
    '#page-admin-scheduler .sch-stat-card',
    '#page-admin-scheduler .sch-grid-tag',
    '#page-admin-scheduler .sch-legend-pill',
    '#page-admin-scheduler .sch-empty-state',
    '#page-admin-scheduler .sch-grid-empty',
    '.lms-clean-stat',
    '.lms-clean-signal-panel',
    '.lms-clean-mini',
    '.lms-clean-metric-card',
    '.lms-clean-subject-card',
    '.lms-clean-empty',
    '.lms-banner',
    '.lux-lms-group-card',
    '.lms-route-panel',
    '.lms-clean-summary',
    '.lms-route-hero',
    '.lms-clean-hero',
    '.lms-clean-subview-hero',
    '.portal-msg-page-top',
    '.portal-msg-panel',
    '.portal-msg-group-modal',
    '.admin-hero',
    '.adlib-hero'
];

function buildHighTransparencyScopedSelectors(bodySelector, selectors) {
    return selectors.map((selector) =>
        `html.lux-high-transparency.lux-high-transparency.lux-high-transparency ${bodySelector} ${selector}`
    ).join(',');
}

function buildHighTransparencyTextResetCss(bodySelector) {
    return `${buildHighTransparencyScopedSelectors(bodySelector, HIGH_TRANSPARENCY_TEXT_RESET_SELECTORS)}{` +
        'background:transparent!important;' +
        'background-image:none!important;' +
        'box-shadow:none!important;' +
        'backdrop-filter:none!important;' +
        '-webkit-backdrop-filter:none!important;' +
    '}';
}

function buildHighTransparencySurfaceCss(bodySelector, backgroundValue) {
    return `${buildHighTransparencyScopedSelectors(bodySelector, HIGH_TRANSPARENCY_SURFACE_SELECTORS)}{` +
        `background:${backgroundValue}!important;` +
    '}';
}

function buildStudentsAdminHighTransparencyCss() {
    return '';
}

function applyStudentsAdminManagedSurface(el, percentage, signature) {
    return false;
}

function applyStudentsAdminSurfaceFades(percentage) {
    return;
}

window.applyStudentsAdminSurfaceFades = applyStudentsAdminSurfaceFades;

function clampLuxuryTransparencyPercentage(value, fallback = 70) {
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(0, Math.min(100, parsed));
}

function mapLuxuryTransparencyFillRatio(value) {
    const percentage = clampLuxuryTransparencyPercentage(value, 0);
    return (percentage + 1) / 101;
}

function buildLuxuryTransparencyModel(value, lightMode = false) {
    if (typeof window.__kiuBuildLuxuryTransparencyModel === 'function') {
        return window.__kiuBuildLuxuryTransparencyModel(value, lightMode);
    }
    const percentage = clampLuxuryTransparencyPercentage(value);
    const fillRatio = mapLuxuryTransparencyFillRatio(percentage);
    const transparencyRatio = fillRatio;
    const colorFadeRatio = Math.max(0.01, Math.min(1, fillRatio * 0.92));
    return {
        percentage,
        transparencyRatio,
        fillRatio,
        colorFadeRatio,
        panelAlpha: lightMode
            ? Math.max(0.12, 0.12 + (fillRatio * 0.83))
            : Math.max(0.08, 0.08 + (fillRatio * 0.84)),
        raisedAlpha: lightMode
            ? 0.03 + (fillRatio * 0.16)
            : 0.02 + (fillRatio * 0.14),
        glassAlpha: lightMode
            ? 0.02 + (fillRatio * 0.10)
            : 0.015 + (fillRatio * 0.08),
        panelFillAlpha: lightMode
            ? 0.04 + (fillRatio * 0.20)
            : 0.03 + (fillRatio * 0.16),
        raisedFillAlpha: lightMode
            ? 0.02 + (fillRatio * 0.14)
            : 0.015 + (fillRatio * 0.12),
        utilityFillAlpha: lightMode
            ? 0.05 + (fillRatio * 0.22)
            : 0.04 + (fillRatio * 0.18),
        utilityAlpha: lightMode
            ? 0.18 + (fillRatio * 0.66)
            : 0.16 + (fillRatio * 0.70),
        topbarFillAlpha: lightMode
            ? 0.16 + (fillRatio * 0.62)
            : 0.14 + (fillRatio * 0.72),
        topbarRaisedAlpha: 0.04 + (fillRatio * 0.16),
        glassHighlightAlpha: lightMode
            ? 0.01 + (fillRatio * 0.04)
            : 0.006 + (fillRatio * 0.02),
        highTransparency: percentage <= 20
    };
}

function updateTransparency(value, options = {}) {
    const scopedRoots = normalizeTransparencyRoots(options?.roots);
    const percentage = clampLuxuryTransparencyPercentage(value);
    const forceRefresh = options?.force === true;

    // Update display
    const display = document.getElementById('transparency-display') || document.getElementById('lux-transparency-value');
    if (display) {
        display.textContent = `${percentage}%`;
    }

    // Update slider if exists
    const slider = document.getElementById('transparency-slider') || document.getElementById('lux-transparency-slider');
    if (slider) {
        slider.value = percentage;
    }

    const isLightTheme = document.documentElement.dataset.luxThemeMode === 'light';
    const fillRatio = mapLuxuryTransparencyFillRatio(percentage);
    const transparencyModel = buildLuxuryTransparencyModel(percentage, isLightTheme);

    if (options?.persist !== false && typeof window.setDashboardVisuals === 'function') {
        try {
            window.setDashboardVisuals({ surfaceTransparency: String(percentage) });
        } catch (error) {}
    }


    if (typeof window.__kiuApplyTransparencyPreferenceState === 'function') {
        window.__kiuApplyTransparencyPreferenceState(percentage, transparencyModel.transparencyRatio);
    } else {
        // Store in localStorage
        localStorage.setItem('kiuLuxurySurfaceTransparency', percentage.toString());
        localStorage.setItem('kiuLuxurySurfaceTransparencyValue', transparencyModel.transparencyRatio.toFixed(2));

        // Sync CSS data attribute for CSS-only high-opacity overrides
        document.documentElement.dataset.luxTransparency = percentage.toString();
    }

    document.documentElement.classList.toggle('lux-fully-opaque', percentage >= 99);

    // CSS-ONLY FIX: Toggle lux-high-transparency class and injected primer CSS.
    // At >= 80%, CSS rules suppress accent radial gradients on ALL surfaces.
    if (transparencyModel.highTransparency) {
        // Update or create the primer style with current panel alpha
        var _isLight = isLightTheme;
        var _panelA = transparencyModel.panelAlpha;
        var _pa = _panelA.toFixed(3);
        var _darkBg = 'linear-gradient(180deg,rgba(14,20,33,' + _pa + '),rgba(8,12,21,' + _pa + '))';
        var _lightBg = 'linear-gradient(180deg,rgba(252,249,244,' + _pa + '),rgba(248,244,237,' + _pa + '))';
        var _bg = _isLight ? _lightBg : _darkBg;
        var _bodySelector = _isLight ? 'body.lux-light-mode' : 'body:not(.lux-light-mode)';
        var _bodyBg = _isLight
            ? 'linear-gradient(180deg,rgba(245,240,232,' + _pa + '),rgba(240,235,226,' + _pa + '))'
            : 'linear-gradient(180deg,rgba(12,17,26,' + _pa + '),rgba(7,10,16,' + _pa + '))';
        var _sidebarBg = _isLight
            ? 'linear-gradient(180deg,rgba(248,244,237,' + _pa + '),rgba(242,237,228,' + _pa + '))'
            : 'linear-gradient(180deg,rgba(10,14,22,' + _pa + '),rgba(6,9,15,' + _pa + '))';

        var highTransparencyCss =
            'html.lux-high-transparency.lux-high-transparency.lux-high-transparency{--lux-hero-glow:0!important;--lux-glow-scale:0!important;--lux-card-glow-alpha:0!important;--lux-panel-glow:0!important}' +
            buildHighTransparencySurfaceCss(_bodySelector, _bg) +
            buildStudentsAdminHighTransparencyCss(_bodySelector, _isLight, _panelA) +
            buildHighTransparencyTextResetCss(_bodySelector) +
            'html.lux-high-transparency.lux-high-transparency.lux-high-transparency ' + _bodySelector + '::before{background:' + _bodyBg + '!important}' +
            'html.lux-high-transparency.lux-high-transparency.lux-high-transparency ' + _bodySelector + ' .lux-sidebar{background:' + _sidebarBg + '!important}';
        if (typeof window.__kiuApplyHighTransparencyState === 'function') {
            window.__kiuApplyHighTransparencyState(true, highTransparencyCss);
        } else {
            document.documentElement.classList.add('lux-high-transparency');
            var existingStyle = document.getElementById('lux-high-trans-primer');
            if (!existingStyle) {
                existingStyle = document.createElement('style');
                existingStyle.id = 'lux-high-trans-primer';
                existingStyle.textContent = ':root{}';
                document.head.appendChild(existingStyle);
            }
            existingStyle.media = 'all';
            existingStyle.textContent = highTransparencyCss || ':root{}';
        }
    } else {
        if (typeof window.__kiuApplyHighTransparencyState === 'function') {
            window.__kiuApplyHighTransparencyState(false);
        } else {
            document.documentElement.classList.remove('lux-high-transparency');
            var primerStyle = document.getElementById('lux-high-trans-primer');
            if (primerStyle) {
                primerStyle.textContent = ':root{}';
                primerStyle.media = 'all';
            }
        }
    }

    if (typeof window.__kiuApplyTransparencyTokenState === 'function') {
        window.__kiuApplyTransparencyTokenState({
            panelAlpha: transparencyModel.panelAlpha.toFixed(3),
            fillRatio: transparencyModel.fillRatio.toFixed(3),
            colorFadeRatio: transparencyModel.colorFadeRatio.toFixed(3),
            raisedAlpha: transparencyModel.raisedAlpha.toFixed(3),
            glassAlpha: transparencyModel.glassAlpha.toFixed(3),
            panelFillAlpha: transparencyModel.panelFillAlpha.toFixed(3),
            raisedFillAlpha: transparencyModel.raisedFillAlpha.toFixed(3),
            utilityFillAlpha: transparencyModel.utilityFillAlpha.toFixed(3),
            utilityAlpha: transparencyModel.utilityAlpha.toFixed(3),
            topbarFillAlpha: transparencyModel.topbarFillAlpha.toFixed(3),
            topbarRaisedAlpha: transparencyModel.topbarRaisedAlpha.toFixed(3),
            glassHighlightAlpha: transparencyModel.glassHighlightAlpha.toFixed(3)
        });
    } else {
        const root = document.documentElement;
        root.style.setProperty('--lux-panel-alpha', transparencyModel.panelAlpha.toFixed(3));
        root.style.setProperty('--lux-transparency-alpha', transparencyModel.fillRatio.toFixed(3));
        root.style.setProperty('--lux-color-fade-alpha', transparencyModel.colorFadeRatio.toFixed(3));
        root.style.setProperty('--lux-raised-alpha', transparencyModel.raisedAlpha.toFixed(3));
        root.style.setProperty('--lux-glass-alpha', transparencyModel.glassAlpha.toFixed(3));
        root.style.setProperty('--lux-panel-fill-alpha', transparencyModel.panelFillAlpha.toFixed(3));
        root.style.setProperty('--lux-raised-fill-alpha', transparencyModel.raisedFillAlpha.toFixed(3));
        root.style.setProperty('--lux-utility-fill-alpha', transparencyModel.utilityFillAlpha.toFixed(3));
        root.style.setProperty('--lux-utility-alpha', transparencyModel.utilityAlpha.toFixed(3));
        root.style.setProperty('--lux-topbar-fill-alpha', transparencyModel.topbarFillAlpha.toFixed(3));
        root.style.setProperty('--lux-topbar-raised-alpha', transparencyModel.topbarRaisedAlpha.toFixed(3));
        root.style.setProperty('--lux-glass-highlight-alpha', transparencyModel.glassHighlightAlpha.toFixed(3));
    }


    // Calculate effects (remapped fill ratio: slider 0% = former 1% behavior)
    const blurAmount = fillRatio * 24;
    const saturateAmount = 100 + (fillRatio * 45);
    const surfaceFillAmount = transparencyModel.panelFillAlpha;
    const registrationGlassSelectors = [
        '.registration-hero', '.registration-workspace', '.registration-insight-card',
        '.registration-focus-card', '.registration-state-card',
        '.registration-module-list-card', '.registration-module-pane-card',
        '.registration-track-card', '.registration-footer-bar',
        '.registration-mini-metric', '.registration-course-row',
        '.registration-module-choice', '.registration-track-group'
    ];
    const registrationGlassClasses = [
        'registration-hero', 'registration-workspace', 'registration-insight-card',
        'registration-focus-card', 'registration-state-card',
        'registration-module-list-card', 'registration-module-pane-card',
        'registration-track-card', 'registration-footer-bar',
        'registration-mini-metric', 'registration-course-row',
        'registration-module-choice', 'registration-track-group'
    ];
    const schedulerGlassSelectors = [
        '#page-admin-scheduler .sch-rail-hero', '#page-admin-scheduler .sch-rail-section',
        '#page-admin-scheduler .sch-grid-shell', '#page-admin-scheduler .sch-modal',
        '#page-admin-scheduler .palette-card', '#page-admin-scheduler .sch-stat-card',
        '#page-admin-scheduler .sch-grid-tag', '#page-admin-scheduler .sch-legend-pill',
        '#page-admin-scheduler .sch-action-btn', '#page-admin-scheduler .sch-week-arrow',
        '#page-admin-scheduler .sch-empty-state', '#page-admin-scheduler .sch-grid-empty',
        '#page-admin-scheduler .lux-strip-card',
        '#page-admin-scheduler .sch-control-group select',
        '#page-admin-scheduler .sch-board-toolbar-row select',
        '#page-admin-scheduler .sch-search-shell input',
        '#page-admin-scheduler .sch-modal input',
        '#page-admin-scheduler .sch-modal select'
    ];
    const schedulerGlassClasses = [
        'sch-rail-hero', 'sch-rail-section',
        'sch-grid-shell', 'sch-modal',
        'palette-card', 'sch-stat-card', 'sch-grid-tag', 'sch-legend-pill',
        'sch-action-btn', 'sch-week-arrow',
        'sch-empty-state', 'sch-grid-empty', 'lux-strip-card'
    ];
    const lmsGlassSelectors = [
        '.lms-clean-stat', '.lms-clean-signal-panel', '.lms-clean-mini',
        '.lms-clean-metric-card', '.lms-clean-subject-card',
        '.lms-clean-action-secondary', '.lms-clean-signal-pill',
        '.lms-clean-empty', '.lms-banner', '.lux-lms-group-card',
        '#lms-content-area .lms-quiz-builder .lms-quiz-studio-hero',
        '#lms-content-area .lms-quiz-builder .lms-quiz-studio-main-card',
        '#lms-content-area .lms-quiz-builder .lms-quiz-tool-panel',
        '#lms-content-area .lms-quiz-builder .lms-quiz-saved-card',
        '#lms-content-area .lms-quiz-builder .lms-quiz-studio-stat-card',
        '#lms-content-area .lms-quiz-builder .lms-quiz-rules-card',
        '#lms-content-area .lms-quiz-builder .lms-quiz-question-nav-card',
        '#lms-content-area .lms-quiz-builder .lms-quiz-question-editor-card'
    ];
    const lmsGlassClasses = [
        'lms-clean-stat', 'lms-clean-signal-panel', 'lms-clean-mini',
        'lms-clean-metric-card', 'lms-clean-subject-card',
        'lms-clean-action-secondary', 'lms-clean-signal-pill',
        'lms-clean-empty', 'lms-banner', 'lux-lms-group-card'
    ];
    const lmsQuizBuilderGlassClasses = [
        'lms-quiz-studio-hero', 'lms-quiz-studio-main-card', 'lms-quiz-tool-panel',
        'lms-quiz-saved-card', 'lms-quiz-studio-stat-card', 'lms-quiz-rules-card',
        'lms-quiz-question-nav-card', 'lms-quiz-question-editor-card',
        'lms-quiz-variant-question-card', 'lms-quiz-variant-workspace', 'lms-quiz-card',
        'lms-live-monitor-card', 'lms-quiz-board-empty', 'lms-quiz-card-empty',
        'lms-quiz-empty-state', 'lms-quiz-policy-card'
    ];
    const isLmsRoute = document.body.classList.contains('lux-route-lms');
    const structuralClasses = [
        'lux-card-head',
        'lux-card-title',
        'lux-card-meta',
        'lux-builder-copy',
        'lux-card-body',
        'lux-panel-body',
        'lux-grid-widget-body',
        'lux-widget-container',
        'lux-inline-meta',
        'lux-card-actions',
        'lux-page-kicker',
        'lux-person-head',
        'lux-admin-ops-head'
    ];
    const TIMETABLE_GRID_CELL_CLASS_NAMES = [
        'sch-header-row',
        'sch-time-col',
        'sch-time-labels',
        'sch-day-col',
        'sch-time-slot',
        'sch-body',
        'sch-lane',
        'sch-slot-bg',
        'sch-event',
        'sch-day-lanes',
        'schedule-grid-shell'
    ];
    const isTimetableGridCell = (el) => {
        if (!document.body.classList.contains('lux-route-timetable') || !el?.classList) return false;
        if (!el.closest?.('.lux-timetable-grid-shell, .schedule-grid-shell[data-tt-grid="1"]')) return false;
        return TIMETABLE_GRID_CELL_CLASS_NAMES.some((className) => el.classList.contains(className));
    };
    const isStructuralSurface = (el) => (
        isTimetableGridCell(el) ||
        structuralClasses.some((className) => el.classList.contains(className)) ||
        (document.body.classList.contains('lux-route-admin-scheduler') && (
            el.classList.contains('sch-sidebar') ||
            el.classList.contains('sch-main') ||
            el.classList.contains('sch-grid-root') ||
            el.classList.contains('sch-header-row') ||
            el.classList.contains('sch-time-col') ||
            el.classList.contains('sch-day-col') ||
            el.classList.contains('sch-time-labels') ||
            el.classList.contains('sch-time-slot') ||
            el.classList.contains('sch-body') ||
            el.classList.contains('sch-lane') ||
            el.classList.contains('sch-slot-bg') ||
            el.classList.contains('sch-event') ||
            el.classList.contains('sch-day-lanes')
        )) ||
        (document.body.classList.contains('lux-route-admin-library') && (
            el.classList.contains('admin-library-modal') ||
            el.classList.contains('admin-library-modal-overlay') ||
            el.classList.contains('admin-library-catalog-row') ||
            el.classList.contains('admin-library-catalog-cell') ||
            el.classList.contains('admin-library-empty-row') ||
            el.classList.contains('admin-library-empty-cell')
        )) ||
        (document.body.classList.contains('lux-route-admin-orders') && (
            // Keep only true layout/structural chrome transparent; panels, cards,
            // controls and the studio modal are painted as glass by the engine
            // so they match the admin-tools recipe exactly.
            el.classList.contains('admin-orders-studio-header') ||
            el.classList.contains('admin-orders-studio-body') ||
            el.classList.contains('admin-orders-studio-close') ||
            el.classList.contains('orders-admin-shell') ||
            el.classList.contains('orders-admin-table__delete') ||
            (Boolean(el.closest?.('.orders-admin-table')) && (
                el.tagName === 'TR' ||
                el.tagName === 'TH' ||
                el.tagName === 'TD'
            ))
        )) ||
        (Boolean(el.closest?.('#page-orders, #orders-inbox-root')) &&
            !document.body.classList.contains('lux-route-admin-orders') && (
            el.classList.contains('orders-inbox-shell') ||
            el.classList.contains('orders-inbox-hero') ||
            el.classList.contains('orders-list-card') ||
            el.classList.contains('orders-detail-card') ||
            el.classList.contains('orders-inbox-hero-side') ||
            el.classList.contains('lux-hero-signal') ||
            el.classList.contains('lux-hero-side-head') ||
            el.classList.contains('orders-list-wrap') ||
            el.classList.contains('orders-status-filter') ||
            el.classList.contains('orders-item') ||
            el.classList.contains('orders-metric-card') ||
            el.classList.contains('orders-attachment-card') ||
            el.classList.contains('orders-recipient-card') ||
            el.classList.contains('orders-detail-panel') ||
            el.classList.contains('orders-detail-empty') ||
            el.classList.contains('lux-control') ||
            el.classList.contains('lux-status-pill')
        )) ||
        (document.body.classList.contains('lux-route-faculty-gradebook') && (
            Boolean(el.closest?.('.lux-faculty-gradebook-page')) && (
                el.classList.contains('lux-faculty-hero') ||
                el.classList.contains('lux-faculty-hero-focus') ||
                el.classList.contains('lux-faculty-command') ||
                el.classList.contains('lux-faculty-stage') ||
                el.classList.contains('lux-faculty-insight') ||
                el.classList.contains('lux-faculty-filters') ||
                el.classList.contains('lux-faculty-controls') ||
                el.classList.contains('lux-status-pill') ||
                el.classList.contains('lux-primary-btn') ||
                el.classList.contains('lux-secondary-btn')
            )
        )) ||
        (document.body.classList.contains('lux-route-faculty-gradebook') && (
            [...el.classList].some((className) => className.startsWith('gb-')) ||
            (Boolean(el.closest?.('#gradebook-table')) && (
                el.tagName === 'TD' || el.tagName === 'TH' || el.tagName === 'TR'
            ))
        )) ||
        (document.body.classList.contains('lux-route-timetable') && (
            el.classList.contains('lux-timetable-hero') ||
            el.classList.contains('lux-timetable-command') ||
            el.classList.contains('lux-timetable-stage') ||
            el.classList.contains('lux-timetable-hero-focus') ||
            el.classList.contains('lux-timetable-filters') ||
            el.classList.contains('lux-timetable-view-switcher') ||
            el.classList.contains('lux-timetable-week-nav') ||
            el.classList.contains('lux-timetable-overview-row') ||
            el.classList.contains('lux-timetable-insight') ||
            el.classList.contains('lux-timetable-grid-shell') ||
            el.classList.contains('lux-timetable-canvas') ||
            el.classList.contains('lux-timetable-day-section') ||
            el.classList.contains('lux-timetable-session-card') ||
            el.classList.contains('schedule-day-section') ||
            el.classList.contains('schedule-session-card') ||
            el.classList.contains('schedule-view-switcher') ||
            el.classList.contains('schedule-week-nav') ||
            el.classList.contains('schedule-overview-row') ||
            el.classList.contains('schedule-chip') ||
            el.classList.contains('lux-status-pill')
        )) ||
        (document.body.classList.contains('lux-route-chancellery') && Boolean(el.closest?.('#page-chancellery')) && (
            el.classList.contains('page-hero') ||
            el.classList.contains('lux-chancellery-hero') ||
            el.classList.contains('lux-chancellery-focus-card') ||
            el.classList.contains('lux-chancellery-snapshot-card') ||
            el.classList.contains('lux-chancellery-subcard') ||
            el.classList.contains('lux-chancellery-queue-item') ||
            el.classList.contains('lux-chancellery-thread-entry') ||
            el.classList.contains('lux-chancellery-focus-row') ||
            el.classList.contains('lux-card') ||
            el.classList.contains('lux-subcard') ||
            el.classList.contains('lux-stat-card') ||
            el.classList.contains('lux-queue-item') ||
            el.classList.contains('lux-thread-entry') ||
            el.classList.contains('lux-control') ||
            el.classList.contains('lux-chancellery-control') ||
            el.classList.contains('lux-status-pill') ||
            el.classList.contains('lux-strip-card') ||
            el.classList.contains('surface-card') ||
            el.classList.contains('content-box')
        )) ||
        (document.body.classList.contains('lux-route-profile') && Boolean(el.closest?.('#page-profile')) && (
            el.classList.contains('page-hero') ||
            el.classList.contains('profile-shell-nav-card') ||
            el.classList.contains('profile-shell-card') ||
            el.classList.contains('profile-shell-messenger') ||
            el.classList.contains('profile-shell-messenger-shell') ||
            el.classList.contains('profile-summary-strip') ||
            el.classList.contains('lux-strip-card') ||
            el.classList.contains('lux-hero-side') ||
            el.classList.contains('lux-hero-signal') ||
            el.classList.contains('lux-mini-panel') ||
            el.classList.contains('surface-card') ||
            el.classList.contains('content-box') ||
            el.classList.contains('lux-card') ||
            el.classList.contains('profile-shell-tab') ||
            el.classList.contains('lux-rail-tab') ||
            el.classList.contains('lux-control') ||
            el.classList.contains('profile-shell-input') ||
            el.classList.contains('profile-shell-action') ||
            el.classList.contains('profile-password-toggle') ||
            el.classList.contains('lux-status-pill') ||
            el.classList.contains('portal-msg-panel') ||
            el.classList.contains('portal-msg-page-shell') ||
            el.classList.contains('portal-msg-shell') ||
            el.classList.contains('portal-msg-chip') ||
            el.classList.contains('sch-header-row') ||
            el.classList.contains('sch-time-col') ||
            el.classList.contains('sch-time-labels') ||
            el.classList.contains('sch-day-col') ||
            el.classList.contains('sch-time-slot') ||
            el.classList.contains('sch-lane') ||
            el.classList.contains('sch-slot-bg') ||
            el.classList.contains('sch-event')
        )) ||
        (document.body.classList.contains('lux-route-profile-view') && (
            el.classList.contains('pv-hero') ||
            el.classList.contains('pv-meta') ||
            el.classList.contains('pv-left') ||
            el.classList.contains('pv-right') ||
            el.classList.contains('pv-stat-card') ||
            el.classList.contains('pv-tab') ||
            el.classList.contains('pv-modal-card') ||
            el.classList.contains('pv-profile-edit-card') ||
            el.classList.contains('pv-session-list-row') ||
            el.classList.contains('pv-document-card') ||
            el.classList.contains('pv-course-row') ||
            el.classList.contains('pv-financial-status-card') ||
            el.classList.contains('upload-zone') ||
            el.classList.contains('surface-card') ||
            el.classList.contains('lux-summary-surface') ||
            el.classList.contains('lux-strip-card') ||
            el.classList.contains('lux-inline-card') ||
            el.classList.contains('lux-data-card') ||
            el.classList.contains('lux-info-card') ||
            el.classList.contains('lux-status-pill') ||
            el.classList.contains('lux-control') ||
            el.classList.contains('lux-select-card')
        )) ||
        (document.body.classList.contains('lux-route-profile-view') && (
            [...el.classList].some((className) => className.startsWith('pv-')) ||
            (Boolean(el.closest?.('.pv-financial-table')) && (
                el.tagName === 'TD' || el.tagName === 'TH' || el.tagName === 'TR'
            ))
        ))
    );
    const buildDynamicSurfaceBackground = (el, lightMode, amount) => {
        // FIX: At high transparency (>=80%), NEVER add accent radial gradients.
        // These inline !important styles were overriding ALL CSS overrides.
        var _isHighTransBg = percentage >= 80;
        const isRegistrationRoute = document.body.classList.contains('lux-route-registration');
        const isRegistrationLargeSurface = isRegistrationRoute && (
            el.classList.contains('registration-hero') ||
            el.classList.contains('registration-workspace') ||
            el.classList.contains('registration-module-list-card') ||
            el.classList.contains('registration-module-pane-card')
        );
        const isRegistrationSoftSurface = isRegistrationRoute && !isRegistrationLargeSurface && (
            el.classList.contains('registration-insight-card') ||
            el.classList.contains('registration-focus-card') ||
            el.classList.contains('registration-state-card') ||
            el.classList.contains('registration-track-card') ||
            el.classList.contains('registration-track-group') ||
            el.classList.contains('registration-footer-bar') ||
            el.classList.contains('registration-mini-metric') ||
            el.classList.contains('registration-course-row') ||
            el.classList.contains('registration-module-choice')
        );
        const isProgramsRoute = document.body.classList.contains('lux-route-programs');
        const isProgramsLargeSurface = isProgramsRoute && (
            el.classList.contains('lux-program-hero') ||
            el.classList.contains('lux-program-filter-shell') ||
            el.classList.contains('lux-program-stage') ||
            el.classList.contains('lux-program-overview-card') ||
            el.classList.contains('lux-program-focus-panel') ||
            el.classList.contains('lux-program-shell-section--module-rail') ||
            el.classList.contains('lux-program-shell-section--subject-panel')
        );
        const isProgramsSoftSurface = isProgramsRoute && !isProgramsLargeSurface && (
            el.classList.contains('lux-program-publish-pill') ||
            el.classList.contains('lux-program-metric') ||
            el.classList.contains('lux-program-focus-stat') ||
            el.classList.contains('lux-program-semester-chip') ||
            el.classList.contains('lux-program-semester-timeline__chip') ||
            el.classList.contains('lux-module-option') ||
            el.classList.contains('lux-program-module-option') ||
            el.classList.contains('lux-subject-row') ||
            el.classList.contains('lux-program-subject-card') ||
            el.classList.contains('lux-program-summary-card') ||
            el.classList.contains('lux-status-pill') ||
            el.classList.contains('page-hero-badge')
        );
        const isStudyCardRoute = document.body.classList.contains('lux-route-study-card');
        const isStudyCardLargeSurface = isStudyCardRoute && (
            el.classList.contains('page-hero') ||
            el.classList.contains('filter-shell') ||
            el.id === 'study-card-container' ||
            el.classList.contains('study-card-semester-table') ||
            el.classList.contains('study-card-summary-stage')
        );
        const isStudyCardSoftSurface = isStudyCardRoute && !isStudyCardLargeSurface && (
            el.classList.contains('lux-strip-card') ||
            el.classList.contains('study-card-grade-circle') ||
            el.classList.contains('study-card-assessment-window__chip') ||
            el.classList.contains('study-card-assessment-window__card') ||
            el.classList.contains('study-card-assessment-pill') ||
            el.classList.contains('study-card-term-header') ||
            el.classList.contains('study-card-term-row') ||
            el.classList.contains('study-card-history-section') ||
            el.classList.contains('study-card-history-entry') ||
            el.classList.contains('study-card-history-row') ||
            (el.classList.contains('lux-status-pill') && el.closest?.('#study-card-container, #page-study-card'))
        );
        const isPersonalDataRoute = document.body.classList.contains('lux-route-personal-data');
        const isPersonalDataLargeSurface = isPersonalDataRoute && (
            el.classList.contains('page-hero') ||
            el.classList.contains('personal-data-toolbar') ||
            el.classList.contains('profile-card') ||
            el.classList.contains('personal-data-stats-card') ||
            el.classList.contains('personal-data-facts-card') ||
            el.classList.contains('personal-data-record-card')
        );
        const isPersonalDataSoftSurface = isPersonalDataRoute && !isPersonalDataLargeSurface && (
            el.classList.contains('personal-data-kpi-card') ||
            el.classList.contains('personal-data-mini') ||
            el.classList.contains('personal-data-record-item') ||
            el.classList.contains('personal-data-card-meta') ||
            el.classList.contains('lux-meta-pair-card') ||
            el.classList.contains('personal-data-hero-panel') ||
            (el.classList.contains('lux-strip-card') && el.closest?.('#page-personal-data')) ||
            (el.classList.contains('lux-status-pill') && el.closest?.('#page-personal-data'))
        );
        const isNewsRoute = document.body.classList.contains('lux-route-news');
        const isNewsSurface = isNewsRoute && (
            el.classList.contains('newsx-panel') ||
            el.classList.contains('newsx-hero') ||
            el.classList.contains('newsx-feed-card') ||
            el.classList.contains('newsx-filter') ||
            el.classList.contains('newsx-sidebar') ||
            el.classList.contains('newsx-rail') ||
            el.classList.contains('newsx-section') ||
            el.classList.contains('newsx-stat') ||
            el.classList.contains('newsx-private-item') ||
            el.classList.contains('newsx-check') ||
            el.classList.contains('newsx-account-card') ||
            el.classList.contains('newsx-section-btn') ||
            el.classList.contains('newsx-pane-btn')
        );
        const isStudentServiceRoute = document.body.classList.contains('lux-route-student-service');
        const isStudentServiceLargeSurface = isStudentServiceRoute && (
            el.classList.contains('student-service-hero') ||
            el.classList.contains('student-service-hero-aside') ||
            el.classList.contains('student-service-workflow-strip') ||
            el.classList.contains('student-service-workflow-step') ||
            el.classList.contains('student-service-summary-card') ||
            el.classList.contains('student-service-overview') ||
            el.classList.contains('student-service-canvas') ||
            el.classList.contains('student-service-panel') ||
            el.classList.contains('student-service-zone') ||
            el.classList.contains('student-service-area-card') ||
            el.classList.contains('student-service-article-card') ||
            el.classList.contains('student-service-ticket-row') ||
            el.classList.contains('student-service-lane-card') ||
            el.classList.contains('student-service-ticket-card') ||
            el.classList.contains('student-service-ops-card') ||
            el.classList.contains('student-service-track-panel') ||
            el.classList.contains('student-service-article-preview') ||
            el.classList.contains('student-service-ticket-stat') ||
            el.classList.contains('student-service-track-card') ||
            el.classList.contains('student-service-ops-ticket') ||
            el.classList.contains('student-service-ops-lane') ||
            el.classList.contains('student-service-ticket-focus') ||
            el.classList.contains('student-service-ticket-thread') ||
            el.classList.contains('student-service-home-panel') ||
            el.classList.contains('student-service-home-card') ||
            el.classList.contains('student-service-home-ticket') ||
            el.classList.contains('student-service-home-topic') ||
            el.classList.contains('student-service-lane-choice-card')
        );
        const isSocialRoute = document.body.classList.contains('lux-route-social');
        const isSocialLargeSurface = isSocialRoute && (
            el.classList.contains('social-hero') ||
            el.classList.contains('social-entity-cover') ||
            el.classList.contains('social-app-shell') ||
            el.classList.contains('social-rail') ||
            el.classList.contains('social-card') ||
            el.classList.contains('social-post-card') ||
            el.classList.contains('social-mini-card') ||
            el.classList.contains('social-detail-card') ||
            el.classList.contains('social-empty') ||
            el.classList.contains('social-shared-card') ||
            el.classList.contains('social-comment-card') ||
            el.classList.contains('social-notif-item') ||
            el.classList.contains('social-story-card') ||
            el.classList.contains('social-file-preview') ||
            el.classList.contains('social-poll-option') ||
            el.classList.contains('social-neo-card') ||
            SOCIAL_NEO_TRANSPARENCY_SURFACE_CLASSES.some((className) => el.classList.contains(className)) ||
            el.parentElement?.classList?.contains('social-neo-stat-grid') ||
            [...el.classList].some((className) =>
                className.startsWith('social-neo-') ||
                className.startsWith('social-project') ||
                className.startsWith('social-portfolio')
            )
        );
        const isStaffRoute = document.body.classList.contains('lux-route-staff');
        const isStaffInContent = isStaffRoute && Boolean(el.closest?.('#staff-content'));
        const isStaffLargeSurface = isStaffInContent && (
            el.classList.contains('page-hero') ||
            el.classList.contains('staff-hub-hero') ||
            el.classList.contains('staff-hub-command-panel') ||
            el.classList.contains('staff-hub-command-card') ||
            el.classList.contains('staff-hub-focus-card') ||
            el.classList.contains('staff-hub-mini-card') ||
            el.classList.contains('staff-hub-metric-card') ||
            el.classList.contains('staff-hub-controls') ||
            el.classList.contains('staff-hub-directory-panel') ||
            el.classList.contains('staff-hub-profile') ||
            el.classList.contains('staff-hub-info-card') ||
            el.classList.contains('staff-hub-warning') ||
            el.classList.contains('staff-hub-modal') ||
            el.classList.contains('staff-hub-list-item') ||
            el.classList.contains('admin-directory-hero') ||
            el.classList.contains('admin-directory-controls') ||
            el.classList.contains('admin-directory-card') ||
            el.classList.contains('lux-card') ||
            el.classList.contains('lux-person-card') ||
            el.classList.contains('lux-subcard') ||
            el.classList.contains('surface-card') ||
            el.classList.contains('content-box')
        );
        const isStudentsAdminRoute = document.body.classList.contains('lux-route-students-admin');
        const isStudentsAdminInContent = isStudentsAdminRoute &&
            Boolean(el.closest?.('#students-content')) &&
            !el.closest?.('#students-admin-lms-modal');
        const isStudentsAdminLargeSurface = isStudentsAdminInContent && (
            el.classList.contains('students-lms-hero') ||
            el.classList.contains('students-lms-profile-header') ||
            el.classList.contains('students-lms-panel') ||
            el.classList.contains('students-lms-stat-card') ||
            el.classList.contains('students-lms-profile-card') ||
            el.classList.contains('students-lms-table-shell') ||
            el.classList.contains('students-lms-list-item') ||
            el.classList.contains('students-lms-modal-card')
        );
        const isLibraryRoute = document.body.classList.contains('lux-route-library');
        const isLibraryLargeSurface = isLibraryRoute && (
            el.classList.contains('library-page-hero') ||
            el.classList.contains('library-filter-shell') ||
            el.classList.contains('library-catalog-card') ||
            el.classList.contains('library-tabs') ||
            el.classList.contains('library-picker-panel') ||
            el.classList.contains('library-catalog-foot') ||
            el.classList.contains('alib-panel')
        );
        const isLibrarySoftSurface = isLibraryRoute && !isLibraryLargeSurface && (
            el.classList.contains('library-overview-card') ||
            el.classList.contains('library-hero-metric') ||
            el.classList.contains('library-hero-summary-card') ||
            el.classList.contains('library-hero-signal-card') ||
            el.classList.contains('admin-library-metric-card') ||
            el.classList.contains('admin-library-hero-summary-card') ||
            el.classList.contains('admin-library-param-group') ||
            el.classList.contains('admin-library-chip') ||
            (el.classList.contains('lux-strip-card') && el.closest?.('#page-library')) ||
            (el.classList.contains('lux-hero-signal') && el.closest?.('#page-library')) ||
            (el.classList.contains('lux-picker-btn') && el.closest?.('.library-filter-shell')) ||
            (el.classList.contains('lux-control') && el.closest?.('.library-filter-shell'))
        );
        const isExamsRoute = document.body.classList.contains('lux-route-exams');
        const isExamsSurface = isExamsRoute && (
            el.classList.contains('ex2-hero') ||
            el.classList.contains('ex2-panel') ||
            el.classList.contains('ex2-toolbar') ||
            el.classList.contains('ex2-card') ||
            el.classList.contains('ex2-stat-card') ||
            el.classList.contains('ex2-cohort-card') ||
            el.classList.contains('ex2-session-card') ||
            el.classList.contains('ex2-list-card') ||
            el.classList.contains('ex2-question-card') ||
            el.classList.contains('ex2-review-card') ||
            el.classList.contains('ex2-side-card') ||
            el.classList.contains('ex2-select-card') ||
            el.classList.contains('ex2-live-sidebar') ||
            el.classList.contains('ex2-q-card') ||
            el.classList.contains('ex2-q-card-head') ||
            el.classList.contains('ex2-empty-state') ||
            el.classList.contains('ex2-timeline-card') ||
            el.classList.contains('ex2-split-box') ||
            el.classList.contains('ex2-auto-gen-box') ||
            el.classList.contains('ex2-qnav-bar') ||
            el.classList.contains('ex2-progress-step') ||
            el.parentElement?.classList?.contains('ex2-mini-grid')
        );
        const isAdminToolsRoute = document.body.classList.contains('lux-route-admin-tools');
        const isAdminToolsInShell = isAdminToolsRoute && Boolean(el.closest?.('#lux-admin-tools-shell'));
        const isAdminToolsLargeSurface = isAdminToolsInShell && (
            el.classList.contains('lux-admin-tools-index-hero') ||
            el.classList.contains('lux-admin-tools-index-panel') ||
            el.classList.contains('lux-admin-tools-hero') ||
            el.classList.contains('lux-admin-op-card') ||
            el.classList.contains('lux-admin-ops-panel') ||
            el.classList.contains('lux-admin-provision-card') ||
            el.classList.contains('lux-panel') ||
            el.classList.contains('lux-card') ||
            el.id === 'admin-reg-content-container' ||
            el.id === 'curriculum-library-modules-root'
        );
        const isAdminToolsSoftSurface = isAdminToolsInShell && !isAdminToolsLargeSurface && (
            el.classList.contains('lux-admin-tools-index-summary') ||
            el.classList.contains('lux-admin-tools-index-command') ||
            el.classList.contains('lux-admin-tools-index-command-card') ||
            el.classList.contains('lux-admin-tools-index-subpanel') ||
            el.classList.contains('lux-subcard') ||
            el.classList.contains('lux-stat-card') ||
            el.classList.contains('lux-grid-widget') ||
            (el.classList.contains('admin-reg-tab') && !el.classList.contains('is-active') && el.getAttribute('aria-pressed') !== 'true') ||
            (el.classList.contains('lux-strip-card') && el.classList.contains('surface-card'))
        );
        const isAdminToolsControlSurface = isAdminToolsInShell && (
            el.classList.contains('lux-control') ||
            el.classList.contains('lux-picker-btn')
        );
        const isAdminToolsSurface = isAdminToolsLargeSurface || isAdminToolsSoftSurface || isAdminToolsControlSurface;
        const isAdminLibraryRoute = document.body.classList.contains('lux-route-admin-library') ||
            document.body.classList.contains('lux-entry-admin-library');
        const isAdminLibraryInPage = isAdminLibraryRoute && Boolean(el.closest?.('#page-library') || el.classList.contains('admin-library-modal'));
        const isAdminLibraryLargeSurface = isAdminLibraryInPage && (
            el.classList.contains('lux-panel') ||
            (el.classList.contains('lux-strip-card') && Boolean(el.closest?.('#page-library'))) ||
            el.classList.contains('admin-library-modal')
        );
        const isAdminLibrarySoftSurface = isAdminLibraryInPage && !isAdminLibraryLargeSurface && (
            el.classList.contains('lux-stat-card') ||
            el.classList.contains('lux-pill') ||
            el.classList.contains('admin-library-chip') ||
            el.classList.contains('admin-library-param-group')
        );
        const isAdminLibrarySurface = isAdminLibraryLargeSurface || isAdminLibrarySoftSurface;
        const isAdminOrdersRoute = document.body.classList.contains('lux-route-admin-orders');
        // Scope to the admin-orders workspace + the Colour & Motion Studio modal
        // only, so the shared non-admin orders.html (lux-route-orders, its own
        // inbox shell) is never touched here.
        const isAdminOrdersInScope = isAdminOrdersRoute &&
            Boolean(el.closest?.('#admin-orders-root, #modal-studio'));
        const isAdminOrdersLargeSurface = isAdminOrdersInScope && (
            el.classList.contains('orders-admin-shell') ||
            el.classList.contains('orders-admin-hero') ||
            el.classList.contains('orders-admin-panel') ||
            el.classList.contains('orders-admin-hero-side') ||
            el.classList.contains('orders-detail-panel') ||
            el.classList.contains('orders-admin-table-wrap') ||
            el.classList.contains('admin-orders-studio')
        );
        const isAdminOrdersSoftSurface = isAdminOrdersInScope && !isAdminOrdersLargeSurface && (
            el.classList.contains('orders-metric-card') ||
            el.classList.contains('orders-recipient-row') ||
            el.classList.contains('orders-recipient-card') ||
            el.classList.contains('orders-attachment-card') ||
            el.classList.contains('orders-detail-empty') ||
            el.classList.contains('orders-detail-card') ||
            el.classList.contains('orders-recipient-list-shell') ||
            el.classList.contains('orders-recipient-list-empty') ||
            el.classList.contains('lux-hero-side-head') ||
            el.classList.contains('lux-hero-signal') ||
            el.classList.contains('lux-stat-card') ||
            el.classList.contains('admin-orders-studio-card') ||
            el.classList.contains('admin-orders-palette-option') ||
            el.classList.contains('admin-orders-mode-btn') ||
            el.classList.contains('admin-orders-background-btn')
        );
        const isAdminOrdersControlSurface = isAdminOrdersInScope && (
            el.classList.contains('lux-control') ||
            el.classList.contains('lux-status-pill') ||
            el.classList.contains('lux-primary-btn') ||
            el.classList.contains('lux-secondary-btn') ||
            el.classList.contains('admin-orders-apply-btn')
        );
        const isOrdersSurface = isAdminOrdersLargeSurface || isAdminOrdersSoftSurface ||
            isAdminOrdersControlSurface;
        const isHomeDashboardSurface = Boolean(el.matches?.(
            '#page-home #lux-home-shell .lux-home-toolbar, ' +
            '#page-home #lux-home-shell .lux-home-grid > .lux-panel, ' +
            '#page-home #lux-home-shell .lux-home-grid > .lux-card, ' +
            '#page-home #lux-home-shell .lux-home-grid > .lux-hero, ' +
            '#page-home #lux-home-shell .lux-dashboard-canvas .lux-grid-widget, ' +
            '#page-home #lux-home-shell .lux-grid-widget > .lux-grid-widget-body > .lux-dashboard-section, ' +
            '#page-home #lux-home-shell .lux-grid-widget > .lux-grid-widget-body > .lux-panel, ' +
            '#page-home #lux-home-shell .lux-grid-widget > .lux-grid-widget-body > .lux-card, ' +
            '#page-home #lux-home-shell .lux-grid-widget > .lux-grid-widget-body > .lux-hero'
        ));
        const isSchedulerRoute = document.body.classList.contains('lux-route-admin-scheduler');
        const isSchedulerInPage = isSchedulerRoute && Boolean(el.closest?.('#page-admin-scheduler'));
        const isSchedulerHeroSurface = isSchedulerInPage && el.classList.contains('sch-rail-hero');
        const isSchedulerLargeSurface = isSchedulerInPage && !isSchedulerHeroSurface && (
            el.classList.contains('sch-rail-section') ||
            el.classList.contains('sch-grid-shell') ||
            el.classList.contains('sch-modal')
        );
        const isSchedulerSoftSurface = isSchedulerInPage && !isSchedulerHeroSurface && !isSchedulerLargeSurface && (
            el.classList.contains('sch-stat-card') ||
            el.classList.contains('palette-card') ||
            el.classList.contains('sch-grid-tag') ||
            el.classList.contains('sch-empty-state') ||
            el.classList.contains('sch-grid-empty') ||
            el.classList.contains('sch-week-arrow') ||
            (el.classList.contains('lux-strip-card') && el.classList.contains('surface-card'))
        );
        const isSchedulerControlSurface = isSchedulerInPage && (
            (el.tagName === 'SELECT' || el.tagName === 'INPUT') &&
            el.closest?.('.sch-control-group, .sch-search-shell, .sch-modal')
        );
        const isSchedulerSurface = isSchedulerHeroSurface || isSchedulerLargeSurface ||
            isSchedulerSoftSurface || isSchedulerControlSurface;
        if (isHomeDashboardSurface) {
            return buildHomeStyleSurfaceBackground(lightMode, amount);
        }
        if (isSchedulerSurface) {
            const isSmallSchedulerSurface = isSchedulerSoftSurface || isSchedulerControlSurface;
            if (lightMode) {
                if (isSmallSchedulerSurface) {
                    return 'radial-gradient(circle at 12% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .86) * .62)), transparent 30%), ' +
                        'radial-gradient(circle at 84% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .14)), transparent 34%), ' +
                        'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .045)), rgba(255,255,255, calc(var(--lux-transparency-alpha, .86) * .84)) 46%, rgba(247,241,232, calc(var(--lux-transparency-alpha, .86) * .72)))';
                }
                if (isSchedulerHeroSurface) {
                    return 'radial-gradient(circle at 6% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .86) * .88)), transparent 34%), ' +
                        'radial-gradient(circle at 74% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .24)), transparent 42%), ' +
                        'radial-gradient(circle at 100% 96%, rgba(var(--lux-home-secondary-rgb), calc(var(--lux-color-fade-alpha, .86) * .14)), transparent 40%), ' +
                        'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .065)), rgba(255,255,255, calc(var(--lux-transparency-alpha, .86) * .84)) 44%, rgba(247,241,232, calc(var(--lux-transparency-alpha, .86) * .70)))';
                }
                return 'radial-gradient(circle at 8% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .86) * .88)), transparent 34%), ' +
                    'radial-gradient(circle at 72% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .22)), transparent 38%), ' +
                    'radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), calc(var(--lux-color-fade-alpha, .86) * .13)), transparent 38%), ' +
                    'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .075)), rgba(255,255,255, calc(var(--lux-transparency-alpha, .86) * .88)) 44%, rgba(247,241,232, calc(var(--lux-transparency-alpha, .86) * .72)))';
            }
            if (isSmallSchedulerSurface) {
                return 'radial-gradient(circle at 12% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .92) * .055)), transparent 30%), ' +
                    'radial-gradient(circle at 84% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .14)), transparent 34%), ' +
                    'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .065)), rgba(10,15,24, calc(var(--lux-transparency-alpha, .92) * .88)) 46%, rgba(7,10,18, calc(var(--lux-transparency-alpha, .92) * .80)))';
            }
            if (isSchedulerHeroSurface) {
                return 'radial-gradient(circle at 6% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .92) * .08)), transparent 32%), ' +
                    'radial-gradient(circle at 74% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .28)), transparent 42%), ' +
                    'radial-gradient(circle at 100% 96%, rgba(var(--lux-home-secondary-rgb), calc(var(--lux-color-fade-alpha, .92) * .18)), transparent 40%), ' +
                    'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .10)), rgba(10,15,24, calc(var(--lux-transparency-alpha, .92) * .89)) 44%, rgba(7,10,18, calc(var(--lux-transparency-alpha, .92) * .80)))';
            }
            return 'radial-gradient(circle at 8% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .92) * .075)), transparent 32%), ' +
                'radial-gradient(circle at 72% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .24)), transparent 38%), ' +
                'radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), calc(var(--lux-color-fade-alpha, .92) * .14)), transparent 38%), ' +
                'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .10)), rgba(10,15,24, calc(var(--lux-transparency-alpha, .92) * .91)) 44%, rgba(7,10,18, calc(var(--lux-transparency-alpha, .92) * .84)))';
        }
        if (isRegistrationLargeSurface) {
            if (lightMode) {
                return 'radial-gradient(circle at 12% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .86) * .86)), transparent 34%), ' +
                    'radial-gradient(circle at 74% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .20)), transparent 36%), ' +
                    'radial-gradient(circle at 100% 90%, rgba(var(--lux-home-secondary-rgb), calc(var(--lux-color-fade-alpha, .86) * .12)), transparent 38%), ' +
                    'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .08)), rgba(255,255,255, calc(var(--lux-transparency-alpha, .86) * .88)) 42%, rgba(247,241,232, calc(var(--lux-transparency-alpha, .86) * .72)))';
            }
            return 'radial-gradient(circle at 12% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .92) * .075)), transparent 32%), ' +
                'radial-gradient(circle at 74% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .24)), transparent 38%), ' +
                'radial-gradient(circle at 100% 90%, rgba(var(--lux-home-secondary-rgb), calc(var(--lux-color-fade-alpha, .92) * .14)), transparent 38%), ' +
                'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .11)), rgba(12,17,26, calc(var(--lux-transparency-alpha, .92) * .91)) 42%, rgba(8,12,19, calc(var(--lux-transparency-alpha, .92) * .84)))';
        }
        if (isRegistrationSoftSurface) {
            if (lightMode) {
                return 'radial-gradient(circle at 12% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .86) * .72)), transparent 32%), ' +
                    'radial-gradient(circle at 84% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .14)), transparent 36%), ' +
                    'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .05)), rgba(255,255,255, calc(var(--lux-transparency-alpha, .86) * .82)) 46%, rgba(247,241,232, calc(var(--lux-transparency-alpha, .86) * .66)))';
            }
            return 'radial-gradient(circle at 12% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .92) * .06)), transparent 30%), ' +
                'radial-gradient(circle at 84% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .16)), transparent 36%), ' +
                'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .07)), rgba(12,18,30, calc(var(--lux-transparency-alpha, .92) * .82)) 46%, rgba(8,12,21, calc(var(--lux-transparency-alpha, .92) * .72)))';
        }
        if (isProgramsLargeSurface) {
            if (lightMode) {
                return 'radial-gradient(circle at 8% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .86) * .86)), transparent 34%), ' +
                    'radial-gradient(circle at 74% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .20)), transparent 36%), ' +
                    'radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), calc(var(--lux-color-fade-alpha, .86) * .12)), transparent 38%), ' +
                    'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .08)), rgba(255,255,255, calc(var(--lux-transparency-alpha, .86) * .88)) 42%, rgba(247,241,232, calc(var(--lux-transparency-alpha, .86) * .72)))';
            }
            return 'radial-gradient(circle at 8% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .92) * .075)), transparent 32%), ' +
                'radial-gradient(circle at 74% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .26)), transparent 42%), ' +
                'radial-gradient(circle at 100% 96%, rgba(var(--lux-home-secondary-rgb), calc(var(--lux-color-fade-alpha, .92) * .16)), transparent 40%), ' +
                'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .095)), rgba(10,15,24, calc(var(--lux-transparency-alpha, .92) * .90)) 44%, rgba(7,10,18, calc(var(--lux-transparency-alpha, .92) * .80)))';
        }
        if (isProgramsSoftSurface) {
            if (lightMode) {
                return 'radial-gradient(circle at 12% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .86) * .72)), transparent 32%), ' +
                    'radial-gradient(circle at 84% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .14)), transparent 36%), ' +
                    'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .05)), rgba(255,255,255, calc(var(--lux-transparency-alpha, .86) * .82)) 46%, rgba(247,241,232, calc(var(--lux-transparency-alpha, .86) * .66)))';
            }
            return 'radial-gradient(circle at 12% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .92) * .06)), transparent 30%), ' +
                'radial-gradient(circle at 84% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .16)), transparent 36%), ' +
                'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .07)), rgba(12,18,30, calc(var(--lux-transparency-alpha, .92) * .82)) 46%, rgba(8,12,21, calc(var(--lux-transparency-alpha, .92) * .72)))';
        }
        if (isStudyCardLargeSurface) {
            if (lightMode) {
                return 'radial-gradient(circle at 8% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .86) * .88)), transparent 34%), ' +
                    'radial-gradient(circle at 72% 4%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .19)), transparent 38%), ' +
                    'radial-gradient(circle at 100% 92%, rgba(var(--lux-home-secondary-rgb), calc(var(--lux-color-fade-alpha, .86) * .13)), transparent 38%), ' +
                    'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .075)), rgba(255,255,255, calc(var(--lux-transparency-alpha, .86) * .88)) 44%, rgba(247,241,232, calc(var(--lux-transparency-alpha, .86) * .72)))';
            }
            return 'radial-gradient(circle at 8% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .92) * .075)), transparent 32%), ' +
                'radial-gradient(circle at 72% 4%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .23)), transparent 38%), ' +
                'radial-gradient(circle at 100% 92%, rgba(var(--lux-home-secondary-rgb), calc(var(--lux-color-fade-alpha, .92) * .15)), transparent 38%), ' +
                'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .10)), rgba(10,15,24, calc(var(--lux-transparency-alpha, .92) * .91)) 44%, rgba(7,10,18, calc(var(--lux-transparency-alpha, .92) * .84)))';
        }
        if (isStudyCardSoftSurface) {
            if (lightMode) {
                return 'radial-gradient(circle at 12% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .86) * .72)), transparent 32%), ' +
                    'radial-gradient(circle at 84% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .14)), transparent 36%), ' +
                    'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .05)), rgba(255,255,255, calc(var(--lux-transparency-alpha, .86) * .82)) 46%, rgba(247,241,232, calc(var(--lux-transparency-alpha, .86) * .66)))';
            }
            return 'radial-gradient(circle at 12% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .92) * .06)), transparent 30%), ' +
                'radial-gradient(circle at 84% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .16)), transparent 36%), ' +
                'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .07)), rgba(12,18,30, calc(var(--lux-transparency-alpha, .92) * .82)) 46%, rgba(8,12,21, calc(var(--lux-transparency-alpha, .92) * .72)))';
        }
        if (isPersonalDataLargeSurface) {
            if (lightMode) {
                return 'radial-gradient(circle at 8% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .86) * .88)), transparent 34%), ' +
                    'radial-gradient(circle at 76% 2%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .18)), transparent 38%), ' +
                    'radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), calc(var(--lux-color-fade-alpha, .86) * .13)), transparent 38%), ' +
                    'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .075)), rgba(255,255,255, calc(var(--lux-transparency-alpha, .86) * .88)) 44%, rgba(247,241,232, calc(var(--lux-transparency-alpha, .86) * .72)))';
            }
            return 'radial-gradient(circle at 8% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .92) * .075)), transparent 32%), ' +
                'radial-gradient(circle at 76% 2%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .22)), transparent 38%), ' +
                'radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), calc(var(--lux-color-fade-alpha, .92) * .14)), transparent 38%), ' +
                'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .10)), rgba(10,15,24, calc(var(--lux-transparency-alpha, .92) * .91)) 44%, rgba(7,10,18, calc(var(--lux-transparency-alpha, .92) * .84)))';
        }
        if (isPersonalDataSoftSurface) {
            if (lightMode) {
                return 'radial-gradient(circle at 12% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .86) * .72)), transparent 32%), ' +
                    'radial-gradient(circle at 84% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .14)), transparent 36%), ' +
                    'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .05)), rgba(255,255,255, calc(var(--lux-transparency-alpha, .86) * .82)) 46%, rgba(247,241,232, calc(var(--lux-transparency-alpha, .86) * .66)))';
            }
            return 'radial-gradient(circle at 12% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .92) * .06)), transparent 30%), ' +
                'radial-gradient(circle at 84% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .16)), transparent 36%), ' +
                'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .07)), rgba(12,18,30, calc(var(--lux-transparency-alpha, .92) * .82)) 46%, rgba(8,12,21, calc(var(--lux-transparency-alpha, .92) * .72)))';
        }
        if (isNewsSurface) {
            const isSmallNewsControl = (
                el.classList.contains('newsx-stat') ||
                el.classList.contains('newsx-private-item') ||
                el.classList.contains('newsx-check') ||
                el.classList.contains('newsx-account-card') ||
                el.classList.contains('newsx-section-btn') ||
                el.classList.contains('newsx-pane-btn')
            );
            if (lightMode) {
                if (isSmallNewsControl) {
                    return 'radial-gradient(circle at 12% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .86) * .62)), transparent 30%), ' +
                        'radial-gradient(circle at 84% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .14)), transparent 34%), ' +
                        'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .045)), rgba(255,255,255, calc(var(--lux-transparency-alpha, .86) * .84)) 46%, rgba(247,241,232, calc(var(--lux-transparency-alpha, .86) * .72)))';
                }
                return 'radial-gradient(circle at 8% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .86) * .88)), transparent 34%), ' +
                    'radial-gradient(circle at 74% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .22)), transparent 38%), ' +
                    'radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), calc(var(--lux-color-fade-alpha, .86) * .13)), transparent 38%), ' +
                    'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .075)), rgba(255,255,255, calc(var(--lux-transparency-alpha, .86) * .88)) 44%, rgba(247,241,232, calc(var(--lux-transparency-alpha, .86) * .72)))';
            }
            if (isSmallNewsControl) {
                return 'radial-gradient(circle at 12% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .92) * .055)), transparent 30%), ' +
                    'radial-gradient(circle at 84% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .14)), transparent 34%), ' +
                    'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .065)), rgba(10,15,24, calc(var(--lux-transparency-alpha, .92) * .88)) 46%, rgba(7,10,18, calc(var(--lux-transparency-alpha, .92) * .80)))';
            }
            return 'radial-gradient(circle at 8% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .92) * .075)), transparent 32%), ' +
                'radial-gradient(circle at 74% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .24)), transparent 38%), ' +
                'radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), calc(var(--lux-color-fade-alpha, .92) * .14)), transparent 38%), ' +
                'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .10)), rgba(10,15,24, calc(var(--lux-transparency-alpha, .92) * .91)) 44%, rgba(7,10,18, calc(var(--lux-transparency-alpha, .92) * .84)))';
        }
        if (isStudentServiceLargeSurface) {
            const isSmallServiceSurface = (
                el.classList.contains('student-service-workflow-step') ||
                el.classList.contains('student-service-summary-card') ||
                el.classList.contains('student-service-home-card') ||
                el.classList.contains('student-service-area-card') ||
                el.classList.contains('student-service-ticket-row') ||
                el.classList.contains('student-service-track-card') ||
                el.classList.contains('student-service-lane-card') ||
                el.classList.contains('student-service-ticket-card')
            );
            if (lightMode) {
                if (isSmallServiceSurface) {
                    return 'radial-gradient(circle at 8% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .88) * .88)), transparent 34%), ' +
                        'radial-gradient(circle at 72% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .88) * .16)), transparent 38%), ' +
                        'radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), calc(var(--lux-color-fade-alpha, .88) * .13)), transparent 38%), ' +
                        'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .88) * .075)), rgba(255,255,255, calc(var(--lux-transparency-alpha, .88) * .88)) 44%, rgba(247,241,232, calc(var(--lux-transparency-alpha, .88) * .72)))';
                }
                return 'radial-gradient(circle at 8% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .88) * .88)), transparent 34%), ' +
                    'radial-gradient(circle at 72% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .88) * .20)), transparent 38%), ' +
                    'radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), calc(var(--lux-color-fade-alpha, .88) * .13)), transparent 38%), ' +
                    'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .88) * .075)), rgba(255,255,255, calc(var(--lux-transparency-alpha, .88) * .88)) 44%, rgba(247,241,232, calc(var(--lux-transparency-alpha, .88) * .72)))';
            }
            if (isSmallServiceSurface) {
                return 'radial-gradient(circle at 8% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .92) * .075)), transparent 32%), ' +
                    'radial-gradient(circle at 72% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .16)), transparent 38%), ' +
                    'radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), calc(var(--lux-color-fade-alpha, .92) * .14)), transparent 38%), ' +
                    'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .10)), rgba(10,15,24, calc(var(--lux-transparency-alpha, .92) * .91)) 44%, rgba(7,10,18, calc(var(--lux-transparency-alpha, .92) * .84)))';
            }
            return 'radial-gradient(circle at 8% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .92) * .075)), transparent 32%), ' +
                'radial-gradient(circle at 72% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .24)), transparent 38%), ' +
                'radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), calc(var(--lux-color-fade-alpha, .92) * .14)), transparent 38%), ' +
                'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .10)), rgba(10,15,24, calc(var(--lux-transparency-alpha, .92) * .91)) 44%, rgba(7,10,18, calc(var(--lux-transparency-alpha, .92) * .84)))';
        }
        if (isSocialLargeSurface) {
            const isSmallSocialSurface =
                SOCIAL_NEO_SMALL_TRANSPARENCY_SURFACE_CLASSES.some((className) => el.classList.contains(className)) ||
                el.classList.contains('social-mini-card') ||
                el.classList.contains('social-comment-card') ||
                el.classList.contains('social-notif-item') ||
                el.classList.contains('social-story-card') ||
                el.classList.contains('social-file-preview') ||
                Boolean(el.parentElement?.classList?.contains('social-neo-stat-grid'));
            return buildLuxuryRoutePanelGradient(lightMode, isSmallSocialSurface);
        }
        if (isStaffLargeSurface) {
            if (el.classList.contains('staff-hub-metric-card')) {
                return buildLuxuryRoutePanelGradient(lightMode, true);
            }
            if (STAFF_ROUTE_CONTROL_TRANSPARENCY_SURFACE_CLASSES.some(
                (className) => el.classList.contains(className)
            )) {
                return buildStaffFadeBackground(lightMode, 'control');
            }
            const isSmallStaffSurface = STAFF_ROUTE_SMALL_TRANSPARENCY_SURFACE_CLASSES.some(
                (className) => el.classList.contains(className)
            );
            return buildLuxuryRoutePanelGradient(lightMode, isSmallStaffSurface);
        }
        if (isStudentsAdminLargeSurface) {
            const isSmallStudentsAdminSurface = STUDENTS_ADMIN_ROUTE_SMALL_TRANSPARENCY_SURFACE_CLASSES.some(
                (className) => el.classList.contains(className)
            );
            return buildLuxuryRoutePanelGradient(lightMode, isSmallStudentsAdminSurface);
        }
        if (isLibraryLargeSurface || isLibrarySoftSurface) {
            const libraryStrength = (
                isLibrarySoftSurface ||
                el.classList.contains('library-tabs') ||
                el.classList.contains('library-catalog-foot')
            ) ? 0.14 : 0.24;
            if (lightMode) {
                if (libraryStrength < 0.2) {
                    return 'radial-gradient(circle at 12% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .86) * .62)), transparent 30%), ' +
                        'radial-gradient(circle at 84% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .14)), transparent 34%), ' +
                        'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .045)), rgba(255,255,255, calc(var(--lux-transparency-alpha, .86) * .84)) 46%, rgba(247,241,232, calc(var(--lux-transparency-alpha, .86) * .72)))';
                }
                return 'radial-gradient(circle at 8% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .86) * .88)), transparent 34%), ' +
                    'radial-gradient(circle at 72% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .22)), transparent 38%), ' +
                    'radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), calc(var(--lux-color-fade-alpha, .86) * .13)), transparent 38%), ' +
                    'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .075)), rgba(255,255,255, calc(var(--lux-transparency-alpha, .86) * .88)) 44%, rgba(247,241,232, calc(var(--lux-transparency-alpha, .86) * .72)))';
            }
            if (libraryStrength < 0.2) {
                return 'radial-gradient(circle at 12% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .92) * .055)), transparent 30%), ' +
                    'radial-gradient(circle at 84% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .14)), transparent 34%), ' +
                    'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .065)), rgba(10,15,24, calc(var(--lux-transparency-alpha, .92) * .88)) 46%, rgba(7,10,18, calc(var(--lux-transparency-alpha, .92) * .80)))';
            }
            return 'radial-gradient(circle at 8% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .92) * .075)), transparent 32%), ' +
                'radial-gradient(circle at 72% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .24)), transparent 38%), ' +
                'radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), calc(var(--lux-color-fade-alpha, .92) * .14)), transparent 38%), ' +
                'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .10)), rgba(10,15,24, calc(var(--lux-transparency-alpha, .92) * .91)) 44%, rgba(7,10,18, calc(var(--lux-transparency-alpha, .92) * .84)))';
        }
        if (isExamsSurface) {
            const isSmallExamSurface = (
                el.classList.contains('ex2-stat-card') ||
                el.classList.contains('ex2-q-card') ||
                el.classList.contains('ex2-q-card-head') ||
                el.classList.contains('ex2-timeline-card') ||
                el.classList.contains('ex2-split-box') ||
                el.classList.contains('ex2-progress-step') ||
                el.parentElement?.classList?.contains('ex2-mini-grid')
            );
            if (lightMode) {
                if (isSmallExamSurface) {
                    return 'radial-gradient(circle at 10% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .86) * .78)), transparent 32%), ' +
                        'radial-gradient(circle at 84% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .14)), transparent 34%), ' +
                        'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .055)), rgba(255,255,255, calc(var(--lux-transparency-alpha, .86) * .82)) 46%, rgba(247,241,232, calc(var(--lux-transparency-alpha, .86) * .66)))';
                }
                return 'radial-gradient(circle at 8% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .86) * .88)), transparent 34%), ' +
                    'radial-gradient(circle at 74% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .22)), transparent 38%), ' +
                    'radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), calc(var(--lux-color-fade-alpha, .86) * .13)), transparent 38%), ' +
                    'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .075)), rgba(255,255,255, calc(var(--lux-transparency-alpha, .86) * .88)) 44%, rgba(247,241,232, calc(var(--lux-transparency-alpha, .86) * .72)))';
            }
            if (isSmallExamSurface) {
                return 'radial-gradient(circle at 12% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .92) * .055)), transparent 30%), ' +
                    'radial-gradient(circle at 84% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .14)), transparent 34%), ' +
                    'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .065)), rgba(10,15,24, calc(var(--lux-transparency-alpha, .92) * .88)) 46%, rgba(7,10,18, calc(var(--lux-transparency-alpha, .92) * .80)))';
            }
            return 'radial-gradient(circle at 8% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .92) * .075)), transparent 32%), ' +
                'radial-gradient(circle at 74% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .24)), transparent 38%), ' +
                'radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), calc(var(--lux-color-fade-alpha, .92) * .14)), transparent 38%), ' +
                'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .10)), rgba(10,15,24, calc(var(--lux-transparency-alpha, .92) * .91)) 44%, rgba(7,10,18, calc(var(--lux-transparency-alpha, .92) * .84)))';
        }
        if (isAdminToolsSurface || isAdminLibrarySurface) {
            const isSmallAdminToolsSurface = isAdminToolsSoftSurface || isAdminToolsControlSurface || isAdminLibrarySoftSurface || (
                el.classList.contains('lux-admin-tools-index-summary') ||
                el.classList.contains('lux-admin-tools-index-command') ||
                el.classList.contains('lux-admin-tools-index-command-card') ||
                el.classList.contains('lux-admin-tools-index-subpanel') ||
                el.classList.contains('lux-subcard') ||
                el.classList.contains('lux-stat-card') ||
                el.classList.contains('lux-grid-widget') ||
                (el.classList.contains('admin-reg-tab') && !el.classList.contains('is-active') && el.getAttribute('aria-pressed') !== 'true') ||
                (el.classList.contains('lux-strip-card') && el.closest?.('#lux-admin-tools-shell'))
            );
            if (lightMode) {
                if (isSmallAdminToolsSurface) {
                    return 'radial-gradient(circle at 12% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .86) * .62)), transparent 30%), ' +
                        'radial-gradient(circle at 84% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .14)), transparent 34%), ' +
                        'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .045)), rgba(255,255,255, calc(var(--lux-transparency-alpha, .86) * .84)) 46%, rgba(247,241,232, calc(var(--lux-transparency-alpha, .86) * .72)))';
                }
                return 'radial-gradient(circle at 8% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .86) * .88)), transparent 34%), ' +
                    'radial-gradient(circle at 72% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .22)), transparent 38%), ' +
                    'radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), calc(var(--lux-color-fade-alpha, .86) * .13)), transparent 38%), ' +
                    'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .075)), rgba(255,255,255, calc(var(--lux-transparency-alpha, .86) * .88)) 44%, rgba(247,241,232, calc(var(--lux-transparency-alpha, .86) * .72)))';
            }
            if (isSmallAdminToolsSurface) {
                return 'radial-gradient(circle at 12% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .92) * .055)), transparent 30%), ' +
                    'radial-gradient(circle at 84% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .14)), transparent 34%), ' +
                    'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .065)), rgba(10,15,24, calc(var(--lux-transparency-alpha, .92) * .88)) 46%, rgba(7,10,18, calc(var(--lux-transparency-alpha, .92) * .80)))';
            }
            return 'radial-gradient(circle at 8% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .92) * .075)), transparent 32%), ' +
                'radial-gradient(circle at 72% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .24)), transparent 38%), ' +
                'radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), calc(var(--lux-color-fade-alpha, .92) * .14)), transparent 38%), ' +
                'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .10)), rgba(10,15,24, calc(var(--lux-transparency-alpha, .92) * .91)) 44%, rgba(7,10,18, calc(var(--lux-transparency-alpha, .92) * .84)))';
        }
        if (isOrdersSurface) {
            const isOrdersSoftSurface = isAdminOrdersSoftSurface || isAdminOrdersControlSurface;
            if (lightMode) {
                if (isOrdersSoftSurface) {
                    return 'radial-gradient(circle at 12% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .86) * .62)), transparent 30%), ' +
                        'radial-gradient(circle at 84% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .14)), transparent 34%), ' +
                        'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .045)), rgba(255,255,255, calc(var(--lux-transparency-alpha, .86) * .84)) 46%, rgba(247,241,232, calc(var(--lux-transparency-alpha, .86) * .72)))';
                }
                return 'radial-gradient(circle at 8% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .86) * .88)), transparent 34%), ' +
                    'radial-gradient(circle at 72% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .22)), transparent 38%), ' +
                    'radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), calc(var(--lux-color-fade-alpha, .86) * .13)), transparent 38%), ' +
                    'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .075)), rgba(255,255,255, calc(var(--lux-transparency-alpha, .86) * .88)) 44%, rgba(247,241,232, calc(var(--lux-transparency-alpha, .86) * .72)))';
            }
            if (isOrdersSoftSurface) {
                return 'radial-gradient(circle at 12% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .92) * .055)), transparent 30%), ' +
                    'radial-gradient(circle at 84% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .14)), transparent 34%), ' +
                    'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .065)), rgba(10,15,24, calc(var(--lux-transparency-alpha, .92) * .88)) 46%, rgba(7,10,18, calc(var(--lux-transparency-alpha, .92) * .80)))';
            }
            return 'radial-gradient(circle at 8% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .92) * .075)), transparent 32%), ' +
                'radial-gradient(circle at 72% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .24)), transparent 38%), ' +
                'radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), calc(var(--lux-color-fade-alpha, .92) * .14)), transparent 38%), ' +
                'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .10)), rgba(10,15,24, calc(var(--lux-transparency-alpha, .92) * .91)) 44%, rgba(7,10,18, calc(var(--lux-transparency-alpha, .92) * .84)))';
        }
        if (!_isHighTransBg && isLmsRoute && (
            el.classList.contains('page-hero') ||
            el.classList.contains('lux-card') ||
            el.classList.contains('lux-status-pill') ||
            el.classList.contains('lux-lms-group-card') ||
            lmsGlassClasses.some((className) => el.classList.contains(className)) ||
            (Boolean(el.closest?.('.lms-quiz-builder')) &&
                lmsQuizBuilderGlassClasses.some((className) => el.classList.contains(className)))
        )) {
            // Match the dashboard color-fade/glow: white highlight radial + accent glow
            // radial + secondary glow radial + linear depth. Smaller LMS chrome (status
            // pills / signal pills) uses a lighter "soft" fade so it does not overpower.
            const isSmallLmsSurface = (
                el.classList.contains('lux-status-pill') ||
                el.classList.contains('lms-clean-signal-pill') ||
                el.classList.contains('lms-clean-mini') ||
                el.classList.contains('lms-clean-action-secondary')
            );
            if (lightMode) {
                if (isSmallLmsSurface) {
                    return 'radial-gradient(circle at 12% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .86) * .62)), transparent 30%), ' +
                        'radial-gradient(circle at 84% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .14)), transparent 34%), ' +
                        'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .045)), rgba(255,255,255, calc(var(--lux-transparency-alpha, .86) * .84)) 46%, rgba(247,241,232, calc(var(--lux-transparency-alpha, .86) * .72)))';
                }
                return 'radial-gradient(circle at 6% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .86) * .88)), transparent 34%), ' +
                    'radial-gradient(circle at 74% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .24)), transparent 42%), ' +
                    'radial-gradient(circle at 100% 96%, rgba(var(--lux-home-secondary-rgb), calc(var(--lux-color-fade-alpha, .86) * .14)), transparent 40%), ' +
                    'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .86) * .065)), rgba(255,255,255, calc(var(--lux-transparency-alpha, .86) * .84)) 44%, rgba(247,241,232, calc(var(--lux-transparency-alpha, .86) * .70)))';
            }
            if (isSmallLmsSurface) {
                return 'radial-gradient(circle at 12% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .92) * .055)), transparent 30%), ' +
                    'radial-gradient(circle at 84% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .16)), transparent 36%), ' +
                    'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .07)), rgba(12,18,30, calc(var(--lux-transparency-alpha, .92) * .82)) 46%, rgba(8,12,21, calc(var(--lux-transparency-alpha, .92) * .72)))';
            }
            return 'radial-gradient(circle at 6% 0%, rgba(255,255,255, calc(var(--lux-color-fade-alpha, .92) * .08)), transparent 32%), ' +
                'radial-gradient(circle at 74% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .28)), transparent 42%), ' +
                'radial-gradient(circle at 100% 96%, rgba(var(--lux-home-secondary-rgb), calc(var(--lux-color-fade-alpha, .92) * .18)), transparent 40%), ' +
                'linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(var(--lux-color-fade-alpha, .92) * .10)), rgba(10,15,24, calc(var(--lux-transparency-alpha, .92) * .91)) 44%, rgba(7,10,18, calc(var(--lux-transparency-alpha, .92) * .84)))';
        }
        if (lightMode) {
            return `linear-gradient(180deg, rgba(255,255,255, ${(0.08 + amount * 0.48).toFixed(2)}), rgba(245,239,229, ${(0.03 + amount * 0.34).toFixed(2)}))`;
        }
        return `linear-gradient(180deg, rgba(14,20,33, ${(amount * 0.94).toFixed(2)}), rgba(8,12,21, ${(amount * 0.72).toFixed(2)}))`;
    };
    const shouldApplyDynamicBackground = (el) =>
        el.classList.contains('lux-card') ||
        el.classList.contains('lux-panel') ||
        el.classList.contains('lux-page-shell') ||
        el.classList.contains('surface-card') ||
        el.classList.contains('content-box') ||
        el.classList.contains('kiu-card') ||
        el.classList.contains('page-hero') ||
        el.classList.contains('schedule-toolbar-host') ||
        el.classList.contains('schedule-toolbar') ||
        el.classList.contains('lux-modern-surface') ||
        el.classList.contains('lux-modern-table') ||
        el.classList.contains('lux-program-hero') ||
        el.classList.contains('lux-program-filter-shell') ||
        el.classList.contains('lux-program-stage') ||
        el.classList.contains('lux-program-overview-card') ||
        el.classList.contains('lux-program-focus-panel') ||
        el.classList.contains('lux-program-publish-pill') ||
        el.classList.contains('lux-program-metric') ||
        el.classList.contains('lux-program-focus-stat') ||
        el.classList.contains('lux-program-semester-chip') ||
        el.classList.contains('lux-module-option') ||
        el.classList.contains('lux-subject-row') ||
        el.id === 'study-card-container' ||
        el.classList.contains('study-card-semester-table') ||
        el.classList.contains('study-card-summary-stage') ||
        el.classList.contains('lux-strip-card') ||
        el.classList.contains('study-card-grade-circle') ||
        el.classList.contains('study-card-assessment-window__chip') ||
        el.classList.contains('study-card-assessment-window__card') ||
        el.classList.contains('study-card-assessment-pill') ||
        el.classList.contains('study-card-term-header') ||
        el.classList.contains('study-card-term-row') ||
        el.classList.contains('study-card-history-section') ||
        el.classList.contains('study-card-history-entry') ||
        el.classList.contains('study-card-history-row') ||
        el.classList.contains('personal-data-toolbar') ||
        el.classList.contains('profile-card') ||
        el.classList.contains('personal-data-stats-card') ||
        el.classList.contains('personal-data-facts-card') ||
        el.classList.contains('personal-data-record-card') ||
        el.classList.contains('personal-data-kpi-card') ||
        el.classList.contains('personal-data-mini') ||
        el.classList.contains('personal-data-record-item') ||
        el.classList.contains('personal-data-card-meta') ||
        el.classList.contains('lux-meta-pair-card') ||
        el.classList.contains('personal-data-hero-panel') ||
        el.classList.contains('newsx-panel') ||
        el.classList.contains('newsx-hero') ||
        el.classList.contains('newsx-feed-card') ||
        el.classList.contains('newsx-filter') ||
        el.classList.contains('newsx-sidebar') ||
        el.classList.contains('newsx-rail') ||
        el.classList.contains('newsx-section') ||
        el.classList.contains('newsx-stat') ||
        el.classList.contains('newsx-private-item') ||
        el.classList.contains('newsx-check') ||
        el.classList.contains('newsx-account-card') ||
        el.classList.contains('newsx-section-btn') ||
        el.classList.contains('newsx-pane-btn') ||
        el.classList.contains('student-service-hero') ||
        el.classList.contains('student-service-hero-aside') ||
        el.classList.contains('student-service-workflow-strip') ||
        el.classList.contains('student-service-workflow-step') ||
        el.classList.contains('student-service-summary-card') ||
        el.classList.contains('student-service-overview') ||
        el.classList.contains('student-service-canvas') ||
        el.classList.contains('student-service-panel') ||
        el.classList.contains('student-service-zone') ||
        el.classList.contains('student-service-area-card') ||
        el.classList.contains('student-service-article-card') ||
        el.classList.contains('student-service-ticket-row') ||
        el.classList.contains('student-service-lane-card') ||
        el.classList.contains('student-service-ticket-card') ||
        el.classList.contains('student-service-ops-card') ||
        el.classList.contains('student-service-track-panel') ||
        el.classList.contains('student-service-article-preview') ||
        el.classList.contains('student-service-ticket-stat') ||
        el.classList.contains('student-service-track-card') ||
        el.classList.contains('student-service-ops-ticket') ||
        el.classList.contains('student-service-ops-lane') ||
        el.classList.contains('student-service-ticket-focus') ||
        el.classList.contains('student-service-ticket-thread') ||
        el.classList.contains('student-service-home-panel') ||
        el.classList.contains('student-service-home-card') ||
        el.classList.contains('student-service-home-ticket') ||
        el.classList.contains('student-service-home-topic') ||
        el.classList.contains('student-service-lane-choice-card') ||
        el.classList.contains('library-page-hero') ||
        el.classList.contains('library-filter-shell') ||
        el.classList.contains('library-catalog-card') ||
        el.classList.contains('library-tabs') ||
        el.classList.contains('library-picker-panel') ||
        el.classList.contains('library-catalog-foot') ||
        el.classList.contains('alib-panel') ||
        el.classList.contains('library-overview-card') ||
        el.classList.contains('library-hero-metric') ||
        el.classList.contains('library-hero-summary-card') ||
        el.classList.contains('library-hero-signal-card') ||
        el.classList.contains('admin-library-metric-card') ||
        el.classList.contains('admin-library-hero-summary-card') ||
        el.classList.contains('admin-library-param-group') ||
        el.classList.contains('admin-library-chip') ||
        (document.body.classList.contains('lux-route-library') && (
            (el.classList.contains('lux-strip-card') && el.closest?.('#page-library')) ||
            (el.classList.contains('lux-hero-signal') && el.closest?.('#page-library')) ||
            (el.classList.contains('lux-picker-btn') && el.closest?.('.library-filter-shell')) ||
            (el.classList.contains('lux-control') && el.closest?.('.library-filter-shell'))
        )) ||
        el.classList.contains('ex2-hero') ||
        el.classList.contains('ex2-panel') ||
        el.classList.contains('ex2-toolbar') ||
        el.classList.contains('ex2-card') ||
        el.classList.contains('ex2-stat-card') ||
        el.classList.contains('ex2-cohort-card') ||
        el.classList.contains('ex2-session-card') ||
        el.classList.contains('ex2-list-card') ||
        el.classList.contains('ex2-question-card') ||
        el.classList.contains('ex2-review-card') ||
        el.classList.contains('ex2-side-card') ||
        el.classList.contains('ex2-select-card') ||
        el.classList.contains('ex2-live-sidebar') ||
        el.classList.contains('ex2-q-card') ||
        el.classList.contains('ex2-q-card-head') ||
        el.classList.contains('ex2-empty-state') ||
        el.classList.contains('ex2-timeline-card') ||
        el.classList.contains('ex2-split-box') ||
        el.classList.contains('ex2-auto-gen-box') ||
        el.classList.contains('ex2-qnav-bar') ||
        el.classList.contains('ex2-progress-step') ||
        el.classList.contains('lux-admin-tools-hero') ||
        el.classList.contains('lux-admin-op-card') ||
        el.classList.contains('lux-admin-ops-panel') ||
        el.classList.contains('lux-admin-provision-card') ||
        el.classList.contains('lux-admin-tools-index-hero') ||
        el.classList.contains('lux-admin-tools-index-panel') ||
        el.classList.contains('lux-admin-tools-index-summary') ||
        el.classList.contains('lux-admin-tools-index-command') ||
        el.classList.contains('lux-admin-tools-index-command-card') ||
        el.classList.contains('lux-admin-tools-index-subpanel') ||
        (document.body.classList.contains('lux-route-admin-tools') && (
            (el.classList.contains('lux-panel') && el.closest?.('#lux-admin-tools-shell')) ||
            (el.classList.contains('lux-card') && el.closest?.('#lux-admin-tools-shell')) ||
            (el.classList.contains('lux-subcard') && el.closest?.('#lux-admin-tools-shell')) ||
            (el.classList.contains('lux-stat-card') && el.closest?.('#lux-admin-tools-shell')) ||
            (el.classList.contains('lux-grid-widget') && el.closest?.('#lux-admin-tools-shell')) ||
            (el.classList.contains('lux-strip-card') && el.closest?.('#lux-admin-tools-shell')) ||
            (el.classList.contains('admin-reg-tab') && el.closest?.('#lux-admin-tools-shell')) ||
            (el.classList.contains('lux-control') && el.closest?.('#lux-admin-tools-shell')) ||
            (el.classList.contains('lux-picker-btn') && el.closest?.('#lux-admin-tools-shell')) ||
            (el.id === 'admin-reg-content-container' && el.closest?.('#lux-admin-tools-shell')) ||
            (el.id === 'curriculum-library-modules-root' && el.closest?.('#lux-admin-tools-shell'))
        )) ||
        (document.body.classList.contains('lux-route-admin-orders') &&
            Boolean(el.closest?.('#admin-orders-root, #modal-studio')) && (
            el.classList.contains('orders-admin-shell') ||
            el.classList.contains('orders-admin-hero') ||
            el.classList.contains('orders-admin-panel') ||
            el.classList.contains('orders-admin-hero-side') ||
            el.classList.contains('orders-detail-panel') ||
            el.classList.contains('orders-admin-table-wrap') ||
            el.classList.contains('admin-orders-studio') ||
            el.classList.contains('orders-metric-card') ||
            el.classList.contains('orders-recipient-row') ||
            el.classList.contains('orders-recipient-card') ||
            el.classList.contains('orders-attachment-card') ||
            el.classList.contains('orders-detail-empty') ||
            el.classList.contains('orders-detail-card') ||
            el.classList.contains('orders-recipient-list-shell') ||
            el.classList.contains('orders-recipient-list-empty') ||
            el.classList.contains('lux-hero-side-head') ||
            el.classList.contains('lux-hero-signal') ||
            el.classList.contains('lux-stat-card') ||
            el.classList.contains('lux-card') ||
            el.classList.contains('lux-control') ||
            el.classList.contains('lux-status-pill') ||
            el.classList.contains('lux-primary-btn') ||
            el.classList.contains('lux-secondary-btn') ||
            el.classList.contains('admin-orders-studio-card') ||
            el.classList.contains('admin-orders-palette-option') ||
            el.classList.contains('admin-orders-mode-btn') ||
            el.classList.contains('admin-orders-background-btn') ||
            el.classList.contains('admin-orders-apply-btn')
        )) ||
        (document.body.classList.contains('lux-route-social') && (
            el.classList.contains('social-hero') ||
            el.classList.contains('social-card') ||
            el.classList.contains('social-post-card') ||
            el.classList.contains('social-mini-card') ||
            el.classList.contains('social-detail-card') ||
            el.classList.contains('social-neo-card') ||
            SOCIAL_NEO_TRANSPARENCY_SURFACE_CLASSES.some((className) => el.classList.contains(className)) ||
            el.parentElement?.classList?.contains('social-neo-stat-grid') ||
            [...el.classList].some((className) =>
                className.startsWith('social-neo-') ||
                className.startsWith('social-project') ||
                className.startsWith('social-portfolio')
            )
        )) ||
        (document.body.classList.contains('lux-route-staff') && Boolean(el.closest?.('#staff-content')) && (
            el.classList.contains('staff-hub-hero') ||
            el.classList.contains('staff-hub-command-panel') ||
            el.classList.contains('staff-hub-command-card') ||
            el.classList.contains('staff-hub-focus-card') ||
            el.classList.contains('staff-hub-mini-card') ||
            el.classList.contains('staff-hub-metric-card') ||
            el.classList.contains('staff-hub-controls') ||
            el.classList.contains('staff-hub-directory-panel') ||
            el.classList.contains('staff-hub-profile') ||
            el.classList.contains('staff-hub-info-card') ||
            el.classList.contains('staff-hub-warning') ||
            el.classList.contains('staff-hub-modal') ||
            el.classList.contains('staff-hub-list-item') ||
            el.classList.contains('admin-directory-hero') ||
            el.classList.contains('admin-directory-controls') ||
            el.classList.contains('admin-directory-card') ||
            el.classList.contains('lux-card') ||
            el.classList.contains('lux-person-card') ||
            el.classList.contains('lux-subcard') ||
            el.classList.contains('surface-card') ||
            el.classList.contains('content-box')
        )) ||
        (document.body.classList.contains('lux-route-students-admin') &&
            Boolean(el.closest?.('#students-content')) &&
            !el.closest?.('#students-admin-lms-modal') && (
            el.classList.contains('students-lms-hero') ||
            el.classList.contains('students-lms-profile-header') ||
            el.classList.contains('students-lms-panel') ||
            el.classList.contains('students-lms-stat-card') ||
            el.classList.contains('students-lms-profile-card') ||
            el.classList.contains('students-lms-table-shell') ||
            el.classList.contains('students-lms-list-item') ||
            el.classList.contains('students-lms-modal-card')
        )) ||
        registrationGlassClasses.some((className) => el.classList.contains(className)) ||
        (document.body.classList.contains('lux-route-admin-scheduler') && Boolean(el.closest?.('#page-admin-scheduler')) && (
            schedulerGlassClasses.some((className) => el.classList.contains(className)) ||
            ((el.tagName === 'SELECT' || el.tagName === 'INPUT') &&
                el.closest?.('.sch-control-group, .sch-board-toolbar-row, .sch-search-shell, .sch-modal'))
        )) ||
        lmsGlassClasses.some((className) => el.classList.contains(className)) ||
        (isLmsRoute && Boolean(el.closest?.('.lms-quiz-builder')) &&
            lmsQuizBuilderGlassClasses.some((className) => el.classList.contains(className)));

    const isStudyCardGradebookProgressSegment = (el) => (
        document.body.classList.contains('lux-route-study-card') &&
        el.tagName === 'SPAN' &&
        Boolean(el.closest?.(
            '.study-card-assessment-window__body--gradebook .gb-composition-bar, ' +
            '.study-card-assessment-window__body--gradebook .gb-weight-track'
        ))
    );

    const isTimetableLayoutWrapper = (el) => document.body.classList.contains('lux-route-timetable') && (
        el.classList.contains('lux-timetable-controls') ||
        el.classList.contains('schedule-toolbar-host') ||
        el.classList.contains('schedule-toolbar') ||
        el.classList.contains('lux-timetable-view-row') ||
        el.classList.contains('schedule-view-row') ||
        el.classList.contains('lux-timetable-command-grid') ||
        el.classList.contains('lux-timetable-grid-shell') ||
        (el.classList.contains('schedule-grid-shell') && el.dataset?.ttGrid === '1')
    );

    // KEY FIX: Use CSS custom properties to override !important rules
    // CSS variables can be set via JavaScript and will work with !important in CSS
    document.documentElement.style.setProperty('--lux-transparency-blur', `${blurAmount}px`);
    document.documentElement.style.setProperty('--lux-transparency-saturate', `${saturateAmount}%`);
    document.documentElement.style.setProperty('--lux-transparency-percentage', `${percentage}%`);
    const rootComputedStyle = window.getComputedStyle(document.documentElement);
    const transparencySignature = [
        percentage,
        document.body.classList.contains('lux-light-mode') ? 'light' : 'dark',
        rootComputedStyle.getPropertyValue('--lux-glass-tint-rgb').trim(),
        rootComputedStyle.getPropertyValue('--lux-accent-rgb').trim(),
        rootComputedStyle.getPropertyValue('--lux-topbar-tint-rgb').trim()
    ].join('|');

    // COMPREHENSIVE: Get ALL elements that could be widgets/panels/cards
    // Use multiple selector strategies to catch everything
    const allSelectors = window.__luxTransparencyAllSelectors || (window.__luxTransparencyAllSelectors = [
        // Luxury dashboard elements
        '.lux-card', '.lux-panel', '.lux-dashboard-section', '.lux-hero',
        '.lux-grid-widget', '.lux-home-card', '.lux-admin-ops-card',
        '.lux-home-toolbar',
        '.lux-builder-card', '.lux-builder-section',
        '.lux-page-shell', '.lux-stat-card', '.lux-stat',

        // Generic surface/card elements
        '.surface-card', '.content-box', '.kiu-card', '.page-card',
        '.section-card', '.panel-card', '.dashboard-card',
        '.tabs-container', '.modal-content', '.page-hero',
        ...registrationGlassSelectors,
        ...schedulerGlassSelectors,
        ...lmsGlassSelectors,

        // Programs page large surfaces
        '.lux-program-hero', '.lux-program-filter-shell', '.lux-program-stage',
        '.lux-program-overview-card', '.lux-program-focus-panel',
        '.lux-program-publish-pill', '.lux-program-metric',
        '.lux-program-focus-stat', '.lux-program-semester-chip',
        '.lux-module-option', '.lux-subject-row',

        // Study Card surfaces
        '#study-card-container', '.study-card-semester-table', '.study-card-summary-stage',
        '.study-card-grade-circle', '.study-card-assessment-window__chip',
        '.study-card-assessment-window__card', '.study-card-assessment-pill',
        '.study-card-term-header', '.study-card-term-row',
        '.study-card-history-section', '.study-card-history-entry', '.study-card-history-row',
        '#study-card-container .lux-strip-card',

        // Personal Data surfaces
        '.personal-data-toolbar', '.profile-card', '.personal-data-stats-card',
        '.personal-data-facts-card', '.personal-data-record-card',
        '.personal-data-kpi-card', '.personal-data-mini', '.personal-data-record-item',
        '.personal-data-card-meta', '.lux-meta-pair-card', '.personal-data-hero-panel',
        '#page-personal-data .lux-strip-card',

        // News workspace surfaces
        '.newsx-panel', '.newsx-hero', '.newsx-feed-card', '.newsx-filter',
        '.newsx-sidebar', '.newsx-rail', '.newsx-section', '.newsx-stat',
        '.newsx-private-item', '.newsx-check', '.newsx-account-card',
        '.newsx-section-btn', '.newsx-pane-btn',

        // Student Service large surfaces
        '.student-service-hero', '.student-service-hero-aside',
        '.student-service-workflow-strip', '.student-service-workflow-step',
        '.student-service-summary-card', '.student-service-overview',
        '.student-service-canvas', '.student-service-panel', '.student-service-zone',
        '.student-service-area-card', '.student-service-article-card',
        '.student-service-ticket-row',
        '.student-service-lane-card', '.student-service-ticket-card',
        '.student-service-ops-card', '.student-service-track-panel',
        '.student-service-article-preview', '.student-service-ticket-stat',
        '.student-service-track-card', '.student-service-ops-ticket',
        '.student-service-ops-lane', '.student-service-ticket-focus',
        '.student-service-ticket-thread', '.student-service-home-panel',
        '.student-service-home-card', '.student-service-home-ticket',
        '.student-service-home-topic',         '.student-service-lane-choice-card',

        // Social large surfaces
        '.social-hero', '.social-card', '.social-post-card', '.social-mini-card',
        '.social-detail-card', '.social-neo-card',
        ...SOCIAL_NEO_TRANSPARENCY_SURFACE_SELECTORS,

        // Staff command center surfaces
        ...STAFF_ROUTE_TRANSPARENCY_SURFACE_SELECTORS,
        '#staff-content .lux-card', '#staff-content .lux-person-card',
        '#staff-content .lux-subcard', '#staff-content .surface-card',
        '#staff-content .content-box', '#staff-content .lux-strip-card',
        '#staff-content .lux-data-card',

        // Students admin LMS surfaces
        ...STUDENTS_ADMIN_ROUTE_TRANSPARENCY_SURFACE_SELECTORS,

        // Library large surfaces
        '.library-page-hero', '.library-filter-shell', '.library-catalog-card',
        '.library-tabs', '.library-picker-panel', '.library-catalog-foot',
        '.alib-panel',
        '#page-library .alib-panel', '#page-library .lux-strip-card', '.library-overview-card',
        '.library-hero-metric', '.library-hero-summary-card', '.library-hero-signal-card',
        '.admin-library-metric-card', '.admin-library-hero-summary-card',
        '.admin-library-param-group', '.admin-library-chip',
        '.library-filter-shell .lux-picker-btn', '.library-filter-shell .lux-control',

        // Exams large surfaces
        '.ex2-hero', '.ex2-panel', '.ex2-toolbar', '.ex2-card',
        '.ex2-stat-card', '.ex2-cohort-card', '.ex2-session-card',
        '.ex2-list-card', '.ex2-question-card', '.ex2-review-card',
        '.ex2-side-card', '.ex2-select-card', '.ex2-live-sidebar',
        '.ex2-q-card', '.ex2-q-card-head', '.ex2-empty-state',
        '.ex2-timeline-card', '.ex2-split-box', '.ex2-auto-gen-box',
        '.ex2-qnav-bar', '.ex2-progress-step', '.ex2-mini-grid > div',

        // Admin Tools large surfaces
        '.lux-admin-tools-hero', '.lux-admin-op-card', '.lux-admin-ops-panel',
        '.lux-admin-provision-card', '.lux-admin-tools-index-hero',
        '.lux-admin-tools-index-panel', '.lux-admin-tools-index-command',
        '#lux-admin-tools-shell .lux-panel',
        '#lux-admin-tools-shell .lux-card',
        '#lux-admin-tools-shell .lux-subcard',
        '#lux-admin-tools-shell .lux-stat-card',
        '#lux-admin-tools-shell .lux-grid-widget',
        '#lux-admin-tools-shell .lux-strip-card',
        '#lux-admin-tools-shell .admin-reg-tab',
        '#lux-admin-tools-shell .lux-control',
        '#lux-admin-tools-shell .lux-picker-btn',
        '#lux-admin-tools-shell #admin-reg-content-container',
        '#lux-admin-tools-shell #curriculum-library-modules-root',
        '.lux-admin-tools-index-summary', '.lux-admin-tools-index-command-card',
        '.lux-admin-tools-index-subpanel',

        // Staff directory elements
        '.lux-person-card', '.lux-subcard', '.lux-stack', '.lux-person-head',
        '.lux-inline-meta', '.lux-card-actions',

        // Widget structural elements
        '.lux-grid-widget-body', '.lux-widget-container',
        '.lux-card-head', '.lux-card-body', '.lux-panel-body',

        // Admin Orders specific elements
        '.lux-page-kicker', '.lux-status-pill',
        '#admin-orders-root .orders-admin-shell', '#admin-orders-root .orders-admin-hero',
        '#admin-orders-root .orders-admin-panel', '#admin-orders-root .orders-admin-hero-side',
        '#admin-orders-root .orders-detail-panel', '#admin-orders-root .orders-admin-table-wrap',
        '#admin-orders-root .orders-metric-card', '#admin-orders-root .orders-recipient-row',
        '#admin-orders-root .orders-recipient-card', '#admin-orders-root .orders-attachment-card',
        '#admin-orders-root .orders-detail-empty', '#admin-orders-root .orders-detail-card',
        '#admin-orders-root .orders-recipient-list-shell', '#admin-orders-root .orders-recipient-list-empty',
        '#admin-orders-root .lux-hero-side-head', '#admin-orders-root .lux-hero-signal',
        '#admin-orders-root .lux-stat-card', '#admin-orders-root .lux-card',
        '#admin-orders-root .lux-control', '#admin-orders-root .lux-primary-btn',
        '#admin-orders-root .lux-secondary-btn',
        '#modal-studio.admin-orders-studio', '#modal-studio .admin-orders-studio-card',
        '#modal-studio .admin-orders-palette-option', '#modal-studio .admin-orders-mode-btn',
        '#modal-studio .admin-orders-background-btn', '#modal-studio .admin-orders-apply-btn',
        '#modal-studio .lux-control',

        // Schedule/Timetable specific elements
        '.schedule-chip', '.schedule-view-switcher', '.schedule-week-arrow',
        '.schedule-toolbar-host', '.schedule-toolbar', '.schedule-week-nav',
        '.schedule-overview-row', '.schedule-view-row',

        // Form controls that need transparency
        '.lux-control',

        ...LUX_MODERN_TRANSPARENCY_SURFACE_SELECTORS
    ]);

    const surfaceElements = getCachedTransparencySurfaceElements(allSelectors, scopedRoots);

    surfaceElements.forEach(el => {
        // Skip if element is hidden
        if (el.offsetParent === null && el.style.display === 'none') return;
        const isCareerMarketSurface = Boolean(el.closest?.('#page-career-market'));
        if (isCareerMarketSurface) {
            el.style.removeProperty('background-color');
            el.style.removeProperty('background');
            el.style.removeProperty('backdrop-filter');
            el.style.removeProperty('-webkit-backdrop-filter');
            delete el.dataset.luxTransparencySignature;
            return;
        }
        const isOrdersInboxSurface = Boolean(el.closest?.(
            '#page-orders .orders-inbox-shell, #orders-inbox-root .orders-inbox-shell, #admin-orders-root .orders-inbox-shell'
        ));
        if (isOrdersInboxSurface) {
            el.style.removeProperty('background-color');
            el.style.removeProperty('background');
            el.style.removeProperty('backdrop-filter');
            el.style.removeProperty('-webkit-backdrop-filter');
            delete el.dataset.luxTransparencySignature;
            return;
        }
        if (isTimetableLayoutWrapper(el)) {
            el.style.removeProperty('background-color');
            el.style.removeProperty('background');
            el.style.removeProperty('backdrop-filter');
            el.style.removeProperty('-webkit-backdrop-filter');
            delete el.dataset.luxTransparencySignature;
            return;
        }
        if (isStudyCardGradebookProgressSegment(el)) {
            el.style.removeProperty('background-color');
            el.style.removeProperty('background');
            el.style.removeProperty('backdrop-filter');
            el.style.removeProperty('-webkit-backdrop-filter');
            delete el.dataset.luxTransparencySignature;
            return;
        }
        if (el.closest?.('#kiu-structured-form-modal')) {
            el.style.removeProperty('background-color');
            el.style.removeProperty('background');
            el.style.removeProperty('backdrop-filter');
            el.style.removeProperty('-webkit-backdrop-filter');
            delete el.dataset.luxTransparencySignature;
            return;
        }
        if (el.closest?.('#course-selection-modal-bg')) {
            el.style.removeProperty('background-color');
            el.style.removeProperty('background');
            el.style.removeProperty('backdrop-filter');
            el.style.removeProperty('-webkit-backdrop-filter');
            delete el.dataset.luxTransparencySignature;
            return;
        }
        if (el.closest?.('#schModalOverlay') || el.closest?.('#schPresetManagerOverlay')) {
            el.style.removeProperty('background-color');
            el.style.removeProperty('background');
            el.style.removeProperty('backdrop-filter');
            el.style.removeProperty('-webkit-backdrop-filter');
            delete el.dataset.luxTransparencySignature;
            return;
        }
        if (
            document.body.classList.contains('lux-route-admin-tools') &&
            Boolean(el.closest?.('#lux-admin-tools-shell')) &&
            (
                (el.closest?.('.lux-admin-tools-index-panel') && !el.classList.contains('lux-admin-tools-index-panel') && (
                    el.classList.contains('lux-admin-tools-index-panel-shell') ||
                    el.classList.contains('lux-admin-tools-index-subpanel') ||
                    el.classList.contains('curriculum-library-module-option') ||
                    el.id === 'curriculum-library-modules-root' ||
                    el.id === 'admin-reg-content-container'
                )) ||
                (el.closest?.('.lux-curriculum-subject-card') && !el.classList.contains('lux-curriculum-subject-card')) ||
                el.classList.contains('lux-curriculum-subject-card__head') ||
                el.classList.contains('lux-curriculum-subject-card__body') ||
                el.classList.contains('lux-curriculum-subject-card__footer') ||
                el.classList.contains('lux-curriculum-subject-card__chips') ||
                el.closest?.('.lux-curriculum-subject-card__chips') ||
                el.classList.contains('curriculum-library-panel--detail') ||
                el.classList.contains('curriculum-library-panel') ||
                el.classList.contains('curriculum-library-row-list')
            )
        ) {
            el.style.removeProperty('background-color');
            el.style.removeProperty('background');
            el.style.removeProperty('backdrop-filter');
            el.style.removeProperty('-webkit-backdrop-filter');
            delete el.dataset.luxTransparencySignature;
            return;
        }

        // Detect current mode
        const isLightMode = document.body.classList.contains('lux-light-mode');

        if (fillRatio > 0) {
            const alpha = fillRatio;
            if (applyStudentsAdminManagedSurface(el, percentage, transparencySignature)) {
                return;
            }
            if (!forceRefresh && el.dataset.luxTransparencySignature === transparencySignature) return;
            if (isStructuralSurface(el)) {
                el.style.removeProperty('background-color');
                el.style.removeProperty('background');
                el.style.removeProperty('backdrop-filter');
                el.style.removeProperty('-webkit-backdrop-filter');
                el.dataset.luxTransparencySignature = transparencySignature;
                return;
            }

            // Smart glass effect: preserve existing backgrounds
            const computedStyle = window.getComputedStyle(el);
            const existingBackground = computedStyle.backgroundImage;

            // Check if element has gradient or complex background from CSS
            const hasComplexBackground = existingBackground &&
                (existingBackground.includes('gradient') ||
                    existingBackground.includes('radial') ||
                    existingBackground.includes('linear'));

            const isSocialRouteSurface = document.body.classList.contains('lux-route-social');
            const keepSocialFadeCss = shouldKeepSocialFadeCssBackground(el);
            const keepAdminLibraryFadeCss = shouldKeepAdminLibraryFadeCssBackground(el);
            // Real social surfaces now frost like admin-tools; only layout
            // wrappers (non-paint surfaces) keep blur suppressed.
            const suppressBlur = isSocialRouteSurface &&
                shouldApplyDynamicBackground(el) &&
                !isSocialPaintSurface(el) &&
                !isSocialBlurHost(el);
            const backdropValue = (suppressBlur || keepSocialFadeCss || keepAdminLibraryFadeCss)
                ? 'none'
                : `blur(${blurAmount}px) saturate(${saturateAmount}%)`;

            if (hasComplexBackground) {
                // For elements with CSS gradients: apply backdrop-filter AND override background with dynamic alpha
                el.style.setProperty('backdrop-filter', backdropValue, 'important');
                el.style.setProperty('-webkit-backdrop-filter', backdropValue, 'important');

                // CRITICAL FIX: Override hardcoded gradient backgrounds with dynamic alpha
                // This handles .lux-card and similar elements that use hardcoded alpha values
                if (shouldApplyDynamicBackground(el) && !keepSocialFadeCss && !keepAdminLibraryFadeCss) {
                    if (isLightMode) {
                        // Light mode: warm cream gradient with dynamic alpha
                        el.style.setProperty('background',
                            buildDynamicSurfaceBackground(el, true, surfaceFillAmount),
                            'important');
                    } else {
                        // Dark mode: navy gradient with dynamic alpha
                        el.style.setProperty('background',
                            buildDynamicSurfaceBackground(el, false, surfaceFillAmount),
                            'important');
                    }
                }
            } else {
                // For simple elements: apply blur only, let CSS handle backgrounds
                el.style.setProperty('backdrop-filter', backdropValue, 'important');
                el.style.setProperty('-webkit-backdrop-filter', backdropValue, 'important');
                if (
                    !keepSocialFadeCss &&
                    !keepAdminLibraryFadeCss &&
                    (
                        registrationGlassClasses.some(className => el.classList.contains(className)) ||
                        (document.body.classList.contains('lux-route-admin-scheduler') && Boolean(el.closest?.('#page-admin-scheduler')) && (
                            schedulerGlassClasses.some(className => el.classList.contains(className)) ||
                            ((el.tagName === 'SELECT' || el.tagName === 'INPUT') &&
                                el.closest?.('.sch-control-group, .sch-board-toolbar-row, .sch-search-shell, .sch-modal'))
                        )) ||
                        lmsGlassClasses.some(className => el.classList.contains(className)) ||
                        shouldApplyDynamicBackground(el)
                    )
                ) {
                    if (isLightMode) {
                        el.style.setProperty('background',
                            buildDynamicSurfaceBackground(el, true, surfaceFillAmount),
                            'important');
                    } else {
                        el.style.setProperty('background',
                            buildDynamicSurfaceBackground(el, false, surfaceFillAmount),
                            'important');
                    }
                }
            }
            el.dataset.luxTransparencySignature = transparencySignature;
        } else {
            // Remove transparency - clear inline styles to let CSS take over
            el.style.removeProperty('background-color');
            el.style.removeProperty('background');
            el.style.removeProperty('backdrop-filter');
            el.style.removeProperty('-webkit-backdrop-filter');
            delete el.dataset.luxTransparencySignature;
        }
    });

    // Store current percentage for MutationObserver
    window.__currentTransparency = percentage;

    // FOUC PREVENTION: Only remove the pending class if surfaces were actually styled.
    // If no surfaces exist yet, keep the class — the MutationObserver will catch
    // newly added surfaces and trigger updateTransparency() again.
    if (surfaceElements.length > 0) {
        document.documentElement.classList.remove('lux-transparency-pending');
    }
}

/**
 * Set up MutationObserver to apply transparency to dynamically added elements
 */
function isLuxTransparencyExemptSubtree(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;
    if (node.closest && node.closest('[data-lux-transparency-exempt="1"]')) return true;
    return false;
}

function setupTransparencyObserver() {
    if (window.__transparencyObserver) return; // Already set up

    const observer = new MutationObserver((mutations) => {
        const transparency = window.__currentTransparency || 0;
        if (transparency === 0) return; // No need to observe if transparency is off

        let needsUpdate = false;
        const pendingRoots = new Set();

        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType !== Node.ELEMENT_NODE) continue;
                if (isLuxTransparencyExemptSubtree(node)) continue;
                if (
                    (node.matches && node.matches(SHARED_TRANSPARENCY_OBSERVER_SELECTOR)) ||
                    (node.querySelector && node.querySelector(SHARED_TRANSPARENCY_OBSERVER_SELECTOR))
                ) {
                    needsUpdate = true;
                    pendingRoots.add(node);
                }
            }
        }

        // Re-apply transparency if new elements were added, but debounce the full pass.
        if (needsUpdate && transparency > 0) {
            resetTransparencySurfaceCache();
            window.clearTimeout(window.__transparencyRefreshTimer);
            var _debounceMs = window.__luxIsAnimating ? 420 : 220;
            window.__transparencyRefreshTimer = window.setTimeout(() => {
                window.__transparencyRefreshTimer = null;
                const scopedRoots = Array.from(pendingRoots).filter((root) => root && root.isConnected);
                const runTransparencyRefresh = () => {
                    requestAnimationFrame(() => {
                        if (scopedRoots.length) {
                            refreshLuxuryTransparencySurfaces(window.__currentTransparency || transparency, { roots: scopedRoots });
                            return;
                        }
                        updateTransparency(window.__currentTransparency || transparency);
                    });
                };
                if (typeof window.requestIdleCallback === 'function') {
                    window.requestIdleCallback(runTransparencyRefresh, { timeout: 900 });
                } else {
                    runTransparencyRefresh();
                }
            }, _debounceMs);
        }
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    window.__transparencyObserver = observer;
}

/**
 * Set panel transparency mode (legacy support)
 * @param {string} mode - 'on' or 'off'
 */
function setTransparency(mode) {
    if (mode === 'on') {
        updateTransparency(13); // Default to 13%
    } else {
        updateTransparency(0);
    }
}

function refreshLuxuryTransparencySurfaces(value, options = {}) {
    const savedValue = value ?? localStorage.getItem('kiuLuxurySurfaceTransparency') ?? window.__currentTransparency ?? 13;
    const percentage = parseInt(savedValue, 10);
    if (!Number.isFinite(percentage)) return;
    const scopedRoots = normalizeTransparencyRoots(options?.roots);
    if (!scopedRoots.length) {
        resetTransparencySurfaceCache();
    }
    collectTransparencySurfaceElements(['[data-lux-transparency-signature]'], scopedRoots).forEach((el) => {
        delete el.dataset.luxTransparencySignature;
    });
    updateTransparency(percentage, { force: true, persist: false, roots: scopedRoots });
}

function queueLuxuryTransparencyRefresh(value, options = {}) {
    const run = () => refreshLuxuryTransparencySurfaces(value, options);
    if (typeof window.__kiuQueueLuxuryRefreshOperation === 'function') {
        window.__kiuQueueLuxuryRefreshOperation(run);
        return;
    }
    window.clearTimeout(window.__luxTransparencyPaletteRefreshTimer);
    window.__luxTransparencyPaletteRefreshTimer = window.setTimeout(() => {
        window.__luxTransparencyPaletteRefreshTimer = null;
        if (typeof window.requestAnimationFrame === 'function') {
            window.requestAnimationFrame(run);
        } else {
            run();
        }
    }, 0);
}

function scheduleLuxuryTransparencyBootRefresh(value) {
    const refresh = () => queueLuxuryTransparencyRefresh(value, { persist: false });
    refresh();
    window.clearTimeout(window.__luxTransparencyBootRefreshTimer);
    window.__luxTransparencyBootRefreshTimer = window.setTimeout(() => {
        window.__luxTransparencyBootRefreshTimer = null;
        refresh();
    }, 240);
}

window.updateTransparency = updateTransparency;
window.refreshLuxuryTransparencySurfaces = refreshLuxuryTransparencySurfaces;
window.queueLuxuryTransparencyRefresh = queueLuxuryTransparencyRefresh;
window.scheduleLuxuryTransparencyBootRefresh = scheduleLuxuryTransparencyBootRefresh;
window.buildLuxuryTransparencyModel = buildLuxuryTransparencyModel;
window.mapLuxuryTransparencyFillRatio = mapLuxuryTransparencyFillRatio;
window.clampLuxuryTransparencyPercentage = clampLuxuryTransparencyPercentage;

/**
 * Initialize palette on page load
 */
function initPalette() {
    try {
        const legacyMode = localStorage.getItem('kiu-interface-mode') || '';
        const legacyLightMode = localStorage.getItem('kiuLuxuryLightMode') || '';
        const savedMode = localStorage.getItem('kiu-interface-mode');
        const savedPalette = localStorage.getItem('kiu-palette');
        if (typeof window.applyThemeMode === 'function' && typeof window.syncAll === 'function') {
            const luxuryThemeMode = localStorage.getItem('kiuLuxuryThemeMode') || '';
            const migratedMode = !luxuryThemeMode
                ? (legacyMode || (legacyLightMode === '1' ? 'light' : legacyLightMode === '0' ? 'dark' : ''))
                : '';
            if (migratedMode) {
                window.applyThemeMode(migratedMode, true);
            }
            if (!localStorage.getItem('kiuLuxuryPalette') && savedPalette && typeof window.applyPaletteKey === 'function') {
                window.applyPaletteKey(savedPalette, true);
            }
            window.syncAll();
            setupTransparencyObserver();
            // Safety: ensure lux-transparency-pending is removed even if observer never fires
            setTimeout(() => {
                document.documentElement.classList.remove('lux-transparency-pending');
            }, 2000);
            const syncedTransparency = localStorage.getItem('kiuLuxurySurfaceTransparency');
            if (syncedTransparency && typeof window.scheduleLuxuryTransparencyBootRefresh === 'function') {
                const percentage = parseInt(syncedTransparency, 10);
                window.scheduleLuxuryTransparencyBootRefresh(percentage);
                const slider = document.getElementById('transparency-slider');
                if (slider) {
                    slider.value = percentage;
                }
            }
            return;
        }
        if (savedMode) {
            setInterfaceMode(savedMode);
        }
        if (savedPalette && !savedMode) {
            applyPalette(savedPalette);
        }

        // Set up MutationObserver for dynamic content
        setupTransparencyObserver();
        // Safety: ensure lux-transparency-pending is removed even if observer never fires
        setTimeout(() => {
            document.documentElement.classList.remove('lux-transparency-pending');
        }, 2000);

        // Restore transparency mode
        const savedTransparency = localStorage.getItem('kiuLuxurySurfaceTransparency');
        if (savedTransparency) {
            const percentage = parseInt(savedTransparency);
            scheduleLuxuryTransparencyBootRefresh(percentage);

            // Update slider position if it exists
            const slider = document.getElementById('transparency-slider');
            if (slider) {
                slider.value = percentage;
            }
        }
    } catch (e) {
        console.warn('Palette init error:', e);
    }
}

// Auto-initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPalette);
} else {
    initPalette();
}

// GUARANTEED CATCH-ALL: Re-apply transparency after ALL scripts have rendered.
// DOMContentLoaded fires before page-specific scripts render cards.
// window 'load' fires after everything is done - final safety net.
window.addEventListener('load', function() {
    var _saved = localStorage.getItem('kiuLuxurySurfaceTransparency');
    if (_saved) {
        var _pct = parseInt(_saved, 10);
        if (_pct > 0) {
            setTimeout(function() {
                scheduleLuxuryTransparencyBootRefresh(_pct);
            }, 50);
        }
    }
});

window.addEventListener('pageshow', function() {
    var _saved = localStorage.getItem('kiuLuxurySurfaceTransparency');
    var _pct = parseInt(_saved || window.__currentTransparency || '13', 10);
    if (_pct > 0) {
        scheduleLuxuryTransparencyBootRefresh(_pct);
    }
});

// ============================================
// Colour & Motion Studio Functions
// ============================================



function formatLmsDateTime(value) {
    if (!value) return 'No deadline';
    const normalized = String(value).replace('T', ' ');
    return normalized.length > 16 ? normalized.slice(0, 16) : normalized;
}
