const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function nowIso() {
    return new Date().toISOString();
}

function clone(value) {
    try {
        return JSON.parse(JSON.stringify(value));
    } catch (error) {
        return {};
    }
}

function safeReadJson(filePath, fallback) {
    try {
        if (!fs.existsSync(filePath)) return clone(fallback);
        const raw = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(raw);
    } catch (error) {
        return clone(fallback);
    }
}

function writeJson(filePath, value) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
}

function makeId(prefix = 'id') {
    const token = crypto.randomBytes(8).toString('hex');
    return `${prefix}_${token}`;
}

function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
}

function normalizeCode(value) {
    return String(value || '').trim().toUpperCase();
}

function asArray(value) {
    return Array.isArray(value) ? value : [];
}

function uniqueStrings(values = []) {
    return [...new Set(asArray(values).map(value => String(value || '').trim()).filter(Boolean))];
}

function displayInitials(value) {
    const parts = String(value || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2);
    if (!parts.length) return 'KI';
    return parts.map(part => part.charAt(0).toUpperCase()).join('');
}

function buildPasswordHash(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(String(password || ''), salt, 64).toString('hex');
    return `scrypt$${salt}$${hash}`;
}

function isPasswordHash(value) {
    return String(value || '').startsWith('scrypt$');
}

function verifyPassword(password, stored) {
    const normalized = String(stored || '');
    if (!normalized) return false;
    if (!isPasswordHash(normalized)) {
        return String(password || '') === normalized;
    }
    const [, salt, hash] = normalized.split('$');
    if (!salt || !hash) return false;
    const candidate = crypto.scryptSync(String(password || ''), salt, 64);
    const expected = Buffer.from(hash, 'hex');
    if (candidate.length !== expected.length) return false;
    return crypto.timingSafeEqual(candidate, expected);
}

function parseDataUrl(dataUrl) {
    const raw = String(dataUrl || '').trim();
    const match = raw.match(/^data:([^;,]+)?(?:;charset=[^;,]+)?;base64,(.+)$/i);
    if (!match) return null;
    try {
        return {
            mimeType: String(match[1] || 'application/octet-stream').trim().toLowerCase(),
            buffer: Buffer.from(match[2], 'base64')
        };
    } catch (error) {
        return null;
    }
}

function deriveEncryptionKey(secret) {
    const normalized = String(secret || '').trim();
    if (!normalized) return null;
    return crypto.createHash('sha256').update(normalized).digest();
}

function encryptSecret(value, secret) {
    const plaintext = String(value || '');
    const key = deriveEncryptionKey(secret);
    if (!key || !plaintext) return '';
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join('.');
}

function decryptSecret(value, secret) {
    const raw = String(value || '').trim();
    const key = deriveEncryptionKey(secret);
    if (!key || !raw) return '';
    const [ivPart, tagPart, payloadPart] = raw.split('.');
    if (!ivPart || !tagPart || !payloadPart) return '';
    try {
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivPart, 'base64'));
        decipher.setAuthTag(Buffer.from(tagPart, 'base64'));
        const decrypted = Buffer.concat([
            decipher.update(Buffer.from(payloadPart, 'base64')),
            decipher.final()
        ]);
        return decrypted.toString('utf8');
    } catch (error) {
        return '';
    }
}

function sanitizeAccount(account) {
    if (!account || typeof account !== 'object') return null;
    const id = String(account.id || '').trim();
    const email = normalizeEmail(account.email || account.microsoftEmail);
    if (!id || !email) return null;
    const facultyCode = normalizeCode(account.facultyCode || account.faculty || '');
    const interests = Array.isArray(account.interests)
        ? uniqueStrings(account.interests.map(item => String(item || '').trim()).filter(Boolean))
        : uniqueStrings(String(account.interests || '').split(',').map(item => String(item || '').trim()).filter(Boolean));
    const grantedPrivileges = Array.isArray(account.grantedPrivileges)
        ? uniqueStrings(account.grantedPrivileges.map(item => String(item || '').trim()).filter(Boolean))
        : uniqueStrings(String(account.grantedPrivileges || '').split(',').map(item => String(item || '').trim()).filter(Boolean));
    return {
        id,
        email,
        name: String(account.name || '').trim(),
        nameEn: String(account.nameEn || account.name || '').trim(),
        displayName: String(account.displayName || account.nameEn || account.name || email).trim(),
        username: String(account.username || '').trim(),
        handle: String(account.handle || '').trim(),
        role: String(account.role || 'student').trim().toLowerCase() || 'student',
        faculty: facultyCode,
        facultyCode,
        semester: Number(account.semester || account.currentSemester || 0) || 0,
        program: String(account.program || account.programName || '').trim(),
        avatar: String(account.avatar || account.photo || displayInitials(account.displayName || account.nameEn || account.name || email)).trim(),
        photo: String(account.photo || account.avatar || displayInitials(account.displayName || account.nameEn || account.name || email)).trim(),
        bio: String(account.bio || '').trim(),
        location: String(account.location || '').trim(),
        website: String(account.website || '').trim(),
        birthday: String(account.birthday || '').trim(),
        interests,
        availability: String(account.availability || '').trim(),
        officeHours: String(account.officeHours || '').trim(),
        coverImage: String(account.coverImage || '').trim(),
        accountStatus: String(account.accountStatus || 'active').trim().toLowerCase(),
        activationRequired: Boolean(account.activationRequired || account.accountStatus === 'pending-activation'),
        mustChangePassword: Boolean(account.mustChangePassword),
        identityProvider: String(account.identityProvider || 'local').trim().toLowerCase(),
        microsoftOid: String(account.microsoftOid || '').trim(),
        microsoftTenantId: String(account.microsoftTenantId || '').trim(),
        microsoftEmail: normalizeEmail(account.microsoftEmail || ''),
        emailAliases: uniqueStrings((account.emailAliases || []).map(alias => normalizeEmail(alias))),
        isDemoAccount: Boolean(account.isDemoAccount),
        testingProfile: String(account.testingProfile || '').trim(),
        testingFaculty: normalizeCode(account.testingFaculty || facultyCode),
        grantedPrivileges,
        privilegeNotes: String(account.privilegeNotes || '').trim(),
        privilegeUpdatedBy: String(account.privilegeUpdatedBy || '').trim(),
        privilegeUpdatedAt: String(account.privilegeUpdatedAt || '').trim(),
        createdAt: String(account.createdAt || nowIso()),
        updatedAt: String(account.updatedAt || account.createdAt || nowIso())
    };
}

function isDemoOrTestingAccountId(id = '') {
    const normalized = String(id || '').trim().toLowerCase();
    if (!normalized) return false;
    if (normalized.startsWith('admin-testing-')) return true;
    if (normalized.startsWith('testing-')) return true;
    if (normalized.includes('-demo') || normalized.endsWith('-demo')) return true;
    return /^(econ|cs|law|med|arts)-(student|professor|ta|service)(-demo)?$/.test(normalized);
}

function isDemoOrTestingAccount(record = {}) {
    if (!record || typeof record !== 'object') return false;
    if (record.isDemoAccount) return true;
    if (record.isAdminTestingPersona) return true;
    return isDemoOrTestingAccountId(record.id || record.userId || record.studentId);
}

function paginate(items, { limit = 50, offset = 0 } = {}) {
    const safeLimit = Math.max(1, Math.min(200, Number(limit) || 50));
    const safeOffset = Math.max(0, Number(offset) || 0);
    return {
        items: items.slice(safeOffset, safeOffset + safeLimit),
        total: items.length,
        limit: safeLimit,
        offset: safeOffset
    };
}

function safeNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function matchesSearch(record, search, fields = []) {
    const query = String(search || '').trim().toLowerCase();
    if (!query) return true;
    const haystack = fields
        .map(field => String(record?.[field] || '').trim().toLowerCase())
        .filter(Boolean)
        .join(' ');
    return haystack.includes(query);
}

module.exports = {
    asArray,
    buildPasswordHash,
    clone,
    decryptSecret,
    displayInitials,
    encryptSecret,
    isDemoOrTestingAccount,
    isDemoOrTestingAccountId,
    isPasswordHash,
    makeId,
    matchesSearch,
    normalizeCode,
    normalizeEmail,
    nowIso,
    paginate,
    parseDataUrl,
    safeNumber,
    safeReadJson,
    sanitizeAccount,
    uniqueStrings,
    verifyPassword,
    writeJson
};
