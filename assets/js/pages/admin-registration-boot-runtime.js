/* Admin registration CMS boot/identity/ECTS helpers. Peeled from admin-registration.js.
 * Load before admin-registration.js.
 */
(function initWave18Peel() {
    if (window.__KIU_ADMIN_REGISTRATION_BOOT_LOADED) return;
    window.__KIU_ADMIN_REGISTRATION_BOOT_LOADED = true;

    window.__kiuCreateAdminRegistrationBootApi = function createKiuPeelApi(deps = {}) {
        const d = deps;
        void d;
        /* Non-strict factory body: free vars resolve to window globals at call time. */

function flushAdminToolsWorkspaceBeforeIdentityChange(options = {}) {
    const faculty = typeof getAdminCmsWriteFaculty === 'function'
        ? getAdminCmsWriteFaculty()
        : resolveRegistrationCmsFaculty();
    flushAdminRegistrationStateSave({ faculty });
    if (options.syncBackend !== false && typeof flushPortalStateSync === 'function') {
        return flushPortalStateSync();
    }
    return Promise.resolve();
}

function reconcileAdminRegistrationCmsAfterIdentityChange(faculty) {
    const fac = resolveRegistrationCmsFaculty(faculty);
    const container = document.getElementById('admin-reg-content-container');
    if (container) container.dataset.cmsFaculty = fac;
    bindFacultyRegistrationCmsData(fac);
    if (!isAdminToolsWorkspaceActive()) return;
    if (typeof renderCurriculumTable === 'function') renderCurriculumTable();
    if (typeof bootAdminRegistrationCms === 'function') {
        bootAdminRegistrationCms(adminRegActiveTab || 'prog', { force: true });
    }
    if (typeof resetAdminRegistrationCmsDelegates === 'function') resetAdminRegistrationCmsDelegates();
    if (typeof bindAdminRegistrationCmsDelegates === 'function') bindAdminRegistrationCmsDelegates();
    if (typeof renderLuxuryAdminToolsPage === 'function') {
        renderLuxuryAdminToolsPage();
    }
}

window.flushAdminToolsWorkspaceBeforeIdentityChange = flushAdminToolsWorkspaceBeforeIdentityChange;
window.reconcileAdminRegistrationCmsAfterIdentityChange = reconcileAdminRegistrationCmsAfterIdentityChange;

// Ensure authentication is enforced on page load
document.addEventListener('DOMContentLoaded', () => {
    if (typeof refreshSemesterDropdowns === 'function') {
        refreshSemesterDropdowns();
    }
    if (typeof ensureSubjectSemesterParityHint === 'function') {
        ensureSubjectSemesterParityHint();
    }

    if (typeof requireAuth === 'function') {
        requireAuth();
    }

    if (typeof bindAdminRegistrationCmsDelegates === 'function') {
        bindAdminRegistrationCmsDelegates();
    }
    
    // Initialize Admin Registration CMS if on the right page
    if (document.getElementById('admin-reg-content-container') && typeof getAdminRegistrationFaculty === 'function') {
        if (typeof ensureAdminRegistrationCmsDefaults === 'function') {
            ensureAdminRegistrationCmsDefaults(getAdminRegistrationFaculty());
        }
        if (typeof bindFacultyRegistrationCmsData === 'function') {
            bindFacultyRegistrationCmsData(getAdminRegistrationFaculty());
        }
        if (typeof bootAdminRegistrationCms === 'function') {
            bootAdminRegistrationCms('prog');
        }
    }

    // Initialize Student Registration if on the right page
    if (document.getElementById('student-reg-content-container')) {
        if (typeof renderStudentRegStructures === 'function') {
            renderStudentRegStructures('prog');
        }
        if (typeof updateEctsProgress === 'function') {
            updateEctsProgress();
        }
    }
});

window.addEventListener('load', () => {
    if (typeof bindAdminRegistrationCmsDelegates === 'function') {
        bindAdminRegistrationCmsDelegates();
    }
    const adminCms = document.getElementById('admin-reg-content-container');
    if (adminCms && typeof hasVisibleAdminRegistrationCmsContent === 'function' && !hasVisibleAdminRegistrationCmsContent(adminCms)) {
        try {
            if (typeof getAdminRegistrationFaculty === 'function') {
                if (typeof ensureAdminRegistrationCmsDefaults === 'function') {
                    ensureAdminRegistrationCmsDefaults(getAdminRegistrationFaculty());
                }
                if (typeof bindFacultyRegistrationCmsData === 'function') {
                    bindFacultyRegistrationCmsData(getAdminRegistrationFaculty());
                }
                if (typeof bootAdminRegistrationCms === 'function') {
                    bootAdminRegistrationCms(typeof adminRegActiveTab !== 'undefined' ? adminRegActiveTab || 'prog' : 'prog');
                }
            }
        } catch (err) {
            console.error('Admin CMS load fallback failed:', err);
        }
    }
});

function getAdminRegistrationCmsRevision() {
    return String((typeof KIU_STATE !== 'undefined' && KIU_STATE?.meta?.registrationCmsRevision) || 0);
}

function bootAdminRegistrationCms(tabType = 'prog', options = {}) {
    const container = document.getElementById('admin-reg-content-container');
    if (!container) return;

    const safeTab = tabType || adminRegActiveTab || 'prog';
    const cmsRevision = getAdminRegistrationCmsRevision();
    const forceRender = options.force === true
        || container.dataset.cmsRevision !== cmsRevision
        || container.dataset.cmsFaculty !== normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');

    if (hasVisibleAdminRegistrationCmsContent(container) && !forceRender) {
        return;
    }

    if (typeof renderAdminRegTabBar === 'function') {
        renderAdminRegTabBar(safeTab);
    }
    renderAdminRegistrationModules(safeTab);
    container.dataset.cmsRevision = cmsRevision;
}

function handleAdminRegistrationCmsChanged() {
    const container = document.getElementById('admin-reg-content-container');
    if (!container) return;
    const cmsRevision = getAdminRegistrationCmsRevision();
    const faculty = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
    if (
        hasVisibleAdminRegistrationCmsContent(container)
        && container.dataset.cmsRevision === cmsRevision
        && container.dataset.cmsFaculty === faculty
    ) {
        if (typeof bindFacultyRegistrationCmsData === 'function') {
            bindFacultyRegistrationCmsData(faculty);
        }
        return;
    }
    bootAdminRegistrationCms(adminRegActiveTab || 'prog');
}

if (!window.__kiuAdminRegistrationCmsChangedBound) {
    window.__kiuAdminRegistrationCmsChangedBound = true;
    window.addEventListener('kiu:registration-cms-changed', handleAdminRegistrationCmsChanged);
}

function hasVisibleAdminRegistrationCmsContent(container) {
    if (!container) return false;
    if (container.children.length > 0) return true;
    return Boolean((container.textContent || '').trim());
}

function updateEctsProgress() {
    // Footer ECTS bar removed — summary panel owns ECTS via syncRegistrationWorkspaceSummary.
    if (typeof syncRegistrationWorkspaceSummary === 'function') {
        syncRegistrationWorkspaceSummary();
    }
}

        const api = {
            flushAdminToolsWorkspaceBeforeIdentityChange,
            reconcileAdminRegistrationCmsAfterIdentityChange,
            getAdminRegistrationCmsRevision,
            bootAdminRegistrationCms,
            handleAdminRegistrationCmsChanged,
            hasVisibleAdminRegistrationCmsContent,
            updateEctsProgress,
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateAdminRegistrationBootApi({});
})();

