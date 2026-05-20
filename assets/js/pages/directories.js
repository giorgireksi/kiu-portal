/* Staff and student directory logic extracted from core.js. Source of truth remains root core.js compatibility bundle. */

//  STAFF DIRECTORY  (Professors + TAs, faculty-scoped)
// Shared text normalization keeps staff-directory values readable across legacy records.
function escapeDirectoryHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function hexToRgbString(hex) {
    const normalized = String(hex || '').trim().replace('#', '');
    const full = normalized.length === 3 ? normalized.split('').map(char => char + char).join('') : normalized;
    if (!/^[0-9a-fA-F]{6}$/.test(full)) return '200,130,42';
    const int = parseInt(full, 16);
    return `${(int >> 16) & 255},${(int >> 8) & 255},${int & 255}`;
}

function normalizeDirectoryText(value, fallback = '') {
    const raw = value == null ? '' : String(value);
    const normalized = typeof cleanupEncodingArtifacts === 'function'
        ? cleanupEncodingArtifacts(raw)
        : raw;
    const translated = typeof toEnglishText === 'function'
        ? toEnglishText(normalized)
        : normalized;
    const cleaned = typeof cleanupEncodingArtifacts === 'function'
        ? cleanupEncodingArtifacts(translated)
        : translated;
    const finalValue = String(cleaned || '').trim();
    return finalValue || fallback;
}

function normalizeDirectorySearchText(value, fallback = '') {
    return normalizeDirectoryText(value, fallback).toLowerCase();
}

function directoryJsString(value) {
    return JSON.stringify(String(value ?? ''));
}

function getDirectoryStatusTone(status) {
    const normalized = normalizeDirectorySearchText(status || 'active');
    if (normalized.includes('suspend') || normalized.includes('blocked') || normalized.includes('hold')) return 'danger';
    if (normalized.includes('probation') || normalized.includes('pending') || normalized.includes('review')) return 'warning';
    if (normalized.includes('inactive') || normalized.includes('archived') || normalized.includes('withdraw')) return 'muted';
    return 'success';
}

function getDirectoryMicrosoftState(entity = {}) {
    const email = normalizeDirectorySearchText(entity.email || '');
    const linked = Boolean(email && (email.includes('@kiu.edu.ge') || email.includes('@student.kiu.edu.ge')));
    return {
        linked,
        label: linked ? 'Microsoft linked' : 'Microsoft check',
        tone: linked ? 'success' : 'warning'
    };
}

function getStudentDirectorySignals(student = {}) {
    const balance = Number((KIU_STATE?.tuitionBalances && KIU_STATE.tuitionBalances[student.id]) || student.balance || student.tuitionBalance || 0);
    const gpa = Number(student.gpa || 0);
    const probation = Boolean((KIU_STATE?.probationStatus && KIU_STATE.probationStatus[student.id]) || student.status === 'Probation');
    const suspended = String(student.status || '').toLowerCase() === 'suspended';
    const holdLabels = [];
    if (balance > 0) holdLabels.push('Finance hold');
    if (probation) holdLabels.push('Probation');
    if (suspended) holdLabels.push('Suspended');
    const risk = suspended || balance > 0 || probation || gpa < 2.0;
    return {
        balance,
        probation,
        suspended,
        risk,
        holdLabels,
        holdLabel: holdLabels.length ? holdLabels.join(', ') : 'Clear',
        holdTone: suspended || balance > 0 ? 'danger' : probation ? 'warning' : 'success',
        gpaTone: gpa >= 3.5 ? 'success' : gpa >= 2.5 ? 'warning' : 'danger'
    };
}

function getStaffDirectoryNameCandidates(member) {
    return [
        member?.name,
        member?.nameEn,
        member?.email
    ].filter(Boolean);
}

function matchesStaffAssignment(value, member) {
    const target = normalizeDirectorySearchText(value);
    if (!target) return false;
    return getStaffDirectoryNameCandidates(member).some(candidate => normalizeDirectorySearchText(candidate) === target);
}

function clearStaffAssignmentsFromGroups(member, type, facultyCode = getCurrentFaculty()) {
    if (!member || !KIU_STATE?.availableGroups) return;
    const assignmentKey = type === 'professors' ? 'prof' : type === 'tas' ? 'ta' : '';
    if (!assignmentKey) return;
    const placeholder = type === 'professors' ? 'Assigned Professor' : 'Assigned Teaching Assistant';
    const normalizedFaculty = normalizeFacultyCode(facultyCode || member.facultyCode || member.faculty || getCurrentFaculty(), getCurrentFaculty());

    Object.keys(KIU_STATE.availableGroups).forEach(subjectId => {
        KIU_STATE.availableGroups[subjectId] = (KIU_STATE.availableGroups[subjectId] || []).map(group => {
            const groupFaculty = normalizeFacultyCode(group?.faculty || deriveFacultyFromSubjectId(subjectId) || normalizedFaculty, normalizedFaculty);
            if (groupFaculty !== normalizedFaculty) return group;
            if (!matchesStaffAssignment(group?.[assignmentKey], member)) return group;
            return {
                ...group,
                [assignmentKey]: placeholder
            };
        });
    });
}

function pruneStaffUserRecords(member, type, facultyCode) {
    if (!Array.isArray(KIU_STATE?.users) || !member) return;
    const role = type === 'professors'
        ? USER_ROLES.PROFESSOR
        : type === 'tas'
            ? USER_ROLES.TA
            : USER_ROLES.STUDENT_SERVICE;
    const normalizedFaculty = normalizeFacultyCode(facultyCode || member.facultyCode || member.faculty || getCurrentFaculty(), getCurrentFaculty());

    KIU_STATE.users = KIU_STATE.users.filter(user => {
        const sameRole = String(user?.role || '').trim().toLowerCase() === String(role || '').trim().toLowerCase();
        const sameFaculty = normalizeFacultyCode(user?.facultyCode || user?.faculty || normalizedFaculty, normalizedFaculty) === normalizedFaculty;
        const matchesIdentity = String(user?.id || '') === String(member.id || '')
            || getStaffDirectoryNameCandidates(member).some(candidate => normalizeDirectorySearchText(candidate) && (
                normalizeDirectorySearchText(user?.name) === normalizeDirectorySearchText(candidate)
                || normalizeDirectorySearchText(user?.nameEn) === normalizeDirectorySearchText(candidate)
                || normalizeDirectorySearchText(user?.email) === normalizeDirectorySearchText(candidate)
            ));
        return !(sameRole && sameFaculty && matchesIdentity);
    });
}

function resetRemovedStaffPreview(memberId) {
    const activeUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (!memberId || !activeUser || String(activeUser.id || '') !== String(memberId)) return;
    if (typeof setActiveSessionUserByRole === 'function') {
        setActiveSessionUserByRole(USER_ROLES.ADMIN);
        return;
    }
    if (Array.isArray(KIU_STATE?.users)) {
        const adminUser = KIU_STATE.users.find(user => user.role === USER_ROLES.ADMIN);
        if (adminUser && typeof setActiveSessionUser === 'function') {
            setActiveSessionUser(adminUser.id);
        }
    }
}

function buildStaffDirectoryRecords(fac, fp, hoursMap) {
    const normalizedFaculty = normalizeFacultyCode(fac, 'ECON');
    const profiles = [
        { key: 'professors', role: 'professor', label: 'Professor', icon: 'fa-chalkboard-teacher', list: fp.professors || [] },
        { key: 'tas', role: 'ta', label: 'Teaching Assistant', icon: 'fa-user-graduate', list: fp.tas || [] },
        {
            key: 'service',
            role: USER_ROLES.STUDENT_SERVICE,
            label: 'Student Service',
            icon: 'fa-headset',
            list: (KIU_STATE.users || []).filter(user =>
                user.role === USER_ROLES.STUDENT_SERVICE
                && !isStaffMemberDeleted(user, 'service', fac)
                && normalizeFacultyCode(user.facultyCode || user.faculty || fac, fac) === normalizedFaculty
            )
        }
    ];
    return profiles.flatMap(profile => (profile.list || [])
        .filter(member => profile.key === 'service' || !isStaffMemberDeleted(member, profile.key, fac))
        .map(member => {
            const displayName = normalizeDirectoryText(member.name || member.nameEn, 'Unknown staff');
            const displayNameEn = normalizeDirectoryText(member.nameEn || '', '');
            const displayTitle = normalizeDirectoryText(member.title || profile.label, profile.label);
            const scheduledHrs = Math.round((hoursMap[member.name] || hoursMap[member.nameEn] || 0) * 10) / 10;
            const maxHrs = Number(member.maxHours || 12);
            const loadRatio = maxHrs ? scheduledHrs / maxHrs : 0;
            const account = getDirectoryMicrosoftState(member);
            const status = normalizeDirectoryText(member.status || 'Active', 'Active');
            const assignedSubjects = (member.subjects || []).map(subjectId => {
                const sub = (KIU_STATE.curriculum || []).find(item => item.id === subjectId) || (fp.curriculum || []).find(item => item.id === subjectId);
                return normalizeDirectoryText(sub ? sub.name : subjectId, String(subjectId || ''));
            });
            const sessions = profile.key === 'service' ? [] : getProfSchedule(member.name || '');
            return {
                id: String(member.id || ''),
                type: profile.key,
                role: profile.role,
                roleLabel: profile.label,
                icon: profile.icon,
                member,
                displayName,
                displayNameEn,
                displayTitle,
                email: normalizeDirectoryText(member.email || 'No email', 'No email'),
                phone: normalizeDirectoryText(member.phone || 'No phone', 'No phone'),
                office: normalizeDirectoryText(member.office || 'No office', 'No office'),
                status,
                statusTone: getDirectoryStatusTone(status),
                joinYear: normalizeDirectoryText(member.joinYear || 'N/A', 'N/A'),
                scheduledHrs,
                maxHrs,
                loadRatio,
                loadPercent: Math.max(4, Math.min(100, Math.round(loadRatio * 100) || 0)),
                loadTone: loadRatio >= 0.9 ? 'danger' : loadRatio >= 0.7 ? 'warning' : scheduledHrs > 0 ? 'success' : 'muted',
                account,
                assignedSubjects,
                sessions
            };
        }));
}

function filterStaffDirectoryRecords(records) {
    const rawQuery = document.getElementById('staff-search')?.value || '';
    const query = normalizeDirectorySearchText(rawQuery);
    const roleFilter = document.getElementById('staff-role-filter')?.value || document.getElementById('staff-content')?.dataset.tab || 'all';
    const statusFilter = document.getElementById('staff-status-filter')?.value || 'all';
    const accountFilter = document.getElementById('staff-account-filter')?.value || 'all';
    const loadFilter = document.getElementById('staff-load-filter')?.value || 'all';
    return records.filter(record => {
        if (roleFilter !== 'all' && roleFilter !== record.type) return false;
        if (statusFilter !== 'all' && normalizeDirectorySearchText(record.status) !== statusFilter) return false;
        if (accountFilter === 'linked' && !record.account.linked) return false;
        if (accountFilter === 'review' && record.account.linked) return false;
        if (loadFilter === 'overloaded' && record.loadRatio < 0.9) return false;
        if (loadFilter === 'assigned' && record.scheduledHrs <= 0) return false;
        if (loadFilter === 'unassigned' && record.scheduledHrs > 0) return false;
        if (!query) return true;
        return [
            record.displayName,
            record.displayNameEn,
            record.email,
            record.phone,
            record.office,
            record.displayTitle,
            record.roleLabel,
            record.assignedSubjects.join(' '),
            record.sessions.map(session => `${session.courseId || ''} ${session.name || ''} ${session.day || ''}`).join(' ')
        ].some(value => normalizeDirectorySearchText(value).includes(query));
    });
}

function setStaffDirectoryFilter(id, value) {
    const control = document.getElementById(id);
    if (control) control.value = value;
    renderStaffPage();
}

function openStaffDirectoryDrawer(id, type, facCode) {
    window.__staffDirectorySelection = { id: String(id || ''), type: String(type || ''), facCode: facCode || getCurrentFaculty() };
    renderStaffPage();
}

function closeStaffDirectoryDrawer() {
    window.__staffDirectorySelection = null;
    renderStaffPage();
}

function exportStaffDirectoryCsv() {
    const records = window.__lastStaffDirectoryRecords || [];
    const headers = ['Staff ID', 'Name', 'English Name', 'Role', 'Title', 'Email', 'Phone', 'Office', 'Status', 'Microsoft Account', 'Subjects', 'Sessions', 'Weekly Load'];
    const rows = records.map(record => [
        record.id,
        record.displayName,
        record.displayNameEn,
        record.roleLabel,
        record.displayTitle,
        record.email,
        record.phone,
        record.office,
        record.status,
        record.account.linked ? 'Linked' : 'Needs review',
        record.assignedSubjects.join('; '),
        record.sessions.length,
        `${record.scheduledHrs}/${record.maxHrs}`
    ]);
    const escapeCell = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map(row => row.map(escapeCell).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kiu-staff-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function alertStaffMessageContact(name) {
    alert(`Messaging ${String(name || '').trim()}`);
}

function handleDirectoriesClick(event) {
    const trigger = event.target.closest('[data-directory-action]');
    if (!trigger) return;

    const action = trigger.getAttribute('data-directory-action') || '';
    if (!action) return;
    event.preventDefault();

    if (action === 'staff-tab') {
        staffTabSwitch(trigger.getAttribute('data-staff-tab') || 'professors');
        return;
    }
    if (action === 'staff-message') {
        alertStaffMessageContact(trigger.getAttribute('data-staff-name') || '');
        return;
    }
    if (action === 'staff-remove') {
        removeStaffMember(trigger.getAttribute('data-staff-id') || '', trigger.getAttribute('data-staff-type') || '');
        return;
    }
    if (action === 'staff-register') {
        if (typeof openProfRegistration === 'function') {
            openProfRegistration(trigger.getAttribute('data-staff-role') || 'professor');
        }
        return;
    }
    if (action === 'staff-drawer-open') {
        openStaffDirectoryDrawer(
            trigger.getAttribute('data-staff-id') || '',
            trigger.getAttribute('data-staff-type') || '',
            trigger.getAttribute('data-staff-fac') || getCurrentFaculty()
        );
        return;
    }
    if (action === 'staff-drawer-close') {
        closeStaffDirectoryDrawer();
        return;
    }
    if (action === 'staff-profile-open') {
        openProfilePage(
            trigger.getAttribute('data-profile-role') || '',
            trigger.getAttribute('data-profile-id') || '',
            trigger.getAttribute('data-profile-fac') || getCurrentFaculty()
        );
        return;
    }
    if (action === 'staff-export') {
        exportStaffDirectoryCsv();
        return;
    }
    if (action === 'staff-set-filter') {
        setStaffDirectoryFilter(
            trigger.getAttribute('data-filter-id') || '',
            trigger.getAttribute('data-filter-value') || ''
        );
    }
}

function handleDirectoriesInput(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.matches('[data-directory-input="staff-search"]')) {
        renderStaffPage();
    }
}

function handleDirectoriesChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.matches('[data-directory-change="staff-render"]')) {
        renderStaffPage();
        return;
    }
    if (target.matches('[data-directory-change="staff-tab"]')) {
        staffTabSwitch(target.value || 'all');
    }
}

if (!window.__directoriesDelegatesBound) {
    window.__directoriesDelegatesBound = true;
    document.addEventListener('click', handleDirectoriesClick);
    document.addEventListener('input', handleDirectoriesInput);
    document.addEventListener('change', handleDirectoriesChange);
}

function renderStaffPageLegacy() {
    const container = document.getElementById('staff-content');
    if (!container) return;

    // Ensure QA testing accounts are injected before rendering
    if (typeof ensureAdminTestingPersonas === 'function') {
        ensureAdminTestingPersonas(localStorage.getItem('currentFaculty') || 'ECON');
    }

    const fac = getCurrentFaculty();
    const fp = getFacultyProfile(fac);
    const tab = container.dataset.tab || 'professors';
    const profs = (fp.professors || []).filter(member => !isStaffMemberDeleted(member, 'professors', fac));
    const tas = (fp.tas || []).filter(member => !isStaffMemberDeleted(member, 'tas', fac));
    const serviceUsers = (KIU_STATE.users || []).filter(user =>
        user.role === USER_ROLES.STUDENT_SERVICE
        && !isStaffMemberDeleted(user, 'service', fac)
        && normalizeFacultyCode(user.facultyCode || user.faculty || fac, fac) === normalizeFacultyCode(fac, fac)
    );
    const totalStudents = getAllStudents(fac).length;

    const hoursMap = {};
    for (const cId in KIU_STATE.availableGroups) {
        KIU_STATE.availableGroups[cId].forEach(g => {
            if (g.faculty === fac || fac === 'all') {
                const dur = parseInt((g.duration || '110min').match(/\d+/)?.[0] || 110);
                [g.prof, g.ta].forEach(n => {
                    if (n && n !== 'TBD') hoursMap[n] = (hoursMap[n] || 0) + dur / 60;
                });
            }
        });
    }

    const rawStaffQuery = document.getElementById('staff-search')?.value || '';
    const staffQuery = normalizeDirectorySearchText(rawStaffQuery);
    const staffStatusFilter = document.getElementById('staff-status-filter')?.value || 'all';
    const staffLoadFilter = document.getElementById('staff-load-filter')?.value || 'all';
    let members = tab === 'professors' ? profs : tab === 'tas' ? tas : serviceUsers;
    if (staffQuery) {
        members = members.filter(member => [
            member?.name,
            member?.nameEn,
            member?.email,
            member?.title,
            member?.office,
            member?.phone
        ].some(value => normalizeDirectorySearchText(value).includes(staffQuery)));
    }
    if (staffStatusFilter !== 'all') {
        members = members.filter(member => normalizeDirectorySearchText(member.status || 'active') === staffStatusFilter);
    }
    if (staffLoadFilter !== 'all') {
        members = members.filter(member => {
            const scheduledHrs = Math.round((hoursMap[member.name] || hoursMap[member.nameEn] || 0) * 10) / 10;
            const maxHrs = member.maxHours || 12;
            const ratio = maxHrs ? scheduledHrs / maxHrs : 0;
            if (staffLoadFilter === 'overloaded') return ratio >= 0.9;
            if (staffLoadFilter === 'healthy') return ratio > 0 && ratio < 0.9;
            return ratio === 0;
        });
    }
    const pendingInviteCount = [profs, tas, serviceUsers].flat().filter(member => !getDirectoryMicrosoftState(member).linked).length;
    const overloadedCount = [profs, tas, serviceUsers].flat().filter(member => {
        const scheduledHrs = Math.round((hoursMap[member.name] || hoursMap[member.nameEn] || 0) * 10) / 10;
        const maxHrs = member.maxHours || 12;
        return maxHrs && scheduledHrs / maxHrs >= 0.9;
    }).length;
    const headingTitle = tab === 'professors'
        ? 'Professors'
        : tab === 'tas'
            ? 'Teaching Assistants'
            : 'Student Service';
    const headingCopy = tab === 'service'
        ? 'Manage student service staff and support assignments.'
        : 'Browse faculty members, teaching loads, and assigned subjects.';
    const tabButtons = `
        <button class="lux-picker-btn ${tab === 'professors' ? 'is-active' : ''}" data-directory-action="staff-tab" data-staff-tab="professors">
            <span>
                <span class="lux-picker-caption">Directory</span>
                <strong>Professors (${profs.length})</strong>
            </span>
            <i class="fas fa-chalkboard-teacher"></i>
        </button>
        <button class="lux-picker-btn ${tab === 'tas' ? 'is-active' : ''}" data-directory-action="staff-tab" data-staff-tab="tas">
            <span>
                <span class="lux-picker-caption">Directory</span>
                <strong>Teaching Assistants (${tas.length})</strong>
            </span>
            <i class="fas fa-user-graduate"></i>
        </button>
        <button class="lux-picker-btn ${tab === 'service' ? 'is-active' : ''}" data-directory-action="staff-tab" data-staff-tab="service">
            <span>
                <span class="lux-picker-caption">Directory</span>
                <strong>Student Service (${serviceUsers.length})</strong>
            </span>
            <i class="fas fa-headset"></i>
        </button>
    `;
    const cardsMarkup = members.length ? members.map(member => {
        const displayName = normalizeDirectoryText(member.name || member.nameEn, 'Unknown');
        const displayNameEn = normalizeDirectoryText(member.nameEn || '', '');
        const displayTitle = normalizeDirectoryText(
            member.title || (tab === 'tas' ? 'Teaching Assistant' : tab === 'service' ? 'Student Service Staff' : 'Professor'),
            tab === 'service' ? 'Student Service Staff' : 'Professor'
        );
        const displayEmail = normalizeDirectoryText(member.email || 'No email', 'No email');
        const displayPhone = normalizeDirectoryText(member.phone || 'No phone', 'No phone');
        const displayOffice = normalizeDirectoryText(member.office || 'No office', 'No office');
        const displayStatus = normalizeDirectoryText(member.status || 'Active', 'Active');
        const displayJoinYear = normalizeDirectoryText(member.joinYear || 'N/A', 'N/A');
        const scheduledHrs = Math.round((hoursMap[member.name] || hoursMap[member.nameEn] || 0) * 10) / 10;
        const maxHrs = member.maxHours || 12;
        const hrsPercent = Math.max(6, Math.min(100, Math.round((scheduledHrs / maxHrs) * 100) || 0));
        const hrsColor = hrsPercent > 90 ? '#f87171' : hrsPercent > 70 ? '#f4a261' : '#20c57c';
        const assignedSubjects = (member.subjects || []).map(subjectId => {
            const sub = (KIU_STATE.curriculum || []).find(item => item.id === subjectId) || (fp.curriculum || []).find(item => item.id === subjectId);
            return normalizeDirectoryText(sub ? sub.name : subjectId, String(subjectId || ''));
        });
        const sessions = getProfSchedule(member.name || '');
        const avatarMarkup = scrubFakeMedia(member.photo || member.image)
            ? `<img src="${scrubFakeMedia(member.photo || member.image)}" alt="${escapeDirectoryHtml(displayName)}">`
            : escapeDirectoryHtml(getInitialsAvatar(member.nameEn || member.name));
        return `
            <div class="lux-person-card admin-directory-card admin-staff-card">
                <div class="lux-person-head">
                    <div class="lux-avatar">${avatarMarkup}</div>
                    <div style="flex:1; min-width:0;">
                        <div class="lux-person-name">${escapeDirectoryHtml(displayName)}</div>
                        ${displayNameEn && displayNameEn !== displayName ? `<div class="lux-meta" style="margin-top:2px; color:var(--lux-accent);">${escapeDirectoryHtml(displayNameEn)}</div>` : ''}
                        <div class="lux-meta">${escapeDirectoryHtml(displayTitle)}</div>
                    </div>
                    <span class="lux-status-pill is-${getDirectoryStatusTone(displayStatus)}">${escapeDirectoryHtml(displayStatus)}</span>
                </div>
                <div class="admin-record-strip">
                    <span class="lux-status-pill is-${getDirectoryMicrosoftState(member).tone}"><i class="fab fa-microsoft"></i> ${getDirectoryMicrosoftState(member).label}</span>
                    <span class="lux-status-pill is-info"><i class="fas fa-shield-alt"></i> ${tab === 'service' ? 'Service scope' : 'Teaching scope'}</span>
                    <span class="lux-status-pill is-muted"><i class="fas fa-history"></i> Audit ready</span>
                </div>
                <div class="lux-inline-meta">
                    <span><i class="fas fa-envelope"></i> ${escapeDirectoryHtml(displayEmail)}</span>
                    <span><i class="fas fa-phone"></i> ${escapeDirectoryHtml(displayPhone)}</span>
                    <span><i class="fas fa-door-open"></i> ${escapeDirectoryHtml(displayOffice)}</span>
                    <span><i class="fas fa-calendar-alt"></i> Since ${escapeDirectoryHtml(displayJoinYear)}</span>
                </div>
                <div class="admin-mini-grid">
                    <div><strong>${assignedSubjects.length}</strong><span>subjects</span></div>
                    <div><strong>${sessions.length}</strong><span>sessions</span></div>
                    <div><strong>${scheduledHrs}h</strong><span>weekly load</span></div>
                </div>
                <div class="lux-subcard">
                    <div class="lux-actions-between">
                        <div class="lux-overline">Teaching Load</div>
                        <div class="lux-meta" style="margin-top:0; color:${hrsColor};">${scheduledHrs}h / ${maxHrs}h max</div>
                    </div>
                    <div class="staff-load-track">
                        <div class="staff-load-fill" style="width:${hrsPercent}%; background:${hrsColor}; box-shadow:0 0 16px ${hrsColor}55;"></div>
                    </div>
                </div>
                ${assignedSubjects.length ? `
                    <div>
                        <div class="lux-overline" style="margin-bottom:8px;">Assigned Subjects</div>
                        <div class="lux-card-actions">
                            ${assignedSubjects.map(subject => `<span class="lux-status-pill is-muted">${escapeDirectoryHtml(subject)}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
                <div>
                    <div class="lux-actions-between" style="margin-bottom:10px;">
                        <div class="lux-overline">Schedule</div>
                        <div class="lux-meta" style="margin-top:0;">${sessions.length} session${sessions.length === 1 ? '' : 's'}</div>
                    </div>
                    ${sessions.length ? `
                        <div class="lux-stack" style="gap:8px;">
                            ${sessions.slice(0, 3).map(session => `
                                <div class="lux-subcard">
                                    <div class="lux-actions-between">
                                        <div style="font-weight:700; color:var(--lux-text);">${escapeDirectoryHtml(session.courseId)} Â· ${escapeDirectoryHtml(session.name || session.id || '')}</div>
                                        <div class="lux-meta" style="margin-top:0;">${escapeDirectoryHtml(session.day || '')} ${escapeDirectoryHtml(session.time || '')}</div>
                                    </div>
                                </div>
                            `).join('')}
                            ${sessions.length > 3 ? `<div class="lux-meta">+${sessions.length - 3} more</div>` : ''}
                        </div>
                    ` : `<div class="lux-subcard"><div class="lux-meta">No sessions yet</div></div>`}
                </div>
                <div class="lux-card-actions">
                    <button class="lux-primary-btn" data-directory-action="${tab === 'service' ? 'staff-message' : 'staff-profile-open'}" ${tab === 'service' ? `data-staff-name="${escapeDirectoryHtml(`Student Service Staff\n\n${displayName || ''}\n${displayEmail || ''}`)}"` : `data-profile-role="${escapeDirectoryHtml(tab === 'professors' ? 'professor' : 'ta')}" data-profile-id="${escapeDirectoryHtml(member.id)}" data-profile-fac="${escapeDirectoryHtml(fac)}"`}><i class="fas fa-id-card"></i> ${tab === 'service' ? 'Details' : 'Profile'}</button>
                    <button class="lux-secondary-btn" data-directory-action="staff-message" data-staff-name="${escapeDirectoryHtml(displayName)}"><i class="fas fa-envelope"></i> Message</button>
                    <button class="lux-secondary-btn lux-danger-btn" data-directory-action="staff-remove" data-staff-id="${escapeDirectoryHtml(member.id)}" data-staff-type="${escapeDirectoryHtml(tab)}"><i class="fas fa-trash"></i> Remove</button>
                </div>
            </div>
        `;
    }).join('') : `
        <div class="lux-card">
            <div class="lux-card-body">
                <div class="lux-empty-state">No ${tab === 'professors' ? 'professors' : tab === 'tas' ? 'teaching assistants' : 'student service staff'} are registered for this faculty yet.</div>
            </div>
        </div>
    `;

    const staffUser = getCurrentUser();
    const staffRole = staffUser?.role || 'student';
    let ctaMarkup = '';
    if (staffRole === 'admin') {
        const ctaKind = tab === 'professors' ? 'Professor' : tab === 'tas' ? 'Teaching Assistant' : 'Student Service Staff';
        const ctaRole = tab === 'professors' ? 'professor' : tab === 'tas' ? 'ta' : USER_ROLES.STUDENT_SERVICE;
        const ctaIcon = tab === 'professors' ? 'fa-chalkboard-teacher' : tab === 'tas' ? 'fa-user-tie' : 'fa-headset';
        ctaMarkup = `
            <div class="lux-card">
                <div class="lux-card-body">
                    <div class="lux-actions-between">
                        <div>
                            <div class="lux-card-title">Register New ${ctaKind.toLowerCase()}</div>
                            <div class="lux-card-copy">Add a new staff member to this faculty.</div>
                        </div>
                        <button class="lux-primary-btn" data-directory-action="staff-register" data-staff-role="${escapeDirectoryHtml(ctaRole)}"><i class="fas ${ctaIcon}"></i> Register ${ctaKind}</button>
                    </div>
                </div>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="lux-page-shell">
            <div class="page-hero admin-directory-hero">
                <div>
                    <div class="lux-page-kicker"><i class="fas fa-users-cog"></i> Staff Administration</div>
                    <div class="page-hero-title">${escapeDirectoryHtml(headingTitle)}</div>
                    <div class="page-hero-copy">${escapeDirectoryHtml(headingCopy)} Manage account readiness, teaching load, assignments, and staff lifecycle from one workspace.</div>
                    <div class="page-hero-meta">
                        <span class="page-hero-badge"><i class="fas fa-building"></i> ${escapeDirectoryHtml(normalizeDirectoryText(fp.fullName || fp.name || 'Faculty', 'Faculty'))}</span>
                        <span class="page-hero-badge"><i class="fas fa-users"></i> ${totalStudents} students</span>
                    </div>
                </div>
                <div class="admin-hero-metrics">
                    <article><span>Professors</span><strong>${profs.length}</strong></article>
                    <article><span>TAs</span><strong>${tas.length}</strong></article>
                    <article><span>Service</span><strong>${serviceUsers.length}</strong></article>
                    <article><span>Needs account check</span><strong>${pendingInviteCount}</strong></article>
                    <article><span>Overloaded</span><strong>${overloadedCount}</strong></article>
                </div>
            </div>
            <div class="lux-card admin-directory-controls">
                <div class="lux-card-body">
                    <div class="lux-card-head">
                        <div>
                            <div class="lux-overline">Directory controls</div>
                            <div class="lux-card-title">Find staff and manage workload</div>
                            <div class="lux-card-copy">Search by identity, filter by account/status, and review assignment pressure.</div>
                        </div>
                        ${staffRole === 'admin' ? `<button class="lux-primary-btn" data-directory-action="staff-register" data-staff-role="${escapeDirectoryHtml(tab === 'professors' ? 'professor' : tab === 'tas' ? 'ta' : USER_ROLES.STUDENT_SERVICE)}"><i class="fas fa-user-plus"></i> Register</button>` : ''}
                    </div>
                    <div class="lux-card-actions staff-tabs">${tabButtons}</div>
                    <div class="lux-field-grid admin-directory-filter-grid">
                        <div class="lux-field">
                            <label for="staff-search">Search staff</label>
                            <input type="text" id="staff-search" class="lux-control" value="${escapeDirectoryHtml(rawStaffQuery)}" data-directory-input="staff-search" placeholder="Name, email, office, role...">
                        </div>
                        <div class="lux-field">
                            <label for="staff-status-filter">Status</label>
                            <select id="staff-status-filter" class="lux-control" data-directory-change="staff-render">
                                <option value="all">All statuses</option>
                                <option value="active" ${staffStatusFilter === 'active' ? 'selected' : ''}>Active</option>
                                <option value="pending" ${staffStatusFilter === 'pending' ? 'selected' : ''}>Pending</option>
                                <option value="suspended" ${staffStatusFilter === 'suspended' ? 'selected' : ''}>Suspended</option>
                            </select>
                        </div>
                        <div class="lux-field">
                            <label for="staff-load-filter">Workload</label>
                            <select id="staff-load-filter" class="lux-control" data-directory-change="staff-render">
                                <option value="all">All loads</option>
                                <option value="healthy" ${staffLoadFilter === 'healthy' ? 'selected' : ''}>Assigned</option>
                                <option value="overloaded" ${staffLoadFilter === 'overloaded' ? 'selected' : ''}>Overloaded</option>
                                <option value="unassigned" ${staffLoadFilter === 'unassigned' ? 'selected' : ''}>Unassigned</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            <div class="lux-person-grid">${cardsMarkup}</div>
            ${ctaMarkup}
        </div>
    `;
    if (typeof queueEnglishLocalization === 'function') {
        queueEnglishLocalization(container);
    }
    if (typeof queueLuxuryTransparencyRefresh === 'function') {
        queueLuxuryTransparencyRefresh();
    }
    consumePendingAdminAccountFlow();
}

function renderStaffPage() {
    const container = document.getElementById('staff-content');
    if (!container) return;
    if (typeof ensureAdminTestingPersonas === 'function') {
        ensureAdminTestingPersonas(localStorage.getItem('currentFaculty') || 'ECON');
    }

    const fac = getCurrentFaculty();
    const fp = getFacultyProfile(fac);
    const totalStudents = getAllStudents(fac).length;
    const hoursMap = {};
    let unassignedSections = 0;
    Object.keys(KIU_STATE.availableGroups || {}).forEach(courseId => {
        (KIU_STATE.availableGroups[courseId] || []).forEach(group => {
            if (group.faculty !== fac && fac !== 'all') return;
            const duration = parseInt((group.duration || '110min').match(/\d+/)?.[0] || 110);
            [group.prof, group.ta].forEach(name => {
                if (name && name !== 'TBD') hoursMap[name] = (hoursMap[name] || 0) + duration / 60;
            });
            if (!group.prof || group.prof === 'TBD' || !group.ta || group.ta === 'TBD') unassignedSections += 1;
        });
    });

    const allRecords = buildStaffDirectoryRecords(fac, fp, hoursMap);
    const visibleRecords = filterStaffDirectoryRecords(allRecords);
    window.__lastStaffDirectoryRecords = visibleRecords;

    const rawStaffQuery = document.getElementById('staff-search')?.value || '';
    const roleFilter = document.getElementById('staff-role-filter')?.value || document.getElementById('staff-content')?.dataset.tab || 'all';
    const statusFilter = document.getElementById('staff-status-filter')?.value || 'all';
    const accountFilter = document.getElementById('staff-account-filter')?.value || 'all';
    const loadFilter = document.getElementById('staff-load-filter')?.value || 'all';
    const staffUser = getCurrentUser();
    const staffRole = staffUser?.role || 'student';
    const profCount = allRecords.filter(record => record.type === 'professors').length;
    const taCount = allRecords.filter(record => record.type === 'tas').length;
    const serviceCount = allRecords.filter(record => record.type === 'service').length;
    const pendingAccountCount = allRecords.filter(record => !record.account.linked).length;
    const overloadedCount = allRecords.filter(record => record.loadRatio >= 0.9).length;

    const selected = window.__staffDirectorySelection
        ? allRecords.find(record => record.id === String(window.__staffDirectorySelection.id) && record.type === String(window.__staffDirectorySelection.type))
        : null;
    const activeSelection = selected || visibleRecords[0] || null;
    const renderStaffAvatar = (record) => {
        const photo = scrubFakeMedia(record.member.photo || record.member.image);
        if (photo) return `<img src="${photo}" alt="${escapeDirectoryHtml(record.displayName)}">`;
        return escapeDirectoryHtml(getInitialsAvatar(record.displayNameEn || record.displayName));
    };
    const rowMarkup = visibleRecords.length ? visibleRecords.map(record => {
        const loadText = record.scheduledHrs > 0 ? `${record.scheduledHrs}h / ${record.maxHrs}h` : 'No sessions';
        return `
            <button type="button" class="staff-admin-row ${activeSelection && activeSelection.id === record.id && activeSelection.type === record.type ? 'is-selected' : ''}" data-directory-action="staff-drawer-open" data-staff-id="${escapeDirectoryHtml(record.id)}" data-staff-type="${escapeDirectoryHtml(record.type)}" data-staff-fac="${escapeDirectoryHtml(fac)}">
                <span class="staff-admin-person">
                    <span class="lux-avatar">${renderStaffAvatar(record)}</span>
                    <span>
                        <strong>${escapeDirectoryHtml(record.displayName)}</strong>
                        <small>${escapeDirectoryHtml(record.email)}</small>
                    </span>
                </span>
                <span><span class="lux-status-pill is-info"><i class="fas ${record.icon}"></i> ${escapeDirectoryHtml(record.roleLabel)}</span></span>
                <span>${escapeDirectoryHtml(record.office)}</span>
                <span><span class="lux-status-pill is-${record.account.tone}"><i class="fab fa-microsoft"></i> ${escapeDirectoryHtml(record.account.linked ? 'Linked' : 'Review')}</span></span>
                <span>
                    <strong>${escapeDirectoryHtml(loadText)}</strong>
                    <span class="staff-admin-load"><i style="width:${record.loadPercent}%;"></i></span>
                </span>
                <span>${record.assignedSubjects.length ? escapeDirectoryHtml(record.assignedSubjects.slice(0, 2).join(', ')) : '<em>Unassigned</em>'}</span>
                <span><span class="lux-status-pill is-${record.statusTone}">${escapeDirectoryHtml(record.status)}</span></span>
            </button>
        `;
    }).join('') : `
        <div class="staff-admin-empty">
            <i class="fas fa-filter-circle-xmark"></i>
            <strong>No staff match these filters.</strong>
            <span>Adjust search, role, account, or workload filters.</span>
        </div>
    `;
    const drawerMarkup = activeSelection ? `
        <aside class="staff-admin-drawer" aria-label="Staff profile detail">
            <div class="staff-admin-drawer-head">
                <div class="lux-avatar">${renderStaffAvatar(activeSelection)}</div>
                <div>
                    <div class="lux-overline">${escapeDirectoryHtml(activeSelection.roleLabel)}</div>
                    <h3>${escapeDirectoryHtml(activeSelection.displayName)}</h3>
                    <p>${escapeDirectoryHtml(activeSelection.email)}</p>
                </div>
                <button type="button" class="lux-secondary-btn" data-directory-action="staff-drawer-close"><i class="fas fa-times"></i></button>
            </div>
            <div class="staff-admin-drawer-tabs">
                <span class="is-active">Profile</span><span>Teaching</span><span>Permissions</span><span>Activity</span>
            </div>
            <div class="staff-admin-drawer-grid">
                <article>
                    <span>Microsoft account</span>
                    <strong class="is-${activeSelection.account.tone}">${escapeDirectoryHtml(activeSelection.account.label)}</strong>
                    <small>${escapeDirectoryHtml(activeSelection.email)}</small>
                </article>
                <article>
                    <span>Weekly load</span>
                    <strong>${activeSelection.scheduledHrs}h / ${activeSelection.maxHrs}h</strong>
                    <small>${activeSelection.loadRatio >= 0.9 ? 'Needs workload review' : 'Within configured limit'}</small>
                </article>
                <article>
                    <span>Assigned subjects</span>
                    <strong>${activeSelection.assignedSubjects.length}</strong>
                    <small>${activeSelection.assignedSubjects.length ? escapeDirectoryHtml(activeSelection.assignedSubjects.slice(0, 2).join(', ')) : 'No subject assignment'}</small>
                </article>
                <article>
                    <span>Office</span>
                    <strong>${escapeDirectoryHtml(activeSelection.office)}</strong>
                    <small>${escapeDirectoryHtml(activeSelection.phone)}</small>
                </article>
            </div>
            <div class="staff-admin-drawer-section">
                <div class="lux-actions-between">
                    <div>
                        <div class="lux-overline">Schedule preview</div>
                        <strong>${activeSelection.sessions.length} active session${activeSelection.sessions.length === 1 ? '' : 's'}</strong>
                    </div>
                    <span class="lux-status-pill is-${activeSelection.loadTone}">${activeSelection.loadRatio >= 0.9 ? 'Overload risk' : activeSelection.scheduledHrs > 0 ? 'Scheduled' : 'Unassigned'}</span>
                </div>
                <div class="staff-admin-timeline">
                    ${(activeSelection.sessions || []).slice(0, 5).map(session => `
                        <div>
                            <i class="fas fa-calendar-day"></i>
                            <span><strong>${escapeDirectoryHtml(session.courseId || session.id || 'Session')}</strong>${escapeDirectoryHtml(`${session.day || ''} ${session.time || ''}`.trim() || 'Time not set')}</span>
                        </div>
                    `).join('') || '<div><i class="fas fa-circle-info"></i><span><strong>No schedule yet</strong>Assign this staff member to a group or subject.</span></div>'}
                </div>
            </div>
            <div class="staff-admin-drawer-section">
                <div class="lux-overline">Audit timeline</div>
                <div class="staff-admin-timeline">
                    <div><i class="fas fa-user-shield"></i><span><strong>Scoped to ${escapeDirectoryHtml(normalizeDirectoryText(fp.name || fac, fac))}</strong>Permission review ready</span></div>
                    <div><i class="fas fa-clock"></i><span><strong>Last profile review</strong>${escapeDirectoryHtml(activeSelection.joinYear)} record baseline</span></div>
                    <div><i class="fas fa-book"></i><span><strong>Assignments</strong>${activeSelection.assignedSubjects.length || 0} subject links</span></div>
                </div>
            </div>
            <div class="lux-card-actions">
                <button class="lux-primary-btn" data-directory-action="staff-profile-open" data-profile-role="${escapeDirectoryHtml(activeSelection.role === USER_ROLES.STUDENT_SERVICE ? 'student_service' : activeSelection.role)}" data-profile-id="${escapeDirectoryHtml(activeSelection.id)}" data-profile-fac="${escapeDirectoryHtml(fac)}"><i class="fas fa-id-card"></i> Full profile</button>
                <button class="lux-secondary-btn" data-directory-action="staff-register" data-staff-role="${escapeDirectoryHtml(activeSelection.role === 'ta' ? 'ta' : activeSelection.role === USER_ROLES.STUDENT_SERVICE ? USER_ROLES.STUDENT_SERVICE : 'professor')}"><i class="fas fa-pen"></i> Edit flow</button>
                <button class="lux-secondary-btn lux-danger-btn" data-directory-action="staff-remove" data-staff-id="${escapeDirectoryHtml(activeSelection.id)}" data-staff-type="${escapeDirectoryHtml(activeSelection.type)}"><i class="fas fa-user-slash"></i> Remove</button>
            </div>
        </aside>
    ` : `
        <aside class="staff-admin-drawer is-empty">
            <i class="fas fa-user-lock"></i>
            <strong>Select a staff record</strong>
            <span>The profile drawer will show account, workload, permissions, and audit context.</span>
        </aside>
    `;

    container.innerHTML = `
        <div class="lux-page-shell staff-admin-shell">
            <section class="page-hero staff-admin-hero admin-directory-hero">
                <div>
                    <div class="lux-page-kicker"><i class="fas fa-users-cog"></i> Staff Administration</div>
                    <div class="page-hero-title">Staff Command Center</div>
                    <div class="page-hero-copy">Manage university staff records, Microsoft account readiness, teaching load, assignments, service coverage, and lifecycle actions without leaving the directory.</div>
                    <div class="page-hero-meta">
                        <span class="page-hero-badge"><i class="fas fa-building"></i> ${escapeDirectoryHtml(normalizeDirectoryText(fp.fullName || fp.name || 'Faculty', 'Faculty'))}</span>
                        <span class="page-hero-badge"><i class="fas fa-users"></i> ${totalStudents} students</span>
                        <span class="page-hero-badge"><i class="fas fa-shield-alt"></i> Audit sensitive</span>
                        <span class="page-hero-badge"><i class="fab fa-microsoft"></i> Microsoft scoped</span>
                    </div>
                </div>
                <div class="admin-hero-metrics">
                    <article><span>Professors</span><strong>${profCount}</strong></article>
                    <article><span>TAs</span><strong>${taCount}</strong></article>
                    <article><span>Service staff</span><strong>${serviceCount}</strong></article>
                    <article><span>Account review</span><strong>${pendingAccountCount}</strong></article>
                    <article><span>Overloaded</span><strong>${overloadedCount}</strong></article>
                    <article><span>Unassigned sections</span><strong>${unassignedSections}</strong></article>
                </div>
            </section>
            <section class="lux-card admin-directory-controls staff-admin-controls">
                <div class="lux-card-body">
                    <div class="lux-card-head">
                        <div>
                            <div class="lux-overline">Directory controls</div>
                            <div class="lux-card-title">Operational staff directory</div>
                            <div class="lux-card-copy">Search staff, isolate account issues, review workload pressure, and open the profile drawer for action.</div>
                        </div>
                        ${staffRole === 'admin' ? `
                            <div class="lux-card-actions">
                                <button class="lux-secondary-btn" data-directory-action="staff-export"><i class="fas fa-file-export"></i> Export</button>
                                <button class="lux-primary-btn" data-directory-action="staff-register" data-staff-role="professor"><i class="fas fa-user-plus"></i> Register Staff</button>
                            </div>
                        ` : ''}
                    </div>
                    <div class="admin-saved-views">
                        <button type="button" data-directory-action="staff-set-filter" data-filter-id="staff-role-filter" data-filter-value="all"><i class="fas fa-layer-group"></i> All staff</button>
                        <button type="button" data-directory-action="staff-set-filter" data-filter-id="staff-account-filter" data-filter-value="review"><i class="fab fa-microsoft"></i> Needs account</button>
                        <button type="button" data-directory-action="staff-set-filter" data-filter-id="staff-load-filter" data-filter-value="overloaded"><i class="fas fa-triangle-exclamation"></i> Overloaded</button>
                        <button type="button" data-directory-action="staff-set-filter" data-filter-id="staff-load-filter" data-filter-value="unassigned"><i class="fas fa-link-slash"></i> Unassigned</button>
                    </div>
                    <div class="lux-field-grid admin-directory-filter-grid staff-admin-filter-grid">
                        <div class="lux-field">
                            <label for="staff-search">Search staff</label>
                            <input type="text" id="staff-search" class="lux-control" value="${escapeDirectoryHtml(rawStaffQuery)}" data-directory-input="staff-search" placeholder="Name, email, office, subject, group...">
                        </div>
                        <div class="lux-field">
                            <label for="staff-role-filter">Role</label>
                            <select id="staff-role-filter" class="lux-control" data-directory-change="staff-tab">
                                <option value="all" ${roleFilter === 'all' ? 'selected' : ''}>All roles</option>
                                <option value="professors" ${roleFilter === 'professors' ? 'selected' : ''}>Professors</option>
                                <option value="tas" ${roleFilter === 'tas' ? 'selected' : ''}>Teaching Assistants</option>
                                <option value="service" ${roleFilter === 'service' ? 'selected' : ''}>Student Service</option>
                            </select>
                        </div>
                        <div class="lux-field">
                            <label for="staff-status-filter">Status</label>
                            <select id="staff-status-filter" class="lux-control" data-directory-change="staff-render">
                                <option value="all" ${statusFilter === 'all' ? 'selected' : ''}>All statuses</option>
                                <option value="active" ${statusFilter === 'active' ? 'selected' : ''}>Active</option>
                                <option value="pending" ${statusFilter === 'pending' ? 'selected' : ''}>Pending</option>
                                <option value="suspended" ${statusFilter === 'suspended' ? 'selected' : ''}>Suspended</option>
                            </select>
                        </div>
                        <div class="lux-field">
                            <label for="staff-account-filter">Account</label>
                            <select id="staff-account-filter" class="lux-control" data-directory-change="staff-render">
                                <option value="all" ${accountFilter === 'all' ? 'selected' : ''}>All accounts</option>
                                <option value="linked" ${accountFilter === 'linked' ? 'selected' : ''}>Microsoft linked</option>
                                <option value="review" ${accountFilter === 'review' ? 'selected' : ''}>Needs review</option>
                            </select>
                        </div>
                        <div class="lux-field">
                            <label for="staff-load-filter">Workload</label>
                            <select id="staff-load-filter" class="lux-control" data-directory-change="staff-render">
                                <option value="all" ${loadFilter === 'all' ? 'selected' : ''}>All loads</option>
                                <option value="assigned" ${loadFilter === 'assigned' ? 'selected' : ''}>Assigned</option>
                                <option value="overloaded" ${loadFilter === 'overloaded' ? 'selected' : ''}>Overloaded</option>
                                <option value="unassigned" ${loadFilter === 'unassigned' ? 'selected' : ''}>Unassigned</option>
                            </select>
                        </div>
                    </div>
                </div>
            </section>
            <section class="staff-admin-workspace">
                <div class="staff-admin-directory-panel">
                    <div class="staff-admin-table-head">
                        <span>Staff member</span><span>Role</span><span>Office</span><span>Account</span><span>Load</span><span>Assignments</span><span>Status</span>
                    </div>
                    <div class="staff-admin-row-list">${rowMarkup}</div>
                </div>
                ${drawerMarkup}
            </section>
        </div>
    `;
    if (typeof queueEnglishLocalization === 'function') {
        queueEnglishLocalization(container);
    }
    if (typeof queueLuxuryTransparencyRefresh === 'function') {
        queueLuxuryTransparencyRefresh();
    }
    consumePendingAdminAccountFlow();
}

function staffTabSwitch(tab) {
    const container = document.getElementById('staff-content');
    if (!container) return;
    container.dataset.tab = tab;
    renderStaffPage();
}

function addStaffMember(type) {
    const fac = getCurrentFaculty();
    const name = document.getElementById('staff-name-geo')?.value?.trim();
    const nameEn = document.getElementById('staff-name-en')?.value?.trim();
    const email = document.getElementById('staff-email')?.value?.trim();
    const title = document.getElementById('staff-title')?.value;
    const office = document.getElementById('staff-office')?.value?.trim();
    const maxHours = parseInt(document.getElementById('staff-maxhours')?.value) || 12;

    if (!name) { alert('Please enter the staff member name.'); return; }

    if (!KIU_STATE.facultyProfiles) KIU_STATE.facultyProfiles = JSON.parse(JSON.stringify(KIU_EMPTY_STATE.facultyProfiles));
    if (!KIU_STATE.facultyProfiles[fac]) KIU_STATE.facultyProfiles[fac] = { professors: [], tas: [], curriculum: [], students: [] };

    const prefix = type === 'professors' ? 'P' : 'TA';
    const newMember = {
        id: `${prefix}-${fac}-${Date.now()}`,
        name, nameEn: nameEn || name,
        email: email || `${name.replace(/\s/g,'').toLowerCase()}@kiu.edu.ge`,
        title: title || (type === 'tas' ? 'Teaching Assistant' : 'Lecturer'),
        office: office || '',
        phone: '',
        joinYear: new Date().getFullYear(),
        maxHours,
        subjects: [],
        avatar: name.substring(0, 3).split(' ').map(p => p[0]).join('').toUpperCase(),
        status: 'Active'
    };

    if (type === 'professors') {
        KIU_STATE.facultyProfiles[fac].professors.push(newMember);
    } else {
        if (type === 'tas' && !newMember.assignedProf) newMember.assignedProf = '';
        KIU_STATE.facultyProfiles[fac].tas.push(newMember);
    }

    saveState();
    renderStaffPage();
    alert(`Staff member ${newMember.name} added to ${getFacultyProfile(fac).name}.`);
}

function removeStaffMember(id, type) {
    if (!confirm('Remove this staff member from the faculty?')) return;
    const fac = getCurrentFaculty();
    const normalizedFaculty = normalizeFacultyCode(fac, 'ECON');
    let removedMember = null;

    if (type === 'service') {
        const serviceUsers = Array.isArray(KIU_STATE?.users) ? KIU_STATE.users : [];
        removedMember = serviceUsers.find(user =>
            String(user?.id || '') === String(id)
            && String(user?.role || '').trim().toLowerCase() === String(USER_ROLES.STUDENT_SERVICE).toLowerCase()
            && normalizeFacultyCode(user?.facultyCode || user?.faculty || normalizedFaculty, normalizedFaculty) === normalizedFaculty
        ) || null;
        if (!removedMember) return;
        KIU_STATE.users = serviceUsers.filter(user => String(user?.id || '') !== String(id));
    } else {
        if (!KIU_STATE.facultyProfiles?.[normalizedFaculty]?.[type]) return;
        removedMember = KIU_STATE.facultyProfiles[normalizedFaculty][type].find(member => String(member?.id || '') === String(id)) || null;
        if (!removedMember) return;
        KIU_STATE.facultyProfiles[normalizedFaculty][type] = KIU_STATE.facultyProfiles[normalizedFaculty][type]
            .filter(member => String(member?.id || '') !== String(id));
        clearStaffAssignmentsFromGroups(removedMember, type, normalizedFaculty);
        pruneStaffUserRecords(removedMember, type, normalizedFaculty);
    }

    if (typeof markStaffMemberDeleted === 'function' && removedMember) {
        markStaffMemberDeleted(removedMember, type, normalizedFaculty);
    }
    resetRemovedStaffPreview(id);
    saveState();
    if (typeof persistPortalStateToBackend === 'function') {
        persistPortalStateToBackend('remove-staff-member').catch(() => null);
    }
    renderStaffPage();
}


// Student administration is owned by assets/js/pages/students-admin-lms.js.
// This directory module intentionally keeps staff/profile navigation helpers only.

function openProfilePage(type, id, facCode) {
    sessionStorage.setItem('pv_type', type);
    sessionStorage.setItem('pv_id', id);
    sessionStorage.setItem('pv_fac', facCode || getCurrentFaculty());

    window.location.assign(`profile-view.html?type=${type}&id=${encodeURIComponent(id)}&fac=${facCode || getCurrentFaculty()}`);



}

// --- ADMIN PROFILE ACTIONS (Context-aware variants) ---
function toggleProbationForUser(userId) {
    if (getCurrentUser()?.role !== USER_ROLES.ADMIN) return;
    if (!KIU_STATE.probationStatus) KIU_STATE.probationStatus = {};
    
    if (KIU_STATE.probationStatus[userId]) {
        delete KIU_STATE.probationStatus[userId];
    } else {
        KIU_STATE.probationStatus[userId] = true;
    }
    saveState();
    
    // Refresh modal
    if (typeof renderProfile === 'function') {
        renderProfile('student', userId, sessionStorage.getItem('pv_fac'));
    }
}

function applyHoldForUser(userId, amount) {
    if (getCurrentUser()?.role !== USER_ROLES.ADMIN) return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    
    if (!KIU_STATE.tuitionBalances) KIU_STATE.tuitionBalances = {};
    KIU_STATE.tuitionBalances[userId] = (KIU_STATE.tuitionBalances[userId] || 0) + amt;
    saveState();
    
    if (typeof renderProfile === 'function') {
        renderProfile('student', userId, sessionStorage.getItem('pv_fac'));
    }
}

function applyScholarshipForUser(userId, amount) {
    if (getCurrentUser()?.role !== USER_ROLES.ADMIN) return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    
    if (!KIU_STATE.tuitionBalances) KIU_STATE.tuitionBalances = {};
    KIU_STATE.tuitionBalances[userId] = Math.max(0, (KIU_STATE.tuitionBalances[userId] || 0) - amt);
    saveState();
    
    if (typeof renderProfile === 'function') {
        renderProfile('student', userId, sessionStorage.getItem('pv_fac'));
    }
}

function generateTranscriptForUser(userId) {
    const debt = (KIU_STATE.tuitionBalances && KIU_STATE.tuitionBalances[userId]) || 0;
    if (debt > 0) {
        alert(`ACCESS DENIED: Student ${userId} has an active Financial Hold. Outstanding Balance: ${debt} GEL.`);
        return;
    }
    
    let transcriptData = [];
    let studentName = "Unknown Student";
    Object.keys(KIU_STATE.studentGrades || {}).forEach(courseKey => {
        let roster = KIU_STATE.studentGrades[courseKey] || [];
        let st = roster.find(x => x.id === userId);
        if(st) {
            studentName = st.name;
            transcriptData.push({
                course: courseKey.toUpperCase(),
                final: st.final || 0,
                letter: st.letter || 'F'
            });
        }
    });
    
    if(transcriptData.length === 0) {
        alert("No academic records found for ID: " + userId);
        return;
    }
    
    let html = `
        <html><head><title>Official Transcript - ${userId}</title>
        <style>body{font-family:Arial; padding:40px; color:#333;} table{width:100%; border-collapse:collapse; margin-top:20px;} th,td{border:1px solid #ddd; padding:10px; text-align:left;} th{background:#f4f4f4;} .header{text-align:center; margin-bottom:40px;} .stamp{color:red; border:3px solid red; display:inline-block; padding:10px; font-weight:bold; transform:rotate(-15deg); margin-top:30px;}</style>
        </head><body>
        <div class="header">
            <h2>KUTAISI INTERNATIONAL UNIVERSITY</h2>
            <h3>OFFICIAL ACADEMIC TRANSCRIPT</h3>
            <p>Generated on: ${new Date().toISOString().split('T')[0]}</p>
        </div>
        <div style="margin-bottom:20px;">
            <strong>Student ID:</strong> ${userId}<br>
            <strong>Full Name:</strong> ${studentName}<br>
            <strong>Status:</strong> Active
        </div>
        <table>
            <tr><th>Course Code</th><th>Final Score (/100)</th><th>Letter Grade</th></tr>
    `;
    
    let totalScore = 0;
    transcriptData.forEach(dr => {
        totalScore += dr.final;
        html += `<tr><td>${dr.course}</td><td>${dr.final}</td><td><strong>${dr.letter}</strong></td></tr>`;
    });
    
    html += `</table>
        <div style="margin-top:20px;"><strong>Cumulative GPA Average:</strong> ${(totalScore / transcriptData.length).toFixed(2)} / 100.00</div>
        <div style="text-align:center;"><div class="stamp">OFFICIAL KIU REGISTRAR<br>VERIFIED COPY</div></div>
        <script>window.print();</script>
        </body></html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    const objectUrl = URL.createObjectURL(blob);
    const newWindow = window.open(objectUrl, '_blank');
    if (newWindow) {
        const revoke = () => URL.revokeObjectURL(objectUrl);
        newWindow.addEventListener('load', () => setTimeout(revoke, 0), { once: true });
    } else {
        URL.revokeObjectURL(objectUrl);
    }
}


