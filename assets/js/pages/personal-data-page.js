function getStudentAdminProfile(userId) {
    const store = window.KIU_STATE?.studentAdminProfiles;
    if (!store || typeof store !== 'object') return {};
    return store[String(userId)] || {};
}

function normalizePersonalDataMobility(profile = {}) {
    if (typeof window.StudentsAdminMobility?.normalizeStudentMobility === 'function') {
        return window.StudentsAdminMobility.normalizeStudentMobility(profile);
    }
    const mobility = {
        category: 'degree',
        direction: 'none',
        homeInstitution: '',
        homeCountry: '',
        hostProgram: '',
        startDate: '',
        endDate: '',
        agreementRef: '',
        internalFromFaculty: '',
        internalFromProgram: '',
        notes: '',
        ...(profile.mobility && typeof profile.mobility === 'object' ? profile.mobility : {})
    };
    if (!profile.mobility && profile.enrollmentType === 'Exchange Student') {
        mobility.category = 'exchange_incoming';
        mobility.direction = 'incoming';
    } else if (!profile.mobility && profile.enrollmentType === 'Visiting Student') {
        mobility.category = 'visiting_incoming';
        mobility.direction = 'incoming';
    }
    return mobility;
}

function formatMobilityStatusLabel(mobility) {
    const labels = {
        exchange_incoming: 'Exchange student (incoming)',
        visiting_incoming: 'Visiting student (incoming)',
        exchange_outgoing: 'Exchange student (outgoing)',
        internal_transfer: 'Internal KIU transfer',
        degree: 'Degree-seeking'
    };
    return labels[mobility.category] || 'Degree-seeking';
}

function formatMobilityPeriod(startDate, endDate) {
    if (typeof window.StudentsAdminMobility?.formatMobilityPeriod === 'function') {
        return window.StudentsAdminMobility.formatMobilityPeriod(startDate, endDate);
    }
    const formatPart = value => {
        if (!value) return '';
        const date = new Date(`${value}T00:00:00`);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };
    const start = formatPart(startDate);
    const end = formatPart(endDate);
    if (start && end) return `${start} – ${end}`;
    return start || end || '-';
}

function isPersonalDataMobilityActive(mobility) {
    return mobility.category !== 'degree' || mobility.direction !== 'none';
}

function getPersonalDataRecordKey(label) {
    return String(label || 'record')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'record';
}

function ensurePersonalDataRecordItem(recordsBody, key) {
    let item = recordsBody.querySelector(`[data-personal-data-record-key="${key}"]`);
    if (item) return item;

    item = document.createElement('div');
    item.className = 'personal-data-record-item lux-data-card lux-info-card lux-summary-surface lux-summary-surface--panel';
    item.dataset.personalDataRecordKey = key;

    const labelEl = document.createElement('span');
    labelEl.className = 'personal-data-record-label';
    item.appendChild(labelEl);

    const valueEl = document.createElement('span');
    valueEl.className = 'personal-data-record-value lux-record-card-value';
    item.appendChild(valueEl);

    return item;
}

function syncPersonalDataRecordItems(recordsBody, recordItems = []) {
    if (!recordsBody) return;

    const activeKeys = new Set();
    recordItems.forEach(([label, value]) => {
        const key = getPersonalDataRecordKey(label);
        const item = ensurePersonalDataRecordItem(recordsBody, key);
        item.querySelector('.personal-data-record-label').textContent = label ?? '-';
        item.querySelector('.personal-data-record-value').textContent = value ?? '-';
        recordsBody.appendChild(item);
        activeKeys.add(key);
    });

    Array.from(recordsBody.children).forEach((child) => {
        if (!activeKeys.has(child.dataset.personalDataRecordKey || '')) {
            child.remove();
        }
    });
}

function renderPersonalDataIdentitySection(user, facultyProfile) {
    const nameEl = document.getElementById('personal-data-name');
    const statusEl = document.getElementById('personal-data-status');
    const programEl = document.getElementById('personal-data-program');
    const idEl = document.getElementById('personal-data-id');
    const levelHeadingEl = document.getElementById('personal-data-level-heading');
    const recordsTitleEl = document.getElementById('personal-data-records-title');
    const avatarEl = document.getElementById('personal-data-avatar');

    if (nameEl) {
        const displayName = user?.nameEn || user?.name || 'Portal User';
        const parts = displayName.split(/\s+/);
        nameEl.innerHTML = parts.length > 1 ? `${parts[0]}<br>${parts.slice(1).join(' ')}` : displayName;
    }
    if (statusEl) statusEl.textContent = user?.status || 'Active';
    if (programEl) programEl.textContent = getProgramLabelForUser(user, facultyProfile);
    if (idEl) idEl.textContent = user?.id || 'N/A';
    if (levelHeadingEl) levelHeadingEl.textContent = getAcademicLevelLabel(user);
    if (recordsTitleEl) {
        recordsTitleEl.textContent = user?.role === USER_ROLES.STUDENT ? 'Academic Information' : 'Employment Information';
    }
    if (avatarEl) {
        const storedPhoto = scrubFakeMedia(user?.photo || user?.image || '');
        const fallbackAvatar = ensurePersonalDataAvatarFallback(avatarEl);
        if (storedPhoto) {
            avatarEl.hidden = false;
            avatarEl.src = storedPhoto;
            if (fallbackAvatar) fallbackAvatar.hidden = true;
        } else {
            avatarEl.removeAttribute('src');
            avatarEl.hidden = true;
            if (fallbackAvatar) {
                fallbackAvatar.textContent = getInitialsAvatar(user?.nameEn || user?.name || 'Portal User');
                fallbackAvatar.hidden = false;
            }
        }
    }
}

function collectPersonalDataContext(user, facultyProfile) {
    const summary = getUserPerformanceSummary(user);
    const status = user?.status || 'Active';
    const preferredFaculty = user?.facultyCode || user?.faculty || getCurrentFaculty();
    const facultyName = facultyProfile?.fullName || facultyProfile?.name || getFacultyLabel(preferredFaculty);
    const programLabel = getProgramLabelForUser(user, facultyProfile);
    const entryDate = getStudentAdmissionDate(user);
    const currentTermLabel = getCurrentAcademicTermLabel();
    const balance = typeof getEffectiveTuitionBalance === 'function'
        ? getEffectiveTuitionBalance(user?.id)
        : ((KIU_STATE.tuitionBalances && KIU_STATE.tuitionBalances[user?.id]) || 0);
    const isProbation = !!KIU_STATE.probationStatus?.[user?.id];
    const registeredEcts = typeof getStudentRegisteredEctsTotal === 'function'
        ? getStudentRegisteredEctsTotal(user?.id, preferredFaculty)
        : 0;
    const scheduledSections = Array.isArray(KIU_STATE.studentSchedulesByStudent?.[user?.id])
        ? KIU_STATE.studentSchedulesByStudent[user.id]
        : [];
    const scheduledCourseCount = new Set(scheduledSections.map((item) => item?.courseId).filter(Boolean)).size;
    const loadLabel = user?.role === USER_ROLES.STUDENT
        ? `${registeredEcts || 0} ECTS`
        : summary.secondary || '0h';

    const adminProfile = user?.role === USER_ROLES.STUDENT ? getStudentAdminProfile(user.id) : {};
    const mobility = normalizePersonalDataMobility(adminProfile);

    return {
        summary,
        status,
        preferredFaculty,
        facultyName,
        programLabel,
        entryDate,
        currentTermLabel,
        balance,
        isProbation,
        registeredEcts,
        scheduledCourseCount,
        loadLabel,
        mobility,
        mobilityActive: isPersonalDataMobilityActive(mobility)
    };
}

function renderPersonalDataSummarySection(user, context) {
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value ?? '-';
    };
    const setHtml = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = value ?? '-';
    };

    setText('personal-data-kpi-semester', context.summary.primary);
    setText('personal-data-kpi-gpa', context.summary.secondary);
    setText('personal-data-kpi-ects', context.summary.tertiary);
    setHtml('personal-data-kpi-average', context.summary.quaternary);
}

function renderPersonalDataMobilitySection(context) {
    const group = document.getElementById('personal-data-mobility-group');
    const muted = document.getElementById('personal-data-mobility-muted');
    const fields = document.getElementById('personal-data-mobility-fields');
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value ?? '-';
    };

    if (!group) return;

    const mobility = context.mobility || normalizePersonalDataMobility({});
    const active = context.mobilityActive;

    if (muted) muted.hidden = active;
    if (fields) fields.hidden = !active;

    if (!active) return;

    setText('personal-data-mobility-status', formatMobilityStatusLabel(mobility));
    setText('personal-data-home-institution', mobility.homeInstitution || '-');
    setText('personal-data-mobility-period', formatMobilityPeriod(mobility.startDate, mobility.endDate));
    setText('personal-data-agreement-ref', mobility.agreementRef || '-');

    const internalWrap = document.getElementById('personal-data-internal-from-wrap');
    if (mobility.category === 'internal_transfer') {
        if (internalWrap) internalWrap.hidden = false;
        const fromLabel = [mobility.internalFromFaculty, mobility.internalFromProgram].filter(Boolean).join(' / ') || '-';
        setText('personal-data-internal-from', fromLabel);
    } else if (internalWrap) {
        internalWrap.hidden = true;
    }

    const homeWrap = document.getElementById('personal-data-home-institution-wrap');
    const periodWrap = document.getElementById('personal-data-mobility-period-wrap');
    const agreementWrap = document.getElementById('personal-data-agreement-wrap');
    const showPartner = mobility.category !== 'internal_transfer';
    if (homeWrap) homeWrap.hidden = !showPartner;
    if (periodWrap) periodWrap.hidden = false;
    if (agreementWrap) agreementWrap.hidden = !mobility.agreementRef && showPartner;
}

function renderPersonalDataFactsSection(user, context) {
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value ?? '-';
    };

    setText('personal-data-faculty', context.facultyName);
    setText('personal-data-program-name', context.programLabel);
    setText('personal-data-entry-date', formatPersonalDataDate(context.entryDate));
    setText('personal-data-current-term', context.currentTermLabel);
    setText('personal-data-hold', user?.role === USER_ROLES.STUDENT ? (context.balance > 0 ? `${Math.round(context.balance)} GEL hold` : 'Clear') : 'N/A');
    setText('personal-data-probation', user?.role === USER_ROLES.STUDENT ? (context.isProbation ? 'Under review' : 'Clear') : 'N/A');
    setText('personal-data-load', context.loadLabel);
    setText('personal-data-record-state', getStudentPersonalDataRecordLabel(user, context.preferredFaculty));
}

function buildPersonalDataRecordItems(user, context) {
    const recordItems = [
        ['Faculty', context.facultyName],
        ['Program', context.programLabel],
        ['Level', getAcademicLevelLabel(user)],
        ['Status', context.status],
        ['Record state', getStudentPersonalDataRecordLabel(user, context.preferredFaculty)],
        ['Entry date', formatPersonalDataDate(context.entryDate)],
        ['Current term', context.currentTermLabel],
    ];
    if (user?.role === USER_ROLES.STUDENT) {
        recordItems.push(
            ['Tuition hold', context.balance > 0 ? `${Math.round(context.balance)} GEL outstanding` : 'Clear'],
            ['Probation', context.isProbation ? 'Under review' : 'Clear'],
            ['Enrollment load', `${context.registeredEcts || 0} ECTS / ${context.scheduledCourseCount || 0} subjects`]
        );
        if (context.mobilityActive) {
            const mobility = context.mobility || {};
            recordItems.push(['Mobility status', formatMobilityStatusLabel(mobility)]);
            if (mobility.homeInstitution) recordItems.push(['Home institution', mobility.homeInstitution]);
            const period = formatMobilityPeriod(mobility.startDate, mobility.endDate);
            if (period && period !== '-') recordItems.push(['Mobility period', period]);
            if (mobility.agreementRef) recordItems.push(['Agreement', mobility.agreementRef]);
            if (mobility.category === 'internal_transfer') {
                const fromLabel = [mobility.internalFromFaculty, mobility.internalFromProgram].filter(Boolean).join(' / ');
                if (fromLabel) recordItems.push(['Internal transfer from', fromLabel]);
            }
        }
    } else {
        recordItems.push(
            ['Appointment', 'Faculty appointment'],
            ['Teaching load', context.loadLabel],
            ['Assigned subjects', `${(user?.subjects || []).length || context.scheduledCourseCount || 0}`]
        );
    }
    return recordItems;
}

function renderPersonalDataRecordsSection(user, context) {
    const recordsBody = document.getElementById('personal-data-records-body');
    if (!recordsBody) return;
    syncPersonalDataRecordItems(recordsBody, buildPersonalDataRecordItems(user, context));
}

function renderPersonalDataPageContext(user, facultyProfile) {
    if (!document.getElementById('page-personal-data')) return;
    const context = collectPersonalDataContext(user, facultyProfile);
    renderPersonalDataIdentitySection(user, facultyProfile);
    renderPersonalDataSummarySection(user, context);
    renderPersonalDataFactsSection(user, context);
    renderPersonalDataMobilitySection(context);
    renderPersonalDataRecordsSection(user, context);
}

function initPersonalDataPageContext() {
    if (!document.getElementById('page-personal-data')) return;
    const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (!currentUser) return;
    const facultyProfile = typeof getFacultyProfile === 'function'
        ? getFacultyProfile(getCurrentFaculty())
        : null;
    renderPersonalDataPageContext(currentUser, facultyProfile);
}

window.renderPersonalDataPageContext = renderPersonalDataPageContext;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPersonalDataPageContext, { once: true });
} else {
    initPersonalDataPageContext();
}
