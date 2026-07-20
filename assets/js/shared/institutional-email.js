(function initInstitutionalEmailPolicy() {
    'use strict';

    const KIU_INSTITUTIONAL_EMAIL_DOMAIN = 'kiu.edu.ge';
    const KIU_LEGACY_STUDENT_EMAIL_DOMAIN = 'student.kiu.edu.ge';

    function normalizeInstitutionalLocalPart(institutionalId) {
        return String(institutionalId ?? '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9.-]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^[-.]+|[-.]+$/g, '');
    }

    function buildInstitutionalEmail(institutionalId) {
        const localPart = normalizeInstitutionalLocalPart(institutionalId);
        if (!localPart) return '';
        return `${localPart}@${KIU_INSTITUTIONAL_EMAIL_DOMAIN}`;
    }

    function normalizeInstitutionalEmail(email) {
        return String(email ?? '').trim().toLowerCase();
    }

    function isInstitutionalEmail(email) {
        const normalized = normalizeInstitutionalEmail(email);
        if (!normalized || !normalized.includes('@')) return false;
        return normalized.endsWith(`@${KIU_INSTITUTIONAL_EMAIL_DOMAIN}`)
            || normalized.endsWith(`@${KIU_LEGACY_STUDENT_EMAIL_DOMAIN}`);
    }

    function isLegacyInstitutionalEmail(email) {
        const normalized = normalizeInstitutionalEmail(email);
        return Boolean(normalized && normalized.endsWith(`@${KIU_LEGACY_STUDENT_EMAIL_DOMAIN}`));
    }

    function resolveRegistrationEmail(options = {}) {
        const manualEmail = String(options.institutionalEmail || options.email || options.existingEmail || '').trim();
        if (manualEmail) return manualEmail;
        const institutionalId = String(options.institutionalId || '').trim();
        return institutionalId ? buildInstitutionalEmail(institutionalId) : '';
    }

    function findDuplicateEmailUser(users = [], email, editingId = '') {
        const normalized = normalizeInstitutionalEmail(email);
        if (!normalized) return null;
        return users.find((user) => {
            if (!user) return false;
            if (String(user.id || '') === String(editingId || '')) return false;
            return normalizeInstitutionalEmail(user.email) === normalized;
        }) || null;
    }

    function migrateInstitutionalEmailRecord(record = {}, nextEmail = '') {
        const oldEmail = normalizeInstitutionalEmail(record.email);
        const canonicalEmail = normalizeInstitutionalEmail(nextEmail);
        if (!canonicalEmail) return { ...record };
        const next = { ...record, email: canonicalEmail };
        if (!oldEmail || oldEmail === canonicalEmail || !isLegacyInstitutionalEmail(oldEmail)) {
            return next;
        }
        const aliases = Array.isArray(record.emailAliases) ? record.emailAliases.slice() : [];
        if (!aliases.some((alias) => normalizeInstitutionalEmail(alias) === oldEmail)) {
            aliases.push(oldEmail);
        }
        next.emailAliases = aliases;
        return next;
    }

    window.KIU_INSTITUTIONAL_EMAIL_DOMAIN = KIU_INSTITUTIONAL_EMAIL_DOMAIN;
    window.KIU_LEGACY_STUDENT_EMAIL_DOMAIN = KIU_LEGACY_STUDENT_EMAIL_DOMAIN;
    window.normalizeInstitutionalLocalPart = normalizeInstitutionalLocalPart;
    window.buildInstitutionalEmail = buildInstitutionalEmail;
    window.normalizeInstitutionalEmail = normalizeInstitutionalEmail;
    window.isInstitutionalEmail = isInstitutionalEmail;
    window.isLegacyInstitutionalEmail = isLegacyInstitutionalEmail;
    window.resolveRegistrationEmail = resolveRegistrationEmail;
    window.findDuplicateEmailUser = findDuplicateEmailUser;
    window.migrateInstitutionalEmailRecord = migrateInstitutionalEmailRecord;
})();
