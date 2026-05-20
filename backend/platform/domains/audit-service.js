const {
    clone,
    makeId,
    nowIso
} = require('../utils');

function addAuditEvent(payload = {}) {
    const event = {
        id: String(payload.id || makeId('audit')).trim(),
        actorUserId: String(payload.actorUserId || '').trim(),
        actorRole: String(payload.actorRole || '').trim(),
        eventDomain: String(payload.eventDomain || 'portal').trim(),
        eventType: String(payload.eventType || 'updated').trim(),
        entityType: String(payload.entityType || 'record').trim(),
        entityId: String(payload.entityId || '').trim(),
        beforeState: clone(payload.beforeState || null),
        afterState: clone(payload.afterState || null),
        sourceSystem: String(payload.sourceSystem || 'portal').trim(),
        requestId: String(payload.requestId || '').trim(),
        ipAddress: String(payload.ipAddress || '').trim(),
        createdAt: String(payload.createdAt || nowIso())
    };
    this.state.audit.events.unshift(event);
    const cutoff = Date.now() - (this.auditRetentionDays * 24 * 60 * 60 * 1000);
    this.state.audit.events = this.state.audit.events
        .filter(item => new Date(item.createdAt || 0).getTime() >= cutoff)
        .slice(0, 10000);
    this.save();
    return clone(event);
}

module.exports = {
    addAuditEvent
};
