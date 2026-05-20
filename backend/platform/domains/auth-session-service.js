const {
    asArray,
    buildPasswordHash,
    clone,
    isPasswordHash,
    makeId,
    normalizeEmail,
    nowIso,
    uniqueStrings,
    verifyPassword
} = require('../utils');

function ensureCredential(userId) {
    const key = String(userId || '').trim();
    if (!key) return null;
    this.state.authCredentials[key] = this.state.authCredentials[key] || {
        userId: key,
        passwordHash: '',
        temporaryPasswordHash: '',
        mustChangePassword: false,
        activationRequired: true,
        activatedAt: '',
        resetTokens: []
    };
    return this.state.authCredentials[key];
}

function upgradeCredentialHashIfNeeded(userId, password) {
    const credential = ensureCredential.call(this, userId);
    if (!credential) return false;
    let changed = false;
    if (credential.passwordHash && !isPasswordHash(credential.passwordHash) && verifyPassword(password, credential.passwordHash)) {
        credential.passwordHash = buildPasswordHash(password);
        changed = true;
    }
    if (credential.temporaryPasswordHash && !isPasswordHash(credential.temporaryPasswordHash) && verifyPassword(password, credential.temporaryPasswordHash)) {
        credential.temporaryPasswordHash = buildPasswordHash(password);
        changed = true;
    }
    if (changed) this.save();
    return changed;
}

function getRawAccountByEmail(email) {
    const target = normalizeEmail(email);
    return Object.values(this.state.accounts).find(item => {
        const aliases = uniqueStrings([item.email, item.microsoftEmail, ...(item.emailAliases || [])].map(value => normalizeEmail(value)));
        return aliases.includes(target);
    }) || null;
}

function getRawAccountByMicrosoftOid(oid, tenantId = '') {
    const normalizedOid = String(oid || '').trim();
    const normalizedTenantId = String(tenantId || '').trim();
    if (!normalizedOid) return null;
    return Object.values(this.state.accounts).find(item => {
        if (String(item?.microsoftOid || '').trim() !== normalizedOid) return false;
        if (!normalizedTenantId) return true;
        const accountTenantId = String(item?.microsoftTenantId || '').trim();
        return !accountTenantId || accountTenantId === normalizedTenantId;
    }) || null;
}

function linkMicrosoftIdentityToAccount(accountId, identity = {}) {
    const normalizedAccountId = String(accountId || '').trim();
    const account = this.state.accounts[normalizedAccountId];
    if (!account) return null;
    const microsoftOid = String(identity.oid || identity.microsoftOid || '').trim();
    const microsoftTenantId = String(identity.tenantId || identity.microsoftTenantId || '').trim();
    const microsoftEmail = normalizeEmail(identity.email || identity.microsoftEmail || identity.userPrincipalName || '');
    const aliases = uniqueStrings([
        ...(account.emailAliases || []),
        microsoftEmail,
        account.email,
        account.microsoftEmail
    ].map(value => normalizeEmail(value)));
    account.microsoftOid = microsoftOid || String(account.microsoftOid || '').trim();
    account.microsoftTenantId = microsoftTenantId || String(account.microsoftTenantId || '').trim();
    account.microsoftEmail = microsoftEmail || normalizeEmail(account.microsoftEmail || '');
    account.emailAliases = aliases;
    account.updatedAt = nowIso();
    this.ensurePersonFromAccount(account);
    this.save();
    return this.getAccountById(normalizedAccountId);
}

function createSessionForAccount(accountId, options = {}) {
    const normalizedAccountId = String(accountId || '').trim();
    const account = this.state.accounts[normalizedAccountId];
    if (!account) return { error: 'Account not found.', status: 404 };
    const credential = ensureCredential.call(this, account.id);
    if (account.activationRequired || credential.activationRequired || account.accountStatus === 'pending-activation') {
        return { error: 'Account is not activated yet.', status: 403 };
    }
    if (account.accountStatus === 'disabled') {
        return { error: 'Account is disabled.', status: 403 };
    }
    const token = makeId('session');
    const session = {
        token,
        userId: account.id,
        actualRole: account.role,
        impersonatedRole: '',
        faculty: account.facultyCode || account.faculty || '',
        identityProvider: String(options.identityProvider || 'portal').trim().toLowerCase() || 'portal',
        createdAt: nowIso(),
        expiresAt: new Date(Date.now() + this.portalSessionTtlMs).toISOString(),
        updatedAt: nowIso(),
        lastSeenAt: nowIso(),
        active: true
    };
    this.state.sessions[token] = session;
    account.lastLoginAt = session.createdAt;
    account.identityProvider = session.identityProvider;
    account.updatedAt = session.updatedAt;
    this.addAuditEvent({
        actorUserId: account.id,
        actorRole: account.role,
        eventDomain: 'auth',
        eventType: 'session-created',
        entityType: 'portal_session',
        entityId: token,
        afterState: {
            userId: account.id,
            identityProvider: session.identityProvider,
            actualRole: session.actualRole,
            faculty: session.faculty
        }
    });
    this.save();
    return {
        session: clone(session),
        account: this.getAccountById(account.id)
    };
}

function createSessionByMicrosoftIdentity(identity = {}) {
    const microsoftOid = String(identity.oid || identity.microsoftOid || '').trim();
    const microsoftTenantId = String(identity.tenantId || identity.microsoftTenantId || '').trim();
    const normalizedEmail = normalizeEmail(identity.email || identity.microsoftEmail || identity.userPrincipalName || '');
    const account = getRawAccountByMicrosoftOid.call(this, microsoftOid, microsoftTenantId)
        || getRawAccountByEmail.call(this, normalizedEmail);
    if (!account) {
        return {
            error: 'Microsoft account is not linked to a portal profile.',
            status: 404,
            reason: 'unlinked'
        };
    }
    linkMicrosoftIdentityToAccount.call(this, account.id, {
        oid: microsoftOid,
        tenantId: microsoftTenantId,
        email: normalizedEmail
    });
    return createSessionForAccount.call(this, account.id, { identityProvider: 'microsoft' });
}

function activateAccount(userId, newPassword) {
    const accountId = String(userId || '').trim();
    const account = this.state.accounts[accountId];
    if (!account) return null;
    const credential = ensureCredential.call(this, accountId);
    credential.passwordHash = buildPasswordHash(newPassword);
    credential.temporaryPasswordHash = '';
    credential.activationRequired = false;
    credential.mustChangePassword = false;
    credential.activatedAt = nowIso();
    account.activationRequired = false;
    account.mustChangePassword = false;
    account.accountStatus = 'active';
    account.updatedAt = nowIso();
    revokeSessionsForUser.call(this, accountId, 'credential-reset');
    this.save();
    return this.getAccountById(accountId);
}

function requestPasswordReset(email) {
    const account = getRawAccountByEmail.call(this, email);
    if (!account) return null;
    const credential = ensureCredential.call(this, account.id);
    const token = makeId('reset');
    const expiresAt = new Date(Date.now() + (1000 * 60 * 30)).toISOString();
    credential.resetTokens = asArray(credential.resetTokens).filter(entry => new Date(entry?.expiresAt || 0).getTime() > Date.now());
    credential.resetTokens.push({ token, expiresAt, createdAt: nowIso() });
    this.save();
    return {
        token,
        expiresAt,
        account: this.getAccountById(account.id)
    };
}

function resetPassword(token, newPassword) {
    const normalizedToken = String(token || '').trim();
    if (!normalizedToken) return null;
    const entry = Object.entries(this.state.authCredentials).find(([, credential]) =>
        asArray(credential?.resetTokens).some(item => String(item?.token || '') === normalizedToken && new Date(item?.expiresAt || 0).getTime() > Date.now())
    );
    if (!entry) return null;
    const [userId, credential] = entry;
    credential.passwordHash = buildPasswordHash(newPassword);
    credential.temporaryPasswordHash = '';
    credential.mustChangePassword = false;
    credential.activationRequired = false;
    credential.activatedAt = nowIso();
    credential.resetTokens = [];
    if (this.state.accounts[userId]) {
        this.state.accounts[userId].accountStatus = 'active';
        this.state.accounts[userId].activationRequired = false;
        this.state.accounts[userId].mustChangePassword = false;
        this.state.accounts[userId].updatedAt = nowIso();
    }
    revokeSessionsForUser.call(this, userId, 'credential-reset');
    this.save();
    return this.getAccountById(userId);
}

function createSessionByCredentials(email, password) {
    const account = getRawAccountByEmail.call(this, email);
    if (!account) return { error: 'Account not found.', status: 404 };
    const credential = ensureCredential.call(this, account.id);
    const expectedValues = [credential.passwordHash, credential.temporaryPasswordHash].filter(Boolean);
    const valid = expectedValues.some(value => verifyPassword(password, value));
    if (!valid) return { error: 'Incorrect password.', status: 401 };
    upgradeCredentialHashIfNeeded.call(this, account.id, password);
    return createSessionForAccount.call(this, account.id, { identityProvider: 'portal' });
}

function getSession(token) {
    const session = this.state.sessions[String(token || '').trim()];
    if (!session || session.active === false) return null;
    if (session.expiresAt && new Date(session.expiresAt).getTime() <= Date.now()) {
        session.active = false;
        session.revokedAt = nowIso();
        session.revocationReason = 'expired';
        session.updatedAt = session.revokedAt;
        this.save();
        return null;
    }
    session.updatedAt = nowIso();
    session.lastSeenAt = nowIso();
    this.save();
    return clone(session);
}

function logoutSession(token) {
    const normalized = String(token || '').trim();
    if (!normalized || !this.state.sessions[normalized]) return false;
    this.state.sessions[normalized].active = false;
    this.state.sessions[normalized].impersonatedRole = '';
    this.state.sessions[normalized].updatedAt = nowIso();
    this.state.sessions[normalized].lastSeenAt = nowIso();
    this.save();
    return true;
}

function revokeSessionsForUser(userId, reason = 'revoked') {
    const normalizedUserId = String(userId || '').trim();
    if (!normalizedUserId) return 0;
    let revokedCount = 0;
    Object.values(this.state.sessions || {}).forEach((session) => {
        if (!session || session.active === false) return;
        if (String(session.userId || '').trim() !== normalizedUserId) return;
        session.active = false;
        session.impersonatedRole = '';
        session.revokedAt = nowIso();
        session.revocationReason = String(reason || 'revoked').trim() || 'revoked';
        session.updatedAt = session.revokedAt;
        revokedCount += 1;
    });
    return revokedCount;
}

function updateSessionImpersonation(token, impersonatedRole) {
    const normalized = String(token || '').trim();
    const session = this.state.sessions[normalized];
    if (!session || session.active === false) return null;
    if (String(session.actualRole || '').trim().toLowerCase() !== 'admin') return null;
    session.impersonatedRole = String(impersonatedRole || '').trim().toLowerCase();
    session.updatedAt = nowIso();
    session.lastSeenAt = nowIso();
    this.save();
    return clone(session);
}

function clearSessionImpersonation(token) {
    return updateSessionImpersonation.call(this, token, '');
}

module.exports = {
    activateAccount,
    clearSessionImpersonation,
    createSessionByCredentials,
    createSessionByMicrosoftIdentity,
    createSessionForAccount,
    ensureCredential,
    getRawAccountByEmail,
    getRawAccountByMicrosoftOid,
    getSession,
    linkMicrosoftIdentityToAccount,
    logoutSession,
    requestPasswordReset,
    resetPassword,
    revokeSessionsForUser,
    updateSessionImpersonation,
    upgradeCredentialHashIfNeeded
};
