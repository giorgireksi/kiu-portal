const crypto = require('crypto');
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

const DEFAULT_ACTIVATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function hashActivationToken(token) {
    return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

function isValidPassword(password) {
    return String(password || '').length >= 8;
}

function matchesActivationToken(candidate, storedHash) {
    const expected = Buffer.from(String(storedHash || ''), 'hex');
    const actual = Buffer.from(hashActivationToken(candidate), 'hex');
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

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
        resetTokens: [],
        activationTokens: []
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
        impersonatedUserId: '',
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

function issueActivationToken(userId, options = {}) {
    const accountId = String(userId || '').trim();
    const account = this.state.accounts[accountId];
    if (!account) return { error: 'Account not found.', status: 404 };
    const credential = ensureCredential.call(this, accountId);
    const accountPending = Boolean(
        account.activationRequired
        || credential.activationRequired
        || account.accountStatus === 'pending-activation'
    );
    if (!accountPending) return { error: 'Account is already active.', status: 409 };
    const token = crypto.randomBytes(32).toString('base64url');
    const expiresAt = new Date(
        Date.now() + Math.max(60 * 1000, Number(options.ttlMs || this.activationTokenTtlMs || DEFAULT_ACTIVATION_TOKEN_TTL_MS))
    ).toISOString();
    credential.activationTokens = asArray(credential.activationTokens)
        .filter(entry => new Date(entry?.expiresAt || 0).getTime() > Date.now());
    credential.activationTokens.push({
        tokenHash: hashActivationToken(token),
        expiresAt,
        createdAt: nowIso()
    });
    account.activationRequired = true;
    account.accountStatus = 'pending-activation';
    account.updatedAt = nowIso();
    this.save();
    return {
        token,
        expiresAt,
        account: this.getAccountById(accountId)
    };
}

function activateAccount(userId, newPassword, activationToken) {
    const accountId = String(userId || '').trim();
    const account = this.state.accounts[accountId];
    if (!account) return null;
    if (!isValidPassword(newPassword)) return null;
    const credential = ensureCredential.call(this, accountId);
    const normalizedToken = String(activationToken || '').trim();
    const accountPending = Boolean(
        account.activationRequired
        || credential.activationRequired
        || account.accountStatus === 'pending-activation'
    );
    if (!accountPending || !normalizedToken) return null;
    const activeToken = asArray(credential.activationTokens).find(entry =>
        new Date(entry?.expiresAt || 0).getTime() > Date.now()
        && matchesActivationToken(normalizedToken, entry?.tokenHash)
    );
    if (!activeToken) return null;
    credential.passwordHash = buildPasswordHash(newPassword);
    credential.temporaryPasswordHash = '';
    credential.activationRequired = false;
    credential.mustChangePassword = false;
    credential.activatedAt = nowIso();
    credential.activationTokens = [];
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
    if (!normalizedToken || !isValidPassword(newPassword)) return null;
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

function changePassword(userId, currentPassword, newPassword) {
    const accountId = String(userId || '').trim();
    const account = this.state.accounts[accountId];
    if (!account) return { error: 'Account not found.', status: 404 };
    const next = String(newPassword || '');
    if (next.length < 8) return { error: 'New password must be at least 8 characters.', status: 400 };
    const credential = ensureCredential.call(this, accountId);
    const expectedValues = [credential.passwordHash, credential.temporaryPasswordHash].filter(Boolean);
    if (!expectedValues.length || !expectedValues.some(value => verifyPassword(String(currentPassword || ''), value))) {
        return { error: 'Current password is incorrect.', status: 400 };
    }
    credential.passwordHash = buildPasswordHash(next);
    credential.temporaryPasswordHash = '';
    credential.mustChangePassword = false;
    credential.activationRequired = false;
    account.mustChangePassword = false;
    account.updatedAt = nowIso();
    revokeSessionsForUser.call(this, accountId, 'credential-reset');
    this.save();
    return { account: this.getAccountById(accountId) };
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
    const account = this.state.accounts[String(session.userId || '').trim()];
    const currentRole = String(account?.role || '').trim().toLowerCase();
    const accountInactive = !account
        || account.accountStatus === 'disabled'
        || account.accountStatus === 'pending-activation'
        || account.activationRequired;
    const roleChanged = Boolean(
        currentRole
        && String(session.actualRole || '').trim().toLowerCase() !== currentRole
    );
    if (accountInactive) {
        revokeSessionsForUser.call(this, session.userId, 'account-state-changed');
        this.save();
        return null;
    }
    // Role changes are authoritative account updates. Refresh the existing
    // session in place instead of ejecting the user; this is especially
    // important when an account was provisioned with a stale role and then
    // repaired by the server mirror synchronizer.
    if (roleChanged) {
        session.actualRole = currentRole;
        session.faculty = account.facultyCode || account.faculty || '';
        session.impersonatedRole = '';
        session.impersonatedUserId = '';
        session.updatedAt = nowIso();
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
    this.state.sessions[normalized].impersonatedUserId = '';
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
        session.impersonatedUserId = '';
        session.revokedAt = nowIso();
        session.revocationReason = String(reason || 'revoked').trim() || 'revoked';
        session.updatedAt = session.revokedAt;
        revokedCount += 1;
    });
    return revokedCount;
}

const PORTAL_IMPERSONATION_ROLES = new Set(['student', 'professor', 'ta', 'student_service']);

function isPortalImpersonationRole(role) {
    const normalized = String(role || '').trim().toLowerCase();
    return PORTAL_IMPERSONATION_ROLES.has(normalized);
}

function isImpersonationPersonaEligible(account, impersonatedRole) {
    if (!account || typeof account !== 'object') return false;
    const personaRole = String(account.role || '').trim().toLowerCase();
    const targetRole = String(impersonatedRole || '').trim().toLowerCase();
    if (!targetRole || personaRole === targetRole) return true;
    const accountId = String(account.id || '').trim().toLowerCase();
    return accountId.startsWith('admin-testing-');
}

function updateSessionImpersonation(token, impersonatedRole, impersonatedUserId = '') {
    const normalized = String(token || '').trim();
    const session = this.state.sessions[normalized];
    if (!session || session.active === false) return null;
    if (String(session.actualRole || '').trim().toLowerCase() !== 'admin') return null;
    const nextRole = String(impersonatedRole || '').trim().toLowerCase();
    if (!nextRole) {
        session.impersonatedRole = '';
        session.impersonatedUserId = '';
        session.updatedAt = nowIso();
        session.lastSeenAt = nowIso();
        this.save();
        return clone(session);
    }
    if (!isPortalImpersonationRole(nextRole)) return null;
    const nextUserId = String(impersonatedUserId || '').trim();
    if (!nextUserId) return null;
    const persona = this.state.accounts[nextUserId];
    if (!persona) return null;
    if (!isImpersonationPersonaEligible(persona, nextRole)) return null;
    session.impersonatedRole = nextRole;
    session.impersonatedUserId = nextUserId;
    session.updatedAt = nowIso();
    session.lastSeenAt = nowIso();
    this.save();
    return clone(session);
}

function clearSessionImpersonation(token) {
    return updateSessionImpersonation.call(this, token, '', '');
}

module.exports = {
    PORTAL_IMPERSONATION_ROLES,
    activateAccount,
    clearSessionImpersonation,
    changePassword,
    createSessionByCredentials,
    createSessionByMicrosoftIdentity,
    createSessionForAccount,
    ensureCredential,
    getRawAccountByEmail,
    getRawAccountByMicrosoftOid,
    getSession,
    issueActivationToken,
    isImpersonationPersonaEligible,
    isPortalImpersonationRole,
    linkMicrosoftIdentityToAccount,
    logoutSession,
    requestPasswordReset,
    resetPassword,
    revokeSessionsForUser,
    updateSessionImpersonation,
    upgradeCredentialHashIfNeeded
};
