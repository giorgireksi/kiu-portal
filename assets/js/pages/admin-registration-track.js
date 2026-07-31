/* Wave bag: Wave 26 admin-registration-track */
window.KiuAdminRegistrationTrack = window.KiuAdminRegistrationTrack || {};
const __kiuArtApi = window.KiuAdminRegistrationTrack;
window.__kiuArtApi = __kiuArtApi;
function __kiuArtExpose(map) {
    Object.keys(map).forEach((key) => {
        __kiuArtApi[key] = map[key];
        window[key] = map[key];
    });
}

/* Unified admin registration track-tab system (regtabs1). */

const ADMIN_REG_TRACK_MIGRATION_VERSION = 1;

const ADMIN_REG_BUILTIN_TABS = {
    prog: {
        id: 'prog',
        label: 'Program',
        description: 'Organize your program into modules and assign courses.',
        programsLabel: 'Program Modules',
        paneSubtitle: 'Program Module Subjects',
        scrollKey: 'admin-reg-prog-programs',
        studentTabId: 'prog',
        builtin: true
    },
    free: {
        id: 'free',
        label: 'Free Credits',
        description: 'Configure elective free-credit pools with grouped subject lists.',
        programsLabel: 'Free Credit Modules',
        paneSubtitle: 'Free Credit Module Subjects',
        scrollKey: 'admin-reg-free-programs',
        studentTabId: 'free',
        builtin: true
    },
    conc: {
        id: 'conc',
        label: 'Concentration',
        description: 'Build concentration programs with nested cards, editable ECTS targets, and grouped course lists.',
        programsLabel: 'Concentration Programs',
        paneSubtitle: 'Concentration Program Subjects',
        scrollKey: 'admin-reg-conc-programs',
        studentTabId: 'conc',
        builtin: true
    },
    minor: {
        id: 'minor',
        label: 'Minor',
        description: 'Manage minor programs with grouped subject lists and ECTS targets.',
        programsLabel: 'Minor Programs',
        paneSubtitle: 'Minor Program Subjects',
        scrollKey: 'admin-reg-minor-programs',
        studentTabId: 'minor',
        builtin: true
    }
};

const ADMIN_REG_TRACK_MAIN_GROUP = 'Main';

function ensureAdminRegTrackMeta() {
    if (!KIU_STATE.meta || typeof KIU_STATE.meta !== 'object') {
        KIU_STATE.meta = {};
    }
    if (!KIU_STATE.meta.adminRegTrackMigrationByFaculty || typeof KIU_STATE.meta.adminRegTrackMigrationByFaculty !== 'object') {
        KIU_STATE.meta.adminRegTrackMigrationByFaculty = {};
    }
    return KIU_STATE.meta;
}

function hasAdminRegTrackMigration(faculty) {
    const fac = normalizeFacultyCode(faculty || 'ECON', 'ECON');
    const meta = ensureAdminRegTrackMeta();
    return Number(meta.adminRegTrackMigrationByFaculty[fac] || 0) >= ADMIN_REG_TRACK_MIGRATION_VERSION;
}

function markAdminRegTrackMigration(faculty) {
    const fac = normalizeFacultyCode(faculty || 'ECON', 'ECON');
    const meta = ensureAdminRegTrackMeta();
    meta.adminRegTrackMigrationByFaculty[fac] = ADMIN_REG_TRACK_MIGRATION_VERSION;
}

function ensureAdminRegTrackBucket(faculty) {
    const fac = normalizeFacultyCode(faculty || 'ECON', 'ECON');
    if (!KIU_STATE.registrationCMSByFaculty) {
        KIU_STATE.registrationCMSByFaculty = {};
    }
    if (!KIU_STATE.registrationCMSByFaculty[fac]) {
        KIU_STATE.registrationCMSByFaculty[fac] = {
            concCourseData: {},
            minorProgramData: {},
            trackData: {},
            customTabs: [],
            builtinTabOverrides: {},
            hiddenBuiltinTabs: []
        };
    }
    const bucket = KIU_STATE.registrationCMSByFaculty[fac];
    if (!bucket.trackData || typeof bucket.trackData !== 'object') {
        bucket.trackData = {};
    }
    if (!Array.isArray(bucket.customTabs)) {
        bucket.customTabs = [];
    }
    if (!bucket.builtinTabOverrides || typeof bucket.builtinTabOverrides !== 'object') {
        bucket.builtinTabOverrides = {};
    }
    if (!Array.isArray(bucket.hiddenBuiltinTabs)) {
        bucket.hiddenBuiltinTabs = [];
    }
    return bucket;
}

function cloneTrackGroup(group = {}) {
    return {
        maxEcts: Number(group.maxEcts || parseEctsProgress(group.ects || '0/0').max || 0),
        completedEcts: Number(group.completedEcts || 0),
        ects: group.ects || `${Number(group.maxEcts || 0)}/${Number(group.completedEcts || 0)}`,
        courses: Array.isArray(group.courses) ? cloneJson(group.courses) : []
    };
}

function submoduleToTrackCourse(subModule = {}) {
    const courseId = subModule.sourceCourseId
        || (Array.isArray(subModule.courses) ? subModule.courses[0] : '')
        || subModule.id
        || subModule.n
        || '';
    return {
        n: subModule.number || subModule.n || subModule.id || '',
        title: subModule.name || subModule.title || 'Untitled Subject',
        ects: String(subModule.ects || '6'),
        precondition: subModule.prerequisites || subModule.precondition || '',
        antireq: subModule.antireq || 'None',
        sourceCourseId: courseId,
        sourceFaculty: subModule.sourceFaculty || '',
        semesterRuleMode: subModule.semesterRuleMode || 'all',
        allowedSemesters: subModule.allowedSemesters || '',
        lectureCapacity: subModule.lectureCapacity ?? 40,
        seminarCapacity: subModule.seminarCapacity ?? 20
    };
}

function migrateAdminRegistrationCmsToTrackModel(faculty) {
    const fac = normalizeFacultyCode(faculty || 'ECON', 'ECON');
    if (typeof migrateRegistrationCmsToTrackModel === 'function') {
        const alreadyMigrated = typeof hasRegistrationTrackMigration === 'function'
            ? hasRegistrationTrackMigration(fac)
            : (typeof hasAdminRegTrackMigration === 'function' && hasAdminRegTrackMigration(fac));
        const bucket = migrateRegistrationCmsToTrackModel(fac);
        // Only persist when migration actually ran; reads must not re-queue saves (avoids 503 spam loops).
        if (!alreadyMigrated && typeof queueAdminRegistrationStateSave === 'function') {
            queueAdminRegistrationStateSave();
        }
        return bucket;
    }

    if (hasAdminRegTrackMigration(fac)) return ensureAdminRegTrackBucket(fac);
    const bucket = ensureAdminRegTrackBucket(fac);
    markAdminRegTrackMigration(fac);
    syncAdminRegTrackLegacyMirrors(bucket, fac);
    if (typeof queueAdminRegistrationStateSave === 'function') {
        queueAdminRegistrationStateSave();
    }
    return bucket;
}

function getAdminRegTrackData(tabId, faculty) {
    const fac = normalizeFacultyCode(faculty || (typeof getAdminRegistrationFaculty === 'function' ? getAdminRegistrationFaculty() : 'ECON'), 'ECON');
    const bucket = migrateAdminRegistrationCmsToTrackModel(fac);
    const track = bucket.trackData?.[tabId];
    return track && typeof track === 'object' ? track : {};
}

function syncConcMirrorFromTrack(trackConc = {}) {
    const mirror = {};
    Object.entries(trackConc).forEach(([programName, groups]) => {
        if (!groups || typeof groups !== 'object') return;
        mirror[programName] = Object.fromEntries(
            Object.entries(groups).map(([groupName, group]) => [groupName, cloneTrackGroup(group)])
        );
    });
    return mirror;
}

function syncMinorMirrorFromTrack(trackMinor = {}) {
    const mirror = {};
    Object.entries(trackMinor).forEach(([programName, groups]) => {
        if (!groups || typeof groups !== 'object') return;
        mirror[programName] = {
            courseGroups: Object.fromEntries(
                Object.entries(groups).map(([groupName, group]) => [groupName, cloneTrackGroup(group)])
            )
        };
    });
    return mirror;
}

function syncAdminRegTrackLegacyMirrors(bucket, faculty) {
    if (!bucket || typeof bucket !== 'object') return bucket;
    const fac = normalizeFacultyCode(
        faculty || (typeof getAdminRegistrationFaculty === 'function' ? getAdminRegistrationFaculty() : 'ECON'),
        'ECON'
    );
    if (typeof syncRegistrationTrackLegacyMirrors === 'function') {
        syncRegistrationTrackLegacyMirrors(bucket, fac);
    } else {
        const trackData = bucket.trackData && typeof bucket.trackData === 'object' ? bucket.trackData : {};
        bucket.concCourseData = syncConcMirrorFromTrack(trackData.conc || {});
        bucket.minorProgramData = syncMinorMirrorFromTrack(trackData.minor || {});
    }
    if (typeof concCourseData !== 'undefined') {
        concCourseData = bucket.concCourseData;
    }
    if (typeof minorProgramData !== 'undefined') {
        minorProgramData = bucket.minorProgramData;
    }
    return bucket;
}

function isBuiltinAdminRegTab(tabId) {
    return Boolean(ADMIN_REG_BUILTIN_TABS[String(tabId || '').trim()]);
}

function resolveAdminRegTab(tabId, faculty) {
    const safeId = String(tabId || '').trim();
    const fac = normalizeFacultyCode(
        faculty || (typeof getAdminRegistrationFaculty === 'function' ? getAdminRegistrationFaculty() : 'ECON'),
        'ECON'
    );
    if (ADMIN_REG_BUILTIN_TABS[safeId]) {
        const bucket = ensureAdminRegTrackBucket(fac);
        if (Array.isArray(bucket.hiddenBuiltinTabs) && bucket.hiddenBuiltinTabs.includes(safeId)) {
            return null;
        }
        const base = { ...ADMIN_REG_BUILTIN_TABS[safeId] };
        const overrides = bucket.builtinTabOverrides?.[safeId];
        if (overrides && typeof overrides === 'object') {
            return {
                ...base,
                label: overrides.label || base.label,
                description: overrides.description ?? base.description,
                programsLabel: overrides.programsLabel || base.programsLabel,
                paneSubtitle: overrides.paneSubtitle || base.paneSubtitle,
                id: base.id,
                studentTabId: base.studentTabId,
                builtin: true
            };
        }
        return base;
    }
    const bucket = ensureAdminRegTrackBucket(fac);
    const custom = (bucket.customTabs || []).find((tab) => tab && tab.id === safeId);
    if (!custom) return null;
    return {
        id: custom.id,
        label: custom.label || custom.id,
        description: custom.description || '',
        programsLabel: custom.programsLabel || `${custom.label || custom.id} Programs`,
        paneSubtitle: custom.paneSubtitle || `${custom.label || custom.id} Subjects`,
        scrollKey: custom.scrollKey || `admin-reg-custom-${custom.id}`,
        studentTabId: custom.studentTabId || custom.id,
        builtin: false
    };
}

function getAdminRegTabsForFaculty(faculty) {
    const fac = normalizeFacultyCode(faculty || 'ECON', 'ECON');
    ensureAdminRegTrackBucket(fac);
    const builtinTabs = Object.keys(ADMIN_REG_BUILTIN_TABS)
        .map((tabId) => resolveAdminRegTab(tabId, fac))
        .filter(Boolean);
    const customTabs = (ensureAdminRegTrackBucket(fac).customTabs || [])
        .filter((tab) => tab && tab.id)
        .map((tab) => resolveAdminRegTab(tab.id, fac))
        .filter(Boolean);
    return [...builtinTabs, ...customTabs];
}

function getValidAdminRegTabIds(faculty) {
    return getAdminRegTabsForFaculty(faculty).map((tab) => tab.id);
}

function ensureAdminRegSelectedTrackState() {
    if (!adminRegUiState.selectedTrack || typeof adminRegUiState.selectedTrack !== 'object') {
        adminRegUiState.selectedTrack = {};
    }
}

function getAdminRegSelectedProgram(tabId) {
    ensureAdminRegSelectedTrackState();
    return adminRegUiState.selectedTrack[tabId]?.program || null;
}

function setAdminRegSelectedProgram(tabId, program, options = {}) {
    ensureAdminRegSelectedTrackState();
    if (!adminRegUiState.selectedTrack[tabId]) {
        adminRegUiState.selectedTrack[tabId] = { program: null, groupKey: null };
    }
    const previousProgram = adminRegUiState.selectedTrack[tabId].program;
    adminRegUiState.selectedTrack[tabId].program = program || null;
    if (!options.preserveGroupKey || previousProgram !== program) {
        adminRegUiState.selectedTrack[tabId].groupKey = null;
    }
}

function buildAdminRegGroupKey(tabId, program, group) {
    return `${tabId}:${program}|${group}`;
}

function getAdminRegSelectedGroupKey(tabId) {
    ensureAdminRegSelectedTrackState();
    return adminRegUiState.selectedTrack[tabId]?.groupKey || null;
}

function setAdminRegSelectedGroupKey(tabId, groupKey) {
    ensureAdminRegSelectedTrackState();
    if (!adminRegUiState.selectedTrack[tabId]) {
        adminRegUiState.selectedTrack[tabId] = { program: null, groupKey: null };
    }
    adminRegUiState.selectedTrack[tabId].groupKey = groupKey || null;
}

function getTrackProgramGroup(tabId, programName, groupName, faculty) {
    const track = getAdminRegTrackData(tabId, faculty);
    return track?.[programName]?.[groupName] || null;
}

function ensureTrackProgramGroup(tabId, programName, groupName, faculty) {
    const fac = normalizeFacultyCode(faculty || 'ECON', 'ECON');
    const bucket = ensureAdminRegTrackBucket(fac);
    if (!bucket.trackData[tabId] || typeof bucket.trackData[tabId] !== 'object') {
        bucket.trackData[tabId] = {};
    }
    if (!bucket.trackData[tabId][programName] || typeof bucket.trackData[tabId][programName] !== 'object') {
        bucket.trackData[tabId][programName] = {};
    }
    if (!bucket.trackData[tabId][programName][groupName]) {
        bucket.trackData[tabId][programName][groupName] = {
            maxEcts: 30,
            completedEcts: 0,
            ects: '30/0',
            courses: []
        };
    }
    syncAdminRegTrackLegacyMirrors(bucket);
    return bucket.trackData[tabId][programName][groupName];
}

function convertTrackTabForStudent(trackObj) {
    if (typeof convertRegistrationTrackTabForStudent === 'function') {
        return convertRegistrationTrackTabForStudent(trackObj);
    }
    return [];
}

function buildAdminRegManageGearMarkup(attrs) {
    return `
        <button type="button" class="lux-icon-btn admin-reg-manage-gear-btn" ${attrs} aria-label="Manage">
            <i class="fas fa-cog" aria-hidden="true"></i>
        </button>
    `;
}

function openAdminRegProgramManage(tabId, programName) {
    const safeTabId = String(tabId || '').trim();
    const safeProgram = String(programName || '').trim();
    const tabConfig = resolveAdminRegTab(safeTabId);
    if (!safeProgram || !tabConfig || typeof openAdminRegManageModal !== 'function') return;
    openAdminRegManageModal({
        title: `Manage program`,
        subtitle: `${tabConfig.label}: ${safeProgram}`,
        editLabel: 'Edit program',
        deleteLabel: 'Delete program',
        onEdit: () => editTrackProgram(safeTabId, safeProgram),
        onDelete: () => {
            const verify = typeof runRegistrationRemoveConfirmation === 'function'
                && typeof buildAdminRegProgramRemoveVerification === 'function'
                ? runRegistrationRemoveConfirmation(buildAdminRegProgramRemoveVerification(safeTabId, safeProgram, tabConfig))
                : window.confirm(`Delete "${safeProgram}"?`);
            if (!verify) return;
            deleteTrackProgram(safeTabId, safeProgram, { skipVerification: true });
        }
    });
}

function openAdminRegGroupManage(tabId, programName, groupName) {
    const safeTabId = String(tabId || '').trim();
    const safeProgram = String(programName || '').trim();
    const safeGroup = String(groupName || '').trim();
    if (!safeGroup || !safeProgram || typeof openAdminRegManageModal !== 'function') return;
    openAdminRegManageModal({
        title: 'Manage group',
        subtitle: `${safeProgram} / ${safeGroup}`,
        editLabel: 'Edit group',
        deleteLabel: 'Delete group',
        onEdit: () => editTrackGroup(safeTabId, safeProgram, safeGroup),
        onDelete: () => {
            const verify = typeof runRegistrationRemoveConfirmation === 'function'
                && typeof buildAdminRegGroupRemoveVerification === 'function'
                ? runRegistrationRemoveConfirmation(buildAdminRegGroupRemoveVerification(safeTabId, safeProgram, safeGroup))
                : window.confirm(`Delete group "${safeGroup}"?`);
            if (!verify) return;
            deleteTrackGroup(safeTabId, safeProgram, safeGroup, { skipVerification: true });
        }
    });
}

function openAdminRegSubjectManage(tabId, programName, groupName, courseIdx) {
    const safeTabId = String(tabId || '').trim();
    const safeProgram = String(programName || '').trim();
    const safeGroup = String(groupName || '').trim();
    const groupData = getTrackProgramGroup(safeTabId, safeProgram, safeGroup);
    const course = groupData?.courses?.[courseIdx];
    if (!course || typeof openAdminRegManageModal !== 'function') return;
    openAdminRegManageModal({
        title: 'Manage subject',
        subtitle: `${safeGroup}: ${course.title || 'Untitled Subject'}`,
        editLabel: 'Edit subject',
        deleteLabel: 'Delete subject',
        onEdit: () => editTrackCourse(safeTabId, safeProgram, safeGroup, courseIdx),
        onDelete: () => {
            const verify = typeof runRegistrationRemoveConfirmation === 'function'
                && typeof buildAdminRegSubjectRemoveVerification === 'function'
                ? runRegistrationRemoveConfirmation(buildAdminRegSubjectRemoveVerification(safeTabId, safeProgram, safeGroup, course))
                : window.confirm(`Delete course "${course.title}"?`);
            if (!verify) return;
            deleteTrackCourse(safeTabId, safeProgram, safeGroup, courseIdx, { skipVerification: true });
        }
    });
}

function renderAdminRegPanelHeadActions(activeTab) {
    const mount = document.querySelector('[data-admin-reg-panel-head-actions]');
    if (!mount) return;
    const tabConfig = resolveAdminRegTab(activeTab);
    if (!tabConfig) {
        mount.hidden = true;
        mount.innerHTML = '';
        return;
    }
    mount.hidden = false;
    mount.innerHTML = `
        <button type="button" class="lux-secondary-btn lux-admin-tools-head-action admin-reg-panel-manage-tab-btn"
            data-admin-reg-manage-tab="${escapeHtml(activeTab)}">
            <i class="fas fa-cog" aria-hidden="true"></i> Manage tab
        </button>
    `;
    const manageBtn = mount.querySelector('[data-admin-reg-manage-tab]');
    if (manageBtn && manageBtn.dataset.bound !== '1') {
        manageBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            openAdminRegTabManage(manageBtn.dataset.adminRegManageTab || activeTab);
        });
        manageBtn.dataset.bound = '1';
    }
}

function rerenderAdminRegTrackTab(tabId) {
    if (typeof rerenderAdminRegistrationModulesPreservingScroll === 'function') {
        rerenderAdminRegistrationModulesPreservingScroll(tabId);
        return;
    }
    renderAdminRegistrationModules(tabId);
}

function refreshAdminRegistrationCmsPresentation() {
    const container = document.getElementById('admin-reg-content-container');
    const tabBar = document.querySelector('[data-admin-reg-tab-bar]');
    if (container) {
        container.setAttribute('data-lux-transparency-exempt', '1');
    }
    if (tabBar) {
        tabBar.setAttribute('data-lux-transparency-exempt', '1');
    }
    if (typeof window.queueLuxuryTransparencyRefresh === 'function') {
        const roots = [container, tabBar].filter(Boolean);
        if (roots.length) {
            window.queueLuxuryTransparencyRefresh(undefined, { roots });
        }
    }
}

function renderAdminRegTabBar(activeTab) {
    const mount = document.querySelector('[data-admin-reg-tab-bar]');
    if (!mount) return;

    const faculty = typeof getAdminRegistrationFaculty === 'function'
        ? getAdminRegistrationFaculty()
        : 'ECON';
    const tabs = getAdminRegTabsForFaculty(faculty);
    const safeActive = getValidAdminRegTabIds(faculty).includes(activeTab) ? activeTab : 'prog';

    const tabMarkup = tabs.map((tab) => {
        const isActive = tab.id === safeActive;
        const activeClass = isActive ? ' is-active active' : '';
        const pressed = isActive ? 'true' : 'false';
        const tabIndex = isActive ? '0' : '-1';
        if (tab.builtin) {
            return `
                <button
                    class="admin-reg-tab lux-secondary-btn${activeClass}"
                    type="button"
                    data-admin-reg-tab="${escapeHtml(tab.id)}"
                    data-admin-tools-reg-tab="${escapeHtml(tab.id)}"
                    data-target="${escapeHtml(tab.id)}"
                    aria-pressed="${pressed}"
                    tabindex="${tabIndex}"
                >${escapeHtml(tab.label)}</button>
            `;
        }
        return `
            <button
                class="admin-reg-tab lux-secondary-btn${activeClass}"
                type="button"
                data-admin-reg-tab="${escapeHtml(tab.id)}"
                data-admin-tools-reg-tab="${escapeHtml(tab.id)}"
                data-target="${escapeHtml(tab.id)}"
                aria-pressed="${pressed}"
                tabindex="${tabIndex}"
            >${escapeHtml(tab.label)}</button>
        `;
    }).join('');

    mount.innerHTML = localizeHtmlMarkup(`
        <div class="admin-reg-tab-tray">
            ${tabMarkup}
        </div>
        <button type="button" class="admin-reg-tab-add-btn lux-secondary-btn" data-admin-reg-add-custom-tab="1" aria-label="Add custom registration tab"><i class="fas fa-plus"></i> Add Tab</button>
    `);
    mount.setAttribute('data-lux-transparency-exempt', '1');

    mount.querySelectorAll('[data-admin-reg-tab]').forEach((button) => {
        if (button.dataset.bound === '1') return;
        button.addEventListener('click', () => {
            if (typeof switchAdminRegTab === 'function') {
                switchAdminRegTab(button.dataset.adminRegTab || 'prog');
            }
        });
        button.dataset.bound = '1';
    });

    renderAdminRegPanelHeadActions(safeActive);

    const addBtn = mount.querySelector('[data-admin-reg-add-custom-tab]');
    if (addBtn && addBtn.dataset.bound !== '1') {
        addBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            openAddCustomAdminRegTabModal();
        });
        addBtn.dataset.bound = '1';
    }
}

function renderAdminRegTrackProgramPane(tabId, tabConfig) {
    const pane = document.getElementById(`admin-reg-track-pane-${tabId}`);
    const selected = getAdminRegSelectedProgram(tabId);
    const track = getAdminRegTrackData(tabId);
    if (!pane) return;

    if (!selected || !track[selected]) {
        pane.innerHTML = buildAdminRegEmptyStateMarkup({
            icon: 'fas fa-sitemap',
            title: `Select a ${tabConfig.programsLabel.toLowerCase().replace(/s$/, '')}`,
            copy: `Choose a program to manage its subject groups.`,
            classes: 'admin-reg-program-pane-empty'
        });
        return;
    }

    const courseGroups = track[selected] || {};
    const groupNames = Object.keys(courseGroups);
    let html = `
        <div class="admin-reg-track-head">
            <div>
                <div class="admin-reg-track-head-title">${escapeHtml(selected)}</div>
                <div class="admin-reg-track-head-copy">${escapeHtml(tabConfig.paneSubtitle)}</div>
            </div>
            <button type="button" data-admin-reg-add-group="${escapeHtml(selected)}" data-admin-reg-tab="${escapeHtml(tabId)}" class="lux-primary-btn admin-reg-track-add-btn"><i class="fas fa-plus"></i> Add Group</button>
        </div>
        <div class="admin-reg-track-groups">
    `;

    if (groupNames.length === 0) {
        html += buildAdminRegEmptyStateMarkup({
            icon: 'fas fa-layer-group',
            title: 'No subject groups added yet',
            copy: 'Create the first group to start assigning subjects.',
            classes: 'admin-reg-track-empty'
        });
    } else {
        groupNames.forEach((groupName) => {
            const group = courseGroups[groupName] || {};
            const groupKey = buildAdminRegGroupKey(tabId, selected, groupName);
            const isExpanded = expandedModules.has(groupKey);
            const progress = getTrackGroupProgress(group, getAssignedCourseEctsTotal(group.courses || []));
            const courses = group.courses || [];
            html += `
                <div class="admin-reg-track-group-card">
                    <div class="admin-reg-track-group-header">
                        <button type="button" class="admin-reg-track-group-toggle" data-admin-reg-toggle-group="${escapeHtml(groupKey)}" data-admin-reg-tab="${escapeHtml(tabId)}">
                            <i class="fas ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'} admin-reg-track-group-chevron"></i>
                            <div class="admin-reg-track-group-main">
                                <div class="admin-reg-track-group-title">${escapeHtml(groupName)}</div>
                                <div class="admin-reg-track-group-copy">${escapeHtml(selected)}</div>
                            </div>
                            <div class="admin-reg-track-group-progress">ECTS: ${escapeHtml(progress.label)}</div>
                        </button>
                        <div class="admin-reg-track-group-actions">
                            ${buildAdminRegManageGearMarkup(`data-admin-reg-manage-group="${escapeHtml(groupName)}" data-admin-reg-program="${escapeHtml(selected)}" data-admin-reg-tab="${escapeHtml(tabId)}"`)}
                        </div>
                    </div>
                    ${isExpanded ? `
                        <div class="admin-reg-track-group-body">
                            <div class="admin-reg-track-subject-head">
                                <div class="admin-reg-track-subject-head-number">#</div>
                                <div class="admin-reg-track-subject-head-title">Subject Title / Module Title</div>
                                <div class="admin-reg-track-subject-head-ects">ECTS</div>
                                <div class="admin-reg-track-subject-head-meta">Precondition / Anti-condition</div>
                                <div class="admin-reg-track-subject-head-actions"></div>
                            </div>
                            <div class="admin-reg-track-subject-list">
                                ${(courses.length === 0 ? `
                                    <div class="admin-reg-track-subject-empty">No subjects assigned</div>
                                ` : courses.map((course, idx) => `
                                    <div class="admin-reg-track-subject-row">
                                        <div class="admin-reg-track-subject-number">${escapeHtml(course.n || idx + 1)}</div>
                                        <div class="admin-reg-track-subject-main">
                                            <div class="admin-reg-track-subject-title">${escapeHtml(course.title || 'Untitled Subject')}</div>
                                            <div class="admin-reg-track-subject-code">${escapeHtml(course.n || '')}</div>
                                        </div>
                                        <div class="admin-reg-track-subject-ects">${escapeHtml(course.ects || '0')}</div>
                                        <div class="admin-reg-track-subject-details">
                                            <div>${escapeHtml(`Prerequisite: ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).prerequisite}`)}</div>
                                            ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).antiRequisite ? `<div class="admin-reg-track-subject-detail">${escapeHtml(`Anti-requisite: ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).antiRequisite}`)}</div>` : ''}
                                            ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).curriculumSemester ? `<div class="admin-reg-track-subject-detail admin-reg-track-subject-detail--semester">${escapeHtml(getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).curriculumSemester)}</div>` : ''}
                                            ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).studentAccess ? `<div class="admin-reg-track-subject-detail admin-reg-track-subject-detail--access">${escapeHtml(`Student access: ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).studentAccess}`)}</div>` : ''}
                                        </div>
                                        <div class="admin-reg-track-subject-actions">
                                            ${buildAdminRegManageGearMarkup(`data-admin-reg-manage-course="${idx}" data-admin-reg-program="${escapeHtml(selected)}" data-admin-reg-group="${escapeHtml(groupName)}" data-admin-reg-tab="${escapeHtml(tabId)}"`)}
                                        </div>
                                    </div>
                                `).join(''))}
                            </div>
                            <div class="admin-reg-track-group-footer">
                                <button type="button" data-admin-reg-add-subject="${escapeHtml(groupName)}" data-admin-reg-program="${escapeHtml(selected)}" data-admin-reg-tab="${escapeHtml(tabId)}" class="lux-primary-btn admin-reg-track-group-add-subject"><i class="fas fa-plus"></i> Add Subject</button>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        });
    }

    html += `</div>`;
    pane.innerHTML = localizeHtmlMarkup(html);
}

function renderAdminRegTrackTab(container, tabConfig) {
    if (!container || !tabConfig) return;
    const tabId = tabConfig.id;
    const track = getAdminRegTrackData(tabId);
    const programs = Object.keys(track || {});

    if (programs.length > 0) {
        const selected = getAdminRegSelectedProgram(tabId);
        if (!selected || !track[selected]) {
            setAdminRegSelectedProgram(tabId, programs[0]);
        }
    } else {
        setAdminRegSelectedProgram(tabId, null);
        setAdminRegSelectedGroupKey(tabId, null);
    }

    const selectedProgram = getAdminRegSelectedProgram(tabId);
    const html = `
        <div class="admin-reg-program-head admin-reg-program-head--large">
            <div class="admin-reg-program-head-main">
                <div class="admin-reg-program-head-title admin-reg-program-head-title--large">${escapeHtml(tabConfig.label)}</div>
            </div>
            <button type="button" data-admin-reg-add-program="1" data-admin-reg-tab="${escapeHtml(tabId)}" class="lux-primary-btn admin-reg-program-add-btn admin-reg-program-add-btn--large"><i class="fas fa-plus"></i> Add Program</button>
        </div>
        <div class="admin-reg-program-layout admin-reg-program-layout--wide">
            <div class="admin-reg-program-list-shell lux-soft-chrome">
                <div class="admin-reg-program-list-head">
                    <div class="admin-reg-program-list-title admin-reg-program-list-title--strong">${escapeHtml(tabConfig.programsLabel)}</div>
                    <span class="admin-reg-program-list-count">${programs.length}</span>
                </div>
                <div data-preserve-scroll-key="${escapeHtml(tabConfig.scrollKey)}" class="admin-reg-program-list">
                    ${programs.length === 0 ? `<div class="admin-reg-program-list-placeholder lux-empty-state">No programs yet</div>` : programs.map((program) => {
                        const checkedAttr = program === selectedProgram ? 'checked' : '';
                        return `
                            <div class="admin-reg-program-option admin-reg-program-option--wide${program === selectedProgram ? ' is-active' : ''}">
                                <label class="admin-reg-program-option-label">
                                    <span class="admin-reg-program-option-row">
                                        <input type="radio" name="admin-reg-program-${escapeHtml(tabId)}" value="${escapeHtml(program)}" ${checkedAttr} data-admin-reg-select-program="${escapeHtml(program)}" data-admin-reg-tab="${escapeHtml(tabId)}" class="admin-reg-program-option-input">
                                        <span class="admin-reg-program-option-title">${escapeHtml(program)}</span>
                                    </span>
                                </label>
                                <div class="admin-reg-program-option-actions">
                                    ${buildAdminRegManageGearMarkup(`data-admin-reg-manage-program="${escapeHtml(program)}" data-admin-reg-tab="${escapeHtml(tabId)}"`)}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            <div id="admin-reg-track-pane-${escapeHtml(tabId)}"></div>
        </div>
    `;

    container.innerHTML = localizeHtmlMarkup(html);
    container.setAttribute('data-lux-transparency-exempt', '1');
    renderAdminRegTrackProgramPane(tabId, tabConfig);
    refreshAdminRegistrationCmsPresentation();
}

function addTrackProgram(tabId) {
    const tabConfig = resolveAdminRegTab(tabId);
    if (!tabConfig) return;
    const containerLabel = String(tabConfig.programsLabel || tabConfig.label || 'Program').replace(/s$/i, '');
    openStructuredFormModal({
        title: `New ${containerLabel}`,
        subtitle: `Create a new ${containerLabel.toLowerCase()} container.`,
        submitLabel: 'Create Program',
        fields: [
            { name: 'programName', label: 'Program Name', placeholder: 'e.g. Brand Management Track', value: '' }
        ],
        onSave: (values, close) => {
            const newName = String(values.programName || '').trim();
            if (!newName) {
                alert('Please enter a program name.');
                return;
            }
            const track = getAdminRegTrackData(tabId);
            if (track[newName]) {
                alert('This program already exists!');
                return;
            }
            ensureTrackProgramGroup(tabId, newName, ADMIN_REG_TRACK_MAIN_GROUP);
            setAdminRegSelectedProgram(tabId, newName);
            queueAdminRegistrationStateSave();
            close();
            rerenderAdminRegTrackTab(tabId);
        }
    });
}

function editTrackProgram(tabId, programName) {
    const safeTabId = String(tabId || '').trim();
    const currentName = String(programName || '').trim();
    const tabConfig = resolveAdminRegTab(safeTabId);
    if (!currentName || !tabConfig) return;
    openStructuredFormModal({
        title: 'Edit Program',
        subtitle: `Rename this ${tabConfig.label.toLowerCase()} container.`,
        submitLabel: 'Save Changes',
        fields: [
            { name: 'programName', label: 'Program Name', value: currentName, placeholder: 'Enter program name' }
        ],
        onSave: (values, close) => {
            const newName = String(values.programName || '').trim();
            if (!newName) {
                alert('Please enter a program name.');
                return;
            }
            const fac = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
            const bucket = ensureAdminRegTrackBucket(fac);
            const program = bucket.trackData?.[safeTabId]?.[currentName];
            if (!program) return;
            if (newName !== currentName && bucket.trackData?.[safeTabId]?.[newName]) {
                alert('Another program already uses that name.');
                return;
            }
            delete bucket.trackData[safeTabId][currentName];
            bucket.trackData[safeTabId][newName] = program;
            if (getAdminRegSelectedProgram(safeTabId) === currentName) {
                setAdminRegSelectedProgram(safeTabId, newName);
            }
            syncAdminRegTrackLegacyMirrors(bucket);
            queueAdminRegistrationStateSave();
            close();
            rerenderAdminRegTrackTab(safeTabId);
        }
    });
}

function deleteTrackProgram(tabId, name, options = {}) {
    const safeTabId = String(tabId || '').trim();
    const programName = String(name || '').trim();
    if (!programName) return;
    if (!options.skipVerification) {
        const tabConfig = resolveAdminRegTab(safeTabId);
        const verify = typeof runRegistrationRemoveConfirmation === 'function'
            && typeof buildAdminRegProgramRemoveVerification === 'function'
            ? runRegistrationRemoveConfirmation(buildAdminRegProgramRemoveVerification(safeTabId, programName, tabConfig))
            : window.confirm(`Delete "${programName}"?`);
        if (!verify) return;
    }
    const fac = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
    const bucket = ensureAdminRegTrackBucket(fac);
    if (bucket.trackData?.[tabId]?.[programName]) {
        delete bucket.trackData[tabId][programName];
    }
    if (getAdminRegSelectedProgram(tabId) === programName) {
        const remaining = Object.keys(getAdminRegTrackData(tabId));
        setAdminRegSelectedProgram(tabId, remaining[0] || null);
    }
    syncAdminRegTrackLegacyMirrors(bucket);
    queueAdminRegistrationStateSave();
    rerenderAdminRegTrackTab(tabId);
}

function addTrackGroup(tabId, programName) {
    openStructuredFormModal({
        title: 'New Subject Group',
        subtitle: 'Add a course group inside the selected program.',
        submitLabel: 'Create Group',
        fields: [
            { name: 'groupName', label: 'Group Name', placeholder: 'e.g. A (101) Core Track', value: '' },
            { name: 'maxEcts', label: 'Maximum ECTS', type: 'number', min: 0, step: 1, value: 30 }
        ],
        onSave: (values, close) => {
            const groupName = String(values.groupName || '').trim();
            const maxEcts = toPositiveInt(values.maxEcts, 30);
            if (!groupName) {
                alert('Please enter a course group name.');
                return;
            }
            const track = getAdminRegTrackData(tabId);
            if (track[programName]?.[groupName]) {
                alert('That group already exists in this program.');
                return;
            }
            ensureTrackProgramGroup(tabId, programName, groupName);
            const group = getTrackProgramGroup(tabId, programName, groupName);
            if (group) {
                group.maxEcts = maxEcts;
                group.completedEcts = 0;
                group.ects = `${maxEcts}/0`;
            }
            setAdminRegSelectedProgram(tabId, programName);
            setAdminRegSelectedGroupKey(tabId, buildAdminRegGroupKey(tabId, programName, groupName));
            queueAdminRegistrationStateSave();
            close();
            rerenderAdminRegTrackTab(tabId);
        }
    });
}

function editTrackGroup(tabId, programName, groupName) {
    const group = getTrackProgramGroup(tabId, programName, groupName);
    if (!group) return;
    openStructuredFormModal({
        title: 'Edit Subject Group',
        subtitle: 'Update the group name and its credit target.',
        submitLabel: 'Save Changes',
        fields: [
            { name: 'groupName', label: 'Group Name', value: groupName, placeholder: 'Enter group name' },
            { name: 'maxEcts', label: 'Maximum ECTS', type: 'number', min: 0, step: 1, value: group.maxEcts || parseEctsProgress(group.ects || '30/0').max || 30 }
        ],
        onSave: (values, close) => {
            const newName = String(values.groupName || '').trim();
            const newMax = toPositiveInt(values.maxEcts, group.maxEcts || parseEctsProgress(group.ects || '30/0').max || 30);
            if (!newName) {
                alert('Please enter a group name.');
                return;
            }
            const fac = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
            const bucket = ensureAdminRegTrackBucket(fac);
            const program = bucket.trackData?.[tabId]?.[programName];
            if (!program) return;
            if (newName !== groupName && program[newName]) {
                alert('Another group already uses that name.');
                return;
            }
            const previous = program[groupName];
            delete program[groupName];
            program[newName] = {
                ...previous,
                maxEcts: newMax,
                completedEcts: Number(previous?.completedEcts || 0),
                courses: previous?.courses || []
            };
            syncAdminRegTrackLegacyMirrors(bucket);
            queueAdminRegistrationStateSave();
            close();
            rerenderAdminRegTrackTab(tabId);
        }
    });
}

function deleteTrackGroup(tabId, programName, groupName, options = {}) {
    const safeGroup = String(groupName || '').trim();
    if (!safeGroup) return;
    if (!options.skipVerification) {
        const verify = typeof runRegistrationRemoveConfirmation === 'function'
            && typeof buildAdminRegGroupRemoveVerification === 'function'
            ? runRegistrationRemoveConfirmation(buildAdminRegGroupRemoveVerification(tabId, programName, safeGroup))
            : window.confirm(`Delete group "${safeGroup}"?`);
        if (!verify) return;
    }
    const fac = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
    const bucket = ensureAdminRegTrackBucket(fac);
    if (bucket.trackData?.[tabId]?.[programName]?.[groupName]) {
        delete bucket.trackData[tabId][programName][groupName];
    }
    syncAdminRegTrackLegacyMirrors(bucket);
    queueAdminRegistrationStateSave();
    rerenderAdminRegTrackTab(tabId);
}

function addTrackSubject(tabId, program, group) {
    window.currentSubjectContext = { programName: program, groupName: group, programType: tabId };
    openCourseSelectionModal(null, null, {
        programType: tabId,
        context: { programName: program, groupName: group }
    });
}

function editTrackCourse(tabId, program, group, courseIdx) {
    const groupData = getTrackProgramGroup(tabId, program, group);
    if (!groupData || !Array.isArray(groupData.courses)) return;
    const course = groupData.courses[courseIdx];
    if (!course) return;
    const currentFaculty = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
    openStructuredFormModal({
        title: 'Edit Subject',
        subtitle: 'Curriculum Library controls prerequisite and related metadata. You can manage student access here.',
        submitLabel: 'Save Changes',
        fields: [
            { name: 'title', label: 'Course Title', value: course.title, placeholder: 'Enter course title' },
            ...getCourseSeatLimitFieldConfig(course),
            { name: 'curriculumInfo', label: 'Curriculum Library Info', type: 'textarea', rows: 4, value: getAssignedCourseCurriculumSummary(course, currentFaculty), readonly: true, help: 'This information comes directly from Curriculum Library.' },
            ...getSemesterRestrictionFieldConfig(course)
        ],
        onSave: (values, close) => {
            const newTitle = String(values.title || '').trim();
            const restriction = normalizeAssignedSemesterRestriction(values.semesterRuleMode, values.allowedSemesters);
            if (!newTitle) {
                alert('Please enter a course title.');
                return;
            }
            course.title = newTitle;
            course.semesterRuleMode = restriction.semesterRuleMode;
            course.allowedSemesters = restriction.allowedSemesters;
            applyAssignedCourseSeatDefaults(course, values);
            queueAdminRegistrationStateSave();
            close();
            rerenderAdminRegTrackTab(tabId);
        }
    });
}

function deleteTrackCourse(tabId, program, group, courseIdx, options = {}) {
    const groupData = getTrackProgramGroup(tabId, program, group);
    if (!groupData || !Array.isArray(groupData.courses)) return;
    const course = groupData.courses[courseIdx];
    if (!course) return;
    if (!options.skipVerification) {
        const verify = typeof runRegistrationRemoveConfirmation === 'function'
            && typeof buildAdminRegSubjectRemoveVerification === 'function'
            ? runRegistrationRemoveConfirmation(buildAdminRegSubjectRemoveVerification(tabId, program, group, course))
            : window.confirm(`Delete course "${course.title}"?`);
        if (!verify) return;
    }
    groupData.courses.splice(courseIdx, 1);
    const fac = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
    const bucket = ensureAdminRegTrackBucket(fac);
    syncAdminRegTrackLegacyMirrors(bucket);
    queueAdminRegistrationStateSave();
    rerenderAdminRegTrackTab(tabId);
}

function saveBuiltinAdminRegTabOverrides(tabId, values = {}) {
    const safeTabId = String(tabId || '').trim();
    if (!safeTabId || !isBuiltinAdminRegTab(safeTabId)) return false;
    const label = String(values.label || '').trim();
    if (!label) {
        alert('Please enter a tab label.');
        return false;
    }
    const fac = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
    const bucket = ensureAdminRegTrackBucket(fac);
    bucket.builtinTabOverrides[safeTabId] = {
        label,
        description: String(values.description || '').trim(),
        programsLabel: String(values.programsLabel || '').trim() || `${label} Programs`,
        paneSubtitle: String(values.paneSubtitle || '').trim() || `${label} Subjects`
    };
    queueAdminRegistrationStateSave();
    return true;
}

function openEditAdminRegTabModal(tabId) {
    const safeTabId = String(tabId || '').trim();
    const tabConfig = resolveAdminRegTab(safeTabId);
    if (!tabConfig) return;
    const isBuiltin = Boolean(tabConfig.builtin);
    const fields = [
        { name: 'label', label: 'Tab Label', placeholder: 'e.g. Specialization', value: tabConfig.label || '' },
        { name: 'description', label: 'Description', type: 'textarea', rows: 2, placeholder: 'Describe this registration lane.', value: tabConfig.description || '' }
    ];
    if (isBuiltin) {
        fields.push(
            { name: 'programsLabel', label: 'Programs Panel Title', placeholder: 'Program Modules', value: tabConfig.programsLabel || '' },
            { name: 'paneSubtitle', label: 'Subjects Panel Subtitle', placeholder: 'Program Module Subjects', value: tabConfig.paneSubtitle || '' }
        );
    }
    openStructuredFormModal({
        title: 'Edit Registration Tab',
        subtitle: isBuiltin
            ? 'Rename this core registration lane for the active faculty.'
            : 'Rename this custom registration lane.',
        submitLabel: 'Save Tab',
        fields,
        onSave: (values, close) => {
            if (isBuiltin) {
                if (!saveBuiltinAdminRegTabOverrides(safeTabId, values)) return;
            } else {
                const label = String(values.label || '').trim();
                const description = String(values.description || '').trim();
                if (!label) {
                    alert('Please enter a tab label.');
                    return;
                }
                renameCustomAdminRegTab(safeTabId, label);
                const fac = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
                const bucket = ensureAdminRegTrackBucket(fac);
                const tab = (bucket.customTabs || []).find((entry) => entry.id === safeTabId);
                if (tab) {
                    tab.description = description;
                    queueAdminRegistrationStateSave();
                }
            }
            close();
            renderAdminRegTabBar(safeTabId);
            renderAdminRegPanelHeadActions(safeTabId);
            if (typeof rerenderAdminRegTrackTab === 'function') {
                rerenderAdminRegTrackTab(safeTabId);
            }
        }
    });
}

function hideBuiltinAdminRegTab(tabId) {
    const safeTabId = String(tabId || '').trim();
    if (!safeTabId || !isBuiltinAdminRegTab(safeTabId)) return;
    const tabConfig = resolveAdminRegTab(safeTabId);
    if (!tabConfig) return;

    const fac = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
    const visibleTabs = getValidAdminRegTabIds(fac);
    if (visibleTabs.length <= 1 && visibleTabs.includes(safeTabId)) {
        alert('At least one registration tab must remain visible for this faculty.');
        return;
    }

    const verify = typeof runRegistrationRemoveVerification === 'function'
        && typeof buildAdminRegBuiltinTabRemoveVerification === 'function'
        ? runRegistrationRemoveVerification(buildAdminRegBuiltinTabRemoveVerification(safeTabId, tabConfig))
        : window.confirm(`Hide built-in tab "${tabConfig.label}" for this faculty?`);
    if (!verify) return;

    const bucket = ensureAdminRegTrackBucket(fac);
    if (!bucket.hiddenBuiltinTabs.includes(safeTabId)) {
        bucket.hiddenBuiltinTabs.push(safeTabId);
    }
    const studentTabId = tabConfig.studentTabId || safeTabId;
    if (typeof purgeStudentRegistrationTrackSelectionForTab === 'function') {
        purgeStudentRegistrationTrackSelectionForTab(safeTabId, studentTabId);
    }
    if (adminRegUiState?.selectedTrack?.[safeTabId]) {
        delete adminRegUiState.selectedTrack[safeTabId];
    }
    queueAdminRegistrationStateSave();
    const fallback = getValidAdminRegTabIds(fac)[0] || 'prog';
    renderAdminRegTabBar(fallback);
    if (typeof switchAdminRegTab === 'function') {
        switchAdminRegTab(fallback);
    }
}

function openAdminRegTabManage(tabId) {
    const safeTabId = String(tabId || '').trim();
    if (!safeTabId || typeof openAdminRegManageModal !== 'function') return;
    const tabConfig = resolveAdminRegTab(safeTabId);
    if (!tabConfig) return;
    const isBuiltin = Boolean(tabConfig.builtin);
    openAdminRegManageModal({
        title: 'Manage tab',
        subtitle: tabConfig.label,
        editLabel: 'Edit tab',
        deleteLabel: 'Remove tab',
        onEdit: () => openEditAdminRegTabModal(safeTabId),
        onDelete: () => (isBuiltin ? hideBuiltinAdminRegTab(safeTabId) : deleteCustomAdminRegTab(safeTabId))
    });
}

function openAddCustomAdminRegTabModal() {
    openStructuredFormModal({
        title: 'Add Registration Tab',
        subtitle: 'Create a custom registration lane with the same program/group layout.',
        submitLabel: 'Create Tab',
        fields: [
            { name: 'label', label: 'Tab Label', placeholder: 'e.g. Specialization', value: '' },
            { name: 'description', label: 'Description', type: 'textarea', rows: 2, placeholder: 'Describe this registration lane.', value: '' }
        ],
        onSave: (values, close) => {
            const label = String(values.label || '').trim();
            const description = String(values.description || '').trim();
            if (!label) {
                alert('Please enter a tab label.');
                return;
            }
            const fac = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
            const bucket = ensureAdminRegTrackBucket(fac);
            const baseId = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'custom';
            let tabId = `custom_${baseId}`;
            let suffix = 1;
            while (resolveAdminRegTab(tabId)) {
                tabId = `custom_${baseId}_${suffix}`;
                suffix += 1;
            }
            bucket.customTabs.push({
                id: tabId,
                label,
                description,
                programsLabel: `${label} Programs`,
                paneSubtitle: `${label} Subjects`,
                scrollKey: `admin-reg-custom-${tabId}`,
                studentTabId: tabId
            });
            if (!bucket.trackData[tabId]) {
                bucket.trackData[tabId] = {};
            }
            queueAdminRegistrationStateSave();
            close();
            renderAdminRegTabBar(tabId);
            if (typeof switchAdminRegTab === 'function') {
                switchAdminRegTab(tabId);
            }
        }
    });
}

function deleteCustomAdminRegTab(tabId) {
    const safeTabId = String(tabId || '').trim();
    if (!safeTabId || isBuiltinAdminRegTab(safeTabId)) return;
    const tabConfig = resolveAdminRegTab(safeTabId);
    if (!tabConfig) return;

    const track = getAdminRegTrackData(safeTabId);
    const programCount = Object.keys(track || {}).length;
    const verify = typeof runRegistrationRemoveVerification === 'function'
        && typeof buildAdminRegTabRemoveVerification === 'function'
        ? runRegistrationRemoveVerification(buildAdminRegTabRemoveVerification(safeTabId, tabConfig, programCount))
        : window.confirm(`Delete custom tab "${tabConfig.label}"?`);
    if (!verify) return;

    const fac = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
    const bucket = ensureAdminRegTrackBucket(fac);
    const studentTabId = tabConfig.studentTabId || safeTabId;
    bucket.customTabs = (bucket.customTabs || []).filter((tab) => tab.id !== safeTabId);
    if (bucket.trackData?.[safeTabId]) {
        delete bucket.trackData[safeTabId];
    }
    if (typeof purgeStudentRegistrationTrackSelectionForTab === 'function') {
        purgeStudentRegistrationTrackSelectionForTab(safeTabId, studentTabId);
    }
    if (adminRegUiState?.selectedTrack?.[safeTabId]) {
        delete adminRegUiState.selectedTrack[safeTabId];
    }
    queueAdminRegistrationStateSave();
    const fallback = getValidAdminRegTabIds(fac)[0] || 'prog';
    renderAdminRegTabBar(fallback);
    if (typeof switchAdminRegTab === 'function') {
        switchAdminRegTab(fallback);
    }
}

function renameCustomAdminRegTab(tabId, nextLabel) {
    if (isBuiltinAdminRegTab(tabId)) return;
    const label = String(nextLabel || '').trim();
    if (!label) return;
    const fac = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
    const bucket = ensureAdminRegTrackBucket(fac);
    const tab = (bucket.customTabs || []).find((entry) => entry.id === tabId);
    if (!tab) return;
    tab.label = label;
    tab.programsLabel = `${label} Programs`;
    tab.paneSubtitle = `${label} Subjects`;
    queueAdminRegistrationStateSave();
    renderAdminRegTabBar(tabId);
}

function handleAdminRegTrackDelegateClick(event) {
    const manageProgramTrigger = event.target.closest('[data-admin-reg-manage-program]');
    if (manageProgramTrigger) {
        const tabId = manageProgramTrigger.dataset.adminRegTab || adminRegActiveTab;
        const programName = manageProgramTrigger.dataset.adminRegManageProgram || '';
        if (programName && resolveAdminRegTab(tabId) && typeof openAdminRegManageModal === 'function') {
            event.preventDefault();
            event.stopPropagation();
            openAdminRegProgramManage(tabId, programName);
            return true;
        }
        return false;
    }

    const manageGroupTrigger = event.target.closest('[data-admin-reg-manage-group]');
    if (manageGroupTrigger) {
        const tabId = manageGroupTrigger.dataset.adminRegTab || adminRegActiveTab;
        const programName = manageGroupTrigger.dataset.adminRegProgram || '';
        const groupName = manageGroupTrigger.dataset.adminRegManageGroup || '';
        if (groupName && programName && typeof openAdminRegManageModal === 'function') {
            event.preventDefault();
            event.stopPropagation();
            openAdminRegGroupManage(tabId, programName, groupName);
            return true;
        }
        return false;
    }

    const manageCourseTrigger = event.target.closest('[data-admin-reg-manage-course]');
    if (manageCourseTrigger) {
        const tabId = manageCourseTrigger.dataset.adminRegTab || adminRegActiveTab;
        const programName = manageCourseTrigger.dataset.adminRegProgram || '';
        const groupName = manageCourseTrigger.dataset.adminRegGroup || '';
        const courseIdx = Number.parseInt(manageCourseTrigger.dataset.adminRegManageCourse || '0', 10) || 0;
        const groupData = getTrackProgramGroup(tabId, programName, groupName);
        if (groupData?.courses?.[courseIdx] && typeof openAdminRegManageModal === 'function') {
            event.preventDefault();
            event.stopPropagation();
            openAdminRegSubjectManage(tabId, programName, groupName, courseIdx);
            return true;
        }
        return false;
    }

    const addProgramTrigger = event.target.closest('[data-admin-reg-add-program]');
    if (addProgramTrigger) {
        event.preventDefault();
        addTrackProgram(addProgramTrigger.dataset.adminRegTab || adminRegActiveTab);
        return true;
    }

    const addGroupTrigger = event.target.closest('[data-admin-reg-add-group]');
    if (addGroupTrigger) {
        event.preventDefault();
        addTrackGroup(
            addGroupTrigger.dataset.adminRegTab || adminRegActiveTab,
            addGroupTrigger.dataset.adminRegAddGroup || ''
        );
        return true;
    }

    const toggleGroupTrigger = event.target.closest('[data-admin-reg-toggle-group]');
    if (toggleGroupTrigger) {
        event.preventDefault();
        if (typeof toggleAdminRegModule === 'function') {
            toggleAdminRegModule(toggleGroupTrigger.dataset.adminRegToggleGroup || '');
        }
        return true;
    }

    const addSubjectTrigger = event.target.closest('[data-admin-reg-add-subject]');
    if (addSubjectTrigger && addSubjectTrigger.dataset.adminRegProgram) {
        event.preventDefault();
        addTrackSubject(
            addSubjectTrigger.dataset.adminRegTab || adminRegActiveTab,
            addSubjectTrigger.dataset.adminRegProgram || '',
            addSubjectTrigger.dataset.adminRegAddSubject || ''
        );
        return true;
    }

    const addCustomTabTrigger = event.target.closest('[data-admin-reg-add-custom-tab]');
    if (addCustomTabTrigger) {
        event.preventDefault();
        openAddCustomAdminRegTabModal();
        return true;
    }

    return false;
}

function handleAdminRegTrackDelegateChange(event) {
    const programTrigger = event.target.closest('[data-admin-reg-select-program]');
    if (programTrigger) {
        const tabId = programTrigger.dataset.adminRegTab || adminRegActiveTab;
        const container = document.getElementById('admin-reg-content-container');
        if (container) {
            container.querySelectorAll('.admin-reg-program-option').forEach((option) => {
                option.classList.remove('is-active');
            });
            programTrigger.closest('.admin-reg-program-option')?.classList.add('is-active');
        }
        setAdminRegSelectedProgram(tabId, programTrigger.dataset.adminRegSelectProgram || '');
        renderAdminRegTrackProgramPane(tabId, resolveAdminRegTab(tabId));
        return true;
    }
    return false;
}

__kiuArtExpose({
    ADMIN_REG_BUILTIN_TABS,
    ADMIN_REG_TRACK_MIGRATION_VERSION,
    migrateAdminRegistrationCmsToTrackModel,
    ensureAdminRegTrackBucket,
    getAdminRegTrackData,
    syncAdminRegTrackLegacyMirrors,
    getAdminRegTabsForFaculty,
    resolveAdminRegTab,
    getValidAdminRegTabIds,
    isBuiltinAdminRegTab,
    getAdminRegSelectedProgram,
    setAdminRegSelectedProgram,
    getAdminRegSelectedGroupKey,
    buildAdminRegGroupKey,
    ensureTrackProgramGroup,
    getTrackProgramGroup,
    renderAdminRegTabBar,
    renderAdminRegPanelHeadActions,
    editTrackProgram,
    renderAdminRegTrackTab,
    renderAdminRegTrackProgramPane,
    addTrackProgram,
    deleteTrackProgram,
    addTrackGroup,
    editTrackGroup,
    deleteTrackGroup,
    addTrackSubject,
    editTrackCourse,
    deleteTrackCourse,
    openAddCustomAdminRegTabModal,
    openAdminRegTabManage,
    openEditAdminRegTabModal,
    hideBuiltinAdminRegTab,
    deleteCustomAdminRegTab,
    renameCustomAdminRegTab,
    handleAdminRegTrackDelegateClick,
    handleAdminRegTrackDelegateChange,
    refreshAdminRegistrationCmsPresentation,
    rerenderAdminRegTrackTab,
    convertTrackTabForStudent,
});
