const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let cachedServiceAccount = null;
let cachedAccessToken = null;

function readServiceAccount() {
    if (cachedServiceAccount) return cachedServiceAccount;
    const inline = String(process.env.KIU_FIREBASE_SERVICE_ACCOUNT_JSON || '').trim();
    const filePath = String(process.env.KIU_FIREBASE_SERVICE_ACCOUNT_FILE || '').trim();
    if (!inline && !filePath) return null;
    try {
        const raw = inline || fs.readFileSync(path.resolve(filePath), 'utf8');
        const parsed = JSON.parse(raw);
        if (!parsed.project_id || !parsed.client_email || !parsed.private_key) return null;
        cachedServiceAccount = parsed;
        return cachedServiceAccount;
    } catch (error) {
        return null;
    }
}

function base64Url(value) {
    return Buffer.from(value)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
}

async function getAccessToken(account) {
    if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60000) {
        return cachedAccessToken.value;
    }
    const now = Math.floor(Date.now() / 1000);
    const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const claim = base64Url(JSON.stringify({
        iss: account.client_email,
        scope: 'https://www.googleapis.com/auth/firebase.messaging',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600
    }));
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(`${header}.${claim}`);
    signer.end();
    const assertion = `${header}.${claim}.${base64Url(signer.sign(account.private_key))}`;
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion
        })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.access_token) {
        throw new Error('Firebase OAuth token request failed.');
    }
    cachedAccessToken = {
        value: payload.access_token,
        expiresAt: Date.now() + (Number(payload.expires_in || 3600) * 1000)
    };
    return cachedAccessToken.value;
}

function notificationData(notification, buildUrl) {
    return {
        notificationId: String(notification?.id || '').trim(),
        title: String(notification?.title || 'KIU update').trim() || 'KIU update',
        body: String(notification?.body || '').trim(),
        tag: String(notification?.type || notification?.sourceDomain || 'kiu-update').trim() || 'kiu-update',
        url: buildUrl(notification?.routePage, notification?.routeData || {})
    };
}

async function sendFirebaseNotification(userId, notification, store, buildUrl) {
    const account = readServiceAccount();
    if (!account || !store?.listMobilePushTokens) return;
    const tokens = store.listMobilePushTokens(userId);
    if (!tokens.length) return;
    const accessToken = await getAccessToken(account);
    const projectId = String(process.env.KIU_FIREBASE_PROJECT_ID || account.project_id).trim();
    if (!projectId) return;
    const data = notificationData(notification, buildUrl);
    const endpoint = `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/messages:send`;
    const sendOne = async (item) => {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: {
                    token: item.token,
                    data,
                    android: { priority: 'high' }
                }
            })
        });
        const payload = await response.json().catch(() => ({}));
        const errorCode = payload?.error?.details?.find(detail => detail?.errorCode)?.errorCode || '';
        if (!response.ok && ['UNREGISTERED', 'INVALID_ARGUMENT'].includes(errorCode)) {
            store.removeMobilePushToken(userId, item.token);
        }
    };
    for (let index = 0; index < tokens.length; index += 20) {
        await Promise.all(tokens.slice(index, index + 20).map(sendOne));
    }
}

module.exports = {
    sendFirebaseNotification
};
