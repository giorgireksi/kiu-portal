function makeTokenId(userId, token) {
    return Buffer.from(`${String(userId || '').trim()}:${String(token || '').trim()}`)
        .toString('base64')
        .replace(/[^a-z0-9]+/gi, '')
        .slice(0, 96) || `mobile-${Date.now()}`;
}

function upsertMobilePushToken(userId, token, metadata = {}) {
    const normalizedUserId = String(userId || '').trim();
    const normalizedToken = String(token || '').trim();
    if (!normalizedUserId || normalizedToken.length < 20 || normalizedToken.length > 4096) return null;
    const id = makeTokenId(normalizedUserId, normalizedToken);
    this.state.mobilePushTokens[id] = {
        id,
        userId: normalizedUserId,
        token: normalizedToken,
        platform: String(metadata.platform || 'android').trim().toLowerCase() || 'android',
        appVersion: String(metadata.appVersion || '').trim(),
        deviceModel: String(metadata.deviceModel || '').trim(),
        createdAt: String(this.state.mobilePushTokens[id]?.createdAt || new Date().toISOString()),
        updatedAt: new Date().toISOString()
    };
    this.save();
    return { ...this.state.mobilePushTokens[id] };
}

function listMobilePushTokens(userId = '') {
    const normalizedUserId = String(userId || '').trim();
    return Object.values(this.state.mobilePushTokens || {})
        .filter(item => !normalizedUserId || String(item.userId || '').trim() === normalizedUserId)
        .map(item => ({ ...item }));
}

function removeMobilePushToken(userId, token) {
    const normalizedUserId = String(userId || '').trim();
    const normalizedToken = String(token || '').trim();
    const match = Object.entries(this.state.mobilePushTokens || {}).find(([, item]) =>
        String(item?.userId || '').trim() === normalizedUserId
        && String(item?.token || '').trim() === normalizedToken
    );
    if (!match) return false;
    delete this.state.mobilePushTokens[match[0]];
    this.save();
    return true;
}

module.exports = {
    listMobilePushTokens,
    removeMobilePushToken,
    upsertMobilePushToken
};
