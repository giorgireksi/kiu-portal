function renderPersonalDataIdentitySection(user, facultyProfile) {
    const nameEl = document.getElementById('personal-data-name');
    const statusEl = document.getElementById('personal-data-status');
    const programEl = document.getElementById('personal-data-program');
    const levelHeadingEl = document.getElementById('personal-data-level-heading');
    const avatarEl = document.getElementById('personal-data-avatar');

    if (nameEl) {
        const displayName = user?.nameEn || user?.name || 'Portal User';
        const parts = displayName.split(/\s+/);
        nameEl.innerHTML = parts.length > 1 ? `${parts[0]}<br>${parts.slice(1).join(' ')}` : displayName;
    }
    if (statusEl) statusEl.textContent = user?.status || 'Active';
    if (programEl) programEl.textContent = getProgramLabelForUser(user, facultyProfile);
    if (levelHeadingEl) levelHeadingEl.textContent = getAcademicLevelLabel(user);

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

function normalizePersonalDataRole(role) {
    return String(role || '').trim().toLowerCase();
}

function isStudentPersonalDataUser(user) {
    const studentRole = typeof USER_ROLES !== 'undefined' && USER_ROLES?.STUDENT
        ? USER_ROLES.STUDENT
        : 'student';
    return normalizePersonalDataRole(user?.role) === studentRole;
}

function getPersonalDataRoleLabel(user) {
    const role = normalizePersonalDataRole(user?.role);
    if (role === 'professor') return 'Professor';
    if (role === 'ta') return 'Teaching Assistant';
    if (role === 'student_service') return 'Student Service';
    if (role === 'student') return getAcademicLevelLabel(user);
    return 'Portal Member';
}

function resolvePersonalDataBlueprintDomain(user) {
    return isStudentPersonalDataUser(user) ? 'student' : 'staff';
}

function resolvePersonalDataBlueprintTypeId(user) {
    const role = normalizePersonalDataRole(user?.role);
    if (isStudentPersonalDataUser(user)) {
        if (typeof resolveStudentTypeId === 'function') return resolveStudentTypeId();
        if (typeof STUDENT_TYPE_ID !== 'undefined') return STUDENT_TYPE_ID;
        return 'student';
    }
    if (typeof resolveFormTypeIdForDomainRole === 'function') {
        return resolveFormTypeIdForDomainRole('staff', role);
    }
    if (typeof resolveStaffTypeIdFromPlatformRole === 'function') {
        return resolveStaffTypeIdFromPlatformRole(role);
    }
    return role || 'professor';
}

function getPersonalDataBlueprintSchema(user) {
    const domain = resolvePersonalDataBlueprintDomain(user);
    const typeId = resolvePersonalDataBlueprintTypeId(user);
    if (typeof getFormSchemaForDomain === 'function') {
        return getFormSchemaForDomain(domain, typeId) || { sections: [] };
    }
    if (domain === 'student' && typeof getStudentFormSchema === 'function') {
        return getStudentFormSchema(typeId) || { sections: [] };
    }
    if (domain === 'staff' && typeof getStaffFormSchema === 'function') {
        return getStaffFormSchema(typeId) || { sections: [] };
    }
    return { sections: [] };
}

function getPersonalDataLegacyFieldAlias(user, key) {
    const domain = resolvePersonalDataBlueprintDomain(user);
    if (typeof getLegacyFieldAliasForDomain === 'function') {
        return getLegacyFieldAliasForDomain(domain, key);
    }
    return typeof getLegacyFieldAlias === 'function' ? getLegacyFieldAlias(key) : null;
}

function collectPersonalDataContext(user) {
    if (!isStudentPersonalDataUser(user)) {
        const summary = typeof getUserPerformanceSummary === 'function'
            ? getUserPerformanceSummary(user)
            : { primary: '-', secondary: '-', tertiary: '-', quaternary: '-' };
        return { kind: 'staff', summary, snapshot: null };
    }
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
    return { kind: 'student', summary, snapshot };
}

function setPersonalDataText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? '-';
}

function setPersonalDataHtml(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value ?? '-';
}

function renderPersonalDataChrome(user, context) {
    const isStudent = context.kind === 'student';
    setPersonalDataText('personal-data-hero-title', isStudent ? 'Official Student Record' : 'Official Account Record');
    setPersonalDataHtml(
        'personal-data-overview-heading',
        `<i class="fas fa-chart-line"></i> ${isStudent ? 'Academic Snapshot' : 'Work Snapshot'}`
    );
    setPersonalDataText('personal-data-overview-copy', isStudent
        ? 'Current academic progress and standing at a glance.'
        : 'Current workload, profile coverage, and account standing at a glance.');
    setPersonalDataText('personal-data-details-copy', isStudent
        ? 'Fields your school chose to show from the student form blueprint.'
        : 'Fields your school chose to show from the staff form blueprint.');
    setPersonalDataText('personal-data-level-heading', isStudent ? getAcademicLevelLabel(user) : getPersonalDataRoleLabel(user));
    setPersonalDataText('personal-data-kpi-label-primary', isStudent ? 'Semester' : 'Assignments');
    setPersonalDataText('personal-data-kpi-label-secondary', isStudent ? 'GPA' : 'Hours');
    setPersonalDataText('personal-data-kpi-label-tertiary', isStudent ? 'ECTS' : 'Subjects');
    setPersonalDataText('personal-data-kpi-label-quaternary', isStudent ? 'Standing' : 'Status');
    setPersonalDataText('personal-data-progress-title', 'Programme progress');

    const rail = document.getElementById('personal-data-rail');
    if (rail) rail.setAttribute('aria-label', isStudent ? 'Student profile' : 'Account profile');
    const identityCard = document.getElementById('personal-data-identity-card');
    if (identityCard) identityCard.setAttribute('aria-label', isStudent ? 'Student identity' : 'Account identity');
}

function renderPersonalDataSummarySection(user, context) {
    renderPersonalDataChrome(user, context);
    setPersonalDataText('personal-data-kpi-semester', context.summary.primary);
    setPersonalDataText('personal-data-kpi-gpa', context.summary.secondary);
    setPersonalDataText('personal-data-kpi-ects', context.summary.tertiary);
    setPersonalDataHtml('personal-data-kpi-average', context.summary.quaternary);

    const snapshot = context.snapshot;
    const progress = document.getElementById('personal-data-progress-block');
    if (progress) progress.hidden = !snapshot;
    if (snapshot) {
        const fill = document.getElementById('personal-data-progress-fill');
        const label = document.getElementById('personal-data-progress-label');
        if (fill) fill.style.width = `${Math.max(0, Math.min(100, snapshot.progressPercent || 0))}%`;
        if (label) label.textContent = `${snapshot.completedEcts} / ${snapshot.programRequiredEcts} ECTS`;
    } else {
        const fill = document.getElementById('personal-data-progress-fill');
        const label = document.getElementById('personal-data-progress-label');
        if (fill) fill.style.width = '0%';
        if (label) label.textContent = '-';
    }
}

function getPersonalDataBlueprintFieldValue(user, field) {
    const values = user?.fieldValues && typeof user.fieldValues === 'object' ? user.fieldValues : {};
    if (Object.prototype.hasOwnProperty.call(values, field.key)) {
        const raw = values[field.key];
        if (Array.isArray(raw)) return raw.join(', ');
        return raw ?? '';
    }
    const legacyKey = getPersonalDataLegacyFieldAlias(user, field.key);
    if (legacyKey && user && Object.prototype.hasOwnProperty.call(user, legacyKey)) {
        const legacyValue = user[legacyKey];
        if (Array.isArray(legacyValue)) return legacyValue.join(', ');
        return legacyValue ?? '';
    }
    if (user && Object.prototype.hasOwnProperty.call(user, field.key)) {
        const direct = user[field.key];
        if (Array.isArray(direct)) return direct.join(', ');
        return direct ?? '';
    }
    return '';
}

function formatPersonalDataBlueprintFieldDisplay(field, rawValue) {
    const text = String(rawValue ?? '').trim();
    if (!text) return '—';
    if (field.type === 'select') {
        const option = (field.options || []).find((item) => String(item.value) === text);
        return option?.label || text;
    }
    return text;
}

function collectPersonalDataBlueprintDetailFields(user) {
    const schema = getPersonalDataBlueprintSchema(user);
    const sections = (schema.sections || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const fields = [];
    sections.forEach((section) => {
        (section.fields || [])
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .forEach((field) => {
                if (field?.showOnPersonalData) fields.push(field);
            });
    });
    return fields;
}

function renderPersonalDataBlueprintDetails(user) {
    const root = document.getElementById('personal-data-blueprint-details-root');
    if (!root) return;
    const escape = typeof escapeHtml === 'function'
        ? escapeHtml
        : (value) => String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    const fields = collectPersonalDataBlueprintDetailFields(user);
    if (!fields.length) {
        root.innerHTML = '<p class="personal-data-blueprint-details-empty lux-card-copy">No profile details configured.</p>';
        return;
    }
    root.innerHTML = `
        <div class="personal-data-blueprint-details-grid">
            ${fields.map((field) => {
                const display = formatPersonalDataBlueprintFieldDisplay(field, getPersonalDataBlueprintFieldValue(user, field));
                const emptyClass = display === '—' ? ' is-empty' : '';
                return `
                    <div class="personal-data-blueprint-field lux-soft-chrome home-hover-chip" data-personal-data-field-key="${escape(field.key)}">
                        <span class="personal-data-blueprint-field-label">${escape(field.label)}</span>
                        <div class="personal-data-blueprint-field-value${emptyClass}">${escape(display)}</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderPersonalDataPageContext(user, facultyProfile) {
    if (!document.getElementById('page-personal-data')) return;
    const context = collectPersonalDataContext(user);
    renderPersonalDataIdentitySection(user, facultyProfile);
    renderPersonalDataSummarySection(user, context);
    renderPersonalDataBlueprintDetails(user);
}

async function initPersonalDataPageContext() {
    if (!document.getElementById('page-personal-data')) return;
    const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (!currentUser) return;
    const facultyProfile = typeof getFacultyProfile === 'function'
        ? getFacultyProfile(getCurrentFaculty())
        : null;
    if (isStudentPersonalDataUser(currentUser) && typeof hydrateStudentAcademicRecord === 'function') {
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