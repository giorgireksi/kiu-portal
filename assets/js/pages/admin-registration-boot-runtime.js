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

window.persistRegistrationCmsGlobalsToFaculty = persistRegistrationCmsGlobalsToFaculty;
window.flushAdminRegistrationStateSave = flushAdminRegistrationStateSave;
window.queueAdminRegistrationStateSave = queueAdminRegistrationStateSave;
window.getAdminCmsWriteFaculty = getAdminCmsWriteFaculty;
window.flushAdminToolsWorkspaceBeforeIdentityChange = flushAdminToolsWorkspaceBeforeIdentityChange;
window.reconcileAdminRegistrationCmsAfterIdentityChange = reconcileAdminRegistrationCmsAfterIdentityChange;

// Ensure authentication is enforced on page load
document.addEventListener('DOMContentLoaded', () => {
    refreshSemesterDropdowns();
    ensureSubjectSemesterParityHint();

    if (typeof requireAuth === 'function') {
        requireAuth();
    }

    bindAdminRegistrationCmsDelegates();
    
    // Initialize Admin Registration CMS if on the right page
    if (document.getElementById('admin-reg-content-container')) {
        ensureAdminRegistrationCmsDefaults(getAdminRegistrationFaculty());
        bindFacultyRegistrationCmsData(getAdminRegistrationFaculty());
        bootAdminRegistrationCms('prog');
    }

    // Initialize Student Registration if on the right page
    if (document.getElementById('student-reg-content-container')) {
        renderStudentRegStructures('prog');
        updateEctsProgress();
    }
});

window.addEventListener('load', () => {
    bindAdminRegistrationCmsDelegates();
    const adminCms = document.getElementById('admin-reg-content-container');
    if (adminCms && !hasVisibleAdminRegistrationCmsContent(adminCms)) {
        try {
            ensureAdminRegistrationCmsDefaults(getAdminRegistrationFaculty());
            bindFacultyRegistrationCmsData(getAdminRegistrationFaculty());
            bootAdminRegistrationCms(adminRegActiveTab || 'prog');
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
    const progressBar = document.getElementById('ects-progress-bar');
    const ectsText = document.getElementById('ects-text');
    if (!progressBar || !ectsText || typeof getStudentCompletedEctsThisSemester !== 'function') return;

    const user = getCurrentUser() || { id: '31961' };
    const fac = getCurrentFaculty() || 'ECON';
    const totalEcts = getStudentCompletedEctsThisSemester(user.id, fac);
    const percentage = Math.min((totalEcts / 36) * 100, 100);
    progressBar.style.width = percentage + '%';
    ectsText.innerText = `${totalEcts} / 36`;

    const toneClasses = ['is-warning', 'is-over'];
    toneClasses.forEach((className) => {
        progressBar.classList.remove(className);
        ectsText.classList.remove(className);
    });
    const toneClass = totalEcts > 36 ? 'is-over' : 'is-warning';
    progressBar.classList.add(toneClass);
    ectsText.classList.add(toneClass);
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

