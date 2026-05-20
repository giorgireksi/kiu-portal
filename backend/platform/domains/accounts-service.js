const {
    buildPasswordHash,
    displayInitials,
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
        .map(account => this.sanitizeAccountForClient(account))
        .filter(Boolean)
        .filter(account => !idFilters.length || idFilters.includes(String(account.id || '').trim()))
        .filter(account => !facultyCode || account.facultyCode === facultyCode)
        .filter(account => !role || account.role === role)
        .filter(account => matchesSearch(account, search, ['id', 'email', 'displayName', 'name', 'nameEn', 'facultyCode', 'role']))
        .sort((a, b) => String(a.displayName || '').localeCompare(String(b.displayName || ''), undefined, { sensitivity: 'base' }));
    return paginate(items, filters);
}

function getAccountById(userId) {
    return this.sanitizeAccountForClient(this.state.accounts[String(userId || '').trim()]);
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

function upsertAccount(payload = {}) {
    const now = nowIso();
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
    const sanitized = sanitizeAccount(raw);
    if (!sanitized) return null;
    this.state.accounts[sanitized.id] = {
        ...(this.state.accounts[sanitized.id] || {}),
        ...sanitized,
        updatedAt: now
    };
    ensurePersonFromAccount.call(this, this.state.accounts[sanitized.id]);
    const credential = this.ensureCredential(sanitized.id);
    if (payload.password) {
        credential.passwordHash = buildPasswordHash(payload.password);
        credential.activationRequired = false;
        credential.temporaryPasswordHash = '';
        credential.mustChangePassword = false;
        credential.activatedAt = now;
        this.state.accounts[sanitized.id].activationRequired = false;
        this.state.accounts[sanitized.id].accountStatus = 'active';
    }
    if (payload.temporaryPassword) {
        credential.temporaryPasswordHash = buildPasswordHash(payload.temporaryPassword);
        credential.mustChangePassword = true;
        credential.activationRequired = false;
        this.state.accounts[sanitized.id].mustChangePassword = true;
        this.state.accounts[sanitized.id].accountStatus = 'active-temp-password';
    }
    this.save();
    return getAccountById.call(this, sanitized.id);
}

module.exports = {
    ensurePersonFromAccount,
    getAccountByEmail,
    getAccountById,
    listAccounts,
    upsertAccount
};
