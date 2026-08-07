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
            if (typeof setActiveSessionUserByRole === 'function') {
                setActiveSessionUserByRole(requestedRole);
            }
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
        const configs = window.SEMESTER_DROPDOWN_CONFIGS || [
            { id: 'filter-curriculum-semester', includeAll: true, includeCustom: true, numberPrefix: 'Sem' },
            { id: 'admin-active-semester', includeCustom: true, numberPrefix: 'Semester' },
            { id: 'admin-tt-semester', includeCustom: true, numberPrefix: 'Sem' },
            { id: 'admin-generate-semester', includeCustom: true, numberPrefix: 'Sem' },
            { id: 'stu-reg-semester', includeCustom: true, numberPrefix: 'Semester' },
            { id: 'new-user-semester', includeCustom: true, numberPrefix: 'Semester' }
        ];

        if (typeof populateSemesterSelectOptions !== 'function') return;
        configs.forEach((cfg) => {
            document.querySelectorAll(`#${cfg.id}`).forEach((selectEl) => {
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
 * @param {string} palette - Palette name: obsidian-amber, slate-sapphire, pine-jade, burgundy-rose, sand-pearl, ink-orchid, ocean-teal, platinum-silver
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
    const paletteList = ['obsidian-amber', 'slate-sapphire', 'pine-jade', 'burgundy-rose', 'sand-pearl', 'ink-orchid', 'ocean-teal', 'platinum-silver'];
    paletteList.forEach(p => {
        document.body.classList.remove(`palette-${p}`);
    });

    // Add new palette class - CSS handles background now
    if (palette && palette.trim() && paletteList.includes(palette)) {
        document.body.classList.add(`palette-${palette}`);
        localStorage.setItem('kiu-palette', palette);
    }

    if (typeof window.queueLuxuryTransparencyRefresh === 'function') {
        window.queueLuxuryTransparencyRefresh();
    }

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

    // Re-apply transparency when the optional engine is ready. Its script may
    // load after this shared utility on legacy/deferred entry points.
    const saved = localStorage.getItem('kiuLuxurySurfaceTransparency') || '13';
    if (typeof window.refreshLuxuryTransparencySurfaces === 'function') {
        window.refreshLuxuryTransparencySurfaces(parseInt(saved, 10));
    } else if (typeof window.scheduleLuxuryTransparencyBootRefresh === 'function') {
        window.scheduleLuxuryTransparencyBootRefresh(parseInt(saved, 10));
    }
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

/* Panel transparency engine: assets/js/shared/lux-transparency.js (loaded after this file). */


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
            if (typeof setupTransparencyObserver === 'function') setupTransparencyObserver();
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

        // Set up MutationObserver for dynamic content (lux-transparency.js)
        if (typeof setupTransparencyObserver === 'function') setupTransparencyObserver();
        // Safety: ensure lux-transparency-pending is removed even if observer never fires
        setTimeout(() => {
            document.documentElement.classList.remove('lux-transparency-pending');
        }, 2000);

        // Restore transparency mode
        const savedTransparency = localStorage.getItem('kiuLuxurySurfaceTransparency');
        if (savedTransparency) {
            const percentage = parseInt(savedTransparency);
            if (typeof scheduleLuxuryTransparencyBootRefresh === 'function') scheduleLuxuryTransparencyBootRefresh(percentage);

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
                if (typeof scheduleLuxuryTransparencyBootRefresh === 'function') scheduleLuxuryTransparencyBootRefresh(_pct);
            }, 50);
        }
    }
});

window.addEventListener('pageshow', function() {
    var _saved = localStorage.getItem('kiuLuxurySurfaceTransparency');
    var _pct = parseInt(_saved || window.__currentTransparency || '13', 10);
    if (_pct > 0 && typeof scheduleLuxuryTransparencyBootRefresh === 'function') {
        scheduleLuxuryTransparencyBootRefresh(_pct);
    }
});

// ============================================
// Popup motion (glass overlays + hub modals)
// ============================================

if (typeof window.openLuxGlassDialogOverlay !== 'function') {
    const LUX_POPUP_OPEN_MS = 240;
    const LUX_POPUP_CLOSE_MS = 180;

    window.LUX_POPUP_OPEN_MS = LUX_POPUP_OPEN_MS;
    window.LUX_POPUP_CLOSE_MS = LUX_POPUP_CLOSE_MS;

    function luxPopupScheduleOpen(callback) {
        const tick = typeof window.requestAnimationFrame === 'function'
            ? window.requestAnimationFrame.bind(window)
            : (cb) => window.setTimeout(cb, 0);
        tick(() => tick(callback));
    }

    window.openLuxGlassDialogOverlay = function openLuxGlassDialogOverlay(overlay) {
        if (!overlay) return;
        overlay.classList.remove('is-closing');
        luxPopupScheduleOpen(() => overlay.classList.add('is-open'));
    };

        window.closeLuxGlassDialogOverlay = function closeLuxGlassDialogOverlay(overlay, options = {}) {
            if (!overlay) return;
            if (options.instant) {
                overlay.remove();
                options.onDone?.();
                return;
            }
            if (overlay.classList.contains('is-closing')) return;
            overlay.classList.remove('is-open');
            overlay.classList.add('is-closing');

            let finished = false;
            const done = () => {
                if (finished) return;
                finished = true;
                overlay.classList.remove('is-closing');
                if (options.remove !== false) overlay.remove();
                else overlay.hidden = true;
                options.onDone?.();
            };

            const onEnd = (event) => {
                if (event.target !== overlay && event.target !== overlay.firstElementChild) return;
                done();
            };

            overlay.addEventListener('transitionend', onEnd);
        window.setTimeout(() => {
            overlay.removeEventListener('transitionend', onEnd);
            done();
        }, LUX_POPUP_CLOSE_MS + 50);
        };

    let luxPortalModalScrollLockCount = 0;

    function luxPortalModalLockScroll() {
        luxPortalModalScrollLockCount += 1;
        if (luxPortalModalScrollLockCount === 1) {
            document.body.dataset.luxPortalModalScrollLock = '1';
            document.body.style.overflow = 'hidden';
        }
    }

    function luxPortalModalUnlockScroll() {
        if (luxPortalModalScrollLockCount <= 0) return;
        luxPortalModalScrollLockCount -= 1;
        if (luxPortalModalScrollLockCount === 0) {
            delete document.body.dataset.luxPortalModalScrollLock;
            document.body.style.overflow = '';
        }
    }

    window.openLuxPortalModal = function openLuxPortalModal(overlay, options = {}) {
        if (!overlay) return;
        const { scrollLock = true, focusSelector } = options;
        overlay.hidden = false;
        overlay.setAttribute('aria-hidden', 'false');
        if (scrollLock) luxPortalModalLockScroll();
        window.openLuxGlassDialogOverlay(overlay);
        if (focusSelector) {
            window.setTimeout(() => {
                const focusTarget = overlay.querySelector(focusSelector);
                if (focusTarget && typeof focusTarget.focus === 'function') focusTarget.focus();
            }, 0);
        }
    };

    window.closeLuxPortalModal = function closeLuxPortalModal(overlay, options = {}) {
        if (!overlay) return;
        const { remove = false, scrollLock = true, onDone } = options;
        const finish = () => {
            if (!remove) {
                overlay.hidden = true;
                overlay.setAttribute('aria-hidden', 'true');
            }
            if (scrollLock) luxPortalModalUnlockScroll();
            onDone?.();
        };
        if (typeof window.closeLuxGlassDialogOverlay === 'function') {
            window.closeLuxGlassDialogOverlay(overlay, {
                remove,
                onDone: finish
            });
            return;
        }
        if (remove) overlay.remove();
        else {
            overlay.hidden = true;
            overlay.setAttribute('aria-hidden', 'true');
        }
        finish();
    };

}

// ============================================
// Colour & Motion Studio Functions
// ============================================



function formatLmsDateTime(value) {
    if (!value) return 'No deadline';
    const normalized = String(value).replace('T', ' ');
    return normalized.length > 16 ? normalized.slice(0, 16) : normalized;
}
