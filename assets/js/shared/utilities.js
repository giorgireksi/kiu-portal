/* General utilities extracted from core.js. Source of truth remains root core.js compatibility bundle. */

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
        if (t === tab) {
            tabEl.style.borderBottomColor = 'var(--kiu-blue)';
            tabEl.style.color = 'var(--kiu-blue)';
            contentEl.style.display = 'block';
        } else {
            tabEl.style.borderBottomColor = 'transparent';
            tabEl.style.color = 'var(--kiu-text-muted)';
            contentEl.style.display = 'none';
        }
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
        facBadge.style.background = getFacultyColor(fac);
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
        badge.style.borderColor = `${getFacultyColor(normalizedFaculty)}33`;
        badge.style.color = getFacultyColor(normalizedFaculty);
        badge.style.background = `${getFacultyColor(normalizedFaculty)}12`;
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
        }
    }
}

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
    if (typeof fastRedirectRoleSwitch === 'function' && fastRedirectRoleSwitch(requestedRole)) {
        return;
    }
    if (typeof closeLmsQuizOverlays === 'function') {
        try {
            closeLmsQuizOverlays();
        } catch (error) {
            console.warn('Could not close LMS quiz overlays before switching role.', error);
        }
    }
    const activeUser = {
        ...currentUser,
        role: requestedRole
    };
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
    const finalizeRoleSwitch = () => {
        currentUserRole = activeUser.role;
        localStorage.setItem('currentUserRole', activeUser.role);
        if (activeUser.role === USER_ROLES.ADMIN) {
            localStorage.removeItem(PENDING_ROLE_SWITCH_KEY);
            try { sessionStorage.removeItem(ACTIVE_ROLE_IMPERSONATION_KEY); } catch (error) {}
        } else {
            localStorage.setItem(PENDING_ROLE_SWITCH_KEY, activeUser.role);
            try { sessionStorage.setItem(ACTIVE_ROLE_IMPERSONATION_KEY, '1'); } catch (error) {}
        }
        resetRoleSwitchViewState();
        if ((impersonatedSessionUser.facultyCode || impersonatedSessionUser.faculty) && activeUser.role !== USER_ROLES.ADMIN) {
            localStorage.setItem('currentFaculty', impersonatedSessionUser.facultyCode || impersonatedSessionUser.faculty);
        }

        const facultySelect = document.getElementById('faculty-select');
        if (facultySelect) {
            const targetFaculty = activeUser.role === USER_ROLES.ADMIN
                ? normalizeFacultyCode(localStorage.getItem('currentFaculty') || impersonatedSessionUser.facultyCode || impersonatedSessionUser.faculty || 'ECON', 'ECON')
                : normalizeFacultyCode(impersonatedSessionUser.facultyCode || impersonatedSessionUser.faculty || localStorage.getItem('currentFaculty') || 'ECON', 'ECON');
            facultySelect.value = targetFaculty;
        }

        if (typeof window.invalidatePageAccessCache === 'function') window.invalidatePageAccessCache();
        if (typeof window.invalidateDomCache === 'function') window.invalidateDomCache();
        switchFacultyTheme(
            facultySelect?.value || impersonatedSessionUser.facultyCode || impersonatedSessionUser.faculty || getCurrentFaculty(),
            { refreshDependentViews: false }
        );

        const targetHomeUrl = typeof resolvePortalRouteUrl === 'function'
            ? resolvePortalRouteUrl('home', activeUser.role)
            : (typeof getRoleHomePage === 'function' ? getRoleHomePage(activeUser.role) : `index.html?view=${encodeURIComponent(activeUser.role)}#home`);
        localStorage.setItem('KIU_FORCE_HOME_ON_ROLE_SWITCH', '1');
        window.__kiuRoleSwitchRedirectPending = true;
        window.location.assign(targetHomeUrl);
    };

    if (typeof syncPortalBackendImpersonation === 'function') {
        Promise.resolve(syncPortalBackendImpersonation(activeUser.role)).catch((error) => {
            console.warn('Could not sync impersonated role to backend before redirect.', error);
        });
    }
    finalizeRoleSwitch();
}

function fastRedirectRoleSwitch(requestedRole) {
    if (!currentUser || currentUser.role !== USER_ROLES.ADMIN) return false;
    const normalizedRole = String(requestedRole || USER_ROLES.STUDENT).trim().toLowerCase() || USER_ROLES.STUDENT;
    if (!Object.values(USER_ROLES).includes(normalizedRole)) return false;

    window.__kiuRoleSwitchRedirectPending = true;
    currentUserRole = normalizedRole;
    try {
        localStorage.setItem('currentUserRole', normalizedRole);
        localStorage.setItem('KIU_FORCE_HOME_ON_ROLE_SWITCH', '1');
        if (normalizedRole === USER_ROLES.ADMIN) {
            localStorage.removeItem(PENDING_ROLE_SWITCH_KEY);
            sessionStorage.removeItem(ACTIVE_ROLE_IMPERSONATION_KEY);
        } else {
            localStorage.setItem(PENDING_ROLE_SWITCH_KEY, normalizedRole);
            sessionStorage.setItem(ACTIVE_ROLE_IMPERSONATION_KEY, '1');
        }
    } catch (error) {
        console.warn('Could not persist fast role switch state.', error);
    }

    if (typeof syncPortalBackendImpersonation === 'function') {
        Promise.resolve(syncPortalBackendImpersonation(normalizedRole)).catch((error) => {
            console.warn('Could not sync impersonated role after fast redirect.', error);
        });
    }

    const targetHomeUrl = typeof resolvePortalRouteUrl === 'function'
        ? resolvePortalRouteUrl('home', normalizedRole)
        : (typeof getRoleHomePage === 'function' ? getRoleHomePage(normalizedRole) : `index.html?view=${encodeURIComponent(normalizedRole)}#home`);
    window.location.assign(targetHomeUrl);
    return true;
}

if (typeof window.refreshSemesterDropdowns !== 'function') {
    window.refreshSemesterDropdowns = function refreshSemesterDropdownsFallback() {
        const configs = [
            { id: 'new-subject-semester', includeCustom: true, numberPrefix: 'Semester' },
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
    const forceReload = options.forceReload === true || options.hardReload === true;
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
    let root = document.documentElement;
    const primary = fp.color || getFacultyColor(normalizedFaculty);
    const nav = fp.navColor || primary;

    // Apply faculty colors from profiles
    root.style.setProperty('--kiu-blue', primary);
    root.style.setProperty('--kiu-navy', nav);
    applyFacultyLuxuryTheme(normalizedFaculty, fp);

    // Update the faculty context badge in admin header if present
    const ctxBadge = document.getElementById('admin-faculty-context');
    if (ctxBadge) {
        ctxBadge.textContent = getFacultyLabel(normalizedFaculty);
        ctxBadge.style.background = primary;
    }
    syncCurriculumFacultyBadge(normalizedFaculty);

    // Refresh add-subject faculty context even though the old faculty input was removed.
    if (
        document.getElementById('add-subject-faculty-badge') ||
        document.getElementById('new-subject-semester') ||
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
            ensureRegistrationCmsFacultyIsolation();
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
            _isElementVisible(document.getElementById('page-admin-scheduler') || document.getElementById('page-home'))) {
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

    const schedulerGridFilter = document.getElementById('grid-view-fac');
    if (schedulerGridFilter && schedulerGridFilter.value !== normalizedFaculty) {
        schedulerGridFilter.value = normalizedFaculty;
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

    if (refreshDependentViews && typeof populateProfList === 'function' && document.getElementById('sch-profs-list') &&
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
        if (typeof renderLuxuryAdminToolsPage === 'function') {
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
        avatarEl.style.backgroundImage = 'none';
        avatarEl.textContent = initialsSource;
        avatarEl.style.display = 'flex';
        avatarEl.style.alignItems = 'center';
        avatarEl.style.justifyContent = 'center';
        avatarEl.style.fontWeight = '800';
        avatarEl.style.fontSize = '13px';
        avatarEl.style.color = 'white';
        avatarEl.style.background = 'linear-gradient(135deg, var(--kiu-navy), var(--kiu-blue))';
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

    refreshFacultyScheduleUI();
    refreshStandalonePageContext();
    if (typeof renderHomeShell === 'function') {
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
            modalOverlay.style.display = 'flex';
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

    // Clear inline background style
    document.body.style.background = '';

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
    const saved = localStorage.getItem('kiuLuxurySurfaceTransparency') || '70';
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
    '.lux-timetable-filters', '.filter-shell', '.lux-timetable-hero-focus',
    '.lux-timetable-command-head', '.lux-timetable-command-grid',
    '.lux-timetable-insight-grid', '.lux-timetable-insight-label',
    '.lux-timetable-insight-value', '.lux-timetable-insight-list',
    '.lux-timetable-stage-head', '.lux-timetable-hero-main',
    '.schedule-chip', '.schedule-view-switcher', '.schedule-week-arrow',
    '.schedule-toolbar-host', '.schedule-toolbar', '.schedule-week-nav',
    '.schedule-overview-row', '.schedule-view-row',
    '.lms-clean-stat', '.lms-clean-signal-panel', '.lms-clean-mini',
    '.lms-clean-metric-card', '.lms-clean-subject-card',
    '.sch-sidebar', '.sch-main', '.sch-rail-hero', '.sch-rail-section',
    '.sch-board-hero', '.sch-board-legend', '.sch-grid-shell', '.sch-modal',
    '.palette-card', '.sch-stat-card', '.sch-grid-tag', '.sch-legend-pill',
    '.sch-action-btn', '.sch-week-current-btn', '.sch-week-arrow',
    '.sch-create-btn', '.sch-empty-state', '.sch-grid-empty',
    '.sch-header-row', '.sch-time-col', '.sch-day-col', '.sch-time-slot span',
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
    '.lux-timetable-command-head',
    '.lux-timetable-insight-grid',
    '.lux-timetable-insight-label',
    '.lux-timetable-insight-value',
    '.lux-timetable-insight-list',
    '.lux-timetable-stage-head',
    '.lux-timetable-hero-main',
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
    '.reg-tabs',
    '.sch-sidebar',
    '.sch-main',
    '.sch-rail-hero',
    '.sch-rail-section',
    '.sch-board-hero',
    '.sch-board-legend',
    '.sch-grid-shell',
    '.sch-modal',
    '.palette-card',
    '.sch-stat-card',
    '.sch-grid-tag',
    '.sch-legend-pill',
    '.sch-empty-state',
    '.sch-grid-empty',
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
    '.lux-faculty-command',
    '.lux-faculty-insight',
    '.lux-faculty-stage',
    '.lux-faculty-hero-focus',
    '.lux-timetable-command',
    '.lux-timetable-insight',
    '.lux-timetable-stage',
    '.lux-timetable-canvas',
    '.lux-timetable-controls',
    '.lux-timetable-filters',
    '.filter-shell',
    '.lux-timetable-hero-focus',
    '.social-card',
    '.social-post-card',
    '.social-mini-card',
    '.social-comment-card',
    '.social-notif-item',
    '.social-story-card',
    '.social-detail-card',
    '.social-file-preview',
    '.social-poll-option',
    '.social-empty',
    '.social-shared-card',
    ...SOCIAL_NEO_TRANSPARENCY_SURFACE_SELECTORS,
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

function buildLuxuryTransparencyModel(value, lightMode = false) {
    const percentage = clampLuxuryTransparencyPercentage(value);
    const fillRatio = percentage / 100;
    const transparencyRatio = fillRatio;
    const colorFadeRatio = Math.max(
        lightMode ? 0.46 : 0.42,
        Math.min(1, 0.34 + (fillRatio * 0.68))
    );
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
    const forceRefresh = Boolean(options && options.force);
    const scopedRoots = normalizeTransparencyRoots(options?.roots);
    const percentage = clampLuxuryTransparencyPercentage(value);

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
    const transparencyModel = buildLuxuryTransparencyModel(percentage, isLightTheme);
    const alpha = transparencyModel.transparencyRatio;
    const surfaceFillAmount = transparencyModel.fillRatio;

    if (options?.persist !== false && typeof window.setDashboardVisuals === 'function') {
        try {
            window.setDashboardVisuals({ surfaceTransparency: String(percentage) });
        } catch (error) {}
    }


    // Store in localStorage
    localStorage.setItem('kiuLuxurySurfaceTransparency', percentage.toString());
    localStorage.setItem('kiuLuxurySurfaceTransparencyValue', alpha.toFixed(2));

    // Sync CSS data attribute for CSS-only high-opacity overrides
    document.documentElement.dataset.luxTransparency = percentage.toString();

    // CSS-ONLY FIX: Toggle lux-high-transparency class and injected primer CSS.
    // At >= 80%, CSS rules suppress accent radial gradients on ALL surfaces.
    if (transparencyModel.highTransparency) {
        document.documentElement.classList.add('lux-high-transparency');
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

        var existingStyle = document.getElementById('lux-high-trans-primer');
        if (!existingStyle) {
            existingStyle = document.createElement('style');
            existingStyle.id = 'lux-high-trans-primer';
            document.head.appendChild(existingStyle);
        }
        existingStyle.textContent =
            'html.lux-high-transparency.lux-high-transparency.lux-high-transparency{--lux-hero-glow:0!important;--lux-glow-scale:0!important;--lux-card-glow-alpha:0!important;--lux-panel-glow:0!important}' +
            buildHighTransparencySurfaceCss(_bodySelector, _bg) +
            buildStudentsAdminHighTransparencyCss(_bodySelector, _isLight, _panelA) +
            buildHighTransparencyTextResetCss(_bodySelector) +
            'html.lux-high-transparency.lux-high-transparency.lux-high-transparency ' + _bodySelector + '::before{background:' + _bodyBg + '!important}' +
            'html.lux-high-transparency.lux-high-transparency.lux-high-transparency ' + _bodySelector + ' .lux-sidebar{background:' + _sidebarBg + '!important}';
    } else {
        document.documentElement.classList.remove('lux-high-transparency');
        var primerStyle = document.getElementById('lux-high-trans-primer');
        if (primerStyle) primerStyle.remove();
    }

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


    // Calculate effects
    const blurAmount = (percentage / 100) * 24;
    const saturateAmount = 100 + ((percentage / 100) * 45);
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
        'registration-module-choice', 'registration-track-group',
        'reg-tabs'
    ];
    const schedulerGlassSelectors = [
        '.sch-sidebar', '.sch-main', '.sch-rail-hero', '.sch-rail-section',
        '.sch-board-hero', '.sch-board-legend', '.sch-grid-shell', '.sch-modal',
        '.palette-card', '.sch-stat-card', '.sch-grid-tag', '.sch-legend-pill',
        '.sch-action-btn', '.sch-week-current-btn', '.sch-week-arrow',
        '.sch-create-btn', '.sch-empty-state', '.sch-grid-empty',
        '.sch-header-row', '.sch-time-col', '.sch-day-col', '.sch-time-slot span'
    ];
    const schedulerGlassClasses = [
        'sch-sidebar', 'sch-main', 'sch-rail-hero', 'sch-rail-section',
        'sch-board-hero', 'sch-board-legend', 'sch-grid-shell', 'sch-modal',
        'palette-card', 'sch-stat-card', 'sch-grid-tag', 'sch-legend-pill',
        'sch-action-btn', 'sch-week-current-btn', 'sch-week-arrow',
        'sch-create-btn', 'sch-empty-state', 'sch-grid-empty',
        'sch-header-row', 'sch-time-col', 'sch-day-col'
    ];
    const lmsGlassSelectors = [
        '.lms-clean-stat', '.lms-clean-signal-panel', '.lms-clean-mini',
        '.lms-clean-metric-card', '.lms-clean-subject-card',
        '.lms-clean-action-secondary', '.lms-clean-signal-pill',
        '.lms-clean-empty', '.lms-banner', '.lux-lms-group-card'
    ];
    const lmsGlassClasses = [
        'lms-clean-stat', 'lms-clean-signal-panel', 'lms-clean-mini',
        'lms-clean-metric-card', 'lms-clean-subject-card',
        'lms-clean-action-secondary', 'lms-clean-signal-pill',
        'lms-clean-empty', 'lms-banner', 'lux-lms-group-card'
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
        'lux-admin-ops-head',
        'lux-timetable-command-head',
        'lux-timetable-insight-grid',
        'lux-timetable-insight-label',
        'lux-timetable-insight-value',
        'lux-timetable-insight-list',
        'lux-timetable-stage-head',
        'lux-timetable-hero-main'
    ];
    const isStructuralSurface = (el) => structuralClasses.some((className) => el.classList.contains(className));
    const buildDynamicSurfaceBackground = (el, lightMode, amount) => {
        // FIX: At high transparency (>=80%), NEVER add accent radial gradients.
        // These inline !important styles were overriding ALL CSS overrides.
        var _isHighTransBg = percentage >= 80;
        const isTimetableRoute = document.body.classList.contains('lux-route-timetable');
        const isTimetableLargeSurface = isTimetableRoute && (
            el.classList.contains('lux-timetable-hero') ||
            el.classList.contains('lux-timetable-command') ||
            el.classList.contains('lux-timetable-stage') ||
            el.classList.contains('lux-timetable-hero-focus')
        );
        const isRegistrationRoute = document.body.classList.contains('lux-route-registration');
        const isRegistrationLargeSurface = isRegistrationRoute && (
            el.classList.contains('registration-hero') ||
            el.classList.contains('registration-workspace') ||
            el.classList.contains('registration-module-list-card') ||
            el.classList.contains('registration-module-pane-card')
        );
        const isProgramsRoute = document.body.classList.contains('lux-route-programs');
        const isProgramsLargeSurface = isProgramsRoute && (
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
            el.classList.contains('lux-subject-row')
        );
        const isStudyCardRoute = document.body.classList.contains('lux-route-study-card');
        const isStudyCardLargeSurface = isStudyCardRoute && (
            el.classList.contains('page-hero') ||
            el.classList.contains('filter-shell') ||
            el.id === 'study-card-container' ||
            el.classList.contains('study-card-semester-table')
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
        const isChancelleryRoute = document.body.classList.contains('lux-route-chancellery');
        const isChancelleryLargeSurface = isChancelleryRoute && (
            el.classList.contains('lux-chancellery-hero') ||
            el.classList.contains('lux-chancellery-focus-card') ||
            el.classList.contains('lux-chancellery-snapshot-card') ||
            el.classList.contains('lux-card') ||
            el.classList.contains('lux-stat-card') ||
            el.classList.contains('lux-subcard') ||
            el.classList.contains('lux-queue-item') ||
            el.classList.contains('lux-thread-entry')
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
        const isLibraryRoute = document.body.classList.contains('lux-route-library');
        const isLibraryLargeSurface = isLibraryRoute && (
            el.classList.contains('library-page-hero') ||
            el.classList.contains('library-filter-shell') ||
            el.classList.contains('library-catalog-card') ||
            el.classList.contains('library-tabs') ||
            el.classList.contains('library-picker-panel') ||
            el.classList.contains('library-catalog-foot')
        );
        const isSocialRoute = document.body.classList.contains('lux-route-social');
        const isSocialSurface = isSocialRoute && (
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
            el.classList.contains('social-neo-card') ||
            SOCIAL_NEO_TRANSPARENCY_SURFACE_CLASSES.some((className) => el.classList.contains(className)) ||
            el.parentElement?.classList?.contains('social-neo-stat-grid')
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
        const isAdminToolsSurface = isAdminToolsRoute && (
            el.classList.contains('lux-admin-tools-hero') ||
            el.classList.contains('lux-admin-op-card') ||
            el.classList.contains('lux-admin-ops-panel') ||
            el.classList.contains('lux-admin-provision-card') ||
            el.classList.contains('lux-panel') ||
            el.classList.contains('lux-card') ||
            el.classList.contains('lux-subcard') ||
            el.classList.contains('lux-stat-card') ||
            el.classList.contains('lux-grid-widget') ||
            el.classList.contains('admin-reg-tab') ||
            el.id === 'admin-reg-content-container' ||
            el.id === 'curriculum-library-modules-root'
        );
        const isStaffRoute = document.body.classList.contains('lux-route-staff');
        const isStaffSurface = isStaffRoute && (
            el.classList.contains('page-hero') ||
            el.classList.contains('lux-card') ||
            el.classList.contains('lux-person-card') ||
            el.classList.contains('lux-subcard') ||
            el.classList.contains('lux-person-head') ||
            el.classList.contains('lux-empty-state') ||
            el.classList.contains('lux-picker-btn') ||
            el.classList.contains('lux-inline-meta') ||
            el.classList.contains('prof-reg-info-box')
        );
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
        if (isHomeDashboardSurface) {
            if (lightMode) {
                return `radial-gradient(circle at 6% 0%, rgba(255,255,255, ${(amount * 0.88).toFixed(2)}), transparent 34%), radial-gradient(circle at 74% 0%, rgba(var(--lux-accent-rgb), ${(amount * 0.24).toFixed(2)}), transparent 42%), radial-gradient(circle at 100% 96%, rgba(var(--lux-home-secondary-rgb), ${(amount * 0.14).toFixed(2)}), transparent 40%), linear-gradient(135deg, rgba(var(--lux-accent-rgb), ${(amount * 0.065).toFixed(2)}), rgba(255,255,255, ${(amount * 0.84).toFixed(2)}) 44%, rgba(247,241,232, ${(amount * 0.70).toFixed(2)}))`;
            }
            return `radial-gradient(circle at 6% 0%, rgba(255,255,255, ${(amount * 0.08).toFixed(2)}), transparent 32%), radial-gradient(circle at 74% 0%, rgba(var(--lux-accent-rgb), ${(amount * 0.28).toFixed(2)}), transparent 42%), radial-gradient(circle at 100% 96%, rgba(var(--lux-home-secondary-rgb), ${(amount * 0.18).toFixed(2)}), transparent 40%), linear-gradient(135deg, rgba(var(--lux-accent-rgb), ${(amount * 0.10).toFixed(2)}), rgba(10,15,24, ${(amount * 0.89).toFixed(2)}) 44%, rgba(7,10,18, ${(amount * 0.80).toFixed(2)}))`;
        }
        if (isTimetableLargeSurface) {
            if (lightMode) {
                return `radial-gradient(circle at 8% 0%, rgba(255,255,255, ${(amount * 0.88).toFixed(2)}), transparent 32%), radial-gradient(circle at 64% 0%, rgba(var(--lux-accent-rgb), ${(amount * 0.20).toFixed(2)}), transparent 36%), radial-gradient(circle at 100% 96%, rgba(var(--lux-home-secondary-rgb), ${(amount * 0.13).toFixed(2)}), transparent 38%), linear-gradient(135deg, rgba(var(--lux-accent-rgb), ${(amount * 0.085).toFixed(2)}), rgba(255,255,255, ${(amount * 0.88).toFixed(2)}) 42%, rgba(246,240,231, ${(amount * 0.72).toFixed(2)}))`;
            }
            return `radial-gradient(circle at 8% 0%, rgba(255,255,255, ${(amount * 0.08).toFixed(2)}), transparent 30%), radial-gradient(circle at 68% 0%, rgba(var(--lux-accent-rgb), ${(amount * 0.22).toFixed(2)}), transparent 36%), radial-gradient(circle at 100% 96%, rgba(var(--lux-home-secondary-rgb), ${(amount * 0.16).toFixed(2)}), transparent 38%), linear-gradient(135deg, rgba(var(--lux-accent-rgb), ${(amount * 0.11).toFixed(2)}), rgba(9,14,24, ${(amount * 0.91).toFixed(2)}) 42%, rgba(7,10,18, ${(amount * 0.84).toFixed(2)}))`;
        }
        if (isRegistrationLargeSurface) {
            if (lightMode) {
                return `radial-gradient(circle at 12% 0%, rgba(255,255,255, ${(amount * 0.86).toFixed(2)}), transparent 34%), radial-gradient(circle at 74% 0%, rgba(var(--lux-accent-rgb), ${(amount * 0.20).toFixed(2)}), transparent 36%), radial-gradient(circle at 100% 90%, rgba(var(--lux-home-secondary-rgb), ${(amount * 0.12).toFixed(2)}), transparent 38%), linear-gradient(135deg, rgba(var(--lux-accent-rgb), ${(amount * 0.08).toFixed(2)}), rgba(255,255,255, ${(amount * 0.88).toFixed(2)}) 42%, rgba(247,241,232, ${(amount * 0.72).toFixed(2)}))`;
            }
            return `radial-gradient(circle at 12% 0%, rgba(255,255,255, ${(amount * 0.075).toFixed(2)}), transparent 32%), radial-gradient(circle at 74% 0%, rgba(var(--lux-accent-rgb), ${(amount * 0.24).toFixed(2)}), transparent 38%), radial-gradient(circle at 100% 90%, rgba(var(--lux-home-secondary-rgb), ${(amount * 0.14).toFixed(2)}), transparent 38%), linear-gradient(135deg, rgba(var(--lux-accent-rgb), ${(amount * 0.11).toFixed(2)}), rgba(12,17,26, ${(amount * 0.91).toFixed(2)}) 42%, rgba(8,12,19, ${(amount * 0.84).toFixed(2)}))`;
        }
        if (isProgramsLargeSurface) {
            if (lightMode) {
                return `radial-gradient(circle at 8% 0%, rgba(255,255,255, ${(amount * 0.88).toFixed(2)}), transparent 34%), radial-gradient(circle at 74% 0%, rgba(var(--lux-accent-rgb), ${(amount * 0.22).toFixed(2)}), transparent 42%), radial-gradient(circle at 100% 96%, rgba(var(--lux-home-secondary-rgb), ${(amount * 0.14).toFixed(2)}), transparent 40%), linear-gradient(135deg, rgba(var(--lux-accent-rgb), ${(amount * 0.065).toFixed(2)}), rgba(255,255,255, ${(amount * 0.84).toFixed(2)}) 44%, rgba(247,241,232, ${(amount * 0.70).toFixed(2)}))`;
            }
            return `radial-gradient(circle at 8% 0%, rgba(255,255,255, ${(amount * 0.075).toFixed(2)}), transparent 32%), radial-gradient(circle at 74% 0%, rgba(var(--lux-accent-rgb), ${(amount * 0.26).toFixed(2)}), transparent 42%), radial-gradient(circle at 100% 96%, rgba(var(--lux-home-secondary-rgb), ${(amount * 0.16).toFixed(2)}), transparent 40%), linear-gradient(135deg, rgba(var(--lux-accent-rgb), ${(amount * 0.095).toFixed(2)}), rgba(10,15,24, ${(amount * 0.90).toFixed(2)}) 44%, rgba(7,10,18, ${(amount * 0.80).toFixed(2)}))`;
        }
        if (isStudyCardLargeSurface) {
            if (lightMode) {
                return `radial-gradient(circle at 8% 0%, rgba(255,255,255, ${(amount * 0.88).toFixed(2)}), transparent 34%), radial-gradient(circle at 72% 4%, rgba(var(--lux-accent-rgb), ${(amount * 0.19).toFixed(2)}), transparent 38%), radial-gradient(circle at 100% 92%, rgba(var(--lux-home-secondary-rgb), ${(amount * 0.13).toFixed(2)}), transparent 38%), linear-gradient(135deg, rgba(var(--lux-accent-rgb), ${(amount * 0.075).toFixed(2)}), rgba(255,255,255, ${(amount * 0.88).toFixed(2)}) 44%, rgba(247,241,232, ${(amount * 0.72).toFixed(2)}))`;
            }
            return `radial-gradient(circle at 8% 0%, rgba(255,255,255, ${(amount * 0.075).toFixed(2)}), transparent 32%), radial-gradient(circle at 72% 4%, rgba(var(--lux-accent-rgb), ${(amount * 0.23).toFixed(2)}), transparent 38%), radial-gradient(circle at 100% 92%, rgba(var(--lux-home-secondary-rgb), ${(amount * 0.15).toFixed(2)}), transparent 38%), linear-gradient(135deg, rgba(var(--lux-accent-rgb), ${(amount * 0.10).toFixed(2)}), rgba(10,15,24, ${(amount * 0.91).toFixed(2)}) 44%, rgba(7,10,18, ${(amount * 0.84).toFixed(2)}))`;
        }
        if (isPersonalDataLargeSurface) {
            if (lightMode) {
                return `radial-gradient(circle at 8% 0%, rgba(255,255,255, ${(amount * 0.88).toFixed(2)}), transparent 34%), radial-gradient(circle at 76% 2%, rgba(var(--lux-accent-rgb), ${(amount * 0.18).toFixed(2)}), transparent 38%), radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), ${(amount * 0.13).toFixed(2)}), transparent 38%), linear-gradient(135deg, rgba(var(--lux-accent-rgb), ${(amount * 0.075).toFixed(2)}), rgba(255,255,255, ${(amount * 0.88).toFixed(2)}) 44%, rgba(247,241,232, ${(amount * 0.72).toFixed(2)}))`;
            }
            return `radial-gradient(circle at 8% 0%, rgba(255,255,255, ${(amount * 0.075).toFixed(2)}), transparent 32%), radial-gradient(circle at 76% 2%, rgba(var(--lux-accent-rgb), ${(amount * 0.22).toFixed(2)}), transparent 38%), radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), ${(amount * 0.14).toFixed(2)}), transparent 38%), linear-gradient(135deg, rgba(var(--lux-accent-rgb), ${(amount * 0.10).toFixed(2)}), rgba(10,15,24, ${(amount * 0.91).toFixed(2)}) 44%, rgba(7,10,18, ${(amount * 0.84).toFixed(2)}))`;
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
            const colorStrength = isSmallNewsControl ? 0.13 : 0.22;
            if (lightMode) {
                return `radial-gradient(circle at 8% 0%, rgba(255,255,255, ${(amount * 0.88).toFixed(2)}), transparent 34%), radial-gradient(circle at 74% 0%, rgba(var(--lux-accent-rgb), ${(amount * colorStrength).toFixed(2)}), transparent 38%), radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), ${(amount * 0.12).toFixed(2)}), transparent 38%), linear-gradient(135deg, rgba(var(--lux-accent-rgb), ${(amount * 0.07).toFixed(2)}), rgba(255,255,255, ${(amount * 0.86).toFixed(2)}) 44%, rgba(247,241,232, ${(amount * 0.70).toFixed(2)}))`;
            }
            return `radial-gradient(circle at 8% 0%, rgba(255,255,255, ${(amount * 0.07).toFixed(2)}), transparent 32%), radial-gradient(circle at 74% 0%, rgba(var(--lux-accent-rgb), ${(amount * colorStrength).toFixed(2)}), transparent 38%), radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), ${(amount * 0.14).toFixed(2)}), transparent 38%), linear-gradient(135deg, rgba(var(--lux-accent-rgb), ${(amount * 0.09).toFixed(2)}), rgba(10,15,24, ${(amount * 0.90).toFixed(2)}) 44%, rgba(7,10,18, ${(amount * 0.82).toFixed(2)}))`;
        }
        if (isChancelleryLargeSurface) {
            if (lightMode) {
                return `radial-gradient(circle at 8% 0%, rgba(255,255,255, ${(amount * 0.88).toFixed(2)}), transparent 34%), radial-gradient(circle at 70% 0%, rgba(var(--lux-accent-rgb), ${(amount * 0.20).toFixed(2)}), transparent 38%), radial-gradient(circle at 100% 92%, rgba(var(--lux-home-secondary-rgb), ${(amount * 0.13).toFixed(2)}), transparent 38%), linear-gradient(135deg, rgba(var(--lux-accent-rgb), ${(amount * 0.075).toFixed(2)}), rgba(255,255,255, ${(amount * 0.88).toFixed(2)}) 44%, rgba(247,241,232, ${(amount * 0.72).toFixed(2)}))`;
            }
            return `radial-gradient(circle at 8% 0%, rgba(255,255,255, ${(amount * 0.075).toFixed(2)}), transparent 32%), radial-gradient(circle at 70% 0%, rgba(var(--lux-accent-rgb), ${(amount * 0.24).toFixed(2)}), transparent 38%), radial-gradient(circle at 100% 92%, rgba(var(--lux-home-secondary-rgb), ${(amount * 0.14).toFixed(2)}), transparent 38%), linear-gradient(135deg, rgba(var(--lux-accent-rgb), ${(amount * 0.10).toFixed(2)}), rgba(10,15,24, ${(amount * 0.91).toFixed(2)}) 44%, rgba(7,10,18, ${(amount * 0.84).toFixed(2)}))`;
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
            const serviceStrength = isSmallServiceSurface ? 0.16 : 0.24;
            if (lightMode) {
                return `radial-gradient(circle at 8% 0%, rgba(255,255,255, ${(amount * 0.88).toFixed(2)}), transparent 34%), radial-gradient(circle at 72% 0%, rgba(var(--lux-accent-rgb), ${(amount * serviceStrength).toFixed(2)}), transparent 38%), radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), ${(amount * 0.13).toFixed(2)}), transparent 38%), linear-gradient(135deg, rgba(var(--lux-accent-rgb), ${(amount * 0.075).toFixed(2)}), rgba(255,255,255, ${(amount * 0.88).toFixed(2)}) 44%, rgba(247,241,232, ${(amount * 0.72).toFixed(2)}))`;
            }
            return `radial-gradient(circle at 8% 0%, rgba(255,255,255, ${(amount * 0.075).toFixed(2)}), transparent 32%), radial-gradient(circle at 72% 0%, rgba(var(--lux-accent-rgb), ${(amount * serviceStrength).toFixed(2)}), transparent 38%), radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), ${(amount * 0.14).toFixed(2)}), transparent 38%), linear-gradient(135deg, rgba(var(--lux-accent-rgb), ${(amount * 0.10).toFixed(2)}), rgba(10,15,24, ${(amount * 0.91).toFixed(2)}) 44%, rgba(7,10,18, ${(amount * 0.84).toFixed(2)}))`;
        }
        if (isLibraryLargeSurface) {
            const libraryStrength = el.classList.contains('library-tabs') || el.classList.contains('library-catalog-foot') ? 0.14 : 0.24;
            if (lightMode) {
                return `radial-gradient(circle at 8% 0%, rgba(255,255,255, ${(amount * 0.88).toFixed(2)}), transparent 34%), radial-gradient(circle at 72% 0%, rgba(var(--lux-accent-rgb), ${(amount * libraryStrength).toFixed(2)}), transparent 38%), radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), ${(amount * 0.13).toFixed(2)}), transparent 38%), linear-gradient(135deg, rgba(var(--lux-accent-rgb), ${(amount * 0.075).toFixed(2)}), rgba(255,255,255, ${(amount * 0.88).toFixed(2)}) 44%, rgba(247,241,232, ${(amount * 0.72).toFixed(2)}))`;
            }
            return `radial-gradient(circle at 8% 0%, rgba(255,255,255, ${(amount * 0.075).toFixed(2)}), transparent 32%), radial-gradient(circle at 72% 0%, rgba(var(--lux-accent-rgb), ${(amount * libraryStrength).toFixed(2)}), transparent 38%), radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), ${(amount * 0.14).toFixed(2)}), transparent 38%), linear-gradient(135deg, rgba(var(--lux-accent-rgb), ${(amount * 0.10).toFixed(2)}), rgba(10,15,24, ${(amount * 0.91).toFixed(2)}) 44%, rgba(7,10,18, ${(amount * 0.84).toFixed(2)}))`;
        }
        if (isSocialSurface) {
            const isSmallSocialSurface = (
                el.classList.contains('social-mini-card') ||
                el.classList.contains('social-comment-card') ||
                el.classList.contains('social-notif-item') ||
                el.classList.contains('social-story-card') ||
                el.classList.contains('social-file-preview') ||
                SOCIAL_NEO_SMALL_TRANSPARENCY_SURFACE_CLASSES.some((className) => el.classList.contains(className)) ||
                el.parentElement?.classList?.contains('social-neo-stat-grid')
            );
            const socialStrength = isSmallSocialSurface ? 0.14 : 0.24;
            if (lightMode) {
                return `radial-gradient(circle at 8% 0%, rgba(255,255,255, ${(amount * 0.88).toFixed(2)}), transparent 34%), radial-gradient(circle at 76% 0%, rgba(var(--lux-accent-rgb), ${(amount * socialStrength).toFixed(2)}), transparent 38%), radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), ${(amount * 0.13).toFixed(2)}), transparent 38%), linear-gradient(135deg, rgba(var(--lux-accent-rgb), ${(amount * 0.075).toFixed(2)}), rgba(255,255,255, ${(amount * 0.88).toFixed(2)}) 44%, rgba(247,241,232, ${(amount * 0.72).toFixed(2)}))`;
            }
            return `radial-gradient(circle at 8% 0%, rgba(255,255,255, ${(amount * 0.075).toFixed(2)}), transparent 32%), radial-gradient(circle at 76% 0%, rgba(var(--lux-accent-rgb), ${(amount * socialStrength).toFixed(2)}), transparent 38%), radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), ${(amount * 0.14).toFixed(2)}), transparent 38%), linear-gradient(135deg, rgba(var(--lux-accent-rgb), ${(amount * 0.10).toFixed(2)}), rgba(10,15,24, ${(amount * 0.91).toFixed(2)}) 44%, rgba(7,10,18, ${(amount * 0.84).toFixed(2)}))`;
        }
        if (isExamsSurface) {
            const isSmallExamSurface = (
                el.classList.contains('ex2-stat-card') ||
                el.classList.contains('ex2-select-card') ||
                el.classList.contains('ex2-q-card-head') ||
                el.classList.contains('ex2-timeline-card') ||
                el.classList.contains('ex2-split-box') ||
                el.classList.contains('ex2-progress-step') ||
                el.parentElement?.classList?.contains('ex2-mini-grid')
            );
            const examStrength = isSmallExamSurface ? 0.14 : 0.24;
            if (lightMode) {
                return `radial-gradient(circle at 8% 0%, rgba(255,255,255, ${(amount * 0.88).toFixed(2)}), transparent 34%), radial-gradient(circle at 74% 0%, rgba(var(--lux-accent-rgb), ${(amount * examStrength).toFixed(2)}), transparent 38%), radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), ${(amount * 0.13).toFixed(2)}), transparent 38%), linear-gradient(135deg, rgba(var(--lux-accent-rgb), ${(amount * 0.075).toFixed(2)}), rgba(255,255,255, ${(amount * 0.88).toFixed(2)}) 44%, rgba(247,241,232, ${(amount * 0.72).toFixed(2)}))`;
            }
            return `radial-gradient(circle at 8% 0%, rgba(255,255,255, ${(amount * 0.075).toFixed(2)}), transparent 32%), radial-gradient(circle at 74% 0%, rgba(var(--lux-accent-rgb), ${(amount * examStrength).toFixed(2)}), transparent 38%), radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), ${(amount * 0.14).toFixed(2)}), transparent 38%), linear-gradient(135deg, rgba(var(--lux-accent-rgb), ${(amount * 0.10).toFixed(2)}), rgba(10,15,24, ${(amount * 0.91).toFixed(2)}) 44%, rgba(7,10,18, ${(amount * 0.84).toFixed(2)}))`;
        }
        if (isAdminToolsSurface) {
            const isSmallAdminToolsSurface = (
                el.classList.contains('lux-subcard') ||
                el.classList.contains('lux-stat-card') ||
                el.classList.contains('lux-grid-widget') ||
                el.classList.contains('admin-reg-tab')
            );
            const adminToolsStrength = isSmallAdminToolsSurface ? 0.14 : 0.24;
            if (lightMode) {
                return `radial-gradient(circle at 8% 0%, rgba(255,255,255, ${(amount * 0.88).toFixed(2)}), transparent 34%), radial-gradient(circle at 72% 0%, rgba(var(--lux-accent-rgb), ${(amount * adminToolsStrength).toFixed(2)}), transparent 38%), radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), ${(amount * 0.13).toFixed(2)}), transparent 38%), linear-gradient(135deg, rgba(var(--lux-accent-rgb), ${(amount * 0.075).toFixed(2)}), rgba(255,255,255, ${(amount * 0.88).toFixed(2)}) 44%, rgba(247,241,232, ${(amount * 0.72).toFixed(2)}))`;
            }
            return `radial-gradient(circle at 8% 0%, rgba(255,255,255, ${(amount * 0.075).toFixed(2)}), transparent 32%), radial-gradient(circle at 72% 0%, rgba(var(--lux-accent-rgb), ${(amount * adminToolsStrength).toFixed(2)}), transparent 38%), radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), ${(amount * 0.14).toFixed(2)}), transparent 38%), linear-gradient(135deg, rgba(var(--lux-accent-rgb), ${(amount * 0.10).toFixed(2)}), rgba(10,15,24, ${(amount * 0.91).toFixed(2)}) 44%, rgba(7,10,18, ${(amount * 0.84).toFixed(2)}))`;
        }
        if (isStaffSurface) {
            const isSmallStaffSurface = (
                el.classList.contains('lux-subcard') ||
                el.classList.contains('lux-person-head') ||
                el.classList.contains('lux-picker-btn') ||
                el.classList.contains('lux-inline-meta') ||
                el.classList.contains('prof-reg-info-box')
            );
            const staffStrength = isSmallStaffSurface ? 0.14 : 0.24;
            if (lightMode) {
                return `radial-gradient(circle at 8% 0%, rgba(255,255,255, ${(amount * 0.88).toFixed(2)}), transparent 34%), radial-gradient(circle at 72% 0%, rgba(var(--lux-accent-rgb), ${(amount * staffStrength).toFixed(2)}), transparent 38%), radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), ${(amount * 0.13).toFixed(2)}), transparent 38%), linear-gradient(135deg, rgba(var(--lux-accent-rgb), ${(amount * 0.075).toFixed(2)}), rgba(255,255,255, ${(amount * 0.88).toFixed(2)}) 44%, rgba(247,241,232, ${(amount * 0.72).toFixed(2)}))`;
            }
            return `radial-gradient(circle at 8% 0%, rgba(255,255,255, ${(amount * 0.075).toFixed(2)}), transparent 32%), radial-gradient(circle at 72% 0%, rgba(var(--lux-accent-rgb), ${(amount * staffStrength).toFixed(2)}), transparent 38%), radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), ${(amount * 0.14).toFixed(2)}), transparent 38%), linear-gradient(135deg, rgba(var(--lux-accent-rgb), ${(amount * 0.10).toFixed(2)}), rgba(10,15,24, ${(amount * 0.91).toFixed(2)}) 44%, rgba(7,10,18, ${(amount * 0.84).toFixed(2)}))`;
        }
        if (!_isHighTransBg && isLmsRoute && (
            el.classList.contains('page-hero') ||
            el.classList.contains('lux-card') ||
            el.classList.contains('lux-status-pill') ||
            el.classList.contains('lux-lms-group-card') ||
            lmsGlassClasses.some((className) => el.classList.contains(className))
        )) {
            if (lightMode) {
                return `radial-gradient(circle at top right, rgba(var(--lux-accent-rgb), ${(0.06 + amount * 0.10).toFixed(2)}), transparent 34%), linear-gradient(180deg, rgba(255,255,255, ${(0.08 + amount * 0.48).toFixed(2)}), rgba(245,239,229, ${(0.03 + amount * 0.34).toFixed(2)}))`;
            }
            return `radial-gradient(circle at top right, rgba(var(--lux-accent-rgb), ${(0.05 + amount * 0.09).toFixed(2)}), transparent 34%), linear-gradient(180deg, rgba(14,20,33, ${(amount * 0.94).toFixed(2)}), rgba(8,12,21, ${(amount * 0.72).toFixed(2)}))`;
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
        el.classList.contains('lux-timetable-command') ||
        el.classList.contains('lux-timetable-insight') ||
        el.classList.contains('lux-timetable-stage') ||
        el.classList.contains('lux-timetable-filters') ||
        el.classList.contains('filter-shell') ||
        el.classList.contains('lux-timetable-hero-focus') ||
        el.classList.contains('lux-timetable-canvas') ||
        el.classList.contains('schedule-toolbar-host') ||
        el.classList.contains('schedule-toolbar') ||
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
        el.classList.contains('personal-data-toolbar') ||
        el.classList.contains('profile-card') ||
        el.classList.contains('personal-data-stats-card') ||
        el.classList.contains('personal-data-facts-card') ||
        el.classList.contains('personal-data-record-card') ||
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
        el.classList.contains('lux-chancellery-hero') ||
        el.classList.contains('lux-chancellery-focus-card') ||
        el.classList.contains('lux-chancellery-snapshot-card') ||
        (document.body.classList.contains('lux-route-chancellery') && (
            el.classList.contains('lux-card') ||
            el.classList.contains('lux-stat-card') ||
            el.classList.contains('lux-subcard') ||
            el.classList.contains('lux-queue-item') ||
            el.classList.contains('lux-thread-entry')
        )) ||
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
        (document.body.classList.contains('lux-route-admin-tools') && (
            el.classList.contains('lux-panel') ||
            el.classList.contains('lux-card') ||
            el.classList.contains('lux-subcard') ||
            el.classList.contains('lux-stat-card') ||
            el.classList.contains('lux-grid-widget') ||
            el.classList.contains('admin-reg-tab') ||
            el.id === 'admin-reg-content-container' ||
            el.id === 'curriculum-library-modules-root'
        )) ||
        (document.body.classList.contains('lux-route-staff') && (
            el.classList.contains('page-hero') ||
            el.classList.contains('lux-card') ||
            el.classList.contains('lux-person-card') ||
            el.classList.contains('lux-subcard') ||
            el.classList.contains('lux-person-head') ||
            el.classList.contains('lux-empty-state') ||
            el.classList.contains('lux-picker-btn') ||
            el.classList.contains('lux-inline-meta') ||
            el.classList.contains('prof-reg-info-box')
        )) ||
        SOCIAL_NEO_TRANSPARENCY_SURFACE_CLASSES.some((className) => el.classList.contains(className)) ||
        el.parentElement?.classList?.contains('social-neo-stat-grid') ||
        registrationGlassClasses.some((className) => el.classList.contains(className)) ||
        schedulerGlassClasses.some((className) => el.classList.contains(className)) ||
        lmsGlassClasses.some((className) => el.classList.contains(className));

    // KEY FIX: Use CSS custom properties to override !important rules
    // CSS variables can be set via JavaScript and will work with !important in CSS
    document.documentElement.style.setProperty('--lux-transparency-blur', `${blurAmount}px`);
    document.documentElement.style.setProperty('--lux-transparency-saturate', `${saturateAmount}%`);
    document.documentElement.style.setProperty('--lux-transparency-alpha', surfaceFillAmount.toFixed(3));
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
        '.tabs-container', '.modal-content', '.page-hero', '.reg-tabs',
        ...registrationGlassSelectors,
        ...schedulerGlassSelectors,
        ...lmsGlassSelectors,

        // Timetable elements
        '.lux-timetable-command', '.lux-timetable-insight', '.lux-timetable-stage',
        '.lux-timetable-canvas', '.lux-timetable-controls',
        '.lux-timetable-filters', '.filter-shell', '.lux-timetable-hero-focus',
        '.lux-timetable-command-head', '.lux-timetable-command-grid',
        '.lux-timetable-insight-grid', '.lux-timetable-insight-label',
        '.lux-timetable-insight-value', '.lux-timetable-insight-list',
        '.lux-timetable-stage-head', '.lux-timetable-hero-main',

        // Faculty/Gradebook elements
        '.lux-faculty-command', '.lux-faculty-insight', '.lux-faculty-stage',

        // Programs page large surfaces
        '.lux-program-hero', '.lux-program-filter-shell', '.lux-program-stage',
        '.lux-program-overview-card', '.lux-program-focus-panel',
        '.lux-program-publish-pill', '.lux-program-metric',
        '.lux-program-focus-stat', '.lux-program-semester-chip',
        '.lux-module-option', '.lux-subject-row',

        // Study Card large surfaces
        '#study-card-container', '.study-card-semester-table',

        // Personal Data large surfaces
        '.personal-data-toolbar', '.profile-card', '.personal-data-stats-card',
        '.personal-data-facts-card', '.personal-data-record-card',

        // News workspace surfaces
        '.newsx-panel', '.newsx-hero', '.newsx-feed-card', '.newsx-filter',
        '.newsx-sidebar', '.newsx-rail', '.newsx-section', '.newsx-stat',
        '.newsx-private-item', '.newsx-check', '.newsx-account-card',
        '.newsx-section-btn', '.newsx-pane-btn',

        // Chancellery large surfaces
        '.lux-chancellery-hero', '.lux-chancellery-focus-card',
        '.lux-chancellery-snapshot-card',

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
        '.student-service-home-topic', '.student-service-lane-choice-card',

        // Library large surfaces
        '.library-page-hero', '.library-filter-shell', '.library-catalog-card',
        '.library-tabs', '.library-picker-panel', '.library-catalog-foot',

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
        '.lux-admin-provision-card',
        'body.lux-route-admin-tools .lux-panel',
        'body.lux-route-admin-tools .lux-card',
        'body.lux-route-admin-tools .lux-subcard',
        'body.lux-route-admin-tools .lux-stat-card',
        'body.lux-route-admin-tools .lux-grid-widget',
        'body.lux-route-admin-tools .admin-reg-tab',
        '#admin-reg-content-container', '#curriculum-library-modules-root',

        // Staff large surfaces
        'body.lux-route-staff .page-hero',
        'body.lux-route-staff .lux-card',
        'body.lux-route-staff .lux-person-card',
        'body.lux-route-staff .lux-subcard',
        'body.lux-route-staff .lux-person-head',
        'body.lux-route-staff .lux-empty-state',
        'body.lux-route-staff .lux-picker-btn',
        'body.lux-route-staff .lux-inline-meta',
        'body.lux-route-staff .prof-reg-info-box',

        // Staff directory elements
        '.lux-person-card', '.lux-subcard', '.lux-stack', '.lux-person-head',
        '.lux-inline-meta', '.lux-card-actions',

        // Widget structural elements
        '.lux-grid-widget-body', '.lux-widget-container',
        '.lux-card-head', '.lux-card-body', '.lux-panel-body',

        // Admin Orders specific elements
        '.lux-page-kicker', '.lux-status-pill',

        // Schedule/Timetable specific elements
        '.schedule-chip', '.schedule-view-switcher', '.schedule-week-arrow',
        '.schedule-toolbar-host', '.schedule-toolbar', '.schedule-week-nav',
        '.schedule-overview-row', '.schedule-view-row',

        // Form controls that need transparency
        '.lux-control',

        // Social page elements
        '.social-card', '.social-post-card', '.social-mini-card',
        '.social-comment-card', '.social-notif-item', '.social-story-card',
        '.social-detail-card', '.social-file-preview', '.social-poll-option',
        '.social-empty', '.social-shared-card', '.social-hero',
        '.social-entity-cover', '.social-app-shell', '.social-rail',
        '.social-neo-post-card', '.social-neo-composer-card',
        '.social-neo-filter-card', '.social-neo-story-card',
        '.social-neo-community-panel', '.social-neo-comment-bubble',
        ...LUX_MODERN_TRANSPARENCY_SURFACE_SELECTORS,
        ...SOCIAL_NEO_TRANSPARENCY_SURFACE_SELECTORS
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
        if (
            document.body.classList.contains('lux-route-students-admin') &&
            (el.id === 'students-content' || el.closest?.('#students-content, #students-admin-lms-modal'))
        ) {
            return;
        }

        // Detect current mode
        const isLightMode = document.body.classList.contains('lux-light-mode');

        if (percentage > 0) {
            // Calculate effects
            const alpha = percentage / 100;
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

            if (hasComplexBackground) {
                // For elements with CSS gradients: apply backdrop-filter AND override background with dynamic alpha
                el.style.setProperty('backdrop-filter', `blur(${blurAmount}px) saturate(${saturateAmount}%)`, 'important');
                el.style.setProperty('-webkit-backdrop-filter', `blur(${blurAmount}px) saturate(${saturateAmount}%)`, 'important');

                // CRITICAL FIX: Override hardcoded gradient backgrounds with dynamic alpha
                // This handles .lux-card and similar elements that use hardcoded alpha values
                if (shouldApplyDynamicBackground(el)) {
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
                el.style.setProperty('backdrop-filter', `blur(${blurAmount}px) saturate(${saturateAmount}%)`, 'important');
                el.style.setProperty('-webkit-backdrop-filter', `blur(${blurAmount}px) saturate(${saturateAmount}%)`, 'important');
                if (
                    registrationGlassClasses.some(className => el.classList.contains(className)) ||
                    schedulerGlassClasses.some(className => el.classList.contains(className)) ||
                    lmsGlassClasses.some(className => el.classList.contains(className)) ||
                    shouldApplyDynamicBackground(el)
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

    // FOUC PREVENTION: Now that all inline backgrounds are applied correctly,
    // remove the pending class so cards become visible with correct backgrounds.
    document.documentElement.classList.remove('lux-transparency-pending');
}

/**
 * Set up MutationObserver to apply transparency to dynamically added elements
 */
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
        updateTransparency(70); // Default to 70%
    } else {
        updateTransparency(0);
    }
}

function refreshLuxuryTransparencySurfaces(value, options = {}) {
    const savedValue = value ?? localStorage.getItem('kiuLuxurySurfaceTransparency') ?? window.__currentTransparency ?? 70;
    const percentage = parseInt(savedValue, 10);
    if (!Number.isFinite(percentage)) return;
    const scopedRoots = normalizeTransparencyRoots(options?.roots);
    if (!scopedRoots.length) {
        resetTransparencySurfaceCache();
    }
    collectTransparencySurfaceElements(['[data-lux-transparency-signature]'], scopedRoots).forEach((el) => {
        delete el.dataset.luxTransparencySignature;
    });
    updateTransparency(percentage, { force: true, roots: scopedRoots });
}

function queueLuxuryTransparencyRefresh(value, options = {}) {
    window.clearTimeout(window.__luxTransparencyPaletteRefreshTimer);
    window.__luxTransparencyPaletteRefreshTimer = window.setTimeout(() => {
        window.__luxTransparencyPaletteRefreshTimer = null;
        const run = () => refreshLuxuryTransparencySurfaces(value, options);
        if (typeof window.requestAnimationFrame === 'function') {
            window.requestAnimationFrame(run);
        } else {
            run();
        }
    }, 0);
}

window.updateTransparency = updateTransparency;
window.refreshLuxuryTransparencySurfaces = refreshLuxuryTransparencySurfaces;
window.queueLuxuryTransparencyRefresh = queueLuxuryTransparencyRefresh;
window.buildLuxuryTransparencyModel = buildLuxuryTransparencyModel;

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
            const syncedTransparency = localStorage.getItem('kiuLuxurySurfaceTransparency');
            if (syncedTransparency && typeof window.updateTransparency === 'function') {
                const percentage = parseInt(syncedTransparency, 10);
                window.updateTransparency(percentage);
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

        // Restore transparency mode
        const savedTransparency = localStorage.getItem('kiuLuxurySurfaceTransparency');
        if (savedTransparency) {
            const percentage = parseInt(savedTransparency);
            updateTransparency(percentage);

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
                updateTransparency(_pct);
            }, 50);
        }
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


