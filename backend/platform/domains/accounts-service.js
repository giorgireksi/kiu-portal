const {
    buildPasswordHash,
    displayInitials,
    isDemoOrTestingAccount,
    makeId,
    matchesSearch,
    normalizeCode,
    normalizeEmail,
    nowIso,
    paginate,
    sanitizeAccount,
    uniqueStrings
} = require('../utils');

function ensurePersonFromAccount(account) {
    this.state.people[account.id] = {
        ...(this.state.people[account.id] || {}),
        id: account.id,
        name: account.name,
        nameEn: account.nameEn,
        displayName: account.displayName,
        email: account.email,
        facultyCode: account.facultyCode,
        role: account.role,
        avatar: account.avatar,
        createdAt: this.state.people[account.id]?.createdAt || account.createdAt || nowIso(),
        updatedAt: nowIso()
    };
}

// Account authentication data and portal directory data are persisted in
// different buckets, but they describe the same person. Keep the shared portal
// identity mirrors current whenever an account is created or edited; otherwise
// the next login rehydrates an older name/faculty/role from portal.state.
function inferPortalStaffIdentity(state, account = {}) {
    const accountId = String(account?.id || '').trim();
    const directoryRecord = state?.portal?.state?.staffDirectoryRecords?.[accountId] || null;
    const staffTypeId = String(directoryRecord?.staffTypeId || '').trim().toLowerCase();
    const idMatch = accountId.match(/^(TA|PROF)-([A-Z0-9]+)-/i);
    const inferredRole = staffTypeId === 'ta' || idMatch?.[1]?.toUpperCase() === 'TA'
        ? 'ta'
        : staffTypeId === 'professor' || idMatch?.[1]?.toUpperCase() === 'PROF'
            ? 'professor'
            : '';
    const inferredFaculty = normalizeCode(
        directoryRecord?.facultyCode
        || (idMatch ? idMatch[2] : '')
        || account.facultyCode
        || account.faculty
        || '',
    );
    return {
        role: inferredRole,
        facultyCode: inferredFaculty
    };
}

function syncAccountToPortalState(account) {
    const portalState = this.state.portal?.state;
    if (!portalState || typeof portalState !== 'object') return;
    const accountId = String(account?.id || '').trim();
    if (!accountId) return;
    const inferredIdentity = inferPortalStaffIdentity(this.state, account);
    if (inferredIdentity.role) account.role = inferredIdentity.role;
    if (inferredIdentity.facultyCode) {
        account.facultyCode = inferredIdentity.facultyCode;
        account.faculty = inferredIdentity.facultyCode;
    }
    const existingPortalUser = Array.isArray(portalState.users)
        ? portalState.users.find((user) => String(user?.id || '').trim() === accountId)
        : null;
    const staffStore = portalState.staffDirectoryRecords && typeof portalState.staffDirectoryRecords === 'object'
        ? portalState.staffDirectoryRecords[accountId]
        : null;
    const studentStore = portalState.studentAdminProfiles && typeof portalState.studentAdminProfiles === 'object'
        ? portalState.studentAdminProfiles[accountId]
        : null;
    // Account status is authoritative. A stale portal mirror must never turn a
    // newly provisioned active account into a disabled account during startup
    // repair; explicit archive/disable operations update the account first and
    // are then mirrored back into the portal directories.
    const terminalArchived = ['disabled', 'archived'].includes(
        String(account.accountStatus || '').trim().toLowerCase()
    );
    if (terminalArchived && String(account.accountStatus || '').trim().toLowerCase() !== 'disabled') {
        account.accountStatus = 'disabled';
        account.activationRequired = false;
    }
    const identity = {
        id: accountId,
        email: account.email,
        name: account.name,
        nameEn: account.nameEn,
        displayName: account.displayName,
        role: account.role,
        faculty: account.facultyCode,
        facultyCode: account.facultyCode,
        avatar: account.avatar,
        photo: account.photo,
        accountStatus: terminalArchived ? 'disabled' : account.accountStatus,
        status: terminalArchived ? 'Archived' : 'Active',
        updatedAt: account.updatedAt,
        createdAt: account.createdAt
    };
    portalState.users = Array.isArray(portalState.users) ? portalState.users : [];
    const userIndex = portalState.users.findIndex((user) => String(user?.id || '').trim() === accountId);
    if (userIndex >= 0) {
        portalState.users[userIndex] = { ...portalState.users[userIndex], ...identity };
    } else {
        portalState.users.push(identity);
    }

    if (staffStore && typeof staffStore === 'object') {
        Object.assign(staffStore, identity, { faculty: account.facultyCode });
    }
    if (studentStore && typeof studentStore === 'object') {
        studentStore.email = account.email;
        studentStore.name = account.name;
        studentStore.nameEn = account.nameEn;
        studentStore.faculty = account.facultyCode;
        studentStore.facultyCode = account.facultyCode;
        studentStore.accountStatus = account.accountStatus;
        studentStore.updatedAt = account.updatedAt;
    }

    const profiles = portalState.facultyProfiles && typeof portalState.facultyProfiles === 'object'
        ? portalState.facultyProfiles
        : null;
    if (!profiles) return;
    Object.values(profiles).forEach((profile) => {
        ['professors', 'tas', 'students'].forEach((bucket) => {
            if (Array.isArray(profile?.[bucket])) {
                profile[bucket] = profile[bucket].filter((member) => String(member?.id || '').trim() !== accountId);
            }
        });
    });
    const facultyCode = String(account.facultyCode || '').trim().toUpperCase();
    const bucket = account.role === 'professor' ? 'professors' : account.role === 'ta' ? 'tas' : account.role === 'student' ? 'students' : '';
    if (!facultyCode || !bucket || !profiles[facultyCode] || identity.status === 'Archived') return;
    profiles[facultyCode][bucket] = Array.isArray(profiles[facultyCode][bucket]) ? profiles[facultyCode][bucket] : [];
    profiles[facultyCode][bucket].push(identity);
}

function isActiveDirectoryRecord(record = null) {
    if (!record || typeof record !== 'object') return false;
    const statuses = [record.accountStatus, record.status]
        .map(value => String(value || '').trim().toLowerCase())
        .filter(Boolean);
    return !statuses.some(status => ['disabled', 'archived', 'suspended', 'inactive', 'deleted', 'testing'].includes(status));
}

function isSocialEligibleAccount(accountOrId = '') {
    const account = typeof accountOrId === 'string'
        ? this.state.accounts[String(accountOrId || '').trim()]
        : accountOrId;
    if (!account || typeof account !== 'object') return false;
    const sanitized = sanitizeAccount(account);
    if (!sanitized || isDemoOrTestingAccount(sanitized)) return false;
    if (String(sanitized.accountStatus || '').trim().toLowerCase() !== 'active') return false;
    const id = String(sanitized.id || '').trim();
    const role = String(sanitized.role || '').trim().toLowerCase();
    const portalState = this.state.portal?.state && typeof this.state.portal.state === 'object'
        ? this.state.portal.state
        : {};
    if (['professor', 'ta', 'student_service'].includes(role)) {
        return isActiveDirectoryRecord(portalState.staffDirectoryRecords?.[id]);
    }
    if (role === 'student') {
        return isActiveDirectoryRecord(portalState.studentAdminProfiles?.[id]);
    }
    return false;
}

function listSocialAccounts(filters = {}) {
    const facultyCode = normalizeCode(filters.facultyCode || filters.faculty || '');
    const role = String(filters.role || '').trim().toLowerCase();
    const search = String(filters.search || '').trim();
    const idFilters = uniqueStrings(
        (Array.isArray(filters.ids) ? filters.ids : String(filters.ids || '').split(','))
            .map(value => String(value || '').trim())
            .filter(Boolean)
    );
    const items = Object.values(this.state.accounts)
        .map(account => sanitizeAccount(account))
        .filter(account => isSocialEligibleAccount.call(this, account))
        .filter(account => !idFilters.length || idFilters.includes(String(account.id || '').trim()))
        .filter(account => !facultyCode || account.facultyCode === facultyCode)
        .filter(account => !role || account.role === role)
        .filter(account => matchesSearch(account, search, ['id', 'email', 'displayName', 'name', 'nameEn', 'facultyCode', 'role']))
        .sort((a, b) => String(a.displayName || '').localeCompare(String(b.displayName || ''), undefined, { sensitivity: 'base' }));
    const page = paginate(items, filters);
    return {
        ...page,
        items: page.items.map(account => this.sanitizeAccountForClient(this.state.accounts[account.id])).filter(Boolean)
    };
}

function listAccounts(filters = {}) {
    const facultyCode = normalizeCode(filters.facultyCode || filters.faculty || '');
    const role = String(filters.role || '').trim().toLowerCase();
    const search = String(filters.search || '').trim();
    const idFilters = uniqueStrings(
        (Array.isArray(filters.ids) ? filters.ids : String(filters.ids || '').split(','))
            .map(value => String(value || '').trim())
            .filter(Boolean)
    );
    const items = Object.values(this.state.accounts)
        .map(account => sanitizeAccount(account))
        .filter(Boolean)
        .filter(account => !idFilters.length || idFilters.includes(String(account.id || '').trim()))
        .filter(account => !facultyCode || account.facultyCode === facultyCode)
        .filter(account => !role || account.role === role)
        .filter(account => !isDemoOrTestingAccount(account) || (idFilters.length && idFilters.includes(String(account.id || '').trim())))
        .filter(account => matchesSearch(account, search, ['id', 'email', 'displayName', 'name', 'nameEn', 'facultyCode', 'role']))
        .sort((a, b) => String(a.displayName || '').localeCompare(String(b.displayName || ''), undefined, { sensitivity: 'base' }));
    const page = paginate(items, filters);
    return {
        ...page,
        items: page.items.map(account => this.sanitizeAccountForClient(this.state.accounts[account.id])).filter(Boolean)
    };
}

function getAccountById(userId, options = {}) {
    const sanitized = this.sanitizeAccountForClient(this.state.accounts[String(userId || '').trim()]);
    if (!sanitized) return null;
    if (options.allowDemo) return sanitized;
    if (isDemoOrTestingAccount(sanitized)) return null;
    return sanitized;
}

function getAccountByEmail(email) {
    const target = normalizeEmail(email);
    if (!target) return null;
    const account = Object.values(this.state.accounts).find(item => {
        const aliases = uniqueStrings([item.email, item.microsoftEmail, ...(item.emailAliases || [])].map(value => normalizeEmail(value)));
        return aliases.includes(target);
    });
    return this.sanitizeAccountForClient(account || null);
}

function upsertAccount(payload = {}, options = {}) {
    const now = nowIso();
    const existing = this.state.accounts[String(payload.id || '').trim()] || null;
    const raw = {
        ...payload,
        id: payload.id || makeId('user'),
        email: normalizeEmail(payload.email || ''),
        facultyCode: normalizeCode(payload.facultyCode || payload.faculty || ''),
        updatedAt: now
    };
    if (!raw.createdAt) raw.createdAt = now;
    if (!raw.displayName) raw.displayName = raw.nameEn || raw.name || raw.email;
    if (!raw.avatar && !raw.photo) raw.avatar = displayInitials(raw.displayName || raw.email);
    // A browser can still hold the pre-repair student role while logging in.
    // Normalize staff identity before comparing security-sensitive fields so
    // that stale client metadata cannot revoke the session just created.
    const inferredIdentity = inferPortalStaffIdentity(this.state, raw);
    if (inferredIdentity.role) raw.role = inferredIdentity.role;
    if (inferredIdentity.facultyCode) {
        raw.facultyCode = inferredIdentity.facultyCode;
        raw.faculty = inferredIdentity.facultyCode;
    }
    // Account status changes are explicit security operations. A stale browser
    // mirror must never disable an active account (or restore a terminal one)
    // during ordinary identity synchronization.
    const existingStatus = String(existing?.accountStatus || '').trim().toLowerCase();
    const incomingStatus = String(raw.accountStatus || '').trim().toLowerCase();
    if (existing && ['disabled', 'archived'].includes(existingStatus)) {
        raw.accountStatus = existing.accountStatus;
    } else if (existing && options.allowAccountStatusChange !== true && incomingStatus && incomingStatus !== existingStatus) {
        raw.accountStatus = existing.accountStatus;
    }
    const sanitized = sanitizeAccount(raw);
    if (!sanitized) return null;
    let securityChanged = Boolean(
        existing
        && (
            String(existing.role || '').trim().toLowerCase() !== sanitized.role
            || String(existing.accountStatus || '').trim().toLowerCase() !== sanitized.accountStatus
            || Boolean(existing.activationRequired) !== Boolean(sanitized.activationRequired)
            || JSON.stringify(existing.grantedPrivileges || []) !== JSON.stringify(sanitized.grantedPrivileges || [])
        )
    );
    this.state.accounts[sanitized.id] = {
        ...(this.state.accounts[sanitized.id] || {}),
        ...sanitized,
        updatedAt: now
    };
    ensurePersonFromAccount.call(this, this.state.accounts[sanitized.id]);
    const credential = this.ensureCredential(sanitized.id);
    if (payload.password) {
        securityChanged = true;
        credential.passwordHash = buildPasswordHash(payload.password);
        credential.activationRequired = false;
        credential.temporaryPasswordHash = '';
        credential.mustChangePassword = false;
        credential.activatedAt = now;
        this.state.accounts[sanitized.id].activationRequired = false;
        this.state.accounts[sanitized.id].accountStatus = 'active';
    }
    if (payload.temporaryPassword) {
        securityChanged = true;
        credential.temporaryPasswordHash = buildPasswordHash(payload.temporaryPassword);
        credential.mustChangePassword = true;
        credential.activationRequired = false;
        this.state.accounts[sanitized.id].mustChangePassword = true;
        this.state.accounts[sanitized.id].accountStatus = 'active-temp-password';
    }
    if (securityChanged && typeof this.revokeSessionsForUser === 'function') {
        this.revokeSessionsForUser(sanitized.id, 'account-security-changed');
    }
    syncAccountToPortalState.call(this, this.state.accounts[sanitized.id]);
    // Account writes must not rewrite the multi-megabyte audit namespace. The
    // targeted namespace save keeps login/profile propagation fast enough for
    // the portal-state acknowledgement and realtime refresh.
    if (typeof this.saveAccountIdentity === 'function') this.saveAccountIdentity();
    else this.save();
    return getAccountById.call(this, sanitized.id);
}

module.exports = {
    ensurePersonFromAccount,
    syncAccountToPortalState,
    getAccountByEmail,
    getAccountById,
    isSocialEligibleAccount,
    listAccounts,
    listSocialAccounts,
    upsertAccount
};
