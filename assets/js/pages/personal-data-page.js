function renderPersonalDataIdentitySection(user, facultyProfile) {
    const nameEl = document.getElementById('personal-data-name');
    const statusEl = document.getElementById('personal-data-status');
    const programEl = document.getElementById('personal-data-program');
    const idEl = document.getElementById('personal-data-id');
    const levelHeadingEl = document.getElementById('personal-data-level-heading');
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

    const setContact = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value && String(value).trim() ? value : '—';
    };
    setContact('personal-data-email', user?.email);
    setContact('personal-data-phone', user?.phone || user?.phoneNumber);
    setContact('personal-data-national-id', user?.nationalId || user?.personalNumber || user?.idNumber);
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

function collectPersonalDataContext(user) {
    const record = {
        id: user?.id,
        facultyCode: user?.facultyCode || user?.faculty || (typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON'),
        gpa: user?.gpa,
        semester: user?.semester
    };
    const snapshot = typeof loadStudentAcademicSnapshot === 'function'
        ? loadStudentAcademicSnapshot(record)
        : null;
    const summary = typeof getUserPerformanceSummary === 'function'
        ? getUserPerformanceSummary(user)
        : { primary: '-', secondary: '-', tertiary: '-', quaternary: '-' };
    if (snapshot) {
        summary.tertiary = String(snapshot.completedEcts);
        summary.secondary = snapshot.performance?.secondary || summary.secondary;
    }
    return { summary, snapshot };
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

    const snapshot = context.snapshot;
    if (snapshot) {
        const fill = document.getElementById('personal-data-progress-fill');
        const label = document.getElementById('personal-data-progress-label');
        if (fill) fill.style.width = `${Math.max(0, Math.min(100, snapshot.progressPercent || 0))}%`;
        if (label) label.textContent = `${snapshot.completedEcts} / ${snapshot.programRequiredEcts} ECTS`;
    }

    const recordStateEl = document.getElementById('personal-data-record-state');
    if (recordStateEl && user) {
        const preferredFaculty = user?.facultyCode || user?.faculty || (typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON');
        recordStateEl.textContent = typeof getStudentPersonalDataRecordLabel === 'function'
            ? getStudentPersonalDataRecordLabel(user, preferredFaculty)
            : (user?.status || 'Active');
    }
}

function renderPersonalDataSubjects(user, context) {
    if (typeof renderPersonalDataSubjectsSection !== 'function') return;
    renderPersonalDataSubjectsSection(user, {
        id: user?.id,
        facultyCode: user?.facultyCode || user?.faculty,
        gpa: user?.gpa,
        semester: user?.semester
    });
    void context;
}

function renderPersonalDataPageContext(user, facultyProfile) {
    if (!document.getElementById('page-personal-data')) return;
    const context = collectPersonalDataContext(user);
    renderPersonalDataIdentitySection(user, facultyProfile);
    renderPersonalDataSummarySection(user, context);
    renderPersonalDataSubjects(user, context);
}

async function initPersonalDataPageContext() {
    if (!document.getElementById('page-personal-data')) return;
    const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (!currentUser) return;
    const facultyProfile = typeof getFacultyProfile === 'function'
        ? getFacultyProfile(getCurrentFaculty())
        : null;
    if (typeof hydrateStudentAcademicRecord === 'function') {
        try {
            await hydrateStudentAcademicRecord(currentUser.id, {
                id: currentUser.id,
                facultyCode: currentUser.facultyCode || currentUser.faculty,
                gpa: currentUser.gpa,
                semester: currentUser.semester
            });
        } catch (_) {
            // Local state fallback.
        }
    }
    renderPersonalDataPageContext(currentUser, facultyProfile);
    setupPersonalDataPasswordForm();
}

function setupPersonalDataPasswordForm() {
    const form = document.getElementById('personal-data-password-form');
    if (!form || form.dataset.bound === '1') return;
    form.dataset.bound = '1';
    const msg = document.getElementById('personal-data-password-msg');
    const setMsg = (text, ok) => {
        if (!msg) return;
        msg.textContent = text;
        msg.className = `pd-password-msg${ok ? ' is-ok' : (text ? ' is-error' : '')}`;
    };
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const data = new FormData(form);
        const currentPassword = String(data.get('currentPassword') || '');
        const newPassword = String(data.get('newPassword') || '');
        const confirmPassword = String(data.get('confirmPassword') || '');
        if (newPassword.length < 8) return setMsg('New password must be at least 8 characters.', false);
        if (newPassword !== confirmPassword) return setMsg('New passwords do not match.', false);
        if (typeof kiuPortalFetch !== 'function') return setMsg('Password service is unavailable in this mode.', false);
        const button = form.querySelector('button[type="submit"]');
        if (button) button.disabled = true;
        setMsg('Saving…', true);
        try {
            await kiuPortalFetch('/api/auth/change-password', {
                method: 'POST',
                body: JSON.stringify({ currentPassword, newPassword })
            });
            form.reset();
            setMsg('Password updated.', true);
        } catch (error) {
            setMsg(error?.message || 'Could not change password.', false);
        } finally {
            if (button) button.disabled = false;
        }
    });
}

window.renderPersonalDataPageContext = renderPersonalDataPageContext;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initPersonalDataPageContext();
    }, { once: true });
} else {
    initPersonalDataPageContext();
}