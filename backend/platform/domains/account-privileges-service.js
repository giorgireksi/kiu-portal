const {
    asArray,
    clone,
    nowIso,
    uniqueStrings
} = require('../utils');

const PRIVILEGE_DEFINITIONS = [
    { id: 'manage_news', label: 'Manage News', description: 'Create, edit, publish, and archive university news.' },
    { id: 'moderate_news_replies', label: 'Moderate News Replies', description: 'Review private student replies on news posts.' },
    { id: 'manage_privileges', label: 'Manage Privileges', description: 'Grant or revoke delegated portal privileges for accounts.' },
    { id: 'manage_exam_templates', label: 'Manage Exam Templates', description: 'Create and edit exam templates beyond the default role scope.' },
    { id: 'manage_exam_schedule', label: 'Manage Exam Schedule', description: 'Publish, reschedule, and close exam sittings.' },
    { id: 'cross_faculty_exam_access', label: 'Cross-Faculty Exams', description: 'View exam templates, cohorts, and schedules across all faculties.' },
    { id: 'access_admin_tools', label: 'Access Admin Tools', description: 'Open the admin tools workspace.' },
    { id: 'access_admin_scheduler', label: 'Access Admin Scheduler', description: 'Open the master scheduling workspace.' },
    { id: 'access_staff_directory', label: 'Access Staff Directory', description: 'Open the staff management workspace.' },
    { id: 'access_student_directory', label: 'Access Student Directory', description: 'Open the student administration workspace.' }
];

function listPrivilegeDefinitions() {
    return clone(PRIVILEGE_DEFINITIONS);
}

function getGrantedAccountPrivileges(accountOrUserId) {
    const account = typeof accountOrUserId === 'object' && accountOrUserId
        ? accountOrUserId
        : this.state.accounts[String(accountOrUserId || '').trim()];
    return uniqueStrings(asArray(account?.grantedPrivileges).map(value => String(value || '').trim()).filter(Boolean));
}

function getEffectiveAccountPrivileges(accountOrUserId) {
    const account = typeof accountOrUserId === 'object' && accountOrUserId
        ? accountOrUserId
        : this.state.accounts[String(accountOrUserId || '').trim()];
    if (!account) return [];
    if (String(account.role || '').trim().toLowerCase() === 'admin') {
        return listPrivilegeDefinitions().map(item => item.id);
    }
    return getGrantedAccountPrivileges.call(this, account);
}

function accountHasPrivilege(accountOrUserId, privilegeId = '') {
    const normalizedPrivilegeId = String(privilegeId || '').trim();
    if (!normalizedPrivilegeId) return false;
    return getEffectiveAccountPrivileges.call(this, accountOrUserId).includes(normalizedPrivilegeId);
}

function updateAccountPrivileges(accountId, payload = {}, actorId = '') {
    const normalizedActorId = String(actorId || '').trim();
    if (!accountHasPrivilege.call(this, normalizedActorId, 'manage_privileges')) {
        return { error: 'Only administrators or delegated privilege managers may update privileges.', status: 403 };
    }
    const normalizedAccountId = String(accountId || '').trim();
    const account = this.state.accounts[normalizedAccountId];
    if (!account) return { error: 'Account was not found.', status: 404 };
    const privileges = uniqueStrings(asArray(payload.privileges).map(value => String(value || '').trim()).filter(Boolean));
    account.grantedPrivileges = privileges;
    account.privilegeNotes = String(payload.privilegeNotes || account.privilegeNotes || '').trim();
    account.privilegeUpdatedBy = normalizedActorId;
    account.privilegeUpdatedAt = nowIso();
    account.updatedAt = account.privilegeUpdatedAt;
    this.save();
    return this.getAccountById(normalizedAccountId);
}

module.exports = {
    accountHasPrivilege,
    getEffectiveAccountPrivileges,
    getGrantedAccountPrivileges,
    listPrivilegeDefinitions,
    updateAccountPrivileges
};
